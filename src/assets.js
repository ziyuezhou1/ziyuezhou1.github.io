import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const VEHICLES = [
  { id: 'red', name: 'Comet', color: '#ee6b4d', asset: 'carRed' },
  { id: 'green', name: 'Sprout', color: '#66a96b', asset: 'carGreen' },
  { id: 'yellow', name: 'Sunny', color: '#efb947', asset: 'carYellow' },
  { id: 'purple', name: 'Plum', color: '#8f74bf', asset: 'carPurple' },
];

export const ASSET_CATALOG = {
  roadStraight: '/assets/mini-city/city/road-straight.glb',
  roadCorner: '/assets/mini-city/city/road-corner.glb',
  roadSplit: '/assets/mini-city/city/road-split.glb',
  grass: '/assets/mini-city/city/grass.glb',
  treesTall: '/assets/mini-city/city/grass-trees-tall.glb',
  trackStraight: '/assets/mini-city/racing/track-straight.glb',
  trackCorner: '/assets/mini-city/racing/track-corner.glb',
  trackFinish: '/assets/mini-city/racing/track-finish.glb',
  trackBump: '/assets/mini-city/racing/track-bump.glb',
  trackTents: '/assets/mini-city/racing/track-tents.glb',
  forest: '/assets/mini-city/racing/decoration-forest.glb',
  raceTents: '/assets/mini-city/racing/decoration-tents.glb',
  carRed: '/assets/mini-city/racing/vehicle-truck-red.glb',
  carGreen: '/assets/mini-city/racing/vehicle-truck-green.glb',
  carYellow: '/assets/mini-city/racing/vehicle-truck-yellow.glb',
  carPurple: '/assets/mini-city/racing/vehicle-truck-purple.glb',
  garage: '/assets/style-lab/city/building-garage.glb',
  buildingA: '/assets/style-lab/city/building-small-a.glb',
  buildingB: '/assets/style-lab/city/building-small-b.glb',
  buildingC: '/assets/style-lab/city/building-small-c.glb',
  buildingD: '/assets/style-lab/city/building-small-d.glb',
  trees: '/assets/style-lab/city/grass-trees.glb',
  fountain: '/assets/style-lab/city/pavement-fountain.glb',
  intersection: '/assets/style-lab/city/road-intersection.glb',
  lampRoad: '/assets/style-lab/city/road-straight-lightposts.glb',
};

export const ASSET_ZONES = Object.freeze({
  core: ['roadStraight', 'roadCorner', 'roadSplit', 'trackStraight', 'trackCorner', 'trackFinish', 'trackBump', 'garage', 'fountain', 'carRed', 'carGreen', 'carYellow', 'carPurple'],
  north: ['buildingA', 'buildingC', 'trees', 'treesTall', 'lampRoad'],
  east: ['buildingB', 'buildingD', 'grass', 'intersection'],
  south: ['trackTents', 'raceTents', 'forest'],
  west: ['buildingA', 'buildingB', 'buildingC', 'buildingD', 'treesTall'],
});

function prepare(root) {
  root.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    if (child.material) child.material = child.material.clone();
  });
  root.updateMatrixWorld(true);
  return root;
}

function fitToSize(root, size) {
  const box = new THREE.Box3().setFromObject(root);
  const dimensions = box.getSize(new THREE.Vector3());
  const footprint = Math.max(dimensions.x, dimensions.z) || 1;
  root.scale.setScalar(size / footprint);
  root.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(root);
  root.position.y -= fitted.min.y;
  return root;
}

export function createAssetLibrary() {
  const loader = new GLTFLoader();
  const models = new Map();
  const promises = new Map();
  const zonePromises = new Map();
  const failed = new Set();

  function load(id) {
    if (models.has(id)) return Promise.resolve(models.get(id));
    if (promises.has(id)) return promises.get(id);
    const promise = loader.loadAsync(ASSET_CATALOG[id]).then((gltf) => {
      const model = prepare(gltf.scene);
      models.set(id, model);
      return model;
    }).catch((error) => {
      failed.add(id);
      console.warn('Optional model failed:', id, error);
      return null;
    });
    promises.set(id, promise);
    return promise;
  }

  function ensureZone(zoneId) {
    if (zonePromises.has(zoneId)) return zonePromises.get(zoneId);
    const ids = ASSET_ZONES[zoneId] || [];
    const promise = Promise.all(ids.map(load)).then(() => ({
      zoneId,
      loaded: ids.filter((id) => models.has(id)),
      failed: ids.filter((id) => failed.has(id)),
    }));
    zonePromises.set(zoneId, promise);
    return promise;
  }

  return {
    preloadCore: () => ensureZone('core'),
    ensureZone,
    clone(id, size = null) {
      const original = models.get(id);
      if (!original) return null;
      const clone = original.clone(true);
      return size ? fitToSize(clone, size) : clone;
    },
    has: (id) => models.has(id),
    get failed() { return [...failed]; },
  };
}
