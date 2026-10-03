// World map for the Earth home (2D orthographic globe). Built from Natural Earth 1:110m via world-atlas
// (public domain), slimmed to country name + coordinates rounded to 0.1°. Deterministic, so CI can diff it.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';
import type { FeatureCollection, Geometry } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';

const require = createRequire(import.meta.url);

type Coords = number | Coords[];
const round = (c: Coords): Coords => (Array.isArray(c) ? c.map(round) : Math.round(c * 10) / 10);

export interface WorldFile {
  source: string;
  type: 'FeatureCollection';
  features: { type: 'Feature'; properties: { name: string }; geometry: Geometry }[];
}

export function buildWorld(): WorldFile {
  const topo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-110m.json'), 'utf8')) as Topology<{ countries: GeometryCollection<{ name: string }> }>;
  const fc = feature(topo, topo.objects.countries) as FeatureCollection<Geometry, { name: string }>;
  return {
    source: 'Natural Earth 1:110m via world-atlas (public domain)',
    type: 'FeatureCollection',
    features: fc.features
      .filter((f) => f.geometry)
      .map((f) => ({
        type: 'Feature' as const,
        properties: { name: f.properties.name },
        geometry: { ...f.geometry, coordinates: round((f.geometry as { coordinates: Coords }).coordinates) } as Geometry,
      })),
  };
}
