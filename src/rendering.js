import * as THREE from 'three';

const PIXEL_RATIOS = { low: 1, medium: 1.35, high: 1.8 };

export function createRendering(canvas, scene, camera, initialQuality) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    stencil: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  let quality = initialQuality;

  function resize(width = window.innerWidth, height = window.innerHeight) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PIXEL_RATIOS[quality]));
    renderer.setSize(width, height, false);
  }

  function setQuality(nextQuality) {
    quality = nextQuality;
    renderer.shadowMap.enabled = quality !== 'low';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    resize();
  }

  setQuality(initialQuality);

  return {
    renderer,
    get quality() { return quality; },
    setQuality,
    resize,
    render() { renderer.render(scene, camera); },
    dispose() { renderer.dispose(); },
  };
}
