import { describe, expect, it } from 'vitest';
import { createRaceController, formatRaceTime, RACE_STATES } from '../src/race.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    values,
  };
}

describe('one-lap time trial', () => {
  it('counts down and accepts checkpoints only in order', () => {
    let time = 1000;
    const race = createRaceController({
      checkpoints: [[10, 0], [20, 0]],
      now: () => time,
      storage: memoryStorage(),
      checkpointRadius: 2,
    });
    race.start();
    expect(race.snapshot().state).toBe(RACE_STATES.COUNTDOWN);
    time = 4000;
    race.update({ x: 20, z: 0 });
    expect(race.snapshot().checkpointIndex).toBe(0);
    race.update({ x: 10, z: 0 });
    expect(race.snapshot().checkpointIndex).toBe(1);
    time = 5500;
    race.update({ x: 20, z: 0 });
    expect(race.snapshot().state).toBe(RACE_STATES.FINISHED);
    expect(race.snapshot().elapsed).toBe(1500);
  });

  it('requires directional gates to be crossed from the authored approach side', () => {
    let time = 0;
    const race = createRaceController({
      checkpoints: [{ position: [0, 0], normal: [1, 0], width: 3 }],
      now: () => time,
      checkpointRadius: 3,
    });
    race.start();
    time = 3000;
    race.update({ x: 2, z: 0 });
    race.update({ x: -2, z: 0 });
    expect(race.snapshot().checkpointIndex).toBe(0);

    race.update({ x: -3, z: 0 });
    time = 4200;
    race.update({ x: 2, z: 0 });
    expect(race.snapshot().state).toBe(RACE_STATES.FINISHED);
    expect(race.snapshot().lastSplit).toBe(1200);
  });

  it('stores a separate best time per selected vehicle', () => {
    let time = 0;
    const storage = memoryStorage();
    const race = createRaceController({
      checkpoints: [[0, 0]],
      now: () => time,
      storage,
      vehicleId: 'red',
    });
    race.start();
    time = 3000;
    race.update({ x: 99, z: 99 });
    time = 4500;
    race.update({ x: 0, z: 0 });
    expect(storage.values.get('mini-city-best-red')).toBe('1500');
    race.setVehicle('green');
    expect(race.snapshot().best).toBeNull();
  });

  it('formats race times for the HUD', () => {
    expect(formatRaceTime(65432)).toBe('01:05.432');
    expect(formatRaceTime(null)).toBe('--:--.---');
  });
});
