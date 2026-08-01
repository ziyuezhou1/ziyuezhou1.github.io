import * as THREE from 'three';
import { physicalDistricts } from './content.js';

const CHECKPOINTS = [
  [30, 25],
  [35, -20],
  [12, -36],
  [-27, -32],
  [-35, 18],
  [0, 38],
];

const ZONE_LAYOUTS = {
  north: [
    ['buildingA', [-23, 0, 18], 0.3, 8],
    ['buildingC', [23, 0, 19], -0.3, 8],
    ['buildingD', [-13, 0, 25], 0.05, 7],
    ['trees', [13, 0, 25], 0.4, 7],
    ['treesTall', [-5, 0, 24], -0.2, 7],
    ['lampRoad', [0, 0.02, 28], Math.PI / 2, 10],
  ],
  east: [
    ['buildingB', [23, 0, -8], -0.4, 8],
    ['buildingD', [24, 0, 5], 0.15, 7],
    ['buildingA', [16, 0, -20], 1.2, 7],
    ['intersection', [26, 0.01, -23], 0, 10],
    ['grass', [15, 0, 6], 0, 7],
    ['treesTall', [24, 0, 12], -0.4, 6],
  ],
  south: [
    ['trackTents', [17, 0, -45], Math.PI, 17],
    ['raceTents', [-18, 0, -45], 0, 17],
    ['forest', [0, 0, -49], 0, 22],
    ['buildingC', [-13, 0, -22], -0.3, 7],
    ['buildingB', [4, 0, -23], 0.25, 7],
  ],
  west: [
    ['buildingA', [-24, 0, -8], 0.45, 8],
    ['buildingB', [-24, 0, 5], -0.2, 8],
    ['buildingC', [-16, 0, -20], 0.1, 7],
    ['buildingD', [-25, 0, 13], 0.4, 7],
    ['treesTall', [-15, 0, 8], 0.2, 6],
    ['trees', [-25, 0, -20], -0.3, 7],
  ],
};

function material(color, roughness = 0.78) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02 });
}

function addBox(group, size, position, surface, rotation = null) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), surface);
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function seededRandom(seed) {
  let value = seed % 2147483647;
  return () => {
    value = value * 16807 % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function labelSprite(title, subtitle, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 190;
  const context = canvas.getContext('2d');
  context.fillStyle = '#fffaf0';
  context.roundRect(5, 5, 758, 180, 20);
  context.fill();
  context.fillStyle = color;
  context.fillRect(25, 145, 718, 10);
  context.fillStyle = '#293234';
  context.font = '700 38px Inter, sans-serif';
  context.textAlign = 'center';
  context.fillText(title, 384, 75);
  context.fillStyle = '#697577';
  context.font = '600 22px Inter, sans-serif';
  context.fillText(subtitle, 384, 118);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  }));
  sprite.scale.set(8.7, 2.15, 1);
  return sprite;
}

function addRoadLoop(scene) {
  const group = new THREE.Group();
  const road = material(0x596267, 0.92);
  const edge = material(0xf1d9af, 0.88);
  const line = material(0xfff2cf, 0.72);
  const grass = material(0x94b58e, 0.96);

  addBox(group, [112, 0.42, 112], [0, -0.26, 0], grass);
  for (const item of [
    [[78, 0.12, 11], [0, 0, 35]],
    [[78, 0.12, 11], [0, 0, -35]],
    [[11, 0.12, 78], [35, 0, 0]],
    [[11, 0.12, 78], [-35, 0, 0]],
  ]) addBox(group, item[0], item[1], road);

  for (const item of [
    [[78, 0.08, 0.32], [0, 0.09, 29.6]],
    [[78, 0.08, 0.32], [0, 0.09, 40.4]],
    [[78, 0.08, 0.32], [0, 0.09, -29.6]],
    [[78, 0.08, 0.32], [0, 0.09, -40.4]],
    [[0.32, 0.08, 78], [29.6, 0.09, 0]],
    [[0.32, 0.08, 78], [40.4, 0.09, 0]],
    [[0.32, 0.08, 78], [-29.6, 0.09, 0]],
    [[0.32, 0.08, 78], [-40.4, 0.09, 0]],
  ]) addBox(group, item[0], item[1], edge);

  for (let value = -26; value <= 26; value += 8) {
    addBox(group, [3.4, 0.04, 0.16], [value, 0.1, 35], line);
    addBox(group, [3.4, 0.04, 0.16], [value, 0.1, -35], line);
    addBox(group, [0.16, 0.04, 3.4], [35, 0.1, value], line);
    addBox(group, [0.16, 0.04, 3.4], [-35, 0.1, value], line);
  }
  scene.add(group);
}

function addModel(group, assets, id, position, rotation, size) {
  const model = assets.clone(id, size);
  if (!model) return null;
  model.position.set(...position);
  model.rotation.y = rotation;
  group.add(model);
  return model;
}

function addCoreModels(scene, assets) {
  const group = new THREE.Group();
  addModel(group, assets, 'fountain', [0, 0.05, 6], 0, 8);
  addModel(group, assets, 'garage', [-12, 0.05, 13], Math.PI / 2, 8);
  addModel(group, assets, 'trackFinish', [0, 0.12, 38], Math.PI / 2, 12);
  addModel(group, assets, 'trackBump', [10, 0.14, -35], Math.PI / 2, 9);

  const straights = [
    [-18, 0.12, 35, Math.PI / 2], [18, 0.12, 35, Math.PI / 2],
    [-18, 0.12, -35, Math.PI / 2], [18, 0.12, -35, Math.PI / 2],
    [35, 0.12, -12, 0], [35, 0.12, 12, 0],
    [-35, 0.12, -12, 0], [-35, 0.12, 12, 0],
  ];
  straights.forEach(([x, y, z, rotation]) => addModel(group, assets, 'trackStraight', [x, y, z], rotation, 10));
  for (const [x, z, rotation] of [
    [35, 35, Math.PI], [35, -35, Math.PI / 2], [-35, -35, 0], [-35, 35, -Math.PI / 2],
  ]) addModel(group, assets, 'trackCorner', [x, 0.13, z], rotation, 14);
  scene.add(group);
}

function addProjectMarkers(scene) {
  const markers = new Map();
  for (const district of physicalDistricts) {
    const group = new THREE.Group();
    group.position.set(district.position[0], 0, district.position[1]);
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(3.2, 3.5, 0.34, 32),
      material(district.color, 0.6),
    );
    base.position.y = 0.17;
    base.receiveShadow = true;
    const label = labelSprite(
      district.title.zh,
      district.code.split('//')[0].trim(),
      district.color,
    );
    label.position.y = 4.3;
    group.add(base, label);
    scene.add(group);
    markers.set(district.id, group);
  }
  return markers;
}

function addCheckpoints(scene) {
  const markers = [];
  CHECKPOINTS.forEach(([x, z], index) => {
    const group = new THREE.Group();
    const idle = material(index === CHECKPOINTS.length - 1 ? 0xee6b4d : 0xffffff, 0.52);
    const left = addBox(group, [0.35, 4.2, 0.35], [-4, 2.1, 0], idle);
    const right = addBox(group, [0.35, 4.2, 0.35], [4, 2.1, 0], idle);
    const top = addBox(group, [8.35, 0.35, 0.35], [0, 4.05, 0], idle);
    const number = labelSprite('CHECKPOINT ' + String(index + 1).padStart(2, '0'), 'CITY LOOP', index === 5 ? '#ee6b4d' : '#6b7779');
    number.position.set(0, 5.25, 0);
    number.scale.multiplyScalar(0.55);
    group.add(number);
    group.position.set(x, 0, z);
    group.rotation.y = Math.abs(x) > 32 ? Math.PI / 2 : 0;
    scene.add(group);
    markers.push({ group, beams: [left, right, top], idle });
  });
  return markers;
}

function addProps(scene, physics, assets) {
  const dynamicObjects = [];
  const barrierMaterial = material(0xee6b4d, 0.55);
  const cream = material(0xfff5dd, 0.72);
  for (const [index, position] of [
    [-6, 1, 30], [-4.5, 1, 30], [22, 1, 32], [23.5, 1, 32], [-29, 1, -24], [-30.5, 1, -24],
  ].entries()) {
    const group = new THREE.Group();
    addBox(group, [1.35, 0.75, 0.55], [0, 0, 0], index % 2 ? cream : barrierMaterial);
    group.position.set(...position);
    scene.add(group);
    const dynamic = physics.addDynamicBox({ position, size: [1.35, 0.75, 0.55], density: 3 });
    dynamicObjects.push({ mesh: group, body: dynamic.body });
  }

  const rampRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, 0, 0));
  const ramp = addBox(scene, [8, 0.55, 8], [-35, 1.35, 2], material(0xe6c684, 0.68), [-0.2, 0, 0]);
  ramp.castShadow = ramp.receiveShadow = true;
  physics.addFixedBox({
    position: [-35, 1.35, 2],
    size: [8, 0.55, 8],
    rotation: { x: rampRotation.x, y: rampRotation.y, z: rampRotation.z, w: rampRotation.w },
    friction: 1.15,
  });

  if (assets.has('trackBump')) {
    const bump = assets.clone('trackBump', 8);
    bump.position.set(-35, 0.15, 2);
    bump.rotation.y = Math.PI / 2;
    scene.add(bump);
  }

  const southRampRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -0.2));
  physics.addFixedBox({
    position: [10, 1.25, -35],
    size: [8, 0.5, 7],
    rotation: {
      x: southRampRotation.x,
      y: southRampRotation.y,
      z: southRampRotation.z,
      w: southRampRotation.w,
    },
    friction: 1.15,
  });
  return dynamicObjects;
}

function addCollectibles(scene) {
  const geometry = new THREE.CylinderGeometry(0.48, 0.48, 0.16, 20);
  const colors = [0xee6b4d, 0x4f9b72, 0xe3ac42, 0x7b70b6];
  return [
    [0, 1.2, 29], [25, 1.2, 35], [35, 1.2, 8], [35, 1.2, -26],
    [8, 1.2, -35], [-25, 1.2, -35], [-35, 1.2, -6], [-30, 1.2, 28],
  ].map((position, index) => {
    const mesh = new THREE.Mesh(geometry, material(colors[index % colors.length], 0.38));
    mesh.position.set(...position);
    mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = true;
    mesh.userData.baseY = position[1];
    scene.add(mesh);
    return { id: 'city-stamp-' + index, mesh, collected: false };
  });
}

export function createWorld(scene, physics, renderer, initialQuality = 'medium', assets, reducedMotion = false) {
  const random = seededRandom(240521);
  const zoneGroups = new Map();
  const dynamicObjects = [];
  const loadedZones = new Set();
  const mediumDetail = new THREE.Group();
  const highDetail = new THREE.Group();

  scene.background = new THREE.Color(0xc9dcda);
  scene.fog = new THREE.Fog(0xc9dcda, 62, 128);

  const hemisphere = new THREE.HemisphereLight(0xffffff, 0x78927b, 2.2);
  scene.add(hemisphere);
  const sun = new THREE.DirectionalLight(0xfff4dc, 4.2);
  sun.position.set(-28, 48, 26);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -58;
  sun.shadow.camera.right = 58;
  sun.shadow.camera.top = 58;
  sun.shadow.camera.bottom = -58;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 130;
  sun.shadow.bias = -0.0008;
  scene.add(sun);

  addRoadLoop(scene);
  physics.addFixedBox({ position: [0, -0.35, 0], size: [112, 0.7, 112], friction: 1.3 });
  addCoreModels(scene, assets);
  const landmarks = addProjectMarkers(scene);
  const checkpointMarkers = addCheckpoints(scene);
  dynamicObjects.push(...addProps(scene, physics, assets));
  const fragments = addCollectibles(scene);

  for (let index = 0; index < 26; index += 1) {
    const trunk = addBox(mediumDetail, [0.36, 2.1, 0.36], [0, 1.05, 0], material(0x8c6a48));
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35, 1), material(index % 3 ? 0x6fa36f : 0x86b879));
    crown.position.y = 2.65;
    crown.castShadow = true;
    const tree = new THREE.Group();
    tree.add(trunk, crown);
    const side = index % 4;
    const along = -45 + (index * 17 % 90);
    tree.position.set(
      side === 0 ? -48 : side === 1 ? 48 : along,
      0,
      side === 2 ? -48 : side === 3 ? 48 : along,
    );
    tree.rotation.y = random() * Math.PI;
    mediumDetail.add(tree);
  }
  scene.add(mediumDetail, highDetail);

  for (const x of [-56.5, 56.5]) physics.addFixedBox({ position: [x, 3, 0], size: [1, 6, 114] });
  for (const z of [-56.5, 56.5]) physics.addFixedBox({ position: [0, 3, z], size: [114, 6, 1] });

  function addZone(zoneId) {
    if (loadedZones.has(zoneId) || !ZONE_LAYOUTS[zoneId]) return;
    const group = new THREE.Group();
    for (const [id, position, rotation, size] of ZONE_LAYOUTS[zoneId]) {
      const model = addModel(group, assets, id, position, rotation, size);
      if (model && id.startsWith('building')) {
        physics.addFixedBox({
          position: [position[0], 2.5, position[2]],
          size: [size * 0.72, 5, size * 0.72],
          friction: 1.05,
        });
      }
    }
    zoneGroups.set(zoneId, group);
    loadedZones.add(zoneId);
    scene.add(group);
  }

  function setActiveCheckpoint(index) {
    checkpointMarkers.forEach((marker, markerIndex) => {
      const active = markerIndex === index;
      marker.beams.forEach((beam) => {
        beam.material.color.set(active ? 0xf0a846 : markerIndex < index ? 0x75a878 : 0xffffff);
        beam.material.emissive?.set(active ? 0x6a3100 : 0x000000);
        beam.material.emissiveIntensity = active ? 0.45 : 0;
      });
    });
  }

  function setQuality(level) {
    mediumDetail.visible = level !== 'low';
    highDetail.visible = level === 'high' && !reducedMotion;
    sun.castShadow = level !== 'low';
  }

  function update(elapsed, delta) {
    for (const item of dynamicObjects) {
      const position = item.body.translation();
      const rotation = item.body.rotation();
      item.mesh.position.set(position.x, position.y, position.z);
      item.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }
    if (!reducedMotion) {
      for (const fragment of fragments) {
        if (fragment.collected) continue;
        fragment.mesh.rotation.z += delta * 1.6;
        fragment.mesh.position.y = fragment.mesh.userData.baseY + Math.sin(elapsed * 2 + fragment.mesh.position.x) * 0.18;
      }
    }
  }

  function collectNear(position) {
    const found = [];
    for (const fragment of fragments) {
      if (fragment.collected || fragment.mesh.position.distanceTo(position) > 2) continue;
      fragment.collected = true;
      fragment.mesh.visible = false;
      found.push(fragment.id);
    }
    return found;
  }

  setQuality(initialQuality);
  return {
    landmarks,
    physicalNodes: physicalDistricts,
    fragments,
    fragmentTotal: fragments.length,
    checkpointPositions: CHECKPOINTS,
    addZone,
    setActiveCheckpoint,
    setQuality,
    update,
    collectNear,
    isNearRaceStart(position) {
      return Math.hypot(position.x, position.z - 38) < 9;
    },
  };
}
