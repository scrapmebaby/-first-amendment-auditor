import assert from 'node:assert/strict';
import { stickVector } from '../dist/touch-input.js';
assert.deepEqual(stickVector(2, 2), { x: 0, y: 0, sprint: false });
assert.equal(stickVector(48, 0).x, 1);
assert.equal(stickVector(0, -48).y, -1);
assert.ok(stickVector(24, 0).x > 0 && stickVector(24, 0).x < 0.5);
assert.ok(Math.abs(Math.hypot(stickVector(48, 48).x, stickVector(48, 48).y) - 1) < 1e-9);
assert.equal(stickVector(60, 0).sprint, true);
console.log('Radial deadzone, analog speed, diagonal clamp and outer-ring jog passed.');
