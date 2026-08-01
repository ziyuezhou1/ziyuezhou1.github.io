import { describe, expect, it } from 'vitest';
import { ASSET_CATALOG, ASSET_ZONES, VEHICLES } from '../src/assets.js';

describe('mini-city asset catalog', () => {
  it('defines four selectable vehicle variants', () => {
    expect(VEHICLES).toHaveLength(4);
    expect(new Set(VEHICLES.map((item) => item.id)).size).toBe(4);
    for (const vehicle of VEHICLES) expect(ASSET_CATALOG[vehicle.asset]).toMatch(/vehicle-truck-.+\.glb$/);
  });

  it('keeps the initial core separate from approach-loaded districts', () => {
    expect(ASSET_ZONES.core).toContain('trackFinish');
    expect(ASSET_ZONES.core).toContain('garage');
    for (const zone of ['north', 'east', 'south', 'west']) {
      expect(ASSET_ZONES[zone].length).toBeGreaterThanOrEqual(4);
      expect(ASSET_ZONES[zone]).not.toBe(ASSET_ZONES.core);
    }
  });
});
