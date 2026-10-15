// 貓咪數獨：玩法和畫面參考 Meowdoku（Oakever Games）。N×N 的格子分成 N 個顏色區塊，
// 每一列、每一行、每一個顏色區塊都剛好放一隻貓，而且貓和貓不能相鄰（斜的也不行）。
// 關卡用固定的亂數種子產生，產生後確認只有唯一解；放錯貓會扣一顆愛心，三顆用完就失敗。
(function(){
'use strict';
const W=540,H=900,BX=20,BY=222,BS=500;
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

/* ---- 顏色與貓（畫面參考 Meowdoku：米白底、圓角色塊、白色叉叉、賓士貓） ---- */
const PALETTE={
  classic:['#f37ea0','#ffc845','#8ec5ea','#b9b7ea','#45cfc3','#a9693f','#df4f8b','#ffa1e2','#9ed58e'],
  candy:['#ff8fab','#ffd166','#7ec8ff','#c3a6ff','#5ee0c8','#ff9f68','#ef6fb0','#ffc4ec','#a6e3a1'],
  forest:['#d98b6a','#e8c56a','#7fb3c9','#a8a0cf','#6fbf9f','#8c6a48','#c2627e','#e6a8c8','#9cc47e']
};
const CATS={
  tuxedo:{body:'#2c2a31',patch:'#ffffff',ear:'#f0a0b4',eyeIris:'#c9d96a'},
  orange:{body:'#f2a03d',patch:'#fff6ea',ear:'#ffb8a8',eyeIris:'#8fc27a',stripe:'#d9802a'},
  gray:{body:'#8e95a6',patch:'#f4f5f8',ear:'#f0b4c0',eyeIris:'#7fd4e6',stripe:'#6f7688'},
  white:{body:'#fbf8f3',patch:'#ffffff',ear:'#ffc0cc',eyeIris:'#7ab8f0',line:1},
  calico:{body:'#fbf8f3',patch:'#ffffff',ear:'#ffc0cc',eyeIris:'#d9b24a',calico:1,line:1}
};
// 貓頭：s 是格子大小；mood 0 平常、1 開心、2 驚嚇
function drawCat(c,x,y,s,kind,t,mood,seed){
  const K=CATS[kind]||CATS.tuxedo,r=s*.38,lw=Math.max(1,s*.02); seed=seed||0;
  c.save(); c.translate(x,y+r*.1); c.lineJoin='round'; c.lineCap='round';
  const ol=K.line?'#b8aca0':'rgba(0,0,0,0)';
  // 耳朵
  for(const sd of [-1,1]){ c.fillStyle=K.calico&&sd<0?'#f2a03d':K.calico?'#2c2a31':K.body; c.strokeStyle=ol; c.lineWidth=lw;
    c.beginPath(); c.moveTo(sd*r*1.02,-r*.2); c.quadraticCurveTo(sd*r*1.05,-r*1.0,sd*r*.82,-r*1.12); c.quadraticCurveTo(sd*r*.5,-r*.95,sd*r*.25,-r*.72); c.closePath(); c.fill(); c.stroke();
    c.fillStyle=K.ear; c.beginPath(); c.moveTo(sd*r*.86,-r*.36); c.quadraticCurveTo(sd*r*.9,-r*.86,sd*r*.78,-r*.94); c.quadraticCurveTo(sd*r*.55,-r*.8,sd*r*.4,-r*.66); c.closePath(); c.fill(); }
  // 頭
  c.fillStyle=K.body; c.beginPath(); c.ellipse(0,0,r*1.12,r*.95,0,0,7); c.fill(); if(K.line){ c.strokeStyle=ol; c.lineWidth=lw; c.stroke(); }
  c.save(); c.beginPath(); c.ellipse(0,0,r*1.12,r*.95,0,0,7); c.clip();
  if(K.calico){ c.fillStyle='#f2a03d'; c.beginPath(); c.ellipse(-r*.75,-r*.5,r*.62,r*.55,.3,0,7); c.fill(); c.fillStyle='#2c2a31'; c.beginPath(); c.ellipse(r*.8,-r*.45,r*.55,r*.48,-.3,0,7); c.fill(); }
  if(K.stripe){ c.strokeStyle=K.stripe; c.lineWidth=r*.09; for(const dx of [-.25,0,.25]){ c.beginPath(); c.moveTo(dx*r,-r*.98); c.lineTo(dx*r*.7,-r*.6); c.stroke(); } }
  // 白色口鼻和額頭的白線（賓士貓）
  c.fillStyle=K.patch; c.beginPath(); c.moveTo(0,-r*.55); c.quadraticCurveTo(r*.22,-r*.1,r*.62,r*.2); c.quadraticCurveTo(r*.66,r*.95,0,r*1); c.quadraticCurveTo(-r*.66,r*.95,-r*.62,r*.2); c.quadraticCurveTo(-r*.22,-r*.1,0,-r*.55); c.fill();
  c.restore();
  // 眼睛：大大圓圓的
  const blink=mood===0&&((t*.6+seed*.37)%5)<.13;
  for(const sd of [-1,1]){ const ex=sd*r*.42,ey=-r*.08;
    if(blink||mood===1){ c.strokeStyle='#2c2a31'; c.lineWidth=r*.08; c.beginPath(); if(mood===1) c.arc(ex,ey+r*.05,r*.15,Math.PI*1.1,Math.PI*1.9); else { c.moveTo(ex-r*.17,ey); c.lineTo(ex+r*.17,ey); } c.stroke(); continue; }
    c.fillStyle='#fff'; c.beginPath(); c.arc(ex,ey,r*.25,0,7); c.fill(); c.strokeStyle=kind==='tuxedo'?'rgba(0,0,0,0)':'#3a3440'; c.lineWidth=lw; c.stroke();
    c.fillStyle=K.eyeIris; c.beginPath(); c.arc(ex+sd*r*.02,ey+r*.03,r*(mood===2?.13:.18),0,7); c.fill();
    c.fillStyle='#1a1820'; c.beginPath(); c.arc(ex+sd*r*.02,ey+r*.03,r*(mood===2?.07:.12),0,7); c.fill();
    c.fillStyle='#fff'; c.beginPath(); c.arc(ex-r*.05,ey-r*.07,r*.06,0,7); c.fill(); }
  // 鼻子、嘴、鬍鬚
  c.fillStyle='#f4899e'; c.beginPath(); c.moveTo(-r*.1,r*.24); c.quadraticCurveTo(0,r*.2,r*.1,r*.24); c.lineTo(0,r*.34); c.closePath(); c.fill();
  c.strokeStyle='#4a3a40'; c.lineWidth=Math.max(1,r*.05); c.beginPath(); c.moveTo(0,r*.34); c.quadraticCurveTo(-r*.07,r*.46,-r*.17,r*.4); c.moveTo(0,r*.34); c.quadraticCurveTo(r*.07,r*.46,r*.17,r*.4); c.stroke();
  if(mood===2){ c.fillStyle='#8a2a3a'; c.beginPath(); c.ellipse(0,r*.55,r*.08,r*.1,0,0,7); c.fill(); }
  c.strokeStyle='rgba(150,140,140,.55)'; c.lineWidth=Math.max(.7,r*.025);
  for(const sd of [-1,1]) for(const dy of [-.03,.1]){ c.beginPath(); c.moveTo(sd*r*.5,r*(.3+dy)); c.lineTo(sd*r*1.15,r*(.24+dy*2)); c.stroke(); }
  c.restore();
}
function rrect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function heart(c,x,y,s,on){ c.save(); c.translate(x,y); c.scale(s/20,s/20); c.fillStyle=on?'#ec2f45':'#d9cfc8'; c.beginPath(); c.moveTo(0,7); c.bezierCurveTo(-12,-1,-9,-11,0,-5); c.bezierCurveTo(9,-11,12,-1,0,7); c.fill(); c.restore(); }
function wave(c,w,y,h,t){ // 下方的藍色波浪、貓咪剪影和腳印
  c.fillStyle='#8fd0f5'; c.beginPath(); c.moveTo(0,y+h*.35); c.quadraticCurveTo(w*.5,y-h*.05,w,y+h*.35); c.lineTo(w,y+h); c.lineTo(0,y+h); c.closePath(); c.fill();
  c.fillStyle='#8fd0f5'; const cx=w/2,cy=y+h*.3; c.beginPath(); c.ellipse(cx,cy,h*.34,h*.28,0,0,7); c.fill();
  for(const sd of [-1,1]){ c.beginPath(); c.moveTo(cx+sd*h*.3,cy-h*.08); c.lineTo(cx+sd*h*.28,cy-h*.4); c.lineTo(cx+sd*h*.06,cy-h*.24); c.closePath(); c.fill(); }
  c.fillStyle='rgba(255,255,255,.35)'; for(let i=0;i<9;i++){ const px=(i*97+30)%w,py=y+h*.55+((i*37)%(h*.4)); c.beginPath(); c.arc(px,py,5,0,7); c.fill(); for(const [dx,dy] of [[-5,-6],[-1.5,-8.5],[2.5,-8.5],[6,-6]]){ c.beginPath(); c.arc(px+dx,py+dy,2,0,7); c.fill(); } }
}

/* ---- 紀錄：每一關最快時間 ---- */
const recKey=i=>'arcade.meow.t.'+i,getRec=i=>{ try{ const v=parseFloat(localStorage.getItem(recKey(i))); return isFinite(v)?v:null; }catch(e){ return null; } };
const cleared=()=>{ let n=0; for(let i=0;i<LEVELS;i++) if(getRec(i)!=null) n++; return n; };
const autoKey='arcade.meow.auto',getAuto=()=>{ try{ return localStorage.getItem(autoKey)!=='0'; }catch(e){ return true; } };

function create(env,opts){
  const L=opts.look||{cat:'tuxedo',theme:'classic'};
  let lv=clamp(opts.stage||0,0,LEVELS-1); while(lv>0&&getRec(lv-1)==null) lv--; // 還沒解鎖的關卡就退回最新可以玩的那關
  const P=genLevel(lv),N=P.N;
  const GAP=Math.max(4,BS*.016),CS=(BS-GAP*(N+1))/N; // 每格是一塊獨立的圓角色塊
  const pal=PALETTE[L.theme]||PALETTE.classic,regCol=g=>pal[P.colors[g]%pal.length];
  const {ctx:c,canvas}=env.canvas2d(W,H);
  const st=new Array(N*N).fill(0); // 0 空、1 叉叉、2 貓、3 自動叉叉
  let lives=LIVES,hints=HINTS,mistakes=0,t=0,ended=false,winT=-1,cur=-1,shake=0,hist=[],auto=getAuto(),ruleHi=-1,ruleT=0;
  const pop=new Array(N*N).fill(0),wrong=new Array(N*N).fill(0),hintK=new Set(),fx=[],glow=[];
  const RC=k=>[k/N|0,k%N];
  const cellX=k=>BX+GAP+(k%N)*(CS+GAP),cellY=k=>BY+GAP+(k/N|0)*(CS+GAP);
  const cellXY=k=>[cellX(k)+CS/2,cellY(k)+CS/2];
  // 開局送一隻：只有一格的顏色區塊，貓一定在那裡
  for(let g=0;g<N;g++){ const ks=[]; for(let k=0;k<N*N;k++) if(P.reg[k]===g) ks.push(k); if(ks.length===1){ st[ks[0]]=2; break; } }
  const sees=(a,b)=>{ const [r,cc]=RC(a),[r2,c2]=RC(b); return r2===r||c2===cc||P.reg[a]===P.reg[b]||Math.abs(r2-r)<=1&&Math.abs(c2-cc)<=1; };
  function refreshAuto(){ for(let k=0;k<N*N;k++) if(st[k]===3) st[k]=0;
    if(auto) for(let k=0;k<N*N;k++) if(st[k]===2) for(let j=0;j<N*N;j++) if(j!==k&&st[j]===0&&sees(k,j)) st[j]=3; }
  refreshAuto();
  const catCount=()=>st.filter(v=>v===2).length;
  let grp=null; // 一次拖曳算一步
  function setCell(k,v){ if(st[k]===v) return; if(grp) grp.push([k,st[k]]); else hist.push([[k,st[k]]]); st[k]=v; }
  function tryCat(k){
    if(ended||st[k]===2) return; const [r,cc]=RC(k);
    if(P.sol[r]===cc){ hist.push([[k,st[k]]]); st[k]=2; pop[k]=1; hintK.delete(k); refreshAuto(); env.sfx('item');
      const reg=[]; for(let j=0;j<N*N;j++) if(P.reg[j]===P.reg[k]) reg.push(j); glow.push({cells:reg,t:0},{row:r,t:0},{col:cc,t:0}); // 這隻貓管到的列、行、顏色亮一下
      if(catCount()===N) win(); }
    else { // 放錯：看違反哪一條規則，就把那條規則亮起來
      ruleHi=2; for(let j=0;j<N*N;j++) if(st[j]===2){ const [r2,c2]=RC(j); if(P.reg[j]===P.reg[k]){ ruleHi=0; break; } if(r2===r||c2===cc) ruleHi=1; else if(Math.abs(r2-r)<=1&&Math.abs(c2-cc)<=1&&ruleHi!==1) ruleHi=2; }
      ruleT=1.6; lives--; mistakes++; wrong[k]=1; shake=.35; st[k]=1; env.sfx('hurt'); if(lives<=0) lose(); }
  }
  function hint(){ // 提示：在一定有貓的格子上打個問號（不直接放貓）
    if(ended||hints<=0) return;
    let best=-1,bn=1e9; for(let g=0;g<N;g++){ let has=false,n=0; for(let k=0;k<N*N;k++) if(P.reg[k]===g){ if(st[k]===2) has=true; else if(st[k]===0) n++; } if(!has&&n<bn&&![...hintK].some(k=>P.reg[k]===g)){ bn=n; best=g; } }
    if(best<0) return; for(let r=0;r<N;r++) if(P.reg[r*N+P.sol[r]]===best){ const k=r*N+P.sol[r]; hintK.add(k); if(st[k]===1||st[k]===3) st[k]=0; }
    hints--; env.sfx('beep');
  }
  function undo(){ if(ended) return; const h=hist.pop(); if(!h) return; for(let i=h.length-1;i>=0;i--) st[h[i][0]]=h[i][1]; refreshAuto(); env.sfx('click'); }
  function restart(){ if(ended) return; for(let k=0;k<N*N;k++) if(st[k]!==2||k!==giftK) st[k]=0; hist=[]; hintK.clear(); refreshAuto(); env.sfx('click'); }
  const giftK=st.indexOf(2);
  function toggleAuto(){ auto=!auto; try{ localStorage.setItem(autoKey,auto?'1':'0'); }catch(e){} refreshAuto(); env.sfx('click'); }
  function win(){ ended=true; winT=0; const time=t,old=getRec(lv); let rec=false;
    if(old==null||time<old){ rec=true; try{ localStorage.setItem(recKey(lv),String(time)); }catch(e){} }
    env.sfx('win');
    setTimeout(()=>env.end({title:'找到所有貓咪了！',big:fmt(time),text:'關卡 '+(lv+1)+'（'+N+'×'+N+'）完成，錯了 '+mistakes+' 次、用了 '+(HINTS-hints)+' 次提示。'+(rec?'這關的新紀錄！':'這關最快 '+fmt(old)),score:cleared(),next:lv<LEVELS-1}),2000); }
  function lose(){ ended=true; env.sfx('lose'); setTimeout(()=>env.end({title:'愛心用完了',big:'',text:'放錯 3 次貓了。先用叉叉把不可能的格子排除，確定了再點兩下放貓！',score:null}),900); }

  /* ---- 操作：點一下打叉／取消，點兩下放貓，點貓拿掉；按住拖曳可以連續打叉 ---- */
  const BTN=[{id:'undo',label:'復原'},{id:'hint',label:'提示'},{id:'auto',label:'自動'},{id:'reset',label:'重來'}];
  BTN.forEach((b,i)=>{ b.w=112; b.x=W/2-(4*b.w+3*12)/2+i*(b.w+12); b.y=BY+BS+16; b.h=46; });
  function toLogical(e){ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=(r.width-W*s)/2,oy=(r.height-H*s)/2; return [(e.clientX-r.left-ox)/s,(e.clientY-r.top-oy)/s]; }
  const cellAt=(x,y)=>{ const cc=Math.floor((x-BX-GAP/2)/(CS+GAP)),r=Math.floor((y-BY-GAP/2)/(CS+GAP)); return r>=0&&r<N&&cc>=0&&cc<N?r*N+cc:-1; };
  let drag=null,lastTap={k:-1,t:-9};
  function onDown(e){ e.preventDefault(); const [x,y]=toLogical(e);
    for(const b of BTN) if(x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h){ ({undo,hint,auto:toggleAuto,reset:restart})[b.id](); return; }
    const k=cellAt(x,y); if(k<0||ended) return; cur=k;
    try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
    // 點一下打叉／取消叉叉，點兩下放貓（兩下間隔 0.45 秒內），點貓拿掉
    const now=performance.now()/1000,dbl=lastTap.k===k&&now-lastTap.t<.45; lastTap={k,t:now};
    if(dbl&&st[k]!==2){ lastTap.k=-1; drag=null; grp=null;
      const h=hist[hist.length-1]; if(h&&h.length===1&&h[0][0]===k){ hist.pop(); st[k]=h[0][1]; } // 第一下打的叉叉不算，直接放貓
      tryCat(k); return; }
    if(st[k]===2){ if(k===giftK) return; setCell(k,0); refreshAuto(); env.sfx('click'); drag=null; return; }
    grp=[];
    if(st[k]===1){ setCell(k,0); drag={mode:'clear',last:k}; } else { setCell(k,1); drag={mode:'x',last:k}; }
    env.sfx('click');
  }
  function onMove(e){ if(!drag) return; const [x,y]=toLogical(e),k=cellAt(x,y); if(k<0||k===drag.last) return; drag.last=k; lastTap.k=-1;
    if(drag.mode==='x'&&(st[k]===0||st[k]===3)) setCell(k,1); else if(drag.mode==='clear'&&st[k]===1) setCell(k,0); }
  function onUp(){ const g=grp; grp=null; if(g&&g.length) hist.push(g); drag=null; }
  canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointermove',onMove); canvas.addEventListener('pointerup',onUp); canvas.addEventListener('pointercancel',onUp);
  canvas.style.touchAction='none';

  function update(dt){
    if(!ended) t+=dt; else if(winT>=0) winT+=dt;
    // 鍵盤：方向鍵移動、空白鍵打叉、Enter 放貓、H 提示、Z 復原、A 自動打叉
    const K=env.hit; let mv=null;
    if(K('ArrowUp')||K('KeyW')) mv=[-1,0]; else if(K('ArrowDown')||K('KeyS')) mv=[1,0]; else if(K('ArrowLeft')) mv=[0,-1]; else if(K('ArrowRight')||K('KeyD')) mv=[0,1];
    if(mv){ if(cur<0) cur=0; else { const [r,cc]=RC(cur); cur=clamp(r+mv[0],0,N-1)*N+clamp(cc+mv[1],0,N-1); } }
    if(!ended&&cur>=0){
      if(K('Space')||K('KeyJ')){ if(st[cur]===0||st[cur]===3) setCell(cur,1); else if(st[cur]===1) setCell(cur,0); env.sfx('click'); }
      if(K('Enter')||K('KeyK')){ if(st[cur]===2){ if(cur!==giftK){ setCell(cur,0); refreshAuto(); } } else tryCat(cur); } }
    if(K('KeyH')) hint(); if(K('KeyZ')) undo(); if(K('KeyA')) toggleAuto();
    for(let k=0;k<N*N;k++){ if(pop[k]>0) pop[k]=Math.max(0,pop[k]-dt*3); if(wrong[k]>0) wrong[k]=Math.max(0,wrong[k]-dt*1.4); }
    for(let i=glow.length-1;i>=0;i--){ glow[i].t+=dt; if(glow[i].t>.9) glow.splice(i,1); }
    if(shake>0) shake=Math.max(0,shake-dt); if(ruleT>0) ruleT-=dt;
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.life-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=200*dt; if(f.life<=0) fx.splice(i,1); }
    if(winT>=0&&winT<1.6&&Math.random()<dt*24) fx.push({x:Math.random()*W,y:-10,vx:(Math.random()-.5)*60,vy:90+Math.random()*120,life:2.4,col:['#ffc845','#f37ea0','#8ec5ea','#9ed58e','#b9b7ea'][Math.random()*5|0]});
  }

  function draw(){
    c.fillStyle='#f6f0e9'; c.fillRect(0,0,W,H);
    c.textBaseline='middle'; c.textAlign='center';
    // 標題、時間
    c.fillStyle='#8a5a58'; c.font='900 34px '+TC; c.fillText('關卡 '+(lv+1),W/2,48);
    c.fillStyle='#b59a90'; c.font='700 15px '+TC; c.textAlign='left'; c.fillText(N+'×'+N,26,48); c.textAlign='right'; c.fillText(fmt(t),W-26,48);
    // 貓咪數、愛心
    c.fillStyle='#fff'; rrect(c,W/2-150,82,128,44,22); c.fill(); rrect(c,W/2+10,82,128,44,22); c.fill();
    drawCat(c,W/2-122,104,34,L.cat,t,0,99); c.textAlign='left'; c.font='900 22px '+TC; const cn=catCount(); c.fillStyle='#3aa64a'; c.fillText(String(cn),W/2-98,105); c.fillStyle='#8a5a58'; c.fillText('/'+N,W/2-98+c.measureText(String(cn)).width,105);
    for(let i=0;i<LIVES;i++) heart(c,W/2+42+i*32,105,30,i<lives);
    // 三條規則
    c.fillStyle='#fff'; rrect(c,22,142,W-44,58,14); c.fill();
    ['每種顏色1隻','每行每列各1隻','貓咪不能相鄰'].forEach((s,i)=>{ const w=(W-44-24)/3,x=30+i*(w+4),on=ruleT>0&&ruleHi===i;
      c.fillStyle=on?'#ffe1e1':'#f6efe9'; rrect(c,x,149,w,44,10); c.fill(); if(on){ c.strokeStyle='#d0505a'; c.lineWidth=2.5; c.stroke(); }
      c.textAlign='center'; c.fillStyle=on?'#c0303a':'#8a5a58'; c.font='700 16px '+TC; c.fillText(s,x+w/2,171); });
    c.textAlign='center'; c.fillStyle='#b59a90'; c.font='700 14px '+TC; c.fillText('點一下打 ✕，點兩下放貓，點貓可以拿掉',W/2,211);
    // 盤面
    const sx=shake>0?Math.sin(shake*60)*6*shake/.35:0; c.save(); c.translate(sx,0);
    c.fillStyle='#fff'; c.shadowColor='rgba(120,90,70,.15)'; c.shadowBlur=14; rrect(c,BX,BY,BS,BS,14); c.fill(); c.shadowBlur=0;
    const lit=new Set(); for(const g of glow){ for(let k=0;k<N*N;k++){ const [r,cc]=RC(k); if(g.cells?g.cells.includes(k):g.row!=null?r===g.row:cc===g.col) lit.add(k); } }
    const rad=Math.max(4,CS*.12);
    for(let k=0;k<N*N;k++){ const x=cellX(k),y=cellY(k);
      c.fillStyle=regCol(P.reg[k]); rrect(c,x,y,CS,CS,rad); c.fill();
      if(winT<0&&glow.length&&!lit.has(k)){ c.fillStyle='rgba(60,40,40,.28)'; rrect(c,x,y,CS,CS,rad); c.fill(); } // 放貓那一下，沒被管到的格子暗一點
      if(lit.has(k)){ c.strokeStyle='rgba(255,236,120,.95)'; c.lineWidth=3; rrect(c,x+1,y+1,CS-2,CS-2,rad); c.stroke(); } }
    for(let k=0;k<N*N;k++){ const [x,y]=cellXY(k);
      if(st[k]===1||st[k]===3){ const a=CS*.22,red=wrong[k]>0; c.strokeStyle=red?'#e23b3b':st[k]===3?'rgba(255,255,255,.8)':'#fff'; c.lineWidth=Math.max(3,CS*.1); c.lineCap='round';
        c.beginPath(); c.moveTo(x-a,y-a); c.lineTo(x+a,y+a); c.moveTo(x+a,y-a); c.lineTo(x-a,y+a); c.stroke(); }
      if(hintK.has(k)&&st[k]!==2){ c.fillStyle='#fff'; c.font='900 '+Math.round(CS*.55)+'px '+TC; c.textAlign='center'; c.globalAlpha=.7+.3*Math.sin(t*5); c.fillText('?',x,y+CS*.03); c.globalAlpha=1; }
      if(st[k]===2){ let s=1+Math.sin(pop[k]*Math.PI)*.22;
        if(winT>=0){ // 過關：每隻貓都發光
          const g2=c.createRadialGradient(x,y,CS*.1,x,y,CS*.62); g2.addColorStop(0,'rgba(255,240,120,.95)'); g2.addColorStop(1,'rgba(255,240,120,0)'); c.fillStyle=g2; c.beginPath(); c.arc(x,y,CS*.62,0,7); c.fill();
          c.strokeStyle='rgba(255,230,90,.9)'; c.lineWidth=2; for(let i=0;i<12;i++){ const a=i/12*6.283+winT; c.beginPath(); c.moveTo(x+Math.cos(a)*CS*.42,y+Math.sin(a)*CS*.42); c.lineTo(x+Math.cos(a)*CS*.58,y+Math.sin(a)*CS*.58); c.stroke(); }
          s*=1+Math.sin(winT*6+k)*.04; }
        c.save(); c.translate(x,y); c.scale(s,s); drawCat(c,0,0,CS,L.cat,t,winT>=0?1:0,k); c.restore(); }
      if(wrong[k]>0){ c.save(); c.globalAlpha=Math.min(1,wrong[k]*1.5); drawCat(c,x,y-CS*.12*(1-wrong[k]),CS*.9,L.cat,t,2,k); c.restore(); } }
    if(cur>=0&&!ended){ c.strokeStyle='#8a5a58'; c.lineWidth=3; rrect(c,cellX(cur)-2,cellY(cur)-2,CS+4,CS+4,rad+2); c.stroke(); }
    c.restore();
    // 按鈕
    for(const b of BTN){ const dis=ended||b.id==='hint'&&hints<=0||b.id==='undo'&&!hist.length,on=b.id==='auto'&&auto;
      c.fillStyle=on?'#8a5a58':'#fff'; rrect(c,b.x,b.y,b.w,b.h,23); c.fill(); c.strokeStyle='#e6d8cf'; c.lineWidth=2; c.stroke();
      c.textAlign='center'; c.fillStyle=dis?'#cbbab2':on?'#fff':'#8a5a58'; c.font='900 17px '+TC; c.fillText(b.label+(b.id==='hint'?' '+hints:''),b.x+b.w/2,b.y+b.h/2+1); }
    wave(c,W,H-92,92,t);
    for(const f of fx){ c.globalAlpha=Math.max(0,Math.min(1,f.life)); c.fillStyle=f.col; c.fillRect(f.x-3,f.y-3,6,6); } c.globalAlpha=1;
    if(winT>=0){ const a=Math.min(1,winT*2.5); c.globalAlpha=a; c.textAlign='center'; c.font='900 44px '+TC; c.lineWidth=8; c.strokeStyle='#fff'; c.strokeText('找到所有貓咪了！',W/2,H-60); c.fillStyle='#8a5a58'; c.fillText('找到所有貓咪了！',W/2,H-60); c.globalAlpha=1; }
  }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('pointermove',onMove); canvas.removeEventListener('pointerup',onUp); canvas.removeEventListener('pointercancel',onUp); },
    _dbg:{P,st,tryCat,hint,get lives(){return lives;}}};
}

/* ---- 大廳縮圖與造型預覽 ---- */
const DEMO={N:5,reg:[0,0,1,1,1,0,2,2,1,3,0,2,4,4,3,0,2,4,3,3,2,2,4,4,3],sol:[0,3,1,4,2]};
function demo(c,w,h,t,L){
  c.fillStyle='#f6f0e9'; c.fillRect(0,0,w,h);
  const pal=PALETTE[L.theme]||PALETTE.classic,s=h*.8,gp=s*.02,cs=(s-gp*6)/5,x0=w*.07,y0=(h-s)/2,shown=Math.floor((t*1.2)%7);
  c.fillStyle='#fff'; rrect(c,x0,y0,s,s,10); c.fill();
  for(let k=0;k<25;k++){ const r=k/5|0,cc=k%5,x=x0+gp+cc*(cs+gp),y=y0+gp+r*(cs+gp); c.fillStyle=pal[DEMO.reg[k]]; rrect(c,x,y,cs,cs,5); c.fill();
    if(r<shown&&DEMO.sol[r]===cc) drawCat(c,x+cs/2,y+cs/2,cs,L.cat,t,shown>=5?1:0,r);
    else if(shown>=5){ c.strokeStyle='#fff'; c.lineWidth=3; c.lineCap='round'; const a=cs*.2; c.beginPath(); c.moveTo(x+cs/2-a,y+cs/2-a); c.lineTo(x+cs/2+a,y+cs/2+a); c.moveTo(x+cs/2+a,y+cs/2-a); c.lineTo(x+cs/2-a,y+cs/2+a); c.stroke(); } }
  const cx=x0+s+(w-x0-s)/2;
  drawCat(c,cx,h*.4,h*.42,L.cat,t,Math.floor(t)%5===0?1:0,9);
  c.textAlign='center'; c.textBaseline='middle'; c.font='900 '+h*.12+'px "Noto Sans TC",sans-serif'; c.fillStyle='#8a5a58'; c.fillText('貓咪數獨',cx,h*.78);
}
const thumb=(c,w,h,t)=>demo(c,w,h,t,{cat:'tuxedo',theme:'classic'});
const preview=(c,w,h,L,t)=>demo(c,w,h,t,L);

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).meow={
  name:'貓咪數獨',tag:'MEOW PUZZLE',color:'#ffc845',
  desc:'為每隻高冷的小貓找到專屬領地：每種顏色、每一行、每一列都剛好一隻貓，而且貓咪不能相鄰，連斜角都不行。不用算數，全靠邏輯推理。共 50 關，從 5×5 到 9×9，過了一關才會解鎖下一關。',
  goal:'點一下格子打叉（再點一下取消），點兩下放貓，點貓可以拿掉；按住拖曳可以連續打叉。放錯貓會失去一顆愛心，3 顆用完就失敗。「自動」會幫你把放好的貓管到的格子打叉，「提示」會在一定有貓的格子打上問號（每關 3 次）。',
  stages:Array.from({length:LEVELS},(_,i)=>sizeOf(i)+'×'+sizeOf(i)),stars:Array.from({length:LEVELS},(_,i)=>sizeOf(i)-4),
  stageBest:i=>{ const v=getRec(i); return v==null?'':'✓ '+fmt(v); },
  stageLocked:i=>i>0&&getRec(i-1)==null, // 過了前一關才解鎖下一關
  hubBest:()=>{ const n=cleared(); return n?'已過關 <b>'+n+' / '+LEVELS+'</b>':'尚無紀錄'; },
  help:[['點一下','打叉，再點一下取消'],['點兩下','放貓'],['點貓','拿掉貓'],['按住拖曳','連續打叉或清除叉叉'],['↑ ↓ ← →','移動選取框'],['空白鍵','打叉／取消叉叉'],['Enter','放貓'],['H','提示'],['A','自動打叉開關'],['Z','復原']],
  touchHelp:[['點一下','打叉，再點一下取消'],['點兩下','放貓'],['點貓','拿掉貓'],['按住拖曳','連續打叉或清除叉叉'],['自動','放好貓後自動把不可能的格子打叉'],['提示','在一定有貓的格子打問號（每關 3 次）']],
  touch:null,
  looks:[{key:'cat',label:'貓咪',opts:[{id:'tuxedo',label:'賓士貓'},{id:'orange',label:'橘貓'},{id:'gray',label:'灰虎斑'},{id:'white',label:'白貓'},{id:'calico',label:'三花貓'}]},
    {key:'theme',label:'色系',opts:[{id:'classic',label:'經典'},{id:'candy',label:'糖果'},{id:'forest',label:'森林'}]}],
  best:{label:'已過關',fmt:v=>v+' / '+LEVELS+' 關',lower:false},
  preview,thumb,create,_gen:genLevel
};
})();
