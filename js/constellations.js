/* Sparse star groups: pixel lines appear on hover, tap or keyboard activation. */
const Constellations = (()=>{
  const groups=[
    {name:'Парус',x:.45,y:.11,mx:.72,my:.10,points:[[-17,4],[-6,-6],[8,-3],[14,9],[-6,13]],edges:[[0,1],[1,2],[2,3],[3,4],[4,1]]},
    {name:'Стрела',x:.15,y:.65,mx:.16,my:.42,points:[[-16,7],[-4,2],[9,-5],[4,-10],[9,-5],[16,0]],edges:[[0,1],[1,2],[2,3],[2,5]]},
    {name:'Маяк',x:.40,y:.90,mx:.82,my:.89,points:[[-13,0],[-3,-7],[6,-3],[15,4],[1,9]],edges:[[0,1],[1,2],[2,3],[2,4],[4,0]]}
  ].map(group=>({...group,opacity:0,until:0,used:false}));
  const patterns=[...groups.map(({name,points,edges})=>({name,points,edges})),
    {name:'Кристалл',points:[[0,-14],[12,-3],[7,12],[-7,12],[-12,-3],[0,3]],edges:[[0,1],[1,2],[2,3],[3,4],[4,0],[0,5],[5,2],[5,3]]},
    {name:'Корона',points:[[-17,-6],[-10,10],[0,-2],[10,10],[17,-6]],edges:[[0,1],[1,2],[2,3],[3,4],[1,3]]},
    {name:'Компас',points:[[0,-15],[14,0],[0,14],[-14,0],[0,0]],edges:[[0,1],[1,2],[2,3],[3,0],[0,4],[4,2],[3,4],[4,1]]},
    {name:'Мост',points:[[-18,9],[-12,-6],[-3,-11],[7,-7],[17,9],[-2,5]],edges:[[0,1],[1,2],[2,3],[3,4],[0,5],[5,4],[2,5]]},
    {name:'Спираль',points:[[-16,11],[-17,-4],[-5,-13],[11,-8],[15,5],[5,12],[-4,5],[0,-2]],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]]}
  ];
  function change(group){
    const occupied=new Set(groups.map(g=>g.name)),available=patterns.filter(pattern=>!occupied.has(pattern.name));
    const next=available[Math.floor(Math.random()*available.length)];Object.assign(group,next);group.used=false;
  }
  let clock=0,hover=null,positions=[];
  function pointer(point){hover=point;}
  function activate(index){if(groups[index])groups[index].until=clock+3.5;}
  function tap(x,y){let nearest=-1,distance=Infinity;for(const group of positions)for(const point of group.points){const d=Math.hypot(point.x-x,point.y-y);if(d<distance){distance=d;nearest=group.index;}}if(distance<22){activate(nearest);return true;}return false;}
  function line(ctx,a,b){let x=Math.round(a.x),y=Math.round(a.y);const endX=Math.round(b.x),endY=Math.round(b.y),dx=Math.abs(endX-x),dy=-Math.abs(endY-y),sx=x<endX?1:-1,sy=y<endY?1:-1;let error=dx+dy;for(;;){ctx.fillRect(x,y,1,1);if(x===endX&&y===endY)break;const twice=error*2;if(twice>=dy){error+=dy;x+=sx;}if(twice<=dx){error+=dx;y+=sy;}}}
  function draw(ctx,{width,height,dt,mobile,reduced,parallax}){
    clock+=dt;positions=[];
    for(const [index,group] of groups.entries()){
      const scale=mobile?.65:1,cx=(mobile?group.mx:group.x)*width+parallax.x,cy=(mobile?group.my:group.y)*height+parallax.y;
      let points=group.points.map(([x,y])=>({x:cx+x*scale,y:cy+y*scale}));
      const nearby=hover&&points.some(p=>Math.hypot(p.x-hover.x,p.y-hover.y)<(mobile?18:30));
      const goal=nearby||clock<group.until?1:0;group.opacity=reduced?goal:group.opacity+(goal-group.opacity)*Math.min(1,dt*4);
      if(goal)group.used=true;
      if(!goal&&group.opacity<.01&&group.used){change(group);points=group.points.map(([x,y])=>({x:cx+x*scale,y:cy+y*scale}));}
      positions.push({index,name:group.name,points,x:cx,y:cy});
      if(group.opacity>.01){ctx.globalAlpha=group.opacity*.35;ctx.fillStyle='#86a8b5';for(const [a,b] of group.edges)line(ctx,points[a],points[b]);}
      ctx.globalAlpha=1;
      for(const point of points){ctx.fillStyle=group.opacity>.2?'#c8d7b3':'#49616c';ctx.fillRect(Math.round(point.x),Math.round(point.y),1,1);if(group.opacity>.5){ctx.globalAlpha=group.opacity*.5;ctx.fillRect(Math.round(point.x)-1,Math.round(point.y),3,1);ctx.fillRect(Math.round(point.x),Math.round(point.y)-1,1,3);ctx.globalAlpha=1;}}
    }
  }
  function targets(){return positions;}
  return {draw,pointer,tap,activate,targets};
})();
