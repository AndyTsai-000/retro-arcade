// 釣魚小日子：左右瞄準（或直接點水面）拋竿，浮標沉下去、出現「！」時按一下鉤住，再按住收線（拉力變紅就先放開）把魚拉上來。
// 8 個釣點各 25 關共 200 關，每關有目標（釣幾條、總重、指定魚種、大魚），用餌的數量限制，不限時間；釣到的魚會記進圖鑑。
(function(){
'use strict';
const W=800,H=480,SURF=176,BOT=452,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,LV=200,ROD={x:118,y:96};
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,u)=>a+(b-a)*u;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function mul(seed){ let a=seed>>>0||1; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const LS=(k,v)=>{ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } };

/* ---------- 釣點與魚 ---------- */
const SPOTS=[
  {n:'溪邊小徑',sky:['#8fd3ff','#e0f4ff'],land:'#6aa84a',water:['#5ac0d0','#1f6a7a'],deco:'rock'},
  {n:'翠綠湖畔',sky:['#9ad8ff','#eaf8ff'],land:'#5f9a44',water:['#4aa8b8','#1a4a6a'],deco:'reed'},
  {n:'漁港碼頭',sky:['#7ec0f0','#dcefff'],land:'#8a7a6a',water:['#3a8ab8','#14385a'],deco:'pier'},
  {n:'紅樹林',sky:['#a8d8e8','#f0f8e8'],land:'#4a7a3a',water:['#6a9a7a','#2a4a3a'],deco:'mangrove'},
  {n:'外海船釣',sky:['#5ab0f0','#d0ecff'],land:null,water:['#2a7ac8','#0a2a5a'],deco:'boat'},
  {n:'冰湖',sky:['#c8dcf0','#f4f8ff'],land:'#f4f8ff',water:['#7ab0d0','#2a4a6a'],deco:'ice'},
  {n:'夜釣碼頭',sky:['#0a1030','#2a2a5a'],land:'#3a3a48',water:['#1a3a6a','#050a20'],deco:'night'},
  {n:'深海探險',sky:['#4aa0e8','#c8e8ff'],land:null,water:['#1a5aa8','#020818'],deco:'deep'}];
// 魚：名字、出現的釣點、顏色、花紋、長度範圍(cm)、稀有度 1～5、力氣 0～1、泳速、喜歡的深度 0～1
const FISH=[
  ['溪哥',[0],'#9ab0c8','#ff7a5a','stripe',10,18,1,.15,60,.3],['苦花',[0],'#7a8a6a','#e8e0a0','',12,25,2,.25,70,.6],['石賓',[0],'#6a7a5a','#3a4a3a','spot',15,30,2,.35,55,.8],['高身鯝魚',[0,1],'#b8c0a8','#6a7a5a','',20,40,3,.45,50,.7],
  ['吳郭魚',[1,3],'#6a8a7a','#3a5a4a','stripe',15,35,1,.25,45,.5],['鯽魚',[1],'#c8b070','#8a7a40','',10,25,1,.2,50,.6],['草魚',[1],'#a8a070','#6a6a40','',40,90,3,.6,40,.4],['大頭鰱',[1],'#a8b0b8','#5a6a7a','spot',50,100,4,.7,35,.3],
  ['黑鯛',[2],'#5a6070','#2a2a3a','stripe',20,45,2,.45,55,.6],['花身雞魚',[2,3],'#c8c0a0','#3a3a2a','stripe',15,30,1,.3,60,.4],['臭肚魚',[2],'#a89a70','#6a5a3a','spot',15,30,1,.3,55,.5],['白毛',[2],'#c8d0d8','#8a9aa8','',20,40,2,.4,60,.7],
  ['花跳',[3],'#8a7a5a','#3a8ad8','spot',8,15,1,.15,70,.9],['紅樹林蟳',[3],'#8a4a2a','#c87a3a','crab',10,20,3,.5,30,1],['金錢魚',[3,2],'#c8b048','#3a3a2a','spot',10,25,2,.35,50,.5],['鯔魚',[3],'#9aa8b0','#5a6a78','stripe',30,60,3,.55,60,.3],
  ['鬼頭刀',[4],'#3ac87a','#ffd23f','',60,120,3,.8,90,.2],['黃鰭鮪',[4,7],'#2a4a8a','#ffd23f','',80,160,4,.95,100,.4],['紅甘',[4],'#c8b080','#e8c040','stripe',50,100,3,.75,85,.5],['白帶魚',[4,6],'#e8f0f8','#b8c8d8','',60,120,2,.5,70,.6],
  ['虹鱒',[5],'#9ab0a0','#ff7aa8','spot',25,50,2,.45,55,.5],['西太公魚',[5],'#c8d8e8','#8aa8c8','',8,14,1,.15,60,.6],['紅點鮭',[5],'#7a8a7a','#ff5a5a','spot',30,60,4,.6,50,.7],['冰魚',[5],'#e8f4ff','#a8c8e8','',10,20,3,.25,45,.8],
  ['烏賊',[6],'#e8d0c0','#c87a7a','spot',15,35,2,.35,40,.4],['海鰻',[6,7],'#5a4a3a','#3a2a1a','',60,140,4,.85,45,.9],['石斑',[6,2],'#8a6a4a','#5a3a2a','spot',30,70,3,.6,40,.9],['夜光魚',[6],'#2a4a8a','#7affff','glow',10,20,4,.3,60,.6],
  ['燈籠魚',[7],'#3a2a4a','#7affd8','glow',8,15,3,.25,50,.9],['旗魚',[7,4],'#2a4a7a','#7aa8d8','',150,280,5,1,110,.3],['翻車魚',[7],'#a8b0b8','#7a8a98','',80,180,5,.7,25,.5],['龍王鯛',[7],'#d82a3a','#ffd23f','stripe',40,80,5,.8,55,.8]
].map((f,id)=>({id,n:f[0],spots:f[1],col:f[2],col2:f[3],pat:f[4],l0:f[5],l1:f[6],rar:f[7],str:f[8],spd:f[9],dep:f[10]}));
const GOALT=['count','weight','species','big'];
function levelOf(i){ const m=Math.floor(i/25),j=i%25,k=i/(LV-1),R=mul(i*331+9),pool=FISH.filter(f=>f.spots.includes(m)),com=pool.filter(f=>f.rar<=2).length?pool.filter(f=>f.rar<=2):pool,avgW=com.reduce((a,f)=>a+wOf(f,lerp(f.l0,f.l1,.35)),0)/com.length,type=i<3?'count':GOALT[(i+Math.floor(i/4))%4];
  let goal; if(type==='count') goal={type,n:Math.min(9,2+Math.floor(j/4)+Math.floor(k*3))};
  else if(type==='weight'){ goal={type,kg:+Math.max(.2,avgW*(2+j*.08+k*1.5)).toFixed(1)}; }
  else if(type==='species'){ const cand=pool.filter(f=>f.rar<=2+Math.floor(k*3.5)); const f=cand[Math.floor(R()*cand.length)]; goal={type,fish:f.id,n:1+(f.rar<=2&&j>12?1:0)}; }
  else { const f=pool.filter(q=>q.rar<=3)[Math.floor(R()*pool.filter(q=>q.rar<=3).length)]; goal={type,cm:Math.round(lerp(f.l0,f.l1,.3+.3*k)),f:f.id}; }
  const need=goal.type==='count'?goal.n:goal.type==='weight'?Math.ceil(goal.kg/avgW):goal.type==='species'?Math.ceil(goal.n*(1+FISH[goal.fish].rar*.5)):4;
  return {i,m,k,pool,goal,bait:need+Math.ceil(need*(.65-.4*k))+(i<10?2:1),window:+(1.5-.75*k).toFixed(2),pow:.55+.6*k,name:SPOTS[m].n+' '+(j+1),stars:Math.min(5,1+Math.floor(i/40))}; }
function wOf(f,cm){ return Math.max(.02,+(Math.pow(cm/10,3)*.012*(f.n.includes('鰻')||f.n.includes('帶')?.35:1)).toFixed(2)); }
function goalText(L){ const g=L.goal; return g.type==='count'?'釣到 '+g.n+' 條魚':g.type==='weight'?'總重量到 '+g.kg+' 公斤':g.type==='species'?'釣到 '+g.n+' 條「'+FISH[g.fish].n+'」':'釣到一條 '+g.cm+' 公分以上的魚'; }
const recKey=i=>'arcade.fish.s.'+i,getRec=i=>{ const v=LS(recKey(i)); return v==null?null:+v; };
const dex=()=>{ try{ return JSON.parse(LS('arcade.fish.dex')||'{}'); }catch(e){ return {}; } };

/* ---------- 畫圖 ---------- */
function drawFish(c,f,x,y,len,face,t,glowA){ const s=clamp(.55+len/45,.75,2.2),wig=Math.sin(t*10+x*.05)*.18; c.save(); c.translate(x,y); c.scale(face*s,s);
  if(f.pat==='crab'){ c.fillStyle=f.col; c.strokeStyle='#2a1a10'; c.lineWidth=1.5; c.beginPath(); c.ellipse(0,0,14,9,0,0,TAU); c.fill(); c.stroke(); for(const sx of [-1,1]){ c.beginPath(); c.arc(sx*16,-6,5,0,TAU); c.fill(); c.stroke(); for(let j=0;j<3;j++){ c.beginPath(); c.moveTo(sx*10,2+j*3); c.lineTo(sx*18,6+j*4); c.stroke(); } } c.fillStyle='#111'; c.beginPath(); c.arc(-4,-8,2,0,TAU); c.arc(4,-8,2,0,TAU); c.fill(); c.restore(); return; }
  if(f.pat==='glow'||glowA){ const g=c.createRadialGradient(0,0,2,0,0,30); g.addColorStop(0,'rgba(120,255,240,.45)'); g.addColorStop(1,'rgba(120,255,240,0)'); c.fillStyle=g; c.fillRect(-30,-30,60,60); }
  c.fillStyle=f.col; c.strokeStyle='rgba(20,20,30,.7)'; c.lineWidth=1.4;
  c.beginPath(); c.moveTo(-14,0); c.lineTo(-24,-9+wig*20); c.lineTo(-22,0); c.lineTo(-24,9+wig*20); c.closePath(); c.fill(); c.stroke(); // 尾巴
  c.beginPath(); c.ellipse(0,0,16,f.n.includes('鰻')||f.n.includes('帶')?4.5:8,0,0,TAU); c.fill(); c.stroke();
  c.fillStyle=f.col2; c.beginPath(); c.moveTo(-4,-7); c.quadraticCurveTo(2,-14,8,-7); c.fill();
  if(f.pat==='stripe'){ c.strokeStyle=f.col2; c.lineWidth=2; for(let j=-6;j<=6;j+=5){ c.beginPath(); c.moveTo(j,-6); c.lineTo(j-2,6); c.stroke(); } }
  if(f.pat==='spot'){ c.fillStyle=f.col2; for(const [a,b] of [[-6,-2],[0,3],[5,-3],[-2,-4],[7,2]]){ c.beginPath(); c.arc(a,b,1.6,0,TAU); c.fill(); } }
  c.fillStyle='rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(2,-3,8,2.5,0,0,TAU); c.fill();
  c.fillStyle='#fff'; c.beginPath(); c.arc(9,-2,3,0,TAU); c.fill(); c.fillStyle='#111'; c.beginPath(); c.arc(9.8,-2,1.6,0,TAU); c.fill(); c.restore(); }
function drawAngler(c,x,y,t,pose,look){ const INK='#2a1a26',skin='#ffe0c8',bob=Math.sin(t*2)*1.5; c.lineWidth=2.4; c.strokeStyle=INK;
  c.fillStyle=look.col; rr(c,x-22,y-50+bob,44,40,12); c.fill(); c.stroke(); c.fillStyle='#3a5a8a'; rr(c,x-20,y-14,40,14,5); c.fill(); c.stroke();
  c.fillStyle='#fff'; for(const s of [-1,1]){ c.beginPath(); c.ellipse(x+s*10,y+2,10,6,0,0,TAU); c.fill(); c.stroke(); }
  c.fillStyle=skin; c.beginPath(); c.arc(x,y-76+bob,27,0,TAU); c.fill(); c.stroke();
  c.fillStyle=look.hat; c.beginPath(); c.ellipse(x,y-94+bob,40,9,0,0,TAU); c.fill(); c.stroke(); c.beginPath(); c.arc(x,y-96+bob,22,Math.PI,0); c.fill(); c.stroke();
  const blink=(t*.6)%3.5<.12; for(const s of [-1,1]){ if(blink){ c.beginPath(); c.moveTo(x+5+s*9-4,y-74+bob); c.lineTo(x+5+s*9+4,y-74+bob); c.stroke(); } else { c.fillStyle=INK; c.beginPath(); c.ellipse(x+5+s*9,y-74+bob,4,5.5,0,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(x+3.5+s*9,y-76+bob,1.6,0,TAU); c.fill(); } }
  c.fillStyle='rgba(255,110,140,.45)'; c.beginPath(); c.ellipse(x-10,y-64+bob,5,3,0,0,TAU); c.ellipse(x+20,y-64+bob,5,3,0,0,TAU); c.fill();
  c.beginPath(); if(pose==='happy'){ c.arc(x+5,y-63+bob,6,0,Math.PI); } else { c.arc(x+2,y-62+bob,3,0,Math.PI); c.arc(x+8,y-62+bob,3,0,Math.PI); } c.stroke();
  c.fillStyle=skin; c.beginPath(); c.arc(x+20,y-38+bob,7,0,TAU); c.fill(); c.stroke(); }
const BGC={};
function sceneBg(m){ if(BGC[m]) return BGC[m]; const e=document.createElement('canvas'); e.width=W; e.height=H; const c=e.getContext('2d'),S=SPOTS[m],R=mul(m*91+5);
  let g=c.createLinearGradient(0,0,0,SURF); g.addColorStop(0,S.sky[0]); g.addColorStop(1,S.sky[1]); c.fillStyle=g; c.fillRect(0,0,W,SURF);
  if(S.deco==='night'){ c.fillStyle='#fff'; for(let i=0;i<60;i++){ c.globalAlpha=.3+R()*.7; c.fillRect(R()*W,R()*140,1.6,1.6); } c.globalAlpha=1; c.fillStyle='#fff8d0'; c.beginPath(); c.arc(650,50,24,0,TAU); c.fill(); }
  else { c.fillStyle='rgba(255,255,255,.85)'; for(const [x,y,s] of [[300,50,1],[560,30,1.3],[720,70,.8]]){ c.beginPath(); c.arc(x,y,18*s,0,TAU); c.arc(x+20*s,y+5,14*s,0,TAU); c.arc(x-18*s,y+6,12*s,0,TAU); c.fill(); } }
  // 遠景
  if(S.deco==='rock'||S.deco==='reed'||S.deco==='mangrove'){ c.fillStyle=S.deco==='mangrove'?'#3a6a3a':'#5a8a5a'; c.beginPath(); c.moveTo(0,SURF); for(let x=0;x<=W;x+=40) c.lineTo(x,SURF-30-Math.sin(x*.012+m)*20-R()*10); c.lineTo(W,SURF); c.fill(); }
  if(S.deco==='pier'||S.deco==='night'){ for(let i=0;i<4;i++){ const x=420+i*90; c.fillStyle=S.deco==='night'?'#1a1a2a':'#7a8a9a'; c.fillRect(x,SURF-50-i*6,60,50+i*6); c.fillStyle=S.deco==='night'?'#ffd23f':'#c8d8e8'; c.fillRect(x+10,SURF-40,10,8); c.fillRect(x+34,SURF-40,10,8); } }
  if(S.deco==='ice'){ c.fillStyle='#e8f0f8'; c.beginPath(); c.moveTo(0,SURF); for(let x=0;x<=W;x+=60) c.lineTo(x,SURF-40-((x*7)%30)); c.lineTo(W,SURF); c.fill(); }
  // 水
  g=c.createLinearGradient(0,SURF,0,H); g.addColorStop(0,S.water[0]); g.addColorStop(1,S.water[1]); c.fillStyle=g; c.fillRect(0,SURF,W,H-SURF);
  c.fillStyle='rgba(255,255,255,.07)'; for(let i=0;i<6;i++){ const x=150+i*120; c.beginPath(); c.moveTo(x,SURF); c.lineTo(x+40,SURF); c.lineTo(x-40,H); c.lineTo(x-90,H); c.fill(); }
  // 水底
  c.fillStyle=S.deco==='deep'?'#0a1428':'#c8b080'; c.beginPath(); c.moveTo(0,H); for(let x=0;x<=W;x+=30) c.lineTo(x,BOT+8+Math.sin(x*.03+m)*6); c.lineTo(W,H); c.fill();
  for(let i=0;i<9;i++){ const x=160+R()*620,hh=30+R()*60; c.strokeStyle=S.deco==='deep'?'#2a4a5a':'#3a8a4a'; c.lineWidth=4; c.beginPath(); c.moveTo(x,BOT+10); c.quadraticCurveTo(x+10,BOT-hh/2,x-4,BOT-hh); c.stroke(); }
  for(let i=0;i<5;i++){ const x=180+R()*600; c.fillStyle='#6a6a70'; c.beginPath(); c.ellipse(x,BOT+8,14+R()*14,9,0,0,TAU); c.fill(); }
  // 岸／碼頭／船／冰
  if(S.deco==='boat'||S.deco==='deep'){ c.fillStyle='#c8402a'; c.beginPath(); c.moveTo(20,SURF-24); c.lineTo(200,SURF-24); c.lineTo(180,SURF+14); c.lineTo(40,SURF+14); c.closePath(); c.fill(); c.fillStyle='#f4f0e8'; c.fillRect(20,SURF-30,180,8); }
  else if(S.deco==='ice'){ c.fillStyle='#f4f8ff'; c.fillRect(0,SURF-10,210,24); c.fillStyle='#d8e8f8'; c.fillRect(0,SURF+10,210,10); }
  else if(S.land){ c.fillStyle='#8a6a42'; c.fillRect(0,SURF-18,200,16); for(let x=10;x<200;x+=40){ c.fillStyle='#6a4a2a'; c.fillRect(x,SURF-6,8,60); } c.fillStyle=S.land; c.fillRect(0,SURF-24,60,24); }
  return BGC[m]=e; }

/* ---------- 遊戲 ---------- */
function create(env,opts){
  const si=clamp(opts.stage|0,0,LV-1),L=levelOf(si),{ctx:c,canvas}=env.canvas2d(W,H),R=mul(si*977+(Date.now()%1000)),look=Object.assign({col:'#4f9dff',hat:'#ffd23f'},opts.look||{});
  const AX=lerp(200,740,.55); let aim={x:AX,y:lerp(SURF+40,BOT-20,.5)},phase='aim',t=0,bait=L.bait,caught=[],fx=[],ended=false,introT=2.4,endT=0,card=null,msg='',msgT=0;
  const hook={x:0,y:0,ty:0,bx:0,by:0,flyT:0,sx:0,sy:0};
  let bite=null,fight=null; const fishes=[];
  function pickFish(){ const pool=L.pool,wts=pool.map(f=>Math.pow(.42,f.rar-1)*(L.goal.type==='species'&&L.goal.fish===f.id?1.6:1)); let s=wts.reduce((a,b)=>a+b,0)*R(); for(let i=0;i<pool.length;i++){ s-=wts[i]; if(s<=0) return pool[i]; } return pool[0]; }
  function addFish(x){ const f=pickFish(),len=Math.round(lerp(f.l0,f.l1,Math.pow(R(),1.6-.6*L.k))),d=clamp(f.dep+(R()-.5)*.3,0,1); fishes.push({f,len,x:x!=null?x:200+R()*560,y:lerp(SURF+30,BOT-20,d),vx:(R()<.5?-1:1)*f.spd*(.5+R()*.5),face:1,ty:0,cool:R()*2,scare:0}); }
  for(let i=0;i<7+Math.floor(L.k*3);i++) addFish();
  const pop=(txt,col,x,y)=>fx.push({k:'txt',txt,col,x,y,t:0});
  function castTo(x,y){ if(phase!=='aim'||introT>0||ended||bait<=0||done()) return; aim.x=clamp(x,210,770); aim.y=clamp(y,SURF+30,BOT-14); phase='fly'; hook.flyT=0; hook.sx=ROD.x+40; hook.sy=ROD.y; bait--; env.sfx('spring'); }
  function reelEmpty(){ phase='aim'; bite=null; env.sfx('click'); }
  // 點水面＝往那裡拋（點的深度就是魚鉤沉到的深度）
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const pd=e=>{ const [x,y]=toG(e); if(phase==='aim'&&y>SURF&&x>200) castTo(x,y); else if(phase==='wait') press(); };
  canvas.addEventListener('pointerdown',pd); canvas.style.touchAction='none';
  function press(){ if(phase==='aim') castTo(aim.x,aim.y); else if(phase==='wait'){ if(bite&&bite.st==='bite'){ startFight(bite.fish); } else if(bite&&bite.st==='nib'){ bite.fish.scare=2.5; bite.fish.vx=Math.sign(bite.fish.x-hook.x||1)*bite.fish.f.spd*2.5; bite=null; pop('太早了，魚跑掉了','#ffd23f',hook.x,hook.y-40); env.sfx('bump'); } else { pop('收竿','#fff',hook.x,SURF-20); reelEmpty(); } } }
  function startFight(F){ const i=fishes.indexOf(F); if(i>=0) fishes.splice(i,1); bite=null; phase='fight'; const pw=clamp(F.f.str*L.pow+F.len/(F.f.l1*4),0,1.2);
    fight={F,dist:1,ten:.25,stam:1,pull:0,pullT:.6,pw,rest:0}; env.sfx('item'); pop('上鉤了！','#ffd23f',hook.x,hook.y-40); fx.push({k:'splash',x:hook.x,y:SURF,t:0}); }
  function landFish(){ const F=fight.F,w=wOf(F.f,F.len),d=dex(),isNew=d[F.f.id]==null,rec=!isNew&&F.len>d[F.f.id]; if(isNew||rec){ d[F.f.id]=F.len; LS('arcade.fish.dex',JSON.stringify(d)); }
    caught.push({f:F.f,len:F.len,w}); card={F,w,isNew,rec,t:0}; phase='card'; fight=null; env.sfx('lap'); for(let i=0;i<14;i++) fx.push({k:'drop',x:ROD.x+60,y:SURF-10,vx:(Math.random()-.5)*240,vy:-200-Math.random()*200,t:0}); addFish(); }
  function lose(why){ pop(why,'#ff8a8a',hook.x,SURF-30); env.sfx('hurt'); fight=null; phase='aim'; addFish(); }
  function progress(){ const g=L.goal; if(g.type==='count') return [caught.length,g.n]; if(g.type==='weight') return [+caught.reduce((a,q)=>a+q.w,0).toFixed(1),g.kg]; if(g.type==='species') return [caught.filter(q=>q.f.id===g.fish).length,g.n]; return [Math.max(0,...caught.map(q=>q.len)),g.cm]; }
  const done=()=>{ const [a,b]=progress(); return a>=b; };
  function finish(){ if(ended) return; ended=true; const ok=done(),left=bait,stars=!ok?0:left>=Math.ceil(L.bait*.4)?3:left>=1?2:1; if(ok){ const o=getRec(si); if(o==null||stars>o) LS(recKey(si),stars); } env.sfx(ok?'win':'lose');
    const big=caught.reduce((a,q)=>!a||q.len>a.len?q:a,null),d=dex();
    env.end({title:ok?'任務完成！':'餌用完了…',big:ok?'★'.repeat(stars)+'☆'.repeat(3-stars):progress()[0]+' / '+progress()[1],text:L.name+'：'+goalText(L)+'。釣到 '+caught.length+' 條'+(big?'，最大是 '+big.f.n+' '+big.len+' 公分':'')+'。圖鑑 '+Object.keys(d).length+' / '+FISH.length+'。',score:ok?si+1:null,next:ok&&si<LV-1}); }
  function update(dt){ t+=dt; if(introT>0) introT-=dt; if(msgT>0) msgT-=dt; const k=env.keys,act=env.hit('Space')||env.hit('Enter')||env.hit('KeyJ');
    for(const f of fx){ f.t+=dt; if(f.k==='drop'){ f.vy+=600*dt; f.x+=f.vx*dt; f.y+=f.vy*dt; } } for(let i=fx.length-1;i>=0;i--) if(fx[i].t>1.4) fx.splice(i,1);
    // 魚游來游去
    for(const F of fishes){ if(F.scare>0) F.scare-=dt; if(F.cool>0) F.cool-=dt; F.ty+=dt; const drift=Math.sin(F.ty*.8+F.len)*12;
      if(bite&&bite.fish===F){ F.x+=(hook.x-12*F.face-F.x)*Math.min(1,dt*4); F.y+=(hook.y+4-F.y)*Math.min(1,dt*4); continue; }
      F.x+=F.vx*dt; F.y+=drift*dt; if(F.x<210){ F.x=210; F.vx=Math.abs(F.vx); } if(F.x>W-10){ F.x=W-10; F.vx=-Math.abs(F.vx); } F.y=clamp(F.y,SURF+24,BOT-10); F.face=F.vx>=0?1:-1;
      if(phase==='wait'&&!bite&&F.scare<=0&&F.cool<=0){ const dx=hook.x-F.x,dy=hook.y-F.y,d=Math.hypot(dx,dy); if(d<150){ F.vx+=Math.sign(dx)*40*dt; F.vx=clamp(F.vx,-F.f.spd,F.f.spd); F.y+=Math.sign(dy)*30*dt; if(d<26){ bite={fish:F,st:'nib',n:1+Math.floor(R()*3+L.k*2),t:.5+R()*.6}; F.face=dx>=0?1:-1; } } } }
    if(phase==='aim'){ aim.x=clamp(aim.x+((k.ArrowRight||k.KeyD?1:0)-(k.ArrowLeft||k.KeyA?1:0))*320*dt,210,770); aim.y=clamp(aim.y+((k.ArrowDown||k.KeyS?1:0)-(k.ArrowUp||k.KeyW?1:0))*180*dt,SURF+30,BOT-14);
      if(bait<=0||done()){ endT+=dt; if(endT>.6) finish(); return; } if(act) press(); return; }
    if(phase==='fly'){ hook.flyT+=dt*1.6; const u=Math.min(1,hook.flyT); hook.x=lerp(hook.sx,aim.x,u); hook.y=lerp(hook.sy,SURF,u)-Math.sin(u*Math.PI)*80; if(u>=1){ phase='sink'; hook.y=SURF; env.sfx('pop'); fx.push({k:'splash',x:aim.x,y:SURF,t:0}); } return; }
    if(phase==='sink'){ hook.y=Math.min(aim.y,hook.y+120*dt); if(hook.y>=aim.y){ phase='wait'; } if(act) press(); return; }
    if(phase==='wait'){ hook.y=clamp(hook.y+((k.ArrowDown||k.KeyS?1:0)-(k.ArrowUp||k.KeyW?1:0))*120*dt,SURF+30,BOT-14);
      if(bite){ bite.t-=dt; if(bite.st==='nib'&&bite.t<=0){ bite.n--; env.sfx('click'); if(bite.n<=0){ bite.st='bite'; bite.t=L.window; env.sfx('beep'); } else bite.t=.45+R()*.5; }
        else if(bite.st==='bite'&&bite.t<=0){ const F=bite.fish; F.scare=3; F.cool=2; F.vx=-F.face*F.f.spd*2; bite=null; pop('魚把餌吃掉跑了','#ffd23f',hook.x,SURF-24); bait=Math.max(0,bait); } }
      if(act) press(); return; }
    if(phase==='fight'){ const F=fight,hold=!!(k.Space||k.Enter||k.KeyJ); F.pullT-=dt; if(F.pullT<=0){ F.pull=F.pull?0:1; F.pullT=F.pull?.5+R()*.9:.7+R()*1.1; }
      const p=F.pull?F.pw*(.55+.45*F.stam):0;
      if(hold){ F.dist-=(F.pull?.06:.22)*dt*(1.2-.5*F.pw); F.ten+=(F.pull?.85*p+.12:.02)*dt*1.6; if(F.pull) F.stam=Math.max(.15,F.stam-.08*dt); }
      else { F.ten=Math.max(0,F.ten-.55*dt); if(F.pull) F.dist+=p*.16*dt; }
      if(!F.pull) F.ten=Math.max(0,F.ten-(hold?0:.2)*dt);
      hook.x=lerp(ROD.x+70,aim.x,clamp(F.dist,0,1))+Math.sin(t*9)*F.pull*10; hook.y=lerp(SURF+6,F.F.y||aim.y,clamp(F.dist,0,1));
      if(F.ten>=1) lose('線斷了！拉力太大'); else if(F.dist>1.35) lose('魚掙脫跑掉了'); else if(F.dist<=0) landFish(); return; }
    if(phase==='card'){ card.t+=dt; if(card.t>2.2||(card.t>.6&&act)){ card=null; phase='aim'; } } }
  function line(c,x0,y0,x1,y1,sag){ c.strokeStyle='rgba(255,255,255,.75)'; c.lineWidth=1.3; c.beginPath(); c.moveTo(x0,y0); c.quadraticCurveTo((x0+x1)/2,Math.max(y0,y1)+sag,x1,y1); c.stroke(); }
  function draw(){ const S=SPOTS[L.m]; c.drawImage(sceneBg(L.m),0,0);
    // 水面波紋
    c.strokeStyle='rgba(255,255,255,.4)'; c.lineWidth=1.5; c.beginPath(); for(let x=0;x<=W;x+=6) c.lineTo(x,SURF+Math.sin(x*.05+t*2)*2); c.stroke();
    for(const F of fishes) drawFish(c,F.f,F.x,F.y,F.len,F.face,t,S.deco==='night'||S.deco==='deep');
    const bobY=phase==='fight'?SURF:SURF+(bite?(bite.st==='bite'?14:Math.sin(t*20)*3):Math.sin(t*2)*1.5);
    // 釣客＋釣竿＋線
    const ax=60,ay=SURF-20; drawAngler(c,ax,ay,t,card?'happy':'',look); const bend=phase==='fight'?(fight.pull?22:10):0,tipX=ROD.x+60,tipY=ROD.y-10+bend;
    c.strokeStyle='#5a3a20'; c.lineWidth=4; c.beginPath(); c.moveTo(ax+20,ay-38); c.quadraticCurveTo(ax+60,ay-90+bend*.5,tipX,tipY); c.stroke();
    if(phase==='aim'){ c.strokeStyle='rgba(255,255,255,.75)'; c.setLineDash([6,6]); c.lineWidth=2; c.beginPath(); c.moveTo(aim.x,SURF); c.lineTo(aim.x,aim.y); c.stroke(); c.setLineDash([]); c.strokeStyle='#ffd23f'; c.lineWidth=3; c.beginPath(); c.arc(aim.x,aim.y,12,0,TAU); c.stroke(); c.beginPath(); c.moveTo(aim.x-18,aim.y); c.lineTo(aim.x+18,aim.y); c.moveTo(aim.x,aim.y-18); c.lineTo(aim.x,aim.y+18); c.stroke(); line(c,tipX,tipY,tipX+4,tipY+40,0); }
    else if(phase==='fly'){ line(c,tipX,tipY,hook.x,hook.y,10); c.fillStyle='#ff5d5d'; c.beginPath(); c.arc(hook.x,hook.y,6,0,TAU); c.fill(); }
    else if(phase==='sink'||phase==='wait'){ const bx=hook.x; line(c,tipX,tipY,bx,bobY-6,30); c.fillStyle='#fff'; c.beginPath(); c.arc(bx,bobY-4,6,Math.PI,0); c.fill(); c.fillStyle='#ff4a3a'; c.beginPath(); c.arc(bx,bobY-4,6,0,Math.PI); c.fill(); c.strokeStyle='#2a1a26'; c.lineWidth=1.2; c.beginPath(); c.arc(bx,bobY-4,6,0,TAU); c.stroke();
      c.strokeStyle='rgba(255,255,255,.5)'; c.lineWidth=1; c.beginPath(); c.moveTo(bx,bobY); c.lineTo(hook.x,hook.y); c.stroke(); c.strokeStyle='#c8c8d0'; c.lineWidth=1.8; c.beginPath(); c.arc(hook.x,hook.y-3,4,0,Math.PI); c.stroke(); c.fillStyle='#e8a060'; c.beginPath(); c.arc(hook.x+2,hook.y+2,3,0,TAU); c.fill();
      if(bite&&bite.st==='bite'){ c.font='900 40px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=7; c.strokeStyle='#14122b'; c.strokeText('！',bx,bobY-46); c.fillStyle='#ff5d5d'; c.fillText('！',bx,bobY-46); c.strokeStyle='rgba(255,255,255,'+(.5+.5*Math.sin(t*20))+')'; c.lineWidth=3; c.beginPath(); c.ellipse(bx,SURF+2,22+Math.sin(t*20)*4,6,0,0,TAU); c.stroke(); } }
    else if(phase==='fight'){ const F=fight; line(c,tipX,tipY,hook.x,hook.y,4); drawFish(c,F.F.f,hook.x+8,hook.y+6,F.F.len,-1,t*2); if(F.pull){ c.fillStyle='rgba(255,255,255,.6)'; for(let i=0;i<5;i++){ c.beginPath(); c.arc(hook.x+Math.sin(t*15+i)*16,SURF-((t*60+i*8)%20),3,0,TAU); c.fill(); } }
      // 拉力條、距離
      const bx=W/2-160,by=60; c.fillStyle='rgba(11,10,28,.82)'; rr(c,bx-10,by-14,340,74,14); c.fill(); c.fillStyle='#fff'; c.font='900 15px '+TC; c.textAlign='left'; c.textBaseline='middle'; c.fillText('拉力',bx,by+6); c.fillText('距離',bx,by+36);
      const tg=c.createLinearGradient(bx+44,0,bx+314,0); tg.addColorStop(0,'#5fd068'); tg.addColorStop(.65,'#ffd23f'); tg.addColorStop(.85,'#ff5d5d'); c.fillStyle='rgba(255,255,255,.15)'; rr(c,bx+44,by-2,270,16,8); c.fill(); c.fillStyle=tg; rr(c,bx+44,by-2,270*clamp(F.ten,0,1),16,8); c.fill();
      c.fillStyle='rgba(255,255,255,.15)'; rr(c,bx+44,by+28,270,16,8); c.fill(); c.fillStyle='#3ddbd9'; rr(c,bx+44,by+28,270*clamp(1-F.dist,0,1),16,8); c.fill();
      c.textAlign='center'; c.font='900 18px '+TC; c.lineWidth=5; c.strokeStyle='#14122b'; const tip=F.ten>.8?'放開！拉力快爆了':F.pull?'魚在掙扎，小心收':'趁現在，用力收線！'; c.strokeText(tip,W/2,148); c.fillStyle=F.ten>.8?'#ff5d5d':F.pull?'#ffd23f':'#86dc4f'; c.fillText(tip,W/2,148); }
    for(const f of fx){ const a=1-f.t/1.4; if(f.k==='txt'){ c.globalAlpha=clamp(a*2,0,1); c.font='900 20px '+TC; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='#14122b'; c.strokeText(f.txt,f.x,f.y-f.t*24); c.fillStyle=f.col; c.fillText(f.txt,f.x,f.y-f.t*24); c.globalAlpha=1; }
      else if(f.k==='splash'){ c.strokeStyle='rgba(255,255,255,'+a+')'; c.lineWidth=2.5; c.beginPath(); c.ellipse(f.x,f.y,8+f.t*50,3+f.t*10,0,0,TAU); c.stroke(); for(let i=0;i<6;i++){ c.fillStyle='rgba(255,255,255,'+a+')'; c.beginPath(); c.arc(f.x+(i-2.5)*8*(1+f.t*3),f.y-Math.sin(Math.min(1,f.t*3)*Math.PI)*30*(1-Math.abs(i-2.5)/4),2.5,0,TAU); c.fill(); } }
      else if(f.k==='drop'){ c.fillStyle='rgba(200,240,255,'+a+')'; c.beginPath(); c.arc(f.x,f.y,3,0,TAU); c.fill(); } }
    // 上方資訊
    c.fillStyle='rgba(11,10,28,.8)'; rr(c,W-286,8,278,62,12); c.fill(); c.textAlign='left'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 15px '+TC; c.fillText(L.name,W-274,24,260); c.fillStyle='#fff'; c.font='700 14px '+TC; const [pa,pb]=progress(); c.fillText(goalText(L)+'　'+pa+' / '+pb,W-274,46,260);
    c.fillStyle='#cfd2e8'; c.font='700 13px '+TC; c.fillText('餌 ×'+bait,W-274,62); for(let i=0;i<Math.min(bait,12);i++){ c.fillStyle='#e8a060'; c.beginPath(); c.arc(W-214+i*14,62,4.5,0,TAU); c.fill(); }
    if(caught.length){ c.fillStyle='rgba(11,10,28,.6)'; rr(c,224,8,250,34,10); c.fill(); caught.slice(-6).forEach((q,i)=>drawFish(c,q.f,248+i*40,25,22,1,t)); }
    if(phase==='aim'&&introT<=0&&!ended){ const tch=document.body.classList.contains('touch'); c.fillStyle='rgba(11,10,28,.72)'; rr(c,W/2-210,H-40,420,30,15); c.fill(); c.fillStyle='#fff'; c.font='700 15px '+TC; c.textAlign='center'; c.fillText(tch?'點水面拋竿（點越深，魚鉤沉越深）':'← → ↑ ↓ 瞄準位置和深度，空白鍵拋竿',W/2,H-25); }
    if(phase==='wait'&&!bite){ c.fillStyle='rgba(11,10,28,.6)'; rr(c,W/2-170,H-40,340,30,15); c.fill(); c.fillStyle='#cfd2e8'; c.font='700 14px '+TC; c.textAlign='center'; c.fillText('等魚咬鉤…浮標沉下、出現「！」就按',W/2,H-25); }
    if(card){ const F=card.F; c.fillStyle='rgba(11,10,28,.86)'; rr(c,W/2-190,150,380,170,18); c.fill(); c.strokeStyle='#ffd23f'; c.lineWidth=3; c.stroke(); drawFish(c,F.f,W/2,222,Math.min(90,F.len),1,t); c.textAlign='center'; c.fillStyle='#ffd23f'; c.font='900 24px '+TC; c.fillText(F.f.n+'　'+'★'.repeat(F.f.rar),W/2,270); c.fillStyle='#fff'; c.font='700 16px '+TC; c.fillText(F.len+' 公分・'+card.w+' 公斤'+(card.isNew?'　🆕 新魚種！':card.rec?'　🏆 最大紀錄！':''),W/2,298); }
    if(introT>0){ c.fillStyle='rgba(11,10,28,.84)'; rr(c,W/2-250,170,500,96,18); c.fill(); c.textAlign='center'; c.fillStyle='#ffd23f'; c.font='900 26px '+TC; c.fillText('第 '+(si+1)+' 關　'+L.name,W/2,204); c.fillStyle='#fff'; c.font='700 17px '+TC; c.fillText('目標：'+goalText(L)+'（餌 '+L.bait+' 個）',W/2,240,480); } }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',pd); },_dbg:{L,fishes,hook,aim,castTo,press,get phase(){ return phase; },get bite(){ return bite; },get fight(){ return fight; },get bait(){ return bait; },caught,get ended(){ return ended; }}};
}

function stageShow(c,w,h,si,t){ const L=levelOf(si); c.save(); c.scale(w/W,h/H); c.drawImage(sceneBg(L.m),0,0); L.pool.forEach((f,i)=>{ const x=240+((i*130+t*30*(i%2?1:-1))%560+560)%560,y=lerp(SURF+40,BOT-30,f.dep); drawFish(c,f,x,y,(f.l0+f.l1)/2,i%2?1:-1,t,L.m>=6); });
  drawAngler(c,60,SURF-20,t,'',{col:'#4f9dff',hat:'#ffd23f'}); c.strokeStyle='#5a3a20'; c.lineWidth=4; c.beginPath(); c.moveTo(80,SURF-58); c.quadraticCurveTo(120,SURF-110,178,ROD.y-10); c.stroke(); c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=1.3; c.beginPath(); c.moveTo(178,ROD.y-10); c.quadraticCurveTo(300,SURF+20,420,SURF); c.stroke();
  c.fillStyle='rgba(11,10,28,.78)'; rr(c,W/2-230,10,460,46,14); c.fill(); c.fillStyle='#ffd23f'; c.font='900 20px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(L.name+'：'+goalText(L),W/2,33,440); c.restore(); }
function preview(c,w,h,Lk,t){ c.save(); c.scale(w/W,h/H); c.drawImage(sceneBg(0),0,0); drawAngler(c,W/2,SURF-20,t,'happy',Object.assign({col:'#4f9dff',hat:'#ffd23f'},Lk||{})); c.restore(); }
function thumb(c,w,h,t){ stageShow(c,w,h,30,t); c.save(); c.scale(w/W,h/H); c.font='900 56px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=10; c.strokeStyle='#14385a'; c.strokeText('釣魚小日子',W/2+60,120); c.fillStyle='#fff'; c.fillText('釣魚小日子',W/2+60,120); c.restore(); }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).fish={
  name:'釣魚小日子',tag:'LAZY FISHING DAYS',color:'#3ddbd9',
  desc:'到溪邊、湖畔、漁港、外海、冰湖、深海釣魚！浮標沉下去就鉤住，收線時拉力太大會斷線，要收收放放。32 種魚可以收集進圖鑑，8 個釣點共 200 關。',
  goal:'在餌用完前達成這關的目標（釣幾條、總重量、指定的魚或大魚）就過關，剩越多餌星星越多。',
  stages:Array.from({length:LV},(_,i)=>levelOf(i).name),stars:Array.from({length:LV},(_,i)=>levelOf(i).stars),
  stageGoal:i=>{ const L=levelOf(i); return L.name+'：'+goalText(L)+'（餌 '+L.bait+' 個）。這裡的魚：'+L.pool.map(f=>f.n).join('、')+'。'; },
  stageLocked:i=>i>0&&getRec(i-1)==null,stageBest:i=>{ const v=getRec(i); return v?'★'.repeat(v)+'☆'.repeat(3-v):''; },
  hubBest:()=>{ let n=0; for(let i=0;i<LV;i++) if(getRec(i)!=null) n++; const d=Object.keys(dex()).length; return n||d?'過關 <b>'+n+' / '+LV+'</b>　圖鑑 '+d+' / '+FISH.length:'尚無紀錄'; },
  help:[['← → ↑ ↓','瞄準拋竿的位置和深度（也可以直接點水面）'],['空白鍵','拋竿；出現「！」時按一下鉤住'],['按住空白鍵','收線；拉力變紅就放開，等魚累了再收']],
  touchHelp:[['點水面','往那裡拋竿（點越深，魚鉤沉越深）'],['收線','「！」時按一下鉤住；之後按住收線、拉力變紅就放開']],
  touch:{left:[{l:'◀',c:'ArrowLeft'},{l:'▶',c:'ArrowRight'}],right:[{l:'收線',c:'Space',act:true}]},
  looks:[{key:'col',label:'衣服',type:'color',opts:['#4f9dff','#ff5d6d','#5fd068','#ffd23f','#b98cff','#ff9d3d']},{key:'hat',label:'帽子',type:'color',opts:['#ffd23f','#f4f0e8','#3a5a8a','#ff7eb6','#5fd068']}],
  best:{label:'過關',fmt:v=>v+' 關',lower:false},
  stageShow,preview,thumb,create,_sim:{levelOf,FISH,wOf}};
})();
