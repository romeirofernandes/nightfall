// Deliberately clock-based: no location permission or astronomical claims.
export const TIME_PHASES = ['morning', 'afternoon', 'evening', 'night'];
export const THEME_STORAGE_KEY = 'nightfall-time-mode';

export function phaseForHour(hour) {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 16) return 'afternoon';
  if (h >= 16 && h < 19) return 'evening';
  return 'night';
}

export function resolvePhase(mode, hour) {
  return TIME_PHASES.includes(mode) ? mode : phaseForHour(hour);
}

export function celestialPosition(mode, hour) {
  const phase = resolvePhase(mode, hour);
  const sample = mode === 'auto' ? hour : { morning: 8.5, afternoon: 13, evening: 17.5, night: 22 }[phase];
  const progress = phase === 'night'
    ? ((sample - 19 + 24) % 24) / 11
    : Math.max(0, Math.min(1, (sample - 6) / 13));
  // Travel above the mountains, outside the central copy column.
  return { x: 14 + progress * 72, y: 43 - Math.sin(progress * Math.PI) * 38 };
}
