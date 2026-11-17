/** Reusable live desktop: the alpine hero and draggable workbench share one bounded renderer. */
class SnowDesktop extends HTMLElement {
 connectedCallback(){
  if(this.ready)return;this.ready=true;this.level=Number(this.getAttribute('intensity')||1);this.paused=matchMedia('(prefers-reduced-motion: reduce)').matches;this.reduced=this.paused;this.flakes=[];this.banks=Array(65).fill(1);this.clock=0;this.noteVisible=true;this.bankRect=null;this.lastSpawn=0;
  const alpine=this.getAttribute('variant')==='alpine';
  const markup=document.createElement('div');markup.className='desktop-ui';
  markup.innerHTML=`<div class="desktop-topbar"><span><img src="icon.svg" width="18" height="18" alt="">Nightfall</span><time>December, 16:24</time></div><div class="snow-note"><div class="snow-note__bar"><span class="traffic" aria-hidden="true"><i></i><i></i><i></i></span><span>December notes</span><button class="note-close" aria-label="Close demo window">×</button></div><div class="snow-note__body"><span class="snow-note__date">A snow day at home</span><strong class="note-title">A slower kind<br>of afternoon.</strong><p>Put the kettle on.<br>Find the fluffy socks.<br>Watch the world turn white.</p><label><input type="checkbox" checked> Absolutely nothing else.</label></div></div>${alpine?'':'<div class="desktop-widget"><span>The afternoon forecast</span><strong>−3°</strong><p>Snow, until further notice.</p></div>'}<div class="desktop-dock" aria-hidden="true"><span class="dock-app">⌘</span><span class="dock-app">▤</span><span class="dock-app">♫</span><span class="dock-app">⌁</span><span class="dock-app"><img src="icon.svg" alt=""></span></div><button class="snow-desktop__reopen" hidden>Open a window</button>`;
  this.append(markup);this.note=this.querySelector('.snow-note');this.reopen=this.querySelector('.snow-desktop__reopen');this.canvas=document.createElement('canvas');this.canvas.setAttribute('aria-hidden','true');this.append(this.canvas);this.ctx=this.canvas.getContext('2d');
  this.visible=true;this.observer=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting});this.observer.observe(this);
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this);
  this.querySelector('.note-close').onclick=()=>{this.release();this.note.hidden=true;this.noteVisible=false;this.reopen.hidden=false;};
  this.reopen.onclick=()=>{this.note.hidden=false;this.noteVisible=true;this.reopen.hidden=true;this.note.style.transform='';this.note.style.left='';this.note.style.top='';this.measure();};
  if(!alpine)this.drag(this.note.querySelector('.snow-note__bar'));
  this.resize();
  for(let i=0;i<85;i++)this.flakes.push(this.flake(true));
  let last=performance.now(),acc=0;
  const animate=now=>{this.raf=requestAnimationFrame(animate);if(!this.visible||document.hidden){last=now;return}acc+=now-last;last=now;if(acc<33)return;const dt=Math.min(acc/1000,.05);acc=0;if(!this.paused)this.step(dt);this.draw();};this.raf=requestAnimationFrame(animate);
 }
 disconnectedCallback(){cancelAnimationFrame(this.raf);this.observer?.disconnect();this.resizeObserver?.disconnect();}
 resize(){const r=this.getBoundingClientRect();this.w=r.width;this.h=r.height;const d=Math.min(devicePixelRatio||1,2);this.canvas.width=this.w*d;this.canvas.height=this.h*d;this.ctx.setTransform(d,0,0,d,0,0);this.measure();}
 measure(){if(!this.noteVisible)return;const a=this.getBoundingClientRect(),b=this.note.getBoundingClientRect();this.bankRect={x:b.x-a.x,y:b.y-a.y,w:b.width};}
 flake(anywhere=false){const z=Math.random();return{x:Math.random()*this.w,y:anywhere?Math.random()*this.h:-5,r:.5+z*2,vy:13+z*32,phase:Math.random()*6.28,z};}
 release(){if(!this.bankRect)return;const r=this.bankRect;for(let i=0;i<this.banks.length;i+=2){if(this.banks[i]>1&&this.flakes.length<450)this.flakes.push({x:r.x+i*r.w/64,y:r.y-this.banks[i],r:1.8,vy:60,phase:i,z:1});}this.banks.fill(.4);}
 drag(bar){let start;
  bar.onpointerdown=e=>{if(e.target.closest('button'))return;const p=this.getBoundingClientRect(),r=this.note.getBoundingClientRect();start={px:e.clientX,py:e.clientY,x:r.x-p.x,y:r.y-p.y};bar.setPointerCapture(e.pointerId);this.release();};
  bar.onpointermove=e=>{if(!start)return;const x=Math.max(4,Math.min(this.w-this.note.offsetWidth-4,start.x+e.clientX-start.px)),y=Math.max(48,Math.min(this.h-this.note.offsetHeight-30,start.y+e.clientY-start.py));this.note.style.left=x+'px';this.note.style.top=y+'px';this.measure();};
  bar.onpointerup=bar.onpointercancel=()=>{start=null;this.measure();};
  bar.setAttribute('tabindex','0');bar.setAttribute('role','group');bar.setAttribute('aria-label','Movable demo window. Use arrow keys to move.');
  bar.onkeydown=e=>{const delta={ArrowLeft:[-15,0],ArrowRight:[15,0],ArrowUp:[0,-15],ArrowDown:[0,15]}[e.key];if(!delta)return;e.preventDefault();this.release();const r=this.bankRect;this.note.style.left=Math.max(4,Math.min(this.w-this.note.offsetWidth-4,r.x+delta[0]))+'px';this.note.style.top=Math.max(48,Math.min(this.h-this.note.offsetHeight-30,r.y+delta[1]))+'px';this.measure();};
 }
 step(dt){this.clock+=dt;const target=[65,150,300][this.level];if(this.flakes.length<target)this.flakes.push(this.flake());if(this.flakes.length>target+60)this.flakes.length=target+60;
  const r=this.bankRect;
  for(const f of this.flakes){const old=f.y;f.x=(f.x+(8+Math.sin(this.clock*.6+f.phase)*11)*dt+this.w)%this.w;f.y+=f.vy*dt;
   let hit=false;if(this.noteVisible&&r&&f.x>=r.x&&f.x<r.x+r.w){const i=Math.min(64,Math.floor((f.x-r.x)/r.w*64));if(old<=r.y-this.banks[i]&&f.y>=r.y-this.banks[i]){this.banks[i]=Math.min(13,this.banks[i]+.7);hit=true;}}
   if(hit||f.y>this.h+5){Object.assign(f,this.flake());}}
  const bank=this.banks.slice();for(let i=0;i<bank.length;i++)this.banks[i]+=(bank[Math.max(0,i-1)]+bank[Math.min(64,i+1)]-2*bank[i])*dt;
 }
 draw(){const c=this.ctx;c.clearRect(0,0,this.w,this.h);const r=this.bankRect;
  if(this.noteVisible&&r){c.fillStyle='#e1edf4';c.beginPath();c.moveTo(r.x-1,r.y+1);for(let i=0;i<this.banks.length;i++)c.lineTo(r.x+i*r.w/64,r.y-this.banks[i]);c.lineTo(r.x+r.w+1,r.y+1);c.fill();c.fillStyle='#c1e0ef88';for(let i=5;i<64;i+=13){const x=r.x+i*r.w/64,l=Math.min(15,this.clock/5)*Math.min(1,this.banks[i]/3);c.beginPath();c.moveTo(x,r.y);c.lineTo(x+3,r.y);c.lineTo(x+1,r.y+l);c.fill();}}
  for(const f of this.flakes){c.globalAlpha=.22+f.z*.65;c.fillStyle='#eef7ff';c.beginPath();c.ellipse(f.x,f.y,f.r*.8,f.r,Math.sin(this.clock+f.phase)*.3,0,Math.PI*2);c.fill();}c.globalAlpha=1;
 }
 toggle(){this.paused=!this.paused;return this.paused;}
}
customElements.define('snow-desktop',SnowDesktop);
