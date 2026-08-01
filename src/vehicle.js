import * as THREE from 'three';
import { clamp } from './state.js';

const keyBindings = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'backward',
  ArrowDown: 'backward',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'boost',
  ShiftRight: 'boost',
  Space: 'brake',
  ControlLeft: 'brake',
};

function createRoverModel() {
  const rover = new THREE.Group();
  rover.name = 'DNA Rover';

  const dark = new THREE.MeshStandardMaterial({
    color: 0x070b12,
    metalness: 0.88,
    roughness: 0.24,
  });
  const cyan = new THREE.MeshStandardMaterial({
    color: 0x07333a,
    emissive: 0x00d9e8,
    emissiveIntensity: 2.4,
    metalness: 0.65,
    roughness: 0.22,
  });
  const pink = new THREE.MeshStandardMaterial({
    color: 0x3c0718,
    emissive: 0xff2f7d,
    emissiveIntensity: 2.1,
    metalness: 0.55,
    roughness: 0.25,
  });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.55, 4.2), dark);
  chassis.position.y = 0.8;
  rover.add(chassis);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.7, 1.85), cyan);
  cabin.position.set(0, 1.35, -0.25);
  cabin.rotation.x = -0.06;
  rover.add(cabin);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.22, 0.68), pink);
  nose.position.set(0, 1.05, 1.75);
  rover.add(nose);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.2, 8), cyan);
  antenna.position.set(0.55, 2.05, -0.65);
  antenna.rotation.z = -0.18;
  rover.add(antenna);

  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x030406,
    roughness: 0.72,
    metalness: 0.4,
  });
  const wheelGlow = new THREE.MeshStandardMaterial({
    color: 0x05323b,
    emissive: 0x00f0ff,
    emissiveIntensity: 1.9,
  });
  const wheels = [];

  for (const x of [-1.3, 1.3]) {
    for (const z of [-1.38, 1.38]) {
      const wheel = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.34, 16), wheelMaterial);
      tire.rotation.z = Math.PI / 2;
      wheel.add(tire);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.37, 12), wheelGlow);
      hub.rotation.z = Math.PI / 2;
      wheel.add(hub);
      wheel.position.set(x, 0.55, z);
      rover.add(wheel);
      wheels.push(wheel);
    }
  }

  const underGlow = new THREE.PointLight(0x00f0ff, 18, 8, 2);
  underGlow.position.set(0, 0.4, 0);
  rover.add(underGlow);

  rover.userData.wheels = wheels;
  return rover;
}

export function createVehicleController({
  scene,
  camera,
  canvas,
  obstacles = [],
  bounds = 54,
}) {
  const rover = createRoverModel();
  scene.add(rover);

  const input = new Set();
  const start = { x: 0, z: 35, heading: Math.PI };
  let speed = 0;
  let heading = start.heading;
  let cameraYaw = 0;
  let cameraPitch = 0.2;
  let dragging = false;
  let pointerX = 0;
  let pointerY = 0;

  const forward = new THREE.Vector3();
  const desiredCamera = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const nextPosition = new THREE.Vector3();

  function reset(location = start) {
    rover.position.set(location.x, 0.08, location.z);
    heading = location.heading ?? Math.PI;
    speed = 0;
    rover.rotation.y = heading;
  }

  function teleport(x, z, targetX = 0, targetZ = 0) {
    rover.position.set(x, 0.08, z);
    heading = Math.atan2(targetX - x, targetZ - z);
    speed = 0;
    rover.rotation.y = heading;
  }

  function onKeyDown(event) {
    const action = keyBindings[event.code];
    if (action) {
      event.preventDefault();
      input.add(action);
    }
    if (event.code === 'KeyR') reset();
  }

  function onKeyUp(event) {
    const action = keyBindings[event.code];
    if (action) input.delete(action);
  }

  function onPointerDown(event) {
    if (event.button !== 0 || event.target !== canvas) return;
    dragging = true;
    pointerX = event.clientX;
    pointerY = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (!dragging) return;
    const dx = event.clientX - pointerX;
    const dy = event.clientY - pointerY;
    cameraYaw = clamp(cameraYaw - dx * 0.006, -1.15, 1.15);
    cameraPitch = clamp(cameraPitch + dy * 0.004, -0.12, 0.62);
    pointerX = event.clientX;
    pointerY = event.clientY;
  }

  function onPointerUp(event) {
    dragging = false;
    canvas.releasePointerCapture?.(event.pointerId);
  }

  const mobileButtons = [...document.querySelectorAll('[data-control]')];
  const mobileHandlers = [];
  for (const button of mobileButtons) {
    const action = button.dataset.control;
    const press = (event) => {
      event.preventDefault();
      input.add(action);
      button.classList.add('is-pressed');
      button.setPointerCapture?.(event.pointerId);
    };
    const release = (event) => {
      event.preventDefault();
      input.delete(action);
      button.classList.remove('is-pressed');
      button.releasePointerCapture?.(event.pointerId);
    };
    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    mobileHandlers.push([button, press, release]);
  }

  window.addEventListener('keydown', onKeyDown, { passive: false });
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  function update(delta) {
    const dt = Math.min(delta, 0.05);
    const throttle = (input.has('forward') ? 1 : 0) - (input.has('backward') ? 1 : 0);
    const steer = (input.has('left') ? 1 : 0) - (input.has('right') ? 1 : 0);
    const boosting = input.has('boost');
    const maxForward = boosting ? 20 : 13;
    const maxReverse = -7;

    if (throttle > 0) speed += (boosting ? 22 : 15) * dt;
    if (throttle < 0) speed -= 11 * dt;
    if (throttle === 0) speed *= Math.pow(0.16, dt);
    if (input.has('brake')) speed *= Math.pow(0.015, dt);

    speed = clamp(speed, maxReverse, maxForward);
    if (Math.abs(speed) < 0.025) speed = 0;

    const movementRatio = clamp(Math.abs(speed) / 8, 0.18, 1.35);
    if (steer !== 0 && Math.abs(speed) > 0.04) {
      heading += steer * 1.75 * movementRatio * dt * Math.sign(speed);
    }

    forward.set(Math.sin(heading), 0, Math.cos(heading));
    nextPosition.copy(rover.position).addScaledVector(forward, speed * dt);

    let collided = false;
    for (const obstacle of obstacles) {
      const dx = nextPosition.x - obstacle.x;
      const dz = nextPosition.z - obstacle.z;
      const minDistance = obstacle.radius + 1.3;
      const distanceSquared = dx * dx + dz * dz;
      if (distanceSquared < minDistance * minDistance) {
        const distance = Math.max(Math.sqrt(distanceSquared), 0.001);
        nextPosition.x = obstacle.x + (dx / distance) * minDistance;
        nextPosition.z = obstacle.z + (dz / distance) * minDistance;
        collided = true;
      }
    }

    nextPosition.x = clamp(nextPosition.x, -bounds, bounds);
    nextPosition.z = clamp(nextPosition.z, -bounds, bounds);
    if (collided) speed *= -0.16;

    rover.position.copy(nextPosition);
    rover.rotation.y = heading;
    rover.rotation.z = THREE.MathUtils.lerp(rover.rotation.z, -steer * movementRatio * 0.07, 0.12);
    rover.position.y = 0.08 + Math.sin(performance.now() * 0.004) * Math.min(Math.abs(speed) * 0.002, 0.04);

    for (const wheel of rover.userData.wheels) {
      wheel.rotation.x -= speed * dt * 1.7;
    }

    const cameraDirection = forward.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);
    desiredCamera.copy(rover.position).addScaledVector(cameraDirection, -8.5);
    desiredCamera.y += 4.8 + cameraPitch * 4;
    camera.position.lerp(desiredCamera, 1 - Math.pow(0.0008, dt));
    lookTarget.copy(rover.position).addScaledVector(forward, 2.3);
    lookTarget.y += 1.05;
    camera.lookAt(lookTarget);

    if (rover.position.y < -4) reset();
  }

  reset();
  camera.position.set(0, 5.5, 44);

  return {
    rover,
    get position() {
      return rover.position;
    },
    get speed() {
      return speed;
    },
    reset,
    teleport,
    update,
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      for (const [button, press, release] of mobileHandlers) {
        button.removeEventListener('pointerdown', press);
        button.removeEventListener('pointerup', release);
        button.removeEventListener('pointercancel', release);
      }
    },
  };
}
