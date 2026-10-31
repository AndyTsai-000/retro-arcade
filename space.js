// 太空艦隊：縱向捲軸射擊。自動開火，只要移動和放炸彈；10 個星域，每關最後打王。單人、同機雙人合作、連線 2～4 人合作（房主運算）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PIX='"Press Start 2P","Noto Sans TC",monospace';
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k,TAU=Math.PI*2;
function mul(seed){ let a=seed>>>0||1; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const STAGES=[
  {name:'初航星帶',stars:1,k:.5,sky:['#050a24','#10245a'],neb:'#3d6bff',pl:'#6fb4ff',boss:'#4f9dff',len:42},
  {name:'翡翠星雲',stars:1,k:.58,sky:['#03140f','#0c3a30'],neb:'#2fd08a',pl:'#7fe8b8',boss:'#3ddb9a',len:46},
  {name:'熔岩小行星',stars:2,k:.66,sky:['#1a0605','#44140c'],neb:'#ff6a2a',pl:'#ff9a5a',boss:'#ff7a3d',len:50},
  {name:'紫晶裂谷',stars:2,k:.74,sky:['#10062a','#2e1260'],neb:'#a85aff',pl:'#c89aff',boss:'#b06aff',len:52},
  {name:'冰環行星',stars:3,k:.82,sky:['#04121f','#123a54'],neb:'#6fe0ff',pl:'#c8f4ff',boss:'#5fd4f0',len:55},
  {name:'機械要塞',stars:3,k:.9,sky:['#0c0e14','#262c3c'],neb:'#8a9ab8',pl:'#a8b4c8',boss:'#d8a040',len:58},
  {name:'黃金太陽',stars:4,k:.98,sky:['#1c0f02','#4e2c06'],neb:'#ffc23f',pl:'#ffe08a',boss:'#ffb02a',len:60},
  {name:'血月戰線',stars:4,k:1.06,sky:['#180208','#44081c'],neb:'#ff3b6b',pl:'#ff8aa8',boss:'#ff3b6b',len:62},
  {name:'黑洞邊緣',stars:5,k:1.14,sky:['#020208','#141030'],neb:'#6a5aff',pl:'#2a2050',boss:'#8a7aff',len:64},
  {name:'銀河終戰',stars:5,k:1.22,sky:['#080218','#2a0a4a'],neb:'#ff5ad4',pl:'#ffb0ec',boss:'#ff5ad4',len:68}];
const COL=['#3ddbd9','#ffd23f','#ff7eb6','#86dc4f'];
/* ---------- 精靈圖快取（有光暈的東西先畫好，畫面才順） ---------- */
const CACHE={};
function spr(key,w,h,f){ let e=CACHE[key]; if(!e){ e=document.createElement('canvas'); e.width=w*2; e.height=h*2; const c=e.getContext('2d'); c.scale(2,2); c.translate(w/2,h/2); f(c); e.hw=w/2; e.hh=h/2; CACHE[key]=e; } return e; }
const put=(c,s,x,y,a,k)=>{ if(a||k){ c.save(); c.translate(x,y); if(a) c.rotate(a); if(k) c.scale(k,k); c.drawImage(s,-s.hw,-s.hh,s.hw*2,s.hh*2); c.restore(); } else c.drawImage(s,x-s.hw,y-s.hh,s.hw*2,s.hh*2); };
const shade=(h,f)=>{ const n=parseInt(h.slice(1),16),q=v=>clamp(Math.round(v*f),0,255); return 'rgb('+q(n>>16)+','+q(n>>8&255)+','+q(n&255)+')'; };
function metal(c,x0,x1,col){ const g=c.createLinearGradient(x0,0,x1,0); g.addColorStop(0,shade(col,.45)); g.addColorStop(.45,shade(col,1.2)); g.addColorStop(.6,col); g.addColorStop(1,shade(col,.4)); return g; }
const poly=(c,p)=>{ c.beginPath(); p.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1])); c.closePath(); };
function shipSpr(col,kind){ return spr('p'+col+kind,70,76,c=>{ const mir=(f)=>{ f(1); c.save(); c.scale(-1,1); f(1); c.restore(); };
    if(kind==='1'){ mir(()=>{ poly(c,[[3,-6],[32,18],[32,24],[12,18],[8,28],[3,26]]); c.fillStyle=metal(c,0,32,col); c.fill(); }); }
    else if(kind==='2'){ mir(()=>{ poly(c,[[4,-18],[12,-2],[28,-12],[24,14],[10,24],[3,26]]); c.fillStyle=metal(c,0,28,col); c.fill(); }); }
    else mir(()=>{ poly(c,[[3,-14],[20,4],[34,8],[30,16],[14,18],[10,28],[3,26]]); c.fillStyle=metal(c,0,34,col); c.fill(); c.fillStyle='#d8dee8'; c.fillRect(30,-2,3,12); });
    const b=c.createLinearGradient(-8,0,8,0); b.addColorStop(0,'#7a8498'); b.addColorStop(.5,'#f4f6fa'); b.addColorStop(1,'#6a7488'); c.fillStyle=b; c.beginPath(); c.moveTo(0,-34); c.quadraticCurveTo(9,-14,8,18); c.lineTo(5,28); c.lineTo(-5,28); c.lineTo(-8,18); c.quadraticCurveTo(-9,-14,0,-34); c.fill();
    const w=c.createLinearGradient(0,-20,0,-2); w.addColorStop(0,'#bff4ff'); w.addColorStop(1,'#1a5a9a'); c.fillStyle=w; c.beginPath(); c.ellipse(0,-11,4.2,10,0,0,TAU); c.fill(); c.fillStyle=col; c.fillRect(-1.6,6,3.2,14); }); }
function foeSpr(t,col){ return spr('f'+t+col,t==='tank'?90:60,t==='tank'?80:60,c=>{ const mir=f=>{ f(); c.save(); c.scale(-1,1); f(); c.restore(); };
    if(t==='scout'){ mir(()=>{ poly(c,[[0,16],[18,-12],[8,-14],[3,-2]]); c.fillStyle=metal(c,0,18,col); c.fill(); }); c.fillStyle='#262c3c'; c.beginPath(); c.ellipse(0,0,6,12,0,0,TAU); c.fill(); c.fillStyle='#ff5d5d'; c.beginPath(); c.arc(0,4,3,0,TAU); c.fill(); }
    else if(t==='weave'){ mir(()=>{ c.fillStyle=metal(c,0,24,col); c.beginPath(); c.moveTo(0,-10); c.quadraticCurveTo(26,-16,22,6); c.quadraticCurveTo(10,2,0,14); c.fill(); }); c.fillStyle='#14182a'; c.beginPath(); c.arc(0,0,7,0,TAU); c.fill(); c.fillStyle='#ffd23f'; c.beginPath(); c.arc(0,1,3.4,0,TAU); c.fill(); }
    else if(t==='gun'){ c.fillStyle=metal(c,-20,20,col); c.beginPath(); for(let i=0;i<6;i++){ const a=i/6*TAU+.52; c.lineTo(Math.cos(a)*20,Math.sin(a)*20); } c.closePath(); c.fill(); c.strokeStyle='rgba(0,0,0,.5)'; c.lineWidth=1.5; c.stroke(); c.fillStyle='#262c3c'; c.fillRect(-4,6,8,18); c.fillStyle='#ff5d5d'; c.beginPath(); c.arc(0,0,7,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(-2,-2,2,0,TAU); c.fill(); }
    else if(t==='spin'){ for(let i=0;i<4;i++){ c.save(); c.rotate(i*TAU/4); c.fillStyle=metal(c,-8,8,col); c.beginPath(); c.moveTo(-7,0); c.lineTo(0,-24); c.lineTo(7,0); c.fill(); c.restore(); } c.fillStyle='#14182a'; c.beginPath(); c.arc(0,0,9,0,TAU); c.fill(); c.fillStyle='#3ddbd9'; c.beginPath(); c.arc(0,0,4.5,0,TAU); c.fill(); }
    else if(t==='dive'){ poly(c,[[0,24],[10,-6],[20,-16],[6,-12],[0,-20],[-6,-12],[-20,-16],[-10,-6]]); c.fillStyle=metal(c,-20,20,col); c.fill(); c.fillStyle='#ffb02a'; c.beginPath(); c.arc(0,4,3.6,0,TAU); c.fill(); }
    else if(t==='rock'){ c.fillStyle='#6a6058'; c.beginPath(); for(let i=0;i<9;i++){ const a=i/9*TAU,r=16+((i*37)%7); c.lineTo(Math.cos(a)*r,Math.sin(a)*r); } c.closePath(); c.fill(); c.fillStyle='rgba(255,255,255,.14)'; c.beginPath(); c.arc(-5,-6,6,0,TAU); c.fill(); c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.arc(6,5,5,0,TAU); c.fill(); }
    else { mir(()=>{ poly(c,[[8,-26],[40,-14],[42,14],[22,28],[8,22]]); c.fillStyle=metal(c,0,42,col); c.fill(); c.fillStyle='#262c3c'; c.fillRect(28,10,6,20); }); c.fillStyle='#262c3c'; c.beginPath(); c.ellipse(0,0,14,28,0,0,TAU); c.fill(); c.fillStyle='#ff5d5d'; c.beginPath(); c.arc(0,4,8,0,TAU); c.fill(); c.fillStyle='#ffe0a0'; c.beginPath(); c.arc(-2,2,3,0,TAU); c.fill(); } }); }
function bossSpr(si,col){ return spr('b'+si,260,160,c=>{ const n=2+si%3,mir=f=>{ f(); c.save(); c.scale(-1,1); f(); c.restore(); };
    mir(()=>{ for(let i=0;i<n;i++){ const k=i/n,x=30+k*90,y=-20+k*44; poly(c,[[x-24,y-20],[x+24,y-30+(si%2)*12],[x+18,y+22],[x-4,y+40],[x-28,y+18]]); c.fillStyle=metal(c,x-28,x+24,i%2?shade(col,.7):col); c.fill(); c.strokeStyle='rgba(0,0,0,.45)'; c.lineWidth=1.5; c.stroke(); c.fillStyle='#232838'; c.fillRect(x-5,y+18,10,24+(i%2)*8); c.fillStyle=col; c.fillRect(x-2,y+36,4,8+(i%2)*8); } });
    const b=c.createLinearGradient(-42,0,42,0); b.addColorStop(0,'#2a3044'); b.addColorStop(.5,'#8a94ac'); b.addColorStop(1,'#232838'); c.fillStyle=b; c.beginPath(); c.moveTo(0,-62); c.lineTo(38,-30); c.lineTo(44,30); c.lineTo(14,62); c.lineTo(-14,62); c.lineTo(-44,30); c.lineTo(-38,-30); c.closePath(); c.fill(); c.strokeStyle='rgba(0,0,0,.5)'; c.lineWidth=2; c.stroke();
    c.fillStyle=shade(col,.8); c.fillRect(-30,-22,60,6); c.fillRect(-34,14,68,5); const g=c.createRadialGradient(0,0,2,0,0,24); g.addColorStop(0,'#fff'); g.addColorStop(.35,col); g.addColorStop(1,'#141826'); c.fillStyle=g; c.beginPath(); c.arc(0,0,22,0,TAU); c.fill(); c.strokeStyle='#fff'; c.globalAlpha=.4; c.stroke(); c.globalAlpha=1; }); }
const ebSpr=(col,r)=>spr('e'+col+r,r*5,r*5,c=>{ const g=c.createRadialGradient(0,0,0,0,0,r*2.4); g.addColorStop(0,'#fff'); g.addColorStop(.32,'#fff'); g.addColorStop(.42,col); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.beginPath(); c.arc(0,0,r*2.4,0,TAU); c.fill(); });
const beamSpr=col=>spr('pb'+col,14,34,c=>{ const g=c.createLinearGradient(0,-16,0,16); g.addColorStop(0,'#fff'); g.addColorStop(.5,col); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.beginPath(); c.moveTo(0,-16); c.lineTo(3.4,-8); c.lineTo(2.4,16); c.lineTo(-2.4,16); c.lineTo(-3.4,-8); c.closePath(); c.fill(); });
const missSpr=spr.bind(null,'miss',12,26,c=>{ c.fillStyle='#e8ecf4'; c.fillRect(-2.5,-10,5,16); c.fillStyle='#ff5d5d'; c.beginPath(); c.moveTo(-2.5,-10); c.lineTo(0,-14); c.lineTo(2.5,-10); c.fill(); c.fillStyle='#ffb02a'; c.beginPath(); c.moveTo(-2,6); c.lineTo(0,12); c.lineTo(2,6); c.fill(); });
const POW={w:['#ff7a3d','武'],s:['#3ddbd9','盾'],b:['#ffd23f','爆'],c:['#86dc4f','$']};
const powSpr=k=>spr('pw'+k,40,40,c=>{ const g=c.createRadialGradient(0,0,4,0,0,19); g.addColorStop(0,'rgba(255,255,255,.3)'); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.fillRect(-20,-20,40,40); c.fillStyle=POW[k][0]; c.beginPath(); c.arc(0,0,12,0,TAU); c.fill(); c.strokeStyle='#fff'; c.lineWidth=2; c.stroke(); c.fillStyle='#14122b'; c.font='900 14px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(POW[k][1],0,1); });
const bgCache={};
function bg(si){ if(bgCache[si]) return bgCache[si]; const S=STAGES[si],e=document.createElement('canvas'); e.width=800; e.height=1000; const c=e.getContext('2d'),R=mul(si*97+5),g=c.createLinearGradient(0,0,0,1000); g.addColorStop(0,S.sky[0]); g.addColorStop(.5,S.sky[1]); g.addColorStop(1,S.sky[0]); c.fillStyle=g; c.fillRect(0,0,800,1000);
  c.globalCompositeOperation='lighter'; const blob=(x,y,r,a)=>{ for(const dy of [0,1000,-1000]){ const q=c.createRadialGradient(x,y+dy,0,x,y+dy,r); q.addColorStop(0,S.neb); q.addColorStop(1,'rgba(0,0,0,0)'); c.globalAlpha=a; c.fillStyle=q; c.fillRect(x-r,y+dy-r,r*2,r*2); } }; for(let i=0;i<9;i++) blob(R()*800,R()*1000,120+R()*220,.09+R()*.13); c.globalAlpha=1; c.globalCompositeOperation='source-over';
  for(let i=0;i<220;i++){ c.fillStyle='rgba(255,255,255,'+(.2+R()*.6)+')'; const s=R()<.08?2:1; c.fillRect(R()*800,R()*1000,s,s); }
  bgCache[si]=e; return e; }
function planet(c,x,y,r,col,ring){ const g=c.createRadialGradient(x-r*.4,y-r*.4,r*.1,x,y,r); g.addColorStop(0,'#fff'); g.addColorStop(.25,col); g.addColorStop(1,'#05060f'); c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,TAU); c.fill(); if(ring){ c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=r*.09; c.beginPath(); c.ellipse(x,y,r*1.6,r*.34,-.3,0,TAU); c.stroke(); } }
function drawBg(c,si,t){ const e=bg(si),y=(t*22)%1000; c.drawImage(e,0,y-1000,800,1000); c.drawImage(e,0,y,800,1000); const S=STAGES[si],py=((t*9)%(H+500))-250; planet(c,160+si*60,py,70+si*6,S.pl,si%2===0);
  c.fillStyle='rgba(255,255,255,.75)'; for(let i=0;i<34;i++){ const v=70+(i%5)*55,yy=((t*v+i*97)%(H+20))-10,x=(i*233)%W; c.fillRect(x,yy,1.3,v/22); } }

/* ---------- 遊戲本體 ---------- */
function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,local2=!net&&opts.mode==='2p',si=clamp(opts.stage||0,0,9),S=STAGES[si],K=S.k,np=net?Math.min(4,net.count):local2?2:1,me=net?net.me:0;
  const {ctx:c,canvas}=env.canvas2d(W,H),R=mul((net?net.seed:Date.now())>>>0||7),sfx=n=>{ env.sfx(n); if(net&&net.host) evq.push(n); };
  const looks=[]; for(let i=0;i<np;i++) looks.push(Object.assign({color:COL[i%4],ship:String(i%3)},(net?net.looks&&net.looks[i]:i===0?opts.look:null)||{}));
  const PL=looks.map((L,i)=>({i,x:W/2+(i-(np-1)/2)*80,y:H-70,lv:1,lives:3,bomb:2,inv:2.5,sh:0,score:0,dead:false,col:L.color,ship:L.ship,fire:0,name:net?(net.names&&net.names[i])||'玩家'+(i+1):local2?(i+1)+'P':(opts.name||'你')}));
  let E=[],B=[],EB=[],PW=[],FX=[],boss=null,t=0,clock=0,spawnT=1.6,over=null,ended=false,evq=[],sendT=0,shake=0,flash=0,banT=3,inN=[{},{},{},{}],kills=0,warn=0,waveI=0,snapT=0,bossDone=false;
  const fxB=(x,y,col,n,sp,life)=>{ if(FX.length>380) return; for(let i=0;i<n;i++){ const a=Math.random()*TAU,v=sp*(.3+Math.random()); FX.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:life*(.5+Math.random()*.6),L:life,c:col,s:1.5+Math.random()*2.5}); } };
  const blast=(x,y,r,col)=>{ FX.push({ring:1,x,y,r:r*.2,R:r,l:.4,L:.4,c:col||'#ffd23f'}); fxB(x,y,'#fff',Math.ceil(r/5),r*5,.35); fxB(x,y,col||'#ff9d3d',Math.ceil(r/2),r*3.4,.65); };
  const alive=()=>PL.filter(p=>!p.dead),nearP=(x,y)=>{ let b=null,d=1e9; for(const p of alive()){ const q=Math.hypot(p.x-x,p.y-y); if(q<d){ d=q; b=p; } } return b; };
  const shot=(x,y,a,v,r,col)=>{ if(EB.length<400) EB.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:r||5,c:col||'#ff5d8f'}); };
  const aim=(x,y)=>{ const p=nearP(x,y); return p?Math.atan2(p.y-y,p.x-x):Math.PI/2; };
  const FOE={scout:{hp:2,r:15,pts:50,col:S.boss},weave:{hp:3,r:17,pts:80,col:S.pl},gun:{hp:9,r:20,pts:180,col:S.boss},spin:{hp:6,r:18,pts:140,col:S.pl},dive:{hp:2,r:15,pts:70,col:'#ff7a3d'},rock:{hp:6,r:17,pts:40,col:'#6a6058'},tank:{hp:30,r:34,pts:600,col:S.boss}};
  const add=(tp,x,y,o)=>{ const f=FOE[tp]; E.push(Object.assign({t:tp,x,y,vx:0,vy:60+K*50,hp:Math.ceil(f.hp*(.75+K*.5)),hpM:Math.ceil(f.hp*(.75+K*.5)),r:f.r,pts:f.pts,ph:R()*6,cd:1+R()*1.4,a:0,hit:0,x0:x},o||{})); };
  // 敵人一波一波來：每波一種隊形
  function wave(){ waveI++; const pick=R(),n=Math.round(3+K*5),gap=Math.max(.95,2.2-K*.9);
    if(clock>6&&pick<.2){ const x=120+R()*560; for(let i=0;i<n;i++) add('scout',x+(i-n/2)*36,-30-Math.abs(i-n/2)*30,{vy:70+K*70}); }
    else if(pick<.4){ const s=R()<.5?1:-1; for(let i=0;i<n;i++) add('weave',W/2+s*180,-30-i*44,{mx:1,amp:150+R()*80,vy:75+K*50,ph:i*.5}); }
    else if(pick<.56&&K>.55){ const k=K>1?3:2; for(let i=0;i<k;i++) add('gun',160+i*(480/(k-1||1))+R()*40,-40,{vy:50,stop:80+R()*80}); }
    else if(pick<.7){ const s=R()<.5?1:-1; for(let i=0;i<n;i++) add('dive',W/2+s*(120+i*42),-30-i*60,{dv:1,vy:120+K*60}); }
    else if(pick<.82){ for(let i=0;i<Math.round(n*.9);i++) add('rock',50+R()*700,-30-R()*200,{vy:90+R()*90+K*30,vx:(R()-.5)*50,rot:(R()-.5)*3}); }
    else if(K>.65&&pick<.92) add('spin',200+R()*400,-30,{vy:65,mx:1,amp:120,stop:120});
    else if(clock>18&&K>.75&&!E.some(e=>e.t==='tank')) add('tank',200+R()*400,-50,{vy:36,stop:90});
    else { for(let i=0;i<n;i++) add('scout',80+i*(640/(n-1||1)),-30-(i%2)*40,{vy:70+K*60}); }
    spawnT=gap+R()*.8; }
  function startBoss(){ const hp=Math.round((260+si*150)*(np>1?1+.5*(np-1):1)); boss={x:W/2,y:-90,tx:W/2,hp,hpM:hp,t:0,cd:1.2,ph:0,pat:0,hit:0,dying:0,beam:0,bx:0}; warn=2.6; sfx('trap'); }
  function bossAI(dt){ const b=boss; b.t+=dt; if(b.hit>0) b.hit-=dt; if(b.dying>0){ b.dying-=dt; shake=Math.max(shake,5); if(Math.random()<dt*20) blast(b.x+(Math.random()-.5)*210,b.y+(Math.random()-.5)*110,28,'#ff9d3d'); if(Math.random()<dt*8) sfx('bump'); if(b.dying<=0){ blast(b.x,b.y,120,'#fff'); flash=.8; shake=14; sfx('boom'); boss=null; bossDone=true; for(let i=0;i<8;i++) PW.push({k:'c',x:W/2+(i-3.5)*50,y:90,vy:80}); over={win:true,T:2.6}; sfx('win'); } return; }
    if(b.y<105){ b.y+=dt*70; return; } b.x+=(b.tx-b.x)*dt*.9; if(Math.abs(b.tx-b.x)<14||b.t%4<dt) b.tx=170+R()*460;
    const hpK=b.hp/b.hpM,stage=hpK>.66?0:hpK>.33?1:2,diff=K*(1+stage*.28); b.cd-=dt;
    if(b.beam>0){ b.beam-=dt; if(b.beam<.9&&b.beam>0){ for(const p of alive()) if(Math.abs(p.x-b.bx)<22) hurt(p); } if(b.beam<=0) b.cd=.9; return; }
    if(b.cd<=0){ b.pat=(b.pat+1)%4; if(stage===0&&b.pat===3) b.pat=0;
      if(b.pat===0){ const n=Math.round(5+diff*7),a0=aim(b.x,b.y+40); for(let i=0;i<n;i++) shot(b.x,b.y+40,a0+(i-(n-1)/2)*.15,130+diff*90,6); b.cd=1.45-diff*.45; sfx('pop'); }
      else if(b.pat===1){ const n=Math.round(10+diff*14),o=b.t*1.7; for(let i=0;i<n;i++) shot(b.x,b.y,o+i/n*TAU,105+diff*70,5,'#7ab8ff'); if(stage>0) for(let i=0;i<n;i++) shot(b.x,b.y,-o+i/n*TAU,75+diff*55,5,'#ffd23f'); b.cd=1.5-diff*.4; sfx('pop'); }
      else if(b.pat===2){ const p=nearP(b.x,b.y); b.bx=p?p.x:b.x; b.beam=1.9; b.tx=b.bx; sfx('beep'); b.cd=2.4; return; }
      else { const k=2+stage; for(let i=0;i<k;i++) add(i%2?'dive':'scout',b.x+(i-(k-1)/2)*70,b.y+30,{vy:120+K*50,dv:i%2}); b.cd=1.3; } } }
  function hurt(p){ if(p.inv>0||p.dead) return; if(p.sh>0){ p.sh=0; p.inv=1.3; sfx('bump'); fxB(p.x,p.y,'#3ddbd9',18,180,.5); return; } p.lives--; p.lv=Math.max(1,p.lv-1); blast(p.x,p.y,60,p.col); shake=10; sfx('hurt'); sfx('boom'); if(p.lives<=0){ p.dead=true; p.x=-200; if(!alive().length&&!over) over={win:false,T:2.2}; } else { p.inv=2.8; p.x=W/2; p.y=H-60; p.bomb=Math.max(p.bomb,2); } }
  function bombAt(p){ if(p.bomb<=0||p.dead) return; p.bomb--; p.inv=Math.max(p.inv,1.6); flash=.7; shake=12; sfx('boom'); blast(p.x,p.y-80,190,'#fff'); FX.push({ring:1,x:p.x,y:p.y,r:20,R:760,l:.7,L:.7,c:p.col}); EB=[]; for(const e of E){ e.hp-=26; e.hit=.1; } if(boss&&boss.y>=100) damageBoss(p,48); }
  function damageBoss(p,d){ if(!boss||boss.dying>0) return; boss.hp-=d; boss.hit=.06; if(p) p.score+=Math.round(d*2); if(boss.hp<=0){ boss.hp=0; boss.dying=2.6; EB=[]; E.forEach(e=>{ e.hp=0; }); if(p) p.score+=3000+si*800; sfx('boost'); } }
  const KM=[{u:['ArrowUp'],d:['ArrowDown'],l:['ArrowLeft'],r:['ArrowRight'],b:['KeyJ','Space','Enter']},{u:['KeyW'],d:['KeyS'],l:['KeyA'],r:['KeyD'],b:['KeyF','KeyG']}],ALL={u:['ArrowUp','KeyW'],d:['ArrowDown','KeyS'],l:['ArrowLeft','KeyA'],r:['ArrowRight','KeyD'],b:['KeyJ','Space','Enter','KeyF']};
  const readIn=h=>{ const m=local2?KM[h]:ALL,K2=env.keys,any=a=>a.some(k=>K2[k]); return {mx:(any(m.r)?1:0)-(any(m.l)?1:0),my:(any(m.d)?1:0)-(any(m.u)?1:0),b:m.b.some(k=>env.hit(k))}; };
  // 手指或滑鼠直接拖飛機
  let drag=null; const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const dn=e=>{ const q=toG(e),p=PL[local2?0:me]; drag={sx:q[0],sy:q[1],px:p.x,py:p.y,tx:q[0],ty:q[1]}; }; const mv=e=>{ if(drag){ const q=toG(e); drag.tx=q[0]; drag.ty=q[1]; } }; const up=()=>{ drag=null; };
  canvas.addEventListener('pointerdown',dn); addEventListener('pointermove',mv); addEventListener('pointerup',up);
  function stepPlayer(p,inp,dt){ if(p.dead) return; if(p.inv>0) p.inv-=dt; const sp=350;
    if(inp.dg){ p.x=clamp(inp.dg[0],16,W-16); p.y=clamp(inp.dg[1],60,H-22); } else { const l=Math.hypot(inp.mx,inp.my)||1; p.x=clamp(p.x+inp.mx/l*sp*dt,16,W-16); p.y=clamp(p.y+inp.my/l*sp*dt,60,H-22); }
    p.tilt=inp.mx||0; if(inp.b) bombAt(p);
    p.fire-=dt; if(p.fire<=0){ p.fire=.115; const L=p.lv,sh=(dx,a,dm,k)=>B.push({x:p.x+dx,y:p.y-22,vx:Math.sin(a)*760,vy:-Math.cos(a)*760,d:dm,o:p.i,k:k||0});
      if(L===1) sh(0,0,1); else if(L===2){ sh(-7,0,1); sh(7,0,1); } else if(L===3){ sh(0,0,1); sh(-9,-.1,1); sh(9,.1,1); } else if(L===4){ sh(-5,0,1); sh(5,0,1); sh(-14,-.14,1); sh(14,.14,1); } else { sh(-5,0,1.4); sh(5,0,1.4); sh(-14,-.13,1); sh(14,.13,1); sh(-20,-.3,1); sh(20,.3,1); }
      if(L>=4&&(p.mc=(p.mc||0)+1)%4===0){ for(const s of [-1,1]) B.push({x:p.x+s*22,y:p.y-4,vx:s*90,vy:-260,d:3,o:p.i,k:1}); } if(p.i===(local2?0:me)&&(p.sn=(p.sn||0)+1)%3===0) env.sfx('click'); }
    for(let i=PW.length-1;i>=0;i--){ const w=PW[i]; if(Math.hypot(w.x-p.x,w.y-p.y)<30){ PW.splice(i,1); if(w.k==='w'){ p.lv=Math.min(5,p.lv+1); } else if(w.k==='s') p.sh=1; else if(w.k==='b') p.bomb=Math.min(5,p.bomb+1); else p.score+=500; sfx('item'); fxB(w.x,w.y,POW[w.k][0],12,120,.4); } } }
  function kill(e,by){ blast(e.x,e.y,e.t==='tank'?70:e.r*1.5,e.t==='rock'?'#a89080':'#ff9d3d'); sfx(e.t==='tank'?'boom':'bump'); const p=PL[by]; if(p) p.score+=e.pts; kills++; const r=R(),dr=e.t==='tank'?.0:(kills%9===0?.1:r); if(e.t==='tank'||kills%9===0||r<.05){ const rr2=R(); PW.push({k:rr2<.55?'w':rr2<.78?'s':rr2<.93?'b':'c',x:e.x,y:e.y,vy:72}); } else if(dr<.14) PW.push({k:'c',x:e.x,y:e.y,vy:90}); }
  function step(dt){ t+=dt; clock+=dt; if(banT>0) banT-=dt; if(shake>0) shake=Math.max(0,shake-dt*24); if(flash>0) flash-=dt; if(warn>0) warn-=dt;
    if(!boss&&!bossDone&&clock<S.len){ spawnT-=dt; if(spawnT<=0&&clock>2) wave(); } else if(!boss&&!bossDone&&clock>=S.len&&!E.some(e=>e.y>0)) startBoss();
    if(boss) bossAI(dt);
    for(let h=0;h<np;h++){ const p=PL[h]; let inp; if(net) { inp=h===0?readIn(0):inN[h]; if(h===0&&drag){ inp=Object.assign({},inp,{dg:[drag.px+drag.tx-drag.sx,drag.py+drag.ty-drag.sy]}); } } else { inp=readIn(h); if(h===0&&drag) inp.dg=[drag.px+drag.tx-drag.sx,drag.py+drag.ty-drag.sy]; } stepPlayer(p,inp,dt); if(net&&h>0) inN[h].b=false; }
    for(const e of E){ e.ph+=dt; if(e.hit>0) e.hit-=dt; if(e.dv&&e.y>20&&!e.tg){ const a=aim(e.x,e.y); e.vx=Math.cos(a)*(170+K*60); e.vy=Math.sin(a)*(170+K*60); e.tg=1; e.a=a-Math.PI/2; }
      if(e.stop!=null&&e.y>=e.stop) e.vy=e.t==='gun'||e.t==='tank'||e.t==='spin'?0:e.vy; e.y+=e.vy*dt; e.x+=e.vx*dt; if(e.mx) e.x=e.x0+Math.sin(e.ph*1.6)*e.amp; if(e.rot) e.a+=e.rot*dt; if(e.t==='spin') e.a+=dt*2.4;
      e.cd-=dt; if(e.cd<=0&&e.y>0&&e.y<H*.7){ if(e.t==='gun'){ const a0=aim(e.x,e.y); const n=K>.85?3:1; for(let i=0;i<n;i++) shot(e.x,e.y+14,a0+(i-(n-1)/2)*.22,120+K*90,5); e.cd=2.1-K*.8; e.life=(e.life||0)+1; if(e.life>6) e.vy=70; } else if(e.t==='spin'){ const n=Math.round(5+K*5); for(let i=0;i<n;i++) shot(e.x,e.y,e.a+i/n*TAU,95+K*65,4,'#7ab8ff'); e.cd=2.3-K*.7; } else if(e.t==='tank'){ const a0=aim(e.x,e.y),n=Math.round(4+K*4); for(let i=0;i<n;i++) shot(e.x,e.y+20,a0+(i-(n-1)/2)*.18,110+K*80,6,'#ffd23f'); e.cd=2.2-K*.7; e.life=(e.life||0)+1; if(e.life>6) e.vy=50; } else if(K>.7&&e.t==='scout'&&R()<.35){ shot(e.x,e.y,aim(e.x,e.y),120+K*70,4); e.cd=2.5; } else e.cd=2.4; }
      for(const p of alive()) if(Math.hypot(e.x-p.x,e.y-p.y)<e.r*.7+6){ hurt(p); if(e.t!=='tank') e.hp=0; } }
    for(let i=B.length-1;i>=0;i--){ const b=B[i]; if(b.k===1){ let tg=null,dm=1e9; for(const e of E){ const q=Math.hypot(e.x-b.x,e.y-b.y); if(q<dm){ dm=q; tg=e; } } if(boss&&boss.y>=100&&!tg) tg=boss; if(tg){ const a=Math.atan2(tg.y-b.y,tg.x-b.x),v=460; b.vx+=(Math.cos(a)*v-b.vx)*dt*6; b.vy+=(Math.sin(a)*v-b.vy)*dt*6; } } b.x+=b.vx*dt; b.y+=b.vy*dt; if(b.y<-30||b.x<-30||b.x>W+30||b.y>H+20){ B.splice(i,1); continue; }
      let hit=false; for(const e of E){ if(e.y>-10&&Math.hypot(e.x-b.x,e.y-b.y)<e.r+3){ e.hp-=b.d; e.hit=.07; hit=true; break; } }
      if(!hit&&boss&&boss.y>=100&&Math.abs(b.x-boss.x)<118&&Math.abs(b.y-boss.y)<62){ damageBoss(PL[b.o],b.d); hit=true; }
      if(hit){ if(FX.length<320) FX.push({x:b.x,y:b.y,vx:(Math.random()-.5)*120,vy:60,l:.14,L:.14,c:'#fff',s:2.4}); B.splice(i,1); E=E.filter(e=>{ if(e.hp<=0){ kill(e,b.o); return false; } return true; }); } }
    E=E.filter(e=>e.hp>0&&e.y<H+60&&e.x>-90&&e.x<W+90||(e.hp<=0&&(kill(e,0),false)));
    for(let i=EB.length-1;i>=0;i--){ const b=EB[i]; b.x+=b.vx*dt; b.y+=b.vy*dt; if(b.x<-20||b.x>W+20||b.y<-20||b.y>H+20){ EB.splice(i,1); continue; } for(const p of alive()) if(Math.hypot(b.x-p.x,b.y-p.y)<b.r*.6+4){ hurt(p); EB.splice(i,1); break; } }
    for(let i=PW.length-1;i>=0;i--){ const w=PW[i]; w.y+=w.vy*dt; if(w.y>H+30) PW.splice(i,1); }
    if(over){ over.T-=dt; if(over.T<=0&&!ended){ ended=true; if(net) net.send({end:snapEnd()}); finish(); } }
  }
  const snapEnd=()=>({win:over.win,sc:PL.map(p=>p.score)});
  function finish(){ const total=PL.reduce((a,p)=>a+p.score,0),win=over.win; if(win&&!net){ try{ const k='arcade.space.w.'+si,o=+localStorage.getItem(k)||0; if(total>o) localStorage.setItem(k,String(total)); }catch(e){} } env.sfx(win?'win':'lose');
    env.end({title:win?S.name+' 突破！':'艦隊全滅',big:total+' 分',html:np>1?'<table class="ls"><tr><th>駕駛員</th><th>分數</th></tr>'+PL.map(p=>'<tr><td>'+p.name+'</td><td>'+p.score+'</td></tr>').join('')+'</table>':'',text:win?'擊敗 '+kills+' 架敵機':'撐到第 '+Math.floor(clock)+' 秒',score:!net?total:null,next:win&&!net&&si<STAGES.length-1}); }
  // 連線：房主算全部，傳快照；客人只送按鍵
  const R0=v=>Math.round(v);
  const pack=()=>({P:PL.map(p=>[R0(p.x),R0(p.y),p.lv,p.lives,p.bomb,p.inv>0?1:0,p.sh,p.score,p.dead?1:0]),E:E.map(e=>[e.t,R0(e.x),R0(e.y),e.hit>0?1:0,+(e.a||0).toFixed(1),R0(e.vx),R0(e.vy)]),B:B.map(b=>[R0(b.x),R0(b.y),b.k,R0(b.vx),R0(b.vy)]).slice(0,70),X:EB.map(b=>[R0(b.x),R0(b.y),R0(b.vx),R0(b.vy),b.r,b.c]).slice(0,180),W:PW.map(w=>[w.k,R0(w.x),R0(w.y)]),Bo:boss?[R0(boss.x),R0(boss.y),boss.hp,boss.hpM,boss.hit>0?1:0,boss.beam>0?+boss.beam.toFixed(2):0,R0(boss.bx),boss.dying>0?1:0]:null,ev:evq,sh:+shake.toFixed(1),fl:+flash.toFixed(2),wn:+warn.toFixed(1),ck:+clock.toFixed(1)});
  if(net){ if(client) net.onmsg=m=>{ if(m.end){ over={win:m.end.win,T:0}; m.end.sc.forEach((v,i)=>{ PL[i].score=v; }); if(!ended){ ended=true; finish(); } return; } if(!m.s) return; const s=m.s; s.P.forEach((a,i)=>{ const p=PL[i]; p.tx=a[0]; p.ty=a[1]; p.lv=a[2]; p.lives=a[3]; p.bomb=a[4]; p.inv=a[5]?1:0; p.sh=a[6]; p.score=a[7]; p.dead=!!a[8]; });
        for(const a of s.E) { if(!a.done) a.done=1; } const old=E; E=s.E.map(a=>({t:a[0],x:a[1],y:a[2],hit:a[3],a:a[4],vx:a[5],vy:a[6]})); B=s.B.map(a=>({x:a[0],y:a[1],k:a[2],vx:a[3],vy:a[4]})); EB=s.X.map(a=>({x:a[0],y:a[1],vx:a[2],vy:a[3],r:a[4],c:a[5]})); PW=s.W.map(a=>({k:a[0],x:a[1],y:a[2]})); boss=s.Bo?{x:s.Bo[0],y:s.Bo[1],hp:s.Bo[2],hpM:s.Bo[3],hit:s.Bo[4],beam:s.Bo[5],bx:s.Bo[6],dying:s.Bo[7]}:null; if(s.sh>shake) shake=s.sh; if(s.fl>flash) flash=s.fl; warn=s.wn; clock=s.ck; for(const n of s.ev){ env.sfx(n); } if(old.length>E.length) for(const e of old){ if(!E.some(q=>Math.hypot(q.x-e.x,q.y-e.y)<40)) blast(e.x,e.y,22,'#ff9d3d'); } };
    else net.onmsg=(m,from)=>{ if(m.i&&inN[from]){ inN[from].mx=m.i[0]; inN[from].my=m.i[1]; if(m.i[2]) inN[from].b=true; if(m.i[3]) inN[from].dg=m.i[3]; else inN[from].dg=null; } }; for(let i=0;i<4;i++) inN[i]={mx:0,my:0,b:false}; }
  function update(dt){ if(ended) return; dt=Math.min(dt,.05);
    if(client){ t+=dt; if(shake>0) shake=Math.max(0,shake-dt*24); if(flash>0) flash-=dt; if(banT>0) banT-=dt; const I=readIn(0); const dg=drag?[R0(drag.px+drag.tx-drag.sx),R0(drag.py+drag.ty-drag.sy)]:0; if(I.b) inN.b=1; sendT-=dt; if(sendT<=0){ sendT=1/20; net.send({i:[I.mx,I.my,inN.b?1:0,dg]}); inN.b=0; }
      for(const p of PL) if(p.tx!=null){ p.x+=(p.tx-p.x)*Math.min(1,dt*16); p.y+=(p.ty-p.y)*Math.min(1,dt*16); } const pm=PL[me]; if(!pm.dead){ const l=Math.hypot(I.mx,I.my)||1; pm.x=clamp(pm.x+I.mx/l*260*dt,16,W-16); pm.y=clamp(pm.y+I.my/l*260*dt,60,H-22); pm.tilt=I.mx; }
      for(const a of [EB,B,E]) for(const b of a){ b.x+=(b.vx||0)*dt; b.y+=(b.vy||0)*dt; } } else { step(dt); if(net){ snapT-=dt; if(snapT<=0){ snapT=1/12; net.send({s:pack()}); evq=[]; } } }
    for(let i=FX.length-1;i>=0;i--){ const f=FX[i]; f.l-=dt; if(f.l<=0){ FX.splice(i,1); continue; } if(!f.ring){ f.x+=f.vx*dt; f.y+=f.vy*dt; f.vx*=.97; f.vy*=.97; } } }
  function draw(){ c.save(); if(shake>0) c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake); drawBg(c,si,t);
    for(const w of PW) put(c,powSpr(w.k),w.x,w.y+Math.sin(t*5+w.x)*2);
    if(boss){ const b=boss; if(b.beam>0){ const on=b.beam<.9,w=on?44:3+Math.sin(t*50)*2; const g=c.createLinearGradient(b.bx-w,0,b.bx+w,0); g.addColorStop(0,'rgba(255,60,120,0)'); g.addColorStop(.5,on?'#fff':'#ff5d8f'); g.addColorStop(1,'rgba(255,60,120,0)'); c.fillStyle=g; c.fillRect(b.bx-w,b.y,w*2,H); } if(!b.dying||Math.sin(t*50)>-.4){ put(c,bossSpr(si,S.boss),b.x,b.y+Math.sin(t*2)*4); if(b.hit>0){ c.globalCompositeOperation='lighter'; c.globalAlpha=.55; put(c,bossSpr(si,S.boss),b.x,b.y); c.globalAlpha=1; c.globalCompositeOperation='source-over'; } } }
    for(const e of E){ const s=foeSpr(e.t,FOE[e.t].col); put(c,s,e.x,e.y,e.a||.0001); if(e.hit>0){ c.globalCompositeOperation='lighter'; put(c,s,e.x,e.y,e.a||.0001); c.globalCompositeOperation='source-over'; } }
    for(const b of B){ if(b.k===1) put(c,missSpr(),b.x,b.y,Math.atan2(b.vy,b.vx)+Math.PI/2); else put(c,beamSpr(PL[b.o]?PL[b.o].col:PL[0].col),b.x,b.y+6,Math.atan2(b.vy,b.vx)+Math.PI/2); }
    for(const p of PL){ if(p.dead) continue; if(p.inv>0&&Math.floor(t*14)%2) continue; const fl=8+Math.sin(t*50)*3; c.fillStyle='#ffb02a'; c.beginPath(); c.moveTo(p.x-4,p.y+26); c.lineTo(p.x+4,p.y+26); c.lineTo(p.x,p.y+26+fl*1.8); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.moveTo(p.x-2,p.y+26); c.lineTo(p.x+2,p.y+26); c.lineTo(p.x,p.y+26+fl); c.fill();
      c.save(); c.translate(p.x,p.y); c.scale(1-Math.abs(p.tilt||0)*.14,1); put(c,shipSpr(p.col,p.ship),0,0); c.restore(); if(p.sh>0){ c.strokeStyle='rgba(61,219,217,'+(.5+.3*Math.sin(t*6))+')'; c.lineWidth=3; c.beginPath(); c.arc(p.x,p.y,36,0,TAU); c.stroke(); } c.fillStyle='#fff'; c.beginPath(); c.arc(p.x,p.y,3,0,TAU); c.fill(); c.strokeStyle=p.col; c.lineWidth=1.4; c.stroke();
      if(np>1||t<3.2){ const lab=np>1?p.name.slice(0,6):'你'; if(np>1||t<3.2){ c.font='900 11px '+TC; c.textAlign='center'; c.textBaseline='bottom'; c.lineWidth=3; c.strokeStyle='#0b0a1c'; c.strokeText(lab,p.x,p.y-38); c.fillStyle=p.col; c.fillText(lab,p.x,p.y-38); } } }
    for(const b of EB) put(c,ebSpr(b.c,b.r),b.x,b.y);
    for(const f of FX){ const a=f.l/f.L; if(f.ring){ c.globalAlpha=a; c.strokeStyle=f.c; c.lineWidth=2+a*7; c.beginPath(); c.arc(f.x,f.y,lerp(f.R,f.r,a),0,TAU); c.stroke(); c.globalAlpha=1; } else { c.globalAlpha=a; c.fillStyle=f.c; c.fillRect(f.x-f.s/2,f.y-f.s/2,f.s,f.s); c.globalAlpha=1; } }
    c.restore(); if(flash>0){ c.fillStyle='rgba(255,255,255,'+Math.min(.85,flash)+')'; c.fillRect(0,0,W,H); }
    // 介面
    c.fillStyle='rgba(6,8,24,.68)'; rr(c,8,8,250,46,10); c.fill(); const P=PL[client||net?me:0]; c.textAlign='left'; c.textBaseline='middle'; c.fillStyle='#fff'; c.font='900 15px '+PIX; c.fillText(String(PL.reduce((a,p)=>a+p.score,0)).padStart(7,'0'),16,22); c.font='700 11px '+TC; c.fillStyle='#ffd23f'; c.fillText('武器 Lv.'+P.lv,16,43); for(let i=0;i<P.lives;i++){ c.save(); c.translate(116+i*16,43); c.scale(.2,.2); put(c,shipSpr(P.col,P.ship),0,0); c.restore(); } for(let i=0;i<P.bomb;i++){ put(c,powSpr('b'),186+i*14,43,0,.46); }
    c.textAlign='right'; c.fillStyle='rgba(6,8,24,.68)'; rr(c,W-168,8,160,26,9); c.fill(); c.fillStyle='#cfe8ff'; c.font='900 12px '+TC; c.fillText(S.name,W-16,21);
    if(!boss&&!bossDone){ c.fillStyle='rgba(255,255,255,.2)'; c.fillRect(W-168,38,160,5); c.fillStyle=S.neb; c.fillRect(W-168,38,160*Math.min(1,clock/S.len),5); }
    if(boss){ c.fillStyle='rgba(6,8,24,.75)'; rr(c,270,12,260,18,8); c.fill(); const k=clamp(boss.hp/boss.hpM,0,1),g=c.createLinearGradient(274,0,526,0); g.addColorStop(0,'#ff3b6b'); g.addColorStop(1,'#ffb02a'); c.fillStyle=g; rr(c,274,16,252*k+1,10,5); c.fill(); c.fillStyle='#fff'; c.font='900 10px '+TC; c.textAlign='center'; c.fillText('BOSS',W/2,21); }
    if(warn>0&&Math.floor(t*5)%2){ c.fillStyle='rgba(255,40,70,.18)'; c.fillRect(0,H/2-40,W,80); c.fillStyle='#ff5d7a'; c.font='900 38px '+PIX; c.textAlign='center'; c.fillText('WARNING',W/2,H/2); }
    if(banT>0){ c.globalAlpha=Math.min(1,banT); c.fillStyle='#fff'; c.font='900 34px '+TC; c.textAlign='center'; c.lineWidth=7; c.strokeStyle='#0b0a1c'; c.strokeText('第 '+(si+1)+' 區　'+S.name,W/2,H*.38); c.fillText('第 '+(si+1)+' 區　'+S.name,W/2,H*.38); c.globalAlpha=1; } }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',dn); removeEventListener('pointermove',mv); removeEventListener('pointerup',up); },_dbg:{PL,get E(){return E;},get boss(){return boss;},get clock(){return clock;},set clock(v){clock=v;},get over(){return over;}}};
}
function stageShow(ctx,w,h,si,t){ ctx.save(); ctx.scale(w/W,h/H); drawBg(ctx,si,t); const S=STAGES[si]; put(ctx,bossSpr(si,S.boss),W/2,120+Math.sin(t*1.2)*8); for(let i=0;i<7;i++){ const a=t*.9+i/7*TAU; put(ctx,ebSpr('#ff5d8f',5),W/2+Math.cos(a)*(90+((t*50)%140)),130+Math.sin(a)*(90+((t*50)%140))); } put(ctx,shipSpr('#3ddbd9','0'),W/2+Math.sin(t)*150,H-90); for(let i=0;i<6;i++) put(ctx,beamSpr('#3ddbd9'),W/2+Math.sin(t)*150,H-120-((t*700+i*60)%340)); ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle='rgba(6,8,24,.7)'; rr(ctx,14,14,290,48,10); ctx.fill(); ctx.fillStyle='#ffd23f'; ctx.font='900 26px '+TC; ctx.fillText(S.name+'　'+'★'.repeat(S.stars),28,38); ctx.restore(); }
function thumb(ctx,w,h,t){ stageShow(ctx,w,h,3,t); }
function preview(ctx,w,h,L,t){ L=L||{}; ctx.save(); ctx.scale(w/W,h/H); drawBg(ctx,0,t); put(ctx,shipSpr(L.color||'#3ddbd9',L.ship||'0'),W/2,H/2,0,3); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).space={
  name:'太空艦隊',tag:'STAR FLEET',color:'#6fb4ff',online:true,maxPlayers:4,
  desc:'縱向捲軸射擊：戰機會自動開火，你只要閃子彈、撿武器，每個星域的最後打巨大的王。可以雙人或連線一起打。',
  goal:'躲開子彈撐到王出現，打倒王就過關。撿「武」升級武器、「盾」擋一次、「爆」多一顆炸彈。',
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),stageShow,stageGoal:si=>STAGES[si].name+'：撐過敵機，打倒最後的王。白點是你的中彈位置，只有那裡被打到才算。',
  stageBest:i=>{ try{ const v=localStorage.getItem('arcade.space.w.'+i); return v?'最高 '+v:''; }catch(e){ return ''; } },
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['↑ ↓ ← →','移動（自動開火，也可以用滑鼠拖）'],['J 或 空白鍵','放炸彈：清光子彈'],['雙人','2P：WASD 移動、F 炸彈']],
  touchHelp:[['手指拖曳','移動戰機（自動開火）'],['炸彈','清光畫面上的子彈']],
  touch:{left:'dpad',right:[{l:'炸彈',c:'KeyJ',act:true}]},
  best:{label:'最高分',fmt:v=>v+' 分',lower:false},
  looks:[{key:'color',label:'機身顏色',type:'color',opts:['#3ddbd9','#ffd23f','#ff7eb6','#86dc4f','#ff7a3d','#b98cff','#e8ecf4','#4f9dff']},{key:'ship',label:'機型',opts:[{id:'0',label:'突擊型'},{id:'1',label:'三角翼'},{id:'2',label:'前掠翼'}]}],
  thumb,preview,create};
})();
