// 跑跑卡丁車：three.js 畫面，物理是平面上的 2D（位置、車頭角度、速度向量）。
// 連線時每個人自己算自己的車，房主負責電腦車並轉送所有人的位置。
(function(){
'use strict';
const THREE_URL='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const PIX='"Press Start 2P","Noto Sans TC","Microsoft JhengHei",monospace';
const TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const HALF=13,SHOULDER=7,MAX=62,MAXB=86,LAPS=3,TOTAL=6;
const COLORS=['#ff4d4d','#3d8bff','#ffd23f','#5fd068','#c56bff','#ff9d3d'];
const STAGES=[
  {name:'森林小徑',stars:1,grip:1,ai:.82,sky:0x8fd3ff,ground:['#4c9a3c','#448c36'],road:'#4a4a55',tree:[0x2f7d32,0x6b4a2a],
   pts:[[0,0],[120,0],[200,-40],[220,-130],[150,-190],[40,-180],[-40,-230],[-150,-220],[-200,-140],[-190,-50],[-100,0]]},
  {name:'海濱大道',stars:2,grip:1,ai:.85,sky:0x7fdcf5,ground:['#f0dc9c','#e6cf88'],road:'#55556a',tree:[0x3fae6a,0x8a6a3a],
   pts:[[0,0],[150,0],[250,-30],[290,-120],[230,-200],[110,-220],[0,-190],[-110,-230],[-220,-190],[-250,-100],[-180,-30],[-100,0]]},
  {name:'沙漠峽谷',stars:3,grip:1,ai:.88,sky:0xffd9a0,ground:['#d9b36a','#cfa75e'],road:'#5a4f48',tree:[0x4f9a4a,0x4f9a4a],
   pts:[[0,0],[140,0],[220,-40],[240,-130],[170,-190],[90,-150],[20,-190],[-50,-260],[-150,-250],[-200,-170],[-140,-110],[-200,-50],[-100,0]]},
  {name:'城鎮夜路',stars:3,grip:1,ai:.9,sky:0x232a5c,ground:['#2f3b4f','#293447'],road:'#3c3c48',tree:[0x2a5a4a,0x3a3028],
   pts:[[0,0],[130,0],[190,-20],[200,-90],[140,-120],[130,-190],[190,-230],[120,-270],[0,-250],[-40,-170],[-120,-150],[-200,-200],[-240,-120],[-190,-40],[-100,0]]},
  {name:'冰原彎道',stars:4,grip:.5,ai:.86,sky:0xcfe9ff,ground:['#eef6ff','#dfeefa'],road:'#8fb4c9',tree:[0xbfe3f2,0x6f8fa3],
   pts:[[0,0],[100,0],[170,-50],[110,-110],[180,-170],[100,-230],[10,-180],[-60,-240],[-150,-250],[-210,-180],[-130,-130],[-210,-70],[-100,0]]},
  {name:'火山環道',stars:5,grip:.9,ai:.93,sky:0x4a2030,ground:['#4a332e','#3f2a26'],road:'#2e2a30',tree:[0x8a3a22,0x3a2a22],
   pts:[[0,0],[110,0],[170,-40],[120,-90],[190,-130],[130,-180],[200,-230],[110,-280],[20,-240],[40,-160],[-40,-110],[-100,-180],[-60,-260],[-160,-280],[-230,-210],[-170,-140],[-240,-80],[-180,-20],[-100,0]]}
];
const ITEMS=['nitro','banana','missile','shield','water','cloud','bolt'],INAME={nitro:'氮氣',banana:'香蕉',missile:'飛彈',shield:'護盾',water:'水球',cloud:'烏雲',bolt:'閃電'};
const wrap=a=>{ while(a>Math.PI)a-=2*Math.PI; while(a<-Math.PI)a+=2*Math.PI; return a; };
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const r2=v=>Math.round(v*100)/100;
const fmtTime=t=>{ const m=Math.floor(t/60),s=t-m*60; return m+':'+(s<10?'0':'')+s.toFixed(2); };

function load(){
  if(window.THREE) return Promise.resolve();
  return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=THREE_URL; s.onload=()=>res(); s.onerror=()=>{s.remove();rej(new Error('three'));}; document.head.appendChild(s); });
}

/* ---- 車與人物的模型：遊戲裡和「我的造型」的預覽共用 ---- */
function buildKart(T,L){
  const g=new T.Group(),PI=Math.PI;
  const paint=new T.MeshPhongMaterial({color:new T.Color(L.color),shininess:90,specular:0x666666}),
    dark=new T.MeshPhongMaterial({color:0x1c1c24,shininess:40}),rubber=new T.MeshLambertMaterial({color:0x121216}),
    metal=new T.MeshPhongMaterial({color:0xc8ccd6,shininess:140,specular:0xffffff}),seatM=new T.MeshLambertMaterial({color:0x2c2c3a}),
    suit=new T.MeshPhongMaterial({color:0xf4f4f8,shininess:20}),skin=new T.MeshLambertMaterial({color:0xf2c9a0}),lam=c=>new T.MeshLambertMaterial({color:c});
  const add=(geo,m,x,y,z,rx,ry,rz,p)=>{ const b=new T.Mesh(geo,m); b.position.set(x,y,z); b.rotation.set(rx||0,ry||0,rz||0); (p||g).add(b); return b; };
  const box=(w,h,d,m,x,y,z,rx)=>add(new T.BoxGeometry(w,h,d),m,x,y,z,rx);
  const ball=(r,m,x,y,z,sx,sy,sz)=>{ const b=add(new T.SphereGeometry(r,18,14),m,x,y,z); if(sx) b.scale.set(sx,sy,sz); return b; };
  const tube=(r,len,m,x,y,z,rx,ry,rz)=>add(new T.CylinderGeometry(r,r,len,10),m,x,y,z,rx,ry,rz);
  // 車身：畫出側面輪廓再往左右拉出厚度，邊緣倒圓角
  const hull=(pts,width,m)=>{ const sh=new T.Shape(); pts.forEach((p,i)=>i?sh.lineTo(p[0],p[1]):sh.moveTo(p[0],p[1]));
    const geo=new T.ExtrudeGeometry(sh,{depth:width-.2,bevelEnabled:true,bevelThickness:.1,bevelSize:.09,bevelSegments:4}); geo.translate(0,0,-(width-.2)/2);
    return add(geo,m,0,0,0,0,-PI/2,0); };
  const B=L.body,buggy=B==='buggy',sport=B==='sport';
  const wr=buggy?.68:sport?.44:.46,ww=buggy?.58:.44,wx=buggy?1.32:sport?1.08:1.14,wz=sport?1.3:1.12,by=buggy?1.02:sport?.5:.52;
  if(sport){
    hull([[-1.95,.2],[-2,.62],[-1.6,.86],[-.75,.84],[-.25,.66],[1.1,.56],[2.15,.36],[2.3,.22],[2.2,.14],[-1.85,.14]],1.75,paint);
    box(1.5,.05,.9,dark,0,.69,.2,.14); box(1.3,.34,.06,new T.MeshPhongMaterial({color:0x9fd8ff,transparent:true,opacity:.45,shininess:120}),0,.86,.5,-.5);
    box(1.95,.06,.5,dark,0,.14,2.2); box(.24,.1,.06,lam(0xfff6c8),-.62,.4,2.2); box(.24,.1,.06,lam(0xfff6c8),.62,.4,2.2);
    box(.3,.1,.06,lam(0xff3b3b),-.6,.55,-2.02); box(.3,.1,.06,lam(0xff3b3b),.6,.55,-2.02);
  } else if(buggy){
    hull([[-1.45,.72],[-1.5,1.12],[-.5,1.18],[.5,1.1],[1.45,.92],[1.62,.76],[1.5,.66],[-1.35,.66]],1.5,paint);
    for(const x of [-.72,.72]){ tube(.06,2,metal,x,2.05,-1.05); tube(.06,2.25,metal,x,2.02,.35,-.62); tube(.06,.8,metal,x,3.03,-.67,PI/2); }
    tube(.06,1.5,metal,0,3.03,-1.05,0,0,PI/2); tube(.06,1.5,metal,0,3.0,-.3,0,0,PI/2);
    for(const x of [-.4,.4]) ball(.16,lam(0xfff2a8),x,3.18,-.3);
    box(1.7,.12,.3,dark,0,.74,1.72); box(1.7,.12,.3,dark,0,.74,-1.62);
  } else {
    hull([[-1.55,.26],[-1.6,.58],[-1.15,.7],[-.3,.62],[.9,.56],[1.85,.4],[2.02,.28],[1.9,.2],[-1.45,.2]],1.25,paint);
    for(const x of [-.92,.92]){ const p=add(new T.CylinderGeometry(.2,.2,1.5,12),paint,x,.44,-.15,PI/2); p.scale.set(1.5,1,1); }
    tube(.06,2.3,metal,0,.34,2.06,0,0,PI/2); tube(.06,2.2,metal,0,.4,-1.68,0,0,PI/2);
    box(.9,.03,.5,lam(0xffffff),0,.6,1.25,.13);
  }
  // 座椅與方向盤
  const sy=by+(buggy?.2:.12);
  box(.78,.12,.7,seatM,0,sy,-.5); box(.78,.85,.14,seatM,0,sy+.42,-.88,-.2); box(.5,.2,.1,seatM,0,sy+.9,-.98,-.2);
  tube(.035,.75,metal,0,sy+.38,.22,-.95); add(new T.TorusGeometry(.26,.05,8,18),dark,0,sy+.6,.02,-.95+PI/2);
  // 輪胎：胎面、輪框、輪輻
  const wheels=[];
  for(const [x,z,k] of [[-wx,wz,1],[wx,wz,1],[-wx,-wz,sport||buggy?1:1.14],[wx,-wz,sport||buggy?1:1.14]]){
    const w=new T.Group(),r=wr*k; w.position.set(x,r,z); g.add(w);
    add(new T.CylinderGeometry(r,r,ww,24),rubber,0,0,0,0,0,PI/2,w); add(new T.TorusGeometry(r-.06,.07,8,24),rubber,-ww/2+.03,0,0,0,PI/2,0,w); add(new T.TorusGeometry(r-.06,.07,8,24),rubber,ww/2-.03,0,0,0,PI/2,0,w);
    add(new T.CylinderGeometry(r*.62,r*.62,ww+.03,18),metal,0,0,0,0,0,PI/2,w); add(new T.CylinderGeometry(r*.2,r*.2,ww+.08,10),paint,0,0,0,0,0,PI/2,w);
    for(let i=0;i<3;i++) add(new T.BoxGeometry(ww+.05,.07,r*1.15),dark,0,0,0,i*PI/3,0,0,w);
    wheels.push(w);
  }
  tube(.07,wx*2,dark,0,wr,wz,0,0,PI/2); tube(.07,wx*2,dark,0,wr,-wz,0,0,PI/2);
  // 配件
  const ry=buggy?1.25:sport?.9:.72,rz=sport?-1.75:-1.45;
  if(L.part==='wing'){ box(2.3,.08,.62,paint,0,ry+.75,rz,-.12); box(.06,.42,.7,dark,-1.16,ry+.72,rz); box(.06,.42,.7,dark,1.16,ry+.72,rz); tube(.05,.75,metal,-.55,ry+.36,rz); tube(.05,.75,metal,.55,ry+.36,rz); }
  else if(L.part==='flag'){ tube(.035,2.4,metal,-.62,ry+1.2,rz); const f=add(new T.PlaneGeometry(.95,.55),new T.MeshLambertMaterial({color:0xffd23f,side:T.DoubleSide}),-.14,ry+2.1,rz,0,0,0); f.rotation.y=.25; ball(.07,metal,-.62,ry+2.42,rz); }
  else if(L.part==='exhaust'){ for(const x of [-.42,.42]){ add(new T.CylinderGeometry(.13,.16,1.1,12),metal,x,ry+.05,rz-.3,1.15); add(new T.CylinderGeometry(.16,.16,.16,12),dark,x,ry+.28,rz-.82,1.15); } }
  else { box(1.7,.07,.4,dark,0,ry+.32,rz); tube(.04,.34,metal,-.5,ry+.15,rz); tube(.04,.34,metal,.5,ry+.15,rz); }
  // 駕駛：身體、手臂握方向盤、頭
  add(new T.CylinderGeometry(.3,.38,.78,14),suit,0,sy+.5,-.55,-.1); add(new T.CylinderGeometry(.31,.31,.12,14),paint,0,sy+.62,-.56,-.1);
  for(const x of [-1,1]){ ball(.17,suit,x*.36,sy+.82,-.56); add(new T.CylinderGeometry(.09,.085,.72,10),suit,x*.31,sy+.68,-.22,1.18,0,x*.12); ball(.1,dark,x*.24,sy+.58,.06);
    add(new T.CylinderGeometry(.14,.12,.85,10),suit,x*.2,sy+.14,-.05,PI/2-.12); }
  add(new T.CylinderGeometry(.12,.14,.16,10),L.driver==='helmet'?dark:skin,0,sy+.97,-.57);
  const hy=sy+1.32,hz=-.57,eye=(x,r,c)=>{ ball(r||.055,lam(c||0x15151c),x,hy+.06,hz+.4); };
  if(L.driver==='bear'){ const br=lam(0x9a6a3a),cr=lam(0xf0d6ad); ball(.46,br,0,hy,hz); for(const x of [-.34,.34]){ ball(.17,br,x,hy+.38,hz); ball(.09,cr,x,hy+.38,hz+.1); }
    ball(.2,cr,0,hy-.1,hz+.36,1.15,.85,1); ball(.07,lam(0x2a1b12),0,hy-.03,hz+.55); eye(-.17); eye(.17); }
  else if(L.driver==='bunny'){ const wh=lam(0xfafafa),pk=lam(0xffa8c8); ball(.44,wh,0,hy,hz); for(const x of [-.17,.17]){ ball(.14,wh,x,hy+.72,hz,1,3.2,.7); ball(.08,pk,x,hy+.72,hz+.06,1,3.6,.5); }
    ball(.16,wh,0,hy-.1,hz+.36,1.2,.8,1); ball(.055,pk,0,hy-.03,hz+.5); eye(-.17); eye(.17); }
  else if(L.driver==='cap'){ ball(.42,skin,0,hy,hz); add(new T.SphereGeometry(.445,18,10,0,PI*2,0,PI/2),paint,0,hy+.03,hz); const br=add(new T.CylinderGeometry(.3,.3,.04,16),paint,0,hy+.06,hz+.44); br.scale.set(1,1,.8);
    add(new T.SphereGeometry(.43,16,8,PI,PI,PI/2,.6),lam(0x3a2a20),0,hy,hz); eye(-.16); eye(.16); ball(.05,lam(0xe0a882),0,hy-.05,hz+.42); box(.16,.025,.02,lam(0x9a4a3a),0,hy-.17,hz+.38); }
  else { ball(.47,paint,0,hy,hz); add(new T.SphereGeometry(.485,20,8,PI/2-.95,1.9,1.12,.6),new T.MeshPhongMaterial({color:0x10121c,shininess:160,specular:0xaaccff}),0,hy,hz);
    add(new T.TorusGeometry(.47,.03,6,24),lam(0xffffff),0,hy,hz,0,0,0); box(.5,.1,.3,dark,0,hy-.36,hz+.22); }
  // 特效用的零件
  const flame=add(new T.ConeGeometry(.4,2,8),new T.MeshBasicMaterial({color:0xffa41a}),0,by+.05,(sport?-2.9:-2.6),-PI/2); flame.visible=false;
  add(new T.CircleGeometry(sport?2.3:2,18),new T.MeshBasicMaterial({color:0,transparent:true,opacity:.3}),0,.1,0,-PI/2);
  const sd=add(new T.SphereGeometry(2.7,14,10),new T.MeshBasicMaterial({color:0x66e0ff,transparent:true,opacity:.3}),0,1.1,0); sd.visible=false;
  const cl=new T.Group(),cm=new T.MeshBasicMaterial({color:0x3a3d4d});
  for(const [x,y,z,r] of [[0,0,0,1.5],[1.3,-.2,.2,1.1],[-1.3,-.2,-.1,1.2],[.4,.5,-.3,1]]) add(new T.SphereGeometry(r,10,8),cm,x,y,z,0,0,0,cl);
  cl.position.set(0,5,1.2); cl.visible=false; g.add(cl);
  const bolt=add(new T.ConeGeometry(.5,2.2,4),new T.MeshBasicMaterial({color:0xffe14a}),0,4.8,0,PI); bolt.visible=false;
  g.userData={flame,shield:sd,cloud:cl,bolt,wheels};
  return g;
}
// 「我的造型」裡可以拖曳旋轉的 3D 預覽
function viewer(host,look){
  const T=window.THREE,r=new T.WebGLRenderer({antialias:true}),dpr=Math.min(window.devicePixelRatio||1,2);
  const w=host.clientWidth||360,h=host.clientHeight||200; r.setPixelRatio(dpr); r.setSize(w,h,false);
  const cv=r.domElement; cv.style.cssText='width:100%;height:100%;display:block;touch-action:none;cursor:grab'; host.appendChild(cv);
  const scene=new T.Scene(); scene.background=new T.Color(0x2b2759);
  scene.add(new T.HemisphereLight(0xffffff,0x554a88,.9)); const d1=new T.DirectionalLight(0xffffff,.75); d1.position.set(5,9,6); scene.add(d1); const d2=new T.DirectionalLight(0x9fd8ff,.35); d2.position.set(-6,4,-5); scene.add(d2);
  const floor=new T.Mesh(new T.CircleGeometry(4.4,40),new T.MeshLambertMaterial({color:0x403b7c})); floor.rotation.x=-Math.PI/2; scene.add(floor);
  const ring=new T.Mesh(new T.RingGeometry(4.4,4.6,40),new T.MeshBasicMaterial({color:0xffd23f})); ring.rotation.x=-Math.PI/2; ring.position.y=.01; scene.add(ring);
  const cam=new T.PerspectiveCamera(36,w/h,.5,80);
  let model=buildKart(T,look),yaw=.75,pitch=.3,dist=8,auto=true,drag=null; scene.add(model);
  const kill=o=>o.traverse(m=>{ if(m.geometry) m.geometry.dispose(); if(m.material) m.material.dispose(); });
  cv.addEventListener('pointerdown',e=>{ drag={x:e.clientX,y:e.clientY}; auto=false; cv.style.cursor='grabbing'; try{cv.setPointerCapture(e.pointerId);}catch(_){ } });
  cv.addEventListener('pointermove',e=>{ if(!drag) return; yaw-=(e.clientX-drag.x)*.012; pitch=Math.max(.03,Math.min(1.25,pitch+(e.clientY-drag.y)*.008)); drag={x:e.clientX,y:e.clientY}; });
  const up=()=>{ drag=null; cv.style.cursor='grab'; }; cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{ e.preventDefault(); dist=Math.max(5,Math.min(16,dist+e.deltaY*.01)); },{passive:false});
  return {
    set(L){ scene.remove(model); kill(model); model=buildKart(T,L); scene.add(model); },
    draw(){ if(auto) yaw+=.007; for(const wl of model.userData.wheels) wl.rotation.x+=auto?.05:0;
      cam.position.set(Math.sin(yaw)*Math.cos(pitch)*dist,Math.sin(pitch)*dist+1,Math.cos(yaw)*Math.cos(pitch)*dist); cam.lookAt(0,1,0); r.render(scene,cam); },
    destroy(){ kill(scene); r.dispose(); try{ r.forceContextLoss(); }catch(e){} cv.remove(); }
  };
}

function create(env,opts){
  const T=window.THREE,st=STAGES[opts.stage||0],net=opts.net,host=!net||net.host,me=net?net.me:0,local2=!net&&opts.mode==='2p',itemMode=opts.variant==='item',humans=net?net.count:local2?2:1;
  const stage=env.stage,dpr=Math.min(window.devicePixelRatio||1,2);
  const renderer=new T.WebGLRenderer({antialias:true}); renderer.setPixelRatio(dpr); stage.appendChild(renderer.domElement);
  const hudC=document.createElement('canvas'); stage.appendChild(hudC); const hud=hudC.getContext('2d');
  const scene=new T.Scene(); scene.background=new T.Color(st.sky); scene.fog=new T.Fog(st.sky,140,560);
  const cam=new T.PerspectiveCamera(62,1,.5,1000);
  scene.add(new T.HemisphereLight(0xffffff,0x667755,.95)); const sun=new T.DirectionalLight(0xffffff,.55); sun.position.set(60,120,40); scene.add(sun);
  let vw=1,vh=1;
  function resize(){ vw=Math.max(1,stage.clientWidth); vh=Math.max(1,stage.clientHeight); renderer.setSize(vw,vh,false); cam.aspect=vw/vh; cam.updateProjectionMatrix(); hudC.width=vw*dpr; hudC.height=vh*dpr; }
  const ro=new ResizeObserver(resize); ro.observe(stage); resize();

  function tex(w,h,draw,rx,ry){ const c=document.createElement('canvas'); c.width=w;c.height=h; draw(c.getContext('2d'),w,h);
    const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; if(rx) t.repeat.set(rx,ry); return t; }

  /* ---- 賽道 ---- */
  const curve=new T.CatmullRomCurve3(st.pts.map(p=>new T.Vector3(p[0],0,p[1])),true,'centripetal');
  const len=curve.getLength(),N=Math.round(len/2),sp=len/N,raw=curve.getSpacedPoints(N);
  const px=new Float32Array(N),pz=new Float32Array(N),tx=new Float32Array(N),tz=new Float32Array(N),nx=new Float32Array(N),nz=new Float32Array(N),curv=new Float32Array(N);
  for(let i=0;i<N;i++){ px[i]=raw[i].x; pz[i]=raw[i].z; }
  for(let i=0;i<N;i++){ const a=(i+1)%N,b=(i-1+N)%N; let dx=px[a]-px[b],dz=pz[a]-pz[b]; const l=Math.hypot(dx,dz)||1; tx[i]=dx/l; tz[i]=dz/l; nx[i]=tz[i]; nz[i]=-tx[i]; }
  for(let i=0;i<N;i++){ const a=(i+2)%N,b=(i-2+N)%N; curv[i]=wrap(Math.atan2(tx[a],tz[a])-Math.atan2(tx[b],tz[b]))/(4*sp); }
  let minX=1e9,maxX=-1e9,minZ=1e9,maxZ=-1e9;
  for(let i=0;i<N;i++){ minX=Math.min(minX,px[i]);maxX=Math.max(maxX,px[i]);minZ=Math.min(minZ,pz[i]);maxZ=Math.max(maxZ,pz[i]); }

  function ribbon(offA,yA,offB,yB,vRep,mat){
    const pos=[],uv=[],idx=[];
    for(let i=0;i<=N;i++){ const j=i%N;
      pos.push(px[j]+nx[j]*offA,yA,pz[j]+nz[j]*offA, px[j]+nx[j]*offB,yB,pz[j]+nz[j]*offB);
      const v=i/N*vRep; uv.push(0,v,1,v);
      if(i<N){ const a=i*2; idx.push(a,a+1,a+2,a+1,a+3,a+2); } }
    const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new T.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
    const m=new T.Mesh(g,mat); scene.add(m); return m;
  }
  const roadTex=tex(64,64,(c,w,h)=>{
    c.fillStyle=st.road; c.fillRect(0,0,w,h);
    for(let i=0;i<260;i++){ c.fillStyle='rgba('+(Math.random()<.5?'255,255,255':'0,0,0')+',.06)'; c.fillRect(Math.random()*w,Math.random()*h,2,2); }
    c.fillStyle='#e23b3b'; c.fillRect(0,0,5,32); c.fillRect(w-5,0,5,32); c.fillStyle='#f4f4f4'; c.fillRect(0,32,5,32); c.fillRect(w-5,32,5,32);
    c.fillRect(6,0,1.5,h); c.fillRect(w-7.5,0,1.5,h); c.fillStyle='#ffd23f'; c.fillRect(31,4,2,26);
  });
  ribbon(HALF,.05,-HALF,.05,Math.round(len/10),new T.MeshLambertMaterial({map:roadTex,side:T.DoubleSide}));
  const wallTex=tex(8,32,(c,w,h)=>{ c.fillStyle='#e23b3b'; c.fillRect(0,0,w,16); c.fillStyle='#f4f4f4'; c.fillRect(0,16,w,16); });
  const wallMat=new T.MeshLambertMaterial({map:wallTex,side:T.DoubleSide});
  const LIM=HALF+SHOULDER;
  ribbon(LIM+.6,0,LIM+.6,1.5,Math.round(len/8),wallMat); ribbon(-LIM-.6,0,-LIM-.6,1.5,Math.round(len/8),wallMat);
  const groundTex=tex(64,64,(c,w,h)=>{ c.fillStyle=st.ground[0]; c.fillRect(0,0,w,h); c.fillStyle=st.ground[1]; for(let i=0;i<90;i++) c.fillRect(Math.random()*w,Math.random()*h,4,4); },220,220);
  const ground=new T.Mesh(new T.PlaneGeometry(2400,2400),new T.MeshLambertMaterial({map:groundTex})); ground.rotation.x=-Math.PI/2; ground.position.set((minX+maxX)/2,0,(minZ+maxZ)/2); scene.add(ground);
  const h0=Math.atan2(tx[0],tz[0]);
  function flat(w,d,mat,i,y){ const m=new T.Mesh(new T.PlaneGeometry(w,d),mat); m.rotation.order='YXZ'; m.rotation.y=Math.atan2(tx[i],tz[i]); m.rotation.x=-Math.PI/2; m.position.set(px[i],y,pz[i]); scene.add(m); return m; }
  const checker=tex(64,16,(c,w,h)=>{ for(let x=0;x<8;x++) for(let y=0;y<2;y++){ c.fillStyle=(x+y)%2?'#111':'#fff'; c.fillRect(x*8,y*8,8,8); } });
  flat(HALF*2,3,new T.MeshBasicMaterial({map:checker}),0,.08);
  { const mat=new T.MeshLambertMaterial({color:0x33334a});
    for(const s of [-1,1]){ const p=new T.Mesh(new T.BoxGeometry(1,10,1),mat); p.position.set(px[0]+nx[0]*s*(HALF+2),5,pz[0]+nz[0]*s*(HALF+2)); scene.add(p); }
    const bar=new T.Mesh(new T.BoxGeometry(HALF*2+5,2.4,.8),new T.MeshBasicMaterial({map:checker})); bar.position.set(px[0],10,pz[0]); bar.rotation.y=h0; scene.add(bar); }
  const padTex=tex(64,64,(c,w,h)=>{ c.fillStyle='#ff9d3d'; c.fillRect(0,0,w,h); c.strokeStyle='#fff8d0'; c.lineWidth=8; c.lineJoin='miter';
    for(const y of [8,30]){ c.beginPath(); c.moveTo(10,y); c.lineTo(32,y+20); c.lineTo(54,y); c.stroke(); } });
  const pads=[.14,.47,.78].map(f=>{ const i=Math.floor(f*N); flat(9,7,new T.MeshBasicMaterial({map:padTex}),i,.09); return i; });
  { const M=260,trunk=new T.InstancedMesh(new T.CylinderGeometry(.5,.8,3,6),new T.MeshLambertMaterial({color:st.tree[1]}),M),
      crown=new T.InstancedMesh(new T.ConeGeometry(3.2,8,7),new T.MeshLambertMaterial({color:st.tree[0]}),M),d=new T.Object3D(); let n=0;
    for(let k=0;k<4000&&n<M;k++){ const x=minX-120+Math.random()*(maxX-minX+240),z=minZ-120+Math.random()*(maxZ-minZ+240); let ok=true;
      for(let i=0;i<N;i+=3){ const dx=x-px[i],dz=z-pz[i]; if(dx*dx+dz*dz<(LIM+7)*(LIM+7)){ ok=false; break; } }
      if(!ok) continue; const s=.7+Math.random()*.9;
      d.position.set(x,1.5*s,z); d.scale.set(s,s,s); d.rotation.y=Math.random()*6; d.updateMatrix(); trunk.setMatrixAt(n,d.matrix);
      d.position.set(x,6.5*s,z); d.updateMatrix(); crown.setMatrixAt(n,d.matrix); n++; }
    trunk.count=crown.count=n; scene.add(trunk); scene.add(crown); }

  /* ---- 車 ---- */
  const makeKart=L=>{ const g=buildKart(T,L); scene.add(g); return g; };
  const BODIES=['std','sport','buggy'],PARTS=['none','wing','flag','exhaust'],DRIVERS=['helmet','bear','bunny','cap'];
  const lookFor=(i,human)=>(human?(net?net.looks&&net.looks[i]:i===0?opts.look:null):null)||{body:BODIES[i%3],color:COLORS[i],part:PARTS[(i*3+1)%4],driver:DRIVERS[(i+1)%4]};
  const karts=[];
  for(let i=0;i<TOTAL;i++){
    const human=i<humans,slot=human?(TOTAL-humans)+i:i-humans; // 電腦排前面，玩家排後面
    const si=(N-6-Math.floor(slot/2)*6)%N,lane=(slot%2?-1:1)*5;
    const look=lookFor(i,human);
    const k={i,human,color:look.color,remote:human?(!!net&&i!==me):!host,local:human&&(!net||i===me),x:px[si]+nx[si]*lane,z:pz[si]+nz[si]*lane,h:Math.atan2(tx[si],tz[si]),vx:0,vz:0,idx:si,d:lane,prog:si-N,
      boostT:0,drifting:false,driftT:0,gauge:0,stock:0,items:[],toastT:0,toastText:'',spin:0,tumble:0,slowT:0,cloudT:0,shield:0,fin:null,wall:false,left:false,flags:0,
      ai:human?null:{lane:lane*.8,skill:st.ai+(i-humans)*.022,nt:6+Math.random()*8},mesh:makeKart(look)};
    k.name=human?(net?(net.names&&net.names[i])||'玩家'+(i+1):local2?(i+1)+'P':opts.name||'你'):'電腦'+(i-humans+1);
    { // 車頂名牌
      const cv=document.createElement('canvas'); cv.width=256; cv.height=64; const c=cv.getContext('2d');
      c.font='900 36px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=8; c.strokeStyle='#0b0a1c'; c.lineJoin='round';
      c.strokeText(k.name,128,34); c.fillStyle=human?'#fff':'#c9c6e6'; c.fillText(k.name,128,34);
      const sp=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(cv),transparent:true,depthWrite:false,fog:false})); sp.scale.set(5,1.25,1); sp.position.y=4.3; k.mesh.add(sp);
    }
    k.tx=k.x; k.tz=k.z; k.th=k.h; k.v={camH:k.h,fov:62,wrongT:0,lap:1}; karts.push(k);
  }
  const my=karts[me],locals=karts.filter(k=>k.local);
  let t=0,cd=3.4,lastBeep=4,endT=0,ended=false,sendT=0,remain=null,lastTick=99,pip=null,flashT=0;

  /* ---- 道具賽 ---- */
  const boxes=[],bananas=[],missiles=[]; let banN=0,banGeo,banMat,misGeo,misMat;
  if(itemMode){
    const q=tex(64,64,(c,w,h)=>{ const g=c.createLinearGradient(0,0,w,h); g.addColorStop(0,'#ff5d8f'); g.addColorStop(.5,'#ffd23f'); g.addColorStop(1,'#3ddbd9'); c.fillStyle=g; c.fillRect(0,0,w,h);
      c.fillStyle='#fff'; c.font='bold 46px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('?',w/2,h/2+3); });
    const bg=new T.BoxGeometry(2.4,2.4,2.4),bm=new T.MeshBasicMaterial({map:q});
    for(const f of [.08,.3,.55,.8]) for(const lane of [-7,0,7]){ const i=Math.floor(f*N),mesh=new T.Mesh(bg,bm),x=px[i]+nx[i]*lane,z=pz[i]+nz[i]*lane;
      mesh.position.set(x,1.9,z); scene.add(mesh); boxes.push({x,z,mesh,cool:0}); }
    banGeo=new T.ConeGeometry(.8,1.6,8); banMat=new T.MeshLambertMaterial({color:0xffe14a});
    misGeo=new T.ConeGeometry(.5,2.2,8); misMat=new T.MeshBasicMaterial({color:0xff3b3b});
  }
  function addBanana(id,x,z,owner){ if(bananas.some(b=>b.id===id)) return; const mesh=new T.Mesh(banGeo,banMat); mesh.position.set(x,.8,z); scene.add(mesh); bananas.push({id,x,z,owner,age:0,mesh}); }
  function dropBanana(id){ const n=bananas.findIndex(b=>b.id===id); if(n>=0){ scene.remove(bananas[n].mesh); bananas.splice(n,1); } }
  function launch(from,to){ const mesh=new T.Mesh(misGeo,misMat); scene.add(mesh); missiles.push({from,to,t:0,mesh}); }
  // 水球：往車頭方向丟出去，落地後留下一灘水花，碰到的車會彈起來翻滾（不鎖定目標，丟的人自己不會中）
  const waters=[],W_FLY=.8,W_STAY=2.6,watMat=new T.MeshBasicMaterial({color:0x4fb4ff,transparent:true,opacity:.55,depthWrite:false});
  function addWater(id,x,z,h,owner,dist){ if(waters.some(w=>w.id===id)) return; const mesh=new T.Mesh(fxGeo,watMat); mesh.position.set(x,1.5,z); scene.add(mesh);
    waters.push({id,x0:x,z0:z,x,z,h,owner,dist,age:0,landed:false,mesh}); }
  const fx=[],fxGeo=new T.SphereGeometry(1,12,8);
  function burst(x,z,color,size){ const m=new T.Mesh(fxGeo,new T.MeshBasicMaterial({color,transparent:true,opacity:.7,depthWrite:false})); m.position.set(x,1.3,z); scene.add(m); fx.push({m,t:0,size}); }
  function toast(k,text){ if(k&&k.local){ k.toastText=text; k.toastT=2.4; } }
  // 命中由被打的那台車的主人判定，再通知所有人播特效
  function hit(k,sec,owner,kind){
    const blocked=k.shield>0?1:0;
    if(blocked){ k.shield=0; if(k.local) env.sfx('item'); } else { k.spin=sec; if(kind==='water') k.tumble=sec; k.vx*=.3; k.vz*=.3; k.boostT=0; if(k.local) env.sfx('hurt'); }
    hitEvent(k.i,owner,kind,blocked); if(net) net.send({hit:[k.i,owner,kind,blocked]});
  }
  // 烏雲、閃電：對施放者以外的所有車生效，各台車由自己的主人套用
  function applyGlobal(kind,o){
    const O=karts[o],what=INAME[kind]; if(kind==='bolt'){ flashT=.3; env.sfx('boom'); }
    for(const k of karts){ if(k.remote||k.left||k.i===o||k.fin!=null) continue;
      if(k.shield>0){ k.shield=0; toast(k,'護盾擋下了'+what); continue; }
      if(kind==='bolt'){ k.slowT=3; k.boostT=0; } else k.cloudT=4.5;
      toast(k,'被 '+(O?O.name:'')+' 的'+what+(kind==='bolt'?'擊中，減速中':'遮住視線')); if(k.local) env.sfx('hurt'); }
  }
  function hitEvent(v,o,kind,blocked){
    const V=karts[v],O=karts[o]; if(!V) return; const what=INAME[kind]||'道具',other=O&&O!==V;
    burst(V.x,V.z,blocked?0x66e0ff:kind==='missile'?0xff5533:kind==='water'?0x4fb4ff:0xffe14a,blocked?4:6);
    toast(V,blocked?'護盾擋下了'+what:other?'被 '+O.name+' 的'+what+'打中':'踩到自己的'+what);
    if(other&&O.local){ toast(O,blocked?V.name+' 用護盾擋下了':'你的'+what+'打中 '+V.name); env.sfx('item');
      if(!local2) pip={k:V,t:2.8,text:V.name+(blocked?' 擋下了':' 中了')+what}; }
  }
  function useItem(k){
    const it=k.items[0];
    if(it==='missile'){ let best=null; for(const q of karts){ if(q===k||q.left||q.fin!=null) continue; const g=q.prog-k.prog; if(g>0&&(!best||g<best.prog-k.prog)) best=q; }
      if(!best){ if(k.local&&!k.ai) env.sfx('bump'); return false; }
      launch(k.i,best.i); if(net) net.send({mis:[k.i,best.i]}); burst(k.x,k.z,0xff5533,3); toast(k,'飛彈鎖定 '+best.name); if(k.local) env.sfx('place'); }
    else if(it==='nitro'){ k.boostT=2.8; burst(k.x-Math.sin(k.h)*2,k.z-Math.cos(k.h)*2,0xffa41a,3.5); toast(k,'氮氣加速！'); if(k.local) env.sfx('boost'); }
    else if(it==='banana'){ const id=k.i+'-'+(banN++),x=r2(k.x-Math.sin(k.h)*3.6),z=r2(k.z-Math.cos(k.h)*3.6); addBanana(id,x,z,k.i); if(net) net.send({ban:[id,x,z,k.i]}); burst(x,z,0xffe14a,2.5); if(k.local) env.sfx('place'); }
    else if(it==='cloud'||it==='bolt'){ applyGlobal(it,k.i); if(net) net.send({glob:[it,k.i]}); burst(k.x,k.z,it==='bolt'?0xffe14a:0x3a3d4d,5); toast(k,it==='bolt'?'閃電！其他人減速':'烏雲！遮住其他人的視線'); }
    else if(it==='water'){ const id=k.i+'w'+(banN++),x=r2(k.x),z=r2(k.z),h=r2(k.h),dist=Math.round(34+Math.hypot(k.vx,k.vz)*.9);
      addWater(id,x,z,h,k.i,dist); if(net) net.send({wat:[id,x,z,h,k.i,dist]}); toast(k,'丟出水球'); if(k.local) env.sfx('place'); }
    else { k.shield=8; burst(k.x,k.z,0x66e0ff,4); toast(k,'護盾啟動，可擋一次攻擊'); if(k.local) env.sfx('item'); }
    if(it==='banana') toast(k,'放下香蕉');
    k.items.shift(); return true;
  }

  function locate(k){
    let best=k.idx,bd=1e9;
    for(let s=-12;s<=24;s++){ const j=((k.idx+s)%N+N)%N,dx=k.x-px[j],dz=k.z-pz[j],d=dx*dx+dz*dz; if(d<bd){bd=d;best=j;} }
    let delta=best-k.idx; if(delta>N/2) delta-=N; if(delta<-N/2) delta+=N;
    k.prog+=delta; k.idx=best; k.d=(k.x-px[best])*nx[best]+(k.z-pz[best])*nz[best];
  }
  function drive(k,inp,dt){
    const mine=k.local,g0=9*st.grip;
    let fx=Math.sin(k.h),fz=Math.cos(k.h),vf=k.vx*fx+k.vz*fz;
    if(!k.drifting&&inp.drift&&inp.steer&&vf>24){ k.drifting=true; k.driftT=0; }
    if(k.drifting){ k.driftT+=dt; if(!inp.drift||vf<12){ k.drifting=false; if(k.driftT>.6){ k.boostT=Math.max(k.boostT,.55); if(mine) env.sfx('boost'); } } }
    k.h+=inp.steer*1.9*Math.min(1,Math.abs(vf)/14)*(k.drifting?1.55:1)*(vf<0?-1:1)*dt;
    fx=Math.sin(k.h); fz=Math.cos(k.h); const lx=fz,lz=-fx;
    vf=k.vx*fx+k.vz*fz; let vl=k.vx*lx+k.vz*lz;
    const off=Math.abs(k.d)>HALF+.5;
    let max=(k.boostT>0?MAXB:MAX)*(inp.max||1)*(k.slowT>0?.5:1); if(off) max=Math.min(max,30);
    if(k.slowT>0) k.slowT-=dt; if(k.cloudT>0) k.cloudT-=dt;
    if(inp.gas&&vf<max) vf=Math.min(max,vf+(k.boostT>0?80:36)*dt);
    if(inp.brake){ vf-=(vf>0?70:26)*dt; if(vf<-16) vf=-16; }
    if(!inp.gas&&!inp.brake) vf-=vf*.6*dt;
    if(vf>max) vf-=Math.min(vf-max,(off?60:25)*dt);
    const slide=Math.abs(vl);
    if(k.drifting){ vf-=slide*.2*dt; k.gauge+=itemMode?0:slide*dt*.024;
      if(k.gauge>=1){ if(k.stock<2){ k.stock++; k.gauge=0; if(mine) env.sfx('item'); } else k.gauge=1; } }
    vl*=Math.exp(-(k.drifting?g0*.17:g0)*dt);
    k.vx=fx*vf+lx*vl; k.vz=fz*vf+lz*vl; k.x+=k.vx*dt; k.z+=k.vz*dt;
    if(k.boostT>0) k.boostT-=dt;
    if(inp.nitro&&k.stock>0&&k.boostT<=.3){ k.stock--; k.boostT=2.8; if(mine) env.sfx('boost'); }
    locate(k);
    if(Math.abs(k.d)>LIM){ const s=Math.sign(k.d),j=k.idx,over=Math.abs(k.d)-LIM;
      k.x-=nx[j]*over*s; k.z-=nz[j]*over*s; k.d=LIM*s;
      const vn=k.vx*nx[j]+k.vz*nz[j]; if(vn*s>0){ k.vx-=nx[j]*vn; k.vz-=nz[j]*vn; }
      if(!k.wall){ k.vx*=.7; k.vz*=.7; if(mine) env.sfx('bump'); } k.wall=true;
    } else k.wall=false;
    for(const p of pads){ let dd=k.idx-p; if(dd>N/2) dd-=N; if(dd>=-2&&dd<=2&&Math.abs(k.d)<5&&k.boostT<1){ k.boostT=1.3; if(mine) env.sfx('boost'); } }
    if(itemMode){
      for(const b of boxes){ if(b.cool>0) continue; const dx=k.x-b.x,dz=k.z-b.z;
        if(dx*dx+dz*dz<10){ // 最多留兩個，滿了就丟掉最舊的
          const got=ITEMS[(Math.random()*ITEMS.length)|0]; k.items.push(got); const old=k.items.length>2?k.items.shift():null;
          toast(k,'獲得 '+INAME[got]+(old?'（丟掉 '+INAME[old]+'）':'')); burst(b.x,b.z,0xffffff,3);
          b.cool=4; b.mesh.visible=false; if(mine) env.sfx('item'); break; } }
      for(let n=bananas.length-1;n>=0;n--){ const b=bananas[n]; if(b.owner===k.i&&b.age<.6) continue; const dx=k.x-b.x,dz=k.z-b.z;
        if(dx*dx+dz*dz<6){ const id=b.id,ow=b.owner; dropBanana(id); if(net) net.send({banx:id}); hit(k,1,ow,'banana'); } }
      if(k.spin<=0) for(const w of waters){ if(!w.landed||w.owner===k.i) continue; const dx=k.x-w.x,dz=k.z-w.z; if(dx*dx+dz*dz<46){ hit(k,1.7,w.owner,'water'); break; } }
      if(inp.nitro&&k.items.length) useItem(k);
      if(k.shield>0) k.shield-=dt;
    }
    k.flags=(k.boostT>0?1:0)|(k.drifting?2:0)|(k.shield>0?4:0)|(k.spin>0?8:0)|(k.tumble>0?16:0)|(k.slowT>0?32:0)|(k.cloudT>0?64:0);
  }
  const inp={steer:0,gas:false,brake:false,drift:false,nitro:false,max:1};
  function aiInput(k,dt){
    const a=k.ai,spd=Math.hypot(k.vx,k.vz),j=(k.idx+6+Math.floor(spd*.22))%N;
    const diff=wrap(Math.atan2(px[j]+nx[j]*a.lane-k.x,pz[j]+nz[j]*a.lane-k.z)-k.h);
    let cmax=0; for(let s=4;s<36;s+=3){ const c=Math.abs(curv[(k.idx+s)%N]); if(c>cmax) cmax=c; }
    let lead=-1e9; for(const q of karts) if(q.human&&!q.left) lead=Math.max(lead,q.prog);
    const gap=k.prog-lead,band=gap>40?.93:gap<-40?1.07:1;
    const vt=Math.min(MAX*a.skill*band,1.75/Math.max(cmax,.001)*(st.grip<1?.75:1));
    inp.steer=clamp(diff*3,-1,1); inp.gas=spd<vt; inp.brake=spd>vt+8; inp.drift=false; inp.nitro=false; inp.max=a.skill*band;
    if(k.cloudT>0){ inp.steer=clamp(inp.steer+Math.sin(t*7+k.i)*.6,-1,1); inp.max*=.85; } // 電腦被烏雲遮住時會開得歪歪的
    a.nt-=dt; if(!itemMode&&a.nt<=0&&cmax<.008&&k.fin==null){ k.boostT=2; a.nt=9+Math.random()*10; }
    if(itemMode&&k.items.length&&k.fin==null){ a.it=(a.it==null?1+Math.random()*3:a.it)-dt; if(a.it<=0){ inp.nitro=false; a.it=useItem(k)?null:1.5; } }
  }
  function humanInput(k){
    const K=env.keys; inp.max=1;
    if(local2){ // 1P 用 WASD（左半畫面），2P 用方向鍵（右半畫面）；不用 Ctrl，避免 Ctrl+W 關掉分頁
      if(k.i===0){ inp.steer=(K.KeyA?1:0)-(K.KeyD?1:0); inp.brake=!!K.KeyS; inp.gas=!!K.KeyW; inp.drift=!!K.ShiftLeft; inp.nitro=env.hit('KeyQ')||env.hit('KeyE'); }
      else { inp.steer=(K.ArrowLeft?1:0)-(K.ArrowRight?1:0); inp.brake=!!K.ArrowDown; inp.gas=!!K.ArrowUp; inp.drift=!!(K.ShiftRight||K.Slash); inp.nitro=env.hit('Enter')||env.hit('NumpadEnter'); }
      return; }
    inp.steer=(K.ArrowLeft?1:0)-(K.ArrowRight?1:0);
    inp.brake=!!K.ArrowDown; inp.gas=env.touch?!inp.brake:!!K.ArrowUp;
    inp.drift=!!(K.ShiftLeft||K.ShiftRight||K.Space); inp.nitro=env.hit('ControlLeft')||env.hit('ControlRight')||env.hit('KeyX');
  }
  function pack(k){ return k.remote?[k.i,r2(k.tx),r2(k.tz),r2(k.th),r2(k.vx),r2(k.vz),Math.round(k.prog),k.flags,k.fin]
    :[k.i,r2(k.x),r2(k.z),r2(k.h),r2(k.vx),r2(k.vz),Math.round(k.prog),k.flags,k.fin]; }
  function applyRemote(a){ const k=karts[a[0]]; if(!k||!k.remote) return; k.tx=a[1];k.tz=a[2];k.th=a[3];k.vx=a[4];k.vz=a[5];k.prog=a[6];k.flags=a[7];k.fin=a[8]; }
  function gone(i){ const k=karts[i]; if(k){ k.left=true; k.mesh.visible=false; } }
  if(net){
    net.onmsg=m=>{ if(m.k) applyRemote(m.k); if(m.ks) for(const a of m.ks) if(a[0]!==me) applyRemote(a); if(m.gone!=null) gone(m.gone);
      if(itemMode&&(m.ban||m.banx||m.mis||m.hit||m.wat||m.glob)){ if(net.host) net.send(m);
        if(m.glob&&karts[m.glob[1]]&&karts[m.glob[1]].remote) applyGlobal(m.glob[0],m.glob[1]);
        if(m.wat) addWater(m.wat[0],m.wat[1],m.wat[2],m.wat[3],m.wat[4],m.wat[5]);
        if(m.hit&&karts[m.hit[0]]&&karts[m.hit[0]].remote) hitEvent(m.hit[0],m.hit[1],m.hit[2],m.hit[3]);
        if(m.ban) addBanana(m.ban[0],m.ban[1],m.ban[2],m.ban[3]); if(m.banx) dropBanana(m.banx);
        if(m.mis&&karts[m.mis[0]]&&karts[m.mis[1]]&&karts[m.mis[0]].remote) launch(m.mis[0],m.mis[1]); } };
    net.onleave=i=>{ gone(i); net.send({gone:i}); };
  }
  function rankOf(k){ let r=1; for(const q of karts){ if(q===k||q.left) continue;
    if(k.fin!=null){ if(q.fin!=null&&q.fin<k.fin) r++; } else if(q.fin!=null||q.prog>k.prog) r++; } return r; }

  /* ---- 引擎聲 ---- */
  let osc=null,eg=null;
  { const ac=env.audio(),out=env.out(); if(ac&&out){ try{ osc=ac.createOscillator(); osc.type='sawtooth'; const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=520;
      eg=ac.createGain(); eg.gain.value=.022; osc.connect(lp); lp.connect(eg); eg.connect(out); osc.start(); }catch(e){ osc=null; } } }

  function update(dt){
    if(cd>0){ cd-=dt; const c=Math.ceil(cd); if(c<lastBeep&&c>=1&&c<=3){ lastBeep=c; env.sfx('beep'); } if(cd<=0) env.sfx('go'); }
    else {
      t+=dt;
      for(const k of karts){
        if(k.left) continue;
        if(k.remote){ k.tx+=k.vx*dt; k.tz+=k.vz*dt; const f=Math.min(1,dt*10); k.x+=(k.tx-k.x)*f; k.z+=(k.tz-k.z)*f; k.h+=wrap(k.th-k.h)*f; continue; }
        if(k.ai) aiInput(k,dt); else humanInput(k);
        if(k.tumble>0) k.tumble-=dt;
        if(k.spin>0){ k.spin-=dt; inp.steer=0; inp.gas=inp.brake=inp.drift=inp.nitro=false; }
        drive(k,inp,dt);
        if(k.fin==null&&k.prog>=LAPS*N){ k.fin=t; if(k.local){ env.sfx('win'); k.ai={lane:0,skill:.6,nt:1e9}; } }
      }
      // 車與車互撞：只推自己算的車
      for(let a=0;a<TOTAL;a++) for(let b=a+1;b<TOTAL;b++){ const A=karts[a],B=karts[b]; if(A.left||B.left||(A.remote&&B.remote)) continue;
        const dx=B.x-A.x,dz=B.z-A.z,d=Math.hypot(dx,dz); if(d>2.7||d<.001) continue; const p=(2.7-d)/d,wa=A.remote?0:(B.remote?1:.5),wb=B.remote?0:(A.remote?1:.5);
        A.x-=dx*p*wa; A.z-=dz*p*wa; B.x+=dx*p*wb; B.z+=dz*p*wb; }
      for(const k of locals){ const v=k.v,lap=clamp(Math.floor(k.prog/N)+1,1,LAPS); if(lap>v.lap&&k.fin==null){ v.lap=lap; env.sfx('lap'); }
        const dot=Math.sin(k.h)*tx[k.idx]+Math.cos(k.h)*tz[k.idx]; v.wrongT=dot<-.3&&Math.hypot(k.vx,k.vz)>8?v.wrongT+dt:0; }
      if(!local2&&env.hit('KeyR')&&my.fin==null){ const j=my.idx; my.x=px[j]; my.z=pz[j]; my.h=Math.atan2(tx[j],tz[j]); my.vx=my.vz=0; }
      let first=null; for(const k of karts) if(!k.left&&k.fin!=null&&(first==null||k.fin<first)) first=k.fin;
      if(first!=null&&!ended){
        remain=Math.max(0,15-(t-first));
        const c2=Math.ceil(remain); if(c2<lastTick&&c2>=1&&c2<=5) env.sfx('beep'); lastTick=c2;
        if(karts.every(k=>k.left||!k.human||k.fin!=null)) endT+=dt; // 真人都跑完就不用等滿 15 秒
        if(remain<=0||endT>1.6){ ended=true; awards(); }
      }
    }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/15;
      if(net.host) net.send({ks:karts.filter(k=>!k.left).map(pack)}); else net.send({k:pack(my)}); } }
    if(osc){ const s=Math.hypot(my.vx,my.vz); osc.frequency.value=55+s*2.6+(my.boostT>0?40:0); }
    if(itemMode){
      for(const b of boxes){ b.mesh.rotation.y+=dt*2; if(b.cool>0){ b.cool-=dt; if(b.cool<=0) b.mesh.visible=true; } }
      for(let n=waters.length-1;n>=0;n--){ const w=waters[n]; w.age+=dt; const u=Math.min(1,w.age/W_FLY);
        w.x=w.x0+Math.sin(w.h)*w.dist*u; w.z=w.z0+Math.cos(w.h)*w.dist*u;
        if(u<1){ w.mesh.position.set(w.x,1.5+Math.sin(u*Math.PI)*4.5,w.z); w.mesh.scale.setScalar(1.4); }
        else { if(!w.landed){ w.landed=true; burst(w.x,w.z,0x4fb4ff,8); } const r=6.2+Math.sin(w.age*9)*.4; w.mesh.position.set(w.x,.8,w.z); w.mesh.scale.set(r,1.2,r); }
        if(w.age>W_FLY+W_STAY){ scene.remove(w.mesh); waters.splice(n,1); } }
      for(const b of bananas){ b.age+=dt; b.mesh.scale.setScalar(Math.min(1,b.age*5)); b.mesh.rotation.y+=dt*3; }
      for(let n=missiles.length-1;n>=0;n--){ const m=missiles[n],A=karts[m.from],B=karts[m.to]; m.t+=dt; const u=Math.min(1,m.t/.9);
        m.mesh.position.set(A.x+(B.x-A.x)*u,1.4+Math.sin(u*Math.PI)*3,A.z+(B.z-A.z)*u);
        if(Math.floor(m.t/.1)!==Math.floor((m.t-dt)/.1)) burst(m.mesh.position.x,m.mesh.position.z,0xffaa55,1.3);
        if(u>=1){ scene.remove(m.mesh); missiles.splice(n,1); if(!B.remote) hit(B,1.3,m.from,'missile'); } }
    }
    for(let n=fx.length-1;n>=0;n--){ const f=fx[n]; f.t+=dt; const u=f.t/.5; f.m.scale.setScalar(.5+u*f.size); f.m.material.opacity=.7*(1-u);
      if(u>=1){ scene.remove(f.m); f.m.material.dispose(); fx.splice(n,1); } }
    for(const k of locals) if(k.toastT>0) k.toastT-=dt;
    if(flashT>0) flashT-=dt;
    if(pip){ pip.t-=dt; if(pip.t<=0) pip=null; }
    for(const k of karts){ const air=k.flags&16; k.mesh.position.set(k.x,air?Math.abs(Math.sin(t*5))*3.2+.6:0,k.z); k.mesh.rotation.x=air?t*11:0; k.mesh.rotation.y=k.h+((k.flags&8)&&!air?t*16:0); k.mesh.userData.flame.visible=!!(k.flags&1); { const sp=Math.hypot(k.vx,k.vz)*dt*2; for(const wl of k.mesh.userData.wheels) wl.rotation.x+=sp; } k.mesh.userData.shield.visible=!!(k.flags&4); k.mesh.userData.cloud.visible=!!(k.flags&64); k.mesh.userData.bolt.visible=!!(k.flags&32)&&Math.floor(t*8)%2===0; }
    for(const k of locals){ const v=k.v; v.camH+=wrap(k.h-v.camH)*Math.min(1,dt*5); v.fov+=((k.boostT>0?74:62)-v.fov)*Math.min(1,dt*4); }
  }

  const rankSort=(a,b)=>(a.fin!=null?a.fin-1e6:-a.prog)-(b.fin!=null?b.fin-1e6:-b.prog);
  function awards(){
    const order=karts.filter(q=>!q.left).sort(rankSort),single=!net&&!local2,r=order.indexOf(my)+1,ok=r<=3,stage=opts.stage||0;
    const time=q=>q.fin!=null?fmtTime(q.fin):'未完賽',esc=v=>String(v).replace(/[<>&]/g,'');
    env.sfx(local2||ok?'win':'lose');
    const pod=[1,0,2].filter(n=>order[n]).map(n=>'<div class="pod p'+(n+1)+'"><b>'+esc(order[n].name)+'</b><span>'+time(order[n])+'</span><i style="background:'+order[n].color+'">'+(n+1)+'</i></div>').join('');
    const rest=order.slice(3).map((q,n)=>'<li>第 '+(n+4)+' 名　'+esc(q.name)+'　'+time(q)+'</li>').join('');
    env.end({title:'頒獎',html:'<div class="podium">'+pod+'</div>'+(rest?'<ul class="rest">'+rest+'</ul>':''),
      text:local2?'':'你是第 '+r+' 名'+(single?(ok?'，過關！':'，跑進前 3 名才算過關。'):'。'),
      score:single&&ok?stage+1:null,next:single&&ok&&stage<STAGES.length-1});
  }

  function draw(){
    const c=hud,n=locals.length,side=vw>=vh;
    c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,vw,vh);
    renderer.setScissorTest(n>1);
    locals.forEach((k,i)=>{
      // 分割畫面：橫向時左右各半，直向時上下各半
      const w=n>1&&side?vw/2:vw,h=n>1&&!side?vh/2:vh,x=n>1&&side?i*w:0,y=n>1&&!side?i*h:0,v=k.v;
      renderer.setViewport(x,vh-y-h,w,h); if(n>1) renderer.setScissor(x,vh-y-h,w,h);
      const sx=Math.sin(v.camH),cz=Math.cos(v.camH);
      cam.aspect=w/h; cam.fov=v.fov; cam.updateProjectionMatrix();
      cam.position.set(k.x-sx*10.5,5.4,k.z-cz*10.5); cam.lookAt(k.x+sx*6,1.6,k.z+cz*6);
      renderer.render(scene,cam);
      c.save(); c.translate(x,y); c.beginPath(); c.rect(0,0,w,h); c.clip(); drawHud(k,w,h); c.restore();
    });
    if(n>1){ c.fillStyle='#0b0a1c'; if(side) c.fillRect(vw/2-2,0,4,vh); else c.fillRect(0,vh/2-2,vw,4); }
    if(pip&&n===1){ // 右下角小視窗：自己的道具打中誰
      const pw=Math.max(150,Math.min(260,vw*.27)),ph=pw*.62,x0=vw-pw-10,y0=vh-ph-10,V=pip.k;
      renderer.setScissorTest(true); renderer.setViewport(x0,10,pw,ph); renderer.setScissor(x0,10,pw,ph);
      cam.aspect=pw/ph; cam.fov=55; cam.updateProjectionMatrix(); cam.position.set(V.x+7,5.5,V.z+7); cam.lookAt(V.x,1.2,V.z);
      renderer.render(scene,cam); renderer.setScissorTest(false);
      c.strokeStyle='#ffd23f'; c.lineWidth=3; c.strokeRect(x0,y0,pw,ph); c.fillStyle='rgba(11,10,28,.75)'; c.fillRect(x0,y0+ph-22,pw,22);
      c.fillStyle='#fff'; c.textAlign='center'; c.textBaseline='middle'; c.font='700 13px '+TC; c.fillText(pip.text,x0+pw/2,y0+ph-10);
    }
  }
  function drawHud(k,w,h){
    const c=hud,s=clamp(w/560,.62,1),v=k.v;
    if(k.boostT>0){ c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=2;
      for(let i=0;i<26;i++){ const a=(i*2.399+t*3)%6.283,r1=Math.max(w,h)*(.36+(i%5)*.03),r3=r1+60+(i%3)*30;
        c.beginPath(); c.moveTo(w/2+Math.cos(a)*r1,h/2+Math.sin(a)*r1); c.lineTo(w/2+Math.cos(a)*r3,h/2+Math.sin(a)*r3); c.stroke(); } }
    const panel=(x,y,pw,ph)=>{ c.fillStyle='rgba(11,10,28,.62)'; c.fillRect(x,y,pw,ph); };
    c.textBaseline='middle';
    // 左上：圈數與名次
    panel(10,10,150*s,58*s); c.textAlign='left'; c.fillStyle='#aaa4d8'; c.font='700 '+13*s+'px '+TC;
    c.fillText('圈數',20,10+18*s); c.fillText('名次',20,10+42*s);
    c.fillStyle='#fff'; c.font=13*s+'px '+PIX;
    const live=karts.filter(q=>!q.left).length;
    c.fillText(clamp(Math.floor(k.prog/N)+1,1,LAPS)+'/'+LAPS,20+48*s,10+19*s); c.fillStyle='#ffd23f'; c.fillText(rankOf(k)+'/'+live,20+48*s,10+43*s);
    if(local2){ c.fillStyle=k.color; c.font=12*s+'px '+PIX; c.fillText((k.i+1)+'P',20+112*s,10+19*s); }
    // 左側：所有人的即時名次
    const order=karts.filter(q=>!q.left).sort((a,b)=>(a.fin!=null?a.fin-1e6:-a.prog)-(b.fin!=null?b.fin-1e6:-b.prog)),rh=20*s,ly=10+66*s;
    order.forEach((q,n)=>{ const y=ly+n*(rh+2*s); c.fillStyle=q===k?'rgba(255,210,63,.9)':'rgba(11,10,28,.62)'; c.fillRect(10,y,150*s,rh);
      c.textAlign='left'; c.fillStyle=q===k?'#14122b':'#fff'; c.font=10*s+'px '+PIX; c.fillText(String(n+1),16,y+rh/2+1);
      c.fillStyle=q.color; c.beginPath(); c.arc(16+22*s,y+rh/2,5*s,0,7); c.fill();
      c.fillStyle=q===k?'#14122b':'#fff'; c.font='700 '+13*s+'px '+TC; c.fillText(q.name,16+32*s,y+rh/2+1);
      if(q.fin!=null){ c.textAlign='right'; c.font='700 '+11*s+'px '+TC; c.fillText('完賽',10+146*s,y+rh/2+1); } });
    // 右上：時間與小地圖
    const mw=118*s; panel(w-10-mw,10,mw,26*s+mw); c.textAlign='center'; c.fillStyle='#fff'; c.font=11*s+'px '+PIX; c.fillText(fmtTime(k.fin!=null?k.fin:t),w-10-mw/2,10+14*s);
    const sc=(mw-16)/Math.max(maxX-minX,maxZ-minZ),ox=w-10-mw/2-(minX+maxX)/2*sc,oy=10+26*s+mw/2-(minZ+maxZ)/2*sc;
    c.strokeStyle='#f4f0ff'; c.lineWidth=3; c.beginPath(); for(let i=0;i<=N;i+=3){ const j=i%N; if(i) c.lineTo(ox+px[j]*sc,oy+pz[j]*sc); else c.moveTo(ox+px[j]*sc,oy+pz[j]*sc); } c.closePath(); c.stroke();
    for(const q of karts){ if(q.left||q===k) continue; c.fillStyle=q.color; c.beginPath(); c.arc(ox+q.x*sc,oy+q.z*sc,3,0,7); c.fill(); }
    c.fillStyle=k.color; c.strokeStyle='#fff'; c.lineWidth=2; c.beginPath(); c.arc(ox+k.x*sc,oy+k.z*sc,4.5,0,7); c.fill(); c.stroke();
    // 下方：時速與氮氣
    const bw=230*s,bx=w/2-bw/2,by=h-52*s; panel(bx,by,bw,42*s);
    c.textAlign='left'; c.fillStyle='#fff'; c.font=14*s+'px '+PIX; c.fillText(String(Math.round(Math.hypot(k.vx,k.vz)*3)).padStart(3,'0'),bx+10*s,by+22*s);
    c.fillStyle='#aaa4d8'; c.font=8*s+'px '+PIX; c.fillText('KM/H',bx+62*s,by+24*s);
    const gx=bx+104*s,gw=64*s;
    if(itemMode){ // 兩格道具，左邊那格是下一個會用掉的
      for(let n=0;n<2;n++){ const it=k.items[n],x2=gx+n*59*s; c.fillStyle=it&&n===0?'#ffd23f':'#2b2759'; c.fillRect(x2,by+8*s,55*s,26*s);
        c.textAlign='center'; c.fillStyle=it?(n===0?'#14122b':'#fff'):'#6b6799'; c.font='900 '+14*s+'px '+TC; c.fillText(it?INAME[it]:'空',x2+27.5*s,by+22*s); } }
    else { c.fillStyle='#2b2759'; c.fillRect(gx,by+13*s,gw,16*s); c.fillStyle=k.drifting?'#ffd23f':'#3ddbd9'; c.fillRect(gx,by+13*s,gw*clamp(k.gauge,0,1),16*s);
      for(let i=0;i<2;i++){ c.fillStyle=i<k.stock?'#ff9d3d':'#2b2759'; c.beginPath(); c.arc(gx+gw+16*s+i*22*s,by+21*s,8*s,0,7); c.fill(); } }
    c.textAlign='center';
    const big=(txt,col,size,font,yy,wt)=>{ c.fillStyle=col; c.strokeStyle='#0b0a1c'; c.lineWidth=8*s; c.font=(wt||'')+size*s+'px '+font; c.strokeText(txt,w/2,yy); c.fillText(txt,w/2,yy); };
    if(cd>0) big(String(Math.min(3,Math.ceil(cd))),'#ffd23f',72,PIX,h*.38);
    else if(t<.9) big('GO!','#86dc4f',60,PIX,h*.38);
    if(v.wrongT>1) big(local2?'逆向！':'逆向！按 R 回到賽道','#ff5d8f',30,TC,h*.3,'900 ');
    if(k.fin!=null) big('抵達終點','#ffd23f',50,TC,h*.36,'900 ');
    if(k.cloudT>0){ // 烏雲蓋住畫面中央，只留下方和兩側
      c.globalAlpha=Math.min(1,k.cloudT*2)*.93; c.fillStyle='#2c2f3d';
      for(let i=0;i<14;i++){ const a=i*1.7,cx=w*(.14+.72*((i*37)%14)/13)+Math.sin(t*1.3+a)*14,cy=h*(.2+.36*((i*5)%7)/6)+Math.cos(t+a)*8; c.beginPath(); c.arc(cx,cy,Math.min(w,h)*(.13+.03*(i%3)),0,7); c.fill(); }
      c.globalAlpha=1; }
    if(k.slowT>0){ c.strokeStyle='rgba(255,225,74,'+(.5+.3*Math.sin(t*20))+')'; c.lineWidth=10; c.strokeRect(5,5,w-10,h-10); }
    if(flashT>0){ c.fillStyle='rgba(255,255,220,'+Math.min(.8,flashT*3)+')'; c.fillRect(0,0,w,h); }
    if(remain!=null&&!ended){ const tw=190*s; c.fillStyle='rgba(226,59,59,.88)'; c.fillRect(w/2-tw/2,8,tw,30*s); c.fillStyle='#fff'; c.font='900 '+15*s+'px '+TC; c.fillText('比賽結束倒數 '+Math.ceil(remain)+' 秒',w/2,8+16*s); }
    if(k.toastT>0){ c.font='900 '+18*s+'px '+TC; const tw=c.measureText(k.toastText).width+28*s; c.globalAlpha=Math.min(1,k.toastT*2.5);
      c.fillStyle='rgba(11,10,28,.8)'; c.fillRect(w/2-tw/2,h*.2-17*s,tw,34*s); c.fillStyle='#ffd23f'; c.fillText(k.toastText,w/2,h*.2+1); c.globalAlpha=1; }
  }
  return {update,draw,bg:!!net,
    pause(p){ if(eg) eg.gain.value=p?0:.022; },
    destroy(){ ro.disconnect(); if(osc){ try{osc.stop();}catch(e){} } scene.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } }); renderer.dispose(); },
    _dbg:{karts,my,N,px,pz}};
}

function preview(ctx,w,h,L,t){
  ctx.fillStyle='#8fd3ff'; ctx.fillRect(0,0,w,h*.5); ctx.fillStyle='#4c9a3c'; ctx.fillRect(0,h*.5,w,h*.5);
  ctx.fillStyle='#4a4a55'; ctx.beginPath(); ctx.moveTo(w*.42,h*.5); ctx.lineTo(w*.58,h*.5); ctx.lineTo(w*.95,h); ctx.lineTo(w*.05,h); ctx.fill();
  const x=w/2+Math.sin(t*1.5)*10,y=h*.86,s=2.3,B=L.body,ww=B==='buggy'?13:10,wh=B==='buggy'?20:B==='sport'?12:15,bw=B==='sport'?40:36,bh=B==='sport'?13:B==='buggy'?19:16,lift=B==='buggy'?6:0;
  const R=(a,b,c,d)=>ctx.fillRect(x+a*s,y+b*s,c*s,d*s);
  ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x,y+3*s,28*s,6*s,0,0,7); ctx.fill();
  ctx.fillStyle='#22222c'; R(-bw/2-ww+3,-wh+2,ww,wh); R(bw/2-3,-wh+2,ww,wh);
  if(L.part==='exhaust'){ ctx.fillStyle='#b9c2d0'; R(-9,-8-lift,6,7); R(3,-8-lift,6,7); }
  ctx.fillStyle=L.color; R(-bw/2,-bh-2-lift,bw,bh);
  const top=-bh-2-lift;
  if(L.part==='wing'){ ctx.fillStyle='#22222c'; R(-14,top-9,3,9); R(11,top-9,3,9); ctx.fillStyle=L.color; R(-25,top-13,50,5); }
  else if(L.part==='none'){ ctx.fillStyle='#22222c'; R(-21,top-6,42,4); }
  else if(L.part==='flag'){ ctx.fillStyle='#22222c'; R(-17,top-36,1.5,36); ctx.fillStyle='#ffd23f'; R(-15.5,top-36,14,8); }
  ctx.fillStyle='#fff'; R(-7,top-12,14,12);
  const hx=x,hy=y+(top-19)*s,hr=9*s,C=(cx,cy,r,c)=>{ ctx.fillStyle=c; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill(); };
  if(L.driver==='bear'){ C(hx-7*s,hy-7*s,3.6*s,'#9a6a3a'); C(hx+7*s,hy-7*s,3.6*s,'#9a6a3a'); C(hx,hy,hr,'#9a6a3a'); }
  else if(L.driver==='bunny'){ ctx.fillStyle='#fff'; ctx.fillRect(hx-6*s,hy-22*s,4*s,15*s); ctx.fillRect(hx+2*s,hy-22*s,4*s,15*s); C(hx,hy,hr,'#fff'); }
  else if(L.driver==='cap'){ C(hx,hy,hr,'#ffd9a8'); ctx.fillStyle=L.color; ctx.beginPath(); ctx.arc(hx,hy-1*s,hr+.5,Math.PI,0); ctx.fill(); }
  else C(hx,hy,hr,L.color);
}

function thumb(ctx,w,h,t){
  const hz=h*.42;
  ctx.fillStyle='#8fd3ff'; ctx.fillRect(0,0,w,hz); ctx.fillStyle='#4c9a3c'; ctx.fillRect(0,hz,w,h-hz);
  ctx.fillStyle='#2f7d32'; for(let i=0;i<9;i++){ const x=i*62-20; ctx.beginPath(); ctx.moveTo(x,hz); ctx.lineTo(x+22,hz-46); ctx.lineTo(x+44,hz); ctx.fill(); }
  const sway=Math.sin(t*.7)*60;
  for(let i=0;i<40;i++){ const z0=i/40,z1=(i+1)/40,p0=z0*z0,p1=z1*z1,y0=hz+p0*(h-hz),y1=hz+p1*(h-hz);
    const c0=w/2+sway*(1-p0)*(1-p0),c1=w/2+sway*(1-p1)*(1-p1),w0=12+p0*w*.5,w1=12+p1*w*.5,band=Math.floor((1/(z0+.06)+t*5))%2;
    ctx.fillStyle=band?'#e23b3b':'#f4f4f4'; ctx.beginPath(); ctx.moveTo(c0-w0*1.1,y0); ctx.lineTo(c0+w0*1.1,y0); ctx.lineTo(c1+w1*1.1,y1+1); ctx.lineTo(c1-w1*1.1,y1+1); ctx.fill();
    ctx.fillStyle=band?'#4a4a55':'#505060'; ctx.beginPath(); ctx.moveTo(c0-w0,y0); ctx.lineTo(c0+w0,y0); ctx.lineTo(c1+w1,y1+1); ctx.lineTo(c1-w1,y1+1); ctx.fill(); }
  const kart=(x,y,s,col)=>{ ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x,y+3*s,26*s,6*s,0,0,7); ctx.fill();
    ctx.fillStyle='#22222c'; ctx.fillRect(x-25*s,y-12*s,10*s,14*s); ctx.fillRect(x+15*s,y-12*s,10*s,14*s);
    ctx.fillStyle=col; ctx.fillRect(x-18*s,y-18*s,36*s,16*s); ctx.fillStyle='#22222c'; ctx.fillRect(x-21*s,y-26*s,42*s,4*s);
    ctx.fillStyle='#fff'; ctx.fillRect(x-7*s,y-30*s,14*s,12*s); ctx.fillStyle=col; ctx.beginPath(); ctx.arc(x,y-36*s,9*s,0,7); ctx.fill(); };
  kart(w/2+70+Math.sin(t*1.3)*14,h*.66,.6,'#3d8bff'); kart(w/2-90+Math.sin(t*.9)*10,h*.74,.8,'#ffd23f');
  const kx=w/2+Math.sin(t*1.7)*24; ctx.fillStyle='#ffa41a'; ctx.beginPath(); ctx.moveTo(kx-8,h*.9); ctx.lineTo(kx,h*.9+18+Math.sin(t*30)*5); ctx.lineTo(kx+8,h*.9); ctx.fill();
  kart(kx,h*.9,1.25,'#ff4d4d');
}

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).kart={
  name:'跑跑卡丁車',tag:'KART RACE',color:'#ffd23f',online:true,maxPlayers:6,
  desc:'3D 賽車。過彎按住飄移集氣，集滿拿到氮氣瓶，直線衝刺超車。共 6 關，星星越多越難；有競速賽和道具賽，可單人、雙人分割畫面，或開房間連線。',
  goal:'跑 3 圈，前 3 名過關。有人衝線後倒數 15 秒就結束並頒獎。競速賽：過彎按住飄移集氣換氮氣。道具賽：撞問號箱拿道具（氮氣、香蕉、飛彈、護盾、水球、烏雲、閃電），最多留 2 個。',
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  variants:[{id:'speed',label:'競速賽'},{id:'item',label:'道具賽'}],
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['↑ ↓ ← →','油門、煞車、轉向'],['Shift','過彎時按住飄移'],['X','使用氮氣或道具'],['R','回到賽道中央'],['W A S D 左Shift Q','雙人 1P（左半畫面），Q 用氮氣或道具'],['↑ ↓ ← → 右Shift Enter','雙人 2P（右半畫面），Enter 用氮氣或道具']],
  touchHelp:[['◀ ▶','轉向，自動踩油門'],['飄移','過彎時按住'],['使用','用氮氣或道具'],['煞','煞車']],
  touch:{left:[{l:'◀',c:'ArrowLeft'},{l:'▶',c:'ArrowRight'}],right:[{l:'煞',c:'ArrowDown'},{l:'飄移',c:'ShiftLeft'},{l:'使用',c:'KeyX',act:true}]},
  best:{label:'已過關',fmt:v=>v+' / '+STAGES.length,lower:false},
  looks:[{key:'body',label:'車輛',opts:[{id:'std',label:'標準車'},{id:'sport',label:'跑車'},{id:'buggy',label:'越野車'}]},
    {key:'color',label:'車輛顏色',type:'color',opts:['#ff4d4d','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#3d8bff','#c56bff','#ff7eb6']},
    {key:'part',label:'配件',opts:[{id:'none',label:'小尾翼'},{id:'wing',label:'大尾翼'},{id:'flag',label:'旗子'},{id:'exhaust',label:'排氣管'}]},
    {key:'driver',label:'人物',opts:[{id:'helmet',label:'賽車手'},{id:'cap',label:'棒球帽'},{id:'bear',label:'小熊'},{id:'bunny',label:'兔子'}]}],
  preview,viewer,thumb,load,create
};
})();
