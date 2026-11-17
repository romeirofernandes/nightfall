import math
import unittest
from nightfall.engine import Winter, Surface, Flake

class WinterTests(unittest.TestCase):
    def test_landing_and_release(self):
        m = Winter(800,600,seed=1)
        m.set_surfaces([Surface("window",100,200,300)])
        m.flakes = [Flake(150,199,0,50,2)]
        m.update(.05)
        self.assertGreater(sum(m.surfaces["window"].snow),0)
        m.set_surfaces([Surface("window",150,250,300)])
        self.assertEqual(sum(m.surfaces["window"].snow),0)

    def test_long_storm_is_bounded(self):
        m = Winter(400,300,seed=2)
        m.intensity = "blizzard"
        for _ in range(6000): m.update(1/30)
        self.assertLessEqual(len(m.flakes),1800)
        self.assertTrue(all(0<=h<=24 for s in m.surfaces.values() for h in s.snow))
        self.assertTrue(all(math.isfinite(n) for _,c,_ in m.shapes() for n in c))

    def test_pause_and_plow(self):
        m = Winter(400,300,seed=1)
        m.paused = True
        m.update(1)
        self.assertEqual(m.time,0)
        m.paused = False
        m.surfaces["ground"].snow = [20.]*len(m.surfaces["ground"].snow)
        m.send_plow()
        for _ in range(150): m.update(.03)
        self.assertLess(sum(m.surfaces["ground"].snow),500)

    def test_shovel(self):
        m = Winter(400,300)
        m.surfaces["ground"].snow[10] = 20
        m.shovel(60,293)
        self.assertEqual(m.surfaces["ground"].snow[10],0)
        self.assertTrue(m.flakes)

if __name__ == "__main__":
    unittest.main()
