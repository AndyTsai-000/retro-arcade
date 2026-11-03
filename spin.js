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
const BLADES={
  drake:{n:'龍牙刃',type:'攻擊',atk:1.35,def:.85,wgt:1,sta:.88,dir:1,emb:'tri'},
  shield:{n:'堡壘盾',type:'防禦',atk:.85,def:1.35,wgt:1.3,sta:1,dir:1,emb:'hex'},
  halo:{n:'光環輪',type:'持久',atk:.8,def:1,wgt:1.05,sta:1.32,dir:1,emb:'ring'},
  twin:{n:'雙子翼',type:'平衡',atk:1.1,def:1.1,wgt:1.1,sta:1.08,dir:1,emb:'star'},
  storm:{n:'逆風刃',type:'左迴旋',atk:1.15,def:1,wgt:1,sta:1.06,dir:-1,emb:'bolt'}};
const RATCH={'3-60':{res:.85,low:1,atk:1.08},'4-70':{res:1,low:.5,atk:1},'5-80':{res:1.25,low:0,atk:.95}};
const BITS={flat:{n:'平頭',mv:1.35,sta:.82,dash:1.25,wander:1,def:0},ball:{n:'球頭',mv:.8,sta:1.22,dash:.8,wander:.3,def:.05},
  needle:{n:'針頭',mv:.6,sta:1.12,dash:.55,wander:0,def:.2},rush:{n:'齒衝',mv:1.15,sta:.95,dash:1.65,wander:.7,def:0}};
const PK=(a,w,k)=>({a,w,k});
const STAGES=[
  {name:'新手練習場',stars:1,th:'gym',slope:1,fric:1,decay:1,pk:[PK(Math.PI/2,.24,'x'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'街頭對戰盤',stars:1,th:'street',slope:1,fric:1,decay:1,pk:[PK(Math.PI/2,.26,'x'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'寬口競技場',stars:2,th:'arena',slope:1,fric:1,decay:1,pk:[PK(Math.PI/2,.32,'x'),PK(.1,.28,'over'),PK(Math.PI-.1,.28,'over')]},
  {name:'冰晶競技場',stars:2,th:'ice',slope:1,fric:.35,decay:.85,pk:[PK(Math.PI/2,.26,'x'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'沙漠鬥技場',stars:3,th:'desert',slope:1.1,fric:1.7,decay:1.25,pk:[PK(Math.PI/2,.26,'x'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'雙重極限場',stars:3,th:'twin',slope:1,fric:1,decay:1,pk:[PK(Math.PI/2,.2,'x'),PK(-Math.PI/2,.2,'x'),PK(0,.17,'over'),PK(Math.PI,.17,'over')]},
  {name:'熔岩火山場',stars:4,th:'lava',slope:1,fric:1,decay:1,lava:1,pk:[PK(Math.PI/2,.26,'x'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'星空低重力',stars:4,th:'space',slope:.5,fric:.8,decay:.9,pk:[PK(Math.PI/2,.26,'x'),PK(0,.22,'over'),PK(Math.PI,.22,'over')]},
  {name:'暴風競技場',stars:5,th:'storm',slope:1,fric:1,decay:1,wind:1,pk:[PK(Math.PI/2,.26,'x'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'冠軍決賽場',stars:5,th:'final',slope:1,fric:1,decay:1,pk:[PK(Math.PI/2,.24,'x'),PK(0,.19,'over'),PK(Math.PI,.19,'over')]}];
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
const FIN={spin:{n:'旋轉終結',p:1,col:'#9ae0ff'},over:{n:'場外終結',p:2,col:'#3d8bff'},burst:{n:'爆裂終結',p:2,col:'#ff7a3d'},x:{n:'極限終結',p:3,col:'#ffd23f'}};
const BOTSETS=[['twin','4-70','ball'],['drake','3-60','flat'],['shield','5-80','needle'],['halo','4-70','ball'],['storm','4-70','rush'],['drake','4-70','rush'],['shield','4-70','ball'],['halo','5-80','needle'],['twin','3-60','flat'],['storm','3-60','flat']];
const BOTCOL=['#ff4d4d','#3d8bff','#3ed16a','#ffc21a','#b98cff','#ff7eb6','#3ddbd9','#ff9d3d'];
const BOTN=['旋風小子','鐵壁','流星','閃電','颶風','黑曜','赤焰','白狼','銀河','雷神'];
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function shade(hex,k){ const n=parseInt(hex.slice(1),16); let r=n>>16,g=n>>8&255,b=n&255; const f=v=>clamp(Math.round(k>0?v+(255-v)*k:v*(1+k)),0,255); return 'rgb('+f(r)+','+f(g)+','+f(b)+')'; }
const partsOf=L=>{ L=L||{}; return {blade:BLADES[L.blade]?L.blade:'twin',ratchet:RATCH[L.ratchet]?L.ratchet:'4-70',bit:BITS[L.bit]?L.bit:'flat'}; };
function statsOf(p){ const B=BLADES[p.blade],R=RATCH[p.ratchet],T=BITS[p.bit];
  return {atk:B.atk*R.atk,def:B.def+T.def,wgt:B.wgt,sta:B.sta*T.sta,mv:T.mv,dash:T.dash,wander:T.wander,res:R.res,low:R.low,dir:B.dir}; }
// 刀刃外形：極座標 r(θ)，回傳 0～1
function bladeR(k,a){ const f=n=>{ const u=((a*n/TAU)%1+1)%1; return u; };
  if(k==='drake') return .66+.34*Math.pow(f(3),2.4);
  if(k==='shield') return .92+.06*Math.cos(a*6);
  if(k==='halo') return .97;
  if(k==='twin') return .64+.36*Math.pow(Math.abs(Math.cos(a)),3);
  return .68+.32*Math.pow(1-f(4),2.4); }
function bladePath(c,k,R){ c.beginPath(); for(let i=0;i<=96;i++){ const a=i/96*TAU,r=bladeR(k,a)*R; i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r); } c.closePath(); }
function emblem(c,k,r){ c.beginPath();
  if(k==='tri'){ for(let i=0;i<3;i++){ const a=i/3*TAU-Math.PI/2; c.lineTo(Math.cos(a)*r,Math.sin(a)*r); } }
  else if(k==='hex'){ for(let i=0;i<6;i++){ const a=i/6*TAU; c.lineTo(Math.cos(a)*r,Math.sin(a)*r); } }
  else if(k==='ring'){ c.arc(0,0,r,0,TAU); c.moveTo(r*.5,0); c.arc(0,0,r*.5,0,TAU,true); }
  else if(k==='star'){ for(let i=0;i<10;i++){ const a=i/10*TAU-Math.PI/2,q=i%2?r*.45:r; c.lineTo(Math.cos(a)*q,Math.sin(a)*q); } }
  else { c.moveTo(-r*.2,-r); c.lineTo(r*.5,-r*.1); c.lineTo(0,0); c.lineTo(r*.3,r); c.lineTo(-r*.5,r*.05); c.lineTo(0,0); }
  c.closePath(); c.fill('evenodd'); }
// 畫一顆陀螺：(x,y)＝地面接觸點的畫面座標
function drawTop(c,x,y,s,P,col,ang,frac,o){ o=o||{}; const B=BLADES[P.blade],R=20*s,tilt=o.tilt||0,ta=o.ta||0,tx=Math.cos(ta)*tilt*s,ty=Math.sin(ta)*tilt*s*SQ;
  c.save(); c.translate(x,y);
  if(!o.noShadow){ c.fillStyle='rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(tx*.5+2*s,1.5*s,R*1.05,R*SQ*1.05,0,0,TAU); c.fill(); c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(tx*.3+s,1*s,R*.6,R*SQ*.6,0,0,TAU); c.fill(); }
  // 底座
  const bitC=P.bit==='needle'?'#c8ccd6':P.bit==='ball'?'#8a8f9c':P.bit==='rush'?'#ffb02a':'#5a5f6c';
  c.fillStyle='#1a1c22'; c.beginPath(); c.moveTo(tx*.2-4*s,-7*s+ty*.2); c.lineTo(tx*.2+4*s,-7*s+ty*.2); c.lineTo(0,P.bit==='needle'?1.5*s:0); c.closePath(); c.fill();
  c.fillStyle=bitC; c.beginPath(); c.ellipse(tx*.3,-6*s+ty*.3,6.5*s,6.5*s*SQ,0,0,TAU); c.fill();
  // 棘輪（齒）
  const rh=P.ratchet==='3-60'?9:P.ratchet==='4-70'?10.5:12,teeth=+P.ratchet[0],ry=-rh*s+ty*.6,rx=tx*.6;
  c.fillStyle='#2a2d36'; c.beginPath(); c.ellipse(rx,ry+2.5*s,13*s,13*s*SQ,0,0,TAU); c.fill();
  c.fillStyle='#4a4f5c'; c.beginPath(); c.ellipse(rx,ry,13*s,13*s*SQ,0,0,TAU); c.fill();
  c.fillStyle='#70778a'; for(let i=0;i<teeth;i++){ const a=ang*.999+i/teeth*TAU; c.beginPath(); c.ellipse(rx+Math.cos(a)*11*s,ry+Math.sin(a)*11*s*SQ,2.8*s,2.8*s*SQ,0,0,TAU); c.fill(); }
  // 刀刃
  const by=ry-(5*s),bx=rx+tx*.4;
  for(let k=5;k>=1;k--){ c.save(); c.translate(bx,by+k*1.1*s); c.scale(1,SQ); c.rotate(ang); bladePath(c,P.blade,R); c.fillStyle=k>3?'#20232c':k>1?'#4a505e':'#6a7080'; c.fill(); c.restore(); } /* 刀刃厚度 */
  c.save(); c.translate(bx,by); c.scale(1,SQ); c.rotate(ang);
  const g=c.createLinearGradient(-R,-R,R,R); g.addColorStop(0,'#f4f6fa'); g.addColorStop(.35,'#9aa2b2'); g.addColorStop(.55,'#e2e6ee'); g.addColorStop(1,'#5a6070');
  bladePath(c,P.blade,R); c.fillStyle=g; c.fill(); c.lineWidth=1.2*s; c.strokeStyle='rgba(20,22,30,.8)'; c.stroke();
  c.fillStyle=col; bladePath(c,P.blade,R*.74); c.fill(); c.fillStyle=shade(col,-.35); c.beginPath();
  const sp=P.blade==='twin'?2:P.blade==='drake'?3:P.blade==='storm'?4:6; for(let i=0;i<sp;i++){ const a=i/sp*TAU; c.moveTo(0,0); c.arc(0,0,R*.7,a+.15,a+.15+TAU/sp*.32); c.lineTo(0,0); } c.fill();
  if(P.blade==='halo'){ c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=2*s; c.beginPath(); c.arc(0,0,R*.86,0,TAU); c.stroke(); }
  if(P.blade==='shield'){ c.strokeStyle='#3a3f4c'; c.lineWidth=2.4*s; c.beginPath(); c.arc(0,0,R*.9,0,TAU); c.stroke(); }
  c.fillStyle='#1a1c24'; c.beginPath(); c.arc(0,0,R*.34,0,TAU); c.fill(); c.fillStyle=shade(col,.25); c.beginPath(); c.arc(0,0,R*.28,0,TAU); c.fill();
  c.fillStyle='#fff'; emblem(c,B.emb,R*.17);
  c.restore();
  // 高速旋轉的殘影與光澤
  if(frac>.15&&!o.still){ c.save(); c.translate(bx,by); c.scale(1,SQ); c.globalAlpha=Math.min(.55,frac*.6); c.strokeStyle='rgba(255,255,255,.85)'; c.lineWidth=1.6*s;
    for(let i=0;i<3;i++){ const a=-ang*(B.dir>0?1:-1)*0+ang+i*TAU/3; c.beginPath(); c.arc(0,0,R*(.82+i*.05),a,a+1.1*B.dir,B.dir<0); c.stroke(); }
    c.globalAlpha=frac*.25; c.fillStyle=col; c.beginPath(); c.arc(0,0,R*1.02,0,TAU); c.fill(); c.restore(); }
  c.fillStyle='rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(bx-R*.32,by-R*.32*SQ,R*.3,R*.12,-.5,0,TAU); c.fill();
  if(o.ring){ c.strokeStyle=o.ring; c.lineWidth=3; c.beginPath(); c.ellipse(0,2*s,R*1.25,R*1.25*SQ,0,0,TAU); c.stroke(); }
  c.restore(); }
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
    c.fillStyle=p.k==='x'?'#2a1a08':'#0a1430'; c.fill(); c.clip(); c.strokeStyle=p.k==='x'?'rgba(255,210,63,.75)':'rgba(61,139,255,.6)'; c.lineWidth=6; for(let i=-30;i<30;i++){ c.beginPath(); c.moveTo(sx(Math.cos(p.a)*AR)+i*14-40,sy(Math.sin(p.a)*AR)-60); c.lineTo(sx(Math.cos(p.a)*AR)+i*14+40,sy(Math.sin(p.a)*AR)+60); c.stroke(); } c.restore();
    c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle=p.k==='x'?'#ffd23f':'#9ac8ff'; const lx=sx(Math.cos(p.a)*(AR+22)),ly=sy(Math.sin(p.a)*(AR+22)); c.lineWidth=4; c.strokeStyle='#000'; const lb=p.k==='x'?'極限 3':'場外 2'; c.strokeText(lb,lx,ly); c.fillText(lb,lx,ly); }
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
// 名單、分隊（照浮島大混戰）
function roster(opts){ const net=opts.net,local2=!net&&opts.mode==='2p',pv=!!opts.preview,humans=pv?0:net?net.count:local2?2:1;
  let mode=(opts.options&&opts.options.team)||'ffa'; if(!net&&!local2) mode='ffa'; if(mode==='coop'&&humans>2) mode='vs';
  let n=net?Math.min(4,net.count+(net.bots||0)):clamp(+(opts.options&&opts.options.seats)||2,2,4);
  if(mode==='coop') n=humans*2; else if(mode==='pvp') n=Math.max(2,humans+humans%2); else if(mode==='vs'&&n%2) n=Math.min(4,n+1);
  n=clamp(Math.max(n,humans),2,4);
  const TEAMS=mode==='coop'?[{name:'玩家隊',col:'#ffd23f'},{name:'電腦隊',col:'#a8adc0'}]:[{name:'紅隊',col:'#ff5d5d'},{name:'藍隊',col:'#4f9dff'}];
  const cnt=[0,0],team=[]; for(let i=0;i<n;i++){ let tm=null; if(mode==='coop') tm=i<humans?0:1; else if(mode==='vs'||mode==='pvp') tm=i<humans?i%2:(cnt[0]<=cnt[1]?0:1); if(tm!=null) cnt[tm]++; team.push(tm); }
  const si=clamp(opts.stage|0,0,STAGES.length-1),names=[],looks=[];
  for(let i=0;i<n;i++){ const h=i<humans; names.push(h?(net?(net.names&&net.names[i])||'玩家'+(i+1):local2?(i+1)+'P':opts.name||'你'):BOTN[(si+i)%BOTN.length]);
    const L=h?(net?net.looks&&net.looks[i]:i===0?opts.look:null):null; const b=BOTSETS[(si*3+i)%BOTSETS.length];
    looks.push(h&&L&&Object.keys(L).length?L:h?{}:{blade:b[0],ratchet:b[1],bit:b[2],color:BOTCOL[(si+i*3)%BOTCOL.length]}); }
  return {net,local2,humans,mode,n,team,TEAMS,names,looks,host:!net||net.host,me:net?net.me:0,pv}; }
function readIn(env,i,local2){ const K=env.keys,h=c=>env.hit(c); let L,Rt,U,D,A;
  if(local2&&i===0){ L=K.KeyA; Rt=K.KeyD; U=K.KeyW; D=K.KeyS; A=h('KeyF')||h('KeyG'); }
  else if(local2){ L=K.ArrowLeft; Rt=K.ArrowRight; U=K.ArrowUp; D=K.ArrowDown; A=h('Enter')||h('Comma')||h('Slash'); }
  else { L=K.ArrowLeft||K.KeyA; Rt=K.ArrowRight||K.KeyD; U=K.ArrowUp||K.KeyW; D=K.ArrowDown||K.KeyS; A=h('Space')||h('KeyX')||h('KeyJ'); }
  return {mx:(Rt?1:0)-(L?1:0),my:(D?1:0)-(U?1:0),dash:!!A}; }
const NOIN={mx:0,my:0,dash:false};

function create(env,opts){
  const si=clamp(opts.stage|0,0,STAGES.length-1),ST=STAGES[si],OP=opts.options||{},R=roster(opts),{net,host,me,local2}=R,client=!!net&&!host,TARGET=+OP.pts||4,RT=60;
  const {ctx:c}=env.canvas2d(W,H),bg=stadium(si);
  const colOf=i=>{ const L=R.looks[i]; return L&&L.color&&L.color!=='auto'?L.color:PCOL[i%4]; };
  const T=[]; for(let i=0;i<R.n;i++){ const P=partsOf(R.looks[i]); T.push({i,P,k:statsOf(P),col:colOf(i),team:R.team[i],human:i<R.humans,local:i<R.humans&&(!net||i===me),remote:i<R.humans&&!!net&&i!==me,
    ai:i>=R.humans?{sk:clamp(.25+si*.075+(i-R.humans)*.02,.2,1),t:0,mx:0,my:0}:null,x:0,y:0,vx:0,vy:0,ang:Math.random()*TAU,spin:100,bm:0,st:'on',dashT:0,cd:0,railCD:0,last:-1,lastT:-9,out:0,ox:0,oy:0,ta:0,hs:0}); }
  const teamKey=f=>f.team!=null?'t'+f.team:'p'+f.i;
  const keys=[...new Set(T.map(teamKey))],score={}; keys.forEach(k=>score[k]=0);
  const keyName=k=>k[0]==='t'?R.TEAMS[+k.slice(1)].name:R.names[+k.slice(1)];
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
  function setupRound(){ round++; rt=0; phase='ready'; PT=opts.preview?.1:2.6; lastBeep=9; deb=[];
    const a0=Math.random()*TAU; T.forEach((f,k)=>{ const a=a0+k/T.length*TAU,r=AR*.55; f.x=Math.cos(a)*r; f.y=Math.sin(a)*r; const d=f.k.dir; f.vx=-Math.sin(a)*120*d-Math.cos(a)*30; f.vy=Math.cos(a)*120*d-Math.sin(a)*30;
      f.spin=f.ai?clamp(86+f.ai.sk*14+Math.random()*4,80,100):100; f.bm=0; f.st='on'; f.dashT=0; f.cd=1; f.railCD=0; f.last=-1; f.lastT=-9; f.out=0; }); }
  setupRound();
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
    const B=BLADES[f.P.blade],aggr=B.type==='攻擊'||B.type==='左迴旋'?1:B.type==='平衡'?.7:.35,r=hyp(f.x,f.y),ang=Math.atan2(f.y,f.x);
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
      if(f.dashT<=0){ f.vx-=nx*170; f.vy-=ny*170; } }
    f.vx+=ax*h; f.vy+=ay*h; const damp=Math.exp(-h*ST.fric*(.35+.35/K.mv)*(f.spin<20?2:1)); f.vx*=damp; f.vy*=damp;
    const vmax=f.dashT>0?620:520,v=hyp(f.vx,f.vy); if(v>vmax){ f.vx*=vmax/v; f.vy*=vmax/v; }
    f.x+=f.vx*h; f.y+=f.vy*h;
    r=hyp(f.x,f.y); nx=f.x/r; ny=f.y/r; const wall=AR-RAD+6;
    if(r>wall){ const pk=inPk(ST,Math.atan2(f.y,f.x));
      if(pk){ if(r>AR+6){ finish(f,pk.k==='x'?'x':'over',pk); return; } }
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
    const mx=(a.x+b.x)/2,my=(a.y+b.y)/2; addFx('spark',mx,my,Math.round(I)); snd(I>260?'hurt':'bump');
    if(I>260){ hitstop=Math.max(hitstop,.07); shake=Math.max(shake,.22); }
    for(const f of [a,b]) if(f.bm>=100&&f.st==='on') finish(f,'burst');
    if(a.spin<=0&&a.st==='on'){ a.spin=0; finish(a,'spin'); } if(b.spin<=0&&b.st==='on'){ b.spin=0; finish(b,'spin'); } }
  // 連線
  const pk=f=>[R1(f.x),R1(f.y),R1(f.vx),R1(f.vy),R1(f.spin),Math.round(f.bm),f.st,R1(f.dashT),R1(f.cd),R1(f.ox),R1(f.oy),R1(f.out)];
  if(net){
    if(client) net.onmsg=m=>{ if(m.s){ m.s.f.forEach((a,i)=>{ const f=T[i]; if(!f) return; f.x=a[0]; f.y=a[1]; f.vx=a[2]; f.vy=a[3]; f.spin=a[4]; f.bm=a[5]; if(f.st!==a[6]&&a[6]!=='on'){ f.ta=Math.random()*TAU; } f.st=a[6]; f.dashT=a[7]; f.cd=a[8]; f.ox=a[9]; f.oy=a[10]; f.out=a[11]; });
        Object.assign(score,m.s.sc); phase=m.s.ph; PT=m.s.pt; round=m.s.rd; rt=m.s.rt; windA=m.s.wa;
        for(const e of m.s.ev){ if(e[0]==='s') env.sfx(e[1]); else if(e[0]==='b'){ ban={k:e[1],who:e[2],to:e[3]||null,t:0}; if(e[1]!=='spin'){ shake=.35; } } else spawn(e[0],e[1],e[2],e[3],e[4]); } }
      if(m.end){ winKey=m.end; phase='over'; PT=2.6; } };
    else { net.onmsg=(m,from)=>{ if(m.i){ const b=inBuf[from]||(inBuf[from]={...NOIN,dn:0}); b.mx=m.i[0]; b.my=m.i[1]; if(m.i[2]>b.dn){ b.dash=true; b.dn=m.i[2]; } } };
      net.onleave=i=>{ const f=T[i]; if(f){ f.remote=false; f.ai={sk:.6,t:0,mx:0,my:0}; R.names[i]+='（離開）'; } }; } }
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt;
    for(const e of fx){ e.l-=dt; if(e.k==='sp'){ e.x+=e.vx*dt; e.y+=e.vy*dt; e.z+=e.vz*dt; e.vz-=600*dt; if(e.z<0){ e.z=0; e.vz*=-.4; } e.vx*=.97; e.vy*=.97; } else if(e.k==='sm'){ e.x+=e.vx*dt; e.y+=e.vy*dt; } }
    fx=fx.filter(e=>e.l>0); if(fx.length>500) fx.splice(0,fx.length-500);
    for(const d of deb){ d.l-=dt; d.x+=d.vx*dt; d.y+=d.vy*dt; d.z+=d.vz*dt; d.vz-=700*dt; d.ang+=d.va*dt; if(d.z<0){ d.z=0; d.vz*=-.35; d.vx*=.6; d.vy*=.6; d.va*=.6; } }
    deb=deb.filter(d=>d.l>0);
    if(ban) ban.t+=dt; if(shake>0) shake-=dt;
    for(const f of T) if(f.st!=='on') f.out=Math.min(1.5,f.out+dt);
    if(hitstop>0){ hitstop-=dt; return; }
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
      text:'旋轉終結 1 分、場外 2 分、爆裂 2 分、極限 3 分，先拿 '+TARGET+' 分的贏。',score:null,next:!net&&!local2&&won&&si<STAGES.length-1}); }
  // 畫面
  function topScreen(f){ let x=f.x,y=f.y,z=0;
    if(f.st==='out'){ const u=Math.min(1,f.out/.6),r=hyp(f.ox,f.oy)||1; x=f.ox+f.ox/r*40*u; y=f.oy+f.oy/r*40*u; z=-30*u*u; }
    return [sx(x),sy(y)-z]; }
  function draw(){ c.save(); themeBg(c,ST.th,t); if(shake>0) c.translate((Math.random()-.5)*shake*30,(Math.random()-.5)*shake*30);
    c.drawImage(bg,0,0,W,H);
    // 地上的軌跡與煙
    for(const e of fx){ if(e.k==='tr'){ c.globalAlpha=e.l/e.L*.7; c.fillStyle=e.c; c.beginPath(); c.ellipse(sx(e.x),sy(e.y)-4,14*e.l/e.L+3,(14*e.l/e.L+3)*SQ,0,0,TAU); c.fill(); }
      else if(e.k==='sm'){ c.globalAlpha=e.l/e.L*.4; c.fillStyle='#ddd'; c.beginPath(); c.arc(sx(e.x),sy(e.y)-6,8+(1-e.l/e.L)*14,0,TAU); c.fill(); } }
    c.globalAlpha=1;
    for(const d of deb){ c.globalAlpha=Math.min(1,d.l); const X=sx(d.x),Y=sy(d.y)-d.z;
      if(d.p===0){ c.save(); c.translate(X,Y); c.scale(1,SQ); c.rotate(d.ang); bladePath(c,d.P.blade,20*S*.62); c.fillStyle='#c8ccd6'; c.fill(); bladePath(c,d.P.blade,20*S*.45); c.fillStyle=d.col; c.fill(); c.restore(); }
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
        if(f.st==='on'&&f.bm>0){ c.fillStyle='#ff7a3d'; c.fillRect(x+14,y+hh,bw*Math.min(1,f.bm/100),2); } }); });
    c.textAlign='center'; c.textBaseline='middle'; c.font='900 13px '+TC; c.fillStyle='rgba(255,255,255,.8)';
    if(phase==='fight'){ c.textAlign='right'; c.fillText('第 '+round+' 回合　'+Math.max(0,Math.ceil(RT-rt))+' 秒',W-12,H-14); c.textAlign='center'; }
    if(phase==='ready'){ const n=Math.ceil(PT-.6),s=n>=1?String(Math.min(3,n)):'發射！'; c.font='900 '+(n>=1?64:56)+'px '+TC; c.lineWidth=8; c.strokeStyle='#0b0a1c'; c.strokeText(s,W/2,CY-10); c.fillStyle=n>=1?'#fff':'#ffd23f'; c.fillText(s,W/2,CY-10);
      c.font='900 18px '+TC; const rs='第 '+round+' 回合'; c.lineWidth=5; c.strokeText(rs,W/2,CY-62); c.fillStyle='#fff'; c.fillText(rs,W/2,CY-62); }
    if(ban&&ban.t<2.2&&phase!=='ready'){ const F=FIN[ban.k],u=Math.min(1,ban.t*5),sc=1+(1-u)*.8; c.save(); c.translate(W/2,CY-118); c.scale(sc,sc); c.globalAlpha=Math.min(1,(2.2-ban.t)*3);
      c.font='900 40px '+TC; c.lineWidth=8; c.strokeStyle='#0b0a1c'; c.strokeText(F.n+'！',0,0); c.fillStyle=F.col; c.fillText(F.n+'！',0,0);
      c.font='900 18px '+TC; const s2=ban.to?keyName(ban.to)+' +'+F.p+' 分':R.names[ban.who]+' 出局'; c.lineWidth=5; c.strokeText(s2,0,34); c.fillStyle='#fff'; c.fillText(s2,0,34); c.restore(); }
    if(phase==='over'&&winKey){ c.fillStyle='rgba(11,10,28,.35)'; c.fillRect(0,0,W,H); for(let i=0;i<50;i++){ c.fillStyle=PCOL[i%4]; c.fillRect((i*97+t*50*(i%3+1))%W,(i*53+t*140*(1+i%4))%H,6,9); }
      const s=keyName(winKey)+' 獲勝！'; c.font='900 44px '+TC; c.lineWidth=9; c.strokeStyle='#0b0a1c'; c.strokeText(s,W/2,CY-30); c.fillStyle='#ffd23f'; c.fillText(s,W/2,CY-30); } }
  return {update,draw,destroy(){},_dbg:{T,get score(){return score;},get phase(){return phase;},get round(){return round;},finish,useDash,setPT(v){PT=v;}}};
}
// 開始畫面：場地＋兩顆陀螺互撞
function stageShow(ctx,w,h,si,t){ ctx.save(); ctx.scale(w/W,h/H); themeBg(ctx,STAGES[si].th,t); ctx.drawImage(stadium(si),0,0,W,H);
  const b1=BOTSETS[(si*3)%BOTSETS.length],b2=BOTSETS[(si*3+1)%BOTSETS.length],a=t*1.3,r=90+Math.sin(t*.8)*40;
  drawTop(ctx,sx(Math.cos(a)*r),sy(Math.sin(a)*r),S,{blade:b1[0],ratchet:b1[1],bit:b1[2]},BOTCOL[si%8],t*30,1);
  drawTop(ctx,sx(Math.cos(a+2.6)*r*.8),sy(Math.sin(a+2.6)*r*.8),S,{blade:b2[0],ratchet:b2[1],bit:b2[2]},BOTCOL[(si+3)%8],-t*30,1); ctx.restore(); }
function preview(ctx,w,h,L,t){ const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#1d2a44'); g.addColorStop(1,'#0b0a1c'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  const P=partsOf(L),K=statsOf(P),col=L&&L.color&&L.color!=='auto'?L.color:PCOL[0],s=Math.min(w,h)/90;
  ctx.fillStyle='rgba(255,255,255,.08)'; ctx.beginPath(); ctx.ellipse(w*.33,h*.62,w*.28,w*.28*SQ,0,0,TAU); ctx.fill();
  drawTop(ctx,w*.33,h*.66,s,P,col,t*BLADES[P.blade].dir*3,.6);
  const st=[['攻擊',K.atk/1.5],['防禦',K.def/1.6],['持久',K.sta/1.65],['衝刺',K.dash/1.7],['耐爆',K.res/1.3]],x0=w*.64,bw=w*.3;
  ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.06)+'px '+TC; ctx.fillStyle='#ffd23f'; ctx.fillText(BLADES[P.blade].n+' '+P.ratchet+' '+BITS[P.bit].n,x0-4,h*.12);
  ctx.font='700 '+Math.round(h*.05)+'px '+TC; st.forEach(([n,v],i)=>{ const y=h*(.26+i*.13); ctx.fillStyle='#fff'; ctx.fillText(n,x0,y); ctx.fillStyle='rgba(255,255,255,.15)'; ctx.fillRect(x0+h*.13,y-h*.02,bw-h*.13,h*.04); ctx.fillStyle=['#ff4d4d','#3d8bff','#3ed16a','#ff9d3d','#b98cff'][i]; ctx.fillRect(x0+h*.13,y-h*.02,(bw-h*.13)*clamp(v,.1,1),h*.04); });
  ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font='700 '+Math.round(h*.045)+'px '+TC; ctx.fillText(BLADES[P.blade].type+(BLADES[P.blade].dir<0?'（左迴旋）':'型'),x0,h*.92); }
const TEAMOPT={key:'team',label:'雙人／連線玩法',def:'ffa',opts:[{id:'ffa',label:'各自分開'},{id:'vs',label:'分隊對戰（電腦補人）'},{id:'pvp',label:'玩家對決（不加電腦）'},{id:'coop',label:'玩家同隊打電腦'}]};
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).spin={name:'陀螺旋風戰',tag:'SPIN STORM',color:'#ff7a3d',online:true,maxPlayers:4,bots:true,
  desc:'組裝自己的戰鬥陀螺上場對決！刀刃、棘輪、底座自由搭配，貼著場邊齒輪軌道能極限衝刺，把對手撞出場外、撞到爆裂或轉到停下來。10 座競技場：冰晶、沙漠、熔岩、星空低重力、暴風…',
  goal:'把對手撞出場外（2 分）、撞進「極限」口袋（3 分）、撞到爆裂（2 分）或比它轉得久（1 分）。先拿到目標分數的贏。',
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  stageGoal:si=>{ const s=STAGES[si],h={ice:'冰面很滑，陀螺停不下來。',desert:'沙地摩擦大，轉速掉得快。',twin:'前後各有一個「極限」口袋。',lava:'碰到滾燙的軌道會掉轉速，但衝刺更猛。',space:'低重力，碗面拉回中間的力比較小。',storm:'暴風會把陀螺往一個方向吹，每隔幾秒換方向。',arena:'兩側的場外口袋特別寬。',final:'冠軍等級的對手。'}[s.th]||'';
    return s.name+'：先拿到目標分數的贏。'+h; },
  options:[{key:'seats',label:'單機人數',def:'2',solo:true,opts:[{id:'2',label:'1 對 1'},{id:'3',label:'3 人混戰'},{id:'4',label:'4 人混戰'}]},{key:'pts',label:'先拿幾分',def:'4',opts:[{id:'4',label:'4 分'},{id:'7',label:'7 分'}]},TEAMOPT],
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['↑ ↓ ← →','推動陀螺'],['空白鍵 或 X','衝刺：在場邊＝極限衝刺，在中間＝衝向對手（3 秒一次）'],['雙人','1P 用 WASD＋F，2P 用方向鍵＋Enter'],['造型','可以換刀刃、棘輪、底座，能力會不一樣']],
  touchHelp:[['方向盤','推動陀螺'],['衝刺','在場邊＝極限衝刺，在中間＝衝向對手']],
  touch:{left:'dpad',right:[{l:'衝刺',c:'Space',act:true}]},
  looks:[{key:'blade',label:'刀刃',opts:Object.keys(BLADES).map(k=>({id:k,label:BLADES[k].n+'（'+BLADES[k].type+'）'}))},
    {key:'ratchet',label:'棘輪',opts:[{id:'3-60',label:'3-60 低重心、攻擊強'},{id:'4-70',label:'4-70 平衡'},{id:'5-80',label:'5-80 不容易爆裂'}]},
    {key:'bit',label:'底座',opts:[{id:'flat',label:'平頭（跑得快）'},{id:'ball',label:'球頭（轉得久）'},{id:'needle',label:'針頭（站得穩）'},{id:'rush',label:'齒衝（衝刺強）'}]},
    {key:'color',label:'顏色',type:'color',opts:['auto','#ff4d4d','#3d8bff','#3ed16a','#ffc21a','#b98cff','#ff7eb6','#3ddbd9','#ff9d3d','#2a2d36','#f4f6fa']}],
  preview,
  hubBest:()=>{ const n=STAGES.filter(s=>hasWin(s.name)).length; return n?'贏過 <b>'+n+' / '+STAGES.length+'</b> 座競技場':'尚無紀錄'; },
  stageBest:i=>hasWin(STAGES[i].name)?'★ 贏過':'',
  stageShow,
  thumb:(ctx,w,h,t)=>{ stageShow(ctx,w,h,9,t); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.13)+'px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#0b0a1c'; ctx.strokeText('陀螺旋風戰',w/2,h*.13); ctx.fillStyle='#ffd23f'; ctx.fillText('陀螺旋風戰',w/2,h*.13); },
  create,_draw:{drawTop,STAGES,BLADES}};
})();
