import assert from 'node:assert/strict';
import { Navigator, drive, slide } from '../dist/movement.js';
import { World, collision } from '../dist/world.js';
import { fresh, validSave, migrateSave } from '../dist/core.js';
const wall = (x, z, r = 0) => Math.abs(x) < 3 + r && Math.abs(z) < 8 + r;
const nav = new Navigator(wall),
  start = { x: -10, z: 0 },
  goal = { x: 10, z: 0 };
const path = nav.route(start, goal);
assert.ok(path.length > 1, 'route must go around wall');
let prev = start;
for (const p of path) {
  assert.ok(nav.clearLine(prev, p));
  prev = p;
}
const walker = { ...start };
for (let i = 0; i < 1800; i++) {
  nav.walk(walker, goal, 3, 1 / 60);
  assert.equal(wall(walker.x, walker.z, 0.6), false);
}
assert.ok(Math.hypot(walker.x - goal.x, walker.z - goal.z) < 0.5, 'reaches other side');
const escape = nav.escape({ x: -4, z: 0 }, { x: -7, z: 0 });
assert.ok(nav.route({ x: -4, z: 0 }, escape).length);
assert.ok(Math.hypot(escape.x + 7, escape.z) > 3, 'escape creates distance despite wall');
const actor = { x: -10, z: 0 };
slide(actor, 30, 0, wall);
assert.ok(actor.x < -3, 'large frame does not tunnel');
function driving(fps) {
  const s = { x: 0, z: 0 };
  for (let i = 0; i < fps; i++) drive(s, { throttle: 1, steer: 0 }, 1 / fps, () => false);
  return s;
}
const car = driving(60);
assert.ok(car.carSpeed > 7 && car.carSpeed < 9);
assert.ok(car.z > 3 && car.z < 5);
assert.ok(Math.abs(driving(30).z - driving(120).z) < 0.15);
const angle = car.carHeading;
for (let i = 0; i < 30; i++) drive(car, { throttle: 1, steer: 1 }, 1 / 60, () => false);
assert.ok(car.carHeading > angle);
assert.ok(car.x > 0);
for (let i = 0; i < 90; i++) drive(car, { throttle: -1, steer: 0 }, 1 / 60, () => false);
assert.ok(car.carSpeed < 0, 'brake then reverse');
for (let i = 0; i < 60; i++)
  drive(car, { throttle: 0, steer: 0, brake: true }, 1 / 60, () => false);
assert.equal(car.carSpeed, 0);
const parkedHeading = car.carHeading;
drive(car, { throttle: 0, steer: 1 }, 1, () => false);
assert.equal(car.carHeading, parkedHeading, 'cannot spin parked car');
const town = new Navigator(collision);
for (const [x, z] of [
  [11, 6],
  [-22, -10],
  [-24, 37],
  [26, 38],
]) {
  const g = town.escape({ x, z }, { x: x - 2, z: z - 1 });
  assert.ok(town.route({ x, z }, g).length, 'town escape route');
}
const old = fresh();
delete old.carHeading;
assert.ok(validSave(old));
assert.equal(migrateSave(old).carHeading, 0);
assert.equal(validSave({ ...fresh(), carHeading: Infinity }), false);
console.log(
  'Routing, escape, collision, acceleration, steering, braking/reverse, frame rates and old saves passed.',
);

const vertices = [];
const fake = {
  poly(points) {
    vertices.push(...points);
  },
  carBody() {
    this.poly([
      [1, 0, 3],
      [2, 1, 4],
    ]);
  },
};
World.prototype.car.call(fake, 0, 0, false, 0, '#ffffff', false, Math.PI / 2);
assert.ok(
  Math.abs(vertices[0][0] - 3) < 1e-8 && Math.abs(vertices[0][2] + 1) < 1e-8,
  'car geometry follows heading',
);
