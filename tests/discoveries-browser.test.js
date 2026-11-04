/* Uses the same local CDP browser as browser.test.js. */
const assert=require('node:assert/strict');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const tabs=await(await fetch('http://127.0.0.1:9222/json')).json();
 const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let sequence=0;const pending=new Map(),errors=[];
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 try{
 await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 const url=require('node:url').pathToFileURL(require('node:path').resolve(__dirname,'../index.html')).href;
 const load=async()=>{await send('Page.navigate',{url});await delay(900);};await load();
 await evaluate("localStorage.removeItem('giovanna-explored-v1');localStorage.removeItem('giovanna-constellation-seen-v1')");await load();
 // Use an unoccupied lower part of the visible globe; derive its layout directly.
 const coords=await evaluate("(()=>{const r=document.querySelector('#space').getBoundingClientRect();return {x:r.width*.64,y:r.height*.61}})()");
 await send('Input.dispatchMouseEvent',{type:'mousePressed',...coords,button:'left',clickCount:1});await delay(650);
 assert.equal(await evaluate("document.querySelector('#home').dataset.scanning"),'true','Holding scans the globe');
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',...coords,button:'left',clickCount:1});await delay(100);
 assert.equal(await evaluate("document.querySelector('#home').dataset.scanning"),'false');
 await evaluate("document.querySelector('#planet-scan').click()");await delay(100);
 assert.equal(await evaluate("document.querySelector('#planet-scan').getAttribute('aria-pressed')"),'true');
 let shot=await send('Page.captureScreenshot',{format:'png'});require('node:fs').writeFileSync(require('node:path').resolve(__dirname,'../artifacts/previews/discovery-scan.png'),Buffer.from(shot.data,'base64'));
 await evaluate("document.querySelector('.space-action[data-action^=\"signal-\"]:not([hidden])').click()");await delay(200);
 assert.ok(await evaluate("document.querySelector('.discovery-message').textContent.includes('Вы уже внутри проекта')"));
 assert.equal(await evaluate("document.querySelectorAll('.beacon.is-signal').length"),1);
 assert.equal(await evaluate("document.querySelectorAll('.beacon.is-explored').length"),0,'Signals and previews are not visits');
 await evaluate("localStorage.setItem('giovanna-explored-v1',JSON.stringify(Esscale.projects.map(p=>p.id)))");await load();await delay(300);
 assert.equal(await evaluate("document.querySelectorAll('.beacon.is-explored').length"),4);
 assert.ok(await evaluate("document.querySelector('#home').classList.contains('is-celebrating')"),'All four visits trigger constellation reward');
 assert.equal(await evaluate("localStorage.getItem('giovanna-constellation-seen-v1')"),'yes');
 await delay(1700);shot=await send('Page.captureScreenshot',{format:'png'});require('node:fs').writeFileSync(require('node:path').resolve(__dirname,'../artifacts/previews/discovery-reward.png'),Buffer.from(shot.data,'base64'));
 await load();assert.ok(await evaluate("!document.querySelector('#home').classList.contains('is-celebrating')"),'Reward does not repeat on reload');
 await evaluate("localStorage.removeItem('giovanna-explored-v1');localStorage.removeItem('giovanna-constellation-seen-v1')");
 assert.deepEqual(errors,[]);console.log('PASS: hold scanning, accessible scan, satellite discovery, saved exploration and one-time reward.');
 }finally{await send('Emulation.clearDeviceMetricsOverride');ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
