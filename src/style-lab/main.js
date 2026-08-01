import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { STYLE_DEMOS, getStyleNeighbors } from './config.js';
import './styles.css';

const canvas = document.querySelector('#style-scene');
const styleKey = document.body.dataset.style;
const demo = STYLE_DEMOS[styleKey];
const loadingPanel = document.querySelector('#loading-panel');
const progressBar = document.querySelector('#style-progress');
const progressLabel = document.querySelector('#style-progress-label');
const fallback = document.querySelector('#style-fallback');

if (!demo) {
  window.location.replace('/style-lab/');
} else {
  hydrateInterface(demo);
  boot(demo);
}

function hydrateInterface(config) {
  document.documentElement.style.setProperty('--accent', config.accent);
  document.title = config.shortTitle + ' / Style Lab';
  document.querySelector('#style-index').textContent = config.index + ' / 04';
  document.querySelector('#style-kicker').textContent = config.kicker;
  document.querySelector('#style-title').textContent = config.title;
  document.querySelector('#style-description').textContent = config.description;

  const sourceLinks = document.querySelectorAll('[data-source-link]');
  for (const link of sourceLinks) {
    link.href = config.sourceUrl;
    link.textContent = config.sourceLabel;
  }
  document.querySelector('#style-license').textContent = config.license;

  const neighbors = getStyleNeighbors(config.slug);
  const previous = document.querySelector('#previous-style');
  const next = document.querySelector('#next-style');
  previous.href = '/style-lab/' + neighbors.previous.slug + '.html';
  previous.querySelector('span').textContent = neighbors.previous.shortTitle;
  next.href = '/style-lab/' + neighbors.next.slug + '.html';
  next.querySelector('span').textContent = neighbors.next.shortTitle;
}

async function boot(config) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch (error) {
    showFallback(config, error);
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = config.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(config.background);
  scene.fog = new THREE.FogExp2(config.fog, config.fogDensity);

  const camera = new THREE.PerspectiveCamera(config.camera.fov, window.innerWidth / window.innerHeight, 0.1, 130);
  const controls = createFixedShowcaseCamera(camera, canvas, config.camera);

  const hemisphere = new THREE.HemisphereLight(0xffffff, config.ground, styleKey === 'space' ? 1.6 : 2.15);
  scene.add(hemisphere);

  const sunlight = new THREE.DirectionalLight(0xffffff, styleKey === 'space' ? 3.3 : 3.8);
  sunlight.position.set(-10, 18, -8);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.camera.left = -21;
  sunlight.shadow.camera.right = 21;
  sunlight.shadow.camera.top = 21;
  sunlight.shadow.camera.bottom = -21;
  sunlight.shadow.camera.near = 1;
  sunlight.shadow.camera.far = 55;
  scene.add(sunlight);

  addDisplayPlinth(scene, config);
  if (config.stars) addStars(scene);

  const loader = new GLTFLoader();
  let completed = 0;
  let loaded = 0;
  const failures = [];

  await Promise.all(
    config.assets.map(async (asset) => {
      try {
        const gltf = await loader.loadAsync(asset.path);
        const normalized = normalizeModel(gltf.scene, asset.size);
        for (const placement of asset.placements) {
          const copy = normalized.clone(true);
          copy.position.fromArray(placement.position);
          copy.rotation.y = placement.rotation || 0;
          scene.add(copy);
        }
        loaded += 1;
      } catch (error) {
        failures.push({ path: asset.path, error });
      } finally {
        completed += 1;
        const percent = Math.round((completed / config.assets.length) * 100);
        progressBar.style.width = percent + '%';
        progressLabel.textContent = 'Loading original models · ' + completed + ' / ' + config.assets.length;
      }
    }),
  );

  if (loaded === 0) {
    showFallback(config, failures[0] && failures[0].error);
    renderer.dispose();
    return;
  }

  loadingPanel.classList.add('is-complete');
  progressLabel.textContent =
    failures.length === 0
      ? config.assets.length + ' original model files ready'
      : loaded + ' ready · ' + failures.length + ' unavailable';
  document.body.dataset.ready = 'true';

  window.setTimeout(() => loadingPanel.setAttribute('hidden', ''), 850);

  const clock = new THREE.Clock();
  function render() {
    controls.update();
    renderer.render(scene, camera);
    clock.getDelta();
    requestAnimationFrame(render);
  }
  render();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function normalizeModel(model, desiredSize) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const dimensions = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDimension = Math.max(dimensions.x, dimensions.y, dimensions.z, 0.001);
  const scale = desiredSize / maxDimension;

  model.scale.setScalar(scale);
  model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
  model.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
  });

  const wrapper = new THREE.Group();
  wrapper.add(model);
  return wrapper;
}

function addDisplayPlinth(scene, config) {
  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(18, 18, 0.7, 64),
    new THREE.MeshStandardMaterial({
      color: config.ground,
      roughness: 0.86,
      metalness: styleKey === 'space' ? 0.12 : 0,
    }),
  );
  ground.position.y = -0.39;
  ground.receiveShadow = true;
  scene.add(ground);

  const edge = new THREE.Mesh(
    new THREE.TorusGeometry(18, 0.13, 10, 128),
    new THREE.MeshStandardMaterial({
      color: config.groundEdge,
      roughness: 0.65,
      emissive: styleKey === 'space' ? config.accent : '#000000',
      emissiveIntensity: styleKey === 'space' ? 0.22 : 0,
    }),
  );
  edge.rotation.x = Math.PI / 2;
  edge.position.y = -0.03;
  scene.add(edge);
}

function addStars(scene) {
  const count = 900;
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const radius = 45 + Math.random() * 45;
    const theta = Math.random() * Math.PI * 2;
    const height = 8 + Math.random() * 44;
    positions[index * 3] = Math.cos(theta) * radius;
    positions[index * 3 + 1] = height;
    positions[index * 3 + 2] = Math.sin(theta) * radius;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xdde7ff, size: 0.2, sizeAttenuation: true }),
  );
  scene.add(stars);
}

function createFixedShowcaseCamera(camera, element, options) {
  const target = new THREE.Vector3(0, options.focusY, 0);
  const theta = Math.PI * 0.25;
  const phi = Math.PI * 0.31;
  let radius = options.radius;
  const activePointers = new Map();
  let lastSingle = null;
  let lastPinchDistance = 0;

  function clampTarget() {
    target.x = THREE.MathUtils.clamp(target.x, -options.panLimit, options.panLimit);
    target.z = THREE.MathUtils.clamp(target.z, -options.panLimit, options.panLimit);
  }

  function pan(dx, dy) {
    const scale = radius * 0.00175;
    const right = new THREE.Vector3(Math.cos(theta), 0, -Math.sin(theta));
    const forward = new THREE.Vector3(-Math.sin(theta), 0, -Math.cos(theta));
    target.addScaledVector(right, -dx * scale);
    target.addScaledVector(forward, dy * scale);
    clampTarget();
  }

  element.addEventListener('pointerdown', (event) => {
    element.setPointerCapture(event.pointerId);
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (activePointers.size === 1) lastSingle = { x: event.clientX, y: event.clientY };
  });

  element.addEventListener('pointermove', (event) => {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = Array.from(activePointers.values());

    if (points.length === 1) {
      if (lastSingle) pan(event.clientX - lastSingle.x, event.clientY - lastSingle.y);
      lastSingle = { x: event.clientX, y: event.clientY };
      lastPinchDistance = 0;
    } else if (points.length === 2) {
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      if (lastPinchDistance > 0) {
        radius = THREE.MathUtils.clamp(
          radius + (lastPinchDistance - distance) * 0.035,
          options.minRadius,
          options.maxRadius,
        );
      }
      lastPinchDistance = distance;
      lastSingle = null;
    }
  });

  function release(event) {
    activePointers.delete(event.pointerId);
    lastPinchDistance = 0;
    const remaining = Array.from(activePointers.values());
    lastSingle = remaining.length === 1 ? remaining[0] : null;
  }
  element.addEventListener('pointerup', release);
  element.addEventListener('pointercancel', release);

  element.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      radius = THREE.MathUtils.clamp(radius + event.deltaY * 0.012, options.minRadius, options.maxRadius);
    },
    { passive: false },
  );

  function update() {
    const horizontal = Math.sin(phi) * radius;
    camera.position.set(
      target.x + Math.cos(theta) * horizontal,
      target.y + Math.cos(phi) * radius,
      target.z + Math.sin(theta) * horizontal,
    );
    camera.lookAt(target);
  }

  update();
  return { update };
}

function showFallback(config, error) {
  document.body.dataset.ready = 'fallback';
  canvas.setAttribute('hidden', '');
  loadingPanel.setAttribute('hidden', '');
  fallback.removeAttribute('hidden');
  document.querySelector('#fallback-title').textContent = config.title;
  document.querySelector('#fallback-copy').textContent =
    'WebGL is unavailable in this browser. The source pack and the other style demos are still accessible.';
  if (error) console.error('Style Lab could not start', error);
}
