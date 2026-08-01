import { describe, expect, it } from 'vitest';
import { cameraFov, engineForce, springScalar, steeringLimit } from '../src/vehicleMath.js';

describe('vehicle tuning', () => {
  it('reduces steering lock as speed rises', () => {
    expect(steeringLimit(0)).toBeGreaterThan(steeringLimit(25));
    expect(steeringLimit(25)).toBeGreaterThanOrEqual(0.24);
  });

  it('tapers engine force near the speed limit', () => {
    expect(engineForce(0, 1, false)).toBeGreaterThan(engineForce(24, 1, false));
    expect(engineForce(0, -1, false)).toBeLessThan(0);
    expect(engineForce(0, 1, true)).toBeGreaterThan(engineForce(0, 1, false));
  });

  it('adds speed-sensitive field of view without exceeding the cap', () => {
    expect(cameraFov(0)).toBe(52);
    expect(cameraFov(100)).toBe(65);
  });

  it('moves a damped spring toward its target', () => {
    const result = springScalar(0, 10, 0, 8, 0.9, 1 / 60);
    expect(result.value).toBeGreaterThan(0);
    expect(result.value).toBeLessThan(10);
    expect(result.velocity).toBeGreaterThan(0);
  });
});
