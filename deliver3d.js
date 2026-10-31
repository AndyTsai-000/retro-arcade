// 街頭外送王的 3D 第一人稱畫面（three.js）：規則、車流、碰撞都還在 deliver.js 的 2D 座標算，這裡只負責畫。
// 世界單位＝遊戲單位（眼睛高 14 約 1.3 公尺）；世界 X=M*(x-180)（靠左行駛的國家左右鏡射，文字不鏡射）、Z=-d、往前騎是 -Z。
// 靜態的街景依距離分塊合併成少數幾個網格，車和行人用物件池／InstancedMesh，畫面才跑得動。
(function(){
'use strict';
function make(T,o){ const {W,H,lv,S,M,ROADW,LANE,PAL,shade,hash,hcol,lightOf,crossers,crossPeds,phoneNav,drawLandmark,CAR_COL,SHIRT,SKIN,PANTS,SCOL,BOXC,TC}=o,PI=Math.PI;
  const night=!!S.night,eve=!!S.evening,pal=PAL[S.pal],arc=S.pal==='tw'||S.pal==='th',dim=night?.42:eve?.9:1,sk=night?'night':eve?'eve':'day';
  const SX=x=>M*(x-180),cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k,col=c=>new T.Color(c);
  let Q=1.5; const cv=document.createElement('canvas'),r=new T.WebGLRenderer({canvas:cv,antialias:true}); r.setPixelRatio(1); r.setSize(W*Q,H*Q,false); r.shadowMap.enabled=!night; r.shadowMap.type=T.PCFSoftShadowMap;
  const canv=(w,h,f)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; if(f) f(c.getContext('2d'),w,h); return c; },tex=(c,rep)=>{ const t=new T.CanvasTexture(c); t.anisotropy=8; if(rep) t.wrapS=t.wrapT=T.RepeatWrapping; return t; };
  const scene=new T.Scene(),HZ={day:'#d6dde2',eve:'#efc6a2',night:'#262240'}[sk];
  const SKYC={day:['#3f79b8','#a9c9e2'],eve:['#55608e','#f0a678'],night:['#04071a','#1e1a40']}[sk];
  scene.background=tex(canv(512,256,(c,w,h)=>{ const g=c.createLinearGradient(0,0,0,h*.55); g.addColorStop(0,SKYC[0]); g.addColorStop(.8,SKYC[1]); g.addColorStop(1,HZ); c.fillStyle=g; c.fillRect(0,0,w,h);
    if(night){ c.fillStyle='#fff'; for(let i=0;i<70;i++){ c.globalAlpha=.3+(i%5)*.13; c.fillRect((i*97)%w,(i*53)%(h*.48),1,1); } c.globalAlpha=1; }
    else for(let i=0;i<9;i++){ const x=(i*83)%w,y=14+(i*29)%70; for(let j=0;j<5;j++){ const bx=x+j*14,by=y+(j%2)*3,gg=c.createRadialGradient(bx,by,1,bx,by,22); gg.addColorStop(0,eve?'rgba(255,224,200,.55)':'rgba(255,255,255,.6)'); gg.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=gg; c.fillRect(bx-22,by-14,44,28); } } }));
  scene.fog=new T.Fog(col(HZ),night?260:420,night?1050:1450);
  scene.add(new T.HemisphereLight(night?0x8a90c8:eve?0xffd8c0:0xf0f6ff,night?0x2a2830:0x6a6458,night?.62:.62));
  const sun=new T.DirectionalLight(eve?0xffc090:night?0xb0b8e8:0xfff2dc,night?.22:eve?.72:.82); sun.position.set(-160,eve?110:300,120); if(!night){ sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-300,right:300,top:320,bottom:-320,near:10,far:1100}); sun.shadow.bias=-.0008; } scene.add(sun); scene.add(sun.target);
  const head=new T.SpotLight(0xfff0d0,night?1.15:0,520,.5,.6,1); scene.add(head); scene.add(head.target);

  /* ---------- 貼圖集：窗戶、店面、招牌文字、地上的字（128 格子，招牌用寬的條） ---------- */
  const AW=2048,atlas=canv(AW,AW),ac=atlas.getContext('2d'); ac.fillStyle='#fff'; ac.fillRect(0,0,AW,AW);
  const UV=(x,y,w,h)=>[(x+2)/AW,1-(y+h-2)/AW,(x+w-2)/AW,1-(y+2)/AW],C128=(cx,cy)=>UV(cx*128,cy*128,128,128),WHITE=UV(1980,1980,40,40);
  const rrect=(c,x,y,w,h)=>c.fillRect(x,y,w,h);
  function winTile(cx,kind){ const x=cx*128,y=0; ac.fillStyle='#ffffff'; ac.fillRect(x,y,128,128); ac.fillStyle='rgba(0,0,0,.05)'; for(let i=0;i<14;i++) ac.fillRect(x+(i*37)%128,y+(i*53)%128,2,18+i%3*10); ac.fillStyle='rgba(0,0,0,.25)'; ac.fillRect(x,y+120,128,8);
    const g=ac.createLinearGradient(0,y+22,0,y+92); g.addColorStop(0,'#9db4c8'); g.addColorStop(.55,'#55687c'); g.addColorStop(1,'#35404e'); ac.fillStyle=g; ac.fillRect(x+22,y+22,84,70);
    ac.fillStyle='rgba(255,255,255,.2)'; ac.beginPath(); ac.moveTo(x+70,y+22); ac.lineTo(x+92,y+22); ac.lineTo(x+60,y+92); ac.lineTo(x+38,y+92); ac.fill();
    ac.strokeStyle='#c8ccd0'; ac.lineWidth=4; ac.strokeRect(x+22,y+22,84,70); ac.beginPath(); ac.moveTo(x+64,y+22); ac.lineTo(x+64,y+92); ac.stroke();
    if(kind===1){ ac.strokeStyle='#dcdcd2'; ac.lineWidth=3; for(let i=0;i<6;i++){ ac.beginPath(); ac.moveTo(x+18+i*18.4,y+16); ac.lineTo(x+18+i*18.4,y+98); ac.stroke(); } ac.strokeRect(x+16,y+16,96,82); }
    if(kind===2){ ac.fillStyle='#e0e0d8'; ac.fillRect(x+28,y+98,48,22); ac.fillStyle='#55555a'; ac.beginPath(); ac.arc(x+44,y+109,9,0,7); ac.fill(); }
    if(kind===3){ ac.fillStyle='rgba(0,0,0,.14)'; for(let j=0;j<128;j+=11) for(let i=(j%22?0:9);i<128;i+=18) ac.fillRect(x+i,y+j,17,1.5); ac.fillRect; ac.fillStyle='#35404e'; ac.fillRect(x+22,y+22,84,70); ac.fillStyle='rgba(180,200,215,.5)'; ac.fillRect(x+26,y+26,76,28); } }
  [0,1,2,3].forEach(k=>winTile(k,k));
  // 4 拉下的鐵捲門、5 開著的店（貨架）、6 玻璃櫥窗、7 夜晚亮著的窗、8 磚牆
  { let x=4*128; ac.fillStyle='#a8aaac'; ac.fillRect(x,0,128,128); ac.fillStyle='rgba(0,0,0,.2)'; for(let y=4;y<128;y+=8) ac.fillRect(x,y,128,2);
    x=5*128; ac.fillStyle='#5e5244'; ac.fillRect(x,0,128,128); for(let j=0;j<3;j++){ ac.fillStyle='#3a3026'; ac.fillRect(x,30+j*36,128,5); for(let i=0;i<9;i++){ ac.fillStyle=['#e8c060','#c05040','#4a90c0','#f0f0e0','#70a050','#d0d0d0'][(i*5+j)%6]; ac.fillRect(x+3+i*14,8+j*36,11,22); } }
    x=6*128; const g=ac.createLinearGradient(0,0,0,128); g.addColorStop(0,'#8ea2b4'); g.addColorStop(1,'#2a323c'); ac.fillStyle=g; ac.fillRect(x,0,128,128); ac.fillStyle='rgba(255,255,255,.16)'; ac.beginPath(); ac.moveTo(x+70,0); ac.lineTo(x+110,0); ac.lineTo(x+50,128); ac.lineTo(x+10,128); ac.fill(); ac.fillStyle='#22262c'; ac.fillRect(x+60,0,6,128);
    x=7*128; const g2=ac.createLinearGradient(0,0,0,128); g2.addColorStop(0,'#ffe6a8'); g2.addColorStop(1,'#e8a858'); ac.fillStyle=g2; ac.fillRect(x,0,128,128); ac.fillStyle='rgba(120,70,50,.45)'; ac.fillRect(x,0,38,128);
    x=8*128; ac.fillStyle='#fff'; ac.fillRect(x,0,128,128); ac.fillStyle='rgba(0,0,0,.25)'; for(let j=0;j<128;j+=10){ ac.fillRect(x,j,128,2); for(let i=(j%20?0:12);i<128;i+=24) ac.fillRect(x+i,j,2,10); }
    // 9 夜市攤的燈光圈、10 人孔蓋、11 坑洞、12 水窪、13 柔光圓
    const disc=(cx,f)=>{ const xx=cx*128; ac.clearRect(xx,0,128,128); f(xx+64,64); };
    disc(10,(a,b)=>{ ac.fillStyle='#3a3a40'; ac.beginPath(); ac.arc(a,b,60,0,7); ac.fill(); ac.strokeStyle='#808088'; ac.lineWidth=5; ac.stroke(); ac.strokeStyle='#26262c'; ac.lineWidth=3; for(let i=-40;i<=40;i+=16){ ac.beginPath(); ac.moveTo(a+i,b-44); ac.lineTo(a+i,b+44); ac.stroke(); } });
    disc(11,(a,b)=>{ const gg=ac.createRadialGradient(a,b,10,a,b,62); gg.addColorStop(0,'#101014'); gg.addColorStop(.75,'#1e1e26'); gg.addColorStop(1,'rgba(90,90,102,0)'); ac.fillStyle=gg; ac.beginPath(); ac.ellipse(a,b,62,54,.3,0,7); ac.fill(); });
    disc(12,(a,b)=>{ const gg=ac.createRadialGradient(a,b,6,a,b,62); gg.addColorStop(0,'rgba(170,200,240,.75)'); gg.addColorStop(.8,'rgba(130,170,225,.55)'); gg.addColorStop(1,'rgba(130,170,225,0)'); ac.fillStyle=gg; ac.beginPath(); ac.arc(a,b,62,0,7); ac.fill(); });
    disc(13,(a,b)=>{ const gg=ac.createRadialGradient(a,b,2,a,b,63); gg.addColorStop(0,'rgba(255,255,255,1)'); gg.addColorStop(.35,'rgba(255,255,255,.4)'); gg.addColorStop(1,'rgba(255,255,255,0)'); ac.fillStyle=gg; ac.fillRect(a-64,b-64,128,128); });
    ac.clearRect(14*128,0,128,128); ac.fillStyle='rgba(240,240,236,.82)'; ac.font='900 110px '+TC; ac.textAlign='center'; ac.textBaseline='middle'; ac.fillText(S.pal==='tw'?'慢':S.pal==='th'?'ช้า':'',14*128+64,68); }
  const TILE={win:[C128(0,0),C128(1,0),C128(2,0),C128(3,0)],shutter:C128(4,0),shop:C128(5,0),glass:C128(6,0),lit:C128(7,0),brick:C128(8,0),man:C128(10,0),hole:C128(11,0),puddle:C128(12,0),soft:C128(13,0),slow:C128(14,0)};
  // 橫招牌（256×64）和直招牌（64×256）：每種文字配每種顏色
  const hUV={},vUV={}; { const strs=S.sign; let x=0,y=128; for(const t of strs) for(const sc of pal.sign){ if(x+256>AW){ x=0; y+=64; } ac.fillStyle=sc; ac.fillRect(x,y,256,64); ac.fillStyle='rgba(255,255,255,.14)'; ac.fillRect(x,y,256,10); ac.fillStyle=sc==='#e0e0e0'?'#222':'#fff'; ac.font='900 40px '+TC; ac.textAlign='center'; ac.textBaseline='middle'; ac.fillText(t,x+128,y+34,236); hUV[t+sc]=UV(x,y,256,64); x+=256; }
    x=0; y+=64; for(const t of strs) for(const sc of pal.sign){ if(x+64>AW){ x=0; y+=256; } ac.fillStyle=sc; ac.fillRect(x,y,64,256); ac.strokeStyle='rgba(255,255,255,.75)'; ac.lineWidth=3; ac.strokeRect(x+5,y+5,54,246); ac.fillStyle=sc==='#e0e0e0'?'#222':'#fff'; ac.font='900 40px '+TC; ac.textAlign='center'; ac.textBaseline='middle'; const ch=[...t].slice(0,4); ch.forEach((q,i)=>ac.fillText(q,x+32,y+256*(i+.5)/Math.max(3,ch.length)+2,54)); vUV[t+sc]=UV(x,y,64,256); x+=64; } }
  const atx=tex(atlas);

  /* ---------- 把很多四邊形併成一個網格 ---------- */
  function Bld(){ const p=[],n=[],u=[],c=[]; const me={p,
    quad(a,b,cc,d,uv,color){ const C=color instanceof T.Color?color:col(color||'#fff'),e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],e2=[d[0]-a[0],d[1]-a[1],d[2]-a[2]],nx=e1[1]*e2[2]-e1[2]*e2[1],ny=e1[2]*e2[0]-e1[0]*e2[2],nz=e1[0]*e2[1]-e1[1]*e2[0],l=Math.hypot(nx,ny,nz)||1,U=uv||WHITE;
      const vs=[[a,U[0],U[1]],[b,U[2],U[1]],[cc,U[2],U[3]],[a,U[0],U[1]],[cc,U[2],U[3]],[d,U[0],U[3]]]; for(const [q,uu,vv] of vs){ p.push(q[0],q[1],q[2]); n.push(nx/l,ny/l,nz/l); u.push(uu,vv); c.push(C.r,C.g,C.b); } },
    box(x0,x1,y0,y1,z0,z1,color,top){ const C=color instanceof T.Color?color:col(color); if(x0>x1){ const q=x0; x0=x1; x1=q; } if(z0>z1){ const q=z0; z0=z1; z1=q; }
      me.quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],null,C); me.quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],null,C); me.quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],null,C); me.quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],null,C); me.quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],null,top?col(top):C); me.quad([x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],null,C); },
    geo(g0,m,color){ const g=g0.index?g0.toNonIndexed():g0.clone(); if(m) g.applyMatrix4(m); const P=g.attributes.position,N=g.attributes.normal,C=color instanceof T.Color?color:col(color||'#fff'); for(let i=0;i<P.count;i++){ p.push(P.getX(i),P.getY(i),P.getZ(i)); n.push(N.getX(i),N.getY(i),N.getZ(i)); u.push(WHITE[0],WHITE[1]); c.push(C.r,C.g,C.b); } },
    build(){ const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(p,3)); g.setAttribute('normal',new T.Float32BufferAttribute(n,3)); g.setAttribute('uv',new T.Float32BufferAttribute(u,2)); g.setAttribute('color',new T.Float32BufferAttribute(c,3)); return g; } }; return me; }
  const mats={lit:new T.MeshLambertMaterial({map:atx,vertexColors:true}),glow:new T.MeshBasicMaterial({map:atx,vertexColors:true}),decal:new T.MeshLambertMaterial({map:atx,vertexColors:true,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),
    add:new T.MeshBasicMaterial({map:atx,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),thin:new T.MeshLambertMaterial({vertexColors:true})};
  const chunks=new Map(),CH=480,lst=(d,k)=>{ const id=Math.floor(d/CH); let e=chunks.get(id); if(!e){ e={lit:Bld(),glow:Bld(),decal:Bld(),add:Bld(),thin:Bld(),meshes:[]}; chunks.set(id,e); } return e[k]; };
  // 遊戲座標的小工具：牆（面對馬路）、正對騎士的板子、盒子、地面
  const wallX=(B,x,face,d1,d2,y0,y1,uv,c0)=>{ const X=SX(x),nx=face*M; let a=d1,b=d2; if(nx<0){ a=d2; b=d1; } B.quad([X,y0,-a],[X,y0,-b],[X,y1,-b],[X,y1,-a],uv,c0); }; // face：朝 +x(1) 或 -x(-1)
  const panelD=(B,x0,x1,d,y0,y1,uv,c0,back)=>{ const A=SX(x0),C=SX(x1),l=Math.min(A,C),rr=Math.max(A,C),z=-d; if(!back) B.quad([l,y0,z],[rr,y0,z],[rr,y1,z],[l,y1,z],uv,c0); else B.quad([rr,y0,z],[l,y0,z],[l,y1,z],[rr,y1,z],uv,c0); };
  const boxG=(B,x0,x1,d0,d1,y0,y1,c0,top)=>B.box(SX(x0),SX(x1),y0,y1,-d0,-d1,c0,top);
  const ground=(B,x0,x1,d0,d1,y,uv,c0)=>{ const A=SX(x0),C=SX(x1),l=Math.min(A,C),rr=Math.max(A,C); B.quad([l,y,-d0],[rr,y,-d0],[rr,y,-d1],[l,y,-d1],uv,c0); };
  const shd=(h,k)=>col(shade(h,k));

  /* ---------- 路面 ---------- */
  const asph=S.rain?'#30323a':night?'#2e2e36':S.pal==='us'?'#55555a':'#5c5c60',walkC=night?'#3e3c48':shade(pal.walk,dim);
  const roadT=tex(canv(1024,1024,(c,w,h)=>{ const U=x=>x/360*w,V=d=>h-d/352*h; c.fillStyle=asph; c.fillRect(0,0,w,h);
    for(let i=0;i<26000;i++){ c.fillStyle=i%2?'rgba(255,255,255,.035)':'rgba(0,0,0,.05)'; c.fillRect((i*137.7)%w,(i*71.3)%h,2,2); }
    for(let i=0;i<7;i++){ c.fillStyle=i%2?'rgba(0,0,0,.09)':'rgba(255,255,255,.03)'; c.fillRect((i*311)%w,(i*421)%h,70+i*14,50+i*24); }
    c.strokeStyle='rgba(0,0,0,.3)'; c.lineWidth=1.5; for(let i=0;i<9;i++){ c.beginPath(); let x=(i*191)%w,y=(i*277)%h; c.moveTo(x,y); for(let j=0;j<7;j++){ x+=(j%2?9:-7)+i; y+=18; c.lineTo(x,y); } c.stroke(); }
    for(const lx of LANE){ c.fillStyle='rgba(0,0,0,.075)'; c.fillRect(U(lx-21),0,U(8),h); c.fillRect(U(lx+13),0,U(8),h); }
    c.fillStyle='#e8b020'; c.fillRect(U(140),0,U(2.5),h); c.fillRect(U(145.5),0,U(2.5),h); c.fillStyle='rgba(240,240,236,.85)'; c.fillRect(U(287),0,U(2.5),h);
    c.fillStyle='rgba(240,240,236,.78)'; for(let k=0;k<8;k++){ c.fillRect(U(70.5),V(k*44+22),U(3),22/352*h); c.fillRect(U(214.5),V(k*44+22),U(3),22/352*h); } }),true);
  roadT.wrapS=T.ClampToEdgeWrapping;
  const roadLen=lv.L+3400,road=new T.Mesh(new T.PlaneGeometry(ROADW,roadLen),new T.MeshPhongMaterial({map:roadT,shininess:S.rain?90:6,specular:S.rain?0x667088:0x0c0c0c})); road.rotation.x=-PI/2; road.position.set(0,0,-(lv.L/2)); { const a=road.geometry.attributes.uv; for(let i=0;i<a.count;i++){ const uu=a.getX(i); a.setXY(i,M>0?uu:1-uu,a.getY(i)*roadLen/352); } } road.receiveShadow=true; scene.add(road);
  const brickT=tex(canv(256,256,(c,w,h)=>{ c.fillStyle='#fff'; c.fillRect(0,0,w,h); c.fillStyle='rgba(0,0,0,.14)'; for(let y=0;y<h;y+=32){ c.fillRect(0,y,w,3); for(let x=(y%64?0:32);x<w;x+=64) c.fillRect(x,y,3,32); } for(let i=0;i<4000;i++){ c.fillStyle=i%2?'rgba(0,0,0,.04)':'rgba(255,255,255,.08)'; c.fillRect((i*37.7)%w,(i*91.3)%h,2,2); } }),true); brickT.repeat.set(1,1);
  const far=new T.Mesh(new T.PlaneGeometry(6000,lv.L+6000),new T.MeshLambertMaterial({color:col(shade(pal.walk,night?.3:dim*.72))})); far.rotation.x=-PI/2; far.position.set(0,-.3,-lv.L/2); far.receiveShadow=true; scene.add(far);
  const inI=d=>lv.inter.find(I=>d>I.d-38&&d<I.d+128);
  // 人行道：路口之間一段一段，有路緣和磚紋
  const swB=Bld(); { const segs=[]; let a=-900; for(const I of lv.inter){ segs.push([a,I.d-38]); a=I.d+128; } segs.push([a,lv.L+2400]); const red=S.pal==='tw';
    for(const [d0,d1] of segs) for(const sd of [-1,1]){ const x0=sd<0?-260:ROADW,x1=sd<0?0:ROADW+260,xc=sd<0?0:ROADW,n=Math.ceil((d1-d0)/30),A=SX(x0),B2=SX(x1),l=Math.min(A,B2),rr=Math.max(A,B2);
      const a0=(l)/26,a1=rr/26; { const g=swB; g.p.push(l,1.3,-d0,rr,1.3,-d0,rr,1.3,-d1,l,1.3,-d0,rr,1.3,-d1,l,1.3,-d1); } swB.uvs=swB.uvs||[]; swB.uvs.push(a0,d0/26,a1,d0/26,a1,d1/26,a0,d0/26,a1,d1/26,a0,d1/26);
      swB.curbs=swB.curbs||[]; swB.curbs.push([SX(xc),d0,d1,sd]); }
    const g=new T.BufferGeometry(),ct=swB.p.length/3,nor=[]; for(let i=0;i<ct;i++) nor.push(0,1,0); g.setAttribute('position',new T.Float32BufferAttribute(swB.p,3)); g.setAttribute('normal',new T.Float32BufferAttribute(nor,3)); g.setAttribute('uv',new T.Float32BufferAttribute(swB.uvs,2));
    const sw=new T.Mesh(g,new T.MeshLambertMaterial({map:brickT,color:col(walkC)})); sw.receiveShadow=true; scene.add(sw);
    const cb=Bld(); for(const [X,d0,d1,sd] of swB.curbs){ const face=sd<0?1:-1,nx=face*M; let a2=d0,b2=d1; if(nx<0){ a2=d1; b2=d0; } const ck=red?(hash(Math.floor(d0/240),5)<.25?'#d8a820':'#c0403a'):'#a8a090'; cb.quad([X,0,-a2],[X,0,-b2],[X,1.3,-b2],[X,1.3,-a2],null,night?shade(ck,.6):ck); }
    const cm=new T.Mesh(cb.build(),mats.thin); cm.receiveShadow=true; scene.add(cm); }
  // 路口：橫向馬路、斑馬線、停止線
  for(const I of lv.inter){ const B=lst(I.d,'thin'); const c0=col(asph),a=SX(-1600),b=SX(ROADW+1600),l=Math.min(a,b),rr=Math.max(a,b); B.quad([l,.04,-(I.d-38)],[rr,.04,-(I.d-38)],[rr,.04,-(I.d+128)],[l,.04,-(I.d+128)],null,c0);
    const stripe=(x0,x1,d0,d1,cc)=>{ const A=SX(x0),C=SX(x1),L=Math.min(A,C),R=Math.max(A,C); B.quad([L,.09,-d0],[R,.09,-d0],[R,.09,-d1],[L,.09,-d1],null,cc); };
    const wh=col('#efefe9'); for(let x=4;x<ROADW;x+=24){ stripe(x,x+13,I.d-34,I.d-14,wh); stripe(x,x+13,I.d+104,I.d+124,wh); } stripe(144,ROADW,I.d-13,I.d-8,wh); }

  /* ---------- 地上的東西（一次畫好） ---------- */
  const disc=(k,x,d,rd,uv,cc)=>{ const B=lst(d,k); ground(B,x-rd,x+rd,d-rd,d+rd,k==='add'?.14:.1,uv,cc||'#ffffff'); };
  if(S.pal==='tw'||S.pal==='th') for(let d=430;d<lv.L+900;d+=430){ if(inI(d)||lv.inter.some(I=>d>I.d-70&&d<I.d+150)) continue; const B=lst(d,'decal'),x0=LANE[3]-24,x1=LANE[3]+24,A=SX(x0),C=SX(x1); B.quad([Math.min(A,C),.1,-d],[Math.max(A,C),.1,-d],[Math.max(A,C),.1,-(d+60)],[Math.min(A,C),.1,-(d+60)],TILE.slow); }
  for(let k=0;k<(lv.L+900)/170;k++){ const d=k*170; if(hash(k,31)<.45&&!inI(d)) disc('decal',LANE[1+Math.floor(hash(k,32)*4)]+(hash(k,33)-.5)*30,d,9,TILE.man); }
  for(const pd2 of lv.puddles) disc('decal',pd2.x,pd2.d,pd2.r,TILE.puddle); for(const h of lv.holes) disc('decal',h.x,h.d,h.r*1.25,TILE.hole);
  for(const gs of lv.gas) { const B=lst(gs.d,'add'); ground(B,288,ROADW,gs.d-46,gs.d+46,.14,WHITE,col('#55430c')); }
  /* ---------- 房子 ---------- */
  const gI=(d1,d2)=>{ for(const I of lv.inter) if(d2>I.d-38&&d1<I.d+128){ if(d1>=I.d-38) d1=I.d+128; else d2=I.d-38; } return [d1,d2]; };
  for(const b of lv.bld){ const [d1,d2]=gI(b.d,b.d+b.w); if(d2-d1<16) continue;
    const o=b.side<0?1:-1,xs=b.side<0?-44:ROADW+44,xb=xs-o*170,id=b.id,hh=b.hh,nf=b.nf,G=arc?54:46,FH=34,mid=(d1+d2)/2,L=lst(mid,'lit'),Gl=lst(mid,'glow'),wc=shd(b.col,dim),dk=shd(b.col,.68*dim),us=S.pal==='us';
    // 主體（側牆、背牆、屋頂）
    panelD(L,xs,xb,d1,arc?40:0,hh,null,dk); panelD(L,xs,xb,d2,arc?40:0,hh,null,dk,true); boxG(L,xs-o*.2,xb,d1,d2,hh-.1,hh+.1,shd('#6a6864',dim)); boxG(L,xs,xs-o*3,d1,d2,hh,hh+3,shd(b.col,.78*dim)); boxG(L,xb,xb+o*3,d1,d2,hh,hh+3,shd(b.col,.78*dim));
    if(hash(id,50)<.55&&S.pal==='tw'){ const e=lerp(d1,d2,.5+hash(id,51)*.42),sc=hcol(['#5a7f9a','#6f8f7a','#9aa0a0','#4a6a8a'],id,52); boxG(L,xs-o*12,xs-o*90,lerp(d1,d2,.06),e,hh,hh+22,shd(sc,dim)); }
    if((S.pal==='tw'||S.pal==='th')&&hash(id,53)<.45){ const v=hh+(hash(id,50)<.55?22:0); boxG(L,xs-o*40,xs-o*56,lerp(d1,d2,.62),lerp(d1,d2,.78),v,v+15,shd('#c8ccd2',dim)); }
    // 一樓
    if(arc){ const xr=xs-o*28; panelD(L,xr,xb,d1,0,40,null,dk); panelD(L,xr,xb,d2,0,40,null,dk,true); boxG(L,xs,xr,d1,d2,.0,1.6,night?'#3a3630':shd('#9a9284',dim)); boxG(L,xs,xr,d1,d2,38,41,night?'#2a2620':shd('#4a443c',dim));
      const op=hash(id,22)<.62,shopU=op?TILE.shop:TILE.shutter,nS=Math.max(1,Math.round((d2-d1)/30)); for(let i=0;i<nS;i++){ const a=lerp(d1,d2,i/nS),b2=lerp(d1,d2,(i+1)/nS); wallX(night&&op?Gl:L,xr,o,a,b2,1,38,shopU,night?(op?'#ffe0a0':'#55555a'):shd('#ffffff',dim)); }
      for(const u of (d2-d1>80?[0,.5,1]:[0,1])){ const da=lerp(d1,d2,u)-(u===1?7:u===.5?3.5:0); boxG(L,xs,xs-o*7,da,da+7,0,40,wc); }
      if(night){ const P=(d1+d2)/2; boxG(Gl,xs-o*14-3,xs-o*14+3,P-3,P+3,37.4,37.8,'#fff0c8'); const A0=lst(P,'add'); ground(A0,xs-o*30,xs+o*2,P-26,P+26,1.7,TILE.soft,col('#70583a')); }
      // 騎樓橫招牌
      const txt=b.txt,sc=b.sc,su=hUV[txt+sc]; wallX(night?Gl:L,xs+o*2.2,o,d1,d2,41,53,su,'#ffffff'); boxG(L,xs,xs+o*2,d1,d2,41,53,shd(sc,dim*.8)); }
    else { const n=Math.max(1,Math.round((d2-d1)/30)); wallX(L,xs,o,d1,d2,0,3,null,dk); for(let i=0;i<n;i++){ const a=lerp(d1,d2,(i+.05)/n),b2=lerp(d1,d2,(i+.95)/n); wallX(night?Gl:L,xs+o*.3,o,a,b2,3,32,TILE.glass,night?'#ffdca0':shd('#ffffff',dim)); }
      wallX(L,xs,o,d1,d2,32,G,us?TILE.brick:null,wc); boxG(L,xs,xs+o*14,lerp(d1,d2,.04),lerp(d1,d2,.96),31,32.5,shd(b.sc,.9*dim)); const su=hUV[b.txt+b.sc]; wallX(night?Gl:L,xs+o*1.2,o,lerp(d1,d2,.1),lerp(d1,d2,.9),37,46,su,'#ffffff'); }
    // 樓層
    const nw=Math.max(1,Math.min(5,Math.round((d2-d1)/32))),dirty=S.pal==='tw'||S.pal==='th'||S.pal==='kr';
    for(let f=0;f<nf;f++){ const v0=G+f*FH; for(let i=0;i<nw;i++){ const a=lerp(d1,d2,i/nw),e=lerp(d1,d2,(i+1)/nw),hs=hash(id*7+f,i+30),kind=us?3:dirty&&hs>.3?1:hash(id+f,i+40)<.32?2:0; wallX(L,xs,o,a,e,v0,v0+FH,TILE.win[kind],kind===3?shd(b.col,dim):wc);
        if(night&&hs<.45) wallX(Gl,xs+o*.25,o,lerp(a,e,.18),lerp(a,e,.82),v0+9,v0+27,TILE.lit,'#ffffff'); }
      boxG(L,xs,xs+o*1.1,d1,d2,v0-.6,v0+.6,shd(b.col,.8*dim)); }
    // 直招牌（伸出來，正對騎士）
    if(S.pal!=='us'&&hash(id,70)<.8){ const ds=lerp(d1,d2,.12+hash(id,71)*.4),v1=G+4,v2=Math.min(hh-2,v1+56+hash(id,72)*44),sc=hcol(pal.sign,id+5,73),tx=hcol(S.sign,id+9,74),uv=vUV[tx+sc],B=night?Gl:L; if(uv){ panelD(B,xs+o*3,xs+o*16,ds,v1,v2,uv,'#ffffff'); panelD(B,xs+o*3,xs+o*16,ds+1,v1,v2,uv,'#ffffff',true); boxG(L,xs,xs+o*3,ds,ds+1,v1+5,v1+7,'#555'); } }
    // 後面再一排，路口往旁邊看才不會空空的
    if(id%3===0){ const bh=70+hash(id,90)*170,xb2=xb-o*40,xb3=xb2-o*200,cc=shd(hcol(pal.bld,id,91),dim*.92); wallX(L,xb2,o,d1,d2,0,bh,null,cc); panelD(L,xb2,xb3,d1,0,bh,null,cc); boxG(L,xb2,xb3,d1,d2,bh,bh+2,shd('#6a6864',dim)); } }
  /* ---------- 電線桿、路燈、行道樹、路邊的機車 ---------- */
  const skipI=d=>lv.inter.some(I=>d>I.d-40&&d<I.d+130),cyl=(r0,r1,h,seg)=>new T.CylinderGeometry(r0,r1,h,seg||7),mm=new T.Matrix4();
  const put=(B,g,x,y,d,cc,rx,ry,rz)=>{ mm.makeRotationFromEuler(new T.Euler(rx||0,ry||0,rz||0)); mm.setPosition(SX(x),y,-d); B.geo(g,mm,cc); };
  const lamp=(sd,x,d)=>{ const hx=x-sd*26*1,L=lst(d,'lit'); boxG(L,x,hx,d-.4,d+.4,83.6,84.4,night?'#2a2a30':shd('#6a6c70',dim)); boxG(lst(d,'glow'),hx-3,hx+3,d-1,d+1,82.4,83.6,night?'#fff4d0':'#b8bcc0'); if(night){ const A=lst(d,'add'); ground(A,hx-46,hx+46,d-46,d+46,.14,TILE.soft,col('#4a3c26')); } };
  if(S.pal!=='us') for(const sd of [-1,1]){ const x=sd<0?-8:ROADW+8; for(let k=0;k*150<lv.L+2000;k++){ const d=k*150; if(skipI(d)) continue; const L=lst(d,'lit'),T0=lst(d,'thin'),pc=night?'#3a3a40':shd('#8e8c86',dim); put(L,cyl(1.1,1.5,96),x,48,d,pc); boxG(L,x-12,x+12,d-.5,d+.5,87.5,88.5,pc); if(k%2===0) lamp(sd,x,d); if(hash(k,sd,82)<.4) put(L,cyl(3.2,3.2,12,9),x,74,d,'#66696c');
      if(!skipI(d+150)) for(const wx of [-11,0,11]){ let lastD=d,lastY=88; for(let i=1;i<=4;i++){ const u=i/4,dn=d+150*u,yn=88-Math.sin(u*PI)*7,X=SX(x+wx); T0.box(X-.14,X+.14,Math.min(lastY,yn)-.14,Math.max(lastY,yn)+.14,-lastD,-dn,'#26262c'); lastD=dn; lastY=yn; } } } }
  else for(const sd of [-1,1]){ const x=sd<0?-8:ROADW+8; for(let k=0;k*200<lv.L+2000;k++){ const d=k*200; if(skipI(d)) continue; put(lst(d,'lit'),cyl(.9,1.3,84),x,42,d,night?'#3a3a40':shd('#55585c',dim)); lamp(sd,x,d); } }
  if(!arc){ const lf=cyl(1,1.5,38,6),ball=new T.IcosahedronGeometry(1,1); for(const sd of [-1,1]){ const x=sd<0?-18:ROADW+18; for(let k=0;k*110<lv.L+2000;k++){ const d=k*110; if(hash(k,sd,85)>.6||skipI(d)) continue; const L=lst(d,'lit'); put(L,lf,x,19,d,'#5a4030'); for(let i=0;i<6;i++){ const rd=9+hash(k,i,88)*6; mm.makeScale(rd,rd*.85,rd); mm.setPosition(SX(x+(hash(k,i,86)-.5)*22),46+hash(k,i,87)*18,-(d+(hash(k,i,89)-.5)*14)); L.geo(ball,mm,shd(['#4f7a3a','#5f8a44','#3f6a30'][i%3],night?.4:dim)); } } } }
  if(arc) for(const sd of [-1,1]){ const x=sd<0?-22:ROADW+22; for(let k=0;k*12<lv.L+1400;k++){ const d=k*12; if(hash(k,sd+5,71)>.6||lv.inter.some(I=>d>I.d-50&&d<I.d+140)||lv.stops.some(s2=>Math.abs(s2.d-d)<45)||lv.busStops.some(b=>Math.abs(b.d-d)<60)) continue;
      const L=lst(d,'lit'),xx=x+(hash(k,sd,72)-.5)*6,cc=shd(hcol(SCOL,k*2+(sd>0?1:0),73),dim); const X=(a,b)=>boxG(L,xx+a,xx+b,d-2.2,d+2.2,1.3+3.2,1.3+7,cc); boxG(L,xx-9,xx+9,d-1.6,d+1.6,1.3+2.5,1.3+4.5,shd('#2a2a30',dim)); X(-10,-4); X(3,9.5); boxG(L,xx-3,xx+7,d-2,d+2,1.3+7,1.3+8.6,shd('#1a1a1e',dim)); boxG(L,xx-11,xx-7,d-.9,d+.9,1.3,1.3+4,'#141416'); boxG(L,xx+7,xx+11,d-.9,d+.9,1.3,1.3+4,'#141416'); const fs=sd<0?1:-1; boxG(L,xx+fs*8,xx+fs*10.5,d-2.4,d+2.4,1.3+4,1.3+12.5,cc); boxG(L,xx+fs*9,xx+fs*10.2,d-4.4,d+4.4,1.3+12.5,1.3+13.3,'#1a1a1e'); boxG(L,xx-fs*2,xx-fs*7,d-2,d+2,1.3+7,1.3+9.5,'#1a1a1e'); } }
  /* ---------- 公車站、攤販 ---------- */
  for(const b2 of lv.busStops){ const L=lst(b2.d,'lit'),x=ROADW+12; boxG(L,x+6,x+8,b2.d-26,b2.d+26,1.3,27,'#7a8a9a'); boxG(L,x-8,x+10,b2.d-30,b2.d+30,27,28.5,'#40505e'); for(const dd of [-26,26]) boxG(L,x,x+1,b2.d+dd-.5,b2.d+dd+.5,1.3,27,'#40505e'); boxG(L,x-12,x-11,b2.d-34,b2.d-33,1.3,50,'#555'); panelD(lst(b2.d,night?'glow':'lit'),x-19,x-4,b2.d-33.6,44,56,null,'#2f6fd0'); boxG(L,x+1,x+5,b2.d-18,b2.d+18,5,7,'#7a5a3a'); }
  for(const sl of lv.stalls){ const d0=sl.d-sl.len/2,d1=sl.d+sl.len/2,x0=LANE[4]-24,x1=LANE[4]+16,L=lst(sl.d,'lit'),id=Math.floor(sl.d),glow=lst(sl.d,'glow'),cc=col(sl.col); boxG(L,x0,x1,d0,d1,3,18,'#b4b8bc','#dfe3e6'); panelD(L,x0+2,x1-2,d0-.1,8,15,null,sl.col); boxG(L,x0+1,x1-1,d0+1,d1-1,18,26,'#d2ebf5'); for(const [a,b] of [[x0,d0],[x1,d0],[x0,d1],[x1,d1]]) boxG(L,a-.5,a+.5,b-.5,b+.5,0,44,'#4a4a50');
    const n=6,w=(x1-x0+10)/n; for(let i=0;i<n;i++){ const A=x0-5+i*w; boxG(L,A,A+w,d0-4,d1+4,44,46,i%2?'#f2f0ea':cc); } if(night){ for(let i=0;i<4;i++) boxG(glow,x0+4+i*10,x0+6+i*10,sl.d-1,sl.d+1,41,43,'#fff2c0'); ground(lst(sl.d,'add'),x0-34,x1+34,sl.d-sl.len,sl.d+sl.len,.15,TILE.soft,col('#7a5a30')); } }
  // 合成靜態網格
  for(const [id,e] of chunks){ const a=(k,cast)=>{ if(!e[k].p.length) return; const m=new T.Mesh(e[k].build(),mats[k]); m.castShadow=!!cast; m.receiveShadow=k==='lit'||k==='decal'||k==='thin'; if(k==='decal') m.renderOrder=1; if(k==='add') m.renderOrder=2; scene.add(m); e.meshes.push(m); }; a('lit',true); a('glow',false); a('thin',false); a('decal',false); a('add',false); e.d=id*CH; }
  /* ---------- 店家燈箱、導航針、紅綠燈 ---------- */
  const stopM=new Map(); for(const s2 of lv.stops){ const isG=s2.kind==='gas',cvs=canv(256,168,(c,w,h)=>{ const bg=isG?'#c8302a':s2.kind==='shop'?'#f4f1ea':'#e8edf2'; c.fillStyle=bg; c.fillRect(0,0,w,h); c.fillStyle=isG?'#f4f1ea':s2.kind==='shop'?'#c8302a':'#2f6fd0'; c.fillRect(0,0,w,44); c.fillStyle=isG?'#c8302a':'#fff'; c.font='700 26px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(isG?'':s2.kind==='shop'?'外送取餐':'客人住處',w/2,23); c.fillStyle=isG?'#fff':'#222'; c.font='900 40px '+TC; c.fillText(isG?'加油站':s2.name,w/2,108,236); c.strokeStyle='#2a2c30'; c.lineWidth=6; c.strokeRect(3,3,w-6,h-6); });
    const g=new T.Group(),x=SX(ROADW+26); g.position.set(x,0,-s2.d); const bd=new T.Mesh(new T.PlaneGeometry(54,36),new T.MeshBasicMaterial({map:tex(cvs)})); bd.position.y=52; g.add(bd); const bk=new T.Mesh(new T.BoxGeometry(54,36,1.5),new T.MeshLambertMaterial({color:0x3a3c42})); bk.position.set(0,52,-1); bk.castShadow=true; g.add(bk); const pl=new T.Mesh(cyl(1,1.2,34),bk.material); pl.position.y=17; pl.castShadow=true; g.add(pl); scene.add(g); stopM.set(s2,g); }
  const pin=new T.Group(); { const sh=new T.Mesh(new T.SphereGeometry(5.5,18,14),new T.MeshBasicMaterial({color:0xf08a24})),cn=new T.Mesh(new T.ConeGeometry(4.8,9,18),sh.material),dot=new T.Mesh(new T.SphereGeometry(2.2,12,10),new T.MeshBasicMaterial({color:0xffffff})); sh.position.y=9.5; cn.rotation.x=PI; cn.position.y=2.9; dot.position.set(0,9.8,4.4); pin.add(sh,cn,dot); pin.mats=sh.material; scene.add(pin); }
  const tgtGlow=new T.Mesh(new T.PlaneGeometry(72,92),new T.MeshBasicMaterial({color:0x86dc4f,transparent:true,opacity:.35,depthWrite:false,fog:false})); tgtGlow.rotation.x=-PI/2; tgtGlow.renderOrder=3; scene.add(tgtGlow);
  const lampOff=new T.MeshLambertMaterial({color:0x2c2c2c}),LCOL={r:'#ff3030',y:'#ffc020',g:'#30e060'},lampOn={},glowM={}; for(const k in LCOL){ lampOn[k]=new T.MeshBasicMaterial({color:col(LCOL[k])}); glowM[k]=new T.MeshBasicMaterial({map:atx,color:col(LCOL[k]),transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false}); }
  { const u=TILE.soft; var softGeo=new T.PlaneGeometry(1,1); const a=softGeo.attributes.uv; a.setXY(0,u[0],u[3]); a.setXY(1,u[2],u[3]); a.setXY(2,u[0],u[1]); a.setXY(3,u[2],u[1]); }
  const LIGHTS=lv.inter.map(I=>{ const g=new T.Group(),z=-(I.d-10); g.position.set(0,0,z); scene.add(g); const px=SX(ROADW+14),ax=SX(200),st=new T.MeshLambertMaterial({color:0x3a3a44});
    const pole=new T.Mesh(cyl(1.3,1.8,66),st); pole.position.set(px,33,0); pole.castShadow=true; g.add(pole); const arm=new T.Mesh(new T.BoxGeometry(Math.abs(ax-px),1.5,1.5),st); arm.position.set((ax+px)/2,64,0); arm.castShadow=true; g.add(arm);
    const hs=new T.Mesh(new T.BoxGeometry(32,11,5),new T.MeshLambertMaterial({color:0x222222})); hs.position.set(ax,58,0); hs.castShadow=true; g.add(hs); const lamps={}; const order=['r','y','g']; order.forEach((k,i)=>{ const x=ax+(i-1)*9.5; const l=new T.Mesh(new T.CircleGeometry(3.7,16),lampOff); l.position.set(x,58,2.6); g.add(l); const gl=new T.Mesh(softGeo,glowM[k]); gl.scale.setScalar(26); gl.position.set(x,58,3); gl.visible=false; g.add(gl); lamps[k]={l,gl}; });
    let cd=null; if(S.pal==='tw'){ const cv2=canv(64,44),ct=tex(cv2); cd={cv2,ct,last:''}; const pl=new T.Mesh(new T.PlaneGeometry(13,9.5),new T.MeshBasicMaterial({map:ct})); pl.position.set(ax+M*23,58,2.6); g.add(pl); const b=new T.Mesh(new T.BoxGeometry(14,10.5,3),hs.material); b.position.set(ax+M*23,58,0.8); g.add(b); }
    if(I.cam){ const cm=new T.Mesh(new T.BoxGeometry(12,9,6),new T.MeshLambertMaterial({color:0xffd23f})); cm.position.set(px,41,2); g.add(cm); const ln=new T.Mesh(new T.CircleGeometry(2.6,14),new T.MeshBasicMaterial({color:0x222222})); ln.position.set(px,41,5.2); g.add(ln); }
    const far2=new T.Mesh(cyl(1.3,1.8,62),st); far2.position.set(SX(-14),31,-110); far2.castShadow=true; g.add(far2); return {I,g,lamps,cd}; });
  // 地標：遠遠立在路的盡頭
  { const cl2=canv(512,512,(c,w,h)=>{ c.translate(w/2,h*.97); drawLandmark(c,S.land,0,0,2.6,0,night); }); const lm=new T.Mesh(new T.PlaneGeometry(1000,1000),new T.MeshBasicMaterial({map:tex(cl2),transparent:true,fog:false,opacity:night?.85:.62,depthWrite:false})); lm.renderOrder=-1; scene.lm=lm; scene.add(lm); }

  /* ---------- 車的模型：body 烤漆可以換色，fixed 是玻璃輪胎，lamp 是車燈 ---------- */
  const glass=(night?'#101420':'#2a3644'),tire='#17171a';
  const VM={};
  function wheels(B,xw,zs,rd,wd){ const g=new T.CylinderGeometry(rd,rd,wd,14); for(const z of zs) for(const s of [-1,1]){ mm.makeRotationZ(PI/2); mm.setPosition(s*xw,rd,z); B.geo(g,mm,tire); const hb=new T.CylinderGeometry(rd*.55,rd*.55,wd+.1,10); B.geo(hb,mm,'#8a8e94'); } }
  function profile(pts,w,bevel){ const s=new T.Shape(); pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1])); s.closePath(); const g=new T.ExtrudeGeometry(s,{depth:w-bevel*2,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2,curveSegments:2,steps:1}); g.translate(0,0,-(w-bevel*2)/2); g.rotateY(PI/2); return g; }
  const sideWin=(B,w,pts,cc)=>{ const s=new T.Shape(); pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1])); const g=new T.ShapeGeometry(s); for(const sg of [1,-1]){ mm.makeRotationY(sg>0?PI/2:-PI/2); if(sg<0){ const m2=new T.Matrix4().makeScale(-1,1,1); mm.multiply(m2); const g2=g.clone(); const idx=g2.index; for(let i=0;i<idx.count;i+=3){ const a=idx.getX(i); idx.setX(i,idx.getX(i+2)); idx.setX(i+2,a); } mm.setPosition(sg*(w/2+.12),0,0); const m3=new T.Matrix4().makeRotationY(PI/2); m3.setPosition(-(w/2+.12),0,0); const f=g.clone(); f.applyMatrix4(m3); const ix=f.index; for(let i=0;i<ix.count;i+=3){ const a=ix.getX(i); ix.setX(i,ix.getX(i+2)); ix.setX(i+2,a); } const nn=f.attributes.normal; for(let i=0;i<nn.count;i++) nn.setXYZ(i,-1,0,0); B.geo(f,null,cc); } else { mm.setPosition(w/2+.12,0,0); B.geo(g,mm,cc); } } };
  function carModel(kind){ const body=Bld(),fix=Bld(),lamp=Bld(),brake=Bld(),glow=Bld(),w=27,L2=26;
    if(kind==='car'||kind==='taxi'||kind==='hatch'){ const hatch=kind==='hatch',pts=hatch?[[-26,3],[-26,8],[-24,10.5],[-13,12.5],[-5,19.4],[17,19.4],[24,13],[26,10.5],[26,3]]:[[-26,3],[-26,8],[-24,10.5],[-13,12.5],[-5,19.2],[9,19.2],[15,13],[24,12.2],[26,10],[26,3]]; body.geo(profile(pts,w-1.2,.6));
      sideWin(fix,w,hatch?[[-11.5,12.8],[-4.8,18.4],[16,18.4],[21.5,13.2]]:[[-11.5,12.8],[-4.8,18.4],[8.6,18.4],[13.2,13.2]],glass); const zf=-9,zr=hatch?20.5:12; const gl=(z0,y0,z1,y1,hw)=>fix.quad([-hw,y0,z0],[hw,y0,z0],[hw,y1,z1],[-hw,y1,z1],null,glass);
      // 後擋、前擋（前擋面向前方）
      fix.quad([-w/2+1.8,hatch?13.4:13.4,zr+(hatch?4:3.4)],[w/2-1.8,13.4,zr+(hatch?4:3.4)],[w/2-3,18.9,zr-(hatch?2:3)],[-w/2+3,18.9,zr-(hatch?2:3)],null,glass); fix.quad([w/2-1.8,13,-13.4],[-w/2+1.8,13,-13.4],[-w/2+3,19,-6.2],[w/2-3,19,-6.2],null,glass);
      wheels(fix,w/2-1.8,[-16,16],4,3.4); fix.box(-w/2,w/2,2,5,26,27,'#1c1c20'); fix.box(-w/2,w/2,2,5,-27,-26,'#1c1c20'); fix.box(-4,4,5.4,8,26.65,26.9,'#e8e8e0'); for(const s of [-1,1]){ fix.box(s*(w/2+.2),s*(w/2+1.6),13,14.2,-13.5,-11,'#222228'); lamp.box(s*9,s*12.8,8,10.4,26.4,26.8,'#b81818'); brake.box(s*8.8,s*13,7.8,10.6,26.7,27,'#ff3030'); lamp.box(s*8.6,s*12.8,7.6,10,-26.8,-26.3,'#fffbe8'); glow.quad([s*10.7-7,2,-27.1],[s*10.7+7,2,-27.1],[s*10.7+7,16,-27.1],[s*10.7-7,16,-27.1],TILE.soft,'#fff4cc'); glow.quad([s*10.7+5,4,27.1],[s*10.7-5,4,27.1],[s*10.7-5,14,27.1],[s*10.7+5,14,27.1],TILE.soft,'#ff3030'); } if(kind==='taxi'){ fix.box(-5,5,19.2,22.6,-1,3,'#fff6b0'); } }
    else if(kind==='truck'){ const Lt=35; body.box(-15,15,3,23,-Lt,-Lt+20,'#fff'); body.box(-15,15,12,25,-Lt+2,-Lt+18,'#fff'); fix.quad([14,14,-Lt-.1],[-14,14,-Lt-.1],[-14,23,-Lt+1.6],[14,23,-Lt+1.6],null,glass); fix.box(-16.5,16.5,8,34,-Lt+22,Lt,'#dfe2e4'); fix.box(-16.6,16.6,3,8,-Lt+18,Lt,'#3a3a40'); fix.box(-14,14,9,33,Lt-.1,Lt+.2,'#c8cbcf'); fix.box(-.4,.4,9,33,Lt+.1,Lt+.3,'#7a7a80'); wheels(fix,14,[-Lt+10,Lt-14],5,4); for(const s of [-1,1]){ lamp.box(s*10,s*15,4.6,7,Lt-.2,Lt+.3,'#b81818'); brake.box(s*10,s*15,4.4,7.2,Lt+.2,Lt+.5,'#ff3030'); lamp.box(s*9,s*13.5,6,9,-Lt-.4,-Lt,'#fffbe8'); glow.quad([s*11-8,0,-Lt-.6],[s*11+8,0,-Lt-.6],[s*11+8,16,-Lt-.6],[s*11-8,16,-Lt-.6],TILE.soft,'#fff4cc'); } }
    else if(kind==='garbage'){ const Lt=33; fix.box(-14,14,3,24,-Lt,-Lt+18,'#f1c40f'); fix.quad([13,14,-Lt-.1],[-13,14,-Lt-.1],[-13,22,-Lt-.1],[13,22,-Lt-.1],null,glass); body.box(-15,15,4,31,-Lt+20,Lt,'#fff'); fix.box(-13,13,6,28,Lt,Lt+.3,'#2a2a2e'); wheels(fix,13,[-Lt+9,Lt-12],5,4); for(const s of [-1,1]) brake.box(s*9,s*14,3,6,Lt+.2,Lt+.5,'#ff3030'); }
    else if(kind==='bus'){ const Lt=56,hb=44; body.box(-17,17,5,hb,-Lt,Lt,'#fff'); for(const s of [-1,1]){ const X=s*17.1; for(let i=0;i<8;i++){ const z0=-Lt+8+i*13,z1=z0+11; if(s>0) fix.quad([X,20,z1],[X,20,z0],[X,38,z0],[X,38,z1],null,glass); else fix.quad([X,20,z0],[X,20,z1],[X,38,z1],[X,38,z0],null,glass); } } fix.quad([-15,16,Lt+.1],[15,16,Lt+.1],[15,40,Lt+.1],[-15,40,Lt+.1],null,glass); fix.quad([15,10,-Lt-.1],[-15,10,-Lt-.1],[-15,41,-Lt-.1],[15,41,-Lt-.1],null,glass); fix.box(-17.1,17.1,2,5,-Lt,Lt,'#2a2a2e'); wheels(fix,15,[-Lt+20,Lt-22],5.4,4.4); for(const s of [-1,1]){ lamp.box(s*12,s*16,7,12,Lt-.2,Lt+.3,'#b81818'); brake.box(s*12,s*16,7,12,Lt+.2,Lt+.5,'#ff3030'); lamp.box(s*10,s*15,5,8,-Lt-.4,-Lt,'#fffbe8'); glow.quad([s*12-9,0,-Lt-.7],[s*12+9,0,-Lt-.7],[s*12+9,16,-Lt-.7],[s*12-9,16,-Lt-.7],TILE.soft,'#fff4cc'); } }
    else if(kind==='tuk'){ const Lt=18; body.box(-10,10,4,14,-Lt+3,Lt,'#fff'); fix.box(-11,11,25,26.4,-Lt+1,Lt+1,'#1e1e22'); for(const [a,b] of [[-10,-Lt+3],[10,-Lt+3],[-10,Lt],[10,Lt]]) fix.box(a-.5,a+.5,14,25,b-.5,b+.5,'#2a2a2e'); fix.box(-7,7,11,20,4,6,'#c8a070'); fix.quad([8,14,-Lt+2.8],[-8,14,-Lt+2.8],[-8,24,-Lt+4],[8,24,-Lt+4],null,glass); wheels(fix,9,[12],3.2,2.4); const fw=new T.CylinderGeometry(3.2,3.2,2.4,12); mm.makeRotationZ(PI/2); mm.setPosition(0,3.2,-Lt+2); fix.geo(fw,mm,tire); for(const s of [-1,1]) brake.box(s*6,s*9,8,10,Lt+.1,Lt+.4,'#ff3030'); }
    return {body:body.build(),fix:fix.build(),lamp:lamp.build(),brake:brake.build(),glow:glow.p.length?glow.build():null}; }
  const fixM=new T.MeshPhongMaterial({vertexColors:true,shininess:60,specular:0x444444}),lampM=new T.MeshBasicMaterial({vertexColors:true}),glowCarM=new T.MeshBasicMaterial({map:atx,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  /* 機車＋騎士 */
  function scootModel(){ const body=Bld(),fix=Bld(),shirt=Bld(),hel=Bld(),box=Bld(); const sph=new T.SphereGeometry(1,10,8),w=new T.CylinderGeometry(2.6,2.6,1.6,12); for(const z of [-10.5,10.5]){ mm.makeRotationZ(PI/2); mm.setPosition(0,2.6,z); fix.geo(w,mm,tire); }
    const Sc=(B,x,y,z,sx,sy,sz,c0)=>{ mm.makeScale(sx,sy,sz); mm.setPosition(x,y,z); B.geo(sph,mm,c0); };
    body.box(-2.6,2.6,5,8,-3,13,'#fff'); Sc(body,0,8.6,8.4,3.2,2.6,6.6,'#fff'); body.box(-2.8,2.8,3.4,13,-11,-8.2,'#fff'); body.box(-3.6,3.6,3.2,5,-8.5,4,'#fff'); Sc(body,0,12.6,-10,3,2.2,2.2,'#fff'); fix.box(-2.8,2.8,11,12.4,1,13,'#1a1a1e'); fix.box(-5,5,14.2,14.8,-9,-8.4,'#1c1c20'); lamp2(fix);
    function lamp2(B){ B.box(-1.8,1.8,10,11.6,13.4,14,'#c81a1a'); B.box(-1.8,1.8,13,15,-12.4,-11.8,'#fffbe8'); }
    // 騎士：大腿、小腿、軀幹、手臂、頭盔
    for(const s of [-1,1]){ fix.box(s*1.4,s*4.2,11.5,14,-4,4,'#2b3550'); fix.box(s*1.6,s*3.8,5,12,-6.5,-3.5,'#2b3550'); fix.box(s*1.2,s*4,4.4,6,-9,-3,'#222'); shirt.box(s*3.8,s*5.2,16,23,-6,0,'#fff'); fix.box(s*3.6,s*5.2,14.6,16.2,-9,-6,'#e8c8a8'); }
    Sc(shirt,0,19.5,2,4.6,6.6,3,'#fff'); Sc(fix,0,25.2,1.4,1.4,1.2,1.4,'#e0ac80'); Sc(hel,0,27.6,1,2.7,2.8,3,'#fff'); fix.box(-1.8,1.8,26.6,27.8,-1.9,-1.6,'#1c1c24');
    box.box(-5.2,5.2,12.4,22,6,16,'#fff'); fix.box(-5.3,5.3,16.6,17.4,5.9,16.1,'#e8e8e4'); return {body:body.build(),fix:fix.build(),shirt:shirt.build(),hel:hel.build(),box:box.build()}; }
  const POOL={},getPool=k=>POOL[k]||(POOL[k]={list:[],used:0});
  function getCar(k){ const P=getPool(k); let e=P.list[P.used++]; if(!e){ const m=VM[k]||(VM[k]=carModel(k)); e=new T.Group(); e.bodyM=new T.MeshPhongMaterial({color:0xffffff,shininess:70,specular:0x555555}); const b=new T.Mesh(m.body,e.bodyM),f=new T.Mesh(m.fix,fixM),l=new T.Mesh(m.lamp,lampM); e.brakeM=new T.Mesh(m.brake,lampM); b.castShadow=f.castShadow=true; e.add(b,f,l,e.brakeM); if(m.glow&&night){ const g=new T.Mesh(m.glow,glowCarM); e.add(g); } scene.add(e); P.list.push(e); } e.visible=true; return e; }
  function getScoot(){ const P=getPool('scoot'); let e=P.list[P.used++]; if(!e){ const m=VM.scoot||(VM.scoot=scootModel()); e=new T.Group(); e.bodyM=new T.MeshPhongMaterial({color:0xffffff,shininess:60,specular:0x444444}); e.shirtM=new T.MeshLambertMaterial({color:0xffffff}); e.helM=new T.MeshPhongMaterial({color:0xffffff,shininess:80,specular:0x666666}); e.boxM=new T.MeshLambertMaterial({color:0xffffff}); const a=new T.Mesh(m.body,e.bodyM),f=new T.Mesh(m.fix,fixM),s=new T.Mesh(m.shirt,e.shirtM),h=new T.Mesh(m.hel,e.helM); e.bx=new T.Mesh(m.box,e.boxM); a.castShadow=f.castShadow=s.castShadow=e.bx.castShadow=true; e.add(a,f,s,h,e.bx); if(night){ const g=new T.Mesh(softGeo,new T.MeshBasicMaterial({map:atx,color:0xfff4cc,transparent:true,depthWrite:false,blending:T.AdditiveBlending})); g.scale.setScalar(13); g.position.set(0,14,-12.6); g.rotation.y=PI; e.add(g); } scene.add(e); P.list.push(e); } e.visible=true; return e; }
  /* 行人：一次畫很多，用 InstancedMesh */
  const MAXP=240,PG={torso:new T.CylinderGeometry(2.3,1.9,7,9),head:new T.SphereGeometry(1.6,10,8),hair:new T.SphereGeometry(1.72,10,6,0,PI*2,0,PI*.55),leg:(()=>{ const g=new T.CylinderGeometry(1.05,.8,9.4,7); g.translate(0,-4.7,0); return g; })(),arm:(()=>{ const g=new T.CylinderGeometry(.62,.5,6.8,6); g.translate(0,-3.4,0); return g; })()};
  const IM={}; for(const k of ['torso','head','hair','legL','legR','armL','armR']){ const g=k.startsWith('leg')?PG.leg:k.startsWith('arm')?PG.arm:PG[k]; const m=new T.InstancedMesh(g,new T.MeshLambertMaterial({color:0xffffff}),MAXP); m.instanceColor=new T.InstancedBufferAttribute(new Float32Array(MAXP*3),3); m.frustumCulled=false; m.castShadow=k==='torso'||k.startsWith('leg'); scene.add(m); IM[k]=m; }
  let pedN=0; const m4=new T.Matrix4(),q4=new T.Quaternion(),e4=new T.Euler(0,0,0,'YXZ'),v4=new T.Vector3(),s4=new T.Vector3(1,1,1),cc4=new T.Color(),off=new T.Vector3();
  function setI(k,yaw,rx,ox,oy,oz,bx,by,bz,sc,c0){ const m=IM[k]; e4.set(rx,yaw,0); q4.setFromEuler(e4); off.set(ox,oy,oz).multiplyScalar(sc).applyAxisAngle(new T.Vector3(0,1,0),yaw); v4.set(bx+off.x,by+off.y,bz+off.z); s4.setScalar(sc); m4.compose(v4,q4,s4); m.setMatrixAt(pedN,m4); cc4.set(c0); m.setColorAt(pedN,cc4); }
  function ped(x,y,d,yaw,shirt,ph,t,sc){ if(pedN>=MAXP) return; const id=Math.floor(Math.abs(ph)*7),sw=Math.sin(t*7+ph)*.55,dk=dimC(shirt),pants=dimC(hcol(PANTS,id,8)),skin=dimC(SKIN[id%4]),hr=dimC(['#1a1410','#3a2a1a','#6a5a4a','#111'][id%4]),X=SX(x),Z=-d,h=sc||1;
    setI('torso',yaw,0,0,12.8,0,X,y,Z,h,dk); setI('head',yaw,0,0,18,0,X,y,Z,h,skin); setI('hair',yaw,0,0,18.2,0,X,y,Z,h,hr); setI('legL',yaw,sw,1.1,9.6,0,X,y,Z,h,pants); setI('legR',yaw,-sw,-1.1,9.6,0,X,y,Z,h,pants); setI('armL',yaw,-sw*.8,2.7,15.8,0,X,y,Z,h,dk); setI('armR',yaw,sw*.8,-2.7,15.8,0,X,y,Z,h,dk); pedN++; }
  const dimCache={}; function dimC(c0){ return dimCache[c0]||(dimCache[c0]=(night?shade(c0,.62):c0)); }
  /* 狗、蒸氣、陣頭的旗子 */
  const dogs=[0,1,2,3,4,5].map(()=>{ const B=Bld(); B.box(-1.6,1.6,4.2,7.2,-5,5,'#b07a3a'); B.box(-1.4,1.4,6,9,-8,-4.4,'#a06a30'); B.box(-.8,.8,5.4,7,-9.4,-7.6,'#7a4a20'); for(const [a,b] of [[-1,-4],[1,-4],[-1,4],[1,4]]) B.box(a-.45,a+.45,0,4.4,b-.45,b+.45,'#8a5a28'); B.box(-.3,.3,7,10,5,5.6,'#8a5a28'); const m=new T.Mesh(B.build(),new T.MeshLambertMaterial({vertexColors:true})); m.castShadow=true; m.visible=false; scene.add(m); return m; });
  const steamM=new T.MeshBasicMaterial({map:atx,color:0xf0f0f5,transparent:true,opacity:.5,depthWrite:false}),steams=[]; for(let i=0;i<16;i++){ const m=new T.Mesh(softGeo,steamM); m.visible=false; scene.add(m); steams.push(m); }
  const flags=[0,1,2,3].map(()=>{ const m=new T.Mesh(new T.PlaneGeometry(12,16),new T.MeshLambertMaterial({color:0xe23b3b,side:T.DoubleSide})); m.visible=false; scene.add(m); return m; });
  // 打開的車門
  const doorPool=[]; for(let i=0;i<3;i++){ const g=new T.Group(),m=new T.Mesh(new T.BoxGeometry(.8,12,16),new T.MeshPhongMaterial({color:0xffffff,shininess:60})); m.position.set(0,12,-8); m.castShadow=true; g.add(m); g.visible=false; g.mat=m.material; scene.add(g); doorPool.push(g); }

  /* ---------- 自己的車頭：車殼、儀表、把手、手套、後照鏡、手機（跟著鏡頭走） ---------- */
  const cam=new T.PerspectiveCamera(64,W/H,.9,2600); cam.rotation.order='YXZ'; scene.add(cam);
  const rearCam=new T.PerspectiveCamera(30,2.4,1,1200); scene.add(rearCam); const rt=new T.WebGLRenderTarget(512,212,{minFilter:T.LinearFilter,magFilter:T.LinearFilter});
  function mkCockpit(L,navF){ const root=new T.Group(); cam.add(root); const NF={fog:false},bikeM=new T.MeshPhongMaterial(Object.assign({color:col(L.bike),shininess:45,specular:0x333333},NF)),blk=new T.MeshPhongMaterial(Object.assign({color:0x1c1c20,shininess:30,specular:0x222222},NF)),chr=new T.MeshPhongMaterial(Object.assign({color:0xb8bcc4,shininess:120,specular:0xffffff},NF)),slv=new T.MeshPhongMaterial(Object.assign({color:col(L.shirt),shininess:8},NF)),glv=new T.MeshPhongMaterial(Object.assign({color:0x26262c,shininess:30,specular:0x333333},NF));
    const mesh=(g,m,x,y,z,p)=>{ const e=new T.Mesh(g,m); e.position.set(x,y,z); (p||root).add(e); return e; };
    const steer=new T.Group(); steer.position.set(0,-4.2,-7); root.add(steer); // 把手會跟著轉
    // 車殼：前面鼓起的外殼
    const shell=mesh(new T.SphereGeometry(1,28,18),bikeM,0,-1.6,-2.6,steer); shell.scale.set(2.9,2.4,2.3); const shield=mesh(new T.SphereGeometry(1,24,14),bikeM,0,-4,1.5,root); shield.scale.set(4.1,2.5,3.2); shield.position.set(0,-8.1,-6);
    const rim=mesh(new T.TorusGeometry(1.25,.13,10,28),chr,0,.72,-4.1,steer); rim.rotation.x=-.65; rim.scale.set(1,.55,1); const hlamp=mesh(new T.CircleGeometry(1.25,24),new T.MeshBasicMaterial(Object.assign({color:night?0xfffbe0:0xdfe8ef},NF)),0,.72,-4.06,steer); hlamp.rotation.x=-.65; hlamp.scale.set(1,.55,1);
    // 儀表
    const lcdC=canv(256,120),lcdT=tex(lcdC),dashB=mesh(new T.BoxGeometry(3.4,.2,1.65),blk,0,.82,-2.2,steer); dashB.rotation.x=.5; const lcd=mesh(new T.PlaneGeometry(3,1.38),new T.MeshBasicMaterial(Object.assign({map:lcdT},NF)),0,.93,-2.17,steer); lcd.rotation.x=-PI/2+.5;
    // 把手
    const barCurve=new T.CatmullRomCurve3([new T.Vector3(-5.4,.2,.2),new T.Vector3(-2.8,.52,.05),new T.Vector3(0,.68,-.1),new T.Vector3(2.8,.52,.05),new T.Vector3(5.4,.2,.2)]); mesh(new T.TubeGeometry(barCurve,28,.14,10),chr,0,0,0,steer);
    for(const s of [-1,1]){ const g=mesh(new T.CylinderGeometry(.26,.26,1.8,14),blk,s*4.6,.28,.17,steer); g.rotation.z=PI/2-s*.08; mesh(new T.BoxGeometry(.95,.5,.6),blk,s*3.15,.6,.05,steer); const lever=new T.Mesh(new T.BoxGeometry(2.1,.07,.13),chr); lever.position.set(s*4.3,.6,-.72); lever.rotation.y=s*.16; steer.add(lever);
      // 手套＋手指
      const hand=new T.Group(); hand.position.set(s*4.65,.3,.2); steer.add(hand); const palm=mesh(new T.SphereGeometry(.55,14,10),glv,0,.05,.05,hand); palm.scale.set(1.25,1,.95); for(let i=0;i<4;i++){ const f=mesh(new T.CylinderGeometry(.13,.13,.6,8),glv,(i-1.5)*.26,.2,-.42,hand); f.rotation.x=1.05; }
      if(s>0) steer.grip=hand; }
    // 手臂（袖子）：另外算，不跟著車頭一起轉太多
    const arms=[-1,1].map(s=>{ const p=new T.Vector3(s*4.6,-3.75,-6.8),e=new T.Vector3(s*7.6,-6.9,-3.1),g=new T.CylinderGeometry(.48,.74,1,14),m=new T.Mesh(g,slv); root.add(m); const up=new T.Vector3(0,1,0),dir=p.clone().sub(e),len=dir.length(); m.scale.set(1,len,1); m.position.copy(p.clone().add(e).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(up,dir.normalize()); return m; });
    // 後照鏡：一面照左後、一面照右後（真的把後面的路畫進去）
    for(const s of [-1,1]){ const stalk=new T.CatmullRomCurve3([new T.Vector3(s*3.2,.65,.0),new T.Vector3(s*4.1,1.6,-.55),new T.Vector3(s*5.0,2.6,-.85)]); mesh(new T.TubeGeometry(stalk,10,.075,8),chr,0,0,0,steer);
      const fr=new T.Group(); fr.position.set(s*5.15,2.95,-1); fr.rotation.set(.08,-s*.22,0); steer.add(fr); const bk=mesh(new T.CircleGeometry(1,28),blk,0,0,-.02,fr); bk.scale.set(1,.72,1); const ring=mesh(new T.TorusGeometry(1,.075,8,30),chr,0,0,0,fr); ring.scale.set(1,.72,1);
      const mg=new T.CircleGeometry(.95,28); const a=mg.attributes.uv; for(let i=0;i<a.count;i++){ const uu=a.getX(i); a.setX(i,s<0?1-uu/2:.5-uu/2); } const gl=new T.Mesh(mg,new T.MeshBasicMaterial(Object.assign({map:rt.texture},NF))); gl.scale.set(1,.72,1); gl.position.z=.02; fr.add(gl); }
    // 手機（導航）
    const phC=canv(320,420),phT=tex(phC); const ph=mesh(new T.PlaneGeometry(4.0,5.25),new T.MeshBasicMaterial(Object.assign({map:phT,transparent:true},NF)),-2.05,2.25,-.5,steer); ph.rotation.x=-.08;
    root.traverse(m=>{ if(m.isMesh){ m.castShadow=false; m.receiveShadow=false; m.renderOrder=10; } });
    let lastUI=-1;
    return {root,steer,shell,arms,lcdC,lcdT,phC,phT,update(st,now){ if(now-lastUI<.09) return; lastUI=now;
        const c=lcdC.getContext('2d'),kmh=Math.round(Math.abs(st.v)/250*60); c.fillStyle='#0c1418'; c.fillRect(0,0,256,120); c.fillStyle=night?'#9fd8ff':'#bdeaff'; c.font='700 72px "Courier New",monospace'; c.textAlign='right'; c.textBaseline='middle'; c.fillText(String(kmh),130,58); c.font='700 19px sans-serif'; c.textAlign='left'; c.fillText('km/h',136,82);
        const fb=Math.ceil(cl(st.fuel/100,0,1)*6); for(let i=0;i<6;i++){ c.fillStyle=i<fb?(st.fuel<20?'#ff6a5a':(night?'#9fd8ff':'#bdeaff')):'rgba(189,234,255,.12)'; c.fillRect(204,92-i*15,32,11); } c.fillStyle='rgba(189,234,255,.7)'; c.font='700 14px sans-serif'; c.fillText('F',240,16); c.fillText('E',240,100); lcdT.needsUpdate=true;
        const p=phC.getContext('2d'); p.setTransform(1,0,0,1,0,0); p.clearRect(0,0,320,420); p.setTransform(1.32,0,0,1.32,160+122*1.32,176*1.32+60); phoneNav(p,st.nav,st.t,night); p.setTransform(1,0,0,1,0,0); phT.needsUpdate=true; } }; }
  const cockpits={};

  /* ---------- 每一格更新 ---------- */
  const eye=new T.Vector3(); let frame=0,labels=[],lastT=0,tick=0,tSum=0,tN=0,lvlQ=0; const VS={};
  function sync(st,time){ const {px,pd,simT,t,riders,locals,target}=st; const cd=pd,rearD=cd-300,frontD=cd+1300;
    // 靜態分塊：遠的不畫
    for(const [,e] of chunks){ const vis=e.d+CH>cd-460&&e.d<cd+1600; for(const m of e.meshes) m.visible=vis; }
    for(const k in POOL) POOL[k].used=0; pedN=0; labels=[];
    const near=d=>d>rearD&&d<frontD;
    // 紅綠燈
    for(const L of LIGHTS){ const dz=L.I.d-cd,on=dz>-300&&dz<1400; L.g.visible=on; if(!on) continue; const Lg=lightOf(L.I,simT); for(const k in L.lamps){ const a=Lg.col===k; L.lamps[k].l.material=a?lampOn[k]:lampOff; L.lamps[k].gl.visible=a; } if(L.cd&&dz<520){ const s=String(Math.ceil(Lg.left)).padStart(2,'0')+Lg.col; if(s!==L.cd.last){ L.cd.last=s; const c=L.cd.cv2.getContext('2d'); c.fillStyle='#111'; c.fillRect(0,0,64,44); c.fillStyle=LCOL[Lg.col]; c.font='900 38px monospace'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(s.slice(0,2),32,24); L.cd.ct.needsUpdate=true; } } }
    for(const [s2,g] of stopM){ g.visible=near(s2.d); }
    // 目標：綠框、導航針、門口等的客人
    if(target){ pin.visible=true; tgtGlow.visible=true; pin.position.set(SX(ROADW+26),74+Math.sin(t*3)*3,-target.d); pin.rotation.y=t*1.6; pin.mats.color.set(target.kind==='shop'?0xf08a24:0xe8402e); tgtGlow.position.set(SX(324),1.4*0+.2,-target.d); tgtGlow.material.opacity=.26+.13*Math.sin(t*6); if(target.kind==='cus') ped(ROADW+12,1.3,target.d,M>0?-PI/2:PI/2,'#d8a030',3,0,1); } else { pin.visible=false; tgtGlow.visible=false; }
    // 車流
    const setCar=(e,x,d,ang,c0,kind,brake,yawOk)=>{ const m=getCar(kind); m.position.set(SX(x),0,-d); m.rotation.y=ang; m.bodyM.color.set(night?shade(c0,.7):c0); m.brakeM.visible=!!brake; return m; };
    const setScoot=(x,d,ang,o2)=>{ const m=getScoot(); m.position.set(SX(x),0,-d); m.rotation.set(0,ang,o2.tilt||0); m.bodyM.color.set(night?shade(o2.col,.75):o2.col); m.shirtM.color.set(night?shade(o2.shirt,.7):o2.shirt); m.helM.color.set(night?shade(o2.helm,.75):o2.helm); m.bx.visible=!!o2.box; if(o2.box) m.boxM.color.set(night?shade(o2.box,.75):o2.box); return m; };
    const mir=M<0; // 鏡射時 x 方向相反：畫面上的 yaw 用 screen 方向算
    for(const e of lv.veh){ if(!near(e.d)) continue; const ang=e.dir>0?0:PI,id=e.idx||0; if(e.k==='scoot'){ setScoot(e.x,e.d,ang,{col:e.col,shirt:hcol(SHIRT,id,3),helm:e.helm||'#fff',box:id%4===0?BOXC[id%4===0?(id>>2)%4:0]:null}); } else { const kind=e.k==='car'?(id%3===0?'hatch':'car'):e.k; setCar(e,e.x,e.d,ang,e.k==='garbage'?'#2a7a4a':e.k==='truck'?e.col:e.col,kind,e.brake&&e.dir>0); } }
    // 路口橫向車流、行人
    const cr=[]; for(const I of lv.inter){ const dz=I.d-cd; if(dz<1100&&dz>-280){ crossers(lv,I,simT,cr); crossPeds(lv,I,simT,cr); } }
    for(const e of cr){ if(e.k==='ped'){ ped(e.x,0,e.d,yawF(e.face),dimStr(e.col),e.x*.1,simT,1); continue; } if(e.warn){ labels.push({k:'warn',x:e.horiz>0?-20:ROADW+20,d:e.d,h:30}); continue; } const ang=e.horiz*M>0?-PI/2:PI/2; if(e.k==='car') setCar(e,e.x,e.d,ang,e.col,'car',false); else setScoot(e.x,e.d,ang,{col:e.col,shirt:e.k==='runner'?'#2b2b36':hcol(SHIRT,Math.floor(e.d),3),helm:e.helm||'#fff'}); }
    // 路邊停車
    let dn=0; for(const pk of lv.parked){ if(!near(pk.d)) continue; const m=setCar(null,LANE[4]+6,pk.d,0,pk.col,Math.floor(pk.d)%3===0?'hatch':'car',false); if(pk.door>0&&dn<doorPool.length){ const g=doorPool[dn++]; g.visible=true; const side=LANE[4]+6-13.8; g.position.set(SX(side),0,-(pk.d+6)); g.rotation.y=-M*pk.door*1.0; g.mat.color.set(pk.col); } } for(;dn<doorPool.length;dn++) doorPool[dn].visible=false;
    // 其他外送員
    for(const q of riders||[]){ if(!near(q.d)) continue; setScoot(q.x,q.d,0,{col:q.look.bike,shirt:q.look.shirt,helm:q.look.helmet,box:q.look.box}); if(q.name&&Math.abs(q.d-cd)<320&&q.d>cd) labels.push({k:'name',x:q.x,d:q.d,h:34,txt:q.name.replace('（電腦）',''),a:cl((320-(q.d-cd))/120,0,1)*.85}); }
    // 人行道上走路的人
    for(const sd of [-1,1]){ const x0=arc?(sd<0?-58:ROADW+58):(sd<0?-30:ROADW+30); for(let k=Math.floor((cd-120)/80);k<(cd+600)/80;k++){ if(hash(k,sd,91)>S.peds*.6+.25) continue; const dir=hash(k,sd,92)<.5?1:-1,d=k*80+(((t*13*dir+hash(k,sd,93)*80)%80)+80)%80; if(lv.inter.some(I=>d>I.d-36&&d<I.d+126)) continue; ped(x0+(hash(k,sd,94)-.5)*8,1.3,d,dir>0?0:PI,hcol(SHIRT,k*3+sd,95),k+sd*.37,t,.97+hash(k,sd,97)*.1); } }
    // 亂穿越的人、狗
    let dg=0; for(const l of locals||[]){ if(l.k==='dog'){ if(dg<dogs.length){ const m=dogs[dg++]; m.visible=true; m.position.set(SX(l.x),Math.abs(Math.sin(t*9))*.8,-l.d); m.rotation.y=Math.sign(l.vx)*M>0?-PI/2:PI/2; } } else ped(l.x,0,l.d,Math.sign(l.vx)*M>0?-PI/2:PI/2,l.col,l.d*.1,t,1); } for(;dg<dogs.length;dg++) dogs[dg].visible=false;
    // 攤販老闆、廟會陣頭、白煙
    for(const sl of lv.stalls) if(near(sl.d)&&sl.d-cd<500) ped(LANE[4]+6,0,sl.d,PI/2*M,hcol(SHIRT,Math.floor(sl.d),5),Math.floor(sl.d)%7+.5,0,1);
    let fl=0; if(lv.parade){ const pdd=lv.parade.d0+lv.parade.v*Math.max(0,simT); for(let i=0;i<10;i++){ const x=LANE[3]+(i%3)*30-10,d=pdd-lv.parade.len/2+i*13; if(!near(d)) continue; ped(x,0,d,0,['#e23b3b','#ffd23f','#2a9d5c'][i%3],i,t,1.1); if(i%3===0&&fl<flags.length){ const f=flags[fl++]; f.visible=true; f.position.set(SX(x)+M*8,28+Math.sin(t*4+i)*1.2,-d); f.rotation.y=Math.sin(t*3+i)*.3; f.material.color.set(['#e23b3b','#ffd23f','#2a9d5c'][i%3]); } } } for(;fl<flags.length;fl++) flags[fl].visible=false;
    let sn=0; for(const s3 of lv.steam){ if(!near(s3.d)||s3.d<cd) continue; const a=.35+.3*Math.sin(t*1.5+s3.ph); if(a<.2) continue; for(let i=0;i<4&&sn<steams.length;i++){ const m=steams[sn++]; m.visible=true; m.position.set(SX(s3.x)+Math.sin(t+i)*10,5+i*13,-s3.d); m.scale.setScalar(36+i*14); } } for(;sn<steams.length;sn++) steams[sn].visible=false;
    // 收尾：沒用到的物件藏起來、行人數量
    for(const k in POOL){ const P=POOL[k]; for(let i=P.used;i<P.list.length;i++) P.list[i].visible=false; }
    for(const k in IM){ IM[k].count=pedN; IM[k].instanceMatrix.needsUpdate=true; if(IM[k].instanceColor) IM[k].instanceColor.needsUpdate=true; } }
  const yawF=f=>{ const a=f||0; return M>0?PI-a:PI+a; }; const dimStr=c0=>c0;
  function destroyAll(){ scene.traverse(m=>{ if(m.geometry&&m.geometry.dispose) m.geometry.dispose(); if(m.material){ const ms=Array.isArray(m.material)?m.material:[m.material]; for(const a of ms){ if(a.map&&a.map.dispose&&a.map!==rt.texture) a.map.dispose(); a.dispose(); } } }); if(scene.background&&scene.background.dispose) scene.background.dispose(); atx.dispose(); rt.dispose(); r.dispose(); try{ r.forceContextLoss(); }catch(e){} }
  /* 騎車的感覺：壓車傾斜、看向彎道、油門抬頭、煞車點頭、引擎抖、壓到坑洞震一下、車禍翻倒 */
  const G={canvas:cv,get q(){ return Q; },
    render(st){ const n=st.n,now=performance.now()/1000,{vx,vw,px,pd,v,lean,fall,t}=st; if(!VS[n]) VS[n]={ax:0,lastV:v,lastT:t,fov:62,bump:0,lx:px,ro:0,hx:0,hole:{}}; const V=VS[n],dt=cl(t-V.lastT,0,.1); V.lastT=t; if(dt>0){ const a=(v-V.lastV)/dt; V.ax+=(cl(a,-300,160)-V.ax)*Math.min(1,dt*5); V.lastV=v; }
      // 碰到坑洞、水窪就震一下
      for(const h of lv.holes){ if(Math.abs(pd-h.d)<8&&Math.abs(px-h.x)<h.r+6&&!V.hole[h.d]){ V.hole[h.d]=1; V.bump=1; } } V.bump=Math.max(0,V.bump-dt*3.4);
      sync(st,now);
      const sp=Math.min(1,Math.abs(v)/250),trem=Math.sin(t*37)*.035+Math.sin(t*61)*.025,rough=(.25+sp)*trem,bump=Math.sin(t*44)*V.bump*.55,fl=Math.min(1.3,fall||0)/1.3,pitch=-.058+V.ax*-.00013+bump*.02+rough*.004,yaw=-lean*.06,roll=-lean*.11;
      V.fov+=(60+sp*17-V.fov)*Math.min(1,dt*3); const X=SX(px)+lean*.8,Z=-(pd-6),Y=14+rough*.18+bump*.5+V.ax*.0009+(fl>0?-fl*fl*9:0);
      cam.position.set(X,Y,Z); cam.rotation.set(pitch+(fl>0?fl*.35:0),yaw,roll+(fl>0?Math.sin(fl*PI)*1.05+fl*.5:0)); cam.fov=V.fov; cam.aspect=vw/H; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
      head.position.set(X,16,Z); head.target.position.set(X-Math.sin(yaw)*90,0,Z-200);
      // 影子、地標跟著騎士
      if(!night){ sun.target.position.set(X,0,Z-170); sun.position.set(X-200,eve?120:320,Z-40); }
      scene.lm.position.set(X*.2+M*180,330,Z-1760); scene.lm.scale.setScalar(.9);
      // 後照鏡：每兩格更新一次，只畫一張給兩面鏡子用
      for(const k in cockpits) cockpits[k].root.visible=false; frame++;
      if(frame%2===0||st.two){ rearCam.position.set(X,17,Z+2); rearCam.rotation.set(0,PI,0); rearCam.updateMatrixWorld(true); const sa=r.shadowMap.autoUpdate; r.shadowMap.autoUpdate=false; pin.visible&&(pin.visible=pin.visible); r.setRenderTarget(rt); r.clear(); r.render(scene,rearCam); r.setRenderTarget(null); r.shadowMap.autoUpdate=sa; }
      // 車頭
      const ck=cockpits[n]||(cockpits[n]=mkCockpit(st.look)); ck.root.visible=true; ck.steer.rotation.set(-V.ax*.00016+bump*.018,-lean*.17*1,-lean*.02); ck.root.position.set(rough*.02,rough*.03-V.ax*.0007+bump*.08-(fl*1.4),0); ck.root.rotation.z=-lean*.055; if(ck.steer.grip) ck.steer.grip.rotation.x=st.gas?-.28:0; ck.update(st,now);
      // 真正畫出來
      r.setViewport(vx*Q,0,vw*Q,H*Q); r.setScissor(vx*Q,0,vw*Q,H*Q); r.setScissorTest(true); r.render(scene,cam); r.setScissorTest(false);
      // 順便算效能：太慢就自動降畫質
      tick++; if(lastT){ const d=now-lastT; if(d<.3){ tSum+=d; tN++; } } lastT=now; if(tN>=90){ const av=tSum/tN; tSum=0; tN=0; if(av>.03&&lvlQ<2){ lvlQ++; if(lvlQ===1){ r.shadowMap.enabled=false; sun.castShadow=false; scene.traverse(m=>{ if(m.material) m.material.needsUpdate=true; }); } else { Q=1; r.setSize(W*Q,H*Q,false); } } } },
    project(x,d,h,vx,vw){ const p=new T.Vector3(SX(x),h,-d).project(cam); if(p.z>1||p.z<-1) return null; return [vx+(p.x+1)/2*vw,(1-p.y)/2*H,p.z]; },
    labels:()=>labels,
    destroy:destroyAll };
  return G; }
window.__DELIVER3D=make;
})();
