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
    if(!bank||Math.abs(bank.width-(rect.width-12))>1){bank=createBank(Math.max(1,rect.width-12));banks.set(node,bank);}
    bank.x=rect.left-bounds.left+6;bank.y=rect.top-bounds.top+.5;
   });
   for(const node of banks.keys())if(!present.has(node))banks.delete(node);
  }
  function scatter(bank, chunks, direction=0){
   if(reduced.matches)return;
   for(const chunk of chunks){if(debris.length>=180)break;
    debris.push({x:bank.x+chunk.x,y:bank.y-2,vx:direction+(Math.random()-.5)*65,vy:-12-Math.random()*40,r:Math.min(2,.3+Math.sqrt(chunk.amount)*.5),life:1.3+Math.random()});
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
   const night=root.closest('.landing')?.dataset.theme==='night';
   for(const bank of banks.values()){
    if(!stopped)scatter(bank,settle(bank,dt));
    const step=bank.width/(bank.depth.length-1);
    // Rounded powder drifts, not a stroked polygon or an overflowing ledge.
    const outline=()=>{
     ctx.beginPath();ctx.moveTo(bank.x,bank.y);
     for(let i=0;i<bank.depth.length-1;i++){
      const x=bank.x+i*step, next=bank.depth[i+1];
      ctx.quadraticCurveTo(x,bank.y-bank.depth[i],x+step*.5,bank.y-(bank.depth[i]+next)*.5);
     }
     ctx.lineTo(bank.x+bank.width,bank.y);
     // A slightly broken contact edge binds the powder to the underlying surface.
     for(let i=bank.depth.length-1;i>=0;i--){
      const u=i/(bank.depth.length-1);
      ctx.lineTo(bank.x+i*step,bank.y+Math.min(bank.depth[i]*.22,.7)*Math.sin(u*31+bank.width));
     }ctx.closePath();
    };
    const shade=ctx.createLinearGradient(0,bank.y-7,0,bank.y+1);
    shade.addColorStop(0,night?'#eff6fa':'#fffdf5');
    shade.addColorStop(.55,night?'#dbe8f1':'#f1f6f7');
    shade.addColorStop(1,night?'#8da9bfaa':'#b8cdd699');
    outline();ctx.fillStyle=shade;ctx.fill();
    // Fine, stable granules give the surface a powder edge without frame-to-frame noise.
    ctx.save();outline();ctx.clip();
    for(let i=0;i<bank.depth.length*3;i++){
     const u=(Math.sin(i*127.1+bank.width)*43758.5453)%1;
     const x=Math.abs(u)*bank.width;
     const index=Math.min(bank.depth.length-1,Math.floor(x/step));
     const depth=bank.depth[index];if(depth<.3)continue;
     const fraction=Math.abs(Math.sin(i*73.7));
     ctx.globalAlpha=.14+fraction*.2;ctx.fillStyle=i%3?'#fffef4':'#7e9db2';
     ctx.beginPath();ctx.ellipse(bank.x+x,bank.y-depth*fraction,.25+fraction*.35,.2+fraction*.25,0,0,Math.PI*2);ctx.fill();
    }ctx.restore();ctx.globalAlpha=1;
   }
   ctx.fillStyle=night?'#dcebf4':'#f2f7fa';
   for(let i=debris.length-1;i>=0;i--){const p=debris[i];if(!stopped){p.vy+=250*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}
    if(p.life<=0||p.y>height+10){debris.splice(i,1);continue;}
    ctx.globalAlpha=Math.min(.8,p.life*.65);ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
   }ctx.globalAlpha=1;
  }raf=requestAnimationFrame(frame);
  return()=>{cancelAnimationFrame(raf);observer.disconnect();if(field.current===manager)field.current=null;
   root.removeEventListener('pointermove',pointer);root.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);root.removeEventListener('click',click,true);
  };
 },[field]);
 return <canvas ref={canvas} className="snow-surfaces" aria-hidden="true"/>;
}
