import assert from 'node:assert/strict';
import {
  fresh,
  buy,
  finishClip,
  estimate,
  publish,
  transaction,
  migrateSave,
  validSave,
} from '../dist/core.js';
import {
  afterUpload,
  discoveryRisk,
  backlashRisk,
  homeIncident,
  cleanLawn,
  checkHOA,
  hoaStatus,
  relationshipFallout,
  loanOffer,
  takeLoan,
  repayLoan,
  chargeDay,
} from '../dist/campaign.js';
import { INCOME_ACCOUNTS } from '../dist/economy.js';
const take = {
  seconds: 45,
  drama: 6,
  music: false,
  touched: false,
  place: 'CITY HALL',
  person: 'Pat',
};
const s = fresh();
transaction(s, 100, 'Test income');
s.campaign.homeKnown = true;
homeIncident(s, () => 0.9);
assert.equal(s.accounts.home, undefined, 'a mess alone does not invent property damage');
assert.equal(cleanLawn(s).ok, false);
assert.ok(buy(s, 'doggieBags').ok);
assert.equal(s.cleanupBags, 5);
assert.ok(buy(s, 'doggieBags').ok);
assert.equal(s.cleanupBags, 10);
assert.equal(cleanLawn(s).ok, false, 'must visit home');
s.x = -25;
s.z = 83;
s.minutes = 650;
s.campaign.hoaNextInspection = 2090;
assert.equal(checkHOA(s), null, 'two hour grace');
s.minutes = 720;
assert.ok(checkHOA(s));
assert.equal(s.campaign.hoaFines, 25);
const cash = s.cash;
assert.equal(checkHOA(s), null);
assert.equal(s.cash, cash, 'no repeated charge in same inspection');
s.minutes = 900;
assert.ok(checkHOA(s));
assert.equal(s.campaign.hoaFines, 60);
assert.ok(cleanLawn(s).ok);
assert.equal(s.cleanupBags, 9);
assert.equal(s.campaign.hoaStreak, 0);
s.minutes = 1080;
assert.equal(checkHOA(s), null);
assert.equal(hoaStatus(s).dirty, 0);
assert.ok(validSave(s));
const full = fresh();
full.campaign.homeKnown = true;
for (let i = 0; i < 20; i++) homeIncident(full, () => 0.9);
assert.equal(homeIncident(full), null);
assert.equal(full.campaign.homeIncidents.length, 20, 'never discard uncleared messes');
assert.ok(full.campaign.homeIncidents.some((i) => i.type === 'porch'));
full.minutes = 720;
full.campaign.hoaStreak = 20;
checkHOA(full);
assert.equal(full.campaign.hoaFines, 100);
const low = fresh(),
  high = fresh();
const small = finishClip(low, take, 0.1),
  viral = finishClip(high, take, 0.99);
const a = estimate(low, small, false),
  b = estimate(high, viral, false);
assert.ok(b.income > a.income * 10);
assert.ok(discoveryRisk(high, b) > discoveryRisk(low, a));
afterUpload(low, small, false, a, () => 0.2);
afterUpload(high, viral, false, b, () => 0.2);
assert.equal(low.campaign.homeKnown, false);
assert.equal(high.campaign.homeKnown, true);
assert.ok(high.campaign.exposure > low.campaign.exposure);
assert.ok(backlashRisk(high, b) > backlashRisk(low, a));
relationshipFallout(high, () => 0.1);
relationshipFallout(high, () => 0.9);
assert.deepEqual(
  high.campaign.fallout.slice(0, 2).map((f) => f.type),
  ['family', 'friends'],
);
assert.ok(high.campaign.relationshipStrain > 0);
const loan = fresh();
loan.published = 3;
loan.likes = 1000;
assert.ok(takeLoan(loan).ok);
assert.equal(loan.campaign.loanRate, 0.08);
assert.equal(loan.cash, 92);
loan.published += 3;
loan.likes += 1000;
assert.equal(takeLoan(loan).ok, false);
loan.day += 2;
assert.equal(takeLoan(loan).ok, false);
loan.day++;
assert.equal(loanOffer(loan).eligible, true);
assert.ok(takeLoan(loan).ok);
chargeDay(loan);
repayLoan(loan);
assert.ok(Math.abs(loan.cash - loan.campaign.loanDebt - (loan.revenue - loan.expenses)) < 0.001);
const ledger = fresh();
const clip = finishClip(ledger, take, 0.99);
publish(ledger, clip.id, false, 'Hit');
buy(ledger, 'camera');
buy(ledger, 'doggieBags');
ledger.campaign.homeKnown = true;
homeIncident(ledger, () => 0);
relationshipFallout(ledger, () => 0);
chargeDay(ledger);
const income = Object.entries(ledger.accounts)
  .filter(([k]) => INCOME_ACCOUNTS.includes(k))
  .reduce((sum, [, v]) => sum + v, 0);
const expenses = Object.entries(ledger.accounts)
  .filter(([k]) => !INCOME_ACCOUNTS.includes(k))
  .reduce((sum, [, v]) => sum + v, 0);
assert.ok(Math.abs(income - ledger.revenue) < 0.001);
assert.ok(Math.abs(expenses - ledger.expenses) < 0.001);
const old = fresh();
delete old.accounts;
delete old.cleanupBags;
for (const k of [
  'exposure',
  'relationshipStrain',
  'fallout',
  'hoaNextInspection',
  'hoaFines',
  'hoaStreak',
  'lastLoanDay',
])
  delete old.campaign[k];
old.revenue = 200;
old.expenses = 90;
assert.ok(validSave(old));
const loaded = migrateSave(old);
assert.deepEqual(loaded.accounts, { priorIncome: 200, priorExpenses: 90 });
assert.equal(loaded.cleanupBags, 0);
assert.ok(validSave(loaded));
assert.equal(validSave({ ...fresh(), cleanupBags: -1 }), false);
assert.equal(validSave({ ...fresh(), accounts: { madeUp: 100 } }), false);
const buckets = {};
let total = 0;
for (let i = 0; i < 1000; i++) {
  const state = fresh();
  const c = finishClip(state, take, (i + 0.5) / 1000);
  c.id = i + 1;
  const e = estimate(state, c, false);
  buckets[e.tier] = (buckets[e.tier] || 0) + 1;
  total += e.income;
  assert.deepEqual(e, estimate(state, JSON.parse(JSON.stringify(c)), false));
}
assert.deepEqual(Object.values(buckets), [450, 350, 150, 50]);
assert.ok(total / 1000 > 40 && total / 1000 < 90);
console.log(
  'Cleanup supplies/location, HOA grace/cadence/caps, popularity discovery, friends/family costs, loan cooldown, accounting reconciliation, legacy saves and 1,000-video payout distribution passed.',
);
