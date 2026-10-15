// 貓咪數獨：參考 Meowdoku 的玩法。N×N 的格子分成 N 個顏色區塊，
// 每一列、每一行、每一個顏色區塊都剛好放一隻貓，而且貓和貓不能相鄰（斜的也不行）。
// 關卡用固定的亂數種子產生，產生後確認只有唯一解；放錯貓會扣一條小魚乾，三條吃光就失敗。
(function(){
'use strict';
const W=560,H=660,BX=35,BY=92,BS=490;
const PIX='"Press Start 2P","Noto Sans TC","Microsoft JhengHei",monospace';
const TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const LEVELS=50,LIVES=3,HINTS=3;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const sizeOf=i=>i<8?5:i<18?6:i<30?7:i<42?8:9;
const fmt=s=>{ s=Math.floor(s); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };

/* ---- 關卡產生：先放好答案的貓，再長出顏色區塊，有第二個解就修改區塊直到唯一解 ---- */
function rng(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function shuffle(a,R){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(R()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
const D4=[[1,0],[-1,0],[0,1],[0,-1]];
function solveCount(N,reg,limit){
  const colUsed=new Array(N).fill(false),regUsed=new Array(N).fill(false),pos=new Array(N),all=[];
  (function rec(r){ if(all.length>=limit) return; if(r===N){ all.push(pos.slice()); return; }
    for(let c=0;c<N;c++){ if(colUsed[c]) continue; const g=reg[r*N+c]; if(regUsed[g]) continue; if(r>0&&Math.abs(pos[r-1]-c)<=1) continue;
      colUsed[c]=regUsed[g]=true; pos[r]=c; rec(r+1); colUsed[c]=regUsed[g]=false; } })(0);
  return all;
}
function connected(N,reg,g){ let st=-1,n=0; for(let k=0;k<N*N;k++) if(reg[k]===g){ n++; if(st<0) st=k; } if(!n) return false; const seen=new Set([st]),q=[st];
  while(q.length){ const k=q.pop(),r=k/N|0,c=k%N; for(const [dr,dc] of D4){ const rr=r+dr,cc=c+dc,kk=rr*N+cc; if(rr>=0&&rr<N&&cc>=0&&cc<N&&reg[kk]===g&&!seen.has(kk)){ seen.add(kk); q.push(kk); } } } return seen.size===n; }
const cache={};
function genLevel(i){
  if(cache[i]) return cache[i];
  const N=sizeOf(i),R=rng(i*7919+101);
  for(let att=0;att<300;att++){
    const p=[],used=new Array(N).fill(false);
    const place=r=>{ if(r===N) return true; for(const c of shuffle([...Array(N).keys()],R)){ if(used[c]||(r&&Math.abs(p[r-1]-c)<=1)) continue; used[c]=true; p[r]=c; if(place(r+1)) return true; used[c]=false; } return false; };
    place(0);
    const reg=new Array(N*N).fill(-1),size=new Array(N).fill(1); for(let r=0;r<N;r++) reg[r*N+p[r]]=r;
    for(let left=N*N-N;left>0;left--){ // 小的區塊比較容易長大，區塊大小才不會差太多
      const cand=[]; let tot=0;
      for(let g=0;g<N;g++){ const fr=[]; for(let k=0;k<N*N;k++) if(reg[k]===g){ const r=k/N|0,c=k%N; for(const [dr,dc] of D4){ const rr=r+dr,cc=c+dc; if(rr>=0&&rr<N&&cc>=0&&cc<N&&reg[rr*N+cc]<0) fr.push(rr*N+cc); } }
        if(fr.length){ const w=Math.pow(size[g],-1.6); cand.push([g,fr,w]); tot+=w; } }
      let x=R()*tot,pick=cand[0]; for(const c of cand){ x-=c[2]; if(x<=0){ pick=c; break; } }
      const k=pick[1][Math.floor(R()*pick[1].length)]; reg[k]=pick[0]; size[pick[0]]++;
    }
    for(let it=0;it<400;it++){
      const all=solveCount(N,reg,2); if(all.length===1){ const colors=shuffle([...Array(9).keys()],R); return cache[i]={N,reg,sol:all[0],colors}; }
      const alt=all.find(q=>q.some((c,r)=>c!==p[r])); if(!alt) break;
      let done=false; // 把另一個解裡某隻貓的格子改到隔壁的區塊，讓那個解不成立
      for(const r of shuffle([...Array(N).keys()],R)){ if(alt[r]===p[r]) continue; const k=r*N+alt[r],g=reg[k],nb=[];
        for(const [dr,dc] of D4){ const rr=r+dr,cc=alt[r]+dc; if(rr>=0&&rr<N&&cc>=0&&cc<N&&reg[rr*N+cc]!==g) nb.push(reg[rr*N+cc]); }
        if(!nb.length) continue; reg[k]=-2; if(!connected(N,reg,g)){ reg[k]=g; continue; }
        reg[k]=nb[Math.floor(R()*nb.length)]; done=true; break; }
      if(!done) break;
    }
  }
  return null;
}

/* ---- 顏色與貓 ---- */
const PALETTE={
  soft:['#ffa8b4','#ffcc8a','#fff08a','#b4eaa0','#9cceff','#c8b0ff','#ffb0e4','#8ee6d6','#dcc8a8'],
  vivid:['#ff7b86','#ffae4f','#ffe066','#7fdc8c','#6fb8ff','#b08cff','#ff8fd0','#5fd8c8','#d4a774'],
  forest:['#c9a27a','#a8c97a','#e6d38a','#7fb59a','#9ab8d4','#c4a8d4','#e6a88a','#b5d4b0','#d4c4a0']
};
const CATS={
  orange:{body:'#f4a340',dark:'#d9802a',ear:'#ffc9b0',eye:'#2a7a3a',line:'#5a3418',stripe:1},
  black:{body:'#34303d',dark:'#1e1b25',ear:'#7a5a6a',eye:'#ffd23f',line:'#0b0a10'},
  white:{body:'#faf7f2',dark:'#e2dcd2',ear:'#ffc9d0',eye:'#4f9dff',line:'#6a6058'},
  calico:{body:'#faf7f2',dark:'#e2dcd2',ear:'#ffc9d0',eye:'#b8860b',line:'#5a4a40',calico:1},
  gray:{body:'#a4abba',dark:'#828a9a',ear:'#f0c4cc',eye:'#3ddbd9',line:'#3a3f4c',stripe:1}
};
// 貓頭：s 是格子大小；mood 0 平常、1 開心（閉眼笑）、2 驚訝
function drawCat(c,x,y,s,kind,t,mood,seed){
  const K=CATS[kind]||CATS.orange,r=s*.36; seed=seed||0;
  c.save(); c.translate(x,y+r*.08); c.lineJoin='round'; c.lineCap='round'; const lw=Math.max(1.2,s*.035);
  // 耳朵
  for(const sd of [-1,1]){ c.fillStyle=K.body; c.strokeStyle=K.line; c.lineWidth=lw; c.beginPath(); c.moveTo(sd*r*.95,-r*.25); c.lineTo(sd*r*.78,-r*1.18); c.lineTo(sd*r*.18,-r*.78); c.closePath(); c.fill(); c.stroke();
    c.fillStyle=K.ear; c.beginPath(); c.moveTo(sd*r*.8,-r*.42); c.lineTo(sd*r*.72,-r*.98); c.lineTo(sd*r*.35,-r*.74); c.closePath(); c.fill(); }
  // 臉
  c.fillStyle=K.body; c.beginPath(); c.ellipse(0,0,r*1.08,r*.92,0,0,7); c.fill();
  if(K.calico){ c.save(); c.beginPath(); c.ellipse(0,0,r*1.08,r*.92,0,0,7); c.clip(); c.fillStyle='#f4a340'; c.beginPath(); c.ellipse(-r*.7,-r*.55,r*.6,r*.5,.4,0,7); c.fill(); c.fillStyle='#34303d'; c.beginPath(); c.ellipse(r*.75,-r*.45,r*.5,r*.42,-.3,0,7); c.fill(); c.restore(); }
  if(K.stripe){ c.strokeStyle=K.dark; c.lineWidth=lw*1.3; for(const dx of [-.22,0,.22]){ c.beginPath(); c.moveTo(dx*r,-r*.9); c.lineTo(dx*r*.8,-r*.55); c.stroke(); } }
  c.strokeStyle=K.line; c.lineWidth=lw; c.beginPath(); c.ellipse(0,0,r*1.08,r*.92,0,0,7); c.stroke();
  // 眼睛（偶爾眨眼）
  const blink=mood===0&&((t*.7+seed*.37)%4)<.12;
  for(const sd of [-1,1]){ const ex=sd*r*.4,ey=-r*.08;
    if(mood===1||blink){ c.strokeStyle=K.line; c.lineWidth=lw*1.2; c.beginPath(); if(mood===1) c.arc(ex,ey+r*.06,r*.15,Math.PI*1.1,Math.PI*1.9); else { c.moveTo(ex-r*.15,ey); c.lineTo(ex+r*.15,ey); } c.stroke(); }
    else { c.fillStyle=K.eye; c.beginPath(); c.ellipse(ex,ey,r*.17,r*(mood===2?.24:.21),0,0,7); c.fill(); c.fillStyle='#14121c'; c.beginPath(); c.ellipse(ex,ey+r*.02,r*.08,r*(mood===2?.2:.16),0,0,7); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(ex-r*.05,ey-r*.08,r*.055,0,7); c.fill(); } }
  // 鼻子、嘴巴、腮紅、鬍鬚
  c.fillStyle='#ff7e9a'; c.beginPath(); c.moveTo(-r*.09,r*.17); c.lineTo(r*.09,r*.17); c.lineTo(0,r*.28); c.closePath(); c.fill();
  c.strokeStyle=K.line; c.lineWidth=lw*.9; c.beginPath(); c.moveTo(0,r*.28); c.quadraticCurveTo(-r*.08,r*.42,-r*.2,r*.34); c.moveTo(0,r*.28); c.quadraticCurveTo(r*.08,r*.42,r*.2,r*.34); c.stroke();
  if(mood===2){ c.fillStyle='#8a2a3a'; c.beginPath(); c.ellipse(0,r*.46,r*.09,r*.1,0,0,7); c.fill(); }
  c.fillStyle='rgba(255,120,150,.35)'; for(const sd of [-1,1]){ c.beginPath(); c.ellipse(sd*r*.68,r*.22,r*.16,r*.1,0,0,7); c.fill(); }
  c.strokeStyle=kind==='black'?'rgba(255,255,255,.55)':'rgba(40,30,30,.45)'; c.lineWidth=Math.max(.8,lw*.6);
  for(const sd of [-1,1]) for(const dy of [-.04,.1]){ c.beginPath(); c.moveTo(sd*r*.55,r*(.16+dy)); c.lineTo(sd*r*1.25,r*(.08+dy*2.2)); c.stroke(); }
  c.restore();
}
function drawFish(c,x,y,s,on){ // 小魚乾＝生命
  c.save(); c.translate(x,y); c.globalAlpha=on?1:.25; c.fillStyle=on?'#ffb347':'#6b6799'; c.strokeStyle='#5a3418'; c.lineWidth=1.5;
  c.beginPath(); c.ellipse(0,0,s*.55,s*.3,0,0,7); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(s*.45,0); c.lineTo(s*.85,-s*.3); c.lineTo(s*.85,s*.3); c.closePath(); c.fill(); c.stroke();
  c.fillStyle='#2a1a10'; c.beginPath(); c.arc(-s*.3,-s*.05,s*.06,0,7); c.fill(); c.restore();
}

/* ---- 紀錄：每一關最快時間 ---- */
const recKey=i=>'arcade.meow.t.'+i,getRec=i=>{ try{ const v=parseFloat(localStorage.getItem(recKey(i))); return isFinite(v)?v:null; }catch(e){ return null; } };
const cleared=()=>{ let n=0; for(let i=0;i<LEVELS;i++) if(getRec(i)!=null) n++; return n; };

function create(env,opts){
  const L=opts.look||{cat:'orange',theme:'soft'},lv=clamp(opts.stage||0,0,LEVELS-1),P=genLevel(lv),N=P.N,CS=BS/N;
  const pal=PALETTE[L.theme]||PALETTE.soft,regCol=g=>pal[P.colors[g]%pal.length];
  const {ctx:c,canvas}=env.canvas2d(W,H);
  const st=new Array(N*N).fill(0); // 0 空、1 打叉、2 貓
  let lives=LIVES,hints=HINTS,mistakes=0,t=0,ended=false,winT=-1,cur=-1,shake=0,hist=[];
  const pop=new Array(N*N).fill(0),wrong=new Array(N*N).fill(0),hintGlow=new Array(N*N).fill(0),fx=[];
  const RC=k=>[k/N|0,k%N];
  // 被已經放好的貓擋住的格子（同列、同行、同區塊、相鄰）
  function blocked(){ const b=new Array(N*N).fill(false);
    for(let k=0;k<N*N;k++) if(st[k]===2){ const [r,cc]=RC(k);
      for(let j=0;j<N*N;j++){ if(j===k) continue; const [r2,c2]=RC(j); if(r2===r||c2===cc||P.reg[j]===P.reg[k]||Math.abs(r2-r)<=1&&Math.abs(c2-cc)<=1) b[j]=true; } }
    return b; }
  let blk=blocked();
  const catCount=()=>st.filter(v=>v===2).length;
  let grp=null; // 一次拖曳算一步，復原時一起退回
  function setCell(k,v){ if(st[k]===v) return; if(grp) grp.push([k,st[k]]); else hist.push([[k,st[k]]]); st[k]=v; }
  function tryCat(k){
    if(ended) return; const [r,cc]=RC(k);
    if(P.sol[r]===cc){ hist.push([[k,st[k]]]); st[k]=2; pop[k]=1; blk=blocked(); env.sfx('item');
      const [x,y]=cellXY(k); for(let i=0;i<10;i++){ const a=Math.random()*6.28,v=60+Math.random()*90; fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,life:.7,col:['#ffd23f','#ff7eb6','#fff'][i%3]}); }
      if(catCount()===N) win(); }
    else { lives--; mistakes++; wrong[k]=1; shake=.35; st[k]=1; env.sfx('hurt'); if(lives<=0) lose(); }
  }
  function hint(){
    if(ended||hints<=0) return;
    // 找可以放的格子最少的區塊，直接放上正確的貓
    let best=-1,bn=1e9; for(let g=0;g<N;g++){ let has=false,n=0; for(let k=0;k<N*N;k++) if(P.reg[k]===g){ if(st[k]===2) has=true; else if(st[k]===0&&!blk[k]) n++; } if(!has&&n<bn){ bn=n; best=g; } }
    if(best<0) return; let k=-1; for(let r=0;r<N;r++) if(P.reg[r*N+P.sol[r]]===best) k=r*N+P.sol[r];
    hints--; hintGlow[k]=1.2; env.sfx('beep'); tryCat(k);
  }
  function undo(){ if(ended) return; const h=hist.pop(); if(!h) return; for(let i=h.length-1;i>=0;i--) st[h[i][0]]=h[i][1]; blk=blocked(); env.sfx('click'); }
  function restart(){ if(ended) return; st.fill(0); hist=[]; blk=blocked(); env.sfx('click'); }
  function win(){ ended=true; winT=0; const time=t,old=getRec(lv); let rec=false;
    if(old==null||time<old){ rec=true; try{ localStorage.setItem(recKey(lv),String(time)); }catch(e){} }
    env.sfx('win');
    setTimeout(()=>env.end({title:'過關！',big:fmt(time),text:'第 '+(lv+1)+' 關（'+N+'×'+N+'）完成，錯了 '+mistakes+' 次、用了 '+(HINTS-hints)+' 次提示。'+(rec?'這關的新紀錄！':'這關最快 '+fmt(old)),score:cleared(),next:lv<LEVELS-1}),1700); }
  function lose(){ ended=true; env.sfx('lose'); setTimeout(()=>env.end({title:'小魚乾吃光了',big:'',text:'放錯 3 次貓了。先用打叉把不可能的格子排除，再放貓會比較穩喔！',score:null}),900); }

  /* ---- 操作：點一下打叉，再點一下放貓，點貓拿掉；按住拖曳可以連續打叉或清除 ---- */
  const cellXY=k=>{ const [r,cc]=RC(k); return [BX+cc*CS+CS/2,BY+r*CS+CS/2]; };
  const BTN=[{id:'undo',label:'復原',x:35},{id:'hint',label:'提示',x:202},{id:'reset',label:'重來',x:369}];
  function toLogical(e){ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=(r.width-W*s)/2,oy=(r.height-H*s)/2; return [(e.clientX-r.left-ox)/s,(e.clientY-r.top-oy)/s]; }
  const cellAt=(x,y)=>{ const cc=Math.floor((x-BX)/CS),r=Math.floor((y-BY)/CS); return r>=0&&r<N&&cc>=0&&cc<N?r*N+cc:-1; };
  let drag=null;
  function onDown(e){ e.preventDefault(); env.audio&&env.audio(); const [x,y]=toLogical(e);
    for(const b of BTN) if(x>=b.x&&x<b.x+156&&y>=600&&y<644){ if(b.id==='undo') undo(); else if(b.id==='hint') hint(); else restart(); return; }
    const k=cellAt(x,y); if(k<0||ended) return; cur=k;
    try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
    if(st[k]===2){ setCell(k,0); blk=blocked(); env.sfx('click'); drag=null; return; }
    if(st[k]===1){ grp=[]; drag={mode:'pend',start:k,last:k}; return; }
    grp=[]; setCell(k,1); env.sfx('click'); drag={mode:'x',start:k,last:k};
  }
  function onMove(e){ if(!drag) return; const [x,y]=toLogical(e),k=cellAt(x,y); if(k<0||k===drag.last) return; drag.last=k;
    if(drag.mode==='pend'){ drag.mode='clear'; setCell(drag.start,0); }
    if(drag.mode==='x'&&st[k]===0) setCell(k,1); else if(drag.mode==='clear'&&st[k]===1) setCell(k,0); }
  function onUp(){ const g=grp; grp=null; if(g&&g.length) hist.push(g); if(drag&&drag.mode==='pend') tryCat(drag.start); drag=null; }
  canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointermove',onMove); canvas.addEventListener('pointerup',onUp); canvas.addEventListener('pointercancel',onUp);
  canvas.style.touchAction='none';

  function update(dt){
    if(!ended) t+=dt; else if(winT>=0) winT+=dt;
    // 鍵盤：方向鍵移動、空白鍵打叉、Enter 放貓、H 提示、Z 復原
    const K=env.hit; let mv=null;
    if(K('ArrowUp')||K('KeyW')) mv=[-1,0]; else if(K('ArrowDown')||K('KeyS')) mv=[1,0]; else if(K('ArrowLeft')||K('KeyA')) mv=[0,-1]; else if(K('ArrowRight')||K('KeyD')) mv=[0,1];
    if(mv){ if(cur<0) cur=0; else { const [r,cc]=RC(cur); cur=clamp(r+mv[0],0,N-1)*N+clamp(cc+mv[1],0,N-1); } }
    if(!ended&&cur>=0){
      if(K('Space')||K('KeyJ')){ if(st[cur]===0) setCell(cur,1); else if(st[cur]===1) setCell(cur,0); env.sfx('click'); }
      if(K('Enter')||K('KeyK')){ if(st[cur]===2){ setCell(cur,0); blk=blocked(); } else tryCat(cur); } }
    if(K('KeyH')) hint(); if(K('KeyZ')) undo();
    for(let k=0;k<N*N;k++){ if(pop[k]>0) pop[k]=Math.max(0,pop[k]-dt*3); if(wrong[k]>0) wrong[k]=Math.max(0,wrong[k]-dt*1.6); if(hintGlow[k]>0) hintGlow[k]=Math.max(0,hintGlow[k]-dt); }
    if(shake>0) shake=Math.max(0,shake-dt);
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.life-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=260*dt; if(f.life<=0) fx.splice(i,1); }
    if(winT>=0&&winT<1.4&&Math.random()<dt*30) fx.push({x:Math.random()*W,y:-10,vx:(Math.random()-.5)*60,vy:80+Math.random()*120,life:2,col:['#ffd23f','#ff7eb6','#3ddbd9','#86dc4f','#fff'][Math.random()*5|0]});
  }

  function draw(){
    // 背景：淡淡的貓掌印
    const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#2b2550'); g.addColorStop(1,'#1a1636'); c.fillStyle=g; c.fillRect(0,0,W,H);
    c.fillStyle='rgba(255,255,255,.035)'; for(let i=0;i<14;i++){ const x=(i*137)%W,y=(i*211)%H; c.beginPath(); c.arc(x,y,9,0,7); c.fill(); for(const [dx,dy] of [[-9,-11],[-3,-15],[4,-15],[10,-11]]){ c.beginPath(); c.arc(x+dx,y+dy,3.6,0,7); c.fill(); } }
    // 上方：關卡、時間、小魚乾
    c.textBaseline='middle'; c.textAlign='left'; c.fillStyle='#ffd23f'; c.font='900 22px '+TC; c.fillText('第 '+(lv+1)+' 關',BX,30);
    c.fillStyle='#aaa4d8'; c.font='700 14px '+TC; c.fillText(N+'×'+N+'　'+'★'.repeat(N-4),BX+(lv>=9?108:94),31);
    c.font='14px '+PIX; c.fillStyle='#fff'; c.fillText(fmt(t),BX,64);
    for(let i=0;i<LIVES;i++) drawFish(c,W-BX-26-i*40,34,26,i<lives);
    c.textAlign='right'; c.font='700 12px '+TC; c.fillStyle='#aaa4d8'; c.fillText('每列、每行、每個顏色各一隻貓，貓不能相鄰',W-BX,66);
    // 盤面
    const sx=shake>0?Math.sin(shake*60)*5*shake/.35:0;
    c.save(); c.translate(sx,0);
    c.fillStyle='#14122b'; c.fillRect(BX-6,BY-6,BS+12,BS+12);
    for(let k=0;k<N*N;k++){ const [r,cc]=RC(k),x=BX+cc*CS,y=BY+r*CS; c.fillStyle=regCol(P.reg[k]); c.fillRect(x,y,CS,CS);
 }
    // 細格線與區塊粗框
    c.strokeStyle='rgba(20,18,43,.25)'; c.lineWidth=1; c.beginPath(); for(let i=1;i<N;i++){ c.moveTo(BX+i*CS,BY); c.lineTo(BX+i*CS,BY+BS); c.moveTo(BX,BY+i*CS); c.lineTo(BX+BS,BY+i*CS); } c.stroke();
    c.strokeStyle='#14122b'; c.lineWidth=3.2; c.lineCap='round'; c.beginPath();
    for(let r=0;r<N;r++) for(let cc=0;cc<N;cc++){ const k=r*N+cc,x=BX+cc*CS,y=BY+r*CS;
      if(cc<N-1&&P.reg[k]!==P.reg[k+1]){ c.moveTo(x+CS,y); c.lineTo(x+CS,y+CS); }
      if(r<N-1&&P.reg[k]!==P.reg[k+N]){ c.moveTo(x,y+CS); c.lineTo(x+CS,y+CS); } }
    c.stroke(); c.lineWidth=4; c.strokeRect(BX,BY,BS,BS);
    // 叉叉、被擋住的小點、貓
    for(let k=0;k<N*N;k++){ const [x,y]=cellXY(k);
      if(hintGlow[k]>0){ c.fillStyle='rgba(255,255,255,'+(.6*Math.min(1,hintGlow[k]))+')'; c.beginPath(); c.arc(x,y,CS*.48,0,7); c.fill(); }
      if(st[k]===1){ const a=CS*.17,red=wrong[k]>0; c.strokeStyle=red?'#e23b3b':'rgba(20,18,43,.7)'; c.lineWidth=red?CS*.09:Math.max(2,CS*.06); c.beginPath(); c.moveTo(x-a,y-a); c.lineTo(x+a,y+a); c.moveTo(x+a,y-a); c.lineTo(x-a,y+a); c.stroke(); }
      else if(st[k]===0&&blk[k]){ c.fillStyle='rgba(20,18,43,.35)'; c.beginPath(); c.arc(x,y,Math.max(2,CS*.05),0,7); c.fill(); }
      if(st[k]===2){ let s=1+Math.sin(pop[k]*Math.PI)*.25,yy=y+Math.sin(t*2.2+k)*CS*.015;
        if(winT>=0){ const [r]=RC(k),d=winT*4-r*.35; if(d>0&&d<1) yy-=Math.sin(d*Math.PI)*CS*.35; }
        c.save(); c.translate(x,yy); c.scale(s,s); drawCat(c,0,0,CS,L.cat,t,winT>=0?1:0,k); c.restore(); }
      if(wrong[k]>0&&st[k]===1){ c.save(); c.globalAlpha=wrong[k]; drawCat(c,x,y-CS*.15*(1-wrong[k]),CS*.8,L.cat,t,2,k); c.restore(); } }
    if(cur>=0&&!ended){ const [r,cc]=RC(cur); c.strokeStyle='#ffd23f'; c.lineWidth=3; c.strokeRect(BX+cc*CS+2,BY+r*CS+2,CS-4,CS-4); }
    c.restore();
    // 下方按鈕
    for(const b of BTN){ const dis=ended||b.id==='hint'&&hints<=0||b.id==='undo'&&!hist.length; c.fillStyle=dis?'#2b2759':'#3d3680'; c.fillRect(b.x,600,156,44); c.strokeStyle=dis?'#3a3570':'#ffd23f'; c.lineWidth=2; c.strokeRect(b.x+1,601,154,42);
      c.textAlign='center'; c.fillStyle=dis?'#6b6799':'#fff'; c.font='900 17px '+TC; c.fillText(b.label+(b.id==='hint'?'（'+hints+'）':''),b.x+78,623); }
    for(const f of fx){ c.globalAlpha=Math.max(0,Math.min(1,f.life)); c.fillStyle=f.col; c.fillRect(f.x-3,f.y-3,6,6); } c.globalAlpha=1;
    if(winT>=0){ const a=Math.min(1,winT*3); c.globalAlpha=a; c.textAlign='center'; c.font='900 46px '+TC; c.lineWidth=8; c.strokeStyle='#14122b'; c.strokeText('喵～過關！',W/2,BY+BS/2); c.fillStyle='#ffd23f'; c.fillText('喵～過關！',W/2,BY+BS/2); c.globalAlpha=1; }
  }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('pointermove',onMove); canvas.removeEventListener('pointerup',onUp); canvas.removeEventListener('pointercancel',onUp); },
    _dbg:{P,st,tryCat,hint,get lives(){return lives;}}};
}

/* ---- 大廳縮圖與造型預覽 ---- */
const DEMO={N:5,reg:[0,0,1,1,1,0,2,2,1,3,0,2,4,4,3,0,2,4,3,3,2,2,4,4,3],sol:[0,3,1,4,2]};
function demo(c,w,h,t,L){
  const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#2b2550'); g.addColorStop(1,'#1a1636'); c.fillStyle=g; c.fillRect(0,0,w,h);
  const pal=PALETTE[L.theme]||PALETTE.soft,s=h*.82,cs=s/5,x0=w*.06,y0=(h-s)/2,shown=Math.floor((t*1.2)%7);
  c.fillStyle='#14122b'; c.fillRect(x0-4,y0-4,s+8,s+8);
  for(let k=0;k<25;k++){ const r=k/5|0,cc=k%5; c.fillStyle=pal[DEMO.reg[k]]; c.fillRect(x0+cc*cs,y0+r*cs,cs,cs); }
  c.strokeStyle='#14122b'; c.lineWidth=2.5; c.beginPath();
  for(let r=0;r<5;r++) for(let cc=0;cc<5;cc++){ const k=r*5+cc,x=x0+cc*cs,y=y0+r*cs; if(cc<4&&DEMO.reg[k]!==DEMO.reg[k+1]){ c.moveTo(x+cs,y); c.lineTo(x+cs,y+cs); } if(r<4&&DEMO.reg[k]!==DEMO.reg[k+5]){ c.moveTo(x,y+cs); c.lineTo(x+cs,y+cs); } }
  c.stroke();
  for(let r=0;r<5;r++) if(r<shown) drawCat(c,x0+DEMO.sol[r]*cs+cs/2,y0+r*cs+cs/2,cs,L.cat,t,shown>=5?1:0,r);
  const cx=x0+s+(w-x0-s)/2;
  drawCat(c,cx,h*.42,h*.42,L.cat,t,Math.floor(t)%5===0?1:0,9);
  c.textAlign='center'; c.textBaseline='middle'; c.font='900 '+h*.11+'px "Noto Sans TC",sans-serif'; c.lineWidth=5; c.strokeStyle='#14122b'; c.strokeText('貓咪數獨',cx,h*.8); c.fillStyle='#ffd23f'; c.fillText('貓咪數獨',cx,h*.8);
}
const thumb=(c,w,h,t)=>demo(c,w,h,t,{cat:'orange',theme:'soft'});
const preview=(c,w,h,L,t)=>demo(c,w,h,t,L);

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).meow={
  name:'貓咪數獨',tag:'MEOW PUZZLE',color:'#ffb347',
  desc:'把貓咪放進格子裡：每一列、每一行、每一個顏色區塊都剛好一隻貓，而且貓和貓不能碰在一起（斜的也不行）。共 50 關，從 5×5 到 9×9。',
  goal:'點一下格子打叉，表示這格不可能有貓；再點一下放貓，點貓可以拿掉。按住拖曳可以連續打叉。放錯貓會吃掉一條小魚乾，三條吃完就失敗。每關有 3 次提示。',
  stages:Array.from({length:LEVELS},(_,i)=>sizeOf(i)+'×'+sizeOf(i)),stars:Array.from({length:LEVELS},(_,i)=>sizeOf(i)-4),
  stageBest:i=>{ const v=getRec(i); return v==null?'':'✓ '+fmt(v); },
  hubBest:()=>{ const n=cleared(); return n?'已過關 <b>'+n+' / '+LEVELS+'</b>':'尚無紀錄'; },
  help:[['點一下','打叉（再點一下放貓，點貓拿掉）'],['按住拖曳','連續打叉或清除叉叉'],['↑ ↓ ← →','移動黃色框'],['空白鍵','打叉／清除'],['Enter','放貓／拿掉貓'],['H','提示（每關 3 次）'],['Z','復原']],
  touchHelp:[['點一下','打叉，再點一下放貓，點貓拿掉'],['按住拖曳','連續打叉或清除叉叉'],['提示','直接放一隻正確的貓（每關 3 次）'],['復原／重來','退一步／整盤清空']],
  touch:null,
  looks:[{key:'cat',label:'貓咪',opts:[{id:'orange',label:'橘貓'},{id:'black',label:'黑貓'},{id:'white',label:'白貓'},{id:'calico',label:'三花貓'},{id:'gray',label:'灰虎斑'}]},
    {key:'theme',label:'色系',opts:[{id:'soft',label:'粉彩'},{id:'vivid',label:'繽紛'},{id:'forest',label:'森林'}]}],
  best:{label:'已過關',fmt:v=>v+' / '+LEVELS+' 關',lower:false},
  preview,thumb,create,_gen:genLevel
};
})();
