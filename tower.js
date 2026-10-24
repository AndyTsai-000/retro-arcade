// 糖果城保衛戰：塔防。怪物沿著道路走向糖果城堡，在路邊的空地蓋塔擋住牠們。
// 六張地圖各 5 關共 30 關；四種塔（棒棒糖砲、冰淇淋塔、汽水火箭、彩虹光束）各能升到 3 級；剩下的愛心決定星星數。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PIX='"Press Start 2P","Noto Sans TC",monospace';
const clamp=(v,a,b)=>v<a?a:v>b?b:v,dist=(a,b,c,d)=>Math.hypot(a-c,b-d);
function rng(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function shade(hex,k){ const n=parseInt(hex.slice(1),16); let r=n>>16&255,g=n>>8&255,b=n&255; if(k>1){ r+=(255-r)*(k-1); g+=(255-g)*(k-1); b+=(255-b)*(k-1); } else { r*=k; g*=k; b*=k; } return 'rgb('+[r,g,b].map(v=>Math.round(clamp(v,0,255))).join(',')+')'; }

/* ---------- 地圖 ---------- */
const MAPS=[
  {name:'糖果草原',path:[[-30,110],[180,110],[180,320],[400,320],[400,140],[610,140],[610,350],[730,350]],g:['#8fdc6a','#7acb5a'],road:['#f5d6a0','#d9a86a'],deco:'meadow'},
  {name:'巧克力河谷',path:[[-30,410],[150,410],[150,180],[330,180],[330,420],[520,420],[520,110],[700,110],[700,250]],g:['#c8e88a','#b2d478'],road:['#e8c08a','#b8864a'],deco:'choco'},
  {name:'冰淇淋雪山',path:[[-30,90],[680,90],[680,220],[120,220],[120,350],[640,350],[640,430],[720,430]],g:['#eef6ff','#d6e8ff'],road:['#ffd9ec','#e8a8c8'],deco:'snow'},
  {name:'果凍沼澤',path:[[400,-30],[400,110],[140,110],[140,410],[660,410],[660,200],[290,200],[290,300],[520,300]],g:['#b8e0d0','#9ccdbc'],road:['#ffe8a8','#e0b860'],deco:'jelly'},
  {name:'餅乾沙漠',path:[[-30,250],[110,250],[210,95],[330,405],[450,95],[570,405],[670,250],[740,250]],g:['#f7d9a0','#ecc584'],road:['#c88a4a','#9a6030'],deco:'desert'},
  {name:'夜空糖果城',path:[[-30,425],[260,425],[260,265],[80,265],[80,110],[460,110],[460,335],[640,335],[640,180],[735,180]],g:['#4a3a7a','#3e3068'],road:['#ffd2e6','#c890b0'],deco:'night'}];
function buildMap(mi){ const M=MAPS[mi],pts=M.path,segs=[]; let total=0;
  for(let i=0;i+1<pts.length;i++){ const [x0,y0]=pts[i],[x1,y1]=pts[i+1],l=Math.hypot(x1-x0,y1-y0); segs.push({x0,y0,x1,y1,l,d0:total}); total+=l; }
  const posAt=d=>{ d=clamp(d,0,total); for(const s of segs) if(d<=s.d0+s.l){ const u=(d-s.d0)/s.l; return [s.x0+(s.x1-s.x0)*u,s.y0+(s.y1-s.y0)*u,Math.atan2(s.y1-s.y0,s.x1-s.x0)]; } const s=segs[segs.length-1]; return [s.x1,s.y1,0]; };
  const segDist=(x,y)=>{ let m=1e9; for(const s of segs){ const dx=s.x1-s.x0,dy=s.y1-s.y0,u=clamp(((x-s.x0)*dx+(y-s.y0)*dy)/(s.l*s.l),0,1); m=Math.min(m,dist(x,y,s.x0+dx*u,s.y0+dy*u)); } return m; };
  const end=pts[pts.length-1],pads=[];
  for(let d=40;d<total-20;d+=34) for(const side of [-1,1]){ const [x,y,a]=posAt(d),px=x+Math.cos(a+Math.PI/2)*side*50,py=y+Math.sin(a+Math.PI/2)*side*50;
    if(px<34||px>W-34||py<74||py>H-30) continue; if(segDist(px,py)<40) continue; if(dist(px,py,end[0],end[1])<70) continue; if(pads.some(p=>dist(p.x,p.y,px,py)<86)) continue; pads.push({x:px,y:py,cov:0}); }
  for(const p of pads){ let n=0; for(let d=0;d<total;d+=10){ const [x,y]=posAt(d); if(dist(x,y,p.x,p.y)<115) n++; } p.cov=n; } // 這塊空地能打到多少路（電腦示範和測試用）
  return {M,segs,total,posAt,segDist,pads,end}; }
const STAGES=Array.from({length:30},(_,i)=>{ const m=Math.floor(i/5),k=i%5; return {i,map:m,name:MAPS[m].name+' '+(k+1),waves:5+Math.floor(i/4),gold:250+i*12,hp:1+i*.075,boss:k===4}; });
const recKey=i=>'arcade.tower.s'+i,getRec=i=>{ try{ const v=localStorage.getItem(recKey(i)); return v==null?null:+v; }catch(e){ return null; } };

/* ---------- 塔與怪物 ---------- */
const TOWERS={
  candy:{name:'棒棒糖砲',cost:70,range:112,rate:.75,dmg:13,col:'#ff5d8f',desc:'發射糖果球，最基本的塔'},
  ice:{name:'冰淇淋塔',cost:85,range:102,rate:1,dmg:5,slow:.45,col:'#7ad8ff',desc:'讓怪物變慢'},
  soda:{name:'汽水火箭',cost:120,range:125,rate:1.6,dmg:26,splash:48,col:'#ffa03a',desc:'火箭爆炸打一整群'},
  rainbow:{name:'彩虹光束',cost:150,range:168,rate:1.7,dmg:48,pierce:true,col:'#b77bff',desc:'射得遠，穿透盔甲'}};
const TKEYS=['candy','ice','soda','rainbow'];
const upCost=(k,lv)=>Math.round(TOWERS[k].cost*(lv===1?.65:.95));
const stat=(k,lv)=>{ const T=TOWERS[k],m=[1,1.6,2.4][lv-1]; return {range:T.range*(1+(lv-1)*.1),rate:T.rate*(1-(lv-1)*.08),dmg:T.dmg*m,slow:T.slow?T.slow+(lv-1)*.08:0,splash:T.splash?T.splash*(1+(lv-1)*.12):0}; };
const FOES={
  bug:{name:'蛀牙蟲',hp:44,speed:54,gold:6,r:12,col:'#7acb3a'},
  ant:{name:'快跑螞蟻',hp:24,speed:100,gold:5,r:9,col:'#e2433a'},
  jelly:{name:'果凍胖胖',hp:140,speed:36,gold:14,r:16,col:'#ff7eb6'},
  beetle:{name:'盔甲甲蟲',hp:80,speed:46,armor:7,gold:12,r:13,col:'#3a5ad8'},
  boss:{name:'大胃王',hp:1100,speed:27,armor:5,gold:120,r:26,col:'#8a4ad8',lives:5}};
function waveList(S,w){ const r=rng(S.i*977+w*31),list=[],n=7+w*2+Math.floor(S.i*.35),last=w===S.waves-1;
  for(let k=0;k<n;k++){ const roll=r(); let f='bug'; if(S.i>=1&&roll<.22+w*.02) f='ant'; else if(S.i>=3&&roll>.82-w*.015) f='jelly'; else if(S.i>=7&&roll>.6&&roll<.75) f='beetle'; list.push({f,gap:f==='ant'?.45:f==='jelly'?1.1:.75}); }
  if(last&&S.boss) list.push({f:'boss',gap:2}); return list; }

/* ---------- 背景（每張地圖畫一次存起來） ---------- */
function drawCastle(c,x,y,s,t){ c.save(); c.translate(x,y); c.scale(s,s);
  c.fillStyle='rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0,26,54,12,0,0,7); c.fill();
  const tower=(tx,h,col)=>{ c.fillStyle=col; rr(c,tx-12,-h,24,h+24,4); c.fill(); c.strokeStyle='#8a3a5a'; c.lineWidth=2; c.stroke(); c.fillStyle='#ff9ec8'; c.beginPath(); c.moveTo(tx-15,-h); c.lineTo(tx,-h-26); c.lineTo(tx+15,-h); c.closePath(); c.fill(); c.stroke();
    c.fillStyle='#fff'; for(let i=0;i<3;i++){ c.beginPath(); c.arc(tx-8+i*8,-h+2,3.2,0,Math.PI); c.fill(); } c.fillStyle='#ffd23f'; c.beginPath(); c.moveTo(tx,-h-26); c.lineTo(tx,-h-40); c.lineTo(tx+12,-h-35+Math.sin(t*4+tx)*2); c.closePath(); c.fill(); };
  tower(-34,34,'#ffe0ee'); tower(34,34,'#ffe0ee');
  c.fillStyle='#fff0f6'; rr(c,-30,-20,60,44,6); c.fill(); c.strokeStyle='#8a3a5a'; c.lineWidth=2; c.stroke();
  c.fillStyle='#ff7eb6'; for(let i=0;i<5;i++){ rr(c,-30+i*13,-28,8,10,2); c.fill(); }
  tower(0,52,'#fff6fa');
  c.fillStyle='#8a4a2a'; rr(c,-10,2,20,22,8); c.fill(); c.fillStyle='#ffd23f'; c.beginPath(); c.arc(5,14,1.8,0,7); c.fill();
  c.fillStyle='#5ec8ff'; for(const [wx,wy] of [[-34,-18],[34,-18],[0,-34]]){ rr(c,wx-4,wy-6,8,10,4); c.fill(); }
  c.restore(); }
function drawSpawn(c,x,y,a){ c.save(); c.translate(x,y); c.rotate(a); c.fillStyle='#5a3a2a'; c.beginPath(); c.ellipse(0,0,26,30,0,0,7); c.fill(); c.fillStyle='#1a1018'; c.beginPath(); c.ellipse(4,0,16,22,0,0,7); c.fill(); c.restore(); }
function lolli(c,x,y,s,col){ c.strokeStyle='#fff'; c.lineWidth=4*s; c.beginPath(); c.moveTo(x,y); c.lineTo(x,y-40*s); c.stroke(); c.fillStyle=col; c.beginPath(); c.arc(x,y-48*s,15*s,0,7); c.fill(); c.strokeStyle='rgba(255,255,255,.85)'; c.lineWidth=3*s; c.beginPath(); for(let a=0;a<12;a+=.3) c.lineTo(x+Math.cos(a)*15*s*a/12,y-48*s+Math.sin(a)*15*s*a/12); c.stroke(); }
function cupcake(c,x,y,s,col){ // 軟糖（不要跟冰淇淋塔搞混）
  c.fillStyle='rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(x,y,12*s,4*s,0,0,7); c.fill(); c.fillStyle=col; c.beginPath(); c.moveTo(x-12*s,y); c.quadraticCurveTo(x-11*s,y-20*s,x,y-20*s); c.quadraticCurveTo(x+11*s,y-20*s,x+12*s,y); c.closePath(); c.fill();
  c.fillStyle='rgba(255,255,255,.75)'; for(const [dx,dy] of [[-5,-8],[3,-13],[6,-5],[-1,-4]]){ c.fillRect(x+dx*s,y+dy*s,1.8*s,1.8*s); } c.fillStyle='rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(x-4*s,y-13*s,3*s,2*s,-.5,0,7); c.fill(); }
function bgCanvas(mi){ const cv=document.createElement('canvas'),S=2; cv.width=W*S; cv.height=H*S; const c=cv.getContext('2d'); c.scale(S,S); paintMap(c,mi,0); return cv; }
function paintMap(c,mi,t){ const B=buildMap(mi),M=B.M,r=rng(mi*131+7);
  const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,M.g[0]); g.addColorStop(1,M.g[1]); c.fillStyle=g; c.fillRect(0,0,W,H);
  // 地面紋理
  for(let i=0;i<260;i++){ const x=r()*W,y=r()*H; if(B.segDist(x,y)<34) continue;
    if(M.deco==='snow'){ c.fillStyle='rgba(255,255,255,.7)'; c.beginPath(); c.arc(x,y,1+r()*2,0,7); c.fill(); }
    else if(M.deco==='night'){ c.fillStyle='rgba(255,255,255,'+(.2+r()*.5)+')'; c.fillRect(x,y,1.5,1.5); }
    else if(M.deco==='desert'){ c.fillStyle='rgba(180,120,60,.25)'; c.beginPath(); c.ellipse(x,y,3+r()*3,1.5,0,0,7); c.fill(); }
    else { c.strokeStyle='rgba(40,110,40,.35)'; c.lineWidth=1.4; c.beginPath(); c.moveTo(x,y); c.lineTo(x-2,y-5); c.moveTo(x,y); c.lineTo(x+2,y-6); c.stroke(); } }
  // 地圖特色
  const free=(x,y,m)=>B.segDist(x,y)>m&&B.segDist(x,y-36)>m*.8&&B.pads.every(p=>dist(p.x,p.y,x,y)>40&&dist(p.x,p.y,x,y-40)>34)&&dist(x,y,B.end[0],B.end[1])>80; // 裝飾不要擋到路和空地（棒棒糖比較高，上面也要空）
  if(M.deco==='choco'){ c.fillStyle='#7a4a2a'; c.beginPath(); c.moveTo(0,H*.62); c.bezierCurveTo(W*.3,H*.5,W*.5,H*.85,W,H*.7); c.lineTo(W,H*.8); c.bezierCurveTo(W*.5,H*.95,W*.3,H*.6,0,H*.72); c.closePath(); c.fill(); c.fillStyle='rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(0,H*.64); c.bezierCurveTo(W*.3,H*.53,W*.5,H*.87,W,H*.72); c.lineTo(W,H*.73); c.bezierCurveTo(W*.5,H*.89,W*.3,H*.55,0,H*.66); c.fill(); }
  if(M.deco==='jelly') for(let i=0;i<9;i++){ const x=r()*W,y=80+r()*(H-100); if(!free(x,y,50)) continue; c.fillStyle=['rgba(255,126,182,.5)','rgba(122,240,255,.5)','rgba(255,210,63,.5)'][i%3]; c.beginPath(); c.ellipse(x,y,26+r()*14,14+r()*6,0,0,7); c.fill(); c.fillStyle='rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(x-8,y-4,8,3,0,0,7); c.fill(); }
  if(M.deco==='snow') for(let i=0;i<5;i++){ const x=60+r()*(W-120),y=80+r()*(H-160); if(!free(x,y,60)) continue; c.fillStyle='#fff'; c.beginPath(); c.moveTo(x-40,y+20); c.lineTo(x,y-34); c.lineTo(x+40,y+20); c.fill(); c.fillStyle=['#ff9ec8','#ffe58a','#9ad6ff'][i%3]; c.beginPath(); c.moveTo(x-14,y-14); c.lineTo(x,y-34); c.lineTo(x+14,y-14); c.quadraticCurveTo(x+7,y-8,x,y-12); c.quadraticCurveTo(x-7,y-8,x-14,y-14); c.fill(); }
  // 道路：外框＋餅乾磚
  const road=(w2,col)=>{ c.strokeStyle=col; c.lineWidth=w2; c.lineCap='round'; c.lineJoin='round'; c.beginPath(); M.path.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y)); c.stroke(); };
  road(52,'rgba(0,0,0,.12)'); road(48,M.road[1]); road(40,M.road[0]);
  c.save(); c.setLineDash([10,14]); c.lineDashOffset=0; road(3,'rgba(255,255,255,.55)'); c.restore();
  for(let d=0;d<B.total;d+=22){ const [x,y]=B.posAt(d); c.fillStyle='rgba(0,0,0,.06)'; c.beginPath(); c.arc(x+Math.sin(d)*12,y+Math.cos(d*1.3)*12,2.2,0,7); c.fill(); }
  // 裝飾：棒棒糖、杯子蛋糕、樹、仙人掌…
  for(let i=0;i<34;i++){ const x=20+r()*(W-40),y=70+r()*(H-80); if(!free(x,y,44)) continue; const s=.7+r()*.5,pick=r();
    if(M.deco==='desert'){ if(pick<.5){ c.fillStyle='#5aa04a'; rr(c,x-5*s,y-34*s,10*s,34*s,5*s); c.fill(); rr(c,x-16*s,y-26*s,8*s,16*s,4*s); c.fill(); rr(c,x-16*s,y-14*s,14*s,6*s,3*s); c.fill(); } else { c.fillStyle='#d99a5a'; c.beginPath(); c.arc(x,y-10*s,12*s,0,7); c.fill(); c.fillStyle='#8a5a2a'; for(let k=0;k<5;k++){ c.beginPath(); c.arc(x-6*s+k*3*s,y-12*s+(k%2)*5*s,1.6*s,0,7); c.fill(); } } }
    else if(M.deco==='snow'){ c.fillStyle='#fff'; c.beginPath(); c.arc(x,y-8*s,10*s,0,7); c.fill(); c.beginPath(); c.arc(x,y-22*s,7*s,0,7); c.fill(); c.fillStyle='#14122b'; c.beginPath(); c.arc(x-2.5*s,y-23*s,1.2*s,0,7); c.arc(x+2.5*s,y-23*s,1.2*s,0,7); c.fill(); c.fillStyle='#ff8a3d'; c.beginPath(); c.moveTo(x,y-21*s); c.lineTo(x+6*s,y-20*s); c.lineTo(x,y-19*s); c.fill(); }
    else if(M.deco==='night'){ if(pick<.5) lolli(c,x,y,s*.9,['#ffd23f','#7af0ff','#ff7eb6'][i%3]); else { c.fillStyle='#ffe58a'; c.save(); c.translate(x,y-14*s); c.beginPath(); for(let k=0;k<10;k++){ const rad=k%2?5*s:12*s,a=k/10*6.28-Math.PI/2; c.lineTo(Math.cos(a)*rad,Math.sin(a)*rad); } c.closePath(); c.fill(); c.restore(); } }
    else if(pick<.35) lolli(c,x,y,s,['#ff5d8f','#7a5cff','#3ddbd9','#ffb000'][i%4]);
    else if(pick<.65) cupcake(c,x,y,s,['#ff5d8f','#ffb000','#5fd068','#7a5cff'][i%4]);
    else { c.fillStyle='#6b4a2a'; c.fillRect(x-3*s,y-16*s,6*s,16*s); c.fillStyle=M.deco==='choco'?'#5a8a3a':'#3fa05a'; for(const [dx,dy,rad] of [[0,-24,14],[-9,-18,10],[9,-18,10]]){ c.beginPath(); c.arc(x+dx*s,y+dy*s,rad*s,0,7); c.fill(); } c.fillStyle='#ff5d4f'; c.beginPath(); c.arc(x-4*s,y-26*s,2.4*s,0,7); c.arc(x+6*s,y-20*s,2.4*s,0,7); c.fill(); } }
  const p0=M.path[0],p1=M.path[1]; drawSpawn(c,clamp(p0[0],18,W-18),clamp(p0[1],18,H-18),Math.atan2(p1[1]-p0[1],p1[0]-p0[0]));
  drawCastle(c,B.end[0],B.end[1]-6,1,t); }

/* ---------- 畫塔與怪物 ---------- */
function drawTower(c,x,y,k,lv,ang,t,fire){ c.save(); c.translate(x,y);
  c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0,12,22,8,0,0,7); c.fill();
  // 底座：餅乾圓台
  c.fillStyle='#c88a4a'; c.beginPath(); c.ellipse(0,6,21,10,0,0,7); c.fill(); c.fillStyle='#e8b070'; c.beginPath(); c.ellipse(0,2,21,10,0,0,7); c.fill(); c.fillStyle='#8a5a2a'; for(let i=0;i<6;i++){ const a=i/6*6.28; c.beginPath(); c.arc(Math.cos(a)*13,2+Math.sin(a)*5,1.6,0,7); c.fill(); }
  const T=TOWERS[k],s=1+(lv-1)*.12; c.scale(s,s);
  if(k==='candy'){ c.fillStyle='#fff'; c.fillRect(-3,-22,6,24); c.save(); c.translate(0,-26); c.rotate(ang); c.fillStyle='#d9d9e8'; rr(c,2,-5,20,10,4); c.fill(); c.strokeStyle='#5a5a7a'; c.lineWidth=1.5; c.stroke(); c.restore();
    c.fillStyle=T.col; c.beginPath(); c.arc(0,-26,12,0,7); c.fill(); c.strokeStyle='rgba(255,255,255,.9)'; c.lineWidth=2.5; c.beginPath(); for(let a=0;a<12;a+=.3) c.lineTo(Math.cos(a+t*2)*12*a/12,-26+Math.sin(a+t*2)*12*a/12); c.stroke(); }
  else if(k==='ice'){ c.fillStyle='#e8b070'; c.beginPath(); c.moveTo(-11,-10); c.lineTo(11,-10); c.lineTo(0,10); c.closePath(); c.fill(); c.strokeStyle='#b8804a'; c.lineWidth=1; for(let i=-1;i<=1;i++){ c.beginPath(); c.moveTo(-8+i*5,-8); c.lineTo(i*3+2,6); c.stroke(); }
    const sc=['#b2f0ff','#ffc2e0','#fff3c0']; for(let i=0;i<lv;i++){ c.fillStyle=sc[i]; c.beginPath(); c.arc(0,-16-i*11,11-i,0,7); c.fill(); c.fillStyle='rgba(255,255,255,.6)'; c.beginPath(); c.arc(-4,-19-i*11,3,0,7); c.fill(); }
    c.fillStyle='#e23b3b'; c.beginPath(); c.arc(0,-28-(lv-1)*11,3.5,0,7); c.fill();
    if(Math.sin(t*3)>0){ c.fillStyle='#fff'; c.fillRect(12,-30,2,2); c.fillRect(-14,-20,2,2); } }
  else if(k==='soda'){ c.fillStyle=T.col; rr(c,-10,-30,20,32,6); c.fill(); c.fillStyle='#fff'; c.fillRect(-10,-20,20,8); c.fillStyle='#e23b3b'; c.font='900 7px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('汽水',0,-16); c.fillStyle='#c0c0d0'; rr(c,-8,-34,16,5,2); c.fill();
    c.save(); c.translate(0,-36); c.rotate(ang+Math.PI/2); c.fillStyle='#fff'; rr(c,-4,-14,8,16,4); c.fill(); c.fillStyle='#e23b3b'; c.beginPath(); c.moveTo(-4,-12); c.lineTo(0,-20); c.lineTo(4,-12); c.fill(); c.restore(); }
  else { c.fillStyle='#9a7aff'; c.beginPath(); c.moveTo(-10,0); c.lineTo(-6,-26); c.lineTo(6,-26); c.lineTo(10,0); c.closePath(); c.fill(); c.fillStyle='rgba(255,255,255,.3)'; c.beginPath(); c.moveTo(-6,0); c.lineTo(-3,-26); c.lineTo(0,-26); c.lineTo(-2,0); c.fill();
    const cols=['#ff5d5d','#ffb000','#ffe14d','#5fd068','#4fb8ff','#b77bff']; c.save(); c.translate(0,-34); c.rotate(t*1.5); for(let i=0;i<6;i++){ c.fillStyle=cols[i]; c.beginPath(); c.moveTo(0,0); c.arc(0,0,10,i/6*6.28,(i+1)/6*6.28); c.closePath(); c.fill(); } c.restore();
    c.fillStyle='rgba(255,255,255,.8)'; c.beginPath(); c.arc(-3,-37,3,0,7); c.fill(); if(fire>0){ c.fillStyle='rgba(255,255,255,'+fire*4+')'; c.beginPath(); c.arc(0,-34,16,0,7); c.fill(); } }
  c.restore();
  // 等級：小星星
  c.fillStyle='#ffd23f'; c.strokeStyle='#8a5a10'; c.lineWidth=1; for(let i=0;i<lv;i++){ const sx=x-(lv-1)*6+i*12,sy=y+20; c.beginPath(); for(let j=0;j<10;j++){ const rad=j%2?2.2:5,a=j/10*6.28-Math.PI/2; c.lineTo(sx+Math.cos(a)*rad,sy+Math.sin(a)*rad); } c.closePath(); c.fill(); c.stroke(); } }
function drawFoe(c,e,t){ const F=FOES[e.f],x=e.x,y=e.y,r=F.r,bob=Math.abs(Math.sin(t*10+e.id))*2,face=Math.cos(e.a)<-.2?-1:1; c.save(); c.translate(x,y-bob);
  c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0,r*.9+bob,r*.9,r*.3,0,0,7); c.fill();
  const col=e.slowT>0?'#9ad6ff':F.col,OL='#2a1a26';
  if(e.f==='ant'){ for(const [dx,rad] of [[-r*.9,r*.55],[0,r*.6],[r*.9,r*.75]]){ c.fillStyle=col; c.beginPath(); c.arc(dx*face,0,rad,0,7); c.fill(); c.strokeStyle=OL; c.lineWidth=1.3; c.stroke(); }
    c.strokeStyle=OL; c.lineWidth=1.2; for(let i=-1;i<=1;i++){ const lg=Math.sin(t*20+i)*3; c.beginPath(); c.moveTo(i*r*.4,r*.4); c.lineTo(i*r*.5+lg,r*.95); c.stroke(); } c.translate(r*.9*face,0); }
  else if(e.f==='jelly'){ const wob=Math.sin(t*6+e.id)*1.5; c.fillStyle=col; c.globalAlpha=.85; c.beginPath(); c.moveTo(-r,r*.6); c.quadraticCurveTo(-r-wob,-r*.8,0,-r-wob); c.quadraticCurveTo(r+wob,-r*.8,r,r*.6); c.closePath(); c.fill(); c.globalAlpha=1; c.strokeStyle=OL; c.lineWidth=1.5; c.stroke(); c.fillStyle='rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-r*.4,-r*.5,r*.25,r*.15,-.5,0,7); c.fill(); }
  else if(e.f==='beetle'){ c.fillStyle=col; c.beginPath(); c.ellipse(0,0,r,r*.85,0,0,7); c.fill(); c.strokeStyle=OL; c.lineWidth=1.5; c.stroke(); c.beginPath(); c.moveTo(0,-r*.85); c.lineTo(0,r*.85); c.stroke(); c.fillStyle='rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-r*.4,-r*.35,r*.3,r*.18,-.4,0,7); c.fill(); c.fillStyle='#2a2a4a'; c.beginPath(); c.arc(face*r*.85,0,r*.45,0,7); c.fill(); c.translate(face*r*.85,0); }
  else if(e.f==='boss'){ c.fillStyle=col; c.beginPath(); c.arc(0,0,r,0,7); c.fill(); c.strokeStyle=OL; c.lineWidth=2; c.stroke(); c.fillStyle='#ffd23f'; c.beginPath(); c.moveTo(-r*.6,-r*.8); c.lineTo(-r*.5,-r*1.3); c.lineTo(-r*.2,-r*.95); c.lineTo(0,-r*1.4); c.lineTo(r*.2,-r*.95); c.lineTo(r*.5,-r*1.3); c.lineTo(r*.6,-r*.8); c.closePath(); c.fill(); c.stroke();
    c.fillStyle='#fff'; c.beginPath(); c.moveTo(-r*.5,r*.35); c.quadraticCurveTo(0,r*.85,r*.5,r*.35); c.closePath(); c.fill(); c.strokeStyle=OL; c.lineWidth=1.5; c.stroke(); }
  else { c.fillStyle=col; c.beginPath(); c.arc(0,0,r,0,7); c.fill(); c.strokeStyle=OL; c.lineWidth=1.5; c.stroke(); c.strokeStyle=OL; c.lineWidth=1.3; for(const k of [-1,1]){ c.beginPath(); c.moveTo(k*r*.35,-r*.8); c.quadraticCurveTo(k*r*.6,-r*1.4,k*r*.8,-r*1.3); c.stroke(); c.fillStyle='#ffd23f'; c.beginPath(); c.arc(k*r*.8,-r*1.3,2.2,0,7); c.fill(); }
    c.fillStyle='rgba(255,255,255,.35)'; c.beginPath(); c.arc(-r*.35,-r*.35,r*.3,0,7); c.fill(); }
  // 臉：大眼睛、腮紅
  if(e.f!=='boss'||true){ const er=e.f==='boss'?4.2:e.f==='ant'?2.2:3, ex=e.f==='ant'?r*.3:r*.38, ey=e.f==='boss'?-r*.15:-r*.12;
    for(const k of [-1,1]){ c.fillStyle='#fff'; c.beginPath(); c.arc(k*ex+face*1.5,ey,er+1,0,7); c.fill(); c.fillStyle='#2a1a2a'; c.beginPath(); c.arc(k*ex+face*2,ey+.5,er,0,7); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(k*ex+face*2+1,ey-.8,er*.35,0,7); c.fill(); }
    if(e.f==='boss'){ c.strokeStyle=OL; c.lineWidth=2; for(const k of [-1,1]){ c.beginPath(); c.moveTo(k*ex-k*5,ey-er-5); c.lineTo(k*ex+k*3,ey-er-2); c.stroke(); } }
    c.fillStyle='rgba(255,120,150,.6)'; for(const k of [-1,1]){ c.beginPath(); c.ellipse(k*ex*1.25,ey+er+2,2.2,1.3,0,0,7); c.fill(); } }
  c.restore();
  // 血條
  if(e.hp<e.max){ const w=Math.max(18,r*2); c.fillStyle='rgba(0,0,0,.5)'; rr(c,x-w/2,y-r-12,w,4,2); c.fill(); c.fillStyle=e.hp/e.max>.5?'#5fd068':e.hp/e.max>.25?'#ffd23f':'#ff5d4f'; rr(c,x-w/2,y-r-12,w*e.hp/e.max,4,2); c.fill(); } }

/* ---------- 遊戲 ---------- */
function create(env,opts){
  const si=clamp(opts.stage|0,0,29),S=STAGES[si],B=buildMap(S.map),{ctx:c,canvas}=env.canvas2d(W,H),bgc=typeof document!=='undefined'?bgCanvas(S.map):null,sfx=n=>env.sfx(n);
  let gold=S.gold,lives=20,wave=-1,phase='prep',betweenT=0,spawnQ=[],spawnT=0,t=0,speed=1,ended=false,endT=0,won=false;
  const towers=[],foes=[],shots=[],fx=[],pops=[]; let sel=null,menu=null,hover=null,eid=0,msg='',msgT=0;
  const say=(s,sec)=>{ msg=s; msgT=sec||2; };
  const padAt=(x,y)=>B.pads.find(p=>dist(p.x,p.y,x,y)<26),towerOn=p=>towers.find(tw=>tw.pad===p);
  function startWave(){ if(wave>=S.waves-1) return; const early=phase==='between'?Math.ceil(betweenT):0; if(early>0){ gold+=early*3; pops.push({x:W-160,y:60,txt:'提早 +'+early*3,col:'#ffd23f',t:0}); }
    wave++; phase='wave'; spawnQ=waveList(S,wave); spawnT=.4; sfx('go'); say('第 '+(wave+1)+' 波'+(wave===S.waves-1&&S.boss?'　大胃王來了！':''),1.6); }
  function build(p,k){ const T=TOWERS[k]; if(gold<T.cost){ say('金幣不夠',1.2); sfx('bump'); return; } gold-=T.cost; towers.push({k,lv:1,pad:p,x:p.x,y:p.y-6,cd:0,ang:-Math.PI/2,spent:T.cost,fire:0}); sfx('place'); menu=null; }
  function upgrade(tw){ if(tw.lv>=3) return; const cst=upCost(tw.k,tw.lv); if(gold<cst){ say('金幣不夠',1.2); sfx('bump'); return; } gold-=cst; tw.spent+=cst; tw.lv++; sfx('item'); fx.push({x:tw.x,y:tw.y-20,t:0,kind:'up'}); }
  function sell(tw){ const back=Math.round(tw.spent*.7); gold+=back; towers.splice(towers.indexOf(tw),1); pops.push({x:tw.x,y:tw.y-20,txt:'+'+back,col:'#ffd23f',t:0}); sfx('pop'); menu=null; }
  function hurt(e,d,pierce){ const F=FOES[e.f]; const dmg=pierce?d:Math.max(d*.3,d-(F.armor||0)); e.hp-=dmg; e.flash=.08; if(e.hp<=0&&!e.dead){ e.dead=true; const gg=Math.round(F.gold*Math.sqrt(S.hp)); gold+=gg; pops.push({x:e.x,y:e.y-10,txt:'+'+gg,col:'#ffd23f',t:0}); fx.push({x:e.x,y:e.y,t:0,kind:'pop',col:F.col}); sfx('pop'); } }
  // 操作：點空地蓋塔、點塔升級／賣掉；右上角的按鈕加速、下一波
  const btn={speed:{x:W-118,y:8,w:50,h:30},next:{x:W-62,y:8,w:54,h:30}};
  const inB=(b,x,y)=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h;
  function menuItems(){ if(!menu) return []; if(menu.p&&!menu.tw) return TKEYS.map((k,i)=>{ const a=-Math.PI/2+i*Math.PI/2; return {k,x:menu.p.x+Math.cos(a)*48,y:menu.p.y+Math.sin(a)*48,r:20,cost:TOWERS[k].cost}; });
    const tw=menu.tw; return [{k:'up',x:tw.x,y:tw.y-50,r:20,cost:tw.lv<3?upCost(tw.k,tw.lv):null},{k:'sell',x:tw.x,y:tw.y+50,r:18,cost:Math.round(tw.spent*.7)}]; }
  function click(x,y){ if(ended) return;
    if(inB(btn.speed,x,y)){ speed=speed===1?2:1; sfx('click'); return; }
    if(inB(btn.next,x,y)){ if(phase!=='wave'&&wave<S.waves-1){ startWave(); } return; }
    for(const it of menuItems()) if(dist(it.x,it.y,x,y)<it.r+4){ if(it.k==='up') upgrade(menu.tw); else if(it.k==='sell') sell(menu.tw); else build(menu.p,it.k); return; }
    const p=padAt(x,y); if(p){ const tw=towerOn(p); menu=tw?{tw}:{p}; sfx('click'); return; }
    menu=null; }
  const toC=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=(r.width-W*s)/2,oy=(r.height-H*s)/2; return [(e.clientX-r.left-ox)/s,(e.clientY-r.top-oy)/s]; };
  const onDown=e=>{ e.preventDefault&&e.preventDefault(); const [x,y]=toC(e); click(x,y); },onMove=e=>{ hover=toC(e); };
  if(canvas.addEventListener){ canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointermove',onMove); canvas.style.touchAction='none'; }
  function step(dt){
    if(msgT>0) msgT-=dt; for(const p of pops){ p.t+=dt; p.y-=dt*24; } for(const f of fx) f.t+=dt;
    if(phase==='wave'){ if(spawnQ.length){ spawnT-=dt; if(spawnT<=0){ const q=spawnQ.shift(),F=FOES[q.f],hp=Math.round(F.hp*S.hp*(1+wave*.08)); foes.push({id:eid++,f:q.f,hp,max:hp,d:0,x:-99,y:-99,a:0,slowT:0,slowK:0,flash:0}); spawnT=q.gap; } }
      else if(!foes.length){ if(wave>=S.waves-1){ phase='done'; won=true; ended=true; endT=0; sfx('win'); } else { phase='between'; betweenT=9; gold+=20+wave*4; say('守住了！下一波 9 秒後',1.6); } } }
    else if(phase==='between'){ betweenT-=dt; if(betweenT<=0) startWave(); }
    for(const e of foes){ const F=FOES[e.f]; if(e.slowT>0) e.slowT-=dt; if(e.flash>0) e.flash-=dt; e.d+=F.speed*(e.slowT>0?1-e.slowK:1)*dt; const [x,y,a]=B.posAt(e.d); e.x=x; e.y=y; e.a=a;
      if(e.d>=B.total&&!e.dead){ e.dead=true; e.out=true; lives=Math.max(0,lives-(F.lives||1)); sfx('hurt'); fx.push({x:B.end[0],y:B.end[1]-30,t:0,kind:'heart'}); } }
    for(let i=foes.length-1;i>=0;i--) if(foes[i].dead) foes.splice(i,1);
    if(lives<=0&&!ended){ ended=true; endT=0; won=false; sfx('lose'); }
    // 塔：鎖定走最前面、在射程裡的怪物
    for(const tw of towers){ const s=stat(tw.k,tw.lv); tw.cd-=dt; if(tw.fire>0) tw.fire-=dt; let tg=null; for(const e of foes){ if(e.dead) continue; if(dist(e.x,e.y,tw.x,tw.y)<=s.range&&(!tg||e.d>tg.d)) tg=e; }
      if(!tg) continue; tw.ang=Math.atan2(tg.y-(tw.y-26),tg.x-tw.x); if(tw.cd>0) continue; tw.cd=s.rate; tw.fire=.12;
      if(tw.k==='rainbow'){ hurt(tg,s.dmg,true); fx.push({x:tw.x,y:tw.y-34,x2:tg.x,y2:tg.y,t:0,kind:'beam'}); sfx('beep'); }
      else shots.push({k:tw.k,x:tw.x,y:tw.y-30,tg,tx:tg.x,ty:tg.y,dmg:s.dmg,slow:s.slow,splash:s.splash,lv:tw.lv,sp:tw.k==='soda'?240:tw.k==='ice'?300:360,t:0}); }
    for(let i=shots.length-1;i>=0;i--){ const b=shots[i]; b.t+=dt; if(b.tg&&!b.tg.dead&&b.k!=='soda'){ b.tx=b.tg.x; b.ty=b.tg.y; } const dx=b.tx-b.x,dy=b.ty-b.y,d=Math.hypot(dx,dy),mv=b.sp*dt;
      if(d<=mv+4){ if(b.k==='soda'){ for(const e of foes) if(!e.dead&&dist(e.x,e.y,b.tx,b.ty)<b.splash) hurt(e,b.dmg); fx.push({x:b.tx,y:b.ty,t:0,kind:'boom',r:b.splash}); sfx('boom'); }
        else if(b.tg&&!b.tg.dead){ hurt(b.tg,b.dmg); if(b.k==='ice'){ b.tg.slowT=1.6; b.tg.slowK=Math.max(b.tg.slowK||0,b.slow); fx.push({x:b.tx,y:b.ty,t:0,kind:'ice'}); } else fx.push({x:b.tx,y:b.ty,t:0,kind:'hit',col:TOWERS[b.k].col}); }
        shots.splice(i,1); continue; }
      b.x+=dx/d*mv; b.y+=dy/d*mv; }
    for(let i=fx.length-1;i>=0;i--) if(fx[i].t>.6) fx.splice(i,1); for(let i=pops.length-1;i>=0;i--) if(pops[i].t>1) pops.splice(i,1); }
  function update(dt){ t+=dt; if(ended){ endT+=dt; if(endT>1.8) finish(); return; }
    if(env.hit('Space')&&phase!=='wave') startWave(); if(env.hit('KeyF')) speed=speed===1?2:1;
    for(let k=0;k<speed;k++) step(dt); }
  let done=false;
  function finish(){ if(done) return; done=true;
    if(won){ const stars=lives>=18?3:lives>=10?2:1,old=getRec(si); if(old==null||stars>old) try{ localStorage.setItem(recKey(si),String(stars)); }catch(e){}
      env.end({title:'守住糖果城了！',big:'★'.repeat(stars)+'☆'.repeat(3-stars),text:'第 '+(si+1)+' 關「'+S.name+'」剩下 '+lives+' 顆愛心（18 顆以上三星、10 顆以上兩星）。',score:si+1,next:si<29}); }
    else env.end({title:'城堡被攻破了…',big:'撐到第 '+(wave+1)+' / '+S.waves+' 波',text:'冰淇淋塔讓怪物變慢、汽水火箭一次打一群，蓋在轉彎的地方最有效。',score:null}); }

  /* ---------- 畫面 ---------- */
  function draw(){ if(bgc) c.drawImage(bgc,0,0,W,H); else paintMap(c,S.map,t);
    // 空地：小餅乾
    for(const p of B.pads){ if(towerOn(p)) continue; const hv=hover&&dist(hover[0],hover[1],p.x,p.y)<26,on=menu&&menu.p===p; c.fillStyle='rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(p.x,p.y+4,22,9,0,0,7); c.fill();
      c.fillStyle=on?'#ffe58a':hv?'#f5d9a8':'#e8c690'; c.beginPath(); c.ellipse(p.x,p.y,21,10,0,0,7); c.fill(); c.strokeStyle=on?'#ff9a00':'#b8864a'; c.lineWidth=2; c.stroke();
      c.fillStyle='rgba(138,90,42,.6)'; c.font='900 14px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('+',p.x,p.y); }
    // 射程圈
    const showR=(x,y,r)=>{ c.fillStyle='rgba(255,255,255,.15)'; c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=2; c.setLineDash([6,5]); c.beginPath(); c.arc(x,y,r,0,7); c.fill(); c.stroke(); c.setLineDash([]); };
    if(menu&&menu.tw) showR(menu.tw.x,menu.tw.y,stat(menu.tw.k,menu.tw.lv).range);
    if(menu&&menu.p&&hover){ const it=menuItems().find(m=>dist(m.x,m.y,hover[0],hover[1])<m.r+4); if(it) showR(menu.p.x,menu.p.y,TOWERS[it.k].range); }
    // 塔和怪物照上下順序畫
    const objs=[]; for(const tw of towers) objs.push([tw.y,()=>drawTower(c,tw.x,tw.y,tw.k,tw.lv,tw.ang,t,tw.fire)]); for(const e of foes) objs.push([e.y,()=>drawFoe(c,e,t)]); objs.sort((a,b)=>a[0]-b[0]); for(const o of objs) o[1]();
    for(const b of shots){ if(b.k==='candy'){ c.fillStyle=TOWERS.candy.col; c.beginPath(); c.arc(b.x,b.y,4+b.lv,0,7); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(b.x-1,b.y-1,1.6,0,7); c.fill(); }
      else if(b.k==='ice'){ c.save(); c.translate(b.x,b.y); c.rotate(b.t*10); c.fillStyle='#bff0ff'; c.beginPath(); for(let i=0;i<6;i++){ const a=i/6*6.28; c.lineTo(Math.cos(a)*(i%2?3:6),Math.sin(a)*(i%2?3:6)); } c.closePath(); c.fill(); c.restore(); }
      else { const a=Math.atan2(b.ty-b.y,b.tx-b.x); c.save(); c.translate(b.x,b.y); c.rotate(a); c.fillStyle='#fff'; rr(c,-8,-3.5,16,7,3); c.fill(); c.fillStyle='#e23b3b'; c.beginPath(); c.moveTo(8,-3.5); c.lineTo(13,0); c.lineTo(8,3.5); c.fill(); c.fillStyle='rgba(255,160,58,.8)'; c.beginPath(); c.arc(-10,0,3+Math.random()*2,0,7); c.fill(); c.restore(); c.fillStyle='rgba(200,200,220,.4)'; c.beginPath(); c.arc(b.x-Math.cos(a)*16,b.y-Math.sin(a)*16,4,0,7); c.fill(); } }
    for(const f of fx){ const u=f.t/.6;
      if(f.kind==='beam'){ if(f.t<.18){ const cols=['#ff5d5d','#ffb000','#ffe14d','#5fd068','#4fb8ff','#b77bff']; cols.forEach((col,i)=>{ c.strokeStyle=col; c.lineWidth=6-i*.6; c.globalAlpha=1-f.t*4; c.beginPath(); c.moveTo(f.x,f.y-6+i*2); c.lineTo(f.x2,f.y2-6+i*2); c.stroke(); }); c.globalAlpha=1; } }
      else if(f.kind==='boom'){ c.globalAlpha=1-u; c.fillStyle='#ffd23f'; c.beginPath(); c.arc(f.x,f.y,f.r*(.4+u*.6),0,7); c.fill(); c.fillStyle='#ff8a3d'; c.beginPath(); c.arc(f.x,f.y,f.r*(.25+u*.4),0,7); c.fill(); for(let i=0;i<8;i++){ const a=i/8*6.28; c.fillStyle='#fff'; c.beginPath(); c.arc(f.x+Math.cos(a)*f.r*u,f.y+Math.sin(a)*f.r*u,3*(1-u),0,7); c.fill(); } c.globalAlpha=1; }
      else if(f.kind==='pop'){ c.globalAlpha=1-u; for(let i=0;i<8;i++){ const a=i/8*6.28; c.fillStyle=i%2?'#fff':f.col; c.beginPath(); c.arc(f.x+Math.cos(a)*24*u,f.y+Math.sin(a)*24*u,3.5*(1-u)+1,0,7); c.fill(); } c.globalAlpha=1; }
      else if(f.kind==='ice'){ c.globalAlpha=1-u; c.strokeStyle='#bff0ff'; c.lineWidth=2; c.beginPath(); c.arc(f.x,f.y,8+u*14,0,7); c.stroke(); c.globalAlpha=1; }
      else if(f.kind==='hit'){ c.globalAlpha=1-u; c.fillStyle=f.col; c.beginPath(); c.arc(f.x,f.y,4+u*10,0,7); c.fill(); c.globalAlpha=1; }
      else if(f.kind==='heart'){ c.globalAlpha=1-u; c.fillStyle='#ff4d6a'; c.font='900 22px '+TC; c.textAlign='center'; c.fillText('♥ -1',f.x,f.y-u*30); c.globalAlpha=1; }
      else if(f.kind==='up'){ c.globalAlpha=1-u; c.strokeStyle='#ffd23f'; c.lineWidth=3; c.beginPath(); c.arc(f.x,f.y,10+u*30,0,7); c.stroke(); c.globalAlpha=1; } }
    for(const p of pops){ c.globalAlpha=1-p.t; c.font='900 14px '+TC; c.textAlign='center'; c.lineWidth=3; c.strokeStyle='#14122b'; c.strokeText(p.txt,p.x,p.y); c.fillStyle=p.col; c.fillText(p.txt,p.x,p.y); c.globalAlpha=1; }
    // 蓋塔／升級選單
    for(const it of menuItems()){ const ok=it.cost==null?false:gold>=it.cost||it.k==='sell',hv=hover&&dist(hover[0],hover[1],it.x,it.y)<it.r+4;
      c.fillStyle=it.k==='sell'?'#ff8a8a':ok?(hv?'#fff8d8':'#fff'):'#b8b4c8'; c.beginPath(); c.arc(it.x,it.y,it.r+(hv?2:0),0,7); c.fill(); c.strokeStyle='#2a1a26'; c.lineWidth=2.5; c.stroke();
      if(TOWERS[it.k]){ c.save(); c.beginPath(); c.arc(it.x,it.y,it.r,0,7); c.clip(); drawTower(c,it.x,it.y+12,it.k,1,-Math.PI/2,t,0); c.restore(); }
      else { c.fillStyle='#2a1a26'; c.font='900 13px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(it.k==='up'?(it.cost==null?'MAX':'升級'):'賣掉',it.x,it.y); }
      if(it.cost!=null){ c.font='900 11px '+TC; c.textAlign='center'; c.textBaseline='middle'; const tx=(it.k==='sell'?'+':'')+it.cost; const w=c.measureText(tx).width+10; c.fillStyle=ok?'#ffd23f':'#8a8698'; rr(c,it.x-w/2,it.y+it.r-4,w,15,7); c.fill(); c.fillStyle='#14122b'; c.fillText(tx,it.x,it.y+it.r+4); } }
    // 選單說明
    if(menu){ let s=''; if(menu.tw){ const T=TOWERS[menu.tw.k]; s=T.name+' '+menu.tw.lv+' 級：'+T.desc; } else if(hover){ const it=menuItems().find(m=>dist(m.x,m.y,hover[0],hover[1])<m.r+4); if(it) s=TOWERS[it.k].name+'（'+it.cost+'）：'+TOWERS[it.k].desc; else s='選一種塔蓋在這裡'; } else s='選一種塔蓋在這裡';
      c.font='700 13px '+TC; const w=c.measureText(s).width+24; c.fillStyle='rgba(11,10,28,.82)'; rr(c,W/2-w/2,H-34,w,26,13); c.fill(); c.fillStyle='#fff'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(s,W/2,H-21); }
    // 上方資訊列
    c.fillStyle='rgba(11,10,28,.75)'; rr(c,8,8,384,30,15); c.fill(); c.textBaseline='middle'; c.textAlign='left';
    c.fillStyle='#ffd23f'; c.beginPath(); c.arc(26,23,8,0,7); c.fill(); c.fillStyle='#c8920a'; c.font='900 10px '+TC; c.textAlign='center'; c.fillText('$',26,24); c.textAlign='left'; c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText(gold,40,24);
    c.fillStyle='#ff4d6a'; c.font='900 16px '+TC; c.fillText('♥',104,24); c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText(lives,122,24);
    c.fillStyle='#cfd0ff'; c.font='700 13px '+TC; c.fillText('第 '+Math.max(1,wave+1)+' / '+S.waves+' 波　'+S.name,162,24);
    const b1=btn.speed,b2=btn.next; c.fillStyle=speed===2?'#ffd23f':'rgba(11,10,28,.75)'; rr(c,b1.x,b1.y,b1.w,b1.h,12); c.fill(); c.fillStyle=speed===2?'#14122b':'#fff'; c.font='900 13px '+TC; c.textAlign='center'; c.fillText(speed===2?'▶▶':'▶',b1.x+b1.w/2,b1.y+b1.h/2+1);
    const canNext=phase!=='wave'&&wave<S.waves-1; c.fillStyle=canNext?'#5fd068':'rgba(11,10,28,.5)'; rr(c,b2.x,b2.y,b2.w,b2.h,12); c.fill(); c.fillStyle=canNext?'#14122b':'#6b6799'; c.fillText(phase==='prep'?'開始':'下一波',b2.x+b2.w/2,b2.y+b2.h/2+1);
    if(phase==='between'){ c.fillStyle='rgba(11,10,28,.75)'; rr(c,W-200,44,192,24,12); c.fill(); c.fillStyle='#fff'; c.font='700 12px '+TC; c.fillText('下一波 '+Math.ceil(betweenT)+' 秒（提早開始有獎金）',W-104,57); }
    if(phase==='prep'&&!menu){ /* 放在下面，不擋住中間的空地 */ c.fillStyle='rgba(11,10,28,.8)'; rr(c,W/2-220,H-100,440,88,18); c.fill(); c.fillStyle='#ffd23f'; c.font='900 20px '+TC; c.textAlign='center'; c.fillText('第 '+(si+1)+' 關　'+S.name,W/2,H-76); c.fillStyle='#fff'; c.font='700 14px '+TC; c.fillText('點路邊的「+」空地蓋塔，好了按右上角「開始」',W/2,H-50); c.fillStyle='#cfd0ff'; c.font='700 12px '+TC; c.fillText('共 '+S.waves+' 波'+(S.boss?'，最後一波有大胃王':'')+'　金幣 '+gold,W/2,H-28); }
    if(msgT>0&&msg){ c.font='900 20px '+TC; c.textAlign='center'; const w=c.measureText(msg).width+36; c.fillStyle='rgba(180,30,90,.9)'; rr(c,W/2-w/2,64,w,38,16); c.fill(); c.fillStyle='#fff'; c.fillText(msg,W/2,84); }
    if(ended&&endT>.2){ c.textAlign='center'; c.font='900 40px '+TC; c.lineWidth=8; c.strokeStyle='#14122b'; const txt=won?'守住了！':'城堡淪陷…'; c.strokeText(txt,W/2,H/2); c.fillStyle=won?'#ffd23f':'#ff8a8a'; c.fillText(txt,W/2,H/2); } }
  return {update,draw,destroy(){ if(canvas.removeEventListener){ canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('pointermove',onMove); } },
    _dbg:{B,S,towers,foes,click,build,upgrade,startWave,get gold(){return gold;},get lives(){return lives;},get wave(){return wave;},get phase(){return phase;},get ended(){return ended;},get won(){return won;}}};
}

/* ---------- 開始畫面、縮圖 ---------- */
const bgCache={};
function mapImg(mi){ if(!bgCache[mi]) bgCache[mi]=bgCanvas(mi); return bgCache[mi]; }
function stageShow(ctx,w,h,si,t){ const S=STAGES[si],B=buildMap(S.map); ctx.save(); ctx.scale(w/W,h/H); ctx.drawImage(mapImg(S.map),0,0,W,H);
  const picks=B.pads.slice().sort((a,b)=>b.cov-a.cov).slice(0,4); picks.forEach((p,i)=>drawTower(ctx,p.x,p.y-6,TKEYS[i],1+(i%3),-1.2+t,t,0));
  for(let i=0;i<6;i++){ const d=((t*40+i*60)%B.total),[x,y,a]=B.posAt(d); drawFoe(ctx,{f:['bug','ant','jelly','bug','beetle','bug'][i],x,y,a,hp:1,max:1,id:i,slowT:0},t); }
  ctx.fillStyle='rgba(11,10,28,.78)'; rr(ctx,W/2-170,H-60,340,44,18); ctx.fill(); ctx.fillStyle='#fff'; ctx.font='900 20px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(S.waves+' 波'+(S.boss?'・大胃王登場':'')+'・金幣 '+S.gold,W/2,H-38); ctx.restore(); }
function thumb(ctx,w,h,t){ const B=buildMap(0); ctx.save(); ctx.scale(w/W,h/H); ctx.drawImage(mapImg(0),0,0,W,H);
  B.pads.slice().sort((a,b)=>b.cov-a.cov).slice(0,3).forEach((p,i)=>drawTower(ctx,p.x,p.y-6,TKEYS[i],2,t,t,0));
  for(let i=0;i<5;i++){ const d=((t*50+i*70)%B.total),[x,y,a]=B.posAt(d); drawFoe(ctx,{f:['bug','ant','jelly','beetle','bug'][i],x,y,a,hp:1,max:1,id:i,slowT:0},t); }
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 64px '+TC; ctx.lineWidth=10; ctx.strokeStyle='#14122b'; ctx.strokeText('糖果城保衛戰',W/2,H*.5); ctx.fillStyle='#ffd23f'; ctx.fillText('糖果城保衛戰',W/2,H*.5); ctx.restore(); }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).tower={
  name:'糖果城保衛戰',tag:'CANDY DEFENSE',color:'#ff9ec8',
  desc:'貪吃的蛀牙小怪要來偷吃糖果城了！在路邊蓋棒棒糖砲、冰淇淋塔、汽水火箭和彩虹光束擋住牠們。六張地圖共 30 關。',
  goal:'在路邊空地蓋塔，別讓怪物走到城堡。撐過每一波就過關，剩下的愛心越多星星越多。',
  stageGoal:si=>{ const S=STAGES[si]; return S.name+'：共 '+S.waves+' 波'+(S.boss?'，最後一波有大胃王（愛心一次扣 5 顆）':'')+'，起始金幣 '+S.gold+'。打倒怪物拿金幣，用來蓋新塔或升級（最高 3 級）。剩 18 顆愛心以上三星。'; },
  stages:STAGES.map(s=>s.name),stars:STAGES.map((s,i)=>1+Math.floor(i/6)),stageLabel:'選擇關卡',
  stageBest:i=>{ const v=getRec(i); return v==null?'':'★'.repeat(v); },
  stageLocked:i=>i>0&&getRec(i-1)==null,
  help:[['點「+」空地','選一種塔蓋下去'],['點塔','升級（最高 3 級）或賣掉'],['右上角','▶ 加速（F）、開始／下一波（空白鍵）']],
  touchHelp:[['點「+」空地','選一種塔蓋下去'],['點塔','升級或賣掉'],['右上角','加速、開始／下一波']],
  touch:null,
  best:{label:'最遠過到',fmt:v=>'第 '+v+' 關',lower:false},
  stageShow,thumb,create
};
})();
