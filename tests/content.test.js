import { describe, expect, it } from 'vitest';
import { districts, physicalDistricts } from '../src/content.js';

describe('project transit content', () => {
  it('keeps all portfolio projects available in the terminal', () => {
    expect(districts).toHaveLength(5);
    expect(districts.every((district) => district.href && district.title.zh && district.title.en)).toBe(true);
  });

  it('places all five projects on the driveable route', () => {
    expect(physicalDistricts).toHaveLength(5);
    expect(new Set(physicalDistricts.map((district) => district.id))).toEqual(
      new Set(['origin', 'scrna', 'bulk', 'medagent', 'llmpet']),
    );
    expect(physicalDistricts.every((district) => district.position.length === 2)).toBe(true);
  });
});
