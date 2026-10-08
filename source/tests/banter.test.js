import assert from 'node:assert/strict';
import { BANKS, language } from '../dist/dialogue.js';
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
  remembered: { visits: 1 },
  irritable: { temperament: 'irritable' },
  anxious: { temperament: 'anxious' },
  defiant: { temperament: 'defiant' },
  avoidant: { temperament: 'avoidant' },
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
assert.equal(count, 1260);
console.log(
  '1260 paired banter lines: context pools, exhaustion, clean language and mobile line lengths passed.',
);

assert.ok(EXCHANGES.enraged.some((row) => row.join(' ').includes('fucking')));
assert.ok(
  EXCHANGES.enraged.some((row) =>
    row
      .join(' ')
      .includes(new Banter(() => 0.2).pick({ patience: 20, reputation: 90, explicit: true })[0]),
  ),
);

const all = Object.values(EXCHANGES).flat();
assert.equal(new Set(all.map((row) => row.join('|'))).size, 315);
for (const rows of Object.values(EXCHANGES))
  for (const row of rows)
    for (const text of row)
      assert.doesNotMatch(language(text), /\b(?:fuck\w*|shit\w*|ass|damn)\b/i);
for (const temperament of ['anxious', 'irritable', 'defiant', 'avoidant']) {
  const b = new Banter(() => 0.2);
  assert.ok(
    EXCHANGES.enraged.some(
      (row) =>
        row.join('|') ===
        b.pick({ patience: 20, visits: 5, temperament, explicit: true }).join('|'),
    ),
  );
}
assert.ok(
  EXCHANGES.remembered.some(
    (row) => row.join('|') === new Banter(() => 0.2).pick({ visits: 1, explicit: true }).join('|'),
  ),
);
assert.ok(
  EXCHANGES.street.some(
    (row) => row.join('|') === new Banter(() => 0.2).pick({ visits: 0, explicit: true }).join('|'),
  ),
);

const allText = [...all.flat(), ...Object.values(BANKS).flat()];
assert.equal(new Set(allText).size, 2260, 'Every authored dialogue entry is distinct');
