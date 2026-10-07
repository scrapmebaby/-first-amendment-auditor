// Original procedural weather: layered haze, drifting cloud shade, shafts, rain and wet-road glints.
export const WEATHER = {
  clear: { name: 'CLEAR SKIES', rain: 0, fog: 0.08, cloud: 0.18, warm: 0.15 },
  golden: { name: 'GOLDEN HOUR', rain: 0, fog: 0.2, cloud: 0.2, warm: 0.48 },
  overcast: { name: 'OVERCAST', rain: 0, fog: 0.23, cloud: 0.72, warm: 0 },
  rain: { name: 'RAIN SHOWERS', rain: 1, fog: 0.4, cloud: 0.9, warm: 0 },
  fog: { name: 'MORNING FOG', rain: 0, fog: 0.78, cloud: 0.35, warm: 0.12 },
};
export class Atmosphere {
  constructor() {
    this.choice = 'living';
    this.current = 'clear';
    this.rain = 0;
    this.fog = 0.08;
    this.cloud = 0.18;
    this.warm = 0.15;
    this.t = 0;
    this.seed = Array.from({ length: 170 }, (_, i) => ({
      x: ((i * 137.508) % 1000) / 1000,
      y: ((i * 73.73) % 997) / 997,
      s: 0.5 + (i % 5) * 0.15,
    }));
  }
  update(dt, minutes) {
    this.t += dt;
    let key = this.choice;
    if (key === 'living') {
      const cycle = Math.floor(this.t / 100) % 6;
      key = ['clear', 'golden', 'overcast', 'rain', 'fog', 'clear'][cycle];
      if (minutes > 1050 && minutes < 1230) key = 'golden';
    }
    this.current = key;
    const p = WEATHER[key] || WEATHER.clear;
    for (const k of ['rain', 'fog', 'cloud', 'warm'])
      this[k] += (p[k] - this[k]) * Math.min(dt * 0.18, 1);
  }
  tint(c, x, z, y) {
    const shade =
        (Math.sin(x * 0.027 + this.t * 0.06) + Math.cos(z * 0.041 + this.t * 0.04) + 2) / 4,
      cloud = this.cloud * shade * 0.2;
    return [
      Math.min(1, c[0] * (1 - cloud) + this.warm * 0.1),
      Math.min(1, c[1] * (1 - cloud) - this.warm * 0.006),
      Math.max(0, c[2] * (1 - cloud) - this.warm * 0.09),
    ];
  }
  draw(c, w, h, world) {
    const t = this.t;
    c.save();
    if (this.warm > 0.03) {
      let glow = c.createRadialGradient(w * 0.83, -h * 0.15, 0, w * 0.83, -h * 0.15, w * 0.9);
      glow.addColorStop(0, `rgba(255,221,149,${this.warm * 0.56})`);
      glow.addColorStop(0.5, `rgba(255,210,140,${this.warm * 0.12})`);
      glow.addColorStop(1, 'rgba(255,210,140,0)');
      c.fillStyle = glow;
      c.fillRect(0, 0, w, h);
      c.globalCompositeOperation = 'screen';
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        c.moveTo(w * 0.88 + i * 30, -80);
        c.lineTo(w * (0.02 + i * 0.19) + Math.sin(t * 0.035) * 40, h);
        c.lineTo(w * (0.2 + i * 0.19) + Math.sin(t * 0.035) * 40, h);
        c.closePath();
        const g = c.createLinearGradient(w * 0.8, 0, w * 0.4, h);
        g.addColorStop(0, `rgba(255,235,180,${this.warm * 0.1})`);
        g.addColorStop(1, 'rgba(255,235,180,0)');
        c.fillStyle = g;
        c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    }
    if (this.cloud > 0.1) {
      for (let i = 0; i < 3; i++) {
        let x = ((t * 7 + i * w * 0.54) % (w * 1.8)) - w * 0.4,
          y = h * (0.22 + i * 0.23);
        const g = c.createRadialGradient(x, y, 0, x, y, w * 0.34);
        g.addColorStop(0, `rgba(48,65,66,${this.cloud * 0.1})`);
        g.addColorStop(1, 'rgba(48,65,66,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
      }
    }
    const haze = c.createLinearGradient(0, 0, 0, h);
    haze.addColorStop(0, `rgba(232,236,221,${0.14 + this.fog * 0.55})`);
    haze.addColorStop(0.5, `rgba(228,235,221,${this.fog * 0.16})`);
    haze.addColorStop(1, 'rgba(226,234,222,0)');
    c.fillStyle = haze;
    c.fillRect(0, 0, w, h);
    if (this.fog > 0.3) {
      for (let i = 0; i < 3; i++) {
        const x = (Math.sin(t * 0.025 + i * 2) * 0.3 + 0.5) * w,
          y = h * (0.35 + i * 0.2),
          g = c.createRadialGradient(x, y, 10, x, y, w * 0.5);
        g.addColorStop(0, `rgba(231,237,225,${this.fog * 0.14})`);
        g.addColorStop(1, 'rgba(231,237,225,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
      }
    }
    if (this.rain > 0.01) {
      c.fillStyle = `rgba(54,73,83,${this.rain * 0.09})`;
      c.fillRect(0, 0, w, h);
      c.lineWidth = 0.85;
      for (let i = 0; i < this.seed.length; i++) {
        const p = this.seed[i],
          x = ((((p.x * w - t * 110 * p.s) % (w + 80)) + w + 80) % (w + 80)) - 40,
          y = ((p.y * h + t * 390 * p.s) % (h + 80)) - 40;
        c.strokeStyle = `rgba(225,237,233,${this.rain * (0.18 + p.s * 0.17)})`;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - 7 * p.s, y + 25 * p.s);
        c.stroke();
        if (i < 32) {
          const a = (t * 0.8 + p.x * 10) % 1;
          c.strokeStyle = `rgba(217,232,219,${(1 - a) * this.rain * 0.23})`;
          c.beginPath();
          c.ellipse(p.x * w, p.y * h, 1 + a * 7, 1 + a * 2, 0, 0, Math.PI * 2);
          c.stroke();
        }
      }
    }
    let vignette = c.createRadialGradient(w * 0.5, h * 0.46, w * 0.18, w * 0.5, h * 0.5, w * 0.8);
    vignette.addColorStop(0, 'rgba(30,41,28,0)');
    vignette.addColorStop(1, 'rgba(30,41,28,.18)');
    c.fillStyle = vignette;
    c.fillRect(0, 0, w, h);
    c.restore();
  }
}
