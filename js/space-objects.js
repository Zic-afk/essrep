/* Hand-drawn pixel sprites. Coordinates and motion use the scene's logical pixels. */
const SpaceObjects = (() => {
  const colors={1:'#344958',2:'#668184',3:'#a4b8a6',4:'#c8d7b3',5:'#43667d',6:'#86a8b5',7:'#d5bb81',8:'#be835d',9:'#d9edac'};
  const sprites={
    asteroid:['00022220000','00223322100','02233332210','02331223221','22311122321','23211233321','12322332110','01223322100','00122211000'],
    smallRock:['0022200','0233220','2311321','2331221','1233210','0122100'],
    satellite:['00000007000000000','00000077000000000','05555003005555000','05665033305665000','05555034305555000','05665033305665000','05555003005555000','00000007000000000','00000000900000000'],
    probe:['0000000040000','0000000434000','0000004333400','0000443333340','0000043333400','0555533333555','0566503330566','0555500300555','0000000300000','0000000900000'],
    ship:['000000022000000','000002233220000','000223344332000','223333444433220','122333344333321','001112333211100','000008777800000','000000898000000'],
    station:['0000000020000000000','0000000232000000000','0555502333200555500','0566502333200566500','0555502333200555500','0000023444320000000','0000233444332000000','0555233444332555500','0566502333200566500','0555500222000555500','0000000020000000000'],
    ufo:['0000033300000','0000344430000','0003444443000','0233333333320','2336666666332','0022333332200','0009009009000']
  };
  function paint(ctx,name,x,y,alpha=1,frame=0){
    const sprite=sprites[name];x=Math.round(x-sprite[0].length/2);y=Math.round(y-sprite.length/2);ctx.globalAlpha=alpha;
    for(let row=0;row<sprite.length;row++)for(let col=0;col<sprite[row].length;col++){
      const pixel=sprite[row][col];if(pixel==='0')continue;
      if(pixel==='9'&&frame%4>1)continue;
      ctx.fillStyle=colors[pixel];ctx.fillRect(x+col,y+row,1,1);
    }
    ctx.globalAlpha=1;
  }
  const objects=[
    {sprite:'asteroid',x:.86,y:.15,speed:-1.4,bob:1.4,depth:1,phase:.3},
    {sprite:'satellite',x:.46,y:.18,speed:.4,bob:2.2,depth:1.5,phase:1.2},
    {sprite:'ship',x:.17,y:.73,speed:2.4,bob:1.2,depth:2,phase:2.4},
    {sprite:'probe',x:.84,y:.35,speed:-.6,bob:2.5,depth:1,phase:.8},
    {sprite:'smallRock',x:.07,y:.57,speed:.8,bob:1.8,depth:1,phase:3.1},
    {sprite:'station',x:.95,y:.23,speed:-.3,bob:1.3,depth:.6,phase:1.8,desktop:true},
    {sprite:'asteroid',x:.38,y:.87,speed:-1.9,bob:1.4,depth:1.5,phase:4.1,desktop:true},
    {sprite:'ufo',x:.35,y:.12,speed:1.1,bob:2,depth:.8,phase:2.7,desktop:true}
  ];
  function draw(ctx,{width,height,time,parallax,mobile,reduced}){
    const frame=reduced?0:Math.floor(time*3);
    for(const object of objects){
      if(mobile&&object.desktop)continue;
      // On phones keep the satellite in the gap between the heading and globe.
      const baseY=mobile&&object.sprite==='satellite'?.39:object.y;
      const baseX=mobile&&object.sprite==='ship'?.89:object.x;
      const baseShipY=mobile&&object.sprite==='ship'?.87:baseY;
      const x=((baseX*width+time*object.speed+24)%(width+48))-24+parallax.x*object.depth;
      const y=baseShipY*height+(reduced?0:Math.sin(time*.18+object.phase)*object.bob)+parallax.y*object.depth;
      paint(ctx,object.sprite,x,y,object.sprite==='station'?.7:.85,frame);
    }
    if(reduced)return;
    // Brief meteor passes, with a stepped trail instead of rotated bitmap art.
    const pass=(time+2)%17;
    if(pass<2.4){
      const progress=pass/2.4,x=width*(.96-progress*.42),y=height*(.09+progress*.13);
      for(let i=12;i>=0;i--){ctx.globalAlpha=(1-i/14)*.65;ctx.fillStyle=i<3?'#d9edac':i<7?'#86a8b5':'#43667d';ctx.fillRect(Math.round(x+i*2),Math.round(y-i),i<2?2:1,1);}
      ctx.globalAlpha=1;ctx.fillStyle='#edf6ce';ctx.fillRect(Math.round(x),Math.round(y),2,2);
    }
  }
  return {draw};
})();
