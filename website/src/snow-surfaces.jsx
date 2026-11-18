import React, {useEffect, useRef} from 'react';
import {createBank, settle, brush, deposit} from './snow-banks';

export function SnowSurfaces({field, paused}) {
 const canvas=useRef(null), pause=useRef(paused);
 useEffect(()=>{pause.current=paused},[paused]);
 useEffect(()=>{
  const el=canvas.current, root=el.parentElement, ctx=el.getContext('2d');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const banks=new Map(), debris=[];let width=1,height=1,raf,last=0,previous=null,gesture=null,suppressUntil=0;
  function measure(){
   const bounds=root.getBoundingClientRect();width=bounds.width;height=bounds.height;
   const d=Math.min(devicePixelRatio||1,2);if(el.width!==Math.round(width*d)||el.height!==Math.round(height*d)){el.width=Math.round(width*d);el.height=Math.round(height*d);ctx.setTransform(d,0,0,d,0,0);}
   const present=new Set();
   root.querySelectorAll('[data-snow-surface]').forEach(node=>{
    const rect=node.getBoundingClientRect();if(!rect.width||!rect.height)return;
    present.add(node);let bank=banks.get(node);
    if(!bank||Math.abs(bank.width-rect.width)>1){bank=createBank(rect.width);banks.set(node,bank);}
    bank.x=rect.left-bounds.left;bank.y=rect.top-bounds.top+1;
   });
   for(const node of banks.keys())if(!present.has(node))banks.delete(node);
  }
  function scatter(bank, chunks, direction=0){
   if(reduced.matches)return;
   for(const chunk of chunks){if(debris.length>=180)break;
    debris.push({x:bank.x+chunk.x,y:bank.y-2,vx:direction+(Math.random()-.5)*65,vy:-12-Math.random()*40,r:Math.min(3.5,.6+Math.sqrt(chunk.amount)),life:1.3+Math.random()});
   }
  }
  const manager={land(x,before,after,size){
   if(pause.current||reduced.matches)return false;
   for(const bank of [...banks.values()].sort((a,b)=>a.y-b.y)){
    if(x<bank.x||x>bank.x+bank.width)continue;
    const i=Math.min(bank.depth.length-1,Math.floor((x-bank.x)/bank.width*(bank.depth.length-1)));
    const top=bank.y-bank.depth[i];
    if(before<=top&&after>=top){deposit(bank,x-bank.x,.24+size*.4);return true;}
   }return false;
  }};
  field.current=manager;
  function pointer(event){
   if(pause.current||reduced.matches||root.querySelector('dialog[open]'))return;
   if(event.pointerType==='touch'&&!gesture)return;
   const bounds=root.getBoundingClientRect(),x=event.clientX-bounds.left,y=event.clientY-bounds.top;
   if(gesture&&Math.hypot(x-gesture.x,y-gesture.y)>12)gesture.moved=true;
   const old=previous??{x,y};const steps=Math.min(30,Math.max(1,Math.ceil(Math.hypot(x-old.x,y-old.y)/8)));
   for(let step=1;step<=steps;step++){
    const px=old.x+(x-old.x)*step/steps,py=old.y+(y-old.y)*step/steps;
    for(const bank of banks.values())if(Math.abs(py-bank.y)<22&&px>bank.x-20&&px<bank.x+bank.width+20)scatter(bank,brush(bank,px-bank.x,event.pointerType==='touch'?27:20),(x-old.x)*3);
   }previous={x,y};
  }
  function down(e){const r=root.getBoundingClientRect();gesture={x:e.clientX-r.left,y:e.clientY-r.top,moved:false};previous=null;pointer(e);}
  function up(){if(gesture?.moved)suppressUntil=performance.now()+350;gesture=null;previous=null;}
  function click(e){if(performance.now()<suppressUntil){e.preventDefault();e.stopPropagation();}}
  root.addEventListener('pointermove',pointer,{passive:true});root.addEventListener('pointerdown',down,{passive:true});
  window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);root.addEventListener('click',click,true);
  const observer=new ResizeObserver(measure);observer.observe(root);measure();
  function frame(now){
   raf=requestAnimationFrame(frame);if(now-last<32)return;
   const dt=Math.min(.05,(now-last)/1000);last=now;if(document.hidden)return;
   measure();ctx.clearRect(0,0,width,height);
   const stopped=pause.current||reduced.matches||!!root.querySelector('dialog[open]');
   ctx.fillStyle='#edf5fb';ctx.strokeStyle='#c5d9e9';ctx.lineWidth=.6;
   for(const bank of banks.values()){
    if(!stopped)scatter(bank,settle(bank,dt));
    ctx.beginPath();ctx.moveTo(bank.x,bank.y);
    bank.depth.forEach((depth,i)=>{const x=bank.x+i/(bank.depth.length-1)*bank.width;const next=bank.depth[Math.min(i+1,bank.depth.length-1)];ctx.quadraticCurveTo(x,bank.y-depth,x+bank.width/(bank.depth.length-1)/2,bank.y-(depth+next)/2)});
    ctx.lineTo(bank.x+bank.width,bank.y+1);ctx.lineTo(bank.x,bank.y+1);ctx.closePath();ctx.fill();ctx.stroke();
   }
   for(let i=debris.length-1;i>=0;i--){const p=debris[i];if(!stopped){p.vy+=250*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}
    if(p.life<=0||p.y>height+10){debris.splice(i,1);continue;}
    ctx.globalAlpha=Math.min(1,p.life);ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
   }ctx.globalAlpha=1;
  }raf=requestAnimationFrame(frame);
  return()=>{cancelAnimationFrame(raf);observer.disconnect();if(field.current===manager)field.current=null;
   root.removeEventListener('pointermove',pointer);root.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);root.removeEventListener('click',click,true);
  };
 },[field]);
 return <canvas ref={canvas} className="snow-surfaces" aria-hidden="true"/>;
}
