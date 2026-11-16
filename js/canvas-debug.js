/* Opt-in diagnostics. No UI, listeners or storage without ?debug=canvas. */
(()=>{
  if(new URLSearchParams(location.search).get('debug')!=='canvas')return;
  const canvas=document.querySelector('#space'),hero=document.querySelector('#home'),api=window.CanvasDiagnostics;
  if(!canvas||!api)return;
  const errors=[];const remember=message=>{errors.push(String(message).slice(0,800));if(errors.length>20)errors.shift();};
  addEventListener('error',event=>remember(event.message));addEventListener('unhandledrejection',event=>remember(event.reason?.message||event.reason));
  const style=document.createElement('style');style.textContent=`
  .canvas-debug{position:fixed;z-index:200;left:8px;top:8px;width:min(380px,calc(100vw - 16px));max-height:55dvh;overflow:auto;padding:12px;border:1px solid #8bd5df;border-radius:8px;background:#06111bf5;color:#d6edf0;font:12px/1.5 system-ui,sans-serif;box-sizing:border-box;box-shadow:0 8px 25px #0008}
  .canvas-debug summary{cursor:pointer;font-weight:700}.canvas-debug p{margin:10px 0;font:12px/1.5 system-ui,sans-serif;color:#d6edf0}.canvas-debug label{display:block;margin:10px 0}.canvas-debug input{margin-right:8px}.canvas-debug button,.canvas-debug a{display:inline-block;padding:9px;margin:3px;border:1px solid #709da8;border-radius:4px;background:#15303e;color:#e7ffff;font:12px system-ui,sans-serif;cursor:pointer}.canvas-debug pre{white-space:pre-wrap;overflow-wrap:anywhere;font:10px/1.5 monospace}.canvas-debug img{display:block;max-width:100%;height:auto;background:#080e19;margin-top:12px}
  body.debug-no-transform #space,body.debug-no-transform #pins{transform:none!important;transition:none!important}
  body.debug-no-pixel #space{image-rendering:auto!important}
  body.debug-fixed-height #home{height:var(--debug-height)!important}
  `;document.head.append(style);
  const panel=document.createElement('details');panel.className='canvas-debug';panel.open=true;const summary=document.createElement('summary');summary.textContent='Диагностика Canvas · свернуть';panel.append(summary);
  const intro=document.createElement('p');intro.textContent='Сначала сохраните исходные PNG и отчёт. Затем меняйте только один переключатель за раз. Трансформации: включите переключатель, сверните панель и затем откройте карточку проекта.';panel.append(intro);
  const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const output=document.createElement('pre'),preview=document.createElement('div');
  function rect(element){const r=element.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}
  function report(){const css=getComputedStyle(canvas);return {version:1,date:new Date().toISOString(),url:location.origin+location.pathname,userAgent:navigator.userAgent,dpr:devicePixelRatio,viewport:{innerWidth,innerHeight,visual:visualViewport?{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale}:null},hero:rect(hero),canvas:rect(canvas),css:{width:css.width,height:css.height,transform:css.transform,imageRendering:css.imageRendering},switches:{noTransform:document.body.classList.contains('debug-no-transform'),noPixel:document.body.classList.contains('debug-no-pixel'),fixedHeight:document.body.classList.contains('debug-fixed-height')},...api.inspect(),errors:[...errors]};}
  function refresh(){output.textContent=JSON.stringify(report(),null,2);}
  function action(label,run){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{try{run();refresh();}catch(error){remember(error.message);status.textContent='Ошибка: '+error.message;refresh();}};panel.append(b);return b;}
  for(const [name,text] of [['debug-no-transform','Отключить CSS-трансформации'],['debug-no-pixel','Отключить pixelated'],['debug-fixed-height','Зафиксировать высоту экрана']]){
    const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.onchange=()=>{if(name==='debug-fixed-height')hero.style.setProperty('--debug-height',innerHeight+'px');document.body.classList.toggle(name,input.checked);requestAnimationFrame(()=>{if(name==='debug-fixed-height')api.reset();refresh();});};label.append(input,document.createTextNode(text));panel.append(label);
  }
  function download(url,name){const a=document.createElement('a');a.href=url;a.download=name;a.textContent='Скачать '+name;return a;}
  action('PNG экрана Canvas',()=>snapshot('scene'));
  action('PNG слоя планеты',()=>snapshot('planet'));
  function snapshot(layer){const url=api.snapshot(layer),img=document.createElement('img');img.src=url;img.alt=layer==='planet'?'Слой планеты из буфера Canvas':'Готовый кадр Canvas без HTML-интерфейса';preview.replaceChildren(download(url,'masquad-'+layer+'.png'),img);status.textContent='Сравните PNG с планетой на странице. Если PNG целый — срез возникает при отображении слоя. На iPhone картинку можно сохранить долгим нажатием.';}
  action('Обновить размеры',refresh);
  action('Пауза / вращение',()=>api.pause());
  action('Сбросить буферы',()=>{api.reset();status.textContent='Размеры и буферы пересозданы. Это сброс рендера, а не перезагрузка страницы.';});
  let blobUrl=null;
  action('Сохранить отчёт',()=>{if(blobUrl)URL.revokeObjectURL(blobUrl);blobUrl=URL.createObjectURL(new Blob([JSON.stringify(report(),null,2)],{type:'application/json'}));const link=download(blobUrl,'masquad-canvas-report.json');preview.replaceChildren(link);link.click();status.textContent='Отчёт готов. Пришлите JSON, PNG и скриншот страницы.';});
  panel.append(status,output,preview);document.body.append(panel);refresh();
  addEventListener('resize',refresh,{passive:true});addEventListener('pagehide',()=>{if(blobUrl)URL.revokeObjectURL(blobUrl);});
})();
