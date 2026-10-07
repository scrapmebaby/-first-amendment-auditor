// Standard Gamepad API layout: Xbox / PlayStation positional equivalents.
export function deadzone(value, threshold = 0.18) {
  if (!Number.isFinite(value) || Math.abs(value) <= threshold) return 0;
  return Math.sign(value) * Math.min(1, (Math.abs(value) - threshold) / (1 - threshold));
}
export class Controller {
  constructor() {
    this.previous = [];
    this.index = null;
  }
  poll(pads, active = true) {
    const pad = Array.from(pads || []).find((p) => p?.connected && p.mapping === 'standard');
    const buttons = Array.from({ length: 17 }, (_, i) => !!pad?.buttons[i]?.pressed);
    const changed = this.index !== (pad?.index ?? null);
    const pressed = buttons.map((b, i) => active && !changed && b && !this.previous[i]);
    this.previous = buttons;
    this.index = pad?.index ?? null;
    const enabled = !!pad && active;
    return {
      connected: !!pad,
      pressed,
      x: enabled ? deadzone(pad.axes[0]) : 0,
      y: enabled ? deadzone(pad.axes[1]) : 0,
      lookX: enabled ? deadzone(pad.axes[2]) : 0,
      lookY: enabled ? deadzone(pad.axes[3]) : 0,
      gas: enabled ? Math.max(0, Math.min(1, pad.buttons[7]?.value || 0)) : 0,
      reverse: enabled ? Math.max(0, Math.min(1, pad.buttons[6]?.value || 0)) : 0,
      sprint: enabled && buttons[10],
      brake: enabled && buttons[1],
    };
  }
}
