/* Geometry for one 50,000-point cloud, shared by GPU and Canvas fallback. */
const GoPhotoForms=(()=>{
  const COUNT=50000;
  function random(seed){let value=seed>>>0;return ()=>{value=(1664525*value+1013904223)>>>0;return value/4294967296;};}
  function sphere(count=COUNT){const points=new Float32Array(count*3),angle=Math.PI*(3-Math.sqrt(5));for(let i=0;i<count;i++){const y=1-2*(i+.5)/count,r=Math.sqrt(1-y*y);points[i*3]=Math.cos(i*angle)*r;points[i*3+1]=y;points[i*3+2]=Math.sin(i*angle)*r;}return points;}
  function scatter(count=COUNT){const points=new Float32Array(count*3),rng=random(903);for(let i=0;i<count;i++){const angle=rng()*Math.PI*2,r=1.9+rng()*3.5;points[i*3]=Math.cos(angle)*r;points[i*3+1]=Math.sin(angle)*r*.8;points[i*3+2]=(rng()-.5)*3;}return points;}
  function text(document,count=COUNT){
    const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=400;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.font='900 280px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';ctx.fillText('GoPhoto',700,210);
    const data=ctx.getImageData(0,0,1400,400).data,pixels=[];let minX=1400,maxX=0,minY=400,maxY=0;
    for(let y=0;y<400;y+=2)for(let x=0;x<1400;x+=2)if(data[(y*1400+x)*4+3]>160){pixels.push(x,y);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    if(!pixels.length)throw Error('GoPhoto text mask is empty');const points=new Float32Array(count*3),rng=random(523),scale=3.2/(maxX-minX);
    for(let i=0;i<count;i++){const p=Math.floor(rng()*pixels.length/2)*2;points[i*3]=(pixels[p]-(minX+maxX)/2+(rng()-.5)*1.8)*scale;points[i*3+1]=((minY+maxY)/2-pixels[p+1]+(rng()-.5)*1.8)*scale;points[i*3+2]=0;}return points;
  }
  return {COUNT,random,sphere,scatter,text};
})();
if(typeof module!=='undefined')module.exports=GoPhotoForms;
