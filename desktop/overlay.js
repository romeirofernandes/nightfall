const c=document.querySelector('canvas'),ctx=c.getContext('2d'),invoke=window.__TAURI__.core.invoke;
let dpr=1;function resize(){dpr=Math.min(devicePixelRatio,2);c.width=innerWidth*dpr;c.height=innerHeight*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}resize();onresize=resize;
function circle(x,y,r){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
function draw(m,s){
 ctx.clearRect(0,0,innerWidth,innerHeight);if(!s.enabled)return;
 ctx.fillStyle='rgba(245,249,255,.85)';for(const f of m.flakes)circle(f.x,f.y,f.r);
 for(const l of m.ledges){ctx.fillStyle='#f1f6fc';ctx.beginPath();ctx.moveTo(l.x,l.y+1);l.bank.forEach((h,i)=>ctx.lineTo(l.x+i*8,l.y-h));ctx.lineTo(l.x+l.width,l.y+1);ctx.fill()}
 if(s.snowman){const x=innerWidth-70,y=innerHeight-5;ctx.fillStyle='#f2f7fd';circle(x,y-18,18);circle(x,y-43,14);circle(x,y-64,10);ctx.fillStyle='#b14d51';ctx.fillRect(x-14,y-55,28,5);ctx.fillStyle='#234a40';ctx.fillRect(x-14,y-75,28,4);ctx.fillRect(x-9,y-87,18,14);circle(x-4,y-66,1.5);circle(x+4,y-66,1.5);ctx.fillStyle='#df8845';ctx.beginPath();ctx.moveTo(x,y-63);ctx.lineTo(x+12,y-61);ctx.lineTo(x,y-59);ctx.fill()}
 if(m.plow_x!==null){ctx.fillStyle='#c98d47';ctx.fillRect(m.plow_x-20,innerHeight-28,40,22)}
}
let settings={},count=0,last=performance.now();
async function loop(){const start=performance.now();try{if(count++%30===0)settings=await invoke('get_settings');const now=performance.now();const frame=await invoke('frame',{width:innerWidth,height:innerHeight,dt:Math.min((now-last)/1000,.05)});last=now;draw(frame,settings)}catch(e){console.error(e)}setTimeout(loop,Math.max(0,1000/(settings.fps||30)-(performance.now()-start)))}loop();
