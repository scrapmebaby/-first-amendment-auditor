import test from 'node:test';
import assert from 'node:assert/strict';
import { fresh, migrateSave, validSave, buy, finishClip, publish, estimate } from '../dist/core.js';
import {
  afterUpload,
  progressCareer,
  takeLoan,
  repayLoan,
  chargeDay,
  homeIncident,
  cleanLawn,
  reportHome,
  damageEquipment,
  repairEquipment,
  startService,
  startShift,
  serviceStep,
  finishCareer,
  SERVICE_JOBS,
} from '../dist/campaign.js';
const take = {
  seconds: 10,
  drama: 2,
  music: false,
  touched: false,
  place: 'CITY HALL',
  person: 'Pat',
};
test('legacy saves migrate; campaign and statement corruption rejected', () => {
  const old = fresh();
  delete old.campaign;
  assert.equal(validSave(old), true);
  assert.equal(migrateSave(old).campaign.career, 'auditor');
  const s = fresh();
  assert.equal(validSave(s), true);
  s.campaign.loanDebt = NaN;
  assert.equal(validSave(s), false);
  s.campaign.loanDebt = 0;
  s.campaign.career = 'won';
  assert.equal(validSave(s), false);
});
test('loans require new uploads and likes, cap exposure, and never count as revenue', () => {
  const s = fresh();
  assert.equal(takeLoan(s).ok, false);
  s.published = 3;
  assert.equal(takeLoan(s).ok, false);
  s.likes = 150;
  assert.equal(takeLoan(s).ok, true);
  assert.equal(s.cash, 42);
  assert.equal(s.revenue, 0);
  assert.equal(s.campaign.loanDebt, 50);
  const snapshot = JSON.stringify(s);
  assert.equal(takeLoan(s).ok, false);
  assert.equal(JSON.stringify(s), snapshot);
  s.published += 3;
  assert.equal(takeLoan(s).ok, false);
  s.likes += 150;
  assert.equal(takeLoan(s).ok, false);
  s.day += 3;
  assert.equal(takeLoan(s).ok, true);
  assert.equal(s.campaign.loanRate, 0.1);
  assert.equal(s.campaign.loanDebt, 110);
  const before = s.expenses;
  chargeDay(s);
  assert.equal(s.expenses - before, 19);
  repayLoan(s);
  assert.ok(Math.abs(s.cash - s.campaign.loanDebt - (s.revenue - s.expenses)) < 0.001);
  for (let i = 0; i < 10; i++) {
    s.published += 3;
    s.likes += 1000;
    s.day += 3;
    takeLoan(s);
  }
  assert.ok(s.campaign.loanDebt <= 250);
  assert.ok(s.campaign.loansTaken <= 4);
  s.campaign.demonetized = true;
  assert.equal(takeLoan(s).ok, false);
});
test('legacy saves retain debt without inventing audience credit', () => {
  const s = fresh();
  delete s.likes;
  delete s.campaign.lastLoanUpload;
  delete s.campaign.lastLoanLikes;
  s.published = 5;
  s.campaign.loansTaken = 1;
  s.campaign.loanDebt = 150;
  assert.equal(validSave(s), true);
  const loaded = migrateSave(s);
  assert.equal(loaded.likes, 0);
  assert.equal(loaded.campaign.loanDebt, 150);
  assert.equal(loaded.campaign.lastLoanUpload, 5);
  assert.equal(takeLoan(loaded).ok, false);
  loaded.campaign.lastLoanLikes = -1;
  assert.equal(validSave(loaded), false);
});
test('reputation alone does not expose home; cameras and masking still work', () => {
  const s = fresh();
  s.campaign.reputation = 26;
  progressCareer(s);
  assert.equal(s.campaign.homeKnown, false);
  s.campaign.homeKnown = true;
  let i = homeIncident(s);
  assert.equal(i.recorded, false);
  s.cash = 100;
  buy(s, 'security');
  i = homeIncident(s);
  assert.equal(i.recorded, true);
  assert.equal(i.identified, true);
  i = homeIncident(s);
  assert.equal(i.masked, true);
  assert.equal(i.identified, false);
  assert.equal(reportHome(s, i.id).ok, true);
  assert.equal(reportHome(s, i.id).ok, false);
  s.cash = 100;
  buy(s, 'doggieBags');
  s.x = -25;
  s.z = 83;
  while (s.campaign.homeIncidents.some((i) => !i.cleaned)) assert.equal(cleanLawn(s).ok, true);
  assert.ok(s.campaign.homeIncidents.every((i) => i.cleaned));
  assert.equal(validSave(s), true);
});
test('damage lowers reach; repairs restore condition and cost money', () => {
  const s = fresh(),
    c = finishClip(s, take),
    good = estimate(s, c, false).views;
  damageEquipment(s, 100);
  assert.equal(s.campaign.condition, 0);
  assert.ok(estimate(s, c, false).views < good);
  assert.equal(repairEquipment(s).ok, false);
  s.cash = 65;
  assert.equal(repairEquipment(s).ok, true);
  assert.equal(s.campaign.condition, 100);
  assert.equal(s.cash, 0);
});
test('uploads progress to demonetization; service work and deliberate surrender achieve victory', () => {
  const s = fresh();
  for (let i = 0; i < 20; i++) {
    const c = finishClip(s, take);
    publish(s, c.id, false, 'Ordinary person exposed');
    afterUpload(s, c, false);
  }
  assert.equal(s.campaign.warning, true);
  assert.equal(s.campaign.demonetized, true);
  const c = finishClip(s, take);
  assert.equal(estimate(s, c, true).income, 0);
  assert.equal(finishCareer(s).ok, false);
  assert.equal(startService(s).ok, true);
  assert.equal(publish(s, c.id, true, 'Comeback'), null);
  assert.equal(takeLoan(s).ok, false);
  const job = SERVICE_JOBS[0];
  assert.equal(startShift(s, job.id).ok, false);
  s.x = job.x;
  s.z = job.z;
  for (let i = 0; i < 3; i++) {
    assert.equal(startShift(s, job.id).ok, true);
    for (let j = 0; j < 3; j++) assert.equal(serviceStep(s).ok, true);
  }
  assert.equal(s.campaign.shifts, 3);
  assert.equal(finishCareer(s).ok, true);
  assert.equal(s.campaign.career, 'won');
  assert.equal(s.campaign.stress, 0);
  assert.equal(validSave(s), true);
  const cash = s.cash;
  chargeDay(s);
  assert.equal(s.cash, cash);
});

test('exhausted credit and destroyed equipment cannot trap the player before the ending', () => {
  const s = fresh();
  s.cash = -900;
  s.campaign.loansTaken = 8;
  damageEquipment(s, 100);
  assert.equal(s.campaign.demonetized, true);
  assert.equal(startService(s).ok, true);
});
