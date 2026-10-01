// Where the painted globe shows land. No three.js here: the controller uses it on the first screen,
// and the globe uses the same function to paint, so a forest never lands in the sea.

import { latLonToVec3 } from './geo';

/** Cheap smooth noise on the sphere; decides land, water, forest and ice per face. */
export function surfaceNoise(x: number, y: number, z: number): number {
  return Math.sin(3.1 * x + 1.7 * y) * 0.5 + Math.sin(2.3 * y - 2.9 * z) * 0.35 + Math.sin(4.7 * z + 1.3 * x) * 0.25;
}

export const LAND_LEVEL = 0.02;

/** True where the painted globe shows land, a little inland from the shore faces. */
export function isLand(lat: number, lon: number): boolean {
  const [x, y, z] = latLonToVec3(lat, lon, 1);
  return surfaceNoise(x, y, z) > LAND_LEVEL + 0.06;
}
