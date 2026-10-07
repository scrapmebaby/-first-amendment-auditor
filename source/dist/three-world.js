import { MERCH, mirrorSites } from './appearance.js';
import * as THREE from 'three/webgpu';
import {
  Fn,
  reflector,
  uniform,
  pass,
  screenUV,
  screenCoordinate,
  positionWorld,
  sin,
  vertexColor,
  normalize,
  cameraPosition,
  mix,
  color,
  smoothstep,
  mx_noise_float,
  dot,
  pow,
} from 'three/tsl';
import { bayer16 } from 'three/addons/tsl/math/Bayer.js';
import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { World } from './world.js';
import { WEATHER } from './atmosphere.js';
import { Character, CAST, AUDITOR, SUPPORT } from './characters.js';

// Geometry and gameplay remain independent. The legacy painter also remains available
// on devices without either GPU backend; no external assets or runtime requests.
export class ThreeWorld extends World {
  constructor(canvas, overlay) {
    super(canvas, overlay);
    this.view = new THREE.Vector3();
    this.ray = new THREE.Raycaster();
    this.ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    try {
      this.quality = localStorage.getItem('auditor-graphics');
    } catch {}
    this.autoQuality = !this.quality;
    this.quality ||= innerWidth < 700 ? 'balanced' : 'cinematic';
    this.quality = ['cinematic', 'balanced'].includes(this.quality) ? this.quality : 'balanced';
    this.lastSize = '';
  }

  // Closed boxes give proper depth, all-sided lighting, and real shadow casters.
  box(x, y, z, w, h, d, color) {
    const X = x - w / 2,
      Z = z - d / 2,
      R = X + w,
      B = Z + d,
      T = y + h;
    for (const face of [
      [
        [X, T, B],
        [R, T, B],
        [R, T, Z],
        [X, T, Z],
      ],
      [
        [X, y, Z],
        [R, y, Z],
        [R, y, B],
        [X, y, B],
      ],
      [
        [X, y, B],
        [R, y, B],
        [R, T, B],
        [X, T, B],
      ],
      [
        [R, y, Z],
        [X, y, Z],
        [X, T, Z],
        [R, T, Z],
      ],
      [
        [R, y, B],
        [R, y, Z],
        [R, T, Z],
        [R, T, B],
      ],
      [
        [X, y, Z],
        [X, y, B],
        [X, T, B],
        [X, T, Z],
      ],
    ])
      this.poly(face, color);
  }

  flat(x, z, w, d, c, y = 0.025) {
    if (['#a3b389', '#a8b594', '#9eac8a', '#88977b'].includes(c)) return;
    // Painter order formerly separated coplanar roads and sidewalks. Give them
    // distinct physical elevations now that the renderer has a depth buffer.
    if (c === '#939c8e') y = 0.045;
    if (c === '#dedfc9' || c === '#f0edda') y = 0.075;
    super.flat(x, z, w, d, c, y);
  }

  poly(points, c, layer = 0) {
    if (layer === -9000) return; // superseded by shadow maps
    c =
      {
        '#cbd6b5': '#829975',
        '#939c8e': '#555e63',
        '#dedecb': '#b9b6a8',
        '#e0dfca': '#c5bcaa',
        '#aaaf9b': '#777d75',
      }[c] || c;
    super.poly(points, c, layer);
  }

  tree(x, z, size = 1) {
    this.box(x, 0, z, 0.6 * size, 4 * size, 0.6 * size, '#705a43');
    const g = new THREE.IcosahedronGeometry(2.6 * size, 1);
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i += 3) {
      const face = [];
      for (let j = 0; j < 3; j++)
        face.push([x + p.getX(i + j), 5.6 * size + p.getY(i + j) * 1.25, z + p.getZ(i + j)]);
      this.poly(face, ['#638152', '#718957', '#7b925b'][Math.floor(i / 3) % 3]);
    }
    g.dispose();
  }

  makeTown() {
    super.makeTown();
    this.polys = this.static;
    for (const x of [-10, 10, 38, 58])
      for (const z of [-40, -6, 17, 44, 56]) {
        this.box(x, 0, z, 2.7, 0.5, 2.7, '#a49f8d');
        this.tree(x, z, 0.8);
      }
    this.static = this.polys;
    this.polys = [];
  }

  async init() {
    try {
      if (WEATHER[this.atmosphere.choice]) {
        Object.assign(this.atmosphere, WEATHER[this.atmosphere.choice]);
        this.atmosphere.current = this.atmosphere.choice;
      }
      let adapter = null;
      try {
        adapter = await navigator.gpu?.requestAdapter();
      } catch {}
      if (!adapter) {
        // Preflight avoids a Three.js backend initialization rejection on devices
        // where both graphics APIs are disabled; the legacy renderer stays usable.
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) throw new Error('Neither WebGPU nor WebGL 2 is available.');
        probe.getExtension('WEBGL_lose_context')?.loseContext();
      }
      this.renderer = new THREE.WebGPURenderer({
        canvas: this.canvas,
        antialias: true,
        forceWebGL: !adapter,
      });
      await this.renderer.init();
      if (this.autoQuality && !this.renderer.backend.isWebGPUBackend) this.quality = 'balanced';
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.05;
      this.renderer.shadowMap.enabled = true;
      this.scene = new THREE.Scene();
      this.people = new Map();
      this.scene.fog = new THREE.FogExp2('#b9cad0', 0.006);
      this.camera = new THREE.PerspectiveCamera(52, 1, 0.3, 1500);
      this.clockNode = uniform(0);
      this.cloudNode = uniform(0.2);
      this.densityNode = uniform(0.004);

      this.material = new THREE.MeshStandardNodeMaterial({
        vertexColors: false,
        roughness: 0.88,
        side: THREE.DoubleSide,
      });
      // Slow spatial modulation suggests cloud shade without tinting the HUD.
      const cloud = sin(positionWorld.x.mul(0.037).add(this.clockNode.mul(0.035)))
        .mul(sin(positionWorld.z.mul(0.043).add(this.clockNode.mul(0.024))))
        .mul(0.5)
        .add(0.5);
      this.material.colorNode = vertexColor().rgb.mul(cloud.mul(this.cloudNode).mul(-0.27).add(1));
      this.staticMesh = new THREE.Mesh(this.geometry(this.static), this.material);
      this.staticMesh.castShadow = this.staticMesh.receiveShadow = true;
      this.scene.add(this.staticMesh);
      this.dynamicMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
      this.dynamicMesh.castShadow = this.dynamicMesh.receiveShadow = true;
      this.dynamicMesh.frustumCulled = false;
      this.scene.add(this.dynamicMesh);

      this.fill = new THREE.HemisphereLight('#bedcf2', '#706d45', 1.65);
      this.scene.add(this.fill);
      this.sun = new THREE.SpotLight('#ffe2ac', 3.2, 0, 0.16, 0.2, 0);
      this.sun.position.set(-650, 420, -850);
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(1024, 1024);
      Object.assign(this.sun.shadow.camera, { near: 650, far: 1600 });
      this.sun.shadow.normalBias = 0.08;
      this.sun.shadow.bias = -0.0015;
      this.sun.layers.enable(10);
      this.scene.add(this.sun, this.sun.target);
      this.sun.layers.enable(1);
      this.fill.layers.enable(1);

      const skyMaterial = new THREE.MeshBasicNodeMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      });
      this.sunDirection = uniform(new THREE.Vector3(-65, 35, -85).normalize());
      const direction = normalize(positionWorld.sub(cameraPosition));
      const height = direction.y.max(0);
      const gradient = mix(color('#d9d5bb'), color('#527eab'), height.pow(0.4));
      const sunDot = dot(direction, this.sunDirection).max(0);
      const cloudUV = direction.xz.div(height.add(0.16)).mul(1.8);
      const cloudNoise = mx_noise_float(cloudUV.add(this.clockNode.mul(0.007))).add(
        mx_noise_float(cloudUV.mul(2.5)).mul(0.3),
      );
      const clouds = smoothstep(this.cloudNode.mul(-0.45).add(0.15), 0.65, cloudNoise).mul(
        smoothstep(0, 0.12, height),
      );
      const skyColor = mix(gradient, color('#e9e2cf'), clouds.mul(0.75));
      skyMaterial.colorNode = skyColor
        .add(pow(sunDot, 48).mul(color('#ffbc70')).mul(0.45))
        .add(pow(sunDot, 1600).mul(color('#fff2c6')).mul(5));
      this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 24, 12), skyMaterial);
      this.scene.add(this.sky);
      this.makeHorizon();

      // Quarter-resolution, depth-clipped, shadow-aware scattering. It is actual
      // volumetric light, not a screen-space triangle painted over buildings.
      this.volumeMaterial = new THREE.VolumeNodeMaterial();
      this.volumeMaterial.steps = 48;
      this.volumeMaterial.fog = false;
      this.volumeMaterial.offsetNode = bayer16(screenCoordinate);
      this.volumeMaterial.scatteringNode = Fn(({ positionRay }) => {
        const drift = sin(positionRay.x.mul(0.065).add(this.clockNode.mul(0.06)))
          .mul(sin(positionRay.z.mul(0.05)))
          .mul(0.35)
          .add(0.65);
        return drift.mul(this.densityNode);
      });
      this.volume = new THREE.Mesh(new THREE.BoxGeometry(230, 75, 230), this.volumeMaterial);
      this.volume.position.y = 30;
      this.volume.receiveShadow = true;
      this.volume.layers.set(10);
      this.scene.add(this.volume);
      this.setupPipeline();
      this.backend = this.renderer.backend.isWebGPUBackend
        ? 'THREE.JS · WEBGPU'
        : 'THREE.JS · WEBGL 2';
      // Weather is now in 3D; retain only rain and a restrained edge vignette in
      // the overlay so older painter-only atmospheric shafts are not doubled.
      this.atmosphere.draw = (c, w, h) => this.drawWeather(c, w, h);
      this.renderScene = this.drawThree.bind(this);
      return this.backend;
    } catch (error) {
      console.warn('3D renderer unavailable; starting compatibility mode.', error.message);
      this.renderer?.dispose();
      this.renderer = null;
      const replacement = document.createElement('canvas');
      replacement.id = 'world';
      this.canvas.replaceWith(replacement);
      this.canvas = replacement;
      const legacy = new World(replacement, this.overlay);
      legacy.atmosphere.choice = this.atmosphere.choice;
      Object.setPrototypeOf(this, World.prototype);
      Object.assign(this, legacy);
      return this.init();
    }
  }

  setupPipeline() {
    this.pipeline?.dispose();
    this.scenePass?.dispose();
    this.volumePass?.dispose();
    this.blurPass?.dispose();
    this.bloomPass?.dispose();
    this.scenePass = pass(this.scene, this.camera);
    const color = this.scenePass.getTextureNode('output');
    this.pipeline = new THREE.RenderPipeline(this.renderer);
    if (this.quality === 'cinematic') {
      this.volumeMaterial.depthNode = this.scenePass.getTextureNode('depth').sample(screenUV);
      const layers = new THREE.Layers();
      layers.set(10);
      this.volumePass = pass(this.scene, this.camera, { depthBuffer: false });
      this.volumePass.setLayers(layers);
      this.volumePass.setResolutionScale(0.35);
      const shafts = (this.blurPass = gaussianBlur(this.volumePass, uniform(0.9)));
      this.bloomPass = bloom(color, 0.12, 0.45, 1.25);
      this.pipeline.outputNode = color.add(shafts.mul(0.45)).add(this.bloomPass);
    } else {
      this.pipeline.outputNode = color;
    }
  }

  setQuality(value) {
    if (!['balanced', 'cinematic'].includes(value)) return;
    this.quality = value;
    try {
      localStorage.setItem('auditor-graphics', value);
    } catch {}
    if (this.renderer) {
      this.setupPipeline();
      this.lastSize = '';
    }
  }

  geometry(polygons) {
    const positions = [],
      colors = [];
    const color = new THREE.Color();
    for (const polygon of polygons) {
      let points = polygon.p;
      const flat = points.every((p) => Math.abs(p[1] - points[0][1]) < 0.00001);
      // Legacy flat polygons have downward winding; real lighting needs +Y.
      if (flat && polygon.depth < -9000) points = [...points].reverse();
      color.setRGB(...polygon.c, THREE.SRGBColorSpace);
      for (let i = 1; i < points.length - 1; i++)
        for (const point of [points[0], points[i], points[i + 1]]) {
          positions.push(...point);
          colors.push(color.r, color.g, color.b);
        }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }

  makeHorizon() {
    const earth = new THREE.MeshStandardMaterial({
      color: '#697d70',
      roughness: 1,
      flatShading: true,
    });
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2,
        radius = 260 + (i % 3) * 30;
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 7), earth);
      mesh.scale.set(95 + (i % 4) * 15, 25 + (i % 5) * 9, 85);
      mesh.position.set(Math.cos(angle) * radius, -8, Math.sin(angle) * radius);
      this.scene.add(mesh);
    }
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(1400, 1400),
      new THREE.MeshStandardMaterial({ color: '#7d9166', roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.12;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  updateCamera() {
    const s = this.playerState;
    const first = s?.viewMode === 'first';
    const key = `${this.cx}:${this.cz}:${this.w}:${this.h}:${this.zoom}:${first}:${s?.x}:${s?.z}:${s?.lookYaw}:${s?.lookPitch}:${s?.carHeading}:${s?.driving}`;
    if (key === this.cameraKey) return;
    this.cameraKey = key;
    this.camera.aspect = this.w / Math.max(1, this.h);
    this.camera.fov = first ? 72 : 52;
    this.camera.near = first ? 0.08 : 0.3;
    if (first) {
      const yaw = s.driving ? s.carHeading || 0 : s.lookYaw || 0,
        pitch = s.driving ? -0.06 : s.lookPitch || 0;
      const x = s.x + (s.driving ? Math.sin(yaw) * 1.65 : 0),
        z = s.z + (s.driving ? Math.cos(yaw) * 1.65 : 0),
        y = s.driving ? 2.65 : 2.55;
      this.camera.position.set(x, y, z);
      this.camera.lookAt(
        x + Math.sin(yaw) * Math.cos(pitch),
        y + Math.sin(pitch),
        z + Math.cos(yaw) * Math.cos(pitch),
      );
    } else {
      const distance = Math.max(28, this.h / (2 * Math.tan((26 * Math.PI) / 180) * this.zoom));
      this.camera.position.set(
        this.cx + distance * 0.66,
        distance * 0.36 + 2,
        this.cz + distance * 0.66,
      );
      this.camera.lookAt(this.cx, 1.5, this.cz);
    }
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }

  updateMirrors(s) {
    if (this.mirrorSeed !== s.mirrorSeed) {
      for (const m of this.mirrors || []) {
        this.scene.remove(m.frame, m.glass);
        m.frame.geometry.dispose();
        m.frame.material.dispose();
        m.glass.geometry.dispose();
        m.reflection.dispose();
        m.mirrorMaterial.dispose();
        m.idleMaterial.dispose();
      }
      this.mirrorSeed = s.mirrorSeed;
      this.mirrors = mirrorSites(s.mirrorSeed).map((site) => {
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(3.05, 4.05, 0.2),
          new THREE.MeshStandardMaterial({ color: '#786d51', metalness: 0.5, roughness: 0.45 }),
        );
        frame.position.set(site.x, 2.17, site.z - 0.05);
        frame.castShadow = true;
        const idleMaterial = new THREE.MeshBasicNodeMaterial({ color: '#9cb5b7' });
        const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.78, 3.78), idleMaterial);
        glass.position.set(site.x, 2.17, site.z + 0.06);
        const reflection = reflector({ resolutionScale: 0.5, bounces: false, samples: 0 });
        glass.add(reflection.target);
        const mirrorMaterial = new THREE.MeshBasicNodeMaterial();
        mirrorMaterial.colorNode = reflection;
        reflection.reflector.getVirtualCamera(this.camera).layers.enable(1);
        this.scene.add(frame, glass);
        return { ...site, frame, glass, reflection, mirrorMaterial, idleMaterial };
      });
    }
    let nearest = null,
      distance = 24;
    for (const m of this.mirrors) {
      const d = Math.hypot(s.x - m.x, s.z - m.z);
      if (s.z > m.z && d < distance) {
        nearest = m;
        distance = d;
      }
    }
    for (const m of this.mirrors)
      m.glass.material = m === nearest ? m.mirrorMaterial : m.idleMaterial;
    this.activeMirror = nearest;
  }

  project(x, y, z) {
    if (!this.camera) return super.project(x, y, z);
    this.updateCamera();
    const p = this.view.set(x, y, z).project(this.camera);
    if (this.playerState?.viewMode === 'first' && (p.z > 1 || p.z < -1)) return [-100000, -100000];
    return [(p.x + 1) * this.w * 0.5, (1 - p.y) * this.h * 0.5];
  }

  unproject(x, y) {
    if (!this.camera) return super.unproject(x, y);
    this.updateCamera();
    this.ray.setFromCamera(
      new THREE.Vector2((x / this.w) * 2 - 1, 1 - (y / this.h) * 2),
      this.camera,
    );
    const hit = this.ray.ray.intersectPlane(this.ground, this.view);
    return hit ? { x: hit.x, z: hit.z } : { x: this.cx, z: this.cz };
  }

  person(n, t, crew = false) {
    if (this.reconstructing || !this.people) return super.person(n, t, crew);
    let key, design;
    if (n.id === 0) {
      key = n.player === false ? 'auditor-service' : 'auditor';
      design =
        n.player === false
          ? { ...AUDITOR, id: 'auditor-service', shirt: '#8aa4a0', outfit: 'work', prop: 'badge' }
          : AUDITOR;
    } else if (crew) {
      key = `crew-${n.id}`;
      design = SUPPORT[n.id === 80 ? 0 : 1];
    } else if (n.id >= 1 && n.id <= CAST.length) {
      key = `local-${n.id}`;
      design = CAST[n.id - 1];
    } else if (n.color === '#495a65') {
      key = `officer-${n.id}`;
      design = SUPPORT[2 + (Math.abs(n.id || 0) % 2)];
    } else {
      key = `visitor-${n.id}`;
      design = CAST[7];
    }
    if (n.id === 0 && MERCH[n.merch]) design = { ...design, shirt: MERCH[n.merch].color };
    let actor = this.people.get(key);
    if (actor && n.id === 0 && actor.merchAppearance !== (n.merch || null)) {
      this.scene.remove(actor.root);
      actor.dispose();
      this.people.delete(key);
      actor = null;
    }
    if (!actor) {
      actor = new Character(design);
      actor.merchAppearance = n.merch || null;
      this.people.set(key, actor);
      this.scene.add(actor.root);
    }
    actor.root.visible = true;
    actor.seenAt = t;
    actor.update(
      n.id === 200 && n.skin === '#303a35' ? { ...n, mask: 'cloth' } : n,
      t,
      n.id === 0 && this.playerState?.viewMode === 'first'
        ? { heading: this.playerState.lookYaw }
        : {},
    );
    if (n.id === 0)
      actor.root.traverse((object) =>
        object.layers.set(this.playerState?.viewMode === 'first' ? 1 : 0),
      );
  }

  securityStill(c, w, h, incident) {
    this.reconstructing = true;
    try {
      super.securityStill(c, w, h, incident);
    } finally {
      this.reconstructing = false;
    }
  }

  drawThree(s, dt, dpr) {
    if (this.gpuPending) return;
    const gl = this.renderer.backend.gl;
    if (this.glFence) {
      if (gl.clientWaitSync(this.glFence, 0, 0) === gl.TIMEOUT_EXPIRED) return;
      gl.deleteSync(this.glFence);
      this.glFence = null;
    }
    const size = `${this.w}:${this.h}:${dpr}:${this.quality}`;
    if (size !== this.lastSize) {
      this.renderer.setPixelRatio(Math.min(dpr, this.quality === 'cinematic' ? 1.5 : 1));
      this.renderer.setSize(this.w, this.h, false);
      this.lastSize = size;
    }
    this.updateCamera();
    this.updateMirrors(s);
    for (const actor of this.people.values()) actor.root.visible = actor.seenAt === this.time;
    this.dynamicMesh.geometry.dispose();
    this.dynamicMesh.geometry = this.geometry(this.polys.slice(this.static.length));
    const a = this.atmosphere;
    this.clockNode.value = this.time;
    this.cloudNode.value = a.cloud;
    this.densityNode.value = 0.04 + a.fog * 0.1;
    this.sun.intensity = 3.3 - a.cloud * 2.5;
    this.sun.color.set(a.warm > 0.28 ? '#ffe0b8' : '#fff0d6');
    this.fill.intensity = 0.75 + a.cloud * 0.7;
    this.scene.fog.density = 0.0015 + a.fog * 0.008;
    this.scene.fog.color.set(a.warm > 0.28 ? '#c4bba7' : a.rain > 0.3 ? '#8dabb6' : '#b8cbd1');
    this.material.roughness = 0.88 - a.rain * 0.3;
    this.sun.target.position.set(this.cx, 0, this.cz);
    this.sun.position.set(this.cx - 650, 420 - a.warm * 350, this.cz - 850);
    this.sunDirection.value.set(-65, 42 - a.warm * 35, -85).normalize();
    this.pipeline.render();
    this.lastDrawTime = this.time;
    // Bound work in flight on slow GPUs: the simulation and UI stay responsive
    // instead of queuing hundreds of expensive frames behind the device.
    const queue = this.renderer.backend.device?.queue;
    if (queue) {
      this.gpuPending = true;
      queue.onSubmittedWorkDone().then(
        () => {
          this.gpuPending = false;
        },
        () => {
          this.gpuPending = false;
        },
      );
    } else if (gl) {
      this.glFence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
    }
  }

  drawWeather(c, w, h) {
    const a = this.atmosphere;
    c.save();
    if (a.rain > 0.01) {
      c.lineWidth = 0.8;
      for (const p of a.seed) {
        const x = ((((p.x * w - a.t * 100 * p.s) % (w + 80)) + w + 80) % (w + 80)) - 40;
        const y = ((p.y * h + a.t * 390 * p.s) % (h + 80)) - 40;
        c.strokeStyle = `rgba(210,232,242,${a.rain * (0.15 + p.s * 0.2)})`;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - 5 * p.s, y + 20 * p.s);
        c.stroke();
      }
    }
    const shade = c.createRadialGradient(w * 0.5, h * 0.4, w * 0.22, w * 0.5, h * 0.5, w * 0.85);
    shade.addColorStop(0, '#17252a00');
    shade.addColorStop(1, '#17252a35');
    c.fillStyle = shade;
    c.fillRect(0, 0, w, h);
    c.restore();
  }

  captureFrame() {
    if (this.renderer && !this.gpuPending) this.pipeline.render();
    return this.canvas.toDataURL();
  }

  async drawSnapshot(c, w, h) {
    if (!this.renderer) return super.drawSnapshot(c, w, h);
    // Some WebGPU compositors corrupt direct GPU-canvas → 2D-canvas copies.
    // Encoded pixel readback avoids that path and keeps the actual 3D lighting.
    // Capture limits concurrent reads to one; ordinary play does no readback.
    if (this.renderer.backend.isWebGPUBackend) {
      const frame = new Image();
      frame.src = this.canvas.toDataURL('image/png');
      await frame.decode();
      c.drawImage(frame, 0, 0, w, h);
    } else {
      if (this.lastDrawTime !== this.time) this.pipeline.render();
      c.drawImage(this.canvas, 0, 0, w, h);
    }
  }
}
