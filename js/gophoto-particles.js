/* One cloud: dispersed points -> GoPhoto -> a touch-responsive sphere. No 3D library. */
(() => {
  'use strict';
  const titleStage=document.querySelector('.gp-title-stage'),sphereStage=document.querySelector('.gp-sphere-stage');if(!titleStage||!sphereStage)return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),COUNT=GoPhotoForms.COUNT;
  const scattered=GoPhotoForms.scatter(),letters=GoPhotoForms.text(document),sphere=GoPhotoForms.sphere(),rng=GoPhotoForms.random(612),seeds=Float32Array.from({length:COUNT},()=>rng());
  const canvas=document.createElement('canvas');canvas.className='gp-cloud';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
  let output=canvas,gl=null,ctx=null,program=null,buffers=[],uniforms={},width=1,height=1,dpr=1,time=0,last=0,raf=0,progress=0,target=0,start=0,end=1,lost=false,disposed=false,touch=[0,0,1],touchAt=-10,touchSerial=0;
  const vertex=`
    precision highp float;
    attribute vec3 aScatter;
    attribute vec3 aText;
    attribute vec3 aSphere;
    attribute float aSeed;
    uniform vec2 uResolution;
    uniform vec2 uCenter;
    uniform float uRadius;
    uniform float uDpr;
    uniform float uTime;
    uniform float uAssembly;
    uniform float uMorph;
    uniform vec3 uTouch;
    uniform float uTouchAge;
    varying float vSeed;
    varying float vOpacity;
    varying float vWave;
    void main(){
      float assembly=clamp((uAssembly-aSeed*.2)/.8,0.0,1.0);
      assembly=1.0-pow(1.0-assembly,3.0);
      vec3 name=mix(aScatter,aText,assembly);
      float angle=uTime*.055;
      vec3 ball=vec3(aSphere.x*cos(angle)+aSphere.z*sin(angle),aSphere.y,-aSphere.x*sin(angle)+aSphere.z*cos(angle));
      float distance=acos(clamp(dot(ball,uTouch),-1.0,1.0));
      float front=distance-uTouchAge*1.7;
      float wave=exp(-pow(front/.14,2.0))*max(0.0,1.0-uTouchAge/2.3)*step(0.0,uTouchAge);
      ball*=1.0+wave*.08;
      vec3 position=mix(name,ball,uMorph);
      float perspective=1.0+position.z*.07;
      vec2 pixel=uCenter+vec2(position.x,-position.y)*uRadius*perspective;
      gl_Position=vec4(pixel.x/uResolution.x*2.0-1.0,1.0-pixel.y/uResolution.y*2.0,0.0,1.0);
      gl_PointSize=(1.5+aSeed*.9+wave*uMorph*1.25)*uDpr;
      vSeed=aSeed;vWave=wave*uMorph;
      vOpacity=mix(mix(.25,.98,assembly),clamp(.65+ball.z*.3,.3,1.0),uMorph);
    }`;
  const fragment=`
    precision mediump float;
    varying float vSeed;
    varying float vOpacity;
    varying float vWave;
    void main(){
      float distance=length(gl_PointCoord-vec2(.5));if(distance>.5)discard;
      float soft=1.0-smoothstep(.12,.5,distance);
      vec3 color=mix(vec3(.0,.72,.82),vec3(.211765,.956863,1.0),.45+vSeed*.55);
      color=mix(color,vec3(.8,1.0,1.0),vWave*.85);
      gl_FragColor=vec4(color,soft*vOpacity);
    }`;
  function shader(type,source){const handle=gl.createShader(type);gl.shaderSource(handle,source);gl.compileShader(handle);if(!gl.getShaderParameter(handle,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(handle));return handle;}
  function initGPU(){
    gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:false,powerPreference:'low-power'});if(!gl)return false;
    const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);buffers=[];
    [['aScatter',scattered,3],['aText',letters,3],['aSphere',sphere,3],['aSeed',seeds,1]].forEach(([name,data,size])=>{const buffer=gl.createBuffer();buffers.push(buffer);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,0,0);});
    for(const name of ['uResolution','uCenter','uRadius','uDpr','uTime','uAssembly','uMorph','uTouch','uTouchAge'])uniforms[name]=gl.getUniformLocation(program,name);
    gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.disable(gl.DEPTH_TEST);output.dataset.renderer='webgl';output.dataset.count=String(COUNT);return true;
  }
  function fallback(){
    if(gl){for(const buffer of buffers)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);const replacement=document.createElement('canvas');replacement.className='gp-cloud';replacement.setAttribute('aria-hidden','true');canvas.replaceWith(replacement);output=replacement;}
    gl=null;ctx=output.getContext('2d');output.dataset.renderer='canvas2d';output.dataset.count=String(Math.ceil(COUNT/6));output.dataset.sourceCount=String(COUNT);
  }
  try{if(!initGPU())fallback();}catch(error){console.warn('GoPhoto: Canvas fallback.',error.message);fallback();}
  function measure(){
    const from=titleStage.getBoundingClientRect(),to=sphereStage.getBoundingClientRect();start=scrollY+from.top+from.height/2-height*.5;start=Math.max(0,start);end=Math.max(start+1,Math.min(scrollY+to.top+to.height/2-height*.5,document.documentElement.scrollHeight-height));
    sphereStage.dataset.scroll=String(end);scroll();
  }
  function scroll(){target=Math.max(0,Math.min(1,(scrollY-start)/(end-start)));wake();}
  function layout(){
    const a=titleStage.getBoundingClientRect(),b=sphereStage.getBoundingClientRect(),p=Math.max(0,Math.min(1,progress)),raw=Math.max(0,Math.min(1,(p-.12)/.76)),m=motion.matches?(p<.5?0:1):raw*raw*(3-2*raw),textRadius=Math.min(a.width*.94,width*.9)/3.2,ballRadius=Math.min(b.width,b.height)*.44;
    return {x:(a.left+a.width/2)*(1-p)+(b.left+b.width/2)*p,y:(a.top+a.height/2)*(1-p)+(b.top+b.height/2)*p,radius:textRadius*(1-m)+ballRadius*m,morph:m};
  }
  function render(now){
    raf=0;if(disposed||lost||document.hidden){last=0;return;}const dt=last?Math.min((now-last)/1000,.05):0;last=now;if(!motion.matches)time+=dt;
    progress=motion.matches?target:progress+(target-progress)*(1-Math.exp(-dt*9));if(Math.abs(progress-target)<.0001)progress=target;
    const assembly=motion.matches?1:Math.max(0,Math.min(1,(time-.2)/2.8)),shape=layout(),angle=(motion.matches?0:time)*.055,age=motion.matches?10:time-touchAt;
    if(gl){
      gl.viewport(0,0,output.width,output.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform2f(uniforms.uResolution,width,height);gl.uniform2f(uniforms.uCenter,shape.x,shape.y);gl.uniform3f(uniforms.uTouch,...touch);
      for(const [name,value] of Object.entries({uRadius:shape.radius,uDpr:dpr,uTime:motion.matches?0:time,uAssembly:assembly,uMorph:shape.morph,uTouchAge:age}))gl.uniform1f(uniforms[name],value);gl.drawArrays(gl.POINTS,0,COUNT);
    }else if(ctx){
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);const c=Math.cos(angle),s=Math.sin(angle),m=shape.morph;
      for(let i=0;i<COUNT;i+=6){const j=i*3,a=1-Math.pow(1-Math.max(0,Math.min(1,(assembly-seeds[i]*.2)/.8)),3),bx=sphere[j]*c+sphere[j+2]*s,by=sphere[j+1],bz=-sphere[j]*s+sphere[j+2]*c,distance=Math.acos(Math.max(-1,Math.min(1,bx*touch[0]+by*touch[1]+bz*touch[2]))),wave=Math.exp(-Math.pow((distance-age*1.7)/.14,2))*Math.max(0,1-age/2.3),scale=1+wave*.08,x=(scattered[j]*(1-a)+letters[j]*a)*(1-m)+bx*scale*m,y=(scattered[j+1]*(1-a)+letters[j+1]*a)*(1-m)+by*scale*m,z=(scattered[j+2]*(1-a))*(1-m)+bz*scale*m;
        ctx.globalAlpha=(.3+a*.6)*(1-m)+(.65+bz*.3)*m;ctx.fillStyle=wave*m>.25?'#d0ffff':seeds[i]>.5?'#36f4ff':'#16cddd';ctx.beginPath();ctx.arc(shape.x+x*shape.radius*(1+z*.07),shape.y-y*shape.radius*(1+z*.07),.9+wave*m*.6,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
    }
    output.dataset.assembly=assembly.toFixed(3);output.dataset.morph=shape.morph.toFixed(3);output.dataset.touchAge=age.toFixed(3);output.dataset.touchSerial=String(touchSerial);
    if(!motion.matches)wake();
  }
  function wake(){if(!raf&&!disposed&&!lost&&!document.hidden)raf=requestAnimationFrame(render);}
  function resize(){width=document.documentElement.clientWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);output.style.width=width+'px';output.style.height=height+'px';output.width=Math.round(width*dpr);output.height=Math.round(height*dpr);measure();wake();}
  function ripple(x,y){
    const shape=layout();if(shape.morph<.95||motion.matches)return;const px=(x-shape.x)/shape.radius,py=(shape.y-y)/shape.radius,r2=px*px+py*py;if(r2>1.03)return;
    const length=Math.max(1,Math.sqrt(r2));touch=[px/length,py/length,Math.sqrt(Math.max(0,1-r2))];touchAt=time;touchSerial++;output.dataset.touch=JSON.stringify(touch);wake();
  }
  document.addEventListener('pointerdown',event=>{if(event.button!==0||event.target.closest('a'))return;ripple(event.clientX,event.clientY);},{passive:true});
  document.querySelector('.gp-sphere-hit').addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();const shape=layout();ripple(shape.x,shape.y);}});
  addEventListener('scroll',scroll,{passive:true});addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{last=0;wake();});motion.addEventListener('change',()=>{last=0;measure();wake();});
  const observer=new ResizeObserver(measure);observer.observe(document.querySelector('main'));
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;if(raf)cancelAnimationFrame(raf);raf=0;});canvas.addEventListener('webglcontextrestored',()=>{lost=false;buffers=[];try{initGPU();resize();}catch(error){fallback();resize();}});
  addEventListener('pagehide',event=>{if(raf)cancelAnimationFrame(raf);raf=0;if(!event.persisted){disposed=true;observer.disconnect();if(gl){buffers.forEach(buffer=>gl.deleteBuffer(buffer));gl.deleteProgram(program);}}});addEventListener('pageshow',event=>{if(event.persisted){last=0;resize();}});resize();
})();
