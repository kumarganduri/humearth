// Your world: a clay diorama on a round plot (DESIGN.md). Health drives what a kid sees:
//   air   (co2)    -> leaf colour, sky haze, how many trees are in leaf
//   water          -> river colour and level
//   power (energy) -> sunlight warmth
//   animals        -> birds present, some hiding, or hiding (never dead)
// Stress goes quiet, not red: colours drain toward the dusty `-stressed` tokens.

import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Scene,
  TetrahedronGeometry,
} from 'three';
import { healthColor, sceneColor } from './color';
import { rng } from './geo';
import type { AnimalState } from '../footprint/engine';
import type { Channel } from '../footprint/types';

const TREE_COUNT = 18;
const BIRD_COUNT = 3;
const STOP_MOTION_FPS = 12; // creatures step like stop-motion; the camera stays smooth
const EASE_RATE = 2.5; // exponential ease: ~95% of the way in 1.2 s, the DESIGN.md bloom/wilt time

export interface WorldScene {
  scene: Scene;
  setHealth(health: Record<Channel, number>, animals: AnimalState): void;
  /** Jump straight to the target look (reduced motion, first paint). */
  settle(): void;
  update(dtSeconds: number, reducedMotion: boolean): void;
}

export function buildWorld(seed: number): WorldScene {
  const r = rng(seed);
  const scene = new Scene();
  const sky = sceneColor('sky-dawn');
  scene.background = sky;

  const hemi = new HemisphereLight(0xfff3e0, 0xc9a07a, 1.0);
  const sun = new DirectionalLight(0xffe2bf, 2.0);
  sun.position.set(-3, 6, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(hemi, sun);

  const landMat = new MeshStandardMaterial({ color: sceneColor('land'), flatShading: true, roughness: 0.95 });
  const sideMat = new MeshStandardMaterial({ color: sceneColor('land-shadow'), flatShading: true, roughness: 0.95 });
  const plot = new Mesh(new CylinderGeometry(2.6, 2.4, 0.5, 14), [sideMat, landMat, sideMat]);
  plot.receiveShadow = true;
  scene.add(plot);

  const waterMat = new MeshStandardMaterial({ color: sceneColor('water'), flatShading: true, roughness: 0.4 });
  const river = new Mesh(new BoxGeometry(5.0, 0.06, 0.62), waterMat);
  river.position.set(0, 0.27, 0.35);
  river.rotation.y = 0.35;
  scene.add(river);

  // Trees: one instanced mesh for crowns and one for trunks (10A: one draw call per kind).
  // White base: per-tree instance colours carry the palette (instance colour multiplies material colour).
  const leafMat = new MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.9 });
  const trunkMat = new MeshStandardMaterial({ color: sceneColor('wood'), flatShading: true });
  const crowns = new InstancedMesh(new ConeGeometry(0.32, 0.8, 7), leafMat, TREE_COUNT);
  const trunks = new InstancedMesh(new CylinderGeometry(0.05, 0.07, 0.35, 6), trunkMat, TREE_COUNT);
  crowns.castShadow = true;
  const o = new Object3D();
  for (let i = 0; i < TREE_COUNT; i++) {
    // Scatter on the plot, away from the river band.
    let x = 0;
    let z = 0;
    for (let tries = 0; tries < 20; tries++) {
      const a = r() * Math.PI * 2;
      const d = 0.4 + Math.sqrt(r()) * 1.9;
      x = Math.cos(a) * d;
      z = Math.sin(a) * d;
      const distToRiver = Math.abs(-Math.sin(0.35) * x + Math.cos(0.35) * (z - 0.35));
      if (distToRiver > 0.55) break;
    }
    const s = 0.65 + r() * 0.35;
    o.position.set(x, 0.95 * s, z);
    o.scale.setScalar(s);
    o.rotation.y = r() * Math.PI;
    o.updateMatrix();
    crowns.setMatrixAt(i, o.matrix);
    o.position.y = 0.42 * s;
    o.updateMatrix();
    trunks.setMatrixAt(i, o.matrix);
  }
  scene.add(crowns, trunks);

  const birdMat = new MeshStandardMaterial({ color: sceneColor('primary'), flatShading: true });
  const birds = new Group();
  for (let i = 0; i < BIRD_COUNT; i++) {
    const b = new Mesh(new TetrahedronGeometry(0.1), birdMat);
    b.position.set(-0.8 + i * 0.7, 1.45 + r() * 0.3, -0.4 + r() * 0.8);
    birds.add(b);
  }
  scene.add(birds);

  // Targets and current values; colours ease toward the targets.
  const target = { co2: 1, water: 1, energy: 1, animals: 'present' as AnimalState };
  const cur = { co2: 1, water: 1, energy: 1 };
  const tmp = new Color();
  let stepAcc = 0;
  let t = 0;

  function apply() {
    for (let i = 0; i < TREE_COUNT; i++) crowns.setColorAt(i, healthColor(i % 2 ? 'foliage' : 'foliage-highlight', 'foliage-stressed', cur.co2, tmp));
    crowns.instanceColor!.needsUpdate = true;
    healthColor('land', 'land-stressed', (cur.co2 + cur.water) / 2, landMat.color);
    healthColor('water', 'water-stressed', cur.water, waterMat.color);
    healthColor('sky-dawn', 'sky-stressed', cur.co2, sky);
    river.scale.y = 0.4 + 0.6 * cur.water; // the river runs lower
    river.position.y = 0.25 + 0.02 * cur.water;
    sun.intensity = 1.2 + 0.8 * cur.energy;
    sun.color.set(0xffe2bf).lerp(sceneColor('sky-stressed'), 1 - cur.energy);
    // Trees out of leaf as air health drops (never all of them).
    // Trees only drop leaves once air health is below "great" (0.8), and never all of them.
    const leafy = cur.co2 >= 0.8 ? 1 : 0.45 + 0.55 * (cur.co2 / 0.8);
    crowns.count = Math.max(Math.ceil(TREE_COUNT * 0.45), Math.round(TREE_COUNT * leafy));
  }

  function applyAnimals() {
    const visible = target.animals === 'present' ? BIRD_COUNT : target.animals === 'some-hiding' ? 1 : 0;
    birds.children.forEach((b, i) => (b.visible = i < visible));
  }

  return {
    scene,
    setHealth(h, animals) {
      target.co2 = h.co2;
      target.water = h.water;
      target.energy = h.energy;
      target.animals = animals;
      applyAnimals();
    },
    settle() {
      cur.co2 = target.co2;
      cur.water = target.water;
      cur.energy = target.energy;
      apply();
    },
    update(dt, reducedMotion) {
      const k = 1 - Math.exp(-dt * EASE_RATE);
      for (const ch of ['co2', 'water', 'energy'] as const) cur[ch] += (target[ch] - cur[ch]) * k;
      apply();
      if (reducedMotion) return;
      t += dt;
      stepAcc += dt;
      if (stepAcc >= 1 / STOP_MOTION_FPS) {
        stepAcc = 0;
        birds.children.forEach((b, i) => {
          b.position.x = -0.8 + i * 0.7 + Math.sin(t * 1.4 + i) * 0.25;
          b.rotation.y += 0.3;
        });
      }
    },
  };
}
