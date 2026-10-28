/**
 * A damped spring for interface motion. `state.x` is pulled toward `target` and `state.v` keeps the velocity, so when the
 * target changes halfway (the pointer leaves again before the last move has settled) the motion carries on from where it
 * is instead of starting over. Integrated in fixed small steps, which keeps it stable at any frame rate.
 *
 * `damping` below 2 * sqrt(stiffness * mass) overshoots the target a little and settles back, which is what makes it feel
 * like a spring; at that value it arrives without overshoot.
 */
export function stepSpring(state, target, dt, { stiffness = 420, damping = 29, mass = 1 } = {}) {
  const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / steps;
  for (let i = 0; i < steps; i += 1) {
    const acceleration = (-stiffness * (state.x - target) - damping * state.v) / mass;
    state.v += acceleration * h;
    state.x += state.v * h;
  }
  return state;
}

/** Whether the spring has come to rest on its target (close enough that no one could see it move). */
export function springAtRest(state, target, tolerance = 0.0008) {
  return Math.abs(state.x - target) < tolerance && Math.abs(state.v) < tolerance;
}
