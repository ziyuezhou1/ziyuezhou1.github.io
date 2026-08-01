import RAPIER from '@dimforge/rapier3d-compat';

const FIXED_STEP = 1 / 60;

export async function createPhysics() {
  await RAPIER.init();

  const world = new RAPIER.World({ x: 0, y: -19.5, z: 0 });
  world.timestep = FIXED_STEP;
  world.numSolverIterations = 8;
  world.maxCcdSubsteps = 2;

  function addFixedBox({
    position,
    size,
    rotation = { x: 0, y: 0, z: 0, w: 1 },
    friction = 1.1,
    restitution = 0.02,
  }) {
    const collider = RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2)
      .setTranslation(position[0], position[1], position[2])
      .setRotation(rotation)
      .setFriction(friction)
      .setRestitution(restitution);
    return world.createCollider(collider);
  }

  function addDynamicBox({
    position,
    size,
    rotation = { x: 0, y: 0, z: 0, w: 1 },
    density = 12,
    friction = 0.8,
    restitution = 0.12,
  }) {
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(position[0], position[1], position[2])
        .setRotation(rotation)
        .setLinearDamping(0.45)
        .setAngularDamping(0.6)
        .setCcdEnabled(true),
    );
    const collider = world.createCollider(
      RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2)
        .setDensity(density)
        .setFriction(friction)
        .setRestitution(restitution),
      body,
    );
    return { body, collider };
  }

  function castSegment(from, to, excludeBody) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const distance = Math.hypot(dx, dy, dz);
    if (distance < 0.001) return null;
    const ray = new RAPIER.Ray(from, {
      x: dx / distance,
      y: dy / distance,
      z: dz / distance,
    });
    const hit = world.castRay(ray, distance, true, undefined, undefined, undefined, excludeBody);
    return hit ? hit.timeOfImpact : null;
  }

  return {
    RAPIER,
    world,
    fixedStep: FIXED_STEP,
    addFixedBox,
    addDynamicBox,
    castSegment,
    step() {
      world.step();
    },
    dispose() {
      world.free();
    },
  };
}
