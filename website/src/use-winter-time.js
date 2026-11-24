import {useCallback, useEffect, useState} from 'react';
import {TIME_PHASES, THEME_STORAGE_KEY, resolvePhase, celestialPosition} from './winter-time';

function readMode() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return TIME_PHASES.includes(saved) ? saved : 'auto';
  } catch { return 'auto'; }
}
export function useWinterTime() {
  const [mode, setMode] = useState(readMode);
  const [now, setNow] = useState(() => new Date());
  const hour = now.getHours() + now.getMinutes() / 60;
  const phase = resolvePhase(mode, hour);
  useEffect(() => {
    const update = () => setNow(new Date());
    const syncStorage = event => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) setMode(readMode());
    };
    const timer = setInterval(update, 30000);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('pageshow', update);
    window.addEventListener('storage', syncStorage);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('pageshow', update);
      window.removeEventListener('storage', syncStorage);
    };
  }, []);
  useEffect(() => {
    const colours = {morning:'#c5def7', afternoon:'#b8dafe', evening:'#f4dfca', night:'#081a2d'};
    const scheme = phase === 'night' ? 'dark' : 'light';
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const schemeMeta = document.querySelector('meta[name="color-scheme"]');
    if (themeMeta) themeMeta.content = colours[phase];
    if (schemeMeta) schemeMeta.content = scheme;
    document.documentElement.style.colorScheme = scheme;
  }, [phase]);
  const selectMode = useCallback(next => {
    if (next !== 'auto' && !TIME_PHASES.includes(next)) return;
    setMode(next); setNow(new Date());
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* Session state remains usable. */ }
  }, []);
  return {mode, phase, selectMode, position: celestialPosition(mode, hour)};
}
