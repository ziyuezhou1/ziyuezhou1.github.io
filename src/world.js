import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { physicalDistricts } from './content.js';

function seededRandom(seed) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function surface(color, roughness = 0.45, metalness = 0.55) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function glow(color, intensity = 3) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).multiplyScalar(0.16),
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.22,
    metalness: 0.48,
  });
}

function enableShadows(object) {
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
  });
  return object;
}

function labelSprite(text, color, width = 768) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = 144;
  const context = canvas.getContext('2d');
  context.fillStyle = 'rgba(2, 8, 12, 0.88)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = color;
  context.lineWidth = 7;
  context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
  context.fillStyle = '#eefaff';
  context.font = '700 42px Orbitron, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  }));
  sprite.scale.set(9.6, 1.8, 1);
  return sprite;
}

function addBox(group, size, position, material, rotation = null) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  group.add(mesh);
  return mesh;
}

function addPipe(group, from, to, radius, material) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), 12),
    material,
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  group.add(mesh);
  return mesh;
}

function quaternionFromEuler(x = 0, y = 0, z = 0) {
  const quaternion = new THREE.Quaternion();
  quaternion.setFromEuler(new THREE.Euler(x, y, z));
  return {
    x: quaternion.x,
    y: quaternion.y,
    z: quaternion.z,
    w: quaternion.w,
  };
}

function createAsphaltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = '#151b1f';
  context.fillRect(0, 0, 256, 256);
  const random = seededRandom(90210);
  for (let index = 0; index < 2600; index += 1) {
    const shade = 20 + Math.floor(random() * 35);
    context.fillStyle = 'rgba(' + shade + ',' + (shade + 5) + ',' + (shade + 8) + ',0.55)';
    const size = 0.4 + random() * 1.8;
    context.fillRect(random() * 256, random() * 256, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(18, 18);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createRain(random) {
  const count = 900;
  const positions = new Float32Array(count * 6);
  const speeds = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    const x = (random() - 0.5) * 70;
    const y = random() * 32;
    const z = (random() - 0.5) * 70;
    const offset = index * 6;
    positions[offset] = x;
    positions[offset + 1] = y;
    positions[offset + 2] = z;
    positions[offset + 3] = x + 0.08;
    positions[offset + 4] = y - 0.75 - random() * 0.9;
    positions[offset + 5] = z + 0.04;
    speeds[index] = 20 + random() * 22;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const lines = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({
      color: 0x9dd8e7,
      transparent: true,
      opacity: 0.23,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  lines.frustumCulled = false;
  lines.userData.speeds = speeds;
  return lines;
}

function addTransitHub(scene, physics, animated) {
  const group = new THREE.Group();
  group.position.set(0, 0, 20);
  const steel = surface(0x121b20, 0.32, 0.82);
  const concrete = surface(0x20262a, 0.72, 0.18);
  const cyan = glow('#46e7e1', 3.5);
  const yellow = glow('#f4e65b', 2.8);

  const platform = addBox(group, [13, 0.7, 9], [0, 0.35, 0], concrete);
  platform.receiveShadow = true;
  physics.addFixedBox({ position: [0, 0.35, 20], size: [13, 0.7, 9] });

  for (const x of [-5.25, 5.25]) {
    addBox(group, [0.8, 7.8, 0.8], [x, 4.25, 0], steel);
    addBox(group, [1.1, 0.16, 7.2], [x, 6.8, 0], cyan);
    physics.addFixedBox({ position: [x, 4.25, 20], size: [0.8, 7.8, 0.8] });
  }
  addBox(group, [11.2, 0.5, 1.2], [0, 7.4, -2.8], steel);
  const sign = labelSprite('TRANSIT // PROJECT ARCHIVE', '#f4e65b');
  sign.position.set(0, 6.25, -2.7);
  group.add(sign);

  const table = addBox(group, [3.8, 0.85, 2.4], [0, 1.15, 0.4], steel);
  table.rotation.y = Math.PI / 4;
  const holo = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.05, 1),
    new THREE.MeshPhysicalMaterial({
      color: 0x46e7e1,
      emissive: 0x46e7e1,
      emissiveIntensity: 2.2,
      transparent: true,
      opacity: 0.42,
      roughness: 0.05,
      transmission: 0.38,
      depthWrite: false,
    }),
  );
  holo.position.set(0, 3.3, 0.4);
  group.add(holo);
  animated.push({ object: holo, type: 'spin', speed: 0.55, baseY: 3.3 });

  for (let index = 0; index < 3; index += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.5 + index * 0.42, 0.035, 8, 48), index === 1 ? yellow : cyan);
    ring.position.set(0, 2.45 + index * 0.52, 0.4);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    animated.push({ object: ring, type: 'ring', speed: 0.35 + index * 0.15 });
  }

  enableShadows(group);
  scene.add(group);
  return group;
}

function addSingleCellLab(scene, physics, animated, highDetail) {
  const group = new THREE.Group();
  group.position.set(0, 0, -29);
  const shell = surface(0x121a1f, 0.3, 0.72);
  const frame = surface(0x283239, 0.42, 0.78);
  const cyan = glow('#46e7e1', 3.8);
  const magenta = glow('#ff4778', 3.2);
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x6cdfe0,
    transparent: true,
    opacity: 0.25,
    roughness: 0.08,
    metalness: 0.18,
    transmission: 0.48,
    thickness: 0.8,
  });

  addBox(group, [21, 0.8, 20], [0, 0.4, 0], surface(0x171c20, 0.58, 0.45));
  physics.addFixedBox({ position: [0, 0.4, -29], size: [21, 0.8, 20] });

  for (const x of [-9.4, 9.4]) {
    addBox(group, [1.2, 10, 18], [x, 5.4, -0.6], shell);
    physics.addFixedBox({ position: [x, 5.4, -29.6], size: [1.2, 10, 18] });
    for (let z = -7; z <= 6; z += 3.2) {
      addBox(group, [0.15, 6.8, 0.18], [x * 0.93, 5.2, z], cyan);
    }
  }

  addBox(group, [20, 1, 1.3], [0, 9.8, -8.2], frame);
  addBox(group, [20, 0.5, 1.1], [0, 5.6, 7.9], frame);
  const sign = labelSprite('LAB 01 // SINGLE-CELL ATLAS', '#46e7e1');
  sign.position.set(0, 8.15, 8.6);
  group.add(sign);

  for (const x of [-5.8, 0, 5.8]) {
    const pod = new THREE.Group();
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 5.8, 24, 1, true), glass);
    tank.position.y = 4.2;
    pod.add(tank);
    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, 0.42, 24), frame);
    capTop.position.y = 7.1;
    const capBottom = capTop.clone();
    capBottom.position.y = 1.3;
    pod.add(capTop, capBottom);

    const cell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.1, 2),
      new THREE.MeshPhysicalMaterial({
        color: x === 0 ? 0xff4778 : 0x46e7e1,
        emissive: x === 0 ? 0xff4778 : 0x46e7e1,
        emissiveIntensity: 1.2,
        roughness: 0.18,
        transparent: true,
        opacity: 0.72,
      }),
    );
    cell.position.y = 4.3;
    pod.add(cell);
    animated.push({ object: cell, type: 'cell', speed: 0.42 + Math.abs(x) * 0.025, baseY: 4.3 });
    pod.position.x = x;
    group.add(pod);
  }

  addPipe(group, [-8.7, 8.7, -7.5], [8.7, 8.7, -7.5], 0.22, magenta);
  addPipe(group, [-8.7, 8.1, -6.8], [8.7, 8.1, -6.8], 0.16, cyan);
  for (const x of [-5.8, 0, 5.8]) {
    addPipe(group, [x, 7.2, -6.8], [x, 7.2, 0], 0.12, cyan);
  }

  const helix = new THREE.Group();
  const bead = new THREE.SphereGeometry(0.16, 10, 8);
  for (let index = 0; index < 28; index += 1) {
    const angle = index * 0.56;
    const y = index * 0.3;
    for (const side of [-1, 1]) {
      const point = new THREE.Mesh(bead, side < 0 ? cyan : magenta);
      point.position.set(Math.sin(angle) * 1.2 * side, y, Math.cos(angle) * 1.2 * side);
      helix.add(point);
    }
  }
  helix.position.set(0, 1.2, -6);
  highDetail.add(helix);
  animated.push({ object: helix, type: 'spin', speed: 0.18, baseY: 1.2 });

  enableShadows(group);
  scene.add(group);
  return group;
}

function addSkyline(scene, physics, random, mediumDetail) {
  const material = surface(0x0a1015, 0.4, 0.72);
  const cyan = glow('#257f86', 1.4);
  const pink = glow('#8d2448', 1.5);
  const positions = [
    [-39, -31, 10, 24, 11], [39, -28, 12, 31, 12], [-37, 7, 11, 19, 13],
    [38, 10, 13, 25, 10], [-31, 34, 15, 18, 11], [32, 37, 12, 22, 13],
    [-43, 38, 8, 30, 8], [43, 42, 9, 20, 9], [-43, -2, 8, 15, 10],
    [44, -1, 7, 17, 11], [-28, -43, 15, 22, 8], [29, -43, 13, 28, 9],
  ];

  for (let index = 0; index < positions.length; index += 1) {
    const [x, z, width, height, depth] = positions[index];
    const tower = new THREE.Group();
    addBox(tower, [width, height, depth], [0, height / 2, 0], material);
    for (let floor = 2; floor < height - 2; floor += 2.7) {
      const band = addBox(tower, [width + 0.08, 0.06, depth + 0.08], [0, floor, 0], index % 2 ? pink : cyan);
      band.material = index % 2 ? pink : cyan;
    }
    if (index % 3 === 0) {
      addPipe(tower, [0, height, 0], [0, height + 4 + random() * 4, 0], 0.08, cyan);
    }
    tower.position.set(x, 0, z);
    enableShadows(tower);
    mediumDetail.add(tower);
    physics.addFixedBox({ position: [x, height / 2, z], size: [width, height, depth] });
  }
  scene.add(mediumDetail);
}

function addStreetFurniture(scene, physics, mediumDetail) {
  const pole = surface(0x202b31, 0.3, 0.88);
  const lightMaterial = glow('#46e7e1', 4);
  for (const side of [-1, 1]) {
    for (let z = 34; z >= -12; z -= 8) {
      const group = new THREE.Group();
      const x = side * 7.2;
      addBox(group, [0.15, 4.8, 0.15], [x, 2.4, z], pole);
      addBox(group, [1.35, 0.12, 0.12], [x - side * 0.55, 4.75, z], pole);
      addBox(group, [0.75, 0.08, 0.22], [x - side * 1.0, 4.62, z], lightMaterial);
      mediumDetail.add(group);
      physics.addFixedBox({ position: [x, 2.2, z], size: [0.34, 4.4, 0.34] });
    }
  }
  scene.add(mediumDetail);
}


const ROUTE_ORDER = ['origin', 'llmpet', 'medagent', 'scrna', 'bulk', 'origin'];

function addRouteNetwork(scene) {
  const nodes = new Map(physicalDistricts.map((district) => [district.id, district]));
  const roadMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0a1013,
    roughness: 0.24,
    metalness: 0.55,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  });
  const edgeMaterial = glow('#31bac2', 1.25);

  for (let index = 0; index < ROUTE_ORDER.length - 1; index += 1) {
    const from = nodes.get(ROUTE_ORDER[index]);
    const to = nodes.get(ROUTE_ORDER[index + 1]);
    if (!from || !to) continue;
    const dx = to.position[0] - from.position[0];
    const dz = to.position[1] - from.position[1];
    const length = Math.hypot(dx, dz);
    const segment = new THREE.Group();
    addBox(segment, [7.8, 0.055, length], [0, 0, 0], roadMaterial);
    addBox(segment, [0.08, 0.075, length], [-3.72, 0.045, 0], edgeMaterial);
    addBox(segment, [0.08, 0.075, length], [3.72, 0.045, 0], edgeMaterial);
    segment.position.set(
      (from.position[0] + to.position[0]) * 0.5,
      0.035,
      (from.position[1] + to.position[1]) * 0.5,
    );
    segment.rotation.y = Math.atan2(dx, dz);
    scene.add(segment);
  }
}

function addMatureDistricts(scene, physics, matureAssets, landmarks, mediumDetail) {
  if (!matureAssets?.available) return;

  const authoredIds = new Set(['bulk', 'medagent', 'llmpet']);
  for (const district of physicalDistricts) {
    if (!authoredIds.has(district.id)) continue;
    const group = new THREE.Group();
    group.position.set(district.position[0], 0, district.position[1]);

    const model = matureAssets.clone('platform4') || matureAssets.clone('platform2');
    if (model) {
      model.scale.setScalar(1.78);
      model.position.y = 6.68;
      model.rotation.y = district.id === 'bulk' ? Math.PI * 0.5 : district.id === 'llmpet' ? Math.PI : 0;
      group.add(model);
    }

    const label = labelSprite(district.code, district.color);
    label.position.set(0, 9.2, 0);
    group.add(label);
    const beacon = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.06, 8, 48), glow(district.color, 1.8));
    beacon.rotation.x = Math.PI / 2;
    beacon.position.y = 0.15;
    group.add(beacon);
    const light = new THREE.PointLight(district.color, 42, 15, 2);
    light.position.y = 5.5;
    group.add(light);

    scene.add(group);
    landmarks.set(district.id, group);
    physics.addFixedBox({
      position: [district.position[0], 2.1, district.position[1]],
      size: [8.2, 4.2, 7.2],
      friction: 1.1,
    });
  }

  const gatewaySites = [
    { id: 'origin', offset: [-8.5, 0], rotation: Math.PI * 0.5 },
    { id: 'scrna', offset: [8.5, 0], rotation: -Math.PI * 0.5 },
  ];
  for (const site of gatewaySites) {
    const district = physicalDistricts.find((item) => item.id === site.id);
    const connector = matureAssets.clone('platform2');
    if (!district || !connector) continue;
    connector.scale.setScalar(1.35);
    connector.position.set(
      district.position[0] + site.offset[0],
      5.1,
      district.position[1] + site.offset[1],
    );
    connector.rotation.y = site.rotation;
    mediumDetail.add(connector);
  }
}

export function createWorld(scene, physics, renderer, initialQuality = 'medium', matureAssets = null, reducedMotion = false) {
  const random = seededRandom(221022);
  const animated = [];
  const mediumDetail = new THREE.Group();
  const highDetail = new THREE.Group();
  const dynamicObjects = [];
  const fragments = [];
  const landmarks = new Map();

  scene.background = new THREE.Color(0x030709);
  scene.fog = new THREE.FogExp2(0x071014, 0.021);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  pmrem.dispose();

  const hemisphere = new THREE.HemisphereLight(0x5e8190, 0x020405, 0.72);
  scene.add(hemisphere);
  const moon = new THREE.DirectionalLight(0xa9d7e9, 3.1);
  moon.position.set(-18, 32, 24);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.left = -48;
  moon.shadow.camera.right = 48;
  moon.shadow.camera.top = 48;
  moon.shadow.camera.bottom = -48;
  moon.shadow.camera.near = 1;
  moon.shadow.camera.far = 110;
  scene.add(moon);

  const labLight = new THREE.PointLight(0x46e7e1, 180, 45, 2);
  labLight.position.set(0, 8, -22);
  scene.add(labLight);
  const hubLight = new THREE.PointLight(0xf4e65b, 90, 26, 2);
  hubLight.position.set(0, 7, 20);
  scene.add(hubLight);
  const magentaLight = new THREE.PointLight(0xff4778, 75, 28, 2);
  magentaLight.position.set(8, 6, -4);
  scene.add(magentaLight);

  const asphalt = createAsphaltTexture();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshPhysicalMaterial({
      map: asphalt,
      color: 0x182025,
      roughness: 0.24,
      metalness: 0.48,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  physics.addFixedBox({ position: [0, -0.3, 0], size: [100, 0.6, 100], friction: 1.35 });

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(15, 88),
    new THREE.MeshPhysicalMaterial({
      color: 0x0b1013,
      roughness: 0.2,
      metalness: 0.6,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    }),
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.015, -1);
  road.receiveShadow = true;
  scene.add(road);

  const laneMaterial = glow('#46e7e1', 2.2);
  for (const x of [-6.7, 6.7]) addBox(scene, [0.08, 0.035, 88], [x, 0.055, -1], laneMaterial);
  for (let z = 39; z > -42; z -= 5) addBox(scene, [0.08, 0.025, 2.3], [0, 0.05, z], laneMaterial);
  addRouteNetwork(scene);

  for (let index = 0; index < 16; index += 1) {
    const puddle = new THREE.Mesh(
      new THREE.CircleGeometry(0.8 + random() * 2.2, 24),
      new THREE.MeshPhysicalMaterial({
        color: index % 3 === 0 ? 0x183e43 : 0x111b20,
        roughness: 0.04,
        metalness: 0.82,
        transparent: true,
        opacity: 0.52,
      }),
    );
    puddle.rotation.x = -Math.PI / 2;
    puddle.scale.y = 0.35 + random() * 0.5;
    puddle.position.set((random() - 0.5) * 70, 0.025, (random() - 0.5) * 86);
    mediumDetail.add(puddle);
  }

  addSkyline(scene, physics, random, mediumDetail);
  addStreetFurniture(scene, physics, mediumDetail);
  landmarks.set('origin', addTransitHub(scene, physics, animated));
  landmarks.set('scrna', addSingleCellLab(scene, physics, animated, highDetail));
  addMatureDistricts(scene, physics, matureAssets, landmarks, mediumDetail);

  const rampRotation = quaternionFromEuler(-0.23, 0, 0);
  const ramp = addBox(scene, [7.4, 0.5, 9.5], [10.5, 1.25, 1], surface(0x253038, 0.34, 0.78), [-0.23, 0, 0]);
  ramp.castShadow = ramp.receiveShadow = true;
  addBox(scene, [7.1, 0.06, 8.7], [10.5, 1.58, 1], glow('#ff4778', 2.4), [-0.23, 0, 0]);
  physics.addFixedBox({
    position: [10.5, 1.25, 1],
    size: [7.4, 0.5, 9.5],
    rotation: rampRotation,
    friction: 1.15,
  });

  const crateMaterial = surface(0x30383a, 0.58, 0.62);
  const crateGlow = glow('#f4e65b', 2.1);
  const cratePositions = [[-4.2, 1, 5], [-5.7, 1, 3.5], [4.8, 1, -7], [6.3, 1, -8.4], [-3, 1, -10]];
  for (const position of cratePositions) {
    const group = new THREE.Group();
    addBox(group, [1.7, 1.7, 1.7], [0, 0, 0], crateMaterial);
    addBox(group, [1.75, 0.08, 1.75], [0, 0.48, 0], crateGlow);
    group.position.set(...position);
    scene.add(group);
    const dynamic = physics.addDynamicBox({ position, size: [1.7, 1.7, 1.7], density: 5 });
    dynamicObjects.push({ mesh: group, body: dynamic.body });
  }

  const fragmentGeometry = new THREE.OctahedronGeometry(0.38, 0);
  const fragmentMaterial = glow('#f4e65b', 4.8);
  const fragmentPositions = [[0, 1.5, 31], [14, 1.5, 23], [25, 1.5, 7], [23, 1.5, -15], [10, 1.5, -26], [-7, 1.5, -27], [-23, 1.5, -16], [-18, 1.5, 8]];
  fragmentPositions.forEach((position, index) => {
    const mesh = new THREE.Mesh(fragmentGeometry, fragmentMaterial);
    mesh.position.set(...position);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.035, 8, 32), fragmentMaterial);
    halo.rotation.x = Math.PI / 2;
    mesh.add(halo);
    mesh.userData.baseY = position[1];
    scene.add(mesh);
    fragments.push({ id: 'fragment-' + index, mesh, collected: false });
  });

  const rain = createRain(random);
  scene.add(rain);

  const beamMaterial = new THREE.MeshBasicMaterial({
    color: 0x46e7e1,
    transparent: true,
    opacity: 0.035,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  for (const x of [-6, 6]) {
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 4.5, 18, 24, 1, true), beamMaterial);
    beam.position.set(x, 9, -26);
    highDetail.add(beam);
  }
  scene.add(highDetail);

  for (const x of [-50.5, 50.5]) physics.addFixedBox({ position: [x, 4, 0], size: [1, 8, 102] });
  for (const z of [-50.5, 50.5]) physics.addFixedBox({ position: [0, 4, z], size: [102, 8, 1] });

  function setQuality(level) {
    mediumDetail.visible = level !== 'low';
    highDetail.visible = !reducedMotion && level === 'high';
    rain.visible = !reducedMotion;
    rain.geometry.setDrawRange(0, { low: 440, medium: 1040, high: 1800 }[level]);
    moon.castShadow = level !== 'low';
  }

  function update(elapsed, delta, focus) {
    if (!reducedMotion) {
      for (const item of animated) {
        if (item.type === 'spin') {
          item.object.rotation.y += delta * item.speed;
          item.object.position.y = item.baseY + Math.sin(elapsed * item.speed * 2) * 0.16;
        } else if (item.type === 'ring') {
          item.object.rotation.z += delta * item.speed;
        } else if (item.type === 'cell') {
          item.object.rotation.x += delta * item.speed;
          item.object.rotation.y -= delta * item.speed * 0.7;
          item.object.position.y = item.baseY + Math.sin(elapsed * item.speed * 3) * 0.24;
        }
      }

      for (const fragment of fragments) {
        if (fragment.collected) continue;
        fragment.mesh.rotation.y += delta * 1.7;
        fragment.mesh.rotation.x += delta * 0.55;
        fragment.mesh.position.y =
          fragment.mesh.userData.baseY + Math.sin(elapsed * 2 + fragment.mesh.position.x) * 0.22;
      }

      const positions = rain.geometry.attributes.position.array;
      const speeds = rain.userData.speeds;
      for (let index = 0; index < speeds.length; index += 1) {
        const offset = index * 6;
        const drop = speeds[index] * delta;
        positions[offset + 1] -= drop;
        positions[offset + 4] -= drop;
        if (positions[offset + 4] < 0) {
          const resetY = 25 + random() * 8;
          const length = 0.75 + random() * 0.9;
          positions[offset + 1] = resetY;
          positions[offset + 4] = resetY - length;
        }
      }
      rain.geometry.attributes.position.needsUpdate = true;
      if (focus) rain.position.set(focus.x, 0, focus.z);
    }

    for (const item of dynamicObjects) {
      const position = item.body.translation();
      const rotation = item.body.rotation();
      item.mesh.position.set(position.x, position.y, position.z);
      item.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }
  }

  function collectNear(position) {
    const collected = [];
    for (const fragment of fragments) {
      if (fragment.collected || fragment.mesh.position.distanceTo(position) > 2.1) continue;
      fragment.collected = true;
      fragment.mesh.visible = false;
      collected.push(fragment.id);
    }
    return collected;
  }

  setQuality(initialQuality);
  return {
    landmarks,
    physicalNodes: physicalDistricts,
    fragments,
    fragmentTotal: fragments.length,
    setQuality,
    update,
    collectNear,
  };
}
