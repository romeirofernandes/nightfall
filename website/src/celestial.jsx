import React, {useLayoutEffect, useEffect, useRef, useState} from 'react';
import gsap from 'gsap';

export function Celestial({phase, position}) {
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
    const target = position.x + '%';
    const switchingBody = previous.current !== null && (previous.current === 'night') !== night;
    if (previous.current === null || reduced) {
      timeline.current?.kill();
      gsap.set(active, {left: target, y: 0, opacity: 1, scale: 1});
      gsap.set(outgoing, {opacity: 0});
    } else if (switchingBody) {
      timeline.current?.kill();
      const drop = Math.min(145, host.current.clientHeight * .17);
      // A quick reversal continues from the bodies' current on-screen positions.
      if (Number(gsap.getProperty(active, 'opacity')) < .03) {
        gsap.set(active, {left: '-8%', y: drop, opacity: 0, scale: .76});
      }
      const sequence = gsap.timeline();
      sequence.to(outgoing, {left: '110%', y: drop, scale: .78, duration: 1.85, ease: 'sine.in'}, 0)
        .to(outgoing, {opacity: 0, duration: 1.4, ease: 'sine.in'}, .25)
        .to(active, {left: target, y: 0, scale: 1, duration: 2.35, ease: 'sine.out'}, .25)
        .to(active, {opacity: 1, duration: 1.65, ease: 'sine.out'}, .45);
      timeline.current = sequence;
    } else if (!timeline.current?.isActive()) {
      timeline.current = gsap.timeline().to(active, {left: target, duration: 2, ease: 'sine.inOut'});
    }
    previous.current = phase;
  }, [phase, position.x, reduced]);
  useLayoutEffect(() => () => { timeline.current?.kill(); }, []);
  return <div className="sky-orbit" ref={host} aria-hidden="true">
    <div className="sky-body sky-sun"><div className="sky-sun-atmosphere"/><div className="sky-sun-disc"/></div>
    <div className="sky-body sky-moon"><div className="sky-moon-atmosphere"/><img src="/media/winter/moon.png" alt="" width="1024" height="1024"/></div>
  </div>;
}
