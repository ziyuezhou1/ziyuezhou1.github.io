import * as THREE from 'three';
import { engineForce, steeringLimit } from './vehicleMath.js';

export const VEHICLE_VISUAL_YAW = 0;
export const JUMP_IMPULSE = 2400;

const KEY_BINDINGS = {
  KeyW: 'forward', ArrowUp: 'forward',
  KeyS: 'backward', ArrowDown: 'backward',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'boost', ShiftRight: 'boost',
  Space: 'brake', ControlLeft: 'brake',
  KeyQ: 'jump',
};

const WHEEL_LOCATIONS = [
  [-1.02, -0.2, 1.28], [1.02, -0.2, 1.28],
  [-1.02, -0.2, -1.28], [1.02, -0.2, -1.28],
];

function basicCar() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.55, 3.5),
    new THREE.MeshStandardMaterial({ color: 0xee6b4d, roughness: 0.42, metalness: 0.08 }),
  );
  body.position.y = 0.3;
  const cab = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 0.72, 1.55),
    new THREE.MeshStandardMaterial({ color: 0xf8efe0, roughness: 0.34 }),
  );
  cab.position.set(0, 0.87, -0.22);
  group.add(body, cab);
  for (const [x, , z] of WHEEL_LOCATIONS) {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 0.32, 16),
      new THREE.MeshStandardMaterial({ color: 0x34393a, roughness: 0.78 }),
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0, z);
    group.add(wheel);
  }
  group.traverse((child) => {
    if (child.isMesh) child.castShadow = child.receiveShadow = true;
  });
  return group;
}

function createCarRoot(initialVisual) {
  const root = new THREE.Group();
  const visualMount = new THREE.Group();
  root.add(visualMount);
  const wheelPivots = WHEEL_LOCATIONS.map(() => new THREE.Group());
  wheelPivots.forEach((pivot) => root.add(pivot));
  root.userData.visualMount = visualMount;
  root.userData.wheelPivots = wheelPivots;

  function setVisual(model) {
    visualMount.clear();
    const visual = model || basicCar();
    visual.position.y -= 0.48;
    visual.rotation.y = VEHICLE_VISUAL_YAW;
    visual.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
    });
    visualMount.add(visual);
  }
  root.userData.setVisual = setVisual;
  setVisual(initialVisual);
  return root;
}

export function createVehicleController({
  scene,
  canvas,
  physics,
  visual = null,
  onImpact = () => {},
}) {
  const { RAPIER, world } = physics;
  const car = createCarRoot(visual);
  scene.add(car);

  const start = { x: 0, y: 1.25, z: 40, heading: Math.PI };
  const startRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), start.heading);
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(start.x, start.y, start.z)
      .setRotation(startRotation)
      .setLinearDamping(0.18)
      .setAngularDamping(0.88)
      .setCcdEnabled(true),
  );
  const chassisCollider = world.createCollider(
    RAPIER.ColliderDesc.cuboid(1.06, 0.38, 1.72)
      .setTranslation(0, 0.12, 0)
      .setDensity(82)
      .setFriction(0.3)
      .setRestitution(0.03),
    body,
  );

  const rayVehicle = world.createVehicleController(body);
  rayVehicle.indexUpAxis = 1;
  rayVehicle.setIndexForwardAxis = 2;
  for (const location of WHEEL_LOCATIONS) {
    rayVehicle.addWheel(
      { x: location[0], y: -0.06, z: location[2] },
      { x: 0, y: -1, z: 0 },
      { x: -1, y: 0, z: 0 },
      0.36,
      0.47,
    );
  }
  for (let index = 0; index < 4; index += 1) {
    rayVehicle.setWheelSuspensionStiffness(index, 27);
    rayVehicle.setWheelSuspensionCompression(index, 4.6);
    rayVehicle.setWheelSuspensionRelaxation(index, 5.2);
    rayVehicle.setWheelMaxSuspensionForce(index, 4400);
    rayVehicle.setWheelMaxSuspensionTravel(index, 0.38);
    rayVehicle.setWheelFrictionSlip(index, 2.2);
    rayVehicle.setWheelSideFrictionStiffness(index, 1.35);
  }

  const input = new Set();
  const mobileHandlers = [];
  let steering = 0;
  let jumpLatch = false;
  let grounded = false;
  let lastSpeed = 0;

  function clearMotion() {
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }

  function reset(location = start) {
    const heading = location.heading ?? start.heading;
    const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), heading);
    body.setTranslation({
      x: location.x ?? start.x,
      y: location.y ?? start.y,
      z: location.z ?? start.z,
    }, true);
    body.setRotation(rotation, true);
    clearMotion();
    steering = 0;
  }

  function teleport(x, z, targetX = 0, targetZ = 0) {
    reset({ x, y: 1.35, z, heading: Math.atan2(targetX - x, targetZ - z) });
  }

  function onKeyDown(event) {
    const action = KEY_BINDINGS[event.code];
    if (action) {
      event.preventDefault();
      input.add(action);
    }
    if (event.code === 'KeyR') reset();
  }

  function onKeyUp(event) {
    const action = KEY_BINDINGS[event.code];
    if (action) input.delete(action);
    if (action === 'jump') jumpLatch = false;
  }

  for (const button of document.querySelectorAll('[data-control]')) {
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
      if (action === 'jump') jumpLatch = false;
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

  function prePhysics(delta, locked = false) {
    const speed = rayVehicle.currentVehicleSpeed();
    const throttle = locked ? 0 : (input.has('forward') ? 1 : 0) - (input.has('backward') ? 1 : 0);
    const steerInput = locked ? 0 : (input.has('left') ? 1 : 0) - (input.has('right') ? 1 : 0);
    const boosting = !locked && input.has('boost');
    steering = THREE.MathUtils.lerp(
      steering,
      steerInput * steeringLimit(speed, boosting),
      1 - Math.pow(0.00008, delta),
    );
    rayVehicle.setWheelSteering(0, steering);
    rayVehicle.setWheelSteering(1, steering);
    const force = engineForce(speed, throttle, boosting);
    const braking = locked || input.has('brake');
    for (let index = 0; index < 4; index += 1) {
      rayVehicle.setWheelEngineForce(index, force);
      rayVehicle.setWheelBrake(index, braking ? (index < 2 ? 19 : 11) : throttle === 0 ? 0.7 : 0);
      rayVehicle.setWheelFrictionSlip(index, braking && index >= 2 ? 0.94 : 2.2);
    }
    grounded = false;
    for (let index = 0; index < 4; index += 1) grounded ||= rayVehicle.wheelIsInContact(index);
    if (!locked && input.has('jump') && grounded && !jumpLatch) {
      body.applyImpulse({ x: 0, y: JUMP_IMPULSE, z: 0 }, true);
      jumpLatch = true;
    }
    rayVehicle.updateVehicle(delta);
  }

  function postPhysics() {
    const position = body.translation();
    const rotation = body.rotation();
    car.position.set(position.x, position.y, position.z);
    car.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    const speed = rayVehicle.currentVehicleSpeed();
    const impact = Math.max(0, Math.abs(lastSpeed) - Math.abs(speed) - 3.8);
    if (impact > 0.5) onImpact(Math.min(1, impact / 11));
    lastSpeed = speed;
    if (position.y < -5 || Math.abs(position.x) > 58 || Math.abs(position.z) > 58) reset();
  }

  reset();

  return {
    rover: car,
    body,
    chassisCollider,
    get position() { return car.position; },
    get speed() { return rayVehicle.currentVehicleSpeed(); },
    get isGrounded() { return grounded; },
    reset,
    teleport,
    setVisual(model) { car.userData.setVisual(model); },
    prePhysics,
    postPhysics,
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      for (const [button, press, release] of mobileHandlers) {
        button.removeEventListener('pointerdown', press);
        button.removeEventListener('pointerup', release);
        button.removeEventListener('pointercancel', release);
      }
      world.removeVehicleController(rayVehicle);
      world.removeRigidBody(body);
    },
  };
}
