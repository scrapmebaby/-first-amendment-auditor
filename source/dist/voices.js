// Device speech: no API keys, hosted speech endpoint or audio-file library.
export class CharacterSpeech {
  constructor(env = globalThis) {
    this.env = env;
    this.synth = env.speechSynthesis;
    this.supported = !!(this.synth && env.SpeechSynthesisUtterance);
    this.enabled = false;
    this.volume = 0.8;
    this.activated = false;
    this.queue = [];
    this.current = null;
    this.assignments = {};
    try {
      const saved = JSON.parse(env.localStorage?.getItem('auditor-device-voices') || '{}');
      if (saved && typeof saved === 'object' && !Array.isArray(saved))
        for (const [key, value] of Object.entries(saved).slice(0, 40))
          if (typeof value === 'string' && value.length < 500) this.assignments[key] = value;
    } catch {
      /* Storage is optional. */
    }
    this.refresh = () => {
      this.voices = (this.synth?.getVoices() || [])
        .filter((v) => /^en(?:-|_|$)/i.test(v.lang))
        .sort(
          (a, b) =>
            Number(b.localService) - Number(a.localService) || a.voiceURI.localeCompare(b.voiceURI),
        );
    };
    this.refresh();
    this.synth?.addEventListener('voiceschanged', this.refresh);
  }
  configure(enabled, volume) {
    this.enabled = this.supported && enabled;
    this.volume = Math.max(0, Math.min(1, volume));
    if (!this.enabled || !this.volume) this.stop();
  }
  activate() {
    if (!this.enabled || this.activated) return;
    this.activated = true;
    // Called within a user gesture; Safari may require activation each page load.
    const warmup = new this.env.SpeechSynthesisUtterance(' ');
    warmup.volume = 0;
    try {
      this.synth.speak(warmup);
    } catch {
      this.activated = false;
    }
  }
  get busy() {
    return !!this.current || this.queue.length > 0;
  }
  profile(actor) {
    let hash = 0;
    for (const c of actor) hash = (Math.imul(hash, 31) + c.charCodeAt(0)) >>> 0;
    let voice = this.voices.find((v) => v.voiceURI === this.assignments[actor]);
    if (!voice && this.voices.length) {
      const used = new Set(Object.values(this.assignments));
      voice =
        this.voices.find((v) => !used.has(v.voiceURI)) || this.voices[hash % this.voices.length];
      this.assignments[actor] = voice.voiceURI;
      try {
        this.env.localStorage?.setItem('auditor-device-voices', JSON.stringify(this.assignments));
      } catch {
        /* Optional. */
      }
    }
    return { voice, pitch: 0.92 + (hash % 5) * 0.04, rate: 0.94 + (hash % 4) * 0.04 };
  }
  speak(actor, text) {
    if (!this.enabled || !this.activated || !this.volume) return;
    // A short bounded queue prevents a backlog of old arguments.
    if (this.queue.length >= 2) this.queue.shift();
    this.queue.push({
      actor,
      text: text
        .replace(/^(?:AUDITOR|OFFICER):\s*/, '')
        .replace(/[“”]/g, '')
        .slice(0, 600),
    });
    this.next();
  }
  next() {
    if (this.current || !this.queue.length) return;
    const line = this.queue.shift();
    const utterance = new this.env.SpeechSynthesisUtterance(line.text);
    const profile = this.profile(line.actor);
    if (profile.voice) utterance.voice = profile.voice;
    utterance.lang = profile.voice?.lang || 'en-US';
    utterance.pitch = profile.pitch;
    utterance.rate = profile.rate;
    utterance.volume = this.volume;
    this.current = utterance;
    const done = () => {
      if (this.current !== utterance) return;
      clearTimeout(this.timer);
      this.current = null;
      this.next();
    };
    utterance.onend = done;
    utterance.onerror = (e) => {
      if (e.error === 'not-allowed') {
        this.activated = false;
        this.queue.length = 0;
      }
      done();
    };
    // Failed engines must never stall the conversation simulation.
    this.timer = setTimeout(() => {
      this.stop();
    }, 20000);
    try {
      this.synth.speak(utterance);
    } catch {
      done();
    }
  }
  stop() {
    clearTimeout(this.timer);
    this.queue.length = 0;
    this.current = null;
    this.synth?.cancel();
  }
}
