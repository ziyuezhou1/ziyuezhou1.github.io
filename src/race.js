export const RACE_STATES = Object.freeze({
  IDLE: 'idle',
  COUNTDOWN: 'countdown',
  RACING: 'racing',
  FINISHED: 'finished',
});

export function formatRaceTime(milliseconds) {
  if (!Number.isFinite(milliseconds)) return '--:--.---';
  const value = Math.max(0, milliseconds);
  const minutes = Math.floor(value / 60000);
  const seconds = Math.floor((value % 60000) / 1000);
  const millis = Math.floor(value % 1000);
  return String(minutes).padStart(2, '0') + ':' +
    String(seconds).padStart(2, '0') + '.' +
    String(millis).padStart(3, '0');
}

function normalizeCheckpoint(checkpoint, checkpointRadius) {
  if (Array.isArray(checkpoint)) {
    return {
      position: checkpoint,
      normal: null,
      width: checkpointRadius,
    };
  }
  return {
    position: checkpoint.position,
    normal: checkpoint.normal || null,
    width: checkpoint.width || checkpointRadius,
  };
}

function reachesCheckpoint(previous, current, checkpoint, checkpointRadius) {
  const target = normalizeCheckpoint(checkpoint, checkpointRadius);
  const dx = current.x - target.position[0];
  const dz = current.z - target.position[1];

  if (!target.normal) {
    return Math.hypot(dx, dz) <= target.width;
  }
  if (!previous) return false;

  const normalLength = Math.hypot(target.normal[0], target.normal[1]) || 1;
  const normalX = target.normal[0] / normalLength;
  const normalZ = target.normal[1] / normalLength;
  const previousSide =
    (previous.x - target.position[0]) * normalX +
    (previous.z - target.position[1]) * normalZ;
  const currentSide = dx * normalX + dz * normalZ;
  const lateral = Math.abs(dx * -normalZ + dz * normalX);

  return previousSide < 0 && currentSide >= 0 && lateral <= target.width;
}

export function createRaceController({
  checkpoints,
  now = () => performance.now(),
  storage = null,
  vehicleId = 'red',
  checkpointRadius = 6,
} = {}) {
  let state = RACE_STATES.IDLE;
  let selectedVehicle = vehicleId;
  let countdownEndsAt = 0;
  let startedAt = 0;
  let finishedAt = 0;
  let checkpointIndex = 0;
  let previousPosition = null;
  let splitTimes = [];
  let lastSplit = null;
  let checkpointEvent = 0;
  let best = readBest();

  function key() {
    return 'mini-city-best-' + selectedVehicle;
  }

  function readBest() {
    const value = Number(storage?.getItem?.('mini-city-best-' + selectedVehicle));
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function start() {
    state = RACE_STATES.COUNTDOWN;
    countdownEndsAt = now() + 3000;
    startedAt = 0;
    finishedAt = 0;
    checkpointIndex = 0;
    previousPosition = null;
    splitTimes = [];
    lastSplit = null;
    checkpointEvent = 0;
  }

  function cancel() {
    state = RACE_STATES.IDLE;
    countdownEndsAt = 0;
    startedAt = 0;
    finishedAt = 0;
    checkpointIndex = 0;
    previousPosition = null;
    splitTimes = [];
    lastSplit = null;
    checkpointEvent = 0;
  }

  function setVehicle(id) {
    selectedVehicle = id;
    best = readBest();
  }

  function update(position) {
    const time = now();
    if (state === RACE_STATES.COUNTDOWN && time >= countdownEndsAt) {
      state = RACE_STATES.RACING;
      startedAt = time;
      previousPosition = { x: position.x, z: position.z };
      return snapshot();
    }

    if (state === RACE_STATES.RACING && checkpoints?.[checkpointIndex]) {
      if (reachesCheckpoint(previousPosition, position, checkpoints[checkpointIndex], checkpointRadius)) {
        checkpointIndex += 1;
        lastSplit = time - startedAt;
        splitTimes.push(lastSplit);
        checkpointEvent += 1;
        if (checkpointIndex === checkpoints.length) {
          state = RACE_STATES.FINISHED;
          finishedAt = time;
          const elapsed = finishedAt - startedAt;
          if (!best || elapsed < best) {
            best = elapsed;
            storage?.setItem?.(key(), String(Math.round(best)));
          }
        }
      }
    }

    previousPosition = { x: position.x, z: position.z };
    return snapshot();
  }

  function snapshot() {
    const time = now();
    const elapsed = state === RACE_STATES.RACING
      ? time - startedAt
      : state === RACE_STATES.FINISHED
        ? finishedAt - startedAt
        : 0;
    return {
      state,
      checkpointIndex,
      checkpointTotal: checkpoints?.length || 0,
      checkpointEvent,
      countdown: state === RACE_STATES.COUNTDOWN
        ? Math.max(1, Math.ceil((countdownEndsAt - time) / 1000))
        : null,
      elapsed,
      best,
      splitTimes: [...splitTimes],
      lastSplit,
      vehicleId: selectedVehicle,
    };
  }

  return { start, cancel, update, snapshot, setVehicle };
}
