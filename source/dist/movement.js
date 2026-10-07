import { clamp } from './core.js';

export const angleDelta = (from, to) => Math.atan2(Math.sin(to - from), Math.cos(to - from));
const approach = (value, target, rate, dt) => value + clamp(target - value, -rate * dt, rate * dt);

// Collision is sampled along each step so slow frames cannot tunnel through walls.
export function slide(actor, dx, dz, blocked, radius = 0.65) {
  const count = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.35));
  const startX = actor.x,
    startZ = actor.z;
  for (let i = 0; i < count; i++) {
    const x = clamp(actor.x + dx / count, -85, 85);
    if (!blocked(x, actor.z, radius)) actor.x = x;
    const z = clamp(actor.z + dz / count, -85, 85);
    if (!blocked(actor.x, z, radius)) actor.z = z;
  }
  return Math.hypot(actor.x - startX, actor.z - startZ);
}

export function drive(s, input, dt, blocked) {
  let speed = s.carSpeed || 0;
  let heading = s.carHeading || 0;
  const target = input.brake ? 0 : input.throttle > 0 ? 19 : input.throttle < 0 ? -7 : 0;
  const rate = input.brake ? 26 : speed * target < 0 ? 24 : input.throttle ? 8 : 5;
  speed = approach(speed, target, rate, dt);
  // No turning on the spot; steering reverses naturally while backing up.
  heading += input.steer * Math.sign(speed) * Math.min(Math.abs(speed) / 5, 1) * 1.55 * dt;
  heading = Math.atan2(Math.sin(heading), Math.cos(heading));
  const x = s.x,
    z = s.z;
  const radius = 3.6; // Encloses the rotating sedan, including its corners.
  const moved = slide(
    s,
    Math.sin(heading) * speed * dt,
    Math.cos(heading) * speed * dt,
    blocked,
    radius,
  );
  if (moved < Math.abs(speed * dt) * 0.7) speed = 0;
  s.carSpeed = speed;
  s.carHeading = heading;
  s.carX = s.x;
  s.carZ = s.z;
  s.moving = Math.hypot(s.x - x, s.z - z) > 0.001;
}

export class Navigator {
  constructor(blocked) {
    this.blocked = blocked;
    this.step = 3;
    this.cache = new Map();
  }
  clearLine(a, b, radius = 0.7) {
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.6);
    for (let i = 1; i <= steps; i++)
      if (this.blocked(a.x + ((b.x - a.x) * i) / steps, a.z + ((b.z - a.z) * i) / steps, radius))
        return false;
    return true;
  }
  point(key) {
    const [x, z] = key.split(',').map(Number);
    return { x: x * 3, z: z * 3 };
  }
  key(x, z) {
    return `${x},${z}`;
  }
  free(x, z) {
    const key = this.key(x, z);
    if (!this.cache.has(key))
      this.cache.set(
        key,
        Math.abs(x) <= 28 && Math.abs(z) <= 28 && !this.blocked(x * 3, z * 3, 0.8),
      );
    return this.cache.get(key);
  }
  anchor(p) {
    let best = null,
      distance = Infinity;
    const cx = Math.round(p.x / 3),
      cz = Math.round(p.z / 3);
    for (let x = cx - 3; x <= cx + 3; x++)
      for (let z = cz - 3; z <= cz + 3; z++) {
        const q = { x: x * 3, z: z * 3 },
          d = Math.hypot(q.x - p.x, q.z - p.z);
        if (d < distance && this.free(x, z) && this.clearLine(p, q)) {
          best = this.key(x, z);
          distance = d;
        }
      }
    return best;
  }
  route(start, goal) {
    if (this.blocked(goal.x, goal.z, 0.8)) return [];
    if (this.clearLine(start, goal)) return [{ ...goal }];
    const a = this.anchor(start),
      b = this.anchor(goal);
    if (!a || !b) return [];
    const open = new Set([a]),
      cost = new Map([[a, 0]]),
      parent = new Map();
    const end = this.point(b);
    while (open.size) {
      let current = null,
        score = Infinity;
      for (const key of open) {
        const p = this.point(key),
          v = cost.get(key) + Math.hypot(p.x - end.x, p.z - end.z);
        if (v < score) {
          current = key;
          score = v;
        }
      }
      if (current === b) {
        const path = [{ ...goal }];
        while (current !== a) {
          path.unshift(this.point(current));
          current = parent.get(current);
        }
        path.unshift(this.point(a));
        return path;
      }
      open.delete(current);
      const [x, z] = current.split(',').map(Number);
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) {
        if (
          !this.free(x + dx, z + dz) ||
          !this.clearLine(this.point(current), { x: (x + dx) * 3, z: (z + dz) * 3 })
        )
          continue;
        const key = this.key(x + dx, z + dz),
          next = cost.get(current) + Math.hypot(dx, dz) * 3;
        if (next < (cost.get(key) ?? Infinity)) {
          cost.set(key, next);
          parent.set(key, current);
          open.add(key);
        }
      }
    }
    return [];
  }
  walk(actor, goal, speed, dt, neighbors = []) {
    const marker = `${goal.x.toFixed(1)},${goal.z.toFixed(1)}`;
    if (actor.routeGoal !== marker) {
      actor.routeGoal = marker;
      actor.route = this.route(actor, goal);
    }
    const path = actor.route || [];
    while (path.length && Math.hypot(path[0].x - actor.x, path[0].z - actor.z) < 0.4) path.shift();
    // Skip intermediate grid corners only when the straight segment is clear.
    while (path.length > 1 && this.clearLine(actor, path[1])) path.shift();
    if (!path.length) {
      actor.moving = false;
      return true;
    }
    const next = path[0],
      dx = next.x - actor.x,
      dz = next.z - actor.z,
      len = Math.hypot(dx, dz);
    let vx = dx / len,
      vz = dz / len;
    for (const other of neighbors) {
      if (other === actor || other.inCustody) continue;
      const ox = actor.x - other.x,
        oz = actor.z - other.z,
        d = Math.hypot(ox, oz);
      if (d > 0.01 && d < 1.6) {
        vx += (ox / d) * (1.6 - d) * 0.8;
        vz += (oz / d) * (1.6 - d) * 0.8;
      }
    }
    const norm = Math.hypot(vx, vz) || 1,
      step = Math.min(speed * dt, len);
    const moved = slide(actor, (vx / norm) * step, (vz / norm) * step, this.blocked);
    actor.moving = moved > 0.001;
    if (!actor.moving) {
      actor.routeGoal = null;
    }
    return false;
  }
  escape(actor, threat) {
    let best = null,
      score = -Infinity;
    const away = Math.atan2(actor.x - threat.x, actor.z - threat.z);
    for (const offset of [0, 0.5, -0.5, 1, -1, 1.6, -1.6, 2.4, -2.4, Math.PI]) {
      const goal = {
        x: clamp(actor.x + Math.sin(away + offset) * 12, -83, 83),
        z: clamp(actor.z + Math.cos(away + offset) * 12, -83, 83),
      };
      const value = Math.hypot(goal.x - threat.x, goal.z - threat.z) - Math.abs(offset);
      if (value > score && this.route(actor, goal).length) {
        score = value;
        best = goal;
      }
    }
    return best || { x: actor.x, z: actor.z };
  }
}
