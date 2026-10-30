// 一桿清台的 3D 畫面（three.js）：只負責畫，物理和規則都還在 pool.js 的 2D 桌面座標上算。
// 桌面座標 (x,y) → 3D 世界 (X,0,Z)：X=(x-MX)/100、Z=(y-MY)/100；球心高度 = 球半徑。
(function(){
'use strict';
function make(T,o){ const {W,H,R,TX0,TX1,TY0,TY1,MX,MY,PK,HEAD,FOOT,ballCol,cloth,room}=o,S=100,BR=R/S,PI=Math.PI;
  const wx=x=>(x-MX)/S,wz=y=>(y-MY)/S;
  const cv=document.createElement('canvas'); const r=new T.WebGLRenderer({canvas:cv,antialias:true}); r.setPixelRatio(1); r.setSize(W*2,H*2,false);
  r.shadowMap.enabled=true; r.shadowMap.type=T.PCFSoftShadowMap; if('outputEncoding' in r) r.outputEncoding=T.sRGBEncoding;
  const scene=new T.Scene(),col=c=>new T.Color(c); scene.background=col(room).multiplyScalar(.55); scene.fog=new T.Fog(scene.background,14,30);
  const tex=(w,h,fn,rx,ry)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; fn(c.getContext('2d'),w,h); const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; if(rx) t.repeat.set(rx,ry); t.anisotropy=8; return t; };
  const ph=(c,sh,m)=>new T.MeshPhongMaterial(Object.assign({color:col(c),shininess:sh==null?30:sh,specular:sh>60?0x777777:0x222222},m||{}));
  const add=(geo,mat,x,y,z,p)=>{ const m=new T.Mesh(geo,mat); m.position.set(x||0,y||0,z||0); (p||scene).add(m); return m; };
  /* 燈光：桌子上方一盞長燈（主光，打陰影）＋房間微光 */
  scene.add(new T.HemisphereLight(0xfff4e0,0x201810,.3));
  const sp=new T.SpotLight(0xfff2d8,.95,24,.75,.6,1); sp.position.set(0,7.5,0); sp.target.position.set(0,0,0); sp.castShadow=true; sp.shadow.mapSize.set(2048,2048); sp.shadow.camera.near=3; sp.shadow.camera.far=12; sp.shadow.bias=-.0004; scene.add(sp); scene.add(sp.target);
  for(const x of [-2,2]){ const p=new T.PointLight(0xffe8c8,.12,10); p.position.set(x,4.2,0); scene.add(p); }
  /* 房間：木地板、牆、吊燈 */
  const TH=1.75; // 桌面到地板的高度
  const floor=add(new T.PlaneGeometry(40,40),ph('#ffffff',20,{map:tex(512,512,(c,w,h)=>{ for(let i=0;i<16;i++){ c.fillStyle=['#6a4528','#5e3c22','#73502e','#634024'][i%4]; c.fillRect(0,i*h/16,w,h/16); c.fillStyle='rgba(0,0,0,.25)'; c.fillRect(0,i*h/16,w,2); for(let k=0;k<3;k++){ c.fillRect(((i*173+k*211)%w),i*h/16,2,h/16); } } for(let i=0;i<900;i++){ c.fillStyle='rgba(0,0,0,'+Math.random()*.08+')'; c.fillRect(Math.random()*w,Math.random()*h,8+Math.random()*30,1); } },8,8)}),0,-TH,0); floor.rotation.x=-PI/2; floor.receiveShadow=true;
  const wallM=ph(room,10); for(const [x,z,ry] of [[0,-9,0],[0,9,PI],[-12,0,PI/2],[12,0,-PI/2]]){ const w=add(new T.PlaneGeometry(26,10),wallM,x,3,z); w.rotation.y=ry; }
  const lamp=new T.Group(); lamp.position.set(0,5.6,0); scene.add(lamp);
  add(new T.BoxGeometry(4.6,.28,.9),ph('#1e3a2a',40),0,0,0,lamp); add(new T.BoxGeometry(4.4,.04,.75),new T.MeshBasicMaterial({color:0xfff6d8}),0,-.15,0,lamp);
  for(const x of [-2,2]) add(new T.CylinderGeometry(.015,.015,4,6),ph('#222',20),x,2.1,0,lamp);
  /* 球桌：台呢、台邊橡膠、木框、菱形標記、袋口、桌腳 */
  const L=wx(TX1)-wx(TX0),D=wz(TY1)-wz(TY0),hx=L/2,hz=D/2,clothM=new T.MeshLambertMaterial({color:0xd0d0d0,map:tex(256,256,(c,w,h)=>{ c.fillStyle=cloth; c.fillRect(0,0,w,h); for(let i=0;i<4000;i++){ c.fillStyle=Math.random()<.5?'rgba(255,255,255,.035)':'rgba(0,0,0,.05)'; c.fillRect(Math.random()*w,Math.random()*h,1,1); } },6,3)});
  const bed=add(new T.PlaneGeometry(L+.5,D+.5),clothM,0,0,0); bed.rotation.x=-PI/2; bed.receiveShadow=true;
  { const lm=new T.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.22}); const g=new T.BufferGeometry().setFromPoints([new T.Vector3(wx(HEAD),.002,-hz),new T.Vector3(wx(HEAD),.002,hz)]); scene.add(new T.Line(g,lm)); add(new T.CircleGeometry(.018,12),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5}),wx(FOOT[0]),.002,wz(FOOT[1])).rotation.x=-PI/2; }
  const cushM=ph(new T.Color(cloth).multiplyScalar(.75).getStyle(),8),CH=.11,CW=.16,gap=.32,mg=.2;
  const cush=(x0,z0,x1,z1,nx,nz)=>{ const len=Math.hypot(x1-x0,z1-z0),m=add(new T.BoxGeometry(len,CH,CW),cushM,(x0+x1)/2+nx*CW/2,CH/2,(z0+z1)/2+nz*CW/2); m.rotation.y=-Math.atan2(z1-z0,x1-x0); m.castShadow=m.receiveShadow=true; };
  cush(-hx+gap,-hz,-mg,-hz,0,-1); cush(mg,-hz,hx-gap,-hz,0,-1); cush(-hx+gap,hz,-mg,hz,0,1); cush(mg,hz,hx-gap,hz,0,1); cush(-hx,-hz+gap,-hx,hz-gap,-1,0); cush(hx,-hz+gap,hx,hz-gap,1,0);
  const woodT=tex(512,64,(c,w,h)=>{ const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#8a4e28'); g.addColorStop(1,'#5a2e14'); c.fillStyle=g; c.fillRect(0,0,w,h); c.strokeStyle='rgba(30,10,0,.35)'; for(let i=0;i<22;i++){ c.lineWidth=.6+Math.random(); c.beginPath(); const y=Math.random()*h; c.moveTo(0,y); c.bezierCurveTo(w*.3,y+(Math.random()-.5)*12,w*.7,y+(Math.random()-.5)*12,w,y+(Math.random()-.5)*8); c.stroke(); } },3,1);
  const woodM=ph('#ffffff',35,{map:woodT,specular:0x221a14}),RW=.42,RH=.16,ox=hx+CW,oz=hz+CW;
  for(const [x,z,w,d] of [[0,-oz-RW/2,2*ox+2*RW,RW],[0,oz+RW/2,2*ox+2*RW,RW],[-ox-RW/2,0,RW,2*oz],[ox+RW/2,0,RW,2*oz]]){ const m=add(new T.BoxGeometry(w,RH,d),woodM,x,RH/2-.03,z); m.castShadow=m.receiveShadow=true; }
  const body=add(new T.BoxGeometry(2*ox+2*RW-.1,TH*.42,2*oz+2*RW-.1),ph('#4a2410',30),0,-TH*.21-.05,0); body.castShadow=true;
  for(const sx of [-1,1]) for(const sz of [-1,1]){ const lg=add(new T.CylinderGeometry(.16,.12,TH*.62,12),ph('#3e1e0c',40),sx*(ox+RW-.4),-TH*.69,sz*(oz+RW-.4)); lg.castShadow=true; }
  const dm=new T.MeshBasicMaterial({color:0xf4ecd8}); for(let i=1;i<8;i++){ if(i===4) continue; const x=-ox-RW+(2*ox+2*RW)*i/8; for(const z of [-oz-RW/2,oz+RW/2]) add(new T.CircleGeometry(.03,4),dm,x,RH-.029,z).rotation.x=-PI/2; }
  for(let i=1;i<4;i++){ const z=-oz+(2*oz)*i/4; for(const x of [-ox-RW/2,ox+RW/2]) add(new T.CircleGeometry(.03,4),dm,x,RH-.029,z).rotation.x=-PI/2; }
  const holeM=new T.MeshBasicMaterial({color:0x050404}),leatherM=ph('#2a1810',50);
  for(const p of PK){ const x=wx(p[0]),z=wz(p[1]),rr=p[2]/S*1.05; add(new T.CircleGeometry(rr,24),holeM,x,.004,z).rotation.x=-PI/2; const ring=add(new T.TorusGeometry(rr+.01,.022,6,24),leatherM,x,RH-.04,z); ring.rotation.x=PI/2; ring.scale.z=.45; add(new T.CylinderGeometry(rr+.02,rr*.8,.3,20,1,true),new T.MeshBasicMaterial({color:0x0a0806,side:T.DoubleSide}),x,-.14,z); }
  /* 號碼球：貼圖上有號碼圈（前後各一個），花色球有色帶 */
  const ballTex=n=>tex(256,128,(c,w,h)=>{ const bc=ballCol(n); c.fillStyle=n>8||n===0?'#f6f2e6':bc; c.fillRect(0,0,w,h); if(n>8){ c.fillStyle=bc; c.fillRect(0,h*.28,w,h*.44); }
    if(n===0){ c.fillStyle='#c81e1e'; for(const u of [.25,.75]){ c.beginPath(); c.arc(w*u,h*.5,5,0,7); c.fill(); } return; }
    for(const u of [.25,.75]){ c.fillStyle='#f6f2e6'; c.beginPath(); c.ellipse(w*u,h*.5,19,25,0,0,7); c.fill(); c.fillStyle='#14100c'; c.font='900 '+(n>9?24:28)+'px Arial'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(n),w*u,h*.5+1); if(n===6||n===9){ c.fillRect(w*u-6,h*.5+14,12,2); } } });
  const ballGeo=new T.SphereGeometry(BR,32,20),balls={};
  const ballMesh=n=>{ if(balls[n]) return balls[n]; const m=add(ballGeo,new T.MeshPhongMaterial({map:ballTex(n),shininess:120,specular:0xbbbbbb})); m.castShadow=true; m.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6); m.userData.last=null; return balls[n]=m; };
  /* 球桿 */
  const cue=new T.Group(); scene.add(cue); const CL=3.3,cueParts=[[0,.012,'#3a6ab8',.0165,.0165],[.012,.04,'#f4f0e4',.017,.0175],[.04,.6,'#d8b07a',.0175,.027],[.6,.64,'#1e1e24',.027,.028],[.64,.86,'#2a1a2a',.028,.032],[.86,1,'#5a2a14',.032,.036]];
  for(const [a,b,c2,r0,r1] of cueParts){ const m=add(new T.CylinderGeometry(r0*1.4,r1*1.4,(b-a)*CL,16),ph(c2,90),0,0,0,cue); m.rotation.z=PI/2; m.position.x=-(a+b)/2*CL; m.castShadow=true; }
  /* 瞄準輔助線、鬼球圈、放母球圈 */
  const lineM=new T.LineDashedMaterial({color:0xffffff,dashSize:.06,gapSize:.06,transparent:true,opacity:.75}),aimG=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),aim=new T.Line(aimG,lineM); scene.add(aim);
  const outG=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]),outL=new T.Line(outG,new T.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.8})); scene.add(outL);
  const ghost=add(new T.RingGeometry(BR*.92,BR,32),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,side:T.DoubleSide})); ghost.rotation.x=-PI/2;
  const place=add(new T.RingGeometry(BR+.04,BR+.07,32),new T.MeshBasicMaterial({color:0x5fd068,side:T.DoubleSide})); place.rotation.x=-PI/2;
  /* 鏡頭：俯瞰整張桌（預設）或站在母球後面看（按 V 切換） */
  const cam=new T.PerspectiveCamera(42,W/H,.05,60),camPos=new T.Vector3(0,7,4.6),camLook=new T.Vector3(0,0,.35),camT={p:new T.Vector3(),l:new T.Vector3()};
  let view='top',first=true;
  const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),-BR),tmp=new T.Vector3();
  return {canvas:cv,
    get view(){ return view; }, toggle(){ view=view==='top'?'cue':'top'; },
    toTable(sx,sy){ ray.setFromCamera(new T.Vector2(sx/W*2-1,-(sy/H)*2+1),cam); const p=ray.ray.intersectPlane(plane,tmp); if(!p) return [MX,MY]; return [p.x*S+MX,p.z*S+MY]; },
    toScreen(x,y,h){ tmp.set(wx(x),h==null?BR:h,wz(y)).project(cam); return [(tmp.x+1)/2*W,(1-tmp.y)/2*H]; },
    render(st){ const B=st.B,c0=B[0];
      for(const b of B){ const m=ballMesh(b.n); m.visible=!b.in; if(b.in){ m.userData.last=null; continue; } const x=wx(b.x),z=wz(b.y),l=m.userData.last; m.position.set(x,BR,z);
        if(l){ const dx=x-l[0],dz=z-l[1],d=Math.hypot(dx,dz); if(d>1e-5){ const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(dz/d,0,-dx/d),d/BR); m.quaternion.premultiply(q); } } m.userData.last=[x,z]; }
      // 球桿：從母球後面往後伸，pull 越大離越遠，尾端稍微翹起
      cue.visible=!!st.cue&&!c0.in; if(cue.visible){ const a=st.ang,dx=Math.cos(a),dz=Math.sin(a),back=(R+4+st.pull)/S,tilt=.09; cue.position.set(wx(c0.x)-dx*back,BR+.02,wz(c0.y)-dz*back); cue.rotation.set(0,-a,-tilt); }
      // 瞄準線
      aim.visible=outL.visible=ghost.visible=!!st.aim; if(st.aim){ const A=st.aim; aimG.setFromPoints([new T.Vector3(wx(c0.x),BR*.3,wz(c0.y)),new T.Vector3(wx(A.gx),BR*.3,wz(A.gy))]); aim.computeLineDistances(); ghost.position.set(wx(A.gx),.003,wz(A.gy));
        outL.visible=!!A.hit; if(A.hit){ outG.setFromPoints([new T.Vector3(wx(A.hit.x),BR*.3,wz(A.hit.y)),new T.Vector3(wx(A.hit.x+A.nx*70),BR*.3,wz(A.hit.y+A.ny*70))]); outL.material.color.set(A.legal?0xffffff:0xff5a5a); } }
      place.visible=!!st.place&&!c0.in; if(place.visible){ place.position.set(wx(c0.x),.004,wz(c0.y)); place.material.color.set(st.placeOk?0x5fd068:0xff4d4d); place.scale.setScalar(1+Math.sin(st.t*6)*.06); }
      // 鏡頭
      if(view==='cue'&&!c0.in&&(st.phase==='aim'||st.phase==='place')){ const a=st.ang,dx=Math.cos(a),dz=Math.sin(a),cx=wx(c0.x),cz=wz(c0.y); camT.p.set(cx-dx*2.6,1.15,cz-dz*2.6); camT.l.set(cx+dx*1.6,0,cz+dz*1.6); }
      else { camT.p.set(0,7,4.6); camT.l.set(0,0,.35); }
      if(first){ camPos.copy(camT.p); camLook.copy(camT.l); first=false; } else { camPos.lerp(camT.p,.12); camLook.lerp(camT.l,.12); }
      cam.position.copy(camPos); cam.lookAt(camLook); r.render(scene,cam); },
    destroy(){ scene.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } }); r.dispose(); try{ r.forceContextLoss(); }catch(e){} } }; }
window.__POOL3D=make;
})();
