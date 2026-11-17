import React,{useEffect,useRef,useState} from 'react';
import {Snowflake,Minus,Square,X,Play,Pause,Wind,RotateCcw,ArrowUpRight,Music,Folder,Terminal} from 'lucide-react';

export function Contours({className=''}){return <svg className={'contour-map '+className} viewBox="0 0 1200 800" fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth=".7">{Array.from({length:19},(_,i)=><path key={i} d={`M${-180+i*18},${850-i*15} C${100+i*4},${500-i*25} ${800-i*30},${800-i*13} ${900-i*12},${420-i*18} S${1250-i*9},${60+i*3} ${1310-i*10},${-160+i*18}`}/>)}</g></svg>}

export function Snow({density=1,wind=12,paused=false,obstacle=null,onCount,flat=false}){
 const canvas=useRef(null),config=useRef({density,wind,paused,obstacle,onCount});
 useEffect(()=>{config.current={density,wind,paused,obstacle,onCount};},[density,wind,paused,obstacle,onCount]);
 useEffect(()=>{
  const el=canvas.current,ctx=el.getContext('2d');let w=1,h=1,raf,last=0,t=0,frame=0,bank=Array(70).fill(1),lastObstacle=null,visible=true;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const flakes=Array.from({length:95},()=>({x:Math.random(),y:Math.random(),z:Math.random(),p:Math.random()*6.28}));
  const resize=()=>{const r=el.getBoundingClientRect();w=r.width;h=r.height;const d=Math.min(devicePixelRatio||1,1.5);el.width=w*d;el.height=h*d;ctx.setTransform(d,0,0,d,0,0);};
  const ro=new ResizeObserver(resize);ro.observe(el);resize();
  const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting});io.observe(el);
  const loop=now=>{
   raf=requestAnimationFrame(loop);if(now-last<32||!visible||document.hidden)return;
   const dt=Math.min((now-last)/1000,.05);last=now;const c=config.current;const stopped=c.paused||reduced;const target=[65,145,310][c.density];
   if(!stopped){t+=dt;if(flakes.length<target)for(let i=0;i<3;i++)flakes.push({x:Math.random(),y:-.01,z:Math.random(),p:Math.random()*6.28});if(flakes.length>target)flakes.length=target;}
   let ob=c.obstacle;if(ob&&lastObstacle&&(Math.abs(ob.x-lastObstacle.x)+Math.abs(ob.y-lastObstacle.y)>.001))bank.fill(1);lastObstacle=ob;
   ctx.clearRect(0,0,w,h);
   for(const f of flakes){
    if(!stopped){const old=f.y;f.y+=(14+f.z*35)*dt/Math.max(h,1);f.x=(f.x+(c.wind+Math.sin(t*.7+f.p)*12)*dt/Math.max(w,1)+1)%1;
     if(ob&&f.x>=ob.x&&f.x<ob.x+ob.width){const i=Math.min(69,Math.floor((f.x-ob.x)/ob.width*69));if(old<=ob.y-bank[i]/h&&f.y>=ob.y-bank[i]/h){bank[i]=Math.min(13,bank[i]+.6);f.y=-.01;f.x=Math.random();}}
     if(f.y>1.01){f.y=-.01;f.x=Math.random();}}
    ctx.fillStyle=flat?'#e4ead6':'#edf6fa';ctx.globalAlpha=.25+f.z*.65;ctx.beginPath();ctx.ellipse(f.x*w,f.y*h,.45+f.z*1.5,.6+f.z*1.8,Math.sin(t+f.p)*.3,0,Math.PI*2);ctx.fill();
   }
   ctx.globalAlpha=1;
   if(ob){const copy=bank.slice();if(!stopped)bank=bank.map((v,i)=>v+(copy[Math.max(0,i-1)]+copy[Math.min(69,i+1)]-2*v)*dt);
    ctx.fillStyle=flat?'#e4ead6':'#e0edf4';ctx.beginPath();ctx.moveTo(ob.x*w,ob.y*h+1);bank.forEach((v,i)=>ctx.lineTo((ob.x+i*ob.width/69)*w,ob.y*h-v));ctx.lineTo((ob.x+ob.width)*w,ob.y*h+1);ctx.fill();}
   if(++frame%30===0)c.onCount?.(flakes.length);
  };raf=requestAnimationFrame(loop);
  return()=>{cancelAnimationFrame(raf);ro.disconnect();io.disconnect();};
 },[flat]);
 return <canvas className="snow-canvas" ref={canvas} aria-hidden="true"/>;
}

export function DesktopDemo({theme='alpine',compact=false,className='',initialDensity=1,hero=false}){
 const host=useRef(null),drag=useRef(null);
 const [density,setDensity]=useState(initialDensity),[paused,setPaused]=useState(false),[open,setOpen]=useState(true),[pos,setPos]=useState(hero?{x:.60,y:.36}:{x:.12,y:.24}),[wind,setWind]=useState(12),[count,setCount]=useState(95);
 const [narrow,setNarrow]=useState(false);
 useEffect(()=>{const ro=new ResizeObserver(([e])=>setNarrow(e.contentRect.width<570));ro.observe(host.current);return()=>ro.disconnect()},[]);
 useEffect(()=>{if(hero)setPos(narrow?{x:.10,y:.57}:{x:.60,y:.36});},[narrow,hero]);
 const width=narrow ? .78 : hero ? .32 : .49,obstacle=open?{...pos,width}:null;
 const move=(dx,dy)=>setPos(p=>({x:Math.max(.02,Math.min(.98-width,p.x+dx)),y:Math.max(.12,Math.min(.64,p.y+dy))}));
 const pointerDown=e=>{if(e.target.closest('button'))return;const r=host.current.getBoundingClientRect();drag.current={x:e.clientX,y:e.clientY,pos,w:r.width,h:r.height};e.currentTarget.setPointerCapture(e.pointerId)};
 const pointerMove=e=>{const d=drag.current;if(!d)return;setPos({x:Math.max(.02,Math.min(.98-width,d.pos.x+(e.clientX-d.x)/d.w)),y:Math.max(.12,Math.min(.64,d.pos.y+(e.clientY-d.y)/d.h))})};
 return <div className={`desktop-demo demo-${theme} ${compact?'demo-compact':''} ${className}`} ref={host}>
  {theme==='alpine'?<img className="demo-wallpaper" src="/media/alpine-night.webp" width="1536" height="1024" alt="" loading={compact?'eager':'lazy'}/>:theme==='editorial'?<svg className="paper-mountains" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path fill="#283b32" d="M0 0h1000v600H0z"/><circle fill="#d7b99b" cx="780" cy="140" r="55"/><path fill="#768875" d="M0 400L250 120l220 260 180-200 350 280v140H0z"/><path fill="#d3d2b5" d="M180 200l70-80 90 107-72-23-19-32-25 42zM580 254l70-74 71 81-62-20-17-23-20 32z"/><path fill="#354f3e" d="M0 420l200-110 230 220 220-120 350 70v120H0z"/><path fill="#172b25" d="M0 510l180-100 300 160 220-70 300 30v70H0z"/></svg>:<div className="scope-wallpaper"><Contours/><div className="scope-ring one"/><div className="scope-ring two"/><span className="scope-axis x"/><span className="scope-axis y"/></div>}
  <div className="demo-menubar"><span><Snowflake size={15}/> Nightfall <span className="demo-menu-extra">File &nbsp; View &nbsp; Window</span></span><span className="live-dot">Live preview</span></div>
  {open?<div className="demo-window" style={{left:pos.x*100+'%',top:pos.y*100+'%',width:width*100+'%'}}>
   <div className="demo-window-bar" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null} tabIndex={0} role="group" aria-label="Move preview window with arrow keys" onKeyDown={e=>{const d={ArrowLeft:[-.03,0],ArrowRight:[.03,0],ArrowUp:[0,-.03],ArrowDown:[0,.03]}[e.key];if(d){e.preventDefault();move(...d)}}}>
    <span className="traffic"><i/><i/><i/></span><span>snow-day.md</span><button onClick={()=>setOpen(false)} aria-label="Close preview window"><X size={14}/></button>
   </div><div className="demo-window-body"><small>Today, at your own pace.</small><strong>Less hurry.<br/>More snow.</strong><p>Put the kettle on.<br/>Leave the world outside.</p><label><input type="checkbox" defaultChecked/> Take a little break.</label></div>
  </div>:<button className="restore-window" onClick={()=>setOpen(true)}><RotateCcw size={14}/> Restore window</button>}
  <Snow density={density} paused={paused} wind={wind} obstacle={obstacle} onCount={setCount} flat={theme==='editorial'}/>
  <div className="demo-dock" aria-hidden="true"><span><Folder size={21}/></span><span><Music size={21}/></span><span><Terminal size={21}/></span><span><Snowflake size={23}/></span></div>
  <div className="demo-controls">
   <div className="weather-presets" aria-label="Preview intensity">{['Flurry','Snow day','Blizzard'].map((name,i)=><button key={name} aria-pressed={density===i} className={density===i?'active':''} onClick={()=>setDensity(i)}>{name}</button>)}</div>
   <button className="pause-weather" onClick={()=>setPaused(!paused)} aria-label={paused?'Resume preview':'Pause preview'}>{paused?<Play size={15}/>:<Pause size={15}/>}</button>
  </div>
  {theme==='observatory'&&!compact&&<div className="scope-readout"><span>{String(count).padStart(3,'0')} particles</span><label><Wind size={14}/><input type="range" min="-70" max="70" value={wind} onChange={e=>setWind(Number(e.target.value))} aria-label="Preview wind"/></label></div>}
 </div>;
}
