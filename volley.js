// 海灘排球：一對一，球落在誰那邊對方就得分，先拿 11 分獲勝。
// 連線時房主負責運算（左邊），加入的人是右邊，只送出按鍵。
(function(){
'use strict';
const W=480,H=300,GROUND=268,NETX=240,NETW=8,NETTOP=178,PR=26,BR=17;
const PIX='"Press Start 2P","Noto Sans TC","Microsoft JhengHei",monospace';
const COL=[['#ff9d3d','#c96a14'],['#4f9dff','#1f5fc0']];
const r1=v=>Math.round(v*10)/10;

function shade(hex,k){ const n=parseInt(hex.slice(1),16); return 'rgb('+[(n>>16)&255,(n>>8)&255,n&255].map(v=>Math.round(v*k)).join(',')+')'; }
function drawCat(ctx,x,y,face,col,air,t,moving,animal){
  const bob=!air&&moving?Math.sin(t*18)*2:0,a=animal||'cat';
  ctx.fillStyle='rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x,GROUND+3,22,5,0,0,7); ctx.fill();
  // 尾巴
  if(a==='cat'){ ctx.strokeStyle=col[1]; ctx.lineWidth=6; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x-face*20,y-12); ctx.quadraticCurveTo(x-face*38,y-18,x-face*34,y-40); ctx.stroke(); }
  else if(a==='dog'){ ctx.strokeStyle=col[1]; ctx.lineWidth=7; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x-face*20,y-16); ctx.lineTo(x-face*33,y-30+Math.sin(t*14)*4); ctx.stroke(); }
  else { ctx.fillStyle=a==='rabbit'?'#fff':col[1]; ctx.beginPath(); ctx.arc(x-face*25,y-14,a==='rabbit'?8:6,0,7); ctx.fill(); }
  ctx.fillStyle=col[1]; ctx.fillRect(x-16,y-8+bob,11,8); ctx.fillRect(x+5,y-8-bob,11,8);
  // 耳朵
  ctx.fillStyle=col[0];
  if(a==='rabbit'){ ctx.beginPath(); ctx.ellipse(x-11,y-62,6,17,-.15,0,7); ctx.ellipse(x+11,y-62,6,17,.15,0,7); ctx.fill(); ctx.fillStyle='#ffc2d4'; ctx.beginPath(); ctx.ellipse(x-11,y-62,2.5,11,-.15,0,7); ctx.ellipse(x+11,y-62,2.5,11,.15,0,7); ctx.fill(); }
  else if(a==='bear'){ ctx.beginPath(); ctx.arc(x-18,y-47,9,0,7); ctx.arc(x+18,y-47,9,0,7); ctx.fill(); ctx.fillStyle=col[1]; ctx.beginPath(); ctx.arc(x-18,y-47,4,0,7); ctx.arc(x+18,y-47,4,0,7); ctx.fill(); }
  else if(a==='cat'){ ctx.beginPath(); ctx.moveTo(x-22,y-40); ctx.lineTo(x-17,y-62); ctx.lineTo(x-5,y-48); ctx.fill(); ctx.beginPath(); ctx.moveTo(x+22,y-40); ctx.lineTo(x+17,y-62); ctx.lineTo(x+5,y-48); ctx.fill(); }
  ctx.fillStyle=col[0]; ctx.beginPath(); ctx.ellipse(x,y-28,25,24,0,0,7); ctx.fill();
  if(a==='dog'){ ctx.fillStyle=col[1]; ctx.beginPath(); ctx.ellipse(x-23,y-34,7,15,.25,0,7); ctx.ellipse(x+23,y-34,7,15,-.25,0,7); ctx.fill(); }
  ctx.fillStyle='#fff3e0'; ctx.beginPath(); ctx.ellipse(x+face*5,y-20,14,12,0,0,7); ctx.fill();
  ctx.fillStyle='#14122b'; ctx.beginPath(); ctx.arc(x+face*2,y-34,3,0,7); ctx.arc(x+face*15,y-34,3,0,7); ctx.fill();
  ctx.fillStyle=a==='cat'||a==='rabbit'?'#ff5d8f':'#14122b'; ctx.beginPath(); ctx.arc(x+face*9,y-27,a==='bear'||a==='dog'?3.5:2.5,0,7); ctx.fill();
  if(air){ ctx.fillStyle=col[0]; ctx.fillRect(x+face*14,y-58,9,18); }
}
function drawBall(ctx,x,y,rot){
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot);
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,0,BR,0,7); ctx.fill();
  ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,BR,0,2.1); ctx.fill();
  ctx.fillStyle='#3d8bff'; ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,BR,2.1,4.2); ctx.fill();
  ctx.strokeStyle='#14122b'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,BR,0,7); ctx.stroke();
  ctx.restore();
}
function drawCourt(ctx,t){
  // 天空、太陽、雲
  const g=ctx.createLinearGradient(0,0,0,200); g.addColorStop(0,'#3fb4f5'); g.addColorStop(1,'#c9f0ff'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  const sg=ctx.createRadialGradient(406,46,6,406,46,60); sg.addColorStop(0,'rgba(255,250,200,1)'); sg.addColorStop(.35,'rgba(255,236,140,.9)'); sg.addColorStop(1,'rgba(255,236,140,0)'); ctx.fillStyle=sg; ctx.fillRect(330,0,150,120);
  ctx.fillStyle='#fff'; for(const [cx,cy,s] of [[70,50,1],[330,36,1.3],[430,78,.8]]){ const x=(cx+t*6*s)%(W+80)-40; ctx.beginPath(); ctx.arc(x,cy,14*s,0,7); ctx.arc(x+16*s,cy+4,11*s,0,7); ctx.arc(x-15*s,cy+5,10*s,0,7); ctx.fill(); }
  // 遠方的島和帆船
  ctx.fillStyle='#6aa8c8'; ctx.beginPath(); ctx.moveTo(150,197); ctx.quadraticCurveTo(205,168,262,197); ctx.fill();
  const bx=(t*8)%(W+60)-30; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(bx,192); ctx.lineTo(bx,174); ctx.lineTo(bx+12,192); ctx.fill(); ctx.fillStyle='#c9573f'; ctx.fillRect(bx-8,192,22,3);
  // 海
  ctx.fillStyle='#2f8fd6'; ctx.fillRect(0,196,W,40); ctx.fillStyle='#57b4ee'; for(let x=0;x<W;x+=40) ctx.fillRect((x+t*12)%W,204+((x/40)%2)*12,22,3);
  ctx.fillStyle='rgba(255,255,255,.75)'; for(let x=0;x<W;x+=16){ const y=230+Math.sin(t*2+x*.08)*1.5; ctx.fillRect(x,y,12,3); }
  // 沙灘
  ctx.fillStyle='#f3d892'; ctx.fillRect(0,232,W,H-232); ctx.fillStyle='#e6c676'; for(let i=0;i<40;i++) ctx.fillRect((i*53)%W,240+(i*29)%56,6,2);
  // 椰子樹
  const palm=(x,lean)=>{ ctx.strokeStyle='#8a5a2a'; ctx.lineWidth=7; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x,262); ctx.quadraticCurveTo(x+lean*.5,200,x+lean,150); ctx.stroke(); ctx.strokeStyle='#6a4520'; ctx.lineWidth=1.5; for(let k=0;k<7;k++){ const yy=250-k*15; ctx.beginPath(); ctx.moveTo(x+lean*(1-(yy-150)/112)*.9-4,yy); ctx.lineTo(x+lean*(1-(yy-150)/112)*.9+4,yy-2); ctx.stroke(); }
    const tx=x+lean,ty=150; ctx.fillStyle='#2f9a4a'; for(let k=0;k<6;k++){ const a=-Math.PI*.95+k*Math.PI/5+Math.sin(t*1.5+k)*.05; ctx.beginPath(); ctx.moveTo(tx,ty); ctx.quadraticCurveTo(tx+Math.cos(a)*24,ty+Math.sin(a)*24-10,tx+Math.cos(a)*40,ty+Math.sin(a)*40+8); ctx.quadraticCurveTo(tx+Math.cos(a)*22,ty+Math.sin(a)*22,tx,ty); ctx.fill(); }
    ctx.fillStyle='#6a4520'; ctx.beginPath(); ctx.arc(tx-3,ty+4,3.5,0,7); ctx.arc(tx+4,ty+5,3.5,0,7); ctx.fill(); };
  palm(18,14); palm(462,-14);
  // 遮陽傘與觀眾
  const umb=(x,c)=>{ ctx.strokeStyle='#eee'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x,250); ctx.lineTo(x,214); ctx.stroke(); for(let k=0;k<4;k++){ ctx.fillStyle=k%2?'#fff':c; ctx.beginPath(); ctx.moveTo(x,210); ctx.arc(x,218,22,Math.PI+k*Math.PI/4,Math.PI+(k+1)*Math.PI/4); ctx.fill(); } };
  umb(62,'#ff5d4f'); umb(420,'#4f9dff');
  for(const [x,c] of [[48,'#ffd23f'],[78,'#ff7eb6'],[404,'#86dc4f'],[436,'#ff9d3d']]){ const j=Math.max(0,Math.sin(t*4+x))*3; ctx.fillStyle=c; ctx.fillRect(x-4,236-j,8,10); ctx.fillStyle='#ffd9a8'; ctx.beginPath(); ctx.arc(x,232-j,4,0,7); ctx.fill(); }
  // 場地線
  ctx.fillStyle='#fff'; ctx.fillRect(0,GROUND-1,W,3); ctx.fillRect(40,GROUND-1,3,26); ctx.fillRect(W-43,GROUND-1,3,26);
  // 球網：網柱、網格、白邊
  ctx.fillStyle='#7a5a3a'; ctx.fillRect(NETX-NETW/2,NETTOP,NETW,GROUND-NETTOP);
  ctx.strokeStyle='rgba(20,18,43,.45)'; ctx.lineWidth=1; for(let y=NETTOP+6;y<NETTOP+44;y+=6){ ctx.beginPath(); ctx.moveTo(NETX-NETW/2-6,y); ctx.lineTo(NETX+NETW/2+6,y); ctx.stroke(); }
  for(let x=-6;x<=6;x+=4){ ctx.beginPath(); ctx.moveTo(NETX+x,NETTOP); ctx.lineTo(NETX+x,NETTOP+44); ctx.stroke(); }
  ctx.fillStyle='#f4f0ff'; ctx.fillRect(NETX-NETW/2-6,NETTOP-4,NETW+12,7); ctx.fillStyle='#ff5d4f'; ctx.fillRect(NETX-1,NETTOP-22,2,18); ctx.fillStyle='#fff'; ctx.fillRect(NETX-1,NETTOP-22,2,4);
}

function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,two=!net&&opts.mode==='2p',me=net?Math.min(1,net.me):0,vsHuman=!!net&&net.count>1;
  const {ctx}=env.canvas2d(W,H);
  const GOAL=[5,11,15].includes(+((opts.options||{}).win))?+opts.options.win:11; // 開始前選的勝利分數
  const mk=n=>({n,x:n?360:120,y:GROUND,tx:n?360:120,ty:GROUND,vx:0,vy:0,face:n?-1:1,power:0,moving:false,score:0});
  const ps=[mk(0),mk(1)],ball={x:120,y:70,tx:120,ty:70,vx:0,vy:0,rot:0,cool:0,hot:0};
  let srvN=0,srvSeen=-1,t=0,wait=1,lastW=-1,over=0,ended=false,aiErr=0,aiSide=false,aiTick=0,aiX=372,ev=[],sendT=0,lastIn='';
  const rin={dx:0,jump:false,down:false,up:false,hit:false};
  const sfx=n=>{ env.sfx(n); if(net&&net.host) ev.push(n); };
  function serve(to){ srvN++; for(const p of ps){ p.x=p.n?360:120; p.y=GROUND; p.vx=p.vy=0; } ball.x=to?360:120; ball.y=70; ball.vx=ball.vy=0; ball.hot=0; wait=.9; }
  serve(0);

  const ALT=[{animal:'cat',color:'#ff9d3d'},{animal:'bear',color:'#4f9dff'}];
  ps.forEach(p=>{ p.look=(net?net.looks&&net.looks[p.n]:p.n===0?opts.look:null)||ALT[p.n]; if(p.n===1&&!net&&opts.look&&p.look.color===opts.look.color) p.look={animal:p.look.animal,color:'#5fd068'}; p.col=[p.look.color,shade(p.look.color,.68)]; });

  function keysA(){ const k=env.keys; return {dx:(k.ArrowRight||k.KeyD?1:0)-(k.ArrowLeft||k.KeyA?1:0),jump:!!(k.ArrowUp||k.KeyW),down:!!(k.ArrowDown||k.KeyS),up:!!(k.ArrowUp||k.KeyW),hit:env.hit('Space')||env.hit('Enter')}; }
  function inputOf(n){
    const k=env.keys;
    if(two){
      if(n===0) return {dx:(k.KeyD?1:0)-(k.KeyA?1:0),jump:!!k.KeyW,down:!!k.KeyS,up:!!k.KeyW,hit:env.hit('Space')||env.hit('KeyF')};
      return {dx:(k.ArrowRight?1:0)-(k.ArrowLeft?1:0),jump:!!k.ArrowUp,down:!!k.ArrowDown,up:!!k.ArrowUp,hit:env.hit('Enter')||env.hit('NumpadEnter')};
    }
    if(n===0) return keysA();
    if(vsHuman){ const o={dx:rin.dx,jump:rin.jump,down:rin.down,up:rin.up,hit:rin.hit}; rin.hit=false; return o; }
    return aiInput();
  }
  // 電腦：預測落點，站到球的右後方把球往左打
  function aiInput(){
    const p=ps[1],side=ball.x>NETX;
    if(side&&!aiSide) aiErr=(Math.random()-.5)*44; aiSide=side;
    if(--aiTick<=0){ aiTick=6; let x=ball.x,y=ball.y,vx=ball.vx,vy=ball.vy;
      for(let i=0;i<240&&!(y>GROUND-70&&vy>0);i++){ vy+=520/60; x+=vx/60; y+=vy/60; if(x<BR){x=BR;vx=-vx;} if(x>W-BR){x=W-BR;vx=-vx;} if(y<BR){y=BR;vy=-vy;} }
      aiX=x>NETX?Math.min(W-PR,Math.max(NETX+NETW/2+PR,x+(x-130)/13.6+aiErr)):372; }
    const d=aiX-p.x,near=Math.abs(ball.x-p.x)<56;
    const jump=side&&near&&ball.vy>0&&ball.y<p.y-95&&ball.y>p.y-200&&p.y>=GROUND&&Math.abs(aiErr)<20;
    // 挑一個過得了網的扣球角度：往下、平打、往上
    const tn=Math.max(0,ball.x-NETX)/580,clear=vy=>ball.y+vy*tn+260*tn*tn<NETTOP-BR-8;
    return {dx:Math.abs(d)<6?0:Math.sign(d)*.9,jump,down:clear(430),up:!clear(130),hit:p.y<GROUND&&near};
  }

  function conclude(a,b,note){
    if(ended) return; ended=true; ps[0].score=a; ps[1].score=b;
    const w=a>b?0:1,mine=two||w===me;
    env.sfx(mine?'win':'lose');
    env.end({title:two?(w?'右邊':'左邊')+'玩家獲勝':mine?'你贏了！':'你輸了',big:a+' : '+b,text:note||'',score:!two&&!net&&w===0?a-b:null});
  }
  function snapshot(){
    const m={s:[r1(ps[0].x),r1(ps[0].y),ps[0].score,r1(ps[1].x),r1(ps[1].y),ps[1].score,r1(ball.x),r1(ball.y),r1(ball.rot),ball.hot>0?1:0,wait>0?1:0,lastW,srvN,r1(ball.vx),r1(ball.vy)],e:ev};
    ev=[]; return m;
  }
  if(net){
    if(client) net.onmsg=m=>{
      if(m.s){ const s=m.s; ps[0].tx=s[0]; ps[0].ty=s[1]; ps[0].score=s[2]; ps[1].tx=s[3]; ps[1].ty=s[4]; ps[1].score=s[5];
        ball.tx=s[6]; ball.ty=s[7]; ball.rot=s[8]; ball.hot=s[9]?.3:0; wait=s[10]?.5:0; lastW=s[11]; ball.srv=s[12]; ball.vx=s[13]||0; ball.vy=s[14]||0;
        for(const n of m.e){ if(n==='p0'||n==='p1') env.sfx(+n[1]===me?'item':'hurt'); else env.sfx(n); } }
      else if(m.end) conclude(m.end[0],m.end[1],m.end[2]);
    };
    else {
      net.onmsg=(m,from)=>{ if(from===1&&m.i){ rin.dx=m.i[0]; rin.jump=!!m.i[1]; rin.down=!!m.i[2]; rin.up=!!m.i[3]; if(m.i[4]) rin.hit=true; }
        if(from===1&&m.p&&m.p[3]===srvN){ const p=ps[1]; p.x=m.p[0]; p.y=m.p[1]; p.vy=m.p[2]; } };
      net.onleave=i=>{ if(i===1&&!ended){ const a=Math.max(ps[0].score,ps[1].score+1); conclude(a,ps[1].score,'對手離開了。'); } };
    }
  }

  function update(dt){
    t+=dt;
    if(client){
      const i=keysA(),key=''+i.dx+(+i.jump)+(+i.down)+(+i.up),P=ps[me];
      if(ball.srv!=null&&ball.srv!==srvSeen){ srvSeen=ball.srv; P.x=P.tx; P.y=P.ty; P.vy=0; } // 新的一球：位置跟房主對齊
      P.vx=i.dx*215; P.moving=!!i.dx; if(i.jump&&P.y>=GROUND){ P.vy=-575; env.sfx('land'); }
      P.vy+=1350*dt; P.x+=P.vx*dt; P.y+=P.vy*dt; if(P.y>=GROUND){ P.y=GROUND; P.vy=0; }
      { const lo=me?NETX+NETW/2+PR:PR,hi=me?W-PR:NETX-NETW/2-PR; P.x=Math.max(lo,Math.min(hi,P.x)); }
      sendT-=dt; if(key!==lastIn||i.hit||sendT<=0){ lastIn=key; sendT=1/30; net.send({i:[i.dx,+i.jump,+i.down,+i.up,+i.hit],p:[r1(P.x),r1(P.y),r1(P.vy),srvSeen]}); }
      const f=Math.min(1,dt*22);
      if(wait<=0&&ball.vx!=null){ ball.tx+=ball.vx*dt; ball.ty+=ball.vy*dt; ball.vy+=520*dt; }
      for(const p of ps){ if(p===P) continue; p.moving=Math.abs(p.tx-p.x)>.6; p.x+=(p.tx-p.x)*f; p.y+=(p.ty-p.y)*f; if(p.ty>=GROUND&&GROUND-p.y<1) p.y=GROUND; }
      if(Math.abs(ball.tx-ball.x)+Math.abs(ball.ty-ball.y)>120){ ball.x=ball.tx; ball.y=ball.ty; } else { ball.x+=(ball.tx-ball.x)*f; ball.y+=(ball.ty-ball.y)*f; }
      return;
    }
    if(ended) return;
    if(over){ over+=dt; if(over>1.3){ const a=ps[0].score,b=ps[1].score; if(net){ net.send(snapshot()); net.send({end:[a,b,'']}); } conclude(a,b); } return; }
    for(const p of ps){
      const i=inputOf(p.n);
      p.vx=i.dx*215; p.moving=!!i.dx;
      if(i.jump&&p.y>=GROUND){ p.vy=-575; sfx('land'); }
      if(i.hit) p.power=.28; else if(p.power>0) p.power-=dt;
      p.dirY=i.down?1:i.up?-1:0;
      p.vy+=1350*dt; p.x+=p.vx*dt; p.y+=p.vy*dt;
      if(p.y>=GROUND){ p.y=GROUND; p.vy=0; }
      const lo=p.n?NETX+NETW/2+PR:PR,hi=p.n?W-PR:NETX-NETW/2-PR; p.x=Math.max(lo,Math.min(hi,p.x));
    }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/30; net.send(snapshot()); } }
    if(wait>0){ wait-=dt; return; }
    const b=ball;
    b.vy+=520*dt; b.x+=b.vx*dt; b.y+=b.vy*dt; b.rot+=b.vx*dt*.03; if(b.cool>0) b.cool-=dt; if(b.hot>0) b.hot-=dt;
    if(b.x<BR){ b.x=BR; b.vx=Math.abs(b.vx); } if(b.x>W-BR){ b.x=W-BR; b.vx=-Math.abs(b.vx); }
    if(b.y<BR){ b.y=BR; b.vy=Math.abs(b.vy); }
    // 球網
    const nx=Math.max(NETX-NETW/2,Math.min(NETX+NETW/2,b.x)),ny=Math.max(NETTOP,Math.min(GROUND,b.y)),ddx=b.x-nx,ddy=b.y-ny;
    if(ddx*ddx+ddy*ddy<BR*BR){
      if(b.y<NETTOP&&Math.abs(ddy)>Math.abs(ddx)){ b.y=NETTOP-BR; b.vy=-Math.max(160,Math.abs(b.vy)*.7); if(Math.abs(b.vx)<80) b.vx=(b.x<NETX?-1:b.x>NETX?1:(Math.random()<.5?-1:1))*120; }
      else { const s=b.x<NETX?-1:1; b.x=NETX+s*(NETW/2+BR); b.vx=s*Math.max(90,Math.abs(b.vx)*.8); }
    }
    for(const p of ps){
      const dx=b.x-p.x,dy=b.y-(p.y-28),d=Math.hypot(dx,dy);
      if(d<PR+BR&&b.cool<=0){
        const s=p.n?-1:1;
        if(p.power>0&&p.y<GROUND){ const want=p.dirY>0?430:p.dirY<0?-330:130,toNet=(NETX-b.x)*s,tn=Math.max(.02,(toNet-NETW/2)/580),lim=toNet>0?(NETTOP-BR-12-b.y-260*tn*tn)/tn:want;
          b.vx=s*580; b.vy=Math.max(-620,Math.min(want,lim)); b.hot=.6; sfx('boom'); }
        else { b.vx=Math.max(-420,Math.min(420,dx*7+s*110)); b.vy=-Math.max(370,Math.min(520,Math.abs(b.vy)*.9))+p.vy*.25; sfx('place'); }
        const k=(PR+BR)/(d||1); b.x=p.x+dx*k; b.y=p.y-28+dy*k; b.cool=.16;
      }
    }
    if(b.y+BR>=GROUND){
      b.y=GROUND-BR; const w=b.x<NETX?1:0; ps[w].score++; lastW=w;
      env.sfx(two||w===me?'item':'hurt'); if(net) ev.push('p'+w);
      if(ps[w].score>=GOAL) over=.001; else serve(w);
    }
  }

  function draw(){
    drawCourt(ctx,t);
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='22px '+PIX; ctx.lineWidth=4; ctx.strokeStyle='#14122b';
    ps.forEach(p=>{ const x=p.n?W-70:70; ctx.strokeText(p.score,x,34); ctx.fillStyle=p.col[0]; ctx.fillText(p.score,x,34); });
    ctx.font='900 12px "Noto Sans TC","Microsoft JhengHei",sans-serif'; ctx.lineWidth=4; ctx.strokeText('先拿 '+GOAL+' 分',W/2,22); ctx.fillStyle='#fff'; ctx.fillText('先拿 '+GOAL+' 分',W/2,22); ctx.font='22px '+PIX;
    if(net){ ctx.font='700 12px "Noto Sans TC","Microsoft JhengHei",sans-serif'; ctx.fillStyle='#14122b'; ctx.fillText('你',me?W-70:70,58); }
    for(const p of ps) drawCat(ctx,p.x,p.y,p.face,p.col,p.y<GROUND-1,t,p.moving,p.look.animal);
    if(ball.hot>0){ ctx.fillStyle='rgba(255,93,143,.35)'; ctx.beginPath(); ctx.arc(ball.x-ball.vx*.03,ball.y-ball.vy*.03,BR,0,7); ctx.fill(); }
    drawBall(ctx,ball.x,ball.y,ball.rot);
    if(wait>0&&lastW>=0&&!over){ const msg=two?(lastW?'右邊得分':'左邊得分'):lastW===me?'得分！':'失分';
      ctx.font='900 30px "Noto Sans TC","Microsoft JhengHei",sans-serif'; ctx.lineWidth=6; ctx.strokeText(msg,W/2,120); ctx.fillStyle='#ffd23f'; ctx.fillText(msg,W/2,120); }
  }
  return {update,draw,destroy(){},_dbg:{ps,ball}};
}

function preview(ctx,w,h,L,t){
  const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#5ec8ff'); g.addColorStop(.7,'#c9f0ff'); g.addColorStop(.7,'#f3d892'); g.addColorStop(1,'#f3d892'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  const up=Math.max(0,Math.sin(t*2.4))*26;
  ctx.save(); ctx.translate(w/2,h-30-GROUND*1.9); ctx.scale(1.9,1.9); drawCat(ctx,0,GROUND-up/1.9,1,[L.color,shade(L.color,.68)],up>4,t,false,L.animal); ctx.restore();
}

function thumb(ctx,w,h,t){
  ctx.save(); ctx.scale(w/W,w/W); ctx.translate(0,-20);
  drawCourt(ctx,t);
  const T=2.2,u=(t%T)/T,hitU=.42;
  // 左邊的貓起跳到最高點殺球
  const jy=u<hitU?Math.sin(Math.min(1,u/hitU)*Math.PI/2)*104:Math.max(0,104-(u-hitU)*T*420);
  drawCat(ctx,196,GROUND-jy,1,COL[0],jy>2,t,false);
  drawCat(ctx,372+(u>hitU?Math.min(1,(u-hitU)*3)*-30:0),GROUND-(u>.55&&u<.75?24:0),-1,COL[1],u>.55&&u<.75,t,u>hitU);
  let bx,by;
  if(u<hitU){ const k=u/hitU; bx=120+(214-120)*k; by=40+(GROUND-104-58-40)*Math.sin(k*Math.PI/2); }
  else { const k=Math.min(1,(u-hitU)/.28); bx=214+(400-214)*k; by=GROUND-162+(GROUND-BR-(GROUND-162))*k*k*.95; }
  if(u>hitU&&u<hitU+.3){ for(let i=1;i<6;i++){ const k=Math.max(0,(u-hitU)/.28-i*.06); ctx.globalAlpha=.3*(6-i)/5; ctx.fillStyle='#ff5d8f'; ctx.beginPath(); ctx.arc(214+186*k,GROUND-162+(BR+145)*k*k*.95,BR,0,7); ctx.fill(); } ctx.globalAlpha=1; }
  drawBall(ctx,bx,by,t*8);
  if(u>hitU&&u<hitU+.12){ ctx.fillStyle='rgba(255,255,255,.95)'; ctx.beginPath(); for(let i=0;i<12;i++){ const a=i*.5236,r=i%2?10:26; ctx.lineTo(214+Math.cos(a)*r,GROUND-162+Math.sin(a)*r); } ctx.fill(); }
  if(u>hitU+.05&&u<.95){ ctx.save(); ctx.translate(W/2,92); const sc=1+Math.max(0,.12-(u-hitU-.05))*4; ctx.scale(sc,sc); ctx.font='900 26px '+PIX; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=6; ctx.strokeStyle='#14122b'; ctx.strokeText('SPIKE!',0,0); ctx.fillStyle='#ffd23f'; ctx.fillText('SPIKE!',0,0); ctx.restore(); }
  if(u>hitU+.28&&u<hitU+.45){ const k=(u-hitU-.28)/.17; ctx.fillStyle='rgba(230,198,118,'+(1-k)+')'; for(let i=0;i<10;i++){ const a=Math.PI+i*Math.PI/9; ctx.fillRect(400+Math.cos(a)*k*40,GROUND-4+Math.sin(a)*k*26,4,4); } }
  ctx.restore();
}

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).volley={
  name:'椰林沙灘排球',tag:'BEACH VOLLEY',color:'#3ddbd9',online:true,maxPlayers:2,
  desc:'一對一打排球，跳起來殺球讓對手接不到。可單人對電腦、兩人同一台對打，或開房間連線。',
  options:[{key:'win',label:'打幾分',def:'11',opts:[{id:'5',label:'5 分'},{id:'11',label:'11 分'},{id:'15',label:'15 分'}]}],
  goal:'球落在對方場地就得 1 分，先拿到開始前選的分數（5、11 或 15 分）就獲勝。跳到空中按殺球會用力扣殺，同時按住 ↓ 會往下扣。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['← → ↑ Space','單人與連線：移動、跳、殺球'],['A D W Space','雙人左邊'],['← → ↑ Enter','雙人右邊']],
  touchHelp:[['◀ ▶','移動'],['跳','跳起來'],['殺球','在空中按']],
  touch:{left:[{l:'◀',c:'ArrowLeft'},{l:'▶',c:'ArrowRight'}],right:[{l:'跳',c:'ArrowUp'},{l:'殺球',c:'Space',act:true}]},
  best:{label:'最大勝分',fmt:v=>'贏 '+v+' 分',lower:false},
  looks:[{key:'animal',label:'動物',opts:[{id:'cat',label:'貓'},{id:'rabbit',label:'兔子'},{id:'bear',label:'熊'},{id:'dog',label:'狗'}]},
    {key:'color',label:'顏色',type:'color',opts:['#ff5d4f','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#b98cff','#ff7eb6']}],
  preview,thumb,create
};
})();
