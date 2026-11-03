// 陀螺旋風戰：俯視角戰鬥陀螺。玩法參考現在流行的第四代比賽規則（只借玩法，零件名稱、外型都是原創）：
// 場邊有齒輪軌道，陀螺貼著軌道會「極限衝刺」；四種終結：旋轉 1 分、場外 2 分、爆裂 2 分、極限 3 分，先拿到目標分數的贏。
// 零件：刀刃（攻擊／防禦／持久／平衡／左迴旋）、棘輪（齒數-高度）、底座（平頭／球頭／針頭／齒衝），在「造型」裡組裝。
// 單人、同機雙人、連線最多 4 人（房主運算，客人只送按鍵）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,R1=v=>Math.round(v*10)/10,hyp=Math.hypot;
const AR=200,RAD=19,S=1.45,SQ=.6,CX=400,CY=284,TS=1.18; /* TS：陀螺畫大一點比較清楚 */
const sx=x=>CX+x*S,sy=y=>CY+y*S*SQ;
const PCOL=['#ff4d4d','#3d8bff','#3ed16a','#ffc21a'];
const TYPES={攻擊:{atk:1.35,def:.85,sta:.88,wgt:1,emb:'tri'},防禦:{atk:.85,def:1.35,sta:1,wgt:1.3,emb:'hex'},持久:{atk:.8,def:1,sta:1.32,wgt:1.05,emb:'ring'},
  平衡:{atk:1.1,def:1.1,sta:1.08,wgt:1.1,emb:'star'},左旋:{atk:1.15,def:1,sta:1.06,wgt:1,emb:'bolt'}};
const BITS={flat:{mv:1.35,sta:.82,dash:1.25,wander:1,def:0},taper:{mv:1,sta:1,dash:1,wander:.6,def:.08},ball:{mv:.8,sta:1.22,dash:.8,wander:.3,def:.05},
  needle:{mv:.6,sta:1.12,dash:.55,wander:0,def:.2},rush:{mv:1.15,sta:.95,dash:1.65,wander:.7,def:0}};
const BITK={F:'flat',T:'taper',B:'ball',N:'needle',HN:'needle',P:'taper',S:'needle',GF:'rush',GP:'rush',U:'taper',C:'flat',TP:'ball',BS:'needle',M:'flat',A:'flat',DB:'ball',LF:'flat',LR:'rush',R:'rush'};
const BITN={F:'平頭',T:'錐形',B:'球頭',N:'針頭',HN:'高針頭',P:'尖頭',S:'尖釘',GF:'齒輪平頭',GP:'齒輪尖頭',U:'聯合',C:'旋風',TP:'轉換點',BS:'彈性尖釘',M:'融合',A:'加速',DB:'圓盤球頭',LF:'低平頭',LR:'低衝刺',R:'衝刺'};
const TP_=(id,code,n,type,dir,rat,bit,sh,c,a,m,feat,x)=>({id,code,n,type,dir,rat,bit,sh,c,a,m,feat,x:x||{}});
const SILV='#c8ccd6',GOLD='#d8b04a',DARK='#4a4a56';
const TOPS=[
  TP_('dransword','BX-01','蒼龍神劍','攻擊',1,'3-60','F',{k:'hook',n:3,d:.34,h:2.4},'#2f6fe0','#e8eef8',SILV,'三片劍刃的經典攻擊型，入門最常見，撞擊力強。'),
  TP_('hellsscythe','BX-02','惡魔紅鐮','平衡',1,'4-60','T',{k:'hook',n:4,d:.24,h:1.6},'#c8242a','#2a2a30',SILV,'四片鐮刀刃攻守兼備，錐形底座穩又能進攻。'),
  TP_('wizardarrow','BX-03','魔導幻箭','持久',1,'4-80','B',{k:'round',n:6},'#2a9a5a','#d8b84a',GOLD,'圓弧外型減少碰撞損耗，球頭底座轉得久。'),
  TP_('knightshield','BX-04','騎士重盾','防禦',1,'3-80','N',{k:'round',n:8},'#2a4fa8','#e8e8f0',SILV,'厚重盾形刀刃擋下衝擊，針頭底座穩穩站在中央。'),
  TP_('knightlance','BX-13','騎士長槍','防禦',1,'4-80','HN',{k:'spike',n:2,d:.3,h:1.2},'#3a58c8','#f0f0f0',SILV,'兩支長槍狀刀刃，高針頭重心穩、防禦強。'),
  TP_('leonclaw','BX-15','雄獅獵爪','平衡',1,'5-60','P',{k:'claw',n:6,d:.2},'#e8a020','#7a3a10',GOLD,'六爪造型的獅子，尖頭底座可攻可守。'),
  TP_('rhinohorn','BX-19','戰犀號角','防禦',1,'3-80','S',{k:'wing',n:2,d:.28,h:2},'#8a8f9c','#3a3f4c',SILV,'犀牛角凸起把攻擊彈開，尖釘底座很耐撞。'),
  TP_('phoenixwing','BX-23','鳳凰飛翼','攻擊',1,'9-60','GF',{k:'wing',n:3,d:.36,h:1.6},'#d8341c','#ffb02a',GOLD,'重量級三翼攻擊型，齒輪平頭衝刺快、撞擊猛。',{wgt:1.2}),
  TP_('unicornsting','BX-26','獨角刺心','平衡',1,'5-60','GP',{k:'spike',n:5,d:.2,h:1.5},'#f2f2f8','#b98cff',SILV,'尖刺外緣配齒輪尖頭，衝刺完還能回到中央。'),
  TP_('weisstiger','BX-33','皓戰猛虎','平衡',1,'3-60','U',{k:'claw',n:3,d:.26},'#f4f4f8','#2a2a30',SILV,'白虎三爪，聯合底座兼顧移動與持久。'),
  TP_('cobaltdragoon','BX-34','蒼穹龍騎士','左旋',-1,'2-60','C',{k:'rhook',n:4,d:.32,h:2.4},'#1f4fd0','#ffd23f',SILV,'左旋轉攻擊型，撞上右旋陀螺時能吸走對方轉速。'),
  TP_('crimsongaruda','BX-38','赫燃天鳳','持久',1,'4-70','TP',{k:'wing',n:4,d:.15,h:2},'#e0402a','#ffd23f',GOLD,'寬大雙翼抓穩平衡，轉換點底座兼顧持久與反擊。'),
  TP_('tricerapress','BX-44','三角強襲','防禦',1,'M-85','BS',{k:'spike',n:3,d:.14,h:1},'#5a7a3a','#c8b48a',SILV,'三角龍頭盾防禦力高，彈性尖釘化解衝擊。'),
  TP_('samuraicalibur','BX-45','武士魂斬','攻擊',1,'6-70','M',{k:'hook',n:2,d:.4,h:3},'#e8e8f0','#c8242a',SILV,'雙刀武士刃，一刀就能把對手砍出場。'),
  TP_('dranbuster','UX-01','蒼龍爆刃','攻擊',1,'1-60','A',{k:'hook',n:3,d:.42,h:1.4},'#1a5ae0','#ff7a3d',DARK,'超大刀刃的重攻擊型，加速底座衝刺力驚人。',{atk:1.08}),
  TP_('wizardrod','UX-03','魔導神杖','持久',1,'5-70','DB',{k:'round',n:4},'#3a4ab8','#d8b84a',GOLD,'目前賽場上（T0）極具代表性的超強持久型陀螺，表現極為穩定。',{sta:1.1}),
  TP_('impactdrake','UX-11','衝擊龍神','平衡',1,'9-60','LR',{k:'hook',n:3,d:.26,h:2},'#7a3ad8','#ffd23f',SILV,'新手入坑推薦組合包常客，均衡好上手。'),
  TP_('sharkedge','UX-15','鮫鯊狂鱗','攻擊',1,'3-60','LF',{k:'hook',n:4,d:.3,h:2},'#2aa8c8','#f0f0f0',SILV,'具備強大下砍與彈飛對手的攻擊力，是攻擊手的熱門選擇。'),
  TP_('meteordragoon','UX-17','隕星龍騎士','左旋',-1,'3-70','R',{k:'rhook',n:3,d:.34,h:2.2},'#3a2a8a','#ff4d4d',SILV,'支援左旋轉向，深受老玩家與特殊戰術喜愛。'),
  TP_('pegasusblast','CX-07','天馬爆擊','攻擊',1,'1-60','A',{k:'wing',n:3,d:.3,h:2.4},'#f4f6fa','#3d8bff',SILV,'來自最新可拆解的 CX（客製）系統，具備高度爆發力。')];
const TOP={}; TOPS.forEach(q=>TOP[q.id]=q);
const PK=(a,w,k)=>({a,w,k});
const STAGES=[
  {name:'新手練習場',stars:1,th:'gym',slope:1,fric:1,decay:1,pk:[PK(Math.PI/2,.24,'over'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'街頭對戰盤',stars:1,th:'street',slope:1,fric:1,decay:1,pk:[PK(Math.PI/2,.26,'over'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'寬口競技場',stars:2,th:'arena',slope:1,fric:1,decay:1,pk:[PK(Math.PI/2,.32,'over'),PK(.1,.28,'over'),PK(Math.PI-.1,.28,'over')]},
  {name:'冰晶競技場',stars:2,th:'ice',slope:1,fric:.35,decay:.85,pk:[PK(Math.PI/2,.26,'over'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'沙漠鬥技場',stars:3,th:'desert',slope:1.1,fric:1.7,decay:1.25,pk:[PK(Math.PI/2,.26,'over'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'四口袋競技場',stars:3,th:'twin',slope:1,fric:1,decay:1,pk:[PK(Math.PI/2,.2,'over'),PK(-Math.PI/2,.2,'over'),PK(0,.17,'over'),PK(Math.PI,.17,'over')]},
  {name:'熔岩火山場',stars:4,th:'lava',slope:1,fric:1,decay:1,lava:1,pk:[PK(Math.PI/2,.26,'over'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'星空低重力',stars:4,th:'space',slope:.5,fric:.8,decay:.9,pk:[PK(Math.PI/2,.26,'over'),PK(0,.22,'over'),PK(Math.PI,.22,'over')]},
  {name:'暴風競技場',stars:5,th:'storm',slope:1,fric:1,decay:1,wind:1,pk:[PK(Math.PI/2,.26,'over'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'冠軍決賽場',stars:5,th:'final',slope:1,fric:1,decay:1,pk:[PK(Math.PI/2,.24,'over'),PK(0,.19,'over'),PK(Math.PI,.19,'over')]}];
const TH={gym:{bg:['#1d2a44','#0e1526'],fl:['#e8edf5','#9aa8c0'],rim:'#2a3550',acc:'#3d8bff'},
  street:{bg:['#2a2230','#121018'],fl:['#d8d0c4','#8a8070'],rim:'#3a3038',acc:'#ff7a3d'},
  arena:{bg:['#1a1240','#08061a'],fl:['#dfe6ff','#8a94c8'],rim:'#2a2060',acc:'#b98cff'},
  ice:{bg:['#bfe6ff','#5a9ac8'],fl:['#f4fbff','#9cd2f0'],rim:'#4a7aa8',acc:'#3ddbd9'},
  desert:{bg:['#f0b870','#a0602a'],fl:['#f2dcaa','#c49a5a'],rim:'#7a4a22',acc:'#ffb02a'},
  twin:{bg:['#102a2a','#061212'],fl:['#e0f4ee','#86b8aa'],rim:'#1a4a42',acc:'#3ed16a'},
  lava:{bg:['#3a0c08','#120404'],fl:['#4a3a36','#241a18'],rim:'#2a1210',acc:'#ff5a1a'},
  space:{bg:['#0a0a2a','#000008'],fl:['#3a3e6a','#141630'],rim:'#22264a',acc:'#c8a0ff'},
  storm:{bg:['#3a4656','#141a24'],fl:['#cfd8e0','#7a8898'],rim:'#2a3440',acc:'#9ae0ff'},
  final:{bg:['#2a1a08','#0a0602'],fl:['#fff4d8','#c8a860'],rim:'#4a3410',acc:'#ffd23f'}};
const FIN={spin:{n:'持久勝',p:1,col:'#9ae0ff'},over:{n:'擊飛勝',p:2,col:'#3d8bff'},burst:{n:'爆裂勝',p:2,col:'#ff7a3d'},x:{n:'極限勝',p:3,col:'#ffd23f'}};
// 電腦對手：前面的關卡出入門機體，後面越來越強
const OPP=['dransword','knightshield','wizardarrow','hellsscythe','leonclaw','rhinohorn','unicornsting','weisstiger','cobaltdragoon','phoenixwing','crimsongaruda','tricerapress','samuraicalibur','knightlance','sharkedge','impactdrake','meteordragoon','dranbuster','pegasusblast','wizardrod'];
const BOTN=['旋風小子','鐵壁','流星','閃電','颶風','黑曜','赤焰','白狼','銀河','雷神'];
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function shade(hex,k){ const n=parseInt(hex.slice(1),16); let r=n>>16,g=n>>8&255,b=n&255; const f=v=>clamp(Math.round(k>0?v+(255-v)*k:v*(1+k)),0,255); return 'rgb('+f(r)+','+f(g)+','+f(b)+')'; }
const partsOf=L=>{ const id=L&&TOP[L.top]?L.top:'dransword'; return {top:id,blade:id,ratchet:TOP[id].rat,bit:TOP[id].bit}; };
const ratOf=r=>{ const tth=/^\d/.test(r)?+r[0]:5,hh=+r.split('-')[1]||70; return {teeth:tth,h:hh,res:.82+.05*Math.min(tth,8),low:hh<=60?1:hh<=70?.5:0,atk:hh<=60?1.06:hh<=70?1:.96}; };
// 3 對 3：三顆不能同一顆，棘輪、底座也不能重複
const clash=(d,slot,id)=>d.some((q,i)=>i!==slot&&(q.top===id||TOP[q.top].rat===TOP[id].rat||TOP[q.top].bit===TOP[id].bit));
function fixDeck(d){ d=d.map(q=>partsOf(q)); for(let i=0;i<d.length;i++){ const pre=d.slice(0,i); if(pre.some(q=>q.top===d[i].top||TOP[q.top].rat===TOP[d[i].top].rat||TOP[q.top].bit===TOP[d[i].top].bit)){ const ok=TOPS.find(t=>!pre.some(q=>q.top===t.id||TOP[q.top].rat===t.rat||TOP[q.top].bit===t.bit)); d[i]=partsOf({top:ok.id}); } } return d; }
function myDeck(L){ let d=null; try{ d=JSON.parse(localStorage.getItem('arcade.spin.deck2')||'null'); }catch(e){} if(!Array.isArray(d)||d.length!==3) d=[{top:partsOf(L).top},{top:'knightshield'},{top:'wizardrod'}]; return fixDeck(d); }
function botDeck(si,i){ const d=[]; for(let k=0;k<3;k++) d.push({top:OPP[(si*2+i+k*7)%OPP.length]}); return fixDeck(d); }
function statsOf(p){ const T0=TOP[p.top],Ty=TYPES[T0.type],B=BITS[BITK[T0.bit]],Rr=ratOf(T0.rat),x=T0.x;
  return {atk:Ty.atk*Rr.atk*(x.atk||1),def:Ty.def+B.def,wgt:Ty.wgt*(x.wgt||1),sta:Ty.sta*B.sta*(x.sta||1),mv:B.mv,dash:B.dash,wander:B.wander,res:Rr.res,low:Rr.low,dir:T0.dir}; }
// 刀刃外形：極座標 r(θ)，回傳 0～1
function bladeR(sh,a){ const u=((a*sh.n/TAU)%1+1)%1,d=sh.d||.2,h=sh.h||2;
  if(sh.k==='hook') return 1-d+d*Math.pow(u,h);
  if(sh.k==='rhook') return 1-d+d*Math.pow(1-u,h);
  if(sh.k==='wing') return 1-d+d*Math.pow(Math.abs(Math.cos(a*sh.n/2)),h);
  if(sh.k==='spike') return 1-d+d*Math.pow(1-Math.abs(2*u-1),h);
  if(sh.k==='claw') return 1-d+d*Math.pow(u,2)*(u>.82?.55:1);
  return .95+.035*Math.cos(a*sh.n); }
function bladePath(c,sh,R){ c.beginPath(); for(let i=0;i<=120;i++){ const a=i/120*TAU,r=bladeR(sh,a)*R; i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r); } c.closePath(); }
function emblem(c,k,r){ c.beginPath();
  if(k==='tri'){ for(let i=0;i<3;i++){ const a=i/3*TAU-Math.PI/2; c.lineTo(Math.cos(a)*r,Math.sin(a)*r); } }
  else if(k==='hex'){ for(let i=0;i<6;i++){ const a=i/6*TAU; c.lineTo(Math.cos(a)*r,Math.sin(a)*r); } }
  else if(k==='ring'){ c.arc(0,0,r,0,TAU); c.moveTo(r*.5,0); c.arc(0,0,r*.5,0,TAU,true); }
  else if(k==='star'){ for(let i=0;i<10;i++){ const a=i/10*TAU-Math.PI/2,q=i%2?r*.45:r; c.lineTo(Math.cos(a)*q,Math.sin(a)*q); } }
  else { c.moveTo(-r*.2,-r); c.lineTo(r*.5,-r*.1); c.lineTo(0,0); c.lineTo(r*.3,r); c.lineTo(-r*.5,r*.05); c.lineTo(0,0); }
  c.closePath(); c.fill('evenodd'); }
// 畫一顆陀螺：(x,y)＝地面接觸點的畫面座標（顏色、外型照機體）
function drawTop(c,x,y,s,P,col,ang,frac,o){ o=o||{}; const B=TOP[P.top]||TOPS[0],sh=B.sh,R=20*s,tilt=o.tilt||0,ta=o.ta||0,tx=Math.cos(ta)*tilt*s,ty=Math.sin(ta)*tilt*s*SQ,bk=BITK[B.bit],rt=ratOf(B.rat),main=B.c,acc=B.a;
  c.save(); c.translate(x,y);
  if(!o.noShadow){ c.fillStyle='rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(tx*.5+2*s,1.5*s,R*1.05,R*SQ*1.05,0,0,TAU); c.fill(); c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(tx*.3+s,1*s,R*.6,R*SQ*.6,0,0,TAU); c.fill(); }
  // 底座：彩色圓柱＋照種類的尖端
  const bitC=bk==='needle'?'#c8ccd6':bk==='ball'?'#8a8f9c':bk==='rush'?'#ffb02a':bk==='taper'?'#7a8090':'#5a5f6c',bx0=tx*.3,byT=-7*s+ty*.3;
  c.fillStyle='#14161b'; c.beginPath();
  if(bk==='needle'){ c.moveTo(bx0-3.4*s,byT+3*s); c.lineTo(bx0+3.4*s,byT+3*s); c.lineTo(0,1.2*s); }
  else if(bk==='ball'){ c.moveTo(bx0-4*s,byT+3*s); c.lineTo(bx0+4*s,byT+3*s); c.quadraticCurveTo(4.2*s,0,0,.6*s); c.quadraticCurveTo(-4.2*s,0,bx0-4*s,byT+3*s); }
  else { const w=bk==='taper'?1.6:bk==='rush'?3.6:2.8; c.moveTo(bx0-4.2*s,byT+3*s); c.lineTo(bx0+4.2*s,byT+3*s); c.lineTo(w*s,0); c.lineTo(-w*s,0); }
  c.closePath(); c.fill();
  const bg=c.createLinearGradient(bx0-6.5*s,0,bx0+6.5*s,0); bg.addColorStop(0,shade(bitC,-.5)); bg.addColorStop(.35,shade(bitC,.35)); bg.addColorStop(1,shade(bitC,-.6));
  c.fillStyle=bg; c.beginPath(); c.ellipse(bx0,byT+3*s,6.5*s,6.5*s*SQ,0,0,Math.PI); c.lineTo(bx0-6.5*s,byT); c.ellipse(bx0,byT,6.5*s,6.5*s*SQ,0,Math.PI,TAU); c.closePath(); c.fill();
  c.fillStyle=shade(bitC,.15); c.beginPath(); c.ellipse(bx0,byT,6.5*s,6.5*s*SQ,0,0,TAU); c.fill();
  // 棘輪：塑膠圓柱＋外緣凸塊（凸塊數＝型號第一個數字，高度照 60／70／80）
  const rh=6+(rt.h-55)/5,ry=-rh*s+ty*.6,rx=tx*.6,rc='#30343f';
  const rg=c.createLinearGradient(rx-13*s,0,rx+13*s,0); rg.addColorStop(0,'#1a1c22'); rg.addColorStop(.3,'#5a6070'); rg.addColorStop(.55,'#2c3038'); rg.addColorStop(1,'#121318');
  c.fillStyle=rg; c.beginPath(); c.ellipse(rx,ry+3*s,13*s,13*s*SQ,0,0,Math.PI); c.lineTo(rx-13*s,ry); c.ellipse(rx,ry,13*s,13*s*SQ,0,Math.PI,TAU); c.closePath(); c.fill();
  for(let i=0;i<rt.teeth;i++){ const a=ang+i/rt.teeth*TAU,w=.32,p=(r,t)=>[rx+Math.cos(t)*r*s,ry+Math.sin(t)*r*s*SQ];
    const q=[p(12,a-w),p(16,a-w*.7),p(16,a+w*.7),p(12,a+w)]; c.fillStyle=Math.sin(a)>0?'#4a505e':'#272a33';
    c.beginPath(); q.forEach((v,j)=>j?c.lineTo(v[0],v[1]+2.6*s):c.moveTo(v[0],v[1]+2.6*s)); for(let j=3;j>=0;j--) c.lineTo(q[j][0],q[j][1]); c.closePath(); c.fill();
    c.fillStyle='#5c6372'; c.beginPath(); q.forEach((v,j)=>j?c.lineTo(v[0],v[1]):c.moveTo(v[0],v[1])); c.closePath(); c.fill(); }
  c.fillStyle=rc; c.beginPath(); c.ellipse(rx,ry,13*s,13*s*SQ,0,0,TAU); c.fill();
  // 刀刃：金屬厚度
  const by=ry-(5*s),bx=rx+tx*.4;
  for(let k=5;k>=1;k--){ c.save(); c.translate(bx,by+k*1.1*s); c.scale(1,SQ); c.rotate(ang); bladePath(c,sh,R); c.fillStyle=k>3?'#16181e':shade(B.m,k>1?-.62:-.4); c.fill(); c.restore(); }
  c.save(); c.translate(bx,by); c.scale(1,SQ); c.rotate(ang);
  const rot=(x0,y0)=>[x0*Math.cos(-ang)-y0*Math.sin(-ang),x0*Math.sin(-ang)+y0*Math.cos(-ang)]; /* 光源固定在左上，不跟著轉 */
  // 拉絲金屬：圓錐漸層做出旋轉時的反光帶
  let g; if(c.createConicGradient){ g=c.createConicGradient(-ang-2.4,0,0); [[0,.7],[.1,-.1],[.2,.5],[.33,-.5],[.5,.15],[.62,-.35],[.75,.65],[.88,-.2],[1,.7]].forEach(v=>g.addColorStop(v[0],shade(B.m,v[1]))); }
  else { const p1=rot(-R,-R),p2=rot(R,R); g=c.createLinearGradient(p1[0],p1[1],p2[0],p2[1]); g.addColorStop(0,shade(B.m,.6)); g.addColorStop(.5,shade(B.m,-.2)); g.addColorStop(1,shade(B.m,-.45)); }
  bladePath(c,sh,R); c.fillStyle=g; c.fill();
  c.save(); bladePath(c,sh,R); c.clip();
  c.strokeStyle='rgba(255,255,255,.08)'; c.lineWidth=.6*s; for(let r=R*.45;r<R;r+=R*.07){ c.beginPath(); c.arc(0,0,r,0,TAU); c.stroke(); } /* 車床紋 */
  const o1=rot(1.3*s,1.3*s); c.translate(o1[0],o1[1]); bladePath(c,sh,R); c.lineWidth=2.4*s; c.strokeStyle='rgba(0,0,0,.45)'; c.stroke(); c.translate(-2*o1[0],-2*o1[1]); bladePath(c,sh,R); c.strokeStyle='rgba(255,255,255,.5)'; c.lineWidth=1.6*s; c.stroke(); c.restore();
  bladePath(c,sh,R); c.lineWidth=1*s; c.strokeStyle='rgba(12,14,20,.9)'; c.stroke();
  // 刀刃前緣的切削面
  const sp=sh.n; if(sh.k!=='round'){ c.strokeStyle='rgba(255,255,255,.55)'; c.lineWidth=.9*s; for(let i=0;i<sp;i++){ const a0=i/sp*TAU+(sh.k==='rhook'?TAU/sp-.02:.02); c.beginPath(); c.moveTo(Math.cos(a0)*R*.78,Math.sin(a0)*R*.78); c.lineTo(Math.cos(a0)*R*bladeR(sh,a0+.03),Math.sin(a0)*R*bladeR(sh,a0+.03)); c.stroke(); } }
  // 彩色塑膠層（有鏤空窗口露出底下金屬）
  const p1=rot(-R*.7,-R*.7),p2=rot(R*.7,R*.7),pg=c.createLinearGradient(p1[0],p1[1],p2[0],p2[1]); pg.addColorStop(0,shade(main,.35)); pg.addColorStop(.45,main); pg.addColorStop(1,shade(main,-.4));
  c.fillStyle=pg; bladePath(c,sh,R*.74);
  for(let i=0;i<sp;i++){ const a0=i/sp*TAU+TAU/sp*.5; c.moveTo(Math.cos(a0)*R*.62,Math.sin(a0)*R*.62); c.arc(0,0,R*.62,a0,a0+TAU/sp*.22); c.arc(0,0,R*.5,a0+TAU/sp*.22,a0,true); c.closePath(); }
  c.fill('evenodd'); c.lineWidth=.8*s; c.strokeStyle=shade(main,-.6); c.stroke();
  // 配色條紋（斜向，順著旋轉方向）
  c.fillStyle=acc; for(let i=0;i<sp;i++){ const a0=i/sp*TAU+(B.dir<0?.55:.12),w=TAU/sp*.2,sk=.18*B.dir; c.beginPath(); c.moveTo(Math.cos(a0)*R*.4,Math.sin(a0)*R*.4); c.lineTo(Math.cos(a0+sk)*R*.7,Math.sin(a0+sk)*R*.7); c.lineTo(Math.cos(a0+sk+w)*R*.7,Math.sin(a0+sk+w)*R*.7); c.lineTo(Math.cos(a0+w)*R*.4,Math.sin(a0+w)*R*.4); c.closePath(); c.fill(); }
  if(sh.k==='round'){ c.strokeStyle=acc; c.lineWidth=1.8*s; c.beginPath(); c.arc(0,0,R*.84,0,TAU); c.stroke(); }
  // 金屬鉚釘
  for(let i=0;i<sp;i++){ const a0=i/sp*TAU+TAU/sp*.85,x0=Math.cos(a0)*R*.46,y0=Math.sin(a0)*R*.46; c.fillStyle='#22252c'; c.beginPath(); c.arc(x0,y0,1.5*s,0,TAU); c.fill(); c.fillStyle=SILV; c.beginPath(); c.arc(x0,y0,1*s,0,TAU); c.fill(); }
  // 中央鎖芯（Lock Chip）
  c.fillStyle='#101218'; c.beginPath(); c.arc(0,0,R*.37,0,TAU); c.fill();
  const cg=c.createLinearGradient(p1[0]*.5,p1[1]*.5,p2[0]*.5,p2[1]*.5); cg.addColorStop(0,'#f4f6fa'); cg.addColorStop(.5,'#8a90a0'); cg.addColorStop(1,'#3a3e48');
  c.strokeStyle=cg; c.lineWidth=1.6*s; c.beginPath(); c.arc(0,0,R*.33,0,TAU); c.stroke();
  const chg=c.createRadialGradient(...rot(-R*.1,-R*.1),0,0,0,R*.28); chg.addColorStop(0,shade(acc,.35)); chg.addColorStop(1,shade(acc,-.45));
  c.fillStyle=chg; c.beginPath(); c.arc(0,0,R*.27,0,TAU); c.fill();
  c.fillStyle='#14161c'; emblem(c,TYPES[B.type].emb,R*.19); c.fillStyle='#fff'; emblem(c,TYPES[B.type].emb,R*.14);
  c.restore();
  // 鎖芯光澤
  c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=1.2*s; c.beginPath(); c.ellipse(bx,by,R*.22,R*.22*SQ,0,3.4,4.6); c.stroke();
  // 高速旋轉的殘影與光澤
  if(frac>.15&&!o.still){ c.save(); c.translate(bx,by); c.scale(1,SQ); c.globalAlpha=Math.min(.55,frac*.6); c.strokeStyle='rgba(255,255,255,.85)'; c.lineWidth=1.6*s;
    for(let i=0;i<3;i++){ const a=ang+i*TAU/3; c.beginPath(); c.arc(0,0,R*(.82+i*.05),a,a+1.1*B.dir,B.dir<0); c.stroke(); }
    c.globalAlpha=frac*.25; c.fillStyle=main; c.beginPath(); c.arc(0,0,R*1.02,0,TAU); c.fill(); c.restore(); }
  c.fillStyle='rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(bx-R*.32,by-R*.32*SQ,R*.3,R*.12,-.5,0,TAU); c.fill();
  if(o.ring){ c.strokeStyle=o.ring; c.lineWidth=3; c.beginPath(); c.ellipse(0,2*s,R*1.25,R*1.25*SQ,0,0,TAU); c.stroke(); }
  c.restore(); }
// 文字換行
function wrapText(c,txt,x,y,maxW,lh,maxL){ let line='',n=0; for(const ch of txt){ if(c.measureText(line+ch).width>maxW){ c.fillText(line,x,y+n*lh); line=ch; n++; if(n>=maxL) return; } else line+=ch; } if(line) c.fillText(line,x,y+n*lh); }
// 場地（每個場景畫一次存起來）
const stadCache={};
function themeBg(c,th,t){ const T=TH[th],g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,T.bg[0]); g.addColorStop(1,T.bg[1]); c.fillStyle=g; c.fillRect(0,0,W,H);
  if(th==='space'||th==='arena'||th==='final'){ for(let i=0;i<90;i++){ c.fillStyle='rgba(255,255,255,'+(.25+.5*Math.abs(Math.sin(t*.7+i)))+')'; c.fillRect((i*137)%W,(i*71)%H,1.6,1.6); } }
  if(th==='final'||th==='arena'||th==='gym'){ for(let i=0;i<5;i++){ const x=80+i*160+Math.sin(t*.5+i)*40,gg=c.createLinearGradient(x,0,x,H*.7); gg.addColorStop(0,'rgba(255,240,200,.22)'); gg.addColorStop(1,'rgba(255,240,200,0)'); c.fillStyle=gg; c.beginPath(); c.moveTo(x-12,0); c.lineTo(x+12,0); c.lineTo(x+90,H*.7); c.lineTo(x-90,H*.7); c.fill(); }
    c.fillStyle='rgba(0,0,0,.45)'; for(let i=0;i<40;i++){ const x=i*21,h=14+((i*37)%9); c.beginPath(); c.arc(x+10,H-8-h,7,0,TAU); c.fill(); c.fillRect(x+3,H-8-h,14,h+8); } }
  if(th==='street'){ for(let i=0;i<9;i++){ c.fillStyle=['#3a3046','#2a2434','#463a50'][i%3]; c.fillRect(i*92-10,40+(i%3)*24,86,H); c.fillStyle='rgba(255,210,120,.45)'; for(let k=0;k<5;k++) for(let j=0;j<3;j++) if((i+k+j)%3) c.fillRect(i*92+j*24,60+(i%3)*24+k*30,12,14); } }
  if(th==='ice'){ c.fillStyle='rgba(255,255,255,.8)'; for(let i=0;i<60;i++) c.fillRect((i*97+t*20)%W,(i*53+t*40*(1+i%3))%H,2.5,2.5); }
  if(th==='desert'){ c.fillStyle='#d89040'; c.beginPath(); c.moveTo(0,160); for(let x=0;x<=W;x+=40) c.lineTo(x,150+Math.sin(x*.012)*30); c.lineTo(W,H); c.lineTo(0,H); c.fill(); c.fillStyle='#fff3c0'; c.beginPath(); c.arc(660,60,30,0,TAU); c.fill(); }
  if(th==='lava'){ for(let i=0;i<30;i++){ c.fillStyle='rgba(255,'+(90+i*4)+',30,'+(.3+.3*Math.sin(t*2+i))+')'; c.beginPath(); c.arc((i*71)%W,H-((t*30+i*40)%H),2+i%3,0,TAU); c.fill(); } }
  if(th==='storm'){ c.strokeStyle='rgba(220,240,255,.35)'; c.lineWidth=2; for(let i=0;i<24;i++){ const x=(i*83+t*300)%(W+200)-100,y=(i*41)%H; c.beginPath(); c.moveTo(x,y); c.lineTo(x+60,y+6); c.stroke(); } }
  if(th==='twin'){ c.strokeStyle='rgba(62,209,106,.15)'; c.lineWidth=1; for(let i=0;i<W;i+=40){ c.beginPath(); c.moveTo(i,0); c.lineTo(i,H); c.stroke(); } for(let j=0;j<H;j+=40){ c.beginPath(); c.moveTo(0,j); c.lineTo(W,j); c.stroke(); } } }
const inPk=(st,a,extra)=>{ for(const p of st.pk){ let d=Math.abs(((a-p.a)%TAU+TAU*1.5)%TAU-Math.PI); if(d<p.w+(extra||0)) return p; } return null; };
function stadium(si){ if(stadCache[si]) return stadCache[si]; const ST=STAGES[si],T=TH[ST.th],cv=document.createElement('canvas'); cv.width=W*2; cv.height=H*2; const c=cv.getContext('2d'); c.scale(2,2);
  const E=(r,dy)=>{ c.beginPath(); c.ellipse(CX,CY+(dy||0),r*S,r*S*SQ,0,0,TAU); };
  // 外殼
  c.fillStyle='rgba(0,0,0,.45)'; E(AR+46,16); c.fill();
  const g0=c.createLinearGradient(0,CY-AR*S*SQ,0,CY+AR*S*SQ+30); g0.addColorStop(0,shade(T.rim,.25)); g0.addColorStop(1,shade(T.rim,-.4)); c.fillStyle=g0; E(AR+40,10); c.fill(); c.fillStyle=shade(T.rim,.15); E(AR+40); c.fill();
  // 得分口袋
  for(const p of ST.pk){ c.save(); const a0=p.a-p.w,a1=p.a+p.w; c.beginPath(); for(let i=0;i<=20;i++){ const a=a0+(a1-a0)*i/20; c.lineTo(sx(Math.cos(a)*(AR+38)),sy(Math.sin(a)*(AR+38))); } for(let i=20;i>=0;i--){ const a=a0+(a1-a0)*i/20; c.lineTo(sx(Math.cos(a)*(AR-4)),sy(Math.sin(a)*(AR-4))); } c.closePath();
    c.fillStyle='#0a1430'; c.fill(); c.clip(); c.strokeStyle='rgba(61,139,255,.6)'; c.lineWidth=6; for(let i=-30;i<30;i++){ c.beginPath(); c.moveTo(sx(Math.cos(p.a)*AR)+i*14-40,sy(Math.sin(p.a)*AR)-60); c.lineTo(sx(Math.cos(p.a)*AR)+i*14+40,sy(Math.sin(p.a)*AR)+60); c.stroke(); } c.restore();
    c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#9ac8ff'; const lx=sx(Math.cos(p.a)*(AR+22)),ly=sy(Math.sin(p.a)*(AR+22)); c.lineWidth=4; c.strokeStyle='#000'; const lb='場外'; c.strokeText(lb,lx,ly); c.fillText(lb,lx,ly); }
  // 碗面
  const g=c.createRadialGradient(CX,CY-20,10,CX,CY,AR*S); g.addColorStop(0,T.fl[0]); g.addColorStop(1,T.fl[1]); c.fillStyle=g; E(AR-2); c.fill();
  c.strokeStyle='rgba(0,0,0,.08)'; c.lineWidth=1.2; for(let r=30;r<AR;r+=28){ E(r); c.stroke(); }
  c.save(); E(AR-2); c.clip(); c.globalAlpha=.12; c.fillStyle=T.acc; c.font='900 120px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.save(); c.translate(CX,CY); c.scale(1,SQ); c.fillText('旋',0,0); c.restore(); c.restore();
  if(ST.lava){ c.save(); E(AR-2); c.clip(); const lg=c.createRadialGradient(CX,CY,AR*S*.6,CX,CY,AR*S); lg.addColorStop(0,'rgba(255,90,26,0)'); lg.addColorStop(1,'rgba(255,90,26,.55)'); c.fillStyle=lg; c.fillRect(0,0,W,H); c.restore(); }
  if(ST.th==='ice'){ c.save(); E(AR-2); c.clip(); c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=1; for(let i=0;i<14;i++){ c.beginPath(); const a=i*1.7; c.moveTo(CX+Math.cos(a)*40,CY+Math.sin(a)*20); c.lineTo(CX+Math.cos(a)*260,CY+Math.sin(a+.2)*160); c.stroke(); } c.restore(); }
  // 中心
  c.fillStyle='rgba(0,0,0,.12)'; E(14); c.fill(); c.fillStyle=T.acc; c.globalAlpha=.5; E(8); c.fill(); c.globalAlpha=1;
  // 齒輪軌道
  for(let i=0;i<180;i++){ const a=i/180*TAU; if(inPk(ST,a)) continue; const a2=a+TAU/180; c.beginPath(); c.moveTo(sx(Math.cos(a)*(AR-6)),sy(Math.sin(a)*(AR-6))); c.lineTo(sx(Math.cos(a)*(AR+6)),sy(Math.sin(a)*(AR+6))); c.lineTo(sx(Math.cos(a2)*(AR+6)),sy(Math.sin(a2)*(AR+6))); c.lineTo(sx(Math.cos(a2)*(AR-6)),sy(Math.sin(a2)*(AR-6))); c.closePath();
    c.fillStyle=i%2?'#c8ced8':'#7a8292'; if(ST.lava) c.fillStyle=i%2?'#ff9a4a':'#a83a1a'; c.fill(); }
  stadCache[si]=cv; return cv; }
function meArrow(c,x,y,label,t){ const yy=y+Math.sin(t*8)*5; c.fillStyle='#ffd23f'; c.strokeStyle='#0b0a1c'; c.lineWidth=3; c.beginPath(); c.moveTo(x-13,yy-20); c.lineTo(x+13,yy-20); c.lineTo(x,yy); c.closePath(); c.stroke(); c.fill();
  c.font='900 17px '+TC; c.textAlign='center'; c.textBaseline='bottom'; c.lineWidth=4; c.strokeText(label,x,yy-24); c.fillText(label,x,yy-24); }
function recWin(stage){ try{ localStorage.setItem('arcade.spin.w.'+stage,'1'); }catch(e){} }
const hasWin=stage=>{ try{ return localStorage.getItem('arcade.spin.w.'+stage)==='1'; }catch(e){ return false; } };
// 名單：比賽永遠是一對一（單人對電腦、同機兩人、連線兩人；連線只有一人時補電腦）
function roster(opts){ const net=opts.net,local2=!net&&opts.mode==='2p',pv=!!opts.preview,humans=pv?0:net?Math.min(2,net.count):local2?2:1,n=2;
  const si=clamp(opts.stage|0,0,STAGES.length-1),names=[],looks=[];
  for(let i=0;i<n;i++){ const h=i<humans; names.push(h?(net?(net.names&&net.names[i])||'玩家'+(i+1):local2?(i+1)+'P':opts.name||'你'):BOTN[(si+i)%BOTN.length]);
    const L=h?(net?net.looks&&net.looks[i]:i===0?opts.look:null):null;
    looks.push(h&&L&&Object.keys(L).length?L:h?{}:{top:OPP[(si*2+(pv?i:i===1?0:i))%OPP.length]}); }
  return {net,local2,humans,mode:'ffa',n,team:[null,null],TEAMS:[],names,looks,host:!net||net.host,me:net?net.me:0,pv}; }
function readIn(env,i,local2){ const K=env.keys,h=c=>env.hit(c); let L,Rt,U,D,A;
  if(local2&&i===0){ L=K.KeyA; Rt=K.KeyD; U=K.KeyW; D=K.KeyS; A=h('KeyF')||h('KeyG'); }
  else if(local2){ L=K.ArrowLeft; Rt=K.ArrowRight; U=K.ArrowUp; D=K.ArrowDown; A=h('Enter')||h('Comma')||h('Slash'); }
  else { L=K.ArrowLeft||K.KeyA; Rt=K.ArrowRight||K.KeyD; U=K.ArrowUp||K.KeyW; D=K.ArrowDown||K.KeyS; A=h('Space')||h('KeyX')||h('KeyJ'); }
  return {mx:(Rt?1:0)-(L?1:0),my:(D?1:0)-(U?1:0),dash:!!A}; }
const NOIN={mx:0,my:0,dash:false};

function create(env,opts){
  const si=clamp(opts.stage|0,0,STAGES.length-1),ST=STAGES[si],OP=opts.options||{},R=roster(opts),{net,host,me,local2}=R,client=!!net&&!host,TARGET=4,RT=60,FMT3=true;
  const {ctx:c,canvas}=env.canvas2d(W,H),bg=stadium(si);
  const colOf=i=>TOP[partsOf(R.looks[i]).top].c;
  const deckOf=i=>FMT3?(i<R.humans?myDeck(R.looks[i]):botDeck(si,i)):[partsOf(R.looks[i])];
  const T=[]; for(let i=0;i<R.n;i++){ const P=partsOf(R.looks[i]); T.push({i,P,k:statsOf(P),col:colOf(i),team:R.team[i],human:i<R.humans,local:i<R.humans&&(!net||i===me),remote:i<R.humans&&!!net&&i!==me,
    ai:i>=R.humans?{sk:clamp(.25+si*.075,.2,1),t:0,mx:0,my:0}:null,deck:deckOf(i),lastX:-9,dEnd:-9,x:0,y:0,vx:0,vy:0,ang:Math.random()*TAU,spin:100,bm:0,st:'on',dashT:0,cd:0,railCD:0,last:-1,lastT:-9,out:0,ox:0,oy:0,ta:0,hs:0}); }
  const teamKey=f=>f.team!=null?'t'+f.team:'p'+f.i;
  const keys=[...new Set(T.map(teamKey))],score={}; keys.forEach(k=>score[k]=0);
  const keyName=k=>k[0]==='t'?R.TEAMS[+k.slice(1)].name:R.names[+k.slice(1)];
  const setP=f=>{ f.P=f.deck[(round-1)%f.deck.length]; f.k=statsOf(f.P); f.col=TOP[f.P.top].c; };
  const rdy=T.map(f=>!f.human); let ed=local2?0:me,cur=0,waiting=false,deckT=net?60:0;
  let t=0,rt=0,round=0,phase='ready',PT=opts.preview?.2:2.6,fx=[],deb=[],ban=null,ev=[],shake=0,hitstop=0,ended=false,sendT=0,lastBeep=9,winKey=null,inBuf={},sentDash=0,myIn={...NOIN},windA=0;
  const snd=k=>{ if(opts.preview) return; env.sfx(k); if(host&&net) ev.push(['s',k]); };
  const addFx=(k,x,y,a,b)=>{ spawn(k,x,y,a,b); if(host&&net) ev.push([k,R1(x),R1(y),a==null?0:a,b==null?0:b]); };
  function spawn(k,x,y,a,b){
    if(k==='spark'){ const n=Math.min(40,6+a*.08); for(let i=0;i<n;i++){ const q=Math.random()*TAU,s=80+Math.random()*(160+a*.6); fx.push({k:'sp',x,y,z:8,vx:Math.cos(q)*s,vy:Math.sin(q)*s,vz:60+Math.random()*120,l:.25+Math.random()*.35,c:Math.random()<.5?'#fff6c0':'#ffb02a'}); }
      fx.push({k:'ring',x,y,l:.3,L:.3,r:a>260?90:50,c:a>260?'#ffd23f':'#ffffff'}); if(a>260) fx.push({k:'flash',l:.12,L:.12}); }
    else if(k==='dash'){ for(let i=0;i<14;i++) fx.push({k:'sp',x:x+(Math.random()-.5)*16,y:y+(Math.random()-.5)*16,z:4,vx:(Math.random()-.5)*200,vy:(Math.random()-.5)*200,vz:80+Math.random()*80,l:.3+Math.random()*.3,c:i%2?'#ff7a3d':'#ffe060'}); fx.push({k:'ring',x,y,l:.35,L:.35,r:60,c:'#ff9d3d'}); }
    else if(k==='trail') fx.push({k:'tr',x,y,l:.35,L:.35,c:a||'#ffb02a'});
    else if(k==='land') { fx.push({k:'ring',x,y,l:.45,L:.45,r:70,c:'#ffffff'}); for(let i=0;i<10;i++){ const q=Math.random()*TAU; fx.push({k:'sm',x,y,vx:Math.cos(q)*60,vy:Math.sin(q)*60,l:.6,L:.6}); } }
    else if(k==='burst'){ const f=T[a]; for(let i=0;i<50;i++){ const q=Math.random()*TAU,s=100+Math.random()*320; fx.push({k:'sp',x,y,z:12,vx:Math.cos(q)*s,vy:Math.sin(q)*s,vz:100+Math.random()*200,l:.4+Math.random()*.5,c:['#fff','#ffd23f','#ff7a3d',f?f.col:'#fff'][i%4]}); }
      fx.push({k:'ring',x,y,l:.6,L:.6,r:160,c:'#ff7a3d'}); fx.push({k:'flash',l:.22,L:.22});
      if(f) for(let j=0;j<3;j++){ const q=Math.random()*TAU; deb.push({p:j,x,y,z:14,vx:Math.cos(q)*(140+Math.random()*120),vy:Math.sin(q)*(140+Math.random()*120),vz:220+Math.random()*120,ang:0,va:(Math.random()-.5)*30,P:f.P,col:f.col,l:3}); } }
    else if(k==='out'){ fx.push({k:'ring',x,y,l:.5,L:.5,r:120,c:b==='x'?'#ffd23f':'#3d8bff'}); for(let i=0;i<30;i++){ const q=Math.random()*TAU; fx.push({k:'sp',x,y,z:4,vx:Math.cos(q)*240,vy:Math.sin(q)*240,vz:150,l:.5,c:b==='x'?'#ffd23f':'#9ac8ff'}); } } }
  function setupRound(){ round++; rt=0; phase='ready'; PT=opts.preview?.1:2.6; lastBeep=9; deb=[]; if(!client) T.forEach(setP);
    const a0=Math.random()*TAU; T.forEach((f,k)=>{ const a=a0+k/T.length*TAU,r=AR*.55; f.x=Math.cos(a)*r; f.y=Math.sin(a)*r; const d=f.k.dir; f.vx=-Math.sin(a)*120*d-Math.cos(a)*30; f.vy=Math.cos(a)*120*d-Math.sin(a)*30;
      f.spin=f.ai?clamp(86+f.ai.sk*14+Math.random()*4,80,100):100; f.bm=0; f.st='on'; f.dashT=0; f.cd=1; f.railCD=0; f.last=-1; f.lastT=-9; f.out=0; f.lastX=-9; f.dEnd=-9; }); }
  setupRound(); if(FMT3&&!R.pv&&R.humans) phase='deck';
  // 一對一：每人帶 3 顆，開賽前組 3 顆陀螺、排出場順序（刀刃、棘輪、底座都不能重複）
  const CW=228,CX0=i=>34+i*252,CY0=70,SELY=CY0+192,BTN=[W/2-100,436,200,46];
  function cyc(d,slot,dir){ let i=TOPS.findIndex(q=>q.id===d[slot].top); for(let k=0;k<TOPS.length;k++){ i=(i+dir+TOPS.length)%TOPS.length; if(!clash(d,slot,TOPS[i].id)){ d[slot]=partsOf({top:TOPS[i].id}); break; } } env.sfx('click'); }
  function confirmDeck(){ const f=T[ed]; f.deck=fixDeck(f.deck); env.sfx('item');
    if(ed===0||(net&&ed===me)) try{ localStorage.setItem('arcade.spin.deck2',JSON.stringify(f.deck.map(q=>({top:q.top})))); }catch(e){}
    if(client){ waiting=true; net.send({deck:f.deck.map(q=>({top:q.top}))}); return; }
    rdy[ed]=true; if(local2&&ed===0){ ed=1; cur=0; } else waiting=true; }
  function deckKeys(){ if(waiting) return; const h=c2=>env.hit(c2); let U,D,L,Rt,A;
    if(local2&&ed===0){ U=h('KeyW'); D=h('KeyS'); L=h('KeyA'); Rt=h('KeyD'); A=h('KeyF')||h('Space'); }
    else if(local2){ U=h('ArrowUp'); D=h('ArrowDown'); L=h('ArrowLeft'); Rt=h('ArrowRight'); A=h('Enter'); }
    else { U=h('ArrowUp')||h('KeyW'); D=h('ArrowDown')||h('KeyS'); L=h('ArrowLeft')||h('KeyA'); Rt=h('ArrowRight')||h('KeyD'); A=h('Space')||h('Enter')||h('KeyX'); }
    if(U) cur=(cur+3)%4; if(D) cur=(cur+1)%4; const d=T[ed].deck;
    if((L||Rt)&&cur<3) cyc(d,cur,Rt?1:-1);
    if(A){ if(cur===3) confirmDeck(); else cur=3; } }
  const inR=(x,y,r)=>x>=r[0]&&x<=r[0]+r[2]&&y>=r[1]&&y<=r[1]+r[3];
  function onDown(e){ if(phase!=='deck'||waiting) return; const r=canvas.getBoundingClientRect(),k=Math.min(r.width/W,r.height/H),x=(e.clientX-r.left-(r.width-W*k)/2)/k,y=(e.clientY-r.top-(r.height-H*k)/2)/k,d=T[ed].deck;
    if(inR(x,y,BTN)){ confirmDeck(); return; }
    for(let i=0;i<3;i++){ const X=CX0(i); if(inR(x,y,[X+2,SELY-18,44,36])){ cur=i; cyc(d,i,-1); return; } if(inR(x,y,[X+CW-46,SELY-18,44,36])){ cur=i; cyc(d,i,1); return; }
      if(inR(x,y,[X,CY0,CW,350])){ cur=i; return; }
      if(i<2&&inR(x,y,[X+CW,CY0+96,24,60])){ const tmp=d[i]; d[i]=d[i+1]; d[i+1]=tmp; env.sfx('place'); return; } } }
  if(canvas&&canvas.addEventListener&&FMT3){ canvas.addEventListener('pointerdown',onDown); canvas.style.touchAction='none'; }
  function drawDeck(){ themeBg(c,ST.th,t); c.fillStyle='rgba(8,8,20,.72)'; c.fillRect(0,0,W,H); const d=T[ed].deck;
    c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 22px '+TC; c.fillText((local2?(ed+1)+'P ':'')+'選 3 顆陀螺、排好出場順序（每回合派一顆上場）',W/2,24);
    c.fillStyle='rgba(255,255,255,.75)'; c.font='700 13px '+TC; c.fillText('三顆的機體、棘輪、底座都不能重複　按 ◀ ▶ 換陀螺、按 ⇄ 換出場順序'+(net?'　還剩 '+Math.max(0,Math.ceil(deckT))+' 秒':''),W/2,50);
    for(let i=0;i<3;i++){ const X=CX0(i),P=d[i],B=TOP[P.top],sel=cur===i; c.fillStyle='rgba(255,255,255,.08)'; rr(c,X,CY0,CW,354,14); c.fill(); c.strokeStyle=sel?'#ffd23f':'rgba(255,255,255,.2)'; c.lineWidth=2; c.stroke();
      c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText('第 '+(i+1)+' 顆出場',X+CW/2,CY0+18);
      c.fillStyle='rgba(255,255,255,.08)'; c.beginPath(); c.ellipse(X+CW/2,CY0+118,72,72*SQ,0,0,TAU); c.fill(); drawTop(c,X+CW/2,CY0+124,2.4,P,0,t*B.dir*4,.7);
      c.fillStyle=sel?'rgba(255,210,63,.25)':'rgba(0,0,0,.3)'; rr(c,X+6,SELY-17,CW-12,34,8); c.fill();
      c.fillStyle=sel?'#ffd23f':'#cfd6e2'; c.font='900 20px '+TC; c.fillText('◀',X+24,SELY+1); c.fillText('▶',X+CW-24,SELY+1);
      c.fillStyle='#fff'; c.font='900 16px '+TC; c.fillText(B.n,X+CW/2,SELY+1);
      c.fillStyle='#9ac8ff'; c.font='700 12px '+TC; c.fillText(B.code+'　'+B.rat+' '+BITN[B.bit],X+CW/2,SELY+30);
      c.fillStyle=TYPES[B.type]?['#ff6a5a','#5aa8ff','#5fd068','#ffd23f','#c8a0ff'][Object.keys(TYPES).indexOf(B.type)]:'#fff'; c.font='900 13px '+TC; c.fillText(B.type+(B.type==='左旋'?'特化型':'型'),X+CW/2,SELY+52);
      c.fillStyle='rgba(255,255,255,.8)'; c.font='700 12px '+TC; wrapText(c,B.feat,X+CW/2,SELY+76,CW-24,17,4);
      if(i<2){ c.fillStyle='#3d8bff'; rr(c,X+CW+1,CY0+96,22,60,8); c.fill(); c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText('⇄',X+CW+12,CY0+126); } }
    c.fillStyle=cur===3?'#ffd23f':'#3ed16a'; rr(c,BTN[0],BTN[1],BTN[2],BTN[3],12); c.fill(); c.fillStyle='#14122b'; c.font='900 18px '+TC; c.fillText(local2&&ed===0?'確定，換 2P':'確定出場',W/2,BTN[1]+24);
    if(waiting){ c.fillStyle='rgba(8,8,20,.7)'; c.fillRect(0,0,W,H); c.fillStyle='#fff'; c.font='900 24px '+TC; c.fillText('等對手組好陀螺…',W/2,H/2); } }
  // 終結判定與給分
  function finish(f,kind,pk){ if(f.st!=='on') return; f.st=kind==='spin'?'stop':kind==='burst'?'burst':'out'; f.out=0; f.ox=f.x; f.oy=f.y;
    const vk=teamKey(f); let to=null; if(f.last>=0&&rt-f.lastT<4&&teamKey(T[f.last])!==vk&&T[f.last].st==='on') to=teamKey(T[f.last]);
    if(!to){ const alive=[...new Set(T.filter(q=>q.st==='on'&&teamKey(q)!==vk).map(teamKey))]; if(alive.length===1) to=alive[0]; }
    const F=FIN[kind]; if(to) score[to]+=F.p;
    if(kind==='burst') addFx('burst',f.x,f.y,f.i); else if(kind!=='spin') addFx('out',f.x,f.y,0,kind);
    snd(kind==='spin'?'die':'boom'); if(kind!=='spin'){ shake=Math.max(shake,.35); hitstop=Math.max(hitstop,.12); }
    ban={k:kind,who:f.i,to,t:0}; if(host&&net) ev.push(['b',kind,f.i,to||'']); if(to) setTimeout(()=>{},0); }
  function endRound(){ phase='after'; PT=2.4; }
  function aliveKeys(){ return [...new Set(T.filter(q=>q.st==='on').map(teamKey))]; }
  // 電腦
  function aiIn(f,dt){ const a=f.ai; a.t-=dt; if(a.t>0) return {mx:a.mx,my:a.my,dash:false}; a.t=.12+(1-a.sk)*.25;
    let tg=null,bd=1e9; for(const q of T) if(q!==f&&q.st==='on'&&teamKey(q)!==teamKey(f)){ const d=hyp(q.x-f.x,q.y-f.y); if(d<bd){ bd=d; tg=q; } }
    const B=TOP[f.P.top],aggr=B.type==='攻擊'||B.type==='左旋'?1:B.type==='平衡'?.7:.35,r=hyp(f.x,f.y),ang=Math.atan2(f.y,f.x);
    let mx=0,my=0,dash=false;
    if(tg){ const lead=.25,px=tg.x+tg.vx*lead,py=tg.y+tg.vy*lead,dx=px-f.x,dy=py-f.y,d=hyp(dx,dy)||1;
      if(Math.random()<aggr) { mx=dx/d; my=dy/d; } else { mx=-f.x/(r||1)*.8; my=-f.y/(r||1)*.8; }
      // 從對手外側撞，把它往口袋推
      const tr=hyp(tg.x,tg.y); if(tr>AR*.55&&inPk(ST,Math.atan2(tg.y,tg.x),.35)&&Math.random()<a.sk){ const ox=tg.x-tg.x/tr*30,oy=tg.y-tg.y/tr*30,qx=ox-f.x,qy=oy-f.y,qd=hyp(qx,qy)||1; mx=qx/qd; my=qy/qd; }
      if(f.cd<=0&&Math.random()<a.sk*.5){ if(r>AR-50&&Math.random()<aggr) dash=true; else if(d<110&&aggr>.5) dash=true; } }
    // 別自己掉進口袋
    if(r>AR-60&&inPk(ST,ang,.3)&&Math.random()<.4+a.sk*.6){ mx=-f.x/r; my=-f.y/r; }
    if(f.spin<30&&B.type!=='攻擊'){ mx*=.3; my*=.3; }
    const m=.45+.55*a.sk+(Math.random()-.5)*.3*(1-a.sk); a.mx=mx*m+(Math.random()-.5)*(1-a.sk)*.6; a.my=my*m+(Math.random()-.5)*(1-a.sk)*.6; return {mx:a.mx,my:a.my,dash}; }
  function useDash(f){ if(f.cd>0||f.st!=='on') return; f.cd=3; f.spin=Math.max(1,f.spin-2); const r=hyp(f.x,f.y);
    if(r>AR-46){ f.dashT=.42; f.railCD=1; addFx('dash',f.x,f.y); snd('boost'); }
    else { let tg=null,bd=1e9; for(const q of T) if(q!==f&&q.st==='on'&&teamKey(q)!==teamKey(f)){ const d=hyp(q.x-f.x,q.y-f.y); if(d<bd){ bd=d; tg=q; } }
      const dx=tg?tg.x-f.x:f.vx,dy=tg?tg.y-f.y:f.vy,d=hyp(dx,dy)||1,s=250*Math.sqrt(f.k.mv); f.vx=f.vx*.4+dx/d*s; f.vy=f.vy*.4+dy/d*s; addFx('trail',f.x,f.y,'#ffffff'); snd('skid'); } }
  function stepTop(f,inp,h){ const K=f.k,frac=f.spin/100;
    f.ang+=K.dir*(6+34*frac)*h; if(f.cd>0) f.cd-=h; if(f.railCD>0) f.railCD-=h;
    let r=hyp(f.x,f.y)||.001,nx=f.x/r,ny=f.y/r,tx=-ny*K.dir,ty=nx*K.dir;
    let ax=-f.x*1.3*ST.slope,ay=-f.y*1.3*ST.slope;
    ax+=tx*120*K.wander*K.mv*frac; ay+=ty*120*K.wander*K.mv*frac;
    const im=hyp(inp.mx,inp.my); if(im>0){ const q=Math.min(1,im)/im,pw=320*K.mv*(.35+.65*frac); ax+=inp.mx*q*pw; ay+=inp.my*q*pw; }
    if(ST.wind){ const wd=Math.sin(windA)>0?1:-1; ax+=-ny*wd*70; ay+=nx*wd*70; }
    if(f.dashT>0){ f.dashT-=h; ax+=tx*1100*K.dash*(ST.lava?1.3:1); ay+=ty*1100*K.dash*(ST.lava?1.3:1); if(Math.random()<.6) spawn('trail',f.x,f.y,'#ff9d3d');
      if(f.dashT<=0){ f.vx-=nx*170; f.vy-=ny*170; f.dEnd=rt; } }
    f.vx+=ax*h; f.vy+=ay*h; const damp=Math.exp(-h*ST.fric*(.35+.35/K.mv)*(f.spin<20?2:1)); f.vx*=damp; f.vy*=damp;
    const vmax=f.dashT>0?620:520,v=hyp(f.vx,f.vy); if(v>vmax){ f.vx*=vmax/v; f.vy*=vmax/v; }
    f.x+=f.vx*h; f.y+=f.vy*h;
    r=hyp(f.x,f.y); nx=f.x/r; ny=f.y/r; const wall=AR-RAD+6;
    if(r>wall){ const pk=inPk(ST,Math.atan2(f.y,f.x));
      if(pk){ if(r>AR+6){ finish(f,f.last>=0&&rt-f.lastX<1.5?'x':'over',pk); return; } } /* 被衝刺中的對手撞出去＝極限勝 */
      else { const vr=f.vx*nx+f.vy*ny; if(vr>0){ f.vx-=vr*nx*1.45; f.vy-=vr*ny*1.45; } f.x=nx*wall; f.y=ny*wall;
        const vt=f.vx*(-ny*K.dir)+f.vy*(nx*K.dir);
        if(f.dashT<=0&&f.railCD<=0&&f.spin>25&&vt>50&&Math.random()<.02*K.dash*(1+vt/200)){ f.dashT=.34; f.railCD=1.6; addFx('dash',f.x,f.y); snd('boost'); }
        if(ST.lava) f.spin-=h*4; } }
    f.spin-=h*(2.1+hyp(f.vx,f.vy)/260)/K.sta*ST.decay; if(f.spin<=0){ f.spin=0; finish(f,'spin'); } }
  function collide(a,b){ const dx=b.x-a.x,dy=b.y-a.y,d=hyp(dx,dy); if(d>=RAD*2||d<.01) return; const nx=dx/d,ny=dy/d,ma=a.k.wgt,mb=b.k.wgt,ov=RAD*2-d;
    a.x-=nx*ov*mb/(ma+mb); a.y-=ny*ov*mb/(ma+mb); b.x+=nx*ov*ma/(ma+mb); b.y+=ny*ov*ma/(ma+mb);
    const vn=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny; if(vn>-10) return;
    const fa=a.spin/100,fb=b.spin/100,same=a.k.dir===b.k.dir,ex=(same?220:80)*(a.k.atk*fa+b.k.atk*fb)/2+(a.dashT>0||b.dashT>0?140:0);
    const j=-(1.55)*vn/(1/ma+1/mb),I=-vn+ex*.6;
    const kb=(j+ex)*a.k.atk/b.k.def/mb*(1-.12*b.k.low),ka=(j+ex)*b.k.atk/a.k.def/ma*(1-.12*a.k.low);
    b.vx+=nx*kb; b.vy+=ny*kb; a.vx-=nx*ka; a.vy-=ny*ka;
    b.spin-=I*.03*a.k.atk/b.k.def; a.spin-=I*.03*b.k.atk/a.k.def;
    if(!same){ const m=(a.spin+b.spin)/2; a.spin+=(m-a.spin)*.12; b.spin+=(m-b.spin)*.12; }
    const thr=260;
    if(I>thr){ b.bm+=(I-thr)*.13*a.k.atk/(b.k.def*b.k.res)*(.4+Math.random()); a.bm+=(I-thr)*.13*b.k.atk/(a.k.def*a.k.res)*(.4+Math.random()); }
    if(a.bm>=100&&b.bm>=100){ if(a.bm>b.bm) b.bm=99; else a.bm=99; } /* 同時爆裂只算一顆 */
    a.last=b.i; a.lastT=rt; b.last=a.i; b.lastT=rt; a.hs++; b.hs++;
    if(a.dashT>0||rt-a.dEnd<.4) b.lastX=rt; if(b.dashT>0||rt-b.dEnd<.4) a.lastX=rt;
    const mx=(a.x+b.x)/2,my=(a.y+b.y)/2; addFx('spark',mx,my,Math.round(I)); snd(I>260?'hurt':'bump');
    if(I>260){ hitstop=Math.max(hitstop,.07); shake=Math.max(shake,.22); }
    for(const f of [a,b]) if(f.bm>=100&&f.st==='on') finish(f,'burst');
    if(a.spin<=0&&a.st==='on'){ a.spin=0; finish(a,'spin'); } if(b.spin<=0&&b.st==='on'){ b.spin=0; finish(b,'spin'); } }
  // 連線
  const pk=f=>[R1(f.x),R1(f.y),R1(f.vx),R1(f.vy),R1(f.spin),Math.round(f.bm),f.st,R1(f.dashT),R1(f.cd),R1(f.ox),R1(f.oy),R1(f.out),f.P.blade,f.P.ratchet,f.P.bit];
  if(net){
    if(client) net.onmsg=m=>{ if(m.s){ m.s.f.forEach((a,i)=>{ const f=T[i]; if(!f) return; f.x=a[0]; f.y=a[1]; f.vx=a[2]; f.vy=a[3]; f.spin=a[4]; f.bm=a[5]; if(f.st!==a[6]&&a[6]!=='on'){ f.ta=Math.random()*TAU; } f.st=a[6]; f.dashT=a[7]; f.cd=a[8]; f.ox=a[9]; f.oy=a[10]; f.out=a[11]; if(a[12]&&f.P.top!==a[12]&&TOP[a[12]]){ f.P=partsOf({top:a[12]}); f.k=statsOf(f.P); f.col=TOP[a[12]].c; } });
        Object.assign(score,m.s.sc); phase=m.s.ph; PT=m.s.pt; round=m.s.rd; rt=m.s.rt; windA=m.s.wa;
        for(const e of m.s.ev){ if(e[0]==='s') env.sfx(e[1]); else if(e[0]==='b'){ ban={k:e[1],who:e[2],to:e[3]||null,t:0}; if(e[1]!=='spin'){ shake=.35; } } else spawn(e[0],e[1],e[2],e[3],e[4]); } }
      if(m.end){ winKey=m.end; phase='over'; PT=2.6; } };
    else { net.onmsg=(m,from)=>{ if(m.deck&&T[from]&&phase==='deck'){ T[from].deck=fixDeck(m.deck.map(q=>({top:q&&q.top}))); rdy[from]=true; } if(m.i){ const b=inBuf[from]||(inBuf[from]={...NOIN,dn:0}); b.mx=m.i[0]; b.my=m.i[1]; if(m.i[2]>b.dn){ b.dash=true; b.dn=m.i[2]; } } };
      net.onleave=i=>{ const f=T[i]; if(f){ rdy[i]=true; f.remote=false; f.ai={sk:.6,t:0,mx:0,my:0}; R.names[i]+='（離開）'; } }; } }
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt;
    for(const e of fx){ e.l-=dt; if(e.k==='sp'){ e.x+=e.vx*dt; e.y+=e.vy*dt; e.z+=e.vz*dt; e.vz-=600*dt; if(e.z<0){ e.z=0; e.vz*=-.4; } e.vx*=.97; e.vy*=.97; } else if(e.k==='sm'){ e.x+=e.vx*dt; e.y+=e.vy*dt; } }
    fx=fx.filter(e=>e.l>0); if(fx.length>500) fx.splice(0,fx.length-500);
    for(const d of deb){ d.l-=dt; d.x+=d.vx*dt; d.y+=d.vy*dt; d.z+=d.vz*dt; d.vz-=700*dt; d.ang+=d.va*dt; if(d.z<0){ d.z=0; d.vz*=-.35; d.vx*=.6; d.vy*=.6; d.va*=.6; } }
    deb=deb.filter(d=>d.l>0);
    if(ban) ban.t+=dt; if(shake>0) shake-=dt;
    for(const f of T) if(f.st!=='on') f.out=Math.min(1.5,f.out+dt);
    if(hitstop>0){ hitstop-=dt; return; }
    if(phase==='deck'){ deckKeys(); if(net){ deckT-=dt; if(deckT<=0&&!waiting) confirmDeck(); }
      if(!client){ if(net&&deckT<-5) T.forEach((f,i)=>rdy[i]=true); if(rdy.every(Boolean)){ T.forEach(setP); phase='ready'; PT=2.6; waiting=false; }
        if(net){ sendT-=dt; if(sendT<=0){ sendT=1/10; net.send({s:{f:T.map(pk),sc:score,ph:phase,pt:R1(PT),rd:round,rt:0,wa:0,ev}}); ev=[]; } } }
      return; }
    // 自己的按鍵
    const lin=[]; for(const f of T) if(f.local) lin[f.i]=readIn(env,local2?f.i:0,local2);
    if(client){ const q=lin[me]||NOIN; if(q.dash) sentDash++; myIn=q; for(const f of T){ f.ang+=f.k.dir*(6+34*f.spin/100)*dt; if(f.st==='on'){ f.x+=f.vx*dt; f.y+=f.vy*dt; } }
      sendT-=dt; if(sendT<=0){ sendT=1/20; net.send({i:[myIn.mx,myIn.my,sentDash]}); } if(phase==='over'){ PT-=dt; if(PT<=0&&!ended){ ended=true; finishGame(); } } return; }
    if(phase==='ready'){ PT-=dt; const n=Math.ceil(PT-.6); if(n<lastBeep&&n>=1&&n<=3){ lastBeep=n; snd('beep'); } for(const f of T) f.ang+=f.k.dir*40*dt;
      if(PT<=.6&&lastBeep>0){ lastBeep=0; snd('go'); T.forEach(f=>addFx('land',f.x,f.y)); } if(PT<=0) phase='fight'; }
    else if(phase==='fight'||phase==='after'){ const steps=Math.max(1,Math.ceil(dt/(1/120))),h=dt/steps; rt+=dt; windA+=dt*Math.PI/6;
      const ins=T.map(f=>{ if(f.st!=='on') return NOIN; if(f.local) return lin[f.i]||NOIN; if(f.remote){ const b=inBuf[f.i]||NOIN,o={mx:b.mx||0,my:b.my||0,dash:!!b.dash}; if(inBuf[f.i]) inBuf[f.i].dash=false; return o; } return aiIn(f,dt); });
      if(phase==='fight') T.forEach((f,i)=>{ if(ins[i].dash) useDash(f); });
      for(let s=0;s<steps;s++){ for(let i=0;i<T.length;i++) if(T[i].st==='on') stepTop(T[i],phase==='fight'?ins[i]:NOIN,h);
        for(let i=0;i<T.length;i++) for(let k=i+1;k<T.length;k++) if(T[i].st==='on'&&T[k].st==='on') collide(T[i],T[k]); }
      if(phase==='fight'){ const ak=aliveKeys();
        if(ak.length<=1){ if(ak.length===1&&T.filter(q=>q.st==='on').length&&!ban) {} endRound(); }
        else if(rt>=RT){ /* 時間到：轉速最高的一方拿旋轉終結 */ let best=null,bs=-1; for(const f of T) if(f.st==='on'&&f.spin>bs){ bs=f.spin; best=f; } const loser=T.filter(f=>f.st==='on'&&teamKey(f)!==teamKey(best)); for(const f of loser){ f.last=best.i; f.lastT=rt; finish(f,'spin'); } endRound(); } }
      else { PT-=dt; if(PT<=0){ const top=Object.keys(score).filter(k=>score[k]>=TARGET).sort((a,b)=>score[b]-score[a]); if(top.length){ winKey=top[0]; phase='over'; PT=2.8; snd('win'); if(net) net.send({end:winKey}); } else { ban=null; setupRound(); } } } }
    else if(phase==='over'){ PT-=dt; if(PT<=0&&!ended){ ended=true; finishGame(); } }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/20; net.send({s:{f:T.map(pk),sc:score,ph:phase,pt:R1(PT),rd:round,rt:R1(rt),wa:R1(windA),ev}}); ev=[]; } } }
  function finishGame(){ if(opts.preview){ env.end({}); return; } const myKey=teamKey(T[me]),won=winKey===myKey;
    const rows=keys.slice().sort((a,b)=>score[b]-score[a]).map((k,i)=>'<tr><td>'+(i+1)+'</td><td>'+keyName(k)+'</td><td>'+score[k]+' 分</td></tr>').join('');
    if(won&&!net&&!local2) recWin(ST.name);
    env.sfx(won||local2?'win':'lose');
    env.end({title:local2?keyName(winKey)+' 獲勝！':won?'你贏了！':keyName(winKey)+' 獲勝',big:ST.name,html:'<table class="ls"><tr><th>名次</th><th>選手</th><th>得分</th></tr>'+rows+'</table>',
      text:'持久勝 1 分、擊飛勝 2 分、爆裂勝 2 分、極限勝 3 分，先拿 '+TARGET+' 分的贏。'+'（每人 3 顆輪流上場）',score:null,next:!net&&!local2&&won&&si<STAGES.length-1}); }
  // 畫面
  function topScreen(f){ let x=f.x,y=f.y,z=0;
    if(f.st==='out'){ const u=Math.min(1,f.out/.6),r=hyp(f.ox,f.oy)||1; x=f.ox+f.ox/r*40*u; y=f.oy+f.oy/r*40*u; z=-30*u*u; }
    return [sx(x),sy(y)-z]; }
  function draw(){ if(phase==='deck'){ drawDeck(); return; } c.save(); themeBg(c,ST.th,t); if(shake>0) c.translate((Math.random()-.5)*shake*30,(Math.random()-.5)*shake*30);
    c.drawImage(bg,0,0,W,H);
    // 地上的軌跡與煙
    for(const e of fx){ if(e.k==='tr'){ c.globalAlpha=e.l/e.L*.7; c.fillStyle=e.c; c.beginPath(); c.ellipse(sx(e.x),sy(e.y)-4,14*e.l/e.L+3,(14*e.l/e.L+3)*SQ,0,0,TAU); c.fill(); }
      else if(e.k==='sm'){ c.globalAlpha=e.l/e.L*.4; c.fillStyle='#ddd'; c.beginPath(); c.arc(sx(e.x),sy(e.y)-6,8+(1-e.l/e.L)*14,0,TAU); c.fill(); } }
    c.globalAlpha=1;
    for(const d of deb){ c.globalAlpha=Math.min(1,d.l); const X=sx(d.x),Y=sy(d.y)-d.z;
      if(d.p===0){ c.save(); c.translate(X,Y); c.scale(1,SQ); c.rotate(d.ang); bladePath(c,TOP[d.P.top].sh,20*S*.62); c.fillStyle='#c8ccd6'; c.fill(); bladePath(c,TOP[d.P.top].sh,20*S*.45); c.fillStyle=d.col; c.fill(); c.restore(); }
      else if(d.p===1){ c.fillStyle='#4a4f5c'; c.beginPath(); c.ellipse(X,Y,9,9*SQ,d.ang,0,TAU); c.fill(); c.fillStyle='#70778a'; c.beginPath(); c.ellipse(X,Y,5,5*SQ,0,0,TAU); c.fill(); }
      else { c.fillStyle='#2a2d36'; c.beginPath(); c.moveTo(X-5,Y-4); c.lineTo(X+5,Y-4); c.lineTo(X,Y+5); c.fill(); } }
    c.globalAlpha=1;
    const order=T.slice().sort((a,b)=>a.y-b.y);
    for(const f of order){ const [X,Y]=topScreen(f),frac=f.spin/100;
      if(f.st==='burst') continue;
      if(f.st==='out'&&f.out>.6) continue;
      let tilt=0,ta=0; if(f.st==='on'&&f.spin<28){ tilt=(28-f.spin)/28*7; ta=t*(10-f.spin*.2); } if(f.st==='stop'){ tilt=12; ta=f.ta||.7; }
      if(f.st==='out'){ c.globalAlpha=1-Math.min(1,f.out/.6); }
      const ringC=f.team!=null?R.TEAMS[f.team].col:null;
      drawTop(c,X,Y,S*TS,f.P,f.col,f.ang,f.st==='on'?frac:0,{tilt,ta,ring:ringC,still:f.st!=='on'});
      c.globalAlpha=1;
      if(f.dashT>0){ c.strokeStyle='rgba(255,157,61,.9)'; c.lineWidth=3; c.beginPath(); c.ellipse(X,Y-10,36,36*SQ,0,0,TAU); c.stroke(); }
      if(f.st==='on'&&phase!=='over'){ const nm=R.names[f.i].slice(0,6),mine=local2?f.human:f.i===me&&f.human; c.font='900 11px '+TC; c.textAlign='center'; c.textBaseline='middle'; const w2=c.measureText(nm).width+12;
        c.fillStyle=mine?'#ffd23f':'rgba(11,10,28,.7)'; rr(c,X-w2/2,Y+14,w2,15,7); c.fill(); c.fillStyle=mine?'#14122b':'#fff'; c.fillText(nm,X,Y+22);
        if(phase==='ready'&&f.human&&round===1&&!opts.preview) meArrow(c,X,Y-46,local2?(f.i+1)+'P':net?'你':'你',t); } }
    // 火花、衝擊波
    for(const e of fx){ if(e.k==='sp'){ c.globalAlpha=Math.min(1,e.l*3); c.strokeStyle=e.c; c.lineWidth=2.2; const X=sx(e.x),Y=sy(e.y)-e.z; c.beginPath(); c.moveTo(X,Y); c.lineTo(X-e.vx*.03*S,Y-e.vy*.03*S*SQ+e.vz*.02); c.stroke(); }
      else if(e.k==='ring'){ const a=e.l/e.L; c.globalAlpha=a; c.strokeStyle=e.c; c.lineWidth=8*a+1; c.beginPath(); c.ellipse(sx(e.x),sy(e.y)-8,(1-a)*e.r*S+8,((1-a)*e.r*S+8)*SQ,0,0,TAU); c.stroke(); } }
    c.globalAlpha=1; c.restore();
    for(const e of fx) if(e.k==='flash'){ c.fillStyle='rgba(255,250,230,'+(e.l/e.L*.55)+')'; c.fillRect(0,0,W,H); }
    hud(); }
  function hud(){ const n=keys.length,cw=Math.min(190,(W-20)/n-8);
    keys.forEach((k,j)=>{ const x=10+j*(cw+8),mem=T.filter(f=>teamKey(f)===k),col=k[0]==='t'?R.TEAMS[+k.slice(1)].col:mem[0].col;
      c.fillStyle='rgba(11,10,28,.78)'; rr(c,x,8,cw,50,10); c.fill(); c.fillStyle=col; rr(c,x,8,6,50,3); c.fill();
      c.fillStyle='#fff'; c.font='900 13px '+TC; c.textAlign='left'; c.textBaseline='middle'; c.fillText(keyName(k).slice(0,7),x+14,21);
      for(let p=0;p<TARGET;p++){ c.fillStyle=p<score[k]?'#ffd23f':'rgba(255,255,255,.18)'; c.beginPath(); c.arc(x+cw-12-(TARGET-1-p)*13,21,5,0,TAU); c.fill(); }
      mem.forEach((f,q)=>{ const y=34+q*(mem.length>1?10:0),bw=cw-24,hh=mem.length>1?6:9; c.fillStyle='rgba(255,255,255,.15)'; c.fillRect(x+14,y,bw,hh); const fr=f.st==='on'?f.spin/100:0; c.fillStyle=fr>.5?'#3ed16a':fr>.25?'#ffc21a':'#ff4d4d'; c.fillRect(x+14,y,bw*fr,hh);
        if(f.st==='on'&&f.bm>0){ c.fillStyle='#ff7a3d'; c.fillRect(x+14,y+hh,bw*Math.min(1,f.bm/100),2); } });
      { const f=mem[0],ci=(round-1)%3,B=TOP[f.P.top]; c.fillStyle='rgba(11,10,28,.78)'; rr(c,x,60,cw,20,8); c.fill(); let tx0=x+10; if(FMT3){ for(let q=0;q<3;q++){ c.fillStyle=q===ci?'#ffd23f':'rgba(255,255,255,.25)'; c.beginPath(); c.arc(x+14+q*14,70,5,0,TAU); c.fill(); } tx0=x+52; } c.fillStyle='#fff'; c.font='700 11px '+TC; c.textAlign='left'; c.fillText(B.code+' '+B.n+'（'+B.type+'）',tx0,70); } });
    c.textAlign='center'; c.textBaseline='middle'; c.font='900 13px '+TC; c.fillStyle='rgba(255,255,255,.8)';
    if(phase==='fight'){ c.textAlign='right'; c.fillText('第 '+round+' 回合　'+Math.max(0,Math.ceil(RT-rt))+' 秒',W-12,H-14); c.textAlign='center'; }
    if(phase==='ready'){ const n=Math.ceil(PT-.6),s=n>=1?String(Math.min(3,n)):'發射！'; c.font='900 '+(n>=1?64:56)+'px '+TC; c.lineWidth=8; c.strokeStyle='#0b0a1c'; c.strokeText(s,W/2,CY-10); c.fillStyle=n>=1?'#fff':'#ffd23f'; c.fillText(s,W/2,CY-10);
      c.font='900 18px '+TC; const rs='第 '+round+' 回合'; c.lineWidth=5; c.strokeText(rs,W/2,CY-62); c.fillStyle='#fff'; c.fillText(rs,W/2,CY-62);
      { const vs=TOP[T[0].P.top].n+'　對　'+TOP[T[1].P.top].n; c.font='900 16px '+TC; c.strokeText(vs,W/2,CY+40); c.fillStyle='#ffd23f'; c.fillText(vs,W/2,CY+40); } }
    if(ban&&ban.t<2.2&&phase!=='ready'){ const F=FIN[ban.k],u=Math.min(1,ban.t*5),sc=1+(1-u)*.8; c.save(); c.translate(W/2,CY-118); c.scale(sc,sc); c.globalAlpha=Math.min(1,(2.2-ban.t)*3);
      c.font='900 40px '+TC; c.lineWidth=8; c.strokeStyle='#0b0a1c'; c.strokeText(F.n+'！',0,0); c.fillStyle=F.col; c.fillText(F.n+'！',0,0);
      c.font='900 18px '+TC; const s2=ban.to?keyName(ban.to)+' +'+F.p+' 分':R.names[ban.who]+' 出局'; c.lineWidth=5; c.strokeText(s2,0,34); c.fillStyle='#fff'; c.fillText(s2,0,34); c.restore(); }
    if(phase==='over'&&winKey){ c.fillStyle='rgba(11,10,28,.35)'; c.fillRect(0,0,W,H); for(let i=0;i<50;i++){ c.fillStyle=PCOL[i%4]; c.fillRect((i*97+t*50*(i%3+1))%W,(i*53+t*140*(1+i%4))%H,6,9); }
      const s=keyName(winKey)+' 獲勝！'; c.font='900 44px '+TC; c.lineWidth=9; c.strokeStyle='#0b0a1c'; c.strokeText(s,W/2,CY-30); c.fillStyle='#ffd23f'; c.fillText(s,W/2,CY-30); } }
  return {update,draw,destroy(){ if(canvas&&canvas.removeEventListener) canvas.removeEventListener('pointerdown',onDown); },_dbg:{T,get ed(){return ed;},confirmDeck,cyc,get score(){return score;},get phase(){return phase;},get round(){return round;},finish,useDash,setPT(v){PT=v;}}};
}
// 開始畫面：場地＋兩顆陀螺互撞
function stageShow(ctx,w,h,si,t){ ctx.save(); ctx.scale(w/W,h/H); themeBg(ctx,STAGES[si].th,t); ctx.drawImage(stadium(si),0,0,W,H);
  const a=t*1.3,r=90+Math.sin(t*.8)*40;
  drawTop(ctx,sx(Math.cos(a)*r),sy(Math.sin(a)*r),S*TS,{top:OPP[(si*2+1)%OPP.length]},0,t*30,1);
  drawTop(ctx,sx(Math.cos(a+2.6)*r*.8),sy(Math.sin(a+2.6)*r*.8),S*TS,{top:OPP[(si*2)%OPP.length]},0,-t*30,1); ctx.restore(); }
function preview(ctx,w,h,L,t){ const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#1d2a44'); g.addColorStop(1,'#0b0a1c'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  const P=partsOf(L),B=TOP[P.top],K=statsOf(P),s=Math.min(w,h)/88;
  ctx.fillStyle='rgba(255,255,255,.08)'; ctx.beginPath(); ctx.ellipse(w*.27,h*.62,w*.22,w*.22*SQ,0,0,TAU); ctx.fill();
  drawTop(ctx,w*.27,h*.68,s,P,0,t*B.dir*3,.6);
  const x0=w*.52,bw=w*.44,fs=Math.round(h*.055); ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.font='900 '+Math.round(h*.075)+'px '+TC; ctx.fillStyle='#ffd23f'; ctx.fillText(B.n,x0,h*.1);
  ctx.font='700 '+fs+'px '+TC; ctx.fillStyle='#9ac8ff'; ctx.fillText(B.code+'　'+B.rat+' '+BITN[B.bit]+(B.dir<0?'　左旋':''),x0,h*.2);
  ctx.fillStyle=['#ff6a5a','#5aa8ff','#5fd068','#ffd23f','#c8a0ff'][Object.keys(TYPES).indexOf(B.type)]; ctx.font='900 '+fs+'px '+TC; ctx.fillText('類型：'+B.type+(B.type==='左旋'?'特化型':'型'),x0,h*.3);
  ctx.fillStyle='rgba(255,255,255,.85)'; ctx.font='700 '+Math.round(h*.048)+'px '+TC; wrapText(ctx,'特色：'+B.feat,x0,h*.4,bw,h*.07,3);
  const st=[['攻擊',K.atk/1.5],['防禦',K.def/1.6],['持久',K.sta/1.7],['衝刺',K.dash/1.7]];
  ctx.font='700 '+Math.round(h*.045)+'px '+TC; st.forEach(([n,v],i)=>{ const y=h*(.66+i*.085); ctx.fillStyle='#fff'; ctx.fillText(n,x0,y); ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(x0+h*.12,y-h*.016,bw-h*.12,h*.032); ctx.fillStyle=['#ff4d4d','#3d8bff','#3ed16a','#ff9d3d'][i]; ctx.fillRect(x0+h*.12,y-h*.016,(bw-h*.12)*clamp(v,.1,1),h*.032); }); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).spin={name:'陀螺旋風戰',tag:'SPIN STORM',color:'#ff7a3d',online:true,maxPlayers:2,
  desc:'20 顆熱門比賽陀螺一對一對決！蒼龍神劍、魔導神杖、鮫鯊狂鱗、蒼穹龍騎士…每顆的類型、棘輪、底座都不一樣，貼著場邊齒輪軌道能極限衝刺。每人帶 3 顆、每回合各派一顆上場，持久勝、擊飛勝、爆裂勝、極限勝，先拿 4 分的贏。10 座競技場：冰晶、沙漠、熔岩、星空低重力、暴風…',
  goal:'每回合各派一顆陀螺：比對手轉得久＝持久勝 1 分、撞出場外＝擊飛勝 2 分、撞到解體＝爆裂勝 2 分、衝刺中把對手撞出場外＝極限勝 3 分。先拿 4 分的贏。',
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  stageGoal:si=>{ const s=STAGES[si],h={ice:'冰面很滑，陀螺停不下來。',desert:'沙地摩擦大，轉速掉得快。',twin:'前後左右都有場外口袋。',lava:'碰到滾燙的軌道會掉轉速，但衝刺更猛。',space:'低重力，碗面拉回中間的力比較小。',storm:'暴風會把陀螺往一個方向吹，每隔幾秒換方向。',arena:'兩側的場外口袋特別寬。',final:'冠軍等級的對手。'}[s.th]||'';
    return s.name+'：先拿 4 分的贏。'+h; },
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['↑ ↓ ← →','推動陀螺'],['空白鍵 或 X','衝刺：在場邊＝極限衝刺，在中間＝衝向對手（3 秒一次）'],['出場順序','開賽前選 3 顆、排好順序，每回合換下一顆'],['雙人','1P 用 WASD＋F，2P 用方向鍵＋Enter'],['我的造型','選陀螺，點一下就會顯示它的類型和特色']],
  touchHelp:[['方向盤','推動陀螺'],['衝刺','在場邊＝極限衝刺，在中間＝衝向對手']],
  touch:{left:'dpad',right:[{l:'衝刺',c:'Space',act:true}]},
  looks:[{key:'top',label:'陀螺（點一下看類型和特色）',opts:TOPS.map(q=>({id:q.id,label:q.code+' '+q.n+'（'+q.type+'）'}))}],
  preview,
  hubBest:()=>{ const n=STAGES.filter(s=>hasWin(s.name)).length; return n?'贏過 <b>'+n+' / '+STAGES.length+'</b> 座競技場':'尚無紀錄'; },
  stageBest:i=>hasWin(STAGES[i].name)?'★ 贏過':'',
  stageShow,
  thumb:(ctx,w,h,t)=>{ stageShow(ctx,w,h,9,t); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.13)+'px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#0b0a1c'; ctx.strokeText('陀螺旋風戰',w/2,h*.13); ctx.fillStyle='#ffd23f'; ctx.fillText('陀螺旋風戰',w/2,h*.13); },
  create,_draw:{drawTop,STAGES,TOPS}};
})();
