// 炸彈傳傳傳：大家圍一圈傳炸彈，拿到的人要照順序按出箭頭才傳得走；引信長度沒人知道，炸到扣一條命，活到最後的贏。
// 單人配電腦、同機 2 人、連線最多 8 人（房主運算）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const clamp=(v,a,b)=>v<a?a:v>b?b:v,TAU=Math.PI*2;
const SCENES=[{name:'學校教室',bg:['#f6e6c8','#d8b888'],fl:'#a87a4a',acc:'#2f6f4a'},{name:'學校操場',bg:['#7ec8ff','#d8f0ff'],fl:'#c84a3a',acc:'#2a9d5c'},{name:'海邊營火',bg:['#ffb07a','#7ac8e8'],fl:'#e8d098',acc:'#3d8bff'},{name:'太空站',bg:['#060a24','#1a2858'],fl:'#3a4258',acc:'#3ddbd9'},
  {name:'客廳',bg:['#f4e2c4','#e8cfa4'],fl:'#b07a48',acc:'#c8503a'},{name:'臥房',bg:['#d8e8ff','#c4d8f4'],fl:'#e8d8c8',acc:'#ff8ab0'},{name:'籃球場',bg:['#8ad0ff','#e0f4ff'],fl:'#3a6ab8',acc:'#ff8a2a'},{name:'公園',bg:['#8ad8ff','#e8f8ff'],fl:'#6ab84a',acc:'#2a8a3a'},{name:'夜店',bg:['#0a0618','#2a0a3a'],fl:'#1a1024',acc:'#ff3ad8'},{name:'游泳池',bg:['#7ed0ff','#d8f4ff'],fl:'#e8e4dc',acc:'#2aa8e8'}];
const BODY=['#ff5d4f','#3d8bff','#5fd068','#ffd23f','#b98cff','#ff9d3d','#3ddbd9','#ff7eb6'],HAIR=['#2a1a10','#6a3a1a','#111','#c8903a','#7a2a1a','#3a2a4a','#1a1410','#a85a2a'],BOTN=['小胖','阿美','大雄','小綠','阿花','鐵蛋','小豆'];
const ARW=['ArrowLeft','ArrowUp','ArrowDown','ArrowRight'],ARK=[['ArrowLeft','KeyA'],['ArrowUp','KeyW'],['ArrowDown','KeyS'],['ArrowRight','KeyD']],GL=['←','↑','↓','→'];
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
// Q 版人物：大頭、亮眼睛、腮紅；sad＝炸黑了
function guy(c,x,y,s,col,hair,t,o){ o=o||{}; c.save(); c.translate(x,y+(o.hop?-Math.abs(Math.sin(t*9))*6*s:0)); c.scale(s,s); const INK='#2a1a26',sk=o.soot?'#4a4044':'#ffdcb8';
  c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0,2,18,5,0,0,TAU); c.fill();
  c.fillStyle=INK; c.beginPath(); c.ellipse(-7,-2,6,4,0,0,TAU); c.ellipse(7,-2,6,4,0,0,TAU); c.fill(); c.lineWidth=2; c.strokeStyle=INK;
  c.fillStyle=o.soot?'#3a3438':col; rr(c,-12,-24,24,22,8); c.fill(); c.stroke(); const sw=o.up?-1:Math.sin(t*5)*.2; for(const d of [-1,1]){ c.fillStyle=sk; c.beginPath(); c.arc(d*(15+(o.up?1:0)),-16+(o.up?-13:sw*3),4.6,0,TAU); c.fill(); c.stroke(); }
  c.fillStyle=sk; c.beginPath(); c.arc(0,-40,18,0,TAU); c.fill(); c.stroke(); c.fillStyle=o.soot?'#1a1416':hair; c.beginPath(); c.arc(0,-43,18,Math.PI*1.02,Math.PI*1.98); c.quadraticCurveTo(6,-46,-4,-44); c.quadraticCurveTo(-12,-44,-18,-41); c.fill(); c.stroke();
  const bl=Math.sin(t*1.7+x)>.97; c.fillStyle=INK; if(o.soot){ c.lineWidth=2; for(const d of [-1,1]){ c.beginPath(); c.moveTo(d*7-3,-41); c.lineTo(d*7+3,-36); c.moveTo(d*7+3,-41); c.lineTo(d*7-3,-36); c.stroke(); } } else for(const d of [-1,1]){ if(bl) c.fillRect(d*7-3,-38,6,1.6); else { c.beginPath(); c.arc(d*7,-38,3.4,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(d*7-1,-39.4,1.2,0,TAU); c.fill(); c.fillStyle=INK; } }
  c.fillStyle='rgba(255,110,130,.5)'; c.beginPath(); c.ellipse(-12,-32,3.4,2,0,0,TAU); c.ellipse(12,-32,3.4,2,0,0,TAU); c.fill(); c.strokeStyle=INK; c.lineWidth=1.6; c.beginPath(); if(o.scared){ c.ellipse(0,-30,3,4,0,0,TAU); c.fillStyle='#7a2a2a'; c.fill(); } else { c.arc(0,-33,3.4,.3,Math.PI-.3); } c.stroke();
  if(o.scared){ c.fillStyle='#7ac8ff'; c.beginPath(); c.moveTo(19,-54); c.quadraticCurveTo(25,-45,19,-43); c.quadraticCurveTo(13,-45,19,-54); c.fill(); }
  c.restore(); }
function bombArt(c,x,y,r,t,hot){ c.save(); c.translate(x,y); const sh=hot*Math.sin(t*50)*2.4; c.translate(sh,0); const g=c.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r); g.addColorStop(0,'#6a6a78'); g.addColorStop(.6,'#23232c'); g.addColorStop(1,'#0c0c12'); c.fillStyle=g; c.beginPath(); c.arc(0,0,r,0,TAU); c.fill(); if(hot>.45){ c.fillStyle='rgba(255,50,30,'+(hot*.45*(.6+.4*Math.sin(t*22)))+')'; c.beginPath(); c.arc(0,0,r,0,TAU); c.fill(); }
  c.fillStyle='#55555f'; c.fillRect(-r*.28,-r*1.16,r*.56,r*.3); c.strokeStyle='#c8a060'; c.lineWidth=r*.14; c.lineCap='round'; c.beginPath(); c.moveTo(0,-r*1.14); c.quadraticCurveTo(r*.5,-r*1.6,r*.72,-r*1.26); c.stroke(); const fx=r*.72,fy=-r*1.26,f=1+Math.sin(t*40)*.3; c.fillStyle='#ffd23f'; c.beginPath(); c.arc(fx,fy,r*.2*f,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(fx,fy,r*.09*f,0,TAU); c.fill(); for(let i=0;i<5;i++){ const a=t*30+i*1.3; c.fillStyle='#ff9d3d'; c.fillRect(fx+Math.cos(a)*r*.34,fy+Math.sin(a)*r*.34,2,2); } c.restore(); }
function cloud(c,x,y,s){ c.fillStyle='rgba(255,255,255,.9)'; c.beginPath(); c.arc(x,y,16*s,0,TAU); c.arc(x+18*s,y-8*s,20*s,0,TAU); c.arc(x+40*s,y,15*s,0,TAU); c.fill(); }
function tree(c,x,y,s){ c.fillStyle='#7a5030'; c.fillRect(x-5*s,y-30*s,10*s,32*s); c.fillStyle='#3a9a3a'; c.beginPath(); c.arc(x,y-46*s,26*s,0,TAU); c.arc(x-18*s,y-34*s,18*s,0,TAU); c.arc(x+18*s,y-34*s,18*s,0,TAU); c.fill(); c.fillStyle='rgba(255,255,255,.15)'; c.beginPath(); c.arc(x-8*s,y-56*s,10*s,0,TAU); c.fill(); }
function background(c,sc,t){ const S=SCENES[sc],g=c.createLinearGradient(0,0,0,H*.6); g.addColorStop(0,S.bg[0]); g.addColorStop(1,S.bg[1]); c.fillStyle=g; c.fillRect(0,0,W,H);
  if(sc===0){ c.fillStyle='#2f6f4a'; rr(c,180,26,440,120,6); c.fill(); c.strokeStyle='#a87a4a'; c.lineWidth=7; c.stroke(); c.fillStyle='rgba(255,255,255,.75)'; c.font='900 26px '+TC; c.textAlign='center'; c.fillText('傳炸彈　不准偷懶！',400,92); for(const x of [60,690]){ c.fillStyle='#bfe4ff'; c.fillRect(x,40,70,90); c.strokeStyle='#fff'; c.strokeRect(x,40,70,90); } }
  else if(sc===1){ cloud(c,90,50,1); cloud(c,560,36,1.2); // 學校操場：遠方校舍、司令台、國旗
    c.fillStyle='#f0e0c0'; c.fillRect(150,70,500,120); c.fillStyle='#d84a3a'; c.fillRect(150,62,500,10); for(let r=0;r<3;r++) for(let k=0;k<12;k++){ c.fillStyle='#8ac8f0'; c.fillRect(162+k*40,84+r*34,26,20); c.fillStyle='#fff'; c.fillRect(174+k*40,84+r*34,2,20); }
    c.fillStyle='#fff'; c.beginPath(); c.arc(400,46,16,0,TAU); c.fill(); c.strokeStyle='#333'; c.lineWidth=2; c.stroke(); c.beginPath(); c.moveTo(400,46); c.lineTo(400,36); c.moveTo(400,46); c.lineTo(408,48); c.stroke();
    c.fillStyle='#bbb'; c.fillRect(706,30,4,170); const wv=Math.sin(t*3)*3; c.fillStyle='#2a9d5c'; c.beginPath(); c.moveTo(710,34); c.lineTo(752,36+wv); c.lineTo(752,62+wv); c.lineTo(710,60); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(731,48+wv*.5,7,0,TAU); c.fill(); /* 校旗 */
    c.fillStyle='#3a9a3a'; c.fillRect(0,180,W,26); for(let i=0;i<W;i+=14){ c.fillStyle='#2a7a2a'; c.fillRect(i,180,2,26); } c.fillStyle='#ddd'; for(let i=0;i<W;i+=40) c.fillRect(i,172,3,30); c.fillRect(0,174,W,2); }
  else if(sc===2){ c.fillStyle='#ffe9a8'; c.beginPath(); c.arc(610,90,46,0,TAU); c.fill(); c.fillStyle='#2a86c8'; c.fillRect(0,140,W,70); c.fillStyle='rgba(255,255,255,.5)'; for(let i=0;i<14;i++) c.fillRect((i*71+t*14)%W,150+(i%3)*18,34,2); }
  else if(sc===3){ c.fillStyle='#fff'; for(let i=0;i<70;i++) c.fillRect((i*97)%W,(i*53)%210,1.5,1.5); c.fillStyle='#8ab8e8'; c.beginPath(); c.arc(130,90,52,0,TAU); c.fill(); c.fillStyle='#5a84c0'; c.beginPath(); c.arc(112,76,14,0,TAU); c.arc(150,112,10,0,TAU); c.fill(); }
  else if(sc===4){ // 客廳：窗戶、電視櫃、沙發、掛畫、立燈
    c.fillStyle='#d8b888'; for(let x=0;x<W;x+=60) c.fillRect(x,0,2,205); c.fillStyle='#fff'; c.fillRect(40,30,120,100); c.fillStyle='#9ad8ff'; c.fillRect(48,38,48,84); c.fillRect(104,38,48,84); c.fillStyle='#e86a5a'; c.fillRect(30,24,24,120); c.fillRect(146,24,24,120);
    c.fillStyle='#6a4a2a'; c.fillRect(300,150,200,50); c.fillStyle='#4a3020'; c.fillRect(310,160,80,30); c.fillRect(410,160,80,30); c.fillStyle='#1a1a22'; rr(c,310,44,180,104,6); c.fill(); const tv=c.createLinearGradient(318,52,482,140); tv.addColorStop(0,'#3a8aff'); tv.addColorStop(1,'#ff6ab0'); c.fillStyle=tv; c.fillRect(318,52,164,88); c.fillStyle='rgba(255,255,255,.85)'; c.font='900 16px '+TC; c.textAlign='center'; c.fillText('週末綜藝',400,102);
    c.fillStyle='#c8503a'; rr(c,560,120,200,70,16); c.fill(); c.fillStyle='#a83a2a'; rr(c,560,96,200,50,16); c.fill(); c.fillStyle='#ffd23f'; rr(c,580,110,36,30,8); c.fill(); c.fillStyle='#8ad8ff'; rr(c,700,110,36,30,8); c.fill();
    c.fillStyle='#8a5a2a'; c.fillRect(600,30,90,60); c.fillStyle='#ffe0a0'; c.fillRect(606,36,78,48); c.fillStyle='#4aa84a'; c.beginPath(); c.moveTo(610,80); c.lineTo(640,50); c.lineTo(680,80); c.fill();
    c.fillStyle='#888'; c.fillRect(226,60,4,140); c.fillStyle='#ffe8a0'; c.beginPath(); c.moveTo(210,60); c.lineTo(246,60); c.lineTo(238,36); c.lineTo(218,36); c.fill(); }
  else if(sc===5){ // 臥房：床、窗簾、書桌檯燈、海報、衣櫃
    c.fillStyle='rgba(255,255,255,.5)'; for(let i=0;i<20;i++){ c.beginPath(); c.arc((i*83)%W,(i*47)%190+8,3,0,TAU); c.fill(); }
    c.fillStyle='#fff'; c.fillRect(330,24,140,110); c.fillStyle='#ffd8a0'; c.fillRect(338,32,124,94); c.fillStyle='#fff6c8'; c.beginPath(); c.arc(430,60,14,0,TAU); c.fill(); c.fillStyle='#ff8ab0'; c.beginPath(); c.moveTo(320,18); c.quadraticCurveTo(350,80,330,150); c.lineTo(310,150); c.lineTo(310,18); c.fill(); c.beginPath(); c.moveTo(480,18); c.quadraticCurveTo(450,80,470,150); c.lineTo(490,150); c.lineTo(490,18); c.fill();
    c.fillStyle='#8a5a3a'; c.fillRect(20,96,200,22); c.fillStyle='#fff'; rr(c,30,120,200,70,10); c.fill(); c.fillStyle='#7ab8ff'; rr(c,70,128,170,64,10); c.fill(); c.fillStyle='#fff'; rr(c,36,110,46,28,10); c.fill(); c.fillStyle='#ffe0f0'; c.fillRect(70,150,170,6);
    c.fillStyle='#c89a6a'; c.fillRect(560,130,150,12); c.fillRect(570,142,8,60); c.fillRect(692,142,8,60); c.fillStyle='#ffd23f'; c.beginPath(); c.moveTo(590,130); c.lineTo(610,104); c.lineTo(626,104); c.lineTo(640,130); c.fill(); c.fillStyle='#555'; c.fillRect(612,104,4,0); c.fillStyle='#5a8aff'; c.fillRect(650,110,40,20);
    c.fillStyle='#ffb0d0'; c.fillRect(570,30,70,60); c.fillStyle='#fff'; c.font='900 14px '+TC; c.textAlign='center'; c.fillText('偶像',605,66); c.fillStyle='#e8d0b0'; c.fillRect(730,20,70,185); c.fillStyle='#c8a880'; c.fillRect(764,20,2,185); }
  else if(sc===6){ cloud(c,120,40,1); cloud(c,600,56,.9); // 籃球場：鐵絲網、籃框
    c.strokeStyle='rgba(80,90,110,.55)'; c.lineWidth=1.5; for(let x=-200;x<W;x+=18){ c.beginPath(); c.moveTo(x,40); c.lineTo(x+170,205); c.moveTo(x+170,40); c.lineTo(x,205); c.stroke(); } c.fillStyle='#5a6070'; for(let x=0;x<=W;x+=160) c.fillRect(x-3,30,6,176); c.fillRect(0,36,W,5);
    c.fillStyle='#666'; c.fillRect(396,90,8,116); c.fillStyle='#fff'; c.fillRect(350,40,100,64); c.strokeStyle='#e23b3b'; c.lineWidth=3; c.strokeRect(350,40,100,64); c.strokeRect(384,66,32,24); c.strokeStyle='#ff6a1a'; c.lineWidth=4; c.beginPath(); c.ellipse(400,100,20,5,0,0,TAU); c.stroke(); c.strokeStyle='rgba(255,255,255,.9)'; c.lineWidth=1.2; for(let i=-2;i<=2;i++){ c.beginPath(); c.moveTo(400+i*9,102); c.lineTo(400+i*5,124); c.stroke(); } }
  else if(sc===7){ cloud(c,80,46,1); cloud(c,470,30,1.1); // 公園：樹、溜滑梯、長椅
    c.fillStyle='#8ad85a'; c.beginPath(); c.ellipse(200,210,300,60,0,0,TAU); c.ellipse(640,214,260,50,0,0,TAU); c.fill(); tree(c,60,200,1.3); tree(c,180,190,1); tree(c,720,200,1.4); tree(c,620,186,.9);
    c.fillStyle='#ff5a5a'; c.fillRect(330,90,10,110); c.fillRect(380,90,10,110); c.fillStyle='#ffd23f'; c.fillRect(326,86,68,10); c.fillStyle='#3a8aff'; c.beginPath(); c.moveTo(390,96); c.lineTo(470,196); c.lineTo(486,196); c.lineTo(404,92); c.fill(); for(let k=0;k<5;k++){ c.fillStyle='#fff'; c.fillRect(332,110+k*18,56,4); }
    c.fillStyle='#8a5a2a'; c.fillRect(520,168,80,8); c.fillRect(520,152,80,6); c.fillRect(526,176,6,22); c.fillRect(588,176,6,22); }
  else if(sc===8){ // 夜店：彩色光束、鏡面球、DJ 台、LED 牆
    for(let i=0;i<6;i++){ const a=Math.sin(t*1.2+i*1.7)*.6,col=['#ff3ad8','#3ad8ff','#ffe23a','#6aff6a','#ff6a3a','#8a6aff'][i]; c.save(); c.globalAlpha=.18; c.fillStyle=col; c.translate(80+i*128,0); c.rotate(a); c.beginPath(); c.moveTo(-4,0); c.lineTo(4,0); c.lineTo(70,520); c.lineTo(-70,520); c.fill(); c.restore(); }
    for(let r=0;r<3;r++) for(let k=0;k<16;k++){ const on=(Math.floor(t*6)+k+r*3)%5; c.fillStyle=on===0?'#ff3ad8':on===1?'#3ad8ff':'rgba(255,255,255,.06)'; c.fillRect(150+k*31,100+r*20,26,15); }
    c.fillStyle='#d8dce8'; c.beginPath(); c.arc(400,46,26,0,TAU); c.fill(); for(let k=0;k<20;k++){ const a=k/20*TAU+t; c.fillStyle=(k%3)?'#fff':'#8a8ea8'; c.fillRect(400+Math.cos(a)*16-3,46+Math.sin(a)*16-3,6,6); } c.fillStyle='#888'; c.fillRect(399,0,2,20);
    c.fillStyle='#14101e'; c.fillRect(310,166,180,40); c.fillStyle='#ff3ad8'; c.fillRect(310,166,180,4); c.fillStyle='#3a3048'; c.beginPath(); c.arc(360,180,12,0,TAU); c.arc(440,180,12,0,TAU); c.fill(); c.fillStyle='#fff'; c.font='900 11px '+TC; c.textAlign='center'; c.fillText('DJ',400,190); }
  else { cloud(c,140,40,1); cloud(c,620,50,1); // 游泳池：躺椅、陽傘、跳台
    c.fillStyle='#f0f0f0'; c.fillRect(0,150,W,56); c.fillStyle='#d8d8d8'; for(let x=0;x<W;x+=40) c.fillRect(x,150,1.5,56);
    for(const [x,col] of [[90,'#ff5a5a'],[690,'#ffd23f']]){ c.fillStyle='#888'; c.fillRect(x-2,90,4,90); c.fillStyle=col; c.beginPath(); c.moveTo(x-60,96); c.quadraticCurveTo(x,40,x+60,96); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.moveTo(x-20,96); c.quadraticCurveTo(x,58,x+20,96); c.fill(); c.fillStyle='#3a8aff'; c.fillRect(x+20,170,70,10); c.fillRect(x+80,150,10,26); }
    c.fillStyle='#bbb'; c.fillRect(384,90,8,110); c.fillRect(408,90,8,110); c.fillStyle='#3aa8e8'; c.fillRect(376,86,90,10); }
  const g2=c.createLinearGradient(0,200,0,H); g2.addColorStop(0,S.fl); g2.addColorStop(1,'#00000055'); c.fillStyle=S.fl; c.fillRect(0,205,W,H); c.fillStyle=g2; c.fillRect(0,205,W,H);
  if(sc===1){ c.save(); c.beginPath(); c.rect(0,205,W,H-205); c.clip(); c.strokeStyle='rgba(255,255,255,.75)'; c.lineWidth=3; for(let k=1;k<6;k++){ c.beginPath(); c.ellipse(400,330,330+k*30,96+k*22,0,0,TAU); c.stroke(); } c.restore(); c.fillStyle='#4aa84a'; c.beginPath(); c.ellipse(400,330,330,96,0,0,TAU); c.fill(); c.strokeStyle='#fff'; c.lineWidth=3; c.stroke(); }
  else if(sc===2){ c.fillStyle='#6a4a2a'; c.fillRect(380,320,40,8); c.fillStyle='#ff9d3d'; c.beginPath(); c.moveTo(382,322); c.quadraticCurveTo(400,280+Math.sin(t*14)*6,418,322); c.fill(); }
  else if(sc===4){ c.strokeStyle='rgba(60,30,10,.25)'; c.lineWidth=2; for(let y=230;y<H;y+=30){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); } c.fillStyle='#e8c0a0'; c.beginPath(); c.ellipse(400,330,250,86,0,0,TAU); c.fill(); c.strokeStyle='#c8503a'; c.lineWidth=6; c.beginPath(); c.ellipse(400,330,236,78,0,0,TAU); c.stroke(); c.fillStyle='#8a5a2a'; rr(c,350,312,100,40,8); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(380,326,6,0,TAU); c.fill(); c.fillStyle='#ffd23f'; c.beginPath(); c.arc(420,328,7,0,TAU); c.fill(); }
  else if(sc===5){ c.fillStyle='#ffd0e0'; c.beginPath(); c.ellipse(400,330,230,80,0,0,TAU); c.fill(); c.fillStyle='rgba(255,255,255,.4)'; for(let k=0;k<12;k++){ c.beginPath(); c.arc(400+Math.cos(k/12*TAU)*150,330+Math.sin(k/12*TAU)*50,6,0,TAU); c.fill(); } }
  else if(sc===6){ c.fillStyle='#e8904a'; c.fillRect(60,215,680,290); c.strokeStyle='#fff'; c.lineWidth=4; c.strokeRect(60,215,680,290); c.beginPath(); c.moveTo(60,330); c.lineTo(740,330); c.stroke(); c.beginPath(); c.ellipse(400,330,90,34,0,0,TAU); c.stroke(); c.fillStyle='#3a6ab8'; c.beginPath(); c.ellipse(400,330,88,32,0,0,TAU); c.fill(); c.beginPath(); c.moveTo(300,215); c.lineTo(300,260); c.quadraticCurveTo(400,300,500,260); c.lineTo(500,215); c.stroke(); }
  else if(sc===7){ c.fillStyle='rgba(255,255,255,.08)'; for(let i=0;i<120;i++) c.fillRect((i*67)%W,206+(i*29)%294,2,6); c.fillStyle='#d8c090'; c.beginPath(); c.ellipse(400,330,240,82,0,0,TAU); c.fill(); c.fillStyle='rgba(120,90,50,.25)'; for(let i=0;i<30;i++){ c.beginPath(); c.arc(400+Math.cos(i*2.3)*(60+i*5),330+Math.sin(i*2.3)*(20+i*1.8),3,0,TAU); c.fill(); } }
  else if(sc===8){ for(let r=0;r<9;r++) for(let k=0;k<14;k++){ const on=(k+r+Math.floor(t*4))%4===0; c.fillStyle=on?['rgba(255,58,216,.35)','rgba(58,216,255,.35)','rgba(255,226,58,.3)'][(k+r)%3]:'rgba(255,255,255,.03)'; c.fillRect(k*58,210+r*34,56,32); } }
  else if(sc===9){ c.strokeStyle='rgba(0,0,0,.08)'; c.lineWidth=1.5; for(let x=0;x<W;x+=40){ c.beginPath(); c.moveTo(x,205); c.lineTo(x,H); c.stroke(); } for(let y=220;y<H;y+=40){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); }
    c.fillStyle='#3a9ae8'; rr(c,190,262,420,136,40); c.fill(); const pw=c.createLinearGradient(0,262,0,398); pw.addColorStop(0,'#6ad0ff'); pw.addColorStop(1,'#2a8ad8'); c.fillStyle=pw; rr(c,198,270,404,120,34); c.fill(); c.strokeStyle='rgba(255,255,255,.5)'; c.lineWidth=2; for(let i=0;i<8;i++){ const x=230+i*48,y=290+(i%3)*30; c.beginPath(); c.moveTo(x,y+Math.sin(t*2+i)*3); c.quadraticCurveTo(x+12,y-4,x+24,y+Math.sin(t*2+i)*3); c.stroke(); }
    c.fillStyle='#ff5a5a'; c.beginPath(); c.arc(300+Math.sin(t)*20,330,12,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(300+Math.sin(t)*20,330,6,0,TAU); c.fill(); } }
function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,local2=!net&&opts.mode==='2p',OP=opts.options||{},LIFE=+OP.life||2,sc=clamp(opts.stage||0,0,SCENES.length-1),humans=net?net.count:local2?2:1,me=net?net.me:0;
  const n=net?clamp(net.count+(net.bots||0),2,8):clamp(+OP.seats||(local2?4:5),2,8),{ctx:c}=env.canvas2d(W,H);
  const names=[]; for(let i=0;i<n;i++) names.push(i<humans?(net?(net.names&&net.names[i])||'玩家'+(i+1):local2?(i+1)+'P':(opts.name||'你')):BOTN[(i-humans)%BOTN.length]);
  const seat=i=>{ const a=Math.PI/2+i/n*TAU; return [W/2+Math.cos(a)*300,322+Math.sin(a)*118]; };
  // 共用狀態（連線整包傳）
  let G={lv:Array(n).fill(LIFE),h:(opts.first||0)%n,fuse:0,fuseM:0,seq:[],pos:0,tm:0,tmM:0,round:1,phase:'ready',T:2,fly:null,boom:0,boomAt:-1,msg:'',win:-1,pass:0,dir:1,soot:Array(n).fill(0),wrong:0};
  let t=0,ended=false,evq=[],sendT=0,fx=[],shake=0,localT=0,aiT=.5,lastBoom=0,seenPass=0,seqP=0;
  const sfx=k=>{ env.sfx(k); if(net&&net.host) evq.push(k); };
  const aliveI=()=>G.lv.map((v,i)=>v>0?i:-1).filter(i=>i>=0);
  const nextAlive=i=>{ for(let k=1;k<=n;k++){ const q=((i+G.dir*k)%n+n)%n; if(G.lv[q]>0) return q; } return i; };
  function newSeq(){ const len=clamp(2+Math.floor((G.round-1)/2)+Math.floor(G.pass/5),2,7),a=[]; for(let i=0;i<len;i++) a.push(Math.floor(Math.random()*4)); G.seq=a; G.pos=0; G.wrong=0; }
  function newRound(){ G.fuseM=G.fuse=7+Math.random()*(13-Math.min(4,G.round*.6)); G.pass=0; G.phase='hold'; newSeq(); G.msg=''; aiT=aiDelay(); sfx('go'); }
  const aiDelay=()=>.9+G.seq.length*(.32+Math.random()*.25);
  function advance(i){ if(G.phase!=='hold'||i!==G.h||G.pos<G.seq.length) return; const to=nextAlive(G.h); G.fly={from:G.h,to,u:0}; G.phase='fly'; G.pass++; sfx('click'); }
  function press(i,k){ if(G.phase!=='hold'||i!==G.h) return; if(G.seq[G.pos]===k){ G.pos++; sfx('item'); if(G.pos>=G.seq.length) advance(i); } else { G.pos=0; G.wrong=.45; G.fuse=Math.max(.4,G.fuse-.6); sfx('bump'); } }
  function boom(){ G.phase='boom'; G.T=2.3; const v=G.h; G.lv[v]--; G.soot[v]=1; G.boomAt=v; G.boom++; G.msg=names[v]+' 被炸到了！'+(G.lv[v]<=0?'出局！':''); sfx('boom'); sfx('hurt'); }
  function stepHost(dt){ if(G.phase==='ready'){ G.T-=dt; if(G.T<=0) newRound(); return; }
    if(G.wrong>0) G.wrong-=dt;
    if(G.phase==='hold'||G.phase==='fly'){ G.fuse-=dt; if(G.fuse<=0&&G.phase==='fly'){ const f=G.fly; G.h=f.u>.5?f.to:f.from; G.fly=null; boom(); return; } if(G.fuse<=0){ boom(); return; } }
    if(G.phase==='fly'){ const f=G.fly; f.u+=dt*2; if(f.u>=1){ G.h=f.to; G.fly=null; G.phase='hold'; newSeq(); aiT=aiDelay(); } return; }
    if(G.phase==='hold'&&G.h>=humans){ aiT-=dt; if(aiT<=0){ if(Math.random()<.08+G.round*.005){ G.wrong=.4; G.fuse=Math.max(.4,G.fuse-.6); sfx('bump'); aiT=.9; } else { G.pos=G.seq.length; sfx('item'); advance(G.h); } } }
    if(G.phase==='boom'){ G.T-=dt; if(G.T<=0){ const a=aliveI(); if(a.length<=1){ G.phase='end'; G.win=a.length?a[0]:-1; G.T=2; sfx('win'); return; } G.round++; if(G.lv[G.h]<=0) G.h=nextAlive(G.h); G.soot=G.soot.map(v=>G.lv[G.soot.indexOf(v)]>0?v:v); G.phase='ready'; G.T=2.2; } }
    if(G.phase==='end'){ G.T-=dt; if(G.T<=0&&!ended){ ended=true; if(net) net.send({st:G}); finish(); } } }
  function finish(){ const w=G.win,meWin=w===(local2?-9:me)||local2&&w<2; env.sfx(meWin?'win':'lose'); env.end({title:w>=0?names[w]+' 活到最後！':'全部炸光了',big:meWin?'你贏了':'第 '+G.round+' 回合結束',html:'<table class="ls"><tr><th>玩家</th><th>剩下的命</th></tr>'+names.map((m,i)=>'<tr><td>'+m+'</td><td>'+'♥'.repeat(Math.max(0,G.lv[i]))+'</td></tr>').join('')+'</table>',text:'撐過 '+G.round+' 回合',score:!net&&!local2&&meWin?G.round:null}); }
  if(net){ if(client) net.onmsg=m=>{ if(m.st){ const was=G.boom; G=m.st; if(G.boom>was) bigBoom(); if(G.phase==='end'&&!ended&&G.T<=0){ ended=true; finish(); } } if(m.ev) for(const k of m.ev) env.sfx(k); }; else net.onmsg=(m,from)=>{ if(m.k!=null) press(from,m.k); }; }
  function bigBoom(){ const v=G.boomAt; if(v<0) return; const p=seat(v); shake=16; for(let i=0;i<70;i++){ const a=Math.random()*TAU,s=60+Math.random()*340; fx.push({x:p[0],y:p[1]-40,vx:Math.cos(a)*s,vy:Math.sin(a)*s-60,l:.5+Math.random()*.7,c:['#ffd23f','#ff7a3d','#ff3b3b','#fff','#55505a'][i%5],s:3+Math.random()*6}); } fx.push({ring:1,x:p[0],y:p[1]-40,l:.5,L:.5}); }
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt; if(shake>0) shake=Math.max(0,shake-dt*30);
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; if(f.l<=0){ fx.splice(i,1); continue; } if(!f.ring){ f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=420*dt; } }
    // 按鍵：單人、連線用方向鍵或 WASD；同機 1P WASD、2P 方向鍵
    const send=(pl,k)=>{ if(client) net.send({k}); else press(pl,k); };
    for(let k=0;k<4;k++){ if(local2){ if(env.hit(ARK[k][1])) send(0,k); if(env.hit(ARK[k][0])) send(1,k); } else if(ARK[k].some(q=>env.hit(q))) send(me,k); }
    if(client){ if(G.fly) G.fly.u=Math.min(1,G.fly.u+dt*2); return; }
    const was=G.boom; stepHost(dt); if(G.boom>was) bigBoom();
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/12; net.send({st:G}); if(evq.length){ net.send({ev:evq}); evq=[]; } } } }
  function draw(){ c.save(); if(shake>0) c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake); background(c,sc,t);
    const hot=G.fuseM?1-clamp(G.fuse/G.fuseM,0,1):0,order=[...Array(n).keys()].sort((a,b)=>seat(a)[1]-seat(b)[1]);
    // 地上的圈
    c.strokeStyle='rgba(255,255,255,.28)'; c.lineWidth=3; c.setLineDash([12,10]); c.beginPath(); c.ellipse(W/2,322,300,118,0,0,TAU); c.stroke(); c.setLineDash([]);
    for(const i of order){ const p=seat(i),out=G.lv[i]<=0,has=G.h===i&&!G.fly&&G.phase!=='boom'&&G.phase!=='end',me1=local2?i<2:i===me; c.globalAlpha=out?.4:1; guy(c,p[0],p[1],1.05,BODY[i%8],HAIR[i%8],t+i,{soot:G.soot[i]&&(out||G.phase==='boom'&&G.boomAt===i),scared:has&&hot>.4,up:has,hop:G.win===i}); c.globalAlpha=1;
      if(has&&G.wrong>0){ c.fillStyle='#ff3b3b'; c.font='900 22px '+TC; c.textAlign='center'; c.fillText('✕',p[0]+30,p[1]-56); }
      const nm=names[i].slice(0,6); c.font='900 12px '+TC; c.textAlign='center'; c.textBaseline='middle'; const w2=c.measureText(nm).width+14; c.fillStyle=me1?'#ffd23f':'rgba(11,10,28,.72)'; rr(c,p[0]-w2/2,p[1]+8,w2,17,8); c.fill(); c.fillStyle=me1?'#14122b':'#fff'; c.fillText(nm,p[0],p[1]+17); c.fillStyle='#ff4d6d'; c.font='12px sans-serif'; c.fillText('♥'.repeat(Math.max(0,G.lv[i])),p[0],p[1]+33); }
    // 炸彈
    let bx,by; if(G.fly){ const a=seat(G.fly.from),b=seat(G.fly.to),u=G.fly.u; bx=a[0]+(b[0]-a[0])*u; by=a[1]-66+(b[1]-a[1])*u-Math.sin(u*Math.PI)*90; bombArt(c,bx,by,17,t,hot); } else if(G.phase==='hold'||G.phase==='ready'){ const a=seat(G.h); bx=a[0]; by=a[1]-84; bombArt(c,bx,by,17+(hot>.6?Math.sin(t*24)*1.5:0),t,hot); }
    for(const f of fx){ if(f.ring){ const a=f.l/f.L; c.globalAlpha=a; c.strokeStyle='#ffd23f'; c.lineWidth=10*a+1; c.beginPath(); c.arc(f.x,f.y,(1-a)*190,0,TAU); c.stroke(); c.globalAlpha=1; } else { c.globalAlpha=Math.min(1,f.l*2); c.fillStyle=f.c; c.fillRect(f.x,f.y,f.s,f.s); c.globalAlpha=1; } }
    c.restore();
    if(G.phase==='boom'&&G.T>2.05){ c.fillStyle='rgba(255,240,180,'+(G.T-2.05)*3+')'; c.fillRect(0,0,W,H); }
    // 中間：要按的箭頭
    const active=G.phase==='hold'&&(local2?G.h<2:G.h===me);
    c.textAlign='center'; c.textBaseline='middle';
    if(G.phase==='hold'&&G.seq.length){ const len=G.seq.length,sz=active?46:28,gp=6,x0=W/2-(len*(sz+gp)-gp)/2,y0=active?196:222; if(active){ c.fillStyle='rgba(11,10,28,.78)'; rr(c,x0-16,y0-34,len*(sz+gp)+26,sz+50,14); c.fill(); c.fillStyle='#ffd23f'; c.font='900 13px '+TC; c.fillText((local2?(G.h+1)+'P ':'')+'快按！',W/2,y0-18); } for(let i=0;i<len;i++){ const done=i<G.pos,x=x0+i*(sz+gp); c.fillStyle=done?'#5fd068':i===G.pos?'#ffd23f':'#f4f4f8'; if(!active) c.globalAlpha=.8; rr(c,x,y0,sz,sz,sz*.22); c.fill(); c.fillStyle='#14122b'; c.font='900 '+Math.round(sz*.62)+'px sans-serif'; c.fillText(GL[G.seq[i]],x+sz/2,y0+sz/2+1); c.globalAlpha=1; } }
    if(G.msg&&G.phase==='boom'){ c.font='900 30px '+TC; c.lineWidth=7; c.strokeStyle='#14122b'; c.strokeText(G.msg,W/2,180); c.fillStyle='#ffd23f'; c.fillText(G.msg,W/2,180); }
    if(G.phase==='ready'){ c.font='900 36px '+TC; c.lineWidth=7; c.strokeStyle='#14122b'; const s='第 '+G.round+' 回合'; c.strokeText(s,W/2,170); c.fillStyle='#fff'; c.fillText(s,W/2,170); }
    c.fillStyle='rgba(11,10,28,.75)'; rr(c,10,10,154,30,10); c.fill(); c.fillStyle='#fff'; c.font='900 13px '+TC; c.textAlign='left'; c.fillText('第 '+G.round+' 回合　剩 '+aliveI().length+' 人',20,25);
    c.fillStyle=hot>.7&&Math.sin(t*14)>0?'#ff5d4f':'rgba(255,255,255,.75)'; c.font='700 12px '+TC; c.textAlign='right'; c.fillText(hot>.7?'引信快燒完了！':'引信還有多長？沒人知道',W-14,24); }
  return {update,draw,destroy(){},_dbg:{get G(){return G;},press}};
}
function stageShow(ctx,w,h,si,t){ ctx.save(); ctx.scale(w/W,h/H); background(ctx,si,t); for(let i=0;i<5;i++){ const a=Math.PI/2+i/5*TAU; guy(ctx,W/2+Math.cos(a)*260,320+Math.sin(a)*110,1.2,BODY[i],HAIR[i],t+i,{up:i===Math.floor(t)%5,scared:i===Math.floor(t)%5}); } const k=Math.floor(t)%5,a0=Math.PI/2+k/5*TAU; bombArt(ctx,W/2+Math.cos(a0)*260,320+Math.sin(a0)*110-100,22,t,.6); ctx.restore(); }
const thumb=(ctx,w,h,t)=>stageShow(ctx,w,h,1,t);
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).passbomb={
  name:'炸彈傳傳傳',tag:'PASS THE BOMB',color:'#ff7a3d',online:true,maxPlayers:8,minPlayers:2,bots:true,
  coin:o=>({verb:'先拿炸彈',names:o.net?[o.net.names[0]||'玩家 1',o.net.names[1]||'玩家 2']:o.mode==='2p'?['1P','2P']:[o.name||'你','電腦']}),
  desc:'大家圍成一圈傳炸彈！拿到炸彈要照順序按出箭頭才傳得走，引信多長沒人知道，炸到就扣一條命，活到最後的贏。',
  goal:'炸彈在手上時，照順序按對箭頭就會傳給下一個人。按錯引信會變短。活到最後的人贏。',
  stages:SCENES.map(s=>s.name),stageLabel:'選擇場景',stageShow,
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  options:[{key:'life',label:'每人幾條命',def:'2',opts:[{id:'1',label:'1 條'},{id:'2',label:'2 條'},{id:'3',label:'3 條'}]},{key:'seats',label:'單機人數',def:'5',opts:[{id:'3',label:'3 人'},{id:'4',label:'4 人'},{id:'5',label:'5 人'},{id:'6',label:'6 人'},{id:'8',label:'8 人'}]}],
  help:[['↑ ↓ ← →','照順序按箭頭，傳走炸彈'],['雙人','1P 用 WASD、2P 用方向鍵']],
  touchHelp:[['方向盤','照順序按箭頭，傳走炸彈']],
  touch:{left:'dpad',right:[]},best:{label:'最久',fmt:v=>'撐到第 '+v+' 回合',lower:false},thumb,create};
})();
