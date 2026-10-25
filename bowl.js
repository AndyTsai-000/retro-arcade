// 保齡球：可選 3、5、7、9 局，1～4 人輪流投，計分照正式規則（全倒、補中加分，最後一局有加投）。
// 單位用英吋：球道寬 42、犯規線到一號瓶 720。連線時輪到的人自己算滾球結果，再把還站著的球瓶傳給大家。
(function(){
'use strict';
const W=480,H=300,LW=21,PINY=720,BR=4.3,PR=2.3;
const PIX='"Press Start 2P","Noto Sans TC","Microsoft JhengHei",monospace';
const TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const SPOTS=[]; for(let r=0;r<4;r++) for(let i=0;i<=r;i++) SPOTS.push([(i-r/2)*12,PINY+r*10.39]);
const BALLS=['#ff5d4f','#4f9dff','#5fd068','#ffd23f'];
const TYPES=[{name:'直球',spin:0},{name:'左曲球',spin:-.55},{name:'右曲球',spin:.55},{name:'大左曲球',spin:-1},{name:'大右曲球',spin:1},{name:'飛碟球',spin:.5,ufo:true}];
// 球的側向加速度：一般曲球過了前段油區才開始轉彎；飛碟球像陀螺一樣平轉，前段幾乎直走，快到球瓶才小小偏一下
const hookOf=(y,sp,u)=>u?(y>430?sp*20:0):sp*(y>260?14:3);
const BG={alley:['#2b2140','#3a2d57'],neon:['#0d0b2a','#1a1450'],day:['#bfe3ff','#e9f6ff']};
const HALL={
  alley:{ceil:'#120d1e',wall:'#2b2140',cap:'#3b3046',gutter:'#1b1420',mask:['#4a2f8f','#1f1748'],neon:'#ff5d8f',light:'#fff1c2',sign:'#ffd23f',num:'#fff'},
  neon:{ceil:'#04031a',wall:'#120d3a',cap:'#1d1650',gutter:'#0a0820',mask:['#c0287f','#2a1270'],neon:'#3ddbd9',light:'#d8b8ff',sign:'#3ddbd9',num:'#ffd23f'},
  day:{ceil:'#e6eef7',wall:'#c4d4e6',cap:'#8b9db2',gutter:'#5b6b7d',mask:['#4f9dff','#24539e'],neon:'#ffd23f',light:'#ffffff',sign:'#ff5d4f',num:'#fff'}};
const PITCH=66; // 相鄰兩條球道的中心距離
const shade=(hex,k)=>{ const n=parseInt(hex.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(k<0?v*(1+k):v+(255-v)*k))); return 'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')'; };
function poly(ctx,pts,col){ ctx.fillStyle=col; ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); ctx.fill(); }
// 一支球瓶（q 是投影後的 [x, y, 縮放]）
function pinAt(ctx,q,down,rot){
  const s=q[2]; ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(q[0],q[1],3.2*s,1.2*s,0,0,7); ctx.fill();
  ctx.save(); ctx.translate(q[0],q[1]);
  if(down){ ctx.rotate(rot); ctx.fillStyle='#f4f4f4'; ctx.beginPath(); ctx.ellipse(0,-1.2*s,7*s,2.3*s,0,0,7); ctx.fill(); ctx.fillStyle='#e23b3b'; ctx.fillRect(2.5*s,-3.2*s,1.4*s,4*s); }
  else { ctx.fillStyle='#f6f6f6'; ctx.beginPath(); ctx.ellipse(0,-5*s,2.4*s,5*s,0,0,7); ctx.fill(); ctx.fillRect(-1.1*s,-12.5*s,2.2*s,4*s); ctx.beginPath(); ctx.arc(0,-13.4*s,1.6*s,0,7); ctx.fill();
    ctx.fillStyle='#e23b3b'; ctx.fillRect(-1.2*s,-11.4*s,2.4*s,.9*s); ctx.fillRect(-1.2*s,-9.8*s,2.4*s,.6*s); ctx.fillStyle='rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(1*s,-5*s,1.2*s,4.6*s,0,0,7); ctx.fill(); }
  ctx.restore();
}
// 整個球館：P(x,y,z) 把球道座標投影到畫面；中間那條球道的球瓶由呼叫的人自己畫
function hall(ctx,w,h,P,camY,L,t,hy){
  const pal=HALL[L.bg]||HALL.alley,y0=camY-80,y1=PINY+56,yM=PINY-18,X=5.5*PITCH;
  let g=ctx.createLinearGradient(0,0,0,hy+20); g.addColorStop(0,pal.ceil); g.addColorStop(1,pal.wall); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  // 後牆的霓虹招牌
  { const q=P(0,y1+40,92); ctx.save(); ctx.font='900 '+Math.max(6,15*q[2])+'px '+PIX; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.shadowColor=pal.sign; ctx.shadowBlur=10*q[2]; ctx.fillStyle=pal.sign; ctx.globalAlpha=.85+.15*Math.sin(t*4); ctx.fillText('BOWLING',q[0],q[1]); ctx.restore(); }
  // 球瓶後面的黑色球坑
  poly(ctx,[P(-X,y1,0),P(X,y1,0),P(X,y1,34),P(-X,y1,34)],'#07060f');
  // 地板（球道之間的隔板）
  poly(ctx,[P(-X,y0,0),P(X,y0,0),P(X,y1,0),P(-X,y1,0)],pal.cap);
  const laneCol=L.lane,appr=shade(laneCol,-.18),board='rgba(0,0,0,.09)';
  for(const k of [-5,5,-4,4,-3,3,-2,2,-1,1,0]){
    const ox=k*PITCH,S=(x,y)=>P(ox+x,y,0);
    poly(ctx,[S(-LW-7,0),S(LW+7,0),S(LW+7,y1),S(-LW-7,y1)],pal.gutter);                    // 球溝
    { const a=S(-LW-3.5,0),b=S(-LW-3.5,y1),c=S(LW+3.5,0),d=S(LW+3.5,y1); ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.moveTo(c[0],c[1]); ctx.lineTo(d[0],d[1]); ctx.stroke(); }
    poly(ctx,[S(-LW-2,y0),S(LW+2,y0),S(LW+2,0),S(-LW-2,0)],appr);                            // 助走區
    poly(ctx,[S(-LW,0),S(LW,0),S(LW,y1),S(-LW,y1)],laneCol);                                  // 球道
    poly(ctx,[S(-LW*.55,0),S(LW*.55,0),S(LW*.4,430),S(-LW*.4,430)],'rgba(255,255,255,.07)'); // 前段油光
    ctx.strokeStyle=board; ctx.lineWidth=1; ctx.beginPath(); for(let i=-6;i<=6;i++){ const a=S(i*3.2,0),b=S(i*3.2,y1); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); } ctx.stroke();
    poly(ctx,[S(-LW,0),S(LW,0),S(LW,2),S(-LW,2)],'#14122b');                                 // 犯規線
    ctx.fillStyle='rgba(20,18,43,.55)'; for(const yy of [-14,-38]) for(const xx of [-15,-9,-3,3,9,15]){ const q=S(xx,yy); ctx.beginPath(); ctx.ellipse(q[0],q[1],.9*q[2],.35*q[2],0,0,7); ctx.fill(); } // 助走點
    ctx.fillStyle='#7a4a1f'; for(let i=-3;i<=3;i++){ const y=180-Math.abs(i)*12,a=S(i*5,y),b=S(i*5-1.2,y-14),c=S(i*5+1.2,y-14); ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.lineTo(c[0],c[1]); ctx.fill(); } // 瞄準箭頭
    poly(ctx,[S(-LW-7,PINY-14),S(LW+7,PINY-14),S(LW+7,y1),S(-LW-7,y1)],'rgba(255,255,255,.14)'); // 球瓶區
    if(k) for(const sp of SPOTS.slice().sort((a,b)=>b[1]-a[1])) pinAt(ctx,S(sp[0],sp[1]),false,0);
  }
  // 遮住置瓶機的遮板，每條球道有號碼
  { const tl=P(-X,yM,54),tr=P(X,yM,54),br=P(X,yM,24),bl=P(-X,yM,24),gg=ctx.createLinearGradient(0,tl[1],0,bl[1]); gg.addColorStop(0,pal.mask[0]); gg.addColorStop(1,pal.mask[1]);
    poly(ctx,[tl,tr,br,bl],gg); ctx.strokeStyle=pal.neon; ctx.lineWidth=Math.max(1,1.2*bl[2]); ctx.shadowColor=pal.neon; ctx.shadowBlur=6; ctx.beginPath(); ctx.moveTo(bl[0],bl[1]); ctx.lineTo(br[0],br[1]); ctx.moveTo(tl[0],tl[1]); ctx.lineTo(tr[0],tr[1]); ctx.stroke(); ctx.shadowBlur=0;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    for(let k=-5;k<=5;k++){ const q=P(k*PITCH,yM,39),e=P(k*PITCH+PITCH/2,yM,54),f=P(k*PITCH+PITCH/2,yM,24); ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(e[0],e[1]); ctx.lineTo(f[0],f[1]); ctx.stroke();
      ctx.font='900 '+Math.max(5,11*q[2])+'px '+PIX; ctx.fillStyle=k?'rgba(255,255,255,.55)':pal.num; ctx.fillText(String(7+k),q[0],q[1]); } }
  // 天花板的燈
  for(let y=Math.ceil((camY-30)/100)*100;y<PINY-30;y+=100) for(let k=-5;k<=5;k++){ const q=P(k*PITCH,y,118); if(q[1]<-20||q[0]<-40||q[0]>w+40) continue;
    ctx.globalAlpha=.22; ctx.fillStyle=pal.light; ctx.beginPath(); ctx.ellipse(q[0],q[1],15*q[2],4*q[2],0,0,7); ctx.fill(); ctx.globalAlpha=1; ctx.beginPath(); ctx.ellipse(q[0],q[1],9*q[2],1.6*q[2],0,0,7); ctx.fill(); }
}

/* ---- 正式計分 ---- */
// frames：每一局的投球瓶數陣列。回傳每一局的累計分數，還算不出來的（等加分球）是 null。
function scoreFrames(frames,N){
  const flat=[],at=[]; for(let f=0;f<N;f++){ at.push(flat.length); for(const r of frames[f]||[]) flat.push(r); }
  const out=[]; let tot=0,stop=false;
  for(let f=0;f<N;f++){
    const fr=frames[f]||[],i=at[f]; let v=null;
    if(!stop&&fr.length){
      if(f<N-1){
        if(fr[0]===10){ if(flat[i+1]!=null&&flat[i+2]!=null) v=10+flat[i+1]+flat[i+2]; }            // 全倒：加後面兩球
        else if(fr.length>=2){ if(fr[0]+fr[1]===10){ if(flat[i+2]!=null) v=10+flat[i+2]; } else v=fr[0]+fr[1]; } // 補中：加後面一球
      } else { const need=fr[0]===10||fr[0]+(fr[1]||0)===10?3:2; if(fr.length>=need) v=fr.reduce((a,b)=>a+b,0); } // 最後一局：全倒或補中可加投
    }
    if(v==null){ stop=true; out.push(null); } else { tot+=v; out.push(tot); }
  }
  return out;
}
const totalOf=(frames,N)=>{ const s=scoreFrames(frames,N); for(let i=N-1;i>=0;i--) if(s[i]!=null) return s[i]; return 0; };
// 每一球在記分表上的記號
function marks(fr,last){
  const m=[]; if(!fr) return m;
  if(!last){ if(fr[0]===10) return ['','X']; m.push(fr[0]===0?'-':String(fr[0])); if(fr.length>1) m.push(fr[0]+fr[1]===10?'/':fr[1]===0?'-':String(fr[1])); return m; }
  const sp1=fr[0]!==10&&fr[0]+fr[1]===10; // 前兩球補中，第三球是新的一組瓶
  for(let i=0;i<fr.length;i++){ const v=fr[i],pv=fr[i-1];
    if(v===10&&(i===0||pv===10||(i===2&&sp1))) m.push('X');
    else if(i>0&&pv!==10&&pv+v===10&&!(i===2&&sp1)) m.push('/');
    else m.push(v===0?'-':String(v)); }
  return m;
}

function create(env,opts){
  const net=opts.net,N=+(opts.variant||5)||5,L=opts.look||{ball:BALLS[0],lane:'#d9a45c',bg:'alley'},me=net?net.me:0;
  let np=net?net.count:Math.max(1,Math.min(4,+(opts.mode||1)||1));
  const {ctx,canvas}=env.canvas2d(W,H);
  // 滑鼠或手指按在畫面上，等同按住投球鍵
  let md=false,mdHit=false; const onDown=e=>{ md=true; mdHit=true; e.preventDefault(); },onUp=()=>{ md=false; };
  canvas.addEventListener('pointerdown',onDown); addEventListener('pointerup',onUp); addEventListener('pointercancel',onUp);
  const PL=[]; for(let i=0;i<np;i++) PL.push({name:net?(net.names&&net.names[i])||'玩家'+(i+1):np===1?(opts.name||'你'):'玩家 '+(i+1),frames:[],f:0,gone:false,
    col:net?((net.looks&&net.looks[i]&&net.looks[i].ball)||BALLS[i]):i===0?L.ball:BALLS[i]});
  if(!net) for(let i=1;i<np;i++) if(PL[i].col===PL[0].col) PL[i].col=BALLS.find(c=>!PL.some(p=>p.col===c))||BALLS[i];
  /* 電腦對手：開始前選幾位，排在玩家後面 */
  const nc=net?0:Math.max(0,Math.min(4-np,+((opts.options||{}).cpu)||0)),CPUN=['小保','阿龍','球球'];
  for(let k=0;k<nc;k++) PL.push({name:'電腦'+CPUN[k],frames:[],f:0,gone:false,ai:true,col:BALLS.find(c=>!PL.some(p=>p.col===c))||BALLS[k]});
  np+=nc; let aiT=0,aiPlan=null;
  let cur=opts.first===1&&np===2?1:0,phase='aim',step=0,pos=0,ang=0,pow=0,spin=0,ptype=0,charging=false,prevHeld=false,t=0,mt=0,stand=1023,pins=[],ball=null,camY=0,rollT=0,doneT=0,banner='',banT=0,pending=null,waitRes=false,ended=false,fx=[];
  const local=i=>!net||i===me;
  const sfx=n=>env.sfx(n);
  function setPins(mask){ pins=SPOTS.map((s,i)=>({i,x:s[0],y:s[1],vx:0,vy:0,up:!!(mask>>i&1),down:false,rot:0,out:!(mask>>i&1)})); }
  setPins(1023);

  function newTurn(){ stand=1023; setPins(1023); phase='aim'; step=0; mt=0; ball=null; camY=0; pos=0; pow=0; charging=false; aiT=0; aiPlan=null; }
  function nextPlayer(){
    for(let k=0;k<np;k++){ cur=(cur+1)%np; if(!PL[cur].gone&&PL[cur].f<N){ newTurn(); return; } }
    finish();
  }
  // 一球的結果：倒了幾支、還站著哪些
  function applyResult(mask){
    const pl=PL[cur],f=pl.f,fr=pl.frames[f]||(pl.frames[f]=[]),before=bits(stand),after=bits(mask),c=before-after;
    fr.push(c); stand=mask;
    const last=f===N-1; let over=false,reset=false;
    if(!last){ over=fr.length===2||c===10&&fr.length===1; }
    else if(fr.length===1){ if(c===10) reset=true; }
    else if(fr.length===2){ if(fr[0]===10){ if(c===10) reset=true; } else if(fr[0]+fr[1]===10) reset=true; else over=true; }
    else over=true;
    const strike=c===10&&before===10,spare=!strike&&after===0&&c>0;
    banner=strike?'全倒 STRIKE!':spare?'補中 SPARE!':c===0?'洗溝…':c+' 支'; banT=1.5;
    sfx(strike?'win':spare?'item':c===0?'lose':'land');
    if(strike||spare) for(let i=0;i<40;i++){ const a=Math.random()*6.283,v=80+Math.random()*180; fx.push({x:W/2,y:150,vx:Math.cos(a)*v,vy:Math.sin(a)*v-60,life:1,col:['#ffd23f','#ff5d8f','#3ddbd9','#fff'][i%4]}); }
    phase='settle'; doneT=1.5; pending={over,reset};
  }
  const bits=m=>{ let n=0; for(let i=0;i<10;i++) if(m>>i&1) n++; return n; };
  function afterSettle(){
    const pl=PL[cur],p=pending; pending=null;
    if(p.over){ pl.f++; nextPlayer(); }
    else { if(p.reset){ stand=1023; } setPins(stand); phase='aim'; step=0; mt=0; ball=null; camY=0; pow=0; charging=false; aiT=0; aiPlan=null; }
  }
  function finish(){
    if(ended) return; ended=true; phase='done';
    const rank=PL.map((p,i)=>({i,name:p.name,s:totalOf(p.frames,N),gone:p.gone})).sort((a,b)=>b.s-a.s),mine=totalOf(PL[net?me:0].frames,N);
    const top=rank[0],win=np>1&&top.i===(net?me:-1);
    sfx(np===1||win||!net?'win':'lose');
    env.end({title:np===1?'比賽結束':net?(win?'你贏了！':top.name+' 獲勝'):top.name+' 獲勝',big:np===1?mine+' 分':'',
      html:np>1?'<ul class="rest">'+rank.map((r,n)=>'<li>第 '+(n+1)+' 名　'+r.name+'　'+r.s+' 分'+(r.gone?'（離開）':'')+'</li>').join('')+'</ul>':'',
      text:N+' 局賽'+(np===1?'，滿分 '+N*30+' 分。':''),score:np===1||net||nc?mine:rank[0].s});
  }

  /* ---- 滾球 ---- */
  function launch(x,a,p,s,u){
    const v=235+p*150; ball={x,y:-6,vx:Math.sin(a)*v,vy:Math.cos(a)*v,spin:s,ufo:!!u,gutter:false,done:false,rot:0,spinA:0};
    phase='roll'; rollT=0; waitRes=false; sfx('place');
  }
  function pathOf(x,p,sp,u){
    const v=235+p*150,out=[]; let vx=0,y=-6,g=false;
    for(let i=0;i<400&&y<PINY+30;i++){ if(!g){ vx+=hookOf(y,sp,u)*.02; if(Math.abs(x)>LW-.4){ g=true; x=Math.sign(x)*(LW+3.2); vx=0; } } x+=vx*.02; y+=v*.02; if(i%3===0) out.push([x,y]); }
    return out;
  }
  function simStep(dt){
    const b=ball; rollT+=dt;
    if(!b.done){
      b.spinA+=dt*(b.ufo?16:0);
      if(!b.gutter){ b.vx+=hookOf(b.y,b.spin,b.ufo)*dt; if(Math.abs(b.x)>LW-.4){ b.gutter=true; b.x=Math.sign(b.x)*(LW+3.2); b.vx=0; sfx('bump'); } }
      b.x+=b.vx*dt; b.y+=b.vy*dt; b.rot+=b.vy*dt*.05;
      if(b.y>PINY+60) b.done=true;
    }
    for(const p of pins){ if(p.out) continue; p.x+=p.vx*dt; p.y+=p.vy*dt; const f=Math.exp(-1.7*dt); p.vx*=f; p.vy*=f; if(p.down) p.rot+=Math.hypot(p.vx,p.vy)*dt*.06;
      if(Math.abs(p.x)>29){ p.x=Math.sign(p.x)*29; p.vx*=-.5; } if(p.y>PINY+52||p.y<PINY-40){ p.out=true; } }
    const bodies=pins.filter(p=>!p.out);
    const hit=(A,B,ra,rb,ma,mb)=>{ const dx=B.x-A.x,dy=B.y-A.y,d=Math.hypot(dx,dy),min=ra+rb; if(d>=min||d<1e-4) return 0;
      const nx=dx/d,ny=dy/d,rv=(B.vx-A.vx)*nx+(B.vy-A.vy)*ny,ov=min-d; A.x-=nx*ov*mb/(ma+mb); A.y-=ny*ov*mb/(ma+mb); B.x+=nx*ov*ma/(ma+mb); B.y+=ny*ov*ma/(ma+mb);
      if(rv>0) return 0; const j=-(1+.72)*rv/(1/ma+1/mb); A.vx-=j/ma*nx; A.vy-=j/ma*ny; B.vx+=j/mb*nx; B.vy+=j/mb*ny; return -rv; };
    if(!b.done&&!b.gutter) for(const p of bodies){ const s=hit(b,p,BR,p.down?3.4:PR,6,1.5); if(s>0&&b.ufo) p.vx+=(p.x>=b.x?1:-1)*s*.35; if(s>14){ if(!p.down){ p.down=true; p.up=false; sfx('boom'); } } }
    for(let i=0;i<bodies.length;i++) for(let k=i+1;k<bodies.length;k++){ const A=bodies[i],B=bodies[k],s=hit(A,B,A.down?3.4:PR,B.down?3.4:PR,1.5,1.5);
      if(s>12){ if(!A.down){ A.down=true; A.up=false; } if(!B.down){ B.down=true; B.up=false; } } }
    // 球過了球瓶區、球瓶也停了，就結算
    let moving=false; for(const p of bodies) if(Math.hypot(p.vx,p.vy)>5) moving=true;
    if((b.done&&(!moving||rollT>7))||rollT>9){
      if(local(cur)){ let mask=0; for(const p of pins) if(p.up&&!p.down&&!p.out) mask|=1<<p.i; if(net) net.send({rs:[cur,mask]}); applyResult(mask); }
      else waitRes=true;
    }
  }
  if(net){
    net.onmsg=(m,from)=>{
      if(net.host&&from&&(m.th||m.rs)) net.send(m); // 房主把別人的投球轉給所有人
      if(m.th&&m.th[0]!==me&&m.th[0]===cur&&phase==='aim') launch(m.th[1],m.th[2],m.th[3],m.th[4],m.th[5]);
      if(m.rs&&m.rs[0]!==me&&m.rs[0]===cur){ if(phase==='aim') launch(0,0,.7,0); pendRes=m.rs[1]; }
      if(m.gone!=null) leave(m.gone);
    };
    net.onleave=i=>{ net.send({gone:i}); leave(i); };
  }
  let pendRes=null;
  function leave(i){ const p=PL[i]; if(!p||p.gone) return; p.gone=true; if(cur===i&&phase!=='done'){ pending=null; pendRes=null; nextPlayer(); } }

  function update(dt){
    t+=dt; if(banT>0) banT-=dt;
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.life-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=260*dt; if(f.life<=0) fx.splice(i,1); }
    if(phase==='done') return;
    if(phase==='aim'){
      camY+=(0-camY)*Math.min(1,dt*6); mt+=dt;
      if(PL[cur].ai){ aiT+=dt;
        if(!aiPlan){ /* 試每種球種和站位，找能打進球瓶最多的那條路線（全倒瞄口袋，補中瞄剩下的瓶子） */
          const up=pins.filter(q=>q.up&&!q.out),tx=stand===1023?2.6:up.reduce((a,q)=>a+q.x,0)/Math.max(1,up.length); let best=null;
          for(let ty=0;ty<TYPES.length;ty++){ if(TYPES[ty].ufo) continue; for(let x=-15;x<=15;x+=1.5){ const pa=pathOf(x,.72,TYPES[ty].spin,false),e=pa[pa.length-1],sc=Math.abs(e[0]-tx)+(Math.abs(e[0])>LW-1?99:0); if(!best||sc<best.sc) best={sc,ty,x}; } }
          aiPlan={ty:best.ty,x:Math.max(-16,Math.min(16,best.x+(Math.random()-.5)*3.2)),p:.62+Math.random()*.2}; }
        ptype=aiPlan.ty; spin=TYPES[ptype].spin; step=aiT>.7?1:0;
        if(step) pos+=(aiPlan.x-pos)*Math.min(1,dt*4);
        if(aiT>1.6){ charging=true; pow=Math.min(aiPlan.p,(aiT-1.6)*1.4); }
        if(aiT>1.6+aiPlan.p/1.4+.15){ charging=false; launch(aiPlan.x,0,aiPlan.p,TYPES[ptype].spin,false); }
      }
      else if(local(cur)){
        const K=env.keys,mx=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0),held=!!(K.Space||K.KeyJ||K.Enter||md),tapK=env.hit('Space')||env.hit('KeyJ')||env.hit('Enter')||mdHit;
        if(step===0){ // 先選球種
          if(env.hit('ArrowRight')||env.hit('ArrowDown')||env.hit('KeyD')){ ptype=(ptype+1)%TYPES.length; sfx('click'); }
          if(env.hit('ArrowLeft')||env.hit('ArrowUp')||env.hit('KeyA')){ ptype=(ptype+TYPES.length-1)%TYPES.length; sfx('click'); }
          spin=TYPES[ptype].spin; if(tapK&&mt>.25){ step=1; mt=0; charging=false; sfx('click'); }
        } else { // 再選站位，長按蓄力、放開丟出
          if(!charging){ pos=Math.max(-16,Math.min(16,pos+mx*22*dt)); if(env.hit('ArrowUp')){ step=0; mt=0; sfx('click'); } else if(held&&!prevHeld&&mt>.2){ charging=true; mt=0; } }
          else { pow=.5-Math.cos(mt*2.6)*.5; if(!held){ const p2=Math.max(.12,pow),sp=TYPES[ptype].spin; charging=false; const u=!!TYPES[ptype].ufo; if(net) net.send({th:[cur,pos,0,p2,sp,u?1:0]}); launch(pos,0,p2,sp,u); } }
        }
        prevHeld=held;
      }
      mdHit=false;
    } else if(phase==='roll'){
      if(!waitRes){ simStep(dt/2); if(phase==='roll'&&!waitRes) simStep(dt/2); }
      if(phase==='roll'){ if(waitRes&&pendRes!=null){ const m=pendRes; pendRes=null; waitRes=false; applyResult(m); } }
      if(ball) camY+=(Math.max(0,Math.min(PINY-175,ball.y-60))-camY)*Math.min(1,dt*8);
    } else if(phase==='settle'){ doneT-=dt; if(doneT<=0) afterSettle(); }
  }

  /* ---- 畫面：鏡頭在投球的人後上方，會跟著球往前推 ---- */
  const HY=96,F=520,CH=30;
  const proj=(x,y,z)=>{ const d=Math.max(20,y-camY+105),s=F/d; return [W/2+x*s,HY+(CH-(z||0))*s,s]; };
  function quad(a,b,c,d,col){ ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.lineTo(c[0],c[1]); ctx.lineTo(d[0],d[1]); ctx.fill(); }
  function drawPin(p){ const q=proj(p.x,p.y,0); if(q[1]>H+20) return; pinAt(ctx,q,p.down,p.rot+p.i); }
  function drawBoard(){
    const rowH=13,top=2,nameW=58,cw=(W-nameW-36)/N,lastW=cw;
    ctx.fillStyle='rgba(11,10,28,.9)'; ctx.fillRect(0,0,W,top+12+rowH*np+3);
    ctx.textBaseline='middle'; ctx.font='700 9px '+TC; ctx.textAlign='center'; ctx.fillStyle='#aaa4d8';
    for(let f=0;f<N;f++) ctx.fillText(String(f+1),nameW+cw*f+cw/2,top+6); ctx.fillText('總分',W-18,top+6);
    PL.forEach((p,i)=>{ const y=top+12+i*rowH,sc=scoreFrames(p.frames,N),act=i===cur&&phase!=='done';
      ctx.fillStyle=act?'rgba(255,210,63,.22)':'rgba(255,255,255,.05)'; ctx.fillRect(0,y,W,rowH-1);
      ctx.fillStyle=p.col; ctx.beginPath(); ctx.arc(7,y+rowH/2-.5,3.5,0,7); ctx.fill();
      ctx.textAlign='left'; ctx.font='700 10px '+TC; ctx.fillStyle=p.gone?'#6b6799':net&&i===me?'#ffd23f':'#fff'; ctx.fillText(p.name.slice(0,5),14,y+rowH/2);
      for(let f=0;f<N;f++){ const x=nameW+cw*f,mk=marks(p.frames[f],f===N-1);
        ctx.strokeStyle='rgba(255,255,255,.18)'; ctx.lineWidth=1; ctx.strokeRect(x+.5,y+.5,cw-1,rowH-2);
        ctx.font='700 8px '+TC; ctx.textAlign='right'; ctx.fillStyle='#ffd23f'; ctx.fillText(mk.join(' '),x+cw-3,y+4);
        if(sc[f]!=null){ ctx.font='700 9px '+TC; ctx.textAlign='left'; ctx.fillStyle='#fff'; ctx.fillText(String(sc[f]),x+3,y+rowH-5); } }
      ctx.textAlign='center'; ctx.font='9px '+PIX; ctx.fillStyle='#fff'; ctx.fillText(String(totalOf(p.frames,N)),W-18,y+rowH/2); });
    return top+12+rowH*np+3;
  }
  function draw(){
    hall(ctx,W,H,proj,camY,L,t,HY);
    for(const p of pins.slice().sort((a,b)=>b.y-a.y)) if(!p.out) drawPin(p);
    // 球
    const b=ball||{x:pos,y:-6,rot:0},q=proj(b.x,b.y,BR),col=PL[cur].col;
    if(!ball||!ball.done){ const sh=proj(b.x,b.y,0); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(sh[0],sh[1],BR*sh[2],BR*sh[2]*.35,0,0,7); ctx.fill();
      ctx.fillStyle=col; ctx.beginPath(); ctx.arc(q[0],q[1],BR*q[2],0,7); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(q[0]-BR*q[2]*.35,q[1]-BR*q[2]*.4,BR*q[2]*.22,0,7); ctx.fill();
      const ufo=ball?ball.ufo:!!TYPES[ptype].ufo,R=BR*q[2];
      if(ufo){ const sa=ball?ball.spinA:t*6; ctx.fillStyle='rgba(0,0,0,.55)'; for(let i=0;i<3;i++){ const a=sa+i*2.094; ctx.beginPath(); ctx.ellipse(q[0]+Math.cos(a)*R*.45,q[1]-R*.45+Math.sin(a)*R*.16,R*.1,R*.07,0,0,7); ctx.fill(); }
        if(ball&&!ball.done){ ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.lineWidth=Math.max(1,R*.08); for(let i=0;i<2;i++){ ctx.beginPath(); ctx.ellipse(q[0],q[1]-R*.1,R*(1.25+i*.25),R*(.38+i*.08),0,ball.spinA+i,ball.spinA+i+2.2); ctx.stroke(); } } }
      else { ctx.fillStyle='rgba(0,0,0,.55)'; for(let i=0;i<3;i++){ const a=b.rot+i*.5; ctx.beginPath(); ctx.arc(q[0]+Math.cos(a)*R*.4,q[1]+Math.sin(a)*R*.4*.8,R*.1,0,7); ctx.fill(); } } }
    const by=drawBoard();
    // 右上角：還站著的球瓶
    { const ox=W-52,oy=by+6; ctx.fillStyle='rgba(11,10,28,.7)'; ctx.fillRect(ox-6,oy-4,54,44); SPOTS.forEach((s,i)=>{ const up=phase==='roll'?pins[i].up&&!pins[i].down&&!pins[i].out:!!(stand>>i&1); ctx.fillStyle=up?'#fff':'#3a3670'; ctx.beginPath(); ctx.arc(ox+21+s[0]*1.15,oy+34-(s[1]-PINY)*.95,3,0,7); ctx.fill(); }); }
    // 操作列
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(phase==='aim'){
      const mine=local(cur),who=PL[cur].name,fr=PL[cur].frames[PL[cur].f]||[];
      ctx.font='700 12px '+TC; ctx.lineWidth=4; ctx.strokeStyle='#14122b'; const head='第 '+(PL[cur].f+1)+' 局 第 '+(fr.length+1)+' 球　'+(np>1?'輪到 '+who:'');
      ctx.strokeText(head,W/2,by+12); ctx.fillStyle='#fff'; ctx.fillText(head,W/2,by+12);
      if(mine){
        ctx.fillStyle='rgba(11,10,28,.8)'; ctx.fillRect(8,by+22,96,TYPES.length*14+20); ctx.textAlign='left'; ctx.font='700 9px '+TC; ctx.fillStyle='#6fd3ff'; ctx.fillText(step===0?'① 選球種（← →）':'球種（↑ 重選）',13,by+31);
        TYPES.forEach((q,i)=>{ ctx.font=(i===ptype?'900 ':'700 ')+'11px '+TC; ctx.fillStyle=i===ptype?'#ffd23f':step===0?'#aaa4d8':'#6b6799'; ctx.fillText((i===ptype?'▶ ':'　')+q.name,13,by+46+i*14); });
        if(step===1){ // 俯視的球道小圖，畫出這一球大概會怎麼走
          const ox=W-74,oy=by+74,mw=40,mh=H-oy-16,sx=x=>ox+mw/2+x/(LW+6)*mw/2,sy=y=>oy+mh-(y+10)/(PINY+50)*mh;
          ctx.fillStyle='rgba(11,10,28,.8)'; ctx.fillRect(ox-8,oy-14,mw+16,mh+22); ctx.fillStyle='#1b1420'; ctx.fillRect(ox,oy,mw,mh); ctx.fillStyle=L.lane; ctx.fillRect(sx(-LW),oy,sx(LW)-sx(-LW),mh);
          ctx.fillStyle='#fff'; SPOTS.forEach((sp,i)=>{ if(stand>>i&1){ ctx.beginPath(); ctx.arc(sx(sp[0]),sy(sp[1]),1.6,0,7); ctx.fill(); } });
          const pp=pathOf(pos,charging?Math.max(.12,pow):.7,TYPES[ptype].spin,TYPES[ptype].ufo); ctx.strokeStyle='#ff3b3b'; ctx.lineWidth=2; ctx.setLineDash([4,3]); ctx.beginPath(); pp.forEach((q,i)=>{ i?ctx.lineTo(sx(q[0]),sy(q[1])):ctx.moveTo(sx(q[0]),sy(q[1])); }); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle=col; ctx.beginPath(); ctx.arc(sx(pos),sy(-6),3,0,7); ctx.fill(); ctx.textAlign='center'; ctx.font='700 9px '+TC; ctx.fillStyle='#6fd3ff'; ctx.fillText('路徑',ox+mw/2,oy-7);
          // 球道上也畫一條
          ctx.strokeStyle='rgba(255,59,59,.85)'; ctx.lineWidth=2; ctx.setLineDash([6,5]); ctx.beginPath(); pp.forEach((q,i)=>{ const a=proj(q[0],q[1],.2); i?ctx.lineTo(a[0],a[1]):ctx.moveTo(a[0],a[1]); }); ctx.stroke(); ctx.setLineDash([]);
          // 力道條
          ctx.fillStyle='rgba(11,10,28,.8)'; ctx.fillRect(W/2-90,H-34,180,14); ctx.fillStyle='#2b2759'; ctx.fillRect(W/2-86,H-31,172,8); ctx.fillStyle=pow>.85?'#ff5d4f':pow>.5?'#ffd23f':'#86dc4f'; ctx.fillRect(W/2-86,H-31,172*(charging?pow:0),8);
        }
        const tip=env.touch?(step===0?'◀ ▶ 選球種，按「投球」確認':charging?'放開就丟出去！':'◀ ▶ 選站位，按住「投球」蓄力'):(step===0?'選好球種按空白鍵（或點畫面）':charging?'放開就丟出去！':'← → 選站位，按住空白鍵（或按住滑鼠左鍵）蓄力');
        ctx.textAlign='center'; ctx.font='900 13px '+TC; ctx.lineWidth=4; ctx.strokeStyle='#14122b'; ctx.strokeText(tip,W/2,H-46); ctx.fillStyle='#ffd23f'; ctx.fillText(tip,W/2,H-46); }
      else { ctx.font='900 14px '+TC; ctx.lineWidth=4; ctx.strokeStyle='#14122b'; ctx.strokeText('等 '+who+' 投球…',W/2,H-18); ctx.fillStyle='#ffd23f'; ctx.fillText('等 '+who+' 投球…',W/2,H-18); }
    }
    for(const f of fx){ ctx.globalAlpha=Math.max(0,f.life); ctx.fillStyle=f.col; ctx.fillRect(f.x-2,f.y-2,4,4); } ctx.globalAlpha=1;
    if(banT>0&&banner){ const k=1+Math.max(0,banT-1.2)*1.2; ctx.save(); ctx.translate(W/2,150); ctx.scale(k,k); ctx.font='900 30px '+TC; ctx.lineWidth=7; ctx.strokeStyle='#14122b'; ctx.strokeText(banner,0,0); ctx.fillStyle=/STRIKE|SPARE/.test(banner)?'#ffd23f':'#fff'; ctx.fillText(banner,0,0); ctx.restore(); }
  }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',onDown); removeEventListener('pointerup',onUp); removeEventListener('pointercancel',onUp); },_dbg:{PL,get phase(){return phase;},get cur(){return cur;},get stand(){return stand;},throw:(x,a,p,s,u)=>launch(x,a,p,s,u),scoreFrames}};
}

function scene(ctx,w,h,L,t){
  const k=w/480,F=520*k,hy=h*.3,camY=500,CH=30,P=(x,y,z)=>{ const d=Math.max(20,y-camY+105),s=F/d; return [w/2+x*s,hy+(CH-(z||0))*s,s]; };
  hall(ctx,w,h,P,camY,L,t,hy);
  const T=3.4,u=(t%T)/T,hitU=.5,Y0=camY-50,bx=y=>{ const q=(y-Y0)/(PINY-Y0); return 7-Math.pow(Math.max(0,q),2)*7.5; };
  // 球瓶：球撞到之後往外飛散倒下
  const tt=Math.max(0,(u-hitU)*T),pins=SPOTS.map((sp,i)=>{ const dx=sp[0],dy=sp[1]-(PINY-6),dl=Math.hypot(dx,dy)||1,late=dl/40,go=Math.max(0,tt-late*.25),sp2=60+((i*37)%5)*12,dd=sp2*(1-Math.exp(-go*2.2))/2.2;
    return {x:sp[0]+dx/dl*dd+(i%2?1:-1)*go*6,y:sp[1]+dy/dl*dd*.6+go*8,down:go>0,rot:i*1.3+go*3}; });
  for(const p of pins.sort((a,b)=>b.y-a.y)) pinAt(ctx,P(p.x,p.y,0),p.down,p.rot);
  // 球
  if(u<hitU+.12){ const y=Y0+(PINY+10-Y0)*Math.min(1,u/hitU),x=bx(y),q=P(x,y,BR),sh=P(x,y,0),R=BR*q[2];
    ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(sh[0],sh[1],R,R*.35,0,0,7); ctx.fill();
    for(let i=1;i<=4;i++){ const yy=y-i*16,tq=P(bx(yy),yy,BR); ctx.globalAlpha=.12*(5-i)/4; ctx.fillStyle=L.ball; ctx.beginPath(); ctx.arc(tq[0],tq[1],BR*tq[2],0,7); ctx.fill(); } ctx.globalAlpha=1;
    const gr=ctx.createRadialGradient(q[0]-R*.35,q[1]-R*.4,R*.1,q[0],q[1],R); gr.addColorStop(0,shade(L.ball,.45)); gr.addColorStop(1,shade(L.ball,-.35)); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(q[0],q[1],R,0,7); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,.55)'; for(let i=0;i<3;i++){ const a=t*9+i*.5; ctx.beginPath(); ctx.arc(q[0]+Math.cos(a)*R*.4,q[1]+Math.sin(a)*R*.32,R*.1,0,7); ctx.fill(); } }
  // 全倒字樣
  if(u>hitU+.06){ const a=Math.min(1,(u-hitU-.06)*8),sc=1+Math.max(0,.25-(u-hitU-.06))*2;
    for(let i=0;i<18;i++){ const ang=i*.349+1,r=(u-hitU)*w*.5*(.6+(i%3)*.2); ctx.globalAlpha=a*Math.max(0,1-(u-hitU)*1.6); ctx.fillStyle=['#ffd23f','#ff5d8f','#3ddbd9','#fff'][i%4]; ctx.fillRect(w/2+Math.cos(ang)*r,h*.42+Math.sin(ang)*r*.6,4*k,4*k); }
    ctx.globalAlpha=a; ctx.save(); ctx.translate(w/2,h*.2); ctx.scale(sc,sc); ctx.font='900 '+30*k+'px '+PIX; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=7*k; ctx.strokeStyle='#14122b'; ctx.strokeText('STRIKE!',0,0); ctx.fillStyle='#ffd23f'; ctx.shadowColor='#ff5d8f'; ctx.shadowBlur=12*k; ctx.fillText('STRIKE!',0,0); ctx.restore(); ctx.globalAlpha=1; }
}
const preview=(ctx,w,h,L,t)=>scene(ctx,w,h,Object.assign({ball:BALLS[0],lane:'#d9a45c',bg:'alley'},L||{}),t); /* 還沒選過造型時用預設值 */
const thumb=(ctx,w,h,t)=>scene(ctx,w,h,{ball:'#ff5d4f',lane:'#d9a45c',bg:'alley'},t);

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).bowl={
  coin:o=>{ const n=o.net?o.net.count:Math.max(1,Math.min(4,+(o.mode||1)||1)); return n===2?{verb:'先打',names:o.net?[o.net.names[0]||'玩家 1',o.net.names[1]||'玩家 2']:['玩家 1','玩家 2']}:null; }, // 兩個人時擲硬幣決定誰先打
  name:'保齡球大賽',tag:'BOWLING',color:'#b98cff',online:true,maxPlayers:4,
  desc:'先選球種（含飛碟球），再選站位，看著路徑圖長按蓄力把球丟出去。可選 3、5、7、9 局，照正式規則計分；也可以加 1～3 位電腦對手。同一台可 1～4 人輪流，也可開房間連線，最多 4 人。',
  goal:'每局有兩球把 10 支球瓶打倒。全倒（X）加後面兩球的分數，補中（/）加後面一球；最後一局全倒或補中可以加投。',
  variants:[{id:'3',label:'3 局'},{id:'5',label:'5 局'},{id:'7',label:'7 局'},{id:'9',label:'9 局'}],
  options:[{key:'cpu',label:'電腦對手',def:'0',opts:[{id:'0',label:'不要'},{id:'1',label:'1 位'},{id:'2',label:'2 位'},{id:'3',label:'3 位'}]}],
  modes:[{id:'1',label:'1 人'},{id:'2',label:'2 人'},{id:'3',label:'3 人'},{id:'4',label:'4 人'}],
  help:[['← →','選球種（直球、曲球、飛碟球），確認後改成選站位'],['Space','確認球種；選站位時按住蓄力、放開丟球（按住滑鼠左鍵也可以）'],['↑','回去重選球種']],
  touchHelp:[['◀ ▶','選球種，確認後改成選站位'],['投球','確認球種；選站位時按住蓄力、放開丟球（按住畫面也可以）']],
  touch:{left:[{l:'◀',c:'ArrowLeft'},{l:'▶',c:'ArrowRight'}],right:[{l:'投球',c:'Space',act:true}]},
  looks:[{key:'ball',label:'球的顏色',type:'color',opts:['#ff5d4f','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#b98cff','#ff7eb6']},
    {key:'lane',label:'球道顏色',type:'color',opts:['#d9a45c','#e8c890','#b9783a','#9ad0e8','#c8a0e0','#9fd68a']},
    {key:'bg',label:'遊戲背景',opts:[{id:'alley',label:'球館'},{id:'neon',label:'霓虹'},{id:'day',label:'白天'}]}],
  best:{label:'最高分',fmt:v=>v+' 分',lower:false},
  preview,thumb,create,_score:scoreFrames
};
})();
