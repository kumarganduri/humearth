// The toy globe on a sunny windowsill (DESIGN.md): a hand-painted low-poly Earth, a brass meridian
// ring, a wooden stand, and warm lanterns at the AI-building hubs (OV #7).

import {
  BoxGeometry,
  CanvasTexture,
  ConeGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  TorusGeometry,
  Vector3,
} from 'three';
import { colors } from '../tokens';
import { sceneColor } from './color';
import { latLonToVec3, rng } from './geo';
import type { Hub } from '../footprint/types';

export const GLOBE_TILT = 0.41; // about 23.4 degrees
const IDLE_SPIN = 0.12; // rad/s (DESIGN.md motion)

export interface GlobeScene {
  scene: Scene;
  /** Unit direction (world space) of a lat/lon on the globe, with the current spin applied. */
  worldDirOf(lat: number, lon: number): Vector3;
  /** Move your plot to a spot, or hide it (null) when there is no world yet. */
  setPlot(spot: { lat: number; lon: number } | null): void;
  update(dtSeconds: number, timeMs: number, spinning: boolean): void;
}

/** Dawn sky gradient as a scene background, so the globe scene can be rendered into a target. */
export function skyTexture(top: string, bottom: string): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 2;
  c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  g.fillStyle = grad;
  g.fillRect(0, 0, 2, 256);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** Cheap smooth noise on the sphere; decides land, water, forest and ice per face. */
function surfaceNoise(x: number, y: number, z: number): number {
  return Math.sin(3.1 * x + 1.7 * y) * 0.5 + Math.sin(2.3 * y - 2.9 * z) * 0.35 + Math.sin(4.7 * z + 1.3 * x) * 0.25;
}

const LAND_LEVEL = 0.02;

/** True where the painted globe shows land (same noise as the paint), so a forest never lands in the sea. */
export function isLand(lat: number, lon: number): boolean {
  const [x, y, z] = latLonToVec3(lat, lon, 1);
  return surfaceNoise(x, y, z) > LAND_LEVEL + 0.06; // a little inland, away from the shore faces
}

function paintedEarth(seed: number): Mesh {
  const geo = new IcosahedronGeometry(1, 4).toNonIndexed();
  const pos = geo.attributes.position!;
  const r = rng(seed);
  const water = sceneColor('water');
  const shallows = sceneColor('shallows');
  const land = sceneColor('land');
  const foliage = sceneColor('foliage');
  const snow = sceneColor('snow');
  const cols: number[] = [];
  const c = new Color();
  for (let i = 0; i < pos.count; i += 3) {
    const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
    const cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
    const cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
    const v = surfaceNoise(cx, cy, cz);
    c.copy(v > LAND_LEVEL ? (Math.abs(cy) > 0.88 ? snow : v > 0.3 ? foliage : land) : v > -0.08 ? shallows : water);
    c.offsetHSL(0, 0, (r() - 0.5) * 0.035); // hand-painted unevenness per face
    for (let k = 0; k < 3; k++) cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new Float32BufferAttribute(cols, 3));
  const mesh = new Mesh(geo, new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92 }));
  mesh.castShadow = true;
  return mesh;
}

/** Lantern size grows with the hub's mid MW on a log scale, so Northern Virginia doesn't swallow the map. */
export function lanternScale(mwMid: number): number {
  return 0.6 + 0.5 * Math.log10(Math.max(mwMid, 100) / 100);
}

function lanterns(hubs: Hub[]): InstancedMesh {
  const mat = new MeshStandardMaterial({
    color: sceneColor('accent'),
    emissive: sceneColor('accent-ember'),
    emissiveIntensity: 0.5,
    roughness: 0.6,
  });
  const mesh = new InstancedMesh(new BoxGeometry(0.05, 0.05, 0.075), mat, hubs.length);
  const o = new Object3D();
  hubs.forEach((h, i) => {
    const [x, y, z] = latLonToVec3(h.lat, h.lon, 1.02);
    o.position.set(x, y, z);
    o.lookAt(0, 0, 0);
    o.scale.setScalar(lanternScale(h.mw.mid));
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

/** Your plot on the globe: a tiny clay disc with trees, so you can see your world as you dive toward it. */
function seedPlot(): Group {
  const g = new Group();
  const disc = new Mesh(
    new CylinderGeometry(0.035, 0.03, 0.012, 10),
    new MeshStandardMaterial({ color: sceneColor('land'), flatShading: true, roughness: 0.95 }),
  );
  g.add(disc);
  const leaf = new MeshStandardMaterial({ color: sceneColor('foliage'), flatShading: true });
  for (let i = 0; i < 5; i++) {
    const tree = new Mesh(new ConeGeometry(0.007, 0.02, 6), leaf);
    const a = (i / 5) * Math.PI * 2;
    tree.position.set(Math.cos(a) * 0.018, 0.016, Math.sin(a) * 0.018);
    g.add(tree);
  }
  return g;
}

function placePlot(g: Group, lat: number, lon: number) {
  const [x, y, z] = latLonToVec3(lat, lon, 1.004);
  g.position.set(x, y, z);
  g.rotation.set(0, 0, 0);
  g.lookAt(x * 2, y * 2, z * 2); // face outward (parent is unrotated in its own frame)
  g.rotateX(Math.PI / 2); // disc axis along the surface normal
}

export function buildGlobe(hubs: Hub[], seed = 7): GlobeScene {
  const scene = new Scene();
  scene.background = skyTexture(colors['sky-dawn'], colors['sky-horizon']);
  scene.add(new HemisphereLight(0xfff3e0, 0xc9a07a, 1.1));
  const sun = new DirectionalLight(0xffe2bf, 2.2);
  sun.position.set(-4, 5, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); // single 1024 shadow map (10A)
  scene.add(sun);

  const tilt = new Group();
  tilt.rotation.z = GLOBE_TILT;
  const spin = new Group();
  const earth = paintedEarth(seed);
  const hubLights = lanterns(hubs);
  const plot = seedPlot();
  plot.visible = false;
  spin.add(earth, hubLights, plot);
  tilt.add(spin);

  const brass = new MeshStandardMaterial({ color: sceneColor('brass'), metalness: 0.55, roughness: 0.35 });
  const ring = new Mesh(new TorusGeometry(1.14, 0.025, 10, 80, Math.PI * 1.25), brass);
  ring.rotation.z = Math.PI * 0.5 - Math.PI * 0.625;
  tilt.add(ring);
  scene.add(tilt);

  const wood = new MeshStandardMaterial({ color: sceneColor('wood'), roughness: 0.8, flatShading: true });
  const stem = new Mesh(new CylinderGeometry(0.035, 0.05, 0.5, 8), wood);
  stem.position.y = -1.37;
  const base = new Mesh(new CylinderGeometry(0.42, 0.5, 0.14, 10), wood);
  base.position.y = -1.64;
  stem.castShadow = base.castShadow = true;
  const ground = new Mesh(new PlaneGeometry(20, 20), new ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.71;
  ground.receiveShadow = true;
  scene.add(stem, base, ground);

  const m = new Matrix4();
  return {
    scene,
    worldDirOf(lat, lon) {
      spin.updateWorldMatrix(true, false);
      m.extractRotation(spin.matrixWorld);
      const [x, y, z] = latLonToVec3(lat, lon, 1);
      return new Vector3(x, y, z).applyMatrix4(m).normalize();
    },
    setPlot(spot) {
      plot.visible = spot !== null;
      if (spot) placePlot(plot, spot.lat, spot.lon);
    },
    update(dt, timeMs, spinning) {
      if (spinning) spin.rotation.y += dt * IDLE_SPIN;
      mat(hubLights).emissiveIntensity = 0.5 + 0.12 * Math.sin(timeMs / 900);
    },
  };
}

const mat = (m: InstancedMesh) => m.material as MeshStandardMaterial;
