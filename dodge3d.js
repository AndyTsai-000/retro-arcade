// 鬥魂躲避球的 3D 畫面（three.js）：比賽照舊在 dodge.js 的 2D 座標上算，這裡只負責畫。
// 換算：場地 x 52～428（18 公尺）、y 150～258（9 公尺）；高度 z 以 28 像素＝1 公尺。人物用 h3d.js 的寫實人物。
(function(){
'use strict';
function make(T,o){ const {W,H,X0,X1,MID,YB,YF,cols,bg,court}=o,PI=Math.PI,H3=window.__H3D;
  const SX=(X1-X0)/18,SY=(YF-YB)/9,CY=(YB+YF)/2,X=x=>(x-MID)/SX,Z=y=>(y-CY)/SY,ZS=1/28;
  const cv=document.createElement('canvas'),r=new T.WebGLRenderer({canvas:cv,antialias:true}); r.setPixelRatio(1); r.setSize(W*2,H*2,false); r.shadowMap.enabled=true; r.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene(),col=c=>new T.Color(c),night=o.bgKey==='night',snow=o.bgKey==='snow';
  const ph=(c,sh,m)=>new T.MeshPhongMaterial(Object.assign({color:col(c),shininess:sh==null?20:sh,specular:sh>50?0x666666:0x1a1a1a},m||{}));
  const add=(geo,mat,x,y,z,p)=>{ const m=new T.Mesh(geo,mat); m.position.set(x||0,y||0,z||0); (p||scene).add(m); m.castShadow=true; m.receiveShadow=true; return m; };
  scene.background=col(night?'#0e0e30':snow?'#cfe6f7':'#8ccaf0');
  scene.add(new T.HemisphereLight(night?0x9aa0ff:0xfff8e8,night?0x281e28:0x6a6050,night?.45:.55));
  const sun=new T.DirectionalLight(night?0xfff0d8:0xfff4e0,night?.75:.7); sun.position.set(-6,16,10); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-16,right:16,top:12,bottom:-12,near:1,far:60}); sun.shadow.bias=-.0006; scene.add(sun); scene.add(sun.target);
  if(night) for(const x of [-10,10]){ const L=new T.PointLight(0xfff0d0,.4,40); L.position.set(x,9,4); scene.add(L); }
  /* 地面：原本的沙地／泥土顏色＋紋路，場地顏色、兩隊半場、白線 */
  const cw=2048,ch=1024,G0=-40,G1=520,GY0=96,GY1=320,k=cw/(G1-G0),fc=document.createElement('canvas'); fc.width=cw; fc.height=Math.round((GY1-GY0)*k);
  { const c=fc.getContext('2d'),U=x=>(x-G0)*k,V=y=>(y-GY0)*k; c.fillStyle=o.ground.g; c.fillRect(0,0,cw,fc.height);
    for(let i=0;i<30000;i++){ const v=(i*7919)%7; c.fillStyle=v<3?'rgba(0,0,0,.06)':'rgba(255,255,255,.08)'; c.fillRect((i*137.7)%cw,(i*53.3)%fc.height,2,2); }
    c.fillStyle=o.ground.d; for(let i=0;i<300;i++) c.fillRect((i*733)%cw,(i*397)%fc.height,14,3);
    if(court){ c.fillStyle=court; c.fillRect(U(X0),V(YB),U(X1)-U(X0),V(YF)-V(YB)); for(let i=0;i<8000;i++){ c.fillStyle=i%2?'rgba(0,0,0,.05)':'rgba(255,255,255,.05)'; c.fillRect(U(X0)+(i*37.7)%(U(X1)-U(X0)),V(YB)+(i*13.3)%(V(YF)-V(YB)),2,2); } }
    c.globalAlpha=.2; c.fillStyle=cols[0]; c.fillRect(U(X0),V(YB),U(MID)-U(X0),V(YF)-V(YB)); c.fillStyle=cols[1]; c.fillRect(U(MID),V(YB),U(X1)-U(MID),V(YF)-V(YB)); c.globalAlpha=1;
    c.strokeStyle='#ffffff'; c.lineWidth=4*k/2; c.strokeRect(U(X0),V(YB),U(X1)-U(X0),V(YF)-V(YB)); c.beginPath(); c.moveTo(U(MID),V(YB)); c.lineTo(U(MID),V(YF)); c.stroke();
    c.font='900 '+Math.round(26*k)+'px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='rgba(255,255,255,.18)'; c.fillText('鬥魂',U((X0+MID)/2),V(CY)); c.fillText('DODGE',U((MID+X1)/2),V(CY)); }
  const ftx=new T.CanvasTexture(fc); ftx.anisotropy=8;
  const fl=add(new T.PlaneGeometry((G1-G0)/SX,(GY1-GY0)/SY),new T.MeshLambertMaterial({map:ftx}),X((G0+G1)/2),0,Z((GY0+GY1)/2)); fl.rotation.x=-PI/2; fl.castShadow=false;
  const outer=add(new T.PlaneGeometry(200,200),new T.MeshLambertMaterial({color:col(o.ground.g)}),0,-.01,0); outer.rotation.x=-PI/2; outer.castShadow=false;
  /* 背景牆：原本的天空、看台與加油布條 */
  const bc=document.createElement('canvas'); bc.width=960; bc.height=244; const btx=new T.CanvasTexture(bc),BW=56,BH=BW*244/960,BZ=Z(YB)-8;
  const back=add(new T.PlaneGeometry(BW,BH),new T.MeshBasicMaterial({map:btx}),0,BH/2-1.2,BZ); back.castShadow=back.receiveShadow=false;
  const drawBack=()=>{ const c=bc.getContext('2d'); c.save(); c.scale(2,2); bg(c); c.restore(); btx.needsUpdate=true; }; drawBack();
  /* 看台：場邊兩排階梯座位（立體）＋觀眾 */
  const stand=new T.Group(); scene.add(stand); const crowdC=['#ff5d4f','#ffd23f','#3ddbd9','#ffffff','#ff7eb6','#86dc4f','#4f9dff','#ff9d3d'];
  for(let r2=0;r2<3;r2++){ add(new T.BoxGeometry(34,.5,1),ph(night?'#3a3860':'#9aa0b4',10),0,.25+r2*.5,BZ+3.2-r2*1,stand); for(let i=0;i<34;i++){ const fan=new T.Group(); fan.position.set(-16.5+i+(r2%2)*.5,.5+r2*.5,BZ+3.2-r2*1); stand.add(fan); add(new T.BoxGeometry(.42,.5,.3),ph(crowdC[(i*3+r2*5)%8],10),0,.25,0,fan); add(new T.SphereGeometry(.16,10,8),ph('#f0c098',20),0,.66,0,fan); fan.userData.ph=i*.9+r2*2; } }
  /* 球 */
  const ball=add(new T.SphereGeometry(.16,24,16),ph(o.ballCol||'#ffffff',40),0,.16,0); const bglow=add(new T.SphereGeometry(.34,16,12),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}),0,0,0); bglow.castShadow=bglow.receiveShadow=false;
  /* 球員 */
  const HAIR=['#2a1a10','#1a1418','#7a3b1d','#3a2418'];
  const HP=o.players.map((p,i)=>{ const h=H3.build(T,{skin:'#e8b890',shirt:cols[p.team],pants:'#2b3f9e',shoes:'#f4f4f4',hair:HAIR[(+p.hair||0)%4],shorts:true,number:(i%6)+1,numCol:'#ffffff',socks:'#ffffff'});
    const hd=h.J.head.children[6]; if((+p.hair||0)===1&&hd){ hd.scale.set(1.2,1.3,1.2); } add(new T.TorusGeometry(.108,.016,6,24),ph(p.team?'#ffffff':'#ff3b3b',10),0,.15,.005,h.J.head).rotation.x=PI/2; /* 熱血頭帶 */
    for(const hp of [h.J.hipL,h.J.hipR]) add(new T.CylinderGeometry(.1,.095,.3,12).translate(0,-.15,0),ph('#2b3f9e',8),0,0,0,hp);
    const wrap=new T.Group(); wrap.add(h.root); scene.add(wrap); return {h,wrap,cur:null,ang:p.team?-PI/2:PI/2,lx:null,ly:0,spd:0,fall:0}; });
  const rings=['#ffd23f','#3ddbd9'].map(c=>{ const g=add(new T.RingGeometry(.4,.5,32),new T.MeshBasicMaterial({color:col(c),transparent:true,opacity:.9,depthWrite:false}),0,.02,0); g.rotation.x=-PI/2; g.castShadow=g.receiveShadow=false; g.visible=false; return g; });
  function poseOf(k,t,i,thr){ const s=Math.sin(t*11+i),cc=Math.cos(t*11+i);
    if(k===1) return {y:-.05-Math.abs(cc)*.035,spine:[.25,0,0],neck:[-.12,0,0],hipL:[-.75*s-.12,0,.03],hipR:[.75*s-.12,0,-.03],knL:[.3+1*Math.max(0,Math.sin(t*11+i-1.4)),0,0],knR:[.3+1*Math.max(0,Math.sin(t*11+i+PI-1.4)),0,0],shL:[.7*s,0,.1],shR:[-.7*s,0,-.1],elL:[-1.3,0,0],elR:[-1.3,0,0]};
    if(k===2){ const u=thr; return {y:-.06,spine:[.15-u*.3,(u-.5)*.8,0],neck:[-.1,0,0],hipL:[-.6,0,.1],hipR:[.3,0,-.1],knL:[.5,0,0],knR:[.2,0,0],shR:[-1.6-u*1.2,0,-.3],elR:[-.2-u*.8,0,0],shL:[-.9,0,.5],elL:[-.6,0,0]}; }
    if(k===3) return {y:-.42,spine:[.75,0,0],neck:[-.5,0,0],hipL:[-1.5,0,.25],hipR:[-1.5,0,-.25],knL:[2.1,0,0],knR:[2.1,0,0],anL:[-.6,0,0],anR:[-.6,0,0],shL:[-.4,0,.6],shR:[-.4,0,-.6],elL:[-1.8,0,0],elR:[-1.8,0,0]};
    if(k===6) return {y:-.14,spine:[.35,0,0],neck:[-.3,0,0],hipL:[-.5,0,.18],hipR:[-.5,0,-.18],knL:[.85,0,0],knR:[.85,0,0],anL:[-.35,0,0],anR:[-.35,0,0],shL:[-1.35,0,.15],shR:[-1.35,0,-.15],elL:[-.5,0,0],elR:[-.5,0,0]};
    if(k===4) return {y:-.05,spine:[-.25,0,0],neck:[.2,0,0],shL:[-2.4,0,.6],shR:[-2.4,0,-.6],elL:[-.3,0,0],elR:[-.3,0,0],hipL:[-.6,0,.12],hipR:[-.2,0,-.12],knL:[.9,0,0],knR:[.4,0,0]};
    const br=Math.sin(t*2.4+i)*.02; return {y:-.08,spine:[.14+br,0,0],neck:[-.06,0,0],hipL:[-.28,0,.14],hipR:[-.28,0,-.14],knL:[.45,0,0],knR:[.45,0,0],anL:[-.2,0,-.1],anR:[-.2,0,.1],shL:[-.25,0,.25],shR:[-.25,0,-.25],elL:[-.9,0,0],elR:[-.9,0,0]}; }
  const cam=new T.PerspectiveCamera(42,W/H,.1,300),tmp=new T.Vector3(),hand=new T.Vector3(); let lastT=null,frame=0,cx=0;
  function render(st){ const {P,b,t}=st,dt=lastT==null?.016:Math.min(.1,Math.max(0,t-lastT)); lastT=t; frame++; if(frame%6===1) drawBack();
    stand.children.forEach(f=>{ if(f.userData.ph!=null) f.position.y=f.position.y-(f.userData.j||0)+(f.userData.j=Math.max(0,Math.sin(t*5+f.userData.ph))*.12); });
    P.forEach((p,i)=>{ const E=HP[i]; const gone=p.state===5&&p.st>1.2; E.wrap.visible=!gone; if(gone) return; if(E.lx==null){ E.lx=p.x; E.ly=p.y; }
      const vx=(p.x-E.lx)/(dt||.016),vy=(p.y-E.ly)/(dt||.016); E.lx=p.x; E.ly=p.y; E.spd+=(Math.hypot(vx,vy)-E.spd)*Math.min(1,dt*10);
      const k=p.state===5||p.state===4?4:p.throwT>0?2:p.duck?3:p.catchT>0?6:p.moving?1:0;
      let ta=p.face>0?PI/2:-PI/2; if(k===1&&E.spd>20) ta=Math.atan2(vx/SX,vy/SY); let da=ta-E.ang; while(da>PI) da-=PI*2; while(da<-PI) da+=PI*2; E.ang+=da*Math.min(1,dt*12);
      const tg=poseOf(k,t,i,Math.min(1,(p.throwT||0)*4)); E.cur=E.cur?H3.mix(E.cur,tg,Math.min(1,dt*16)):tg; H3.pose(E.h.J,E.cur);
      E.fall+=((k===4?1:0)-E.fall)*Math.min(1,dt*8); E.h.root.rotation.x=-E.fall*1.4;
      const up=p.state===5?p.st*1.2:0; E.wrap.position.set(X(p.x),p.z*ZS+up,Z(p.y)); E.wrap.rotation.y=E.ang;
      E.h.root.traverse(m=>{ if(m.material&&m.material.opacity!=null){ const a=p.state===5?Math.max(0,1-p.st/1.2):p.inv>0&&Math.floor(t*16)%2?.45:1; if(a<1||m.material.transparent){ if(m.material.transparent!==(a<1)){ m.material.transparent=a<1; m.material.needsUpdate=true; } m.material.opacity=a; } } }); });
    rings.forEach(g=>g.visible=false); (st.ctrl||[]).forEach((id,k2)=>{ if(id==null) return; const g=rings[k2],p=P[id]; if(!g||!p) return; g.visible=true; g.position.set(X(p.x),.02,Z(p.y)); });
    let bx,by,bz; const hp=b.st==='held'?P[b.holder]:null;
    if(hp){ const E=HP[b.holder]; E.wrap.updateMatrixWorld(true); E.h.J.hdR.getWorldPosition(hand); bx=hand.x; by=hand.y+.06; bz=hand.z; }
    else { bx=X(b.x); by=Math.max(.16,b.z*ZS+.16); bz=Z(b.y); }
    ball.position.set(bx,by,bz); ball.rotation.x+=dt*(hp?0:12); bglow.position.copy(ball.position); bglow.material.opacity=b.type&&!hp?.45+Math.sin(t*30)*.2:0; if(b.type) bglow.material.color.set(st.shotCol||'#ffffff');
    const fx=hp?X(hp.x):X(b.x); cx+=((Math.max(-1.2,Math.min(1.2,fx*.18)))-cx)*Math.min(1,dt*2.5);
    cam.position.set(cx,10.6,16.2); cam.lookAt(cx*.6,0,-1.5); cam.updateProjectionMatrix(); sun.target.position.set(0,0,0); r.render(scene,cam); }
  return {canvas:cv,render,
    toScreen(x,y,h){ tmp.set(X(x),(h||0)*ZS,Z(y)).project(cam); return [(tmp.x+1)/2*W,(1-tmp.y)/2*H]; },
    head(i){ const E=HP[i]; E.h.J.head.getWorldPosition(tmp); tmp.y+=.38; tmp.project(cam); return [(tmp.x+1)/2*W,(1-tmp.y)/2*H]; },
    destroy(){ scene.traverse(m=>{ if(m.geometry) m.geometry.dispose(); if(m.material){ if(m.material.map) m.material.map.dispose(); m.material.dispose(); } }); r.dispose(); try{ r.forceContextLoss(); }catch(e){} } }; }
window.__DODGE3D=make;
})();
