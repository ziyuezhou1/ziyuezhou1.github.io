import * as THREE from 'three';
import { createAudioSystem } from './audio.js';
import { copy, districts, physicalDistricts, worldBounds } from './content.js';
import { createPhysics } from './physics.js';
import { createRendering } from './rendering.js';
import { chooseQuality, detectLanguage, localize, nextQuality } from './state.js';
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
  controlJump: document.querySelector('#control-jump'),
  controlReset: document.querySelector('#control-reset'),
  projects: document.querySelector('#projects-button'),
  language: document.querySelector('#language-button'),
  quality: document.querySelector('#quality-button'),
  sound: document.querySelector('#sound-button'),
  resume: document.querySelector('#resume-link'),
  speed: document.querySelector('#speed-value'),
  speedLabel: document.querySelector('#speed-label'),
  fragment: document.querySelector('#fragment-value'),
  fragmentLabel: document.querySelector('#fragment-label'),
  zone: document.querySelector('#zone-value'),
  radarPoints: document.querySelector('#radar-points'),
  radarRover: document.querySelector('#radar-rover'),
  prompt: document.querySelector('#proximity-prompt'),
  promptCopy: document.querySelector('#proximity-copy'),
  panel: document.querySelector('#project-panel'),
  panelClose: document.querySelector('#project-close'),
  panelTabs: document.querySelector('#project-tabs'),
  panelCode: document.querySelector('#project-code'),
  panelTitle: document.querySelector('#project-title'),
  panelSubtitle: document.querySelector('#project-subtitle'),
  panelDescription: document.querySelector('#project-description'),
  panelHighlights: document.querySelector('#project-highlights'),
  panelTags: document.querySelector('#project-tags'),
  panelLink: document.querySelector('#project-link'),
  panelLinkCopy: document.querySelector('#project-link-copy'),
  toast: document.querySelector('#toast'),
  fallback: document.querySelector('#fallback'),
  fallbackCopy: document.querySelector('#fallback-copy'),
  fallbackList: document.querySelector('#fallback-list'),
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let language = detectLanguage(window.localStorage, navigator.language);
let quality = window.localStorage.getItem('cell-drive-quality') || chooseQuality({
  width: window.innerWidth,
  dpr: window.devicePixelRatio,
  cores: navigator.hardwareConcurrency,
  reducedMotion,
});
let activeDistrict = null;
let nearbyDistrict = null;
let started = false;
let fragmentCount = 0;
let toastTimer = 0;
let rendering;
let physics;
let world;
let vehicle;
let camera;
const audio = createAudioSystem();

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function setToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 1900);
}

function buildRadar() {
  elements.radarPoints.replaceChildren();
  for (const district of physicalDistricts) {
    const point = document.createElement('span');
    point.style.setProperty('--node-color', district.color);
    point.style.left = 50 + (district.position[0] / worldBounds) * 42 + '%';
    point.style.top = 50 + (district.position[1] / worldBounds) * 42 + '%';
    point.dataset.districtId = district.id;
    elements.radarPoints.append(point);
  }
}

function updateRadar() {
  if (!vehicle) return;
  elements.radarRover.style.left = 50 + (vehicle.position.x / worldBounds) * 42 + '%';
  elements.radarRover.style.top = 50 + (vehicle.position.z / worldBounds) * 42 + '%';
}

function renderFallbackCards() {
  elements.fallbackList.replaceChildren();
  for (const district of districts) {
    const card = document.createElement('article');
    card.style.setProperty('--node-color', district.color);
    const code = document.createElement('small');
    code.textContent = district.code;
    const title = document.createElement('h2');
    title.textContent = localize(district.title, language);
    const description = document.createElement('p');
    description.textContent = localize(district.description, language);
    const link = document.createElement('a');
    link.href = district.href;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = copy[language].openGithub + ' ↗';
    card.append(code, title, description, link);
    elements.fallbackList.append(card);
  }
}

function buildProjectTabs() {
  elements.panelTabs.replaceChildren();
  districts.forEach((district, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.districtId = district.id;
    button.style.setProperty('--node-color', district.color);
    button.innerHTML = '<span>' + String(index).padStart(2, '0') + '</span><b>' +
      localize(district.title, language) + '</b>';
    button.addEventListener('click', () => {
      renderProject(district);
      audio.ui();
    });
    elements.panelTabs.append(button);
  });
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
  elements.panelLink.href = district.href;
  elements.panelLink.hidden = !district.href;
  elements.panelLinkCopy.textContent = copy[language].openGithub;
  elements.panelTabs.querySelectorAll('button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.districtId === district.id);
  });
}

function openProject(district = districts[0]) {
  renderProject(district);
  elements.panel.hidden = false;
  elements.prompt.hidden = true;
  document.body.dataset.terminal = 'open';
  elements.panelClose.focus();
  audio.ui();
}

function closeProject() {
  elements.panel.hidden = true;
  activeDistrict = null;
  document.body.dataset.terminal = 'closed';
  if (nearbyDistrict) elements.prompt.hidden = false;
  audio.ui();
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
  elements.controlJump.textContent = text.jump;
  elements.controlReset.textContent = text.reset;
  elements.promptCopy.textContent = text.visit;
  elements.resume.textContent = text.resume;
  elements.sound.textContent = audio.enabled ? text.soundOn.toUpperCase() : text.soundOff.toUpperCase();
  elements.language.textContent = language === 'zh' ? 'EN' : '中文';
  elements.speedLabel.textContent = text.speed;
  elements.fragmentLabel.textContent = text.fragments;
  elements.fallbackCopy.textContent = text.fallback;
  renderFallbackCards();
  buildProjectTabs();
  if (activeDistrict) renderProject(activeDistrict);
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

function updateQuality() {
  rendering?.setQuality(quality);
  world?.setQuality(quality);
  elements.quality.textContent = 'Q: ' + quality.toUpperCase();
}

function findNearbyDistrict() {
  if (!vehicle || activeDistrict) return null;
  let closest = null;
  let closestDistance = Infinity;
  for (const district of physicalDistricts) {
    const distance = Math.hypot(
      vehicle.position.x - district.position[0],
      vehicle.position.z - district.position[1],
    );
    if (distance < district.radius && distance < closestDistance) {
      closest = district;
      closestDistance = distance;
    }
  }
  return closest;
}

function updateTelemetry() {
  if (!vehicle) return;
  elements.speed.textContent = String(Math.round(Math.abs(vehicle.speed) * 3.6)).padStart(3, '0');
  const z = vehicle.position.z;
  elements.zone.textContent = z > 25 ? 'GATE APPROACH' : z > 8 ? 'TRANSIT HUB' : z > -10 ? 'RAMP CORRIDOR' : 'SINGLE-CELL LAB';
}

function onResize() {
  if (!camera || !rendering) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  rendering.resize();
}

async function initialize3D() {
  elements.loadBar.style.width = '12%';
  elements.loadStatus.textContent = language === 'zh' ? '正在初始化高动态范围渲染...' : 'INITIALIZING HDR PIPELINE...';

  const scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 180);
  rendering = createRendering(elements.canvas, scene, camera, quality);

  elements.loadBar.style.width = '31%';
  elements.loadStatus.textContent = language === 'zh' ? '正在加载 Rapier 物理...' : 'LOADING RAPIER PHYSICS...';
  physics = await createPhysics();

  elements.loadBar.style.width = '58%';
  elements.loadStatus.textContent = language === 'zh' ? '正在构建雨夜单细胞实验区...' : 'BUILDING THE RAIN LAB...';
  world = createWorld(scene, physics, rendering.renderer, quality);

  elements.loadBar.style.width = '82%';
  elements.loadStatus.textContent = language === 'zh' ? '正在校准 DNA ROVER 悬挂...' : 'CALIBRATING ROVER SUSPENSION...';
  vehicle = createVehicleController({
    scene,
    camera,
    canvas: elements.canvas,
    physics,
    onImpact: (strength) => audio.impact(strength),
  });

  buildRadar();
  updateQuality();
  window.addEventListener('resize', onResize);

  const clock = new THREE.Clock();
  let accumulator = 0;
  let renderAccumulator = 0;

  function frame() {
    const delta = Math.min(clock.getDelta(), 0.1);
    const elapsed = clock.elapsedTime;
    accumulator = Math.min(accumulator + delta, 0.18);

    while (accumulator >= physics.fixedStep) {
      vehicle.prePhysics(physics.fixedStep, !started || Boolean(activeDistrict));
      physics.step();
      vehicle.postPhysics(physics.fixedStep);
      accumulator -= physics.fixedStep;
    }

    world.update(elapsed, delta, vehicle.position);
    if (started && !activeDistrict) {
      const found = world.collectNear(vehicle.position);
      if (found.length) {
        fragmentCount += found.length;
        elements.fragment.textContent =
          String(fragmentCount).padStart(2, '0') + ' / ' + String(world.fragmentTotal).padStart(2, '0');
        setToast(language === 'zh' ? '数据碎片已同步 +' + found.length : 'DATA FRAGMENT SYNCED +' + found.length);
        audio.ui();
      }
    }

    nearbyDistrict = findNearbyDistrict();
    elements.prompt.hidden = !started || !nearbyDistrict || Boolean(activeDistrict);
    if (nearbyDistrict) elements.prompt.style.setProperty('--active-color', nearbyDistrict.color);

    updateRadar();
    updateTelemetry();
    audio.update(vehicle.speed);
    renderAccumulator += delta;
    if (quality !== 'low' || renderAccumulator >= 1 / 30) {
      rendering.render(renderAccumulator);
      renderAccumulator = 0;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  elements.loadBar.style.width = '100%';
  elements.loadStatus.textContent = language === 'zh' ? '雨夜实验区在线。' : 'RAIN LAB ONLINE.';
  elements.enter.disabled = false;
  document.body.dataset.ready = 'true';
}

elements.enter.addEventListener('click', () => {
  started = true;
  elements.boot.classList.add('is-hidden');
  elements.interface.hidden = false;
  document.body.dataset.started = 'true';
  setToast(copy[language].terminalHint);
});

elements.projects.addEventListener('click', () => openProject(activeDistrict || districts[0]));
elements.language.addEventListener('click', () => {
  language = language === 'zh' ? 'en' : 'zh';
  window.localStorage.setItem('genome-city-language', language);
  updateLanguage();
  audio.ui();
});
elements.quality.addEventListener('click', () => {
  quality = nextQuality(quality);
  window.localStorage.setItem('cell-drive-quality', quality);
  updateQuality();
  audio.ui();
});
elements.sound.addEventListener('click', () => {
  audio.setEnabled(!audio.enabled);
  updateLanguage();
});
elements.prompt.addEventListener('click', () => nearbyDistrict && openProject(nearbyDistrict));
elements.panelClose.addEventListener('click', closeProject);

window.addEventListener('keydown', (event) => {
  if ((event.code === 'KeyE' || event.code === 'Enter') && nearbyDistrict && !activeDistrict) {
    openProject(nearbyDistrict);
  }
  if (event.code === 'Escape' && activeDistrict) closeProject();
});

updateLanguage();
elements.quality.textContent = 'Q: ' + quality.toUpperCase();

if (!supportsWebGL() || reducedMotion) showFallback();
else initialize3D().catch(showFallback);
