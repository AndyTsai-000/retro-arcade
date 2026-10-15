// 鬥魂足球：五對五（四名球員加守門員），沒有犯規，可以鏟人。助跑射門是必殺射門，集滿氣可以放超必殺。
// 人物畫法沿用躲避球的二頭身。連線時房主負責運算（左隊），加入的人是右隊，只送出按鍵。
(function(){
'use strict';
const W=480,H=300,FW=900,X0=40,X1=FW-40,YB=152,YF=264,GY0=180,GY1=236,HUD=30,MIDX=FW/2,MIDY=(YB+YF)/2;
const PIX='"Press Start 2P","Noto Sans TC","Microsoft JhengHei",monospace';
const TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const SHOT={
  fire:{name:'火焰射門',col:'#ff5d4f',spd:540},
  banana:{name:'香蕉球',col:'#ffd23f',spd:430},
  snake:{name:'蛇行射門',col:'#5fd068',spd:420},
  sky:{name:'天降射門',col:'#6fd3ff',spd:380},
  ghost:{name:'幻影射門',col:'#ff7eb6',spd:450},
  ultra:{name:'超級魂射',col:'#ff3b3b',spd:600}
};
const KINDS=Object.keys(SHOT);
const mk=(name,spd,pow,tk,shot)=>({name,spd,pow,tk,shot});
const HOME=[mk('鐵門',1,1,1,'fire'),mk('大山',.92,1.1,1.2,'sky'),mk('阿強',1,1,1.1,'snake'),mk('小虎',1.15,1,.9,'banana'),mk('阿烈',1.08,1.2,1,'fire')];
const STAGES=[
  {name:'海風隊',col:'#3d8bff',lv:.3},{name:'沙漠隊',col:'#e0a030',lv:.45},{name:'冰原隊',col:'#7fd0e8',lv:.6},
  {name:'叢林隊',col:'#3fae5a',lv:.72},{name:'鋼鐵隊',col:'#8a8fa8',lv:.85},{name:'冠軍隊',col:'#c56bff',lv:1}
];
const FOE=['門神','阿盾','老牆','飛毛','射手'],FSHOT=['fire','sky','snake','banana','ghost'];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;

function fallbackGuy(ctx,x,y,z,face,col){ ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x,y,10,3,0,0,7); ctx.fill(); ctx.fillStyle=col; ctx.fillRect(x-6,y-z-24,12,14); ctx.fillStyle='#f6c9a0'; ctx.fillRect(x-7,y-z-38,14,13); }
const guy=function(){ (window.ARCADE_GUY||fallbackGuy).apply(null,arguments); };
function drawBall(ctx,x,y,z,type,t,col){
  const R=type==='ultra'?9:5.5;
  ctx.fillStyle='rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x,y,6,2.4,0,0,7); ctx.fill();
  if(type){ const c=SHOT[type].col,g=ctx.createRadialGradient(x,y-z,R*.5,x,y-z,R*3.2); g.addColorStop(0,c); g.addColorStop(1,'rgba(255,255,255,0)'); ctx.globalAlpha=.8; ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y-z,R*3.2,0,7); ctx.fill(); ctx.globalAlpha=1; }
  ctx.fillStyle=col||'#fff'; ctx.beginPath(); ctx.arc(x,y-z,R,0,7); ctx.fill();
  ctx.fillStyle='#14122b'; for(let i=0;i<3;i++){ const a=t*9+i*2.1; ctx.beginPath(); ctx.arc(x+Math.cos(a)*R*.5,y-z+Math.sin(a)*R*.5,R*.28,0,7); ctx.fill(); }
  ctx.strokeStyle='#14122b'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(x,y-z,R,0,7); ctx.stroke();
}
// 場地用世界座標畫，cam 是鏡頭左邊的 x
function drawField(ctx,cam,grass,bg,c0,c1,t){
  if(bg==='night'){ ctx.fillStyle='#14143a'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#fff'; for(let i=0;i<40;i++) ctx.fillRect(((i*97-cam*.2)%W+W)%W,34+(i*31)%60,1.5,1.5); }
  else if(bg==='beach'){ ctx.fillStyle='#7ec8f2'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#5aa0d0'; ctx.fillRect(0,98,W,30); }
  else { ctx.fillStyle=bg==='school'?'#9fd8ff':'#8fd3ff'; ctx.fillRect(0,0,W,H); }
  ctx.save(); ctx.translate(-cam,0);
  if(bg==='school'){ for(let k=0;k<3;k++){ const bx=60+k*320; ctx.fillStyle='#f0e6d0'; ctx.fillRect(bx,56,250,72); ctx.fillStyle='#c9573f'; ctx.fillRect(bx-8,48,266,10); ctx.fillStyle='#7fb6dc'; for(let r=0;r<2;r++) for(let i=0;i<8;i++) ctx.fillRect(bx+12+i*30,66+r*28,18,16); } }
  else if(bg!=='beach'){ // 看台與觀眾
    ctx.fillStyle=bg==='night'?'#23234f':'#5a5f7a'; ctx.fillRect(0,60,FW,70);
    for(let r=0;r<4;r++) for(let i=0;i<FW/12;i++){ const hop=Math.sin(t*6+i*1.7+r)*1.5; ctx.fillStyle=['#ff5d4f','#ffd23f','#3ddbd9','#fff','#ff7eb6','#86dc4f'][(i*7+r*3)%6]; ctx.fillRect(i*12+(r%2)*6,68+r*15+hop,7,8); }
    ctx.fillStyle='#e8e8f0'; ctx.fillRect(0,126,FW,5); for(let i=0;i<8;i++){ ctx.fillStyle=i%2?c0:c1; ctx.fillRect(20+i*112,131,96,12); }
  }
  ctx.fillStyle=grass; ctx.fillRect(0,144,FW,H-144);
  ctx.fillStyle='rgba(255,255,255,.07)'; for(let i=0;i<FW/60;i+=2) ctx.fillRect(i*60,144,60,H-144);
  ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=2.5; ctx.strokeRect(X0,YB,X1-X0,YF-YB);
  ctx.beginPath(); ctx.moveTo(MIDX,YB); ctx.lineTo(MIDX,YF); ctx.stroke(); ctx.beginPath(); ctx.ellipse(MIDX,MIDY,46,30,0,0,7); ctx.stroke();
  ctx.strokeRect(X0,GY0-22,90,GY1-GY0+44); ctx.strokeRect(X1-90,GY0-22,90,GY1-GY0+44);
  ctx.restore();
}
function drawGoal(ctx,cam,side,front){ // 球門：後柱與球網先畫，前柱最後畫，球才會在網子裡面
  const gx=(side?X1:X0)-cam,d=side?1:-1;
  if(!front){ ctx.fillStyle='rgba(255,255,255,.2)'; ctx.fillRect(Math.min(gx,gx+d*22),GY0-40,22,GY1-GY0+40);
    ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=1; for(let i=0;i<=5;i++){ ctx.beginPath(); ctx.moveTo(gx+d*i*4.4,GY0-40); ctx.lineTo(gx+d*i*4.4,GY1); ctx.stroke(); } for(let j=0;j<=10;j++){ const yy=GY0-40+j*(GY1-GY0+40)/10; ctx.beginPath(); ctx.moveTo(gx,yy); ctx.lineTo(gx+d*22,yy); ctx.stroke(); }
    ctx.fillStyle='#fff'; ctx.fillRect(gx-1.5,GY0-40,3,40); ctx.fillRect(Math.min(gx,gx+d*22),GY0-41,22,3); }
  else { ctx.fillStyle='#fff'; ctx.fillRect(gx-1.5,GY1-40,3,40); ctx.fillRect(gx-1.5,GY0-41,3,GY1-GY0+3); }
}

function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,two=!net&&opts.mode==='2p',vs=two||(!!net&&net.count>1),me=net?Math.min(1,net.me):0;
  const si=opts.stage||0,foe=STAGES[si],L=opts.look||{color:'#ff5d4f',hair:'1',ball:'#ffffff',grass:'#4c9a3c',bg:'stadium'};
  const {ctx}=env.canvas2d(W,H);
  const lookOf=tm=>(net&&net.looks&&net.looks[tm])||(tm===0?L:null);
  const cols=[(lookOf(0)||L).color,vs?((lookOf(1)||{}).color||'#3d8bff'):foe.col]; if(cols[0]===cols[1]) cols[1]=cols[0]==='#3d8bff'?'#ffd23f':'#3d8bff';
  const hairs=[+(lookOf(0)||L).hair||0,vs?+((lookOf(1)||{}).hair||1):2],lv=vs?.7:foe.lv;
  // 球員：每隊 0 守門員、1-2 後衛、3-4 前鋒
  const SLOT=[[0,0],[-170,-30],[-170,30],[-60,-38],[-60,38]],P=[];
  for(let tm=0;tm<2;tm++) for(let i=0;i<5;i++){
    const dir=tm?-1:1,src=tm===0||vs?HOME[i]:mk(FOE[i],.85+lv*.3,.9+lv*.3,.8+lv*.4,FSHOT[i]);
    const hx=i===0?(tm?X1-14:X0+14):MIDX+dir*SLOT[i][0],hy=i===0?(GY0+GY1)/2+4:MIDY+SLOT[i][1];
    P.push({id:P.length,team:tm,gk:i===0,fw:i>=3,x:hx,y:hy,hx,hy,z:0,vz:0,face:dir,s:src,state:0,st:0,run:false,runT:0,kickT:0,slideT:0,slideCd:0,moving:false,
      hair:i===0?3:i===4?hairs[tm]:(hairs[tm]+i)%4,ai:{t:Math.random(),cd:0,hold:0,dy:0},rolled:-1});
  }
  const ball={x:MIDX,y:MIDY,z:40,vx:0,vy:0,vz:0,owner:-1,last:-1,type:null,t:0,base:MIDY,noPick:-1,npT:0,ghost:0,shotN:0};
  const ctrl=[4,9],human=[true,vs],inp=[blank(),blank()],tap=[{d:0,t:-9,run:0},{d:0,t:-9,run:0}],prev=[{},{}],gauge=[0,0],score=[0,0],fx=[],rings=[];
  let t=0,time=120,extra=false,cam=MIDX-W/2,freeze=0,shake=0,flash=0,cut=null,goalT=0,goalBy=-1,ended=false,msg='',msgT=0,ev=[],sendT=0,lastIn='',start=1.3,kick=0;
  function blank(){ return {mx:0,my:0,run:false,a:false,b:false,j:false,x:false}; }
  const sfx=n=>{ env.sfx(n); if(net&&net.host) ev.push(n); };
  const say=(s,sec)=>{ msg=s; msgT=sec||1.2; if(net&&net.host) ev.push('!'+s); };
  const addG=(tm,v)=>{ gauge[tm]=Math.min(100,gauge[tm]+v); };
  const goalX=tm=>tm?X0:X1; // 這一隊要攻的球門

  /* ---- 輸入 ---- */
  function keysOf(k){
    const K=env.keys,S=k===1?['KeyW','KeyS','KeyA','KeyD','KeyF','KeyG','KeyH','KeyR']:k===2?['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Comma','Period','Slash','KeyM']:null;
    if(S) return {u:K[S[0]],d:K[S[1]],l:K[S[2]],r:K[S[3]],a:env.hit(S[4]),b:env.hit(S[5]),j:env.hit(S[6]),x:env.hit(S[7])};
    return {u:K.ArrowUp||K.KeyW,d:K.ArrowDown||K.KeyS,l:K.ArrowLeft||K.KeyA,r:K.ArrowRight||K.KeyD,a:env.hit('KeyJ')||env.hit('Space'),b:env.hit('KeyK'),j:env.hit('KeyL'),x:env.hit('KeyI')};
  }
  function read(n,k){
    const q=keysOf(k),o=inp[n],tp=tap[n],pv=prev[n],mx=(q.r?1:0)-(q.l?1:0);
    if(mx&&!(mx>0?pv.r:pv.l)){ if(tp.d===mx&&t-tp.t<.3) tp.run=mx; tp.d=mx; tp.t=t; }
    if(!mx||mx!==tp.run) tp.run=0; pv.l=q.l; pv.r=q.r;
    o.mx=mx; o.my=(q.d?1:0)-(q.u?1:0); o.run=!!tp.run; o.a=o.a||q.a; o.b=o.b||q.b; o.j=o.j||q.j; o.x=o.x||q.x;
  }

  /* ---- 特效 ---- */
  function puff(x,y,n,col,spd,life,size){ for(let i=0;i<n;i++){ const a=Math.random()*6.283,v=spd*(.4+Math.random()*.8); fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.7-20,life,max:life,col,size:size*(.6+Math.random()*.8)}); } }
  function fxEvent(str,local){
    if(!local&&net&&net.host) ev.push(str);
    const a=str.split('|'),k=a[0];
    if(k==='#c'){ const pl=P[+a[1]],ty=a[2]; cut={t:0,max:ty==='ultra'?.75:.42,type:ty,name:pl?pl.s.name:'',team:pl?pl.team:0,x:pl?pl.x:MIDX,y:pl?pl.y:MIDY}; flash=.12; }
    else if(k==='#h'){ const x=+a[1],y=+a[2],big=a[3]==='1'; puff(x,y,big?22:8,big?'#ffd23f':'#fff',big?220:110,big?.55:.35,big?5:3); rings.push({x,y,t:0,max:big?.45:.3,r:big?44:20,col:big?'#ffd23f':'#fff',txt:big?'砰！':''}); shake=Math.max(shake,big?.4:.12); }
    else if(k==='#g'){ const x=+a[1],y=+a[2]; for(let i=0;i<3;i++) puff(x,y-20,26,['#ffd23f','#ff5d4f','#3ddbd9'][i],260,.9,5); rings.push({x,y:y-20,t:0,max:.6,r:80,col:'#fff',txt:''}); shake=.6; flash=.2; goalT=1.9; goalBy=+a[3]; }
  }
  function stepFx(dt){
    if(shake>0) shake-=dt; if(flash>0) flash-=dt; if(cut){ cut.t+=dt; if(cut.t>=cut.max) cut=null; } if(goalT>0) goalT-=dt;
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.life-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vx*=Math.exp(-3*dt); f.vy=f.vy*Math.exp(-3*dt)+(f.grav||0)*dt; if(f.life<=0) fx.splice(i,1); }
    for(let i=rings.length-1;i>=0;i--){ rings[i].t+=dt; if(rings[i].t>=rings[i].max) rings.splice(i,1); }
    const b=ball;
    if(b.owner<0&&b.type&&!(freeze>0)){ const c=SHOT[b.type].col,n=b.type==='ultra'?4:2;
      for(let i=0;i<n;i++) fx.push({x:b.x+(Math.random()-.5)*6,y:b.y-b.z+(Math.random()-.5)*10,vx:-Math.sign(b.vx||1)*(40+Math.random()*60),vy:(Math.random()-.5)*50,life:.4,max:.4,col:i%2?c:'#fff6c8',size:b.type==='ultra'?7:4}); }
    const tx=clamp(ball.x-W/2,0,FW-W); cam+=(tx-cam)*Math.min(1,dt*6);
  }

  /* ---- 球 ---- */
  function loose(b,by){ b.owner=-1; b.noPick=by; b.npT=.3; b.t=0; b.base=b.y; }
  function shoot(p,o,ultra){
    const b=ball,dir=p.team?-1:1,gx=goalX(p.team),dist=Math.abs(gx-p.x);
    let type=null; if(ultra&&gauge[p.team]>=100){ type='ultra'; gauge[p.team]=0; } else if((p.run&&p.runT>.4)||p.z>12) type=p.s.shot;
    const ty=(GY0+GY1)/2+3+(type==='ultra'?0:o.my*20+(Math.random()-.5)*(type?10:22)),dx=gx+dir*10-p.x,dy=ty-p.y,d=Math.hypot(dx,dy)||1,spd=(type?SHOT[type].spd:330)*(.9+p.s.pow*.12);
    loose(b,p.id); b.x=p.x+dir*10; b.y=p.y; b.base=p.y; b.z=p.z+8; b.vx=dx/d*spd; b.vy=dy/d*spd; b.vz=type==='sky'?330:type?40:70+Math.min(60,dist*.15); b.type=type; b.last=p.team; b.shotN++; b.ghost=0;
    p.kickT=.25; p.run=false; p.face=dir; addG(p.team,6);
    sfx(type?'boost':'place'); if(type){ fxEvent('#c|'+p.id+'|'+type); freeze=type==='ultra'?.75:.42; if(type==='ultra') sfx('boom'); }
  }
  function pass(p,o){
    const b=ball,dir=p.team?-1:1; let tg=null,bs=-1e9;
    for(const q of P){ if(q.team!==p.team||q===p||q.gk||q.state===4) continue; const dx=q.x-p.x,dy=q.y-p.y,sc=dx*(o.mx||dir)*.6+(o.my?dy*o.my*.8:-Math.abs(dy)*.2)-Math.hypot(dx,dy)*.25; if(sc>bs){ bs=sc; tg=q; } }
    if(!tg) return; const tx=tg.x+dir*18,dx=tx-p.x,dy=tg.y-p.y,d=Math.hypot(dx,dy)||1,spd=250;
    loose(b,p.id); b.x=p.x; b.y=p.y; b.z=4; b.vx=dx/d*spd; b.vy=dy/d*spd; b.vz=d>160?110:20; b.type=null; b.last=p.team; p.kickT=.2; p.face=dx>=0?1:-1; sfx('land');
    if(human[p.team]) ctrl[p.team]=tg.id;
  }
  function knock(p,vx,big){ p.state=4; p.st=big?1.2:.85; p.kx=Math.sign(vx||1)*(big?170:100); p.vz=big?170:110; p.z=Math.max(1,p.z); p.run=false; p.slideT=0; if(ball.owner===p.id){ loose(ball,p.id); ball.vx=p.kx*.6; ball.vy=(Math.random()-.5)*90; ball.vz=120; ball.type=null; } }
  function goal(tm){ // tm 這一隊得分
    score[tm]++; fxEvent('#g|'+Math.round(ball.x)+'|'+Math.round(ball.y)+'|'+tm); sfx('win'); addG(1-tm,30); kick=1-tm; freeze=0;
    ball.vx*=.2; ball.vy=0; ball.type=null;
  }
  function kickoff(tm){
    for(const p of P){ p.x=p.hx; p.y=p.hy; p.z=0; p.vz=0; p.state=0; p.st=0; p.run=false; p.slideT=0; p.face=p.team?-1:1; }
    const k=P[tm*5+4]; k.x=MIDX-(tm?-1:1)*8; k.y=MIDY; Object.assign(ball,{x:k.x,y:k.y,z:0,vx:0,vy:0,vz:0,owner:k.id,type:null,last:tm,noPick:-1}); start=.9;
  }
  if(opts.first!=null){ kick=opts.first; kickoff(kick); } // 擲硬幣決定誰先開球
  function stepBall(dt){
    const b=ball; b.t+=dt; if(b.npT>0){ b.npT-=dt; if(b.npT<=0) b.noPick=-1; }
    if(b.owner>=0){ const h=P[b.owner]; if(h.state===4){ loose(b,h.id); return; } b.x=h.x+h.face*(h.gk?6:9); b.y=h.y+.5; b.z=h.gk?h.z+16:h.z+(h.moving?Math.abs(Math.sin(t*14))*3:0); b.vx=b.vy=b.vz=0; return; }
    const ty=b.type;
    if(ty==='banana'){ b.vy+=(b.shotN%2?1:-1)*260*dt*(b.t<.5?1:-1.4); }
    if(ty==='sky') b.vz-=760*dt; else b.vz-=(ty&&ty!=='sky'?120:520)*dt;
    b.x+=b.vx*dt; b.base+=b.vy*dt; b.y=b.base+(ty==='snake'?Math.sin(b.t*14)*20:0); b.z+=b.vz*dt; b.ghost=ty==='ghost'?Math.sin(b.t*20)*16:0;
    if(b.z<=0){ b.z=0; if(b.vz<-60){ b.vz=-b.vz*.45; if(ty==='sky'){ b.vx*=1.25; } } else b.vz=0; const f=Math.exp(-(ty?.3:1.5)*dt); b.vx*=f; b.vy*=f; }
    if(ty&&Math.hypot(b.vx,b.vy)<150) b.type=null;
    // 球門與邊界
    const inMouth=b.y>GY0&&b.y<GY1&&b.z<40;
    if(b.x<X0){ if(inMouth){ if(b.x<X0-8){ goal(1); return; } } else { b.x=X0; b.vx=Math.abs(b.vx)*.6; b.type=null; } }
    if(b.x>X1){ if(inMouth){ if(b.x>X1+8){ goal(0); return; } } else { b.x=X1; b.vx=-Math.abs(b.vx)*.6; b.type=null; } }
    if(b.base<YB-6){ b.base=YB-6; b.vy=Math.abs(b.vy)*.6; } if(b.base>YF+6){ b.base=YF+6; b.vy=-Math.abs(b.vy)*.6; }
    // 碰到人
    const spd=Math.hypot(b.vx,b.vy);
    for(const p of P){
      if(p.state===4||p.id===b.noPick) continue; const d=Math.hypot(p.x-b.x,p.y-b.y);
      if(p.gk){
        if(d>18||b.z>46) continue;
        if(b.last!==p.team&&spd>200){ // 對方射門：擲一次骰決定擋不擋得下
          if(p.rolled!==b.shotN){ p.rolled=b.shotN; p.save=Math.random()<clamp(.96-(spd-300)/1100-(ty?.2:0)+(human[p.team]?.1:lv*.4-.15),.1,.96)&&ty!=='ultra'; }
          if(!p.save){ if(ty){ knock(p,b.vx,true); fxEvent('#h|'+Math.round(p.x)+'|'+Math.round(p.y-20)+'|1'); freeze=.1; } continue; }
          fxEvent('#h|'+Math.round(p.x)+'|'+Math.round(p.y-20)+'|'+(ty?1:0)); say(p.s.name+' 擋下來了！',.9); addG(p.team,10); }
        b.owner=p.id; b.type=null; p.ai.hold=0; sfx('item'); return;
      }
      if(d>12||b.z>p.z+30) continue;
      if(ty&&b.last!==p.team){ knock(p,b.vx,true); fxEvent('#h|'+Math.round(p.x)+'|'+Math.round(p.y-20)+'|1'); continue; } // 必殺射門會撞飛擋路的人
      if(spd>340&&b.last!==p.team) continue;
      b.owner=p.id; b.type=null; b.last=p.team; p.ai.hold=0; return;
    }
  }

  /* ---- 電腦 ---- */
  function think(p,o,dt){
    const a=p.ai,b=ball,dir=p.team?-1:1,own=b.owner>=0?P[b.owner]:null;
    o.mx=o.my=0; o.run=o.a=o.b=o.j=o.x=false; if(a.cd>0) a.cd-=dt;
    const go=(x,y,stop)=>{ const dx=x-p.x,dy=y-p.y; if(Math.abs(dx)>(stop||5)) o.mx=Math.sign(dx); if(Math.abs(dy)>(stop||5)) o.my=Math.sign(dy); return Math.hypot(dx,dy); };
    if(p.gk){
      if(own===p){ a.hold+=dt; if(a.hold>.7) o.b=true; return; }
      const near=Math.abs(b.x-p.hx)<240,ty=clamp(b.y,GY0+4,GY1-2); go(p.hx,near?ty:(GY0+GY1)/2,3); p.face=dir; return;
    }
    if(own===p){ // 帶球
      if(a.hold===0) a.sp=null; a.hold+=dt; const gx=goalX(p.team),dist=Math.abs(gx-p.x); o.mx=dir; o.run=true;
      const gyc=(GY0+GY1)/2; if(dist<260) o.my=Math.abs(gyc-p.y)>10?Math.sign(gyc-p.y):0; else o.my=a.dy;
      if(Math.random()<dt*1.5) a.dy=Math.random()<.5?0:(Math.random()<.5?-1:1);
      let foeNear=false; for(const q of P) if(q.team!==p.team&&!q.gk&&q.state!==4&&Math.hypot(q.x-p.x,q.y-p.y)<34&&(q.x-p.x)*dir>-6) foeNear=true;
      if(gauge[p.team]>=100&&dist<300){ o.x=true; return; }
      if(dist<150+lv*70||(dist<230&&foeNear)){ o.a=true; if(a.sp==null) a.sp=Math.random()<.15+lv*.4; if(!a.sp){ o.run=false; p.runT=0; } } else if(foeNear&&Math.random()<dt*(2+lv*3)) o.b=true;
      return;
    }
    const mates=P.filter(q=>q.team===p.team&&!q.gk&&q.state!==4);
    let rank=0; for(const q of mates) if(q!==p&&Math.hypot(q.x-b.x,q.y-b.y)<Math.hypot(p.x-b.x,p.y-b.y)) rank++;
    if(!own||own.gk&&own.team!==p.team){ if(rank<(own?0:2)){ const d=go(b.x,b.y,3); o.run=d>40; return; } }
    else if(own.team!==p.team){ // 搶球
      if(rank===0){ const d=go(own.x+own.face*4,own.y,3); o.run=d>36; if(d<24&&a.cd<=0&&Math.random()<dt*(4+lv*12)){ o.a=true; a.cd=1.3-lv*.5; } return; }
      if(rank===1&&!p.fw){ const d=go(own.x-dir*30,own.y,6); o.run=d>60; return; }
    }
    // 站位：自己人有球就壓上去，否則退回來
    const att=own&&own.team===p.team?1:0,bx=clamp(b.x,X0+120,X1-120);
    const tx=p.fw?bx+dir*(att?110:40):bx-dir*(att?70:150),ty=p.hy+(b.y-MIDY)*.35;
    const d=go(clamp(tx,X0+20,X1-20),clamp(ty,YB+8,YF-6),10); o.run=d>90;
    if(own) p.face=b.x>=p.x?1:-1;
  }
  function pickCtrl(tm,force){
    const b=ball,c=P[ctrl[tm]];
    if(b.owner>=0&&P[b.owner].team===tm&&!P[b.owner].gk){ ctrl[tm]=b.owner; return; }
    let best=null,bd=1e9,second=null,sd=1e9;
    for(const p of P){ if(p.team!==tm||p.gk||p.state===4) continue; const d=Math.hypot(p.x-b.x,p.y-b.y); if(d<bd){ second=best; sd=bd; best=p; bd=d; } else if(d<sd){ second=p; sd=d; } }
    if(!best) return;
    if(force){ ctrl[tm]=c===best&&second?second.id:best.id; return; }
    if(!c||c.gk||c.state===4||bd+60<Math.hypot(c.x-b.x,c.y-b.y)) ctrl[tm]=best.id;
  }

  function stepPlayer(p,o,dt,isHuman){
    if(p.kickT>0) p.kickT-=dt; if(p.slideCd>0) p.slideCd-=dt;
    p.vz-=700*dt; p.z+=p.vz*dt; if(p.z<=0){ p.z=0; p.vz=0; }
    if(p.state===4){ p.st-=dt; p.x+=p.kx*dt; p.kx*=Math.exp(-4*dt); if(p.st<=0&&p.z===0) p.state=0; }
    else if(p.slideT>0){ // 鏟球中
      p.slideT-=dt; p.x+=p.sx*dt; p.y+=p.sy*dt; p.moving=true;
      for(const q of P){ if(q.team===p.team||q.gk||q.state===4) continue; if(Math.hypot(q.x-p.x,q.y-p.y)<15&&q.z<14){ knock(q,p.sx,false); fxEvent('#h|'+Math.round(q.x)+'|'+Math.round(q.y-16)+'|0'); addG(p.team,10); sfx('hurt'); } }
    } else {
      const has=ball.owner===p.id;
      if(p.gk&&has){ if(o.b||o.a){ pass(p,{mx:0,my:0}); } }
      else {
        const sp=(p.run&&!!o.mx?132:74)*p.s.spd*(has?.92:1);
        p.run=o.run&&!!o.mx; p.runT=p.run?p.runT+dt:0;
        const vx=o.mx*sp,vy=o.my*60*p.s.spd; p.moving=!!(vx||vy); if(o.mx) p.face=o.mx;
        p.x+=vx*dt; p.y+=vy*dt;
        if(o.j&&p.z===0){ p.vz=225; }
        if(has){ if(o.x&&gauge[p.team]>=100) shoot(p,o,true); else if(o.a) shoot(p,o,false); else if(o.b) pass(p,o); }
        else if(o.a&&p.slideCd<=0&&p.z===0&&!p.gk){ const d=Math.hypot(o.mx||p.face,o.my)||1; p.slideT=.32; p.slideCd=.75; p.sx=(o.mx||p.face)/d*235; p.sy=o.my/d*150; p.face=p.sx>=0?1:-1; sfx('land'); }
        else if(o.b&&isHuman) pickCtrl(p.team,true);
      }
    }
    clampP(p);
  }
  // 活動範圍（房主和非房主的本機預測共用）
  function clampP(p){
    if(p.gk){ const bx=p.team?X1-14:X0+14; p.x=clamp(p.x,bx-16,bx+16); p.y=clamp(p.y,GY0-18,GY1+18); }
    else { p.x=clamp(p.x,X0+4,X1-4); p.y=clamp(p.y,YB+4,YF-2); }
  }

  function conclude(w,note){
    if(ended) return; ended=true; const mine=two||w===me;
    env.sfx(w<0?'lose':mine?'win':'lose');
    env.end({title:w<0?'平手':two?(w?'右隊':'左隊')+'獲勝':mine?'你贏了！':'你輸了',big:score[0]+' : '+score[1],text:note||'',
      score:!vs&&!net&&w===0?si+1:null,next:!vs&&!net&&w===0&&si<STAGES.length-1});
  }
  function snapshot(){
    const m={s:1,p:P.map(p=>[Math.round(p.x),Math.round(p.y),Math.round(p.z),p.face,p.state,(p.run?1:0)|(p.kickT>0?2:0)|(p.slideT>0?4:0)|(p.moving?8:0)]),
      b:[Math.round(ball.x),Math.round(ball.y),Math.round(ball.z),ball.owner,ball.type?KINDS.indexOf(ball.type):-1,Math.round(ball.ghost),Math.round(ball.vx||0),Math.round(ball.vy||0),Math.round(ball.vz||0)],c:ctrl,g:[Math.round(gauge[0]),Math.round(gauge[1])],sc:score,tm:Math.ceil(time),x:extra?1:0,e:ev};
    ev=[]; return m;
  }
  if(net){
    if(client) net.onmsg=m=>{
      if(m.s){ m.p.forEach((a,i)=>{ const p=P[i]; p.tx=a[0]; p.ty=a[1]; p.tz=a[2]; p.face=a[3]; p.state=a[4]; p.run=!!(a[5]&1); p.kickT=a[5]&2?.1:0; p.slideT=a[5]&4?.1:0; p.moving=!!(a[5]&8); });
        const b=m.b; ball.tx=b[0]; ball.ty=b[1]; ball.tz=b[2]; ball.owner=b[3]; ball.type=b[4]>=0?KINDS[b[4]]:null; ball.ghost=b[5]; ball.rvx=b[6]||0; ball.rvy=b[7]||0; ball.rvz=b[8]||0; ctrl[0]=m.c[0]; ctrl[1]=m.c[1]; gauge[0]=m.g[0]; gauge[1]=m.g[1]; score[0]=m.sc[0]; score[1]=m.sc[1]; time=m.tm; extra=!!m.x;
        for(const n of m.e){ if(n[0]==='!'){ msg=n.slice(1); msgT=1; } else if(n[0]==='#') fxEvent(n,true); else env.sfx(n); } }
      else if(m.end) conclude(m.end[0],m.end[1]);
    };
    else {
      net.onmsg=(m,from)=>{ if(from!==1||!m.i) return; const o=inp[1]; o.mx=m.i[0]; o.my=m.i[1]; o.run=!!m.i[2]; if(m.i[3]) o.a=true; if(m.i[4]) o.b=true; if(m.i[5]) o.j=true; if(m.i[6]) o.x=true;
        if(m.q&&m.q[0]===ctrl[1]){ const p=P[m.q[0]]; if(p&&p.state!==4&&!(p.slideT>0)&&Math.hypot(p.x-m.q[1],p.y-m.q[2])<60){ p.x=m.q[1]; p.y=m.q[2]; } } };
      net.onleave=i=>{ if(i===1&&!ended){ conclude(0,'對手離開了。'); } };
    }
  }

  function update(dt){
    t+=dt; if(msgT>0) msgT-=dt; stepFx(dt);
    if(client){
      const o=inp[0]; read(0,0); const key=''+o.mx+o.my+(+o.run),C=P[ctrl[me]],mine=!!C&&C.state!==4&&!(C.slideT>0)&&C.tx!=null&&!(C.gk&&ball.owner===C.id);
      if(mine){ const p=C,has=ball.owner===p.id,sp=(o.run&&!!o.mx?132:74)*p.s.spd*(has?.92:1),vx=o.mx*sp,vy=o.my*60*p.s.spd;
        if(Math.hypot(p.tx-p.x,p.ty-p.y)>60){ p.x=p.tx; p.y=p.ty; }
        p.x+=vx*dt; p.y+=vy*dt; clampP(p); p.moving=!!(vx||vy); if(o.mx) p.face=o.mx;
        if(o.j&&p.z<=0) p.lvz=225; p.lvz=(p.lvz||0)-700*dt; p.z=Math.max(0,p.z+p.lvz*dt); if(p.z<=0) p.lvz=0; }
      sendT-=dt;
      if(key!==lastIn||o.a||o.b||o.j||o.x||sendT<=0){ lastIn=key; sendT=1/30; const msg={i:[o.mx,o.my,+o.run,+o.a,+o.b,+o.j,+o.x]}; if(mine) msg.q=[C.id,Math.round(C.x),Math.round(C.y)]; net.send(msg); }
      o.a=o.b=o.j=o.x=false; const f=Math.min(1,dt*20);
      if(ball.tx!=null&&ball.owner<0){ ball.tx+=(ball.rvx||0)*dt; ball.ty+=(ball.rvy||0)*dt; ball.tz=Math.max(0,ball.tz+(ball.rvz||0)*dt); }
      for(const p of P){ if(p.tx==null||mine&&p===C) continue; p.x+=(p.tx-p.x)*f; p.y+=(p.ty-p.y)*f; p.z+=(p.tz-p.z)*f; }
      if(ball.tx!=null){ if(Math.abs(ball.tx-ball.x)>120){ ball.x=ball.tx; ball.y=ball.ty; ball.z=ball.tz; } else { ball.x+=(ball.tx-ball.x)*f*1.5; ball.y+=(ball.ty-ball.y)*f*1.5; ball.z+=(ball.tz-ball.z)*f*1.5; } }
      if(mine&&ball.owner===C.id){ ball.x=ball.tx+(C.x-C.tx); ball.y=ball.ty+(C.y-C.ty); } // 帶球時球跟著本機的球員走
      return;
    }
    if(ended) return;
    if(two){ read(0,1); read(1,2); } else read(0,0);
    const push=()=>{ if(net){ sendT-=dt; if(sendT<=0){ sendT=1/30; net.send(snapshot()); } } };
    if(goalT>0){ if(goalT-dt<=0){ if(extra){ const w=score[0]>score[1]?0:1; if(net){ net.send(snapshot()); net.send({end:[w,'黃金進球！']}); } conclude(w,'黃金進球！'); return; } kickoff(kick); } push(); return; }
    if(freeze>0){ freeze-=dt; push(); return; }
    if(start>0){ start-=dt; }
    else { time-=dt;
      if(time<=0){ if(score[0]!==score[1]||extra){ const w=score[0]===score[1]?-1:score[0]>score[1]?0:1; if(net){ net.send(snapshot()); net.send({end:[w,w<0?'延長賽也沒有分出勝負。':'']}); } conclude(w,w<0?'延長賽也沒有分出勝負。':''); return; }
        extra=true; time=60; say('延長賽：先進球的贏！',1.6); } }
    gauge[0]=Math.min(100,gauge[0]+dt*2.5); gauge[1]=Math.min(100,gauge[1]+dt*2.5);
    for(let tm=0;tm<2;tm++) if(human[tm]) pickCtrl(tm);
    const tmp=blank();
    for(const p of P){
      const hm=human[p.team]&&ctrl[p.team]===p.id&&!p.gk; let o=tmp;
      if(hm) o=inp[p.team]; else think(p,tmp,dt);
      if(start>0){ o.a=o.b=o.j=o.x=false; if(!hm){ o.mx=o.my=0; } }
      stepPlayer(p,o,dt,hm);
      if(hm){ o.a=o.b=o.j=o.x=false; }
    }
    stepBall(dt); push();
  }

  function draw(){
    ctx.save(); if(shake>0) ctx.translate((Math.random()-.5)*shake*22,(Math.random()-.5)*shake*16);
    drawField(ctx,cam,L.grass,L.bg,cols[0],cols[1],t);
    drawGoal(ctx,cam,0,false); drawGoal(ctx,cam,1,false);
    const list=P.slice().sort((a,b)=>a.y-b.y);
    for(const p of list){
      const x=p.x-cam; if(x<-30||x>W+30) continue;
      const pose=p.state===4||p.slideT>0?4:p.kickT>0?2:p.moving?1:0,c=p.gk?(p.team?'#f2d24a':'#3a3a4a'):cols[p.team];
      guy(ctx,x,p.y,p.z,p.face,c,p.hair,pose,t+p.id);
      if(p.run&&p.z===0&&p.state!==4){ ctx.fillStyle='rgba(255,255,255,.6)'; ctx.fillRect(x-p.face*14,p.y-3,6,2); ctx.fillRect(x-p.face*20,p.y-8,5,2); }
      for(let tm=0;tm<2;tm++) if(human[tm]&&ctrl[tm]===p.id&&(!net||tm===me)){ ctx.fillStyle=tm?'#3ddbd9':'#ffd23f'; ctx.beginPath(); ctx.moveTo(x-5,p.y-p.z-51); ctx.lineTo(x+5,p.y-p.z-51); ctx.lineTo(x,p.y-p.z-45); ctx.fill(); }
    }
    if(ball.type==='ghost') drawBall(ctx,ball.x-cam,ball.y-ball.ghost,ball.z,'ghost',t,L.ball);
    drawBall(ctx,ball.x-cam,ball.y+(ball.type==='ghost'?ball.ghost:0),ball.z,ball.type,t,L.ball);
    drawGoal(ctx,cam,0,true); drawGoal(ctx,cam,1,true);
    ctx.save(); ctx.translate(-cam,0);
    for(const f of fx){ ctx.globalAlpha=Math.max(0,f.life/f.max); ctx.fillStyle=f.col; const z=f.size*(.5+f.life/f.max*.5); ctx.fillRect(f.x-z/2,f.y-z/2,z,z); }
    ctx.globalAlpha=1;
    for(const r of rings){ const u=r.t/r.max; ctx.globalAlpha=1-u; ctx.strokeStyle=r.col; ctx.lineWidth=6*(1-u)+1; ctx.beginPath(); ctx.ellipse(r.x,r.y,r.r*u,r.r*u*.7,0,0,7); ctx.stroke();
      if(r.txt){ ctx.font='900 '+(20+u*10)+'px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=5; ctx.strokeStyle='#14122b'; ctx.strokeText(r.txt,r.x,r.y-24-u*14); ctx.fillStyle='#fff'; ctx.fillText(r.txt,r.x,r.y-24-u*14); } }
    ctx.globalAlpha=1; ctx.restore(); ctx.restore();
    if(flash>0){ ctx.fillStyle='rgba(255,255,255,'+Math.min(.7,flash*5)+')'; ctx.fillRect(0,0,W,H); }
    if(cut){ const u=cut.t/cut.max,c=SHOT[cut.type].col,ul=cut.type==='ultra',dir=cut.team?-1:1,cx=cut.x-cam;
      ctx.fillStyle='rgba(10,9,26,'+(ul?.62:.42)+')'; ctx.fillRect(0,0,W,H); ctx.strokeStyle=c; ctx.lineWidth=ul?3:2; ctx.globalAlpha=.8;
      for(let i=0;i<(ul?46:28);i++){ const a=i*2.399+t*4,r0=30+((i*37)%50)+u*20,r2=r0+60+((i*53)%140); ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*r0,cut.y-20+Math.sin(a)*r0); ctx.lineTo(cx+Math.cos(a)*r2,cut.y-20+Math.sin(a)*r2); ctx.stroke(); }
      ctx.globalAlpha=1; const slide=Math.min(1,u*4),bx=(1-slide)*-dir*W,bh=ul?64:46,by=H*.42;
      ctx.save(); ctx.translate(bx,0); ctx.transform(1,-.12,0,1,0,26);
      ctx.fillStyle='#14122b'; ctx.fillRect(-20,by-bh/2-4,W+40,bh+8); ctx.fillStyle=c; ctx.fillRect(-20,by-bh/2,W+40,bh);
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineJoin='round'; ctx.font='900 '+(ul?40:30)+'px '+TC; ctx.lineWidth=7; ctx.strokeStyle='#14122b'; ctx.strokeText(SHOT[cut.type].name,W/2,by+2); ctx.fillStyle='#fff'; ctx.fillText(SHOT[cut.type].name,W/2,by+2);
      ctx.font='700 12px '+TC; ctx.lineWidth=4; const sub=cut.name+(ul?'　超必殺！':'　必殺射門！'); ctx.strokeText(sub,W/2,by-bh/2-12); ctx.fillStyle='#ffd23f'; ctx.fillText(sub,W/2,by-bh/2-12); ctx.restore(); }
    if(goalT>0){ const k=1+Math.sin(t*14)*.06; ctx.save(); ctx.translate(W/2,H*.42); ctx.scale(k,k); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='34px '+PIX; ctx.lineWidth=9; ctx.strokeStyle='#14122b'; ctx.strokeText('GOAL!',0,0); ctx.fillStyle=cols[goalBy]||'#ffd23f'; ctx.fillText('GOAL!',0,0); ctx.restore(); }
    // 計分列
    ctx.fillStyle='rgba(11,10,28,.85)'; ctx.fillRect(0,0,W,HUD); ctx.textBaseline='middle';
    ctx.fillStyle=cols[0]; ctx.fillRect(W/2-74,6,10,18); ctx.fillStyle=cols[1]; ctx.fillRect(W/2+64,6,10,18);
    ctx.textAlign='center'; ctx.font='13px '+PIX; ctx.fillStyle='#fff'; ctx.fillText(score[0]+' - '+score[1],W/2,11);
    const tm=Math.max(0,Math.ceil(time)); ctx.font='700 11px '+TC; ctx.fillStyle=extra?'#ff5d8f':'#aaa4d8'; ctx.fillText((extra?'延長 ':'')+Math.floor(tm/60)+':'+String(tm%60).padStart(2,'0'),W/2,24);
    for(let k=0;k<2;k++){ const x=k?W-8-150:8,full=gauge[k]>=100; ctx.fillStyle='#2b2759'; ctx.fillRect(x,12,150,6); ctx.fillStyle=full?(Math.floor(t*8)%2?'#fff':'#ff3b3b'):'#ff9d3d'; ctx.fillRect(k?x+150-150*gauge[k]/100:x,12,150*gauge[k]/100,6); }
    if(gauge[me]>=100){ ctx.font='900 12px '+TC; ctx.textAlign=me?'right':'left'; const tx=me?W-10:10; ctx.lineWidth=4; ctx.strokeStyle='#14122b'; ctx.strokeText('氣滿了！帶球按「必殺」',tx,42); ctx.fillStyle='#ffd23f'; ctx.fillText('氣滿了！帶球按「必殺」',tx,42); }
    if(msgT>0&&msg&&goalT<=0){ ctx.textAlign='center'; ctx.font='900 22px '+TC; ctx.lineWidth=5; ctx.strokeStyle='#14122b'; ctx.strokeText(msg,W/2,72); ctx.fillStyle='#ffd23f'; ctx.fillText(msg,W/2,72); }
    // 小地圖
    const mx=W/2-60,my=H-22; ctx.fillStyle='rgba(11,10,28,.6)'; ctx.fillRect(mx-2,my-2,124,18); ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.lineWidth=1; ctx.strokeRect(mx,my,120,14);
    for(const p of P){ ctx.fillStyle=p.gk?'#fff':cols[p.team]; ctx.fillRect(mx+(p.x-X0)/(X1-X0)*120-1.5,my+(p.y-YB)/(YF-YB)*14-1.5,3,3); }
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(mx+(ball.x-X0)/(X1-X0)*120,my+(ball.y-YB)/(YF-YB)*14,2,0,7); ctx.fill();
  }
  return {update,draw,destroy(){},_dbg:{P,ball,ctrl,inp,score,gauge,get time(){return time;}}};
}

function preview(ctx,w,h,L,t){
  ctx.save(); ctx.scale(w/W,w/W); ctx.translate(0,-66);
  drawField(ctx,40,L.grass,L.bg,L.color,'#3d8bff',t); drawGoal(ctx,40,0,false);
  guy(ctx,150,214,0,1,L.color,+L.hair,1,t); guy(ctx,230,186,0,1,L.color,(+L.hair+1)%4,0,t); guy(ctx,330,230,0,-1,'#3d8bff',2,1,t);
  drawBall(ctx,164+Math.sin(t*3)*4,214,Math.abs(Math.sin(t*6))*3,null,t,L.ball); drawGoal(ctx,40,0,true);
  ctx.restore();
}
function thumb(ctx,w,h,t){
  ctx.save(); ctx.scale(w/W,w/W); ctx.translate(0,-30);
  const cam=X1-W+30; drawField(ctx,cam,'#4c9a3c','stadium','#ff5d4f','#3d8bff',t); drawGoal(ctx,cam,1,false);
  const u=(t%1.8)/1.8;
  guy(ctx,250,216,0,1,'#ff5d4f',1,u<.2?2:1,t); guy(ctx,180,180,0,1,'#ff5d4f',0,1,t); guy(ctx,330,240,0,-1,'#3d8bff',2,u>.3?4:1,t); guy(ctx,X1-14-cam,210+Math.sin(t*3)*10,0,-1,'#f2d24a',3,0,t);
  if(u>.2) drawBall(ctx,262+(X1-cam-262)*Math.min(1,(u-.2)*1.6),216-(u-.2)*20,10,'fire',t,'#fff'); else drawBall(ctx,262,216,0,null,t,'#fff');
  drawGoal(ctx,cam,1,true);
  if(u>.62){ const a=Math.min(1,(u-.62)*8); ctx.globalAlpha=a; ctx.save(); ctx.translate(W/2-40,120); const sc=1+Math.max(0,.1-(u-.62))*5; ctx.scale(sc,sc); ctx.font='900 30px "Press Start 2P","Noto Sans TC",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=7; ctx.strokeStyle='#14122b'; ctx.strokeText('GOAL!',0,0); ctx.fillStyle='#ffd23f'; ctx.shadowColor='#ff5d4f'; ctx.shadowBlur=10; ctx.fillText('GOAL!',0,0); ctx.restore();
    for(let i=0;i<16;i++){ const ang=i*.3927,r=(u-.62)*260; ctx.fillStyle=['#ffd23f','#ff5d8f','#3ddbd9','#fff'][i%4]; ctx.fillRect(W/2-40+Math.cos(ang)*r,120+Math.sin(ang)*r*.6,4,4); } ctx.globalAlpha=1; }
  ctx.restore();
}

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).soccer={
  coin:o=>({verb:'先開球',names:o.net?[o.net.names[0]||'玩家 1',o.net.count>1?(o.net.names[1]||'玩家 2'):'電腦']:o.mode==='2p'?['1P','2P']:['你','電腦']}),
  name:'鬥魂足球',tag:'SOCCER',color:'#5fd068',online:true,maxPlayers:2,
  desc:'五對五的鬥魂足球，沒有犯規，可以鏟人搶球。助跑射門是必殺射門，集滿氣還能放超必殺。6 支隊伍，可單人、兩人同一台，或開房間連線。',
  goal:'2 分鐘內進球多的贏，平手打延長賽。連按兩下 ← 或 → 助跑後射門，會踢出必殺射門；沒球時按「射」是鏟球。守門員會自己守。',
  stages:STAGES.map(s=>s.name),stars:[1,2,3,3,4,5],
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['↑ ↓ ← →','移動，連按兩下 ← → 助跑'],['J','射門；沒球時是鏟球'],['K','傳球；沒球時換人'],['L','跳'],['I','超必殺（氣力條滿、帶著球時）'],['W A S D F G H R','雙人左隊：移動、射、傳、跳、超必殺'],['↑ ↓ ← → , . / M','雙人右隊：移動、射、傳、跳、超必殺']],
  touchHelp:[['方向盤','移動，同方向點兩下助跑'],['射','射門，沒球時鏟球'],['傳','傳球，沒球時換人'],['跳','跳起來'],['必殺','氣力條滿、帶著球時放超必殺']],
  touch:{left:'dpad',right:[{l:'必殺',c:'KeyI'},{l:'跳',c:'KeyL'},{l:'傳',c:'KeyK'},{l:'射',c:'KeyJ',act:true}]},
  looks:[{key:'color',label:'隊服顏色',type:'color',opts:['#ff5d4f','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#b98cff','#ff7eb6']},
    {key:'hair',label:'人物造型',opts:[{id:'1',label:'飛機頭'},{id:'0',label:'短髮'},{id:'2',label:'馬尾'},{id:'3',label:'帽子'}]},
    {key:'ball',label:'球的顏色',type:'color',opts:['#ffffff','#ffd23f','#ff9d3d','#ff7eb6','#86dc4f','#6fd3ff']},
    {key:'grass',label:'草地顏色',type:'color',opts:['#4c9a3c','#3f8f6a','#7fae3c','#b9965a','#5a8fb0','#8a7fc0']},
    {key:'bg',label:'遊戲背景',opts:[{id:'stadium',label:'球場'},{id:'school',label:'校園'},{id:'beach',label:'海邊'},{id:'night',label:'夜晚'}]}],
  best:{label:'已打敗',fmt:v=>v+' / '+STAGES.length+' 隊',lower:false},
  preview,thumb,create
};
})();
