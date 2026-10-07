import { clamp } from './core.js';
import { Atmosphere } from './atmosphere.js';
const rgb = (h) => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];
const shade = (c, f) => c.map((v) => clamp(v * f, 0, 1));
export const LOCATIONS = [
  {
    x: 23,
    z: -21,
    w: 26,
    d: 18,
    h: 10,
    name: 'CITY HALL',
    type: 'civic',
    color: '#dcd5bd',
    sub: 'Civic district',
    icon: '⚑',
  },
  {
    x: -25,
    z: -24,
    w: 23,
    d: 16,
    h: 8,
    name: 'PUBLIC LIBRARY',
    type: 'library',
    color: '#c6b794',
    sub: 'Library square',
    icon: '▤',
  },
  {
    x: -24,
    z: 26,
    w: 22,
    d: 15,
    h: 7,
    name: 'POST OFFICE',
    type: 'post',
    color: '#c8c7b3',
    sub: 'Postal quarter',
    icon: '✉',
  },
  {
    x: 26,
    z: 27,
    w: 19,
    d: 15,
    h: 7,
    name: 'DAILY GRIND',
    type: 'cafe',
    color: '#bc8060',
    sub: 'Market street',
    icon: '☕',
  },
  {
    x: 69,
    z: -22,
    w: 21,
    d: 22,
    h: 9,
    name: 'POLICE',
    type: 'police',
    color: '#b8c8c5',
    sub: 'Justice quarter',
    icon: '★',
  },
  {
    x: -68,
    z: 26,
    w: 23,
    d: 17,
    h: 9,
    name: 'HOSPITAL',
    type: 'hospital',
    color: '#d9d7c7',
    sub: 'Medical district',
    icon: '+',
  },
  {
    x: 26,
    z: 69,
    w: 23,
    d: 17,
    h: 6,
    name: 'QUESTIONABLE GEAR',
    type: 'shop',
    color: '#a2b094',
    sub: 'Retail district',
    icon: '▣',
  },
  {
    x: -25,
    z: 70,
    w: 24,
    d: 17,
    h: 6,
    name: 'YOUR EDITING DEN',
    type: 'home',
    color: '#b3aaa0',
    sub: 'Trailer row',
    icon: '⌂',
  },
  {
    x: 68,
    z: 26,
    w: 20,
    d: 19,
    h: 7,
    name: 'AUTO DISREPAIR',
    type: 'garage',
    color: '#bca78e',
    sub: 'Industrial park',
    icon: '⚙',
  },
  {
    x: -68,
    z: -23,
    w: 22,
    d: 19,
    h: 7,
    name: 'BORING INSURANCE',
    type: 'office',
    color: '#b2bab0',
    sub: 'Business district',
    icon: '▦',
  },
  {
    x: -25,
    z: -68,
    w: 22,
    d: 18,
    h: 6,
    name: 'NOTHING TO SEE',
    type: 'office',
    color: '#c0b09c',
    sub: 'North district',
    icon: '▦',
  },
  {
    x: 26,
    z: -68,
    w: 23,
    d: 19,
    h: 9,
    name: 'COUNTY COURT',
    type: 'court',
    color: '#c7beaa',
    sub: 'Courthouse square',
    icon: '⚖',
  },
  {
    x: 68,
    z: 69,
    w: 22,
    d: 19,
    h: 6,
    name: 'TAXPAYER PARK',
    type: 'park',
    color: '#8caa6c',
    sub: 'Taxpayer park',
    icon: '♧',
  },
  {
    x: -68,
    z: 68,
    w: 21,
    d: 17,
    h: 6,
    name: 'ACTUAL NEWS',
    type: 'office',
    color: '#d0bda5',
    sub: 'Press row',
    icon: '▤',
  },
];
export function collision(x, z, pad = 0.9) {
  if (Math.abs(x - 7) < 1.6 + pad && Math.abs(z - 4) < 0.2 + pad) return true;
  return LOCATIONS.some(
    (b) =>
      b.type !== 'park' && Math.abs(x - b.x) < b.w / 2 + pad && Math.abs(z - b.z) < b.d / 2 + pad,
  );
}
export function locationAt(x, z) {
  let near = LOCATIONS[0];
  for (const b of LOCATIONS)
    if (Math.hypot(b.x - x, b.z - z) < Math.hypot(near.x - x, near.z - z)) near = b;
  return near;
}
export class World {
  constructor(canvas, overlay) {
    this.canvas = canvas;
    this.overlay = overlay;
    this.ctx = overlay.getContext('2d');
    this.zoom = 8.1;
    this.cx = 1;
    this.cz = 0;
    this.polys = [];
    this.static = [];
    this.w = 1;
    this.h = 1;
    this.time = 0;
    this.backend = 'Canvas fallback';
    this.atmosphere = new Atmosphere();
    this.particles = [];
    this.patrol = null;
    this.makeTown();
  }
  async init() {
    if (navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw Error('No adapter');
        this.device = await adapter.requestDevice();
        this.device.addEventListener('uncapturederror', (event) =>
          console.error('WebGPU:', event.error.message),
        );
        this.gpu = this.canvas.getContext('webgpu');
        if (!this.gpu) throw Error('No WebGPU context');
        this.format = navigator.gpu.getPreferredCanvasFormat();
        this.gpu.configure({ device: this.device, format: this.format, alphaMode: 'opaque' });
        const shader = this.device.createShaderModule({
          code: `struct Out { @builtin(position) position: vec4f, @location(0) color: vec3f }; @vertex fn vs(@location(0) p:vec4f,@location(1) c:vec4f)->Out {var o:Out; o.position=p;o.color=c.xyz;return o;} @fragment fn fs(i:Out)->@location(0) vec4f{return vec4f(i.color,1.0);}`,
        });
        this.pipeline = this.device.createRenderPipeline({
          layout: 'auto',
          vertex: {
            module: shader,
            entryPoint: 'vs',
            buffers: [
              {
                arrayStride: 32,
                attributes: [
                  { shaderLocation: 0, offset: 0, format: 'float32x4' },
                  { shaderLocation: 1, offset: 16, format: 'float32x4' },
                ],
              },
            ],
          },
          fragment: { module: shader, entryPoint: 'fs', targets: [{ format: this.format }] },
          primitive: { topology: 'triangle-list' },
          multisample: { count: 4 },
        });
        this.capacity = 4 * 1024 * 1024;
        this.buffer = this.device.createBuffer({
          size: this.capacity,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.backend = 'WEBGPU';
        this.device.lost.then(() => {
          this.fallback();
          document.getElementById('engine').textContent = this.backend;
        });
        return this.backend;
      } catch (e) {
        console.info('WebGPU unavailable; using compatible renderer.', e.message);
      }
    }
    this.fallback();
    return this.backend;
  }
  fallback() {
    if (this.gpu) {
      const replacement = document.createElement('canvas');
      replacement.id = 'world';
      this.canvas.replaceWith(replacement);
      this.canvas = replacement;
      this.gpu = null;
    }
    this.c2 = this.canvas.getContext('2d');
    this.backend = 'CANVAS · COMPATIBILITY';
  }
  project(x, y, z) {
    return [
      this.w / 2 + (x - z - this.cx + this.cz) * 0.866 * this.zoom,
      this.h * 0.53 + ((x + z - this.cx - this.cz) * 0.5 - y) * this.zoom,
    ];
  }
  unproject(sx, sy) {
    const a = (sx - this.w / 2) / (0.866 * this.zoom),
      b = (sy - this.h * 0.53) / (0.5 * this.zoom);
    return { x: (a + b) / 2 + this.cx, z: (b - a) / 2 + this.cz };
  }
  poly(points, c, layer = 0) {
    this.polys.push({
      p: points,
      c: typeof c === 'string' ? rgb(c) : c,
      depth: points.reduce((v, p) => v + p[0] + p[2] + p[1] * 1.02, 0) / points.length + layer,
    });
  }
  flat(x, z, w, d, c, y = 0.025) {
    this.poly(
      [
        [x - w / 2, y, z - d / 2],
        [x + w / 2, y, z - d / 2],
        [x + w / 2, y, z + d / 2],
        [x - w / 2, y, z + d / 2],
      ],
      c,
      -200,
    );
    this.polys[this.polys.length - 1].depth = -10000 + y * 1000;
  }
  box(x, y, z, w, h, d, color) {
    const c = typeof color === 'string' ? rgb(color) : color,
      X = x - w / 2,
      Z = z - d / 2;
    this.poly(
      [
        [X, y + h, Z],
        [X + w, y + h, Z],
        [X + w, y + h, Z + d],
        [X, y + h, Z + d],
      ],
      shade(c, 1.08),
    );
    this.poly(
      [
        [X, y, Z + d],
        [X + w, y, Z + d],
        [X + w, y + h, Z + d],
        [X, y + h, Z + d],
      ],
      shade(c, 0.82),
    );
    this.poly(
      [
        [X + w, y, Z],
        [X + w, y, Z + d],
        [X + w, y + h, Z + d],
        [X + w, y + h, Z],
      ],
      shade(c, 0.64),
    );
  }
  tree(x, z, size = 1) {
    this.flat(x + 1.5, z + 1.5, 5 * size, 3 * size, '#a3b389', 0.04);
    this.box(x, 0, z, 0.65 * size, 4 * size, 0.65 * size, '#887358');
    const c = rgb('#78915c');
    let pts = [];
    for (let i = 0; i < 6; i++) {
      let a = (i * Math.PI) / 3;
      pts.push([x + Math.cos(a) * 3 * size, 4.1 * size, z + Math.sin(a) * 3 * size]);
    }
    for (let i = 0; i < 6; i++)
      this.poly([pts[i], pts[(i + 1) % 6], [x, 9 * size, z]], shade(c, 0.78 + (i % 3) * 0.14));
  }
  makeTown() {
    this.polys = [];
    this.flat(0, 0, 190, 190, '#cbd6b5', -0.03);
    for (const v of [-48, 0, 48]) {
      this.flat(v, 0, 15, 180, '#dedecb');
      this.flat(0, v, 180, 15, '#dedecb');
      this.flat(v, 0, 10, 180, '#939c8e');
      this.flat(0, v, 180, 10, '#939c8e');
      for (let p = -86; p < 89; p += 8) {
        this.flat(v, p, 0.18, 3, '#dedfc9', 0.05);
        this.flat(p, v, 3, 0.18, '#dedfc9', 0.05);
      }
      for (const z of [-48, 0, 48]) {
        for (let k = -3; k <= 3; k++) {
          this.flat(v + k * 1.15, z + 7, 0.55, 3.4, '#f0edda', 0.06);
          this.flat(v + 7, z + k * 1.15, 3.4, 0.55, '#f0edda', 0.06);
        }
      }
    }
    for (const b of LOCATIONS) {
      this.flat(b.x + 3, b.z + 3, b.w + 2, b.d + 2, '#a8b594', 0.03);
      this.flat(b.x, b.z, b.w + 6, b.d + 6, '#e0dfca', 0.04);
      if (b.type === 'park') {
        this.flat(b.x, b.z, b.w, b.d, '#a6bd81', 0.07);
        this.tree(b.x - 6, b.z - 5);
        this.tree(b.x + 7, b.z + 4);
        continue;
      }
      this.poly(
        [
          [b.x - b.w / 2, 0.06, b.z + b.d / 2],
          [b.x + b.w / 2, 0.06, b.z - b.d / 2],
          [b.x + b.w / 2 + b.h * 0.85, 0.06, b.z - b.d / 2 + b.h * 0.65],
          [b.x + b.w / 2 + b.h * 0.85, 0.06, b.z + b.d / 2 + b.h * 0.65],
          [b.x - b.w / 2 + b.h * 0.85, 0.06, b.z + b.d / 2 + b.h * 0.65],
        ],
        '#acb49a',
        -9000,
      );
      this.box(b.x, 0, b.z, b.w, b.h, b.d, b.color);
      this.box(b.x, b.h, b.z, b.w + 0.6, 0.5, b.d + 0.6, '#ede6cc');
      this.box(b.x, b.h + 0.5, b.z, b.w - 1.2, 0.3, b.d - 1.2, '#aaaf9b');
      this.box(b.x + 3, b.h + 0.8, b.z - 2, 3, 1.5, 3, '#9da496');
      for (let i = -b.w / 2 + 3; i < b.w / 2 - 1; i += 4.2) {
        this.box(b.x + i, 3, b.z + b.d / 2 + 0.1, 2.3, 2.8, 0.18, '#6f8b87');
        this.box(b.x + i, 2.8, b.z + b.d / 2 + 0.25, 2.7, 0.2, 0.3, '#e5dec7');
      }
      for (let i = -b.d / 2 + 3; i < b.d / 2 - 1; i += 4.1)
        this.box(b.x + b.w / 2 + 0.1, 3, b.z + i, 0.18, 2.8, 2.2, '#64807b');
      this.box(b.x, 0, b.z + b.d / 2 + 0.2, 2.8, 3.5, 0.35, '#506966');
      this.box(b.x, 0, b.z + b.d / 2 + 1.5, 5, 0.35, 2.5, '#c4c5b1');
      if (b.type === 'civic' || b.type === 'court') {
        this.box(b.x, 6.5, b.z + b.d / 2 + 1, 12, 1, 3, '#e1dac0');
        for (const p of [-4.5, -1.5, 1.5, 4.5])
          this.box(b.x + p, 0.3, b.z + b.d / 2 + 1.2, 0.7, 6.2, 0.7, '#ebe3ca');
        this.box(b.x - 10, 0, b.z + 12, 0.17, 13, 0.17, '#7b8172');
        this.poly(
          [
            [b.x - 10, 13, b.z + 12],
            [b.x - 5, 12.5, b.z + 12],
            [b.x - 5, 10, b.z + 12],
            [b.x - 10, 10.5, b.z + 12],
          ],
          '#bf6b56',
        );
      }
      if (b.type === 'cafe') {
        for (let k = 0; k < 7; k++)
          this.box(b.x - 9 + k * 2.8, 5, b.z + 8, 2.8, 0.6, 2.5, k % 2 ? '#e6dcb9' : '#6d8662');
        for (const a of [-6, 5]) {
          this.box(b.x + a, 0, b.z + 12, 0.3, 1.9, 0.3, '#837c62');
          this.box(b.x + a, 1.8, b.z + 12, 2.8, 0.2, 2.8, '#d0b581');
        }
      }
      if (b.type === 'hospital') {
        this.box(b.x, 6, b.z + b.d / 2 + 0.4, 4, 1, 0.2, '#b85e50');
        this.box(b.x, 4.5, b.z + b.d / 2 + 0.5, 1, 4, 0.2, '#b85e50');
      }
    }
    for (let i = 0; i < 54; i++) {
      const x = Math.sin(i * 19.31) * 82,
        z = Math.cos(i * 8.17) * 83;
      if (
        [-48, 0, 48].some((a) => Math.abs(x - a) < 10 || Math.abs(z - a) < 10) ||
        LOCATIONS.some((b) => Math.abs(x - b.x) < b.w / 2 + 4 && Math.abs(z - b.z) < b.d / 2 + 5)
      )
        continue;
      this.tree(x, z, 0.65 + (i % 3) * 0.18);
    }
    for (const x of [-9, 40])
      for (let z = -73; z < 80; z += 27) {
        this.box(x, 0, z, 0.25, 7, 0.25, '#6f7a62');
        this.box(x + 0.5, 7, z, 1.5, 0.22, 0.7, '#f0e3b7');
      }
    for (const x of [-10, 10]) {
      this.box(x, 0, 12, 2.8, 1.1, 1, '#96876a');
      this.box(x, 1.1, 12.4, 2.8, 1, 0.2, '#a69776');
    }
    this.flat(-25, 83, 24, 8, '#91a879', 0.05);
    for (let x = -38; x <= -12; x += 2) {
      this.box(x, 0, 87, 0.35, 1.6, 0.35, '#c5c1a9');
    }
    this.box(-25, 1, 87, 27, 0.2, 0.2, '#d9d1b6');
    if (this.constructor === World) {
      this.box(7, 0.15, 3.95, 3.05, 4.05, 0.2, '#786d51');
      this.box(7, 0.28, 4.06, 2.78, 3.78, 0.02, '#9cb5b7');
    }
    this.static = this.polys;
    this.polys = [];
  }
  person(n, t, crew = false) {
    const emotional = n.emotionUntil > this.time;
    const x = n.x + (emotional && n.emotion === 'rage' ? Math.sin(t * 19) * 0.12 : 0),
      z = n.z,
      skin = n.skin || '#c99c78',
      shirt = crew ? '#e7e5cc' : n.color || '#667b63',
      moving = n.moving ? Math.sin(t * 9 + n.id) * 0.22 : 0;
    this.flat(x + 0.5, z + 0.5, 1.5, 1, '#9eac8a', 0.08);
    this.box(x - 0.26, 0, z + moving, 0.38, 0.9, 0.45, '#3f4b42');
    this.box(x + 0.26, 0, z - moving, 0.38, 0.9, 0.45, '#3f4b42');
    this.box(x, 0.8, z, 1.15, 1.15, 0.65, shirt);
    this.box(x, 1.95, z, 0.72, 0.72, 0.72, skin);
    this.box(x, 2.57, z, 0.78, 0.22, 0.75, n.hair || '#665a45');
    const arm =
      emotional && (n.emotion === 'rage' || n.emotion === 'throw')
        ? 1.8 + Math.sin(t * 12) * 0.4
        : 0.85;
    this.box(x - 0.72, arm, z + moving, 0.3, 1, 0.36, skin);
    this.box(
      x + 0.72,
      emotional && n.emotion === 'cry' ? 1.8 : arm,
      z + (emotional && n.emotion === 'cry' ? 0.5 : -moving),
      0.3,
      0.85,
      0.36,
      skin,
    );
    if (emotional && n.emotion === 'cry') {
      this.box(x - 0.17, 2.05, z + 0.43, 0.1, 0.3, 0.09, '#a3d3dc');
      this.box(x + 0.17, 2.05, z + 0.43, 0.1, 0.3, 0.09, '#a3d3dc');
    }
    if (n.working) {
      this.box(x, 1.2, z + 0.75, 1.35, 0.12, 0.85, n.working === 'library' ? '#8e7054' : '#839a99');
      if (n.working === 'coffee') this.box(x, 1.32, z + 0.75, 0.35, 0.45, 0.35, '#e5dcc5');
      if (n.working === 'grounds') this.box(x + 0.8, 0.5, z + 0.65, 0.12, 2, 0.12, '#9b8058');
    }
    if (crew) {
      this.box(x, 1.25, z + 0.35, 0.85, 0.5, 0.035, '#354236');
    }
    if (n.player) {
      this.box(x + 0.8, 1.65, z + 0.45, 0.6, 0.42, 0.45, '#333f35');
      if (n.mask)
        this.box(x, 2, z + 0.4, 0.78, 0.7, 0.13, n.mask === 'clown' ? '#f3e5c8' : '#765038');
      if (n.mask === 'clown') this.box(x, 2.25, z + 0.52, 0.22, 0.22, 0.22, '#bd5846');
    }
  }
  car(x, z, driving, t, color = '#a98766', police = false, heading = 0) {
    const poly = this.poly,
      cos = Math.cos(heading),
      sin = Math.sin(heading);
    this.poly = (points, ...args) =>
      poly.call(
        this,
        points.map(([px, y, pz]) => [
          x + (px - x) * cos + (pz - z) * sin,
          y,
          z - (px - x) * sin + (pz - z) * cos,
        ]),
        ...args,
      );
    try {
      this.carBody(x, z, driving, t, color, police);
    } finally {
      this.poly = poly;
    }
  }
  carBody(x, z, driving, t, color = '#a98766', police = false) {
    this.flat(x + 0.8, z + 0.8, 3.4, 6, '#88977b', 0.07);
    this.box(x, 0.6, z, 3.1, 1.1, 5.9, color);
    this.box(x, 1.7, z - 0.3, 2.8, 1.2, 3, '#a1a897');
    this.box(x, 1.8, z + 1.25, 2.55, 0.85, 0.1, '#627e79');
    this.box(x + 1.42, 1.85, z - 0.3, 0.1, 0.75, 2.5, '#5c7771');
    this.box(x, 1.7, z + 2.3, 2.9, 0.16, 1.2, '#998669');
    for (const a of [-1.6, 1.6])
      for (const b of [-1.7, 1.8]) this.box(x + a, 0.2, z + b, 0.45, 1, 1, '#3d463d');
    this.box(x - 0.9, 1.1, z + 3, 0.6, 0.3, 0.15, '#ede3b3');
    this.box(x + 0.9, 1.1, z + 3, 0.6, 0.3, 0.15, '#eadca8');
    if (police) {
      this.box(x, 2.94, z, 2, 0.18, 0.55, '#3e4d55');
      this.box(x - 0.55, 3.15, z, 0.65, 0.2, 0.55, Math.sin(t * 18) > 0 ? '#f96653' : '#843f3a');
      this.box(x + 0.55, 3.15, z, 0.65, 0.2, 0.55, Math.sin(t * 18) < 0 ? '#6fb7ed' : '#405573');
      return;
    }
    for (let i = 0; i < 5; i++) {
      let f = (t * 0.6 + i * 0.2) % 1;
      this.box(
        x + f * 0.6,
        0.5 + f * 3,
        z - 3 - f * 3,
        0.4 + f,
        0.5 + f,
        0.5 + f,
        shade(rgb('#a3aa9b'), 1 + f * 0.14),
      );
    }
  }
  render(s, npcs, dt) {
    this.playerState = s;
    const r = this.canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = r.width;
    this.h = r.height;
    if (
      (this.renderer ? this.overlay : this.canvas).width !== Math.round(this.w * dpr) ||
      (this.renderer ? this.overlay : this.canvas).height !== Math.round(this.h * dpr)
    ) {
      if (!this.renderer) {
        this.canvas.width = Math.round(this.w * dpr);
        this.canvas.height = Math.round(this.h * dpr);
      }
      this.overlay.width = Math.round(this.w * dpr);
      this.overlay.height = Math.round(this.h * dpr);
      if (this.gpu) {
        this.msaa?.destroy();
        this.msaa = this.device.createTexture({
          size: [this.canvas.width, this.canvas.height],
          sampleCount: 4,
          format: this.format,
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
      }
    }
    this.time += dt;
    this.atmosphere.update(dt, s.minutes);
    this.cx += (s.x - this.cx) * Math.min(1, dt * 2);
    this.cz += (s.z - 4 - this.cz) * Math.min(1, dt * 2);
    this.polys = [...this.static];
    this.homeDetails(s);
    this.car(s.carX, s.carZ, s.driving, this.time, '#a98766', false, s.carHeading || 0);
    for (const n of npcs) if (!n.inCustody) this.person(n, this.time);
    if (this.patrol) {
      const p = this.patrol;
      this.car(p.x, p.z, true, this.time, '#e0e3d4', true, Math.PI);
      for (const off of p.officers || [])
        this.person(
          { ...off, color: '#495a65', skin: '#bd9572', hair: '#344654', moving: true },
          this.time,
        );
    }
    if (!s.driving) {
      this.flat(s.x, s.z, 2.9, 2.9, '#e2f191', 0.15);
      this.person(
        {
          x: s.x,
          z: s.z,
          player: s.campaign?.career === 'auditor',
          working: s.campaign?.serviceTask?.jobId,
          mask: s.mask,
          merch: s.campaign?.career === 'auditor' ? s.merch : null,
          flies: s.campaign?.career === 'auditor',
          color: s.campaign?.career === 'auditor' ? '#ece7c8' : '#8aa4a0',
          hair: '#5b6750',
          moving: s.moving,
          id: 0,
        },
        this.time,
      );
    }
    let index = 0;
    for (const g of ['crew', 'crew2'])
      if (s.gear.includes(g)) {
        this.person(
          {
            x: s.x - 2.5 - index * 1.6,
            z: s.z + 1.3 + index * 1.4,
            id: 80 + index,
            moving: s.moving,
          },
          this.time,
          true,
        );
        index++;
      }
    for (const n of npcs)
      if (n.stinkUntil > this.time) {
        this.box(n.x + 0.3, 1, n.z, 4, 1.8, 4, '#9eaa65');
      }
    for (const p of this.particles) {
      const u = clamp((this.time - p.born) / p.duration, 0, 1);
      if (u < 1) {
        const x = p.x + (p.tx - p.x) * u,
          z = p.z + (p.tz - p.z) * u,
          y = p.kind === 'spray' ? 1.65 + u * 0.35 : 1.8 + Math.sin(u * Math.PI) * 4;
        this.box(x, y, z, p.size || 0.4, p.size || 0.4, p.size || 0.4, p.color || '#d8b17c');
      }
    }
    this.particles = this.particles.filter((p) => this.time - p.born < p.duration);
    const visible = [];
    for (const p of this.renderScene ? [] : this.polys) {
      const pts = p.p.map((v) => this.project(...v));
      if (
        pts.every((v) => v[0] < -80) ||
        pts.every((v) => v[0] > this.w + 80) ||
        pts.every((v) => v[1] < -80) ||
        pts.every((v) => v[1] > this.h + 80)
      )
        continue;
      const mid = p.p.reduce((a, v) => a.map((n, i) => n + v[i] / p.p.length), [0, 0, 0]);
      visible.push({ ...p, c: this.atmosphere.tint(p.c, mid[0], mid[2], mid[1]), pts });
    }
    visible.sort((a, b) => a.depth - b.depth);
    this.lastVisible = visible;
    if (this.renderScene) {
      this.renderScene(s, dt, dpr);
    } else if (this.gpu) {
      let arr = [];
      for (const p of visible)
        for (let j = 1; j < p.pts.length - 1; j++)
          for (const v of [p.pts[0], p.pts[j], p.pts[j + 1]])
            arr.push((v[0] / this.w) * 2 - 1, 1 - (v[1] / this.h) * 2, 0, 1, ...p.c, 1);
      const data = new Float32Array(arr);
      if (data.byteLength > this.capacity) {
        this.buffer.destroy();
        this.capacity = data.byteLength * 2;
        this.buffer = this.device.createBuffer({
          size: this.capacity,
          usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
      }
      this.device.queue.writeBuffer(this.buffer, 0, data);
      const enc = this.device.createCommandEncoder(),
        pass = enc.beginRenderPass({
          colorAttachments: [
            {
              view: this.msaa.createView(),
              resolveTarget: this.gpu.getCurrentTexture().createView(),
              clearValue: { r: 0.8, g: 0.84, b: 0.71, a: 1 },
              loadOp: 'clear',
              storeOp: 'store',
            },
          ],
        });
      pass.setPipeline(this.pipeline);
      pass.setVertexBuffer(0, this.buffer);
      pass.draw(data.length / 8);
      pass.end();
      this.device.queue.submit([enc.finish()]);
    } else {
      const c = this.c2;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = '#cbd6b5';
      c.fillRect(0, 0, this.w, this.h);
      for (const p of visible) {
        c.beginPath();
        p.pts.forEach((v, i) => (i ? c.lineTo(...v) : c.moveTo(...v)));
        c.closePath();
        c.fillStyle = `rgb(${p.c.map((v) => Math.round(v * 255)).join(',')})`;
        c.fill();
      }
    }
    this.labels(s, npcs, dpr);
  }
  labels(s, npcs, dpr) {
    const c = this.ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    this.atmosphere.draw(c, this.w, this.h, this);
    c.textAlign = 'center';
    for (const b of this.playerState?.viewMode === 'first' ? [] : LOCATIONS) {
      let [x, y] = this.project(b.x, b.h + 2, b.z);
      if (x < -60 || x > this.w + 60 || y < 160 || y > this.h - 65) continue;
      c.font = '600 9px "DM Sans",sans-serif';
      const w = c.measureText(b.name).width + 18;
      c.fillStyle = '#f6f4e9ee';
      c.beginPath();
      c.roundRect(x - w / 2, y - 14, w, 22, 3);
      c.fill();
      c.fillStyle = '#5e6b53';
      c.fillText(b.name, x, y);
      c.fillStyle = '#f6f4e9ee';
      c.beginPath();
      c.moveTo(x - 4, y + 8);
      c.lineTo(x + 4, y + 8);
      c.lineTo(x, y + 12);
      c.fill();
    }
    const [px, py] = this.project(s.x, 4, s.z);
    c.fillStyle = '#eef6bb';
    c.beginPath();
    c.moveTo(px - 4, py - 11);
    c.lineTo(px + 4, py - 11);
    c.lineTo(px, py - 5);
    c.fill();
    if (s.gear.includes('crew')) {
      const [x, y] = this.project(s.x - 2.5, 3, s.z + 1.3);
      c.font = '7px sans-serif';
      c.fillStyle = '#33492b';
      c.fillText('I’M WITH STUPID', x, y - 8);
    }
    for (const n of npcs) {
      if (n.emotionUntil > this.time && !n.inCustody) {
        const [x, y] = this.project(n.x, 4.3, n.z);
        c.font = 'bold 15px sans-serif';
        c.fillStyle = n.emotion === 'cry' ? '#779fab' : '#ac543e';
        c.fillText(
          n.emotion === 'cry'
            ? '…'
            : n.emotion === 'rage'
              ? '#!@%'
              : n.emotion === 'throw'
                ? '!'
                : '',
          x,
          y,
        );
      }
    }
    for (const n of npcs)
      if (n.music && !n.inCustody) {
        const [x, y] = this.project(n.x, 4, n.z);
        c.font = '18px sans-serif';
        c.fillStyle = '#7f6690';
        c.fillText('♫', x, y);
      }
  }
  homeDetails(s) {
    const c = s.campaign;
    if (!c) return;
    let index = 0;
    for (const i of c.homeIncidents.filter((i) => !i.cleaned).slice(0, 8)) {
      const x = -34 + (index % 4) * 5,
        z = 81 + Math.floor(index / 4) * 3;
      this.box(x, 0.05, z, 1.2, 0.35, 0.8, i.type === 'trash' ? '#c3baa0' : '#74583c');
      this.box(x, 0.4, z, 0.65, 0.3, 0.5, i.type === 'trash' ? '#9caa9a' : '#8a6947');
      index++;
    }
    if (s.gear.includes('security'))
      for (const x of [-36, -14]) {
        this.box(x, 0, 79, 0.18, 4.4, 0.18, '#727c6a');
        this.box(x, 4.2, 79, 1, 0.5, 0.6, '#c8d1c2');
        this.box(x, 4.25, 79.4, 0.45, 0.25, 0.2, '#334a40');
      }
    if (s.gear.includes('floodlights')) {
      this.flat(-25, 82, 12, 6, '#c6cb94', 0.065);
      this.box(-25, 0, 79, 0.2, 4, 0.2, '#647459');
      this.box(-25, 4, 79, 1.7, 0.45, 0.4, '#ebe3b5');
    }
    if (this.homeIntruder && this.homeIntruder.until > this.time) {
      const n = this.homeIntruder;
      this.person(
        {
          x: n.x + (14 - (n.until - this.time)) * 0.3,
          z: n.z,
          id: 200,
          color: '#666d64',
          skin: n.masked ? '#303a35' : '#c39b76',
          hair: '#384538',
          moving: true,
        },
        this.time,
      );
    }
    if (this.waypoint) {
      const { x, z } = this.waypoint;
      this.flat(x, z, 3, 3, '#e6f79a', 0.2);
      this.box(x, 0, z, 0.18, 4, 0.18, '#677747');
      this.poly(
        [
          [x, 4, z],
          [x + 2, 4, z],
          [x + 2, 2.9, z],
          [x, 2.9, z],
        ],
        '#c9e276',
      );
    }
  }
  securityStill(c, w, h, incident) {
    const prior = this.polys;
    this.polys = [...this.static];
    this.person(
      {
        x: -30,
        z: 83,
        id: 201,
        color: '#677974',
        skin: incident.masked ? '#28332f' : '#caa783',
        hair: '#34413b',
      },
      0,
    );
    this.box(-32, 0.08, 84, 1.2, 0.3, 0.7, '#745339');
    this.box(-32, 0.38, 84, 0.6, 0.25, 0.4, '#846146');
    for (const x of [-36, -14]) {
      this.box(x, 0, 79, 0.18, 4.4, 0.18, '#727c6a');
      this.box(x, 4.2, 79, 1, 0.5, 0.6, '#c8d1c2');
    }
    const polygons = this.polys;
    this.polys = prior;
    const scale = 12,
      project = (v) => [
        w * 0.5 + (v[0] - v[2] + 25 + 78) * 0.866 * scale,
        h * 0.42 + ((v[0] + v[2] + 25 - 78) * 0.5 - v[1]) * scale,
      ];
    c.fillStyle = '#455848';
    c.fillRect(0, 0, w, h);
    for (const p of polygons.sort((a, b) => a.depth - b.depth)) {
      const pts = p.p.map(project);
      if (
        pts.every((v) => v[0] < 0) ||
        pts.every((v) => v[0] > w) ||
        pts.every((v) => v[1] < 0) ||
        pts.every((v) => v[1] > h)
      )
        continue;
      c.beginPath();
      pts.forEach((v, i) => (i ? c.lineTo(...v) : c.moveTo(...v)));
      c.closePath();
      c.fillStyle = `rgb(${p.c.map((v) => Math.round(v * 210)).join(',')})`;
      c.fill();
    }
    c.fillStyle = '#203d3530';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#18281dc0';
    c.fillRect(8, 8, w - 16, 25);
    c.fillRect(w - 190, h - 31, 182, 23);
    c.fillStyle = '#e1ebce';
    c.font = '12px monospace';
    c.fillText(
      `HOME CAM 01 · DAY ${incident.day} · ${Math.floor(incident.clock / 60)}:${String(incident.clock % 60).padStart(2, '0')}`,
      16,
      25,
    );
    c.fillText(incident.masked ? 'FACE OBSCURED' : 'FACE VISIBLE', w - 179, h - 15);
    c.fillStyle = '#13261912';
    for (let y = 0; y < h; y += 4) c.fillRect(0, y, w, 1);
    c.strokeStyle = '#b1c5a4';
    c.strokeRect(5, 5, w - 10, h - 10);
  }
  drawSnapshot(c, w, h) {
    c.save();
    c.setTransform(w / this.w, 0, 0, h / this.h, 0, 0);
    c.fillStyle = '#cbd6b5';
    c.fillRect(0, 0, this.w, this.h);
    for (const p of this.lastVisible || []) {
      c.beginPath();
      p.pts.forEach((v, i) => (i ? c.lineTo(...v) : c.moveTo(...v)));
      c.closePath();
      c.fillStyle = `rgb(${p.c.map((v) => Math.round(v * 255)).join(',')})`;
      c.fill();
    }
    c.restore();
  }
  minimap(canvas, s, npcs) {
    const c = canvas.getContext('2d'),
      w = 144,
      h = 112;
    c.setTransform(canvas.width / w, 0, 0, canvas.height / h, 0, 0);
    c.fillStyle = '#263f36';
    c.fillRect(0, 0, w, h);
    const sx = (x) => ((x + 90) / 180) * w,
      sz = (z) => ((z + 90) / 180) * h;
    c.fillStyle = '#7d9185';
    for (const v of [-48, 0, 48]) {
      c.fillRect(sx(v) - 4, 0, 8, h);
      c.fillRect(0, sz(v) - 3, w, 6);
    }
    for (const b of LOCATIONS) {
      c.fillStyle = '#49675b';
      c.fillRect(sx(b.x - b.w / 2), sz(b.z - b.d / 2), (b.w / 180) * w, (b.d / 180) * h);
    }
    c.font = 'bold 5px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#e4efdc';
    for (const b of LOCATIONS) {
      const label = /city hall/i.test(b.name)
        ? 'HALL'
        : /library/i.test(b.name)
          ? 'LIB'
          : /grind|cafe/i.test(b.name)
            ? 'CAFE'
            : '';
      if (label) c.fillText(label, sx(b.x), sz(b.z));
    }
    c.fillStyle = '#efbd73';
    c.fillRect(sx(s.carX) - 2, sz(s.carZ) - 2, 4, 4);
    c.fillStyle = '#d9f38d';
    c.beginPath();
    c.arc(sx(s.x), sz(s.z), 3.5, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#15271e';
    c.lineWidth = 2;
    c.stroke();
    if (s.driving || s.viewMode === 'first') {
      const heading = s.driving ? s.carHeading || 0 : s.lookYaw;
      c.strokeStyle = '#e9ffae';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(sx(s.x), sz(s.z));
      c.lineTo(sx(s.x) + Math.sin(heading) * 9, sz(s.z) + Math.cos(heading) * 9);
      c.stroke();
    }
    if (this.waypoint) {
      c.strokeStyle = '#d5ac41';
      c.lineWidth = 2;
      c.strokeRect(sx(this.waypoint.x) - 4, sz(this.waypoint.z) - 4, 8, 8);
    }
  }
}
