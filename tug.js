// 拔河拔起來：跟著「嘿～咻！」的鼓點按鍵，全隊一起拉；按得準力氣大，亂按會滑倒。先把對手拉過線的贏，三戰兩勝。
// 單人帶電腦隊友闖 8 關（對手越來越強、節奏越來越快）、同機 1P 對 2P、連線最多 8 人（兩隊輪流分，房主運算）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,GY=372;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
/* 關卡：bpm 節奏、ai 對手準度（0～1）、foe 對手隊名 */
const ST=[{name:'校園運動會',bpm:84,ai:.38,foe:'隔壁班',fl:'#c84a3a'},{name:'夏日沙灘',bpm:88,ai:.46,foe:'衝浪隊',fl:'#f0d898'},{name:'農場泥巴池',bpm:92,ai:.54,foe:'農夫隊',fl:'#7ab84a',mud:1},{name:'雪地冰原',bpm:98,ai:.6,foe:'雪人隊',fl:'#eef6ff'},
  {name:'古代競技場',bpm:104,ai:.66,foe:'角鬥士',fl:'#d8b47a'},{name:'大樓屋頂',bpm:110,ai:.72,foe:'城市隊',fl:'#6a7488'},{name:'火山口',bpm:118,ai:.78,foe:'熔岩隊',fl:'#4a2a24',mud:2},{name:'叢林瀑布',bpm:121,ai:.8,foe:'猴子隊',fl:'#5a8a3a',mud:1},{name:'櫻花神社',bpm:124,ai:.82,foe:'武士隊',fl:'#d8c8b0'},{name:'冠軍大賽',bpm:126,ai:.84,foe:'拔河冠軍隊',fl:'#3a8a4a'}];
const PCOL=['#ff5d4f','#4f9dff','#ff9d3d','#3ddbd9','#ffd23f','#c56bff','#ff7eb6','#5fd068'],BOTN=['小胖','阿美','大雄','小綠','阿花','鐵蛋','小豆','阿強'];
const BOTLOOK=i=>({char:['cat','bunny','chef','pirate','ninja','crown','bow','cap'][i%8],color:'auto',deco:['','shades','scarf','cape','blush','tie'][i%6]});
const RED=['#ff5d4f','#ff7e6a','#ff9d3d','#ff6a8a'],BLUE=['#4f9dff','#3ddbd9','#6a7aff','#5ab8ff'];
/* 新增兩個場地插在冠軍大賽前面：舊的冠軍大賽紀錄（第 8 個）搬到新的第 10 個 */
try{ if(!localStorage.getItem('arcade.tug.mig10')){ if(localStorage.getItem('arcade.tug.w.7')) localStorage.setItem('arcade.tug.w.9','1'); localStorage.setItem('arcade.tug.mig10','1'); } }catch(e){}
const getW=i=>{ try{ return +localStorage.getItem('arcade.tug.w.'+i)||0; }catch(e){ return 0; } },setW=i=>{ try{ localStorage.setItem('arcade.tug.w.'+i,'1'); }catch(e){} };
/* ---------- 背景 ---------- */
function cloud(c,x,y,s){ c.fillStyle='rgba(255,255,255,.92)'; c.beginPath(); c.arc(x,y,16*s,0,TAU); c.arc(x+18*s,y-8*s,20*s,0,TAU); c.arc(x+40*s,y,15*s,0,TAU); c.fill(); }
function crowd(c,y,t,cols,dark){ for(let r=0;r<3;r++) for(let i=0;i<30;i++){ const x=i*28+(r%2)*14,j=Math.abs(Math.sin(t*6+i*1.7+r))*4,yy=y+r*22-j; c.fillStyle=dark?'rgba(0,0,0,.35)':cols[(i+r)%cols.length]; c.fillRect(x-8,yy+6,16,16); c.fillStyle=dark?'rgba(0,0,0,.4)':'#ffdcb8'; c.beginPath(); c.arc(x,yy,7,0,TAU); c.fill(); if((i+r)%5===0&&!dark){ c.fillStyle=cols[(i+2)%cols.length]; c.fillRect(x+6,yy-14-j,3,18); c.fillRect(x+6,yy-16-j,14,8); } } }
function bg(c,s,t){ const S=ST[s],g=c.createLinearGradient(0,0,0,GY);
  if(s===0){ g.addColorStop(0,'#7ec8ff'); g.addColorStop(1,'#d8f0ff'); c.fillStyle=g; c.fillRect(0,0,W,H); cloud(c,90,50,1); cloud(c,560,36,1.2); c.fillStyle='#f0e0c0'; c.fillRect(120,90,560,120); c.fillStyle='#d84a3a'; c.fillRect(120,80,560,12); for(let r=0;r<3;r++) for(let k=0;k<14;k++){ c.fillStyle='#8ac8f0'; c.fillRect(132+k*39,104+r*34,26,20); }
    c.strokeStyle='#888'; c.lineWidth=1.5; c.beginPath(); c.moveTo(0,40); c.quadraticCurveTo(400,90,W,40); c.stroke(); for(let i=0;i<20;i++){ const x=i*42+10,y=40+Math.sin(x/W*Math.PI)*46; c.fillStyle=PCOL[i%8]; c.beginPath(); c.moveTo(x,y); c.lineTo(x+16,y); c.lineTo(x+8,y+18); c.fill(); } crowd(c,236,t,['#ff5d4f','#4f9dff','#ffd23f','#5fd068']); }
  else if(s===1){ g.addColorStop(0,'#5ec4ff'); g.addColorStop(1,'#bfeaff'); c.fillStyle=g; c.fillRect(0,0,W,H); c.fillStyle='#fff6b0'; c.beginPath(); c.arc(660,70,40,0,TAU); c.fill(); cloud(c,120,60,1); c.fillStyle='#2a8ad8'; c.fillRect(0,190,W,110); c.fillStyle='rgba(255,255,255,.55)'; for(let i=0;i<16;i++) c.fillRect((i*67+t*20)%W,200+(i%4)*22,40,3);
    for(const x of [80,700]){ c.strokeStyle='#8a5a2a'; c.lineWidth=10; c.beginPath(); c.moveTo(x,300); c.quadraticCurveTo(x+14,220,x+4,150); c.stroke(); c.fillStyle='#3aa84a'; for(let k=0;k<5;k++){ c.save(); c.translate(x+4,150); c.rotate(k*1.25+Math.sin(t+k)*.08); c.beginPath(); c.ellipse(36,0,40,10,0,0,TAU); c.fill(); c.restore(); } }
    c.fillStyle='#ffe0a0'; c.fillRect(0,300,W,GY-300); }
  else if(s===2){ g.addColorStop(0,'#8ad0ff'); g.addColorStop(1,'#e0f6ff'); c.fillStyle=g; c.fillRect(0,0,W,H); cloud(c,100,50,1); cloud(c,520,40,.9); c.fillStyle='#6ab84a'; c.beginPath(); c.ellipse(200,260,320,80,0,0,TAU); c.ellipse(640,270,280,70,0,0,TAU); c.fill();
    c.fillStyle='#c83a2a'; c.fillRect(560,150,140,110); c.fillStyle='#8a2a1a'; c.beginPath(); c.moveTo(550,152); c.lineTo(630,96); c.lineTo(710,152); c.fill(); c.fillStyle='#fff'; c.fillRect(612,196,36,64); c.strokeStyle='#c83a2a'; c.lineWidth=3; c.beginPath(); c.moveTo(612,196); c.lineTo(648,260); c.moveTo(648,196); c.lineTo(612,260); c.stroke();
    c.strokeStyle='#e8d0a0'; c.lineWidth=4; for(let x=0;x<500;x+=50){ c.beginPath(); c.moveTo(x,250); c.lineTo(x,300); c.stroke(); } c.beginPath(); c.moveTo(0,262); c.lineTo(500,262); c.moveTo(0,286); c.lineTo(500,286); c.stroke();
    const cx=200+Math.sin(t*.5)*40; c.fillStyle='#fff'; c.beginPath(); c.ellipse(cx,280,24,15,0,0,TAU); c.fill(); c.fillStyle='#2a2a2a'; c.beginPath(); c.arc(cx-8,276,6,0,TAU); c.arc(cx+10,284,5,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(cx+24,272,9,0,TAU); c.fill(); c.fillStyle='#ffb0b0'; c.fillRect(cx+28,272,6,5); }
  else if(s===3){ g.addColorStop(0,'#a8c8ec'); g.addColorStop(1,'#e8f2ff'); c.fillStyle=g; c.fillRect(0,0,W,H); c.fillStyle='#c8d8ec'; c.beginPath(); c.moveTo(0,280); c.lineTo(150,140); c.lineTo(290,280); c.moveTo(220,280); c.lineTo(420,110); c.lineTo(620,280); c.moveTo(540,280); c.lineTo(700,160); c.lineTo(820,280); c.fill(); c.fillStyle='#fff'; for(const [x,y] of [[150,140],[420,110],[700,160]]){ c.beginPath(); c.moveTo(x-30,y+28); c.lineTo(x,y); c.lineTo(x+30,y+28); c.fill(); }
    for(const x of [120,690]){ c.fillStyle='#fff'; c.beginPath(); c.arc(x,300,26,0,TAU); c.arc(x,262,18,0,TAU); c.fill(); c.fillStyle='#14122b'; c.beginPath(); c.arc(x-6,258,2.5,0,TAU); c.arc(x+6,258,2.5,0,TAU); c.fill(); c.fillStyle='#ff9d3d'; c.beginPath(); c.moveTo(x,264); c.lineTo(x+14,266); c.lineTo(x,268); c.fill(); c.fillStyle='#d84a3a'; c.fillRect(x-18,276,36,6); }
    c.fillStyle='#fff'; for(let i=0;i<60;i++){ const x=(i*71+t*20)%W,y=(i*43+t*50)%GY; c.beginPath(); c.arc(x,y,1.6+(i%3),0,TAU); c.fill(); } c.fillStyle='#f4f8ff'; c.fillRect(0,300,W,GY-300); }
  else if(s===4){ g.addColorStop(0,'#ffb870'); g.addColorStop(1,'#ffe0b0'); c.fillStyle=g; c.fillRect(0,0,W,H); c.fillStyle='#c8945a'; c.fillRect(0,110,W,200); for(let k=0;k<12;k++){ c.fillStyle='#a87440'; rr(c,k*70+8,130,52,80,26); c.fill(); c.fillStyle='rgba(0,0,0,.3)'; rr(c,k*70+14,138,40,72,20); c.fill(); }
    c.fillStyle='#d8a868'; c.fillRect(0,100,W,14); c.fillRect(0,210,W,12); crowd(c,240,t,['#d84a3a','#e8c060','#8a5a3a','#fff']); for(const x of [40,760]){ c.fillStyle='#e8d8b8'; c.fillRect(x-12,40,24,270); c.fillStyle='#d8c8a8'; c.fillRect(x-18,34,36,10); } }
  else if(s===5){ g.addColorStop(0,'#ff9a6a'); g.addColorStop(1,'#ffd8a0'); c.fillStyle=g; c.fillRect(0,0,W,H); for(let i=0;i<12;i++){ const x=i*70,h2=90+(i*53)%140; c.fillStyle=i%2?'#4a4a6a':'#5a5a7a'; c.fillRect(x,GY-h2-80,62,h2+80); c.fillStyle='rgba(255,230,140,.7)'; for(let r=0;r<h2/22;r++) for(let k=0;k<3;k++) if((i+r+k)%3) c.fillRect(x+8+k*18,GY-h2-70+r*22,10,12); }
    c.fillStyle='#8a94a8'; c.fillRect(0,300,W,GY-300); c.fillStyle='#5a6478'; c.fillRect(0,296,W,6); c.fillStyle='#c8ccd8'; for(let x=10;x<W;x+=60) c.fillRect(x,276,4,24); c.fillRect(0,276,W,4); c.fillStyle='#e8e8e8'; c.fillRect(620,230,80,50); c.fillStyle='#888'; c.fillRect(640,250,40,30); c.fillStyle='#ff5d4f'; c.beginPath(); c.arc(660,236+Math.sin(t*4)*2,3,0,TAU); c.fill(); }
  else if(s===6){ g.addColorStop(0,'#2a0a0a'); g.addColorStop(1,'#7a2a14'); c.fillStyle=g; c.fillRect(0,0,W,H); c.fillStyle='#3a1a14'; c.beginPath(); c.moveTo(120,300); c.lineTo(330,70); c.lineTo(470,70); c.lineTo(680,300); c.fill(); c.fillStyle='#ff6a1a'; c.beginPath(); c.ellipse(400,72,70,12,0,0,TAU); c.fill();
    for(let i=0;i<10;i++){ const u=(t*.4+i*.1)%1; c.fillStyle='rgba(255,'+Math.round(120+u*100)+',40,'+(1-u)+')'; c.beginPath(); c.arc(400+Math.sin(i*2.3)*40*u,72-u*80,4+u*6,0,TAU); c.fill(); } c.fillStyle='rgba(80,60,60,.5)'; for(let i=0;i<5;i++){ c.beginPath(); c.arc(380+i*12+Math.sin(t+i)*8,30-((t*12+i*20)%40),18,0,TAU); c.fill(); } c.fillStyle='#4a2a24'; c.fillRect(0,300,W,GY-300); }
  else if(s===7){ /* 叢林瀑布：瀑布、藤蔓、大葉子、水霧 */ g.addColorStop(0,'#6ac0a0'); g.addColorStop(1,'#c8f0d8'); c.fillStyle=g; c.fillRect(0,0,W,H);
    c.fillStyle='#4a7a5a'; c.beginPath(); c.moveTo(250,300); c.lineTo(280,40); c.lineTo(520,40); c.lineTo(550,300); c.fill(); c.fillStyle='#3a6a4a'; c.fillRect(270,30,260,20);
    const wg=c.createLinearGradient(330,0,470,0); wg.addColorStop(0,'rgba(220,245,255,.7)'); wg.addColorStop(.5,'#fff'); wg.addColorStop(1,'rgba(220,245,255,.7)'); c.fillStyle=wg; c.fillRect(330,46,140,250);
    c.strokeStyle='rgba(160,210,240,.8)'; c.lineWidth=2; for(let i=0;i<10;i++){ const x=336+i*14,y=((t*160+i*37)%250)+46; c.beginPath(); c.moveTo(x,y); c.lineTo(x,y+30); c.stroke(); }
    c.fillStyle='rgba(255,255,255,.55)'; for(let i=0;i<8;i++){ c.beginPath(); c.arc(330+i*20,296+Math.sin(t*3+i)*4,18,0,TAU); c.fill(); }
    for(const [x,d] of [[0,1],[W,-1]]){ for(let k=0;k<4;k++){ c.save(); c.translate(x,60+k*60); c.scale(d,1); c.rotate(.3+k*.15+Math.sin(t+k)*.05); c.fillStyle=k%2?'#2a8a3a':'#3aa84a'; c.beginPath(); c.ellipse(80,0,90,24,0,0,TAU); c.fill(); c.strokeStyle='#1a6a2a'; c.lineWidth=2; c.beginPath(); c.moveTo(0,0); c.lineTo(160,0); c.stroke(); c.restore(); } }
    c.strokeStyle='#4a7a2a'; c.lineWidth=4; for(let i=0;i<6;i++){ const x=160+i*100; c.beginPath(); c.moveTo(x,0); c.quadraticCurveTo(x+Math.sin(t+i)*14,60,x+4,110+(i%3)*20); c.stroke(); }
    c.fillStyle='#8a5a2a'; c.beginPath(); c.arc(140,40+Math.sin(t*2)*6,12,0,TAU); c.fill(); c.fillStyle='#e8c090'; c.beginPath(); c.arc(140,44+Math.sin(t*2)*6,7,0,TAU); c.fill(); }
  else if(s===8){ /* 櫻花神社：鳥居、櫻花樹、石燈籠、花瓣 */ g.addColorStop(0,'#9ad0ff'); g.addColorStop(1,'#ffe8f0'); c.fillStyle=g; c.fillRect(0,0,W,H);
    c.fillStyle='#a8b8c8'; c.beginPath(); c.moveTo(0,240); c.lineTo(200,120); c.lineTo(400,230); c.lineTo(600,110); c.lineTo(W,220); c.lineTo(W,300); c.lineTo(0,300); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.moveTo(170,138); c.lineTo(200,120); c.lineTo(230,138); c.fill(); c.beginPath(); c.moveTo(570,128); c.lineTo(600,110); c.lineTo(630,128); c.fill();
    c.fillStyle='#d83a2a'; c.fillRect(300,90,16,210); c.fillRect(484,90,16,210); c.fillRect(270,76,260,16); c.fillRect(290,112,220,12); c.fillStyle='#2a2a2a'; c.fillRect(262,68,276,10);
    for(const [x,sc] of [[90,1],[710,1.1]]){ c.strokeStyle='#5a3a3a'; c.lineWidth=12*sc; c.beginPath(); c.moveTo(x,300); c.quadraticCurveTo(x+16,200,x-6,120); c.stroke(); for(let i=0;i<22;i++){ c.fillStyle=['#ffb0c8','#ff8ab0','#ffd8e4'][i%3]; c.globalAlpha=.88; c.beginPath(); c.arc(x-70*sc+((i*53)%140)*sc,90+((i*31)%70)*sc,16+i%4*4,0,TAU); c.fill(); } c.globalAlpha=1; }
    for(const x of [230,570]){ c.fillStyle='#9a9aa0'; c.fillRect(x-6,240,12,60); c.fillRect(x-16,232,32,8); c.fillRect(x-12,212,24,22); c.fillStyle='rgba(255,220,140,.8)'; c.fillRect(x-6,218,12,10); c.fillStyle='#8a8a90'; c.beginPath(); c.moveTo(x-20,212); c.lineTo(x,198); c.lineTo(x+20,212); c.fill(); }
    for(let i=0;i<24;i++){ const x=(i*131+t*40)%W,y=(i*47+t*36)%300; c.save(); c.translate(x,y); c.rotate(t*2+i); c.fillStyle='rgba(255,160,190,.9)'; c.beginPath(); c.ellipse(0,0,5,3,0,0,TAU); c.fill(); c.restore(); } }
  else { g.addColorStop(0,'#0a1a3a'); g.addColorStop(1,'#2a4a8a'); c.fillStyle=g; c.fillRect(0,0,W,H); for(let i=0;i<4;i++){ const x=100+i*200; c.fillStyle='#5a6a8a'; c.fillRect(x-3,0,6,60); c.fillStyle='#fff'; rr(c,x-30,52,60,20,4); c.fill(); c.save(); c.globalAlpha=.12; c.fillStyle='#fff6c8'; c.beginPath(); c.moveTo(x-20,70); c.lineTo(x+20,70); c.lineTo(x+120*Math.sin(i+1),GY); c.lineTo(x-120,GY); c.fill(); c.restore(); }
    crowd(c,170,t,['#ff5d4f','#4f9dff','#ffd23f','#fff']); crowd(c,232,t+1,['#4f9dff','#ff5d4f','#fff','#5fd068']); c.fillStyle='#14122b'; rr(c,300,90,200,56,10); c.fill(); c.fillStyle='#ffd23f'; c.font='900 20px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('🏆 CHAMPION 🏆',400,118); }
  /* 地面 */ const fg=c.createLinearGradient(0,300,0,H); fg.addColorStop(0,S.fl); fg.addColorStop(1,'#00000055'); c.fillStyle=S.fl; c.fillRect(0,GY-50,W,H-GY+50); c.fillStyle=fg; c.fillRect(0,GY-50,W,H-GY+50); c.fillStyle='rgba(0,0,0,.15)'; c.fillRect(0,GY-50,W,3);
  if(s===0){ c.strokeStyle='rgba(255,255,255,.55)'; c.lineWidth=3; for(let k=0;k<3;k++){ c.beginPath(); c.moveTo(0,GY-30+k*44); c.lineTo(W,GY-30+k*44); c.stroke(); } }
  if(s===3){ c.fillStyle='rgba(180,210,255,.35)'; c.beginPath(); c.ellipse(400,GY+20,260,30,0,0,TAU); c.fill(); }
  if(s===9){ c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=2; for(let x=0;x<W;x+=50){ c.beginPath(); c.moveTo(x,GY-48); c.lineTo(x-30,H); c.stroke(); } } }
/* 中間的泥巴池／岩漿／中線 */
function pit(c,s,t){ const m=ST[s].mud; if(m){ c.fillStyle=m===2?'#ff5a1a':'#6a4a2a'; c.beginPath(); c.ellipse(400,GY+6,70,20,0,0,TAU); c.fill(); c.fillStyle=m===2?'#ffd23f':'#5a3a1a'; for(let i=0;i<5;i++){ const u=(t*.8+i*.2)%1; c.globalAlpha=1-u; c.beginPath(); c.arc(360+i*20,GY+6-u*6,3+u*5,0,TAU); c.fill(); } c.globalAlpha=1; c.fillStyle='rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(384,GY,30,6,0,0,TAU); c.fill(); }
  else { c.fillStyle='#fff'; c.fillRect(397,GY-46,6,96); } }
/* 拔河的 Q 版人物：side 1＝左隊（面向右，往左拉）；lean 往後倒的角度 */
function puller(c,x,y,col,L,side,t,lean,o){ const C=window.ARCADE_CHAR; c.save(); c.translate(x,y); c.rotate(-side*lean); if(C) C.drawChar(c,0,-40,col,side>0?3:2,!!o.walk,t,1.75,L.char||'cap',L.deco||''); c.restore(); }
function create(env,opts){
  const {ctx:c,canvas}=env.canvas2d(W,H),net=opts.net,client=!!net&&!net.host,host=!client,two=!net&&opts.mode==='2p',pv=!!opts.preview,OP=opts.options||{},si=clamp(opts.stage|0,0,ST.length-1),S=ST[si];
  const BEST=+OP.best||3,NEED=Math.ceil(BEST/2),humans=net?net.count:pv?0:two?2:1,me=net?net.me:0;
  /* 分隊：左隊 0、右隊 1。連線時玩家輪流分，空位補電腦 */
  let per=net?clamp(Math.ceil((net.count+(net.bots||0))/2),1,4):clamp(+OP.team||3,1,4); if(net) per=Math.max(per,Math.ceil(net.count/2));
  const P=[]; // {team,human,name,look,col,ai}
  if(net){ for(let i=0;i<net.count;i++) P.push({team:i%2,hid:i,name:(net.names&&net.names[i])||'玩家'+(i+1),look:(net.looks&&net.looks[i])||{}}); }
  else if(two){ P.push({team:0,hid:0,name:'1P',look:opts.look||{}}); P.push({team:1,hid:1,name:'2P',look:{}}); }
  else if(!pv) P.push({team:0,hid:0,name:opts.name||'你',look:opts.look||{}});
  let bi=0; for(const tm of [0,1]){ while(P.filter(p=>p.team===tm).length<per){ P.push({team:tm,hid:-1,name:tm===0||net||two?BOTN[bi%8]:S.foe.slice(0,3)+(P.filter(p=>p.team===1).length+1),look:BOTLOOK(bi+si),ai:(net||two)?.62:tm===0?.5+S.ai*.36:S.ai}); bi++; } }
  const team=k=>P.filter(p=>p.team===k);
  team(0).forEach((p,k)=>{ p.k=k; p.col=p.look&&p.look.color&&p.look.color!=='auto'?p.look.color:RED[k%4]; }); team(1).forEach((p,k)=>{ p.k=k; p.col=p.look&&p.look.color&&p.look.color!=='auto'?p.look.color:BLUE[k%4]; });
  const TN=[net||two?'紅隊':'我們隊',net||two?'藍隊':S.foe],myTeam=two?-1:(P.find(p=>p.hid===me)||{team:0}).team;
  const BEAT=60/S.bpm,KF=.11;
  let t=0,ended=false,sendT=0,evq=[],fx=[],texts=[],shake=0,lastB=-1,shownB=-1;
  let G={ph:'intro',T:pv?.3:2.6,R:0,v:0,score:[0,0],round:1,clock:0,rt:0,lastWin:-1,pull:P.map(()=>0),fall:P.map(()=>0),got:P.map(()=>-1),gr:P.map(()=>''),combo:[0,0],sync:[0,0],cheer:-1,evN:0};
  const sfx=k=>{ if(pv) return; env.sfx(k); if(net&&host) evq.push(k); };
  const A=()=>env.audio&&env.audio();
  function note(f,d,type,v,at){ const a=A(); if(!a||pv) return; try{ const o=a.createOscillator(),g=a.createGain(),t0=at||a.currentTime; o.type=type||'sine'; o.frequency.setValueAtTime(f,t0); if(type==='kick') { o.type='sine'; o.frequency.exponentialRampToValueAtTime(40,t0+d); } g.gain.setValueAtTime(v||.1,t0); g.gain.exponentialRampToValueAtTime(.001,t0+d); o.connect(g); g.connect((env.out&&env.out())||a.destination); o.start(t0); o.stop(t0+d+.02); }catch(e){} }
  /* 鼓：咻（重拍）＝大鼓，嘿（半拍）＝小鼓 */
  function drum(on){ if(on){ note(120,.25,'kick',.35); note(880,.05,'square',.03); } else note(240,.08,'triangle',.07); }
  const phaseOf=clk=>{ const b=clk/BEAT,nb=Math.round(b); return {nb,err:Math.abs(b-nb)*BEAT}; };
  function pull(i){ if(G.ph!=='play'||G.fall[i]>0||G.clock<-BEAT*.5) return; const {nb,err}=phaseOf(G.clock),p=P[i],dir=p.team===0?-1:1,sz=team(p.team).length;
    if(G.got[i]===nb){ G.fall[i]=.7; G.gr[i]='滑倒'; texts.push({i,s:'亂按滑倒！',c:'#ff8a8a',l:.8}); G.combo[p.team]=0; sfx('skid'); G.evN++; return; } // 同一拍按兩次
    G.got[i]=nb; let pw,gr; if(err<.075){ pw=1; gr='讚！'; } else if(err<.15){ pw=.6; gr='好'; } else { pw=.12; gr='沒對到'; }
    if(pw>=1) G.combo[p.team]++; else if(pw<.5) G.combo[p.team]=0;
    const bonus=1+Math.min(.5,G.combo[p.team]*.03);
    G.v+=dir*pw*bonus*KF/sz; G.pull[i]=.28; G.gr[i]=gr; if(i<humans||p.hid>=0) texts.push({i,s:gr,c:pw>=1?'#ffd23f':pw>.5?'#7aff7a':'#ccc',l:.6});
    if(p.hid>=0&&!client) { if(pw>=1) note(660,.06,'square',.04); } }
  function aiStep(dt){ const {nb}=phaseOf(G.clock); P.forEach((p,i)=>{ if(p.hid>=0||G.fall[i]>0) return; if(p.plan==null&&(p.planB==null||p.planB<=nb)){ // 上一拍按完了，才排下一拍（每拍只按一次）
      const acc=p.ai,sd=.03+(1-acc)*.16; p.planB=nb+1; p.plan=(nb+1)*BEAT+(Math.random()+Math.random()+Math.random()-1.5)*sd*1.4+(Math.random()<.06*(1-acc)?BEAT*.5:0); if(Math.random()<.08*(1-acc)) p.plan=null; }
      if(p.plan!=null&&G.clock>=p.plan){ p.plan=null; pull(i); } }); }
  function stepHost(dt){
    if(G.ph==='intro'||G.ph==='ready'){ G.T-=dt; if(G.T<=0){ G.ph='play'; G.clock=-BEAT*2; G.rt=0; G.R=0; G.v=0; G.got=P.map(()=>-1); G.combo=[0,0]; sfx('go'); } return; }
    if(G.ph==='play'){ G.clock+=dt; G.rt+=dt; if(G.clock>0) aiStep(dt);
      for(let i=0;i<P.length;i++){ if(G.pull[i]>0) G.pull[i]-=dt; if(G.fall[i]>0) G.fall[i]-=dt; }
      G.v*=Math.exp(-dt*2.2); G.R+=G.v*dt*6; G.R=clamp(G.R,-1.15,1.15);
      if(Math.abs(G.R)>=1||G.rt>=40){ const w=G.R<0||G.R===0&&Math.random()<.5?0:1; G.lastWin=w; G.score[w]++; G.ph='won'; G.T=2.8; G.evN++; sfx(w===myTeam||two?'win':'lose'); sfx('boom'); } return; }
    if(G.ph==='won'){ G.T-=dt; G.R+=((G.lastWin===0?-1.35:1.35)-G.R)*Math.min(1,dt*1.6);
      if(G.T<=0){ if(G.score[0]>=NEED||G.score[1]>=NEED){ G.ph='end'; G.T=.6; } else { G.round++; G.ph='ready'; G.T=2; G.R=0; G.v=0; } } return; }
    if(G.ph==='end'){ G.T-=dt; if(G.T<=0&&!ended){ ended=true; if(net) net.send({st:G}); finish(); } } }
  function finish(){ const w=G.score[0]>G.score[1]?0:1,iWin=w===myTeam; env.sfx(two||iWin?'win':'lose'); if(!net&&!two&&!pv&&iWin) setW(si);
    env.end({title:TN[w]+' 獲勝！',big:two?(w===0?'1P 紅隊贏了':'2P 藍隊贏了'):iWin?'拔河勝利！':'差一點點！',text:'比數 '+G.score[0]+' : '+G.score[1]+(!net&&!two&&iWin&&si<ST.length-1?'　下一關「'+ST[si+1].name+'」解鎖了':''),
      html:'<table class="ls"><tr><th>'+TN[0]+'</th><th>'+TN[1]+'</th></tr><tr><td>'+team(0).map(p=>p.name).join('、')+'</td><td>'+team(1).map(p=>p.name).join('、')+'</td></tr></table>',score:null}); }
  if(net){ if(client) net.onmsg=m=>{ if(m.st){ G=m.st; if(G.ph==='end'&&!ended&&G.T<=0){ ended=true; finish(); } } if(m.ev) for(const k of m.ev) env.sfx(k); if(m.tx) for(const x of m.tx) texts.push(x); };
    else net.onmsg=(m,from)=>{ if(m.p){ const i=P.findIndex(p=>p.hid===from); if(i>=0) pull(i); } }; }
  /* 觸控：點畫面任何地方也算拉 */
  const pd=e=>{ if(pv||two) return; act(me); };
  canvas.addEventListener('pointerdown',pd);
  function act(h){ if(client){ if(G.ph!=='play') return; net.send({p:1}); const {nb,err}=phaseOf(G.clock); texts.push({i:P.findIndex(p=>p.hid===me),s:err<.075?'讚！':err<.15?'好':'沒對到',c:err<.075?'#ffd23f':err<.15?'#7aff7a':'#ccc',l:.6}); note(660,.05,'square',.03); return; } const i=P.findIndex(p=>p.hid===h); if(i>=0) pull(i); }
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt; if(shake>0) shake=Math.max(0,shake-dt*30);
    if(!pv){ if(two){ if(env.hit('KeyF')||env.hit('KeyA')||env.hit('Space')) act(0); if(env.hit('KeyJ')||env.hit('KeyL')||env.hit('Enter')) act(1); } else if(env.hit('Space')||env.hit('KeyJ')||env.hit('KeyF')||env.hit('Enter')) act(me); }
    if(client&&G.ph==='play') G.clock+=dt;
    /* 鼓聲（每台自己打，對齊 clock） */ if(G.ph==='play'){ const hb=Math.floor((G.clock+.0001)/(BEAT/2)); if(hb!==lastB){ lastB=hb; if(G.clock>-BEAT*2.2) drum(hb%2===0); } }
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; if(f.l<=0){ fx.splice(i,1); continue; } f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=f.g*dt; }
    for(let i=texts.length-1;i>=0;i--){ texts[i].l-=dt; if(texts[i].l<=0) texts.splice(i,1); }
    if(G.ph==='play'&&Math.abs(G.v)>.03&&Math.random()<Math.abs(G.v)*6){ const side=G.v<0?1:0,list=team(side); if(list.length){ const p=list[Math.floor(Math.random()*list.length)],[x]=posOf(P.indexOf(p)); fx.push({x,y:GY-2,vx:(side?1:-1)*(20+Math.random()*40),vy:-40-Math.random()*40,g:200,l:.5,c:'rgba(180,150,110,.7)',s:4+Math.random()*4}); } }
    if(client) return; stepHost(dt);
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/15; net.send({st:G}); if(evq.length){ net.send({ev:evq}); evq=[]; } } } }
  /* 位置：左隊站在中線左邊、右隊站右邊，跟著繩子 R 移動 */
  const OFF=170;
  function posOf(i){ const p=P[i],sz=team(p.team).length,gap=Math.min(76,300/sz),ox=G.R*OFF; let x=p.team===0?400-84-p.k*gap:400+84+p.k*gap; x+=ox; let y=GY; const lost=G.ph==='won'&&p.team!==G.lastWin;
    if(lost&&ST[si].mud&&Math.abs(x-400)<70) y+=10; return [x,y]; }
  function draw(){ c.save(); if(shake>0) c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake); bg(c,si,t); pit(c,si,t);
    /* 勝負線 */ for(const d of [-1,1]){ c.fillStyle=d<0?'#ff5d4f':'#4f9dff'; c.fillRect(400+d*OFF-2,GY-44,4,88); c.beginPath(); c.moveTo(400+d*OFF,GY-44); c.lineTo(400+d*OFF+d*20,GY-36); c.lineTo(400+d*OFF,GY-28); c.fill(); }
    const ropeY=GY-30,ox=G.R*OFF,lx=Math.min(...P.map((p,i)=>posOf(i)[0]))-40,rx=Math.max(...P.map((p,i)=>posOf(i)[0]))+40;
    /* 人物（先畫身體，繩子在手的位置） */
    const order=P.map((p,i)=>i).sort((a,b)=>P[a].k-P[b].k).reverse();
    for(const i of order){ const p=P[i],[x,y]=posOf(i),side=p.team===0?1:-1,won=G.ph==='won'||G.ph==='end',lost=won&&p.team!==G.lastWin,fall=G.fall[i]>0;
      let lean=.22+(G.pull[i]>0?.16*Math.sin(G.pull[i]/.28*Math.PI):0); if(won&&!lost) lean=-.05; if(lost) lean=-.5; if(fall) lean=.75;
      c.fillStyle='rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x,y+2,22,6,0,0,TAU); c.fill();
      if(won&&!lost){ c.save(); c.translate(0,-Math.abs(Math.sin(t*8+i))*10); puller(c,x,y,p.col,p.look,side,t,lean,{}); c.restore(); }
      else puller(c,x,y,p.col,p.look,side,t,lean,{walk:G.ph==='play'&&Math.abs(G.v)>.05});
      if(lost&&ST[si].mud&&Math.abs(x-400)<90){ c.fillStyle=ST[si].mud===2?'rgba(40,20,20,.7)':'rgba(90,60,30,.75)'; c.beginPath(); c.ellipse(x,y-14,20,16,0,0,TAU); c.fill(); }
      const nm=p.name.slice(0,5),mineP=two?p.hid>=0:p.hid===me&&!pv; c.font='900 11px '+TC; c.textAlign='center'; c.textBaseline='middle'; const w2=c.measureText(nm).width+12; c.fillStyle=mineP?'#ffd23f':'rgba(11,10,28,.72)'; rr(c,x-w2/2,y+8,w2,16,8); c.fill(); c.fillStyle=mineP?'#14122b':'#fff'; c.fillText(nm,x,y+16);
      if(mineP&&G.ph!=='won'){ c.fillStyle='#ffd23f'; c.beginPath(); const by=y-138+Math.sin(t*6)*3; c.moveTo(x,by+10); c.lineTo(x-8,by); c.lineTo(x+8,by); c.fill(); } }
    /* 繩子 */ c.strokeStyle='#8a6a3a'; c.lineWidth=7; c.lineCap='round'; c.beginPath(); c.moveTo(lx,ropeY+6); const sag=4+Math.sin(t*20)*Math.min(2,Math.abs(G.v)*20); c.quadraticCurveTo(400+ox,ropeY+sag,rx,ropeY+6); c.stroke(); c.strokeStyle='#c8a060'; c.lineWidth=3; c.setLineDash([6,6]); c.beginPath(); c.moveTo(lx,ropeY+5); c.quadraticCurveTo(400+ox,ropeY+sag-1,rx,ropeY+5); c.stroke(); c.setLineDash([]);
    for(let i=0;i<P.length;i++){ const [x]=posOf(i); c.fillStyle='#ffdcb8'; c.strokeStyle='#3b2630'; c.lineWidth=1.5; c.beginPath(); c.arc(x+(P[i].team===0?18:-18),ropeY+5,6,0,TAU); c.fill(); c.stroke(); }
    /* 中間紅布條 */ const mx=400+ox; c.fillStyle='#ff3b5a'; c.beginPath(); c.moveTo(mx-6,ropeY+4); c.lineTo(mx+6,ropeY+4); c.lineTo(mx+10+Math.sin(t*8)*3,ropeY+38); c.lineTo(mx-10+Math.sin(t*8+1)*3,ropeY+38); c.fill(); c.fillStyle='#ffd23f'; c.fillRect(mx-6,ropeY+2,12,5);
    for(const f of fx){ c.globalAlpha=Math.min(1,f.l*2); c.fillStyle=f.c; c.beginPath(); c.arc(f.x,f.y,f.s,0,TAU); c.fill(); c.globalAlpha=1; }
    for(const x of texts){ if(x.i<0) continue; const [px,py]=posOf(x.i),u=1-x.l/.8; c.globalAlpha=Math.min(1,x.l*3); c.font='900 15px '+TC; c.lineWidth=4; c.strokeStyle='#14122b'; c.textAlign='center'; c.strokeText(x.s,px,py-120-u*20); c.fillStyle=x.c; c.fillText(x.s,px,py-120-u*20); c.globalAlpha=1; }
    c.restore();
    /* 上方：比分 */ c.textAlign='center'; c.textBaseline='middle';
    c.fillStyle='rgba(11,10,28,.78)'; rr(c,W/2-170,8,340,40,14); c.fill(); c.fillStyle='#ff5d4f'; c.font='900 15px '+TC; c.textAlign='right'; c.fillText(TN[0],W/2-40,28); c.fillStyle='#4f9dff'; c.textAlign='left'; c.fillText(TN[1],W/2+40,28);
    c.fillStyle='#fff'; c.textAlign='center'; c.font='900 22px '+TC; c.fillText(G.score[0]+' : '+G.score[1],W/2,28);
    for(let k=0;k<NEED;k++){ c.fillStyle=k<G.score[0]?'#ffd23f':'rgba(255,255,255,.2)'; c.beginPath(); c.arc(W/2-150+k*14,28,5,0,TAU); c.fill(); c.fillStyle=k<G.score[1]?'#ffd23f':'rgba(255,255,255,.2)'; c.beginPath(); c.arc(W/2+150-k*14,28,5,0,TAU); c.fill(); }
    /* 節奏圈 */ if(G.ph==='play'){ const b=G.clock/BEAT,fr=b-Math.floor(b),cx=W/2,cy=96; const near=Math.min(fr,1-fr)*BEAT,on=near<.075;
      c.fillStyle='rgba(11,10,28,.6)'; c.beginPath(); c.arc(cx,cy,36,0,TAU); c.fill(); c.strokeStyle=on?'#ffd23f':'rgba(255,255,255,.5)'; c.lineWidth=4; c.beginPath(); c.arc(cx,cy,24,0,TAU); c.stroke();
      const r=24+(1-fr)*40; c.strokeStyle='rgba(255,90,154,'+(.3+.7*fr)+')'; c.lineWidth=3; c.beginPath(); c.arc(cx,cy,r,0,TAU); c.stroke();
      c.fillStyle=on?'#ffd23f':'#fff'; c.font='900 '+(on?22:16)+'px '+TC; c.fillText(G.clock<0?String(Math.ceil(-G.clock/BEAT)):fr>.25&&fr<.75?'嘿～':'咻！',cx,cy+1);
      const tl=Math.max(0,40-G.rt); c.font='700 12px '+TC; c.fillStyle='rgba(255,255,255,.85)'; c.fillText('剩 '+Math.ceil(tl)+' 秒',cx,cy+52);
      if(t<8&&G.round===1){ c.font='700 13px '+TC; c.lineWidth=4; c.strokeStyle='#14122b'; const s=env.touch?'圈圈縮到中間（咻！）時點一下':(two?'1P 按 F、2P 按 J，在「咻！」的時候按':'在「咻！」的時候按空白鍵'); c.strokeText(s,cx,cy+72); c.fillStyle='#fff'; c.fillText(s,cx,cy+72); } }
    if(G.ph==='intro'||G.ph==='ready'){ const s=G.ph==='intro'?ST[si].name+'　'+TN[0]+' vs '+TN[1]:'第 '+G.round+' 局'; c.font='900 30px '+TC; c.lineWidth=7; c.strokeStyle='#14122b'; c.strokeText(s,W/2,150); c.fillStyle='#fff'; c.fillText(s,W/2,150); c.font='900 18px '+TC; c.strokeText('預備～',W/2,190); c.fillStyle='#ffd23f'; c.fillText('預備～',W/2,190); }
    if(G.ph==='won'){ const s=TN[G.lastWin]+' 拿下這一局！'; c.font='900 32px '+TC; c.lineWidth=7; c.strokeStyle='#14122b'; c.strokeText(s,W/2,150); c.fillStyle=G.lastWin===0?'#ff8a7a':'#8ac0ff'; c.fillText(s,W/2,150); }
    /* 力量條 */ const gx=W/2-150,gw=300,gy=H-22; c.fillStyle='rgba(11,10,28,.6)'; rr(c,gx-6,gy-8,gw+12,16,8); c.fill(); const u=clamp(G.R,-1,1); c.fillStyle='#ff5d4f'; c.fillRect(gx,gy-4,gw/2*(1-u),8); c.fillStyle='#4f9dff'; c.fillRect(gx+gw/2*(1-u),gy-4,gw-gw/2*(1-u),8); c.fillStyle='#fff'; c.fillRect(gx+gw/2*(1-u)-2,gy-7,4,14); }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',pd); },_dbg:{get G(){return G;},P,pull,BEAT}};
}
function stageShow(ctx,w,h,si,t){ ctx.save(); ctx.scale(w/W,h/H); bg(ctx,si,t); pit(ctx,si,t); const R=Math.sin(t*1.3)*.4,ropeY=GY-30;
  const xs=[]; for(let k=0;k<3;k++){ xs.push([400-80-k*70+R*170,0,k]); xs.push([400+80+k*70+R*170,1,k]); }
  for(const [x,tm,k] of xs) puller(ctx,x,GY,tm?BLUE[k]:RED[k],BOTLOOK(k+tm*3),tm?-1:1,t+k,.24+.1*Math.max(0,Math.sin(t*6+k)),{});
  ctx.strokeStyle='#8a6a3a'; ctx.lineWidth=7; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(140+R*170,ropeY+6); ctx.lineTo(660+R*170,ropeY+6); ctx.stroke(); ctx.fillStyle='#ff3b5a'; ctx.beginPath(); ctx.moveTo(394+R*170,ropeY+4); ctx.lineTo(406+R*170,ropeY+4); ctx.lineTo(410+R*170,ropeY+38); ctx.lineTo(390+R*170,ropeY+38); ctx.fill();
  ctx.textAlign='center'; ctx.font='900 40px '+TC; ctx.lineWidth=8; ctx.strokeStyle='#14122b'; const s=Math.sin(t*5)>0?'嘿～':'咻！'; ctx.strokeText(s,400,120); ctx.fillStyle='#ffd23f'; ctx.fillText(s,400,120); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).tug={
  name:'拔河拔起來',tag:'TUG OF WAR',color:'#ff8a3d',online:true,maxPlayers:8,minPlayers:2,bots:true,ownMusic:true,
  desc:'全隊一起喊「嘿～咻！」，在鼓點上按鍵才拉得動！按得越準力氣越大，亂按會滑倒。把對手拉過線就拿下一局，10 個場地、對手越來越強。',
  goal:'在「咻！」（圈圈縮到中間）的時候按鍵拉繩子，把對手拉過自己這邊的線。',
  stages:ST.map(s=>s.name),stageLabel:'選擇場地',stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,0,t),
  stageLocked:i=>i>0&&!getW(i-1),
  stageGoal:i=>'「'+ST[i].name+'」對手：'+ST[i].foe+'，節奏 '+ST[i].bpm+' 拍／分鐘。',
  stageBest:i=>getW(i)?'🏆 贏過':'',
  hubBest:()=>{ let n=0; for(let i=0;i<ST.length;i++) if(getW(i)) n++; return n?'贏了 <b>'+n+' / '+ST.length+'</b> 場':'尚無紀錄'; },
  modes:[{id:'1p',label:'單人（帶電腦隊友）'},{id:'2p',label:'雙人對戰',kb:true}],
  options:[{key:'team',label:'每隊人數',def:'3',opts:[{id:'1',label:'1 人'},{id:'2',label:'2 人'},{id:'3',label:'3 人'},{id:'4',label:'4 人'}]},{key:'best',label:'局數',def:'3',opts:[{id:'1',label:'一局決勝'},{id:'3',label:'三戰兩勝'},{id:'5',label:'五戰三勝'}]}],
  help:[['空白鍵','在「咻！」的時候按，拉繩子'],['雙人','1P 按 F、2P 按 J'],['注意','同一拍按兩次會滑倒']],
  touchHelp:[['拉！','在「咻！」的時候按，拉繩子'],['雙人','1P 按左邊、2P 按右邊']],
  touch:{left:[{l:'拉！',c:'KeyF',big:true}],right:[{l:'拉！',c:'KeyJ',big:true,act:true}]},
  looks:[{key:'char',label:'人物',opts:[{id:'cap',label:'帽子'},{id:'cat',label:'貓耳'},{id:'bunny',label:'兔耳'},{id:'crown',label:'皇冠'},{id:'chef',label:'廚師'},{id:'pirate',label:'海盜'},{id:'ninja',label:'忍者'},{id:'bow',label:'蝴蝶結'}]},{key:'color',label:'人物顏色',type:'color',opts:['auto','#ff5d4f','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d','#3ddbd9','#ff7eb6']}],
  preview:(ctx,w,h,L,t)=>{ ctx.save(); ctx.scale(w/W,h/H); bg(ctx,0,t); ctx.restore(); const C=window.ARCADE_CHAR; if(C) C.drawChar(ctx,w/2,h*.6,!L||!L.color||L.color==='auto'?RED[0]:L.color,3,false,t,2.6,(L&&L.char)||'cap',(L&&L.deco)||''); },
  best:{label:'勝場',fmt:v=>v,lower:false},create};
})();
