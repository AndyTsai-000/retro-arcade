// 夜市遊戲大集合：台灣夜市四個攤位——撈金魚、套圈圈、射氣球、彈珠檯。單人玩，分數越高換到的獎品越大，獎品會收藏起來。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k,hyp=Math.hypot,rnd=(a,b)=>a+Math.random()*(b-a);
const gauss=()=>{ let u=0,v=0; while(!u) u=Math.random(); while(!v) v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v); };
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function shade(h,k){ const n=parseInt(h.slice(1),16),f=v=>clamp(Math.round(k<0?v*(1+k):v+(255-v)*k),0,255); return 'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')'; }
function cacheCv(w,h,f){ const k=document.createElement('canvas'); k.width=w*2; k.height=h*2; const x=k.getContext('2d'); x.scale(2,2); f(x); return k; }

// ───────── 攤位資料 ─────────
const STALLS=[
  {n:'撈金魚',sign:'撈金魚',sub:'一支 50 元',tarp:['#d8202a','#f4f0e8'],th:[5,12,22],pz:[['金魚一隻（裝袋）','fishbag'],['金魚兩隻＋魚飼料','fishbag2'],['黑凸眼金魚＋小魚缸','tank']]},
  {n:'套圈圈',sign:'套圈圈',sub:'10 圈 100 元',tarp:['#1f5fc8','#f4f0e8'],th:[4,10,18],pz:[['彈珠汽水','soda'],['小熊玩偶','bear'],['超大熊熊娃娃','bigbear']]},
  {n:'射氣球',sign:'射氣球',sub:'15 發 100 元',tarp:['#1f8a4a','#f4f0e8'],th:[8,15,22],pz:[['棒棒糖','candy'],['水槍','watergun'],['大型絨毛娃娃','bigbear']]},
  {n:'彈珠檯',sign:'賓果彈珠檯',sub:'10 顆 50 元',tarp:['#e8a020','#7a2a10'],th:[4,8,14],pz:[['一包乖乖','snack'],['養樂多一排','yakult'],['烤香腸兌換券','sausage']]}];
const aKey='arcade.night.',load=(k,d)=>{ try{ const v=localStorage.getItem(aKey+k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },store=(k,v)=>{ try{ localStorage.setItem(aKey+k,JSON.stringify(v)); }catch(e){} };

// ───────── 夜市街景（遠處攤位、燈泡、人潮、煙） ─────────
const FOODS=[['雞排','#ffd23f','#c81e1e'],['珍珠奶茶','#fff','#7a4a2a'],['臭豆腐','#ffe08a','#1f6a2a'],['大腸包小腸','#fff','#c83a1e'],['蚵仔煎','#ffd23f','#1f4ab8'],['烤玉米','#ffe8a0','#a0501a'],['地瓜球','#fff','#e07a1a'],['滷味','#ffd23f','#5a1a1a'],['豆花','#fff','#2a7ab8'],['胡椒餅','#ffe08a','#8a2a1a'],['鹽酥雞','#ffd23f','#d82a2a'],['蔥油餅','#fff','#3a8a3a']];
const VPX=400,VPY=196;
let streetCv=null;
function street(){ if(streetCv) return streetCv; return streetCv=cacheCv(W,H,c=>{
  const sky=c.createLinearGradient(0,0,0,VPY); sky.addColorStop(0,'#05060f'); sky.addColorStop(1,'#1c1426'); c.fillStyle=sky; c.fillRect(0,0,W,VPY+4);
  // 遠處大樓
  for(let i=0;i<22;i++){ const x=i*40-10,h=40+((i*37)%60); c.fillStyle='#0c0d18'; c.fillRect(x,VPY-h-30,38,h+40); for(let k=0;k<6;k++) if((i*7+k*3)%4===0){ c.fillStyle='rgba(255,220,140,.35)'; c.fillRect(x+6+(k%3)*10,VPY-h-22+Math.floor(k/3)*14,5,6); } }
  // 地面：被燈照亮的柏油路，有點濕
  const gd=c.createLinearGradient(0,VPY,0,H); gd.addColorStop(0,'#2a1e22'); gd.addColorStop(1,'#141016'); c.fillStyle=gd; c.fillRect(0,VPY,W,H-VPY);
  // 兩排攤位往遠處排，近大遠小
  for(const sd of [-1,1]) for(let k=11;k>=0;k--){ const z0=1+k*.62,z1=z0+.62,X=z=>VPX+sd*520/z,Y=z=>VPY+180/z,T=z=>VPY-150/z;
    const xa=X(z1),xb=X(z0),f=FOODS[(k*5+(sd>0?3:0))%FOODS.length];
    // 攤子內部亮光
    const g=c.createLinearGradient(0,T(z0),0,Y(z0)); g.addColorStop(0,'#ffcf7a'); g.addColorStop(1,'#7a3a1a'); c.fillStyle=g; c.beginPath(); c.moveTo(xa,T(z1)+20/z1); c.lineTo(xb,T(z0)+20/z0); c.lineTo(xb,Y(z0)); c.lineTo(xa,Y(z1)); c.closePath(); c.fill();
    // 攤車檯面
    c.fillStyle='#b8b8c0'; c.beginPath(); c.moveTo(xa,lerp(T(z1),Y(z1),.62)); c.lineTo(xb,lerp(T(z0),Y(z0),.62)); c.lineTo(xb,Y(z0)); c.lineTo(xa,Y(z1)); c.closePath(); c.fill(); c.fillStyle='rgba(0,0,0,.35)'; c.fill();
    // 招牌（紅底黃字／燈箱）
    c.fillStyle=f[2]; c.beginPath(); c.moveTo(xa,T(z1)); c.lineTo(xb,T(z0)); c.lineTo(xb,T(z0)+26/z0); c.lineTo(xa,T(z1)+26/z1); c.closePath(); c.fill();
    const mx=(xa+xb)/2,my=(T(z0)+T(z1))/2+13/((z0+z1)/2),fs=Math.max(5,Math.round(22/((z0+z1)/2))); c.save(); c.translate(mx,my); c.font='900 '+fs+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle=f[1]; c.fillText(f[0],0,0,Math.abs(xb-xa)*.9); c.restore();
    // 帆布頂
    c.fillStyle=k%2?'#c8282a':'#2a5ab8'; c.beginPath(); c.moveTo(xa,T(z1)-14/z1); c.lineTo(xb,T(z0)-14/z0); c.lineTo(xb,T(z0)); c.lineTo(xa,T(z1)); c.closePath(); c.fill(); }
  // 掛在半空的紅燈籠
  for(let i=0;i<9;i++){ const z=1.3+i*.75,s=1/z; for(const sd of [-1,1]){ const x=VPX+sd*300*s,y=VPY-210*s; c.fillStyle='#d8201a'; c.beginPath(); c.ellipse(x,y,16*s,20*s,0,0,TAU); c.fill(); c.fillStyle='rgba(255,200,120,.5)'; c.beginPath(); c.ellipse(x-4*s,y-5*s,6*s,9*s,0,0,TAU); c.fill(); c.fillStyle='#ffd23f'; c.fillRect(x-7*s,y-23*s,14*s,4*s); c.fillRect(x-7*s,y+19*s,14*s,4*s); } }
  // 地上反光
  for(let i=0;i<30;i++){ const x=rnd(0,W),y=rnd(VPY+40,H); c.fillStyle='rgba(255,190,110,'+rnd(.03,.08)+')'; c.beginPath(); c.ellipse(x,y,rnd(20,60),rnd(2,5),0,0,TAU); c.fill(); } }); }
// 人潮：剪影＋暖色輪廓光，慢慢走
const CROWD=[]; for(let i=0;i<46;i++){ const z=rnd(1.05,4.2); CROWD.push({x:rnd(-1.1,1.1),z,v:rnd(.03,.09)*(Math.random()<.5?-1:1),ph:rnd(0,TAU),c:['#1a1420','#221a24','#2a1e1a','#181a24'][i%4],h:['#0e0a0e','#2a1a12','#120e10'][i%3],bag:Math.random()<.3}); }
CROWD.sort((a,b)=>b.z-a.z);
function crowd(c,t){ for(const p of CROWD){ const wx=(((p.x+p.v*t+1.2)%2.4+2.4)%2.4-1.2),x=VPX+wx*380/p.z,y=VPY+170/p.z,s=1.25/p.z,b=Math.abs(Math.sin(t*4+p.ph))*2*s;
    c.fillStyle=p.c; c.beginPath(); c.moveTo(x-11*s,y); c.lineTo(x-12*s,y-46*s-b); c.quadraticCurveTo(x,y-56*s-b,x+12*s,y-46*s-b); c.lineTo(x+11*s,y); c.closePath(); c.fill();
    c.fillStyle=p.h; c.beginPath(); c.arc(x,y-62*s-b,8*s,0,TAU); c.fill();
    c.strokeStyle='rgba(255,170,90,.35)'; c.lineWidth=1.5*s; c.beginPath(); c.arc(x,y-62*s-b,8*s,Math.PI*.9,Math.PI*1.6); c.stroke();
    if(p.bag){ c.fillStyle='rgba(240,240,240,.55)'; c.fillRect(x+10*s,y-30*s-b,7*s,10*s); } } }
// 一串燈泡（懸垂線）
function bulbs(c,x0,y0,x1,y1,sag,n,t,warm){ c.strokeStyle='#1a1418'; c.lineWidth=1.4; c.beginPath(); c.moveTo(x0,y0); c.quadraticCurveTo((x0+x1)/2,(y0+y1)/2+sag*2,x1,y1); c.stroke();
  for(let i=1;i<n;i++){ const u=i/n,x=lerp(x0,x1,u),y=lerp(y0,y1,u)+sag*4*u*(1-u),on=.75+.25*Math.sin(t*3+i*1.7);
    c.fillStyle='rgba(255,'+(warm?190:230)+',120,'+(.16*on)+')'; c.beginPath(); c.arc(x,y+5,11,0,TAU); c.fill(); c.fillStyle=warm?'#fff0b0':'#fffbe8'; c.beginPath(); c.ellipse(x,y+5,3.2,4.2,0,0,TAU); c.fill(); } }
function steam(c,t){ for(let i=0;i<7;i++){ const k=(t*.25+i/7)%1,x=[90,150,690,740,40,640,760][i]+Math.sin(t+i)*8,y=VPY+30-k*120; c.fillStyle='rgba(220,220,230,'+(.12*(1-k))+')'; c.beginPath(); c.arc(x,y,10+k*26,0,TAU); c.fill(); } }
function marketBG(c,t){ c.drawImage(street(),0,0,W,H); crowd(c,t); steam(c,t); for(let i=0;i<4;i++){ const z=1.2+i*.9; bulbs(c,VPX-460/z,VPY-190/z,VPX+460/z,VPY-190/z,22/z,14,t+i,true); } }

// 攤位帆布頂＋招牌
function canopy(c,x0,x1,S,t){ const w=x1-x0,n=Math.round(w/44),sw=w/n;
  c.fillStyle='rgba(0,0,0,.4)'; c.fillRect(x0,0,w,62);
  for(let i=0;i<n;i++){ c.fillStyle=S.tarp[i%2]; c.fillRect(x0+i*sw,0,sw,40); c.beginPath(); c.moveTo(x0+i*sw,40); c.quadraticCurveTo(x0+i*sw+sw/2,58,x0+(i+1)*sw,40); c.fill(); }
  const sh=c.createLinearGradient(0,0,0,58); sh.addColorStop(0,'rgba(0,0,0,.25)'); sh.addColorStop(.6,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,0,0,.25)'); c.fillStyle=sh; c.fillRect(x0,0,w,58);
  // 招牌燈箱
  const sw2=Math.min(300,w*.6),sx0=(x0+x1)/2-sw2/2; c.fillStyle='#14100c'; rr(c,sx0-4,4,sw2+8,50,8); c.fill(); const sg=c.createLinearGradient(0,6,0,52); sg.addColorStop(0,'#fff6d8'); sg.addColorStop(1,'#ffd890'); c.fillStyle=sg; rr(c,sx0,8,sw2,42,6); c.fill();
  for(let i=0;i<24;i++){ const on=(Math.floor(t*6)+i)%3!==0; c.fillStyle=on?'#ff3a3a':'#6a2020'; const u=i/24,px=sx0+u*sw2; c.beginPath(); c.arc(px+sw2/48,8,2,0,TAU); c.arc(px+sw2/48,50,2,0,TAU); c.fill(); }
  c.textAlign='center'; c.textBaseline='middle'; c.font='900 26px '+TC; c.fillStyle='#c81414'; c.fillText(S.sign,(x0+x1)/2-30,30,sw2-110); c.font='900 13px '+TC; c.fillStyle='#14100c'; c.fillText(S.sub,(x0+x1)/2+sw2/2-52,31);
  bulbs(c,x0+6,56,x1-6,56,10,Math.round(w/52),t,false); }

// 獎品小圖
function prize(c,x,y,s,k){ c.save(); c.translate(x,y); c.scale(s,s); c.lineWidth=1.6; c.strokeStyle='rgba(0,0,0,.55)';
  const bear=(col,r)=>{ c.fillStyle=col; for(const q of [-1,1]){ c.beginPath(); c.arc(q*r*.62,-r*1.55,r*.36,0,TAU); c.fill(); c.stroke(); } c.beginPath(); c.ellipse(0,0,r*.85,r,0,0,TAU); c.fill(); c.stroke(); c.beginPath(); c.arc(0,-r*1.15,r*.75,0,TAU); c.fill(); c.stroke(); c.fillStyle=shade(col,.45); c.beginPath(); c.ellipse(0,-r*.95,r*.32,r*.24,0,0,TAU); c.fill(); c.fillStyle='#1a1010'; c.beginPath(); c.arc(-r*.28,-r*1.25,r*.09,0,TAU); c.arc(r*.28,-r*1.25,r*.09,0,TAU); c.arc(0,-r*1.02,r*.1,0,TAU); c.fill(); c.fillStyle='#e83a5a'; c.beginPath(); c.moveTo(-r*.3,-r*.4); c.lineTo(r*.3,-r*.4); c.lineTo(0,-r*.2); c.fill(); };
  if(k==='soda'){ const g=c.createLinearGradient(-6,0,6,0); g.addColorStop(0,'#2a8a6a'); g.addColorStop(.4,'#9ae8c8'); g.addColorStop(1,'#1a6a4a'); c.fillStyle=g; c.beginPath(); c.moveTo(-6,0); c.lineTo(-6,-14); c.quadraticCurveTo(-6,-18,-3,-20); c.lineTo(-3,-26); c.lineTo(3,-26); c.lineTo(3,-20); c.quadraticCurveTo(6,-18,6,-14); c.lineTo(6,0); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#3a6ad8'; c.fillRect(-6,-11,12,6); c.fillStyle='#e8f4ff'; c.beginPath(); c.arc(0,-21,1.8,0,TAU); c.fill(); }
  else if(k==='bear') bear('#c8884a',8);
  else if(k==='bigbear') bear('#f0d8b0',11);
  else if(k==='duck'){ c.fillStyle='#ffd23f'; c.beginPath(); c.ellipse(0,-6,10,7,0,0,TAU); c.fill(); c.stroke(); c.beginPath(); c.arc(4,-15,5.5,0,TAU); c.fill(); c.stroke(); c.fillStyle='#ff8a2a'; c.beginPath(); c.ellipse(10,-14,3.5,1.8,0,0,TAU); c.fill(); c.fillStyle='#000'; c.beginPath(); c.arc(5.5,-16,1,0,TAU); c.fill(); }
  else if(k==='car'){ c.fillStyle='#e83a3a'; rr(c,-11,-12,22,8,3); c.fill(); c.stroke(); rr(c,-6,-18,12,7,3); c.fill(); c.stroke(); c.fillStyle='#9ad0ff'; c.fillRect(-4,-16.5,8,4); c.fillStyle='#1a1a1a'; c.beginPath(); c.arc(-6,-3.5,3.2,0,TAU); c.arc(6,-3.5,3.2,0,TAU); c.fill(); }
  else if(k==='robot'){ c.fillStyle='#a8b4c8'; rr(c,-6,-16,12,13,2); c.fill(); c.stroke(); rr(c,-5,-25,10,8,2); c.fill(); c.stroke(); c.fillStyle='#ff4a4a'; c.fillRect(-3,-22.5,2,2); c.fillRect(1,-22.5,2,2); c.fillStyle='#5a6070'; c.fillRect(-5,-3,4,3); c.fillRect(1,-3,4,3); }
  else if(k==='cat'){ c.fillStyle='#fff8e8'; c.beginPath(); c.ellipse(0,-8,9,9,0,0,TAU); c.fill(); c.stroke(); c.beginPath(); c.arc(0,-20,7.5,0,TAU); c.fill(); c.stroke(); c.beginPath(); c.moveTo(-7,-23); c.lineTo(-6,-30); c.lineTo(-2,-26); c.moveTo(7,-23); c.lineTo(6,-30); c.lineTo(2,-26); c.fill(); c.stroke(); c.fillStyle='#d81e1e'; c.fillRect(-7,-13,14,2.5); c.fillStyle='#ffd23f'; c.beginPath(); c.arc(0,-9,2.5,0,TAU); c.fill(); c.strokeStyle='#d8a020'; c.beginPath(); c.moveTo(9,-12); c.lineTo(12,-22); c.stroke(); c.fillStyle='#000'; c.fillRect(-4,-21,2,1.2); c.fillRect(2,-21,2,1.2); }
  else if(k==='can'){ const g=c.createLinearGradient(-5,0,5,0); g.addColorStop(0,'#8a1010'); g.addColorStop(.4,'#ff5050'); g.addColorStop(1,'#7a1010'); c.fillStyle=g; rr(c,-5,-16,10,16,1.5); c.fill(); c.stroke(); c.fillStyle='#ddd'; c.fillRect(-5,-16,10,2); c.fillStyle='#fff'; c.fillRect(-5,-9,10,2); }
  else if(k==='candy'){ c.strokeStyle='#eee'; c.lineWidth=2; c.beginPath(); c.moveTo(0,0); c.lineTo(0,-12); c.stroke(); for(let i=0;i<3;i++){ c.fillStyle=['#ff4a8a','#ffd23f','#4ad8ff'][i]; c.beginPath(); c.arc(0,-19,8-i*2.4,0,TAU); c.fill(); } }
  else if(k==='watergun'){ c.fillStyle='#3ac8ff'; rr(c,-12,-16,22,8,3); c.fill(); c.stroke(); c.fillStyle='#ff7a2a'; rr(c,-6,-10,7,10,2); c.fill(); c.stroke(); c.fillStyle='#ffd23f'; rr(c,-2,-23,8,8,3); c.fill(); c.stroke(); }
  else if(k==='snack'){ c.fillStyle='#ffd23f'; c.beginPath(); c.moveTo(-9,0); c.lineTo(-10,-22); c.lineTo(10,-22); c.lineTo(9,0); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#2a8a3a'; c.fillRect(-8,-16,16,6); c.fillStyle='#d81e1e'; c.beginPath(); c.arc(0,-6,3,0,TAU); c.fill(); }
  else if(k==='yakult'){ for(let i=0;i<5;i++){ const x=-12+i*6; c.fillStyle='#fff'; c.beginPath(); c.moveTo(x-2.5,0); c.lineTo(x-2.5,-9); c.quadraticCurveTo(x-1.4,-11,x-2.5,-13); c.lineTo(x+2.5,-13); c.quadraticCurveTo(x+1.4,-11,x+2.5,-9); c.lineTo(x+2.5,0); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#d81e1e'; c.fillRect(x-2.5,-15,5,2.5); } }
  else if(k==='sausage'){ c.strokeStyle='#d8b070'; c.lineWidth=1.6; c.beginPath(); c.moveTo(-10,2); c.lineTo(8,-20); c.stroke(); const g=c.createLinearGradient(0,-16,0,-6); g.addColorStop(0,'#d84a2a'); g.addColorStop(1,'#7a1a0a'); c.fillStyle=g; c.save(); c.translate(0,-10); c.rotate(-.9); rr(c,-11,-4,22,8,4); c.fill(); c.restore(); c.strokeStyle='rgba(40,10,0,.7)'; for(let i=-1;i<=1;i++){ c.beginPath(); c.moveTo(i*4-2,-6+i*-5); c.lineTo(i*4+2,-10+i*-5); c.stroke(); } }
  else if(k==='fishbag'||k==='fishbag2'){ c.fillStyle='rgba(200,230,255,.55)'; c.beginPath(); c.moveTo(-3,-24); c.quadraticCurveTo(-12,-10,-9,-2); c.quadraticCurveTo(0,4,9,-2); c.quadraticCurveTo(12,-10,3,-24); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#ff6a1a'; c.beginPath(); c.ellipse(-1,-8,4,2.4,.3,0,TAU); c.fill(); if(k==='fishbag2'){ c.beginPath(); c.ellipse(3,-13,3.6,2.2,-.4,0,TAU); c.fill(); } c.fillStyle='#d81e1e'; c.fillRect(-3,-27,6,3); }
  else if(k==='tank'){ c.fillStyle='rgba(180,220,255,.5)'; c.beginPath(); c.ellipse(0,-10,13,11,0,0,TAU); c.fill(); c.stroke(); c.fillStyle='#2a2a30'; c.beginPath(); c.ellipse(0,-9,5,3,0,0,TAU); c.fill(); c.fillStyle='#ff6a1a'; c.beginPath(); c.ellipse(4,-14,3,2,0,0,TAU); c.fill(); c.fillStyle='#d8c890'; c.beginPath(); c.ellipse(0,-1,10,2.5,0,0,TAU); c.fill(); }
  c.restore(); }

// ═════════ 撈金魚 ═════════
const TUB={x:178,y:96,w:600,h:392};
const FT=[{n:'紅金魚',len:34,c0:'#ff5a14',c1:'#ffb066',pts:1,w:10,spd:42},{n:'紅白金魚',len:40,c0:'#ff4a10',c1:'#fff4e8',pts:2,w:14,spd:46,pied:1},{n:'黑凸眼',len:40,c0:'#1a1a22',c1:'#4a4a58',pts:3,w:16,spd:56,bug:1},{n:'大琉金',len:60,c0:'#ff6a1a',c1:'#ffd0a0',pts:5,w:44,spd:30}];
function drawFish(c,f,t,sc){ const T=FT[f.ty],L=T.len*(sc||1),sw=Math.sin(t*(f.fast?18:9)+f.ph)*.35; c.save(); c.translate(f.x,f.y); c.rotate(f.a);
  // 尾鰭（半透明、會擺）
  const fc=T.bug?'rgba(30,30,42,':'rgba(255,120,60,'; for(const q of [-1,1]){ const tx=-L*1.02,ty=q*L*.36+sw*L*.32; c.fillStyle=fc+'.55)'; c.beginPath(); c.moveTo(-L*.4,q*L*.03); c.quadraticCurveTo(-L*.62,q*L*.3+sw*L*.15,tx,ty); c.quadraticCurveTo(-L*.92,q*L*.12+sw*L*.2,-L*.8,sw*L*.12); c.quadraticCurveTo(-L*.6,0,-L*.4,0); c.fill();
    c.strokeStyle=fc+'.5)'; c.lineWidth=.8; for(let k=1;k<4;k++){ c.beginPath(); c.moveTo(-L*.45,0); c.quadraticCurveTo(-L*.65,q*L*.08*k+sw*L*.12,lerp(-L*.8,tx,k/4),lerp(sw*L*.12,ty,k/4)); c.stroke(); } } /* 扇形雙尾鰭＋鰭條 */
  c.strokeStyle=T.bug?'rgba(60,60,80,.7)':'rgba(255,170,110,.75)'; c.lineWidth=L*.05; c.lineCap='round'; c.beginPath(); c.moveTo(L*.12,0); c.quadraticCurveTo(-L*.15,sw*L*.08,-L*.38,sw*L*.1); c.stroke(); /* 背鰭 */
  // 胸鰭
  c.fillStyle=T.bug?'rgba(40,40,52,.6)':'rgba(255,160,100,.5)'; for(const q of [-1,1]){ c.beginPath(); c.ellipse(L*.08,q*L*.22,L*.14,L*.06,q*(.8+sw*.6),0,TAU); c.fill(); }
  // 身體
  const g=c.createLinearGradient(0,-L*.25,0,L*.25); g.addColorStop(0,T.c0); g.addColorStop(.5,T.c1); g.addColorStop(1,T.c0); c.fillStyle=g; c.beginPath(); c.ellipse(0,0,L*.48,L*(f.ty===3?.3:.22),0,0,TAU); c.fill();
  if(T.pied){ c.fillStyle='rgba(255,250,240,.9)'; c.beginPath(); c.ellipse(-L*.1,L*.04,L*.18,L*.12,.5,0,TAU); c.ellipse(L*.26,-L*.05,L*.1,L*.08,0,0,TAU); c.fill(); }
  c.fillStyle=T.bug?'rgba(120,120,140,.5)':'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(L*.05,-L*.08,L*.28,L*.05,0,0,TAU); c.fill(); /* 背上反光 */
  // 眼睛
  const er=T.bug?L*.09:L*.05; c.fillStyle=T.bug?'#2a2a30':'#fff6e0'; for(const q of [-1,1]){ c.beginPath(); c.arc(L*.32,q*L*(T.bug?.17:.12),er,0,TAU); c.fill(); } c.fillStyle='#000'; for(const q of [-1,1]){ c.beginPath(); c.arc(L*.34,q*L*(T.bug?.18:.12),er*.55,0,TAU); c.fill(); }
  c.restore(); }
let causCv=null; function caus(){ if(causCv) return causCv; return causCv=cacheCv(200,200,c=>{ c.filter='blur(1.6px)'; c.strokeStyle='rgba(255,255,255,.9)'; c.lineWidth=3; c.lineJoin='round'; for(let i=0;i<40;i++){ const x=rnd(0,200),y=rnd(0,200),q=rnd(12,26),n=5+Math.floor(rnd(0,3)),o=rnd(0,TAU); c.beginPath(); for(let k=0;k<=n;k++){ const a=o+k/n*TAU,a2=o+(k-.5)/n*TAU,r1=q*rnd(.8,1.2); if(!k) c.moveTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1); else c.quadraticCurveTo(x+Math.cos(a2)*q*1.15,y+Math.sin(a2)*q*1.15,x+Math.cos(a)*r1,y+Math.sin(a)*r1); } c.stroke(); } c.filter='none'; /* 水底不規則的柔和光紋 */ }); }
function tub(c,t){ const {x,y,w,h}=TUB;
  c.fillStyle='rgba(0,0,0,.5)'; rr(c,x-8,y-2,w+18,h+18,26); c.fill();
  const rim=c.createLinearGradient(x,y,x,y+h); rim.addColorStop(0,'#4aa0f0'); rim.addColorStop(1,'#1a5ab8'); c.fillStyle=rim; rr(c,x-12,y-12,w+24,h+24,26); c.fill(); c.strokeStyle='rgba(255,255,255,.5)'; c.lineWidth=2; rr(c,x-10,y-10,w+20,h+20,24); c.stroke();
  const wg=c.createRadialGradient(x+w/2,y+h/2,40,x+w/2,y+h/2,w*.6); wg.addColorStop(0,'#3a9ae8'); wg.addColorStop(1,'#1462b8'); c.fillStyle=wg; rr(c,x,y,w,h,16); c.fill(); }
function tubWater(c,t){ const {x,y,w,h}=TUB; c.save(); rr(c,x,y,w,h,16); c.clip(); c.globalAlpha=.1; const k=caus(); for(const [ox,oy,sp] of [[0,0,14],[90,60,-10]]){ const o=((t*sp)%200+200)%200; for(let i=-1;i<4;i++) for(let j=-1;j<3;j++) c.drawImage(k,x+i*200+o+ox,y+j*200+o*.6+oy,200,200); }
  c.globalAlpha=1; for(let i=0;i<5;i++){ const bx=x+w*(.15+i*.18),by=y+h*(.2+(i%2)*.4); c.fillStyle='rgba(255,230,170,.13)'; c.beginPath(); c.ellipse(bx+Math.sin(t+i)*5,by,30,9,0,0,TAU); c.fill(); } /* 燈泡倒影 */
  const ed=c.createLinearGradient(x,y,x,y+30); ed.addColorStop(0,'rgba(0,30,80,.35)'); ed.addColorStop(1,'rgba(0,30,80,0)'); c.fillStyle=ed; c.fillRect(x,y,w,30); c.restore(); }
function poi(c,x,y,R,dur,torn,dip,t){ /* 紙網：塑膠框＋紙 */ c.save(); c.translate(x,y);
  c.strokeStyle='#ff5a8a'; c.lineWidth=9; c.lineCap='round'; c.beginPath(); c.moveTo(R*.7,R*.7); c.lineTo(R*2.2,R*2.2); c.stroke(); c.strokeStyle='rgba(255,255,255,.4)'; c.lineWidth=2; c.beginPath(); c.moveTo(R*.74,R*.66); c.lineTo(R*2.2,R*2.12); c.stroke();
  const wet=1-dur/100; c.fillStyle='rgba(255,255,255,'+(dip?.28:.78-wet*.38)+')'; c.beginPath(); c.arc(0,0,R,0,TAU); c.fill();
  if(wet>.2&&!torn){ c.fillStyle='rgba(200,220,240,'+wet*.35+')'; c.beginPath(); c.arc(-R*.2,R*.1,R*.5*wet,0,TAU); c.fill(); }
  if(torn){ c.fillStyle='rgba(10,40,90,.85)'; c.beginPath(); for(let i=0;i<12;i++){ const a=i/12*TAU,q=R*(.55+((i*7)%5)*.07); c.lineTo(Math.cos(a)*q-R*.08,Math.sin(a)*q+R*.05); } c.closePath(); c.fill(); c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=1; c.stroke(); }
  c.strokeStyle='#ff5a8a'; c.lineWidth=5; c.beginPath(); c.arc(0,0,R,0,TAU); c.stroke(); c.strokeStyle='rgba(255,255,255,.45)'; c.lineWidth=1.5; c.beginPath(); c.arc(0,0,R-1,Math.PI*1.1,Math.PI*1.6); c.stroke(); c.restore(); }
function fishStall(env,o){ const S=STALLS[0],F=[]; const add=(ty)=>F.push({ty,x:rnd(TUB.x+40,TUB.x+TUB.w-40),y:rnd(TUB.y+40,TUB.y+TUB.h-40),a:rnd(0,TAU),ta:rnd(0,TAU),v:FT[ty].spd,z:rnd(0,1),zt:rnd(0,1),ph:rnd(0,TAU),fl:0,fast:0});
  [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,2,2,2,2,3,3].forEach(add);
  const R=42; let px=TUB.x+TUB.w/2,py=TUB.y+TUB.h/2,st='hover',sT=0,dur=100,papers=3,torn=false,tornT=0,caught=[],flying=[],rip=[],score=0,msg=null,ended=false,endT=0;
  const say=(s,col)=>{ msg={s,l:1.8,c:col||'#ffd23f'}; };
  const g={ score:()=>score, left:()=>papers, leftLbl:'紙網', ended:()=>ended&&endT<=0,
    update(dt,t){ const K=env.keys;
      if(msg&&(msg.l-=dt)<=0) msg=null;
      for(let i=rip.length-1;i>=0;i--){ rip[i].l-=dt; if(rip[i].l<=0) rip.splice(i,1); }
      // 金魚游動：慢慢轉向、偶爾浮上來；紙網下水時附近的魚會逃
      for(const f of F){ if(f.got) continue; const T=FT[f.ty]; f.ph+=dt; if(Math.random()<dt*.5) f.ta=f.a+rnd(-1.6,1.6);
        const cx=TUB.x+TUB.w/2,cy=TUB.y+TUB.h/2,m=46; if(f.x<TUB.x+m||f.x>TUB.x+TUB.w-m||f.y<TUB.y+m||f.y>TUB.y+TUB.h-m) f.ta=Math.atan2(cy-f.y,cx-f.x)+rnd(-.5,.5);
        const d=hyp(f.x-px,f.y-py); if(st!=='hover'&&st!=='torn'&&d<R+70&&f.fl<=0){ f.ta=Math.atan2(f.y-py,f.x-px)+rnd(-.4,.4); f.fl=.7; } /* 嚇跑 */
        if(f.fl>0) f.fl-=dt; f.fast=f.fl>0;
        let da=((f.ta-f.a)%TAU+TAU*1.5)%TAU-Math.PI; f.a+=clamp(da,-dt*(f.fast?7:1.6),dt*(f.fast?7:1.6));
        const v=T.spd*(f.fast?2.8:(.55+.45*Math.sin(f.ph*.7)));
        f.x=clamp(f.x+Math.cos(f.a)*v*dt,TUB.x+16,TUB.x+TUB.w-16); f.y=clamp(f.y+Math.sin(f.a)*v*dt,TUB.y+16,TUB.y+TUB.h-16);
        if(Math.random()<dt*.3) f.zt=Math.random()<.55?rnd(0,.4):rnd(.5,1); f.z+=(f.zt-f.z)*dt*.8; }
      for(let i=flying.length-1;i>=0;i--){ const q=flying[i]; q.u+=dt*1.8; if(q.u>=1){ flying.splice(i,1); caught.push(q.f); env.sfx('item'); } }
      if(ended){ endT-=dt; return; }
      if(st==='hover'){ const mx=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0),my=(K.ArrowDown||K.KeyS?1:0)-(K.ArrowUp||K.KeyW?1:0); px=clamp(px+mx*250*dt,TUB.x+R,TUB.x+TUB.w-R); py=clamp(py+my*250*dt,TUB.y+R,TUB.y+TUB.h-R);
        if(env.hit('Space')||env.hit('KeyJ')||env.hit('Enter')){ st='down'; sT=0; env.sfx('place'); rip.push({x:px,y:py,l:.8}); } }
      else if(st==='down'){ sT+=dt; dur-=24*dt; if(sT>.42){ st='up'; sT=0;
          // 起網：網子範圍內、靠近水面的魚
          const cand=F.filter(f=>!f.got&&f.z<.6&&hyp(f.x-px,f.y-py)<R-4).sort((a,b)=>hyp(a.x-px,a.y-py)-hyp(b.x-px,b.y-py)).slice(0,2);
          const load=cand.reduce((s,f)=>s+FT[f.ty].w,0);
          if(cand.length&&load>dur){ torn=true; dur=0; env.sfx('bump'); say('紙破了！魚跑掉了⋯','#ff8a9a'); rip.push({x:px,y:py,l:.8}); }
          else if(cand.length){ dur-=load*.6; for(const f of cand){ f.got=true; flying.push({f,u:0,x0:f.x,y0:f.y}); score+=FT[f.ty].pts; } env.sfx('heal'); const best=cand.reduce((a,f)=>f.ty>a?f.ty:a,0); say(cand.length>1?'一次撈到兩隻！':'撈到'+FT[best].n+'！ +'+cand.reduce((s,f)=>s+FT[f.ty].pts,0),best>=2?'#ffb0ec':'#ffd23f'); }
          else if(dur<=0){ torn=true; env.sfx('bump'); say('紙泡太久破掉了','#ff8a9a'); }
          rip.push({x:px,y:py,l:.6}); } }
      else if(st==='up'){ sT+=dt; if(sT>.3){ if(torn){ st='torn'; tornT=1.1; papers--; } else st='hover'; } }
      else if(st==='torn'){ tornT-=dt; if(tornT<=0){ if(papers<=0){ ended=true; endT=1; } else { torn=false; dur=100; st='hover'; say('換一支新的紙網','#9ae0ff'); } } }
      // 魚撈完就補
      if(F.filter(f=>!f.got).length<12){ add(Math.random()<.6?0:Math.random()<.6?1:2); const n=F[F.length-1]; n.x=TUB.x+20; n.y=rnd(TUB.y+60,TUB.y+TUB.h-60); n.a=0; } },
    draw(c,t){ marketBG(c,t); const bk=c.createLinearGradient(0,60,0,H); bk.addColorStop(0,'#3a2418'); bk.addColorStop(1,'#1a0e08'); c.fillStyle=bk; c.fillRect(166,58,W-166,H-58); canopy(c,160,W,S,t); tub(c,t);
      const dip=st==='down'||(st==='up'&&sT<.12);
      // 深的魚比較暗、看起來比較小
      for(const f of F.filter(f=>!f.got).sort((a,b)=>b.z-a.z)){ c.globalAlpha=.35; c.fillStyle='#062a5a'; c.beginPath(); c.ellipse(f.x+6+f.z*4,f.y+9+f.z*6,FT[f.ty].len*.42,FT[f.ty].len*.18,f.a,0,TAU); c.fill(); c.globalAlpha=1-f.z*.55; drawFish(c,f,t,1-f.z*.18); c.globalAlpha=1; }
      tubWater(c,t);
      for(const r of rip){ const k=1-r.l/.8; c.strokeStyle='rgba(255,255,255,'+(.5*(1-k))+')'; c.lineWidth=2; c.beginPath(); c.ellipse(r.x,r.y,R+k*50,(R+k*50)*.92,0,0,TAU); c.stroke(); }
      if(!ended||st==='torn'){ if(!dip){ c.fillStyle='rgba(0,20,60,.25)'; c.beginPath(); c.ellipse(px+14,py+20,R,R*.9,0,0,TAU); c.fill(); }
        const lift=st==='up'?Math.min(1,sT/.3):dip?0:1,sc=dip?.96:1+lift*.04; c.save(); c.translate(px,py); c.scale(sc,sc); c.translate(-px,-py); poi(c,px,py,R,dur,torn,dip,t);
        // 網上的魚在拍水
        c.restore(); }
      for(const q of flying){ const u=q.u,x=lerp(q.x0,82,u),y=lerp(q.y0,292,u)-Math.sin(u*Math.PI)*90; drawFish(c,{x,y,a:u*6,ty:q.f.ty,ph:0,fast:1},t,.8); }
      // 左邊：分數、紙網、裝魚的碗
      hud(c,g,S,t); c.fillStyle='rgba(255,255,255,.22)'; c.beginPath(); c.ellipse(82,300,62,40,0,0,TAU); c.fill(); c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=2; c.stroke(); c.fillStyle='rgba(120,190,255,.45)'; c.beginPath(); c.ellipse(82,303,54,33,0,0,TAU); c.fill();
      c.font='700 11px '+TC; c.textAlign='center'; c.fillStyle='#fff'; c.fillText('我的碗',82,256);
      caught.forEach((f,i)=>{ const a=t*.6+i*2.1,rx=34*((i*37)%10/10*.6+.3); drawFish(c,{x:82+Math.cos(a)*rx,y:303+Math.sin(a)*rx*.55,a:a+Math.PI/2,ty:f.ty,ph:i,fast:0},t,.62); });
      for(let i=0;i<3;i++){ const ok=i<papers; c.globalAlpha=ok?1:.25; poi(c,30+i*44,382,13,i===3-papers?dur:100,!ok,false,t); c.globalAlpha=1; }
      if(msg) banner(c,msg,TUB.x+TUB.w/2,TUB.y+40); } };
  g.dbg={F,get st(){return st;},get dur(){return dur;},get papers(){return papers;},setP(x,y){px=x;py=y;}};
  return g; }

// ═════════ 套圈圈 ═════════
const RT={HY:132,F:400,HC:1.3,CX:478},RD=3.2;
const proj=(x,d,h)=>{ const z=1.6+d; return [RT.CX+x*RT.F/z,RT.HY+RT.F*(RT.HC-(h||0))/z,RT.F/z]; };
const RKIND=[['can','soda','duck'],['soda','duck','car'],['car','robot','bear'],['bear','robot','car'],['bear','cat','robot'],['cat','bigbear','cat']],RPTS=[1,1,2,3,5,8];
function ringStall(env,o){ const S=STALLS[1],P=[],RINGS=10,rR=.14,bR=.065;
  for(let r=0;r<6;r++) for(let k=0;k<6;k++) P.push({x:-.9+k*.36,d:.5+r*.46,r,kind:RKIND[r][(k+r)%3],got:false});
  let ax=0,ad=1.0,rings=RINGS,fly=null,lying=[],score=0,msg=null,ended=false,endT=0,cool=0;
  const cols=['#ff3a6a','#3ad8ff','#ffd23f','#7aff6a','#ff8a2a','#c88aff'];
  const say=(s,col)=>{ msg={s,l:1.8,c:col||'#ffd23f'}; };
  const g={ score:()=>score,left:()=>rings,leftLbl:'圈圈',ended:()=>ended&&endT<=0,
    update(dt,t){ const K=env.keys; if(msg&&(msg.l-=dt)<=0) msg=null; if(cool>0) cool-=dt;
      if(fly){ fly.u+=dt/fly.T; if(fly.u>=1){ const f=fly; fly=null; land(f); } }
      if(ended){ endT-=dt; return; }
      const mx=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0),my=(K.ArrowUp||K.KeyW?1:0)-(K.ArrowDown||K.KeyS?1:0); ax=clamp(ax+mx*.9*dt,-1.05,1.05); ad=clamp(ad+my*1.3*dt,.35,3.0);
      if(!fly&&rings>0&&cool<=0&&(env.hit('Space')||env.hit('KeyJ')||env.hit('Enter'))){ rings--; const sg=.05+.014*ad; fly={u:0,T:.55+ad*.07,tx:ax+gauss()*sg,td:ad+gauss()*sg*1.3,col:cols[rings%cols.length],spin:rnd(8,12)}; env.sfx('click'); cool=.2; }
      if(!fly&&rings<=0&&!ended){ ended=true; endT=1.2; } },
    draw(c,t){ marketBG(c,t); drawRingBooth(c,t,S,P,lying,ax,ad,fly,!ended); hud(c,g,S,t); if(msg) banner(c,msg,RT.CX,110);
      for(let i=0;i<rings;i++){ c.strokeStyle=cols[i%cols.length]; c.lineWidth=3.5; c.beginPath(); c.ellipse(28+(i%5)*24,392+Math.floor(i/5)*22,9,5,0,0,TAU); c.stroke(); } } };
  function land(f){ let best=null,bd=9; for(const p of P){ if(p.got) continue; const d=hyp(p.x-f.tx,(p.d-f.td)); if(d<bd){ bd=d; best=p; } }
    if(best&&bd+bR<=rR){ best.got=true; score+=RPTS[best.r]; f.on=best; f.tx=best.x; f.td=best.d; lying.push(f); env.sfx(RPTS[best.r]>=5?'win':'heal'); say('套中了！'+prizeName(best.kind)+'　+'+RPTS[best.r],RPTS[best.r]>=5?'#ffb0ec':'#ffd23f'); return; }
    if(best&&bd<rR+bR+.02){ const k=(rR+bR+.03-bd)/(bd||.01); f.tx+=(f.tx-best.x)*k; f.td+=(f.td-best.d)*k; f.lean=1; env.sfx('bump'); say(bd<rR?'差一點！卡在上面掉下來了':'碰到邊彈開了','#cfc8ff'); }
    else { env.sfx('land'); say('沒套到','#cfc8ff'); }
    f.tx=clamp(f.tx,-1.2,1.2); f.td=clamp(f.td,.2,RD-.1); lying.push(f); }
  g.dbg={P,get rings(){return rings;},aim(x,d){ax=x;ad=d;}};
  return g; }
const PNAME={soda:'彈珠汽水',duck:'小鴨',car:'玩具車',robot:'機器人',bear:'小熊',cat:'招財貓',can:'飲料',bigbear:'大熊娃娃'},prizeName=k=>PNAME[k]||k;
function ringFlat(d){ const z=1.6+d; return Math.sin(Math.atan(RT.HC/z)); }
function drawRing(c,x,d,h,col,ang){ const [X,Y,s]=proj(x,d,h),r=.13*s; c.save(); c.translate(X,Y); c.strokeStyle='rgba(0,0,0,.35)'; c.lineWidth=Math.max(2,.028*s); if(h===0){ c.beginPath(); c.ellipse(1,2,r,r*ringFlat(d),0,0,TAU); c.stroke(); }
  c.strokeStyle=col; c.lineWidth=Math.max(2,.024*s); c.beginPath(); c.ellipse(0,0,r,r*Math.abs(h>0?Math.cos(ang||0)*.7+.25:ringFlat(d)),0,0,TAU); c.stroke(); c.strokeStyle='rgba(255,255,255,.5)'; c.lineWidth=Math.max(1,.008*s); c.beginPath(); c.ellipse(0,-1,r,r*(h>0?Math.abs(Math.cos(ang||0)*.7+.25):ringFlat(d)),0,Math.PI*1.1,Math.PI*1.6); c.stroke(); c.restore(); }
function drawRingBooth(c,t,S,P,lying,ax,ad,fly,aimOn){
  // 後牆：獎品架
  const [bl,bt]=proj(-1.35,RD,1.6),[br]=proj(1.35,RD,1.6),[,bb]=proj(0,RD,0); c.fillStyle='#3a1a14'; c.fillRect(bl,bt,br-bl,bb-bt);
  for(let s=0;s<3;s++){ const y=bt+12+s*((bb-bt-20)/3); c.fillStyle='#8a5a2a'; c.fillRect(bl,y+30,br-bl,5); for(let i=0;i<9;i++) prize(c,bl+22+i*(br-bl-44)/8,y+30,1.5,['bigbear','cat','robot','bear','car','soda','duck','bigbear','cat'][(i+s*3)%9]); }
  // 地板：木板＋格子，越遠越小
  const corners=[proj(-1.35,RD),proj(1.35,RD),proj(1.35,-.3),proj(-1.35,-.3)];
  for(const sd of [-1,1]){ const q=[proj(sd*1.35,RD,0),proj(sd*1.35,RD,1.6),proj(sd*1.35,-.3,1.6),proj(sd*1.35,-.3,0)]; c.fillStyle='#4a2a18'; c.beginPath(); q.forEach(p=>c.lineTo(p[0],p[1])); c.closePath(); c.fill(); c.fillStyle='rgba(255,200,130,.08)'; c.fill(); for(let d=0;d<RD;d+=.4){ const a=proj(sd*1.35,d,0),b=proj(sd*1.35,d,1.6); c.strokeStyle='rgba(0,0,0,.3)'; c.lineWidth=1.5; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]); c.stroke(); } } /* 攤位兩側木板牆 */ c.fillStyle='#7a2a1a'; c.beginPath(); corners.forEach(p=>c.lineTo(p[0],p[1])); c.closePath(); c.fill();
  c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=1; for(let i=0;i<=12;i++){ const a=proj(-1.35+i*.225,RD),b=proj(-1.35+i*.225,-.3); c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]); c.stroke(); } for(let d=0;d<=RD;d+=.3){ const a=proj(-1.35,d),b=proj(1.35,d); c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]); c.stroke(); }
  const lg=c.createLinearGradient(0,bb,0,H); lg.addColorStop(0,'rgba(0,0,0,.35)'); lg.addColorStop(.4,'rgba(255,200,120,.08)'); lg.addColorStop(1,'rgba(0,0,0,.1)'); c.fillStyle=lg; c.beginPath(); corners.forEach(p=>c.lineTo(p[0],p[1])); c.closePath(); c.fill();
  // 瞄準點
  const items=[]; for(const p of P) items.push({d:p.d,f:()=>{ const [X,Y,s]=proj(p.x,p.d); c.fillStyle='#c8a070'; c.beginPath(); c.ellipse(X,Y,.075*s,.075*s*ringFlat(p.d),0,0,TAU); c.fill(); c.fillStyle='#8a6a40'; c.fillRect(X-.075*s,Y-.03*s,.15*s,.03*s); c.fillStyle='#d8b080'; c.beginPath(); c.ellipse(X,Y-.03*s,.075*s,.075*s*ringFlat(p.d),0,0,TAU); c.fill(); if(!p.got) prize(c,X,Y-.03*s,s/180,p.kind); }});
  for(const f of lying) items.push({d:f.td+.001,f:()=>drawRing(c,f.tx,f.td,0,f.col)});
  items.sort((a,b)=>b.d-a.d).forEach(q=>q.f());
  if(aimOn&&!fly){ const [X,Y,s]=proj(ax,ad); c.setLineDash([6,5]); c.strokeStyle='rgba(255,255,255,.85)'; c.lineWidth=2; c.beginPath(); c.ellipse(X,Y,.13*s,.13*s*ringFlat(ad),0,0,TAU); c.stroke(); c.setLineDash([]); c.fillStyle='#fff'; c.beginPath(); c.arc(X,Y,2.5,0,TAU); c.fill(); }
  // 繩子圍欄
  const [fl,fy]=proj(-1.35,0,.85),[fr]=proj(1.35,0,.85); c.strokeStyle='#e8d8a8'; c.lineWidth=4; c.beginPath(); c.moveTo(fl,fy); c.quadraticCurveTo((fl+fr)/2,fy+18,fr,fy); c.stroke(); c.fillStyle='#5a3a1a'; c.fillRect(fl-5,fy-6,10,H-fy+6); c.fillRect(fr-5,fy-6,10,H-fy+6);
  if(fly){ const u=fly.u,x=lerp(0,fly.tx,u),d=lerp(-.25,fly.td,u),h=lerp(1.25,0,u)+Math.sin(u*Math.PI)*(.45+fly.td*.18); drawRing(c,x,Math.max(-.2,d),h,fly.col,u*fly.spin); }
  canopy(c,160,W,S,t); }

// ═════════ 射氣球 ═════════
const BB={x:212,y:92,w:560,h:300,cols:8,rows:5};
const BCOL=['#ff2a3a','#ffd21f','#2a8aff','#2ad86a','#ff7ad8','#ff8a1a','#a04aff','#f4f4f4'];
function balloon(c,x,y,r,col,t,ph){ const wob=Math.sin(t*2+ph)*1.5; c.save(); c.translate(x+wob,y);
  c.strokeStyle='rgba(255,255,255,.5)'; c.lineWidth=1; c.beginPath(); c.moveTo(0,r*1.15); c.quadraticCurveTo(3,r*1.5,0,r*1.9); c.stroke();
  const g=c.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r*1.2); g.addColorStop(0,shade(col,.55)); g.addColorStop(.45,col); g.addColorStop(1,shade(col,-.5)); c.fillStyle=g; c.beginPath(); c.ellipse(0,0,r,r*1.15,0,0,TAU); c.fill();
  c.fillStyle=shade(col,-.3); c.beginPath(); c.moveTo(-3,r*1.12); c.lineTo(3,r*1.12); c.lineTo(0,r*1.28); c.fill();
  c.fillStyle='rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(-r*.38,-r*.45,r*.18,r*.3,-.5,0,TAU); c.fill(); c.restore(); }
function balloonStall(env,o){ const S=STALLS[2],B=[];
  for(let r=0;r<BB.rows;r++) for(let k=0;k<BB.cols;k++){ const gold=((r*5+k*3)%11===0); B.push({x:BB.x+40+k*(BB.w-80)/(BB.cols-1),y:BB.y+40+r*(BB.h-70)/(BB.rows-1),r:gold?13:18,col:gold?'#ffcf3a':BCOL[(r*3+k*5)%BCOL.length],gold,row:r,ph:rnd(0,TAU),up:true}); }
  let cx=BB.x+BB.w/2,cy=BB.y+BB.h/2,shots=15,score=0,cool=0,rec=0,holes=[],bits=[],msg=null,ended=false,endT=0,rowDone={};
  const say=(s,col)=>{ msg={s,l:1.6,c:col||'#ffd23f'}; };
  const sway=t=>[Math.sin(t*1.3)*13+Math.sin(t*3.7)*7,Math.cos(t*1.7)*10+Math.sin(t*2.9)*6]; /* 手會晃 */
  const g={ score:()=>score,left:()=>shots,leftLbl:'子彈',ended:()=>ended&&endT<=0,
    update(dt,t){ const K=env.keys; if(msg&&(msg.l-=dt)<=0) msg=null; if(cool>0) cool-=dt; rec=Math.max(0,rec-dt*5);
      for(let i=bits.length-1;i>=0;i--){ const b=bits[i]; b.l-=dt; if(b.l<=0){ bits.splice(i,1); continue; } b.x+=b.vx*dt; b.y+=b.vy*dt; b.vy+=500*dt; b.a+=b.va*dt; }
      if(ended){ endT-=dt; return; }
      const mx=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0),my=(K.ArrowDown||K.KeyS?1:0)-(K.ArrowUp||K.KeyW?1:0); cx=clamp(cx+mx*230*dt,BB.x,BB.x+BB.w); cy=clamp(cy+my*230*dt,BB.y,BB.y+BB.h);
      if(shots>0&&cool<=0&&(env.hit('Space')||env.hit('KeyJ')||env.hit('Enter'))){ shots--; cool=.4; rec=1; env.sfx('click'); const [sx,sy]=sway(t),hx=cx+sx,hy=cy+sy;
        let hit=null; for(const b of B){ if(!b.up) continue; const bx=b.x+Math.sin(t*2+b.ph)*1.5,dx=(hx-bx)/b.r,dy=(hy-b.y)/(b.r*1.15); if(dx*dx+dy*dy<=1){ hit=b; break; } }
        if(hit){ hit.up=false; const p=hit.gold?3:1; score+=p; env.sfx('pop'); for(let i=0;i<12;i++){ const a=rnd(0,TAU),v=rnd(80,260); bits.push({x:hit.x,y:hit.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-60,l:.6,a:rnd(0,TAU),va:rnd(-12,12),c:hit.col}); }
          say((hit.gold?'金色氣球！':'啪！')+' +'+p,hit.gold?'#ffd23f':'#fff');
          const row=hit.row; if(!rowDone[row]&&B.filter(b=>b.row===row).every(b=>!b.up)){ rowDone[row]=1; score+=5; say('整排清空！+5','#86dc4f'); env.sfx('win'); } }
        else { holes.push({x:hx,y:hy}); env.sfx('land'); }
        if(shots<=0){ ended=true; endT=1.2; } } },
    draw(c,t){ marketBG(c,t);
      // 攤位內部：木頭框＋洞洞板背板
      c.fillStyle='#2a1a10'; c.fillRect(170,58,W-170,H-58); const pb=c.createLinearGradient(0,BB.y,0,BB.y+BB.h); pb.addColorStop(0,'#c8a070'); pb.addColorStop(1,'#9a7448'); c.fillStyle=pb; c.fillRect(BB.x-18,BB.y-18,BB.w+36,BB.h+36);
      c.fillStyle='rgba(60,30,10,.35)'; for(let x=BB.x-8;x<BB.x+BB.w+18;x+=16) for(let y=BB.y-8;y<BB.y+BB.h+18;y+=16){ c.beginPath(); c.arc(x,y,1.6,0,TAU); c.fill(); }
      c.strokeStyle='#5a3a1a'; c.lineWidth=8; c.strokeRect(BB.x-22,BB.y-22,BB.w+44,BB.h+44);
      for(const h of holes){ c.fillStyle='#1a0e06'; c.beginPath(); c.arc(h.x,h.y,2.6,0,TAU); c.fill(); c.strokeStyle='rgba(255,230,190,.5)'; c.lineWidth=1; c.beginPath(); c.arc(h.x,h.y,4,0,TAU); c.stroke(); }
      for(const b of B){ if(b.up) balloon(c,b.x,b.y,b.r,b.col,t,b.ph); else { c.fillStyle=shade(b.col,-.35); c.beginPath(); c.moveTo(b.x-4,b.y+b.r); c.lineTo(b.x+5,b.y+b.r+3); c.lineTo(b.x,b.y+b.r+9); c.fill(); } }
      for(const b of bits){ c.save(); c.translate(b.x,b.y); c.rotate(b.a); c.globalAlpha=clamp(b.l/.6,0,1); c.fillStyle=b.c; c.fillRect(-4,-2,8,4); c.restore(); }
      // 檯面
      const cg=c.createLinearGradient(0,BB.y+BB.h+30,0,H); cg.addColorStop(0,'#8a4a1e'); cg.addColorStop(1,'#4a2410'); c.fillStyle=cg; c.fillRect(170,BB.y+BB.h+30,W-170,H); c.fillStyle='rgba(255,220,160,.25)'; c.fillRect(170,BB.y+BB.h+30,W-170,3);
      canopy(c,160,W,S,t);
      // 準星＋空氣槍
      const [sx,sy]=sway(t),X=cx+sx,Y=cy+sy;
      if(!ended){ c.strokeStyle='rgba(255,40,40,.95)'; c.lineWidth=2; c.beginPath(); c.arc(X,Y,13,0,TAU); c.moveTo(X-20,Y); c.lineTo(X-6,Y); c.moveTo(X+6,Y); c.lineTo(X+20,Y); c.moveTo(X,Y-20); c.lineTo(X,Y-6); c.moveTo(X,Y+6); c.lineTo(X,Y+20); c.stroke(); c.fillStyle='#ff2a2a'; c.beginPath(); c.arc(X,Y,1.8,0,TAU); c.fill(); }
      gun(c,X,Y,rec); hud(c,g,S,t); if(msg) banner(c,msg,BB.x+BB.w/2,BB.y+BB.h+52); } };
  g.dbg={B,get shots(){return shots;},aim(x,y){cx=x;cy=y;},sway};
  return g; }
function gun(c,X,Y,rec){ const bx=640,by=520,a=Math.atan2(Y-by,X-bx); c.save(); c.translate(bx,by); c.rotate(a); c.translate(-rec*14,0);
  c.fillStyle='#4a2a14'; c.beginPath(); c.moveTo(-60,-12); c.lineTo(40,-10); c.lineTo(40,8); c.lineTo(-30,14); c.lineTo(-70,30); c.lineTo(-80,10); c.closePath(); c.fill(); /* 木頭槍托 */
  const g=c.createLinearGradient(0,-8,0,8); g.addColorStop(0,'#8a8e98'); g.addColorStop(.4,'#d8dce4'); g.addColorStop(1,'#3a3e48'); c.fillStyle=g; rr(c,30,-7,150,12,4); c.fill(); c.fillStyle='#2a2e38'; c.fillRect(176,-8,8,14); c.fillRect(120,-12,6,5);
  c.restore(); c.fillStyle='#e6bc96'; c.beginPath(); c.ellipse(bx+Math.cos(a)*40-6,by+Math.sin(a)*40+4,16,12,a,0,TAU); c.fill(); }

// ═════════ 彈珠檯 ═════════
const PB={x0:318,x1:622,top:84,bot:474,lane:600,acx:470,acy:236,ar:152,br:6};
const HOLES=[]; for(let r=0;r<5;r++) for(let k=0;k<5;k++) HOLES.push({x:350+k*52,y:262+r*44,n:r*5+k+1});
const PINS=(()=>{ const p=[]; for(const h of HOLES){ p.push([h.x-11,h.y-3],[h.x+11,h.y-3],[h.x-8,h.y+9],[h.x+8,h.y+9]); }
  for(let r=0;r<5;r++) for(let k=0;k<4;k++) p.push([376+k*52,244+r*44]);
  for(let k=0;k<6;k++) p.push([342+k*48,212+(k%2)*10]); for(let k=0;k<4;k++) p.push([372+k*52,182]);
  for(let i=0;i<12;i++){ const y=226+i*21; p.push([326+(i%2)*7,y],[590-(i%2)*7,y]); } /* 兩側導引釘，彈珠不會貼著牆直接掉下去 */ return p; })();
const LINES=(()=>{ const L=[]; for(let i=0;i<5;i++){ L.push([0,1,2,3,4].map(k=>i*5+k)); L.push([0,1,2,3,4].map(k=>k*5+i)); } L.push([0,6,12,18,24]); L.push([4,8,12,16,20]); return L; })();
function pinStall(env,o){ const S=STALLS[3]; let balls=10,score=0,ball=null,pow=0,pt=0,filled={},lines={},msg=null,ended=false,endT=0,trail=[],plunge=0;
  const say=(s,col)=>{ msg={s,l:1.8,c:col||'#ffd23f'}; };
  const g={ score:()=>score,left:()=>balls,leftLbl:'彈珠',ended:()=>ended&&endT<=0,
    update(dt,t){ if(msg&&(msg.l-=dt)<=0) msg=null; if(ended){ endT-=dt; return; }
      if(!ball){ pt+=dt; pow=.5-.5*Math.cos(pt*3.4); plunge=pow; /* 力道表來回跑，按下去就彈出 */
        if(balls>0&&(env.hit('Space')||env.hit('KeyJ')||env.hit('Enter'))){ balls--; ball={x:611,y:PB.bot-10,vx:0,vy:-(560+pow*330)*rnd(.98,1.02),left:false,t:0,still:0}; plunge=0; env.sfx('spring'); }
        if(balls<=0&&!ball){ ended=true; endT=1.2; } return; }
      const n=4,h=dt/n; for(let s=0;s<n&&ball;s++) step(h);
      trail.push([ball?ball.x:0,ball?ball.y:0]); if(trail.length>8||!ball) trail.shift(); },
    draw(c,t){ marketBG(c,t); drawPinBooth(c,t,S); drawMachine(c,t,filled,lines,ball,trail,plunge,pow); canopy(c,160,W,S,t); hud(c,g,S,t);
      if(!ball&&!ended){ c.fillStyle='rgba(11,10,28,.85)'; rr(c,650,170,120,190,12); c.fill(); c.font='900 13px '+TC; c.fillStyle='#ffd23f'; c.textAlign='center'; c.fillText('力道',710,190); const gx=694,gy=206,gh=136; c.fillStyle='#2a2440'; c.fillRect(gx,gy,32,gh); const gg=c.createLinearGradient(0,gy+gh,0,gy); gg.addColorStop(0,'#3ed16a'); gg.addColorStop(.6,'#ffd23f'); gg.addColorStop(1,'#ff4a3a'); c.fillStyle=gg; c.fillRect(gx,gy+gh*(1-pow),32,gh*pow); c.strokeStyle='#fff'; c.lineWidth=2; c.strokeRect(gx,gy,32,gh); c.font='700 11px '+TC; c.fillStyle='#fff'; c.fillText('空白鍵彈出',710,352); }
      c.fillStyle='rgba(11,10,28,.85)'; rr(c,650,370,120,64,12); c.fill(); c.font='900 12px '+TC; c.fillStyle='#cfc8ff'; c.textAlign='center'; c.fillText('連線',710,390); c.font='900 24px '+TC; c.fillStyle='#86dc4f'; c.fillText(Object.keys(lines).length+' 條',710,416);
      if(msg) banner(c,msg,470,150); } };
  function step(h){ const b=ball; b.t+=h; b.vy+=520*h; b.x+=b.vx*h; b.y+=b.vy*h; const r=PB.br;
    // 頂端圓弧
    if(b.y<PB.acy){ const dx=b.x-PB.acx,dy=b.y-PB.acy,d=hyp(dx,dy); if(d>PB.ar-r){ const nx=dx/d,ny=dy/d,vn=b.vx*nx+b.vy*ny; b.x=PB.acx+nx*(PB.ar-r); b.y=PB.acy+ny*(PB.ar-r); if(vn>0){ b.vx-=vn*nx*1.15; b.vy-=vn*ny*1.15; } } }
    if(b.x<PB.x0+r){ b.x=PB.x0+r; b.vx=Math.abs(b.vx)*.5; } if(b.x>PB.x1-r){ b.x=PB.x1-r; b.vx=-Math.abs(b.vx)*.5; }
    // 發射軌道的隔板：出去之後就回不來
    if(b.x<PB.lane-2&&b.y<PB.acy) b.left=true;
    if(!b.left){ if(b.x<PB.lane+r&&b.y>PB.acy-30){ b.x=PB.lane+r; b.vx=Math.abs(b.vx)*.3; } }
    else if(b.x>PB.lane-r&&b.y>PB.acy-30){ b.x=PB.lane-r; b.vx=-Math.abs(b.vx)*.5; }
    if(!b.left&&b.y>PB.bot-10&&b.vy>0){ ball=null; balls++; say('力道不夠，再彈一次','#cfc8ff'); env.sfx('bump'); return; }
    for(const p of PINS){ const dx=b.x-p[0],dy=b.y-p[1],d=hyp(dx,dy),m=r+2.2; if(d<m&&d>.01){ const nx=dx/d,ny=dy/d,vn=b.vx*nx+b.vy*ny; b.x=p[0]+nx*m; b.y=p[1]+ny*m; if(vn<0){ b.vx-=vn*nx*1.55; b.vy-=vn*ny*1.55; b.vx+=rnd(-14,14); if(Math.abs(vn)>80) env.sfx('rattle'); } } }
    for(const q of HOLES){ const d=hyp(b.x-q.x,b.y-q.y); if(d<9&&!filled[q.n]&&b.left){ filled[q.n]=1; ball=null; score+=1; env.sfx('item'); let nl=0; LINES.forEach((L,i)=>{ if(!lines[i]&&L.every(k=>filled[k+1])){ lines[i]=1; nl++; } }); if(nl){ score+=nl*5; say((nl>1?nl+' 條':'')+'連線！BINGO +'+nl*5,'#86dc4f'); env.sfx('win'); } else say('進洞 '+q.n+' 號　+1'); return; } }
    if(b.y>PB.bot+r){ ball=null; say('掉下去了','#cfc8ff'); env.sfx('die'); return; }
    if(b.left&&hyp(b.vx,b.vy)<25){ b.still+=h; if(b.still>.8){ b.still=0; b.kick=(b.kick||0)+1; if(b.kick>3){ ball=null; say('卡住了，算掉下去','#cfc8ff'); env.sfx('die'); return; } b.vx=rnd(-90,90); b.vy=-60; env.sfx('bump'); } } else b.still=0; /* 卡在釘子上：拍一下機台 */
    if(b.t>14){ ball=null; } }
  g.dbg={get balls(){return balls;},get ball(){return ball;},get filled(){return filled;},setPow(v){pt=Math.acos(1-2*clamp(v,0,1))/3.4;}};
  return g; }
function drawPinBooth(c,t,S){ c.fillStyle='#2a1810'; c.fillRect(170,58,W-170,H-58); const wl=c.createLinearGradient(170,0,W,0); wl.addColorStop(0,'#3a2216'); wl.addColorStop(.5,'#5a3420'); wl.addColorStop(1,'#3a2216'); c.fillStyle=wl; c.fillRect(176,64,W-182,H-70);
  for(let s=0;s<2;s++){ const y=150+s*140; c.fillStyle='#8a5a2a'; c.fillRect(180,y,110,6); c.fillRect(W-146,y-4,140,6); ['snack','yakult','sausage','candy'].forEach((k,i)=>{ prize(c,200+i*26,y,1.1,k); }); }
  c.fillStyle='#5a5a62'; c.fillRect(176,H-24,W-182,24); }
function drawMachine(c,t,filled,lines,ball,trail,plunge,pow){ const X0=PB.x0-18,X1=PB.x1+18,Y0=PB.top-60+2,Y1=PB.bot+18;
  c.fillStyle='rgba(0,0,0,.5)'; rr(c,X0+8,Y0+10,X1-X0,Y1-Y0,18); c.fill();
  const body=c.createLinearGradient(X0,0,X1,0); body.addColorStop(0,'#8a1a10'); body.addColorStop(.5,'#d83a20'); body.addColorStop(1,'#7a1408'); c.fillStyle=body; rr(c,X0,Y0,X1-X0,Y1-Y0,18); c.fill();
  // 盤面
  c.save(); c.beginPath(); c.moveTo(PB.x0,PB.acy); c.arc(PB.acx,PB.acy,PB.ar,Math.PI,0); c.lineTo(PB.x1,PB.bot); c.lineTo(PB.x0,PB.bot); c.closePath(); const fg=c.createLinearGradient(0,PB.top,0,PB.bot); fg.addColorStop(0,'#fff4c8'); fg.addColorStop(1,'#f0c878'); c.fillStyle=fg; c.fill(); c.clip();
  c.globalAlpha=.18; c.font='900 30px '+TC; c.fillStyle='#c81e1e'; c.textAlign='center'; c.fillText('BINGO',PB.acx,150); c.globalAlpha=1;
  // 連線亮燈
  LINES.forEach((L,i)=>{ if(!lines[i]) return; c.strokeStyle='rgba(60,220,100,.55)'; c.lineWidth=12; c.lineCap='round'; c.beginPath(); c.moveTo(HOLES[L[0]].x,HOLES[L[0]].y); c.lineTo(HOLES[L[4]].x,HOLES[L[4]].y); c.stroke(); });
  for(const q of HOLES){ const on=filled[q.n]; c.fillStyle=on?'#ffd23f':'#3a2010'; c.beginPath(); c.arc(q.x,q.y,7.5,0,TAU); c.fill(); c.strokeStyle='#8a6a3a'; c.lineWidth=1.5; c.stroke(); if(on){ ballDraw(c,q.x,q.y); } c.font='900 9px '+TC; c.fillStyle=on?'#c81e1e':'#6a4a2a'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(q.n,q.x,q.y-17); }
  for(const p of PINS){ c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.arc(p[0]+1.2,p[1]+1.6,2.4,0,TAU); c.fill(); c.fillStyle='#d8dce4'; c.beginPath(); c.arc(p[0],p[1],2.2,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(p[0]-.6,p[1]-.6,.9,0,TAU); c.fill(); }
  c.fillStyle='#8a1a10'; c.fillRect(PB.lane-3,PB.acy-30,5,PB.bot-PB.acy+30); /* 發射軌道隔板 */
  if(ball){ trail.forEach((p,i)=>{ c.fillStyle='rgba(200,210,230,'+(i/trail.length*.3)+')'; c.beginPath(); c.arc(p[0],p[1],PB.br*.8,0,TAU); c.fill(); }); ballDraw(c,ball.x,ball.y); }
  else ballDraw(c,611,PB.bot-10+plunge*0);
  c.restore();
  // 彈簧拉桿
  const py=PB.bot+6+pow*0; c.fillStyle='#c8ccd6'; c.fillRect(607,PB.bot-2,8,24+(ball?0:plunge*14)); c.fillStyle='#1a1a1a'; rr(c,598,PB.bot+20+(ball?0:plunge*14),26,12,5); c.fill();
  // 玻璃反光
  c.fillStyle='rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(PB.x0+40,PB.top+30); c.lineTo(PB.x0+90,PB.top+20); c.lineTo(PB.x0+10,PB.bot); c.lineTo(PB.x0-10,PB.bot); c.closePath(); c.fill();
  c.strokeStyle='#ffd23f'; c.lineWidth=4; c.beginPath(); c.moveTo(PB.x0,PB.acy); c.arc(PB.acx,PB.acy,PB.ar,Math.PI,0); c.lineTo(PB.x1,PB.bot); c.lineTo(PB.x0,PB.bot); c.closePath(); c.stroke();
  for(let i=0;i<14;i++){ const a=Math.PI+i/13*Math.PI,on=(Math.floor(t*6)+i)%2; c.fillStyle=on?'#fff6a0':'#7a5a2a'; c.beginPath(); c.arc(PB.acx+Math.cos(a)*(PB.ar+11),PB.acy+Math.sin(a)*(PB.ar+11),3,0,TAU); c.fill(); } }
function ballDraw(c,x,y){ const g=c.createRadialGradient(x-2,y-2,.5,x,y,PB.br); g.addColorStop(0,'#fff'); g.addColorStop(.5,'#c8ccd8'); g.addColorStop(1,'#5a6070'); c.fillStyle=g; c.beginPath(); c.arc(x,y,PB.br,0,TAU); c.fill(); }

// ───────── 共用介面 ─────────
function banner(c,m,x,y){ c.font='900 20px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=6; c.strokeStyle='#14122b'; c.globalAlpha=clamp(m.l*2,0,1); c.strokeText(m.s,x,y); c.fillStyle=m.c; c.fillText(m.s,x,y); c.globalAlpha=1; }
function hud(c,g,S,t){ c.fillStyle='rgba(11,10,28,.82)'; rr(c,8,70,148,150,12); c.fill(); c.textAlign='left'; c.textBaseline='alphabetic'; c.font='900 12px '+TC; c.fillStyle='#cfc8ff'; c.fillText('分數',20,90); c.font='900 28px '+TC; c.fillStyle='#fff'; c.fillText(g.score(),20,120);
  c.font='900 12px '+TC; c.fillStyle='#cfc8ff'; c.fillText(g.leftLbl+'　剩 '+g.left(),20,144);
  const sc=g.score(); S.th.forEach((v,i)=>{ const ok=sc>=v,y=164+i*18; c.fillStyle=ok?'#ffd23f':'rgba(255,255,255,.4)'; c.font='700 11px '+TC; c.fillText((ok?'★ ':'☆ ')+['小獎','中獎','大獎'][i]+' '+v+' 分',20,y); }); }

function create(env,opts){ const si=clamp(opts.stage|0,0,STALLS.length-1),S=STALLS[si],{ctx:c}=env.canvas2d(W,H);
  const G=[fishStall,ringStall,balloonStall,pinStall][si](env,opts); let t=0,done=false;
  function update(dt){ dt=Math.min(dt,.05); t+=dt; G.update(dt,t); if(!done&&G.ended()){ done=true; finish(); } }
  function finish(){ const sc=G.score(); let tier=-1; S.th.forEach((v,i)=>{ if(sc>=v) tier=i; });
    const best=load('best.'+si,0); if(sc>best) store('best.'+si,sc); const al=load('album.'+si,{}); if(tier>=0){ al[tier]=(al[tier]||0)+1; store('album.'+si,al); }
    env.sfx(tier>=1?'win':tier===0?'heal':'lose');
    const pz=tier>=0?S.pz[tier]:null;
    env.end({title:pz?'老闆：恭喜！拿去吧！':'老闆：再來一次啦！',big:sc+' 分',html:'<table class="ls"><tr><th>獎項</th><th>分數</th><th>獎品</th></tr>'+S.th.map((v,i)=>'<tr><td>'+(i===tier?'★ ':'')+['小獎','中獎','大獎'][i]+'</td><td>'+v+' 分</td><td>'+S.pz[i][0]+(al[i]?'　✓':'')+'</td></tr>').join('')+'</table>',
      text:pz?'你換到「'+pz[0]+'」！':'差一點就有獎品了。',score:sc||null}); }
  function draw(){ c.save(); G.draw(c,t); c.restore(); }
  return {update,draw,destroy(){},_dbg:G.dbg?Object.assign(G.dbg,{G}):{G}}; }

function stageShow(ctx,w,h,si,t){ ctx.save(); ctx.scale(w/W,h/H); const env={keys:{},hit:()=>false,sfx:()=>{},end:()=>{}};
  const k='__nightPv'+si; if(!stageShow[k]) stageShow[k]=[fishStall,ringStall,balloonStall,pinStall][si](env,{}); const G=stageShow[k];
  if(si===1&&G.dbg&&!G._lay){ G._lay=1; } if(si===2&&!G._pv){ G._pv=1; G.dbg.aim(480,220); }
  G.draw(ctx,t||0); ctx.restore(); }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).night={
  name:'夜市遊戲大集合',tag:'NIGHT MARKET',color:'#ff5a3a',
  desc:'逛台灣夜市！四個攤位：撈金魚、套圈圈、射氣球、賓果彈珠檯。燈泡串、紅燈籠、雞排攤、熙來攘往的人潮，玩得越好換到的獎品越大，獎品會收藏起來。',
  goal:'選一個攤位玩，分數到了就能換小獎、中獎或大獎。',
  stages:STALLS.map(s=>s.n),stageLabel:'選擇攤位',stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,0,t),
  stageGoal:si=>['用紙網撈金魚，紙泡水太久或撈太重的魚會破。3 支紙網都破了就結束。','把 10 個圈圈丟出去，要整個套住獎品才算。越後面的獎品分數越高。','15 發子彈射氣球，金色氣球 3 分，打掉一整排多 5 分。','力道表來回跑，按下去把彈珠彈出去。進洞得分，連成一條線（橫、直、斜）多 5 分。'][si],
  stageHelp:si=>{ const H=[[['方向鍵','移動紙網'],['空白鍵','下水撈（靠近水面的魚比較好撈）']],[['← →','左右瞄準'],['↑ ↓','丟遠、丟近'],['空白鍵','丟圈圈']],[['方向鍵','移動準星（手會晃）'],['空白鍵','開槍']],[['空白鍵','照力道表彈出彈珠']]][si];
    const T=[[['方向','移動紙網'],['撈！','下水撈']],[['方向','瞄準、遠近'],['丟！','丟圈圈']],[['方向','移動準星'],['射！','開槍']],[['彈！','彈出彈珠']]][si]; return {help:H,touchHelp:T}; },
  stageBest:i=>{ const b=load('best.'+i,0),al=load('album.'+i,{}),n=Object.keys(al).length; return b?'最高 '+b+' 分'+(n?'・獎品 '+n+'/3':''):''; },
  help:[['方向鍵','移動'],['空白鍵','撈、丟、射、彈']],touchHelp:[['方向','移動'],['按鈕','撈、丟、射、彈']],
  touch:{left:'dpad',right:[{l:'GO！',c:'Space',act:true}]},
  best:{label:'最高分',fmt:v=>v+' 分',lower:false},create};
})();
