/* A local rounded particle frame. No page-wide canvas or background animation. */
(() => {
  'use strict';
  const host=document.querySelector('.demo-tilt'),card=document.querySelector('.demo-card');if(!host||!card)return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),canvas=document.createElement('canvas');canvas.className='card-particle-frame';canvas.setAttribute('aria-hidden','true');host.prepend(canvas);
  const ctx=canvas.getContext('2d');if(!ctx)return;let width=1,height=1,dpr=1,time=0,last=0,raf=0,pulseAt=-10,visible=true,disposed=false;
  let seed=41;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;},points=Array.from({length:190},(_,i)=>({phase:i/190,speed:.009+random()*.008,size:3+random()*2.5,phaseOffset:random()*Math.PI*2,color:random()>.5?1:0}));
  const sprites=['163,230,53','134,239,172'].map(color=>{const sprite=document.createElement('canvas');sprite.width=sprite.height=32;const c=sprite.getContext('2d'),glow=c.createRadialGradient(16,16,0,16,16,16);glow.addColorStop(0,`rgba(${color},1)`);glow.addColorStop(.12,`rgba(${color},.95)`);glow.addColorStop(.4,`rgba(${color},.25)`);glow.addColorStop(1,`rgba(${color},0)`);c.fillStyle=glow;c.fillRect(0,0,32,32);return sprite;});
  let segments=[],perimeter=1;
  function resize(){
    width=host.offsetWidth+32;height=host.offsetHeight+32;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    const x=8,y=8,w=width-16,h=height-16,r=Math.min(32,w/2,h/2),quarter=Math.PI*r/2;
    segments=[{length:w-2*r,x:x+r,y,dx:1,dy:0},{length:quarter,cx:x+w-r,cy:y+r,a:-Math.PI/2,r},{length:h-2*r,x:x+w,y:y+r,dx:0,dy:1},{length:quarter,cx:x+w-r,cy:y+h-r,a:0,r},{length:w-2*r,x:x+w-r,y:y+h,dx:-1,dy:0},{length:quarter,cx:x+r,cy:y+h-r,a:Math.PI/2,r},{length:h-2*r,x,y:y+h-r,dx:0,dy:-1},{length:quarter,cx:x+r,cy:y+r,a:Math.PI,r}];perimeter=segments.reduce((sum,s)=>sum+s.length,0);wake();
  }
  function at(phase){let distance=phase*perimeter;for(const s of segments){if(distance<=s.length){if(s.r){const a=s.a+distance/s.r;return {x:s.cx+Math.cos(a)*s.r,y:s.cy+Math.sin(a)*s.r};}return {x:s.x+s.dx*distance,y:s.y+s.dy*distance};}distance-=s.length;}return {x:40,y:8};}
  function frame(now){
    raf=0;if(disposed||document.hidden||!visible){last=0;return;}const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(!motion.matches)time+=dt;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);const pulse=motion.matches?0:Math.max(0,1-(time-pulseAt)/1.3);
    for(const p of points){const phase=(p.phase+(motion.matches?0:time*p.speed))%1,position=at(phase),breath=.6+.4*Math.sin(time*.9+p.phaseOffset),size=p.size*(1+pulse*.6);ctx.globalAlpha=.55+breath*.3+pulse*.15;ctx.drawImage(sprites[p.color],position.x-size,position.y-size,size*2,size*2);}ctx.globalAlpha=1;
    canvas.dataset.count=String(points.length);canvas.dataset.time=time.toFixed(3);canvas.dataset.pulse=pulse.toFixed(3);if(!motion.matches)wake();
  }
  function wake(){if(!raf&&!disposed&&!document.hidden&&visible)raf=requestAnimationFrame(frame);}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=0;wake();},{rootMargin:'80px'});intersection.observe(host);
  document.addEventListener('demo:success',()=>{pulseAt=time;wake();});document.addEventListener('visibilitychange',()=>{last=0;wake();});motion.addEventListener('change',()=>{last=0;wake();});addEventListener('resize',resize);
  addEventListener('pagehide',event=>{if(raf)cancelAnimationFrame(raf);raf=0;if(!event.persisted){disposed=true;resizeObserver.disconnect();intersection.disconnect();}});addEventListener('pageshow',()=>{last=0;wake();});resize();
})();
