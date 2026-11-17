"""Transparent AppKit windows, Quartz geometry, and a menu-bar controller."""
import time
from .engine import Winter, Surface

def run(options):
    import AppKit as A
    import Quartz as Q
    from Foundation import NSObject, NSTimer
    app = A.NSApplication.sharedApplication()
    app.setActivationPolicy_(A.NSApplicationActivationPolicyAccessory)
    windows, models, screens = [], [], []
    class SnowView(A.NSView):
        def isFlipped(self):
            return True
        def drawRect_(self, rect):
            A.NSColor.clearColor().set()
            A.NSRectFillUsingOperation_(self.bounds(),A.NSCompositingOperationCopy)
            for kind,c,color in self.model.shapes():
                A.NSColor.colorWithCalibratedRed_green_blue_alpha_(*color).set()
                if kind in ("oval","rect"):
                    x,y,w,h = c
                    r = A.NSMakeRect(x,y,w,h)
                    path = A.NSBezierPath.bezierPathWithOvalInRect_(r) if kind=="oval" else A.NSBezierPath.bezierPathWithRect_(r)
                else:
                    path = A.NSBezierPath.bezierPath()
                    path.moveToPoint_(c[:2]); path.lineToPoint_(c[2:4]); path.lineToPoint_(c[4:]); path.closePath()
                path.fill()
        def mouseDown_(self,event):
            p = self.convertPoint_fromView_(event.locationInWindow(),None)
            self.model.shovel(p.x,p.y)
        def mouseDragged_(self,event):
            self.mouseDown_(event)
    class Controller(NSObject):
        def tick_(self,timer):
            now = time.monotonic()
            dt,self.last = now-self.last,now
            if now > self.poll:
                self.poll = now+.3
                info = Q.CGWindowListCopyWindowInfo(Q.kCGWindowListOptionOnScreenOnly|Q.kCGWindowListExcludeDesktopElements,Q.kCGNullWindowID)
                primary_top = A.NSScreen.screens()[0].frame().size.height
                for model,screen in zip(models,screens):
                    frame = screen.frame()
                    ox,oy = frame.origin.x,primary_top-frame.origin.y-frame.size.height
                    surfaces = []
                    for item in info:
                        if item.get(Q.kCGWindowLayer,0) != 0 or item.get(Q.kCGWindowOwnerPID) == self.pid:
                            continue
                        b = item[Q.kCGWindowBounds]
                        left,right = max(0,b["X"]-ox),min(model.width,b["X"]-ox+b["Width"])
                        if right>left and oy <= b["Y"] < oy+model.height:
                            surfaces.append(Surface(str(item[Q.kCGWindowNumber]),left,b["Y"]-oy,right-left))
                    if not options.preview:
                        model.set_surfaces(surfaces)
            for model,win in zip(models,windows):
                model.update(dt)
                win.contentView().setNeedsDisplay_(True)
        def pause_(self,sender):
            for m in models: m.paused = not m.paused
        def plow_(self,sender):
            for m in models: m.send_plow()
        def intensity_(self,sender):
            for m in models: m.intensity = sender.title().lower()
        def quit_(self,sender):
            app.terminate_(None)
    import os
    controller = Controller.alloc().init()
    controller.last,controller.poll,controller.pid = time.monotonic(),0,os.getpid()
    for screen in A.NSScreen.screens():
        frame = screen.frame()
        if options.preview:
            frame = A.NSMakeRect(100,100,860,620)
        style = A.NSWindowStyleMaskTitled|A.NSWindowStyleMaskClosable if options.preview else A.NSWindowStyleMaskBorderless
        win = A.NSWindow.alloc().initWithContentRect_styleMask_backing_defer_(frame,style,A.NSBackingStoreBuffered,False)
        win.setTitle_("Nightfall")
        win.setOpaque_(False)
        win.setBackgroundColor_(A.NSColor.clearColor())
        win.setHasShadow_(False)
        win.setIgnoresMouseEvents_(not options.preview)
        if not options.preview:
            win.setLevel_(A.NSScreenSaverWindowLevel-1)
            win.setCollectionBehavior_(A.NSWindowCollectionBehaviorCanJoinAllSpaces|A.NSWindowCollectionBehaviorFullScreenAuxiliary|A.NSWindowCollectionBehaviorStationary)
        model = Winter(frame.size.width,frame.size.height)
        options.apply(model)
        if options.preview:
            model.set_surfaces([Surface("demo",150,230,430),Surface("demo2",580,370,240)])
        view = SnowView.alloc().initWithFrame_(A.NSMakeRect(0,0,frame.size.width,frame.size.height))
        view.model = model
        win.setContentView_(view)
        win.orderFrontRegardless()
        windows.append(win); models.append(model); screens.append(screen)
        if options.preview: break
    status = A.NSStatusBar.systemStatusBar().statusItemWithLength_(A.NSVariableStatusItemLength)
    status.button().setTitle_("❄")
    menu = A.NSMenu.alloc().init()
    for title,action in [("Pause / resume","pause:"),("Light","intensity:"),("Normal","intensity:"),("Blizzard","intensity:"),("Send snowplow","plow:"),("Quit Nightfall","quit:")]:
        item = A.NSMenuItem.alloc().initWithTitle_action_keyEquivalent_(title,action,"")
        item.setTarget_(controller)
        menu.addItem_(item)
    status.setMenu_(menu)
    timer = NSTimer.scheduledTimerWithTimeInterval_target_selector_userInfo_repeats_(1/options.fps,controller,"tick:",None,True)
    app.run()
