// 城市飆風追緝的 3D 畫面（three.js）：規則、車流、碰撞都在 chase.js 的 2D 座標算，這裡只負責畫。
// 座標：2D (x,y) → 3D (X=x, Y=高度, Z=y)；1 公尺＝10 單位。車子建模時車頭朝 +X，rotation.y=-a。
// 靜態街景（大樓、招牌、號誌、路燈、樹、機車）一次建好分塊合併；地面每格用 chase.js 的 paintCell 畫成貼圖，只載鏡頭附近的格子。
(function(){
'use strict';
function make(T,o){
  const {W,H,Wd,P,HR,SW,NB,paintCell,VT,shade,hash,mul,lightOf,TC}=o,PI=Math.PI,TAU=PI*2;
  const cl=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k,col=c=>new T.Color(c),pick=(R,a)=>a[Math.floor(R()*a.length)];
  let Q=1.25; const cv=document.createElement('canvas'),r=new T.WebGLRenderer({canvas:cv,antialias:true}); r.setPixelRatio(1); r.setSize(W*Q,H*Q,false); r.shadowMap.enabled=true; r.shadowMap.type=T.PCFSoftShadowMap; r.autoClear=false;
  const canv=(w,h,f)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; if(f) f(c.getContext('2d'),w,h); return c; },tex=(c,rep)=>{ const t=new T.CanvasTexture(c); t.anisotropy=8; if(rep) t.wrapS=t.wrapT=T.RepeatWrapping; return t; };
  const scene=new T.Scene(); scene.fog=new T.Fog(0xc8d2dc,900,3400);
  const hemi=new T.HemisphereLight(0xf0f6ff,0x6a6458,.7); scene.add(hemi);
  const sun=new T.DirectionalLight(0xfff2dc,.85); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-460,right:460,top:460,bottom:-460,near:10,far:1600}); sun.shadow.bias=-.0006; scene.add(sun); scene.add(sun.target);
  const heads=[0,1].map(()=>{ const s=new T.SpotLight(0xfff0d0,0,620,.55,.55,1); scene.add(s); scene.add(s.target); return s; });
  /* ---------- 天空、遠山 ---------- */
  const skyM=new T.MeshBasicMaterial({side:T.BackSide,fog:false,depthWrite:false}),sky=new T.Mesh(new T.SphereGeometry(6000,24,12),skyM); sky.renderOrder=-2; scene.add(sky);
  const mtnC=canv(2048,256,(c,w,h)=>{ for(let L=0;L<3;L++){ c.fillStyle=['rgba(120,140,160,.55)','rgba(90,110,120,.75)','rgba(60,80,80,.95)'][L]; c.beginPath(); c.moveTo(0,h); for(let x=0;x<=w;x+=8){ const y=h*(.25+L*.18)+Math.sin(x*.004+L*2)*28+Math.sin(x*.013+L)*14+Math.sin(x*.031)*6; c.lineTo(x,y); } c.lineTo(w,h); c.fill(); } });
  const mtnM=new T.MeshBasicMaterial({map:tex(mtnC),transparent:true,fog:false,depthWrite:false,side:T.BackSide}),mtn=new T.Mesh(new T.CylinderGeometry(5200,5200,900,48,1,true),mtnM); mtn.position.y=360; mtn.renderOrder=-1; scene.add(mtn);
  let skyKey=''; function setSky(e){ const k=[Math.round(e.dark*4),Math.round(e.dusk*4),Math.round(e.rain*3),Math.round(e.fog*3)].join(); if(k===skyKey) return; skyKey=k;
    const top=e.dark>.5?'#05081c':e.dusk>.4?'#4a5a8e':'#3f7ac0',mid=e.dark>.5?'#1a1a3a':e.dusk>.4?'#f0a070':'#a8cbe8',hz=e.dark>.5?'#28243e':e.dusk>.4?'#f6c49a':'#dfe6ea',gray=e.rain*.75+e.fog*.8;
    const mix=(a,b,k)=>{ const A=col(a),B=col(b); return '#'+A.lerp(B,cl(k,0,1)).getHexString(); };
    const T0=mix(top,e.dark>.5?'#12141c':'#7a8490',gray),M0=mix(mid,e.dark>.5?'#1c1e26':'#9aa2aa',gray),H0=mix(hz,e.dark>.5?'#24262e':'#b4bac0',gray);
    if(skyM.map) skyM.map.dispose(); skyM.map=tex(canv(16,256,(c,w,h)=>{ const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,T0); g.addColorStop(.42,M0); g.addColorStop(.5,H0); g.addColorStop(1,H0); c.fillStyle=g; c.fillRect(0,0,w,h); if(e.dark>.5&&gray<.4){ c.fillStyle='#fff'; for(let i=0;i<60;i++) c.fillRect((i*7)%w,(i*37)%(h*.4),1,1); } })); skyM.needsUpdate=true;
    scene.fog.color.set(H0); mtnM.color.set(e.dark>.5?'#3a3c50':e.dusk>.4?'#c89a8a':'#ffffff'); mtnM.opacity=1-gray*.7; }
  /* ---------- 牆面貼圖：每張 4 開間 × 4 層樓（一開間 30、一層 32 單位），晚上另有亮燈版 ---------- */
  function facade(kind){ const day=canv(512,512),nite=canv(512,512),c=day.getContext('2d'),n=nite.getContext('2d'),R=mul(kind.length*977+kind.charCodeAt(0)*13); n.fillStyle='#000'; n.fillRect(0,0,512,512);
    c.fillStyle='#ffffff'; c.fillRect(0,0,512,512); for(let i=0;i<2600;i++){ c.fillStyle=R()<.5?'rgba(0,0,0,.035)':'rgba(255,255,255,.05)'; c.fillRect(R()*512,R()*512,2+R()*3,2+R()*3); }
    const glass=(x,y,w,h,dk)=>{ const g=c.createLinearGradient(x,y,x+w*.6,y+h); g.addColorStop(0,dk?'#55687a':'#8ea4b8'); g.addColorStop(.6,dk?'#2c3644':'#4a5c6e'); g.addColorStop(1,'#26303c'); c.fillStyle=g; c.fillRect(x,y,w,h); c.fillStyle='rgba(255,255,255,.14)'; c.beginPath(); c.moveTo(x+w*.55,y); c.lineTo(x+w*.8,y); c.lineTo(x+w*.4,y+h); c.lineTo(x+w*.15,y+h); c.fill(); };
    const lit=(x,y,w,h,p)=>{ if(R()<p){ const g=n.createLinearGradient(0,y,0,y+h); const warm=R()<.7; g.addColorStop(0,warm?'#ffe0a0':'#e8f0ff'); g.addColorStop(1,warm?'#e8a050':'#a8c0e0'); n.fillStyle=g; n.fillRect(x,y,w,h); if(R()<.4){ n.fillStyle='rgba(60,40,20,.5)'; n.fillRect(x,y,w*.35,h); } } };
    for(let fy=0;fy<4;fy++) for(let fx=0;fx<4;fx++){ const X=fx*128,Y=(3-fy)*128;
      if(kind==='old'){ c.fillStyle='rgba(0,0,0,.08)'; c.fillRect(X,Y+120,128,8); const wx=X+20,wy=Y+28,ww=88,wh=64; glass(wx,wy,ww,wh); c.strokeStyle='#c8ccd0'; c.lineWidth=4; c.strokeRect(wx,wy,ww,wh); c.beginPath(); c.moveTo(wx+ww/2,wy); c.lineTo(wx+ww/2,wy+wh); c.stroke(); lit(wx,wy,ww,wh,.42);
        if(R()<.62){ const rc=R()<.5?'#e8e8e0':'#7a5a40'; c.strokeStyle=rc; c.lineWidth=2.4; for(let i=0;i<=10;i++){ c.beginPath(); c.moveTo(wx-6+i*10,wy-6); c.lineTo(wx-6+i*10,wy+wh+6); c.stroke(); } c.lineWidth=3; c.strokeRect(wx-6,wy-6,ww+12,wh+12); c.beginPath(); c.moveTo(wx-6,wy+wh/2); c.lineTo(wx+ww+6,wy+wh/2); c.stroke(); }
        if(R()<.4){ c.fillStyle='#e4e4dc'; c.fillRect(wx+ww-34,wy+wh+10,38,22); c.fillStyle='#8a8a86'; c.beginPath(); c.arc(wx+ww-14,wy+wh+21,8,0,TAU); c.fill(); }
        if(R()<.3){ c.fillStyle='rgba(110,70,40,.18)'; c.fillRect(X+R()*110,Y+96,10,32); } }
      else if(kind==='apt'){ c.strokeStyle='rgba(0,0,0,.08)'; c.lineWidth=1; for(let i=0;i<128;i+=8){ c.beginPath(); c.moveTo(X+i,Y); c.lineTo(X+i,Y+128); c.moveTo(X,Y+i); c.lineTo(X+128,Y+i); c.stroke(); } const wx=X+14,wy=Y+22,ww=100,wh=62; glass(wx,wy,ww,wh,1); c.strokeStyle='#d0d4d8'; c.lineWidth=3; c.strokeRect(wx,wy,ww,wh); c.beginPath(); c.moveTo(wx+ww/2,wy); c.lineTo(wx+ww/2,wy+wh); c.stroke(); lit(wx,wy,ww,wh,.45);
        c.fillStyle='rgba(60,64,70,.85)'; c.fillRect(X+8,Y+86,112,4); c.fillRect(X+8,Y+110,112,4); for(let i=0;i<=14;i++) c.fillRect(X+8+i*8,Y+86,2,28); if(R()<.35){ c.fillStyle='#e8e8e2'; c.fillRect(X+86,Y+92,30,18); } if(R()<.3){ c.fillStyle=pick(R,['#c84a4a','#4a7ac8','#e8c040','#f0f0f0']); c.fillRect(X+20+R()*50,Y+90,24,14); } }
      else if(kind==='glass'){ const g=c.createLinearGradient(X,Y,X+128,Y+128); g.addColorStop(0,'#9ab8d0'); g.addColorStop(.5,'#5a7890'); g.addColorStop(1,'#3a5268'); c.fillStyle=g; c.fillRect(X,Y,128,128); c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(X+R()*80,Y,30,128); c.fillStyle='#2a3440'; c.fillRect(X,Y+112,128,16); c.fillStyle='#b8c4cc'; c.fillRect(X,Y,3,128); c.fillRect(X+62,Y,3,128); c.fillRect(X,Y+110,128,3);
        if(R()<.5){ n.fillStyle=R()<.6?'#f0f4ff':'#ffe8c0'; n.fillRect(X+4,Y+4,56,104); } if(R()<.5){ n.fillStyle='#e8f0ff'; n.fillRect(X+66,Y+4,58,104); } }
      else if(kind==='office'){ c.fillStyle='#ffffff'; c.fillRect(X,Y,128,128); c.fillStyle='rgba(0,0,0,.1)'; c.fillRect(X,Y+44,128,2); glass(X,Y+48,128,66,1); c.fillStyle='#c0c6cc'; for(let i=0;i<4;i++) c.fillRect(X+i*32,Y+48,3,66); if(R()<.55){ n.fillStyle='#eef4ff'; n.fillRect(X,Y+48,128,66); n.fillStyle='rgba(0,0,0,.4)'; for(let i=0;i<4;i++) n.fillRect(X+i*32,Y+48,3,66); } }
      else if(kind==='shop'){ c.fillStyle='#3a3a3c'; c.fillRect(X,Y,128,22); const r=R(); if(r<.35){ c.fillStyle='#a8aaac'; c.fillRect(X+6,Y+24,116,104); c.fillStyle='rgba(0,0,0,.22)'; for(let y=Y+28;y<Y+128;y+=7) c.fillRect(X+6,y,116,2); }
        else if(r<.8){ const g=c.createLinearGradient(0,Y+24,0,Y+128); g.addColorStop(0,'#f8f0d8'); g.addColorStop(1,'#a89878'); c.fillStyle=g; c.fillRect(X+6,Y+24,116,104); for(let j=0;j<3;j++){ c.fillStyle='#5a4a3a'; c.fillRect(X+10,Y+50+j*26,108,4); for(let i=0;i<10;i++){ c.fillStyle=pick(R,['#e8c060','#c05040','#4a90c0','#f0f0e0','#70a050','#d0d0d0','#e87aa0']); c.fillRect(X+12+i*10.4,Y+34+j*26,8,16); } } n.fillStyle='#ffe8b8'; n.fillRect(X+6,Y+24,116,104); n.fillStyle='rgba(0,0,0,.35)'; for(let j=0;j<3;j++) n.fillRect(X+10,Y+50+j*26,108,4); }
        else { glass(X+6,Y+24,116,104); c.fillStyle='#22262c'; c.fillRect(X+62,Y+24,4,104); n.fillStyle='#e8f0ff'; n.fillRect(X+6,Y+24,116,104); }
        c.fillStyle='#55565a'; c.fillRect(X,Y+22,6,106); c.fillRect(X+122,Y+22,6,106); }
      else if(kind==='ware'){ c.fillStyle='#ffffff'; c.fillRect(X,Y,128,128); c.fillStyle='rgba(0,0,0,.16)'; for(let i=0;i<128;i+=8) c.fillRect(X+i,Y,3,128); if(fy===0&&R()<.4){ c.fillStyle='#8a8c90'; c.fillRect(X+14,Y+30,100,98); c.fillStyle='rgba(0,0,0,.2)'; for(let y=Y+34;y<Y+128;y+=6) c.fillRect(X+14,y,100,2); } if(fy===2&&R()<.3){ c.fillStyle='#ffd23f'; c.fillRect(X+10,Y+50,108,10); } }
      else if(kind==='red'){ c.fillStyle='#ffffff'; c.fillRect(X,Y,128,128); c.fillStyle='rgba(120,40,20,.2)'; for(let i=0;i<128;i+=10) c.fillRect(X,Y+i,128,1); if(fx%2===0){ c.fillStyle='#5a2a12'; c.fillRect(X+30,Y+30,68,68); c.strokeStyle='#e0b050'; c.lineWidth=3; c.strokeRect(X+30,Y+30,68,68); for(let i=1;i<6;i++){ c.beginPath(); c.moveTo(X+30+i*11.3,Y+30); c.lineTo(X+30+i*11.3,Y+98); c.moveTo(X+30,Y+30+i*11.3); c.lineTo(X+98,Y+30+i*11.3); c.stroke(); } n.fillStyle='#ff9a40'; n.fillRect(X+32,Y+32,64,64); } }
    }
    const t1=tex(day,true),t2=tex(nite,true); return new T.MeshLambertMaterial({map:t1,vertexColors:true,emissiveMap:t2,emissive:0x000000}); }
  const FM={}; for(const k of ['old','apt','glass','office','shop','ware','red']) FM[k]=facade(k);
  const plainM=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}),shinyM=new T.MeshPhongMaterial({vertexColors:true,shininess:60,specular:0x444444});
  /* 招牌貼圖集：直立招牌 64×256、橫招牌 256×64、路名牌 256×64 */
  function atlasMaker(cw,ch){ const C=canv(2048,2048),c=C.getContext('2d'),cols=Math.floor(2048/cw),map=new Map(); let n=0; const t=tex(C);
    return {C,t,get(key,draw){ let u=map.get(key); if(u) return u; const x=(n%cols)*cw,y=Math.floor(n/cols)*ch; if(y+ch>2048) return map.values().next().value; n++; c.save(); c.translate(x,y); c.beginPath(); c.rect(0,0,cw,ch); c.clip(); draw(c,cw,ch); c.restore(); u=[(x+1)/2048,1-(y+ch-1)/2048,(x+cw-1)/2048,1-(y+1)/2048]; map.set(key,u); t.needsUpdate=true; return u; }}; }
  const AV=atlasMaker(64,256),AH=atlasMaker(256,64);
  const signMat=a=>new T.MeshLambertMaterial({map:a.t,emissiveMap:a.t,emissive:0x000000}); const SMV=signMat(AV),SMH=signMat(AH);
  const vSign=(txt,bg,fg)=>AV.get('v'+txt+bg+fg,(c,w,h)=>{ c.fillStyle=bg; c.fillRect(0,0,w,h); c.strokeStyle=shade(bg,1.4); c.lineWidth=5; c.strokeRect(3,3,w-6,h-6); const n=Math.min(txt.length,5),fs=Math.min(48,(h-20)/n); c.fillStyle=fg; c.font='900 '+fs+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; for(let i=0;i<n;i++) c.fillText(txt[i],w/2,10+(h-20)*(i+.5)/n); });
  const hSign=(txt,bg,fg)=>AH.get('h'+txt+bg+fg,(c,w,h)=>{ c.fillStyle=bg; c.fillRect(0,0,w,h); c.strokeStyle=shade(bg,1.4); c.lineWidth=4; c.strokeRect(2,2,w-4,h-4); c.fillStyle=fg; c.font='900 '+Math.min(44,(w-20)/txt.length)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(txt,w/2,h/2+2); });
  const roadSign=txt=>AH.get('r'+txt,(c,w,h)=>{ c.fillStyle='#1e4fa0'; c.fillRect(0,0,w,h); c.strokeStyle='#fff'; c.lineWidth=4; c.strokeRect(5,5,w-10,h-10); c.fillStyle='#fff'; c.font='900 36px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(txt,w/2,h/2+2); });
  const mrtSign=txt=>AH.get('m'+txt,(c,w,h)=>{ c.fillStyle='#f4f6f8'; c.fillRect(0,0,w,h); c.fillStyle='#1d6ab8'; c.beginPath(); c.arc(32,h/2,24,0,TAU); c.fill(); c.fillStyle='#fff'; c.font='900 30px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('捷',32,h/2+1); c.fillStyle='#1a2a44'; c.font='900 30px '+TC; c.fillText(txt,150,h/2+2); });
  /* ---------- 幾何合併工具 ---------- */
  const WHITE=[0,0,.001,.001];
  function Bld(){ const p=[],n=[],u=[],c=[]; const me={p,
    quad(a,b,cc,d,uv,color){ const C=color instanceof T.Color?color:col(color||'#fff'),e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],e2=[d[0]-a[0],d[1]-a[1],d[2]-a[2]],nx=e1[1]*e2[2]-e1[2]*e2[1],ny=e1[2]*e2[0]-e1[0]*e2[2],nz=e1[0]*e2[1]-e1[1]*e2[0],l=Math.hypot(nx,ny,nz)||1,U=uv||WHITE;
      const vs=[[a,U[0],U[1]],[b,U[2],U[1]],[cc,U[2],U[3]],[a,U[0],U[1]],[cc,U[2],U[3]],[d,U[0],U[3]]]; for(const [q,uu,vv] of vs){ p.push(q[0],q[1],q[2]); n.push(nx/l,ny/l,nz/l); u.push(uu,vv); c.push(C.r,C.g,C.b); } },
    box(x0,x1,y0,y1,z0,z1,color,top){ const C=color instanceof T.Color?color:col(color); if(x0>x1){ const q=x0; x0=x1; x1=q; } if(z0>z1){ const q=z0; z0=z1; z1=q; }
      me.quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],null,C); me.quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],null,C); me.quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],null,C); me.quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],null,C); me.quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],null,top?col(top):C); },
    geo(g0,m,color){ const g=g0.index?g0.toNonIndexed():g0.clone(); if(m) g.applyMatrix4(m); const Pp=g.attributes.position,N=g.attributes.normal,C=color instanceof T.Color?color:col(color||'#fff'); for(let i=0;i<Pp.count;i++){ p.push(Pp.getX(i),Pp.getY(i),Pp.getZ(i)); n.push(N.getX(i),N.getY(i),N.getZ(i)); u.push(0,0); c.push(C.r,C.g,C.b); } },
    build(){ const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(p,3)); g.setAttribute('normal',new T.Float32BufferAttribute(n,3)); g.setAttribute('uv',new T.Float32BufferAttribute(u,2)); g.setAttribute('color',new T.Float32BufferAttribute(c,3)); g.computeBoundingSphere(); return g; } }; return me; }
  const mm=new T.Matrix4();
  // 牆面：a→b 從外面看是由左到右
  const wallQ=(B,ax,az,bx,bz,y0,y1,uv,c0)=>B.quad([ax,y0,az],[bx,y0,bz],[bx,y1,bz],[ax,y1,az],uv,c0);
  const faces=bd=>[['N',bd.x1,bd.y0,bd.x0,bd.y0],['S',bd.x0,bd.y1,bd.x1,bd.y1],['E',bd.x1,bd.y1,bd.x1,bd.y0],['W',bd.x0,bd.y0,bd.x0,bd.y1]];
  /* ---------- 建城市 ---------- */
  const CHK=new Map(),chunk=(b,k)=>{ const id=Math.floor(b.i/2)+Math.floor(b.j/2)*8; let e=CHK.get(id); if(!e){ e={}; CHK.set(id,e); } return e[k]||(e[k]=Bld()); };
  const floorsOf=bd=>bd.kind==='temple'?0:bd.kind==='cont'?0:Math.max(1,Math.round(bd.ht/4.6));
  const GF=36,FH=32;
  for(const b of Wd.B){ const RB=mul(b.i*131+b.j*977+Wd.di*7);
    for(const bd of b.blds){ const R=mul(bd.seed),w=bd.x1-bd.x0,d=bd.y1-bd.y0,k=bd.kind,wc=col(bd.wall);
      if(k==='temple'){ const B=chunk(b,'red'),h=44; for(const f of faces(bd)){ const L=Math.hypot(f[3]-f[1],f[4]-f[2]); wallQ(B,f[1],f[2],f[3],f[4],0,h,[0,0,L/120,h/128],'#c8402a'); } const C=chunk(b,'plain'),ov=10,y=h;
        C.box(bd.x0-ov,bd.x1+ov,y,y+4,bd.y0-ov,bd.y1+ov,'#a83020'); const rx0=bd.x0-ov,rx1=bd.x1+ov,rz0=bd.y0-ov,rz1=bd.y1+ov,rt=y+30,rc=col('#d8682a'),rc2=col('#b8501e');
        C.quad([rx0,y+4,rz1],[rx1,y+4,rz1],[rx1-14,rt,(rz0+rz1)/2],[rx0+14,rt,(rz0+rz1)/2],null,rc); C.quad([rx1,y+4,rz0],[rx0,y+4,rz0],[rx0+14,rt,(rz0+rz1)/2],[rx1-14,rt,(rz0+rz1)/2],null,rc2);
        C.quad([rx0,y+4,rz0],[rx0,y+4,rz1],[rx0+14,rt,(rz0+rz1)/2],[rx0+14,rt,(rz0+rz1)/2],null,rc2); C.quad([rx1,y+4,rz1],[rx1,y+4,rz0],[rx1-14,rt,(rz0+rz1)/2],[rx1-14,rt,(rz0+rz1)/2],null,rc2);
        C.box(rx0+10,rx1-10,rt-1,rt+4,(rz0+rz1)/2-2,(rz0+rz1)/2+2,'#e0b050'); for(const s of [-1,1]){ const x=s<0?rx0+8:rx1-8; C.box(x-3,x+3,rt,rt+12,(rz0+rz1)/2-2,(rz0+rz1)/2+2,'#e0b050'); }
        for(let q=0;q<5;q++) C.box(bd.x0+10+q*(w-20)/4-2,bd.x0+10+q*(w-20)/4+2,0,h,bd.y1+6,bd.y1+10,'#b83020');
        const hs=hSign(b.name||'廟','#a8201a','#ffd860'); const B2=chunk(b,'sh'); B2.quad([(bd.x0+bd.x1)/2-24,h-16,bd.y1+11],[(bd.x0+bd.x1)/2+24,h-16,bd.y1+11],[(bd.x0+bd.x1)/2+24,h-4,bd.y1+11],[(bd.x0+bd.x1)/2-24,h-4,bd.y1+11],hs,'#ffffff'); bd.h3=rt; continue; }
      if(k==='pav'){ const C=chunk(b,'plain'); for(const [x,z] of [[bd.x0+3,bd.y0+3],[bd.x1-3,bd.y0+3],[bd.x0+3,bd.y1-3],[bd.x1-3,bd.y1-3]]) C.box(x-1.5,x+1.5,0,26,z-1.5,z+1.5,'#8a3020'); const y=26,ov=5,cx=(bd.x0+bd.x1)/2,cz=(bd.y0+bd.y1)/2,c1=col('#2f7a5a'),c2=col('#24604a'); C.quad([bd.x0-ov,y,bd.y1+ov],[bd.x1+ov,y,bd.y1+ov],[cx,y+16,cz],[cx,y+16,cz],null,c1); C.quad([bd.x1+ov,y,bd.y0-ov],[bd.x0-ov,y,bd.y0-ov],[cx,y+16,cz],[cx,y+16,cz],null,c2); C.quad([bd.x0-ov,y,bd.y0-ov],[bd.x0-ov,y,bd.y1+ov],[cx,y+16,cz],[cx,y+16,cz],null,c2); C.quad([bd.x1+ov,y,bd.y1+ov],[bd.x1+ov,y,bd.y0-ov],[cx,y+16,cz],[cx,y+16,cz],null,c1); bd.h3=42; continue; }
      if(k==='cont'){ const n=Math.max(1,Math.round(bd.ht/6)),C=chunk(b,'ware'); for(let q=0;q<n;q++){ const y0=q*26,y1=y0+25,cc=col(q%2?shade(bd.wall,.85):bd.wall); for(const f of faces(bd)){ const L=Math.hypot(f[3]-f[1],f[4]-f[2]); wallQ(C,f[1],f[2],f[3],f[4],y0,y1,[0,0,L/60,.2],cc); } C.quad([bd.x0,y1,bd.y0],[bd.x0,y1,bd.y1],[bd.x1,y1,bd.y1],[bd.x1,y1,bd.y0],null,cc); } bd.h3=n*26; continue; }
      if(k==='booth'){ chunk(b,'plain').box(bd.x0,bd.x1,0,28,bd.y0,bd.y1,'#d8d4c8','#8a8a86'); bd.h3=28; continue; }
      let nf=floorsOf(bd); if(k==='ware') nf=2; const top=GF+(nf-1)*FH+(k==='ware'?10:0);
      const upper=k==='old'?'old':k==='tower'?(R()<.7?'glass':'office'):k==='hosp'||k==='police'?'office':k==='school'?'apt':k==='ware'?'ware':(R()<.6?'apt':'office');
      const ground=k==='tower'?'glass':k==='ware'?'ware':k==='hosp'||k==='police'||k==='school'?'office':'shop',gr=Math.floor(R()*4),wcol=k==='tower'&&upper==='glass'?col('#ffffff'):wc;
      for(const f of faces(bd)){ const L=Math.hypot(f[3]-f[1],f[4]-f[2]),u0=Math.floor(R()*4)*.25;
        if(ground==='shop'){ wallQ(chunk(b,'shop'),f[1],f[2],f[3],f[4],0,GF,[u0,gr*.25,u0+L/120,gr*.25+.25],col('#ffffff')); }
        else wallQ(chunk(b,ground),f[1],f[2],f[3],f[4],0,GF,[u0,0,u0+L/120,GF/128],ground==='glass'?col('#e8eef4'):wcol);
        if(top>GF) wallQ(chunk(b,upper),f[1],f[2],f[3],f[4],GF,top,[u0,0,u0+L/120,(top-GF)/128],wcol); }
      const C=chunk(b,'plain'),rc=k==='tower'?'#6a6e74':k==='ware'?'#8a9098':pick(R,['#a9a59c','#b8b2a6','#9a968e','#b0aa9e']);
      C.quad([bd.x0,top,bd.y0],[bd.x0,top,bd.y1],[bd.x1,top,bd.y1],[bd.x1,top,bd.y0],null,rc);
      if(k!=='ware'){ const pc=shade(bd.wall,.85); C.box(bd.x0,bd.x1,top,top+4,bd.y0,bd.y0+1.5,pc); C.box(bd.x0,bd.x1,top,top+4,bd.y1-1.5,bd.y1,pc); C.box(bd.x0,bd.x0+1.5,top,top+4,bd.y0,bd.y1,pc); C.box(bd.x1-1.5,bd.x1,top,top+4,bd.y0,bd.y1,pc); }
      // 頂樓：水塔、鐵皮加蓋、冷氣
      if(k==='old'||k==='mid'||k==='school'){ if(k==='old'&&R()<.6){ const sw=w*(.45+R()*.45),sd=d*(.4+R()*.45),sx=bd.x0+R()*(w-sw),sz=bd.y0+R()*(d-sd),rc2=pick(R,['#4a74a8','#4d8a6a','#a0603a','#d8d8d0','#3a6a9a']); C.box(sx,sx+sw,top,top+22,sz,sz+sd,'#c8c4b8',rc2); }
        for(let q=0;q<1+Math.floor(R()*2);q++){ const tx=bd.x0+4+R()*(w-8),tz=bd.y0+4+R()*(d-8),tr=3.6+R()*1.6; mm.makeTranslation(tx,top+9,tz); C.geo(new T.CylinderGeometry(tr,tr,10,10),mm,pick(R,['#e8eaee','#3a6ab8','#f4f4f4'])); mm.makeTranslation(tx,top+2,tz); C.geo(new T.CylinderGeometry(.8,.8,4,4),mm,'#555'); }
        if(R()<.6){ const ax=bd.x0+3+R()*(w-10),az=bd.y0+3+R()*(d-8); C.box(ax,ax+7,top,top+5,az,az+5,'#dcdcd4'); } }
      if(k==='tower'||k==='hosp'){ C.box(bd.x0+w*.3,bd.x1-w*.3,top,top+16,bd.y0+d*.3,bd.y1-d*.3,shade(rc,1.15)); if(R()<.5){ mm.makeTranslation((bd.x0+bd.x1)/2,top+40,(bd.y0+bd.y1)/2); C.geo(new T.CylinderGeometry(.7,.7,48,4),mm,'#888'); } }
      if(k==='hosp'){ const S2=chunk(b,'sh'),cx=(bd.x0+bd.x1)/2,z=bd.y1+1.2; S2.quad([cx-40,GF+2,z],[cx+40,GF+2,z],[cx+40,GF+22,z],[cx-40,GF+22,z],hSign('市立醫院 急診','#c8202a','#ffffff'),'#fff'); C.box(cx-4,cx+4,top-40,top-4,z-.5,z+1,'#e83a3a'); C.box(cx-14,cx+14,top-26,top-18,z-.5,z+1,'#e83a3a'); }
      if(k==='police'){ const S2=chunk(b,'sh'),cx=(bd.x0+bd.x1)/2,z=bd.y1+1.2; S2.quad([cx-36,GF+2,z],[cx+36,GF+2,z],[cx+36,GF+20,z],[cx-36,GF+20,z],hSign('警察局','#1d4fa8','#ffffff'),'#fff'); C.box(bd.x0,bd.x1,GF-2,GF+1,bd.y1,bd.y1+1,'#1d4fa8'); }
      if(k==='school'){ C.box(bd.x0,bd.x1,top-6,top,bd.y1,bd.y1+1,'#b5523e'); }
      // 招牌：直立招牌伸出牆外、橫招牌貼在一樓上方
      for(const s of bd.signs){ const f=faces(bd).find(q=>q[0]===s.f); if(!f) continue; const ax=f[1],az=f[2],bx=f[3],bz=f[4],L=Math.hypot(bx-ax,bz-az); if(L<10) continue; const ux=(bx-ax)/L,uz=(bz-az)/L,nx=uz,nz=-ux,a0=s.u*L,ww=Math.max(8,s.w*L);
        if(s.v){ const along=a0+ww/2,px=ax+ux*along,pz=az+uz*along,hs=cl(top-GF-10,30,120),y0=GF+6,uv=vSign(s.txt,s.bg,s.fg),B2=chunk(b,'sv'),o0=1.5,o1=14;
          B2.quad([px+nx*o0,y0,pz+nz*o0],[px+nx*o1,y0,pz+nz*o1],[px+nx*o1,y0+hs,pz+nz*o1],[px+nx*o0,y0+hs,pz+nz*o0],uv,'#fff'); B2.quad([px+nx*o1,y0,pz+nz*o1],[px+nx*o0,y0,pz+nz*o0],[px+nx*o0,y0+hs,pz+nz*o0],[px+nx*o1,y0+hs,pz+nz*o1],uv,'#fff');
          C.box(px+nx*o0-.6,px+nx*o1+.6,y0+hs,y0+hs+1.4,pz+nz*o0-.6,pz+nz*o1+.6,'#333'); }
        else { const uv=hSign(s.txt,s.bg,s.fg),B2=chunk(b,'sh'),off=1.2,x0=ax+ux*a0+nx*off,z0=az+uz*a0+nz*off,x1=ax+ux*(a0+ww)+nx*off,z1=az+uz*(a0+ww)+nz*off; B2.quad([x0,GF-14,z0],[x1,GF-14,z1],[x1,GF-1,z1],[x0,GF-1,z0],uv,'#fff'); } }
      bd.h3=top; }
    // 捷運站入口：玻璃雨遮＋站名
    if(b.mrt){ const e=b.mrt,[x0,z0,x1,z1]=e.rect,C=chunk(b,'plain'); C.box(x0,x1,0,30,z1-1.5,z1,'#c8ccd2'); C.box(x0,x0+1.4,0,30,z0,z1,'#c8ccd2'); C.box(x1-1.4,x1,0,30,z0,z1,'#c8ccd2'); C.box(x0-2,x1+2,30,33,z0-2,z1+2,'#1d6ab8','#e8eef4'); C.box(x0+2,x1-2,.2,1.2,z0+1,z1-3,'#1a1a1e'); for(let q=0;q<5;q++) C.box(x0+3,x1-3,.3,1.4,z0+2+q*2.4,z0+3+q*2.4,'#55585e');
      chunk(b,'sh').quad([x0-2,33,z1+2.1],[x1+2,33,z1+2.1],[x1+2,41,z1+2.1],[x0-2,41,z1+2.1],mrtSign(e.n),'#fff'); chunk(b,'sh').quad([x1+2,33,z0-2.1],[x0-2,33,z0-2.1],[x0-2,41,z0-2.1],[x1+2,41,z0-2.1],mrtSign(e.n),'#fff');
      mm.makeTranslation(x1+6,24,z1+6); C.geo(new T.CylinderGeometry(.8,.8,48,6),mm,'#888'); mm.makeRotationX(PI/2); mm.setPosition(x1+6,50,z1+6); C.geo(new T.CylinderGeometry(6,6,1.4,20),mm,'#1d6ab8'); }
    if(Wd.garage&&Wd.garage.b===b){ const g=Wd.garage,f=['N','E','S','W'][g.s],bd=b.blds.slice().sort((p,q)=>{ const d=(z)=>f==='N'?z.y0:f==='S'?-z.y1:f==='E'?-z.x1:z.x0; return d(p)-d(q); })[0]; if(bd){ const fc=faces(bd).find(q=>q[0]===f),L=Math.hypot(fc[3]-fc[1],fc[4]-fc[2]),ux=(fc[3]-fc[1])/L,uz=(fc[4]-fc[2])/L,nx=uz,nz=-ux,mx=(fc[1]+fc[3])/2,mz=(fc[2]+fc[4])/2,hw=Math.min(L/2-2,26); chunk(b,'sh').quad([mx-ux*hw+nx*1.4,GF-14,mz-uz*hw+nz*1.4],[mx+ux*hw+nx*1.4,GF-14,mz+uz*hw+nz*1.4],[mx+ux*hw+nx*1.4,GF-1,mz+uz*hw+nz*1.4],[mx-ux*hw+nx*1.4,GF-1,mz-uz*hw+nz*1.4],hSign('老K車行','#111','#ffd23f'),'#fff'); } }
  }
  // 號誌桿、路名牌、測速照相
  const SIG=[]; { const pc='#5a5c60';
    for(let ix=0;ix<=NB;ix++) for(let iy=0;iy<=NB;iy++){ const X=ix*P,Y=iy*P,bk=Wd.blk(Math.min(ix,NB-1),Math.min(iy,NB-1))||Wd.B[0],C=chunk(bk,'plain'),S2=chunk(bk,'sh');
      for(const [px,pz,h,fx,fz,ax,az,nm] of [[X+HR+4,Y+HR+4,1,-1,0,0,-1,Wd.rnV[ix]],[X-HR-4,Y-HR-4,1,1,0,0,1,Wd.rnV[ix]],[X+HR+4,Y-HR-4,0,0,1,-1,0,Wd.rnH[iy]],[X-HR-4,Y+HR+4,0,0,-1,1,0,Wd.rnH[iy]]]){
        if(px<-HR-20||pz<-HR-20||px>NB*P+HR+20||pz>NB*P+HR+20) continue;
        mm.makeTranslation(px,38,pz); C.geo(new T.CylinderGeometry(1.2,1.6,76,6),mm,pc); const AL=50,ex=px+ax*AL,ez=pz+az*AL; C.box(Math.min(px,ex)-.8,Math.max(px,ex)+.8,72,74,Math.min(pz,ez)-.8,Math.max(pz,ez)+.8,pc);
        const hx=px+ax*(AL-10),hz=pz+az*(AL-10); C.box(hx-ax*10-1.6-Math.abs(az)*1.6,hx+ax*10+1.6+Math.abs(az)*1.6,64,72,hz-az*10-1.6-Math.abs(ax)*1.6,hz+az*10+1.6+Math.abs(ax)*1.6,'#1a1a1c');
        const lamps=[]; for(let q=0;q<3;q++){ const t2=-1+q; lamps.push([hx+ax*t2*6+fx*2.2,68,hz+az*t2*6+fz*2.2]); } SIG.push({ix,iy,h,lamps});
        // 路名牌（藍底白字），掛在桿子上面向來車
        const uv=roadSign(nm),sx=px+ax*12,sz=pz+az*12,lx=-fz,lz=fx,hw=17; const fo=.8; S2.quad([sx+lx*hw+fx*fo,56,sz+lz*hw+fz*fo],[sx-lx*hw+fx*fo,56,sz-lz*hw+fz*fo],[sx-lx*hw+fx*fo,65,sz-lz*hw+fz*fo],[sx+lx*hw+fx*fo,65,sz+lz*hw+fz*fo],uv,'#fff'); C.box(sx-lx*hw-fx*.2,sx+lx*hw+fx*.2,56,65,sz-lz*hw-fz*.2,sz+lz*hw+fz*.2,'#1e4fa0'); } }
    for(const cm of Wd.cams){ const x=cm.h?cm.x:cm.x+HR+6,z=cm.h?cm.y-HR-6:cm.y,bk=Wd.blk(cl(Math.floor(x/P),0,NB-1),cl(Math.floor(z/P),0,NB-1)),C=chunk(bk,'plain'); mm.makeTranslation(x,26,z); C.geo(new T.CylinderGeometry(1,1.3,52,6),mm,'#6a6c70'); C.box(x-4,x+4,46,54,z-3,z+3,'#d8d8d0'); chunk(bk,'sh').quad([x-6,30,z+3.2],[x+6,30,z+3.2],[x+6,42,z+3.2],[x-6,42,z+3.2],hSign('測速 60','#ffffff','#c8202a'),'#fff'); } }
  const MATS={plain:plainM,sh:SMH,sv:SMV}; Object.assign(MATS,FM);
  for(const [,e] of CHK) for(const k in e){ if(!e[k].p.length) continue; const m=new T.Mesh(e[k].build(),MATS[k]); m.castShadow=k!=='sh'&&k!=='sv'; m.receiveShadow=true; scene.add(m); }
  /* 樹、路燈、機車、公共單車：InstancedMesh */
  const IM4=new T.Matrix4(),IQ=new T.Quaternion(),IE=new T.Euler(),IV=new T.Vector3(),IS=new T.Vector3(),IC=new T.Color();
  const setM=(m,i,x,y,z,yaw,sx,sy,sz)=>{ IE.set(0,yaw||0,0); IQ.setFromEuler(IE); IV.set(x,y,z); IS.set(sx,sy==null?sx:sy,sz==null?sx:sz); IM4.compose(IV,IQ,IS); m.setMatrixAt(i,IM4); };
  const trees=[]; for(const b of Wd.B) for(const t of b.trees) trees.push(t);
  { const trunk=new T.InstancedMesh(new T.CylinderGeometry(1.2,2,1,6).translate(0,.5,0),new T.MeshLambertMaterial({color:0x6a5040}),trees.length),crown=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshLambertMaterial({color:0xffffff}),trees.length*2); crown.instanceColor=new T.InstancedBufferAttribute(new Float32Array(trees.length*6),3);
    const TC2=['#3f7a34','#356b30','#4a8838','#2f6a3a','#c85a6a','#d8b83a'];
    trees.forEach((t,i)=>{ const h=24+t.r*.6,rr2=t.r*.95; setM(trunk,i,t.x,0,t.y,0,1,h,1); setM(crown,i*2,t.x,h+rr2*.35,t.y,t.v,rr2,rr2*.8,rr2); setM(crown,i*2+1,t.x+rr2*.3,h+rr2*.8,t.y-rr2*.2,t.v*2,rr2*.7,rr2*.6,rr2*.7); IC.set(TC2[t.v]); if(t.v<4) IC.offsetHSL(0,0,(hash(i,3,1)-.5)*.08); crown.setColorAt(i*2,IC); IC.set(t.v>=4?TC2[t.v]:shade(TC2[t.v],1.15)); crown.setColorAt(i*2+1,t.v>=4?IC:IC); });
    trunk.castShadow=crown.castShadow=true; crown.receiveShadow=true; scene.add(trunk,crown); }
  const lamps=[]; for(const b of Wd.B) for(const l of b.lamps) lamps.push(l);
  const lampHeadM=new T.MeshLambertMaterial({color:0xe8e8e0,emissive:0x000000});
  { const pole=new T.InstancedMesh((()=>{ const B=Bld(); mm.makeTranslation(0,40,0); B.geo(new T.CylinderGeometry(1,1.5,80,6),mm,'#5a5c60'); B.box(0,18,78,80,-.7,.7,'#5a5c60'); return B.build(); })(),plainM,lamps.length),head=new T.InstancedMesh(new T.BoxGeometry(8,2,4.4).translate(18,77,0),lampHeadM,lamps.length);
    lamps.forEach((l,i)=>{ const a=Math.atan2(l.ay,l.ax); setM(pole,i,l.x,0,l.y,-a,1); setM(head,i,l.x,0,l.y,-a,1); }); pole.castShadow=true; scene.add(pole,head); }
  const lampPool=new T.InstancedMesh(new T.CircleGeometry(1,16).rotateX(-PI/2),new T.MeshBasicMaterial({color:0xffd8a0,transparent:true,opacity:.22,depthWrite:false,blending:T.AdditiveBlending}),lamps.length); lamps.forEach((l,i)=>{ const a=Math.atan2(l.ay,l.ax); setM(lampPool,i,l.x+Math.cos(a)*18,.5,l.y+Math.sin(a)*18,0,62,1,62); }); lampPool.visible=false; scene.add(lampPool);
  const scoots=[]; for(const b of Wd.B) for(const s of b.scoot) scoots.push(s);
  const scBody=new T.InstancedMesh((()=>{ const B=Bld(); B.box(-9,6,3,8,-3.2,3.2,'#fff'); B.box(4,8,3,13,-2.4,2.4,'#fff'); return B.build(); })(),new T.MeshPhongMaterial({vertexColors:true,shininess:60}),Math.max(1,scoots.length)),scDark=new T.InstancedMesh((()=>{ const B=Bld(); B.box(-8.5,1,8,10,-2.6,2.6,'#1c1c1e'); for(const x of [-7,7]){ mm.makeRotationX(PI/2); mm.setPosition(x,2.6,0); B.geo(new T.CylinderGeometry(2.6,2.6,1.8,10),mm,'#151517'); } B.box(7,7.6,13,14,-5,5,'#222'); return B.build(); })(),plainM,Math.max(1,scoots.length));
  scBody.instanceColor=new T.InstancedBufferAttribute(new Float32Array(Math.max(1,scoots.length)*3),3); scoots.forEach((s,i)=>{ IC.set(s.c); scBody.setColorAt(i,IC); }); scBody.castShadow=scDark.castShadow=true; scene.add(scBody,scDark);
  const bikes=[]; for(const b of Wd.B) for(const q of (b.bikes||[])) bikes.push(q);
  const bkM=new T.InstancedMesh((()=>{ const B=Bld(); for(const x of [-6,6]){ mm.makeRotationX(PI/2); mm.setPosition(x,3.4,0); B.geo(new T.TorusGeometry(3.2,.4,4,12),mm,'#1a1a1a'); } B.box(-6,6,6,7,-.4,.4,'#f0a020'); B.box(-1,0,3.4,9.6,-.4,.4,'#f0a020'); B.box(4.6,5.4,3.4,11,-.4,.4,'#f0a020'); B.box(4.4,5.6,11,11.6,-3,3,'#222'); B.box(-2.6,.6,9.6,10.4,-1,1,'#222'); B.box(6,9,7,10,-1.6,1.6,'#f0a020'); return B.build(); })(),plainM,Math.max(1,bikes.length)); bkM.castShadow=true; scene.add(bkM);
  let parkVer=-1; function syncParked(ver){ if(ver===parkVer) return; parkVer=ver; scoots.forEach((s,i)=>{ const k=s.taken?0:1; setM(scBody,i,s.x,0,s.y,-s.a,k); setM(scDark,i,s.x,0,s.y,-s.a,k); }); bikes.forEach((q,i)=>setM(bkM,i,q.x,0,q.y,-q.a,q.taken?0:1)); for(const m of [scBody,scDark,bkM]) m.instanceMatrix.needsUpdate=true; }
  // 號誌燈：每個燈一顆小球，顏色每幾格更新一次
  const sigL=new T.InstancedMesh(new T.SphereGeometry(1.9,8,6),new T.MeshBasicMaterial({color:0xffffff}),SIG.length*3); { let i=0; for(const s of SIG) for(const L of s.lamps){ setM(sigL,i++,L[0],L[1],L[2],0,1); } } sigL.instanceColor=new T.InstancedBufferAttribute(new Float32Array(SIG.length*9),3); scene.add(sigL);
  const LC={r:['#ff2a1a','#3a1210'],y:['#ffc21a','#3a3010'],g:['#2aff6a','#103a18']};
  /* ---------- 地面：每格一張貼圖，只載鏡頭附近 ---------- */
  const GT=new Map(),groundM={dry:null},GQ=[]; const wetC=new T.Color(.72,.74,.8),dryC=new T.Color(1,1,1);
  function cellMesh(ci,cj){ const k=ci+','+cj; let e=GT.get(k); if(e) return e; const c2=canv(512,512,(c,w)=>{ c.scale(w/P,w/P); c.translate(-ci*P,-cj*P); paintCell(c,Wd,ci,cj,false,true); }); const t=tex(c2); t.anisotropy=8; const m=new T.Mesh(new T.PlaneGeometry(P,P),new T.MeshPhongMaterial({map:t,shininess:6,specular:0x0c0c0c})); m.rotation.x=-PI/2; m.position.set(ci*P+P/2,0,cj*P+P/2); m.receiveShadow=true; scene.add(m); e={m,t,ci,cj}; GT.set(k,e); return e; }
  const far=new T.Mesh(new T.PlaneGeometry(30000,30000),new T.MeshLambertMaterial({color:0x2c5a72})); far.rotation.x=-PI/2; far.position.set(NB*P/2,-.6,NB*P/2); scene.add(far);
  function groundAround(x,z,wet,budget){ const ci0=Math.floor(x/P),cj0=Math.floor(z/P),RAD=3; let made=0;
    for(let d=0;d<=RAD;d++) for(let ci=ci0-d;ci<=ci0+d;ci++) for(let cj=cj0-d;cj<=cj0+d;cj++){ if(Math.max(Math.abs(ci-ci0),Math.abs(cj-cj0))!==d) continue; if(ci<-3||cj<-3||ci>NB+2||cj>NB+2) continue; const k=ci+','+cj; if(!GT.has(k)){ if(made>=budget) continue; made++; } const e=cellMesh(ci,cj); e.seen=frame; }
    for(const [k,e] of GT){ if(frame-e.seen>90&&GT.size>64){ scene.remove(e.m); e.m.geometry.dispose(); e.m.material.dispose(); e.t.dispose(); GT.delete(k); } else { e.m.material.color.copy(wet?wetC:dryC); e.m.material.shininess=wet?70:6; e.m.material.specular.setHex(wet?0x5a6070:0x0c0c0c); } } }
  /* ---------- 車子模型（車頭 +X） ---------- */
  function ext(pts,w){ const s=new T.Shape(); pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1])); s.closePath(); const g=new T.ExtrudeGeometry(s,{depth:w,bevelEnabled:true,bevelSize:.5,bevelThickness:.5,bevelSegments:1,curveSegments:2}); g.translate(0,0,-w/2); return g; }
  const glassC='#24303c',tireC='#151517';
  function wheels(B,xs,hw,rd,wd){ const g=new T.CylinderGeometry(rd,rd,wd,14),hb=new T.CylinderGeometry(rd*.55,rd*.55,wd+.2,10); for(const x of xs) for(const s of [-1,1]){ mm.makeRotationX(PI/2); mm.setPosition(x,rd,s*hw); B.geo(g,mm,tireC); B.geo(hb,mm,'#9a9ea4'); } }
  const VM={};
  function carModel(ty){ const T0=VT[ty],L=T0.L,Wd2=T0.W,h=L/2,hw=Wd2/2,body=Bld(),fix=Bld(),lamp=Bld(),brake=Bld(),siren=[Bld(),Bld()],X=f=>f*h;
    const std=(lo,cab,roofY,wr)=>{ body.geo(ext(lo.map(p=>[X(p[0]),p[1]]),Wd2-1)); fix.geo(ext(cab.map(p=>[X(p[0]),p[1]]),Wd2-2.6),null,glassC); const rx0=X(cab[1][0])+1,rx1=X(cab[2][0])-1; body.box(rx0,rx1,roofY-.6,roofY+.8,-hw+1.6,hw-1.6,'#fff'); body.box(X((cab[1][0]+cab[2][0])/2)-.7,X((cab[1][0]+cab[2][0])/2)+.7,cab[0][1],roofY,-hw+1.1,hw-1.1,'#fff'); wheels(fix,[X(-.62),X(.62)],hw-2.2,wr||4,3.2); };
    const lights=(fy,ry)=>{ for(const s of [-1,1]){ lamp.box(h-.6,h+.4,fy-1.2,fy+1.6,s*(hw-4.8),s*(hw-1.6),'#fffbe8'); lamp.box(-h-.4,-h+.6,ry-1.2,ry+1.6,s*(hw-5),s*(hw-1.4),'#8a1010'); brake.box(-h-.8,-h+.2,ry-1.4,ry+1.8,s*(hw-5.2),s*(hw-1.2),'#ff2a2a'); } fix.box(h-.4,h+.6,3,5.4,-hw+1,hw-1,'#1c1c20'); fix.box(-h-.6,-h+.4,3,5.4,-hw+1,hw-1,'#1c1c20'); };
    const bar=(y,x0,x1)=>{ fix.box(x0,x1,y,y+1,-hw+3,hw-3,'#2a2a2e'); siren[0].box(x0+.3,x1-.3,y+1,y+3,-hw+3.4,-.4,'#ff2020'); siren[1].box(x0+.3,x1-.3,y+1,y+3,.4,hw-3.4,'#2050ff'); };
    if(ty==='sedan'||ty==='taxi'||ty==='police'){ std([[-1,3],[-1,10],[-.92,12],[-.6,12.6],[.55,12.6],[.92,11],[1,8.5],[1,3]],[[-.66,12.3],[-.4,19],[.2,19],[.5,12.3]],19.2); lights(9.6,10); if(ty==='taxi'){ fix.box(-3,3,19.8,23.4,-5,5,'#fff6c0'); } if(ty==='police'){ fix.box(-h*.98,h*.98,7.8,9.4,-hw-.1,hw+.1,'#1d4fa8'); bar(19.9,-4,4); } }
    else if(ty==='hatch'){ std([[-1,3],[-1,11],[-.95,12.4],[.55,12.6],[.92,11],[1,8.5],[1,3]],[[-.92,12.4],[-.84,19],[.18,19],[.5,12.4]],19.2); lights(9.6,12); }
    else if(ty==='sports'){ std([[-1,2.5],[-1,8.6],[-.9,9.6],[.6,9.6],[.95,7.4],[1,5],[1,2.5]],[[-.55,9.3],[-.25,14.4],[.12,14.4],[.45,9.3]],14.6,3.8); lights(7,8); fix.box(-h,-h+3,9.6,12,-hw+1,hw-1,'#1a1a1c'); }
    else if(ty==='suv'){ std([[-1,4],[-1,14],[-.95,15.4],[.55,15.6],[.9,14],[1,11],[1,4]],[[-.86,15.2],[-.78,23.5],[.24,23.5],[.52,15.2]],23.8,4.6); lights(12,13); fix.box(-h*.9,h*.6,24,25,-hw+2,-hw+3,'#333'); fix.box(-h*.9,h*.6,24,25,hw-3,hw-2,'#333'); }
    else if(ty==='van'||ty==='amb'){ const top=ty==='amb'?27:24; body.geo(ext([[-h,3],[-h,top],[h*.45,top],[h*.7,16],[h,13.5],[h,3]],Wd2-1)); { const x1=h*.45,x2=h*.7,zw=hw-1.6,nl=Math.hypot(top-16,x2-x1),ox=(top-16)/nl*.35,oy=(x2-x1)/nl*.35; fix.quad([x2+ox,16+oy,zw],[x2+ox,16+oy,-zw],[x1+ox,top+oy,-zw],[x1+ox,top+oy,zw],null,glassC); } fix.box(-h*.9,h*.3,15.6,21,-hw-.15,hw+.15,glassC); wheels(fix,[-h*.6,h*.6],hw-2.2,4.2,3.2); lights(10,12); fix.box(-h-.3,-h+.2,15,22,-hw+2.4,hw-2.4,glassC);
      if(ty==='amb'){ fix.box(-h,h*.45,10,13,-hw-.2,hw+.2,'#d82020'); bar(top,h*.1,h*.4); bar(top,-h*.95,-h*.75); } }
    else if(ty==='truck'){ body.geo(ext([[h*.3,3],[h*.3,22],[h*.68,22],[h*.95,14],[h,12],[h,3]],Wd2-1)); fix.box(h*.7,h*.92,14.6,21,-hw+1.4,hw-1.4,glassC); fix.box(-h,h*.28,3,8,-hw,hw,'#9aa0a6'); fix.box(-h,h*.28,8,15,-hw,-hw+1,'#c8ccd0'); fix.box(-h,h*.28,8,15,hw-1,hw,'#c8ccd0'); fix.box(-h,-h+1,8,15,-hw,hw,'#c8ccd0'); wheels(fix,[-h*.6,h*.62],hw-2,4,3.2); lights(9,10); }
    else if(ty==='bus'){ body.box(-h,h,4,32,-hw,hw,'#fff'); fix.box(-h*.92,h*.9,15,27,-hw-.15,hw+.15,glassC); fix.box(h-.1,h+.2,10,29,-hw+1,hw-1,glassC); fix.box(-h,h,2,5,-hw-.1,hw+.1,'#2a2a2e'); wheels(fix,[-h*.62,h*.66],hw-2.6,5,4); lights(8,9); }
    else if(ty==='garbage'){ fix.box(h*.45,h,3,22,-hw,hw,'#f1c40f'); fix.box(h*.92,h+.2,13,20,-hw+1.5,hw-1.5,glassC); body.box(-h,h*.42,4,30,-hw-.4,hw+.4,'#fff'); fix.box(-h-.5,-h+1,6,26,-hw+1,hw-1,'#2a2a2e'); wheels(fix,[-h*.55,h*.7],hw-2.4,5,4); lights(9,10); }
    return {body:body.build(),fix:fix.build(),lamp:lamp.build(),brake:brake.build(),s0:siren[0].p.length?siren[0].build():null,s1:siren[1].p.length?siren[1].build():null}; }
  function scootModel(bike){ const body=Bld(),fix=Bld(),shirt=Bld(),hel=Bld(),skin=Bld(),sph=new T.SphereGeometry(1,10,8); const Sc=(B,x,y,z,sx,sy,sz,c0)=>{ mm.makeScale(sx,sy,sz); mm.setPosition(x,y,z); B.geo(sph,mm,c0); };
    if(bike){ for(const x of [-6.5,6.5]){ mm.makeRotationX(PI/2); mm.setPosition(x,3.6,0); fix.geo(new T.TorusGeometry(3.3,.45,5,14),mm,'#151515'); } body.box(-6.5,6,6.2,7.2,-.45,.45,'#fff'); body.box(-1.6,-.6,3.6,10,-.45,.45,'#fff'); body.box(5.2,6,3.6,11.4,-.45,.45,'#fff'); fix.box(4.6,6.2,11.4,12,-3.4,3.4,'#222'); fix.box(-3,1,10,11,-1.2,1.2,'#222'); }
    else { for(const x of [-7,7]){ mm.makeRotationX(PI/2); mm.setPosition(x,2.6,0); fix.geo(new T.CylinderGeometry(2.6,2.6,1.8,12),mm,tireC); } body.box(-9,5,3,8,-3.2,3.2,'#fff'); Sc(body,-4,8.6,0,5.2,2.4,3.2,'#fff'); body.box(4,8,3,13.4,-2.4,2.4,'#fff'); fix.box(-8,1,8.8,10.6,-2.6,2.6,'#1c1c1e'); fix.box(7.4,8,13,14,-5,5,'#222'); fix.box(8,8.6,9,11,-1.2,1.2,'#fffbe8'); fix.box(-9.4,-8.8,7,8.4,-1.2,1.2,'#c81a1a'); }
    // 騎士
    const sx=bike?-1.5:-3; for(const s of [-1,1]){ fix.box(sx-1,sx+5,9.5,12,s*.6,s*3,'#2b3550'); fix.box(sx+4,sx+6.5,3,11,s*.8,s*2.8,'#2b3550'); shirt.box(sx+1,sx+7.5,16,18,s*2.8,s*4.2,'#fff'); skin.box(sx+7,sx+8.6,14.6,16.4,s*2.6,s*4,'#fff'); }
    Sc(shirt,sx+.5,17.5,0,3,5.8,4.2,'#fff'); Sc(skin,sx+1.4,24.4,0,1.5,1.4,1.4,'#fff'); Sc(hel,sx+1.2,25.8,0,2.9,2.8,2.8,'#fff'); if(!bike) fix.box(sx+3.2,sx+4,25,26.6,-1.8,1.8,'#1c1c24');
    return {body:body.build(),fix:fix.build(),shirt:shirt.build(),hel:hel.build(),skin:skin.build()}; }
  const fixM=new T.MeshPhongMaterial({vertexColors:true,shininess:70,specular:0x555555}),lampM=new T.MeshBasicMaterial({vertexColors:true}),sirenM=[new T.MeshBasicMaterial({vertexColors:true}),new T.MeshBasicMaterial({vertexColors:true})];
  const softC=canv(64,64,(c,w,h)=>{ const g=c.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.4,'rgba(255,255,255,.45)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(0,0,w,h); }),softT=tex(softC);
  const glowGeo=new T.PlaneGeometry(1,1),glowW=new T.MeshBasicMaterial({map:softT,color:0xfff0c8,transparent:true,depthWrite:false,blending:T.AdditiveBlending}),glowR=new T.MeshBasicMaterial({map:softT,color:0xff3020,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  const POOL={},getPool=k=>POOL[k]||(POOL[k]={list:[],used:0});
  function getVeh(ty){ const two=ty==='scooter'||ty==='bike',k=ty,P2=getPool(k); let e=P2.list[P2.used++]; if(e){ e.visible=true; return e; }
    e=new T.Group(); e.bodyM=new T.MeshPhongMaterial({color:0xffffff,shininess:80,specular:0x666666});
    if(two){ const m=VM[k]||(VM[k]=scootModel(ty==='bike')); e.shirtM=new T.MeshLambertMaterial({color:0xffffff}); e.helM=new T.MeshPhongMaterial({color:0xffffff,shininess:80}); e.skinM=new T.MeshLambertMaterial({color:0xe0b48e}); e.rider=new T.Group(); const a=new T.Mesh(m.body,e.bodyM),f=new T.Mesh(m.fix,fixM); e.rider.add(new T.Mesh(m.shirt,e.shirtM),new T.Mesh(m.hel,e.helM),new T.Mesh(m.skin,e.skinM)); a.castShadow=f.castShadow=true; e.add(a,f,e.rider); }
    else { const m=VM[k]||(VM[k]=carModel(ty)); const b=new T.Mesh(m.body,e.bodyM),f=new T.Mesh(m.fix,fixM),l=new T.Mesh(m.lamp,lampM); e.brakeM=new T.Mesh(m.brake,lampM); b.castShadow=f.castShadow=true; e.add(b,f,l,e.brakeM); if(m.s0){ e.s0=new T.Mesh(m.s0,sirenM[0]); e.s1=new T.Mesh(m.s1,sirenM[1]); e.add(e.s0,e.s1); }
      const T0=VT[ty]; e.gl=[]; for(const s of [-1,1]){ const g=new T.Mesh(glowGeo,glowW); g.position.set(T0.L/2+1,9,s*(T0.W/2-3)); g.rotation.y=PI/2; g.scale.setScalar(16); e.add(g); e.gl.push(g); const g2=new T.Mesh(glowGeo,glowR); g2.position.set(-T0.L/2-1,10,s*(T0.W/2-3)); g2.rotation.y=-PI/2; g2.scale.setScalar(10); e.add(g2); e.gl.push(g2); } }
    scene.add(e); P2.list.push(e); return e; }
  /* ---------- 行人：InstancedMesh ---------- */
  const MAXP=260,PG={torso:new T.CylinderGeometry(2.3,1.9,7,9),head:new T.SphereGeometry(1.6,10,8),hair:new T.SphereGeometry(1.72,10,6,0,TAU,0,PI*.55),leg:new T.CylinderGeometry(1.05,.8,9.4,7).translate(0,-4.7,0),arm:new T.CylinderGeometry(.62,.5,6.8,6).translate(0,-3.4,0),umb:new T.ConeGeometry(8,3.4,8,1,true).translate(0,1.7,0)};
  const IMP={}; for(const k of ['torso','head','hair','legL','legR','armL','armR','umb']){ const g=k.startsWith('leg')?PG.leg:k.startsWith('arm')?PG.arm:PG[k]; const m=new T.InstancedMesh(g,new T.MeshLambertMaterial({color:0xffffff,side:k==='umb'?T.DoubleSide:T.FrontSide}),MAXP); m.instanceColor=new T.InstancedBufferAttribute(new Float32Array(MAXP*3),3); m.frustumCulled=false; m.castShadow=k==='torso'||k.startsWith('leg')||k==='umb'; scene.add(m); IMP[k]=m; }
  let pedN=0,umbN=0; const m4=new T.Matrix4(),q4=new T.Quaternion(),e4=new T.Euler(0,0,0,'YXZ'),v4=new T.Vector3(),s4=new T.Vector3(),c4=new T.Color(),off=new T.Vector3(),UP=new T.Vector3(0,1,0);
  function setP(k,idx,yaw,rx,rz,ox,oy,oz,bx,by,bz,sc,c0,lie){ const m=IMP[k]; e4.set(rx,yaw,rz); q4.setFromEuler(e4); off.set(ox,oy,oz).multiplyScalar(sc); if(lie){ off.set(off.y-10*sc,off.z,-off.x).applyAxisAngle(UP,yaw); e4.set(rx,yaw,rz+PI/2); q4.setFromEuler(e4); } else off.applyAxisAngle(UP,yaw); v4.set(bx+off.x,by+off.y,bz+off.z); s4.setScalar(sc); m4.compose(v4,q4,s4); m.setMatrixAt(idx,m4); c4.set(c0); m.setColorAt(idx,c4); }
  function ped(q,t){ if(pedN>=MAXP) return; const lk=q.lk||{},yaw=-(q.a||0)-PI/2,sc=(q.sc||1)*.86,run=q.run,sw=q.lying?0:Math.sin(q.ph||0)*(run?.9:.5),X=q.x,Z=q.y,lie=!!q.lying,i=pedN,y=lie?1.5:0;
    setP('torso',i,yaw,lie?0:(run?.18:0),0,0,12.8,0,X,y,Z,sc,lk.shirt||'#888',lie); setP('head',i,yaw,0,0,0,18,0,X,y,Z,sc,lk.skin||'#e0b48e',lie); setP('hair',i,yaw,0,0,0,18.2,0,X,y,Z,sc,lk.cap||lk.hair||'#222',lie);
    setP('legL',i,yaw,sw,0,1.1,9.6,0,X,y,Z,sc,lk.pants||'#333',lie); setP('legR',i,yaw,-sw,0,-1.1,9.6,0,X,y,Z,sc,lk.pants||'#333',lie);
    const wave=q.wave&&Math.sin(t*8)>-.5; setP('armL',i,yaw,wave?PI*.9:-sw*.8,0,2.7,15.8,0,X,y,Z,sc,lk.shirt||'#888',lie); setP('armR',i,yaw,q.phone?2.4:sw*.8,0,-2.7,15.8,0,X,y,Z,sc,lk.shirt||'#888',lie); pedN++;
    if(q.umb&&!lie&&umbN<MAXP){ const m=IMP.umb; e4.set(0,0,0); q4.setFromEuler(e4); v4.set(X,21.5*sc/.86,Z); s4.setScalar(1); m4.compose(v4,q4,s4); m.setMatrixAt(umbN,m4); c4.set(lk.umb||'#c8202a'); m.setColorAt(umbN,c4); umbN++; } }
  /* ---------- 任務標記、導航箭頭、特效、雨、直升機、三角錐 ---------- */
  const zoneM=new T.MeshBasicMaterial({map:tex(canv(8,128,(c,w,h)=>{ const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(1,'rgba(255,255,255,.75)'); c.fillStyle=g; c.fillRect(0,0,w,h); })),color:0xffd23f,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});
  const zoneG=new T.CylinderGeometry(1,1,1,40,1,true).translate(0,.5,0),ringG=new T.RingGeometry(.86,1,40).rotateX(-PI/2),discG=new T.CircleGeometry(1,40).rotateX(-PI/2),coneG=new T.ConeGeometry(5,11,4).rotateX(PI),spotG=new T.PlaneGeometry(1,1).rotateX(-PI/2);
  const MK=[]; function mk(){ const g=new T.Group(); g.zone=new T.Mesh(zoneG,zoneM.clone()); g.ring=new T.Mesh(ringG,new T.MeshBasicMaterial({color:0xffd23f,transparent:true,opacity:.9,depthWrite:false})); g.disc=new T.Mesh(discG,new T.MeshBasicMaterial({color:0xffd23f,transparent:true,opacity:.22,depthWrite:false})); g.arrow=new T.Mesh(coneG,new T.MeshLambertMaterial({color:0xffd23f,emissive:0x664400})); g.spot=new T.Mesh(spotG,new T.MeshBasicMaterial({color:0xffd23f,transparent:true,opacity:.3,depthWrite:false})); g.add(g.zone,g.ring,g.disc,g.arrow,g.spot); scene.add(g); return g; }
  const chevG=(()=>{ const s=new T.Shape(); s.moveTo(9,0); s.lineTo(-3,-7); s.lineTo(-3,-3); s.lineTo(3,0); s.lineTo(-3,3); s.lineTo(-3,7); s.closePath(); return new T.ShapeGeometry(s).rotateX(-PI/2); })();
  const chev=new T.InstancedMesh(chevG,new T.MeshBasicMaterial({color:0x3ce878,transparent:true,opacity:.75,depthWrite:false}),60); chev.frustumCulled=false; chev.renderOrder=2; scene.add(chev);
  const fxM=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:softT,transparent:true,depthWrite:false}),400); fxM.instanceColor=new T.InstancedBufferAttribute(new Float32Array(1200),3); fxM.frustumCulled=false; scene.add(fxM);
  const coneM=new T.InstancedMesh((()=>{ const B=Bld(); mm.makeTranslation(0,5,0); B.geo(new T.ConeGeometry(3.4,10,10),mm,'#ff6a12'); mm.makeTranslation(0,5.4,0); B.geo(new T.CylinderGeometry(1.9,2.4,1.6,10),mm,'#ffffff'); B.box(-4,4,0,.8,-4,4,'#2a2a2a'); return B.build(); })(),plainM,120); coneM.frustumCulled=false; coneM.castShadow=true; scene.add(coneM);
  const RN=1600,rainG=new T.BufferGeometry(),rainP=new Float32Array(RN*6); rainG.setAttribute('position',new T.BufferAttribute(rainP,3)); const rainL=new T.LineSegments(rainG,new T.LineBasicMaterial({color:0xb8c8dc,transparent:true,opacity:.45})); rainL.frustumCulled=false; scene.add(rainL); const rainS=[]; for(let i=0;i<RN;i++) rainS.push([Math.random()*1400-700,Math.random()*500,Math.random()*1400-700]);
  const heli=new T.Group(); { const B=Bld(); B.box(-18,14,6,22,-7,7,'#f4f6f8'); B.box(6,18,8,20,-6.5,6.5,'#2a3644'); B.box(-48,-18,13,17,-1.6,1.6,'#f4f6f8'); B.box(-50,-44,13,26,-.8,.8,'#1d4fa8'); B.box(-16,12,4,6,-8,-7,'#333'); B.box(-16,12,4,6,7,8,'#333'); B.box(-18,14,10,13,-7.2,7.2,'#1d4fa8'); B.box(-2,2,22,26,-1.5,1.5,'#333'); const m=new T.Mesh(B.build(),shinyM); m.castShadow=true; heli.add(m); heli.rotor=new T.Mesh(new T.BoxGeometry(110,.6,4),new T.MeshLambertMaterial({color:0x222222})); heli.rotor.position.y=26.5; heli.add(heli.rotor);
    heli.spot=new T.SpotLight(0xf0f4ff,0,900,.22,.5,1); heli.add(heli.spot); scene.add(heli.spot.target); heli.beam=new T.Mesh(new T.ConeGeometry(70,1,24,1,true).translate(0,-.5,0),new T.MeshBasicMaterial({color:0xe8f0ff,transparent:true,opacity:.08,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide})); heli.add(heli.beam); heli.visible=false; scene.add(heli); }
  /* ---------- 鏡頭 ---------- */
  const cams=[0,1].map(()=>{ const c=new T.PerspectiveCamera(62,W/H,1,9000); c.rotation.order='YXZ'; return c; }),VS={};
  function blockedAt(x,z,h){ const i=Math.floor(x/P),j=Math.floor(z/P),b=Wd.blk(i,j); if(!b||x<b.x0||x>b.x1||z<b.y0||z>b.y1) return false; for(const bd of b.blds) if(x>bd.x0-3&&x<bd.x1+3&&z>bd.y0-3&&z<bd.y1+3&&(bd.h3||60)>h-6) return true; for(const tr of b.trees) if(Math.hypot(tr.x-x,tr.y-z)<tr.r+4&&h<26+tr.r*1.7) return true; return false; }
  let frame=0,lastNow=0,tSum=0,tN=0,lvlQ=0,lastSig=-1;
  const G={canvas:cv,get q(){ return Q; },
    render(st){ frame++; const now=performance.now()/1000,e=st.env; setSky(e); const t=st.t;
      // 光線、霧、夜燈
      const day=1-e.dark,wet=e.rain>.3;
      hemi.intensity=lerp(.78,.36,e.dark)*(1-e.rain*.22)+e.flash*1.6; hemi.color.set(e.dark>.5?0x8a90c8:e.dusk>.4?0xffd8c0:0xf0f6ff);
      sun.intensity=Math.max(0,day*(1-e.rain*.75)*(1-e.fog*.6)*.9); sun.color.set(e.dusk>.4?0xffb080:0xfff2dc); sun.castShadow=lvlQ<1&&sun.intensity>.25;
      const fn=e.fog>.05?lerp(700,90,e.fog):e.rain>.05?lerp(900,380,e.rain):e.dark>.5?620:900,ff=e.fog>.05?lerp(3000,760,e.fog):e.rain>.05?lerp(3400,1700,e.rain):e.dark>.5?2600:3400; scene.fog.near=fn; scene.fog.far=ff;
      const em=cl(e.dark*1.1+e.dusk*.35,0,1); for(const k in FM) FM[k].emissive.setScalar(em*.95); SMH.emissive.setScalar(em*.85); SMV.emissive.setScalar(em*.85); lampHeadM.emissive.set(em>.3?0xffe8b0:0x000000); lampPool.visible=em>.3; lampPool.material.opacity=em*.24;
      for(const g of [glowW,glowR]) g.opacity=em>.25?1:0;
      // 號誌顏色
      const tq=Math.floor(t*4); if(tq!==lastSig){ lastSig=tq; let i=0; for(const s of SIG){ const stt=lightOf(s.ix,s.iy,!!s.h,t); for(const kk of ['r','y','g']){ c4.set(LC[kk][stt===kk?0:1]); sigL.setColorAt(i++,c4); } } sigL.instanceColor.needsUpdate=true; }
      syncParked(st.parkVer||0);
      // 動態物件
      for(const k in POOL) POOL[k].used=0; pedN=0; umbN=0;
      const fx0=st.views[0].focus,near=(x,y,R0)=>{ for(const vw of st.views){ const f=vw.focus; if(Math.abs(x-f.x)<R0&&Math.abs(y-f.y)<R0) return true; } return false; };
      const sir=Math.sin(t*14)>0; sirenM[0].color.set(sir?0xffffff:0x401010); sirenM[1].color.set(sir?0x303060:0xffffff);
      for(const v of st.V){ if(!near(v.x,v.y,1500)) continue; const m=getVeh(v.ty); m.position.set(v.x,0,v.y); m.rotation.set(0,-v.a,v.ty==='scooter'||v.ty==='bike'?-(v.lean||0):0); m.bodyM.color.set(v.col||'#ccc'); if(v.hp<30) m.bodyM.color.multiplyScalar(.6);
        if(m.brakeM) m.brakeM.visible=!!v.brake; if(m.s0){ const on=!!v.siren||v.ty==='police'&&v.drv>=0; m.s0.visible=m.s1.visible=true; m.s0.material=on?sirenM[0]:lampM; m.s1.material=on?sirenM[1]:lampM; }
        if(m.rider){ const lk=v.lk||{}; m.rider.visible=v.role!=='parked'||v.drv>=0; m.shirtM.color.set(lk.shirt||'#3a5a8a'); m.helM.color.set(v.ty==='bike'?(lk.hair||'#222'):(lk.helm||'#e8e8e8')); m.skinM.color.set(lk.skin||'#e0b48e'); }
        if(m.gl){ const on=e.dark>.25&&v.role!=='parked'&&v.role!=='wreck'&&v.role!=='traffic_dead'; for(const g of m.gl) g.visible=on; } }
      for(const pk of st.parked){ if(!near(pk.x,pk.y,1100)) continue; const m=getVeh(pk.ty); m.position.set(pk.x,0,pk.y); m.rotation.set(0,-pk.a,0); m.bodyM.color.set(pk.col); if(m.brakeM) m.brakeM.visible=false; if(m.s0){ m.s0.material=lampM; m.s1.material=lampM; } if(m.gl) for(const g of m.gl) g.visible=false; if(m.rider) m.rider.visible=false; }
      for(const k in POOL){ const P2=POOL[k]; for(let i=P2.used;i<P2.list.length;i++) P2.list[i].visible=false; }
      for(const q of st.people){ if(near(q.x,q.y,1000)) ped(q,t); } for(const k in IMP){ IMP[k].count=k==='umb'?umbN:pedN; IMP[k].instanceMatrix.needsUpdate=true; IMP[k].instanceColor.needsUpdate=true; }
      // 標記
      let mi=0; for(const m of st.markers){ const g=MK[mi]||(MK[mi]=mk()); mi++; g.visible=true; g.position.set(m.x,0,m.y); const pu=.5+.5*Math.sin(t*4),red=m.red?0xff3a3a:m.green?0x3ce878:0xffd23f; for(const p of [g.ring,g.disc,g.arrow,g.spot]) p.material.color.setHex(red); g.zone.material.color.setHex(red);
        g.zone.visible=m.k==='zone'; g.disc.visible=m.k==='zone'; g.spot.visible=m.k==='spot'; g.ring.visible=m.k!=='spot'&&m.k!=='tag'; g.arrow.visible=m.k!=='spot';
        if(m.k==='zone'){ g.zone.scale.set(48,60+pu*8,48); g.ring.scale.setScalar(48+pu*14); g.disc.scale.setScalar(48); g.arrow.position.set(0,78+Math.sin(t*3)*5,0); g.arrow.rotation.y=t*2; }
        else if(m.k==='ring'){ g.ring.scale.setScalar(20+pu*4); g.ring.position.y=.8; g.arrow.position.set(0,34+Math.sin(t*4)*3,0); g.arrow.rotation.y=t*2; g.arrow.scale.setScalar(.7); }
        else if(m.k==='tag'){ g.arrow.position.set(0,(m.h||34)+Math.sin(t*4)*3,0); g.arrow.rotation.y=t*2; g.arrow.scale.setScalar(.9); }
        else if(m.k==='spot'){ g.spot.scale.set(m.l,1,m.w); g.spot.rotation.y=-m.a; g.spot.position.y=.7; g.spot.material.opacity=.25+(m.hold||0)*.35; } }
      for(;mi<MK.length;mi++) MK[mi].visible=false;
      // 導航：地上的綠色箭頭
      let ci=0; const rt=st.route||[]; for(let k=0;k<rt.length&&ci<60;k++){ const q=rt[k]; setM(chev,ci++,q[0],.8,q[1],-q[2],1.1); } chev.count=ci; chev.instanceMatrix.needsUpdate=true; chev.visible=ci>0;
      // 三角錐
      let cn=0; for(const q of st.cones){ if(cn>=120) break; setM(coneM,cn++,q[0],0,q[1],0,1); } coneM.count=cn; coneM.instanceMatrix.needsUpdate=true;
      // 煙、火花
      let fi=0; for(const f of st.FX){ if(fi>=400) break; if(!near(f.x,f.y,900)) continue; const a=f.l/f.L; let s=1,y=8,cc='#ffffff'; if(f.k==='smoke'){ s=f.s*(2-a)*2.2; y=8+(1-a)*14; cc='rgb('+f.col+')'; } else if(f.k==='spark'){ s=2.4; y=6; cc='#ffd870'; } else if(f.k==='flame'){ s=f.s*a*2+2; y=6; cc='#6ab8ff'; } else if(f.k==='deb'){ s=2; y=3; cc=f.col; } else if(f.k==='note'){ s=4; y=30; cc='#ffe080'; } else continue;
        IV.set(f.x,y,f.y); IS.set(s,s,s); IM4.compose(IV,cams[0].quaternion,IS); fxM.setMatrixAt(fi,IM4); c4.set(cc); if(f.k==='smoke') c4.multiplyScalar(.55+a*.4); fxM.setColorAt(fi,c4); fi++; } fxM.count=fi; fxM.instanceMatrix.needsUpdate=true; fxM.instanceColor.needsUpdate=true;
      // 雨
      rainL.visible=e.rain>.05; if(rainL.visible){ const n=Math.floor(RN*cl(e.rain,0,1)),fp=fx0; for(let i=0;i<RN;i++){ const d=rainS[i]; d[1]-=(e.storm?1300:950)*(1/60); if(d[1]<0){ d[1]=500; d[0]=Math.random()*1400-700; d[2]=Math.random()*1400-700; } const x=fp.x+d[0],z=fp.y+d[2],wx=e.storm?-14:-3; if(i<n){ rainP[i*6]=x; rainP[i*6+1]=d[1]; rainP[i*6+2]=z; rainP[i*6+3]=x+wx; rainP[i*6+4]=d[1]+16; rainP[i*6+5]=z; } else { rainP[i*6+1]=rainP[i*6+4]=-50; } } rainG.attributes.position.needsUpdate=true; }
      // 直升機
      const hl=st.heli; heli.visible=!!hl; if(hl){ heli.position.set(hl.x,hl.h,hl.y); heli.rotation.set(Math.sin(t*.7)*.05,-hl.a,.08); heli.rotor.rotation.y=t*40; const night=e.dark>.4; heli.spot.intensity=night?2.4:0; heli.beam.visible=night; heli.beam.scale.set(1,hl.h-2,1); heli.beam.position.set(0,-2,0); heli.spot.target.position.set(hl.tx,0,hl.ty); heli.spot.position.set(0,-4,0); }
      // 地面
      groundAround(fx0.x,fx0.y,wet,frame<3?40:2); if(st.views[1]) groundAround(st.views[1].focus.x,st.views[1].focus.y,wet,2);
      // 每個畫面各畫一次
      r.setScissorTest(false); r.setViewport(0,0,W*Q,H*Q); r.clear();
      st.views.forEach((vw,vi)=>{ const f=vw.focus,cam=cams[vi],key=vw.key; let V=VS[key]; const dt=V?cl(now-V.now,0,.1):0; if(!V) V=VS[key]={yaw:f.a||0,now,x:f.x,y:f.y,d:110,fov:62}; V.now=now;
        if(vw.mode==='high'){ const tx=f.x,tz=f.y; V.x+=(tx-V.x)*Math.min(1,dt*5||1); V.y+=(tz-V.y)*Math.min(1,dt*5||1); cam.position.set(V.x,340,V.y+250); cam.lookAt(V.x,0,V.y-20); cam.fov=55; }
        else { const sp=f.sp||0,car=!!f.car; let want=f.a||0; if(car&&f.rev) want=f.a; const dy=Math.atan2(Math.sin(want-V.yaw),Math.cos(want-V.yaw)); V.yaw+=dy*Math.min(1,dt*(car?(sp>40?3.2:1.6):4)||1);
          let dist=car?(f.big?150:100)+Math.min(60,sp*.07):54,hgt=car?(f.big?60:44)+Math.min(16,sp*.02):26; const ca=Math.cos(V.yaw),sa=Math.sin(V.yaw);
          for(let k=1;k<=6;k++){ const dd=dist*k/6,px=f.x-ca*dd,pz=f.y-sa*dd; if(blockedAt(px,pz,hgt*k/6+6)){ dist=Math.max(24,dd-10); break; } }
          V.d+=(dist-V.d)*Math.min(1,dt*(dist<V.d?10:2)||1); const cx=f.x-ca*V.d,cz=f.y-sa*V.d; cam.position.set(cx,hgt*(.55+.45*V.d/Math.max(dist,1)),cz); cam.lookAt(f.x+ca*(car?40:20),car?11:13,f.y+sa*(car?40:20));
          V.fov+=((car?60+Math.min(16,sp*.03):58)-V.fov)*Math.min(1,dt*3||1); cam.fov=V.fov; if(st.shake) { cam.position.x+=(Math.random()-.5)*st.shake*.8; cam.position.y+=(Math.random()-.5)*st.shake*.6; } }
        cam.aspect=vw.vw/H; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
        sky.position.copy(cam.position); mtn.position.set(cam.position.x,360,cam.position.z);
        if(vi===0){ sun.target.position.set(f.x,0,f.y); sun.position.set(f.x-320,560,f.y-240); }
        const hd=heads[vi]; if(f.car&&e.dark>.25){ const a=f.a||0; hd.intensity=1.5; hd.position.set(f.x+Math.cos(a)*20,12,f.y+Math.sin(a)*20); hd.target.position.set(f.x+Math.cos(a)*220,0,f.y+Math.sin(a)*220); } else hd.intensity=0;
        r.setViewport(vw.vx*Q,0,vw.vw*Q,H*Q); r.setScissor(vw.vx*Q,0,vw.vw*Q,H*Q); r.setScissorTest(true); r.render(scene,cam); r.setScissorTest(false); });
      // 太慢就自動降畫質
      if(lastNow){ const d=now-lastNow; if(d<.3){ tSum+=d; tN++; } } lastNow=now; if(tN>=90){ const av=tSum/tN; tSum=0; tN=0; if(av>.034&&lvlQ<2){ lvlQ++; if(lvlQ===1){ r.shadowMap.enabled=false; sun.castShadow=false; scene.traverse(m=>{ if(m.material) m.material.needsUpdate=true; }); } else { Q=1; r.setSize(W*Q,H*Q,false); } } } },
    yaw(key){ return VS[key]?VS[key].yaw:0; },
    project(x,y,h,vi){ const cam=cams[vi||0],p=new T.Vector3(x,h,y).project(cam); if(p.z>1||p.z<-1) return null; return [(p.x+1)/2,(1-p.y)/2,p.z]; },
    destroy(){ scene.traverse(m=>{ if(m.geometry&&m.geometry.dispose) m.geometry.dispose(); if(m.material){ const ms=Array.isArray(m.material)?m.material:[m.material]; for(const a of ms){ for(const k of ['map','emissiveMap']) if(a[k]&&a[k].dispose) a[k].dispose(); a.dispose(); } } }); r.dispose(); try{ r.forceContextLoss(); }catch(e){} } };
  return G; }
window.__CHASE3D=make;
})();
