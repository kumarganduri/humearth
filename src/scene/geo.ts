// Pure geometry helpers for the globe. No three.js, so they are cheap to test.

export type Vec3 = readonly [number, number, number];

/** Point on a sphere of radius r. lat/lon in degrees; +y is north, lon 0 faces +z. */
export function latLonToVec3(lat: number, lon: number, r = 1): Vec3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 90) * Math.PI) / 180;
  return [-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)];
}

/** Small, fast, seeded PRNG (mulberry32). Same seed, same world. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Temperate-forest latitude bands (both hemispheres), used for the forest biome. */
export const FOREST_BANDS: readonly [number, number][] = [
  [35, 58],
  [-48, -35],
];

/**
 * Where the dive lands: chosen from the seed inside a biome-appropriate latitude band.
 * Never the user's location (design plan: "Where the dive lands").
 */
export function seedSpot(
  seed: number,
  bands = FOREST_BANDS,
  isLand: (lat: number, lon: number) => boolean = () => true,
): { lat: number; lon: number } {
  const r = rng(seed);
  let first: { lat: number; lon: number } | null = null;
  // A forest belongs on land: redraw until the spot is land (bounded, deterministic per seed).
  for (let i = 0; i < 64; i++) {
    const band = bands[Math.floor(r() * bands.length)] ?? bands[0]!;
    const spot = { lat: band[0] + r() * (band[1] - band[0]), lon: -180 + r() * 360 };
    first ??= spot;
    if (isLand(spot.lat, spot.lon)) return spot;
  }
  return first!;
}
