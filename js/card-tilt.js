/* A damped spring on an inner surface keeps tilt separate from the opening flight. */
const CardTilt = {
  attach(panel,surface,enabled){
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const neutral={x:0,y:0,scale:1,shine:0,lightX:50,lightY:50};
    let value={...neutral},goal={...neutral},velocity=Object.fromEntries(Object.keys(neutral).map(key=>[key,0]));
    let frame=0,lastTime=0,pointer=null;
    const properties=['--tilt-x','--tilt-y','--tilt-scale','--tilt-shine','--tilt-light-x','--tilt-light-y','--tilt-shadow-x','--tilt-shadow-y'];
    function render(){
      surface.style.setProperty('--tilt-x',value.x.toFixed(4)+'deg');surface.style.setProperty('--tilt-y',value.y.toFixed(4)+'deg');
      surface.style.setProperty('--tilt-scale',value.scale.toFixed(5));surface.style.setProperty('--tilt-shine',value.shine.toFixed(4));
      surface.style.setProperty('--tilt-light-x',value.lightX.toFixed(2)+'%');surface.style.setProperty('--tilt-light-y',value.lightY.toFixed(2)+'%');
      surface.style.setProperty('--tilt-shadow-x',(-value.y*1.3).toFixed(2)+'px');surface.style.setProperty('--tilt-shadow-y',(18+value.x*.7).toFixed(2)+'px');
    }
    function tick(now){
      const dt=lastTime?Math.min((now-lastTime)/1000,.05):1/60;lastTime=now;
      const steps=Math.ceil(dt/.008),step=dt/steps;
      for(let i=0;i<steps;i++)for(const key of Object.keys(neutral)){
        velocity[key]+=((goal[key]-value[key])*155-velocity[key]*23)*step;value[key]+=velocity[key]*step;
      }
      const settled=Object.keys(neutral).every(key=>Math.abs(goal[key]-value[key])<.0002&&Math.abs(velocity[key])<.0002);
      if(settled){value={...goal};velocity=Object.fromEntries(Object.keys(neutral).map(key=>[key,0]));}
      render();if(settled){frame=0;lastTime=0;}else frame=requestAnimationFrame(tick);
    }
    function start(){if(!frame)frame=requestAnimationFrame(tick);}
    function refresh(){
      if(!pointer||!panel.open||!enabled()||reduced.matches)return;
      // Untransformed layout coordinates prevent feedback when the panel tilts.
      const nx=Math.max(-1,Math.min(1,(pointer.x-panel.offsetLeft)/panel.offsetWidth*2-1));
      const ny=Math.max(-1,Math.min(1,(pointer.y-panel.offsetTop)/panel.offsetHeight*2-1));
      goal={x:-ny*8,y:nx*8,scale:1.025,shine:1,lightX:(nx+1)*50,lightY:(ny+1)*50};start();
    }
    function move(event){
      if(event.pointerType!=='mouse'&&event.pointerType!=='pen')return;
      // Native dialogs also receive pointer events from their full-screen backdrop.
      if(event.clientX<panel.offsetLeft||event.clientX>panel.offsetLeft+panel.offsetWidth||event.clientY<panel.offsetTop||event.clientY>panel.offsetTop+panel.offsetHeight){leave();return;}
      pointer={x:event.clientX,y:event.clientY};refresh();
    }
    function leave(){pointer=null;goal={...neutral};start();}
    function reset(){if(frame)cancelAnimationFrame(frame);frame=0;lastTime=0;pointer=null;value={...neutral};goal={...neutral};velocity=Object.fromEntries(Object.keys(neutral).map(key=>[key,0]));for(const key of properties)surface.style.removeProperty(key);}
    panel.addEventListener('pointerenter',move);panel.addEventListener('pointermove',move);panel.addEventListener('pointerleave',leave);panel.addEventListener('pointercancel',leave);
    addEventListener('blur',leave);reduced.addEventListener('change',reset);
    return {reset,leave,refresh};
  }
};
