use crate::engine::{Ledge,Settings,Winter};
use gtk::{prelude::*,cairo,gdk,glib};
use gtk_layer_shell::{Edge,Layer,LayerShell};
use std::{sync::{Arc,Mutex},time::{Duration,Instant}};
pub fn start(settings:Arc<Mutex<Settings>>) {
    let display=gdk::Display::default().expect("Graphical display required");
    if !gtk_layer_shell::is_supported() {eprintln!("Nightfall: desktop overlay requires a Wayland layer-shell compositor. Settings remain available.");return}
    for index in 0..display.n_monitors() {
        let monitor=display.monitor(index).unwrap();let geo=monitor.geometry();
        let win=gtk::Window::new(gtk::WindowType::Toplevel);
        win.set_title("Nightfall snow");win.set_app_paintable(true);
        if let Some(v)=gtk::prelude::WidgetExt::screen(&win).and_then(|s|s.rgba_visual()) {win.set_visual(Some(&v));}
        win.init_layer_shell();win.set_namespace("nightfall");win.set_monitor(&monitor);
        win.set_layer(Layer::Overlay);win.set_keyboard_mode(gtk_layer_shell::KeyboardMode::None);
        win.set_exclusive_zone(-1);
        for e in [Edge::Top,Edge::Bottom,Edge::Left,Edge::Right] {win.set_anchor(e,true)}
        win.connect_realize(|w|{if let Some(window)=w.window(){window.input_shape_combine_region(&cairo::Region::create(),0,0);}});
        let area=gtk::DrawingArea::new();win.add(&area);
        let winter=std::rc::Rc::new(std::cell::RefCell::new(Winter::new(geo.width() as f64,geo.height() as f64)));
        let model=winter.clone();let config=settings.clone();
        area.connect_draw(move|_,cr|{
            cr.set_operator(cairo::Operator::Source);cr.set_source_rgba(0.,0.,0.,0.);let _=cr.paint();cr.set_operator(cairo::Operator::Over);
            let m=model.borrow();let s=config.lock().unwrap();
            if !s.enabled {return glib::Propagation::Proceed}
            cr.set_source_rgba(0.96,0.98,1.,0.9);
            for f in &m.flakes {cr.arc(f.x,f.y,f.r,0.,std::f64::consts::TAU);let _=cr.fill();}
            for l in &m.ledges {
                cr.set_source_rgba(0.94,0.97,1.,0.97);
                cr.move_to(l.x,l.y+1.);
                for (i,h) in l.bank.iter().enumerate() {cr.line_to(l.x+i as f64*8.,l.y-h);}
                cr.line_to(l.x+l.width,l.y+1.);cr.close_path();let _=cr.fill();
                if s.icicles && l.id!="ground" {
                    for i in (3..l.bank.len()).step_by(11) {
                        let x=l.x+i as f64*8.;let length=(l.age/7.).min(18.)*(l.bank[i]/3.).min(1.);
                        cr.set_source_rgba(0.8,0.91,0.97,0.65);cr.move_to(x,l.y);cr.line_to(x+4.,l.y);cr.line_to(x+2.,l.y+length);cr.close_path();let _=cr.fill();
                    }
                }
            }
            if s.snowman {
                let x=m.width-70.;let y=m.height-5.;
                for (r,cy) in [(18.,y-18.),(14.,y-43.),(10.,y-64.)] {cr.set_source_rgb(0.94,0.97,1.);cr.arc(x,cy,r,0.,6.29);let _=cr.fill();}
                cr.set_source_rgb(0.7,0.19,0.24);cr.rectangle(x-14.,y-55.,28.,5.);let _=cr.fill();
                cr.set_source_rgb(0.13,0.23,0.24);cr.rectangle(x-14.,y-75.,28.,4.);cr.rectangle(x-9.,y-87.,18.,14.);let _=cr.fill();
                for dx in [-4.,4.] {cr.arc(x+dx,y-66.,1.5,0.,6.29);let _=cr.fill();}
                cr.set_source_rgb(0.96,0.46,0.13);cr.move_to(x,y-63.);cr.line_to(x+12.,y-61.);cr.line_to(x,y-59.);cr.close_path();let _=cr.fill();
            }
            if let Some(x)=m.plow_x {cr.set_source_rgb(0.86,0.47,0.15);cr.rectangle(x-20.,m.height-28.,40.,22.);let _=cr.fill();}
            glib::Propagation::Proceed
        });
        win.show_all();
        let mut last=Instant::now();let mut frames=0;
        let config=settings.clone();
        // Geometry discovery runs off the GTK thread. Bounded channel prevents query backlogs.
        let (tx,rx)=std::sync::mpsc::sync_channel(1);
        std::thread::spawn(move||loop {
            if let Some(surfaces)=surfaces(geo.x(),geo.y(),geo.width(),geo.height()) {
                match tx.try_send(surfaces) {Err(std::sync::mpsc::TrySendError::Disconnected(_))=>break,_=>{}}
            }
            std::thread::sleep(Duration::from_millis(500));
        });
        glib::timeout_add_local(Duration::from_millis(16),move||{
            frames+=1;let s=config.lock().unwrap().clone();
            if s.fps==30 && frames%2!=0 {return glib::ControlFlow::Continue}
            let now=Instant::now();let dt=now.duration_since(last).as_secs_f64();last=now;
            let mut m=winter.borrow_mut();
            if let Ok(surfaces)=rx.try_recv(){m.surfaces(surfaces)}
            m.step(dt,&s);drop(m);
            area.queue_draw();glib::ControlFlow::Continue
        });
    }
}
fn surfaces(ox:i32,oy:i32,width:i32,height:i32)->Option<Vec<Ledge>> {
    // hyprctl reads are isolated from rendering; no shell and no window contents.
    let read=|arg:&str|->Option<serde_json::Value>{
        let out=std::process::Command::new("hyprctl").args(["-j",arg]).output().ok()?;
        if !out.status.success(){return None}
        serde_json::from_slice(&out.stdout).ok()
    };
    let clients=read("clients")?;let monitors=read("monitors")?;
    let mut result=vec![];
    for c in clients.as_array()? {
        if c["hidden"].as_bool()==Some(true)||c["mapped"].as_bool()==Some(false){continue}
        let monitor=monitors.as_array()?.iter().find(|m|m["id"]==c["monitor"]);
        if c["pinned"].as_bool()!=Some(true) && monitor.map(|m|&m["activeWorkspace"]["id"])!=Some(&c["workspace"]["id"]){continue}
        let x=c["at"][0].as_f64()? - ox as f64;let y=c["at"][1].as_f64()? - oy as f64;
        let w=c["size"][0].as_f64()?;let left=x.max(0.);let right=(x+w).min(width as f64);
        if y>=0.&&y<height as f64&&right>left {result.push(Ledge::new(c["address"].as_str()?.into(),left,y,right-left));}
    }
    Some(result)
}
