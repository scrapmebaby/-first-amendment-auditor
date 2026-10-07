import { MERCH } from './appearance.js';
import * as THREE from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Original, explicitly art-directed residents. No random wardrobe generation,
// downloaded meshes, image generation, or external texture dependencies.
export const CAST = [
  {
    id: 'pat',
    name: 'Pat',
    role: 'Office worker',
    shape: 'slouch',
    height: 1.04,
    width: 0.95,
    skin: '#c59b79',
    hair: '#68533d',
    hairdo: 'part',
    shirt: '#b6bbaa',
    pants: '#585f65',
    accent: '#b5653d',
    outfit: 'tie',
    prop: 'coffee',
    glasses: 'square',
    nose: 0.25,
    face: 0.97,
    lean: 0.09,
    detail: 'The tie has lost an argument with the collar. One shoulder has followed it.',
    habit: 'Checks an empty cup before deciding whether this is worth the trouble.',
  },
  {
    id: 'morgan',
    name: 'Morgan',
    role: 'Librarian',
    shape: 'column',
    height: 1.12,
    width: 0.77,
    skin: '#deb59b',
    hair: '#b9b7a6',
    hairdo: 'bun',
    shirt: '#7c594a',
    pants: '#4c5058',
    accent: '#d2ab65',
    outfit: 'cardigan',
    prop: 'books',
    glasses: 'round',
    nose: 0.2,
    face: 0.83,
    lean: -0.04,
    detail: 'A long cardigan, tiny spectacles, a crooked silver bun and a book with bent corners.',
    habit: 'Holds a finger up. Waits. Somehow the waiting is worse.',
  },
  {
    id: 'dee',
    name: 'Dee',
    role: 'Postal worker',
    shape: 'pear',
    height: 0.94,
    width: 1.14,
    skin: '#90674f',
    hair: '#373536',
    hairdo: 'visor',
    shirt: '#7199a0',
    pants: '#354d60',
    accent: '#ead1a3',
    outfit: 'work',
    prop: 'satchel',
    nose: 0.16,
    face: 1.12,
    lean: 0,
    detail:
      'A broad work shirt, practical boots, a tilted visor and a satchel pulling one shoulder down.',
    habit: 'Plants both feet before delivering a very clear “no.”',
  },
  {
    id: 'alex',
    name: 'Alex',
    role: 'Café regular',
    shape: 'pear',
    height: 0.91,
    width: 1.04,
    skin: '#d9ac86',
    hair: '#483627',
    hairdo: 'beanie',
    shirt: '#b07a43',
    pants: '#4c5950',
    accent: '#638073',
    outfit: 'stripes',
    prop: 'coffee',
    nose: 0.16,
    face: 1.05,
    lean: 0.035,
    detail: 'A ribbed green beanie, rolled sleeves and an exceptionally serious takeaway coffee.',
    habit: 'Leans away first. Protects the coffee second.',
  },
  {
    id: 'robin',
    name: 'Robin',
    role: 'Dog walker',
    shape: 'triangle',
    height: 1.07,
    width: 0.87,
    skin: '#ac7856',
    hair: '#423329',
    hairdo: 'ponytail',
    shirt: '#628064',
    pants: '#a5a68a',
    accent: '#e0aa55',
    outfit: 'vest',
    prop: 'leash',
    nose: 0.19,
    face: 0.92,
    lean: -0.02,
    detail: 'A short utility vest, a rust scarf and a looped leash wrapped around one hand.',
    habit: 'Keeps scanning for an exit, as though someone else has the good sense to leave.',
  },
  {
    id: 'jamie',
    name: 'Jamie',
    role: 'Accountant',
    shape: 'column',
    height: 1.15,
    width: 0.75,
    skin: '#d6b096',
    hair: '#8b6543',
    hairdo: 'bald',
    shirt: '#777391',
    pants: '#3d4355',
    accent: '#beb3a3',
    outfit: 'suspenders',
    prop: 'folder',
    glasses: 'square',
    nose: 0.31,
    face: 0.88,
    lean: 0.06,
    detail: 'Long trousers, narrow shoulders, heavy frames and suspenders pulled slightly uneven.',
    habit: 'Straightens the folder. Straightens it again.',
  },
  {
    id: 'sam',
    name: 'Sam',
    role: 'Nurse',
    shape: 'triangle',
    height: 1.01,
    width: 1.06,
    skin: '#80583f',
    hair: '#302e2c',
    hairdo: 'curls',
    shirt: '#568f8a',
    pants: '#386a69',
    accent: '#dfbb73',
    outfit: 'scrubs',
    prop: 'badge',
    nose: 0.13,
    face: 1.05,
    lean: 0,
    detail: 'An angular crown of curls, roomy scrubs, white work shoes and a lopsided ID badge.',
    habit: 'Open palms, measured breathing, very little patience left after a shift.',
  },
  {
    id: 'casey',
    name: 'Casey',
    role: 'Neighbor',
    shape: 'pear',
    height: 0.87,
    width: 1.23,
    skin: '#e0b39a',
    hair: '#a14d34',
    hairdo: 'bob',
    shirt: '#946973',
    pants: '#4c5460',
    accent: '#d9b272',
    outfit: 'coat',
    prop: 'tote',
    nose: 0.17,
    face: 1.11,
    lean: 0.035,
    detail: 'A blunt copper bob, an oversized coat, a visible mended elbow and a shopping tote.',
    habit: 'The hands go to the hips before the voice goes up.',
  },
  {
    id: 'taylor',
    name: 'Taylor',
    role: 'Delivery driver',
    shape: 'triangle',
    height: 1.08,
    width: 0.93,
    skin: '#be825b',
    hair: '#493427',
    hairdo: 'cap',
    shirt: '#c18a4b',
    pants: '#4e5657',
    accent: '#67716c',
    outfit: 'work',
    prop: 'parcel',
    nose: 0.23,
    face: 0.96,
    lean: 0.025,
    detail:
      'A sun-faded cap with a bent peak, reinforced knees and a parcel held against the ribs.',
    habit: 'Looks from the parcel to the camera, calculating which problem costs more.',
  },
  {
    id: 'chris',
    name: 'Chris',
    role: 'Shopkeeper',
    shape: 'pear',
    height: 0.96,
    width: 1.15,
    skin: '#b98760',
    hair: '#5d4434',
    hairdo: 'quiff',
    shirt: '#d0b589',
    pants: '#484c4c',
    accent: '#6e805f',
    outfit: 'apron',
    prop: 'pencil',
    nose: 0.21,
    face: 1.08,
    lean: 0.04,
    detail: 'A wedge of brushed-up hair, a battered apron and a pencil tucked above one ear.',
    habit: 'Wipes the same spot on the apron while asking you to leave.',
  },
  {
    id: 'jo',
    name: 'Jo',
    role: 'Commuter',
    shape: 'column',
    height: 1.16,
    width: 0.81,
    skin: '#755640',
    hair: '#282d30',
    hairdo: 'flat',
    shirt: '#566782',
    pants: '#303a4e',
    accent: '#d29656',
    outfit: 'coat',
    prop: 'bag',
    nose: 0.24,
    face: 0.85,
    lean: 0.055,
    detail:
      'A high collar, a sharp side part, heavy shoes and a long bag strap cutting the coat diagonally.',
    habit: 'One glance at the time is a complete sentence.',
  },
  {
    id: 'lee',
    name: 'Lee',
    role: 'Park regular',
    shape: 'pear',
    height: 0.89,
    width: 1.08,
    skin: '#d6ad8b',
    hair: '#e0ddc9',
    hairdo: 'bald',
    shirt: '#80916c',
    pants: '#71664f',
    accent: '#c0a56a',
    outfit: 'vest',
    prop: 'cane',
    nose: 0.28,
    face: 1.1,
    lean: 0.1,
    detail:
      'White sideburns, a knitted vest, high-waisted trousers and a sturdy curved walking stick.',
    habit: 'Shakes the head before bothering with the rest of the argument.',
  },
  {
    id: 'frankie',
    name: 'Frankie',
    role: 'Bicycle courier',
    shape: 'column',
    height: 1.09,
    width: 0.75,
    skin: '#c2916e',
    hair: '#483728',
    hairdo: 'helmet',
    shirt: '#ba6848',
    pants: '#405451',
    accent: '#e1ba55',
    outfit: 'work',
    prop: 'bag',
    nose: 0.19,
    face: 0.87,
    lean: 0.1,
    detail: 'A ridged yellow helmet, short sleeves and a courier bag almost as wide as the torso.',
    habit: 'Bounces on the heels, already late for something that matters.',
  },
  {
    id: 'inez',
    name: 'Inez',
    role: 'Florist',
    shape: 'pear',
    height: 0.94,
    width: 1.01,
    skin: '#a97151',
    hair: '#3c302d',
    hairdo: 'bun',
    shirt: '#a7858b',
    pants: '#656c53',
    accent: '#d4b774',
    outfit: 'apron',
    prop: 'flowers',
    nose: 0.16,
    face: 1.03,
    lean: -0.01,
    detail:
      'A loose bun, uneven apron pockets and three stubborn flowers sticking out of a paper cone.',
    habit: 'Keeps the flowers away from the argument.',
  },
  {
    id: 'gus',
    name: 'Gus',
    role: 'Mechanic',
    shape: 'triangle',
    height: 1.02,
    width: 1.25,
    skin: '#d5a27e',
    hair: '#6a4d37',
    hairdo: 'cap',
    shirt: '#617678',
    pants: '#3e4d50',
    accent: '#c1964f',
    outfit: 'coverall',
    prop: 'rag',
    nose: 0.26,
    face: 1.15,
    lean: 0.04,
    detail: 'A square jaw, thick forearms, a repaired overall strap and an oil-darkened rag.',
    habit: 'Stops moving entirely when the patience runs out.',
  },
  {
    id: 'bea',
    name: 'Bea',
    role: 'Retired teacher',
    shape: 'column',
    height: 0.98,
    width: 0.84,
    skin: '#e0b59e',
    hair: '#c9c3b6',
    hairdo: 'bob',
    shirt: '#80708a',
    pants: '#51545f',
    accent: '#ccb16d',
    outfit: 'cardigan',
    prop: 'tote',
    glasses: 'round',
    nose: 0.24,
    face: 0.89,
    lean: -0.035,
    detail: 'A silver geometric bob, mustard buttons and spectacles worn low enough to look over.',
    habit: 'The single raised eyebrow has ended worse behavior than this.',
  },
  {
    id: 'omar',
    name: 'Omar',
    role: 'Court clerk',
    shape: 'triangle',
    height: 1.13,
    width: 1.04,
    skin: '#9d7053',
    hair: '#322e2b',
    hairdo: 'part',
    shirt: '#78869a',
    pants: '#3e4959',
    accent: '#a06a4b',
    outfit: 'tie',
    prop: 'folder',
    nose: 0.2,
    face: 0.95,
    lean: 0,
    detail:
      'Broad shoulders, a narrow tie, a receding side part and an overstuffed document wallet.',
    habit: 'Points to the posted rules instead of improvising new ones.',
  },
  {
    id: 'nell',
    name: 'Nell',
    role: 'Community gardener',
    shape: 'pear',
    height: 0.9,
    width: 1.17,
    skin: '#b48766',
    hair: '#8f7860',
    hairdo: 'sunhat',
    shirt: '#ac9567',
    pants: '#687357',
    accent: '#bc7652',
    outfit: 'overalls',
    prop: 'trowel',
    nose: 0.18,
    face: 1.12,
    lean: 0.06,
    detail: 'A wide, dented sunhat, patched overalls and boots that have actually been outdoors.',
    habit: 'Brushes dirt off one glove, then gives the camera the same look.',
  },
];
export const AUDITOR = {
  id: 'auditor',
  name: 'The auditor',
  role: 'Self-appointed main character',
  shape: 'pear',
  height: 0.95,
  width: 1.4,
  skin: '#c49b79',
  hair: '#645448',
  hairdo: 'bald',
  shirt: '#c2bf9c',
  pants: '#555844',
  accent: '#a38148',
  outfit: 'auditor',
  prop: 'camera',
  nose: 0.27,
  face: 1.2,
  lean: 0.11,
  detail:
    'A forward-leaning belly, a tired press lanyard, stained shirt and a few strategically absent teeth.',
  habit: 'Tilts the camera up before tilting the truth.',
};
export const SUPPORT = [
  {
    ...CAST[8],
    id: 'crew-1',
    name: 'Drew',
    role: 'Camera crew',
    outfit: 'crew',
    shirt: '#d4cbb0',
    hairdo: 'beanie',
    prop: 'camera',
    detail: 'An oversized crew shirt and a small camera that costs more than it earns.',
  },
  {
    ...CAST[5],
    id: 'crew-2',
    name: 'Val',
    role: 'Camera crew',
    outfit: 'crew',
    shirt: '#d4cbb0',
    hairdo: 'ponytail',
    prop: 'mic',
    detail: 'Long sleeves, a boom microphone and the same unhelpful crew shirt.',
  },
  {
    ...CAST[16],
    id: 'officer-1',
    name: 'Officer Bell',
    role: 'Patrol officer',
    outfit: 'uniform',
    shirt: '#445b69',
    pants: '#354653',
    hairdo: 'cap',
    prop: 'radio',
    detail:
      'A broad uniform, visible shoulder tabs and an expression suggesting the end of a long shift.',
  },
  {
    ...CAST[7],
    id: 'officer-2',
    name: 'Officer Ruiz',
    role: 'Patrol officer',
    outfit: 'uniform',
    shirt: '#445b69',
    pants: '#354653',
    hairdo: 'bun',
    prop: 'radio',
    detail: 'A compact silhouette, heavy duty belt and carefully practiced patience.',
  },
];
const FACES = {
  pat: [0.27, 0.36, 0.32, 0.76],
  morgan: [0.18, 0.3, 0.3, 0.86],
  dee: [0.3, 0.39, 0.34, 0.7],
  alex: [0.26, 0.37, 0.33, 0.72],
  robin: [0.21, 0.34, 0.31, 0.77],
  jamie: [0.22, 0.31, 0.3, 0.87],
  sam: [0.24, 0.39, 0.3, 0.78],
  casey: [0.24, 0.4, 0.35, 0.7],
  taylor: [0.28, 0.34, 0.3, 0.77],
  chris: [0.29, 0.37, 0.33, 0.75],
  jo: [0.2, 0.34, 0.31, 0.86],
  lee: [0.32, 0.36, 0.3, 0.72],
  frankie: [0.21, 0.32, 0.29, 0.79],
  inez: [0.23, 0.35, 0.32, 0.76],
  gus: [0.34, 0.39, 0.35, 0.74],
  bea: [0.19, 0.32, 0.31, 0.8],
  omar: [0.29, 0.35, 0.32, 0.8],
  nell: [0.29, 0.4, 0.34, 0.7],
  auditor: [0.32, 0.39, 0.32, 0.74],
};
export const ALL_CHARACTERS = [AUDITOR, ...CAST, ...SUPPORT];

const material = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.96,
  flatShading: true,
});
const ink = '#34352f',
  paper = '#e9debc';
const skinDark = (c) => new THREE.Color(c).multiplyScalar(0.73).getStyle();
function paint(geometry, hex, variation = 0.025) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  if (g !== geometry) geometry.dispose();
  g.deleteAttribute('uv');
  const base = new THREE.Color(hex),
    colors = [],
    count = g.getAttribute('position').count;
  for (let i = 0; i < count; i++) {
    const n = 1 + Math.sin(Math.floor(i / 3) * 17.3 + 2.1) * variation;
    colors.push(base.r * n, base.g * n, base.b * n);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return g;
}
function part(parent, geometry, hex, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(paint(geometry, hex), material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  parent.add(mesh);
  return mesh;
}
function block(p, x, y, z, w, h, d, c, rz = 0) {
  return part(p, new THREE.BoxGeometry(w, h, d), c, x, y, z, 0, 0, rz);
}
function stone(p, x, y, z, w, h, d, c, detail = 0) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  g.scale(w, h, d);
  return part(p, g, c, x, y, z);
}
function rod(p, a, b, r, c) {
  const A = new THREE.Vector3(...a),
    B = new THREE.Vector3(...b);
  const m = part(
    p,
    new THREE.CylinderGeometry(r, r * 0.94, A.distanceTo(B), 6),
    c,
    ...A.clone().add(B).multiplyScalar(0.5).toArray(),
  );
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.sub(A).normalize());
  return m;
}
function ring(p, x, y, z, r, c) {
  const m = part(p, new THREE.TorusGeometry(r, 0.024, 4, 10), c, x, y, z);
  return m;
}
// Uneven rings, off-axis centers and unequal front/back planes give each bust a
// carved contour instead of stacking stock spheres for a head and torso.
function loft(parent, rings, hex, segments = 9) {
  const positions = [];
  const at = (r, i) => {
    const a = (i / segments) * Math.PI * 2;
    return [r[3] + Math.cos(a) * r[1], r[0], (r[4] || 0) + Math.sin(a) * r[2]];
  };
  for (let k = 0; k < rings.length - 1; k++)
    for (let j = 0; j < segments; j++) {
      const a = at(rings[k], j),
        b = at(rings[k], j + 1),
        c = at(rings[k + 1], j + 1),
        d = at(rings[k + 1], j);
      positions.push(...a, ...d, ...b, ...b, ...d, ...c);
    }
  for (const [r, flip] of [
    [rings[0], false],
    [rings.at(-1), true],
  ])
    for (let j = 0; j < segments; j++) {
      const a = at(r, j),
        b = at(r, j + 1);
      positions.push(r[3], r[0], r[4] || 0, ...(flip ? b : a), ...(flip ? a : b));
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  return part(parent, g, hex);
}
function joint(parent, x, y, z) {
  const g = new THREE.Bone();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}
function consolidate(group) {
  for (const child of [...group.children]) if (child.isGroup || child.isBone) consolidate(child);
  const meshes = group.children.filter((c) => c.isMesh);
  if (!meshes.length) return;
  const parts = meshes.map((m) => {
    m.updateMatrix();
    const g = m.geometry.clone().applyMatrix4(m.matrix);
    m.geometry.dispose();
    group.remove(m);
    return g;
  });
  const g = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  const mesh = new THREE.Mesh(g, material);
  mesh.castShadow = mesh.receiveShadow = true;
  group.add(mesh);
}
function labelTexture(text, background = '#d4cbb0', foreground = '#34352f') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = background;
  x.fillRect(0, 0, 256, 128);
  x.fillStyle = foreground;
  x.textAlign = 'center';
  x.font = '900 32px sans-serif';
  text.split('|').forEach((s, i) => x.fillText(s, 128, 47 + i * 38));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Character {
  constructor(design) {
    this.design = design;
    this.root = new THREE.Group();
    this.root.name = design.id;
    this.phase = (design.name.charCodeAt(0) % 9) * 0.63;
    this.lastX = null;
    this.lastZ = null;
    this.angle = 0.38;
    this.step = 0;
    this.build();
  }
  build() {
    const d = this.design,
      w = d.width,
      h = d.height;
    const rig = (this.rig = joint(this.root, 0, 0, 0));
    rig.scale.setScalar(h);
    const legTop = 0.99,
      bodyTop = 2.04;
    this.legs = [-1, 1].map((sign) => {
      const g = joint(rig, sign * 0.24 * w, legTop, 0);
      loft(
        g,
        [
          [-0.87, 0.12, 0.15, sign * 0.035, 0.03],
          [-0.43, 0.145, 0.17, sign * 0.02, 0],
          [0, 0.17, 0.2, 0, 0],
        ],
        d.pants,
        7,
      );
      loft(
        g,
        [
          [-0.99, 0.18, 0.29, sign * 0.025, 0.12],
          [-0.91, 0.18, 0.3, sign * 0.025, 0.12],
          [-0.79, 0.135, 0.19, sign * 0.02, 0.045],
        ],
        d.outfit === 'scrubs' ? paper : '#41433c',
        8,
      );
      loft(
        g,
        [
          [-1.015, 0.18, 0.29, sign * 0.025, 0.12],
          [-0.975, 0.18, 0.29, sign * 0.025, 0.12],
        ],
        '#292f2d',
        8,
      );
      for (const z of [0.13, 0.22])
        rod(
          g,
          [-0.07, -0.845, z],
          [0.09, -0.845, z],
          0.012,
          d.outfit === 'scrubs' ? '#9b9d91' : '#858779',
        );
      block(g, 0, -0.49, 0.167, 0.15, 0.21, 0.014, skinDark(d.pants), 0.1 * sign);
      return g;
    });
    this.body = joint(rig, 0, legTop, 0);
    this.body.rotation.x = d.lean;
    const shoulder = d.shape === 'triangle' ? 0.65 : d.shape === 'column' ? 0.43 : 0.55;
    const belly = d.shape === 'pear' ? 0.63 : d.shape === 'slouch' ? 0.47 : 0.43;
    loft(
      this.body,
      [
        [0, 0.39 * w, 0.26, -0.025, 0.015],
        [0.18, belly * w, 0.34, 0, 0.03],
        [0.57, (belly - 0.025) * w, 0.32, 0.018, 0.05],
        [0.97, shoulder * w, 0.26, -0.018, 0],
        [1.08, 0.25, 0.2, 0, 0],
      ],
      d.shirt,
    );
    block(this.body, 0, 0.04, 0.295, 0.76 * w, 0.065, 0.055, d.pants);
    // Cloth seams, mismatched pocket, buttons and a repaired hem are geometry.
    rod(this.body, [-0.03, 0.15, 0.37], [0.014, 0.84, 0.29], 0.014, skinDark(d.shirt));
    for (let i = 0; i < 3; i++)
      stone(this.body, 0.03, 0.34 + i * 0.18, 0.36, 0.025, 0.025, 0.015, d.accent);
    block(this.body, -0.25 * w, 0.68, 0.3, 0.19, 0.2, 0.035, skinDark(d.shirt), -0.06);
    block(this.body, -0.25 * w, 0.77, 0.33, 0.2, 0.025, 0.02, d.accent, -0.06);
    if (['tie', 'uniform', 'auditor'].includes(d.outfit)) {
      block(this.body, -0.12, 0.99, 0.255, 0.25, 0.14, 0.06, paper, -0.4);
      block(this.body, 0.12, 1.01, 0.25, 0.25, 0.14, 0.06, paper, 0.4);
    }
    if (d.outfit === 'tie') {
      stone(this.body, 0.035, 0.9, 0.34, 0.075, 0.085, 0.035, d.accent);
      loft(
        this.body,
        [
          [0.4, 0.055, 0.028, 0.06, 0.4],
          [0.52, 0.09, 0.03, 0.04, 0.39],
          [0.85, 0.038, 0.023, 0.02, 0.34],
        ],
        d.accent,
        4,
      );
    }
    if (['apron', 'overalls', 'coverall'].includes(d.outfit)) {
      block(this.body, 0, 0.47, 0.375, 0.61 * w, 0.75, 0.065, d.accent, 0.025);
      for (const sign of [-1, 1])
        rod(this.body, [sign * 0.25, 0.8, 0.38], [sign * 0.25, 1.03, 0.17], 0.042, d.accent);
      block(this.body, 0.12, 0.31, 0.43, 0.29, 0.22, 0.025, skinDark(d.accent), -0.045);
      for (let i = 0; i < 3; i++)
        block(this.body, -0.2 + i * 0.045, 0.23, 0.42, 0.022, 0.065, 0.008, paper, 0.25);
    }
    if (['suspenders', 'vest', 'cardigan', 'coat'].includes(d.outfit)) {
      for (const sign of [-1, 1])
        rod(
          this.body,
          [sign * 0.32 * w, 0.13, 0.33],
          [sign * 0.25 * w, 1.0, 0.25],
          d.outfit === 'suspenders' ? 0.033 : 0.045,
          d.accent,
        );
      if (d.outfit === 'coat') {
        loft(
          this.body,
          [
            [-0.18, 0.51 * w, 0.31, 0, 0],
            [0.13, 0.53 * w, 0.34, 0, 0],
          ],
          d.shirt,
        );
        for (const sign of [-1, 1])
          block(this.body, sign * 0.18, 0.89, 0.27, 0.17, 0.32, 0.07, d.accent, sign * 0.28);
      }
    }
    if (d.outfit === 'stripes')
      for (let i = 0; i < 3; i++)
        block(this.body, 0, 0.27 + i * 0.18, 0.373, 0.85 * w, 0.065, 0.025, d.accent);
    if (d.outfit === 'uniform') {
      block(this.body, 0, 0.12, 0.34, 0.85 * w, 0.13, 0.09, ink);
      stone(this.body, -0.27, 0.78, 0.35, 0.1, 0.13, 0.035, '#c1a76a');
      for (const side of [-1, 1]) block(this.body, side * 0.55 * w, 0.96, 0, 0.21, 0.07, 0.28, ink);
    }
    if (d.outfit === 'scrubs')
      rod(this.body, [-0.19, 1.03, 0.22], [0, 0.79, 0.34], 0.03, skinDark(d.shirt));
    if (d.outfit === 'auditor') {
      for (let i = 0; i < 4; i++)
        stone(
          this.body,
          (i % 2 ? 0.29 : -0.18) * w,
          0.27 + i * 0.09,
          0.373,
          0.12,
          0.065,
          0.012,
          '#999375',
        );
      rod(this.body, [-0.2, 1.08, 0.22], [0, 0.48, 0.43], 0.022, ink);
      rod(this.body, [0.2, 1.08, 0.22], [0, 0.48, 0.43], 0.022, ink);
      block(this.body, 0, 0.42, 0.46, 0.23, 0.27, 0.026, paper, -0.07);
      block(this.body, 0, 0.45, 0.478, 0.16, 0.04, 0.01, ink, -0.07);
    }
    this.arms = [-1, 1].map((sign) => {
      const g = joint(this.body, sign * (shoulder * w + 0.06), 0.86, 0);
      stone(g, 0, -0.055, 0, 0.175, 0.17, 0.18, d.shirt, 1);
      const short = ['scrubs', 'work', 'auditor', 'crew', 'stripes'].includes(d.outfit);
      rod(g, [0, 0, 0], [sign * 0.09, -0.42, 0.005], 0.14, d.shirt);
      block(g, sign * 0.08, -0.33, 0.01, 0.29, 0.085, 0.3, d.accent, sign * 0.1);
      const fore = joint(g, sign * 0.09, -0.42, 0.005);
      rod(fore, [0, 0, 0], [sign * 0.025, -0.38, 0.025], 0.105, short ? d.skin : d.shirt);
      stone(fore, sign * 0.025, -0.43, 0.05, 0.13, 0.16, 0.105, d.skin, 1);
      stone(fore, -sign * 0.06, -0.4, 0.13, 0.055, 0.075, 0.065, d.skin);
      if (sign === -1) block(fore, 0.02, -0.31, 0.12, 0.19, 0.07, 0.065, ink);
      if (!short && sign === -1) {
        block(fore, -0.055, -0.055, -0.09, 0.15, 0.16, 0.03, skinDark(d.shirt));
        for (let i = 0; i < 3; i++)
          block(fore, -0.1 + i * 0.045, -0.11, -0.11, 0.016, 0.04, 0.016, d.accent, 0.2);
      }
      g.userData.fore = fore;
      return g;
    });
    rod(this.body, [0, 1.0, 0], [0, 1.24, 0.025], 0.16, d.skin);
    this.head = joint(this.body, -0.025, 1.21, 0.02);
    const f = d.face,
      [jaw, cheek, crown, top] =
        FACES[d.id] || (d.id === 'auditor-service' ? FACES.auditor : FACES.pat);
    loft(
      this.head,
      [
        [0, jaw * 0.78 * f, 0.2, 0.015, 0.015],
        [0.1, jaw * f, 0.26, 0.018, 0.035],
        [0.34, cheek * f, 0.29, -0.018, 0],
        [0.62, crown * f, 0.25, -0.025, -0.015],
        [top, 0.18 * f, 0.16, -0.01, -0.01],
      ],
      d.skin,
      9,
    );
    for (const sign of [-1, 1])
      stone(this.head, sign * 0.36 * f, 0.32, 0, 0.09, 0.13, 0.065, d.skin);
    // Asymmetrical cheeks, wedge nose, individually spaced eyes and uneven brows.
    stone(this.head, -0.21 * f, 0.24, 0.245, 0.1, 0.08, 0.03, d.skin);
    stone(this.head, 0.23 * f, 0.25, 0.245, 0.09, 0.07, 0.03, d.skin);
    stone(this.head, 0.016, 0.31, 0.29 + d.nose * 0.35, 0.095, 0.145, d.nose, d.skin);
    stone(this.head, 0.043, 0.24, 0.33 + d.nose * 0.64, 0.075, 0.046, 0.066, skinDark(d.skin));
    this.eyes = joint(this.head, 0, 0.435, 0.255);
    for (const sign of [-1, 1]) {
      block(
        this.eyes,
        sign * 0.17 * f,
        sign === -1 ? 0.008 : 0,
        0,
        0.135,
        sign === -1 ? 0.071 : 0.063,
        0.065,
        paper,
        sign * 0.035,
      );
      block(this.eyes, sign * 0.17 * f + 0.012, 0, 0.041, 0.044, 0.056, 0.018, ink);
    }
    this.brows = joint(this.head, 0, 0.55, 0.267);
    this.browL = joint(this.brows, -0.17 * f, 0, 0);
    this.browR = joint(this.brows, 0.17 * f, 0.023, 0);
    block(this.browL, 0, 0, 0, 0.21, 0.047, 0.065, d.hair);
    block(this.browR, 0, 0, 0, 0.19, 0.045, 0.056, d.hair);
    this.mouth = joint(this.head, 0.014, 0.13, 0.278);
    block(this.mouth, 0, 0, 0, 0.23, 0.035, 0.035, '#765345', -0.04);
    if (d.id === 'auditor' || d.id === 'auditor-service') {
      block(this.mouth, 0, 0, 0.022, 0.27, 0.09, 0.035, '#514038');
      for (const x of [-0.09, -0.045, 0.045, 0.09])
        block(this.mouth, x, 0.016, 0.046, 0.03, 0.035, 0.012, '#dac9a3');
      for (let i = 0; i < 9; i++)
        block(
          this.head,
          Math.sin(i * 13) * 0.23,
          0.06 + (i % 3) * 0.035,
          0.2 + Math.cos(i * 13) * 0.035,
          0.012,
          0.025,
          0.016,
          d.hair,
          0.3,
        );
    }
    this.tears = joint(this.head, 0, 0.28, 0.285);
    this.tears.visible = false;
    for (const sign of [-1, 1])
      stone(this.tears, sign * 0.18 * f, 0, 0, 0.025, 0.13, 0.025, '#a6c7cb');
    if (['lee', 'chris', 'gus'].includes(d.id)) {
      for (const sign of [-1, 1])
        block(this.head, sign * 0.075, 0.18, 0.298, 0.16, 0.052, 0.045, d.hair, -sign * 0.12);
    }
    if (d.id === 'sam') ring(this.head, 0.4 * f, 0.25, 0.035, 0.08, d.accent);
    if (['nell', 'casey'].includes(d.id))
      for (const sign of [-1, 1])
        for (let i = 0; i < 3; i++)
          stone(
            this.head,
            sign * (0.18 + i * 0.033) * f,
            0.29 - (i % 2) * 0.025,
            0.278,
            0.012,
            0.012,
            0.009,
            skinDark(d.skin),
          );
    this.makeHair();
    if (d.glasses)
      for (const sign of [-1, 1]) {
        if (d.glasses === 'round') ring(this.head, sign * 0.18 * f, 0.435, 0.32, 0.125, d.accent);
        else {
          for (const y of [0.35, 0.515])
            block(this.head, sign * 0.18 * f, y, 0.32, 0.29, 0.032, 0.027, ink);
          for (const x of [sign * 0.18 * f - 0.135, sign * 0.18 * f + 0.135])
            block(this.head, x, 0.43, 0.32, 0.029, 0.18, 0.03, ink);
        }
        rod(
          this.head,
          [sign * 0.29 * f, 0.46, 0.32],
          [sign * 0.35 * f, 0.45, -0.015],
          0.018,
          d.glasses === 'round' ? d.accent : ink,
        );
      }
    if (d.glasses)
      rod(
        this.head,
        [-0.055, 0.445, 0.34],
        [0.055, 0.445, 0.34],
        0.018,
        d.glasses === 'round' ? d.accent : ink,
      );
    this.makeProp();
    consolidate(rig);
    // Shirt lettering is a local canvas texture on the actual model, never a HUD tag.
    if (d.outfit === 'crew') {
      const texture = labelTexture('I’M WITH|STUPID');
      this.letterMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 1 });
      for (const z of [0.395, -0.342]) {
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.36), this.letterMaterial);
        mesh.position.set(0, 0.57, z);
        if (z < 0) mesh.rotation.y = Math.PI;
        this.body.add(mesh);
      }
    }
    this.skinRig();
    this.mask = null;
    this.setMask(null);
  }
  setMerch(kind) {
    if (this.merchKind === kind) return;
    this.merchKind = kind;
    if (this.merchMesh) {
      this.body.remove(this.merchMesh);
      this.merchMesh.geometry.dispose();
      this.merchMesh.material.map.dispose();
      this.merchMesh.material.dispose();
      this.merchMesh = null;
    }
    const shirt = MERCH[kind];
    if (!shirt) return;
    const texture = labelTexture(shirt.label, shirt.color, '#f4edda');
    this.merchMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.04, 0.52),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 1 }),
    );
    this.merchMesh.position.set(0, 0.57, 0.425);
    this.body.add(this.merchMesh);
  }
  updateFlies(t, enabled) {
    if (!enabled) {
      if (this.flies) this.flies.visible = false;
      return;
    }
    if (!this.flies) {
      this.flies = new THREE.Group();
      this.root.add(this.flies);
      this.flyBodies = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.032, 5, 4),
        new THREE.MeshStandardMaterial({ color: '#1d2318', roughness: 0.9 }),
        8,
      );
      this.flyWings = new THREE.InstancedMesh(
        new THREE.SphereGeometry(0.026, 4, 3),
        new THREE.MeshStandardMaterial({ color: '#b7c0a6', roughness: 0.4 }),
        16,
      );
      this.flies.add(this.flyBodies, this.flyWings);
      this.flyMatrix = new THREE.Object3D();
    }
    this.flies.visible = true;
    for (let i = 0; i < 8; i++) {
      const a = t * (1.5 + i * 0.13) + i * 2.4,
        r = 0.7 + (i % 3) * 0.15;
      const x = Math.cos(a) * r,
        y = 1.65 + (i % 4) * 0.36 + Math.sin(a * 2.3) * 0.17,
        z = Math.sin(a) * r;
      const m = this.flyMatrix;
      m.position.set(x, y, z);
      m.rotation.set(0, a, 0);
      m.scale.set(1, 0.7, 1.4);
      m.updateMatrix();
      this.flyBodies.setMatrixAt(i, m.matrix);
      for (let side = 0; side < 2; side++) {
        m.position.set(x + (side ? 1 : -1) * 0.04, y + 0.02, z);
        m.rotation.z = Math.sin(t * 70 + i) * (side ? 1 : -1);
        m.scale.set(1.4, 0.2, 0.7);
        m.updateMatrix();
        this.flyWings.setMatrixAt(i * 2 + side, m.matrix);
      }
    }
    this.flyBodies.instanceMatrix.needsUpdate = true;
    this.flyWings.instanceMatrix.needsUpdate = true;
  }
  skinRig() {
    // One skinned draw for the figure. The deliberately rigid weights preserve
    // carved planes while articulated bones still give expressive movement.
    this.root.updateMatrixWorld(true);
    const bones = [];
    this.rig.traverse((o) => {
      if (o.isBone) bones.push(o);
    });
    const parts = [],
      remove = [];
    this.rig.traverse((o) => {
      if (!o.isMesh || o.material !== material) return;
      let ancestor = o.parent,
        excluded = false;
      while (ancestor && ancestor !== this.root) {
        if (ancestor === this.tears || ancestor === this.cameraProp) excluded = true;
        ancestor = ancestor.parent;
      }
      if (excluded) return;
      const g = o.geometry.clone().applyMatrix4(o.matrixWorld),
        count = g.getAttribute('position').count;
      const index = bones.indexOf(o.parent),
        indices = new Uint16Array(count * 4),
        weights = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) {
        indices[i * 4] = index;
        weights[i * 4] = 1;
      }
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
      g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
      parts.push(g);
      remove.push(o);
    });
    const geometry = mergeGeometries(parts);
    parts.forEach((g) => g.dispose());
    remove.forEach((o) => {
      o.parent.remove(o);
      o.geometry.dispose();
    });
    this.skeleton = new THREE.Skeleton(bones);
    this.mesh = new THREE.SkinnedMesh(geometry, material);
    this.mesh.name = this.design.id + '-figure';
    this.mesh.castShadow = this.mesh.receiveShadow = true;
    this.mesh.frustumCulled = false;
    this.root.add(this.mesh);
    this.mesh.bind(this.skeleton);
  }
  makeHair() {
    const d = this.design,
      H = this.head,
      c = d.hair,
      f = d.face;
    if (['cap', 'visor', 'helmet', 'sunhat', 'beanie'].includes(d.hairdo)) {
      const hat = ['cap', 'visor'].includes(d.hairdo)
        ? d.accent
        : d.hairdo === 'helmet'
          ? '#d5b45b'
          : d.hairdo === 'sunhat'
            ? '#bba774'
            : d.accent;
      if (d.hairdo !== 'visor')
        loft(
          H,
          [
            [0.57, 0.38 * f, 0.3, 0, -0.015],
            [0.81, 0.34 * f, 0.27, -0.045, -0.01],
            [0.94, 0.13, 0.14, -0.075, 0],
          ],
          hat,
        );
      block(H, 0, 0.61, 0.06, 0.76 * f, 0.09, 0.61, skinDark(hat));
      if (['cap', 'visor'].includes(d.hairdo))
        block(H, 0.015, 0.59, 0.43, 0.6, 0.045, 0.37, hat, -0.055);
      if (d.hairdo === 'sunhat') {
        const g = new THREE.CylinderGeometry(0.64, 0.68, 0.065, 10);
        g.scale(1, 1, 0.86);
        part(H, g, hat, 0, 0.61, 0.02, 0, 0, 0.08);
      }
      if (d.hairdo === 'beanie')
        for (let i = 0; i < 5; i++)
          rod(
            H,
            [-0.28 + i * 0.14, 0.61, 0.295],
            [-0.29 + i * 0.125, 0.77, 0.265],
            0.012,
            skinDark(hat),
          );
      if (d.hairdo === 'helmet')
        for (const x of [-0.21, 0, 0.21])
          rod(H, [x, 0.85, 0.2], [x, 0.72, -0.25], 0.031, skinDark(hat));
      return;
    }
    if (d.hairdo === 'bald') {
      for (const x of [-0.32, 0.32])
        block(H, x * f, 0.46, -0.095, 0.14, 0.27, 0.34, c, x < 0 ? -0.1 : 0.08);
      if (d.id === 'auditor' || d.id === 'auditor-service')
        rod(H, [-0.2, 0.72, 0], [0.07, 0.765, 0.01], 0.013, c);
    } else if (d.hairdo === 'curls') {
      for (let i = 0; i < 9; i++)
        stone(
          H,
          Math.cos(i * 2.4) * 0.28 * f,
          0.69 + (i % 3) * 0.065,
          Math.sin(i * 2.4) * 0.22,
          0.18,
          0.17,
          0.17,
          c,
          0,
        );
    } else {
      loft(
        H,
        [
          [0.51, 0.35 * f, 0.27, 0, -0.045],
          [0.71, 0.37 * f, 0.27, -0.015, -0.055],
          [0.86, 0.23 * f, 0.22, -0.06, -0.025],
        ],
        c,
      );
      if (d.hairdo === 'bob')
        for (const x of [-0.34, 0.34]) block(H, x * f, 0.39, -0.07, 0.16, 0.48, 0.42, c, -x * 0.12);
      if (d.hairdo === 'bun') stone(H, 0.12, 0.8, -0.3, 0.21, 0.2, 0.2, c, 1);
      if (d.hairdo === 'ponytail') {
        stone(H, 0, 0.6, -0.32, 0.16, 0.22, 0.14, c);
        rod(H, [0, 0.56, -0.33], [0.13, 0.18, -0.47], 0.12, c);
        block(H, 0, 0.6, -0.35, 0.28, 0.08, 0.13, d.accent);
      }
      if (d.hairdo === 'quiff') stone(H, -0.14, 0.87, 0.1, 0.3, 0.22, 0.23, c);
      if (['part', 'flat'].includes(d.hairdo))
        for (let i = 0; i < 3; i++)
          rod(H, [-0.22 + i * 0.12, 0.79, 0.21], [0.02 + i * 0.1, 0.69, 0.265], 0.019, skinDark(c));
    }
  }
  makeProp() {
    const d = this.design,
      B = this.body,
      F = this.arms[0].userData.fore;
    switch (d.prop) {
      case 'coffee':
        part(F, new THREE.CylinderGeometry(0.115, 0.075, 0.26, 8), paper, 0, -0.38, 0.22);
        part(F, new THREE.CylinderGeometry(0.13, 0.13, 0.04, 8), ink, 0, -0.24, 0.22);
        block(F, 0, -0.37, 0.31, 0.14, 0.085, 0.025, d.accent);
        break;
      case 'books':
      case 'folder':
      case 'parcel': {
        const c = d.prop === 'parcel' ? '#b19367' : d.accent;
        block(B, -0.49 * d.width, 0.43, 0.15, 0.3, 0.54, 0.42, c, -0.1);
        block(
          B,
          -0.49 * d.width,
          0.43,
          0.369,
          0.26,
          0.43,
          0.021,
          d.prop === 'parcel' ? '#d4bd8c' : paper,
          -0.1,
        );
        if (d.prop === 'books')
          block(B, -0.55 * d.width, 0.4, 0.12, 0.13, 0.59, 0.42, '#657c78', -0.12);
        break;
      }
      case 'bag':
      case 'tote':
      case 'satchel':
        rod(B, [0.33, 0.98, 0.23], [-0.6 * d.width, 0.1, 0.18], 0.042, d.accent);
        block(B, -0.67 * d.width, -0.02, 0.08, 0.31, 0.59, 0.47, d.accent, -0.06);
        block(B, -0.67 * d.width, 0.09, 0.335, 0.28, 0.19, 0.043, skinDark(d.accent), -0.06);
        break;
      case 'leash':
        ring(F, -0.02, -0.4, 0.12, 0.19, d.accent);
        rod(F, [0, -0.5, 0.14], [-0.22, -0.75, 0.27], 0.025, d.accent);
        break;
      case 'cane':
        rod(F, [0, -0.39, 0.11], [0.025, -0.98, 0.14], 0.046, d.accent);
        rod(F, [0, -0.39, 0.11], [0, -0.39, 0.27], 0.05, d.accent);
        break;
      case 'camera':
        this.cameraProp = joint(this.arms[1].userData.fore, 0, -0.38, 0.16);
        block(this.cameraProp, 0, 0, 0.055, 0.36, 0.24, 0.21, ink);
        part(
          this.cameraProp,
          new THREE.CylinderGeometry(0.08, 0.1, 0.14, 8),
          '#526971',
          0,
          0,
          0.23,
          Math.PI / 2,
        );
        block(this.cameraProp, -0.1, 0.055, 0.17, 0.027, 0.027, 0.02, '#ca694c');
        break;
      case 'mic':
        rod(F, [0, -0.38, 0], [0, 0.38, 0.4], 0.025, ink);
        stone(F, 0, 0.43, 0.46, 0.11, 0.18, 0.13, '#77796a');
        break;
      case 'radio':
        block(B, 0.39, 0.66, 0.31, 0.14, 0.25, 0.11, ink);
        rod(B, [0.39, 0.76, 0.31], [0.39, 0.99, 0.31], 0.017, ink);
        break;
      case 'badge':
        rod(B, [0.2, 1.01, 0.22], [0.21, 0.53, 0.38], 0.014, ink);
        block(B, 0.21, 0.44, 0.38, 0.17, 0.23, 0.025, paper, -0.1);
        break;
      case 'pencil':
        rod(this.head, [0.33, 0.35, 0], [0.36, 0.7, 0.04], 0.02, '#d8ac51');
        break;
      case 'flowers':
        for (let i = 0; i < 3; i++) {
          rod(F, [0, -0.42, 0.14], [0.1 * (i - 1), -0.08, 0.22], 0.012, '#6d8050');
          stone(
            F,
            0.1 * (i - 1),
            -0.07,
            0.22,
            0.09,
            0.08,
            0.07,
            ['#b77066', '#dac89a', '#c18d61'][i],
          );
        }
        break;
      case 'rag':
        block(F, 0, -0.55, 0.02, 0.25, 0.27, 0.04, '#96917a', 0.25);
        break;
      case 'trowel':
        rod(F, [0, -0.42, 0.12], [0, -0.65, 0.18], 0.035, '#a4865c');
        stone(F, 0, -0.75, 0.21, 0.1, 0.16, 0.025, '#8b9a94');
        break;
    }
  }
  setMask(kind) {
    if (this.maskKind === kind) return;
    this.maskKind = kind;
    if (this.mask) {
      this.head.remove(this.mask);
      this.mask.traverse((o) => o.geometry?.dispose());
    }
    this.mask = null;
    if (!kind) return;
    const g = (this.mask = joint(this.head, 0, 0.3, 0.4));
    if (kind === 'cloth') {
      stone(g, 0, -0.12, 0.015, 0.39, 0.24, 0.19, '#343d3b', 1);
      for (const sign of [-1, 1])
        rod(g, [sign * 0.28, -0.01, 0], [sign * 0.37, 0.09, -0.32], 0.028, '#343d3b');
    } else if (kind === 'clown') {
      stone(g, 0, 0.05, 0, 0.4, 0.45, 0.13, '#e9debf', 1);
      for (const x of [-0.16, 0.16]) {
        block(g, x, 0.12, 0.14, 0.12, 0.13, 0.035, '#3c595d', x);
        stone(g, x, 0.02, 0.13, 0.08, 0.07, 0.025, '#b45c43');
      }
      stone(g, 0, 0.015, 0.21, 0.105, 0.1, 0.095, '#ae4d35', 1);
      block(g, 0, -0.15, 0.135, 0.27, 0.045, 0.05, ink, 0.06);
    } else {
      for (let i = 0; i < 3; i++)
        stone(g, -0.04 * i, 0.14 * i - 0.12, 0.025 * i, 0.32 - i * 0.075, 0.17, 0.14, '#806047');
      block(g, -0.12, 0.03, 0.17, 0.055, 0.065, 0.025, paper);
      block(g, 0.12, 0.03, 0.17, 0.055, 0.065, 0.025, paper);
    }
    consolidate(g);
  }
  update(n, t, { gallery = false, heading = null } = {}) {
    const d = this.design,
      emotional = gallery || n.emotionUntil > t,
      mood = emotional ? n.emotion : n.flee > 0 ? 'recoil' : null;
    const dt = Math.min(0.1, Math.max(0, t - (this.lastUpdate ?? t)));
    this.lastUpdate = t;
    const distance =
      this.lastX === null ? 0 : Math.hypot((n.x || 0) - this.lastX, (n.z || 0) - this.lastZ);
    const moving = !!n.moving && (gallery || distance > 0.0001);
    this.walkPhase =
      (this.walkPhase || 0) + (gallery && moving ? dt * 7 : Math.min(distance, 1) * 3.1);
    const wave = Math.sin(this.walkPhase + this.phase);
    this.root.position.set(n.x || 0, 0, n.z || 0);
    if (heading !== null) this.angle = heading;
    else if (this.lastX !== null && moving && distance > 0.0001) {
      const target = Math.atan2((n.x || 0) - this.lastX, (n.z || 0) - this.lastZ);
      const delta = Math.atan2(Math.sin(target - this.angle), Math.cos(target - this.angle));
      this.angle += delta * (1 - Math.exp(-12 * dt));
    }
    this.lastX = n.x || 0;
    this.lastZ = n.z || 0;
    this.root.rotation.y = this.angle;
    this.rig.position.y = moving ? Math.abs(wave) * 0.055 : Math.sin(t * 1.8 + this.phase) * 0.009;
    this.body.rotation.x = d.lean + (mood === 'cry' ? 0.17 : 0) + (moving ? wave * 0.035 : 0);
    this.body.rotation.z =
      mood === 'rage' ? Math.sin(t * 9) * 0.065 : Math.sin(t * 1.7 + this.phase) * 0.009;
    this.legs.forEach((g, i) => {
      g.rotation.x = moving
        ? wave * (i ? -0.38 : 0.38)
        : mood === 'rage'
          ? Math.sin(t * 10 + i * 2) * 0.16
          : 0;
    });
    this.arms.forEach((g, i) => {
      const sign = i ? 1 : -1;
      g.rotation.set(moving ? -wave * sign * 0.35 : 0.045, 0, sign * 0.075);
      g.userData.fore.rotation.set(-0.12, 0, 0);
      if (mood === 'rage') {
        g.rotation.z = sign * (0.85 + Math.sin(t * 7 + i) * 0.35);
        g.rotation.x = -0.4;
        g.userData.fore.rotation.x = -0.65;
      }
      if (mood === 'cry') {
        g.rotation.z = -sign * 0.12;
        g.rotation.x = -1.85;
        g.userData.fore.rotation.x = -0.85;
      }
      if (mood === 'throw') {
        g.rotation.x = i ? -2.0 + Math.sin(t * 6) * 1.0 : -0.35;
        g.rotation.z = sign * 0.35;
      }
      if (mood === 'refuse') {
        g.rotation.x = -1.05;
        g.rotation.z = sign * 0.18;
        g.userData.fore.rotation.x = -0.25;
      }
      if (mood === 'recoil') {
        g.rotation.x = -1.2;
        g.rotation.z = sign * 0.35;
      }
    });
    if (this.cameraProp) {
      this.cameraProp.visible = n.player !== false;
      this.arms[1].rotation.x = n.player !== false ? -1.15 : this.arms[1].rotation.x;
    }
    if (this.cameraProp)
      this.cameraProp.rotation.x = -this.arms[1].rotation.x - this.arms[1].userData.fore.rotation.x;
    if (n.working) {
      this.body.rotation.x += 0.12;
      this.arms[0].rotation.x = -0.65;
    }
    this.head.rotation.set(
      mood === 'cry' ? 0.2 : -0.02,
      Math.sin(t * 0.85 + this.phase) * 0.06,
      mood === 'rage' ? Math.sin(t * 6) * 0.045 : Math.sin(t * 0.9 + this.phase) * 0.025,
    );
    this.brows.rotation.z = 0;
    this.browL.rotation.z = mood === 'rage' ? -0.29 : mood === 'cry' ? 0.28 : 0.09;
    this.browR.rotation.z = mood === 'rage' ? 0.3 : mood === 'cry' ? -0.25 : -0.17;
    this.brows.position.y = mood === 'rage' ? 0.51 : mood === 'cry' ? 0.58 : 0.55;
    this.eyes.scale.y = (t + this.phase) % 4.7 < 0.13 ? 0.13 : mood === 'rage' ? 0.68 : 1;
    this.mouth.scale.y = mood === 'rage' ? 3.8 : mood === 'cry' ? 2.3 : 1;
    this.mouth.rotation.z = mood === 'cry' ? 0.13 : 0;
    this.tears.visible = mood === 'cry';
    this.setMask(n.mask || null);
    this.setMerch(n.merch || null);
    this.updateFlies(t, !!n.flies);
  }
  dispose() {
    this.skeleton?.dispose();
    if (this.merchMesh) {
      this.merchMesh.material.map.dispose();
      this.merchMesh.material.dispose();
    }
    this.flyBodies?.dispose();
    this.flyWings?.dispose();
    this.flyBodies?.material.dispose();
    this.flyWings?.material.dispose();
    this.root.traverse((o) => o.geometry?.dispose());
    if (this.letterMaterial) {
      this.letterMaterial.map.dispose();
      this.letterMaterial.dispose();
    }
  }
}
