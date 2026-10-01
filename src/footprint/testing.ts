// Test helper: the real sourced constants, built in memory exactly as the pipeline builds them.
import { readFileSync } from 'node:fs';
import { buildConstants } from '../../scripts/lib/build';
import type { Constants } from './types';

export function readSource(): unknown {
  return JSON.parse(readFileSync('data/sources/constants.source.json', 'utf8'));
}

export function readMapping(): unknown {
  return JSON.parse(readFileSync('data/sources/mapping.json', 'utf8'));
}

export function realConstants(): Constants {
  return buildConstants(readSource(), readMapping(), null, '2026-10-02').constants;
}
