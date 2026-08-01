import { describe, expect, it } from 'vitest';
import { districts, physicalDistricts } from '../src/content.js';

describe('project transit content', () => {
  it('keeps all portfolio projects available in the terminal', () => {
    expect(districts).toHaveLength(5);
    expect(districts.every((district) => district.href && district.title.zh && district.title.en)).toBe(true);
  });

  it('limits the authored world to the hub and featured lab', () => {
    expect(physicalDistricts.map((district) => district.id)).toEqual(['origin', 'scrna']);
  });
});
