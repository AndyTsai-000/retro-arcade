// 鬥魂籃球：3 對 3 半場鬥牛（3x3 規則：弧頂內 1 分、外 2 分、搶到球要先清到外線、進攻時限 12 秒）。
// 鬥魂風格：沒有犯規，可以推人抄球；集滿氣可以放必殺灌籃。畫面走寫實風，球員是真人比例。
// 單人控制一名球員（隊友電腦），雙人可對打或同隊打電腦；連線由房主運算，另一邊送按鍵（同鬥魂足球）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PIX='"Press Start 2P","Noto Sans TC",monospace';
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k,R1=v=>Math.round(v*10)/10;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function glow(c,x,y,r,col){ const g=c.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.fillRect(x-r,y-r,r*2,r*2); }
const shade=(h,f)=>{ const n=parseInt(String(h).slice(1),16); if(isNaN(n)) return h; const ch=v=>clamp(Math.round(v*f),0,255); return 'rgb('+ch((n>>16)&255)+','+ch((n>>8)&255)+','+ch(n&255)+')'; };
// 球場座標：gx 0～820（往右是籃框）、gy 0～640（深度），z 高度
const HX=760,HY=320,RIMZ=118,ARC=270,SX=gx=>30+gx*.86,SY=gy=>170+gy*.48,SC=gy=>.8+gy/640*.38;
const SKINS=['#f2c9a0','#e0ac80','#c68a5e','#8d5a3a','#5e3a26','#f6d6b8'],HAIRC=['#1a1410','#3a2416','#6a4a2a','#c8a060','#d8d0c8','#8a2a1a'];
const STAGES=[
  {name:'社區公園隊',stars:1,court:'park',col:'#3d8bff',col2:'#ffffff',ai:.42,names:['阿凱','小胖','阿偉']},
  {name:'校園熱血隊',stars:1,court:'school',col:'#2e9e4f',col2:'#ffd23f',ai:.48,names:['學長','書呆','阿毛']},
  {name:'海邊沙灘隊',stars:2,court:'beach',col:'#ff9d3d',col2:'#ffffff',ai:.54,names:['衝浪仔','黑皮','椰子']},
  {name:'屋頂天台隊',stars:2,court:'roof',col:'#7a5aff',col2:'#ffd23f',ai:.6,names:['鷹眼','飛人','小黑']},
  {name:'夜市鬥牛隊',stars:3,court:'market',col:'#e23b3b',col2:'#ffd23f',ai:.66,names:['雞排','珍奶','大腸']},
  {name:'鐵籠街頭隊',stars:3,court:'cage',col:'#1e1e24',col2:'#ff4d4d',ai:.72,names:['鐵拳','刺青','狂牛']},
  {name:'港口貨櫃隊',stars:4,court:'port',col:'#2f6f9a',col2:'#ff7a1a',ai:.78,names:['吊車','水手','鐵錨']},
  {name:'體育館精英隊',stars:4,court:'gym',col:'#c0392b',col2:'#f4f4f4',ai:.84,names:['隊長','神射','大樹']},
  {name:'霓虹夜光隊',stars:5,court:'neon',col:'#ff3bd4',col2:'#3ddbd9',ai:.9,names:['閃電','幻影','霓虹']},
  {name:'職業殿堂隊',stars:5,court:'arena',col:'#ffd23f',col2:'#5a2a8a',ai:.96,names:['帝王','天勾','傳奇']}];
const COURT={park:{floor:'#5a6a7a',line:'#f4f4f4',paint:'#3a6a9a',bg:'park'},school:{floor:'#c8905a',line:'#ffffff',paint:'#2e7a4a',bg:'school',wood:1},beach:{floor:'#d8c08a',line:'#ffffff',paint:'#3a9ad8',bg:'beach'},
  roof:{floor:'#4a4e58',line:'#ffd23f',paint:'#5a3a8a',bg:'roof'},market:{floor:'#5a4a4a',line:'#ffe08a',paint:'#a82a2a',bg:'market',night:1},cage:{floor:'#3a3a40',line:'#ff4d4d',paint:'#2a2a30',bg:'cage',night:1},
  port:{floor:'#5a6068',line:'#ffffff',paint:'#2f6f9a',bg:'port'},gym:{floor:'#d8a060',line:'#ffffff',paint:'#a83a2a',bg:'gym',wood:1},neon:{floor:'#1e1a30',line:'#3ddbd9',paint:'#5a1a5a',bg:'neon',night:1},arena:{floor:'#c89050',line:'#ffffff',paint:'#4a2a7a',bg:'arena',wood:1}};

/* ---------- 寫實球員（側面看，face 1 朝右、-1 朝左） ---------- */
function limb(c,a,b,w,col){ c.strokeStyle=col; c.lineWidth=w; c.lineCap='round'; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]); c.stroke(); }
function joint(p,len,ang){ return [p[0]+Math.sin(ang)*len,p[1]+Math.cos(ang)*len]; } // ang 0＝往下
function drawBaller(c,x,y,z,s,o){ // (x,y) 腳下地面螢幕座標、z 跳起來的高度（螢幕像素）
  const f=o.face||1,t=o.t||0,pose=o.pose||'idle',sk=o.skin||SKINS[1],jc=o.col||'#e23b3b',j2=o.col2||'#fff',sh=o.shorts||shade(jc,.75),shoe=o.shoe||'#f4f4f4';
  c.save(); c.translate(x,y);
  c.fillStyle='rgba(0,0,0,'+(.32-Math.min(.2,z/300))+')'; c.beginPath(); c.ellipse(0,0,(13-Math.min(6,z/20))*s,4*s,0,0,7); c.fill();
  c.translate(0,-z); c.scale(s*f,s);
  if(pose==='fall'){ c.rotate(-1.35); c.translate(18,6); }
  // 姿勢：髖、肩的位置與四肢角度
  const ph=t*11,run=pose==='run'||pose==='dribble',crouch=pose==='defend'?5:pose==='shootPrep'?6:0;
  const hip=[0,-36+crouch],sh2=[pose==='defend'?3:1,-58+crouch];
  let lA,lB,kA,kB,aA,aB,eA,eB; // 前腿、後腿（大腿角、膝角），前手、後手（上臂角、前臂角）
  if(run){ const sw=Math.sin(ph)*.75; lA=sw; lB=-sw; kA=-Math.max(0,-Math.cos(ph))*1.1; kB=-Math.max(0,Math.cos(ph))*1.1; aA=-sw*.8; aB=sw*.8; eA=-1.2; eB=-1.2; }
  else if(pose==='defend'){ lA=.55; lB=-.45; kA=-.7; kB=-.6; aA=-1.4; aB=-1.1; eA=-.3; eB=-.3; }
  else if(pose==='shoot'||pose==='shootPrep'){ lA=.1; lB=-.15; kA=pose==='shootPrep'?-.8:-.1; kB=pose==='shootPrep'?-.8:-.25; aA=-2.85; aB=-2.6; eA=-.4; eB=-.6; }
  else if(pose==='dunk'){ lA=.5; lB=-.6; kA=-1.6; kB=-.9; aA=-2.95; aB=-.6; eA=-.1; eB=-.6; }
  else if(pose==='jump'){ lA=.3; lB=-.3; kA=-1.1; kB=-.8; aA=-2.8; aB=-2.9; eA=-.2; eB=-.2; }
  else { const br=Math.sin(t*2)*.04; lA=.12; lB=-.1; kA=-.12; kB=-.08; aA=.25+br; aB=-.15; eA=-.5; eB=-.4; }
  if(pose==='dribble'){ aA=.55; eA=.15; }
  // 後面的手腳先畫
  const kneeB=joint(hip,17,lB),footB=joint(kneeB,17,lB+kB); limb(c,hip,kneeB,8.5,shade(sk,.85)); limb(c,kneeB,footB,7,shade(sk,.85));
  c.fillStyle=shade(shoe,.85); rr(c,footB[0]-3,footB[1]-2.5,11,5,2.5); c.fill();
  const elB=joint(sh2,12,aB),haB=joint(elB,12,aB+eB); limb(c,sh2,elB,6.5,shade(sk,.85)); limb(c,elB,haB,5.5,shade(sk,.85));
  // 球褲、球衣
  c.fillStyle=sh; c.beginPath(); c.moveTo(-8,hip[1]-4); c.lineTo(8,hip[1]-4); c.lineTo(10,hip[1]+12); c.lineTo(-10,hip[1]+12); c.closePath(); c.fill();
  c.fillStyle=j2; c.fillRect(-10,hip[1]+9,20,2);
  const tg=c.createLinearGradient(-9,0,9,0); tg.addColorStop(0,shade(jc,.8)); tg.addColorStop(.5,jc); tg.addColorStop(1,shade(jc,.7)); c.fillStyle=tg;
  c.beginPath(); c.moveTo(sh2[0]-8,sh2[1]); c.quadraticCurveTo(sh2[0],sh2[1]+3,sh2[0]+8,sh2[1]); c.lineTo(hip[0]+8,hip[1]-2); c.lineTo(hip[0]-8,hip[1]-2); c.closePath(); c.fill();
  c.strokeStyle=j2; c.lineWidth=1.6; c.beginPath(); c.moveTo(sh2[0]-6,sh2[1]); c.quadraticCurveTo(sh2[0],sh2[1]+6,sh2[0]+6,sh2[1]); c.stroke();
  c.save(); c.scale(f,1); c.fillStyle=j2; c.font='900 9px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(o.num||''),0,(sh2[1]+hip[1])/2+1); c.restore();
  // 前面的腿
  const kneeA=joint(hip,17,lA),footA=joint(kneeA,17,lA+kA); limb(c,hip,kneeA,9,sk); limb(c,kneeA,footA,7.5,sk);
  if(o.sock){ limb(c,joint(kneeA,11,lA+kA),footA,7.8,'#f4f4f4'); }
  c.fillStyle=shoe; rr(c,footA[0]-3,footA[1]-2.5,12,5.5,2.6); c.fill(); c.fillStyle=shade(shoe,.6); c.fillRect(footA[0]-3,footA[1]+1.5,12,1.4);
  // 頭：側臉、耳朵、頭髮
  const hd=[sh2[0]+1.5,sh2[1]-9]; c.fillStyle=sk; c.fillRect(hd[0]-2.5,sh2[1]-4,5,5);
  c.beginPath(); c.ellipse(hd[0],hd[1],6.4,7.4,0,0,7); c.fill(); c.beginPath(); c.moveTo(hd[0]+5.5,hd[1]-1); c.lineTo(hd[0]+8,hd[1]+1.6); c.lineTo(hd[0]+5.6,hd[1]+2.4); c.fill();
  c.fillStyle=shade(sk,.8); c.beginPath(); c.ellipse(hd[0]-1.6,hd[1]+.6,1.6,2.2,0,0,7); c.fill();
  c.fillStyle='#1a1418'; c.beginPath(); c.ellipse(hd[0]+3.6,hd[1]-.8,.9,1.1,0,0,7); c.fill(); c.strokeStyle='#1a1418'; c.lineWidth=.8; c.beginPath(); c.moveTo(hd[0]+2.4,hd[1]-2.6); c.lineTo(hd[0]+5.2,hd[1]-2.9); c.stroke();
  c.strokeStyle=shade(sk,.6); c.beginPath(); c.moveTo(hd[0]+3.8,hd[1]+4); c.lineTo(hd[0]+5.6,hd[1]+3.7); c.stroke();
  const hc=o.hairCol||'#1a1410',hs=o.hair||0; c.fillStyle=hc;
  if(hs===0){ c.beginPath(); c.ellipse(hd[0]-.6,hd[1]-3.2,6.6,4.8,-.15,Math.PI*.95,Math.PI*2.05); c.fill(); }
  else if(hs===1){ c.beginPath(); c.ellipse(hd[0]-.5,hd[1]-3,7.4,6.2,0,Math.PI*.9,Math.PI*2.1); c.fill(); c.beginPath(); c.arc(hd[0]-6,hd[1]-.5,3.6,0,7); c.fill(); } // 爆炸頭
  else if(hs===2){ c.beginPath(); c.ellipse(hd[0]-.6,hd[1]-3.5,6.6,4.6,-.1,Math.PI*.95,Math.PI*2.05); c.fill(); c.beginPath(); c.moveTo(hd[0]-5,hd[1]-3); c.quadraticCurveTo(hd[0]-11,hd[1]+2,hd[0]-9,hd[1]+9); c.lineTo(hd[0]-6,hd[1]+2); c.fill(); } // 綁辮子
  else if(hs===3){ c.fillStyle=o.band||j2; c.fillRect(hd[0]-6.6,hd[1]-4.5,13.4,3); c.fillStyle=hc; c.beginPath(); c.ellipse(hd[0]-.6,hd[1]-5.5,6.2,3.4,0,Math.PI,0); c.fill(); } // 頭帶
  else { c.fillStyle=shade(sk,.92); c.beginPath(); c.ellipse(hd[0]-.4,hd[1]-3.6,6.4,4,0,Math.PI,0); c.fill(); } // 光頭
  // 前面的手
  const elA=joint(sh2,12,aA),haA=joint(elA,12,aA+eA); limb(c,sh2,elA,7,sk); limb(c,elA,haA,6,sk); c.fillStyle=sk; c.beginPath(); c.arc(haA[0],haA[1],3.2,0,7); c.fill();
  if(o.sleeve){ limb(c,sh2,joint(sh2,7,aA),7.6,o.sleeve); }
  c.restore();
  return {hand:[x+haA[0]*s*f,y-z+haA[1]*s],head:[x+hd[0]*s*f,y-z+hd[1]*s]}; }
function drawBallSpr(c,x,y,r,t){ const g=c.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r); g.addColorStop(0,'#ffb36a'); g.addColorStop(.6,'#e8701e'); g.addColorStop(1,'#a8480e'); c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,7); c.fill();
  c.strokeStyle='rgba(40,20,10,.75)'; c.lineWidth=Math.max(.8,r*.12); c.beginPath(); c.moveTo(x-r,y); c.lineTo(x+r,y); c.moveTo(x,y-r); c.lineTo(x,y+r); c.stroke(); c.beginPath(); c.ellipse(x,y,r*.55,r,0,-Math.PI/2,Math.PI/2); c.stroke(); c.beginPath(); c.ellipse(x,y,r*.55,r,0,Math.PI/2,Math.PI*1.5); c.stroke(); }
/* ---------- 球場與背景 ---------- */
function drawCourt(c,CT,t,swish){
  const bg=CT.bg,night=CT.night;
  // 背景
  const g=c.createLinearGradient(0,0,0,180);
  if(night){ g.addColorStop(0,'#0a0c22'); g.addColorStop(1,'#2a2050'); } else if(bg==='gym'||bg==='arena'){ g.addColorStop(0,'#2a2430'); g.addColorStop(1,'#4a4048'); } else if(bg==='beach'){ g.addColorStop(0,'#5ab8f0'); g.addColorStop(1,'#d8f0ff'); } else { g.addColorStop(0,'#6ab8f0'); g.addColorStop(1,'#d8eef8'); }
  c.fillStyle=g; c.fillRect(0,0,W,180);
  if(bg==='park'){ c.fillStyle='#4f8a3a'; for(let i=0;i<10;i++){ c.beginPath(); c.arc(i*90+20,140,40+(i%3)*10,0,7); c.fill(); } c.fillStyle='#5a4a3a'; for(let i=0;i<10;i++) c.fillRect(i*90+16,140,8,40); }
  else if(bg==='school'){ c.fillStyle='#e8d8c0'; c.fillRect(0,70,W,110); c.fillStyle='#c0b098'; for(let x=20;x<W;x+=70) for(let y=86;y<170;y+=34){ c.fillStyle='#7fb0d8'; c.fillRect(x,y,40,22); } c.fillStyle='#a83a2a'; c.fillRect(0,64,W,8); }
  else if(bg==='beach'){ c.fillStyle='#2a86c8'; c.fillRect(0,120,W,60); c.fillStyle='rgba(255,255,255,.4)'; for(let i=0;i<14;i++) c.fillRect((i*67+t*12)%W,130+(i%3)*14,30,2); c.strokeStyle='#8a6a3a'; c.lineWidth=6; for(const x of [60,740]){ c.beginPath(); c.moveTo(x,180); c.quadraticCurveTo(x+16,120,x+24,70); c.stroke(); c.fillStyle='#2f9a4a'; for(let k=0;k<5;k++){ c.beginPath(); c.ellipse(x+24+Math.cos(k*1.3)*20,70+Math.sin(k*1.3)*8,24,6,k*1.3,0,7); c.fill(); } } }
  else if(bg==='roof'||bg==='port'){ for(let i=0;i<16;i++){ const h=40+((i*37)%90); c.fillStyle=bg==='port'?'#7a8494':'#8a96a8'; c.fillRect(i*52,180-h,46,h); c.fillStyle='rgba(200,225,250,.7)'; for(let y=180-h+8;y<174;y+=14) for(let x=i*52+6;x<i*52+42;x+=12) c.fillRect(x,y,6,7); }
    if(bg==='port'){ const cols=['#c0392b','#2f6fd0','#2e9e4f','#e0a020']; for(let i=0;i<8;i++){ c.fillStyle=cols[i%4]; c.fillRect(i*100+10,140,90,40); } c.strokeStyle='#e0a020'; c.lineWidth=5; c.beginPath(); c.moveTo(700,180); c.lineTo(700,30); c.lineTo(560,30); c.stroke(); } }
  else if(bg==='market'){ c.fillStyle='#2a1a28'; c.fillRect(0,100,W,80); for(let i=0;i<12;i++){ const x=i*68+20; glow(c,x,60,40,'rgba(255,170,80,.4)'); c.fillStyle='#e8231c'; c.beginPath(); c.ellipse(x,60,12,15,0,0,7); c.fill(); c.fillStyle='#ffd23f'; c.fillRect(x-7,44,14,3); } c.fillStyle='#ffd23f'; c.font='900 20px '+TC; c.textAlign='center'; c.fillText('夜 市',W/2,140); }
  else if(bg==='cage'){ c.fillStyle='#3a3a44'; c.fillRect(0,60,W,120); c.fillStyle='#ff4d4d'; c.font='900 30px '+TC; c.textAlign='center'; c.fillText('STREET',W*.3,130); c.fillStyle='#3ddbd9'; c.fillText('鬥魂',W*.7,130); c.strokeStyle='rgba(180,180,190,.5)'; c.lineWidth=1; for(let x=-200;x<W;x+=14){ c.beginPath(); c.moveTo(x,0); c.lineTo(x+180,180); c.moveTo(x+180,0); c.lineTo(x,180); c.stroke(); } }
  else if(bg==='neon'){ for(let i=0;i<14;i++){ const h=60+((i*43)%100); c.fillStyle='#181428'; c.fillRect(i*58,180-h,52,h); const cl=['#ff3bd4','#3ddbd9','#ffd23f'][i%3]; c.fillStyle=cl; c.globalAlpha=.7+.3*Math.sin(t*3+i); c.fillRect(i*58+6,180-h+10,40,4); c.globalAlpha=1; } }
  else { // 體育館、職業殿堂：看台觀眾
    for(let r=0;r<5;r++) for(let i=0;i<46;i++){ const x=i*18+(r%2)*9,y=50+r*24,hop=Math.abs(Math.sin(t*6+i*.7+r))*(swish>0?6:1.5); c.fillStyle=['#e8c8a8','#c8905a','#8a5a3a','#f2d0b0'][(i+r)%4]; c.beginPath(); c.arc(x,y-hop,5,0,7); c.fill(); c.fillStyle=['#e23b3b','#3d8bff','#ffd23f','#5fd068','#f4f4f4','#c56bff'][(i*3+r)%6]; c.fillRect(x-6,y+4-hop,12,10); }
    if(bg==='arena'){ c.fillStyle='rgba(255,255,255,.08)'; for(let i=0;i<4;i++){ c.beginPath(); c.moveTo(100+i*200,0); c.lineTo(60+i*200,180); c.lineTo(160+i*200,180); c.fill(); } } }
  if(night) for(const x of [80,720]){ glow(c,x,40,160,'rgba(255,240,200,.25)'); c.fillStyle='#d8d8e0'; c.fillRect(x-14,30,28,10); }
  // 場地地面
  const fg=c.createLinearGradient(0,170,0,H); fg.addColorStop(0,shade(CT.floor,.82)); fg.addColorStop(1,CT.floor); c.fillStyle=fg; c.fillRect(0,170,W,H-170);
  if(CT.wood){ c.strokeStyle='rgba(0,0,0,.1)'; c.lineWidth=1; for(let y=172;y<H;y+=8){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); } for(let i=0;i<60;i++){ const y=172+(i*8)%(H-172); c.beginPath(); c.moveTo((i*137)%W,y); c.lineTo((i*137)%W,y+8); c.stroke(); } const sh=c.createLinearGradient(0,170,0,H); sh.addColorStop(0,'rgba(255,255,255,.12)'); sh.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=sh; c.fillRect(0,170,W,H-170); }
  else { c.fillStyle='rgba(255,255,255,.05)'; for(let i=0;i<300;i++) c.fillRect((i*137)%W,172+(i*53)%(H-172),2,2); }
  // 禁區、三分弧、罰球圈（地面上的線用世界座標畫）
  const P=(gx,gy)=>[SX(gx),SY(gy)];
  c.fillStyle=CT.paint; c.globalAlpha=.85; c.beginPath(); [[560,220],[820,220],[820,420],[560,420]].forEach(([a,b],i)=>{ const [px,py]=P(a,b); i?c.lineTo(px,py):c.moveTo(px,py); }); c.closePath(); c.fill(); c.globalAlpha=1;
  c.strokeStyle=CT.line; c.lineWidth=2.5; c.beginPath(); [[560,220],[820,220],[820,420],[560,420],[560,220]].forEach(([a,b],i)=>{ const [px,py]=P(a,b); i?c.lineTo(px,py):c.moveTo(px,py); }); c.stroke();
  c.beginPath(); for(let a=-Math.PI/2;a<=Math.PI/2+.01;a+=.05){ const [px,py]=P(560-Math.cos(a)*70,320+Math.sin(a)*70); a===-Math.PI/2?c.moveTo(px,py):c.lineTo(px,py); } c.stroke();
  c.beginPath(); const [l0x,l0y]=P(820,320-ARC*.94); c.moveTo(l0x,l0y); for(let a=-1.22;a<=1.22;a+=.04){ const [px,py]=P(HX-Math.cos(a)*ARC,HY+Math.sin(a)*ARC); c.lineTo(px,py); } const [l1x,l1y]=P(820,320+ARC*.94); c.lineTo(l1x,l1y); c.stroke();
  c.beginPath(); const [ax,ay]=P(0,0),[bx,by]=P(820,0); c.moveTo(ax,ay); c.lineTo(bx,by); const [cx2,cy2]=P(820,640); c.lineTo(cx2,cy2); c.stroke();
  // 中線那一側（半場）
  c.beginPath(); for(let a=-Math.PI/2;a<=Math.PI/2+.01;a+=.05){ const [px,py]=P(Math.cos(a)*90,320+Math.sin(a)*90); a===-Math.PI/2?c.moveTo(px,py):c.lineTo(px,py); } c.stroke(); }
function drawHoop(c,CT,t,swish,front){ // front＝籃框前半圈與網子（畫在球後面／前面）
  const rx=SX(HX),ry=SY(HY)-RIMZ*.9,bx=SX(HX+38);
  if(!front){ // 籃架、籃板
    c.fillStyle='#3a3a44'; c.fillRect(bx+20,SY(HY)-6,10,8); c.fillRect(bx+22,ry-50,6,SY(HY)-ry+48); c.fillRect(bx,ry-46,26,5);
    c.fillStyle='rgba(220,240,255,.45)'; c.strokeStyle='#f4f4f4'; c.lineWidth=2.5; c.beginPath(); c.moveTo(bx,ry-70); c.lineTo(bx+8,ry-66); c.lineTo(bx+8,ry+22); c.lineTo(bx,ry+18); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle='#e8402a'; c.lineWidth=2; c.beginPath(); c.moveTo(bx+1,ry-26); c.lineTo(bx+7,ry-24); c.lineTo(bx+7,ry+4); c.lineTo(bx+1,ry+2); c.closePath(); c.stroke();
    c.strokeStyle='#e8501e'; c.lineWidth=3; c.beginPath(); c.ellipse(rx,ry,19,5.5,0,Math.PI,0); c.stroke(); c.beginPath(); c.moveTo(rx+19,ry); c.lineTo(bx+2,ry-1); c.stroke(); return; }
  // 網子（進球時晃動）
  const sw=swish>0?Math.sin(t*40)*swish*4:0; c.strokeStyle='rgba(255,255,255,.85)'; c.lineWidth=1;
  for(let i=0;i<=6;i++){ const u=i/6,x0=rx-19+u*38,x1=rx-11+u*22+sw; c.beginPath(); c.moveTo(x0,ry); c.lineTo(x1,ry+26); c.stroke(); }
  for(let k=1;k<=3;k++){ const yy=ry+k*8.6,hw=19-k*2.7; c.beginPath(); c.ellipse(rx+sw*k/3,yy,hw,3.6-k*.6,0,0,Math.PI); c.stroke(); }
  c.strokeStyle='#e8501e'; c.lineWidth=3; c.beginPath(); c.ellipse(rx,ry,19,5.5,0,0,Math.PI); c.stroke(); }

/* ---------- 遊戲本體 ---------- */
function create(env,opts){
  const si=clamp(opts.stage|0,0,STAGES.length-1),ST=STAGES[si],CT=COURT[ST.court],OP=opts.options||{},net=opts.net,client=!!net&&!net.host,local2=!net&&opts.mode==='2p';
  const coop=(OP.team==='coop')&&(local2||net&&net.count>1),TARGET=+OP.to||11,TLIM=(+OP.time||4)*60;
  const {ctx:c,canvas}=env.canvas2d(W,H),sfx=n=>{ env.sfx(n); if(net&&net.host) evq.push(n); };
  const myL=opts.look||{},jcol=myL.color||'#3d8bff',myHair=+(myL.hair||0),mySkin=SKINS[+(myL.skin||1)]||SKINS[1];
  // 誰控制誰：team 0＝自己（左邊進攻往右），team 1＝對手；雙人對打時 team 1 由 2P 控制
  const humanTeams=net?(net.count>1?(coop?[0,0]:[0,1]):[0]):local2?(coop?[0,0]:[0,1]):[0];
  const P=[]; for(let tm=0;tm<2;tm++) for(let k=0;k<3;k++){ const mine=tm===0,foeCol=ST.col;
    P.push({i:P.length,tm,k,x:0,y:0,z:0,vx:0,vy:0,vz:0,face:tm?-1:1,pose:'idle',act:null,actT:0,fallT:0,stunT:0,
      look:mine?{col:k===0?jcol:jcol,col2:'#ffffff',skin:k===0?mySkin:SKINS[(k*2+1)%6],hair:k===0?myHair:(k+1)%5,hairCol:HAIRC[k===0?+(myL.hairCol||0):(k*2)%6],shoe:myL.shoe||'#f4f4f4',num:[7,23,11][k],sleeve:k===1?'#ffffff':null,sock:k===2}
        :{col:foeCol,col2:ST.col2,skin:SKINS[(si+k*3)%6],hair:(si+k)%5,hairCol:HAIRC[(si*2+k)%6],shoe:k%2?'#1e1e24':'#f4f4f4',num:[3,10,33][k],sock:k===1,band:ST.col2},
      name:mine?(k===0?(opts.name||'你'):['阿翔','小林','大頭'][k]):ST.names[k],skill:mine?.7:ST.ai}); }
  // 人類控制的球員（每個人類一位，可以換人）
  const ctrl=humanTeams.map((tm,h)=>({tm,pi:tm*3+(coop&&h===1?1:0),sp:0}));
  let ball={h:-1,x:0,y:0,z:0,vx:0,vy:0,vz:0,shot:null,pass:null},score=[0,0],pos=0,cleared=true,clock=12,time=TLIM,t=0,pause=1.6,msg='',msgT=0,swish=0,over=null,ended=false,evq=[],sendT=0,meter=[0,0],lastTouch=-1,sudden=false,introT=2.5;
  const say=(s,d)=>{ msg=s; msgT=d||1.8; };
  function setupCheck(team){ // 進攻方在弧頂拿球（check ball），防守方站在前面
    pos=team; cleared=true; clock=12; ball.shot=null; ball.pass=null;
    const off=P.filter(p=>p.tm===team),def=P.filter(p=>p.tm!==team),spots=[[440,320],[560,140],[560,500]];
    off.forEach((p,j)=>{ p.x=spots[j][0]; p.y=spots[j][1]; p.z=p.vz=p.vx=p.vy=0; p.act=null; p.fallT=0; p.face=1; });
    def.forEach((p,j)=>{ p.x=spots[j][0]+70; p.y=spots[j][1]; p.z=p.vz=p.vx=p.vy=0; p.act=null; p.fallT=0; p.face=-1; });
    ball.h=off[0].i; let h=0; for(const cc of ctrl) if(cc.tm===team) cc.pi=off[h++].i; pause=1.2; }
  setupCheck(opts.first===1?1:0);
  const holder=()=>ball.h>=0?P[ball.h]:null,distHoop=p=>Math.hypot(HX-p.x,HY-p.y),inArc=p=>distHoop(p)<ARC;
  const teammates=p=>P.filter(q=>q.tm===p.tm&&q!==p),foes=p=>P.filter(q=>q.tm!==p.tm);
  // 投籃：成功率看距離、出手時機、防守干擾、球員能力
  function release(p,quality,special){ const d=distHoop(p),two=!inArc(p)&&!special;
    if(!cleared&&p.tm!==pos){ cleared=true; }
    if(!cleared){ say('要先把球運到弧頂外（清球）'); return; }
    let base=special?.97:d<110?.78:d<200?.56:d<ARC?.46:.36; base*=lerp(.45,1.12,clamp(quality,0,1))*(.85+p.skill*.25);
    let contest=0; for(const q of foes(p)){ const dd=Math.hypot(q.x-p.x,q.y-p.y); if(dd<60) contest=Math.max(contest,(q.z>15?.55:.25)*(1-dd/60)); } base*=1-contest;
    const make=Math.random()<clamp(base,.03,.98),T=special?.5:.55+d/900;
    ball.shot={from:[p.x,p.y,p.z+70],t:0,T,make,pts:special?2:two?2:1,by:p.i,tm:p.tm,special,peak:special?20:60+d*.25,dunk:d<120&&!special};
    ball.h=-1; lastTouch=p.i; p.act=null; sfx(special?'boost':'place'); if(special){ meter[p.tm]=0; say('必殺灌籃！',1.4); } }
  function startShot(p,special){ if(p.z>2||p.fallT>0) return;
    const d=distHoop(p),mv=Math.hypot(p.vx,p.vy);
    if(special){ p.act='dunk'; p.actT=0; p.vz=520; p.dunkFrom=[p.x,p.y]; ball.dunk={p:p.i,special:true}; return; }
    if(d<115&&mv>60){ p.act='dunk'; p.actT=0; p.vz=430; p.dunkFrom=[p.x,p.y]; ball.dunk={p:p.i}; return; }
    p.act='shoot'; p.actT=0; p.vz=380; p.relQ=null; }
  function doPass(p,dirX,dirY){ const mates=teammates(p); let best=null,bs=-1e9; const dl=Math.hypot(dirX,dirY);
    for(const q of mates){ const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy)||1,al=dl?(dx*dirX+dy*dirY)/(d*dl):0; const sc=al*2-d/400; if(sc>bs){ bs=sc; best=q; } }
    if(!best) return; ball.pass={from:[p.x,p.y,40],to:best.i,t:0,T:Math.hypot(best.x-p.x,best.y-p.y)/700+.12}; ball.h=-1; lastTouch=p.i; sfx('click'); }
  function trySteal(p){ const hd=holder(); if(!hd||hd.tm===p.tm||p.fallT>0) return; const d=Math.hypot(hd.x-p.x,hd.y-p.y); if(d>34){ p.stunT=.15; return; }
    if(Math.random()<.22+p.skill*.25-(hd.act?-.15:0)){ ball.h=p.i; hd.fallT=.75; hd.act=null; lastTouch=p.i; if(p.tm!==pos){ pos=p.tm; cleared=false; clock=12; } meter[p.tm]=Math.min(1,meter[p.tm]+.25); sfx('hurt'); say((p.tm===0?'':'')+'抄截成功！',1.2); }
    else { p.stunT=.45; p.fallT=0; sfx('bump'); } }
  function changePossession(team,why){ pos=team; cleared=false; clock=12; if(why) say(why); }
  function scored(sh){ score[sh.tm]+=sh.pts; swish=1; sfx('win'); meter[sh.tm]=Math.min(1,meter[sh.tm]+.34); say(P[sh.by].name+' 得 '+sh.pts+' 分！',1.6);
    if(score[sh.tm]>=TARGET||sudden){ over={win:sh.tm}; return; } pause=1.3; pendingCheck=1-sh.tm; }
  let pendingCheck=-1;
  // 移動與動作
  function stepPlayer(p,inp,dt){
    if(p.fallT>0){ p.fallT-=dt; p.vx*=.9; p.vy*=.9; p.pose='fall'; }
    else if(p.stunT>0){ p.stunT-=dt; p.vx*=.85; p.vy*=.85; }
    else if(!p.act||p.act==='shoot'&&p.z<1){ const sp=(holder()===p?205:230)*(.9+p.skill*.12); const l=Math.hypot(inp.mx,inp.my)||1; p.vx+=((inp.mx/l)*sp*(inp.mx||inp.my?1:0)-p.vx)*Math.min(1,dt*10); p.vy+=((inp.my/l)*sp*(inp.mx||inp.my?1:0)-p.vy)*Math.min(1,dt*10); if(inp.mx) p.face=Math.sign(inp.mx); }
    if(p.act==='dunk'){ p.actT+=dt; const u=clamp(p.actT/.5,0,1); p.x=lerp(p.dunkFrom[0],HX-14,u); p.y=lerp(p.dunkFrom[1],HY,u); p.face=1; if(u>=1&&ball.dunk&&ball.dunk.p===p.i){ // 灌進去
        let blocked=false; if(!ball.dunk.special) for(const q of foes(p)) if(q.z>30&&Math.hypot(q.x-p.x,q.y-p.y)<40&&Math.random()<.35+q.skill*.3) blocked=true;
        const sp=ball.dunk.special; ball.dunk=null;
        if(blocked){ ball.h=-1; ball.x=p.x; ball.y=p.y; ball.z=RIMZ; ball.vx=-260; ball.vy=(Math.random()-.5)*200; ball.vz=120; p.act=null; sfx('bump'); say('蓋火鍋！',1.3); }
        else { if(!cleared&&p.tm===pos){ say('要先清球'); ball.h=p.i; p.act=null; } else { ball.h=-1; ball.x=HX; ball.y=HY; ball.z=RIMZ-5; ball.vx=ball.vy=0; ball.vz=-60; scored({tm:p.tm,pts:sp?2:1,by:p.i}); p.act='hang'; p.actT=0; sfx('boom'); if(sp) meter[p.tm]=0; } } } }
    if(p.act==='hang'){ p.actT+=dt; if(p.actT>.35) p.act=null; }
    if(p.act==='shoot'){ p.actT+=dt; if(holder()===p&&p.vz<-60&&p.relQ==null){ p.relQ=.2; release(p,.2); } }
    if(p.act==='block'){ p.actT+=dt; if(p.z<=0&&p.actT>.1) p.act=null; }
    p.vz-=1300*dt; p.z=Math.max(0,p.z+p.vz*dt); if(p.z<=0){ p.vz=0; if(p.act==='shoot'&&p.actT>.2) p.act=null; }
    p.x=clamp(p.x+p.vx*dt,40,800); p.y=clamp(p.y+p.vy*dt,10,630);
    // 姿勢
    if(p.fallT<=0){ const mv=Math.hypot(p.vx,p.vy)>40; p.pose=p.act==='dunk'||p.act==='hang'?'dunk':p.act==='shoot'?(p.z<4&&p.actT<.08?'shootPrep':'shoot'):p.act==='block'||p.z>4?'jump':holder()===p?(mv?'dribble':'dribble'):pos!==p.tm&&!mv?'defend':mv?'run':'idle'; } }
  // 電腦
  function aiInput(p,dt){ const inp={mx:0,my:0,shoot:false,pass:false,jump:false,special:false},hd=holder(),me=p,go=(x,y,stop)=>{ const dx=x-me.x,dy=y-me.y,d=Math.hypot(dx,dy); if(d>(stop||8)){ inp.mx=dx/d; inp.my=dy/d; } };
    p.aiT=(p.aiT||0)-dt; const sk=p.skill;
    if(ball.h<0&&!ball.shot&&!ball.pass){ // 搶籃板／地板球
      const near=P.filter(q=>q.tm===p.tm).sort((a,b)=>Math.hypot(a.x-ball.x,a.y-ball.y)-Math.hypot(b.x-ball.x,b.y-ball.y)); if(near[0]===p||near[1]===p){ go(ball.x,ball.y,2); if(ball.z>40&&ball.z<150&&Math.hypot(ball.x-p.x,ball.y-p.y)<40&&p.z<1) inp.jump=true; } else go(560,320); return inp; }
    if(ball.shot){ if(p.tm!==ball.shot.tm){ const shooter=P[ball.shot.by]; if(ball.shot.t<.15&&Math.hypot(shooter.x-p.x,shooter.y-p.y)<55&&p.z<1&&Math.random()<sk*.5) inp.jump=true; } go(HX-90+(p.k-1)*40,HY+(p.k-1)*90); return inp; }
    if(!hd) return inp;
    if(hd.tm===p.tm){ // 進攻
      if(hd===p){ const d=distHoop(p),open=foes(p).every(q=>Math.hypot(q.x-p.x,q.y-p.y)>70);
        if(!cleared){ go(HX-ARC-40,HY+(p.y<HY?-60:60)); return inp; }
        if(meter[p.tm]>=1&&d<ARC+40&&Math.random()<.02) { inp.special=true; return inp; }
        const lane=foes(p).every(q=>{ const t2=((q.x-p.x)*(HX-p.x)+(q.y-p.y)*(HY-p.y))/((HX-p.x)**2+(HY-p.y)**2||1); if(t2<0||t2>1) return true; const px=p.x+(HX-p.x)*t2,py=p.y+(HY-p.y)*t2; return Math.hypot(q.x-px,q.y-py)>35; });
        if(lane&&d<260&&sk>.3){ go(HX-20,HY); if(d<110&&Math.random()<.2) inp.shoot=true; return inp; }
        if((open&&(d>ARC+5&&d<ARC+70||d<200)&&p.aiT<=0)||clock<2.5){ inp.shoot=true; p.aiT=1; return inp; }
        if(p.aiT<=0&&Math.random()<.025+sk*.01){ const mates=teammates(p).filter(q=>foes(q).every(f=>Math.hypot(f.x-q.x,f.y-q.y)>55)); if(mates.length){ const q=mates[0]; inp.pass=true; inp.mx=q.x-p.x; inp.my=q.y-p.y; p.aiT=.6; return inp; } }
        p.wx=p.wx==null||Math.random()<.01?HX-120-Math.random()*200:p.wx; p.wy=p.wy==null||Math.random()<.01?140+Math.random()*360:p.wy; go(p.wx,p.wy,20); return inp; }
      const spots=[[HX-ARC-30,HY],[HX-150,90],[HX-150,550],[HX-60,HY+130],[HX-60,HY-130]],sp=spots[(p.k+(Math.floor(t/5)%2))%spots.length]; go(sp[0],sp[1],12); return inp; }
    // 防守：每人盯一個，站在對手和籃框之間
    const opp=P.find(q=>q.tm!==p.tm&&q.k===p.k),tx=lerp(opp.x,HX,.18),ty=lerp(opp.y,HY,.18); go(tx,ty,6);
    if(opp===hd&&Math.hypot(opp.x-p.x,opp.y-p.y)<32&&p.aiT<=0&&Math.random()<.02+sk*.05){ inp.shoot=true; p.aiT=1.2; }
    if(opp===hd&&opp.act==='shoot'&&opp.actT<.2&&Math.hypot(opp.x-p.x,opp.y-p.y)<60&&p.z<1&&Math.random()<sk*.6) inp.jump=true;
    return inp; }
  // 人類輸入
  const KM=[{u:'ArrowUp',d:'ArrowDown',l:'ArrowLeft',r:'ArrowRight',s:['KeyJ','KeyX'],p:['KeyK','KeyC'],j:['KeyL','Space'],x:['KeyI','KeyV']},
    {u:'KeyW',d:'KeyS',l:'KeyA',r:'KeyD',s:['KeyF'],p:['KeyG'],j:['KeyH'],x:['KeyR']},{u:'ArrowUp',d:'ArrowDown',l:'ArrowLeft',r:'ArrowRight',s:['Comma'],p:['Period'],j:['Slash'],x:['KeyM']}];
  function readIn(h){ const m=local2?KM[h+1]:KM[0],K=env.keys,any=a=>a.some(k=>env.hit(k)),held=a=>a.some(k=>K[k]);
    return {mx:(K[m.r]?1:0)-(K[m.l]?1:0),my:(K[m.d]?1:0)-(K[m.u]?1:0),shoot:any(m.s),shootHeld:held(m.s),pass:any(m.p),jump:any(m.j),special:any(m.x)}; }
  const remoteIn={mx:0,my:0,shoot:false,shootHeld:false,pass:false,jump:false,special:false};
  function humanAct(p,inp,cc){ const hd=holder();
    if(hd===p){ if(inp.special&&meter[p.tm]>=1){ startShot(p,true); return; } if(inp.shoot) startShot(p,false); if(inp.pass) doPass(p,inp.mx||p.face,inp.my); }
    else if(hd&&hd.tm===p.tm){ if(inp.pass){ /* 叫球：持球的隊友把球傳給我 */ ball.pass={from:[hd.x,hd.y,40],to:p.i,t:0,T:Math.hypot(hd.x-p.x,hd.y-p.y)/700+.12}; ball.h=-1; sfx('click'); } }
    else { if(inp.shoot) trySteal(p); if(inp.pass){ // 換人：換到離球最近的隊友
        const mates=P.filter(q=>q.tm===p.tm&&!ctrl.some(o=>o!==cc&&o.pi===q.i)).sort((a,b)=>Math.hypot(a.x-ball.x,a.y-ball.y)-Math.hypot(b.x-ball.x,b.y-ball.y)); if(mates[0]) cc.pi=mates[0].i; } }
    if(inp.jump&&p.z<1&&!p.act&&p.fallT<=0){ p.vz=400; p.act='block'; p.actT=0; }
    // 出手時機：按住投籃鍵跳起來，放開那一刻出手（最高點最準）
    if(p.act==='shoot'&&holder()===p&&p.relQ==null&&!inp.shootHeld&&p.actT>.05){ const apex=380/1300,q=1-Math.abs(p.actT-apex)/apex; p.relQ=q; release(p,q); showQ=q; showQT=1; } }
  let showQ=0,showQT=0;
  function aiAct(p,inp){ const hd=holder();
    if(hd===p){ if(inp.special&&meter[p.tm]>=1) startShot(p,true); else if(inp.shoot) startShot(p,false); else if(inp.pass) doPass(p,inp.mx,inp.my); }
    else if(inp.shoot) trySteal(p);
    if(inp.jump&&p.z<1&&!p.act&&p.fallT<=0){ p.vz=400; p.act='block'; p.actT=0; }
    if(p.act==='shoot'&&holder()===p&&p.relQ==null){ const apex=380/1300; p.aiRel=p.aiRel??apex+(Math.random()-.5)*(1-p.skill)*.35; if(p.actT>=p.aiRel){ p.relQ=1-Math.abs(p.actT-apex)/apex; release(p,p.relQ); p.aiRel=null; } } }
  // 球
  function stepBall(dt){
    if(ball.h>=0){ const p=P[ball.h]; ball.x=p.x+p.face*12; ball.y=p.y+2; const dr=p.pose==='dribble'||p.pose==='idle'; ball.z=p.act==='shoot'||p.act==='dunk'||p.z>2?p.z+66:dr?Math.abs(Math.sin(t*9))*28+4:30; ball.vx=ball.vy=ball.vz=0; return; }
    if(ball.pass){ const ps=ball.pass,q=P[ps.to]; ps.t+=dt; const u=Math.min(1,ps.t/ps.T); ball.x=lerp(ps.from[0],q.x,u); ball.y=lerp(ps.from[1],q.y,u); ball.z=lerp(ps.from[2],40,u)+Math.sin(u*Math.PI)*24;
      for(const f of foes(q)){ if(f.fallT>0) continue; if(Math.hypot(f.x-ball.x,f.y-ball.y)<16&&u>.2&&u<.85&&Math.random()<.04+f.skill*.05){ ball.pass=null; ball.h=f.i; changePossession(f.tm,'傳球被抄走！'); sfx('hurt'); return; } }
      if(u>=1){ ball.pass=null; ball.h=q.i; } return; }
    if(ball.shot){ const s=ball.shot; s.t+=dt; const u=Math.min(1,s.t/s.T); ball.x=lerp(s.from[0],HX,u); ball.y=lerp(s.from[1],HY,u); ball.z=lerp(s.from[2],RIMZ+6,u)+Math.sin(u*Math.PI)*s.peak;
      if(u<.35&&!s.special) for(const f of P){ if(f.tm===s.tm||f.z<25) continue; if(Math.hypot(f.x-ball.x,f.y-ball.y)<30&&Math.abs(f.z+75-ball.z)<30&&Math.random()<.3+f.skill*.25){ ball.shot=null; ball.vx=-200-Math.random()*150; ball.vy=(Math.random()-.5)*300; ball.vz=150; sfx('bump'); say('蓋火鍋！',1.3); meter[f.tm]=Math.min(1,meter[f.tm]+.25); changePossession(f.tm); return; } }
      if(u>=1){ ball.shot=null;
        if(s.make){ ball.x=HX; ball.y=HY; ball.z=RIMZ-4; ball.vx=0; ball.vy=0; ball.vz=-80; if(!cleared&&s.tm===pos){} scored(s); }
        else { const a=Math.random()*Math.PI*.9+Math.PI*.55; ball.vx=Math.cos(a)*200; ball.vy=Math.sin(a)*240; ball.vz=200+Math.random()*120; sfx('bump'); } }
      return; }
    // 地板球、彈框：重力、彈地
    ball.vz-=900*dt; ball.x+=ball.vx*dt; ball.y+=ball.vy*dt; ball.z+=ball.vz*dt;
    if(ball.z<=0){ ball.z=0; ball.vz=Math.abs(ball.vz)>60?-ball.vz*.6:0; ball.vx*=.85; ball.vy*=.85; }
    if(ball.x<40||ball.x>810){ ball.vx*=-.6; ball.x=clamp(ball.x,40,810); } if(ball.y<10||ball.y>630){ ball.vy*=-.6; ball.y=clamp(ball.y,10,630); }
    if(pause>0) return;
    for(const p of P){ if(p.fallT>0) continue; const reach=p.z>5?p.z+95:60; if(Math.hypot(p.x-ball.x,p.y-ball.y)<26&&ball.z<reach){ ball.h=p.i; lastTouch=p.i; if(p.tm!==pos){ changePossession(p.tm,p.tm===0||coop?'搶到籃板！':'被搶走了！'); } else { cleared=cleared; clock=Math.max(clock,6); } sfx('click'); break; } } }
  // 連線
  const pk=()=>({P:P.map(p=>[R1(p.x),R1(p.y),R1(p.z),p.face,p.pose,p.act||'',R1(p.actT)]),b:[ball.h,R1(ball.x),R1(ball.y),R1(ball.z)],s:score,pos,cl:cleared?1:0,ck:R1(clock),tm:R1(time),m:meter.map(R1),ct:ctrl.map(o=>o.pi),msg,mt:R1(msgT),sw:R1(swish),ev:evq,ov:over,sd:sudden?1:0});
  if(net){
    if(client) net.onmsg=m=>{ if(!m.s) return; const S=m.s; S.P.forEach((a,i)=>{ const p=P[i]; p.tx=a[0]; p.ty=a[1]; p.z=a[2]; p.face=a[3]; p.pose=a[4]; p.act=a[5]||null; p.actT=a[6]; if(p.x===0&&p.y===0){ p.x=a[0]; p.y=a[1]; } });
      ball.h=S.b[0]; ball.x=S.b[1]; ball.y=S.b[2]; ball.z=S.b[3]; score=S.s; pos=S.pos; cleared=!!S.cl; clock=S.ck; time=S.tm; meter=S.m; S.ct.forEach((v,i)=>{ if(ctrl[i]) ctrl[i].pi=v; }); if(S.msg!==msg||S.mt>msgT){ msg=S.msg; msgT=S.mt; } swish=Math.max(swish,S.sw); for(const n of S.ev) env.sfx(n); if(S.ov) over=S.ov; sudden=!!S.sd; };
    else net.onmsg=(m,from)=>{ if(from!==1||!m.i) return; remoteIn.mx=m.i[0]; remoteIn.my=m.i[1]; remoteIn.shootHeld=!!m.i[2]; if(m.i[3]) remoteIn.shoot=true; if(m.i[4]) remoteIn.pass=true; if(m.i[5]) remoteIn.jump=true; if(m.i[6]) remoteIn.special=true; };
  }
  let sentHit={s:0,p:0,j:0,x:0};
  function update(dt){
    t+=dt; if(msgT>0) msgT-=dt; if(swish>0) swish-=dt*1.4; if(showQT>0) showQT-=dt;
    if(introT>0){ introT-=dt; if(!net&&(env.hit('Space')||env.hit('Enter'))) introT=0; return; }
    if(client){ const inp=readIn(0); if(inp.shoot) sentHit.s++; if(inp.pass) sentHit.p++; if(inp.jump) sentHit.j++; if(inp.special) sentHit.x++;
      sendT-=dt; if(sendT<=0){ sendT=1/30; net.send({i:[inp.mx,inp.my,inp.shootHeld?1:0,sentHit.s,sentHit.p,sentHit.j,sentHit.x]}); sentHit={s:0,p:0,j:0,x:0}; }
      for(const p of P){ if(p.tx!=null){ const f=Math.min(1,dt*14); p.x+=(p.tx-p.x)*f; p.y+=(p.ty-p.y)*f; } }
      if(over&&!ended){ ended=true; setTimeout(finish,2200); } return; }
    if(ended) return;
    if(over){ ended=true; setTimeout(finish,2200); if(net) net.send({s:pk()}); return; }
    if(pause>0){ pause-=dt; stepBall(dt); if(pause<=0&&pendingCheck>=0){ setupCheck(pendingCheck); pendingCheck=-1; } return; }
    time-=dt; if(time<=0&&!sudden){ if(score[0]!==score[1]){ over={win:score[0]>score[1]?0:1}; } else { sudden=true; say('時間到！平手，下一球決勝負',2.5); } }
    if(ball.h>=0||ball.pass){ clock-=dt; if(clock<=0){ changePossession(1-pos,'進攻超過 12 秒，換對方'); ball.h=-1; ball.pass=null; const p=P.find(q=>q.tm===pos); setupCheck(pos); } }
    for(const p of P){ const cc=ctrl.find(o=>o.pi===p.i); let inp;
      if(cc){ const hIdx=ctrl.indexOf(cc); inp=net&&hIdx===1?{...remoteIn}:readIn(local2?hIdx:0); if(net&&hIdx===1){ remoteIn.shoot=remoteIn.pass=remoteIn.jump=remoteIn.special=false; } humanAct(p,inp,cc); }
      else { inp=aiInput(p,dt); aiAct(p,inp); }
      stepPlayer(p,inp,dt); }
    // 拿到球的人類隊伍：自動換成持球者（進攻時控制拿球的人）
    for(const cc of ctrl){ const hd=holder(); if(hd&&hd.tm===cc.tm&&!ctrl.some(o=>o!==cc&&o.pi===hd.i)) cc.pi=hd.i; }
    // 球員之間不重疊
    for(let a=0;a<6;a++) for(let b=a+1;b<6;b++){ const A=P[a],B=P[b],dx=B.x-A.x,dy=B.y-A.y,d=Math.hypot(dx,dy); if(d<22&&d>.1){ const k=(22-d)/2/d; A.x-=dx*k; A.y-=dy*k; B.x+=dx*k; B.y+=dy*k; } }
    stepBall(dt);
    // 進攻方投進要先清球：拿到球後運到弧頂外就算清好
    const hd=holder(); if(hd&&hd.tm===pos&&!cleared&&!inArc(hd)){ cleared=true; if(ctrl.some(o=>o.tm===pos)) say('清球完成，可以進攻了',1.2); }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/20; net.send({s:pk()}); evq=[]; } } }
  function finish(){ const w=over.win,meWin=!local2&&w===0||coop&&w===0;
    const html='<table class="ls"><tr><th>隊伍</th><th>得分</th></tr><tr><td>'+(local2&&!coop?'1P 隊':'你的隊伍')+'</td><td>'+score[0]+'</td></tr><tr><td>'+(local2&&!coop?'2P 隊':ST.name)+'</td><td>'+score[1]+'</td></tr></table>';
    const title=local2&&!coop?(w===0?'1P 隊獲勝！':'2P 隊獲勝！'):net&&!coop?(w===(net.me===0?0:1)?'你贏了！':'對手獲勝'):meWin?'你贏了！':ST.name+' 獲勝';
    if(meWin&&!net&&!local2){ try{ const k='arcade.bball.best',old=+localStorage.getItem(k)||0; if(si+1>old) localStorage.setItem(k,String(si+1)); localStorage.setItem('arcade.bball.w.'+si,'1'); }catch(e){} }
    env.sfx(title.includes('贏')||title.includes('獲勝！')?'win':'lose'); env.end({title,big:score[0]+' : '+score[1],html,text:'先拿到 '+TARGET+' 分或時間到分數多的贏。弧頂內 1 分、外 2 分，必殺灌籃 2 分。',score:meWin&&!net&&!local2?si+1:null,next:meWin&&!net&&!local2&&si<STAGES.length-1}); }
  function draw(){
    drawCourt(c,CT,t,swish);
    drawHoop(c,CT,t,swish,false);
    // 依深度排序畫球員和球
    const items=P.map(p=>({y:p.y,f:()=>{ const s=SC(p.y),cc=ctrl.find(o=>o.pi===p.i); const r=drawBaller(c,SX(p.x),SY(p.y),p.z*.9,s*1.15,Object.assign({face:p.face,pose:p.pose,t:t+p.i*.7},p.look));
      if(cc){ const hi=ctrl.indexOf(cc),col=hi===0?'#ffd23f':'#3ddbd9'; c.strokeStyle=col; c.lineWidth=2.5; c.beginPath(); c.ellipse(SX(p.x),SY(p.y),15*s,5*s,0,0,7); c.stroke();
        c.fillStyle=col; c.font='900 12px '+TC; c.textAlign='center'; c.textBaseline='bottom'; const tag=local2||coop&&ctrl.length>1?(hi+1)+'P':'你'; c.fillText(tag,SX(p.x),SY(p.y)-p.z*.9-80*s); c.beginPath(); c.moveTo(SX(p.x)-5,SY(p.y)-p.z*.9-78*s); c.lineTo(SX(p.x)+5,SY(p.y)-p.z*.9-78*s); c.lineTo(SX(p.x),SY(p.y)-p.z*.9-72*s); c.fill();
        if(introT>0||pause>0&&t<3){ const yy=SY(p.y)-p.z*.9-100*s+Math.sin(t*8)*5; c.fillStyle=col; c.strokeStyle='#0b0a1c'; c.lineWidth=3; c.beginPath(); c.moveTo(SX(p.x)-14,yy-20); c.lineTo(SX(p.x)+14,yy-20); c.lineTo(SX(p.x),yy); c.closePath(); c.stroke(); c.fill(); } }
      else if(p.tm===0&&!coop&&local2===false){} } }));
    items.push({y:ball.y+.5,f:()=>{ const s=SC(ball.y); c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(SX(ball.x),SY(ball.y),7*s,2.5*s,0,0,7); c.fill(); drawBallSpr(c,SX(ball.x),SY(ball.y)-ball.z*.9-6*s,6.5*s,t); }});
    items.sort((a,b)=>a.y-b.y); for(const it of items) it.f();
    drawHoop(c,CT,t,swish,true);
    // 計分板
    c.fillStyle='rgba(11,10,28,.82)'; rr(c,W/2-190,6,380,54,12); c.fill();
    c.fillStyle=jcol; c.fillRect(W/2-180,14,8,38); c.fillStyle=ST.col; c.fillRect(W/2+172,14,8,38);
    c.fillStyle='#fff'; c.font='900 13px '+TC; c.textAlign='left'; c.textBaseline='middle'; c.fillText(local2&&!coop?'1P 隊':'你的隊伍',W/2-166,24); c.textAlign='right'; c.fillText(local2&&!coop?'2P 隊':ST.name,W/2+166,24);
    c.font='900 24px '+PIX; c.fillStyle='#ffd23f'; c.textAlign='center'; c.fillText(score[0]+' - '+score[1],W/2,40);
    const tm=Math.max(0,Math.ceil(time)); c.font='700 11px '+TC; c.fillStyle='#cfe8d8'; c.fillText((sudden?'決勝球　':Math.floor(tm/60)+':'+String(tm%60).padStart(2,'0')+'　')+'搶 '+TARGET+' 分',W/2,54);
    c.textAlign='left'; c.fillStyle=clock<4?'#ff8a8a':'#fff'; c.font='900 15px '+PIX; c.fillText(String(Math.max(0,Math.ceil(clock))),W/2-166,46); c.font='700 9px '+TC; c.fillText('進攻時間',W/2-128,47);
    // 必殺氣力
    for(let tm2=0;tm2<2;tm2++){ const x=tm2?W-160:16,y=H-20; c.fillStyle='rgba(11,10,28,.7)'; rr(c,x,y-12,144,22,10); c.fill(); c.fillStyle=meter[tm2]>=1?'hsl('+(t*300%360)+',90%,60%)':'#ff9d3d'; rr(c,x+4,y-8,136*meter[tm2],14,7); c.fill(); c.fillStyle='#fff'; c.font='900 10px '+TC; c.textAlign='center'; c.fillText(meter[tm2]>=1?'必殺灌籃 OK！':'必殺',x+72,y); }
    if(!cleared&&ctrl.some(o=>o.tm===pos)){ c.fillStyle='rgba(180,30,50,.85)'; rr(c,W/2-120,68,240,24,12); c.fill(); c.fillStyle='#fff'; c.font='900 12px '+TC; c.textAlign='center'; c.fillText('先把球運到弧頂外（清球）',W/2,80); }
    if(showQT>0){ c.fillStyle='rgba(11,10,28,.7)'; rr(c,W/2-80,96,160,22,10); c.fill(); c.fillStyle=showQ>.8?'#5fd068':showQ>.5?'#ffd23f':'#ff8a8a'; c.font='900 12px '+TC; c.textAlign='center'; c.fillText(showQ>.8?'完美出手！':showQ>.5?'出手不錯':'出手太早／太晚',W/2,107); }
    // 投籃時機條
    for(const cc of ctrl){ const p=P[cc.pi]; if(p.act==='shoot'&&holder()===p&&p.relQ==null){ const apex=380/1300,u=clamp(p.actT/(apex*2),0,1),x=SX(p.x)+22,y=SY(p.y)-90; c.fillStyle='rgba(11,10,28,.7)'; c.fillRect(x,y,8,50); c.fillStyle='#5fd068'; c.fillRect(x,y+20,8,10); c.fillStyle='#fff'; c.fillRect(x-2,y+50-u*50,12,3); } }
    if(msgT>0&&msg){ c.font='900 20px '+TC; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='#0b0a1c'; c.strokeText(msg,W/2,H*.42); c.fillStyle='#ffd23f'; c.fillText(msg,W/2,H*.42); }
    if(introT>0){ c.fillStyle='rgba(11,10,28,.6)'; rr(c,W/2-210,170,420,90,16); c.fill(); c.fillStyle='#ffd23f'; c.font='900 24px '+TC; c.textAlign='center'; c.fillText('對手：'+ST.name,W/2,200); c.fillStyle='#fff'; c.font='700 13px '+TC; c.fillText('3 對 3 半場鬥牛：先拿到 '+TARGET+' 分的贏',W/2,228); c.fillText(pos===0?'你們先攻':'對手先攻',W/2,248); } }
  return {update,draw,destroy(){},_dbg:{P,get ball(){return ball;},get score(){return score;},ctrl,get over(){return over;}}};
}

/* ---------- 開始畫面、縮圖、造型預覽 ---------- */
function stageShow(ctx,w,h,si,t){ const ST=STAGES[si]; ctx.save(); ctx.scale(w/W,h/H); drawCourt(ctx,COURT[ST.court],t,0); drawHoop(ctx,COURT[ST.court],t,0,false); drawHoop(ctx,COURT[ST.court],t,0,true);
  ST.names.forEach((nm,k)=>{ const x=420+k*110,y=330+(k%2)*60,pose=['defend','dribble','idle'][k]; drawBaller(ctx,x,y,0,1.7,{face:-1,pose,t:t+k,col:ST.col,col2:ST.col2,skin:SKINS[(si+k*3)%6],hair:(si+k)%5,hairCol:HAIRC[(si*2+k)%6],num:[3,10,33][k],band:ST.col2,shoe:k%2?'#1e1e24':'#f4f4f4'});
    ctx.fillStyle='#fff'; ctx.font='900 16px '+TC; ctx.textAlign='center'; ctx.lineWidth=4; ctx.strokeStyle='#0b0a1c'; ctx.strokeText(nm,x,y+24); ctx.fillText(nm,x,y+24); });
  const u=(t%2.4)/2.4,bx=lerp(200,SX(HX),u),by=lerp(330,SY(HY)-RIMZ*.9,u)-Math.sin(u*Math.PI)*90; drawBaller(ctx,200,380,u<.15?u*200:0,1.7,{face:1,pose:u<.2?'shoot':'idle',t,col:'#3d8bff',num:7}); drawBallSpr(ctx,bx,by,9,t);
  ctx.fillStyle='rgba(11,10,28,.7)'; rr(ctx,16,190,330,40,12); ctx.fill(); ctx.fillStyle=ST.col; ctx.font='900 22px '+TC; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('對手：'+ST.name,28,210); ctx.restore(); }
function thumb(ctx,w,h,t){ ctx.save(); ctx.scale(w/W,h/H); drawCourt(ctx,COURT.gym,t,0); drawHoop(ctx,COURT.gym,t,0,false); drawHoop(ctx,COURT.gym,t,0,true);
  const u=(t%2)/2; drawBaller(ctx,560,400,Math.sin(Math.min(1,u*1.4)*Math.PI)*120,2,{face:1,pose:u<.7?'dunk':'idle',t,col:'#3d8bff',num:7,hair:3,band:'#ffffff'}); drawBaller(ctx,700,420,u>.2&&u<.7?60:0,2,{face:-1,pose:u>.2&&u<.7?'jump':'defend',t,col:'#e23b3b',num:23,skin:SKINS[3],hair:1});
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 64px '+TC; ctx.lineWidth=10; ctx.strokeStyle='#0b0a1c'; ctx.strokeText('鬥魂籃球',W/2,110); ctx.fillStyle='#ff9d3d'; ctx.fillText('鬥魂籃球',W/2,110); ctx.restore(); }
function preview(ctx,w,h,L,t){ ctx.save(); ctx.scale(w/W,h/H); drawCourt(ctx,COURT.park,t,0); L=L||{};
  const o={col:L.color||'#3d8bff',skin:SKINS[+(L.skin||1)],hair:+(L.hair||0),hairCol:HAIRC[+(L.hairCol||0)],shoe:L.shoe||'#f4f4f4',num:7};
  drawBaller(ctx,260,440,0,2.6,Object.assign({face:1,pose:'idle',t},o)); drawBaller(ctx,540,440,Math.abs(Math.sin(t*2))*20,2.6,Object.assign({face:1,pose:'dribble',t},o)); drawBallSpr(ctx,575,440-Math.abs(Math.sin(t*9))*60-10,14,t); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).bball={
  coin:o=>({verb:'先攻',names:o.net?[o.net.names[0]||'玩家 1',o.net.count>1&&(o.options||{}).team!=='coop'?(o.net.names[1]||'玩家 2'):STAGES[o.stage||0].name]:o.mode==='2p'&&(o.options||{}).team!=='coop'?['1P 隊','2P 隊']:['你的隊伍',STAGES[o.stage||0].name]}),
  name:'鬥魂籃球',tag:'BASKETBALL',color:'#ff9d3d',online:true,maxPlayers:2,
  desc:'3 對 3 半場鬥牛，寫實的街頭籃球。運球、傳球、跳投抓時機、灌籃、蓋火鍋，沒有犯規可以推人抄球，集滿氣放必殺灌籃。10 支對手、10 種球場，單人、雙人對打或兩人同隊打電腦。',
  goal:'先拿到設定的分數（或時間到分數多）的隊伍贏。弧頂內投進 1 分、弧頂外 2 分。搶到籃板或抄到球要先把球運到弧頂外（清球）才能投。進攻時限 12 秒。按住「投」跳起來，在最高點放開最準；跑向籃框按「投」會灌籃。',
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  stageShow,
  stageBest:i=>{ try{ return localStorage.getItem('arcade.bball.w.'+i)?'★ 贏過':''; }catch(e){ return ''; } },
  stageGoal:si=>'對手：'+STAGES[si].name+'（'+'★'.repeat(STAGES[si].stars)+'）。先拿到設定分數的隊伍贏；弧頂內 1 分、外 2 分；搶到球要先清到外線；12 秒內要出手。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  options:[{key:'to',label:'搶幾分',def:'11',opts:[{id:'7',label:'7 分'},{id:'11',label:'11 分'},{id:'21',label:'21 分'}]},{key:'time',label:'時間',def:'4',opts:[{id:'3',label:'3 分鐘'},{id:'4',label:'4 分鐘'},{id:'6',label:'6 分鐘'}]},
    {key:'team',label:'雙人／連線玩法',def:'pvp',opts:[{id:'pvp',label:'玩家對打'},{id:'coop',label:'兩人同隊打電腦'}]}],
  help:[['↑ ↓ ← →','移動'],['J 或 X','投籃（按住跳起來，最高點放開最準）；跑向籃框是灌籃；防守時抄球、推人'],['K 或 C','傳球；隊友持球時叫球；防守時換人'],['L 或 空白鍵','跳（蓋火鍋、搶籃板）'],['I 或 V','必殺灌籃（氣力條滿時）'],['W A S D F G H R','雙人 1P：移動、投、傳、跳、必殺'],['↑ ↓ ← → , . / M','雙人 2P：移動、投、傳、跳、必殺']],
  touchHelp:[['方向盤','移動'],['投','按住跳起來，最高點放開最準；防守時抄球'],['傳','傳球；防守時換人'],['跳','蓋火鍋、搶籃板'],['必殺','氣力條滿時必殺灌籃']],
  touch:{left:'dpad',right:[{l:'必殺',c:'KeyI'},{l:'跳',c:'KeyL'},{l:'傳',c:'KeyK'},{l:'投',c:'KeyJ',act:true}]},
  looks:[{key:'color',label:'球衣顏色',type:'color',opts:['#3d8bff','#e23b3b','#2e9e4f','#ffd23f','#7a5aff','#ff9d3d','#1e1e24','#f4f4f4']},
    {key:'skin',label:'膚色',opts:SKINS.map((c2,i)=>({id:String(i),label:['白皙','自然','小麥','古銅','深色','淡色'][i]}))},
    {key:'hair',label:'髮型',opts:[{id:'0',label:'短髮'},{id:'1',label:'爆炸頭'},{id:'2',label:'綁辮子'},{id:'3',label:'頭帶'},{id:'4',label:'光頭'}]},
    {key:'hairCol',label:'髮色',opts:HAIRC.map((c2,i)=>({id:String(i),label:['黑','深棕','棕','金','銀','紅'][i]}))},
    {key:'shoe',label:'球鞋',type:'color',opts:['#f4f4f4','#1e1e24','#e23b3b','#3d8bff','#ffd23f','#5fd068']}],
  best:{label:'已打敗',fmt:v=>v+' / '+STAGES.length+' 隊',lower:false},
  preview,thumb,create
};
})();
