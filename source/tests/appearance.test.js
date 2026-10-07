import assert from 'node:assert/strict';
import { MERCH, mirrorSites, viewMovement } from '../dist/appearance.js';
import { fresh, validSave, migrateSave, buy } from '../dist/core.js';
import { collision } from '../dist/world.js';
import { Navigator } from '../dist/movement.js';
const nav = new Navigator(collision);
assert.deepEqual(mirrorSites(71), mirrorSites(71));
assert.notDeepEqual(mirrorSites(71), mirrorSites(88));
for (const seed of [0, 71, 1977, 999999999]) {
  const sites = mirrorSites(seed);
  assert.equal(sites.length, 6);
  assert.equal(new Set(sites.map((p) => `${p.x}:${p.z}`)).size, 6);
  for (const m of sites) {
    const goal = { x: m.x, z: m.z + 3.5 };
    assert.equal(collision(goal.x, goal.z, 0.7), false);
    assert.ok(nav.route({ x: 7, z: 10 }, goal).length, 'mirror must be reachable');
  }
}
assert.ok(collision(7, 4, 0.65), 'starter mirror has a physical footprint');
const state = fresh();
state.cash = 18;
assert.ok(buy(state, 'merchPress').ok);
assert.equal(state.merch, 'merchPress');
assert.equal(state.cash, 0);
assert.ok(validSave(state));
assert.equal(buy(state, 'merchPress').ok, false);
assert.equal(validSave({ ...fresh(), merch: 'merchPress' }), false);
assert.equal(validSave({ ...fresh(), merch: 'merchPress', gear: {} }), false);
assert.equal(validSave({ ...fresh(), merch: '__proto__' }), false);
const old = fresh();
for (const key of ['viewMode', 'lookYaw', 'lookPitch', 'mirrorSeed', 'merch']) delete old[key];
assert.ok(validSave(old));
const loaded = migrateSave(old);
assert.equal(loaded.viewMode, 'overhead');
assert.equal(loaded.merch, null);
assert.equal(loaded.mirrorSeed, 1977);
for (const patch of [
  { lookYaw: Infinity },
  { lookPitch: 5 },
  { viewMode: 'broken' },
  { mirrorSeed: -1 },
])
  assert.equal(validSave({ ...fresh(), ...patch }), false);
const forward = viewMovement(0, 1, Math.PI),
  right = viewMovement(1, 0, Math.PI);
assert.ok(forward.z < -0.99 && right.x > 0.99);
console.log(
  'Mirror placement/reachability, wardrobe ownership, old saves and first-person movement basis passed.',
);
