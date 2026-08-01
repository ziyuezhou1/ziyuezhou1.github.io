import { describe, expect, it } from 'vitest';
import {
  BUILDING_SIZE_FACTOR,
  CIRCUIT_CHECKPOINTS,
  CIRCUIT_PATH,
  EXPLORATION_ROUTE,
  modelTargetSize,
} from '../src/world.js';

describe('miniature city layout', () => {
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

  it('separates an organic exploration road from an eight-gate closed circuit', () => {
    expect(EXPLORATION_ROUTE.length).toBeGreaterThan(8);
    expect(CIRCUIT_CHECKPOINTS).toHaveLength(8);
    expect(CIRCUIT_PATH[0]).toEqual(CIRCUIT_PATH.at(-1));
    expect(CIRCUIT_CHECKPOINTS.every((gate) => gate.normal.length === 2)).toBe(true);
  });
});
