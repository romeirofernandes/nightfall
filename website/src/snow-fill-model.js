export function advanceFill(state, dt, active, incoming = 0) {
  if (state.phase === 'draining') {
    const elapsed = state.elapsed + dt;
    const progress = Math.min(1, elapsed / 3.6);
    const fill = 1 - .92 * (progress * progress * (3 - 2 * progress));
    return {fill, phase:progress === 1 ? 'filling' : 'draining', elapsed:progress === 1 ? 0 : elapsed, released:Math.max(0,state.fill-fill)};
  }
  const fill = active ? Math.min(1, state.fill + dt*.024 + incoming) : state.fill;
  return {fill, phase:fill >= 1 ? 'draining' : 'filling', elapsed:0, released:0};
}
