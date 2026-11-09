// 雲端纏鬥（橫向捲軸空戰）：Q 版小飛機往右飛，畫面一直往前捲。飛機自動開火，方向鍵上下左右移動、導彈鍵發射追蹤導彈、閃避鍵翻滾躲子彈。
// 一路打敵機群、地面防空砲、轟炸機和氣球，撿補給升級武器，關底跟對手王牌一對一纏鬥，打下王牌就過關。
// 雙人：兩架飛機一起合作；連線時房主負責運算，加入的人只送出按鍵。
(function(){
'use strict';
const W=800,H=450,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,SPEED=120,LIVES=3;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,r1=v=>Math.round(v*10)/10,hyp=Math.hypot;
function shade(hex,k){ const n=parseInt(hex.slice(1),16); let r=n>>16,g=n>>8&255,b=n&255; const f=v=>clamp(Math.round(k>0?v+(255-v)*k:v*(1+k)),0,255); return 'rgb('+f(r)+','+f(g)+','+f(b)+')'; }
const ST0=[['晨曦海灣','sea','王牌小鷹','#ffb02a'],['棉花糖雲海','cloud','泡泡機長','#ff7eb6'],['夕陽群島','sunset','赤尾燕','#ff5a3a'],['沙漠熱流','desert','黃沙蠍','#d8a040'],['冰山海域','ice','雪鴞','#9adcff'],
  ['雷雨雲層','storm','雷霆鷲','#8a96a8'],['火山灰天空','volcano','熔岩隼','#c8202a'],['極光夜空','night','夜梟','#b98cff'],['颱風眼','typhoon','颶風號','#3ddbd9'],['平流層決戰','strato','天空王者','#ffd23f']];
// 難度：前面敵人少、子彈慢，後面慢慢變多變快；關底王牌血量、招式也越來越多
const STAGES=ST0.map(([name,th,opp,col],i)=>{ const k=i/9; return {name,th,opp,col,stars:1+Math.round(k*4),k,len:70+k*30,wave:2.6-1.2*k,efire:.35+.5*k,bspd:170+75*k,bossHp:150+190*k}; });
const TIPS=['敵機很少、子彈很慢，練習用。','雲很多，雲裡的敵機看不清楚。','開始有俯衝的敵機，記得上下閃。','地上會有防空砲，貼地飛要小心。','冰山很高，別撞到地形。',
  '暴風雨會打雷，敵機也變多了。','火山灰裡有轟炸機，先打掉牠們。','夜裡看不清楚，跟著敵機的燈打。','颱風會把飛機上下吹動。','最強的王牌：彈幕、導彈、俯衝全都有。'];
const hasWin=i=>{ try{ return localStorage.getItem('arcade.sky.w.'+i)==='1'; }catch(e){ return false; } };
const recWin=i=>{ try{ localStorage.setItem('arcade.sky.w.'+i,'1'); }catch(e){} };
const TH={sea:{sky:['#7cc8ff','#d8f0ff'],far:'#7aa8c8',land:'#5fbf60',land2:'#3f8f40',water:'#2a8ad8'},cloud:{sky:['#ffd8ef','#e8f0ff'],far:'#c8b8e8',land:'#c8e8a0',land2:'#9ac870'},
  sunset:{sky:['#ff9a5a','#ffd8a0'],far:'#a05a6a',land:'#4a7a4a',land2:'#2a4a2a',water:'#a05a5a'},desert:{sky:['#f4c070','#ffe8b8'],far:'#d8a060',land:'#e0b060',land2:'#b88040'},
  ice:{sky:['#a8d8ff','#f0faff'],far:'#c8e0f0',land:'#f4fbff',land2:'#a8c8e0',water:'#4a8ab8'},storm:{sky:['#4a5a6a','#7a8a98'],far:'#3a4450',land:'#3a6a4a',land2:'#24402e',storm:1},
  volcano:{sky:['#4a2a2a','#a0583a'],far:'#3a2020',land:'#3a2a2a',land2:'#1a1010',lava:1},night:{sky:['#0a1030','#2a3060'],far:'#1a2040',land:'#1a3a2a',land2:'#0a1a12',night:1},
  typhoon:{sky:['#3a6a8a','#7aa0b8'],far:'#2a4a5a',land:'#2a6a4a',land2:'#1a4030',water:'#2a5a7a',storm:1},strato:{sky:['#0a1a5a','#5a8ad8'],far:'#3a5aa0',land:'#e8f0ff',land2:'#b8c8e8',high:1}};
// 地形高度：每關固定（同一個種子），海面關卡有平的水面
function terr(si,x){ const s=si*13.7,k=STAGES[si].k; let h=48+26*Math.sin(x*.0042+s)+18*Math.sin(x*.011+s*2)+(TH[STAGES[si].th].ice?Math.max(0,Math.sin(x*.0023+s))*120:0)*(.6+k*.4);
  if(TH[STAGES[si].th].high) h=26+10*Math.sin(x*.006+s); return H-h; }
// ---- Q 版側面飛機：圓胖機身、大螺旋槳、飛行員戴護目鏡、圍巾飄 ----
function planeSide(c,x,y,a,col,t,o){ o=o||{}; const s=o.s||1,dir=o.dir||1; c.save(); c.translate(x,y); c.scale(dir*s,s); c.rotate(a*dir); c.lineJoin='round'; c.strokeStyle='#14122b'; c.lineWidth=2.2;
  c.fillStyle=shade(col,-.25); c.beginPath(); c.moveTo(-26,-2); c.lineTo(-38,-20); c.lineTo(-30,-20); c.lineTo(-18,-4); c.closePath(); c.fill(); c.stroke(); /* 垂直尾翼 */
  c.beginPath(); c.moveTo(-28,2); c.lineTo(-40,6); c.lineTo(-24,6); c.closePath(); c.fill(); c.stroke(); /* 水平尾翼 */
  const bg=c.createLinearGradient(0,-12,0,12); bg.addColorStop(0,shade(col,.45)); bg.addColorStop(.6,col); bg.addColorStop(1,shade(col,-.3)); c.fillStyle=bg; c.beginPath(); c.ellipse(0,0,30,11,0,0,TAU); c.fill(); c.stroke();
  c.fillStyle='rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(4,-5,18,3,0,0,TAU); c.fill();
  c.fillStyle=o.mark||'#fff'; c.beginPath(); c.arc(-12,1,4,0,TAU); c.fill(); c.stroke();
  c.fillStyle='#e8e8f0'; c.beginPath(); c.ellipse(28,0,6,8,0,0,TAU); c.fill(); c.stroke(); /* 機鼻 */
  c.fillStyle='rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(34,0,2.5,16,0,0,TAU); c.fill(); c.strokeStyle='rgba(20,18,43,.6)'; c.lineWidth=2.4; const pa=t*60; c.beginPath(); c.moveTo(34,Math.sin(pa)*16); c.lineTo(34,-Math.sin(pa)*16); c.stroke();
  c.strokeStyle='#14122b'; c.lineWidth=2.2; c.fillStyle=shade(col,-.1); c.beginPath(); c.ellipse(2,6,16,4.5,.05,0,TAU); c.fill(); c.stroke(); /* 主翼 */
  c.fillStyle='#ffd9b8'; c.beginPath(); c.arc(4,-12,7,0,TAU); c.fill(); c.stroke(); c.fillStyle='#6a3a1a'; c.beginPath(); c.arc(3,-14,7,Math.PI,TAU); c.fill(); /* 飛行員 */
  c.fillStyle='#7ae8ff'; c.beginPath(); c.arc(8,-13,2.8,0,TAU); c.fill(); c.strokeStyle='#5a3a1a'; c.lineWidth=1.4; c.stroke();
  c.strokeStyle=o.scarf||'#ff4d4d'; c.lineWidth=3; c.lineCap='round'; c.beginPath(); c.moveTo(0,-7); c.quadraticCurveTo(-10,-8+Math.sin(t*14)*3,-20,-6+Math.sin(t*14+1)*5); c.stroke();
  if(o.light){ c.fillStyle=Math.sin(t*8)>0?'#ff3a3a':'#7aff7a'; c.beginPath(); c.arc(-36,-20,2.6,0,TAU); c.fill(); }
  c.restore(); }
function bomberSide(c,x,y,col,t){ c.save(); c.translate(x,y); c.scale(-1.6,1.6); planeSide(c,0,0,0,col,t,{mark:'#14122b'}); c.restore(); }
function balloon(c,x,y,t){ const b=Math.sin(t*2+x)*3; c.strokeStyle='#5a3a1a'; c.lineWidth=1.5; c.beginPath(); c.moveTo(x-8,y+18+b); c.lineTo(x-14,y+4+b); c.moveTo(x+8,y+18+b); c.lineTo(x+14,y+4+b); c.stroke();
  const g=c.createRadialGradient(x-6,y-10+b,3,x,y-4+b,22); g.addColorStop(0,'#ffe0a0'); g.addColorStop(1,'#e04a2a'); c.fillStyle=g; c.beginPath(); c.ellipse(x,y-4+b,18,22,0,0,TAU); c.fill(); c.strokeStyle='#14122b'; c.lineWidth=2; c.stroke();
  c.fillStyle='#8a5a2a'; c.fillRect(x-8,y+18+b,16,10); c.strokeRect(x-8,y+18+b,16,10); }
function aaGun(c,x,y,ang){ c.fillStyle='#4a5040'; c.strokeStyle='#14122b'; c.lineWidth=2; c.beginPath(); c.moveTo(x-16,y); c.lineTo(x-10,y-12); c.lineTo(x+10,y-12); c.lineTo(x+16,y); c.closePath(); c.fill(); c.stroke();
  c.save(); c.translate(x,y-12); c.rotate(ang); c.fillStyle='#2a3020'; c.fillRect(0,-3,22,6); c.strokeRect(0,-3,22,6); c.restore(); c.fillStyle='#6a7050'; c.beginPath(); c.arc(x,y-12,7,Math.PI,TAU); c.fill(); c.stroke(); }

function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,host=!!net&&net.host,pv=!!opts.preview,two=!net&&opts.mode==='2p',me=net?Math.min(1,net.me):0,np=two?2:net?Math.min(2,net.count):1;
  const si=clamp(opts.stage|0,0,STAGES.length-1),ST=STAGES[si],T=TH[ST.th],{ctx:c}=env.canvas2d(W,H);
  const names=net?[net.names[0]||'玩家 1',net.names[1]||'玩家 2']:two?['1P','2P']:[pv?'王牌':(opts.name||'你')];
  const lk=i=>net?(net.looks&&net.looks[i])||{}:i===0?(opts.look||{}):{color:'#3d8bff'};
  const P=[]; for(let i=0;i<np;i++){ const L=lk(i); P.push({i,x:110,y:150+i*90,vx:0,vy:0,hp:100,lives:LIVES,miss:2,wl:1,cd:0,roll:0,rcd:0,inv:2,dead:0,col:L.color||(i?'#3d8bff':'#ff5d4f'),score:0,ai:pv,aiT:0,aty:200,hitT:0}); }
  if(P[1]&&P[1].col===P[0].col) P[1].col='#3d8bff';
  let cx=0,t=0,phase='intro',PT=pv?.4:1.6,E=[],EB=[],PB=[],MS=[],PK=[],FX=[],boss=null,eid=0,waveT=1.5,shake=0,ban=null,ended=false,ev=[],sendT=0,flash=0,dist=0,result=null;
  const rin={dy:0,dx:0,miss:false,roll:false};
  const sfx=n=>{ if(pv) return; env.sfx(n); if(host) ev.push(n); };
  const say=(txt,col)=>{ ban={txt,col:col||'#ffd23f',t:0}; if(host) ev.push('b:'+txt+'|'+(col||'')); };
  function inputOf(p){ const k=env.keys; if(p.ai) return aiIn(p);
    if(two){ if(p.i===0) return {dy:(k.KeyS?1:0)-(k.KeyW?1:0),dx:(k.KeyD?1:0)-(k.KeyA?1:0),miss:env.hit('KeyF'),roll:env.hit('KeyG')}; return {dy:(k.ArrowDown?1:0)-(k.ArrowUp?1:0),dx:(k.ArrowRight?1:0)-(k.ArrowLeft?1:0),miss:env.hit('Comma')||env.hit('Enter'),roll:env.hit('Period')||env.hit('ShiftRight')}; }
    if(p.i===1){ const o={dy:rin.dy,dx:rin.dx,miss:rin.miss,roll:rin.roll}; rin.miss=rin.roll=false; return o; }
    return {dy:(k.ArrowDown||k.KeyS?1:0)-(k.ArrowUp||k.KeyW?1:0),dx:(k.ArrowRight||k.KeyD?1:0)-(k.ArrowLeft||k.KeyA?1:0),miss:env.hit('KeyK')||env.hit('Space'),roll:env.hit('KeyJ')}; }
  // 示範（開始畫面）用的電腦駕駛：對齊最近的敵人、躲最近的子彈
  function aiIn(p){ p.aiT-=1/60; let tgt=boss&&boss.hp>0?boss:E.find(e=>e.x-cx>p.x&&e.ty!=='aa'); if(p.aiT<=0){ p.aiT=.4; p.aty=tgt?tgt.y:200+Math.sin(t)*80; }
    let ty=p.aty; for(const b of EB){ const dx=b.x-cx-p.x,dy=b.y-p.y; if(dx>-10&&dx<120&&Math.abs(dy)<26) ty=p.y+(dy>0?-60:60); }
    const g=terr(si,cx+p.x); if(ty>g-50) ty=g-50; const dy=ty-p.y; return {dy:Math.abs(dy)<8?0:Math.sign(dy),dx:p.x<200?1:p.x>260?-1:0,miss:p.miss>0&&!!tgt&&Math.random()<.01,roll:false}; }
  function spawn(ty,x,y,o){ const e=Object.assign({id:++eid,ty,x,y,y0:y,t:0,hp:{fighter:3,swoop:3,bomber:14,aa:5,balloon:2}[ty],cd:1+Math.random()*1.5,hitT:0},o||{}); e.max=e.hp; E.push(e); return e; }
  function wave(){ const k=ST.k,R=Math.random(),X=cx+W+40;
    if(R<.38){ const n=3+Math.round(k*3),y0=60+Math.random()*(H-220); for(let i=0;i<n;i++) spawn('fighter',X+i*46,y0+Math.sin(i)*20,{amp:20+Math.random()*40,ph:i*.6}); }
    else if(R<.58&&k>.15){ const n=2+Math.round(k*2); for(let i=0;i<n;i++) spawn('swoop',X+i*70,40+Math.random()*80); }
    else if(R<.72){ const gx=X+60; spawn('aa',gx,terr(si,gx)); if(k>.4) spawn('aa',gx+120,terr(si,gx+120)); }
    else if(R<.86&&k>.3) spawn('bomber',X+40,80+Math.random()*120);
    else spawn('balloon',X,70+Math.random()*(H-240)); }
  function boom(x,y,big){ for(let i=0;i<(big?34:12);i++){ const q=Math.random()*TAU,sp=40+Math.random()*(big?240:110); FX.push({k:'sp',x,y,vx:Math.cos(q)*sp,vy:Math.sin(q)*sp,l:.3+Math.random()*.4,L:.7,c:['#fff6c0','#ffd23f','#ff7a3d','#ff4d4d'][i%4]}); }
    FX.push({k:'fire',x,y,r:big?58:24,l:big?.55:.28,L:big?.55:.28}); if(big){ FX.push({k:'ring',x,y,r:110,l:.5,L:.5}); for(let i=0;i<8;i++) FX.push({k:'smk',x:x+(Math.random()-.5)*30,y:y+(Math.random()-.5)*30,vx:-30,vy:-20,r:14,l:1.3,L:1.3}); } }
  function hurtP(p,d){ if(p.dead>0||p.inv>0||p.roll>0) return; p.hp-=d; p.hitT=.15; sfx('hurt'); shake=Math.max(shake,.15);
    if(p.hp<=0){ p.hp=0; p.lives--; p.dead=2; boom(cx+p.x,p.y,true); sfx('boom'); shake=.4; if(p.lives>0) say((np>1?names[p.i]+' ':'')+'被擊落！還剩 '+p.lives+' 架','#ff6a6a'); } }
  function killE(e,by){ boom(e.x,e.y,e.ty==='bomber'||e.ty==='boss'); sfx('boom'); const pts={fighter:100,swoop:150,bomber:500,aa:200,balloon:80,boss:3000}[e.ty]||100; if(by!=null&&P[by]) P[by].score+=pts;
    if(e.ty==='balloon'||e.ty==='bomber'||Math.random()<.12) PK.push({x:e.x,y:e.y,k:Math.random()<.4?'m':Math.random()<.6?'w':'r',vy:20}); }
  function conclude(win){ if(ended) return; ended=true; if(pv){ env.end({}); return; } const sc=P.reduce((a,p)=>a+p.score,0);
    if(win&&!two&&!net) recWin(si); env.sfx(win?'win':'lose');
    env.end({title:win?'擊落王牌！過關':'任務失敗',big:sc+' 分',text:ST.name+'（對手：'+ST.opp+'）'+(win?'':'　撿綠色補給修理、按閃避翻滾可以躲子彈。'),score:!two&&!net&&win?sc:null,next:win&&!two&&!net&&si<STAGES.length-1}); }
  function snap(){ const m={s:[P.map(p=>[r1(p.x),r1(p.y),r1(p.vy),Math.round(p.hp),p.lives,p.miss,r1(p.roll),r1(p.inv),p.wl,r1(p.dead),p.score]),E.map(e=>[e.id,e.ty,r1(e.x),r1(e.y),e.hp,r1(e.ga||0)]),
      EB.slice(-90).map(b=>[r1(b.x),r1(b.y)]),PB.slice(-60).map(b=>[r1(b.x),r1(b.y)]),MS.map(m2=>[r1(m2.x),r1(m2.y),r1(m2.a)]),PK.map(k2=>[r1(k2.x),r1(k2.y),k2.k]),r1(cx),boss?[Math.round(boss.hp),Math.round(boss.max),r1(boss.x),r1(boss.y),r1(boss.a)]:0,phase],e:ev}; ev=[]; return m; }
  if(net){
    if(client) net.onmsg=m=>{ if(m.s){ const s=m.s; s[0].forEach((a,i)=>{ const p=P[i]; if(!p) return; p.tx=a[0]; p.ty=a[1]; p.vy=a[2]; p.hp=a[3]; p.lives=a[4]; p.miss=a[5]; p.roll=a[6]; p.inv=a[7]; p.wl=a[8]; if(p.dead<=0&&a[9]>0) boom(cx+a[0],a[1],true); p.dead=a[9]; p.score=a[10]; });
        const seen={}; for(const q of s[1]){ seen[q[0]]=1; let e=E.find(x=>x.id===q[0]); if(!e){ e={id:q[0],ty:q[1],x:q[2],y:q[3],t:0}; E.push(e); } e.tx=q[2]; e.tyy=q[3]; e.hp=q[4]; e.ga=q[5]; }
        for(let i=E.length-1;i>=0;i--) if(!seen[E[i].id]){ if(E[i].ty!=='aa'||1) boom(E[i].x,E[i].y,false); E.splice(i,1); }
        EB=s[2].map(q=>({x:q[0],y:q[1]})); PB=s[3].map(q=>({x:q[0],y:q[1]})); MS=s[4].map(q=>({x:q[0],y:q[1],a:q[2]})); PK=s[5].map(q=>({x:q[0],y:q[1],k:q[2]})); cx=s[6];
        boss=s[7]?Object.assign(boss||{},{hp:s[7][0],max:s[7][1],tx:s[7][2],tyy:s[7][3],a:s[7][4]}):null; if(boss&&boss.x==null){ boss.x=boss.tx; boss.y=boss.tyy; } phase=s[8];
        for(const e2 of m.e){ if(e2.startsWith('b:')){ const [tx,cl]=e2.slice(2).split('|'); ban={txt:tx,col:cl||'#ffd23f',t:0}; } else env.sfx(e2); } }
      else if(m.end) conclude(m.end[0]); };
    else { net.onmsg=(m,from)=>{ if(from===1&&m.i){ rin.dy=m.i[0]; rin.dx=m.i[1]; if(m.i[2]) rin.miss=true; if(m.i[3]) rin.roll=true; } }; net.onleave=i=>{ if(P[i]){ P[i].lives=0; P[i].dead=99; } }; }
  }
  function step(dt){ t+=dt; if(ban) ban.t+=dt; if(shake>0) shake-=dt; if(flash>0) flash-=dt;
    for(let i=FX.length-1;i>=0;i--){ const e=FX[i]; e.l-=dt; if(e.vx!=null){ e.x+=e.vx*dt; e.y+=e.vy*dt; e.vx*=.97; e.vy*=.97; } if(e.l<=0) FX.splice(i,1); }
    if(T.storm&&Math.random()<dt*.15){ flash=.25; sfx('boom'); }
    if(phase==='intro'){ PT-=dt; if(PT<=0){ phase='fly'; say(ST.name+'　起飛！'); sfx('go'); } }
    if(phase==='over'){ PT-=dt; if(PT<=0){ if(host){ net.send(snap()); net.send({end:[result]}); } conclude(result); } }
    const scroll=phase==='boss'?SPEED*.55:SPEED; cx+=scroll*dt; if(phase==='fly') dist+=dt;
    // 玩家
    for(const p of P){ if(p.dead>0){ p.dead-=dt; if(p.dead<=0&&p.lives>0){ p.hp=100; p.inv=2.5; p.x=110; p.y=160+p.i*80; p.vx=p.vy=0; sfx('item'); } continue; }
      if(p.lives<=0) continue; const I=phase==='intro'||phase==='over'?{dy:0,dx:0}:inputOf(p);
      if(p.inv>0) p.inv-=dt; if(p.roll>0) p.roll-=dt; if(p.rcd>0) p.rcd-=dt; if(p.cd>0) p.cd-=dt; if(p.hitT>0) p.hitT-=dt;
      const wind=ST.th==='typhoon'?Math.sin(t*.9)*70:0;
      p.vy+=((I.dy||0)*270+wind-p.vy)*Math.min(1,dt*8); p.vx+=((I.dx||0)*220-p.vx)*Math.min(1,dt*8);
      p.x=clamp(p.x+p.vx*dt,40,W*.62); p.y=clamp(p.y+p.vy*dt,30,H-20);
      const g=terr(si,cx+p.x); if(p.y>g-16){ p.y=g-16; p.vy=-140; hurtP(p,12); for(let q=0;q<6;q++) FX.push({k:'sp',x:cx+p.x,y:g,vx:(Math.random()-.5)*160,vy:-Math.random()*120,l:.4,L:.4,c:'#c8a060'}); }
      if(I.roll&&p.rcd<=0){ p.roll=.55; p.rcd=1.8; p.vy+=(I.dy||(p.y>H/2?-1:1))*200; sfx('skid'); }
      if(I.miss&&p.miss>0&&phase!=='intro'){ p.miss--; MS.push({x:cx+p.x+30,y:p.y,a:0,o:p.i,l:3.5,sp:200}); sfx('boost'); }
      if(p.cd<=0&&phase!=='intro'&&phase!=='over'){ p.cd=.12; const ang=clamp(p.vy*.0012,-.3,.3),bx=cx+p.x+34,by=p.y+2; /* 自動開火：武器等級 1 單發、2 雙發、3 散彈 */
        const shots=p.wl>=3?[-.12,0,.12]:p.wl===2?[-.03,.03]:[0]; for(const s of shots) PB.push({x:bx,y:by+s*60,vx:Math.cos(ang+s)*620,vy:Math.sin(ang+s)*620,o:p.i,l:1.2});
        FX.push({k:'mz',x:bx,y:by,l:.05,L:.05}); if(Math.random()<.25) sfx('click'); } }
    // 出敵人、出王牌
    if(phase==='fly'){ waveT-=dt; if(waveT<=0){ waveT=ST.wave*(.7+Math.random()*.6); wave(); }
      if(dist>=ST.len){ phase='boss'; boss={ty:'boss',x:cx+W+80,y:H*.4,hp:ST.bossHp*(np>1?1.5:1),max:ST.bossHp*(np>1?1.5:1),t:0,cd:1.5,mcd:4,a:0,hitT:0}; boss.max=boss.hp; say('王牌「'+ST.opp+'」出現！','#ff6a6a'); sfx('beep'); } }
    // 敵人
    const alive=P.filter(p=>p.dead<=0&&p.lives>0);
    for(let i=E.length-1;i>=0;i--){ const e=E[i]; e.t+=dt; if(e.hitT>0) e.hitT-=dt; e.cd-=dt;
      if(e.ty==='fighter'){ e.x-=(70+ST.k*60)*dt; e.y=e.y0+Math.sin(e.t*2+e.ph)*e.amp; }
      else if(e.ty==='swoop'){ const tg=alive[0]; e.x-=(110+ST.k*80)*dt; if(tg&&e.t<2.2) e.y+=clamp(tg.y-e.y,-1,1)*160*dt; else e.y-=120*dt; }
      else if(e.ty==='bomber'){ e.x-=40*dt; e.y=e.y0+Math.sin(e.t)*14; }
      else if(e.ty==='balloon'){ e.x-=10*dt; e.y=e.y0+Math.sin(e.t*1.5)*8; }
      else if(e.ty==='aa'){ e.y=terr(si,e.x); const tg=alive[0]; if(tg) e.ga=Math.atan2(tg.y-(e.y-12),cx+tg.x-e.x); }
      if(e.cd<=0&&alive.length&&e.x-cx<W&&e.x-cx>40&&e.ty!=='balloon'){ const tg=alive[Math.floor(Math.random()*alive.length)],ax=cx+tg.x-e.x,ay=tg.y-e.y,d=hyp(ax,ay)||1,sp=ST.bspd;
        e.cd=(e.ty==='bomber'?1.6:e.ty==='aa'?1.4:2.4)/ST.efire*(.7+Math.random()*.6);
        if(e.ty==='bomber'){ for(const s of [-.25,0,.25]){ const a=Math.atan2(ay,ax)+s; EB.push({x:e.x-30,y:e.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,l:4}); } }
        else EB.push({x:e.x-20,y:e.y-(e.ty==='aa'?12:0),vx:ax/d*sp,vy:ay/d*sp,l:4}); }
      for(const p of alive){ if(hyp(cx+p.x-e.x,p.y-e.y)<(e.ty==='bomber'?44:28)&&e.ty!=='aa'){ hurtP(p,20); e.hp=0; } }
      if(e.hp<=0){ killE(e,e.lastBy); E.splice(i,1); continue; }
      if(e.x<cx-80) E.splice(i,1); }
    // 王牌：在畫面右邊飛八字、追著玩家高度，開火、散彈、導彈、俯衝
    if(boss&&phase==='boss'){ const b=boss; b.t+=dt; if(b.hitT>0) b.hitT-=dt; const tg=alive[0]; const hx=cx+W*.78+Math.sin(b.t*.7)*90,hy=tg?tg.y+Math.sin(b.t*1.3)*90:H*.4;
      b.x+=(hx-b.x)*Math.min(1,dt*1.5); const ny=b.y+(clamp(hy,40,terr(si,b.x)-50)-b.y)*Math.min(1,dt*1.2); b.a=clamp((ny-b.y)*.05,-.4,.4); b.y=ny; b.cd-=dt; b.mcd-=dt;
      if(b.cd<=0&&tg){ const rage=b.hp<b.max*.5?1:0,a0=Math.atan2(tg.y-b.y,cx+tg.x-b.x); b.cd=(1.3-ST.k*.5)*(rage?.7:1);
        const n=ST.k>.5||rage?5:3; for(let q=0;q<n;q++){ const a=a0+(q-(n-1)/2)*.14; EB.push({x:b.x-30,y:b.y,vx:Math.cos(a)*ST.bspd*1.1,vy:Math.sin(a)*ST.bspd*1.1,l:4}); } sfx('click'); }
      if(b.mcd<=0&&ST.k>.3&&tg){ b.mcd=5-ST.k*2; MS.push({x:b.x-30,y:b.y,a:Math.PI,o:-1,l:4,sp:150}); say('王牌發射導彈！','#ff9a5a'); }
      for(const p of alive) if(hyp(cx+p.x-b.x,p.y-b.y)<36) hurtP(p,25);
      if(b.hp<=0){ boom(b.x,b.y,true); boom(b.x+20,b.y-10,true); for(const p of P) p.score+=Math.round(3000/np); phase='over'; PT=2.2; result=true; say('擊落王牌「'+ST.opp+'」！'); sfx('win'); boss=null; shake=.6; } }
    // 子彈
    for(let i=PB.length-1;i>=0;i--){ const b=PB[i]; b.l-=dt; b.x+=b.vx*dt; b.y+=b.vy*dt; let hit=false;
      for(const e of E){ if(hyp(b.x-e.x,b.y-e.y)<(e.ty==='bomber'?36:e.ty==='balloon'?20:20)){ e.hp-=1; e.hitT=.08; e.lastBy=b.o; hit=true; break; } }
      if(!hit&&boss&&hyp(b.x-boss.x,b.y-boss.y)<34){ boss.hp-=1; boss.hitT=.08; hit=true; }
      if(hit){ FX.push({k:'hit',x:b.x,y:b.y,l:.1,L:.1}); if(Math.random()<.3) sfx('bump'); }
      if(hit||b.l<=0||b.x>cx+W+20||b.y>terr(si,b.x)) PB.splice(i,1); }
    for(let i=EB.length-1;i>=0;i--){ const b=EB[i]; b.l-=dt; b.x+=b.vx*dt; b.y+=b.vy*dt; let hit=false;
      for(const p of alive) if(hyp(cx+p.x-b.x,p.y-b.y)<14){ hurtP(p,8); hit=true; break; }
      if(hit||b.l<=0||b.x<cx-20||b.y<-20||b.y>H+20) EB.splice(i,1); }
    // 導彈：追最近的目標
    for(let i=MS.length-1;i>=0;i--){ const m=MS[i]; m.l-=dt; let tg=null,td=1e9;
      if(m.o>=0){ for(const e of E.concat(boss?[boss]:[])){ const d=hyp(e.x-m.x,e.y-m.y); if(d<td&&e.x>m.x-40){ td=d; tg=e; } } }
      else for(const p of alive){ const d=hyp(cx+p.x-m.x,p.y-m.y); if(d<td){ td=d; tg={x:cx+p.x,y:p.y}; } }
      if(tg){ const da=Math.atan2(tg.y-m.y,tg.x-m.x)-m.a,w=Math.atan2(Math.sin(da),Math.cos(da)); m.a+=clamp(w,-2.6*dt,2.6*dt); }
      m.sp=Math.min(m.o>=0?520:330,m.sp+400*dt); m.x+=Math.cos(m.a)*m.sp*dt; m.y+=Math.sin(m.a)*m.sp*dt; if(Math.random()<.8) FX.push({k:'smk',x:m.x,y:m.y,vx:-20,vy:0,r:5,l:.6,L:.6});
      let hit=false; if(m.o>=0){ for(const e of E.concat(boss?[boss]:[])) if(hyp(e.x-m.x,e.y-m.y)<30){ e.hp-=e===boss?24:12; e.hitT=.15; e.lastBy=m.o; hit=true; break; } }
      else for(const p of alive) if(hyp(cx+p.x-m.x,p.y-m.y)<20){ hurtP(p,30); hit=true; }
      if(hit){ boom(m.x,m.y,false); sfx('boom'); shake=Math.max(shake,.2); } if(hit||m.l<=0||m.y>terr(si,m.x)){ if(!hit) boom(m.x,m.y,false); MS.splice(i,1); } }
    // 補給：彈＝導彈 +2、P＝武器升級、修＝回血 40
    for(let i=PK.length-1;i>=0;i--){ const k=PK[i]; k.x-=20*dt; k.y+=Math.sin(t*3+i)*10*dt; for(const p of alive) if(hyp(cx+p.x-k.x,p.y-k.y)<28){ if(k.k==='m') p.miss=Math.min(6,p.miss+2); else if(k.k==='w') p.wl=Math.min(3,p.wl+1); else p.hp=Math.min(100,p.hp+40); sfx('item'); FX.push({k:'ring',x:k.x,y:k.y,r:50,l:.4,L:.4,c:k.k==='m'?'#ffd23f':k.k==='w'?'#ff7eb6':'#3ed16a'}); k.dead=1; }
      if(k.dead||k.x<cx-40) PK.splice(i,1); }
    for(const p of P) if(p.dead<=0&&p.lives>0&&p.hp<45&&Math.random()<.3) FX.push({k:'smk',x:cx+p.x-24,y:p.y,vx:-60,vy:-10,r:6,l:.8,L:.8});
    if(phase!=='over'&&P.every(p=>p.lives<=0)){ phase='over'; PT=2.2; result=false; say('全軍覆沒…','#ff6a6a'); sfx('lose'); } }
  function update(dt){
    if(client){ const k=env.keys,i={dy:(k.ArrowDown||k.KeyS?1:0)-(k.ArrowUp||k.KeyW?1:0),dx:(k.ArrowRight||k.KeyD?1:0)-(k.ArrowLeft||k.KeyA?1:0),miss:env.hit('KeyK')||env.hit('Space'),roll:env.hit('KeyJ')};
      sendT-=dt; if(sendT<=0||i.miss||i.roll){ sendT=1/20; net.send({i:[i.dy,i.dx,i.miss?1:0,i.roll?1:0]}); }
      t+=dt; if(ban) ban.t+=dt; if(shake>0) shake-=dt; for(let j=FX.length-1;j>=0;j--){ const e=FX[j]; e.l-=dt; if(e.vx!=null){ e.x+=e.vx*dt; e.y+=e.vy*dt; } if(e.l<=0) FX.splice(j,1); }
      const f=Math.min(1,dt*14); for(const p of P) if(p.tx!=null){ p.x+=(p.tx-p.x)*f; p.y+=(p.ty-p.y)*f; } for(const e of E) if(e.tx!=null){ e.x+=(e.tx-e.x)*f; e.y+=(e.tyy-e.y)*f; } if(boss&&boss.tx!=null){ boss.x+=(boss.tx-boss.x)*f; boss.y+=(boss.tyy-boss.y)*f; } return; }
    if(ended) return; step(dt); if(host){ sendT-=dt; if(sendT<=0){ sendT=1/20; net.send(snap()); } } }
  // ---- 畫面：天空、遠山、雲、地形、敵人、子彈、前景雲 ----
  const CL=[...Array(14)].map((_,i)=>({x:i*190+Math.random()*120,y:30+Math.random()*(H-200),s:.6+Math.random()*.9,z:i%3}));
  function cloud(x,y,s,a){ c.globalAlpha=a; c.fillStyle='#fff'; c.beginPath(); c.arc(x,y,26*s,0,TAU); c.arc(x+28*s,y-10*s,32*s,0,TAU); c.arc(x+60*s,y,24*s,0,TAU); c.arc(x+30*s,y+8*s,26*s,0,TAU); c.fill(); c.globalAlpha=1; }
  function draw(){ c.save(); if(shake>0) c.translate((Math.random()-.5)*shake*20,(Math.random()-.5)*shake*20);
    const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,T.sky[0]); g.addColorStop(1,T.sky[1]); c.fillStyle=g; c.fillRect(0,0,W,H);
    if(T.night||T.high){ for(let i=0;i<70;i++){ c.fillStyle='rgba(255,255,255,'+(.3+.5*Math.abs(Math.sin(t+i)))+')'; c.fillRect(((i*137)-cx*.05)%W+(i*137-cx*.05<0?W:0),(i*53)%(H*.6),1.6,1.6); } }
    if(ST.th==='sunset'||ST.th==='sea'){ const sg=c.createRadialGradient(620,120,10,620,120,90); sg.addColorStop(0,'rgba(255,250,210,.95)'); sg.addColorStop(1,'rgba(255,220,150,0)'); c.fillStyle=sg; c.fillRect(500,20,240,220); }
    // 遠山
    c.fillStyle=T.far; c.beginPath(); c.moveTo(0,H); for(let x=0;x<=W;x+=20){ const wx=x+cx*.25; c.lineTo(x,H-120-50*Math.sin(wx*.006)-30*Math.sin(wx*.017)); } c.lineTo(W,H); c.fill();
    for(const q of CL) if(q.z<2){ const x=((q.x-cx*(q.z?.5:.3))%(W+300)+W+300)%(W+300)-150; cloud(x,q.y,q.s,T.night?.25:.6); }
    // 地形
    if(T.water){ c.fillStyle=T.water; c.fillRect(0,H-46,W,46); c.fillStyle='rgba(255,255,255,.35)'; for(let x=0;x<W;x+=30) c.fillRect((x-cx*.9%30+30)%W,H-40+Math.sin(x+t*2)*2,14,2); }
    c.fillStyle=T.land2; c.beginPath(); c.moveTo(0,H); for(let x=0;x<=W;x+=8) c.lineTo(x,terr(si,cx+x)+6); c.lineTo(W,H); c.fill();
    const lg=c.createLinearGradient(0,H-200,0,H); lg.addColorStop(0,shade(T.land,.15)); lg.addColorStop(1,T.land2); c.fillStyle=lg; c.beginPath(); c.moveTo(0,H); for(let x=0;x<=W;x+=8) c.lineTo(x,terr(si,cx+x)); c.lineTo(W,H); c.fill();
    if(T.lava){ c.fillStyle='rgba(255,90,26,.6)'; for(let x=0;x<W;x+=60){ const wx=x+cx; if(Math.sin(wx*.01)>.6){ const y=terr(si,cx+x); c.beginPath(); c.arc(x,y+4,8,0,TAU); c.fill(); } } }
    if(!T.high&&!T.lava&&!T.ice) for(let x=-((cx)%70);x<W;x+=70){ const y=terr(si,cx+x); c.fillStyle=shade(T.land,-.3); c.beginPath(); c.arc(x,y-6,9,0,TAU); c.arc(x+8,y-10,8,0,TAU); c.fill(); }
    // 補給
    for(const k of PK){ const x=k.x-cx,y=k.y; c.strokeStyle='#fff'; c.lineWidth=1.4; c.beginPath(); c.moveTo(x-12,y-6); c.lineTo(x,y-26); c.lineTo(x+12,y-6); c.stroke(); c.fillStyle='rgba(255,255,255,.85)'; c.beginPath(); c.arc(x,y-30,12,Math.PI,TAU); c.fill();
      c.fillStyle=k.k==='m'?'#ffd23f':k.k==='w'?'#ff7eb6':'#3ed16a'; c.fillRect(x-11,y-7,22,18); c.strokeStyle='#14122b'; c.lineWidth=2; c.strokeRect(x-11,y-7,22,18); c.fillStyle='#14122b'; c.font='900 12px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(k.k==='m'?'彈':k.k==='w'?'P':'修',x,y+2); }
    // 敵人
    for(const e of E){ const x=e.x-cx,y=e.y; if(x<-80||x>W+80) continue; if(e.hitT>0) c.globalAlpha=.6;
      if(e.ty==='fighter'||e.ty==='swoop') planeSide(c,x,y,e.ty==='swoop'?(e.t<2.2?.3:-.4):Math.cos(e.t*2)*.15,e.ty==='swoop'?'#6a7a5a':'#7a8a9a',t,{dir:-1,s:.85,mark:'#c8202a',light:T.night});
      else if(e.ty==='bomber') bomberSide(c,x,y,'#5a6050',t); else if(e.ty==='balloon') balloon(c,x,y,t); else if(e.ty==='aa') aaGun(c,x,y,e.ga||-2.4);
      c.globalAlpha=1; if(e.max>4&&e.hp<e.max){ c.fillStyle='rgba(0,0,0,.4)'; c.fillRect(x-20,y-34,40,4); c.fillStyle='#ff6a5a'; c.fillRect(x-20,y-34,40*e.hp/e.max,4); } }
    if(boss){ const x=boss.x-cx; if(boss.hitT>0) c.globalAlpha=.65; planeSide(c,x,boss.y,boss.a||0,ST.col,t,{dir:-1,s:1.35,mark:'#14122b',scarf:'#14122b',light:T.night}); c.globalAlpha=1;
      c.font='900 13px '+TC; c.textAlign='center'; c.lineWidth=4; c.strokeStyle='#14122b'; c.strokeText('王牌 '+ST.opp,x,boss.y-40); c.fillStyle='#ffd23f'; c.fillText('王牌 '+ST.opp,x,boss.y-40); }
    // 玩家
    for(const p of P){ if(p.lives<=0&&p.dead<=0) continue; if(p.dead>0){ if(p.dead>1.3){ const u=(2-p.dead)/.7; c.globalAlpha=1-u; planeSide(c,p.x+u*40,p.y+u*u*120,u*3,'#5a5a60',t); c.globalAlpha=1; } continue; }
      if(p.inv>0&&Math.sin(t*30)>0) c.globalAlpha=.45; const rot=p.roll>0?(1-p.roll/.55)*TAU:clamp(p.vy*.0015,-.35,.35);
      c.save(); if(p.roll>0){ c.translate(p.x,p.y); c.scale(1,Math.cos((1-p.roll/.55)*TAU)); c.translate(-p.x,-p.y); } planeSide(c,p.x,p.y,p.roll>0?0:rot,p.hitT>0?'#ffffff':p.col,t,{scarf:p.i?'#ffd23f':'#ff4d4d',light:T.night}); c.restore(); c.globalAlpha=1;
      if(np>1||phase==='intro'){ c.font='900 12px '+TC; c.textAlign='center'; c.lineWidth=3; c.strokeStyle='#14122b'; const lb=two?(p.i?'2P':'1P'):net?names[p.i]:'你'; c.strokeText(lb,p.x,p.y-26); c.fillStyle='#ffd23f'; c.fillText(lb,p.x,p.y-26); } }
    // 子彈、導彈、特效
    c.lineCap='round'; for(const b of PB){ const x=b.x-cx; c.strokeStyle='#fff3a0'; c.lineWidth=3; c.beginPath(); c.moveTo(x,b.y); c.lineTo(x-12,b.y); c.stroke(); }
    for(const b of EB){ const x=b.x-cx; c.fillStyle='#ff4d6a'; c.beginPath(); c.arc(x,b.y,4.5,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(x,b.y,2,0,TAU); c.fill(); }
    for(const m of MS){ c.save(); c.translate(m.x-cx,m.y); c.rotate(m.a); c.fillStyle=m.o>=0?'#e8e8f0':'#ff8a5a'; c.fillRect(-9,-3,16,6); c.fillStyle='#ff4d4d'; c.beginPath(); c.moveTo(7,-3); c.lineTo(12,0); c.lineTo(7,3); c.fill(); c.fillStyle='#ffd23f'; c.beginPath(); c.arc(-11,0,3+Math.random()*2,0,TAU); c.fill(); c.restore(); }
    for(const e of FX){ const a=clamp(e.l/e.L,0,1),x=e.x-cx; if(e.k==='sp'){ c.globalAlpha=a; c.fillStyle=e.c; c.fillRect(x-2,e.y-2,4,4); } else if(e.k==='smk'){ c.globalAlpha=a*.5; c.fillStyle=T.night?'#556':'#8a8a8a'; c.beginPath(); c.arc(x,e.y,e.r*(2-a),0,TAU); c.fill(); }
      else if(e.k==='fire'){ c.globalAlpha=a; const rg=c.createRadialGradient(x,e.y,0,x,e.y,e.r*(1.4-a*.4)); rg.addColorStop(0,'rgba(255,250,210,1)'); rg.addColorStop(.4,'rgba(255,170,60,.9)'); rg.addColorStop(1,'rgba(255,60,20,0)'); c.fillStyle=rg; c.beginPath(); c.arc(x,e.y,e.r*(1.4-a*.4),0,TAU); c.fill(); }
      else if(e.k==='ring'){ c.globalAlpha=a*.8; c.strokeStyle=e.c||'#fff'; c.lineWidth=3; c.beginPath(); c.arc(x,e.y,(1-a)*e.r+8,0,TAU); c.stroke(); } else if(e.k==='mz'){ c.globalAlpha=1; c.fillStyle='#fff6c0'; c.beginPath(); c.arc(x,e.y,6,0,TAU); c.fill(); }
      else if(e.k==='hit'){ c.globalAlpha=a; c.strokeStyle='#fff'; c.lineWidth=2; for(let q=0;q<4;q++){ const an=q*Math.PI/2+.4; c.beginPath(); c.moveTo(x+Math.cos(an)*3,e.y+Math.sin(an)*3); c.lineTo(x+Math.cos(an)*10,e.y+Math.sin(an)*10); c.stroke(); } } } c.globalAlpha=1;
    for(const q of CL) if(q.z===2){ const x=((q.x-cx*1.3)%(W+300)+W+300)%(W+300)-150; cloud(x,q.y+40,q.s*1.3,T.night?.3:.55); } /* 前景雲 */
    if(T.storm){ c.strokeStyle='rgba(220,235,255,.3)'; c.lineWidth=1.5; for(let i=0;i<40;i++){ const x=(i*53-t*300)%W+(i*53-t*300<0?W:0),y=(i*97+t*700)%H; c.beginPath(); c.moveTo(x,y); c.lineTo(x-8,y+16); c.stroke(); } }
    if(T.lava){ for(let i=0;i<24;i++){ c.fillStyle='rgba(255,120,40,.6)'; c.fillRect((i*83-t*60+W*4)%W,(i*47-t*20+H*4)%H,2,2); } }
    if(flash>0){ c.fillStyle='rgba(255,255,255,'+flash*2+')'; c.fillRect(0,0,W,H); }
    if(T.night){ c.fillStyle='rgba(6,8,30,.3)'; c.fillRect(0,0,W,H); }
    c.restore(); hud(); }
  function hud(){ P.forEach((p,i)=>{ const x=8+i*250; c.fillStyle='rgba(10,14,30,.72)'; c.fillRect(x,8,238,46); c.fillStyle=p.col; c.fillRect(x,8,6,46);
      c.font='900 13px '+TC; c.textAlign='left'; c.textBaseline='middle'; c.fillStyle='#fff'; c.fillText(names[i]+'　'+p.score+' 分',x+14,20);
      for(let k=0;k<LIVES;k++){ c.fillStyle=k<p.lives?'#ff6a8a':'rgba(255,255,255,.2)'; c.font='900 12px '+TC; c.textAlign='right'; c.fillText('♥',x+228-k*14,20); }
      c.fillStyle='rgba(255,255,255,.15)'; c.fillRect(x+14,34,130,8); c.fillStyle=p.hp>50?'#3ed16a':p.hp>25?'#ffc21a':'#ff4d4d'; c.fillRect(x+14,34,130*p.hp/100,8);
      c.font='700 11px '+TC; c.textAlign='left'; c.fillStyle='#ffd23f'; c.fillText('導彈 '+p.miss+'　火力 '+p.wl,x+150,38); });
    c.textAlign='center'; c.textBaseline='middle';
    if(phase==='fly'){ const u=clamp(dist/ST.len,0,1); c.fillStyle='rgba(10,14,30,.6)'; c.fillRect(W-210,12,200,22); c.fillStyle='#ffd23f'; c.fillRect(W-206,16,192*u,14); c.font='900 11px '+TC; c.fillStyle='#14122b'; c.fillText('距離王牌 '+Math.round((1-u)*100)+'%',W-110,23); }
    if(boss){ c.fillStyle='rgba(10,14,30,.7)'; c.fillRect(W/2-170,H-30,340,20); c.fillStyle='#ff4d6a'; c.fillRect(W/2-166,H-26,332*Math.max(0,boss.hp)/boss.max,12); c.font='900 11px '+TC; c.fillStyle='#fff'; c.fillText('王牌 '+ST.opp,W/2,H-20); }
    if(ban&&ban.t<1.8){ const u=Math.min(1,ban.t*6),sc=1+(1-u)*.8; c.save(); c.translate(W/2,H/2-50); c.scale(sc,sc); c.globalAlpha=Math.min(1,(1.8-ban.t)*3); c.font='900 38px '+TC; c.lineWidth=8; c.strokeStyle='#14122b'; c.strokeText(ban.txt,0,0); c.fillStyle=ban.col; c.fillText(ban.txt,0,0); c.restore(); c.globalAlpha=1; } }
  return {update,draw,destroy(){},_dbg:{P,get E(){return E;},get boss(){return boss;},get phase(){return phase;},get dist(){return dist;},set dist(v){dist=v;},get EB(){return EB;}}};
}
function stageShow(ctx,w,h,si,t){ const S=STAGES[si],T=TH[S.th]; ctx.save(); ctx.scale(w/W,h/H); const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,T.sky[0]); g.addColorStop(1,T.sky[1]); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  const cx=t*90; ctx.fillStyle=T.far; ctx.beginPath(); ctx.moveTo(0,H); for(let x=0;x<=W;x+=20){ const wx=x+cx*.25; ctx.lineTo(x,H-120-50*Math.sin(wx*.006)-30*Math.sin(wx*.017)); } ctx.lineTo(W,H); ctx.fill();
  ctx.fillStyle=T.land; ctx.beginPath(); ctx.moveTo(0,H); for(let x=0;x<=W;x+=8) ctx.lineTo(x,terr(si,cx+x)); ctx.lineTo(W,H); ctx.fill();
  planeSide(ctx,230,190+Math.sin(t*2)*30,Math.cos(t*2)*.25,'#ff5d4f',t,{light:T.night}); planeSide(ctx,600,150+Math.sin(t*1.5+1)*40,0,S.col,t,{dir:-1,s:1.35,mark:'#14122b',scarf:'#14122b',light:T.night});
  for(let i=0;i<5;i++){ const q=(t*2+i/5)%1; ctx.fillStyle='#fff3a0'; ctx.fillRect(270+q*280,190+Math.sin(t*2)*30,10,3); }
  if(T.night){ ctx.fillStyle='rgba(6,8,30,.35)'; ctx.fillRect(0,0,W,H); }
  ctx.font='900 22px '+TC; ctx.textAlign='center'; ctx.lineWidth=6; ctx.strokeStyle='#14122b'; ctx.strokeText('關底王牌：'+S.opp,W/2,40); ctx.fillStyle='#ffd23f'; ctx.fillText('關底王牌：'+S.opp,W/2,40); ctx.restore(); }
function preview(ctx,w,h,L,t){ const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#7cc8ff'); g.addColorStop(1,'#d8f0ff'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  const s=h/80; planeSide(ctx,w/2,h/2+Math.sin(t*2)*6,Math.sin(t)*.15,(L&&L.color)||'#ff5d4f',t,{s}); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).sky={name:'雲端纏鬥',tag:'SKY DOGFIGHT',color:'#3d8bff',online:true,maxPlayers:2,
  desc:'橫向捲軸空戰！Q 版小飛機自動開火往前飛，打下敵機群、防空砲和轟炸機，撿補給升級火力、補導彈，最後跟關底的王牌一對一纏鬥。兩個人可以一起合作，10 片天空一關比一關難。',
  goal:'一路往前飛到關底，打下王牌就過關；三架飛機都被打下來就失敗。',
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  stageGoal:i=>STAGES[i].name+'（關底王牌：'+STAGES[i].opp+'）：'+TIPS[i]+' 打下王牌就過關。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人合作',kb:true}],
  help:[['↑ ↓ ← →','移動（飛機會自動開火）'],['K 或 空白鍵','發射追蹤導彈'],['J','翻滾閃避（翻滾時不會被打到）'],['雙人','1P：WASD＋F 導彈、G 閃避　2P：方向鍵＋, 導彈、. 閃避']],
  touchHelp:[['方向盤','移動，會自動開火'],['導彈','發射追蹤導彈'],['閃避','翻滾躲子彈']],
  touch:{left:'dpad',right:[{l:'閃避',c:'KeyJ'},{l:'導彈',c:'KeyK',act:true}]},
  looks:[{key:'color',label:'飛機顏色',type:'color',opts:['#ff5d4f','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#3d8bff','#b98cff','#f4f4f4']}],
  hubBest:()=>{ const n=STAGES.filter((s,i)=>hasWin(i)).length; return n?'打下 <b>'+n+' / '+STAGES.length+'</b> 位王牌':'尚無紀錄'; },
  stageBest:i=>hasWin(i)?'★ 贏過':'',
  stageShow,preview,thumb:(ctx,w,h,t)=>stageShow(ctx,w,h,0,t),create,_draw:{planeSide}};
})();
