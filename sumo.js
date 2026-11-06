// 土俵推推王：Q 版相撲一對一，把對手推出土俵就贏一番，先贏 2 番獲勝。
// 操作只有三種：← → 前進後退（貼著對手往前就是推）、推手（連按往前推）、閃身（對手衝過來時閃開，讓他自己衝出去）。
// 連線時房主負責運算（左邊力士），加入的人是右邊，只送出按鍵。
(function(){
'use strict';
const W=800,H=450,GY=338,RL=168,RR=632,CD=86,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,r1=v=>Math.round(v*10)/10;
const INK='#2a1a14',SKIN='#f4c6a0',SKIN2='#e0a77c';
function shade(hex,k){ const n=parseInt(hex.slice(1),16); let r=n>>16,g=n>>8&255,b=n&255; const f=v=>clamp(Math.round(k>0?v+(255-v)*k:v*(1+k)),0,255); return 'rgb('+f(r)+','+f(g)+','+f(b)+')'; }
// 十位對手：前面輕、慢、不會閃，後面重、快、會閃身
const OPP=[['豆福山','#7ac74f'],['春風丸','#ff9ec2'],['鐵板山','#8a96a8'],['大太鼓','#d8a040'],['雪見川','#9adcff'],['金剛岳','#c8a2ff'],['雷鳴丸','#ffd23f'],['千年杉','#4a9a5a'],['黑潮海','#2a4a8a'],['天空山','#e8e8f0']];
const STAGES=OPP.map(([n,c],i)=>{ const k=i/9; return {name:n,opp:n,col:c,stars:1+Math.round(k*4),
  pow:.66+.56*k,mass:.86+.5*k,spd:.78+.38*k,thr:1.25-.85*k,dodge:i<2?0:.12+.45*k,react:.42-.3*k,big:1+.18*k}; });
const TIPS=['動作慢、推力小，練習用。','會一直往前推，記得連按推手。','身體很硬，正面推不太動。','體重重，慢慢把他推到邊邊。','腳步快，會突然往前衝。','推力很大，被推到邊邊時試試閃身。','推手又快又密，別一直站著挨打。','又高又重，要靠連續推手。','會閃身！別在土俵邊緣猛衝。','最強的橫綱：推力、體重、閃身都一流。'];
const hasWin=i=>{ try{ return localStorage.getItem('arcade.sumo.w.'+i)==='1'; }catch(e){ return false; } };
const recWin=i=>{ try{ localStorage.setItem('arcade.sumo.w.'+i,'1'); }catch(e){} };

// ---- 力士（Q 版：大頭、圓肚子、髮髻、腮紅、ω 嘴） ----
function rikishi(c,x,y,face,col,pose,t,o){ o=o||{}; const sc=o.sc||1,lean=o.lean||0,blink=Math.sin(t*1.7+(o.seed||0))>.985;
  c.save(); c.translate(x,y); c.scale(sc*face,sc);
  if(!o.noShadow){ c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0,2,58,10,0,0,TAU); c.fill(); }
  const crouch=pose==='crouch'?1:pose==='push'||pose==='thrust'?.55:pose==='stumble'?.4:0,stomp=pose==='stomp'?Math.max(0,Math.sin(t*5)):0;
  c.translate(0,crouch*10); c.rotate(lean);
  c.lineJoin='round'; c.lineCap='round'; c.strokeStyle=INK; c.lineWidth=3;
  // 腿：短短圓圓，踏步時抬一隻
  const leg=(lx,up)=>{ c.fillStyle=SKIN2; c.beginPath(); c.ellipse(lx,-18-up,17,20,0,0,TAU); c.fill(); c.stroke(); c.fillStyle=SKIN; c.beginPath(); c.ellipse(lx+4,-2-up,20,9,0,0,TAU); c.fill(); c.stroke(); };
  leg(-24,0); leg(22,stomp*34);
  // 身體
  const bg=c.createRadialGradient(-14,-80,10,0,-64,62); bg.addColorStop(0,'#ffe2c8'); bg.addColorStop(1,SKIN2); c.fillStyle=bg; c.beginPath(); c.ellipse(0,-64,52,50,0,0,TAU); c.fill(); c.stroke();
  c.strokeStyle='rgba(160,90,60,.45)'; c.lineWidth=2; c.beginPath(); c.arc(6,-66,4,0,TAU); c.stroke(); c.beginPath(); c.arc(-14,-86,7,.3,2.6); c.arc(20,-86,7,.5,2.8); c.stroke(); c.strokeStyle=INK; c.lineWidth=3;
  // 兜襠布＋垂下的繩穗
  c.fillStyle=col; c.beginPath(); c.moveTo(-50,-44); c.quadraticCurveTo(0,-30,50,-44); c.lineTo(46,-26); c.quadraticCurveTo(0,-14,-46,-26); c.closePath(); c.fill(); c.stroke();
  c.fillStyle=shade(col,-.25); c.beginPath(); c.moveTo(18,-34); c.lineTo(34,-36); c.lineTo(30,-4); c.lineTo(20,-4); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle=shade(col,-.4); c.lineWidth=2.5; for(let i=-3;i<=3;i++){ const sx=i*9-6,sw=Math.sin(t*6+i)*(pose==='push'||pose==='thrust'?3:1.5); c.beginPath(); c.moveTo(sx,-24); c.lineTo(sx+sw,-6); c.stroke(); } c.strokeStyle=INK; c.lineWidth=3;
  // 手
  const hand=(sx,sy,hx,hy)=>{ c.strokeStyle=INK; c.lineWidth=17; c.beginPath(); c.moveTo(sx,sy); c.lineTo(hx,hy); c.stroke(); c.strokeStyle=SKIN2; c.lineWidth=11; c.stroke(); c.fillStyle=SKIN; c.beginPath(); c.arc(hx,hy,10,0,TAU); c.fill(); c.strokeStyle=INK; c.lineWidth=3; c.stroke(); };
  if(pose==='thrust'){ const ex=o.ext==null?1:o.ext; hand(-30,-84,-8,-58); hand(30,-84,40+ex*48,-82); if(ex>.5){ c.strokeStyle='rgba(255,255,255,.8)'; c.lineWidth=3; for(let i=0;i<3;i++){ c.beginPath(); c.moveTo(30+i*6,-98+i*14); c.lineTo(66+i*6,-98+i*14); c.stroke(); } c.strokeStyle=INK; } }
  else if(pose==='push'){ hand(-28,-84,46,-74); hand(30,-82,58,-60); }
  else if(pose==='stumble'){ const w=Math.sin(t*22)*14; hand(-30,-86,-62,-120+w); hand(30,-86,70,-110-w); }
  else if(pose==='stomp'){ hand(-32,-84,-70,-72); hand(32,-84,70,-72); }
  else if(pose==='crouch'){ hand(-30,-80,-26,-34); hand(30,-80,40,-30); }
  else if(pose==='win'){ hand(-30,-86,-48,-128); hand(30,-86,52,-124); }
  else { hand(-32,-82,-48,-44); hand(32,-82,48,-44); }
  // 頭
  c.save(); c.translate(6,-122);
  c.fillStyle='#1a1418'; c.beginPath(); c.ellipse(-2,-30,13,9,-.2,0,TAU); c.fill(); c.beginPath(); c.ellipse(-4,-22,9,7,0,0,TAU); c.fill(); /* 髮髻 */
  const hg=c.createRadialGradient(-8,-8,4,0,0,32); hg.addColorStop(0,'#ffe6d0'); hg.addColorStop(1,SKIN); c.fillStyle=hg; c.beginPath(); c.arc(0,0,29,0,TAU); c.fill(); c.stroke();
  c.fillStyle='#1a1418'; c.beginPath(); c.arc(0,0,29,Math.PI*1.08,Math.PI*1.92); c.quadraticCurveTo(0,-14,-27,-9); c.fill();
  c.fillStyle=SKIN2; c.beginPath(); c.ellipse(-26,3,5,7,0,0,TAU); c.fill(); c.stroke();
  c.strokeStyle=INK; c.lineWidth=3.2; c.beginPath(); c.moveTo(1,-10); c.lineTo(10,-13); c.moveTo(14,-13); c.lineTo(23,-10); c.stroke(); /* 粗眉 */
  if(blink||pose==='stumble'){ c.lineWidth=2.6; c.beginPath(); if(pose==='stumble'){ c.moveTo(3,-4); c.lineTo(9,0); c.lineTo(3,4); c.moveTo(22,-4); c.lineTo(16,0); c.lineTo(22,4); } else { c.moveTo(2,0); c.lineTo(10,0); c.moveTo(15,0); c.lineTo(23,0); } c.stroke(); }
  else { c.fillStyle='#1a1418'; c.beginPath(); c.ellipse(6,0,4.6,6,0,0,TAU); c.ellipse(19,0,4.6,6,0,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(7.6,-2.4,1.9,0,TAU); c.arc(20.6,-2.4,1.9,0,TAU); c.fill(); c.beginPath(); c.arc(5,2,.9,0,TAU); c.arc(18,2,.9,0,TAU); c.fill(); }
  c.fillStyle='rgba(255,110,120,.45)'; c.beginPath(); c.ellipse(2,10,6,3.5,0,0,TAU); c.ellipse(25,10,5,3.2,0,0,TAU); c.fill(); /* 腮紅 */
  c.strokeStyle=INK; c.lineWidth=2.2; c.beginPath(); if(pose==='push'||pose==='thrust'){ c.moveTo(9,14); c.lineTo(17,14); } else { c.arc(10.5,13,3,0,Math.PI); c.arc(16.5,13,3,0,Math.PI); } c.stroke(); /* ω 嘴 */
  if(o.sweat){ c.fillStyle='#9adcff'; for(let i=0;i<2;i++){ const sy=-14+((t*60+i*20)%26); c.beginPath(); c.moveTo(-18-i*8,sy-6); c.quadraticCurveTo(-13-i*8,sy+2,-18-i*8,sy+3); c.quadraticCurveTo(-23-i*8,sy+2,-18-i*8,sy-6); c.fill(); } }
  c.restore(); c.restore(); }
// 行司（裁判）：小一號，站在後面
function gyoji(c,x,y,t,point){ c.save(); c.translate(x,y); c.scale(.62,.62); c.lineWidth=3; c.strokeStyle=INK;
  c.fillStyle='#5a2a8a'; c.beginPath(); c.moveTo(-34,0); c.lineTo(-28,-74); c.lineTo(28,-74); c.lineTo(34,0); c.closePath(); c.fill(); c.stroke();
  c.fillStyle='#ffd23f'; c.fillRect(-28,-50,56,8); c.fillStyle='#e8e0d0'; c.beginPath(); c.moveTo(-10,-74); c.lineTo(0,-56); c.lineTo(10,-74); c.fill();
  const ax=point==null?0:point*40; c.strokeStyle=INK; c.lineWidth=12; c.beginPath(); c.moveTo(20,-66); c.lineTo(36+ax*.3,-80-Math.abs(ax)*.3); c.stroke(); c.strokeStyle='#5a2a8a'; c.lineWidth=7; c.stroke();
  c.save(); c.translate(38+ax*.3,-86-Math.abs(ax)*.3); c.rotate(point==null?Math.sin(t*2)*.2:point*.6); c.fillStyle='#c8202a'; c.beginPath(); c.ellipse(0,-14,14,17,0,0,TAU); c.fill(); c.strokeStyle=INK; c.lineWidth=3; c.stroke(); c.fillStyle='#ffd23f'; c.beginPath(); c.arc(0,-14,6,0,TAU); c.fill(); c.fillStyle='#6a3a1a'; c.fillRect(-3,0,6,14); c.restore(); /* 軍配 */
  c.fillStyle=SKIN; c.beginPath(); c.arc(0,-96,22,0,TAU); c.fill(); c.stroke(); c.fillStyle='#1a1418'; c.beginPath(); c.moveTo(-24,-100); c.quadraticCurveTo(0,-142,24,-100); c.quadraticCurveTo(0,-116,-24,-100); c.fill(); c.fillRect(-4,-140,8,16);
  c.beginPath(); c.arc(-7,-95,3,0,TAU); c.arc(7,-95,3,0,TAU); c.fill(); c.strokeStyle=INK; c.lineWidth=2; c.beginPath(); c.arc(0,-86,4,0,Math.PI); c.stroke(); c.restore(); }
// 場館：看台、吊屋頂、土俵
const BGC={}; function bgCanvas(){ if(BGC.c) return BGC.c; const cv=document.createElement('canvas'); cv.width=W*2; cv.height=H*2; const c=cv.getContext('2d'); c.scale(2,2);
  const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#2a1830'); g.addColorStop(.55,'#4a2a2a'); g.addColorStop(1,'#2a1812'); c.fillStyle=g; c.fillRect(0,0,W,H);
  for(let r=0;r<4;r++){ const y=150+r*34; c.fillStyle=r%2?'#5a3424':'#4a2a1c'; c.fillRect(0,y,W,34); for(let i=0;i<40;i++){ const x=(i*23+r*11)%W,hue=(i*67+r*31)%360; c.fillStyle='hsl('+hue+',45%,'+(38+r*5)+'%)'; c.beginPath(); c.arc(x,y+12,7+r,0,TAU); c.fill(); c.fillRect(x-7-r,y+12,14+2*r,22); c.fillStyle='#e8c09a'; c.beginPath(); c.arc(x,y+2,5+r*.8,0,TAU); c.fill(); } }
  /* 吊屋頂 */ c.fillStyle='#3a2418'; c.beginPath(); c.moveTo(120,62); c.lineTo(400,8); c.lineTo(680,62); c.closePath(); c.fill(); c.fillStyle='#5a3a22'; c.fillRect(140,62,520,16); c.fillStyle='#6a2a8a'; c.beginPath(); c.moveTo(140,78); for(let i=0;i<=10;i++){ const x=140+i*52; c.quadraticCurveTo(x-26,104,x,78); } c.lineTo(660,78); c.fill();
  for(const [x,col] of [[150,'#3a8a4a'],[650,'#c8202a']]){ c.strokeStyle=col; c.lineWidth=7; c.beginPath(); c.moveTo(x,78); c.lineTo(x,138); c.stroke(); c.fillStyle=col; c.beginPath(); c.moveTo(x-12,138); c.lineTo(x+12,138); c.lineTo(x+6,170); c.lineTo(x-6,170); c.fill(); }
  c.fillStyle='rgba(255,230,160,.08)'; c.beginPath(); c.moveTo(200,78); c.lineTo(600,78); c.lineTo(720,GY); c.lineTo(80,GY); c.fill(); /* 打在土俵上的燈光 */
  /* 土俵：梯形土台、草繩、白線 */
  c.fillStyle='#8a5a32'; c.beginPath(); c.moveTo(70,GY+64); c.lineTo(110,GY-6); c.lineTo(690,GY-6); c.lineTo(730,GY+64); c.closePath(); c.fill();
  const sg=c.createLinearGradient(0,GY-6,0,GY+64); sg.addColorStop(0,'#c8925a'); sg.addColorStop(1,'#8a5a32'); c.fillStyle=sg; c.fillRect(110,GY-6,580,8);
  c.fillStyle='#d8a86a'; c.beginPath(); c.moveTo(110,GY+2); c.lineTo(690,GY+2); c.lineTo(730,GY+64); c.lineTo(70,GY+64); c.closePath(); c.fill();
  c.fillStyle='rgba(0,0,0,.12)'; for(let i=0;i<30;i++) c.fillRect(90+(i*37)%600,GY+10+(i*13)%50,18,2);
  for(const x of [RL,RR]){ c.fillStyle='#e8d090'; c.beginPath(); c.ellipse(x,GY-4,14,9,0,0,TAU); c.fill(); c.strokeStyle='#a8883a'; c.lineWidth=2; c.stroke(); c.beginPath(); c.moveTo(x-10,GY-6); c.lineTo(x+10,GY-6); c.stroke(); }
  c.fillStyle='#f4f0e0'; c.fillRect(368,GY-4,6,3); c.fillRect(426,GY-4,6,3); /* 仕切線 */
  c.fillStyle='rgba(255,255,255,.6)'; c.font='900 12px '+TC; c.textAlign='center'; c.fillText('土俵邊緣',RL,GY+26); c.fillText('土俵邊緣',RR,GY+26);
  BGC.c=cv; return cv; }
function fxDraw(c,fx){ for(const e of fx){ const a=clamp(e.l/e.L,0,1);
    if(e.k==='dust'){ c.globalAlpha=a*.5; c.fillStyle='#d8b890'; c.beginPath(); c.arc(e.x,e.y,e.r*(1.6-a),0,TAU); c.fill(); }
    else if(e.k==='salt'){ c.globalAlpha=a; c.fillStyle='#fff'; c.fillRect(e.x,e.y,3,3); }
    else if(e.k==='star'){ c.globalAlpha=a; c.save(); c.translate(e.x,e.y); c.rotate(e.r); c.fillStyle=e.c||'#ffe060'; c.beginPath(); for(let i=0;i<10;i++){ const q=i*Math.PI/5,rr=i%2?5:12; c.lineTo(Math.cos(q)*rr,Math.sin(q)*rr); } c.fill(); c.restore(); }
    else if(e.k==='ring'){ c.globalAlpha=a*.8; c.strokeStyle=e.c||'#fff'; c.lineWidth=4*a+1; c.beginPath(); c.ellipse(e.x,e.y,(1-a)*e.r+10,((1-a)*e.r+10)*.6,0,0,TAU); c.stroke(); }
    else if(e.k==='sweat'){ c.globalAlpha=a; c.fillStyle='#9adcff'; c.beginPath(); c.arc(e.x,e.y,3,0,TAU); c.fill(); }
    else if(e.k==='cush'){ c.globalAlpha=1; c.save(); c.translate(e.x,e.y); c.rotate(e.r); c.fillStyle=e.c; c.fillRect(-12,-8,24,16); c.restore(); } }
  c.globalAlpha=1; }
function stepFx(fx,dt){ for(const e of fx){ e.l-=dt; if(e.vx!=null){ e.x+=e.vx*dt; e.y+=e.vy*dt; e.vy+=(e.g||0)*dt; } if(e.k==='star') e.r+=dt*6; if(e.k==='cush'){ e.r+=dt*5; if(e.y>GY+40){ e.y=GY+40; e.vy=0; e.vx*=.9; } } } return fx.filter(e=>e.l>0); }

function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,host=!!net&&net.host,pv=!!opts.preview,two=!net&&opts.mode==='2p',me=net?Math.min(1,net.me):0,vsHuman=!!net&&net.count>1;
  const si=clamp(opts.stage|0,0,STAGES.length-1),ST=STAGES[si],{ctx:c}=env.canvas2d(W,H);
  const names=net?[net.names[0]||'玩家 1',vsHuman?(net.names[1]||'玩家 2'):ST.opp]:two?['1P','2P']:pv?['你',ST.opp]:[opts.name||'你',ST.opp];
  const myCol=(opts.look&&opts.look.color)||'#c8202a',col2=net?((net.looks&&net.looks[1]&&net.looks[1].color)||'#2a4a8a'):two?'#2a4a8a':ST.col;
  const mk=n=>({n,x:n?470:330,vx:0,face:n?-1:1,act:'idle',at:0,cd:0,dcd:0,stam:1,last:'',lastT:-9,pow:n&&!two&&!vsHuman?ST.pow:1,mass:n&&!two&&!vsHuman?ST.mass:1,spd:n&&!two&&!vsHuman?ST.spd:1,
    col:n?col2:(net?((net.looks&&net.looks[0]&&net.looks[0].color)||myCol):myCol),big:n&&!two&&!vsHuman?ST.big:1,ai:n===1&&!two&&!vsHuman||pv,ait:0,aiPush:0,win:0,ext:0});
  const P=[mk(0),mk(1)]; if(P[0].col===P[1].col) P[1].col='#2a4a8a';
  let wt=false,phase='intro',PT=pv?.6:2.2,t=0,bout=1,fx=[],shake=0,slow=0,ban=null,winner=-1,ended=false,ev=[],sendT=0,refPoint=null,cheer=0;
  const rin={dx:0,push:false,dodge:false};
  const sfx=n=>{ if(pv) return; env.sfx(n); if(host) ev.push(n); };
  const say=(txt,col)=>{ ban={txt,col:col||'#ffd23f',t:0}; if(host) ev.push('b:'+txt+'|'+(col||'')); };
  function reset(){ for(const p of P){ p.x=p.n?470:330; p.vx=0; p.act='idle'; p.at=0; p.cd=0; p.dcd=0; p.stam=1; p.last=''; p.lastT=-9; p.ext=0; } phase='intro'; PT=pv?.6:1.8; refPoint=null; winner=-1;
    for(let i=0;i<18;i++) fx.push({k:'salt',x:(i%2?470:330)+(Math.random()-.5)*20,y:GY-150,vx:(Math.random()-.5)*120,vy:-120-Math.random()*80,g:500,l:1.1,L:1.1}); }
  reset();
  function inputOf(p){ const k=env.keys;
    if(pv||p.ai) return aiIn(p);
    if(two){ if(p.n===0) return {dx:(k.KeyD?1:0)-(k.KeyA?1:0),push:env.hit('KeyF'),dodge:env.hit('KeyG')};
      return {dx:(k.ArrowRight?1:0)-(k.ArrowLeft?1:0),push:env.hit('Comma')||env.hit('Enter')||env.hit('NumpadEnter'),dodge:env.hit('Period')||env.hit('ShiftRight')}; }
    if(p.n===1){ const o={dx:rin.dx,push:rin.push,dodge:rin.dodge}; rin.push=rin.dodge=false; return o; }
    return {dx:(k.ArrowRight||k.KeyD?1:0)-(k.ArrowLeft||k.KeyA?1:0),push:env.hit('KeyJ')||env.hit('Space'),dodge:env.hit('KeyK')}; }
  // 電腦：靠近、貼身時一邊頂一邊推手；自己快被推出去時，會閃身或拚命推手
  function aiIn(p){ const o=P[1-p.n],dir=Math.sign(o.x-p.x)||p.face,gap=Math.abs(o.x-p.x),S=pv?STAGES[Math.min(9,si+2)]:ST,edge=dir>0?p.x-RL:RR-p.x;
    p.ait-=1/60; let push=false,dodge=false;
    if(p.ait<=0){ p.ait=S.thr*(.6+Math.random()*.8); push=gap<CD+40; }
    if(edge<70&&gap<CD+30&&o.vx*-dir>60&&p.dcd<=0&&Math.random()<S.dodge*.06) dodge=true;
    if(o.act==='stumble'&&gap<CD+60) push=true;
    return {dx:p.stam<.12&&gap<CD+6&&edge>140?-dir*.3:dir,push,dodge}; }
  function finish(loser,kind){ if(phase!=='bout') return; winner=1-loser; P[winner].win++; phase='result'; PT=pv?1:2.4; slow=pv?0:.7; shake=.4; refPoint=winner===0?-1:1; cheer=1;
    const KM={thrust:'突出！',dodge:'閃身摔！',push:'推出！',hold:'寄切！'}; say(KM[kind]||'推出！',kind==='dodge'?'#7ae8ff':'#ffd23f'); sfx('boom');
    const L=P[loser]; for(let i=0;i<20;i++) fx.push({k:'dust',x:L.x,y:GY,vx:(Math.random()-.5)*260,vy:-Math.random()*120,g:200,r:10+Math.random()*12,l:.8,L:.8});
    fx.push({k:'ring',x:L.x,y:GY,r:180,c:'#fff3c0',l:.5,L:.5});
    if(!pv&&!client) for(let i=0;i<(P[winner].win>=2?16:6);i++) fx.push({k:'cush',x:80+Math.random()*640,y:150+Math.random()*60,vx:(Math.random()-.5)*160,vy:-200-Math.random()*120,g:600,r:Math.random()*3,c:['#c8202a','#3a8a4a','#d8a040','#6a2a8a'][i%4],l:3,L:3}); }
  function conclude(){ if(ended) return; ended=true; const w=P[0].win>P[1].win?0:1,mine=two||w===me;
    if(pv){ env.end({}); return; }
    if(!two&&!net&&w===0) recWin(si);
    env.sfx(mine?'win':'lose');
    env.end({title:two?(w?'2P':'1P')+' 獲勝！':mine?'你贏了！':names[w]+' 獲勝',big:P[0].win+' : '+P[1].win,text:two||net?'':'對手：'+ST.opp+'。'+(mine?'':'被推到邊邊時試試閃身！'),score:null,next:!two&&!net&&w===0&&si<STAGES.length-1}); }
  function snap(){ const m={s:[P.map(p=>[r1(p.x),r1(p.vx),p.act,r1(p.at),r1(p.stam),p.win,r1(p.ext)]),phase,r1(PT),bout,refPoint],e:ev}; ev=[]; return m; }
  if(net){
    if(client) net.onmsg=m=>{ if(m.s){ const s=m.s; s[0].forEach((a,i)=>{ const p=P[i]; p.tx=a[0]; p.vx=a[1]; p.act=a[2]; p.at=a[3]; p.stam=a[4]; p.win=a[5]; p.ext=a[6]; }); phase=s[1]; PT=s[2]; bout=s[3]; refPoint=s[4];
        for(const e of m.e){ if(e.startsWith('b:')){ const [tx,cl]=e.slice(2).split('|'); ban={txt:tx,col:cl||'#ffd23f',t:0}; } else env.sfx(e); } }
      else if(m.end){ P[0].win=m.end[0]; P[1].win=m.end[1]; conclude(); } };
    else { net.onmsg=(m,from)=>{ if(from===1&&m.i){ rin.dx=m.i[0]; if(m.i[1]) rin.push=true; if(m.i[2]) rin.dodge=true; } };
      net.onleave=i=>{ if(i===1&&!ended){ P[0].win=Math.max(2,P[1].win+1); net.send({end:[P[0].win,P[1].win]}); conclude(); } }; }
  }
  function step(dt){ const dtr=dt; if(slow>0){ slow-=dt; dt*=.35; } t+=dt;
    fx=stepFx(fx,dtr); if(ban) ban.t+=dtr; if(shake>0) shake-=dtr; if(cheer>0) cheer-=dtr*.4;
    if(phase==='intro'){ PT-=dt; if(PT<=0){ phase='ready'; PT=pv?.4:1.1; sfx('beep'); say('預備……','#fff'); } return; }
    if(phase==='ready'){ PT-=dt; if(PT<=0){ phase='bout'; PT=0; sfx('go'); say('發氣揚揚！'); for(const p of P){ p.vx=p.face*330*p.spd; p.act='push'; p.at=.3; } } return; }
    if(phase==='result'){ PT-=dt; for(const p of P){ p.vx*=Math.exp(-3*dt); p.x+=p.vx*dt; } if(PT<=0){ if(P[0].win>=2||P[1].win>=2){ if(host){ net.send(snap()); net.send({end:[P[0].win,P[1].win]}); } conclude(); } else { bout++; reset(); } } return; }
    // 比賽中
    const IN=P.map(p=>inputOf(p)); const [a,b]=P;
    for(const p of P){ const o=P[1-p.n],i=IN[p.n]; p.face=Math.sign(o.x-p.x)||p.face; if(p.cd>0) p.cd-=dt; if(p.dcd>0) p.dcd-=dt; if(p.at>0) p.at-=dt; p.ext=Math.max(0,p.ext-dt*4);
      if(p.act==='stumble'){ if(p.at<=0) p.act='idle'; continue; }
      if(p.act==='dodge'&&p.at<=0) p.act='idle';
      if(i.dodge&&p.dcd<=0&&p.act!=='dodge'){ p.act='dodge'; p.at=.42; p.dcd=1.4; p.stam=Math.max(0,p.stam-.12); sfx('skid'); fx.push({k:'dust',x:p.x,y:GY,vx:0,vy:-30,r:14,l:.4,L:.4}); }
      if(i.push&&p.cd<=0&&p.act!=='dodge'){ p.cd=.26; p.ext=1; p.act='thrust'; p.at=.2; p.stam=Math.max(0,p.stam-.07);
        if(Math.abs(o.x-p.x)<CD+26&&o.act!=='dodge'){ const k=(205+120*p.stam)*p.pow*(.55+.45*p.stam)/o.mass; o.vx+=p.face*k; p.vx-=p.face*35; o.last='hit'; p.last='thrust'; p.lastT=t; sfx('hurt'); shake=Math.max(shake,.12);
          const hx=(p.x+o.x)/2,hy=GY-86; fx.push({k:'star',x:hx,y:hy,r:0,l:.3,L:.3}); fx.push({k:'ring',x:hx,y:hy,r:60,l:.25,L:.25}); for(let q=0;q<3;q++) fx.push({k:'sweat',x:o.x,y:GY-120,vx:p.face*(60+Math.random()*90),vy:-80-Math.random()*80,g:500,l:.6,L:.6}); }
        else sfx('click'); }
      if(p.act==='idle'||p.act==='push'){ p.act=i.dx*p.face>0?'push':'idle'; }
      p.inDx=i.dx; p.stam=clamp(p.stam+(p.act==='push'&&Math.abs(o.x-p.x)<CD+4?-.16:.28)*dt,0,1); }
    // 貼身：兩邊一起頂，推力大的贏；閃身中的人讓對手衝過去
    const gap=b.x-a.x,dir=Math.sign(gap)||1,L=dir>0?a:b,R=dir>0?b:a;
    const touching=Math.abs(gap)<CD&&L.act!=='dodge'&&R.act!=='dodge',wasTouch=wt; wt=touching;
    if(touching){ const fL=(L.inDx>0?1:.22)*L.pow*(.5+.5*L.stam),fR=(R.inDx<0?1:.22)*R.pow*(.5+.5*R.stam),acc=(fL-fR)/(L.mass+R.mass)*560+Math.sin(t*1.3)*70+Math.sin(t*3.1)*40; /* 互頂時會來回拉鋸，不會永遠卡住 */
      const v=(L.vx*L.mass+R.vx*R.mass)/(L.mass+R.mass); let nv=(v+acc*dt)*Math.exp(-2.4*dt); if(L.inDx>0&&R.inDx<0&&Math.abs(nv)<6) nv*=.5;
      L.vx=R.vx=nv; const ov=CD-Math.abs(gap); L.x-=ov*R.mass/(L.mass+R.mass); R.x+=ov*L.mass/(L.mass+R.mass);
      if(!wasTouch){ const imp=Math.abs(L.vx-R.vx); if(imp>120){ sfx('bump'); shake=Math.max(shake,Math.min(.35,imp/1400)); const hx=(L.x+R.x)/2; fx.push({k:'ring',x:hx,y:GY-80,r:90+imp*.1,c:'#fff3c0',l:.35,L:.35}); for(let q=0;q<4;q++) fx.push({k:'star',x:hx+(Math.random()-.5)*40,y:GY-90+(Math.random()-.5)*40,r:Math.random()*3,l:.35,L:.35}); } }
      if(nv>40){ L.last='hold'; L.lastT=t; } else if(nv<-40){ R.last='hold'; R.lastT=t; }
      if(Math.random()<dt*8) fx.push({k:'dust',x:(nv>0?R:L).x,y:GY,vx:-nv*.3,vy:-20,r:8,l:.4,L:.4}); }
    else for(const p of P){ const o=P[1-p.n];
      if(p.act==='stumble'){ p.vx*=Math.exp(-.8*dt); }
      else { const want=p.inDx*170*p.spd*(p.act==='dodge'?.4:1); p.vx+=(want-p.vx)*Math.min(1,dt*(Math.abs(p.vx)>Math.abs(want)?2.2:7)); }
      if(p.act==='dodge'&&Math.abs(o.x-p.x)<CD+10&&o.vx*o.face>90&&o.act!=='stumble'){ o.act='stumble'; o.at=.85; o.vx=o.face*Math.max(Math.abs(o.vx),260); p.last='dodge'; p.lastT=t; sfx('skid'); say('閃身！','#7ae8ff'); } }
    for(const p of P){ p.x+=p.vx*dt; if(p.act==='push'&&Math.abs(p.vx)>120&&Math.random()<dt*10) fx.push({k:'dust',x:p.x-p.face*20,y:GY,vx:-p.vx*.2,vy:-30,r:9,l:.4,L:.4}); }
    // 出界：腳踩出草繩
    for(const p of P) if(p.x<RL-6||p.x>RR+6){ const w=P[1-p.n]; finish(p.n,t-w.lastT<.7?w.last:'push'); break; } }
  function update(dt){
    if(client){ const k=env.keys,i={dx:(k.ArrowRight||k.KeyD?1:0)-(k.ArrowLeft||k.KeyA?1:0),push:env.hit('KeyJ')||env.hit('Space'),dodge:env.hit('KeyK')};
      sendT-=dt; if(sendT<=0||i.push||i.dodge){ sendT=1/20; net.send({i:[-i.dx,i.push?1:0,i.dodge?1:0]}); } /* 右邊的人看到的畫面是鏡像 */
      t+=dt; fx=stepFx(fx,dt); if(ban) ban.t+=dt; for(const p of P) if(p.tx!=null) p.x+=(p.tx-p.x)*Math.min(1,dt*18); return; }
    if(ended) return; step(dt);
    if(host){ sendT-=dt; if(sendT<=0){ sendT=1/24; net.send(snap()); } } }
  function draw(){ const mir=client&&me===1; c.save(); if(shake>0) c.translate((Math.random()-.5)*shake*22,(Math.random()-.5)*shake*14);
    if(mir){ c.translate(W,0); c.scale(-1,1); }
    c.drawImage(bgCanvas(),0,0,W,H);
    if(cheer>0){ c.fillStyle='rgba(255,255,255,'+(.12*Math.abs(Math.sin(t*20))*cheer)+')'; for(let i=0;i<12;i++) c.fillRect((i*71+t*40)%W,160+(i*29)%110,4,4); }
    gyoji(c,400+Math.sin(t*.9)*16,GY-18,t,refPoint==null?null:(mir?-refPoint:refPoint));
    const order=P.slice().sort((x,y)=>(x.act==='dodge')-(y.act==='dodge'));
    for(const p of order){ let pose='idle',lean=0; if(phase==='intro') pose='stomp'; else if(phase==='ready') pose='crouch'; else if(phase==='result') pose=winner===p.n?'win':'stumble';
      else if(p.act==='stumble'){ pose='stumble'; lean=.35*p.face; } else if(p.act==='thrust'||p.ext>.2){ pose='thrust'; lean=.12*p.face; } else if(p.act==='push'){ pose='push'; lean=.2*p.face; }
      const dz=p.act==='dodge'?18:0,dxo=p.act==='dodge'?-p.face*14:0;
      if(p.act==='dodge'){ c.globalAlpha=.3; rikishi(c,p.x+p.face*12,GY,p.face,p.col,pose,t,{sc:p.big,noShadow:true,seed:p.n}); c.globalAlpha=1; }
      rikishi(c,p.x+dxo,GY+dz,mir?p.face:p.face,p.col,pose,t,{sc:p.big*(dz?1.05:1),lean:lean*(mir?-1:1)*(mir?-1:1),ext:p.ext,sweat:p.stam<.3,seed:p.n*3}); }
    fxDraw(c,fx);
    if(phase==='intro'&&bout===1&&!pv){ const mine=two?[0,1]:[me]; for(const i of mine){ const p=P[i],yy=GY-205+Math.sin(t*8)*6; c.fillStyle='#ffd23f'; c.strokeStyle='#14122b'; c.lineWidth=3; c.beginPath(); c.moveTo(p.x-14,yy-16); c.lineTo(p.x+14,yy-16); c.lineTo(p.x,yy); c.closePath(); c.fill(); c.stroke();
        c.save(); if(mir){ c.translate(p.x,0); c.scale(-1,1); c.translate(-p.x,0); } c.font='900 16px '+TC; c.textAlign='center'; c.lineWidth=4; const lb=two?(i?'2P':'1P'):'你'; c.strokeText(lb,p.x,yy-24); c.fillStyle='#ffd23f'; c.fillText(lb,p.x,yy-24); c.restore(); } }
    c.restore(); hud(mir); }
  function hud(mir){ const L=mir?1:0,Rr=1-L;
    const card=(p,x,al)=>{ c.fillStyle='rgba(20,12,10,.78)'; c.fillRect(x,10,250,52); c.fillStyle=p.col; c.fillRect(al?x+244:x,10,6,52);
      c.font='900 16px '+TC; c.textAlign=al?'right':'left'; c.textBaseline='middle'; c.fillStyle='#fff'; c.fillText(names[p.n],al?x+236:x+14,26);
      for(let k=0;k<2;k++){ c.beginPath(); c.arc(al?x+14+k*20:x+236-k*20,26,7,0,TAU); c.fillStyle=k<p.win?'#ffd23f':'rgba(255,255,255,.2)'; c.fill(); }
      c.fillStyle='rgba(255,255,255,.15)'; c.fillRect(x+14,44,222,8); c.fillStyle=p.stam>.5?'#3ed16a':p.stam>.25?'#ffc21a':'#ff4d4d'; if(al) c.fillRect(x+236-222*p.stam,44,222*p.stam,8); else c.fillRect(x+14,44,222*p.stam,8);
      c.font='700 10px '+TC; c.fillStyle='#cbb'; c.textAlign=al?'right':'left'; c.fillText('體力',al?x+236:x+14,58); };
    card(P[L],10,false); card(P[Rr],W-260,true);
    c.textAlign='center'; c.font='900 14px '+TC; c.fillStyle='#ffd23f'; c.fillText('第 '+bout+' 番　先贏 2 番',W/2,22); if(!two&&!net&&!pv){ c.font='700 12px '+TC; c.fillStyle='#ddd'; c.fillText('對手：'+ST.opp,W/2,42); }
    if(ban&&ban.t<1.6){ const u=Math.min(1,ban.t*6),sc=1+(1-u)*.8; c.save(); c.translate(W/2,150); c.scale(sc,sc); c.globalAlpha=Math.min(1,(1.6-ban.t)*3); c.font='900 52px '+TC; c.lineWidth=9; c.strokeStyle='#14122b'; c.strokeText(ban.txt,0,0); c.fillStyle=ban.col; c.fillText(ban.txt,0,0); c.restore(); c.globalAlpha=1; } }
  return {update,draw,destroy(){},_dbg:{P,get phase(){return phase;},get bout(){return bout;},step,finish}};
}
function stageShow(ctx,w,h,si,t){ const S=STAGES[si]; ctx.save(); ctx.scale(w/W,h/H); ctx.drawImage(bgCanvas(),0,0,W,H); gyoji(ctx,400,GY-18,t,null);
  const u=(t%3)/3,push=u>.3&&u<.8,x0=push?300+Math.sin(t*14)*3:300,ph=push?'push':u<.3?'stomp':'crouch';
  rikishi(ctx,x0,GY,1,'#c8202a',ph,t,{lean:push?.2:0}); rikishi(ctx,x0+CD+14,GY,-1,S.col,ph,t,{sc:S.big,lean:push?-.2:0,seed:2});
  ctx.font='900 22px '+TC; ctx.textAlign='center'; ctx.lineWidth=6; ctx.strokeStyle='#14122b'; ctx.strokeText('對手：'+S.opp,W/2,52); ctx.fillStyle='#ffd23f'; ctx.fillText('對手：'+S.opp,W/2,52); ctx.restore(); }
function preview(ctx,w,h,L,t){ const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#3a2030'); g.addColorStop(1,'#1a0e0a'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  const s=h/260; ctx.save(); ctx.translate(w/2,h*.92); ctx.scale(s,s); rikishi(ctx,0,0,1,(L&&L.color)||'#c8202a',Math.sin(t*1.5)>0?'stomp':'idle',t); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).sumo={name:'土俵推推王',tag:'SUMO PUSH',color:'#c8202a',online:true,maxPlayers:2,
  desc:'Q 版相撲一對一！貼著對手往前頂、連按推手把他推出土俵，被逼到邊邊時閃身讓對手自己衝出去。先贏 2 番獲勝，10 位力士一位比一位強。',
  goal:'把對手推出土俵（踩出草繩外）就贏一番，先贏 2 番的獲勝。',
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  stageGoal:i=>'對手「'+STAGES[i].opp+'」：'+TIPS[i]+' 把他推出土俵就贏一番，先贏 2 番。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['← →','前進、後退（貼著對手往前就是頂）'],['J','推手：連按把對手推出去'],['K','閃身：對手衝過來時閃開，讓他自己衝出場'],['雙人','1P：A D＋F 推、G 閃　2P：← →＋, 推、. 閃']],
  touchHelp:[['◀ ▶','前進、後退'],['推','連按推手'],['閃','對手衝過來時閃開']],
  touch:{left:[{l:'◀',c:'ArrowLeft',big:true},{l:'▶',c:'ArrowRight',big:true}],right:[{l:'閃',c:'KeyK'},{l:'推',c:'KeyJ',act:true}]},
  looks:[{key:'color',label:'兜襠布顏色',type:'color',opts:['#c8202a','#2a4a8a','#3a8a4a','#6a2a8a','#d8a040','#1e1e24','#ff7eb6','#f4f4f4']}],
  hubBest:()=>{ const n=STAGES.filter((s,i)=>hasWin(i)).length; return n?'打贏 <b>'+n+' / '+STAGES.length+'</b> 位力士':'尚無紀錄'; },
  stageBest:i=>hasWin(i)?'★ 贏過':'',
  stageShow,preview,thumb:(ctx,w,h,t)=>stageShow(ctx,w,h,9,t),create,_draw:{rikishi}};
})();
