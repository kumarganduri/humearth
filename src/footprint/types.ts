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
] as const;
export type ValueKey = (typeof VALUE_KEYS)[number];

export interface QuizTable {
  textPromptsPerDay: number[]; // index = bucket 0..3
  imagesPerWeek: number[]; // index = bucket 0..2
  videosPerWeek: number[]; // index = bucket 0..2
}

export interface Comparisons {
  glassMl: number;
  bathtubL: number;
  fridgeWatts: number;
  balloonGCO2: number;
}

/** The health mapping is a designed scale, not a measurement (eng review OV #1). Published on How We Know. */
export interface Mapping {
  k: number;
  floor: number; // health never drops below this
  derivedOn: string;
  note: string;
}

export interface Constants {
  constantsVersion: number;
  contentHash: string;
  builtAt: string;
  values: Record<ValueKey, RangeValue>;
  quiz: QuizTable;
  comparisons: Comparisons;
  mapping: Mapping;
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

/** Quiz answers. Only these coarse buckets are ever stored or shared. */
export interface Buckets {
  text: 0 | 1 | 2 | 3;
  images: 0 | 1 | 2;
  videos: 0 | 1 | 2;
}

/** Greener choices ("my plan"), decision 9A. */
export interface Plan {
  fewerPictures: boolean;
  fewerVideos: boolean;
  lighterAi: boolean;
}

export const NO_PLAN: Plan = { fewerPictures: false, fewerVideos: false, lighterAi: false };
