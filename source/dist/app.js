import { Banter } from './banter.js';
import { TouchInput } from './touch-input.js';
import { Controller } from './controller.js';
import { MERCH, mirrorSites, viewMovement } from './appearance.js';
import { Navigator, drive, slide } from './movement.js';
import { Dialogue, language } from './dialogue.js';
import {
  fresh,
  clamp,
  money,
  ITEMS,
  buy,
  publish,
  estimate,
  finishClip,
  resolveClaim,
  validSave,
  migrateSave,
} from './core.js';
import { LOCATIONS, collision, locationAt } from './world.js';
import { ThreeWorld as World } from './three-world.js';
import { CAST, ALL_CHARACTERS } from './characters.js';
import { CastStudio } from './cast-studio.js';
import { transaction } from './core.js';
import { WEATHER } from './atmosphere.js';
import { TownAudio } from './audio.js';
import { GameCapture } from './capture.js';
import {
  SERVICE_JOBS,
  chapter,
  addNotice,
  progressCareer,
  afterUpload,
  loanOffer,
  takeLoan,
  repayLoan,
  chargeDay,
  damageEquipment,
  repairEquipment,
  homeIncident,
  cleanLawn,
  reportHome,
  startService,
  startShift,
  serviceStep,
  finishCareer,
} from './campaign.js';
// Keep deterministic encounter QA separate from the renderer's random UUIDs.
let encounterTestRoll = null;
const rollEncounter = () => (encounterTestRoll === null ? Math.random() : encounterTestRoll);
const townAudio = new TownAudio(),
  capture = new GameCapture();
const $ = (id) => document.getElementById(id),
  esc = (value) =>
    language(value, s.profanity).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
// Move the existing controls into one accessible pause dialog; keep their handlers and IDs.
for (const element of [
  document.querySelector('header'),
  document.querySelector('aside'),
  document.querySelector('footer'),
])
  $('menuContents').append(element);
const controller = new Controller();
let padInput = controller.poll([]);
const touchInput = new TouchInput($('thumbstick'), $('stickKnob'), [
  ...document.querySelectorAll('[data-pedal]'),
]);
const menuOpen = () => $('modal').open || $('gameMenu').open;
const mapHost = document.querySelector('.minimap');
const touchLayout = matchMedia('(pointer: coarse), (max-width: 750px)');
function setMapOpen(open) {
  mapHost.classList.toggle('map-open', open);
  $('mapToggle').setAttribute('aria-expanded', String(open));
  $('mapToggle').setAttribute('aria-label', open ? 'Hide town map' : 'Show town map');
}
$('mapToggle').onclick = () => setMapOpen(!mapHost.classList.contains('map-open'));
$('closeMap').onclick = () => {
  setMapOpen(false);
  $('mapToggle').focus({ preventScroll: true });
};
touchLayout.addEventListener('change', () => setMapOpen(false));
window.addEventListener(
  'pointerdown',
  (e) => {
    if (touchLayout.matches && !e.target.closest('#townMap,#mapToggle')) setMapOpen(false);
  },
  { capture: true },
);
const SAVE = 'first-amendment-auditor-v1';
let s = fresh(),
  saveFailed = false,
  loadWarning = '';
try {
  const raw = localStorage.getItem(SAVE);
  if (raw) {
    const saved = JSON.parse(raw);
    if (validSave(saved)) s = migrateSave(saved);
    else loadWarning = 'The stored save is incompatible. A fresh session is ready.';
  }
} catch {
  loadWarning = 'Browser storage is unavailable. Use Export save to keep your progress.';
  saveFailed = true;
}
progressCareer(s);
const world = new World($('world'), $('labels'));
world.atmosphere.choice = s.weather || 'living';
$('engine').textContent = await world.init();
if (!world.camera) s.viewMode = 'overhead';
let keys = new Set(),
  destination = null,
  record = null,
  target = null,
  encounter = null,
  modalType = null,
  last = performance.now(),
  uiTimer = 0,
  saveTimer = 0,
  eventTimer = 0,
  toastTimer = null,
  speechTimer = 0,
  speechActor = null,
  muted = !s.sound,
  policeEvent = null,
  engageCooldown = 0;
const names = CAST.map((c) => `${c.name} · ${c.role.toLowerCase()}`);
const colors = [
  '#8a9070',
  '#a57557',
  '#859daa',
  '#c3ab72',
  '#7b8868',
  '#ad8580',
  '#92a6a0',
  '#b99976',
];
const npcSpawns = [
  [11, 6],
  [-22, -10],
  [-24, 37],
  [26, 38],
  [9, -23],
  [-9, 23],
  [-65, 39],
  [38, 23],
  [20, -8],
  [-12, -28],
  [-27, 58],
  [58, 64],
  [11, 26],
  [35, -22],
  [-38, 12],
  [62, -7],
  [23, -54],
  [-60, -9],
];
let npcs = npcSpawns.map(([x, z], i) => ({
  id: i + 1,
  name: names[i % names.length],
  x,
  z,
  homeX: x,
  homeZ: z,
  color: colors[i % colors.length],
  skin: ['#c79d7d', '#9e7151', '#dabb99', '#80573e'][i % 4],
  hair: ['#655948', '#3e473a', '#9a896b'][i % 3],
  patience: 100,
  drama: 0,
  touched: false,
  music: false,
  flee: 0,
  cooldown: 0,
  stinkUntil: 0,
  moving: false,
  gender: i % 2 ? 'woman' : 'man',
  emotion: null,
  emotionUntil: 0,
  temperament: ['irritable', 'anxious', 'defiant', 'avoidant'][i % 4],
  inCustody: false,
}));
function resetLocals() {
  activeBanter = null;
  conversationLines.length = 0;
  $('conversation').classList.add('hidden');
  pendingBarks.length = 0;
  for (const n of npcs)
    Object.assign(n, {
      x: n.homeX,
      z: n.homeZ,
      patience: 100,
      drama: 0,
      touched: false,
      music: false,
      flee: 0,
      cooldown: 0,
      stinkUntil: 0,
      moving: false,
      walkGoal: null,
      routeGoal: null,
      escapeGoal: null,
      pauseUntil: 0,
      emotion: null,
      emotionUntil: 0,
      inCustody: false,
      sprayReplyAt: 0,
      suspectReplyAt: 0,
    });
}
const dialogue = new Dialogue();
const line = (event, n = target) =>
  dialogue.pick(event, {
    explicit: s.profanity,
    place: locationAt(n?.x ?? s.x, n?.z ?? s.z).name,
    weather: world.atmosphere.current,
  });
let ambientClock = 0;
const pendingBarks = [];
const banter = new Banter();
let activeBanter = null;
const conversationLines = [];
let conversationUntil = 0;
function renderConversation(append = false) {
  const list = $('conversationLines');
  if (!append) list.replaceChildren();
  for (const item of conversationLines.slice(append ? -1 : -4)) {
    const row = document.createElement('p'),
      speaker = document.createElement('strong'),
      words = document.createElement('span');
    row.className = item.auditor ? 'auditor-line' : 'civilian-line';
    speaker.textContent = item.speaker;
    words.textContent = language(item.text, s.profanity);
    row.append(speaker, words);
    list.append(row);
  }
  while (list.childElementCount > 4) list.firstElementChild.remove();
  list.scrollTop = list.scrollHeight;
}
function conversationLine(n, text) {
  const auditor = n === s;
  conversationLines.push({
    auditor,
    speaker: auditor
      ? 'YOU · AUDITOR'
      : /^OFFICER:/.test(text)
        ? 'OFFICER'
        : n.name?.split(' · ')[0] || 'LOCAL',
    text: text.replace(/^(?:AUDITOR|OFFICER):\s*/, '').replace(/^[“”]|[“”]$/g, ''),
  });
  if (conversationLines.length > 12) conversationLines.shift();
  renderConversation(true);
  conversationUntil = world.time + 15;
  $('conversation').classList.remove('hidden');
}
function tickBanter() {
  const b = activeBanter;
  if (!b) return;
  if (
    policeEvent ||
    s.driving ||
    b.n.inCustody ||
    b.n.flee > 0 ||
    Math.hypot(b.n.x - s.x, b.n.z - s.z) > 10 ||
    (b.recorded && (!record || record.npcId !== b.n.id))
  ) {
    activeBanter = null;
    return;
  }
  if (b.turn >= 4) {
    activeBanter = null;
    return;
  }
  if (world.time < b.at || (b.recorded && b.turn === 1)) return;
  const actor = b.turn % 2 === 0 ? s : b.n;
  const text = b.lines[b.turn++];
  say(actor, text);
  captured((actor === s ? 'AUDITOR: ' : b.n.name + ': ') + text);
  b.at = world.time + 3.4;
}
function startBanter(n) {
  if (!activeBanter || activeBanter.n !== n) {
    conversationLines.length = 0;
    $('conversationLines').replaceChildren();
  }
  const lines = banter.pick({
    place: locationAt(n.x, n.z).name,
    weather: world.atmosphere.current,
    reputation: s.campaign.reputation,
    patience: n.patience,
    explicit: s.profanity,
  });
  n.pauseUntil = Math.max(n.pauseUntil || 0, world.time + 9);
  activeBanter = { n, lines, turn: 1, at: world.time + 1.3, recorded: !!record };
  say(s, 'AUDITOR: “' + lines[0] + '”');
  captured('AUDITOR: ' + lines[0]);
}
function bark(n, event) {
  let text;
  if (activeBanter?.n === n && activeBanter.turn === 1 && ['plea', 'argue'].includes(event)) {
    text = activeBanter.lines[1];
    activeBanter.turn = 2;
    activeBanter.at = world.time + 3.4;
  } else {
    if (activeBanter?.n === n) activeBanter = null;
    text = line(event, n);
  }
  say(n, '“' + text + '”');
  captured(n.name + ': ' + text);
}
function scheduleBark(n, event, delay = 2) {
  pendingBarks.push({ n, event, at: world.time + delay });
  if (pendingBarks.length > 4) pendingBarks.shift();
}
function notify(t) {
  $('toast').textContent = language(t, s.profanity);
  $('toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4300);
}
function say(n, text) {
  text = language(text, s.profanity);
  conversationLine(n, text);
  if (
    n.id >= 1 &&
    n.id <= CAST.length &&
    !(n.emotionUntil > world.time) &&
    /stop|filmed|leaving|privacy|space/i.test(text)
  ) {
    n.emotion = 'refuse';
    n.emotionUntil = world.time + 3;
  }
  speechActor = n;
  $('speech').textContent = text;
  $('speech').classList.remove('hidden');
  speechTimer = 4.5;
  n.said = text;
}
function save() {
  try {
    const clean = { ...s, moving: false, carSpeed: 0 };
    delete clean.route;
    delete clean.routeGoal;
    localStorage.setItem(SAVE, JSON.stringify(clean));
    saveFailed = false;
    $('saveStatus').textContent = '● Saved locally';
  } catch {
    saveFailed = true;
    $('saveStatus').textContent = '! Export to save';
  }
}
function sound(freq = 420, dur = 0.09) {
  if (muted) return;
  try {
    const a = sound.ctx || (sound.ctx = new (window.AudioContext || window.webkitAudioContext)());
    if (a.state === 'suspended') a.resume();
    const o = a.createOscillator(),
      g = a.createGain();
    o.frequency.value = freq;
    o.type = 'triangle';
    g.gain.setValueAtTime(0.035, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
    o.connect(g);
    g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + dur);
  } catch {}
}
function nearest() {
  return (
    npcs
      .filter(
        (n) =>
          n.cooldown <= 0 &&
          !n.inCustody &&
          (s.viewMode !== 'first' ||
            Math.sin(s.lookYaw) * (n.x - s.x) + Math.cos(s.lookYaw) * (n.z - s.z) >
              Math.hypot(n.x - s.x, n.z - s.z) * 0.25),
      )
      .sort((a, b) => Math.hypot(a.x - s.x, a.z - s.z) - Math.hypot(b.x - s.x, b.z - s.z))
      .find((n) => Math.hypot(n.x - s.x, n.z - s.z) < 9) || null
  );
}
function toggleFilm() {
  if (s.campaign.career !== 'auditor') {
    notify('The camera stays off in your new career.');
    return;
  }
  if (!record && s.campaign.condition <= 0) {
    notify('Your camera is destroyed. Repair it in Gear & crew.');
    return;
  }
  if (s.driving) {
    notify('Park and get out first. Your car is already making a scene.');
    return;
  }
  if (record) {
    stopRecording();
    return;
  }
  if (!target) {
    notify('Get closer to a local to begin an encounter.');
    return;
  }
  if (s.clips.length >= 30) {
    notify('Your storage is full. Publish some footage at the editing desk.');
    return;
  }
  encounter =
    encounter?.npcId === target.id
      ? encounter
      : { npcId: target.id, touched: false, playerSprayed: false, called: false };
  if (s.campaign.reputation >= 20) target.patience = Math.min(target.patience, 85);
  eventTimer = 0;
  record = {
    events: [],
    seconds: 0,
    drama: target.drama,
    music: target.music,
    touched: encounter.touched,
    place: locationAt(s.x, s.z).name,
    person: target.name,
    npcId: target.id,
  };
  record.hasVideo = capture.start(world);
  bark(target, s.campaign.reputation >= 20 ? 'recognize' : 'plea');
  notify('Recording. Press Space to engage, F to wrap the take.');
  sound(610);
  updateUI();
}
function stopRecording() {
  activeBanter = null;
  pendingBarks.length = 0;
  if (!record) return;
  const c = finishClip(s, record);
  if (c && record.hasVideo) {
    c.mediaKey = crypto.randomUUID();
    capture.stop(c.mediaKey);
  } else capture.stop(null);
  record = null;
  if (c) {
    notify(`${c.seconds}s of “journalism” saved. Open the editing desk to publish.`);
    sound(360);
  } else notify('Too short to publish. Capture at least three seconds.');
  save();
  updateUI();
}
function engage() {
  if (s.campaign.career === 'service') {
    doServiceWork();
    return;
  }
  if (s.campaign.career === 'won') {
    notify('You let people get on with their day.');
    return;
  }
  if (engageCooldown > 0) return;
  engageCooldown = 2.8;
  if (s.driving) {
    notify('Your rusty sedan isn’t a press credential. Get out first.');
    return;
  }
  if (!target) {
    notify('No one close enough to hear your legal jargon.');
    return;
  }
  const n = record ? npcs.find((n) => n.id === record.npcId) : target;
  if (record && Math.hypot(n.x - s.x, n.z - s.z) > 9) {
    notify('Your subject has moved out of conversational range.');
    return;
  }
  if (n.flee > 0) {
    bark(n, 'leave');
    return;
  }
  if (!record) {
    startBanter(n);
    updateUI();
    return;
  }
  n.patience = clamp(n.patience - (s.mask ? 23 : 16), 0, 100);
  n.drama = clamp(n.drama + 1, 0, 100);
  record.drama = clamp(record.drama + 1, 0, 100);
  s.society = clamp(s.society - 1, -100, 0);
  s.campaign.reputation = clamp(s.campaign.reputation + 0.6, 0, 100);
  progressCareer(s).forEach(showCampaignNotice);
  startBanter(n);
  scheduleBark(n, 'react', 1.3);
  sound(230, 0.06);
  save();
  updateUI();
}
function captured(event) {
  if (record) {
    record.events.push({ at: Math.floor(record.seconds), event });
    record.events = record.events.slice(-30);
  }
}
function react(n) {
  if (!record || n.inCustody || n.flee > 0 || Math.hypot(n.x - s.x, n.z - s.z) > 10) return;
  let r = rollEncounter();
  n.emotionUntil = world.time + 6;
  if (n.patience < 35 && s.campaign.reputation >= 20 && r < 0.32) {
    violentEncounter(n, r);
    return;
  }
  if (n.patience > 65) {
    bark(n, 'plea');
    captured('Local asks for space');
    return;
  }
  if (n.temperament === 'anxious' && n.patience < 50 && r < 0.5) {
    n.emotion = 'cry';
    n.flee = 5;
    bark(n, 'cry');
    captured('Local becomes visibly upset and cries');
    s.society = clamp(s.society - 2, -100, 0);
    $('feedText').textContent = '● Bystander: ' + line('bystander');
    return;
  }
  if (n.patience > 35) {
    if (r < 0.23) {
      n.music = true;
      record.music = true;
      bark(n, 'music');
      captured('Music playback starts');
      notify('Music in the take: simulated copyright claim. This clip earns no ad revenue.');
      sound(740, 0.15);
    } else if (r < 0.43 || n.temperament === 'avoidant') {
      n.flee = 10;
      bark(n, 'leave');
      captured('Local walks away');
    } else {
      n.emotion = 'rage';
      bark(n, 'argue');
      captured('Shouting, swearing and angry gestures');
      record.drama = clamp(record.drama + 2, 0, 100);
    }
    return;
  }
  if (r < 0.18) {
    n.flee = 12;
    bark(n, 'leave');
    captured('Subject leaves the encounter');
  } else if (r < 0.4) {
    n.emotion = 'throw';
    world.particles.push({
      x: n.x,
      z: n.z,
      tx: s.x,
      tz: s.z,
      born: world.time,
      duration: 0.8,
      size: 0.45,
      color: r < 0.28 ? '#8fa15e' : '#dfccb0',
    });
    s.health = clamp(s.health - 4, 0, 100);
    if (r < 0.28) {
      n.stinkUntil = world.time + 6;
      bark(n, 'stink');
      captured('Stink bomb thrown');
      notify('Stink bomb! Health −4. You smell like your comment section.');
    } else {
      n.touched = true;
      encounter.touched = true;
      record.touched = true;
      bark(n, 'cup');
      captured('Paper coffee cup thrown; contact recorded');
      if (s.campaign.reputation >= 20) {
        damageEquipment(s, 15);
        if (!encounter.called) police();
      }
      notify('A cup hits you. Contact recorded; the full context still matters.');
    }
    record.drama = clamp(record.drama + 3, 0, 100);
  } else if (r < 0.63) {
    n.emotion = 'rage';
    n.touched = true;
    encounter.touched = true;
    record.touched = true;
    n.drama = clamp(n.drama + 3, 0, 100);
    record.drama = clamp(record.drama + 3, 0, 100);
    s.health = clamp(s.health - 15 - Math.floor(rollEncounter() * 12), 0, 100);
    bark(n, 'contact');
    captured('Physical contact and camera shove');
    notify('Contact caught on camera. Police can review the full encounter.');
    sound(100, 0.2);
    if (s.spray > 0) spray(n, true);
  } else if (r < 0.86) {
    n.emotion = 'rage';
    bark(n, 'argue');
    captured('Angry pacing, arm-waving and shouting');
    record.drama = clamp(record.drama + 3, 0, 100);
    const bystander = npcs.find((b) => b.id !== n.id && Math.hypot(b.x - n.x, b.z - n.z) < 18);
    if (bystander) {
      bystander.emotion = 'rage';
      bystander.emotionUntil = world.time + 4;
    }
  } else {
    n.music = true;
    record.music = true;
    bark(n, 'music');
    captured('Bystander music contaminates the take');
  }
  if (s.health <= 15) hospital();
}
function car() {
  if (s.driving && Math.abs(s.carSpeed || 0) > 1) {
    notify('Brake before getting out. Hold Down or Shift.');
    return;
  }
  destination = null;
  s.routeGoal = null;
  if (record) stopRecording();
  if (s.driving) {
    const positions = [
      [3, 0],
      [-3, 0],
      [0, 4],
      [0, -4],
    ].map(([x, z]) => {
      const a = s.carHeading || 0;
      return {
        x: clamp(s.x + x * Math.cos(a) + z * Math.sin(a), -85, 85),
        z: clamp(s.z - x * Math.sin(a) + z * Math.cos(a), -85, 85),
      };
    });
    const p = positions.find((p) => !collision(p.x, p.z));
    if (!p) {
      notify('No room to get out here. Move away from the building.');
      return;
    }
    s.driving = false;
    s.carSpeed = 0;
    s.x = p.x;
    s.z = p.z;
    notify('Parked. The smoke is a factory feature.');
  } else if (Math.hypot(s.x - s.carX, s.z - s.carZ) < 10) {
    s.driving = true;
    s.carSpeed = 0;
    s.x = s.carX;
    s.z = s.carZ;
    notify('Driving: ↑/W gas, ↓/S brake then reverse, ←/→ steer. Shift: hard brake.');
  } else {
    destination = { x: s.carX + 3, z: s.carZ };
    notify('Your car is marked brown on the minimap. Move closer to enter.');
  }
  save();
  updateUI();
}
function hospital() {
  s.campaign.hospitals++;
  s.campaign.stress = clamp(s.campaign.stress + 15, 0, 100);
  if (encounter && !encounter.called) police();
  if (record) stopRecording();
  transaction(s, -65, 'Hospital: bruised ego & actual bruises');
  s.health = 100;
  s.x = -66;
  s.z = 40;
  s.driving = false;
  notify('Hospital visit: $65. Your doctor prescribed logging off.');
  $('feedText').textContent = '● Hospital confirms “main-character syndrome” is not covered.';
  save();
}
function violentEncounter(n, r) {
  n.emotion = 'rage';
  n.emotionUntil = world.time + 7;
  n.touched = true;
  encounter.touched = true;
  record.touched = true;
  s.campaign.stress = clamp(s.campaign.stress + 12, 0, 100);
  if (r < 0.15) {
    encounter.equipmentDamage = true;
    const damage = damageEquipment(s, s.campaign.reputation >= 50 ? 100 : 60);
    world.particles.push({
      x: s.x,
      z: s.z,
      tx: s.x + 2,
      tz: s.z + 1,
      born: world.time,
      duration: 1,
      size: 0.55,
      color: '#38433d',
    });
    captured('Civilian grabs and smashes the auditor’s filming equipment');
    bark(n, 'damage');
    captured('Civilian minimizes the equipment damage');
    s.health = clamp(s.health - 8, 0, 100);
    notify(damage);
  } else {
    const hit = 28 + Math.floor(s.campaign.reputation * 0.35);
    s.health = clamp(s.health - hit, 0, 100);
    damageEquipment(s, 20);
    captured('Civilian punches and kicks the auditor; injury and equipment damage recorded');
    say(
      n,
      n.gender === 'woman'
        ? '“Keep filming, asshole!” — she swings and kicks.'
        : '“You wanted a reaction?” — he punches and kicks.',
    );
    notify(`Assault: health −${hit}. Your equipment took damage too.`);
  }
  record.drama = clamp(record.drama + 6, 0, 100);
  if (s.spray > 0) spray(n, true);
  else {
    n.flee = r < 0.15 ? 14 : 0;
    n.suspectReplyAt = world.time + 2;
  }
  if (!encounter.called) police();
  if (s.campaign.condition <= 0 && record) stopRecording();
  if (s.health <= 15) hospital();
  save();
}
function openStatement() {
  const e = policeEvent || s.pendingReport;
  if (!e) return;
  openModal(
    'statement',
    'Statement first. Suspect leaving.',
    `<p class="intro">OFFICER: “I know your channel. I still have to document a complaint. Write down the whole sequence, including what happened before contact.”</p><p class="negative" id="escapeTimer">The town keeps moving while this form is open. The civilian may leave while you write.</p><form id="statementForm" class="report-form"><label>What happened? <textarea id="statementText" maxlength="500" minlength="12" required placeholder="Describe the contact or damage and what preceded it."></textarea></label><label><input id="statementContext" type="checkbox" required> Include the lead-up, not just the reaction.</label><button class="primary" type="submit">Submit written statement</button></form>`,
  );
  $('statementForm').onsubmit = (event) => {
    event.preventDefault();
    if (!$('statementForm').reportValidity()) return;
    const text = $('statementText').value.trim();
    if (text.length < 12) return;
    if (policeEvent) policeEvent.writtenStatement = text;
    else if (s.pendingReport) s.pendingReport.writtenStatement = text;
    paperwork();
  };
}
function police() {
  if (s.campaign.career !== 'auditor') return;
  if (policeEvent) {
    if (policeEvent.phase === 'paperwork') openStatement();
    else notify('Officers are responding. Keep the camera rolling.');
    return;
  }
  if (s.driving) {
    notify('Get out before calling the police.');
    return;
  }
  if (!encounter || encounter.called) {
    notify('No new encounter to report. The dispatcher has other things to do.');
    return;
  }
  encounter.called = true;
  const n = npcs.find((n) => n.id === encounter.npcId),
    roll = rollEncounter(),
    arrest =
      encounter.touched &&
      !encounter.unprovokedSpray &&
      roll < (encounter.playerSprayed ? 0.35 : 0.48),
    needsWrittenStatement = s.campaign.reputation >= 20 && roll < 0.3;
  let road = [-48, 0, 48].sort((a, b) => Math.abs(s.x - a) - Math.abs(s.x - b))[0];
  policeEvent = {
    elapsed: 0,
    npc: n,
    arrest,
    needsWrittenStatement,
    statementFiled: false,
    escaped: false,
    phase: 'dispatch',
    x: road,
    z: clamp(s.z + 8, -80, 80),
    encounter: { ...encounter },
  };
  world.patrol = { x: road, z: clamp(s.z + 40, -85, 85), officers: [] };
  const demand = encounter.equipmentDamage
    ? 'AUDITOR: “They destroyed my equipment! I’m pressing charges!”'
    : encounter.touched
      ? 'AUDITOR: “I’m pressing charges! This person hit me. I’m the victim here!”'
      : 'AUDITOR: “I’m pressing charges! They’re interfering with my investigation!”';
  say(s, demand);
  notify('You request charges against the civilian. A patrol car is on its way.');
  captured('Auditor calls police and demands charges against the civilian');
  captured(demand);
  sound(470, 0.25);
  updateUI();
}
function advancePolice(dt) {
  if (!policeEvent) return;
  const e = policeEvent,
    p = world.patrol;
  e.elapsed += dt;
  if (e.phase === 'dispatch') {
    p.z += (e.z - p.z) * Math.min(1, dt * 0.6);
    if (e.elapsed > 5) {
      e.phase = e.needsWrittenStatement ? 'paperwork' : 'review';
      p.officers = [{ id: 90, x: p.x + 2, z: p.z }];
      captured('Patrol car arrives; officer exits');
      say(p.officers[0], 'OFFICER: “' + line('officer') + '”');
      captured('Officer expresses dislike but agrees to assess evidence');
      if (e.needsWrittenStatement) {
        e.arrest = false;
        if (e.npc) {
          e.npc.flee = 25;
          e.npc.emotion = 'cry';
          e.npc.emotionUntil = world.time + 5;
        }
        notify(
          'Officer demands a written report first. Click Write report. The civilian is leaving.',
        );
        captured('Officer requires a full written statement before pursuing the complaint');
      } else {
        notify('Officers arrive and review everyone’s account.');
      }
    }
  } else if (e.phase === 'paperwork') {
    const off = p.officers[0];
    off.x += (s.x + 2 - off.x) * dt * 0.4;
    off.z += (s.z - off.z) * dt * 0.4;
    if (e.elapsed > 8 && !e.complained) {
      e.complained = true;
      say(s, 'AUDITOR: “' + line('paperwork') + '”');
      captured('Auditor complains that the civilian is getting away during paperwork');
    }
    if (e.elapsed > 14 && !e.escaped) {
      e.escaped = true;
      if (e.npc) {
        e.npc.cooldown = 45;
        e.npc.flee = 15;
      }
      captured('Civilian escapes while police require paperwork');
      notify(
        'The civilian gets away. Your statement can still be filed; today’s arrest opportunity is gone.',
      );
    }
    if (e.elapsed > 20) e.phase = 'depart';
  } else if (e.phase === 'review') {
    const off = p.officers[0],
      tx = e.npc?.x ?? s.x,
      tz = e.npc?.z ?? s.z;
    off.x += (tx + 2 - off.x) * dt * 0.65;
    off.z += (tz - off.z) * dt * 0.65;
    if (e.elapsed > 6.5 && !e.accused) {
      e.accused = true;
      const statement = e.encounter.equipmentDamage
        ? 'AUDITOR: “Officer, they smashed my camera! I want charges!”'
        : 'AUDITOR: “Officer, I want to press charges. They assaulted me—get their name!”';
      say(s, statement);
      captured(statement);
    }
    if (e.elapsed > 8 && !e.jargonDelivered) {
      e.jargonDelivered = true;
      const jargon = 'AUDITOR: “' + line('jargon') + '”';
      say(s, jargon);
      captured('Auditor deploys exaggerated legal jargon and demands enforcement');
      captured(jargon);
    }
    if (e.elapsed > 9.5 && !e.minimized && e.npc) {
      e.minimized = true;
      const excuse = e.encounter.equipmentDamage
        ? '“It was already broken! I barely touched it!”'
        : '“It was just a little push. Look at them milking it!”';
      bark(e.npc, e.encounter.equipmentDamage ? 'damage' : 'minimize');
      captured('Civilian plays down the harm and disputes the auditor’s account');
    }
    if (e.elapsed > 11) {
      e.phase = 'resolution';
      if (e.arrest && e.npc) {
        bark(e.npc, 'arrest');
        e.npc.emotion = s.campaign.reputation >= 30 ? 'rage' : 'cry';
        e.npc.emotionUntil = world.time + 7;
        e.npc.flee = 0;
        captured('Officer detains the local and begins an escort');
        notify('A local is being arrested. Film the escort or finish your take.');
      } else {
        if (e.npc) e.npc.flee = 12;
        captured('Officers separate everyone; no arrest');
        notify('You demanded charges, but officers decline an arrest.');
        say(off, 'OFFICER: “' + line('noArrest') + '”');
      }
    }
  } else if (e.phase === 'resolution') {
    if (e.arrest && e.npc) {
      const n = e.npc;
      n.x += (p.x + 2 - n.x) * dt * 0.45;
      n.z += (p.z - n.z) * dt * 0.45;
      n.moving = true;
      p.officers[0].x = n.x + 1;
      p.officers[0].z = n.z;
    }
    if (e.elapsed > 19) {
      if (e.arrest && e.npc) {
        e.npc.inCustody = true;
        e.npc.cooldown = 90;
        captured('Local escorted into patrol vehicle');
      }
      e.phase = 'depart';
      notify('Officers leave. You can review the incident report after the take.');
    }
  } else if (e.phase === 'depart') {
    p.officers = [];
    p.z -= dt * 6;
    if (e.elapsed > 24) {
      world.patrol = null;
      policeEvent = null;
      s.pendingReport = {
        touched: e.encounter.touched,
        playerSprayed: !!e.encounter.playerSprayed,
        unprovokedSpray: !!e.encounter.unprovokedSpray,
        equipmentDamage: !!e.encounter.equipmentDamage,
        arrest: e.arrest,
        escaped: e.escaped,
        needsWrittenStatement: e.needsWrittenStatement,
        statementFiled: e.statementFiled,
        writtenStatement: e.writtenStatement || '',
      };
      if (e.encounter.unprovokedSpray) transaction(s, -45, 'Citation: unprovoked spray use');
      save();
    }
  }
}

function policeReport() {
  if (policeEvent?.phase === 'paperwork') {
    openStatement();
    return;
  }
  const e = s.pendingReport;
  if (e?.needsWrittenStatement && !e.statementFiled) {
    openStatement();
    return;
  }
  if (!e) {
    police();
    return;
  }
  if (record) stopRecording();
  const text = e.escaped
    ? 'The civilian left while officers required your written statement. No arrest was made. Your complaint is on file; your equipment and hospital bills remain.'
    : e.arrest
      ? 'The camera captured the officer escorting a local into the patrol car. Arrest is not a conviction. The full footage remains evidence.'
      : e.unprovokedSpray
        ? 'Officers reviewed your spray use. You received a citation. The uncut footage travels faster than your version.'
        : 'Officers separated everyone. No arrest. An awkward silence is not a crime.';
  openModal(
    'police',
    'The incident report.',
    `<p class="intro">You asked police to pursue charges against the civilian. ${text}</p><div class="clip"><h3>Separate hustle: sue the city?</h3><p class="intro">A fictional civil claim costs $12 to file. Contact alone does not prove city liability. Settlements are uncertain; lawyers keep 40%.</p><button class="primary" id="claim">File a claim · $12</button></div><p class="modal-note">Simplified game outcomes, not legal advice.</p>`,
  );
  $('claim').onclick = () => {
    const result = resolveClaim(s, e);
    delete s.pendingReport;
    $('modalBody').innerHTML =
      `<div class="empty"><div class="big">⚖</div><h3>${result.kind === 'settled' ? 'A victory. For the billing department.' : 'Case closed. Invoice open.'}</h3><p>${esc(result.text)}</p><button id="backTown" class="primary">Back to the sidewalk</button></div>`;
    $('backTown').onclick = closeModal;
    save();
    updateUI();
  };
}
function spray(n = target, automatic = false) {
  if (s.campaign.career !== 'auditor') return;
  if (!s.spray) {
    if (!automatic) notify('No mace equipped. Gear & crew sells three-charge cans.');
    return;
  }
  if (!n || s.driving || n.inCustody || Math.hypot(n.x - s.x, n.z - s.z) > 10) {
    if (!automatic) notify('No active encounter in range.');
    return;
  }
  s.spray--;
  encounter =
    encounter?.npcId === n.id ? encounter : { npcId: n.id, touched: false, called: false };
  encounter.playerSprayed = true;
  encounter.unprovokedSpray = !!encounter.unprovokedSpray || !encounter.touched;
  n.flee = 14;
  n.emotion = 'cry';
  n.emotionUntil = world.time + 8;
  n.sprayReplyAt = world.time + 1.6;
  s.society = clamp(s.society - 4, -100, 0);
  for (let i = 0; i < 16; i++)
    world.particles.push({
      kind: 'spray',
      x: s.x,
      z: s.z,
      tx: n.x + Math.sin(i * 2.4) * 0.7,
      tz: n.z + Math.cos(i * 2.4) * 0.7,
      born: world.time + i * 0.025,
      duration: 0.7 + i * 0.025,
      size: 0.15 + i * 0.023,
      color: i % 2 ? '#d8aa62' : '#c9b476',
    });
  const line = encounter.touched
    ? 'AUDITOR: “You touched me! That’s self-defense! I’m pressing charges!”'
    : 'AUDITOR: “Back off! I felt threatened!”';
  say(s, line);
  captured(
    automatic
      ? 'Auditor automatically maces the civilian immediately after physical contact'
      : 'Auditor sprays mace at the civilian',
  );
  captured(line);
  if (record) record.drama = clamp(record.drama + 4, 0, 100);
  if (encounter.unprovokedSpray) {
    transaction(s, -35, 'Fine: unprovoked spray use');
    notify('Unprovoked mace: $35 fine. Your own footage is evidence.');
  } else notify('You mace the civilian after contact. They recoil and retreat. Keep filming.');
  sound(145, 0.22);
  save();
  updateUI();
}
let studio = null;
async function showCast(index = 0) {
  openModal(
    'cast',
    'People, with somewhere to be.',
    `<p class="intro">A closer look at Little Liberty. Drag the figure to turn it, or use the arrow buttons. These are the same characters you meet on the street.</p><div class="cast-layout"><div class="cast-stage"><canvas id="castCanvas" tabindex="0" aria-label="Rotatable 3D character. Left and right arrow keys rotate."></canvas><div class="cast-turn"><button id="turnLeft" aria-label="Turn character left">↶</button><button id="castZoom">See the face</button><button id="turnRight" aria-label="Turn character right">↷</button></div><span id="castLoading" role="status">Opening the town portrait book…</span></div><section class="cast-notes"><span class="eyebrow" id="castNumber"></span><h3 id="castName"></h3><span id="castRole"></span><p id="castDetail"></p><blockquote id="castHabit"></blockquote><label for="castPose">EXPRESSION & MOVEMENT</label><select id="castPose"><option value="idle">A normal Tuesday</option><option value="walk">On the way somewhere</option><option value="refuse">Please stop</option><option value="rage">Last nerve</option><option value="cry">Overwhelmed</option><option value="throw">Throwing a fit</option><option value="recoil">Back off</option></select><div class="cast-paging"><button id="castPrev">← Previous</button><button id="castNext">Next →</button></div></section></div><div class="cast-roster" aria-label="Town residents">${ALL_CHARACTERS.map((d, i) => `<button data-cast="${i}" aria-pressed="false">${esc(d.name)}</button>`).join('')}</div>`,
  );
  const current = new CastStudio($('castCanvas'), (d, i) => {
    $('castNumber').textContent =
      `LITTLE LIBERTY / ${String(i + 1).padStart(2, '0')} OF ${ALL_CHARACTERS.length}`;
    $('castName').textContent = d.name;
    $('castRole').textContent = d.role;
    $('castDetail').textContent = d.detail;
    $('castHabit').textContent = d.habit;
    document
      .querySelectorAll('[data-cast]')
      .forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.cast) === i)));
  });
  studio = current;
  try {
    await current.init(index);
    if (current.closed) return;
    $('castLoading').remove();
    $('castPrev').onclick = () => current.setCharacter(current.index - 1);
    $('castNext').onclick = () => current.setCharacter(current.index + 1);
    $('turnLeft').onclick = () => (current.yaw -= Math.PI / 4);
    $('turnRight').onclick = () => (current.yaw += Math.PI / 4);
    $('castZoom').onclick = () => {
      current.closeup = !current.closeup;
      $('castZoom').textContent = current.closeup ? 'Full figure' : 'See the face';
    };
    $('castPose').onchange = (e) => (current.pose = e.target.value);
    document
      .querySelectorAll('[data-cast]')
      .forEach((b) => (b.onclick = () => current.setCharacter(Number(b.dataset.cast))));
  } catch (error) {
    if (!current.closed) {
      $('castLoading').textContent =
        'The close-up viewer needs WebGL 2. The town remains playable.';
      console.info('Character viewer unavailable:', error.message);
    }
  }
}
function openModal(type, title, body) {
  touchInput.reset();
  lookDrag = null;
  $('gameMenu').close();
  studio?.dispose();
  studio = null;
  $('modal').classList.toggle('cast-dialog', type === 'cast');
  if (type !== 'statement' && capture.recorder?.state === 'recording') capture.recorder.pause();
  capture.releaseURLs();
  keys.clear();
  s.moving = false;
  s.carSpeed = 0;
  destination = null;
  modalType = type;
  $('modalTitle').textContent = title;
  $('modalBody').innerHTML = body;
  const walker = document.createTreeWalker($('modalBody'), NodeFilter.SHOW_TEXT);
  while (walker.nextNode())
    walker.currentNode.nodeValue = language(walker.currentNode.nodeValue, s.profanity);
  $('modalEyebrow').textContent =
    type === 'editor'
      ? 'THE CONTENT INDUSTRIAL COMPLEX'
      : type === 'shop'
        ? 'INVEST IN YOUR DOWNFALL'
        : 'LITTLE LIBERTY · INDEPENDENT SATIRE';
  if (!$('modal').open) $('modal').showModal();
}
function closeModal() {
  keys.clear();
  studio?.dispose();
  studio = null;
  capture.releaseURLs();
  $('modal').close();
  modalType = null;
  last = performance.now();
  $('game').focus({ preventScroll: true });
}
$('modal').addEventListener('close', () => {
  studio?.dispose();
  studio = null;
  if (capture.recorder?.state === 'paused' && !document.hidden && !menuOpen())
    capture.recorder.resume();
  modalType = null;
  last = performance.now();
});
function editor() {
  if (s.campaign.career !== 'auditor') {
    campaignMenu();
    return;
  }
  if (record) stopRecording();
  const html = s.clips.length
    ? s.clips
        .map(
          (c) =>
            `<article class="clip" data-clip="${c.id}"><h3>${esc(c.place)} · Take ${c.id}</h3><div class="clip-meta"><span>${c.seconds}s raw footage</span><span>${c.drama} engagement</span><span>${c.music ? '♫ Music claim' : '✓ Audio clear'}</span></div>${c.events?.length ? `<div class="event-log">${c.events.map((e) => `<span><b>${e.at}s</b> ${esc(e.event)}</span>`).join('')}</div>` : ''}<label for="title-${c.id}">VIDEO TITLE</label><input maxlength="100" type="text" id="title-${c.id}" value="LOCAL PERSON EXPOSED for having a Tuesday">${c.mediaKey ? `<div class="clip-video" id="video-${c.id}"><small>Preparing your recorded in-game footage…</small></div>` : ''}<div class="timeline" id="timeline-${c.id}"><span>Your provocation</span><span>The reaction</span><span>Your indignation</span></div><label><input type="checkbox" id="cut-${c.id}"> Cut your provocation out · ×2.1 rage clicks</label><p class="intro" id="estimate-${c.id}"></p><button class="primary" id="publish-${c.id}">Upload to your fictional YouTube channel ↗</button></article>`,
        )
        .join('')
    : `<div class="empty"><div class="big">▤</div><h3>No footage. No outrage.</h3><p>Walk near a local and press F to record.<br>Capture at least 3 seconds, then press F again.</p><button class="primary" id="backTown">Find a “story”</button></div>`;
  openModal(
    'editor',
    'The context-removal department.',
    `<p class="intro">Turn an ordinary interaction into an extraordinary thumbnail. All uploads, views and income stay inside the game. Download original in-game footage before publishing. The context-cut toggle changes the simulated upload, not your original video file.</p>${html}`,
  );
  if ($('backTown')) $('backTown').onclick = closeModal;
  for (const c of s.clips) {
    if (c.mediaKey)
      capture.get(c.mediaKey).then((blob) => {
        const container = $(`video-${c.id}`);
        if (!container) return;
        if (blob) {
          const url = capture.url(blob);
          container.innerHTML = `<video controls playsinline preload="metadata" src="${url}" aria-label="Recorded game footage"></video><a download="little-liberty-take-${c.id}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}" href="${url}">Download original take ↓</a>`;
        } else
          container.innerHTML =
            '<small>No video file on this device. The gameplay take and event log are available.</small>';
      });
    const refresh = () => {
      const cut = $(`cut-${c.id}`).checked,
        e = estimate(s, c, cut);
      $(`timeline-${c.id}`).classList.toggle('cut', cut);
      $(`estimate-${c.id}`).textContent =
        `Est. ${e.views.toLocaleString()} views · Ad revenue ${money(e.income)} · Expenses ${money(e.cost)} · Net ${money(e.net)}${s.campaign.demonetized ? ' · CHANNEL DEMONETIZED: no ad income.' : c.music ? ' · Entire take claimed: no ad income.' : ''}`;
    };
    refresh();
    $(`cut-${c.id}`).onchange = refresh;
    $(`publish-${c.id}`).onclick = () => {
      const cut = $(`cut-${c.id}`).checked,
        title = $(`title-${c.id}`).value.trim().slice(0, 100),
        e = publish(s, c.id, cut, title);
      if (!e) {
        notify('Your outrage channel is closed.');
        return;
      }
      const notices = afterUpload(s, c, cut);
      if (s.campaign.homeIncidents[0] && notices.some((n) => n.includes('lawn')))
        world.homeIntruder = {
          x: -30,
          z: 83,
          masked: s.campaign.homeIncidents[0].masked,
          until: world.time + 14,
        };
      capture.remove(c.mediaKey);
      save();
      updateUI();
      editor();
      notify(
        `${e.views.toLocaleString()} views. ${money(e.income)} revenue. ${money(e.net)} net. Freedom isn’t free.`,
      );
      sound(510, 0.13);
      if (notices.length) showCampaignNotice(notices.at(-1));
    };
  }
}
function shop() {
  if (s.campaign.career !== 'auditor') {
    campaignMenu();
    return;
  }
  openModal(
    'shop',
    'Look the part. Pay the price.',
    `<p class="intro">Available: <b>${money(s.cash)}</b> · Credit limit: −$350. Negative balances accrue 2% interest at midnight. Equipment improves clicks, not margins.</p><div class="clip"><h3>Camera condition: ${s.campaign.condition}%</h3><p class="intro">A smashed camera cannot record. Damaged equipment lowers usable reach.</p><button id="repairGear">Repair equipment · ${money(Math.round((100 - s.campaign.condition) * 0.55) + 10)}</button></div><div class="shop-grid">${ITEMS.map(
      (i) => {
        const owned = s.gear.includes(i.id) && i.id !== 'spray';
        return `<article class="shop-card"><span class="item-icon">${i.icon}</span><span class="eyebrow">${i.id.startsWith('crew') ? 'PERSONNEL' : i.id === 'clown' || i.id === 'poop' || MERCH[i.id] ? 'WARDROBE' : 'EQUIPMENT'}</span><h3>${i.name}</h3><p>${i.desc}</p><button data-buy="${i.id}" ${owned ? 'disabled class="owned"' : ''}><span>${owned ? (s.mask === i.id || s.merch === i.id ? 'Equipped' : 'Owned') : i.id === 'spray' && s.spray ? 'Refill' : 'Acquire'}</span><b>${owned ? '✓' : money(i.price)}</b></button>${owned && ['clown', 'poop'].includes(i.id) ? `<button data-mask="${i.id}" style="margin-top:6px">${s.mask === i.id ? 'Remove mask' : 'Wear mask'}</button>` : ''}${owned && MERCH[i.id] ? `<button data-merch="${i.id}" style="margin-top:6px">${s.merch === i.id ? 'Wear original shirt' : 'Wear shirt'}</button>` : ''}</article>`;
      },
    ).join(
      '',
    )}</div><p class="modal-note">Crew visibly follow you in “I’m with stupid” shirts. Masks and merch show on your character and in town mirrors. Masks also shorten local patience. Spray carries consequences.</p>`,
  );
  document.querySelectorAll('[data-merch]').forEach(
    (b) =>
      (b.onclick = () => {
        s.merch = s.merch === b.dataset.merch ? null : b.dataset.merch;
        save();
        shop();
      }),
  );
  $('repairGear').onclick = () => {
    const r = repairEquipment(s);
    save();
    shop();
    notify(r.text);
  };
  document.querySelectorAll('[data-buy]').forEach(
    (b) =>
      (b.onclick = () => {
        const result = buy(s, b.dataset.buy);
        notify(result.text);
        if (result.ok) {
          save();
          updateUI();
          shop();
        }
      }),
  );
  document.querySelectorAll('[data-mask]').forEach(
    (b) =>
      (b.onclick = () => {
        s.mask = s.mask === b.dataset.mask ? null : b.dataset.mask;
        save();
        shop();
      }),
  );
}
function ledger() {
  openModal(
    'ledger',
    'The cost of doing “good.”',
    `<p class="intro">The numbers are unedited. That’s the problem.</p><div class="ledger-totals"><div><small>REVENUE</small><strong>${money(s.revenue)}</strong></div><div><small>EXPENSES</small><strong>${money(s.expenses)}</strong></div><div><small>NET PROFIT</small><strong class="${s.revenue < s.expenses ? 'negative' : ''}">${money(s.revenue - s.expenses)}</strong></div></div><p class="intro">Loan principal owed: ${money(s.campaign.loanDebt)}. Borrowing increases cash, not earnings.</p><div class="clip"><h3>Society improved: ${s.society}%</h3><p class="intro">${s.published} uploads. ${s.views.toLocaleString()} views. ${s.claims} civil claims. ${s.society === 0 ? 'No measurable public benefit.' : 'An increasing number of people miss the quiet.'}</p></div>${s.ledger.length ? s.ledger.map((l) => `<div class="ledger-row"><div>${esc(l.label)}<small>DAY ${l.day}</small></div><b class="${l.amount < 0 ? 'negative' : ''}">${l.amount > 0 ? '+' : ''}${money(l.amount)}</b></div>`).join('') : '<p class="intro">No transactions yet. These are the good old days.</p>'}`,
  );
}
function help() {
  openModal(
    'help',
    'Your guide to public disservice.',
    `<p class="intro">A satirical open world about manufacturing outrage, then discovering the overhead. The only real victory is leaving the outrage career and becoming useful to other people.</p><div class="help-grid"><section><h3>01 / Find the story</h3><p>Use <kbd>WASD</kbd> or arrow keys to walk. Click a nearby patch of sidewalk to move there. Hold Shift to jog. Scroll or use + / − to zoom. Walk close to your smoking brown car and press <kbd>E</kbd> to drive. V toggles first-person on supported devices; drag to look or use Q/R and the turn buttons. Find mirror walks to a nearby mirror. Driving: W / ↑ accelerates, S / ↓ brakes then reverses, A/D or ←/→ steer, Shift brakes hard. Stop before exiting. Click-to-walk routes around buildings; driving uses the controls.</p></section><section><h3>02 / Make it about you</h3><p>Near a local, press <kbd>F</kbd> to film and <kbd>Space</kbd> to deliver your rotating legal catchphrases. Locals argue, leave, play music, throw stink bombs, or make contact. Press F to save the clip.</p></section><section><h3>03 / Edit. Upload. Regret.</h3><p>Open Editing desk. Keep the full context or remove your provocation for more clicks. Claimed audio earns nothing. Editing, data, crew and equipment all cost money. The ledger tells the truth.</p></section><section><h3>04 / Live with it</h3><p>After contact, demand charges against the civilian: “This person hit me! I’m the victim!” Officers review the encounter and may arrest the civilian. A later civil claim against the city is a separate choice. Outcomes vary. Once bought, mace fires automatically when a civilian shoves you or your camera. You can also use the Mace button. Each use consumes a charge; the spray, civilian reaction and your self-defense claim are recorded. Low health sends you to hospital for $65. Gear can be bought on credit; daily expenses and interest compound. Open Home, loans & career to manage retaliation, loans and your eventual career change. The report form is the one menu where the town keeps moving.</p></section></div><p class="modal-note">Progress autosaves in this browser. Use Settings to export a gameplay backup; download video takes separately from the editing desk. The game pauses in menus and background tabs, except for police statement forms: the suspect can leave while you write. This is a playable prototype with a compact town, not a finished large-scale game.</p><button class="primary" id="backTown">I have several questionable ideas →</button>`,
  );
  $('backTown').onclick = closeModal;
}
function settings() {
  openModal(
    'settings',
    'Keep the evidence.',
    `<p class="intro">Progress is saved locally in this browser. Back up before clearing browser data or changing devices. JSON exports contain gameplay state; download recorded video takes separately in the editing desk. The world pauses in this menu. Police statement forms are different: suspects can keep moving while you write.</p><label class="weather-select">LANGUAGE <select id="languageChoice"><option value="clean">Profanity off</option><option value="explicit">Profanity on</option></select></label><p class="modal-note">Language only: mature satire, violence and bathroom themes remain. New captions follow this setting; existing video files cannot be changed. No login required. Saves stay in this browser and website address; export before moving devices or clearing storage.</p><button id="terms">Player agreement & reuse license</button><label class="weather-select">ATMOSPHERE <select id="weatherChoice"><option value="living">Living weather · changes gradually</option>${Object.entries(
      WEATHER,
    )
      .map(
        ([k, v]) =>
          `<option value="${k}" ${world.atmosphere.choice === k ? 'selected' : ''}>${v.name}</option>`,
      )
      .join(
        '',
      )}</select></label><label class="weather-select">GRAPHICS <select id="graphicsChoice"><option value="cinematic">Atmospheric · volumetric light & bloom</option><option value="balanced">Balanced · lighting & shadows</option></select></label><label class="weather-select">RESOLUTION <select id="resolutionChoice"><option value="auto">Automatic · performance friendly</option><option value="native">Native display · up to 4K</option><option value="4k">4K UHD · 3840 × 2160 at 16:9</option></select></label><label class="weather-select">COLOR <select id="gamutChoice"><option value="auto">Automatic · Display P3 when supported</option><option value="srgb">sRGB · standard color</option><option value="p3">Display P3 · wide gamut</option></select></label><p class="modal-note" id="displayStatus"></p><p class="modal-note">4K costs more GPU power and preserves your screen’s shape. On smaller screens it supersamples; it does not add physical pixels. Display P3 requires a compatible screen and browser; otherwise sRGB is used. This is wide-gamut SDR, not HDR. Display changes apply when you resume.</p><div class="setting-actions"><button id="saveNow">Save now</button><button id="export">Export save ↓</button><button id="import">Import save ↑</button><button id="sound">Sound: ${muted ? 'off' : 'on'}</button><button id="ambientMusic">Background music: ${s.music === false ? 'off' : 'on'}</button></div><input class="hidden" id="file" type="file" accept="application/json,.json"><div class="clip"><h3>Fresh start. Same questionable plan.</h3><p class="intro">Reset removes your local career, equipment, and footage. Export a backup first.</p><button id="reset" class="negative">Reset career…</button></div><p class="modal-note">Renderer: ${world.backend}. Three.js with WebGPU when available, WebGL 2 otherwise; Canvas compatibility mode on unsupported devices. Sound includes birds, gusting wind, rain and occasional quiet music. Driving fades the outdoor mix down for the sputtering exhaust. Background music can be switched off separately. No accounts, trackers, real uploads, or purchases.</p>`,
  );
  $('languageChoice').value = s.profanity ? 'explicit' : 'clean';
  $('languageChoice').onchange = (e) => {
    s.profanity = e.target.value === 'explicit';
    $('speech').textContent = language($('speech').textContent, s.profanity);
    renderConversation();
    save();
    updateUI();
  };
  $('terms').onclick = terms;
  $('resolutionChoice').value = world.resolution || 'auto';
  $('gamutChoice').value = world.gamut || 'auto';
  $('resolutionChoice').disabled = $('gamutChoice').disabled = !world.renderer;
  const info = world.displayInfo?.();
  $('displayStatus').textContent = info?.gpu
    ? `Current output: ${info.width} × ${info.height} · ${info.colorSpace === 'display-p3' ? 'Display P3' : 'sRGB'}${info.wideScreen ? '' : ' · P3 display not detected'}`
    : 'Canvas compatibility mode · display options unavailable';
  $('resolutionChoice').onchange = $('gamutChoice').onchange = () => {
    world.setDisplay?.($('resolutionChoice').value, $('gamutChoice').value);
    $('displayStatus').textContent =
      'Saved. Resume to apply; reopen Settings to check the actual output.';
  };
  $('graphicsChoice').value = world.quality || 'balanced';
  $('graphicsChoice').onchange = (e) => world.setQuality?.(e.target.value);
  $('weatherChoice').value = world.atmosphere.choice;
  $('weatherChoice').onchange = (e) => {
    world.atmosphere.choice = e.target.value;
    s.weather = e.target.value;
    save();
  };
  $('saveNow').onclick = () => {
    save();
    notify(
      saveFailed ? 'Save unavailable. Please export a backup.' : 'Progress saved in this browser.',
    );
  };
  $('export').onclick = () => {
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' }),
      url = URL.createObjectURL(blob),
      a = document.createElement('a');
    a.href = url;
    a.download = `auditor-day-${s.day}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  $('import').onclick = () => $('file').click();
  $('file').onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 500000) {
      notify('Save file is too large.');
      return;
    }
    try {
      const parsed = JSON.parse(await f.text());
      if (!validSave(parsed)) throw Error('Invalid');
      capture.stop(null);
      resetLocals();
      s = migrateSave(parsed);
      if (!world.camera) s.viewMode = 'overhead';
      mirrorGoal = null;
      s.carSpeed = 0;
      s.routeGoal = null;
      record = null;
      encounter = null;
      policeEvent = null;
      world.patrol = null;
      world.homeIntruder = null;
      world.waypoint = null;
      world.atmosphere.choice = s.weather || 'living';
      world.cx = s.x;
      world.cz = s.z;
      save();
      closeModal();
      updateUI();
      notify('Career restored. So are your financial decisions.');
    } catch {
      notify('That file is not a valid game save. Your current progress is unchanged.');
    }
  };
  $('ambientMusic').onclick = () => {
    s.music = s.music === false;
    save();
    settings();
  };
  $('sound').onclick = () => {
    muted = !muted;
    s.sound = !muted;
    if (!muted) townAudio.start();
    save();
    sound();
    settings();
  };
  $('reset').onclick = () => {
    $('reset').textContent = 'Confirm: erase this career';
    $('reset').onclick = () => {
      capture.stop(null);
      capture.clear();
      s = fresh();
      record = null;
      encounter = null;
      policeEvent = null;
      world.patrol = null;
      world.homeIntruder = null;
      world.waypoint = null;
      world.atmosphere.choice = 'living';
      for (const n of npcs) {
        n.x = n.homeX;
        n.z = n.homeZ;
        n.patience = 100;
        n.cooldown = 0;
        n.flee = 0;
        n.music = false;
        n.touched = false;
        n.inCustody = false;
        n.emotion = null;
        n.emotionUntil = 0;
      }
      save();
      closeModal();
      updateUI();
      notify('Broke again. A blank slate.');
    };
  };
}
function terms() {
  openModal(
    'terms',
    'Play free. Share free.',
    `<p class="intro">Fictional mature satire: confrontations, violence, crude humor and optional strong language. Dialogue and police outcomes are not legal advice. Changing the profanity setting does not remove the other themes.</p><p>Free to play, study, modify and share under the included Free Sharing, No Sale License 1.0. Keep the license and attribution, identify changes, and distribute adaptations under the same terms. No selling copies, paid access, subscriptions, paid unlocks or paid derivatives. Optional donations with no perks and monetized gameplay videos are permitted. Third-party components keep their own licenses.</p><p>Progress is stored locally. Back it up using Export save; download footage separately. No account, telemetry, real upload or payment service is included. Your hosting provider may keep normal access logs.</p><p>The game is provided as-is, without warranties; liability is limited where law permits. Your mandatory consumer rights remain. See LICENSE and EULA.txt in the source distribution for the complete terms.</p><button id="backSettings">Back to settings</button>`,
  );
  $('backSettings').onclick = settings;
}
function notes() {
  openModal(
    'notes',
    'Field notes & creative direction.',
    `<div class="notes"><p>This independent game satirizes a fictional outrage entrepreneur. Little Liberty, its residents, outcomes and economics are invented. It is not affiliated with YouTube or Disney.</p><h3>A town built around ordinary lives</h3><p>City hall: civil servants and paperwork. Library: readers protecting a quiet afternoon. Post office: people with somewhere to be. Café: workers and customers. Courthouse: bills, not guaranteed vindication. Hospital: the cost of escalation. Everyone has a day that does not need to become content.</p><h3>Real-world reference points</h3><p>The <a href="https://www.oif.ala.org/auditing-the-first-amendment-at-your-public-library/" target="_blank" rel="noopener">American Library Association’s library guidance</a> informed the library setting and staff responses. <a href="https://mrsc.org/stay-informed/mrsc-insight/april-2023/rights-and-limits-on-filming-in-public-facilities" target="_blank" rel="noopener">MRSC’s discussion of public-facility filming</a> informed the civic spaces. These sources also distinguish lawful recording from disruptive behavior.</p><p><a href="https://www.yorku.ca/osgoode/iposgoode/2022/02/23/filling-blank-space-policeman-obscures-accountability-with-taylor-swift/" target="_blank" rel="noopener">York University’s account of music used to disrupt recordings</a> inspired the fictional “royalty-trap playlist.” No commercial music or Disney material is included. Music claims here are simplified game mechanics, not predictions of a platform’s actual decisions.</p><h3>The joke is the business model</h3><p>Cheap engagement generates tiny ad payments. Gear adds overhead. Crew wants wages. Claims can fail. Context-free uploads harm the town’s social meter. Recording itself is not portrayed as automatically unlawful; the player’s escalation is what creates the mess.</p><h3>Prototype scope</h3><p>Original procedural art, a compact explorable town, walking and driving, varied NPC reactions, gear and two masks, two crew hires, editing, simulated police/claims, financial history, and portable saves. Local recordings capture only the generated game scene. No webcam, microphone, real-world footage, or online publishing. The campaign follows reputation, home retaliation, increasingly expensive loans, demonetization and a service-work ending. Giving up auditing is winning. Future expansions could add interiors, more masks and a larger town.</p></div>`,
  );
}
function showCampaignNotice(text) {
  notify(text);
  $('feedText').textContent = '● ' + text;
  save();
}
function handleHomeIncident(incident) {
  if (!incident) return;
  world.homeIntruder = { x: -30, z: 83, masked: incident.masked, until: world.time + 14 };
  showCampaignNotice(incident.message);
}
function campaignMenu() {
  const c = s.campaign,
    ch = chapter(s),
    offer = loanOffer(s),
    task = c.serviceTask,
    job = SERVICE_JOBS.find((j) => j.id === task?.jobId);
  openModal(
    'campaign',
    ch.title,
    `<p class="intro">${ch.sub} Giving up the outrage career is the way to win.</p><div class="ledger-totals"><div><small>REPUTATION</small><strong>${Math.round(c.reputation)} / 100</strong></div><div><small>LOAN PRINCIPAL</small><strong class="negative">${money(c.loanDebt)}</strong></div><div><small>STRESS</small><strong>${c.stress}%</strong></div></div><div class="chapter-track">${['Attention', 'Reputation', 'Retaliation', 'Demonetized', 'Service', 'Peace'].map((name, i) => `<span class="${i + 1 <= ch.number ? 'reached' : ''}">${i + 1}. ${name}</span>`).join('')}</div>
<section class="clip"><h3>Home sweet publicly-known home.</h3><p class="intro">${c.homeKnown ? 'People know where you live. Visitors foul the lawn, throw trash, and disappear. Once a camera catches them, later visitors cover their faces.' : 'Your address is still private. Reputation 25 exposes your home to the town.'}</p><div class="setting-actions"><button id="goHome">Mark home on map</button><button id="securityShop">Buy home cameras</button><button id="cleanHome">Clean lawn · $12 / incident</button></div>${c.homeIncidents
      .slice(0, 5)
      .map(
        (i) =>
          `<div class="home-incident"><div><b>Day ${i.day} · ${i.type === 'lawn' ? 'Lawn fouled' : 'Trash dumped'}</b><small>${i.recorded ? (i.masked ? 'CCTV: masked visitor · identity obscured' : 'CCTV: face visible · identifiable visitor') : 'No camera installed · no recording'} · ${i.cleaned ? 'cleaned' : 'cleanup pending'}</small></div><button data-evidence="${i.id}">${i.recorded ? 'Review CCTV' : 'Incident details'}</button><button data-home-report="${i.id}" ${i.reported ? 'disabled' : ''}>${i.reported ? 'On file' : 'Report · $5'}</button></div>`,
      )
      .join('')}</section>
<section class="clip"><h3>Borrow tomorrow. Owe more tomorrow.</h3><p class="intro">${c.loansTaken} loans taken. Current daily rate: ${(c.loanRate * 100).toFixed(0)}%. Borrowed principal is not profit. Each new loan reprices all remaining loan debt; interest is charged at midnight.</p>${c.career === 'auditor' ? `<button class="primary" id="takeLoan">Borrow $150 · $${offer.fee} fee · ${(offer.rate * 100).toFixed(0)}% daily on ALL loan debt</button>` : '<p class="intro">Hardship plan: new loans closed, loan interest frozen. A quarter of each shift’s wages pays down existing principal.</p>'}<button id="repayLoan" style="margin-top:8px">Repay up to $50 principal</button></section>
<section class="clip"><h3>${c.career === 'won' ? 'No audience. No act. A life.' : c.demonetized ? 'Your next career doesn’t need a thumbnail.' : 'The exit is at the bottom of the spiral.'}</h3><p class="intro">${c.career === 'won' ? 'You completed three honest shifts and chose to stop. Debt and history remain, but neither gets to define the ending.' : c.career === 'service' ? `${c.shifts}/3 shifts complete. Walk to a workplace, clock in, and use Space or the on-screen action to finish useful tasks.` : c.demonetized ? 'The simulated platform has permanently disabled ad revenue for this channel. More outrage now earns exactly $0. You can keep chasing it—or take a job helping the people you used to bother.' : `Platform review follows repeated confrontational uploads. ${s.published}/8 uploads; ${c.strikes}/4 serious edited-content strikes. A warning arrives before the channel loses ad revenue.`}</p>${c.career === 'auditor' && c.demonetized ? '<button class="primary" id="leaveCareer">Give up auditing. Take an honest job.</button>' : ''}${c.career === 'service' ? `<div class="service-jobs">${SERVICE_JOBS.map((j) => `<article><b>${j.name}</b><small>${j.place} · ${money(j.wage)} / shift</small><button data-route-job="${j.id}">Mark workplace</button><button data-start-job="${j.id}" ${task ? 'disabled' : ''}>Clock in here</button></article>`).join('')}</div>${job ? `<p class="intro">Current shift: ${job.name} · Task ${task.step + 1}/3: ${job.tasks[task.step]}</p><button id="workTask" class="primary">Do the next useful thing</button>` : ''}${c.shifts >= 3 ? '<button id="finishCareer" class="primary ending-button">Put the camera away for good →</button>' : ''}` : ''}</section><div class="campaign-notices">${c.notices
      .slice(0, 7)
      .map((n) => `<p><small>DAY ${n.day}</small> ${esc(n.text)}</p>`)
      .join('')}</div>`,
  );
  $('goHome').onclick = () => {
    destination = { x: -25, z: 83 };
    world.waypoint = { ...destination, label: 'HOME' };
    closeModal();
    notify('Home marked on the minimap. The streets lead around buildings.');
  };
  $('securityShop').onclick = shop;
  $('cleanHome').onclick = () => {
    const r = cleanLawn(s);
    save();
    campaignMenu();
    notify(r.text);
  };
  $('repayLoan').onclick = () => {
    const r = repayLoan(s);
    save();
    campaignMenu();
    notify(r.text);
  };
  if ($('takeLoan'))
    $('takeLoan').onclick = () => {
      const r = takeLoan(s);
      save();
      updateUI();
      campaignMenu();
      notify(r.text);
    };
  document.querySelectorAll('[data-home-report]').forEach(
    (b) =>
      (b.onclick = () => {
        const r = reportHome(s, Number(b.dataset.homeReport));
        save();
        campaignMenu();
        notify(r.text);
      }),
  );
  document
    .querySelectorAll('[data-evidence]')
    .forEach((b) => (b.onclick = () => homeEvidence(Number(b.dataset.evidence))));
  if ($('leaveCareer'))
    $('leaveCareer').onclick = () => {
      if (record) stopRecording();
      const r = startService(s);
      if (r.ok) {
        policeEvent = null;
        world.patrol = null;
        resetLocals();
      }
      save();
      updateUI();
      campaignMenu();
      notify(r.text);
    };
  document.querySelectorAll('[data-route-job]').forEach(
    (b) =>
      (b.onclick = () => {
        const j = SERVICE_JOBS.find((j) => j.id === b.dataset.routeJob);
        world.waypoint = { x: j.x, z: j.z, label: j.place };
        closeModal();
        notify(`${j.place} marked on the map. Walk or drive there to clock in.`);
      }),
  );
  document.querySelectorAll('[data-start-job]').forEach(
    (b) =>
      (b.onclick = () => {
        const r = startShift(s, b.dataset.startJob);
        if (r.ok) {
          closeModal();
          workCooldown = 0;
        }
        save();
        updateUI();
        notify(r.text);
      }),
  );
  if ($('workTask'))
    $('workTask').onclick = () => {
      closeModal();
      doServiceWork();
    };
  if ($('finishCareer'))
    $('finishCareer').onclick = () => {
      const r = finishCareer(s);
      save();
      updateUI();
      if (r.ok) ending();
      else notify(r.text);
    };
}
function homeEvidence(id) {
  const incident = s.campaign.homeIncidents.find((i) => i.id === id);
  if (!incident) return;
  openModal(
    'evidence',
    'A sudden interest in privacy.',
    `<p class="intro">${incident.recorded ? 'Your installed home camera retained a simulated incident record. This is a reconstructed security still, not a saved video file.' : 'No home camera was installed. You have damage and a statement, but no footage.'}</p>${incident.recorded ? '<canvas id="securityStill" width="600" height="260" aria-label="Reconstructed security-camera incident"></canvas>' : ''}<p class="intro">${incident.masked ? 'The visitor now wears a mask. Better equipment bought you a clearer picture of someone you cannot identify.' : incident.identified ? 'The face is visible in this incident. Later visitors may adapt by hiding their identity.' : 'You used to tell strangers there was no expectation of privacy. The lawn feels different.'}</p><button id="backCampaign">Back to home & career</button>`,
  );
  if (incident.recorded) {
    const canvas = $('securityStill');
    world.securityStill(canvas.getContext('2d'), canvas.width, canvas.height, incident);
  }
  $('backCampaign').onclick = campaignMenu;
}
let workCooldown = 0;
function doServiceWork() {
  if (workCooldown > 0) {
    notify('Finish this small task. It takes a moment.');
    return;
  }
  const r = serviceStep(s);
  if (r.ok) {
    workCooldown = 2.5;
    sound(530, 0.1);
  }
  save();
  updateUI();
  notify(r.text);
  if (r.complete) {
    const local = nearest();
    if (local) bark(local, 'thanks');
  }
  if (r.complete && s.campaign.shifts >= 3)
    showCampaignNotice(
      'Three honest shifts. Open Home, loans & career when you are ready to put the camera away.',
    );
}
function ending() {
  openModal(
    'ending',
    'You gave up. You won.',
    `<div class="ending"><span class="eyebrow">THE CAMERA IS FINALLY OFF</span><h3>Nothing goes viral.<br>Life goes on.</h3><p>You stopped turning other people’s worst moments into your next payday. You worked three honest shifts. Someone said “thank you.” You didn’t ask them to subscribe.</p><div class="ledger-totals"><div><small>HONEST SHIFTS</small><strong>${s.campaign.shifts}</strong></div><div><small>CAREER NET</small><strong>${money(s.revenue - s.expenses)}</strong></div><div><small>DEBT STILL OWED</small><strong>${money(s.campaign.loanDebt)}</strong></div></div><p>The debt isn’t magically gone. Neither is the harm. But the spiral is over. For once, giving up was the right thing to do.</p><button id="peace" class="primary">Go outside. Leave the camera behind.</button></div>`,
  );
  $('peace').onclick = closeModal;
}
function paperwork() {
  const e = policeEvent || s.pendingReport;
  if (!e) return;
  e.statementFiled = true;
  closeModal();
  say(s, 'AUDITOR: “' + line('paperwork') + '”');
  captured('Auditor submits a statement and complains that the civilian is escaping');
  save();
  notify(
    e.escaped
      ? 'Written statement accepted. The civilian has used the delay to leave.'
      : 'Written statement accepted. The officer reviews it as the civilian walks away.',
  );
}

function updateUI() {
  $('soundToggle').setAttribute('aria-pressed', String(!muted));
  $('soundToggle').setAttribute('aria-label', muted ? 'Enable sound' : 'Mute sound');
  $('soundToggle').title = muted ? 'Enable sound' : 'Mute sound';
  $('soundSlash').style.display = muted ? '' : 'none';
  $('touchPedals').classList.toggle('hidden', !s.driving);
  $('stickLabel').textContent = s.driving ? 'STEER' : 'MOVE · PUSH FARTHER TO JOG';
  $('touchLookHint').classList.toggle('hidden', s.viewMode !== 'first' || s.driving);
  $('game').classList.toggle('driving', s.driving);
  $('hudStatus').textContent =
    `${money(s.cash)} · Health ${Math.round(s.health)} · ${s.driving ? 'DRIVING' : 'ON FOOT'}`;
  const first = s.viewMode === 'first' && !!world.camera;
  $('viewToggle').textContent = first ? 'Overhead view' : 'First person';
  $('zoomControls').hidden = first;
  $('viewToggle').disabled = !world.camera;
  $('zoomIn').disabled = first;
  $('zoomOut').disabled = first;
  $('viewHint').textContent = s.driving
    ? '↑ Gas · ↓ Brake / reverse · ← → Steer'
    : 'Drag to look · Q/R turn · WASD / arrows walk';
  $('findMirror').disabled = !world.camera;
  $('viewHint').classList.toggle('hidden', !first);
  $('crosshair').classList.toggle('hidden', !first);
  document
    .querySelectorAll('[data-look]')
    .forEach((b) => b.classList.toggle('hidden', !first || s.driving));
  if ($('escapeTimer'))
    $('escapeTimer').textContent =
      policeEvent && !policeEvent.escaped
        ? `Suspect leaving: ${Math.max(0, Math.ceil(14 - policeEvent.elapsed))}s. The town keeps moving while you write.`
        : 'The civilian got away. Your statement can still be filed.';
  target = nearest();
  $('inspectLocal').textContent = target
    ? 'Meet ' + CAST[target.id - 1].name + ' ↗'
    : 'Meet the locals ↗';
  $('cash').textContent = money(s.cash);
  $('net').textContent = money(s.revenue - s.expenses);
  $('net').classList.toggle('negative', s.revenue < s.expenses);
  $('views').textContent = s.views.toLocaleString();
  $('societyValue').textContent = `${s.society}%`;
  $('societyValue').classList.toggle('negative', s.society < 0);
  $('societyBar').style.width = `${Math.abs(s.society) / 2}%`;
  $('societyCaption').textContent =
    s.society < -30
      ? 'The entire town has learned to take the long way home.'
      : s.society < 0
        ? 'More content. Less peace. No measurable public benefit.'
        : 'The town was doing fine before you arrived.';
  $('clipCount').textContent = s.clips.length;
  $('healthBar').style.width = `${s.health}%`;
  $('healthValue').textContent = Math.round(s.health);
  $('patienceBar').style.width = `${target?.patience ?? 100}%`;
  $('patienceValue').textContent = Math.round(target?.patience ?? 100);
  $('targetName').textContent =
    target && !s.driving
      ? target.name
      : s.driving
        ? 'The Rust Bucket, circa 1997.'
        : 'Just another Tuesday.';
  $('targetText').textContent = s.driving
    ? '↑ gas · ↓ brake / reverse · ← → steer. Stop, then E to exit.'
    : target
      ? target.music
        ? 'Playing a royalty-trap playlist. This take cannot earn ad revenue.'
        : target.flee > 0
          ? 'Walking away. Turns out participation is optional.'
          : target.patience < 40
            ? 'Patience is wearing thin. So is your claim to public service.'
            : 'A perfectly ordinary person, suspiciously minding their business.'
      : 'Find someone nearby. Or take your questionable car for a spin.';
  $('film').innerHTML = record
    ? '■ &nbsp; Finish recording <kbd>F</kbd>'
    : '◉ &nbsp; Start recording <kbd>F</kbd>';
  $('film').classList.toggle('recording', !!record);
  $('touchFilm').textContent = record ? '■ Stop' : '◉ Film';
  $('touchEngage').disabled = !target || s.driving || engageCooldown > 0;
  $('engage').textContent = 'Engage · talk to local';
  $('engage').disabled = !target || s.driving || engageCooldown > 0;
  $('car').innerHTML = s.driving ? 'Exit car <kbd>E</kbd>' : 'Enter car <kbd>E</kbd>';
  $('mode').textContent = s.driving ? (s.carSpeed < -0.1 ? 'REVERSING' : 'DRIVING') : 'ON FOOT';
  $('police').textContent =
    policeEvent?.phase === 'paperwork'
      ? 'Write report'
      : s.pendingReport
        ? 'Incident report'
        : policeEvent
          ? 'Police responding…'
          : 'Press charges';
  $('weatherLabel').textContent = WEATHER[world.atmosphere.current].name;
  $('spray').textContent = `Mace${s.spray ? ' · ' + s.spray : ''}`;
  $('recordHud').classList.toggle('hidden', !record);
  if (record) {
    const secs = Math.floor(record.seconds);
    $('recordTime').textContent =
      `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
    $('recordQuality').textContent = record.music
      ? '♫ AUDIO CLAIMED'
      : record.drama > 0
        ? 'Outrage detected. Context still present.'
        : 'Context intact. Unfortunately.';
  }
  let step = s.clips.length ? 2 : s.published ? 3 : 1;
  $('step').textContent = `0${step} / 03`;
  for (let i = 1; i <= 3; i++) $('s' + i).classList.toggle('active', i === step);
  $('missionTitle').textContent =
    step === 1
      ? 'Find your first “story.”'
      : step === 2
        ? 'Never let context win.'
        : 'Congratulations. You have overhead.';
  $('missionText').textContent =
    step === 1
      ? 'Walk up to a local. Start recording. Make a perfectly normal day about you.'
      : step === 2
        ? 'Your footage is ready. Open the editing desk, select your spin, and upload.'
        : 'Check The damage, acquire questionable gear, and head out for another story.';
  const place = locationAt(s.x, s.z);
  $('district').textContent = `${place.sub} · ${s.driving ? 'On the road' : 'Public sidewalk'}`;
  let hour = Math.floor(s.minutes / 60) % 24,
    min = Math.floor(s.minutes % 60);
  $('clock').textContent =
    `DAY ${String(s.day).padStart(2, '0')} · ${String(hour % 12 || 12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
  const ch = chapter(s);
  $('chapterTitle').textContent = ch.title;
  $('reputation').textContent = Math.round(s.campaign.reputation);
  $('condition').textContent = s.campaign.condition + '%';
  $('channelStatus').textContent =
    s.campaign.career === 'won'
      ? 'ENDING ACHIEVED'
      : s.campaign.career === 'service'
        ? 'HONEST WORK'
        : s.campaign.demonetized
          ? 'DEMONETIZED'
          : s.campaign.warning
            ? 'PLATFORM WARNING'
            : 'MONETIZED';
  $('channelStatus').classList.toggle(
    'negative',
    s.campaign.demonetized && s.campaign.career === 'auditor',
  );
  document.querySelector('.career-head h2').textContent =
    s.campaign.career === 'won'
      ? 'Just another person.'
      : s.campaign.career === 'service'
        ? 'At your service.'
        : 'Independent journalist™';
  document.querySelector('.pill').textContent =
    s.campaign.career === 'auditor'
      ? 'SELF-EMPLOYED'
      : s.campaign.career === 'service'
        ? 'ON THE CLOCK'
        : 'OFF CAMERA';
  $('spray').disabled = s.campaign.career !== 'auditor';
  $('police').disabled = s.campaign.career !== 'auditor';
  if (s.campaign.career !== 'auditor') {
    $('film').textContent = 'Camera retired';
    $('missionTitle').textContent = ch.title;
    $('missionText').textContent = ch.sub;
    $('engage').textContent = s.campaign.serviceTask ? 'Do the next task' : 'Helping, not filming';
    $('engage').disabled = !s.campaign.serviceTask;
    $('touchEngage').disabled = !s.campaign.serviceTask;
    $('touchEngage').textContent = 'Help';
    $('film').disabled = true;
    $('touchFilm').disabled = true;
  } else {
    $('film').disabled = false;
    $('touchFilm').disabled = false;
    $('touchEngage').textContent = 'Engage';
  }
  world.minimap($('map'), s, npcs);
}
function resetMotion() {
  touchInput.reset();
  lookDrag = null;
  keys.clear();
  destination = null;
  s.moving = false;
  s.carSpeed = 0;
}
function openGameMenu() {
  resetMotion();
  if ($('modal').open) closeModal();
  updateUI();
  if (capture.recorder?.state === 'recording') capture.recorder.pause();
  $('gameMenu').showModal();
  $('resumeGame').focus();
}
function toggleMenu() {
  if ($('gameMenu').open) $('gameMenu').close();
  else if ($('modal').open) closeModal();
  else openGameMenu();
}
$('gameMenu').addEventListener('close', () => {
  resetMotion();
  if (!menuOpen() && !document.hidden && capture.recorder?.state === 'paused')
    capture.recorder.resume();
  last = performance.now();
  if (!menuOpen()) $('game').focus({ preventScroll: true });
});
$('menuToggle').onclick = toggleMenu;
$('resumeGame').onclick = toggleMenu;
$('quickPolice').onclick = policeReport;
$('quickSpray').onclick = () => spray();
function controllerMenu(input) {
  const dialog = $('modal').open ? $('modal') : $('gameMenu');
  const options = [...dialog.querySelectorAll('button, a[href], select, input, textarea')].filter(
    (e) => !e.disabled && e.getClientRects().length,
  );
  const current = document.activeElement;
  const index = options.indexOf(current);
  if (input.pressed[1]) {
    if ($('modal').open) openGameMenu();
    else toggleMenu();
    return;
  }
  if (input.pressed[12] || input.pressed[13]) {
    const next = options[(index + (input.pressed[12] ? -1 : 1) + options.length) % options.length];
    next?.focus();
    next?.scrollIntoView({ block: 'nearest' });
  }
  if (current?.tagName === 'SELECT' && (input.pressed[14] || input.pressed[15])) {
    current.selectedIndex = clamp(
      current.selectedIndex + (input.pressed[14] ? -1 : 1),
      0,
      current.options.length - 1,
    );
    current.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (input.pressed[0] && options.includes(current)) current.click();
}
function pollController(dt) {
  let pads = [];
  try {
    pads = window.navigator.getGamepads?.() || [];
  } catch {
    /* Embedded browsers can deny gamepad access. */
  }
  const wasConnected = padInput.connected;
  padInput = controller.poll(pads, !document.hidden && document.hasFocus());
  if (wasConnected && !padInput.connected) {
    resetMotion();
    notify('Controller disconnected. Keyboard and touch controls are still available.');
  }
  $('controllerStatus').textContent = padInput.connected
    ? 'Controller · Start / Options: menu'
    : 'Keyboard / touch';
  if (padInput.pressed[9]) {
    toggleMenu();
    return;
  }
  if (menuOpen()) {
    controllerMenu(padInput);
    padInput = {
      ...padInput,
      x: 0,
      y: 0,
      gas: 0,
      reverse: 0,
      lookX: 0,
      lookY: 0,
      sprint: false,
      brake: false,
    };
    return;
  }
  if (padInput.pressed[8]) toggleView();
  if (padInput.pressed[0]) engage();
  if (padInput.pressed[2]) toggleFilm();
  if (padInput.pressed[3]) car();
  if (padInput.pressed[4]) spray();
  if (padInput.pressed[5]) policeReport();
  if (s.viewMode === 'first') {
    const yaw = s.lookYaw - padInput.lookX * dt * 2.2;
    s.lookYaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    s.lookPitch = clamp(s.lookPitch - padInput.lookY * dt * 1.5, -0.85, 0.85);
  }
}
let mirrorGoal = null;
function toggleView() {
  if (!world.camera) {
    notify('First-person and live mirrors need WebGPU or WebGL 2.');
    return;
  }
  s.viewMode = s.viewMode === 'first' ? 'overhead' : 'first';
  destination = null;
  mirrorGoal = null;
  world.cameraKey = '';
  save();
  updateUI();
  notify(
    s.viewMode === 'first'
      ? 'First person: drag to look. Q/R or ↶/↷ turn. V switches view.'
      : 'Overhead view. Click the sidewalk to walk.',
  );
}
function findMirror() {
  if (s.driving) {
    notify('Park and get out to check your reflection.');
    return;
  }
  if (!world.camera) {
    notify('Live mirrors need WebGPU or WebGL 2.');
    return;
  }
  const closest = mirrorSites(s.mirrorSeed).sort(
    (a, b) => Math.hypot(a.x - s.x, a.z - s.z) - Math.hypot(b.x - s.x, b.z - s.z),
  )[0];
  mirrorGoal = { x: closest.x, z: closest.z + 3.5 };
  destination = { ...mirrorGoal };
  world.waypoint = { ...destination, label: 'MIRROR' };
  notify('Walking to the nearest mirror. Masks, merch and your flies show in the reflection.');
}
$('viewToggle').onclick = toggleView;
$('findMirror').onclick = findMirror;
let lookDrag = null;
$('game').addEventListener('pointerdown', (e) => {
  if (
    menuOpen() ||
    lookDrag ||
    s.viewMode !== 'first' ||
    e.target.closest('button, .minimap, [data-touch-control]') ||
    e.button !== 0
  )
    return;
  if (
    e.pointerType === 'touch' &&
    e.clientX < $('game').getBoundingClientRect().left + $('game').clientWidth * 0.45
  )
    return;
  e.preventDefault();
  lookDrag = { id: e.pointerId, x: e.clientX, y: e.clientY };
  $('game').setPointerCapture(e.pointerId);
});
$('game').addEventListener('pointermove', (e) => {
  if (!lookDrag || lookDrag.id !== e.pointerId) return;
  s.lookYaw = Math.atan2(
    Math.sin(s.lookYaw - (e.clientX - lookDrag.x) * 0.006),
    Math.cos(s.lookYaw - (e.clientX - lookDrag.x) * 0.006),
  );
  s.lookPitch = clamp(s.lookPitch - (e.clientY - lookDrag.y) * 0.004, -0.85, 0.85);
  lookDrag = { id: e.pointerId, x: e.clientX, y: e.clientY };
});
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
  $('game').addEventListener(event, (e) => {
    if (lookDrag?.id === e.pointerId) lookDrag = null;
  });
document.querySelectorAll('[data-look]').forEach((b) => {
  b.onpointerdown = (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    keys.add(b.dataset.look);
  };
  b.onpointerup = b.onpointercancel = () => keys.delete(b.dataset.look);
});
const navigator = new Navigator(collision);
function move(dt) {
  if (s.viewMode === 'first') {
    const turn = (keys.has('q') ? 1 : 0) - (keys.has('r') ? 1 : 0);
    s.lookYaw = Math.atan2(
      Math.sin(s.lookYaw + turn * dt * 1.8),
      Math.cos(s.lookYaw + turn * dt * 1.8),
    );
  }
  let dx =
      (keys.has('d') || keys.has('ArrowRight') ? 1 : 0) -
      (keys.has('a') || keys.has('ArrowLeft') ? 1 : 0) +
      padInput.x +
      touchInput.x,
    dz =
      (keys.has('s') || keys.has('ArrowDown') ? 1 : 0) -
      (keys.has('w') || keys.has('ArrowUp') ? 1 : 0) +
      padInput.y +
      touchInput.y;
  const analogSpeed = Math.min(1, Math.hypot(dx, dz));
  if (dx || dz) {
    destination = null;
    mirrorGoal = null;
    const ax = (dx + dz) * 0.707,
      az = (dz - dx) * 0.707;
    if (s.viewMode === 'first') {
      const vector = viewMovement(dx, -dz, s.lookYaw);
      dx = vector.x;
      dz = vector.z;
    } else {
      dx = ax;
      dz = az;
    }
  } else if (destination) {
    dx = destination.x - s.x;
    dz = destination.z - s.z;
  }
  if (s.driving) {
    // Driving uses vehicle-relative steering; walking remains screen-relative.
    drive(
      s,
      {
        throttle:
          (keys.has('w') || keys.has('ArrowUp') ? 1 : 0) -
          (keys.has('s') || keys.has('ArrowDown') ? 1 : 0) +
          padInput.gas -
          padInput.reverse -
          padInput.y +
          touchInput.gas -
          touchInput.reverse,
        steer:
          (keys.has('a') || keys.has('ArrowLeft') ? 1 : 0) -
          (keys.has('d') || keys.has('ArrowRight') ? 1 : 0) -
          padInput.x -
          touchInput.x,
        brake: keys.has('Shift') || padInput.brake || touchInput.brake,
      },
      dt,
      collision,
    );
    destination = null;
    return;
  }
  const speed =
    (keys.has('Shift') || padInput.sprint || touchInput.sprint ? 8 : 5.8) *
    (destination ? 1 : analogSpeed);
  if (destination) {
    if (navigator.walk(s, destination, speed, dt)) {
      destination = null;
      if (mirrorGoal) {
        s.viewMode = 'first';
        s.lookYaw = Math.PI;
        s.lookPitch = -0.1;
        mirrorGoal = null;
        world.waypoint = null;
        save();
      }
    }
    return;
  }
  s.routeGoal = null;
  const len = Math.hypot(dx, dz);
  s.moving =
    len > 0 && slide(s, (dx / len) * speed * dt, (dz / len) * speed * dt, collision) > 0.001;
}

function simulate(dt) {
  tickBanter();
  if (world.time > conversationUntil) $('conversation').classList.add('hidden');
  for (let i = pendingBarks.length - 1; i >= 0; i--) {
    const b = pendingBarks[i];
    if (world.time >= b.at) {
      pendingBarks.splice(i, 1);
      if (
        !policeEvent &&
        record &&
        record.npcId === b.n.id &&
        Math.hypot(b.n.x - s.x, b.n.z - s.z) <= 10
      ) {
        if (b.event === 'react') react(b.n);
        else bark(b.n, b.event);
      }
    }
  }
  ambientClock += dt;
  if (ambientClock > 18 && speechTimer <= 0 && !policeEvent && !s.driving) {
    ambientClock = 0;
    if (record) {
      const witness = npcs.find(
        (n) => n !== target && !n.inCustody && Math.hypot(n.x - s.x, n.z - s.z) < 14,
      );
      if (witness) bark(witness, 'bystander');
    } else if (s.gear.includes('crew') && s.campaign.career === 'auditor')
      notify('CREW: “' + line('crew') + '”');
  }
  workCooldown = Math.max(0, workCooldown - dt);
  engageCooldown = Math.max(0, engageCooldown - dt);
  move(dt);
  advancePolice(dt);
  s.minutes += dt * 1.7;
  if (s.minutes >= 1440) {
    s.minutes -= 1440;
    s.day++;
    chargeDay(s);
    notify('A new day. The lender remembered.');
    save();
  }
  if (s.campaign.homeKnown && s.campaign.career === 'auditor') {
    s.campaign.homeClock += dt;
    if (s.campaign.homeClock >= 110) handleHomeIncident(homeIncident(s));
  }
  for (const n of npcs) {
    n.cooldown = Math.max(0, n.cooldown - dt);
    n.moving = false;
    if (n.suspectReplyAt && world.time >= n.suspectReplyAt) {
      n.suspectReplyAt = 0;
      bark(n, 'minimize');
      captured('Civilian minimizes the assault or equipment damage');
    }
    if (n.sprayReplyAt && world.time >= n.sprayReplyAt) {
      n.sprayReplyAt = 0;
      bark(n, 'sprayed');
      captured('Civilian cries, covers their face and retreats after being maced');
    }
    if (n.inCustody) {
      if (n.cooldown <= 0) {
        n.inCustody = false;
        n.x = n.homeX;
        n.z = n.homeZ;
        n.patience = 100;
      } else continue;
    }
    if (policeEvent?.npc === n && policeEvent.phase === 'resolution') {
      n.moving = !!policeEvent.arrest;
      continue;
    }
    if (n.flee > 0) {
      n.flee = Math.max(0, n.flee - dt);
      if (
        !n.escapeGoal ||
        world.time > (n.repathAt || 0) ||
        Math.hypot(n.x - n.escapeGoal.x, n.z - n.escapeGoal.z) < 1
      ) {
        n.escapeGoal = navigator.escape(n, s);
        n.repathAt = world.time + 3;
      }
      navigator.walk(n, n.escapeGoal, 4, dt, npcs);
    } else if ((!record || record.npcId !== n.id) && n.cooldown <= 0) {
      n.escapeGoal = null;
      if (world.time >= (n.pauseUntil || 0)) {
        if (!n.walkGoal) {
          n.walkStep = (n.walkStep || 0) + 1;
          for (let attempt = 0; attempt < 8; attempt++) {
            const angle = n.id * 2.4 + n.walkStep * 1.7 + attempt * 0.8;
            const goal = {
              x: clamp(n.homeX + Math.sin(angle) * 7, -83, 83),
              z: clamp(n.homeZ + Math.cos(angle) * 7, -83, 83),
            };
            if (navigator.route(n, goal).length) {
              n.walkGoal = goal;
              break;
            }
          }
          if (!n.walkGoal) n.pauseUntil = world.time + 3;
        }
        if (n.walkGoal && navigator.walk(n, n.walkGoal, 1.1 + (n.id % 4) * 0.15, dt, npcs)) {
          n.walkGoal = null;
          n.pauseUntil = world.time + 2 + (n.id % 3);
        }
      }

      n.patience = Math.min(100, n.patience + dt * 0.3);
      if (n.patience > 85) n.music = false;
    }
  }
  if (record) {
    record.seconds += dt;
    const n = npcs.find((n) => n.id === record.npcId);
    if (n && !n.inCustody) {
      const distance = Math.hypot(n.x - s.x, n.z - s.z);
      if (distance > 30 && !policeEvent) {
        stopRecording();
        notify('They got away. Your take is saved; their afternoon is improving.');
      } else if (record) {
        record.music = record.music || n.music;
        eventTimer += dt;
        if (eventTimer > 6) {
          eventTimer = 0;
          n.patience = clamp(n.patience - 7, 0, 100);
          if (n.patience < 65 && !policeEvent) react(n);
          else bark(n, 'plea');
        }
      }
    }
  }
  if (speechTimer > 0) {
    speechTimer -= dt;
    const n = speechActor;
    if (n) {
      const [x, y] = world.project(n.x, 5, n.z);
      $('speech').style.left = x + 'px';
      $('speech').style.top = y + 'px';
    }
    if (speechTimer <= 0) $('speech').classList.add('hidden');
  }
  if (s.health < 100 && s.health > 15) s.health = Math.min(100, s.health + dt * 0.025);
  if (s.campaign.career !== 'won' && s.driving && s.moving) {
    simulate.fuel = (simulate.fuel || 0) + dt;
    if (simulate.fuel >= 10) {
      transaction(s, -1.36, 'Rust Bucket: fuel & oil');
      simulate.fuel = 0;
    }
  }
}
$('cast').onclick = () => showCast();
$('inspectLocal').onclick = () => showCast(target?.id || 0);
$('campaign').onclick = campaignMenu;
$('conversation').addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
$('conversationToggle').onclick = () => {
  const collapsed = $('conversation').classList.toggle('collapsed');
  $('conversationToggle').setAttribute('aria-expanded', String(!collapsed));
  $('conversationToggle').textContent = collapsed ? 'Show' : 'Hide';
};
$('touchFilm').onclick = toggleFilm;
$('touchEngage').onclick = engage;
$('touchCar').onclick = car;
$('film').onclick = () => {
  $('gameMenu').close();
  toggleFilm();
};
$('engage').onclick = () => {
  $('gameMenu').close();
  engage();
};
$('car').onclick = () => {
  $('gameMenu').close();
  car();
};
$('police').onclick = policeReport;
$('spray').onclick = () => {
  $('gameMenu').close();
  spray();
};
$('help').onclick = help;
$('settings').onclick = settings;
$('about').onclick = notes;
$('closeModal').onclick = closeModal;
document
  .querySelectorAll('[data-panel]')
  .forEach((b) => (b.onclick = () => ({ editor, shop, ledger })[b.dataset.panel]()));
$('zoomIn').onclick = () => (world.zoom = clamp(world.zoom + 1, 3.5, 24));
$('zoomOut').onclick = () => (world.zoom = clamp(world.zoom - 1, 3.5, 24));
$('game').addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    if (s.viewMode !== 'first') world.zoom = clamp(world.zoom - e.deltaY * 0.008, 3.5, 24);
  },
  { passive: false },
);
$('game').addEventListener('click', (e) => {
  if (
    s.driving ||
    s.viewMode === 'first' ||
    e.pointerType === 'touch' ||
    e.sourceCapabilities?.firesTouchEvents
  )
    return;
  if (e.target.closest('button, .minimap, [data-touch-control]')) return;
  const rect = $('game').getBoundingClientRect(),
    p = world.unproject(e.clientX - rect.left, e.clientY - rect.top);
  if (!collision(p.x, p.z) && Math.abs(p.x) < 87 && Math.abs(p.z) < 87) destination = p;
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    // Text fields retain normal typing/focus behavior. Escape always closes their dialog.
    if (e.target.matches('input,textarea,select')) return;
    e.preventDefault();
    if (!e.repeat) toggleMenu();
    return;
  }
  if (menuOpen()) {
    if (
      !e.target.matches('input,textarea,select') &&
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
    ) {
      e.preventDefault();
      const pressed = [];
      pressed[{ ArrowUp: 12, ArrowDown: 13, ArrowLeft: 12, ArrowRight: 13 }[e.key]] = true;
      controllerMenu({ pressed });
    }
    return;
  }
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (
    [
      'w',
      'a',
      's',
      'd',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      ' ',
      'f',
      'e',
      'Shift',
      'q',
      'r',
      'v',
    ].includes(key)
  ) {
    e.preventDefault();
    keys.add(key);
  }
  if (e.repeat) return;
  if (key === 'v') toggleView();
  if (key === 'f') toggleFilm();
  if (key === 'e') car();
  if (key === ' ') engage();
  if (key === 'Escape') {
    openGameMenu();
  }
});
window.addEventListener('keyup', (e) =>
  keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key),
);
window.addEventListener('blur', () => {
  touchInput.reset();
  lookDrag = null;
  keys.clear();
  s.carSpeed = 0;
});
document.addEventListener('visibilitychange', () => {
  touchInput.reset();
  lookDrag = null;
  keys.clear();
  if (document.hidden) {
    save();
    if (capture.recorder?.state === 'recording') capture.recorder.pause();
  } else if (capture.recorder?.state === 'paused' && !menuOpen()) capture.recorder.resume();
  last = performance.now();
});
window.addEventListener('pagehide', save);
window.addEventListener('resize', () => {
  touchInput.reset();
  lookDrag = null;
});
// Capture also sees joystick touches, whose handlers stop bubbling. Touch release
// is a user activation on mobile; retries cover Safari interruption/backgrounding.
function unlockAudio() {
  if (!muted && townAudio.ctx?.state !== 'running') void townAudio.start();
  if (!muted && sound.ctx && sound.ctx.state !== 'running') sound.ctx.resume().catch(() => {});
}
for (const event of ['pointerup', 'click', 'keydown'])
  window.addEventListener(event, unlockAudio, { capture: true });
$('soundToggle').onclick = async () => {
  muted = !muted;
  s.sound = !muted;
  save();
  updateUI();
  if (!muted) {
    const running = await townAudio.start();
    if (!muted)
      notify(
        running
          ? 'Sound on · birds, wind and engine. Adjust your device media volume.'
          : 'Audio is blocked. Tap sound again to retry.',
      );
  }
};
function frame(now) {
  townAudio.update(
    s,
    world.atmosphere,
    !!policeEvent,
    muted,
    document.hidden || menuOpen(),
    !!record || speechTimer > 0,
  );
  const dt = Math.max(0, Math.min((now - last) / 1000, 0.15));
  last = now;
  pollController(dt);
  if (!document.hidden && (!menuOpen() || modalType === 'statement')) {
    simulate(dt);
    world.render(s, npcs, dt);
    if (record) capture.tick(world, dt);
    uiTimer += dt;
    saveTimer += dt;
    if (uiTimer > 0.15) {
      updateUI();
      uiTimer = 0;
    }
    if (saveTimer > 10) {
      save();
      saveTimer = 0;
    }
  } else if (!$('world').width) world.render(s, npcs, 0);
  requestAnimationFrame(frame);
}
world.render(s, npcs, 0);
updateUI();
requestAnimationFrame(frame);
if (loadWarning) notify(loadWarning);
else if (!s.published && !s.clips.length)
  setTimeout(
    () => notify('Welcome to Little Liberty. Walk near a local, then press F to film.'),
    1200,
  );
// Read-only diagnostics for reproducible browser smoke testing.
window.auditorDebug = {
  conversation: () => ({ lines: structuredClone(conversationLines), active: !!activeBanter }),
  audio: () => ({
    enabled: !muted,
    state: townAudio.ctx?.state || 'not-started',
    gain: townAudio.master?.gain.value || 0,
  }),
  touch: () => ({
    x: touchInput.x,
    y: touchInput.y,
    gas: touchInput.gas,
    reverse: touchInput.reverse,
    brake: touchInput.brake,
    looking: lookDrag !== null,
  }),
  display: () => world.displayInfo?.(),
  controller: () => structuredClone(padInput),
  view: () => ({
    mode: s.viewMode,
    mirror: world.activeMirror ? { x: world.activeMirror.x, z: world.activeMirror.z } : null,
    mirrors: mirrorSites(s.mirrorSeed),
    merch: world.people?.get('auditor')?.merchKind,
    flies: !!world.people?.get('auditor')?.flies?.visible,
    camera: world.camera?.position.toArray(),
  }),
  locals: () => npcs.map((n) => ({ id: n.id, x: n.x, z: n.z, moving: n.moving, flee: n.flee })),
  setEncounterRoll(value) {
    if (value !== null && (!Number.isFinite(value) || value < 0 || value >= 1))
      throw Error('Roll must be null or in [0,1).');
    encounterTestRoll = value;
  },
  castSnapshot: () => studio?.snapshot(),
  get castCount() {
    return world.people?.size || 0;
  },
  recordedFrame: () => capture.canvas.toDataURL(),
  captureFrame: () => world.captureFrame?.() || world.canvas.toDataURL(),
  snapshot: () => structuredClone(s),
  get renderer() {
    return world.backend;
  },
  get recording() {
    return !!record;
  },
  get target() {
    return target?.name ?? null;
  },
};
