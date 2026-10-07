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
      this.motor = a.createOscillator();
      this.motor.type = 'triangle';
      this.motor.frequency.value = 45;
      this.motorGain = a.createGain();
      this.motorGain.gain.value = 0;
      this.motor.connect(this.motorGain);
      this.motorGain.connect(this.master);
      this.motor.start();
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
    this.motorGain.gain.setTargetAtTime(s.driving ? 0.065 : 0.004, t, 0.12);
    this.motor.frequency.setTargetAtTime(
      s.driving && s.moving ? 64 + Math.sin(t * 2) * 5 : 34,
      t,
      0.15,
    );
    this.sirenGain.gain.setTargetAtTime(patrol ? 0.018 : 0, t, 0.1);
    this.siren.frequency.setTargetAtTime(530 + (Math.sin(t * 6) + 1) * 170, t, 0.03);
  }
}
