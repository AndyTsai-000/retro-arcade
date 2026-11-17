// 夜市料理王：開一攤夜市小吃。點食材放上烤架／油鍋，熟了點一下收到出餐台（太久會焦），再點客人把他點的餐交出去。
// 8 種小吃一關一關解鎖，8 個夜市共 200 關；今晚的客人都來過、走了就結算，賺到目標金額就過關（沒有倒數計時）。
(function(){
'use strict';
const W=800,H=480,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,LV=200;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function mul(seed){ let a=seed>>>0||1; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const LS=(k,v)=>{ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } };

/* ---------- 小吃：烹調時間 cook、幾秒後焦掉 burn（0＝不會焦）、價錢、用哪種爐子、幾格 ---------- */
const FOOD=[
  {id:'sausage',n:'烤香腸',cook:4,burn:9.5,price:35,st:'grill',slots:3},
  {id:'chicken',n:'炸雞排',cook:5,burn:10.5,price:70,st:'fryer',slots:2},
  {id:'tea',n:'珍珠奶茶',cook:2.5,burn:0,price:50,st:'drink',slots:2},
  {id:'oyster',n:'蚵仔煎',cook:6,burn:12,price:65,st:'pan',slots:2},
  {id:'tofu',n:'臭豆腐',cook:4.5,burn:9.5,price:60,st:'fryer',slots:2},
  {id:'ball',n:'地瓜球',cook:3,burn:7.5,price:40,st:'fryer',slots:3},
  {id:'corn',n:'烤玉米',cook:5.5,burn:11.5,price:50,st:'grill',slots:2},
  {id:'ice',n:'芒果冰',cook:1.5,burn:0,price:55,st:'drink',slots:2}];
const MARKETS=[{n:'士林夜市',sky:['#1a1446','#4a2a6a'],acc:'#ffd23f'},{n:'饒河夜市',sky:['#14204a','#3a3a7a'],acc:'#ff7a3d'},{n:'逢甲夜市',sky:['#201040','#5a2a5a'],acc:'#3ddbd9'},{n:'六合夜市',sky:['#1a1a3a','#5a3a4a'],acc:'#ff5d8f'},
  {n:'花園夜市',sky:['#102a3a','#2a4a6a'],acc:'#86dc4f'},{n:'羅東夜市',sky:['#1a2440','#3a5a7a'],acc:'#ffb03a'},{n:'寧夏夜市',sky:['#24103a','#4a2050'],acc:'#b98cff'},{n:'瑞豐夜市',sky:['#14142e','#3a2a5a'],acc:'#ff6b6b'}];
// 第 i 關：開放幾種小吃、客人數、多久來一位、耐心、每份最多幾樣、目標金額
function levelOf(i){ const k=i/(LV-1),m=Math.floor(i/25),R=mul(i*7919+3),nf=Math.min(8,1+Math.floor(i/7)),menu=FOOD.slice(0,nf).map(f=>f.id);
  const cust=Math.min(26,5+Math.floor(i*.11)+(i%25>18?2:0)),gap=+(6.2-3.6*k).toFixed(2),pat=+(32-16*k).toFixed(1),maxItems=i<4?1:i<30?2:3;
  const avg=menu.reduce((a,id)=>a+FOOD.find(f=>f.id===id).price,0)/menu.length,items=(1+maxItems)/2;
  return {i,m,k,menu,cust,gap,pat,maxItems,target:Math.round(cust*items*avg*(1+.15*Math.min(1,k*4)-.05*k)/10)*10,seed:i*131+7,name:MARKETS[m].n+' 第 '+(i%25+1)+' 晚'}; }
const recKey=i=>'arcade.cook.s.'+i,getRec=i=>{ const v=LS(recKey(i)); return v==null?null:+v; };

/* ---------- 畫小吃 ---------- */
function drawFood(c,id,x,y,s,state){ // state：0 生、1 熟、2 焦
  c.save(); c.translate(x,y); c.scale(s,s); const burnt=state===2,raw=state===0,INK='#3a2414'; c.lineWidth=1.6; c.strokeStyle=INK;
  const C=(a,b)=>burnt?'#2a2420':raw?b:a;
  if(id==='sausage'){ c.strokeStyle='#c8a070'; c.lineWidth=2; c.beginPath(); c.moveTo(0,18); c.lineTo(0,-22); c.stroke(); c.fillStyle=C('#c8402a','#f08a8a'); c.strokeStyle=INK; c.lineWidth=1.6; rr(c,-7,-20,14,30,7); c.fill(); c.stroke(); if(!raw&&!burnt){ c.strokeStyle='#7a1a10'; c.beginPath(); for(let j=-14;j<6;j+=6){ c.moveTo(-6,j); c.lineTo(6,j+3); } c.stroke(); } }
  else if(id==='chicken'){ c.fillStyle=C('#e0a040','#f4d8b0'); c.beginPath(); c.moveTo(-18,-10); c.quadraticCurveTo(-4,-20,16,-12); c.quadraticCurveTo(22,4,12,14); c.quadraticCurveTo(-8,20,-18,8); c.closePath(); c.fill(); c.stroke(); if(!raw&&!burnt){ c.fillStyle='#c87a20'; for(let j=0;j<10;j++) c.fillRect(-12+(j*7)%26,-10+(j*5)%20,2,2); } }
  else if(id==='tea'){ c.fillStyle='rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(-11,-16); c.lineTo(11,-16); c.lineTo(8,18); c.lineTo(-8,18); c.closePath(); c.fill(); c.stroke(); c.fillStyle=raw?'#e8dcc8':'#c89a6a'; c.beginPath(); c.moveTo(-10,-8); c.lineTo(10,-8); c.lineTo(8,17); c.lineTo(-8,17); c.closePath(); c.fill(); if(!raw){ c.fillStyle='#2a1a10'; for(let j=0;j<7;j++){ c.beginPath(); c.arc(-5+(j*4)%11,10+(j%2)*4,2,0,TAU); c.fill(); } } c.strokeStyle='#ff5d8f'; c.lineWidth=2.5; c.beginPath(); c.moveTo(3,-24); c.lineTo(1,0); c.stroke(); }
  else if(id==='oyster'){ c.fillStyle=C('#f0c860','#f8e8b0'); c.beginPath(); c.ellipse(0,2,20,13,0,0,TAU); c.fill(); c.stroke(); if(!raw&&!burnt){ c.fillStyle='#e8402a'; c.beginPath(); c.ellipse(0,-1,12,5,0,0,TAU); c.fill(); c.fillStyle='#6ab04a'; c.fillRect(-10,4,5,3); c.fillRect(4,5,6,3); } c.fillStyle=burnt?'#444':'#8a8aa0'; c.beginPath(); c.arc(-6,4,3,0,TAU); c.arc(7,0,3,0,TAU); c.fill(); }
  else if(id==='tofu'){ for(const [dx,dy] of [[-9,0],[9,0],[0,-10]]){ c.fillStyle=C('#d8a040','#f4ecd8'); rr(c,dx-8,dy-6,16,14,3); c.fill(); c.stroke(); } if(!raw&&!burnt){ c.fillStyle='#86c84a'; c.beginPath(); c.ellipse(0,10,14,4,0,0,TAU); c.fill(); } }
  else if(id==='ball'){ for(const [dx,dy] of [[-8,4],[8,4],[0,-6],[-9,-10],[9,-10]]){ c.fillStyle=C('#f0a030','#f8d080'); c.beginPath(); c.arc(dx,dy,7,0,TAU); c.fill(); c.stroke(); } }
  else if(id==='corn'){ c.strokeStyle='#c8a070'; c.lineWidth=2; c.beginPath(); c.moveTo(0,20); c.lineTo(0,-24); c.stroke(); c.fillStyle=C('#e8a020','#f8e070'); c.strokeStyle=INK; c.lineWidth=1.6; c.beginPath(); c.ellipse(0,-4,8,18,0,0,TAU); c.fill(); c.stroke(); c.fillStyle=burnt?'#111':raw?'#e8c840':'#a8501a'; for(let j=-16;j<12;j+=5){ c.fillRect(-5,j,3,2); c.fillRect(2,j+2,3,2); } c.fillStyle='#6ab04a'; c.beginPath(); c.moveTo(-8,12); c.quadraticCurveTo(-14,0,-10,-8); c.lineTo(-4,10); c.fill(); }
  else if(id==='ice'){ c.fillStyle='#fff'; c.beginPath(); c.moveTo(-16,4); c.lineTo(16,4); c.lineTo(10,18); c.lineTo(-10,18); c.closePath(); c.fill(); c.stroke(); c.fillStyle=raw?'#f4f8ff':'#fff'; c.beginPath(); c.arc(0,2,15,Math.PI,0); c.fill(); c.stroke(); if(!raw){ c.fillStyle='#ffb020'; for(const [dx,dy] of [[-7,-6],[4,-9],[8,-2],[-2,-2]]){ rr(c,dx-4,dy-3,8,6,2); c.fill(); } c.fillStyle='rgba(255,240,200,.8)'; c.beginPath(); c.ellipse(0,-12,8,3,0,0,TAU); c.fill(); } }
  c.restore(); }
// 爐子
function drawStation(c,st,x,y,w,h,t){ if(st==='grill'){ c.fillStyle='#3a3a40'; rr(c,x,y,w,h,8); c.fill(); c.fillStyle='#1a1a1e'; c.fillRect(x+6,y+6,w-12,h-12); const g=c.createLinearGradient(0,y+h-20,0,y+h); g.addColorStop(0,'rgba(255,100,30,0)'); g.addColorStop(1,'rgba(255,100,30,'+(.5+.15*Math.sin(t*6))+')'); c.fillStyle=g; c.fillRect(x+6,y+6,w-12,h-12); c.strokeStyle='#8a8a90'; c.lineWidth=2; for(let gx=x+12;gx<x+w-8;gx+=10){ c.beginPath(); c.moveTo(gx,y+8); c.lineTo(gx,y+h-8); c.stroke(); } }
  else if(st==='fryer'){ c.fillStyle='#8a8e96'; rr(c,x,y,w,h,8); c.fill(); c.fillStyle='#c8902a'; rr(c,x+6,y+8,w-12,h-14,6); c.fill(); c.fillStyle='rgba(255,230,120,.5)'; for(let i=0;i<5;i++){ const bx=x+12+((i*37+t*20)%(w-24)),by=y+14+((i*17)%(h-26)); c.beginPath(); c.arc(bx,by,2+Math.sin(t*9+i)*1,0,TAU); c.fill(); } }
  else if(st==='pan'){ c.fillStyle='#2a2a30'; rr(c,x,y,w,h,8); c.fill(); c.fillStyle='#4a4a52'; rr(c,x+5,y+5,w-10,h-10,6); c.fill(); c.fillStyle='rgba(255,255,255,.08)'; c.fillRect(x+8,y+8,w-16,6); }
  else { c.fillStyle='#e8f0f8'; rr(c,x,y,w,h,8); c.fill(); c.strokeStyle='#9ab0c8'; c.lineWidth=2; rr(c,x,y,w,h,8); c.stroke(); c.fillStyle='#bfe4ff'; c.fillRect(x+6,y+6,w-12,10); } }
// Q 版客人
function drawCustomer(c,x,y,look,mood,t,eat){ const INK='#2a1a26',bob=Math.abs(Math.sin(t*3+x))*2,yy=y-bob; c.lineWidth=2.4; c.strokeStyle=INK;
  c.fillStyle=look.shirt; rr(c,x-24,yy+18,48,44,14); c.fill(); c.stroke();
  c.fillStyle=look.skin; c.beginPath(); c.arc(x,yy,30,0,TAU); c.fill(); c.stroke();
  c.fillStyle=look.hair; c.beginPath(); c.arc(x,yy-5,31,Math.PI*1.05,Math.PI*1.95); c.quadraticCurveTo(x+6,yy-18,x-30,yy-4); c.closePath(); c.fill(); c.stroke();
  if(look.ears){ c.fillStyle=look.hair; for(const s of [-1,1]){ c.beginPath(); c.moveTo(x+s*14,yy-26); c.lineTo(x+s*24,yy-44); c.lineTo(x+s*28,yy-20); c.fill(); c.stroke(); } }
  const blink=(t*.5+x*.01)%4<.12; for(const s of [-1,1]){ if(blink||mood==='happy'){ c.beginPath(); c.arc(x+s*10,yy+3,4.5,Math.PI*1.1,Math.PI*1.9); c.stroke(); } else { c.fillStyle=INK; c.beginPath(); c.ellipse(x+s*10,yy+2,4.5,6,0,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(x+s*10-1.5,yy,1.8,0,TAU); c.arc(x+s*10+1.5,yy+4,1,0,TAU); c.fill(); } }
  if(mood==='angry'){ c.beginPath(); c.moveTo(x-16,yy-9); c.lineTo(x-5,yy-5); c.moveTo(x+16,yy-9); c.lineTo(x+5,yy-5); c.stroke(); c.fillStyle='rgba(255,60,60,.25)'; c.beginPath(); c.arc(x,yy,30,0,TAU); c.fill(); }
  c.fillStyle='rgba(255,110,140,.45)'; c.beginPath(); c.ellipse(x-18,yy+12,5,3,0,0,TAU); c.ellipse(x+18,yy+12,5,3,0,0,TAU); c.fill();
  c.beginPath(); if(mood==='angry'){ c.moveTo(x-5,yy+16); c.quadraticCurveTo(x,yy+11,x+5,yy+16); } else if(mood==='happy'||eat){ c.arc(x,yy+12,6,0,Math.PI); } else { c.arc(x-3,yy+13,3,0,Math.PI); c.arc(x+3,yy+13,3,0,Math.PI); } c.stroke(); }

/* ---------- 背景：夜市街景（快取） ---------- */
const BGC={};
function bgOf(m){ if(BGC[m]) return BGC[m]; const e=document.createElement('canvas'); e.width=W; e.height=H; const c=e.getContext('2d'),M=MARKETS[m],R=mul(m*77+1);
  const g=c.createLinearGradient(0,0,0,230); g.addColorStop(0,M.sky[0]); g.addColorStop(1,M.sky[1]); c.fillStyle=g; c.fillRect(0,0,W,260);
  c.fillStyle='#fff'; for(let i=0;i<40;i++){ c.globalAlpha=.3+R()*.6; c.fillRect(R()*W,R()*80,1.6,1.6); } c.globalAlpha=1;
  // 對面的攤位招牌
  for(let i=0;i<7;i++){ const x=i*120-20+R()*20,h=60+R()*40; c.fillStyle='rgba(0,0,0,.35)'; c.fillRect(x,150-h*.2,110,140); c.fillStyle=['#e8402a','#ffd23f','#3a8ad8','#ff7a3d','#5fd068','#b45cff'][i%6]; rr(c,x+6,96-h*.2,98,30,6); c.fill(); c.fillStyle='#fff'; c.font='900 16px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(['大腸包小腸','滷味','雞蛋糕','烤魷魚','豆花','水煎包','檸檬愛玉'][(i+m)%7],x+55,111-h*.2,92); }
  // 燈籠串
  for(const yy of [28]){ c.strokeStyle='rgba(60,40,30,.8)'; c.lineWidth=1.5; c.beginPath(); c.moveTo(0,yy); for(let x=0;x<=W;x+=40) c.lineTo(x,yy+Math.sin(x*.05)*8); c.stroke(); for(let x=20;x<W;x+=40){ const ly=yy+Math.sin(x*.05)*8+10; c.fillStyle=(x/40|0)%2?'#e8402a':M.acc; c.beginPath(); c.ellipse(x,ly,9,11,0,0,TAU); c.fill(); c.fillStyle='rgba(255,230,150,.18)'; c.beginPath(); c.arc(x,ly,13,0,TAU); c.fill(); } }
  // 自己攤位的招牌＋遮雨棚
  c.fillStyle='#c8302a'; for(let i=0;i<16;i++){ c.fillStyle=i%2?'#f4f0e8':'#d8302a'; c.beginPath(); c.moveTo(i*50,118); c.lineTo(i*50+50,118); c.lineTo(i*50+50,140); c.quadraticCurveTo(i*50+25,152,i*50,140); c.fill(); }
  // 櫃台（客人站在後面）
  c.fillStyle='#8a5a32'; c.fillRect(0,262,W,24); c.fillStyle='#a8723e'; c.fillRect(0,258,W,8); c.fillStyle='rgba(0,0,0,.2)'; c.fillRect(0,282,W,4);
  // 工作台
  const wg=c.createLinearGradient(0,286,0,H); wg.addColorStop(0,'#c8c8cc'); wg.addColorStop(1,'#9a9aa2'); c.fillStyle=wg; c.fillRect(0,286,W,H-286); c.fillStyle='rgba(255,255,255,.25)'; c.fillRect(0,288,W,3);
  return BGC[m]=e; }

/* ---------- 遊戲 ---------- */
function create(env,opts){
  const si=clamp(opts.stage|0,0,LV-1),L=levelOf(si),{ctx:c,canvas}=env.canvas2d(W,H),R=mul(L.seed),touch=document.body.classList.contains('touch');
  // 爐子：依開放的小吃排成一排
  const ST=[]; for(const id of L.menu){ const f=FOOD.find(q=>q.id===id); ST.push({f,slots:Array.from({length:f.slots},()=>null)}); }
  const n=ST.length,colW=Math.min(150,(W-20)/n); ST.forEach((s,i)=>{ s.x=10+i*colW+(W-20-colW*n)/2; s.w=colW-10; });
  const SEATS=[120,300,480,660],shelf=[],fx=[];
  let t=0,money=0,served=0,lost=0,spawned=0,nextT=1.2,ended=false,endT=0,combo=0,introT=2.4,hint='';
  const cust=[null,null,null,null];
  const LOOK=()=>({skin:['#ffe0c8','#f4c8a0','#e8b890','#d8a070'][Math.floor(R()*4)],hair:['#3a2416','#1a1410','#8a4a2a','#d8b060','#e8e8e8','#5a3a7a'][Math.floor(R()*6)],shirt:['#ff6b6b','#4f9dff','#ffd23f','#5fd068','#b98cff','#ff9d3d','#3ddbd9'][Math.floor(R()*7)],ears:R()<.2});
  function spawn(){ const free=cust.findIndex(q=>!q); if(free<0) return false; const k=1+Math.floor(R()*L.maxItems),order=[]; for(let j=0;j<k;j++) order.push(L.menu[Math.floor(Math.pow(R(),.8)*L.menu.length)]);
    cust[free]={order,pat:L.pat,max:L.pat,look:LOOK(),in:0,out:0,happy:0}; spawned++; env.sfx('beep'); return true; }
  const pop=(txt,col,x,y,big)=>fx.push({k:'txt',txt,col,x,y,t:0,big});
  // 點擊
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  function tap(x,y){ if(ended||introT>0) return;
    // 客人
    for(let i=0;i<4;i++){ const q=cust[i]; if(!q||q.out) continue; if(Math.abs(x-SEATS[i])<70&&y>120&&y<285){ serve(i); return; } }
    // 爐子上的東西／食材盒
    for(const s of ST){ if(x<s.x||x>s.x+s.w) continue;
      if(y>=300&&y<392){ const sw=s.w/s.slots.length,j=clamp(Math.floor((x-s.x)/sw),0,s.slots.length-1),it=s.slots[j]; if(it){ take(s,j); return; } }
      if(y>=392){ put(s); return; } }
    // 出餐台上的東西：點一下丟掉（點錯時用）
    if(y>=228&&y<262) for(let j=0;j<shelf.length;j++){ const sx=W/2-shelf.length*24+j*48+24; if(Math.abs(x-sx)<22){ fx.push({k:'puff',x:sx,y:244,t:0}); shelf.splice(j,1); env.sfx('bump'); return; } } }
  function put(s){ const j=s.slots.findIndex(q=>!q); if(j<0){ pop('沒有空位','#ff8a8a',s.x+s.w/2,330); env.sfx('bump'); return; } s.slots[j]={id:s.f.id,t:0}; env.sfx('place'); fx.push({k:'puff',x:s.x+(j+.5)*s.w/s.slots.length,y:340,t:0,col:'#fff'}); }
  function take(s,j){ const it=s.slots[j],f=s.f,st=it.t<f.cook?0:f.burn&&it.t>=f.burn?2:1;
    if(st===0){ pop('還沒熟','#ffd23f',s.x+(j+.5)*s.w/s.slots.length,316); env.sfx('bump'); return; }
    s.slots[j]=null; const x=s.x+(j+.5)*s.w/s.slots.length;
    if(st===2){ money=Math.max(0,money-Math.round(f.price*.3)); pop('焦了！丟掉 -$'+Math.round(f.price*.3),'#ff6b6b',x,316); env.sfx('hurt'); fx.push({k:'smoke',x,y:330,t:0}); return; }
    if(shelf.length>=8){ pop('出餐台滿了','#ff8a8a',x,316); s.slots[j]=it; env.sfx('bump'); return; }
    shelf.push(f.id); env.sfx('item'); fx.push({k:'fly',id:f.id,x0:x,y0:340,x1:W/2,y1:244,t:0}); }
  function serve(i){ const q=cust[i],need=q.order.slice(),use=[]; for(const id of need){ const k=shelf.findIndex((s,j)=>s===id&&!use.includes(j)); if(k<0){ const miss=need.filter(id2=>{ const cnt=need.filter(z=>z===id2).length,have=shelf.filter(z=>z===id2).length; return have<cnt; }); pop('還缺：'+[...new Set(miss)].map(id2=>FOOD.find(f=>f.id===id2).n).join('、'),'#ffd23f',SEATS[i],120); env.sfx('bump'); return; } use.push(k); }
    use.sort((a,b)=>b-a).forEach(k=>shelf.splice(k,1)); const base=need.reduce((a,id)=>a+FOOD.find(f=>f.id===id).price,0),fast=q.pat/q.max,tip=fast>.6?Math.round(base*.2):fast>.3?Math.round(base*.08):0; combo++; const cb=combo>=3?Math.min(30,combo*5):0;
    money+=base+tip+cb; served++; q.out=1; q.happy=1; env.sfx('lap'); pop('+$'+(base+tip+cb)+(tip?'（小費 '+tip+'）':''),'#86dc4f',SEATS[i],110,1); if(cb) pop(combo+' 連單！+'+cb,'#ffd23f',SEATS[i],86);
    for(let k=0;k<6;k++) fx.push({k:'coin',x:SEATS[i],y:150,vx:(Math.random()-.5)*160,vy:-120-Math.random()*120,t:0}); }
  const pd=e=>{ const [x,y]=toG(e); tap(x,y); };
  canvas.addEventListener('pointerdown',pd); canvas.style.touchAction='none';
  // 鍵盤：1～8 放食材到第幾個爐子，Q W E R 交給第 1～4 位客人，空白鍵收起最先熟的
  function keys(){ for(let i=0;i<ST.length;i++) if(env.hit('Digit'+(i+1))) put(ST[i]); ['KeyQ','KeyW','KeyE','KeyR'].forEach((k,i)=>{ if(env.hit(k)&&cust[i]&&!cust[i].out) serve(i); });
    if(env.hit('Space')){ let best=null; for(const s of ST) s.slots.forEach((it,j)=>{ if(it&&it.t>=s.f.cook&&(!best||it.t-s.f.cook>best.v)) best={s,j,v:it.t-s.f.cook}; }); if(best) take(best.s,best.j); } }
  function finish(){ if(ended) return; ended=true; const pass=money>=L.target,stars=!pass?0:money>=L.target*1.3?3:money>=L.target*1.12?2:1;
    if(pass){ const o=getRec(si); if(o==null||stars>o) LS(recKey(si),stars); } env.sfx(pass?'win':'lose');
    env.end({title:pass?'今晚收攤：大賺一筆！':'今晚收攤：差一點點…',big:'$'+money+(pass?'　'+'★'.repeat(stars)+'☆'.repeat(3-stars):''),text:L.name+'：目標 $'+L.target+'，招呼了 '+served+' 位客人'+(lost?'，'+lost+' 位等太久走掉了':'')+'。',score:pass?si+1:null,next:pass&&si<LV-1}); }
  function update(dt){ t+=dt; if(introT>0){ introT-=dt; return; } if(ended) return; keys();
    for(const s of ST) for(const it of s.slots) if(it){ const pt=it.t; it.t+=dt; if(pt<s.f.cook&&it.t>=s.f.cook) env.sfx('pop'); if(s.f.burn&&pt<s.f.burn-2.5&&it.t>=s.f.burn-2.5) hint='快焦了！'; }
    if(spawned<L.cust){ nextT-=dt; if(nextT<=0){ if(spawn()) nextT=L.gap*(.75+R()*.5); else nextT=.5; } }
    for(let i=0;i<4;i++){ const q=cust[i]; if(!q) continue; if(q.in<1) q.in=Math.min(1,q.in+dt*2.5); if(q.out){ q.out+=dt; if(q.out>1.1) cust[i]=null; continue; }
      q.pat-=dt; if(q.pat<=0){ q.out=1; q.angry=1; lost++; combo=0; env.sfx('hurt'); pop('等太久走掉了…','#ff8a8a',SEATS[i],110); } }
    for(const f of fx){ f.t+=dt; if(f.k==='coin'){ f.vy+=500*dt; f.x+=f.vx*dt; f.y+=f.vy*dt; } } for(let i=fx.length-1;i>=0;i--) if(fx[i].t>(fx[i].k==='txt'?1.6:1)) fx.splice(i,1);
    if(spawned>=L.cust&&cust.every(q=>!q)){ endT+=dt; if(endT>1) finish(); } }
  function draw(){ c.drawImage(bgOf(L.m),0,0);
    c.fillStyle='#ffd23f'; c.font='900 22px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=5; c.strokeStyle='#5a1a10'; c.strokeText(MARKETS[L.m].n+'・料理王',W/2,132); c.fillText(MARKETS[L.m].n+'・料理王',W/2,132);
    // 客人
    for(let i=0;i<4;i++){ const q=cust[i]; if(!q) continue; const x=SEATS[i],y=196+(1-q.in)*40+(q.out?q.out*30:0); c.globalAlpha=q.out?Math.max(0,1-q.out):q.in;
      drawCustomer(c,x,y,q.look,q.happy?'happy':q.angry||q.pat/q.max<.25?'angry':'',t,q.happy);
      if(!q.out){ // 點單泡泡
        const bw=Math.max(70,q.order.length*44+16),bx=x-bw/2,by=134-q.order.length*0; c.fillStyle='#fff'; rr(c,bx,by-10,bw,46,12); c.fill(); c.strokeStyle='#2a1a26'; c.lineWidth=2; c.stroke(); c.beginPath(); c.moveTo(x-6,by+36); c.lineTo(x,by+44); c.lineTo(x+6,by+36); c.fill();
        q.order.forEach((id,j)=>{ const have=shelf.filter(s=>s===id).length>=q.order.filter((z,jj)=>z===id&&jj<=j).length; drawFood(c,id,bx+30+j*44,by+12,.75,1); if(have){ c.fillStyle='#5fd068'; c.beginPath(); c.arc(bx+44+j*44,by+26,7,0,TAU); c.fill(); c.fillStyle='#fff'; c.font='900 11px '+TC; c.fillText('✓',bx+44+j*44,by+27); } });
        const u=q.pat/q.max; c.fillStyle='rgba(0,0,0,.35)'; rr(c,x-34,y+68,68,9,4); c.fill(); c.fillStyle=u>.5?'#5fd068':u>.25?'#ffd23f':'#ff5d5d'; rr(c,x-34,y+68,68*u,9,4); c.fill(); }
      c.globalAlpha=1; }
    // 出餐台
    c.fillStyle='rgba(255,255,255,.85)'; rr(c,W/2-200,226,400,36,10); c.fill(); c.strokeStyle='#8a5a32'; c.lineWidth=2; c.stroke(); c.fillStyle='#8a5a32'; c.font='900 13px '+TC; c.textAlign='left'; c.fillText(shelf.length?'':'出餐台（熟了的會放這裡）',W/2-190,244); c.textAlign='center';
    shelf.forEach((id,j)=>drawFood(c,id,W/2-shelf.length*24+j*48+24,244,.7,1));
    // 爐子＋食材盒
    for(const s of ST){ drawStation(c,s.f.st,s.x,300,s.w,88,t); const sw=s.w/s.slots.length;
      s.slots.forEach((it,j)=>{ const cx=s.x+(j+.5)*sw,cy=344; if(!it){ c.strokeStyle='rgba(255,255,255,.25)'; c.setLineDash([4,4]); c.lineWidth=1.5; c.beginPath(); c.arc(cx,cy,Math.min(22,sw/2-4),0,TAU); c.stroke(); c.setLineDash([]); return; }
        const f=s.f,st=it.t<f.cook?0:f.burn&&it.t>=f.burn?2:1; drawFood(c,f.id,cx,cy,Math.min(1.1,sw/44),st);
        if(st===1&&s.f.st!=='drink'&&Math.sin(t*10+j)>0){ c.fillStyle='rgba(255,255,255,.5)'; c.beginPath(); c.arc(cx-6+Math.sin(t*3+j)*4,cy-26-((t*30)%12),4,0,TAU); c.fill(); }
        if(st===2){ c.fillStyle='rgba(60,60,60,.6)'; for(let k=0;k<3;k++){ c.beginPath(); c.arc(cx+Math.sin(t*2+k)*8,cy-24-((t*40+k*12)%30),6+k,0,TAU); c.fill(); } }
        // 進度圈：生＝白、熟＝綠、快焦＝紅閃
        const u=st===0?it.t/f.cook:f.burn?(it.t-f.cook)/(f.burn-f.cook):1,col=st===0?'#fff':st===2?'#555':u>.6&&Math.sin(t*14)>0?'#ff5d5d':'#5fd068'; c.strokeStyle=col; c.lineWidth=4; c.beginPath(); c.arc(cx,cy+30,9,-Math.PI/2,-Math.PI/2+TAU*clamp(st===0?u:1-u,0,1)); c.stroke();
        if(st===1){ c.fillStyle='#5fd068'; c.font='900 13px '+TC; c.fillText('熟了',cx,cy-34); } });
      // 食材盒
      c.fillStyle='#fff8ec'; rr(c,s.x,396,s.w,70,10); c.fill(); c.strokeStyle='#c8a070'; c.lineWidth=2; c.stroke(); drawFood(c,s.f.id,s.x+s.w/2,420,.8,0); c.fillStyle='#5a3a20'; c.font='900 14px '+TC; c.fillText(s.f.n,s.x+s.w/2,450,s.w-6); c.fillStyle='#8a6a4a'; c.font='700 11px '+TC; if(!touch) c.fillText(String(ST.indexOf(s)+1),s.x+12,408); }
    // 上方資訊
    c.fillStyle='rgba(11,10,28,.8)'; rr(c,8,8,250,58,12); c.fill(); c.textAlign='left'; c.fillStyle='#86dc4f'; c.font='900 24px '+TC; c.fillText('$'+money,20,32); c.fillStyle='#cfd2e8'; c.font='700 13px '+TC; c.fillText('目標 $'+L.target+'　客人 '+(spawned-cust.filter(q=>q&&!q.out).length)+' / '+L.cust,20,54);
    c.fillStyle='rgba(11,10,28,.8)'; rr(c,W-218,8,210,34,12); c.fill(); c.textAlign='center'; c.fillStyle='#ffd23f'; c.font='900 15px '+TC; c.fillText(L.name,W-113,25,200);
    const pr=clamp(money/L.target,0,1); c.fillStyle='rgba(0,0,0,.4)'; rr(c,20,60,224,6,3); c.fill(); c.fillStyle=pr>=1?'#ffd23f':'#86dc4f'; rr(c,20,60,224*pr,6,3); c.fill();
    for(const f of fx){ const a=1-f.t/(f.k==='txt'?1.6:1); if(f.k==='txt'){ c.globalAlpha=Math.min(1,a*2); c.font='900 '+(f.big?22:16)+'px '+TC; c.lineWidth=5; c.strokeStyle='#14122b'; c.strokeText(f.txt,f.x,f.y-f.t*30); c.fillStyle=f.col; c.fillText(f.txt,f.x,f.y-f.t*30); c.globalAlpha=1; }
      else if(f.k==='coin'){ c.fillStyle='#ffd23f'; c.strokeStyle='#a87a10'; c.lineWidth=1.5; c.beginPath(); c.ellipse(f.x,f.y,6*Math.abs(Math.cos(f.t*12)),6,0,0,TAU); c.fill(); c.stroke(); }
      else if(f.k==='fly'){ const u=Math.min(1,f.t*3),x=f.x0+(f.x1-f.x0)*u,y=f.y0+(f.y1-f.y0)*u-Math.sin(u*Math.PI)*60; if(u<1) drawFood(c,f.id,x,y,.8,1); }
      else if(f.k==='puff'||f.k==='smoke'){ c.fillStyle=f.k==='smoke'?'rgba(60,60,60,'+a*.6+')':'rgba(255,255,255,'+a*.7+')'; for(let k=0;k<6;k++){ const an=k*1.05; c.beginPath(); c.arc(f.x+Math.cos(an)*f.t*30,f.y+Math.sin(an)*f.t*20-f.t*20,5+f.t*6,0,TAU); c.fill(); } } }
    if(introT>0){ c.fillStyle='rgba(11,10,28,.82)'; rr(c,W/2-260,150,520,120,18); c.fill(); c.fillStyle='#ffd23f'; c.font='900 28px '+TC; c.fillText('第 '+(si+1)+' 關　'+L.name,W/2,190,500); c.fillStyle='#fff'; c.font='700 16px '+TC; c.fillText('今晚目標 $'+L.target+'，共 '+L.cust+' 位客人',W/2,224); c.fillText((touch?'點':'點（或按數字鍵）')+'食材開始煮 → 熟了點一下 → 點客人出餐',W/2,250,500); }
    else if(spawned<=1&&served===0&&si<3){ c.fillStyle='rgba(11,10,28,.75)'; rr(c,W/2-230,272,460,26,13); c.fill(); c.fillStyle='#fff'; c.font='700 14px '+TC; c.fillText(shelf.length?'點客人，把餐交給他':ST.some(s=>s.slots.some(q=>q))?'變綠色「熟了」就點一下收起來':'點下面的「'+ST[0].f.n+'」開始烤',W/2,285); } }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',pd); },_dbg:{L,ST,shelf,cust,tap,put,take,serve,get money(){ return money; },get ended(){ return ended; },get served(){ return served; },get lost(){ return lost; }}};
}

function stageShow(c,w,h,si,t){ const L=levelOf(si); c.save(); c.scale(w/W,h/H); c.drawImage(bgOf(L.m),0,0);
  const look=[{skin:'#ffe0c8',hair:'#3a2416',shirt:'#ff6b6b'},{skin:'#f4c8a0',hair:'#d8b060',shirt:'#4f9dff',ears:1},{skin:'#ffe0c8',hair:'#1a1410',shirt:'#5fd068'}];
  [140,400,660].forEach((x,i)=>drawCustomer(c,x,200,look[i],i===1?'happy':'',t,i===1));
  const n=L.menu.length,cw=Math.min(150,780/n); L.menu.forEach((id,i)=>{ const f=FOOD.find(q=>q.id===id),x=10+i*cw+(780-cw*n)/2; drawStation(c,f.st,x,300,cw-10,88,t); drawFood(c,id,x+(cw-10)/2,344,Math.min(1.2,cw/50),Math.floor(t*.6+i)%3===2?1:1); c.fillStyle='#fff8ec'; rr(c,x,396,cw-10,70,10); c.fill(); c.fillStyle='#5a3a20'; c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(f.n,x+(cw-10)/2,440,cw-16); });
  c.fillStyle='rgba(11,10,28,.78)'; rr(c,W/2-220,12,440,46,14); c.fill(); c.fillStyle='#ffd23f'; c.font='900 22px '+TC; c.textAlign='center'; c.fillText(L.name+'　目標 $'+L.target,W/2,36,420); c.restore(); }
function thumb(c,w,h,t){ stageShow(c,w,h,60,t); c.save(); c.scale(w/W,h/H); c.font='900 56px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=10; c.strokeStyle='#5a1a10'; c.strokeText('夜市料理王',W/2,110); c.fillStyle='#ffd23f'; c.fillText('夜市料理王',W/2,110); c.restore(); }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).cook={
  name:'夜市料理王',tag:'NIGHT MARKET CHEF',color:'#ff7a3d',
  desc:'在夜市開一攤小吃！烤香腸、炸雞排、搖珍奶、煎蚵仔煎…熟了收起來、交給點餐的客人，別讓東西烤焦，也別讓客人等太久。8 個夜市共 200 關。',
  goal:'今晚的客人都招呼完時，賺到目標金額就過關；客人等越短小費越多，連續出餐還有加成。',
  stages:Array.from({length:LV},(_,i)=>levelOf(i).name),stars:Array.from({length:LV},(_,i)=>Math.min(5,1+Math.floor(i/40))),stageGrid:false,
  stageGoal:i=>{ const L=levelOf(i); return L.name+'：'+L.cust+' 位客人，目標 $'+L.target+'。菜單：'+L.menu.map(id=>FOOD.find(f=>f.id===id).n).join('、')+'。'+(i%7===0&&i>0&&i<56?'新小吃「'+FOOD[Math.floor(i/7)].n+'」登場！':''); },
  stageLocked:i=>i>0&&getRec(i-1)==null,stageBest:i=>{ const v=getRec(i); return v?'★'.repeat(v)+'☆'.repeat(3-v):''; },
  hubBest:()=>{ let n=0,s=0; for(let i=0;i<LV;i++){ const v=getRec(i); if(v!=null){ n++; s+=v; } } return n?'過關 <b>'+n+' / '+LV+'</b>　★ '+s:'尚無紀錄'; },
  help:[['點食材盒','放上爐子開始煮'],['熟了（綠色）','點一下收到出餐台；變黑就焦了'],['點客人','把他點的東西交給他'],['鍵盤','數字鍵放食材、空白鍵收最熟的、Q W E R 交給第 1～4 位客人']],
  touchHelp:[['點食材盒','放上爐子開始煮'],['熟了（綠色）','點一下收到出餐台'],['點客人','把他點的東西交給他']],
  touch:{left:[],right:[]},
  best:{label:'過關',fmt:v=>v+' 關',lower:false},
  stageShow,thumb,create,_sim:{levelOf,FOOD}};
})();
