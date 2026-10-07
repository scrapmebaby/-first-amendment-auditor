import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fresh,
  buy,
  finishClip,
  estimate,
  publish,
  resolveClaim,
  validSave,
} from '../dist/core.js';
const take = {
  seconds: 12,
  drama: 3,
  music: false,
  touched: false,
  place: 'CITY HALL',
  person: 'Pat',
};
test('new career starts broke and valid; corrupted imports rejected', () => {
  const s = fresh();
  assert.equal(s.cash, 0);
  assert.equal(validSave(s), true);
  assert.equal(validSave({ ...s, cash: NaN }), false);
  assert.equal(validSave({ ...s, gear: ['hacked'] }), false);
  assert.equal(validSave({ ...s, clips: [{}] }), false);
  assert.equal(validSave({ ...s, carX: 900 }), false);
});
test('purchases enforce credit limit, prerequisites and ownership', () => {
  const s = fresh();
  assert.equal(buy(s, 'crew2').ok, false);
  assert.equal(buy(s, 'camera').ok, true);
  assert.equal(s.cash, -85);
  assert.equal(buy(s, 'camera').ok, false);
  buy(s, 'crew');
  buy(s, 'crew2');
  buy(s, 'gimbal');
  assert.equal(buy(s, 'mic').ok, true);
  assert.equal(buy(s, 'poop').ok, false);
  assert.ok(s.cash >= -350);
});
test('short takes rejected; music kills revenue; context cutting boosts clicks', () => {
  const s = fresh();
  assert.equal(finishClip(s, { ...take, seconds: 2 }), null);
  const c = finishClip(s, take);
  assert.equal(s.clips.length, 1);
  assert.ok(estimate(s, c, true).views > estimate(s, c, false).views);
  assert.equal(estimate(s, { ...c, music: true }, true).income, 0);
});
test('publishing accounts for revenue/expenses and cannot duplicate income', () => {
  const s = fresh();
  const c = finishClip(s, take);
  const e = publish(s, c.id, true, 'Test');
  assert.equal(s.published, 1);
  assert.equal(s.clips.length, 0);
  assert.equal(s.society, -3);
  assert.equal(s.views, e.views);
  assert.ok(Math.abs(s.cash - (s.revenue - s.expenses)) < 0.001);
  assert.equal(publish(s, c.id, true, 'Again'), null);
  assert.equal(validSave(s), true);
});
test('crew adds more overhead than a short clip earns', () => {
  const s = fresh();
  const c = finishClip(s, take),
    before = estimate(s, c, true);
  buy(s, 'crew');
  const after = estimate(s, c, true);
  assert.ok(after.views > before.views);
  assert.ok(after.net < before.net);
});
test('claims require evidence and spraying defeats a payout', () => {
  let s = fresh();
  assert.equal(resolveClaim(s, { touched: false }, 0).payout, 0);
  assert.equal(s.cash, -12);
  s = fresh();
  assert.equal(resolveClaim(s, { touched: true, playerSprayed: true }, 0).payout, 0);
  s = fresh();
  assert.ok(resolveClaim(s, { touched: true }, 0.1).payout > 0);
  assert.ok(Math.abs(s.cash - (s.revenue - s.expenses)) < 0.001);
});
