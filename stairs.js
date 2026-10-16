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
  const x=pl.x,w=pl.w;
  if(pl.type==='spike'){
    ctx.fillStyle='#8a8fa8'; ctx.fillRect(x,y+6,w,PLH-6);
    ctx.fillStyle='#d9dcea'; ctx.beginPath();
    for(let i=0;i<w;i+=8){ ctx.moveTo(x+i,y+6); ctx.lineTo(x+i+4,y-3); ctx.lineTo(x+i+8,y+6); }
    ctx.fill(); return;
  }
  if(pl.type==='left'||pl.type==='right'){
    ctx.fillStyle='#2c3e6b'; ctx.fillRect(x,y,w,PLH);
    ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,PLH); ctx.clip();
    const dir=pl.type==='left'?-1:1, off=((t*40*dir)%16+16)%16;
    ctx.fillStyle='#6fd3ff';
    for(let i=-16;i<w+16;i+=16){ const ax=x+i+off; ctx.beginPath();
      if(dir>0){ ctx.moveTo(ax,y+3); ctx.lineTo(ax+7,y+7); ctx.lineTo(ax,y+11); }
      else { ctx.moveTo(ax+7,y+3); ctx.lineTo(ax,y+7); ctx.lineTo(ax+7,y+11); }
      ctx.fill(); }
    ctx.restore(); return;
  }
  if(pl.type==='spring'){
    const sq=pl.sq>0?4*Math.sin(pl.sq*Math.PI/.25):0;
    ctx.fillStyle='#ff5d8f'; ctx.fillRect(x,y+sq,w,5);
    ctx.fillStyle='#7a2a45'; ctx.fillRect(x,y+PLH-3,w,3);
    ctx.strokeStyle='#ffc2d4'; ctx.lineWidth=2; ctx.beginPath();
    for(let i=6;i<w;i+=14){ ctx.moveTo(x+i,y+5+sq); ctx.lineTo(x+i+5,y+8+sq/2); ctx.lineTo(x+i,y+PLH-3); }
    ctx.stroke(); return;
  }
  if(pl.type==='fake'){
    const k=pl.flip>0?Math.max(.12,pl.flip/.28):1;
    ctx.fillStyle='#b98b4a'; ctx.fillRect(x,y+PLH/2*(1-k),w,PLH*k);
    ctx.fillStyle='#7d5a28'; for(let i=10;i<w;i+=20) ctx.fillRect(x+i,y+PLH/2*(1-k),2,PLH*k);
    return;
  }
  ctx.fillStyle='#86dc4f'; ctx.fillRect(x,y,w,5);
  ctx.fillStyle='#4f8f2a'; ctx.fillRect(x,y+5,w,PLH-5);
  ctx.fillStyle='#35641a'; for(let i=8;i<w;i+=18) ctx.fillRect(x+i,y+8,6,3);
}

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
function drawWall(ctx,cam){
  ctx.fillStyle='#1a1530'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#231c40';
  const o=(cam*.5)%24;
  for(let r=-1;r<H/24+1;r++){ const y=r*24-o, sh=(Math.floor((cam*.5)/24)+r)%2?0:22;
    for(let x=-44+sh;x<W;x+=44) ctx.fillRect(x+1,y+1,42,22); }
  ctx.fillStyle='#3a3670'; ctx.fillRect(0,0,WALL,H); ctx.fillRect(W-WALL,0,WALL,H);
  ctx.fillStyle='#2b2759';
  const o2=cam%20; for(let y=-o2;y<H;y+=20){ ctx.fillRect(0,y,WALL,2); ctx.fillRect(W-WALL,y,WALL,2); }
}

function drawCeil(ctx){
  ctx.fillStyle='#d9dcea'; ctx.beginPath();
  for(let x=WALL;x<W-WALL;x+=12){ ctx.moveTo(x,HUD); ctx.lineTo(x+6,HUD+14); ctx.lineTo(x+12,HUD); }
  ctx.fill();
}

function drawHud(ctx,ps,floor){
  ctx.fillStyle='#0b0a1c'; ctx.fillRect(0,0,W,HUD);
  ctx.font='9px '+PIX; ctx.textBaseline='middle'; ctx.textAlign='left';
  const m=ps.length,two=m>1,sw=m>2?3:two?7:8,st=m>2?4:two?8:10;
  ps.forEach((p,n)=>{ const x0=8+n*(m>2?72:128);
    ctx.fillStyle=two?p.look.color:'#aaa4d8'; ctx.fillText(two?(n+1)+'P':'LIFE',x0,HUD/2+1);
    for(let i=0;i<MAXLIFE;i++){ ctx.fillStyle=i<p.life?(p.life<=4?'#ff5d8f':'#ffd23f'):'#2b2759'; ctx.fillRect(x0+(m>2?20:two?24:44)+i*st,11,sw,14); } });
  ctx.textAlign='right'; ctx.fillStyle='#f4f0ff'; ctx.font='bold 15px "Noto Sans TC","Microsoft JhengHei",sans-serif';
  ctx.fillText((two?'':'地下 ')+String(floor).padStart(3,'0')+(m>2?'':' 階'),W-8,HUD/2+1);
}

function create(env,opts){
  const net=opts&&opts.net,two=!net&&!!opts&&opts.mode==='2p',num=net?net.count:two?2:1,me=net?net.me:0,rnd=net?rng(net.seed):Math.random;
  const {ctx}=env.canvas2d(W,H);
  let cam=0,floor=0,t=0,overT=0,count=0,nextY=200,prevType='normal',lastOut=-1,ended=false,sendT=0;
  const plats=[];
  function spawn(){
    const type=pick(prevType,count,rnd); prevType=type;
    const r=rnd(),x=count===1?W/2-PLW/2:WALL+r*(W-2*WALL-PLW);
    plats.push({x,y:nextY,w:PLW,type,flip:0,gone:false,sq:0});
    nextY+=GAP; count++;
  }
  while(nextY<H+GAP) spawn();
  const ps=[];
  for(let n=0;n<num;n++){ const x=W/2+((num-1)/2-n)*22;
    ps.push({n,x,y:plats[1].y,tx:x,ty:plats[1].y,vx:0,vy:0,on:plats[1],last:plats[1],ignore:null,face:1,walk:0,life:MAXLIFE,hurt:0,dead:0,depth:0,why:'',remote:!!net&&n!==me,air:0}); }

  const ALT=[{char:'boy',color:SHIRT[0]},{char:'girl',color:SHIRT[1]},{char:'robot',color:SHIRT[2]},{char:'ninja',color:SHIRT[3]}];
  for(const p of ps) p.look=(net?net.looks&&net.looks[p.n]:p.n===0?opts&&opts.look:null)||ALT[p.n%4];

  function damage(p,n){ p.life=Math.max(0,p.life-n); p.hurt=.8; env.sfx('hurt'); }
  function land(p,pl){
    p.ignore=null;
    if(pl.type==='spring'){ p.vy=-340; pl.sq=.25; env.sfx('spring'); }
    else { p.on=pl; p.y=pl.y; p.vy=0; if(pl.type==='fake'&&pl.flip<=0) pl.flip=.28; }
    if(pl.type==='spike'){ if(p.last!==pl) damage(p,5); }
    else if(p.last!==pl){ if(p.life<MAXLIFE){ p.life++; env.sfx('heal'); } else if(pl.type!=='spring') env.sfx('land'); }
    p.last=pl;
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
      cam+=(62+Math.min(floor,130)*.75)*dt; floor=Math.floor(cam/90);
      while(nextY<cam+H+GAP) spawn();
      while(plats.length&&plats[0].y<cam-30) plats.shift();
      for(const pl of plats){ if(pl.sq>0) pl.sq-=dt; if(pl.flip>0&&!pl.gone){ pl.flip-=dt; if(pl.flip<=0) pl.gone=true; } }
    }
    for(const p of ps){
      if(p.dead){ p.dead+=dt; p.vy+=900*dt; p.y+=p.vy*dt; continue; }
      if(p.remote){ const f=Math.min(1,dt*18); if(Math.abs(p.tx-p.x)>1) p.walk+=dt; p.x+=(p.tx-p.x)*f; p.y+=(p.ty-p.y)*f; continue; }
      if(p.hurt>0) p.hurt-=dt;
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
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/15; if(net.host) net.send({ks:ps.map(pack)}); else net.send({k:pack(ps[me])}); } }
    if(!alive){ overT+=dt; if(overT>1.1){
      if(net){ if(net.host){ const d=ps.map(p=>p.depth),last=lastOut<0?0:lastOut; net.send({ks:ps.map(pack)}); net.send({end:[last,d]}); conclude(last,d); } }
      else if(!two) env.end({score:floor,title:'遊戲結束',big:'地下 '+floor+' 階',text:ps[0].why});
      else { const a=ps[0].depth,b=ps[1].depth;
        env.end({score:floor,title:a===b?'平手':(lastOut+1)+'P 獲勝',big:'地下 '+floor+' 階',text:'1P 撐到地下 '+a+' 階，2P 撐到地下 '+b+' 階。'}); } } }
  }

  function draw(){
    drawWall(ctx,cam);
    for(const pl of plats){ if(pl.gone) continue; const y=pl.y-cam; if(y>-20&&y<H+20) drawPlat(ctx,pl,y,t); }
    for(let n=ps.length-1;n>=0;n--){ const p=ps[n]; drawKid(ctx,p.x,p.y-cam,p.face,p.walk,p.remote?!!p.air:!p.on,p.dead?0:Math.max(0,p.hurt),p.look.color,p.look.char);
      if(net&&n===me&&!p.dead){ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(p.x-5,p.y-cam-38); ctx.lineTo(p.x+5,p.y-cam-38); ctx.lineTo(p.x,p.y-cam-31); ctx.fill(); } }
    drawCeil(ctx); drawHud(ctx,ps,floor);
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
  desc:'天花板一直壓下來，踩著平台往下逃。小心尖刺、會翻的假板和輸送帶。可單人、兩人同一台，或開房間連線比誰撐得久。',
  goal:'踩平台往下走，別被天花板的尖刺刺到，也別掉出畫面。踩到新的平台會補血。',
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
