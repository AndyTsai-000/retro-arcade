// 密碼炸彈大挑戰（終極密碼）：炸彈裡藏一個數字，大家輪流猜，範圍越縮越小，猜中密碼的人就被炸，一局玩到有人被炸為止。
// 單人配電腦、同機 2 人輪流用同一個數字鍵盤、連線最多 8 人（房主運算；密碼只在房主那邊）。連線可以讓玩家輪流出密碼（每局換下一個人出，出題的人不猜）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const SCN=[{name:'生日派對',fl:'#e8b48a'},{name:'樹屋秘密基地',fl:'#9a6a3a'},{name:'熱鬧夜市',fl:'#5a4a5a'},{name:'太空艙',fl:'#3a4258'},{name:'鬼屋',fl:'#2a2036'},{name:'頒獎舞台',fl:'#5a1a2a'}];
const PCOL=['#ff5d4f','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d','#3ddbd9','#ff7eb6'],BOTN=['小胖','阿美','大雄','小綠','阿花','鐵蛋','小豆'];
const BOTLOOK=i=>({char:['cat','bunny','chef','pirate','ninja','crown','bow','cap'][i%8],color:'auto',deco:['','shades','scarf','cape','blush','tie'][i%6]});
/* ---------- 背景 ---------- */
function balloon(c,x,y,col,t){ const b=Math.sin(t*1.5+x)*4; c.strokeStyle='rgba(80,60,60,.5)'; c.lineWidth=1; c.beginPath(); c.moveTo(x,y+22+b); c.quadraticCurveTo(x+6,y+50,x,y+80); c.stroke(); c.fillStyle=col; c.beginPath(); c.ellipse(x,y+b,16,20,0,0,TAU); c.fill(); c.fillStyle='rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(x-6,y-7+b,4,7,-.4,0,TAU); c.fill(); }
function bg(c,s,t){ const g=c.createLinearGradient(0,0,0,300);
  if(s===0){ g.addColorStop(0,'#ffe4ee'); g.addColorStop(1,'#ffd0dc'); c.fillStyle=g; c.fillRect(0,0,W,H); c.fillStyle='rgba(255,255,255,.45)'; for(let x=0;x<W;x+=40) c.fillRect(x,0,16,300);
    for(let k=0;k<2;k++){ c.strokeStyle='#c87a9a'; c.lineWidth=1.5; c.beginPath(); c.moveTo(0,30+k*26); c.quadraticCurveTo(400,80+k*26,W,30+k*26); c.stroke(); for(let i=0;i<16;i++){ const x=i*52+20+k*26,y=30+k*26+Math.sin(x/W*Math.PI)*50*0.98; c.fillStyle=PCOL[(i+k*3)%8]; c.beginPath(); c.moveTo(x-12,y); c.lineTo(x+12,y); c.lineTo(x,y+22); c.fill(); } }
    balloon(c,70,120,'#ff5d4f',t); balloon(c,110,100,'#ffd23f',t); balloon(c,690,110,'#4f9dff',t); balloon(c,735,128,'#c56bff',t);
    c.fillStyle='#fff'; c.font='900 22px '+TC; c.textAlign='center'; c.fillStyle='#d8508a'; c.fillText('★ HAPPY BIRTHDAY ★',400,118); }
  else if(s===1){ g.addColorStop(0,'#c89a64'); g.addColorStop(1,'#a87a48'); c.fillStyle=g; c.fillRect(0,0,W,H); for(let y=0;y<300;y+=34){ c.fillStyle='rgba(60,30,10,.22)'; c.fillRect(0,y,W,3); for(let x=(y/34%2)*90;x<W;x+=180) c.fillRect(x,y,3,34); }
    c.fillStyle='#6a4020'; rr(c,300,34,200,130,10); c.fill(); const sk=c.createLinearGradient(0,44,0,154); sk.addColorStop(0,'#7ec8ff'); sk.addColorStop(1,'#d8f4ff'); c.fillStyle=sk; c.fillRect(312,46,176,106); for(let i=0;i<9;i++){ c.fillStyle=i%2?'#3a9a3a':'#4ab84a'; c.beginPath(); c.arc(312+i*22,150+Math.sin(t+i)*2,20,0,TAU); c.fill(); } c.fillStyle='#6a4020'; c.fillRect(396,46,8,106); c.fillRect(312,96,176,6);
    for(const x of [120,680]){ c.strokeStyle='#3a2a1a'; c.lineWidth=2; c.beginPath(); c.moveTo(x,0); c.lineTo(x,50); c.stroke(); const f=.8+Math.sin(t*7+x)*.1; c.fillStyle='rgba(255,210,100,'+.25*f+')'; c.beginPath(); c.arc(x,74,50,0,TAU); c.fill(); c.fillStyle='#ffd27a'; rr(c,x-14,50,28,40,6); c.fill(); c.strokeStyle='#5a3a1a'; c.lineWidth=3; c.stroke(); }
    c.fillStyle='#e8d0a0'; c.fillRect(560,170,120,80); c.fillStyle='#d84a3a'; c.font='900 16px '+TC; c.textAlign='center'; c.fillText('禁止大人',620,206); c.fillText('進入！',620,228); }
  else if(s===2){ g.addColorStop(0,'#141030'); g.addColorStop(1,'#3a2050'); c.fillStyle=g; c.fillRect(0,0,W,H); c.fillStyle='#fff'; for(let i=0;i<40;i++) c.fillRect((i*137)%W,(i*61)%120,1.5,1.5);
    for(let k=0;k<4;k++){ const x=k*200; c.fillStyle=['#d84a3a','#3a8aff','#ffb02a','#3aa85a'][k]; c.beginPath(); c.moveTo(x+6,150); c.lineTo(x+100,112); c.lineTo(x+194,150); c.fill(); for(let i=0;i<6;i++){ c.fillStyle=i%2?'#fff':'rgba(0,0,0,.15)'; c.fillRect(x+10+i*31,150,31,16); } c.fillStyle='#2a1a2a'; c.fillRect(x+14,166,172,90); c.fillStyle='rgba(255,200,120,.25)'; c.fillRect(x+20,172,160,60); c.fillStyle='#fff'; c.font='900 17px '+TC; c.textAlign='center'; c.fillText(['大腸包小腸','珍珠奶茶','雞排','撈金魚'][k],x+100,206); }
    c.strokeStyle='#5a4a3a'; c.lineWidth=1.5; c.beginPath(); c.moveTo(0,40); c.quadraticCurveTo(400,100,W,40); c.stroke(); for(let i=0;i<13;i++){ const x=30+i*62,y=40+Math.sin(x/W*Math.PI)*58*0.98,f=.85+Math.sin(t*3+i)*.15; c.fillStyle='rgba(255,90,60,'+.3*f+')'; c.beginPath(); c.arc(x,y+16,22,0,TAU); c.fill(); c.fillStyle='#ff5a3a'; c.beginPath(); c.ellipse(x,y+16,11,14,0,0,TAU); c.fill(); c.fillStyle='#ffd23f'; c.fillRect(x-7,y,14,3); c.fillRect(x-7,y+29,14,3); } }
  else if(s===3){ g.addColorStop(0,'#0a0e24'); g.addColorStop(1,'#1a2448'); c.fillStyle=g; c.fillRect(0,0,W,H); c.fillStyle='#4a5470'; c.fillRect(0,0,W,300); c.strokeStyle='#2a3048'; c.lineWidth=3; for(let x=0;x<W;x+=100) c.strokeRect(x,0,100,150); for(let x=50;x<W;x+=100) c.strokeRect(x,150,100,150);
    c.fillStyle='#7a84a0'; for(let x=0;x<W;x+=100) for(const y of [8,142,158,292]){ c.beginPath(); c.arc(x+8,y,2.5,0,TAU); c.arc(x+92,y,2.5,0,TAU); c.fill(); }
    for(const [x,r] of [[130,58],[670,58]]){ c.fillStyle='#2a3048'; c.beginPath(); c.arc(x,110,r+10,0,TAU); c.fill(); c.fillStyle='#04061a'; c.beginPath(); c.arc(x,110,r,0,TAU); c.fill(); c.save(); c.beginPath(); c.arc(x,110,r,0,TAU); c.clip(); c.fillStyle='#fff'; for(let i=0;i<30;i++) c.fillRect(x-r+((i*53+t*8)%(2*r)),110-r+(i*37)%(2*r),1.5,1.5); if(x<400){ c.fillStyle='#4a90e0'; c.beginPath(); c.arc(x+20,140,44,0,TAU); c.fill(); c.fillStyle='#5ac85a'; c.beginPath(); c.arc(x+8,128,14,0,TAU); c.arc(x+36,150,10,0,TAU); c.fill(); } else { c.fillStyle='#e8a050'; c.beginPath(); c.arc(x-14,96,26,0,TAU); c.fill(); c.strokeStyle='#ffe0a0'; c.lineWidth=3; c.beginPath(); c.ellipse(x-14,96,42,9,-.3,0,TAU); c.stroke(); } c.restore(); }
    for(let i=0;i<8;i++){ const on=(Math.floor(t*3)+i)%3===0; c.fillStyle=on?'#3dffb0':'#1a5a4a'; c.beginPath(); c.arc(300+i*28,40,6,0,TAU); c.fill(); } }
  else if(s===4){ g.addColorStop(0,'#1a0e2e'); g.addColorStop(1,'#3a2050'); c.fillStyle=g; c.fillRect(0,0,W,H); c.fillStyle='#fff6c8'; c.beginPath(); c.arc(640,70,40,0,TAU); c.fill(); c.fillStyle='#1a0e2e'; c.beginPath(); c.arc(656,62,36,0,TAU); c.fill();
    for(let i=0;i<4;i++){ const x=(i*230+t*30)%(W+60)-30,y=60+Math.sin(t*3+i)*16+i*18,f=Math.sin(t*14+i)*6; c.fillStyle='#0a0612'; c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x-12,y-10-f,x-26,y-2); c.quadraticCurveTo(x-14,y+2,x,y+6); c.quadraticCurveTo(x+14,y+2,x+26,y-2); c.quadraticCurveTo(x+12,y-10-f,x,y); c.fill(); }
    c.strokeStyle='rgba(220,220,240,.5)'; c.lineWidth=1; for(let k=0;k<6;k++){ c.beginPath(); c.moveTo(0,0); c.lineTo(Math.cos(k/10*Math.PI)*110,Math.sin(k/10*Math.PI)*110); c.stroke(); } for(let r=20;r<=100;r+=20){ c.beginPath(); for(let k=0;k<6;k++){ const a=k/10*Math.PI; c.lineTo(Math.cos(a)*r,Math.sin(a)*r); } c.stroke(); }
    c.fillStyle='#4a3a5a'; for(let i=0;i<3;i++){ const x=200+i*200; c.fillRect(x-30,196,60,8); } for(let i=0;i<6;i++){ const x=180+i*80,f=1+Math.sin(t*12+i)*.2; c.fillStyle='#f4ecd8'; c.fillRect(x-4,176,8,22); c.fillStyle='rgba(255,200,90,.25)'; c.beginPath(); c.arc(x,170,16*f,0,TAU); c.fill(); c.fillStyle='#ffb02a'; c.beginPath(); c.ellipse(x,170,3.5,7*f,0,0,TAU); c.fill(); }
    const gy=Math.sin(t*1.4)*10; c.globalAlpha=.55+Math.sin(t*2)*.2; c.fillStyle='#f4f4ff'; c.beginPath(); c.arc(90,120+gy,24,Math.PI,0); c.lineTo(114,160+gy); for(let k=0;k<4;k++) c.lineTo(108-k*12,(k%2?150:160)+gy); c.lineTo(66,160+gy); c.fill(); c.fillStyle='#1a0e2e'; c.beginPath(); c.arc(82,120+gy,4,0,TAU); c.arc(98,120+gy,4,0,TAU); c.fill(); c.globalAlpha=1; }
  else { g.addColorStop(0,'#2a0a1a'); g.addColorStop(1,'#4a0e24'); c.fillStyle=g; c.fillRect(0,0,W,H);
    for(let i=0;i<5;i++){ const a=Math.sin(t*.9+i*1.3)*.35; c.save(); c.globalAlpha=.14; c.fillStyle='#fff6c8'; c.translate(120+i*140,0); c.rotate(a); c.beginPath(); c.moveTo(-6,0); c.lineTo(6,0); c.lineTo(90,420); c.lineTo(-90,420); c.fill(); c.restore(); }
    for(const d of [0,1]){ const x0=d?W:0,s2=d?-1:1; for(let i=0;i<5;i++){ c.fillStyle=i%2?'#b0182e':'#d02040'; c.beginPath(); c.moveTo(x0+s2*i*30,0); c.quadraticCurveTo(x0+s2*(i*30+22),150,x0+s2*(i*26+10),300); c.lineTo(x0+s2*(i*26+40),300); c.quadraticCurveTo(x0+s2*(i*30+48),150,x0+s2*(i*30+30),0); c.fill(); } }
    c.fillStyle='#d02040'; for(let i=0;i<20;i++){ c.beginPath(); c.arc(i*42+21,0,26,0,Math.PI); c.fill(); } c.fillStyle='#ffd23f'; c.font='900 24px '+TC; c.textAlign='center'; c.fillText('🏆 密碼之王 🏆',400,70);
    for(let i=0;i<18;i++){ const x=(i*97+t*40)%W,y=(i*53+t*60)%300; c.fillStyle=PCOL[i%8]; c.save(); c.translate(x,y); c.rotate(t*3+i); c.fillRect(-4,-2,8,4); c.restore(); } }
  /* 地板 */
  const fy=290,fg=c.createLinearGradient(0,fy,0,H); fg.addColorStop(0,SCN[s].fl); fg.addColorStop(1,'#00000066'); c.fillStyle=SCN[s].fl; c.fillRect(0,fy,W,H-fy); c.fillStyle=fg; c.fillRect(0,fy,W,H-fy); c.fillStyle='rgba(0,0,0,.18)'; c.fillRect(0,fy,W,4);
  if(s===0||s===1){ c.strokeStyle='rgba(0,0,0,.12)'; c.lineWidth=2; for(let y=fy+30;y<H;y+=34){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); } }
  if(s===5){ c.fillStyle='rgba(255,210,60,.18)'; c.beginPath(); c.ellipse(400,370,330,70,0,0,TAU); c.fill(); } }
/* ---------- 炸彈＋液晶螢幕 ---------- */
function bombArt(c,x,y,R,t,hot,lo,hi,flash,boomT){ c.save(); c.translate(x+(hot>.5?Math.sin(t*46)*hot*3:0),y);
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0,R*.98,R*.9,R*.18,0,0,TAU); c.fill();
  const g=c.createRadialGradient(-R*.35,-R*.4,R*.1,0,0,R); g.addColorStop(0,'#6a6a7a'); g.addColorStop(.6,'#24242e'); g.addColorStop(1,'#0c0c12'); c.fillStyle=g; c.beginPath(); c.arc(0,0,R,0,TAU); c.fill();
  if(hot>.35){ c.fillStyle='rgba(255,40,30,'+(hot*.35*(.6+.4*Math.sin(t*(8+hot*20))))+')'; c.beginPath(); c.arc(0,0,R,0,TAU); c.fill(); }
  c.fillStyle='rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(-R*.42,-R*.5,R*.2,R*.12,-.6,0,TAU); c.fill();
  c.fillStyle='#55555f'; rr(c,-R*.22,-R*1.12,R*.44,R*.24,4); c.fill(); c.strokeStyle='#c8a060'; c.lineWidth=R*.09; c.lineCap='round'; c.beginPath(); c.moveTo(0,-R*1.1); c.quadraticCurveTo(R*.45,-R*1.5,R*.66,-R*1.22); c.stroke();
  const fx=R*.66,fy=-R*1.22,f=1+Math.sin(t*40)*.3; c.fillStyle='#ffd23f'; c.beginPath(); c.arc(fx,fy,R*.13*f,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(fx,fy,R*.06*f,0,TAU); c.fill(); for(let i=0;i<6;i++){ const a=t*30+i*1.1; c.fillStyle='#ff9d3d'; c.fillRect(fx+Math.cos(a)*R*.24,fy+Math.sin(a)*R*.24,2.5,2.5); }
  /* 螢幕 */
  const sw=R*1.5,sh=R*.62; c.fillStyle='#14141c'; rr(c,-sw/2-6,-sh/2-6,sw+12,sh+12,10); c.fill(); c.fillStyle=flash>0?'#d8ffb0':'#1a3a1a'; rr(c,-sw/2,-sh/2,sw,sh,7); c.fill();
  c.fillStyle=flash>0?'#14301a':'#7aff7a'; c.font='900 '+Math.round(R*.4)+'px "Courier New",monospace'; c.textAlign='center'; c.textBaseline='middle'; c.shadowColor='#7aff7a'; c.shadowBlur=flash>0?0:10;
  c.fillText(boomT?'BOOM!':lo+' ~ '+hi,0,2); c.shadowBlur=0;
  c.fillStyle='#ff3b3b'; c.beginPath(); c.arc(-sw/2+10,-sh/2-14,4,0,TAU); c.fill(); if(Math.sin(t*(4+hot*16))>0){ c.fillStyle='#ff9a9a'; c.beginPath(); c.arc(-sw/2+10,-sh/2-14,2,0,TAU); c.fill(); }
  c.restore(); }

let SET_ROT=0; // 連線輪流出密碼：房主記到第幾個人了（重玩時換下一個）
function create(env,opts){
  const {ctx:c,canvas}=env.canvas2d(W,H),net=opts.net,client=!!net&&!net.host,host=!client,two=!net&&opts.mode==='2p',pv=!!opts.preview,OP=opts.options||{},sc=clamp(opts.stage|0,0,SCN.length-1);
  const MAX=+OP.max||100,TL=OP.time==null?15:+OP.time,ST=30;
  const humans=net?net.count:pv?0:two?2:1,n=net?clamp(net.count+(net.bots||0),2,8):clamp(+OP.seats||5,2,8),me=net?net.me:0;
  const names=[],looks=[]; for(let i=0;i<n;i++){ if(i<humans){ names.push(net?(net.names&&net.names[i])||'玩家'+(i+1):two?(i+1)+'P':(opts.name||'你')); looks.push(net?(net.looks&&net.looks[i])||{}:i===0?opts.look||{}:{}); } else { names.push(BOTN[(i-humans+sc*2)%BOTN.length]); looks.push(BOTLOOK(i+sc)); } }
  const colOf=i=>{ const L=looks[i]; return !L||!L.color||L.color==='auto'?PCOL[i%8]:L.color; };
  const mine=i=>two?i<2:i===me;
  let secret=0,t=0,ended=false,sendT=0,evq=[],shake=0,fx=[],buf='',aiT=1,aiN=0,aiTxt='',flash=0,pops=[];
  let mySec=0; const setter=net&&host&&OP.setter!=='cpu'&&!pv?(SET_ROT++)%net.count:-1;
  let G={ph:'intro',T:pv?.4:3,lo:1,hi:MAX,dlo:1,dhi:MAX,wait:0,cur:0,setter,turnT:TL,boom:Array(n).fill(0),last:null,hits:0,boomAt:-1,boomN:0,msg:'',guessN:0,typing:'',hist:[]};
  const nxt=i=>{ let q=(i+1)%n; if(q===G.setter) q=(q+1)%n; return q; }; G.cur=(opts.first||0)%n; if(G.cur===G.setter) G.cur=nxt(G.cur);
  const sfx=k=>{ if(pv) return; env.sfx(k); if(net&&host) evq.push(k); };
  const tone=(f,d,type,v)=>{ const A=env.audio&&env.audio(); if(!A||pv) return; try{ const o=A.createOscillator(),g=A.createGain(),t0=A.currentTime; o.type=type||'square'; o.frequency.value=f; g.gain.setValueAtTime(v||.05,t0); g.gain.exponentialRampToValueAtTime(.001,t0+d); o.connect(g); g.connect((env.out&&env.out())||A.destination); o.start(t0); o.stop(t0+d+.02); }catch(e){} };
  const hot=()=>1-clamp((G.hi-G.lo)/(MAX-1),0,1);
  function newRound(){ if(G.setter>=0&&!secret){ G.ph='set'; G.turnT=ST; return; } if(!secret) secret=1+Math.floor(Math.random()*MAX); G.lo=1; G.hi=MAX; G.dlo=1; G.dhi=MAX; G.wait=0; G.last=null; G.ph='turn'; G.turnT=TL; G.msg=''; startTurn(); sfx('go'); }
  function startTurn(){ G.turnT=TL; G.typing=''; buf=''; aiT=1.8+Math.random()*1.6; aiN=pickBot(); aiTxt=''; }
  /* 電腦：大多猜中間附近，有時故意只縮一點點、有時大膽砍一刀 */
  function pickBot(){ const lo=G.lo,hi=G.hi,sz=hi-lo; if(sz<=0) return lo; const r=Math.random(); let g; if(sz<=3) g=lo+Math.floor(Math.random()*(sz+1)); else if(r<.25) g=Math.random()<.5?lo+1+Math.floor(Math.random()*2):hi-1-Math.floor(Math.random()*2); else if(r<.5) g=Math.round(lo+sz*(.5+(Math.random()-.5)*.3)); else g=Math.round(lo+sz*(.2+Math.random()*.6)); return clamp(g,lo,hi); }
  function guess(who,g){ if(G.ph!=='turn'||who!==G.cur) return false; g=Math.round(+g); if(!(g>=G.lo&&g<=G.hi)) return false;
    G.guessN++; G.last={who,g,dir:0}; G.hist.push([who,g]);
    if(g===secret){ G.ph='boom'; G.T=4; G.boom[who]++; G.boomAt=who; G.boomN++; G.hits=secret; G.msg=names[who]+' 猜中密碼 '+secret+'！'; sfx('boom'); sfx('hurt'); return true; }
    if(g<secret){ G.lo=g+1; G.dlo=g; G.last.dir=1; } else { G.hi=g-1; G.dhi=g; G.last.dir=-1; }
    G.wait=1.4; // 猜完停一下，讓大家看清楚
    sfx('place'); G.cur=nxt(G.cur); startTurn(); return true; }
  function setSecret(who,v){ if(G.ph!=='set'||who!==G.setter) return; v=Math.round(+v); if(!(v>=1&&v<=MAX)) return; secret=v; newRound(); }
  function stepHost(dt){
    if(G.ph==='intro'){ G.T-=dt; if(G.T<=0) newRound(); return; }
    if(G.ph==='set'){ G.turnT-=dt; if(G.turnT<=0){ secret=1+Math.floor(Math.random()*MAX); newRound(); } return; }
    if(G.ph==='turn'&&G.wait>0){ G.wait-=dt; return; }
    if(G.ph==='turn'){ if(TL>0){ G.turnT-=dt; if(G.turnT<=0){ const g=G.lo+Math.floor(Math.random()*(G.hi-G.lo+1)); G.msg='時間到！自動猜 '+g; guess(G.cur,g); return; } }
      if(G.cur>=humans){ aiT-=dt; const s=String(aiN); G.typing=s.slice(0,clamp(Math.floor((1.3-aiT)*3)+1,0,s.length)*(aiT<1.3?1:0)); if(aiT<=0) guess(G.cur,aiN); } }
    if(G.ph==='boom'){ G.T-=dt; if(G.T<=0){ G.ph='end'; G.T=.3; } }
    if(G.ph==='end'){ G.T-=dt; if(G.T<=0&&!ended){ ended=true; if(net) net.send({st:G}); finish(); } } }
  function finish(){ const L=G.boomAt,meLose=two?L<2:L===me,iSet=!two&&G.setter===me&&me>=0; if(!net&&!pv&&!(two?false:meLose)) try{ localStorage.setItem('arcade.boomcode.safe',(+localStorage.getItem('arcade.boomcode.safe')||0)+1); }catch(e){}
    env.sfx(meLose&&!two?'lose':'win');
    env.end({title:names[L]+' 猜中密碼 '+G.hits+'，被炸了！',big:two?(L===0?'2P 獲勝':L===1?'1P 獲勝':'1P、2P 都安全'):meLose?'你被炸了！':iSet?'你的密碼炸到 '+names[L]+'！':'你安全了！',
      text:'密碼是 '+G.hits+(G.setter>=0?'（'+names[G.setter]+' 出的）':'')+'，大家一共猜了 '+G.hist.length+' 次',
      html:'<table class="ls"><tr><th>順序</th><th>玩家</th><th>猜的數字</th></tr>'+G.hist.map((h,k)=>'<tr><td>'+(k+1)+'</td><td>'+names[h[0]]+'</td><td>'+(h[0]===L&&k===G.hist.length-1?'💥 '+h[1]:h[1])+'</td></tr>').join('')+'</table>',score:null}); }
  const pub=()=>Object.assign({},G); // 密碼不在 G 裡，別人看不到
  if(net){ if(client) net.onmsg=m=>{ if(m.st){ const was=G.boomN,wasG=G.guessN; G=m.st; if(G.boomN>was) bigBoom(); if(G.guessN>wasG&&G.ph==='turn'){ buf=''; pop(); } if(G.ph==='end'&&!ended&&G.T<=0){ ended=true; finish(); } } if(m.ev) for(const k of m.ev) env.sfx(k); };
    else net.onmsg=(m,from)=>{ if(m.g!=null) guess(from,m.g); if(m.sec!=null) setSecret(from,m.sec); }; }
  const BX=400,BY=150,BR=86;
  function bigBoom(){ shake=18; flash=0; for(let i=0;i<90;i++){ const a=Math.random()*TAU,s=80+Math.random()*420; fx.push({x:BX,y:BY,vx:Math.cos(a)*s,vy:Math.sin(a)*s-80,l:.5+Math.random()*.9,c:['#ffd23f','#ff7a3d','#ff3b3b','#fff','#55505a'][i%5],s:3+Math.random()*7}); } fx.push({ring:1,x:BX,y:BY,l:.6,L:.6}); const p=seat(G.boomAt); for(let i=0;i<14;i++) fx.push({smoke:1,x:p[0]+(Math.random()-.5)*30,y:p[1]-90,vx:(Math.random()-.5)*30,vy:-30-Math.random()*30,l:1.4+Math.random(),c:'#3a3438',s:10+Math.random()*10}); }
  function pop(){ flash=.18; if(G.last){ const p=seat(G.last.who); pops.push({x:p[0],y:p[1]-80,g:G.last.g,dir:G.last.dir,l:2}); } tone(500+hot()*700,.08,'square',.05); }
  const seat=i=>{ const u=n<2?.5:i/(n-1),x=70+u*660,y=420-Math.sin(u*Math.PI)*50; return [x,y]; };
  /* 數字鍵盤（在自己回合才出現） */
  const KEYS=['1','2','3','4','5','6','7','8','9','0','⌫','確定'],kRect=k=>{ const w=58,gp=6,x0=W/2-(12*(w+gp)-gp)/2; return [x0+k*(w+gp),H-50,w+(k===11?0:0),42]; };
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const mySet=()=>G.ph==='set'&&G.setter===me&&!pv&&!mySec,myTurn=()=>!pv&&(mySet()||G.ph==='turn'&&!(G.wait>0)&&(two?G.cur<2:G.cur===me));
  const rng=()=>mySet()?[1,MAX]:[G.lo,G.hi];
  function type(k){ if(!myTurn()) return; if(k==='⌫'){ buf=buf.slice(0,-1); tone(300,.04); return; } if(k==='確定'){ submit(); return; } if(buf.length>=String(MAX).length) return; buf=(buf+k).replace(/^0+/,''); tone(700,.04); }
  function submit(){ if(!buf) return; const g=+buf,[lo,hi]=rng(); if(!(g>=lo&&g<=hi)){ G.bad=.6; buf=''; env.sfx('bump'); return; }
    if(mySet()){ mySec=g; buf=''; tone(900,.1); if(client) net.send({sec:g}); else setSecret(me,g); return; } if(client){ net.send({g}); buf=''; G.typing=''; } else { const w=G.cur; buf=''; guess(w,g); } }
  let pressK=-1,pressT=0;
  const pd=e=>{ if(!myTurn()) return; const [x,y]=toG(e); for(let k=0;k<12;k++){ const [a,b,w,h]=kRect(k); if(x>=a&&x<=a+w&&y>=b&&y<=b+h){ pressK=k; pressT=.12; type(KEYS[k]); } } };
  canvas.addEventListener('pointerdown',pd);
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt; if(shake>0) shake=Math.max(0,shake-dt*30); if(flash>0) flash-=dt; if(pressT>0) pressT-=dt; if(G.bad>0) G.bad-=dt;
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; if(f.l<=0){ fx.splice(i,1); continue; } if(f.smoke){ f.x+=f.vx*dt; f.y+=f.vy*dt; f.s+=dt*14; } else if(!f.ring){ f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=480*dt; } }
    for(let i=pops.length-1;i>=0;i--){ pops[i].l-=dt; if(pops[i].l<=0) pops.splice(i,1); }
    if(myTurn()){ for(let d=0;d<10;d++) if(env.hit('Digit'+d)||env.hit('Numpad'+d)) type(String(d)); if(env.hit('Backspace')) type('⌫'); if(env.hit('Enter')||env.hit('NumpadEnter')||env.hit('Space')) type('確定');
      const [lo,hi]=rng(); if(env.hit('ArrowUp')){ buf=String(clamp((+buf||lo-1)+1,lo,hi)); tone(700,.03); } if(env.hit('ArrowDown')){ buf=String(clamp((+buf||hi+1)-1,lo,hi)); tone(700,.03); }
      if(env.hit('ArrowRight')){ buf=String(clamp((+buf||lo)+10,lo,hi)); tone(760,.03); } if(env.hit('ArrowLeft')){ buf=String(clamp((+buf||hi)-10,lo,hi)); tone(760,.03); } }
    if(client) return;
    const was=G.boomN,wasG=G.guessN,wasPh=G.ph; stepHost(dt); if(G.boomN>was) bigBoom(); else if(G.guessN>wasG) pop();
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/12; net.send({st:pub()}); if(evq.length){ net.send({ev:evq}); evq=[]; } } } }
  function draw(){ c.save(); if(shake>0) c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake); bg(c,sc,t);
    /* 桌子 */ c.fillStyle='rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(BX,BY+BR+26,150,26,0,0,TAU); c.fill(); c.fillStyle='#8a5a34'; rr(c,BX-140,BY+BR+4,280,22,10); c.fill(); c.fillStyle='#a8744a'; rr(c,BX-140,BY+BR,280,12,6); c.fill();
    const H0=hot(),boomNow=G.ph==='boom'&&G.T>1.2;
    if(!boomNow) bombArt(c,BX,BY,BR,t,H0,G.dlo,G.dhi,flash,0);
    /* 範圍條 */ const bx0=150,bw=500,by=BY+BR+44; c.fillStyle='rgba(11,10,28,.6)'; rr(c,bx0-8,by-8,bw+16,30,10); c.fill(); c.fillStyle='rgba(255,255,255,.12)'; rr(c,bx0,by,bw,14,7); c.fill();
    const X=v=>bx0+(v-1)/(MAX-1||1)*bw,x1=X(G.dlo),x2=X(G.dhi); const gg=c.createLinearGradient(x1,0,x2+1,0); gg.addColorStop(0,H0>.7?'#ff5d4f':'#ffd23f'); gg.addColorStop(1,H0>.7?'#ff9d3d':'#5fd068'); c.fillStyle=gg; rr(c,x1,by,Math.max(8,x2-x1),14,7); c.fill();
    c.fillStyle='#fff'; c.font='700 11px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('1',bx0-1,by+28); c.fillText(String(MAX),bx0+bw,by+28); if(G.last&&G.ph==='turn'){ const lx=X(G.last.g); c.fillStyle='#ff5a9a'; c.beginPath(); c.moveTo(lx,by-2); c.lineTo(lx-6,by-12); c.lineTo(lx+6,by-12); c.fill(); }
    /* 人物 */ const C=window.ARCADE_CHAR; for(let i=0;i<n;i++){ const [x,y]=seat(i),cur=G.cur===i&&(G.ph==='turn'),L=looks[i]||{},hitMe=G.boomAt===i&&(G.ph==='boom'||G.ph==='end');
      if(cur){ c.fillStyle='rgba(255,210,63,.35)'; c.beginPath(); c.ellipse(x,y+4,40,12,0,0,TAU); c.fill(); c.fillStyle='#ffd23f'; c.beginPath(); const by2=y-124+Math.sin(t*6)*4; c.moveTo(x,by2+12); c.lineTo(x-9,by2); c.lineTo(x+9,by2); c.fill(); }
      if(C) C.drawChar(c,x,y-38,hitMe?'#4a4044':colOf(i),1,cur,t+i,1.7,L.char||'cap',L.deco||''); if(hitMe){ c.fillStyle='rgba(30,26,30,.55)'; c.beginPath(); c.arc(x,y-76,26,0,TAU); c.fill(); c.strokeStyle='#ffd23f'; c.lineWidth=2; c.beginPath(); for(let k=0;k<3;k++){ const a=t*5+k*2.1; c.moveTo(x+Math.cos(a)*24,y-84+Math.sin(a)*5); c.lineTo(x+Math.cos(a)*24+3,y-88+Math.sin(a)*5); } c.stroke(); }
      const nm=names[i].slice(0,6); c.font='900 12px '+TC; c.textAlign='center'; c.textBaseline='middle'; const w2=c.measureText(nm).width+14; c.fillStyle=mine(i)?'#ffd23f':'rgba(11,10,28,.75)'; rr(c,x-w2/2,y+6,w2,18,9); c.fill(); c.fillStyle=mine(i)?'#14122b':'#fff'; c.fillText(nm,x,y+15);
      if(G.setter===i){ c.fillStyle='#ffd23f'; rr(c,x-34,y+28,68,18,9); c.fill(); c.fillStyle='#14122b'; c.font='900 11px '+TC; c.fillText('🔑 出密碼',x,y+37); }
      if(cur&&i>=humans&&G.typing){ c.fillStyle='#fff'; rr(c,x-30,y-148,60,28,10); c.fill(); c.fillStyle='#14122b'; c.font='900 18px "Courier New",monospace'; c.fillText(G.typing,x,y-134); }
      else if(cur&&i>=humans){ c.fillStyle='rgba(255,255,255,.9)'; rr(c,x-24,y-146,48,24,10); c.fill(); c.fillStyle='#14122b'; c.font='900 16px sans-serif'; c.fillText('.'.repeat(1+Math.floor(t*3)%3),x,y-134); } }
    /* 猜的數字飛出來 */ for(const p of pops){ const a=Math.min(1,p.l*2),u=1-p.l/2; c.globalAlpha=a; c.font='900 26px "Courier New",monospace'; c.lineWidth=5; c.strokeStyle='#14122b'; c.textAlign='center'; const y=p.y-u*30; c.strokeText(p.g,p.x,y); c.fillStyle='#fff'; c.fillText(p.g,p.x,y); c.font='900 14px '+TC; const s=p.dir>0?'密碼比較大 ▲':'密碼比較小 ▼'; c.strokeText(s,p.x,y+22); c.fillStyle=p.dir>0?'#7aff7a':'#7ac8ff'; c.fillText(s,p.x,y+22); c.globalAlpha=1; }
    for(const f of fx){ if(f.ring){ const a=f.l/f.L; c.globalAlpha=a; c.strokeStyle='#ffd23f'; c.lineWidth=12*a+1; c.beginPath(); c.arc(f.x,f.y,(1-a)*260,0,TAU); c.stroke(); c.globalAlpha=1; } else if(f.smoke){ c.globalAlpha=Math.min(.6,f.l*.5); c.fillStyle=f.c; c.beginPath(); c.arc(f.x,f.y,f.s,0,TAU); c.fill(); c.globalAlpha=1; } else { c.globalAlpha=Math.min(1,f.l*2); c.fillStyle=f.c; c.fillRect(f.x,f.y,f.s,f.s); c.globalAlpha=1; } }
    if(boomNow){ const k=(G.T-1.2)/1.8; c.fillStyle='rgba(255,240,180,'+Math.max(0,k-.6)*2+')'; c.fillRect(0,0,W,H); bombArt(c,BX,BY,BR*.9,t,1,0,0,0,1); }
    c.restore();
    c.textAlign='center'; c.textBaseline='middle';
    if(G.ph==='boom'||G.ph==='end'){ c.font='900 30px '+TC; c.lineWidth=7; c.strokeStyle='#14122b'; c.strokeText(G.msg,W/2,BY-BR-8>30?BY-BR-14:40); c.fillStyle='#ffd23f'; c.fillText(G.msg,W/2,BY-BR-8>30?BY-BR-14:40); }
    if(G.ph==='intro'){ const s='誰會踩到密碼？'; c.font='900 34px '+TC; c.lineWidth=7; c.strokeStyle='#14122b'; c.strokeText(s,W/2,BY); c.fillStyle='#fff'; c.fillText(s,W/2,BY); }
    /* 左上：回合、計時 */ c.fillStyle='rgba(11,10,28,.75)'; rr(c,10,10,176,30,10); c.fill(); c.fillStyle='#fff'; c.font='900 13px '+TC; c.textAlign='left'; c.fillText('密碼 1～'+MAX+'　已猜 '+G.hist.length+' 次',20,25);
    if(mySec&&G.setter===me){ c.fillStyle='rgba(11,10,28,.75)'; rr(c,10,46,176,28,10); c.fill(); c.fillStyle='#7aff7a'; c.fillText('🔑 你出的密碼：'+mySec,20,60); }
    if(G.ph==='set'){ const s=G.setter===me?(mySec?'密碼設好了！':'偷偷輸入一個密碼，別人看不到！'):names[G.setter]+' 正在出密碼…',yy=BY-BR-14>30?BY-BR-14:40; c.textAlign='center'; c.font='900 24px '+TC; c.lineWidth=6; c.strokeStyle='#14122b'; c.strokeText(s,W/2,yy); c.fillStyle='#ffd23f'; c.fillText(s,W/2,yy); c.font='700 13px '+TC; c.textAlign='right'; c.fillStyle='#fff'; c.fillText('剩 '+Math.ceil(Math.max(0,G.turnT))+' 秒',W-20,25); }
    if(G.ph==='turn'&&!(G.wait>0)){ const nm=names[G.cur],s=mine(G.cur)?(two?(G.cur+1)+'P 輪到你了！':'輪到你了！'):'輪到 '+nm; c.fillStyle='rgba(11,10,28,.75)'; rr(c,W-196,10,186,30,10); c.fill(); c.fillStyle=mine(G.cur)?'#ffd23f':'#fff'; c.textAlign='left'; c.fillText(s,W-186,25); if(TL>0){ const u=clamp(G.turnT/TL,0,1); c.fillStyle=u<.3&&Math.sin(t*16)>0?'#ff5d4f':'#ffd23f'; c.beginPath(); c.moveTo(W-28,25); c.arc(W-28,25,10,-Math.PI/2,-Math.PI/2+u*TAU); c.fill(); } }
    /* 鍵盤 */ if(myTurn()){ c.fillStyle='rgba(11,10,28,.82)'; rr(c,18,H-110,W-36,104,16); c.fill();
      c.fillStyle=G.bad>0?'#ff5d4f':'#fff'; c.font='900 14px '+TC; c.textAlign='left'; const [klo,khi]=rng(); c.fillText(G.bad>0?'要在 '+klo+' ～ '+khi+' 裡面喔！':mySet()?'出一個 1 ～ '+MAX+' 的密碼':G.dlo===klo&&G.dhi===khi?'猜一個 '+klo+' ～ '+khi+' 的數字':'猜 '+G.dlo+' 和 '+G.dhi+' 中間的數字（'+(klo===khi?'只剩 '+klo:klo+' ～ '+khi)+'）',36,H-90);
      c.fillStyle='#0c1a0c'; rr(c,W/2-70,H-104,140,42,10); c.fill(); c.fillStyle='#7aff7a'; c.font='900 28px "Courier New",monospace'; c.textAlign='center'; c.fillText(buf||(Math.sin(t*6)>0?'_':''),W/2,H-82);
      c.fillStyle='rgba(255,255,255,.55)'; c.font='700 12px '+TC; c.textAlign='right'; c.fillText(env.touch?'點數字、按確定':'數字鍵輸入、Enter 確定',W-36,H-90);
      for(let k=0;k<12;k++){ const [x,y,w,h]=kRect(k),on=pressK===k&&pressT>0; c.fillStyle=k===11?'#ff5a9a':k===10?'#8a8aa8':'#f4f4f8'; rr(c,x,y+(on?2:0),w,h,10); c.fill(); c.fillStyle='rgba(0,0,0,.25)'; if(!on) { rr(c,x,y+h-4,w,4,2); c.fill(); } c.fillStyle='#14122b'; c.font='900 '+(k===11?16:20)+'px '+TC; c.textAlign='center'; c.fillText(KEYS[k],x+w/2,y+h/2+(on?3:1)); } } }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',pd); },_dbg:{get G(){return G;},get secret(){return secret;},guess,setSecret}};
}
function stageShow(ctx,w,h,si,t){ ctx.save(); ctx.scale(w/W,h/H); bg(ctx,si,t); const lo=10+Math.floor(t)%20,hi=90-Math.floor(t*1.3)%30; ctx.fillStyle='#8a5a34'; ctx.fillRect(260,240,280,22); bombArt(ctx,400,160,92,t,.4+.3*Math.sin(t),lo,hi,0,0);
  const C=window.ARCADE_CHAR; if(C) for(let i=0;i<5;i++){ const u=i/4,x=90+u*620,y=420-Math.sin(u*Math.PI)*50,L=BOTLOOK(i); C.drawChar(ctx,x,y-30,PCOL[i],1,i===Math.floor(t)%5,t+i,1.4,L.char,L.deco); } ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).boomcode={
  name:'密碼炸彈大挑戰',tag:'CODE BOMB',color:'#7aff7a',online:true,maxPlayers:8,minPlayers:2,bots:true,
  coin:o=>({verb:'先猜',names:o.net?[o.net.names[0]||'玩家 1',o.net.names[1]||'玩家 2']:o.mode==='2p'?['1P','2P']:[o.name||'你','電腦']}),
  desc:'炸彈裡藏了一個密碼數字，大家輪流猜，每猜一次範圍就縮小，猜中密碼的人就被炸！玩到有人被炸為止。連線時可以讓大家輪流出密碼。',
  goal:'輪到你時猜一個範圍內的數字，猜中密碼就被炸，別當那個人！',
  stages:SCN.map(s=>s.name),stageLabel:'選擇場景',stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,0,t),
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人同一台'}],
  options:[{key:'max',label:'密碼範圍',def:'100',opts:[{id:'50',label:'1～50（簡單）'},{id:'100',label:'1～100'},{id:'500',label:'1～500（困難）'}]},
    {key:'setter',label:'連線時誰出密碼',def:'turn',opts:[{id:'turn',label:'玩家輪流出'},{id:'cpu',label:'電腦出'}]},
    {key:'time',label:'每次思考時間',def:'12',opts:[{id:'8',label:'8 秒'},{id:'12',label:'12 秒'},{id:'20',label:'20 秒'},{id:'0',label:'不限'}]},
    {key:'seats',label:'單機人數',def:'5',opts:[{id:'3',label:'3 人'},{id:'4',label:'4 人'},{id:'5',label:'5 人'},{id:'6',label:'6 人'},{id:'8',label:'8 人'}]}],
  help:[['數字鍵','輸入數字，Enter 確定'],['↑↓ ←→','加減 1、加減 10'],['雙人','輪到誰就誰按']],
  touchHelp:[['數字鍵盤','點數字，再點「確定」']],touch:null,
  looks:[{key:'char',label:'人物',opts:[{id:'cap',label:'帽子'},{id:'cat',label:'貓耳'},{id:'bunny',label:'兔耳'},{id:'crown',label:'皇冠'},{id:'chef',label:'廚師'},{id:'pirate',label:'海盜'},{id:'ninja',label:'忍者'},{id:'bow',label:'蝴蝶結'}]},{key:'color',label:'人物顏色',type:'color',opts:['auto','#ff5d4f','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d','#3ddbd9','#ff7eb6']}],
  preview:(ctx,w,h,L,t)=>{ ctx.save(); ctx.scale(w/W,h/H); bg(ctx,0,t); ctx.restore(); const C=window.ARCADE_CHAR; if(C) C.drawChar(ctx,w/2,h*.6,!L||!L.color||L.color==='auto'?PCOL[0]:L.color,1,false,t,2.6,(L&&L.char)||'cap',(L&&L.deco)||''); },
  hubBest:()=>{ let v=0; try{ v=+localStorage.getItem('arcade.boomcode.safe')||0; }catch(e){} return v?'平安沒被炸 <b>'+v+'</b> 局':'尚無紀錄'; },
  create};
})();
