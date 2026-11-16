const assert=require('node:assert/strict'),{layout,project,target}=require('../js/orbit-math.js');
for(const [w,h] of [[320,780],[390,844],[750,900],[1024,768],[1440,1000],[1920,1080],[2560,1200]]){
  const g=layout(w,h);
  assert.ok(g.CX-g.R>=0&&g.CX+g.R<=w,`Whole sphere fits width ${w}`);
  assert.ok(g.CY-g.R>90&&g.CY+g.R<h-40,`Whole sphere fits height ${h}`);
  for(let r=-20;r<20;r+=.3)for(const lon of [-3,-1,0,1,3]){
    const t=target(lon,r);assert.ok(Math.abs(t-r)<=Math.PI+1e-8,'Shortest rotation');
    const p=project({lat:.25,lon},t,g);assert.ok(Math.abs(p.x-g.CX)<1e-7,'Destination is centered');assert.ok(p.z>0,'Destination is visible');
  }
}
console.log('Geometry checks passed: complete globe fits 7 viewports; destinations and shortest rotations.');
for(const [width,height,top,bottom] of [[390,844,385,740],[393,760,375,660],[320,640,340,540],[430,932,410,825]]){
  const g=layout(width,height,{top,bottom});
  assert.ok(g.CY-g.R>=top+17.99,'Mobile planet clears text and both buttons');
  assert.ok(g.CY+g.R<=bottom-17.99,'Mobile planet clears bottom controls');
}
