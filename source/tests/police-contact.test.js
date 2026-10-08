import assert from 'node:assert/strict';
import {
  officerResponse,
  supervisorFinding,
  beginOfficerContact,
  rememberOfficerRound,
} from '../dist/police-contact.js';
import { fresh, migrateSave, validSave, resolveClaim, finishClip, estimate } from '../dist/core.js';
import { auditorDesign } from '../dist/characters.js';
const c = { rounds: 0 };
assert.equal(officerResponse(c, 0.05).kind, 'threat');
assert.equal(officerResponse(c, 0.05).damage, 45);
assert.equal(officerResponse(c, 0.5).kind, 'professional');
officerResponse(c, 0.5);
assert.equal(officerResponse(c, 0), null);
assert.equal(supervisorFinding({ supervisorRequested: true }).substantiated, false);
assert.equal(
  supervisorFinding({ officerMisconduct: true, recordedMisconduct: true }).substantiated,
  true,
);
const s = fresh(),
  report = {
    touched: true,
    officerMisconduct: true,
    officerForce: true,
    recordedMisconduct: true,
    recordedForce: true,
  };
const result = resolveClaim(s, report, 0.1);
assert.ok(result.payout >= 600 && result.payout < 1800);
assert.equal(result.legalFees, Math.round(result.payout * 30) / 100);
assert.equal(s.cash, result.net);
assert.equal(s.taxpayerCost, result.payout + 75);
assert.equal(s.settlementGross, result.payout);
assert.equal(s.claimFilingFees, 12);
const saved = JSON.stringify(s);
resolveClaim(s, report, 0.1);
assert.equal(JSON.stringify(s), saved);
const denied = fresh();
assert.equal(resolveClaim(denied, { touched: false, supervisorRequested: true }, 0).payout, 0);
assert.equal(denied.cash, -12);
assert.equal(denied.taxpayerCost, 75);
const unrecorded = resolveClaim(
  fresh(),
  { ...report, claimResolved: false, recordedForce: false },
  0.5,
);
assert.equal(unrecorded.payout, 0);
const legacy = fresh();
for (const k of [
  'gender',
  'genderChosen',
  'taxpayerCost',
  'settlementGross',
  'settlementFees',
  'claimFilingFees',
  'hospitalBills',
])
  delete legacy[k];
assert.ok(validSave(legacy));
const migrated = migrateSave(legacy);
assert.equal(migrated.gender, 'male');
assert.equal(migrated.genderChosen, true);
assert.equal(migrated.taxpayerCost, 0);
assert.equal(validSave({ ...fresh(), gender: 'broken' }), false);
assert.equal(validSave({ ...fresh(), taxpayerCost: NaN }), false);
assert.equal(
  validSave({
    ...fresh(),
    pendingReport: { touched: false, playerSprayed: false, arrest: false, recordedForce: 'yes' },
  }),
  false,
);
assert.notEqual(auditorDesign('male').hairdo, auditorDesign('female').hairdo);
assert.notEqual(auditorDesign('male').face, auditorDesign('female').face);
const video = finishClip(
  s,
  { seconds: 45, drama: 6, music: false, touched: false, place: 'CITY HALL', person: 'Officer' },
  0.5,
);
assert.equal(estimate(s, video, false).rpm, 7.5);
console.log(
  'Officer escalation/cap, supervisor evidence, award/taxpayer accounting, duplicate-claim rejection, recorded-force checks, gender designs, legacy saves and increased video rate passed.',
);

const state = fresh();
const contact = beginOfficerContact(state, 92, {});
for (let i = 0; i < 4; i++) {
  officerResponse(contact, 0.5);
  rememberOfficerRound(state, contact);
}
const loaded = migrateSave(JSON.parse(JSON.stringify(state)));
assert.equal(beginOfficerContact(loaded, 92, {}).rounds, 4);
loaded.day++;
assert.equal(beginOfficerContact(loaded, 92, {}).rounds, 0);
assert.equal(validSave({ ...fresh(), officerHistory: { day: 1, counts: { 92: 5 } } }), false);
