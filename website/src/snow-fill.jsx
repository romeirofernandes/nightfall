import React, {useEffect, useRef} from 'react';
import gsap from 'gsap';
import {advanceFill} from './snow-fill-model';

export function SnowFill({paused, field}) {
 const canvas=useRef(null), frozen=useRef(paused);
 useEffect(()=>{frozen.current=paused},[paused]);
 useEffect(()=>{
  const el=canvas.current,button=el.parentElement,ctx=el.getContext('2d');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let state={fill:0,phase:'filling',elapsed:0},hover=false,focus=false,raf,last=0,w=1,h=1,spawn=0;
  const falling=[];
  const collapse={open:0};let collapseTimeline=null;
  function paint(){
   const r=button.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);w=r.width;h=r.height;
   if(el.width!==Math.round(w*d)||el.height!==Math.round(h*d)){el.width=Math.round(w*d);el.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);}
   const fill=state.fill;button.style.setProperty('--snow-fill',Math.min(100,fill*100)+'%');
   ctx.clearRect(0,0,w,h);
   if(fill){
    const y=h*(1-fill);ctx.beginPath();ctx.moveTo(0,h);
    for(let x=0;x<=w+2;x+=2){const drift=(Math.sin(x*.045)+Math.sin(x*.13+1)*.65+Math.sin(x*.31)*.2)*Math.min(3.5,fill*20);ctx.lineTo(x,Math.min(h,y+drift));}
    ctx.lineTo(w,h);ctx.closePath();
    const shade=ctx.createLinearGradient(0,y,0,h);shade.addColorStop(0,'#fbfcf7');shade.addColorStop(.2,'#e6eff2');shade.addColorStop(1,'#c5d8e1');ctx.fillStyle=shade;ctx.fill();
    ctx.save();ctx.clip();
    for(let i=0;i<120;i++){const x=Math.abs(Math.sin(i*127.1)*43758.54)%1*w;const py=Math.abs(Math.sin(i*73.7)*23421.6)%1*h;
     ctx.fillStyle=i%3?'#ffffff65':'#809fb126';ctx.fillRect(x,py,.7,.5);
    }ctx.restore();
   }
   ctx.fillStyle='#edf4f6';
   for(const p of falling){ctx.globalAlpha=.65;ctx.beginPath();ctx.ellipse(p.x,p.y,p.r,p.r*.65,.4,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
  }
  function run(now){
   const dt=Math.min(.05,(now-last)/1000);last=now;
   const active=hover||focus;
   if(!frozen.current&&!document.hidden&&!button.closest('.landing').querySelector('dialog[open]')){
    const roof=active?field.current?.take(button,dt)??[]:[];
    if(active){
     spawn+=dt*26;
     while(spawn>=1){spawn--;
      if(falling.length<90)falling.push({x:Math.random()*w,y:-2,vy:9+Math.random()*12,r:.45+Math.random()*.6,area:w*h*.024/26});
     }
     // Broken rim snow keeps its position and travels down before contributing volume.
     for(let i=0;i<roof.length;i+=2){
      const piece=roof[i];if(falling.length<90)falling.push({x:piece.x,y:-piece.depth,vy:4,r:.7+Math.min(1.1,Math.sqrt(piece.area)*.12),area:piece.area+(roof[i+1]?.area??0)});
     }
    }
    let incoming=0;const surface=h*(1-state.fill);
    for(let i=falling.length-1;i>=0;i--){const p=falling[i];p.vy+=58*dt;p.y+=p.vy*dt;
     if(p.y>=surface){incoming+=p.area/Math.max(1,w*h);falling.splice(i,1);}
    }
    const before=state.phase;
    // Fill volume is delivered by the landing snow; pointer leave does not reset the bank.
    state=advanceFill(state,dt,false);
    if(state.phase==='filling'){
     state.fill=Math.min(1,state.fill+incoming);
     if(state.fill>=1)state={...state,phase:'draining',elapsed:0};
    }
    button.dataset.snowState=state.phase;
    if(before!=='draining'&&state.phase==='draining'&&!reduced.matches){
     collapseTimeline?.kill();collapseTimeline=gsap.timeline().to(collapse,{open:1,duration:.3,ease:'power2.in'}).to(collapse,{open:.65,duration:2.3,ease:'sine.inOut'}).to(collapse,{open:0,duration:1,ease:'power2.out'});
    }
    field.current?.spill(button,dt,state.released*collapse.open);
    paint();
   }
   if((active||state.phase==='draining'||falling.length)&&!reduced.matches)raf=requestAnimationFrame(run);
  }
  function start(){cancelAnimationFrame(raf);button.dataset.snowFilling=String(hover||focus);
   if(reduced.matches){if(!frozen.current){state=advanceFill(state,.5,true);paint();}}else{last=performance.now();raf=requestAnimationFrame(run);}}
  function leave(){hover=false;button.dataset.snowFilling=String(focus);}
  const enter=()=>{hover=true;start()},onFocus=()=>{focus=button.matches(':focus-visible');if(focus)start()},onBlur=()=>{focus=false;button.dataset.snowFilling=String(hover)};
  button.addEventListener('pointerenter',enter);button.addEventListener('pointerleave',leave);button.addEventListener('focus',onFocus);button.addEventListener('blur',onBlur);
  const observer=new ResizeObserver(paint);observer.observe(button);paint();
  return()=>{cancelAnimationFrame(raf);collapseTimeline?.kill();observer.disconnect();delete button.dataset.snowState;delete button.dataset.snowFilling;button.removeEventListener('pointerenter',enter);button.removeEventListener('pointerleave',leave);button.removeEventListener('focus',onFocus);button.removeEventListener('blur',onBlur);};
 },[field]);
 return <canvas className="button-snow-fill" ref={canvas} aria-hidden="true"/>;
}
