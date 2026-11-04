(() => {
  'use strict';
  const $=s=>document.querySelector(s),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const words=[{term:'remember',answers:['помнить','запоминать'],type:'глагол'},{term:'journey',answers:['путешествие'],type:'существительное'},{term:'opportunity',answers:['возможность'],type:'существительное'}];
  let index=0,reverse=false,answered=false,flipping=false,autoNext=0,turns=0;
  const card=$('.demo-card'),tiltHost=document.createElement('div'),turner=document.createElement('div'),flipMotion=matchMedia('(prefers-reduced-motion: reduce)');
  tiltHost.className='demo-tilt';turner.className='demo-turner';card.replaceWith(tiltHost);tiltHost.append(turner);turner.append(card);
  let flipAnimation=null;
  function advance(){
    index++;if(index===words.length){$('#demo-round').hidden=true;$('#demo-finish').hidden=false;}else renderWord();
  }
  function focusAnswer(){(index===words.length?$('#demo-restart'):$('#answer')).focus({preventScroll:true});}
  function nextWord(){
    if(flipping||!answered)return;clearTimeout(autoNext);autoNext=0;
    if(flipMotion.matches){advance();focusAnswer();return;}
    flipping=true;card.inert=true;turner.setAttribute('aria-busy','true');
    // Keep only one interactive face. The outgoing snapshot has unique IDs and no events.
    const snapshot=card.cloneNode(true),originals=[card,...card.querySelectorAll('*')],copies=[snapshot,...snapshot.querySelectorAll('*')];
    copies.forEach((copy,i)=>{const style=getComputedStyle(originals[i]);copy.style.cssText=Array.from(style).map(key=>`${key}:${style.getPropertyValue(key)}`).join(';');if(copy.id)copy.id='snapshot-'+copy.id;if(copy.matches('input'))copy.value=originals[i].value;});
    snapshot.classList.add('demo-card-snapshot');snapshot.setAttribute('aria-hidden','true');snapshot.inert=true;
    const height=card.offsetHeight;snapshot.style.position='absolute';snapshot.style.inset='0';snapshot.style.margin='0';snapshot.style.transform=`rotateY(${turns%2?180:0}deg)`;snapshot.style.backfaceVisibility='hidden';turner.append(snapshot);
    turns++;card.style.setProperty('--card-face',`${turns%2?180:0}deg`);advance();
    turner.style.height=Math.max(height,card.offsetHeight)+'px';turner.dataset.flipping='true';
    flipAnimation=turner.animate([{transform:`rotateY(${(turns-1)*180}deg)`},{transform:`rotateY(${turns*180}deg)`}],{duration:820,easing:'cubic-bezier(.45,0,.2,1)',fill:'forwards'});
    const current=flipAnimation;
    current.finished.catch(()=>{}).then(()=>{turner.style.transform=`rotateY(${turns*180}deg)`;current.cancel();snapshot.remove();turner.style.height='';turner.removeAttribute('aria-busy');turner.dataset.flipping='false';card.inert=false;flipping=false;flipAnimation=null;focusAnswer();});
  }
  flipMotion.addEventListener('change',event=>{if(event.matches&&flipAnimation)flipAnimation.finish();});
  function renderWord(){
    const word=words[index];answered=false;$('#demo-round').hidden=false;$('#demo-finish').hidden=true;$('#demo-word').textContent=reverse?word.answers[0]:word.term;
    $('#round-count').textContent=`СЛОВО 0${index+1} / 03`;$('#round-fill').style.width=((index+1)/words.length*100)+'%';$('#direction').innerHTML=(reverse?'RU → EN':'EN → RU')+' <span>⇄</span>';
    $('#word-type').textContent=word.type;$('#word-instruction').textContent=reverse?'Вспомни английское слово.':'Как это будет по-русски?';$('#answer').value='';$('#answer').disabled=false;$('#answer').placeholder=reverse?'Type your answer…':'Введи перевод…';$('#answer').setAttribute('aria-label',reverse?'Ответ на английском':'Ответ на русском');
    $('#answer-feedback').textContent='Здесь нет вариантов ответа. Только ты и твоя память.';$('#answer-feedback').removeAttribute('data-state');$('#answer-submit').textContent='Проверить →';$('#answer-skip').hidden=false;
  }
  function finishAnswer(kind){
    const correct=reverse?[words[index].term]:words[index].answers;
    const messages={correct:'Верно! Ты вспомнил все значения.',partial:'Частично верно! Все значения: '+correct.join(' · ')+'.',typo:'Засчитано: небольшая опечатка не помеха. Правильно: '+correct.join(' · ')+'.',wrong:'Пока нет. Правильный ответ: '+correct.join(' · ')+'.',revealed:'Вот ответ: '+correct.join(' · ')+'. В следующий раз попробуй вспомнить.'};
    answered=true;$('#answer-feedback').textContent=messages[kind];$('#answer-feedback').dataset.state=kind;$('#answer').disabled=true;$('#answer-skip').hidden=true;$('#answer-submit').textContent=index<words.length-1?'Следующее слово →':'Завершить раунд →';
    if(!reduced)$('#demo-word').animate([{opacity:.55,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:250});
    if(['correct','partial','typo'].includes(kind)){document.dispatchEvent(new CustomEvent('demo:success'));autoNext=setTimeout(nextWord,650);}
  }
  $('#answer-form').addEventListener('submit',event=>{
    event.preventDefault();if(flipping)return;if(answered){nextWord();return;}
    const result=LearningDemo.grade($('#answer').value,reverse?[words[index].term]:words[index].answers,reverse);if(result.kind==='empty'){$('#answer-feedback').textContent='Введи свой ответ или нажми «Не знаю».';$('#answer').focus({preventScroll:true});return;}finishAnswer(result.kind);
  });
  $('#answer-skip').onclick=()=>{if(!flipping&&!answered)finishAnswer('revealed');};$('#direction').onclick=()=>{if(flipping)return;clearTimeout(autoNext);reverse=!reverse;renderWord();};$('#demo-restart').onclick=()=>{if(flipping)return;clearTimeout(autoNext);index=0;renderWord();$('#answer').focus({preventScroll:true});};
  document.querySelectorAll('a[href="#try"]').forEach(link=>link.addEventListener('click',()=>{if(flipping)return;if(index>=words.length){index=0;renderWord();}$('#answer').focus({preventScroll:true});}));renderWord();
  addEventListener('pagehide',()=>clearTimeout(autoNext));
  const days=[['Первое знакомство.','Ты верно вспоминаешь перевод. Отличное начало — но слово ещё не выучено.','Знакомство состоялось'],['Уже не случайность.','В другой день ты снова отвечаешь верно. Слово становится увереннее, но ему нужно ещё одно закрепление.','Память становится крепче'],['Теперь — выучено.','Третий правильный ответ в новый день, без ошибок между ними. Слово переходит в выученные.','✓ Слово выучено']];
  document.querySelectorAll('[data-day]').forEach(button=>button.onclick=()=>{const day=Number(button.dataset.day);document.querySelectorAll('[data-day]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('#day-title').textContent=days[day-1][0];$('#day-description').textContent=days[day-1][1];$('#memory-status').textContent=days[day-1][2];document.querySelectorAll('.memory-checks i').forEach((mark,i)=>{mark.classList.toggle('done',i<day);mark.textContent=i<day?'✓':String(i+1);});$('.memory-word').classList.toggle('learned',day===3);});
  const topics={everyday:[['remember','помнить · запоминать'],['discover','открывать · обнаруживать'],['opportunity','возможность']],travel:[['journey','путешествие'],['departure','отправление'],['destination','место назначения']],mine:[['curiosity','любопытство'],['inspiration','вдохновение']]};let topic='everyday';
  function renderTopic(){
    $('#topic-words').replaceChildren(...topics[topic].map(([term,meaning])=>{const row=document.createElement('div');row.className='topic-word';const title=document.createElement('strong'),translation=document.createElement('span'),icon=document.createElement('b');title.textContent=term;translation.textContent=meaning;icon.textContent='↗';icon.setAttribute('aria-hidden','true');row.append(title,translation,icon);return row;}));document.querySelectorAll('[data-topic]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.topic===topic)));
  }
  document.querySelectorAll('[data-topic]').forEach(button=>button.onclick=()=>{topic=button.dataset.topic;renderTopic();});
  $('#add-word').onclick=()=>{const show=$('#new-word-form').hidden;$('#new-word-form').hidden=!show;$('#add-word').setAttribute('aria-expanded',String(show));$('#add-word').textContent=show?'− Закрыть форму':'+ Добавить своё слово';if(show){topic='mine';renderTopic();$('#new-term').focus({preventScroll:true});}};
  $('#new-word-form').addEventListener('submit',event=>{event.preventDefault();const term=$('#new-term').value.trim(),meaning=$('#new-meaning').value.trim();if(!term||!meaning){$('#new-word-error').textContent='Заполни термин и его значение.';return;}if(topics.mine.some(([word])=>word.toLowerCase()===term.toLowerCase())){$('#new-word-error').textContent='Это слово уже есть в примере.';return;}topics.mine.push([term,meaning]);topic='mine';renderTopic();$('#new-word-form').reset();$('#new-word-error').textContent='Добавлено в пример набора. Слова хранятся до перезагрузки страницы.';});renderTopic();
  const metrics={words:{values:[90,94,97,102,109,117,124],value:'124',unit:'слова в памяти',change:'+34 за неделю ↗',label:'слов',title:'Пример роста словарного запаса за неделю'},accuracy:{values:[76,79,85,81,90,92,94],value:'94%',unit:'верных ответов',change:'+18 п.п. за неделю ↗',label:'% точности',title:'Пример изменения точности за неделю'},activity:{values:[10,18,14,24,21,30,32],value:'32',unit:'попытки за день',change:'+22 к понедельнику ↗',label:'попыток',title:'Пример активности по дням'}};
  const dayNames=['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'],svgNS='http://www.w3.org/2000/svg';
  function renderMetric(key){
    const metric=metrics[key];document.querySelectorAll('[data-metric]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.metric===key)));$('#metric-number').textContent=metric.value;$('#metric-unit').textContent=metric.unit;$('#metric-change').textContent=metric.change;$('#chart-title').textContent=metric.title;$('#chart-detail').textContent='Наведи на точку, чтобы посмотреть значение.';
    const min=Math.min(...metric.values),max=Math.max(...metric.values),range=Math.max(10,max-min),points=metric.values.map((value,i)=>[20+i*80,145-(value-min)/range*110]);const line=points.map(([x,y],i)=>(i?'L':'M')+x+' '+y.toFixed(2)).join(' ');$('#learning-chart-line').setAttribute('d',line);$('#learning-chart-area').setAttribute('d',line+' L500 170 L20 170 Z');
    $('#chart-points').replaceChildren(...points.map(([x,y],i)=>{const group=document.createElementNS(svgNS,'g'),dot=document.createElementNS(svgNS,'circle');group.setAttribute('tabindex','0');group.setAttribute('role','img');group.setAttribute('aria-label',dayNames[i]+': '+metric.values[i]+' '+metric.label);dot.setAttribute('cx',x);dot.setAttribute('cy',y);dot.setAttribute('r','4');group.append(dot);const detail=()=>{$('#chart-detail').textContent=dayNames[i]+' · '+metric.values[i]+' '+metric.label;};group.addEventListener('pointerenter',detail);group.addEventListener('focus',detail);group.addEventListener('click',detail);return group;}));
    if(!reduced){const length=$('#learning-chart-line').getTotalLength();$('#learning-chart-line').animate([{strokeDasharray:length,strokeDashoffset:length},{strokeDasharray:length,strokeDashoffset:0}],{duration:600,easing:'ease-out'});}
  }
  document.querySelectorAll('[data-metric]').forEach(button=>button.onclick=()=>renderMetric(button.dataset.metric));renderMetric('words');
  const languages=[['RU','Русский','«Привет».'],['EN','Английский','Hello.'],['ES','Испанский','Hola.'],['PT','Португальский','Olá.'],['FR','Французский','Bonjour.'],['DE','Немецкий','Hallo.'],['IT','Итальянский','Ciao.'],['ZH','Китайский','你好。'],['JA','Японский','こんにちは。'],['KO','Корейский','안녕하세요.']];
  for(const [code,name,greeting] of languages){const button=document.createElement('button');button.type='button';button.textContent=code;button.setAttribute('aria-label',name);button.setAttribute('aria-pressed',String(code==='RU'));button.onclick=()=>{document.querySelectorAll('#language-options button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('#language-greeting').textContent=greeting;$('#language-name').textContent=name;};$('#language-options').append(button);}
  const header=$('.learning-header'),onScroll=()=>header.classList.toggle('scrolled',scrollY>20);addEventListener('scroll',onScroll,{passive:true});onScroll();
  if(!reduced&&'IntersectionObserver' in window){document.body.classList.add('js-motion');const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}},{threshold:.1});document.querySelectorAll('.reveal').forEach(element=>observer.observe(element));}
  if(!reduced){$('.hero-playground').addEventListener('pointermove',event=>{if(event.pointerType!=='mouse')return;const rect=$('.hero-playground').getBoundingClientRect();$('.hero-playground').style.setProperty('--parallax-x',((event.clientX-rect.left)/rect.width-.5)*9+'px');$('.hero-playground').style.setProperty('--parallax-y',((event.clientY-rect.top)/rect.height-.5)*7+'px');});$('.hero-playground').addEventListener('pointerleave',()=>{$('.hero-playground').style.setProperty('--parallax-x','0px');$('.hero-playground').style.setProperty('--parallax-y','0px');});}
})();
