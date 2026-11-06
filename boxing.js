// 鐵拳擂台：Q 版拳擊一對一。← → 移動、出拳鍵（會依距離自動變成刺拳、勾拳、上勾拳，連按三下是組合拳）、防守鍵（按住擋拳）。
// 打到對手體力歸零就倒地，倒地三次 K.O.；三回合打完沒人倒下就看誰打中比較多。
// 連線時房主負責運算（左邊），加入的人只送出按鍵。
(function(){
'use strict';
const W=800,H=450,GY=356,XL=96,XR=704,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,RT=60,ROUNDS=3;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,r1=v=>Math.round(v*10)/10;
const rre=(c,x,y,w,h,r)=>{ c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }; /* 舊版 Safari 沒有 roundRect */
const INK='#1a1220',SKIN='#f6c9a4',SKIN2='#e2a882';
function shade(hex,k){ const n=parseInt(hex.slice(1),16); let r=n>>16,g=n>>8&255,b=n&255; const f=v=>clamp(Math.round(k>0?v+(255-v)*k:v*(1+k)),0,255); return 'rgb('+f(r)+','+f(g)+','+f(b)+')'; }
const OPP=[['練習生小凱','#7ac74f','#4a2a1a'],['街頭阿龍','#ff9d3d','#1a1a1a'],['鐵砧老陳','#8a96a8','#5a5a5a'],['快手小瑜','#ff7eb6','#2a1a3a'],['重炮巴布','#d8a040','#6a3a1a'],
  ['左撇子雷克','#3ddbd9','#e8c050'],['颶風吉米','#b98cff','#c8202a'],['冷面教頭','#2a4a8a','#1a1a1a'],['鐵壁阿岩','#5a7a3a','#3a2a1a'],['衛冕拳王','#ffd23f','#e8e8f0']];
const STAGES=OPP.map(([n,c,hair],i)=>{ const k0=i/9,k=Math.pow(k0,1.5); /* 前幾關慢慢變強，最後幾關才是全力 */ return {name:n,col:c,hair,stars:1+Math.round(k0*4),pow:.6+.55*k,hp:.78+.4*k,spd:.75+.4*k,rate:1.05-.7*k,guard:.04+.7*k,combo:.08+.75*k,read:.1+.6*k}; });
const TIPS=['出拳慢、不太會防守，練習用。','會往前衝，退一步再反擊。','很耐打，多用組合拳。','出拳很快，記得按防守。','一拳很重，別被他逼到繩邊。','很會躲，等他出拳後再打。','連續組合拳很兇，擋完再還手。','會看你的動作防守，假裝退後再進攻。','防守超硬，用上勾拳破防。','最強的拳王：快、狠、會防守。'];
const hasWin=i=>{ try{ return localStorage.getItem('arcade.boxing.w.'+i)==='1'; }catch(e){ return false; } };
const recWin=i=>{ try{ localStorage.setItem('arcade.boxing.w.'+i,'1'); }catch(e){} };
const PUNCH={jab:{dmg:6,rng:132,pre:.07,act:.09,rec:.16,st:.07,kb:70},hook:{dmg:10,rng:104,pre:.1,act:.1,rec:.22,st:.11,kb:150},upper:{dmg:15,rng:86,pre:.12,act:.1,rec:.3,st:.15,kb:220}};

// ---- Q 版拳擊手：大頭、大拳套、短褲、拳擊鞋 ----
function boxer(c,x,y,face,o,t){ const col=o.col,hair=o.hair||'#2a1a10',pose=o.pose||'idle',u=o.u||0,bob=pose==='idle'||pose==='walk'?Math.sin(t*(pose==='walk'?14:7))*3:0;
  c.save(); c.translate(x,y); c.scale(face*(o.sc||1),o.sc||1); c.lineJoin='round'; c.lineCap='round'; c.strokeStyle=INK; c.lineWidth=3;
  if(!o.noShadow){ c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(0,2,50,9,0,0,TAU); c.fill(); }
  if(pose==='down'||pose==='ko'){ c.rotate(-Math.PI/2*.92); c.translate(30,-6); }
  const lean=pose==='hit'?-.22:pose==='jab'?.08*u:pose==='hook'?.16*u:pose==='upper'?-.08+.14*u:pose==='guard'?.05:0;
  c.translate(0,bob); c.rotate(lean);
  // 腿＋拳擊鞋
  const st=pose==='walk'?Math.sin(t*14)*8:0;
  for(const [lx,s2] of [[-16,-st],[16,st]]){ c.fillStyle=SKIN2; c.beginPath(); rre(c,lx-8,-46,16,34,7); c.fill(); c.stroke(); c.fillStyle='#e8e8f0'; c.beginPath(); rre(c,lx-11+s2,-16,24,16,6); c.fill(); c.stroke(); c.fillStyle=col; c.fillRect(lx-9+s2,-10,20,3); }
  // 短褲
  c.fillStyle=col; c.beginPath(); c.moveTo(-28,-74); c.lineTo(28,-74); c.lineTo(30,-42); c.lineTo(3,-40); c.lineTo(0,-50); c.lineTo(-3,-40); c.lineTo(-30,-42); c.closePath(); c.fill(); c.stroke();
  c.fillStyle='#fff'; c.fillRect(-28,-76,56,6); c.strokeRect(-28,-76,56,6); c.fillStyle=shade(col,-.3); c.fillRect(22,-70,5,26);
  // 身體
  const bg=c.createLinearGradient(-24,0,24,0); bg.addColorStop(0,SKIN2); bg.addColorStop(.4,'#ffe0c4'); bg.addColorStop(1,SKIN2); c.fillStyle=bg; c.beginPath(); c.ellipse(0,-100,30,30,0,0,TAU); c.fill(); c.stroke();
  c.strokeStyle='rgba(170,100,70,.45)'; c.lineWidth=2; c.beginPath(); c.moveTo(-12,-112); c.quadraticCurveTo(0,-104,12,-112); c.moveTo(0,-100); c.lineTo(0,-84); c.stroke(); c.strokeStyle=INK; c.lineWidth=3;
  // 拳套位置：依動作
  let F=[30,-122],B=[14,-112]; /* 前手、後手 */
  if(pose==='guard'){ F=[30,-138]; B=[22,-128]; }
  else if(pose==='jab'){ F=[30+62*u,-128]; B=[14,-118]; }
  else if(pose==='hook'){ const a=-1.3+2.1*u; F=[24,-118]; B=[10+Math.cos(a)*66,-126+Math.sin(a)*20]; }
  else if(pose==='upper'){ F=[26,-124]; B=[22+40*u,-80-70*u]; }
  else if(pose==='hit'){ F=[34,-104]; B=[-24,-118]; }
  else if(pose==='win'){ F=[22,-182]; B=[-22,-180]; }
  else if(pose==='down'||pose==='ko'){ F=[34,-92]; B=[-30,-96]; }
  const arm=(sx,sy,g,cg)=>{ c.strokeStyle=INK; c.lineWidth=14; c.beginPath(); c.moveTo(sx,sy); c.lineTo(g[0],g[1]); c.stroke(); c.strokeStyle=SKIN2; c.lineWidth=8; c.stroke(); c.strokeStyle=INK; c.lineWidth=3;
    const gg=c.createRadialGradient(g[0]-5,g[1]-6,3,g[0],g[1],17); gg.addColorStop(0,shade(cg,.45)); gg.addColorStop(1,shade(cg,-.25)); c.fillStyle=gg; c.beginPath(); c.ellipse(g[0],g[1],17,15,0,0,TAU); c.fill(); c.stroke();
    c.fillStyle='#fff'; c.fillRect(g[0]-15,g[1]+7,12,6); c.fillStyle='rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(g[0]-5,g[1]-6,5,3,-.5,0,TAU); c.fill(); };
  arm(-12,-118,B,o.glove||'#c8202a');
  // 頭
  c.save(); c.translate(8,-150+(pose==='hit'?-2:0)); c.rotate(pose==='hit'?-.25:0);
  c.fillStyle=SKIN; c.beginPath(); c.arc(0,0,30,0,TAU); c.fill(); c.stroke();
  c.fillStyle=hair; c.beginPath(); c.arc(0,-2,31,Math.PI*1.05,Math.PI*1.95); c.lineTo(22,-16); for(let i=0;i<5;i++) c.lineTo(18-i*10,-24+(i%2)*8); c.closePath(); c.fill(); c.stroke();
  c.fillStyle=o.band||col; c.fillRect(-30,-16,60,7); /* 頭帶 */
  c.fillStyle=SKIN2; c.beginPath(); c.ellipse(-27,4,5,7,0,0,TAU); c.fill(); c.stroke();
  c.lineWidth=3.4; c.beginPath(); c.moveTo(2,-7); c.lineTo(11,-4); c.moveTo(16,-4); c.lineTo(25,-7); c.stroke(); /* 眉毛 */
  if(pose==='down'||pose==='ko'||pose==='hit'&&u>.5){ c.lineWidth=2.6; c.beginPath(); c.moveTo(4,0); c.lineTo(11,5); c.moveTo(11,0); c.lineTo(4,5); c.moveTo(17,0); c.lineTo(24,5); c.moveTo(24,0); c.lineTo(17,5); c.stroke(); }
  else { c.fillStyle='#1a1418'; c.beginPath(); c.ellipse(8,3,4.4,5.6,0,0,TAU); c.ellipse(20,3,4.4,5.6,0,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(9.4,1,1.8,0,TAU); c.arc(21.4,1,1.8,0,TAU); c.fill(); }
  c.fillStyle='rgba(255,110,120,.45)'; c.beginPath(); c.ellipse(4,13,5,3,0,0,TAU); c.ellipse(26,13,4.5,3,0,0,TAU); c.fill();
  c.strokeStyle=INK; c.lineWidth=2.2; c.beginPath(); if(pose==='hit'||pose==='down'||pose==='ko'){ c.fillStyle='#5a1a1a'; c.ellipse(15,18,4,5,0,0,TAU); c.fill(); } else if(pose==='jab'||pose==='hook'||pose==='upper'){ c.moveTo(9,17); c.lineTo(21,17); c.moveTo(11,15); c.lineTo(11,19); c.moveTo(15,15); c.lineTo(15,19); c.moveTo(19,15); c.lineTo(19,19); } else { c.arc(12,16,3,0,Math.PI); c.arc(18,16,3,0,Math.PI); } c.stroke();
  if(o.sweat){ c.fillStyle='#9adcff'; const sy=-10+((t*50)%22); c.beginPath(); c.moveTo(-14,sy-6); c.quadraticCurveTo(-9,sy+2,-14,sy+3); c.quadraticCurveTo(-19,sy+2,-14,sy-6); c.fill(); }
  c.restore();
  arm(20,-120,F,o.glove||'#c8202a');
  if(pose==='hook'&&u>.3&&u<.9){ c.strokeStyle='rgba(255,255,255,.75)'; c.lineWidth=3; c.beginPath(); c.arc(10,-126,60,-1.1,.6); c.stroke(); }
  if(pose==='upper'&&u>.3){ c.strokeStyle='rgba(255,255,255,.75)'; c.lineWidth=3; c.beginPath(); c.moveTo(30,-70); c.quadraticCurveTo(70,-110,60,-160); c.stroke(); }
  c.restore();
  if(pose==='down'||pose==='ko'){ for(let i=0;i<3;i++){ const a=t*4+i*TAU/3; c.fillStyle='#ffe060'; c.save(); c.translate(x-face*56+Math.cos(a)*22,y-36+Math.sin(a)*8); c.beginPath(); for(let k=0;k<10;k++){ const q=k*Math.PI/5,rr=k%2?3:7; c.lineTo(Math.cos(q)*rr,Math.sin(q)*rr); } c.fill(); c.restore(); } } }
function referee(c,x,y,t,o){ o=o||{}; c.save(); c.translate(x,y); c.scale(.8,.8); c.lineWidth=3; c.strokeStyle=INK; c.lineCap='round';
  c.fillStyle='#1a1a22'; c.fillRect(-20,-60,16,60); c.fillRect(4,-60,16,60); c.strokeRect(-20,-60,16,60); c.strokeRect(4,-60,16,60);
  c.fillStyle='#f4f4f4'; c.beginPath(); rre(c,-26,-130,52,72,10); c.fill(); c.stroke(); c.fillStyle='#1a1a22'; c.fillRect(-6,-130,12,72); c.fillStyle='#1a1a22'; c.beginPath(); c.moveTo(-6,-128); c.lineTo(0,-118); c.lineTo(6,-128); c.fill();
  const up=o.count?Math.max(0,Math.sin(t*12))*20:0; c.strokeStyle=INK; c.lineWidth=11; c.beginPath(); c.moveTo(20,-122); c.lineTo(42,-150-up); c.stroke(); c.strokeStyle='#f4f4f4'; c.lineWidth=6; c.stroke(); c.fillStyle=SKIN; c.beginPath(); c.arc(42,-152-up,7,0,TAU); c.fill(); c.strokeStyle=INK; c.lineWidth=2.5; c.stroke();
  c.strokeStyle=INK; c.lineWidth=11; c.beginPath(); c.moveTo(-20,-122); c.lineTo(-30,-86); c.stroke(); c.strokeStyle='#f4f4f4'; c.lineWidth=6; c.stroke();
  c.fillStyle=SKIN; c.beginPath(); c.arc(0,-152,22,0,TAU); c.fill(); c.strokeStyle=INK; c.lineWidth=3; c.stroke(); c.fillStyle='#8a8a8a'; c.beginPath(); c.arc(0,-156,22,Math.PI*1.1,Math.PI*1.9); c.fill();
  c.fillStyle='#1a1418'; c.beginPath(); c.arc(-7,-150,2.8,0,TAU); c.arc(7,-150,2.8,0,TAU); c.fill(); c.strokeStyle=INK; c.lineWidth=2; c.beginPath(); if(o.count) c.arc(0,-140,4,0,Math.PI*2); else { c.moveTo(-5,-140); c.lineTo(5,-140); } c.stroke(); c.restore(); }
// 場館＋擂台
const BG={}; function arena(){ if(BG.c) return BG.c; const cv=document.createElement('canvas'); cv.width=W*2; cv.height=H*2; const c=cv.getContext('2d'); c.scale(2,2);
  const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#0a0818'); g.addColorStop(.6,'#1a1030'); g.addColorStop(1,'#0a0612'); c.fillStyle=g; c.fillRect(0,0,W,H);
  for(let i=0;i<4;i++){ const x=110+i*190,lg=c.createLinearGradient(x,0,x,GY); lg.addColorStop(0,'rgba(255,245,210,.22)'); lg.addColorStop(1,'rgba(255,245,210,0)'); c.fillStyle=lg; c.beginPath(); c.moveTo(x-14,0); c.lineTo(x+14,0); c.lineTo(x+110,GY); c.lineTo(x-110,GY); c.fill(); }
  for(let r=0;r<3;r++){ const y=180+r*36; for(let i=0;i<34;i++){ const x=(i*25+r*12)%W,hue=(i*53+r*41)%360; c.fillStyle='hsl('+hue+',30%,'+(16+r*6)+'%)'; c.beginPath(); c.arc(x,y,8+r,0,TAU); c.fill(); c.fillRect(x-8-r,y,16+2*r,26); } }
  /* 擂台檯面 */ c.fillStyle='#2a3a8a'; c.beginPath(); c.moveTo(40,GY+70); c.lineTo(70,GY-4); c.lineTo(730,GY-4); c.lineTo(760,GY+70); c.closePath(); c.fill();
  const fg=c.createLinearGradient(0,GY-4,0,GY+40); fg.addColorStop(0,'#e8e8f4'); fg.addColorStop(1,'#b8bcd8'); c.fillStyle=fg; c.beginPath(); c.moveTo(70,GY-4); c.lineTo(730,GY-4); c.lineTo(750,GY+40); c.lineTo(50,GY+40); c.closePath(); c.fill();
  c.fillStyle='rgba(42,58,138,.25)'; c.font='900 46px '+TC; c.textAlign='center'; c.fillText('IRON FIST',W/2,GY+34);
  c.fillStyle='#c8202a'; c.fillRect(40,GY+40,720,30); c.fillStyle='#fff'; c.font='900 16px '+TC; c.fillText('鐵　拳　擂　台',W/2,GY+61);
  BG.c=cv; return cv; }
function ropes(c,t,wob){ for(const [x,col] of [[74,'#c8202a'],[726,'#2a4a8a']]){ c.fillStyle='#1a1a22'; c.fillRect(x-7,GY-150,14,150); c.fillStyle=col; c.fillRect(x-9,GY-158,18,22); }
  for(let i=0;i<3;i++){ const y=GY-136+i*36; c.strokeStyle=['#c8202a','#f4f4f4','#2a4a8a'][i]; c.lineWidth=5; c.beginPath(); c.moveTo(74,y); for(let k=1;k<=20;k++){ const x=74+k*32.6,w=(wob[0]*Math.max(0,1-k/6)+wob[1]*Math.max(0,1-(20-k)/6))*Math.sin(t*30+i); c.lineTo(x,y+w); } c.stroke(); } }

function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,host=!!net&&net.host,pv=!!opts.preview,two=!net&&opts.mode==='2p',me=net?Math.min(1,net.me):0,vsHuman=!!net&&net.count>1;
  const si=clamp(opts.stage|0,0,STAGES.length-1),ST=STAGES[si],{ctx:c}=env.canvas2d(W,H);
  const names=net?[net.names[0]||'玩家 1',vsHuman?(net.names[1]||'玩家 2'):ST.name]:two?['1P','2P']:[pv?'挑戰者':(opts.name||'你'),ST.name];
  const lk=i=>net?(net.looks&&net.looks[i])||{}:i===0?(opts.look||{}):{};
  const mk=n=>{ const cpu=pv||n===1&&!two&&!vsHuman,S=pv?STAGES[Math.min(9,si+3)]:ST; const L=lk(n);
    return {n,x:n?470:330,vx:0,face:n?-1:1,hp:100,maxhp:cpu&&n===1?100*S.hp:100,stam:1,act:'idle',at:0,pt:0,kind:'',hitDone:false,combo:0,cT:0,downs:0,hits:0,dmg:0,guard:false,cpu,S,aiT:.6,aiW:0,
      col:L.color||(n?(two||vsHuman?'#2a4a8a':S.col):'#c8202a'),glove:L.glove||(n?'#2a6ad8':'#d8202a'),hair:n&&cpu?S.hair:'#2a1a10',pow:cpu&&n===1?S.pow:1,spd:cpu&&n===1?S.spd:1}; };
  const P=[mk(0),mk(1)]; P.forEach(p=>p.hp=p.maxhp); if(P[0].col===P[1].col) P[1].col='#2a4a8a'; if(P[0].glove===P[1].glove) P[1].glove='#2a6ad8';
  let phase='intro',PT=pv?.4:1.8,round=1,rt=0,t=0,fx=[],shake=0,slow=0,ban=null,ended=false,ev=[],sendT=0,count=0,downP=-1,wob=[0,0],flashes=[],koBy=-1;
  const rin={dx:0,punch:false,guard:false};
  const sfx=n=>{ if(pv) return; env.sfx(n); if(host) ev.push(n); };
  const say=(txt,col)=>{ ban={txt,col:col||'#ffd23f',t:0}; if(host) ev.push('b:'+txt+'|'+(col||'')); };
  function inputOf(p){ const k=env.keys; if(p.cpu) return aiIn(p);
    if(two){ if(p.n===0) return {dx:(k.KeyD?1:0)-(k.KeyA?1:0),punch:env.hit('KeyF'),guard:!!k.KeyG}; return {dx:(k.ArrowRight?1:0)-(k.ArrowLeft?1:0),punch:env.hit('Comma')||env.hit('Enter'),guard:!!(k.Period||k.ShiftRight)}; }
    if(p.n===1){ const o={dx:rin.dx,punch:rin.punch,guard:rin.guard}; rin.punch=false; return o; }
    return {dx:(k.ArrowRight||k.KeyD?1:0)-(k.ArrowLeft||k.KeyA?1:0),punch:env.hit('KeyJ')||env.hit('Space'),guard:!!k.KeyK}; }
  // 電腦：保持在出拳距離，看到對手出拳會防守，有空檔就組合拳
  function aiIn(p){ const o=P[1-p.n],S=p.S,d=Math.abs(o.x-p.x),dir=Math.sign(o.x-p.x)||p.face; p.aiT-=1/60; p.aiW-=1/60;
    let dx=0,punch=false,guard=false; const want=p.stam<.25?170:p.hp<p.maxhp*.3&&o.hp>o.maxhp*.5?140:110;
    if(d>want+12) dx=dir; else if(d<want-30&&Math.random()<.5) dx=-dir;
    if(o.act==='punch'&&o.pt>0&&d<150&&Math.random()<S.guard*.5) p.aiW=.35+Math.random()*.2; if(p.aiW>0){ guard=true; dx=0; }
    if(!guard&&d<128&&p.aiT<=0&&p.stam>.15){ punch=true; p.aiT=p.combo>0&&p.combo<3&&Math.random()<S.combo?.12:S.rate*(.6+Math.random()*.8); }
    if(o.act==='hit'&&d<120&&Math.random()<S.combo*.2) punch=true;
    return {dx,punch,guard}; }
  function startPunch(p){ const o=P[1-p.n],d=Math.abs(o.x-p.x); let kind=d<92?'hook':'jab'; if(p.cT>0&&p.combo>=2) kind='upper'; else if(p.cT>0&&p.combo===1) kind=d<110?'hook':'jab';
    const K=PUNCH[kind]; p.act='punch'; p.kind=kind; p.pt=K.pre; p.at=K.pre+K.act+K.rec; p.hitDone=false; p.combo=p.cT>0?p.combo+1:1; p.cT=.55; p.stam=Math.max(0,p.stam-K.st); sfx('click'); }
  function land(p,o){ const K=PUNCH[p.kind],d=Math.abs(o.x-p.x); if(d>K.rng||o.act==='down') return;
    const counter=o.act==='punch'&&o.pt>0,blocked=o.guard&&o.act!=='hit'&&!(p.kind==='upper'&&Math.random()<.5);
    let dmg=K.dmg*p.pow*(.55+.45*p.stam)*(counter?1.5:1); const hx=(p.x+o.x)/2+p.face*12,hy=GY-(p.kind==='upper'?150:140);
    if(blocked){ dmg*=.18; o.stam=Math.max(0,o.stam-.05); o.vx+=p.face*K.kb*.5; sfx('bump'); fx.push({k:'ring',x:hx,y:hy,r:36,c:'#9adcff',l:.2,L:.2}); }
    else { o.act='hit'; o.at=.22+K.dmg*.012; o.vx+=p.face*K.kb; o.combo=0; sfx(p.kind==='jab'?'bump':'hurt'); shake=Math.max(shake,p.kind==='upper'?.3:p.kind==='hook'?.18:.08); p.hits++;
      fx.push({k:'pow',x:hx,y:hy,r:p.kind==='upper'?36:p.kind==='hook'?28:20,l:.22,L:.22,txt:counter?'反擊！':p.kind==='upper'?'POW!':p.kind==='hook'?'BAM!':''}); fx.push({k:'ring',x:hx,y:hy,r:70,l:.25,L:.25});
      for(let i=0;i<(p.kind==='jab'?3:7);i++) fx.push({k:'sw',x:o.x,y:GY-150,vx:p.face*(80+Math.random()*160),vy:-60-Math.random()*140,l:.5,L:.5});
      if(counter) say('反擊！','#ff7a3d'); if(Math.random()<.4) flashes.push({x:Math.random()*W,y:180+Math.random()*90,l:.15}); }
    o.hp=Math.max(0,o.hp-dmg); p.dmg+=dmg; p.hitDone=true;
    if(o.hp<=0) knockDown(o,p); }
  function knockDown(o,by){ o.downs++; o.act='down'; o.at=99; phase='count'; count=0; PT=0; downP=o.n; slow=pv?0:.6; shake=.45; sfx('boom'); cheerT=1.5;
    for(let i=0;i<14;i++) flashes.push({x:Math.random()*W,y:170+Math.random()*100,l:.1+Math.random()*.4});
    if(o.downs>=3){ koBy=by.n; say('K.O.！','#ff4d4d'); } else say('倒地！','#ffd23f'); }
  let cheerT=0;
  function conclude(winner,how){ if(ended) return; ended=true; if(pv){ env.end({}); return; } const mine=two||winner===me;
    if(!two&&!net&&winner===0) recWin(si); env.sfx(mine?'win':'lose');
    env.end({title:two?(winner?'2P':'1P')+' 獲勝！':mine?'你贏了！':names[winner]+' 獲勝',big:how,text:'打中次數 '+P[0].hits+' : '+P[1].hits+'。'+(!two&&!net&&!mine?'對手出拳時按防守，擋完再反擊。':''),score:null,next:!two&&!net&&winner===0&&si<STAGES.length-1}); }
  function snap(){ const m={s:[P.map(p=>[r1(p.x),p.act,p.kind,r1(p.at),r1(p.pt),Math.round(p.hp),r1(p.stam),p.guard?1:0,p.downs,p.hits,Math.round(p.maxhp)]),phase,round,r1(rt),count,downP,r1(PT)],e:ev}; ev=[]; return m; }
  if(net){
    if(client) net.onmsg=m=>{ if(m.s){ const s=m.s; s[0].forEach((a,i)=>{ const p=P[i]; p.tx=a[0]; p.act=a[1]; p.kind=a[2]; p.at=a[3]; p.pt=a[4]; p.hp=a[5]; p.stam=a[6]; p.guard=!!a[7]; p.downs=a[8]; p.hits=a[9]; p.maxhp=a[10]; }); phase=s[1]; round=s[2]; rt=s[3]; count=s[4]; downP=s[5]; PT=s[6];
        for(const e of m.e){ if(e.startsWith('b:')){ const [tx,cl]=e.slice(2).split('|'); ban={txt:tx,col:cl||'#ffd23f',t:0}; } else env.sfx(e); } }
      else if(m.end) conclude(m.end[0],m.end[1]); };
    else { net.onmsg=(m,from)=>{ if(from===1&&m.i){ rin.dx=m.i[0]; if(m.i[1]) rin.punch=true; rin.guard=!!m.i[2]; } };
      net.onleave=i=>{ if(i===1&&!ended){ net.send({end:[0,'對手離開']}); conclude(0,'對手離開'); } }; }
  }
  function decide(){ const a=P[0].dmg-P[0].hits*0,b=P[1].dmg; const w=a===b?(P[0].hits>=P[1].hits?0:1):a>b?0:1; phase='end'; PT=2.2; say('判定勝：'+names[w],'#ffd23f'); sfx('beep'); P[w].act='win'; P[1-w].act='idle'; endInfo=[w,'判定勝']; }
  let endInfo=null;
  function step(dt){ const dtr=dt; if(slow>0){ slow-=dtr; dt*=.35; } t+=dt;
    for(let i=fx.length-1;i>=0;i--){ const e=fx[i]; e.l-=dtr; if(e.vx!=null){ e.x+=e.vx*dtr; e.y+=e.vy*dtr; e.vy+=500*dtr; } if(e.l<=0) fx.splice(i,1); }
    for(let i=flashes.length-1;i>=0;i--){ flashes[i].l-=dtr; if(flashes[i].l<=0) flashes.splice(i,1); } if(cheerT>0){ cheerT-=dtr; if(Math.random()<dtr*14) flashes.push({x:Math.random()*W,y:170+Math.random()*100,l:.12}); }
    if(ban) ban.t+=dtr; if(shake>0) shake-=dtr; wob[0]*=Math.exp(-4*dtr); wob[1]*=Math.exp(-4*dtr);
    if(phase==='intro'){ PT-=dt; if(PT<=0){ phase='fight'; rt=0; say('第 '+round+' 回合　開打！'); sfx('go'); } return; }
    if(phase==='end'){ PT-=dt; if(PT<=0){ if(host){ net.send(snap()); net.send({end:endInfo}); } conclude(endInfo[0],endInfo[1]); } return; }
    if(phase==='break'){ PT-=dt; if(PT<=0){ round++; phase='fight'; rt=0; for(const p of P){ p.hp=Math.min(p.maxhp,p.hp+p.maxhp*.2); p.stam=1; p.x=p.n?470:330; p.vx=0; p.act='idle'; } say('第 '+round+' 回合　開打！'); sfx('go'); } return; }
    if(phase==='count'){ const o=P[downP]; PT+=dt; const n=Math.floor(PT/.6); if(n>count){ count=n; sfx('beep'); }
      if(o.downs>=3&&count>=10||o.downs>=3&&PT>3.2){ phase='end'; PT=2.2; P[1-o.n].act='win'; endInfo=[1-o.n,'K.O.']; return; }
      if(o.downs<3&&count>=(o.downs===1?4:6)){ o.hp=o.maxhp*(o.downs===1?.45:.3); o.act='idle'; o.at=0; phase='fight'; say('站起來了！','#7ae8ff'); sfx('item'); }
      for(const p of P){ p.vx*=Math.exp(-6*dt); p.x+=p.vx*dt; } return; }
    // 比賽中
    rt+=dt; if(rt>=RT){ if(round<ROUNDS){ phase='break'; PT=pv?.5:2.2; say('第 '+round+' 回合結束','#fff'); sfx('beep'); for(const p of P){ p.act='idle'; p.guard=false; } } else decide(); return; }
    for(const p of P){ const o=P[1-p.n],i=inputOf(p); p.face=Math.sign(o.x-p.x)||p.face; if(p.cT>0){ p.cT-=dt; if(p.cT<=0) p.combo=0; }
      p.guard=false;
      if(p.act==='hit'){ p.at-=dt; if(p.at<=0) p.act='idle'; }
      else if(p.act==='punch'){ p.at-=dt; if(p.pt>0){ p.pt-=dt; if(p.pt<=0&&!p.hitDone) land(p,o); } if(p.at<=0) p.act='idle'; }
      else if(p.act==='idle'||p.act==='walk'){ if(i.guard){ p.guard=true; } else if(i.punch&&p.stam>.03) startPunch(p);
        const sp=(p.guard?60:150)*p.spd*(.6+.4*p.stam); p.vx+=((p.act==='punch'?0:i.dx*sp)-p.vx)*Math.min(1,dt*10); if(p.act!=='punch') p.act=Math.abs(i.dx)>0?'walk':'idle'; }
      p.stam=clamp(p.stam+(p.guard?.06:p.act==='punch'?0:.22)*dt,0,1);
      if(p.act==='hit'||p.act==='punch') p.vx*=Math.exp(-5*dt); }
    for(const p of P){ p.x+=p.vx*dt; if(p.x<XL){ p.x=XL; if(p.vx<-60){ wob[0]=Math.min(14,-p.vx*.06); } p.vx=Math.abs(p.vx)*.4; } if(p.x>XR){ p.x=XR; if(p.vx>60){ wob[1]=Math.min(14,p.vx*.06); } p.vx=-Math.abs(p.vx)*.4; } }
    const gap=P[1].x-P[0].x,mn=58; if(Math.abs(gap)<mn){ const s=Math.sign(gap)||1,ov=(mn-Math.abs(gap))/2; P[0].x-=s*ov; P[1].x+=s*ov; } }
  function update(dt){
    if(client){ const k=env.keys,i={dx:(k.ArrowRight||k.KeyD?1:0)-(k.ArrowLeft||k.KeyA?1:0),punch:env.hit('KeyJ')||env.hit('Space'),guard:!!k.KeyK};
      sendT-=dt; if(sendT<=0||i.punch){ sendT=1/20; net.send({i:[-i.dx,i.punch?1:0,i.guard?1:0]}); }
      t+=dt; if(ban) ban.t+=dt; if(shake>0) shake-=dt; for(let j=fx.length-1;j>=0;j--){ fx[j].l-=dt; if(fx[j].l<=0) fx.splice(j,1); } for(const p of P) if(p.tx!=null) p.x+=(p.tx-p.x)*Math.min(1,dt*18); return; }
    if(ended) return; step(dt); if(host){ sendT-=dt; if(sendT<=0){ sendT=1/24; net.send(snap()); } } }
  function poseOf(p){ if(p.act==='down') return {pose:endInfo&&endInfo[1]==='K.O.'&&downP===p.n?'ko':'down',u:0};
    if(p.act==='win') return {pose:'win',u:0}; if(p.act==='hit') return {pose:'hit',u:p.at>.15?1:.3};
    if(p.act==='punch'){ const K=PUNCH[p.kind],tot=K.pre+K.act+K.rec,el=tot-p.at,u=el<K.pre?el/K.pre*.4:el<K.pre+K.act?1:Math.max(0,1-(el-K.pre-K.act)/K.rec); return {pose:p.kind,u}; }
    if(p.guard) return {pose:'guard',u:0}; return {pose:p.act==='walk'?'walk':'idle',u:0}; }
  function draw(){ const mir=client&&me===1; c.save(); if(shake>0) c.translate((Math.random()-.5)*shake*24,(Math.random()-.5)*shake*16); if(mir){ c.translate(W,0); c.scale(-1,1); }
    c.drawImage(arena(),0,0,W,H); for(const f of flashes){ c.fillStyle='rgba(255,255,255,'+Math.min(1,f.l*8)+')'; c.beginPath(); c.arc(f.x,f.y,4,0,TAU); c.fill(); const g=c.createRadialGradient(f.x,f.y,0,f.x,f.y,26); g.addColorStop(0,'rgba(255,255,255,.4)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; c.fillRect(f.x-26,f.y-26,52,52); }
    ropes(c,t,wob); const refX=phase==='count'&&downP>=0?P[downP].x+(P[downP].face>0?-70:70):400+Math.sin(t*.7)*40; referee(c,clamp(refX,120,680),GY-40,t,{count:phase==='count'});
    for(const p of P){ const q=poseOf(p); boxer(c,p.x,GY,p.face,{col:p.col,glove:p.glove,hair:p.hair,pose:q.pose,u:q.u,sweat:p.stam<.3},t); }
    for(const e of fx){ const a=clamp(e.l/e.L,0,1); if(e.k==='pow'){ c.save(); c.translate(e.x,e.y); const s=1+(1-a)*.6; c.scale(s,s); c.fillStyle='rgba(255,240,120,'+a+')'; c.beginPath(); for(let i=0;i<16;i++){ const q=i*Math.PI/8,rr=i%2?e.r*.5:e.r; c.lineTo(Math.cos(q)*rr,Math.sin(q)*rr); } c.fill(); c.strokeStyle='rgba(255,120,40,'+a+')'; c.lineWidth=3; c.stroke();
        if(e.txt){ if(mir) c.scale(-1,1); c.font='900 18px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=4; c.strokeStyle='rgba(20,18,43,'+a+')'; c.strokeText(e.txt,0,-e.r-10); c.fillStyle='rgba(255,90,60,'+a+')'; c.fillText(e.txt,0,-e.r-10); } c.restore(); }
      else if(e.k==='ring'){ c.globalAlpha=a*.8; c.strokeStyle=e.c||'#fff'; c.lineWidth=3; c.beginPath(); c.arc(e.x,e.y,(1-a)*e.r+8,0,TAU); c.stroke(); c.globalAlpha=1; }
      else if(e.k==='sw'){ c.globalAlpha=a; c.fillStyle='#bfe8ff'; c.beginPath(); c.arc(e.x,e.y,3,0,TAU); c.fill(); c.globalAlpha=1; } }
    if(phase==='intro'&&round===1&&!pv){ const mine=two?[0,1]:[me]; for(const i of mine){ const p=P[i],yy=GY-230+Math.sin(t*8)*6; c.fillStyle='#ffd23f'; c.strokeStyle='#14122b'; c.lineWidth=3; c.beginPath(); c.moveTo(p.x-14,yy-16); c.lineTo(p.x+14,yy-16); c.lineTo(p.x,yy); c.closePath(); c.fill(); c.stroke();
      c.save(); if(mir){ c.translate(p.x,0); c.scale(-1,1); c.translate(-p.x,0); } c.font='900 16px '+TC; c.textAlign='center'; c.lineWidth=4; const lb=two?(i?'2P':'1P'):'你'; c.strokeText(lb,p.x,yy-24); c.fillStyle='#ffd23f'; c.fillText(lb,p.x,yy-24); c.restore(); } }
    c.restore(); hud(mir); }
  function hud(mir){ const L=mir?1:0,Rr=1-L;
    const card=(p,x,al)=>{ c.fillStyle='rgba(8,6,20,.8)'; c.fillRect(x,10,280,56); c.fillStyle=p.col; c.fillRect(al?x+274:x,10,6,56);
      c.font='900 15px '+TC; c.textBaseline='middle'; c.textAlign=al?'right':'left'; c.fillStyle='#fff'; c.fillText(names[p.n],al?x+266:x+14,24);
      for(let k=0;k<3;k++){ c.fillStyle=k<p.downs?'#ff4d4d':'rgba(255,255,255,.18)'; c.beginPath(); c.arc(al?x+16+k*16:x+264-k*16,24,5.5,0,TAU); c.fill(); }
      const hw=252,hp=p.hp/p.maxhp; c.fillStyle='rgba(255,255,255,.13)'; c.fillRect(x+14,36,hw,10); c.fillStyle=hp>.5?'#3ed16a':hp>.25?'#ffc21a':'#ff4d4d'; if(al) c.fillRect(x+266-hw*hp,36,hw*hp,10); else c.fillRect(x+14,36,hw*hp,10);
      c.fillStyle='rgba(255,255,255,.13)'; c.fillRect(x+14,50,hw,5); c.fillStyle='#7ae8ff'; if(al) c.fillRect(x+266-hw*p.stam,50,hw*p.stam,5); else c.fillRect(x+14,50,hw*p.stam,5); };
    card(P[L],10,false); card(P[Rr],W-290,true);
    c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='rgba(8,6,20,.8)'; c.fillRect(W/2-58,10,116,46); c.font='900 12px '+TC; c.fillStyle='#ffd23f'; c.fillText('第 '+round+' / '+ROUNDS+' 回合',W/2,22); c.font='900 22px '+TC; c.fillStyle='#fff'; c.fillText(Math.max(0,Math.ceil(RT-rt)),W/2,42);
    if(phase==='count'&&count>=1){ c.font='900 80px '+TC; c.lineWidth=10; c.strokeStyle='#14122b'; const s=String(Math.min(10,count)); c.strokeText(s,W/2,180); c.fillStyle='#fff'; c.fillText(s,W/2,180); }
    if(ban&&ban.t<1.6){ const u=Math.min(1,ban.t*6),sc=1+(1-u)*.8; c.save(); c.translate(W/2,120); c.scale(sc,sc); c.globalAlpha=Math.min(1,(1.6-ban.t)*3); c.font='900 46px '+TC; c.lineWidth=9; c.strokeStyle='#14122b'; c.strokeText(ban.txt,0,0); c.fillStyle=ban.col; c.fillText(ban.txt,0,0); c.restore(); c.globalAlpha=1; } }
  return {update,draw,destroy(){},_dbg:{P,get phase(){return phase;},get round(){return round;},set rt(v){rt=v;}}};
}
function stageShow(ctx,w,h,si,t){ const S=STAGES[si]; ctx.save(); ctx.scale(w/W,h/H); ctx.drawImage(arena(),0,0,W,H); ropes(ctx,t,[0,0]); referee(ctx,400,GY-40,t,{});
  const u=(t%1.6)/1.6,pa=u<.5?{pose:'jab',u:Math.sin(u*2*Math.PI)}:{pose:'guard',u:0},pb=u>.5&&u<.85?{pose:'hook',u:Math.sin((u-.5)/.35*Math.PI)}:{pose:'idle',u:0};
  boxer(ctx,330,GY,1,{col:'#c8202a',glove:'#d8202a',pose:pa.pose,u:pa.u},t); boxer(ctx,470,GY,-1,{col:S.col,glove:'#2a6ad8',hair:S.hair,pose:pb.pose,u:pb.u},t);
  ctx.font='900 22px '+TC; ctx.textAlign='center'; ctx.lineWidth=6; ctx.strokeStyle='#14122b'; ctx.strokeText('對手：'+S.name,W/2,110); ctx.fillStyle='#ffd23f'; ctx.fillText('對手：'+S.name,W/2,110); ctx.restore(); }
function preview(ctx,w,h,L,t){ const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#1a1030'); g.addColorStop(1,'#0a0612'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  const s=h/240; ctx.save(); ctx.translate(w/2,h*.94); ctx.scale(s,s); const u=(t%1.4)/1.4; boxer(ctx,0,0,1,{col:(L&&L.color)||'#c8202a',glove:(L&&L.glove)||'#d8202a',pose:u<.4?'jab':'guard',u:Math.sin(Math.min(1,u/.4)*Math.PI)},t); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).boxing={name:'鐵拳擂台',tag:'IRON FIST',color:'#ff4d4d',online:true,maxPlayers:2,
  desc:'Q 版拳擊一對一！出拳鍵會依距離自動打出刺拳、勾拳，連按三下接上勾拳；對手出拳時按住防守，擋完再反擊。打到對手倒地三次 K.O.，三回合沒分出勝負就看誰打得多。10 位對手一位比一位強。',
  goal:'把對手打倒三次就 K.O. 獲勝；三回合打完就看誰打中的傷害多。',
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  stageGoal:i=>'對手「'+STAGES[i].name+'」：'+TIPS[i]+' 打倒三次就 K.O.。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['← →','前進、後退'],['J','出拳：遠的刺拳、近的勾拳，連按三下接上勾拳'],['K（按住）','防守：擋住對手的拳'],['雙人','1P：A D＋F 出拳、G 防守　2P：← →＋, 出拳、. 防守']],
  touchHelp:[['◀ ▶','前進、後退'],['出拳','連按打組合拳'],['防守','按住擋拳']],
  touch:{left:[{l:'◀',c:'ArrowLeft',big:true},{l:'▶',c:'ArrowRight',big:true}],right:[{l:'防守',c:'KeyK'},{l:'出拳',c:'KeyJ',act:true}]},
  looks:[{key:'color',label:'短褲顏色',type:'color',opts:['#c8202a','#2a4a8a','#3a8a4a','#6a2a8a','#d8a040','#1e1e24','#ff7eb6','#f4f4f4']},
    {key:'glove',label:'拳套顏色',type:'color',opts:['#d8202a','#2a6ad8','#ffd23f','#3ed16a','#1e1e24','#f4f4f4','#ff7a3d','#b98cff']}],
  hubBest:()=>{ const n=STAGES.filter((s,i)=>hasWin(i)).length; return n?'打贏 <b>'+n+' / '+STAGES.length+'</b> 位對手':'尚無紀錄'; },
  stageBest:i=>hasWin(i)?'★ 贏過':'',
  stageShow,preview,thumb:(ctx,w,h,t)=>stageShow(ctx,w,h,9,t),create,_draw:{boxer}};
})();
