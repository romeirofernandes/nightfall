"""Platform independent, bounded snow simulation. Coordinates are logical pixels."""
from dataclasses import dataclass, field
import math
import random

@dataclass
class Surface:
    key: str
    x: float
    y: float
    width: float
    age: float = 0
    snow: list[float] = field(default_factory=list)

    def __post_init__(self):
        self.snow = [0.] * max(1, math.ceil(self.width / 6))

@dataclass
class Flake:
    x: float
    y: float
    vx: float
    vy: float
    radius: float

class Winter:
    def __init__(self, width, height, seed=None):
        self.width, self.height = width, height
        self.rng = random.Random(seed)
        self.flakes = []
        self.surfaces = {}
        self.time = 0.
        self.spawn = 0.
        self.intensity = "normal"
        self.paused = False
        self.icicles = True
        self.snowman = True
        self.plows = True
        self.plow = None
        self.next_plow = 75.
        self.man_health = 3
        self.set_surfaces([])

    def set_surfaces(self, surfaces):
        surfaces = [*surfaces, Surface("ground", 0, self.height - 7, self.width)]
        old = self.surfaces
        fresh = {}
        for s in surfaces:
            if s.width <= 0 or s.y < 0 or s.y > self.height:
                continue
            previous = old.get(s.key)
            if previous and abs(previous.x-s.x) < 2 and abs(previous.y-s.y) < 2 and abs(previous.width-s.width) < 2:
                s = previous
            elif previous:
                self.release(previous)
            fresh[s.key] = s
        for key, s in old.items():
            if key not in fresh:
                self.release(s)
        self.surfaces = fresh

    def release(self, s):
        for i, depth in enumerate(s.snow):
            if depth > 1 and len(self.flakes) < 1800:
                self.flakes.append(Flake(s.x+i*6, s.y-depth, self.rng.uniform(-65,65), 35, min(3, depth/3)))

    def shovel(self, x, y):
        for s in self.surfaces.values():
            if abs(y-s.y) < 35:
                for i, depth in enumerate(s.snow):
                    if abs(s.x+i*6-x) < 35 and depth:
                        if len(self.flakes) < 1800:
                            self.flakes.append(Flake(s.x+i*6, s.y-depth, self.rng.uniform(-140,140), -100, 2))
                        s.snow[i] = 0
        if self.snowman and abs(x-(self.width-85)) < 30 and y > self.height-100:
            self.man_health = max(0, self.man_health-1)

    def send_plow(self):
        self.plow = -70.

    def update(self, dt):
        if self.paused:
            return
        dt = min(max(dt, 0), .05)
        self.time += dt
        self.spawn += dt * {"light": 16, "normal": 55, "blizzard": 170}[self.intensity]
        for _ in range(int(self.spawn)):
            if len(self.flakes) < 1800:
                self.flakes.append(Flake(self.rng.uniform(0,self.width), -8, self.rng.uniform(-12,12), self.rng.uniform(24,70), self.rng.uniform(1,3)))
        self.spawn %= 1
        ordered = sorted(self.surfaces.values(), key=lambda s:s.y)
        alive = []
        for f in self.flakes:
            before = f.y
            f.x += (f.vx + math.sin(self.time*.7+f.y*.008)*17)*dt
            f.x %= self.width
            f.y += f.vy*dt
            f.vy = min(100, f.vy+dt*8)
            landed = False
            for s in ordered:
                if s.x <= f.x < s.x+s.width:
                    i = min(len(s.snow)-1, int((f.x-s.x)/6))
                    top = s.y-s.snow[i]
                    if before <= top <= f.y:
                        s.snow[i] = min(24, s.snow[i]+.7)
                        landed = True
                        break
            if not landed and f.y < self.height+10:
                alive.append(f)
        self.flakes = alive
        for s in ordered:
            s.age += dt
            # Diffusion makes soft banks, slow melting bounds accumulation.
            a = s.snow[:]
            for i, h in enumerate(a):
                s.snow[i] = max(0, h + dt*((a[max(0,i-1)]+a[min(len(a)-1,i+1)])/2-h)*2-dt*.008)
        if self.plows and self.time > self.next_plow:
            self.send_plow()
            self.next_plow = self.time+75
        if self.plow is not None:
            self.plow += dt*110
            ground = self.surfaces["ground"]
            for i in range(len(ground.snow)):
                if abs(i*6-self.plow) < 32:
                    ground.snow[i] = 0
            if self.plow > self.width+80:
                self.plow = None
        if int(self.time) % 90 == 89:
            self.man_health = 3

    def shapes(self):
        """Yield (kind, coordinates, RGBA); backends only translate primitives."""
        white = (.93,.97,1.,.95)
        for s in self.surfaces.values():
            for i, depth in enumerate(s.snow):
                if depth > .2:
                    yield "oval", (s.x+i*6-1,s.y-depth,8,depth+2), white
            if self.icicles and s.key != "ground":
                for i in range(3,len(s.snow),9):
                    length = min(18,s.age/9)*min(1,s.snow[i]/3)
                    if length > 1:
                        x = s.x+i*6
                        yield "triangle", (x,s.y,x+4,s.y,x+2,s.y+length), (.8,.92,1,.7)
        for f in self.flakes:
            yield "oval", (f.x,f.y,f.radius*2,f.radius*2), (.95,.98,1,.55+f.radius*.12)
        if self.snowman:
            x, y = self.width-85, self.height-8
            for level in range(self.man_health):
                r = 19-level*4
                cy = y-17-level*25
                yield "oval", (x-r,cy-r,2*r,2*r), white
                if level == 2:
                    for dx in (-5,5):
                        yield "oval", (x+dx-1,cy-4,3,3), (.08,.13,.19,1)
                    yield "triangle", (x,cy,x+15,cy+3,x,cy+5), (1,.42,.12,1)
                    yield "rect", (x-17,cy-19,34,4), (.1,.18,.25,1)
                    yield "rect", (x-11,cy-32,22,14), (.1,.18,.25,1)
                if level == 1:
                    yield "rect", (x-16,cy-11,32,5), (.8,.23,.26,1)
        if self.plow is not None:
            x,y = self.plow,self.height-25
            yield "rect", (x-24,y-13,40,24), (.95,.58,.12,1)
            yield "rect", (x-10,y-25,20,16), (.22,.48,.62,1)
            yield "triangle", (x+17,y-2,x+35,y+15,x+17,y+15), (.65,.74,.8,1)
            for dx in (-15,12):
                yield "oval", (x+dx-6,y+6,12,12), (.1,.15,.2,1)
            yield "oval", (x-4,y-31,8,6), (1,.3+.5*abs(math.sin(self.time*8)),.1,1)
