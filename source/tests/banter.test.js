import assert from 'node:assert/strict';
import { Banter, EXCHANGES } from '../dist/banter.js';
const contexts = {
  street: {},
  civic: { place: 'City Hall' },
  library: { place: 'Public Library' },
  cafe: { place: 'Daily Grind' },
  recognized: { reputation: 80 },
  heated: { patience: 40 },
  enraged: { patience: 20 },
  rain: { weather: 'rain' },
};
let count = 0;
for (const [key, rows] of Object.entries(EXCHANGES)) {
  const b = new Banter(() => 0.2),
    context = { ...contexts[key], explicit: true };
  const picked = Array.from({ length: rows.length }, () => b.pick(context).join('|'));
  assert.equal(new Set(picked).size, rows.length, key + ' must exhaust before repeating');
  assert.notEqual(picked.at(-1), b.pick(context).join('|'));
  for (const row of rows) {
    assert.equal(row.length, 4);
    for (const text of row) {
      assert.ok(text.length > 0 && text.length < 140);
      count++;
    }
  }
}
const clean = new Banter(() => 0.2);
for (let i = 0; i < 20; i++)
  assert.doesNotMatch(
    clean.pick({ patience: 20 }).join(' '),
    /\b(?:damn|fuck\w*|shit|asshole|bullshit)\b/i,
  );
assert.equal(count, 164);
console.log(
  '164 paired banter lines: context pools, exhaustion, clean language and mobile line lengths passed.',
);

assert.ok(EXCHANGES.enraged.some((row) => row.join(' ').includes('fucking')));
assert.ok(
  EXCHANGES.enraged.some((row) =>
    row
      .join(' ')
      .includes(new Banter(() => 0.2).pick({ patience: 20, reputation: 90, explicit: true })[0]),
  ),
);
