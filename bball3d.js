// 鬥魂籃球的 3D 畫面（three.js）：比賽還是在 bball.js 的 2D 座標上算，這裡只負責畫。
// 40 單位＝1 公尺：世界 X=(gx-410)/40、Z=(gy-320)/40；高度 z 以籃框 118＝3.05 公尺換算。
(function(){
'use strict';
function make(T,o){ const {W,H,HX,HY,RIMZ,ARC,CT,bg,shade}=o,PI=Math.PI,H3=window.__H3D;
  const X=x=>(x-410)/40,Z=y=>(y-320)/40,ZS=3.05/RIMZ,JS=.55; // JS：跳躍高度縮小，人才不會飛到籃框上面
  const cv=document.createElement('canvas'),r=new T.WebGLRenderer({canvas:cv,antialias:true}); r.setPixelRatio(1); r.setSize(W*2,H*2,false); r.shadowMap.enabled=true; r.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene(),col=c=>new T.Color(c),night=!!CT.night,indoor=CT.bg==='gym'||CT.bg==='arena';
  const ph=(c,sh,m)=>new T.MeshPhongMaterial(Object.assign({color:col(c),shininess:sh==null?20:sh,specular:sh>50?0x666666:0x1a1a1a},m||{}));
  const add=(geo,mat,x,y,z,p)=>{ const m=new T.Mesh(geo,mat); m.position.set(x||0,y||0,z||0); (p||scene).add(m); m.castShadow=true; m.receiveShadow=true; return m; };
  scene.background=col(night?'#0a0c22':indoor?'#2a2430':CT.bg==='beach'?'#5ab8f0':CT.bg==='park'?'#9ccbe8':'#a8c4dc');
  scene.add(new T.HemisphereLight(night?0x9aa0ff:0xfff8e8,night?0x281e28:0x6a6050,night?.45:indoor?.5:.5));
  const sun=new T.DirectionalLight(night?0xfff0d8:0xfff4e0,night?.7:indoor?.55:.68); sun.position.set(night||indoor?2:-7,16,night||indoor?4:9); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-14,right:14,top:12,bottom:-12,near:1,far:50}); sun.shadow.bias=-.0006; scene.add(sun); scene.add(sun.target);
  if(night||indoor) for(const x of [-6,6]){ const L=new T.PointLight(0xfff0d0,.35,30); L.position.set(x,9,2); scene.add(L); }
  /* 地板：原本的球場顏色、木紋、禁區和線畫成貼圖 */
  const G0=-140,G1=960,Y0=-160,Y1=800,cw=2048,ch=Math.round(cw*(Y1-Y0)/(G1-G0)),k=cw/(G1-G0),fc=document.createElement('canvas'); fc.width=cw; fc.height=ch;
  { const c=fc.getContext('2d'),U=x=>(x-G0)*k,V=y=>(y-Y0)*k;
    c.fillStyle=CT.floor; c.fillRect(0,0,cw,ch);
    if(CT.wood){ for(let y=0;y<ch;y+=10){ const L=.92+((y*7919)%13)/13*.16; c.fillStyle=shade(CT.floor,L); c.fillRect(0,y,cw,9); c.fillStyle='rgba(0,0,0,.12)'; c.fillRect(0,y+9,cw,1); for(let x=((y*37)%260);x<cw;x+=260+((y*13)%90)){ c.fillRect(x,y,1,9); } }
      c.fillStyle='rgba(255,255,255,.04)'; for(let i=0;i<900;i++) c.fillRect((i*733)%cw,(i*397)%ch,40,1); }
    else { for(let i=0;i<26000;i++){ const v=(i*7919)%7; c.fillStyle=v<3?'rgba(0,0,0,.08)':'rgba(255,255,255,.07)'; c.fillRect((i*137.7)%cw,(i*53.3)%ch,2,2); } }
    // 場外一圈顏色深一點
    c.fillStyle='rgba(0,0,0,.18)'; c.fillRect(0,0,cw,V(0)); c.fillRect(0,V(640),cw,ch-V(640)); c.fillRect(0,V(0),U(0),V(640)-V(0)); c.fillRect(U(820),V(0),cw-U(820),V(640)-V(0));
    c.fillStyle=CT.paint; c.globalAlpha=.88; c.fillRect(U(560),V(220),U(820)-U(560),V(420)-V(220)); c.globalAlpha=1;
    c.strokeStyle=CT.line; c.lineWidth=3*k; c.lineCap='round';
    c.strokeRect(U(560),V(220),U(820)-U(560),V(420)-V(220)); c.strokeRect(U(0),V(0),U(820)-U(0),V(640)-V(0));
    c.beginPath(); c.arc(U(560),V(320),70*k,PI/2,PI*1.5); c.stroke();
    c.beginPath(); c.moveTo(U(820),V(320-ARC*.94)); for(let a=-1.22;a<=1.22;a+=.02) c.lineTo(U(HX-Math.cos(a)*ARC),V(HY+Math.sin(a)*ARC)); c.lineTo(U(820),V(320+ARC*.94)); c.stroke();
    c.beginPath(); c.arc(U(0),V(320),90*k,-PI/2,PI/2); c.stroke();
    for(const gx of [620,680,740]) for(const yy of [220,420]){ c.beginPath(); c.moveTo(U(gx),V(yy)); c.lineTo(U(gx),V(yy+(yy<320?-12:12))); c.stroke(); }
    c.font='900 '+Math.round(60*k)+'px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='rgba(255,255,255,.14)'; c.fillText('鬥魂',U(250),V(320)); }
  const ftx=new T.CanvasTexture(fc); ftx.anisotropy=8;
  const floor=add(new T.PlaneGeometry((G1-G0)/40,(Y1-Y0)/40),CT.wood?ph('#ffffff',70,{map:ftx,specular:0x2a2a2a}):new T.MeshLambertMaterial({map:ftx}),X((G0+G1)/2),0,Z((Y0+Y1)/2)); floor.rotation.x=-PI/2; floor.castShadow=false;
  const outC=CT.bg==='park'?'#4f7a3a':CT.bg==='beach'?'#e2cf98':shade(CT.floor,.62);
  const outer=add(new T.PlaneGeometry(160,160),new T.MeshLambertMaterial({color:col(outC)}),0,-.01,0); outer.rotation.x=-PI/2; outer.castShadow=false;
  /* 背景：原本的 2D 背景（看台、街景、海邊⋯）貼在場地後面一面大牆上 */
  const bc=document.createElement('canvas'); bc.width=800; bc.height=170; const btx=new T.CanvasTexture(bc),BW=66,BH=BW/3*170/800,BZ=Z(-200); btx.wrapS=T.RepeatWrapping; btx.repeat.set(3,1);
  const back=add(new T.PlaneGeometry(BW,BH),new T.MeshBasicMaterial({map:btx,fog:false}),X(400),BH/2-.05,BZ); back.castShadow=back.receiveShadow=false;
  for(const s of [-1,1]){ const sd=add(new T.PlaneGeometry(40,BH),new T.MeshBasicMaterial({map:btx,fog:false}),X(400)+s*BW/2,BH/2-.05,BZ+20); sd.rotation.y=-s*PI/2; sd.castShadow=sd.receiveShadow=false; }
  const drawBack=(t,sw)=>{ const c=bc.getContext('2d'); const g=c.createLinearGradient(0,0,0,170); g.addColorStop(0,'#'+scene.background.getHexString()); g.addColorStop(1,night?'#2a2050':'#e8f2fa'); c.fillStyle=g; c.fillRect(0,0,800,170); bg(c,t,sw); btx.needsUpdate=true; }; drawBack(0,0);
  // 場邊的東西：鐵籠街頭的鐵絲網、夜間的燈柱
  if(CT.bg==='cage'){ const fcv=document.createElement('canvas'); fcv.width=fcv.height=64; const f=fcv.getContext('2d'); f.strokeStyle='rgba(200,205,215,.85)'; f.lineWidth=2; f.beginPath(); f.moveTo(0,0); f.lineTo(64,64); f.moveTo(64,0); f.lineTo(0,64); f.stroke();
    const ftx2=new T.CanvasTexture(fcv); ftx2.wrapS=ftx2.wrapT=T.RepeatWrapping; ftx2.repeat.set(60,8); const fm=new T.MeshBasicMaterial({map:ftx2,transparent:true,side:T.DoubleSide,depthWrite:false});
    const fen=add(new T.PlaneGeometry(30,4),fm,X(410),2,Z(-60)); fen.castShadow=false; for(let i=-15;i<=15;i+=3) add(new T.CylinderGeometry(.05,.05,4,8),ph('#8a8e98',60),X(410)+i,2,Z(-60)); }
  if(night) for(const gx of [-60,880]){ add(new T.CylinderGeometry(.08,.12,9,10),ph('#4a4e58',40),X(gx),4.5,Z(-90)); const lp=add(new T.BoxGeometry(1.2,.3,.5),new T.MeshBasicMaterial({color:0xfff6d8}),X(gx),9,Z(-90)+.2); lp.castShadow=false; }
  /* 籃架：籃板、籃框、籃網 */
  const RX=X(HX),RY=3.05,RZ=Z(HY),hoop=new T.Group(); scene.add(hoop);
  const boardCv=document.createElement('canvas'); boardCv.width=360; boardCv.height=210; { const c=boardCv.getContext('2d'); c.fillStyle='rgba(230,240,250,.28)'; c.fillRect(0,0,360,210); c.strokeStyle='#ffffff'; c.lineWidth=10; c.strokeRect(5,5,350,200); c.strokeStyle=o.rimC||'#e8402a'; c.lineWidth=8; c.strokeRect(120,92,120,90); }
  const board=add(new T.BoxGeometry(.05,1.05,1.8),new T.MeshPhongMaterial({map:new T.CanvasTexture(boardCv),transparent:true,shininess:90,specular:0x888888,depthWrite:false}),RX+.38,RY+.37,RZ,hoop); board.castShadow=false;
  const steel=ph('#3a3a44',60),pad=ph('#2f4f8a',10);
  add(new T.BoxGeometry(.1,.1,.4),steel,RX+.55,RY+.9,RZ,hoop); add(new T.BoxGeometry(1.1,.14,.14),steel,RX+.95,RY+.75,RZ,hoop).rotation.z=-.35; add(new T.BoxGeometry(.2,RY+.9,.2),steel,RX+1.45,(RY+.9)/2,RZ,hoop);
  add(new T.BoxGeometry(.5,1.2,.5),pad,RX+1.45,.6,RZ,hoop); add(new T.BoxGeometry(1,.25,1.2),steel,RX+1.6,.12,RZ,hoop);
  const rim=new T.Group(); rim.position.set(RX,RY,RZ); hoop.add(rim);
  const rimM=ph('#e8501e',70); add(new T.TorusGeometry(.23,.012,8,32),rimM,0,0,0,rim).rotation.x=PI/2; add(new T.BoxGeometry(.16,.03,.12),rimM,.31,-.01,0,rim);
  const netM=new T.LineBasicMaterial({color:0xf4f4f4,transparent:true,opacity:.9}),netG=new T.BufferGeometry(),NS=12,NR=4,netP=new Float32Array(NS*NR*2*3*2); netG.setAttribute('position',new T.BufferAttribute(netP,3)); const net=new T.LineSegments(netG,netM); rim.add(net);
  function netShape(sw,t){ let q=0; const pt=(i,j)=>{ const u=j/NR,rad=.23-.09*u,a=i/NS*PI*2+(j%2)*PI/NS,sx=Math.sin(t*40)*sw*.05*u; return [Math.cos(a)*rad+sx,-u*.42*(1-sw*.25),Math.sin(a)*rad]; };
    const put=v=>{ netP[q++]=v[0]; netP[q++]=v[1]; netP[q++]=v[2]; };
    for(let j=0;j<NR;j++) for(let i=0;i<NS;i++){ put(pt(i,j)); put(pt(i+.5,j+1)); put(pt(i+1,j)); put(pt(i+.5,j+1)); }
    netG.attributes.position.needsUpdate=true; }
  netShape(0,0);
  /* 球：橘色、黑色球線 */
  const bcv=document.createElement('canvas'); bcv.width=256; bcv.height=128; { const c=bcv.getContext('2d'); c.fillStyle='#d8641c'; c.fillRect(0,0,256,128); for(let i=0;i<2500;i++){ c.fillStyle=i%2?'rgba(120,40,0,.18)':'rgba(255,190,120,.14)'; c.fillRect((i*37.3)%256,(i*17.7)%128,1.5,1.5); }
    c.strokeStyle='#1a120e'; c.lineWidth=2.5; for(const x of [0,64,128,192,256]){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,128); c.stroke(); } c.beginPath(); c.moveTo(0,64); c.lineTo(256,64); c.stroke(); }
  const ball=add(new T.SphereGeometry(.12,24,16),new T.MeshPhongMaterial({map:new T.CanvasTexture(bcv),shininess:18,specular:0x221100}),0,.12,0);
  /* 球員 */
  const HP=o.players.map((L,i)=>{ const h=H3.build(T,{skin:L.skin,shirt:L.col,pants:L.col,shoes:L.shoe||'#f4f4f4',hair:L.hairCol,shorts:true,sleeveless:!L.sleeve,number:L.num,numCol:L.col2||'#ffffff',socks:'#ffffff',socksHigh:!!L.sock});
    const hair=h.J.head.children[6]; if(L.hair===4&&hair) hair.visible=false; else if(L.hair===1&&hair){ hair.scale.set(1.3,1.25,1.3); hair.position.y+=.03; }
    else if(L.hair===2&&hair){ for(let k2=0;k2<5;k2++) add(new T.CylinderGeometry(.012,.012,.12,5),hair.material,-.06+k2*.03,.1,-.11,h.J.head).rotation.x=.4; }
    if(L.band||L.hair===3) add(new T.TorusGeometry(.108,.014,6,24),ph(L.band||'#ffffff',10),0,.15,.005,h.J.head).rotation.x=PI/2;
    // 球褲：寬一點、長到膝蓋
    for(const hp of [h.J.hipL,h.J.hipR]) add(new T.CylinderGeometry(.1,.095,.36,12).translate(0,-.18,0),ph(L.col,8),0,0,0,hp);
    const wrap=new T.Group(); wrap.add(h.root); h.root.scale.setScalar(1.08); scene.add(wrap); return {h,wrap,cur:null,ang:i<3?PI/2:-PI/2,lx:null,ly:0,spd:0}; });
  const ringM=[ '#ffd23f','#3ddbd9'].map(c=>new T.MeshBasicMaterial({color:col(c),transparent:true,opacity:.9,depthWrite:false}));
  const rings=ringM.map(m=>{ const g=add(new T.RingGeometry(.42,.52,32),m,0,.02,0); g.rotation.x=-PI/2; g.castShadow=g.receiveShadow=false; g.visible=false; return g; });
  /* 姿勢 */
  function poseOf(p,t,mv,i){ const s=Math.sin(t*11+i),cc=Math.cos(t*11+i);
    const run={y:-.05-Math.abs(cc)*.035,spine:[.22,0,0],neck:[-.12,0,0],hipL:[-.7*s-.12,0,.03],hipR:[.7*s-.12,0,-.03],knL:[.3+.95*Math.max(0,Math.sin(t*11+i-1.4)),0,0],knR:[.3+.95*Math.max(0,Math.sin(t*11+i+PI-1.4)),0,0],anL:[-.1,0,0],anR:[-.1,0,0],shL:[.65*s,0,.1],shR:[-.65*s,0,-.1],elL:[-1.3,0,0],elR:[-1.3,0,0]};
    const stance={y:-.12,spine:[.3,0,0],neck:[-.2,0,0],hipL:[-.42,0,.16],hipR:[-.3,0,-.16],knL:[.75,0,0],knR:[.65,0,0],anL:[-.33,0,-.12],anR:[-.35,0,.12]};
    switch(p.pose){
      case 'run': return run;
      case 'dribble': { const u=Math.abs(Math.sin(t*9)),b=mv?Object.assign({},run):Object.assign({},stance); b.spine=[.34,0,0]; b.shR=[-.55,0,-.32]; b.elR=[-.35-.45*(1-u),0,0]; b.hdR=[.3*(1-u),0,0]; if(!mv){ b.shL=[-.75,0,.45]; b.elL=[-.7,0,0]; } return b; }
      case 'defend': { const sh=mv?Math.sin(t*14+i)*.08:0; return {y:-.22,spine:[.4,0,0],neck:[-.3,0,0],head:[-.12,0,0],hipL:[-.42,0,.42+sh],hipR:[-.42,0,-.42+sh],knL:[.9,0,0],knR:[.9,0,0],anL:[-.45,0,-.42],anR:[-.45,0,.42],shL:[-.45,0,1.15],shR:[-.45,0,-1.15],elL:[-.55,0,0],elR:[-.55,0,0]}; }
      case 'shootPrep': return {y:-.22,spine:[.22,0,0],neck:[-.15,0,0],hipL:[-.75,0,.08],hipR:[-.75,0,-.08],knL:[1.3,0,0],knR:[1.3,0,0],anL:[-.52,0,0],anR:[-.52,0,0],shR:[-1.85,0,-.18],elR:[-1.7,0,0],shL:[-1.55,0,.32],elL:[-1.5,0,0]};
      case 'shoot': return {y:0,spine:[-.04,0,0],neck:[-.15,0,0],hipL:[.06,0,.04],hipR:[.12,0,-.04],knL:[.12,0,0],knR:[.18,0,0],anL:[.55,0,0],anR:[.55,0,0],shR:[-2.95,0,-.05],elR:[-.18,0,0],hdR:[p.held?-.3:.8,0,0],shL:[-2.55,0,.32],elL:[-.55,0,0]};
      case 'dunk': return p.act==='hang'?{y:0,spine:[.05,0,0],shL:[-3.05,0,.25],shR:[-3.05,0,-.25],elL:[-.1,0,0],elR:[-.1,0,0],hipL:[-.35,0,.06],hipR:[-.1,0,-.06],knL:[.6,0,0],knR:[.4,0,0],anL:[.4,0,0],anR:[.4,0,0]}
        :{y:0,spine:[.08,0,0],neck:[-.25,0,0],shR:[-3.0,0,-.08],elR:[-.12,0,0],shL:[-2.5,0,.45],elL:[-.35,0,0],hipL:[-1.3,0,.05],knL:[1.75,0,0],anL:[.3,0,0],hipR:[.28,0,-.04],knR:[.55,0,0],anR:[.55,0,0]};
      case 'jump': return {y:0,spine:[0,0,0],neck:[-.25,0,0],shL:[-3.0,0,.18],shR:[-3.0,0,-.18],elL:[-.1,0,0],elR:[-.1,0,0],hipL:[-.3,0,.05],hipR:[-.2,0,-.05],knL:[.65,0,0],knR:[.55,0,0],anL:[.4,0,0],anR:[.4,0,0]};
      case 'fall': return {y:-.55,spine:[-.2,0,0],shL:[-1.2,0,.9],shR:[-1.2,0,-.9],elL:[-.4,0,0],elR:[-.4,0,0],hipL:[-1.1,0,.15],hipR:[-.8,0,-.15],knL:[1.2,0,0],knR:[.9,0,0]};
      default: { const br=Math.sin(t*2.4+i)*.02; return {y:-.03,spine:[.06+br,0,0],hipL:[-.08,0,.05],hipR:[-.08,0,-.05],knL:[.16,0,0],knR:[.16,0,0],anL:[-.08,0,-.05],anR:[-.08,0,.05],shL:[.05,0,.14],shR:[.05,0,-.14],elL:[-.3,0,0],elR:[-.3,0,0]}; } } }
  /* 鏡頭 */
  const cam=new T.PerspectiveCamera(36,W/H,.1,200); let view='side',lastT=null,cx=X(550),hand=new T.Vector3(),hand2=new T.Vector3(),tmp=new T.Vector3(),bshow=null,blend=0,wasHeld=false,frame=0,fallT=[0,0,0,0,0,0];
  function render(st){ const {P,b,t,swish}=st,dt=lastT==null?.016:Math.min(.1,Math.max(0,t-lastT)); lastT=t; frame++;
    if(frame%4===1) drawBack(t,swish);
    // 球員
    P.forEach((p,i)=>{ const E=HP[i]; if(E.lx==null){ E.lx=p.x; E.ly=p.y; }
      const vx=(p.x-E.lx)/(dt||.016),vy=(p.y-E.ly)/(dt||.016); E.lx=p.x; E.ly=p.y; E.spd+=(Math.hypot(vx,vy)-E.spd)*Math.min(1,dt*10); const mv=E.spd>40;
      let ta=p.face>0?PI/2:-PI/2; if(mv&&(p.pose==='run'||p.pose==='dribble')) ta=Math.atan2(vx,vy); if(p.pose==='dunk'||p.pose==='shoot'||p.pose==='shootPrep') ta=Math.atan2(HX-p.x,HY-p.y);
      let da=ta-E.ang; while(da>PI) da-=PI*2; while(da<-PI) da+=PI*2; E.ang+=da*Math.min(1,dt*12);
      const tg=poseOf(Object.assign({},p,{held:b.h===i}),t,mv,i); E.cur=E.cur?H3.mix(E.cur,tg,Math.min(1,dt*16)):tg; H3.pose(E.h.J,E.cur);
      fallT[i]+=((p.pose==='fall'?1:0)-fallT[i])*Math.min(1,dt*10); E.h.root.rotation.x=-fallT[i]*1.35;
      E.wrap.position.set(X(p.x),p.z*ZS*JS,Z(p.y)); E.wrap.rotation.y=E.ang; });
    // 控制中的球員：腳下光圈
    rings.forEach(g=>g.visible=false); (st.ctrl||[]).forEach((c2,k2)=>{ const g=rings[k2]; if(!g) return; const p=P[c2.pi]; g.visible=true; g.position.set(X(p.x),.02,Z(p.y)); });
    // 籃框：灌籃掛框時往下彎、進球時網子晃
    const hang=P.some(p=>p.act==='hang'); rim.rotation.z+=((hang?-.18:0)-rim.rotation.z)*Math.min(1,dt*14); netShape(Math.max(0,swish),t);
    // 球的位置
    let bx,by,bz; const hp=b.h>=0?P[b.h]:null;
    if(hp){ const E=HP[b.h]; E.wrap.updateMatrixWorld(true); E.h.J.hdR.getWorldPosition(hand); E.h.J.hdL.getWorldPosition(hand2);
      if(hp.pose==='shoot'||hp.pose==='dunk'||hp.pose==='jump'||hp.pose==='shootPrep'){ tmp.copy(hand).lerp(hand2,hp.pose==='dunk'?.15:.35); bx=tmp.x; by=tmp.y+(hp.pose==='shootPrep'?.02:.14); bz=tmp.z; }
      else if(hp.pose==='dribble'||hp.pose==='idle'||hp.pose==='run'){ const u=Math.abs(Math.sin(t*9)); bx=hand.x; bz=hand.z; by=.12+(hand.y-.2)*u; }
      else { bx=hand.x; by=hand.y-.12; bz=hand.z; } }
    else { bx=X(b.x); by=Math.max(.12,b.z*ZS+.12); bz=Z(b.y); }
    if(wasHeld&&!hp) blend=1; wasHeld=!!hp; blend=Math.max(0,blend-dt*8);
    if(blend>0&&bshow){ bx=bx+(bshow[0]-bx)*blend; by=by+(bshow[1]-by)*blend; bz=bz+(bshow[2]-bz)*blend; }
    if(bshow){ const d=Math.hypot(bx-bshow[0],bz-bshow[2]); ball.rotation.z-=d/.12*Math.sign((bx-bshow[0])||1); ball.rotation.x+=(by-bshow[1])*3; }
    bshow=[bx,by,bz]; ball.position.set(bx,by,bz);
    // 鏡頭：側面轉播（像原本的畫面）或跟著球的近景
    const fx=X(b.x);
    if(view==='side'){ cx+=(X(550)+(fx-X(550))*.2-cx)*Math.min(1,dt*3); cam.position.set(cx,7.8,Z(320)+18.5); cam.lookAt(cx+.4,.6,Z(320)+.4); cam.fov=36; }
    else { const fz=Z(b.y); cx+=(fx+(RX-fx)*.3-cx)*Math.min(1,dt*4); cam.position.set(cx-1.5,3.4,fz+8.4); cam.lookAt(cx+1.2,1.4,fz-.4); cam.fov=42; }
    cam.updateProjectionMatrix(); sun.target.position.set(X(450),0,Z(320)); r.render(scene,cam); }
  return {canvas:cv,get view(){ return view; },toggle(){ view=view==='side'?'near':'side'; },
    toScreen(x,y,h){ tmp.set(X(x),h||0,Z(y)).project(cam); return [(tmp.x+1)/2*W,(1-tmp.y)/2*H]; },
    head(i){ const E=HP[i]; E.h.J.head.getWorldPosition(tmp); tmp.y+=.35; tmp.project(cam); return [(tmp.x+1)/2*W,(1-tmp.y)/2*H]; },
    render,
    destroy(){ scene.traverse(m=>{ if(m.geometry) m.geometry.dispose(); if(m.material){ if(m.material.map) m.material.map.dispose(); m.material.dispose(); } }); r.dispose(); try{ r.forceContextLoss(); }catch(e){} } }; }
window.__BBALL3D=make;
})();
