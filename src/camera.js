import * as THREE from 'three';

export const CAMERA_PRESET = Object.freeze({
  fov: 25,
  theta: Math.PI * 0.25,
  desktopPhi: Math.PI * 0.27,
  compactPhi: Math.PI * 0.31,
  minRadius: 15,
  maxRadius: 30,
  desktopRadius: 23,
  compactRadius: 27,
});

export function dampingFactor(speed, delta) {
  return 1 - Math.exp(-speed * Math.max(0, delta));
}

export function createStableCamera({ camera, canvas, reducedMotion = false }) {
  const compact = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const phi = compact ? CAMERA_PRESET.compactPhi : CAMERA_PRESET.desktopPhi;
  const focus = new THREE.Vector3();
  const pan = new THREE.Vector3();
  const panTarget = new THREE.Vector3();
  const offset = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  const previousTarget = new THREE.Vector3();
  const screenRight = new THREE.Vector3(
    Math.cos(CAMERA_PRESET.theta),
    0,
    -Math.sin(CAMERA_PRESET.theta),
  );
  const screenDepth = new THREE.Vector3(
    Math.sin(CAMERA_PRESET.theta),
    0,
    Math.cos(CAMERA_PRESET.theta),
  );
  const pointers = new Map();

  let initialized = false;
  let radius = compact ? CAMERA_PRESET.compactRadius : CAMERA_PRESET.desktopRadius;
  let radiusTarget = radius;
  let lastPinch = 0;
  let lastSingle = null;

  function update(delta, target, snap = false) {
    const targetPoint = new THREE.Vector3(target.x, 0, target.z);
    const moved = initialized ? targetPoint.distanceTo(previousTarget) : 0;
    previousTarget.copy(targetPoint);

    if (!initialized || snap || focus.distanceTo(targetPoint) > 22) {
      focus.copy(targetPoint);
      pan.copy(panTarget);
      initialized = true;
    } else {
      const followSpeed = reducedMotion ? 5.5 : 7.5;
      focus.lerp(targetPoint, dampingFactor(followSpeed, delta));
      if (moved > 0.025) {
        panTarget.multiplyScalar(Math.exp(-2.6 * delta));
      }
      pan.lerp(panTarget, dampingFactor(8, delta));
    }

    radius = THREE.MathUtils.lerp(radius, radiusTarget, dampingFactor(10, delta));
    offset.setFromSphericalCoords(radius, phi, CAMERA_PRESET.theta);
    lookTarget.copy(focus).add(pan);
    lookTarget.y = 0.72;
    camera.position.copy(lookTarget).add(offset);
    camera.lookAt(lookTarget);
  }

  function onWheel(event) {
    if (event.target !== canvas) return;
    event.preventDefault();
    radiusTarget = THREE.MathUtils.clamp(
      radiusTarget + event.deltaY * 0.012,
      CAMERA_PRESET.minRadius,
      CAMERA_PRESET.maxRadius,
    );
  }

  function onPointerDown(event) {
    if (event.target !== canvas || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture?.(event.pointerId);
    if (pointers.size === 1) lastSingle = { x: event.clientX, y: event.clientY };
    if (pointers.size === 2) lastPinch = pinchDistance();
  }

  function pinchDistance() {
    const values = [...pointers.values()];
    if (values.length < 2) return 0;
    return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
  }

  function onPointerMove(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size === 1 && lastSingle) {
      const dx = event.clientX - lastSingle.x;
      const dy = event.clientY - lastSingle.y;
      const scale = radiusTarget * 0.0019;
      panTarget.addScaledVector(screenRight, -dx * scale);
      panTarget.addScaledVector(screenDepth, -dy * scale);
      panTarget.clampLength(0, 11);
      lastSingle = { x: event.clientX, y: event.clientY };
    } else if (pointers.size === 2) {
      const distance = pinchDistance();
      if (lastPinch > 0) {
        radiusTarget = THREE.MathUtils.clamp(
          radiusTarget - (distance - lastPinch) * 0.045,
          CAMERA_PRESET.minRadius,
          CAMERA_PRESET.maxRadius,
        );
      }
      lastPinch = distance;
      lastSingle = null;
    }
  }

  function onPointerUp(event) {
    pointers.delete(event.pointerId);
    if (pointers.size === 1) {
      const remaining = [...pointers.values()][0];
      lastSingle = { ...remaining };
    } else {
      lastSingle = null;
    }
    lastPinch = 0;
  }

  camera.fov = CAMERA_PRESET.fov;
  camera.updateProjectionMatrix();
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  return {
    update,
    snap(target) {
      update(1, target, true);
    },
    dispose() {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    },
  };
}
