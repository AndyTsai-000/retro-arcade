// 寶石三連閃：交換相鄰寶石，三顆以上同色連成一線就消掉。四連、L 形、五連會做出特殊寶石。單人 100 關，過一關開下一關。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,LV=100,N=8,CS=56,BX=324,BY=26;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function mul(seed){ let a=seed>>>0||1; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function mix(h1,h2,k){ const a=parseInt(h1.slice(1),16),b=parseInt(h2.slice(1),16),f=(s)=>Math.round(((a>>s)&255)*(1-k)+((b>>s)&255)*k); return 'rgb('+f(16)+','+f(8)+','+f(0)+')'; }
const GC=['#ff3d64','#ff9a2a','#ffd52e','#2fd477','#3a9cff','#b45cff'],GN=['紅寶石','琥珀','黃水晶','祖母綠','藍寶石','紫水晶'];
const GD=['#7a0a26','#8a3a06','#8a6a00','#0a5a2e','#0a2e7a','#4a1080'],GL=['#ffd0dc','#ffe2b8','#fff6c0','#c8ffe0','#d0ecff','#f0d8ff'];
/* 盤面形狀：# 是空格（不能放寶石） */
const MASKS=[
 ['........','........','........','........','........','........','........','........'],
 ['#......#','........','........','........','........','........','........','#......#'],
 ['........','........','........','...##...','...##...','........','........','........'],
 ['##....##','#......#','........','........','........','........','#......#','##....##'],
 ['........','........','........','#......#','#......#','........','........','........'],
 ['........','........','..#..#..','........','........','..#..#..','........','........'],
 ['###..###','##....##','#......#','........','........','#......#','##....##','###..###'],
 ['........','.#....#.','........','...##...','...##...','........','.#....#.','........'],
];
const THEMES=[
 {n:'水晶礦坑',a:'#2a1a3a',b:'#120a1a',acc:'#c08aff'},
 {n:'珊瑚海底',a:'#0a5a8a',b:'#06223a',acc:'#7affea'},
 {n:'皇家城堡',a:'#5a1a2a',b:'#200810',acc:'#ffd23f'},
 {n:'螢光森林',a:'#0e3a2a',b:'#04140e',acc:'#b8ff6a'},
 {n:'星空神殿',a:'#141a4a',b:'#05061a',acc:'#9ad0ff'},
];
/* ---------- 關卡：前面步數多、顏色少、目標低，後面慢慢變難 ---------- */
const starsOf=i=>Math.min(5,1+Math.floor(i/20));
function levelOf(i){ const r=mul(i*977+13),d=i/(LV-1);
  const nc=i<20?5:i<50?(i%3===2?6:5):(i%4===3?5:6);
  const mask=i<6?0:[0,1,2,3,4,5,6,7,1,3][(i*7)%10];
  const moves=Math.round(30-d*6);
  const kind=i<3?'score':['ice','collect','score','ice','collect'][i%5],goals=[];
  if(kind==='score') goals.push({k:'score',n:Math.round((1600+d*2600+(nc-5)*-400)/100)*100});
  if(kind==='ice'||(i>=60&&kind==='collect'&&i%2===0)) goals.push({k:'ice'});
  const cm=goals.length?.7:1; if(kind==='collect'){ const c1=Math.floor(r()*nc); goals.push({k:'col',c:c1,n:Math.round((16+d*12)*cm)}); if(i>=45){ let c2=(c1+1+Math.floor(r()*(nc-1)))%nc; goals.push({k:'col',c:c2,n:Math.round((10+d*6)*cm)}); } }
  const M=MASKS[mask],ice=[]; for(let y=0;y<N;y++){ const row=[]; for(let x=0;x<N;x++) row.push(0); ice.push(row); }
  if(goals.some(g=>g.k==='ice')){ const pat=mask===5?0:i%4,cnt=Math.round((10+d*16)*(mask===5||mask===6?.6:1)); const cells=[]; for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(M[y][x]!=='#'&&M[y].split('').filter(ch=>ch!=='#').length>=5){ const cx=Math.abs(x-3.5),cy=Math.abs(y-3.5); const w=pat===0?(8-cx-cy):pat===1?(y):pat===2?(6-Math.abs(cx+cy-3.5)*2):(Math.abs(cx-cy)<1?6:0); cells.push([w+r()*3,x,y]); } cells.sort((a,b)=>b[0]-a[0]); const two=i>=40?.08+d*.22:0; for(let k=0;k<Math.min(cnt,cells.length);k++){ const [,x,y]=cells[k]; ice[y][x]=r()<two?2:1; } }
  return {i,nc,mask,M,moves:moves+(goals.some(g=>g.k==='ice')&&(mask===5||mask===6)?3:0),goals,ice,theme:THEMES[Math.floor(i/20)%5],stars:starsOf(i)}; }

/* ---------- 規則（純資料，畫面和測試共用） ---------- */
function newState(L,rand){ const S={L,g:[],ice:L.ice.map(r=>r.slice()),score:0,moves:L.moves,got:[0,0,0,0,0,0],nid:1}; const ok=okOf(L);
  for(let y=0;y<N;y++){ S.g.push(Array(N).fill(null)); }
  for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(ok(x,y)){ let c,tries=0; do{ c=Math.floor(rand()*L.nc); tries++; } while(tries<30&&((x>=2&&S.g[y][x-1]&&S.g[y][x-2]&&S.g[y][x-1].c===c&&S.g[y][x-2].c===c)||(y>=2&&S.g[y-1][x]&&S.g[y-2][x]&&S.g[y-1][x].c===c&&S.g[y-2][x].c===c))); S.g[y][x]={c,s:0,id:S.nid++}; }
  if(!hasMove(S)) shuffle(S,rand); return S; }
const okOf=L=>(x,y)=>x>=0&&y>=0&&x<N&&y<N&&L.M[y][x]!=='#';
const cp=g=>g.map(r=>r.map(o=>o&&{c:o.c,s:o.s,id:o.id}));
function runAt(S,x,y){ const o=S.g[y][x]; if(!o||o.c<0) return 0; const c=o.c,G=S.g; let a=x,b=x; while(a>0&&G[y][a-1]&&G[y][a-1].c===c) a--; while(b<N-1&&G[y][b+1]&&G[y][b+1].c===c) b++; let u=y,d=y; while(u>0&&G[u-1][x]&&G[u-1][x].c===c) u--; while(d<N-1&&G[d+1][x]&&G[d+1][x].c===c) d++; return Math.max(b-a+1,d-u+1); }
function special(o){ return o&&o.s>0; }
function swapOK(S,a,b){ const G=S.g,A=G[a[1]][a[0]],B=G[b[1]][b[0]]; if(!A||!B) return false; if(Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])!==1) return false; if(A.s===4||B.s===4) return true; if(special(A)&&special(B)) return true; G[a[1]][a[0]]=B; G[b[1]][b[0]]=A; const m=runAt(S,a[0],a[1])>=3||runAt(S,b[0],b[1])>=3; G[a[1]][a[0]]=A; G[b[1]][b[0]]=B; return m; }
function allMoves(S){ const out=[]; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ if(x<N-1&&swapOK(S,[x,y],[x+1,y])) out.push([[x,y],[x+1,y]]); if(y<N-1&&swapOK(S,[x,y],[x,y+1])) out.push([[x,y],[x,y+1]]); } return out; }
function hasMove(S){ for(let y=0;y<N;y++) for(let x=0;x<N;x++){ if(x<N-1&&swapOK(S,[x,y],[x+1,y])) return true; if(y<N-1&&swapOK(S,[x,y],[x,y+1])) return true; } return false; }
function shuffle(S,rand){ const pos=[],gems=[]; for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(S.g[y][x]){ pos.push([x,y]); gems.push(S.g[y][x]); }
  for(let t=0;t<200;t++){ for(let k=gems.length-1;k>0;k--){ const q=Math.floor(rand()*(k+1)),tt=gems[k]; gems[k]=gems[q]; gems[q]=tt; } pos.forEach(([x,y],k)=>S.g[y][x]=gems[k]); let bad=false; for(const [x,y] of pos) if(runAt(S,x,y)>=3){ bad=true; break; } if(!bad&&hasMove(S)) return; }
  /* 真的洗不出來就重新換顏色 */ for(const [x,y] of pos){ S.g[y][x].c=Math.floor(rand()*S.L.nc); } if(!hasMove(S)) shuffle(S,rand); }
function findGroups(S,sw){ const G=S.g,runs=[];
  for(let y=0;y<N;y++){ let x=0; while(x<N){ const o=G[y][x]; if(!o||o.c<0){ x++; continue; } let e=x; while(e+1<N&&G[y][e+1]&&G[y][e+1].c===o.c) e++; if(e-x+1>=3){ const cells=[]; for(let k=x;k<=e;k++) cells.push([k,y]); runs.push({cells,dir:'h',c:o.c}); } x=e+1; } }
  for(let x=0;x<N;x++){ let y=0; while(y<N){ const o=G[y][x]; if(!o||o.c<0){ y++; continue; } let e=y; while(e+1<N&&G[e+1][x]&&G[e+1][x].c===o.c) e++; if(e-y+1>=3){ const cells=[]; for(let k=y;k<=e;k++) cells.push([x,k]); runs.push({cells,dir:'v',c:o.c}); } y=e+1; } }
  if(!runs.length) return [];
  const par=runs.map((_,i)=>i),fd=i=>par[i]===i?i:(par[i]=fd(par[i])),own=new Map();
  runs.forEach((r,i)=>r.cells.forEach(([x,y])=>{ const k=y*N+x; if(own.has(k)) par[fd(i)]=fd(own.get(k)); else own.set(k,i); }));
  const gm=new Map(); runs.forEach((r,i)=>{ const root=fd(i); if(!gm.has(root)) gm.set(root,[]); gm.get(root).push(r); });
  const out=[]; for(const rs of gm.values()){ const cells=new Map(); let mx=0,mxDir='h',hasH=false,hasV=false; for(const r of rs){ for(const [x,y] of r.cells) cells.set(y*N+x,[x,y]); if(r.cells.length>mx){ mx=r.cells.length; mxDir=r.dir; } if(r.dir==='h') hasH=true; else hasV=true; }
    const s=mx>=5?4:(hasH&&hasV?3:mx===4?(mxDir==='h'?1:2):0); let at=null;
    if(s&&sw){ for(const p of [sw[1],sw[0]]) if(cells.has(p[1]*N+p[0])){ at=p; break; } }
    if(s&&!at){ const lr=rs.find(r=>r.cells.length===mx); at=lr.cells[Math.floor(lr.cells.length/2)]; if(hasH&&hasV){ for(const k of cells.keys()){ let n=0; for(const r of rs) if(r.cells.some(([x,y])=>y*N+x===k)) n++; if(n>1){ at=cells.get(k); break; } } } }
    out.push({c:rs[0].c,cells:[...cells.values()],s,at,len:mx}); }
  return out; }
function areaOf(S,x,y,s){ const out=[]; if(s===1){ for(let k=0;k<N;k++) out.push([k,y]); } else if(s===2){ for(let k=0;k<N;k++) out.push([x,k]); } else if(s===3){ for(let b=-1;b<=1;b++) for(let a=-1;a<=1;a++) out.push([x+a,y+b]); } else if(s===4){ const cnt=[0,0,0,0,0,0]; for(const r of S.g) for(const o of r) if(o&&o.c>=0) cnt[o.c]++; let best=0; for(let k=1;k<6;k++) if(cnt[k]>cnt[best]) best=k; for(let b=0;b<N;b++) for(let a=0;a<N;a++){ const o=S.g[b][a]; if(o&&o.c===best) out.push([a,b]); } out.push([x,y]); } return out.filter(([a,b])=>a>=0&&b>=0&&a<N&&b<N&&S.g[b][a]); }
/* 交換之後一路消到停：回傳每一輪（消除、做出特殊寶石、掉落）讓畫面照順序播 */
function doSwap(S,a,b,rand){ const G=S.g,A=G[a[1]][a[0]],B=G[b[1]][b[0]]; G[a[1]][a[0]]=B; G[b[1]][b[0]]=A; S.moves--; const swapped=cp(G); let forced=null,fx=[];
  if(A.s===4||B.s===4){ const R=A.s===4?A:B,O=R===A?B:A,rp=R===A?b:a,op=R===A?a:b; forced=[rp];
    if(O.s===4){ for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(G[y][x]) forced.push([x,y]); fx.push({k:'nova',x:rp[0],y:rp[1]}); }
    else { const cells=[]; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const o=G[y][x]; if(o&&o.c===O.c){ cells.push([x,y]); if(O.s>0&&O.s<4&&o!==O) o.s=O.s===3?3:(rand()<.5?1:2); } } forced.push(...cells); fx.push({k:'rain',x:rp[0],y:rp[1],cells}); }
    R.s=0; R.c=-1; }
  else if(special(A)&&special(B)){ const sa=A.s,sb=B.s,[x,y]=b; A.s=0; B.s=0; forced=[a,b]; const lines=(dy,dx)=>{ for(let k=-dy;k<=dy;k++) if(y+k>=0&&y+k<N){ for(let q=0;q<N;q++) forced.push([q,y+k]); fx.push({k:'row',y:y+k}); } for(let k=-dx;k<=dx;k++) if(x+k>=0&&x+k<N){ for(let q=0;q<N;q++) forced.push([x+k,q]); fx.push({k:'col',x:x+k}); } };
    if(sa===3&&sb===3){ for(let q=-2;q<=2;q++) for(let p=-2;p<=2;p++) forced.push([x+p,y+q]); fx.push({k:'bomb',x,y,r:2.6}); } else if(sa===3||sb===3) lines(1,1); else lines(0,0); }
  const steps=resolve(S,[a,b],forced,fx,rand); return {swapped,steps}; }
function resolve(S,sw,forced,fx0,rand){ const steps=[],ok=okOf(S.L); let combo=0;
  for(let guard=0;guard<40;guard++){ const groups=forced?[]:findGroups(S,combo===0?sw:null); if(!forced&&!groups.length) break;
    const G=S.g,clr=new Map(),mk=[],fx=fx0&&combo===0?fx0.slice():[],add=(x,y)=>{ if(x<0||y<0||x>=N||y>=N||!G[y][x]) return; const k=y*N+x; if(!clr.has(k)) clr.set(k,[x,y]); };
    if(forced) forced.forEach(([x,y])=>add(x,y));
    for(const gr of groups){ gr.cells.forEach(([x,y])=>add(x,y)); if(gr.s) mk.push({x:gr.at[0],y:gr.at[1],c:gr.s===4?-1:gr.c,s:gr.s}); }
    /* 被炸到的特殊寶石會連鎖 */ const done=new Set(),q=[...clr.values()]; while(q.length){ const [x,y]=q.shift(),o=G[y][x]; if(!o||!o.s||done.has(o.id)) continue; if(mk.some(m=>m.x===x&&m.y===y)&&!forced) continue; done.add(o.id); const ar=areaOf(S,x,y,o.s); if(o.s===1) fx.push({k:'row',y}); else if(o.s===2) fx.push({k:'col',x}); else if(o.s===3) fx.push({k:'bomb',x,y,r:1.6}); else if(o.s===4) fx.push({k:'rain',x,y,cells:ar}); for(const [a,b] of ar){ const k=b*N+a; if(!clr.has(k)){ clr.set(k,[a,b]); q.push([a,b]); } } }
    for(const m of mk) clr.delete(m.y*N+m.x);
    const list=[]; let iceHit=0; for(const [x,y] of clr.values()){ const o=G[y][x]; list.push([x,y,o.c,o.s,o.id]); if(o.c>=0) S.got[o.c]++; if(S.ice[y][x]>0){ S.ice[y][x]--; iceHit++; } G[y][x]=null; }
    for(const m of mk){ G[m.y][m.x]={c:m.c,s:m.s,id:S.nid++}; m.id=G[m.y][m.x].id; if(S.ice[m.y][m.x]>0){ S.ice[m.y][m.x]--; iceHit++; } }
    const gain=Math.round((list.length*20+mk.length*60+iceHit*30)*(1+combo*.5)); S.score+=gain;
    /* 往下掉，上面補新的 */ const falls=[],spawn=[]; for(let x=0;x<N;x++){ const ys=[]; for(let y=0;y<N;y++) if(ok(x,y)) ys.push(y); const gs=[]; for(const y of ys) if(G[y][x]) gs.push([G[y][x],y]); let k=ys.length-1; for(let j=gs.length-1;j>=0;j--){ const [o,fy]=gs[j],ty=ys[k--]; G[fy][x]=null; G[ty][x]=o; if(fy!==ty) falls.push([o.id,fy,ty]); } const need=k+1; for(let j=0;j<need;j++){ const ty=ys[j],o={c:Math.floor(rand()*S.L.nc),s:0,id:S.nid++}; G[ty][x]=o; spawn.push([o.id,j-need-.4,ty]); } }
    steps.push({clr:list,mk,fx,gain,combo,after:cp(G),ice:S.ice.map(r=>r.slice()),falls,spawn}); combo++; forced=null; }
  return steps; }
function goalLeft(S){ return S.L.goals.map(g=>g.k==='score'?Math.max(0,g.n-S.score):g.k==='ice'?S.ice.reduce((a,r)=>a+r.reduce((p,v)=>p+v,0),0):Math.max(0,g.n-S.got[g.c])); }
const goalDone=S=>goalLeft(S).every(v=>v<=0);
function clone(S){ return {L:S.L,g:cp(S.g),ice:S.ice.map(r=>r.slice()),score:S.score,moves:S.moves,got:S.got.slice(),nid:S.nid}; }
/* 電腦選步：試每一步，看對目標幫助多少（預覽與平衡測試用） */
function botPick(S,rand,deep){ const ms=allMoves(S); if(!ms.length) return null; let best=null,bv=-1e9; const before=goalLeft(S);
  for(const m of ms){ const T=clone(S); const r=doSwap(T,m[0],m[1],deep?rand:Math.random); const after=goalLeft(T); let v=0; S.L.goals.forEach((g,k)=>{ const d=before[k]-after[k]; v+=g.k==='score'?d/12:g.k==='ice'?d*40:d*22; }); v+=T.score-S.score>0?(T.score-S.score)/60:0; for(const st of r.steps) v+=st.mk.length*25; v+=Math.random()*4; if(v>bv){ bv=v; best=m; } }
  return best; }

/* ---------- 畫圖：寶石切面（快取） ---------- */
const SPR={};
function shapeOf(k){ const p=[]; if(k===0){ for(let i=0;i<8;i++){ const a=i/8*TAU+TAU/16; p.push([Math.cos(a)*.92,Math.sin(a)*.92]); } } else if(k===1){ for(let i=0;i<6;i++){ const a=i/6*TAU; p.push([Math.cos(a)*.93,Math.sin(a)*.86]); } } else if(k===2){ for(let i=0;i<10;i++){ const a=-Math.PI/2+i/10*TAU,r=i%2?.5:.98; p.push([Math.cos(a)*r,Math.sin(a)*r+.06]); } } else if(k===3){ const q=.3; p.push([-.8+q,-.82],[.8-q,-.82],[.8,-.82+q],[.8,.82-q],[.8-q,.82],[-.8+q,.82],[-.8,.82-q],[-.8,-.82+q]); } else if(k===4){ p.push([0,-.96],[.62,-.38],[.78,0],[.62,.38],[0,.96],[-.62,.38],[-.78,0],[-.62,-.38]); } else { p.push([0,-.95],[.36,-.5],[.9,.62],[.55,.86],[-.55,.86],[-.9,.62],[-.36,-.5]); } return p; }
function gemSpr(k){ if(SPR[k]) return SPR[k]; const S=96,e=document.createElement('canvas'); e.width=e.height=S; const c=e.getContext('2d'),R=S*.44; c.translate(S/2,S/2);
  const o=shapeOf(k),inn=o.map(([x,y])=>[x*.5,y*.5-.04]),LX=-.62,LY=-.78;
  c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); o.forEach(([x,y],i)=>i?c.lineTo(x*R+2,y*R+4):c.moveTo(x*R+2,y*R+4)); c.closePath(); c.fill();
  for(let i=0;i<o.length;i++){ const j=(i+1)%o.length,mx=(o[i][0]+o[j][0])/2,my=(o[i][1]+o[j][1])/2,l=Math.hypot(mx,my)||1,dot=(mx*LX+my*LY)/l,kk=clamp(.5+dot*.5,0,1); c.fillStyle=kk>.5?mix(GC[k],GL[k],(kk-.5)*1.3):mix(GD[k],GC[k],kk*2); c.beginPath(); c.moveTo(o[i][0]*R,o[i][1]*R); c.lineTo(o[j][0]*R,o[j][1]*R); c.lineTo(inn[j][0]*R,inn[j][1]*R); c.lineTo(inn[i][0]*R,inn[i][1]*R); c.closePath(); c.fill(); c.strokeStyle='rgba(255,255,255,.18)'; c.lineWidth=1; c.stroke(); }
  const tg=c.createLinearGradient(-R*.5,-R*.5,R*.5,R*.5); tg.addColorStop(0,GL[k]); tg.addColorStop(.45,GC[k]); tg.addColorStop(1,mix(GC[k],GD[k],.35)); c.fillStyle=tg; c.beginPath(); inn.forEach(([x,y],i)=>i?c.lineTo(x*R,y*R):c.moveTo(x*R,y*R)); c.closePath(); c.fill();
  c.strokeStyle='rgba(255,255,255,.5)'; c.lineWidth=1.2; c.stroke();
  c.strokeStyle=GD[k]; c.lineWidth=2.6; c.beginPath(); o.forEach(([x,y],i)=>i?c.lineTo(x*R,y*R):c.moveTo(x*R,y*R)); c.closePath(); c.stroke();
  c.fillStyle='rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(-R*.3,-R*.36,R*.16,R*.07,-.7,0,TAU); c.fill(); c.fillStyle='rgba(255,255,255,.95)'; star4(c,R*.34,-R*.3,R*.13);
  return SPR[k]=e; }
function star4(c,x,y,r){ c.beginPath(); c.moveTo(x,y-r); c.quadraticCurveTo(x,y,x+r,y); c.quadraticCurveTo(x,y,x,y+r); c.quadraticCurveTo(x,y,x-r,y); c.quadraticCurveTo(x,y,x,y-r); c.fill(); }
function drawGem(c,o,x,y,sz,t,al){ if(!o) return; const s=sz||1; c.save(); c.translate(x,y); if(al!=null) c.globalAlpha=al;
  if(o.s===4){ const R=CS*.4*s; const g=c.createRadialGradient(-R*.3,-R*.3,2,0,0,R); g.addColorStop(0,'#fff'); g.addColorStop(.5,'#ffe6ff'); g.addColorStop(1,'#7a5aff'); c.fillStyle=g; c.beginPath(); c.arc(0,0,R,0,TAU); c.fill(); for(let k=0;k<6;k++){ c.fillStyle=GC[k]; c.globalAlpha=(al==null?1:al)*.75; c.beginPath(); c.moveTo(0,0); c.arc(0,0,R*.86,t*2+k/6*TAU,t*2+(k+.5)/6*TAU); c.closePath(); c.fill(); } c.globalAlpha=al==null?1:al; c.fillStyle='#fff'; c.beginPath(); c.arc(0,0,R*.34,0,TAU); c.fill(); c.strokeStyle='#3a1a6a'; c.lineWidth=2.4; c.beginPath(); c.arc(0,0,R,0,TAU); c.stroke(); c.fillStyle='#fff'; star4(c,R*.45,-R*.5,R*.28); c.restore(); return; }
  const sp=gemSpr(o.c),D=CS*.92*s; c.drawImage(sp,-D/2,-D/2,D,D);
  if(o.s===1||o.s===2){ c.save(); if(o.s===2) c.rotate(Math.PI/2); const ph=(t*3)%1; c.fillStyle='rgba(255,255,255,.85)'; for(const k of [-1,1]){ c.beginPath(); c.moveTo(k*D*.46,0); c.lineTo(k*D*.3,-D*.1); c.lineTo(k*D*.3,D*.1); c.closePath(); c.fill(); } c.globalAlpha=(al==null?1:al)*(.55+.35*Math.sin(t*8)); c.fillRect(-D*.3,-D*.06,D*.6,D*.12); c.globalAlpha=(al==null?1:al)*.5*(1-ph); c.fillRect(-D*.3-ph*8,-D*.1,D*.6+ph*16,D*.2); c.restore(); }
  if(o.s===3){ const p=.5+.5*Math.sin(t*6); c.strokeStyle='rgba(255,255,255,'+(.5+.4*p)+')'; c.lineWidth=3; c.beginPath(); c.arc(0,0,D*.4+p*3,0,TAU); c.stroke(); c.fillStyle='rgba(255,255,220,'+(.6+.3*p)+')'; star4(c,0,0,D*.2+p*3); }
  c.restore(); }

/* ---------- 背景（每個主題一張快取，再疊會動的光點） ---------- */
const BGC={};
function bgOf(T){ if(BGC[T.n]) return BGC[T.n]; const e=document.createElement('canvas'); e.width=W; e.height=H; const c=e.getContext('2d'),r=mul(T.n.length*91+7);
  const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,T.a); g.addColorStop(1,T.b); c.fillStyle=g; c.fillRect(0,0,W,H);
  if(T===THEMES[0]){ /* 礦坑：木樑、水晶簇、吊燈 */ for(const x of [0,W-60]){ c.fillStyle='#4a2e1a'; c.fillRect(x+10,0,26,H); c.fillStyle='#5e3a20'; c.fillRect(x+14,0,8,H); } c.fillStyle='#4a2e1a'; c.fillRect(0,0,W,22); for(let i=0;i<14;i++){ const x=r()*W,y=H-20-r()*60,h=30+r()*70,col=['#c08aff','#7ad8ff','#ff8ad0'][i%3]; crystal(c,x,y,h,col); } for(let i=0;i<5;i++){ const x=60+i*170; c.strokeStyle='#2a1a10'; c.lineWidth=2; c.beginPath(); c.moveTo(x,22); c.lineTo(x,60); c.stroke(); const lg=c.createRadialGradient(x,70,2,x,70,60); lg.addColorStop(0,'rgba(255,210,120,.55)'); lg.addColorStop(1,'rgba(255,210,120,0)'); c.fillStyle=lg; c.fillRect(x-60,10,120,120); c.fillStyle='#ffd27a'; c.beginPath(); c.arc(x,70,7,0,TAU); c.fill(); } }
  else if(T===THEMES[1]){ /* 海底：光束、珊瑚、海草 */ c.globalAlpha=.12; c.fillStyle='#bff8ff'; for(let i=0;i<6;i++){ const x=i*150+40; c.beginPath(); c.moveTo(x,0); c.lineTo(x+60,0); c.lineTo(x+170,H); c.lineTo(x+90,H); c.fill(); } c.globalAlpha=1; c.fillStyle='#d8c08a'; c.beginPath(); c.moveTo(0,H); for(let x=0;x<=W;x+=20) c.lineTo(x,H-22-Math.sin(x*.02)*8); c.lineTo(W,H); c.fill(); for(let i=0;i<10;i++){ const x=r()*W,col=['#ff7a9a','#ffb05a','#c88aff','#ff5a7a'][i%4]; coral(c,x,H-24,30+r()*40,col,r); } c.strokeStyle='#2a9a6a'; c.lineWidth=5; c.lineCap='round'; for(let i=0;i<14;i++){ const x=r()*W; c.beginPath(); c.moveTo(x,H-20); c.bezierCurveTo(x-14,H-60,x+14,H-90,x-6,H-120-r()*40); c.stroke(); } }
  else if(T===THEMES[2]){ /* 城堡：石牆、拱窗、旗幟 */ c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=1; for(let y=0;y<H;y+=28){ for(let x=(y/28)%2*30;x<W;x+=60){ c.strokeRect(x,y,60,28); } } for(const x of [70,W-70]){ const wg=c.createLinearGradient(0,60,0,260); wg.addColorStop(0,'#3a5aa8'); wg.addColorStop(1,'#a8c8ff'); c.fillStyle=wg; c.beginPath(); c.moveTo(x-40,260); c.lineTo(x-40,110); c.arc(x,110,40,Math.PI,0); c.lineTo(x+40,260); c.fill(); c.strokeStyle='#d8b060'; c.lineWidth=6; c.stroke(); c.lineWidth=3; c.beginPath(); c.moveTo(x,70); c.lineTo(x,260); c.moveTo(x-40,170); c.lineTo(x+40,170); c.stroke(); } for(const x of [20,W-50]){ c.fillStyle='#c8202a'; c.beginPath(); c.moveTo(x,290); c.lineTo(x+30,290); c.lineTo(x+30,430); c.lineTo(x+15,410); c.lineTo(x,430); c.fill(); c.fillStyle='#ffd23f'; star4(c,x+15,340,10); } c.fillStyle='#3a0e14'; c.fillRect(0,H-30,W,30); }
  else if(T===THEMES[3]){ /* 森林：樹影、螢光蘑菇 */ for(let i=0;i<12;i++){ const x=r()*W,w=30+r()*40; c.fillStyle='rgba(2,20,12,'+(.5+r()*.4)+')'; c.fillRect(x,0,w*.4,H); c.beginPath(); c.arc(x+w*.2,40,w,0,TAU); c.fill(); } c.fillStyle='#062a18'; c.beginPath(); c.moveTo(0,H); for(let x=0;x<=W;x+=20) c.lineTo(x,H-30-Math.sin(x*.03)*10); c.lineTo(W,H); c.fill(); for(let i=0;i<12;i++){ const x=r()*W,y=H-30-r()*10,s=8+r()*14,col=['#b8ff6a','#6affd8','#ff9aea'][i%3]; c.fillStyle='#e8f0d0'; c.fillRect(x-s*.15,y-s*.8,s*.3,s*.8); const mg=c.createRadialGradient(x,y-s,1,x,y-s,s*2.2); mg.addColorStop(0,col+'88'); mg.addColorStop(1,col+'00'); c.fillStyle=mg; c.fillRect(x-s*2.2,y-s*3.2,s*4.4,s*4.4); c.fillStyle=col; c.beginPath(); c.ellipse(x,y-s*.8,s*.7,s*.45,0,Math.PI,0); c.fill(); } }
  else { /* 星空神殿：月亮、柱子、雲 */ for(let i=0;i<160;i++){ c.fillStyle='rgba(255,255,255,'+(.3+r()*.7)+')'; c.fillRect(r()*W,r()*H*.8,1.4,1.4); } const mg=c.createRadialGradient(720,80,10,720,80,90); mg.addColorStop(0,'rgba(255,250,220,.9)'); mg.addColorStop(.3,'rgba(255,250,220,.6)'); mg.addColorStop(1,'rgba(255,250,220,0)'); c.fillStyle=mg; c.fillRect(620,0,180,180); c.fillStyle='#fffbe8'; c.beginPath(); c.arc(720,80,30,0,TAU); c.fill(); for(const x of [40,110,W-130,W-60]){ c.fillStyle='#d8dcf0'; c.fillRect(x,180,34,H-180); c.fillStyle='#a8b0d0'; c.fillRect(x+22,180,12,H-180); c.fillStyle='#e8ecff'; c.fillRect(x-6,170,46,14); c.fillRect(x-6,H-40,46,14); } c.fillStyle='rgba(200,210,255,.18)'; for(let i=0;i<6;i++){ const x=r()*W,y=H-40-r()*80; c.beginPath(); c.ellipse(x,y,90,18,0,0,TAU); c.fill(); } }
  return BGC[T.n]=e; }
function crystal(c,x,y,h,col){ for(let k=-1;k<=1;k++){ const hh=h*(k?0.65:1),xx=x+k*h*.18,ww=h*.13; const g=c.createLinearGradient(xx-ww,0,xx+ww,0); g.addColorStop(0,col); g.addColorStop(.5,'#ffffff'); g.addColorStop(1,col); c.globalAlpha=.85; c.fillStyle=g; c.beginPath(); c.moveTo(xx-ww,y); c.lineTo(xx-ww,y-hh*.75); c.lineTo(xx+k*4,y-hh); c.lineTo(xx+ww,y-hh*.75); c.lineTo(xx+ww,y); c.closePath(); c.fill(); c.globalAlpha=1; } const lg=c.createRadialGradient(x,y-h*.5,2,x,y-h*.5,h); lg.addColorStop(0,col+'55'); lg.addColorStop(1,col+'00'); c.fillStyle=lg; c.fillRect(x-h,y-h*1.5,h*2,h*2); }
function coral(c,x,y,h,col,r){ c.strokeStyle=col; c.lineCap='round'; const br=(x0,y0,a,l,w,d)=>{ if(d>3||l<6) return; const x1=x0+Math.cos(a)*l,y1=y0+Math.sin(a)*l; c.lineWidth=w; c.beginPath(); c.moveTo(x0,y0); c.lineTo(x1,y1); c.stroke(); br(x1,y1,a-.5,l*.72,w*.7,d+1); br(x1,y1,a+.45,l*.7,w*.7,d+1); }; br(x,y,-Math.PI/2,h*.45,7,0); }
function ambient(c,T,t){ const k=THEMES.indexOf(T);
  if(k===1){ c.fillStyle='rgba(220,255,255,.55)'; for(let i=0;i<18;i++){ const x=(i*97)%W+Math.sin(t+i)*8,y=H-((t*40+i*61)%H); c.beginPath(); c.arc(x,y,2+(i%3),0,TAU); c.fill(); } }
  else if(k===3){ for(let i=0;i<20;i++){ const x=(i*131+Math.sin(t*.5+i)*40)%W,y=80+(i*53)%360+Math.cos(t*.7+i)*20,a=.4+.6*Math.abs(Math.sin(t*2+i)); c.fillStyle='rgba(200,255,120,'+a+')'; c.beginPath(); c.arc(x,y,2.2,0,TAU); c.fill(); } }
  else { c.fillStyle=k===4?'rgba(255,255,255,.9)':'rgba(255,230,255,.8)'; for(let i=0;i<14;i++){ const a=Math.max(0,Math.sin(t*1.6+i*1.7)); if(a<.2) continue; c.globalAlpha=a; star4(c,(i*173)%W,(i*71)%H,3+a*4); } c.globalAlpha=1; } }
/* 小幫手「晶晶」：Q 版寶石精靈 */
function fairy(c,x,y,t,mood){ c.save(); c.translate(x,y+Math.sin(t*2.4)*3); const INK='#2a1438',blink=Math.sin(t*1.3)>.985,happy=mood==='happy'||mood==='win',sad=mood==='sad';
  c.lineJoin='round'; c.lineCap='round'; c.strokeStyle=INK; c.lineWidth=2.4;
  c.fillStyle='rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(0,58,26,6,0,0,TAU); c.fill();
  /* 翅膀 */ c.fillStyle='rgba(200,230,255,.75)'; for(const k of [-1,1]){ c.save(); c.scale(k,1); c.rotate(Math.sin(t*14)*.18); c.beginPath(); c.ellipse(26,18,18,10,-.5,0,TAU); c.fill(); c.stroke(); c.restore(); }
  /* 身體 */ c.fillStyle='#b45cff'; c.beginPath(); c.moveTo(-16,26); c.quadraticCurveTo(0,20,16,26); c.lineTo(22,52); c.quadraticCurveTo(0,58,-22,52); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#ffd52e'; star4(c,0,38,6);
  /* 手 */ c.fillStyle='#ffe0cc'; const up=happy?Math.abs(Math.sin(t*8))*6:0; for(const k of [-1,1]){ c.beginPath(); c.arc(k*(happy?24:20),happy?10-up:40,6,0,TAU); c.fill(); c.stroke(); }
  /* 腳 */ c.fillStyle='#6a2aa8'; for(const k of [-1,1]){ c.beginPath(); c.ellipse(k*9,56,8,5,0,0,TAU); c.fill(); c.stroke(); }
  /* 頭 */ c.fillStyle='#ffe6d6'; c.beginPath(); c.arc(0,0,26,0,TAU); c.fill(); c.stroke();
  c.fillStyle='#ff7ab8'; c.beginPath(); c.arc(0,-6,27,Math.PI*1.02,Math.PI*1.98); c.quadraticCurveTo(10,-14,0,-10); c.quadraticCurveTo(-10,-14,-26,-8); c.fill(); c.stroke();
  c.beginPath(); c.ellipse(-24,6,7,14,.2,0,TAU); c.ellipse(24,6,7,14,-.2,0,TAU); c.fill(); c.stroke();
  c.save(); c.translate(14,-26); c.scale(.42,.42); c.drawImage(gemSpr(4),-48,-48,96,96); c.restore();
  c.fillStyle=INK; if(blink||happy){ c.lineWidth=2.4; for(const k of [-1,1]){ c.beginPath(); if(happy) c.arc(k*9,4,4.5,Math.PI*1.1,Math.PI*1.9); else { c.moveTo(k*9-5,4); c.lineTo(k*9+5,4); } c.stroke(); } } else { for(const k of [-1,1]){ c.beginPath(); c.ellipse(k*9,4,4.6,6,0,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(k*9+1.6,1.6,1.9,0,TAU); c.arc(k*9-1.4,6.4,.9,0,TAU); c.fill(); c.fillStyle=INK; } }
  c.fillStyle='rgba(255,100,140,.45)'; c.beginPath(); c.ellipse(-16,13,4.5,2.6,0,0,TAU); c.ellipse(16,13,4.5,2.6,0,0,TAU); c.fill();
  c.lineWidth=2; c.beginPath(); if(sad){ c.arc(0,20,4,Math.PI*1.15,Math.PI*1.85); } else if(happy){ c.fillStyle='#c83a5a'; c.arc(0,14,5,0,Math.PI); c.closePath(); c.fill(); } else { c.arc(-2.6,14,2.6,0,Math.PI); c.arc(2.6,14,2.6,0,Math.PI); } c.stroke();
  c.restore(); }

function boardFrame(c,S,t){ const M=S.L.M; c.save();
  c.fillStyle='rgba(8,6,20,.74)'; rr(c,BX-10,BY-10,N*CS+20,N*CS+20,18); c.fill(); c.strokeStyle='rgba(255,255,255,.22)'; c.lineWidth=2; c.stroke();
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ if(M[y][x]==='#') continue; c.fillStyle=(x+y)%2?'rgba(255,255,255,.10)':'rgba(255,255,255,.17)'; rr(c,BX+x*CS+2,BY+y*CS+2,CS-4,CS-4,9); c.fill();
    const iv=S.ice[y][x]; if(iv>0){ const ig=c.createLinearGradient(BX+x*CS,BY+y*CS,BX+x*CS+CS,BY+y*CS+CS); ig.addColorStop(0,iv>1?'rgba(150,200,255,.85)':'rgba(200,240,255,.7)'); ig.addColorStop(1,iv>1?'rgba(70,130,230,.85)':'rgba(120,190,255,.55)'); c.fillStyle=ig; rr(c,BX+x*CS+3,BY+y*CS+3,CS-6,CS-6,8); c.fill(); c.strokeStyle='rgba(255,255,255,.8)'; c.lineWidth=1.6; c.stroke(); c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=1.2; c.beginPath(); c.moveTo(BX+x*CS+10,BY+y*CS+12); c.lineTo(BX+x*CS+22,BY+y*CS+24); c.lineTo(BX+x*CS+18,BY+y*CS+36); if(iv>1){ c.moveTo(BX+x*CS+40,BY+y*CS+10); c.lineTo(BX+x*CS+32,BY+y*CS+26); c.lineTo(BX+x*CS+44,BY+y*CS+40); } c.stroke(); } }
  c.restore(); }
function goalRows(S){ const L=goalLeft(S); return S.L.goals.map((g,k)=>({g,left:L[k]})); }
function goalText(L){ return L.goals.map(g=>g.k==='score'?'拿到 '+g.n+' 分':g.k==='ice'?'敲碎全部冰塊':'收集 '+g.n+' 顆'+GN[g.c]).join('，'); }
const bKey='arcade.gems.v.',getRec=i=>{ try{ const v=localStorage.getItem(bKey+i); return v==null?null:+v; }catch(e){ return null; } },setRec=(i,v)=>{ try{ const o=getRec(i); if(o==null||v>o) localStorage.setItem(bKey+i,String(v)); }catch(e){} };
const COMBO=['','好棒！','太厲害了！','超級連鎖！','完美！','寶石風暴！'];

function create(env,opts){
  const si=clamp(opts.stage|0,0,LV-1),L=levelOf(si),pv=!!opts.preview,{ctx:c,canvas}=env.canvas2d(W,H);
  let S=newState(L,Math.random),disp=cp(S.g),dice=S.ice.map(r=>r.slice()),anim=new Map(),phase='idle',PT=0,queue=[],cur=null,swapA=null,sel=null,cursor=[3,3],kbUsed=false,t=0,idle=0,hint=null,fx=[],pops=[],texts=[],shake=0,combo=0,over=null,ended=false,mood='idle',moodT=0,bonusLeft=0,msg=null,best=getRec(si),flash=[];
  const tgt=L.goals.find(g=>g.k==='score'),starAt=tgt?[tgt.n,Math.round(tgt.n*1.4),Math.round(tgt.n*1.9)]:[L.moves*70,L.moves*110,L.moves*150].map(v=>Math.round(v/100)*100);
  const cx=x=>BX+x*CS+CS/2,cy=y=>BY+y*CS+CS/2;
  const tone=(f,d,type,v,f2)=>{ const A=env.audio&&env.audio(); if(!A||pv) return; try{ const o=A.createOscillator(),g=A.createGain(),n=A.currentTime; o.type=type||'sine'; o.frequency.setValueAtTime(f,n); if(f2) o.frequency.exponentialRampToValueAtTime(f2,n+d); g.gain.setValueAtTime(v||.08,n); g.gain.exponentialRampToValueAtTime(.001,n+d); o.connect(g); g.connect(env.out?env.out()||A.destination:A.destination); o.start(n); o.stop(n+d+.02); }catch(e){} };
  const chime=k=>{ const sc=[0,2,4,7,9,12,14,16,19,21,24]; const f=523*Math.pow(2,sc[Math.min(sc.length-1,k)]/12); tone(f,.25,'triangle',.07); tone(f*2,.18,'sine',.03); };
  const sfx=n=>{ if(!pv) env.sfx(n); };
  function startSwap(a,b){ if(phase!=='idle'||over) return; sel=null; hint=null; idle=0; if(!S.g[a[1]][a[0]]||!S.g[b[1]][b[0]]) return;
    if(!swapOK(S,a,b)){ swapA={a,b,bad:true}; phase='swap'; PT=0; sfx('bump'); return; }
    const r=doSwap(S,a,b,Math.random); swapA={a,b,bad:false}; phase='swap'; PT=0; queue=r.steps; combo=0; tone(660,.08,'triangle',.06,880); }
  function nextStep(){ const st=queue.shift(); if(!st){ settle(); return; } cur=st; phase='pop'; PT=0; combo=st.combo;
    for(const [x,y,col,s] of st.clr){ pops.push({x:cx(x),y:cy(y),o:{c:col,s},l:.24}); burst(cx(x),cy(y),col<0?'#ffffff':GC[col],s?10:6); }
    for(const f of st.fx){ if(f.k==='row') fx.push({k:'row',y:cy(f.y),l:.45,L:.45}); else if(f.k==='col') fx.push({k:'col',x:cx(f.x),l:.45,L:.45}); else if(f.k==='bomb'){ fx.push({k:'ring',x:cx(f.x),y:cy(f.y),r:f.r*CS,l:.5,L:.5}); shake=Math.max(shake,7); } else if(f.k==='rain'||f.k==='nova'){ fx.push({k:'bolt',x:cx(f.x),y:cy(f.y),cells:(f.cells||[]).map(([a,b])=>[cx(a),cy(b)]),l:.55,L:.55}); shake=Math.max(shake,f.k==='nova'?12:6); } }
    if(st.fx.length){ sfx('boom'); tone(180,.4,'sawtooth',.05,60); } else sfx('pop');
    chime(st.combo+Math.min(3,Math.floor(st.clr.length/4)));
    if(st.mk.length) tone(990,.3,'sine',.06,1480);
    if(st.clr.length){ let sx=0,sy=0; for(const [x,y] of st.clr){ sx+=cx(x); sy+=cy(y); } texts.push({x:sx/st.clr.length,y:sy/st.clr.length,s:'+'+st.gain,l:.9,big:st.combo>=2}); }
    if(st.combo>=1){ const w=COMBO[Math.min(5,st.combo)]; msg={s:w,l:1}; mood='happy'; moodT=1.2; } }
  function applyAfter(st){ disp=st.after; dice=st.ice; for(const [id,fy,ty] of st.falls) anim.set(id,{y:fy,ty,vy:0}); for(const [id,fy,ty] of st.spawn) anim.set(id,{y:fy,ty,vy:0}); for(const m of st.mk) flash.push({x:cx(m.x),y:cy(m.y),l:.5}); phase='fall'; PT=0; }
  function settle(){ cur=null; disp=cp(S.g); dice=S.ice.map(r=>r.slice());
    if(goalDone(S)){ phase='bonus'; PT=0; bonusLeft=S.moves; msg={s:'過關！剩下步數變成分數',l:1.6}; mood='win'; moodT=9; sfx('win'); return; }
    if(S.moves<=0){ over={win:false,T:1.8}; phase='over'; mood='sad'; moodT=9; sfx('lose'); return; }
    if(!hasMove(S)){ shuffle(S,Math.random); disp=cp(S.g); msg={s:'沒有可以換的了，重新洗牌！',l:1.4}; sfx('trap'); }
    phase='idle'; }
  function burst(x,y,col,n){ for(let i=0;i<n;i++){ const a=Math.random()*TAU,v=70+Math.random()*200; fx.push({k:'p',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-60,l:.5+Math.random()*.35,L:.85,c:col,s:3+Math.random()*4,r:Math.random()*TAU,vr:(Math.random()-.5)*14}); } for(let i=0;i<3;i++) fx.push({k:'sp',x:x+(Math.random()-.5)*30,y:y+(Math.random()-.5)*30,l:.4+i*.1,L:.6}); }
  /* 輸入：點選、拖曳、鍵盤 */
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const cellAt=(x,y)=>{ const a=Math.floor((x-BX)/CS),b=Math.floor((y-BY)/CS); return a>=0&&b>=0&&a<N&&b<N&&L.M[b][a]!=='#'?[a,b]:null; };
  let down=null;
  const pd=e=>{ if(pv) return; const [x,y]=toG(e),p=cellAt(x,y); kbUsed=false; if(!p){ sel=null; return; } down={p,x,y,used:false}; if(sel&&Math.abs(sel[0]-p[0])+Math.abs(sel[1]-p[1])===1){ const a=sel; sel=null; down.used=true; startSwap(a,p); return; } sel=p; sfx('click'); try{ canvas.setPointerCapture(e.pointerId); }catch(_){} };
  const pm=e=>{ if(!down||down.used) return; const [x,y]=toG(e),dx=x-down.x,dy=y-down.y; if(Math.hypot(dx,dy)<CS*.32) return; const d=Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)],q=[down.p[0]+d[0],down.p[1]+d[1]]; down.used=true; if(q[0]>=0&&q[1]>=0&&q[0]<N&&q[1]<N&&L.M[q[1]][q[0]]!=='#'){ sel=null; startSwap(down.p,q); } };
  const pu=()=>{ down=null; };
  canvas.addEventListener('pointerdown',pd); canvas.addEventListener('pointermove',pm); canvas.addEventListener('pointerup',pu); canvas.addEventListener('pointercancel',pu); canvas.style.touchAction='none';
  let botT=1.2;
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt; PT+=dt; if(shake>0) shake=Math.max(0,shake-dt*30); if(msg&&(msg.l-=dt)<=0) msg=null; if(moodT>0&&(moodT-=dt)<=0) mood='idle';
    /* 鍵盤 */ if(!pv){ const dirs=[['ArrowLeft',-1,0],['ArrowRight',1,0],['ArrowUp',0,-1],['ArrowDown',0,1],['KeyA',-1,0],['KeyD',1,0],['KeyW',0,-1],['KeyS',0,1]]; for(const [k,dx,dy] of dirs) if(env.hit(k)){ kbUsed=true; const q=[clamp(cursor[0]+dx,0,N-1),clamp(cursor[1]+dy,0,N-1)]; if(sel&&sel[0]===cursor[0]&&sel[1]===cursor[1]){ const a=sel; sel=null; startSwap(a,q); cursor=q; } else cursor=q; }
      if(env.hit('Space')||env.hit('Enter')||env.hit('KeyJ')){ kbUsed=true; if(sel&&sel[0]===cursor[0]&&sel[1]===cursor[1]) sel=null; else if(L.M[cursor[1]][cursor[0]]!=='#'){ sel=cursor.slice(); sfx('click'); } } }
    if(phase==='idle'&&!over){ idle+=dt; if(idle>6&&!hint){ const ms=allMoves(S); if(ms.length) hint=ms[Math.floor(Math.random()*ms.length)]; }
      if(pv){ botT-=dt; if(botT<=0){ botT=1.1; const m=botPick(S,Math.random,false); if(m) startSwap(m[0],m[1]); } } }
    if(phase==='swap'&&PT>=(swapA.bad?.34:.17)){ if(swapA.bad){ phase='idle'; swapA=null; } else { swapA=null; disp=cp(S.g); /* 先顯示交換後、消除前 */ nextStep(); } }
    if(phase==='pop'&&PT>=.2) applyAfter(cur);
    if(phase==='fall'){ let moving=false; for(const [id,a] of anim){ if(a.y<a.ty){ a.vy+=60*dt; a.y=Math.min(a.ty,a.y+a.vy*dt); moving=true; if(a.y>=a.ty){ a.y=a.ty; a.bounce=.12; } } else if(a.bounce>0){ a.bounce-=dt; moving=true; } else anim.delete(id); } if(!moving||PT>1.2){ anim.clear(); nextStep(); } }
    if(phase==='bonus'){ if(PT>=.12&&bonusLeft>0){ PT=0; bonusLeft--; S.moves--; S.score+=150; const ys=[]; for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(L.M[y][x]!=='#') ys.push([x,y]); const [x,y]=ys[Math.floor(Math.random()*ys.length)]; burst(cx(x),cy(y),GC[Math.floor(Math.random()*6)],10); texts.push({x:cx(x),y:cy(y),s:'+150',l:.7}); chime(10-bonusLeft%8); }
      if(bonusLeft<=0&&PT>.9){ over={win:true,T:1.2}; phase='over'; if(!pv){ setRec(si,S.score); } } }
    if(over&&phase==='over'){ over.T-=dt; if(over.T<=0&&!ended){ if(pv){ S=newState(L,Math.random); disp=cp(S.g); dice=S.ice.map(r=>r.slice()); over=null; phase='idle'; mood='idle'; return; } ended=true; const st=S.score>=starAt[2]?3:S.score>=starAt[1]?2:1;
      env.end({title:over.win?'第 '+(si+1)+' 關過關！':'第 '+(si+1)+' 關失敗',big:S.score+' 分',text:over.win?('★'.repeat(st)+'☆'.repeat(3-st))+(best!=null&&S.score>best?'　新紀錄！':''):'步數用完了，還差：'+goalRows(S).filter(r=>r.left>0).map(r=>r.g.k==='score'?r.left+' 分':r.g.k==='ice'?r.left+' 塊冰':r.left+' 顆'+GN[r.g.c]).join('、'),score:over.win?S.score:null,next:over.win&&si<LV-1}); } }
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; if(f.l<=0){ fx.splice(i,1); continue; } if(f.k==='p'){ f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=520*dt; f.r+=f.vr*dt; } }
    for(let i=pops.length-1;i>=0;i--){ if((pops[i].l-=dt)<=0) pops.splice(i,1); } for(let i=texts.length-1;i>=0;i--){ const q=texts[i]; q.l-=dt; q.y-=40*dt; if(q.l<=0) texts.splice(i,1); } for(let i=flash.length-1;i>=0;i--) if((flash[i].l-=dt)<=0) flash.splice(i,1); }
  function draw(){ c.save(); if(shake>0) c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake); c.drawImage(bgOf(L.theme),0,0); ambient(c,L.theme,t);
    boardFrame(c,{L,ice:dice},t);
    c.save(); rr(c,BX-4,BY-4,N*CS+8,N*CS+8,14); c.clip();
    const hidePop=new Set(); if(phase==='pop'&&cur) for(const q of cur.clr) hidePop.add(q[4]);
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const o=disp[y][x]; if(!o||hidePop.has(o.id)) continue; let px=cx(x),py=cy(y),sc=1;
      const a=anim.get(o.id); if(a){ py=BY+a.y*CS+CS/2; if(a.bounce>0) sc=1+Math.sin(a.bounce/.12*Math.PI)*.06; }
      if(swapA&&phase==='swap'){ const {a:A,b:B,bad}=swapA,k=bad?Math.sin(Math.min(1,PT/.34)*Math.PI):Math.min(1,PT/.17); if(x===A[0]&&y===A[1]){ px+=(B[0]-A[0])*CS*k; py+=(B[1]-A[1])*CS*k; sc=1.08; } else if(x===B[0]&&y===B[1]){ px+=(A[0]-B[0])*CS*k; py+=(A[1]-B[1])*CS*k; sc=.94; } }
      if(sel&&sel[0]===x&&sel[1]===y) sc=1.1+Math.sin(t*10)*.05;
      if(hint&&phase==='idle'&&(hint[0][0]===x&&hint[0][1]===y||hint[1][0]===x&&hint[1][1]===y)){ const d=hint[0][0]===x&&hint[0][1]===y?[hint[1][0]-x,hint[1][1]-y]:[hint[0][0]-x,hint[0][1]-y]; const w=Math.max(0,Math.sin(t*6))*5; px+=d[0]*w; py+=d[1]*w; }
      drawGem(c,o,px,py,sc,t); }
    for(const p of pops){ const k=p.l/.24; drawGem(c,p.o,p.x,p.y,1+(1-k)*.35,t,k); c.fillStyle='rgba(255,255,255,'+(k*.7)+')'; c.beginPath(); c.arc(p.x,p.y,CS*.3*(1.2-k),0,TAU); c.fill(); }
    c.restore();
    if(sel){ c.strokeStyle='#fff'; c.lineWidth=3; rr(c,BX+sel[0]*CS+2,BY+sel[1]*CS+2,CS-4,CS-4,10); c.stroke(); }
    if(kbUsed&&!pv){ c.strokeStyle='#ffd23f'; c.lineWidth=3; c.setLineDash([6,4]); rr(c,BX+cursor[0]*CS+1,BY+cursor[1]*CS+1,CS-2,CS-2,10); c.stroke(); c.setLineDash([]); }
    for(const f of flash){ c.strokeStyle='rgba(255,255,255,'+(f.l*1.6)+')'; c.lineWidth=4; c.beginPath(); c.arc(f.x,f.y,CS*.5*(1.5-f.l),0,TAU); c.stroke(); }
    for(const f of fx){ const a=f.l/f.L; if(f.k==='p'){ c.save(); c.globalAlpha=a; c.fillStyle=f.c; c.translate(f.x,f.y); c.rotate(f.r); c.beginPath(); c.moveTo(0,-f.s); c.lineTo(f.s*.8,f.s*.6); c.lineTo(-f.s*.8,f.s*.6); c.closePath(); c.fill(); c.restore(); }
      else if(f.k==='sp'){ c.globalAlpha=a; c.fillStyle='#fff'; star4(c,f.x,f.y,4+(1-a)*8); c.globalAlpha=1; }
      else if(f.k==='row'||f.k==='col'){ c.save(); c.globalAlpha=a; const g=f.k==='row'?c.createLinearGradient(0,f.y-22,0,f.y+22):c.createLinearGradient(f.x-22,0,f.x+22,0); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(.5,'rgba(255,255,240,1)'); g.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=g; if(f.k==='row') c.fillRect(BX-10,f.y-22*a-6,N*CS+20,(22*a+6)*2); else c.fillRect(f.x-22*a-6,BY-10,(22*a+6)*2,N*CS+20); c.restore(); }
      else if(f.k==='ring'){ c.globalAlpha=a; c.strokeStyle='#fff6c8'; c.lineWidth=8*a+2; c.beginPath(); c.arc(f.x,f.y,f.r*(1.2-a*.8)+10,0,TAU); c.stroke(); c.fillStyle='rgba(255,220,140,'+(a*.35)+')'; c.fill(); c.globalAlpha=1; }
      else if(f.k==='bolt'){ c.save(); c.globalAlpha=a; c.strokeStyle='#fff'; c.lineWidth=2.5; c.shadowColor='#c8a0ff'; c.shadowBlur=10; for(const [x,y] of f.cells){ c.beginPath(); c.moveTo(f.x,f.y); const mx=(f.x+x)/2+(Math.random()-.5)*20,my=(f.y+y)/2+(Math.random()-.5)*20; c.lineTo(mx,my); c.lineTo(x,y); c.stroke(); } c.restore(); } }
    c.globalAlpha=1;
    for(const q of texts){ c.font='900 '+(q.big?26:18)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=5; c.strokeStyle='rgba(20,10,40,.85)'; c.globalAlpha=Math.min(1,q.l*2); c.strokeText(q.s,q.x,q.y); c.fillStyle=q.big?'#ffd23f':'#fff'; c.fillText(q.s,q.x,q.y); c.globalAlpha=1; }
    c.restore();
    drawPanel();
    if(msg){ c.font='900 30px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=8; c.strokeStyle='#1a0a2a'; const y=BY+N*CS/2,sc=1+Math.max(0,msg.l-.8)*1.4; c.save(); c.translate(BX+N*CS/2,y); c.scale(sc,sc); c.strokeText(msg.s,0,0); const g=c.createLinearGradient(0,-16,0,16); g.addColorStop(0,'#fff6a8'); g.addColorStop(1,'#ff9a2a'); c.fillStyle=g; c.fillText(msg.s,0,0); c.restore(); }
    if(over&&phase==='over'){ c.fillStyle='rgba(10,6,24,.55)'; c.fillRect(BX-10,BY+N*CS/2-50,N*CS+20,100); c.font='900 44px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle=over.win?'#ffd23f':'#ff8a9a'; c.fillText(over.win?'過關！':'步數用完了',BX+N*CS/2,BY+N*CS/2); }
    if(t<3.5&&!pv){ c.fillStyle='rgba(10,6,24,.78)'; rr(c,BX+N*CS/2-170,BY+N*CS-46,340,36,12); c.fill(); c.fillStyle='#fff'; c.font='900 14px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(env.touch?'把寶石往旁邊滑，三顆同色就消掉':'點寶石再點旁邊那顆（或直接拖）交換',BX+N*CS/2,BY+N*CS-28); } }
  function drawPanel(){ const px=16,pw=290; c.save(); c.fillStyle='rgba(10,6,24,.72)'; rr(c,px,16,pw,H-32,18); c.fill(); c.strokeStyle='rgba(255,255,255,.18)'; c.lineWidth=2; c.stroke();
    c.textAlign='left'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 24px '+TC; c.fillText('第 '+(si+1)+' 關',px+18,46); c.font='700 13px '+TC; c.fillStyle=L.theme.acc; c.fillText(L.theme.n+'　'+'★'.repeat(L.stars),px+126,48);
    /* 步數 */ c.fillStyle='rgba(255,255,255,.08)'; rr(c,px+14,70,110,82,14); c.fill(); c.fillStyle='#cfc8ff'; c.font='700 12px '+TC; c.textAlign='center'; c.fillText('剩下步數',px+69,86); c.fillStyle=S.moves<=5?(Math.sin(t*8)>0?'#ff6a7a':'#fff'):'#fff'; c.font='900 40px '+TC; c.fillText(S.moves,px+69,122);
    /* 分數 */ c.fillStyle='rgba(255,255,255,.08)'; rr(c,px+134,70,142,82,14); c.fill(); c.fillStyle='#cfc8ff'; c.font='700 12px '+TC; c.fillText('分數',px+205,86); c.fillStyle='#fff'; c.font='900 26px '+TC; c.fillText(S.score,px+205,112); const bw=118,bx0=px+146,mx=starAt[2]*1.08,k=clamp(S.score/mx,0,1); c.fillStyle='rgba(255,255,255,.15)'; rr(c,bx0,132,bw,9,4); c.fill(); const bg=c.createLinearGradient(bx0,0,bx0+bw,0); bg.addColorStop(0,'#ff7ab8'); bg.addColorStop(1,'#ffd23f'); c.fillStyle=bg; rr(c,bx0,132,Math.max(9,bw*k),9,4); c.fill(); for(const v of starAt){ const sx=bx0+bw*v/mx; c.fillStyle=S.score>=v?'#ffd23f':'rgba(255,255,255,.45)'; c.font='900 13px '+TC; c.fillText('★',sx,128); }
    /* 目標 */ c.fillStyle='rgba(255,255,255,.08)'; rr(c,px+14,164,262,24+L.goals.length*44,14); c.fill(); c.fillStyle='#cfc8ff'; c.font='700 12px '+TC; c.textAlign='left'; c.fillText('過關目標',px+28,180);
    goalRows(S).forEach(({g,left},k)=>{ const y=208+k*44,done=left<=0; if(g.k==='col'){ c.drawImage(gemSpr(g.c),px+24,y-18,36,36); } else if(g.k==='ice'){ const ig=c.createLinearGradient(px+26,y-16,px+58,y+16); ig.addColorStop(0,'#e0f6ff'); ig.addColorStop(1,'#7ab8ff'); c.fillStyle=ig; rr(c,px+26,y-16,32,32,7); c.fill(); c.strokeStyle='#fff'; c.lineWidth=1.5; c.stroke(); } else { c.fillStyle='#ffd23f'; c.font='900 26px '+TC; c.textAlign='center'; c.fillText('★',px+42,y+1); }
      c.textAlign='left'; c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText(g.k==='score'?'拿到 '+g.n+' 分':g.k==='ice'?'敲碎全部冰塊':GN[g.c]+' '+g.n+' 顆',px+68,y-8); c.font='700 13px '+TC; c.fillStyle=done?'#7affa0':'#ffd8a8'; c.fillText(done?'✔ 完成！':'還差 '+left+(g.k==='score'?' 分':g.k==='ice'?' 塊':' 顆'),px+68,y+12); });
    c.textAlign='left'; c.fillStyle='#a8a0d8'; c.font='700 12px '+TC; c.fillText(best!=null?'本關最高 '+best+' 分':'還沒過關',px+28,H-38);
    fairy(c,px+222,H-110,t,mood); if(mood==='happy'&&combo>=1){ c.fillStyle='#fff'; rr(c,px+150,H-196,96,30,12); c.fill(); c.fillStyle='#2a1438'; c.font='900 13px '+TC; c.textAlign='center'; c.fillText(combo>=3?'太神啦！':'連鎖！',px+198,H-181); }
    c.restore(); }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',pd); canvas.removeEventListener('pointermove',pm); canvas.removeEventListener('pointerup',pu); canvas.removeEventListener('pointercancel',pu); },
    _dbg:{get S(){return S;},get phase(){return phase;},startSwap,allMoves:()=>allMoves(S),botPick:()=>botPick(S,Math.random,false),get over(){return over;}}};
}
const SHOWC={};
function stageShow(ctx,w,h,si,t){ const L=levelOf(si); if(!SHOWC[si]) SHOWC[si]=newState(L,mul(si*31+5)); const S=SHOWC[si]; ctx.save(); ctx.scale(w/W,h/H); ctx.drawImage(bgOf(L.theme),0,0); ambient(ctx,L.theme,t); boardFrame(ctx,S,t);
  for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const o=S.g[y][x]; if(o){ const wob=Math.sin(t*3+x*.7+y*.5)*1.5; drawGem(ctx,o,BX+x*CS+CS/2,BY+y*CS+CS/2+wob,1,t); } }
  ctx.fillStyle='rgba(10,6,24,.72)'; rr(ctx,16,16,290,H-32,18); ctx.fill(); ctx.fillStyle='#ffd23f'; ctx.font='900 30px '+TC; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('第 '+(si+1)+' 關',36,56); ctx.fillStyle='#fff'; ctx.font='900 16px '+TC; const tx=goalText(L); wrap(ctx,tx,36,100,250,24); ctx.fillStyle=L.theme.acc; ctx.font='700 14px '+TC; ctx.fillText(L.theme.n+'　'+L.moves+' 步',36,170); fairy(ctx,236,H-110,t,'idle'); ctx.restore(); }
function wrap(c,s,x,y,w,lh){ let line='',yy=y; for(const ch of s){ if(c.measureText(line+ch).width>w){ c.fillText(line,x,yy); line=ch; yy+=lh; } else line+=ch; } c.fillText(line,x,yy); }
function thumb(ctx,w,h,t){ const L=levelOf(41); if(!SHOWC.th){ const S=newState(L,mul(77)); S.g[2][3]={c:1,s:1,id:999}; S.g[4][5]={c:-1,s:4,id:998}; S.g[5][2]={c:3,s:3,id:997}; SHOWC.th=S; } const S=SHOWC.th; ctx.save(); ctx.scale(w/W,h/H); ctx.drawImage(bgOf(L.theme),0,0); ambient(ctx,L.theme,t); boardFrame(ctx,S,t); for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const o=S.g[y][x]; if(o) drawGem(ctx,o,BX+x*CS+CS/2,BY+y*CS+CS/2+Math.sin(t*3+x+y)*1.5,1,t); } fairy(ctx,160,H/2+30,t,Math.sin(t*.8)>0?'happy':'idle'); ctx.fillStyle='#fff'; ctx.font='900 46px '+TC; ctx.textAlign='center'; ctx.lineWidth=8; ctx.strokeStyle='#2a1438'; ctx.strokeText('三連閃！',160,120); const g=ctx.createLinearGradient(0,96,0,140); g.addColorStop(0,'#fff6a8'); g.addColorStop(1,'#ff7ab8'); ctx.fillStyle=g; ctx.fillText('三連閃！',160,120); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).gems={
  name:'寶石三連閃',tag:'GEM TRIO',color:'#b45cff',
  desc:'交換相鄰寶石，三顆以上同色連成一線就消掉！四連、L 形、五連會變出特殊寶石，連鎖越多分數越高。共 100 關，五個寶石世界。',
  goal:'交換相鄰的寶石，讓三顆以上同色連成一線就會消掉。步數用完前完成過關目標就過關。',
  stages:Array.from({length:LV},(_,i)=>'第 '+(i+1)+' 關'),stars:Array.from({length:LV},(_,i)=>starsOf(i)),stageGrid:true,
  stageGoal:i=>{ const L=levelOf(i); return '第 '+(i+1)+' 關（'+L.theme.n+'，'+L.moves+' 步）：'+goalText(L)+'。四顆一排變「光束寶石」、L／T 形變「爆裂寶石」、五顆一排變「彩虹球」。'; },
  stageLocked:i=>i>0&&getRec(i-1)==null,stageBest:i=>{ const v=getRec(i); return v==null?'':'✓ '+v; },
  hubBest:()=>{ let n=0; for(let i=0;i<LV;i++) if(getRec(i)!=null) n++; return n?'已過關 <b>'+n+' / '+LV+'</b>':'尚無紀錄'; },
  stageShow,thumb,
  help:[['滑鼠','點一顆寶石，再點旁邊那顆交換（也可以直接拖）'],['方向鍵','移動黃框，空白鍵選取後再按方向交換'],['特殊寶石','四連＝光束、L 形＝爆裂、五連＝彩虹球']],touchHelp:[['手指滑動','把寶石往旁邊滑就會交換'],['特殊寶石','四連＝光束、L 形＝爆裂、五連＝彩虹球']],touch:null,
  best:{label:'最高分',fmt:v=>v+' 分',lower:false},create,
  _sim:{levelOf,newState,doSwap,allMoves,botPick,goalDone,goalLeft,hasMove,shuffle,LV}};
})();
