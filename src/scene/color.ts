// The only place the 3D code turns design tokens into colours (eng review 6A).
// three.js ColorManagement is on by default: a hex string is read as sRGB and stored in the
// linear working space, and the renderer converts back with outputColorSpace = SRGBColorSpace.
// (The r128 design preview needed a manual sRGB->linear step; modern three does it here.)

import { Color } from 'three';
import { colors, type ColorToken } from '../tokens';

export function sceneColor(token: ColorToken): Color {
  return new Color(colors[token]);
}

/** Healthy colour blended toward its stressed twin as health drops (1 = healthy, floor = most stressed). */
export function healthColor(healthy: ColorToken, stressed: ColorToken, health: number, out = new Color()): Color {
  return out.copy(sceneColor(stressed)).lerp(sceneColor(healthy), Math.min(1, Math.max(0, health)));
}
