import { describe, expect, it } from 'vitest';
import { STYLE_DEMOS, STYLE_ORDER, getStyleNeighbors } from '../src/style-lab/config.js';

describe('Style Lab configuration', () => {
  it('defines the four approved art directions in navigation order', () => {
    expect(Object.keys(STYLE_DEMOS)).toEqual(STYLE_ORDER);
    expect(STYLE_ORDER).toEqual(['city', 'medieval', 'space', 'nature']);
  });

  it.each(STYLE_ORDER)('%s uses a fixed comfort camera and a mature asset set', (key) => {
    const demo = STYLE_DEMOS[key];
    expect(demo.camera.fov).toBe(25);
    expect(demo.camera.minRadius).toBeLessThan(demo.camera.radius);
    expect(demo.camera.maxRadius).toBeGreaterThan(demo.camera.radius);
    expect(demo.assets.length).toBeGreaterThanOrEqual(8);
    expect(demo.license).toBe('CC0 1.0');

    const paths = demo.assets.map((asset) => asset.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const asset of demo.assets) {
      expect(asset.path).toMatch(/^\/assets\/style-lab\/.+\.(glb|gltf)$/);
      expect(asset.placements.length).toBeGreaterThan(0);
      for (const placement of asset.placements) {
        expect(placement.position).toHaveLength(3);
      }
    }
  });

  it('wraps previous and next navigation around the four demos', () => {
    expect(getStyleNeighbors('city').previous.slug).toBe('nature');
    expect(getStyleNeighbors('nature').next.slug).toBe('city');
  });
});
