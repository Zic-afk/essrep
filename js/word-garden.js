/* Native pointer, scroll and CSS interaction layer for the word-garden concept. */
(() => {
  'use strict';
  const $=selector=>document.querySelector(selector),motion=matchMedia('(prefers-reduced-motion: reduce)');
  let reduced=motion.matches;
  const cursor=document.createElement('div');cursor.className='garden-cursor';cursor.setAttribute('aria-hidden','true');document.body.append(cursor);
  let pointer=null,clock=0,last=0,raf=0,cursorX=0,cursorY=0,cursorLive=false;
  function resize(){wake();}
  const stage=$('.demo-stage'),card=$('.demo-card');
  const tilt={x:0,y:0,scale:1,tx:0,ty:0,targetScale:1,lightX:50,lightY:50,glare:0,active:false};
  stage.addEventListener('pointermove',event=>{
    if(reduced||event.pointerType!=='mouse')return;const rect=stage.getBoundingClientRect(),x=Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1)),y=Math.max(-1,Math.min(1,(event.clientY-rect.top)/rect.height*2-1));
    tilt.tx=-y*6;tilt.ty=x*6;tilt.targetScale=1.015;tilt.lightX=(x+1)*50;tilt.lightY=(y+1)*50;tilt.active=true;
  });
  stage.addEventListener('pointerleave',()=>{tilt.tx=tilt.ty=0;tilt.targetScale=1;tilt.active=false;});
  function draw(dt){
    const ease=1-Math.exp(-dt*7);
    tilt.x+=(tilt.tx-tilt.x)*ease;tilt.y+=(tilt.ty-tilt.y)*ease;tilt.scale+=(tilt.targetScale-tilt.scale)*ease;tilt.glare+=((tilt.active?.7:0)-tilt.glare)*ease;
    if(reduced){tilt.x=tilt.y=0;tilt.scale=1;tilt.glare=0;}
    card.style.setProperty('--garden-tilt-x',tilt.x.toFixed(3)+'deg');card.style.setProperty('--garden-tilt-y',tilt.y.toFixed(3)+'deg');card.style.setProperty('--garden-tilt-scale',tilt.scale.toFixed(5));card.style.setProperty('--garden-shadow-x',(-tilt.y*1.5).toFixed(2)+'px');card.style.setProperty('--garden-light-x',tilt.lightX+'%');card.style.setProperty('--garden-light-y',tilt.lightY+'%');card.style.setProperty('--garden-glare',tilt.glare.toFixed(3));
    const host=stage.querySelector('.demo-tilt');if(host)for(const name of ['--garden-tilt-x','--garden-tilt-y','--garden-tilt-scale'])host.style.setProperty(name,card.style.getPropertyValue(name));
    if(pointer&&cursorLive&&!reduced){cursorX+=(pointer.x-cursorX)*(1-Math.exp(-dt*24));cursorY+=(pointer.y-cursorY)*(1-Math.exp(-dt*24));cursor.style.transform=`translate(${cursorX}px,${cursorY}px)`;}
    if(ringStart!==null&&!reduced){const progress=Math.min(1,(clock-ringStart)/1.6);$('#ring-number').textContent=Math.round(94*(1-(1-progress)**3))+'%';if(progress===1)ringStart=null;}
  }
  function frame(now){raf=0;if(document.hidden){last=0;return;}const dt=last?Math.min((now-last)/1000,.05):1/60;last=now;if(!reduced)clock+=dt;draw(dt);if(!reduced)raf=requestAnimationFrame(frame);}
  function wake(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame);}
  function hideCursor(){pointer=null;cursorLive=false;cursor.classList.remove('is-visible');document.body.classList.remove('garden-cursor-active');}
  addEventListener('pointermove',event=>{
    if(reduced||event.pointerType!=='mouse')return;pointer={x:event.clientX,y:event.clientY};if(!cursorLive){cursorX=pointer.x;cursorY=pointer.y;}cursorLive=true;cursor.classList.add('is-visible');document.body.classList.add('garden-cursor-active');cursor.classList.toggle('is-link',!!event.target.closest('a,button,summary,[tabindex]'));cursor.classList.toggle('is-text',!!event.target.closest('input,textarea'));
  });
  document.documentElement.addEventListener('pointerleave',hideCursor);addEventListener('blur',hideCursor);document.addEventListener('visibilitychange',wake);addEventListener('resize',resize);
  for(const button of document.querySelectorAll('[data-magnetic]')){
    button.addEventListener('pointermove',event=>{if(reduced||event.pointerType!=='mouse')return;const rect=button.getBoundingClientRect();button.style.setProperty('--magnet-x',((event.clientX-rect.left)/rect.width-.5)*15+'px');button.style.setProperty('--magnet-y',((event.clientY-rect.top)/rect.height-.5)*12+'px');});
    button.addEventListener('pointerleave',()=>{button.style.setProperty('--magnet-x','0px');button.style.setProperty('--magnet-y','0px');});
  }
  const stacks={cards:['Aa','Bb','Cc'],check:['✓','↔','✓'],grow:['·','↟','✳']};
  document.querySelectorAll('[data-stack]').forEach(button=>{let index=0,busy=false;button.onclick=()=>{
    if(busy)return;const values=stacks[button.dataset.stack];index=(index+1)%values.length;
    const change=()=>{button.querySelector('.stack-word').textContent=values[index];button.dataset.card=String(index);};
    if(reduced){change();return;}busy=true;button.setAttribute('aria-busy','true');
    const base='rotateX(42deg) rotateZ(-17deg)',animation=button.animate([{transform:base+' rotateY(0deg)'},{transform:base+' rotateY(90deg)',offset:.49},{transform:base+' rotateY(-90deg)',offset:.5},{transform:base+' rotateY(0deg)'}],{duration:480,easing:'cubic-bezier(.2,.7,.2,1)'});
    setTimeout(change,240);animation.finished.catch(()=>{}).finally(()=>{busy=false;button.removeAttribute('aria-busy');});
  };});
  let ringStart=null;const ring=$('.growth-ring');
  function growRing(){ring.classList.add('is-growing');if(reduced)$('#ring-number').textContent='94%';else{ringStart=clock;$('#ring-number').textContent='0%';}}
  let metricTouched=false;document.querySelectorAll('[data-metric]').forEach(button=>button.addEventListener('click',()=>{metricTouched=true;}));
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){if(entry.target===ring)growRing();else if(!metricTouched)$('[data-metric][aria-pressed="true"]').click();observer.unobserve(entry.target);}},{threshold:.35});observer.observe(ring);observer.observe($('.chart-card'));
  }else growRing();
  // Small native wheel easing. Touch, keyboard, nested scroll areas and zoom stay native.
  let scrollFrame=0,scrollTarget=scrollY,applied=scrollY,scrollLast=0;
  function stopScroll(){if(scrollFrame)cancelAnimationFrame(scrollFrame);scrollFrame=0;scrollLast=0;}
  function scrollTick(now){
    const dt=scrollLast?Math.min(100,now-scrollLast):1000/60;scrollLast=now;const ease=1-Math.pow(.81,dt/(1000/60));
    if(Math.abs(scrollY-applied)>3){stopScroll();return;}const distance=scrollTarget-scrollY;
    if(Math.abs(distance)<3){scrollTo({top:scrollTarget,behavior:'instant'});scrollFrame=0;scrollLast=0;return;}scrollTo({top:scrollY+distance*ease,behavior:'instant'});applied=scrollY;scrollFrame=requestAnimationFrame(scrollTick);
  }
  addEventListener('wheel',event=>{
    if(reduced||event.ctrlKey||event.metaKey||event.shiftKey||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
    for(let element=event.target instanceof Element?event.target:null;element&&element!==document.body;element=element.parentElement){if(element.matches('input,textarea,select'))return;const style=getComputedStyle(element);if(/auto|scroll/.test(style.overflowY)&&element.scrollHeight>element.clientHeight+2)return;}
    const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);if(!delta)return;const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);scrollTarget=Math.max(0,Math.min(max,(scrollFrame?scrollTarget:scrollY)+delta));
    event.preventDefault();if(!scrollFrame){applied=scrollY;scrollLast=performance.now();scrollFrame=requestAnimationFrame(scrollTick);}
  },{passive:false});
  addEventListener('pointerdown',stopScroll,{passive:true});addEventListener('touchstart',stopScroll,{passive:true});addEventListener('keydown',stopScroll);
  motion.addEventListener('change',event=>{reduced=event.matches;if(reduced){hideCursor();stopScroll();tilt.tx=tilt.ty=0;tilt.targetScale=1;tilt.active=false;$('#ring-number').textContent='94%';ringStart=null;}wake();});
  document.body.dataset.gardenReady='true';resize();
})();
