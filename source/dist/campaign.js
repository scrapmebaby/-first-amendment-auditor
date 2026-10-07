import { clamp, money, transaction } from './core.js';
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
  if (c.reputation >= 25 && !c.homeKnown) {
    c.homeKnown = true;
    notices.push(
      addNotice(
        s,
        'Your home address has spread around the fictional town. Suddenly, you would like some privacy.',
      ),
    );
  }
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
    (s.published >= 8 ||
      c.strikes >= 4 ||
      c.reputation >= 90 ||
      (c.condition === 0 && s.cash < -350 && c.loansTaken >= 8)) &&
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
export function afterUpload(s, clip, cut) {
  const c = s.campaign;
  c.reputation = clamp(
    c.reputation + (cut ? 10 : 6) + Math.min(3, Math.floor(clip.drama / 4)),
    0,
    100,
  );
  c.stress = clamp(c.stress + 5, 0, 100);
  if (cut && clip.drama >= 6) c.strikes++;
  const notices = progressCareer(s);
  if (c.homeKnown && s.published - c.lastHomeUpload >= 2) {
    c.lastHomeUpload = s.published;
    const incident = homeIncident(s);
    if (incident) notices.push(incident.message);
  }
  return notices;
}
export function loanOffer(s) {
  const c = s.campaign;
  return {
    principal: 150,
    rate: Math.min(0.28, 0.05 + c.loansTaken * 0.03),
    fee: 10 + c.loansTaken * 6,
  };
}
export function takeLoan(s) {
  const c = s.campaign;
  if (c.career !== 'auditor')
    return { ok: false, text: 'You left the borrowing spiral with the outrage career.' };
  if (c.loansTaken >= 8)
    return { ok: false, text: 'Eight loans. Even this lender has run out of optimism.' };
  const o = loanOffer(s);
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
  if (s.cash - cost < -350)
    return {
      ok: false,
      text: 'Not enough available credit. A loan could fund repairs—and add more interest.',
    };
  transaction(s, -cost, 'Repair: camera, mount & bruised ambitions');
  c.condition = 100;
  c.repairs++;
  return { ok: true, text: `Equipment repaired for ${money(cost)}.` };
}
export function homeIncident(s) {
  const c = s.campaign;
  if (!c.homeKnown || c.career !== 'auditor') return null;
  const camera = s.gear.includes('security'),
    masked = camera && c.homeIncidents.some((i) => i.recorded),
    lights = s.gear.includes('floodlights');
  const id = c.nextHomeId++,
    type = id % 3 === 0 ? 'trash' : 'lawn';
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
  c.homeIncidents = c.homeIncidents.slice(0, 20);
  c.stress = clamp(c.stress + (masked ? 12 : 8), 0, 100);
  c.homeClock = 0;
  const cost = lights ? 6 : 10;
  transaction(s, -cost, 'Home retaliation: damaged lawn & sanitation supplies');
  const message = masked
    ? 'Someone in a mask shits on your lawn. Your cameras captured everything except a useful identity.'
    : camera
      ? 'Your home camera captures an unmasked visitor fouling the lawn. Suddenly evidence matters to you.'
      : 'Someone fouls your lawn and disappears. No home camera, no usable recording.';
  addNotice(s, message);
  return { ...incident, message };
}
export function cleanLawn(s) {
  const dirty = s.campaign.homeIncidents.filter((i) => !i.cleaned);
  if (!dirty.length) return { ok: false, text: 'Your lawn is clean. Enjoy the unfamiliar peace.' };
  const cost = dirty.length * 12;
  transaction(s, -cost, 'Lawn cleanup: someone else’s content');
  dirty.forEach((i) => (i.cleaned = true));
  s.campaign.stress = clamp(s.campaign.stress - 8, 0, 100);
  return { ok: true, text: `Lawn cleaned for ${money(cost)}. No ad revenue for this footage.` };
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
