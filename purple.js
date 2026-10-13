// 紫色風暴：橫向捲軸的打鬥過關遊戲，玩法和招式表參考經典 Flash 遊戲「紫色恐怖」，人物和場景是原創畫的。
// 招式：a 輕拳、s 重拳、a+s 上勾拳、asa 手刀、aaaasss 七連擊、asaaaaasss 十連擊、
//       跑步+a 升龍拳、跑步+s 連按 旋轉地獄車、倒地補擊、貼近抓人（連打四下或加方向丟出去）、撿武器、籃球 上+a 投籃。
// 連線是兩人合作：房主負責運算，加入的人只送出按鍵。
(function(){
'use strict';
const W=480,H=300,YB=178,YF=270;
const PIX='"Press Start 2P","Noto Sans TC","Microsoft JhengHei",monospace';
const TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const INK='#1b1420';
const P={idle:0,walk:1,run:2,jab:3,heavy:4,upper:5,spin:6,hurt:7,air:8,down:9,getup:10,grab:11,held:12,chop:13,rise:14,toss:15,dance:16,wind:17};
const KIND={ // 敵人：體力、傷害、速度、體型
  kid:{hp:26,dmg:5,spd:56,sc:1,name:'小混混'},fast:{hp:20,dmg:4,spd:92,sc:.95,name:'飛毛腿'},big:{hp:64,dmg:10,spd:38,sc:1.38,name:'大塊頭'},
  ball:{hp:22,dmg:6,spd:60,sc:1,name:'丟球的'},boss:{hp:230,dmg:8,spd:70,sc:1.25,name:'街舞小子'}
};
const STAGES=[
  {name:'後巷',len:1500,bg:'alley',waves:[[260,['kid','kid']],[620,['kid','fast','kid']],[980,['big','kid','ball']],[1320,['boss1']]],items:[[180,'bat'],[700,'can'],[1050,'food']]},
  {name:'公園',len:1700,bg:'park',waves:[[260,['fast','kid','kid']],[640,['ball','ball','kid']],[1000,['big','fast','fast']],[1240,['kid','kid','big']],[1520,['boss2']]],items:[[300,'ball'],[820,'bat'],[1150,'food']]},
  {name:'學校操場',len:1800,bg:'school',waves:[[260,['kid','kid','fast']],[600,['big','ball']],[920,['fast','fast','fast','kid']],[1280,['big','big','ball']],[1620,['boss3']]],items:[[220,'ball'],[560,'ball'],[1000,'food'],[1350,'bat']]},
  {name:'夜市',len:1900,bg:'night',waves:[[260,['ball','kid','kid','fast']],[640,['big','fast','fast']],[1000,['big','big','kid','ball']],[1380,['fast','fast','ball','ball']],[1720,['boss4']]],items:[[240,'can'],[700,'bat'],[1100,'food'],[1450,'can']]},
  {name:'街舞廣場',len:2000,bg:'plaza',waves:[[260,['kid','kid','kid','fast']],[620,['big','ball','ball']],[980,['fast','fast','big','big']],[1380,['kid','fast','ball','big','kid']],[1820,['boss5']]],items:[[200,'bat'],[640,'ball'],[1020,'food'],[1420,'food'],[1500,'can']]}
];
const clamp=(v,a,b)=>v<a?a:v>b?b:v,rnd=Math.random;

/* ---------- 人物畫法：粗黑邊、圓滾滾的卡通風 ---------- */
function shape(ctx,fill,draw){ ctx.beginPath(); draw(); ctx.fillStyle=fill; ctx.fill(); ctx.strokeStyle=INK; ctx.lineWidth=2; ctx.stroke(); }
function limb(ctx,x0,y0,x1,y1,w,col){ ctx.lineCap='round'; ctx.strokeStyle=INK; ctx.lineWidth=w+3; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke(); ctx.strokeStyle=col; ctx.lineWidth=w; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke(); }
// 主角：駝背的紫色壯小孩，蛋形白臉、連帽
function drawHero(ctx,x,y,z,face,pose,ph,col,sc,weapon,alpha){
  ctx.save(); if(alpha!=null) ctx.globalAlpha=alpha;
  ctx.fillStyle='rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x,y,15*sc,4.5*sc,0,0,7); ctx.fill();
  ctx.translate(x,y-z); ctx.scale(face*sc,sc);
  const dark='#3d2a66',pale='#f3ead8'; let lean=.16,ax=14,ay=-20,bx=-8,by=-16,lp=0,hy=0,rot=0;
  if(pose===P.walk){ lp=Math.sin(ph*6.283)*5; } else if(pose===P.run){ lp=Math.sin(ph*6.283)*8; lean=.42; ax=10; ay=-14; bx=-14; by=-22; }
  else if(pose===P.jab){ const k=Math.sin(Math.min(1,ph*1.6)*Math.PI); ax=14+k*18; ay=-30; lean=.22+k*.1; }
  else if(pose===P.heavy){ const k=ph<.4?-ph/.4*.6:Math.sin((ph-.4)/.6*Math.PI); ax=14+k*24; ay=-28-k*4; bx=-10-k*4; lean=.2+k*.25; }
  else if(pose===P.chop){ const k=Math.min(1,ph*1.8); ax=18+k*10; ay=-48+k*30; lean=.3; }
  else if(pose===P.upper||pose===P.rise){ const k=Math.min(1,ph*1.7); ax=14+k*6; ay=-18-k*38; lean=.05-k*.2; hy=-k*3; }
  else if(pose===P.spin){ rot=ph*18; ax=24; ay=-30; bx=-24; by=-30; lean=0; }
  else if(pose===P.hurt){ lean=-.35; ax=6; ay=-34; bx=-12; by=-30; }
  else if(pose===P.air){ rot=-1.1; lean=0; ax=10; ay=-40; bx=-14; by=-36; }
  else if(pose===P.down){ rot=-1.52; lean=0; } else if(pose===P.getup){ lean=.7-ph*.5; }
  else if(pose===P.grab){ ax=22; ay=-34; bx=18; by=-24; lean=.3; } else if(pose===P.toss){ ax=-6+ph*34; ay=-50+ph*16; bx=-10+ph*30; by=-46+ph*18; lean=-.1+ph*.5; }
  else { hy=Math.sin(ph*6.283)*1; }
  if(rot){ ctx.translate(0,-20); ctx.rotate(rot); ctx.translate(0,20); if(pose===P.down) ctx.translate(-4,14); }
  // 腳
  shape(ctx,dark,()=>ctx.rect(-9-lp*.5,-10,7,9)); shape(ctx,dark,()=>ctx.rect(2+lp*.5,-10,7,9));
  shape(ctx,'#f6f6f6',()=>ctx.rect(-10-lp*.5,-2.5,10,3)); shape(ctx,'#f6f6f6',()=>ctx.rect(1+lp*.5,-2.5,10,3));
  ctx.save(); ctx.translate(0,-12); ctx.rotate(lean);
  limb(ctx,-4,-14+hy,bx,by+12+hy,7,col); shape(ctx,dark,()=>ctx.arc(bx,by+12+hy,5,0,7));                        // 後手
  shape(ctx,col,()=>ctx.ellipse(0,-10+hy,13,14,0,0,7));                                                           // 身體
  shape(ctx,dark,()=>ctx.ellipse(-2,-1+hy,10,4,0,0,7));
  // 連帽與蛋形臉
  shape(ctx,col,()=>ctx.ellipse(5,-27+hy,11,12,0,0,7));
  shape(ctx,pale,()=>{ ctx.moveTo(-1,-26+hy); ctx.quadraticCurveTo(1,-40+hy,8,-41+hy); ctx.quadraticCurveTo(15,-38+hy,14,-25+hy); ctx.quadraticCurveTo(12,-16+hy,6,-16+hy); ctx.quadraticCurveTo(0,-17+hy,-1,-26+hy); });
  ctx.fillStyle=INK; const hurt=pose===P.hurt||pose===P.air||pose===P.down;
  if(hurt){ ctx.fillRect(5,-29+hy,4,1.6); ctx.fillRect(10,-29+hy,4,1.6); ctx.fillRect(7,-22+hy,5,2); }
  else { ctx.beginPath(); ctx.arc(7,-28+hy,1.7,0,7); ctx.arc(12,-28+hy,1.7,0,7); ctx.fill(); ctx.fillRect(4,-32+hy,5,1.4); ctx.fillRect(10,-33+hy,5,1.4); ctx.fillRect(8,-22+hy,4,1.3); }
  if(weapon==='bat'){ ctx.save(); ctx.translate(ax,ay+12+hy); ctx.rotate(pose===P.heavy||pose===P.jab?.3:-1.1); shape(ctx,'#d9a45c',()=>ctx.rect(0,-2.5,26,5)); ctx.restore(); }
  limb(ctx,5,-15+hy,ax,ay+12+hy,8,col); shape(ctx,dark,()=>ctx.arc(ax,ay+12+hy,6,0,7));                             // 前手
  if(weapon==='ball') shape(ctx,'#ff9d3d',()=>ctx.arc(ax+3,ay+6+hy,6,0,7));
  if(weapon==='can') shape(ctx,'#9aa0b0',()=>ctx.rect(ax-4,ay-6+hy,14,16));
  ctx.restore(); ctx.restore();
}
// 對手：圓頭的鄰居小孩，各種打扮
function drawKid(ctx,x,y,z,face,pose,ph,kind,tint,sc,alpha){
  ctx.save(); if(alpha!=null) ctx.globalAlpha=alpha;
  ctx.fillStyle='rgba(0,0,0,.26)'; ctx.beginPath(); ctx.ellipse(x,y,12*sc,4*sc,0,0,7); ctx.fill();
  ctx.translate(x,y-z); ctx.scale(face*sc,sc);
  const skin='#ffd9c8',boss=kind==='boss'; let ax=9,ay=-14,bx=-8,by=-14,lp=0,rot=0,lean=0;
  if(pose===P.walk||pose===P.run){ lp=Math.sin(ph*6.283)*(pose===P.run?7:4); lean=pose===P.run?.3:.05; }
  else if(pose===P.wind){ ax=-4; ay=-24; lean=-.2; } else if(pose===P.jab||pose===P.heavy){ const k=Math.sin(Math.min(1,ph*1.5)*Math.PI); ax=10+k*15; ay=-22; lean=.2; }
  else if(pose===P.hurt){ lean=-.4; ax=4; ay=-26; bx=-12; by=-24; } else if(pose===P.air||pose===P.held){ rot=pose===P.held?-.5:-1.2; ax=8; ay=-28; bx=-12; by=-26; }
  else if(pose===P.down){ rot=-1.52; } else if(pose===P.getup){ lean=.7-ph*.6; } else if(pose===P.dance||pose===P.spin){ rot=ph*20; ax=16; ay=-20; bx=-16; by=-20; }
  else if(pose===P.toss){ ax=-2+ph*18; ay=-34+ph*12; }
  if(rot){ ctx.translate(0,-16); ctx.rotate(rot); ctx.translate(0,16); if(pose===P.down) ctx.translate(-3,12); }
  shape(ctx,'#2b3f9e',()=>ctx.rect(-7-lp*.5,-9,6,8)); shape(ctx,'#2b3f9e',()=>ctx.rect(1+lp*.5,-9,6,8));
  shape(ctx,'#f6f6f6',()=>ctx.rect(-8-lp*.5,-2.5,9,3)); shape(ctx,'#f6f6f6',()=>ctx.rect(0+lp*.5,-2.5,9,3));
  ctx.save(); ctx.translate(0,-10); ctx.rotate(lean);
  limb(ctx,-4,-10,bx,by+10,4.5,skin);
  shape(ctx,tint,()=>ctx.rect(-8,-14,16,15)); ctx.fillStyle='rgba(255,255,255,.7)'; ctx.fillRect(-8,-8,16,2);
  shape(ctx,skin,()=>ctx.arc(1,-24,10,0,7));
  ctx.fillStyle=INK; const hurt=pose===P.hurt||pose===P.air||pose===P.down||pose===P.held;
  if(boss){ ctx.fillRect(-2,-27,13,4); ctx.fillStyle=tint; ctx.beginPath(); ctx.arc(1,-27,10.5,Math.PI*1.05,Math.PI*1.95); ctx.fill(); ctx.fillRect(-12,-30,10,3); ctx.fillStyle=INK; }
  else if(hurt){ ctx.fillRect(2,-27,3.5,1.5); ctx.fillRect(7,-27,3.5,1.5); } else { ctx.beginPath(); ctx.arc(4,-26,1.5,0,7); ctx.arc(8.5,-26,1.5,0,7); ctx.fill(); }
  if(hurt){ ctx.beginPath(); ctx.arc(6,-19,2.2,0,7); ctx.fill(); } else ctx.fillRect(4,-20,5,1.3);
  if(kind==='fast'){ ctx.fillStyle=tint; ctx.beginPath(); ctx.arc(1,-26,10.4,Math.PI,0); ctx.fill(); ctx.fillRect(4,-27,11,3); }
  else if(kind==='ball'){ ctx.fillStyle='#fff'; ctx.fillRect(-9,-31,20,3.5); ctx.fillStyle='#e23b3b'; ctx.fillRect(-9,-30,20,1.4); }
  else if(kind==='kid'){ ctx.fillStyle='#7a3b1d'; ctx.beginPath(); ctx.arc(1,-27,10.2,Math.PI*1.1,Math.PI*1.9); ctx.fill(); }
  limb(ctx,4,-10,ax,ay+10,5,skin); shape(ctx,skin,()=>ctx.arc(ax,ay+10,3.6,0,7));
  ctx.restore(); ctx.restore();
}

/* ---------- 場景 ---------- */
function drawScene(ctx,bg,cam,t){
  const far=cam*.3,mid=cam*.6,rep=(w,off,fn)=>{ for(let x=-((off%w)+w)%w-w;x<W+w;x+=w) fn(x); };
  if(bg==='night'){ ctx.fillStyle='#16153d'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#fff'; for(let i=0;i<40;i++) ctx.fillRect(((i*97-far*.3)%W+W)%W,(i*31)%90,1.5,1.5);
    rep(120,mid,x=>{ shape(ctx,['#c9573f','#3d8bff','#e0a030'][Math.abs(Math.round((x+mid)/120))%3],()=>ctx.rect(x+8,84,104,26)); shape(ctx,'#3a2d57',()=>ctx.rect(x+12,110,96,62)); ctx.fillStyle='#ffd23f'; for(let k=0;k<4;k++){ ctx.globalAlpha=.7+.3*Math.sin(t*4+k+x); ctx.beginPath(); ctx.arc(x+22+k*26,80,5,0,7); ctx.fill(); } ctx.globalAlpha=1; ctx.fillStyle='#fff'; ctx.font='900 13px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(['雞排','珍奶','烤肉'][Math.abs(Math.round((x+mid)/120))%3],x+60,97); });
    ctx.fillStyle='#3b3550'; ctx.fillRect(0,170,W,H-170); }
  else if(bg==='plaza'){ const g=ctx.createLinearGradient(0,0,0,170); g.addColorStop(0,'#ff9a6a'); g.addColorStop(1,'#ffd9a0'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#5a3f6a'; rep(70,far,x=>ctx.fillRect(x+6,60+((Math.abs(Math.round((x+far)/70))*37)%50),56,120));
    rep(200,mid,x=>{ shape(ctx,'#8a8fa8',()=>ctx.rect(x,104,200,68)); ctx.font='900 30px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=5; ctx.strokeStyle=INK; const s=['DANCE','酷！','BOOM','街舞'][Math.abs(Math.round((x+mid)/200))%4]; ctx.strokeText(s,x+100,138); ctx.fillStyle=['#ff5d8f','#3ddbd9','#ffd23f','#86dc4f'][Math.abs(Math.round((x+mid)/200))%4]; ctx.fillText(s,x+100,138); });
    ctx.fillStyle='#b9a0c8'; ctx.fillRect(0,170,W,H-170); }
  else { ctx.fillStyle=bg==='school'?'#9fd8ff':'#8fd3ff'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff'; rep(260,far,x=>{ ctx.beginPath(); ctx.arc(x+60,40,16,0,7); ctx.arc(x+80,46,13,0,7); ctx.arc(x+42,47,12,0,7); ctx.fill(); });
    if(bg==='alley'){ rep(300,mid,x=>{ shape(ctx,'#f0e6d0',()=>ctx.rect(x+20,60,150,112)); shape(ctx,'#c9573f',()=>{ ctx.moveTo(x+10,62); ctx.lineTo(x+95,26); ctx.lineTo(x+180,62); ctx.closePath(); }); shape(ctx,'#7fb6dc',()=>ctx.rect(x+40,84,30,30)); shape(ctx,'#b9783a',()=>ctx.rect(x+110,104,34,68)); });
      rep(22,cam,x=>shape(ctx,'#b9783a',()=>{ ctx.moveTo(x,172); ctx.lineTo(x,112); ctx.lineTo(x+10,104); ctx.lineTo(x+20,112); ctx.lineTo(x+20,172); ctx.closePath(); }));
      rep(170,cam,x=>{ shape(ctx,'#3f9a56',()=>{ ctx.arc(x+30,160,22,0,7); }); shape(ctx,'#9aa0b0',()=>ctx.rect(x+90,146,22,30)); shape(ctx,'#7a7f90',()=>ctx.rect(x+87,142,28,6)); });
      ctx.fillStyle='#b9a07a'; ctx.fillRect(0,170,W,H-170); }
    else if(bg==='park'){ rep(140,mid,x=>{ shape(ctx,'#7a5a36',()=>ctx.rect(x+60,96,12,76)); shape(ctx,'#3f9a56',()=>ctx.arc(x+66,82,36,0,7)); });
      rep(420,cam,x=>{ shape(ctx,'#ff5d4f',()=>{ ctx.moveTo(x+60,172); ctx.lineTo(x+110,116); ctx.lineTo(x+122,116); ctx.lineTo(x+78,172); ctx.closePath(); }); shape(ctx,'#ffd23f',()=>ctx.rect(x+110,108,30,64)); limb(ctx,x+250,110,x+250,172,3,'#6b7686'); limb(ctx,x+310,110,x+310,172,3,'#6b7686'); limb(ctx,x+246,110,x+314,110,3,'#6b7686'); const sw=Math.sin(t*2)*10; limb(ctx,x+280,110,x+280+sw,150,1.5,'#6b7686'); shape(ctx,'#3d8bff',()=>ctx.rect(x+270+sw,150,20,5)); });
      ctx.fillStyle='#8fc46a'; ctx.fillRect(0,170,W,H-170); }
    else { rep(380,mid,x=>{ shape(ctx,'#f0e6d0',()=>ctx.rect(x+10,52,330,120)); shape(ctx,'#c9573f',()=>ctx.rect(x,44,350,10)); ctx.fillStyle='#7fb6dc'; for(let r=0;r<3;r++) for(let i=0;i<9;i++) ctx.fillRect(x+26+i*35,64+r*34,22,22); });
      rep(520,cam,x=>{ limb(ctx,x+90,172,x+90,96,4,'#6b7686'); shape(ctx,'#fff',()=>ctx.rect(x+70,82,44,30)); ctx.strokeStyle='#ff5d4f'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(x+104,114,12,4,0,0,7); ctx.stroke(); });
      ctx.fillStyle='#c98a6a'; ctx.fillRect(0,170,W,H-170); ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=2; rep(520,cam,x=>{ ctx.strokeRect(x+10,186,500,80); ctx.beginPath(); ctx.ellipse(x+260,226,50,30,0,0,7); ctx.stroke(); }); }
  }
  ctx.fillStyle='rgba(0,0,0,.1)'; ctx.fillRect(0,170,W,10);
}

function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,two=!net&&opts.mode==='2p',np=net?Math.min(2,net.count):two?2:1,me=net?Math.min(1,net.me):0;
  const si=opts.stage||0,ST=STAGES[si],L=opts.look||{color:'#8a5ad6'};
  const {ctx}=env.canvas2d(W,H);
  const hcol=i=>(net&&net.looks&&net.looks[i]&&net.looks[i].color)||(i===0?L.color:'#5a7ad6');
  const E=[]; // 所有角色
  for(let i=0;i<np;i++) E.push({id:i,hero:true,x:60+i*30,y:220+i*24,z:0,vx:0,vy:0,vz:0,face:1,hp:100,max:100,state:'idle',st:0,pose:0,ph:0,col:hcol(i),sc:i===1?1.16:1,
    run:false,seq:'',seqT:0,atk:null,buf:null,weapon:null,wuse:0,grab:null,gh:0,combo:0,comboT:0,inv:0,lastA:-9,lastS:-9,dead:false,spinT:0});
  const items=ST.items.map((a,i)=>({id:i,x:a[0],y:230+((i*37)%30),z:0,vx:0,vy:0,vz:0,type:a[1],held:false,fly:0,gone:false}));
  const inp=[blank(),blank()],tap=[{d:0,t:-9,run:0},{d:0,t:-9,run:0}],prev=[{},{}],fx=[],rings=[],txts=[];
  let t=0,cam=0,wave=0,lock=null,goT=0,freeze=0,shake=0,flash=0,ended=false,ev=[],sendT=0,lastIn='',nid=10,clearT=0,slow=0,intro=1.6;
  function blank(){ return {mx:0,my:0,run:false,a:false,s:false,aH:false,sH:false,up:false}; }
  const sfx=n=>{ env.sfx(n); if(net&&net.host) ev.push(n); };
  const heroes=()=>E.filter(e=>e.hero&&!e.dead),foes=()=>E.filter(e=>!e.hero&&!e.gone);

  /* ---- 輸入 ---- */
  function keysOf(k){
    const K=env.keys,S=k===1?['KeyW','KeyS','KeyA','KeyD','KeyF','KeyG']:k===2?['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Comma','Period']:null;
    if(S) return {u:K[S[0]],d:K[S[1]],l:K[S[2]],r:K[S[3]],a:env.hit(S[4]),s:env.hit(S[5]),aH:!!K[S[4]],sH:!!K[S[5]]};
    return {u:K.ArrowUp,d:K.ArrowDown,l:K.ArrowLeft,r:K.ArrowRight,a:env.hit('KeyA')||env.hit('KeyJ'),s:env.hit('KeyS')||env.hit('KeyK'),aH:!!(K.KeyA||K.KeyJ),sH:!!(K.KeyS||K.KeyK)};
  }
  function read(n,k){
    const q=keysOf(k),o=inp[n],tp=tap[n],pv=prev[n],mx=(q.r?1:0)-(q.l?1:0);
    if(mx&&!(mx>0?pv.r:pv.l)){ if(tp.d===mx&&t-tp.t<.3) tp.run=mx; tp.d=mx; tp.t=t; }
    if(!mx||mx!==tp.run) tp.run=0; pv.l=q.l; pv.r=q.r;
    o.mx=mx; o.my=(q.d?1:0)-(q.u?1:0); o.run=!!tp.run; o.a=o.a||q.a; o.s=o.s||q.s; o.aH=q.aH; o.sH=q.sH; o.up=!!q.u;
  }

  /* ---- 特效 ---- */
  function puff(x,y,n,col,spd,life,size){ for(let i=0;i<n;i++){ const a=rnd()*6.283,v=spd*(.4+rnd()*.8); fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.7-30,life,max:life,col,size:size*(.6+rnd()*.8)}); } }
  function fxEvent(str,local){
    if(!local&&net&&net.host) ev.push(str);
    const a=str.split('|'),x=+a[1],y=+a[2],lvl=+a[3];
    if(a[0]==='#h'){ const big=lvl>=2; puff(x,y,big?18:7,big?'#ffd23f':'#fff',big?230:120,big?.5:.3,big?5:3); if(lvl>=1) puff(x,y,6,'#ff9d3d',160,.35,3);
      rings.push({x,y,t:0,max:big?.38:.24,r:big?40:20,col:big?'#ffd23f':'#fff'}); txts.push({x,y:y-18,t:0,max:.5,s:big?['轟！','碰！','磅！'][Math.floor(rnd()*3)]:['啪','砰','咚'][Math.floor(rnd()*3)],big});
      shake=Math.max(shake,big?.35:lvl?.16:.08); if(lvl>=3){ flash=.12; slow=.35; } }
    else if(a[0]==='#t') txts.push({x,y,t:0,max:1.1,s:a[4],big:true,col:'#3ddbd9'});
  }
  function stepFx(dt){
    if(shake>0) shake-=dt; if(flash>0) flash-=dt;
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.life-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vx*=Math.exp(-3*dt); f.vy=f.vy*Math.exp(-3*dt)+160*dt; if(f.life<=0) fx.splice(i,1); }
    for(let i=rings.length-1;i>=0;i--){ rings[i].t+=dt; if(rings[i].t>=rings[i].max) rings.splice(i,1); }
    for(let i=txts.length-1;i>=0;i--){ txts[i].t+=dt; if(txts[i].t>=txts[i].max) txts.splice(i,1); }
  }

  /* ---- 打中人 ---- */
  // lvl：0 輕、1 重、2 擊飛、3 大絕。launch 是往上的速度，kb 是往後的速度。
  function hurt(tg,by,dmg,kb,launch,lvl){
    if(tg.inv>0||tg.state==='dead'||tg.gone||tg.hp<=0) return false;
    const armor=tg.kind==='big'&&lvl===0&&tg.state!=='hurt'&&tg.hp-dmg>0||tg.kind==='boss'&&tg.state==='spin';
    tg.hp-=dmg; const dir=by?(tg.x>=by.x?1:-1):1;
    if(tg.held){ const g=E.find(e=>e.grab===tg); if(g){ g.grab=null; g.state='idle'; } tg.held=false; }
    if(tg.grab){ tg.grab.held=false; tg.grab.state='hurt'; tg.grab.st=.3; tg.grab=null; }
    if(tg.hp<=0||launch>0){ if(!armor||tg.hp<=0){ tg.state='air'; tg.vx=dir*kb; tg.vz=Math.max(launch,tg.hp<=0?170:launch); tg.z=Math.max(tg.z,2); tg.atk=null; } }
    else if(!armor){ if(tg.state!=='down'){ tg.state='hurt'; tg.st=.26+(lvl?.12:0); tg.atk=null; } tg.vx=dir*kb; }
    if(tg.state==='down') tg.st=Math.max(tg.st,.45);
    if(tg.hero){ tg.seq=''; tg.combo=0; tg.run=false; }
    fxEvent('#h|'+Math.round((tg.x+(by?by.x:tg.x))/2)+'|'+Math.round(tg.y-tg.z-24)+'|'+lvl); sfx(lvl>=2?'boom':'hurt'); freeze=Math.max(freeze,lvl>=2?.09:.045);
    if(by&&by.hero){ by.combo++; by.comboT=1.4; }
    return true;
  }
  function strike(e,reach,depth,dmg,kb,launch,lvl,multi){
    let n=0; for(const q of E){ if(q===e||q.hero===e.hero||q.gone||q.state==='dead') continue; if(q.state==='air'&&q.z>44||q.hero&&q.state==='down') continue;
      const dx=(q.x-e.x)*e.face; if(dx<-8||dx>reach+10*(q.sc||1)||Math.abs(q.y-e.y)>depth) continue;
      if(q.state==='down'){ if(q.z>0) continue; if(hurt(q,e,Math.min(dmg,5),20,0,0)) n++; } else if(hurt(q,e,dmg,kb,launch,lvl)) n++;
      if(!multi&&n) break; }
    return n;
  }

  /* ---- 主角的招式 ---- */
  const MOVE={ // dur 總長、at 出拳的時間點、can 之後可以接下一招
    a:{pose:P.jab,dur:.2,at:.07,can:.12,dmg:4,kb:26,reach:28,lvl:0},
    s:{pose:P.heavy,dur:.36,at:.17,can:.26,dmg:8,kb:70,reach:32,lvl:1},
    chop:{pose:P.chop,dur:.34,at:.14,can:.22,dmg:11,kb:50,reach:32,lvl:1,name:'手刀'},
    up:{pose:P.upper,dur:.44,at:.14,can:.4,dmg:12,kb:60,launch:250,reach:28,lvl:2,name:'上勾拳'},
    fin7:{pose:P.heavy,dur:.5,at:.2,can:.5,dmg:16,kb:200,launch:190,reach:36,lvl:3,name:'七連擊！'},
    fin10:{pose:P.upper,dur:.6,at:.2,can:.6,dmg:26,kb:240,launch:300,reach:38,lvl:3,name:'十連擊！！'},
    bat:{pose:P.heavy,dur:.34,at:.15,can:.26,dmg:13,kb:110,launch:120,reach:46,lvl:2},
    gnd:{pose:P.chop,dur:.3,at:.12,can:.22,dmg:5,kb:10,reach:26,lvl:0}
  };
  function startMove(h,id){ const m=MOVE[id];
    // 前面沒人、背後有人貼著時，自動轉身
    const near=d=>E.some(q=>!q.hero&&!q.gone&&q.state!=='dead'&&Math.abs(q.y-h.y)<15&&(q.x-h.x)*d>-4&&(q.x-h.x)*d<44); if(!near(h.face)&&near(-h.face)) h.face=-h.face; h.atk={id,m,t:0,hit:false}; h.state='atk'; if(m.name) fxEvent('#t|'+Math.round(h.x)+'|'+Math.round(h.y-70)+'|0|'+m.name); sfx('land'); }
  function press(h,k){ // 依照按下去的順序決定出哪一招
    const other=k==='a'?h.lastS:h.lastA; if(k==='a') h.lastA=t; else h.lastS=t;
    if(t-other<.09&&h.state==='atk'&&h.atk.t<.1&&h.atk.id!=='up'){ h.seq=''; startMove(h,'up'); return; } // a+s 同時按
    if(t-h.seqT>.62) h.seq=''; h.seq+=k; h.seqT=t; if(h.seq.length>10) h.seq=k;
    if(h.weapon==='bat'){ startMove(h,'bat'); if(--h.wuse<=0){ h.weapon=null; fxEvent('#t|'+Math.round(h.x)+'|'+Math.round(h.y-60)+'|0|球棒斷了'); } return; }
    const near=E.some(q=>!q.hero&&!q.gone&&q.state==='down'&&q.z===0&&Math.abs(q.x-h.x)<30&&Math.abs(q.y-h.y)<14),stand=E.some(q=>!q.hero&&!q.gone&&q.state!=='down'&&q.state!=='air'&&(q.x-h.x)*h.face>-6&&(q.x-h.x)*h.face<40&&Math.abs(q.y-h.y)<14);
    if(near&&!stand){ h.seq=''; startMove(h,'gnd'); return; }                                      // 倒地補擊
    if(h.seq==='asaaaaasss'){ h.seq=''; startMove(h,'fin10'); }
    else if(h.seq==='aaaasss'){ h.seq=''; startMove(h,'fin7'); }
    else if(h.seq==='asa') startMove(h,'chop');
    else startMove(h,k);
  }
  function pickItem(h){ for(const it of items){ if(it.gone||it.held||it.fly||it.type==='food') continue; if(Math.abs(it.x-h.x)<18&&Math.abs(it.y-h.y)<12&&it.z<6){ it.held=true; it.gone=true; h.weapon=it.type; h.wuse=it.type==='bat'?9:1; sfx('item'); return true; } } return false; }
  function throwItem(h,lob){ const type=h.weapon; h.weapon=null; items.push({id:nid++,x:h.x+h.face*14,y:h.y,z:lob?44:30,vx:h.face*(lob?190:300),vy:0,vz:lob?300:60,type,held:false,fly:1,by:h.id,gone:false,bn:0}); h.atk={id:'toss',m:{pose:P.toss,dur:.3,at:9,can:.3},t:0,hit:true}; h.state='atk'; sfx('place'); if(lob) fxEvent('#t|'+Math.round(h.x)+'|'+Math.round(h.y-70)+'|0|投籃！'); }
  function stepHero(h,o,dt){
    if(h.inv>0) h.inv-=dt; if(h.comboT>0){ h.comboT-=dt; if(h.comboT<=0) h.combo=0; }
    if(h.dead) return;
    if(h.state==='air'){ h.vz-=720*dt; h.z+=h.vz*dt; h.x+=h.vx*dt; if(h.z<=0){ h.z=0; h.state='down'; h.st=h.hp<=0?1.2:.7; sfx('bump'); } }
    else if(h.state==='down'){ h.st-=dt; if(h.st<=0){ if(h.hp<=0){ h.dead=true; h.state='dead'; } else { h.state='getup'; h.st=.3; } } }
    else if(h.state==='getup'){ h.st-=dt; if(h.st<=0){ h.state='idle'; h.inv=1; } }
    else if(h.state==='hurt'){ h.st-=dt; h.x+=h.vx*dt; h.vx*=Math.exp(-8*dt); if(h.st<=0) h.state='idle'; }
    else if(h.state==='grab'){ // 抓著人：連打四下，或加方向丟出去
      const g=h.grab; if(!g||g.gone||g.state!=='held'){ h.grab=null; h.state='idle'; return; }
      g.x=h.x+h.face*17; g.y=h.y+.1; g.z=6; h.st-=dt;
      if(o.a||o.s){ if(o.mx){ g.held=false; g.state='air'; g.thrown=h.id; g.vx=o.mx*270; g.vz=190; g.hp-=6; h.grab=null; h.face=o.mx; h.atk={id:'toss',m:{pose:P.toss,dur:.3,at:9,can:.3},t:0,hit:true}; h.state='atk'; sfx('place'); fxEvent('#t|'+Math.round(h.x)+'|'+Math.round(h.y-70)+'|0|丟！'); }
        else { h.gh++; hurt(g,null,5,0,0,h.gh>=4?2:0); h.combo++; h.comboT=1.4; g.held=true; g.state='held'; h.grab=g; h.state='grab'; if(h.gh>=4||g.hp<=0){ g.held=false; g.state='air'; g.vx=h.face*150; g.vz=200; h.grab=null; h.state='idle'; } } }
      else if(h.st<=0){ g.held=false; g.state='hurt'; g.st=.3; h.grab=null; h.state='idle'; }
    }
    else if(h.state==='rise'){ h.vz-=720*dt; h.z+=h.vz*dt; h.x+=h.face*90*dt; if(!h.atk.hit&&h.z>8){ if(strike(h,30,16,14,80,280,2,true)) h.atk.hit=true; } if(h.z<=0&&h.vz<0){ h.z=0; h.state='idle'; h.atk=null; } }
    else if(h.state==='spin'){ // 旋轉地獄車：連按 s 可以轉更久
      h.spinT-=dt; h.st+=dt; h.x+=h.face*175*dt; if(o.s&&h.st<1.5) h.spinT=Math.min(h.spinT+.26,.45);
      if(h.st-h.lastHit>.14){ h.lastHit=h.st; strike(h,26,18,4,40,h.spinT<=.05?200:0,h.spinT<=.05?2:0,true); }
      if(h.spinT<=0){ h.state='idle'; h.atk=null; }
    }
    else {
      if(h.state==='atk'){ const a=h.atk,m=a.m; a.t+=dt; if(!a.hit&&a.t>=m.at){ a.hit=true; strike(h,m.reach,15,m.dmg,m.kb,m.launch||0,m.lvl,a.id==='bat'||m.lvl>=3); }
        if(a.t>=m.dur){ h.state='idle'; h.atk=null; }
        else if(a.t<.1&&(a.id==='a'&&o.s||a.id==='s'&&o.a)){ h.seq=''; h.buf=null; startMove(h,'up'); return clampHero(h); } // 輕重幾乎同時按：上勾拳
        else if(a.t<m.can){ if(o.a) h.buf='a'; else if(o.s) h.buf='s'; return clampHero(h); } }
      const k=o.a?'a':o.s?'s':h.buf; h.buf=null;
      if(o.a&&o.s&&!h.weapon&&!h.run){ h.seq=''; startMove(h,'up'); return clampHero(h); }
      if(k){
        if(h.weapon==='ball'||h.weapon==='can'){ throwItem(h,h.weapon==='ball'&&o.up); return clampHero(h); }
        if(h.run&&h.state!=='atk'){ h.run=false; if(k==='a'){ h.state='rise'; h.vz=290; h.z=1; h.atk={id:'rise',t:0,hit:false}; fxEvent('#t|'+Math.round(h.x)+'|'+Math.round(h.y-70)+'|0|升龍拳'); sfx('boost'); }
          else { h.state='spin'; h.spinT=.4; h.st=0; h.lastHit=-1; h.atk={id:'spin',t:0}; fxEvent('#t|'+Math.round(h.x)+'|'+Math.round(h.y-70)+'|0|旋轉地獄車'); sfx('boost'); } return clampHero(h); }
        if(!h.weapon&&pickItem(h)) return clampHero(h);
        press(h,k); return clampHero(h);
      }
      if(h.state!=='atk'){
        h.run=o.run&&!!o.mx; const sp=h.run?150:78; h.x+=o.mx*sp*dt; h.y+=o.my*52*dt; if(o.mx) h.face=o.mx; h.moving=!!(o.mx||o.my);
        if(o.mx&&!h.run) for(const q of E){ if(q.hero||q.gone||q.kind==='boss'||q.kind==='big'&&q.hp>20) continue; if((q.state==='idle'||q.state==='walk'||q.state==='wind')&&Math.abs(q.y-h.y)<9&&(q.x-h.x)*h.face>6&&(q.x-h.x)*h.face<17){ h.state='grab'; h.grab=q; h.gh=0; h.st=1.6; q.state='held'; q.held=true; q.atk=null; sfx('click'); break; } } // 走過去貼到就抓住
      }
    }
    clampHero(h);
  }
  function clampHero(h){ const lo=lock?lock.x0:cam+12,hi=lock?lock.x1:Math.min(ST.len-14,cam+W-12); h.x=clamp(h.x,Math.max(12,lo),hi); h.y=clamp(h.y,YB+6,YF-2); }

  /* ---- 敵人 ---- */
  function spawn(kind,x,y){ const boss=/^boss/.test(kind),lvB=boss?+kind.slice(4):0,k=boss?'boss':kind,K=KIND[k];
    const e={id:nid++,hero:false,kind:k,x,y,z:0,vx:0,vy:0,vz:0,face:-1,hp:boss?K.hp*(.6+lvB*.18):K.hp*(1+si*.12),max:0,state:'idle',st:0,pose:0,ph:0,sc:K.sc*(boss?.95+lvB*.06:1),tint:boss?['#ff5d8f','#e0a030','#3ddbd9','#86dc4f','#ffd23f'][lvB-1]:{kid:'#e23b3b',fast:'#3ddbd9',big:'#5fd068',ball:'#ffd23f'}[k],
      cd:.6+rnd()*1.2,atk:null,slot:rnd()*6.283,gone:false,held:false,boss,name:boss?['胖老大','滑板王','籃球隊長','夜市小霸王','街舞小子'][lvB-1]:K.name,dz:0,fade:0};
    e.max=e.hp; E.push(e); return e; }
  function stepFoe(e,dt){
    const K=KIND[e.kind];
    if(e.state==='dead'){ e.fade+=dt; if(e.fade>.8) e.gone=true; return; }
    if(e.state==='held') return;
    if(e.state==='air'){ e.vz-=720*dt; e.z+=e.vz*dt; e.x+=e.vx*dt; e.x=clamp(e.x,cam-30,cam+W+30);
      if(e.thrown!=null) for(const q of E){ if(q===e||q.hero||q.gone||q.state==='air'||q.state==='down'||q.state==='dead') continue; if(Math.abs(q.x-e.x)<18&&Math.abs(q.y-e.y)<14&&e.z<40){ hurt(q,e,10,120,170,2); } }
      if(e.z<=0){ e.z=0; if(e.thrown!=null){ e.hp-=8; e.thrown=null; fxEvent('#h|'+Math.round(e.x)+'|'+Math.round(e.y-8)+'|1'); } e.state='down'; e.st=e.hp<=0?.7:1; sfx('bump'); } return; }
    if(e.state==='down'){ e.st-=dt; if(e.st<=0){ if(e.hp<=0){ e.state='dead'; e.fade=0; } else { e.state='getup'; e.st=.3; } } return; }
    if(e.state==='getup'){ e.st-=dt; if(e.st<=0){ e.state='idle'; e.cd=.5+rnd()*.6; } return; }
    if(e.state==='hurt'){ e.st-=dt; e.x+=e.vx*dt; e.vx*=Math.exp(-8*dt); if(e.st<=0){ e.state='idle'; e.cd=Math.max(e.cd,.25); } return; }
    const hs=heroes(); if(!hs.length){ e.state='idle'; return; }
    let tg=hs[0]; for(const h of hs) if(Math.abs(h.x-e.x)<Math.abs(tg.x-e.x)) tg=h;
    const dx=tg.x-e.x,dy=tg.y-e.y,adx=Math.abs(dx); e.cd-=dt;
    if(e.state==='spin'){ // 頭目的街舞旋轉：橫掃過去，轉完會暈一下
      e.st-=dt; e.x+=e.sdir*210*dt; e.y+=clamp(dy,-1,1)*30*dt; if(t-e.lastHit>.2) for(const h of hs) if(Math.abs(h.x-e.x)<26&&Math.abs(h.y-e.y)<16&&h.state!=='down'&&h.state!=='air'){ if(hurt(h,e,K.dmg,120,190,2)) e.lastHit=t; }
      if(e.st<=0||e.x<cam+16||e.x>cam+W-16){ e.state='hurt'; e.st=.9; e.vx=0; e.cd=1.2; } return; }
    if(e.state==='wind'){ e.st-=dt; if(e.st<=0){ e.state='atk'; e.atk={t:0,hit:false}; } return; }
    if(e.state==='atk'){ e.atk.t+=dt; if(e.lunge){ e.x+=e.face*240*dt; } if(!e.atk.hit&&e.atk.t>.08){ if(strike(e,e.lunge?22:24*e.sc,13,K.dmg,e.kind==='big'?150:60,e.kind==='big'?180:0,e.kind==='big'?2:1)) e.atk.hit=true; else if(!e.lunge) e.atk.hit=true; }
      if(e.atk.t>(e.lunge?.34:.3)){ e.state='idle'; e.atk=null; e.lunge=false; e.cd=.7+rnd()*1.1-si*.06; } return; }
    e.face=dx>=0?1:-1; e.state='idle';
    // 最多兩個人同時圍上來，其他人在外圍繞
    const order=foes().filter(q=>q.state!=='dead'&&q.kind!=='ball').sort((a,b)=>Math.abs(a.x-tg.x)-Math.abs(b.x-tg.x)).indexOf(e),engage=e.boss||order<2;
    if(e.kind==='ball'){ const want=tg.x-Math.sign(dx||1)*140,mvx=clamp(want-e.x,-1,1),mvy=clamp(dy,-1,1); if(Math.abs(want-e.x)>10){ e.x+=mvx*K.spd*dt; e.state='walk'; } if(Math.abs(dy)>6) e.y+=mvy*40*dt;
      if(e.cd<=0&&Math.abs(dy)<10){ e.cd=1.8+rnd()*1.2; items.push({id:nid++,x:e.x+e.face*12,y:e.y,z:26,vx:e.face*230,vy:0,vz:40,type:'rock',held:false,fly:2,gone:false,bn:0,dmg:K.dmg}); sfx('place'); e.state='atk'; e.atk={t:.1,hit:true}; } }
    else if(engage){ const reach=22*e.sc; if(adx>reach||Math.abs(dy)>7){ e.x+=clamp(dx-Math.sign(dx)*(reach-4),-1,1)*K.spd*dt; e.y+=clamp(dy,-1,1)*K.spd*.6*dt; e.state='walk'; }
      if(e.cd<=0){ if(e.boss&&adx>70&&rnd()<.6){ e.state='spin'; e.st=1.3; e.sdir=dx>=0?1:-1; e.lastHit=0; sfx('boost'); fxEvent('#t|'+Math.round(e.x)+'|'+Math.round(e.y-70)+'|0|'+e.name+'的旋風！'); }
        else if(e.kind==='fast'&&adx>50&&adx<130&&Math.abs(dy)<10){ e.state='wind'; e.st=.22; e.lunge=true; }
        else if(adx<=reach+4&&Math.abs(dy)<9){ e.state='wind'; e.st=e.kind==='big'?.42:.26; } } }
    else { const ang=e.slot+t*.5,wx=tg.x+Math.cos(ang)*(90+order*14),wy=tg.y+Math.sin(ang)*30; e.x+=clamp(wx-e.x,-1,1)*K.spd*.6*dt; e.y+=clamp(wy-e.y,-1,1)*30*dt; e.state='walk'; }
    e.x=clamp(e.x,cam+8,cam+W-8); e.y=clamp(e.y,YB+6,YF-2);
  }
  function stepItems(dt){
    for(const it of items){ if(it.gone&&!it.fly) continue;
      if(it.fly){ it.vz-=620*dt; it.x+=it.vx*dt; it.z+=it.vz*dt;
        for(const q of E){ if(q.gone||q.state==='dead'||q.state==='down') continue; if((it.fly===1)===q.hero) continue; if(Math.abs(q.x-it.x)<14*(q.sc||1)&&Math.abs(q.y-it.y)<13&&it.z<46*(q.sc||1)){ const d=it.type==='can'?16:it.type==='ball'?12:it.dmg||6; hurt(q,{x:it.x-it.vx,hero:it.fly===1,id:it.by},d,130,it.type==='rock'?0:180,it.type==='rock'?1:2); if(it.fly===1&&E[it.by]){ E[it.by].combo++; E[it.by].comboT=1.4; } it.vx*=-.3; it.vz=160; if(it.type!=='ball'){ it.fly=0; it.gone=true; puff(it.x,it.y-it.z,8,'#9aa0b0',120,.4,3); } break; } }
        if(it.z<=0){ it.z=0; if(it.type==='ball'&&it.bn<3&&Math.abs(it.vx)>40){ it.bn++; it.vz=-it.vz*.6; it.vx*=.8; } else { it.fly=0; it.gone=it.type!=='ball'; it.vx=0; it.held=false; if(it.type==='ball'){ it.gone=false; } } }
        if(it.x<cam-40||it.x>cam+W+40){ it.fly=0; it.gone=true; } }
      else if(it.type==='food') for(const h of heroes()) if(Math.abs(h.x-it.x)<16&&Math.abs(h.y-it.y)<12&&h.hp<h.max){ h.hp=Math.min(h.max,h.hp+35); it.gone=true; sfx('item'); fxEvent('#t|'+Math.round(h.x)+'|'+Math.round(h.y-70)+'|0|補血 +35'); break; }
    }
  }
  function poseOf(e){
    const s=e.state; if(s==='air') return [P.air,0]; if(s==='down'||s==='dead') return [P.down,0]; if(s==='getup') return [P.getup,1-e.st/.3]; if(s==='hurt') return [P.hurt,0]; if(s==='held') return [P.held,0];
    if(e.hero){ if(s==='grab') return [P.grab,0]; if(s==='rise') return [P.rise,Math.min(1,e.z/50)]; if(s==='spin') return [P.spin,e.st]; if(s==='atk') return [e.atk.m.pose,e.atk.t/e.atk.m.dur]; return e.moving?[e.run?P.run:P.walk,t*(e.run?3:2)]:[P.idle,t*.8]; }
    if(s==='spin') return [P.dance,t]; if(s==='wind') return [P.wind,0]; if(s==='atk') return [P.jab,e.atk.t/.3]; if(s==='walk') return [P.walk,t*2+e.id]; return [P.idle,0];
  }

  function conclude(win,note){
    if(ended) return; ended=true; env.sfx(win?'win':'lose');
    env.end({title:win?'過關！':'被打敗了',big:ST.name,text:note||(win?'把'+(si===STAGES.length-1?'街舞小子':'這一關的頭目')+'打倒了。':'再試一次吧。'),score:win&&!net?si+1:null,next:win&&!net&&si<STAGES.length-1});
  }
  function snapshot(){
    const m={s:1,c:Math.round(cam),w:wave,g:goT>0?1:0,lk:lock?1:0,
      e:E.filter(e=>!e.gone).map(e=>{ const p=poseOf(e); return [e.id,e.hero?0:['kid','fast','big','ball','boss'].indexOf(e.kind)+1,Math.round(e.x),Math.round(e.y),Math.round(e.z),e.face,p[0],Math.round(p[1]*100)/100,Math.max(0,Math.ceil(e.hp)),Math.round(e.max),e.hero?(e.weapon||''):e.tint,e.hero?e.combo:Math.round(e.sc*100),e.state==='dead'?Math.round(e.fade*10):0,e.hero?(e.dead?1:0):(e.boss?e.name:'')]; }),
      i:items.filter(i=>!i.gone||i.fly).map(i=>[i.id,i.type,Math.round(i.x),Math.round(i.y),Math.round(i.z)]),v:ev};
    ev=[]; return m;
  }
  let view=null; // 另一邊收到的畫面
  if(net){
    if(client) net.onmsg=m=>{ if(m.s){ view=m; for(const n of m.v){ if(n[0]==='#') fxEvent(n,true); else env.sfx(n); } } else if(m.end) conclude(!!m.end[0],m.end[1]); };
    else { net.onmsg=(m,from)=>{ if(from!==1||!m.i) return; const o=inp[1]; o.mx=m.i[0]; o.my=m.i[1]; o.run=!!m.i[2]; o.up=m.i[1]<0; if(m.i[3]) o.a=true; if(m.i[4]) o.s=true; };
      net.onleave=i=>{ const h=E[1]; if(i===1&&h&&h.hero){ h.dead=true; h.state='dead'; } }; }
  }

  function update(dt){
    t+=dt; stepFx(dt);
    if(client){ const o=inp[0]; read(0,0); const key=''+o.mx+o.my+(+o.run);
      if(key!==lastIn||o.a||o.s){ lastIn=key; net.send({i:[o.mx,o.my,+o.run,+o.a,+o.s]}); } o.a=o.s=false; return; }
    if(ended) return;
    if(two){ read(0,1); read(1,2); } else read(0,0);
    const push=()=>{ if(net){ sendT-=dt; if(sendT<=0){ sendT=1/24; net.send(snapshot()); } } };
    if(intro>0){ intro-=dt; push(); return; }
    if(freeze>0){ freeze-=dt; push(); return; }
    if(slow>0){ slow-=dt; dt*=.35; }
    if(goT>0) goT-=dt;
    for(const e of E){ if(e.gone) continue; if(e.hero){ const o=inp[e.id]; stepHero(e,o,dt); o.a=o.s=false; } else stepFoe(e,dt); }
    stepItems(dt);
    // 捲軸與敵人一波一波出來
    const hs=heroes(); if(!hs.length){ clearT+=dt; if(clearT>1.2){ if(net) { net.send(snapshot()); net.send({end:[0,'']}); } conclude(false); } push(); return; }
    const lead=Math.max.apply(null,hs.map(h=>h.x));
    if(!lock){ cam+=(clamp(lead-W*.42,0,ST.len-W)-cam)*Math.min(1,dt*5);
      if(wave<ST.waves.length&&lead>=ST.waves[wave][0]){ const wv=ST.waves[wave],x0=clamp(wv[0]-W*.42,0,ST.len-W); cam=cam+(x0-cam)*.5; lock={x0:x0+12,x1:x0+W-12};
        wv[1].forEach((k,i)=>spawn(k,i%2?x0-20-i*12:x0+W+20+i*14,YB+20+((i*29)%70))); wave++; if(/^boss/.test(wv[1][0])){ sfx('boom'); flash=.2; } } }
    else { cam+=(lock.x0-12-cam)*Math.min(1,dt*5); if(!foes().length){ lock=null; if(wave>=ST.waves.length){ clearT+=dt; } else { goT=2.2; sfx('lap'); } } }
    if(wave>=ST.waves.length&&!foes().length){ clearT+=dt; if(clearT>1.4){ if(net){ net.send(snapshot()); net.send({end:[1,'']}); } conclude(true); } }
    push();
  }

  function draw(){
    const V=client&&view?view:null,camX=V?V.c:cam;
    ctx.save(); if(shake>0) ctx.translate((rnd()-.5)*shake*20,(rnd()-.5)*shake*14);
    drawScene(ctx,ST.bg,camX,t);
    const list=[];
    if(V){ for(const a of V.e) list.push({hero:a[1]===0,kind:['','kid','fast','big','ball','boss'][a[1]],id:a[0],x:a[2],y:a[3],z:a[4],face:a[5],pose:a[6],ph:a[7],hp:a[8],max:a[9],w:a[10],k:a[11],fade:a[12],nm:a[13]});
      for(const i of V.i) list.push({item:i[1],x:i[2],y:i[3],z:i[4]}); }
    else { for(const e of E){ if(e.gone) continue; const p=poseOf(e); list.push({hero:e.hero,kind:e.kind,id:e.id,x:e.x,y:e.y,z:e.z,face:e.face,pose:p[0],ph:p[1],hp:e.hp,max:e.max,w:e.hero?e.weapon:e.tint,k:e.hero?e.combo:e.sc*100,fade:e.state==='dead'?e.fade*10:0,nm:e.hero?(e.dead?1:0):(e.boss?e.name:''),inv:e.inv}); }
      for(const i of items) if(!i.gone||i.fly) list.push({item:i.type,x:i.x,y:i.y,z:i.z}); }
    list.sort((a,b)=>a.y-b.y);
    for(const o of list){ const x=o.x-camX;
      if(o.item){ ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x,o.y,8,3,0,0,7); ctx.fill(); const y=o.y-o.z;
        if(o.item==='bat') shape(ctx,'#d9a45c',()=>ctx.rect(x-12,y-4,24,5)); else if(o.item==='ball') shape(ctx,'#ff9d3d',()=>ctx.arc(x,y-6,6,0,7)); else if(o.item==='can'){ shape(ctx,'#9aa0b0',()=>ctx.rect(x-8,y-20,16,20)); shape(ctx,'#7a7f90',()=>ctx.rect(x-10,y-23,20,4)); }
        else if(o.item==='rock') shape(ctx,'#ffd23f',()=>ctx.arc(x,y,4,0,7)); else { shape(ctx,'#e8a030',()=>ctx.ellipse(x,y-8,9,5,0,Math.PI,0)); shape(ctx,'#7a3b1d',()=>ctx.rect(x-9,y-8,18,3)); shape(ctx,'#e8a030',()=>ctx.rect(x-9,y-5,18,4)); } continue; }
      if(o.hero){ if(o.nm===1) continue; drawHero(ctx,x,o.y,o.z,o.face,o.pose,o.ph,hcol(o.id),o.id===1?1.16:1,o.w,o.inv>0&&Math.floor(t*14)%2?.45:1);
        if(np>1){ ctx.fillStyle=o.id?'#3ddbd9':'#ffd23f'; ctx.beginPath(); ctx.moveTo(x-5,o.y-o.z-66); ctx.lineTo(x+5,o.y-o.z-66); ctx.lineTo(x,o.y-o.z-60); ctx.fill(); } }
      else drawKid(ctx,x,o.y,o.z,o.face,o.pose,o.ph,o.kind,o.w,o.k/100,o.fade?Math.max(0,1-o.fade/8):1);
    }
    ctx.save(); ctx.translate(-camX,0);
    for(const f of fx){ ctx.globalAlpha=Math.max(0,f.life/f.max); ctx.fillStyle=f.col; const z=f.size*(.5+f.life/f.max*.5); ctx.fillRect(f.x-z/2,f.y-z/2,z,z); } ctx.globalAlpha=1;
    for(const r of rings){ const u=r.t/r.max; ctx.globalAlpha=1-u; ctx.fillStyle=r.col; ctx.beginPath(); for(let i=0;i<16;i++){ const a=i*.3927,rr=(i%2?r.r*.45:r.r)*(.4+u*.8); ctx[i?'lineTo':'moveTo'](r.x+Math.cos(a)*rr,r.y+Math.sin(a)*rr); } ctx.closePath(); ctx.fill(); ctx.strokeStyle=INK; ctx.lineWidth=2; ctx.stroke(); }
    ctx.globalAlpha=1; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineJoin='round';
    for(const s of txts){ const u=s.t/s.max; ctx.globalAlpha=1-u*u; ctx.font='900 '+(s.big?20:14)+'px '+TC; ctx.lineWidth=4; ctx.strokeStyle=INK; ctx.strokeText(s.s,s.x,s.y-u*18); ctx.fillStyle=s.col||(s.big?'#ffd23f':'#fff'); ctx.fillText(s.s,s.x,s.y-u*18); }
    ctx.globalAlpha=1; ctx.restore(); ctx.restore();
    if(flash>0){ ctx.fillStyle='rgba(255,255,255,'+Math.min(.7,flash*5)+')'; ctx.fillRect(0,0,W,H); }
    // 體力列
    const hl=list.filter(o=>o.hero).sort((a,b)=>a.id-b.id);
    hl.forEach((o,i)=>{ const x=8+i*160; ctx.fillStyle='rgba(11,10,28,.75)'; ctx.fillRect(x,6,150,24); shape(ctx,hcol(o.id),()=>ctx.arc(x+13,18,9,0,7)); shape(ctx,'#f3ead8',()=>ctx.ellipse(x+14,18,5,6.5,0,0,7));
      ctx.fillStyle='#2b2759'; ctx.fillRect(x+28,11,114,9); ctx.fillStyle=o.hp/o.max>.4?'#86dc4f':'#ff5d8f'; ctx.fillRect(x+28,11,114*clamp(o.hp/o.max,0,1),9); ctx.strokeStyle=INK; ctx.lineWidth=1.5; ctx.strokeRect(x+28,11,114,9);
      ctx.font='700 9px '+TC; ctx.textAlign='left'; ctx.fillStyle='#fff'; ctx.fillText((np>1?(o.id+1)+'P ':'')+(o.w==='bat'?'拿著球棒':o.w==='ball'?'拿著籃球（上+輕＝投籃）':o.w==='can'?'舉著垃圾桶':''),x+28,25);
      if(o.k>1){ ctx.textAlign='left'; ctx.font='18px '+PIX; ctx.lineWidth=5; ctx.strokeStyle=INK; const s=o.k+' HITS'; ctx.strokeText(s,x+4,50); ctx.fillStyle='#ffd23f'; ctx.fillText(s,x+4,50); } });
    const boss=list.find(o=>!o.hero&&!o.item&&o.nm); if(boss){ ctx.fillStyle='rgba(11,10,28,.75)'; ctx.fillRect(W-170,6,162,24); ctx.font='700 10px '+TC; ctx.textAlign='right'; ctx.fillStyle='#fff'; ctx.fillText(boss.nm,W-14,25); ctx.fillStyle='#2b2759'; ctx.fillRect(W-164,11,150,9); ctx.fillStyle='#ff5d4f'; ctx.fillRect(W-164,11,150*clamp(boss.hp/boss.max,0,1),9); ctx.strokeStyle=INK; ctx.lineWidth=1.5; ctx.strokeRect(W-164,11,150,9); }
    else { ctx.textAlign='right'; ctx.font='700 11px '+TC; ctx.lineWidth=4; ctx.strokeStyle=INK; const s='第 '+(si+1)+' 關　'+ST.name; ctx.strokeText(s,W-10,18); ctx.fillStyle='#fff'; ctx.fillText(s,W-10,18); }
    if((V?V.g:goT>0)&&Math.floor(t*4)%2){ ctx.textAlign='right'; ctx.font='20px '+PIX; ctx.lineWidth=6; ctx.strokeStyle=INK; ctx.strokeText('GO →',W-14,150); ctx.fillStyle='#ffd23f'; ctx.fillText('GO →',W-14,150); }
    if(intro>0){ ctx.textAlign='center'; ctx.font='900 30px '+TC; ctx.lineWidth=7; ctx.strokeStyle=INK; const s='第 '+(si+1)+' 關　'+ST.name; ctx.strokeText(s,W/2,120); ctx.fillStyle='#ffd23f'; ctx.fillText(s,W/2,120); }
  }
  return {update,draw,destroy(){},_dbg:{E,items,inp,get wave(){return wave;},get cam(){return cam;},spawn,hurt,foes}};
}

function preview(ctx,w,h,L,t){
  ctx.save(); ctx.scale(w/W,w/W); ctx.translate(0,-60); drawScene(ctx,'alley',t*20,t);
  const u=(t%1.2)/1.2; drawHero(ctx,190,240,0,1,u<.5?P.jab:P.heavy,(u*2)%1,L.color,1.5,null); drawKid(ctx,270,240,0,-1,u>.6?P.hurt:P.idle,0,'kid','#e23b3b',1.3); ctx.restore();
}
function thumb(ctx,w,h,t){
  ctx.save(); ctx.scale(w/W,w/W); ctx.translate(0,-30); drawScene(ctx,'alley',t*24,t);
  const u=(t%1.6)/1.6; drawKid(ctx,330,232,u>.45?Math.sin((u-.45)/.55*Math.PI)*46:0,-1,u>.45?P.air:P.wind,0,'kid','#e23b3b',1.1); drawKid(ctx,400,250,0,-1,P.walk,t*2,'fast','#3ddbd9',1); drawKid(ctx,120,256,0,1,P.down,0,'ball','#ffd23f',1);
  drawHero(ctx,250,238,0,1,u<.45?P.heavy:P.upper,u<.45?u/.45:(u-.45)/.55,'#8a5ad6',1.25,null);
  if(u>.45&&u<.7){ ctx.fillStyle='#ffd23f'; ctx.beginPath(); for(let i=0;i<16;i++){ const a=i*.3927,r=(i%2?10:22); ctx[i?'lineTo':'moveTo'](300+Math.cos(a)*r,196+Math.sin(a)*r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle=INK; ctx.lineWidth=2; ctx.stroke(); }
  ctx.restore();
}

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).purple={
  name:'紫色風暴',tag:'BEAT EM UP',color:'#b98cff',online:true,maxPlayers:2,
  desc:'橫向捲軸的打鬥過關遊戲，招式表參考經典的「紫色恐怖」：連擊、上勾拳、升龍拳、旋轉地獄車、抓人丟出去、撿武器。5 個場景，可單人、兩人合作或連線合作。',
  goal:'一路往右打倒所有對手，最後打敗頭目。輕、重拳照順序按可以打出連段，跑步中出拳是特殊招式，貼近對手會抓住他。',
  stages:STAGES.map(s=>s.name),stars:[1,2,3,4,5],
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人合作',kb:true}],
  help:[['↑ ↓ ← →','移動，連按兩下 ← → 跑步'],['A','輕拳（或 J）'],['S','重拳（或 K）'],['A S A','手刀'],['A A A A S S S','七連擊'],['A S A A A A A S S S','十連擊'],['A+S','一起按：上勾拳'],['跑步+A','升龍拳'],['跑步+S','旋轉地獄車，連按轉更久'],['W A S D F G','雙人 1P：移動、輕、重'],['↑ ↓ ← → , .','雙人 2P：移動、輕、重']],
  touchHelp:[['方向盤','移動，同方向點兩下跑步'],['輕、重','照順序按出連段：輕重輕＝手刀，輕輕輕輕重重重＝七連擊'],['跑步+輕','升龍拳'],['跑步+重','旋轉地獄車'],['貼近對手','抓住後連打，或加方向丟出去']],
  touch:{left:'dpad',right:[{l:'輕',c:'KeyJ'},{l:'重',c:'KeyK',act:true}]},
  looks:[{key:'color',label:'衣服顏色',type:'color',opts:['#8a5ad6','#d65a9a','#5a7ad6','#3fae8a','#d6a03a','#d65a5a','#5ab8d6','#6b6b7a']}],
  best:{label:'已過關',fmt:v=>v+' / '+STAGES.length,lower:false},
  preview,thumb,create
};
})();
