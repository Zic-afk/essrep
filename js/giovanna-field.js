/* Gentle card attraction; background contour rendering has been removed. */
(()=>{
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const cards=[...document.querySelectorAll('.giovanna-step')].map(element=>({element,x:0,y:0,tx:0,ty:0}));
  let raf=0,last=0;
  function frame(now){
    raf=0;const ease=1-Math.exp(-Math.min(.05,(now-last)/1000)*10);last=now;let moving=false;
    for(const card of cards){
      card.x+=(card.tx-card.x)*ease;card.y+=(card.ty-card.y)*ease;
      const settled=Math.abs(card.tx-card.x)<.005&&Math.abs(card.ty-card.y)<.005;
      if(settled){card.x=card.tx;card.y=card.ty;}else moving=true;
      card.element.style.transform=`translate3d(${card.x.toFixed(3)}px,${card.y.toFixed(3)}px,0)`;
    }
    if(moving&&!document.hidden&&!motion.matches)raf=requestAnimationFrame(frame);
  }
  function start(){if(!raf&&!motion.matches&&!document.hidden){last=performance.now();raf=requestAnimationFrame(frame);}}
  function reset(){cards.forEach(card=>{card.tx=card.ty=0;});start();}
  for(const card of cards){
    card.element.addEventListener('pointermove',event=>{
      if(event.pointerType==='touch'||motion.matches)return;
      const rect=card.element.getBoundingClientRect();
      const x=(event.clientX-rect.left+card.x)/rect.width-.5,y=(event.clientY-rect.top+card.y)/rect.height-.5;
      const gap=parseFloat(getComputedStyle(card.element.parentElement).gap)||18,limit=Math.min(6,Math.max(0,gap/2-3));
      card.tx=Math.max(-1,Math.min(1,x*2))*limit;card.ty=Math.max(-1,Math.min(1,y*2))*limit;start();
    },{passive:true});
    card.element.addEventListener('pointerleave',()=>{card.tx=card.ty=0;start();});
  }
  document.documentElement.addEventListener('pointerleave',reset);addEventListener('blur',reset);
  motion.addEventListener('change',()=>{cancelAnimationFrame(raf);raf=0;cards.forEach(card=>{card.x=card.y=card.tx=card.ty=0;card.element.style.transform='none';});});
  addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0;});
  addEventListener('pageshow',event=>{if(event.persisted)reset();});
})();