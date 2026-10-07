// A wheezing exhaust: voiced buzz, loose flutter, and short falling rasp bursts.
// All sources are synthesized locally and reused for the life of the audio context.
export class RustEngine {
  constructor(ctx, output, noiseBuffer) {
    this.ctx = ctx;
    this.gain = ctx.createGain();
    this.gain.gain.value = 0;
    this.gain.connect(output);
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 320;
    this.filter.Q.value = 2.5;
    this.flutterGain = ctx.createGain();
    this.flutterGain.gain.value = 0.57;
    this.filter.connect(this.flutterGain);
    this.flutterGain.connect(this.gain);
    this.voice = ctx.createOscillator();
    this.voice.type = 'sawtooth';
    this.voice.frequency.value = 42;
    this.voice.connect(this.filter);
    this.flutter = ctx.createOscillator();
    this.flutter.type = 'triangle';
    this.flutter.frequency.value = 13;
    this.flutterDepth = ctx.createGain();
    this.flutterDepth.gain.value = 0.38;
    this.flutter.connect(this.flutterDepth);
    this.flutterDepth.connect(this.flutterGain.gain);
    this.wobble = ctx.createOscillator();
    this.wobble.frequency.value = 5.3;
    this.wobbleDepth = ctx.createGain();
    this.wobbleDepth.gain.value = 9;
    this.wobble.connect(this.wobbleDepth);
    this.wobbleDepth.connect(this.voice.frequency);
    this.rasp = ctx.createBufferSource();
    this.rasp.buffer = noiseBuffer;
    this.rasp.loop = true;
    this.raspFilter = ctx.createBiquadFilter();
    this.raspFilter.type = 'bandpass';
    this.raspFilter.frequency.value = 220;
    this.raspFilter.Q.value = 0.8;
    this.raspGain = ctx.createGain();
    this.raspGain.gain.value = 0;
    this.rasp.connect(this.raspFilter);
    this.raspFilter.connect(this.raspGain);
    this.raspGain.connect(this.gain);
    for (const source of [this.voice, this.flutter, this.wobble, this.rasp]) source.start();
    this.nextBurst = 0;
    this.burstAt = -100;
    this.burstLength = 0.4;
    this.previousSpeed = 0;
    this.previousTime = 0;
    this.count = 0;
  }
  update(state, time = this.ctx.currentTime) {
    const speed = Math.min(19, Math.abs(state.carSpeed || 0));
    const dt = Math.max(0.016, Math.min(0.2, time - this.previousTime));
    const load = Math.max(0, Math.min(1, (speed - this.previousSpeed) / dt / 8));
    this.previousSpeed = speed;
    this.previousTime = time;
    const active = state.driving;
    const rpm = speed / 19;
    if (active && time >= this.nextBurst) {
      this.count++;
      this.burstAt = time;
      // Unequal lengths keep the exhaust from sounding like a looped notification.
      const variation = (Math.sin(this.count * 12.9898) * 43758.5453) % 1;
      this.burstLength = 0.24 + Math.abs(variation) * 0.3;
      this.nextBurst = time + this.burstLength + 0.16 + (1 - rpm) * 0.55;
    }
    const progress = (time - this.burstAt) / this.burstLength;
    const puff = active && progress >= 0 && progress < 1 ? Math.sin(Math.PI * progress) ** 0.7 : 0;
    const descending = progress >= 0 && progress < 1 ? (1 - progress) * 24 * puff : 0;
    this.gain.gain.setTargetAtTime(active ? 0.12 + rpm * 0.045 + load * 0.025 : 0, time, 0.07);
    this.voice.frequency.setTargetAtTime(38 + rpm * 48 + load * 14 + descending, time, 0.035);
    this.filter.frequency.setTargetAtTime(190 + rpm * 420 + load * 180 + puff * 130, time, 0.06);
    this.flutter.frequency.setTargetAtTime(10 + rpm * 24 + puff * 8, time, 0.045);
    this.wobbleDepth.gain.setTargetAtTime(5 + (1 - rpm) * 8 + puff * 5, time, 0.05);
    this.raspGain.gain.setTargetAtTime(puff * (0.14 + load * 0.16), time, 0.02);
  }
}

// Sparse bird calls and short, original chord phrases; silence is part of the score.
export class OutdoorAmbience {
  constructor(ctx, output, random = Math.random) {
    this.ctx = ctx;
    this.random = random;
    this.birds = ctx.createGain();
    this.birds.gain.value = 0;
    this.birds.connect(output);
    this.music = ctx.createGain();
    this.music.gain.value = 0;
    this.music.connect(output);
    this.calls = Array.from({ length: 3 }, (_, i) => {
      const voice = ctx.createOscillator(),
        gain = ctx.createGain(),
        pan = ctx.createStereoPanner();
      voice.type = 'sine';
      voice.frequency.value = 2100;
      gain.gain.value = 0;
      pan.pan.value = (i - 1) * 0.65;
      voice.connect(gain);
      gain.connect(pan);
      pan.connect(this.birds);
      voice.start();
      return { voice, gain, pan };
    });
    this.notes = Array.from({ length: 3 }, (_, i) => {
      const voice = ctx.createOscillator(),
        gain = ctx.createGain(),
        pan = ctx.createStereoPanner();
      voice.type = 'sine';
      voice.frequency.value = 220;
      gain.gain.value = 0;
      pan.pan.value = (i - 1) * 0.35;
      voice.connect(gain);
      gain.connect(pan);
      pan.connect(this.music);
      voice.start();
      return { voice, gain };
    });
    this.nextBird = ctx.currentTime + 1.2;
    this.nextMusic = ctx.currentTime + 8;
    this.phrase = 0;
    this.birdIndex = 0;
  }
  call(t) {
    const { voice, gain, pan } = this.calls[this.birdIndex++ % this.calls.length];
    const pitch = 1700 + this.random() * 1300,
      count = 2 + Math.floor(this.random() * 3);
    pan.pan.setValueAtTime(this.random() * 1.5 - 0.75, t);
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(0, t);
    voice.frequency.cancelScheduledValues(t);
    for (let i = 0; i < count; i++) {
      const start = t + i * 0.19,
        duration = 0.075 + this.random() * 0.06;
      voice.frequency.setValueAtTime(pitch * (1 + i * 0.035), start);
      voice.frequency.exponentialRampToValueAtTime(pitch * 1.32, start + duration * 0.35);
      voice.frequency.exponentialRampToValueAtTime(pitch * 0.83, start + duration);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.45, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      gain.gain.setValueAtTime(0, start + duration + 0.01);
    }
  }
  phraseAt(t) {
    // Open voicings with slow entrances, rather than a constant repeating melody.
    const chords = [
      [48, 55, 64],
      [45, 52, 60],
      [41, 48, 57],
      [43, 50, 59],
    ];
    for (let bar = 0; bar < 3; bar++) {
      const chord = chords[(this.phrase + bar) % chords.length];
      this.notes.forEach(({ voice, gain }, i) => {
        const start = t + bar * 4.8 + i * 0.24;
        voice.frequency.setValueAtTime(440 * 2 ** ((chord[i] - 69) / 12), start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.3, start + 1.3);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 4.3);
        gain.gain.setValueAtTime(0, start + 4.5);
      });
    }
    this.phrase = (this.phrase + 1) % chords.length;
  }
  update(s, weather, quiet, t = this.ctx.currentTime) {
    const day = s.minutes >= 360 && s.minutes < 1200;
    const outside = !s.driving;
    const birdsAllowed = day && weather.rain < 0.65 && outside && !quiet;
    this.birds.gain.setTargetAtTime(birdsAllowed ? 0.028 * (1 - weather.rain) : 0, t, 0.65);
    const musicAllowed = s.music !== false && outside && !quiet;
    this.music.gain.setTargetAtTime(musicAllowed ? 0.024 : 0, t, 0.9);
    if (birdsAllowed && t >= this.nextBird) {
      this.call(t + 0.025);
      this.nextBird = t + 3 + this.random() * 7;
    }
    if (musicAllowed && t >= this.nextMusic) {
      this.phraseAt(t + 0.03);
      this.nextMusic = t + 55 + this.random() * 35;
    }
    // A pause never creates a backlog of calls or queued phrases on resume.
    if (quiet || !outside) {
      this.nextBird = Math.max(this.nextBird, t + 1.2);
      this.nextMusic = Math.max(this.nextMusic, t + 12);
    }
  }
}

export class TownAudio {
  constructor() {
    this.ctx = null;
  }
  start() {
    if (this.ctx) {
      this.ctx.resume();
      return;
    }
    try {
      const a = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
      this.master = a.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(a.destination);
      const buffer = a.createBuffer(1, a.sampleRate * 3, a.sampleRate),
        data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const source = a.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = a.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      this.windFilter = filter;
      this.weather = a.createGain();
      this.weather.gain.value = 0;
      source.connect(filter);
      filter.connect(this.weather);
      this.weather.connect(this.master);
      source.start();
      this.engine = new RustEngine(a, this.master, buffer);
      this.outdoors = new OutdoorAmbience(a, this.master);
      this.siren = a.createOscillator();
      this.siren.type = 'sine';
      this.sirenGain = a.createGain();
      this.sirenGain.gain.value = 0;
      this.siren.connect(this.sirenGain);
      this.sirenGain.connect(this.master);
      this.siren.start();
    } catch {}
  }
  update(s, w, patrol, muted, paused, conversation = false) {
    if (!this.ctx) return;
    const a = this.ctx,
      t = a.currentTime;
    this.master.gain.setTargetAtTime(muted || paused ? 0 : 0.5, t, 0.15);
    const gust = 0.72 + 0.2 * Math.sin(t * 0.23) + 0.08 * Math.sin(t * 0.71);
    this.windFilter.frequency.setTargetAtTime(450 + gust * 400 + w.rain * 1400, t, 1.2);
    this.weather.gain.setTargetAtTime(
      (0.02 * gust + w.rain * 0.085 + w.cloud * 0.012) * (s.driving ? 0.22 : 1),
      t,
      0.8,
    );
    this.outdoors.update(s, w, muted || paused || patrol || conversation, t);
    this.engine.update(s, t);
    this.sirenGain.gain.setTargetAtTime(patrol ? 0.018 : 0, t, 0.1);
    this.siren.frequency.setTargetAtTime(530 + (Math.sin(t * 6) + 1) * 170, t, 0.03);
  }
}
