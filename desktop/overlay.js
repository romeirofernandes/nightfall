const c=document.querySelector('canvas'),ctx=c.getContext('2d'),invoke=window.__TAURI__.core.invoke;
let dpr=1;function resize(){dpr=Math.min(devicePixelRatio,2);c.width=innerWidth*dpr;c.height=innerHeight*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}resize();onresize=resize;
const exit=document.createElement('button');exit.textContent='Snowball mode · drag a snowy ledge, flick to throw · Exit (Esc)';exit.style='position:fixed;top:20px;left:50%;transform:translateX(-50%);padding:12px 20px;border:1px solid #93b0a2;border-radius:24px;background:#183b30;color:#f2f6ed;font:13px system-ui;cursor:pointer';exit.hidden=true;document.body.append(exit);
exit.onclick=()=>invoke('end_interaction');onkeydown=e=>{if(e.key==='Escape')invoke('end_interaction')};
let previous=performance.now(),dragging=false,queue=Promise.resolve();
function pointer(phase,e){if(!settings.interactive)return;const now=performance.now(),dt=(now-previous)/1000;previous=now;const payload={phase,x:e.clientX,y:e.clientY,dt};queue=queue.catch(console.error).then(()=>invoke('snow_pointer',payload));}
c.onpointerdown=e=>{if(settings.interactive && e.button===0){dragging=true;c.setPointerCapture(e.pointerId);pointer('down',e)}};
let pending=null; c.onpointermove=e=>{if(dragging)pending=e};
c.onpointerup=e=>{if(dragging){if(pending){pointer('move',pending);pending=null;}pointer('up',e);dragging=false;}};
c.onpointercancel=e=>{pointer('up',e);dragging=false;pending=null};
function draw(m,s){
 ctx.clearRect(0,0,innerWidth,innerHeight);if(!s.enabled)return;
 ctx.fillStyle='rgba(245,249,255,.87)';for(const f of m.flakes){ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.fill();}
 for(const shape of m.scene){if(!shape.points.length)continue;const color=shape.color;ctx.beginPath();ctx.moveTo(...shape.points[0]);for(let i=1;i<shape.points.length;i++)ctx.lineTo(...shape.points[i]);const css=`rgba(${color[0]*255},${color[1]*255},${color[2]*255},${color[3]})`;if(shape.stroke){ctx.strokeStyle=css;ctx.lineWidth=shape.width;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke()}else{ctx.closePath();ctx.fillStyle=css;ctx.fill()}}
}
let settings={},count=0,last=performance.now();
async function loop(){const start=performance.now();try{if(count++%15===0){settings=await invoke('get_settings');exit.hidden=!settings.interactive;c.style.cursor=settings.interactive?'grab':'default';}if(pending){pointer('move',pending);pending=null;}const now=performance.now();const frame=await invoke('frame',{width:innerWidth,height:innerHeight,dt:Math.min((now-last)/1000,.05)});last=now;draw(frame,settings)}catch(e){console.error(e)}setTimeout(loop,Math.max(0,1000/(settings.fps||30)-(performance.now()-start)))}loop();

c.oncontextmenu=e=>{if(settings.interactive)e.preventDefault()};
