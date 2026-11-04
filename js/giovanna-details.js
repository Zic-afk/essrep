/* Event-driven case interactions: no continuous background rendering. */
(()=>{
  const main=document.querySelector('.giovanna-case'),steps=document.querySelector('.giovanna-steps');
  const cards=[...steps.querySelectorAll('.giovanna-step')];
  const tools=document.createElement('div');tools.className='case-tools';
  const toggle=document.createElement('button');toggle.type='button';toggle.className='blueprint-toggle';toggle.textContent='⌗ Изнанка сайта';toggle.setAttribute('aria-pressed','false');
  const hint=document.createElement('span');hint.textContent='Посмотреть, как всё собрано';tools.append(toggle,hint);main.querySelector('.back-orbit').after(tools);
  toggle.onclick=()=>{const on=document.body.classList.toggle('is-blueprint');toggle.setAttribute('aria-pressed',String(on));hint.textContent=on?'Чертёж включён · все элементы работают':'Посмотреть, как всё собрано';};
  const word=document.querySelector('h1>span'),button=document.createElement('button');button.type='button';button.className='living-word';button.setAttribute('aria-label','Giovanna — идея, дизайн, код, движение');button.setAttribute('aria-pressed','false');
  ['Gi','ov','an','na'].forEach((part,i)=>{const group=document.createElement('span');group.className='word-group';group.setAttribute('aria-hidden','true');group.style.setProperty('--offset',String(i-1.5));for(const letter of part){const span=document.createElement('span');span.className='word-letter';span.textContent=letter;group.append(span);}const label=document.createElement('small');label.textContent=['идея','дизайн','код','движение'][i];group.append(label);button.append(group);});
  const dot=document.createElement('span');dot.textContent='.';dot.setAttribute('aria-hidden','true');button.append(dot);word.replaceChildren(button);
  button.onclick=()=>{const open=button.classList.toggle('is-open');button.setAttribute('aria-pressed',String(open));};
  button.addEventListener('keydown',event=>{if(event.key==='Escape'){button.classList.remove('is-open');button.setAttribute('aria-pressed','false');button.blur();}});
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('case-route');svg.setAttribute('aria-hidden','true');
  const track=document.createElementNS(ns,'path'),fill=document.createElementNS(ns,'path');track.classList.add('route-track');fill.classList.add('route-fill');svg.append(track,fill);
  const nodes=cards.map(()=>{const node=document.createElementNS(ns,'circle');node.setAttribute('r','3');svg.append(node);return node;});steps.prepend(svg);
  let length=1,queued=false;
  function update(){
    queued=false;const rect=steps.getBoundingClientRect(),progress=Math.max(0,Math.min(1,(innerHeight*.8-rect.top)/rect.height));
    const current=Math.min(3,Math.floor(progress*4));
    fill.style.strokeDashoffset=String(length*(1-progress));
    cards.forEach((card,i)=>{card.classList.toggle('is-current-stage',i===current);card.classList.toggle('is-past-stage',i<current);nodes[i].classList.toggle('is-lit',i<=current);});
    steps.dataset.stage=String(current+1);
  }
  const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(update);}};
  function layout(){
    const width=steps.clientWidth,height=steps.clientHeight,mobile=getComputedStyle(steps).gridTemplateColumns.split(' ').length===1;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    const points=cards.map((card,i)=>({x:mobile?10:i%2?card.offsetLeft-12:card.offsetLeft+card.offsetWidth+12,y:card.offsetTop+(i%2&&!mobile?76:32)}));
    let path='';points.forEach((p,i)=>{path+=i?` L ${p.x} ${p.y}`:`M ${p.x} ${p.y}`;nodes[i].setAttribute('cx',p.x);nodes[i].setAttribute('cy',p.y);});track.setAttribute('d',path);fill.setAttribute('d',path);length=fill.getTotalLength()||1;fill.style.strokeDasharray=String(length);
    const measured=[main.querySelector('.project-heading'),main.querySelector('.giovanna-world'),...cards];
    measured.forEach((element,i)=>{element.dataset.blueprint=['ЗАГОЛОВОК / HTML','МИР / CANVAS',...cards.map((_,j)=>'БЛОК / 0'+(j+1))][i];element.dataset.measure=`${element.offsetWidth} × ${element.offsetHeight} px`;});update();
  }
  new ResizeObserver(layout).observe(steps);document.fonts.ready.then(layout);addEventListener('resize',layout,{passive:true});addEventListener('scroll',schedule,{passive:true});addEventListener('pageshow',schedule);layout();
})();
