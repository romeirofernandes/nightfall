import React, {useEffect, useRef} from 'react';
import {advanceFill} from './snow-fill-model';

const SAMPLE_COUNT = 25;
const randomBetween = (low, high) => low + Math.random() * (high - low);
const grain = Array.from({length: 140}, (_, i) => ({
  x: Math.abs(Math.sin(i * 127.1) * 43758.54) % 1,
  y: Math.abs(Math.sin(i * 73.7) * 23421.6) % 1,
  light: i % 3 !== 0,
}));

export function SnowFill({paused, field}) {
  const canvas = useRef(null);
  const frozen = useRef(paused);
  useEffect(() => { frozen.current = paused; }, [paused]);

  useEffect(() => {
    const el = canvas.current;
    const button = el.parentElement;
    const landing = button.closest('.landing');
    const ctx = el.getContext('2d');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let state = {fill: 0, phase: 'filling', elapsed: 0};
    let visibleFill = 0;
    let hover = false, focus = false, raf = 0, last = 0;
    let w = 1, h = 1, spawn = 0, outlet = .5;
    const falling = [];
    const powder = [];
    const drifts = new Float32Array(SAMPLE_COUNT);
    const edge = new Float32Array(SAMPLE_COUNT);
    const suspended = () => frozen.current || document.hidden || !!landing.querySelector('dialog[open]');

    function surface() {
      const fullness = Math.min(1, visibleFill * 5, (1 - visibleFill) * 12);
      const slump = state.phase === 'draining' ? Math.sin(Math.PI * Math.min(1, state.elapsed / 3.6)) * 6 : 0;
      for (let i = 0; i < SAMPLE_COUNT; i++) {
        const u = i / (SAMPLE_COUNT - 1);
        const contour = Math.sin(u * 14) * .6 + Math.sin(u * 31 + 2) * .28;
        const sag = slump * Math.exp(-((u - outlet) ** 2) / .018);
        edge[i] = Math.max(0, Math.min(h, h * (1 - visibleFill) + fullness * (contour - drifts[i] + sag)));
      }
    }

    function paint() {
      surface();
      ctx.clearRect(0, 0, w, h);
      if (visibleFill > 0) {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let i = 0; i < SAMPLE_COUNT; i++) ctx.lineTo(i * w / (SAMPLE_COUNT - 1), edge[i]);
        ctx.lineTo(w, h);
        ctx.closePath();
        const top = Math.min(...edge);
        const shade = ctx.createLinearGradient(0, top, 0, h);
        const night = landing.dataset.theme === 'night';
        shade.addColorStop(0, night ? '#e6f2fa' : '#fffdf5');
        shade.addColorStop(.35, night ? '#dcebf5' : '#edf3f4');
        shade.addColorStop(1, night ? '#acc7db' : '#c4d8e3');
        ctx.fillStyle = shade;
        ctx.fill();
        ctx.save();
        ctx.clip();
        for (const dot of grain) {
          ctx.fillStyle = dot.light ? '#fffdf7a0' : '#7190a240';
          ctx.fillRect(dot.x * w, dot.y * h, .8, .65);
        }
        ctx.restore();
      }
      const points = Array.from(edge, (y, i) => `${i * 100 / (SAMPLE_COUNT - 1)}% ${y}px`);
      button.style.setProperty('--snow-fill-shape', `polygon(0 100%, ${points.join(', ')}, 100% 100%)`);
      button.dataset.snowState = state.phase;

      for (const flake of falling) {
        ctx.globalAlpha = flake.clump ? .96 : .7;
        ctx.fillStyle = '#f7fbfd';
        ctx.beginPath();
        ctx.ellipse(flake.x, flake.y, flake.r, flake.r * .64, flake.angle, 0, Math.PI * 2);
        ctx.fill();
        if (flake.clump) {
          ctx.beginPath();
          ctx.ellipse(flake.x - flake.r * .65, flake.y + .5, flake.r * .65, flake.r * .46, -.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = '#ffffff';
      for (const speck of powder) {
        ctx.globalAlpha = speck.life * 1.6;
        ctx.fillRect(speck.x, speck.y, speck.r, speck.r);
      }
      ctx.globalAlpha = 1;
    }

    function resize() {
      const rect = el.getBoundingClientRect();
      const scale = Math.min(devicePixelRatio || 1, 2);
      w = Math.max(1, el.clientWidth || rect.width);
      h = Math.max(1, el.clientHeight || rect.height);
      el.width = Math.round(w * scale);
      el.height = Math.round(h * scale);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      paint();
    }

    function emit(x, y, area, clump) {
      if (falling.length >= 90) return;
      falling.push({
        x, y, area, clump,
        r: clump ? Math.min(2.5, .8 + Math.sqrt(area) * .28) : randomBetween(.42, .9),
        vx: randomBetween(-5, 5), vy: randomBetween(6, 17), angle: randomBetween(-1, 1),
      });
    }

    function land(flake, y) {
      const position = flake.x / w * (SAMPLE_COUNT - 1);
      for (let j = 0; j < SAMPLE_COUNT; j++) {
        const weight = Math.max(0, 1 - Math.abs(j - position) / 3);
        drifts[j] = Math.min(4.5, drifts[j] + weight * (flake.clump ? .85 : .16));
      }
      if (flake.clump && powder.length < 40) {
        for (let i = 0; i < 4; i++) {
          powder.push({x: flake.x, y: y - .5, vx: randomBetween(-17, 17), vy: randomBetween(-11, -4),
            life: randomBetween(.22, .36), r: randomBetween(.55, 1.2)});
        }
      }
    }

    function run(now) {
      const dt = Math.min(.05, (now - last) / 1000);
      last = now;
      const active = hover || focus;
      if (!suspended()) {
        if (active && state.phase === 'filling') {
          const roof = field.current?.take(button, dt) ?? [];
          for (let i = 0; i < roof.length; i += 2) {
            const piece = roof[i];
            emit(piece.x, -piece.depth, piece.area + (roof[i + 1]?.area ?? 0), true);
          }
          spawn += dt * 24;
          while (spawn >= 1) {
            spawn--;
            emit(randomBetween(3, w - 3), -1, w * h * .024 / 24, false);
          }
        }

        surface();
        let incoming = 0;
        for (let i = falling.length - 1; i >= 0; i--) {
          const flake = falling[i];
          flake.vy += (flake.clump ? 165 : 63) * dt;
          flake.x = Math.max(1, Math.min(w - 1, flake.x + flake.vx * dt));
          flake.y += flake.vy * dt;
          flake.angle += flake.vx * dt * .16;
          const y = edge[Math.round(flake.x / w * (SAMPLE_COUNT - 1))];
          if (flake.y + flake.r * .5 < y) continue;
          land(flake, y);
          incoming += flake.area / (w * h);
          falling.splice(i, 1);
        }
        for (let i = powder.length - 1; i >= 0; i--) {
          const speck = powder[i];
          speck.life -= dt;
          speck.x += speck.vx * dt;
          speck.y += speck.vy * dt;
          speck.vy += 65 * dt;
          if (speck.life <= 0) powder.splice(i, 1);
        }
        const before = state.phase;
        state = advanceFill(state, dt, false);
        if (before === 'filling') {
          state.fill = Math.min(1, state.fill + incoming);
          if (state.fill === 1) {
            state.phase = 'draining';
            outlet = randomBetween(.3, .7);
          }
        }
        if (state.released > 0) field.current?.spill(button, state.released, outlet);
        if (active || falling.length || before === 'draining') {
          for (let i = 0; i < SAMPLE_COUNT; i++) drifts[i] *= Math.exp(-dt * 1.1);
        }
        const difference = state.fill - visibleFill;
        visibleFill += Math.abs(difference) < .0005 ? difference : difference * (1 - Math.exp(-dt * 14));
        paint();
      }
      raf = 0;
      if ((active || state.phase === 'draining' || falling.length || powder.length || visibleFill !== state.fill) && !reduced.matches) {
        raf = requestAnimationFrame(run);
      }
    }

    function updateActivity() {
      const active = hover || focus;
      button.dataset.snowFilling = String(active);
      if (reduced.matches) {
        if (active && !suspended() && state.phase === 'filling') {
          state = {...state, fill: Math.min(.92, state.fill + .012)};
          visibleFill = state.fill;
          paint();
        }
      } else if (!raf && (active || state.phase === 'draining' || falling.length || powder.length || visibleFill !== state.fill)) {
        last = performance.now();
        raf = requestAnimationFrame(run);
      }
    }
    const enter = event => { if (event.pointerType !== 'touch') { hover = true; updateActivity(); } };
    const leave = () => { hover = false; updateActivity(); };
    const onFocus = () => { focus = button.matches(':focus-visible'); updateActivity(); };
    const onBlur = () => { focus = false; updateActivity(); };
    const motionChanged = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (reduced.matches) { falling.length = 0; powder.length = 0; visibleFill = state.fill; paint(); }
      else updateActivity();
    };
    button.addEventListener('pointerenter', enter);
    button.addEventListener('pointerleave', leave);
    button.addEventListener('focus', onFocus);
    button.addEventListener('blur', onBlur);
    reduced.addEventListener('change', motionChanged);
    const observer = new ResizeObserver(resize);
    observer.observe(button);
    resize();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      reduced.removeEventListener('change', motionChanged);
      button.removeEventListener('pointerenter', enter);
      button.removeEventListener('pointerleave', leave);
      button.removeEventListener('focus', onFocus);
      button.removeEventListener('blur', onBlur);
      button.style.removeProperty('--snow-fill-shape');
      delete button.dataset.snowState;
      delete button.dataset.snowFilling;
    };
  }, [field]);
  return <canvas className="button-snow-fill" ref={canvas} aria-hidden="true"/>;
}
