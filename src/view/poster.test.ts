import { describe, expect, it } from 'vitest';
import { posterHealthFilter } from './poster';

describe('poster view', () => {
  it('a healthy world keeps full colour; a stressed one drains toward grey (goes quiet, not red)', () => {
    expect(posterHealthFilter({ co2: 1, water: 1, energy: 1 })).toBe('saturate(1.00) brightness(1.00)');
    expect(posterHealthFilter({ co2: 0.15, water: 0.15, energy: 0.15 })).toBe('saturate(0.45) brightness(0.92)');
  });
});
