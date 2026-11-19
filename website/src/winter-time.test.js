import test from 'node:test';
import assert from 'node:assert/strict';
import { phaseForHour, resolvePhase, celestialPosition } from './winter-time.js';

test('local clock switches at all four phase boundaries', () => {
  for (const [hour, expected] of [[0,'night'],[5.99,'night'],[6,'morning'],[11.99,'morning'],[12,'afternoon'],[15.99,'afternoon'],[16,'evening'],[18.99,'evening'],[19,'night'],[24,'night']]) {
    assert.equal(phaseForHour(hour), expected);
  }
});

test('manual time selection overrides clock and invalid modes follow clock', () => {
  assert.equal(resolvePhase('evening', 8), 'evening');
  assert.equal(resolvePhase('auto', 8), 'morning');
  assert.equal(resolvePhase('invalid', 22), 'night');
  assert.deepEqual(celestialPosition('night', 8), celestialPosition('night', 12));
});

test('sun and moon stay on screen through the complete day', () => {
  for (let hour = 0; hour < 24; hour += .25) {
    const {x,y} = celestialPosition('auto', hour);
    assert.ok(x >= 14 && x <= 86);
    assert.ok(y >= 5 && y <= 43);
  }
});
