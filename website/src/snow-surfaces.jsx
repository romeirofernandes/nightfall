import React, {useEffect, useRef} from 'react';
import {createBank, settle, sweep, deposit} from './snow-banks';

export function SnowSurfaces({field, paused}) {
 const canvas=useRef(null), pause=useRef(paused);
 useEffect(()=>{pause.current=paused},[paused]);
 useEffect(()=>{
  const el=canvas.current, root=el.parentElement, ctx=el.getContext('2d');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const banks=new Map(), debris=[], strokes=[];let width=1,height=1,raf,last=0,previous=null,gesture=null,suppressUntil=0;
  function measure(){
   const bounds=root.getBoundingClientRect();width=bounds.width;height=bounds.height;
   const d=Math.min(devicePixelRatio||1,2);if(el.width!==Math.round(width*d)||el.height!==Math.round(height*d)){el.width=Math.round(width*d);el.height=Math.round(height*d);ctx.setTransform(d,0,0,d,0,0);}
   const present=new Set();
   root.querySelectorAll('[data-snow-surface]').forEach(node=>{
    const rect=node.getBoundingClientRect();if(!rect.width||!rect.height||getComputedStyle(node).visibility==='hidden')return;
    present.add(node);let bank=banks.get(node);
    if(!bank||Math.abs(bank.width-(rect.width-12))>1){bank=createBank(Math.max(1,rect.width-12));banks.set(node,bank);}
    bank.scale=width>600?1.8:1;
    bank.x=rect.left-bounds.left+6;bank.y=rect.top-bounds.top+.5;
   });
   for(const node of banks.keys())if(!present.has(node))banks.delete(node);
  }
  function scatter(bank, chunks, vx=0, vy=0){
   if(reduced.matches)return;
   let mass=0;
   for(const chunk of chunks){
    mass+=chunk.amount;
    if(mass<.12||debris.length>=120)continue;
    const amount=Math.min(mass,2);mass=0;
    const life=.65+Math.random()*.65;
    debris.push({x:bank.x+chunk.x,y:bank.y-(chunk.depth??1)*.5,
      vx:Math.max(-110,Math.min(110,vx))*.22+(Math.random()-.5)*9,
      vy:Math.max(-12,Math.min(50,vy*.15))+5+Math.random()*12,
      r:.35+Math.sqrt(amount)*.65,life,initial:life,angle:Math.random()*6.28,
      spin:(Math.random()-.5)*2,dust:Math.random()<.5});
   }
  }
  const manager={
   take(node,dt){
    if(pause.current||reduced.matches)return [];
    const bank=banks.get(node);if(!bank)return [];
    bank.releaseClock=(bank.releaseClock??0)+dt;
    if(bank.releaseClock<.22)return [];
    bank.releaseClock=0;
    const center=Math.random()*bank.width, radius=12+Math.random()*14;
    const pieces=[],step=bank.width/(bank.depth.length-1);
    bank.depth.forEach((depth,i)=>{
     const distance=Math.abs(i*step-center);
     const falloff=Math.max(0,1-distance/radius);
     const amount=depth*falloff*.65;bank.depth[i]-=amount;
     if(amount>.025)pieces.push({x:6+i*step,amount,area:amount*step,depth});
    });return pieces;
   },
   spill(node,dt,released){
    if(pause.current||reduced.matches||released<=0)return;
    const bank=banks.get(node);if(!bank)return;
    const rect=node.getBoundingClientRect(),bounds=root.getBoundingClientRect();
    const count=Math.min(12,Math.ceil(released*rect.width*3));
    for(let i=0;i<count&&debris.length<180;i++){
     const life=1.2+Math.random()*.7;
     debris.push({x:rect.left-bounds.left+5+Math.random()*(rect.width-10),y:rect.bottom-bounds.top-1,
      vx:(Math.random()-.5)*30,vy:20+Math.random()*35,r:.6+Math.random()*1.8,
      life,initial:life,angle:Math.random()*6.28,spin:(Math.random()-.5)*4,dust:i%4===0});
    }
   },
   land(x,before,after,size){
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
   if(pause.current||reduced.matches||root.closest('.landing')?.querySelector('dialog[open]'))return;
   if(event.pointerType==='touch'&&!gesture)return;
   const bounds=root.getBoundingClientRect(),x=event.clientX-bounds.left,y=event.clientY-bounds.top;
   if(gesture&&Math.hypot(x-gesture.x,y-gesture.y)>12)gesture.moved=true;
   const now=performance.now();
   if(previous){
    const dt=Math.max(.008,Math.min(.1,(now-previous.time)/1000));
    strokes.push({from:previous,to:{x,y},vx:(x-previous.x)/dt,vy:(y-previous.y)/dt,radius:event.pointerType==='touch'?21:15});
    if(strokes.length>32)strokes.shift();
   }
   previous={x,y,time:now};
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
   const stopped=pause.current||reduced.matches||!!root.closest('.landing')?.querySelector('dialog[open]');
   const night=root.closest('.landing')?.dataset.theme==='night';
   if(!stopped){
    for(const stroke of strokes.splice(0))for(const [node,bank] of banks){
     if(node.dataset.snowFilling==='true')continue;
     const from={x:stroke.from.x-bank.x,y:stroke.from.y-bank.y};
     const to={x:stroke.to.x-bank.x,y:stroke.to.y-bank.y};
     scatter(bank,sweep(bank,from,to,stroke.radius),stroke.vx,stroke.vy);
    }
   }else strokes.length=0;
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
   for(let i=debris.length-1;i>=0;i--){
    const p=debris[i];
    if(!stopped){p.vx*=Math.exp(-dt*1.8);p.vy+=75*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.angle+=p.spin*dt;p.life-=dt;}
    if(p.life<=0||p.y>height+10){debris.splice(i,1);continue;}
    const age=1-p.life/p.initial;
    ctx.globalAlpha=Math.min(1,age*12)*Math.pow(1-age,1.4)*(p.dust?.27:.65);
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
    if(p.dust){
     const haze=ctx.createRadialGradient(0,0,0,0,0,p.r*3);
     haze.addColorStop(0,night?'#dbeaf2':'#fffdf5');haze.addColorStop(1,'#edf5fb00');
     ctx.fillStyle=haze;ctx.fillRect(-p.r*3,-p.r*3,p.r*6,p.r*6);
    }else{
     ctx.fillStyle=night?'#dcebf4':'#f2f7fa';
     // Tiny fractured clusters, not round snowballs or a confetti fountain.
     for(const [x,y,size] of [[0,0,1],[-.65,.35,.6],[.5,-.4,.5]]){
      ctx.beginPath();ctx.ellipse(x*p.r,y*p.r,p.r*size,p.r*size*.55,.3,0,Math.PI*2);ctx.fill();
     }
    }
    ctx.restore();
   }ctx.globalAlpha=1;
  }raf=requestAnimationFrame(frame);
  return()=>{cancelAnimationFrame(raf);observer.disconnect();if(field.current===manager)field.current=null;
   root.removeEventListener('pointermove',pointer);root.removeEventListener('pointerdown',down);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);root.removeEventListener('click',click,true);
  };
 },[field]);
 return <canvas ref={canvas} className="snow-surfaces" aria-hidden="true"/>;
}
