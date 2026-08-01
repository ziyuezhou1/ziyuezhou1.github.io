import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_PATHS = {
  platform4: '/assets/models/quaternius/Platform_4x4.gltf',
  platform2: '/assets/models/quaternius/Platform_2x1_Empty.gltf',
};

function prepareOriginalModel(root) {
  root.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
  });
  root.updateMatrixWorld(true);
  return root;
}

export async function loadMatureAssets() {
  const loader = new GLTFLoader();
  const results = await Promise.allSettled(
    Object.entries(MODEL_PATHS).map(async ([id, path]) => {
      const gltf = await loader.loadAsync(path);
      return [id, prepareOriginalModel(gltf.scene)];
    }),
  );

  const models = new Map();
  const failed = [];
  results.forEach((result, index) => {
    const id = Object.keys(MODEL_PATHS)[index];
    if (result.status === 'fulfilled') models.set(...result.value);
    else failed.push(id);
  });

  return {
    available: models.size > 0,
    failed,
    clone(id) {
      return models.get(id)?.clone(true) ?? null;
    },
  };
}
