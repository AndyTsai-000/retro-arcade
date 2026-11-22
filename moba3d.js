// 星界裂谷的 3D 畫面（three.js）：規則、戰鬥都在 moba.js 算，這裡只負責畫。
// 座標：公尺；x 往右、z 往畫面下方（藍方主堡在左下、紅方在右上）。
(function(){
'use strict';
const PI=Math.PI,TAU=PI*2;
function mul(seed){ let a=seed>>>0||1; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const shade=(h,k)=>{ const n=parseInt(String(h).slice(1),16); if(isNaN(n)) return h; const f=v=>Math.max(0,Math.min(255,Math.round(k>1?v+(255-v)*(k-1):v*k))); return 'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')'; };
const TEAMC=['#3d8bff','#ff4a4a'];

function make(T,o){ const {W,H,map}=o,low=!!o.low,R=mul(map.seed||7),col=c=>new T.Color(c),V=T.Vector3;
  const cv=document.createElement('canvas'),r=new T.WebGLRenderer({canvas:cv,antialias:!low}); let Q=low?1.15:1.5; r.setPixelRatio(1); r.setSize(W*Q,H*Q,false);
  r.shadowMap.enabled=true; r.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene(); scene.background=col('#9cc4dc'); scene.fog=new T.Fog(0xa8c6d4,70,150);
  const hemi=new T.HemisphereLight(0xe8f2ff,0x4a5a32,.62); scene.add(hemi);
  const sun=new T.DirectionalLight(0xfff0d6,.92); sun.castShadow=true; sun.shadow.mapSize.set(low?1024:2048,low?1024:2048); Object.assign(sun.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:1,far:140}); sun.shadow.bias=-.0008; scene.add(sun); scene.add(sun.target);
  const ph=(c,sh,m)=>new T.MeshPhongMaterial(Object.assign({color:col(c),shininess:sh==null?16:sh,specular:sh>50?0x777777:0x141414},m||{}));
  const lam=(c,m)=>new T.MeshLambertMaterial(Object.assign({color:col(c)},m||{}));
  const add=(geo,mat,x,y,z,p,sh)=>{ const m=new T.Mesh(geo,mat); m.position.set(x||0,y||0,z||0); (p||scene).add(m); m.castShadow=sh!==false; m.receiveShadow=true; return m; };
  const canv=(w,h,f)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; f(c.getContext('2d'),w,h); const t=new T.CanvasTexture(c); t.anisotropy=8; return t; };
  const B=map.B,GS=B*2+40,G0=-GS/2; // 地面範圍
  const onLane=(x,z,w)=>map.laneDist(x,z)<w,riverD=(x,z)=>map.riverDist?map.riverDist(x,z):99;
  /* ===== 地面貼圖：草地、石板路、河床、基地廣場、野區空地 ===== */
  const GT=low?1536:2048,gk=GT/GS;
  const gtex=canv(GT,GT,(c)=>{ const U=x=>(x-G0)*gk,Vz=z=>(z-G0)*gk;
    c.fillStyle='#5a8a3a'; c.fillRect(0,0,GT,GT);
    // 大片明暗、偏黃偏綠
    for(let i=0;i<260;i++){ const x=R()*GT,y=R()*GT,rad=(20+R()*90)*gk*.6,g=c.createRadialGradient(x,y,0,x,y,rad),k=R(); g.addColorStop(0,k<.33?'rgba(140,150,60,.22)':k<.66?'rgba(20,50,20,.22)':'rgba(90,130,50,.2)'); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.fillRect(x-rad,y-rad,rad*2,rad*2); }
    // 野區比較暗、有落葉泥地
    for(const ob of map.obst){ const g=c.createRadialGradient(U(ob.x),Vz(ob.z),0,U(ob.x),Vz(ob.z),(ob.r+5)*gk); g.addColorStop(0,'rgba(30,40,15,.45)'); g.addColorStop(1,'rgba(30,40,15,0)'); c.fillStyle=g; c.fillRect(U(ob.x)-(ob.r+5)*gk,Vz(ob.z)-(ob.r+5)*gk,(ob.r+5)*2*gk,(ob.r+5)*2*gk); }
    for(const cp of map.camps){ const rr=(cp.big?9:5.5)*gk,g=c.createRadialGradient(U(cp.x),Vz(cp.z),0,U(cp.x),Vz(cp.z),rr); g.addColorStop(0,'rgba(120,96,60,.85)'); g.addColorStop(.7,'rgba(110,90,55,.5)'); g.addColorStop(1,'rgba(110,90,55,0)'); c.fillStyle=g; c.beginPath(); c.arc(U(cp.x),Vz(cp.z),rr,0,TAU); c.fill(); }
    // 細草葉
    for(let i=0;i<GT*GT/100;i++){ const x=R()*GT,y=R()*GT,k=R(); c.strokeStyle=k<.45?'rgba(30,60,20,.45)':k<.85?'rgba(150,190,90,.35)':'rgba(200,210,120,.35)'; c.lineWidth=1; c.beginPath(); c.moveTo(x,y); c.lineTo(x+(R()-.5)*2,y-1.5-R()*3); c.stroke(); }
    // 河床
    if(map.river){ c.save(); c.lineCap='round'; for(const [w,cl] of [[map.river.w+5,'rgba(150,130,90,.9)'],[map.river.w+2,'rgba(110,100,70,1)'],[map.river.w,'#2c5a5a']]){ c.strokeStyle=cl; c.lineWidth=w*gk; c.beginPath(); map.river.pts.forEach((p,i)=>i?c.lineTo(U(p[0]),Vz(p[1])):c.moveTo(U(p[0]),Vz(p[1]))); c.stroke(); } c.restore();
      for(let i=0;i<3000;i++){ const t=R(),p=map.river.at(t),off=(R()-.5)*(map.river.w+4); c.fillStyle=R()<.5?'rgba(200,190,160,.5)':'rgba(70,60,40,.45)'; c.beginPath(); c.ellipse(U(p[0]+off*.707),Vz(p[1]-off*.707),1+R()*2.2,1+R()*1.6,R()*3,0,TAU); c.fill(); } }
    // 石板路：外圈泥土、石板、一顆顆石塊
    c.save(); c.lineCap='round'; c.lineJoin='round';
    for(const [w,cl] of [[map.laneW+4,'rgba(120,100,62,.55)'],[map.laneW+1.4,'#8a7a5a'],[map.laneW,'#a39478']]){ c.strokeStyle=cl; c.lineWidth=w*gk; for(const L of map.lanes){ c.beginPath(); L.forEach((p,i)=>i?c.lineTo(U(p[0]),Vz(p[1])):c.moveTo(U(p[0]),Vz(p[1]))); c.stroke(); } } c.restore();
    // 草從路邊長進石縫
    for(const L of map.lanes) for(let s=0;s<L.len;s+=.4){ const p=map.along(L,s),n=[-p[3],p[2]]; for(const sd of [-1,1]){ const q=sd*(map.laneW/2-.1-R()*.6),x=p[0]+n[0]*q,z=p[1]+n[1]*q; c.strokeStyle=R()<.5?'rgba(60,100,40,.7)':'rgba(110,150,60,.6)'; c.lineWidth=1.2; c.beginPath(); c.moveTo(U(x),Vz(z)); c.lineTo(U(x)+(R()-.5)*3,Vz(z)-2-R()*3); c.stroke(); } }
    // 基地廣場
    for(let tm=0;tm<2;tm++){ const b=map.base[tm],f=map.fount[tm]; for(const [p,rr] of [[b,13],[f,7.5]]){ const x=U(p[0]),y=Vz(p[1]); c.fillStyle='#8f8778'; c.beginPath(); c.arc(x,y,rr*gk,0,TAU); c.fill();
        for(let ring=1;ring<rr;ring+=1.1){ const n=Math.max(6,ring*5|0); for(let k=0;k<n;k++){ const a0=k/n*TAU,a1=(k+1)/n*TAU-.04; const s=165+R()*35|0; c.fillStyle='rgb('+s+','+(s-6)+','+(s-20)+')'; c.beginPath(); c.arc(x,y,(ring+.95)*gk,a0,a1); c.arc(x,y,(ring+.08)*gk,a1,a0,true); c.closePath(); c.fill(); } }
        c.strokeStyle=TEAMC[tm]; c.globalAlpha=.55; c.lineWidth=.35*gk; c.beginPath(); c.arc(x,y,(rr-1.4)*gk,0,TAU); c.stroke(); c.globalAlpha=1; } }
    for(const b of map.bush||[]){ const g=c.createRadialGradient(U(b.x),Vz(b.z),0,U(b.x),Vz(b.z),(b.r+1.2)*gk); g.addColorStop(0,'rgba(20,50,15,.75)'); g.addColorStop(.75,'rgba(25,55,18,.45)'); g.addColorStop(1,'rgba(25,55,18,0)'); c.fillStyle=g; c.beginPath(); c.arc(U(b.x),Vz(b.z),(b.r+1.2)*gk,0,TAU); c.fill(); }
    // 碎石子、落葉、小白花
    for(let i=0;i<9000;i++){ const x=R()*GT,y=R()*GT,k=R(); if(k<.5){ c.fillStyle=R()<.5?'rgba(170,160,140,.6)':'rgba(90,80,60,.5)'; c.fillRect(x,y,1.5,1.2); } else if(k<.8){ c.fillStyle=['rgba(160,110,40,.5)','rgba(190,150,60,.45)','rgba(120,80,30,.45)'][i%3]; c.beginPath(); c.ellipse(x,y,2,1,R()*3,0,TAU); c.fill(); } else { c.fillStyle=['#ffffff','#ffe066','#ff9ec8','#c8b0ff'][i%4]; c.globalAlpha=.75; c.beginPath(); c.arc(x,y,1,0,TAU); c.fill(); c.globalAlpha=1; } }
  });
  const ground=add(new T.PlaneGeometry(GS,GS),new T.MeshLambertMaterial({map:gtex}),0,0,0,null,false); ground.rotation.x=-PI/2;
  /* ===== 石板路：高解析度的石塊貼圖，沿著路鋪一條帶子 ===== */
  const clampC=v=>v<0?0:v>255?255:v; const PT=low?512:1024,cob=canv(PT,PT,(c,w,h)=>{ const RR=mul(77),N=13,cs=w/N,pts=[]; for(let gy=0;gy<N;gy++) for(let gx=0;gx<N;gx++) pts.push([(gx+.15+RR()*.7)*cs,(gy+.15+RR()*.7)*cs,112+RR()*52,RR()*16-4,RR()]);
    const img=c.createImageData(w,h),D=img.data;
    for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const gx=Math.floor(x/cs),gy=Math.floor(y/cs); let f1=1e9,f2=1e9,b1=null,dx1=0,dy1=0;
      for(let oy=-1;oy<=1;oy++) for(let ox=-1;ox<=1;ox++){ const cx=(gx+ox+N)%N,cy=(gy+oy+N)%N,q=pts[cy*N+cx],px=q[0]+(gx+ox-cx)*cs,py=q[1]+(gy+oy-cy)*cs,d=Math.hypot(x-px,y-py); if(d<f1){ f2=f1; f1=d; b1=q; dx1=x-px; dy1=y-py; } else if(d<f2) f2=d; }
      const edge=f2-f1,i=(y*w+x)*4,nn=(Math.sin(x*.9+y*.3)*Math.sin(y*.7-x*.2)+Math.sin(x*.13+y*.21)*.6)*6+(Math.random()-.5)*14;
      if(edge<cs*.07){ const g2=b1[4]<.3&&edge<cs*.04; D[i]=g2?58:62+nn*.5; D[i+1]=g2?84:50+nn*.4; D[i+2]=g2?34:34; D[i+3]=255; continue; }
      const bev=Math.min(1,(edge-cs*.07)/(cs*.12)),lit=(-dx1-dy1)/(cs*.9)*18*(1-bev*.5),v=b1[2]*(.86+.14*bev)+lit+nn,warm=b1[3];
      D[i]=clampC(v+6+warm); D[i+1]=clampC(v-2+warm*.5); D[i+2]=clampC(v-16); D[i+3]=255; }
    c.putImageData(img,0,0);
    for(let k=0;k<40;k++){ const x=RR()*w,y=RR()*h,r2=20+RR()*60,g=c.createRadialGradient(x,y,0,x,y,r2); g.addColorStop(0,RR()<.5?'rgba(80,60,35,.18)':'rgba(255,245,220,.1)'); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.fillRect(x-r2,y-r2,r2*2,r2*2); }
    for(let k=0;k<160;k++){ c.fillStyle='rgba(70,110,40,.55)'; c.beginPath(); c.ellipse(RR()*w,RR()*h,2+RR()*3,1,RR()*3,0,TAU); c.fill(); } });
  cob.wrapS=cob.wrapT=T.RepeatWrapping;
  const edgeA=canv(64,8,(c,w)=>{ const g=c.createLinearGradient(0,0,w,0); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(.12,'#fff'); g.addColorStop(.88,'#fff'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(0,0,w,8); });
  const laneM=new T.MeshLambertMaterial({map:cob,alphaMap:edgeA,transparent:true,depthWrite:false}); laneM.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <alphamap_fragment>','diffuseColor.a *= texture2D( alphaMap, vec2(vUv2x, .5) ).g;').replace('#include <common>','#include <common>\nvarying float vUv2x;'); sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float ux;\nvarying float vUv2x;').replace('#include <begin_vertex>','#include <begin_vertex>\nvUv2x=ux;'); };
  for(const L of map.lanes){ const P=[],UV=[],UX=[],I=[],w=map.laneW+.6,step=.6; let n=0; for(let s0=0;s0<=L.len+.01;s0+=step,n++){ const s1=Math.min(s0,L.len),a=map.along(L,Math.max(0,s1-2)),b=map.along(L,Math.min(L.len,s1+2)),p=map.along(L,s1); let dx=b[0]-a[0],dz=b[1]-a[1]; const l=Math.hypot(dx,dz)||1; dx/=l; dz/=l; const nx=-dz,nz=dx;
      for(const sd of [-1,1]){ P.push(p[0]+nx*sd*w/2,.025,p[1]+nz*sd*w/2); UV.push(sd*w/2/7+.5*0+(p[0]+nx*sd*w/2)/7,(p[1]+nz*sd*w/2)/7); UX.push(sd<0?0:1); }
      if(n>0){ const k=n*2; I.push(k-2,k-1,k,k-1,k+1,k); } }
    const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(P,3)); g.setAttribute('uv',new T.Float32BufferAttribute(UV,2)); g.setAttribute('ux',new T.Float32BufferAttribute(UX,1)); g.setIndex(I); g.computeVertexNormals();
    const m=new T.Mesh(g,laneM); m.receiveShadow=true; m.renderOrder=1; scene.add(m); }
  // 細節貼圖：近看的草葉紋路（重複鋪）
  const dtex=canv(256,256,(c,w,h)=>{ c.clearRect(0,0,w,h); for(let i=0;i<2600;i++){ const x=Math.random()*w,y=Math.random()*h; c.strokeStyle=Math.random()<.5?'rgba(0,0,0,.25)':'rgba(255,255,220,.22)'; c.lineWidth=1; c.beginPath(); c.moveTo(x,y); c.lineTo(x+(Math.random()-.5)*3,y-3-Math.random()*4); c.stroke(); } }); dtex.wrapS=dtex.wrapT=T.RepeatWrapping; dtex.repeat.set(GS/3,GS/3);
  const detail=add(new T.PlaneGeometry(GS,GS),new T.MeshLambertMaterial({map:dtex,transparent:true,opacity:.45,depthWrite:false}),0,.01,0,null,false); detail.rotation.x=-PI/2; detail.castShadow=false;
  const outer=add(new T.PlaneGeometry(600,600),lam('#3e6229'),0,-.02,0,null,false); outer.rotation.x=-PI/2;
  /* ===== 河水 ===== */
  let water=null,wtex=null;
  if(map.river){ wtex=canv(256,256,(c,w,h)=>{ c.fillStyle='#3a8aa8'; c.fillRect(0,0,w,h); for(let i=0;i<500;i++){ const x=Math.random()*w,y=Math.random()*h; c.strokeStyle='rgba(220,245,255,'+(.15+Math.random()*.3)+')'; c.lineWidth=1+Math.random(); c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x+6,y-2,x+12,y); c.stroke(); } }); wtex.wrapS=wtex.wrapT=T.RepeatWrapping;
    const L=map.river.len,wg=new T.PlaneGeometry(L,map.river.w-.4,1,1); wtex.repeat.set(L/8,map.river.w/8); water=add(wg,new T.MeshPhongMaterial({map:wtex,color:0xbfe8ff,transparent:true,opacity:.82,shininess:110,specular:0xbbbbbb,depthWrite:false}),map.river.cx,.06,map.river.cz,null,false); water.rotation.set(-PI/2,0,map.river.ang); }
  /* ===== 石頭材質 ===== */
  const stoneT=canv(256,256,(c,w,h)=>{ c.fillStyle='#9a9488'; c.fillRect(0,0,w,h); for(let y=0;y<h;y+=32){ for(let x=(y/32%2)*24;x<w+48;x+=48){ const s=130+Math.random()*50|0; c.fillStyle='rgb('+s+','+(s-4)+','+(s-14)+')'; c.fillRect(x-22,y+2,44,28); c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(x-22,y+2,44,3); c.fillStyle='rgba(0,0,0,.2)'; c.fillRect(x-22,y+27,44,3); } } for(let i=0;i<1500;i++){ c.fillStyle=Math.random()<.5?'rgba(0,0,0,.12)':'rgba(255,255,255,.08)'; c.fillRect(Math.random()*w,Math.random()*h,2,2); } }); stoneT.wrapS=stoneT.wrapT=T.RepeatWrapping;
  const stoneM=new T.MeshPhongMaterial({map:stoneT,shininess:8,specular:0x111111});
  const woodT=canv(128,128,(c,w,h)=>{ c.fillStyle='#7a5434'; c.fillRect(0,0,w,h); for(let y=0;y<h;y+=16){ c.fillStyle='rgba(0,0,0,.25)'; c.fillRect(0,y,w,2); for(let k=0;k<10;k++){ c.strokeStyle='rgba(50,30,15,.35)'; c.lineWidth=1; c.beginPath(); const yy=y+3+Math.random()*12; c.moveTo(0,yy); c.bezierCurveTo(w*.3,yy+2,w*.6,yy-2,w,yy+1); c.stroke(); } } });
  const nz3=(x,y,z,sd)=>Math.sin(x*1.9+sd)*Math.sin(y*2.3+sd*1.7)*Math.sin(z*1.7+sd*.6)+.5*Math.sin(x*4.3+sd*2.1)*Math.sin(y*3.7+sd)*Math.sin(z*4.1+sd*1.3)+.25*Math.sin(x*8.1+sd)*Math.sin(z*7.3+sd*.4);
  const rockGeo=(s,seed,det)=>{ const g=new T.IcosahedronGeometry(1,det==null?2:det),p=g.attributes.position,sd=(seed%97)*.37+1.3; for(let i=0;i<p.count;i++){ let x=p.getX(i),y=p.getY(i),z=p.getZ(i); const k=1+nz3(x,y,z,sd)*.22; x*=k; y*=k; z*=k; if(y<-.35) y=-.35+(y+.35)*.25; p.setXYZ(i,x*s[0],y*s[1],z*s[2]); } g.computeVertexNormals(); return g; };
  // 天然石頭：頂部長青苔、下面比較暗，顏色有深淺
  const ROCKV=[...Array(6)].map((_,v)=>{ const g=rockGeo([1.15,.7,1],v*13+5,2),p=g.attributes.position,n=g.attributes.normal,cl=[],RR=mul(v+7),base=[[.44,.42,.39],[.5,.47,.42],[.4,.39,.37],[.47,.42,.36],[.42,.41,.4],[.52,.49,.44]][v];
    for(let i=0;i<p.count;i++){ const y=p.getY(i),ny=n.getY(i),nn=nz3(p.getX(i)*2,y*2,p.getZ(i)*2,v),k=.82+nn*.12+(y+.35)*.25; let r=base[0]*k,gg=base[1]*k,b=base[2]*k; const moss=ny>.55&&nn>-.15; if(moss){ const m=Math.min(1,(ny-.55)*3)*.85; r=r*(1-m)+.22*m; gg=gg*(1-m)+.34*m; b=b*(1-m)+.12*m; } if(y<-.2){ r*=.75; gg*=.73; b*=.7; } cl.push(r,gg,b); }
    g.setAttribute('color',new T.Float32BufferAttribute(cl,3)); return g; });
  const natRockM=new T.MeshLambertMaterial({vertexColors:true}),clampN=(v,a,b)=>v<a?a:v>b?b:v;
  const natRock=(x,z,sc,v,par)=>{ const m=add(ROCKV[v%6],natRockM,x,sc*.28,z,par); m.scale.set(sc*(.9+R()*.3),sc*(.8+R()*.5),sc*(.9+R()*.3)); m.rotation.y=R()*TAU; return m; };
  const rockM=new T.MeshPhongMaterial({color:0x8e8a80,flatShading:true,shininess:4,specular:0x111111});
  /* ===== 草叢（會隨風擺） ===== */
  const uT={value:0};
  const sway=m=>{ m.onBeforeCompile=sh=>{ sh.uniforms.uT=uT; sh.vertexShader='uniform float uT;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\n vec4 wp=instanceMatrix*vec4(position,1.);\n#else\n vec4 wp=vec4(position,1.);\n#endif\n float hh=max(position.y,0.);\n transformed.x+=sin(uT*1.7+wp.x*.31+wp.z*.23)*.11*hh; transformed.z+=cos(uT*1.3+wp.x*.2)*.06*hh;'); }; return m; };
  const bladeT=canv(128,128,(c,w,h)=>{ c.clearRect(0,0,w,h); for(let i=0;i<46;i++){ const x=6+Math.random()*116,hh=40+Math.random()*86,lean=(Math.random()-.5)*36,dry=Math.random()<.12,g=c.createLinearGradient(0,h,0,h-hh); g.addColorStop(0,dry?'#5a5228':'#24401a'); g.addColorStop(.5,dry?'#9a8a48':'#4f8a30'); g.addColorStop(1,dry?'#d0bc78':(Math.random()<.5?'#b8d870':'#8cc050')); c.fillStyle=g; c.beginPath(); c.moveTo(x-1.6,h); c.quadraticCurveTo(x+lean*.35,h-hh*.55,x+lean,h-hh); c.quadraticCurveTo(x+lean*.35+.8,h-hh*.55,x+1.6,h); c.fill(); }
    for(let i=0;i<0;i++){ const x=10+Math.random()*108,hh=60+Math.random()*64,lean=(Math.random()-.5)*30,g=c.createLinearGradient(0,h,0,h-hh); g.addColorStop(0,'#2f5a1f'); g.addColorStop(1,Math.random()<.5?'#9cc85a':'#7aa844'); c.fillStyle=g; c.beginPath(); c.moveTo(x-3,h); c.quadraticCurveTo(x+lean*.4,h-hh*.6,x+lean,h-hh); c.quadraticCurveTo(x+lean*.4+1,h-hh*.6,x+3,h); c.fill(); } });
  const tuftG=new T.BufferGeometry(); { const P=[],UV=[],I=[]; for(let k=0;k<3;k++){ const a=k/3*PI,cx=Math.cos(a)*.35,cz=Math.sin(a)*.35,b=P.length/3; P.push(-cx,0,-cz,cx,0,cz,cx,.6,cz,-cx,.6,-cz); UV.push(0,0,1,0,1,1,0,1); I.push(b,b+1,b+2,b,b+2,b+3); } tuftG.setAttribute('position',new T.Float32BufferAttribute(P,3)); tuftG.setAttribute('uv',new T.Float32BufferAttribute(UV,2)); tuftG.setIndex(I); tuftG.computeVertexNormals(); }
  const grassM=sway(new T.MeshLambertMaterial({map:bladeT,alphaTest:.45,side:T.DoubleSide}));
  const okGrass=(x,z)=>!onLane(x,z,map.laneW/2+.4)&&riverD(x,z)>map.riverW/2+1&&map.base.every(b=>Math.hypot(x-b[0],z-b[1])>14)&&map.fount.every(b=>Math.hypot(x-b[0],z-b[1])>9)&&Math.abs(x)<B+18&&Math.abs(z)<B+18;
  const edgeT=[]; for(const L of map.lanes) for(let s0=0;s0<L.len;s0+=1.1){ const p=map.along(L,s0); for(const sd of [-1,1]){ const q=sd*(map.laneW/2+.25+R()*.9); edgeT.push([p[0]-p[3]*q,p[1]+p[2]*q]); } }
  const NG=(low?2200:5600)+edgeT.length,grass=new T.InstancedMesh(tuftG,grassM,NG); grass.receiveShadow=true; { const m=new T.Matrix4(),q=new T.Quaternion(),s=new V(),p=new V(),e=new T.Euler(),cc=new T.Color(); let n=0,tries=0; for(const [x,z] of edgeT){ if(riverD(x,z)<map.riverW/2+.5) continue; e.set(0,R()*PI,0); q.setFromEuler(e); const k=.5+R()*.6; s.set(k,k*(.6+R()*.7),k); p.set(x,0,z); m.compose(p,q,s); grass.setMatrixAt(n,m); cc.setHSL(.18+R()*.1,.35+R()*.25,.6+R()*.2); grass.setColorAt(n,cc); n++; }
    while(n<NG&&tries<NG*6){ tries++; const x=(R()-.5)*(GS-12),z=(R()-.5)*(GS-12); if(!okGrass(x,z)) continue; const lane=map.laneDist(x,z)<map.laneW/2+3; if(lane&&R()<.5) continue; e.set(0,R()*PI,0); q.setFromEuler(e); const k=.8+R()*.9; s.set(k,k*(.7+R()*.8),k); p.set(x,0,z); m.compose(p,q,s); grass.setMatrixAt(n,m); cc.setHSL(.2+R()*.1,.4+R()*.25,.62+R()*.22); grass.setColorAt(n,cc); n++; } grass.count=n; } scene.add(grass);
  // 小花
  const flowerT=['daisy','butter','violet','pink'].map(kind=>canv(64,64,(c,w,h)=>{ c.clearRect(0,0,w,h); const stems=kind==='daisy'?3:2;
      for(let k=0;k<stems;k++){ const x=16+k*16+Math.random()*6,top=10+Math.random()*16; c.strokeStyle='#2f6420'; c.lineWidth=2.4; c.beginPath(); c.moveTo(x,h); c.quadraticCurveTo(x-3,h-20,x+1,top+6); c.stroke(); c.fillStyle='#4f8a30'; c.beginPath(); c.ellipse(x-4,h-16,5,2,-.5,0,TAU); c.fill();
        const pc={daisy:'#ffffff',butter:'#ffd83a',violet:'#9a6ae0',pink:'#ff8ab8'}[kind],ce={daisy:'#f0c020',butter:'#e0a010',violet:'#ffe07a',pink:'#fff0a0'}[kind],np=kind==='violet'?5:kind==='butter'?5:8;
        for(let q=0;q<np;q++){ const a=q/np*TAU; c.fillStyle=pc; c.beginPath(); c.ellipse(x+1+Math.cos(a)*5,top+Math.sin(a)*4,kind==='daisy'?4.2:3.6,2.2,a,0,TAU); c.fill(); }
        c.fillStyle=ce; c.beginPath(); c.arc(x+1,top,2.6,0,TAU); c.fill(); } }));
  const flG=new T.BufferGeometry(); { const P=[],UV=[],I=[]; for(let k=0;k<2;k++){ const a=k*PI/2,cx=Math.cos(a)*.22,cz=Math.sin(a)*.22,b=P.length/3; P.push(-cx,0,-cz,cx,0,cz,cx,.42,cz,-cx,.42,-cz); UV.push(0,0,1,0,1,1,0,1); I.push(b,b+1,b+2,b,b+2,b+3); } flG.setAttribute('position',new T.Float32BufferAttribute(P,3)); flG.setAttribute('uv',new T.Float32BufferAttribute(UV,2)); flG.setIndex(I); flG.setAttribute('normal',new T.Float32BufferAttribute(P.map((v,i)=>i%3===1?1:0),3)); }
  const flowerMeshes=flowerT.map((tx,ti)=>{ const NF=low?120:340,fm=new T.InstancedMesh(flG,sway(new T.MeshLambertMaterial({map:tx,alphaTest:.5,side:T.DoubleSide})),NF),m=new T.Matrix4(); let n=0,tries=0;
    // 花一叢一叢長
    let cx0=0,cz0=0; while(n<NF&&tries<NF*20){ tries++; if(n%7===0){ cx0=(R()-.5)*(GS-14); cz0=(R()-.5)*(GS-14); } const x=cx0+(R()-.5)*5,z=cz0+(R()-.5)*5; if(!okGrass(x,z)||map.laneDist(x,z)<map.laneW/2+1.2) continue; const k=1.2+R()*.7; m.makeRotationY(R()*TAU); m.scale(new V(k,k,k)); m.setPosition(x,0,z); fm.setMatrixAt(n,m); n++; }
    fm.count=n; fm.frustumCulled=false; scene.add(fm); return fm; });
  const flowers={frustumCulled:false};
  // 散落的小石頭
  const NP=low?160:420,pebbles=new T.InstancedMesh(ROCKV[1],natRockM,NP); pebbles.castShadow=true; pebbles.receiveShadow=true; { const m=new T.Matrix4(),cc=new T.Color(); for(let n=0;n<NP;n++){ let x,z; do{ x=(R()-.5)*(GS-10); z=(R()-.5)*(GS-10); }while(map.laneDist(x,z)<map.laneW/2+.3||riverD(x,z)<map.riverW/2); const k=.12+R()*.4; m.makeRotationY(R()*TAU); m.scale(new V(k,k*(.6+R()*.5),k)); m.setPosition(x,k*.12,z); pebbles.setMatrixAt(n,m); cc.setHSL(.08,.05+R()*.08,.75+R()*.35); pebbles.setColorAt(n,cc); } } scene.add(pebbles);
  /* ===== 樹（障礙物、地圖外圍的森林） ===== */
  const trees=[]; for(const ob of map.obst){ if(ob.k==='rock') continue; const n=Math.max(1,Math.round(ob.r*ob.r/5)); for(let i=0;i<n;i++){ const a=R()*TAU,d=Math.sqrt(R())*ob.r*.8; trees.push([ob.x+Math.cos(a)*d,ob.z+Math.sin(a)*d,.85+R()*.6]); } }
  for(let i=0;i<(low?220:380);i++){ const a=R()*TAU,edge=map.edge(a),d=edge+3+R()*14,x=Math.cos(a)*d,z=Math.sin(a)*d; if(Math.abs(x)>GS/2-4||Math.abs(z)>GS/2-4) continue; if(map.fount.some(f=>Math.hypot(x-f[0],z-f[1])<13)) continue; trees.push([x,z,.75+R()*.45]); }
  const NT=trees.length,trunk=new T.InstancedMesh(new T.CylinderGeometry(.18,.32,2.6,6).translate(0,1.3,0),lam('#5a3e26'),NT); trunk.castShadow=false; trunk.receiveShadow=true;
  const leafG=new T.IcosahedronGeometry(1,low?0:1); { const p=leafG.attributes.position; for(let i=0;i<p.count;i++){ const k=.85+Math.random()*.3; p.setXYZ(i,p.getX(i)*k,p.getY(i)*k*.85,p.getZ(i)*k); } leafG.computeVertexNormals(); }
  const leafM=new T.MeshPhongMaterial({flatShading:true,shininess:4,specular:0x111111}),leaves=new T.InstancedMesh(leafG,leafM,NT*3); leaves.castShadow=true; leaves.receiveShadow=true;
  { const m=new T.Matrix4(),cc=new T.Color(); trees.forEach(([x,z,s],i)=>{ m.makeRotationY(R()*TAU); m.scale(new V(s,s,s)); m.setPosition(x,0,z); trunk.setMatrixAt(i,m); const hue=.24+R()*.1;
      for(let k=0;k<3;k++){ const a=k/3*TAU+R(),d=k===2?0:.7*s,yy=(k===2?3.9:2.9+R()*.6)*s,ks=(k===2?1.35:1.15+R()*.3)*s; m.makeRotationY(R()*TAU); m.scale(new V(ks,ks,ks)); m.setPosition(x+Math.cos(a)*d,yy,z+Math.sin(a)*d); leaves.setMatrixAt(i*3+k,m); cc.setHSL(hue,.42+R()*.15,.2+R()*.1+(k===2?.05:0)); leaves.setColorAt(i*3+k,cc); } }); }
  scene.add(trunk); scene.add(leaves); [grass,flowers,pebbles,trunk,leaves].forEach(m=>m.frustumCulled=false);
  // 灌木
  const bushes=[]; for(const ob of map.obst) for(let i=0;i<Math.max(2,ob.r*1.4|0);i++){ const a=R()*TAU,d=ob.r*(.7+R()*.45); bushes.push([ob.x+Math.cos(a)*d,ob.z+Math.sin(a)*d,.5+R()*.6]); }
  const bush=new T.InstancedMesh(leafG,new T.MeshPhongMaterial({flatShading:true,shininess:4,specular:0x111111}),bushes.length); bush.castShadow=true; bush.receiveShadow=true; { const m=new T.Matrix4(),cc=new T.Color(); bushes.forEach(([x,z,s],i)=>{ m.makeRotationY(R()*TAU); m.scale(new V(s*1.3,s,s*1.3)); m.setPosition(x,s*.55,z); bush.setMatrixAt(i,m); cc.setHSL(.26+R()*.06,.45,.22+R()*.1); bush.setColorAt(i,cc); }); } bush.frustumCulled=false; scene.add(bush);
  // 土丘牆：側面是一層層的泥土、頂上長草，旁邊散著石頭
  function moundGeo(r,hgt,seed){ const g=new T.CylinderGeometry(r*.78,r*1.08,hgt,28,6,false),p=g.attributes.position,cl=[],sd=seed%91*.31;
    for(let i=0;i<p.count;i++){ let x=p.getX(i),y=p.getY(i),z=p.getZ(i); const a=Math.atan2(z,x),u=(y+hgt/2)/hgt,rr=Math.hypot(x,z),wob=1+.16*Math.sin(a*3+sd)+.08*Math.sin(a*7+sd*2)+.05*nz3(x,y,z,sd);
      let ny=y; if(u>.99&&rr<r*.8){ ny=hgt/2+(1-rr/(r*.8))*.6+.12*nz3(x*1.5,0,z*1.5,sd); } x*=wob; z*=wob; p.setXYZ(i,x,ny+hgt/2-.05,z);
      const top=u>.92,strata=.06*Math.sin(y*7+sd),k=.9+.12*nz3(x*2,y*3,z*2,sd); if(top){ const pn=nz3(x*1.3,0,z*1.3,sd+5); if(pn>.35) cl.push(.36*k,.29*k,.18*k); else cl.push((.2+pn*.05)*k,(.33+pn*.06)*k,(.13+pn*.02)*k); } else { const dk=(.62+u*.38)*(u<.12?.75:1); cl.push((.42+strata)*k*dk,(.31+strata*.8)*k*dk,(.2+strata*.5)*k*dk); } }
    g.setAttribute('color',new T.Float32BufferAttribute(cl,3)); g.computeVertexNormals(); return g; }
  const moundM=new T.MeshLambertMaterial({vertexColors:true});
  const mTuft=[]; for(const ob of map.obst){ if(ob.k==='rock'){ const hh=1.8+R()*1.2,md=add(moundGeo(ob.r*.95,hh,(ob.x*7+ob.z*3)|0),moundM,ob.x,0,ob.z); md.rotation.y=R()*TAU;
      for(let i=0;i<4;i++){ const a=R()*TAU; natRock(ob.x+Math.cos(a)*ob.r*.95,ob.z+Math.sin(a)*ob.r*.95,.5+R()*.7,i+ob.r*3|0); }
      for(let i=0;i<Math.round(ob.r*ob.r*.9);i++){ const a=R()*TAU,d=Math.sqrt(R())*ob.r*.62; mTuft.push([ob.x+Math.cos(a)*d,hh+.25*(1-d/(ob.r*.75)),ob.z+Math.sin(a)*d]); }
      for(let i=0;i<3;i++){ const a=R()*TAU,d=R()*ob.r*.4; natRock(ob.x+Math.cos(a)*d,ob.z+Math.sin(a)*d,.4+R()*.4,i).position.y+=hh; } }
    else if(R()<.5){ const a=R()*TAU; natRock(ob.x+Math.cos(a)*ob.r*.7,ob.z+Math.sin(a)*ob.r*.7,.7+R()*.8,(ob.x|0)+3); } }
  if(mTuft.length){ const tg=new T.InstancedMesh(tuftG,grassM,mTuft.length),m=new T.Matrix4(),cc=new T.Color(); mTuft.forEach(([x,y,z],n)=>{ const k=.7+R()*.8; m.makeRotationY(R()*TAU); m.scale(new V(k,k*(.6+R()*.6),k)); m.setPosition(x,y,z); tg.setMatrixAt(n,m); cc.setHSL(.2+R()*.1,.4+R()*.2,.55+R()*.2); tg.setColorAt(n,cc); }); tg.frustumCulled=false; scene.add(tg); }
  /* ===== 防禦塔、主堡、泉水 ===== */
  const glowT=canv(64,64,(c,w)=>{ const g=c.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.3,'rgba(255,255,255,.55)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(0,0,64,64); });
  const glow=(c2,s)=>{ const sp=new T.Sprite(new T.SpriteMaterial({map:glowT,color:col(c2),transparent:true,depthWrite:false,blending:T.AdditiveBlending})); sp.scale.set(s,s,1); return sp; };
  const metal=c2=>new T.MeshPhongMaterial({color:col(c2),shininess:80,specular:0x888888});
  const S={tow:new Map(),core:[],fount:[]};
  function buildTower(t){ const g=new T.Group(); g.position.set(t.x,0,t.z); g.scale.setScalar(.78); scene.add(g); const tc=TEAMC[t.team]; const stoneM=new T.MeshPhongMaterial({map:stoneT,shininess:8,specular:0x111111,transparent:true});
    const gold=metal('#d8b860'),tmM=metal(shade(tc,.75)),dk=ph('#1a1612',4),lit=new T.MeshBasicMaterial({color:col(shade(tc,1.5))});
    // 兩層台階的底座、四根斜撐
    add(new T.CylinderGeometry(2.5,2.85,.5,12),stoneM,0,.25,0,g); add(new T.CylinderGeometry(2.15,2.45,.5,12),stoneM,0,.7,0,g);
    for(let k=0;k<4;k++){ const a=k/4*TAU+PI/4; const bt=add(new T.CylinderGeometry(.22,.5,2.6,4),stoneM,Math.cos(a)*1.6,2.1,Math.sin(a)*1.6,g); bt.rotation.y=-a+PI/4; add(new T.BoxGeometry(.3,.12,.3),gold,Math.cos(a)*1.6,3.45,Math.sin(a)*1.6,g).rotation.y=-a; }
    add(new T.CylinderGeometry(1.25,1.65,4.6,12),stoneM,0,3,0,g);
    for(const y of [1.2,3.2,5.1]) add(new T.TorusGeometry(y===5.1?1.35:1.55-y*.07,.12,8,28),y===5.1?gold:tmM,0,y,0,g).rotation.x=PI/2;
    // 四面發光的窗
    for(let k=0;k<4;k++){ const a=k/4*TAU; const w=add(new T.BoxGeometry(.42,.7,.22),dk,Math.cos(a)*1.36,4.15,Math.sin(a)*1.36,g,false); w.rotation.y=-a+PI/2; const wl=add(new T.BoxGeometry(.28,.52,.05),lit,Math.cos(a)*1.46,4.15,Math.sin(a)*1.46,g,false); wl.rotation.y=-a+PI/2; const ar=add(new T.CylinderGeometry(.21,.21,.22,10,1,false,0,PI),stoneM,Math.cos(a)*1.38,4.5,Math.sin(a)*1.38,g,false); ar.rotation.z=PI/2; ar.rotation.y=-a; }
    // 城垛
    add(new T.CylinderGeometry(1.75,1.25,.7,12),stoneM,0,5.6,0,g); for(let k=0;k<10;k++){ const a=k/10*TAU; add(new T.BoxGeometry(.42,.6,.42),stoneM,Math.cos(a)*1.52,6.2,Math.sin(a)*1.52,g).rotation.y=-a; }
    // 頂上的水晶：四根金柱撐著屋頂、旋轉的光環
    for(let k=0;k<4;k++){ const a=k/4*TAU+PI/4; add(new T.CylinderGeometry(.07,.1,2.3,6),gold,Math.cos(a)*.95,7.35,Math.sin(a)*.95,g); }
    add(new T.TorusGeometry(.98,.08,6,24),gold,0,8.5,0,g).rotation.x=PI/2; add(new T.ConeGeometry(1.2,1,8),tmM,0,9,0,g); add(new T.SphereGeometry(.16,10,8),gold,0,9.6,0,g);
    const cry=add(new T.OctahedronGeometry(.8,0),new T.MeshPhongMaterial({color:col(tc),emissive:col(shade(tc,.6)),shininess:100,specular:0xffffff,transparent:true,opacity:.92}),0,7.3,0,g); cry.scale.set(1,1.5,1);
    const rg=add(new T.TorusGeometry(1.25,.04,6,32),new T.MeshBasicMaterial({color:col(shade(tc,1.4))}),0,7.3,0,g,false); rg.rotation.x=PI/2.6;
    const gl=glow(tc,5); gl.position.y=7.3; g.add(gl);
    // 隊旗（有金色徽章）和兩支火把
    for(const s of [-1,1]){ const banner=add(new T.PlaneGeometry(.9,2.1),new T.MeshLambertMaterial({color:col(tc),side:T.DoubleSide}),s*1.3,3.6,.95,g); banner.rotation.y=s*.6; const em=add(new T.OctahedronGeometry(.18,0),gold,s*1.33,3.9,1.0,g,false); em.scale.z=.3; em.rotation.y=s*.6;
      const a=s>0?PI*.25:PI*.75; add(new T.CylinderGeometry(.05,.05,.5,6),ph('#3a2a1a',6),Math.cos(a)*1.85,5.55,-Math.sin(a)*1.85,g,false); add(new T.SphereGeometry(.12,8,6),new T.MeshBasicMaterial({color:0xffb050}),Math.cos(a)*1.85,5.85,-Math.sin(a)*1.85,g,false); const fl=glow('#ff9a3d',1.3); fl.position.set(Math.cos(a)*1.85,5.9,-Math.sin(a)*1.85); g.add(fl); }
    const rub=new T.Group(); for(let k=0;k<11;k++){ const rk=add(rockGeo([1,.6,1],k+t.id),stoneM,(R()-.5)*3.4,.3,(R()-.5)*3.4,rub); rk.scale.setScalar(.5+R()*.6); } add(new T.CylinderGeometry(1.4,1.65,1.1,12,1,true),stoneM,0,.55,0,rub); rub.visible=false; g.add(rub);
    const mats=new Set(); g.traverse(m=>{ if(m.isMesh&&m.material&&!m.parent.isSprite) mats.add(m.material); }); S.tow.set(t.id,{g,cry,gl,rg,rub,mats:[...mats],fade:1,x:t.x,z:t.z,parts:g.children.filter(c2=>c2!==rub)}); }
  function buildCore(c0){ const g=new T.Group(); g.position.set(c0.x,0,c0.z); scene.add(g); const tc=TEAMC[c0.team],gold=metal('#e0c070'),lt=col(shade(tc,1.5));
    // 三層八角平台、發光符文圈
    add(new T.CylinderGeometry(5.3,5.9,.6,8),stoneM,0,.3,0,g); add(new T.CylinderGeometry(4.3,4.8,.6,8),stoneM,0,.9,0,g); add(new T.CylinderGeometry(3.1,3.5,.5,8),stoneM,0,1.45,0,g);
    for(const [rr,y] of [[5.35,.62],[4.35,1.21]]) add(new T.TorusGeometry(rr,.07,4,8),gold,0,y,0,g,false).rotation.x=PI/2;
    const rune=add(new T.TorusGeometry(2.75,.06,4,48),new T.MeshBasicMaterial({color:lt}),0,1.72,0,g,false); rune.rotation.x=PI/2;
    for(let k=0;k<8;k++){ const a=k/8*TAU; add(new T.BoxGeometry(.32,.04,.32),new T.MeshBasicMaterial({color:lt}),Math.cos(a)*2.75,1.73,Math.sin(a)*2.75,g,false).rotation.y=a+PI/4; }
    // 六根柱子、頂上的金環和小水晶
    for(let k=0;k<6;k++){ const a=k/6*TAU,x=Math.cos(a)*4.2,z=Math.sin(a)*4.2; add(new T.BoxGeometry(1,.3,1),stoneM,x,1.35,z,g).rotation.y=-a; add(new T.CylinderGeometry(.35,.45,4.2,8),stoneM,x,3.4,z,g); add(new T.TorusGeometry(.42,.07,6,12),gold,x,2.2,z,g,false).rotation.x=PI/2; add(new T.BoxGeometry(.95,.3,.95),stoneM,x,5.55,z,g).rotation.y=-a;
      add(new T.OctahedronGeometry(.38,0),new T.MeshPhongMaterial({color:col(tc),emissive:col(shade(tc,.5))}),x,6.15,z,g); }
    add(new T.TorusGeometry(4.2,.16,6,48),gold,0,5.75,0,g).rotation.x=PI/2;
    // 中央台座、主水晶、繞著轉的小水晶、能量光柱
    add(new T.CylinderGeometry(1.1,1.6,1.3,8),stoneM,0,2.3,0,g); add(new T.TorusGeometry(1.15,.08,6,16),gold,0,2.95,0,g).rotation.x=PI/2;
    const cry=add(new T.OctahedronGeometry(1.6,0),new T.MeshPhongMaterial({color:col(tc),emissive:col(shade(tc,.55)),shininess:120,specular:0xffffff,transparent:true,opacity:.9}),0,4.6,0,g); cry.scale.set(1,1.8,1);
    const ring=add(new T.TorusGeometry(2.6,.12,8,40),gold,0,4.6,0,g); ring.rotation.x=PI/2.3; const gl=glow(tc,12); gl.position.y=4.6; g.add(gl);
    const orb=new T.Group(); orb.position.y=4.6; g.add(orb); for(let k=0;k<4;k++){ const a=k/4*TAU,o=add(new T.OctahedronGeometry(.34,0),new T.MeshPhongMaterial({color:col(tc),emissive:col(shade(tc,.7)),shininess:100}),Math.cos(a)*3.2,Math.sin(k*1.7)*.5,Math.sin(a)*3.2,orb,false); o.scale.y=1.6; }
    const beam=add(new T.CylinderGeometry(.55,.55,9,14,1,true),new T.MeshBasicMaterial({color:lt,transparent:true,opacity:.16,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}),0,7.5,0,g,false);
    S.core[c0.team]={g,cry,ring,gl,orb,beam,rune}; }
  function buildFount(tm){ const f=map.fount[tm],g=new T.Group(); g.position.set(f[0],0,f[1]); scene.add(g); const tc=TEAMC[tm];
    add(new T.TorusGeometry(5.6,.28,8,40),stoneM,0,.1,0,g,false).rotation.x=PI/2;
    const wm=add(new T.CircleGeometry(5.4,40),new T.MeshPhongMaterial({color:col(tc),emissive:col(shade(tc,.35)),transparent:true,opacity:.4,shininess:120,depthWrite:false}),0,.04,0,g,false); wm.rotation.x=-PI/2;
    for(let k=0;k<6;k++){ const a=k/6*TAU,ob=add(new T.CylinderGeometry(.25,.35,1.6,6),stoneM,Math.cos(a)*6.3,.8,Math.sin(a)*6.3,g); add(new T.OctahedronGeometry(.3,0),new T.MeshPhongMaterial({color:col(tc),emissive:col(shade(tc,.6))}),Math.cos(a)*6.3,1.9,Math.sin(a)*6.3,g,false); }
    const gl=glow(tc,10); gl.position.y=.3; g.add(gl); S.fount[tm]={g,wm,gl}; }
  map.towers.forEach(buildTower); map.cores.forEach(buildCore); [0,1].forEach(buildFount);
  // 野怪營地的石圈
  for(const cp of map.camps){ const n=cp.big?12:6,rr=cp.big?6.5:3.5; for(let k=0;k<n;k++){ const a=k/n*TAU+R()*.2; natRock(cp.x+Math.cos(a)*rr,cp.z+Math.sin(a)*rr,cp.big?.9+R()*.5:.5+R()*.3,k); } if(cp.big){ const gl=glow(cp.col||'#8affc8',9); gl.position.set(cp.x,.4,cp.z); gl.material.opacity=.35; scene.add(gl); } }
  // 單路地圖：兩邊懸崖牆
  if(map.cliff){ for(const sd of [-1,1]){ const NX=160,NZ=12,len=2*B+30,dep=12,P=[],C=[],I=[];
      for(let j=0;j<=NZ;j++) for(let i=0;i<=NX;i++){ const x=-len/2+i/NX*len,u=j/NZ,z=sd*(map.cliff+.6+u*dep),wob=1.2*Math.sin(x*.21+sd)+.6*Math.sin(x*.57+sd*2); const rise=clampN((u*dep-.4+wob*.4)/3.2,0,1),hgt=rise*(3.6+wob*.5)+nz3(x*.4,u*3,sd,3)*.35*rise;
        P.push(x,hgt,z+wob*.4*sd); const top=rise>.97,k=.88+.12*nz3(x,u*4,sd,7); if(top) C.push(.26*k,.43*k,.17*k); else { const st=.05*Math.sin(hgt*6+x*.1); C.push((.44+st)*k,(.33+st)*k,(.21+st*.5)*k); } }
      for(let j=0;j<NZ;j++) for(let i=0;i<NX;i++){ const a=j*(NX+1)+i,b=a+1,c2=a+NX+1,d=c2+1; if(sd>0) I.push(a,c2,b,b,c2,d); else I.push(a,b,c2,b,d,c2); }
      const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(P,3)); g.setAttribute('color',new T.Float32BufferAttribute(C,3)); g.setIndex(I); g.computeVertexNormals(); const m=new T.Mesh(g,moundM); m.receiveShadow=true; m.castShadow=true; scene.add(m);
      for(let x=-B-6;x<=B+6;x+=2.4+R()*3) natRock(x,sd*(map.cliff+.9+R()*1.2),.4+R()*.9,(x*3|0)+(sd>0?1:2)); } }
  /* ===== 單位 ===== */
  const U=new Map(),H3=window.__H3D;
  function weapon(cls,c1,c2){ const g=new T.Group(),mt=metal('#d8dce8'),wood=ph('#6a4a2a',10),gem=new T.MeshPhongMaterial({color:col(c2),emissive:col(shade(c2,.6)),shininess:100});
    if(cls==='tank'){ add(new T.CylinderGeometry(.04,.04,.9,8),wood,0,-.35,0,g); add(new T.SphereGeometry(.16,10,8),mt,0,-.82,0,g); }
    else if(cls==='fighter'){ add(new T.BoxGeometry(.11,1.25,.03),mt,0,-.78,0,g); add(new T.BoxGeometry(.36,.06,.08),metal('#c8a040'),0,-.14,0,g); add(new T.CylinderGeometry(.03,.03,.22,6),wood,0,-.02,0,g); }
    else if(cls==='assassin'){ add(new T.ConeGeometry(.05,.55,4),mt,0,-.4,0,g).rotation.x=PI; }
    else if(cls==='mage'){ add(new T.CylinderGeometry(.03,.035,1.5,8),wood,0,-.2,0,g); const o=add(new T.IcosahedronGeometry(.13,1),gem,0,.6,0,g); const gl=glow(c2,.9); gl.position.y=.6; g.add(gl); g.userData.orb=o; }
    else if(cls==='marksman'){ const bw=add(new T.TorusGeometry(.55,.025,6,20,PI*1.1),wood,0,-.1,0,g); bw.rotation.z=PI/2-PI*.55; bw.rotation.y=PI/2; }
    else { add(new T.CylinderGeometry(.025,.03,1,8),metal('#e8d080'),0,-.1,0,g); const o=add(new T.TorusGeometry(.12,.025,6,16),gem,0,.45,0,g); const gl=glow(c2,.7); gl.position.y=.45; g.add(gl); }
    return g; }
  function heroModel(u){ const d=u.def,pal=d.pal,h=H3.build(T,{skin:pal.skin,shirt:pal.c1,pants:pal.c3||shade(pal.c1,.5),shoes:'#3a2a20',hair:pal.hair,female:!!d.f,longHair:!!d.f&&d.cls!=='tank',longSleeve:true,gloves:d.cls==='tank'||d.cls==='fighter'?shade(pal.c2,.6):null,belt:pal.c2,helmet:d.helm?pal.c2:null,brow:0});
    const wrap=new T.Group(),J=h.J; wrap.add(h.root); h.root.scale.setScalar(1.4); scene.add(wrap);
    // 肩甲
    if(d.cls==='tank'||d.cls==='fighter'){ for(const s of ['L','R']){ const sp=add(new T.SphereGeometry(.1,10,8,0,TAU,0,PI/2),metal(pal.c2),0,.03,0,J['sh'+s]); sp.scale.set(1.25,.75,1.15); } }
    // 披風
    if(d.cape){ const cp=add(new T.CylinderGeometry(.2,.34,.95,12,4,true,PI*.62,PI*.76).translate(0,-.475,0),new T.MeshLambertMaterial({color:col(pal.cape||pal.c2),side:T.DoubleSide}),0,.1,-.02,J.chest); cp.rotation.x=.12; u.cape=cp; }
    // 刺客面罩、法師兜帽、輔助光環
    if(d.cls==='assassin'){ add(new T.CylinderGeometry(.115,.12,.09,12),ph('#1a1820',10),0,.02,.01,J.head); }
    if(d.hood){ const hd=add(new T.SphereGeometry(.15,12,10,0,TAU,0,PI*.62),ph(pal.c2,8,{side:T.DoubleSide}),0,.08,-.02,J.head); hd.scale.set(1.08,1.1,1.15); }
    if(d.cls==='support'){ const hl=add(new T.TorusGeometry(.16,.015,6,24),new T.MeshBasicMaterial({color:0xfff2a0}),0,.33,0,J.head); hl.rotation.x=PI/2; }
    if(d.horns){ for(const s of [-1,1]){ const hn=add(new T.ConeGeometry(.035,.2,6),ph('#f0e6d0',30),s*.09,.17,0,J.head); hn.rotation.z=-s*.5; } }
    // 武器
    const wp=weapon(d.cls,pal.c1,pal.c2||pal.c1); wp.rotation.x=d.cls==='mage'||d.cls==='support'?PI-.25:-1.1; J.hdR.add(wp);
    if(d.cls==='tank'){ const sh=add(new T.CylinderGeometry(.27,.27,.05,16),metal(pal.c2),-.05,-.12,.04,J.hdL); sh.rotation.z=PI/2; add(new T.CylinderGeometry(.12,.12,.06,12),metal('#d8b860'),-.07,-.12,.04,J.hdL).rotation.z=PI/2; }
    if(d.cls==='assassin'){ const w2=weapon('assassin'); w2.rotation.x=-1.1; J.hdL.add(w2); }
    if(d.cls==='marksman'){ const q=add(new T.CylinderGeometry(.08,.07,.5,8),ph('#6a4a2a',10),.1,-.15,-.17,J.chest); q.rotation.z=.4; }
    const ring=add(new T.RingGeometry(.9,1.05,32),new T.MeshBasicMaterial({color:col(TEAMC[u.team]),transparent:true,opacity:.75,depthWrite:false}),0,.03,0,wrap,false); ring.rotation.x=-PI/2;
    return {wrap,h,J,ring,wp,cur:null,ang:0,fade:1}; }
  /* 小兵、野怪：零件合併成少數幾個網格（頂點上色），同一款共用幾何和材質，一次畫完、不會越打越卡 */
  const vcM=new T.MeshPhongMaterial({vertexColors:true,shininess:18,specular:0x1a1a1a}),vcS=new T.MeshPhongMaterial({vertexColors:true,shininess:90,specular:0x8a8a8a}),vcF=new T.MeshPhongMaterial({vertexColors:true,flatShading:true,shininess:6,specular:0x111111}),vcB=new T.MeshBasicMaterial({vertexColors:true});
  const _m4=new T.Matrix4(),_q=new T.Quaternion(),_e=new T.Euler(),_c=new T.Color(),_v1=new V(),_v2=new V();
  const P_=(g,c,x,y,z,rx,ry,rz,sx,sy,sz)=>[g,c,x,y,z,rx,ry,rz,sx,sy,sz,null];
  const XF=(list,x,y,z,rx,ry,rz)=>{ const M2=new T.Matrix4().compose(new V(x||0,y||0,z||0),new T.Quaternion().setFromEuler(new T.Euler(rx||0,ry||0,rz||0)),new V(1,1,1)); return list.map(p=>{ const q=p.slice(); q[11]=p[11]?M2.clone().multiply(p[11]):M2; return q; }); };
  function MG(parts){ if(!parts.length) return null; const P=[],N=[],C=[];
    for(const p of parts){ const [g0,cl,x,y,z,rx,ry,rz,sx,sy,sz,pm]=p; const g=g0.index?g0.toNonIndexed():g0; const s=sx==null?1:sx; _m4.compose(_v1.set(x||0,y||0,z||0),_q.setFromEuler(_e.set(rx||0,ry||0,rz||0)),_v2.set(s,sy==null?s:sy,sz==null?s:sz)); if(pm) _m4.premultiply(pm); g.applyMatrix4(_m4); _c.set(cl);
      const pa=g.attributes.position.array,na=g.attributes.normal.array; for(let i=0;i<pa.length;i++){ P.push(pa[i]); N.push(na[i]); } for(let i=0;i<pa.length/3;i++) C.push(_c.r,_c.g,_c.b); if(g!==g0) g.dispose(); g0.dispose(); }
    const G=new T.BufferGeometry(); G.setAttribute('position',new T.Float32BufferAttribute(P,3)); G.setAttribute('normal',new T.Float32BufferAttribute(N,3)); G.setAttribute('color',new T.Float32BufferAttribute(C,3)); G.computeBoundingSphere(); return G; }
  // 一組零件：m 霧面、s 金屬亮面、f 岩石（平面著色）、b 自己發光
  const KIT=()=>({m:[],s:[],f:[],b:[]});
  const bake=k=>({m:MG(k.m),s:MG(k.s),f:MG(k.f),b:MG(k.b)});
  function inst(bk,par,x,y,z,shadow){ const grp=new T.Group(); grp.position.set(x||0,y||0,z||0); par.add(grp); for(const [key,mat] of [['m',vcM],['s',vcS],['f',vcF],['b',vcB]]) if(bk[key]){ const me=new T.Mesh(bk[key],mat); me.castShadow=shadow!==false&&key!=='b'; me.receiveShadow=key!=='b'; grp.add(me); } return grp; }
  const TPL=new Map(),GLM=new Map();
  const glowS=(c2,s,op)=>{ const k=c2+(op||1); let m=GLM.get(k); if(!m){ m=new T.SpriteMaterial({map:glowT,color:col(c2),transparent:true,opacity:op||1,depthWrite:false,blending:T.AdditiveBlending}); GLM.set(k,m); } const sp=new T.Sprite(m); sp.scale.set(s,s,1); return sp; };
  const Cy=(a,b,h,n,o1,o2)=>new T.CylinderGeometry(a,b,h,n||10,1,false,o1||0,o2||TAU),Bx=(a,b,c2)=>new T.BoxGeometry(a,b,c2),Sp=(r,a,b,p0,p1,t0,t1)=>new T.SphereGeometry(r,a||10,b||8,p0||0,p1||TAU,t0||0,t1||PI),Co=(r,h,n)=>new T.ConeGeometry(r,h,n||8),To=(r,t,a,b,arc)=>new T.TorusGeometry(r,t,a||6,b||16,arc||TAU),Oc=r=>new T.OctahedronGeometry(r,0);
  function minionTpl(mt,team){ const key=mt+team; if(TPL.has(key)) return TPL.get(key); const tc=TEAMC[team],td=shade(tc,.6),tl=shade(tc,1.55),steel='#a8aebc',ds='#5c6270',gold='#d8b050',lea='#5a3a22',skin='#d8a880',dark='#26222a',T0={};
    if(mt==='cannon'){ // 砲車：木頭車身、鐵條、隊伍色護盾、銅砲管、砲彈、燈籠
      const wd='#7a5434',wD='#553620',wL='#9a6a40',ir='#4a4e58',br='#b88a40',bD='#7a5a2a',b=KIT();
      b.m.push(P_(Bx(1.1,.16,1.6),wd,0,.62,0)); for(const zz of [-.6,-.2,.2,.6]) b.m.push(P_(Bx(1.12,.17,.025),wD,0,.62,zz));
      for(const sx of [-1,1]){ b.m.push(P_(Bx(.08,.42,1.6),wL,sx*.52,.87,0)); for(const zz of [-.55,0,.55]) b.s.push(P_(Bx(.1,.44,.06),ir,sx*.53,.87,zz)); b.s.push(P_(Sp(.035,6,4),'#c8ccd4',sx*.575,.98,-.55)); b.s.push(P_(Sp(.035,6,4),'#c8ccd4',sx*.575,.98,.55)); }
      b.m.push(P_(Bx(1.1,.42,.08),wd,0,.87,-.77)); b.s.push(P_(Bx(1.12,.06,.1),ir,0,1.06,-.77));
      b.m.push(P_(Bx(1.04,.36,.06),tc,0,.84,.8,-.25)); b.s.push(P_(Bx(1.08,.05,.08),gold,0,1.03,.76,-.25)); b.s.push(P_(Oc(.13),gold,0,.86,.85,-.25,0,0,1,1,.35));
      const ax=[0,Math.sin(PI/2-.28),Math.cos(PI/2-.28)],bp=k=>[0,1.12+k*.276,.25+k*.961];
      b.s.push(P_(Cy(.15,.22,1.3,16),br,0,1.12,.25,PI/2-.28)); for(const k of [-.3,.1,.45]){ const q=bp(k); b.s.push(P_(To(.2+(-k)*.03,.035,6,16),bD,q[0],q[1],q[2],-.28)); }
      { const q=bp(.65); b.s.push(P_(To(.17,.06,8,16),bD,q[0],q[1],q[2],-.28)); b.b.push(P_(Cy(.11,.11,.03,12),'#120c08',q[0],q[1]+.01,q[2]+.02,PI/2-.28)); const r=bp(-.68); b.s.push(P_(Sp(.2,12,8),bD,r[0],r[1],r[2])); }
      b.m.push(P_(Bx(.5,.18,.5),wD,0,.8,.25)); for(const [x,y,z] of [[-.2,.84,-.5],[.06,.84,-.5],[-.07,1.03,-.5],[.3,.84,-.45]]) b.s.push(P_(Sp(.12,10,8),'#2e3038',x,y,z));
      b.m.push(P_(Cy(.025,.025,1.5,6),wD,-.45,1.45,-.66)); b.s.push(P_(Sp(.05,8,6),gold,-.45,2.22,-.66));
      b.m.push(P_(Cy(.02,.02,.5,5),wD,.45,1.2,-.7)); b.s.push(P_(Bx(.14,.03,.14),ir,.45,1.45,-.7)); b.b.push(P_(Sp(.065,8,6),'#ffd890',.45,1.53,-.7)); b.s.push(P_(Co(.09,.1,6),ir,.45,1.63,-.7));
      T0.body=bake(b);
      const w=KIT(); w.s.push(P_(To(.34,.055,6,20),ir,0,0,0,0,PI/2)); w.m.push(P_(To(.28,.04,5,16),wd,0,0,0,0,PI/2)); for(let k=0;k<6;k++) w.m.push(P_(Cy(.022,.022,.58,5),wD,0,0,0,k/6*PI)); w.s.push(P_(Cy(.08,.08,.16,8),ir,0,0,0,0,0,PI/2)); T0.wheel=bake(w);
      T0.flag=new T.PlaneGeometry(.55,.36).translate(.275,0,0); T0.flagM=new T.MeshLambertMaterial({color:col(tc),side:T.DoubleSide}); }
    else if(mt==='ranged'){ // 法師兵：長袍、披肩、兜帽裡發光的眼睛、新月法杖、魔法書
      const b=KIT(); b.m.push(P_(Co(.38,.95,14),tc,0,.6,0)); b.m.push(P_(Cy(.36,.4,.06,14),td,0,.15,0)); b.s.push(P_(To(.37,.025,6,20),gold,0,.18,0,PI/2)); b.s.push(P_(To(.24,.02,6,18),gold,0,.66,0,PI/2));
      b.m.push(P_(Cy(.19,.26,.5,12),tc,0,1.04,0)); b.m.push(P_(Bx(.07,.62,.03),gold,.02,1.0,.2,0,0,.45)); b.m.push(P_(Sp(.27,12,8,0,TAU,0,PI/2),td,0,1.17,0,0,0,0,1,.6,1)); b.s.push(P_(To(.16,.03,6,14),gold,0,1.27,0,PI/2));
      b.m.push(P_(Sp(.21,12,10,0,TAU,0,PI*.62),tc,0,1.47,-.01,0,0,0,1,1.15,1.1)); b.m.push(P_(Co(.09,.3,8),tc,0,1.7,-.14,-1.0)); b.m.push(P_(Sp(.15,10,8),'#1a1620',0,1.45,.04)); for(const sx of [-1,1]) b.b.push(P_(Sp(.026,6,4),tl,sx*.055,1.47,.17));
      b.s.push(P_(Oc(.05),gold,0,1.64,.15,0,0,0,1,1.3,.4)); b.b.push(P_(To(.48,.012,4,36),tl,0,.9,0,PI/2));
      T0.body=bake(b);
      const ar=KIT(); ar.m.push(P_(Cy(.05,.09,.4,8),tc,0,-.2,0)); ar.s.push(P_(To(.09,.015,4,12),gold,0,-.39,0,PI/2)); ar.m.push(P_(Sp(.045,8,6),skin,0,-.43,0));
      ar.m.push(...XF([P_(Cy(.022,.026,1.15,6),lea,0,.3,0),P_(Cy(.03,.03,.06,6),gold,0,.75,0),P_(To(.11,.02,6,14,PI*1.4),gold,0,.94,0,0,0,-PI*.2)],0,-.42,.04)); ar.b.push(...XF([P_(Oc(.08),tl,0,.93,0,0,0,0,1,1.5,1)],0,-.42,.04)); T0.armR=bake(ar);
      const al=KIT(); al.m.push(P_(Cy(.05,.09,.4,8),tc,0,-.2,0)); al.s.push(P_(To(.09,.015,4,12),gold,0,-.39,0,PI/2)); al.m.push(P_(Sp(.045,8,6),skin,0,-.43,0)); al.m.push(P_(Bx(.2,.05,.26),'#6a2a2a',0,-.47,.1,.3)); al.m.push(P_(Bx(.18,.055,.24),'#f0e6c8',.012,-.47,.1,.3)); al.b.push(P_(Oc(.04),tl,0,-.44,.12)); T0.armL=bake(al);
      const lg=KIT(); lg.m.push(P_(Cy(.06,.05,.42,8),dark,0,-.21,0)); lg.m.push(P_(Bx(.1,.08,.18),lea,0,-.46,.04)); T0.leg=bake(lg); }
    else { // 步兵：板甲、隊伍色外袍、雙層肩甲、帶面罩頭盔＋羽飾、劍、圓盾
      const b=KIT(); b.m.push(P_(Cy(.2,.24,.3,12),'#7a7e88',0,.7,0)); b.s.push(P_(Cy(.24,.21,.44,12),steel,0,1.0,0,0,0,0,1,1,.85)); b.s.push(P_(Bx(.03,.36,.03),ds,0,1.0,.2));
      b.m.push(P_(Bx(.3,.55,.04),tc,0,.8,.21)); b.m.push(P_(Bx(.3,.55,.04),tc,0,.8,-.2)); b.s.push(P_(Oc(.07),gold,0,.9,.235,0,0,0,1,1.2,.3)); b.m.push(P_(Bx(.32,.05,.05),td,0,.54,.21)); b.m.push(P_(Bx(.34,.52,.02),td,0,.95,-.25,.12));
      b.m.push(P_(To(.225,.035,6,16),lea,0,.72,0,PI/2)); b.s.push(P_(Bx(.08,.07,.03),gold,0,.72,.235));
      for(const [x,z] of [[-.13,.15],[.13,.15],[-.17,-.05],[.17,-.05]]) b.s.push(P_(Bx(.12,.16,.04),steel,x,.6,z,.15*Math.sign(z||1),Math.atan2(x,z)));
      for(const sx of [-1,1]){ b.s.push(P_(Sp(.13,10,8,0,TAU,0,PI/2),shade(tc,.85),sx*.27,1.17,0,0,0,0,1.25,.85,1.1)); b.s.push(P_(Sp(.12,10,8,0,TAU,0,PI/2),steel,sx*.3,1.1,0,0,0,sx*-.4,1.15,.7,1.05)); b.s.push(P_(To(.15,.015,4,14),gold,sx*.27,1.17,0,PI/2,0,0,1.15,1,1)); }
      b.s.push(P_(Cy(.12,.16,.08,10),steel,0,1.24,0)); b.m.push(P_(Sp(.14,12,10),skin,0,1.4,0));
      b.s.push(P_(Sp(.17,14,10,0,TAU,0,PI*.6),steel,0,1.42,0)); b.s.push(P_(To(.165,.02,4,16),ds,0,1.39,0,PI/2)); b.s.push(P_(Bx(.22,.13,.03),steel,0,1.36,.15)); b.m.push(P_(Bx(.17,.025,.035),dark,0,1.4,.155)); b.b.push(P_(Bx(.12,.012,.02),'#ffe9a0',0,1.4,.17));
      for(const sx of [-1,1]) b.s.push(P_(Bx(.04,.15,.11),steel,sx*.15,1.33,.08)); b.s.push(P_(Bx(.035,.1,.32),gold,0,1.6,-.02)); b.m.push(P_(Co(.06,.32,6),tc,0,1.63,-.2,-1.25)); b.m.push(P_(Co(.05,.24,6),tl,0,1.68,-.08,-1.0));
      T0.body=bake(b);
      const arm=()=>{ const a=KIT(); a.s.push(P_(Cy(.055,.05,.2,8),steel,0,-.1,0)); a.s.push(P_(Sp(.058,8,6),ds,0,-.22,0)); a.s.push(P_(Cy(.05,.045,.18,8),steel,0,-.32,0)); a.s.push(P_(Bx(.085,.085,.085),ds,0,-.43,0)); return a; };
      const ar=arm(); ar.s.push(...XF([P_(Bx(.05,.6,.014),'#eef2f8',0,.38,0),P_(Bx(.012,.5,.016),'#98a2b2',0,.36,0),P_(Bx(.21,.035,.05),gold,0,.07,0),P_(Sp(.03,6,4),gold,0,-.08,0)],0,-.44,.04,.4)); ar.m.push(...XF([P_(Cy(.02,.02,.14,6),lea,0,0,0)],0,-.44,.04,.4)); T0.armR=bake(ar);
      const al=arm(); al.m.push(...XF([P_(Cy(.24,.24,.05,18),tc,0,0,0,PI/2),P_(Bx(.05,.3,.012),gold,0,0,.03),P_(Bx(.3,.05,.012),gold,0,0,.03)],-.04,-.34,.12)); al.s.push(...XF([P_(To(.24,.025,6,22),steel,0,0,0),P_(Sp(.08,10,8,0,TAU,0,PI/2),gold,0,0,.03,PI/2)],-.04,-.34,.12)); T0.armL=bake(al);
      const lg=KIT(); lg.m.push(P_(Cy(.075,.065,.26,8),'#6a6e78',0,-.13,0)); lg.s.push(P_(Sp(.07,8,6),steel,0,-.26,.03)); lg.s.push(P_(Cy(.07,.06,.22,8),steel,0,-.38,0)); lg.m.push(P_(Bx(.12,.1,.2),dark,0,-.48,.04)); T0.leg=bake(lg); }
    TPL.set(key,T0); return T0; }
  function minionModel(u){ const g=new T.Group(),tp=minionTpl(u.mt,u.team);
    if(u.mt==='cannon'){ if(u.herald){ const hg=new T.Group(); g.add(hg); } inst(tp.body,g); const wh=[]; for(const sx of [-1,1]) for(const zz of [-.48,.48]) wh.push(inst(tp.wheel,g,sx*.66,.38,zz));
      const fl=new T.Mesh(tp.flag,tp.flagM); fl.position.set(-.45,2.0,-.66); g.add(fl); g.userData.flag=fl; g.userData.wheels=wh; g.scale.setScalar(u.herald?2.2:1.25); if(u.herald){ const gl=glowS('#c08aff',1.4,.6); gl.position.set(0,1.6,0); g.add(gl); } scene.add(g); return {wrap:g}; }
    const caster=u.mt==='ranged'; inst(tp.body,g); const lg=[-1,1].map(sx=>inst(tp.leg,g,sx*.12,.62,0));
    const ar=inst(tp.armR,g,caster?.24:.3,caster?1.24:1.18,0); const al=inst(tp.armL,g,caster?-.24:-.3,caster?1.24:1.18,0);
    if(caster){ ar.rotation.z=.2; al.rotation.z=-.25; al.rotation.x=-.6; const gl=glowS(TEAMC[u.team],.5); gl.position.set(0,.52,.04); ar.add(gl); } else al.rotation.x=-.5;
    g.userData.arm=ar; g.userData.legs=lg; g.scale.setScalar(1.05); scene.add(g); return {wrap:g}; }
  // 野怪：小野怪四種（石狼、晶甲蟲、蘑菇蛙、小石魔），大野怪兩種（紫晶巨魔、翠森古獸）
  function monsterTpl(u){ const big=u.big,ty=u.crab?'crab':u.ep?u.ep:u.buff?u.buff+'buff':big?(u.kind===1?'moss':'crystal'):['wolf','beetle','toad','golem'][(u.kind|0)%4],key='j'+ty+(u.el||'')+(u.id%2); if(TPL.has(key)) return TPL.get(key); const sd=u.id|0,T0={hz:.85,hy:1.35},b=KIT(),h=KIT(),lg=KIT(),eyeY='#ffd24a',horn='#ece0c4';
    const legStd=(c1,c2,r)=>{ lg.f.push(P_(Cy(r*.8,r,.7,7),c1,0,-.35,0)); lg.f.push(P_(Sp(r*1.15,7,5),c2,0,-.7,.04,0,0,0,1,.6,1.3)); };
    if(ty==='wolf'){ const fur='#6a625a',fl='#8a8278',dk='#3a342e'; T0.hz=.95; T0.hy=1.2;
      b.f.push(P_(rockGeo([.5,.45,.85],sd,1),fur,0,1,0)); for(let k=0;k<5;k++) b.f.push(P_(Co(.09,.4-k*.04,5),fl,0,1.38-k*.03,.45-k*.22,-.5)); for(let k=0;k<6;k++){ const a=k/6*TAU; b.f.push(P_(Co(.1,.35,5),dk,Math.cos(a)*.3,1.15+Math.sin(a)*.15,.65,1.2,0,Math.cos(a)*.6)); }
      b.f.push(P_(Co(.12,.8,6),fur,0,1.25,-.95,-2.2)); b.f.push(P_(Co(.08,.3,5),fl,0,1.55,-1.25,-2.4));
      h.f.push(P_(Sp(.3,9,7),fur,0,0,0,0,0,0,1,.85,1.1)); h.f.push(P_(Bx(.22,.16,.34),fl,0,-.06,.32)); h.f.push(P_(Bx(.18,.06,.28),dk,0,-.17,.28)); h.s.push(P_(Sp(.05,6,4),'#1a1414',0,-.01,.5)); for(const sx of [-1,1]){ h.f.push(P_(Co(.08,.24,4),dk,sx*.16,.27,-.05,-.2,0,-sx*.3)); h.b.push(P_(Sp(.045,6,4),eyeY,sx*.13,.07,.25)); h.s.push(P_(Co(.025,.1,4),'#f4f0e0',sx*.08,-.15,.44,PI)); }
      legStd(fur,dk,.13); }
    else if(ty==='beetle'){ const sh='#2e5a6e',shL='#4a8aa0',dk='#1e2228',cr='#7ae0ff'; T0.hz=.9; T0.hy=.95;
      b.m.push(P_(Sp(.72,14,10,0,TAU,0,PI/2),sh,0,.75,-.05,0,0,0,1,.85,1.25)); b.m.push(P_(Bx(.03,.5,1.6),dk,0,1.05,-.05,0,0,0,1,1,1)); b.m.push(P_(Cy(.62,.55,.3,14),dk,0,.7,-.05,0,0,0,1,1,1.2));
      for(let k=0;k<5;k++){ const x=(k%2?.3:-.3)*(k===4?0:1),z=-.45+k*.2; b.s.push(P_(Oc(.12+R()*.06),shL,x,1.25-Math.abs(z)*.2,z,.3,k,0,.8,1.8,.8)); b.b.push(P_(Oc(.06),cr,x,1.4-Math.abs(z)*.2,z,.3,k,0,.8,1.8,.8)); }
      for(const sx of [-1,1]) b.m.push(P_(Cy(.04,.03,.6,5),dk,sx*.62,.55,0,0,0,sx*1.1));
      h.m.push(P_(Sp(.3,10,8),dk,0,0,0,0,0,0,1.1,.8,1)); h.s.push(P_(Co(.06,.5,6),shL,0,.15,.25,1.1)); for(const sx of [-1,1]){ h.s.push(P_(To(.16,.035,5,8,PI*.8),horn,sx*.14,-.08,.25,PI/2,0,sx>0?-.3:PI+.3)); h.b.push(P_(Sp(.05,6,4),cr,sx*.16,.08,.2)); }
      legStd(dk,dk,.09); }
    else if(ty==='toad'){ const sk='#5a7a3a',sl='#7a9a50',bel='#c8c890',cap='#c83a2a'; T0.hz=.7; T0.hy=1.15;
      b.m.push(P_(Sp(.65,14,10),sk,0,.9,0,0,0,0,1.15,.78,1.05)); b.m.push(P_(Sp(.5,12,8),bel,0,.72,.2,0,0,0,1.1,.6,1)); for(let k=0;k<8;k++){ const a=R()*TAU; b.m.push(P_(Sp(.06+R()*.04,6,4),sl,Math.cos(a)*.55,1.1+R()*.2,Math.sin(a)*.5)); }
      for(const [x,z,s] of [[-.25,-.2,1],[.2,-.05,.75],[.05,-.42,.6]]){ b.m.push(P_(Cy(.05*s,.07*s,.3*s,6),'#f0e8d0',x,1.38+.12*s,z)); b.m.push(P_(Sp(.2*s,10,6,0,TAU,0,PI/2),cap,x,1.52+.25*s,z,0,0,0,1,.7,1)); for(let q=0;q<3;q++) b.m.push(P_(Sp(.03*s,5,4),'#ffffff',x+Math.cos(q*2.1)*.12*s,1.55+.3*s,z+Math.sin(q*2.1)*.12*s)); }
      h.m.push(P_(Sp(.42,12,8),sk,0,0,0,0,0,0,1.25,.6,.9)); h.m.push(P_(Bx(.6,.03,.05),'#2a1a1a',0,-.06,.35)); for(const sx of [-1,1]){ h.m.push(P_(Sp(.12,8,6),sl,sx*.22,.2,.12)); h.s.push(P_(Sp(.09,8,6),'#f4f0d0',sx*.22,.24,.18)); h.b.push(P_(Sp(.05,6,4),eyeY,sx*.22,.25,.25)); }
      lg.m.push(P_(Cy(.14,.16,.5,7),sk,0,-.25,0)); lg.m.push(P_(Sp(.18,7,5),sl,0,-.52,.08,0,0,0,1.2,.4,1.4)); }
    else if(ty==='golem'){ const rk='#7a6a5a',rl='#9a8a76',ms='#5a7a3a',gw='#ffb050';
      b.f.push(P_(rockGeo([.85,.75,1.0],sd,1),rk,0,1,0)); for(let k=0;k<4;k++) b.f.push(P_(rockGeo([.3,.15,.3],sd+k,0),ms,(R()-.5)*.8,1.62,(R()-.5)*.8)); for(let k=0;k<3;k++) b.b.push(P_(Bx(.04,.35,.02),gw,-.3+k*.3,1.05+(k%2)*.1,.92,0,0,.4*(k-1)));
      h.f.push(P_(rockGeo([.42,.38,.45],sd+3,1),rl,0,0,0)); h.b.push(P_(Bx(.32,.05,.03),gw,0,.05,.4)); for(const sx of [-1,1]) h.s.push(P_(Co(.09,.45,6),horn,sx*.3,.35,-.05,.4,0,-sx*.5));
      legStd(rk,rl,.16); }
    else if(ty==='crab'){ const sh='#3a8a9a',sl='#7ad8e8',cl='#e8f8ff'; T0.hz=.55; T0.hy=.75; // 河蟹：圓殼、兩隻大鉗、細長腳
      b.m.push(P_(Sp(.55,14,8,0,TAU,0,PI/2),sh,0,.6,0,0,0,0,1.25,.55,1)); b.m.push(P_(Cy(.62,.55,.18,14),sl,0,.6,0,0,0,0,1.15,1,.95)); for(let k=0;k<5;k++) b.b.push(P_(Sp(.05,6,4),cl,(k-2)*.22,.88,-.1+Math.abs(k-2)*.06));
      for(const sx of [-1,1]){ b.m.push(P_(Cy(.05,.05,.5,6),sh,sx*.55,.65,.35,0,0,sx*1.1)); b.m.push(P_(Sp(.16,8,6),sl,sx*.85,.75,.5,0,0,0,1.3,.8,1)); b.m.push(P_(Co(.06,.25,5),sl,sx*.95,.78,.7,-1.2)); for(let q=0;q<3;q++) b.m.push(P_(Cy(.03,.02,.6,5),sh,sx*.6,.4,-.3+q*.25,0,0,sx*1.0)); }
      h.m.push(P_(Sp(.12,8,6),sl,0,0,0)); for(const sx of [-1,1]){ h.m.push(P_(Cy(.02,.02,.25,4),sh,sx*.12,.12,0)); h.b.push(P_(Sp(.05,6,4),'#ffffff',sx*.12,.26,0)); } }
    else if(ty==='dragon'){ const E={fire:['#a8301a','#e0602a','#ffb040'],earth:['#6a4a2a','#a07a4a','#ffd080'],wind:['#6a9ab8','#b8e0f0','#e8ffff'],water:['#1a5a8a','#3a9ad0','#a8e8ff']}[u.el]||['#a8301a','#e0602a','#ffb040'],bd=E[0],bl=E[1],gw=E[2]; T0.hz=1.35; T0.hy=1.7; // 元素飛龍：長脖子、雙翼、尾巴，顏色看元素
      b.f.push(P_(rockGeo([.7,.6,1.1],sd,1),bd,0,1.05,0)); b.m.push(P_(Sp(.45,10,8),bl,0,.85,.15,0,0,0,1.1,.6,1.6));
      for(let k=0;k<4;k++) b.f.push(P_(Cy(.24-k*.04,.28-k*.04,.4,7),bd,0,1.3+k*.12,.7+k*.18,-.9)); for(let k=0;k<6;k++) b.f.push(P_(Co(.08,.3,5),bl,0,1.5-k*.06,.2-k*.3,-.4));
      for(let k=0;k<5;k++) b.f.push(P_(Cy(.2-k*.035,.24-k*.035,.45,6),bd,0,1.0-k*.05,-.9-k*.4,PI/2+.15)); b.f.push(P_(Co(.12,.4,4),gw,0,.75,-3.0,-PI/2));
      for(const sx of [-1,1]){ b.m.push(P_(Bx(1.9,.04,1.1),bl,sx*1.25,1.75,-.15,0,0,sx*.35)); b.f.push(P_(Cy(.05,.04,1.9,5),bd,sx*1.2,1.95,.35,0,0,sx*(PI/2-.35))); for(let q=0;q<3;q++) b.f.push(P_(Cy(.025,.02,1.1,4),bd,sx*(.75+q*.5),1.6+q*.15,-.1,PI/2,0,sx*.35)); }
      for(let k=0;k<5;k++) b.b.push(P_(Bx(.04,.25,.02),gw,-.35+k*.18,.95+(k%2)*.12,.95,0,0,(k%2?.5:-.5)));
      h.f.push(P_(rockGeo([.4,.32,.55],sd+4,1),bl,0,0,0)); h.f.push(P_(Bx(.3,.14,.45),bd,0,-.12,.4)); for(const sx of [-1,1]){ h.s.push(P_(Co(.06,.45,6),'#f0e6d0',sx*.18,.3,-.3,-.9,0,-sx*.3)); h.b.push(P_(Sp(.06,6,4),gw,sx*.18,.1,.35)); } h.b.push(P_(Sp(.1,6,4),gw,0,-.15,.62,0,0,0,1.4,.6,.6));
      lg.f.push(P_(Cy(.15,.19,.72,7),bd,0,-.36,0)); for(const q of [-.08,0,.08]) lg.s.push(P_(Co(.035,.18,4),'#f0e6d0',q,-.72,.22,PI/2)); }
    else if(ty==='herald'){ const sh='#4a2a6a',sl='#7a4aa8',ey='#d8a8ff'; T0.hz=1.0; T0.hy=1.25; // 峽谷先鋒：紫色甲殼、背上一隻大眼睛
      b.f.push(P_(rockGeo([1.0,.75,1.15],sd,1),sh,0,1.0,0)); for(let k=0;k<7;k++) b.f.push(P_(Co(.12,.45,5),sl,(k-3)*.26,1.6-Math.abs(k-3)*.05,-.45,-.6)); b.m.push(P_(Sp(.42,12,10),'#f4ecff',0,1.55,.15)); b.b.push(P_(Sp(.22,10,8),ey,0,1.6,.48)); b.b.push(P_(Sp(.1,8,6),'#2a0a3a',0,1.62,.66));
      for(const sx of [-1,1]) b.f.push(P_(Co(.22,.9,6),sl,sx*.8,1.3,.6,.9,0,-sx*.4));
      h.f.push(P_(rockGeo([.5,.4,.55],sd+6,1),sl,0,0,0)); for(const sx of [-1,1]){ h.s.push(P_(Co(.08,.5,6),'#e8dcc0',sx*.3,.3,.1,.5,0,-sx*.6)); h.b.push(P_(Sp(.06,6,4),ey,sx*.18,.08,.48)); }
      lg.f.push(P_(Cy(.17,.21,.72,7),sh,0,-.36,0)); lg.f.push(P_(Sp(.24,7,5),sl,0,-.72,.05,0,0,0,1,.55,1.3)); }
    else if(ty==='baron'){ const sk='#3a1a4a',sl='#6a2a8a',bel='#8a5aa0',gw='#d070ff'; T0.hz=1.25; T0.hy=2.1; // 巴龍納什：巨大紫色蛇怪，弓起的身體、背刺、角
      for(let k=0;k<6;k++){ const a=k/5*PI,z=-1.6+k*.55; b.f.push(P_(Sp(.6-Math.abs(k-2.5)*.05,10,8),k%2?sk:sl,0,.55+Math.sin(a)*1.1,z,0,0,0,1,1,1.15)); b.f.push(P_(Co(.12,.5,5),'#e8d8f0',0,1.15+Math.sin(a)*1.1,z-.05,-.4)); b.b.push(P_(Sp(.07,6,4),gw,(k%2?.45:-.45),.6+Math.sin(a)*1.1,z)); }
      b.m.push(P_(Sp(.75,12,8),bel,0,.6,.9,0,0,0,1,.8,1)); b.f.push(P_(Cy(.5,.62,1.4,8),sk,0,1.2,1.1,.3));
      h.f.push(P_(rockGeo([.7,.55,.8],sd+8,1),sl,0,0,0)); h.m.push(P_(Bx(.75,.08,.5),'#1a0a1a',0,-.25,.45)); for(const sx of [-1,1]){ h.s.push(P_(Co(.12,1.0,6),'#e8d8f0',sx*.45,.5,-.4,-.7,0,-sx*.5)); h.s.push(P_(Co(.06,.35,5),'#f8f0ff',sx*.25,-.35,.65,PI)); h.b.push(P_(Sp(.09,6,4),gw,sx*.28,.15,.65)); } }
    else if(ty==='bluebuff'){ const st='#3a4a6a',sl='#5a6a8a',cr='#5ab8ff',cl='#c8ecff'; T0.hz=1.0; T0.hy=1.5; // 藍色守衛：石甲巨像，背上藍水晶、全身藍色符文
      b.f.push(P_(rockGeo([.95,.9,1.05],sd,1),st,0,1.05,0)); for(const sx of [-1,1]){ b.f.push(P_(rockGeo([.42,.38,.45],sd+sx+3,1),sl,sx*.85,1.55,.1)); b.s.push(P_(Oc(.16),cr,sx*.9,1.95,.05,0,0,sx*.4,1,2.2,1)); }
      for(let k=0;k<5;k++) b.s.push(P_(Oc(.14+(k%2)*.06),cr,(k-2)*.28,1.85+(2-Math.abs(k-2))*.12,-.35,(k-2)*.15,k,0,1,2.6,1)); for(let k=0;k<6;k++) b.b.push(P_(Bx(.04,.28,.02),cl,-.55+k*.22,.95+(k%2)*.18,1.0,0,0,(k%2?.5:-.5))); b.b.push(P_(To(.5,.03,4,24),cr,0,1.05,0,PI/2));
      h.f.push(P_(rockGeo([.5,.45,.52],sd+7,1),sl,0,0,0)); h.b.push(P_(Bx(.36,.06,.04),cl,0,.05,.48)); h.s.push(P_(Oc(.12),cr,0,.45,0,0,0,0,1,2,1)); for(const sx of [-1,1]) h.s.push(P_(Co(.08,.45,6),'#d8e8ff',sx*.32,.38,-.05,.3,0,-sx*.6));
      lg.f.push(P_(Cy(.17,.21,.72,7),st,0,-.36,0)); lg.s.push(P_(Oc(.09),cr,0,-.28,.17,0,0,0,1,1.6,1)); lg.f.push(P_(Sp(.24,7,5),sl,0,-.72,.05,0,0,0,1,.55,1.3)); }
    else if(ty==='redbuff'){ const bd='#6a2a1e',bl='#8a3a24',th='#2a1a14',lv='#ff7a2a',lc='#ffd080'; T0.hz=1.05; T0.hy=1.3; // 紅色荊棘獸：深紅身體、背上黑刺、熔岩裂縫
      b.f.push(P_(rockGeo([.95,.8,1.15],sd,1),bd,0,1.0,0)); for(let k=0;k<11;k++){ const a=k/11*PI-PI/2,rr=.55; b.f.push(P_(Co(.11,.6-Math.abs(k-5)*.04,5),th,Math.sin(a)*rr*.9,1.6+Math.cos(a)*.15,-.2+Math.cos(a)*.35-k%2*.15,-.5,0,Math.sin(a)*.8)); }
      for(let k=0;k<7;k++) b.b.push(P_(Bx(.035,.32,.02),lv,-.6+k*.2,.85+(k%3)*.12,1.08,0,0,(k%2?.6:-.6))); b.b.push(P_(Sp(.22,8,6),lc,0,1.0,1.0,0,0,0,1,.7,.4));
      h.f.push(P_(rockGeo([.55,.48,.62],sd+5,1),bl,0,0,0)); for(const sx of [-1,1]){ h.s.push(P_(To(.3,.06,6,10,PI*.75),'#e8dcc0',sx*.32,-.18,.35,0,PI/2,sx>0?-.3:PI+.3)); h.b.push(P_(Sp(.07,6,4),lc,sx*.2,.12,.52)); } h.b.push(P_(Bx(.3,.05,.04),lv,0,-.1,.58));
      lg.f.push(P_(Cy(.17,.22,.7,7),bd,0,-.35,0)); lg.b.push(P_(Bx(.03,.3,.02),lv,0,-.3,.2)); lg.f.push(P_(Sp(.24,7,5),th,0,-.7,.06,0,0,0,1,.5,1.35)); }
    else if(ty==='crystal'){ const st='#4a3a5a',sl='#6a5a7a',cr='#c08aff',cl='#e8c8ff'; T0.hz=1.0; T0.hy=1.4;
      b.f.push(P_(rockGeo([1,.85,1.2],sd,1),st,0,1,0)); for(let k=0;k<9;k++){ const a=k/9*TAU+R()*.3,rr=.35+R()*.3; b.s.push(P_(Oc(.13+R()*.1),cr,Math.cos(a)*rr,1.65+R()*.2,Math.sin(a)*rr*1.1-.1,(R()-.5)*.6,R()*3,(R()-.5)*.6,1,2.4,1)); }
      for(let k=0;k<4;k++) b.b.push(P_(Oc(.08),cl,(k-1.5)*.25,1.95,-.1,0,k,0,1,2.6,1)); for(let k=0;k<5;k++) b.b.push(P_(Bx(.03,.2,.02),cr,-.5+k*.25,.95+(k%2)*.15,1.08,0,0,(k%2?.5:-.5)));
      for(const sx of [-1,1]) b.f.push(P_(rockGeo([.35,.3,.4],sd+sx+5,0),sl,sx*.75,1.35,.3));
      h.f.push(P_(rockGeo([.55,.48,.6],sd+3,1),sl,0,0,0)); for(const sx of [-1,1]){ h.s.push(P_(Co(.1,.55,6),horn,sx*.34,.42,-.05,.4,0,-sx*.5)); h.b.push(P_(Sp(.07,6,4),cl,sx*.2,.1,.5)); } h.s.push(P_(Oc(.1),cr,0,.48,.05,0,0,0,1,2,1)); h.s.push(P_(Oc(.07),cr,-.15,.42,.1,0,0,.3,1,2,1)); h.s.push(P_(Oc(.07),cr,.15,.42,.1,0,0,-.3,1,2,1));
      lg.f.push(P_(Cy(.15,.19,.7,7),st,0,-.35,0)); lg.s.push(P_(Oc(.1),cr,0,-.25,.16,0,0,0,1,1.6,1)); lg.f.push(P_(Sp(.22,7,5),sl,0,-.7,.05,0,0,0,1,.55,1.3)); }
    else { const mo='#3a5a3a',ml='#5a8a4a',bk='#5a4030',lf='#4aa04a',gw='#8affc8'; T0.hz=1.0; T0.hy=1.3;
      b.f.push(P_(rockGeo([1,.8,1.25],sd,1),mo,0,1,0)); for(let k=0;k<6;k++) b.f.push(P_(rockGeo([.3,.12,.3],sd+k,0),ml,(R()-.5)*1.3,1.58+R()*.1,(R()-.5)*1.4));
      b.m.push(P_(Cy(.12,.18,1.1,7),bk,.1,2.1,-.35,-.1,0,.1)); for(let k=0;k<5;k++) b.f.push(P_(new T.IcosahedronGeometry(.32+R()*.15,0),k%2?lf:ml,.1+(R()-.5)*.6,2.7+R()*.35,-.35+(R()-.5)*.6)); b.f.push(P_(Co(.06,.35,5),bk,-.4,1.75,.2,-.3,0,.5));
      for(let k=0;k<6;k++) b.b.push(P_(Sp(.05,5,4),gw,(R()-.5)*1.4,1.2+R()*.5,(R()-.5)*1.5));
      h.f.push(P_(rockGeo([.55,.45,.6],sd+3,1),mo,0,0,0)); h.f.push(P_(rockGeo([.3,.12,.3],sd+9,0),ml,0,.38,0)); for(const sx of [-1,1]){ h.s.push(P_(To(.32,.06,6,10,PI*.7),horn,sx*.3,-.2,.35,0,PI/2,sx>0?-.3:PI+.3)); h.b.push(P_(Sp(.07,6,4),gw,sx*.2,.1,.52)); }
      lg.f.push(P_(Cy(.16,.2,.7,7),bk,0,-.35,0)); lg.f.push(P_(rockGeo([.2,.08,.2],sd+11,0),ml,0,-.15,.12)); lg.f.push(P_(Sp(.22,7,5),mo,0,-.7,.05,0,0,0,1,.55,1.3)); }
    T0.body=bake(b); T0.head=bake(h); T0.leg=bake(lg); TPL.set(key,T0); return T0; }
  function monsterModel(u){ const g=new T.Group(),big=u.big,tp=monsterTpl(u),glowC=u.crab?'#7ae8ff':u.buff?(u.buff==='blue'?'#5ab8ff':'#ff7a2a'):u.ep==='dragon'?({fire:'#ff6a2a',earth:'#ffd080',wind:'#c8f0ff',water:'#5ab8ff'}[u.el]||'#ffb040'):big?(u.kind===1?'#8affc8':'#c08aff'):'#ffd06a',s=u.ep==='baron'?2.5:u.ep==='herald'?1.9:big?2.1:u.buff?1.55:u.crab?1.15:1;
    inst(tp.body,g); const head=inst(tp.head,g,0,tp.hy,tp.hz); const legs=[]; for(const [lx,lz] of [[-.5,.45],[.5,.45],[-.5,-.45],[.5,-.45]]) legs.push(inst(tp.leg,g,lx,.7,lz));
    if(big||u.buff){ const gl=glowS(glowC,big?1.6:1.2,.5); gl.position.set(0,2.3,-.1); g.add(gl); }
    g.scale.setScalar(s); g.userData.legs=legs; g.userData.head=head; g.userData.hz=tp.hz; scene.add(g); return {wrap:g}; }
  /* ===== 特效 ===== */
  const FX=[];
  const ringFx=(x,z,rad,c2,life,fill)=>{ const m=add(new T.RingGeometry(fill?0:rad*.85,rad,40),new T.MeshBasicMaterial({color:col(c2),transparent:true,opacity:fill?.35:.85,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}),x,.08,z,null,false); m.rotation.x=-PI/2; FX.push({m,t:0,life,k:'ring',rad}); };
  const burst=(x,y,z,c2,n,sp)=>{ for(let i=0;i<n;i++){ const s=glow(c2,.4+Math.random()*.5); s.position.set(x,y,z); scene.add(s); const a=Math.random()*TAU,v=(sp||5)*(.4+Math.random()*.8); FX.push({m:s,t:0,life:.45+Math.random()*.3,k:'p',vx:Math.cos(a)*v,vy:2+Math.random()*4,vz:Math.sin(a)*v}); } };
  const proj=new Map();
  const twRing=add(new T.RingGeometry(.95,1,72),new T.MeshBasicMaterial({color:0xff4040,transparent:true,opacity:.5,depthWrite:false,side:T.DoubleSide}),0,.1,0,null,false); twRing.rotation.x=-PI/2; twRing.visible=false; twRing.renderOrder=3;
  function fx(e){ // e:[種類, ...]
    const k=e[0];
    if(k==='ring') ringFx(e[1],e[2],e[3],e[4],e[5]||.5,e[6]);
    else if(k==='burst') burst(e[1],e[2]||1,e[3],e[4],e[5]||10,e[6]);
    else if(k==='hit'){ burst(e[1],1.2,e[2],e[3]||'#ffe8a0',5,3); }
    else if(k==='beam'){ const m=add(new T.CylinderGeometry(e[3]||.8,e[3]||.8,14,16,1,true),new T.MeshBasicMaterial({color:col(e[4]||'#9ad8ff'),transparent:true,opacity:.45,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}),e[1],7,e[2],null,false); FX.push({m,t:0,life:e[5]||.8,k:'fade'}); }
    else if(k==='slash'){ const m=add(new T.TorusGeometry(e[3]||1.6,.12,6,24,PI*.9),new T.MeshBasicMaterial({color:col(e[5]||'#ffffff'),transparent:true,opacity:.9,depthWrite:false,blending:T.AdditiveBlending}),e[1],1.1,e[2],null,false); m.rotation.set(-PI/2,0,-(e[4]||0)-PI*.45); FX.push({m,t:0,life:.25,k:'fade'}); }
    else if(k==='line'){ const len=e[5],m=add(new T.PlaneGeometry(len,e[6]||1.6),new T.MeshBasicMaterial({color:col(e[7]||'#ffd23f'),transparent:true,opacity:.6,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending}),e[1]+Math.cos(e[3])*len/2,.15,e[2]+Math.sin(e[3])*len/2,null,false); m.rotation.set(-PI/2,0,-e[3]); FX.push({m,t:0,life:.4,k:'fade'}); }
    else if(k==='p'){ // 投射物：id, x,y,z, 顏色, 大小
      const s=glow(e[5],e[6]||1.2),core=add(new T.SphereGeometry((e[6]||1.2)*.12,10,8),new T.MeshBasicMaterial({color:0xffffff}),0,0,0,s,false); s.position.set(e[2],e[3],e[4]); scene.add(s); proj.set(e[1],{m:s,trail:[],c:e[5]}); }
    else if(k==='pm'){ const q=proj.get(e[1]); if(q){ q.m.position.set(e[2],e[3],e[4]); if(Math.random()<.7){ const tr=glow(q.c,.5); tr.position.copy(q.m.position); scene.add(tr); FX.push({m:tr,t:0,life:.25,k:'fadeS'}); } } }
    else if(k==='px'){ const q=proj.get(e[1]); if(q){ scene.remove(q.m); proj.delete(e[1]); burst(q.m.position.x,q.m.position.y,q.m.position.z,q.c,6,3); } }
    else if(k==='boom'){ ringFx(e[1],e[2],e[3]||3,e[4]||'#ffb040',.6); ringFx(e[1],e[2],(e[3]||3)*.7,'#ffffff',.35,true); burst(e[1],1,e[2],e[4]||'#ffb040',18,7); }
  }
  const NL=String.fromCharCode(10);
  /* ===== 草叢（高草，可以躲人） ===== */
  const bushMs=(map.bush||[]).map((b,bi)=>{ const n=Math.round(b.r*b.r*8)+10,mat=sway(new T.MeshLambertMaterial({map:bladeT,alphaTest:.45,side:T.DoubleSide,transparent:true})),im=new T.InstancedMesh(tuftG,mat,n),m=new T.Matrix4(),cc=new T.Color();
    for(let i=0;i<n;i++){ const a=R()*TAU,d=Math.sqrt(R())*b.r*.95,k=1+R()*.5; m.makeRotationY(R()*TAU); m.scale(new V(k,2.3+R()*1.1,k)); m.setPosition(b.x+Math.cos(a)*d,0,b.z+Math.sin(a)*d); im.setMatrixAt(i,m); cc.setHSL(.24+R()*.06,.5+R()*.15,.42+R()*.15); im.setColorAt(i,cc); }
    im.frustumCulled=false; im.castShadow=true; scene.add(im); return im; });
  let bushCur=-1;
  /* ===== 戰爭迷霧：看不到的地方變暗 ===== */
  const FN=128,fogCv=document.createElement('canvas'); fogCv.width=fogCv.height=FN; const fctx=fogCv.getContext('2d'); fctx.fillStyle='#fff'; fctx.fillRect(0,0,FN,FN);
  const fogTex=new T.CanvasTexture(fogCv); fogTex.minFilter=fogTex.magFilter=T.LinearFilter; fogTex.generateMipmaps=false;
  const fogU={fogT:{value:fogTex},fogB:{value:new T.Vector3(G0,GS,0)}};
  const fogPatch=m=>{ if(m.userData.fog) return; m.userData.fog=1; const prev=m.onBeforeCompile,pk=prev?String(prev):''; m.onBeforeCompile=(sh,r2)=>{ if(prev) prev(sh,r2); sh.uniforms.fogT=fogU.fogT; sh.uniforms.fogB=fogU.fogB;
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>'+NL+'varying vec2 vFogW;').replace('#include <project_vertex>','#include <project_vertex>'+NL+'{ vec4 fwp=vec4(transformed,1.0);'+NL+'#ifdef USE_INSTANCING'+NL+'fwp=instanceMatrix*fwp;'+NL+'#endif'+NL+'fwp=modelMatrix*fwp; vFogW=fwp.xz; }');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>'+NL+'uniform sampler2D fogT; uniform vec3 fogB; varying vec2 vFogW;').replace('#include <dithering_fragment>','{ vec2 fu=(vFogW-vec2(fogB.x))/fogB.y; float fv=texture2D(fogT,vec2(fu.x,1.0-fu.y)).r; gl_FragColor.rgb=mix(gl_FragColor.rgb*vec3(.34,.38,.5),gl_FragColor.rgb,fv); }'+NL+'#include <dithering_fragment>'); };
    m.customProgramCacheKey=()=>'fog|'+pk; m.needsUpdate=true; };
  scene.traverse(o=>{ if(!o.isMesh) return; (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{ if((m.isMeshLambertMaterial||m.isMeshPhongMaterial||m.isMeshStandardMaterial)&&m.blending!==T.AdditiveBlending) fogPatch(m); }); });
  function fogDraw(src){ fctx.globalCompositeOperation='source-over'; if(!src){ fctx.fillStyle='#fff'; fctx.fillRect(0,0,FN,FN); fogTex.needsUpdate=true; return; } fctx.fillStyle='#000'; fctx.fillRect(0,0,FN,FN); fctx.globalCompositeOperation='lighter'; const k=FN/GS;
    for(const q of src){ const cx=(q[0]-G0)*k,cy=(q[1]-G0)*k,rr=q[2]*k,g=fctx.createRadialGradient(cx,cy,rr*.55,cx,cy,rr); g.addColorStop(0,'#fff'); g.addColorStop(1,'rgba(255,255,255,0)'); fctx.fillStyle=g; fctx.fillRect(cx-rr,cy-rr,rr*2,rr*2); } fctx.globalCompositeOperation='source-over'; fogTex.needsUpdate=true; }
  /* ===== 眼（插在地上的小水晶） ===== */
  const WD=new Map();
  function wardModel(w){ const g=new T.Group(),tc=w.tk==='r'?'#ff5a5a':'#5fff7a'; add(new T.CylinderGeometry(.035,.055,1,6),ph('#3a2a1a',6),0,.5,0,g); const cry=add(new T.OctahedronGeometry(.17,0),new T.MeshPhongMaterial({color:col(tc),emissive:col(shade(tc,.45)),shininess:90,transparent:true,opacity:.9}),0,1.15,0,g,false);
    const gl=glow(tc,.9); gl.position.y=1.15; g.add(gl); const ring=add(new T.RingGeometry(.38,.5,28),new T.MeshBasicMaterial({color:col(w.en?'#ff4a4a':TEAMC[w.team]),transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide}),0,.06,0,g,false); ring.rotation.x=-PI/2;
    g.userData.cry=cry; scene.add(g); return g; }
  /* ===== 鏡頭 ===== */
  const cam=new T.PerspectiveCamera(40,W/H,.5,400),tmp=new V();
  let lastT=0;
  function sync(G,t){ const dt=Math.min(.1,Math.max(0,t-lastT)); lastT=t; uT.value=t;
    const seen=new Set();
    for(const u of G.units()){ if(u.k==='t'||u.k==='c') continue; seen.add(u.id); let M=U.get(u.id);
      if(M&&u.k==='j'&&M.vk!==(u.ep||'')+(u.el||'')){ scene.remove(M.wrap); U.delete(u.id); M=null; }
      if(!M){ M=u.k==='h'?heroModel(u):u.k==='m'?minionModel(u):monsterModel(u); M.k=u.k; M.vk=(u.ep||'')+(u.el||''); if(M.ang==null) M.ang=u.face||0; U.set(u.id,M); }
      if(u.crab){ if(!M.sh){ M.sh=add(new T.SphereGeometry(1.05,16,12),new T.MeshPhongMaterial({color:0xffffff,transparent:true,opacity:.28,shininess:120,depthWrite:false,emissive:0x5a6a7a}),0,.6,0,M.wrap,false); } M.sh.visible=!!u.csh; }
      if(u.vh){ M.wrap.visible=false; M.lx=null; continue; }
      const dead=u.dead; if(M.k==='h'){ M.fade+=((dead?0:1)-M.fade)*Math.min(1,dt*4); M.wrap.visible=M.fade>.05; }
      else M.wrap.visible=!dead;
      if(!M.wrap.visible) continue;
      if(M.lx==null){ M.lx=u.x; M.lz=u.z; } const vx=(u.x-M.lx)/(dt||.016),vz=(u.z-M.lz)/(dt||.016); M.lx=u.x; M.lz=u.z; const spd=Math.hypot(vx,vz),mv=spd>.6;
      let ta=u.face!=null?u.face:M.ang; let da=ta-M.ang; while(da>PI) da-=TAU; while(da<-PI) da+=TAU; M.ang+=da*Math.min(1,dt*12);
      M.wrap.position.set(u.x,(u.y||0)+(u.air>0?Math.sin(Math.min(1,u.air/.45)*PI/2)*1.5:0),u.z); M.wrap.rotation.y=PI/2-M.ang;
      if(M.k==='h'){ const P=heroPose(u,t,mv,spd); M.cur=M.cur?H3.mix(M.cur,P,Math.min(1,dt*14)):P; H3.pose(M.J,M.cur); M.h.root.rotation.x=dead?-Math.min(1.4,(1-M.fade)*3):0;
        M.ring.material.color.set(u.me?'#ffd23f':TEAMC[u.team]); M.ring.material.opacity=u.me?.95:.6; if(M.cape) M.cape.rotation.x=.12+(mv?.5:0)+Math.sin(t*6)*.05;
        if(M.wp.userData.orb) M.wp.userData.orb.rotation.y=t*3;
        if(u.shield>0||u.stasis>0){ if(!M.bub){ M.bub=add(new T.SphereGeometry(1.3,16,12),new T.MeshPhongMaterial({color:0x9ad8ff,transparent:true,opacity:.22,shininess:120,depthWrite:false,emissive:0x2a4a6a}),0,1.2,0,M.wrap,false); } M.bub.visible=true; M.bub.material.color.set(u.stasis>0?0xffd23f:0x9ad8ff); M.bub.material.opacity=u.stasis>0?.45:.22; M.bub.scale.setScalar(1+Math.sin(t*6)*.03); } else if(M.bub) M.bub.visible=false;
        if(u.stun>0){ if(!M.st){ M.st=new T.Group(); for(let k=0;k<3;k++){ const s=glow('#ffe066',.45); s.position.set(Math.cos(k/3*TAU)*.45,0,Math.sin(k/3*TAU)*.45); M.st.add(s); } M.st.position.y=2.6; M.wrap.add(M.st); } M.st.visible=true; M.st.rotation.y=t*6; } else if(M.st) M.st.visible=false;
        if(u.recall>0){ if(!M.rc){ M.rc=add(new T.CylinderGeometry(1,1,3,20,1,true),new T.MeshBasicMaterial({color:0x9ad8ff,transparent:true,opacity:.3,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}),0,1.5,0,M.wrap,false); } M.rc.visible=true; M.rc.scale.y=.6+Math.sin(t*8)*.1; } else if(M.rc) M.rc.visible=false; }
      else { const L=M.wrap.userData.legs; if(L){ const s=mv?Math.sin(t*10+u.id)*.55:0; L.forEach((l,i)=>l.rotation.x=(i%2?s:-s)); } const A=M.wrap.userData.arm; if(A) A.rotation.x=(M.k==='m'?-.15+(mv?Math.sin(t*10+u.id)*.35:0):.6)-(u.atkT>0?Math.sin(u.atkT/.3*PI)*1.5:0); const WH=M.wrap.userData.wheels; if(WH&&mv) WH.forEach(w=>w.rotation.x+=.15); const FL=M.wrap.userData.flag; if(FL) FL.rotation.y=Math.sin(t*4+u.id)*.3; if(M.k==='j'&&u.atkT>0&&M.wrap.userData.head) M.wrap.userData.head.position.z=(M.wrap.userData.hz||.85)+Math.sin(u.atkT/.4*PI)*.3; } }
    for(const [id,M] of U) if(!seen.has(id)){ scene.remove(M.wrap); U.delete(id); }
    { const ws=G.wards?G.wards():[],wseen=new Set(); for(const w of ws){ wseen.add(w.id); let M=WD.get(w.id); if(!M){ M=wardModel(w); WD.set(w.id,M); } M.position.set(w.x,0,w.z); M.userData.cry.rotation.y=t*2; M.userData.cry.position.y=1.15+Math.sin(t*3+w.id)*.08; } for(const [id,M] of WD) if(!wseen.has(id)){ scene.remove(M); WD.delete(id); } }
    for(const tw of G.towers){ const M=S.tow.get(tw.id); if(!M) continue; const dead=tw.hp<=0; M.parts.forEach(p=>p.visible=!dead); M.rub.visible=dead; if(!dead){ M.cry.rotation.y=t*1.2; M.cry.position.y=7.3+Math.sin(t*2+tw.id)*.15; M.gl.material.opacity=tw.inv?.35:.9; if(M.rg) M.rg.rotation.z=t*.9; } }
    for(const c0 of G.cores){ const M=S.core[c0.team]; if(!M) continue; const dead=c0.hp<=0; M.cry.visible=!dead; M.ring.visible=!dead; M.gl.visible=!dead; M.cry.rotation.y=t*.8; M.cry.position.y=4.6+Math.sin(t*1.5)*.25; M.ring.rotation.z=t*.6; if(M.orb){ M.orb.visible=!dead; M.beam.visible=!dead; M.orb.rotation.y=t*.7; M.beam.material.opacity=.12+Math.sin(t*2)*.05; } }
    for(const f of S.fount) if(f){ f.gl.material.opacity=.6+Math.sin(t*3)*.2; }
    if(wtex){ wtex.offset.x=(t*.06)%1; wtex.offset.y=(t*.015)%1; }
    for(let i=FX.length-1;i>=0;i--){ const f=FX[i]; f.t+=dt; const u=f.t/f.life; if(u>=1){ scene.remove(f.m); if(f.m.geometry) f.m.geometry.dispose(); FX.splice(i,1); continue; }
      if(f.k==='ring'){ f.m.scale.setScalar(.4+u*.8); f.m.material.opacity=(1-u)*.85; }
      else if(f.k==='p'){ f.m.position.x+=f.vx*dt; f.m.position.y+=f.vy*dt; f.m.position.z+=f.vz*dt; f.vy-=9*dt; f.m.material.opacity=1-u; }
      else if(f.k==='fade'){ f.m.material.opacity=(1-u)*.8; }
      else if(f.k==='fadeS'){ f.m.material.opacity=(1-u)*.7; f.m.scale.setScalar((1-u)*.5+.05); } } }
  function heroPose(u,t,mv,spd){ const i=u.id,cls=u.def.cls,s=Math.sin(t*11+i),cc=Math.cos(t*11+i);
    if(u.dead) return {y:-.1,spine:[.2,0,0]};
    if(u.recall>0) return {y:-.02,spine:[-.05,0,0],shL:[-2.6,0,.4],shR:[-2.6,0,-.4],elL:[-.3,0,0],elR:[-.3,0,0]};
    if(u.castT>0){ const k=u.castT/.45; return {y:-.12,spine:[.15,0,0],hipL:[-.55,0,.12],hipR:[.2,0,-.12],knL:[.6,0,0],knR:[.3,0,0],shR:[-1.6-k*.6,0,-.2],elR:[-.2,0,0],shL:[-1.4-k*.5,0,.3],elL:[-.3,0,0]}; }
    if(u.atkT>0){ const k=Math.sin(Math.min(1,u.atkT/(u.atkDur||.35))*PI);
      if(cls==='marksman') return {y:-.06,spine:[.05,-.6,0],hipL:[-.3,0,.12],hipR:[.1,0,-.12],knL:[.3,0,0],knR:[.15,0,0],shL:[-1.55,0,.05],elL:[0,0,0],shR:[-1.5,0,-.2],elR:[-1.4-k*.5,0,0]};
      if(cls==='mage'||cls==='support') return {y:-.05,spine:[.1,0,0],shR:[-1.1-k*1.2,0,-.1],elR:[-.3,0,0],shL:[-.3,0,.3],elL:[-.8,0,0],hipL:[-.3,0,.1],knL:[.3,0,0]};
      return {y:-.1,spine:[.25,.6-k*1.2,0],hipL:[-.6,0,.12],hipR:[.25,0,-.12],knL:[.7,0,0],knR:[.25,0,0],shR:[-2.4+k*2.2,0,-.5+k*.3],elR:[-.3,0,0],shL:[-.6,0,.4],elL:[-.9,0,0]}; }
    if(mv) return {y:-.05-Math.abs(cc)*.04,spine:[.22,0,0],neck:[-.12,0,0],hipL:[-.75*s-.12,0,.03],hipR:[.75*s-.12,0,-.03],knL:[.3+1*Math.max(0,Math.sin(t*11+i-1.4)),0,0],knR:[.3+1*Math.max(0,Math.sin(t*11+i+PI-1.4)),0,0],shL:[.7*s,0,.12],shR:[-.7*s-(cls==='mage'?.3:0),0,-.12],elL:[-1.1,0,0],elR:[-1.1,0,0]};
    const br=Math.sin(t*2.2+i)*.03; return {y:-.06,spine:[.1+br,0,0],neck:[-.05,0,0],hipL:[-.22,0,.14],hipR:[-.22,0,-.14],knL:[.35,0,0],knR:[.35,0,0],anL:[-.13,0,-.1],anR:[-.13,0,.1],shL:[-.2,0,.3],shR:[cls==='mage'||cls==='support'?-.7:-.35,0,-.25],elL:[-.7,0,0],elR:[-.9,0,0]}; }
  return {canvas:cv,scene,r,
    get Q(){ return Q; },setQ(v){ Q=v; r.setSize(W*Q,H*Q,false); },
    shadows(on){ r.shadowMap.enabled=on; scene.traverse(m=>{ if(m.material) m.material.needsUpdate=true; }); },
    fx,
    render(G,cx,cz,flip,t,zoom){ sync(G,t); const z=zoom||1,dz=flip?-1:1;
      for(const M of S.tow.values()){ const b=(M.z-cz)*dz,want=b>-1&&b<10&&Math.abs(M.x-cx)<4.5?.3:1; if(Math.abs(want-M.fade)>.01){ M.fade+=(want-M.fade)*.2; M.mats.forEach(m=>{ m.transparent=true; m.opacity=M.fade; m.depthWrite=M.fade>.9; }); } }
      cam.position.set(cx,15.5*z,cz+10.5*z*dz); cam.lookAt(cx,0,cz+1.2*dz); cam.updateMatrixWorld(true);
      sun.position.set(cx-18,42,cz+16); sun.target.position.set(cx,0,cz); r.render(scene,cam); },
    fog:fogDraw, info:()=>({calls:r.info.render.calls,tri:r.info.render.triangles,geo:r.info.memory.geometries,tex:r.info.memory.textures,objs:scene.children.length}),
    bushIn(i){ if(i===bushCur) return; if(bushCur>=0&&bushMs[bushCur]) bushMs[bushCur].material.opacity=1; bushCur=i; if(i>=0&&bushMs[i]) bushMs[i].material.opacity=.4; },
    towerRange(x,z,rad,danger){ if(x==null){ twRing.visible=false; return; } twRing.visible=true; twRing.position.set(x,.1,z); twRing.scale.set(rad,rad,1); twRing.material.color.set(danger?0xff3030:0xff9a7a); twRing.material.opacity=danger?.75+.2*Math.sin(lastT*10):.4; },
    toScreen(x,y,z){ tmp.set(x,y,z).project(cam); return [(tmp.x+1)/2*W,(1-tmp.y)/2*H,tmp.z<1]; },
    pick(sx,sy){ const v=new V(sx/W*2-1,-(sy/H)*2+1,.5).unproject(cam).sub(cam.position).normalize(); if(v.y>-.01) return null; const k=-cam.position.y/v.y; return [cam.position.x+v.x*k,cam.position.z+v.z*k]; },
    destroy(){ scene.traverse(m=>{ if(m.geometry) m.geometry.dispose(); if(m.material){ const ms=Array.isArray(m.material)?m.material:[m.material]; ms.forEach(q=>{ if(q.map) q.map.dispose(); q.dispose(); }); } }); r.dispose(); try{ r.forceContextLoss(); }catch(e){} } }; }
window.__MOBA3D=make;
})();
