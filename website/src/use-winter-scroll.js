import {useLayoutEffect} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

export function useWinterScroll(root, paused) {
 useLayoutEffect(()=>{
  const host=root.current;
  const media=gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)',()=>{
   const lenis=new Lenis({autoRaf:false,smoothWheel:!paused,lerp:.085,anchors:true,syncTouch:false,prevent:node=>node.closest?.('dialog')});
   const tick=time=>lenis.raf(time*1000);
   gsap.ticker.add(tick);lenis.on('scroll',ScrollTrigger.update);
   const sync=()=>host.querySelector('dialog[open]')?lenis.stop():lenis.start();
   const observer=new MutationObserver(sync);observer.observe(host,{attributes:true,subtree:true,attributeFilter:['open']});sync();
   const context=gsap.context(()=>{
    const journey=host.querySelector('.winter-journey');
    const passage=gsap.timeline({scrollTrigger:{trigger:journey,start:'top top',end:'bottom bottom',scrub:paused?true:.65,invalidateOnRefresh:true}});
    // Copy holds its position. Only the scenery supplies depth.
    passage.to('.landing-copy, .snow-surfaces',{autoAlpha:0,duration:.22,ease:'none'},.05)
      .to('.winter-scroll-cue',{autoAlpha:0,duration:.12,ease:'none'},0);
    if(!paused){
     passage.to('.winter-distance',{scale:1.08,yPercent:-3,duration:1,ease:'none'},0)
      .to('.winter-near-left',{xPercent:-16,yPercent:10,scale:1.12,duration:1,ease:'none'},0)
      .to('.winter-near-right',{xPercent:16,yPercent:10,scale:1.12,duration:1,ease:'none'},0);
    }
    passage.to('.winter-passage-shade',{opacity:.72,duration:.65,ease:'none'},.35);
   },host);
   const refresh=()=>ScrollTrigger.refresh();
   document.fonts.ready.then(refresh);
   window.addEventListener('load',refresh);
   return()=>{context.revert();observer.disconnect();window.removeEventListener('load',refresh);lenis.destroy();gsap.ticker.remove(tick);};
  });
  return()=>media.revert();
 },[root,paused]);
}
