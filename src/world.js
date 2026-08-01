import * as THREE from 'three';
import { districts } from './content.js';

function seededRandom(seed) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function neonMaterial(color, intensity = 1.7) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color).multiplyScalar(0.22),
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    metalness: 0.68,
    roughness: 0.25,
  });
}

function createLabel(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = 'rgba(3, 6, 12, 0.88)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = color;
  context.lineWidth = 8;
  context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
  context.fillStyle = '#f4fbff';
  context.font = '700 42px Orbitron, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
  sprite.scale.set(8.5, 1.7, 1);
  return sprite;
}

function addRoad(scene, x, z, width, depth) {
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.08, depth),
    new THREE.MeshStandardMaterial({
      color: 0x080c13,
      metalness: 0.4,
      roughness: 0.76,
    }),
  );
  road.position.set(x, 0.02, z);
  scene.add(road);

  const isVertical = depth > width;
  const lineGeometry = new THREE.BoxGeometry(
    isVertical ? 0.08 : width * 0.92,
    0.035,
    isVertical ? depth * 0.92 : 0.08,
  );
  const lineMaterial = neonMaterial(0x00f0ff, 2.6);
  for (const offset of [-0.42, 0.42]) {
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.set(
      x + (isVertical ? width * offset : 0),
      0.09,
      z + (isVertical ? 0 : depth * offset),
    );
    scene.add(line);
  }
}

function addDnaHelix(group, colorA, colorB) {
  const beadGeometry = new THREE.SphereGeometry(0.18, 10, 8);
  const rungGeometry = new THREE.CylinderGeometry(0.035, 0.035, 1.75, 6);
  const materialA = neonMaterial(colorA, 2.2);
  const materialB = neonMaterial(colorB, 2.2);
  const rungMaterial = new THREE.MeshBasicMaterial({ color: 0x64758a });

  for (let index = 0; index < 20; index += 1) {
    const y = index * 0.38;
    const angle = index * 0.62;
    const ax = Math.sin(angle) * 0.92;
    const az = Math.cos(angle) * 0.92;
    const a = new THREE.Mesh(beadGeometry, materialA);
    const b = new THREE.Mesh(beadGeometry, materialB);
    a.position.set(ax, y, az);
    b.position.set(-ax, y, -az);
    group.add(a, b);

    if (index % 2 === 0) {
      const rung = new THREE.Mesh(rungGeometry, rungMaterial);
      rung.position.set(0, y, 0);
      rung.rotation.z = Math.PI / 2;
      rung.rotation.y = -angle;
      group.add(rung);
    }
  }
}

function addDistrictDecoration(group, district, animated, highDetailItems) {
  if (district.id === 'origin') {
    const helix = new THREE.Group();
    addDnaHelix(helix, '#00f0ff', '#ff2f7d');
    helix.position.set(0, 1.5, 0);
    group.add(helix);
    animated.push({ object: helix, type: 'rotate', speed: 0.22 });
    return;
  }

  if (district.id === 'scrna') {
    const random = seededRandom(31);
    const count = 170;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const cluster = index % 4;
      positions[index * 3] = (cluster - 1.5) * 1.15 + (random() - 0.5) * 1.8;
      positions[index * 3 + 1] = 4.5 + random() * 5;
      positions[index * 3 + 2] = (random() - 0.5) * 4;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: district.color,
        size: 0.12,
        transparent: true,
        opacity: 0.85,
      }),
    );
    group.add(points);
    highDetailItems.push(points);
    animated.push({ object: points, type: 'rotate', speed: 0.12 });
    return;
  }

  if (district.id === 'bulk') {
    for (let index = -2; index <= 2; index += 1) {
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.34, 4.5 + Math.abs(index) * 0.55, 10),
        neonMaterial(index % 2 ? '#fcee0a' : district.color, 1.5),
      );
      tube.position.set(index * 0.82, 4.4, 0);
      group.add(tube);
    }
    return;
  }

  if (district.id === 'medagent') {
    for (let index = 0; index < 3; index += 1) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.1 + index * 0.62, 0.08, 8, 36),
        neonMaterial(index === 1 ? '#00f0ff' : district.color, 2),
      );
      ring.position.y = 5.1;
      ring.rotation.x = Math.PI / 2 + index * 0.44;
      group.add(ring);
      animated.push({ object: ring, type: 'ring', speed: 0.25 + index * 0.1 });
    }
    return;
  }

  if (district.id === 'llmpet') {
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 18, 12),
      neonMaterial(district.color, 1.2),
    );
    head.position.y = 5.2;
    head.scale.y = 0.82;
    group.add(head);
    for (const x of [-0.5, 0.5]) {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 10, 8),
        neonMaterial('#00f0ff', 3),
      );
      eye.position.set(x, 5.35, 1.28);
      group.add(eye);
    }
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.25, 8),
      neonMaterial('#ff2f7d', 2),
    );
    antenna.position.set(0, 6.65, 0);
    group.add(antenna);
  }
}

export function createWorld(scene, initialQuality = 'medium') {
  scene.background = new THREE.Color(0x03050a);
  scene.fog = new THREE.FogExp2(0x03050a, 0.018);

  const obstacles = [];
  const landmarks = new Map();
  const animated = [];
  const lowDetail = new THREE.Group();
  const highDetail = new THREE.Group();
  const highDetailItems = [];
  scene.add(lowDetail, highDetail);

  const hemisphere = new THREE.HemisphereLight(0x5079a8, 0x05070c, 1.3);
  scene.add(hemisphere);

  const moon = new THREE.DirectionalLight(0x9ebcff, 2.4);
  moon.position.set(24, 38, 18);
  scene.add(moon);

  const cyanLight = new THREE.PointLight(0x00f0ff, 80, 42, 2);
  cyanLight.position.set(-20, 9, 4);
  scene.add(cyanLight);
  const pinkLight = new THREE.PointLight(0xff2f7d, 70, 38, 2);
  pinkLight.position.set(22, 8, -25);
  scene.add(pinkLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 120),
    new THREE.MeshStandardMaterial({
      color: 0x05070c,
      roughness: 0.92,
      metalness: 0.12,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.04;
  scene.add(ground);

  const grid = new THREE.GridHelper(120, 60, 0x0b5b65, 0x111a25);
  grid.position.y = 0.005;
  scene.add(grid);

  addRoad(scene, 0, -5, 10, 110);
  addRoad(scene, 0, 0, 110, 10);
  addRoad(scene, 0, -31, 78, 9);
  addRoad(scene, -22, -17, 8, 28);
  addRoad(scene, 22, -17, 8, 28);

  const random = seededRandom(221022);
  const skylineMaterial = new THREE.MeshStandardMaterial({
    color: 0x080d16,
    emissive: 0x06151e,
    emissiveIntensity: 0.65,
    metalness: 0.55,
    roughness: 0.5,
  });

  for (let index = 0; index < 62; index += 1) {
    const edge = index % 4;
    const along = -51 + random() * 102;
    const inset = 43 + random() * 9;
    const x = edge < 2 ? (edge === 0 ? -inset : inset) : along;
    const z = edge >= 2 ? (edge === 2 ? -inset : inset) : along;
    const height = 3 + random() * 15;
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(2.2 + random() * 4, height, 2.2 + random() * 4),
      skylineMaterial,
    );
    building.position.set(x, height / 2, z);
    building.rotation.y = random() * 0.3;
    lowDetail.add(building);

    if (index % 3 === 0) {
      const beacon = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, height * 0.75, 0.08),
        neonMaterial(index % 2 ? '#00f0ff' : '#ff2f7d', 1.5),
      );
      beacon.position.set(x, height / 2, z + 1.5);
      lowDetail.add(beacon);
    }
  }

  for (const district of districts) {
    const [x, z] = district.position;
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.userData.districtId = district.id;

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(district.id === 'origin' ? 5.2 : 4, district.id === 'origin' ? 6 : 4.8, 0.9, 8),
      new THREE.MeshStandardMaterial({
        color: 0x080b12,
        emissive: new THREE.Color(district.color).multiplyScalar(0.08),
        emissiveIntensity: 1,
        metalness: 0.82,
        roughness: 0.34,
      }),
    );
    base.position.y = 0.45;
    group.add(base);

    if (district.id !== 'origin') {
      const towerHeight = 5.7;
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, towerHeight, 4.8),
        new THREE.MeshStandardMaterial({
          color: 0x070b12,
          emissive: new THREE.Color(district.color).multiplyScalar(0.08),
          emissiveIntensity: 1,
          metalness: 0.76,
          roughness: 0.3,
        }),
      );
      tower.position.y = towerHeight / 2 + 0.8;
      group.add(tower);

      for (const offset of [-1.72, 1.72]) {
        const fin = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 4.8, 0.1),
          neonMaterial(district.color, 2.2),
        );
        fin.position.set(offset, 3.6, 2.43);
        group.add(fin);
      }
    }

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(district.id === 'origin' ? 5.5 : 4.3, 0.08, 8, 48),
      neonMaterial(district.color, 2.6),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.98;
    group.add(ring);
    animated.push({ object: ring, type: 'pulse', speed: 1.3 });

    const label = createLabel(district.code, district.color);
    label.position.set(0, district.id === 'origin' ? 10.3 : 8.2, 0);
    group.add(label);
    animated.push({ object: label, type: 'float', baseY: label.position.y, speed: 0.9 });

    addDistrictDecoration(group, district, animated, highDetailItems);
    scene.add(group);
    landmarks.set(district.id, group);
    obstacles.push({ x, z, radius: district.id === 'origin' ? 5.7 : 4.7 });
  }

  const starGeometry = new THREE.BufferGeometry();
  const starCount = 700;
  const starPositions = new Float32Array(starCount * 3);
  for (let index = 0; index < starCount; index += 1) {
    starPositions[index * 3] = (random() - 0.5) * 180;
    starPositions[index * 3 + 1] = 18 + random() * 75;
    starPositions[index * 3 + 2] = (random() - 0.5) * 180;
  }
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({ color: 0x77dce4, size: 0.12, transparent: true, opacity: 0.7 }),
  );
  highDetail.add(stars);

  function setQuality(level) {
    lowDetail.visible = level !== 'low';
    highDetail.visible = level === 'high';
    highDetailItems.forEach((item) => {
      item.visible = level === 'high';
    });
  }

  function update(elapsed) {
    for (const item of animated) {
      if (item.type === 'rotate') item.object.rotation.y = elapsed * item.speed;
      if (item.type === 'ring') {
        item.object.rotation.y += 0.003 * item.speed;
        item.object.rotation.z += 0.002 * item.speed;
      }
      if (item.type === 'pulse') {
        const scale = 1 + Math.sin(elapsed * item.speed) * 0.018;
        item.object.scale.setScalar(scale);
      }
      if (item.type === 'float') {
        item.object.position.y = item.baseY + Math.sin(elapsed * item.speed) * 0.18;
      }
    }
  }

  setQuality(initialQuality);
  return { obstacles, landmarks, setQuality, update };
}
