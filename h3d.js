// 3D 寫實比例的人物（three.js）：球類遊戲共用。單位是公尺，身高約 1.75，腳底在 y=0，面向 +Z。
// build() 回傳 {root,J}：J 是各關節的群組，轉動關節就能擺姿勢；pose(J,P) 用 {關節名:[x,y,z]} 一次設定。
(function(){
'use strict';
function build(T,o){ o=o||{}; const PI=Math.PI;
  const mat=(c,sh)=>new T.MeshPhongMaterial({color:new T.Color(c),shininess:sh==null?18:sh,specular:sh>40?0x555555:0x111111});
  const skin=mat(o.skin||'#e0ac80',22),shirt=mat(o.shirt||'#ffffff',10),pants=mat(o.pants||'#2f3a5a',8),shoe=mat(o.shoes||'#f4f4f4',50),hair=mat(o.hair||'#2a1a10',30),sock=mat(o.socks||'#ffffff',5);
  const G=()=>new T.Group(),add=(p,geo,m,x,y,z,sx,sy,sz)=>{ const me=new T.Mesh(geo,m); me.position.set(x||0,y||0,z||0); if(sx) me.scale.set(sx,sy,sz); me.castShadow=true; p.add(me); return me; };
  const cyl=(rt,rb,h,seg)=>{ const g=new T.CylinderGeometry(rt,rb,h,seg||14); g.translate(0,-h/2,0); return g; }; // 從關節往下長
  const sph=(r)=>new T.SphereGeometry(r,16,12);
  const root=G(),J={root};
  const pelvis=G(); pelvis.position.y=.97; root.add(pelvis); J.pelvis=pelvis;
  add(pelvis,sph(.16),pants,0,-.02,0,1.05,.7,.75); // 臀部
  const spine=G(); pelvis.add(spine); J.spine=spine;
  add(spine,cyl(.15,.155,.26,16),o.tuck?pants:shirt,0,.26,0).position.y=.26; // 腹部（從胸口往下）
  const chest=G(); chest.position.y=.26; spine.add(chest); J.chest=chest;
  add(chest,sph(.2),shirt,0,.14,0,1,.95,.68); add(chest,cyl(.155,.15,.2,16),shirt,0,.06,0);
  if(o.number!=null){ const cv=document.createElement('canvas'); cv.width=cv.height=64; const c=cv.getContext('2d'); c.fillStyle='rgba(0,0,0,0)'; c.fillRect(0,0,64,64); c.font='900 40px Arial'; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle=o.numCol||'#ffffff'; c.fillText(String(o.number),32,34);
    const nm=new T.MeshBasicMaterial({map:new T.CanvasTexture(cv),transparent:true}); for(const s of [1,-1]){ const p=new T.Mesh(new T.PlaneGeometry(.2,.2),nm); p.position.set(0,.1,s*.142); if(s<0) p.rotation.y=PI; chest.add(p); } }
  const neck=G(); neck.position.y=.33; chest.add(neck); J.neck=neck; add(neck,cyl(.055,.06,.1),skin,0,.08,0).position.y=.08;
  const head=G(); head.position.y=.1; neck.add(head); J.head=head;
  add(head,sph(.105),skin,0,.1,.01,1,1.15,1.05); // 頭
  add(head,sph(.03),skin,0,.09,.115,.7,.9,.8); // 鼻
  for(const s of [-1,1]){ add(head,sph(.025),skin,s*.1,.1,0,.5,1,.8); add(head,sph(.012),mat('#2a1a1a',60),s*.038,.125,.098); } // 耳、眼
  add(head,sph(.112),hair,0,.135,-.01,1.02,o.longHair?1.05:.85,1.06); if(o.longHair) add(head,cyl(.08,.1,.22),hair,0,.12,-.07);
  if(o.cap){ const cm=mat(o.cap,20); add(head,new T.SphereGeometry(.118,16,8,0,PI*2,0,PI/2),cm,0,.14,0); add(head,new T.CylinderGeometry(.1,.1,.012,16,1,false,0,PI),cm,0,.14,.08).rotation.y=-PI/2; }
  if(o.helmet){ const hm=mat(o.helmet,80); add(head,new T.SphereGeometry(.13,18,10,0,PI*2,0,PI*.58),hm,0,.12,0); for(const s of [-1,1]) add(head,sph(.045),hm,s*.12,.08,-.01,.6,1,1); }
  const arm=s=>{ const sh=G(); sh.position.set(s*.2,.24,0); chest.add(sh); const am=o.sleeveless?skin:shirt; add(sh,sph(.065),am,0,0,0);
    add(sh,cyl(.055,.045,.29),am,0,0,0); if(o.shortSleeve!==false){ sh.children[1].scale.y=.45; add(sh,cyl(.046,.042,.17),skin,0,-.12,0); }
    const el=G(); el.position.y=-.29; sh.add(el); add(el,sph(.044),skin,0,0,0); add(el,cyl(.042,.032,.25),o.longSleeve?shirt:skin,0,0,0);
    const wr=G(); wr.position.y=-.25; el.add(wr); add(wr,sph(.04),o.gloves?mat(o.gloves):skin,0,-.05,0,.9,1.3,.6); return {sh,el,wr}; };
  const L=arm(1),R=arm(-1); J.shL=L.sh; J.elL=L.el; J.hdL=L.wr; J.shR=R.sh; J.elR=R.el; J.hdR=R.wr;
  const leg=s=>{ const hp=G(); hp.position.set(s*.095,-.04,0); pelvis.add(hp); add(hp,cyl(.085,.065,.44),o.shorts?pants:pants,0,0,0); if(o.shorts){ hp.children[0].scale.y=.5; add(hp,cyl(.062,.055,.22),skin,0,-.22,0); }
    const kn=G(); kn.position.y=-.44; hp.add(kn); add(kn,sph(.058),o.shorts?skin:pants,0,0,0); add(kn,cyl(.058,.042,.43),o.shorts?(o.socksHigh?sock:skin):pants,0,0,0);
    const an=G(); an.position.y=-.43; kn.add(an); add(an,new T.BoxGeometry(.1,.08,.26),shoe,0,-.035,.06); add(an,sph(.05),shoe,0,-.03,.17,1,.7,.9); return {hp,kn,an}; };
  const LL=leg(1),RL=leg(-1); J.hipL=LL.hp; J.knL=LL.kn; J.anL=LL.an; J.hipR=RL.hp; J.knR=RL.kn; J.anR=RL.an;
  root.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=false; } });
  return {root,J}; }
function pose(J,P){ for(const k in J){ if(k==='root') continue; const v=P[k]; if(v) J[k].rotation.set(v[0]||0,v[1]||0,v[2]||0); else J[k].rotation.set(0,0,0); } if(P.y!=null) J.pelvis.position.y=.97+P.y; }
// 兩組姿勢之間內插
function mix(A,B,k){ const o={}; for(const n of new Set([...Object.keys(A),...Object.keys(B)])){ if(n==='y'){ o.y=(A.y||0)+((B.y||0)-(A.y||0))*k; continue; } const a=A[n]||[0,0,0],b=B[n]||[0,0,0]; o[n]=[a[0]+(b[0]-a[0])*k,(a[1]||0)+((b[1]||0)-(a[1]||0))*k,(a[2]||0)+((b[2]||0)-(a[2]||0))*k]; } return o; }
window.__H3D={build,pose,mix};
})();
