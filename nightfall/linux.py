"""GTK3 layer-shell overlay; no XWayland or input interception."""
import json
import math
import os
import subprocess
import time
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
        width,height = (1000,650) if options.preview else (geo.width,geo.height)
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
        area = Gtk.DrawingArea()
        win.add(area)
        def draw(widget, cr, m=model):
            cr.set_operator(cairo.OPERATOR_SOURCE)
            cr.set_source_rgba(*((.055,.09,.14,1) if options.preview else (0,0,0,0)))
            cr.paint()
            cr.set_operator(cairo.OPERATOR_OVER)
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
            model.set_surfaces([Surface("demo",150,230,430),Surface("demo2",620,390,260)])
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
    GLib.timeout_add(round(1000/options.fps),tick)
    try:
        Gtk.main()
    finally:
        pool.shutdown(wait=False,cancel_futures=True)
