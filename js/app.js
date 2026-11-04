/* No dependencies or network requests: open index.html directly. */
(() => {
  'use strict';
  const projects = Esscale.projects.map(project=>({...project}));
  const $ = s => document.querySelector(s), canvas=$('#space'), ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx){$('.orbit-bar').hidden=true;return;}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W,H,P,R,CX,CY,lut,image,rotation=-.48,paused=reduced,selected=-1,target=null,last=0,time=0,drag=null;
  let phase='idle',flight=null,transitionId=0,turnElapsed=0;
  let zoom=null;
  try{const saved=JSON.parse(sessionStorage.getItem('esscale-orbit'));if(saved&&Number.isFinite(saved.rotation))rotation=saved.rotation;}catch{}
  const entryUrl=new URL(location.href);
  const returnIndex=entryUrl.searchParams.get('orbit')==='return'?projects.findIndex(p=>p.id===entryUrl.searchParams.get('project')):-1;
  let positions=null;
  try{const saved=JSON.parse(sessionStorage.getItem('giovanna-positions'));if(entryUrl.searchParams.get('orbit')==='return'&&Array.isArray(saved)&&saved.length===projects.length&&saved.every((p,i)=>p.id===projects[i].id&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=.6&&Number.isFinite(p.lon)))positions=saved;}catch{}
  if(!positions)positions=OrbitMath.randomProjects(projects.length).map((p,i)=>({...p,id:projects[i].id}));
  projects.forEach((p,i)=>{p.lat=positions[i].lat;p.lon=positions[i].lon;});
  try{sessionStorage.setItem('giovanna-positions',JSON.stringify(positions));}catch{}
  let browseIndex=returnIndex;
  if(returnIndex>=0){rotation=OrbitMath.target(projects[returnIndex].lon,rotation);entryUrl.searchParams.delete('orbit');entryUrl.searchParams.delete('project');history.replaceState(history.state,'',entryUrl.href);}
  const mouse={x:0,y:0},parallax={x:0,y:0},hero=$('#home');
  const projectList=$('#project-list');
  const preview=$('#project-preview');
  const previewConnector=$('#preview-connector');
  document.body.append($('#skip-journey'),$('#cancel-flight'));
  let previewMotion=null,previewContentMotion=null,previewClosing=false;
  const previewTilt=CardTilt.attach(preview,$('.preview-surface'),()=>phase==='preview'&&!previewClosing&&(!previewMotion||previewMotion.playState!=='running'));
  $('#preview-close').onclick=hidePreview;
  $('#preview-prev').onclick=()=>cycleProject(-1);$('#preview-next').onclick=()=>cycleProject(1);
  preview.addEventListener('cancel',event=>{event.preventDefault();hidePreview();});
  preview.addEventListener('click',event=>{if(event.target!==preview)return;const rect=preview.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)hidePreview();});
  preview.addEventListener('close',()=>{clearPreviewVisuals();if(phase==='preview'){selected=-1;phase='idle';$('#status').textContent='На орбите · 4 проекта';$('#list-toggle').focus({preventScroll:true});}});
  $('#preview-open').onclick=event=>{if(event.button||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();launch();};
  const spaceActions=document.createElement('div');spaceActions.className='space-actions';spaceActions.setAttribute('role','group');spaceActions.setAttribute('aria-label','Интерактивные объекты космоса');hero.append(spaceActions);
  const actionButtons=new Map();
  function updateSpaceActions(){
    const actions=[...SpaceObjects.signalTargets(),...Constellations.targets().map(t=>({...t,id:'constellation-'+t.index,label:'Созвездие «'+t.name+'»'}))];
    const present=new Set();
    for(const action of actions){
      present.add(action.id);let button=actionButtons.get(action.id);
      if(!button){button=document.createElement('button');button.className='space-action';button.type='button';button.dataset.action=action.id;button.setAttribute('aria-label',action.label);button.dataset.label=action.label;
        const activate=()=>{if(phase!=='idle')return;if(action.id.startsWith('signal-')){SpaceObjects.signal(action.id);discoveries.signal(action.id);}else Constellations.activate(Number(action.id.split('-')[1]));};
        button.onclick=activate;button.onfocus=()=>{if(action.id.startsWith('constellation-'))activate();};spaceActions.append(button);actionButtons.set(action.id,button);
      }
      if(button.dataset.label!==action.label){button.dataset.label=action.label;button.setAttribute('aria-label',action.label);}
      const outside=(action.x-CX)**2+(action.y-CY)**2>(R+4)**2;
      button.hidden=phase!=='idle'||!outside||action.x<5||action.x>W-5||action.y<5||action.y>H-5;
      button.style.transform=`translate(${Math.round(action.x)*P}px,${Math.round(action.y)*P}px) translate(-50%,-50%)`;
    }
    for(const [id,button] of actionButtons)if(!present.has(id))button.hidden=true;
  }
  $('#list-toggle').onclick=()=>projectList.showModal();
  $('#list-close').onclick=()=>projectList.close();
  projectList.querySelectorAll('a').forEach((link,index)=>{link.onclick=event=>{if(event.button||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();projectList.close();focus(index);};});
  const tilt=.27,ct=Math.cos(tilt),st=Math.sin(tilt),tau=Math.PI*2;
  const texture=new Uint8ClampedArray(256*128*3);
  const clouds=new Uint8Array(256*128);
  const palette=[[24,68,78],[27,85,91],[35,102,99],[55,122,109],[86,143,113],[125,164,118],[164,187,137]];
  for(let y=0;y<128;y++)for(let x=0;x<256;x++){
    const u=x/256*tau,v=y/128*Math.PI;
    const n=Math.sin(u*3+Math.sin(v*5)*1.3)+.55*Math.cos(u*7-v*8)+.26*Math.sin(u*13+v*17)+.14*Math.cos(u*29-v*31);
    let k=n>.9?5:n>.5?4:n>.1?3:n>-.3?2:n>-.8?1:0;
    if(y<12+Math.sin(u*4)*3)k=6;
    const c=palette[k],i=(y*256+x)*3;texture.set(c,i);
    clouds[y*256+x]=y>16&&y<84&&Math.sin(u*9+y*.055)+Math.sin(u*17-y*.11)*.45>1.1?1:0;
  }
  let seed=12345;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const stars=Array.from({length:190},(_,i)=>({x:random(),y:random(),b:random(),phase:random()*tau,layer:i<115?0:i<170?1:2}));
  const nebula=document.createElement('canvas'),nebulaCtx=nebula.getContext('2d');
  const atmosphere=document.createElement('canvas'),atmosphereCtx=atmosphere.getContext('2d');
  const curtain=document.createElement('div');curtain.className='cloud-curtain';curtain.setAttribute('aria-hidden','true');
  curtain.innerHTML='<div class="cloud-bank cloud-bank-a"></div><div class="cloud-bank cloud-bank-b"></div><div class="cloud-core"></div>';document.body.append(curtain);
  const pins=projects.map((p,i)=>{
    const b=document.createElement('a');b.className='beacon'+(p.id==='giovanna'?' beacon-giovanna':'');b.href=p.page;
    b.innerHTML=`<span class="beacon-ring" aria-hidden="true"></span><span class="beacon-dot" aria-hidden="true"></span><span class="beacon-label"><small>0${i+1} / ПРОЕКТ</small>${p.title}<span class="beacon-preview">${p.tags[0]}<br>Описание и функции ↗</span></span>`;
    b.dataset.lat=p.lat;b.dataset.lon=p.lon;b.setAttribute('aria-label',`О проекте ${p.title}`);b.setAttribute('aria-haspopup','dialog');b.onclick=e=>{if(e.button||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();focus(i);};$('#pins').append(b);return b;
  });
  function resize(){
    P=innerWidth<750?3:4;W=Math.ceil(hero.clientWidth/P);H=Math.ceil(hero.clientHeight/P);canvas.width=W;canvas.height=H;canvas.style.width=W*P+'px';canvas.style.height=H*P+'px';
    const geometry=OrbitMath.layout(hero.clientWidth,hero.clientHeight);R=geometry.R/P;CX=geometry.CX/P;CY=geometry.CY/P;image=ctx.createImageData(W,H);lut=[];
    nebula.width=W;nebula.height=H;atmosphere.width=W;atmosphere.height=H;
    // Cached, dithered nebula. All details use the same low-resolution grid.
    for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2){
      const nx=x/W,ny=y/H,band=ny-(.35+Math.sin(nx*5)*.13);
      const n=Math.sin(x*.042+y*.06)+Math.cos(x*.075-y*.03)*.5;
      const strength=Math.max(0,1-Math.abs(band)*6)*(n+1.5)/2.5;
      if(strength>.26){nebulaCtx.fillStyle=strength>.68?'#182c3b':strength>.45?'#122330':'#101c29';nebulaCtx.fillRect(x,y,2,2);}
    }
    const air=atmosphereCtx.createImageData(W,H);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const nx=(x+.5-CX)/R,ny=(CY-y-.5)/R,d=nx*nx+ny*ny;
      if(d>1){const distance=(Math.sqrt(d)-1)*R;if(distance<3){const i=(y*W+x)*4;air.data.set(distance<1.2?[145,195,172,175]:[67,119,133,80],i);}continue;}
      const nz=Math.sqrt(1-d),wy=ny*ct+nz*st,wz=-ny*st+nz*ct;
      const light=-nx*.45+ny*.6+nz*.65;const shade=light>.8?1.1:light>.5?.9:light>.23?.7:.48;
      lut.push([(y*W+x)*4,Math.atan2(nx,wz)/tau,Math.max(0,Math.min(127,Math.floor((.5-Math.asin(Math.min(1,wy))/Math.PI)*128))),shade,nz<.075]);
    }
    atmosphereCtx.putImageData(air,0,0);
  }
  function project(p){return OrbitMath.project(p,rotation,{R,CX,CY});}
  function setPause(value){paused=value;$('#pause').textContent=paused?'▷':'Ⅱ';$('#pause').setAttribute('aria-label',paused?'Продолжить вращение':'Приостановить вращение');$('#pause').setAttribute('aria-pressed',String(paused));}
  function remember(){try{sessionStorage.setItem('esscale-orbit',JSON.stringify({rotation}));}catch{}}
  function clearPreviewVisuals(){
    previewTilt.reset();
    if(previewMotion)previewMotion.cancel();if(previewContentMotion)previewContentMotion.cancel();previewClosing=false;previewConnector.setAttribute('hidden','');hero.classList.remove('has-preview','giovanna-view');hero.style.removeProperty('--preview-shift');
  }
  function previewPoint(){const point=project(projects[selected]),rect=canvas.getBoundingClientRect();return {x:rect.left+point.x*rect.width/W,y:rect.top+point.y*rect.height/H};}
  function positionPreview(){
    const point=project(projects[selected]),scene=hero.getBoundingClientRect(),mobile=innerWidth<750;
    const source={x:scene.left+point.x*P,y:scene.top+point.y*P};
    hero.classList.add('has-preview');hero.style.setProperty('--preview-shift',mobile?-Math.max(0,source.y-Math.min(innerHeight*.26,innerHeight-preview.offsetHeight-52))+'px':'0px');
    const width=preview.offsetWidth,height=preview.offsetHeight;
    const desiredX=source.x+40+width<innerWidth-24?source.x+40:source.x-width-40;
    const x=mobile?12:Math.max(24,Math.min(innerWidth-width-24,desiredX));
    const maxY=Math.max(12,innerHeight-height-12),minY=Math.min(88,maxY);
    const y=mobile?maxY:Math.max(minY,Math.min(maxY,source.y-height*.44));
    preview.style.left=Math.round(x)+'px';preview.style.top=Math.round(y)+'px';$('.preview-surface').scrollTop=0;
    return source;
  }
  function updatePreviewConnector(){
    if(!preview.open||selected<0)return;
    const point=previewPoint(),rect=preview.getBoundingClientRect(),mobile=innerWidth<750;
    previewConnector.setAttribute('viewBox',`0 0 ${innerWidth} ${innerHeight}`);
    let path;
    if(mobile){const endX=Math.max(rect.left+24,Math.min(rect.right-24,point.x)),elbow=rect.top-16;path=`M ${point.x} ${point.y} V ${elbow} H ${endX} V ${rect.top}`;}
    else{const endX=point.x<rect.left?rect.left:rect.right,endY=Math.max(rect.top+45,Math.min(rect.bottom-45,point.y)),elbow=(point.x+endX)/2;path=`M ${point.x} ${point.y} H ${elbow} V ${endY} H ${endX}`;}
    $('#preview-line').setAttribute('d',path);$('#preview-ring').setAttribute('cx',point.x);$('#preview-ring').setAttribute('cy',point.y);$('#preview-origin').setAttribute('x',point.x-4);$('#preview-origin').setAttribute('y',point.y-4);
  }
  async function hidePreview(){
    if(!preview.open||previewClosing)return;previewClosing=true;
    previewTilt.leave();
    if(previewMotion)previewMotion.cancel();if(previewContentMotion)previewContentMotion.cancel();
    if(!reduced&&selected>=0){
      const point=previewPoint(),rect=preview.getBoundingClientRect(),transform=innerWidth<750?`translate(0,${rect.height+24}px)`:`translate(${point.x-rect.left-rect.width/2}px,${point.y-rect.top-rect.height/2}px) scale(.12,.06)`;
      previewMotion=preview.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform,opacity:0}],{duration:250,easing:'ease-in',fill:'forwards'});
      try{await previewMotion.finished;}catch{return;}
    }
    preview.close();
  }
  function focus(i){
    if(phase!=='idle'&&phase!=='preview')return;
    previewTilt.reset();
    if(previewMotion)previewMotion.cancel();if(previewContentMotion)previewContentMotion.cancel();previewClosing=false;
    selected=((i%projects.length)+projects.length)%projects.length;browseIndex=selected;const p=projects[selected];
    phase='preview';target=null;hero.classList.toggle('giovanna-view',p.id==='giovanna');
    if(project(p).z<=.1)rotation=OrbitMath.target(p.lon,rotation);
    $('#preview-title').textContent=p.title;$('#preview-description').textContent=p.teaser;$('#preview-category').textContent=p.category;$('#preview-number').textContent='0'+(selected+1)+' / '+String(projects.length).padStart(2,'0');$('#preview-art').innerHTML=PreviewArt[p.id];
    $('#preview-features').replaceChildren(...p.features.map(text=>{const item=document.createElement('li');item.textContent=text;return item;}));
    $('#preview-tags').replaceChildren(...p.tags.map(text=>{const item=document.createElement('span');item.textContent=text;return item;}));
    $('#preview-note').textContent=p.note;$('#preview-open').href=p.page;$('#preview-open span:first-child').textContent=p.id==='giovanna'?'Как устроена Giovanna':'Исследовать проект';preview.dataset.project=p.id;preview.style.setProperty('--preview-accent',p.previewAccent||p.bg);
    previewConnector.style.setProperty('--connector-accent',p.previewAccent||p.bg);previewConnector.removeAttribute('hidden');
    $('#status').textContent=`Знакомимся · ${p.title}`;if(!preview.open)preview.showModal();
    const source=positionPreview();updatePreviewConnector();
    if(!reduced){
      const rect=preview.getBoundingClientRect(),dx=source.x-rect.left-rect.width/2,dy=source.y-rect.top-rect.height/2;
      const frames=innerWidth<750?[{transform:'translateY(65px) scale(.97)',opacity:0},{transform:'translateY(0) scale(1)',opacity:1}]:[{transform:`translate(${dx}px,${dy}px) scale(.12,.06)`,opacity:0},{transform:'translate(0,0) scale(1,.08)',opacity:1,offset:.42},{transform:'translate(0,0) scale(1)',opacity:1}];
      previewMotion=preview.animate(frames,{duration:480,easing:'cubic-bezier(.2,.7,.2,1)'});
      previewMotion.finished.then(()=>previewTilt.refresh(),()=>{});
      previewContentMotion=$('.preview-content').animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:230,delay:170,fill:'backwards'});
    }
  }
  function launch(){
    if(phase!=='preview'||selected<0)return;const p=projects[selected];
    target=OrbitMath.target(p.lon,rotation);phase='turning';turnElapsed=0;transitionId++;
    clearPreviewVisuals();preview.close();
    hero.classList.add('is-travelling');$('.intro').inert=true;$('#cancel-flight').hidden=false;$('#cancel-flight').focus({preventScroll:true});$('#status').textContent=`Курс на ${p.title}`;
    if(reduced){rotation=target;target=null;remember();location.assign(p.page);}
    else if(p.id==='giovanna')solarJourney();
  }
  async function solarJourney(){
    const id=transitionId;phase='solar';target=null;remember();$('#status').textContent='Giovanna · открываем солнечную систему';
    $('#skip-journey').hidden=false;
    const point=project(projects[selected]);
    await SolarJourney.play(canvas,{rotation,geometry:{R,CX,CY},landing:{x:(point.x-CX)/R,y:(point.y-CY)/R},onClouds:()=>{
      if(id!==transitionId)return;
      curtain.classList.add('is-giovanna-flight');
      $('#status').textContent='Возвращаемся к Giovanna · входим в облака';curtain.classList.add('is-active');
      flight=curtain.animate([{opacity:0,transform:'scale(1.7)',backgroundColor:'transparent'},{opacity:.35,offset:.35},{opacity:1,transform:'scale(1)',backgroundColor:'#d6e3cd',offset:.9},{opacity:1,transform:'scale(1)',backgroundColor:'#d6e3cd'}],{duration:850,easing:'ease-in',fill:'forwards'});
    }});
    if(id!==transitionId||phase!=='solar')return;
    $('#skip-journey').hidden=true;try{sessionStorage.setItem('esscale-arrival','yes');}catch{}location.assign(projects[selected].page);
  }
  async function descend(){
    if(selected<0||phase!=='turning')return;phase='descending';const id=transitionId,p=projects[selected],point=project(p);
    remember();$('#status').textContent=`Входим в атмосферу · ${p.title}`;
    const origin=`${Math.round(point.x*P)}px ${Math.round(point.y*P)}px`;
    canvas.style.transformOrigin=origin;
    zoom=canvas.animate([{transform:'scale(1)'},{transform:'scale(4.8)'}],{duration:900,easing:'cubic-bezier(.5,0,.7,.4)',fill:'forwards'});
    curtain.classList.add('is-active');
    flight=curtain.animate([{opacity:0,transform:'scale(1.7)',backgroundColor:'transparent'},{opacity:.3,offset:.3},{opacity:1,transform:'scale(1)',backgroundColor:'#d6e3cd',offset:.78},{opacity:1,transform:'scale(1)',backgroundColor:'#d6e3cd'}],{duration:900,easing:'ease-in',fill:'forwards'});
    try{await flight.finished;}catch{return;}
    if(id!==transitionId)return;
    try{sessionStorage.setItem('esscale-arrival','yes');}catch{}
    location.assign(p.page);
  }
  function cancel(){
    curtain.classList.remove('is-giovanna-flight');
    if(phase==='idle')return;transitionId++;SolarJourney.stop();$('#skip-journey').hidden=true;if(flight)flight.cancel();if(zoom)zoom.cancel();curtain.classList.remove('is-active');
    if(preview.open)preview.close();
    clearPreviewVisuals();
    target=null;selected=-1;phase='idle';hero.classList.remove('is-travelling');$('.intro').inert=false;$('#cancel-flight').hidden=true;$('#status').textContent='На орбите · 4 проекта';$('#list-toggle').focus({preventScroll:true});
  }
  async function ascend(index){
    if(reduced){remember();return;}
    const id=++transitionId;selected=index;phase='ascending';target=null;
    hero.classList.add('is-travelling');$('.intro').inert=true;$('#cancel-flight').hidden=false;$('#status').textContent='Возвращаемся на орбиту';
    const point=project(projects[index]);canvas.style.transformOrigin=`${Math.round(point.x*P)}px ${Math.round(point.y*P)}px`;
    curtain.classList.add('is-active');
    zoom=canvas.animate([{transform:'scale(4.8)'},{transform:'scale(1)'}],{duration:1100,easing:'cubic-bezier(.15,.55,.25,1)',fill:'both'});
    flight=curtain.animate([{opacity:1,transform:'scale(1)',backgroundColor:'#d6e3cd'},{opacity:1,offset:.15,backgroundColor:'#d6e3cd'},{opacity:.6,transform:'scale(1.3)',backgroundColor:'transparent',offset:.45},{opacity:0,transform:'scale(1.7)',offset:.85},{opacity:0,transform:'scale(1.7)'}],{duration:1100,easing:'ease-out',fill:'both'});
    draw(0);
    try{await flight.finished;}catch{return;}
    if(id!==transitionId)return;cancel();remember();
  }
  function draw(dt){
    if(phase==='solar')return;
    if(!reduced)time+=dt;
    if(target!==null){turnElapsed+=dt;rotation+=(target-rotation)*Math.min(1,dt*10);if(Math.abs(target-rotation)<.008||turnElapsed>.65){rotation=target;target=null;if(phase==='turning')descend();}}
    else if(!paused&&selected<0&&!drag)rotation+=dt*.10;
    ctx.fillStyle='#080e19';ctx.fillRect(0,0,W,H);
    parallax.x+=(mouse.x-parallax.x)*Math.min(1,dt*3);parallax.y+=(mouse.y-parallax.y)*Math.min(1,dt*3);
    ctx.drawImage(nebula,Math.round(parallax.x),Math.round(parallax.y));
    // Sparse, layered pixel stars and a small orbital satellite.
    for(const s of stars){const speed=[.2,.8,1.8][s.layer];let x=(s.x*W-time*speed+parallax.x*(s.layer+1))%W;if(x<0)x+=W;const y=s.y*H+parallax.y*(s.layer+1);ctx.fillStyle=s.layer===2?'#c7d9bc':s.layer===1?'#6d8995':'#344855';if(reduced||Math.sin(time*.7+s.phase)>-.8)ctx.fillRect(Math.floor(x),Math.floor(y),1,1);if(s.b>.98&&s.layer===2){ctx.fillRect(Math.floor(x)-1,Math.floor(y),3,1);ctx.fillRect(Math.floor(x),Math.floor(y)-1,1,3);}}
    Constellations.draw(ctx,{width:W,height:H,dt,mobile:innerWidth<750,reduced,parallax});
    SpaceObjects.draw(ctx,{width:W,height:H,time,parallax,mobile:innerWidth<750,reduced,dt,planet:{R,CX,CY}});
    ctx.drawImage(atmosphere,0,0);
    // Draw only the visible hemisphere into a transparent pixel buffer.
    const data=image.data;
    for(const [i,u,v,shade,rim] of lut){let tx=u-rotation/tau;tx-=Math.floor(tx);const ti=(v*256+Math.floor(tx*256))*3;
      const cloudMix=clouds[v*256+((Math.floor(tx*256+time*.24))%256)]?.3:0;
      data[i]=texture[ti]*shade*(1-cloudMix)+180*cloudMix+(rim?23:0);data[i+1]=texture[ti+1]*shade*(1-cloudMix)+202*cloudMix+(rim?35:0);data[i+2]=texture[ti+2]*shade*(1-cloudMix)+174*cloudMix+(rim?26:0);data[i+3]=255;}
    // putImageData replaces the background, so composite through an offscreen surface.
    planetCtx.putImageData(image,0,0);ctx.drawImage(planetCanvas,0,0);
    SpaceObjects.drawForeground();
    pins.forEach((b,i)=>{
      const pt=project(projects[i]),visible=pt.z>.08&&phase!=='descending'&&phase!=='ascending';
      b.hidden=!visible;b.tabIndex=visible?0:-1;b.classList.toggle('is-target',i===selected);b.classList.toggle('label-left',pt.x*P>hero.clientWidth-195);
      if(visible){b.style.transform=`translate(${Math.round(pt.x)*P}px,${Math.round(pt.y)*P}px)`;b.style.opacity=Math.min(1,(pt.z-.08)*5);b.style.zIndex=String(Math.round(pt.z*100));}
    });
    updateSpaceActions();discoveries.draw(ctx,dt);
    if(phase==='preview'){updatePreviewConnector();const mini=$('.giovanna-preview-world');if(mini)GiovannaPreview.draw(mini,reduced?0:time);}
  }
  const discoveries=PlanetDiscoveries.create({hero,canvas,pins,projects,geometry:()=>({R,CX,CY,W,H,P}),projectPoint:project,phase:()=>phase,locate:i=>{target=OrbitMath.target(projects[i].lon,rotation);turnElapsed=0;},returned:returnIndex,reduced});
  const planetCanvas=document.createElement('canvas'),planetCtx=planetCanvas.getContext('2d');
  function layout(){if(phase!=='idle')cancel();resize();planetCanvas.width=W;planetCanvas.height=H;draw(0);}addEventListener('resize',layout);layout();setPause(paused);
  if(returnIndex>=0)ascend(returnIndex);
  let inView=true;new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;},{threshold:0}).observe($('#home'));
  function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;if(!document.hidden&&inView)draw(dt);requestAnimationFrame(frame);}requestAnimationFrame(frame);
  function cycleProject(direction){const current=selected>=0?selected:browseIndex;focus(current<0?(direction>0?0:projects.length-1):current+direction);}
  $('#cancel-flight').onclick=cancel;$('#pause').onclick=()=>setPause(!paused);$('#prev').onclick=()=>cycleProject(-1);$('#next').onclick=()=>cycleProject(1);
  $('#skip-journey').onclick=()=>{if(selected<0)return;const destination=projects[selected].page;transitionId++;SolarJourney.stop();remember();location.assign(destination);};
  addEventListener('keydown',e=>{if(projectList.open)return;if(preview.open){if(e.key==='ArrowRight'){e.preventDefault();cycleProject(1);}if(e.key==='ArrowLeft'){e.preventDefault();cycleProject(-1);}return;}if(e.key==='Escape')cancel();if(!inView||scrollY>innerHeight*.4||e.target.closest('input,textarea,select'))return;if(e.key==='ArrowRight'){e.preventDefault();cycleProject(1);}if(e.key==='ArrowLeft'){e.preventDefault();cycleProject(-1);}if(e.code==='Space'&&!e.target.closest('button,a,summary')){e.preventDefault();setPause(!paused);}});
  hero.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const rect=hero.getBoundingClientRect();Constellations.pointer(phase==='idle'?{x:(e.clientX-rect.left)/P,y:(e.clientY-rect.top)/P}:null);if(reduced)return;mouse.x=(e.clientX/rect.width-.5)*2;mouse.y=((e.clientY-rect.top)/rect.height-.5)*1.5;});
  hero.addEventListener('pointerleave',()=>{mouse.x=0;mouse.y=0;Constellations.pointer(null);});
  let meteorTap=null,skyTap=null;
  function meteorAt(event){const rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)/P,y=(event.clientY-rect.top)/P;return SpaceObjects.hitTest(x,y);}
  canvas.addEventListener('pointerdown',e=>{if(phase!=='idle'||(e.button!==0&&e.pointerType==='mouse'))return;skyTap={x:e.clientX,y:e.clientY};const meteor=meteorAt(e);if(meteor){meteorTap={id:meteor.id,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);return;}drag={x:e.clientX,id:e.pointerId};target=null;canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');});
  canvas.addEventListener('pointermove',e=>{if(meteorTap){if(Math.hypot(e.clientX-meteorTap.x,e.clientY-meteorTap.y)>10)meteorTap=null;return;}if(!drag){canvas.style.cursor=phase==='idle'&&meteorAt(e)?'crosshair':'';return;}const dx=e.clientX-drag.x;rotation+=dx*.005;drag.x=e.clientX;});
  addEventListener('pagehide',remember);
  addEventListener('pageshow',e=>{if(e.persisted){const previous=selected;discoveries.visit(previous);cancel();if(previous>=0)ascend(previous);}});
  const release=()=>{drag=null;meteorTap=null;skyTap=null;canvas.classList.remove('dragging');};canvas.addEventListener('pointerup',e=>{if(meteorTap&&phase==='idle'&&Math.hypot(e.clientX-meteorTap.x,e.clientY-meteorTap.y)<=10)SpaceObjects.explode(meteorTap.id);else if(skyTap&&phase==='idle'&&Math.hypot(e.clientX-skyTap.x,e.clientY-skyTap.y)<=10){const rect=canvas.getBoundingClientRect();Constellations.tap((e.clientX-rect.left)/P,(e.clientY-rect.top)/P);}release();});canvas.addEventListener('pointercancel',release);
})();


