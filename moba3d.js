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
    add(new T.CylinderGeometry(2.2,2.6,.8,10),stoneM,0,.4,0,g); add(new T.CylinderGeometry(1.25,1.65,4.6,10),stoneM,0,3,0,g);
    for(const y of [1.2,3.2,5.1]) add(new T.TorusGeometry(y===5.1?1.35:1.55-y*.07,.12,8,24),metal(y===5.1?'#d8b860':shade(tc,.75)),0,y,0,g).rotation.x=PI/2;
    add(new T.CylinderGeometry(1.7,1.25,.7,10),stoneM,0,5.6,0,g); for(let k=0;k<8;k++){ const a=k/8*TAU; add(new T.BoxGeometry(.45,.6,.45),stoneM,Math.cos(a)*1.45,6.2,Math.sin(a)*1.45,g); }
    const cry=add(new T.OctahedronGeometry(.8,0),new T.MeshPhongMaterial({color:col(tc),emissive:col(shade(tc,.6)),shininess:100,specular:0xffffff,transparent:true,opacity:.92}),0,7.3,0,g); cry.scale.set(1,1.5,1);
    const gl=glow(tc,5); gl.position.y=7.3; g.add(gl); for(const s of [-1,1]){ const banner=add(new T.PlaneGeometry(.9,2),new T.MeshLambertMaterial({color:col(tc),side:T.DoubleSide}),s*1.3,3.6,.9,g); banner.rotation.y=s*.6; }
    const rub=new T.Group(); for(let k=0;k<9;k++){ const rk=add(rockGeo([1,.6,1],k+t.id),stoneM,(R()-.5)*3,.3,(R()-.5)*3,rub); rk.scale.setScalar(.5+R()*.6); } rub.visible=false; g.add(rub);
    const mats=new Set(); g.traverse(m=>{ if(m.isMesh&&m.material&&!m.parent.isSprite) mats.add(m.material); }); S.tow.set(t.id,{g,cry,gl,rub,mats:[...mats],fade:1,x:t.x,z:t.z,parts:g.children.filter(c2=>c2!==rub)}); }
  function buildCore(c0){ const g=new T.Group(); g.position.set(c0.x,0,c0.z); scene.add(g); const tc=TEAMC[c0.team];
    add(new T.CylinderGeometry(5,5.6,.9,16),stoneM,0,.45,0,g); add(new T.CylinderGeometry(3.6,4,.6,16),stoneM,0,1.2,0,g);
    for(let k=0;k<6;k++){ const a=k/6*TAU,p=add(new T.CylinderGeometry(.35,.45,4.2,8),stoneM,Math.cos(a)*4.2,2.6,Math.sin(a)*4.2,g); add(new T.OctahedronGeometry(.35,0),new T.MeshPhongMaterial({color:col(tc),emissive:col(shade(tc,.5))}),Math.cos(a)*4.2,5,Math.sin(a)*4.2,g); }
    const cry=add(new T.OctahedronGeometry(1.6,0),new T.MeshPhongMaterial({color:col(tc),emissive:col(shade(tc,.55)),shininess:120,specular:0xffffff,transparent:true,opacity:.9}),0,4.6,0,g); cry.scale.set(1,1.8,1);
    const ring=add(new T.TorusGeometry(2.6,.12,8,40),metal('#e0c070'),0,4.6,0,g); ring.rotation.x=PI/2.3; const gl=glow(tc,12); gl.position.y=4.6; g.add(gl);
    S.core[c0.team]={g,cry,ring,gl}; }
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
  function minionModel(u){ const g=new T.Group(),tc=TEAMC[u.team],steel=metal('#9aa0ae'),tm=metal(shade(tc,.8)),cloth=ph(shade(tc,.75),6),dark=ph('#2e2a28',10),skin=ph('#d8a880',12),leather=ph('#5a3a22',8);
    const limb=(r1,r2,len,mat,x,y,z,par)=>{ const piv=new T.Group(); piv.position.set(x,y,z); (par||g).add(piv); add(new T.CylinderGeometry(r1,r2,len,8).translate(0,-len/2,0),mat,0,0,0,piv); return piv; };
    if(u.mt==='cannon'){ // 木頭砲車：木板、鐵箍輪子、銅砲管、隊旗
      const wood=new T.MeshLambertMaterial({map:woodT}); add(new T.BoxGeometry(1.1,.18,1.5),wood,0,.62,0,g); for(const sx of [-1,1]) add(new T.BoxGeometry(.1,.42,1.5),wood,sx*.5,.83,0,g); add(new T.BoxGeometry(1.1,.42,.1),wood,0,.83,-.7,g);
      const wh=[]; for(const sx of [-1,1]) for(const zz of [-.48,.48]){ const w=new T.Group(); w.position.set(sx*.66,.38,zz); g.add(w); add(new T.TorusGeometry(.32,.05,6,18),steel,0,0,0,w).rotation.y=PI/2; for(let k=0;k<6;k++){ const sp=add(new T.CylinderGeometry(.025,.025,.6,5),wood,0,0,0,w); sp.rotation.x=k/6*PI; } add(new T.CylinderGeometry(.07,.07,.14,8),steel,0,0,0,w).rotation.z=PI/2; wh.push(w); }
      const bar=add(new T.CylinderGeometry(.15,.21,1.25,14),metal('#b0803a'),0,1.08,.3,g); bar.rotation.x=PI/2-.28; for(const zz of [-.1,.35,.75]) add(new T.TorusGeometry(.2,.03,6,16),metal('#7a5a2a'),0,1.08+zz*.27,.3+zz*.96-.25,g).rotation.x=-.28;
      const pole=add(new T.CylinderGeometry(.025,.025,1.4,6),leather,-.45,1.3,-.6,g); const fl=add(new T.PlaneGeometry(.5,.32),new T.MeshLambertMaterial({color:col(tc),side:T.DoubleSide}),-.2,1.85,-.6,g); g.userData.flag=fl; g.userData.wheels=wh;
      g.scale.setScalar(1.15); scene.add(g); return {wrap:g}; }
    const caster=u.mt==='ranged';
    // 腿、靴子
    const lg=[-1,1].map(sx=>{ const l=limb(.075,.065,.48,caster?dark:leather,sx*.12,.62,0); add(new T.BoxGeometry(.12,.1,.2),dark,0,-.46,.04,l); return l; });
    if(caster){ // 法師兵：長袍、兜帽、發光法杖
      add(new T.ConeGeometry(.36,.95,12,1,true),cloth,0,.62,0,g).material.side=T.DoubleSide; add(new T.CylinderGeometry(.2,.27,.5,10),cloth,0,1.06,0,g); add(new T.TorusGeometry(.33,.03,6,16),metal('#e0c070'),0,.18,0,g).rotation.x=PI/2;
      add(new T.SphereGeometry(.15,12,10),skin,0,1.46,.02,g); const hood=add(new T.SphereGeometry(.2,12,10,0,TAU,0,PI*.62),cloth,0,1.5,-.02,g); hood.scale.set(1,1.15,1.1);
      const ar=limb(.05,.045,.42,cloth,.24,1.24,0); ar.rotation.z=.2; const st=new T.Group(); st.position.set(0,-.4,.04); ar.add(st); add(new T.CylinderGeometry(.022,.026,1.15,6),leather,0,.3,0,st); add(new T.IcosahedronGeometry(.09,1),new T.MeshPhongMaterial({color:col(tc),emissive:col(shade(tc,.7)),shininess:100}),0,.9,0,st); const gl=glow(tc,.9); gl.position.y=.9; st.add(gl);
      const al=limb(.05,.045,.42,cloth,-.24,1.24,0); al.rotation.z=-.25; g.userData.arm=ar; }
    else { // 步兵：鎖子甲、隊伍色外袍、肩甲、頭盔、劍和圓盾
      add(new T.CylinderGeometry(.22,.24,.5,12),ph('#8a8e98',40),0,.95,0,g); add(new T.BoxGeometry(.34,.5,.06),cloth,0,.86,.2,g); add(new T.BoxGeometry(.34,.5,.06),cloth,0,.86,-.2,g); add(new T.TorusGeometry(.23,.035,6,16),leather,0,.72,0,g).rotation.x=PI/2;
      for(const sx of [-1,1]){ const sp=add(new T.SphereGeometry(.12,10,8,0,TAU,0,PI/2),tm,sx*.26,1.18,0,g); sp.scale.set(1.2,.8,1.1); }
      add(new T.SphereGeometry(.15,12,10),skin,0,1.4,0,g); add(new T.SphereGeometry(.17,12,10,0,TAU,0,PI*.55),steel,0,1.43,0,g); add(new T.BoxGeometry(.03,.14,.05),steel,0,1.38,.16,g); add(new T.ConeGeometry(.04,.16,6),tm,0,1.6,0,g);
      const ar=limb(.055,.05,.42,ph('#8a8e98',40),.3,1.18,0); const sw=new T.Group(); sw.position.set(0,-.42,.03); ar.add(sw); add(new T.BoxGeometry(.045,.62,.015),metal('#e8ecf4'),0,.33,0,sw); add(new T.BoxGeometry(.18,.03,.05),metal('#c8a040'),0,.03,0,sw); sw.rotation.x=.4;
      const al=limb(.055,.05,.42,ph('#8a8e98',40),-.3,1.18,0); const sh=add(new T.CylinderGeometry(.22,.22,.04,16),tm,-.03,-.34,.1,al); sh.rotation.x=PI/2; add(new T.CylinderGeometry(.08,.08,.05,10),metal('#e0c070'),-.03,-.34,.12,al).rotation.x=PI/2; al.rotation.x=-.5;
      g.userData.arm=ar; }
    g.scale.setScalar(u.big?1.3:1.05); g.userData.legs=lg; scene.add(g); return {wrap:g}; }
  function monsterModel(u){ const g=new T.Group(),big=u.big,c1=big?(u.kind===1?'#4a8a7a':'#7a5a8a'):'#7a6a5a',glowC=big?(u.kind===1?'#8affc8':'#ff9a5a'):'#ffd06a',s=big?2.2:1;
    const rk=new T.MeshPhongMaterial({color:col(c1),flatShading:true,shininess:4,specular:0x111111}),eye=new T.MeshBasicMaterial({color:col(glowC)});
    const body=add(rockGeo([1,.8,1.2],u.id|0),rk,0,1,0,g); body.scale.setScalar(.8); const head=add(rockGeo([.55,.5,.6],u.id+3|0),rk,0,1.35,.85,g);
    for(const sx of [-1,1]){ add(new T.SphereGeometry(.07,8,6),eye,sx*.2,1.45,1.35,g,false); const hn=add(new T.ConeGeometry(.09,.45,6),ph('#e8dcc0',30),sx*.32,1.75,.8,g); hn.rotation.z=-sx*.5; hn.rotation.x=.4; }
    const legs=[]; for(const [lx,lz] of [[-.5,.45],[.5,.45],[-.5,-.45],[.5,-.45]]) legs.push(add(new T.CylinderGeometry(.14,.18,.7,7).translate(0,-.35,0),rk,lx,.7,lz,g));
    if(big){ for(let k=0;k<5;k++){ const sp=add(new T.ConeGeometry(.16,.6,5),new T.MeshPhongMaterial({color:col(glowC),emissive:col(shade(glowC,.6))}),(k-2)*.22,1.8-Math.abs(k-2)*.08,-.1-k*.05,g); sp.rotation.x=-.4; } const gl=glow(glowC,3); gl.position.set(0,1.4,1); g.add(gl); }
    g.scale.setScalar(s); g.userData.legs=legs; g.userData.head=head; scene.add(g); return {wrap:g}; }
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
  /* ===== 鏡頭 ===== */
  const cam=new T.PerspectiveCamera(40,W/H,.5,400),tmp=new V();
  let lastT=0;
  function sync(G,t){ const dt=Math.min(.1,Math.max(0,t-lastT)); lastT=t; uT.value=t;
    const seen=new Set();
    for(const u of G.units()){ if(u.k==='t'||u.k==='c') continue; seen.add(u.id); let M=U.get(u.id);
      if(!M){ M=u.k==='h'?heroModel(u):u.k==='m'?minionModel(u):monsterModel(u); M.k=u.k; if(M.ang==null) M.ang=u.face||0; U.set(u.id,M); }
      const dead=u.dead; if(M.k==='h'){ M.fade+=((dead?0:1)-M.fade)*Math.min(1,dt*4); M.wrap.visible=M.fade>.05; }
      else M.wrap.visible=!dead;
      if(!M.wrap.visible) continue;
      if(M.lx==null){ M.lx=u.x; M.lz=u.z; } const vx=(u.x-M.lx)/(dt||.016),vz=(u.z-M.lz)/(dt||.016); M.lx=u.x; M.lz=u.z; const spd=Math.hypot(vx,vz),mv=spd>.6;
      let ta=u.face!=null?u.face:M.ang; let da=ta-M.ang; while(da>PI) da-=TAU; while(da<-PI) da+=TAU; M.ang+=da*Math.min(1,dt*12);
      M.wrap.position.set(u.x,u.y||0,u.z); M.wrap.rotation.y=PI/2-M.ang;
      if(M.k==='h'){ const P=heroPose(u,t,mv,spd); M.cur=M.cur?H3.mix(M.cur,P,Math.min(1,dt*14)):P; H3.pose(M.J,M.cur); M.h.root.rotation.x=dead?-Math.min(1.4,(1-M.fade)*3):0;
        M.ring.material.color.set(u.me?'#ffd23f':TEAMC[u.team]); M.ring.material.opacity=u.me?.95:.6; if(M.cape) M.cape.rotation.x=.12+(mv?.5:0)+Math.sin(t*6)*.05;
        if(M.wp.userData.orb) M.wp.userData.orb.rotation.y=t*3;
        if(u.shield>0){ if(!M.bub){ M.bub=add(new T.SphereGeometry(1.3,16,12),new T.MeshPhongMaterial({color:0x9ad8ff,transparent:true,opacity:.22,shininess:120,depthWrite:false,emissive:0x2a4a6a}),0,1.2,0,M.wrap,false); } M.bub.visible=true; M.bub.scale.setScalar(1+Math.sin(t*6)*.03); } else if(M.bub) M.bub.visible=false;
        if(u.stun>0){ if(!M.st){ M.st=new T.Group(); for(let k=0;k<3;k++){ const s=glow('#ffe066',.45); s.position.set(Math.cos(k/3*TAU)*.45,0,Math.sin(k/3*TAU)*.45); M.st.add(s); } M.st.position.y=2.6; M.wrap.add(M.st); } M.st.visible=true; M.st.rotation.y=t*6; } else if(M.st) M.st.visible=false;
        if(u.recall>0){ if(!M.rc){ M.rc=add(new T.CylinderGeometry(1,1,3,20,1,true),new T.MeshBasicMaterial({color:0x9ad8ff,transparent:true,opacity:.3,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending}),0,1.5,0,M.wrap,false); } M.rc.visible=true; M.rc.scale.y=.6+Math.sin(t*8)*.1; } else if(M.rc) M.rc.visible=false; }
      else { const L=M.wrap.userData.legs; if(L){ const s=mv?Math.sin(t*10+u.id)*.55:0; L.forEach((l,i)=>l.rotation.x=(i%2?s:-s)); } const A=M.wrap.userData.arm; if(A) A.rotation.x=(M.k==='m'?-.15+(mv?Math.sin(t*10+u.id)*.35:0):.6)-(u.atkT>0?Math.sin(u.atkT/.3*PI)*1.5:0); const WH=M.wrap.userData.wheels; if(WH&&mv) WH.forEach(w=>w.rotation.x+=.15); const FL=M.wrap.userData.flag; if(FL) FL.rotation.y=Math.sin(t*4+u.id)*.3; if(M.k==='j'&&u.atkT>0&&M.wrap.userData.head) M.wrap.userData.head.position.z=.85+Math.sin(u.atkT/.4*PI)*.3; } }
    for(const [id,M] of U) if(!seen.has(id)){ scene.remove(M.wrap); U.delete(id); }
    for(const tw of G.towers){ const M=S.tow.get(tw.id); if(!M) continue; const dead=tw.hp<=0; M.parts.forEach(p=>p.visible=!dead); M.rub.visible=dead; if(!dead){ M.cry.rotation.y=t*1.2; M.cry.position.y=7.3+Math.sin(t*2+tw.id)*.15; M.gl.material.opacity=tw.inv?.35:.9; } }
    for(const c0 of G.cores){ const M=S.core[c0.team]; if(!M) continue; const dead=c0.hp<=0; M.cry.visible=!dead; M.ring.visible=!dead; M.gl.visible=!dead; M.cry.rotation.y=t*.8; M.cry.position.y=4.6+Math.sin(t*1.5)*.25; M.ring.rotation.z=t*.6; }
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
    towerRange(x,z,rad,danger){ if(x==null){ twRing.visible=false; return; } twRing.visible=true; twRing.position.set(x,.1,z); twRing.scale.set(rad,rad,1); twRing.material.color.set(danger?0xff3030:0xff9a7a); twRing.material.opacity=danger?.75+.2*Math.sin(lastT*10):.4; },
    toScreen(x,y,z){ tmp.set(x,y,z).project(cam); return [(tmp.x+1)/2*W,(1-tmp.y)/2*H,tmp.z<1]; },
    pick(sx,sy){ const v=new V(sx/W*2-1,-(sy/H)*2+1,.5).unproject(cam).sub(cam.position).normalize(); if(v.y>-.01) return null; const k=-cam.position.y/v.y; return [cam.position.x+v.x*k,cam.position.z+v.z*k]; },
    destroy(){ scene.traverse(m=>{ if(m.geometry) m.geometry.dispose(); if(m.material){ const ms=Array.isArray(m.material)?m.material:[m.material]; ms.forEach(q=>{ if(q.map) q.map.dispose(); q.dispose(); }); } }); r.dispose(); try{ r.forceContextLoss(); }catch(e){} } }; }
window.__MOBA3D=make;
})();
