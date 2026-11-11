// 樓梯大逃亡：世界座標固定，鏡頭一直往下捲；天花板的尖刺跟著鏡頭走。
(function(){
'use strict';
const W=360,H=540,WALL=14,PW=20,PH=26,PLW=86,PLH=14,GAP=60,HUD=36,TOP=HUD+16,MAXLIFE=12;
const PIX='"Press Start 2P","Noto Sans TC","Microsoft JhengHei",monospace';
const SHIRT=['#ff5d4f','#4f9dff','#5fd068','#ffd23f'];
function rng(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

function pick(prev,n,rnd){
  if(n<4) return 'normal';
  const r=rnd();
  let t=r<.46?'normal':r<.62?'spike':r<.72?'left':r<.82?'right':r<.91?'spring':'fake';
  if(t==='spike'&&prev==='spike') t='normal';
  return t;
}

function drawPlat(ctx,pl,y,t){
  const x=pl.x,w=pl.w; ctx.save();
  /* 影子 */ ctx.fillStyle='rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x+w/2,y+PLH+5,w*.46,4,0,0,7); ctx.fill();
  if(pl.type==='spike'){
    const g=ctx.createLinearGradient(0,y+5,0,y+PLH); g.addColorStop(0,'#9aa0b8'); g.addColorStop(1,'#4a4e66'); ctx.fillStyle=g; rrp(ctx,x,y+5,w,PLH-5,3); ctx.fill();
    ctx.fillStyle='#2a2c3a'; for(let i=6;i<w;i+=14){ ctx.beginPath(); ctx.arc(x+i,y+PLH-4,1.4,0,7); ctx.fill(); }
    for(let i=0;i<w-1;i+=8){ const sg=ctx.createLinearGradient(x+i,0,x+i+8,0); sg.addColorStop(0,'#f4f6ff'); sg.addColorStop(.5,'#b8bcd0'); sg.addColorStop(1,'#6a6e88'); ctx.fillStyle=sg; ctx.beginPath(); ctx.moveTo(x+i,y+6); ctx.lineTo(x+i+4,y-5); ctx.lineTo(x+i+8,y+6); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle='rgba(255,80,90,.5)'; for(let i=0;i<w-1;i+=8){ ctx.beginPath(); ctx.arc(x+i+4,y-4,1.1,0,7); ctx.fill(); }
    ctx.restore(); return; }
  if(pl.type==='left'||pl.type==='right'){
    const g=ctx.createLinearGradient(0,y,0,y+PLH); g.addColorStop(0,'#3a4e86'); g.addColorStop(1,'#1a2448'); ctx.fillStyle=g; rrp(ctx,x,y,w,PLH,PLH/2); ctx.fill();
    ctx.save(); rrp(ctx,x+2,y+2,w-4,PLH-4,PLH/2-2); ctx.clip(); ctx.fillStyle='#24305a'; ctx.fillRect(x,y,w,PLH);
    const dir=pl.type==='left'?-1:1, off=((t*40*dir)%12+12)%12; ctx.fillStyle='#6fd3ff';
    for(let i=-12;i<w+12;i+=12){ const ax=x+i+off; ctx.beginPath(); if(dir>0){ ctx.moveTo(ax,y+4); ctx.lineTo(ax+5,y+7); ctx.lineTo(ax,y+10); } else { ctx.moveTo(ax+5,y+4); ctx.lineTo(ax,y+7); ctx.lineTo(ax+5,y+10); } ctx.fill(); }
    ctx.restore(); for(const k of [x+PLH/2,x+w-PLH/2]){ const rg=ctx.createRadialGradient(k-2,y+5,1,k,y+PLH/2,PLH/2); rg.addColorStop(0,'#e8eef8'); rg.addColorStop(1,'#6a7488'); ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(k,y+PLH/2,PLH/2-1,0,7); ctx.fill(); ctx.save(); ctx.translate(k,y+PLH/2); ctx.rotate(t*6*dir); ctx.strokeStyle='#3a4458'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(-4,0); ctx.lineTo(4,0); ctx.moveTo(0,-4); ctx.lineTo(0,4); ctx.stroke(); ctx.restore(); }
    ctx.restore(); return; }
  if(pl.type==='spring'){
    const sq=pl.sq>0?4*Math.sin(pl.sq*Math.PI/.25):0;
    const bg=ctx.createLinearGradient(0,y+PLH-4,0,y+PLH); bg.addColorStop(0,'#8a8ea8'); bg.addColorStop(1,'#4a4e62'); ctx.fillStyle=bg; rrp(ctx,x+2,y+PLH-4,w-4,4,2); ctx.fill();
    ctx.strokeStyle='#c8ccd8'; ctx.lineWidth=2; for(let i=10;i<w-6;i+=16){ ctx.beginPath(); for(let k=0;k<4;k++){ const yy=y+5+sq+(PLH-9-sq)*k/3; ctx.moveTo(x+i-5,yy); ctx.lineTo(x+i+5,yy+(PLH-9-sq)/6); } ctx.stroke(); }
    const tg=ctx.createLinearGradient(0,y+sq,0,y+sq+6); tg.addColorStop(0,'#ff9abc'); tg.addColorStop(1,'#d8306a'); ctx.fillStyle=tg; rrp(ctx,x,y+sq,w,6,3); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.55)'; ctx.fillRect(x+4,y+sq+1,w-8,1.5);
    ctx.restore(); return; }
  if(pl.type==='fake'){
    const k=pl.flip>0?Math.max(.12,pl.flip/.28):1,yy=y+PLH/2*(1-k),hh=PLH*k;
    const g=ctx.createLinearGradient(0,yy,0,yy+hh); g.addColorStop(0,'#d8a868'); g.addColorStop(1,'#8a5a28'); ctx.fillStyle=g; ctx.fillRect(x,yy,w,hh);
    ctx.strokeStyle='rgba(90,50,20,.6)'; ctx.lineWidth=1; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(x,yy+hh*(i+.5)/3); ctx.lineTo(x+w,yy+hh*(i+.5)/3+(i-1)); ctx.stroke(); }
    ctx.strokeStyle='#3a2410'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(x+w*.45,yy); ctx.lineTo(x+w*.5,yy+hh*.5); ctx.lineTo(x+w*.42,yy+hh); ctx.moveTo(x+w*.5,yy+hh*.5); ctx.lineTo(x+w*.6,yy+hh*.7); ctx.stroke();
    ctx.fillStyle='#c8ccd8'; for(const nx of [x+5,x+w-5]){ ctx.beginPath(); ctx.arc(nx,yy+hh/2,1.6,0,7); ctx.fill(); }
    ctx.restore(); return; }
  /* 一般：石台＋草皮＋小花 */
  const g=ctx.createLinearGradient(0,y+4,0,y+PLH); g.addColorStop(0,'#8a6a4a'); g.addColorStop(1,'#4a3424'); ctx.fillStyle=g; rrp(ctx,x,y+3,w,PLH-3,4); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.18)'; for(let i=7;i<w;i+=13){ ctx.beginPath(); ctx.ellipse(x+i,y+9+(i%3),2.4,1.6,0,0,7); ctx.fill(); }
  const gg=ctx.createLinearGradient(0,y,0,y+6); gg.addColorStop(0,'#a8ec6a'); gg.addColorStop(1,'#4f9a2a'); ctx.fillStyle=gg; rrp(ctx,x-1,y,w+2,6,3); ctx.fill();
  ctx.fillStyle='#4f9a2a'; for(let i=2;i<w;i+=5){ ctx.beginPath(); ctx.moveTo(x+i,y+6); ctx.lineTo(x+i+1.5,y+8.5+(i%2)); ctx.lineTo(x+i+3,y+6); ctx.fill(); }
  ctx.fillStyle='rgba(255,255,255,.35)'; ctx.fillRect(x+3,y+1,w-6,1.2);
  const fx=x+((Math.floor(x)*7)%Math.max(1,w-10))+5; ctx.fillStyle=['#ffd23f','#ff7eb6','#fff'][Math.floor(x)%3]; ctx.beginPath(); ctx.arc(fx,y-1,1.8,0,7); ctx.fill();
  ctx.restore();
}
function rrp(c,x,y,w,h,r){ r=Math.min(r,h/2,w/2); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }

const mixC=(hex,k)=>{ const n=parseInt(String(hex).slice(1),16); if(isNaN(n)) return hex; return 'rgb('+[(n>>16)&255,(n>>8)&255,n&255].map(v=>Math.round(v*k)).join(',')+')'; };
// 人物：Q 版大頭（大眼睛、腮紅、圓鞋子），face 1 向右、-1 向左；掉落時雙手舉高、一臉驚訝
function drawKid(ctx,x,y,face,walk,air,flash,shirt,char){
  if(flash&&Math.floor(flash*20)%2) return;
  const s=Math.sin(walk*14),robot=char==='robot',ninja=char==='ninja',girl=char==='girl',f=face||1;
  const OL='#2a1a26',SK=robot?'#c9d2e0':'#ffe2c6',HAIR=girl?'#8a4a26':'#3a2418',dark=mixC(shirt,.7),now=performance.now()/1000;
  const hop=air?0:Math.abs(s)*1.2,y0=y-hop,ol=w=>{ ctx.strokeStyle=OL; ctx.lineWidth=w||1.1; ctx.stroke(); };
  const ell=(cx,cy,rx,ry,col,lw)=>{ ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,0,7); ctx.fill(); if(lw!==0) ol(lw); };
  // 腳：圓圓的鞋
  const shoe=robot?'#6b7686':ninja?'#2b2b44':'#e8463a';
  if(air){ ell(x-4,y-2,3.2,2.4,shoe); ell(x+4,y-2,3.2,2.4,shoe); }
  else { ell(x-4+Math.max(0,s)*1.5*f,y-1.6-Math.max(0,s)*1.6,3.4,2.4,shoe); ell(x+4+Math.max(0,-s)*1.5*f,y-1.6-Math.max(0,-s)*1.6,3.4,2.4,shoe); }
  // 身體
  const bodyCol=ninja?'#3a3a5a':shirt;
  if(girl){ ctx.fillStyle=bodyCol; ctx.beginPath(); ctx.moveTo(x-5,y0-13); ctx.lineTo(x+5,y0-13); ctx.lineTo(x+8.5,y0-3.5); ctx.quadraticCurveTo(x,y0-1.5,x-8.5,y0-3.5); ctx.closePath(); ctx.fill(); ol(); }
  else { ell(x,y0-8,6.6,6,bodyCol); }
  if(robot){ ell(x,y0-8,2.4,2.4,'#3ddbd9',.8); }
  else if(!ninja){ ctx.fillStyle='rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(x+f*1,y0-6.5,3,2.6,0,0,7); ctx.fill(); }
  else { ctx.fillStyle=shirt; ctx.fillRect(x-6.4,y0-9,12.8,2); }
  // 手：掉落時舉高
  const hand=robot?'#9aa3b5':ninja?'#3a3a5a':SK;
  for(const k of [-1,1]){ const ay=air?y0-19:y0-8+(k*s*1.4),ax=x+k*(air?8:7.6);
    ell(ax,ay,2.2,2.2,hand); }
  // 頭
  const hx=x+f*.6,hy=y0-21,R=10;
  if(girl){ for(const k of [-1,1]){ ell(hx+k*10.5,hy+2,3,5.5,HAIR); ctx.fillStyle='#ff6fa8'; ctx.beginPath(); ctx.moveTo(hx+k*10,hy-3); ctx.lineTo(hx+k*14,hy-6.5); ctx.lineTo(hx+k*14,hy+.5); ctx.closePath(); ctx.fill(); ol(.8); ctx.beginPath(); ctx.moveTo(hx+k*10,hy-3); ctx.lineTo(hx+k*6.5,hy-6.5); ctx.lineTo(hx+k*6.5,hy+.5); ctx.closePath(); ctx.fill(); ol(.8); } }
  if(robot){ ctx.strokeStyle=OL; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(hx,hy-R); ctx.lineTo(hx,hy-R-5); ctx.stroke(); const gl=.6+.4*Math.sin(now*6); ctx.fillStyle='rgba(255,93,143,'+gl+')'; ctx.beginPath(); ctx.arc(hx,hy-R-6.5,2.3,0,7); ctx.fill(); ol(.8);
    ctx.fillStyle=SK; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(hx-R*1.05,hy-R*.9,R*2.1,R*1.8,5); else ctx.rect(hx-R*1.05,hy-R*.9,R*2.1,R*1.8); ctx.fill(); ol(1.2);
    ell(hx-R*1.05,hy,1.8,3,'#9aa3b5',.8); ell(hx+R*1.05,hy,1.8,3,'#9aa3b5',.8); }
  else ell(hx,hy,R*1.05,R*.97,ninja?'#2b2b44':SK,1.2);
  // 頭髮／頭巾
  if(ninja){ ctx.fillStyle=SK; ctx.beginPath(); ctx.ellipse(hx+f*1.5,hy+1.5,R*.78,3.6,0,0,7); ctx.fill();
    ctx.fillStyle=shirt; ctx.fillRect(hx-R*1.05,hy-5.5,R*2.1,2.6); const wv=Math.sin(now*8)*1.5; ctx.beginPath(); ctx.moveTo(hx-f*R,hy-5); ctx.lineTo(hx-f*(R+6),hy-7+wv); ctx.lineTo(hx-f*(R+5),hy-2+wv); ctx.closePath(); ctx.fill(); }
  else if(!robot){ ctx.fillStyle=HAIR; ctx.beginPath(); ctx.moveTo(hx-R*1.03,hy+1); ctx.quadraticCurveTo(hx-R,hy-R*1.06,hx,hy-R*.99); ctx.quadraticCurveTo(hx+R,hy-R*1.06,hx+R*1.03,hy+1);
    ctx.lineTo(hx+R*.98,hy-R*.2); for(let i=3;i>=-3;i--){ const bx=hx+i*R*.3+f*1.2; ctx.quadraticCurveTo(bx+R*.16,hy-R*(i===0?.1:.2),bx,hy-R*.46); } ctx.quadraticCurveTo(hx-R*.98,hy-R*.3,hx-R*1.03,hy+1); ctx.closePath(); ctx.fill(); ol(.9);
    if(!girl){ ctx.fillStyle=HAIR; ctx.beginPath(); ctx.moveTo(hx+1,hy-R*.95); ctx.quadraticCurveTo(hx+5*f,hy-R*1.5,hx+7*f,hy-R*1.25); ctx.quadraticCurveTo(hx+3*f,hy-R*1.1,hx+2*f,hy-R*.9); ctx.fill(); ol(.8); } } // 男孩頭頂一撮呆毛
  // 臉：大眼睛＋亮點、腮紅、嘴巴
  const ex=[-3.8,3.8].map(v=>hx+v+f*1.4),ey=hy+1.6,blink=!air&&(now*.6+x*.01)%4<.1;
  for(const e of ex){
    if(robot){ ctx.fillStyle='#14122b'; ctx.fillRect(e-3,ey-2.5,6,5); ctx.fillStyle='#3ddbd9'; ctx.fillRect(e-2,ey-(blink?.4:1.6),4,blink?.8:3.2); continue; }
    if(blink){ ctx.strokeStyle=OL; ctx.lineWidth=1.1; ctx.beginPath(); ctx.moveTo(e-2.4,ey); ctx.quadraticCurveTo(e,ey+1.2,e+2.4,ey); ctx.stroke(); continue; }
    const w=2.5,h=air?3.8:3.3; ctx.fillStyle='#2a1a2a'; ctx.beginPath(); ctx.ellipse(e,ey,w,h,0,0,7); ctx.fill();
    ctx.fillStyle='#6a4a9a'; ctx.beginPath(); ctx.ellipse(e,ey+1,w*.72,h*.48,0,0,7); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(e+.8,ey-1.3,1.1,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(e-.8,ey+1.3,.5,0,7); ctx.fill(); }
  if(!robot&&!ninja){ ctx.fillStyle='rgba(255,120,150,.55)'; for(const e of ex){ ctx.beginPath(); ctx.ellipse(e+(e<hx+f*1.4?-1.6:1.6),hy+5.4,2.1,1.2,0,0,7); ctx.fill(); } }
  if(!ninja){ const mx=hx+f*1.4; ctx.strokeStyle=robot?'#3ddbd9':OL; ctx.lineWidth=1;
    if(air){ ctx.fillStyle='#8a2a3a'; ctx.beginPath(); ctx.ellipse(mx,hy+6.4,1.4,1.7,0,0,7); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(mx-1.6,hy+5.6); ctx.quadraticCurveTo(mx-.8,hy+6.9,mx,hy+5.8); ctx.quadraticCurveTo(mx+.8,hy+6.9,mx+1.6,hy+5.6); ctx.stroke(); } }
}
/* 深度區域：每 50 階換一個場景（牆色、磚色、柱子色、點綴） */
const ZONES=[{name:'地下城',bg:'#1a1530',brick:'#231c40',wall:'#3a3670',line:'#2b2759'},{name:'冰窟',bg:'#122236',brick:'#1a3350',wall:'#3a6a92',line:'#2a5070',fx:'snow'},
  {name:'熔岩洞',bg:'#2a120e',brick:'#3a1a12',wall:'#6a2a1a',line:'#4a1e14',fx:'ember'},{name:'水晶洞',bg:'#1c1238',brick:'#2a1a50',wall:'#5a3a9a',line:'#3a2a6a',fx:'gem'},
  {name:'叢林遺跡',bg:'#10221a',brick:'#183224',wall:'#3a6a3a',line:'#24482a',fx:'leaf'},{name:'深淵',bg:'#07060f',brick:'#0f0d1e',wall:'#26224a',line:'#18152e',fx:'eye'}];
const zoneOf=f=>ZONES[Math.floor(f/50)%ZONES.length];
const TILE={};
function tileOf(Z){ if(TILE[Z.name]) return TILE[Z.name]; const e=document.createElement('canvas'); e.width=W; e.height=96; const c=e.getContext('2d'); let a=Z.name.length*977+3; const r=()=>{ a=(a*16807)%2147483647; return a/2147483647; };
  c.fillStyle=Z.bg; c.fillRect(0,0,W,96);
  for(let row=0;row<4;row++){ const sh=row%2?22:0; for(let x=-44+sh;x<W;x+=44){ const y=row*24,k=.85+r()*.3; const g=c.createLinearGradient(0,y,0,y+22); g.addColorStop(0,mixC(Z.brick,1.35*k)); g.addColorStop(1,mixC(Z.brick,.9*k)); c.fillStyle=g; c.fillRect(x+1,y+1,42,22); c.fillStyle='rgba(255,255,255,.06)'; c.fillRect(x+1,y+1,42,2); c.fillStyle='rgba(0,0,0,.18)'; c.fillRect(x+1,y+21,42,2);
      if(r()<.18){ c.strokeStyle='rgba(0,0,0,.35)'; c.lineWidth=1; c.beginPath(); const cx=x+8+r()*26; c.moveTo(cx,y+2); c.lineTo(cx+4,y+9); c.lineTo(cx,y+14); c.stroke(); }
      if(Z.fx==='leaf'&&r()<.25){ c.fillStyle='rgba(80,160,70,.5)'; c.beginPath(); c.ellipse(x+22,y+20,10,4,0,0,7); c.fill(); }
      if(Z.fx==='snow'&&r()<.4){ c.fillStyle='rgba(230,245,255,.45)'; c.fillRect(x+2,y+1,40,3); }
      if(Z.fx==='ember'&&r()<.2){ c.strokeStyle='rgba(255,120,40,.55)'; c.lineWidth=1.2; c.beginPath(); c.moveTo(x+6,y+12); c.lineTo(x+18,y+8); c.lineTo(x+30,y+14); c.stroke(); }
      if(Z.fx==='gem'&&r()<.12){ c.fillStyle='rgba(190,150,255,.6)'; c.beginPath(); c.moveTo(x+22,y+4); c.lineTo(x+27,y+12); c.lineTo(x+22,y+20); c.lineTo(x+17,y+12); c.fill(); } } }
  return TILE[Z.name]=e; }
const FLAME={snow:['#bfe8ff','#5ab0ff'],ember:['#ffe08a','#ff5a1a'],gem:['#f0d8ff','#a86aff'],leaf:['#e8ffb0','#7ad04a'],eye:['#ffb0c0','#ff2a5a']};
function drawWall(ctx,cam,floor){ const Z=zoneOf(floor||0),t=performance.now()/1000;
  ctx.fillStyle=Z.bg; ctx.fillRect(0,0,W,H);
  const tl=tileOf(Z),o=((cam*.5)%96+96)%96; for(let y=-o;y<H;y+=96) ctx.drawImage(tl,0,y);
  /* 遠處的暗角，讓中間亮一點 */ const vg=ctx.createRadialGradient(W/2,H*.45,60,W/2,H*.45,H*.75); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.5)'); ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
  /* 火把：每 220 px 一支，左右交錯 */ const fl=FLAME[Z.fx]||['#ffe08a','#ff8a2a'],o3=cam*.5; for(let k=Math.floor((o3-60)/110);k<(o3+H+60)/110;k++){ const y=k*110-o3+40,x=k%2?WALL+26:W-WALL-26;
    const fg=ctx.createRadialGradient(x,y-8,2,x,y-8,46); fg.addColorStop(0,fl[1]+'66'); fg.addColorStop(1,fl[1]+'00'); ctx.fillStyle=fg; ctx.fillRect(x-46,y-54,92,92);
    ctx.fillStyle='#3a2a1a'; ctx.fillRect(x-2,y-2,4,14); ctx.fillStyle='#6a6a7a'; ctx.fillRect(x-5,y-4,10,4);
    const fh=9+Math.sin(t*12+k)*2; ctx.fillStyle=fl[1]; ctx.beginPath(); ctx.moveTo(x-4,y-4); ctx.quadraticCurveTo(x-5,y-4-fh*.6,x+Math.sin(t*9+k)*1.5,y-4-fh); ctx.quadraticCurveTo(x+5,y-4-fh*.6,x+4,y-4); ctx.fill(); ctx.fillStyle=fl[0]; ctx.beginPath(); ctx.ellipse(x,y-7,2,3.5,0,0,7); ctx.fill(); }
  if(Z.fx){ for(let i=0;i<16;i++){ const x=WALL+((i*97)%(W-2*WALL)),y=((i*61-cam*(Z.fx==='ember'?-.3:.2)+(Z.fx==='snow'||Z.fx==='leaf'?t*30:0))%H+H)%H;
      if(Z.fx==='snow'){ ctx.fillStyle='rgba(220,240,255,.7)'; ctx.beginPath(); ctx.arc(x+Math.sin(t+i)*6,y,1.8,0,7); ctx.fill(); }
      else if(Z.fx==='ember'){ ctx.fillStyle='rgba(255,'+(120+i*8)+',40,'+(.5+.3*Math.sin(t*3+i))+')'; ctx.beginPath(); ctx.arc(x,y,1.6,0,7); ctx.fill(); }
      else if(Z.fx==='gem'){ ctx.fillStyle='rgba(200,160,255,'+(.3+.3*Math.sin(t*2+i))+')'; ctx.beginPath(); ctx.moveTo(x,y-6); ctx.lineTo(x+3.5,y); ctx.lineTo(x,y+6); ctx.lineTo(x-3.5,y); ctx.fill(); }
      else if(Z.fx==='leaf'){ ctx.fillStyle='rgba(140,210,100,.55)'; ctx.beginPath(); ctx.ellipse(x+Math.sin(t+i)*8,y,3.4,1.6,t+i,0,7); ctx.fill(); }
      else if(i%4===0){ const op=Math.sin(t*.7+i)>.6; ctx.fillStyle=op?'rgba(255,60,80,.8)':'rgba(255,60,80,.15)'; ctx.beginPath(); ctx.ellipse(x,y,4,op?2:.6,0,0,7); ctx.fill(); } } }
  if(Z.fx==='ember'){ const lg=ctx.createLinearGradient(0,H-90,0,H); lg.addColorStop(0,'rgba(255,90,20,0)'); lg.addColorStop(1,'rgba(255,90,20,.35)'); ctx.fillStyle=lg; ctx.fillRect(0,H-90,W,90); }
  if(Z.fx==='snow'){ ctx.fillStyle='rgba(220,240,255,.75)'; for(let i=0;i<12;i++){ const x=WALL+i*28+6,h=8+((i*7)%4)*4; ctx.beginPath(); ctx.moveTo(x,HUD); ctx.lineTo(x+4,HUD+h+14); ctx.lineTo(x+8,HUD); ctx.fill(); } }
  /* 兩側石柱 */ for(const sx of [0,W-WALL]){ const g=ctx.createLinearGradient(sx,0,sx+WALL,0); g.addColorStop(0,mixC(Z.wall,sx?1.15:.75)); g.addColorStop(1,mixC(Z.wall,sx?.75:1.15)); ctx.fillStyle=g; ctx.fillRect(sx,0,WALL,H); }
  ctx.fillStyle=Z.line; const o2=((cam)%40+40)%40; for(let y=-o2;y<H;y+=40){ ctx.fillRect(0,y,WALL,3); ctx.fillRect(W-WALL,y,WALL,3); ctx.fillStyle='rgba(255,255,255,.12)'; ctx.fillRect(0,y+3,WALL,1); ctx.fillRect(W-WALL,y+3,WALL,1); ctx.fillStyle=Z.line; }
}

/* 道具：愛心補血、護盾不怕尖刺、沙漏讓天花板變慢 */
function drawItem(ctx,it,x,y,t){ const b=Math.sin(t*4+x)*2; y+=b; ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(0,0,10+Math.sin(t*6)*1.5,0,7); ctx.fill();
  if(it==='heart'){ ctx.fillStyle='#ff5d8f'; ctx.beginPath(); ctx.moveTo(0,6); ctx.bezierCurveTo(-9,-1,-6,-9,0,-4); ctx.bezierCurveTo(6,-9,9,-1,0,6); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(-3,-3,1.6,0,7); ctx.fill(); }
  else if(it==='shield'){ ctx.fillStyle='#3ddbd9'; ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(7,-5); ctx.lineTo(6,2); ctx.quadraticCurveTo(3,7,0,8); ctx.quadraticCurveTo(-3,7,-6,2); ctx.lineTo(-7,-5); ctx.closePath(); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillRect(-1,-5,2,9); ctx.fillRect(-4,-2,8,2); }
  else { ctx.fillStyle='#ffd23f'; ctx.fillRect(-6,-8,12,2); ctx.fillRect(-6,6,12,2); ctx.fillStyle='rgba(200,230,255,.8)'; ctx.beginPath(); ctx.moveTo(-5,-6); ctx.lineTo(5,-6); ctx.lineTo(0,0); ctx.lineTo(5,6); ctx.lineTo(-5,6); ctx.lineTo(0,0); ctx.closePath(); ctx.fill(); ctx.fillStyle='#e8b04a'; ctx.beginPath(); ctx.moveTo(-3,5); ctx.lineTo(3,5); ctx.lineTo(0,1); ctx.fill(); }
  ctx.restore(); }

function drawCeil(ctx){
  const g=ctx.createLinearGradient(0,HUD,0,HUD+5); g.addColorStop(0,'#5a5e78'); g.addColorStop(1,'#2a2c3a'); ctx.fillStyle=g; ctx.fillRect(WALL,HUD,W-2*WALL,5);
  for(let x=WALL;x<W-WALL;x+=12){ const sg=ctx.createLinearGradient(x,0,x+12,0); sg.addColorStop(0,'#f4f6ff'); sg.addColorStop(.5,'#b0b4c8'); sg.addColorStop(1,'#5a5e78'); ctx.fillStyle=sg; ctx.beginPath(); ctx.moveTo(x,HUD+4); ctx.lineTo(x+6,HUD+18); ctx.lineTo(x+12,HUD+4); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle='rgba(255,60,80,.55)'; for(let x=WALL;x<W-WALL;x+=12){ ctx.beginPath(); ctx.arc(x+6,HUD+17,1.2,0,7); ctx.fill(); }
}

function drawHud(ctx,ps,floor){
  ctx.fillStyle='#0b0a1c'; ctx.fillRect(0,0,W,HUD);
  ctx.font='9px '+PIX; ctx.textBaseline='middle'; ctx.textAlign='left';
  const m=ps.length,two=m>1,sw=m>2?3:two?7:8,st=m>2?4:two?8:10;
  ps.forEach((p,n)=>{ const x0=8+n*(m>2?72:128);
    ctx.fillStyle=two?p.look.color:'#aaa4d8'; ctx.fillText(two?(n+1)+'P':'LIFE',x0,HUD/2+1);
    for(let i=0;i<MAXLIFE;i++){ const hx=x0+(m>2?20:two?24:44)+i*st+sw/2,on=i<p.life; ctx.fillStyle=on?(p.life<=4?'#ff5d8f':'#ffd23f'):'#2b2759'; if(m>1){ ctx.fillRect(hx-sw/2,11,sw,14); continue; } ctx.beginPath(); ctx.moveTo(hx,24); ctx.bezierCurveTo(hx-6,19,hx-5,12,hx,15); ctx.bezierCurveTo(hx+5,12,hx+6,19,hx,24); ctx.fill(); if(on){ ctx.fillStyle='rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(hx-2,16.5,1,0,7); ctx.fill(); } } });
  ctx.textAlign='right'; ctx.fillStyle='#f4f0ff'; ctx.font='bold 15px "Noto Sans TC","Microsoft JhengHei",sans-serif';
  ctx.fillText((two?'':'地下 ')+String(floor).padStart(3,'0')+(m>2?'':' 階'),W-8,HUD/2+1);
}

function create(env,opts){
  const net=opts&&opts.net,two=!net&&!!opts&&opts.mode==='2p',num=net?net.count:two?2:1,me=net?net.me:0,rnd=net?rng(net.seed):Math.random;
  const {ctx}=env.canvas2d(W,H);
  let cam=0,floor=0,t=0,overT=0,count=0,nextY=200,prevType='normal',lastOut=-1,ended=false,sendT=0,slowT=0,zoneT=0,zone=0,toast='',toastT=0;
  const plats=[];
  function spawn(){
    const type=pick(prevType,count,rnd); prevType=type;
    const r=rnd(),x=count===1?W/2-PLW/2:WALL+r*(W-2*WALL-PLW);
    const ir=rnd(),item=!net&&count>6&&(type==='normal'||type==='left'||type==='right')&&ir<.09?(ir<.035?'heart':ir<.065?'shield':'hour'):null;
    plats.push({x,y:nextY,w:PLW,type,flip:0,gone:false,sq:0,item});
    nextY+=GAP; count++;
  }
  while(nextY<H+GAP) spawn();
  const ps=[];
  for(let n=0;n<num;n++){ const x=W/2+((num-1)/2-n)*22;
    ps.push({n,x,y:plats[1].y,tx:x,ty:plats[1].y,vx:0,vy:0,on:plats[1],last:plats[1],ignore:null,face:1,walk:0,life:MAXLIFE,hurt:0,dead:0,depth:0,why:'',remote:!!net&&n!==me,air:0,shield:0}); }

  const ALT=[{char:'boy',color:SHIRT[0]},{char:'girl',color:SHIRT[1]},{char:'robot',color:SHIRT[2]},{char:'ninja',color:SHIRT[3]}];
  for(const p of ps) p.look=(net?net.looks&&net.looks[p.n]:p.n===0?opts&&opts.look:null)||ALT[p.n%4];

  function damage(p,n){ if(p.shield>0){ p.hurt=.3; return; } p.life=Math.max(0,p.life-n); p.hurt=.8; env.sfx('hurt'); }
  const say=s2=>{ toast=s2; toastT=1.6; };
  function land(p,pl){
    p.ignore=null;
    if(pl.type==='spring'){ p.vy=-340; pl.sq=.25; env.sfx('spring'); }
    else { p.on=pl; p.y=pl.y; p.vy=0; if(pl.type==='fake'&&pl.flip<=0) pl.flip=.28; }
    if(pl.type==='spike'){ if(p.last!==pl) damage(p,5); }
    else if(p.last!==pl){ if(p.life<MAXLIFE){ p.life++; env.sfx('heal'); } else if(pl.type!=='spring') env.sfx('land'); }
    p.last=pl;
    if(pl.item){ const it=pl.item; pl.item=null; env.sfx('heal');
      if(it==='heart'){ p.life=Math.min(MAXLIFE,p.life+3); say('補血 +3'); } else if(it==='shield'){ p.shield=5; say('護盾 5 秒！'); } else { slowT=5; say('天花板變慢 5 秒'); } }
  }
  function dirOf(n){
    const k=env.keys;
    if(!two) return (k.ArrowRight||k.KeyD?1:0)-(k.ArrowLeft||k.KeyA?1:0);
    return n===0?(k.ArrowRight?1:0)-(k.ArrowLeft?1:0):(k.KeyD?1:0)-(k.KeyA?1:0);
  }
  // 連線：平台用同一個亂數種子產生，每個人只算自己的角色，再把位置傳給其他人
  const pack=p=>[p.n,Math.round(p.remote?p.tx:p.x),Math.round(p.remote?p.ty:p.y),p.face,p.life,p.remote?p.air:(p.on?0:1),p.dead?p.depth+1:0];
  function apply(a){ const p=ps[a[0]]; if(!p||!p.remote) return; p.tx=a[1]; p.ty=a[2]; p.face=a[3]; p.life=a[4]; p.air=a[5];
    if(a[6]&&!p.dead){ p.dead=.001; p.depth=a[6]-1; p.vy=-200; lastOut=p.n; env.sfx('die'); } }
  function conclude(last,d){
    if(ended) return; ended=true; const win=last===me; env.sfx(win?'win':'lose');
    env.end({title:win?'你贏了！':'玩家 '+(last+1)+' 獲勝',big:'地下 '+Math.max.apply(null,d)+' 階',text:d.map((v,i)=>'玩家 '+(i+1)+'：'+v+' 階').join('、'),score:null});
  }
  if(net){
    net.onmsg=m=>{ if(m.k) apply(m.k); if(m.ks) for(const a of m.ks) if(a[0]!==me) apply(a); if(m.end) conclude(m.end[0],m.end[1]); };
    net.onleave=i=>{ const p=ps[i]; if(p&&!p.dead){ p.dead=.001; p.depth=floor; p.vy=-200; if(lastOut<0) lastOut=i; } };
  }

  function update(dt){
    t+=dt;
    if(ended) return;
    const alive=ps.filter(p=>!p.dead).length;
    if(alive){
      cam+=(62+Math.min(floor,130)*.75)*(slowT>0?.55:1)*dt; floor=Math.floor(cam/90); if(slowT>0) slowT-=dt; if(toastT>0) toastT-=dt; if(zoneT>0) zoneT-=dt;
      if(Math.floor(floor/50)!==zone){ zone=Math.floor(floor/50); zoneT=2.2; env.sfx('win'); }
      while(nextY<cam+H+GAP) spawn();
      while(plats.length&&plats[0].y<cam-30) plats.shift();
      for(const pl of plats){ if(pl.sq>0) pl.sq-=dt; if(pl.flip>0&&!pl.gone){ pl.flip-=dt; if(pl.flip<=0) pl.gone=true; } }
    }
    for(const p of ps){
      if(p.dead){ p.dead+=dt; p.vy+=900*dt; p.y+=p.vy*dt; continue; }
      if(p.remote){ const f=Math.min(1,dt*18); if(Math.abs(p.tx-p.x)>1) p.walk+=dt; p.x+=(p.tx-p.x)*f; p.y+=(p.ty-p.y)*f; continue; }
      if(p.hurt>0) p.hurt-=dt; if(p.shield>0) p.shield-=dt;
      const dir=dirOf(p.n);
      p.vx=dir*175; if(dir){ p.face=dir; p.walk+=dt; }
      let vx=p.vx;
      if(p.on){ const pl=p.on;
        if(pl.type==='left') vx-=70; if(pl.type==='right') vx+=70;
        if(pl.gone){ p.on=null; p.vy=0; } }
      p.x=Math.max(WALL+PW/2,Math.min(W-WALL-PW/2,p.x+vx*dt));
      if(p.on){ const pl=p.on; if(p.x+PW/2<pl.x||p.x-PW/2>pl.x+pl.w){ p.on=null; p.vy=0; } }
      if(!p.on){
        p.vy=Math.min(430,p.vy+950*dt);
        const ny=p.y+p.vy*dt;
        if(p.ignore&&p.y>p.ignore.y+2) p.ignore=null;
        if(p.vy>=0) for(const pl of plats){
          if(pl.gone||pl===p.ignore) continue;
          if(p.y<=pl.y+.01&&ny>=pl.y&&p.x+PW/2>pl.x&&p.x-PW/2<pl.x+pl.w){ land(p,pl); break; }
        }
        if(!p.on) p.y+=p.vy*dt;
      }
      // 天花板
      if(p.y-PH<cam+TOP){
        if(p.hurt<=0) damage(p,5);
        if(p.on){ p.ignore=p.on; p.on=null; }
        p.y=cam+TOP+PH; p.vy=Math.max(p.vy,140);
      }
      if(p.life<=0||p.y-PH>cam+H){ p.dead=.001; p.depth=floor; p.why=p.life<=0?'血量歸零了。':'掉出畫面了。'; p.vy=p.life<=0?-260:0; lastOut=p.n; env.sfx('die'); sendT=0; }
    }
    // 玩家互推：碰在一起就互相推開，往對方走可以把他推出去（連線時只推自己的角色）
    for(let i=0;i<ps.length;i++) for(let j=i+1;j<ps.length;j++){ const a2=ps[i],b2=ps[j]; if(a2.dead||b2.dead||a2.remote&&b2.remote) continue;
      const dx=b2.x-a2.x; if(Math.abs(a2.y-b2.y)>PH*.8||Math.abs(dx)>=PW) continue;
      const over=PW-Math.abs(dx),sgn=dx>=0?1:-1,wa=a2.remote?0:b2.remote?1:.5,wb=b2.remote?0:a2.remote?1:.5;
      a2.x=Math.max(WALL+PW/2,Math.min(W-WALL-PW/2,a2.x-sgn*over*wa)); b2.x=Math.max(WALL+PW/2,Math.min(W-WALL-PW/2,b2.x+sgn*over*wb)); }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/15; if(net.host) net.send({ks:ps.map(pack)}); else net.send({k:pack(ps[me])}); } }
    if(!alive){ overT+=dt; if(overT>1.1){
      if(net){ if(net.host){ const d=ps.map(p=>p.depth),last=lastOut<0?0:lastOut; net.send({ks:ps.map(pack)}); net.send({end:[last,d]}); conclude(last,d); } }
      else if(!two) env.end({score:floor,title:'遊戲結束',big:'地下 '+floor+' 階',text:ps[0].why});
      else { const a=ps[0].depth,b=ps[1].depth;
        env.end({score:floor,title:a===b?'平手':(lastOut+1)+'P 獲勝',big:'地下 '+floor+' 階',text:'1P 撐到地下 '+a+' 階，2P 撐到地下 '+b+' 階。'}); } } }
  }

  function draw(){
    drawWall(ctx,cam,floor);
    for(const pl of plats){ if(pl.gone) continue; const y=pl.y-cam; if(y>-20&&y<H+20){ drawPlat(ctx,pl,y,t); if(pl.item) drawItem(ctx,pl.item,pl.x+pl.w/2,y-14,t); } }
    for(let n=ps.length-1;n>=0;n--){ const p=ps[n]; drawKid(ctx,p.x,p.y-cam,p.face,p.walk,p.remote?!!p.air:!p.on,p.dead?0:Math.max(0,p.hurt),p.look.color,p.look.char);
      if(p.shield>0&&!p.dead){ ctx.strokeStyle='rgba(61,219,217,'+(p.shield<1.2&&Math.floor(t*10)%2?.25:.75)+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p.x,p.y-cam-14,18,0,7); ctx.stroke(); }
      if(net&&n===me&&!p.dead){ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(p.x-5,p.y-cam-38); ctx.lineTo(p.x+5,p.y-cam-38); ctx.lineTo(p.x,p.y-cam-31); ctx.fill(); } }
    drawCeil(ctx); drawHud(ctx,ps,floor);
    const fc='bold 16px "Noto Sans TC","Microsoft JhengHei",sans-serif';
    if(slowT>0){ ctx.fillStyle='rgba(255,210,63,.18)'; ctx.fillRect(WALL,HUD,W-2*WALL,18); }
    if(zoneT>0){ ctx.globalAlpha=Math.min(1,zoneT); ctx.fillStyle='rgba(11,10,28,.75)'; ctx.fillRect(40,H*.32,W-80,44); ctx.fillStyle='#ffd23f'; ctx.font=fc; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('進入「'+zoneOf(floor).name+'」　地下 '+floor+' 階',W/2,H*.32+22); ctx.globalAlpha=1; }
    if(toastT>0){ ctx.globalAlpha=Math.min(1,toastT*2); ctx.fillStyle='#fff'; ctx.font=fc; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(toast,W/2,HUD+40); ctx.globalAlpha=1; }
    if(net&&ps[me].dead&&!ended){ ctx.textAlign='center'; ctx.fillStyle='#ffd23f'; ctx.font='bold 16px "Noto Sans TC","Microsoft JhengHei",sans-serif'; ctx.fillText('你出局了，等其他人…',W/2,HUD+34); }
  }
  return {update,draw,destroy(){},_dbg:{ps}};
}

function preview(ctx,w,h,L,t){
  ctx.fillStyle='#1a1530'; ctx.fillRect(0,0,w,h);
  drawPlat(ctx,{x:w/2-PLW/2,w:PLW,type:'normal',sq:0,flip:0},h-50,t);
  ctx.save(); ctx.translate(w/2,h-50); ctx.scale(3.4,3.4); drawKid(ctx,0,0,Math.sin(t*1.2)>0?1:-1,t,false,0,L.color,L.char); ctx.restore();
}

function thumb(ctx,w,h,t){
  ctx.save(); ctx.scale(w/360,w/360);
  const cam=t*40; drawWall(ctx,cam);
  const types=['normal','left','spike','normal','spring','fake','right','normal'];
  for(let i=-1;i<5;i++){ const n=Math.floor(cam/60)+i, y=n*60-cam+50, x=40+((n*97)%7)*34;
    drawPlat(ctx,{x,w:PLW,type:types[((n%8)+8)%8],sq:0,flip:0},y,t); }
  const n=Math.floor(cam/60)+2, kx=40+((n*97)%7)*34+43, ky=n*60-cam+50;
  drawKid(ctx,kx,ky,1,t,false,0,SHIRT[0]);
  ctx.translate(0,-HUD); drawCeil(ctx);
  ctx.translate(0,HUD); ctx.fillStyle='rgba(11,10,28,.85)'; ctx.fillRect(0,0,360,22); ctx.font='8px "Press Start 2P",monospace'; ctx.textBaseline='middle'; ctx.textAlign='left'; ctx.fillStyle='#aaa4d8'; ctx.fillText('LIFE',8,11);
  const life=12-Math.floor((t*1.3)%5); for(let i=0;i<12;i++){ ctx.fillStyle=i<life?'#ffd23f':'#3a3670'; ctx.fillRect(46+i*8,6,6,10); }
  ctx.textAlign='right'; ctx.font='900 12px "Noto Sans TC","Microsoft JhengHei",sans-serif'; ctx.fillStyle='#fff'; ctx.fillText('地下 '+String(Math.floor(cam/60)+1).padStart(3,'0')+' 階',352,11);
  ctx.restore();
}

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).stairs={_kid:drawKid,
  name:'樓梯大逃亡',tag:'STAIR ESCAPE',color:'#86dc4f',online:true,wide:false,
  desc:'天花板一直壓下來，踩著平台往下逃。小心尖刺、會翻的假板和輸送帶；撿愛心、護盾、沙漏道具，每 50 階換一個場景。可單人、兩人同一台，或開房間連線比誰撐得久。',
  goal:'踩平台往下走，別被天花板的尖刺刺到，也別掉出畫面。踩到新的平台會補血。平台上的道具：愛心補 3 格血、護盾 5 秒不怕尖刺、沙漏讓天花板慢 5 秒。每往下 50 階換一個場景。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人'}],
  help:[['← →','左右移動（雙人時是 1P）'],['A D','雙人時 2P 左右移動'],['P','暫停']],
  touchHelp:[['◀ ▶','左右移動'],['雙人','左邊兩顆是 2P，右邊兩顆是 1P']],
  touch:m=>m==='2p'?{left:[{l:'◀',c:'KeyA'},{l:'▶',c:'KeyD'}],right:[{l:'◀',c:'ArrowLeft',act:true},{l:'▶',c:'ArrowRight',act:true}]}
    :{left:[{l:'◀',c:'ArrowLeft'}],right:[{l:'▶',c:'ArrowRight'}]},
  best:{label:'最深',fmt:v=>'地下 '+v+' 階',lower:false},
  looks:[{key:'char',label:'人物',opts:[{id:'boy',label:'男孩'},{id:'girl',label:'女孩'},{id:'robot',label:'機器人'},{id:'ninja',label:'忍者'}]},
    {key:'color',label:'顏色',type:'color',opts:['#ff5d4f','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#b98cff','#ff7eb6']}],
  preview,thumb,create
};
})();
