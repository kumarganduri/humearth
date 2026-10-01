// One renderer, two scenes, and the dive between them (eng review 1A).
//
//   idle:    render globe scene directly
//   diving:  render both to targets during the blend window, composite with a fullscreen mix
//   landed:  render world scene directly (the globe stops rendering, the world gets the GPU)
//
// The quality tier is locked when a dive starts and never changes mid-dive (OV #6).

import {
  HalfFloatType,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { advance, diveFrame, REDUCED_MOTION_MS, ORBIT_DISTANCE, WORLD_REST, WORLD_TARGET } from './dive';
import type { GlobeScene } from './globe';
import type { WorldScene } from './world';
import type { Vec3 } from './geo';

export type Tier = 'high' | 'low';
export type StagePhase = 'earth' | 'diving' | 'world' | 'returning';

/** Pixel-ratio cap (10A): 2 on desktop, 1.5 on phones. */
export function pixelRatioCap(devicePixelRatio: number, isPhone: boolean): number {
  return Math.min(devicePixelRatio, isPhone ? 1.5 : 2);
}

const COMPOSITE_FRAG = /* glsl */ `
  uniform sampler2D tGlobe;
  uniform sampler2D tWorld;
  uniform float blend;
  varying vec2 vUv;
  void main() {
    gl_FragColor = mix(texture2D(tGlobe, vUv), texture2D(tWorld, vUv), blend);
    #include <colorspace_fragment>
  }
`;
const COMPOSITE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export interface StageOptions {
  canvas: HTMLCanvasElement;
  globe: GlobeScene;
  world: WorldScene;
  reducedMotion: () => boolean;
  isPhone: boolean;
  onPhase?: (phase: StagePhase) => void;
}

export class Stage {
  readonly renderer: WebGLRenderer;
  private globeCam = new PerspectiveCamera(32, 1, 0.05, 50);
  private worldCam = new PerspectiveCamera(30, 1, 0.1, 100);
  private rtGlobe = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
  private rtWorld = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
  private composite: ShaderMaterial;
  private quadScene = new Scene();
  private quadCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  private phase: StagePhase = 'earth';
  private t = 0; // dive progress
  private startDir: Vec3 = [0, 0.3, 1];
  private spotDir: Vec3 = [0, 0, 1];
  private lockedTier: Tier = 'high';
  private tier: Tier = 'high';
  private reducedBlend = -1; // >= 0 while a reduced-motion crossfade runs
  private lastMs = 0;
  private raf = 0;
  private paused = false;

  constructor(private o: StageOptions) {
    this.renderer = new WebGLRenderer({ canvas: o.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = SRGBColorSpace; // the one place output colour space is set (6A)
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(pixelRatioCap(window.devicePixelRatio, o.isPhone));
    this.globeCam.position.set(0, ORBIT_DISTANCE * 0.05, ORBIT_DISTANCE);
    this.globeCam.lookAt(0, 0, 0);
    this.worldCam.position.set(...WORLD_REST);
    this.worldCam.lookAt(...WORLD_TARGET);
    this.composite = new ShaderMaterial({
      uniforms: { tGlobe: { value: this.rtGlobe.texture }, tWorld: { value: this.rtWorld.texture }, blend: { value: 0 } },
      vertexShader: COMPOSITE_VERT,
      fragmentShader: COMPOSITE_FRAG,
      depthTest: false,
      depthWrite: false,
    });
    this.quadScene.add(new Mesh(new PlaneGeometry(2, 2), this.composite));
    this.resize();
    // The canvas changes size when the page layout changes (text zone hides), not only on window resize.
    new ResizeObserver(() => this.resize()).observe(o.canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? this.pause() : this.resume()));
  }

  setTier(t: Tier) {
    this.tier = t;
  }

  get currentPhase(): StagePhase {
    return this.phase;
  }

  /** Dive into the world at lat/lon. */
  dive(lat: number, lon: number) {
    if (this.phase !== 'earth') return;
    const s = this.o.globe.worldDirOf(lat, lon);
    this.spotDir = [s.x, s.y, s.z];
    const c = this.globeCam.position.clone().normalize();
    this.startDir = [c.x, c.y, c.z];
    this.lockedTier = this.tier; // OV #6: no tier switching mid-dive
    this.resizeTargets();
    this.o.world.settle();
    this.t = 0;
    this.reducedBlend = this.o.reducedMotion() ? 0 : -1;
    this.setPhase('diving');
  }

  /** Tap or Esc during the dive: jump to landed. */
  skip() {
    if (this.phase === 'diving') this.land();
    else if (this.phase === 'returning') this.backOnEarth();
  }

  back() {
    if (this.phase !== 'world') return;
    this.lockedTier = this.tier;
    this.resizeTargets();
    this.t = 1;
    this.reducedBlend = this.o.reducedMotion() ? 1 : -1;
    this.setPhase('returning');
  }

  start() {
    this.lastMs = performance.now();
    const loop = (ms: number) => {
      this.raf = requestAnimationFrame(loop);
      this.frame(ms);
    };
    this.raf = requestAnimationFrame(loop);
  }

  pause() {
    this.paused = true;
    cancelAnimationFrame(this.raf);
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.start();
  }

  private setPhase(p: StagePhase) {
    this.phase = p;
    this.o.onPhase?.(p);
  }

  private land() {
    this.t = 1;
    this.reducedBlend = -1;
    this.worldCam.position.set(...WORLD_REST);
    this.worldCam.lookAt(...WORLD_TARGET);
    this.setPhase('world');
  }

  private backOnEarth() {
    this.t = 0;
    this.reducedBlend = -1;
    const p = new Vector3(...this.startDir).multiplyScalar(ORBIT_DISTANCE);
    this.globeCam.position.copy(p);
    this.globeCam.lookAt(0, 0, 0);
    this.setPhase('earth');
  }

  private frame(ms: number) {
    const dt = Math.min((ms - this.lastMs) / 1000, 0.05);
    const elapsed = ms - this.lastMs;
    this.lastMs = ms;
    const reduced = this.o.reducedMotion();
    this.o.globe.update(dt, ms, this.phase === 'earth' && !reduced);
    this.o.world.update(dt, reduced);

    if (this.phase === 'earth') return this.renderer.render(this.o.globe.scene, this.globeCam);
    if (this.phase === 'world') return this.renderer.render(this.o.world.scene, this.worldCam);

    const dir = this.phase === 'diving' ? 1 : -1;
    let blend: number;
    let renderGlobe = true;
    let renderWorld = true;
    if (this.reducedBlend >= 0) {
      // Reduced motion: cameras hold still, a short crossfade only.
      this.reducedBlend = Math.min(1, Math.max(0, this.reducedBlend + (dir * elapsed) / REDUCED_MOTION_MS));
      blend = this.reducedBlend;
    } else {
      this.t = advance(this.t, elapsed, dir);
      const f = diveFrame(this.t, this.startDir, this.spotDir);
      this.globeCam.position.set(...f.globeCam.position);
      this.globeCam.lookAt(...f.globeCam.target);
      this.worldCam.position.set(...f.worldCam.position);
      this.worldCam.lookAt(...f.worldCam.target);
      blend = f.blend;
      renderGlobe = f.renderGlobe;
      renderWorld = f.renderWorld;
    }

    if (!renderWorld) this.renderer.render(this.o.globe.scene, this.globeCam);
    else if (!renderGlobe) this.renderer.render(this.o.world.scene, this.worldCam);
    else {
      this.renderer.setRenderTarget(this.rtGlobe);
      this.renderer.render(this.o.globe.scene, this.globeCam);
      this.renderer.setRenderTarget(this.rtWorld);
      this.renderer.render(this.o.world.scene, this.worldCam);
      this.renderer.setRenderTarget(null);
      this.composite.uniforms.blend!.value = blend;
      this.renderer.render(this.quadScene, this.quadCam);
    }

    const done = this.reducedBlend >= 0 ? (dir === 1 ? blend >= 1 : blend <= 0) : dir === 1 ? this.t >= 1 : this.t <= 0;
    if (done) (dir === 1 ? this.land() : this.backOnEarth());
  }

  private resize() {
    const c = this.o.canvas;
    const w = c.clientWidth || innerWidth;
    const h = c.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false);
    for (const cam of [this.globeCam, this.worldCam]) {
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
    this.resizeTargets();
  }

  /** Low tier renders the globe at half resolution during the blend (OV #6). */
  private resizeTargets() {
    const size = this.renderer.getDrawingBufferSize(new Vector2());
    const w = Math.max(1, Math.floor(size.x));
    const h = Math.max(1, Math.floor(size.y));
    const g = this.lockedTier === 'low' ? 0.5 : 1;
    this.rtGlobe.setSize(Math.max(1, Math.floor(w * g)), Math.max(1, Math.floor(h * g)));
    this.rtWorld.setSize(w, h);
  }
}
