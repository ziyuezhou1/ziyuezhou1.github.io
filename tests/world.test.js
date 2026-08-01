import { describe, expect, it } from 'vitest';
import { BUILDING_SIZE_FACTOR, modelTargetSize } from '../src/world.js';

describe('miniature city building scale', () => {
  it('renders houses and the garage at half their authored scene size', () => {
    expect(BUILDING_SIZE_FACTOR).toBe(0.5);
    expect(modelTargetSize('buildingA', 8)).toBe(4);
    expect(modelTargetSize('buildingD', 7)).toBe(3.5);
    expect(modelTargetSize('garage', 8)).toBe(4);
  });

  it('leaves roads, trees, props, and vehicles at their current scale', () => {
    expect(modelTargetSize('trackStraight', 10)).toBe(10);
    expect(modelTargetSize('treesTall', 7)).toBe(7);
    expect(modelTargetSize('carRed', 3.25)).toBe(3.25);
  });
});
