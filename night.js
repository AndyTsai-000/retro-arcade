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
  {n:'彈珠檯',sign:'賓果彈珠檯',sub:'10 顆 50 元',tarp:['#e8a020','#7a2a10'],th:[4,8,14],pz:[['一包乖乖','snack'],['養樂多一排','yakult'],['烤香腸兌換券','sausage']]},
  {n:'九宮格',sign:'棒球九宮格',sub:'12 球 100 元',tarp:['#2a7a3a','#f4f0e8'],th:[8,16,24],pz:[['可樂一罐','can'],['棒球手套','glove'],['球棒＋棒球','bat']]},
  {n:'丟沙包',sign:'丟沙包',sub:'一座 3 包 50 元',tarp:['#8a3ac8','#f4f0e8'],th:[20,32,44],pz:[['泡泡水','bubble'],['玩具車','car'],['大隻招財貓','cat']]},
  {n:'手槍射氣球',sign:'手槍射氣球',sub:'20 發 100 元',tarp:['#c82a2a','#1a1a2a'],th:[10,18,26],pz:[['氣球狗','balloondog'],['玩具手槍','toygun'],['大型絨毛娃娃','bigbear']]},
  {n:'賓果麻將',sign:'麻將賓果',sub:'6 局 每局抽 15 張',tarp:['#1a6a4a','#e8c040'],th:[1,2,3],unit:'隻娃娃',pz:[['中型布偶娃娃 1 隻','bear'],['中型布偶娃娃 2 隻','bear'],['中型布偶娃娃 3 隻','bear']]}];
STALLS.forEach((s,i)=>s.i=i);
const aKey='arcade.night.',load=(k,d)=>{ try{ const v=localStorage.getItem(aKey+k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },store=(k,v)=>{ try{ localStorage.setItem(aKey+k,JSON.stringify(v)); }catch(e){} };

// ───────── 夜市街景（遠處攤位、燈泡、人潮、煙） ─────────
const FOODS=[['雞排','#ffd23f','#c81e1e'],['珍珠奶茶','#fff','#7a4a2a'],['臭豆腐','#ffe08a','#1f6a2a'],['大腸包小腸','#fff','#c83a1e'],['蚵仔煎','#ffd23f','#1f4ab8'],['烤玉米','#ffe8a0','#a0501a'],['地瓜球','#fff','#e07a1a'],['滷味','#ffd23f','#5a1a1a'],['豆花','#fff','#2a7ab8'],['胡椒餅','#ffe08a','#8a2a1a'],['鹽酥雞','#ffd23f','#d82a2a'],['蔥油餅','#fff','#3a8a3a']];
const FPRICE=[80,60,70,75,80,60,40,100,45,55,90,40],FSIDE=[['甘梅薯條',40],['布丁奶茶',65],['麻辣臭豆腐',80],['香腸加大',90],['蝦仁煎',100],['奶油玉米',70],['芋頭球',40],['加王子麵',15],['花生豆花',50],['黑胡椒餅',60],['炸杏鮑菇',50],['加蛋',15]];
let skyCv=null;
/* 遠處的老街：三四層樓的公寓、鐵窗、冷氣、直立發光招牌 */
function skyline(){ if(skyCv) return skyCv; const Wd=1600,Hd=200; return skyCv=cacheCv(Wd,Hd,c=>{ let x=0,i=0; const R=k=>Math.abs(Math.sin(i*12.9898+k*78.233)*43758.5453)%1,SG=['藥局','牛肉麵','KTV','當舖','眼鏡','手機','診所','冰品','檳榔','鞋店','髮廊','麵包'],SC=['#e8201a','#ffd23f','#2a8ae8','#3ac85a','#ff7ab0','#ff8a2a'];
  while(x<Wd){ const bw=110+R(1)*90,bh=110+R(2)*80,y=Hd-bh,col=['#2a2630','#30282a','#26262e','#2e2a26'][i%4]; c.fillStyle=col; c.fillRect(x,y,bw-4,bh);
    for(let fy=y+14;fy<Hd-50;fy+=34) for(let fx=x+10;fx<x+bw-24;fx+=30){ const lit=R(fy+fx)<.55; c.fillStyle=lit?(R(fx)<.5?'rgba(255,214,140,.75)':'rgba(190,220,255,.6)'):'rgba(20,20,30,.8)'; c.fillRect(fx,fy,18,16); c.strokeStyle='rgba(120,120,130,.5)'; c.lineWidth=1; for(let k=0;k<4;k++){ c.beginPath(); c.moveTo(fx+2+k*5,fy-2); c.lineTo(fx+2+k*5,fy+18); c.stroke(); } if(R(fx+fy)<.3){ c.fillStyle='#8a8e98'; c.fillRect(fx+18,fy+6,10,8); } }
    const sx=x+bw-26,sh=70+R(5)*40,sc=SC[i%SC.length],txt=SG[i%SG.length]; c.save(); c.shadowColor=sc; c.shadowBlur=12; c.fillStyle=sc; c.fillRect(sx,Hd-sh-60,20,sh); c.restore(); c.fillStyle=sc==='#ffd23f'?'#c81414':'#fff'; c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; [...txt].forEach((ch,k)=>c.fillText(ch,sx+10,Hd-sh-60+14+k*17)); x+=bw; i++; } }); }
const VPX=90,VPY=196;
let streetCv=null;
function street(){ if(streetCv) return streetCv; return streetCv=cacheCv(W,H,c=>{
  const sky=c.createLinearGradient(0,0,0,VPY); sky.addColorStop(0,'#05060f'); sky.addColorStop(1,'#1c1426'); c.fillStyle=sky; c.fillRect(0,0,W,VPY+4);
  // 遠處大樓
  for(let i=0;i<22;i++){ const x=i*40-10,h=40+((i*37)%60); c.fillStyle='#0c0d18'; c.fillRect(x,VPY-h-30,38,h+40); for(let k=0;k<6;k++) if((i*7+k*3)%4===0){ c.fillStyle='rgba(255,220,140,.35)'; c.fillRect(x+6+(k%3)*10,VPY-h-22+Math.floor(k/3)*14,5,6); } }
  // 地面：被燈照亮的柏油路，有點濕
  const gd=c.createLinearGradient(0,VPY,0,H); gd.addColorStop(0,'#2a1e22'); gd.addColorStop(1,'#141016'); c.fillStyle=gd; c.fillRect(0,VPY,W,H-VPY);
  // 兩排攤位往遠處排，近大遠小
  for(const sd of [-1,1]) for(let k=11;k>=0;k--){ const z0=1+k*.62,z1=z0+.62,X=z=>VPX+sd*300/z,Y=z=>VPY+180/z,T=z=>VPY-150/z;
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
  for(let i=0;i<9;i++){ const z=1.3+i*.75,s=1/z; for(const sd of [-1,1]){ const x=VPX+sd*190*s,y=VPY-210*s; c.fillStyle='#d8201a'; c.beginPath(); c.ellipse(x,y,16*s,20*s,0,0,TAU); c.fill(); c.fillStyle='rgba(255,200,120,.5)'; c.beginPath(); c.ellipse(x-4*s,y-5*s,6*s,9*s,0,0,TAU); c.fill(); c.fillStyle='#ffd23f'; c.fillRect(x-7*s,y-23*s,14*s,4*s); c.fillRect(x-7*s,y+19*s,14*s,4*s); } }
  // 地上反光
  for(let i=0;i<30;i++){ const x=rnd(0,W),y=rnd(VPY+40,H); c.fillStyle='rgba(255,190,110,'+rnd(.03,.08)+')'; c.beginPath(); c.ellipse(x,y,rnd(20,60),rnd(2,5),0,0,TAU); c.fill(); } }); }
// 街上的路人：往前走或往遠處走，近大遠小
const STREETW=[]; for(let i=0;i<22;i++) STREETW.push({x:rnd(-.24,.2),z0:rnd(.8,6),v:(Math.random()<.5?-1:1)*rnd(.35,.6),ph:rnd(0,TAU),L:null,i});
function crowd(c,t){ const list=STREETW.map(p=>{ const span=5.2,z=.8+(((p.z0+p.v*t-.8)%span)+span)%span; return {p,z}; }).sort((a,b)=>b.z-a.z);
  for(const {p,z} of list){ const X=VPX+p.x*380/z; if(X<-40||X>210) continue; p.L=p.L||randLook(p.i+3); human(c,X,VPY+170/z,187/z,p.L,{dir:p.v<0?0:2,ph:t*6+p.ph,t}); } }
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
function fishStall(env,o){ o=initO(o); const S=STALLS[0],F=[]; const add=(ty)=>F.push({ty,x:rnd(TUB.x+40,TUB.x+TUB.w-40),y:rnd(TUB.y+40,TUB.y+TUB.h-40),a:rnd(0,TAU),ta:rnd(0,TAU),v:FT[ty].spd,z:rnd(0,1),zt:rnd(0,1),ph:rnd(0,TAU),fl:0,fast:0});
  [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,2,2,2,2,3,3].forEach(add);
  const R=42; let px=TUB.x+TUB.w/2,py=TUB.y+TUB.h/2,st='hover',sT=0,dur=100,papers=3,torn=false,tornT=0,caught=[],flying=[],rip=[],score=0,msg=null,ended=false,endT=0;
  const say=(s,col)=>{ msg={s,l:1.8,c:col||'#ffd23f'}; react(o,col); };
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
      for(const q of flying){ const u=q.u,x=lerp(q.x0,84,u),y=lerp(q.y0,446,u)-Math.sin(u*Math.PI)*90; drawFish(c,{x,y,a:u*6,ty:q.f.ty,ph:0,fast:1},t,.8); }
      // 左邊：分數、紙網、裝魚的碗
      hud(c,g,S,t,o);
      if(msg) banner(c,msg,TUB.x+TUB.w/2,TUB.y+40); } };
  g.front=(c,t)=>{ c.fillStyle='#5a3a22'; c.fillRect(14,462,140,40); c.fillStyle='#7a5232'; c.fillRect(10,456,148,8); /* 小木桌 */
    c.fillStyle='rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(84,446,64,26,0,0,TAU); c.fill(); c.strokeStyle='rgba(255,255,255,.75)'; c.lineWidth=2; c.stroke(); c.fillStyle='rgba(120,190,255,.5)'; c.beginPath(); c.ellipse(84,448,56,21,0,0,TAU); c.fill();
    caught.forEach((f,i)=>{ const a=t*.6+i*2.1,rx=40*((i*37)%10/10*.6+.3); drawFish(c,{x:84+Math.cos(a)*rx,y:448+Math.sin(a)*rx*.38,a:a+Math.PI/2,ty:f.ty,ph:i,fast:0},t,.55); });
    c.font='900 11px '+TC; c.textAlign='center'; c.fillStyle='#fff'; c.fillText('我的碗',84,486); };
  g.icons=(c,x,y,t)=>{ for(let i=0;i<3;i++){ const ok=i<papers; c.globalAlpha=ok?1:.25; poi(c,x+6+i*30,y,7,i===3-papers?dur:100,!ok,false,t); c.globalAlpha=1; } };
  g.dbg={F,get st(){return st;},get dur(){return dur;},get papers(){return papers;},setP(x,y){px=x;py=y;}};
  return g; }

// ═════════ 套圈圈 ═════════
const RT={HY:132,F:400,HC:1.3,CX:478},RD=3.2;
const proj=(x,d,h)=>{ const z=1.6+d; return [RT.CX+x*RT.F/z,RT.HY+RT.F*(RT.HC-(h||0))/z,RT.F/z]; };
const RKIND=[['can','soda','duck'],['soda','duck','car'],['car','robot','bear'],['bear','robot','car'],['bear','cat','robot'],['cat','bigbear','cat']],RPTS=[1,1,2,3,5,8];
function ringStall(env,o){ o=initO(o); const S=STALLS[1],P=[],RINGS=10,rR=.14,bR=.065;
  for(let r=0;r<6;r++) for(let k=0;k<6;k++) P.push({x:-.9+k*.36,d:.5+r*.46,r,kind:RKIND[r][(k+r)%3],got:false});
  let ax=0,ad=1.0,rings=RINGS,fly=null,lying=[],score=0,msg=null,ended=false,endT=0,cool=0;
  const cols=['#ff3a6a','#3ad8ff','#ffd23f','#7aff6a','#ff8a2a','#c88aff'];
  const say=(s,col)=>{ msg={s,l:1.8,c:col||'#ffd23f'}; react(o,col); };
  const g={ score:()=>score,left:()=>rings,leftLbl:'圈圈',ended:()=>ended&&endT<=0,
    update(dt,t){ const K=env.keys; if(msg&&(msg.l-=dt)<=0) msg=null; if(cool>0) cool-=dt;
      if(fly){ fly.u+=dt/fly.T; if(fly.u>=1){ const f=fly; fly=null; land(f); } }
      if(ended){ endT-=dt; return; }
      const mx=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0),my=(K.ArrowUp||K.KeyW?1:0)-(K.ArrowDown||K.KeyS?1:0); ax=clamp(ax+mx*.9*dt,-1.05,1.05); ad=clamp(ad+my*1.3*dt,.35,3.0);
      if(!fly&&rings>0&&cool<=0&&(env.hit('Space')||env.hit('KeyJ')||env.hit('Enter'))){ rings--; const sg=.05+.014*ad; fly={u:0,T:.55+ad*.07,tx:ax+gauss()*sg,td:ad+gauss()*sg*1.3,col:cols[rings%cols.length],spin:rnd(8,12)}; env.sfx('click'); cool=.2; }
      if(!fly&&rings<=0&&!ended){ ended=true; endT=1.2; } },
    draw(c,t){ marketBG(c,t); drawRingBooth(c,t,S,P,lying,ax,ad,fly,!ended); hud(c,g,S,t,o); if(msg) banner(c,msg,RT.CX,110); } };
  g.icons=(c,x,y)=>{ for(let i=0;i<rings;i++){ c.strokeStyle=cols[i%cols.length]; c.lineWidth=2.5; c.beginPath(); c.ellipse(x+5+i*13,y,5,3,0,0,TAU); c.stroke(); } };
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
function balloonStall(env,o){ o=initO(o); const S=STALLS[2],B=[];
  for(let r=0;r<BB.rows;r++) for(let k=0;k<BB.cols;k++){ const gold=((r*5+k*3)%11===0); B.push({x:BB.x+40+k*(BB.w-80)/(BB.cols-1),y:BB.y+40+r*(BB.h-70)/(BB.rows-1),r:gold?13:18,col:gold?'#ffcf3a':BCOL[(r*3+k*5)%BCOL.length],gold,row:r,ph:rnd(0,TAU),up:true}); }
  let cx=BB.x+BB.w/2,cy=BB.y+BB.h/2,shots=15,score=0,cool=0,rec=0,holes=[],bits=[],msg=null,ended=false,endT=0,rowDone={};
  const say=(s,col)=>{ msg={s,l:1.6,c:col||'#ffd23f'}; react(o,col); };
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
      gun(c,X,Y,rec); hud(c,g,S,t,o); if(msg) banner(c,msg,BB.x+BB.w/2,BB.y+BB.h+52); } };
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
function pinStall(env,o){ o=initO(o); const S=STALLS[3]; let balls=10,score=0,ball=null,pow=0,pt=0,filled={},lines={},msg=null,ended=false,endT=0,trail=[],plunge=0;
  const say=(s,col)=>{ msg={s,l:1.8,c:col||'#ffd23f'}; react(o,col); };
  const g={ score:()=>score,left:()=>balls,leftLbl:'彈珠',ended:()=>ended&&endT<=0,
    update(dt,t){ if(msg&&(msg.l-=dt)<=0) msg=null; if(ended){ endT-=dt; return; }
      if(!ball){ pt+=dt; pow=.5-.5*Math.cos(pt*3.4); plunge=pow; /* 力道表來回跑，按下去就彈出 */
        if(balls>0&&(env.hit('Space')||env.hit('KeyJ')||env.hit('Enter'))){ balls--; ball={x:611,y:PB.bot-10,vx:0,vy:-(560+pow*330)*rnd(.98,1.02),left:false,t:0,still:0}; plunge=0; env.sfx('spring'); }
        if(balls<=0&&!ball){ ended=true; endT=1.2; } return; }
      const n=4,h=dt/n; for(let s=0;s<n&&ball;s++) step(h);
      trail.push([ball?ball.x:0,ball?ball.y:0]); if(trail.length>8||!ball) trail.shift(); },
    draw(c,t){ marketBG(c,t); drawPinBooth(c,t,S); drawMachine(c,t,filled,lines,ball,trail,plunge,pow); canopy(c,160,W,S,t); hud(c,g,S,t,o);
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
function hud(c,g,S,t,o){ drawOwner(c,o,S,t); if(g.front) g.front(c,t); passers(c,t);
  c.fillStyle='rgba(11,10,28,.84)'; rr(c,8,64,148,104,12); c.fill(); c.textAlign='left'; c.textBaseline='alphabetic'; c.font='900 11px '+TC; c.fillStyle='#cfc8ff'; c.fillText(g.lbl||'分數',18,80); c.font='900 24px '+TC; c.fillStyle='#fff'; c.fillText(g.score(),18,104);
  c.font='900 11px '+TC; c.fillStyle='#cfc8ff'; c.fillText(g.leftLbl+' 剩 '+g.left(),62,99,90); if(g.icons) g.icons(c,18,122,t);
  const sc=g.score(); S.th.forEach((v,i)=>{ const ok=sc>=v; c.fillStyle=ok?'#ffd23f':'rgba(255,255,255,.45)'; c.font='700 10.5px '+TC; c.fillText((ok?'★':'☆')+['小','中','大'][i]+' '+v,18+i*46,144); });
  c.font='700 10px '+TC; c.fillStyle='rgba(255,255,255,.55)'; c.fillText(S.unit?'娃娃 1／2／3 隻換獎品':'分數到了就換獎品',18,160,132); }

// ───────── 寫實人物（老闆、路人、玩家） ─────────
const SKINS=['#f2c8a0','#e8b890','#d8a078','#c08860','#f6d4b4','#e0b088'],HAIRS=['#1a1210','#2a1a10','#3a2a1a','#5a3a20','#0e0c0c','#7a5a3a','#1a1210'],TOPS=['#d83a3a','#2a6ad8','#f4f4f4','#2a2a30','#e8c040','#3a9a5a','#8a4ac8','#ff8ab0','#5ab8e8','#c86a2a','#f0e8d8','#4a5a6a'],BOTS=['#2a3a5a','#1a1a20','#4a4a52','#3a5a8a','#c8b890','#5a3a2a','#2a2a30'];
function randLook(i){ const h=k=>Math.abs(Math.sin(i*12.9898+k*78.233)*43758.5453)%1,pick=(a,k)=>a[Math.floor(h(k)*a.length)];
  return {sk:pick(SKINS,1),hr:pick(HAIRS,2),top:pick(TOPS,3),bot:pick(BOTS,4),long:h(5)<.4,cap:h(6)<.15?pick(['#1a1a20','#c82a2a','#2a5ab8','#f4f4f4'],7):null,bag:h(8)<.35,sleeve:h(9)<.3}; }
function taper(c,a,b,wa,wb,col){ const dx=b[0]-a[0],dy=b[1]-a[1],l=hyp(dx,dy)||1,nx=-dy/l,ny=dx/l; c.fillStyle=col; c.beginPath(); c.moveTo(a[0]+nx*wa/2,a[1]+ny*wa/2); c.lineTo(b[0]+nx*wb/2,b[1]+ny*wb/2); c.lineTo(b[0]-nx*wb/2,b[1]-ny*wb/2); c.lineTo(a[0]-nx*wa/2,a[1]-ny*wa/2); c.closePath(); c.fill(); c.beginPath(); c.arc(a[0],a[1],wa/2,0,TAU); c.arc(b[0],b[1],wb/2,0,TAU); c.fill(); }
// dir：0 正面、2 背面、1／-1 側面往右／往左；ph 有值就在走路；pose：stand hips cheer clap talk sad wave hold
function human(c,x,y,h,L,o){ const u=h/100,dir=o.dir||0,ph=o.ph,walk=ph!=null,t=o.t||0,b=walk?-Math.abs(Math.cos(ph))*1.4:0,flat=h<110,sk=L.sk,dk=shade(L.sk,-.18),pose=o.pose||'stand';
  c.save(); c.translate(x,y); c.scale(dir===-1?-u:u,u);
  c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0,0,12,2.6,0,0,TAU); c.fill();
  const shoe=L.shoe||'#24222a',sleeve=L.sleeve?L.top:sk,top=L.top;
  const shirtFill=(x0,x1)=>{ if(flat) return top; const g=c.createLinearGradient(x0,0,x1,0); g.addColorStop(0,shade(top,.12)); g.addColorStop(.6,top); g.addColorStop(1,shade(top,-.35)); return g; };
  if(dir===1||dir===-1){ // 側面走路
    const sw=s=>walk?Math.sin(ph+(s>0?0:Math.PI)):0,hip=[0,-50+b];
    const leg=s=>{ const a=sw(s)*.45,bend=walk?Math.max(0,Math.sin(ph+(s>0?0:Math.PI)+1.4))*.8:0,k=[hip[0]+Math.sin(a)*24,hip[1]+Math.cos(a)*24],sa=a-bend,f=[k[0]+Math.sin(sa)*24,k[1]+Math.cos(sa)*24],col=s<0?shade(L.bot,-.3):L.bot;
      taper(c,hip,k,9.5,7.5,col); taper(c,k,f,7.5,5.5,col); c.fillStyle=shoe; c.beginPath(); c.ellipse(f[0]+3,f[1]-1,5.6,2.7,sa*.4,0,TAU); c.fill(); };
    const arm=s=>{ const sh=[1,-79+b],aa=walk?-sw(s)*.5:.06,e=[sh[0]+Math.sin(aa)*16,sh[1]+Math.cos(aa)*16],fa=aa+(walk?.4:.15),hd=[e[0]+Math.sin(fa)*15,e[1]+Math.cos(fa)*15],dkk=s<0;
      taper(c,sh,e,6.8,5.6,dkk?shade(top,-.3):top); taper(c,e,hd,5.2,4.2,dkk?shade(sleeve,-.25):sleeve); c.fillStyle=dkk?dk:sk; c.beginPath(); c.arc(hd[0],hd[1],2.7,0,TAU); c.fill();
      if(L.bag&&s>0){ c.fillStyle='rgba(250,250,250,.85)'; c.fillRect(hd[0]-3,hd[1]+1,6,8); c.fillStyle='#d82a2a'; c.fillRect(hd[0]-3,hd[1]+4,6,1.5); } };
    arm(-1); leg(-1);
    c.fillStyle=shirtFill(-6,7); c.beginPath(); c.moveTo(-5.5,-49+b); c.lineTo(6,-49+b); c.lineTo(7,-66+b); c.lineTo(6.5,-80+b); c.quadraticCurveTo(1,-84+b,-4.5,-81+b); c.lineTo(-6.5,-66+b); c.closePath(); c.fill();
    c.fillStyle=L.bot; c.fillRect(-5.5,-52+b,11.5,4);
    leg(1); arm(1);
    c.fillStyle=dk; c.fillRect(-1,-87+b,4.5,7);
    const hy=-93+b; c.fillStyle=sk; c.beginPath(); c.ellipse(2,hy,6,7.3,0,0,TAU); c.fill();
    c.beginPath(); c.moveTo(7.6,hy-1); c.lineTo(9.6,hy+2.4); c.lineTo(7.4,hy+3); c.fill(); /* 鼻子 */
    c.fillStyle=dk; c.beginPath(); c.ellipse(.6,hy+.5,1.4,2.1,0,0,TAU); c.fill();
    c.fillStyle='#1a1010'; c.beginPath(); c.ellipse(5.6,hy-1.2,.8,.9,0,0,TAU); c.fill(); c.fillRect(4.2,hy-3.3,3,.6);
    c.strokeStyle='rgba(120,50,40,.7)'; c.lineWidth=.6; c.beginPath(); c.moveTo(5.5,hy+4.6); c.lineTo(7.2,hy+4.4); c.stroke();
    c.fillStyle=L.hr; c.beginPath(); c.ellipse(1.2,hy-2.2,6.6,5.6,-.12,Math.PI*.82,Math.PI*2.06); c.fill(); c.fillRect(-4.8,hy-3,4.2,L.long?13:6.5);
    if(L.cap){ c.fillStyle=L.cap; c.beginPath(); c.ellipse(1.6,hy-3.4,6.8,4.4,0,Math.PI,TAU); c.fill(); c.fillRect(6,hy-4.2,5.5,1.6); }
  } else { // 正面／背面
    const back=dir===2,lift=s=>walk?Math.max(0,Math.sin(ph+(s>0?0:Math.PI)))*5:0;
    for(const s of [-1,1]){ const l=lift(s),hp=[s*5,-50+b],k=[s*5.6,-26+b*.5-l*.7],f=[s*5.8,-l*.9]; taper(c,hp,k,9.6,7.6,L.bot); taper(c,k,f,7.4,5.6,L.bot); c.fillStyle=shoe; c.beginPath(); c.ellipse(f[0]+s*.4,f[1]-1.2,4.3,2.6,0,0,TAU); c.fill(); }
    const P={stand:[[13.5,-64],[13.2,-49]],hips:[[20,-66],[10.5,-54]],cheer:[[19,-91],[16,-105]],clap:[[13,-66],[2+Math.abs(Math.sin(t*14))*4,-71]],hold:[[13,-62],[6,-57]]};
    const armPts=s=>{ let p=P[pose]||P.stand; if(pose==='talk'&&s>0) p=[[15,-65],[11+Math.sin(t*7)*3,-74+Math.cos(t*7)*2]]; else if(pose==='sad'&&s>0) p=[[17,-81],[6,-94]]; else if(pose==='wave'&&s>0) p=[[18,-88],[18+Math.sin(t*9)*5,-102]]; else if((pose==='talk'||pose==='sad'||pose==='wave')) p=P.stand;
      let hx=p[1][0]*s,hy=p[1][1]+b; if(walk&&(pose==='stand')) hy+=Math.sin(ph+(s>0?Math.PI:0))*2; if(pose==='cheer') hx+=Math.sin(t*10)*2*s; return [[s*12,-79+b],[p[0][0]*s,p[0][1]+b],[hx,hy]]; };
    const armDraw=s=>{ const [sh,e,hd]=armPts(s); taper(c,sh,e,7.2,6,flat?top:shade(top,s>0?-.12:.04)); taper(c,e,hd,5.6,4.6,sleeve); c.fillStyle=sk; c.beginPath(); c.arc(hd[0],hd[1],2.9,0,TAU); c.fill();
      if(L.bag&&s>0&&!back&&pose==='stand'){ c.fillStyle='rgba(250,250,250,.85)'; c.fillRect(hd[0]-3,hd[1]+1,6,8); c.fillStyle='#d82a2a'; c.fillRect(hd[0]-3,hd[1]+4,6,1.5); } };
    const up=pose==='cheer'||pose==='wave'||pose==='sad';
    if(!up){ armDraw(-1); armDraw(1); }
    c.fillStyle=shirtFill(-12,12); c.beginPath(); c.moveTo(-12,-81+b); c.quadraticCurveTo(0,-84+b,12,-81+b); c.lineTo(10,-58+b); c.lineTo(10.5,-48+b); c.lineTo(-10.5,-48+b); c.lineTo(-10,-58+b); c.closePath(); c.fill();
    c.fillStyle=L.bot; c.fillRect(-10.5,-51+b,21,3.5);
    if(L.apron&&!back){ c.fillStyle=L.apron; c.beginPath(); c.moveTo(-8,-73+b); c.lineTo(8,-73+b); c.lineTo(9.6,-30+b); c.lineTo(-9.6,-30+b); c.closePath(); c.fill(); c.strokeStyle=shade(L.apron,-.35); c.lineWidth=1; c.beginPath(); c.moveTo(-7,-73+b); c.lineTo(-5,-84+b); c.moveTo(7,-73+b); c.lineTo(5,-84+b); c.stroke(); c.strokeRect(-5,-52+b,10,7); }
    if(up){ armDraw(-1); armDraw(1); }
    c.fillStyle=dk; c.fillRect(-2.6,-87+b,5.2,7);
    const hy=-93+b; c.fillStyle=sk; c.beginPath(); c.ellipse(-6.3,hy+.8,1.5,2.3,0,0,TAU); c.ellipse(6.3,hy+.8,1.5,2.3,0,0,TAU); c.fill();
    if(!flat){ const hg=c.createRadialGradient(-2,hy-3,1,0,hy,8.5); hg.addColorStop(0,shade(sk,.12)); hg.addColorStop(1,shade(sk,-.22)); c.fillStyle=hg; } c.beginPath(); c.ellipse(0,hy,6.4,7.7,0,0,TAU); c.fill();
    if(back){ c.fillStyle=L.hr; c.beginPath(); c.ellipse(0,hy-.6,6.8,7.8,0,0,TAU); c.fill(); if(L.long){ c.beginPath(); c.moveTo(-6.6,hy); c.lineTo(-6,hy+13); c.quadraticCurveTo(0,hy+15,6,hy+13); c.lineTo(6.6,hy); c.fill(); } if(L.cap){ c.fillStyle=L.cap; c.beginPath(); c.ellipse(0,hy-3.6,7,4.8,0,Math.PI,TAU); c.fill(); } }
    else { c.fillStyle='#fff'; c.beginPath(); c.ellipse(-2.5,hy-.8,1.5,.85,0,0,TAU); c.ellipse(2.5,hy-.8,1.5,.85,0,0,TAU); c.fill(); c.fillStyle='#2a1a12'; c.beginPath(); c.arc(-2.4,hy-.8,.7,0,TAU); c.arc(2.6,hy-.8,.7,0,TAU); c.fill();
      c.strokeStyle=shade(L.hr,.1); c.lineWidth=.7; c.beginPath(); c.moveTo(-4,hy-3); c.lineTo(-1.2,hy-3.3); c.moveTo(1.2,hy-3.3); c.lineTo(4,hy-3); c.stroke();
      c.strokeStyle=dk; c.lineWidth=.6; c.beginPath(); c.moveTo(.2,hy-.4); c.lineTo(.6,hy+2.2); c.lineTo(-.4,hy+2.4); c.stroke();
      if(o.mouth){ c.fillStyle='#6a1a1a'; c.beginPath(); c.ellipse(0,hy+4.3,1.6,1+Math.abs(Math.sin(t*14))*.9,0,0,TAU); c.fill(); } else { c.strokeStyle='rgba(120,50,40,.8)'; c.lineWidth=.6; c.beginPath(); c.moveTo(-1.6,hy+4.2); c.quadraticCurveTo(0,hy+4.9,1.6,hy+4.2); c.stroke(); }
      c.fillStyle=L.hr; c.beginPath(); c.ellipse(0,hy-3.2,6.9,5,0,Math.PI,TAU); c.fill(); c.fillRect(-6.9,hy-3.4,1.8,L.long?14:5); c.fillRect(5.1,hy-3.4,1.8,L.long?14:5); c.beginPath(); c.ellipse(-2,hy-4.2,4.2,1.6,-.25,0,TAU); c.fill();
      if(L.cap){ c.fillStyle=L.cap; c.beginPath(); c.ellipse(0,hy-4.2,7.1,4.6,0,Math.PI,TAU); c.fill(); c.fillStyle=shade(L.cap,-.3); c.beginPath(); c.ellipse(0,hy-4,7.6,1.5,0,0,TAU); c.fill(); } } }
  c.restore(); }
// 老闆
const OWN=[{sk:'#e0b088',hr:'#1a1210',top:'#f4f4f4',bot:'#2a2a30',apron:'#c8282a',cap:'#c8282a'},{sk:'#e8c098',hr:'#2a1a10',top:'#3a6ad8',bot:'#2a2a30',apron:'#1a1a20',long:1},{sk:'#d8a078',hr:'#0e0c0c',top:'#2a8a4a',bot:'#4a4a52',cap:'#1a1a20'},{sk:'#f0c8a0',hr:'#3a2a1a',top:'#e8c040',bot:'#2a3a5a',apron:'#7a2a10',long:1},
  {sk:'#d09068',hr:'#1a1210',top:'#f4f4f4',bot:'#1a1a20',cap:'#2a5ab8'},{sk:'#e8b890',hr:'#5a3a20',top:'#8a4ac8',bot:'#2a2a30',apron:'#d8d0c0',long:1},{sk:'#c88860',hr:'#0e0c0c',top:'#1a1a20',bot:'#3a3a40',cap:'#c82a2a'},{sk:'#ecc4a0',hr:'#8a8a90',top:'#c83a3a',bot:'#2a2a30',apron:'#1a6a4a'}];
const GOODL=['厲害喔！','少年仔手很準！','恭喜恭喜！','讚啦！','運氣不錯喔！'],BADL=['哎呀可惜！','差一點點！','再一次就中了！','沒關係啦～','手要穩喔！'];
function initO(o){ o=o||{}; o.owner=o.owner||{}; return o; }
function react(o,col){ if(!o||!o.owner) return; const good=['#ffd23f','#ffb0ec','#86dc4f','#fff'].includes(col),meh=col==='#9ae0ff'; o.owner.pend={pose:good?'clap':meh?'talk':'sad',txt:meh?'換新的給你！':(good?GOODL:BADL)[Math.floor(Math.random()*5)]}; }
function bubble(c,x,y,txt,maxw){ c.font='900 13px '+TC; const w=Math.min(maxw||150,c.measureText(txt).width+18); c.fillStyle='rgba(255,255,255,.95)'; rr(c,x-w/2,y-26,w,24,10); c.fill(); c.beginPath(); c.moveTo(x-6,y-3); c.lineTo(x,y+6); c.lineTo(x+5,y-3); c.fill(); c.fillStyle='#14122b'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(txt,x,y-14,w-10); }
function drawOwner(c,o,S,t){ if(!o||!o.owner) return; const O=o.owner; if(O.pend){ O.pose=O.pend.pose; O.txt=O.pend.txt; O.until=t+1.8; O.pend=null; }
  let pose='hips',txt=null; if(O.until>t){ pose=O.pose; txt=O.txt; } else if((t%11)<2.2){ pose='wave'; txt='來喔～'+S.n+'喔！'; }
  human(c,84,512,300,OWN[S.i%OWN.length],{dir:0,pose,t,mouth:!!txt}); if(txt) bubble(c,92,206,txt,150); }
// 走過攤位前面的人（只看得到頭和肩膀）
function passers(c,t){ const P=7.3,k=Math.floor(t/P),u=(t-k*P)/4.2; if(u>=1||k<1) return; const d=k%2?1:-1,x=d>0?lerp(-90,890,u):lerp(890,-90,u); human(c,x,706,268,randLook(k*7+1),{dir:d,ph:t*7.5,t}); }
// 新增的獎品圖
const _prize=prize; prize=function(c,x,y,s,k){ if(!['glove','bat','bubble','balloondog','toygun'].includes(k)) return _prize(c,x,y,s,k); c.save(); c.translate(x,y); c.scale(s,s); c.lineWidth=1.4; c.strokeStyle='rgba(0,0,0,.55)';
  if(k==='glove'){ c.fillStyle='#b8682a'; c.beginPath(); c.moveTo(-9,0); c.lineTo(-11,-14); for(let i=0;i<4;i++){ c.lineTo(-9+i*5,-24+Math.abs(i-1.5)*2); c.lineTo(-6+i*5,-14); } c.lineTo(10,-8); c.lineTo(8,0); c.closePath(); c.fill(); c.stroke(); c.strokeStyle='#e8c8a0'; c.beginPath(); c.moveTo(-6,-4); c.lineTo(5,-4); c.stroke(); }
  else if(k==='bat'){ c.fillStyle='#d8b070'; c.beginPath(); c.moveTo(-2,0); c.lineTo(-1,-6); c.lineTo(-3.5,-26); c.quadraticCurveTo(0,-30,3.5,-26); c.lineTo(1,-6); c.lineTo(2,0); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#fff'; c.beginPath(); c.arc(8,-4,4,0,TAU); c.fill(); c.stroke(); c.strokeStyle='#d82a2a'; c.beginPath(); c.arc(6,-4,2.6,-1,1); c.stroke(); }
  else if(k==='bubble'){ c.fillStyle='#ff7ab8'; rr(c,-5,-16,10,16,2); c.fill(); c.stroke(); c.fillStyle='#fff'; c.fillRect(-5,-11,10,4); for(const [bx,by,br] of [[6,-20,4],[10,-27,3],[2,-26,2.4]]){ c.strokeStyle='rgba(150,210,255,.9)'; c.beginPath(); c.arc(bx,by,br,0,TAU); c.stroke(); } }
  else if(k==='balloondog'){ c.fillStyle='#ff4a6a'; for(const [ex,ey,rx,ry,a] of [[-7,-12,5,3,0],[3,-12,5,3,0],[-8,-5,2,4,0],[-4,-5,2,4,0],[2,-5,2,4,0],[6,-5,2,4,0],[9,-17,3.5,2.5,-.6],[11,-22,2,3.6,.4]]){ c.beginPath(); c.ellipse(ex,ey,rx,ry,a,0,TAU); c.fill(); } }
  else if(k==='toygun'){ c.fillStyle='#3a3a44'; rr(c,-12,-18,22,7,2); c.fill(); c.stroke(); c.fillStyle='#6a4a2a'; c.beginPath(); c.moveTo(-10,-12); c.lineTo(-4,-12); c.lineTo(-6,0); c.lineTo(-12,0); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#ffd23f'; c.fillRect(8,-17,3,5); }
  c.restore(); };

// ═════════ 棒球九宮格 ═════════
const NG={x0:362,y0:100,pit:76,pan:70,bar:6},L9=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function baseball(c,x,y,r,a){ c.save(); c.translate(x,y); c.rotate(a||0); const g=c.createRadialGradient(-r*.3,-r*.3,r*.1,0,0,r); g.addColorStop(0,'#fff'); g.addColorStop(1,'#c8c4b8'); c.fillStyle=g; c.beginPath(); c.arc(0,0,r,0,TAU); c.fill(); c.strokeStyle='#d82a2a'; c.lineWidth=Math.max(1,r*.12); c.beginPath(); c.arc(-r*1.25,0,r*.85,-.8,.8); c.stroke(); c.beginPath(); c.arc(r*1.25,0,r*.85,Math.PI-.8,Math.PI+.8); c.stroke(); c.restore(); }
function nineStall(env,o){ o=initO(o); const S=STALLS[4],up=Array(9).fill(true),fall=Array(9).fill(0); let ax=480,ay=218,balls=12,score=0,fly=null,cool=0,msg=null,ended=false,endT=0,lines={},drop=[];
  const say=(s,col)=>{ msg={s,l:1.8,c:col||'#ffd23f'}; react(o,col); };
  const sway=t=>[Math.sin(t*1.1)*7+Math.sin(t*2.9)*3,Math.cos(t*1.4)*6];
  const g={ score:()=>score,left:()=>balls,leftLbl:'棒球',ended:()=>ended&&endT<=0,
    update(dt,t){ const K=env.keys; if(msg&&(msg.l-=dt)<=0) msg=null; if(cool>0) cool-=dt; for(let i=0;i<9;i++) if(!up[i]&&fall[i]<1) fall[i]=Math.min(1,fall[i]+dt*3.5);
      for(let i=drop.length-1;i>=0;i--){ const d=drop[i]; d.vy+=900*dt; d.x+=d.vx*dt; d.y+=d.vy*dt; d.a+=dt*8; if(d.y>H+30) drop.splice(i,1); }
      if(fly){ fly.u+=dt/.48; if(fly.u>=1){ const f=fly; fly=null; resolve(f); } }
      if(ended){ endT-=dt; return; }
      const mx=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0),my=(K.ArrowDown||K.KeyS?1:0)-(K.ArrowUp||K.KeyW?1:0); ax=clamp(ax+mx*210*dt,300,660); ay=clamp(ay+my*210*dt,70,380);
      if(!fly&&balls>0&&cool<=0&&(env.hit('Space')||env.hit('KeyJ')||env.hit('Enter'))){ balls--; cool=.3; const [sx,sy]=sway(t); fly={u:0,tx:ax+sx+gauss()*14,ty:ay+sy+gauss()*14}; env.sfx('click'); }
      if(!fly&&(balls<=0||up.every(v=>!v))&&!ended){ ended=true; endT=1.4; if(balls>0) say('九格全清！','#86dc4f'); } },
    draw(c,t){ marketBG(c,t);
      c.fillStyle='#14281a'; c.fillRect(170,58,W-170,H-58); c.strokeStyle='rgba(200,230,200,.16)'; c.lineWidth=1; for(let i=-20;i<40;i++){ c.beginPath(); c.moveTo(170+i*22,58); c.lineTo(170+i*22+300,H); c.moveTo(170+i*22+300,58); c.lineTo(170+i*22,H); c.stroke(); } /* 後面的擋球網 */
      const tg=c.createLinearGradient(0,380,0,H); tg.addColorStop(0,'#2a6a32'); tg.addColorStop(1,'#1a4a22'); c.fillStyle=tg; c.fillRect(170,380,W-170,H-380); c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=3; c.beginPath(); c.moveTo(230,470); c.lineTo(760,470); c.stroke(); /* 人工草皮＋投球線 */
      c.fillStyle='#8a8e98'; c.fillRect(NG.x0+40,NG.y0+234,10,150); c.fillRect(NG.x0+184,NG.y0+234,10,150); /* 支架 */
      c.fillStyle='#2a5ab8'; rr(c,NG.x0-8,NG.y0-8,250,250,8); c.fill(); c.fillStyle='#0c1a10'; c.fillRect(NG.x0,NG.y0,234,234);
      for(let i=0;i<9;i++){ const cx=i%3,cy=Math.floor(i/3),x=NG.x0+NG.bar+cx*NG.pit,y=NG.y0+NG.bar+cy*NG.pit,f=fall[i];
        if(up[i]||f<1){ const hh=NG.pan*Math.cos(f*Math.PI/2); c.fillStyle=f>0?'#d8d0c0':'#f8f4ea'; c.fillRect(x,y+NG.pan-hh,NG.pan,hh); c.strokeStyle='#d82a2a'; c.lineWidth=3; c.strokeRect(x+3,y+NG.pan-hh+3,NG.pan-6,Math.max(0,hh-6));
          if(hh>20){ c.save(); c.translate(x+NG.pan/2,y+NG.pan-hh/2); c.scale(1,hh/NG.pan); c.font='900 40px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#c81e1e'; c.fillText(i+1,0,2); c.restore(); } } }
      L9.forEach((L,i)=>{ if(!lines[i]) return; const p=k=>[NG.x0+NG.bar+(k%3)*NG.pit+35,NG.y0+NG.bar+Math.floor(k/3)*NG.pit+35]; c.strokeStyle='rgba(80,230,110,.7)'; c.lineWidth=10; c.lineCap='round'; c.beginPath(); c.moveTo(...p(L[0])); c.lineTo(...p(L[2])); c.stroke(); });
      for(const d of drop) baseball(c,d.x,d.y,8,d.a);
      if(fly){ const u=fly.u,x=lerp(480,fly.tx,u),y=lerp(500,fly.ty,u)-Math.sin(u*Math.PI)*70; c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x,lerp(480,fly.ty+40,u),lerp(14,6,u),lerp(4,2,u),0,0,TAU); c.fill(); baseball(c,x,y,lerp(18,7,u),u*20); }
      if(!ended&&!fly){ const [sx,sy]=sway(t),X=ax+sx,Y=ay+sy; c.strokeStyle='rgba(255,230,60,.95)'; c.lineWidth=2.5; c.beginPath(); c.arc(X,Y,12,0,TAU); c.moveTo(X-18,Y); c.lineTo(X+18,Y); c.moveTo(X,Y-18); c.lineTo(X,Y+18); c.stroke(); }
      canopy(c,160,W,S,t); hud(c,g,S,t,o); if(msg) banner(c,msg,480,420); } };
  function resolve(f){ const lx=f.tx-NG.x0,ly=f.ty-NG.y0; drop.push({x:f.tx,y:f.ty,vx:rnd(-60,60),vy:-120,a:0});
    if(lx<0||ly<0||lx>234||ly>234){ say('沒打中，打到網子了','#cfc8ff'); env.sfx('land'); return; }
    const gx=Math.floor((lx-NG.bar)/NG.pit),gy=Math.floor((ly-NG.bar)/NG.pit),ix=lx-NG.bar-gx*NG.pit,iy=ly-NG.bar-gy*NG.pit;
    if(lx<NG.bar||ly<NG.bar||gx>2||gy>2||ix>NG.pan||iy>NG.pan){ say('打到框了！','#cfc8ff'); env.sfx('bump'); return; }
    const i=gy*3+gx; if(!up[i]){ say(i+1+' 號已經打掉了','#cfc8ff'); env.sfx('land'); return; }
    up[i]=false; score+=1; let nl=0; L9.forEach((L,k)=>{ if(!lines[k]&&L.every(q=>!up[q])){ lines[k]=1; nl++; } }); score+=nl*3;
    env.sfx(nl?'win':'boom'); say(nl?'連線！+'+(1+nl*3):'打中 '+(i+1)+' 號！+1',nl?'#86dc4f':'#ffd23f'); }
  g.dbg={up,get balls(){return balls;},aim(x,y){ax=x;ay=y;},cell:i=>[NG.x0+NG.bar+(i%3)*NG.pit+35,NG.y0+NG.bar+Math.floor(i/3)*NG.pit+35]};
  return g; }

// ═════════ 丟沙包 ═════════
const SHELF=346,CANW=34,CANH=44,CANC=['#d82a2a','#2a6ad8','#e8a020','#2a9a5a','#8a4ac8'];
function tinCan(c,x,y,a,col){ c.save(); c.translate(x,y-CANH/2); c.rotate(a); const g=c.createLinearGradient(-CANW/2,0,CANW/2,0); g.addColorStop(0,shade(col,-.45)); g.addColorStop(.35,shade(col,.25)); g.addColorStop(.6,col); g.addColorStop(1,shade(col,-.55)); c.fillStyle=g; c.fillRect(-CANW/2,-CANH/2,CANW,CANH);
  c.fillStyle='rgba(255,255,255,.85)'; c.fillRect(-CANW/2,-6,CANW,12); c.fillStyle=col; c.font='900 9px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('汽水',0,0);
  const sg=c.createLinearGradient(-CANW/2,0,CANW/2,0); sg.addColorStop(0,'#8a8e98'); sg.addColorStop(.4,'#f0f2f6'); sg.addColorStop(1,'#6a6e78'); c.fillStyle=sg; c.fillRect(-CANW/2,-CANH/2,CANW,4); c.fillRect(-CANW/2,CANH/2-4,CANW,4);
  c.fillStyle='rgba(255,255,255,.35)'; c.fillRect(-CANW/2+6,-CANH/2+4,4,CANH-8); c.restore(); }
function beanBag(c,x,y,s,a,col){ c.save(); c.translate(x,y); c.rotate(a); c.fillStyle=col; rr(c,-s/2,-s/2,s,s,s*.3); c.fill(); c.strokeStyle='rgba(255,255,255,.55)'; c.lineWidth=1.2; c.setLineDash([3,3]); rr(c,-s/2+3,-s/2+3,s-6,s-6,s*.25); c.stroke(); c.setLineDash([]); c.fillStyle='rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(s*.12,s*.15,s*.3,s*.22,0,0,TAU); c.fill(); c.restore(); }
function bagStall(env,o){ o=initO(o); const S=STALLS[5]; let round=0,bags=3,score=0,cans=[],fly=null,ax=485,ay=260,msg=null,ended=false,endT=0,cool=0,next=0,fallen=[];
  const say=(s,col)=>{ msg={s,l:1.8,c:col||'#ffd23f'}; react(o,col); };
  function setup(){ cans=[]; for(let r=0;r<4;r++){ const n=4-r; for(let i=0;i<n;i++) cans.push({r,x:485+(i-(n-1)/2)*36,y:SHELF-r*CANH,st:'up',vx:0,vy:0,a:0,va:0,col:CANC[(r+i+round)%CANC.length]}); } bags=3; }
  setup();
  const knock=(cn,P,pw)=>{ if(cn.st!=='up'&&cn.st!=='lie') return; cn.st='fly'; const sd=cn.x>=P.x?1:-1; cn.vx=(cn.x-P.x)*6+sd*rnd(60,140)*pw; cn.vy=-rnd(140,300)*pw; cn.va=rnd(-9,9);
    for(const nb of cans) if(nb.st==='up'&&Math.abs(nb.x-cn.x)<=37&&Math.abs(nb.y-cn.y)<=CANH+2&&Math.random()<.4*pw) knock(nb,P,pw*.65); };
  const g={ score:()=>score,left:()=>bags,get leftLbl(){ return '第'+Math.min(4,round+1)+'/4座 沙包'; },ended:()=>ended&&endT<=0,
    update(dt,t){ const K=env.keys; if(msg&&(msg.l-=dt)<=0) msg=null; if(cool>0) cool-=dt;
      for(const cn of cans) if(cn.st==='fly'){ cn.vy+=900*dt; cn.x+=cn.vx*dt; cn.y+=cn.vy*dt; cn.a+=cn.va*dt; if(cn.y>H+80) cn.st='gone'; }
      for(let i=fallen.length-1;i>=0;i--){ const b=fallen[i]; b.vy+=900*dt; b.y+=b.vy*dt; b.a+=dt*3; if(b.y>H+40) fallen.splice(i,1); }
      if(fly){ fly.u+=dt/.45; if(fly.u>=1){ const f=fly; fly=null; impact(f); } }
      if(next>0){ next-=dt; if(next<=0){ round++; if(round>=4){ ended=true; endT=.4; } else setup(); } }
      if(ended){ endT-=dt; return; }
      const mx=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0),my=(K.ArrowDown||K.KeyS?1:0)-(K.ArrowUp||K.KeyW?1:0); ax=clamp(ax+mx*200*dt,320,650); ay=clamp(ay+my*200*dt,140,370);
      if(!fly&&bags>0&&next<=0&&cool<=0&&(env.hit('Space')||env.hit('KeyJ')||env.hit('Enter'))){ bags--; cool=.3; fly={u:0,tx:ax+gauss()*9,ty:ay+gauss()*9,col:['#d8a020','#c82a2a','#2a6ad8'][bags%3],spin:rnd(-8,8)}; env.sfx('click'); } },
    draw(c,t){ marketBG(c,t);
      c.fillStyle='#3a2416'; c.fillRect(170,58,W-170,H-58); for(let i=0;i<14;i++){ c.fillStyle=i%2?'rgba(0,0,0,.12)':'rgba(255,220,170,.05)'; c.fillRect(170+i*46,58,46,H-58); } /* 木板牆 */
      c.fillStyle='#14100e'; c.fillRect(330,110,310,SHELF-100); /* 黑布幕 */
      c.fillStyle='#8a5a2a'; c.fillRect(320,SHELF,330,10); const sk=c.createLinearGradient(0,SHELF+10,0,H); sk.addColorStop(0,'#c82a2a'); sk.addColorStop(1,'#7a1414'); c.fillStyle=sk; c.fillRect(326,SHELF+10,318,H-SHELF-10); for(let i=0;i<8;i++){ c.fillStyle='rgba(0,0,0,.15)'; c.fillRect(330+i*40,SHELF+10,3,H); } /* 檯子和紅布裙 */
      for(const cn of cans) if(cn.st==='lie') tinCan(c,cn.x+cn.lie*0,cn.y+CANH/2-CANW/2,cn.lie*Math.PI/2,cn.col);
      for(const cn of cans) if(cn.st==='up') tinCan(c,cn.x,cn.y,0,cn.col);
      for(const cn of cans) if(cn.st==='fly') tinCan(c,cn.x,cn.y,cn.a,cn.col);
      for(const b of fallen) beanBag(c,b.x,b.y,16,b.a,b.col);
      if(fly){ const u=fly.u,x=lerp(480,fly.tx,u),y=lerp(520,fly.ty,u)-Math.sin(u*Math.PI)*90; beanBag(c,x,y,lerp(34,16,u),u*fly.spin,fly.col); }
      if(!ended&&!fly&&next<=0){ c.strokeStyle='rgba(255,230,60,.95)'; c.lineWidth=2.5; c.beginPath(); c.arc(ax,ay,12,0,TAU); c.moveTo(ax-18,ay); c.lineTo(ax+18,ay); c.moveTo(ax,ay-18); c.lineTo(ax,ay+18); c.stroke(); }
      canopy(c,160,W,S,t); hud(c,g,S,t,o); g.icons2(c); if(msg) banner(c,msg,485,90); } };
  g.icons=(c,x,y)=>{ for(let i=0;i<bags;i++) beanBag(c,x+7+i*20,y,13,.2*i,['#d8a020','#c82a2a','#2a6ad8'][i%3]); };
  g.icons2=()=>{};
  function impact(f){ const P={x:f.tx,y:f.ty}; let hit=false; const before=cans.filter(c=>c.st==='up'||c.st==='lie').length;
    for(const cn of cans) if(cn.st==='up'&&P.x>cn.x-CANW/2-6&&P.x<cn.x+CANW/2+6&&P.y>cn.y-CANH-6&&P.y<cn.y+4){ hit=true; knock(cn,P,1); }
    for(const cn of cans) if(cn.st==='lie'&&Math.abs(P.x-cn.x)<CANH/2+8&&P.y>SHELF-CANW-8&&P.y<SHELF+6){ hit=true; knock(cn,P,.8); } /* 倒在檯子上的罐子 */
    // 下面被打掉的，上面的罐子跟著倒
    let changed=true; while(changed){ changed=false; for(const cn of cans) if(cn.st==='up'&&cn.r>0){ const sup=cans.filter(q=>q.st==='up'&&q.r===cn.r-1&&Math.abs(q.x-cn.x)<=20).length; if(sup<2){ changed=true; if(Math.random()<.45){ cn.st='fly'; cn.vx=rnd(-90,90); cn.vy=-30; cn.va=rnd(-6,6); } else { cn.st='lie'; cn.y=SHELF; cn.x=clamp(cn.x+rnd(-30,30),340,630); cn.lie=Math.random()<.5?1:-1; } } } } /* 上面的罐子掉下來：有的掉出檯子，有的倒在檯子上 */
    fallen.push({x:P.x,y:P.y,vy:hit?-80:0,a:0,col:f.col});
    const down=before-cans.filter(c=>c.st==='up'||c.st==='lie').length; score+=down;
    const left=cans.filter(c=>c.st==='up'||c.st==='lie').length;
    if(!left){ score+=5; say('全倒！+'+(down+5),'#86dc4f'); env.sfx('win'); next=1.4; }
    else { if(down){ say('打下 '+down+' 罐！+'+down+(cans.some(c=>c.st==='lie')?'（倒在檯上的不算）':''),'#ffd23f'); env.sfx('boom'); } else { say(P.y>SHELF-4&&P.y<SHELF+30?'打到檯子了':'沒打到','#cfc8ff'); env.sfx('land'); }
      if(bags<=0){ next=1.5; setTimeout(()=>{},0); } } }
  g.dbg={get cans(){return cans;},get bags(){return bags;},get round(){return round;},get next(){return next;},aim(x,y){ax=x;ay=y;}};
  return g; }

// ═════════ 手槍射氣球（會移動的氣球） ═════════
const PROWS=[{y:150,v:70},{y:238,v:-105},{y:326,v:140}],PSPAN=[212,770],PGAP=70,PN=9;
function pistolStall(env,o){ o=initO(o); const S=STALLS[6]; const B=[]; for(let r=0;r<3;r++) for(let k=0;k<PN;k++) B.push({r,k,up:true,col:BCOL[(r*4+k*3)%BCOL.length],gold:Math.random()<.14,lastX:null,ph:rnd(0,TAU)});
  let cx=490,cy=240,shots=20,score=0,cool=0,rec=0,flash=0,bits=[],msg=null,ended=false,endT=0,streak=0,tt=0;
  const say=(s,col)=>{ msg={s,l:1.4,c:col||'#ffd23f'}; react(o,col); };
  const LEN=PN*PGAP,bx=(b,t)=>{ const R=PROWS[b.r]; return PSPAN[0]-40+((((b.k*PGAP+R.v*t)%LEN)+LEN)%LEN); };
  const sway=t=>[Math.sin(t*1.6)*5+Math.sin(t*3.3)*2,Math.cos(t*1.9)*4];
  const g={ score:()=>score,left:()=>shots,leftLbl:'子彈',ended:()=>ended&&endT<=0,
    update(dt,t){ tt=t; const K=env.keys; if(msg&&(msg.l-=dt)<=0) msg=null; if(cool>0) cool-=dt; rec=Math.max(0,rec-dt*6); flash=Math.max(0,flash-dt*10);
      for(const b of B){ const x=bx(b,t); if(b.lastX!=null&&Math.abs(x-b.lastX)>200&&!b.up){ b.up=true; b.col=BCOL[Math.floor(rnd(0,BCOL.length))]; b.gold=Math.random()<.14; } b.lastX=x; } /* 繞回來就補新氣球 */
      for(let i=bits.length-1;i>=0;i--){ const q=bits[i]; q.l-=dt; if(q.l<=0){ bits.splice(i,1); continue; } q.x+=q.vx*dt; q.y+=q.vy*dt; q.vy+=500*dt; q.a+=q.va*dt; }
      if(ended){ endT-=dt; return; }
      const mx=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0),my=(K.ArrowDown||K.KeyS?1:0)-(K.ArrowUp||K.KeyW?1:0); cx=clamp(cx+mx*270*dt,PSPAN[0],PSPAN[1]); cy=clamp(cy+my*270*dt,100,380);
      if(shots>0&&cool<=0&&(env.hit('Space')||env.hit('KeyJ')||env.hit('Enter'))){ shots--; cool=.28; rec=1; flash=1; env.sfx('click'); const [sx,sy]=sway(t),hx=cx+sx,hy=cy+sy; let hit=null;
        for(const b of B){ if(!b.up) continue; const x=bx(b,t),y=PROWS[b.r].y,r=b.gold?14:19; if(x<PSPAN[0]-10||x>PSPAN[1]+10) continue; const dx=(hx-x)/r,dy=(hy-y)/(r*1.15); if(dx*dx+dy*dy<=1){ hit=b; break; } }
        if(hit){ hit.up=false; const p=hit.gold?3:1; score+=p; streak++; const x=bx(hit,t),y=PROWS[hit.r].y; env.sfx('pop'); for(let i=0;i<12;i++){ const a=rnd(0,TAU),v=rnd(80,260); bits.push({x,y,vx:Math.cos(a)*v+PROWS[hit.r].v,vy:Math.sin(a)*v-60,l:.6,a:rnd(0,TAU),va:rnd(-12,12),c:hit.gold?'#ffcf3a':hit.col}); }
          if(streak%5===0){ score+=3; say('連中 5 發！+3','#86dc4f'); env.sfx('win'); } else say((hit.gold?'金色氣球！':'啪！')+' +'+p,hit.gold?'#ffd23f':'#fff'); }
        else { streak=0; env.sfx('land'); }
        if(shots<=0){ ended=true; endT=1.2; } } },
    draw(c,t){ marketBG(c,t); const bgr=c.createLinearGradient(0,60,0,H); bgr.addColorStop(0,'#1a1e3a'); bgr.addColorStop(1,'#0c0e1e'); c.fillStyle=bgr; c.fillRect(170,58,W-170,H-58);
      c.fillStyle='rgba(255,230,140,.5)'; for(let i=0;i<40;i++){ const x=180+((i*97)%600),y=70+((i*53)%320); c.beginPath(); c.arc(x,y,1+(i%3)*.6,0,TAU); c.fill(); } /* 小星星貼紙 */
      c.save(); c.beginPath(); c.rect(PSPAN[0]-20,90,PSPAN[1]-PSPAN[0]+40,300); c.clip();
      for(const R of PROWS){ c.fillStyle='#5a5e6a'; c.fillRect(PSPAN[0]-20,R.y+34,PSPAN[1]-PSPAN[0]+40,7); c.fillStyle='#9aa0ae'; for(let x=PSPAN[0]-20+((R.v*t)%14+14)%14;x<PSPAN[1]+20;x+=14) c.fillRect(x,R.y+35,6,5); } /* 會動的輸送帶 */
      for(const b of B){ if(!b.up) continue; const x=bx(b,t); balloon(c,x,PROWS[b.r].y,b.gold?14:19,b.gold?'#ffcf3a':b.col,t,b.ph); }
      c.restore();
      for(const q of bits){ c.save(); c.translate(q.x,q.y); c.rotate(q.a); c.globalAlpha=clamp(q.l/.6,0,1); c.fillStyle=q.c; c.fillRect(-4,-2,8,4); c.restore(); }
      const cg=c.createLinearGradient(0,400,0,H); cg.addColorStop(0,'#6a3a1a'); cg.addColorStop(1,'#3a1e0c'); c.fillStyle=cg; c.fillRect(170,400,W-170,H-400); c.fillStyle='rgba(255,220,160,.25)'; c.fillRect(170,400,W-170,3);
      canopy(c,160,W,S,t);
      const [sx,sy]=sway(t),X=cx+sx,Y=cy+sy; if(!ended){ c.strokeStyle='rgba(60,255,120,.95)'; c.lineWidth=2; c.beginPath(); c.arc(X,Y,11,0,TAU); c.moveTo(X-17,Y); c.lineTo(X-5,Y); c.moveTo(X+5,Y); c.lineTo(X+17,Y); c.moveTo(X,Y-17); c.lineTo(X,Y-5); c.moveTo(X,Y+5); c.lineTo(X,Y+17); c.stroke(); }
      pistol(c,X,Y,rec,flash); hud(c,g,S,t,o); if(msg) banner(c,msg,490,425); } };
  g.dbg={B,get shots(){return shots;},aim(x,y){cx=x;cy=y;},pos:b=>[bx(b,tt),PROWS[b.r].y],sway};
  return g; }
function pistol(c,X,Y,rec,flash){ const bx=540+(X-490)*.25,by=505,a=Math.atan2(Y-by,X-bx); c.save(); c.translate(bx,by); c.rotate(a+Math.PI/2); c.translate(0,rec*10); c.scale(1.6,1.6);
  c.fillStyle='#e6bc96'; c.beginPath(); c.ellipse(0,26,18,24,0,0,TAU); c.fill(); /* 手 */
  c.fillStyle='#24262e'; rr(c,-8,-70,16,64,3); c.fill(); c.fillStyle='#3a3e48'; rr(c,-10,-30,20,30,4); c.fill(); c.fillStyle='rgba(255,255,255,.25)'; c.fillRect(-5,-68,3,58); c.fillStyle='#14161c'; c.fillRect(-2,-74,4,6);
  c.fillStyle='#d8a884'; c.beginPath(); c.ellipse(-6,4,8,13,.2,0,TAU); c.fill(); c.restore();
  if(flash>0){ const mx=bx+Math.cos(a)*118,my=by+Math.sin(a)*118; c.fillStyle='rgba(255,230,120,'+flash+')'; c.beginPath(); c.arc(mx,my,10*flash+4,0,TAU); c.fill(); } }

// ═════════ 麻將賓果（6×6 盤面，抽 15 張，聽牌再加 3 張） ═════════
const MJ_ALL=(()=>{ const a=[]; for(const k of ['w','t','s']) for(let n=1;n<=9;n++) a.push(k+n); '東南西北中發白'.split('').forEach(z=>a.push('z'+z)); a.push('f梅','f蘭'); return a; })();
const MJ_LINES=(()=>{ const L=[]; for(let i=0;i<6;i++){ L.push([0,1,2,3,4,5].map(k=>i*6+k)); L.push([0,1,2,3,4,5].map(k=>k*6+i)); } L.push([0,7,14,21,28,35]); L.push([5,10,15,20,25,30]); return L; })();
const MJDOT={1:[[0,0]],2:[[0,-.5],[0,.5]],3:[[-.5,-.6],[0,0],[.5,.6]],4:[[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45]],5:[[-.45,-.5],[.45,-.5],[0,0],[-.45,.5],[.45,.5]],6:[[-.45,-.6],[.45,-.6],[-.45,0],[.45,0],[-.45,.6],[.45,.6]],7:[[-.5,-.72],[0,-.56],[.5,-.4],[-.45,.18],[.45,.18],[-.45,.66],[.45,.66]],8:[[-.45,-.72],[.45,-.72],[-.45,-.24],[.45,-.24],[-.45,.24],[.45,.24],[-.45,.72],[.45,.72]],9:[[-.55,-.6],[0,-.6],[.55,-.6],[-.55,0],[0,0],[.55,0],[-.55,.6],[0,.6],[.55,.6]]};
function mjTile(c,x,y,w,h,id,faceUp,glow){ c.fillStyle='rgba(0,0,0,.35)'; rr(c,x+2,y+3,w,h,5); c.fill();
  if(!faceUp){ c.fillStyle='#1f7a4a'; rr(c,x,y,w,h,5); c.fill(); c.fillStyle='#2a9a5e'; rr(c,x+2,y+2,w-4,h-7,4); c.fill(); c.fillStyle='rgba(255,255,255,.15)'; c.fillRect(x+4,y+4,w-8,3); return; }
  c.fillStyle='#2a8a5a'; rr(c,x,y,w,h,5); c.fill(); c.fillStyle=glow?'#fff2b0':'#f8f4e6'; rr(c,x,y,w,h-5,5); c.fill(); c.strokeStyle='rgba(0,0,0,.18)'; c.lineWidth=1; rr(c,x+2.5,y+2.5,w-5,h-10,4); c.stroke();
  const k=id[0],v=id.slice(1),cx=x+w/2,cy=y+(h-5)/2,s=Math.min(w,h-5); c.textAlign='center'; c.textBaseline='middle';
  if(k==='w'){ c.fillStyle='#1a2a6a'; c.font='900 '+Math.round(s*.36)+'px '+TC; c.fillText('一二三四五六七八九'[v-1],cx,cy-s*.2); c.fillStyle='#c81e1e'; c.font='900 '+Math.round(s*.38)+'px '+TC; c.fillText('萬',cx,cy+s*.22); }
  else if(k==='t'||k==='s'){ const n=+v,pts=MJDOT[n],sx=w*.32,sy=(h-5)*.34; pts.forEach(([px,py],i)=>{ const X=cx+px*sx,Y=cy+py*sy;
      if(k==='t'){ const r=n<=2?s*.2:n<=4?s*.13:s*.095; c.fillStyle=i%3===0?'#c81e1e':i%3===1?'#1a4ab8':'#1a7a3a'; c.beginPath(); c.arc(X,Y,r,0,TAU); c.fill(); c.fillStyle='#f8f4e6'; c.beginPath(); c.arc(X,Y,r*.55,0,TAU); c.fill(); c.fillStyle=c.strokeStyle='#1a4ab8'; c.beginPath(); c.arc(X,Y,r*.25,0,TAU); c.fill(); }
      else { const hh=n<=3?s*.3:s*.2; c.fillStyle=n===1?'#c81e1e':(i%2?'#1a7a3a':'#2a9a4a'); rr(c,X-2.2,Y-hh/2,4.4,hh,2); c.fill(); c.fillStyle='rgba(255,255,255,.4)'; c.fillRect(X-.5,Y-hh/2+1,1,hh-2); } }); }
  else if(k==='z'){ if(v==='白'){ c.strokeStyle='#1a4ab8'; c.lineWidth=2; c.strokeRect(cx-w*.26,cy-(h-5)*.3,w*.52,(h-5)*.6); } else { c.fillStyle=v==='中'?'#c81e1e':v==='發'?'#1a7a3a':'#14141c'; c.font='900 '+Math.round(s*.55)+'px '+TC; c.fillText(v,cx,cy+1); } }
  else { c.fillStyle='#c81e1e'; c.font='900 '+Math.round(s*.46)+'px '+TC; c.fillText(v,cx,cy+1); } }
const MJB={x:500,y:96,w:44,h:54,gx:46,gy:56},MJD={x:182,y:96,w:42,h:52,gx:47,gy:56};
function mahjongStall(env,o){ o=initO(o); const S=STALLS[7],N=[12,13,15].includes(o.N)?o.N:15,SIZE={15:['中型','bear'],13:['大型','bigbear'],12:['超大','bigbear']}[N];
  S.pz=[[SIZE[0]+'布偶娃娃 1 隻',SIZE[1]],[SIZE[0]+'布偶娃娃 2 隻',SIZE[1]],[SIZE[0]+'布偶娃娃 3 隻',SIZE[1]]];
  let board,deck,lit,flip,drawn,sel=0,draws=N,extra=false,best=0,lines=0,round=1,rounds=6,dolls=0,msg=null,ended=false,endT=0,mv=0,flyT=null,next=0;
  const say=(s,col)=>{ msg={s,l:2,c:col||'#ffd23f'}; react(o,col); };
  function deal(){ board=MJ_ALL.slice().sort(()=>Math.random()-.5); deck=MJ_ALL.slice().sort(()=>Math.random()-.5); lit=Array(36).fill(false); flip=Array(36).fill(0); drawn=Array(36).fill(false); draws=N; extra=false; best=0; lines=0; }
  deal();
  const calc=()=>{ let b=0,l=0; for(const L of MJ_LINES){ const n=L.filter(i=>lit[i]).length; if(n===6) l++; b=Math.max(b,n); } best=b; lines=l; };
  const endRound=()=>{ next=1.9; };
  const g={ score:()=>dolls,lbl:'娃娃',left:()=>draws,get leftLbl(){ return '第'+round+'/'+rounds+'局'+(extra?' 加抽':''); },ended:()=>ended&&endT<=0,
    update(dt,t){ const K=env.keys; if(msg&&(msg.l-=dt)<=0) msg=null; for(let i=0;i<36;i++) if(drawn[i]&&flip[i]<1) flip[i]=Math.min(1,flip[i]+dt*3.5);
      if(next>0){ next-=dt; if(next<=0){ round++; if(round>rounds){ ended=true; endT=.3; } else { deal(); say('第 '+round+' 局，重新洗牌','#9ae0ff'); } } }
      if(flyT){ flyT.u+=dt*2.2; if(flyT.u>=1){ const f=flyT; flyT=null; lit[f.bi]=true; const prev=best; calc(); env.sfx(lines?'win':'item');
          if(lines){ if(!extra){ dolls++; say('直接連成一線！送'+SIZE[0]+'娃娃！','#86dc4f'); } else { rounds++; say('聽牌連線！多送一局！','#ffd23f'); } endRound(); }
          else if(draws<=0){ if(!extra&&best===5){ extra=true; draws=5; say('聽牌！加抽 5 張','#ffb0ec'); } else { say(extra?'加抽沒連到，下一局':'沒連線，下一局','#cfc8ff'); endRound(); } }
          else if(best===5&&prev<5) say('聽牌了！','#ffb0ec'); else say(MJNAME(f.id),'#fff'); } }
      if(ended){ endT-=dt; return; }
      mv-=dt; const mx=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0),my=(K.ArrowDown||K.KeyS?1:0)-(K.ArrowUp||K.KeyW?1:0);
      if((mx||my)&&mv<=0){ sel=clamp(sel%6+mx,0,5)+clamp(Math.floor(sel/6)+my,0,5)*6; mv=.14; env.sfx('click'); } else if(!mx&&!my) mv=0;
      if(!flyT&&next<=0&&draws>0&&(env.hit('Space')||env.hit('KeyJ')||env.hit('Enter'))){ if(drawn[sel]){ msg={s:'這張翻過了，選別張',l:1.2,c:'#cfc8ff'}; return; } drawn[sel]=true; draws--; env.sfx('place'); const id=deck[sel]; flyT={id,u:0,from:sel,bi:board.indexOf(id)}; } },
    draw(c,t){ marketBG(c,t); c.fillStyle='#2a1a10'; c.fillRect(170,58,W-170,H-58);
      const fl=c.createLinearGradient(0,80,0,H); fl.addColorStop(0,'#1f6a3a'); fl.addColorStop(1,'#124a26'); c.fillStyle=fl; rr(c,172,82,316,360,10); c.fill();
      c.fillStyle='#e8d8b0'; rr(c,490,82,292,360,10); c.fill(); c.fillStyle='#c8b080'; c.fillRect(490,82,292,6);
      for(let i=0;i<36;i++){ const x=MJD.x+(i%6)*MJD.gx,y=MJD.y+Math.floor(i/6)*MJD.gy,f=flip[i]; if(drawn[i]&&f>=1){ c.globalAlpha=.4; mjTile(c,x,y,MJD.w,MJD.h,deck[i],true); c.globalAlpha=1; continue; }
        c.save(); const sx=Math.abs(Math.cos(f*Math.PI)); c.translate(x+MJD.w/2,y); c.scale(Math.max(.05,sx),1); mjTile(c,-MJD.w/2,0,MJD.w,MJD.h,deck[i],f>.5); c.restore();
        if(i===sel&&!ended&&next<=0){ c.strokeStyle='#ffd23f'; c.lineWidth=3; rr(c,x-3,y-3,MJD.w+6,MJD.h+6,6); c.stroke(); } }
      for(let i=0;i<36;i++){ const x=MJB.x+(i%6)*MJB.gx,y=MJB.y+Math.floor(i/6)*MJB.gy; mjTile(c,x,y,MJB.w,MJB.h,board[i],true,lit[i]); if(lit[i]){ c.strokeStyle='rgba(216,30,30,.85)'; c.lineWidth=3.5; c.beginPath(); c.arc(x+MJB.w/2,y+MJB.h/2-2,17,0,TAU); c.stroke(); } }
      for(const L of MJ_LINES){ const n=L.filter(i=>lit[i]).length; if(n<5) continue; const p=k=>[MJB.x+(k%6)*MJB.gx+MJB.w/2,MJB.y+Math.floor(k/6)*MJB.gy+MJB.h/2]; c.strokeStyle=n===6?'rgba(60,220,100,.75)':'rgba(255,120,200,'+(.35+.25*Math.sin(t*6))+')'; c.lineWidth=8; c.lineCap='round'; c.beginPath(); c.moveTo(...p(L[0])); c.lineTo(...p(L[5])); c.stroke(); }
      if(flyT){ const u=flyT.u,a=[MJD.x+(flyT.from%6)*MJD.gx,MJD.y+Math.floor(flyT.from/6)*MJD.gy],b=[MJB.x+(flyT.bi%6)*MJB.gx,MJB.y+Math.floor(flyT.bi/6)*MJB.gy]; mjTile(c,lerp(a[0],b[0],u),lerp(a[1],b[1],u)-Math.sin(u*Math.PI)*50,46,58,flyT.id,true,true); }
      c.font='900 12px '+TC; c.textAlign='center'; c.fillStyle='#ffe8a0'; c.fillText('蓋著的牌（每局抽 '+N+' 張）',330,456); c.fillText('最多連 '+best+' 張'+(best===5?'・聽牌':''),636,456);
      canopy(c,160,W,S,t); hud(c,g,S,t,o); if(msg) banner(c,msg,480,480); } };
  g.dbg={get draws(){return draws;},get best(){return best;},get lines(){return lines;},get round(){return round;},get next(){return next;},pick(i){sel=i;},get drawn(){return drawn;}};
  return g; }
const MJNAME=id=>{ const k=id[0],v=id.slice(1); return k==='w'?'一二三四五六七八九'[v-1]+'萬':k==='t'?'一二三四五六七八九'[v-1]+'筒':k==='s'?'一二三四五六七八九'[v-1]+'條':v; };

// ═════════ 逛夜市（開場：在街上走，選攤位進去玩） ═════════
const FACT=[fishStall,ringStall,balloonStall,pinStall,nineStall,bagStall,pistolStall,mahjongStall];
const STREET=(()=>{ const q=[{k:'arch'},{k:'food',f:0},{k:'game',i:0},{k:'game',i:1},{k:'food',f:1},{k:'game',i:2},{k:'game',i:3},{k:'food',f:2},{k:'game',i:4},{k:'game',i:5},{k:'food',f:10},{k:'game',i:6},{k:'game',i:7},{k:'food',f:5},{k:'exit'}]; let x=0; q.forEach(s=>{ s.w=s.k==='arch'||s.k==='exit'?240:270; s.x=x; x+=s.w; }); q.W=x; return q; })();
function settle(si,sc){ const S=STALLS[si]; let tier=-1; S.th.forEach((v,i)=>{ if(sc>=v) tier=i; }); const b=load('best.'+si,0); if(sc>b) store('best.'+si,sc); const al=load('album.'+si,{}); if(tier>=0){ al[tier]=(al[tier]||0)+1; store('album.'+si,al); } return {tier,pz:tier>=0?S.pz[tier]:null,al}; }
const snapCache={}; function stallSnap(i){ if(snapCache[i]) return snapCache[i]; const cv=document.createElement('canvas'); cv.width=400; cv.height=250; const x=cv.getContext('2d'); x.scale(.5,.5); const G=FACT[i]({keys:{},hit:()=>false,sfx:()=>{}},{}); G.draw(x,1.2); return snapCache[i]=cv; }
function stroll(env,opts,preview){ const Q={owner:{},N:15}; let px=STREET[2].x+135,cam=0,ph=0,moving=0,face=1,st='walk',inner=null,innerI=-1,res=null,fade=0,got=[],near=null,tt=0;
  const W2=[]; for(let i=0;i<20;i++) W2.push({x:rnd(0,STREET.W),v:(Math.random()<.5?-1:1)*rnd(38,70),d:rnd(0,1),ph:rnd(0,TAU),L:randLook(i*5+11),stop:0,stopT:rnd(2,9)});
  const me={sk:'#f0c8a0',hr:'#1a1210',top:'#3a8ad8',bot:'#2a3a5a',shoe:'#f4f4f4'};
  function update(dt,t){ tt=t;
    for(const p of W2){ if(p.stop>0){ p.stop-=dt; continue; } p.x+=p.v*dt; p.ph+=dt*6.5; p.stopT-=dt; if(p.stopT<=0){ p.stop=rnd(1.5,4); p.stopT=rnd(5,12); } if(p.x<-60) p.x=STREET.W+40; if(p.x>STREET.W+60) p.x=-40; }
    if(fade>0) fade=Math.max(0,fade-dt*3);
    if(st==='in'){ inner.update(dt,t); if(inner.ended()){ const r=settle(innerI,inner.score()); res={i:innerI,sc:inner.score(),...r}; if(r.pz) got.push(r.pz); st='res'; env.sfx(r.tier>=1?'win':r.tier===0?'heal':'lose'); } return; }
    if(st==='res'){ if(env.hit('Space')||env.hit('Enter')||env.hit('KeyJ')){ st='walk'; inner=null; fade=1; } return; }
    const K=env.keys,mx=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0); moving=mx; if(mx){ face=mx; px=clamp(px+mx*230*dt,60,STREET.W-60); ph+=dt*8; }
    cam=clamp(px-W/2,0,STREET.W-W); near=null; for(const s of STREET){ if(s.k!=='game'&&s.k!=='exit') continue; if(Math.abs(px-(s.x+s.w/2))<s.w*.42) near=s; }
    if(near&&(env.hit('Space')||env.hit('Enter')||env.hit('KeyJ'))){ if(near.k==='exit'){ st='done'; const html=got.length?'<table class="ls"><tr><th>今天換到的獎品</th></tr>'+got.map(p=>'<tr><td>'+p[0]+'</td></tr>').join('')+'</table>':''; env.end({title:got.length?'滿載而歸！':'下次再來逛！',big:got.length+' 樣獎品',html,text:'謝謝光臨，下次再來玩！',score:null}); return; }
      innerI=near.i; Q.owner={}; inner=FACT[innerI](env,Q); st='in'; fade=1; env.sfx('go'); } }
  function facade(c,s,X,t){ const top=70,base=372,w=s.w-14,x=X+7;
    if(s.k==='arch'||s.k==='exit'){ const cx=X+s.w/2; c.fillStyle='#8a1a10'; c.fillRect(cx-100,90,18,base-90); c.fillRect(cx+82,90,18,base-90); const g=c.createLinearGradient(0,60,0,120); g.addColorStop(0,'#e83a20'); g.addColorStop(1,'#a01a10'); c.fillStyle=g; rr(c,cx-118,56,236,62,10); c.fill(); c.strokeStyle='#ffd23f'; c.lineWidth=3; c.stroke();
      for(let i=0;i<16;i++){ c.fillStyle=(Math.floor(t*5)+i)%2?'#fff6a0':'#8a5a2a'; c.beginPath(); c.arc(cx-110+i*14.6,56,3,0,TAU); c.arc(cx-110+i*14.6,118,3,0,TAU); c.fill(); }
      c.font='900 24px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#ffe08a'; c.fillText(s.k==='arch'?'星光觀光夜市':'出口・回家',cx,82); c.font='900 12px '+TC; c.fillText(s.k==='arch'?'歡迎光臨':'謝謝光臨，下次再來',cx,105);
      for(const sd of [-1,1]){ c.fillStyle='#d8201a'; c.beginPath(); c.ellipse(cx+sd*70,150,16,20,0,0,TAU); c.fill(); c.fillStyle='#ffd23f'; c.fillRect(cx+sd*70-7,128,14,4); c.fillRect(cx+sd*70-7,168,14,4); } return; }
    const game=s.k==='game',S=game?STALLS[s.i]:null,F=game?null:FOODS[s.f];
    // 攤位的燈把周圍照亮
    const glow=c.createRadialGradient(x+w/2,top+80,10,x+w/2,top+140,w*.95); glow.addColorStop(0,game?'rgba(255,255,240,.42)':'rgba(255,220,160,.38)'); glow.addColorStop(1,'rgba(255,230,180,0)'); c.fillStyle=glow; c.fillRect(x-60,top-50,w+120,base-top+140);
    // 後牆（攤子裡面被日光燈照得很亮）
    const ig=c.createLinearGradient(0,top+40,0,base); if(game){ ig.addColorStop(0,'#fffaf0'); ig.addColorStop(1,'#d8c0a0'); } else { ig.addColorStop(0,'#f4f0e8'); ig.addColorStop(1,'#a8a49c'); } c.fillStyle=ig; c.fillRect(x,top+40,w,base-top-40);
    if(game){ // 獎品架：一層一層擺滿娃娃，上面還吊著一排
      const K=['bear','cat','duck','robot','bigbear','car','candy','soda','snack','bear','cat','duck'];
      for(let r=0;r<2;r++){ const sy=top+92+r*44; c.fillStyle='#c8a070'; c.fillRect(x+6,sy,w-12,5); c.fillStyle='rgba(0,0,0,.15)'; c.fillRect(x+6,sy+5,w-12,3); for(let k=0;k<6;k++) prize(c,x+28+k*(w-56)/5,sy-2,.8,K[(k*3+r*5+s.i)%K.length]); }
      c.strokeStyle='#5a5a62'; c.lineWidth=2; c.beginPath(); c.moveTo(x+4,top+48); c.lineTo(x+w-4,top+48); c.stroke();
      for(let k=0;k<5;k++){ const hx=x+30+k*(w-60)/4,sw=Math.sin(t*1.6+k+s.i)*3; c.strokeStyle='rgba(60,60,60,.7)'; c.lineWidth=1; c.beginPath(); c.moveTo(hx,top+48); c.lineTo(hx+sw,top+58); c.stroke(); prize(c,hx+sw,top+70,.72,K[(k*2+s.i+3)%K.length]); }
      c.drawImage(stallSnap(s.i),85,32,315,210,x+28,top+150,w-56,(w-56)*210/315); c.strokeStyle='#8a6a40'; c.lineWidth=3; c.strokeRect(x+28,top+150,w-56,(w-56)*210/315);
      // 價目牌
      c.save(); c.translate(x+w-50,top+120); c.rotate(.05); c.fillStyle='#fff'; rr(c,-36,-16,72,40,4); c.fill(); c.strokeStyle='#c81414'; c.lineWidth=2; c.stroke(); c.fillStyle='#c81414'; c.font='900 10px '+TC; c.textAlign='center'; c.textBaseline='middle'; const pr=S.sub.split(' '); c.fillText(pr[0],0,-5,66); c.fillText(pr.slice(1).join(' '),0,10,66); c.restore(); }
    else { // 小吃攤：菜單板、不鏽鋼推車＋玻璃櫥窗、冒煙
      c.fillStyle='#1a1a1e'; rr(c,x+18,top+56,w-36,74,5); c.fill(); c.strokeStyle='#c8a040'; c.lineWidth=2; c.stroke(); c.font='900 15px '+TC; c.textAlign='left'; c.textBaseline='middle';
      const menu=[[F[0],FPRICE[s.f]],[FSIDE[s.f][0],FSIDE[s.f][1]],['加辣／不辣','免費']]; menu.forEach(([n,p],k)=>{ c.fillStyle=k?'#f4f0e8':'#ffd23f'; c.fillText(n,x+30,top+72+k*21,w-120); c.textAlign='right'; c.fillStyle='#ff8a6a'; c.fillText(typeof p==='number'?'$'+p:p,x+w-30,top+72+k*21); c.textAlign='left'; });
      const lan=(lx,ly)=>{ c.fillStyle='#d8201a'; c.beginPath(); c.ellipse(lx,ly,11,14,0,0,TAU); c.fill(); c.fillStyle='rgba(255,200,120,.35)'; c.beginPath(); c.arc(lx,ly,22,0,TAU); c.fill(); c.fillStyle='#ffd23f'; c.fillRect(lx-5,ly-16,10,3); c.fillRect(lx-5,ly+13,10,3); c.fillRect(lx-1,ly+16,2,8); }; lan(x+14,top+58); lan(x+w-14,top+58);
      for(let i=0;i<3;i++){ const k=(t*.4+i/3)%1; c.fillStyle='rgba(240,240,240,'+(.28*(1-k))+')'; c.beginPath(); c.arc(x+60+i*70+Math.sin(t*1.3+i)*8,base-132-k*30,8+k*14,0,TAU); c.fill(); } }
    // 老闆站在檯子後面
    const oi=game?s.i:(s.f+3)%8,call=((t+s.x*.013)%9)<2; human(c,x+w-46,base-4,150,game?OWN[oi]:{...OWN[oi],apron:'#f4f4f4',cap:'#f4f4f4'},{dir:0,pose:game?(call?'wave':'hips'):'talk',t,mouth:call||!game});
    if(game){ c.fillStyle='#6a4428'; c.fillRect(x,base-70,w,70); c.fillStyle='#8a5c36'; c.fillRect(x-3,base-74,w+6,8); c.fillStyle='rgba(0,0,0,.25)'; for(let i=0;i<6;i++) c.fillRect(x+i*w/6,base-66,2,66);
      c.fillStyle=S.tarp[0]; c.fillRect(x+12,base-58,w-24,30); c.fillStyle='#fff'; c.font='900 14px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(S.sub,x+w/2,base-43,w-40); }
    else { // 不鏽鋼推車＋玻璃櫥窗
      const sg=c.createLinearGradient(0,base-78,0,base); sg.addColorStop(0,'#e8ecf2'); sg.addColorStop(.5,'#a8aeb8'); sg.addColorStop(1,'#6a707a'); c.fillStyle=sg; c.fillRect(x+4,base-78,w-8,78); c.fillStyle='rgba(255,255,255,.5)'; c.fillRect(x+4,base-74,w-8,2);
      c.fillStyle='rgba(200,230,255,.35)'; c.fillRect(x+12,base-128,w-24,50); c.strokeStyle='#c8ccd4'; c.lineWidth=3; c.strokeRect(x+12,base-128,w-24,50); c.fillStyle='rgba(255,255,255,.4)'; c.beginPath(); c.moveTo(x+18,base-124); c.lineTo(x+48,base-124); c.lineTo(x+22,base-84); c.closePath(); c.fill();
      for(let i=0;i<8;i++){ c.fillStyle=['#c8782a','#e0a040','#a0501a','#d89040'][(i+s.f)%4]; c.beginPath(); c.ellipse(x+32+i*(w-60)/7,base-90,11,6,0,0,TAU); c.fill(); c.fillStyle='rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(x+29+i*(w-60)/7,base-92,4,2,0,0,TAU); c.fill(); }
      c.fillStyle=F[2]; c.fillRect(x+12,base-60,w-24,28); c.fillStyle=F[1]; c.font='900 16px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(F[0]+'　$'+FPRICE[s.f],x+w/2,base-46,w-40);
      // 攤前的塑膠小凳子和小桌子
      c.fillStyle='#e8eef4'; c.fillRect(x+w*.3,base+10,60,6); c.fillStyle='#c8ccd4'; c.fillRect(x+w*.3+4,base+16,4,22); c.fillRect(x+w*.3+52,base+16,4,22);
      for(const [sx,col] of [[x+w*.18,'#d82a2a'],[x+w*.62,'#2a6ad8']]){ c.fillStyle=col; rr(c,sx,base+18,26,7,3); c.fill(); c.fillRect(sx+3,base+25,4,14); c.fillRect(sx+19,base+25,4,14); } }
    // 遮雨帆布（一片片垂下來的波浪邊）
    const tarp=game?S.tarp:['#c8282a','#f4f0e8'],n=7,sw=w/n; c.fillStyle='rgba(0,0,0,.35)'; c.fillRect(x-4,top+12,w+8,4); for(let i=0;i<n;i++){ const g2=c.createLinearGradient(0,top+14,0,top+44); g2.addColorStop(0,shade(tarp[i%2],-.15)); g2.addColorStop(1,tarp[i%2]); c.fillStyle=g2; c.fillRect(x+i*sw,top+14,sw,28); c.beginPath(); c.moveTo(x+i*sw,top+42); c.quadraticCurveTo(x+i*sw+sw/2,top+56,x+(i+1)*sw,top+42); c.fill(); }
    // 鐵架柱子
    for(const pxx of [x+2,x+w-2]){ const g3=c.createLinearGradient(pxx-4,0,pxx+4,0); g3.addColorStop(0,'#5a5e68'); g3.addColorStop(.5,'#eef2f8'); g3.addColorStop(1,'#4a4e58'); c.fillStyle=g3; c.fillRect(pxx-4,top+10,8,base-top-10); }
    // 日光燈管（白光）
    c.fillStyle='rgba(255,255,255,.2)'; c.fillRect(x+16,top+44,w-32,14); c.fillStyle='#ffffff'; c.fillRect(x+20,top+48,w-40,5); c.fillStyle='rgba(220,240,255,.9)'; c.fillRect(x+20,top+48,w-40,2);
    // 招牌：遊戲攤＝紅底黃字大布條；小吃攤＝會閃的 LED 招牌
    if(game){ c.fillStyle='#14100c'; rr(c,x+10,top-30,w-20,46,6); c.fill(); const sg=c.createLinearGradient(0,top-27,0,top+13); sg.addColorStop(0,'#e8201a'); sg.addColorStop(1,'#a8100c'); c.fillStyle=sg; rr(c,x+13,top-27,w-26,40,5); c.fill(); c.font='900 24px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=4; c.strokeStyle='#5a0808'; c.strokeText(S.sign,x+w/2,top-6,w-50); c.fillStyle='#ffe040'; c.fillText(S.sign,x+w/2,top-6,w-50); }
    else { c.fillStyle='#0c0c10'; rr(c,x+12,top-30,w-24,46,6); c.fill(); for(let i=0;i<22;i++){ const on=(Math.floor(t*6)+i)%3; c.fillStyle=on?'#ff3a3a':'#ffd23f'; c.beginPath(); c.arc(x+18+i*(w-36)/21,top-26,1.8,0,TAU); c.arc(x+18+i*(w-36)/21,top+12,1.8,0,TAU); c.fill(); }
      c.font='900 24px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.shadowColor=F[1]==='#fff'?'#ff6a3a':F[1]; c.shadowBlur=10; c.fillStyle=F[1]==='#fff'?'#ffb070':F[1]; c.fillText(F[0],x+w/2,top-6,w-50); c.shadowBlur=0; }
    bulbs(c,x+4,top+16,x+w-4,top+16,4,7,t+s.x,false);
    if(game){ c.font='900 12px '+TC; c.textAlign='center'; c.fillStyle='#14122b'; }
    if(call&&game) bubble(c,x+w-46,base-118,'來喔～'+STALLS[s.i].n+'！',150);
    if(call&&!game&&((t+s.x*.01)%9)<1) bubble(c,x+w-46,base-118,'好吃的'+F[0]+'喔！',150);
    if(near===s){ c.strokeStyle='rgba(255,230,80,'+(.6+.4*Math.sin(t*6))+')'; c.lineWidth=4; rr(c,x-2,top-32,w+4,base-top+34,10); c.stroke(); } }
  function draw(c,t){ if(st==='in'||st==='res'){ inner.draw(c,t); if(st==='res') result(c,t); if(fade>0){ c.fillStyle='rgba(0,0,0,'+fade+')'; c.fillRect(0,0,W,H); } return; }
    const sky=c.createLinearGradient(0,0,0,300); sky.addColorStop(0,'#05060f'); sky.addColorStop(1,'#2a1a2a'); c.fillStyle=sky; c.fillRect(0,0,W,H);
    const sk=skyline(),TW=sk.width/2,off=((cam*.35)%TW+TW)%TW; for(let k=0;k*TW-off<W;k++) c.drawImage(sk,k*TW-off,-30,TW,sk.height/2); /* 遠處的老街大樓 */
    const gd=c.createLinearGradient(0,372,0,H); gd.addColorStop(0,'#2a2628'); gd.addColorStop(1,'#141214'); c.fillStyle=gd; c.fillRect(0,372,W,H-372); /* 柏油路 */
    c.fillStyle='rgba(255,255,255,.035)'; for(let i=0;i<60;i++){ const x=((i*97-cam)%(W+40)+W+40)%(W+40)-20; c.fillRect(x,380+(i*37)%110,2,2); }
    for(let i=0;i<4;i++){ const x=((i*480+120-cam)%(W+480)+W+480)%(W+480)-240; c.fillStyle='#3a3638'; c.fillRect(x,452,90,18); c.fillStyle='#1a1818'; for(let k=0;k<8;k++) c.fillRect(x+5+k*11,455,6,12); } /* 水溝蓋 */
    for(const s2 of STREET){ const X=s2.x-cam+s2.w/2; if(X<-200||X>W+200) continue; const col=s2.k==='game'?'255,250,235':'255,190,120'; const g=c.createLinearGradient(0,375,0,H); g.addColorStop(0,'rgba('+col+',.16)'); g.addColorStop(1,'rgba('+col+',0)'); c.fillStyle=g; c.fillRect(X-s2.w*.35,375,s2.w*.7,H-375); } /* 地上的燈光倒影 */
    for(const s of STREET){ const X=s.x-cam; if(X>W||X+s.w<0) continue; facade(c,s,X,t); }
    for(let i=0;i<2;i++){ const y=2+i*9,o=((-cam*(.6+i*.15))%300+300)%300; bulbs(c,-300+o,y,W+300+o,y,6,30,t+i,true); } /* 頭上的燈泡串 */
    // 人（依前後排序），自己也在裡面
    const ppl=W2.map(p=>({y:380+p.d*96,f:()=>{ const X=p.x-cam; if(X<-60||X>W+60) return; human(c,X,380+p.d*96,128+p.d*60,p.L,p.stop>0?{dir:2,t}:{dir:p.v>0?1:-1,ph:p.ph,t}); }}));
    ppl.push({y:444,f:()=>{ const X=px-cam; human(c,X,444,170,me,moving?{dir:face,ph,t}:{dir:2,t}); c.fillStyle='#ffd23f'; c.beginPath(); c.moveTo(X-9,444-196); c.lineTo(X+9,444-196); c.lineTo(X,444-182); c.fill(); c.font='900 13px '+TC; c.textAlign='center'; c.fillText('你',X,444-204); }});
    ppl.sort((a,b)=>a.y-b.y).forEach(p=>p.f());
    // 提示
    c.fillStyle='rgba(11,10,28,.82)'; rr(c,8,8,190,58,10); c.fill(); c.textAlign='left'; c.textBaseline='alphabetic'; c.font='900 12px '+TC; c.fillStyle='#ffd23f'; c.fillText('今天換到的獎品',18,26); got.slice(-7).forEach((p,i)=>prize(c,28+i*24,58,.8,p[1])); if(!got.length){ c.font='700 11px '+TC; c.fillStyle='#cfc8ff'; c.fillText('還沒有，去攤位玩玩看！',18,48); }
    if(near){ const txt=near.k==='exit'?'空白鍵　回家（結束）':'空白鍵　玩「'+STALLS[near.i].n+'」'; c.font='900 18px '+TC; c.textAlign='center'; const w=c.measureText(txt).width+40; c.fillStyle='rgba(255,210,63,.95)'; rr(c,W/2-w/2,H-50,w,36,18); c.fill(); c.fillStyle='#14122b'; c.textBaseline='middle'; c.fillText(txt,W/2,H-32);
      if(near.k==='game'){ const b=load('best.'+near.i,0); if(b){ c.font='700 12px '+TC; c.fillStyle='#fff'; c.fillText('最高 '+b+' 分',W/2,H-62); } } }
    else { c.font='700 13px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=4; c.strokeStyle='#0b0a1c'; const s=env.touch?'← → 逛夜市，走到攤位前按 GO！':'← → 逛夜市，走到攤位前按空白鍵'; c.strokeText(s,W/2,H-22); c.fillStyle='#fff'; c.fillText(s,W/2,H-22); }
    if(fade>0){ c.fillStyle='rgba(0,0,0,'+fade+')'; c.fillRect(0,0,W,H); } }
  function result(c,t){ c.fillStyle='rgba(8,8,20,.6)'; c.fillRect(0,0,W,H); c.fillStyle='#fff8e8'; rr(c,W/2-190,110,380,270,18); c.fill(); c.strokeStyle='#ffd23f'; c.lineWidth=4; c.stroke();
    c.textAlign='center'; c.textBaseline='middle'; c.font='900 22px '+TC; c.fillStyle='#c81414'; c.fillText(res.pz?'老闆：恭喜！拿去吧！':'老闆：再來一次啦！',W/2,146);
    c.font='900 16px '+TC; c.fillStyle='#14122b'; const S=STALLS[res.i]; c.fillText(S.n+'　'+fmtSc(S,res.sc),W/2,178);
    if(res.pz){ prize(c,W/2,300,3.2,res.pz[1]); c.font='900 18px '+TC; c.fillStyle='#c81414'; c.fillText('「'+res.pz[0]+'」',W/2,330); } else { c.font='700 14px '+TC; c.fillStyle='#5a5a6a'; c.fillText('差一點就有獎品了',W/2,260); }
    c.font='900 14px '+TC; c.fillStyle='#14122b'; c.fillText('按空白鍵回到街上',W/2,362); }
  return {update,draw,get st(){return st;},get innerI(){return innerI;},get px(){return px;},set px(v){px=v;},get near(){return near;},get inner(){return inner;},W2}; }

const fmtSc=(S,v)=>S.unit?v+' '+S.unit:v+' 分';
// ───────── 外殼介面 ─────────
function create(env,opts){ const stg=clamp(opts.stage|0,0,STALLS.length),{ctx:c}=env.canvas2d(W,H); let t=0,done=false;
  if(stg===0){ const R=stroll(env,opts); return {update(dt){ dt=Math.min(dt,.05); t+=dt; R.update(dt,t); },draw(){ c.save(); R.draw(c,t); c.restore(); },destroy(){},helpStage:()=>R.st==='in'||R.st==='res'?R.innerI+1:0 /* 在攤位裡按「遊戲操作」顯示這一攤的說明 */,_dbg:{R}}; }
  const si=stg-1,S=STALLS[si],G=FACT[si](env,{owner:{},N:+((opts.options||{}).mjn)||15});
  function update(dt){ dt=Math.min(dt,.05); t+=dt; G.update(dt,t); if(!done&&G.ended()){ done=true; finish(); } }
  function finish(){ const sc=G.score(),{tier,pz,al}=settle(si,sc); env.sfx(tier>=1?'win':tier===0?'heal':'lose');
    env.end({title:pz?'老闆：恭喜！拿去吧！':'老闆：再來一次啦！',big:fmtSc(S,sc),html:'<table class="ls"><tr><th>獎項</th><th>條件</th><th>獎品</th></tr>'+S.th.map((v,i)=>'<tr><td>'+(i===tier?'★ ':'')+['小獎','中獎','大獎'][i]+'</td><td>'+fmtSc(S,v)+'</td><td>'+S.pz[i][0]+(al[i]?'　✓':'')+'</td></tr>').join('')+'</table>',
      text:pz?'你換到「'+pz[0]+'」！':'差一點就有獎品了。',score:S.unit?null:(sc||null)}); }
  function draw(){ c.save(); G.draw(c,t); c.restore(); }
  return {update,draw,destroy(){},_dbg:G.dbg?Object.assign(G.dbg,{G}):{G}}; }
function stageShow(ctx,w,h,stg,t){ ctx.save(); ctx.scale(w/W,h/H); const env={keys:{},hit:()=>false,sfx:()=>{},end:()=>{}};
  const k='__nightPv'+stg; if(!stageShow[k]){ if(stg===0){ const R=stroll(env,{}); R.px=STREET[3].x+40; R.update(0,0); stageShow[k]={draw:(c,t)=>{ R.update(1/60,t); R.draw(c,t); }}; } else { const G=FACT[stg-1](env,{}); if(stg===3) G.dbg.aim(480,220); if(stg===7) G.dbg.aim(470,200); stageShow[k]=G; } }
  stageShow[k].draw(ctx,t||0); ctx.restore(); }
const HELP=[[['方向鍵','移動紙網'],['空白鍵','下水撈（靠近水面的魚比較好撈）']],[['← →','左右瞄準'],['↑ ↓','丟遠、丟近'],['空白鍵','丟圈圈']],[['方向鍵','移動準星（手會晃）'],['空白鍵','開槍']],[['空白鍵','照力道表彈出彈珠']],
  [['方向鍵','瞄準'],['空白鍵','投球']],[['方向鍵','瞄準'],['空白鍵','丟沙包']],[['方向鍵','移動準星'],['空白鍵','開槍']],[['方向鍵','選一張蓋著的牌'],['空白鍵','翻牌']]];
const GOAL=['用紙網撈金魚，紙泡水太久或撈太重的魚會破。3 支紙網都破了就結束。','把 10 個圈圈丟出去，要整個套住獎品才算。越後面的獎品分數越高。','15 發子彈射氣球，金色氣球 3 分，打掉一整排多 5 分。','力道表來回跑，按下去把彈珠彈出去。進洞得分，連成一條線（橫、直、斜）多 5 分。',
  '12 顆球打九宮格，打掉一格 1 分，連成一線多 3 分。','每座 10 個罐子、3 個沙包，打倒一罐 1 分，全倒多 5 分，一共 4 座。','氣球在輸送帶上跑，20 發子彈，金色 3 分，連中 5 發多 3 分。','一共 6 局，每局從 36 張蓋著的牌抽 15 張，翻到的牌會在 6×6 盤面亮起來。直接連成一線（橫、直、斜 6 張）就送娃娃；聽牌（差 1 張）加抽 5 張，加抽連線多送一局。選 13、12 張玩，娃娃更大。'];
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).night={
  name:'夜市遊戲大集合',tag:'NIGHT MARKET',color:'#ff5a3a',
  desc:'逛台灣夜市！在熱鬧的夜市街上走，路人來來去去、老闆在攤位喊客人，走到攤位前就能玩：撈金魚、套圈圈、射氣球、賓果彈珠檯、棒球九宮格、丟沙包、手槍射氣球、麻將賓果。玩得好就換獎品，獎品會收藏起來。',
  goal:'逛夜市選攤位玩，分數到了就能換小獎、中獎或大獎。',
  stages:['逛夜市（自己選攤位）'].concat(STALLS.map(s=>s.n)),stageLabel:'選擇攤位',stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,0,t),
  stageGoal:si=>si===0?'在夜市街上逛，走到攤位前按空白鍵進去玩，玩完會回到街上。走到最右邊的出口就回家。':GOAL[si-1],
  stageHelp:si=>{ const H=si===0?[['← →','逛夜市'],['空白鍵','進攤位／回家']]:HELP[si-1]; return {help:H,touchHelp:H.map(([k,v])=>[k==='空白鍵'?'GO！':k.replace('方向鍵','方向'),v])}; },
  stageBest:i=>{ if(i===0){ let n=0; for(let k=0;k<STALLS.length;k++) n+=Object.keys(load('album.'+k,{})).length; return n?'獎品 '+n+'/'+STALLS.length*3:''; } const b=load('best.'+(i-1),0),al=load('album.'+(i-1),{}),n=Object.keys(al).length,S=STALLS[i-1]; return b?'最高 '+fmtSc(S,b)+(n?'・獎品 '+n+'/3':''):''; },
  help:[['方向鍵','移動'],['空白鍵','撈、丟、射、翻牌']],touchHelp:[['方向','移動'],['GO！','撈、丟、射、翻牌']],
  options:[{key:'mjn',label:'每局抽幾張',def:'15',only:[8],opts:[{id:'15',label:'15 張（中型娃娃）'},{id:'13',label:'13 張（大型娃娃）'},{id:'12',label:'12 張（超大娃娃）'}]}],
  touch:{left:'dpad',right:[{l:'GO！',c:'Space',act:true}]},
  best:{label:'最高分',fmt:v=>v+' 分',lower:false},create};
})();
