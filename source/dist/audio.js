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
      filter.frequency.value = 1600;
      this.weather = a.createGain();
      this.weather.gain.value = 0;
      source.connect(filter);
      filter.connect(this.weather);
      this.weather.connect(this.master);
      source.start();
      this.engine = new RustEngine(a, this.master, buffer);
      this.siren = a.createOscillator();
      this.siren.type = 'sine';
      this.sirenGain = a.createGain();
      this.sirenGain.gain.value = 0;
      this.siren.connect(this.sirenGain);
      this.sirenGain.connect(this.master);
      this.siren.start();
    } catch {}
  }
  update(s, w, patrol, muted, paused) {
    if (!this.ctx) return;
    const a = this.ctx,
      t = a.currentTime;
    this.master.gain.setTargetAtTime(muted || paused ? 0 : 0.5, t, 0.15);
    this.weather.gain.setTargetAtTime(0.012 + w.rain * 0.085 + w.cloud * 0.015, t, 0.4);
    this.engine.update(s, t);
    this.sirenGain.gain.setTargetAtTime(patrol ? 0.018 : 0, t, 0.1);
    this.siren.frequency.setTargetAtTime(530 + (Math.sin(t * 6) + 1) * 170, t, 0.03);
  }
}
