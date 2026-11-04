/* Live low-resolution world rendering with a moving 2D camera. No captured frames. */
const SolarJourney=(()=>{
  let finish=null,raf=0,layer=null;
  const palette=[[24,68,78],[27,85,91],[35,102,99],[55,122,109],[86,143,113],[125,164,118],[164,187,137]];
  const bodies=[['Меркурий',[130,119,108],8],['Венера',[202,170,113],12],['Земля',[67,123,166],14],['Марс',[176,88,65],10],['Юпитер',[194,157,125],37],['Сатурн',[196,177,129],30],['Уран',[112,176,183],23],['Нептун',[72,110,178],22]];
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;if(layer)layer.remove();layer=null;if(finish){const resolve=finish;finish=null;resolve();}}
  function play(source,options={}){
    stop();return new Promise(resolve=>{
      finish=resolve;layer=document.createElement('div');layer.className='solar-journey';layer.dataset.planets='8';layer.dataset.renderer='pixel-world-camera';layer.setAttribute('role','img');layer.setAttribute('aria-label','Пиксельная солнечная система: Солнце, восемь планет и Giovanna.');
      const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');layer.append(canvas);const caption=document.createElement('div');caption.className='solar-caption';caption.innerHTML='<strong>МИР СТАНОВИТСЯ БОЛЬШЕ</strong><span>Солнце и восемь планет · масштабы условные</span>';layer.append(caption);document.body.append(layer);
      const labels=['Солнце',...bodies.map(body=>body[0]),'Giovanna'].map(name=>{const label=document.createElement('span');label.className='solar-body-label';label.textContent=name;label.setAttribute('aria-hidden','true');layer.append(label);return label;});
      const pixel=innerWidth<750?3:4,w=Math.ceil(innerWidth/pixel),h=Math.ceil(innerHeight/pixel),ctx=canvas.getContext('2d');canvas.width=w;canvas.height=h;ctx.imageSmoothingEnabled=false;
      const geometry=options.geometry||{CX:w*.64,CY:h*.54,R:Math.min(w*.32,h*.39)},angles=[3.8,5.1,.4,2.6,5.8,3.1,1.1,4.4],orbits=[120,180,260,340,490,650,800,960],points=bodies.map((body,i)=>({x:Math.cos(angles[i])*orbits[i],y:Math.sin(angles[i])*orbits[i]*.56})),world={x:points[2].x+120,y:points[2].y-60,r:44};
      const wideZoom=Math.min(w*.43/960,h*.35/(960*.56)),initialZoom=geometry.R/world.r,landing=options.landing||{x:0,y:0};
      const stars=Array.from({length:750},(_,i)=>({x:((i*179.31)%6000)-3000,y:((i*97.71)%4000)-2000,bright:i%11===0}));
      const rocks=Array.from({length:100},(_,i)=>{const a=i*2.39996,r=408+Math.sin(i*19.3)*25;return {x:Math.cos(a)*r,y:Math.sin(a)*r*.56,size:2+(i%4)};}).concat([{x:-850,y:-430,size:14},{x:1070,y:320,size:18},{x:-510,y:600,size:11},{x:1100,y:-480,size:13}]);
      let begin=0,clouds=false;
      const launchDuration=.4,turnAt=3.5,duration=5.8;
      const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
      function draw(now){
        if(!layer)return;if(!begin)begin=now;const t=(now-begin)/1000,out=smooth((t-launchDuration)/(turnAt-launchDuration)),back=Math.max(0,Math.min(1,(t-turnAt)/(duration-turnAt))),travel=back*back;
        const zoom=t<turnAt?initialZoom*Math.pow(wideZoom/initialZoom,out):wideZoom*Math.pow(initialZoom*7/wideZoom,travel);
        const cameraX=t<turnAt?world.x*(1-out)+Math.sin(out*Math.PI)*100:(world.x+landing.x*world.r)*smooth(back)+Math.sin(back*Math.PI)*85;
        const cameraY=t<turnAt?world.y*(1-out)-Math.sin(out*Math.PI)*85:(world.y+landing.y*world.r)*smooth(back)-Math.sin(back*Math.PI)*55;
        const anchorX=t<turnAt?geometry.CX*(1-out)+w*.5*out:w*.5,anchorY=t<turnAt?geometry.CY*(1-out)+h*.46*out:h*.46;
        const angle=Math.sin(Math.PI*Math.min(1,t/duration))*.10,cos=Math.cos(angle),sin=Math.sin(angle);
        const screen=(x,y,depth=1)=>{const dx=x-cameraX*depth,dy=y-cameraY*depth;return {x:Math.round(anchorX+(dx*cos-dy*sin)*zoom),y:Math.round(anchorY+(dx*sin+dy*cos)*zoom)};};
        layer.dataset.stage=t<launchDuration?'launch':t<3.1?'out':t<3.7?'system':'in';layer.dataset.cameraZoom=zoom.toFixed(4);layer.dataset.clouds=String(clouds);layer.dataset.depth='layered';layer.dataset.lighting='sun';
        ctx.fillStyle='#080e19';ctx.fillRect(0,0,w,h);
        for(const star of stars){const p=screen(star.x,star.y,.12);if(p.x<0||p.x>w||p.y<0||p.y>h)continue;ctx.fillStyle=star.bright?'#c7d9bc':'#344855';ctx.fillRect(p.x,p.y,1,1);}
        const reveal=smooth((t-launchDuration)/.65);ctx.globalAlpha=reveal;
        // Objects have world coordinates, so they follow the same camera as the planets.
        layer.dataset.objects='asteroids,satellites,comet';
        for(const [i,rock] of rocks.entries()){const p=screen(rock.x,rock.y,i<100?1:1.45),s=Math.max(1,Math.round(rock.size*zoom));if(p.x<-s*3||p.x>w+s*3||p.y<-s*3||p.y>h+s*3)continue;ctx.fillStyle='#52616d';ctx.fillRect(p.x-s,p.y-s,s*2,s*2);ctx.fillStyle='#82929a';ctx.fillRect(p.x-s,p.y-s,s,Math.max(1,s-1));ctx.fillStyle='#303e4d';ctx.fillRect(p.x,p.y,s,s);}
        function satellite(x,y){const p=screen(x,y),s=Math.max(1,Math.round(4*zoom));if(p.x<-20||p.x>w+20||p.y<-20||p.y>h+20)return;ctx.fillStyle='#34566d';ctx.fillRect(p.x-s*5,p.y-s*2,s*3,s*4);ctx.fillRect(p.x+s*2,p.y-s*2,s*3,s*4);ctx.fillStyle='#99c1c6';ctx.fillRect(p.x-s,p.y-s,s*2,s*2);ctx.fillStyle='#bddfd8';ctx.fillRect(p.x,p.y-s*3,1,s*2);}
        satellite(world.x+220,world.y-180);satellite(-650,230);
        const comet=screen(-1000+t*95,480+t*21),cs=Math.max(1,Math.round(4*zoom));
        if(comet.x>-70&&comet.x<w+70&&comet.y>-40&&comet.y<h+40){for(let i=15;i>0;i--){ctx.fillStyle=i>10?'#253a4a':i>5?'#416475':'#7aa4af';ctx.fillRect(comet.x-i*cs*2,comet.y-i*cs,Math.max(1,cs*(i<5?2:1)),Math.max(1,cs));}ctx.fillStyle='#d6eee4';ctx.fillRect(comet.x-cs,comet.y-cs,cs*2,cs*2);}
        ctx.globalAlpha=reveal*smooth((out-.35)/.55)*(1-smooth(back*2));ctx.fillStyle='#263b50';for(const radius of orbits)for(let a=0;a<Math.PI*2;a+=Math.max(.003,1/Math.max(1,radius*zoom))){const p=screen(Math.cos(a)*radius,Math.sin(a)*radius*.56);if(p.x>=0&&p.x<w&&p.y>=0&&p.y<h)ctx.fillRect(p.x,p.y,1,1);}ctx.globalAlpha=reveal;
        function planet(x,y,r,color,index){
          const p=screen(x,y),radius=Math.max(1,Math.round(r*zoom));if(p.x+radius<0||p.x-radius>w||p.y+radius<0||p.y-radius>h)return;
          const sunDirection=screen(0,0),distance=Math.max(1,Math.hypot(sunDirection.x-p.x,sunDirection.y-p.y)),sunX=(sunDirection.x-p.x)/distance,sunY=-(sunDirection.y-p.y)/distance,lighting=smooth(out);
          for(let py=Math.max(-radius,-p.y);py<=Math.min(radius,h-p.y);py++)for(let px=Math.max(-radius,-p.x);px<=Math.min(radius,w-p.x);px++){
            const nx=px/radius,ny=-py/radius,d=nx*nx+ny*ny;if(d>1)continue;const nz=Math.sqrt(1-d),light=nx*(-.45*(1-lighting)+sunX*.85*lighting)+ny*(.6*(1-lighting)+sunY*.85*lighting)+nz*(.65-.3*lighting),shade=index===-1?1.05:light>.8?1.1:light>.5?.9:light>.23?.7:.36;let c=color;
            if(index===9){const ct=Math.cos(.27),st=Math.sin(.27),wy=ny*ct+nz*st,wz=-ny*st+nz*ct,u=Math.atan2(nx,wz)-(options.rotation||0)-t*.055,v=Math.acos(Math.max(-1,Math.min(1,wy))),n=Math.sin(u*3+Math.sin(v*5)*1.3)+.55*Math.cos(u*7-v*8)+.26*Math.sin(u*13+v*17)+.14*Math.cos(u*29-v*31);c=palette[n>.9?5:n>.5?4:n>.1?3:n>-.3?2:n>-.8?1:0];}
            else{const band=Math.sin((ny+index*.1)*17+t*.08)+Math.cos(nx*13+ny*7);c=color.map(value=>value+(band>.6?17:band<-.6?-15:0));}
            ctx.fillStyle=`rgb(${c.map(v=>Math.max(0,Math.min(255,Math.round(v*shade)))).join(',')})`;ctx.fillRect(p.x+px,p.y+py,1,1);
          }
          if(index===9){ctx.strokeStyle='#77b6ba';for(let a=0;a<6.284;a+=1/Math.max(1,radius)){const qx=Math.round(p.x+Math.cos(a)*(radius+1)),qy=Math.round(p.y+Math.sin(a)*(radius+1));ctx.fillStyle='#91c3ac';ctx.fillRect(qx,qy,1,1);}}
        }
        // The Sun and every planet use the same pixel raster as Giovanna.
        const sun=screen(0,0),sr=Math.max(1,Math.round(55*zoom));ctx.fillStyle='#725028';for(let y=Math.max(-sr*2,-sun.y);y<=Math.min(sr*2,h-sun.y);y++)for(let x=Math.max(-sr*2,-sun.x);x<=Math.min(sr*2,w-sun.x);x++){const d=x*x+y*y;if(d>sr*sr&&d<sr*sr*3&&(x+y)%4===0)ctx.fillRect(sun.x+x,sun.y+y,1,1);}planet(0,0,55,[255,190,82],-1);
        bodies.forEach((body,i)=>{const pos=points[i];planet(pos.x,pos.y,body[2],body[1],i);if(i===5){const center=screen(pos.x,pos.y),rx=Math.max(2,body[2]*zoom*1.8);ctx.fillStyle='#cbbf99';for(let a=0;a<6.284;a+=1/rx)ctx.fillRect(Math.round(center.x+Math.cos(a)*rx),Math.round(center.y+Math.sin(a)*rx*.3-Math.cos(a)*rx*.22),1,1);}});
        ctx.globalAlpha=1;planet(world.x,world.y,world.r,[35,102,99],9);
        // A fleeting navigational trace forms a G at the widest point.
        const routeAlpha=smooth((t-2.5)/.6)*(1-smooth((t-3.7)/.45));ctx.globalAlpha=routeAlpha*.65;ctx.fillStyle='#92bbad';const route=[];for(let a=.15;a<5.7;a+=.08)route.push(screen(Math.cos(a)*740,Math.sin(a)*740*.48));for(let y=-234;y<=0;y+=14)route.push(screen(617,y));for(let x=617;x>=150;x-=14)route.push(screen(x,0));for(let i=0;i<route.length;i++){const p=route[i];if(i%3===0)ctx.fillRect(p.x,p.y,1,1);}ctx.globalAlpha=1;
        // Lock on to the actual selected beacon, rather than the planet centre.
        const destination=screen(world.x+landing.x*world.r,world.y+landing.y*world.r);
        if(back>.08){const alpha=Math.min(1,back*3)*(1-smooth((back-.66)/.22));ctx.globalAlpha=alpha;ctx.fillStyle='#cce8c1';const rr=4;for(let a=0;a<6.284;a+=.12)ctx.fillRect(Math.round(destination.x+Math.cos(a)*rr),Math.round(destination.y+Math.sin(a)*rr),1,1);if(back>.08){for(const dx of [-1,1])for(const dy of [-1,1]){ctx.fillRect(destination.x+dx*9,destination.y+dy*9,dx*4,1);ctx.fillRect(destination.x+dx*9,destination.y+dy*9,1,dy*4);}}ctx.globalAlpha=1;}
        // A close satellite crosses the frame during the return, adding foreground scale.
        if(back>.15&&back<.65){const pass=(back-.15)/.5,s=2+Math.round(Math.sin(pass*Math.PI)*2),x=Math.round(w*(1.2-pass*1.5)),y=Math.round(h*(.25+pass*.4));ctx.fillStyle='#284557';ctx.fillRect(x-s*6,y-s*2,s*4,s*4);ctx.fillRect(x+s*2,y-s*2,s*4,s*4);ctx.fillStyle='#a6c8c8';ctx.fillRect(x-s,y-s,s*2,s*2);}
        labels.forEach((label,i)=>{label.hidden=zoom>=wideZoom*1.9;label.style.opacity=String(smooth((out-.65)/.35)*(1-smooth(back*3)));const object=i===0?{x:0,y:0,r:55}:i===9?world:{...points[i-1],r:bodies[i-1][2]},p=screen(object.x,object.y);label.style.left=Math.round(p.x*pixel)+'px';label.style.top=Math.round((p.y+object.r*zoom)*pixel+7)+'px';});
        caption.style.opacity=String(smooth((t-.4)/.8)*(1-smooth(back*2)));
        if(t<launchDuration){caption.firstElementChild.textContent='GIOVANNA / МАРШРУТ ПОСТРОЕН';caption.style.opacity=String(1-smooth(t/launchDuration));}else if(back>.05){caption.firstElementChild.textContent='ВОЗВРАЩАЕМСЯ К ИСТОЧНИКУ';}else caption.firstElementChild.textContent='МИР СТАНОВИТСЯ БОЛЬШЕ';
        if(t>=duration-.85&&!clouds){clouds=true;if(options.onClouds)options.onClouds();}
        if(t>=duration){stop();return;}raf=requestAnimationFrame(draw);
      }raf=requestAnimationFrame(draw);
    });
  }
  return {play,stop};
})();
