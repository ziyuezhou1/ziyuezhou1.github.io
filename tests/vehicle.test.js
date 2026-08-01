import { describe, expect, it } from 'vitest';
import { VEHICLE_VISUAL_YAW } from '../src/vehicle.js';

describe('vehicle visual orientation', () => {
  it('aligns the Kenney model nose with Rapier forward', () => {
    expect(VEHICLE_VISUAL_YAW).toBe(0);
  });
});
