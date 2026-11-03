const OrbitMath = (()=>{
  const tilt=.27,ct=Math.cos(tilt),st=Math.sin(tilt),tau=Math.PI*2;
  function layout(width,height){const mobile=width<750&&height>width*.85;return {R:Math.min(width*(mobile?.43:.32),height*(mobile?.27:.39)),CX:width*(mobile?.5:.64),CY:height*(mobile?.64:.54)};}
  function project(p,rotation,{R,CX,CY}){const a=p.lon+rotation,x=Math.cos(p.lat)*Math.sin(a),y=Math.sin(p.lat),z=Math.cos(p.lat)*Math.cos(a);return {x:CX+R*x,y:CY-R*(y*ct-z*st),z:y*st+z*ct};}
  function target(lon,rotation){let delta=(-lon-rotation)%tau;if(delta>Math.PI)delta-=tau;if(delta< -Math.PI)delta+=tau;return rotation+delta;}
  return {layout,project,target};
})();
if(typeof module!=='undefined')module.exports=OrbitMath;
