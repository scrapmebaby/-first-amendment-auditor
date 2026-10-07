import assert from 'node:assert/strict';
import { BANKS, Dialogue, language } from '../dist/dialogue.js';
import { fresh, validSave, migrateSave } from '../dist/core.js';
let seed = 71;
const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const d = new Dialogue(random);
for (const [key, lines] of Object.entries(BANKS)) {
  assert.equal(new Set(lines).size, lines.length, key + ' duplicate');
  const first = Array.from({ length: lines.length }, () => d.pick(key, { explicit: true }));
  assert.equal(new Set(first).size, lines.length, key + ' repeats before exhaustion');
  assert.notEqual(
    first.at(-1),
    d.pick(key, { explicit: true }),
    key + ' repeats across bag boundary',
  );
  for (const text of lines)
    assert.doesNotMatch(language(text), /\b(fuck\w*|shit\w*|asshole\w*|pissed)\b/i);
}
assert.ok(
  BANKS.library.includes(
    new Dialogue(() => 0).pick('plea', { place: 'Public Library', explicit: true }),
  ),
);
assert.ok(
  BANKS.rain.includes(new Dialogue(() => 0).pick('plea', { weather: 'rain', explicit: true })),
);
assert.equal(language('asshole', true), 'asshole');
assert.equal(language('Piece of shit mask'), 'Poop mask');
const old = fresh();
delete old.profanity;
assert.ok(validSave(old));
assert.equal(migrateSave(old).profanity, false);
assert.ok(validSave({ ...fresh(), profanity: true }));
assert.equal(validSave({ ...fresh(), profanity: 'yes' }), false);
assert.equal(validSave(null), false);
console.log(
  Object.values(BANKS).flat().length +
    ' original lines: routing, no-repeat bags, clean language, and save migration passed.',
);
