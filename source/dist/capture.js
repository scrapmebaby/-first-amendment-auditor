// Records only generated game canvases. Never requests a webcam, microphone or screen.
export class GameCapture {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.stage = document.createElement('canvas');
    this.stageCtx = this.stage.getContext('2d', { willReadFrequently: true });
    this.recorder = null;
    this.elapsed = 0;
    this.pending = new Map();
    this.urls = [];
    this.db = null;
    this.memory = new Map();
  }
  async database() {
    if (this.db) return this.db;
    this.db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('auditor-game-footage', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('takes');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return this.db;
  }
  async store(key, blob) {
    this.memory.set(key, blob);
    try {
      const db = await this.database();
      await new Promise((resolve, reject) => {
        const tx = db.transaction('takes', 'readwrite');
        tx.objectStore('takes').put(blob, key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      /* Gameplay and an in-session clip still work without IndexedDB. */
    }
  }
  start(world) {
    if (!window.MediaRecorder || !this.canvas.captureStream) return false;
    try {
      this.canvas.width = Math.min(960, Math.round(world.w));
      this.canvas.height = Math.round((this.canvas.width * world.h) / world.w);
      this.draw(world, true);
      this.stream = this.canvas.captureStream(0);
      if (!this.stream.getVideoTracks()[0]?.requestFrame) {
        this.stream.getTracks().forEach((t) => t.stop());
        this.stream = this.canvas.captureStream(12);
      }
      let mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/mp4'].find((t) =>
        MediaRecorder.isTypeSupported(t),
      );
      this.chunks = [];
      const options = mime
        ? { mimeType: mime, videoBitsPerSecond: 900000 }
        : { videoBitsPerSecond: 900000 };
      this.recorder = new MediaRecorder(this.stream, options);
      this.recorder.ondataavailable = (e) => {
        if (e.data.size) this.chunks.push(e.data);
      };
      this.recorder.start(1000);
      this.elapsed = 0;
      return true;
    } catch {
      this.recorder = null;
      return false;
    }
  }
  async draw(world, force = false) {
    if ((!force && !this.recorder) || this.drawing) return;
    this.drawing = true;
    try {
      const w = this.canvas.width,
        h = this.canvas.height;
      if (this.stage.width !== w || this.stage.height !== h) {
        this.stage.width = w;
        this.stage.height = h;
      }
      const c = this.stageCtx;
      c.clearRect(0, 0, w, h);
      await world.drawSnapshot(c, w, h);
      c.drawImage(world.overlay, 0, 0, w, h);
      c.fillStyle = '#1f2923dd';
      c.fillRect(15, 15, 170, 31);
      c.fillStyle = '#e27460';
      c.beginPath();
      c.arc(30, 30, 4, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#fbf8e9';
      c.font = '11px monospace';
      c.fillText('REC  LITTLE LIBERTY', 42, 34);
      const speech = document.getElementById('speech');
      if (speech && !speech.classList.contains('hidden')) {
        c.font = 'bold 14px sans-serif';
        const words = speech.textContent.split(' ');
        let lines = [''];
        for (const word of words) {
          if (c.measureText(lines[lines.length - 1] + ' ' + word).width > w - 90) lines.push(word);
          else lines[lines.length - 1] += ' ' + word;
        }
        c.fillStyle = '#1e2924dd';
        c.fillRect(25, h - 40 - lines.length * 21, w - 50, lines.length * 21 + 17);
        c.fillStyle = '#f9f7e9';
        c.textAlign = 'center';
        lines.forEach((line, i) =>
          c.fillText(line.trim(), w / 2, h - 43 - (lines.length - 1 - i) * 21),
        );
        c.textAlign = 'left';
      }
      c.strokeStyle = '#faffef88';
      c.lineWidth = 1;
      c.strokeRect(10, 10, w - 20, h - 20);
      this.ctx.drawImage(this.stage, 0, 0);
      this.stream?.getVideoTracks()[0]?.requestFrame?.();
    } catch {
    } finally {
      this.drawing = false;
    }
  }
  tick(world, dt) {
    this.elapsed += dt;
    if (this.elapsed > 0.083) {
      this.elapsed = 0;
      this.draw(world);
    }
  }
  stop(key) {
    if (!this.recorder) return;
    const recorder = this.recorder,
      chunks = this.chunks,
      stream = this.stream;
    this.recorder = null;
    const done = new Promise((resolve) => {
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (key && chunks.length) {
          const blob = new Blob(chunks, { type: recorder.mimeType });
          await this.store(key, blob);
        }
        resolve();
      };
      try {
        recorder.stop();
      } catch {
        resolve();
      }
    });
    if (key) {
      this.pending.set(key, done);
      done.then(() => this.pending.delete(key));
    }
    return done;
  }
  async get(key) {
    if (this.pending.has(key)) await this.pending.get(key);
    if (this.memory.has(key)) return this.memory.get(key);
    try {
      const db = await this.database();
      return await new Promise((resolve) => {
        const req = db.transaction('takes').objectStore('takes').get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }
  async remove(key) {
    if (!key) return;
    this.memory.delete(key);
    try {
      const db = await this.database();
      db.transaction('takes', 'readwrite').objectStore('takes').delete(key);
    } catch {}
  }
  async clear() {
    this.memory.clear();
    try {
      const db = await this.database();
      db.transaction('takes', 'readwrite').objectStore('takes').clear();
    } catch {}
  }
  releaseURLs() {
    this.urls.forEach((u) => URL.revokeObjectURL(u));
    this.urls = [];
  }
  url(blob) {
    const url = URL.createObjectURL(blob);
    this.urls.push(url);
    return url;
  }
}
