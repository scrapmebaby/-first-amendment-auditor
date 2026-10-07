import assert from 'node:assert/strict';
import { renderScale } from '../dist/display.js';
assert.equal(renderScale(1920, 1080, 1, 'balanced', '4k'), 2);
assert.equal(renderScale(3840, 2160, 1, 'balanced', '4k'), 1);
assert.equal(renderScale(390, 844, 3, 'balanced', 'auto'), 1);
assert.equal(renderScale(390, 844, 3, 'balanced', 'native'), 3);
for (const [w, h] of [
  [390, 844],
  [3440, 1440],
  [7680, 4320],
]) {
  const r = renderScale(w, h, 3, 'cinematic', '4k');
  assert.ok(Math.max(w * r, h * r) <= 3840.00001);
  assert.ok(Math.min(w * r, h * r) <= 2160.00001);
}
assert.equal(renderScale(1920, 1080, 2, 'cinematic', '4k', 2048), 2048 / 1920);
console.log('4K target, native iPhone density, aspect ratios and hardware limits passed.');
