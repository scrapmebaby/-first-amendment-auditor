export function stickVector(dx, dy, radius = 48) {
  const length = Math.hypot(dx, dy),
    amount = Math.min(1, length / radius);
  const speed = amount <= 0.12 ? 0 : (amount - 0.12) / 0.88;
  return {
    x: length ? (dx / length) * speed : 0,
    y: length ? (dy / length) * speed : 0,
    sprint: amount > 0.94,
  };
}
// Each control owns its pointer: lifting the look thumb must not release steering.
export class TouchInput {
  constructor(stick, knob, pedals) {
    this.stick = stick;
    this.knob = knob;
    this.pointer = null;
    this.x = this.y = 0;
    this.sprint = false;
    this.held = new Map();
    const update = (e) => {
      const r = stick.getBoundingClientRect(),
        dx = e.clientX - r.left - r.width / 2,
        dy = e.clientY - r.top - r.height / 2;
      Object.assign(this, stickVector(dx, dy));
      const scale = Math.min(1, 48 / (Math.hypot(dx, dy) || 1));
      knob.style.transform = `translate(${dx * scale}px,${dy * scale}px)`;
    };
    stick.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.pointer !== null) return;
      this.pointer = e.pointerId;
      stick.setPointerCapture(e.pointerId);
      update(e);
    });
    stick.addEventListener('pointermove', (e) => {
      if (e.pointerId === this.pointer) {
        e.preventDefault();
        update(e);
      }
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
      stick.addEventListener(event, (e) => {
        if (e.pointerId === this.pointer) {
          this.pointer = null;
          this.x = this.y = 0;
          this.sprint = false;
          knob.style.transform = '';
        }
      });
    for (const button of pedals) {
      button.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        button.setPointerCapture(e.pointerId);
        this.held.set(e.pointerId, button.dataset.pedal);
        button.classList.add('held');
      });
      for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'])
        button.addEventListener(event, (e) => {
          this.held.delete(e.pointerId);
          if (![...this.held.values()].includes(button.dataset.pedal))
            button.classList.remove('held');
        });
    }
    this.pedals = pedals;
  }
  get gas() {
    return [...this.held.values()].includes('gas') ? 1 : 0;
  }
  get reverse() {
    return [...this.held.values()].includes('reverse') ? 1 : 0;
  }
  get brake() {
    return [...this.held.values()].includes('brake');
  }
  reset() {
    this.pointer = null;
    this.x = this.y = 0;
    this.sprint = false;
    this.held.clear();
    this.knob.style.transform = '';
    for (const b of this.pedals) b.classList.remove('held');
  }
}
