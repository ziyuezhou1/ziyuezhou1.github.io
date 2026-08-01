import * as THREE from 'three';
import {
  BloomEffect,
  ChromaticAberrationEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  VignetteEffect,
} from 'postprocessing';

const PIXEL_RATIOS = { low: 1, medium: 1.25, high: 1.65 };

export function createRendering(canvas, scene, camera, initialQuality) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: 'high-performance',
    stencil: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;

  let quality = initialQuality;
  let composer = null;

  function rebuildPipeline() {
    composer?.dispose();
    composer = null;
    renderer.shadowMap.enabled = quality !== 'low';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    if (quality === 'low') return;

    composer = new EffectComposer(renderer, {
      multisampling: renderer.capabilities.isWebGL2 && quality === 'high' ? 4 : 0,
    });
    composer.addPass(new RenderPass(scene, camera));

    const bloom = new BloomEffect({
      intensity: quality === 'high' ? 0.54 : 0.4,
      luminanceThreshold: 0.72,
      luminanceSmoothing: 0.2,
      mipmapBlur: true,
    });
    const chromatic = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(
        quality === 'high' ? 0.0001 : 0.00004,
        quality === 'high' ? 0.00016 : 0.00006,
      ),
      radialModulation: true,
      modulationOffset: 0.22,
    });
    const vignette = new VignetteEffect({
      eskil: false,
      offset: 0.23,
      darkness: 0.58,
    });
    composer.addPass(new EffectPass(camera, bloom, chromatic, vignette));
  }

  function resize(width = window.innerWidth, height = window.innerHeight) {
    const ratio = Math.min(window.devicePixelRatio || 1, PIXEL_RATIOS[quality]);
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    composer?.setSize(width, height);
  }

  function setQuality(nextQuality) {
    quality = nextQuality;
    rebuildPipeline();
    resize();
  }

  setQuality(initialQuality);

  return {
    renderer,
    get quality() {
      return quality;
    },
    setQuality,
    resize,
    render(delta) {
      if (composer) composer.render(delta);
      else renderer.render(scene, camera);
    },
    dispose() {
      composer?.dispose();
      renderer.dispose();
    },
  };
}
