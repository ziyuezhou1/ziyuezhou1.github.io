import * as THREE from 'three';
import { districts, copy, worldBounds } from './content.js';
import {
  chooseQuality,
  detectLanguage,
  localize,
  nextQuality,
} from './state.js';
import { createVehicleController } from './vehicle.js';
import { createWorld } from './world.js';

const elements = {
  canvas: document.querySelector('#scene'),
  boot: document.querySelector('#boot-screen'),
  enter: document.querySelector('#enter-button'),
  loadBar: document.querySelector('#load-bar'),
  loadStatus: document.querySelector('#load-status'),
  interface: document.querySelector('#interface'),
  status: document.querySelector('#status-text'),
  missionTitle: document.querySelector('#mission-title'),
  missionCopy: document.querySelector('#mission-copy'),
  controlDrive: document.querySelector('#control-drive'),
  controlBoost: document.querySelector('#control-boost'),
  controlBrake: document.querySelector('#control-brake'),
  controlReset: document.querySelector('#control-reset'),
  districtTitle: document.querySelector('#district-title'),
  districtCount: document.querySelector('#district-count'),
  districtNavigation: document.querySelector('#district-navigation'),
  language: document.querySelector('#language-button'),
  quality: document.querySelector('#quality-button'),
  sound: document.querySelector('#sound-button'),
  resume: document.querySelector('#resume-link'),
  prompt: document.querySelector('#proximity-prompt'),
  promptCopy: document.querySelector('#proximity-copy'),
  panel: document.querySelector('#project-panel'),
  panelClose: document.querySelector('#project-close'),
  panelCode: document.querySelector('#project-code'),
  panelTitle: document.querySelector('#project-title'),
  panelSubtitle: document.querySelector('#project-subtitle'),
  panelDescription: document.querySelector('#project-description'),
  panelHighlights: document.querySelector('#project-highlights'),
  panelTags: document.querySelector('#project-tags'),
  panelLink: document.querySelector('#project-link'),
  panelLinkCopy: document.querySelector('#project-link-copy'),
  radarPoints: document.querySelector('#radar-points'),
  radarRover: document.querySelector('#radar-rover'),
  fallback: document.querySelector('#fallback'),
  fallbackCopy: document.querySelector('#fallback-copy'),
  fallbackList: document.querySelector('#fallback-list'),
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let language = detectLanguage(window.localStorage, navigator.language);
let quality =
  window.localStorage.getItem('genome-city-quality') ||
  chooseQuality({
    width: window.innerWidth,
    dpr: window.devicePixelRatio,
    cores: navigator.hardwareConcurrency,
    reducedMotion,
  });
let soundEnabled = false;
let audioContext;
let renderer;
let camera;
let world;
let vehicle;
let activeDistrict = null;
let nearbyDistrict = null;
let started = false;
const visited = new Set();

function supportsWebGL() {
  try {
    const testCanvas = document.createElement('canvas');
    return Boolean(testCanvas.getContext('webgl2') || testCanvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function beep(frequency = 520, duration = 0.06) {
  if (!soundEnabled) return;
  audioContext ||= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.value = frequency;
  oscillator.type = 'square';
  gain.gain.setValueAtTime(0.035, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function buildNavigation() {
  elements.districtNavigation.replaceChildren();
  districts.forEach((district, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.districtId = district.id;
    button.style.setProperty('--node-color', district.color);

    const code = document.createElement('span');
    code.textContent = String(index).padStart(2, '0');
    const title = document.createElement('strong');
    title.textContent = localize(district.title, language);
    button.append(code, title);

    button.addEventListener('click', () => {
      if (!vehicle) return;
      const [x, z] = district.position;
      vehicle.teleport(x, z + district.radius + 5, x, z);
      beep(620, 0.08);
      window.setTimeout(() => openProject(district), 280);
    });
    elements.districtNavigation.append(button);
  });
}

function buildRadar() {
  elements.radarPoints.replaceChildren();
  for (const district of districts) {
    const point = document.createElement('span');
    point.className = 'radar-point';
    point.dataset.districtId = district.id;
    point.style.setProperty('--node-color', district.color);
    point.style.left = 50 + (district.position[0] / worldBounds) * 44 + '%';
    point.style.top = 50 + (district.position[1] / worldBounds) * 44 + '%';
    elements.radarPoints.append(point);
  }
}

function updateRadar() {
  if (!vehicle) return;
  elements.radarRover.style.left = 50 + (vehicle.position.x / worldBounds) * 44 + '%';
  elements.radarRover.style.top = 50 + (vehicle.position.z / worldBounds) * 44 + '%';
}

function updateLanguage() {
  const text = copy[language];
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  elements.status.textContent = text.status;
  elements.missionTitle.textContent = text.missionTitle;
  elements.missionCopy.textContent = text.missionCopy;
  elements.controlDrive.textContent = text.drive;
  elements.controlBoost.textContent = text.boost;
  elements.controlBrake.textContent = text.brake;
  elements.controlReset.textContent = text.reset;
  elements.districtTitle.textContent = text.nodes.toUpperCase();
  elements.promptCopy.textContent = text.visit;
  elements.resume.textContent = text.resume;
  elements.panelLinkCopy.textContent = text.openGithub;
  elements.sound.textContent = soundEnabled ? text.soundOn.toUpperCase() : text.soundOff.toUpperCase();
  elements.language.textContent = language === 'zh' ? 'EN' : '中文';
  elements.fallbackCopy.textContent = text.fallback;
  buildNavigation();
  renderFallbackCards();
  if (activeDistrict) renderProject(activeDistrict);
}

function renderProject(district) {
  activeDistrict = district;
  elements.panel.style.setProperty('--active-color', district.color);
  elements.panelCode.textContent = district.code;
  elements.panelTitle.textContent = localize(district.title, language);
  elements.panelSubtitle.textContent = localize(district.subtitle, language);
  elements.panelDescription.textContent = localize(district.description, language);
  elements.panelHighlights.replaceChildren();

  for (const highlight of district.highlights[language]) {
    const item = document.createElement('li');
    item.textContent = highlight;
    elements.panelHighlights.append(item);
  }

  elements.panelTags.replaceChildren();
  for (const tag of district.tags) {
    const chip = document.createElement('span');
    chip.textContent = tag;
    elements.panelTags.append(chip);
  }

  elements.panelLink.hidden = !district.href;
  if (district.href) elements.panelLink.href = district.href;
}

function openProject(district) {
  renderProject(district);
  visited.add(district.id);
  elements.panel.hidden = false;
  elements.prompt.hidden = true;
  elements.districtCount.textContent =
    String(visited.size).padStart(2, '0') + ' / ' + String(districts.length).padStart(2, '0');
  document
    .querySelectorAll('[data-district-id]')
    .forEach((node) => node.classList.toggle('is-active', node.dataset.districtId === district.id));
  elements.panelClose.focus();
  beep(760, 0.08);
}

function closeProject() {
  elements.panel.hidden = true;
  activeDistrict = null;
  beep(410, 0.05);
}

function renderFallbackCards() {
  elements.fallbackList.replaceChildren();
  for (const district of districts) {
    const card = document.createElement('article');
    card.className = 'fallback-card';
    card.style.setProperty('--node-color', district.color);

    const title = document.createElement('h2');
    title.textContent = localize(district.title, language);
    const description = document.createElement('p');
    description.textContent = localize(district.description, language);
    card.append(title, description);

    if (district.href) {
      const link = document.createElement('a');
      link.href = district.href;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = copy[language].openGithub + ' ↗';
      card.append(link);
    }
    elements.fallbackList.append(card);
  }
}

function showFallback(error) {
  if (error) console.error(error);
  elements.boot.hidden = true;
  elements.interface.hidden = true;
  elements.canvas.hidden = true;
  elements.fallback.hidden = false;
  document.body.dataset.ready = 'fallback';
  updateLanguage();
}

function setRendererQuality() {
  if (!renderer) return;
  const ratios = { low: 1, medium: 1.35, high: 1.8 };
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, ratios[quality]));
  world?.setQuality(quality);
  elements.quality.textContent = 'Q: ' + quality.toUpperCase();
}

function findNearbyDistrict() {
  if (!vehicle || activeDistrict) return null;
  let nearest = null;
  let nearestDistance = Infinity;

  for (const district of districts) {
    const dx = vehicle.position.x - district.position[0];
    const dz = vehicle.position.z - district.position[1];
    const distance = Math.hypot(dx, dz);
    if (distance < district.radius + 5 && distance < nearestDistance) {
      nearest = district;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function onResize() {
  if (!renderer || !camera) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  setRendererQuality();
}

async function initialize3D() {
  elements.loadBar.style.width = '22%';
  elements.loadStatus.textContent = language === 'zh' ? '正在初始化 WebGL...' : 'INITIALIZING WEBGL...';

  renderer = new THREE.WebGLRenderer({
    canvas: elements.canvas,
    antialias: quality !== 'low',
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 240);
  const scene = new THREE.Scene();

  elements.loadBar.style.width = '55%';
  elements.loadStatus.textContent = language === 'zh' ? '正在生成基因数据城...' : 'GENERATING GENOME CITY...';
  world = createWorld(scene, quality);

  elements.loadBar.style.width = '82%';
  elements.loadStatus.textContent = language === 'zh' ? '正在部署 DNA ROVER...' : 'DEPLOYING DNA ROVER...';
  vehicle = createVehicleController({
    scene,
    camera,
    canvas: elements.canvas,
    obstacles: world.obstacles,
    bounds: worldBounds,
  });

  buildRadar();
  setRendererQuality();
  window.addEventListener('resize', onResize);

  const clock = new THREE.Clock();
  function frame() {
    const delta = clock.getDelta();
    const elapsed = clock.elapsedTime;

    if (!activeDistrict) vehicle.update(delta);
    world.update(elapsed);
    updateRadar();

    const nextNearby = findNearbyDistrict();
    if (nextNearby !== nearbyDistrict) {
      nearbyDistrict = nextNearby;
      elements.prompt.hidden = !nearbyDistrict || !started;
      if (nearbyDistrict) {
        elements.prompt.style.setProperty('--active-color', nearbyDistrict.color);
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  elements.loadBar.style.width = '100%';
  elements.loadStatus.textContent = language === 'zh' ? '城市节点在线。' : 'CITY NODES ONLINE.';
  elements.enter.disabled = false;
  document.body.dataset.ready = 'true';
}

elements.enter.addEventListener('click', () => {
  started = true;
  elements.boot.classList.add('is-hidden');
  elements.interface.hidden = false;
  if (nearbyDistrict) elements.prompt.hidden = false;
  document.body.dataset.started = 'true';
  beep(680, 0.12);
});

elements.language.addEventListener('click', () => {
  language = language === 'zh' ? 'en' : 'zh';
  window.localStorage.setItem('genome-city-language', language);
  updateLanguage();
  beep(580, 0.05);
});

elements.quality.addEventListener('click', () => {
  quality = nextQuality(quality);
  window.localStorage.setItem('genome-city-quality', quality);
  setRendererQuality();
  beep(500, 0.05);
});

elements.sound.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  updateLanguage();
  beep(720, 0.08);
});

elements.prompt.addEventListener('click', () => {
  if (nearbyDistrict) openProject(nearbyDistrict);
});
elements.panelClose.addEventListener('click', closeProject);

window.addEventListener('keydown', (event) => {
  if ((event.code === 'KeyE' || event.code === 'Enter') && nearbyDistrict && !activeDistrict) {
    openProject(nearbyDistrict);
  }
  if (event.code === 'Escape' && activeDistrict) closeProject();
});

updateLanguage();
elements.quality.textContent = 'Q: ' + quality.toUpperCase();

if (!supportsWebGL() || reducedMotion) {
  showFallback();
} else {
  initialize3D().catch(showFallback);
}
