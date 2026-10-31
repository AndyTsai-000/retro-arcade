// 3D 寫實比例的人物（three.js）：球類遊戲共用。單位是公尺，身高約 1.75，腳底在 y=0，面向 +Z。
// build() 回傳 {root,J}：J 是各關節的群組，轉動關節就能擺姿勢；pose(J,P) 用 {關節名:[x,y,z]} 一次設定。
// 四肢用旋轉體做出肌肉的粗細變化（大腿、小腿肚、前臂），不是直筒圓柱。
(function(){
'use strict';
function build(T,o){ o=o||{}; const PI=Math.PI,W=o.female?.86:1;
  const mat=(c,sh)=>new T.MeshPhongMaterial({color:new T.Color(c),shininess:sh==null?18:sh,specular:sh>40?0x555555:0x111111});
  const skin=mat(o.skin||'#e0ac80',22),shirt=mat(o.shirt||'#ffffff',10),pants=mat(o.pants||'#2f3a5a',8),shoe=mat(o.shoes||'#f4f4f4',50),hair=mat(o.hair||'#2a1a10',30),sock=mat(o.socks||'#ffffff',5),sole=mat('#e8e8e4',10),dark=mat('#2a1a1a',60);
  const G=()=>new T.Group(),add=(p,geo,m,x,y,z,sx,sy,sz)=>{ const me=new T.Mesh(geo,m); me.position.set(x||0,y||0,z||0); if(sx) me.scale.set(sx,sy,sz); me.castShadow=true; p.add(me); return me; };
  // 旋轉體：pts＝[[半徑,y],...]，由上往下
  const lathe=(pts,seg)=>new T.LatheGeometry(pts.slice().sort((a,b)=>a[1]-b[1]).map(q=>new T.Vector2(Math.max(.001,q[0]),q[1])),seg||12),sph=r=>new T.SphereGeometry(r,14,10);
  const root=G(),J={root};
  const pelvis=G(); pelvis.position.y=.97; root.add(pelvis); J.pelvis=pelvis;
  add(pelvis,sph(.16),pants,0,-.02,0,1.06*(o.female?.98:1),.72,.76); // 臀部
  if(o.belt){ const b=add(pelvis,new T.CylinderGeometry(.152*W,.156*W,.035,16),mat(o.belt,30),0,.085,0); b.scale.z=.76; }
  const spine=G(); pelvis.add(spine); J.spine=spine;
  const ab=add(spine,lathe(o.female?[[.11,.28],[.112,.2],[.128,.08],[.145,0]]:[[.142,.28],[.136,.2],[.138,.08],[.15,0]],14),o.tuck?pants:shirt); ab.scale.z=.74; // 腹部
  const chest=G(); chest.position.y=.26; spine.add(chest); J.chest=chest;
  const ch=add(chest,lathe(o.female?[[.03,.335],[.085,.325],[.135,.29],[.15,.2],[.138,.1],[.112,.02]]:[[.03,.34],[.1,.33],[.178,.29],[.2,.2],[.178,.1],[.142,.02]],16),shirt); ch.scale.z=.7; // 胸口、肩線
  if(o.trim){ const tr=add(chest,new T.TorusGeometry(.066,.012,6,16),mat(o.trim,10),0,.326,0); tr.rotation.x=PI/2; }
  if(o.number!=null){ const cv=document.createElement('canvas'); cv.width=cv.height=64; const c=cv.getContext('2d'); c.font='900 40px Arial'; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle=o.numCol||'#ffffff'; c.fillText(String(o.number),32,34);
    const nm=new T.MeshBasicMaterial({map:new T.CanvasTexture(cv),transparent:true}); for(const s of [1,-1]){ const p=new T.Mesh(new T.PlaneGeometry(.2,.2),nm); p.position.set(0,.16,s*.146); if(s<0) p.rotation.y=PI; chest.add(p); } }
  const neck=G(); neck.position.y=.33; chest.add(neck); J.neck=neck; add(neck,new T.CylinderGeometry(o.female?.042:.054,o.female?.05:.064,.1,10),skin,0,.04,0);
  const head=G(); head.position.y=.1; neck.add(head); J.head=head;
  // 頭：前 7 個子物件的順序別動（籃球用 children[6] 改髮型）
  add(head,sph(.1),skin,0,.1,.008,.94,1.18,1.04); // 0 頭
  add(head,sph(.024),skin,0,.095,.112,.62,.95,.9); // 1 鼻子
  for(const s of [-1,1]){ add(head,sph(.024),skin,s*.095,.1,0,.42,.95,.72); add(head,sph(.0095),dark,s*.036,.126,.1); } // 2～5 耳朵、瞳孔
  add(head,sph(.108),hair,0,.135,-.012,1,o.longHair?1.05:.84,1.06); // 6 頭髮
  // 臉：眼白、眉毛、嘴巴、下巴
  for(const s of [-1,1]){ add(head,sph(.016),mat('#ffffff',40),s*.036,.126,.09,1,.7,.5); add(head,new T.BoxGeometry(.034,.0065,.008),hair,s*.036,.15+(o.brow||0),.1).rotation.z=s*-.12; }
  const fc=o.face||'calm',lip=mat(o.female?'#c8505a':'#a8604e',30);
  if(fc==='open'){ add(head,sph(.018),mat('#7a1f28',10),0,.052,.1,1.2,.8,.4); add(head,new T.BoxGeometry(.03,.006,.004),mat('#ffffff',30),0,.06,.106); }
  else if(fc==='smile'){ const m=add(head,new T.TorusGeometry(.02,.0042,5,10,PI),lip,0,.062,.103); m.rotation.z=PI; }
  else if(fc==='grin'){ const m=add(head,new T.TorusGeometry(.024,.006,5,10,PI),mat('#ffffff',30),0,.066,.102); m.rotation.z=PI; }
  else if(fc==='wink'){ const m=add(head,new T.TorusGeometry(.017,.004,5,10,PI),lip,.006,.062,.103); m.rotation.z=PI+.2; head.children[5].visible=false; add(head,new T.BoxGeometry(.03,.005,.006),dark,.036,.126,.103); }
  else add(head,new T.BoxGeometry(.034,.0055,.005),lip,0,.06,.103);
  if(o.longHair){ const lh=o.longHair; if(lh==='pony'){ add(head,new T.CylinderGeometry(.03,.012,.26,8),hair,0,.12,-.14).rotation.x=-.3; add(head,sph(.034),hair,0,.2,-.105); } else if(lh==='bun'){ add(head,sph(.052),hair,0,.235,-.06); } else if(lh==='twin'){ for(const s of [-1,1]) add(head,new T.CylinderGeometry(.03,.012,.24,8),hair,s*.11,.09,-.045); } else { add(head,lathe([[.09,.14],[.1,0],[.09,-.14]],10),hair,0,.09,-.05).scale.z=.6; } }
  if(o.cap){ const cm=mat(o.cap,20); add(head,new T.SphereGeometry(.112,16,8,0,PI*2,0,PI/2),cm,0,.14,-.005,1,1,1.06); add(head,new T.CylinderGeometry(.092,.098,.01,18),cm,0,.145,.075,1,1,1.05); }
  if(o.helmet){ const hm=mat(o.helmet,85); add(head,new T.SphereGeometry(.122,18,10,0,PI*2,0,PI*.56),hm,0,.122,-.006,1,1,1.08); add(head,new T.CylinderGeometry(.09,.095,.012,18),hm,0,.14,.085,1,1,1); add(head,sph(.06),hm,.1,.08,-.02,.48,1,1.08); /* 打者那一側的護耳 */ }
  const glove=o.gloves?mat(o.gloves,20):skin;
  const arm=s=>{ const sh=G(); sh.position.set(s*.205*W,.245,0); chest.add(sh); const am=o.sleeveless?skin:shirt; add(sh,sph(o.female?.052:.07),am,0,0,0);
    if(o.sleeveless||o.longSleeve){ add(sh,lathe([[.058,0],[.058,-.1],[.05,-.2],[.042,-.29]]),o.longSleeve?shirt:skin); }
    else { add(sh,lathe([[.062,0],[.064,-.08],[.06,-.135],[.058,-.145]]),shirt); add(sh,lathe([[.052,-.13],[.05,-.2],[.042,-.29]]),skin); }
    const el=G(); el.position.y=-.29; sh.add(el); add(el,sph(.042),o.longSleeve?shirt:skin,0,0,0); add(el,lathe([[.042,0],[.046,-.06],[.04,-.14],[.03,-.25]]),o.longSleeve?shirt:skin);
    const wr=G(); wr.position.y=-.25; el.add(wr); add(wr,sph(.038),glove,0,-.05,0,.9,1.35,.62); return {sh,el,wr}; };
  const L=arm(1),R=arm(-1); J.shL=L.sh; J.elL=L.el; J.hdL=L.wr; J.shR=R.sh; J.elR=R.el; J.hdR=R.wr;
  const leg=s=>{ const hp=G(); hp.position.set(s*.095*(o.female?.95:1),-.04,0); pelvis.add(hp); const tk=o.female?.86:1;
    if(o.shorts){ add(hp,lathe([[.088*tk,.02],[.09*tk,-.1],[.08*tk,-.2],[.076*tk,-.22]]),pants); add(hp,lathe([[.076*tk,-.2],[.066*tk,-.32],[.056*tk,-.44]]),skin); }
    else add(hp,lathe([[.092,.02],[.092,-.12],[.08,-.28],[.064,-.44]]),pants);
    const kn=G(); kn.position.y=-.44; hp.add(kn); const low=o.shorts?(o.socksHigh?sock:skin):pants; add(kn,sph(.058*tk),o.shorts?skin:pants,0,0,0);
    if(o.stirrup){ add(kn,lathe([[.062,0],[.066,-.1],[.06,-.15]]),pants); add(kn,lathe([[.06,-.14],[.056,-.22],[.04,-.43]]),sock); }
    else add(kn,lathe([[.056*tk,0],[.062*tk,-.1],[.05*tk,-.22],[.036*tk,-.43]]),low);
    const an=G(); an.position.y=-.43; kn.add(an); add(an,sph(.042),o.shorts&&!o.socksHigh?skin:sock,0,-.015,0,1,.9,1.1); add(an,new T.BoxGeometry(.09,.06,.21),shoe,0,-.03,.045); add(an,sph(.048),shoe,0,-.034,.15,.95,.62,1); add(an,new T.BoxGeometry(.094,.018,.27),sole,0,-.063,.065); return {hp,kn,an}; };
  const LL=leg(1),RL=leg(-1); J.hipL=LL.hp; J.knL=LL.kn; J.anL=LL.an; J.hipR=RL.hp; J.knR=RL.kn; J.anR=RL.an;
  root.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=false; } });
  return {root,J}; }
function pose(J,P){ for(const k in J){ if(k==='root') continue; const v=P[k]; if(v) J[k].rotation.set(v[0]||0,v[1]||0,v[2]||0); else J[k].rotation.set(0,0,0); } if(P.y!=null) J.pelvis.position.y=.97+P.y; }
const cl=x=>Math.max(-1,Math.min(1,x));
// 兩節骨頭的 IK：sh 轉到讓末端到 tl（parent 的本地座標），side=-1 手肘往前彎、+1 膝蓋往後彎
function ik2(T,sh,el,par,tw,pole,L1,L2,sign){ const V=T.Vector3; par.updateWorldMatrix(true,false); const q=new T.Quaternion(); par.getWorldQuaternion(q); q.invert();
  const tl=par.worldToLocal(tw.clone()),p0=sh.position,v=tl.clone().sub(p0),d=Math.min(Math.max(v.length(),.08),L1+L2-.003),u=v.normalize();
  let pp=(pole||new V(0,-1,0)).clone().applyQuaternion(q); pp.sub(u.clone().multiplyScalar(pp.dot(u))); if(pp.lengthSq()<1e-6) pp.set(0,0,1); pp.normalize();
  const al=Math.acos(cl((L1*L1+d*d-L2*L2)/(2*L1*d))),bend=Math.PI-Math.acos(cl((L1*L1+L2*L2-d*d)/(2*L1*L2))),a1=u.clone().multiplyScalar(Math.cos(al)).add(pp.multiplyScalar(Math.sin(al))),f=u.clone().multiplyScalar(d).sub(a1.clone().multiplyScalar(L1)).normalize();
  const Y=a1.clone().negate(),Z=f.clone().sub(a1.clone().multiplyScalar(f.dot(a1))); if(Z.lengthSq()<1e-8) Z.set(0,0,1); Z.normalize(); if(sign>0) Z.negate(); const X=new V().crossVectors(Y,Z);
  sh.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(X,Y,Z)); el.rotation.set(sign>0?bend:-bend,0,0); }
// 手臂 IK：手腕到世界座標 tw，pole 是手肘要朝的方向（世界座標向量）；s 是 'L' 或 'R'
function ik(T,J,s,tw,pole){ ik2(T,J['sh'+s],J['el'+s],J.chest,tw,pole,.29,.25,-1); }
// 腳 IK：腳踝到 tw、膝蓋朝 pole；foot＝腳掌的世界方向（四元數），給了就讓腳掌踩穩、不跟著骨盆轉
function ikLeg(T,J,s,tw,pole,foot){ ik2(T,J['hip'+s],J['kn'+s],J.pelvis,tw,pole,.44,.43,1); if(foot){ const kn=J['kn'+s]; kn.updateWorldMatrix(true,false); const q=new T.Quaternion(); kn.getWorldQuaternion(q); q.invert(); J['an'+s].quaternion.copy(q.multiply(foot)); } }
// 兩組姿勢之間內插
function mix(A,B,k){ const o={}; for(const n of new Set([...Object.keys(A),...Object.keys(B)])){ if(n==='y'){ o.y=(A.y||0)+((B.y||0)-(A.y||0))*k; continue; } const a=A[n]||[0,0,0],b=B[n]||[0,0,0]; o[n]=[a[0]+(b[0]-a[0])*k,(a[1]||0)+((b[1]||0)-(a[1]||0))*k,(a[2]||0)+((b[2]||0)-(a[2]||0))*k]; } return o; }
window.__H3D={build,pose,mix,ik,ikLeg};
})();
