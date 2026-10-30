// 果嶺推桿王的 3D 畫面（three.js）：物理還在 golf.js 的 2D 座標上算，這裡只負責畫。
// 一格（44 像素）＝1 公尺：世界 X=(x-OX)/CS-8、Z=(y-OY)/CS-5。
(function(){
'use strict';
function make(T,o){ const {W,H,CS,GW,GH,OX,OY,BR,HR,TT,hash,drawStatic,ci}=o,PI=Math.PI;
  const X=x=>(x-OX)/CS-GW/2,Z=y=>(y-OY)/CS-GH/2,BRw=BR/CS;
  const cv=document.createElement('canvas'),r=new T.WebGLRenderer({canvas:cv,antialias:true}); r.setPixelRatio(1); r.setSize(W*2,H*2,false); r.shadowMap.enabled=true; r.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene(),col=c=>new T.Color(c),space=TT.haz==='void',night=space||TT.haz==='lava';
  scene.background=col(space?'#05060f':TT.haz==='lava'?'#1a0e10':TT.sky||'#a8d4f0'); scene.fog=new T.Fog(scene.background,26,60);
  const ph=(c,sh,m)=>new T.MeshPhongMaterial(Object.assign({color:col(c),shininess:sh==null?20:sh,specular:sh>50?0x666666:0x1a1a1a},m||{}));
  const add=(geo,mat,x,y,z,p)=>{ const m=new T.Mesh(geo,mat); m.position.set(x||0,y||0,z||0); (p||scene).add(m); m.castShadow=true; m.receiveShadow=true; return m; };
  scene.add(new T.HemisphereLight(night?0x9aa0ff:0xfff8e8,night?0x201820:0x4a6a3a,night?.55:.7));
  const sun=new T.DirectionalLight(night?0xd8d8ff:0xfff2d8,night?.55:.75); sun.position.set(-6,14,8); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-11,right:11,top:8,bottom:-8,near:1,far:40}); sun.shadow.bias=-.0006; scene.add(sun);
  if(TT.haz==='lava'){ const lv=new T.PointLight(0xff6a2a,.6,20); lv.position.set(0,2,0); scene.add(lv); }
  /* 地面：原本畫好的球場圖（不含欄杆、裝飾）當貼圖，外面再鋪一大片同色地 */
  let ground=null; const gcv=document.createElement('canvas'); gcv.width=W*2; gcv.height=H*2; const gtx=new T.CanvasTexture(gcv); gtx.anisotropy=8;
  const gm=new T.MeshLambertMaterial({map:gtx}),gw=W/CS,gh=H/CS; ground=add(new T.PlaneGeometry(gw,gh),gm,X(W/2),0,Z(H/2)); ground.rotation.x=-PI/2; ground.castShadow=false;
  const outer=add(new T.PlaneGeometry(120,120),new T.MeshLambertMaterial({color:col(TT.out)}),0,-.01,0); outer.rotation.x=-PI/2; outer.castShadow=false;
  /* 每一洞要重建的東西都放在 holeG */
  let holeG=null,O=null,dyn=null,waterCv=null,waterTx=null,waterM=null;
  const railM=ph(TT.railC,TT.rail==='metal'?90:15),capM=ph(new T.Color(TT.railC).multiplyScalar(1.15).getStyle(),20);
  const decoMesh=(k,x,z,rr)=>{ const g=new T.Group(); g.position.set(x,0,z); holeG.add(g);
    if(k==='tree'||k==='rose'||k==='fern'){ const tr=add(new T.CylinderGeometry(.06,.09,.6,8),ph('#6a4a2a'),0,.3,0,g); const leaf=ph(k==='fern'?'#2a6a28':'#3f8a32'); for(let i=0;i<5;i++) add(new T.SphereGeometry(.28+hash(i+x)*.08,10,8),leaf,Math.cos(i*1.26)*.18,.75+(i%2)*.15,Math.sin(i*1.26)*.18,g); if(k==='rose') for(let i=0;i<6;i++) add(new T.SphereGeometry(.05,6,5),ph(['#e8304a','#ff7eb6','#fff'][i%3]),Math.cos(i)*.3,.85+Math.sin(i*2)*.15,Math.sin(i)*.3,g); }
    else if(k==='pine'){ add(new T.CylinderGeometry(.05,.07,.3,8),ph('#5a3a22'),0,.15,0,g); for(let i=0;i<3;i++) add(new T.ConeGeometry(.42-i*.1,.5,10),ph(i%2?'#2f5a3a':'#3a6a44'),0,.45+i*.3,0,g); add(new T.ConeGeometry(.12,.18,10),ph('#ffffff'),0,1.18,0,g); }
    else if(k==='cactus'){ const cm=ph('#4a8a3a'); add(new T.CylinderGeometry(.1,.11,.8,10),cm,0,.4,0,g); for(const s of [-1,1]){ const a=add(new T.CylinderGeometry(.06,.06,.3,8),cm,s*.17,.5+s*.08,0,g); add(new T.CylinderGeometry(.06,.06,.18,8),cm,s*.1,.4+s*.08,0,g).rotation.z=PI/2; } }
    else if(k==='rake'||k==='rockl'){ const rk=add(new T.DodecahedronGeometry(.28,0),ph(k==='rockl'?'#3a3236':'#8a8a84'),0,.12,0,g); rk.scale.set(1.2,.6,1); rk.rotation.y=rr*6; if(k==='rockl'){ const gl=new T.PointLight(0xff5a1a,.25,1.5); gl.position.y=.2; g.add(gl); } }
    else if(k==='vent'){ add(new T.BoxGeometry(.5,.35,.4),ph('#a8b0bc',60),0,.18,0,g); }
    else if(k==='plank'){ add(new T.BoxGeometry(.6,.05,.6),ph('#8a6038'),0,.02,0,g); }
    else if(k==='star'){ add(new T.SphereGeometry(.06,6,5),new T.MeshBasicMaterial({color:0xcfe0ff}),0,.8+rr*2,0,g); } };
  function buildHole(oo){ O=oo; if(holeG){ scene.remove(holeG); holeG.traverse(m=>{ if(m.geometry) m.geometry.dispose(); }); } holeG=new T.Group(); scene.add(holeG);
    const gc=gcv.getContext('2d'); gc.setTransform(2,0,0,2,0,0); drawStatic(gc,oo,TT,ci,true); gtx.needsUpdate=true;
    const solid=(x,y)=>x<0||y<0||x>=GW||y>=GH||oo.g[y][x]==='#',RT=.16,RHh=.16;
    for(let y=0;y<GH;y++) for(let x=0;x<GW;x++){ if(oo.g[y][x]==='#') continue; const cx=x-GW/2,cz=y-GH/2;
      if(solid(x,y-1)) add(new T.BoxGeometry(1+RT,RHh,RT),railM,cx+.5,RHh/2,cz,holeG); if(solid(x,y+1)) add(new T.BoxGeometry(1+RT,RHh,RT),railM,cx+.5,RHh/2,cz+1,holeG);
      if(solid(x-1,y)) add(new T.BoxGeometry(RT,RHh,1+RT),railM,cx,RHh/2,cz+.5,holeG); if(solid(x+1,y)) add(new T.BoxGeometry(RT,RHh,1+RT),railM,cx+1,RHh/2,cz+.5,holeG); }
    for(let y=1;y<GH-1;y++) for(let x=1;x<GW-1;x++){ if(oo.g[y][x]!=='#') continue; let n=0; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if(!solid(x+dx,y+dy)) n++; if(n>=2){ add(new T.BoxGeometry(.96,.32,.96),railM,x-GW/2+.5,.16,y-GH/2+.5,holeG); add(new T.BoxGeometry(.98,.04,.98),capM,x-GW/2+.5,.34,y-GH/2+.5,holeG); } }
    for(let y=0;y<GH;y++) for(let x=0;x<GW;x++){ if(oo.g[y][x]!=='#') continue; let near=false; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if(!solid(x+dx,y+dy)) near=true; if(near) continue; const rr=hash(x*13+y*29+ci*5); if(rr>.42) continue; decoMesh(TT.deco,X(OX+x*CS+CS/2+(hash(x+y*3)-.5)*14),Z(OY+y*CS+CS/2+(hash(x*5+y)-.5)*14),rr); }
    for(const [px,py] of oo.bump){ const b=add(new T.CylinderGeometry(12/CS,13/CS,.28,20),ph('#c8ccd6',100),X(px),.14,Z(py),holeG); add(new T.CylinderGeometry(5/CS,5/CS,.3,14),ph('#e8402a',60),X(px),.16,Z(py),holeG); }
    for(const k of 'ABCD'){ const p=oo.tun[k]; if(!p) continue; const ring=add(new T.TorusGeometry(13/CS,4/CS,8,20),ph(TT.rail==='metal'?'#9aa4b0':'#7a7468'),X(p[0]),.03,Z(p[1]),holeG); ring.rotation.x=PI/2; }
    dyn={mills:oo.mill.map(m=>{ const g=new T.Group(); g.position.set(X(m.x),0,Z(m.y)); holeG.add(g); add(new T.CylinderGeometry(9/CS,10/CS,.5,14),ph('#b05a3a'),0,.25,0,g); add(new T.ConeGeometry(12/CS,.3,14),ph('#7a3a2a'),0,.65,0,g);
        const rot=new T.Group(); rot.position.y=.12; g.add(rot); for(let k=0;k<4;k++){ const b=add(new T.BoxGeometry(30/CS,.14,5/CS),ph('#e8dcc0'),15/CS+5/CS,0,0,rot); b.position.x=(5+15)/CS; const p=new T.Group(); p.rotation.y=-k*PI/2; p.add(b); rot.add(p); } return {m,rot}; }),
      gates:oo.gate.map(gt=>{ const b=add(new T.BoxGeometry((CS-6)/CS,.3,(CS-6)/CS),railM,0,.15,0,holeG); add(new T.BoxGeometry((CS-6)/CS,.05,.12),ph('#ffd23f'),0,.17,0,b).position.set(0,.16,0); return {gt,b}; })};
    // 球洞旗
    const fl=new T.Group(); fl.position.set(X(oo.hole[0]),0,Z(oo.hole[1])); holeG.add(fl); add(new T.CylinderGeometry(.015,.015,1.3,6),ph('#eeeeee',80),0,.65,0,fl);
    const cloth=new T.Mesh(new T.PlaneGeometry(.5,.32,8,1),new T.MeshLambertMaterial({color:0xe8231c,side:T.DoubleSide})); cloth.position.set(.25,1.12,0); cloth.castShadow=true; fl.add(cloth); dyn.flag=fl; dyn.cloth=cloth;
    // 會動的水面（有水的洞才做）
    const hasW=oo.g.some(rw=>rw.includes('W')); if(hasW){ waterCv=document.createElement('canvas'); waterCv.width=W; waterCv.height=H; waterTx=new T.CanvasTexture(waterCv); waterM=new T.MeshBasicMaterial({map:waterTx,transparent:true,depthWrite:false}); const wp=add(new T.PlaneGeometry(gw,gh),waterM,X(W/2),.01,Z(H/2),holeG); wp.rotation.x=-PI/2; wp.castShadow=wp.receiveShadow=false; } else waterCv=null; }
  /* 球員：3D 寫實比例的人，拿推桿 */
  const H3=window.__H3D,golfers={};
  function golfer(i,L){ if(golfers[i]) return golfers[i]; const h=H3.build(T,{skin:L.skin,shirt:L.shirt,pants:L.pants,cap:L.cap,hair:L.hair,shoes:'#f4f4f4'}); scene.add(h.root);
    const club=new T.Group(); h.J.hdL.add(club); club.position.y=-.06; const sh=new T.Mesh(new T.CylinderGeometry(.009,.009,.86,6),ph('#c8ccd4',90)); sh.position.y=-.43; club.add(sh); const grip=new T.Mesh(new T.CylinderGeometry(.016,.014,.22,8),ph('#1e1e24')); grip.position.y=-.06; club.add(grip);
    const head=new T.Mesh(new T.BoxGeometry(.12,.035,.04),ph('#e0e4ea',120)); head.position.set(-.03,-.87,.0); club.add(head); club.rotation.set(-.2,0,-.18); club.traverse(m=>{ if(m.isMesh) m.castShadow=true; });
    return golfers[i]=h; }
  const ballGeo=new T.SphereGeometry(BRw,20,14),balls={};
  const ballOf=(i,c)=>{ if(balls[i]) return balls[i]; const m=add(ballGeo,ph(c,110)); return balls[i]=m; };
  const aimG=new T.BufferGeometry(),aim=new T.Line(aimG,new T.LineDashedMaterial({color:0xffffff,dashSize:.12,gapSize:.12,transparent:true,opacity:.9})); scene.add(aim);
  const arrow=add(new T.ConeGeometry(.08,.2,10),new T.MeshBasicMaterial({color:0xffffff})); arrow.castShadow=false;
  const cam=new T.PerspectiveCamera(44,W/H,.05,120),cp=new T.Vector3(),cl=new T.Vector3(),tp=new T.Vector3(),tl=new T.Vector3(),tmp=new T.Vector3(),ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),0);
  let view='top',first=true,lastO=null;
  return {canvas:cv,get view(){ return view; },toggle(){ view=view==='top'?'ball':'top'; },
    toTable(sx,sy){ ray.setFromCamera(new T.Vector2(sx/W*2-1,-(sy/H)*2+1),cam); const p=ray.ray.intersectPlane(plane,tmp); return p?[(p.x+GW/2)*CS+OX,(p.z+GH/2)*CS+OY]:[sx,sy]; },
    toScreen(x,y,h){ tmp.set(X(x),h||0,Z(y)).project(cam); return [(tmp.x+1)/2*W,(1-tmp.y)/2*H]; },
    render(s){ if(s.o!==lastO){ lastO=s.o; buildHole(s.o); }
      const t=s.t; if(dyn){ for(const d of dyn.mills) d.rot.rotation.y=-o.millAng(d.m,s.tt); for(const d of dyn.gates){ d.b.position.set(X(OX+d.gt.gx*CS+CS/2),.15,Z(o.gateY(d.gt,s.tt)+CS/2)); }
        dyn.flag.position.y=Math.min(1.2,s.lift/40); const pa=dyn.cloth.geometry.attributes.position; for(let i=0;i<pa.count;i++){ const u=(pa.getX(i)+.25)/.5; pa.setZ(i,Math.sin(t*5-u*4)*.04*u); } pa.needsUpdate=true; }
      if(waterCv){ const c=waterCv.getContext('2d'); c.clearRect(0,0,W,H); o.drawDynamic(c,O,TT,s.tt,true); waterTx.needsUpdate=true; }
      // 球
      const seen=new Set(); s.balls.forEach(b=>{ const m=ballOf(b.i,b.col); seen.add(b.i); m.position.set(X(b.x),BRw,Z(b.y)); m.material.transparent=b.alpha<1; m.material.opacity=b.alpha; m.visible=true; });
      for(const k in balls) if(!seen.has(+k)) balls[k].visible=false;
      // 球員
      for(const k in golfers) golfers[k].root.visible=false;
      if(s.g){ const G=s.g,h=golfer(G.i,G.L),n=[Math.cos(G.ang),Math.sin(G.ang)],p=[-n[1],n[0]],fx=G.x-p[0]*22,fy=G.y-p[1]*22;
        h.root.visible=true; h.root.position.set(X(fx),0,Z(fy)); h.root.rotation.y=Math.atan2(p[0],p[1]);
        const sw=G.follow?.35:-G.back*.55; H3.pose(h.J,{y:-.05,spine:[.62,0,0],neck:[.25,0,0],head:[.15,0,0],hipL:[-.2,0,.05],hipR:[-.2,0,-.05],knL:[.35,0,0],knR:[.35,0,0],anL:[-.15,0,0],anR:[-.15,0,0],
          shL:[-.55,0,-.32+sw],shR:[-.5,0,.32+sw],elL:[-.15,0,0],elR:[-.25,0,0],hdL:[0,0,0],hdR:[0,0,0]}); }
      // 瞄準
      aim.visible=arrow.visible=!!s.aim; if(s.aim){ const A=s.aim,ex=A.x+Math.cos(A.ang)*A.len,ey=A.y+Math.sin(A.ang)*A.len; aimG.setFromPoints([new T.Vector3(X(A.x),.03,Z(A.y)),new T.Vector3(X(ex),.03,Z(ey))]); aim.computeLineDistances(); arrow.position.set(X(ex),.05,Z(ey)); arrow.rotation.set(PI/2,0,-Math.atan2(Math.sin(A.ang),Math.cos(A.ang))+PI/2); arrow.rotation.order='YXZ'; arrow.rotation.set(PI/2,-A.ang+PI/2,0); }
      // 鏡頭：俯瞰整洞，或站在球後面
      const fb=s.focus; if(view==='ball'&&fb){ const dx=Math.cos(fb.ang),dz=Math.sin(fb.ang); tp.set(X(fb.x)-dx*3.2,2.2,Z(fb.y)-dz*3.2); tl.set(X(fb.x)+dx*2.5,0,Z(fb.y)+dz*2.5); }
      else { tp.set(0,10.5,8.6); tl.set(0,0,.6); }
      if(first){ cp.copy(tp); cl.copy(tl); first=false; } else { cp.lerp(tp,.1); cl.lerp(tl,.1); }
      cam.position.copy(cp); cam.lookAt(cl); r.render(scene,cam); },
    destroy(){ scene.traverse(m=>{ if(m.geometry) m.geometry.dispose(); if(m.material){ if(m.material.map) m.material.map.dispose(); m.material.dispose(); } }); r.dispose(); try{ r.forceContextLoss(); }catch(e){} } }; }
window.__GOLF3D=make;
})();
