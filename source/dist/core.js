import { MERCH } from './appearance.js';
export const VERSION = 1;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const money = (v) => `${v < 0 ? '−' : ''}$${Math.abs(v).toFixed(2)}`;
export const ITEMS = [
  {
    id: 'merchPress',
    name: 'Press for Views shirt',
    price: 18,
    icon: '♜',
    desc: 'Your own merch. Automatically equips; visible in town and mirrors. No revenue bonus.',
  },
  {
    id: 'merchTax',
    name: 'Taxpayer Funded shirt',
    price: 28,
    icon: '♜',
    desc: 'An uncomfortably honest shirt. Automatically equips; visible in mirrors. No revenue bonus.',
  },
  {
    id: 'camera',
    name: 'Actual camera',
    price: 85,
    icon: '▣',
    desc: 'Retire the cracked phone. +35% video reach. $4 upkeep per upload.',
  },
  {
    id: 'gimbal',
    name: 'Moral stabilizer',
    price: 55,
    icon: '⌁',
    desc: 'Steadier footage. Shakier principles. +20% reach; $3 upkeep.',
  },
  {
    id: 'mic',
    name: 'Professional outrage mic',
    price: 45,
    icon: '♩',
    desc: 'Hear every “please stop.” +15% reach; $2 upkeep. Music still spoils takes.',
  },
  {
    id: 'clown',
    name: 'Clown mask',
    price: 25,
    icon: '♧',
    desc: 'Finally, some honest branding. Locals lose patience faster.',
  },
  {
    id: 'poop',
    name: 'Piece of shit mask',
    price: 30,
    icon: '♨',
    desc: 'A statement piece. Mostly a statement about you.',
  },
  {
    id: 'crew',
    name: 'Your first yes-person',
    price: 65,
    icon: '♟',
    desc: '“I’m with stupid” shirt included. +30% reach. $18 wages per upload.',
  },
  {
    id: 'crew2',
    name: 'A second yes-person',
    price: 90,
    icon: '♟♟',
    desc: 'Double the agreement. +20% reach. Another $18 per upload.',
    requires: 'crew',
  },
  {
    id: 'security',
    name: 'Home security cameras',
    price: 70,
    icon: '◉',
    desc: 'Record lawn intruders. They learn to wear masks. $7 daily storage subscription.',
  },
  {
    id: 'floodlights',
    name: 'Security floodlights',
    price: 45,
    icon: '☼',
    desc: 'Reduce nightly property damage costs. They do not reveal masked faces. $3 daily electricity.',
  },
  {
    id: 'spray',
    name: 'Pepper spray / mace',
    price: 20,
    icon: '▥',
    desc: 'Three charges. Automatically mace civilians who shove you or your camera. Manual use is also available.',
  },
];
export function fresh() {
  return {
    version: VERSION,
    gender: 'male',
    genderChosen: false,
    officerHistory: { day: 1, counts: {} },
    settlementGross: 0,
    settlementFees: 0,
    claimFilingFees: 0,
    taxpayerCost: 0,
    hospitalBills: 0,
    cash: 0,
    revenue: 0,
    expenses: 0,
    views: 0,
    likes: 0,
    society: 0,
    health: 100,
    day: 1,
    minutes: 540,
    x: 7,
    z: 10,
    carHeading: 0,
    carX: 4,
    carZ: 16,
    driving: false,
    gear: [],
    mask: null,
    merch: null,
    viewMode: 'overhead',
    lookYaw: Math.PI,
    lookPitch: 0,
    mirrorSeed: Math.floor(Math.random() * 1e9),
    spray: 0,
    clips: [],
    conversationMemory: {},
    ledger: [],
    published: 0,
    claims: 0,
    nextId: 1,
    tutorial: true,
    profanity: false,
    sound: false,
    voices: false,
    voiceVolume: 0.8,
    music: true,
    weather: 'living',
    campaign: {
      reputation: 0,
      condition: 100,
      stress: 0,
      homeKnown: false,
      homeIncidents: [],
      homeClock: 0,
      lastHomeUpload: 0,
      nextHomeId: 1,
      notices: [],
      warning: false,
      demonetized: false,
      strikes: 0,
      loansTaken: 0,
      lastLoanUpload: 0,
      lastLoanLikes: 0,
      loanDebt: 0,
      loanRate: 0,
      borrowed: 0,
      repaid: 0,
      career: 'auditor',
      shifts: 0,
      serviceTask: null,
      hospitals: 0,
      repairs: 0,
    },
  };
}
export function transaction(s, amount, label) {
  s.cash = Math.round((s.cash + amount) * 100) / 100;
  if (amount > 0) s.revenue += amount;
  else s.expenses -= amount;
  s.ledger.unshift({ amount, label, day: s.day });
  s.ledger = s.ledger.slice(0, 80);
}
export function buy(s, id) {
  if (s.campaign?.career && s.campaign.career !== 'auditor')
    return { ok: false, text: 'The outrage career is over. You no longer need this equipment.' };
  const item = ITEMS.find((i) => i.id === id);
  if (!item) return { ok: false, text: 'Unknown equipment.' };
  if (item.requires && !s.gear.includes(item.requires))
    return { ok: false, text: 'Hire your first crew member first.' };
  if (s.gear.includes(id) && id !== 'spray') return { ok: false, text: 'Already owned.' };
  if (s.cash < item.price)
    return {
      ok: false,
      text: `Need ${money(item.price - s.cash)} more cash. Shops do not offer automatic credit.`,
    };
  transaction(s, -item.price, `Gear: ${item.name}`);
  if (!s.gear.includes(id)) s.gear.push(id);
  if (MERCH[id]) s.merch = id;
  if (id === 'spray') s.spray += 3;
  if (id === 'clown' || id === 'poop') s.mask = id;
  return { ok: true, text: `${item.name} acquired. Financial wisdom not included.` };
}
export function estimate(s, c, cut) {
  let mult = 1;
  for (const [g, m] of [
    ['camera', 0.35],
    ['gimbal', 0.2],
    ['mic', 0.15],
    ['crew', 0.3],
    ['crew2', 0.2],
  ])
    if (s.gear.includes(g)) mult += m;
  mult *= 0.35 + (0.65 * (s.campaign?.condition ?? 100)) / 100;
  // Saved per take: reopening the editor or changing the title never rerolls reach.
  const audience = c.audience ?? (c.id * 0.61803398875) % 1;
  const reach = audience < 0.15 ? 0.45 : audience < 0.8 ? 0.9 + audience : 2.5 + audience;
  const views = Math.round(
    (Math.min(c.seconds, 90) * 45 + c.drama * 180 + 80) * mult * (cut ? 2.1 : 1) * reach,
  );
  const likes = Math.floor(views * (0.012 + audience * 0.028));
  const rpm = 4.5 + audience * 6;
  const income = c.music || s.campaign?.demonetized ? 0 : Math.round((views * rpm) / 10) / 100;
  let cost = 3.5 + (cut ? 4.5 : 1);
  for (const [g, v] of [
    ['camera', 4],
    ['gimbal', 3],
    ['mic', 2],
    ['crew', 18],
    ['crew2', 18],
  ])
    if (s.gear.includes(g)) cost += v;
  return { views, likes, rpm, income, cost, net: Math.round((income - cost) * 100) / 100 };
}
export function publish(s, id, cut, title) {
  const c = s.clips.find((x) => x.id === id);
  if (!c || (s.campaign?.career && s.campaign.career !== 'auditor')) return null;
  const e = estimate(s, c, cut);
  transaction(s, e.income, `Ad revenue: ${title || 'Local person has a normal response'}`);
  transaction(s, -e.cost, 'Editing, data, equipment & crew');
  s.views += e.views;
  s.likes = (s.likes ?? 0) + e.likes;
  s.published++;
  s.society = clamp(s.society - (cut ? 3 : 0), -100, 0);
  s.clips = s.clips.filter((x) => x.id !== id);
  return e;
}
export function finishClip(s, record, audience = Math.random()) {
  if (record.seconds < 3) return null;
  const clip = {
    id: s.nextId++,
    audience: clamp(audience, 0, 1),
    place: record.place,
    person: record.person,
    seconds: Math.floor(record.seconds),
    drama: record.drama,
    music: record.music,
    touched: record.touched,
    day: s.day,
    events: record.events || [],
  };
  s.clips.push(clip);
  return clip;
}
export function resolveClaim(s, e, r = Math.random()) {
  if (!e || e.claimResolved)
    return { kind: 'dismissed', payout: 0, text: 'This claim has already been processed.' };
  e.claimResolved = true;
  s.claims++;
  const filing = 12,
    defense = 75;
  transaction(s, -filing, 'Civil claim filing / paperwork');
  s.claimFilingFees = (s.claimFilingFees ?? 0) + filing;
  s.taxpayerCost = (s.taxpayerCost ?? 0) + defense;
  const strong = e.recordedMisconduct && e.officerMisconduct;
  const eligible = strong || (e.touched && !e.playerSprayed);
  const forceEvidence = strong && e.officerForce && e.recordedForce;
  const chance = strong ? (forceEvidence ? 0.7 : 0.45) : 0.2;
  if (eligible && r < chance) {
    const min = strong ? (forceEvidence ? 600 : 300) : 150;
    const range = strong ? (forceEvidence ? 1200 : 600) : 250;
    const payout = min + Math.floor((r / chance) * range);
    const legalFees = Math.round(payout * 0.3 * 100) / 100;
    transaction(s, payout, 'City settlement — taxpayer-funded (fictional)');
    transaction(s, -legalFees, 'Settlement lawyer fee: 30%');
    s.settlementGross = (s.settlementGross ?? 0) + payout;
    s.settlementFees = (s.settlementFees ?? 0) + legalFees;
    s.taxpayerCost += payout;
    s.society = clamp(s.society - 2, -100, 0);
    return {
      kind: 'settled',
      payout,
      legalFees,
      net: Math.round((payout - legalFees - filing) * 100) / 100,
      taxpayerCost: payout + defense,
      text: `Won ${money(payout)} from the city. Lawyer: ${money(legalFees)}. Filing: ${money(filing)}. Net gain: ${money(payout - legalFees - filing)}. Taxpayer cost: ${money(payout + defense)} including ${money(defense)} city legal costs. Hospital and repair bills remain separate.`,
    };
  }
  return {
    kind: 'dismissed',
    payout: 0,
    net: -filing,
    taxpayerCost: defense,
    text: `Claim dismissed. Your filing cost: ${money(filing)}. City legal costs charged to taxpayers: ${money(defense)}. Civilian contact or demanding a supervisor does not guarantee city liability.`,
  };
}
export function validSave(o) {
  if (o?.officerHistory !== undefined) {
    const h = o.officerHistory;
    if (
      !h ||
      !Number.isSafeInteger(h.day) ||
      h.day < 1 ||
      !h.counts ||
      typeof h.counts !== 'object' ||
      Array.isArray(h.counts) ||
      Object.keys(h.counts).length > 10 ||
      !Object.entries(h.counts).every(
        ([id, count]) => /^9[0-9]$/.test(id) && Number.isInteger(count) && count >= 0 && count <= 4,
      )
    )
      return false;
  }
  if (o?.gender !== undefined && !['male', 'female'].includes(o.gender)) return false;
  if (o?.genderChosen !== undefined && typeof o.genderChosen !== 'boolean') return false;
  for (const key of [
    'settlementGross',
    'settlementFees',
    'claimFilingFees',
    'taxpayerCost',
    'hospitalBills',
  ])
    if (o?.[key] !== undefined && (!Number.isFinite(o[key]) || o[key] < 0 || o[key] > 1e9))
      return false;
  if (
    o?.pendingReport &&
    [
      'officerMisconduct',
      'officerForce',
      'recordedForce',
      'recordedMisconduct',
      'supervisorRequested',
      'supervisorReviewed',
      'disciplineReferral',
      'claimResolved',
    ].some((key) => o.pendingReport[key] !== undefined && typeof o.pendingReport[key] !== 'boolean')
  )
    return false;
  if (
    o?.conversationMemory !== undefined &&
    (!o.conversationMemory ||
      typeof o.conversationMemory !== 'object' ||
      Array.isArray(o.conversationMemory) ||
      Object.keys(o.conversationMemory).length > 32 ||
      !Object.entries(o.conversationMemory).every(
        ([id, count]) =>
          /^[1-9][0-9]?$/.test(id) && Number.isSafeInteger(count) && count >= 0 && count <= 10000,
      ))
  )
    return false;
  if (o?.voices !== undefined && typeof o.voices !== 'boolean') return false;
  if (
    o?.voiceVolume !== undefined &&
    (!Number.isFinite(o.voiceVolume) || o.voiceVolume < 0 || o.voiceVolume > 1)
  )
    return false;
  if (o?.likes !== undefined && (!Number.isSafeInteger(o.likes) || o.likes < 0)) return false;
  if (o?.viewMode !== undefined && !['overhead', 'first'].includes(o.viewMode)) return false;
  if (o?.lookYaw !== undefined && (!Number.isFinite(o.lookYaw) || Math.abs(o.lookYaw) > Math.PI))
    return false;
  if (o?.lookPitch !== undefined && (!Number.isFinite(o.lookPitch) || Math.abs(o.lookPitch) > 1))
    return false;
  if (
    o?.mirrorSeed !== undefined &&
    (!Number.isInteger(o.mirrorSeed) || o.mirrorSeed < 0 || o.mirrorSeed > 1e9)
  )
    return false;
  if (
    o?.merch != null &&
    (!Object.hasOwn(MERCH, o.merch) || !Array.isArray(o.gear) || !o.gear.includes(o.merch))
  )
    return false;
  if (o?.music !== undefined && typeof o.music !== 'boolean') return false;
  if (
    o?.carHeading !== undefined &&
    (!Number.isFinite(o.carHeading) || Math.abs(o.carHeading) > Math.PI)
  )
    return false;
  if (o?.profanity !== undefined && typeof o.profanity !== 'boolean') return false;
  if (!o || o.version !== VERSION || !validCampaign(o.campaign)) return false;
  for (const k of [
    'cash',
    'revenue',
    'expenses',
    'views',
    'society',
    'health',
    'day',
    'minutes',
    'x',
    'z',
    'carX',
    'carZ',
    'published',
    'claims',
    'nextId',
    'spray',
  ])
    if (typeof o[k] !== 'number' || !Number.isFinite(o[k])) return false;
  if (
    o.health < 0 ||
    o.health > 100 ||
    o.society > 0 ||
    o.society < -100 ||
    Math.abs(o.x) > 89 ||
    Math.abs(o.z) > 89 ||
    Math.abs(o.carX) > 89 ||
    Math.abs(o.carZ) > 89 ||
    o.cash < -1e8 ||
    Math.abs(o.cash) > 1e9 ||
    o.minutes < 0 ||
    o.minutes >= 1440 ||
    o.day < 1 ||
    o.spray < 0
  )
    return false;
  if (
    !Array.isArray(o.gear) ||
    !o.gear.every((g) => ITEMS.some((i) => i.id === g)) ||
    !Array.isArray(o.clips) ||
    o.clips.length > 300 ||
    !Array.isArray(o.ledger) ||
    o.ledger.length > 80
  )
    return false;
  if (
    !o.clips.every(
      (c) =>
        Number.isInteger(c.id) &&
        (c.audience === undefined ||
          (Number.isFinite(c.audience) && c.audience >= 0 && c.audience <= 1)) &&
        typeof c.place === 'string' &&
        typeof c.person === 'string' &&
        Number.isFinite(c.seconds) &&
        c.seconds >= 3 &&
        c.seconds < 1e6 &&
        Number.isFinite(c.drama) &&
        c.drama >= 0 &&
        c.drama <= 100 &&
        typeof c.music === 'boolean' &&
        typeof c.touched === 'boolean',
    )
  )
    return false;
  if (
    !o.ledger.every(
      (l) => Number.isFinite(l.amount) && typeof l.label === 'string' && Number.isFinite(l.day),
    )
  )
    return false;
  if (o.mask !== null && !['clown', 'poop'].includes(o.mask)) return false;
  if (
    !o.clips.every(
      (c) =>
        c.mediaKey === undefined || (typeof c.mediaKey === 'string' && c.mediaKey.length <= 80),
    )
  )
    return false;
  if (
    o.weather !== undefined &&
    !['living', 'clear', 'golden', 'overcast', 'rain', 'fog'].includes(o.weather)
  )
    return false;
  if (
    o.pendingReport &&
    !['touched', 'playerSprayed', 'arrest'].every((k) => typeof o.pendingReport[k] === 'boolean')
  )
    return false;
  if (
    o.pendingReport &&
    ['escaped', 'needsWrittenStatement', 'statementFiled', 'equipmentDamage'].some(
      (k) => o.pendingReport[k] !== undefined && typeof o.pendingReport[k] !== 'boolean',
    )
  )
    return false;
  if (
    o.pendingReport?.writtenStatement !== undefined &&
    (typeof o.pendingReport.writtenStatement !== 'string' ||
      o.pendingReport.writtenStatement.length > 500)
  )
    return false;
  if (
    o.pendingReport?.unprovokedSpray !== undefined &&
    typeof o.pendingReport.unprovokedSpray !== 'boolean'
  )
    return false;
  if (
    !o.clips.every(
      (c) =>
        c.events === undefined ||
        (Array.isArray(c.events) &&
          c.events.length <= 30 &&
          c.events.every((e) => Number.isFinite(e.at) && typeof e.event === 'string')),
    )
  )
    return false;
  return true;
}

export function migrateSave(o) {
  const base = fresh();
  return {
    ...base,
    ...o,
    genderChosen: o.genderChosen ?? true,
    mirrorSeed: o.mirrorSeed ?? 1977,
    moving: false,
    carSpeed: 0,
    route: undefined,
    routeGoal: null,
    campaign: {
      ...base.campaign,
      ...o.campaign,
      lastLoanUpload: o.campaign?.lastLoanUpload ?? (o.campaign?.loansTaken ? o.published : 0),
      lastLoanLikes: o.campaign?.lastLoanLikes ?? (o.campaign?.loansTaken ? (o.likes ?? 0) : 0),
      reputation: o.campaign?.reputation ?? Math.min(89, o.published * 8),
    },
  };
}
export function validCampaign(c) {
  if (c === undefined) return true;
  if (!c || typeof c !== 'object') return false;
  for (const key of ['lastLoanUpload', 'lastLoanLikes'])
    if (c[key] !== undefined && (!Number.isSafeInteger(c[key]) || c[key] < 0)) return false;
  const nums = {
    reputation: [0, 100],
    condition: [0, 100],
    stress: [0, 100],
    homeClock: [0, 1e7],
    lastHomeUpload: [0, 1e7],
    nextHomeId: [1, 1e7],
    strikes: [0, 1e7],
    loansTaken: [0, 8],
    loanDebt: [0, 1e8],
    loanRate: [0, 0.28],
    borrowed: [0, 1e8],
    repaid: [0, 1e8],
    shifts: [0, 1e7],
    hospitals: [0, 1e7],
    repairs: [0, 1e7],
  };
  for (const [k, [min, max]] of Object.entries(nums))
    if (!Number.isFinite(c[k]) || c[k] < min || c[k] > max) return false;
  for (const k of ['homeKnown', 'warning', 'demonetized'])
    if (typeof c[k] !== 'boolean') return false;
  if (!['auditor', 'service', 'won'].includes(c.career)) return false;
  if (
    !Array.isArray(c.homeIncidents) ||
    c.homeIncidents.length > 20 ||
    !c.homeIncidents.every(
      (i) =>
        Number.isInteger(i.id) &&
        Number.isFinite(i.day) &&
        Number.isFinite(i.clock) &&
        ['lawn', 'trash'].includes(i.type) &&
        ['masked', 'recorded', 'identified', 'cleaned', 'reported'].every(
          (k) => typeof i[k] === 'boolean',
        ),
    )
  )
    return false;
  if (
    !Array.isArray(c.notices) ||
    c.notices.length > 20 ||
    !c.notices.every(
      (n) => Number.isFinite(n.day) && typeof n.text === 'string' && n.text.length < 2000,
    )
  )
    return false;
  if (
    c.serviceTask !== null &&
    (!c.serviceTask ||
      !['coffee', 'library', 'grounds'].includes(c.serviceTask.jobId) ||
      !Number.isInteger(c.serviceTask.step) ||
      c.serviceTask.step < 0 ||
      c.serviceTask.step > 2)
  )
    return false;
  if (c.career !== 'auditor' && !c.demonetized) return false;
  if (c.career === 'won' && c.shifts < 3) return false;
  return true;
}
