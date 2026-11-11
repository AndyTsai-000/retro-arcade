// 划龍舟大賽：跟著鼓聲按鍵划槳，打得準船就快、連擊越多鼓越快；最後照台灣龍舟賽的規矩「奪標」——抓準時機搶到終點的錦旗才算完賽。
// 10 個賽場、單人對電腦、雙人同一台、連線最多 6 艘（每人算自己的船，房主算電腦和名次）。人物用節奏引擎的 Q 版畫法（drum.js 要先載入）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,PX=9;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rng(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function shade(h,k){ const n=parseInt(h.slice(1),16),f=v=>clamp(Math.round(k>0?v+(255-v)*k:v*(1+k)),0,255); return 'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')'; }
const TEAMS=[{n:'紅龍隊',c:'#d8262a',s:'#ffd23f',h:'#2a8a3a'},{n:'金龍隊',c:'#e8a820',s:'#c8202a',h:'#c8202a'},{n:'青龍隊',c:'#1f9a7a',s:'#ffd23f',h:'#d8262a'},{n:'藍龍隊',c:'#2a5ab8',s:'#ffffff',h:'#ffd23f'},{n:'黑龍隊',c:'#2a2a34',s:'#e8a820',h:'#d8262a'},{n:'白龍隊',c:'#eeeeea',s:'#2a5ab8',h:'#d8262a'}];
const STAGES=[
 {n:'碧潭',len:240,ai:.18,boats:3,sky:['#8ad0ff','#e8f6ff'],hill:'#4a9a5a',water:'#2a8aa8',deco:'bridge'},
 {n:'冬山河',len:260,ai:.28,boats:4,sky:['#9ad8ff','#f0f8ff'],hill:'#5aa860',water:'#3a98b0',deco:'stand'},
 {n:'鹿港溪',len:280,ai:.36,boats:4,sky:['#ffd8a0','#fff4e0'],hill:'#8a7a5a',water:'#4a90a0',deco:'temple'},
 {n:'台南運河',len:290,ai:.44,boats:4,sky:['#8ac8f0','#fff0d8'],hill:'#6a8a6a',water:'#2a7a98',deco:'temple'},
 {n:'愛河夜賽',len:300,ai:.52,boats:5,sky:['#0e1238','#3a2a5a'],hill:'#1a1a3a',water:'#1a2a5a',deco:'lantern',night:1},
 {n:'基隆河',len:310,ai:.6,boats:5,sky:['#7ac0f0','#e0f0ff'],hill:'#4a8a5a',water:'#2a7aa0',deco:'city'},
 {n:'日月潭',len:320,ai:.68,boats:5,sky:['#a8d8ff','#ffffff'],hill:'#2a7a4a',water:'#1a8ab0',deco:'pagoda'},
 {n:'梅雨中的賽道',len:330,ai:.75,boats:6,sky:['#7a8a9a','#c8d0d8'],hill:'#4a6a5a',water:'#3a6a7a',deco:'stand',rain:1},
 {n:'夕陽港灣',len:340,ai:.83,boats:6,sky:['#ff8a5a','#ffd8a0'],hill:'#8a4a3a',water:'#a85a4a',deco:'city'},
 {n:'端午總決賽',len:360,ai:.92,boats:6,sky:['#5ab0f0','#e8f8ff'],hill:'#3a8a4a',water:'#1a7aa8',deco:'stand'},
];
const WIN={perfect:.07,great:.12,good:.18},JT={perfect:'完美！',great:'很好',good:'不錯',miss:'亂划！'},JC={perfect:'#ffd23f',great:'#7af0ff',good:'#86dc4f',miss:'#ff6b7d'},IMP={perfect:1.9,great:1.5,good:1.05};
const DRAG=.52,GRAB0=-3.2,GRAB1=1.2; /* 船頭在旗子前 3.2 m～後 1.2 m 內按鍵就搶到 */
const BOTN=['阿龍','大勇','小虎','阿強','鐵牛','阿福','旺財','阿海'];
/* ---------- 龍舟（側面，船頭朝右） ---------- */
function chibi(c,x,y,s,o){ const R=window.__RHY; if(R&&R.drawChibi) R.drawChibi(c,x,y,s,o); else { c.fillStyle=o.body; c.beginPath(); c.arc(x,y-20*s,10*s,0,TAU); c.fill(); } }
function boat(c,x,y,s,T,t,o){ o=o||{}; const st=o.stroke||0,crew=o.crew||'#ffffff'; c.save(); c.translate(x,y); c.scale(s,s);
  /* 倒影與船身陰影 */ c.fillStyle='rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0,12,120,9,0,0,TAU); c.fill();
  /* 船尾龍尾 */ c.save(); c.translate(-104,-6); c.fillStyle=T.c; c.strokeStyle='#1a0e08'; c.lineWidth=2.2; c.beginPath(); c.moveTo(0,8); c.quadraticCurveTo(-22,4,-26,-22); c.quadraticCurveTo(-24,-40,-10,-44); c.quadraticCurveTo(-16,-30,-8,-20); c.quadraticCurveTo(-2,-8,8,0); c.closePath(); c.fill(); c.stroke(); c.fillStyle=T.s; for(let k=0;k<4;k++){ c.beginPath(); c.moveTo(-14-k*2,-14-k*7); c.lineTo(-30-k*3,-18-k*8); c.lineTo(-18-k*2,-8-k*7); c.closePath(); c.fill(); } c.restore();
  /* 船身 */ const g=c.createLinearGradient(0,-10,0,12); g.addColorStop(0,shade(T.c,.25)); g.addColorStop(1,shade(T.c,-.35)); c.fillStyle=g; c.strokeStyle='#1a0e08'; c.lineWidth=2.4; c.beginPath(); c.moveTo(-110,-8); c.lineTo(100,-8); c.quadraticCurveTo(112,-4,104,6); c.quadraticCurveTo(0,16,-100,8); c.quadraticCurveTo(-114,2,-110,-8); c.closePath(); c.fill(); c.stroke();
  c.fillStyle=T.s; c.fillRect(-106,-8,206,3.5); c.save(); c.beginPath(); c.moveTo(-108,-4); c.lineTo(102,-4); c.quadraticCurveTo(108,0,104,6); c.quadraticCurveTo(0,15,-100,8); c.closePath(); c.clip(); c.strokeStyle=shade(T.s,-.1); c.globalAlpha=.55; c.lineWidth=1.2; for(let r=0;r<2;r++) for(let k=-108+r*5;k<104;k+=10){ c.beginPath(); c.arc(k,-1+r*6,5,0,Math.PI); c.stroke(); } c.restore();
  /* 划手：8 位兩兩一排（側面看一排），槳跟著划 */
  const ph=st; for(let k=0;k<8;k++){ const px=-74+k*19,a=ph<.5?1.25-ph*2*1.55:-.3+(ph-.5)*2*1.55; /* 前伸→往後拉 */ const lean=a*.06;
    c.save(); c.translate(px,-9); c.rotate(lean); chibi(c,0,0,.86,{t:t+k*.3,body:crew,sleeve:crew,pants:'#2b2b44',shoe:'#2b2b44',hairStyle:k%3===1?'girl':'boy',acc:'band',face:1,armL:a+.15,armR:a,legL:1.35,legR:1.25,mouth:ph>.35&&ph<.6?'open':'smile'}); c.restore();
    const hx=px+Math.sin(a)*8+2,hy=-24+Math.cos(a)*5,bx=hx+Math.sin(a*.8)*10-4,by=12; c.strokeStyle='#8a5a2a'; c.lineWidth=2.4; c.beginPath(); c.moveTo(hx,hy-6); c.lineTo(bx,by); c.stroke(); c.fillStyle='#c88a4a'; c.beginPath(); c.ellipse(bx,by+3,2.6,6,a*.6,0,TAU); c.fill(); c.strokeStyle='#5a3a1a'; c.lineWidth=1; c.stroke(); }
  /* 舵手 */ c.save(); c.translate(-96,-9); chibi(c,0,0,.9,{t,body:'#f4f4f4',sleeve:'#f4f4f4',pants:'#2b2b44',acc:'cap',capCol:T.c,face:1,armL:-.7,armR:-.5,legL:.1,legR:-.1}); c.restore(); c.strokeStyle='#6a4a2a'; c.lineWidth=3; c.beginPath(); c.moveTo(-100,-26); c.lineTo(-130,14); c.stroke(); c.fillStyle='#8a5a2a'; c.beginPath(); c.ellipse(-130,16,4,9,.6,0,TAU); c.fill();
  /* 鼓手（面向划手）＋鼓 */ const beat=o.beat||0; c.save(); c.translate(84,-9); chibi(c,-4,0,.86,{t,body:T.s,sleeve:T.s,pants:'#2b2b44',acc:'band',face:-1,armL:-1.4+beat*.9,armR:-1.0-beat*.4,legL:1.3,legR:1.2,mouth:beat>.4?'open':'smile'}); c.restore();
  c.fillStyle='#c8202a'; c.strokeStyle='#1a0e08'; c.lineWidth=1.6; rr(c,62,-30,16,20,3); c.fill(); c.stroke(); c.fillStyle='#f4e0b0'; c.beginPath(); c.ellipse(70,-30,8,3,0,0,TAU); c.fill(); c.stroke(); c.fillStyle='#ffd23f'; c.fillRect(62,-22,16,2); c.fillRect(62,-15,16,2);
  /* 龍頭 */ c.save(); c.translate(100,-8); const bob=Math.sin(t*3)*1.2; c.rotate(-.05+bob*.01);
  c.fillStyle=T.c; c.strokeStyle='#1a0e08'; c.lineWidth=2.2; c.beginPath(); c.moveTo(-6,0); c.quadraticCurveTo(4,-24,18,-36); c.lineTo(30,-30); c.quadraticCurveTo(18,-18,14,4); c.closePath(); c.fill(); c.stroke();
  c.fillStyle=T.h; for(let k=0;k<5;k++){ c.beginPath(); c.moveTo(2+k*3,-10-k*5.5); c.lineTo(-10+k*2,-16-k*6); c.lineTo(6+k*3,-15-k*5.5); c.closePath(); c.fill(); }
  c.save(); c.translate(26,-38); c.fillStyle=T.c; c.beginPath(); c.moveTo(-12,4); c.quadraticCurveTo(-10,-14,8,-14); c.quadraticCurveTo(26,-12,32,-4); c.lineTo(30,2); c.lineTo(10,4); c.closePath(); c.fill(); c.stroke();
  c.fillStyle=shade(T.c,-.2); c.beginPath(); c.moveTo(10,6); c.lineTo(30,6); c.quadraticCurveTo(26,16,8,12); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#fff'; for(let k=0;k<4;k++){ c.beginPath(); c.moveTo(14+k*4,2); c.lineTo(16+k*4,6); c.lineTo(18+k*4,2); c.fill(); } c.fillStyle='#c8202a'; c.beginPath(); c.ellipse(20,5,6,1.6,0,0,TAU); c.fill();
  c.fillStyle='#fff'; c.beginPath(); c.ellipse(6,-6,5,4,0,0,TAU); c.fill(); c.stroke(); c.fillStyle='#1a0e08'; c.beginPath(); c.arc(7,-6,2.2,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(7.8,-6.8,.8,0,TAU); c.fill();
  c.strokeStyle=T.s; c.lineWidth=3; c.lineCap='round'; c.beginPath(); c.moveTo(-2,-12); c.quadraticCurveTo(-8,-26,-18,-28); c.moveTo(4,-13); c.quadraticCurveTo(2,-28,-6,-34); c.stroke();
  c.strokeStyle=T.s; c.lineWidth=1.4; const ww=Math.sin(t*4)*3; c.beginPath(); c.moveTo(28,0); c.quadraticCurveTo(40,4+ww,46,-2+ww); c.moveTo(26,4); c.quadraticCurveTo(36,12-ww,44,10-ww); c.stroke();
  c.fillStyle=T.h; c.beginPath(); c.arc(30,-4,2.4,0,TAU); c.fill(); c.restore();
  /* 奪標手：坐在龍頭上，搶旗時伸手 */ const gr=o.grab||0; c.save(); c.translate(14,-34); chibi(c,0,0,.8,{t,body:'#ffd23f',sleeve:'#ffd23f',pants:'#2b2b44',acc:'band',face:1,armL:gr?2.6:.6,armR:gr?2.9:.4,legL:1.3,legR:1.2,mouth:gr?'open':'smile'}); c.restore();
  c.restore();
  c.restore();
  /* 船尾隊旗 */ c.save(); c.translate(x-96*s,y-40*s); c.scale(s,s); c.strokeStyle='#6a4a2a'; c.lineWidth=2; c.beginPath(); c.moveTo(0,10); c.lineTo(0,-30); c.stroke(); c.fillStyle=T.c; c.beginPath(); c.moveTo(0,-30); c.quadraticCurveTo(14,-26+Math.sin(t*6)*3,26,-28); c.lineTo(24,-14); c.quadraticCurveTo(12,-12+Math.sin(t*6+1)*3,0,-16); c.closePath(); c.fill(); c.fillStyle=T.s; c.font='900 10px '+TC; c.textAlign='center'; c.fillText(T.n[0],12,-19); c.restore(); }
/* ---------- 背景 ---------- */
const BGC={};
function farBg(si){ if(BGC[si]) return BGC[si]; const S=STAGES[si],e=document.createElement('canvas'); e.width=W*2; e.height=170; const c=e.getContext('2d'),r=rng(si*53+9);
  const g=c.createLinearGradient(0,0,0,170); g.addColorStop(0,S.sky[0]); g.addColorStop(1,S.sky[1]); c.fillStyle=g; c.fillRect(0,0,W*2,170);
  if(S.night){ for(let i=0;i<120;i++){ c.fillStyle='rgba(255,255,255,'+(.3+r()*.6)+')'; c.fillRect(r()*W*2,r()*110,1.5,1.5); } c.fillStyle='#fffbe0'; c.beginPath(); c.arc(1300,46,22,0,TAU); c.fill(); }
  else { c.fillStyle='rgba(255,255,255,.85)'; for(let i=0;i<8;i++){ const x=r()*W*2,y=20+r()*50; c.beginPath(); c.ellipse(x,y,50,14,0,0,TAU); c.ellipse(x+28,y-8,30,12,0,0,TAU); c.fill(); } }
  c.fillStyle=shade(S.hill,.25); c.beginPath(); c.moveTo(0,170); for(let x=0;x<=W*2;x+=40) c.lineTo(x,90+Math.sin(x*.006+si)*24+Math.sin(x*.017)*10); c.lineTo(W*2,170); c.fill();
  c.fillStyle=S.hill; c.beginPath(); c.moveTo(0,170); for(let x=0;x<=W*2;x+=30) c.lineTo(x,118+Math.sin(x*.01+si*2)*14+Math.sin(x*.03)*6); c.lineTo(W*2,170); c.fill();
  if(S.deco==='pagoda'){ c.fillStyle='#8a3a2a'; for(let k=0;k<5;k++){ const w=30-k*5; c.fillRect(1000-w/2,110-k*14,w,10); c.beginPath(); c.moveTo(1000-w/2-6,110-k*14); c.lineTo(1000+w/2+6,110-k*14); c.lineTo(1000,102-k*14); c.fill(); } }
  if(S.deco==='city'){ for(let k=0;k<26;k++){ const x=k*60+r()*20,h=30+r()*60; c.fillStyle=S.night?'#1a1a30':'#8a9ab0'; c.fillRect(x,150-h,40,h); c.fillStyle=S.night?'rgba(255,220,120,.8)':'rgba(255,255,255,.4)'; for(let y=150-h+6;y<146;y+=10) for(let xx=x+5;xx<x+36;xx+=9) if(r()<.6) c.fillRect(xx,y,4,5); } }
  return BGC[si]=e; }
function nearBank(c,si,cam,t){ const S=STAGES[si],off=((cam*PX*.55)%160+160)%160; c.fillStyle=S.night?'#2a2030':'#7a6a4a'; c.fillRect(0,150,W,22); c.fillStyle=S.night?'#3a2a40':'#a8906a'; c.fillRect(0,166,W,6);
  for(let k=-1;k<7;k++){ const x=k*160-off; if(S.deco==='stand'||S.deco==='bridge'){ c.fillStyle='#d8d0c0'; c.fillRect(x,118,150,34); c.fillStyle='#b8b0a0'; for(let r=0;r<3;r++) c.fillRect(x,122+r*10,150,3); for(let p=0;p<14;p++){ const px=x+6+p*10.5,py=128+(p%3)*10,j=Math.abs(Math.sin(t*6+p+k))*3; c.fillStyle=['#ff5d6d','#4f9dff','#ffd23f','#5fd068','#ff9d3d'][(p+k)%5]; c.beginPath(); c.arc(px,py-j,4,0,TAU); c.fill(); c.fillStyle='#ffe2c6'; c.beginPath(); c.arc(px,py-6-j,3.4,0,TAU); c.fill(); } c.fillStyle=['#d8262a','#e8a820','#1f9a7a'][((k%3)+3)%3]; c.beginPath(); c.moveTo(x+10,112); c.lineTo(x+40,112); c.lineTo(x+25,120); c.fill(); }
    else if(S.deco==='temple'||S.deco==='pagoda'){ c.fillStyle='#c84a3a'; c.fillRect(x+30,120,90,30); c.fillStyle='#2a6a4a'; c.beginPath(); c.moveTo(x+18,122); c.quadraticCurveTo(x+75,100,x+132,122); c.lineTo(x+120,112); c.quadraticCurveTo(x+75,92,x+30,112); c.closePath(); c.fill(); c.fillStyle='#ffd23f'; c.fillRect(x+66,128,18,22); c.strokeStyle='#ffd23f'; c.lineWidth=2; c.beginPath(); c.moveTo(x+18,122); c.quadraticCurveTo(x+10,112,x+14,108); c.moveTo(x+132,122); c.quadraticCurveTo(x+140,112,x+136,108); c.stroke(); }
    else if(S.deco==='lantern'||S.deco==='city'){ c.strokeStyle='#3a2a2a'; c.lineWidth=1; c.beginPath(); c.moveTo(x,112); c.quadraticCurveTo(x+80,126,x+160,112); c.stroke(); for(let p=0;p<5;p++){ const px=x+16+p*32,py=114+Math.sin(p/4*Math.PI)*10; c.fillStyle=S.night?'rgba(255,90,60,.35)':'rgba(255,90,60,0)'; c.beginPath(); c.arc(px,py+6,12,0,TAU); c.fill(); c.fillStyle='#e83a2a'; c.beginPath(); c.ellipse(px,py+6,6,8,0,0,TAU); c.fill(); c.fillStyle='#ffd23f'; c.fillRect(px-3,py-2,6,2); } }
    c.fillStyle=S.night?'#14301e':'#3a8a4a'; c.beginPath(); c.arc(x+150,138,14,0,TAU); c.arc(x+142,130,10,0,TAU); c.fill(); }
  if(S.deco==='bridge'){ const bx=W*.5-((cam*PX*.55)%1400); c.fillStyle='#c8c0b0'; c.fillRect(bx-200,96,600,10); for(let k=0;k<7;k++){ c.strokeStyle='#a8a090'; c.lineWidth=2; c.beginPath(); c.moveTo(bx-200+k*100,96); c.lineTo(bx-150+k*100,70); c.lineTo(bx-100+k*100,96); c.stroke(); } } }

function create(env,opts){
  const {ctx:c}=env.canvas2d(W,H),net=opts.net,client=!!net&&!net.host,host=!client,two=!net&&opts.mode==='2p',pv=!!opts.preview,si=clamp(opts.stage|0,0,STAGES.length-1),S=STAGES[si];
  const humans=net?net.count:pv?0:two?2:1,n=net?clamp(net.count+(net.bots||0),2,6):two?Math.max(3,S.boats):S.boats,me=net?net.me:0,LEN=S.len;
  const myTeam=(opts.look&&+opts.look.team)||0;
  const teams=[]; for(let i=0;i<n;i++){ let tm; if(i<humans){ const L=net?(net.looks&&net.looks[i])||{}:i===0?opts.look||{}:{}; tm=L.team!=null?+L.team:i; } else tm=-1; teams.push(tm); }
  const usedT=new Set(teams.filter(x=>x>=0)); for(let i=0;i<n;i++){ if(teams[i]<0||(teams.indexOf(teams[i])!==i)){ let k=0; while(usedT.has(k)) k++; teams[i]=k%6; usedT.add(k); } }
  const names=[]; for(let i=0;i<n;i++) names.push(i<humans?(net?(net.names&&net.names[i])||'玩家'+(i+1):two?(i+1)+'P':(opts.name||'你')):TEAMS[teams[i]].n);
  const B=[]; for(let i=0;i<n;i++) B.push({x:0,v:0,combo:0,ph:0,st:0,bpm:96,nextBeat:.6,hitBeat:-1,lastJ:null,jl:0,beatFx:0,state:'race',grab:0,back:0,fin:null,skill:i<humans?0:clamp(S.ai+(i-humans)*.03-(n>4?.04:0),0,.98),grabTry:false});
  let t=0,ended=false,cd=pv?0:3.4,T=0,fx=[],cam=0,sendT=0,order=[],lastCd=4,shake=0,endT=null,rain=[];
  const isLocal=i=>!pv&&(two?i<2:!net?i===0:i===me);
  const tone=(f,d,type,v)=>{ const A=env.audio&&env.audio(); if(!A||pv) return; try{ const o=A.createOscillator(),g=A.createGain(),n0=A.currentTime; o.type=type||'sine'; o.frequency.setValueAtTime(f,n0); o.frequency.exponentialRampToValueAtTime(Math.max(40,f*.5),n0+d); g.gain.setValueAtTime(v||.1,n0); g.gain.exponentialRampToValueAtTime(.001,n0+d); o.connect(g); g.connect((env.out&&env.out())||A.destination); o.start(n0); o.stop(n0+d+.02); }catch(e){} };
  const drum=(big)=>{ tone(big?120:150,.22,'sine',big?.32:.2); };
  const splash=(bi,k)=>{ const b=B[bi]; for(let q=0;q<k;q++) fx.push({bi,x:b.x-(Math.random()*8+1),y:0,vx:-2-Math.random()*3,vy:-(20+Math.random()*30),l:.6,w:1}); };
  /* 划槳：看離最近一拍多遠 */
  function paddle(i){ const b=B[i]; if(b.state==='glide'){ tryGrab(i); return; } if(b.state!=='race'||T<0) return; const period=60/b.bpm,prev=b.prevBeat!=null?b.prevBeat:b.nextBeat-period,dPrev=T-prev,dNext=b.nextBeat-T; let target,dt; if(dPrev<dNext){ target=Math.round(prev*1000); dt=dPrev; } else { target=Math.round(b.nextBeat*1000); dt=-dNext; }
    if(target===b.hitBeat){ judge(i,'miss'); return; } const a=Math.abs(dt),j=a<=WIN.perfect?'perfect':a<=WIN.great?'great':a<=WIN.good?'good':'miss'; if(j!=='miss') b.hitBeat=target; judge(i,j); }
  function judge(i,j){ const b=B[i]; b.lastJ=j; b.jl=.5; if(j==='miss'){ b.combo=Math.floor(b.combo/2); b.v*=.85; if(isLocal(i)) tone(200,.12,'square',.05); } else { b.combo++; b.v+=IMP[j]; b.st=0.0001; splash(i,j==='perfect'?8:4); if(isLocal(i)){ drum(j==='perfect'); } } b.bpm=96+Math.min(b.combo,27)*2; }
  function tryGrab(i){ const b=B[i]; if(b.grabTry||b.state!=='glide') return; b.grab=.6; const d=b.x-LEN; if(d>=GRAB0&&d<=GRAB1){ b.state='done'; b.fin=T; order.push(i); if(isLocal(i)||pv){ env.sfx&&!pv&&env.sfx('win'); } for(let k=0;k<30;k++) fx.push({bi:i,x:LEN,y:-46,vx:(Math.random()-.5)*12,vy:-(30+Math.random()*60),l:1.2,w:0,c:['#ffd23f','#ff5d6d','#fff'][k%3]}); }
    else { b.grabTry=true; if(isLocal(i)) tone(180,.3,'sawtooth',.06); } }
  /* 電腦：每一拍照實力決定打得準不準；最後搶旗 */
  function botBeat(i){ const b=B[i],s=b.skill,r=Math.random(); if(r<.06*(1-s)) return; const j=r<.25+.55*s?'perfect':r<.6+.3*s?'great':r<.92?'good':'miss'; if(j==='miss'){ judge(i,'miss'); return; } b.hitBeat=Math.round(b.nextBeat*1000); judge(i,j); }
  function updBoat(i,dt){ const b=B[i]; if(b.state==='done'){ b.v*=Math.exp(-1.2*dt); b.x+=b.v*dt; return; }
    if(b.state==='back'){ b.back-=dt; b.v+=(-3-b.v)*Math.min(1,dt*2); b.x+=b.v*dt; if(b.back<=0||b.x<LEN-14){ b.state='race'; b.v=0; b.grabTry=false; } return; }
    if(T<0) return;
    /* 拍子 */ if(b.state==='race'){ while(T>=b.nextBeat){ if(i>=humans||pv) botBeat(i); b.beatFx=1; if(isLocal(i)&&!two) tone(80,.06,'sine',.12); b.prevBeat=b.nextBeat; b.nextBeat+=60/b.bpm; }
      /* 真人錯過一拍沒划：連擊歸零 */ if(i<humans&&!pv){ const prev=Math.round((b.prevBeat||0)*1000); if(prev>0&&b.chk!==prev&&T*1000-prev>WIN.good*1000){ b.chk=prev; if(b.hitBeat!==prev&&b.combo>0){ b.combo=Math.floor(b.combo/2); b.bpm=96+Math.min(b.combo,27)*2; } } } }
    b.beatFx=Math.max(0,b.beatFx-dt*4); b.jl=Math.max(0,b.jl-dt); b.grab=Math.max(0,b.grab-dt);
    if(b.st>0){ b.st+=dt*2.4; if(b.st>=1) b.st=0; }
    const dr=b.state==='glide'?.18:DRAG; b.v*=Math.exp(-dr*dt); b.x+=b.v*dt;
    if(b.state==='race'&&b.x>=LEN-11){ b.state='glide'; b.v=Math.max(b.v,3.2); }
    if(b.state==='glide'){ if((i>=humans||pv)&&!b.grabTry){ const d=b.x-LEN; if(d>=GRAB0+.4&&d<=GRAB1-.3&&Math.random()<dt*(2.5+b.skill*6)){ if(Math.random()<.55+.4*b.skill||pv) tryGrab(i); else b.grabTry=true; } }
      if(b.x-LEN>GRAB1+.2&&b.state==='glide'){ b.state='back'; b.back=1.8; b.grabTry=false; if(isLocal(i)) { env.sfx('bump'); } fx.push({txt:'沒搶到旗！倒退重來',bi:i,l:1.6}); } } }
  /* 連線 */
  if(net){ if(client) net.onmsg=m=>{ if(m.B) m.B.forEach((a,i)=>{ if(i===me) return; const b=B[i]; b.x=a[0]; b.v=a[1]; b.combo=a[2]; b.state=a[3]; b.st=a[4]; b.grab=a[5]; }); if(m.T!=null&&cd<=0) T=Math.max(T,m.T-.05); if(m.order) order=m.order; if(m.end&&!ended){ ended=true; finish(); } };
    else net.onmsg=(m,from)=>{ if(m.b){ const b=B[from],a=m.b; b.x=a[0]; b.v=a[1]; b.combo=a[2]; b.state=a[3]; b.st=a[4]; b.grab=a[5]; if(a[3]==='done'&&!order.includes(from)){ order.push(from); b.fin=a[6]; } } }; }
  const pack=i=>{ const b=B[i]; return [Math.round(b.x*100)/100,Math.round(b.v*100)/100,b.combo,b.state,Math.round(b.st*100)/100,b.grab>0?1:0,b.fin]; };
  function finish(){ const rows=B.map((b,i)=>i).sort((a,b)=>{ const ia=order.indexOf(a),ib=order.indexOf(b); if(ia>=0&&ib>=0) return ia-ib; if(ia>=0) return -1; if(ib>=0) return 1; return B[b].x-B[a].x; });
    const myRank=rows.indexOf(two?Math.min(...[0,1].map(k=>rows.indexOf(k))):me),mine=i=>two?i<2:i===me;
    if(!net&&!two&&B[0].fin!=null){ try{ const k='arcade.dragon.t.'+si,o=+localStorage.getItem(k)||0; if(!o||B[0].fin<o) localStorage.setItem(k,B[0].fin.toFixed(2)); if(rows[0]===0) localStorage.setItem('arcade.dragon.w.'+si,'1'); }catch(e){} }
    const html='<table class="ls"><tr><th>名次</th><th>隊伍</th><th>時間</th></tr>'+rows.map((i,k)=>'<tr'+(mine(i)?' style="color:#ffd23f"':'')+'><td>'+(k+1)+'</td><td>'+names[i]+(i<humans&&!two&&!net?'':'')+'</td><td>'+(B[i].fin!=null?B[i].fin.toFixed(2)+' 秒':'—')+'</td></tr>').join('')+'</table>';
    const w=rows[0]; env.end({title:two?names[w]+' 奪標！':mine(w)?'奪標成功！第一名！':names[w]+' 奪標',big:two?(w<2?names[w]+' 獲勝':'電腦獲勝'):'第 '+(rows.indexOf(me)+1)+' 名',html,score:null}); }
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt;
    if(cd>0){ cd-=dt; const s=Math.ceil(cd); if(s!==lastCd&&s>=1&&s<=3){ lastCd=s; env.sfx('beep'); } if(cd<=0){ env.sfx('go'); T=0; for(const b of B){ b.nextBeat=.5; } } }
    else T+=dt;
    if(!pv){ if(two){ if(env.hit('KeyF')||env.hit('KeyD')) paddle(0); if(env.hit('KeyJ')||env.hit('Enter')||env.hit('ArrowUp')) paddle(1); } else if(env.hit('Space')||env.hit('KeyJ')||env.hit('KeyF')||env.hit('ArrowUp')) paddle(net?me:0); }
    for(let i=0;i<n;i++){ if(client&&i!==me) { B[i].x+=B[i].v*dt; continue; } updBoat(i,dt); }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/15; if(client) net.send({b:pack(me)}); else net.send({B:B.map((b,i)=>pack(i)),T,order}); } }
    /* 結束：真人都奪標，或第一名奪標後 15 秒 */
    const humansIdx=[...Array(humans).keys()]; if(host&&!ended&&order.length){ if(endT==null) endT=T+15; const allH=humansIdx.every(i=>B[i].state==='done')||order.length>=n; if((allH&&T>endT-12.5)||T>endT){ if(pv){ for(const b of B){ b.x=0; b.v=0; b.state='race'; b.fin=null; b.combo=0; b.bpm=96; b.nextBeat=T+.5; } order=[]; endT=null; return; } ended=true; if(net) net.send({B:B.map((b,i)=>pack(i)),order,end:1}); setTimeout(finish,0); } }
    const focus=two?(B[0].x+B[1].x)/2:B[pv?0:me].x; cam+=(focus-cam)*Math.min(1,dt*3);
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; if(f.l<=0){ fx.splice(i,1); continue; } if(f.txt) continue; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=90*dt; }
    if(S.rain){ while(rain.length<90) rain.push({x:Math.random()*W,y:Math.random()*H,s:400+Math.random()*200}); for(const r of rain){ r.y+=r.s*dt; r.x-=r.s*.2*dt; if(r.y>H){ r.y=-10; r.x=Math.random()*W+60; } } } }
  /* 畫面：泳道由遠到近 */
  const laneY=i=>{ const k=n>1?i/(n-1):1; return 200+k*226; },laneS=i=>{ const k=n>1?i/(n-1):1; return (n>4?.5:.58)+k*(n>4?.34:.36); };
  const sx=(x,i)=>W*.42+(x-cam)*PX*(.7+.3*laneS(i));
  function draw(){ const far=farBg(si),fo=((cam*PX*.12)%W+W)%W; c.drawImage(far,-fo,0); c.drawImage(far,W-fo,0,W,170,W-fo,0,W,170);
    nearBank(c,si,cam,t);
    /* 水面 */ const wg=c.createLinearGradient(0,170,0,H); wg.addColorStop(0,shade(S.water,.2)); wg.addColorStop(1,shade(S.water,-.25)); c.fillStyle=wg; c.fillRect(0,170,W,H-170);
    c.strokeStyle='rgba(255,255,255,.18)'; c.lineWidth=1.5; for(let k=0;k<26;k++){ const y=178+k*12,ph=((cam*PX*(.5+k*.03))+k*53)%90; for(let x=-ph;x<W;x+=90){ c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x+12,y-3,x+24,y); c.stroke(); } }
    if(S.night){ for(let k=0;k<6;k++){ const x=((k*160-cam*PX*.55)%960+960)%960-80; c.fillStyle='rgba(255,120,60,.18)'; c.fillRect(x,176,14,120); } }
    /* 終點：旗桿與錦旗（每條道一面） */
    for(let i=0;i<n;i++){ const y=laneY(i),s=laneS(i),fx0=sx(LEN,i); if(fx0>-60&&fx0<W+60){ c.strokeStyle='#f4f4f4'; c.lineWidth=3*s; c.beginPath(); c.moveTo(fx0+38*s,y-120*s); c.lineTo(fx0+38*s,y+6*s); c.stroke(); c.fillStyle='#ff5d4f'; c.beginPath(); c.arc(fx0+38*s,y+6*s,7*s,0,TAU); c.fill(); const got=order.includes(i); if(!got){ c.fillStyle='#d8262a'; c.beginPath(); c.moveTo(fx0+38*s,y-112*s); c.lineTo(fx0+60*s,y-108*s+Math.sin(t*5)*2); c.lineTo(fx0+56*s,y-90*s); c.lineTo(fx0+38*s,y-94*s); c.closePath(); c.fill(); c.fillStyle='#ffd23f'; c.font='900 '+Math.round(9*s)+'px '+TC; c.textAlign='center'; c.fillText('標',fx0+48*s,y-98*s); } } }
    /* 距離浮標 */ for(let m=50;m<LEN;m+=50){ const x=sx(m,n-1); if(x<-40||x>W+40) continue; c.fillStyle='rgba(255,255,255,.85)'; c.font='900 12px '+TC; c.textAlign='center'; c.fillText(m+' m',x,186); }
    /* 船（遠的先畫） */ for(let i=0;i<n;i++){ const b=B[i],y=laneY(i),s=laneS(i);
      if(i>0){ const ry=(laneY(i-1)+y)/2+8*s; c.fillStyle='rgba(255,255,255,.5)'; for(let x=((-cam*PX)%22+22)%22;x<W;x+=22){ c.fillStyle=(Math.floor((x+cam*PX)/22)%2)?'#ff5d4f':'#fff'; c.beginPath(); c.arc(x,ry,2.6*s,0,TAU); c.fill(); } }
      const bx=sx(b.x,i)-104*s; /* 船頭在 b.x */ if(bx<-260||bx>W+260) continue;
      if(b.v>1){ c.strokeStyle='rgba(255,255,255,.4)'; c.lineWidth=2*s; for(let k=0;k<3;k++){ c.beginPath(); c.moveTo(bx-110*s-k*16*s,y+8*s+k*2); c.lineTo(bx-150*s-k*22*s-b.v*4,y+12*s+k*3); c.stroke(); } }
      const T0=TEAMS[teams[i]]; boat(c,bx,y,s,T0,t+i,{stroke:b.st,beat:b.beatFx,grab:b.grab>0||b.state==='done'?1:0,crew:shade(T0.c,.55)});
      for(const f of fx){ if(f.bi!==i||f.txt) continue; const px=sx(f.x,i)-104*s+(f.w?(-60+Math.random()*130)*s:0),py=y+(f.w?8*s:0)+f.y*s; c.globalAlpha=Math.min(1,f.l*2); c.fillStyle=f.c||'rgba(220,245,255,.9)'; c.beginPath(); c.arc(px,py,(f.w?2.4:3)*s,0,TAU); c.fill(); c.globalAlpha=1; }
      const mine=two?i<2:i===me&&!pv; c.font='900 '+Math.round(12*s+2)+'px '+TC; c.textAlign='center'; c.lineWidth=4; c.strokeStyle='rgba(10,8,24,.8)'; const ny=y-82*s; c.strokeText(names[i],bx,ny); c.fillStyle=mine?'#ffd23f':'#fff'; c.fillText(names[i],bx,ny);
      if(mine&&(T<3||cd>0)){ const bb=Math.sin(t*6)*3; c.fillStyle='#ffd23f'; c.beginPath(); c.moveTo(bx-8,ny-18+bb); c.lineTo(bx+8,ny-18+bb); c.lineTo(bx,ny-8+bb); c.fill(); c.font='900 18px '+TC; c.strokeText(two?(i+1)+'P':'你',bx,ny-26+bb); c.fillText(two?(i+1)+'P':'你',bx,ny-26+bb); }
      if(b.jl>0&&b.lastJ&&(isLocal(i))){ c.font='900 20px '+TC; c.strokeText(JT[b.lastJ],bx+60*s,y-60*s-(.5-b.jl)*30); c.fillStyle=JC[b.lastJ]; c.fillText(JT[b.lastJ],bx+60*s,y-60*s-(.5-b.jl)*30); } }
    if(S.rain){ c.strokeStyle='rgba(220,230,255,.45)'; c.lineWidth=1; c.beginPath(); for(const r of rain){ c.moveTo(r.x,r.y); c.lineTo(r.x-4,r.y+14); } c.stroke(); }
    hud(); }
  function beatBar(i,x0,y0,w,label){ const b=B[i]; c.fillStyle='rgba(10,8,24,.72)'; rr(c,x0,y0,w,52,14); c.fill(); const tx=x0+52,ty=y0+26;
    if(b.state==='glide'||b.state==='back'){ const d=b.x-LEN,k=clamp((d-GRAB0+8)/(GRAB1-GRAB0+8),0,1); c.fillStyle='#fff'; c.font='900 14px '+TC; c.textAlign='left'; c.fillText(b.state==='back'?'倒退中…再衝一次！':'準備奪標！旗子到綠色時按',x0+14,y0+16); const bw=w-28; c.fillStyle='rgba(255,255,255,.15)'; rr(c,x0+14,y0+28,bw,14,7); c.fill(); const g0=(8)/(GRAB1-GRAB0+8); c.fillStyle='#5fd068'; rr(c,x0+14+bw*g0,y0+28,bw*(1-g0)*.85,14,7); c.fill(); if(b.state==='glide'){ c.fillStyle='#ffd23f'; c.beginPath(); c.arc(x0+14+bw*k,y0+35,9,0,TAU); c.fill(); c.fillStyle='#d8262a'; c.font='900 10px '+TC; c.textAlign='center'; c.fillText('標',x0+14+bw*k,y0+36); } return; }
    if(b.state==='done'){ c.fillStyle='#ffd23f'; c.font='900 18px '+TC; c.textAlign='center'; c.fillText('🏁 奪標成功！ '+(b.fin!=null?b.fin.toFixed(2)+' 秒':''),x0+w/2,ty); return; }
    /* 鼓點從右邊滑進來 */ c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(tx,ty-2,w-66,4); const sp=230,period=60/b.bpm; for(let k=0;k<6;k++){ const bt=b.nextBeat+k*period-period,x=tx+(bt-T)*sp; if(x<tx-20||x>x0+w-8) continue; const hit=b.hitBeat===Math.round(bt*1000); c.globalAlpha=hit?.25:1; c.fillStyle='#c8202a'; c.beginPath(); c.arc(x,ty,11,0,TAU); c.fill(); c.fillStyle='#f4e0b0'; c.beginPath(); c.arc(x,ty,7,0,TAU); c.fill(); c.globalAlpha=1; }
    const pul=b.beatFx; c.strokeStyle='#fff'; c.lineWidth=3; c.beginPath(); c.arc(tx,ty,15+pul*4,0,TAU); c.stroke(); c.fillStyle='rgba(255,255,255,'+(.15+pul*.3)+')'; c.fill();
    c.fillStyle='#ffd23f'; c.font='900 13px '+TC; c.textAlign='center'; c.fillText(label,x0+26,ty-10); c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText(b.combo,x0+26,ty+10); c.fillStyle='#cfc8ff'; c.font='700 10px '+TC; c.textAlign='right'; c.fillText('連擊　'+Math.round(b.v*3.6)+' km/h',x0+w-10,y0+12); }
  function hud(){ /* 進度 */ c.fillStyle='rgba(10,8,24,.7)'; rr(c,10,10,W-20,30,12); c.fill(); c.fillStyle='#fff'; c.font='900 13px '+TC; c.textAlign='left'; c.textBaseline='middle'; c.fillText(S.n+'　'+LEN+' m',22,25); const x0=160,w=W-200; c.fillStyle='rgba(255,255,255,.18)'; c.fillRect(x0,24,w,3); c.fillStyle='#ff5d4f'; c.fillRect(x0+w-2,16,4,18);
    B.forEach((b,i)=>{ const x=x0+w*clamp(b.x/LEN,0,1.02),mine=two?i<2:i===me&&!pv; c.fillStyle=TEAMS[teams[i]].c; c.beginPath(); c.arc(x,25,mine?7:5,0,TAU); c.fill(); if(mine){ c.strokeStyle='#ffd23f'; c.lineWidth=2; c.stroke(); } });
    if(!pv){ if(two){ beatBar(0,10,H-60,385,'1P'); beatBar(1,405,H-60,385,'2P'); } else beatBar(net?me:0,W/2-210,H-60,420,'連擊'); }
    let rk=1; const mb=B[pv?0:me]; for(const b of B) if(b!==mb&&(b.fin!=null&&(mb.fin==null||b.fin<mb.fin)||(mb.fin==null&&b.fin==null&&b.x>mb.x))) rk++; if(!two&&!pv){ c.fillStyle='rgba(10,8,24,.7)'; rr(c,W-110,48,100,44,12); c.fill(); c.fillStyle='#ffd23f'; c.font='900 24px '+TC; c.textAlign='center'; c.fillText(rk+' / '+n,W-60,71); }
    for(const f of fx) if(f.txt&&isLocal(f.bi)){ c.font='900 24px '+TC; c.textAlign='center'; c.lineWidth=6; c.strokeStyle='#14122b'; c.globalAlpha=Math.min(1,f.l*2); c.strokeText(f.txt,W/2,150); c.fillStyle='#ff8a8a'; c.fillText(f.txt,W/2,150); c.globalAlpha=1; }
    if(cd>0){ const s=Math.ceil(cd); c.font='900 70px '+TC; c.textAlign='center'; c.lineWidth=10; c.strokeStyle='#14122b'; c.strokeText(s>3?'':s,W/2,140); c.fillStyle='#ffd23f'; c.fillText(s>3?'':s,W/2,140); c.fillStyle='rgba(10,8,24,.75)'; rr(c,W/2-220,H-120,440,46,14); c.fill(); c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText(two?'1P 按 F、2P 按 J：鼓點滑到白圈時按下去划槳！':env.touch?'鼓點滑到白圈時按「划」！打得準船就快':'鼓點滑到白圈時按空白鍵划槳！打得準船就快',W/2,H-97); } }
  return {update,draw,destroy(){},_dbg:{B,get T(){return T;},paddle,get order(){return order;}}};
}
function stageShow(ctx,w,h,si,t){ const S=STAGES[si]; ctx.save(); ctx.scale(w/W,h/H); const far=farBg(si); ctx.drawImage(far,0,0,W,170,0,0,W,170); nearBank(ctx,si,t*3,t); const wg=ctx.createLinearGradient(0,170,0,H); wg.addColorStop(0,shade(S.water,.2)); wg.addColorStop(1,shade(S.water,-.25)); ctx.fillStyle=wg; ctx.fillRect(0,170,W,H-170);
  ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.lineWidth=1.5; for(let k=0;k<26;k++){ const y=178+k*12,ph=(t*60*(.5+k*.03)+k*53)%90; for(let x=-ph;x<W;x+=90){ ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+12,y-3,x+24,y); ctx.stroke(); } }
  const st=(t*1.6)%1; boat(ctx,300+Math.sin(t)*10,250,.72,TEAMS[1],t,{stroke:st,beat:st<.15?1:0,crew:shade(TEAMS[1].c,.55)}); boat(ctx,420+Math.sin(t+1)*8,400,1.12,TEAMS[0],t+1,{stroke:(st+.3)%1,beat:(st+.3)%1<.15?1:0,crew:shade(TEAMS[0].c,.55)});
  ctx.font='900 26px '+TC; ctx.textAlign='center'; ctx.lineWidth=7; ctx.strokeStyle='#14122b'; ctx.strokeText(S.n,W/2,H-22); ctx.fillStyle='#ffd23f'; ctx.fillText(S.n,W/2,H-22); ctx.restore(); }
const getT=i=>{ try{ const v=localStorage.getItem('arcade.dragon.t.'+i); return v==null?null:+v; }catch(e){ return null; } },getW=i=>{ try{ return localStorage.getItem('arcade.dragon.w.'+i)==='1'; }catch(e){ return false; } };
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).dragon={
  name:'划龍舟大賽',tag:'DRAGON BOAT',color:'#d8262a',online:true,maxPlayers:6,minPlayers:2,bots:true,
  desc:'跟著鼓聲划槳！鼓點滑到白圈時按下去，打得越準、連擊越多鼓越快，船就越快。衝到終點還要抓準時機「奪標」搶下錦旗才算贏。10 個賽場一場比一場強。',
  goal:'跟著鼓點按鍵划槳衝到終點，再抓準時機搶到錦旗（奪標），最先奪標的隊伍獲勝。',
  stages:STAGES.map(s=>s.n),stars:STAGES.map((s,i)=>1+Math.floor(i/2)),stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,9,t),
  stageGoal:i=>'「'+STAGES[i].n+'」'+STAGES[i].len+' 公尺、'+STAGES[i].boats+' 艘船：跟著鼓點划槳，到終點抓準時機奪標。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['空白鍵','鼓點滑到白圈時按下去划槳'],['終點','旗子進到綠色區時按空白鍵奪標'],['雙人','1P 按 F、2P 按 J']],
  touchHelp:[['划','鼓點滑到白圈時按下去'],['終點','旗子到綠色區時按「划」奪標']],
  touch:{left:[],right:[{l:'划',c:'KeyJ',act:true,big:true}]},
  looks:[{key:'team',label:'隊伍',opts:TEAMS.map((tm,k)=>({id:String(k),label:tm.n}))}],
  preview:(ctx,w,h,L,t)=>{ ctx.fillStyle='#8ad0ff'; ctx.fillRect(0,0,w,h); ctx.fillStyle='#2a8aa8'; ctx.fillRect(0,h*.55,w,h*.45); const k=L&&L.team!=null?+L.team:0; ctx.save(); ctx.scale(w/W,h/H); boat(ctx,W/2,H*.68,1.9,TEAMS[k],t,{stroke:(t*1.4)%1,beat:(t*1.4)%1<.15?1:0,crew:shade(TEAMS[k].c,.55)}); ctx.restore(); },
  hubBest:()=>{ let n=0; for(let i=0;i<STAGES.length;i++) if(getW(i)) n++; return n?'奪冠 <b>'+n+' / '+STAGES.length+'</b> 場':'尚無紀錄'; },
  stageBest:i=>{ const v=getT(i); return v?(getW(i)?'🏆 ':'')+v.toFixed(2)+' 秒':''; },
  best:{label:'最佳時間',fmt:v=>v+' 秒',lower:true},create};
})();
