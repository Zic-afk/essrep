/* Browser integration checks; requires local Edge with CDP on port 9222. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
  const tab=(await(await fetch('http://127.0.0.1:9222/json')).json()).find(t=>t.type==='page'),ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
  let seq=0;const pending=new Map(),errors=[];
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const task=pending.get(m.id);pending.delete(m.id);m.error?task.reject(m.error):task.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
  const send=(method,params={})=>new Promise((resolve,reject)=>{pending.set(++seq,{resolve,reject});ws.send(JSON.stringify({id:seq,method,params}));});
  const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
  const screenshot=async name=>{const result=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.resolve(__dirname,'../artifacts/previews/'+name),Buffer.from(result.data,'base64'));};
  await send('Runtime.enable');await send('Page.enable');await send('Emulation.setFocusEmulationEnabled',{enabled:true});await send('Emulation.setEmulatedMedia',{features:[]});await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,'../pages/project-wearninglords.html')).href});
  for(let i=0;i<60;i++){if(await evaluate("document.readyState==='complete'&&document.querySelectorAll('#language-options button').length===10"))break;await delay(100);}
  await delay(350);assert.equal(await evaluate("document.querySelectorAll('#language-options button').length"),10);
  assert.ok(await evaluate("document.querySelector('h1').textContent.includes('Создавай свои')&&document.querySelector('h1').textContent.includes('Запоминай навсегда')"),'Garden headline is applied');
  assert.equal(await evaluate("document.querySelectorAll('.garden-feature').length"),3);
  await evaluate("document.querySelector('.garden-feature summary').click()");assert.ok(await evaluate("!document.querySelector('.garden-feature details').open"),'Feature accordion closes');
  await evaluate("document.querySelector('.garden-feature summary').click();document.querySelector('[data-stack=cards]').click()");await delay(550);assert.equal(await evaluate("document.querySelector('[data-stack=cards]').dataset.card"),'1','3D stack flips to next card');
  await evaluate("document.querySelector('.demo-stage').scrollIntoView({behavior:'instant',block:'center'})");await delay(350);
  const stage=await evaluate("(()=>{const r=document.querySelector('.demo-stage').getBoundingClientRect();return {x:r.left+r.width*.8,y:r.top+r.height*.8}})()");
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:stage.x,y:stage.y});await delay(500);assert.ok(await evaluate("parseFloat(document.querySelector('.demo-card').style.getPropertyValue('--garden-tilt-y'))>2"),'Demo card responds to pointer with 3D tilt');
  await evaluate("window.scrollTo({top:0,behavior:'instant'})");await delay(350);
  const magnet=await evaluate("(()=>{const r=document.querySelector('[data-magnetic]').getBoundingClientRect();return {x:r.left+r.width*.8,y:r.top+r.height*.4}})()");
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:magnet.x,y:magnet.y});await delay(250);assert.ok(await evaluate("parseFloat(document.querySelector('[data-magnetic]').style.getPropertyValue('--magnet-x'))>1"),'Main CTA is magnetic');
  assert.ok(await evaluate("document.querySelector('.garden-cursor').classList.contains('is-link')"),'Custom cursor grows on links');
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:10,y:400});await delay(350);
  await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:10,y:400,deltaX:0,deltaY:500});await delay(700);const wheelY=await evaluate('scrollY');assert.ok(wheelY>450&&wheelY<540,`Native wheel easing reaches target: ${wheelY}`);await evaluate("window.scrollTo({top:0,behavior:'instant'})");await delay(150);
  await screenshot('preview-wearninglords-desktop.png');
  const answer=async value=>evaluate(`document.querySelector('#answer').value=${JSON.stringify(value)};document.querySelector('#answer-form').requestSubmit()`);
  await answer('помнить');assert.equal(await evaluate("document.querySelector('#answer-feedback').dataset.state"),'partial');
  await evaluate("document.querySelector('#answer-submit').click()");await delay(950);await answer('путешествие');assert.equal(await evaluate("document.querySelector('#answer-feedback').dataset.state"),'correct');
  await evaluate("document.querySelector('#answer-submit').click()");await delay(950);await evaluate("document.querySelector('#answer-skip').click()");assert.equal(await evaluate("document.querySelector('#answer-feedback').dataset.state"),'revealed');
  await evaluate("document.querySelector('#answer-submit').click()");await delay(950);assert.ok(await evaluate("!document.querySelector('#demo-finish').hidden"));
  await evaluate("document.querySelector('#demo-restart').click();document.querySelector('#direction').click()");await answer('remeber');assert.equal(await evaluate("document.querySelector('#answer-feedback').dataset.state"),'typo');
  await evaluate("document.querySelector('#direction').click();document.querySelector('[data-day=\"3\"]').click()");assert.equal(await evaluate("document.querySelectorAll('.memory-checks .done').length"),3);
  await evaluate("document.querySelector('[data-topic=\"travel\"]').click()");assert.ok(await evaluate("document.querySelector('#topic-words').textContent.includes('journey')"));
  await evaluate("document.querySelector('#add-word').click();document.querySelector('#new-term').value='evidence';document.querySelector('#new-meaning').value='доказательство';document.querySelector('#new-word-form').requestSubmit()");assert.ok(await evaluate("document.querySelector('#topic-words').textContent.includes('evidence')"));
  await evaluate("document.querySelector('[data-metric=\"accuracy\"]').click()");assert.equal(await evaluate("document.querySelector('#metric-number').textContent"),'94%');
  await evaluate("document.querySelector('#chart-points g').focus()");assert.ok(await evaluate("document.querySelector('#chart-detail').textContent.includes('Понедельник')"));
  await evaluate("document.querySelector('.growth-ring').scrollIntoView({behavior:'instant',block:'center'})");await delay(1800);assert.equal(await evaluate("document.querySelector('#ring-number').textContent"),'94%');assert.ok(await evaluate("document.querySelector('.growth-ring').classList.contains('is-growing')"),'Circular chart fills on appearance');
  await evaluate("document.querySelector('#language-options button[aria-label=\"Испанский\"]').click()");assert.equal(await evaluate("document.querySelector('#language-greeting').textContent"),'Hola.');
  await evaluate("document.querySelector('#how').scrollIntoView()");await delay(800);await screenshot('preview-wearninglords-method.png');
  for(const [width,height] of [[320,568],[390,844],[768,1024],[1440,1000]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<760});await evaluate('window.scrollTo(0,0)');await delay(300);
    assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'),`No horizontal overflow: ${width}`);
    if(width===390)await screenshot('preview-wearninglords-mobile.png');
  }
  await evaluate("document.querySelector('.back-orbit').click()");
  for(let i=0;i<50;i++){if(await evaluate("document.readyState==='complete'&&location.pathname.endsWith('index.html')&&document.querySelectorAll('.beacon').length===3"))break;await delay(100);}
  assert.ok(await evaluate("document.querySelector('#space').getAnimations().some(a=>a.effect.getKeyframes()[0].transform==='scale(4.8)')"),'WearningLords returns through clouds to the globe');
  await delay(1200);await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,'../pages/project-wearninglords.html')).href});await delay(350);
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await send('Page.reload');await delay(350);assert.ok(await evaluate("!document.body.classList.contains('js-motion')"),'Reduced motion shows content without reveals');
  assert.deepEqual(errors,[],'No browser JS errors');ws.close();console.log('WearningLords browser passed: training, direction, typo, three days, topics, own word, chart, languages, responsive layouts and reduced motion.');
})().catch(e=>{console.error(e);process.exit(1)});
