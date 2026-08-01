import * as THREE from 'three';
import { cameraFov, engineForce, springScalar, steeringLimit } from './vehicleMath.js';

const KEY_BINDINGS = {
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
  KeyQ: 'jump',
};

function material(color, emissive = null, intensity = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: emissive || 0x000000,
    emissiveIntensity: intensity,
    metalness: 0.78,
    roughness: emissive ? 0.22 : 0.34,
  });
}

function addBox(group, size, position, surface, rotation = null) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), surface);
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function createRoverModel() {
  const rover = new THREE.Group();
  rover.name = 'DNA Rover Mk II';

  const graphite = material(0x11171a);
  const armor = material(0x263238);
  const cyan = material(0x0d4a4f, 0x46e7e1, 3.4);
  const magenta = material(0x4d1728, 0xff4778, 2.8);
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x5bc8d2,
    emissive: 0x1a6870,
    emissiveIntensity: 0.8,
    metalness: 0.15,
    roughness: 0.05,
    transmission: 0.35,
    transparent: true,
    opacity: 0.72,
  });

  addBox(rover, [2.25, 0.48, 3.7], [0, 0.08, 0], graphite);
  addBox(rover, [2.55, 0.22, 2.35], [0, 0.43, 0.32], armor, [-0.04, 0, 0]);
  addBox(rover, [1.55, 0.78, 1.65], [0, 0.9, -0.22], glass, [-0.08, 0, 0]);
  addBox(rover, [2.08, 0.14, 0.46], [0, 0.58, 1.67], magenta);
  addBox(rover, [1.6, 0.06, 0.18], [0, 0.78, 1.91], cyan);
  addBox(rover, [0.12, 0.12, 1.7], [0, 0.37, -1.68], cyan);

  for (const x of [-0.72, 0.72]) {
    const light = new THREE.Mesh(new THREE.CircleGeometry(0.16, 16), cyan);
    light.position.set(x, 0.59, 1.91);
    rover.add(light);
  }

  const wheelPivots = [];
  const wheelSpins = [];
  const wheelMaterial = material(0x050708);
  const hubMaterial = material(0x123f43, 0x46e7e1, 2.4);
  const wheelLocations = [
    [-1.1, -0.2, 1.34],
    [1.1, -0.2, 1.34],
    [-1.1, -0.2, -1.34],
    [1.1, -0.2, -1.34],
  ];

  for (const location of wheelLocations) {
    const pivot = new THREE.Group();
    const spin = new THREE.Group();
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.36, 18), wheelMaterial);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.39, 14), hubMaterial);
    hub.rotation.z = Math.PI / 2;
    spin.add(tire, hub);
    pivot.add(spin);
    pivot.position.set(...location);
    rover.add(pivot);
    wheelPivots.push(pivot);
    wheelSpins.push(spin);
  }

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.15, 8), cyan);
  antenna.position.set(0.58, 1.72, -0.6);
  antenna.rotation.z = -0.12;
  rover.add(antenna);
  const beacon = new THREE.PointLight(0x46e7e1, 17, 8, 2);
  beacon.position.set(0, -0.25, 0.2);
  rover.add(beacon);

  rover.userData.wheelLocations = wheelLocations;
  rover.userData.wheelPivots = wheelPivots;
  rover.userData.wheelSpins = wheelSpins;
  return rover;
}

export function createVehicleController({
  scene,
  camera,
  canvas,
  physics,
  onImpact = () => {},
}) {
  const { RAPIER, world } = physics;
  const rover = createRoverModel();
  scene.add(rover);

  const start = { x: 0, y: 1.25, z: 39, heading: Math.PI };
  const startRotation = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    start.heading,
  );
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(start.x, start.y, start.z)
      .setRotation(startRotation)
      .setLinearDamping(0.18)
      .setAngularDamping(0.85)
      .setCcdEnabled(true),
  );
  const chassisCollider = world.createCollider(
    RAPIER.ColliderDesc.cuboid(1.08, 0.38, 1.78)
      .setTranslation(0, 0.12, 0)
      .setDensity(82)
      .setFriction(0.28)
      .setRestitution(0.04),
    body,
  );

  const rayVehicle = world.createVehicleController(body);
  rayVehicle.indexUpAxis = 1;
  rayVehicle.setIndexForwardAxis = 2;

  const wheelLocations = rover.userData.wheelLocations;
  for (const location of wheelLocations) {
    rayVehicle.addWheel(
      { x: location[0], y: -0.06, z: location[2] },
      { x: 0, y: -1, z: 0 },
      { x: -1, y: 0, z: 0 },
      0.36,
      0.48,
    );
  }
  for (let index = 0; index < 4; index += 1) {
    rayVehicle.setWheelSuspensionStiffness(index, 27);
    rayVehicle.setWheelSuspensionCompression(index, 4.6);
    rayVehicle.setWheelSuspensionRelaxation(index, 5.2);
    rayVehicle.setWheelMaxSuspensionForce(index, 4400);
    rayVehicle.setWheelMaxSuspensionTravel(index, 0.38);
    rayVehicle.setWheelFrictionSlip(index, 2.25);
    rayVehicle.setWheelSideFrictionStiffness(index, 1.35);
  }

  const input = new Set();
  const mobileHandlers = [];
  let steering = 0;
  let cameraYaw = 0;
  let cameraPitch = 0.14;
  let dragging = false;
  let pointerX = 0;
  let pointerY = 0;
  let jumpLatch = false;
  let grounded = false;
  let lastSpeed = 0;
  let shake = 0;

  const forward = new THREE.Vector3();
  const cameraVelocity = new THREE.Vector3();
  const desiredCamera = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const bodyQuaternion = new THREE.Quaternion();
  const cameraDirection = new THREE.Vector3();
  const tempVector = new THREE.Vector3();

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
    shake = 0;
    cameraVelocity.set(0, 0, 0);
  }

  function teleport(x, z, targetX = 0, targetZ = 0) {
    const heading = Math.atan2(targetX - x, targetZ - z);
    reset({ x, y: 1.4, z, heading });
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

  function onPointerDown(event) {
    if (event.button !== 0 || event.target !== canvas) return;
    dragging = true;
    pointerX = event.clientX;
    pointerY = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (!dragging) return;
    cameraYaw = THREE.MathUtils.clamp(cameraYaw - (event.clientX - pointerX) * 0.0055, -1.25, 1.25);
    cameraPitch = THREE.MathUtils.clamp(cameraPitch + (event.clientY - pointerY) * 0.004, -0.08, 0.58);
    pointerX = event.clientX;
    pointerY = event.clientY;
  }

  function onPointerUp(event) {
    dragging = false;
    canvas.releasePointerCapture?.(event.pointerId);
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
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  function prePhysics(delta, locked = false) {
    const speed = rayVehicle.currentVehicleSpeed();
    const throttle = locked ? 0 : (input.has('forward') ? 1 : 0) - (input.has('backward') ? 1 : 0);
    const steerInput = locked ? 0 : (input.has('left') ? 1 : 0) - (input.has('right') ? 1 : 0);
    const boosting = !locked && input.has('boost');
    const targetSteering = steerInput * steeringLimit(speed, boosting);
    steering = THREE.MathUtils.lerp(steering, targetSteering, 1 - Math.pow(0.00008, delta));

    rayVehicle.setWheelSteering(0, steering);
    rayVehicle.setWheelSteering(1, steering);
    const force = engineForce(speed, throttle, boosting);
    const braking = locked || input.has('brake');
    for (let index = 0; index < 4; index += 1) {
      rayVehicle.setWheelEngineForce(index, force);
      rayVehicle.setWheelBrake(index, braking ? (index < 2 ? 19 : 11) : throttle === 0 ? 0.7 : 0);
      rayVehicle.setWheelFrictionSlip(index, braking && index >= 2 ? 0.92 : 2.25);
    }

    grounded = false;
    for (let index = 0; index < 4; index += 1) grounded ||= rayVehicle.wheelIsInContact(index);
    if (!locked && input.has('jump') && grounded && !jumpLatch) {
      body.applyImpulse({ x: 0, y: 860, z: 0 }, true);
      jumpLatch = true;
    }

    rayVehicle.updateVehicle(delta);
  }

  function postPhysics(delta) {
    const position = body.translation();
    const rotation = body.rotation();
    rover.position.set(position.x, position.y, position.z);
    rover.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);

    for (let index = 0; index < 4; index += 1) {
      const pivot = rover.userData.wheelPivots[index];
      const spin = rover.userData.wheelSpins[index];
      const location = wheelLocations[index];
      pivot.position.set(location[0], -0.06 - rayVehicle.wheelSuspensionLength(index), location[2]);
      pivot.rotation.y = index < 2 ? rayVehicle.wheelSteering(index) : 0;
      spin.rotation.x = rayVehicle.wheelRotation(index);
    }

    const speed = rayVehicle.currentVehicleSpeed();
    const impact = Math.max(0, Math.abs(lastSpeed) - Math.abs(speed) - 3.8);
    if (impact > 0.5) {
      shake = Math.min(1, shake + impact * 0.055);
      onImpact(Math.min(1, impact / 11));
    }
    lastSpeed = speed;

    if (position.y < -5 || Math.abs(position.x) > 52 || Math.abs(position.z) > 52) reset();
    updateCamera(delta);
  }

  function updateCamera(delta) {
    const rotation = body.rotation();
    bodyQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    forward.set(0, 0, 1).applyQuaternion(bodyQuaternion).normalize();
    cameraDirection.copy(forward).applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);

    lookTarget.copy(rover.position).addScaledVector(forward, 2.2);
    lookTarget.y += 0.58;
    desiredCamera.copy(rover.position).addScaledVector(cameraDirection, -8.2);
    desiredCamera.y += 3.8 + cameraPitch * 4.8;

    const obstruction = physics.castSegment(lookTarget, desiredCamera, body);
    if (obstruction !== null) {
      tempVector.copy(desiredCamera).sub(lookTarget).normalize();
      desiredCamera.copy(lookTarget).addScaledVector(tempVector, Math.max(1.8, obstruction - 0.42));
    }

    for (const axis of ['x', 'y', 'z']) {
      const result = springScalar(
        camera.position[axis],
        desiredCamera[axis],
        cameraVelocity[axis],
        8.2,
        0.95,
        delta,
      );
      camera.position[axis] = result.value;
      cameraVelocity[axis] = result.velocity;
    }

    shake *= Math.pow(0.035, delta);
    if (shake > 0.002) {
      camera.position.x += (Math.random() - 0.5) * shake * 0.24;
      camera.position.y += (Math.random() - 0.5) * shake * 0.14;
    }
    camera.lookAt(lookTarget);
    camera.fov = THREE.MathUtils.lerp(camera.fov, cameraFov(rayVehicle.currentVehicleSpeed()), 0.08);
    camera.updateProjectionMatrix();
  }

  reset();
  camera.position.set(0, 5.2, 47);

  return {
    rover,
    body,
    chassisCollider,
    get position() {
      return rover.position;
    },
    get speed() {
      return rayVehicle.currentVehicleSpeed();
    },
    get isGrounded() {
      return grounded;
    },
    reset,
    teleport,
    prePhysics,
    postPhysics,
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
      world.removeVehicleController(rayVehicle);
      world.removeRigidBody(body);
    },
  };
}
