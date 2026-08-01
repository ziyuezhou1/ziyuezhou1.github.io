import * as THREE from 'three';
import { createAssetLibrary, VEHICLES } from './assets.js';
import { createAudioSystem } from './audio.js';
import { createStableCamera } from './camera.js';
import { copy, districts, physicalDistricts, worldBounds } from './content.js';
import { createPhysics } from './physics.js';
import { createRaceController, formatRaceTime, RACE_STATES } from './race.js';
import { createRendering } from './rendering.js';
import { chooseQuality, detectLanguage, localize, nextQuality } from './state.js';
import { createVehicleController } from './vehicle.js';
import { createWorld } from './world.js';

const elements = Object.fromEntries([
  ['canvas', '#scene'], ['boot', '#boot-screen'], ['enter', '#enter-button'],
  ['loadBar', '#load-bar'], ['loadStatus', '#load-status'], ['interface', '#interface'],
  ['status', '#status-text'], ['missionTitle', '#mission-title'], ['missionCopy', '#mission-copy'],
  ['controlDrive', '#control-drive'], ['controlBoost', '#control-boost'], ['controlBrake', '#control-brake'],
  ['controlJump', '#control-jump'], ['controlReset', '#control-reset'], ['projects', '#projects-button'],
  ['language', '#language-button'], ['quality', '#quality-button'], ['sound', '#sound-button'],
  ['resume', '#resume-link'], ['speed', '#speed-value'], ['speedLabel', '#speed-label'],
  ['fragment', '#fragment-value'], ['fragmentLabel', '#fragment-label'], ['zone', '#zone-value'],
  ['radarPoints', '#radar-points'], ['radarRover', '#radar-rover'],
  ['prompt', '#proximity-prompt'], ['promptCopy', '#proximity-copy'],
  ['panel', '#project-panel'], ['panelClose', '#project-close'], ['panelTabs', '#project-tabs'],
  ['panelCode', '#project-code'], ['panelTitle', '#project-title'], ['panelSubtitle', '#project-subtitle'],
  ['panelDescription', '#project-description'], ['panelHighlights', '#project-highlights'],
  ['panelTags', '#project-tags'], ['panelLink', '#project-link'], ['panelLinkCopy', '#project-link-copy'],
  ['toast', '#toast'], ['fallback', '#fallback'], ['fallbackCopy', '#fallback-copy'],
  ['fallbackList', '#fallback-list'], ['raceButton', '#race-button'], ['raceHud', '#race-hud'],
  ['raceState', '#race-state'], ['raceTime', '#race-time'], ['raceBest', '#race-best'],
  ['raceCheckpoint', '#race-checkpoint'], ['raceCancel', '#race-cancel'],
].map(([key, selector]) => [key, document.querySelector(selector)]));

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let language = detectLanguage(window.localStorage, navigator.language);
let quality = reducedMotion ? 'low' : window.localStorage.getItem('mini-city-quality') || chooseQuality({
  width: window.innerWidth,
  dpr: window.devicePixelRatio,
  cores: navigator.hardwareConcurrency,
  reducedMotion,
});
let selectedVehicle = window.localStorage.getItem('mini-city-vehicle') || 'red';
if (!VEHICLES.some((car) => car.id === selectedVehicle)) selectedVehicle = 'red';

let activeDistrict = null;
let nearbyDistrict = null;
let started = false;
let stampCount = 0;
let toastTimer = 0;
let rendering;
let physics;
let world;
let vehicle;
let camera;
let cameraRig;
let race;
const loadedZones = new Set(['core']);
const loadingZones = new Set();
const assets = createAssetLibrary();
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
    point.style.left = 50 + district.position[0] / worldBounds * 42 + '%';
    point.style.top = 50 + district.position[1] / worldBounds * 42 + '%';
    elements.radarPoints.append(point);
  }
}

function updateRadar() {
  if (!vehicle) return;
  elements.radarRover.style.left = 50 + vehicle.position.x / worldBounds * 42 + '%';
  elements.radarRover.style.top = 50 + vehicle.position.z / worldBounds * 42 + '%';
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
    button.innerHTML = '<span>' + String(index + 1).padStart(2, '0') + '</span><b>' +
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
  elements.panelLinkCopy.textContent = copy[language].openGithub;
  elements.panelTabs.querySelectorAll('button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.districtId === district.id);
  });
}

function openProject(district = districts[0]) {
  const raceState = race?.snapshot().state;
  if (raceState === RACE_STATES.RACING || raceState === RACE_STATES.COUNTDOWN) {
    setToast(language === 'zh' ? '先退出计时赛再浏览项目' : 'Leave the race before opening projects');
    return;
  }
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
  audio.ui();
}

function renderGarage() {
  document.querySelectorAll('.garage-car').forEach((button) => {
    const selected = button.dataset.vehicle === selectedVehicle;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}

function selectVehicle(id) {
  const config = VEHICLES.find((item) => item.id === id);
  if (!config) return;
  selectedVehicle = id;
  window.localStorage.setItem('mini-city-vehicle', id);
  race?.setVehicle(id);
  if (vehicle && assets.has(config.asset)) vehicle.setVisual(assets.clone(config.asset, 3.25));
  renderGarage();
  setToast((language === 'zh' ? '已选择 ' : 'Selected ') + config.name);
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
  elements.resume.textContent = text.resume;
  elements.sound.textContent = audio.enabled ? text.soundOn : text.soundOff;
  elements.language.textContent = language === 'zh' ? 'EN' : '中文';
  elements.speedLabel.textContent = text.speed;
  elements.fragmentLabel.textContent = text.fragments;
  elements.fallbackCopy.textContent = text.fallback;
  elements.raceButton.textContent = text.raceStart;
  elements.raceCancel.textContent = text.raceCancel;
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
  let distance = Infinity;
  for (const district of physicalDistricts) {
    const value = Math.hypot(vehicle.position.x - district.position[0], vehicle.position.z - district.position[1]);
    if (value < district.radius && value < distance) {
      closest = district;
      distance = value;
    }
  }
  return closest;
}

function zoneForPosition(position) {
  if (position.z > 8) return 'north';
  if (position.z < -12) return 'south';
  if (position.x > 9) return 'east';
  if (position.x < -9) return 'west';
  return null;
}

function ensureApproachZone(position) {
  const zoneId = zoneForPosition(position);
  if (!zoneId || loadedZones.has(zoneId) || loadingZones.has(zoneId)) return;
  loadingZones.add(zoneId);
  assets.ensureZone(zoneId).then(() => {
    world.addZone(zoneId);
    loadedZones.add(zoneId);
    loadingZones.delete(zoneId);
  });
}

function updateTelemetry() {
  if (!vehicle) return;
  elements.speed.textContent = String(Math.round(Math.abs(vehicle.speed) * 3.6)).padStart(3, '0');
  const closest = physicalDistricts.reduce((best, district) => {
    const distance = Math.hypot(vehicle.position.x - district.position[0], vehicle.position.z - district.position[1]);
    return !best || distance < best.distance ? { district, distance } : best;
  }, null);
  elements.zone.textContent = closest?.district.code.split('//')[0].trim() || 'CITY LOOP';
}

function startRace() {
  if (!started || !race) return;
  closeProject();
  vehicle.teleport(0, 40, 0, 28);
  race.start();
  world.setActiveCheckpoint(0);
  elements.raceHud.hidden = false;
  elements.prompt.hidden = true;
  document.body.dataset.race = 'countdown';
  setToast(language === 'zh' ? '准备：3 · 2 · 1' : 'Ready: 3 · 2 · 1');
}

function cancelRace() {
  race?.cancel();
  world?.setActiveCheckpoint(-1);
  elements.raceHud.hidden = true;
  document.body.dataset.race = 'idle';
}

function updateRace() {
  if (!race || !vehicle) return RACE_STATES.IDLE;
  const snapshot = race.update(vehicle.position);
  const active = snapshot.state !== RACE_STATES.IDLE;
  elements.raceHud.hidden = !active;
  elements.raceTime.textContent = formatRaceTime(snapshot.elapsed);
  elements.raceBest.textContent = snapshot.best ? formatRaceTime(snapshot.best) : '--:--.---';
  elements.raceCheckpoint.textContent = Math.min(snapshot.checkpointIndex + 1, snapshot.checkpointTotal) + ' / ' + snapshot.checkpointTotal;
  if (snapshot.state === RACE_STATES.COUNTDOWN) {
    elements.raceState.textContent = String(snapshot.countdown);
  } else if (snapshot.state === RACE_STATES.RACING) {
    elements.raceState.textContent = 'GO';
    world.setActiveCheckpoint(snapshot.checkpointIndex);
  } else if (snapshot.state === RACE_STATES.FINISHED) {
    elements.raceState.textContent = language === 'zh' ? '完成' : 'FINISH';
    world.setActiveCheckpoint(-1);
  }
  document.body.dataset.race = snapshot.state;
  return snapshot.state;
}

function onResize() {
  if (!camera || !rendering) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  rendering.resize();
}

async function initialize3D() {
  elements.loadBar.style.width = '12%';
  elements.loadStatus.textContent = language === 'zh' ? '正在打开白天城市...' : 'OPENING THE DAYLIGHT CITY...';

  const scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 190);
  rendering = createRendering(elements.canvas, scene, camera, quality);

  elements.loadBar.style.width = '30%';
  elements.loadStatus.textContent = language === 'zh' ? '正在加载驾驶物理...' : 'LOADING DRIVING PHYSICS...';
  physics = await createPhysics();

  elements.loadBar.style.width = '48%';
  elements.loadStatus.textContent = language === 'zh' ? '正在加载 Kenney 城市与赛车素材...' : 'LOADING KENNEY CITY + RACING KITS...';
  await assets.preloadCore();

  elements.loadBar.style.width = '72%';
  elements.loadStatus.textContent = language === 'zh' ? '正在布置城市环线...' : 'ASSEMBLING THE CITY LOOP...';
  world = createWorld(scene, physics, rendering.renderer, quality, assets, reducedMotion);

  const carConfig = VEHICLES.find((item) => item.id === selectedVehicle) || VEHICLES[0];
  vehicle = createVehicleController({
    scene,
    canvas: elements.canvas,
    physics,
    visual: assets.clone(carConfig.asset, 3.25),
    onImpact: (strength) => audio.impact(strength),
  });
  race = createRaceController({
    checkpoints: world.checkpointPositions,
    storage: window.localStorage,
    vehicleId: selectedVehicle,
  });
  cameraRig = createStableCamera({ camera, canvas: elements.canvas, reducedMotion });
  cameraRig.snap(vehicle.position);

  buildRadar();
  updateQuality();
  window.addEventListener('resize', onResize);

  const clock = new THREE.Clock();
  let accumulator = 0;
  let renderAccumulator = 0;

  function frame() {
    const delta = Math.min(clock.getDelta(), 0.1);
    accumulator = Math.min(accumulator + delta, 0.18);
    const raceState = updateRace();

    while (accumulator >= physics.fixedStep) {
      const locked = !started || Boolean(activeDistrict) || raceState === RACE_STATES.COUNTDOWN;
      vehicle.prePhysics(physics.fixedStep, locked);
      physics.step();
      vehicle.postPhysics(physics.fixedStep);
      accumulator -= physics.fixedStep;
    }

    cameraRig.update(delta, vehicle.position);
    world.update(clock.elapsedTime, delta);
    ensureApproachZone(vehicle.position);

    if (started && !activeDistrict && raceState !== RACE_STATES.COUNTDOWN) {
      const found = world.collectNear(vehicle.position);
      if (found.length) {
        stampCount += found.length;
        elements.fragment.textContent = String(stampCount).padStart(2, '0') + ' / ' + String(world.fragmentTotal).padStart(2, '0');
        setToast(language === 'zh' ? '收集城市印章 +' + found.length : 'CITY STAMP +' + found.length);
        audio.ui();
      }
    }

    const racing = raceState === RACE_STATES.RACING || raceState === RACE_STATES.COUNTDOWN;
    nearbyDistrict = racing ? null : findNearbyDistrict();
    const nearStart = !racing && world.isNearRaceStart(vehicle.position);
    elements.prompt.hidden = !started || (!nearStart && !nearbyDistrict) || Boolean(activeDistrict);
    if (!elements.prompt.hidden) {
      elements.promptCopy.textContent = nearStart ? copy[language].raceStart : copy[language].visit;
      elements.prompt.style.setProperty('--active-color', nearStart ? '#e76f51' : nearbyDistrict.color);
    }

    updateRadar();
    updateTelemetry();
    audio.update(vehicle.speed);
    renderAccumulator += delta;
    if (quality !== 'low' || renderAccumulator >= 1 / 30) {
      rendering.render();
      renderAccumulator = 0;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  elements.loadBar.style.width = '100%';
  elements.loadStatus.textContent = language === 'zh' ? '微缩城市已开放。' : 'MINIATURE CITY OPEN.';
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
  window.localStorage.setItem('mini-city-quality', quality);
  updateQuality();
  audio.ui();
});
elements.sound.addEventListener('click', () => {
  audio.setEnabled(!audio.enabled);
  updateLanguage();
});
elements.prompt.addEventListener('click', () => {
  if (world?.isNearRaceStart(vehicle.position)) startRace();
  else if (nearbyDistrict) openProject(nearbyDistrict);
});
elements.panelClose.addEventListener('click', closeProject);
elements.raceButton.addEventListener('click', startRace);
elements.raceCancel.addEventListener('click', cancelRace);
document.querySelectorAll('.garage-car').forEach((button) => {
  button.addEventListener('click', () => selectVehicle(button.dataset.vehicle));
});

window.addEventListener('keydown', (event) => {
  if ((event.code === 'KeyE' || event.code === 'Enter') && started && !activeDistrict) {
    if (world?.isNearRaceStart(vehicle.position)) startRace();
    else if (nearbyDistrict) openProject(nearbyDistrict);
  }
  if (event.code === 'Escape') {
    if (activeDistrict) closeProject();
    else if (race?.snapshot().state !== RACE_STATES.IDLE) cancelRace();
  }
});

renderGarage();
updateLanguage();
elements.quality.textContent = 'Q: ' + quality.toUpperCase();

if (!supportsWebGL()) showFallback();
else initialize3D().catch(showFallback);
