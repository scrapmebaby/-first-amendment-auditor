import * as THREE from 'three/webgpu';
import { Character, ALL_CHARACTERS } from './characters.js';

// A close-up of the same rigs used in town, not concept art standing in for models.
export class CastStudio {
  constructor(canvas, onChange) {
    this.canvas = canvas;
    this.onChange = onChange;
    this.index = 0;
    this.yaw = 0.12;
    this.pose = 'idle';
    this.closeup = false;
    this.closed = false;
    this.events = new AbortController();
  }
  async init(index = 0) {
    const context = this.canvas.getContext('webgl2', { antialias: true });
    if (!context) throw new Error('WebGL 2 is unavailable.');
    this.renderer = new THREE.WebGPURenderer({
      canvas: this.canvas,
      context,
      antialias: true,
      forceWebGL: true,
    });
    await this.renderer.init();
    this.ready = true;
    if (this.closed) {
      this.renderer.dispose();
      return;
    }
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#ddd8c9');
    this.camera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 30);
    this.scene.add(new THREE.HemisphereLight('#e5e8e0', '#7e7865', 2.0));
    const key = new THREE.DirectionalLight('#fff0d6', 3.1);
    key.position.set(-3, 6, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, {
      left: -3,
      right: 3,
      top: 5,
      bottom: -3,
      near: 0.1,
      far: 20,
    });
    key.shadow.normalBias = 0.025;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight('#bed4db', 1.6);
    rim.position.set(4, 3, -3);
    this.scene.add(rim);
    this.floor = new THREE.Mesh(
      new THREE.CylinderGeometry(1.22, 1.28, 0.1, 48),
      new THREE.MeshStandardMaterial({ color: '#c3baa4', roughness: 1 }),
    );
    this.floor.position.y = -0.065;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);
    this.setCharacter(index);
    let drag = null;
    const opt = { signal: this.events.signal };
    this.canvas.addEventListener(
      'pointerdown',
      (e) => {
        drag = e.clientX;
        this.canvas.setPointerCapture(e.pointerId);
      },
      opt,
    );
    this.canvas.addEventListener(
      'pointermove',
      (e) => {
        if (drag !== null) {
          this.yaw += (e.clientX - drag) * 0.012;
          drag = e.clientX;
        }
      },
      opt,
    );
    this.canvas.addEventListener('pointerup', () => (drag = null), opt);
    this.canvas.addEventListener('pointercancel', () => (drag = null), opt);
    this.canvas.addEventListener(
      'keydown',
      (e) => {
        if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          this.yaw += e.key === 'ArrowLeft' ? -0.3 : 0.3;
        }
      },
      opt,
    );
    this.start = performance.now();
    this.frame();
  }
  setCharacter(index) {
    this.index = (index + ALL_CHARACTERS.length) % ALL_CHARACTERS.length;
    if (this.actor) {
      this.scene.remove(this.actor.root);
      this.actor.dispose();
    }
    this.actor = new Character(ALL_CHARACTERS[this.index]);
    this.scene.add(this.actor.root);
    this.yaw = 0.12;
    this.onChange(ALL_CHARACTERS[this.index], this.index);
  }
  frame() {
    if (this.closed) return;
    const gl = this.renderer.backend.gl;
    if (!this.fence || gl.clientWaitSync(this.fence, 0, 0) !== gl.TIMEOUT_EXPIRED) {
      if (this.fence) {
        gl.deleteSync(this.fence);
        this.fence = null;
      }
      const { width, height } = this.canvas.getBoundingClientRect();
      if (width > 0 && height > 0) {
        if (this.width !== width || this.height !== height) {
          this.width = width;
          this.height = height;
          this.renderer.setSize(width, height, false);
        }
        const half = this.closeup ? 0.82 : 1.96,
          aspect = width / height;
        Object.assign(this.camera, {
          left: -half * aspect,
          right: half * aspect,
          top: half,
          bottom: -half,
        });
        const target = this.closeup
          ? 2.48 * this.actor.design.height
          : 1.48 * this.actor.design.height;
        this.camera.position.set(3.2, target + 1.05, 6);
        this.camera.lookAt(0, target, 0);
        this.camera.updateProjectionMatrix();
        const t = (performance.now() - this.start) / 1000;
        this.actor.update(
          { x: 0, z: 0, moving: this.pose === 'walk', emotion: this.pose, player: true },
          t,
          { gallery: true, heading: this.yaw },
        );
        this.renderer.render(this.scene, this.camera);
        this.fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
      }
    }
    this.raf = requestAnimationFrame(() => this.frame());
  }
  snapshot() {
    this.actor.update(
      { x: 0, z: 0, moving: this.pose === 'walk', emotion: this.pose, player: true },
      (performance.now() - this.start) / 1000,
      { gallery: true, heading: this.yaw },
    );
    this.renderer.render(this.scene, this.camera);
    return this.canvas.toDataURL();
  }
  dispose() {
    this.closed = true;
    cancelAnimationFrame(this.raf);
    this.events.abort();
    this.actor?.dispose();
    this.floor?.geometry.dispose();
    this.floor?.material.dispose();
    if (this.renderer && this.ready) {
      if (this.fence) this.renderer.backend.gl?.deleteSync(this.fence);
      this.renderer.dispose();
    }
  }
}
