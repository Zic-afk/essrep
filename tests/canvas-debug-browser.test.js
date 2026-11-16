const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const tabs=await(await fetch('http://127.0.0.1:9222/json')).json(),ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let seq=0;const pending=new Map(),errors=[];ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const url=pathToFileURL(path.resolve(__dirname,'../index.html')).href;
try{
await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url});await delay(800);
assert.ok(await evaluate("!window.CanvasDiagnostics&&!document.querySelector('.canvas-debug')"),'Normal page has no debug API or panel');
await send('Page.navigate',{url:url+'?debug=canvas'});await delay(800);
assert.ok(await evaluate("!!window.CanvasDiagnostics&&!!document.querySelector('.canvas-debug')"));
assert.ok(await evaluate("CanvasDiagnostics.snapshot('planet').startsWith('data:image/png;base64,')"));
await evaluate("document.querySelector('.canvas-debug button').click()");
assert.ok(await evaluate("!!document.querySelector('.canvas-debug img')"));
assert.ok(await evaluate("JSON.parse(document.querySelector('.canvas-debug pre').textContent).buffers.image.height===document.querySelector('#space').height"));
await evaluate("document.querySelectorAll('.canvas-debug input')[1].click()");assert.equal(await evaluate("getComputedStyle(document.querySelector('#space')).imageRendering"),'auto');
await evaluate("document.querySelectorAll('.canvas-debug input')[1].click()");assert.ok(await evaluate("!document.body.classList.contains('debug-no-pixel')"));
await evaluate("document.querySelectorAll('.beacon')[0].click()");await delay(500);await evaluate("document.querySelectorAll('.canvas-debug input')[0].click()");assert.equal(await evaluate("getComputedStyle(document.querySelector('#space')).transform"),'none');
await evaluate("document.querySelector('#preview-close').click()");await delay(300);
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(300);
assert.ok(await evaluate("document.querySelector('.canvas-debug').getBoundingClientRect().right<=innerWidth"));
await evaluate("document.querySelectorAll('.canvas-debug input')[2].click()");await delay(100);assert.equal(await evaluate("document.querySelector('#home').clientHeight"),844);
await evaluate("CanvasDiagnostics.reset()");assert.deepEqual(errors,[]);
console.log('PASS: debug opt-in, PNG snapshots, buffer report, reversible CSS switches, reset and mobile panel.');
}finally{await send('Emulation.clearDeviceMetricsOverride');ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
