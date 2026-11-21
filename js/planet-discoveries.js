/* Small discoveries share the existing pixel canvas and its animation loop. */
const PlanetDiscoveries=(()=>{
  const key='giovanna-explored-v1',rewardKey='giovanna-constellation-seen-v1';
  function create({hero,canvas,pins,projects,geometry,projectPoint,phase,locate,returned,reduced}){
    let visited=[];try{const value=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(value))visited=value.filter(id=>projects.some(p=>p.id===id));}catch{}
    if(returned>=0&&!visited.includes(projects[returned].id)){visited.push(projects[returned].id);try{localStorage.setItem(key,JSON.stringify(visited));}catch{}}
    function refreshPins(){pins.forEach((pin,i)=>{if(!visited.includes(projects[i].id)||pin.classList.contains('is-explored'))return;pin.classList.add('is-explored');const badge=document.createElement('span');badge.className='explored-badge';badge.textContent='исследовано';pin.querySelector('.beacon-label').append(badge);pin.setAttribute('aria-label',projects[i].title+' · исследовано');});}refreshPins();
    function visit(index){if(index<0||!projects[index])return;try{const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))visited=[...new Set([...visited,...saved.filter(id=>projects.some(p=>p.id===id))])];}catch{}if(!visited.includes(projects[index].id))visited.push(projects[index].id);try{localStorage.setItem(key,JSON.stringify(visited));}catch{}refreshPins();}
    const note=document.createElement('div');note.className='discovery-message';note.hidden=true;note.setAttribute('role','status');note.setAttribute('aria-live','polite');
    const text=document.createElement('span'),close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Скрыть сообщение');note.append(text,close);hero.append(note);close.onclick=()=>note.hidden=true;
    let clock=0,noteUntil=0,nextSignal=9,incoming=null,incomingUntil=0,hover=-1,scan=null,scanAlpha=0,hold=null,timer=null,scanUntil=0,reward=null,rewardDone=false;
    try{rewardDone=localStorage.getItem(rewardKey)==='yes';}catch{}
    const say=(message,duration=6)=>{text.textContent=message;note.hidden=false;noteUntil=clock+duration;};
    const scanButton=document.createElement('button');scanButton.type='button';scanButton.id='planet-scan';scanButton.textContent='⌖';scanButton.setAttribute('aria-label','Сканировать планету');hero.querySelector('.controls').append(scanButton);
    function begin(point){if(phase()!=='idle')return;scan=point;scanUntil=Infinity;hero.dataset.scanning='true';scanButton.setAttribute('aria-pressed','true');say('СКАНИРОВАНИЕ / GIOVANNA · '+projects.length+' узла · сектор '+Math.round(point.x)+' : '+Math.round(point.y),3);}
    function end(){clearTimeout(timer);hold=null;scanUntil=clock;hero.dataset.scanning='false';scanButton.setAttribute('aria-pressed','false');}
    scanButton.onclick=()=>{const g=geometry();begin({x:g.CX,y:g.CY});scanUntil=clock+2.8;};
    canvas.addEventListener('pointerdown',e=>{if(phase()!=='idle'||e.button!==0)return;const rect=canvas.getBoundingClientRect(),g=geometry(),point={x:(e.clientX-rect.left)*g.W/rect.width,y:(e.clientY-rect.top)*g.H/rect.height};if(Math.hypot(point.x-g.CX,point.y-g.CY)>g.R)return;hold={x:e.clientX,y:e.clientY};timer=setTimeout(()=>{if(hold)begin(point);},500);},{capture:true});
    canvas.addEventListener('pointermove',e=>{if(hold&&Math.hypot(e.clientX-hold.x,e.clientY-hold.y)>8)end();},{capture:true});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,end);
    addEventListener('pagehide',end);
    pins.forEach((pin,i)=>{pin.addEventListener('pointerenter',()=>hover=i);pin.addEventListener('pointerleave',()=>hover=-1);pin.addEventListener('focus',()=>hover=i);pin.addEventListener('blur',()=>hover=-1);});
    function signal(id){if(phase()!=='idle')return;incoming=null;const i=projects.findIndex(p=>p.id==='giovanna');pins[i].classList.add('is-signal');incomingUntil=clock+7;locate(i);say('Источник сигнала: Giovanna. Вы уже внутри проекта.',7);}
    function line(ctx,a,b){const steps=Math.ceil(Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y)));if(steps>3000)return;for(let s=0;s<=steps;s++){const t=steps?s/steps:0;ctx.fillRect(Math.round(a.x+(b.x-a.x)*t),Math.round(a.y+(b.y-a.y)*t),1,1);}}
    function makeReward(g){
      const glyphs={G:['01110','10001','10000','10111','10001','10001','01110'],I:['11111','00100','00100','00100','00100','00100','11111'],O:['01110','10001','10001','10001','10001','10001','01110'],V:['10001','10001','10001','10001','10001','01010','00100'],A:['01110','10001','10001','11111','10001','10001','10001'],N:['10001','11001','11001','10101','10011','10011','10001']};
      const source=Constellations.targets().flatMap(group=>group.points),points=[];
      [...'GIOVANNA'].forEach((letter,index)=>glyphs[letter].forEach((row,y)=>[...row].forEach((bit,x)=>{if(bit!=='1')return;const from=source[points.length%Math.max(1,source.length)]||{x:g.W*.5,y:g.H*.2};points.push({from:{...from},x:index*6+x,y});})));
      return {age:0,points};
    }
    function draw(ctx,dt){
      clock+=dt;const g=geometry(),idle=phase()==='idle';note.hidden=note.hidden||clock>noteUntil||!idle;
      if(!idle){end();hover=-1;}
      if(clock>scanUntil){hero.dataset.scanning='false';scanButton.setAttribute('aria-pressed','false');}
      const scanning=idle&&scan&&clock<scanUntil;scanAlpha+=(Number(Boolean(scanning))-scanAlpha)*Math.min(1,dt*7);
      if(scanAlpha>.01&&scan){ctx.save();ctx.globalAlpha=scanAlpha*.45;ctx.fillStyle='#93cfcc';
        for(let lat=-1.2;lat<=1.2;lat+=.3){let previous=null;for(let lon=-Math.PI;lon<=Math.PI+.03;lon+=.06){const p=projectPoint({lat,lon});if(p.z>.03&&previous)line(ctx,previous,p);previous=p.z>.03?p:null;}}
        for(let lon=-Math.PI;lon<Math.PI;lon+=.35){let previous=null;for(let lat=-1.5;lat<=1.5;lat+=.06){const p=projectPoint({lat,lon});if(p.z>.03&&previous)line(ctx,previous,p);previous=p.z>.03?p:null;}}
        let node=null;for(const item of projects){const p=projectPoint(item);if(p.z<=.08)continue;if(node)line(ctx,node,p);ctx.fillRect(Math.round(p.x)-2,Math.round(p.y)-2,5,1);ctx.fillRect(Math.round(p.x)-2,Math.round(p.y)+2,5,1);node=p;}
        const radius=reduced?g.R*.7:((clock*24)% (g.R*2));for(let a=0;a<Math.PI*2;a+=.025){const x=scan.x+Math.cos(a)*radius,y=scan.y+Math.sin(a)*radius;if(Math.hypot(x-g.CX,y-g.CY)<g.R)ctx.fillRect(Math.round(x),Math.round(y),1,1);}ctx.restore();}
      if(idle&&hover>=0){const p=projectPoint(projects[hover]);if(p.z>.08){ctx.save();ctx.fillStyle='#9bd1ce';ctx.globalAlpha=.65;const local=projects[hover];let previous=null;for(let a=0;a<=Math.PI*2+.15;a+=.16){const q=projectPoint({lat:local.lat+Math.sin(a)*.14,lon:local.lon+Math.cos(a)*.18});if(q.z>.05&&previous)line(ctx,previous,q);previous=q.z>.05?q:null;}
        const satellites=SpaceObjects.signalTargets(),sat=satellites.reduce((best,s)=>!best||Math.hypot(s.x-p.x,s.y-p.y)<Math.hypot(best.x-p.x,best.y-p.y)?s:best,null);if(sat){ctx.globalAlpha=.2;line(ctx,sat,p);ctx.globalAlpha=1;const t=reduced?.5:(clock*.7)%1;ctx.fillRect(Math.round(sat.x+(p.x-sat.x)*t),Math.round(sat.y+(p.y-sat.y)*t),2,2);}ctx.restore();}}
      if(idle&&clock>nextSignal){const choices=SpaceObjects.signalTargets().filter(s=>Math.hypot(s.x-g.CX,s.y-g.CY)>g.R+8&&s.x>0&&s.x<g.W&&s.y>0&&s.y<g.H);if(choices.length){incoming=choices[Math.floor(Math.random()*choices.length)].id;incomingUntil=clock+6;SpaceObjects.signal(incoming);nextSignal=clock+24;}else nextSignal=clock+2;}
      hero.querySelectorAll('.space-action[data-action^="signal-"]').forEach(button=>button.classList.toggle('has-incoming-signal',idle&&button.dataset.action===incoming&&clock<incomingUntil));
      if(clock>incomingUntil){incoming=null;pins.forEach(pin=>pin.classList.remove('is-signal'));}
      if(!rewardDone&&visited.length===projects.length&&idle){rewardDone=true;try{localStorage.setItem(rewardKey,'yes');}catch{}reward=makeReward(g);say('Все четыре мира исследованы. Это Giovanna.',7);}
      if(reward&&idle){reward.age+=dt;hero.classList.add('is-celebrating');const t=reduced?1:Math.min(1,reward.age/1.5),ease=t*t*(3-2*t),scale=Math.min(2.6,(g.W-12)/47),fade=Math.min(1,(6-reward.age)/1.3);ctx.save();ctx.globalAlpha=Math.max(0,fade);ctx.fillStyle='#d6ead1';for(const p of reward.points){const x=p.from.x+(g.W/2-23.5*scale+p.x*scale-p.from.x)*ease,y=p.from.y+(g.H*(g.W*g.P<750?.09:.13)+p.y*scale-p.from.y)*ease;ctx.fillRect(Math.round(x),Math.round(y),1,1);}ctx.restore();if(reward.age>6){reward=null;hero.classList.remove('is-celebrating');}}
    }
    return {draw,signal,visit};
  }
  return {create};
})();
