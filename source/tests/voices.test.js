import assert from 'node:assert/strict';
import { CharacterSpeech } from '../dist/voices.js';
import { fresh, validSave, migrateSave } from '../dist/core.js';
function fixture() {
  let available = [];
  const spoken = [],
    listeners = {},
    stored = {};
  const env = {
    SpeechSynthesisUtterance: class {
      constructor(text) {
        this.text = text;
      }
    },
    speechSynthesis: {
      getVoices: () => available,
      addEventListener: (name, fn) => (listeners[name] = fn),
      speak: (u) => spoken.push(u),
      cancel: () => {},
    },
    localStorage: { getItem: (k) => stored[k], setItem: (k, v) => (stored[k] = v) },
  };
  const speech = new CharacterSpeech(env);
  return {
    speech,
    spoken,
    env,
    load: () => {
      available = ['A', 'B', 'C'].map((name) => ({
        voiceURI: name,
        lang: 'en-US',
        localService: true,
      }));
      listeners.voiceschanged();
    },
  };
}
const f = fixture();
f.speech.speak('auditor', 'Muted');
assert.equal(f.spoken.length, 0);
f.speech.configure(true, 0.7);
f.speech.speak('auditor', 'Not activated');
assert.equal(f.spoken.length, 0);
f.speech.activate();
f.load();
f.speech.speak('auditor', 'AUDITOR: “First line.”');
f.speech.speak('local-1', 'Second line.');
assert.equal(f.spoken.at(-1).text, 'First line.');
assert.equal(f.spoken.at(-1).volume, 0.7);
const firstVoice = f.spoken.at(-1).voice.voiceURI;
f.spoken.at(-1).onend();
assert.equal(f.spoken.at(-1).text, 'Second line.');
assert.notEqual(f.spoken.at(-1).voice.voiceURI, firstVoice);
f.spoken.at(-1).onend();
assert.equal(f.speech.busy, false);
const restored = new CharacterSpeech(f.env);
assert.equal(restored.profile('auditor').voice.voiceURI, firstVoice);
f.speech.speak('auditor', 'Current');
for (let i = 0; i < 6; i++) f.speech.speak('local-1', `Queued ${i}`);
assert.equal(f.speech.queue.length, 2);
f.speech.configure(false, 0.7);
assert.equal(f.speech.busy, false);
f.speech.configure(true, 0.7);
f.speech.speak('auditor', 'Blocked');
f.spoken.at(-1).onerror({ error: 'not-allowed' });
assert.equal(f.speech.activated, false);
assert.equal(f.speech.busy, false);
f.speech.activate();
f.speech.speak('auditor', 'Retry');
assert.equal(f.speech.busy, true);
f.speech.stop();
const unsupported = new CharacterSpeech({});
unsupported.configure(true, 1);
unsupported.activate();
unsupported.speak('a', 'b');
assert.equal(unsupported.busy, false);
const old = fresh();
delete old.voices;
delete old.voiceVolume;
assert.ok(validSave(old));
assert.equal(migrateSave(old).voiceVolume, 0.8);
assert.equal(validSave({ ...fresh(), voiceVolume: NaN }), false);
assert.equal(validSave({ ...fresh(), voices: 'yes' }), false);
console.log(
  'Speech activation, asynchronous voices, distinct saved assignments, sequencing, bounded queue, mute, errors, fallback and save validation passed.',
);
