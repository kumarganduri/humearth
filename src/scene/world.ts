// Your world: a clay diorama on a round plot (DESIGN.md). Health drives what a kid sees:
//   air   (co2)    -> leaf colour, sky haze, how many trees are in leaf
//   water          -> river colour and level
//   power (energy) -> sunlight warmth
//   animals        -> birds present, some hiding, or hiding (never dead)
// Stress goes quiet, not red: colours drain toward the dusty `-stressed` tokens. Trees out of leaf
// show bare winter branches (not stumps). Greener choices are objects on the plot's front edge (9A).

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
  Raycaster,
  Scene,
  SphereGeometry,
  TetrahedronGeometry,
  TorusGeometry,
  Vector2,
  type BufferGeometry,
  type Camera,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { healthColor, sceneColor } from './color';
import { rng } from './geo';
import type { AnimalState } from '../footprint/engine';
import type { Channel, Plan } from '../footprint/types';

export type ChoiceKey = keyof Plan;

const TREE_COUNT = 18;
// Greener-choice objects sit on the front-right rim; trees keep clear of them so nothing hides them.
const CHOICE_RADIUS = 2.2;
const CHOICE_ANGLES = [0.88, 1.15, 1.42];
const CHOICE_SPOTS = CHOICE_ANGLES.map((a) => [Math.cos(a) * CHOICE_RADIUS, Math.sin(a) * CHOICE_RADIUS] as const);
const BIRD_COUNT = 3;
const STOP_MOTION_FPS = 12; // creatures step like stop-motion; the camera stays smooth
const EASE_RATE = 2.5; // exponential ease: ~95% of the way in 1.2 s, the DESIGN.md bloom/wilt time

export interface WorldScene {
  scene: Scene;
  setHealth(health: Record<Channel, number>, animals: AnimalState): void;
  /** Jump straight to the target look (reduced motion, first paint). */
  settle(): void;
  update(dtSeconds: number, reducedMotion: boolean): void;
  /** Show which greener choices are on (lifted and glowing), or hide them (friend worlds). */
  setChoices(plan: Plan | null): void;
  /** Which greener-choice object is under a point (normalised device coords), if any. */
  pickChoice(ndc: { x: number; y: number }, camera: Camera): ChoiceKey | null;
}

/** A bare winter crown: a few thin branches, so a tree out of leaf never reads as a stump. */
function bareCrownGeometry(): BufferGeometry {
  const parts: BufferGeometry[] = [];
  const stem = new CylinderGeometry(0.018, 0.03, 0.62, 5);
  stem.translate(0, 0.31, 0);
  parts.push(stem);
  for (const [angle, tilt, h, len] of [
    [0, 0.6, 0.18, 0.3],
    [2.1, 0.7, 0.3, 0.26],
    [4.2, 0.55, 0.42, 0.22],
  ] as const) {
    const b = new CylinderGeometry(0.008, 0.016, len, 4);
    b.translate(0, len / 2, 0);
    b.rotateZ(tilt);
    b.rotateY(angle);
    b.translate(0, h, 0);
    parts.push(b);
  }
  return mergeGeometries(parts)!;
}

/** Low-poly clay objects for the greener choices. */
function choiceObject(key: ChoiceKey): Group {
  const g = new Group();
  const clay = (token: Parameters<typeof sceneColor>[0]) => new MeshStandardMaterial({ color: sceneColor(token), flatShading: true, roughness: 0.85 });
  if (key === 'fewerPictures') {
    // Paintbrush: wooden handle, brass band, paint-tipped bristles.
    const handle = new Mesh(new CylinderGeometry(0.03, 0.035, 0.42, 6), clay('wood'));
    const band = new Mesh(new CylinderGeometry(0.04, 0.04, 0.06, 6), clay('brass'));
    band.position.y = 0.24;
    const tip = new Mesh(new ConeGeometry(0.045, 0.12, 6), clay('primary'));
    tip.position.y = 0.33;
    g.add(handle, band, tip);
    g.rotation.z = 0.9; // lean left, toward the middle of the plot
  } else if (key === 'fewerVideos') {
    // Film reel: a disc with a hub, standing on its edge.
    const reel = new Mesh(new TorusGeometry(0.12, 0.035, 6, 12), clay('text-muted'));
    const hub = new Mesh(new CylinderGeometry(0.04, 0.04, 0.05, 8), clay('brass'));
    hub.rotation.x = Math.PI / 2;
    g.add(reel, hub);
    g.position.y = 0.06;
  } else {
    // Feather: a long, flattened leaf shape.
    const vane = new Mesh(new SphereGeometry(0.1, 6, 4), clay('surface'));
    vane.scale.set(0.45, 1.6, 0.12);
    const quill = new Mesh(new CylinderGeometry(0.008, 0.012, 0.36, 4), clay('brass'));
    g.add(vane, quill);
    g.rotation.z = 0.7;
  }
  g.traverse((o) => ((o as Mesh).castShadow = true));
  return g;
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
      const nearChoice = CHOICE_SPOTS.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < 0.75);
      if (distToRiver > 0.55 && !nearChoice) break;
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

  // Bare crowns for the trees currently out of leaf (instances map to the last trees by index).
  const bareMat = new MeshStandardMaterial({ color: sceneColor('wood'), flatShading: true, roughness: 0.9 });
  const bare = new InstancedMesh(bareCrownGeometry(), bareMat, TREE_COUNT);
  bare.castShadow = true;
  const bareMatrices = Array.from({ length: TREE_COUNT }, (_, i) => {
    const m = new Object3D();
    const crown = new Object3D();
    crowns.getMatrixAt(i, crown.matrix);
    crown.matrix.decompose(crown.position, crown.quaternion, crown.scale);
    m.position.set(crown.position.x, crown.position.y * (0.55 / 0.95), crown.position.z);
    m.quaternion.copy(crown.quaternion);
    m.scale.copy(crown.scale);
    m.updateMatrix();
    return m.matrix.clone();
  });
  bare.count = 0;
  scene.add(bare);

  // Greener choices on the plot's front edge (9A). They lift and glow when on.
  const CHOICES: ChoiceKey[] = ['fewerPictures', 'fewerVideos', 'lighterAi'];
  const choiceGroup = new Group();
  const choiceObjs = new Map<ChoiceKey, Group>();
  CHOICES.forEach((key, i) => {
    const holder = new Group();
    const obj = choiceObject(key);
    obj.userData.choice = key;
    obj.traverse((o) => (o.userData.choice = key));
    holder.add(obj);
    // Front-right of the rim: clear of the sentence card (bottom-left) and the corner buttons.
    const a = CHOICE_ANGLES[i]!;
    holder.position.set(Math.cos(a) * CHOICE_RADIUS, 0.36, Math.sin(a) * CHOICE_RADIUS);
    holder.scale.setScalar(1.4);
    choiceGroup.add(holder);
    choiceObjs.set(key, holder);
  });
  scene.add(choiceGroup);
  const choiceOn = new Map<ChoiceKey, boolean>(CHOICES.map((k) => [k, false]));
  const glow = sceneColor('foliage-highlight').multiplyScalar(0.35);
  const raycaster = new Raycaster();
  const ndcVec = new Vector2();

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
    if (bare.count !== TREE_COUNT - crowns.count) {
      bare.count = TREE_COUNT - crowns.count;
      for (let j = 0; j < bare.count; j++) bare.setMatrixAt(j, bareMatrices[crowns.count + j]!);
      bare.instanceMatrix.needsUpdate = true;
    }
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
    setChoices(plan) {
      choiceGroup.visible = plan !== null;
      if (plan) for (const k of CHOICES) choiceOn.set(k, plan[k]);
    },
    pickChoice(ndc, camera) {
      if (!choiceGroup.visible) return null;
      raycaster.setFromCamera(ndcVec.set(ndc.x, ndc.y), camera);
      const hit = raycaster.intersectObject(choiceGroup, true)[0];
      return (hit?.object.userData.choice as ChoiceKey | undefined) ?? null;
    },
    update(dt, reducedMotion) {
      const k = 1 - Math.exp(-dt * EASE_RATE);
      for (const ch of ['co2', 'water', 'energy'] as const) cur[ch] += (target[ch] - cur[ch]) * k;
      apply();
      // Choices ease up and glow when on.
      for (const [key, holder] of choiceObjs) {
        const on = choiceOn.get(key)!;
        holder.position.y += ((on ? 0.5 : 0.36) - holder.position.y) * k;
        holder.traverse((o) => {
          const m = (o as Mesh).material as MeshStandardMaterial | undefined;
          if (m?.emissive) (on ? m.emissive.copy(glow) : m.emissive.setRGB(0, 0, 0));
        });
      }
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
