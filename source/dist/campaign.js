import { clamp, money, transaction, estimate } from './core.js';
export const SERVICE_JOBS = [
  {
    id: 'coffee',
    name: 'Café assistant',
    place: 'DAILY GRIND',
    x: 26,
    z: 38,
    wage: 32,
    tasks: [
      'Pick up the customer’s order',
      'Bring their coffee over',
      'Wipe the table and say thank you',
    ],
    line: '“Thanks. That’s exactly what I ordered.” No thumbnail necessary.',
  },
  {
    id: 'library',
    name: 'Library aide',
    place: 'PUBLIC LIBRARY',
    x: -22,
    z: -10,
    wage: 35,
    tasks: ['Collect the returned books', 'Shelve them quietly', 'Help a reader find their book'],
    line: 'The librarian recognizes you. Then hands you another book. A second chance, without an audience.',
  },
  {
    id: 'grounds',
    name: 'Town groundskeeper',
    place: 'TAXPAYER PARK',
    x: 59,
    z: 80,
    wage: 38,
    tasks: ['Collect the litter', 'Sweep the footpath', 'Empty the bins and put the tools away'],
    line: 'You clean up someone else’s mess. For once, you know how they felt.',
  },
];
export function chapter(s) {
  const c = s.campaign;
  if (c.career === 'won')
    return {
      number: 6,
      title: 'You gave up. You won.',
      sub: 'The camera is off. Your life is back.',
    };
  if (c.career === 'service')
    return {
      number: 5,
      title: 'An honest day’s work.',
      sub: `${c.shifts}/3 shifts completed. Be useful without an audience.`,
    };
  if (c.demonetized)
    return {
      number: 4,
      title: 'The algorithm has moved on.',
      sub: 'No more ad revenue. The bills haven’t unsubscribed.',
    };
  if (c.homeKnown)
    return {
      number: 3,
      title: 'Public figure. Private lawn.',
      sub: 'The town knows your face. And where you live.',
    };
  if (c.reputation >= 15)
    return {
      number: 2,
      title: 'Everyone knows your angle.',
      sub: 'More recognition. Less patience. More repair bills.',
    };
  return {
    number: 1,
    title: 'The attention economy.',
    sub: 'A stranger with a camera and an overdraft.',
  };
}
export function addNotice(s, text) {
  s.campaign.notices.unshift({ day: s.day, text });
  s.campaign.notices = s.campaign.notices.slice(0, 20);
  return text;
}
export function progressCareer(s) {
  const c = s.campaign;
  const notices = [];
  if (c.career !== 'auditor') return notices;
  if ((s.published >= 4 || c.reputation >= 45) && !c.warning) {
    c.warning = true;
    notices.push(
      addNotice(
        s,
        'Platform warning: repeated confrontation content may lose monetization. Your camera payment is unaffected.',
      ),
    );
  }
  if (
    (s.published >= 20 ||
      c.strikes >= 8 ||
      (c.reputation >= 90 && s.published >= 12) ||
      (c.condition === 0 && s.cash < 65 && !loanOffer(s).eligible)) &&
    !c.demonetized
  ) {
    c.demonetized = true;
    c.stress = clamp(c.stress + 20, 0, 100);
    notices.push(
      addNotice(
        s,
        'CHANNEL DEMONETIZED. Simulated YouTube ad payments have ended. You may keep uploading for $0, or leave the outrage career.',
      ),
    );
  }
  return notices;
}
export function discoveryRisk(s, video) {
  if (!video.views) return 0;
  return clamp(
    0.01 +
      (video.views / 120000) * 0.45 +
      (video.likes / 15000) * 0.1 +
      (s.campaign.exposure || 0) * 0.0012,
    0,
    0.85,
  );
}
export function backlashRisk(s, video = { views: 0 }) {
  return clamp(
    0.025 + (s.campaign.exposure || 0) * 0.003 + (video.views / 250000) * 0.4,
    0.025,
    0.7,
  );
}
export function relationshipFallout(s, random = Math.random) {
  const c = s.campaign,
    type = random() < 0.5 ? 'friends' : 'family';
  const severe = (c.exposure || 0) >= 50;
  const cost = type === 'friends' ? (severe ? 30 : 12) : severe ? 45 : 18;
  const text =
    type === 'friends'
      ? `Friends cancel the shared ride after being recognized through your videos. Replacement travel: ${money(cost)}. Nobody wants a cameo.`
      : `Your fictional family receives unwanted attention linked to your channel. Privacy and phone-filtering costs: ${money(cost)}. They ask you to stop mentioning them.`;
  transaction(
    s,
    -cost,
    `Fallout: ${type === 'friends' ? 'replacement travel after canceled plans' : 'family privacy disruption'}`,
  );
  c.relationshipStrain = clamp((c.relationshipStrain || 0) + (severe ? 12 : 6), 0, 100);
  c.stress = clamp(c.stress + 6, 0, 100);
  c.fallout ??= [];
  c.fallout.unshift({ day: s.day, type, text, cost });
  c.fallout = c.fallout.slice(0, 12);
  return addNotice(s, text);
}
export function afterUpload(s, clip, cut, video = estimate(s, clip, cut), random = Math.random) {
  const c = s.campaign,
    notices = [],
    discovery = discoveryRisk(s, video);
  c.exposure = clamp(
    (c.exposure || 0) + Math.min(20, video.views / 2500 + video.likes / 800),
    0,
    100,
  );
  c.reputation = clamp(
    c.reputation + 1 + Math.min(12, Math.log2(video.views + 1) * 0.5) + (cut ? 2 : 0),
    0,
    100,
  );
  c.stress = clamp(c.stress + 3, 0, 100);
  if (cut && clip.drama >= 6) c.strikes++;
  if (!c.homeKnown && random() < discovery) {
    c.homeKnown = true;
    notices.push(
      addNotice(
        s,
        `Your ${video.views.toLocaleString()}-view upload spreads your identity around the fictional town. Someone connects your channel to your home. Backlash can now reach the lawn and porch.`,
      ),
    );
  }
  if (video.views >= 3000 && random() < backlashRisk(s, video)) {
    if (c.homeKnown && random() < 0.6) {
      const incident = homeIncident(s, random);
      if (incident) notices.push(incident.message);
    } else notices.push(relationshipFallout(s, random));
  }
  notices.push(...progressCareer(s));
  return notices;
}
export function ambientBacklash(s, dt, random = Math.random) {
  const c = s.campaign;
  if (!c.homeKnown || c.career !== 'auditor') return null;
  c.homeClock += dt;
  const interval = 180 - (c.exposure || 0);
  if (c.homeClock < interval) return null;
  c.homeClock = 0;
  return random() < backlashRisk(s) ? homeIncident(s, random) : null;
}
export function loanOffer(s) {
  const c = s.campaign;
  const likes = s.likes ?? 0;
  const limit = Math.min(250, Math.floor((s.published * 15 + likes * 0.08) / 10) * 10);
  const principal = Math.max(0, Math.min(100, Math.floor((limit - c.loanDebt) / 10) * 10));
  const rate = Math.min(0.28, 0.08 + c.loansTaken * 0.02);
  const fee = 8 + c.loansTaken * 4;
  let reason = '';
  if (c.career !== 'auditor' || c.demonetized)
    reason = 'Loans require an active monetized channel.';
  else if (c.loansTaken >= 4) reason = 'Four loans per career. This lender is done.';
  else if (c.lastLoanDay && s.day - c.lastLoanDay < 3)
    reason = `Next loan available on day ${c.lastLoanDay + 3}. Three game days between advances.`;
  else if (s.published - (c.lastLoanUpload ?? 0) < 3 || likes - (c.lastLoanLikes ?? 0) < 150)
    reason = 'Each loan requires 3 new uploads and 150 new likes since your last loan.';
  else if (principal < 30 || principal <= fee)
    reason = 'Not enough credit available. Grow your channel or repay principal.';
  return { principal, rate, fee, limit, eligible: !reason, reason };
}
export function takeLoan(s) {
  const c = s.campaign;
  const o = loanOffer(s);
  if (!o.eligible) return { ok: false, text: o.reason };
  c.lastLoanDay = s.day;
  c.lastLoanUpload = s.published;
  c.lastLoanLikes = s.likes ?? 0;
  c.loansTaken++;
  c.loanRate = o.rate;
  c.loanDebt = Math.round((c.loanDebt + o.principal) * 100) / 100;
  c.borrowed += o.principal;
  s.cash = Math.round((s.cash + o.principal) * 100) / 100;
  s.ledger.unshift({
    day: s.day,
    amount: o.principal,
    label: 'Loan principal — borrowed cash, NOT earnings',
  });
  s.ledger = s.ledger.slice(0, 80);
  transaction(s, -o.fee, 'New loan fee');
  c.stress = clamp(c.stress + 6, 0, 100);
  progressCareer(s);
  return {
    ok: true,
    text: addNotice(
      s,
      `Borrowed ${money(o.principal)}. ${money(o.fee)} fee. ALL outstanding loan debt now accrues ${(o.rate * 100).toFixed(0)}% each game day.`,
    ),
  };
}
export function repayLoan(s) {
  const c = s.campaign,
    amount = Math.min(50, c.loanDebt, Math.max(0, s.cash));
  if (amount <= 0) return { ok: false, text: 'Repayment needs a positive available balance.' };
  s.cash = Math.round((s.cash - amount) * 100) / 100;
  c.loanDebt = Math.round((c.loanDebt - amount) * 100) / 100;
  c.repaid += amount;
  s.ledger.unshift({
    day: s.day,
    amount: -amount,
    label: 'Loan principal repayment — not a new expense',
  });
  s.ledger = s.ledger.slice(0, 80);
  return {
    ok: true,
    text: `Repaid ${money(amount)}. Remaining loan principal: ${money(c.loanDebt)}.`,
  };
}
export function chargeDay(s) {
  const c = s.campaign;
  if (c.career === 'won') return;
  transaction(
    s,
    c.career === 'auditor' ? -8 : -3,
    c.career === 'auditor' ? 'Daily phone, parking & overhead' : 'Ordinary day: bus fare',
  );
  if (s.cash < 0)
    transaction(
      s,
      -Math.round(Math.abs(s.cash) * 0.02 * 100) / 100,
      'Overdraft interest: 2% daily',
    );
  if (c.loanDebt > 0 && c.loanRate > 0)
    transaction(
      s,
      -Math.round(c.loanDebt * c.loanRate * 100) / 100,
      `Loan interest: ${(c.loanRate * 100).toFixed(0)}% daily`,
    );
  if (c.career === 'auditor' && s.gear.includes('security'))
    transaction(s, -7, 'Home CCTV storage subscription');
  if (c.career === 'auditor' && s.gear.includes('floodlights'))
    transaction(s, -3, 'Security floodlight electricity');
  progressCareer(s);
}
export function damageEquipment(s, amount) {
  const c = s.campaign;
  c.condition = clamp(c.condition - amount, 0, 100);
  c.stress = clamp(c.stress + 8, 0, 100);
  progressCareer(s);
  return c.condition === 0
    ? 'Camera destroyed. The last take stops here. Repair it in Gear & crew.'
    : `Equipment battered. Camera condition: ${c.condition}%.`;
}
export function repairEquipment(s) {
  const c = s.campaign;
  if (c.condition >= 100)
    return { ok: false, text: 'Your equipment is fine. Your business model is not.' };
  const cost = Math.round((100 - c.condition) * 0.55) + 10;
  if (s.cash < cost)
    return {
      ok: false,
      text: 'Not enough cash for repairs. Earn from saved footage or qualify for a channel loan.',
    };
  transaction(s, -cost, 'Repair: camera, mount & bruised ambitions');
  c.condition = 100;
  c.repairs++;
  return { ok: true, text: `Equipment repaired for ${money(cost)}.` };
}
export function homeIncident(s, random = Math.random) {
  const c = s.campaign;
  if (!c.homeKnown || c.career !== 'auditor') return null;
  // Never discard an uncleared pile to make room for newer events.
  if (c.homeIncidents.length >= 20) {
    const removable = c.homeIncidents.findLastIndex((i) => i.cleaned);
    if (removable < 0) return null;
    c.homeIncidents.splice(removable, 1);
  }
  const camera = s.gear.includes('security'),
    masked = camera && c.homeIncidents.some((i) => i.recorded),
    lights = s.gear.includes('floodlights');
  const id = c.nextHomeId++,
    type = id % 4 === 0 ? 'porch' : id % 3 === 0 ? 'trash' : 'lawn';
  const incident = {
    id,
    day: s.day,
    type,
    masked,
    recorded: camera,
    identified: camera && !masked,
    cleaned: false,
    reported: false,
    clock: Math.floor(s.minutes),
  };
  c.homeIncidents.unshift(incident);
  c.stress = clamp(c.stress + (masked ? 12 : 8), 0, 100);
  c.homeClock = 0;
  const cost = random() < 0.25 ? (lights ? 8 : 18) : 0;
  if (cost) transaction(s, -cost, 'Home retaliation: damaged gate and landscaping');
  const place = type === 'porch' ? 'porch' : type === 'trash' ? 'yard' : 'lawn';
  const mess = type === 'trash' ? 'dumps trash' : 'leaves a pile of shit';
  const message = `Someone ${masked ? 'in a mask ' : ''}${mess} on your ${place}. ${camera ? (masked ? 'CCTV records a covered face.' : 'CCTV identifies the visitor.') : 'No camera, no recording.'} ${cost ? `Property repairs: ${money(cost)}. ` : ''}Use a doggie bag at home before the HOA inspection.`;
  addNotice(s, message);
  return { ...incident, message };
}
export function cleanLawn(s) {
  const dirty = s.campaign.homeIncidents.filter((i) => !i.cleaned);
  if (!dirty.length) return { ok: false, text: 'Your yard and porch are clean.' };
  if (Math.hypot(s.x + 25, s.z - 83) > 12 || s.driving)
    return {
      ok: false,
      text: 'Walk onto your home lot to pick up the mess. Mark home on the map.',
    };
  if (!s.cleanupBags)
    return {
      ok: false,
      text: 'You need a doggie bag. A pack of five costs $6 in the shop or home menu.',
    };
  const incident = dirty.at(-1);
  incident.cleaned = true;
  s.cleanupBags--;
  s.campaign.stress = clamp(s.campaign.stress - 2, 0, 100);
  if (dirty.length === 1) s.campaign.hoaStreak = 0;
  return {
    ok: true,
    text: `One ${incident.type === 'porch' ? 'porch' : 'yard'} mess bagged. ${dirty.length - 1} remaining. ${s.cleanupBags} bags left. No labor charge.`,
  };
}
export function hoaStatus(s) {
  const now = s.day * 1440 + s.minutes;
  const dirty = s.campaign.homeIncidents.filter((i) => !i.cleaned);
  const overdue = dirty.filter((i) => now - (i.day * 1440 + i.clock) >= 120);
  const next = s.campaign.hoaNextInspection ?? (Math.floor(now / 180) + 1) * 180;
  return {
    dirty: dirty.length,
    overdue: overdue.length,
    nextIn: Math.max(0, next - now),
    fine: Math.min(
      100,
      25 + 10 * (s.campaign.hoaStreak || 0) + 5 * Math.max(0, overdue.length - 1),
    ),
  };
}
export function checkHOA(s) {
  const c = s.campaign,
    now = s.day * 1440 + s.minutes;
  if (c.career === 'won') return null;
  c.hoaNextInspection ??= (Math.floor(now / 180) + 1) * 180;
  if (now < c.hoaNextInspection) return null;
  const status = hoaStatus(s);
  c.hoaNextInspection = (Math.floor(now / 180) + 1) * 180;
  if (!status.overdue) {
    if (!status.dirty) c.hoaStreak = 0;
    return null;
  }
  transaction(s, -status.fine, `HOA: ${status.overdue} neglected yard/porch messes`);
  c.hoaFines = (c.hoaFines || 0) + status.fine;
  c.hoaStreak = (c.hoaStreak || 0) + 1;
  return addNotice(
    s,
    `HOA inspection: ${money(status.fine)} fine for neglected yard/porch mess. Two game hours of grace have passed. Clean up with doggie bags before the next inspection in three game hours.`,
  );
}
export function reportHome(s, id) {
  const incident = s.campaign.homeIncidents.find((i) => i.id === id);
  if (!incident || incident.reported)
    return { ok: false, text: 'This incident is already on file.' };
  incident.reported = true;
  transaction(s, -5, 'Home incident: paperwork and copying');
  return {
    ok: true,
    text: addNotice(
      s,
      incident.identified
        ? 'Officers can identify the unmasked visitor from your home footage. A property-damage complaint is recorded; a payout is not promised.'
        : incident.recorded
          ? 'The mask defeats identification. Police take your footage and a report. The cleanup bill is still yours.'
          : 'Police take your statement. Without footage or an identified suspect, the lawn complaint goes no further today.',
    ),
  };
}
export function startService(s) {
  const c = s.campaign;
  if (!c.demonetized)
    return {
      ok: false,
      text: 'The final career change unlocks after the channel loses monetization.',
    };
  if (c.career !== 'auditor')
    return { ok: false, text: 'You have already left the outrage career.' };
  c.career = 'service';
  c.loanRate = 0;
  c.stress = Math.max(10, c.stress - 20);
  s.gear = s.gear.filter((g) => !['crew', 'crew2'].includes(g));
  s.mask = null;
  s.spray = 0;
  addNotice(
    s,
    'You close the outrage channel, let the crew go, and enroll in a hardship repayment plan. Existing debt remains; the escalating loan interest stops.',
  );
  return {
    ok: true,
    text: 'Find honest work at the café, library or park. Three completed shifts unlock the ending.',
  };
}
export function startShift(s, jobId) {
  const c = s.campaign,
    job = SERVICE_JOBS.find((j) => j.id === jobId);
  if (c.career !== 'service' || !job) return { ok: false, text: 'Accept the new career first.' };
  if (c.serviceTask) return { ok: false, text: 'Finish your current shift first.' };
  if (Math.hypot(s.x - job.x, s.z - job.z) > 12 || s.driving)
    return { ok: false, text: `Walk to ${job.place} to clock in.` };
  c.serviceTask = { jobId, step: 0 };
  return { ok: true, text: job.tasks[0] };
}
export function serviceStep(s) {
  const c = s.campaign,
    task = c.serviceTask,
    job = SERVICE_JOBS.find((j) => j.id === task?.jobId);
  if (c.career !== 'service' || !job) return { ok: false, text: 'Clock in for a shift first.' };
  if (Math.hypot(s.x - job.x, s.z - job.z) > 12 || s.driving)
    return { ok: false, text: 'Return to your workplace to finish the task.' };
  task.step++;
  if (task.step < job.tasks.length) return { ok: true, text: job.tasks[task.step] };
  transaction(s, job.wage, `Honest wages: ${job.name}`);
  const payment = Math.min(c.loanDebt, Math.round(job.wage * 0.25));
  if (payment) {
    s.cash -= payment;
    c.loanDebt -= payment;
    c.repaid += payment;
    s.ledger.unshift({
      day: s.day,
      amount: -payment,
      label: 'Hardship plan: wages toward principal',
    });
    s.ledger = s.ledger.slice(0, 80);
  }
  c.shifts++;
  c.reputation = Math.max(0, c.reputation - 10);
  c.stress = Math.max(0, c.stress - 15);
  s.society = clamp(s.society + 3, -100, 0);
  c.serviceTask = null;
  addNotice(s, job.line);
  return {
    ok: true,
    complete: true,
    text: `Shift complete. ${money(job.wage)} earned${payment ? `; ${money(payment)} toward your debt` : ''}. ${job.line}`,
  };
}
export function finishCareer(s) {
  const c = s.campaign;
  if (c.career !== 'service' || c.shifts < 3)
    return {
      ok: false,
      text: 'Complete three honest shifts before putting the camera away for good.',
    };
  c.career = 'won';
  c.stress = 0;
  c.serviceTask = null;
  addNotice(s, 'YOU GAVE UP. YOU WON. Nobody subscribed to your recovery. You did it anyway.');
  return { ok: true, text: 'You are no longer the main character in everyone else’s worst day.' };
}
