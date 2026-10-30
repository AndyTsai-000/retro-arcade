// 保齡球大賽的 3D 畫面（three.js）：只負責畫，物理還在 bowl.js 的球道座標上算。
// 球道座標 x（左右，球道半寬 LW）、y（往前，0 是犯規線）、z（高度）→ 3D 世界 (x, z, y) 都除以 40。
(function(){
'use strict';
function make(T,o){ const {W,H,LW,PINY,BR,PITCH,SPOTS,HALL,L}=o,K=40,PI=Math.PI,pal=HALL[L.bg]||HALL.alley,laneCol=L.lane||'#d9a45c';
  const X=x=>x/K,Z=y=>y/K;
  const cv=document.createElement('canvas'),r=new T.WebGLRenderer({canvas:cv,antialias:true}); r.setPixelRatio(1); r.setSize(W*2,H*2,false); r.shadowMap.enabled=true; r.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene(),col=c=>new T.Color(c); scene.background=col(pal.ceil); scene.fog=new T.Fog(col(pal.wall),30,70);
  const tex=(w,h,fn,rx,ry)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; fn(c.getContext('2d'),w,h); const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; if(rx) t.repeat.set(rx,ry); t.anisotropy=8; return t; };
  const ph=(c,sh,m)=>new T.MeshPhongMaterial(Object.assign({color:col(c),shininess:sh==null?30:sh,specular:sh>60?0x888888:0x222222},m||{}));
  const add=(geo,mat,x,y,z,p)=>{ const m=new T.Mesh(geo,mat); m.position.set(x||0,y||0,z||0); (p||scene).add(m); return m; };
  const day=L.bg==='day';
  scene.add(new T.HemisphereLight(day?0xffffff:0xd8d0ff,0x302830,day?.75:.5));
  const sun=new T.DirectionalLight(0xfff4e0,day?.7:.6); sun.position.set(3,14,6); sun.target.position.set(0,0,10); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); const sc=sun.shadow.camera; sc.left=-3; sc.right=3; sc.top=12; sc.bottom=-12; sc.near=1; sc.far=40; sun.shadow.bias=-.0005; scene.add(sun); scene.add(sun.target);
  const pinLight=new T.PointLight(0xfff6e0,.9,12); pinLight.position.set(0,2.2,Z(PINY)-1); scene.add(pinLight);
  /* 球道：木板紋、前段油光、瞄準箭頭、助走點、犯規線、球瓶區 */
  const y1=PINY+56,len=Z(y1)+2,laneT=tex(128,2048,(c,w,h)=>{ c.fillStyle=laneCol; c.fillRect(0,0,w,h); for(let i=0;i<13;i++){ c.fillStyle='rgba(0,0,0,'+(.03+((i*7)%5)*.012)+')'; c.fillRect(i*w/13,0,w/13,h); c.fillStyle='rgba(0,0,0,.16)'; c.fillRect(i*w/13,0,1,h); }
      for(let i=0;i<600;i++){ c.fillStyle='rgba(60,30,10,'+Math.random()*.06+')'; c.fillRect(Math.random()*w,Math.random()*h,1,10+Math.random()*60); }
      const yy=v=>h-(v+60)/(y1+60)*h; c.fillStyle='rgba(255,255,255,.08)'; c.fillRect(w*.2,yy(430),w*.6,yy(0)-yy(430));
      c.fillStyle='#7a4a1f'; for(let i=-3;i<=3;i++){ const y=yy(180-Math.abs(i)*12),x=w/2+i*5/(2*LW)*w; c.beginPath(); c.moveTo(x,y); c.lineTo(x-3,y+22); c.lineTo(x+3,y+22); c.fill(); }
      c.fillStyle='rgba(20,18,43,.55)'; for(const v of [-14,-38]) for(const xx of [-15,-9,-3,3,9,15]){ c.beginPath(); c.arc(w/2+xx/(2*LW)*w,yy(v),2,0,7); c.fill(); }
      c.fillStyle='#14122b'; c.fillRect(0,yy(0)-3,w,4); c.fillStyle='rgba(255,255,255,.18)'; c.fillRect(0,yy(y1),w,yy(PINY-14)-yy(y1)); });
  const laneM=ph('#ffffff',60,{map:laneT,specular:0x2a2a2a}),gutM=ph(pal.gutter,40),capM=ph(pal.cap,20),apprM=ph(new T.Color(laneCol).multiplyScalar(.82).getStyle(),40);
  const lw=X(LW)*2,gw=X(7),gy=-.12;
  for(let k=-5;k<=5;k++){ const ox=X(k*PITCH),cz=(Z(y1)+Z(-60))/2,ll=Z(y1)-Z(-60);
    const lane=add(new T.PlaneGeometry(lw,ll),laneM,ox,0,cz); lane.rotation.set(-PI/2,0,PI); lane.receiveShadow=true;
    for(const s of [-1,1]){ const g=add(new T.CylinderGeometry(gw/2,gw/2,Z(y1),16,1,true,0,PI),gutM,ox+s*(lw/2+gw/2),0,Z(y1)/2); g.rotation.order='ZYX'; g.rotation.set(PI/2,0,-PI/2); g.material.side=T.DoubleSide; g.receiveShadow=true; }
    const cap=add(new T.BoxGeometry(X(PITCH)-lw-gw*2,.06,Z(y1)+2),capM,ox+X(PITCH)/2,.02,Z(y1)/2-1); cap.receiveShadow=true;
    add(new T.BoxGeometry(lw+gw*2,.02,3),apprM,ox,-.005,-1.5).receiveShadow=true; }
  const floor=add(new T.PlaneGeometry(60,30),ph(pal.cap,20),0,-.03,-14); floor.rotation.x=-PI/2;
  /* 後面：黑色球坑、置瓶機遮板（球道號碼）、霓虹招牌 */
  add(new T.BoxGeometry(X(11*PITCH),1.2,.5),new T.MeshBasicMaterial({color:0x07060f}),0,.5,Z(y1)+.25);
  const maskT=tex(2048,128,(c,w,h)=>{ const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,pal.mask[0]); g.addColorStop(1,pal.mask[1]); c.fillStyle=g; c.fillRect(0,0,w,h);
      c.fillStyle=pal.neon; c.fillRect(0,0,w,5); c.fillRect(0,h-5,w,5); c.font='900 54px Arial'; c.textAlign='center'; c.textBaseline='middle';
      for(let k=-5;k<=5;k++){ const x=w/2+k*w/11; c.fillStyle=k?'rgba(255,255,255,.6)':pal.num; c.fillText(String(7+k),x,h/2+3); c.fillStyle='rgba(0,0,0,.35)'; c.fillRect(x+w/22-1,0,2,h); } });
  add(new T.PlaneGeometry(X(11*PITCH),X(30)),new T.MeshBasicMaterial({map:maskT}),0,X(39),Z(PINY-18)).rotation.y=PI;
  const signT=tex(512,96,(c,w,h)=>{ c.font='900 64px Arial'; c.textAlign='center'; c.textBaseline='middle'; c.shadowColor=pal.sign; c.shadowBlur=18; c.fillStyle=pal.sign; c.fillText('BOWLING',w/2,h/2+4); });
  const sign=add(new T.PlaneGeometry(4,.75),new T.MeshBasicMaterial({map:signT,transparent:true}),0,X(92),Z(y1+40)); sign.rotation.y=PI;
  const wall=add(new T.PlaneGeometry(60,8),ph(pal.wall,10),0,3.5,Z(y1+60)); wall.rotation.y=PI;
  /* 天花板的燈 */
  const lampM=new T.MeshBasicMaterial({color:col(pal.light)}); for(let y=0;y<PINY-30;y+=100) for(let k=-5;k<=5;k++) add(new T.BoxGeometry(.5,.03,.12),lampM,X(k*PITCH),X(118),Z(y));
  const ceil=add(new T.PlaneGeometry(60,30),ph(pal.ceil,5),0,X(122),12); ceil.rotation.x=PI/2;
  /* 球瓶：旋轉曲面，脖子有兩條紅線 */
  const pp=[[0,0],[1.1,0],[1.9,.8],[2.45,3],[2.4,5.5],[1.6,8.4],[1.0,10.2],[1.05,11.6],[1.45,13],[1.35,14.3],[.8,15],[0,15.2]].map(q=>new T.Vector2(X(q[0]),X(q[1])));
  const pinT=tex(64,256,(c,w,h)=>{ c.fillStyle='#f6f6f2'; c.fillRect(0,0,w,h); c.fillStyle='#d8261c'; const v=y=>h-y/15.2*h; c.fillRect(0,v(11.6),w,7); c.fillRect(0,v(10.6),w,4); });
  const pinGeo=new T.LatheGeometry(pp,24),pinM=new T.MeshPhongMaterial({map:pinT,shininess:110,specular:0xcccccc}),pinH=X(15.2);
  const mkPin=()=>{ const g=new T.Group(),m=new T.Mesh(pinGeo,pinM); m.castShadow=true; g.add(m); scene.add(g); return g; };
  for(let k=-5;k<=5;k++){ if(!k) continue; for(const sp of SPOTS){ const p=mkPin(); p.position.set(X(k*PITCH+sp[0]),0,Z(sp[1])); } }
  const pins=SPOTS.map(()=>mkPin());
  /* 球：顏色、三個指孔，飛碟球加一圈光 */
  const ballGeo=new T.SphereGeometry(X(BR),32,24),ballT=tex(256,128,(c,w,h)=>{ c.fillStyle='#ffffff'; c.fillRect(0,0,w,h); for(let i=0;i<60;i++){ c.fillStyle='rgba(255,255,255,'+(.1+Math.random()*.2)+')'; c.beginPath(); c.arc(Math.random()*w,Math.random()*h,2+Math.random()*10,0,7); c.fill(); } c.fillStyle='rgba(0,0,0,.25)'; for(let i=0;i<30;i++){ c.beginPath(); c.arc(Math.random()*w,Math.random()*h,1+Math.random()*4,0,7); c.fill(); }
      c.fillStyle='#15121c'; for(const [u,v,rr] of [[.5,.35,7],[.46,.55,6],[.54,.55,6]]){ c.beginPath(); c.ellipse(u*w,v*h,rr,rr*1.6,0,0,7); c.fill(); } });
  const ballM=new T.MeshPhongMaterial({map:ballT,shininess:140,specular:0xffffff}),ball=add(ballGeo,ballM); ball.castShadow=true;
  const ufoRing=add(new T.TorusGeometry(X(BR)*1.5,.008,6,40),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.5}),0,0,0); ufoRing.rotation.x=PI/2;
  const pathM=new T.LineDashedMaterial({color:0xff3b3b,dashSize:.25,gapSize:.2,transparent:true,opacity:.85}),pathG=new T.BufferGeometry(),path=new T.Line(pathG,pathM); scene.add(path);
  /* 鏡頭：和原本 2D 一樣在投球的人後上方，跟著球往前推 */
  const cam=new T.PerspectiveCamera(33,W/H,.05,90),tmp=new T.Vector3(); let lastB=null;
  return {canvas:cv,
    toScreen(x,y,z){ tmp.set(X(x),X(z||0),Z(y)).project(cam); return [(tmp.x+1)/2*W,(1-tmp.y)/2*H,1]; },
    render(s){ const camY=s.camY;
      cam.position.set(0,X(30),Z(camY-105)); cam.lookAt(0,X(30)-.104*4,Z(camY-105)+4);
      // 球瓶
      s.pins.forEach((p,i)=>{ const g=pins[i]; g.visible=!p.out; if(p.out) return; g.position.set(X(p.x),0,Z(p.y)); if(p.down){ g.rotation.set(0,p.rot+p.i,PI/2); g.position.y=X(2.3); } else g.rotation.set(0,0,0); });
      // 球
      const b=s.ball; ballM.color.set(s.col); ball.visible=!b||!b.done; const bx=b?b.x:s.pos,by=b?b.y:-6,gut=b&&b.gutter; ball.position.set(X(bx),X(BR)-(gut?.08:0),Z(by));
      if(b&&lastB){ const dz=Z(by)-lastB[1],dx=X(bx)-lastB[0],d=Math.hypot(dx,dz); if(d>1e-5&&!b.ufo){ ball.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(dz/d,0,-dx/d),d/X(BR))); } } lastB=b?[X(bx),Z(by)]:null;
      const ufo=b?b.ufo:s.ufo; if(ufo&&b&&!b.done){ ball.rotation.set(0,b.spinA,0); } ufoRing.visible=!!(ufo&&b&&!b.done); ufoRing.position.copy(ball.position); ufoRing.position.y=X(BR)*.9;
      // 路徑預覽
      path.visible=!!s.path; if(s.path){ pathG.setFromPoints(s.path.map(q=>new T.Vector3(X(q[0]),.01,Z(q[1])))); path.computeLineDistances(); }
      r.render(scene,cam); },
    destroy(){ scene.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } }); r.dispose(); try{ r.forceContextLoss(); }catch(e){} } }; }
window.__BOWL3D=make;
})();
