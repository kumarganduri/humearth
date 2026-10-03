// Shapes for the v2 time series (data-centre electricity and CO2 by year) and the country table.
//
//   data/sources/series.source.json     only what a source actually published (+ a back-fill rate)
//        │  scripts/lib/series.ts buildSeries()
//        ▼
//   public/data/series.json             every year firstYear..lastYear; each low/mid/high says whether it was
//                                       published, derived by a stated rule, or not available ("none")
//
//   data/sources/countries.source.json  rows taken from a named dataset file (checked: 'dataset', sha256)

import type { Source } from './types';

export const METRIC_KEYS = ['electricity', 'co2'] as const;
export type MetricKey = (typeof METRIC_KEYS)[number];

/** A figure a source actually published. low/high null = that edge was not published (never filled in). */
export interface PublishedPoint {
  year: number;
  /** 'measured' = already happened; 'forecast' = a projection. Forecasts are drawn dim (DESIGN.md). */
  estimate: 'measured' | 'forecast';
  low: number | null;
  mid: number;
  high: number | null;
  sources: Source[];
}

export interface MetricSource {
  label: string;
  unit: string;
  points: PublishedPoint[];
  /** Years before the first point, back-calculated at a published growth rate (drawn dashed). */
  backfill?: { rate: number; sources: Source[] };
}

export interface SeriesSource {
  firstYear: number;
  lastYear: number;
  metrics: Record<MetricKey, MetricSource>;
}

export type ValueKind = 'published' | 'derived' | 'none';
export interface SeriesValue {
  value: number | null;
  kind: ValueKind;
}

export interface SeriesYear {
  year: number;
  /** 'past' up to the latest measured year, 'future' after it. */
  phase: 'past' | 'future';
  low: SeriesValue;
  mid: SeriesValue;
  high: SeriesValue;
  /** Plain words: how this year's numbers were obtained. */
  rule: string;
}

export interface MetricSeries {
  label: string;
  unit: string;
  latestMeasuredYear: number;
  years: SeriesYear[];
  sources: Source[];
}

export interface SeriesFile {
  contentHash: string;
  builtAt: string;
  firstYear: number;
  lastYear: number;
  metrics: Record<MetricKey, MetricSeries>;
}

/** A number copied from a named dataset file rather than quoted from a page (eng review D3). */
export interface DatasetRef {
  name: string;
  page: string;
  url: string;
  retrieved: string;
  sha256: string;
  licence: string;
  checked: 'dataset';
  filter: { areaColumn: string; yearColumn: string; sourceColumn: string; sourceValue: string; valueColumn: string };
}

export interface CountryRow {
  name: string;
  demandTWh: number;
}

export interface CountriesSource {
  dataset: DatasetRef;
  year: number;
  unit: string;
  countries: CountryRow[];
}

export interface CountriesFile extends CountriesSource {
  contentHash: string;
  builtAt: string;
}
