// Shapes shared by the data pipeline (scripts/build-data.ts) and the footprint engine.

export type Level = 'low' | 'mid' | 'high';
export const LEVELS: readonly Level[] = ['low', 'mid', 'high'];

export type Channel = 'co2' | 'water' | 'energy';
export const CHANNELS: readonly Channel[] = ['co2', 'water', 'energy'];

export type Activity = 'text' | 'images' | 'videos';
export const ACTIVITIES: readonly Activity[] = ['text', 'images', 'videos'];

export interface Source {
  label: string;
  url: string;
  retrieved: string; // YYYY-MM-DD
  supports: string; // which of low/mid/high this source backs, comma separated
  checked?: 'page' | 'search-summary'; // read the page itself, or only a search summary (re-check)
  note?: string;
}

export interface RangeValue {
  label: string;
  unit: string;
  low: number;
  mid: number;
  high: number;
  sources: Source[];
}

export const VALUE_KEYS = [
  'textPromptWh',
  'imageWh',
  'videoClipWh',
  'onsiteWaterLPerKWh',
  'offsiteWaterLPerKWh',
  'gridGCO2PerKWh',
  'dataCentreTWhPerYear',
  'worldPopulation',
  'aiShareOfDataCentres',
] as const;
export type ValueKey = (typeof VALUE_KEYS)[number];

export interface Constants {
  constantsVersion: number;
  contentHash: string;
  builtAt: string;
  values: Record<ValueKey, RangeValue>;
}

/** An AI-building hub region, drawn as a lantern on the globe (OV #7). */
export interface Hub {
  name: string;
  country: string;
  lat: number;
  lon: number;
  mw: { low: number; mid: number; high: number };
  measure: string; // what the MW figure counts; sources measure different things
  sources: Source[];
}

export interface HubsFile {
  contentHash: string;
  builtAt: string;
  hubs: Hub[];
}

/** What the calculator asks (eng review D8): plain counts, as the sliders show them. */
export interface Usage {
  questionsPerDay: number;
  picturesPerWeek: number;
  videosPerWeek: number;
}
