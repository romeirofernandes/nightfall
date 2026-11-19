import React,{useEffect,useRef,useState} from 'react';
import {Snowflake,Minus,Square,X,Play,Pause,Wind,RotateCcw,ArrowUpRight,Music,Folder,Terminal} from 'lucide-react';

export function Contours({className=''}){return <svg className={'contour-map '+className} viewBox="0 0 1200 800" preserveAspectRatio="none" fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth=".7">{Array.from({length:19},(_,i)=><path key={i} d={`M${-180+i*18},${850-i*15} C${100+i*4},${500-i*25} ${800-i*30},${800-i*13} ${900-i*12},${420-i*18} S${1250-i*9},${60+i*3} ${1310-i*10},${-160+i*18}`}/>)}</g></svg>}

export function Snow({density=1,wind=12,paused=false,obstacle=null,onCount,flat=false,atmosphere=false,surfaces=null,passageTheme,surfaceFields,sweepTarget}){
 const canvas=useRef(null),config=useRef({density,wind,paused,obstacle,onCount,passageTheme});
 useEffect(()=>{config.current={density,wind,paused,obstacle,onCount,passageTheme};},[density,wind,paused,obstacle,onCount,passageTheme]);
 useEffect(()=>{
  const el=canvas.current,ctx=el.getContext('2d');let w=1,h=1,raf,last=0,t=0,frame=0,bank=Array(70).fill(1),lastObstacle=null,visible=true,mobile=false;
  let stillPassage=null, stillScroll=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const touch=matchMedia('(hover: none), (pointer: coarse)');
  const sweepArea=sweepTarget?.current;
  let cursor=null, sweepElapsed=null, swept=false;
  const rememberCursor=event=>{
   if(event.pointerType!=='touch')cursor={x:event.clientX,y:event.clientY,at:performance.now()};
  };
  const clearCursor=()=>{cursor=null;};
  sweepArea?.addEventListener('pointermove',rememberCursor,{passive:true});
  sweepArea?.addEventListener('pointerleave',clearCursor);
  const sweepObserver=sweepArea?new IntersectionObserver(([entry])=>{
   if(entry.intersectionRatio>=.45&&touch.matches&&!reduced.matches&&!swept){sweepElapsed=0;swept=true;}
  },{threshold:.45}):null;
  if(sweepObserver)sweepObserver.observe(sweepArea);
  const flakes=Array.from({length:surfaceFields?245:atmosphere?310:95},()=>({x:Math.random(),y:Math.random(),z:Math.random(),p:Math.random()*6.28}));
  const resize=()=>{w=el.clientWidth;h=el.clientHeight;mobile=(atmosphere||surfaces)&&w<=600;if(mobile&&flakes.length>90)flakes.length=90;const d=Math.min(devicePixelRatio||1,1.5);el.width=w*d;el.height=h*d;ctx.setTransform(d,0,0,d,0,0);stillPassage=null;};
  const ro=new ResizeObserver(resize);ro.observe(el);resize();
  const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting});io.observe(el);
  const loop=now=>{
   raf=requestAnimationFrame(loop);if(now-last<32||!visible||document.hidden)return;
   const dt=Math.min((now-last)/1000,.05);last=now;const c=config.current;const stopped=c.paused||reduced.matches;
   const passage=c.passageTheme!==undefined;
   if(passage&&stopped&&stillPassage===c&&(!surfaceFields||stillScroll===window.scrollY))return;
   stillPassage=passage&&stopped?c:null;
   stillScroll=stillPassage?window.scrollY:null;
   const target=surfaceFields?(w<=600?76:245):passage?(w<=600?32:88)*(c.density===0?1:2):mobile?[30,60,90][c.density]:[65,145,310][c.density];
   const view=surfaceFields?el.getBoundingClientRect():null;
   // Convert viewport snowfall into the local coordinates of each visible snow surface.
   const sinks=view?surfaceFields.flatMap(field=>{
    const layer=field.current;
    const bounds=layer?.getBounds();
    if(!bounds||bounds.bottom<=view.top||bounds.top>=view.bottom)return [];
    return [{layer,x:view.left-bounds.left,y:view.top-bounds.top}];
   }):[];
   let gust=cursor&&now-cursor.at<170?cursor:null;
   if(view&&!stopped&&sweepElapsed!==null){
    sweepElapsed+=dt;
    const progress=Math.min(1,sweepElapsed/1.65);
    const bounds=sweepArea.getBoundingClientRect();
    const across=progress*progress*(3-2*progress);
    gust={x:bounds.left+bounds.width*(.04+.92*across),y:bounds.top+bounds.height*.64};
    if(progress===1)sweepElapsed=null;
   }
   const driftDrag=Math.exp(-dt*4);
   if(!stopped){t+=dt;if(flakes.length<target)for(let i=0;i<3;i++)flakes.push({x:Math.random(),y:-.01,z:Math.random(),p:Math.random()*6.28});if(flakes.length>target)flakes.length=target;}
   let ob=c.obstacle;if(ob&&lastObstacle&&(Math.abs(ob.x-lastObstacle.x)+Math.abs(ob.y-lastObstacle.y)>.001))bank.fill(1);lastObstacle=ob;
   ctx.clearRect(0,0,w,h);
   const daylight=passage&&c.passageTheme!=='night';
   const count=Math.min(flakes.length,target);
   for(let i=0;i<count;i++){
    const f=flakes[i];
    if(!stopped){
     const old=f.y;
     if(view){
      f.vx=(f.vx??0)*driftDrag; f.vy=(f.vy??0)*driftDrag;
      if(gust){
       const dx=f.x*w+view.left-gust.x, dy=f.y*h+view.top-gust.y;
       const distance=Math.max(1,Math.hypot(dx,dy));
       const push=Math.max(0,1-distance/(w<=600?70:108))**1.5*dt*1050;
       f.vx+=dx/distance*push; f.vy+=dy/distance*push;
      }
     }
     f.y+=(14+f.z*35+(f.vy??0))*dt/Math.max(h,1);
     f.x=(f.x+(c.wind+Math.sin(t*.7+f.p)*12+(f.vx??0))*dt/Math.max(w,1)+1)%1;
     if(surfaces?.current?.land(f.x*w,old*h,f.y*h,f.z)||
        sinks.some(({layer,x,y})=>layer.land(f.x*w+x,old*h+y,f.y*h+y,f.z))){
      f.y=-.01;f.x=Math.random();f.vx=0;f.vy=0;
     }
     if(ob&&f.x>=ob.x&&f.x<ob.x+ob.width){const i=Math.min(69,Math.floor((f.x-ob.x)/ob.width*69));if(old<=ob.y-bank[i]/h&&f.y>=ob.y-bank[i]/h){bank[i]=Math.min(13,bank[i]+.6);f.y=-.01;f.x=Math.random();}}
     if(f.y>1.01){f.y=-.01;f.x=Math.random();}}
    const x=f.x*w, y=f.y*h, angle=Math.sin(t+f.p)*.3;
    const passageRadius=1.05+f.z*f.z*(w<=600?2:3.4);
    const rx=passage?passageRadius:(mobile?.45:atmosphere?.7:.45)+f.z*(mobile?1.3:atmosphere?3.4:1.5);
    const ry=passage?passageRadius*.9:(mobile?.55:atmosphere?.8:.6)+f.z*(mobile?1.6:atmosphere?3.8:1.8);
    ctx.globalAlpha=passage?.51+f.z*.47:mobile?.3+f.z*.5:atmosphere?.5+f.z*.48:.25+f.z*.65;
    if(daylight){
     // Offset the shaded underside so each flake reads as a speck, even on pale mist.
     ctx.fillStyle=c.passageTheme==='evening'?'#716482a0':'#365b7ba0';
     ctx.beginPath();
     ctx.ellipse(x+.55,y+1,rx,ry,angle,0,Math.PI*2);
     ctx.fill();
    }
    ctx.fillStyle=passage?'#fbfdff':flat?'#e4ead6':'#edf6fa';
    ctx.beginPath();
    ctx.ellipse(x,y,rx,ry,angle,0,Math.PI*2);
    ctx.fill();
   }
   ctx.globalAlpha=1;
   if(view){
    // Keep the shared flakes moving and colliding while the artwork hides their passage.
    ctx.save();
    ctx.globalCompositeOperation='destination-out';
    ctx.fillStyle='#000';
    for(const {layer} of sinks){
     for(const {node,radius} of layer.getOccluders()){
      const rect=node.getBoundingClientRect();
      if(rect.bottom<=view.top||rect.top>=view.bottom)continue;
      ctx.beginPath();
      ctx.roundRect(rect.left-view.left,rect.top-view.top,rect.width,rect.height,radius);
      ctx.fill();
     }
    }
    ctx.restore();
   }
   if(ob){const copy=bank.slice();if(!stopped)bank=bank.map((v,i)=>v+(copy[Math.max(0,i-1)]+copy[Math.min(69,i+1)]-2*v)*dt);
    ctx.fillStyle=flat?'#e4ead6':'#e0edf4';ctx.beginPath();ctx.moveTo(ob.x*w,ob.y*h+1);bank.forEach((v,i)=>ctx.lineTo((ob.x+i*ob.width/69)*w,ob.y*h-v));ctx.lineTo((ob.x+ob.width)*w,ob.y*h+1);ctx.fill();}
   if(++frame%30===0)c.onCount?.(flakes.length);
  };raf=requestAnimationFrame(loop);
  return()=>{
   cancelAnimationFrame(raf);ro.disconnect();io.disconnect();sweepObserver?.disconnect();
   sweepArea?.removeEventListener('pointermove',rememberCursor);
   sweepArea?.removeEventListener('pointerleave',clearCursor);
  };
 },[flat,atmosphere,surfaces,surfaceFields,sweepTarget]);
 return <canvas className="snow-canvas" ref={canvas} aria-hidden="true"/>;
}

export function DesktopDemo({theme='alpine',compact=false,className='',initialDensity=1,hero=false}){
 const host=useRef(null),drag=useRef(null);
 const [density,setDensity]=useState(initialDensity),[paused,setPaused]=useState(false),[open,setOpen]=useState(true),[pos,setPos]=useState(hero?{x:.60,y:.36}:{x:.12,y:.24}),[wind,setWind]=useState(12),[count,setCount]=useState(95);
 const [hostWidth,setHostWidth]=useState(1200); const narrow=hostWidth<570;
 useEffect(()=>{const ro=new ResizeObserver(([e])=>setHostWidth(e.contentRect.width));ro.observe(host.current);return()=>ro.disconnect()},[]);
 useEffect(()=>{if(hero)setPos(hostWidth<=540?{x:.20,y:.61}:hostWidth<=800?{x:.48,y:.49}:{x:.60,y:.36});},[hostWidth,hero]);
 const width=hero?(hostWidth<=540?.72:hostWidth<=800?.45:.32):narrow?.78:.49,obstacle=open?{...pos,width}:null;
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
  {theme==='observatory'&&!compact&&<div className="scope-readout"><span>{String(count).padStart(3,'0')} particles</span><label><Wind size={14}/><span>Wind</span><input type="range" min="-70" max="70" value={wind} onChange={e=>setWind(Number(e.target.value))} aria-label="Preview wind"/></label></div>}
 </div>;
}
