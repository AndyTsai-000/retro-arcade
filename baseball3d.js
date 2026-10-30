// 鬥魂棒球的 3D 畫面（three.js）：規則、投打判定還是在 baseball.js 算，這裡只負責畫。
// 單位公尺：本壘在原點、往外野是 -Z、一壘在 +X；遊戲裡的英呎乘 .3048。
// 投打畫面的鏡頭會自動校正，讓 3D 好球帶剛好落在原本 2D 好球帶框的位置。
(function(){
'use strict';
function make(T,o){ const {W,H,ZX,ZY,ZW,ZH,L,fence,FPOS,BASE,kfBK}=o,PI=Math.PI,H3=window.__H3D,FT=.3048,V=T.Vector3;
  const night=L.bg==='night',sunset=L.bg==='sunset',grassC=L.grass||'#4c9a3c';
  const cv=document.createElement('canvas'),r=new T.WebGLRenderer({canvas:cv,antialias:true}); r.setPixelRatio(1); r.setSize(W*2,H*2,false); r.shadowMap.enabled=true; r.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene(),col=c=>new T.Color(c);
  const ph=(c,sh,m)=>new T.MeshPhongMaterial(Object.assign({color:col(c),shininess:sh==null?20:sh,specular:sh>50?0x666666:0x1a1a1a},m||{}));
  const lam=(c,m)=>new T.MeshLambertMaterial(Object.assign({color:col(c)},m||{}));
  const add=(geo,mat,x,y,z,p)=>{ const m=new T.Mesh(geo,mat); m.position.set(x||0,y||0,z||0); (p||scene).add(m); m.castShadow=true; m.receiveShadow=true; return m; };
  const canv=(w,h,f)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; f(c.getContext('2d'),w,h); const t=new T.CanvasTexture(c); t.anisotropy=8; return t; };
  /* 天空 */
  scene.background=canv(16,256,(c,w,h)=>{ const g=c.createLinearGradient(0,0,0,h); if(night){ g.addColorStop(0,'#03041a'); g.addColorStop(.55,'#141a4a'); g.addColorStop(1,'#2a3070'); } else if(sunset){ g.addColorStop(0,'#5a4a9a'); g.addColorStop(.45,'#ff8a5a'); g.addColorStop(1,'#ffd49a'); } else { g.addColorStop(0,'#3d9be8'); g.addColorStop(.6,'#9fd4ff'); g.addColorStop(1,'#e2f2ff'); } c.fillStyle=g; c.fillRect(0,0,w,h); });
  scene.fog=new T.Fog(night?0x141a4a:sunset?0xffb07a:0xcfe6f8,160,420);
  scene.add(new T.HemisphereLight(night?0xb0b8ff:sunset?0xffd8b0:0xf4f8ff,night?0x1a2a1a:0x3a5a2a,night?.55:.62));
  const sun=new T.DirectionalLight(night?0xfff4e0:sunset?0xffb070:0xfff4e0,night?.7:sunset?.75:.8); sun.position.set(night?0:-30,night?60:sunset?25:55,night?20:30); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:200}); sun.shadow.bias=-.0005; scene.add(sun); scene.add(sun.target);
  /* 地面：草皮條紋、紅土、壘線、警告區畫成一張大貼圖 */
  const GX0=-140,GX1=140,GZ0=-150,GZ1=20,gk=2048/(GX1-GX0);
  const gtx=canv(2048,Math.round((GZ1-GZ0)*gk),(c,w,h)=>{ const U=x=>(x-GX0)*gk,Vz=z=>(z-GZ0)*gk,dirt=night?'#8a6440':'#c08a4a',sh=(hex,f)=>{ const n=parseInt(hex.slice(1),16),q=v=>Math.max(0,Math.min(255,Math.round(v*f))); return 'rgb('+q(n>>16)+','+q(n>>8&255)+','+q(n&255)+')'; };
    c.fillStyle=grassC; c.fillRect(0,0,w,h);
    // 割草條紋：棋盤格
    for(let i=0;i<40;i++) for(let j=0;j<24;j++) if((i+j)%2){ c.fillStyle='rgba(0,0,0,.045)'; c.fillRect(U(GX0+i*8),Vz(GZ0+j*8),8*gk,8*gk); }
    // 全壘打牆外是深色、警告區是紅土
    c.save(); c.beginPath(); c.moveTo(U(0),Vz(0)); for(let a=-1.4;a<=1.4;a+=.02){ const rr=fence(a)*FT; c.lineTo(U(Math.sin(a)*rr),Vz(-Math.cos(a)*rr)); } c.closePath();
    c.fillStyle='rgba(0,0,0,0)'; c.rect(0,0,w,h); c.fillStyle=sh(grassC,.6); c.fill('evenodd'); c.restore();
    c.strokeStyle=dirt; c.lineWidth=4.5*gk; c.beginPath(); for(let a=-1.4;a<=1.4;a+=.02){ const rr=fence(a)*FT-2.3; const x=U(Math.sin(a)*rr),y=Vz(-Math.cos(a)*rr); a<=-1.39?c.moveTo(x,y):c.lineTo(x,y); } c.stroke();
    // 內野紅土：以投手丘為圓心的大弧＋本壘附近
    const mz=-60.5*FT; c.save(); c.beginPath(); c.moveTo(U(0),Vz(4)); c.lineTo(U(-120),Vz(-116)); c.lineTo(U(120),Vz(-116)); c.closePath(); c.clip(); c.fillStyle=dirt; c.beginPath(); c.arc(U(0),Vz(mz),29*gk,0,PI*2); c.fill(); c.restore();
    // 內野草皮（菱形）
    const B=BASE.map(b=>[b[0]*FT,-b[1]*FT]); c.fillStyle=grassC; c.beginPath(); c.moveTo(U(0),Vz(-3.6)); c.lineTo(U(B[1][0]-1.1),Vz(B[1][1])); c.lineTo(U(0),Vz(B[2][1]+1.6)); c.lineTo(U(B[3][0]+1.1),Vz(B[3][1])); c.closePath(); c.fill();
    c.fillStyle='rgba(0,0,0,.07)'; c.beginPath(); c.moveTo(U(0),Vz(-6)); c.lineTo(U(B[1][0]-4),Vz(B[1][1])); c.lineTo(U(0),Vz(B[2][1]+4)); c.lineTo(U(B[3][0]+4),Vz(B[3][1])); c.closePath(); c.fill();
    c.fillStyle=dirt; for(const b of [B[1],B[2],B[3]]){ c.beginPath(); c.arc(U(b[0]),Vz(b[1]),2.6*gk,0,PI*2); c.fill(); } c.beginPath(); c.arc(U(0),Vz(mz),2.9*gk,0,PI*2); c.fill(); c.beginPath(); c.arc(U(0),Vz(0),4.2*gk,0,PI*2); c.fill();
    // 紅土顆粒
    for(let i=0;i<30000;i++){ const x=(i*137.13)%w,y=(i*71.7)%h; c.fillStyle=i%3?'rgba(255,255,255,.03)':'rgba(0,0,0,.035)'; c.fillRect(x,y,1.5,1.5); }
    // 界外線
    c.strokeStyle='rgba(255,255,255,.95)'; c.lineWidth=Math.max(1.6,.12*gk); for(const s of [-1,1]){ const rr=fence(s*PI/4)*FT; c.beginPath(); c.moveTo(U(0),Vz(0)); c.lineTo(U(s*rr*.7071),Vz(-rr*.7071)); c.stroke(); }
  });
  const ground=add(new T.PlaneGeometry(GX1-GX0,GZ1-GZ0),new T.MeshLambertMaterial({map:gtx}),(GX0+GX1)/2,0,(GZ0+GZ1)/2); ground.rotation.x=-PI/2; ground.castShadow=false;
  const far=add(new T.PlaneGeometry(900,900),lam('#2a3a2a'),0,-.05,0); far.rotation.x=-PI/2; far.castShadow=false;
  // 本壘附近的細節（打擊區、本壘板）：近鏡頭會看得很清楚，另外畫一張高解析貼圖
  const hpT=canv(1024,1024,(c,w,h)=>{ const k=w/9,U=x=>(x+4.5)*k,Vz=z=>(z+4.5)*k; c.clearRect(0,0,w,h);
    c.fillStyle=night?'#8a6440':'#c08a4a'; c.beginPath(); c.arc(U(0),Vz(0),4.2*k,0,PI*2); c.fill();
    for(let i=0;i<9000;i++){ const a=i*2.399,rr=Math.sqrt((i*.618)%1)*4.1*k; c.fillStyle=i%2?'rgba(255,255,255,.05)':'rgba(60,30,10,.08)'; c.fillRect(U(0)+Math.cos(a)*rr,Vz(0)+Math.sin(a)*rr,2.5,2.5); }
    c.strokeStyle='rgba(255,255,255,.92)'; c.lineWidth=.07*k; for(const s of [-1,1]) c.strokeRect(U(s*.98)-.61*k,Vz(-.92),1.22*k,1.83*k);
    c.strokeRect(U(-.55),Vz(.95),1.1*k,2.3*k);
    c.fillStyle='#f6f6f2'; c.beginPath(); c.moveTo(U(-.216),Vz(-.216)); c.lineTo(U(.216),Vz(-.216)); c.lineTo(U(.216),Vz(0)); c.lineTo(U(0),Vz(.216)); c.lineTo(U(-.216),Vz(0)); c.closePath(); c.fill(); });
  const hp=add(new T.PlaneGeometry(9,9),new T.MeshLambertMaterial({map:hpT,transparent:true,alphaTest:.3}),0,.006,0); hp.rotation.x=-PI/2; hp.castShadow=false;
  // 投手丘、投手板、壘包
  const dirtM=lam(night?'#8a6440':'#c08a4a'),mz=-60.5*FT;
  const mound=add(new T.CylinderGeometry(.9,2.75,.25,32),dirtM,0,.125,mz); mound.castShadow=false; add(new T.BoxGeometry(.61,.04,.15),ph('#ffffff',30),0,.26,mz+.2).castShadow=false;
  for(const k2 of [1,2,3]){ const b=add(new T.BoxGeometry(.38,.08,.38),ph('#ffffff',30),BASE[k2][0]*FT,.04,-BASE[k2][1]*FT); b.rotation.y=PI/4; }
  /* 全壘打牆＋廣告、界外標竿 */
  const adT=canv(2048,96,(c,w,h)=>{ c.fillStyle='#1f5a3a'; c.fillRect(0,0,w,h); const ads=[['ARCADE','#ff5d4f'],['GO!','#3d8bff'],['COLA','#e23b3b'],['RETRO','#ffd23f'],['HOME RUN','#86dc4f'],['★★★','#ff7eb6'],['400','#ffffff'],['鬥魂','#ffd23f']];
    c.font='900 46px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; ads.forEach((a,i)=>{ const x=i*256; c.fillStyle='#0f2e1f'; c.fillRect(x+12,14,232,68); c.fillStyle=a[1]; c.fillText(a[0],x+128,50); }); c.fillStyle='#ffd23f'; c.fillRect(0,0,w,6); });
  adT.wrapS=T.RepeatWrapping;
  function band(r0,r1,y0,y1,a0,a1,mat,rep){ const N=80,pos=[],uv=[],idx=[]; for(let i=0;i<=N;i++){ const a=a0+(a1-a0)*i/N,R0=r0(a),R1=r1(a); pos.push(Math.sin(a)*R0,y0,-Math.cos(a)*R0,Math.sin(a)*R1,y1,-Math.cos(a)*R1); uv.push(i/N*rep,0,i/N*rep,1); if(i<N){ const q=i*2; idx.push(q,q+2,q+1,q+1,q+2,q+3); } }
    const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new T.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals(); const m=new T.Mesh(g,mat); m.receiveShadow=true; scene.add(m); return m; }
  const fr=a=>fence(a)*FT;
  band(fr,fr,0,3.2,-1.35,1.35,new T.MeshLambertMaterial({map:adT,side:T.DoubleSide}),14);
  // 看台：從牆頂往外、往上斜，觀眾用貼圖
  const crowdT=canv(512,256,(c,w,h)=>{ c.fillStyle=night?'#1a1c34':'#3a3e52'; c.fillRect(0,0,w,h); const C=['#ff5d4f','#ffd23f','#3ddbd9','#ffffff','#ff7eb6','#86dc4f','#4f9dff','#ff9d3d','#e23b3b','#2f6fd0'];
    for(let y=0;y<h;y+=16){ c.fillStyle=night?'#2a2d52':'#6a7090'; c.fillRect(0,y+12,w,4); for(let x=(y/16%2)*6;x<w;x+=12){ const k=(x*7+y*13+((x*y)%7))%C.length; c.fillStyle=C[k]; c.fillRect(x+1,y+5,9,8); c.fillStyle=['#f2c9a0','#c68a5e','#8d5a3a','#e0ac80'][(x+y)%4]; c.beginPath(); c.arc(x+5.5,y+3.5,3.2,0,7); c.fill(); } } });
  crowdT.wrapS=crowdT.wrapT=T.RepeatWrapping; crowdT.repeat.set(1,1);
  const stands=band(a=>fr(a)+1,a=>fr(a)+48,3.4,30,-1.35,1.35,new T.MeshLambertMaterial({map:crowdT,side:T.DoubleSide}),60); stands.material.map.repeat.set(1,2.4);
  band(a=>fr(a)+.2,a=>fr(a)+1.2,3.2,3.4,-1.35,1.35,lam('#2a2e40'),1);
  band(a=>fr(a)+48,a=>fr(a)+50,30,36,-1.35,1.35,lam(night?'#14162e':'#4a4f66',{side:T.DoubleSide}),1); // 屋簷
  for(const s of [-1,1]){ const rr=fr(s*PI/4); add(new T.CylinderGeometry(.18,.18,26,10),ph('#ffd23f',40),s*rr*.7071+s*.3,13,-rr*.7071-.3); }
  // 照明燈塔
  for(const a of [-1.15,-.55,.55,1.15]){ const rr=fr(a)+56,x=Math.sin(a)*rr,z=-Math.cos(a)*rr; add(new T.CylinderGeometry(.5,.8,44,10),ph('#5a5f75',40),x,22,z); const pnl=add(new T.BoxGeometry(9,5,.6),new T.MeshBasicMaterial({color:night?0xfffbe0:0xd8dde8}),x,46,z); pnl.lookAt(0,0,0); pnl.castShadow=false; }
  // 中外野計分板
  const sbT=canv(512,192,()=>{}),sbC=sbT.image; let sbKey='';
  function board(B){ const k=JSON.stringify(B); if(!B||k===sbKey) return; sbKey=k; const c=sbC.getContext('2d'),w=512,h=192; c.fillStyle='#16182a'; c.fillRect(0,0,w,h); c.fillStyle='#0b0c18'; c.fillRect(12,12,w-24,h-24);
    const n=Math.max(B.n,B.line[0].length,B.line[1].length),cw=Math.min(36,300/n); c.font='bold 26px monospace'; c.textAlign='center'; c.textBaseline='middle';
    c.fillStyle='#ffd23f'; for(let i=0;i<n;i++) c.fillText(String(i+1),130+i*cw,52); c.fillText('R',462,52);
    for(let tm=0;tm<2;tm++){ const y=100+tm*48; c.fillStyle=B.cols[tm]; c.fillRect(24,y-16,14,32); c.fillStyle='#ffffff'; c.textAlign='left'; c.font='bold 22px sans-serif'; c.fillText(B.names[tm].slice(0,3),44,y); c.textAlign='center'; c.font='bold 26px monospace';
      c.fillStyle='#86dc4f'; for(let i=0;i<n;i++){ const v=B.line[tm][i]; if(v!=null||i<B.inn-1||i===B.inn-1&&tm<=B.half) c.fillText(String(v||0),130+i*cw,y); } c.fillStyle='#ffd23f'; c.fillText(String(B.sc[tm]),462,y); }
    sbT.needsUpdate=true; }
  const sbd=add(new T.BoxGeometry(34,13,1.5),new T.MeshBasicMaterial({map:sbT}),0,40,-fr(0)-58); sbd.castShadow=false; add(new T.BoxGeometry(2,34,2),ph('#3a3f55'),0,17,-fr(0)-58.5);
  /* 人物 */
  const PANTS='#eceef5',SHOE='#22202e',glove=ph('#8a4b22',25),SK=['#f2c39a','#e0ac80','#c68a5e','#8d5a3a'];
  const mkPlayer=(c,i,kind)=>{ const h=H3.build(T,{skin:SK[i%4],shirt:c,pants:PANTS,shoes:SHOE,hair:['#1a1410','#3a2416','#6a4a2a'][i%3],number:kind==='bat'?null:(i*7+3)%60,numCol:'#ffffff',socks:c,cap:kind==='fld'?c:null,helmet:kind!=='fld'?c:null});
    if(kind==='fld') add(new T.SphereGeometry(.075,10,8),glove,0,-.06,.02,h.J.hdL).scale.set(1.1,1.3,.6);
    const g=new T.Group(); g.add(h.root); scene.add(g); return {h,g,cur:null,ang:PI,lx:null,lz:0}; };
  let teamKey='',FL=[],RN=[],BT=null,bat=null,pball=null;
  function teamsFor(fc,bc){ const k=fc+'|'+bc; if(k===teamKey) return; teamKey=k;
    for(const e of FL.concat(RN,BT?[BT]:[])) scene.remove(e.g);
    FL=FPOS.map((p,i)=>mkPlayer(fc,i,'fld')); RN=[0,1,2,3].map(i=>mkPlayer(bc,i+2,'run')); BT=mkPlayer(bc,5,'bat');
    pball=add(new T.SphereGeometry(.045,10,8),ph('#ffffff',30),0,-.08,.06,FL[0].h.J.hdR);
    if(!bat){ const bg=new T.CylinderGeometry(.033,.014,.86,14); bg.translate(0,.43,0); bat=add(bg,ph('#d8b07a',60),0,0,0); add(new T.CylinderGeometry(.022,.022,.015,10),ph('#3a2a1a'),0,0,0,bat); } }
  const ball=add(new T.SphereGeometry(.05,16,12),ph('#ffffff',40,{emissive:0x555555}),0,1,0); const bshadow=add(new T.CircleGeometry(.06,16),new T.MeshBasicMaterial({color:0,transparent:true,opacity:.3,depthWrite:false}),0,.01,0); bshadow.rotation.x=-PI/2; bshadow.castShadow=false;
  const ss=x=>x*x*(3-2*x),lerp=(a,b,k)=>a+(b-a)*k,cl=(v,a,b)=>v<a?a:v>b?b:v;
  function frames(F,p){ let i=0; while(i<F.length-2&&p>F[i+1][0]) i++; const A=F[i],B=F[i+1],k=ss(cl((p-A[0])/((B[0]-A[0])||1),0,1)); return [A[1],B[1],k]; }
  const lp3=(a,b,k)=>[lerp(a[0],b[0],k),lerp(a[1],b[1],k),lerp(a[2],b[2],k)];
  /* 守備員、跑者的姿勢 */
  function poseOf(name,t,i){ const s=Math.sin(t*13+i),c2=Math.cos(t*13+i);
    if(name==='run') return {y:-.05-Math.abs(c2)*.04,spine:[.25,0,0],neck:[-.15,0,0],hipL:[-.8*s-.12,0,.03],hipR:[.8*s-.12,0,-.03],knL:[.3+1.1*Math.max(0,Math.sin(t*13+i-1.4)),0,0],knR:[.3+1.1*Math.max(0,Math.sin(t*13+i+PI-1.4)),0,0],anL:[-.1,0,0],anR:[-.1,0,0],shL:[.75*s,0,.1],shR:[-.75*s,0,-.1],elL:[-1.4,0,0],elR:[-1.4,0,0]};
    if(name==='ready') return {y:-.2,spine:[.6,0,0],neck:[-.5,0,0],hipL:[-.6,0,.25],hipR:[-.6,0,-.25],knL:[.9,0,0],knR:[.9,0,0],anL:[-.3,0,-.2],anR:[-.3,0,.2],shL:[-.75,0,.25],shR:[-.75,0,-.25],elL:[-.4,0,0],elR:[-.4,0,0]};
    if(name==='catch') return {spine:[-.08,0,0],neck:[-.55,0,0],hipL:[-.1,0,.1],hipR:[-.1,0,-.1],knL:[.15,0,0],knR:[.15,0,0],shL:[-2.9,0,.2],elL:[-.25,0,0],shR:[-2.6,0,-.25],elR:[-.5,0,0]};
    if(name==='throw') return {spine:[.15,0,0],hipL:[-.55,0,.1],knL:[.35,0,0],hipR:[.25,0,-.05],knR:[.3,0,0],shR:[-1.0,0,-1.9],elR:[-1.6,0,0],shL:[-1.4,0,.4],elL:[-.3,0,0]};
    if(name==='hold') return {spine:[.05,0,0],shL:[-.8,0,.2],elL:[-1.5,0,0],shR:[-.8,0,-.2],elR:[-1.5,0,0],knL:[.1,0,0],knR:[.1,0,0]};
    const br=Math.sin(t*2+i)*.02; return {spine:[.04+br,0,0],shL:[.05,0,.12],shR:[.05,0,-.12],elL:[-.3,0,0],elR:[-.3,0,0],hipL:[0,0,.05],hipR:[0,0,-.05],knL:[.06,0,0],knR:[.06,0,0]}; }
  function place(E,x,z,ang,P,dt,sc){ E.cur=E.cur?H3.mix(E.cur,P,Math.min(1,dt*14)):P; H3.pose(E.h.J,E.cur); let da=ang-E.ang; while(da>PI) da-=PI*2; while(da<-PI) da+=PI*2; E.ang+=da*Math.min(1,dt*10); E.g.rotation.y=E.ang; E.g.position.set(x,0,z); E.g.scale.setScalar(sc||1); E.g.visible=true; }
  /* 投手：抬腿、跨步、出手（手的位置用 IK，身體轉向跟著動） */
  const PF=[[0,{ry:0,y:0,L:[.04,1.22,.24],R:[-.04,1.22,.24],P:{spine:[.05,0,0],knL:[.08,0,0],knR:[.08,0,0]}}],
    [.3,{ry:-1.35,y:0,L:[.03,1.32,.22],R:[-.03,1.32,.22],P:{spine:[-.06,0,0],hipL:[-1.5,0,0],knL:[1.75,0,0],anL:[.3,0,0],hipR:[-.05,0,0],knR:[.15,0,0]}}],
    [.55,{ry:-1.25,y:-.2,L:[.55,1.35,.08],R:[-.5,1.7,-.18],P:{spine:[.1,0,0],hipL:[-.95,0,0],knL:[.55,0,0],hipR:[.5,0,0],knR:[.65,0,0],anR:[.3,0,0]}}],
    [.8,{ry:-.25,y:-.3,L:[.25,1.0,.2],R:[-.12,1.7,.5],P:{spine:[.55,0,0],hipL:[-.95,0,0],knL:[.45,0,0],hipR:[.6,0,0],knR:[.5,0,0],anR:[.5,0,0]}}],
    [1,{ry:0,y:-.3,L:[.28,1.0,.08],R:[.25,.7,.45],P:{spine:[.85,0,0],hipL:[-.75,0,0],knL:[.6,0,0],hipR:[.1,0,0],knR:[1.3,0,0],anR:[.4,0,0]}}]];
  const tmpV=new V(),tmpW=new V(),ZW3=.36,ZC=.86,ZH3=ZW3*ZH/ZW;
  function pitcherPose(E,pp,dt){ const [A,B,k]=frames(PF,pp),P=H3.mix(A.P,B.P,k); P.y=lerp(A.y,B.y,k);
    E.cur=P; H3.pose(E.h.J,P); E.ang=lerp(A.ry,B.ry,k); E.g.rotation.y=E.ang; E.g.position.set(0,.25,mz); E.g.scale.setScalar(1); E.g.visible=true; E.g.updateMatrixWorld(true);
    for(const s of ['L','R']){ const q=lp3(A[s],B[s],k); tmpV.set(q[0],q[1]+P.y,q[2]); E.g.localToWorld(tmpV); H3.ik(T,E.h.J,s,tmpV,tmpW.set(s==='L'?1:-1,-1,-.4).applyQuaternion(E.g.quaternion)); } }
  /* 打者：右打、從捕手後面看站在本壘左邊、臉朝 +X（本壘板） */
  const BXP=-1.12,BZP=.05;
  const BH=[[-1,[.06,1.48,.22]],[0,[-.02,1.5,.3]],[.16,[.08,1.22,.08]],[.32,[.58,.95,-.22]],[.5,[.5,1.05,-.5]],[.75,[.12,1.38,-.45]],[1,[-.12,1.45,-.12]]];
  const BP=[[-1,{y:-.08,pelvis:[0,-.12,0],spine:[.25,-.25,0],hipL:[-.12,0,.32],hipR:[-.05,0,-.28],knL:[.4,0,0],knR:[.35,0,0],anL:[-.25,0,-.3],anR:[-.25,0,.28]}],
    [0,{y:-.1,pelvis:[0,-.2,0],spine:[.25,-.38,0],hipL:[-.5,0,.22],hipR:[-.08,0,-.28],knL:[.8,0,0],knR:[.4,0,0],anL:[-.1,0,-.2],anR:[-.25,0,.28]}],
    [.16,{y:-.12,pelvis:[0,.1,0],spine:[.22,-.1,0],hipL:[-.2,0,.4],hipR:[-.02,0,-.28],knL:[.4,0,0],knR:[.5,0,0],anL:[-.2,0,-.35],anR:[-.3,0,.25]}],
    [.32,{y:-.1,pelvis:[0,.7,0],spine:[.22,.45,0],hipL:[-.15,0,.38],hipR:[.12,0,-.2],knL:[.15,0,0],knR:[.65,0,0],anL:[-.1,0,-.35],anR:[.45,0,.1]}],
    [1,{y:-.06,pelvis:[0,1.0,0],spine:[.12,.7,0],hipL:[-.1,0,.3],hipR:[.15,0,-.15],knL:[.15,0,0],knR:[.85,0,0],anL:[-.1,0,-.3],anR:[.6,0,0]}]];
  function batterPose(E,p,cy,t){ const [A,B,k]=frames(BP,p),P=H3.mix(A,B,k); H3.pose(E.h.J,P);
    const turn=(P.pelvis?P.pelvis[1]:0)+(P.spine?P.spine[1]:0); E.h.J.neck.rotation.y=cl(1.35-turn,-.4,1.5); E.h.J.head.rotation.x=.12;
    E.g.position.set(BXP,0,BZP); E.g.rotation.y=PI/2; E.g.scale.setScalar(1); E.g.visible=true; E.g.updateMatrixWorld(true);
    const [HA,HB,hk]=frames(BH,p),hd=lp3(HA,HB,hk),J0=kfBK(p),w=p>0&&p<.6?Math.sin(p/.6*PI):0,wag=p<=-.99?Math.sin(t*2.2)*.12:0;
    hd[1]+=(cy*ZH3)*w; const a=J0.a+wag,e=J0.e+(p>.2&&p<.45?-cy*.25:0),d=new V(Math.cos(e)*Math.cos(a),Math.sin(e),-Math.cos(e)*Math.sin(a)).normalize(),K=new V(BXP+hd[0],hd[1],BZP+hd[2]);
    H3.ik(T,E.h.J,'L',K.clone().addScaledVector(d,.03),new V(.2,-1,.6)); H3.ik(T,E.h.J,'R',K.clone().addScaledVector(d,.12),new V(-.2,-1,.8));
    bat.visible=true; bat.position.copy(K).addScaledVector(d,-.04); bat.quaternion.setFromUnitVectors(new V(0,1,0),d); }
  /* 鏡頭 */
  const cam=new T.PerspectiveCamera(27,W/H,.1,900),CZ=5,CY=1.2,tp=new V();
  const proj=(x,y,z)=>{ tp.set(x,y,z).project(cam); return [(tp.x+1)/2*W,(1-tp.y)/2*H]; };
  function pitchCam(){ // 校正：好球帶寬度對到 ZW、中心對到 ZY
    let fov=27,ly=CY-.3; for(let it=0;it<8;it++){ cam.fov=fov; cam.position.set(0,CY,CZ); cam.lookAt(0,ly,-20); cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
      const a=proj(-ZW3,ZC,0),b=proj(ZW3,ZC,0),c0=proj(0,ZC,0); const ww=b[0]-a[0]; fov=2*Math.atan(Math.tan(fov*PI/360)*ww/(ZW*2))*180/PI; ly-=(c0[1]-ZY)/25; } }
  pitchCam(); const pcPos=cam.position.clone(),pcFov=cam.fov,pcQ=cam.quaternion.clone();
  let lastT=null,view='pitch',fLook=new V(0,0,-50),fPos=new V(0,46,30),hid=new V(0,-50,0);
  function hideAll(){ for(const e of FL.concat(RN)) e.g.visible=false; if(BT) BT.g.visible=false; if(bat) bat.visible=false; }
  return {canvas:cv,
    toScreen:(x,y,z)=>proj(x,y,z),
    // 投打畫面：pp 投手動作、bp 揮棒、pit 這一球、cy 打者瞄準高度
    pitch(st){ const {t,fc,bc,pp,bp,cy,pit,showBall,cheer}=st; board(st.board); const dt=lastT==null?.016:cl(t-lastT,0,.1); lastT=t; teamsFor(fc,bc); hideAll(); view='pitch';
      cam.position.copy(pcPos); cam.quaternion.copy(pcQ); cam.fov=pcFov; cam.updateProjectionMatrix(); sun.target.position.set(0,0,-10); sun.position.set(night?5:-20,night?60:sunset?22:50,night?25:28);
      crowdT.offset.y=cheer?Math.abs(Math.sin(t*9))*.012:0;
      pitcherPose(FL[0],pp,dt); pball.visible=pp<.78;
      for(let i=2;i<9;i++){ const q=FPOS[i]; place(FL[i],q[0]*FT,-q[1]*FT,Math.atan2(0-q[0]*FT,0+q[1]*FT),poseOf(pp>.6&&pp<1||pit?'ready':'stand',t,i),dt); }
      batterPose(BT,bp,cy||0,t);
      // 球：投手出手後才離手，飛到好球帶的目標位置（含變化球的位移）
      let bs=null; ball.visible=false; bshadow.visible=false;
      if(pit&&showBall){ const k=cl((pit.u-.19)/.81,0,1.2); if(pit.u>=.19){ const sx=-.42,sy=1.82,sz=mz+1.4,fx=pit.ax*ZW3,fy=ZC+pit.ay*ZH3,bx=pit.bx*ZW3,by=pit.by*ZH3;
          const x=sx+(fx-bx-sx)*k+bx*k*k,y=sy+(fy-by-sy)*k+by*k*k,z=lerp(sz,0,k); ball.position.set(x,y,z); ball.visible=true; bshadow.visible=true; bshadow.position.set(x,.012,z);
          const a=proj(x,y,z),b2=proj(x+.05,y,z); bs=[a[0],a[1],Math.max(1.5,b2[0]-a[0])]; } }
      r.render(scene,cam); return bs; },
    // 守備畫面：list＝{x,y,pose,run,i}（英呎），b＝球 [x,y,z]
    field(st){ const {t,fc,bc,list,b}=st,dt=lastT==null?.016:cl(t-lastT,0,.1); lastT=t; teamsFor(fc,bc); hideAll(); view='field'; let ri=0;
      for(const o of list){ const E=o.run?RN[ri++]:FL[o.i]; if(!E) continue; const x=o.x*FT,z=-o.y*FT;
        let ang=E.ang; if(E.lx!=null&&Math.hypot(x-E.lx,z-E.lz)>.02) ang=Math.atan2(x-E.lx,z-E.lz); else if(!o.run) ang=Math.atan2(b[0]*FT-x,-b[1]*FT-z); E.lx=x; E.lz=z;
        place(E,x,z,ang,poseOf(o.pose,t,o.i||ri),dt,2); }
      const bx=b[0]*FT,bz=-b[1]*FT,by=Math.max(.08,b[2]*FT); ball.visible=true; ball.position.set(bx,by,bz); ball.scale.setScalar(3.4); bshadow.visible=true; bshadow.position.set(bx,.02,bz); bshadow.scale.setScalar(3.4);
      // 鏡頭：本壘後上方的轉播視角，跟著球慢慢移動
      const tx=bx*.55,tz=Math.min(-25,bz*.75-10); fLook.x+=(tx-fLook.x)*Math.min(1,dt*2.5); fLook.z+=(tz-fLook.z)*Math.min(1,dt*2.5);
      cam.fov=50; cam.position.set(fLook.x*.45,46,fLook.z+70); cam.lookAt(fLook.x,0,fLook.z); cam.updateProjectionMatrix(); sun.target.position.set(fLook.x,0,fLook.z); sun.position.set(fLook.x-20,60,fLook.z+30);
      r.render(scene,cam); ball.scale.setScalar(1); bshadow.scale.setScalar(1); },
    resetField(){ fLook.set(0,0,-45); for(const e of FL.concat(RN)) e.lx=null; },
    destroy(){ scene.traverse(m=>{ if(m.geometry) m.geometry.dispose(); if(m.material){ if(m.material.map) m.material.map.dispose(); m.material.dispose(); } }); if(scene.background&&scene.background.dispose) scene.background.dispose(); r.dispose(); try{ r.forceContextLoss(); }catch(e){} } }; }
window.__BASE3D=make;
})();
