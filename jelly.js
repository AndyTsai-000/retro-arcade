// 蹦蹦果凍島：橫向跳躍闖關。遊戲裡有一張世界地圖（六個區域、30 關），主角在地圖上走到關卡按空白鍵進去；
// 關卡是用亂數種子拼出來的區塊（斷崖、台階、問號糖果盒、柱子、移動平台、尖刺），每個世界第 5 關是城堡，最後打果凍大王。
(function(){
'use strict';
const W=800,H=500,TS=32,ROWS=15,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PIX='"Press Start 2P","Noto Sans TC",monospace';
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rng(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }

/* ---------- 世界 ---------- */
const WORLDS=[
  {name:'草莓草原',sky:['#7ec8ff','#d8f0ff'],top:'#6fd35a',top2:'#4fae3a',dirt:'#c8864a',dirt2:'#a86a34',far:'#9ad8a0',mid:'#6cc070',accent:'#ff5d6d'},
  {name:'果凍海灘',sky:['#5ec8ff','#fff1c8'],top:'#ffe0a0',top2:'#e8c078',dirt:'#e8b878',dirt2:'#c89858',far:'#7ad8f0',mid:'#3fa8d8',accent:'#ff9a4d'},
  {name:'糖果森林',sky:['#a8e8c8','#f0fff0'],top:'#ff9ec8',top2:'#e87aa8',dirt:'#8a5a3a',dirt2:'#6a4028',far:'#7ac890',mid:'#3f9a5a',accent:'#ffd23f'},
  {name:'冰淇淋雪山',sky:['#9fc8ff','#f4f9ff'],top:'#ffffff',top2:'#d6e8ff',dirt:'#9ab8e0',dirt2:'#7a98c8',far:'#c6dcf5',mid:'#e8f2ff',accent:'#ff7eb6'},
  {name:'巧克力火山',sky:['#3a1a2a','#a84a2a'],top:'#7a4a2a',top2:'#5a3018',dirt:'#4a2a18',dirt2:'#3a1e10',far:'#6a2a2a',mid:'#4a1e1e',accent:'#ff7a2a'},
  {name:'雲端城堡',sky:['#b8a8ff','#ffe0f4'],top:'#fff4ff',top2:'#e8d0f8',dirt:'#c8b0e8',dirt2:'#a890d0',far:'#ffffff',mid:'#e8e0ff',accent:'#ffd23f'}];
const LEVELS=Array.from({length:30},(_,i)=>({i,w:Math.floor(i/5),k:i%5,castle:i%5===4,name:WORLDS[Math.floor(i/5)].name+' '+(i%5===4?'城堡':(i%5+1))}));
const recKey=i=>'arcade.jelly.s'+i,getRec=i=>{ try{ const v=localStorage.getItem(recKey(i)); return v==null?null:+v; }catch(e){ return null; } }; // 值＝收集到的星星金幣（位元）＋8（過關）
const setRec=(i,v)=>{ try{ localStorage.setItem(recKey(i),String(v)); }catch(e){} };
const starsOf=v=>v==null?0:((v&1)+(v>>1&1)+(v>>2&1));

/* ---------- 關卡產生：一塊一塊拼，每塊都照跳得到的距離做 ---------- */
// 格子：0 空、1 地面、2 餅乾磚、3 問號糖果盒、4 用過的盒子、5 尖刺、6 可以從下面穿過的果凍平台、7 糖果柱
const SOLID=v=>v===1||v===2||v===3||v===4||v===7;
function makeLevel(i){ const L=LEVELS[i],r=rng(4421*(i+1)),d=i/29,cols=[],ents=[],coins=[],stars=[],movers=[];
  let gy=12; const col=()=>{ const a=new Array(ROWS).fill(0); cols.push(a); return a; };
  const ground=(h)=>{ const a=col(); for(let y=h;y<ROWS;y++) a[y]=1; return a; };
  const X=()=>cols.length;
  const flat=n=>{ for(let k=0;k<n;k++) ground(gy); };
  const pick=a=>a[Math.floor(r()*a.length)];
  flat(10);
  const target=L.castle?150+L.w*10:110+Math.floor(d*90);
  const chunks=['flat','gap','step','blocks','pillar','enemies','coins','stairs'];
  if(i>=2) chunks.push('platforms','spikes'); if(i>=6) chunks.push('gap','enemies'); if(i>=9) chunks.push('moving'); if(i>=16) chunks.push('moving','spikes','platforms');
  let starPlan=[0,0,0],cp=0;
  while(X()<target){ const kind=pick(chunks),x0=X();
    if(kind==='flat'){ flat(4+Math.floor(r()*5)); if(r()<(i<3?.25:.5)) ents.push({t:'slime',x:(x0+2)*TS,y:(gy-1)*TS}); }
    else if(kind==='gap'){ flat(2); const g=Math.min(i<4?2:i<10?3:4,2+Math.floor(r()*(1+d*2.4))); for(let k=0;k<g;k++) col(); /* 最寬 4 格，跑起來跳得過 */ for(let k=0;k<g+1;k++) coins.push({x:(x0+2+k)*TS+16,y:(gy-3-Math.sin(k/g*Math.PI)*1.5)*TS}); flat(3); }
    else if(kind==='step'){ const ng=clamp(gy+pick([-2,-1,-1,1,1,2]),8,13); flat(2); gy=ng; flat(4+Math.floor(r()*3)); }
    else if(kind==='blocks'){ flat(2); const y=gy-3,n=3+Math.floor(r()*3); for(let k=0;k<n;k++){ const a=ground(gy); a[y]=k===Math.floor(n/2)?3:(r()<.35?3:2); if(a[y]===3) a.item=r()<.3?'fruit':'coin'; }
      if(r()<.6) ents.push({t:'slime',x:(x0+3)*TS,y:(gy-1)*TS}); if(!starPlan[0]&&r()<.6){ starPlan[0]=1; stars.push({x:(x0+2+Math.floor(n/2))*TS+16,y:(y-2.5)*TS,id:0}); } flat(2); }
    else if(kind==='pillar'){ flat(2); const h=2+Math.floor(r()*2),a=ground(gy),b=ground(gy); for(let y=gy-h;y<gy;y++){ a[y]=7; b[y]=7; } a.pillTop=gy-h; flat(2); if(r()<.5) ents.push({t:i>=4&&r()<.5?'spiky':'slime',x:(x0+6)*TS,y:(gy-1)*TS}); flat(2); }
    else if(kind==='enemies'){ flat(8); const n=1+Math.floor(r()*(1+d*2)); for(let k=0;k<n;k++) ents.push({t:i>=7&&r()<.35?'spiky':'slime',x:(x0+2+k*2)*TS,y:(gy-1)*TS}); if(i>=7&&r()<.5) ents.push({t:'bee',x:(x0+5)*TS,y:(gy-4)*TS}); }
    else if(kind==='coins'){ flat(6); for(let k=0;k<5;k++) coins.push({x:(x0+1+k)*TS+16,y:(gy-2)*TS}); }
    else if(kind==='stairs'){ const n=3+Math.floor(r()*2),gap=r()<.5,st=k=>{ const a=ground(gy); for(let y=gy-k;y<gy;y++) a[y]=2; }; for(let k=1;k<=n;k++) st(k); if(gap){ st(n); col(); col(); st(n); } for(let k=n;k>=1;k--) st(k); flat(2); } /* 中間有洞時，頂端兩邊都做兩格寬，衝上去才停得住 */
    else if(kind==='platforms'){ flat(2); const n=2+Math.floor(r()*2); let py=gy-2; /* 兩格寬的果凍平台，中間空 1～2 格 */
      for(let p=0;p<n;p++){ col(); if(r()<.4) col(); const a=col(),b=col(); py=clamp(py+pick([-1,0,1]),gy-3,gy-1); a[py]=6; b[py]=6;
        if(p===n-1&&!starPlan[1]){ starPlan[1]=1; stars.push({x:(X()-1)*TS,y:(py-3)*TS,id:1}); } }
      col(); flat(3); }
    else if(kind==='spikes'){ flat(3); const n=2+Math.floor(r()*2); for(let k=0;k<n;k++){ const a=ground(gy); a[gy-1]=5; } coins.push({x:(x0+3+n/2)*TS,y:(gy-4)*TS}); flat(3); }
    else if(kind==='moving'){ flat(2); const g=6+Math.floor(r()*3); for(let k=0;k<g;k++) col(); movers.push({x:(x0+2)*TS+4,y:(gy-1)*TS,w:3*TS,ax:(x0+2)*TS+4,bx:(x0+2+g)*TS-3*TS-4,sp:60+d*30,dir:1}); /* 從這邊崖邊走到對面崖邊 */
      if(!starPlan[2]){ starPlan[2]=1; stars.push({x:(x0+2+g/2)*TS,y:(gy-4)*TS,id:2}); } flat(3); }
    if(!cp&&X()>target*.5){ cp=X(); flat(3); } }
  // 沒放到的星星金幣：放在比較高、要跳一下才拿得到的地方
  for(let s=0;s<3;s++) if(!starPlan[s]){ let x=Math.floor(target*(.2+s*.3)),top=-1; // 找一欄有地面、上面是空的（不在洞或尖刺上）
    for(;x<cols.length-1;x++){ let ty=-1; for(let y=0;y<ROWS;y++) if(cols[x][y]){ ty=y; break; } if(ty>0&&SOLID(cols[x][ty])&&cols[x][ty-1]===0&&ty>=4){ top=ty; break; } }
    stars.push({x:x*TS+16,y:(top-3.2)*TS,id:s}); }
  let goal,boss=null;
  if(L.castle){ // 城堡：大王房間
    flat(4); const ax=X(); for(let k=0;k<22;k++){ const a=ground(gy); a[gy-8]=k===0||k===21?0:(k<3||k>18?2:0); } boss={x:(ax+14)*TS,y:(gy-1)*TS,ax:(ax+2)*TS,bx:(ax+20)*TS}; const wall=ground(gy); for(let y=0;y<gy;y++) wall[y]=2; goal=(ax+18)*TS; }
  else { flat(6); for(let k=1;k<=4;k++){ const a=ground(gy); for(let y=gy-k;y<gy;y++) a[y]=2; } flat(3); goal=X()*TS; flat(12); }
  return {cols,ents,coins,stars,movers,cp:cp*TS,goal,boss,gyEnd:gy,L,width:cols.length*TS}; }

/* ---------- 畫圖：格子（先畫成小圖存起來） ---------- */
const tileCache={};
function tileImg(w,v,top){ const key=w+'|'+v+'|'+top; if(tileCache[key]) return tileCache[key]; const cv=document.createElement('canvas'); cv.width=cv.height=TS*2; const c=cv.getContext('2d'); c.scale(2,2); paintTile(c,w,v,top); tileCache[key]=cv; return cv; }
function paintTile(c,wi,v,top){ const Wd=WORLDS[wi];
  if(v===1){ c.fillStyle=Wd.dirt; c.fillRect(0,0,TS,TS); c.fillStyle=Wd.dirt2; for(const [x,y,r] of [[7,9,3],[22,20,4],[12,26,2.5],[26,6,2]]){ c.beginPath(); c.arc(x,y,r,0,7); c.fill(); }
    if(top){ c.fillStyle=Wd.top; c.fillRect(0,0,TS,11); c.beginPath(); for(let x=0;x<=TS;x+=8) c.arc(x+4,11,4,0,Math.PI); c.fill(); c.fillStyle=Wd.top2; c.fillRect(0,9,TS,2); c.fillStyle='rgba(255,255,255,.35)'; c.fillRect(0,1,TS,3);
      if(wi===2){ c.fillStyle='#fff'; for(const [x,y] of [[6,4],[18,6],[26,3]]){ c.fillRect(x,y,3,2); } } if(wi===0){ c.fillStyle='#ff5d6d'; c.beginPath(); c.arc(9,3,1.6,0,7); c.arc(24,4,1.6,0,7); c.fill(); } } return; }
  if(v===2){ c.fillStyle='#d99a5a'; rr(c,1,1,TS-2,TS-2,5); c.fill(); c.strokeStyle='#8a5a2a'; c.lineWidth=2; c.stroke(); c.fillStyle='#e8b070'; rr(c,4,4,TS-8,8,3); c.fill(); c.fillStyle='#8a5a2a'; for(const [x,y] of [[9,18],[20,22],[14,26],[24,15]]){ c.beginPath(); c.arc(x,y,2,0,7); c.fill(); } return; }
  if(v===3||v===4){ const used=v===4; c.fillStyle=used?'#b8a080':'#ff7eb6'; rr(c,1,1,TS-2,TS-2,6); c.fill(); c.strokeStyle=used?'#8a7050':'#b8326a'; c.lineWidth=2.4; c.stroke(); if(!used){ c.fillStyle='rgba(255,255,255,.4)'; rr(c,4,4,TS-8,6,3); c.fill(); c.fillStyle='#ffd23f'; c.strokeStyle='#8a3a1a'; c.lineWidth=2; c.font='900 20px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.strokeText('?',TS/2,TS/2+2); c.fillText('?',TS/2,TS/2+2); for(const [x,y] of [[5,5],[TS-5,5],[5,TS-5],[TS-5,TS-5]]){ c.beginPath(); c.arc(x,y,1.6,0,7); c.fill(); } } return; }
  if(v===5){ c.fillStyle='#9aa0b8'; c.fillRect(0,TS-8,TS,8); c.fillStyle='#e8ecf8'; c.strokeStyle='#5a6078'; c.lineWidth=1.5; for(let k=0;k<4;k++){ c.beginPath(); c.moveTo(k*8,TS-8); c.lineTo(k*8+4,TS-26); c.lineTo(k*8+8,TS-8); c.closePath(); c.fill(); c.stroke(); } return; }
  if(v===6){ const col=WORLDS[wi].accent; c.fillStyle=col; rr(c,0,2,TS,12,6); c.fill(); c.fillStyle='rgba(255,255,255,.5)'; rr(c,3,4,TS-6,4,2); c.fill(); c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=1.5; rr(c,0,2,TS,12,6); c.stroke(); return; }
  if(v===7){ const g=c.createLinearGradient(0,0,TS,0); g.addColorStop(0,'#ff8ab8'); g.addColorStop(.4,'#fff0f6'); g.addColorStop(1,'#e8508a'); c.fillStyle=g; c.fillRect(3,0,TS-6,TS); c.strokeStyle='#e8508a'; c.lineWidth=4; for(let y=-TS;y<TS*2;y+=12){ c.beginPath(); c.moveTo(3,y); c.lineTo(TS-3,y+10); c.stroke(); } c.strokeStyle='#8a2a5a'; c.lineWidth=1.5; c.strokeRect(3,0,TS-6,TS); return; } }

/* ---------- 背景：遠山、雲、近景，每個世界一種 ---------- */
function backdrop(c,wi,cam,t){ const Wd=WORLDS[wi],g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,Wd.sky[0]); g.addColorStop(1,Wd.sky[1]); c.fillStyle=g; c.fillRect(0,0,W,H);
  const par=(k,step,fn)=>{ const off=(cam*k)%step; for(let x=-off-step;x<W+step;x+=step){ fn(x,Math.floor((cam*k+x)/step)); } };
  if(wi===4){ c.fillStyle='rgba(255,140,60,.25)'; c.beginPath(); c.arc(W*.7,H*.95,260,0,7); c.fill(); }
  if(wi===0||wi===1||wi===2||wi===5){ c.fillStyle='rgba(255,250,210,.9)'; c.beginPath(); c.arc(W*.82,90,34,0,7); c.fill(); c.fillStyle='rgba(255,250,210,.25)'; c.beginPath(); c.arc(W*.82,90,56,0,7); c.fill(); }
  // 雲
  par(.15,260,(x,n)=>{ const y=60+(n*37%3)*30; c.fillStyle=wi===4?'rgba(80,40,40,.5)':'rgba(255,255,255,.85)'; for(const [dx,dy,r] of [[0,0,22],[22,-10,18],[42,0,22],[20,8,18]]){ c.beginPath(); c.arc(x+dx,y+dy,r,0,7); c.fill(); } });
  // 遠景
  par(.25,320,(x,n)=>{ c.fillStyle=Wd.far;
    if(wi===1){ c.fillRect(x,300,320,200); c.fillStyle='rgba(255,255,255,.35)'; for(let k=0;k<4;k++) c.fillRect(x+((t*20+k*80)%320),320+k*14,40,3); }
    else if(wi===3){ c.beginPath(); c.moveTo(x,360); c.lineTo(x+120,170+(n%2)*40); c.lineTo(x+240,360); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.moveTo(x+80,220+(n%2)*30); c.lineTo(x+120,170+(n%2)*40); c.lineTo(x+160,220+(n%2)*30); c.fill(); }
    else if(wi===4){ c.beginPath(); c.moveTo(x,380); c.lineTo(x+110,190); c.lineTo(x+150,190); c.lineTo(x+260,380); c.fill(); c.fillStyle='rgba(255,120,40,.8)'; c.beginPath(); c.moveTo(x+110,190); c.lineTo(x+150,190); c.lineTo(x+140,220); c.lineTo(x+120,220); c.fill(); }
    else if(wi===5){ c.fillStyle='rgba(255,255,255,.9)'; for(const [dx,dy,r] of [[0,0,40],[40,-20,34],[80,0,40]]){ c.beginPath(); c.arc(x+dx+60,330+dy,r,0,7); c.fill(); } c.fillStyle='#e8d8ff'; if(n%3===0){ c.fillRect(x+90,230,40,80); c.beginPath(); c.moveTo(x+84,230); c.lineTo(x+110,196); c.lineTo(x+136,230); c.fill(); } }
    else { c.beginPath(); c.ellipse(x+160,380,190,110+(n%2)*30,0,Math.PI,0); c.fill(); } });
  // 中景
  par(.45,230,(x,n)=>{ c.fillStyle=Wd.mid;
    if(wi===0){ c.fillStyle='#5a3a2a'; c.fillRect(x+60,320,10,60); c.fillStyle=Wd.mid; c.beginPath(); c.arc(x+65,310,30,0,7); c.fill(); c.fillStyle='#ff5d6d'; for(const [dx,dy] of [[-12,-6],[10,4],[0,-18]]){ c.beginPath(); c.arc(x+65+dx,310+dy,4,0,7); c.fill(); } }
    else if(wi===1){ c.strokeStyle='#8a5a3a'; c.lineWidth=7; c.beginPath(); c.moveTo(x+80,400); c.quadraticCurveTo(x+90,330,x+70,280); c.stroke(); c.fillStyle='#3fa05a'; for(let k=0;k<5;k++){ const a=k/5*6.28+Math.sin(t+n)*.1; c.beginPath(); c.ellipse(x+70+Math.cos(a)*24,280+Math.sin(a)*9,26,7,a,0,7); c.fill(); } }
    else if(wi===2){ c.fillStyle='#fff'; c.fillRect(x+70,290,8,100); c.fillStyle=['#ff5d8f','#7a5cff','#3ddbd9','#ffb000'][n&3]; c.beginPath(); c.arc(x+74,280,30,0,7); c.fill(); c.strokeStyle='rgba(255,255,255,.8)'; c.lineWidth=4; c.beginPath(); for(let a=0;a<12;a+=.3) c.lineTo(x+74+Math.cos(a+t*.5)*30*a/12,280+Math.sin(a+t*.5)*30*a/12); c.stroke(); }
    else if(wi===3){ c.fillStyle='#fff'; c.beginPath(); c.arc(x+80,360,16,0,7); c.fill(); c.beginPath(); c.arc(x+80,334,11,0,7); c.fill(); c.fillStyle='#14122b'; c.beginPath(); c.arc(x+76,332,1.6,0,7); c.arc(x+84,332,1.6,0,7); c.fill(); c.fillStyle='#ff8a3d'; c.beginPath(); c.moveTo(x+80,335); c.lineTo(x+90,337); c.lineTo(x+80,339); c.fill(); }
    else if(wi===4){ c.fillStyle='rgba(255,120,40,'+(.5+.3*Math.sin(t*3+n))+')'; c.beginPath(); c.arc(x+100,420-((t*30+n*40)%120),3,0,7); c.fill(); }
    else { c.fillStyle='rgba(255,255,255,.8)'; for(const [dx,dy,r] of [[0,0,18],[18,-8,14],[34,0,18]]){ c.beginPath(); c.arc(x+60+dx,380+dy,r,0,7); c.fill(); } } });
  if(wi===3){ c.fillStyle='rgba(255,255,255,.85)'; for(let k=0;k<40;k++){ const x=((k*97-cam*.6)%W+W)%W+Math.sin(t+k)*8,y=(t*30+k*53)%H; c.beginPath(); c.arc(x,y,1.5+k%3,0,7); c.fill(); } } }

/* ---------- 人物與怪物 ---------- */
function hero(c,x,y,o){ const RH=window.__RHY; if(!RH){ c.fillStyle='#ff7eb6'; c.beginPath(); c.arc(x,y-14,14,0,7); c.fill(); return; }
  const L=o.L||{},big=o.big,s=big?2.05:1.6,ph=o.run*12,air=o.air;
  let pose={legL:Math.sin(ph)*.75,legR:-Math.sin(ph)*.75,armL:.4-Math.sin(ph)*.7,armR:.4+Math.sin(ph)*.7,bob:Math.abs(Math.sin(ph))*1.5,mouth:'w'};
  if(!o.moving&&!air) pose={legL:-.08,legR:.08,armL:.3,armR:.3,bob:Math.sin(o.t*3)*.6,mouth:'w'};
  if(air) pose={legL:-.7,legR:.45,armL:2.5,armR:1.3,bob:0,mouth:'open'};
  if(o.hurt) pose.mouth='o';
  c.save(); if(o.face<0){ c.translate(x,0); c.scale(-1,1); c.translate(-x,0); }
  RH.drawChibi(c,x,y,s,Object.assign({t:o.t,face:1,body:L.color||'#ff5d6d',pants:'#3a5ad8',shoe:'#ffd23f',hairStyle:L.hair||'girl',acc:L.acc||'bow',capCol:L.color||'#ff5d6d'},pose));
  if(big){ c.fillStyle='rgba(255,255,255,.7)'; const k=(o.t*4)%1; c.beginPath(); c.arc(x+12,y-60+k*10,1.8,0,7); c.fill(); }
  c.restore(); }
function foe(c,e,t){ const x=e.x,y=e.y,face=e.vx<0?-1:1; c.save(); c.translate(x,y);
  if(e.dead){ c.scale(1,.3); }
  const eyes=(ex,ey,r,mad)=>{ for(const k of [-1,1]){ c.fillStyle='#fff'; c.beginPath(); c.arc(ex+k*r*1.6+face*1.5,ey,r+1,0,7); c.fill(); c.fillStyle='#2a1a2a'; c.beginPath(); c.arc(ex+k*r*1.6+face*2.4,ey+.6,r*.75,0,7); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(ex+k*r*1.6+face*2.8,ey-.8,r*.28,0,7); c.fill(); }
    if(mad){ c.strokeStyle='#2a1a26'; c.lineWidth=2; for(const k of [-1,1]){ c.beginPath(); c.moveTo(ex+k*r*2.6,ey-r-3); c.lineTo(ex+k*r*.6,ey-r-1); c.stroke(); } } };
  if(e.t==='slime'){ const sq=Math.abs(Math.sin(t*8+e.x*.05))*2; c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0,0,14,4,0,0,7); c.fill();
    c.fillStyle='#5fd068'; c.beginPath(); c.moveTo(-15,0); c.quadraticCurveTo(-16+sq,-22-sq,0,-22-sq); c.quadraticCurveTo(16-sq,-22-sq,15,0); c.closePath(); c.fill(); c.strokeStyle='#2a7a3a'; c.lineWidth=2; c.stroke();
    c.fillStyle='rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-6,-15,4,2.5,-.5,0,7); c.fill(); eyes(0,-11,2.6); c.fillStyle='rgba(255,120,150,.6)'; c.beginPath(); c.ellipse(-8,-6,2.2,1.2,0,0,7); c.ellipse(8,-6,2.2,1.2,0,0,7); c.fill(); }
  else if(e.t==='spiky'){ c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0,0,14,4,0,0,7); c.fill(); c.fillStyle='#8a4a2a'; c.beginPath(); for(let k=0;k<14;k++){ const a=k/14*6.28,rad=k%2?13:19; c.lineTo(Math.cos(a)*rad,-14+Math.sin(a)*rad); } c.closePath(); c.fill(); c.strokeStyle='#4a2010'; c.lineWidth=1.6; c.stroke();
    c.fillStyle='#c8864a'; c.beginPath(); c.arc(0,-13,11,0,7); c.fill(); eyes(0,-14,2.4,true); const lg=Math.sin(t*14+e.x)*2; c.fillStyle='#4a2010'; c.fillRect(-7+lg,-3,5,4); c.fillRect(3-lg,-3,5,4); }
  else if(e.t==='bee'){ const fl=Math.sin(t*30)*4; c.fillStyle='rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(-4,-22+fl*.2,8,5+fl*.3,-.4,0,7); c.ellipse(5,-22-fl*.2,8,5-fl*.3,.4,0,7); c.fill();
    c.fillStyle='#ffd23f'; c.beginPath(); c.ellipse(0,-12,14,11,0,0,7); c.fill(); c.strokeStyle='#2a1a26'; c.lineWidth=1.6; c.stroke(); c.fillStyle='#2a1a26'; c.fillRect(-4,-22,4,20); c.fillRect(5,-21,3,18); c.beginPath(); c.moveTo(-face*14,-12); c.lineTo(-face*20,-10); c.lineTo(-face*14,-8); c.fill(); eyes(face*6,-14,2.2); }
  c.restore(); }
function boss(c,b,t){ const s=1+(b.hurt>0?Math.sin(t*40)*.06:0),face=b.vx<0?-1:1; if(b.hurt>0&&Math.floor(t*14)%2) return; c.save(); c.translate(b.x,b.y); c.scale(s,s);
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0,0,46,10,0,0,7); c.fill(); const sq=b.vy===0?Math.abs(Math.sin(t*5))*4:-6;
  c.fillStyle='#b77bff'; c.beginPath(); c.moveTo(-48,0); c.quadraticCurveTo(-50+sq,-70-sq,0,-72-sq); c.quadraticCurveTo(50-sq,-70-sq,48,0); c.closePath(); c.fill(); c.strokeStyle='#5a2a9a'; c.lineWidth=3; c.stroke();
  c.fillStyle='rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-20,-50,10,6,-.5,0,7); c.fill();
  c.fillStyle='#ffd23f'; c.beginPath(); c.moveTo(-24,-66-sq); c.lineTo(-20,-90-sq); c.lineTo(-8,-74-sq); c.lineTo(0,-94-sq); c.lineTo(8,-74-sq); c.lineTo(20,-90-sq); c.lineTo(24,-66-sq); c.closePath(); c.fill(); c.strokeStyle='#8a5a10'; c.lineWidth=2; c.stroke();
  for(const k of [-1,1]){ c.fillStyle='#fff'; c.beginPath(); c.arc(k*14+face*3,-38,8,0,7); c.fill(); c.fillStyle='#2a1a2a'; c.beginPath(); c.arc(k*14+face*5,-37,5.5,0,7); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(k*14+face*6,-39,2,0,7); c.fill(); c.strokeStyle='#2a1a26'; c.lineWidth=3; c.beginPath(); c.moveTo(k*24,-52); c.lineTo(k*6,-47); c.stroke(); }
  c.fillStyle='#5a2a9a'; c.beginPath(); c.moveTo(-12,-18); c.quadraticCurveTo(0,-8,12,-18); c.closePath(); c.fill(); c.restore(); }
function coin(c,x,y,t,big){ const w=Math.abs(Math.cos(t*4+x*.02)),r=big?14:8; c.save(); c.translate(x,y); c.scale(Math.max(.15,w),1);
  c.fillStyle=big?'#ffb000':'#ffd23f'; c.beginPath(); c.arc(0,0,r,0,7); c.fill(); c.strokeStyle='#b8800a'; c.lineWidth=2; c.stroke(); c.fillStyle='rgba(255,255,255,.6)';
  if(big){ c.beginPath(); for(let k=0;k<10;k++){ const rad=k%2?4:9,a=k/10*6.28-Math.PI/2; c.lineTo(Math.cos(a)*rad,Math.sin(a)*rad); } c.closePath(); c.fillStyle='#fff6c0'; c.fill(); } else { c.fillRect(-2,-5,3,10); } c.restore(); }
function flagPole(c,x,yb,t,up){ c.fillStyle='#e8e8f8'; c.fillRect(x-3,yb-280,6,280); c.fillStyle='#ffd23f'; c.beginPath(); c.arc(x,yb-284,8,0,7); c.fill(); const fy=yb-270+(up||0); c.fillStyle='#ff5d8f'; c.beginPath(); c.moveTo(x+3,fy); c.lineTo(x+52+Math.sin(t*6)*3,fy+14); c.lineTo(x+3,fy+28); c.closePath(); c.fill(); c.fillStyle='#fff'; c.font='900 14px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('★',x+22,fy+14); }
function miniCastle(c,x,yb,dark){ c.fillStyle=dark?'#6a5a8a':'#ffe0ee'; c.fillRect(x,yb-90,120,90); c.fillStyle=dark?'#4a3a6a':'#ff9ec8'; for(let k=0;k<5;k++) c.fillRect(x+k*26,yb-104,16,14); c.fillStyle='#5a3a2a'; rr(c,x+44,yb-50,32,50,14); c.fill(); c.fillStyle=dark?'#ffd23f':'#5ec8ff'; rr(c,x+14,yb-70,16,20,8); c.fill(); rr(c,x+90,yb-70,16,20,8); c.fill(); }

/* ---------- 世界地圖 ---------- */
const MAPW=2400;
const NODES=LEVELS.map(l=>{ const bx=l.w*400+70,k=l.k; return {x:bx+k*66+(k%2)*10,y:[330,250,330,230,300][k]+(l.w%2?-30:0)}; });
function worldMap(c,cam,t,cur,avatar,L){ // 六個區域連成一條路
  for(let w=0;w<6;w++){ const x0=w*400-cam,Wd=WORLDS[w]; if(x0>W||x0+400<0) continue; const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,Wd.sky[0]); g.addColorStop(1,Wd.sky[1]); c.fillStyle=g; c.fillRect(x0,0,401,H);
    c.fillStyle=Wd.top; c.beginPath(); c.moveTo(x0,H); c.lineTo(x0,180); for(let x=0;x<=400;x+=20) c.lineTo(x0+x,170+Math.sin((x+w*130)/60)*18); c.lineTo(x0+400,H); c.fill();
    c.fillStyle=Wd.top2; c.beginPath(); c.moveTo(x0,H); c.lineTo(x0,420); for(let x=0;x<=400;x+=20) c.lineTo(x0+x,420+Math.sin((x+w*90)/40)*10); c.lineTo(x0+400,H); c.fill();
    // 區域裝飾
    const r=rng(w*77+3); for(let k=0;k<10;k++){ const x=x0+20+r()*360,y=200+r()*220; if(NODES.some(n=>Math.hypot(n.x-cam-x,n.y-y)<40)) continue;
      if(w===1){ c.fillStyle='#5ec8ff'; c.beginPath(); c.ellipse(x,y,26,10,0,0,7); c.fill(); }
      else if(w===3){ c.fillStyle='#fff'; c.beginPath(); c.moveTo(x-20,y+10); c.lineTo(x,y-24); c.lineTo(x+20,y+10); c.fill(); }
      else if(w===4){ c.fillStyle='#5a2a1a'; c.beginPath(); c.moveTo(x-22,y+12); c.lineTo(x-6,y-20); c.lineTo(x+6,y-20); c.lineTo(x+22,y+12); c.fill(); c.fillStyle='#ff7a2a'; c.fillRect(x-6,y-22,12,5); }
      else if(w===5){ c.fillStyle='#fff'; for(const [dx,r2] of [[-10,10],[0,13],[11,10]]){ c.beginPath(); c.arc(x+dx,y,r2,0,7); c.fill(); } }
      else if(w===2){ c.fillStyle='#fff'; c.fillRect(x-2,y-20,4,20); c.fillStyle=['#ff5d8f','#7a5cff','#3ddbd9'][k%3]; c.beginPath(); c.arc(x,y-26,10,0,7); c.fill(); }
      else { c.fillStyle='#4fae3a'; c.beginPath(); c.arc(x,y-10,12,0,7); c.fill(); c.fillStyle='#ff5d6d'; c.beginPath(); c.arc(x-4,y-12,2.4,0,7); c.fill(); } }
    c.fillStyle='rgba(11,10,28,.6)'; rr(c,x0+130,24,140,30,15); c.fill(); c.fillStyle='#fff'; c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(Wd.name,x0+200,40); }
  // 路
  c.strokeStyle='rgba(255,255,255,.9)'; c.lineWidth=8; c.setLineDash([2,12]); c.lineCap='round'; c.beginPath(); NODES.forEach((n,i)=>i?c.lineTo(n.x-cam,n.y):c.moveTo(n.x-cam,n.y)); c.stroke(); c.setLineDash([]);
  NODES.forEach((n,i)=>{ const x=n.x-cam; if(x<-40||x>W+40) return; const rec=getRec(i),open=i===0||getRec(i-1)!=null,cl=rec!=null&&rec>=8,castle=LEVELS[i].castle;
    c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x,n.y+6,18,6,0,0,7); c.fill();
    if(castle){ c.fillStyle=open?'#8a6ac8':'#8a8698'; c.fillRect(x-14,n.y-26,28,26); for(let k=0;k<3;k++) c.fillRect(x-14+k*11,n.y-32,6,6); c.fillStyle='#3a2a2a'; rr(c,x-5,n.y-14,10,14,5); c.fill(); }
    else { c.fillStyle=!open?'#8a8698':cl?'#ffd23f':'#ff5d8f'; c.beginPath(); c.arc(x,n.y,15,0,7); c.fill(); c.strokeStyle='#fff'; c.lineWidth=3; c.stroke(); c.fillStyle='#fff'; c.font='900 13px '+PIX; c.textAlign='center'; c.textBaseline='middle'; c.fillText(open?String(LEVELS[i].k+1):'',x,n.y+1); }
    if(!open){ c.fillStyle='#4a4660'; rr(c,x-6,n.y-4,12,10,2); c.fill(); c.strokeStyle='#4a4660'; c.lineWidth=2.5; c.beginPath(); c.arc(x,n.y-5,4,Math.PI,0); c.stroke(); }
    if(cl){ const st=starsOf(rec); for(let k=0;k<3;k++){ c.fillStyle=k<st?'#ffd23f':'rgba(255,255,255,.4)'; c.font='900 11px '+TC; c.fillText('★',x-12+k*12,n.y+26); } } });
  // 主角站在節點上
  hero(c,avatar.x-cam,avatar.y-10,{t,L,run:avatar.moving?t:0,moving:avatar.moving,face:avatar.face,air:false,big:false});
  const lv=LEVELS[cur],rec=getRec(cur); c.fillStyle='rgba(11,10,28,.82)'; rr(c,W/2-210,H-74,420,60,18); c.fill(); c.fillStyle='#ffd23f'; c.font='900 20px '+TC; c.textAlign='center'; c.fillText('第 '+(cur+1)+' 關　'+lv.name,W/2,H-52);
  c.fillStyle='#fff'; c.font='700 13px '+TC; c.fillText('← → 選關卡　空白鍵進入'+(rec!=null&&rec>=8?'　星星金幣 '+starsOf(rec)+' / 3':''),W/2,H-28); }

/* ---------- 遊戲 ---------- */
function create(env,opts){
  const {ctx:c}=env.canvas2d(W,H),L=opts.look||{},sfx=n=>env.sfx(n);
  let mode='map',cur=clamp(opts.stage|0,0,29),t=0,lives=5,totalCoins=0,ended=false,endT=0,mapCam=0,avatar={x:NODES[cur].x,y:NODES[cur].y,face:1,moving:false,target:cur};
  let lv=null,P=null,cam=0,ents=[],coins=[],stars=[],movers=[],items=[],fx=[],gotStars=0,cpOn=false,clearT=0,deathT=0,bossObj=null,coinsLv=0,msg='',msgT=0,introT=0;
  const unlocked=i=>i===0||getRec(i-1)!=null;
  function enter(i){ lv=makeLevel(i); ents=lv.ents.map(e=>Object.assign({vx:-40,vy:0,dead:0,y0:e.y,home:e.x},e)); coins=lv.coins.map(o=>Object.assign({},o)); stars=lv.stars.map(o=>Object.assign({},o)); movers=lv.movers.map(o=>Object.assign({},o));
    items=[]; fx=[]; gotStars=0; cpOn=false; coinsLv=0; clearT=0; deathT=0; bossObj=lv.boss?{x:lv.boss.x,y:lv.boss.y,vx:-90,vy:0,hp:3,hurt:0,ax:lv.boss.ax,bx:lv.boss.bx,jumpT:1.5,dead:0}:null; spawn(); mode='play'; introT=1.6; sfx('go'); }
  function spawn(){ const sx=cpOn?lv.cp+TS:6*TS; /* 手機左下角有按鈕，起點往右一點 */ let gy=ROWS; const ci=Math.floor(sx/TS); for(let y=0;y<ROWS;y++) if(lv.cols[ci]&&SOLID(lv.cols[ci][y])){ gy=y; break; }
    P={x:sx,y:gy*TS,vx:0,vy:0,on:true,face:1,big:false,inv:0,run:0,coyote:0,buf:0,jumping:false,dead:false,goal:false}; cam=clamp(P.x-W*.35,0,lv.width-W); }
  const tileAt=(cx,cy)=>{ if(cx<0) return 1; if(cy<0) return 0; if(cy>=ROWS) return 0; const col=lv.cols[cx]; return col?col[cy]:0; };
  const hb=()=>{ const h=P.big?40:28; return {x:P.x-9,y:P.y-h,w:18,h}; };
  function hurt(){ if(P.inv>0||P.dead||P.goal) return; if(P.big){ P.big=false; P.inv=1.6; sfx('hurt'); return; } die(); }
  function die(){ if(P.dead) return; P.dead=true; P.vy=-480; P.vx=0; deathT=0; sfx('die'); }
  function bump(cx,cy){ const v=tileAt(cx,cy); if(v===3){ lv.cols[cx][cy]=4; const it=lv.cols[cx].item||'coin'; fx.push({t:0,kind:'bump',cx,cy});
      if(it==='fruit'&&!P.big) items.push({x:cx*TS+16,y:cy*TS,vx:70,vy:-120,t:0}); else { coinsLv++; totalCoins++; fx.push({t:0,kind:'coin',x:cx*TS+16,y:cy*TS-10}); sfx('item'); } }
    else if(v===2){ fx.push({t:0,kind:'bump',cx,cy}); sfx('bump'); }
    for(const e of ents) if(!e.dead&&Math.abs(e.x-(cx*TS+16))<20&&Math.abs(e.y-cy*TS)<6){ e.dead=.01; sfx('pop'); } }
  function move(dt){ const K=env.keys,left=K.ArrowLeft||K.KeyA,right=K.ArrowRight||K.KeyD,jumpHeld=K.Space||K.ArrowUp||K.KeyW||K.KeyZ||K.KeyJ;
    const jumpHit=env.hit('Space')||env.hit('ArrowUp')||env.hit('KeyW')||env.hit('KeyZ')||env.hit('KeyJ');
    if(P.dead){ P.vy+=1500*dt; P.y+=P.vy*dt; deathT+=dt; if(deathT>1.8){ lives--; if(lives<=0){ gameOver(); return; } spawn(); } return; }
    if(P.goal){ clearT+=dt; if(clearT<1.2){ P.vx=0; } else { P.vx=120; P.face=1; } }
    else { const acc=P.on?1400:900,max=200; if(left&&!right){ P.vx=Math.max(-max,P.vx-acc*dt); P.face=-1; } else if(right&&!left){ P.vx=Math.min(max,P.vx+acc*dt); P.face=1; } else { const fr=(P.on?1600:300)*dt; P.vx=Math.abs(P.vx)<=fr?0:P.vx-Math.sign(P.vx)*fr; }
      if(jumpHit) P.buf=.12; else P.buf-=dt; if(P.on) P.coyote=.1; else P.coyote-=dt;
      if(P.buf>0&&P.coyote>0){ P.vy=-560; P.on=false; P.coyote=0; P.buf=0; P.jumping=true; sfx('spring'); }
      if(P.jumping&&!jumpHeld&&P.vy<-340) P.vy=-340; } // 早放開跳比較低
    P.vy=Math.min(760,P.vy+(P.vy<0&&jumpHeld?1250:1700)*dt); if(P.vy>=0) P.jumping=false;
    if(Math.abs(P.vx)>10&&P.on) P.run+=dt; if(P.inv>0) P.inv-=dt;
    // 橫向
    let b=hb(); P.x+=P.vx*dt; b=hb(); const c0=Math.floor(b.y/TS),c1=Math.floor((b.y+b.h-1)/TS);
    for(let cy=c0;cy<=c1;cy++){ if(P.vx>0){ const cx=Math.floor((b.x+b.w)/TS); if(SOLID(tileAt(cx,cy))){ P.x=cx*TS-b.w-.01+9; P.vx=0; } } else if(P.vx<0){ const cx=Math.floor(b.x/TS); if(SOLID(tileAt(cx,cy))){ P.x=(cx+1)*TS+9.01; P.vx=0; } } }
    if(lv.boss&&!P.goal) P.x=Math.min(P.x,lv.width-TS*1.5);
    // 縱向
    const wasBottom=P.y; P.y+=P.vy*dt; b=hb(); P.on=false; const x0=Math.floor(b.x/TS),x1=Math.floor((b.x+b.w-1)/TS);
    if(P.vy>=0){ const cy=Math.floor(P.y/TS); for(let cx=x0;cx<=x1;cx++){ const v=tileAt(cx,cy); if(SOLID(v)||(v===6&&wasBottom<=cy*TS+6)){ P.y=cy*TS; P.vy=0; P.on=true; break; } } }
    else { const cy=Math.floor(b.y/TS); for(let cx=x0;cx<=x1;cx++){ if(SOLID(tileAt(cx,cy))){ P.y=(cy+1)*TS+b.h; P.vy=0; const mx=Math.floor(P.x/TS); bump(SOLID(tileAt(mx,cy))?mx:cx,cy); sfx('bump'); break; } } }
    // 移動平台
    for(const m of movers){ if(P.vy>=0&&P.x>m.x-6&&P.x<m.x+m.w+6&&wasBottom<=m.y+6&&P.y>=m.y-1){ P.y=m.y; P.vy=0; P.on=true; P.x+=m.dir*m.sp*dt; } }
    // 尖刺
    { const b2=hb(); for(let cx=Math.floor(b2.x/TS);cx<=Math.floor((b2.x+b2.w-1)/TS);cx++) for(let cy=Math.floor((b2.y+4)/TS);cy<=Math.floor((b2.y+b2.h-1)/TS);cy++) if(tileAt(cx,cy)===5&&P.y>cy*TS+14) hurt(); }
    if(P.y>ROWS*TS+60) die();
    if(P.x<9) P.x=9; }
  function gameOver(){ ended=true; endT=0; mode='over'; sfx('lose'); }
  function update(dt){ t+=dt; if(msgT>0) msgT-=dt; for(const f of fx) f.t+=dt; fx=fx.filter(f=>f.t<.8);
    if(ended){ endT+=dt; if(endT>1.6&&mode==='over') finish(); return; }
    if(mode==='map'){ const goal=NODES[avatar.target]; const dx=goal.x-avatar.x,dy=goal.y-avatar.y,d=Math.hypot(dx,dy);
      if(d>2){ const sp=260*dt; avatar.x+=dx/d*Math.min(sp,d); avatar.y+=dy/d*Math.min(sp,d); avatar.moving=true; avatar.face=dx<0?-1:1; }
      else { avatar.moving=false; avatar.x=goal.x; avatar.y=goal.y; cur=avatar.target;
        if((env.hit('ArrowRight')||env.hit('KeyD'))&&cur<29&&unlocked(cur+1)){ avatar.target=cur+1; sfx('click'); }
        else if((env.hit('ArrowRight')||env.hit('KeyD'))&&cur<29){ msg='先過這一關才能往前走'; msgT=1.4; sfx('bump'); }
        if((env.hit('ArrowLeft')||env.hit('KeyA'))&&cur>0){ avatar.target=cur-1; sfx('click'); }
        if(env.hit('Space')||env.hit('Enter')||env.hit('KeyJ')||env.hit('ArrowUp')) enter(cur); }
      mapCam+=(clamp(avatar.x-W/2,0,MAPW-W)-mapCam)*Math.min(1,dt*5); return; }
    if(mode==='play'){ if(introT>0){ introT-=dt; return; } move(dt); if(mode!=='play') return;
      cam+=(clamp(P.x-W*.38,0,lv.width-W)-cam)*Math.min(1,dt*8);
      for(const m of movers){ m.x+=m.dir*m.sp*dt; if(m.x>m.bx){ m.x=m.bx; m.dir=-1; } if(m.x<m.ax){ m.x=m.ax; m.dir=1; } }
      // 怪物
      for(const e of ents){ if(e.dead){ e.dead+=dt; continue; } if(Math.abs(e.x-P.x)>W) continue;
        if(e.t==='bee'){ e.x+=e.vx*dt*.8; if(Math.abs(e.x-e.home)>90) e.vx=-e.vx; e.y=e.y0+Math.sin(t*2.4+e.home)*28; }
        else { e.vy=Math.min(700,e.vy+1500*dt); const nx=e.x+e.vx*dt,cx=Math.floor((nx+(e.vx>0?12:-12))/TS),cy=Math.floor((e.y-8)/TS),fy=Math.floor((e.y+2)/TS);
          if(SOLID(tileAt(cx,cy))||tileAt(cx,cy)===5||!SOLID(tileAt(cx,fy))&&tileAt(cx,fy)!==6&&e.vy===0) e.vx=-e.vx; else e.x=nx;
          e.y+=e.vy*dt; const gy=Math.floor(e.y/TS); if(SOLID(tileAt(Math.floor(e.x/TS),gy))||tileAt(Math.floor(e.x/TS),gy)===6){ e.y=gy*TS; e.vy=0; } if(e.y>ROWS*TS+40) e.dead=1; }
        if(P.dead||P.goal) continue; const b=hb(),ex=e.x-13,ey=e.y-(e.t==='bee'?26:24),ew=26,eh=e.t==='bee'?22:24;
        if(b.x<ex+ew&&b.x+b.w>ex&&b.y<ey+eh&&b.y+b.h>ey){ if(e.t!=='spiky'&&P.vy>60&&P.y-ey<16){ e.dead=.01; P.vy=(env.keys.Space||env.keys.ArrowUp||env.keys.KeyW)?-520:-360; sfx('pop'); fx.push({t:0,kind:'stomp',x:e.x,y:e.y-10}); } else hurt(); } }
      // 大王：跳來跳去，踩頭三次
      if(bossObj&&!bossObj.dead){ const B=bossObj; if(B.hurt>0) B.hurt-=dt; B.jumpT-=dt; B.vy+=1300*dt; B.x+=B.vx*dt*(B.hp===1?1.5:1); if(B.x<B.ax+40){ B.x=B.ax+40; B.vx=Math.abs(B.vx); } if(B.x>B.bx-40){ B.x=B.bx-40; B.vx=-Math.abs(B.vx); }
        B.y+=B.vy*dt; if(B.y>=lv.boss.y){ B.y=lv.boss.y; B.vy=0; if(B.jumpT<=0){ B.vy=-560-(3-B.hp)*60; B.jumpT=1.2+Math.random(); B.vx=(P.x<B.x?-1:1)*(90+(3-B.hp)*30); } }
        if(!P.dead&&Math.abs(P.x-B.x)<46&&P.y>B.y-80&&P.y-34<B.y){ if(P.vy>60&&P.y<B.y-48&&B.hurt<=0){ B.hp--; B.hurt=1.2; P.vy=-560; sfx('boom'); fx.push({t:0,kind:'stomp',x:B.x,y:B.y-70}); if(B.hp<=0){ B.dead=1; sfx('win'); msg='打倒果凍大王了！'; msgT=2; } } else if(B.hurt<=0) hurt(); } }
      // 道具、金幣、星星、中途旗、終點
      for(const it of items){ it.t+=dt; it.vy=Math.min(600,it.vy+1200*dt); it.x+=it.vx*dt; const cx=Math.floor((it.x+(it.vx>0?10:-10))/TS); if(SOLID(tileAt(cx,Math.floor((it.y-8)/TS)))) it.vx=-it.vx; it.y+=it.vy*dt; const gy=Math.floor(it.y/TS); if(SOLID(tileAt(Math.floor(it.x/TS),gy))){ it.y=gy*TS; it.vy=0; }
        if(Math.abs(it.x-P.x)<20&&Math.abs(it.y-P.y)<34){ it.got=1; P.big=true; sfx('heal'); msg='變大了！被撞一下只會變小'; msgT=1.6; } }
      items=items.filter(it=>!it.got&&it.y<ROWS*TS+40);
      const b=hb(); for(const o of coins) if(!o.got&&Math.abs(o.x-P.x)<18&&o.y>b.y-8&&o.y<b.y+b.h+8){ o.got=1; coinsLv++; totalCoins++; sfx('item'); if(totalCoins%100===0){ lives++; msg='金幣 100 枚！命 +1'; msgT=1.6; } }
      for(const s of stars) if(!s.got&&Math.abs(s.x-P.x)<24&&s.y>b.y-14&&s.y<b.y+b.h+14){ s.got=1; gotStars|=1<<s.id; sfx('win'); msg='星星金幣！'; msgT=1.2; }
      if(lv.cp&&!cpOn&&P.x>lv.cp+TS){ cpOn=true; sfx('lap'); msg='中途旗！'; msgT=1.2; }
      const atGoal=lv.boss?(bossObj&&bossObj.dead&&P.x>lv.goal):(P.x>=lv.goal-6);
      if(!P.goal&&!P.dead&&atGoal){ P.goal=true; P.vx=0; clearT=0; sfx('win'); }
      if(P.goal&&clearT>2.6) levelClear(); } }
  function levelClear(){ const i=lv.L.i,old=getRec(i),v=8|((old||0)&7)|gotStars; setRec(i,v); mode='map'; const next=Math.min(29,i+1);
    if(i===29){ ended=true; endT=0; mode='win'; finish(); return; }
    avatar.target=next; avatar.x=NODES[i].x; avatar.y=NODES[i].y; cur=i; msg='第 '+(i+1)+' 關過關！星星金幣 '+starsOf(v)+' / 3'; msgT=2.4; }
  let done=false;
  function finish(){ if(done) return; done=true; let far=-1; for(let i=0;i<30;i++) if(getRec(i)!=null) far=i; let st=0; for(let i=0;i<30;i++) st+=starsOf(getRec(i));
    env.end({title:mode==='win'?'果凍島全破了！':'命用完了…',big:'最遠第 '+(far+1)+' 關',text:'星星金幣 '+st+' / 90，這次撿了 '+totalCoins+' 枚金幣。'+(mode==='win'?'':'過的關卡都會記住，下次從地圖接著玩。'),score:far+1}); }

  /* ---------- 畫面 ---------- */
  function draw(){ if(mode==='map'||mode==='win'&&!lv){ worldMap(c,mapCam,t,cur,avatar,L); hudTop(); if(msgT>0) banner(msg); return; }
    if(!lv) return; const wi=lv.L.w,castle=lv.L.castle; backdrop(c,castle?4:wi,cam,t); if(castle){ c.fillStyle='rgba(30,10,40,.45)'; c.fillRect(0,0,W,H); }
    const cx0=Math.floor(cam/TS),cx1=Math.min(lv.cols.length-1,cx0+Math.ceil(W/TS)+1),oy=H-ROWS*TS;
    c.save(); c.translate(-Math.round(cam),oy);
    if(!lv.boss){ flagPole(c,lv.goal+16,lv.gyEnd*TS,t,P.goal?Math.min(220,clearT*200):0); miniCastle(c,lv.goal+160,lv.gyEnd*TS,false); }
    if(lv.cp){ const x=lv.cp+TS; let gy=ROWS; for(let y=0;y<ROWS;y++) if(SOLID(tileAt(Math.floor(x/TS),y))){ gy=y; break; } c.fillStyle='#e8e8f8'; c.fillRect(x-2,gy*TS-70,4,70); c.fillStyle=cpOn?'#5fd068':'#9aa0b8'; c.beginPath(); c.moveTo(x+2,gy*TS-70); c.lineTo(x+30,gy*TS-60); c.lineTo(x+2,gy*TS-50); c.fill(); }
    for(let cx=cx0;cx<=cx1;cx++){ const col=lv.cols[cx]; if(!col) continue; for(let cy=0;cy<ROWS;cy++){ const v=col[cy]; if(!v) continue; const top=v===1&&!SOLID(cy>0?col[cy-1]:0); let dy=0; for(const f of fx) if(f.kind==='bump'&&f.cx===cx&&f.cy===cy&&f.t<.15) dy=-Math.sin(f.t/.15*Math.PI)*8;
      c.drawImage(tileImg(castle&&v===1?4:wi,v,top),cx*TS,cy*TS+dy,TS,TS); } }
    for(const m of movers){ c.fillStyle='#ffd23f'; rr(c,m.x,m.y,m.w,14,7); c.fill(); c.strokeStyle='#b8800a'; c.lineWidth=2; c.stroke(); c.fillStyle='rgba(255,255,255,.5)'; rr(c,m.x+4,m.y+2,m.w-8,4,2); c.fill(); }
    for(const o of coins) if(!o.got&&o.x>cam-20&&o.x<cam+W+20) coin(c,o.x,o.y,t);
    for(const s of stars) if(!s.got) coin(c,s.x,s.y,t,true);
    for(const it of items){ c.fillStyle='#ff5d8f'; c.beginPath(); c.arc(it.x,it.y-12,12,0,7); c.fill(); c.strokeStyle='#a83a6a'; c.lineWidth=2; c.stroke(); c.fillStyle='#5fd068'; c.beginPath(); c.ellipse(it.x+4,it.y-25,6,3,-.5,0,7); c.fill(); c.fillStyle='rgba(255,255,255,.6)'; c.beginPath(); c.arc(it.x-4,it.y-16,3,0,7); c.fill(); }
    for(const e of ents){ if(e.dead>.5||e.x<cam-40||e.x>cam+W+40) continue; foe(c,e,t); }
    if(bossObj&&!bossObj.dead) boss(c,bossObj,t);
    for(const f of fx){ const u=f.t/.8; if(f.kind==='coin'){ coin(c,f.x,f.y-u*50,t*3); } else if(f.kind==='stomp'){ c.globalAlpha=1-u; c.fillStyle='#fff'; for(let k=0;k<6;k++){ const a=k/6*6.28; c.beginPath(); c.arc(f.x+Math.cos(a)*u*30,f.y+Math.sin(a)*u*20,4*(1-u),0,7); c.fill(); } c.globalAlpha=1; } }
    if(!(P.inv>0&&Math.floor(t*16)%2)) hero(c,P.x,P.y,{t,L,run:P.run,moving:Math.abs(P.vx)>10,air:!P.on,face:P.face,big:P.big,hurt:P.dead});
    c.restore();
    hudTop(); if(introT>0){ c.fillStyle='rgba(11,10,28,'+Math.min(.8,introT)+')'; c.fillRect(0,0,W,H); c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 30px '+TC; c.fillText('第 '+(lv.L.i+1)+' 關　'+lv.L.name,W/2,H/2-14); c.fillStyle='#fff'; c.font='700 16px '+TC; c.fillText(lv.boss?'最後有果凍大王！踩牠的頭三次':'找找看 3 枚星星金幣',W/2,H/2+22); }
    if(P.goal&&clearT>.4){ banner('過關！'); } else if(msgT>0) banner(msg);
    if(mode==='over'){ c.fillStyle='rgba(11,10,28,.6)'; c.fillRect(0,0,W,H); c.textAlign='center'; c.font='900 40px '+TC; c.fillStyle='#ff8a8a'; c.fillText('命用完了…',W/2,H/2); } }
  function banner(s){ c.font='900 22px '+TC; c.textAlign='center'; c.textBaseline='middle'; const w=c.measureText(s).width+40; c.fillStyle='rgba(255,93,143,.92)'; rr(c,W/2-w/2,64,w,42,18); c.fill(); c.fillStyle='#fff'; c.fillText(s,W/2,86); }
  function hudTop(){ c.fillStyle='rgba(11,10,28,.62)'; rr(c,8,8,mode==='map'?300:470,32,16); c.fill(); c.textAlign='left'; c.textBaseline='middle';
    c.fillStyle='#ff5d8f'; c.font='900 16px '+TC; c.fillText('♥',22,25); c.fillStyle='#fff'; c.font='900 14px '+TC; c.fillText('× '+lives,40,25);
    coin(c,94,24,0); c.fillStyle='#fff'; c.fillText('× '+totalCoins,108,25);
    if(mode!=='map'&&lv){ for(let k=0;k<3;k++){ const got=stars.find(s=>s.id===k&&s.got); c.fillStyle=got?'#ffb000':'rgba(255,255,255,.3)'; c.font='900 18px '+TC; c.fillText('★',170+k*20,25); }
      c.fillStyle='#cfd0ff'; c.font='700 13px '+TC; c.fillText(lv.L.name,240,25); }
    else { c.fillStyle='#cfd0ff'; c.font='700 13px '+TC; c.fillText('世界地圖',170,25); } }
  return {update,draw,destroy(){},_dbg:{get mode(){return mode;},get P(){return P;},get lv(){return lv;},enter,get lives(){return lives;},set lives(v){lives=v;},get boss(){return bossObj;},get cur(){return cur;},get avatar(){return avatar;},levelClear}};
}

/* ---------- 開始畫面、縮圖、造型 ---------- */
function stageShow(ctx,w,h,si,t){ const lv=makeLevel(si),k=h/H; ctx.save(); ctx.scale(k,k); const cam=(t*60)%Math.max(1,lv.width-W*1.5); backdrop(ctx,lv.L.castle?4:lv.L.w,cam,t);
  ctx.translate(-cam,H-ROWS*TS); const cx0=Math.floor(cam/TS); for(let cx=cx0;cx<cx0+Math.ceil(w/k/TS)+1;cx++){ const col=lv.cols[cx]; if(!col) continue; for(let cy=0;cy<ROWS;cy++){ const v=col[cy]; if(v) ctx.drawImage(tileImg(lv.L.castle&&v===1?4:lv.L.w,v,v===1&&!SOLID(cy>0?col[cy-1]:0)),cx*TS,cy*TS,TS,TS); } }
  for(const o of lv.coins) if(o.x>cam&&o.x<cam+W*1.6) coin(ctx,o.x,o.y,t); for(const e of lv.ents) if(e.x>cam&&e.x<cam+W*1.6) foe(ctx,Object.assign({vx:-1},e),t);
  ctx.restore(); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.08)+'px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#14122b'; const s=LEVELS[si].name+(LEVELS[si].castle?'・大王':''); ctx.strokeText(s,w/2,h*.12); ctx.fillStyle='#ffd23f'; ctx.fillText(s,w/2,h*.12); }
function thumb(ctx,w,h,t){ const k=h/H; ctx.save(); ctx.scale(k,k); backdrop(ctx,0,t*40,t); ctx.translate(0,H-ROWS*TS); for(let cx=0;cx<Math.ceil(w/k/TS)+1;cx++) for(let cy=12;cy<ROWS;cy++) ctx.drawImage(tileImg(0,1,cy===12),cx*TS,cy*TS,TS,TS);
  for(let cx=8;cx<12;cx++) ctx.drawImage(tileImg(0,cx===10?3:2,false),cx*TS,8*TS,TS,TS); coin(ctx,330,6*TS,t); coin(ctx,370,6*TS,t);
  const jx=200+Math.sin(t*1.5)*60,jy=12*TS-Math.abs(Math.sin(t*3))*80; hero(ctx,jx,jy,{t,run:t,moving:true,air:jy<12*TS-4,face:Math.cos(t*1.5)>0?1:-1,big:false});
  foe(ctx,{t:'slime',x:560+Math.sin(t)*40,y:12*TS,vx:-1},t); ctx.restore();
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.13)+'px '+TC; ctx.lineWidth=8; ctx.strokeStyle='#14122b'; ctx.strokeText('蹦蹦果凍島',w/2,h*.2); ctx.fillStyle='#ffd23f'; ctx.fillText('蹦蹦果凍島',w/2,h*.2); }
function preview(ctx,w,h,L,t){ const k=h/H; ctx.save(); ctx.scale(k,k); backdrop(ctx,0,t*30,t); ctx.translate(0,H-ROWS*TS); for(let cx=0;cx<26;cx++) for(let cy=12;cy<ROWS;cy++) ctx.drawImage(tileImg(0,1,cy===12),cx*TS,cy*TS,TS,TS);
  const air=Math.sin(t*2)>.5; hero(ctx,W/2,12*TS-(air?40:0),{t,L,run:t,moving:true,air,face:1,big:true}); ctx.restore(); }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).jelly={
  name:'蹦蹦果凍島',tag:'JELLY ISLAND',color:'#ff5d8f',
  desc:'在世界地圖上一關一關往前走！跳過斷崖、踩扁果凍史萊姆、頂問號糖果盒，每個世界最後到城堡打果凍大王。六個世界共 30 關。',
  goal:'往右走到終點旗子就過關；掉下去或被怪物撞到會少一條命。每關藏著 3 枚星星金幣。',
  stageGoal:si=>{ const l=LEVELS[si]; return l.name+'：'+(l.castle?'城堡關，走到最後的大王房間，踩果凍大王的頭三次。':'走到最右邊的終點旗。')+'踩怪物的頭可以打倒牠（刺刺栗不能踩），頂問號糖果盒有金幣或果凍果（吃了變大，被撞只會變小）。進遊戲後在世界地圖上選關。'; },
  stages:LEVELS.map(l=>l.name),stars:LEVELS.map((l,i)=>1+Math.floor(i/6)),stageLabel:'選擇關卡',
  stageBest:i=>{ const v=getRec(i); return v==null?'':'✓ '+'★'.repeat(starsOf(v)); },
  stageLocked:i=>i>0&&getRec(i-1)==null,
  help:[['← →','走路（地圖上選關卡）'],['空白鍵 或 ↑','跳（按越久跳越高）；地圖上進入關卡'],['踩頭','打倒怪物（刺刺栗不能踩）']],
  touchHelp:[['◀ ▶','走路、在地圖上選關卡'],['跳','跳（按越久跳越高）、進入關卡']],
  touch:{left:[{l:'◀',c:'ArrowLeft',big:true},{l:'▶',c:'ArrowRight',big:true}],right:[{l:'跳',c:'Space',big:true,act:true}]},
  best:{label:'最遠',fmt:v=>'第 '+v+' 關',lower:false},
  looks:[{key:'hair',label:'髮型',opts:[{id:'girl',label:'長髮'},{id:'boy',label:'短髮'},{id:'bun',label:'包包頭'}]},
    {key:'acc',label:'頭上',opts:[{id:'bow',label:'蝴蝶結'},{id:'cap',label:'帽子'},{id:'band',label:'頭巾'},{id:'phones',label:'耳機'},{id:'none',label:'不戴'}]},
    {key:'color',label:'衣服顏色',type:'color',opts:['#ff5d6d','#ff9a4d','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#b98cff']}],
  stageShow,preview,thumb,create
};
})();
