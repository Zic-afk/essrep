const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const tab=(await(await fetch('http://127.0.0.1:9222/json')).json()).find(t=>t.type==='page'),ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let seq=0;const pending=new Map(),errors=[];ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
try{await send('Runtime.enable');await send('Page.enable');
for(const [width,height] of [[320,568],[390,740],[430,932],[1440,1000]]){
await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<750});await send('Page.navigate',{url:pathToFileURL(path.resolve(__dirname,'../index.html')).href+'?debug=canvas'});await delay(750);
const state=await evaluate(`(()=>{const rect=s=>document.querySelector(s).getBoundingClientRect(),g=CanvasDiagnostics.inspect().geometry;return {intro:rect('.intro').bottom,guideTop:rect('.planet-guide').top,guideBottom:rect('.planet-guide').bottom,planetTop:(g.CY-g.R)*g.P,planetBottom:(g.CY+g.R)*g.P,diameter:g.R*g.P*2,barTop:rect('.orbit-bar').top,overflow:document.documentElement.scrollWidth-innerWidth}})()`);
if(width<750){assert.ok(state.guideTop>=state.intro+23);assert.ok(state.planetTop>=state.guideBottom+23);assert.ok(state.planetBottom<=state.barTop-35);assert.ok(Math.abs(state.diameter-width*.8)<1);}
assert.ok(state.overflow<=0);console.log(width,height,JSON.stringify(state));
}assert.deepEqual(errors,[]);console.log('PASS: mobile guide clears buttons; 80%-width planet clears guide and controls.');
}finally{await send('Emulation.clearDeviceMetricsOverride');ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
