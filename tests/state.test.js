import { describe, expect, it } from 'vitest';
import {
  chooseQuality,
  clamp,
  detectLanguage,
  localize,
  nextQuality,
} from '../src/state.js';

describe('quality selection', () => {
  it('uses low quality for mobile and reduced-motion visitors', () => {
    expect(chooseQuality({ width: 390, dpr: 3, cores: 8 })).toBe('low');
    expect(chooseQuality({ width: 1440, dpr: 1, cores: 12, reducedMotion: true })).toBe('low');
  });

  it('cycles through explicit quality levels', () => {
    expect(nextQuality('low')).toBe('medium');
    expect(nextQuality('medium')).toBe('high');
    expect(nextQuality('high')).toBe('low');
  });
});

describe('localization helpers', () => {
  it('honors a saved language before browser locale', () => {
    const storage = { getItem: () => 'en' };
    expect(detectLanguage(storage, 'zh-CN')).toBe('en');
  });

  it('falls back safely when a translation is missing', () => {
    expect(localize({ zh: '中文' }, 'en')).toBe('中文');
    expect(localize('STATIC', 'zh')).toBe('STATIC');
  });
});

describe('clamp', () => {
  it('keeps values within the requested range', () => {
    expect(clamp(-2, 0, 10)).toBe(0);
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});
