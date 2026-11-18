import React, {useEffect, useRef} from 'react';

export function SnowFill({paused}) {
 const canvas=useRef(null), frozen=useRef(paused);
 useEffect(()=>{frozen.current=paused},[paused]);
 useEffect(()=>{
  const el=canvas.current,button=el.parentElement,ctx=el.getContext('2d');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let fill=0,hover=false,focus=false,raf,last=0,w=1,h=1;
  function paint(){
   const r=button.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);w=r.width;h=r.height;
   if(el.width!==Math.round(w*d)||el.height!==Math.round(h*d)){el.width=Math.round(w*d);el.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);}
   button.style.setProperty('--snow-fill',Math.min(100,fill*100)+'%');
   ctx.clearRect(0,0,w,h);if(!fill)return;
   const y=h*(1-fill);ctx.beginPath();ctx.moveTo(0,h);
   for(let x=0;x<=w+2;x+=2){const drift=(Math.sin(x*.045)+Math.sin(x*.13+1)*.38)*Math.min(2,fill*14);ctx.lineTo(x,Math.min(h,y+drift));}
   ctx.lineTo(w,h);ctx.closePath();
   const shade=ctx.createLinearGradient(0,y,0,h);shade.addColorStop(0,'#fbfcf7');shade.addColorStop(.2,'#e6eff2');shade.addColorStop(1,'#c5d8e1');ctx.fillStyle=shade;ctx.fill();
   ctx.save();ctx.clip();
   for(let i=0;i<100;i++){const x=Math.abs(Math.sin(i*127.1)*43758.54)%1*w;const py=Math.abs(Math.sin(i*73.7)*23421.6)%1*h;
    ctx.fillStyle=i%3?'#ffffff65':'#809fb126';ctx.fillRect(x,py,.7,.5);
   }ctx.restore();
  }
  function run(now){
   const dt=Math.min(.05,(now-last)/1000);last=now;
   if((hover||focus)&&!frozen.current&&!document.hidden){fill=Math.min(1,fill+dt*.065);paint();}
   if((hover||focus)&&fill<1&&!reduced.matches)raf=requestAnimationFrame(run);
  }
  function start(){cancelAnimationFrame(raf);if(reduced.matches){if(!frozen.current){fill=Math.min(1,fill+.08);paint();}}else{last=performance.now();raf=requestAnimationFrame(run);}}
  const enter=()=>{hover=true;start()},leave=()=>{hover=false},onFocus=()=>{focus=true;start()},onBlur=()=>{focus=false};
  button.addEventListener('pointerenter',enter);button.addEventListener('pointerleave',leave);button.addEventListener('focus',onFocus);button.addEventListener('blur',onBlur);
  const observer=new ResizeObserver(paint);observer.observe(button);paint();
  return()=>{cancelAnimationFrame(raf);observer.disconnect();button.removeEventListener('pointerenter',enter);button.removeEventListener('pointerleave',leave);button.removeEventListener('focus',onFocus);button.removeEventListener('blur',onBlur);};
 },[]);
 return <canvas className="button-snow-fill" ref={canvas} aria-hidden="true"/>;
}
