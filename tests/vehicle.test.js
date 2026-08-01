import { describe, expect, it } from 'vitest';
import { JUMP_IMPULSE, VEHICLE_VISUAL_YAW } from '../src/vehicle.js';

describe('vehicle visual orientation', () => {
  it('aligns the Kenney model nose with Rapier forward', () => {
    expect(VEHICLE_VISUAL_YAW).toBe(0);
  });

  it('provides a clearly visible but controlled arcade jump', () => {
    const approximateChassisMass = 2.12 * 0.76 * 3.44 * 82;
    const launchSpeed = JUMP_IMPULSE / approximateChassisMass;
    const ballisticHeight = launchSpeed ** 2 / (2 * 9.81);
    expect(ballisticHeight).toBeGreaterThan(1.2);
    expect(ballisticHeight).toBeLessThan(2);
  });
});
