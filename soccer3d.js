// 鬥魂足球的 3D 畫面（three.js）：比賽照舊在 soccer.js 的 2D 座標上算，這裡只負責畫。
// 換算：場地 x 40～860（40 公尺）、y 152～264（12 公尺）；球門 56 像素寬、40 像素高（2.44 公尺）。人物用 h3d.js 的寫實人物。
(function(){
'use strict';
function make(T,o){ const {W,H,FW,X0,X1,YB,YF,GY0,GY1,cols,bgKey}=o,PI=Math.PI,H3=window.__H3D;
  const SX=(X1-X0)/40,SY=(YF-YB)/12,CX=(X0+X1)/2,CY=(YB+YF)/2,X=x=>(x-CX)/SX,Z=y=>(y-CY)/SY,ZS=2.44/40;
  const cv=document.createElement('canvas'),r=new T.WebGLRenderer({canvas:cv,antialias:true}); r.setPixelRatio(1); r.setSize(W*2,H*2,false); r.shadowMap.enabled=true; r.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene(),col=c=>new T.Color(c),night=bgKey==='night';
  const ph=(c,sh,m)=>new T.MeshPhongMaterial(Object.assign({color:col(c),shininess:sh==null?20:sh,specular:sh>50?0x666666:0x1a1a1a},m||{}));
  const add=(geo,mat,x,y,z,p)=>{ const m=new T.Mesh(geo,mat); m.position.set(x||0,y||0,z||0); (p||scene).add(m); m.castShadow=true; m.receiveShadow=true; return m; };
  scene.background=col(night?'#0e0e30':bgKey==='beach'?'#7ec8f2':'#8fd3ff');
  scene.add(new T.HemisphereLight(night?0x9aa0ff:0xfff8e8,night?0x281e28:0x5a7050,night?.45:.55));
  const sun=new T.DirectionalLight(night?0xfff0d8:0xfff4e0,night?.75:.7); sun.position.set(-8,18,10); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-16,right:16,top:12,bottom:-12,near:1,far:60}); sun.shadow.bias=-.0006; scene.add(sun); scene.add(sun.target);
  if(night) for(const x of [-18,0,18]){ const L=new T.PointLight(0xfff0d0,.35,50); L.position.set(x,12,6); scene.add(L); }
  /* 草地：條紋修剪紋＋白線（禁區、中圈） */
  const PAD=60,cw=4096,G0=X0-PAD*2,G1=X1+PAD*2,GYa=YB-40,GYb=YF+40,k=cw/(G1-G0),fc=document.createElement('canvas'); fc.width=cw; fc.height=Math.round((GYb-GYa)*k*SX/SY);
  const ky=fc.height/(GYb-GYa);
  { const c=fc.getContext('2d'),U=x=>(x-G0)*k,V=y=>(y-GYa)*ky; c.fillStyle=o.grass; c.fillRect(0,0,cw,fc.height);
    for(let i=0;i*60<G1-G0;i++){ if(i%2) continue; c.fillStyle='rgba(255,255,255,.07)'; c.fillRect(U(G0+i*60),0,60*k,fc.height); }
    for(let i=0;i<40000;i++){ c.fillStyle=i%3?'rgba(0,0,0,.05)':'rgba(255,255,255,.05)'; c.fillRect((i*137.7)%cw,(i*53.3)%fc.height,2,3); }
    c.strokeStyle='rgba(255,255,255,.92)'; c.lineWidth=5; c.strokeRect(U(X0),V(YB),U(X1)-U(X0),V(YF)-V(YB)); c.beginPath(); c.moveTo(U(CX),V(YB)); c.lineTo(U(CX),V(YF)); c.stroke();
    c.beginPath(); c.ellipse(U(CX),V(CY),3*SX*k,3*SX*k,0,0,7); c.stroke(); c.fillStyle='#fff'; c.beginPath(); c.arc(U(CX),V(CY),6,0,7); c.fill();
    for(const [a,d] of [[X0,1],[X1,-1]]){ c.strokeRect(Math.min(U(a),U(a+d*90)),V(GY0-22),90*k,V(GY1+22)-V(GY0-22)); c.strokeRect(Math.min(U(a),U(a+d*34)),V(GY0-6),34*k,V(GY1+6)-V(GY0-6)); } }
  const ftx=new T.CanvasTexture(fc); ftx.anisotropy=8;
  const fl=add(new T.PlaneGeometry((G1-G0)/SX,(GYb-GYa)/SY),new T.MeshLambertMaterial({map:ftx}),X((G0+G1)/2),0,Z((GYa+GYb)/2)); fl.rotation.x=-PI/2; fl.castShadow=false;
  const outer=add(new T.PlaneGeometry(300,200),new T.MeshLambertMaterial({color:col(o.grass).multiplyScalar(.8)}),0,-.01,0); outer.rotation.x=-PI/2; outer.castShadow=false;
  /* 背景牆：原本的看台、觀眾、廣告看板 */
  const bc=document.createElement('canvas'); bc.width=FW*2; bc.height=288; const btx=new T.CanvasTexture(bc),BW=FW/SX,BH=BW*144/FW*1.7,BZ=Z(YB)-7;
  btx.wrapS=T.RepeatWrapping; btx.repeat.set(1.6,1); const back=add(new T.PlaneGeometry(BW*1.6,BH),new T.MeshBasicMaterial({map:btx}),X(FW/2),BH/2-1.6,BZ); back.castShadow=back.receiveShadow=false;
  const drawBack=t=>{ const c=bc.getContext('2d'); c.save(); c.scale(2,2); o.bg(c,0,t); c.translate(W-40,0); o.bg(c,W-40,t); c.restore(); btx.needsUpdate=true; }; drawBack(0);
  /* 球門 */
  const post=ph('#ffffff',70),netM=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.35,side:T.DoubleSide,wireframe:true,depthWrite:false});
  for(const [gx,d] of [[X0,-1],[X1,1]]){ const x=X(gx),z0=Z(GY0),z1=Z(GY1),hh=2.44,dep=1.4,mz=(z0+z1)/2,wd=z1-z0;
    for(const z of [z0,z1]) add(new T.CylinderGeometry(.07,.07,hh,12),post,x,hh/2,z); const bar=add(new T.CylinderGeometry(.07,.07,wd,12),post,x,hh,mz); bar.rotation.x=PI/2;
    const nb=new T.Mesh(new T.BoxGeometry(dep,hh,wd,6,8,12),netM); nb.position.set(x+d*dep/2,hh/2,mz); scene.add(nb);
    for(const z of [z0,z1]) add(new T.CylinderGeometry(.03,.03,dep*1.2,6),post,x+d*dep/2,.03,z).rotation.z=PI/2; }
  /* 角旗 */ for(const [x,y] of [[X0,YB],[X0,YF],[X1,YB],[X1,YF]]){ add(new T.CylinderGeometry(.025,.025,1.5,6),ph('#f4f4f4',30),X(x),.75,Z(y)); const f=add(new T.PlaneGeometry(.35,.25),ph('#ff3b3b',10,{side:T.DoubleSide}),X(x)+.17,1.35,Z(y)); f.castShadow=false; }
  /* 球：白底黑色五角形 */
  const bcv=document.createElement('canvas'); bcv.width=256; bcv.height=128; { const c=bcv.getContext('2d'); c.fillStyle=o.ballCol||'#ffffff'; c.fillRect(0,0,256,128); c.fillStyle='#1a1a22'; for(const [x,y] of [[32,30],[96,64],[160,30],[224,64],[32,98],[160,98]]){ c.beginPath(); for(let i=0;i<5;i++){ const a=-PI/2+i/5*PI*2; c.lineTo(x+Math.cos(a)*16,y+Math.sin(a)*16); } c.fill(); } }
  const ball=add(new T.SphereGeometry(.13,24,16),new T.MeshPhongMaterial({map:new T.CanvasTexture(bcv),shininess:40,specular:0x333333}),0,.13,0); const bglow=add(new T.SphereGeometry(.3,16,12),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}),0,0,0); bglow.castShadow=bglow.receiveShadow=false;
  /* 球員 */
  const HAIR=['#2a1a10','#1a1418','#7a3b1d','#3a2418'];
  const HP=o.players.map((p,i)=>{ const sh=p.gk?(p.team?'#f2d24a':'#3a3a4a'):cols[p.team],h=H3.build(T,{skin:'#e8b890',shirt:sh,pants:p.gk?'#2a2a30':'#f4f4f4',shoes:'#1a1a22',hair:HAIR[(+p.hair||0)%4],shorts:true,number:p.gk?1:(i%5)+2,numCol:p.gk?'#ffffff':'#ffffff',socks:sh,socksHigh:true});
    for(const hp of [h.J.hipL,h.J.hipR]) add(new T.CylinderGeometry(.1,.095,.28,12).translate(0,-.14,0),ph(p.gk?'#2a2a30':'#f4f4f4',8),0,0,0,hp);
    if(p.gk) for(const hd of [h.J.hdL,h.J.hdR]) if(hd) add(new T.SphereGeometry(.07,10,8),ph('#ffffff',20),0,-.04,0,hd);
    const wrap=new T.Group(); wrap.add(h.root); scene.add(wrap); return {h,wrap,cur:null,ang:p.team?-PI/2:PI/2,lx:null,ly:0,spd:0,fall:0}; });
  const rings=['#ffd23f','#3ddbd9'].map(c=>{ const g=add(new T.RingGeometry(.4,.5,32),new T.MeshBasicMaterial({color:col(c),transparent:true,opacity:.9,depthWrite:false}),0,.02,0); g.rotation.x=-PI/2; g.castShadow=g.receiveShadow=false; g.visible=false; return g; });
  function poseOf(k,t,i,kick){ const s=Math.sin(t*11+i),cc=Math.cos(t*11+i);
    if(k===1) return {y:-.05-Math.abs(cc)*.035,spine:[.22,0,0],neck:[-.12,0,0],hipL:[-.75*s-.12,0,.03],hipR:[.75*s-.12,0,-.03],knL:[.3+1*Math.max(0,Math.sin(t*11+i-1.4)),0,0],knR:[.3+1*Math.max(0,Math.sin(t*11+i+PI-1.4)),0,0],shL:[.6*s,0,.12],shR:[-.6*s,0,-.12],elL:[-1.2,0,0],elR:[-1.2,0,0]};
    if(k===2){ const u=kick; return {y:-.04,spine:[-.1,0,0],neck:[-.1,0,0],hipR:[-1.3+u*.6,0,-.05],knR:[.2+u*1.3,0,0],hipL:[.1,0,.06],knL:[.25,0,0],shL:[-1.0,0,.7],shR:[.5,0,-.5],elL:[-.3,0,0],elR:[-.3,0,0]}; }
    if(k===4) return {y:-.7,spine:[-.4,0,0],neck:[.3,0,0],hipR:[-1.5,0,-.05],knR:[.1,0,0],hipL:[-.6,0,.1],knL:[1.4,0,0],shL:[.6,0,.9],shR:[.6,0,-.9],elL:[-.4,0,0],elR:[-.4,0,0]};
    const br=Math.sin(t*2.4+i)*.02; return {y:-.05,spine:[.1+br,0,0],hipL:[-.18,0,.1],hipR:[-.18,0,-.1],knL:[.3,0,0],knR:[.3,0,0],anL:[-.12,0,-.06],anR:[-.12,0,.06],shL:[-.1,0,.2],shR:[-.1,0,-.2],elL:[-.6,0,0],elR:[-.6,0,0]}; }
  const cam=new T.PerspectiveCamera(46,W/H,.1,300),tmp=new T.Vector3(); let lastT=null,frame=0,cx=null,prevB=null;
  function render(st){ const {P,b,t,camX}=st,dt=lastT==null?.016:Math.min(.1,Math.max(0,t-lastT)); lastT=t; frame++; if(frame%6===1) drawBack(t);
    P.forEach((p,i)=>{ const E=HP[i]; if(E.lx==null){ E.lx=p.x; E.ly=p.y; } const vx=(p.x-E.lx)/(dt||.016),vy=(p.y-E.ly)/(dt||.016); E.lx=p.x; E.ly=p.y; E.spd+=(Math.hypot(vx,vy)-E.spd)*Math.min(1,dt*10);
      const k=p.state===4||p.slideT>0?4:p.kickT>0?2:p.moving?1:0;
      let ta=p.face>0?PI/2:-PI/2; if((k===1||k===4)&&E.spd>20) ta=Math.atan2(vx/SX,vy/SY); let da=ta-E.ang; while(da>PI) da-=PI*2; while(da<-PI) da+=PI*2; E.ang+=da*Math.min(1,dt*12);
      const tg=poseOf(k,t,i,Math.min(1,(p.kickT||0)*5)); E.cur=E.cur?H3.mix(E.cur,tg,Math.min(1,dt*16)):tg; H3.pose(E.h.J,E.cur);
      E.fall+=((p.state===4?1:0)-E.fall)*Math.min(1,dt*8); E.h.root.rotation.x=-E.fall*1.4;
      E.wrap.position.set(X(p.x),p.z*ZS*.6,Z(p.y)); E.wrap.rotation.y=E.ang; });
    rings.forEach(g=>g.visible=false); (st.ctrl||[]).forEach((id,k2)=>{ if(id==null) return; const g=rings[k2],p=P[id]; if(!g||!p) return; g.visible=true; g.position.set(X(p.x),.02,Z(p.y)); });
    const bx=X(b.x),by=Math.max(.13,b.z*ZS+.13),bz=Z(b.y+(b.type==='ghost'?b.ghost:0)); ball.position.set(bx,by,bz);
    if(prevB){ const d=Math.hypot(bx-prevB[0],bz-prevB[1]); ball.rotation.z-=d/.13*Math.sign((bx-prevB[0])||1); ball.rotation.x+=(bz-prevB[1])/.13; } prevB=[bx,bz];
    bglow.position.copy(ball.position); bglow.material.opacity=b.type?.4+Math.sin(t*30)*.2:0; if(b.type&&st.shotCol) bglow.material.color.set(st.shotCol);
    const fx=X(camX+W/2); if(cx==null) cx=fx; cx+=(fx-cx)*Math.min(1,dt*4); cam.position.set(cx,10.8,15.4); cam.lookAt(cx,0,-.9); cam.updateProjectionMatrix(); sun.target.position.set(cx,0,0); sun.position.set(cx-8,18,10); r.render(scene,cam); }
  return {canvas:cv,render,
    toScreen(x,y,h){ tmp.set(X(x),(h||0)*ZS,Z(y)).project(cam); return [(tmp.x+1)/2*W,(1-tmp.y)/2*H]; },
    head(i){ const E=HP[i]; E.h.J.head.getWorldPosition(tmp); tmp.y+=.38; tmp.project(cam); return [(tmp.x+1)/2*W,(1-tmp.y)/2*H]; },
    destroy(){ scene.traverse(m=>{ if(m.geometry) m.geometry.dispose(); if(m.material){ if(m.material.map) m.material.map.dispose(); m.material.dispose(); } }); r.dispose(); try{ r.forceContextLoss(); }catch(e){} } }; }
window.__SOCCER3D=make;
})();
