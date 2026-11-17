/* A bounded visual demo. The desktop app's simulation runs in Rust. */
class SnowScene {
 constructor(canvas,{demo=false}={}){
  this.c=canvas;this.ctx=canvas.getContext('2d');this.demo=demo;this.flakes=[];this.level=1;this.paused=false;this.t=0;this.bank=Array(90).fill(0);this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.resize=()=>{const r=canvas.getBoundingClientRect();this.w=r.width;this.h=r.height;this.dpr=Math.min(devicePixelRatio||1,2);canvas.width=this.w*this.dpr;canvas.height=this.h*this.dpr;this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0)};
  new ResizeObserver(this.resize).observe(canvas);this.resize();
  for(let i=0;i<90;i++)this.flakes.push(this.flake(true));
  this.visible=true;new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting}).observe(canvas);
  let last=0;const tick=now=>{requestAnimationFrame(tick);if(now-last<32||!this.visible||document.hidden)return;const dt=Math.min((now-last)/1000,.05);last=now;if(!this.paused&&!this.reduced)this.step(dt);this.draw()};requestAnimationFrame(tick);
 }
 flake(randomY=false){return{x:Math.random()*this.w,y:randomY?Math.random()*this.h:-5,r:.45+Math.random()*1.8,s:12+Math.random()*25,p:Math.random()*6.28}}
 step(dt){this.t+=dt;const max=[60,145,300][this.level];if(this.flakes.length<max)for(let i=0;i<3;i++)this.flakes.push(this.flake());if(this.flakes.length>max)this.flakes.length=max;
 for(const f of this.flakes){f.y+=f.s*dt;f.x+=(8+Math.sin(this.t+f.p)*10)*dt;if(f.x>this.w)f.x=0;
 let edge=null;
 if(this.demo){const note=document.querySelector('.notes-window')?.getBoundingClientRect(),base=this.c.getBoundingClientRect();if(note&&f.x>note.left-base.left&&f.x<note.right-base.left)edge=note.top-base.top;}
 if(edge!==null&&f.y>=edge&&f.y<edge+4){f.y=-5;f.x=Math.random()*this.w;this.bank[Math.floor(Math.random()*90)]=Math.min(7,this.bank[Math.floor(Math.random()*90)]+.2)}
 if(f.y>this.h){f.y=-4;f.x=Math.random()*this.w}}
 }
 draw(){const c=this.ctx;c.clearRect(0,0,this.w,this.h);if(this.demo){const n=document.querySelector('.notes-window')?.getBoundingClientRect(),base=this.c.getBoundingClientRect();if(n){const x=n.left-base.left,y=n.top-base.top,w=n.width;
 c.fillStyle='#f1f5e9';c.beginPath();c.moveTo(x-2,y+1);for(let i=0;i<90;i++)c.lineTo(x+i*w/89,y-2-this.bank[i]-(Math.sin(i*.31)+1)*1.2);c.lineTo(x+w+2,y+1);c.closePath();c.fill();
 c.fillStyle='#d2e7e2a0';for(let i=1;i<8;i++){const ix=x+w*i/8;c.beginPath();c.moveTo(ix,y);c.lineTo(ix+3,y);c.lineTo(ix+1,y+5+(i%3)*3);c.fill()}}}
 for(const f of this.flakes){c.globalAlpha=.35+f.r*.24;c.fillStyle='#f4faf4';c.beginPath();c.ellipse(f.x,f.y,f.r*.8,f.r,Math.sin(f.p+this.t)*.4,0,Math.PI*2);c.fill()}c.globalAlpha=1;}
}
window.SnowScene=SnowScene;
