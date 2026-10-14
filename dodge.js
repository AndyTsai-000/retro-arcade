// 熱血系躲避球：每隊 3 名內野、3 名外野（站在對方半場的後方與上下邊線外）。
// 丟球打對方內野扣體力，內野全倒就輸。助跑丟或跳起來丟會變成必殺球。
// 連線時房主負責運算（左隊），加入的人是右隊，只送出按鍵。
(function(){
'use strict';
const W=480,H=300,X0=52,X1=428,MID=240,YB=150,YF=258,HUD=40;
const PIX='"Press Start 2P","Noto Sans TC","Microsoft JhengHei",monospace';
const TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const SHOT={ // 必殺球
  fast:{name:'火箭球',col:'#ff5d4f',spd:470,dmg:2.1},
  wave:{name:'波浪球',col:'#3ddbd9',spd:360,dmg:2.2},
  accel:{name:'加速球',col:'#ffd23f',spd:210,dmg:2.3},
  pierce:{name:'貫穿球',col:'#b98cff',spd:420,dmg:1.8},
  curve:{name:'追蹤球',col:'#5fd068',spd:330,dmg:2.0},
  drop:{name:'隕石球',col:'#ff9d3d',spd:300,dmg:2.5},
  split:{name:'幻影球',col:'#ff7eb6',spd:380,dmg:2.2},
  ultra:{name:'熱血魂球',col:'#ff3b3b',spd:410,dmg:3.2} // 集滿氣才能放的超必殺：貫穿全場、接不住
};
const KINDS=Object.keys(SHOT);
const mk=(name,hp,pow,spd,cat,dash,jump)=>({name,hp,pow,spd,cat,dash,jump});
const HOME=[mk('阿烈',56,1.15,1.05,.7,'fast','drop'),mk('小虎',48,1,1.15,.65,'wave','accel'),mk('大山',64,1.25,.9,.6,'pierce','curve')];
const STAGES=[
  {name:'海風隊',col:'#3d8bff',lv:.35,team:[mk('浪哥',40,.85,.95,.35,'wave','drop'),mk('阿貝',36,.8,1,.3,'fast','wave'),mk('小蟹',36,.8,.95,.3,'accel','fast')]},
  {name:'沙漠隊',col:'#e0a030',lv:.5,team:[mk('駱駝王',52,1,.9,.45,'pierce','drop'),mk('阿沙',44,.95,1,.4,'accel','curve'),mk('仙人掌',44,.9,1,.4,'wave','fast')]},
  {name:'冰原隊',col:'#7fd0e8',lv:.62,team:[mk('雪怪',60,1.1,.9,.5,'drop','pierce'),mk('企鵝',46,1,1.1,.5,'curve','wave'),mk('冰柱',48,1.05,1,.5,'fast','accel')]},
  {name:'叢林隊',col:'#3fae5a',lv:.74,team:[mk('金剛',66,1.25,.9,.55,'pierce','drop'),mk('豹子',48,1.05,1.25,.6,'fast','curve'),mk('鸚鵡',46,1,1.1,.6,'split','wave')]},
  {name:'鋼鐵隊',col:'#8a8fa8',lv:.86,team:[mk('鐵壁',74,1.3,.85,.7,'drop','pierce'),mk('齒輪',54,1.15,1.05,.65,'accel','split'),mk('螺絲',52,1.1,1.1,.65,'curve','fast')]},
  {name:'冠軍隊',col:'#c56bff',lv:1,team:[mk('霸王',78,1.4,1,.78,'split','drop'),mk('閃電',56,1.2,1.3,.75,'fast','curve'),mk('鐵拳',64,1.3,1,.72,'pierce','accel')]}
];
const r1=v=>Math.round(v*10)/10;

// 人物：紅白機熱血系的二頭身畫法——大頭、粗眉、怒目、背心短褲球鞋，整個人描黑邊。
// 先把每個色塊記下來，第一輪畫黑邊、第二輪上色。
function drawGuy(ctx,x,y,z,face,col,hair,pose,t,alpha){
  // pose: 0 站 1 跑 2 丟 3 蹲 4 倒地 5 出局 6 接球
  ctx.save(); if(alpha!=null) ctx.globalAlpha=alpha;
  ctx.fillStyle='rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x,y,11,3.5,0,0,7); ctx.fill();
  ctx.translate(x,y-z); ctx.scale(face,1);
  if(pose===4){ ctx.rotate(-1.5); ctx.translate(3,9); }
  const parts=[],R=(a,b,w,h,c,flat)=>parts.push([a,b,w,h,c,flat]);
  const INK='#1b1420',sk='#f6c9a0',skd='#d99a6c',sho='#f6f6f6',pants='#2b3f9e',hc=hair===2?'#7a3b1d':INK;
  const s=pose===1?Math.sin(t*17):0,duck=pose===3,down=pose===4,thr=pose===2,cat=pose===6;
  const ly=duck?-4:-9,ty=ly-12,hy=ty-13+(pose===1?Math.abs(s)*-1:0);
  // 腿與球鞋
  R(-5-s*3,ly,4,-ly-2,sk); R(-6-s*4,-2.5,6,2.5,sho);
  R(1+s*3,ly,4,-ly-2,sk); R(1+s*4,-2.5,6,2.5,sho);
  // 短褲、背心
  R(-6,ly-3,12,5,pants);
  R(-6,ty,12,10,col); R(-6,ty+4,12,1.5,'#ffffff',1); R(-1,ty+1,3,2.5,'#ffffff',1);
  // 手臂
  if(thr){ R(-9,ty+2,3,6,sk); R(5,ty,9,3.5,sk); R(13,ty-1,4,5,sk); }
  else if(cat){ R(5,ty+1,7,3,sk); R(5,ty+5.5,7,3,sk); }
  else { R(-9+s*2,ty+1,3,8-Math.abs(s),sk); R(6-s*2,ty+1,3,8-Math.abs(s),sk); }
  // 大頭
  R(-8,hy,16,13,sk); R(-9,hy+5,2,4,skd);
  if(hair===3){ R(-9,hy+3,2,6,INK); R(-8,hy-3,16,6,col); R(7,hy+1,6,2,col); R(-8,hy+1,16,1,'rgba(0,0,0,.3)',1); }
  else { R(-8,hy-2.5,16,5.5,hc); R(-9.5,hy,3.5,9,hc);
    if(hair===1){ R(4,hy-4.5,8,5,hc); R(-6,hy-4,10,2.5,hc); }
    if(hair===2) R(-13,hy+2,4,10,hc);
    if(hair===0) R(5,hy+2,3,2,hc,1); }
  // 臉：粗眉、白底怒目、鼻子、嘴
  if(down){ R(1,hy+6,5,1.5,INK,1); R(3,hy+4.5,1.5,5,INK,1); R(-4,hy+6,4,1.5,INK,1); R(2,hy+10,5,2.5,'#8a2a2a',1); }
  else { R(0,hy+3.5,6.5,1.8,INK,1); R(0,hy+3,2,1.2,INK,1); R(-5,hy+3.5,4,1.8,INK,1);
    R(1,hy+6,5,3.2,'#ffffff',1); R(3.8,hy+6,2.2,3.2,INK,1); R(-4.5,hy+6,3.5,3.2,'#ffffff',1); R(-2.8,hy+6,1.8,3.2,INK,1);
    R(7,hy+8,1.6,2,skd,1);
    if(thr||cat) R(2,hy+10,4.5,2.6,'#8a2a2a',1); else R(2.5,hy+10.6,4,1.2,'#8a3a2a',1); }
  ctx.fillStyle=INK; for(const q of parts) if(!q[5]) ctx.fillRect(q[0]-1,q[1]-1,q[2]+2,q[3]+2);
  for(const q of parts){ ctx.fillStyle=q[4]; ctx.fillRect(q[0],q[1],q[2],q[3]); }
  ctx.restore();
}
function drawBall(ctx,x,y,z,type,t,col){
  const R=type==='ultra'?11:6;
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x,y,6,2.5,0,0,7); ctx.fill();
  if(type){ const c=SHOT[type].col,g=ctx.createRadialGradient(x,y-z,R*.5,x,y-z,R*3.2); g.addColorStop(0,c); g.addColorStop(1,'rgba(255,255,255,0)'); ctx.globalAlpha=.75+Math.sin(t*40)*.2; ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y-z,R*3.2,0,7); ctx.fill(); ctx.globalAlpha=1; }
  ctx.fillStyle=col||'#fff'; ctx.beginPath(); ctx.arc(x,y-z,R,0,7); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(x-2,y-z-2,2,0,7); ctx.fill();
  ctx.strokeStyle=type?SHOT[type].col:'rgba(20,18,43,.55)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(x,y-z,R,t*8,t*8+2.2); ctx.stroke();
  ctx.strokeStyle='#14122b'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(x,y-z,R,0,7); ctx.stroke();
}
const BG={
  beach:{g:'#d9a45c',d:'#c8924a'},school:{g:'#b9a07a',d:'#a88f69'},night:{g:'#4a4660',d:'#3f3b54'},snow:{g:'#e8f0f8',d:'#d2deea'}
};
function drawCourt(ctx,c0,c1,court,bg){
  const B=BG[bg]||BG.beach;
  if(bg==='school'){
    ctx.fillStyle='#9fd8ff'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#f0e6d0'; ctx.fillRect(60,52,360,70); ctx.fillStyle='#c9573f'; ctx.fillRect(52,44,376,10);
    ctx.fillStyle='#7fb6dc'; for(let r=0;r<2;r++) for(let i=0;i<11;i++) ctx.fillRect(74+i*31,62+r*28,18,16);
    ctx.fillStyle='#5a8a4a'; for(const x of [14,36,444,466]){ ctx.beginPath(); ctx.arc(x,104,18,0,7); ctx.fill(); }
    ctx.fillStyle='#8a8fa8'; for(let x=0;x<W;x+=12) ctx.fillRect(x,112,2,10); ctx.fillRect(0,112,W,2);
  } else if(bg==='night'){
    ctx.fillStyle='#14143a'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff'; for(let i=0;i<40;i++) ctx.fillRect((i*97)%W,44+(i*31)%60,1.5,1.5);
    ctx.fillStyle='#ffe9a8'; ctx.beginPath(); ctx.arc(400,66,13,0,7); ctx.fill();
    ctx.fillStyle='#23234f'; for(let i=0;i<12;i++){ const hh=24+((i*37)%40); ctx.fillRect(i*42,122-hh,36,hh); }
    ctx.fillStyle='#ffd23f'; for(let i=0;i<12;i++) for(let k=0;k<3;k++) if((i+k)%2) ctx.fillRect(i*42+6+k*10,104-((i*7)%14),4,5);
  } else if(bg==='snow'){
    ctx.fillStyle='#cfe6f7'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#f4f9ff'; ctx.beginPath(); ctx.moveTo(0,122); ctx.lineTo(70,70); ctx.lineTo(150,122); ctx.fill(); ctx.beginPath(); ctx.moveTo(110,122); ctx.lineTo(230,54); ctx.lineTo(340,122); ctx.fill(); ctx.beginPath(); ctx.moveTo(300,122); ctx.lineTo(400,76); ctx.lineTo(480,122); ctx.fill();
    ctx.fillStyle='#5f8f7a'; for(const x of [20,95,180,265,352,440]){ ctx.beginPath(); ctx.moveTo(x-12,122); ctx.lineTo(x,92); ctx.lineTo(x+12,122); ctx.fill(); }
  } else {
    ctx.fillStyle='#7ec8f2'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#5aa0d0'; ctx.fillRect(0,96,W,26);
    for(let i=0;i<24;i++){ ctx.fillStyle=i%2?'#f4e2b8':'#e8d09a'; ctx.fillRect(i*20,104+((i*7)%3)*2,16,14); }
  }
  // 場邊看台：一排觀眾和加油布條（熱血系列的招牌畫面）
  ctx.save();
  ctx.fillStyle=bg==='night'?'#2a2850':'#8a8fa8'; ctx.fillRect(0,100,W,22); ctx.fillStyle=bg==='night'?'#1c1a3a':'#6a6f88'; ctx.fillRect(0,100,W,2);
  const crowd=['#ff5d4f','#ffd23f','#3ddbd9','#ffffff','#ff7eb6','#86dc4f','#4f9dff','#ff9d3d'],tt=(typeof performance!=='undefined'?performance.now():0)/1000;
  for(let r=0;r<2;r++) for(let i=0;i<60;i++){ const x=i*8+(r%2)*4,j=Math.max(0,Math.sin(tt*5+i*.9+r*2))*1.6; ctx.fillStyle='#ffd9a8'; ctx.fillRect(x+1,104+r*8-j,4,3); ctx.fillStyle=crowd[(i*3+r*5)%8]; ctx.fillRect(x,107+r*8-j,6,4); }
  ctx.fillStyle='#fff'; ctx.fillRect(40,111,120,10); ctx.fillRect(320,111,120,10); ctx.font='900 8px "Noto Sans TC","Microsoft JhengHei",sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#e23b3b'; ctx.fillText('熱血魂　必勝！',100,116.5); ctx.fillStyle='#1f5fc0'; ctx.fillText('全力投球　加油！',380,116.5);
  ctx.restore();
  ctx.fillStyle=B.g; ctx.fillRect(0,120,W,H-120);
  ctx.fillStyle=B.d; for(let i=0;i<60;i++) ctx.fillRect((i*53)%W,126+(i*29)%170,8,2);
  if(court){ ctx.fillStyle=court; ctx.fillRect(X0,YB,X1-X0,YF-YB); }
  ctx.fillStyle=c0; ctx.globalAlpha=.16; ctx.fillRect(X0,YB,MID-X0,YF-YB); ctx.fillStyle=c1; ctx.fillRect(MID,YB,X1-MID,YF-YB); ctx.globalAlpha=1;
  ctx.strokeStyle='#fff'; ctx.lineWidth=2.5; ctx.strokeRect(X0,YB,X1-X0,YF-YB); ctx.beginPath(); ctx.moveTo(MID,YB); ctx.lineTo(MID,YF); ctx.stroke();
}

function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,two=!net&&opts.mode==='2p',vs=two||(!!net&&net.count>1),me=net?Math.min(1,net.me):0;
  const si=opts.stage||0,foe=STAGES[si],L=opts.look||{color:'#ff5d4f',hair:'0',ball:'#ffffff',court:'#e0a868',bg:'beach'};
  const {ctx}=env.canvas2d(W,H);
  const lookOf=t=>(net&&net.looks&&net.looks[t])||(t===0?L:null);
  const cols=[(lookOf(0)||L).color,vs?((lookOf(1)||{}).color||'#3d8bff'):foe.col]; if(cols[0]===cols[1]) cols[1]='#3d8bff'===cols[0]?'#ffd23f':'#3d8bff';
  const hairs=[+(lookOf(0)||L).hair||0,vs?+((lookOf(1)||{}).hair||1):-1];
  const lv=vs?.7:foe.lv,names=net&&net.names?net.names:null;
  // 球員：0-2 左隊內野、3-5 左隊外野、6-8 右隊內野、9-11 右隊外野
  const P=[];
  for(let t=0;t<2;t++){
    const src=t===0||vs?HOME:foe.team,dir=t?-1:1;
    for(let i=0;i<3;i++){ const s=src[i]; P.push({id:P.length,team:t,role:'in',x:MID-dir*(60+i*45),y:YB+24+i*38,z:0,vz:0,face:dir,hp:s.hp,max:s.hp,s,
      state:0,st:0,catchT:0,duck:false,run:false,runT:0,throwT:0,inv:0,kx:0,ky:0,ai:{t:Math.random(),plan:null,roll:-1,hold:0},hair:hairs[t]<0?(i+si)%4:i===0?hairs[t]:(hairs[t]+i)%4,moving:false}); }
    const ox=t?X0-20:X1+20,cx=t?(X0+MID)/2:(MID+X1)/2;
    [['back',ox,(YB+YF)/2],['top',cx,YB-13],['bot',cx,YF+13]].forEach(([lane,x,y],i)=>P.push({id:P.length,team:t,role:'out',lane,x,y,z:0,vz:0,face:-dir,hp:1,max:1,s:{name:'',pow:.9,spd:1,cat:1,dash:'fast',jump:'fast'},
      state:0,st:0,catchT:0,duck:false,run:false,runT:0,throwT:0,inv:0,kx:0,ky:0,ai:{t:Math.random(),plan:null,roll:-1,hold:0},hair:(i+t)%3,moving:false}));
  }
  const ball={x:MID,y:(YB+YF)/2,z:60,vx:0,vy:0,vz:0,st:'loose',holder:-1,team:-1,type:null,dmg:0,t:0,target:-1,hit:{},base:0,idle:0,ghost:0};
  const ctrl=[1,7],human=[true,vs],inp=[blank(),blank()],tap=[{d:0,t:-9,run:0},{d:0,t:-9,run:0}],prev=[{},{}];
  let t=0,over=0,ended=false,msg='',msgT=0,ev=[],sendT=0,lastIn='',start=1.2,freeze=0,shake=0,flash=0,cut=null;
  const gauge=[0,0],fx=[],rings=[];
  function blank(){ return {mx:0,my:0,run:false,a:false,b:false,j:false,x:false,bh:false}; }
  const sfx=n=>{ env.sfx(n); if(net&&net.host) ev.push(n); };
  const alive=p=>p.state!==5, ins=tm=>P.filter(p=>p.team===tm&&p.role==='in'&&alive(p));
  const say=(s,sec)=>{ msg=s; msgT=sec||1.2; if(net&&net.host) ev.push('!'+s); };

  /* ---- 輸入 ---- */
  function keysOf(k){
    const K=env.keys,S=k===1?['KeyW','KeyS','KeyA','KeyD','KeyF','KeyG','KeyH','KeyR']:k===2?['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Comma','Period','Slash','KeyM']:null;
    if(S) return {u:K[S[0]],d:K[S[1]],l:K[S[2]],r:K[S[3]],a:env.hit(S[4]),b:env.hit(S[5]),bh:!!K[S[5]],j:env.hit(S[6]),x:env.hit(S[7])};
    return {u:K.ArrowUp||K.KeyW,d:K.ArrowDown||K.KeyS,l:K.ArrowLeft||K.KeyA,r:K.ArrowRight||K.KeyD,a:env.hit('KeyJ')||env.hit('Space'),b:env.hit('KeyK'),bh:!!K.KeyK,j:env.hit('KeyL'),x:env.hit('KeyI')};
  }
  function read(n,k){ // 連按兩下左右鍵是助跑
    const q=keysOf(k),o=inp[n],tp=tap[n],pv=prev[n],mx=(q.r?1:0)-(q.l?1:0);
    if(mx&&!(mx>0?pv.r:pv.l)){ if(tp.d===mx&&t-tp.t<.3) tp.run=mx; tp.d=mx; tp.t=t; }
    if(!mx||mx!==tp.run) tp.run=0;
    pv.l=q.l; pv.r=q.r;
    o.mx=mx; o.my=(q.d?1:0)-(q.u?1:0); o.run=!!tp.run; o.a=o.a||q.a; o.b=o.b||q.b; o.j=o.j||q.j; o.x=o.x||q.x; o.bh=q.bh;
  }

  /* ---- 特效 ---- */
  const addG=(tm,v)=>{ if(tm===0||tm===1) gauge[tm]=Math.min(100,gauge[tm]+v); };
  function puff(x,y,n,col,spd,life,size){ for(let i=0;i<n;i++){ const a=Math.random()*6.283,v=spd*(.4+Math.random()*.8); fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.7-20,life,max:life,col,size:size*(.6+Math.random()*.8)}); } }
  // 事件字串：#c 特寫、#h 命中、#k 接球；房主會把它一起傳給另一邊播放
  function fxEvent(str,local){
    if(!local&&net&&net.host) ev.push(str);
    const a=str.split('|'),k=a[0];
    if(k==='#c'){ const pl=P[+a[1]],ty=a[2]; cut={t:0,max:ty==='ultra'?.75:.42,type:ty,name:pl?pl.s.name:'',team:pl?pl.team:0,x:pl?pl.x:MID,y:pl?pl.y:200}; flash=.12; }
    else if(k==='#h'){ const x=+a[1],y=+a[2],ty=a[3],sp=ty!=='n',c=sp?SHOT[ty].col:'#ffffff';
      puff(x,y,sp?26:8,c,sp?230:110,sp?.6:.35,sp?5:3); if(sp) puff(x,y,12,'#fff6c8',150,.45,3);
      rings.push({x,y,t:0,max:sp?.5:.3,r:sp?(ty==='ultra'||ty==='drop'?70:46):20,col:c,txt:sp?(ty==='ultra'?'轟！！':'砰！'):''});
      shake=Math.max(shake,sp?(ty==='ultra'?.6:.4):.12); if(sp) flash=.1; }
    else if(k==='#k'){ puff(+a[1],+a[2],12,'#ffd23f',140,.4,3); rings.push({x:+a[1],y:+a[2],t:0,max:.3,r:26,col:'#ffd23f',txt:''}); }
  }
  function stepFx(dt){
    if(shake>0) shake-=dt; if(flash>0) flash-=dt; if(cut){ cut.t+=dt; if(cut.t>=cut.max) cut=null; }
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.life-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vx*=Math.exp(-3*dt); f.vy=f.vy*Math.exp(-3*dt)+(f.grav||0)*dt; if(f.life<=0) fx.splice(i,1); }
    for(let i=rings.length-1;i>=0;i--){ rings[i].t+=dt; if(rings[i].t>=rings[i].max) rings.splice(i,1); }
    // 必殺球的尾巴，每種顏色和形狀不同
    const b=ball;
    if(b.st==='shot'&&b.type&&!(freeze>0)){ const c=SHOT[b.type].col,by=b.y-b.z,ty=b.type,n=ty==='ultra'?4:2;
      for(let i=0;i<n;i++){ const o={x:b.x+(Math.random()-.5)*6,y:by+(Math.random()-.5)*(ty==='ultra'?16:8),vx:-Math.sign(b.vx||1)*(40+Math.random()*60),vy:(Math.random()-.5)*40,life:.4,max:.4,col:i%2?c:'#fff6c8',size:ty==='ultra'?7:4};
        if(ty==='accel'){ o.vy=(Math.random()-.5)*220; o.life=o.max=.18; o.size=2.5; o.col=i%2?'#ffffff':c; }
        if(ty==='drop'){ o.vy=-60-Math.random()*60; o.col=i%2?'#ffd23f':c; }
        if(ty==='pierce'){ o.vy=Math.sin(t*40+i*3)*120; o.life=o.max=.25; }
        if(ty==='wave'){ o.col=i%2?'#ffffff':c; o.grav=260; }
        fx.push(o); } }
  }

  /* ---- 球 ---- */
  function give(p){ ball.st='held'; ball.holder=p.id; ball.team=p.team; ball.type=null; ball.vx=ball.vy=ball.vz=0; ball.idle=0; p.ai.hold=0; p.ai.plan=null; }
  function throwAt(p,ultra){
    const foes=ins(1-p.team); if(!foes.length) return;
    let tg=foes[0],bd=1e9; for(const f of foes){ const d=Math.abs(f.y-p.y)*1.6+Math.abs(f.x-p.x)*.4; if(d<bd){ bd=d; tg=f; } }
    let type=null; if(p.role==='in'){ if(ultra&&gauge[p.team]>=100){ type='ultra'; gauge[p.team]=0; } else if(p.z>14) type=p.s.jump; else if(p.run&&p.runT>.22) type=p.s.dash; }
    const sh=type?SHOT[type]:null,spd=sh?sh.spd:290,sx=p.x+p.face*12,sz=p.z+22,dx=tg.x-sx,dy=tg.y-p.y,d=Math.hypot(dx,dy)||1;
    p.face=dx>=0?1:-1; p.throwT=.28; p.run=false;
    Object.assign(ball,{st:'shot',holder:-1,team:p.team,type,x:sx,y:p.y,z:sz,vx:dx/d*spd,vy:dy/d*spd,vz:type==='drop'?120:0,t:0,target:tg.id,hit:{},base:p.y,dmg:8*p.s.pow*(sh?sh.dmg:1),ghost:0});
    if(type==='drop'){ const tt=d/spd; ball.vz=(18-sz)/tt+.5*520*tt; }
    tg.ai.roll=-1; sfx(type?'boost':'place'); if(type){ fxEvent('#c|'+p.id+'|'+type); freeze=type==='ultra'?.75:.42; if(type==='ultra') sfx('boom'); }
  }
  function passFrom(p){
    const mates=P.filter(q=>q.team===p.team&&q!==p&&alive(q)&&(p.role==='in'?q.role==='out':true)); if(!mates.length) return;
    let tg=mates[0],bd=-1e9; for(const q of mates){ const sc=(q.x-p.x)*p.face-Math.abs(q.y-p.y)*.3+(q.role==='in'?-40:0); if(sc>bd){ bd=sc; tg=q; } }
    const tt=.55,sx=p.x,sz=p.z+24; p.throwT=.2; p.face=tg.x>=p.x?1:-1;
    Object.assign(ball,{st:'pass',holder:-1,team:p.team,type:null,x:sx,y:p.y,z:sz,vx:(tg.x-sx)/tt,vy:(tg.y-p.y)/tt,vz:(22-sz)/tt+.5*520*tt,t:0,target:tg.id,hit:{},dmg:0});
    sfx('land');
  }
  function knock(p,dmg,bvx,power){
    p.hp=Math.max(0,p.hp-dmg); p.state=4; p.st=p.hp<=0?1.1:.85+(power?.35:0); p.kx=Math.sign(bvx||1)*(power?150:90); p.vz=power?190:120; p.z=Math.max(p.z,1); p.run=false; p.catchT=0;
    sfx(power?'boom':'hurt');
  }
  function stepBall(dt){
    const b=ball; b.t+=dt;
    if(b.st==='held'){ const h=P[b.holder]; if(!h||!alive(h)||h.state===4){ b.st='loose'; b.holder=-1; b.vz=90; return; } b.x=h.x+h.face*8; b.y=h.y; b.z=h.z+18; return; }
    if(b.st==='shot'){
      const sh=b.type;
      if(sh==='accel'){ const k=1+dt*2.6; b.vx*=k; b.vy*=k; }
      if(sh==='curve'&&b.t<.9){ const tg=P[b.target]; if(tg&&alive(tg)){ const sp=Math.hypot(b.vx,b.vy),ax=tg.x-b.x,ay=tg.y-b.y,d=Math.hypot(ax,ay)||1; b.vx+=(ax/d*sp-b.vx)*dt*3.2; b.vy+=(ay/d*sp-b.vy)*dt*3.2; } }
      if(sh==='drop') b.vz-=520*dt; else b.vz-=(sh?0:60)*dt;
      b.x+=b.vx*dt; b.base+=b.vy*dt; b.y=b.base+(sh==='wave'?Math.sin(b.t*13)*22:0); b.z+=b.vz*dt; if(sh==='split') b.ghost=Math.sin(b.t*18)*16;
      for(const p of P){
        if(p.team===b.team||p.role!=='in'||!alive(p)||p.state===4||p.inv>0||b.hit[p.id]) continue;
        const top=p.duck?15:36; if(Math.abs(p.x-b.x)>11||Math.abs(p.y-b.y)>10||b.z<p.z-2||b.z>p.z+top) continue;
        if(p.catchT>0&&b.vx*p.face<0&&sh!=='ultra'){ // 接住（超必殺接不住）
          if(sh){ p.hp=Math.max(1,p.hp-2); p.kx=Math.sign(b.vx)*60; }
          p.catchT=0; addG(p.team,sh?35:20); fxEvent('#k|'+Math.round(p.x)+'|'+Math.round(p.y-p.z-20)); give(p); sfx('item'); say('接住！',.7); return; }
        knock(p,b.dmg,b.vx,!!sh); b.hit[p.id]=1; addG(b.team,sh?18:28); addG(p.team,12);
        fxEvent('#h|'+Math.round(p.x)+'|'+Math.round(p.y-p.z-18)+'|'+(sh||'n')); if(sh) freeze=sh==='ultra'?.16:.1;
        if(sh!=='pierce'&&sh!=='ultra'){ b.st='loose'; b.vx*=-.25; b.vy=(Math.random()-.5)*80; b.vz=170; b.type=null; b.team=-1; return; }
      }
      if(b.z<=5){ b.z=5; b.st='loose'; b.vx*=.5; b.vy*=.5; b.vz=110; b.type=null; b.team=-1; }
      if(b.x<14||b.x>W-14||b.y<YB-30||b.y>YF+30||b.t>2.2){ b.st='loose'; b.type=null; b.team=-1; } // 飛太久或出界就變成滾地球
    } else if(b.st==='pass'){
      b.vz-=520*dt; b.x+=b.vx*dt; b.y+=b.vy*dt; b.z+=b.vz*dt;
      const tg=P[b.target];
      if(b.t>.3&&tg&&alive(tg)&&tg.state!==4&&Math.hypot(tg.x-b.x,tg.y-b.y)<16&&b.z<46){ give(tg); sfx('land'); return; }
      if(b.z<=5){ b.z=5; b.st='loose'; b.vz=90; b.team=-1; }
    } else { // 滾地球
      b.vz-=560*dt; b.x+=b.vx*dt; b.y+=b.vy*dt; b.z+=b.vz*dt; b.idle+=dt;
      if(b.z<=5){ b.z=5; if(b.vz<-40){ b.vz=-b.vz*.5; } else b.vz=0; const f=Math.exp(-2.4*dt); b.vx*=f; b.vy*=f; }
      if(b.x<16){ b.x=16; b.vx=Math.abs(b.vx)*.6; } if(b.x>W-16){ b.x=W-16; b.vx=-Math.abs(b.vx)*.6; }
      if(b.y<YB-26){ b.y=YB-26; b.vy=Math.abs(b.vy)*.6; } if(b.y>YF+26){ b.y=YF+26; b.vy=-Math.abs(b.vy)*.6; }
      let best=null,bd=17;
      for(const p of P){ if(!alive(p)||p.state===4||b.z>p.z+26) continue; const d=Math.hypot(p.x-b.x,p.y-b.y); if(d<bd){ bd=d; best=p; } }
      if(best&&b.t>.18){ give(best); sfx('land'); return; }
      if(b.idle>7){ let q=null,qd=1e9; for(const p of P){ if(!alive(p)) continue; const d=Math.hypot(p.x-b.x,p.y-b.y); if(d<qd){ qd=d; q=p; } } if(q) give(q); }
    }
  }

  /* ---- 電腦 ---- */
  function think(p,o,dt){
    const a=p.ai,b=ball,foeHold=b.st==='held'&&P[b.holder].team!==p.team,mine=b.st==='held'&&b.holder===p.id;
    o.mx=o.my=0; o.run=o.a=o.b=o.j=o.x=o.bh=false;
    const go=(x,y,stop)=>{ const dx=x-p.x,dy=y-p.y; if(Math.abs(dx)>(stop||4)) o.mx=Math.sign(dx); if(Math.abs(dy)>(stop||4)) o.my=Math.sign(dy); };
    if(mine){
      a.hold+=dt;
      if(p.role==='out'){ if(a.hold>.45-lv*.15){ if(Math.random()<.2) o.b=true; else o.a=true; } return; }
      if(gauge[p.team]>=100&&a.hold>.35){ o.x=true; return; }
      if(!a.plan){ const r=Math.random(); a.plan=r<.3+lv*.35?'dash':r<.72?'throw':r<.86?'jump':'pass'; }
      const dir=p.team?-1:1,edge=MID-dir*18;
      if(a.plan==='dash'){ o.mx=dir; o.run=true; if((edge-p.x)*dir<22||a.hold>1.1) o.a=true; }
      else if(a.plan==='jump'){ if(a.hold<.3) o.mx=dir; else if(p.z===0&&a.hold<.6) o.j=true; else if(p.z>18||a.hold>1) o.a=true; }
      else if(a.plan==='pass'){ if(a.hold>.35) o.b=true; }
      else { if((edge-p.x)*dir>60) o.mx=dir; if(a.hold>.4) o.a=true; }
      return;
    }
    if(p.role==='out'){ // 外野沿著自己的邊線追球
      if(b.st==='loose'||b.st==='pass'&&b.target===p.id){ if(p.lane==='back') o.my=Math.abs(b.y-p.y)>4?Math.sign(b.y-p.y):0; else o.mx=Math.abs(b.x-p.x)>4?Math.sign(b.x-p.x):0;
        if(b.st==='loose'&&Math.hypot(b.x-p.x,b.y-p.y)<34){ o.mx=Math.sign(b.x-p.x); o.my=Math.sign(b.y-p.y); } }
      return;
    }
    const dir=p.team?-1:1,mates=ins(p.team),k=mates.indexOf(p);
    if(b.st==='shot'&&b.team!==p.team&&b.target===p.id){ // 被瞄準：擲一次骰決定接、躲、還是來不及
      if(a.roll<0) a.roll=Math.random();
      const d=Math.hypot(b.x-p.x,b.y-p.y),c=p.s.cat*(b.type?.6:1)*(.55+lv*.5);
      p.face=b.x>p.x?1:-1;
      if(a.roll<c){ if(d<70) o.a=true; }
      else if(a.roll<c+.3*lv+.1){ if(b.type==='wave'||b.z>26) o.bh=true; else o.my=p.y>(YB+YF)/2?-1:1; }
      return;
    }
    a.roll=-1;
    if(b.st==='loose'){ const inHalf=p.team?b.x>MID:b.x<MID; let near=true; for(const q of mates) if(q!==p&&Math.hypot(q.x-b.x,q.y-b.y)<Math.hypot(p.x-b.x,p.y-b.y)) near=false;
      if(inHalf&&near&&b.y>YB-4&&b.y<YF+4){ go(b.x,b.y,3); o.run=Math.abs(b.x-p.x)>40; return; } }
    // 站位：對方持球時往後退
    const back=foeHold||b.st==='shot'?1:0,hx=MID-dir*(70+k*38+back*38),hy=YB+22+((k+si)%3)*40+Math.sin(t*.7+p.id)*8;
    go(hx,hy,8); if(b.st!=='loose') p.face=b.x>p.x?1:-1;
  }

  function pickCtrl(tm){
    const b=ball,c=P[ctrl[tm]];
    if(b.st==='held'&&P[b.holder].team===tm){ ctrl[tm]=b.holder; return; }
    if((b.st==='shot'&&b.team!==tm||b.st==='pass'&&b.team===tm)&&P[b.target]&&P[b.target].team===tm&&alive(P[b.target])){ ctrl[tm]=b.target; return; }
    const list=ins(tm); if(!list.length) return;
    let best=list[0],bd=1e9; for(const p of list){ if(p.state===4) continue; const d=Math.hypot(p.x-b.x,p.y-b.y); if(d<bd){ bd=d; best=p; } }
    if(!c||c.role!=='in'||!alive(c)||c.state===4||bd+45<Math.hypot(c.x-b.x,c.y-b.y)) ctrl[tm]=best.id;
  }

  function stepPlayer(p,o,dt){
    if(p.state===5){ p.st+=dt; return; }
    if(p.inv>0) p.inv-=dt; if(p.throwT>0) p.throwT-=dt; if(p.catchT>0) p.catchT-=dt;
    p.vz-=700*dt; p.z+=p.vz*dt; if(p.z<=0){ p.z=0; p.vz=0; }
    if(p.state===4){ p.st-=dt; p.x+=p.kx*dt; p.kx*=Math.exp(-4*dt);
      if(p.st<=0&&p.z===0){ if(p.hp<=0){ p.state=5; p.st=0; sfx('pop'); say(p.s.name+' 出局',1); } else { p.state=0; p.inv=.9; } } }
    else {
      const has=ball.st==='held'&&ball.holder===p.id;
      p.duck=!has&&o.bh&&p.z===0&&p.role==='in';
      let vx=0,vy=0;
      if(!p.duck&&p.throwT<=0){
        if(p.role==='in'){ p.run=o.run&&!!o.mx; p.runT=p.run?p.runT+dt:0; vx=o.mx*(p.run?138:72)*p.s.spd; vy=o.my*58*p.s.spd; }
        else if(p.lane==='back') vy=o.my*95, vx=o.mx*40; else vx=o.mx*95, vy=o.my*40;
      } else p.run=false;
      p.moving=!!(vx||vy); if(o.mx&&(has||ball.st==='loose')) p.face=o.mx;
      if(!has&&p.role==='in'&&ball.st!=='loose') p.face=ball.x>=p.x?1:-1; // 沒球時自動面向球，才接得到
      p.x+=vx*dt; p.y+=vy*dt;
      if(o.j&&p.z===0&&p.role==='in'){ p.vz=235; sfx('land'); }
      if(has){ if(o.x&&p.role==='in'&&gauge[p.team]>=100) throwAt(p,true); else if(o.a) throwAt(p); else if(o.b) passFrom(p); }
      else if(o.a&&p.role==='in'){ p.catchT=.3; }
    }
    // 活動範圍
    const tm=p.team;
    if(p.role==='in'){ const lo=tm?MID+9:X0+8,hi=tm?X1-8:MID-9; p.x=Math.max(lo,Math.min(hi,p.x)); p.y=Math.max(YB+6,Math.min(YF-4,p.y)); }
    else if(p.lane==='back'){ const bx=tm?X0-20:X1+20; p.x=Math.max(bx-14,Math.min(bx+14,p.x)); p.y=Math.max(YB-8,Math.min(YF+8,p.y)); }
    else { const lo=tm?X0:MID+12,hi=tm?MID-12:X1,by=p.lane==='top'?YB-13:YF+13; p.x=Math.max(lo,Math.min(hi,p.x)); p.y=Math.max(by-9,Math.min(by+9,p.y)); }
  }

  function conclude(w,note){
    if(ended) return; ended=true; const mine=two||w===me;
    env.sfx(mine?'win':'lose');
    const tn=i=>names&&names[i]?names[i]:(i===0?(vs?'左隊':'你的隊伍'):(vs?'右隊':foe.name));
    env.end({title:two?(w?'右隊':'左隊')+'獲勝':mine?'你贏了！':'你輸了',big:ins(0).length+' : '+ins(1).length,text:note||(tn(w)+'還有人站在場上。'),
      score:!vs&&!net&&w===0?si+1:null,next:!vs&&!net&&w===0&&si<STAGES.length-1});
  }
  const ST={held:0,shot:1,pass:2,loose:3},STN=['held','shot','pass','loose'];
  function snapshot(){
    const m={s:1,p:P.map(p=>[Math.round(p.x),Math.round(p.y),Math.round(p.z),p.face,p.state,Math.ceil(p.hp),(p.duck?1:0)|(p.run?2:0)|(p.throwT>0?4:0)|(p.catchT>0?8:0)|(p.moving?16:0)|(p.inv>0?32:0),r1(p.st)]),
      b:[Math.round(ball.x),Math.round(ball.y),Math.round(ball.z),ST[ball.st],ball.holder,ball.type?KINDS.indexOf(ball.type):-1,Math.round(ball.ghost)],c:ctrl,g:[Math.round(gauge[0]),Math.round(gauge[1])],e:ev};
    ev=[]; return m;
  }
  if(net){
    if(client) net.onmsg=m=>{
      if(m.s){ m.p.forEach((a,i)=>{ const p=P[i]; p.tx=a[0]; p.ty=a[1]; p.tz=a[2]; p.face=a[3]; p.state=a[4]; p.hp=a[5]; p.duck=!!(a[6]&1); p.run=!!(a[6]&2); p.throwT=a[6]&4?.1:0; p.catchT=a[6]&8?.1:0; p.moving=!!(a[6]&16); p.inv=a[6]&32?.1:0; p.st=a[7]; });
        const b=m.b; ball.tx=b[0]; ball.ty=b[1]; ball.tz=b[2]; ball.st=STN[b[3]]; ball.holder=b[4]; ball.type=b[5]>=0?KINDS[b[5]]:null; ball.ghost=b[6]; ctrl[0]=m.c[0]; ctrl[1]=m.c[1];
        if(m.g){ gauge[0]=m.g[0]; gauge[1]=m.g[1]; }
        for(const n of m.e){ if(n[0]==='!'){ msg=n.slice(1); msgT=1; } else if(n[0]==='#') fxEvent(n,true); else env.sfx(n); } }
      else if(m.end) conclude(m.end[0],m.end[1]);
    };
    else {
      net.onmsg=(m,from)=>{ if(from!==1||!m.i) return; const o=inp[1]; o.mx=m.i[0]; o.my=m.i[1]; o.run=!!m.i[2]; o.bh=!!m.i[3]; if(m.i[4]) o.a=true; if(m.i[5]) o.b=true; if(m.i[6]) o.j=true; if(m.i[7]) o.x=true; };
      net.onleave=i=>{ if(i===1&&!ended){ if(net.count>1) net.send({end:[0,'對手離開了。']}); conclude(0,'對手離開了。'); } };
    }
  }

  function update(dt){
    t+=dt; if(msgT>0) msgT-=dt; stepFx(dt);
    if(client){
      const o=inp[0]; read(0,0); const key=''+o.mx+o.my+(+o.run)+(+o.bh);
      if(key!==lastIn||o.a||o.b||o.j||o.x){ lastIn=key; net.send({i:[o.mx,o.my,+o.run,+o.bh,+o.a,+o.b,+o.j,+o.x]}); }
      o.a=o.b=o.j=o.x=false; const f=Math.min(1,dt*20);
      for(const p of P){ if(p.tx==null) continue; p.x+=(p.tx-p.x)*f; p.y+=(p.ty-p.y)*f; p.z+=(p.tz-p.z)*f; if(p.state===5) p.st+=dt; }
      if(ball.tx!=null){ if(Math.abs(ball.tx-ball.x)+Math.abs(ball.ty-ball.y)>90){ ball.x=ball.tx; ball.y=ball.ty; ball.z=ball.tz; } else { ball.x+=(ball.tx-ball.x)*f*1.4; ball.y+=(ball.ty-ball.y)*f*1.4; ball.z+=(ball.tz-ball.z)*f*1.4; } }
      return;
    }
    if(ended) return;
    if(over){ over+=dt; if(over>1.6){ const w=ins(0).length?0:1; if(net){ net.send(snapshot()); net.send({end:[w,'']}); } conclude(w); } return; }
    if(start>0){ start-=dt; if(start<=0) say('開始！',.8); }
    if(two){ read(0,1); read(1,2); } else read(0,0);
    // 必殺特寫和命中的瞬間，畫面會停一下
    if(freeze>0){ freeze-=dt; if(net){ sendT-=dt; if(sendT<=0){ sendT=1/30; net.send(snapshot()); } } return; }
    gauge[0]=Math.min(100,gauge[0]+dt*2.2); gauge[1]=Math.min(100,gauge[1]+dt*2.2);
    for(let tm=0;tm<2;tm++) if(human[tm]) pickCtrl(tm);
    const tmp=blank();
    for(const p of P){
      let o=tmp;
      if(human[p.team]&&ctrl[p.team]===p.id) o=inp[p.team]; else think(p,tmp,dt);
      if(start>0){ o.a=o.b=o.j=o.x=false; }
      stepPlayer(p,o,dt);
      if(o!==tmp){ o.a=o.b=o.j=o.x=false; }
    }
    if(start<=0) stepBall(dt); else { ball.vz-=560*dt; ball.z=Math.max(5,ball.z+ball.vz*dt); }
    if(!ins(0).length||!ins(1).length) over=.001;
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/30; net.send(snapshot()); } }
  }

  function draw(){
    ctx.save(); if(shake>0) ctx.translate((Math.random()-.5)*shake*22,(Math.random()-.5)*shake*16);
    drawCourt(ctx,cols[0],cols[1],L.court,L.bg);
    const list=P.filter(p=>!(p.state===5&&p.st>1.2)).sort((a,b)=>a.y-b.y);
    for(const p of list){
      const has=ball.st==='held'&&ball.holder===p.id;
      const pose=p.state===5?4:p.state===4?4:p.throwT>0?2:p.duck?3:p.catchT>0?6:p.moving?1:0;
      if(p.state===5){ drawGuy(ctx,p.x,p.y-p.st*26,0,p.face,cols[p.team],p.hair,0,t,Math.max(0,1-p.st/1.2)); ctx.strokeStyle='#ffd23f'; ctx.lineWidth=2; ctx.globalAlpha=Math.max(0,1-p.st/1.2); ctx.beginPath(); ctx.ellipse(p.x,p.y-p.st*26-42,7,2.5,0,0,7); ctx.stroke(); ctx.globalAlpha=1; continue; }
      drawGuy(ctx,p.x,p.y,p.z,p.face,cols[p.team],p.hair,pose,t+p.id,p.inv>0&&Math.floor(t*16)%2?.45:p.role==='out'?.9:1);
      if(p.run&&p.z===0){ ctx.fillStyle='rgba(255,255,255,.6)'; ctx.fillRect(p.x-p.face*14,p.y-3,6,2); ctx.fillRect(p.x-p.face*20,p.y-8,5,2); }
      for(let tm=0;tm<2;tm++) if(human[tm]&&ctrl[tm]===p.id&&(!net||tm===me)){ ctx.fillStyle=tm?'#3ddbd9':'#ffd23f'; ctx.beginPath(); ctx.moveTo(p.x-5,p.y-p.z-51); ctx.lineTo(p.x+5,p.y-p.z-51); ctx.lineTo(p.x,p.y-p.z-45); ctx.fill(); }
      if(has) drawBall(ctx,p.x+p.face*9,p.y+.5,p.z+18,null,t,L.ball);
    }
    if(ball.st!=='held'){ if(ball.type==='split') drawBall(ctx,ball.x,ball.y-ball.ghost,ball.z,'split',t,L.ball); drawBall(ctx,ball.x,ball.y+(ball.type==='split'?ball.ghost:0),ball.z,ball.type,t,L.ball); }
    // 粒子與衝擊波
    for(const f of fx){ ctx.globalAlpha=Math.max(0,f.life/f.max); ctx.fillStyle=f.col; const z=f.size*(.5+f.life/f.max*.5); ctx.fillRect(f.x-z/2,f.y-z/2,z,z); }
    ctx.globalAlpha=1;
    for(const r of rings){ const u=r.t/r.max; ctx.globalAlpha=1-u; ctx.strokeStyle=r.col; ctx.lineWidth=6*(1-u)+1; ctx.beginPath(); ctx.ellipse(r.x,r.y,r.r*u,r.r*u*.7,0,0,7); ctx.stroke();
      ctx.strokeStyle='#fff'; ctx.lineWidth=2; for(let i=0;i<10;i++){ const a=i*.628,r0=r.r*u*.5,r2=r.r*u*1.25; ctx.beginPath(); ctx.moveTo(r.x+Math.cos(a)*r0,r.y+Math.sin(a)*r0*.7); ctx.lineTo(r.x+Math.cos(a)*r2,r.y+Math.sin(a)*r2*.7); ctx.stroke(); }
      if(r.txt){ ctx.font='900 '+(20+u*10)+'px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=5; ctx.strokeStyle='#14122b'; ctx.strokeText(r.txt,r.x,r.y-24-u*14); ctx.fillStyle='#fff'; ctx.fillText(r.txt,r.x,r.y-24-u*14); } }
    ctx.globalAlpha=1; ctx.restore();
    if(flash>0){ ctx.fillStyle='rgba(255,255,255,'+Math.min(.7,flash*5)+')'; ctx.fillRect(0,0,W,H); }
    // 必殺特寫：畫面變暗、集中線、斜帶上的招式名
    if(cut){ const u=cut.t/cut.max,c=SHOT[cut.type].col,ul=cut.type==='ultra',dir=cut.team?-1:1;
      ctx.fillStyle='rgba(10,9,26,'+(ul?.62:.42)+')'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle=c; ctx.lineWidth=ul?3:2; ctx.globalAlpha=.8;
      for(let i=0;i<(ul?46:28);i++){ const a=i*2.399+t*4,r0=30+((i*37)%50)+u*20,r2=r0+60+((i*53)%140); ctx.beginPath(); ctx.moveTo(cut.x+Math.cos(a)*r0,cut.y-20+Math.sin(a)*r0); ctx.lineTo(cut.x+Math.cos(a)*r2,cut.y-20+Math.sin(a)*r2); ctx.stroke(); }
      ctx.globalAlpha=1;
      const slide=Math.min(1,u*4),bx=(1-slide)*-dir*W,bh=ul?64:46,by=H*.42;
      ctx.save(); ctx.translate(bx,0); ctx.transform(1,-.12,0,1,0,26);
      ctx.fillStyle='#14122b'; ctx.fillRect(-20,by-bh/2-4,W+40,bh+8); ctx.fillStyle=c; ctx.fillRect(-20,by-bh/2,W+40,bh);
      ctx.fillStyle='rgba(255,255,255,.25)'; for(let i=0;i<14;i++) ctx.fillRect(((i*71+t*900*dir)%(W+80)+W+80)%(W+80)-40,by-bh/2+((i*13)%bh),50,2);
      ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineJoin='round';
      ctx.font='900 '+(ul?40:30)+'px '+TC; ctx.lineWidth=7; ctx.strokeStyle='#14122b'; ctx.strokeText(SHOT[cut.type].name,W/2,by+(ul?4:2)); ctx.fillStyle='#fff'; ctx.fillText(SHOT[cut.type].name,W/2,by+(ul?4:2));
      ctx.font='700 12px '+TC; ctx.lineWidth=4; ctx.strokeText(cut.name+(ul?'　超必殺！':'　必殺球！'),W/2,by-bh/2-12); ctx.fillStyle='#ffd23f'; ctx.fillText(cut.name+(ul?'　超必殺！':'　必殺球！'),W/2,by-bh/2-12);
      ctx.restore(); }
    // 體力列
    ctx.fillStyle='rgba(11,10,28,.82)'; ctx.fillRect(0,0,W,HUD);
    ctx.textBaseline='middle'; ctx.font='700 10px '+TC;
    for(let tm=0;tm<2;tm++) for(let i=0;i<3;i++){ const p=P[tm*6+i],x=tm?W-8-(3-i)*74+2:8+i*74,dead=p.state===5;
      ctx.textAlign='left'; ctx.fillStyle=dead?'#6b6799':'#fff'; ctx.fillText(p.s.name,x,11);
      ctx.fillStyle='#2b2759'; ctx.fillRect(x,20,66,9); ctx.fillStyle=dead?'#2b2759':p.hp/p.max>.5?'#86dc4f':p.hp/p.max>.25?'#ffd23f':'#ff5d8f'; ctx.fillRect(x,20,66*Math.max(0,p.hp/p.max),9);
      ctx.strokeStyle=cols[tm]; ctx.lineWidth=1.5; ctx.strokeRect(x-.5,19.5,67,10); }
    // 氣力條：滿了可以放超必殺
    for(let tm=0;tm<2;tm++){ const x=tm?W-8-216:8,full=gauge[tm]>=100; ctx.fillStyle='#2b2759'; ctx.fillRect(x,33,216,4);
      ctx.fillStyle=full?(Math.floor(t*8)%2?'#fff':'#ff3b3b'):'#ff9d3d'; ctx.fillRect(tm?x+216-216*gauge[tm]/100:x,33,216*gauge[tm]/100,4); }
    if(gauge[me]>=100&&(!net||true)){ ctx.font='900 12px '+TC; ctx.textAlign=me?'right':'left'; ctx.fillStyle='#14122b'; const tx=me?W-10:10; ctx.lineWidth=4; ctx.strokeStyle='#14122b'; ctx.strokeText('氣滿了！拿球按「必殺」',tx,50); ctx.fillStyle='#ffd23f'; ctx.fillText('氣滿了！拿球按「必殺」',tx,50); }
    ctx.textAlign='center'; ctx.font='9px '+PIX; ctx.fillStyle='#ffd23f'; ctx.fillText('VS',W/2,20);
    if(msgT>0&&msg){ ctx.font='900 24px '+TC; ctx.lineWidth=5; ctx.strokeStyle='#14122b'; ctx.strokeText(msg,W/2,74); ctx.fillStyle='#ffd23f'; ctx.fillText(msg,W/2,74); }
  }
  return {update,draw,destroy(){},_dbg:{P,ball,ctrl,inp}};
}

function preview(ctx,w,h,L,t){
  ctx.save(); ctx.scale(w/W,w/W); ctx.translate(0,-70); drawCourt(ctx,L.color,'#3d8bff',L.court,L.bg);
  for(let i=0;i<3;i++) drawGuy(ctx,110+i*46,188+i*26,i===1?Math.abs(Math.sin(t*3))*10:0,1,L.color,i===0?+L.hair:(+L.hair+i)%4,i===1?2:i===0?1:0,t);
  drawGuy(ctx,360,214,0,-1,'#3d8bff',1,6,t);
  const u=(t%1.4)/1.4; drawBall(ctx,190+150*u,214,22+Math.sin(u*Math.PI)*6,null,t,L.ball);
  ctx.restore();
}
function thumb(ctx,w,h,t){
  ctx.save(); ctx.scale(w/W,w/W); ctx.translate(0,-28);
  drawCourt(ctx,'#ff5d4f','#3d8bff');
  const T=2.4,u=(t%T)/T,rel=.34,hitU=.62;
  // 跳起來放超必殺：球變大、拖著火焰，打中對手飛出去
  const jy=u<rel?Math.sin(u/rel*Math.PI)*34:0;
  drawGuy(ctx,150,206,jy,1,'#ff5d4f',1,u<rel?(u>.2?2:1):0,t); drawGuy(ctx,96,240,0,1,'#ff5d4f',0,1,t); drawGuy(ctx,182,170,0,1,'#ff5d4f',2,0,t);
  const hit=u>hitU; drawGuy(ctx,hit?370+Math.min(1,(u-hitU)*5)*50:370,200,hit?Math.sin(Math.min(1,(u-hitU)*4)*Math.PI)*30:0,-1,'#3d8bff',1,hit?(u-hitU>.2?7:3):6,t);
  drawGuy(ctx,330,240,0,-1,'#3d8bff',0,1,t); drawGuy(ctx,404,168,0,-1,'#3d8bff',2,0,t);
  drawGuy(ctx,448,210,0,-1,'#ff5d4f',1,0,t); drawGuy(ctx,32,200,0,1,'#3d8bff',0,0,t);
  if(u>=rel-.04&&u<hitU){ const k=(u-rel+.04)/(hitU-rel+.04),x=166+(366-166)*k,z=40-20*k;
    for(let i=1;i<7;i++){ const kk=Math.max(0,k-i*.05); ctx.globalAlpha=.18*(7-i)/6; ctx.fillStyle=i%2?'#ffd23f':'#ff5d4f'; ctx.beginPath(); ctx.arc(166+200*kk,200-(40-20*kk),14-i,0,7); ctx.fill(); } ctx.globalAlpha=1;
    drawBall(ctx,x,200,z,'ultra',t); }
  if(u>hitU&&u<hitU+.1){ ctx.fillStyle='rgba(255,255,255,.95)'; ctx.beginPath(); for(let i=0;i<14;i++){ const a=i*.4488,r=i%2?12:34; ctx.lineTo(370+Math.cos(a)*r,178+Math.sin(a)*r); } ctx.fill(); }
  if(u>.18&&u<.95){ ctx.save(); ctx.translate(W/2,150); const sc=1+Math.max(0,.1-(u-.18))*5; ctx.scale(sc,sc); ctx.font='900 30px "Noto Sans TC","Microsoft JhengHei",sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=7; ctx.strokeStyle='#14122b'; ctx.strokeText('超必殺！',0,0); ctx.fillStyle='#ffd23f'; ctx.fillText('超必殺！',0,0); ctx.restore(); }
  ctx.restore();
}

window.ARCADE_GUY=drawGuy; // 足球也用同一套人物畫法
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).dodge={
  name:'熱血躲避球',tag:'DODGE BALL',color:'#ff9d3d',online:true,maxPlayers:2,
  desc:'三對三躲避球，丟球打倒對方內野。助跑丟、跳起來丟會變成必殺球，共 7 種；集滿氣還能放超必殺。6 支隊伍，可單人、兩人同一台，或開房間連線。',
  goal:'丟球打對方內野的人扣體力，三個人都倒下就贏了。連按兩下 ← 或 → 助跑後丟、或跳起來丟，會丟出必殺球。打中人或接到球會累積氣力，集滿後拿球按「必殺」放出接不住的超必殺。球飛過來時按「丟」可以接住。',
  stages:STAGES.map(s=>s.name),stars:[1,2,3,3,4,5],
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['↑ ↓ ← →','移動，連按兩下 ← → 助跑'],['J','丟球；沒球時是接球'],['K','傳球；沒球時按住是蹲下'],['L','跳'],['I','超必殺（氣力條滿、拿著球時）'],['W A S D F G H R','雙人左隊：移動、丟、傳、跳、超必殺'],['↑ ↓ ← → , . / M','雙人右隊：移動、丟、傳、跳、超必殺']],
  touchHelp:[['方向盤','移動，同方向點兩下助跑'],['丟','丟球，沒球時接球'],['傳','傳球，沒球時蹲下'],['跳','跳起來'],['必殺','氣力條滿、拿著球時放超必殺']],
  touch:{left:'dpad',right:[{l:'必殺',c:'KeyI'},{l:'跳',c:'KeyL'},{l:'傳',c:'KeyK'},{l:'丟',c:'KeyJ',act:true}]},
  looks:[{key:'color',label:'隊服顏色',type:'color',opts:['#ff5d4f','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#b98cff','#ff7eb6']},
    {key:'hair',label:'人物造型',opts:[{id:'0',label:'短髮'},{id:'1',label:'飛機頭'},{id:'2',label:'馬尾'},{id:'3',label:'帽子'}]},
    {key:'ball',label:'球的顏色',type:'color',opts:['#ffffff','#ffd23f','#ff9d3d','#ff7eb6','#86dc4f','#6fd3ff']},
    {key:'court',label:'場地顏色',type:'color',opts:['#e0a868','#6fbf6a','#5a9fd6','#9a7fd0','#9aa0b0','#e08a8a']},
    {key:'bg',label:'遊戲背景',opts:[{id:'beach',label:'海邊'},{id:'school',label:'校園'},{id:'night',label:'夜晚'},{id:'snow',label:'雪地'}]}],
  best:{label:'已打敗',fmt:v=>v+' / '+STAGES.length+' 隊',lower:false},
  preview,thumb,create
};
})();
