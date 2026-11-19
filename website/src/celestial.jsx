import React, {useLayoutEffect, useEffect, useRef, useState} from 'react';
import gsap from 'gsap';

export function Celestial({phase, position, paused}) {
  const host = useRef(null);
  const previous = useRef(null);
  const timeline = useRef(null);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useLayoutEffect(() => {
    const bodies = host.current.querySelectorAll('.sky-body');
    const night = phase === 'night';
    const active = bodies[night ? 1 : 0], outgoing = bodies[night ? 0 : 1];
    const y = 'var(--sky-orbit-height)';
    timeline.current?.kill();
    gsap.killTweensOf(bodies);
    if (previous.current === null || reduced) {
      gsap.set(active, {left: position.x + '%', top: y, opacity: 1, scale: 1});
      gsap.set(outgoing, {opacity: 0});
    } else if ((previous.current === 'night') !== night) {
      const sequence = gsap.timeline();
      sequence.to(outgoing, {left: '112%', top: '40%', opacity: 0, scale: .7, duration: 2.1, ease: 'power2.in'}, 0);
      sequence.fromTo(active, {left: '-12%', top: '42%', opacity: 0, scale: .72}, {
        keyframes: [
          {left: '8%', top: '25%', opacity: 1, scale: .9, duration: 1.15},
          {left: position.x + '%', top: y, scale: 1, duration: 1.65},
        ], ease: 'power2.out',
      }, .25);
      timeline.current = sequence;
    } else {
      timeline.current = gsap.timeline().to(active, {left: position.x + '%', top: y, duration: 2, ease: 'sine.inOut'});
    }
    previous.current = phase;
    return () => { timeline.current?.kill(); gsap.killTweensOf(bodies); };
  }, [phase, position.x, reduced]);
  useEffect(() => { timeline.current?.paused(paused); }, [paused, phase]);
  return <div className="sky-orbit" ref={host} data-paused={paused} aria-hidden="true">
    <div className="sky-body sky-sun"><div className="sky-sun-atmosphere"/><div className="sky-sun-disc"/></div>
    <div className="sky-body sky-moon"><div className="sky-moon-atmosphere"/><img src="/media/winter/moon.png" alt="" width="1024" height="1024"/></div>
  </div>;
}
