import {useLayoutEffect} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

export function useWinterScroll(root) {
 useLayoutEffect(()=>{
  const host=root.current;
  const media=gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)',()=>{
   const lenis=new Lenis({autoRaf:false,lerp:.085,anchors:true,syncTouch:false,prevent:node=>node.closest?.('dialog')});
   const tick=time=>lenis.raf(time*1000);
   gsap.ticker.add(tick);lenis.on('scroll',ScrollTrigger.update);
   const sync=()=>host.querySelector('dialog[open]')?lenis.stop():lenis.start();
   const observer=new MutationObserver(sync);observer.observe(host,{attributes:true,subtree:true,attributeFilter:['open']});sync();
   const context=gsap.context(()=>{
    const journey=host.querySelector('.winter-journey');
    const passage=gsap.timeline({scrollTrigger:{trigger:journey,start:'top top',end:'bottom bottom',scrub:.65,invalidateOnRefresh:true}});
    // Copy holds its position. Only the scenery supplies depth.
    passage.to('.landing-copy, .landing-hero > .snow-surfaces',{autoAlpha:0,duration:.22,ease:'none'},.05)
      .to('.winter-scroll-cue',{autoAlpha:0,duration:.12,ease:'none'},0);
    passage.to('.winter-distance',{scale:1.08,yPercent:-3,duration:1,ease:'none'},0)
      .to('.winter-near-left',{xPercent:-16,yPercent:10,scale:1.12,duration:1,ease:'none'},0)
      .to('.winter-near-right',{xPercent:16,yPercent:10,scale:1.12,duration:1,ease:'none'},0);
    // Reach the passage color before the sticky landscape gives way to the next section.
    passage.to('.winter-passage-shade',{opacity:1,duration:.82,ease:'sine.inOut'},.18)
      .fromTo('.winter-desktop-preview, .winter-passage > .snow-surfaces',{opacity:0},{opacity:1,duration:.34,ease:'sine.out'},.30);
    const lights=gsap.timeline({scrollTrigger:{trigger:'.winter-features',start:'top 94%',end:'top 28%',scrub:.55}});
    lights.fromTo('.winter-feature-lights',{opacity:0,clipPath:'inset(0 48% 0 48%)'},
      {opacity:1,clipPath:'inset(0 0% 0 0%)',duration:1,ease:'sine.inOut'},0);
    ScrollTrigger.create({
     trigger:'.winter-feature-lights',start:'top bottom',end:'bottom top',
     toggleClass:'winter-lights-visible',
    });
    host.querySelectorAll('.winter-feature').forEach((card,i)=>{
     gsap.fromTo(card,{autoAlpha:0,y:24},{autoAlpha:1,y:0,duration:.75,delay:i*.09,ease:'power3.out',
      scrollTrigger:{trigger:card,start:'top 96%',toggleActions:'play none none reverse'}});
    });
   },host);
   const refresh=()=>ScrollTrigger.refresh();
   document.fonts.ready.then(refresh);
   window.addEventListener('load',refresh);
   return()=>{context.revert();observer.disconnect();window.removeEventListener('load',refresh);lenis.destroy();gsap.ticker.remove(tick);};
  });
  return()=>media.revert();
 },[root]);
}
