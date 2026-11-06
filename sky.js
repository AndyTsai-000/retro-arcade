// 雲端纏鬥：Q 版小飛機一對一空戰。飛機會一直往前飛，← → 轉彎、按住開火、撿到導彈可以發射追蹤導彈；先擊落對手 3 次獲勝。
// 畫面左右、上下是相通的（從右邊飛出去會從左邊出來）。躲進雲裡對手比較難瞄準、導彈也會跟丟。
// 連線時房主負責運算，加入的人只送出按鍵。
(function(){
'use strict';
const W=800,H=450,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,KILLS=3;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,r1=v=>Math.round(v*10)/10,hyp=Math.hypot;
const wrapD=(d,L)=>d>L/2?d-L:d<-L/2?d+L:d,angD=a=>{ a=(a+Math.PI)%TAU; if(a<0) a+=TAU; return a-Math.PI; };
function shade(hex,k){ const n=parseInt(hex.slice(1),16); let r=n>>16,g=n>>8&255,b=n&255; const f=v=>clamp(Math.round(k>0?v+(255-v)*k:v*(1+k)),0,255); return 'rgb('+f(r)+','+f(g)+','+f(b)+')'; }
const ST0=[['晨曦海灣','sea','王牌小鷹','#ffb02a'],['棉花糖雲海','cloud','泡泡機長','#ff7eb6'],['夕陽群島','sunset','赤尾燕','#ff5a3a'],['沙漠熱流','desert','黃沙蠍','#d8a040'],['冰山海域','ice','雪鴞','#9adcff'],
  ['雷雨雲層','storm','雷霆鷲','#8a96a8'],['火山灰天空','volcano','熔岩隼','#c8202a'],['極光夜空','night','夜梟','#b98cff'],['颱風眼','typhoon','颶風號','#3ddbd9'],['平流層決戰','strato','天空王者','#ffd23f']];
const STAGES=ST0.map(([name,th,opp,col],i)=>{ const k=i/9; return {name,th,opp,col,stars:1+Math.round(k*4),err:.5-.42*k,turn:1.7+1.1*k,range:220+120*k,fire:.45+.5*k,miss:.25+.7*k,evade:.15+.75*k,
  wind:th==='storm'?[30,0]:th==='typhoon'?[0,0]:[0,0],clouds:th==='cloud'?9:th==='strato'?3:th==='storm'||th==='typhoon'?7:5}; });
const TIPS=['對手轉彎很慢，繞到他後面開火。','雲特別多，躲進雲裡對手就打不準。','對手開始會閃了，別直直追。','對手比較會追人，記得撿導彈。','對手轉彎變快，用急轉彎甩掉他。','暴風會把飛機往右吹，還會打雷。','對手很會躲子彈，靠近一點再開火。','夜裡看不清楚，跟著對手的機尾燈。','颱風會把飛機往中間捲，對手也很強。','最強的王牌飛行員，導彈、閃避都一流。'];
const hasWin=i=>{ try{ return localStorage.getItem('arcade.sky.w.'+i)==='1'; }catch(e){ return false; } };
const recWin=i=>{ try{ localStorage.setItem('arcade.sky.w.'+i,'1'); }catch(e){} };
const TH={sea:{sky:['#7cc8ff','#2a8ad8'],land:'#5fbf60',sand:'#f3d892'},cloud:{sky:['#ffd8ef','#a8c8ff'],land:'#c8e8a0',sand:'#fff2c8'},sunset:{sky:['#ffb070','#a04a6a'],land:'#4a8a4a',sand:'#e8b070'},
  desert:{sky:['#f4d090','#d89a50'],land:'#c88a40',sand:'#e8c070',desert:1},ice:{sky:['#d8f2ff','#5aa8d8'],land:'#f4fbff',sand:'#d8eefc'},storm:{sky:['#5a6a7a','#2a3440'],land:'#3a6a4a',sand:'#8a8a70'},
  volcano:{sky:['#5a3a3a','#2a1818'],land:'#3a2a2a',sand:'#5a4a3a',lava:1},night:{sky:['#1a2050','#06081a'],land:'#1a3a2a',sand:'#2a3a3a',night:1},typhoon:{sky:['#4a7a9a','#1a3a5a'],land:'#2a6a4a',sand:'#6a8a7a'},
  strato:{sky:['#3a6ad8','#0a1a4a'],land:'#4a7aa8',sand:'#8aa8c8',high:1}};
// ---- 地面（事先畫好）：海、島、沙漠、冰山… ----
const GC={}; function ground(th){ if(GC[th]) return GC[th]; const T=TH[th],cv=document.createElement('canvas'); cv.width=W; cv.height=H; const c=cv.getContext('2d');
  let sd=th.length*977; const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;
  const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,T.sky[0]); g.addColorStop(1,T.sky[1]); c.fillStyle=g; c.fillRect(0,0,W,H);
  if(T.desert){ for(let i=0;i<14;i++){ c.fillStyle='rgba(160,100,40,.25)'; c.beginPath(); c.ellipse(rnd()*W,rnd()*H,80+rnd()*120,20+rnd()*30,rnd()*.6,0,TAU); c.fill(); } }
  else if(!T.high){ c.fillStyle='rgba(255,255,255,.12)'; for(let i=0;i<70;i++){ const x=rnd()*W,y=rnd()*H; c.fillRect(x,y,14+rnd()*20,2); } }
  const isl=T.high?0:T.desert?2:6; for(let i=0;i<isl;i++){ const x=rnd()*W,y=rnd()*H,r=30+rnd()*50; c.fillStyle=T.sand; c.beginPath(); for(let k=0;k<=16;k++){ const a=k/16*TAU,rr=r*(.88+.14*Math.sin(k*2.3+i)); c.lineTo(x+Math.cos(a)*rr*1.2,y+Math.sin(a)*rr*.8); } c.fill();
    c.fillStyle=T.land; c.beginPath(); for(let k=0;k<=16;k++){ const a=k/16*TAU,rr=r*.75*(.88+.14*Math.sin(k*2.3+i)); c.lineTo(x+Math.cos(a)*rr*1.2,y+Math.sin(a)*rr*.8); } c.fill();
    if(T.lava){ c.fillStyle='#ff5a1a'; c.beginPath(); c.arc(x,y,r*.25,0,TAU); c.fill(); c.fillStyle='#ffd23f'; c.beginPath(); c.arc(x,y,r*.12,0,TAU); c.fill(); }
    else if(th==='ice'){ c.fillStyle='#fff'; c.beginPath(); c.moveTo(x-r*.4,y+r*.2); c.lineTo(x,y-r*.6); c.lineTo(x+r*.45,y+r*.2); c.fill(); }
    else { c.fillStyle=shade(T.land,-.3); for(let k=0;k<5;k++){ c.beginPath(); c.arc(x+(rnd()-.5)*r,y+(rnd()-.5)*r*.6,6+rnd()*5,0,TAU); c.fill(); } } }
  if(T.night){ for(let i=0;i<40;i++){ c.fillStyle='rgba(255,220,140,'+(.4+rnd()*.5)+')'; c.fillRect(rnd()*W,rnd()*H,2,2); } }
  if(T.high){ for(let i=0;i<60;i++){ c.fillStyle='rgba(255,255,255,'+rnd()*.7+')'; c.fillRect(rnd()*W,rnd()*H,1.5,1.5); } }
  GC[th]=cv; return cv; }
// ---- Q 版小飛機：圓胖機身、大螺旋槳、飛行員戴護目鏡、圍巾飄 ----
function plane(c,x,y,a,col,t,o){ o=o||{}; const s=o.s||1; c.save(); c.translate(x,y); c.rotate(a); c.scale(s,s); const bank=o.bank||0;
  c.lineJoin='round'; c.strokeStyle='#14122b'; c.lineWidth=2.4;
  // 尾翼
  c.fillStyle=shade(col,-.2); c.beginPath(); c.moveTo(-22,0); c.lineTo(-34,-14+bank*3); c.lineTo(-30,0); c.lineTo(-34,14+bank*3); c.closePath(); c.fill(); c.stroke();
  // 主翼（轉彎時一邊大一邊小，像在傾斜）
  c.fillStyle=col; c.beginPath(); c.moveTo(4,-4); c.quadraticCurveTo(-2,-30-bank*6,-12,-32-bank*6); c.lineTo(-14,-4); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(4,4); c.quadraticCurveTo(-2,30-bank*6,-12,32-bank*6); c.lineTo(-14,4); c.closePath(); c.fill(); c.stroke();
  c.fillStyle='#fff'; c.beginPath(); c.arc(-6,-20-bank*4,4,0,TAU); c.arc(-6,20-bank*4,4,0,TAU); c.fill();
  // 機身
  const bg=c.createLinearGradient(0,-10,0,10); bg.addColorStop(0,shade(col,.4)); bg.addColorStop(1,shade(col,-.25)); c.fillStyle=bg; c.beginPath(); c.ellipse(0,0,26,11,0,0,TAU); c.fill(); c.stroke();
  c.fillStyle='#e8e8f0'; c.beginPath(); c.ellipse(24,0,6,8,0,0,TAU); c.fill(); c.stroke(); /* 機鼻 */
  // 螺旋槳
  c.fillStyle='rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(30,0,3,15,0,0,TAU); c.fill(); c.strokeStyle='rgba(20,18,43,.6)'; c.lineWidth=2; const pa=t*60; c.beginPath(); c.moveTo(30,Math.sin(pa)*15); c.lineTo(30,-Math.sin(pa)*15); c.stroke();
  // 飛行員
  c.fillStyle='#ffd9b8'; c.strokeStyle='#14122b'; c.lineWidth=2; c.beginPath(); c.arc(2,0,7,0,TAU); c.fill(); c.stroke();
  c.fillStyle='#6a3a1a'; c.beginPath(); c.arc(0,0,7,Math.PI*.6,Math.PI*1.4); c.fill();
  c.fillStyle='#7ae8ff'; c.beginPath(); c.arc(6,-3,2.6,0,TAU); c.arc(6,3,2.6,0,TAU); c.fill(); c.strokeStyle='#5a3a1a'; c.lineWidth=1.4; c.stroke(); /* 護目鏡 */
  c.strokeStyle=o.scarf||'#ff4d4d'; c.lineWidth=3; c.lineCap='round'; c.beginPath(); c.moveTo(-4,2); c.quadraticCurveTo(-14,4+Math.sin(t*14)*4,-22,2+Math.sin(t*14+1)*6); c.stroke(); /* 圍巾 */
  if(o.light){ c.fillStyle=Math.sin(t*8)>0?'#ff3a3a':'#7aff7a'; c.beginPath(); c.arc(-34,0,2.6,0,TAU); c.fill(); }
  c.restore(); }
function cloudShape(c,cl,alpha){ c.globalAlpha=alpha; c.fillStyle='#fff'; for(const b of cl.b){ c.beginPath(); c.arc(cl.x+b[0],cl.y+b[1],b[2],0,TAU); c.fill(); } c.globalAlpha=1; }
const inCloud=(cls,x,y)=>cls.some(cl=>cl.b.some(b=>{ const dx=wrapD(x-(cl.x+b[0]),W),dy=wrapD(y-(cl.y+b[1]),H); return dx*dx+dy*dy<b[2]*b[2]*.7; }));
function mkClouds(n,seed){ let sd=seed*7919+13; const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647; const a=[];
  for(let i=0;i<n;i++){ const b=[]; const k=3+Math.floor(rnd()*4); for(let j=0;j<k;j++) b.push([(rnd()-.5)*90,(rnd()-.5)*36,26+rnd()*22]); a.push({x:rnd()*W,y:rnd()*H,vx:12+rnd()*14,b}); } return a; }

function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,host=!!net&&net.host,pv=!!opts.preview,two=!net&&opts.mode==='2p',me=net?Math.min(1,net.me):0,vsHuman=!!net&&net.count>1;
  const si=clamp(opts.stage|0,0,STAGES.length-1),ST=STAGES[si],T=TH[ST.th],{ctx:c}=env.canvas2d(W,H);
  const names=net?[net.names[0]||'玩家 1',vsHuman?(net.names[1]||'玩家 2'):ST.opp]:two?['1P','2P']:[pv?'王牌':'你',ST.opp];
  const lk=i=>net?(net.looks&&net.looks[i])||{}:i===0?(opts.look||{}):two?{color:'#3d8bff'}:{color:ST.col};
  const COLS=[lk(0).color||'#ff5d4f',lk(1).color||ST.col]; if(COLS[0]===COLS[1]) COLS[1]='#3d8bff';
  const mk=n=>({n,x:n?600:200,y:225,a:n?Math.PI:0,hp:100,kills:0,miss:1,cd:0,mcd:0,dead:0,inv:1.5,turn:0,smk:0,col:COLS[n],scarf:n?'#ffd23f':'#ff4d4d',ai:pv||n===1&&!two&&!vsHuman,aiT:0,aiJ:0,aiE:0,hitT:0});
  const P=[mk(0),mk(1)],B=[],M=[],fx=[],items=[];
  let clouds=mkClouds(ST.clouds,si+1),t=0,shake=0,ban=null,over=0,ended=false,itemT=6,flash=0,ev=[],sendT=0,start=pv?.3:1.6;
  const rin={dx:0,fire:false,miss:false};
  const sfx=n=>{ if(pv) return; env.sfx(n); if(host) ev.push(n); };
  const say=(txt,col)=>{ ban={txt,col:col||'#ffd23f',t:0}; if(host) ev.push('b:'+txt+'|'+(col||'')); };
  function inputOf(p){ const k=env.keys; if(p.ai) return aiIn(p);
    if(two){ if(p.n===0) return {dx:(k.KeyD?1:0)-(k.KeyA?1:0),fire:!!k.KeyF,miss:env.hit('KeyG')}; return {dx:(k.ArrowRight?1:0)-(k.ArrowLeft?1:0),fire:!!(k.Comma||k.Enter),miss:env.hit('Period')||env.hit('ShiftRight')}; }
    if(p.n===1){ const o={dx:rin.dx,fire:rin.fire,miss:rin.miss}; rin.miss=false; return o; }
    return {dx:(k.ArrowRight||k.KeyD?1:0)-(k.ArrowLeft||k.KeyA?1:0),fire:!!(k.KeyJ||k.Space),miss:env.hit('KeyK')}; }
  // 電腦：瞄準對手的前方追上去，被咬住尾巴時急轉閃避；瞄準了就開火，有導彈就打
  function aiIn(p){ const o=P[1-p.n],S=pv?STAGES[6]:ST; if(o.dead>0) return {dx:Math.sin(t+p.n)>0?1:0,fire:false,miss:false};
    const dx=wrapD(o.x-p.x,W),dy=wrapD(o.y-p.y,H),d=hyp(dx,dy),lead=d/520,tx=dx+Math.cos(o.a)*170*lead,ty=dy+Math.sin(o.a)*170*lead;
    p.aiT-=1/60; if(p.aiT<=0){ p.aiT=.5+Math.random()*.6; p.aiE=(Math.random()-.5)*S.err*1.6; }
    let want=Math.atan2(ty,tx)+p.aiE,hidden=inCloud(clouds,o.x,o.y);
    const behind=Math.abs(angD(Math.atan2(-dy,-dx)-o.a))<.4&&d<260; /* 對手在我後面咬著 */
    if(behind&&Math.random()<S.evade*.04) p.aiJ=.6+Math.random()*.5; if(p.aiJ>0){ p.aiJ-=1/60; want=p.a+(p.n?1:-1)*1.5; }
    const e=angD(want-p.a),dxo=Math.abs(e)<.06?0:Math.sign(e)*Math.min(1,S.turn/2.8);
    const kk=(S.turn-1.7)/1.1,aimed=Math.abs(angD(Math.atan2(dy,dx)-p.a))<.13+.14*kk+S.err*.3&&d<S.range&&!hidden; /* 後面的對手開火角度比較大方 */
    return {dx:dxo,fire:aimed&&Math.random()<S.fire+.3,miss:p.miss>0&&aimed&&d>140&&Math.random()<S.miss*.03}; }
  function boom(x,y,big){ for(let i=0;i<(big?36:10);i++){ const q=Math.random()*TAU,s=40+Math.random()*(big?220:90); fx.push({k:'sp',x,y,vx:Math.cos(q)*s,vy:Math.sin(q)*s,l:.3+Math.random()*.4,L:.7,c:['#fff6c0','#ffd23f','#ff7a3d','#ff4d4d'][i%4]}); }
    fx.push({k:'fire',x,y,r:big?60:22,l:big?.6:.25,L:big?.6:.25}); if(big){ fx.push({k:'ring',x,y,r:110,l:.5,L:.5}); for(let i=0;i<8;i++){ const q=Math.random()*TAU; fx.push({k:'deb',x,y,vx:Math.cos(q)*140,vy:Math.sin(q)*140,r:Math.random()*6,l:1,L:1}); } for(let i=0;i<10;i++) fx.push({k:'smk',x:x+(Math.random()-.5)*30,y:y+(Math.random()-.5)*30,r:16,l:1.4,L:1.4}); } }
  function hurt(p,dmg,by){ if(p.dead>0||p.inv>0) return; p.hp-=dmg; p.hitT=.15; if(p.hp<=0){ p.hp=0; p.dead=2.2; P[by].kills++; boom(p.x,p.y,true); shake=.45; sfx('boom'); say(names[by]+' 擊落！',by===0?'#ffd23f':'#7ae8ff');
      if(P[by].kills>=KILLS) over=.001; } }
  function conclude(){ if(ended) return; ended=true; if(pv){ env.end({}); return; } const w=P[0].kills>P[1].kills?0:1,mine=two||w===me;
    if(!two&&!net&&w===0) recWin(si); env.sfx(mine?'win':'lose');
    env.end({title:two?(w?'2P':'1P')+' 獲勝！':mine?'你贏了！':names[w]+' 獲勝',big:P[0].kills+' : '+P[1].kills,text:two||net?'':ST.name+'：'+(mine?'空中王牌！':'躲進雲裡、繞到對手後面再開火。'),score:null,next:!two&&!net&&w===0&&si<STAGES.length-1}); }
  function snap(){ const m={s:[P.map(p=>[r1(p.x),r1(p.y),r1(p.a),Math.round(p.hp),p.kills,p.miss,r1(p.dead),r1(p.inv),r1(p.turn)]),B.map(b=>[r1(b.x),r1(b.y),r1(b.a),b.o]),M.map(m2=>[r1(m2.x),r1(m2.y),r1(m2.a)]),items.map(it=>[r1(it.x),r1(it.y),it.k]),clouds.map(cl=>r1(cl.x))],e:ev}; ev=[]; return m; }
  if(net){
    if(client) net.onmsg=m=>{ if(m.s){ const s=m.s; s[0].forEach((a,i)=>{ const p=P[i]; if(p.dead<=0&&a[6]>0) boom(a[0],a[1],true); p.tx=a[0]; p.ty=a[1]; p.ta=a[2]; p.hp=a[3]; p.kills=a[4]; p.miss=a[5]; p.dead=a[6]; p.inv=a[7]; p.turn=a[8]; });
        B.length=0; for(const b of s[1]) B.push({x:b[0],y:b[1],a:b[2],o:b[3]}); M.length=0; for(const q of s[2]) M.push({x:q[0],y:q[1],a:q[2]}); items.length=0; for(const q of s[3]) items.push({x:q[0],y:q[1],k:q[2]}); s[4].forEach((x,i)=>{ if(clouds[i]) clouds[i].x=x; });
        for(const e of m.e){ if(e.startsWith('b:')){ const [tx,cl]=e.slice(2).split('|'); ban={txt:tx,col:cl||'#ffd23f',t:0}; } else env.sfx(e); } }
      else if(m.end){ P[0].kills=m.end[0]; P[1].kills=m.end[1]; conclude(); } };
    else { net.onmsg=(m,from)=>{ if(from===1&&m.i){ rin.dx=m.i[0]; rin.fire=!!m.i[1]; if(m.i[2]) rin.miss=true; } };
      net.onleave=i=>{ if(i===1&&!ended){ P[0].kills=KILLS; net.send({end:[P[0].kills,P[1].kills]}); conclude(); } }; }
  }
  function step(dt){ t+=dt; if(shake>0) shake-=dt; if(ban) ban.t+=dt; if(flash>0) flash-=dt;
    for(const cl of clouds){ cl.x=(cl.x+cl.vx*dt+W)%W; }
    if(ST.th==='storm'&&Math.random()<dt*.18){ flash=.25; sfx('boom'); }
    for(let i=fx.length-1;i>=0;i--){ const e=fx[i]; e.l-=dt; if(e.vx!=null){ e.x+=e.vx*dt; e.y+=e.vy*dt; e.vx*=.97; e.vy*=.97; } if(e.k==='deb') e.r+=dt*8; if(e.l<=0) fx.splice(i,1); }
    if(start>0){ start-=dt; if(start<=0){ say('起飛！'); sfx('go'); } else return; }
    if(over){ over+=dt; if(over>1.6){ if(host){ net.send(snap()); net.send({end:[P[0].kills,P[1].kills]}); } conclude(); } }
    for(const p of P){ const i=inputOf(p);
      if(p.dead>0){ p.dead-=dt; if(p.dead<=0&&!over){ p.hp=100; p.inv=2; p.x=p.n?W-60:60; p.y=40+Math.random()*(H-80); p.a=p.n?Math.PI:0; p.miss=Math.max(p.miss,1); sfx('item'); } continue; }
      if(p.inv>0) p.inv-=dt; if(p.cd>0) p.cd-=dt; if(p.mcd>0) p.mcd-=dt; if(p.hitT>0) p.hitT-=dt;
      p.turn+=(i.dx-p.turn)*Math.min(1,dt*10); p.a+=p.turn*2.8*dt;
      let sp=175; if(ST.th==='typhoon'){ const ex=W/2-p.x,ey=H/2-p.y,d=hyp(ex,ey)||1; p.x+=(-ey/d*40+ex/d*14)*dt; p.y+=(ex/d*40+ey/d*14)*dt; }
      p.x=(p.x+(Math.cos(p.a)*sp+ST.wind[0])*dt+W)%W; p.y=(p.y+(Math.sin(p.a)*sp+ST.wind[1])*dt+H)%H;
      if(i.fire&&p.cd<=0&&!over){ p.cd=.11; const side=(Math.floor(t*18)%2?1:-1)*6; B.push({x:p.x+Math.cos(p.a)*30-Math.sin(p.a)*side,y:p.y+Math.sin(p.a)*30+Math.cos(p.a)*side,a:p.a+(Math.random()-.5)*.04,o:p.n,l:.85}); fx.push({k:'mz',x:p.x+Math.cos(p.a)*34,y:p.y+Math.sin(p.a)*34,l:.06,L:.06}); if(Math.random()<.4) sfx('click'); }
      if(i.miss&&p.miss>0&&p.mcd<=0&&!over){ p.miss--; p.mcd=.8; M.push({x:p.x+Math.cos(p.a)*30,y:p.y+Math.sin(p.a)*30,a:p.a,o:p.n,l:3.2}); sfx('boost'); }
      p.smk-=dt; if(p.hp<55&&p.smk<=0){ p.smk=p.hp<25?.04:.09; fx.push({k:'smk',x:p.x-Math.cos(p.a)*24,y:p.y-Math.sin(p.a)*24,r:7,l:.9,L:.9}); if(p.hp<25) fx.push({k:'fire',x:p.x-Math.cos(p.a)*20,y:p.y-Math.sin(p.a)*20,r:8,l:.15,L:.15}); } }
    // 子彈
    for(let i=B.length-1;i>=0;i--){ const b=B[i]; b.l-=dt; b.x=(b.x+Math.cos(b.a)*560*dt+W)%W; b.y=(b.y+Math.sin(b.a)*560*dt+H)%H; const o=P[1-b.o];
      if(o.dead<=0&&o.inv<=0&&hyp(wrapD(b.x-o.x,W),wrapD(b.y-o.y,H))<20){ hurt(o,6,b.o); fx.push({k:'sp',x:b.x,y:b.y,vx:(Math.random()-.5)*120,vy:(Math.random()-.5)*120,l:.2,L:.2,c:'#ffe060'}); fx.push({k:'hit',x:b.x,y:b.y,l:.12,L:.12}); sfx('bump'); b.l=0; }
      if(b.l<=0) B.splice(i,1); }
    // 導彈：追蹤對手，對手躲進雲裡就跟丟
    for(let i=M.length-1;i>=0;i--){ const m=M[i]; m.l-=dt; const o=P[1-m.o];
      if(o.dead<=0&&!inCloud(clouds,o.x,o.y)){ const e=angD(Math.atan2(wrapD(o.y-m.y,H),wrapD(o.x-m.x,W))-m.a); m.a+=clamp(e,-2.3*dt,2.3*dt); }
      m.x=(m.x+Math.cos(m.a)*320*dt+W)%W; m.y=(m.y+Math.sin(m.a)*320*dt+H)%H; if(Math.random()<.7) fx.push({k:'smk',x:m.x,y:m.y,r:5,l:.6,L:.6});
      if(o.dead<=0&&o.inv<=0&&hyp(wrapD(m.x-o.x,W),wrapD(m.y-o.y,H))<24){ hurt(o,34,m.o); boom(m.x,m.y,false); shake=Math.max(shake,.25); sfx('boom'); m.l=0; }
      if(m.l<=0){ if(m.l>-1) boom(m.x,m.y,false); M.splice(i,1); } }
    // 補給：導彈箱、修理工具
    itemT-=dt; if(itemT<=0&&items.length<2){ itemT=7; items.push({x:80+Math.random()*(W-160),y:60+Math.random()*(H-120),k:Math.random()<.6?'m':'r',l:12}); }
    for(let i=items.length-1;i>=0;i--){ const it=items[i]; it.l-=dt; for(const p of P) if(p.dead<=0&&hyp(wrapD(it.x-p.x,W),wrapD(it.y-p.y,H))<28){ if(it.k==='m') p.miss=Math.min(3,p.miss+2); else p.hp=Math.min(100,p.hp+40); sfx('item'); it.l=0; fx.push({k:'ring',x:it.x,y:it.y,r:50,l:.4,L:.4,c:it.k==='m'?'#ffd23f':'#3ed16a'}); }
      if(it.l<=0) items.splice(i,1); } }
  function update(dt){
    if(client){ const k=env.keys,i={dx:(k.ArrowRight||k.KeyD?1:0)-(k.ArrowLeft||k.KeyA?1:0),fire:!!(k.KeyJ||k.Space),miss:env.hit('KeyK')};
      sendT-=dt; if(sendT<=0||i.miss){ sendT=1/20; net.send({i:[i.dx,i.fire?1:0,i.miss?1:0]}); }
      t+=dt; if(ban) ban.t+=dt; if(shake>0) shake-=dt; for(let j=fx.length-1;j>=0;j--){ const e=fx[j]; e.l-=dt; if(e.vx!=null){ e.x+=e.vx*dt; e.y+=e.vy*dt; } if(e.l<=0) fx.splice(j,1); }
      for(const p of P) if(p.tx!=null){ const f=Math.min(1,dt*16); p.x+=wrapD(p.tx-p.x,W)*f; p.y+=wrapD(p.ty-p.y,H)*f; p.a+=angD(p.ta-p.a)*f; p.x=(p.x+W)%W; p.y=(p.y+H)%H; } return; }
    if(ended) return; step(dt); if(host){ sendT-=dt; if(sendT<=0){ sendT=1/24; net.send(snap()); } } }
  const wrapDraw=(x,y,r,f)=>{ for(const ox of [0,-W,W]) for(const oy of [0,-H,H]){ const X=x+ox,Y=y+oy; if(X>-r&&X<W+r&&Y>-r&&Y<H+r) f(X,Y); } };
  function draw(){ c.save(); if(shake>0) c.translate((Math.random()-.5)*shake*20,(Math.random()-.5)*shake*20);
    c.drawImage(ground(ST.th),0,0);
    if(!T.high){ c.fillStyle='rgba(255,255,255,.18)'; for(let i=0;i<14;i++){ const x=(i*61+t*14)%W,y=(i*97)%H; c.fillRect(x,y+Math.sin(t*2+i)*2,10,2); } }
    for(const cl of clouds) wrapDraw(cl.x,cl.y,140,(X,Y)=>{ c.globalAlpha=.08; c.fillStyle='#000'; for(const b of cl.b){ c.beginPath(); c.arc(X+b[0]+36,Y+b[1]+44,b[2],0,TAU); c.fill(); } c.globalAlpha=1; }); /* 雲的影子 */
    for(const it of items) wrapDraw(it.x,it.y,30,(X,Y)=>{ const bob=Math.sin(t*4)*3; c.fillStyle='rgba(255,255,255,.25)'; c.beginPath(); c.arc(X,Y+bob,20+Math.sin(t*6)*2,0,TAU); c.fill();
      c.strokeStyle='#fff'; c.lineWidth=1.4; c.beginPath(); c.moveTo(X-12,Y-6+bob); c.lineTo(X,Y-24+bob); c.lineTo(X+12,Y-6+bob); c.stroke(); c.fillStyle=it.k==='m'?'#ffd23f':'#3ed16a'; c.fillRect(X-10,Y-6+bob,20,16); c.strokeStyle='#14122b'; c.lineWidth=2; c.strokeRect(X-10,Y-6+bob,20,16);
      c.fillStyle='#14122b'; c.font='900 11px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(it.k==='m'?'彈':'修',X,Y+2+bob); });
    for(const e of fx) if(e.k==='smk'){ c.globalAlpha=e.l/e.L*.5; c.fillStyle=T.night?'#556':'#8a8a8a'; c.beginPath(); c.arc(e.x,e.y,e.r*(2-e.l/e.L),0,TAU); c.fill(); } c.globalAlpha=1;
    for(const p of P){ if(p.dead>0){ if(p.dead>1.4){ const u=(2.2-p.dead)/.8; wrapDraw(p.x,p.y,50,(X,Y)=>{ c.globalAlpha=1-u; plane(c,X+u*20,Y+u*20,p.a+u*8,'#5a5a60',t,{s:1-u*.6}); c.globalAlpha=1; }); } continue; }
      wrapDraw(p.x,p.y,50,(X,Y)=>{ c.globalAlpha=.25; c.fillStyle='#000'; c.save(); c.translate(X+30,Y+40); c.rotate(p.a); c.beginPath(); c.ellipse(0,0,26,24,0,0,TAU); c.fill(); c.restore(); c.globalAlpha=1; /* 地面上的影子 */
        if(p.inv>0&&Math.sin(t*30)>0) c.globalAlpha=.45; plane(c,X,Y,p.a,p.hitT>0?'#ffffff':p.col,t,{bank:p.turn,scarf:p.scarf,light:T.night}); c.globalAlpha=1;
        if(T.night){ const lg=c.createRadialGradient(X,Y,4,X,Y,60); lg.addColorStop(0,'rgba(255,240,200,.18)'); lg.addColorStop(1,'rgba(255,240,200,0)'); c.fillStyle=lg; c.fillRect(X-60,Y-60,120,120); } }); }
    c.lineCap='round'; for(const b of B){ c.strokeStyle=b.o===0?'#fff3a0':'#a0f0ff'; c.lineWidth=3; c.beginPath(); c.moveTo(b.x,b.y); c.lineTo(b.x-Math.cos(b.a)*14,b.y-Math.sin(b.a)*14); c.stroke(); }
    for(const m of M){ c.save(); c.translate(m.x,m.y); c.rotate(m.a); c.fillStyle='#e8e8f0'; c.fillRect(-9,-3,16,6); c.fillStyle='#ff4d4d'; c.beginPath(); c.moveTo(7,-3); c.lineTo(12,0); c.lineTo(7,3); c.fill(); c.fillStyle='#ffd23f'; c.beginPath(); c.arc(-11,0,3+Math.random()*2,0,TAU); c.fill(); c.restore(); }
    for(const e of fx){ const a=clamp(e.l/e.L,0,1); if(e.k==='sp'){ c.globalAlpha=a; c.fillStyle=e.c; c.fillRect(e.x-2,e.y-2,4,4); } else if(e.k==='fire'){ c.globalAlpha=a; const g=c.createRadialGradient(e.x,e.y,0,e.x,e.y,e.r*(1.4-a*.4)); g.addColorStop(0,'rgba(255,250,210,1)'); g.addColorStop(.4,'rgba(255,170,60,.9)'); g.addColorStop(1,'rgba(255,60,20,0)'); c.fillStyle=g; c.beginPath(); c.arc(e.x,e.y,e.r*(1.4-a*.4),0,TAU); c.fill(); }
      else if(e.k==='ring'){ c.globalAlpha=a*.8; c.strokeStyle=e.c||'#fff'; c.lineWidth=3; c.beginPath(); c.arc(e.x,e.y,(1-a)*e.r+8,0,TAU); c.stroke(); } else if(e.k==='mz'){ c.globalAlpha=1; c.fillStyle='#fff6c0'; c.beginPath(); c.arc(e.x,e.y,6,0,TAU); c.fill(); }
      else if(e.k==='hit'){ c.globalAlpha=a; c.strokeStyle='#fff'; c.lineWidth=2; for(let q=0;q<4;q++){ const an=q*Math.PI/2+.4; c.beginPath(); c.moveTo(e.x+Math.cos(an)*4,e.y+Math.sin(an)*4); c.lineTo(e.x+Math.cos(an)*12,e.y+Math.sin(an)*12); c.stroke(); } }
      else if(e.k==='deb'){ c.globalAlpha=a; c.save(); c.translate(e.x,e.y); c.rotate(e.r); c.fillStyle='#5a5a60'; c.fillRect(-5,-2,10,4); c.restore(); } } c.globalAlpha=1;
    for(const cl of clouds) wrapDraw(cl.x,cl.y,140,(X,Y)=>cloudShape(c,{x:X,y:Y,b:cl.b},T.night?.55:.82));
    if(T.lava){ c.fillStyle='rgba(80,40,30,.18)'; c.fillRect(0,0,W,H); for(let i=0;i<20;i++){ c.fillStyle='rgba(255,120,40,.5)'; c.fillRect((i*83+t*30)%W,(i*47-t*20+H*4)%H,2,2); } }
    if(ST.th==='storm'||ST.th==='typhoon'){ c.strokeStyle='rgba(220,235,255,.3)'; c.lineWidth=1.5; for(let i=0;i<40;i++){ const x=(i*53+t*500)%W,y=(i*97+t*700)%H; c.beginPath(); c.moveTo(x,y); c.lineTo(x-6,y+16); c.stroke(); } }
    if(flash>0){ c.fillStyle='rgba(255,255,255,'+flash*2+')'; c.fillRect(0,0,W,H); }
    if(T.night){ c.fillStyle='rgba(6,8,30,.35)'; c.fillRect(0,0,W,H); }
    if(start>0&&!pv){ const mine=two?[0,1]:[me]; for(const i of mine){ const p=P[i],yy=p.y-46+Math.sin(t*8)*5; c.fillStyle='#ffd23f'; c.strokeStyle='#14122b'; c.lineWidth=3; c.beginPath(); c.moveTo(p.x-12,yy-14); c.lineTo(p.x+12,yy-14); c.lineTo(p.x,yy); c.closePath(); c.fill(); c.stroke();
      c.font='900 15px '+TC; c.textAlign='center'; c.lineWidth=4; const lb=two?(i?'2P':'1P'):'你'; c.strokeText(lb,p.x,yy-22); c.fillStyle='#ffd23f'; c.fillText(lb,p.x,yy-22); } }
    c.restore(); hud(); }
  function hud(){ const card=(p,x,al)=>{ c.fillStyle='rgba(10,14,30,.72)'; c.fillRect(x,8,230,46); c.fillStyle=p.col; c.fillRect(al?x+224:x,8,6,46);
      c.font='900 14px '+TC; c.textBaseline='middle'; c.textAlign=al?'right':'left'; c.fillStyle='#fff'; c.fillText(names[p.n],al?x+216:x+14,22);
      for(let k=0;k<KILLS;k++){ c.fillStyle=k<p.kills?'#ffd23f':'rgba(255,255,255,.2)'; c.beginPath(); c.arc(al?x+16+k*16:x+214-k*16,22,6,0,TAU); c.fill(); }
      c.fillStyle='rgba(255,255,255,.15)'; c.fillRect(x+14,36,150,8); c.fillStyle=p.hp>50?'#3ed16a':p.hp>25?'#ffc21a':'#ff4d4d'; if(al) c.fillRect(x+216-150*p.hp/100,36,150*p.hp/100,8); else c.fillRect(x+14,36,150*p.hp/100,8);
      c.font='700 11px '+TC; c.fillStyle='#ffd23f'; c.textAlign=al?'left':'right'; c.fillText('導彈 '+p.miss,al?x+14:x+216,40); };
    card(P[0],8,false); card(P[1],W-238,true);
    c.textAlign='center'; c.font='900 13px '+TC; c.fillStyle='#fff'; c.fillText(ST.name+'　先擊落 '+KILLS+' 次',W/2,18);
    if(ban&&ban.t<1.6){ const u=Math.min(1,ban.t*6),sc=1+(1-u)*.8; c.save(); c.translate(W/2,H/2-40); c.scale(sc,sc); c.globalAlpha=Math.min(1,(1.6-ban.t)*3); c.font='900 44px '+TC; c.lineWidth=8; c.strokeStyle='#14122b'; c.strokeText(ban.txt,0,0); c.fillStyle=ban.col; c.fillText(ban.txt,0,0); c.restore(); c.globalAlpha=1; } }
  return {update,draw,destroy(){},_dbg:{P,B,M,items,get over(){return over;}}};
}
function stageShow(ctx,w,h,si,t){ const S=STAGES[si],T=TH[S.th]; ctx.save(); ctx.scale(w/W,h/H); ctx.drawImage(ground(S.th),0,0);
  const cls=mkClouds(S.clouds,si+1); const a=t*.8,x1=W/2+Math.cos(a)*190,y1=H/2+Math.sin(a)*110,x2=W/2+Math.cos(a-.7)*190,y2=H/2+Math.sin(a-.7)*110;
  plane(ctx,x2,y2,a-.7+Math.PI/2,S.col,t,{bank:-.6,scarf:'#ffd23f',light:T.night}); plane(ctx,x1,y1,a+Math.PI/2,'#ff5d4f',t,{bank:-.6,light:T.night});
  for(let i=0;i<5;i++){ const q=(t*6+i/5)%1; ctx.fillStyle='#fff3a0'; ctx.fillRect(x2+(x1-x2)*q-2,y2+(y1-y2)*q-2,4,4); }
  for(const cl of cls) cloudShape(ctx,{x:(cl.x+t*14)%W,y:cl.y,b:cl.b},T.night?.5:.8);
  if(T.night){ ctx.fillStyle='rgba(6,8,30,.35)'; ctx.fillRect(0,0,W,H); }
  ctx.font='900 22px '+TC; ctx.textAlign='center'; ctx.lineWidth=6; ctx.strokeStyle='#14122b'; ctx.strokeText('對手：'+S.opp,W/2,40); ctx.fillStyle='#ffd23f'; ctx.fillText('對手：'+S.opp,W/2,40); ctx.restore(); }
function preview(ctx,w,h,L,t){ const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#7cc8ff'); g.addColorStop(1,'#2a8ad8'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  const s=h/90; plane(ctx,w/2,h/2+Math.sin(t*2)*6,-.3+Math.sin(t)*.15,(L&&L.color)||'#ff5d4f',t,{s,bank:Math.sin(t)*.6}); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).sky={name:'雲端纏鬥',tag:'SKY DOGFIGHT',color:'#3d8bff',online:true,maxPlayers:2,
  desc:'Q 版小飛機一對一空戰！飛機一直往前飛，轉彎繞到對手後面開火，撿導彈箱發射追蹤導彈，躲進雲裡讓對手打不中。先擊落對手 3 次獲勝，10 片天空一關比一關難。',
  goal:'繞到對手後面開火把他打下來，先擊落對手 3 次的獲勝。',
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  stageGoal:i=>STAGES[i].name+'（對手：'+STAGES[i].opp+'）：'+TIPS[i]+' 先擊落對手 3 次獲勝。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['← →','轉彎（飛機會自己往前飛）'],['J（按住）','開火'],['K','發射追蹤導彈（撿黃色導彈箱）'],['雙人','1P：A D＋F 開火、G 導彈　2P：← →＋, 開火、. 導彈']],
  touchHelp:[['◀ ▶','轉彎'],['開火','按住連射'],['導彈','發射追蹤導彈']],
  touch:{left:[{l:'◀',c:'ArrowLeft',big:true},{l:'▶',c:'ArrowRight',big:true}],right:[{l:'導彈',c:'KeyK'},{l:'開火',c:'KeyJ',act:true}]},
  looks:[{key:'color',label:'飛機顏色',type:'color',opts:['#ff5d4f','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#3d8bff','#b98cff','#f4f4f4']}],
  hubBest:()=>{ const n=STAGES.filter((s,i)=>hasWin(i)).length; return n?'打贏 <b>'+n+' / '+STAGES.length+'</b> 片天空':'尚無紀錄'; },
  stageBest:i=>hasWin(i)?'★ 贏過':'',
  stageShow,preview,thumb:(ctx,w,h,t)=>stageShow(ctx,w,h,0,t),create,_draw:{plane}};
})();
