import { describe, expect, it } from 'vitest';
import { CAMERA_PRESET, dampingFactor } from '../src/camera.js';

describe('stable world camera', () => {
  it('uses the fixed Bruno-inspired low-FOV preset', () => {
    expect(CAMERA_PRESET.fov).toBe(25);
    expect(CAMERA_PRESET.theta).toBeCloseTo(Math.PI * 0.25);
    expect(CAMERA_PRESET.desktopPhi).toBeCloseTo(Math.PI * 0.27);
  });

  it('keeps zoom inside the intended comfort range', () => {
    expect(CAMERA_PRESET.minRadius).toBe(15);
    expect(CAMERA_PRESET.desktopRadius).toBeGreaterThan(CAMERA_PRESET.minRadius);
    expect(CAMERA_PRESET.maxRadius).toBe(30);
  });

  it('produces frame-rate-independent damping', () => {
    expect(dampingFactor(8, 1 / 60)).toBeGreaterThan(0);
    expect(dampingFactor(8, 1 / 30)).toBeGreaterThan(dampingFactor(8, 1 / 60));
    expect(dampingFactor(8, 0)).toBe(0);
  });
});
