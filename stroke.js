// 一筆畫連連看：從一個點開始，沿著線一筆把所有線都畫過，每條線只能畫一次。
// 100 關：每關是用亂數「真的畫一筆」產生的，保證有解。第 40 關起有要畫兩次的粗線（×2），第 70 關起有單向箭頭線。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,LV=100;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rng(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const THEMES=[
 {n:'方格筆記本',bg:'#fdf8ec',grid:'rgba(90,140,200,.18)',line:'#c8c0b0',ink:['#4f9dff','#7a5aff'],dot:'#3a3a4a',dark:false},
 {n:'教室黑板',bg:'#264a3a',grid:'rgba(255,255,255,.05)',line:'rgba(255,255,255,.35)',ink:['#fff6a8','#ffb0d8'],dot:'#f4f4e8',dark:true},
 {n:'星座夜空',bg:'#0e1238',grid:'rgba(255,255,255,0)',line:'rgba(160,180,255,.3)',ink:['#9ad8ff','#ffffff'],dot:'#ffe9a8',dark:true},
 {n:'花園藤蔓',bg:'#e8f6d8',grid:'rgba(80,160,80,.1)',line:'#b8d0a8',ink:['#3aa84a','#ff7aa8'],dot:'#6a4a2a',dark:false},
 {n:'霓虹街頭',bg:'#14081e',grid:'rgba(255,90,200,.06)',line:'rgba(255,255,255,.18)',ink:['#ff4ad8','#3af0ff'],dot:'#ffffff',dark:true},
];
const starsOf=i=>Math.min(5,1+Math.floor(i/20));
const DIRS=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
/* ---------- 出題：在格子點上隨機「畫一筆」，畫過的線就是題目 ---------- */
function levelOf(i){ const d=i/(LV-1),cols=clamp(3+Math.floor(i/14),3,6),rows=clamp(3+Math.floor((i+7)/16),3,6),E=Math.round(5+d*25+(i%5===4?2:0));
  const dbl=i>=40?Math.min(.22,.06+(i-40)*.003):0,one=i>=70?Math.min(.25,.08+(i-70)*.005):0,diag=i>=6;
  for(let seed=1;seed<400;seed++){ const r=rng(i*7907+seed*131),key=(a,b)=>a<b?a+'-'+b:b+'-'+a,id=(x,y)=>y*cols+x,ed=new Map(),walk=[];
    let cx=Math.floor(r()*cols),cy=Math.floor(r()*rows); walk.push(id(cx,cy));
    const cross=(x,y,dx,dy)=>{ if(!dx||!dy) return false; const k=key(id(x+dx,y),id(x,y+dy)); return ed.has(k); };
    let guard=0; while(walk.length-1<E&&guard++<400){ const opts=[]; for(const [dx,dy] of DIRS){ if(!diag&&dx&&dy) continue; const nx=cx+dx,ny=cy+dy; if(nx<0||ny<0||nx>=cols||ny>=rows) continue; const k=key(id(cx,cy),id(nx,ny)),e=ed.get(k); if(e&&(e.n>=2||e.dir||r()>dbl)) continue; if(!e&&cross(cx,cy,dx,dy)) continue; opts.push([nx,ny,k,!!e,dx&&dy?.55:1]); }
      if(!opts.length) break; let tw=opts.reduce((a,o)=>a+o[4]*(o[3]?.4:1),0),q=r()*tw,pick=opts[0]; for(const o of opts){ q-=o[4]*(o[3]?.4:1); if(q<=0){ pick=o; break; } }
      const [nx,ny,k,ex]=pick; if(ex){ ed.get(k).n=2; } else ed.set(k,{a:id(cx,cy),b:id(nx,ny),n:1,dir:r()<one?[id(cx,cy),id(nx,ny)]:null}); cx=nx; cy=ny; walk.push(id(cx,cy)); }
    if(walk.length-1<E) continue;
    const deg=new Map(); for(const e of ed.values()){ deg.set(e.a,(deg.get(e.a)||0)+e.n); deg.set(e.b,(deg.get(e.b)||0)+e.n); } let branch=0; for(const v of deg.values()) if(v>=3) branch++;
    if(branch<Math.max(1,Math.floor(E/7))) continue;
    /* 雙線不能是單向；只留有用到的點 */ for(const e of ed.values()) if(e.n===2) e.dir=null;
    const used=[...deg.keys()].sort((a,b)=>a-b),nodes=used.map(v=>({v,x:v%cols,y:Math.floor(v/cols)})),idx=new Map(used.map((v,k)=>[v,k]));
    const edges=[...ed.values()].map(e=>({a:idx.get(e.a),b:idx.get(e.b),n:e.n,dir:e.dir?[idx.get(e.dir[0]),idx.get(e.dir[1])]:null}));
    return {i,cols,rows,nodes,edges,sol:walk.map(v=>idx.get(v)),theme:THEMES[Math.floor(i/20)%5],stars:starsOf(i),E:edges.reduce((a,e)=>a+e.n,0)}; }
  return null; }
/* 從目前狀態找一個解（提示用）：深度優先，邊數不多很快 */
function solveFrom(L,path,used){ const adj=L.nodes.map(()=>[]); L.edges.forEach((e,k)=>{ if(!e.dir||e.dir[0]===e.a) adj[e.a].push([e.b,k]); if(!e.dir||e.dir[0]===e.b) adj[e.b].push([e.a,k]); });
  const left=L.edges.map((e,k)=>e.n-(used[k]||0)),total=left.reduce((a,b)=>a+b,0),seq=[]; let steps=0;
  /* 剩下的線要跟目前位置連在一起，不然一定走不完 */
  function linked(v){ const seen=new Set([v]),q=[v]; while(q.length){ const x=q.pop(); L.edges.forEach((e,k)=>{ if(left[k]<=0) return; let y=-1; if(e.a===x) y=e.b; else if(e.b===x) y=e.a; if(y>=0&&!seen.has(y)){ seen.add(y); q.push(y); } }); } return L.edges.every((e,k)=>left[k]<=0||seen.has(e.a)); }
  function dfs(v,rem){ if(rem===0) return true; if(++steps>60000) return false; if(!linked(v)) return false; for(const [w,k] of adj[v]){ if(left[k]<=0) continue; left[k]--; seq.push(w); if(dfs(w,rem-1)) return true; seq.pop(); left[k]++; } return false; }
  if(!path.length){ const order=[L.sol[0]].concat(L.nodes.map((_,k)=>k).filter(k=>k!==L.sol[0])); for(const s of order){ steps=0; seq.length=0; seq.push(s); if(dfs(s,total)) return seq.slice(); } return null; }
  steps=0;
  return dfs(path[path.length-1],total)?seq.slice():null; }
const bKey='arcade.stroke.v.',getRec=i=>{ try{ const v=localStorage.getItem(bKey+i); return v==null?null:+v; }catch(e){ return null; } },setRec=(i,v)=>{ try{ const o=getRec(i); if(o==null||v>o) localStorage.setItem(bKey+i,String(v)); }catch(e){} };
const LC={};
const lvl=i=>LC[i]||(LC[i]=levelOf(i));
/* 版面：盤面在右邊 */
function layout(L){ const BX=300,BY=40,BW=470,BH=420,sp=Math.min(BW/(L.cols-1||1),BH/(L.rows-1||1),110),ox=BX+(BW-sp*(L.cols-1))/2,oy=BY+(BH-sp*(L.rows-1))/2; return {sp,P:L.nodes.map(n=>[ox+n.x*sp,oy+n.y*sp])}; }
function paper(c,T,t,w,h){ c.fillStyle=T.bg; c.fillRect(0,0,w,h); if(T===THEMES[0]){ c.strokeStyle=T.grid; c.lineWidth=1; for(let x=0;x<w;x+=24){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,h); c.stroke(); } for(let y=0;y<h;y+=24){ c.beginPath(); c.moveTo(0,y); c.lineTo(w,y); c.stroke(); } c.strokeStyle='rgba(255,90,90,.4)'; c.beginPath(); c.moveTo(60,0); c.lineTo(60,h); c.stroke(); }
  else if(T===THEMES[1]){ c.strokeStyle='#8a5a2a'; c.lineWidth=14; c.strokeRect(0,0,w,h); for(let i=0;i<30;i++){ c.fillStyle='rgba(255,255,255,.04)'; c.beginPath(); c.ellipse((i*137)%w,(i*71)%h,60,14,i,0,TAU); c.fill(); } }
  else if(T===THEMES[2]){ for(let i=0;i<120;i++){ c.fillStyle='rgba(255,255,255,'+(.25+.5*Math.abs(Math.sin(t*.8+i)))+')'; c.fillRect((i*197)%w,(i*83)%h,1.6,1.6); } const g=c.createRadialGradient(w*.8,h*.2,10,w*.8,h*.2,260); g.addColorStop(0,'rgba(120,90,255,.25)'); g.addColorStop(1,'rgba(120,90,255,0)'); c.fillStyle=g; c.fillRect(0,0,w,h); }
  else if(T===THEMES[3]){ c.strokeStyle='rgba(80,160,80,.25)'; c.lineWidth=6; c.lineCap='round'; for(let i=0;i<6;i++){ c.beginPath(); c.moveTo(0,i*90+20); c.bezierCurveTo(140,i*90-30,260,i*90+70,w,i*90+10); c.stroke(); } for(let i=0;i<24;i++){ c.fillStyle=['#ff9ac8','#ffd23f','#fff'][i%3]; c.beginPath(); c.arc((i*131)%w,(i*57)%h,4,0,TAU); c.fill(); } }
  else { c.strokeStyle=T.grid; c.lineWidth=1; for(let x=0;x<w;x+=40){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,h); c.stroke(); } for(let i=0;i<8;i++){ c.fillStyle=['rgba(255,74,216,.12)','rgba(58,240,255,.12)'][i%2]; c.fillRect((i*113)%w,(i*61)%h,60,6); } } }
/* 小幫手：Q 版鉛筆「小筆」 */
function pencil(c,x,y,t,mood,ang){ c.save(); c.translate(x,y); c.rotate(ang||0); const INK='#2a1a26',b=Math.sin(t*4)*2; c.translate(0,b); c.lineJoin='round'; c.strokeStyle=INK; c.lineWidth=2.2;
  c.fillStyle='#f4c890'; c.beginPath(); c.moveTo(-10,24); c.lineTo(10,24); c.lineTo(0,42); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#3a3a4a'; c.beginPath(); c.moveTo(-3,36); c.lineTo(3,36); c.lineTo(0,42); c.closePath(); c.fill();
  c.fillStyle='#ffd23f'; rr(c,-12,-26,24,50,6); c.fill(); c.stroke(); c.fillStyle='rgba(255,255,255,.35)'; c.fillRect(-8,-22,4,42);
  c.fillStyle='#c8c8d0'; c.fillRect(-12,-32,24,8); c.strokeRect(-12,-32,24,8); c.fillStyle='#ff8ab8'; rr(c,-12,-44,24,13,5); c.fill(); c.stroke();
  const blink=Math.sin(t*1.4)>.985; c.fillStyle=INK; for(const k of [-1,1]){ if(blink||mood==='happy'){ c.beginPath(); c.arc(k*5,-6,3,Math.PI*1.1,Math.PI*1.9); c.stroke(); } else { c.beginPath(); c.ellipse(k*5,-6,2.6,3.4,0,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(k*5+1,-7.4,1.1,0,TAU); c.fill(); c.fillStyle=INK; } }
  c.fillStyle='rgba(255,110,130,.5)'; c.beginPath(); c.ellipse(-9,0,2.6,1.6,0,0,TAU); c.ellipse(9,0,2.6,1.6,0,0,TAU); c.fill(); c.lineWidth=1.6; c.beginPath(); if(mood==='happy'){ c.fillStyle='#c83a5a'; c.arc(0,2,3.5,0,Math.PI); c.fill(); } else { c.arc(-1.8,2,1.8,0,Math.PI); c.arc(1.8,2,1.8,0,Math.PI); } c.stroke(); c.restore(); }
function drawBoard(c,L,t,used,path,o){ o=o||{}; const T=L.theme,{sp,P}=layout(L),lw=clamp(sp*.09,6,11);
  L.edges.forEach((e,k)=>{ const [x1,y1]=P[e.a],[x2,y2]=P[e.b],u=used?used[k]||0:0,done=u>=e.n;
    c.lineCap='round'; if(e.n===2){ c.strokeStyle=T.line; c.lineWidth=lw*2.1; c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke(); }
    else { c.strokeStyle=T.line; c.lineWidth=lw; c.setLineDash([lw*1.2,lw*1.1]); c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke(); c.setLineDash([]); }
    if(u>0){ const g=c.createLinearGradient(x1,y1,x2,y2); g.addColorStop(0,T.ink[0]); g.addColorStop(1,T.ink[1]); c.strokeStyle=g; c.lineWidth=u===2||e.n===1?lw*1.25:lw; if(T.dark){ c.shadowColor=T.ink[0]; c.shadowBlur=12; } c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke(); c.shadowBlur=0; }
    if(e.n===2&&!done){ const mx=(x1+x2)/2,my=(y1+y2)/2; c.fillStyle=T.dark?'#14122b':'#fff'; c.beginPath(); c.arc(mx,my,11,0,TAU); c.fill(); c.strokeStyle=T.dark?'#fff':'#3a3a4a'; c.lineWidth=2; c.stroke(); c.fillStyle=T.dark?'#fff':'#3a3a4a'; c.font='900 11px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('×'+(e.n-u),mx,my+1); }
    if(e.dir&&!done){ const [p,q]=e.dir,[ax,ay]=P[p],[bx,by]=P[q],a=Math.atan2(by-ay,bx-ax),mx=(ax+bx)/2,my=(ay+by)/2; c.save(); c.translate(mx,my); c.rotate(a); c.fillStyle='#ff5a6a'; c.beginPath(); c.moveTo(12,0); c.lineTo(-8,-9); c.lineTo(-3,0); c.lineTo(-8,9); c.closePath(); c.fill(); c.strokeStyle='#fff'; c.lineWidth=1.5; c.stroke(); c.restore(); } });
  P.forEach(([x,y],k)=>{ const on=path&&path[path.length-1]===k,st=path&&path[0]===k; c.fillStyle=on?T.ink[1]:T.dot; c.beginPath(); c.arc(x,y,on?lw*1.5:lw*1.05,0,TAU); c.fill(); if(on){ c.strokeStyle='rgba(255,255,255,.9)'; c.lineWidth=3; c.beginPath(); c.arc(x,y,lw*1.5+5+Math.sin(t*6)*2,0,TAU); c.stroke(); } else if(st){ c.strokeStyle=T.ink[0]; c.lineWidth=3; c.beginPath(); c.arc(x,y,lw*1.6,0,TAU); c.stroke(); } });
  if(o.hint){ const [x1,y1]=P[o.hint[0]],[x2,y2]=P[o.hint[1]],k=(t*1.5)%1; c.fillStyle='rgba(255,210,63,.9)'; c.beginPath(); c.arc(x1+(x2-x1)*k,y1+(y2-y1)*k,lw*1.2,0,TAU); c.fill(); c.strokeStyle='rgba(255,210,63,.6)'; c.lineWidth=3; c.beginPath(); c.arc(x1,y1,lw*2+Math.sin(t*8)*3,0,TAU); c.stroke(); }
  return {sp,P}; }

function create(env,opts){
  const si=clamp(opts.stage|0,0,LV-1),L=lvl(si),pv=!!opts.preview,{ctx:c,canvas}=env.canvas2d(W,H),T=L.theme;
  let path=[],used=L.edges.map(()=>0),t=0,ended=false,win=null,hints=0,hint=null,fx=[],shake=0,msg=null,moves=0,drag=false,pvStep=0,pvT=1;
  const adjEdge=(a,b)=>{ for(let k=0;k<L.edges.length;k++){ const e=L.edges[k]; if(((e.a===a&&e.b===b)||(e.a===b&&e.b===a))&&used[k]<e.n&&(!e.dir||(e.dir[0]===a&&e.dir[1]===b))) return k; } return -1; };
  const doneAll=()=>used.every((u,k)=>u>=L.edges[k].n);
  const tone=(f,d,v)=>{ const A=env.audio&&env.audio(); if(!A||pv) return; try{ const o=A.createOscillator(),g=A.createGain(),n=A.currentTime; o.type='triangle'; o.frequency.value=f; g.gain.setValueAtTime(v||.07,n); g.gain.exponentialRampToValueAtTime(.001,n+d); o.connect(g); g.connect((env.out&&env.out())||A.destination); o.start(n); o.stop(n+d+.02); }catch(e){} };
  const SCALE=[0,2,4,7,9,12,14,16,19,21,24];
  function step(to){ const from=path[path.length-1]; if(path.length&&path.length>=2&&to===path[path.length-2]){ /* 往回走＝復原 */ const k=lastEdge.pop(); if(k!=null){ used[k]--; path.pop(); tone(330,.08,.04); return true; } }
    const k=adjEdge(from,to); if(k<0) return false; used[k]++; path.push(to); lastEdge.push(k); moves++; hint=null; tone(523*Math.pow(2,SCALE[Math.min(10,path.length%11)]/12),.16);
    const {P}=layout(L),[x,y]=P[to]; for(let i=0;i<6;i++){ const a=Math.random()*TAU; fx.push({x,y,vx:Math.cos(a)*90,vy:Math.sin(a)*90,l:.45,c:T.ink[i%2]}); }
    if(doneAll()){ win={T:2.2}; env.sfx('win'); for(let i=0;i<60;i++){ const [px,py]=P[Math.floor(Math.random()*P.length)],a=Math.random()*TAU,v=60+Math.random()*220; fx.push({x:px,y:py,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1.1,c:[T.ink[0],T.ink[1],'#ffd23f'][i%3],star:1}); } if(!pv){ const st=hints===0?3:hints===1?2:1; setRec(si,st); } }
    else if(!L.nodes.some((_,w)=>adjEdge(to,w)>=0)){ msg={s:'走不下去了！按「復原」或「重來」',l:2.2}; env.sfx('bump'); shake=5; }
    return true; }
  const lastEdge=[];
  function reset(){ path=[]; used=L.edges.map(()=>0); lastEdge.length=0; hint=null; tone(260,.12,.05); }
  function undo(){ if(!path.length) return; if(path.length===1){ path=[]; return; } const k=lastEdge.pop(); used[k]--; path.pop(); tone(330,.08,.04); }
  function giveHint(){ if(win) return; const s=solveFrom(L,path,used); if(!s){ msg={s:'這條路走不完了，先按「重來」',l:2}; env.sfx('bump'); return; } hints++; if(!path.length){ path=[s[0]]; hint=[s[0],s[1]]; } else hint=[path[path.length-1],s[0]]; msg={s:'跟著黃色亮點走',l:1.4}; }
  /* 輸入 */
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const nodeAt=(x,y)=>{ const {sp,P}=layout(L); let best=-1,bd=Math.max(20,sp*.36); P.forEach(([px,py],k)=>{ const d=Math.hypot(px-x,py-y); if(d<bd){ bd=d; best=k; } }); return best; };
  const BTN=[['復原',undo],['重來',reset],['提示',giveHint]],btnR=k=>[24+k*84,412,76,40];
  const pd=e=>{ if(pv||win) return; const [x,y]=toG(e); for(let k=0;k<3;k++){ const [a,b,w,h]=btnR(k); if(x>=a&&y>=b&&x<=a+w&&y<=b+h){ BTN[k][1](); env.sfx('click'); return; } }
    const v=nodeAt(x,y); if(v<0) return; drag=true; try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
    if(!path.length){ path=[v]; tone(440,.1); return; } if(v===path[path.length-1]) return; if(!step(v)&&moves===0&&path.length===1){ path=[v]; tone(440,.1); } };
  const pm=e=>{ if(!drag||win) return; const [x,y]=toG(e),v=nodeAt(x,y); if(v<0||v===path[path.length-1]) return; step(v); };
  const pu=()=>{ drag=false; };
  canvas.addEventListener('pointerdown',pd); canvas.addEventListener('pointermove',pm); canvas.addEventListener('pointerup',pu); canvas.addEventListener('pointercancel',pu); canvas.style.touchAction='none';
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt; if(shake>0) shake=Math.max(0,shake-dt*24); if(msg&&(msg.l-=dt)<=0) msg=null;
    if(!pv){ if(env.hit('KeyZ')||env.hit('Backspace')) undo(); if(env.hit('KeyR')) reset(); if(env.hit('KeyH')) giveHint(); }
    else if(!win){ pvT-=dt; if(pvT<=0){ pvT=.45; if(!path.length) path=[L.sol[0]]; else if(pvStep+1<L.sol.length){ pvStep++; step(L.sol[pvStep]); } } }
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=200*dt; if(f.l<=0) fx.splice(i,1); }
    if(win){ win.T-=dt; if(win.T<=0&&!ended){ if(pv){ reset(); win=null; pvStep=0; pvT=1; return; } ended=true; const st=hints===0?3:hints===1?2:1; env.end({title:'第 '+(si+1)+' 關完成！',big:'★'.repeat(st)+'☆'.repeat(3-st),text:hints?'用了 '+hints+' 次提示（不用提示可以拿 3 顆星）':'一筆畫完，沒用提示！',score:st,next:si<LV-1}); } } }
  function draw(){ c.save(); if(shake>0) c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake); paper(c,T,t,W,H);
    const {P}=drawBoard(c,L,t,used,path,{hint});
    if(path.length){ const [x,y]=P[path[path.length-1]]; pencil(c,x+16,y-34,t,win?'happy':'',.35); }
    for(const f of fx){ c.globalAlpha=Math.min(1,f.l*2); c.fillStyle=f.c; if(f.star){ c.font='900 14px '+TC; c.textAlign='center'; c.fillText('★',f.x,f.y); } else { c.beginPath(); c.arc(f.x,f.y,3,0,TAU); c.fill(); } } c.globalAlpha=1;
    c.restore();
    /* 左邊資訊 */ const dk=T.dark; c.fillStyle=dk?'rgba(10,8,24,.72)':'rgba(255,255,255,.86)'; rr(c,14,14,262,H-28,18); c.fill(); c.strokeStyle=dk?'rgba(255,255,255,.18)':'rgba(0,0,0,.12)'; c.lineWidth=2; c.stroke();
    c.textAlign='left'; c.textBaseline='middle'; c.fillStyle=dk?'#ffd23f':'#e8892a'; c.font='900 26px '+TC; c.fillText('第 '+(si+1)+' 關',32,46); c.font='700 13px '+TC; c.fillStyle=dk?'#cfc8ff':'#6a6a80'; c.fillText(T.n+'　'+'★'.repeat(L.stars),32,74);
    const tot=L.E,dn=used.reduce((a,b)=>a+b,0); c.fillStyle=dk?'#fff':'#2a2a3a'; c.font='900 16px '+TC; c.fillText('已畫 '+dn+' / '+tot+' 條線',32,108); c.fillStyle=dk?'rgba(255,255,255,.15)':'rgba(0,0,0,.08)'; rr(c,32,122,226,12,6); c.fill(); const g=c.createLinearGradient(32,0,258,0); g.addColorStop(0,T.ink[0]); g.addColorStop(1,T.ink[1]); c.fillStyle=g; rr(c,32,122,Math.max(12,226*dn/tot),12,6); c.fill();
    c.font='700 13px '+TC; c.fillStyle=dk?'#e8e4ff':'#4a4a5a'; const tips=['從一個點開始拖，','把所有線一筆畫完。','每條線只能畫一次。']; if(L.edges.some(e=>e.n===2)) tips.push('粗線 ×2 要畫兩次。'); if(L.edges.some(e=>e.dir)) tips.push('紅箭頭只能照方向畫。'); if(si<12) tips.push('提示：線頭數是單數的點'),tips.push('要當起點或終點。'); tips.forEach((s,k)=>c.fillText(s,32,160+k*22));
    pencil(c,214,340,t,win?'happy':'',0);
    for(let k=0;k<3;k++){ const [a,b,w,h]=btnR(k); c.fillStyle=k===2?'#ffd23f':dk?'rgba(255,255,255,.14)':'#eef0f6'; rr(c,a,b,w,h,12); c.fill(); c.strokeStyle=dk?'rgba(255,255,255,.3)':'rgba(0,0,0,.15)'; c.lineWidth=1.5; c.stroke(); c.fillStyle=k===2?'#3a2a00':dk?'#fff':'#2a2a3a'; c.font='900 15px '+TC; c.textAlign='center'; c.fillText(BTN[k][0],a+w/2,b+h/2+1); }
    c.fillStyle=dk?'#a8a0d8':'#8a8aa0'; c.font='700 11px '+TC; c.textAlign='center'; c.fillText(env.touch?'':'Z 復原・R 重來・H 提示',145,466);
    if(msg){ c.font='900 18px '+TC; c.textAlign='center'; const w=c.measureText(msg.s).width+40; c.fillStyle='rgba(10,8,24,.82)'; rr(c,535-w/2,14,w,40,14); c.fill(); c.fillStyle='#fff'; c.fillText(msg.s,535,35); }
    if(win){ c.font='900 46px '+TC; c.textAlign='center'; c.lineWidth=8; c.strokeStyle=dk?'#14122b':'#fff'; c.strokeText('一筆完成！',535,H/2); c.fillStyle='#ffb02a'; c.fillText('一筆完成！',535,H/2); }
    if(!path.length&&t<5&&!pv){ c.font='900 15px '+TC; c.textAlign='center'; c.fillStyle=dk?'#fff':'#2a2a3a'; c.fillText(env.touch?'用手指按住一個點，沿著線拖過去':'用滑鼠按住一個點，沿著線拖過去',535,H-18); } }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',pd); canvas.removeEventListener('pointermove',pm); canvas.removeEventListener('pointerup',pu); canvas.removeEventListener('pointercancel',pu); },_dbg:{L,step,reset,undo,giveHint,get path(){return path;},get win(){return win;}}};
}
function stageShow(ctx,w,h,si,t){ const L=lvl(si); ctx.save(); ctx.scale(w/W,h/H); paper(ctx,L.theme,t,W,H); const n=Math.floor((t*2)%(L.sol.length+4)),used=L.edges.map(()=>0),path=[L.sol[0]];
  for(let k=1;k<=Math.min(n,L.sol.length-1);k++){ const a=L.sol[k-1],b=L.sol[k]; const e=L.edges.findIndex((e,j)=>((e.a===a&&e.b===b)||(e.a===b&&e.b===a))&&used[j]<e.n); if(e>=0) used[e]++; path.push(b); }
  const {P}=drawBoard(ctx,L,t,used,path); const [x,y]=P[path[path.length-1]]; pencil(ctx,x+16,y-34,t,'',.35);
  const dk=L.theme.dark; ctx.fillStyle=dk?'rgba(10,8,24,.72)':'rgba(255,255,255,.86)'; rr(ctx,14,14,262,120,18); ctx.fill(); ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle=dk?'#ffd23f':'#e8892a'; ctx.font='900 30px '+TC; ctx.fillText('第 '+(si+1)+' 關',34,52); ctx.fillStyle=dk?'#fff':'#2a2a3a'; ctx.font='700 16px '+TC; ctx.fillText(L.theme.n+'　'+L.E+' 條線',34,96); pencil(ctx,200,340,t,'happy',0); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).stroke={
  name:'一筆畫連連看',tag:'ONE STROKE',color:'#ffb02a',
  desc:'從一個點出發，沿著線一筆把所有線畫完，每條線只能畫一次！100 關從簡單的小圖形到滿滿的星座，後面還有要畫兩次的粗線和單向箭頭。',
  goal:'從任一個點開始，一筆把所有線都畫過一次就過關。不用提示就能拿 3 顆星。',
  stages:Array.from({length:LV},(_,i)=>'第 '+(i+1)+' 關'),stars:Array.from({length:LV},(_,i)=>starsOf(i)),stageGrid:true,
  stageGoal:i=>{ const L=lvl(i); return '第 '+(i+1)+' 關（'+L.theme.n+'，'+L.E+' 條線）：一筆把所有線畫完。'+(L.edges.some(e=>e.n===2)?'粗線 ×2 要畫兩次。':'')+(L.edges.some(e=>e.dir)?'紅箭頭只能照方向畫。':''); },
  stageLocked:i=>i>0&&getRec(i-1)==null,stageBest:i=>{ const v=getRec(i); return v==null?'':'★'.repeat(v); },
  hubBest:()=>{ let n=0; for(let i=0;i<LV;i++) if(getRec(i)!=null) n++; return n?'已過關 <b>'+n+' / '+LV+'</b>':'尚無紀錄'; },
  stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,46,t),
  help:[['滑鼠拖曳','按住一個點，沿著線拖過去'],['往回拖','退一步'],['Z R H','復原、重來、提示']],touchHelp:[['手指拖曳','按住一個點，沿著線拖過去'],['按鈕','復原、重來、提示']],touch:null,
  best:{label:'星數',fmt:v=>'★'.repeat(v),lower:false},create,_sim:{levelOf,solveFrom,LV}};
})();
