import React, {useEffect, useRef} from 'react';
import {advanceFill} from './snow-fill-model';

export function SnowFill({paused, field}) {
 const canvas=useRef(null), frozen=useRef(paused);
 useEffect(()=>{frozen.current=paused},[paused]);
 useEffect(()=>{
  const el=canvas.current,button=el.parentElement,ctx=el.getContext('2d');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let state={fill:0,phase:'filling',elapsed:0},hover=false,focus=false,raf,last=0,w=1,h=1,spawn=0;
  const falling=[];
  function paint(){
   const r=button.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);w=r.width;h=r.height;
   if(el.width!==Math.round(w*d)||el.height!==Math.round(h*d)){el.width=Math.round(w*d);el.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);}
   const fill=state.fill;button.style.setProperty('--snow-fill',Math.min(100,fill*100)+'%');
   ctx.clearRect(0,0,w,h);
   if(fill){
    const y=h*(1-fill);ctx.beginPath();ctx.moveTo(0,h);
    for(let x=0;x<=w+2;x+=2){const drift=(Math.sin(x*.045)+Math.sin(x*.13+1)*.38)*Math.min(2,fill*14);ctx.lineTo(x,Math.min(h,y+drift));}
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
    const area=roof.reduce((sum,p)=>sum+p.area,0);
    if(active){
     spawn+=dt*22;
     while(spawn>=1){spawn--;
      const piece=roof.length?roof[Math.floor(Math.random()*roof.length)]:null;
      if(falling.length<60)falling.push({x:piece?.x??Math.random()*w,y:-(piece?.depth??2),vy:8+Math.random()*9,r:.5+Math.random()*.65});
     }
    }
    state=advanceFill(state,dt,active,area/Math.max(1,w*h));
    field.current?.spill(button,dt,state.released);
    const surface=h*(1-state.fill);
    for(let i=falling.length-1;i>=0;i--){const p=falling[i];p.vy+=65*dt;p.y+=p.vy*dt;if(p.y>=surface)falling.splice(i,1);}
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
  return()=>{cancelAnimationFrame(raf);observer.disconnect();delete button.dataset.snowFilling;button.removeEventListener('pointerenter',enter);button.removeEventListener('pointerleave',leave);button.removeEventListener('focus',onFocus);button.removeEventListener('blur',onBlur);};
 },[field]);
 return <canvas className="button-snow-fill" ref={canvas} aria-hidden="true"/>;
}
