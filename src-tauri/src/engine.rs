use rand::{rngs::SmallRng, Rng, SeedableRng};
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct Settings {
    pub enabled: bool,
    pub intensity: u8,
    pub wind: f64,
    pub accumulation: bool,
    pub icicles: bool,
    pub snowman: bool,
    pub plow: bool,
    pub fps: u8,
}
impl Default for Settings {
    fn default() -> Self { Self { enabled:true,intensity:1,wind:12.,accumulation:true,icicles:true,snowman:true,plow:true,fps:30 } }
}
impl Settings {
    pub fn validate(&mut self) {
        self.intensity=self.intensity.min(2);
        self.wind=if self.wind.is_finite() { self.wind.clamp(-80.,80.) } else { 12. };
        self.fps=if self.fps==60 {60} else {30};
    }
}
#[derive(Clone, Serialize)]
pub struct Flake { pub x:f64,pub y:f64,pub r:f64,pub speed:f64,pub phase:f64 }
#[derive(Clone, Serialize)]
pub struct Ledge {pub id:String,pub x:f64,pub y:f64,pub width:f64,pub age:f64,pub bank:Vec<f64>}
impl Ledge {
    pub fn new(id:String,x:f64,y:f64,width:f64)->Self {
        Self{id,x,y,width,age:0.,bank:vec![0.;(width.max(1.)/8.).ceil() as usize]}
    }
}
#[derive(Serialize)]
pub struct Winter {
    pub width:f64,pub height:f64,pub flakes:Vec<Flake>,pub ledges:Vec<Ledge>,
    pub time:f64,pub plow_x:Option<f64>,
    #[serde(skip)] rng:SmallRng,
    #[serde(skip)] spawn:f64,
    #[serde(skip)] next_plow:f64,
}
impl Winter {
    pub fn new(width:f64,height:f64)->Self {
        Self{width,height,flakes:vec![],ledges:vec![Ledge::new("ground".into(),0.,height-4.,width)],time:0.,plow_x:None,rng:SmallRng::seed_from_u64(2048),spawn:0.,next_plow:80.}
    }
    pub fn surfaces(&mut self, mut ledges:Vec<Ledge>) {
        ledges.push(Ledge::new("ground".into(),0.,self.height-4.,self.width));
        for ledge in &mut ledges {
            if let Some(old)=self.ledges.iter().find(|o| o.id==ledge.id && (o.x-ledge.x).abs()<2. && (o.y-ledge.y).abs()<2. && (o.width-ledge.width).abs()<2.) {
                ledge.bank=old.bank.clone();ledge.age=old.age;
            }
        }
        self.ledges=ledges;
    }
    pub fn step(&mut self,dt:f64,s:&Settings) {
        if !s.enabled {return}
        let dt=dt.clamp(0.,0.05); self.time+=dt;
        self.spawn+=dt*[14.,38.,95.][s.intensity.min(2) as usize];
        for _ in 0..self.spawn as usize {
            if self.flakes.len()<900 {
                self.flakes.push(Flake{x:self.rng.gen_range(0.0..self.width.max(1.)),y:-8.,r:self.rng.gen_range(0.7..2.7),speed:self.rng.gen_range(20.0..60.0),phase:self.rng.gen_range(0.0..6.28)});
            }
        }
        self.spawn=self.spawn.fract();
        for ledge in &mut self.ledges { ledge.age+=dt; }
        let t=self.time; let width=self.width;
        self.flakes.retain_mut(|f| {
            let before=f.y;
            f.x=(f.x+(s.wind+(t*0.7+f.phase).sin()*14.)*dt).rem_euclid(width.max(1.));
            f.y+=f.speed*dt;
            if s.accumulation {
                // Choose the first crossed surface, independent of discovery order.
                let hit=self.ledges.iter().enumerate().filter_map(|(n,l)|{
                    if f.x<l.x||f.x>=l.x+l.width {return None}
                    let i=(((f.x-l.x)/8.) as usize).min(l.bank.len()-1);
                    let y=l.y-l.bank[i];
                    if before<=y && f.y>=y {Some((n,i,y))} else {None}
                }).min_by(|a,b|a.2.total_cmp(&b.2));
                if let Some((n,i,_))=hit {self.ledges[n].bank[i]=(self.ledges[n].bank[i]+0.65).min(20.);return false}
            }
            f.y<self.height+10.
        });
        for l in &mut self.ledges {
            let old=l.bank.clone();
            for (i,h) in l.bank.iter_mut().enumerate() {
                let avg=(old[i.saturating_sub(1)]+old[(i+1).min(old.len()-1)])/2.;
                *h=(*h+(avg-*h)*dt*2.-dt*0.006).max(0.);
                if !s.accumulation {*h=0.;}
            }
        }
        if s.plow && self.time>self.next_plow {self.plow_x=Some(-60.);self.next_plow=self.time+80.;}
        if let Some(x)=&mut self.plow_x {
            *x+=dt*100.;
            for l in &mut self.ledges { if l.id=="ground" {for (i,h) in l.bank.iter_mut().enumerate() {if (i as f64*8.-*x).abs()<32. {*h=0.}}}}
            if *x>self.width+70. {self.plow_x=None;}
        }
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn pause() {let mut w=Winter::new(800.,600.);let mut s=Settings::default();s.enabled=false;w.step(1.,&s);assert_eq!(w.time,0.);}
    #[test] fn storm_bounds() {let mut w=Winter::new(400.,300.);let mut s=Settings::default();s.intensity=2;for _ in 0..6000 {w.step(1./30.,&s)} assert!(w.flakes.len()<=900);assert!(w.ledges.iter().flat_map(|l|&l.bank).all(|h|h.is_finite()&&*h<=20.));}
    #[test] fn moved_window_clears_bank() {let mut w=Winter::new(800.,600.);w.surfaces(vec![Ledge::new("a".into(),10.,50.,100.)]);w.ledges[0].bank[0]=10.;w.surfaces(vec![Ledge::new("a".into(),20.,50.,100.)]);assert_eq!(w.ledges[0].bank[0],0.);}
    #[test] fn settings_bounds() {let mut s=Settings::default();s.intensity=255;s.wind=f64::NAN;s.fps=1;s.validate();assert_eq!(s.intensity,2);assert!(s.wind.is_finite());assert_eq!(s.fps,30);}
}
