// 搶椅子大作戰：音樂播放時大家繞著椅子走，音樂一停就搶位子坐，沒搶到的淘汰，每輪少一張椅子，最後坐上椅子的人贏。
// 操作：方向鍵走路（音樂中只能往前繞圈，可以內外換道、走快），碰到空椅子自動坐下；推人鍵把旁邊的人推開。
// 地上有香蕉皮（踩到會滑倒）和加速鞋。連線時房主運算，其他人只送按鍵。人物用水球炸翻天的 Q 版畫法（bomb.js 要先載入）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,CX=400,CY=268,YS=.62;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,hyp=Math.hypot;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function mul(seed){ let a=seed>>>0||1; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const PCOL=['#ff5d4f','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d','#3ddbd9','#ff7eb6'];
const BOTN=['小胖','阿呆','跳跳','咪咪','大寶','豆豆','阿福','小美','球球','皮皮'];
const BOTLOOK=i=>({char:['cat','bunny','chef','pirate','ninja','crown','bow','cap'][i%8],color:'auto',deco:['','shades','scarf','cape','blush','tie'][i%6]});
const AIK={easy:{rt:.62,rv:.35,smart:.45,push:.25},normal:{rt:.38,rv:.25,smart:.75,push:.55},hard:{rt:.2,rv:.15,smart:1,push:.9}};
/* 場景：地板、四周擺設、椅子樣式、音樂 */
const SCN=[
 {n:'教室',chair:'school',bpm:132,wave:'square',root:60,sc:[0,2,4,7,9]},
 {n:'客廳',chair:'arm',bpm:118,wave:'triangle',root:62,sc:[0,2,4,5,7,9,11]},
 {n:'生日派對',chair:'party',bpm:140,wave:'square',root:65,sc:[0,2,4,7,9]},
 {n:'海灘',chair:'beach',bpm:112,wave:'triangle',root:57,sc:[0,3,5,7,10]},
 {n:'遊樂園',chair:'stool',bpm:150,wave:'sawtooth',root:64,sc:[0,2,4,5,7,9]},
];
const ringR=m=>56+m*12,laneIn=m=>ringR(m)+46,laneOut=m=>ringR(m)+112,fieldR=m=>Math.min(250,ringR(m)+150);
const toS=(x,y)=>[CX+x,CY+y*YS];
/* ---------- 場景背景（快取） ---------- */
const BGC={};
function bgOf(k){ if(BGC[k]) return BGC[k]; const e=document.createElement('canvas'); e.width=W; e.height=H; const c=e.getContext('2d'),r=mul(k*71+3);
  if(k===0){ c.fillStyle='#c89a62'; c.fillRect(0,0,W,H); for(let y=0;y<H;y+=22){ c.fillStyle=(y/22)%2?'rgba(0,0,0,.05)':'rgba(255,255,255,.04)'; c.fillRect(0,y,W,22); c.strokeStyle='rgba(80,40,10,.25)'; c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); for(let x=((y/22)%3)*80;x<W;x+=240){ c.beginPath(); c.moveTo(x,y); c.lineTo(x,y+22); c.stroke(); } }
    c.fillStyle='#e8dcc0'; c.fillRect(0,0,W,70); c.fillStyle='#1e4a32'; rr(c,220,8,360,54,4); c.fill(); c.strokeStyle='#8a5a2a'; c.lineWidth=6; c.stroke(); c.fillStyle='rgba(255,255,255,.85)'; c.font='700 20px '+TC; c.textAlign='center'; c.fillText('今天：搶椅子比賽 ♪',400,42); c.fillStyle='#f4f4f4'; c.fillRect(470,52,20,4);
    c.fillStyle='#3a6ab8'; rr(c,60,14,90,46,4); c.fill(); c.fillStyle='#a8d8ff'; c.fillRect(66,20,78,34); c.fillStyle='#3a6ab8'; c.fillRect(104,20,2,34); rr(c,650,14,90,46,4); c.fillStyle='#3a6ab8'; c.fill(); c.fillStyle='#a8d8ff'; c.fillRect(656,20,78,34); c.fillStyle='#3a6ab8'; c.fillRect(694,20,2,34);
    for(const [x,y] of [[40,140],[40,300],[760,140],[760,300],[60,440],[740,440]]) desk(c,x,y); }
  else if(k===1){ c.fillStyle='#e8d0b0'; c.fillRect(0,0,W,H); for(let x=0;x<W;x+=60){ c.fillStyle=(x/60)%2?'rgba(0,0,0,.04)':'rgba(255,255,255,.05)'; c.fillRect(x,0,60,H); } c.fillStyle='#f4e8d8'; c.fillRect(0,0,W,64); c.fillStyle='#c8a880'; c.fillRect(0,60,W,6);
    c.fillStyle='#b84a3a'; c.beginPath(); c.ellipse(CX,CY+6,300,170,0,0,TAU); c.fill(); c.strokeStyle='#ffd8a0'; c.lineWidth=6; c.stroke(); c.strokeStyle='rgba(255,216,160,.5)'; c.lineWidth=2; c.beginPath(); c.ellipse(CX,CY+6,270,150,0,0,TAU); c.stroke();
    c.fillStyle='#2a2a30'; rr(c,330,6,140,50,4); c.fill(); c.fillStyle='#3a5a8a'; rr(c,336,11,128,40,2); c.fill(); c.fillStyle='#6a4a2a'; c.fillRect(310,52,180,10);
    sofa(c,60,250,'#4a6aa8'); sofa(c,740,250,'#4a6aa8'); plant(c,40,90); plant(c,760,90); plant(c,50,460); plant(c,750,460); }
  else if(k===2){ c.fillStyle='#ffe0ec'; c.fillRect(0,0,W,H); for(let y=0;y<H;y+=40) for(let x=(y/40)%2*40;x<W;x+=80){ c.fillStyle='rgba(255,140,190,.18)'; c.fillRect(x,y,40,40); }
    c.strokeStyle='#ff8ab8'; c.lineWidth=2; c.beginPath(); c.moveTo(0,16); c.quadraticCurveTo(400,70,800,16); c.stroke(); const cols=['#ff5d6d','#ffd23f','#4f9dff','#5fd068','#c56bff']; for(let i=0;i<20;i++){ const x=i*42+20,y=16+Math.sin(i/19*Math.PI)*27; c.fillStyle=cols[i%5]; c.beginPath(); c.moveTo(x-10,y); c.lineTo(x+10,y); c.lineTo(x,y+18); c.fill(); }
    c.fillStyle='#fff'; c.font='900 22px '+TC; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='#ff5a9a'; c.strokeText('HAPPY BIRTHDAY！',400,78); c.fillText('HAPPY BIRTHDAY！',400,78);
    for(const [x,y,cl] of [[40,120,'#ff5d6d'],[70,100,'#4f9dff'],[730,110,'#ffd23f'],[760,130,'#c56bff'],[40,380,'#5fd068'],[760,390,'#ff9d3d']]) balloon(c,x,y,cl);
    c.fillStyle='#fff'; rr(c,650,420,120,60,8); c.fill(); c.strokeStyle='#e8a0c0'; c.lineWidth=3; c.stroke(); cake(c,710,440); }
  else if(k===3){ const g=c.createLinearGradient(0,0,0,90); g.addColorStop(0,'#3ab0e0'); g.addColorStop(1,'#7ad8f0'); c.fillStyle=g; c.fillRect(0,0,W,90); c.fillStyle='#f0dca8'; c.fillRect(0,80,W,H); c.fillStyle='rgba(255,255,255,.7)'; c.beginPath(); c.moveTo(0,84); for(let x=0;x<=W;x+=20) c.lineTo(x,84+Math.sin(x*.05)*4); c.lineTo(W,96); c.lineTo(0,96); c.fill();
    for(let i=0;i<300;i++){ c.fillStyle=i%2?'rgba(180,140,80,.25)':'rgba(255,255,255,.3)'; c.fillRect(r()*W,90+r()*H,2,2); } for(const [x,y,cl] of [[60,180,'#ff5d6d'],[740,190,'#4f9dff'],[70,420,'#ffd23f'],[730,430,'#5fd068']]) umbrella(c,x,y,cl); shell(c,180,460); shell(c,620,120); shell(c,330,470); starfish(c,520,470); starfish(c,140,110); }
  else { c.fillStyle='#8a8a9a'; c.fillRect(0,0,W,H); for(let y=0;y<H;y+=30) for(let x=(y/30)%2*30;x<W;x+=60){ c.fillStyle='rgba(255,255,255,.06)'; c.fillRect(x,y,30,30); } c.fillStyle='#2a1a4a'; c.fillRect(0,0,W,96);
    c.strokeStyle='#ffd23f'; c.lineWidth=3; c.beginPath(); c.arc(140,96,80,Math.PI,0); c.stroke(); for(let i=0;i<10;i++){ const a=Math.PI+i/9*Math.PI; c.beginPath(); c.moveTo(140,96); c.lineTo(140+Math.cos(a)*80,96+Math.sin(a)*80); c.stroke(); c.fillStyle=['#ff5d6d','#4f9dff','#5fd068'][i%3]; c.fillRect(140+Math.cos(a)*80-6,96+Math.sin(a)*80-4,12,10); }
    c.fillStyle='#ff5d6d'; c.beginPath(); c.moveTo(560,96); c.lineTo(640,40); c.lineTo(720,96); c.fill(); c.fillStyle='#fff'; for(let i=0;i<5;i++){ c.beginPath(); c.moveTo(560+i*32,96); c.lineTo(640,40); c.lineTo(576+i*32,96); c.fill(); } for(let i=0;i<30;i++){ c.fillStyle=['#ffd23f','#ff7eb6','#7affea'][i%3]; c.beginPath(); c.arc(i*28+10,92,3,0,TAU); c.fill(); }
    for(const [x,y] of [[50,200],[750,200],[50,420],[750,420]]){ c.fillStyle='#5a3a1a'; c.fillRect(x-3,y-60,6,60); c.fillStyle='#ffe08a'; c.beginPath(); c.arc(x,y-62,9,0,TAU); c.fill(); } popcorn(c,690,470); popcorn(c,110,470); }
  /* 中間的圓形場地 */ c.save(); c.translate(CX,CY); c.scale(1,YS); c.fillStyle='rgba(255,255,255,.12)'; c.beginPath(); c.arc(0,0,250,0,TAU); c.fill(); c.setLineDash([10,10]); c.strokeStyle='rgba(255,255,255,.55)'; c.lineWidth=3; c.beginPath(); c.arc(0,0,250,0,TAU); c.stroke(); c.setLineDash([]); c.restore();
  return BGC[k]=e; }
function desk(c,x,y){ c.fillStyle='rgba(0,0,0,.18)'; c.fillRect(x-28,y+18,56,8); c.fillStyle='#d8a86a'; rr(c,x-28,y-14,56,34,4); c.fill(); c.strokeStyle='#8a5a2a'; c.lineWidth=2; c.stroke(); c.fillStyle='#fff'; c.fillRect(x-14,y-6,18,12); c.fillStyle='#ff5d6d'; c.fillRect(x+8,y-4,10,3); }
function sofa(c,x,y,cl){ c.fillStyle='rgba(0,0,0,.18)'; c.fillRect(x-30,y-60,64,130); c.fillStyle=cl; rr(c,x-30,y-64,60,128,14); c.fill(); c.strokeStyle='#23345a'; c.lineWidth=2.5; c.stroke(); c.fillStyle='rgba(255,255,255,.15)'; rr(c,x-18,y-54,36,52,10); c.fill(); rr(c,x-18,y+2,36,52,10); c.fill(); }
function plant(c,x,y){ c.fillStyle='#c87a4a'; c.beginPath(); c.moveTo(x-14,y); c.lineTo(x+14,y); c.lineTo(x+10,y+20); c.lineTo(x-10,y+20); c.fill(); for(let i=0;i<7;i++){ c.fillStyle=i%2?'#3a9a4a':'#4ab85a'; c.beginPath(); c.ellipse(x+Math.cos(i)*10,y-10-i*3,9,5,i,0,TAU); c.fill(); } }
function balloon(c,x,y,cl){ c.strokeStyle='rgba(0,0,0,.4)'; c.lineWidth=1; c.beginPath(); c.moveTo(x,y+20); c.quadraticCurveTo(x+6,y+40,x,y+60); c.stroke(); const g=c.createRadialGradient(x-5,y-6,2,x,y,20); g.addColorStop(0,'#fff'); g.addColorStop(.3,cl); g.addColorStop(1,cl); c.fillStyle=g; c.beginPath(); c.ellipse(x,y,16,20,0,0,TAU); c.fill(); }
function cake(c,x,y){ c.fillStyle='#ffd8e8'; rr(c,x-30,y,60,26,4); c.fill(); c.fillStyle='#fff6f0'; rr(c,x-22,y-16,44,18,4); c.fill(); c.fillStyle='#ff5d8d'; for(let i=0;i<5;i++){ c.beginPath(); c.arc(x-24+i*12,y,4,0,Math.PI); c.fill(); } for(let i=0;i<3;i++){ c.fillStyle='#4f9dff'; c.fillRect(x-12+i*12,y-28,4,12); c.fillStyle='#ffd23f'; c.beginPath(); c.ellipse(x-10+i*12,y-32,3,5,0,0,TAU); c.fill(); } }
function umbrella(c,x,y,cl){ c.fillStyle='rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(x+14,y+40,46,14,0,0,TAU); c.fill(); c.strokeStyle='#8a6a4a'; c.lineWidth=3; c.beginPath(); c.moveTo(x,y); c.lineTo(x,y+44); c.stroke(); for(let i=0;i<8;i++){ c.fillStyle=i%2?'#fff':cl; c.beginPath(); c.moveTo(x,y-8); c.arc(x,y-8,42,Math.PI+i/8*Math.PI,Math.PI+(i+1)/8*Math.PI); c.fill(); } }
function shell(c,x,y){ c.fillStyle='#ffc8b0'; c.beginPath(); c.arc(x,y,9,Math.PI,0); c.fill(); c.strokeStyle='#d88a70'; c.lineWidth=1; for(let i=0;i<5;i++){ c.beginPath(); c.moveTo(x,y); c.lineTo(x-9+i*4.5,y-7); c.stroke(); } }
function starfish(c,x,y){ c.fillStyle='#ff8a4a'; c.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i/10*TAU,r=i%2?5:13; c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r); } c.fill(); }
function popcorn(c,x,y){ c.fillStyle='#fff'; for(let i=0;i<6;i++){ c.beginPath(); c.arc(x-10+i*4,y-22-(i%2)*4,6,0,TAU); c.fill(); } c.fillStyle='#ff3a3a'; c.beginPath(); c.moveTo(x-14,y-20); c.lineTo(x+14,y-20); c.lineTo(x+10,y+6); c.lineTo(x-10,y+6); c.fill(); c.fillStyle='#fff'; c.fillRect(x-6,y-20,4,26); c.fillRect(x+3,y-20,4,26); }
/* 椅子：面向外（坐的人看著外面）。back=true 只畫椅背（畫在人前面時用） */
function chairArt(c,sx,sy,a,kind,part){ const fx=Math.cos(a),fy=Math.sin(a),side=Math.abs(fx)>Math.abs(fy)*1.2,face=side?(fx>0?3:2):(fy>0?1:0);
  const col={school:['#d89a5a','#8a5a2a','#4a6aa8'],arm:['#c84a4a','#7a2020','#5a3a2a'],party:['#ffd23f','#c89a10','#ff5a9a'],beach:['#4fb8ff','#2a6aa8','#f4f4f4'],stool:['#ff5d6d','#a82a3a','#c8c8d0']}[kind];
  c.save(); c.translate(sx,sy); c.scale(1.4,1.4);
  const legs=()=>{ c.strokeStyle=col[2]; c.lineWidth=3; for(const [x,y] of [[-12,4],[12,4],[-10,12],[10,12]]){ c.beginPath(); c.moveTo(x,y-6); c.lineTo(x,y+6); c.stroke(); } };
  const seat=()=>{ c.fillStyle=col[0]; rr(c,-16,-10,32,20,5); c.fill(); c.strokeStyle=col[1]; c.lineWidth=2.4; c.stroke(); c.fillStyle='rgba(255,255,255,.25)'; rr(c,-12,-8,24,6,3); c.fill(); };
  const back=()=>{ c.fillStyle=col[0]; c.strokeStyle=col[1]; c.lineWidth=2.4; if(face===1){ rr(c,-17,-36,34,20,5); c.fill(); c.stroke(); c.fillStyle=col[1]; c.fillRect(-14,-18,4,10); c.fillRect(10,-18,4,10); } else if(face===0){ rr(c,-17,-2,34,22,5); c.fill(); c.stroke(); } else { const s=face===3?-1:1; rr(c,s*14-4,-30,8,34,3); c.fill(); c.stroke(); }
    if(kind==='party'){ c.fillStyle='#ff5a9a'; c.beginPath(); c.arc(face===0?0:face===1?0:(face===3?-14:14),face===0?-2:-36,5,0,TAU); c.fill(); }
    if(kind==='arm'){ c.fillStyle=col[1]; c.fillRect(-19,-12,5,18); c.fillRect(14,-12,5,18); } };
  if(part!=='back'){ c.fillStyle='rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(0,12,20,6,0,0,TAU); c.fill(); legs(); seat(); if(face!==0) back(); }
  else if(face===0) back();
  c.restore(); return face; }
function bananaArt(c,x,y,t){ c.save(); c.translate(x,y); c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0,5,12,4,0,0,TAU); c.fill(); c.fillStyle='#ffd23f'; c.strokeStyle='#8a6a00'; c.lineWidth=1.6; for(const a of [-.9,0,.9]){ c.save(); c.rotate(a); c.beginPath(); c.ellipse(0,-6,4,9,0,0,TAU); c.fill(); c.stroke(); c.restore(); } c.fillStyle='#6a4a10'; c.fillRect(-2,-2,4,4); c.restore(); }
function shoeArt(c,x,y,t){ c.save(); c.translate(x,y-Math.abs(Math.sin(t*4))*4); c.fillStyle='rgba(255,255,140,.35)'; c.beginPath(); c.arc(0,-2,16,0,TAU); c.fill(); c.fillStyle='#ff5d4f'; c.strokeStyle='#5a1a14'; c.lineWidth=2; c.beginPath(); c.moveTo(-10,2); c.lineTo(-8,-10); c.lineTo(0,-10); c.quadraticCurveTo(4,-2,12,0); c.lineTo(12,4); c.lineTo(-10,4); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#fff'; c.fillRect(-10,2,22,3); c.fillStyle='#fff'; c.beginPath(); c.moveTo(-12,-6); c.lineTo(-20,-10); c.lineTo(-18,-4); c.fill(); c.restore(); }
function boombox(c,x,y,t,on){ c.save(); c.translate(x,y); const b=on?Math.abs(Math.sin(t*8))*2:0; c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0,18,36,8,0,0,TAU); c.fill(); c.fillStyle='#2a2a3a'; rr(c,-34,-22-b,68,40,8); c.fill(); c.strokeStyle='#0e0e18'; c.lineWidth=2.5; c.stroke(); c.strokeStyle='#8a8aa0'; c.lineWidth=3; c.beginPath(); c.moveTo(-22,-22-b); c.lineTo(-18,-34-b); c.lineTo(18,-34-b); c.lineTo(22,-22-b); c.stroke();
  for(const k of [-1,1]){ c.fillStyle='#1a1a24'; c.beginPath(); c.arc(k*18,-2-b,12+(on?Math.abs(Math.sin(t*8+k))*1.5:0),0,TAU); c.fill(); c.fillStyle='#5a5a70'; c.beginPath(); c.arc(k*18,-2-b,5,0,TAU); c.fill(); }
  c.fillStyle=on?'#7affa0':'#ff5d6d'; c.fillRect(-5,-16-b,10,6); c.restore(); }

function create(env,opts){
  const {ctx:c}=env.canvas2d(W,H),net=opts.net,client=!!net&&!net.host,host=!client,two=!net&&opts.mode==='2p',pv=!!opts.preview,OP=opts.options||{},sc=clamp(opts.stage|0,0,SCN.length-1),SC=SCN[sc];
  const humans=net?net.count:pv?0:two?2:1,n=net?clamp(net.count+(net.bots||0),2,8):clamp(+OP.seats||6,3,8),me=net?net.me:0,AK=AIK[OP.ai||'normal']||AIK.normal;
  const names=[],looks=[]; for(let i=0;i<n;i++){ if(i<humans){ names.push(net?(net.names&&net.names[i])||'玩家'+(i+1):two?(i+1)+'P':(opts.name||'你')); looks.push(net?(net.looks&&net.looks[i])||{}:i===0?opts.look||{}:{}); } else { names.push(BOTN[(i-humans+sc*3)%BOTN.length]); looks.push(BOTLOOK(i+sc)); } }
  const colOf=i=>{ const L=looks[i]; return !L||!L.color||L.color==='auto'?PCOL[i%8]:L.color; };
  let t=0,ended=false,sendT=0,evq=[],shake=0,fx=[],texts=[],lastBeat=-1,seqT=0,step=0,musicOn=false,stopFx=0,prevPh='';
  const mk=()=>({x:0,y:0,vx:0,vy:0,dir:1,seat:-1,out:false,stun:0,slip:0,shoe:0,pcd:0,pa:0,mv:0,rt:0,tgt:-1});
  /* G 是整局狀態（房主算，送給其他人） */
  let G={ph:'intro',PT:pv?.5:3.2,round:1,ps:[],ch:[],it:[],rank:[],lose:-1,mt:8,win:-1};
  for(let i=0;i<n;i++) G.ps.push(mk());
  const alive=()=>G.ps.map((p,i)=>i).filter(i=>!G.ps[i].out);
  const rnd=Math.random;
  function setupRound(){ const al=alive(),m=al.length-1,R=ringR(m),off=rnd()*TAU; G.ch=[]; for(let k=0;k<m;k++){ const a=off+k/m*TAU; G.ch.push({x:Math.cos(a)*R,y:Math.sin(a)*R,a,by:-1}); }
    al.forEach((i,k)=>{ const p=G.ps[i],a=off+(k+.5)/al.length*TAU,rl=(laneIn(m)+laneOut(m))/2; p.tx=Math.cos(a)*rl; p.ty=Math.sin(a)*rl; p.seat=-1; p.stun=0; p.slip=0; p.vx=p.vy=0; p.tgt=-1; });
    G.it=[]; G.mt=Math.max(4.5,9.5-G.round*.45)+rnd()*5; }
  setupRound(); G.ps.forEach(p=>{ p.x=p.tx; p.y=p.ty; });
  const sfx=k=>{ if(pv) return; env.sfx(k); if(net&&host) evq.push(k); };
  /* ---------- 自己演奏的音樂（音樂停就真的停） ---------- */
  const mr=mul(sc*131+7),MEL=[]; for(let i=0;i<32;i++) MEL.push(mr()<.18?-1:Math.floor(mr()*SC.sc.length)+(mr()<.3?SC.sc.length:0)); const BAS=[0,0,4,4,3,3,4,4];
  function note(f,d,type,v,at){ const A=env.audio&&env.audio(); if(!A||pv) return; try{ const o=A.createOscillator(),g=A.createGain(); o.type=type; o.frequency.value=f; g.gain.setValueAtTime(v,at); g.gain.exponentialRampToValueAtTime(.001,at+d); o.connect(g); g.connect((env.out&&env.out())||A.destination); o.start(at); o.stop(at+d+.03); }catch(e){} }
  const hz=m=>440*Math.pow(2,(m-69)/12),deg=k=>SC.root+12+Math.floor(k/SC.sc.length)*12+SC.sc[k%SC.sc.length];
  function music(dt){ const A=env.audio&&env.audio(); if(!A||pv){ return; } const want=G.ph==='music'; if(want&&!musicOn){ musicOn=true; seqT=A.currentTime+.05; } if(!want){ musicOn=false; return; }
    const sp=60/SC.bpm/2; while(seqT<A.currentTime+.12){ const k=step%32,m=MEL[k]; if(m>=0) note(hz(deg(m)),sp*1.6,SC.wave,.05,seqT); if(k%4===0){ const b=BAS[(k/4|0)%8]; note(hz(SC.root-12+SC.sc[b%SC.sc.length]),sp*3,'triangle',.09,seqT); } if(k%2===0) note(k%8===4?180:90,.06,'square',.025,seqT); step++; seqT+=sp; } }
  function scratch(){ const A=env.audio&&env.audio(); if(!A||pv) return; note(600,.35,'sawtooth',.08,A.currentTime); try{ const o=A.createOscillator(),g=A.createGain(),n0=A.currentTime; o.type='sawtooth'; o.frequency.setValueAtTime(900,n0); o.frequency.exponentialRampToValueAtTime(60,n0+.4); g.gain.setValueAtTime(.08,n0); g.gain.exponentialRampToValueAtTime(.001,n0+.45); o.connect(g); g.connect((env.out&&env.out())||A.destination); o.start(n0); o.stop(n0+.5); }catch(e){} }
  /* ---------- 輸入 ---------- */
  const inp=[]; for(let i=0;i<n;i++) inp.push({dx:0,dy:0,push:false});
  function readLocal(){ const K=env.keys,ax=(a,b)=>(K[b]?1:0)-(K[a]?1:0);
    if(two){ inp[0].dx=ax('KeyA','KeyD'); inp[0].dy=ax('KeyW','KeyS'); if(env.hit('KeyF')) inp[0].push=true; inp[1].dx=ax('ArrowLeft','ArrowRight'); inp[1].dy=ax('ArrowUp','ArrowDown'); if(env.hit('Enter')||env.hit('ShiftRight')) inp[1].push=true; }
    else if(!pv){ const I={dx:ax('ArrowLeft','ArrowRight')||ax('KeyA','KeyD'),dy:ax('ArrowUp','ArrowDown')||ax('KeyW','KeyS'),push:env.hit('KeyJ')||env.hit('Space')||env.hit('KeyF')}; if(client){ return I; } inp[me].dx=I.dx; inp[me].dy=I.dy; if(I.push) inp[me].push=true; }
    return null; }
  if(net){ if(client) net.onmsg=m=>{ if(m.G){ const old=G; G=m.G; G.ps.forEach((p,i)=>{ const o=old.ps[i]; if(o&&o.sx!=null){ p.sx=o.sx; p.sy=o.sy; } }); } if(m.ev) for(const k of m.ev) env.sfx(k); if(m.end&&!ended){ ended=true; finish(); } };
    else { net.onmsg=(m,from)=>{ if(m.i&&inp[from]){ inp[from].dx=m.i[0]; inp[from].dy=m.i[1]; if(m.i[2]) inp[from].push=true; } }; net.onleave=i=>{ if(G.ps[i]&&!G.ps[i].out){ G.ps[i].bot=true; } }; } }
  const isBot=i=>i>=humans||(G.ps[i]&&G.ps[i].bot);
  /* ---------- 電腦 ---------- */
  function botInput(i,dt){ const p=G.ps[i],I=inp[i],m=G.ch.length; I.dx=I.dy=0; if(p.out||p.seat>=0) return;
    if(G.ph==='music'||G.ph==='intro'){ const a=Math.atan2(p.y,p.x),r=hyp(p.x,p.y); let rd=laneIn(m)+(AK.smart>.9?8:14+((i*37)%30)); for(const it of G.it){ if(it.k==='banana'&&hyp(it.x-p.x,it.y-p.y)<60) rd+=(r<hyp(it.x,it.y)?-30:30); if(it.k==='shoe'&&hyp(it.x-p.x,it.y-p.y)<90){ rd=hyp(it.x,it.y); } }
      const ux=Math.cos(a),uy=Math.sin(a),tx=-uy,ty=ux,dr=clamp((rd-r)/20,-1,1); I.dx=ux*dr+tx*.35; I.dy=uy*dr+ty*.35;
      for(let j=0;j<n;j++){ if(j===i) continue; const q=G.ps[j]; if(q.out) continue; if(hyp(q.x-p.x,q.y-p.y)<34&&rnd()<AK.push*dt*.6) I.push=true; } return; }
    if(G.ph==='scramble'){ if(p.rt>0){ p.rt-=dt; const a=Math.atan2(p.y,p.x); I.dx=-Math.sin(a)*.5; I.dy=Math.cos(a)*.5; return; }
      if(p.tgt<0||!G.ch[p.tgt]||G.ch[p.tgt].by>=0){ let best=-1,bv=1e9; G.ch.forEach((ch,k)=>{ if(ch.by>=0) return; const d=hyp(ch.x-p.x,ch.y-p.y); let other=1e9; for(let j=0;j<n;j++){ const q=G.ps[j]; if(j===i||q.out||q.seat>=0) continue; other=Math.min(other,hyp(ch.x-q.x,ch.y-q.y)); } const v=d+(rnd()<AK.smart&&other<d-12?70:0)+(rnd()>AK.smart?rnd()*80:0); if(v<bv){ bv=v; best=k; } }); p.tgt=best; }
      if(p.tgt>=0){ const ch=G.ch[p.tgt],dx=ch.x-p.x,dy=ch.y-p.y,d=hyp(dx,dy)||1; I.dx=dx/d; I.dy=dy/d; for(let j=0;j<n;j++){ if(j===i) continue; const q=G.ps[j]; if(q.out||q.seat>=0) continue; if(hyp(q.x-p.x,q.y-p.y)<36&&hyp(ch.x-q.x,ch.y-q.y)<d+10&&rnd()<AK.push*dt*4) I.push=true; } } } }
  /* ---------- 模擬（房主） ---------- */
  function sim(dt){ const m=G.ch.length,inL=laneIn(m),outL=laneOut(m),FR=fieldR(m);
    for(let i=0;i<n;i++){ const p=G.ps[i],I=inp[i]; p.pa=Math.max(0,p.pa-dt); p.pcd=Math.max(0,p.pcd-dt); p.shoe=Math.max(0,p.shoe-dt); if(p.out){ I.push=false; continue; }
      if(p.seat>=0){ const ch=G.ch[p.seat]; if(ch){ p.x+=(ch.x-p.x)*Math.min(1,dt*14); p.y+=(ch.y-p.y)*Math.min(1,dt*14); } I.push=false; p.mv=0; continue; }
      if(G.ph==='judge'||G.ph==='final'){ p.mv=0; I.push=false; continue; }
      if(G.ph==='reset'||G.ph==='intro'){ p.x+=(p.tx-p.x)*Math.min(1,dt*4); p.y+=(p.ty-p.y)*Math.min(1,dt*4); p.mv=hyp(p.tx-p.x,p.ty-p.y)>3?1:0; I.push=false; continue; }
      const free=G.ph==='scramble',SP=(free?150:112)*(p.shoe>0?1.45:1); let mx=0,my=0;
      if(p.slip>0){ p.slip-=dt; mx=p.vx; my=p.vy; p.vx*=Math.exp(-1.2*dt); p.vy*=Math.exp(-1.2*dt); }
      else if(p.stun>0){ p.stun-=dt; mx=p.vx; my=p.vy; p.vx*=Math.exp(-6*dt); p.vy*=Math.exp(-6*dt); }
      else { let dx=I.dx,dy=I.dy/YS*.8; const l=hyp(dx,dy); if(l>1){ dx/=l; dy/=l; } mx=dx*SP; my=dy*SP;
        if(I.push&&p.pcd<=0){ p.pcd=.9; p.pa=.25; let best=-1,bd=48; for(let j=0;j<n;j++){ if(j===i) continue; const q=G.ps[j]; if(q.out||q.seat>=0) continue; const d=hyp(q.x-p.x,q.y-p.y); if(d<bd){ bd=d; best=j; } } if(best>=0){ const q=G.ps[best],d=bd||1; q.vx=(q.x-p.x)/d*290; q.vy=(q.y-p.y)/d*290; q.stun=.45; q.slip=0; sfx('hurt'); burst(q.x,q.y,'#fff',8); shake=4; texts.push({x:q.x,y:q.y,s:'砰！',l:.7}); } else sfx('click'); } }
      I.push=false;
      if(!free&&p.slip<=0&&p.stun<=0){ const a=Math.atan2(p.y,p.x); mx+=-Math.sin(a)*58; my+=Math.cos(a)*58; }
      const ox=p.x,oy=p.y; p.x+=mx*dt; p.y+=my*dt; p.mv=hyp(mx,my)>8?1:0;
      if(Math.abs(mx)>Math.abs(my)*1.1) p.dir=mx<0?2:3; else if(hyp(mx,my)>8) p.dir=my<0?0:1;
      let r=hyp(p.x,p.y)||1,a=Math.atan2(p.y,p.x);
      if(!free){ const a0=Math.atan2(oy,ox); let da=a-a0; if(da>Math.PI) da-=TAU; if(da<-Math.PI) da+=TAU; if(da<0) a=a0; r=clamp(r,inL,outL); p.x=Math.cos(a)*r; p.y=Math.sin(a)*r; }
      else { if(r>FR){ p.x=p.x/r*FR; p.y=p.y/r*FR; } for(const ch of G.ch){ if(ch.by<0) continue; const d=hyp(p.x-ch.x,p.y-ch.y); if(d<22&&d>0){ p.x=ch.x+(p.x-ch.x)/d*22; p.y=ch.y+(p.y-ch.y)/d*22; } }
        if(p.stun<=0&&p.slip<=0) for(let k=0;k<G.ch.length;k++){ const ch=G.ch[k]; if(ch.by<0&&hyp(p.x-ch.x,p.y-ch.y)<19){ ch.by=i; p.seat=k; p.vx=p.vy=0; sfx('land'); burst(ch.x,ch.y,'#ffd23f',10); texts.push({x:ch.x,y:ch.y-20,s:'坐到了！',l:.9,c:'#7affa0'}); break; } } }
      for(const it of G.it){ if(it.gone) continue; if(hyp(it.x-p.x,it.y-p.y)<18){ it.gone=true; if(it.k==='banana'){ p.slip=1; const l=hyp(mx,my)||1; p.vx=mx/l*170; p.vy=my/l*170; sfx('skid'); texts.push({x:p.x,y:p.y,s:'滑倒！',l:.8,c:'#ffd23f'}); } else { p.shoe=4.5; sfx('boost'); texts.push({x:p.x,y:p.y,s:'加速！',l:.8,c:'#ff9d3d'}); } } } }
    /* 互相推開 */ for(let i=0;i<n;i++) for(let j=i+1;j<n;j++){ const a=G.ps[i],b=G.ps[j]; if(a.out||b.out||a.seat>=0||b.seat>=0) continue; const dx=b.x-a.x,dy=b.y-a.y,d=hyp(dx,dy); if(d<24&&d>0){ const k=(24-d)/2; a.x-=dx/d*k; a.y-=dy/d*k; b.x+=dx/d*k; b.y+=dy/d*k; } }
    G.it=G.it.filter(it=>!it.gone);
    /* 流程 */ G.PT-=dt;
    if(G.ph==='intro'&&G.PT<=0){ G.ph='music'; G.PT=G.mt; sfx('go'); }
    else if(G.ph==='music'){ if(rnd()<dt*.42&&G.it.length<3){ const a=rnd()*TAU,r=inL+12+rnd()*(outL-inL-24); G.it.push({k:rnd()<.62?'banana':'shoe',x:Math.cos(a)*r,y:Math.sin(a)*r}); } if(G.PT<=0){ G.ph='scramble'; G.PT=8; for(let i=0;i<n;i++){ const p=G.ps[i]; p.rt=AK.rt+rnd()*AK.rv; p.tgt=-1; } sfx('beep'); shake=5; } }
    else if(G.ph==='scramble'){ const standing=alive().filter(i=>G.ps[i].seat<0); if(G.ch.every(ch=>ch.by>=0)||G.PT<=0){ let lose=standing[0]; if(standing.length>1){ /* 時間到還有好幾個人站著：離空椅最遠的淘汰 */ let far=-1; for(const i of standing){ const p=G.ps[i]; let d=1e9; for(const ch of G.ch) if(ch.by<0) d=Math.min(d,hyp(ch.x-p.x,ch.y-p.y)); if(d>far){ far=d; lose=i; } } }
        G.lose=lose; G.ph='judge'; G.PT=2; sfx('lose'); if(lose!=null){ const p=G.ps[lose]; texts.push({x:p.x,y:p.y-30,s:'淘汰！',l:1.6,c:'#ff6a7a',big:1}); burst(p.x,p.y,'#ff6a7a',16); } } }
    else if(G.ph==='judge'&&G.PT<=0){ if(G.lose!=null&&G.lose>=0){ const p=G.ps[G.lose]; p.out=true; G.rank.unshift(G.lose); const k=G.rank.length-1; p.x=-320+k*58; p.y=330; } G.lose=-1;
      const al=alive(); if(al.length<=1){ G.win=al[0]; G.rank.unshift(al[0]); G.ph='final'; G.PT=3.4; sfx('win'); for(let k=0;k<40;k++) burst((rnd()-.5)*500,(rnd()-.5)*300,PCOL[k%8],1); }
      else { G.round++; G.ph='reset'; G.PT=1.4; setupRound(); } }
    else if(G.ph==='reset'&&G.PT<=0){ G.ph='music'; G.PT=G.mt; sfx('go'); }
    else if(G.ph==='final'&&G.PT<=0&&!ended){ if(pv){ G={ph:'intro',PT:.5,round:1,ps:[],ch:[],it:[],rank:[],lose:-1,mt:8,win:-1}; for(let i=0;i<n;i++) G.ps.push(mk()); setupRound(); G.ps.forEach(p=>{ p.x=p.tx; p.y=p.ty; }); return; } ended=true; if(net) net.send({G:pack(),end:1}); finish(); } }
  function pack(){ return G; }
  function burst(x,y,col,k){ for(let i=0;i<k;i++){ const a=rnd()*TAU,v=60+rnd()*160; fx.push({x,y,z:0,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vz:120+rnd()*120,l:.8,c:col}); } }
  function finish(){ const w=G.win,meWin=two?w<2:w===me; try{ if(meWin&&!two&&!net) localStorage.setItem('arcade.chair.w.'+sc,String((+localStorage.getItem('arcade.chair.w.'+sc)||0)+1)); }catch(e){}
    const rows=G.rank.map((i,k)=>'<tr'+((two?i<2:i===me)?' style="color:#ffd23f"':'')+'><td>'+(k+1)+'</td><td>'+names[i]+'</td></tr>').join('');
    env.end({title:w!=null&&w>=0?names[w]+' 搶到最後一張椅子！':'比賽結束',big:two?(w<2?names[w]+' 獲勝':'電腦獲勝'):meWin?'你贏了！':'第 '+(G.rank.indexOf(me)+1)+' 名',html:'<table class="ls"><tr><th>名次</th><th>玩家</th></tr>'+rows+'</table>',score:null}); }
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt; if(shake>0) shake=Math.max(0,shake-dt*24);
    const li=readLocal(); if(client&&li){ sendT-=dt; const k=li.dx+','+li.dy; if(sendT<=0||li.push||k!==update.k){ update.k=k; sendT=1/20; net.send({i:[li.dx,li.dy,li.push?1:0]}); } }
    if(host){ for(let i=0;i<n;i++) if(isBot(i)) botInput(i,dt); sim(dt); if(net){ sendT-=dt; if(sendT<=0){ sendT=1/15; net.send({G:pack()}); if(evq.length){ net.send({ev:evq}); evq=[]; } } } }
    if(G.ph!==prevPh){ if(G.ph==='scramble'){ scratch(); stopFx=1; } prevPh=G.ph; } if(stopFx>0) stopFx=Math.max(0,stopFx-dt*.8);
    music(dt);
    for(const p of G.ps){ if(p.sx==null){ p.sx=p.x; p.sy=p.y; } const k=client?Math.min(1,dt*14):1; p.sx+=(p.x-p.sx)*k; p.sy+=(p.y-p.sy)*k; }
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; if(f.l<=0){ fx.splice(i,1); continue; } f.x+=f.vx*dt; f.y+=f.vy*dt; f.z+=f.vz*dt; f.vz-=500*dt; if(f.z<0){ f.z=0; f.vz*=-.4; } }
    for(let i=texts.length-1;i>=0;i--){ const q=texts[i]; q.l-=dt; q.y-=30*dt; if(q.l<=0) texts.splice(i,1); } }
  function draw(){ c.save(); if(shake>0) c.translate((rnd()-.5)*shake,(rnd()-.5)*shake); c.drawImage(bgOf(sc),0,0);
    const m=G.ch.length,on=G.ph==='music';
    /* 走道 */ c.save(); c.translate(CX,CY); c.scale(1,YS); c.fillStyle=on?'rgba(255,255,255,.14)':'rgba(255,255,255,.07)'; c.beginPath(); c.arc(0,0,laneOut(m),0,TAU); c.arc(0,0,laneIn(m),0,TAU,true); c.fill(); if(on){ c.strokeStyle='rgba(255,255,255,.5)'; c.lineWidth=2; for(let k=0;k<12;k++){ const a=k/12*TAU+t*.5,rm=(laneIn(m)+laneOut(m))/2; c.beginPath(); c.arc(0,0,rm,a,a+.12); c.stroke(); const ax=Math.cos(a+.12)*rm,ay=Math.sin(a+.12)*rm; c.beginPath(); c.moveTo(ax,ay); c.lineTo(ax-Math.cos(a)*8+Math.sin(a)*6,ay-Math.sin(a)*8-Math.cos(a)*6); c.stroke(); } } c.restore();
    boombox(c,CX,CY,t,on); if(on){ for(let k=0;k<4;k++){ const ph=(t*.8+k/4)%1; c.globalAlpha=1-ph; c.fillStyle=['#ff5a9a','#ffd23f','#7affea','#c56bff'][k]; c.font='900 '+(18+ph*8)+'px '+TC; c.textAlign='center'; c.fillText(k%2?'♪':'♫',CX+Math.sin(ph*6+k)*30+(k-1.5)*14,CY-40-ph*60); } c.globalAlpha=1; }
    /* 依深度排：椅子、人、道具 */ const L=[]; G.ch.forEach((ch,k)=>L.push({y:ch.y,f:()=>{ const [sx,sy]=toS(ch.x,ch.y); chairArt(c,sx,sy,ch.a,SC.chair); }}));
    for(const it of G.it) L.push({y:it.y-6,f:()=>{ const [sx,sy]=toS(it.x,it.y); (it.k==='banana'?bananaArt:shoeArt)(c,sx,sy,t); }});
    G.ps.forEach((p,i)=>{ if(p.out) return; L.push({y:p.sy+(p.seat>=0?2:0),f:()=>drawP(i)}); });
    L.sort((a,b)=>a.y-b.y); for(const e of L) e.f();
    /* 淘汰區 */ const outs=G.ps.map((p,i)=>i).filter(i=>G.ps[i].out); if(outs.length){ c.fillStyle='rgba(10,8,24,.55)'; rr(c,10,H-62,Math.min(W-20,outs.length*58+90),54,12); c.fill(); c.fillStyle='#ffb0b8'; c.font='900 12px '+TC; c.textAlign='left'; c.fillText('淘汰區',20,H-40); outs.forEach((i,k)=>{ const C=window.ARCADE_CHAR,L2=looks[i]||{}; if(C) C.drawChar(c,98+k*58,H-38,colOf(i),1,false,t+i,.95,L2.char||'cap',L2.deco||''); c.fillStyle='#fff'; c.font='700 10px '+TC; c.textAlign='center'; c.fillText(names[i],98+k*58,H-12); }); }
    for(const f of fx){ const [sx,sy]=toS(f.x,f.y); c.globalAlpha=Math.min(1,f.l*2); c.fillStyle=f.c; c.fillRect(sx-2.5,sy-f.z-2.5,5,5); } c.globalAlpha=1;
    for(const q of texts){ const [sx,sy]=toS(q.x,q.y); c.font='900 '+(q.big?26:16)+'px '+TC; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='#1a1028'; c.globalAlpha=Math.min(1,q.l*2); c.strokeText(q.s,sx,sy-40); c.fillStyle=q.c||'#fff'; c.fillText(q.s,sx,sy-40); c.globalAlpha=1; }
    c.restore(); hud(); }
  function drawP(i){ const p=G.ps[i],[sx,sy]=toS(p.sx,p.sy),C=window.ARCADE_CHAR,L=looks[i]||{}; let dir=p.dir,mv=p.mv>0&&G.ph!=='final';
    if(p.seat>=0&&G.ch[p.seat]){ const ch=G.ch[p.seat],fxv=Math.cos(ch.a),fyv=Math.sin(ch.a); dir=Math.abs(fxv)>Math.abs(fyv)*1.2?(fxv>0?3:2):(fyv>0?1:0); mv=false; }
    c.save(); c.fillStyle='rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(sx,sy+2,15,5,0,0,TAU); c.fill();
    const lift=p.seat>=0?-10:G.ph==='final'&&G.win===i?-Math.abs(Math.sin(t*6))*14:0; c.translate(sx,sy+lift);
    if(p.slip>0) c.rotate(Math.sin(t*20)*.5); else if(p.stun>0) c.rotate(Math.sin(t*30)*.15);
    if(C) C.drawChar(c,0,-14,colOf(i),dir,mv,t+i*.3,1.35,L.char||'cap',L.deco||''); else { c.fillStyle=colOf(i); c.beginPath(); c.arc(0,-16,14,0,TAU); c.fill(); }
    if(p.pa>0){ c.strokeStyle='rgba(255,255,255,.9)'; c.lineWidth=3; const d=[[0,-1],[0,1],[-1,0],[1,0]][p.dir]; for(let k=-1;k<=1;k++){ c.beginPath(); c.moveTo(d[0]*18+k*d[1]*6,-14+d[1]*12+k*d[0]*6); c.lineTo(d[0]*30+k*d[1]*8,-14+d[1]*22+k*d[0]*8); c.stroke(); } }
    if(p.shoe>0){ c.fillStyle='rgba(255,157,61,.8)'; for(let k=0;k<3;k++){ c.fillRect(-14-k*6,-4+k*4,8,2); } }
    if(p.stun>0||p.slip>0){ c.fillStyle='#ffd23f'; for(let k=0;k<3;k++){ const a=t*8+k/3*TAU; c.beginPath(); c.arc(Math.cos(a)*14,-44+Math.sin(a)*4,3,0,TAU); c.fill(); } }
    c.restore();
    if(p.seat>=0&&G.ch[p.seat]){ const ch=G.ch[p.seat],[cx2,cy2]=toS(ch.x,ch.y); chairArt(c,cx2,cy2,ch.a,SC.chair,'back'); }
    const mine=two?i<2:i===me&&humans>0; c.font='900 11px '+TC; c.textAlign='center'; c.lineWidth=3.5; c.strokeStyle='rgba(20,10,30,.85)'; const ny=sy+lift-58; c.strokeText(names[i],sx,ny); c.fillStyle=mine?'#ffd23f':'#fff'; c.fillText(names[i],sx,ny);
    if(mine){ const b=Math.sin(t*6)*3; c.fillStyle='#ffd23f'; c.beginPath(); c.moveTo(sx-7,ny-12+b); c.lineTo(sx+7,ny-12+b); c.lineTo(sx,ny-4+b); c.fill(); if(G.ph==='intro'&&G.round===1){ c.font='900 22px '+TC; c.lineWidth=6; const s=two?(i+1)+'P':'你'; c.strokeText(s,sx,ny-22+b); c.fillText(s,sx,ny-22+b); } } }
  function hud(){ c.save(); c.fillStyle='rgba(10,8,24,.72)'; rr(c,10,10,198,52,12); c.fill(); c.fillStyle='#ffd23f'; c.font='900 18px '+TC; c.textAlign='left'; c.textBaseline='middle'; c.fillText('第 '+G.round+' 輪',22,28); c.fillStyle='#fff'; c.font='700 12px '+TC; c.fillText('剩 '+alive().length+' 人／'+G.ch.length+' 張椅子',22,48); c.fillStyle='#cfc8ff'; c.textAlign='right'; c.fillText(SC.n,198,28);
    let s='',col='#fff'; if(G.ph==='intro') s=G.round===1?'準備…音樂要開始了！':''; else if(G.ph==='music') s='♪ 音樂播放中…繞著椅子走'; else if(G.ph==='scramble'){ s='停！快坐下！'; col='#ff5a6a'; } else if(G.ph==='judge') s=G.lose>=0?names[G.lose]+' 沒搶到椅子！':''; else if(G.ph==='reset') s='拿走一張椅子…'; else if(G.ph==='final') s=G.win>=0?'🏆 '+names[G.win]+' 獲勝！':'';
    if(s){ const big=G.ph==='scramble'||G.ph==='final'; c.font='900 '+(big?30:18)+'px '+TC; c.textAlign='center'; const w=c.measureText(s).width+40; c.fillStyle='rgba(10,8,24,.7)'; rr(c,W/2-w/2,big?84:12,w,big?48:34,14); c.fill(); c.fillStyle=col; c.fillText(s,W/2,big?108:29); }
    if(stopFx>0){ c.globalAlpha=stopFx*.35; c.fillStyle='#ff3a4a'; c.fillRect(0,0,W,H); c.globalAlpha=1; c.font='900 '+(80+(1-stopFx)*40)+'px '+TC; c.textAlign='center'; c.lineWidth=10; c.strokeStyle='#fff'; c.globalAlpha=Math.min(1,stopFx*1.6); c.strokeText('停！',W/2,H/2); c.fillStyle='#ff3a4a'; c.fillText('停！',W/2,H/2); c.globalAlpha=1; }
    if(G.ph==='intro'&&G.round===1&&!pv){ c.fillStyle='rgba(10,8,24,.75)'; rr(c,W/2-210,H-110,420,44,12); c.fill(); c.fillStyle='#fff'; c.font='900 14px '+TC; c.textAlign='center'; c.fillText(env.touch?'音樂停了就衝去坐空椅子！按「推」把人推開':'方向鍵走路，音樂停就衝去坐空椅子！J 推開別人',W/2,H-88); }
    c.restore(); }
  return {update,draw,destroy(){ musicOn=false; },_dbg:{get G(){return G;},inp,sim}};
}
function stageShow(ctx,w,h,si,t){ ctx.save(); ctx.scale(w/W,h/H); ctx.drawImage(bgOf(si),0,0); const m=5,C=window.ARCADE_CHAR; boombox(ctx,CX,CY,t,true);
  const L=[]; for(let k=0;k<m;k++){ const a=k/m*TAU+.3,R=ringR(m); L.push({y:Math.sin(a)*R,f:()=>{ const [sx,sy]=toS(Math.cos(a)*R,Math.sin(a)*R); chairArt(ctx,sx,sy,a,SCN[si].chair); }}); }
  for(let k=0;k<6;k++){ const a=k/6*TAU+t*.5,rl=(laneIn(m)+laneOut(m))/2,x=Math.cos(a)*rl,y=Math.sin(a)*rl,vx=-Math.sin(a),vy=Math.cos(a),dir=Math.abs(vx)>Math.abs(vy)?(vx<0?2:3):(vy<0?0:1); L.push({y,f:()=>{ const [sx,sy]=toS(x,y); ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(sx,sy+2,15,5,0,0,TAU); ctx.fill(); const lk=BOTLOOK(k); if(C) C.drawChar(ctx,sx,sy-14,PCOL[k],dir,true,t+k,1.35,lk.char,lk.deco); }}); }
  L.sort((a,b)=>a.y-b.y); for(const e of L) e.f();
  for(let k=0;k<3;k++){ const ph=(t*.8+k/3)%1; ctx.globalAlpha=1-ph; ctx.fillStyle=['#ff5a9a','#ffd23f','#7affea'][k]; ctx.font='900 22px '+TC; ctx.textAlign='center'; ctx.fillText('♪',CX+(k-1)*24,CY-40-ph*60); } ctx.globalAlpha=1;
  ctx.font='900 26px '+TC; ctx.textAlign='center'; ctx.lineWidth=7; ctx.strokeStyle='#1a1028'; ctx.strokeText(SCN[si].n,W/2,H-24); ctx.fillStyle='#ffd23f'; ctx.fillText(SCN[si].n,W/2,H-24); ctx.restore(); }
const wins=k=>{ try{ return +localStorage.getItem('arcade.chair.w.'+k)||0; }catch(e){ return 0; } };
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).chair={
  name:'搶椅子大作戰',tag:'MUSICAL CHAIRS',color:'#ff5a9a',online:true,maxPlayers:8,minPlayers:2,bots:true,ownMusic:true,
  desc:'音樂一響大家繞著椅子走，音樂一停就衝去搶位子！沒搶到的淘汰、每輪少一張椅子。路上有香蕉皮和加速鞋，還可以把別人推開。',
  goal:'音樂停的時候坐上空椅子就能留下來，最後搶到椅子的人贏。',
  stages:SCN.map(s=>s.n),stageLabel:'選擇場景',stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,2,t),
  stageGoal:i=>'在「'+SCN[i].n+'」搶椅子：音樂停的時候坐上空椅子就能留下來，最後搶到椅子的人贏。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  options:[{key:'seats',label:'單機人數',def:'6',opts:[{id:'4',label:'4 人'},{id:'5',label:'5 人'},{id:'6',label:'6 人'},{id:'8',label:'8 人'}]},{key:'ai',label:'電腦強度',def:'normal',opts:[{id:'easy',label:'簡單'},{id:'normal',label:'普通'},{id:'hard',label:'困難'}]}],
  help:[['方向鍵','走路（音樂播放時只能往前繞圈）'],['J 空白鍵','推開旁邊的人'],['碰到空椅子','自動坐下'],['雙人','1P：WASD＋F 推　2P：方向鍵＋Enter 推']],
  touchHelp:[['方向盤','走路，音樂停就衝去坐空椅子'],['推','推開旁邊的人']],
  touch:{left:'dpad',right:[{l:'推',c:'KeyJ',act:true}]},
  looks:[{key:'char',label:'人物',opts:[{id:'cap',label:'帽子'},{id:'cat',label:'貓耳'},{id:'bunny',label:'兔耳'},{id:'crown',label:'皇冠'},{id:'chef',label:'廚師'},{id:'pirate',label:'海盜'},{id:'ninja',label:'忍者'},{id:'bow',label:'蝴蝶結'}]},{key:'color',label:'人物顏色',type:'color',opts:['auto','#ff5d4f','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d','#3ddbd9','#ff7eb6']}],
  preview:(ctx,w,h,L,t)=>{ ctx.fillStyle='#ffe0ec'; ctx.fillRect(0,0,w,h); const C=window.ARCADE_CHAR; chairArt(ctx,w*.66,h*.72,Math.PI/2,'party'); if(C) C.drawChar(ctx,w*.4,h*.7,!L||!L.color||L.color==='auto'?PCOL[0]:L.color,1,true,t,2.6,(L&&L.char)||'cap',''); },
  hubBest:()=>{ let s=0; for(let k=0;k<SCN.length;k++) s+=wins(k); return s?'搶贏 <b>'+s+'</b> 場':'尚無紀錄'; },
  stageBest:i=>wins(i)?'🏆 '+wins(i)+' 勝':'',
  best:{label:'勝場',fmt:v=>v+' 勝',lower:false},create};
})();
