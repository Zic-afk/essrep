/* Hand-drawn pixel sprites. Coordinates and motion use the scene's logical pixels. */
const SpaceObjects = (() => {
  const colors={1:'#344958',2:'#668184',3:'#a4b8a6',4:'#c8d7b3',5:'#43667d',6:'#86a8b5',7:'#d5bb81',8:'#be835d',9:'#d9edac'};
  const sprites={
    asteroid:['00022220000','00223322100','02233332210','02331223221','22311122321','23211233321','12322332110','01223322100','00122211000'],
    smallRock:['0022200','0233320','2334432','2344332','2333332','0233320','0022200'],
    meteor:['07770','78487','78447','78887','07770'],
    satellite:['00000007000000000','00000077000000000','05555003005555000','05665033305665000','05555034305555000','05665033305665000','05555003005555000','00000007000000000','00000000900000000'],
    probe:['0000000040000','0000000434000','0000004333400','0000443333340','0000043333400','0555533333555','0566503330566','0555500300555','0000000300000','0000000900000'],
    ship:['000000022000000','000002233220000','000223344332000','223333444433220','122333344333321','001112333211100','000008777800000','000000898000000'],
    station:['0000000020000000000','0000000232000000000','0555502333200555500','0566502333200566500','0555502333200555500','0000023444320000000','0000233444332000000','0555233444332555500','0566502333200566500','0555500222000555500','0000000020000000000'],
    ufo:['0000033300000','0000344430000','0003444443000','0233333333320','2336666666332','0022333332200','0009009009000']
  };
  function paint(ctx,name,x,y,alpha=1,frame=0,scale=1){
    const sprite=sprites[name];x=Math.round(x-sprite[0].length*scale/2);y=Math.round(y-sprite.length*scale/2);ctx.globalAlpha=alpha;
    for(let row=0;row<sprite.length;row++)for(let col=0;col<sprite[row].length;col++){
      const pixel=sprite[row][col];if(pixel==='0')continue;
      if(pixel==='9'&&frame%4>1)continue;
      ctx.fillStyle=colors[pixel];ctx.fillRect(x+col*scale,y+row*scale,scale,scale);
    }
    ctx.globalAlpha=1;
  }
  const objects=[
    {sprite:'asteroid',x:.86,y:.15,speed:-1,bob:1.4,depth:1,phase:.3},
    {sprite:'satellite',x:.46,y:.18,speed:.4,bob:2.2,depth:1.5,phase:1.2},
    {sprite:'ship',x:.17,y:.73,speed:2.4,bob:1.2,depth:2,phase:2.4},
    {sprite:'probe',x:.84,y:.35,speed:-.6,bob:2.5,depth:1,phase:.8},
    {sprite:'smallRock',x:.07,y:.45,speed:.55,bob:1.8,depth:1,phase:3.1},
    {sprite:'station',x:.95,y:.23,speed:-.3,bob:1.3,depth:.6,phase:1.8,desktop:true},
    {sprite:'asteroid',x:.38,y:.58,speed:-1.3,bob:1.4,depth:1.5,phase:4.1,desktop:true},
    {sprite:'ufo',x:.35,y:.12,speed:1.1,bob:2,depth:.8,phase:2.7,desktop:true}
  ];
  let effectTime=0,targets=[],signalTargets=[],bursts=[],foreground=[];
  const destroyed=new Map(),signals=new Map();
  function hitTest(x,y){return targets.findLast(t=>Math.abs(x-t.x)<=t.radius&&Math.abs(y-t.y)<=t.radius)||null;}
  function explode(id){
    const target=targets.find(t=>t.id===id);if(!target||destroyed.has(id))return false;
    destroyed.set(id,effectTime+12);
    bursts.push({x:target.x,y:target.y,start:effectTime});targets=targets.filter(t=>t.id!==id);return true;
  }
  function signal(id){if(!signalTargets.some(t=>t.id===id))return false;signals.set(id,effectTime);return true;}
  function drawSignal(ctx,x,y,age,reduced){
    const extension=reduced?3:Math.min(3,Math.floor(age*8));
    ctx.fillStyle='#d5bb81';ctx.fillRect(Math.round(x),Math.round(y)-6-extension,1,extension+2);ctx.fillStyle='#d9edac';ctx.fillRect(Math.round(x)-1,Math.round(y)-8-extension,3,2);
    for(let wave=0;wave<(reduced?1:3);wave++){
      const progress=reduced?.3:(age-wave*.4)/1.8;if(progress<0||progress>1)continue;
      const radius=reduced?10:5+progress*26;ctx.globalAlpha=reduced?.45:(1-progress)*.55;ctx.fillStyle='#a4b8a6';
      for(let point=0;point<48;point++){const angle=point/48*Math.PI*2;ctx.fillRect(Math.round(x+Math.cos(angle)*radius),Math.round(y-7+Math.sin(angle)*radius),1,1);}
    }ctx.globalAlpha=1;
  }
  function draw(ctx,{width,height,time,parallax,mobile,reduced,dt=0,planet}){
    effectTime+=dt;targets=[];signalTargets=[];foreground=[];
    for(const [id,until] of destroyed)if(effectTime>until)destroyed.delete(id);
    const frame=reduced?0:Math.floor(time*3);
    for(const [index,object] of objects.entries()){
      if(mobile&&object.desktop)continue;
      // On phones keep the satellite in the gap between the heading and globe.
      const baseY=mobile&&object.sprite==='satellite'?.41:object.y;
      const baseX=mobile&&object.sprite==='ship'?.89:object.x;
      const baseShipY=mobile&&object.sprite==='ship'?.87:baseY;
      const x=((baseX*width+time*object.speed+24)%(width+48))-24+parallax.x*object.depth;
      const y=baseShipY*height+(reduced?0:Math.sin(time*.18+object.phase)*object.bob)+parallax.y*object.depth;
      const rock=object.sprite==='asteroid'||object.sprite==='smallRock',id='rock-'+index;
      if(rock&&destroyed.has(id))continue;
      if(rock){
        const span=width+48;
        const progress=(((width+24-object.x*width+time*Math.abs(object.speed)*3)%span)+span)%span/span;
        const rockX=width+24-progress*span;
        const rockY=object.y*height+progress*Math.min(span*.28,height*.38);
        const large=object.sprite==='asteroid';
        foreground.push(()=>{paint(ctx,object.sprite,rockX,rockY,.9,frame,large?2:1);if(large)targets.push({id,x:rockX,y:rockY,radius:sprites[object.sprite][0].length});});
      }else{
        paint(ctx,object.sprite,x,y,object.sprite==='station'?.7:.85,frame);
        if(['satellite','probe','station'].includes(object.sprite)){
          const signalId='signal-'+index,start=signals.get(signalId);
          const visible=!planet||(x-planet.CX)**2+(y-planet.CY)**2>(planet.R+3)**2;
          if(visible)signalTargets.push({id:signalId,x,y,label:object.sprite==='station'?'Сигнал со станции':'Сигнал со спутника'});
          if(start!==undefined){const age=effectTime-start;if(age<(reduced?1.1:3))drawSignal(ctx,x,y,age,reduced);else signals.delete(signalId);}
        }
      }
    }
    // Small round meteors always enter from the right and descend diagonally left.
    for(const lane of [0,1]){
      const elapsed=time+(lane===0?3:10),pass=elapsed%17;
      if(reduced||pass>=7.5)continue;
      const progress=pass/7.5,span=width+56,drop=span*Math.tan(Math.PI/6);
      const x=width+28-span*progress,y=height*(lane===0?.08:.56)+progress*drop;
      foreground.push(()=>{
        for(let i=12;i>=0;i--){ctx.globalAlpha=(1-i/14)*.65;ctx.fillStyle=i<3?'#d9edac':i<7?'#86a8b5':'#43667d';ctx.fillRect(Math.round(x+i*2),Math.round(y-i*2*drop/span),1,1);}
        ctx.globalAlpha=1;paint(ctx,'meteor',x,y,1,0);
      });
    }
    // Render these after the globe so its silhouette cannot hide a side pass.
    foreground.push(()=>drawBursts(ctx,reduced));
  }
  function drawBursts(ctx,reduced){
    bursts=bursts.filter(b=>effectTime-b.start<(reduced?.25:.9));
    for(const burst of bursts){
      const age=effectTime-burst.start,life=reduced?.25:.9;
      ctx.globalAlpha=1-age/life;
      for(let i=0;i<(reduced?5:18);i++){
        const angle=i*2.39996,speed=12+(i%5)*7,distance=reduced?3:age*speed;
        const x=burst.x+Math.cos(angle)*distance,y=burst.y+Math.sin(angle)*distance+(reduced?0:age*age*16);
        ctx.fillStyle=['#edf6ce','#d5bb81','#be835d','#668184'][i%4];const size=i%3===0?2:1;ctx.fillRect(Math.round(x),Math.round(y),size,size);
      }
      if(!reduced&&age<.13){ctx.fillStyle='#edf6ce';ctx.fillRect(Math.round(burst.x)-3,Math.round(burst.y)-1,7,3);ctx.fillRect(Math.round(burst.x)-1,Math.round(burst.y)-3,3,7);}
    }
    ctx.globalAlpha=1;
  }
  function drawForeground(){targets=[];for(const paint of foreground)paint();}
  return {draw,drawForeground,hitTest,explode,signal,signalTargets:()=>signalTargets};
})();
