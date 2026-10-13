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
const ITEMS=['nitro','banana','missile','shield'],INAME={nitro:'氮氣',banana:'香蕉',missile:'飛彈',shield:'護盾'};
const wrap=a=>{ while(a>Math.PI)a-=2*Math.PI; while(a<-Math.PI)a+=2*Math.PI; return a; };
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const r2=v=>Math.round(v*100)/100;
const fmtTime=t=>{ const m=Math.floor(t/60),s=t-m*60; return m+':'+(s<10?'0':'')+s.toFixed(2); };

function load(){
  if(window.THREE) return Promise.resolve();
  return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=THREE_URL; s.onload=()=>res(); s.onerror=()=>{s.remove();rej(new Error('three'));}; document.head.appendChild(s); });
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
  function makeKart(color){
    const g=new T.Group(),body=new T.MeshLambertMaterial({color}),dark=new T.MeshLambertMaterial({color:0x22222c});
    const box=(w,h,d,m,x,y,z)=>{ const b=new T.Mesh(new T.BoxGeometry(w,h,d),m); b.position.set(x,y,z); g.add(b); return b; };
    box(1.9,.5,3,body,0,.6,0); box(1.3,.36,.9,body,0,.55,1.75); box(2.1,.12,.55,dark,0,1.25,-1.5); box(.15,.5,.15,dark,-.7,.98,-1.5); box(.15,.5,.15,dark,.7,.98,-1.5);
    const wg=new T.CylinderGeometry(.46,.46,.42,12);
    for(const [x,z] of [[-1.12,1.05],[1.12,1.05],[-1.12,-1.05],[1.12,-1.05]]){ const w=new T.Mesh(wg,dark); w.rotation.z=Math.PI/2; w.position.set(x,.46,z); g.add(w); }
    box(.8,.7,.7,new T.MeshLambertMaterial({color:0xffffff}),0,1.15,-.3);
    const head=new T.Mesh(new T.SphereGeometry(.5,12,10),body); head.position.set(0,1.85,-.3); g.add(head);
    box(.62,.22,.3,dark,0,1.85,.12);
    const flame=new T.Mesh(new T.ConeGeometry(.4,2,8),new T.MeshBasicMaterial({color:0xffa41a})); flame.rotation.x=-Math.PI/2; flame.position.set(0,.65,-2.5); flame.visible=false; g.add(flame);
    const sh=new T.Mesh(new T.CircleGeometry(1.9,14),new T.MeshBasicMaterial({color:0,transparent:true,opacity:.28})); sh.rotation.x=-Math.PI/2; sh.position.y=.1; g.add(sh);
    const sd=new T.Mesh(new T.SphereGeometry(2.5,12,10),new T.MeshBasicMaterial({color:0x66e0ff,transparent:true,opacity:.3})); sd.position.y=1; sd.visible=false; g.add(sd);
    g.userData.flame=flame; g.userData.shield=sd; scene.add(g); return g;
  }
  const karts=[];
  for(let i=0;i<TOTAL;i++){
    const human=i<humans,slot=human?(TOTAL-humans)+i:i-humans; // 電腦排前面，玩家排後面
    const si=(N-6-Math.floor(slot/2)*6)%N,lane=(slot%2?-1:1)*5;
    const k={i,human,remote:human?(!!net&&i!==me):!host,local:human&&(!net||i===me),x:px[si]+nx[si]*lane,z:pz[si]+nz[si]*lane,h:Math.atan2(tx[si],tz[si]),vx:0,vz:0,idx:si,d:lane,prog:si-N,
      boostT:0,drifting:false,driftT:0,gauge:0,stock:0,item:null,spin:0,shield:0,fin:null,wall:false,left:false,flags:0,
      ai:human?null:{lane:lane*.8,skill:st.ai+(i-humans)*.022,nt:6+Math.random()*8},mesh:makeKart(COLORS[i])};
    k.name=human?(net?(net.names&&net.names[i])||'玩家'+(i+1):local2?(i+1)+'P':'你'):'電腦'+(i-humans+1);
    { // 車頂名牌
      const cv=document.createElement('canvas'); cv.width=256; cv.height=64; const c=cv.getContext('2d');
      c.font='900 36px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=8; c.strokeStyle='#0b0a1c'; c.lineJoin='round';
      c.strokeText(k.name,128,34); c.fillStyle=human?'#fff':'#c9c6e6'; c.fillText(k.name,128,34);
      const sp=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(cv),transparent:true,depthWrite:false,fog:false})); sp.scale.set(7,1.75,1); sp.position.y=3.7; k.mesh.add(sp);
    }
    k.tx=k.x; k.tz=k.z; k.th=k.h; k.v={camH:k.h,fov:62,wrongT:0,lap:1}; karts.push(k);
  }
  const my=karts[me],locals=karts.filter(k=>k.local);
  let t=0,cd=3.4,lastBeep=4,endT=0,ended=false,sendT=0;

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
  function hit(k,sec){ if(k.shield>0){ k.shield=0; if(k.local) env.sfx('item'); return; } k.spin=sec; k.vx*=.3; k.vz*=.3; k.boostT=0; if(k.local) env.sfx('hurt'); }
  function useItem(k){
    const it=k.item;
    if(it==='missile'){ let best=null; for(const q of karts){ if(q===k||q.left||q.fin!=null) continue; const g=q.prog-k.prog; if(g>0&&(!best||g<best.prog-k.prog)) best=q; }
      if(!best){ if(k.local&&!k.ai) env.sfx('bump'); return false; }
      launch(k.i,best.i); if(net) net.send({mis:[k.i,best.i]}); if(k.local) env.sfx('place'); }
    else if(it==='nitro'){ k.boostT=2.8; if(k.local) env.sfx('boost'); }
    else if(it==='banana'){ const id=k.i+'-'+(banN++),x=r2(k.x-Math.sin(k.h)*3.6),z=r2(k.z-Math.cos(k.h)*3.6); addBanana(id,x,z,k.i); if(net) net.send({ban:[id,x,z]}); if(k.local) env.sfx('place'); }
    else { k.shield=8; if(k.local) env.sfx('item'); }
    k.item=null; return true;
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
    let max=(k.boostT>0?MAXB:MAX)*(inp.max||1); if(off) max=Math.min(max,30);
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
      if(!k.item) for(const b of boxes){ if(b.cool>0) continue; const dx=k.x-b.x,dz=k.z-b.z; if(dx*dx+dz*dz<10){ k.item=ITEMS[(Math.random()*ITEMS.length)|0]; b.cool=4; b.mesh.visible=false; if(mine) env.sfx('item'); break; } }
      for(let n=bananas.length-1;n>=0;n--){ const b=bananas[n]; if(b.owner===k.i&&b.age<.6) continue; const dx=k.x-b.x,dz=k.z-b.z;
        if(dx*dx+dz*dz<6){ const id=b.id; dropBanana(id); if(net) net.send({banx:id}); hit(k,1); } }
      if(inp.nitro&&k.item) useItem(k);
      if(k.shield>0) k.shield-=dt;
    }
    k.flags=(k.boostT>0?1:0)|(k.drifting?2:0)|(k.shield>0?4:0)|(k.spin>0?8:0);
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
    a.nt-=dt; if(!itemMode&&a.nt<=0&&cmax<.008&&k.fin==null){ k.boostT=2; a.nt=9+Math.random()*10; }
    if(itemMode&&k.item&&k.fin==null){ a.it=(a.it==null?1+Math.random()*3:a.it)-dt; if(a.it<=0){ inp.nitro=false; a.it=useItem(k)?null:1.5; } }
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
      if(itemMode&&(m.ban||m.banx||m.mis)){ if(net.host) net.send(m);
        if(m.ban) addBanana(m.ban[0],m.ban[1],m.ban[2],-1); if(m.banx) dropBanana(m.banx);
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
      if(!ended&&locals.every(k=>k.fin!=null)){ endT+=dt; if(endT>1.6){ ended=true;
        if(local2){ const a=karts[0],b=karts[1]; env.sfx('win');
          env.end({title:(a.fin<b.fin?'1P':'2P')+' 獲勝',big:fmtTime(Math.min(a.fin,b.fin)),text:'1P 第 '+rankOf(a)+' 名（'+fmtTime(a.fin)+'），2P 第 '+rankOf(b)+' 名（'+fmtTime(b.fin)+'）。',score:null}); }
        else { const r=rankOf(my),ok=r<=3,single=!net;
          if(!ok) env.sfx('lose');
          env.end({title:r===1?'冠軍！':'第 '+r+' 名',big:fmtTime(my.fin),text:single?(ok?'過關！':'跑進前 3 名才算過關。'):'',
            score:single&&ok?(opts.stage||0)+1:null,next:single&&ok&&(opts.stage||0)<STAGES.length-1}); } } }
    }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/15;
      if(net.host) net.send({ks:karts.filter(k=>!k.left).map(pack)}); else net.send({k:pack(my)}); } }
    if(osc){ const s=Math.hypot(my.vx,my.vz); osc.frequency.value=55+s*2.6+(my.boostT>0?40:0); }
    if(itemMode){
      for(const b of boxes){ b.mesh.rotation.y+=dt*2; if(b.cool>0){ b.cool-=dt; if(b.cool<=0) b.mesh.visible=true; } }
      for(const b of bananas) b.age+=dt;
      for(let n=missiles.length-1;n>=0;n--){ const m=missiles[n],A=karts[m.from],B=karts[m.to]; m.t+=dt; const u=Math.min(1,m.t/.9);
        m.mesh.position.set(A.x+(B.x-A.x)*u,1.4+Math.sin(u*Math.PI)*3,A.z+(B.z-A.z)*u);
        if(u>=1){ scene.remove(m.mesh); missiles.splice(n,1); if(!B.remote) hit(B,1.3); } }
    }
    for(const k of karts){ k.mesh.position.set(k.x,0,k.z); k.mesh.rotation.y=k.h+((k.flags&8)?t*16:0); k.mesh.userData.flame.visible=!!(k.flags&1); k.mesh.userData.shield.visible=!!(k.flags&4); }
    for(const k of locals){ const v=k.v; v.camH+=wrap(k.h-v.camH)*Math.min(1,dt*5); v.fov+=((k.boostT>0?74:62)-v.fov)*Math.min(1,dt*4); }
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
    if(local2){ c.fillStyle=COLORS[k.i]; c.font=12*s+'px '+PIX; c.fillText((k.i+1)+'P',20+112*s,10+19*s); }
    // 左側：所有人的即時名次
    const order=karts.filter(q=>!q.left).sort((a,b)=>(a.fin!=null?a.fin-1e6:-a.prog)-(b.fin!=null?b.fin-1e6:-b.prog)),rh=20*s,ly=10+66*s;
    order.forEach((q,n)=>{ const y=ly+n*(rh+2*s); c.fillStyle=q===k?'rgba(255,210,63,.9)':'rgba(11,10,28,.62)'; c.fillRect(10,y,150*s,rh);
      c.textAlign='left'; c.fillStyle=q===k?'#14122b':'#fff'; c.font=10*s+'px '+PIX; c.fillText(String(n+1),16,y+rh/2+1);
      c.fillStyle=COLORS[q.i]; c.beginPath(); c.arc(16+22*s,y+rh/2,5*s,0,7); c.fill();
      c.fillStyle=q===k?'#14122b':'#fff'; c.font='700 '+13*s+'px '+TC; c.fillText(q.name,16+32*s,y+rh/2+1);
      if(q.fin!=null){ c.textAlign='right'; c.font='700 '+11*s+'px '+TC; c.fillText('完賽',10+146*s,y+rh/2+1); } });
    // 右上：時間與小地圖
    const mw=118*s; panel(w-10-mw,10,mw,26*s+mw); c.textAlign='center'; c.fillStyle='#fff'; c.font=11*s+'px '+PIX; c.fillText(fmtTime(k.fin!=null?k.fin:t),w-10-mw/2,10+14*s);
    const sc=(mw-16)/Math.max(maxX-minX,maxZ-minZ),ox=w-10-mw/2-(minX+maxX)/2*sc,oy=10+26*s+mw/2-(minZ+maxZ)/2*sc;
    c.strokeStyle='#f4f0ff'; c.lineWidth=3; c.beginPath(); for(let i=0;i<=N;i+=3){ const j=i%N; if(i) c.lineTo(ox+px[j]*sc,oy+pz[j]*sc); else c.moveTo(ox+px[j]*sc,oy+pz[j]*sc); } c.closePath(); c.stroke();
    for(const q of karts){ if(q.left||q===k) continue; c.fillStyle=COLORS[q.i]; c.beginPath(); c.arc(ox+q.x*sc,oy+q.z*sc,3,0,7); c.fill(); }
    c.fillStyle=COLORS[k.i]; c.strokeStyle='#fff'; c.lineWidth=2; c.beginPath(); c.arc(ox+k.x*sc,oy+k.z*sc,4.5,0,7); c.fill(); c.stroke();
    // 下方：時速與氮氣
    const bw=230*s,bx=w/2-bw/2,by=h-52*s; panel(bx,by,bw,42*s);
    c.textAlign='left'; c.fillStyle='#fff'; c.font=14*s+'px '+PIX; c.fillText(String(Math.round(Math.hypot(k.vx,k.vz)*3)).padStart(3,'0'),bx+10*s,by+22*s);
    c.fillStyle='#aaa4d8'; c.font=8*s+'px '+PIX; c.fillText('KM/H',bx+62*s,by+24*s);
    const gx=bx+104*s,gw=64*s;
    if(itemMode){ c.fillStyle='#2b2759'; c.fillRect(gx,by+8*s,114*s,26*s); c.textAlign='center'; c.fillStyle=k.item?'#ffd23f':'#6b6799'; c.font='900 '+15*s+'px '+TC; c.fillText(k.item?INAME[k.item]:'沒有道具',gx+57*s,by+22*s); }
    else { c.fillStyle='#2b2759'; c.fillRect(gx,by+13*s,gw,16*s); c.fillStyle=k.drifting?'#ffd23f':'#3ddbd9'; c.fillRect(gx,by+13*s,gw*clamp(k.gauge,0,1),16*s);
      for(let i=0;i<2;i++){ c.fillStyle=i<k.stock?'#ff9d3d':'#2b2759'; c.beginPath(); c.arc(gx+gw+16*s+i*22*s,by+21*s,8*s,0,7); c.fill(); } }
    c.textAlign='center';
    const big=(txt,col,size,font,yy,wt)=>{ c.fillStyle=col; c.strokeStyle='#0b0a1c'; c.lineWidth=8*s; c.font=(wt||'')+size*s+'px '+font; c.strokeText(txt,w/2,yy); c.fillText(txt,w/2,yy); };
    if(cd>0) big(String(Math.min(3,Math.ceil(cd))),'#ffd23f',72,PIX,h*.38);
    else if(t<.9) big('GO!','#86dc4f',60,PIX,h*.38);
    if(v.wrongT>1) big(local2?'逆向！':'逆向！按 R 回到賽道','#ff5d8f',30,TC,h*.3,'900 ');
    if(k.fin!=null) big('抵達終點','#ffd23f',50,TC,h*.36,'900 ');
  }
  return {update,draw,bg:!!net,
    pause(p){ if(eg) eg.gain.value=p?0:.022; },
    destroy(){ ro.disconnect(); if(osc){ try{osc.stop();}catch(e){} } scene.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } }); renderer.dispose(); },
    _dbg:{karts,my,N,px,pz}};
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
  goal:'跑 3 圈，前 3 名過關。競速賽：過彎按住飄移集氣，集滿得到氮氣。道具賽：撞彩色問號箱拿道具（氮氣、香蕉、飛彈、護盾）。',
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  variants:[{id:'speed',label:'競速賽'},{id:'item',label:'道具賽'}],
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['↑ ↓ ← →','油門、煞車、轉向'],['Shift','過彎時按住飄移'],['X','使用氮氣或道具'],['R','回到賽道中央'],['W A S D 左Shift Q','雙人 1P（左半畫面），Q 用氮氣或道具'],['↑ ↓ ← → 右Shift Enter','雙人 2P（右半畫面），Enter 用氮氣或道具']],
  touchHelp:[['◀ ▶','轉向，自動踩油門'],['飄移','過彎時按住'],['使用','用氮氣或道具'],['煞','煞車']],
  touch:{left:[{l:'◀',c:'ArrowLeft'},{l:'▶',c:'ArrowRight'}],right:[{l:'煞',c:'ArrowDown'},{l:'飄移',c:'ShiftLeft'},{l:'使用',c:'KeyX',act:true}]},
  best:{label:'已過關',fmt:v=>v+' / '+STAGES.length,lower:false},
  thumb,load,create
};
})();
