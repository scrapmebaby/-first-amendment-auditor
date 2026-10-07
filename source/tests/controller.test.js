import assert from 'node:assert/strict';
import { Controller, deadzone } from '../dist/controller.js';
assert.equal(deadzone(0.15), 0);
assert.equal(deadzone(NaN), 0);
assert.equal(deadzone(-1), -1);
assert.ok(deadzone(0.6) > 0 && deadzone(0.6) < 1);
const c = new Controller(),
  pad = {
    index: 0,
    connected: true,
    mapping: 'standard',
    axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
  };
c.poll([pad]);
pad.buttons[9].pressed = true;
assert.equal(c.poll([pad]).pressed[9], true);
assert.equal(c.poll([pad]).pressed[9], false);
pad.axes[0] = 0.75;
assert.ok(c.poll([pad]).x > 0);
assert.equal(c.poll([pad], false).x, 0);
assert.equal(c.poll([]).x, 0);
assert.equal(c.poll([pad]).pressed[9], false);
pad.mapping = '';
assert.equal(c.poll([pad]).connected, false);
console.log(
  'Controller deadzone, edge-triggered actions, focus gating, disconnect and standard mapping passed.',
);
