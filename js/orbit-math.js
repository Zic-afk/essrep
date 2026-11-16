const OrbitMath = (()=>{
  const tilt=.27,ct=Math.cos(tilt),st=Math.sin(tilt),tau=Math.PI*2;
  function layout(width,height,bounds){
    const mobile=width<750&&height>width*.85;
    const geometry={R:Math.min(width*(mobile?.43:.32),height*(mobile?.27:.39))*.87,CX:width*(mobile?.5:.64),CY:height*(mobile?.65:.5)};
    if(mobile&&bounds){
      const top=bounds.top+18,bottom=Math.max(top+20,bounds.bottom-18);
      geometry.R=Math.min(geometry.R,(bottom-top)/2);
      geometry.CY=(top+bottom)/2;
    }
    return geometry;
  }
  function project(p,rotation,{R,CX,CY}){const a=p.lon+rotation,x=Math.cos(p.lat)*Math.sin(a),y=Math.sin(p.lat),z=Math.cos(p.lat)*Math.cos(a);return {x:CX+R*x,y:CY-R*(y*ct-z*st),z:y*st+z*ct};}
  function target(lon,rotation){let delta=(-lon-rotation)%tau;if(delta>Math.PI)delta-=tau;if(delta< -Math.PI)delta+=tau;return rotation+delta;}
  function randomProjects(count,random=Math.random){
    const offset=random()*tau,positions=Array.from({length:count},(_,i)=>({lat:(random()-.5)*.95,lon:offset+i*tau/count+(random()-.5)*.25}));
    for(let i=count-1;i>0;i--){const j=Math.floor(random()*(i+1));[positions[i],positions[j]]=[positions[j],positions[i]];}return positions;
  }
  return {layout,project,target,randomProjects};
})();
if(typeof module!=='undefined')module.exports=OrbitMath;
