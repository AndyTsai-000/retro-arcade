// 傳話變變變：畫圖傳話派對遊戲（3～8 人）。每人一本小本子，第一頁寫一個題目，往下傳：
// 下一個人照著字畫圖、再下一個人看圖猜字、再畫、再猜……每本傳一圈。最後一本一本翻開，看題目怎麼越傳越歪。
// 單人時和電腦玩（電腦畫圖用「你畫我猜」的圖庫）；連線各自用自己的螢幕同時畫；大家用一台時輪流偷偷畫。不計分、不限時。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const shuf=a=>{ for(let k=a.length-1;k>0;k--){ const j=Math.floor(Math.random()*(k+1)),t=a[k]; a[k]=a[j]; a[j]=t; } return a; };
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const PAL=['#1c1c22','#ffffff','#e23b3b','#ff9d3d','#ffd23f','#3fae5a','#2f8fe8','#7a4ac8','#ff7eb6','#8a5a2a'],SIZES=[3,7,14,26];
const PCOL=['#ff7a3d','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff5d6d','#3ddbd9','#ff9d3d'];
const BOTN=['阿傳','小畫','嘟嘟','咪寶','阿樂','球球','小花','豆豆'];
const BOTLOOK=i=>({char:['bow','cat','cap','bunny','chef','crown','pirate','ninja'][i%8],deco:['blush','','scarf','shades'][i%4]});
const norm=s=>String(s||'').replace(/[\s，。、！？!?,.「」]/g,'').toLowerCase();
const clean=s=>String(s||'').replace(/[<>&"']/g,'').trim().slice(0,12);
const CPU=()=>((window.ARCADE_GAMES||{}).draw||{})._cpu||[];
const BX=150,BY=70,BW=500,BH=354;
/* 筆畫格式：{c 顏色, z 粗細（畫板像素）, f 填色, p:[x,y,x,y…]（0～1000）} */
function paint(c,list,x,y,w,h){ const k=w/BW; c.save(); c.beginPath(); c.rect(x,y,w,h); c.clip(); c.lineCap='round'; c.lineJoin='round';
  for(const s of list||[]){ const p=s.p; if(!p||p.length<2) continue; c.beginPath(); c.moveTo(x+p[0]/1000*w,y+p[1]/1000*h); for(let i=2;i<p.length;i+=2) c.lineTo(x+p[i]/1000*w,y+p[i+1]/1000*h);
    if(s.f){ c.closePath(); c.fillStyle=s.c; c.fill(); c.strokeStyle=s.c; c.lineWidth=Math.max(1,(s.z||2)*k); c.stroke(); }
    else { if(p.length===2) c.lineTo(x+p[0]/1000*w+.01,y+p[1]/1000*h); c.strokeStyle=s.c; c.lineWidth=Math.max(1,(s.z||4)*k); c.stroke(); } }
  c.restore(); }
function cpuStrokes(e,jit){ const out=[]; for(const st of e.s){ const [col,pts,f,lw]=st,p=[]; const dx=(Math.random()-.5)*jit,dy=(Math.random()-.5)*jit; for(const q of pts){ p.push(Math.round(clamp(q[0]+dx+(Math.random()-.5)*jit*.4,0,1)*1000),Math.round(clamp(q[1]+dy+(Math.random()-.5)*jit*.4,0,1)*1000)); } out.push({c:col,z:lw||(f?2:4),f:f?1:0,p}); } return out; }
function matchCPU(txt){ const L=CPU(),n=norm(txt); let e=L.find(q=>norm(q.w)===n||(q.alt||[]).some(a=>norm(a)===n)); if(e) return {e,exact:true};
  let best=null,bs=0; for(const q of L){ for(const w of [q.w].concat(q.alt||[])){ let s=0; for(const ch of new Set(norm(w))) if(n.includes(ch)) s++; if(s>bs||s===bs&&s>0&&Math.random()<.4){ bs=s; best=q; } } }
  return {e:best||L[Math.floor(Math.random()*L.length)],exact:false}; }
/* ---------- 背景：塗鴉教室 ---------- */
let BG=null;
function bg(){ if(BG) return BG; const e=document.createElement('canvas'); e.width=W*2; e.height=H*2; const c=e.getContext('2d'); c.scale(2,2);
  const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#2b4a3a'); g.addColorStop(1,'#16291f'); c.fillStyle=g; c.fillRect(0,0,W,H);
  /* 黑板邊框和粉筆痕 */ c.strokeStyle='#8a5a2a'; c.lineWidth=14; c.strokeRect(7,7,W-14,H-14); c.strokeStyle='#b07a3a'; c.lineWidth=3; c.strokeRect(14,14,W-28,H-28);
  c.strokeStyle='rgba(255,255,255,.06)'; c.lineWidth=18; for(let i=0;i<9;i++){ c.beginPath(); c.moveTo(40+i*90,60+(i%3)*120); c.quadraticCurveTo(80+i*90,30+(i%2)*200,140+i*86,90+(i%4)*90); c.stroke(); }
  c.fillStyle='rgba(255,255,255,.12)'; c.font='900 22px '+TC; c.textAlign='center'; ['☆','♡','✎','☁','✿','♪'].forEach((s,k)=>c.fillText(s,60+k*140,470-(k%2)*16));
  c.fillStyle='#6a4520'; c.fillRect(14,H-24,W-28,10); [['#fff',60],['#ffd23f',90],['#ff7eb6',118],['#7ad8ff',146]].forEach(([col,x])=>{ c.fillStyle=col; rr(c,x,H-30,22,6,3); c.fill(); });
  return BG=e; }
function notebook(c,x,y,w,h,col){ c.save(); c.shadowColor='rgba(0,0,0,.45)'; c.shadowBlur=12; c.shadowOffsetY=5; c.fillStyle='#fffdf4'; rr(c,x,y,w,h,10); c.fill(); c.restore();
  c.fillStyle=col||'#ff7eb6'; rr(c,x,y,16,h,6); c.fill(); c.fillStyle='rgba(255,255,255,.6)'; for(let yy=y+14;yy<y+h-8;yy+=18){ c.beginPath(); c.arc(x+8,yy,3,0,TAU); c.fill(); }
  c.strokeStyle='rgba(120,160,220,.25)'; c.lineWidth=1; for(let yy=y+30;yy<y+h-6;yy+=24){ c.beginPath(); c.moveTo(x+22,yy); c.lineTo(x+w-8,yy); c.stroke(); } }
function wrapLines(c,s,w,max){ const out=[]; let line=''; for(const ch of s){ if(c.measureText(line+ch).width>w){ out.push(line); line=ch; if(out.length===max) break; } else line+=ch; } if(out.length<max&&line) out.push(line); return out; }

function create(env,opts){
  const {ctx:c,canvas}=env.canvas2d(W,H),net=opts.net,client=!!net&&!net.host,host=!client,pv=!!opts.preview,OP=opts.options||{};
  const room=!net&&!pv,me=net?net.me:0;
  const N=net?clamp(net.count,3,8):pv?5:clamp(+OP.n||5,3,8);
  const humans=pv?0:net?Math.min(net.count,N):N;
  const names=[],looks=[],bot=[]; for(let i=0;i<N;i++){ const h=i<humans; bot.push(!h);
    if(h){ names.push(net?(net.names&&net.names[i])||'玩家'+(i+1):room?'玩家 '+(i+1):(opts.name||'你')); looks.push(net?(net.looks&&net.looks[i])||{}:room?BOTLOOK(i):opts.look||{}); }
    else { names.push(BOTN[(i-humans)%BOTN.length]); looks.push(BOTLOOK(i)); } }
  if(room&&window.PARTY_NAMES) window.PARTY_NAMES.fill(names);
  const S=N%2?N:N-1; /* 每本頁數：寫、畫、猜…，最後一頁一定是猜的字 */
  const local=i=>!pv&&!bot[i]&&(net?i===me:true),nm=i=>local(i)&&!room?'你':names[i];
  const colOf=i=>{ const L=looks[i]; return !L||!L.color||L.color==='auto'?PCOL[i%8]:L.color; };
  const worker=(b,s)=>(b+s)%N,bookOf=(p,s)=>((p-s)%N+N)%N,kind=s=>s===0?'w':s%2?'d':'g';
  const BOOKS=Array(N).fill(0).map(()=>Array(S).fill(null));
  let G={ph:'intro',PT:pv?1:3.5,s:-1,done:Array(N).fill(false),rb:0,rk:0,hi:0,peekOn:false,sug:[]};
  let t=0,ended=false,sendT=0,btns=[],hoverB=-1,prevKey='',editing=false,botT=Array(N).fill(0),fx=[];
  let strokes=[],pen=null,curCol=PAL[0],curSz=1,undoN=0;
  const sfx=k=>{ if(!pv) env.sfx(k); };
  const left=Array(N).fill(false);
  /* ---------- 房主流程 ---------- */
  function sug3(){ const L=CPU().map(q=>q.w); return shuf(L.slice()).slice(0,3); }
  function startStep(){ G.s++; G.done=Array(N).fill(false); G.hi=0; G.peekOn=false; G.ph='work'; G.PT=pv?.3:.8; G.sug=[]; for(let p=0;p<N;p++) G.sug.push(sug3());
    for(let i=0;i<N;i++) botT[i]=(kind(G.s)==='d'?6:3)+Math.random()*4;
    if(net&&G.s>0) for(let p=0;p<N;p++){ const b=bookOf(p,G.s); net.send({pg:{b,s:G.s-1,page:BOOKS[b][G.s-1]}}); } }
  function submit(p,page){ if(G.ph!=='work'||G.done[p]) return; const k=kind(G.s); const b=bookOf(p,G.s);
    if(k==='d'){ if(!Array.isArray(page.d)||!page.d.length) return; page={by:p,k:'d',d:page.d.slice(0,400),src:page.src}; }
    else { const tx=clean(page.t); if(!tx) return; page={by:p,k:'w',t:tx}; }
    BOOKS[b][G.s]=page; G.done[p]=true; if(room){ G.hi++; G.peekOn=false; }
    if(G.done.every(x=>x)){ if(G.s+1>=S){ G.ph='reveal'; G.rb=0; G.rk=0; G.PT=1; sendReveal(); } else { G.ph='gap'; G.PT=pv?.4:1.6; } } }
  function sendReveal(){ if(net) net.send({rp:{b:G.rb,k:G.rk,page:BOOKS[G.rb][G.rk]}}); }
  function botWork(p){ const s=G.s,k=kind(s),b=bookOf(p,s),prev=s>0?BOOKS[b][s-1]:null;
    if(k==='w'){ const used=BOOKS.map(B=>B[0]&&B[0].t).filter(Boolean); const L=CPU().filter(q=>!used.includes(q.w)); const e=L[Math.floor(Math.random()*L.length)]||CPU()[0]; submit(p,{t:e.w}); return; }
    if(k==='d'){ const m=matchCPU(prev.t); submit(p,{d:cpuStrokes(m.e,.012),src:m.e.w}); return; }
    /* 猜：電腦看得懂自己畫的圖，也會被真人的圖騙 */ const L=CPU(); let g;
    const pp=s>=2?BOOKS[b][s-2]:null,want=pp&&pp.t;
    if(prev.src){ const e=L.find(q=>q.w===prev.src); g=Math.random()<.7?prev.src:(()=>{ const same=L.filter(q=>q.c===(e&&e.c)&&q.w!==prev.src); return (same[Math.floor(Math.random()*same.length)]||e).w; })(); }
    else { const m=matchCPU(want||''); g=Math.random()<.55?(m.exact?m.e.w:want):L[Math.floor(Math.random()*L.length)].w; }
    submit(p,{t:g}); }
  function doAct(from,a){ if(!a||ended) return; const p=room?roomCur():from;
    if(a.k==='go'&&room&&G.ph==='intro'){ startStep(); return; }
    if(a.k==='peek'&&room&&G.ph==='work'){ G.peekOn=true; return; }
    if(a.k==='sub'&&G.ph==='work'&&p!=null&&!bot[p]&&(!net||from===p)){ submit(p,a.page||{}); return; }
    if(a.k==='next'&&G.ph==='reveal'&&G.PT<=0&&(!net||from===0||left[0])){ if(G.rk<S-1){ G.rk++; } else if(G.rb<N-1){ G.rb++; G.rk=0; } else { G.ph='final'; G.PT=.3; return; } G.PT=.6; sendReveal(); } }
  const roomCur=()=>{ if(!room||G.ph!=='work') return null; for(let i=0;i<N;i++) if(!G.done[i]) return i; return null; };
  function hostStep(dt){ G.PT-=dt;
    if(G.ph==='intro'){ if(G.PT<=0&&!room) startStep(); }
    else if(G.ph==='work'){ if(G.PT<=0) for(let i=0;i<N;i++) if(bot[i]&&!G.done[i]){ botT[i]-=dt; if(botT[i]<=0){ botWork(i); if(G.ph!=='work') break; } } }
    else if(G.ph==='gap'){ if(G.PT<=0) startStep(); }
    else if(G.ph==='reveal'){ if(pv&&G.PT<=-2) doAct(0,{k:'next'}); }
    else if(G.ph==='final'&&G.PT<=0&&!ended){ if(pv){ return; } ended=true; if(net) net.send({G,end:1}); finish(); }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/5; net.send({G}); } } }
  if(net){ if(client) net.onmsg=m=>{ if(m.G){ const os=G.s; G=m.G; if(G.s!==os&&G.ph==='work') resetBoard(); } if(m.pg) BOOKS[m.pg.b][m.pg.s]=m.pg.page; if(m.rp) BOOKS[m.rp.b][m.rp.k]=m.rp.page; if(m.end&&!ended){ ended=true; finish(); } };
    else { net.onmsg=(m,from)=>{ if(m.a) doAct(from,m.a); if(m.need) sendReveal(); }; net.onleave=i=>{ if(i>0&&i<N&&!left[i]){ left[i]=true; bot[i]=true; names[i]+='（電腦代打）'; botT[i]=1; } }; } }
  const act=a=>{ if(pv) return; if(client) net.send({a}); else doAct(me,a); };
  /* 自己這一步：要看的上一頁、要做什麼 */
  const myP=()=>{ if(pv||G.ph!=='work') return null; if(room){ const i=roomCur(); return i!=null&&G.peekOn?i:null; } return G.done[me]?null:me; };
  const prevPage=p=>G.s>0?BOOKS[bookOf(p,G.s)][G.s-1]:null;
  /* ---------- 打字輸入 ---------- */
  const wrap=document.createElement('div'); wrap.style.cssText='position:absolute;z-index:6;display:none;gap:6px'; const inp=document.createElement('input'); inp.maxLength=12; inp.autocomplete='off'; inp.style.cssText='flex:1;min-width:0;font:700 16px '+TC+';padding:4px 10px;border-radius:10px;border:2px solid #ffd23f;background:#fff;color:#1c2a20';
  const sb=document.createElement('button'); sb.textContent='送出'; sb.style.cssText='font:900 15px '+TC+';padding:0 18px;border-radius:10px;border:0;background:#ffd23f;color:#2a1e0e;white-space:nowrap;cursor:pointer'; wrap.append(inp,sb); if(!pv) env.stage.appendChild(wrap);
  const sendTxt=()=>{ const v=clean(inp.value); if(!v) return; act({k:'sub',page:{t:v}}); inp.value=''; sfx('click'); inp.blur(); };
  sb.addEventListener('click',sendTxt); inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ sendTxt(); e.preventDefault(); } e.stopPropagation(); }); inp.addEventListener('keyup',e=>e.stopPropagation());
  let wrapY=440; const place=()=>{ const r=canvas.getBoundingClientRect(),st=env.stage.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=r.left+(r.width-W*s)/2-st.left,oy=r.top+(r.height-H*s)/2-st.top; wrap.style.left=(ox+200*s)+'px'; wrap.style.top=(oy+wrapY*s)+'px'; wrap.style.width=(400*s)+'px'; wrap.style.height=(40*s)+'px'; const fz=Math.max(11,Math.round(17*s))+'px'; inp.style.fontSize=fz; sb.style.fontSize=fz; inp.style.padding='0 '+Math.round(8*s+2)+'px'; sb.style.padding='0 '+Math.round(16*s)+'px'; }; addEventListener('resize',place); place();
  /* ---------- 畫圖 ---------- */
  const board=document.createElement('canvas'); board.width=BW*2; board.height=BH*2; const b=board.getContext('2d');
  function resetBoard(){ strokes=[]; pen=null; redraw(); }
  function redraw(){ b.setTransform(1,0,0,1,0,0); b.fillStyle='#fff'; b.fillRect(0,0,BW*2,BH*2); paint(b,strokes,0,0,BW*2,BH*2); }
  redraw();
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const inR=(x,y,q)=>x>=q.x&&y>=q.y&&x<=q.x+q.w&&y<=q.y+q.h;
  const TOOLS=(()=>{ const a=[]; PAL.forEach((col,i)=>a.push({k:'c',col,x:BX+i*28,y:BY+BH+8,w:24,h:26})); SIZES.forEach((z,i)=>a.push({k:'z',i,x:BX+288+i*30,y:BY+BH+8,w:26,h:26})); a.push({k:'undo',x:BX+410,y:BY+BH+8,w:44,h:26,l:'復原'},{k:'clr',x:BX+456,y:BY+BH+8,w:44,h:26,l:'清除'}); return a; })();
  const iDraw=()=>{ const p=myP(); return p!=null&&kind(G.s)==='d'; };
  const pd=e=>{ if(pv||editing) return; const q=toG(e); for(const bb of btns) if(inR(q[0],q[1],bb)){ bb.fn(); return; }
    if(!iDraw()) return; for(const a of TOOLS) if(inR(q[0],q[1],a)){ sfx('click'); if(a.k==='c') curCol=a.col; else if(a.k==='z') curSz=a.i; else if(a.k==='undo'){ strokes.pop(); redraw(); } else { strokes=[]; redraw(); } return; }
    if(q[0]<BX||q[0]>BX+BW||q[1]<BY||q[1]>BY+BH) return; try{ canvas.setPointerCapture(e.pointerId); }catch(er){}
    pen={c:curCol,z:SIZES[curSz],f:0,p:[Math.round((q[0]-BX)/BW*1000),Math.round((q[1]-BY)/BH*1000)]}; strokes.push(pen); redraw(); e.preventDefault(); };
  const pmv=e=>{ if(pv) return; const q=toG(e); hoverB=btns.findIndex(bb=>inR(q[0],q[1],bb)); canvas.style.cursor=hoverB>=0?'pointer':iDraw()&&q[0]>BX&&q[0]<BX+BW&&q[1]>BY&&q[1]<BY+BH?'crosshair':'';
    if(!pen) return; const x=Math.round(clamp((q[0]-BX)/BW,0,1)*1000),y=Math.round(clamp((q[1]-BY)/BH,0,1)*1000),l=pen.p.length; if(Math.hypot(x-pen.p[l-2],y-pen.p[l-1])<5) return; if(pen.p.length>1200) return;
    const k=b; k.lineCap='round'; k.strokeStyle=pen.c; k.lineWidth=pen.z*2; k.beginPath(); k.moveTo(pen.p[l-2]/1000*BW*2,pen.p[l-1]/1000*BH*2); k.lineTo(x/1000*BW*2,y/1000*BH*2); k.stroke(); pen.p.push(x,y); };
  const pu=()=>{ pen=null; };
  canvas.addEventListener('pointerdown',pd); canvas.addEventListener('pointermove',pmv); canvas.addEventListener('pointerup',pu); canvas.addEventListener('pointercancel',pu); canvas.style.touchAction='none';
  function finishDraw(){ if(!strokes.length) return; const d=strokes.map(s=>({c:s.c,z:s.z,f:s.f,p:s.p.slice()})); act({k:'sub',page:{d}}); sfx('click'); }
  /* ---------- 更新 ---------- */
  function update(dt){ if(ended&&!pv) return; dt=Math.min(dt,.05); t+=dt; if(host) hostStep(dt); else G.PT-=dt;
    const p=myP(),k=G.ph==='work'?kind(G.s):'',showIn=p!=null&&(k==='w'||k==='g')&&(G.s===0||prevPage(p));
    if(!pv){ const was=wrap.style.display==='flex'; wrapY=k==='w'?300:440; if(showIn){ if(!was){ wrap.style.display='flex'; place(); inp.value=''; inp.placeholder=k==='w'?'寫一個題目（最多 12 個字）':'這張圖畫的是什麼？'; if(!env.touch) setTimeout(()=>{ try{ inp.focus(); }catch(e){} },50); } } else if(was) wrap.style.display='none'; }
    if(!pv&&!editing&&document.activeElement!==inp){ if(room&&G.ph==='intro'&&(env.hit('Space')||env.hit('Enter'))) act({k:'go'}); if(G.ph==='reveal'&&(env.hit('Space')||env.hit('Enter')||env.hit('ArrowRight'))) act({k:'next'}); }
    if(client&&G.ph==='reveal'&&!BOOKS[G.rb][G.rk]&&(t%1)<dt) net.send({need:1});
    const key=G.ph+'|'+G.s+'|'+G.rb+'|'+G.rk+'|'+(room?G.hi:0); if(key!==prevKey){ onChange(prevKey); prevKey=key; }
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=420*dt; f.r+=f.vr*dt; if(f.l<=0) fx.splice(i,1); } }
  function onChange(old){ const o=old.split('|'); if(G.ph==='work'&&(o[0]!=='work'||+o[1]!==G.s||room)){ resetBoard(); curCol=PAL[0]; } if(G.ph==='work'&&+o[1]!==G.s) sfx('go');
    if(G.ph==='reveal'){ const pg=BOOKS[G.rb][G.rk]; sfx(pg&&pg.k==='d'?'item':'beep'); if(G.rk===S-1){ const ok=sameEnd(G.rb); if(ok) for(let k=0;k<40;k++) fx.push({x:W/2,y:200,vx:(Math.random()-.5)*460,vy:-220-Math.random()*220,l:1.6,c:['#ff5aa8','#ffd23f','#5bd1ff','#7affa0'][k%4],r:0,vr:(Math.random()-.5)*12}); } } }
  const sameEnd=bk=>{ const a=BOOKS[bk][0],z=BOOKS[bk][S-1]; if(!a||!z) return false; if(norm(a.t)===norm(z.t)) return true; const m=matchCPU(a.t); return m.exact&&[m.e.w].concat(m.e.alt||[]).some(w=>norm(w)===norm(z.t)); };
  function finish(){ if(pv){ env.end({}); return; } let ok=0; const rows=[]; for(let bk=0;bk<N;bk++){ if(sameEnd(bk)) ok++; rows.push('<tr><td>'+names[bk]+'</td><td style="text-align:left">'+BOOKS[bk].map(pg=>!pg?'？':pg.k==='d'?'（圖）':pg.t).join(' → ')+'</td></tr>'); }
    try{ localStorage.setItem('arcade.relay.n',String((+localStorage.getItem('arcade.relay.n')||0)+1)); }catch(e){}
    env.sfx('win'); env.end({title:ok===N?'全部傳對了！默契滿分':ok?'有 '+ok+' 本傳到最後還是對的！':'全部傳歪了，笑死！',big:ok+' / '+N+' 本傳對',text:'每本本子從題目一路傳下去的樣子',html:'<table class="ls"><tr><th>本子</th><th>一路傳下去</th></tr>'+rows.join('')+'</table>',score:null}); }
  /* ---------- 版面 ---------- */
  function person(x,y,i,s,bob){ const C=window.ARCADE_CHAR,L=looks[i]||{}; c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x,y,13*s,4*s,0,0,TAU); c.fill(); if(C) C.drawChar(c,x,y-15*s+(bob||0),colOf(i),1,false,t+i,s*1.1,L.char||'cap',L.deco||''); }
  function hit(x,y,w,h,fn){ btns.push({x,y,w,h,fn:()=>{ sfx('click'); fn(); }}); }
  function btn(x,y,w,h,tx,col,fn,sub){ const k=btns.length,hv=hoverB===k; hit(x,y,w,h,fn); c.save(); c.shadowColor='rgba(0,0,0,.45)'; c.shadowBlur=10; c.shadowOffsetY=4; c.fillStyle=col; rr(c,x,y-(hv?2:0),w,h,14); c.fill(); c.restore(); c.fillStyle='rgba(255,255,255,.28)'; rr(c,x+4,y+3-(hv?2:0),w-8,h*.38,10); c.fill();
    c.fillStyle='#1a1430'; c.font='900 '+(h>44?16:14)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(tx,x+w/2,y+h/2-(sub?7:0)-(hv?2:0),w-10); if(sub){ c.font='700 11px '+TC; c.fillStyle='rgba(26,20,48,.65)'; c.fillText(sub,x+w/2,y+h-9-(hv?2:0)); } }
  function topBar(s,col){ c.fillStyle='rgba(10,20,14,.8)'; rr(c,BX,16,BW,44,12); c.fill(); c.fillStyle=col||'#fff'; c.font='900 20px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(s,W/2,38,BW-20); }
  function sidePanel(){ c.fillStyle='rgba(10,20,14,.7)'; rr(c,20,70,118,24+N*30,12); c.fill(); c.fillStyle='#ffd23f'; c.font='900 12px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(G.ph==='work'?'第 '+(G.s+1)+' / '+S+' 步':'玩家',79,84);
    for(let i=0;i<N;i++){ const y=108+i*30; c.fillStyle=colOf(i); c.beginPath(); c.arc(36,y,8,0,TAU); c.fill(); c.font=(local(i)&&!room?'900 ':'700 ')+'12px '+TC; c.textAlign='left'; c.fillStyle=local(i)&&!room?'#ffd23f':'#fff'; c.fillText(nm(i).slice(0,5),50,y); c.textAlign='right';
      if(G.ph==='work'){ c.fillStyle=G.done[i]?'#7affa0':'rgba(255,255,255,.5)'; c.fillText(G.done[i]?'✔':kind(G.s)==='d'?'畫…':'想…',130,y); } } }
  function boardFrame(){ c.fillStyle='rgba(0,0,0,.35)'; rr(c,BX+4,BY+5,BW,BH,8); c.fill(); c.save(); rr(c,BX,BY,BW,BH,8); c.clip(); c.drawImage(board,BX,BY,BW,BH); c.restore(); c.strokeStyle='#ffd23f'; c.lineWidth=3; rr(c,BX,BY,BW,BH,8); c.stroke(); }
  function tools(){ for(const a of TOOLS){ if(a.k==='c'){ c.fillStyle=a.col; rr(c,a.x,a.y,a.w,a.h,6); c.fill(); c.strokeStyle=curCol===a.col?'#ffd23f':'rgba(255,255,255,.4)'; c.lineWidth=curCol===a.col?3:1; c.stroke(); }
    else if(a.k==='z'){ c.fillStyle=curSz===a.i?'#ffd23f':'rgba(255,255,255,.16)'; rr(c,a.x,a.y,a.w,a.h,6); c.fill(); c.fillStyle=curSz===a.i?'#14122b':'#fff'; c.beginPath(); c.arc(a.x+a.w/2,a.y+a.h/2,Math.min(10,SIZES[a.i]*.42+1),0,TAU); c.fill(); }
    else { c.fillStyle='rgba(255,255,255,.16)'; rr(c,a.x,a.y,a.w,a.h,6); c.fill(); c.fillStyle='#fff'; c.font='900 12px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(a.l,a.x+a.w/2,a.y+a.h/2); } } }
  function textPage(x,y,w,h,txt,by,label){ notebook(c,x,y,w,h,by!=null?colOf(by):null); c.fillStyle='#8a7a6a'; c.font='700 13px '+TC; c.textAlign='center'; c.textBaseline='middle'; if(label) c.fillText(label,x+w/2,y+26);
    c.fillStyle='#1c2a20'; c.font='900 '+(txt.length>8?30:40)+'px '+TC; c.fillText(txt,x+w/2,y+h/2+6,w-50); }
  function draw(){ btns=[]; c.drawImage(bg(),0,0,W,H);
    if(G.ph==='intro'){ introPanel(); return; }
    if(G.ph==='work'||G.ph==='gap'){ workView(); }
    else if(G.ph==='reveal'||G.ph==='final'){ revealView(); }
    drawFx(); }
  function workView(){ sidePanel(); const p=myP(),k=kind(Math.max(0,G.s));
    if(G.ph==='gap'){ topBar('📒 大家把本子傳給下一個人…','#ffd23f'); notebook(c,BX+120,BY+70,260,200,'#ff7eb6'); c.fillStyle='#1c2a20'; c.font='900 22px '+TC; c.textAlign='center'; c.fillText('傳 → 傳 → 傳',W/2,BY+175); return; }
    if(room&&p==null){ const i=roomCur(); if(i==null) return; topBar('把螢幕交給「'+names[i]+'」，其他人先別看！','#ffd23f'); notebook(c,BX+100,BY+60,300,200,colOf(i)); c.fillStyle='#1c2a20'; c.font='900 20px '+TC; c.textAlign='center'; c.fillText(k==='w'?'寫一個題目':k==='d'?'照著字畫出來':'看圖猜猜是什麼',W/2,BY+160);
      btn(W/2-140,BY+290,280,56,'🙈 我是 '+names[i]+'，打開本子','#ffd23f',()=>act({k:'peek'})); return; }
    if(p==null){ /* 做完了，等其他人 */ const n=G.done.filter(x=>x).length; topBar('✔ 你完成了，等其他人…（'+n+' / '+N+'）','#7affa0'); if(k==='d') boardFrame(); else { const pg=BOOKS[bookOf(me,G.s)][G.s]; textPage(BX+70,BY+40,360,240,pg&&pg.t||'…',me,'你寫的'); }
      const al=[...Array(N).keys()]; al.forEach((i,j)=>{ const x=BX+40+j*(BW-80)/Math.max(1,N-1),y=BY+BH+56; person(x,y,i,.62,G.done[i]?0:Math.sin(t*6+i)*1.5); }); return; }
    const prev=prevPage(p);
    if(k==='w'){ topBar((room?names[p]+'：':'')+'寫一個題目，讓下一個人畫','#ffd23f'); textPage(BX+50,BY+10,400,190,'？',p,'第 1 頁：題目');
      c.fillStyle='#e8ffe8'; c.font='700 14px '+TC; c.textAlign='center'; c.fillText('想不到？點一個：',W/2,BY+290); const sg=G.sug[p]||[]; sg.forEach((w,j)=>btn(W/2-195+j*134,BY+302,122,44,w,'#c8f0ff',()=>act({k:'sub',page:{t:w}}))); return; }
    if(!prev){ topBar('等上一頁傳過來…'); return; }
    if(k==='d'){ topBar((room?names[p]+' 請畫出：':'請畫出：')+'「'+prev.t+'」','#ffd23f'); boardFrame(); tools(); btn(662,BY+BH-58,124,56,'✔ 畫好了','#7affa0',finishDraw,strokes.length?'傳給下一個':'先畫點東西');
      c.fillStyle='rgba(255,255,255,.7)'; c.font='700 12px '+TC; c.textAlign='center'; c.fillText('不限時間',724,BY+20); c.fillText('慢慢畫',724,BY+38); return; }
    topBar((room?names[p]+'：':'')+'這張圖畫的是什麼？','#ffd23f'); c.fillStyle='#fff'; c.fillRect(BX,BY,BW,BH); paint(c,prev.d,BX,BY,BW,BH); c.strokeStyle='#ffd23f'; c.lineWidth=3; rr(c,BX,BY,BW,BH,8); c.stroke();
    c.fillStyle='rgba(255,255,255,.8)'; c.font='700 12px '+TC; c.textAlign='center'; c.fillText(nm(prev.by)+' 畫的',BX+BW-50,BY+BH-12); }
  function revealView(){ const bk=G.rb,pg=BOOKS[bk][G.rk];
    c.fillStyle='rgba(10,20,14,.8)'; rr(c,20,16,760,44,12); c.fill(); c.fillStyle='#ffd23f'; c.font='900 19px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('📖 '+names[bk]+' 的本子　第 '+(G.rk+1)+' / '+S+' 頁',W/2,38);
    /* 頁碼小點 */ for(let k=0;k<S;k++){ c.fillStyle=k<=G.rk?'#ffd23f':'rgba(255,255,255,.25)'; c.beginPath(); c.arc(W/2-(S-1)*11+k*22,72,5,0,TAU); c.fill(); }
    if(!pg){ c.fillStyle='#fff'; c.font='900 18px '+TC; c.fillText('翻頁中…',W/2,250); }
    else if(pg.k==='d'){ c.fillStyle='rgba(0,0,0,.35)'; rr(c,BX+4,96,BW,BH-10,8); c.fill(); c.fillStyle='#fff'; rr(c,BX,92,BW,BH-10,8); c.fill(); paint(c,pg.d,BX,92,BW,BH-10); c.strokeStyle='#ffd23f'; c.lineWidth=3; rr(c,BX,92,BW,BH-10,8); c.stroke(); }
    else textPage(BX+60,100,380,250,pg.t,pg.by,G.rk===0?'題目':'猜的答案');
    if(pg){ const x=96,y=300; person(x,y,pg.by,1.05,0); c.font='900 13px '+TC; const s=nm(pg.by)+(pg.k==='d'?' 畫的':G.rk===0?' 出的題':' 猜的'),w=c.measureText(s).width+16; c.fillStyle='rgba(10,20,14,.85)'; rr(c,x-w/2,y+8,w,22,10); c.fill(); c.fillStyle='#fff'; c.textAlign='center'; c.fillText(s,x,y+19); }
    if(G.rk>0){ const pr=BOOKS[bk][G.rk-1]; if(pr&&pr.k!=='d'){ c.fillStyle='rgba(255,255,255,.75)'; c.font='700 13px '+TC; c.textAlign='center'; c.fillText('上一頁：「'+pr.t+'」',710,120,150); } else if(pr){ c.fillStyle='#fff'; rr(c,662,96,120,85,6); c.fill(); paint(c,pr.d,662,96,120,85); c.fillStyle='rgba(255,255,255,.75)'; c.font='700 12px '+TC; c.textAlign='center'; c.fillText('上一頁',722,194); } }
    const last=G.rk===S-1&&pg;
    if(last){ const a=BOOKS[bk][0]; const ok=sameEnd(bk); c.fillStyle='rgba(10,20,14,.9)'; rr(c,BX,BY+BH-6,BW,40,14); c.fill(); c.font='900 16px '+TC; c.fillStyle=ok?'#7affa0':'#ffb0c8'; c.textAlign='center'; c.fillText(ok?'🎉 傳到最後還是「'+a.t+'」，完美！':'原本是「'+(a&&a.t)+'」，傳到最後變成「'+pg.t+'」😂',W/2,BY+BH+14,BW-20); }
    if(G.ph==='reveal'){ const canNext=!net||me===0; const lastAll=G.rk===S-1&&G.rb===N-1;
      if(canNext) btn(662,404,124,56,lastAll?'看結果 ▶':G.rk===S-1?'下一本 ▶':'下一頁 ▶','#ffd23f',()=>act({k:'next'}),env.touch?'':'空白鍵');
      else { c.fillStyle='rgba(255,255,255,.75)'; c.font='700 12px '+TC; c.textAlign='center'; c.fillText('房主翻頁中',724,430); } } }
  function introPanel(){ c.fillStyle='rgba(10,20,14,.88)'; rr(c,W/2-260,60,520,300,22); c.fill(); c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 32px '+TC; c.fillText('傳話變變變',W/2,100);
    c.font='700 15px '+TC; c.fillStyle='#e8ffe8'; ['每人一本本子，第一頁寫一個題目','往下傳：照著字畫圖 → 看圖猜字 → 再畫 → 再猜…','每本傳完一圈，最後一本一本翻開，看題目怎麼傳歪'].forEach((s,k)=>c.fillText(s,W/2,146+k*28));
    c.fillStyle='#fff'; c.font='700 13px '+TC; c.fillText('每本 '+S+' 頁・不計分、不限時，越好笑越好',W/2,236); c.fillText(net?'連線：大家用自己的螢幕同時畫':room?'大家用一台：輪流偷偷寫、畫、猜':'和電腦一起玩，一共 '+N+' 個人',W/2,262);
    if(room){ btn(W/2-200,290,180,50,'✏️ 改名字','#e8dcff',()=>{ editing=true; hoverB=-1; window.PARTY_NAMES.edit(env.stage,names,()=>{ editing=false; }); }); btn(W/2+20,290,180,50,'▶ 開始遊戲','#ffd23f',()=>act({k:'go'}),env.touch?'':'空白鍵'); }
    else { c.fillStyle='rgba(255,255,255,.7)'; c.fillText('馬上開始…',W/2,316); }
    const al=[...Array(N).keys()]; al.forEach((i,j)=>person(W/2-(N-1)*45+j*90,440,i,.9,Math.sin(t*5+i)*2)); }
  function drawFx(){ for(const f of fx){ c.save(); c.globalAlpha=Math.min(1,f.l); c.translate(f.x,f.y); c.rotate(f.r); c.fillStyle=f.c; c.fillRect(-4,-2.5,8,5); c.restore(); } }
  return {update,draw,destroy(){ const o=env.stage&&env.stage.querySelector('.pnEdit'); if(o) o.remove(); removeEventListener('resize',place); if(wrap.parentNode) wrap.remove(); canvas.removeEventListener('pointerdown',pd); canvas.removeEventListener('pointermove',pmv); canvas.removeEventListener('pointerup',pu); canvas.removeEventListener('pointercancel',pu); },
    _dbg:{get G(){ return G; },doAct,BOOKS,bot,names,N,S,submit,botWork,get strokes(){ return strokes; },set strokes(v){ strokes=v; redraw(); },finishDraw,sameEnd}};
}
/* ---------- 開始畫面示意圖：一本本子從字、到圖、到猜錯的字 ---------- */
function stageShow(ctx,w,h,t){ ctx.save(); ctx.scale(w/W,h/H); const c=ctx; c.drawImage(bg(),0,0,W,H); const L=CPU(),u=(t%9)/9;
  const e1=L.find(q=>q.w==='貓咪')||L[0],e2=L.find(q=>q.w==='小狗')||L[1];
  const P=[{t:'貓咪'},{d:e1},{t:'老虎'},{d:e2},{t:'小狗？'}],n=Math.min(P.length,1+Math.floor(u*6));
  for(let k=0;k<n;k++){ const x=40+k*148,y=150+(k%2)*40; if(P[k].t){ notebook(c,x,y,136,110,PCOL[k]); c.fillStyle='#1c2a20'; c.font='900 26px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(P[k].t,x+72,y+60); }
    else if(P[k].d){ c.fillStyle='#fff'; rr(c,x,y,136,96,8); c.fill(); c.strokeStyle='#ffd23f'; c.lineWidth=3; c.stroke(); if(P[k].d.s) paint(c,cpuStrokes(P[k].d,0),x,y,136,96); }
    if(k<n-1){ c.fillStyle='#ffd23f'; c.font='900 24px '+TC; c.fillText('→',x+142,y+50+(k%2?-20:20)); } }
  c.font='900 44px '+TC; c.textAlign='center'; c.lineWidth=8; c.strokeStyle='#16291f'; c.strokeText('傳話變變變',W/2,80); c.fillStyle='#ffd23f'; c.fillText('傳話變變變',W/2,80);
  c.font='900 19px '+TC; c.fillStyle='#fff'; c.fillText('寫 → 畫 → 猜 → 畫 → 猜…看題目怎麼越傳越歪',W/2,420); ctx.restore(); }
const LSn=k=>{ try{ return +localStorage.getItem(k)||0; }catch(e){ return 0; } };
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).relay={
  name:'傳話變變變',tag:'DRAW RELAY',color:'#7ad85a',online:true,maxPlayers:8,minPlayers:3,
  desc:'畫圖傳話遊戲！每人一本本子，寫一個題目往下傳，下一個人照著畫、再下一個人看圖猜，一路傳下去。最後一本一本翻開，看「貓咪」怎麼變成「外星人」。3～8 人一起玩：連線各用自己的手機同時畫，或大家用一台輪流畫。',
  goal:'第一頁寫一個題目，接著輪流「照著字畫圖」和「看圖猜字」，每本傳完一圈。最後一本一本翻開，看題目怎麼越傳越歪；不計分、不限時。',
  modes:[{id:'room',label:'大家用一台'}],
  options:[{key:'n',label:'玩家人數',def:'5',solo:true,opts:[3,4,5,6,7,8].map(n=>({id:String(n),label:n+' 人'}))}],
  help:[['打字＋Enter','寫題目、寫你猜的答案'],['滑鼠','在白板上畫圖，畫好按「畫好了」'],['空白鍵','翻開本子時看下一頁']],
  touchHelp:[['打字','寫題目、寫你猜的答案'],['手指','在白板上畫圖，畫好按「畫好了」'],['下一頁','翻開本子時一頁一頁看']],touch:null,
  looks:[{key:'char',label:'人物',opts:[{id:'cap',label:'帽子'},{id:'cat',label:'貓耳'},{id:'bunny',label:'兔耳'},{id:'crown',label:'皇冠'},{id:'chef',label:'廚師'},{id:'pirate',label:'海盜'},{id:'ninja',label:'忍者'},{id:'bow',label:'蝴蝶結'}]},{key:'color',label:'人物顏色',type:'color',opts:['auto','#ff7a3d','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d','#3ddbd9','#ff7eb6']}],
  preview:(ctx,w,h,L,t)=>{ ctx.drawImage(bg(),0,0,w,h); const C=window.ARCADE_CHAR; if(C) C.drawChar(ctx,w/2,h*.6,!L||!L.color||L.color==='auto'?PCOL[0]:L.color,1,false,t,2.6,(L&&L.char)||'cap',''); },
  hubBest:()=>{ const v=LSn('arcade.relay.n'); return v?'玩過 <b>'+v+'</b> 次':'尚無紀錄'; },
  thumb:stageShow,best:{label:'',fmt:v=>v,lower:false},create};
})();
