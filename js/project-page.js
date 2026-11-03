(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let overlay=null,animation=null,leaving=false;
  function clearClouds(){if(animation)animation.cancel();if(overlay)overlay.remove();overlay=null;animation=null;}
  function clouds(){
    clearClouds();overlay=document.createElement('div');overlay.className='cloud-curtain is-active';overlay.setAttribute('aria-hidden','true');overlay.innerHTML='<div class="cloud-bank cloud-bank-a"></div><div class="cloud-bank cloud-bank-b"></div><div class="cloud-core"></div>';document.body.append(overlay);return overlay;
  }
  // Show the arrival only after the deliberate orbital flight, not on direct links.
  let arrival=false;try{arrival=sessionStorage.getItem('esscale-arrival')==='yes';sessionStorage.removeItem('esscale-arrival');}catch{}
  if(arrival&&!reduced){
    const cloud=clouds();animation=cloud.animate([{opacity:1,transform:'scale(1)',backgroundColor:'#d6e3cd'},{opacity:0,transform:'scale(1.6)',backgroundColor:'transparent'}],{duration:600,easing:'ease-out'});
    const current=animation;current.finished.then(()=>{if(animation===current)clearClouds();},()=>{});
  }
  document.addEventListener('click',async event=>{
    const link=event.target.closest('a');
    if(!link||event.defaultPrevented||event.button||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||link.target==='_blank'||link.hasAttribute('download'))return;
    const destination=new URL(link.href);
    if(destination.origin!==location.origin||!destination.pathname.endsWith('/index.html'))return;
    event.preventDefault();if(leaving)return;leaving=true;
    const project=location.pathname.split('/').pop().replace(/^project-/,'').replace(/\.html$/,'');
    destination.searchParams.set('orbit','return');destination.searchParams.set('project',project);
    if(!reduced){
      const cloud=clouds();animation=cloud.animate([{opacity:0,transform:'scale(1.6)',backgroundColor:'transparent'},{opacity:.6,offset:.45},{opacity:1,transform:'scale(1)',backgroundColor:'#d6e3cd'}],{duration:500,easing:'ease-in',fill:'forwards'});
      try{await animation.finished;}catch{return;}
    }
    location.assign(destination.href);
  });
  addEventListener('pageshow',event=>{if(event.persisted){clearClouds();leaving=false;}});
})();
