import { clamp } from './state.js';

export function steeringLimit(speed, boost = false) {
  const normalized = clamp(Math.abs(speed) / (boost ? 34 : 26), 0, 1);
  return 0.48 - normalized * 0.24;
}

export function engineForce(speed, throttle, boost = false) {
  if (!throttle) return 0;
  const limit = boost ? 34 : 25;
  const ratio = clamp(1 - Math.abs(speed) / limit, 0.15, 1);
  const directionPenalty = speed * throttle < -1 ? 0.55 : 1;
  return throttle * (boost ? 1550 : 1050) * ratio * directionPenalty;
}

export function cameraFov(speed) {
  return 52 + clamp(Math.abs(speed) / 32, 0, 1) * 13;
}

export function springScalar(current, target, velocity, frequency, damping, delta) {
  const dt = Math.min(delta, 0.05);
  const acceleration = (target - current) * frequency * frequency - velocity * 2 * damping * frequency;
  const nextVelocity = velocity + acceleration * dt;
  return {
    value: current + nextVelocity * dt,
    velocity: nextVelocity,
  };
}
