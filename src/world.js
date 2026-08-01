import * as THREE from 'three';
import { physicalDistricts } from './content.js';

export const BUILDING_SIZE_FACTOR = 0.5;

export function modelTargetSize(id, size) {
  return id === 'garage' || id.startsWith('building')
    ? size * BUILDING_SIZE_FACTOR
    : size;
}

export const EXPLORATION_ROUTE = Object.freeze([
  [0, 40],
  [18, 30],
  [25, 18],
  [23, -8],
  [8, -2],
  [0, 8],
  [-10, 1],
  [-23, -8],
  [-30, 7],
  [-23, 19],
  [-8, 31],
  [0, 40],
]);

export const CIRCUIT_PATH = Object.freeze([
  [-8, -31],
  [-32, -31],
  [-40, -18],
  [-26, -10],
  [0, -15],
  [28, -30],
  [16, -44],
  [-8, -43],
  [-8, -31],
]);

export const CIRCUIT_CHECKPOINTS = Object.freeze([
  { position: [-32, -31], normal: [-1, 0], width: 5.4 },
  { position: [-40, -18], normal: [-0.52, 0.85], width: 5.4 },
  { position: [-26, -10], normal: [0.87, 0.5], width: 5.4 },
  { position: [0, -15], normal: [0.98, -0.19], width: 5.4 },
  { position: [28, -30], normal: [0.88, -0.47], width: 5.4 },
  { position: [16, -44], normal: [-0.65, -0.76], width: 5.4 },
  { position: [-8, -43], normal: [-1, 0.04], width: 5.4 },
  { position: [-8, -31], normal: [0, 1], width: 5.4 },
]);

export const RACE_START = Object.freeze({
  x: -7,
  z: -31,
  targetX: -25,
  targetZ: -31,
});

const ZONE_LAYOUTS = {
  north: [
    ['buildingA', [-29, 0, 20], 0.25, 8],
    ['buildingC', [-20, 0, 26], -0.18, 8],
    ['buildingD', [-17, 0, 20], 0.12, 7],
    ['buildingB', [22, 0, 24], -0.28, 8],
    ['buildingD', [29, 0, 18], 0.2, 7],
    ['trees', [12, 0, 29], 0.4, 7],
    ['treesTall', [-5, 0, 33], -0.2, 7],
    ['lampRoad', [0, 0.02, 31], Math.PI / 2, 10],
  ],
  east: [
    ['buildingB', [30, 0, 7], -0.34, 8],
    ['buildingD', [30, 0, -2], 0.16, 7],
    ['buildingA', [20, 0, 2], 1.12, 7],
    ['intersection', [23, 0.01, -9], 0.1, 10],
    ['grass', [16, 0, 11], 0, 7],
    ['treesTall', [33, 0, 17], -0.4, 6],
  ],
  south: [
    ['trackTents', [7, 0, -49], Math.PI, 15],
    ['raceTents', [-28, 0, -48], 0, 15],
    ['forest', [37, 0, -45], 0, 19],
  ],
  west: [
    ['buildingA', [-31, 0, 7], 0.42, 8],
    ['buildingB', [-28, 0, -2], -0.2, 8],
    ['buildingC', [-18, 0, 8], 0.08, 7],
    ['buildingD', [-32, 0, 24], 0.38, 7],
    ['treesTall', [-38, 0, 3], 0.2, 6],
    ['trees', [-35, 0, 14], -0.3, 7],
  ],
};

function material(color, roughness = 0.78, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: options.metalness ?? 0.02,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    depthWrite: options.depthWrite ?? true,
  });
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

function labelSprite(title, subtitle, color, width = 768, height = 190) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.fillStyle = '#fffaf0';
  context.roundRect(5, 5, width - 10, height - 10, 20);
  context.fill();
  context.fillStyle = color;
  context.fillRect(25, height - 45, width - 50, 10);
  context.fillStyle = '#293234';
  context.font = '700 38px Inter, sans-serif';
  context.textAlign = 'center';
  context.fillText(title, width / 2, 75);
  context.fillStyle = '#697577';
  context.font = '600 22px Inter, sans-serif';
  context.fillText(subtitle, width / 2, 118);
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

function yawQuaternion(yaw) {
  const quaternion = new THREE.Quaternion();
  quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  return { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
}

function addRoadPath(group, points, {
  width,
  road,
  edge,
  line = null,
  y = 0,
}) {
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    const length = Math.hypot(dx, dz);
    const directionX = dx / length;
    const directionZ = dz / length;
    const rightX = directionZ;
    const rightZ = -directionX;
    const yaw = Math.atan2(directionX, directionZ);
    const middleX = (from[0] + to[0]) * 0.5;
    const middleZ = (from[1] + to[1]) * 0.5;

    addBox(group, [width, 0.14, length + 0.7], [middleX, y, middleZ], road, [0, yaw, 0]);
    for (const side of [-1, 1]) {
      addBox(
        group,
        [0.34, 0.09, length + 0.75],
        [middleX + rightX * width * 0.5 * side, y + 0.1, middleZ + rightZ * width * 0.5 * side],
        edge,
        [0, yaw, 0],
      );
    }

    if (line) {
      for (let distance = 2.5; distance < length - 1; distance += 6) {
        const dashLength = Math.min(3, length - distance);
        addBox(
          group,
          [0.18, 0.035, dashLength],
          [from[0] + directionX * distance, y + 0.105, from[1] + directionZ * distance],
          line,
          [0, yaw, 0],
        );
      }
    }
  }
}

function addRoadNetwork(scene) {
  const group = new THREE.Group();
  const grass = material(0x91b58a, 0.98);
  const explorationRoad = material(0x697274, 0.94);
  const circuitRoad = material(0x4c5559, 0.92);
  const creamEdge = material(0xf2d9ae, 0.9);
  const orangeEdge = material(0xe97955, 0.74);
  const line = material(0xfff4d5, 0.72);

  addBox(group, [112, 0.5, 112], [0, -0.3, 0], grass);
  addRoadPath(group, EXPLORATION_ROUTE, {
    width: 8.4,
    road: explorationRoad,
    edge: creamEdge,
    line,
    y: 0,
  });
  addRoadPath(group, CIRCUIT_PATH, {
    width: 10.2,
    road: circuitRoad,
    edge: orangeEdge,
    line: null,
    y: 0.025,
  });

  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 8.5, 0.13, 32), material(0xd9d2bd, 0.88));
  plaza.position.set(0, 0.03, 8);
  plaza.receiveShadow = true;
  group.add(plaza);
  scene.add(group);
}

function addModel(group, assets, id, position, rotation, size) {
  const model = assets.clone(id, modelTargetSize(id, size));
  if (!model) return null;
  model.position.set(...position);
  model.rotation.y = rotation;
  group.add(model);
  return model;
}

function addCoreModels(scene, assets) {
  const group = new THREE.Group();
  addModel(group, assets, 'fountain', [0, 0.08, 8], 0, 7);
  addModel(group, assets, 'garage', [-9, 0.05, 13], Math.PI / 2, 8);
  addModel(group, assets, 'trackFinish', [-8, 0.12, -31], Math.PI / 2, 11);
  addModel(group, assets, 'trackBump', [12, 0.14, -21], -0.5, 8);
  scene.add(group);
}

function addProjectMarkers(scene) {
  const markers = new Map();
  for (const district of physicalDistricts) {
    const group = new THREE.Group();
    group.position.set(district.position[0], 0, district.position[1]);
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3.35, 0.34, 32),
      material(district.color, 0.6),
    );
    base.position.y = 0.18;
    base.receiveShadow = true;
    const label = labelSprite(
      district.title.zh,
      district.code.split('//')[0].trim(),
      district.color,
    );
    label.position.y = 4;
    group.add(base, label);
    scene.add(group);
    markers.set(district.id, group);
  }
  return markers;
}

function checkpointYaw(normal) {
  return Math.atan2(normal[0], normal[1]);
}

function createRaceBoard(scene) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 220;
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  }));
  sprite.position.set(-2, 5.1, -25.5);
  sprite.scale.set(9, 3.1, 1);
  scene.add(sprite);

  function draw(snapshot = null) {
    const state = snapshot?.state || 'idle';
    const elapsed = snapshot?.elapsed || 0;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const millis = Math.floor((elapsed % 1000) / 10);
    const time = String(minutes).padStart(2, '0') + ':' +
      String(seconds).padStart(2, '0') + '.' + String(millis).padStart(2, '0');

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#293234';
    context.roundRect(8, 8, 624, 204, 24);
    context.fill();
    context.fillStyle = state === 'racing' ? '#73c48d' : '#ef7a55';
    context.fillRect(24, 22, 12, 176);
    context.fillStyle = '#fff8e9';
    context.textAlign = 'left';
    context.font = '700 27px Inter, sans-serif';
    context.fillText('MINI CITY CIRCUIT', 58, 62);
    context.font = '700 64px DM Mono, monospace';
    context.fillText(
      state === 'countdown'
        ? 'START ' + snapshot.countdown
        : state === 'finished'
          ? 'FINISH'
          : state === 'idle'
            ? 'PRESS E'
            : time,
      58,
      137,
    );
    context.fillStyle = '#b8c0bd';
    context.font = '500 19px DM Mono, monospace';
    const checkpoint = Math.min((snapshot?.checkpointIndex || 0) + 1, snapshot?.checkpointTotal || 8);
    context.fillText(state === 'idle' ? '8 GATES / ONE LAP' : 'GATE ' + checkpoint + ' / 8', 60, 178);
    texture.needsUpdate = true;
  }

  draw();
  return { sprite, draw };
}

function addCircuit(scene, physics) {
  const group = new THREE.Group();
  const markers = [];
  const railMaterials = [material(0xf6ead0, 0.75), material(0xe97955, 0.62)];

  for (let index = 0; index < CIRCUIT_PATH.length - 1; index += 1) {
    const from = CIRCUIT_PATH[index];
    const to = CIRCUIT_PATH[index + 1];
    const dx = to[0] - from[0];
    const dz = to[1] - from[1];
    const length = Math.hypot(dx, dz);
    const directionX = dx / length;
    const directionZ = dz / length;
    const rightX = directionZ;
    const rightZ = -directionX;
    const yaw = Math.atan2(directionX, directionZ);
    const middleX = (from[0] + to[0]) * 0.5;
    const middleZ = (from[1] + to[1]) * 0.5;
    for (const side of [-1, 1]) {
      const position = [
        middleX + rightX * 5.55 * side,
        0.44,
        middleZ + rightZ * 5.55 * side,
      ];
      addBox(group, [0.32, 0.75, length + 0.5], position, railMaterials[(index + (side > 0 ? 1 : 0)) % 2], [0, yaw, 0]);
      physics.addFixedBox({
        position,
        size: [0.32, 0.75, length + 0.5],
        rotation: yawQuaternion(yaw),
        friction: 0.7,
        restitution: 0.15,
      });
    }
  }

  CIRCUIT_CHECKPOINTS.forEach((checkpoint, index) => {
    const checkpointGroup = new THREE.Group();
    const gateMaterial = material(0xffffff, 0.42, {
      emissive: 0x000000,
      transparent: true,
      opacity: 0.88,
    });
    const left = addBox(checkpointGroup, [0.3, 3.8, 0.3], [-4.7, 1.9, 0], gateMaterial);
    const right = addBox(checkpointGroup, [0.3, 3.8, 0.3], [4.7, 1.9, 0], gateMaterial);
    const top = addBox(checkpointGroup, [9.7, 0.3, 0.3], [0, 3.7, 0], gateMaterial);
    const number = labelSprite(
      index === CIRCUIT_CHECKPOINTS.length - 1 ? 'FINISH' : 'GATE ' + String(index + 1).padStart(2, '0'),
      'MINI CITY CIRCUIT',
      index === CIRCUIT_CHECKPOINTS.length - 1 ? '#e76f51' : '#657274',
    );
    number.position.set(0, 4.8, 0);
    number.scale.multiplyScalar(0.48);
    checkpointGroup.add(number);
    checkpointGroup.position.set(checkpoint.position[0], 0, checkpoint.position[1]);
    checkpointGroup.rotation.y = checkpointYaw(checkpoint.normal);
    group.add(checkpointGroup);
    markers.push({ group: checkpointGroup, beams: [left, right, top], label: number });
  });

  const startTower = new THREE.Group();
  addBox(startTower, [0.5, 5.4, 0.5], [-5.4, 2.7, 0], material(0x343d3f, 0.6));
  addBox(startTower, [4.1, 1.1, 0.6], [-3.2, 4.7, 0], material(0x343d3f, 0.6));
  const startLights = [];
  for (let index = 0; index < 3; index += 1) {
    const lightMaterial = material(0x555d5c, 0.35, { emissive: 0x000000 });
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.33, 16, 12), lightMaterial);
    light.position.set(-4.25 + index * 1.05, 4.72, -0.36);
    light.castShadow = true;
    startTower.add(light);
    startLights.push(light);
  }
  startTower.position.set(-8, 0, -31);
  startTower.rotation.y = -Math.PI / 2;
  group.add(startTower);

  for (let index = 0; index < 8; index += 1) {
    const flag = new THREE.Group();
    addBox(flag, [0.12, 3.2, 0.12], [0, 1.6, 0], material(0x394446, 0.75));
    const cloth = addBox(
      flag,
      [1.2, 0.62, 0.08],
      [0.62, 2.66, 0],
      material(index % 2 ? 0xf6ead0 : 0xe97955, 0.6),
    );
    cloth.castShadow = true;
    const anchor = CIRCUIT_PATH[index];
    flag.position.set(anchor[0] + (index % 2 ? 6.4 : -6.4), 0, anchor[1]);
    flag.rotation.y = index * 0.73;
    group.add(flag);
  }

  const podium = new THREE.Group();
  addBox(podium, [2.2, 0.7, 2.2], [0, 0.35, 0], material(0xf2c15b, 0.62));
  addBox(podium, [2.2, 1.1, 2.2], [-2.2, 0.55, 0], material(0xf8ebd2, 0.7));
  addBox(podium, [2.2, 0.45, 2.2], [2.2, 0.225, 0], material(0xe97955, 0.62));
  podium.position.set(-1, 0, -49);
  group.add(podium);

  const airDancers = [];
  for (const x of [-22, 8]) {
    const dancer = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.38, 4.6, 10),
      material(x < 0 ? 0xe97955 : 0x4f9b72, 0.55),
    );
    body.position.y = 2.3;
    body.castShadow = true;
    dancer.add(body);
    dancer.position.set(x, 0, -48.5);
    group.add(dancer);
    airDancers.push(dancer);
  }

  const obstacleMesh = new THREE.Group();
  addBox(obstacleMesh, [0.85, 1.05, 4.2], [0, 0, 0], material(0xe97955, 0.55));
  obstacleMesh.position.set(-2, 0.62, -14.6);
  group.add(obstacleMesh);
  const obstacleBody = physics.world.createRigidBody(
    physics.RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(-2, 0.62, -14.6),
  );
  physics.world.createCollider(
    physics.RAPIER.ColliderDesc.cuboid(0.425, 0.525, 2.1)
      .setFriction(0.65)
      .setRestitution(0.18),
    obstacleBody,
  );

  scene.add(group);
  const board = createRaceBoard(scene);
  return {
    group,
    markers,
    startLights,
    board,
    airDancers,
    obstacleMesh,
    obstacleBody,
  };
}

function addEnvironment(scene, mediumDetail, random) {
  const moundMaterial = material(0x7fa87a, 0.98);
  for (const [x, z, sx, sz] of [
    [-46, 37, 12, 8],
    [44, 36, 13, 9],
    [-48, -38, 10, 8],
    [47, -10, 11, 16],
    [3, -52, 17, 7],
  ]) {
    const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), moundMaterial);
    mound.scale.set(sx, 2.1 + random() * 1.2, sz);
    mound.position.set(x, -1.15, z);
    mound.receiveShadow = true;
    mediumDetail.add(mound);
  }

  const trunkGeometry = new THREE.CylinderGeometry(0.18, 0.24, 1.8, 7);
  const crownGeometry = new THREE.IcosahedronGeometry(1.15, 1);
  const trunkMaterial = material(0x8c6a48);
  const crownMaterials = [material(0x679666), material(0x7eaa70), material(0x91b879)];
  for (let index = 0; index < 38; index += 1) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 0.9;
    trunk.castShadow = true;
    const crown = new THREE.Mesh(crownGeometry, crownMaterials[index % crownMaterials.length]);
    crown.position.y = 2.25;
    crown.scale.set(0.9 + random() * 0.35, 0.9 + random() * 0.55, 0.9 + random() * 0.35);
    crown.castShadow = true;
    tree.add(trunk, crown);
    const side = index % 4;
    const along = -47 + random() * 94;
    tree.position.set(
      side === 0 ? -48 + random() * 4 : side === 1 ? 48 - random() * 4 : along,
      0,
      side === 2 ? -49 + random() * 4 : side === 3 ? 49 - random() * 4 : along,
    );
    tree.rotation.y = random() * Math.PI;
    tree.scale.setScalar(0.82 + random() * 0.55);
    mediumDetail.add(tree);
  }
  scene.add(mediumDetail);
}

function addArcadeProps(scene, physics, assets) {
  const dynamicObjects = [];
  const crateColors = [0xe97955, 0xf6ead0, 0x4f9b72, 0xe3ac42];

  const props = [
    [-5, 0.65, 2], [-3.7, 0.65, 2], [-4.35, 1.9, 2],
    [29, 0.8, 14], [30.4, 0.8, 14], [31.8, 0.8, 14],
    [29.7, 0.8, 12.7], [31.1, 0.8, 12.7],
  ];
  props.forEach((position, index) => {
    const size = index < 3 ? [1.2, 1.2, 1.2] : [0.62, 1.4, 0.62];
    const mesh = new THREE.Group();
    addBox(mesh, size, [0, 0, 0], material(crateColors[index % crateColors.length], 0.62));
    mesh.position.set(...position);
    scene.add(mesh);
    const dynamic = physics.addDynamicBox({
      position,
      size,
      density: index < 3 ? 4 : 2,
      restitution: index < 3 ? 0.12 : 0.28,
    });
    dynamicObjects.push({ mesh, body: dynamic.body });
  });

  const rampQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.18, -0.15, 0));
  addBox(scene, [7, 0.48, 6], [-18, 1.15, 2], material(0xe7c887, 0.67), [-0.18, -0.15, 0]);
  physics.addFixedBox({
    position: [-18, 1.15, 2],
    size: [7, 0.48, 6],
    rotation: { x: rampQuaternion.x, y: rampQuaternion.y, z: rampQuaternion.z, w: rampQuaternion.w },
    friction: 1.15,
  });
  if (assets.has('trackBump')) {
    const bump = assets.clone('trackBump', 7);
    bump.position.set(-18, 0.12, 2);
    bump.rotation.y = -0.15;
    scene.add(bump);
  }

  return dynamicObjects;
}

function distanceToSegment(point, from, to) {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const lengthSquared = dx * dx + dz * dz;
  const t = Math.max(0, Math.min(1, (
    (point.x - from[0]) * dx + (point.z - from[1]) * dz
  ) / lengthSquared));
  const x = from[0] + dx * t;
  const z = from[1] + dz * t;
  return Math.hypot(point.x - x, point.z - z);
}

function checkpointRespawn(checkpointIndex) {
  if (checkpointIndex <= 0) return RACE_START;
  const checkpoint = CIRCUIT_CHECKPOINTS[Math.min(checkpointIndex - 1, CIRCUIT_CHECKPOINTS.length - 1)];
  const [x, z] = checkpoint.position;
  const [normalX, normalZ] = checkpoint.normal;
  return {
    x: x - normalX * 3.2,
    z: z - normalZ * 3.2,
    targetX: x + normalX * 8,
    targetZ: z + normalZ * 8,
  };
}

export function createWorld(scene, physics, renderer, initialQuality = 'medium', assets, reducedMotion = false) {
  const random = seededRandom(240521);
  const zoneGroups = new Map();
  const dynamicObjects = [];
  const loadedZones = new Set();
  const mediumDetail = new THREE.Group();
  const highDetail = new THREE.Group();
  let raceSnapshot = null;
  let lastBoardTick = -1;

  scene.background = new THREE.Color(0xc7dbd7);
  scene.fog = new THREE.Fog(0xc7dbd7, 66, 132);

  const hemisphere = new THREE.HemisphereLight(0xffffff, 0x769178, 2.25);
  scene.add(hemisphere);
  const sun = new THREE.DirectionalLight(0xfff3da, 4.15);
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

  addRoadNetwork(scene);
  physics.addFixedBox({ position: [0, -0.38, 0], size: [112, 0.76, 112], friction: 1.3 });
  addCoreModels(scene, assets);
  const landmarks = addProjectMarkers(scene);
  const circuit = addCircuit(scene, physics);
  dynamicObjects.push(...addArcadeProps(scene, physics, assets));
  addEnvironment(scene, mediumDetail, random);

  const fragments = [
    [3, 1.2, 34], [20, 1.2, 22], [23, 1.2, 0], [4, 1.2, 7],
    [-18, 1.2, -5], [-27, 1.2, 13], [-17, 1.2, 25], [21, 1.2, -34],
  ].map((position, index) => {
    const geometry = new THREE.CylinderGeometry(0.48, 0.48, 0.16, 20);
    const colors = [0xee6b4d, 0x4f9b72, 0xe3ac42, 0x7b70b6];
    const mesh = new THREE.Mesh(geometry, material(colors[index % colors.length], 0.38));
    mesh.position.set(...position);
    mesh.rotation.x = Math.PI / 2;
    mesh.castShadow = true;
    mesh.userData.baseY = position[1];
    scene.add(mesh);
    return { id: 'city-stamp-' + index, mesh, collected: false };
  });

  for (const x of [-56.5, 56.5]) physics.addFixedBox({ position: [x, 3, 0], size: [1, 6, 114] });
  for (const z of [-56.5, 56.5]) physics.addFixedBox({ position: [0, 3, z], size: [114, 6, 1] });

  function addZone(zoneId) {
    if (loadedZones.has(zoneId) || !ZONE_LAYOUTS[zoneId]) return;
    const group = new THREE.Group();
    for (const [id, position, rotation, size] of ZONE_LAYOUTS[zoneId]) {
      const model = addModel(group, assets, id, position, rotation, size);
      if (model && (id.startsWith('building') || id === 'garage')) {
        const footprint = modelTargetSize(id, size);
        const colliderHeight = footprint * 0.65;
        physics.addFixedBox({
          position: [position[0], colliderHeight * 0.5, position[2]],
          size: [footprint * 0.72, colliderHeight, footprint * 0.72],
          friction: 1.05,
        });
      }
    }
    zoneGroups.set(zoneId, group);
    loadedZones.add(zoneId);
    scene.add(group);
  }

  function setActiveCheckpoint(index) {
    circuit.markers.forEach((marker, markerIndex) => {
      const active = markerIndex === index;
      const reached = index >= 0 && markerIndex < index;
      marker.beams.forEach((beam) => {
        beam.material.color.set(active ? 0xf2ad44 : reached ? 0x73b58a : 0xffffff);
        beam.material.emissive.set(active ? 0x8a3f09 : reached ? 0x174b2b : 0x000000);
        beam.material.emissiveIntensity = active ? 0.8 : reached ? 0.22 : 0;
        beam.material.opacity = active ? 1 : 0.72;
      });
      marker.group.scale.setScalar(active && !reducedMotion ? 1.04 : 1);
    });
  }

  function setRaceSnapshot(snapshot) {
    raceSnapshot = snapshot;
    const state = snapshot?.state || 'idle';
    const countdown = snapshot?.countdown || 0;
    circuit.startLights.forEach((light, index) => {
      let color = 0x555d5c;
      let emissive = 0x000000;
      if (state === 'countdown' && index < 4 - countdown) {
        color = countdown === 1 ? 0xefb947 : 0xe97955;
        emissive = color;
      } else if (state === 'racing') {
        color = 0x73c48d;
        emissive = 0x24643c;
      } else if (state === 'finished') {
        color = 0xefb947;
        emissive = 0x7a4a00;
      }
      light.material.color.setHex(color);
      light.material.emissive.setHex(emissive);
      light.material.emissiveIntensity = emissive ? 1.6 : 0;
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

    const raceActive = raceSnapshot?.state === 'racing';
    const obstacleZ = -14.6 + (raceActive ? Math.sin(elapsed * 1.55) * 3.2 : 0);
    circuit.obstacleBody.setNextKinematicTranslation({ x: -2, y: 0.62, z: obstacleZ });
    circuit.obstacleMesh.position.set(-2, 0.62, obstacleZ);
    circuit.airDancers.forEach((dancer, index) => {
      dancer.rotation.z = reducedMotion ? 0 : Math.sin(elapsed * 2.2 + index * 1.7) * 0.12;
      dancer.scale.y = reducedMotion ? 1 : 1 + Math.sin(elapsed * 3 + index) * 0.05;
    });

    const boardTick = Math.floor(elapsed * 10);
    if (boardTick !== lastBoardTick) {
      circuit.board.draw(raceSnapshot);
      lastBoardTick = boardTick;
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
  setActiveCheckpoint(-1);
  setRaceSnapshot(null);

  return {
    landmarks,
    physicalNodes: physicalDistricts,
    fragments,
    fragmentTotal: fragments.length,
    checkpointPositions: CIRCUIT_CHECKPOINTS,
    raceStart: RACE_START,
    addZone,
    setActiveCheckpoint,
    setRaceSnapshot,
    setQuality,
    update,
    collectNear,
    getRaceRespawn: checkpointRespawn,
    isOffCircuit(position) {
      if (position.y < -1.5) return true;
      let closest = Infinity;
      for (let index = 0; index < CIRCUIT_PATH.length - 1; index += 1) {
        closest = Math.min(closest, distanceToSegment(position, CIRCUIT_PATH[index], CIRCUIT_PATH[index + 1]));
      }
      return closest > 9.6;
    },
    isNearRaceStart(position) {
      return Math.hypot(position.x - RACE_START.x, position.z - RACE_START.z) < 7.5;
    },
  };
}
