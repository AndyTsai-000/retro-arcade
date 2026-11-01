// 彩泡連連發：瞄準發射，三顆以上同色就消掉，懸空的一起掉。單人闖關 100 關，過一關開下一關。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,LV=100;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function mul(seed){ let a=seed>>>0||1; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const R=16,D=R*2,ROWH=27.7,COLS=12,FX=208,FW=COLS*D,FY=14,LINE=412,SX=FX+FW/2,SY=462;
const COL=['#ff5d6d','#4f9dff','#ffd23f','#5fd068','#c56bff','#ff9d3d'],MARK=['♥','●','★','♣','◆','▲'];
const THEMES=[{n:'晴空草原',a:'#8fd8ff',b:'#d8f6c8',f:'#4f9a5a'},{n:'粉彩糖果',a:'#ffc4e0',b:'#fff0d8',f:'#e87aa8'},{n:'碧海沙灘',a:'#5ac8e8',b:'#f4e4b0',f:'#3a8aa8'},{n:'黃昏山谷',a:'#ff9a6a',b:'#ffe0a0',f:'#a8584a'},{n:'星空夜晚',a:'#141a48',b:'#4a3a8a',f:'#3a3a7a'}];
/* 關卡：越後面排數、顏色越多，天花板降得越快 */
const starsOf=i=>Math.min(5,1+Math.floor(i/20));
function levelOf(i){ const r=mul(i*131+7),rows=Math.min(9,3+Math.floor(i/14)+(i%5===4?1:0)),nc=Math.min(6,3+Math.floor(i/22)),drop=Math.max(3,8-Math.floor(i/20)),kind=i%7,g=[];
  const pal=[]; const base=[0,1,2,3,4,5]; for(let k=5;k>0;k--){ const q=Math.floor(r()*(k+1)),t=base[k]; base[k]=base[q]; base[q]=t; } for(let k=0;k<nc;k++) pal.push(base[k]);
  for(let y=0;y<rows;y++){ const n=y%2?COLS-1:COLS,row=[]; for(let x=0;x<n;x++){ const mx=(n-1)/2,dx=Math.abs(x-mx),ny=y/Math.max(1,rows-1); let on=true; if(kind===1) on=dx<=mx*(1-ny*.75)+.5; else if(kind===2) on=dx>=mx*ny*.72-.5; else if(kind===3) on=(x+(y>>1))%4!==3||y===0; else if(kind===4) on=y===0||dx>1.5; else if(kind===5) on=y<2||(x%3!==1); const block=Math.floor((x+y*(kind===6?1:0))/2)+Math.floor(y/2)*(kind===0?1:2); let v=on?pal[(r()<.62?block:Math.floor(r()*nc))%nc]:-1; if(on&&i>=40&&r()<Math.min(.08,(i-30)*.0012)&&y>0) v=9; row.push(v); } g.push(row); }
  return {g,pal,drop,theme:THEMES[Math.floor(i/20)%5],stars:starsOf(i)}; }
const nbr=(y,x)=>y%2?[[y,x-1],[y,x+1],[y-1,x],[y-1,x+1],[y+1,x],[y+1,x+1]]:[[y,x-1],[y,x+1],[y-1,x-1],[y-1,x],[y+1,x-1],[y+1,x]];
const key=(y,x)=>y*100+x;
const bKey='arcade.bubble.v.',getRec=i=>{ try{ const v=localStorage.getItem(bKey+i); return v==null?null:+v; }catch(e){ return null; } },setRec=(i,v)=>{ try{ const o=getRec(i); if(o==null||v>o) localStorage.setItem(bKey+i,String(v)); }catch(e){} };
const SPR={};
function ball(col,mark){ const k=col+mark; if(SPR[k]) return SPR[k]; const e=document.createElement('canvas'); e.width=e.height=72; const c=e.getContext('2d'); c.scale(2,2); c.translate(18,18); const g=c.createRadialGradient(-5,-6,1,0,0,16.5); if(col==='#stone'){ g.addColorStop(0,'#d8d8dc'); g.addColorStop(.6,'#8a8a94'); g.addColorStop(1,'#4a4a54'); } else { g.addColorStop(0,'#fff'); g.addColorStop(.28,col); g.addColorStop(1,shade(col,.55)); } c.fillStyle=g; c.beginPath(); c.arc(0,0,15.5,0,TAU); c.fill(); c.strokeStyle='rgba(20,18,43,.45)'; c.lineWidth=1.2; c.stroke(); c.fillStyle='rgba(255,255,255,.72)'; c.beginPath(); c.ellipse(-5.5,-7,4.2,2.8,-.6,0,TAU); c.fill(); if(mark){ c.fillStyle='rgba(20,18,43,.34)'; c.font='900 12px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(mark,0,2); } return SPR[k]=e; }
function shade(h,k){ const n=parseInt(h.slice(1),16),q=v=>clamp(Math.round(v*k),0,255); return 'rgb('+q(n>>16)+','+q(n>>8&255)+','+q(n&255)+')'; }
const sprOf=v=>v===9?ball('#stone',''):ball(COL[v],MARK[v]);
function scenery(c,T,t,ww,hh){ const g=c.createLinearGradient(0,0,0,hh); g.addColorStop(0,T.a); g.addColorStop(1,T.b); c.fillStyle=g; c.fillRect(0,0,ww,hh); if(T===THEMES[4]){ c.fillStyle='#fff'; for(let i=0;i<70;i++){ c.globalAlpha=.3+.6*Math.abs(Math.sin(t+i)); c.fillRect((i*97)%ww,(i*53)%(hh*.8),1.6,1.6); } c.globalAlpha=1; } else { c.fillStyle='rgba(255,255,255,.7)'; for(let i=0;i<5;i++){ const x=((i*170+t*8)%(ww+160))-80,y=40+i*44; c.beginPath(); c.ellipse(x,y,44,12,0,0,TAU); c.ellipse(x+24,y-6,26,11,0,0,TAU); c.fill(); } } c.fillStyle=T.f; c.globalAlpha=.55; c.beginPath(); c.moveTo(0,hh); for(let x=0;x<=ww;x+=20) c.lineTo(x,hh-46-Math.sin(x*.02)*22-Math.sin(x*.05)*8); c.lineTo(ww,hh); c.fill(); c.globalAlpha=1; }
function critter(c,x,y,t,happy){ c.save(); c.translate(x,y); const INK='#2a1a26'; c.lineWidth=2; c.strokeStyle=INK; c.fillStyle='#ffe07a'; c.beginPath(); c.ellipse(0,8,17,14,0,0,TAU); c.fill(); c.stroke(); for(const k of [-1,1]){ c.fillStyle='#ffe07a'; c.beginPath(); c.moveTo(k*14,-12); c.lineTo(k*20,-26); c.lineTo(k*5,-20); c.closePath(); c.fill(); c.stroke(); } c.fillStyle='#ffe07a'; c.beginPath(); c.arc(0,-8,19,0,TAU); c.fill(); c.stroke(); c.fillStyle=INK; for(const k of [-1,1]){ if(happy){ c.beginPath(); c.arc(k*7,-8,3.4,Math.PI,0); c.stroke(); } else { c.beginPath(); c.arc(k*7,-8,3.2,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(k*7-1,-9.2,1,0,TAU); c.fill(); c.fillStyle=INK; } } c.fillStyle='rgba(255,110,130,.5)'; c.beginPath(); c.ellipse(-12,-2,3.4,2.2,0,0,TAU); c.ellipse(12,-2,3.4,2.2,0,0,TAU); c.fill(); c.beginPath(); c.moveTo(-3,-3); c.quadraticCurveTo(0,0,3,-3); c.stroke(); c.restore(); }

function create(env,opts){
  const si=clamp(opts.stage|0,0,LV-1),L=levelOf(si),{ctx:c,canvas}=env.canvas2d(W,H);
  let grid=L.g.map(r=>r.slice()),top=0,misses=0,shots=0,score=0,aim=-Math.PI/2,cur=-1,nextB=-1,shot=null,fx=[],fall=[],t=0,over=null,ended=false,combo=0,shake=0,msg=null,rec=null,mouseAim=false,press=false;
  const X=(y,x)=>FX+R+x*D+(y%2?R:0),Y=y=>FY+R+y*ROWH+top*ROWH,sfx=n=>env.sfx(n);
  const get=(y,x)=>grid[y]&&grid[y][x]!=null?grid[y][x]:-1;
  const has=(y,x)=>{ const v=get(y,x); return v>=0; };
  const rowN=y=>y%2?COLS-1:COLS;
  const ensure=y=>{ while(grid.length<=y){ const n=rowN(grid.length); grid.push(Array(n).fill(-1)); } };
  const colorsLeft=()=>{ const s=new Set(); for(const r of grid) for(const v of r) if(v>=0&&v!==9) s.add(v); return [...s]; };
  const pick=()=>{ const a=colorsLeft(); return a.length?a[Math.floor(Math.random()*a.length)]:L.pal[0]; };
  cur=pick(); nextB=pick();
  /* 沿著角度走，算出會落在哪一格（瞄準線和電腦測試都用這個） */
  function trace(ang,col){ let x=SX,y=SY-20,dx=Math.cos(ang),dy=Math.sin(ang); const pts=[[x,y]]; for(let s=0;s<1400;s++){ x+=dx*4; y+=dy*4; if(x<FX+R){ x=FX+R; dx=-dx; pts.push([x,y]); } else if(x>FX+FW-R){ x=FX+FW-R; dx=-dx; pts.push([x,y]); } const h=hitAt(x,y); if(h){ pts.push([x,y]); return {pts,x,y}; } } return {pts,x,y}; }
  function hitAt(x,y){ if(y<=FY+R+top*ROWH) return true; const yy=Math.round((y-FY-R)/ROWH-top); for(let ry=yy-1;ry<=yy+1;ry++){ if(!grid[ry]) continue; for(let cx=0;cx<grid[ry].length;cx++){ if(grid[ry][cx]>=0&&Math.hypot(X(ry,cx)-x,Y(ry)-y)<D*.86) return true; } } return false; }
  function snap(x,y){ let best=null,bd=1e9; const yy=Math.max(0,Math.round((y-FY-R)/ROWH-top)); for(let ry=Math.max(0,yy-1);ry<=yy+1;ry++){ for(let cx=0;cx<rowN(ry);cx++){ if(has(ry,cx)) continue; const touching=ry===0||nbr(ry,cx).some(([a,b])=>has(a,b)); if(!touching) continue; const d=Math.hypot(X(ry,cx)-x,Y(ry)-y); if(d<bd){ bd=d; best=[ry,cx]; } } } return best; }
  function cluster(y,x,col){ const seen=new Set([key(y,x)]),q=[[y,x]],out=[[y,x]]; while(q.length){ const [a,b]=q.pop(); for(const [p,r] of nbr(a,b)) if(get(p,r)===col&&!seen.has(key(p,r))){ seen.add(key(p,r)); q.push([p,r]); out.push([p,r]); } } return out; }
  function burst(x,y,col,n){ for(let i=0;i<n;i++){ const a=Math.random()*TAU,v=60+Math.random()*190; fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,l:.5+Math.random()*.3,L:.8,c:col,s:2+Math.random()*3}); } fx.push({ring:1,x,y,l:.3,L:.3,c:col}); }
  function floaters(){ const seen=new Set(),q=[]; (grid[0]||[]).forEach((v,x)=>{ if(v>=0){ seen.add(key(0,x)); q.push([0,x]); } }); while(q.length){ const [a,b]=q.pop(); for(const [p,r] of nbr(a,b)) if(has(p,r)&&!seen.has(key(p,r))){ seen.add(key(p,r)); q.push([p,r]); } } const out=[]; grid.forEach((row,y)=>row.forEach((v,x)=>{ if(v>=0&&!seen.has(key(y,x))) out.push([y,x,v]); })); return out; }
  function land(y,x,col){ ensure(y); grid[y][x]=col; const cl=cluster(y,x,col); let gain=0; if(cl.length>=3){ combo++; for(const [a,b] of cl){ burst(X(a,b),Y(a),COL[col],9); grid[a][b]=-1; gain+=10; } const fl=floaters(); for(const [a,b,v] of fl){ fall.push({x:X(a,b),y:Y(a),vx:(Math.random()-.5)*90,vy:-60-Math.random()*90,v}); grid[a][b]=-1; gain+=20; } if(fl.length){ gain+=fl.length*5; msg={s:'連帶掉落 ×'+fl.length+'！',l:1.1}; shake=Math.min(8,3+fl.length*.5); } sfx(fl.length?'boom':'pop'); score+=gain*Math.max(1,Math.min(4,combo)); }
    else { combo=0; misses++; sfx('bump'); if(misses>=L.drop){ misses=0; top++; shake=6; sfx('trap'); msg={s:'天花板下降！',l:1}; } }
    shots++; if(colorsLeft().length===0){ const fin=[]; grid.forEach((r,a)=>r.forEach((v,b)=>{ if(v===9) fin.push([a,b]); })); for(const [a,b] of fin){ fall.push({x:X(a,b),y:Y(a),vx:0,vy:0,v:9}); grid[a][b]=-1; } win(); return; }
    for(let a=grid.length-1;a>=0;a--) for(let b=0;b<grid[a].length;b++) if(grid[a][b]>=0&&Y(a)+R>LINE){ lose(); return; }
    cur=nextB; if(!colorsLeft().includes(cur)) cur=pick(); nextB=pick(); }
  function win(){ if(over) return; const bonus=Math.max(0,(40-shots))*20+(L.drop-misses)*10; score+=bonus; over={win:true,T:1.6}; rec=getRec(si); setRec(si,score); sfx('win'); }
  function lose(){ if(over) return; over={win:false,T:1.6}; sfx('lose'); }
  function fire(){ if(shot||over||t<.3||cur<0) return; shot={x:SX,y:SY-20,dx:Math.cos(aim),dy:Math.sin(aim),col:cur}; cur=-1; sfx('click'); }
  /* 輸入 */
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const setAim=e=>{ const [x,y]=toG(e); const a=Math.atan2(Math.min(y,SY-30)-(SY-20),x-SX); aim=clamp(a,-Math.PI+.13,-.13); mouseAim=true; };
  const dn=e=>{ press=true; setAim(e); if(e.pointerType==='mouse') fire(); }; const mv=e=>{ if(e.pointerType==='mouse'||press) setAim(e); }; const up=e=>{ if(press&&e.pointerType!=='mouse') fire(); press=false; };
  canvas.addEventListener('pointerdown',dn); addEventListener('pointermove',mv); addEventListener('pointerup',up); canvas.style.touchAction='none';
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt; const K=env.keys,turn=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0); if(turn&&!over) aim=clamp(aim+turn*dt*1.5,-Math.PI+.13,-.13); if(env.hit('Space')||env.hit('ArrowUp')||env.hit('KeyW')||env.hit('KeyJ')) fire();
    if(shake>0) shake=Math.max(0,shake-dt*22); if(msg&&(msg.l-=dt)<=0) msg=null;
    if(shot){ const SP=880,n=Math.ceil(SP*dt/5); for(let i=0;i<n&&shot;i++){ shot.x+=shot.dx*SP*dt/n; shot.y+=shot.dy*SP*dt/n; if(shot.x<FX+R){ shot.x=FX+R; shot.dx=-shot.dx; } else if(shot.x>FX+FW-R){ shot.x=FX+FW-R; shot.dx=-shot.dx; } if(hitAt(shot.x,shot.y)){ const q=snap(shot.x,shot.y),col=shot.col; shot=null; if(q) land(q[0],q[1],col); else lose(); } } }
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; if(f.l<=0){ fx.splice(i,1); continue; } if(!f.ring){ f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=420*dt; } } for(let i=fall.length-1;i>=0;i--){ const f=fall[i]; f.vy+=900*dt; f.x+=f.vx*dt; f.y+=f.vy*dt; if(f.y>H+30) fall.splice(i,1); }
    if(over){ over.T-=dt; if(over.T<=0&&!ended){ ended=true; env.end({title:over.win?'第 '+(si+1)+' 關過關！':'第 '+(si+1)+' 關失敗',big:score+' 分',text:over.win?'用了 '+shots+' 發':'泡泡碰到底線了，再試一次！',score:over.win?score:null,next:over.win&&si<LV-1}); } } }
  function draw(){ c.save(); if(shake>0) c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake); scenery(c,L.theme,t,W,H);
    c.fillStyle='rgba(255,255,255,.42)'; rr(c,FX-6,FY-6,FW+12,H-FY,14); c.fill(); c.strokeStyle='rgba(20,18,43,.55)'; c.lineWidth=3; c.stroke(); c.fillStyle='#4a4680'; c.fillRect(FX-6,FY-6,FW+12,Math.max(6,top*ROWH+6));
    c.setLineDash([9,6]); c.strokeStyle='rgba(226,59,59,.8)'; c.lineWidth=2; c.beginPath(); c.moveTo(FX,LINE); c.lineTo(FX+FW,LINE); c.stroke(); c.setLineDash([]);
    if(!shot&&!over&&cur>=0){ const T=trace(aim,cur); c.fillStyle='rgba(20,18,43,.5)'; let d=0,ph=(t*60)%18; for(let i=1;i<T.pts.length;i++){ const [a,b]=T.pts[i-1],[e,f]=T.pts[i],l=Math.hypot(e-a,f-b); for(let q=18-(d+ph)%18;q<l;q+=18){ c.beginPath(); c.arc(a+(e-a)*q/l,b+(f-b)*q/l,2.6,0,TAU); c.fill(); } d+=l; } }
    grid.forEach((row,y)=>row.forEach((v,x)=>{ if(v>=0) c.drawImage(sprOf(v),X(y,x)-18,Y(y)-18,36,36); }));
    for(const f of fall) c.drawImage(sprOf(f.v),f.x-18,f.y-18,36,36);
    if(shot) c.drawImage(sprOf(shot.col),shot.x-18,shot.y-18,36,36);
    /* 發射台 */
    c.save(); c.translate(SX,SY); c.rotate(aim+Math.PI/2); c.fillStyle='#4a4680'; rr(c,-11,-40,22,40,7); c.fill(); c.strokeStyle='#14122b'; c.lineWidth=2.5; c.stroke(); c.restore(); c.fillStyle='#6a64a8'; c.beginPath(); c.arc(SX,SY+4,24,0,TAU); c.fill(); c.strokeStyle='#14122b'; c.lineWidth=2.5; c.stroke(); if(cur>=0&&!shot) c.drawImage(sprOf(cur),SX-18,SY-14,36,36);
    critter(c,SX+58,SY+6,t,over&&over.win);
    /* 下一顆 */
    c.font='900 11px '+TC; c.textAlign='center'; c.fillStyle='#14122b'; c.fillText('下一顆',SX-72,SY-20); if(nextB>=0) c.drawImage(sprOf(nextB),SX-90,SY-14,36,36);
    for(const f of fx){ const a=f.l/f.L; if(f.ring){ c.globalAlpha=a; c.strokeStyle=f.c; c.lineWidth=3; c.beginPath(); c.arc(f.x,f.y,16+(1-a)*22,0,TAU); c.stroke(); c.globalAlpha=1; } else { c.globalAlpha=a; c.fillStyle=f.c; c.beginPath(); c.arc(f.x,f.y,f.s,0,TAU); c.fill(); c.globalAlpha=1; } }
    c.restore();
    /* 資訊 */
    const panel=(x,y,w,h)=>{ c.fillStyle='rgba(11,10,28,.78)'; rr(c,x,y,w,h,12); c.fill(); }; panel(14,14,176,118); c.textAlign='left'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 20px '+TC; c.fillText('第 '+(si+1)+' 關',28,38); c.fillStyle='#ffd23f'; c.font='12px '+TC; c.fillText('★'.repeat(L.stars),108,39); c.fillStyle='#fff'; c.font='900 24px '+TC; c.fillText(score,28,72); c.font='700 11px '+TC; c.fillStyle='#cfc8ff'; c.fillText('分數',28,92); const best=getRec(si); c.fillText(best!=null?'本關最高 '+best:'尚未過關',28,114);
    panel(14,142,176,68); c.font='700 12px '+TC; c.fillStyle='#fff'; c.fillText('天花板下降倒數',28,160); for(let i=0;i<L.drop;i++){ c.fillStyle=i<L.drop-misses?'#5fd068':'rgba(255,255,255,.2)'; c.beginPath(); c.arc(34+i*20,186,7,0,TAU); c.fill(); }
    if(t<3){ panel(610,14,176,76); c.fillStyle='#fff'; c.font='900 13px '+TC; c.textAlign='center'; c.fillText(env.touch?'手指拖曳瞄準，放開發射':'滑鼠瞄準，按左鍵發射',698,40); c.fillStyle='#ffd23f'; c.fillText('三顆同色就消掉',698,66); }
    if(msg){ c.font='900 24px '+TC; c.textAlign='center'; c.lineWidth=6; c.strokeStyle='#14122b'; c.strokeText(msg.s,SX,H/2); c.fillStyle='#ffd23f'; c.fillText(msg.s,SX,H/2); }
    if(over){ c.fillStyle='rgba(11,10,28,.5)'; c.fillRect(0,H/2-44,W,88); c.font='900 40px '+TC; c.textAlign='center'; c.fillStyle=over.win?'#ffd23f':'#ff8a8a'; c.fillText(over.win?'過關！':'失敗了',W/2,H/2); } }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',dn); removeEventListener('pointermove',mv); removeEventListener('pointerup',up); },_dbg:{get grid(){return grid;},get cur(){return cur;},get over(){return over;},get shot(){return shot;},get score(){return score;},setAim(a){ aim=a; },fire,trace,snap,cluster,get:(y,x)=>get(y,x),get top(){return top;}}};
}
function stageShow(ctx,w,h,si,t){ const L=levelOf(si); ctx.save(); ctx.scale(w/W,h/H); scenery(ctx,L.theme,t,W,H); ctx.fillStyle='rgba(255,255,255,.42)'; rr(ctx,FX-6,FY-6,FW+12,H-FY,14); ctx.fill(); L.g.forEach((row,y)=>row.forEach((v,x)=>{ if(v>=0) ctx.drawImage(sprOf(v),FX+R+x*D+(y%2?R:0)-18,FY+R+y*ROWH-18,36,36); })); critter(ctx,SX+58,SY+6,t,false); const c0=L.pal[0]; ctx.drawImage(sprOf(c0),SX-18,SY-14,36,36); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).bubble={
  name:'彩泡連連發',tag:'BUBBLE SHOT',color:'#ff7eb6',
  desc:'瞄準發射，湊滿三顆同色泡泡就消掉，懸空的會一起掉下來！共 100 關，過一關開下一關。',
  goal:'把彩色泡泡全部消掉就過關。連續沒消到，天花板會往下降，泡泡碰到紅線就失敗。灰色石頭消不掉，要讓它懸空掉下來。',
  stages:Array.from({length:LV},(_,i)=>'第 '+(i+1)+' 關'),stars:Array.from({length:LV},(_,i)=>starsOf(i)),stageGrid:true,
  stageLocked:i=>i>0&&getRec(i-1)==null,stageBest:i=>{ const v=getRec(i); return v==null?'':'✓ '+v; },
  hubBest:()=>{ let n=0; for(let i=0;i<LV;i++) if(getRec(i)!=null) n++; return n?'已過關 <b>'+n+' / '+LV+'</b>':'尚無紀錄'; },
  stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,44,t),
  help:[['滑鼠','瞄準，按左鍵發射'],['← →','也可以用鍵盤調角度'],['空白鍵','發射']],touchHelp:[['手指拖曳','瞄準'],['放開','發射']],touch:null,
  best:{label:'最高分',fmt:v=>v+' 分',lower:false},create};
})();
