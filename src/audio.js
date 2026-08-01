import { Howl, Howler } from 'howler';

function createWav(duration, generator, sampleRate = 8000) {
  const length = Math.floor(duration * sampleRate);
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);
  const write = (offset, value) => {
    for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
  };
  write(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  write(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  write(36, 'data');
  view.setUint32(40, length, true);
  for (let index = 0; index < length; index += 1) {
    const sample = Math.max(-1, Math.min(1, generator(index / sampleRate, index, length)));
    view.setUint8(44 + index, Math.round(128 + sample * 112));
  }
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < bytes.length; index += 4096) binary += String.fromCharCode(...bytes.subarray(index, index + 4096));
  return 'data:audio/wav;base64,' + btoa(binary);
}

export function createAudioSystem() {
  let enabled = false;
  let sounds = null;

  function build() {
    if (sounds) return;
    const engineUri = createWav(1, (time) => (
      Math.sin(time * Math.PI * 2 * 58) * 0.48 +
      Math.sin(time * Math.PI * 2 * 116) * 0.16
    ) * (0.62 + Math.sin(time * Math.PI * 2) * 0.05));
    const impactUri = createWav(0.22, (time, index, length) => {
      const noise = (((index + 97) * 48271) % 2147483647) / 2147483647;
      return ((noise * 2 - 1) * 0.65 + Math.sin(time * 460) * 0.28) * (1 - index / length);
    });
    const uiUri = createWav(0.12, (time, index, length) =>
      Math.sin(time * Math.PI * 2 * (560 + time * 1500)) * (1 - index / length) * 0.5);
    sounds = {
      engine: new Howl({ src: [engineUri], loop: true, volume: 0.2 }),
      impact: new Howl({ src: [impactUri], volume: 0.26 }),
      ui: new Howl({ src: [uiUri], volume: 0.2 }),
    };
  }

  function setEnabled(next) {
    enabled = next;
    build();
    Howler.mute(!enabled);
    if (enabled) {
      if (!sounds.engine.playing()) sounds.engine.play();
      sounds.ui.play();
    } else sounds.engine.pause();
  }

  return {
    get enabled() { return enabled; },
    setEnabled,
    update(speed) {
      if (!enabled || !sounds) return;
      const normalized = Math.min(Math.abs(speed) / 30, 1);
      sounds.engine.rate(0.62 + normalized * 1.08);
      sounds.engine.volume(0.1 + normalized * 0.18);
    },
    impact(strength = 1) {
      if (!enabled || !sounds || strength < 0.2) return;
      sounds.impact.volume(Math.min(0.4, 0.15 + strength * 0.18));
      sounds.impact.play();
    },
    ui() { if (enabled && sounds) sounds.ui.play(); },
  };
}
