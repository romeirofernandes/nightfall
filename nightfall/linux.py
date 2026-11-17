"""GTK3 layer-shell overlay; no XWayland or input interception."""
import json
import math
import os
import subprocess
import time
import signal
from concurrent.futures import ThreadPoolExecutor
from .engine import Winter, Surface

def query():
    def read(command):
        return json.loads(subprocess.check_output(["hyprctl", "-j", command], timeout=.5))
    return read("clients"), read("monitors")

def run(options):
    import gi
    gi.require_version("Gtk", "3.0")
    from gi.repository import Gtk, Gdk, GLib
    import cairo
    if not options.preview:
        gi.require_version("GtkLayerShell", "0.1")
        from gi.repository import GtkLayerShell as Layer
        if not Layer.is_supported():
            raise RuntimeError("Layer shell unavailable. Run inside a Wayland Hyprland session.")
    display = Gdk.Display.get_default()
    if not display:
        raise RuntimeError("No graphical display available")
    pool = ThreadPoolExecutor(max_workers=1)
    pending = None
    windows = []
    models = []
    geometries = []
    last = time.monotonic()
    poll = 0.
    for index in range(1 if options.preview else display.get_n_monitors()):
        monitor = display.get_monitor(index)
        geo = monitor.get_geometry()
        width,height = (860,620) if options.preview else (geo.width,geo.height)
        model = Winter(width,height)
        options.apply(model)
        win = Gtk.Window(title="Nightfall")
        win.set_default_size(width,height)
        if options.preview:
            win.connect("destroy", Gtk.main_quit)
        else:
            win.set_decorated(False)
            win.set_app_paintable(True)
            win.set_visual(win.get_screen().get_rgba_visual())
            Layer.init_for_window(win)
            Layer.set_namespace(win,"nightfall")
            Layer.set_monitor(win,monitor)
            Layer.set_layer(win,Layer.Layer.OVERLAY)
            Layer.set_keyboard_mode(win,Layer.KeyboardMode.NONE)
            Layer.set_exclusive_zone(win,-1)
            for edge in (Layer.Edge.TOP,Layer.Edge.BOTTOM,Layer.Edge.LEFT,Layer.Edge.RIGHT):
                Layer.set_anchor(win,edge,True)
            win.connect("realize",lambda w:w.get_window().input_shape_combine_region(cairo.Region(),0,0))
        if options.preview:
            header = Gtk.HeaderBar(title="Nightfall", subtitle="A little winter, wherever you work")
            header.set_show_close_button(True)
            win.set_titlebar(header)
            for title, callback in [
                ("Pause", lambda b, m=model: setattr(m, "paused", not m.paused)),
                ("Plow", lambda b, m=model: m.send_plow()),
            ]:
                button = Gtk.Button(label=title)
                button.connect("clicked", callback)
                header.pack_end(button)
            choice = Gtk.ComboBoxText()
            for value in ("light", "normal", "blizzard"): choice.append_text(value)
            choice.set_active(("light", "normal", "blizzard").index(options.intensity))
            choice.connect("changed", lambda c, m=model: setattr(m, "intensity", c.get_active_text()))
            header.pack_start(choice)
        area = Gtk.DrawingArea()
        win.add(area)
        def draw(widget, cr, m=model):
            cr.set_operator(cairo.OPERATOR_SOURCE)
            cr.set_source_rgba(*((.055,.09,.14,1) if options.preview else (0,0,0,0)))
            cr.paint()
            cr.set_operator(cairo.OPERATOR_OVER)
            if options.preview:
                for x,y,w,h,title in [(150,230,430,260,"FIELD NOTES"),(580,370,240,170,"WINTER FORECAST")]:
                    cr.set_source_rgb(.10,.16,.23)
                    cr.rectangle(x,y,w,h); cr.fill()
                    cr.set_source_rgb(.17,.26,.34)
                    cr.rectangle(x,y,w,40); cr.fill()
                    cr.set_source_rgb(.77,.86,.93)
                    cr.select_font_face("sans-serif",0,0); cr.set_font_size(12)
                    cr.move_to(x+20,y+25); cr.show_text(title)
                    cr.set_font_size(17); cr.move_to(x+20,y+80)
                    cr.show_text("Let the quiet settle.")
                cr.set_source_rgb(.72,.82,.9)
                cr.set_font_size(40); cr.move_to(60,90); cr.show_text("A little winter.")
                cr.set_font_size(15); cr.move_to(62,125)
                cr.show_text("Snow gathers on ledges. Drag through a bank to scatter it.")
            for kind,coords,color in m.shapes():
                cr.set_source_rgba(*color)
                if kind == "oval":
                    x,y,w,h = coords
                    cr.save(); cr.translate(x+w/2,y+h/2); cr.scale(w/2,h/2)
                    cr.arc(0,0,1,0,math.tau); cr.restore()
                elif kind == "rect":
                    cr.rectangle(*coords)
                else:
                    cr.move_to(*coords[:2]); cr.line_to(*coords[2:4]); cr.line_to(*coords[4:]); cr.close_path()
                cr.fill()
            return False
        area.connect("draw",draw)
        if options.preview:
            model.set_surfaces([Surface("demo",150,230,430),Surface("demo2",580,370,240)])
            area.add_events(Gdk.EventMask.BUTTON_PRESS_MASK|Gdk.EventMask.BUTTON1_MOTION_MASK)
            area.connect("button-press-event",lambda w,e,m=model:m.shovel(e.x,e.y))
            area.connect("motion-notify-event",lambda w,e,m=model:m.shovel(e.x,e.y))
        win.show_all()
        windows.append(area); models.append(model); geometries.append(geo)

    def tick():
        nonlocal pending,last,poll
        now = time.monotonic()
        dt,last = now-last,now
        if not options.preview and now > poll and pending is None:
            pending = pool.submit(query)
            poll = now+.25
        if pending is not None and pending.done():
            try:
                clients,monitors = pending.result()
                active = {m["id"]:m["activeWorkspace"]["id"] for m in monitors}
                for model,geo in zip(models,geometries):
                    surfaces = []
                    for c in clients:
                        if c.get("hidden") or not c.get("mapped",True):
                            continue
                        if c["workspace"]["id"] != active.get(c.get("monitor")) and not c.get("pinned"):
                            continue
                        x,y = c["at"]; w,h = c["size"]
                        left,right = max(0,x-geo.x),min(model.width,x-geo.x+w)
                        if right > left and geo.y <= y < geo.y+geo.height:
                            surfaces.append(Surface(c["address"],left,y-geo.y,right-left))
                    model.set_surfaces(surfaces)
            except (OSError, ValueError, KeyError, subprocess.SubprocessError) as exc:
                if not getattr(tick,"warned",False):
                    print("Window discovery unavailable:",exc)
                    tick.warned = True
            pending = None
        for model,area in zip(models,windows):
            model.update(dt); area.queue_draw()
        return True
    def toggle():
        for model in models: model.paused = not model.paused
        return True
    def plow():
        for model in models: model.send_plow()
        return True
    GLib.unix_signal_add(GLib.PRIORITY_DEFAULT, signal.SIGUSR1, toggle)
    GLib.unix_signal_add(GLib.PRIORITY_DEFAULT, signal.SIGUSR2, plow)
    GLib.unix_signal_add(GLib.PRIORITY_DEFAULT, signal.SIGTERM, lambda: (Gtk.main_quit(), False)[1])
    GLib.timeout_add(round(1000/options.fps),tick)
    try:
        Gtk.main()
    finally:
        pool.shutdown(wait=False,cancel_futures=True)
