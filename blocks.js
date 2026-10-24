// 方塊疊疊樂：掉落方塊消行。30 關（六個世界各 5 關，每關消掉指定行數就過關，越後面越快、底下先有垃圾行），
// 雙人同機或連線對戰（一次消 2 行以上把垃圾行丟給對方，先堆到頂的輸）。
(function(){
'use strict';
const W=800,H=500,COLS=10,ROWS=20,CS=22,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PIX='"Press Start 2P","Noto Sans TC",monospace';
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rng(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

/* ---------- 方塊 ---------- */
const KINDS='IOTSZJL';
const MAT={I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],O:[[1,1],[1,1]],T:[[0,1,0],[1,1,1],[0,0,0]],S:[[0,1,1],[1,1,0],[0,0,0]],Z:[[1,1,0],[0,1,1],[0,0,0]],J:[[1,0,0],[1,1,1],[0,0,0]],L:[[0,0,1],[1,1,1],[0,0,0]]};
const COL=[null,'#4fd6ff','#ffd23f','#b77bff','#6fe07a','#ff6b7d','#5a8cff','#ffa04d','#9aa0b8']; // 1～7 對應 IOTSZJL，8 是垃圾行
const rot=m=>m[0].map((_,i)=>m.map(r=>r[i]).reverse());
const KICKS=[[0,0],[-1,0],[1,0],[0,-1],[-2,0],[2,0],[-1,-1],[1,-1]];

/* ---------- 世界與關卡 ---------- */
const WORLDS=[
  {name:'糖果王國',sky:['#ffb3d9','#ffe6f2'],frame:'#ff7eb6'},
  {name:'蘑菇森林',sky:['#7fd18a','#d8f5c8'],frame:'#4f9a3a'},
  {name:'珊瑚海底',sky:['#1f6fb0','#5ec8ff'],frame:'#2fb6d8'},
  {name:'沙漠金字塔',sky:['#ff9a4d','#ffe0a0'],frame:'#d9a520'},
  {name:'雪山小屋',sky:['#9fc8ff','#eef6ff'],frame:'#7aa8e8'},
  {name:'星空太空站',sky:['#0b0a2e','#2b1f5e'],frame:'#9a7aff'}];
const STAGES=Array.from({length:30},(_,i)=>{ const w=Math.floor(i/5),k=i%5;
  return {w,name:WORLDS[w].name+' '+(k+1),lines:8+w*2+k*2,fall:.8*Math.pow(.915,i),junk:k>=3?2+w+(k-3)*2:0}; });
const recKey=i=>'arcade.blocks.s'+i,getRec=i=>{ try{ const v=localStorage.getItem(recKey(i)); return v==null?null:+v; }catch(e){ return null; } };

/* ---------- 畫方塊（先畫成小圖存起來） ---------- */
const cellCache={};
function cellImg(ci,s,skin){ const key=ci+'|'+s+'|'+skin; if(cellCache[key]) return cellCache[key];
  const cv=document.createElement('canvas'),S=2; cv.width=cv.height=Math.ceil(s*S); const c=cv.getContext('2d'); c.scale(S,S); const col=COL[ci];
  drawCellTo(c,0,0,s,col,skin); cellCache[key]=cv; return cv; }
function shade(hex,k){ const n=parseInt(hex.slice(1),16); let r=n>>16&255,g=n>>8&255,b=n&255; if(k>1){ r+= (255-r)*(k-1); g+=(255-g)*(k-1); b+=(255-b)*(k-1); } else { r*=k; g*=k; b*=k; } return 'rgb('+[r,g,b].map(v=>Math.round(clamp(v,0,255))).join(',')+')'; }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function drawCellTo(c,x,y,s,col,skin){
  if(skin==='pixel'){ c.fillStyle=col; c.fillRect(x,y,s,s); c.fillStyle=shade(col,1.45); c.fillRect(x,y,s,s*.16); c.fillRect(x,y,s*.16,s); c.fillStyle=shade(col,.6); c.fillRect(x,y+s*.84,s,s*.16); c.fillRect(x+s*.84,y,s*.16,s); return; }
  if(skin==='gem'){ const m=s*.24; c.fillStyle=shade(col,.62); c.fillRect(x,y,s,s); c.fillStyle=shade(col,1.35); c.beginPath(); c.moveTo(x,y); c.lineTo(x+s,y); c.lineTo(x+s-m,y+m); c.lineTo(x+m,y+m); c.closePath(); c.fill();
    c.fillStyle=shade(col,1.12); c.beginPath(); c.moveTo(x,y); c.lineTo(x+m,y+m); c.lineTo(x+m,y+s-m); c.lineTo(x,y+s); c.closePath(); c.fill();
    c.fillStyle=col; c.fillRect(x+m,y+m,s-2*m,s-2*m); c.fillStyle='rgba(255,255,255,.55)'; c.fillRect(x+m+1,y+m+1,s*.18,s*.12); return; }
  // 糖果：圓角、上亮下暗、亮點
  const g=c.createLinearGradient(x,y,x,y+s); g.addColorStop(0,shade(col,1.3)); g.addColorStop(.55,col); g.addColorStop(1,shade(col,.72));
  c.fillStyle=shade(col,.55); rr(c,x+.5,y+.5,s-1,s-1,s*.26); c.fill(); c.fillStyle=g; rr(c,x+1.5,y+1.5,s-3,s-3.5,s*.22); c.fill();
  c.fillStyle='rgba(255,255,255,.55)'; rr(c,x+s*.18,y+s*.14,s*.5,s*.2,s*.1); c.fill(); c.fillStyle='rgba(255,255,255,.9)'; c.beginPath(); c.arc(x+s*.74,y+s*.3,s*.07,0,7); c.fill(); }
function drawCell(c,x,y,ci,s,skin,alpha){ if(alpha!=null) c.globalAlpha=alpha; c.drawImage(cellImg(ci,s,skin),x,y,s,s); if(alpha!=null) c.globalAlpha=1; }

/* ---------- 背景：每個世界一種場景 ---------- */
function bg(c,w,h,wi,t){ const Wd=WORLDS[wi],k=w/800,g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,Wd.sky[0]); g.addColorStop(1,Wd.sky[1]); c.fillStyle=g; c.fillRect(0,0,w,h);
  const hill=(col,y0,amp,fr,ph)=>{ c.fillStyle=col; c.beginPath(); c.moveTo(0,h); for(let x=0;x<=w;x+=10*k) c.lineTo(x,y0+Math.sin(x/w*fr*6.28+ph)*amp); c.lineTo(w,h); c.fill(); };
  if(wi===0){ // 糖果王國：雲、棒棒糖、拐杖糖山丘
    for(let i=0;i<4;i++){ const x=((i*230+t*12)%(w+160))-80,y=60*k+i%2*40*k; c.fillStyle='rgba(255,255,255,.85)'; for(const [dx,dy,r] of [[0,0,26],[24,-10,22],[46,0,24],[22,8,22]]){ c.beginPath(); c.arc(x+dx*k,y+dy*k,r*k,0,7); c.fill(); } }
    hill('#ffc6e2',h*.72,18*k,1.3,t*.1); hill('#ff9fcd',h*.82,14*k,2.1,1);
    for(const [x,s,col] of [[.08,1,'#ff5d8f'],[.93,.8,'#7a5cff'],[.2,.6,'#3ddbd9'],[.8,.7,'#ffb000']]){ const X=w*x,Y=h*.78,R=26*k*s; c.strokeStyle='#fff'; c.lineWidth=5*k*s; c.beginPath(); c.moveTo(X,Y); c.lineTo(X,Y-R*3); c.stroke();
      c.fillStyle=col; c.beginPath(); c.arc(X,Y-R*3,R,0,7); c.fill(); c.strokeStyle='rgba(255,255,255,.8)'; c.lineWidth=3*k*s; c.beginPath(); for(let a=0;a<12;a+=.3) c.lineTo(X+Math.cos(a+t)*R*a/12,Y-R*3+Math.sin(a+t)*R*a/12); c.stroke(); } }
  else if(wi===1){ // 蘑菇森林：樹、蘑菇、螢火蟲
    hill('#5fb86a',h*.7,16*k,1.5,0); for(let i=0;i<7;i++){ const x=(i+.5)*w/7+Math.sin(i*3)*30*k,y=h*.72; c.fillStyle='#6b4a2a'; c.fillRect(x-6*k,y-20*k,12*k,60*k); c.fillStyle=['#2f8a4a','#3fa05a','#4fb86a'][i%3]; for(const [dy,r] of [[-40,40],[-70,32],[-94,22]]){ c.beginPath(); c.arc(x,y+dy*k,r*k,0,7); c.fill(); } }
    hill('#3f9a4a',h*.86,10*k,2.4,2);
    for(const [x,s,col] of [[.12,1,'#e23b3b'],[.88,.8,'#ff8a3d'],[.3,.55,'#e23b3b'],[.7,.6,'#b77bff']]){ const X=w*x,Y=h*.9,R=24*k*s; c.fillStyle='#fff4dc'; c.fillRect(X-R*.32,Y-R*.9,R*.64,R*.9); c.fillStyle=col; c.beginPath(); c.ellipse(X,Y-R*.9,R,R*.62,0,Math.PI,0); c.fill(); c.fillStyle='#fff'; for(const [dx,dy] of [[-.4,-.3],[.3,-.45],[0,-.15]]){ c.beginPath(); c.arc(X+dx*R,Y-R*.9+dy*R,R*.13,0,7); c.fill(); } }
    for(let i=0;i<14;i++){ const a=t*.6+i*1.7,x=(i*97%100)/100*w+Math.sin(a)*20*k,y=h*.3+(i*53%60)/100*h+Math.cos(a*1.3)*14*k; c.fillStyle='rgba(255,250,140,'+(.4+.4*Math.sin(t*3+i))+')'; c.beginPath(); c.arc(x,y,2.6*k,0,7); c.fill(); } }
  else if(wi===2){ // 珊瑚海底：光線、泡泡、海草、小魚
    c.fillStyle='rgba(255,255,255,.07)'; for(let i=0;i<5;i++){ c.beginPath(); c.moveTo(w*(.1+i*.2),0); c.lineTo(w*(.2+i*.2)+60*k,0); c.lineTo(w*(.05+i*.2),h); c.lineTo(w*(i*.2)-60*k,h); c.fill(); }
    hill('#e6c88a',h*.9,8*k,2,0);
    for(let i=0;i<10;i++){ const x=(i+.3)*w/10; c.strokeStyle=i%2?'#2fa86a':'#3fc07a'; c.lineWidth=7*k; c.beginPath(); c.moveTo(x,h*.92); for(let j=1;j<=6;j++) c.lineTo(x+Math.sin(t*1.5+i+j*.7)*8*k,h*.92-j*16*k*(1+i%3*.3)); c.stroke(); }
    for(const [x,col] of [[.15,'#ff6b7d'],[.85,'#ff9a4d']]){ c.fillStyle=col; for(let j=0;j<5;j++){ c.beginPath(); c.arc(w*x+(j-2)*12*k,h*.86-Math.abs(j-2)*-6*k-20*k,10*k,0,7); c.fill(); } }
    for(let i=0;i<5;i++){ const x=((i*190+t*(30+i*8))%(w+80))-40,y=h*(.25+i*.12); c.fillStyle=['#ffd23f','#ff7eb6','#7af0ff','#ffa04d','#b77bff'][i]; c.beginPath(); c.ellipse(x,y,14*k,8*k,0,0,7); c.fill(); c.beginPath(); c.moveTo(x-12*k,y); c.lineTo(x-22*k,y-7*k); c.lineTo(x-22*k,y+7*k); c.fill(); c.fillStyle='#14122b'; c.beginPath(); c.arc(x+7*k,y-2*k,1.8*k,0,7); c.fill(); }
    c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=1.5*k; for(let i=0;i<16;i++){ const y=h-((t*40+i*67)%(h+20)),x=(i*131%100)/100*w+Math.sin(t+i)*8*k; c.beginPath(); c.arc(x,y,(3+i%3*2)*k,0,7); c.stroke(); } }
  else if(wi===3){ // 沙漠金字塔：夕陽、金字塔、沙丘、仙人掌
    c.fillStyle='rgba(255,240,160,.9)'; c.beginPath(); c.arc(w*.78,h*.32,44*k,0,7); c.fill(); c.fillStyle='rgba(255,240,160,.25)'; c.beginPath(); c.arc(w*.78,h*.32,70*k,0,7); c.fill();
    for(const [x,s] of [[.2,1],[.33,.7],[.86,.8]]){ const X=w*x,Y=h*.74,S=110*k*s; c.fillStyle='#e8b45a'; c.beginPath(); c.moveTo(X-S,Y); c.lineTo(X,Y-S*.85); c.lineTo(X+S,Y); c.fill(); c.fillStyle='#c48a3a'; c.beginPath(); c.moveTo(X,Y-S*.85); c.lineTo(X+S,Y); c.lineTo(X+S*.25,Y); c.fill(); }
    hill('#f0c070',h*.78,14*k,1.2,t*.05); hill('#e0a850',h*.88,10*k,2,2);
    for(const x of [.07,.62,.95]){ const X=w*x,Y=h*.9; c.fillStyle='#4f9a3a'; rr(c,X-7*k,Y-60*k,14*k,60*k,7*k); c.fill(); rr(c,X-24*k,Y-44*k,10*k,26*k,5*k); c.fill(); rr(c,X-24*k,Y-26*k,20*k,10*k,5*k); c.fill(); rr(c,X+12*k,Y-52*k,10*k,22*k,5*k); c.fill(); } }
  else if(wi===4){ // 雪山小屋：山、小屋、雪花
    c.fillStyle='#c6dcf5'; c.beginPath(); c.moveTo(0,h*.7); c.lineTo(w*.18,h*.3); c.lineTo(w*.38,h*.62); c.lineTo(w*.6,h*.22); c.lineTo(w*.85,h*.58); c.lineTo(w,h*.36); c.lineTo(w,h); c.lineTo(0,h); c.fill();
    c.fillStyle='#fff'; for(const [x,y] of [[.18,.3],[.6,.22],[1,.36]]){ c.beginPath(); c.moveTo(w*x-40*k,h*y+40*k); c.lineTo(w*x,h*y); c.lineTo(w*x+40*k,h*y+40*k); c.lineTo(w*x+20*k,h*y+32*k); c.lineTo(w*x,h*y+42*k); c.lineTo(w*x-20*k,h*y+32*k); c.fill(); }
    hill('#f4f9ff',h*.82,10*k,1.6,0);
    const X=w*.9,Y=h*.84; c.fillStyle='#8a5a3a'; c.fillRect(X-26*k,Y-34*k,52*k,34*k); c.fillStyle='#fff'; c.beginPath(); c.moveTo(X-34*k,Y-30*k); c.lineTo(X,Y-58*k); c.lineTo(X+34*k,Y-30*k); c.fill(); c.fillStyle='#ffd23f'; c.fillRect(X-8*k,Y-24*k,14*k,12*k);
    c.fillStyle='#fff'; for(let i=0;i<40;i++){ const x=((i*73)%100)/100*w+Math.sin(t+i)*14*k,y=((t*30+i*41)%(h+10)); c.beginPath(); c.arc(x,y,(1.5+i%3)*k,0,7); c.fill(); } }
  else { // 星空太空站：星星、行星、小火箭
    for(let i=0;i<70;i++){ const x=(i*137%800)/800*w,y=(i*251%500)/500*h,a=.3+.7*Math.abs(Math.sin(t*1.5+i)); c.fillStyle='rgba(255,255,255,'+a+')'; c.fillRect(x,y,(1+i%2)*k,(1+i%2)*k); }
    c.fillStyle='#ff9a4d'; c.beginPath(); c.arc(w*.12,h*.25,40*k,0,7); c.fill(); c.strokeStyle='rgba(255,220,160,.8)'; c.lineWidth=5*k; c.beginPath(); c.ellipse(w*.12,h*.25,64*k,14*k,-.3,0,7); c.stroke();
    c.fillStyle='#5ec8ff'; c.beginPath(); c.arc(w*.88,h*.72,56*k,0,7); c.fill(); c.fillStyle='rgba(255,255,255,.35)'; c.beginPath(); c.arc(w*.86,h*.68,36*k,0,7); c.fill();
    const rx=w*.8+Math.sin(t*.5)*30*k,ry=h*.2+Math.cos(t*.7)*12*k; c.save(); c.translate(rx,ry); c.rotate(.6); c.fillStyle='#fff'; rr(c,-8*k,-24*k,16*k,40*k,8*k); c.fill(); c.fillStyle='#e23b3b'; c.beginPath(); c.moveTo(-8*k,-14*k); c.lineTo(0,-30*k); c.lineTo(8*k,-14*k); c.fill(); c.fillStyle='#ffb000'; c.beginPath(); c.moveTo(-6*k,16*k); c.lineTo(0,(28+Math.sin(t*20)*4)*k); c.lineTo(6*k,16*k); c.fill(); c.restore(); } }

/* ---------- 一塊盤面 ---------- */
function Board(rnd,o){ const b={grid:new Uint8Array(COLS*ROWS),bag:[],queue:[],cur:null,fallT:0,lockT:0,lockN:0,lines:0,score:0,combo:-1,over:false,pend:0,fx:[],pops:[],das:{d:0,t:0},land:0,shake:0};
  const refill=()=>{ const k=KINDS.split(''); for(let i=k.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [k[i],k[j]]=[k[j],k[i]]; } b.bag.push(...k); };
  b.next=()=>{ while(b.queue.length<4){ if(!b.bag.length) refill(); b.queue.push(b.bag.shift()); } const k=b.queue.shift(); while(b.queue.length<3){ if(!b.bag.length) refill(); b.queue.push(b.bag.shift()); }
    const m=MAT[k]; b.cur={k,ci:KINDS.indexOf(k)+1,m,x:Math.floor((COLS-m.length)/2),y:k==='I'?-1:0}; b.lockT=0; b.lockN=0; b.fallT=0; if(b.hit(b.cur.m,b.cur.x,b.cur.y)) b.over=true; };
  b.hit=(m,x,y)=>{ for(let r=0;r<m.length;r++) for(let q=0;q<m.length;q++){ if(!m[r][q]) continue; const X=x+q,Y=y+r; if(X<0||X>=COLS||Y>=ROWS) return true; if(Y>=0&&b.grid[Y*COLS+X]) return true; } return false; };
  b.move=(dx,dy)=>{ const c=b.cur; if(!c||b.over) return false; if(b.hit(c.m,c.x+dx,c.y+dy)) return false; c.x+=dx; c.y+=dy; if(dx&&b.lockN<15&&b.hit(c.m,c.x,c.y+1)){ b.lockT=0; b.lockN++; } return true; };
  b.rotate=()=>{ const c=b.cur; if(!c||b.over||c.k==='O') return false; const m=rot(c.m); for(const [dx,dy] of KICKS) if(!b.hit(m,c.x+dx,c.y+dy)){ c.m=m; c.x+=dx; c.y+=dy; if(b.lockN<15){ b.lockT=0; b.lockN++; } return true; } return false; };
  b.ghostY=()=>{ const c=b.cur; let y=c.y; while(!b.hit(c.m,c.x,y+1)) y++; return y; };
  b.lock=()=>{ const c=b.cur; for(let r=0;r<c.m.length;r++) for(let q=0;q<c.m.length;q++) if(c.m[r][q]){ const Y=c.y+r; if(Y<0){ b.over=true; continue; } b.grid[Y*COLS+c.x+q]=c.ci; }
    b.land=.12; const full=[]; for(let y=0;y<ROWS;y++){ let ok=true; for(let x=0;x<COLS;x++) if(!b.grid[y*COLS+x]){ ok=false; break; } if(ok) full.push(y); }
    let sent=0;
    if(full.length){ for(const y of full){ b.fx.push({y,t:0}); for(let x=0;x<COLS;x++) b.pops.push({x:(x+.5)*CS,y:(y+.5)*CS,vx:(Math.random()-.5)*220,vy:-80-Math.random()*200,ci:b.grid[y*COLS+x],t:0}); }
      const ng=new Uint8Array(COLS*ROWS); let w=ROWS-1; for(let y=ROWS-1;y>=0;y--){ if(full.includes(y)) continue; ng.set(b.grid.subarray(y*COLS,y*COLS+COLS),w*COLS); w--; } b.grid=ng;
      b.combo++; b.lines+=full.length; b.score+=[0,100,300,500,800][full.length]*(1+(o.level||0)*.1|0)+Math.max(0,b.combo)*50;
      sent=[0,0,1,2,4][full.length]+Math.floor(Math.max(0,b.combo)/2); if(full.length===4) b.shake=.3;
      const cancel=Math.min(sent,b.pend); b.pend-=cancel; sent-=cancel; }
    else { b.combo=-1; if(b.pend>0){ b.addJunk(b.pend); b.pend=0; } }
    b.cleared=full.length; b.sent=sent; if(!b.over) b.next(); return full.length; };
  b.addJunk=n=>{ const hole=Math.floor(rnd()*COLS); for(let i=0;i<n;i++){ for(let x=0;x<COLS;x++) if(b.grid[x]) b.over=true; b.grid.copyWithin(0,COLS); for(let x=0;x<COLS;x++) b.grid[(ROWS-1)*COLS+x]=x===hole?0:8; }
    if(b.cur&&b.hit(b.cur.m,b.cur.x,b.cur.y)) b.cur.y=Math.max(-2,b.cur.y-n); };
  b.hardDrop=()=>{ const c=b.cur; if(!c||b.over) return 0; const y=b.ghostY(),d=y-c.y; c.y=y; b.score+=d*2; return b.lock()+100; };
  return b; }

/* ---------- 遊戲 ---------- */
function create(env,opts){
  const net=opts.net,two=!net&&opts.mode==='2p',si=clamp(opts.stage|0,0,29),ST=STAGES[si],L=opts.look||{},skin=L.skin||'candy';
  const vs=two||!!net,me=net?net.me:0,seed=net?Number(net.seed)||1:Math.floor(Math.random()*1e9);
  const {ctx:c}=env.canvas2d(W,H),sfx=n=>env.sfx(n);
  const boards=[]; const nb=vs?2:1; for(let i=0;i<nb;i++){ const b=Board(rng(seed+(net?0:i*7)),{level:si}); boards.push(b); }
  boards.forEach(b=>{ if(!vs&&ST.junk) for(let i=0;i<ST.junk;i++) b.addJunk(1); b.next(); });
  let t=0,intro=2.2,ended=false,endT=0,winner=-1,popups=[],sendT=0,cheer=0,sad=0;
  const remote=net?boards[1-me]:null; // 連線時對手的盤面：照對方送來的資料畫
  const names=net?(net.names||['玩家 1','玩家 2']):two?['1P','2P']:[opts.name||'你'];
  // 按鍵：單人方向鍵或 WASD；雙人 1P＝WASD＋空白鍵、2P＝方向鍵＋Enter
  const KS=two?[{l:['KeyA'],r:['KeyD'],d:['KeyS'],u:['KeyW'],x:['Space']},{l:['ArrowLeft'],r:['ArrowRight'],d:['ArrowDown'],u:['ArrowUp'],x:['Enter','NumpadEnter']}]
    :[{l:['ArrowLeft','KeyA'],r:['ArrowRight','KeyD'],d:['ArrowDown','KeyS'],u:['ArrowUp','KeyW','KeyX'],x:['Space']}];
  const held=(k,list)=>list.some(c=>env.keys[c]),hitAny=list=>list.some(c=>env.hit(c));
  const say=(bi,txt,col)=>popups.push({bi,txt,col:col||'#ffd23f',t:0});
  function control(b,K,dt){
    const dir=(held(b,K.r)?1:0)-(held(b,K.l)?1:0);
    if(dir){ if(b.das.d!==dir){ b.das.d=dir; b.das.t=0; if(b.move(dir,0)) sfx('click'); } else { b.das.t+=dt; while(b.das.t>.17){ b.das.t-=.05; b.move(dir,0); } } } else b.das.d=0;
    if(hitAny(K.u)){ if(b.rotate()) sfx('click'); }
    if(hitAny(K.x)){ const r=b.hardDrop(); after(b,r>=100?r-100:r,true); return; }
    const soft=held(b,K.d); b.fallT+=dt*(soft?Math.max(1,ST.fall/.03):1);
    while(b.fallT>=ST.fall&&!b.over){ b.fallT-=ST.fall; if(b.move(0,1)){ if(soft) b.score+=1; b.lockT=0; } else break; }
    if(b.cur&&b.hit(b.cur.m,b.cur.x,b.cur.y+1)){ b.lockT+=dt; if(b.lockT>.5) after(b,b.lock(),false); } }
  const sendState=()=>{ const b=boards[me]; net.send({st:[btoa(String.fromCharCode(...b.grid)),b.cur,b.score,b.lines,b.pend,b.queue.slice(0,3)]}); };
  function after(b,n,hard){ const bi=boards.indexOf(b); if(net) sendState(); sfx(n===4?'boom':n>=2?'item':n===1?'pop':'land');
    if(n){ say(bi,['','單消','雙消！','三消！','疊疊樂！四消！'][n]+(b.combo>0?'　連消 ×'+(b.combo+1):''),n===4?'#ff7eb6':'#ffd23f'); cheer=1.2; }
    if(vs&&b.sent>0){ if(net) net.send({ga:b.sent}); else boards[1-bi].pend+=b.sent; say(bi,'攻擊 +'+b.sent,'#ff8a5d'); }
    if(!vs&&b.lines>=ST.lines&&!ended){ ended=true; endT=0; winner=0; sfx('win'); }
    if(b.over&&!ended){ ended=true; endT=0; winner=vs?1-bi:-1; sfx(vs&&!net?'win':'lose'); sad=2; if(net) net.send({dead:1}); } }
  if(net){ net.onmsg=m=>{ if(m.ga&&!ended){ boards[me].pend+=m.ga; sfx('hurt'); say(me,'被攻擊 +'+m.ga,'#ff6b7d'); }
      if(m.st){ const r=remote; r.grid=Uint8Array.from(atob(m.st[0]),ch=>ch.charCodeAt(0)); r.cur=m.st[1]; r.score=m.st[2]; r.lines=m.st[3]; r.pend=m.st[4]; r.queue=m.st[5]; }
      if(m.dead&&!ended){ ended=true; endT=0; winner=me; sfx('win'); } };
    net.onleave=()=>{ if(!ended){ ended=true; endT=0; winner=me; } }; }
  function update(dt){
    t+=dt; for(const p of popups) p.t+=dt; popups=popups.filter(p=>p.t<1.4); if(cheer>0) cheer-=dt; if(sad>0) sad-=dt;
    for(const b of boards){ for(const f of b.fx) f.t+=dt; b.fx=b.fx.filter(f=>f.t<.45); for(const p of b.pops){ p.t+=dt; p.vy+=600*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; } b.pops=b.pops.filter(p=>p.t<1); if(b.land>0) b.land-=dt; if(b.shake>0) b.shake-=dt; }
    if(intro>0){ intro-=dt; if(!net&&(env.hit('Space')||env.hit('Enter'))&&intro<1.6) intro=0; return; }
    if(ended){ endT+=dt; if(endT>1.8) finish(); return; }
    if(net){ control(boards[me],KS[0],dt); sendT-=dt; if(sendT<=0){ sendT=.1; sendState(); } }
    else boards.forEach((b,i)=>control(b,KS[i],dt)); }
  let done=false;
  function finish(){ if(done) return; done=true; const b=boards[net?me:0];
    if(!vs){ if(winner===0){ const old=getRec(si),rec=old==null||b.score>old; if(rec) try{ localStorage.setItem(recKey(si),String(b.score)); }catch(e){}
        env.end({title:'過關！',big:b.score+' 分',text:'第 '+(si+1)+' 關「'+ST.name+'」消了 '+b.lines+' 行。'+(rec?'這關的新紀錄！':'這關最高 '+old+' 分'),score:b.score,next:si<29}); }
      else env.end({title:'方塊堆滿了',big:b.score+' 分',text:'消了 '+b.lines+' / '+ST.lines+' 行。先把底下的洞補平，再一次消好幾行！',score:null}); return; }
    const sc=boards.map(x=>x.score);
    env.end({title:net?(winner===me?'你贏了！':names[1-me]+' 獲勝'):(names[winner]+' 獲勝'),big:sc.join(' ： '),text:'先堆到頂的人輸。一次消 2 行以上會把垃圾行丟給對方。',score:null}); }

  /* ---------- 畫面 ---------- */
  function drawBoard(b,bx,by,label,isMe){ const sh=b.shake>0?(Math.random()-.5)*6:0; c.save(); c.translate(bx+sh,by);
    const fr=WORLDS[ST.w].frame; c.fillStyle='rgba(0,0,0,.25)'; rr(c,-8,-6,COLS*CS+16,ROWS*CS+14,14); c.fill();
    c.fillStyle=fr; rr(c,-10,-10,COLS*CS+20,ROWS*CS+20,14); c.fill(); c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=2; c.stroke();
    c.fillStyle='rgba(18,14,40,.82)'; rr(c,-3,-3,COLS*CS+6,ROWS*CS+6,8); c.fill();
    c.strokeStyle='rgba(255,255,255,.05)'; c.lineWidth=1; c.beginPath(); for(let x=1;x<COLS;x++){ c.moveTo(x*CS,0); c.lineTo(x*CS,ROWS*CS); } for(let y=1;y<ROWS;y++){ c.moveTo(0,y*CS); c.lineTo(COLS*CS,y*CS); } c.stroke();
    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){ const v=b.grid[y*COLS+x]; if(v) drawCell(c,x*CS,y*CS,v,CS,skin); }
    const cur=b.cur; if(cur&&!b.over&&intro<=0){ if(b.ghostY){ const gy=b.ghostY(); for(let r=0;r<cur.m.length;r++) for(let q=0;q<cur.m.length;q++) if(cur.m[r][q]&&gy+r>=0){ c.strokeStyle=COL[cur.ci]; c.globalAlpha=.55; c.lineWidth=2; rr(c,(cur.x+q)*CS+2,(gy+r)*CS+2,CS-4,CS-4,5); c.stroke(); c.globalAlpha=.12; c.fillStyle=COL[cur.ci]; c.fill(); c.globalAlpha=1; } }
      for(let r=0;r<cur.m.length;r++) for(let q=0;q<cur.m.length;q++) if(cur.m[r][q]&&cur.y+r>=0) drawCell(c,(cur.x+q)*CS,(cur.y+r)*CS,cur.ci,CS,skin); }
    for(const f of b.fx){ const a=1-f.t/.45; c.fillStyle='rgba(255,255,255,'+a*.9+')'; c.fillRect(-2,f.y*CS-a*4,COLS*CS+4,CS+a*8); }
    for(const p of b.pops){ const s=CS*.5*(1-p.t); c.save(); c.translate(p.x,p.y); c.rotate(p.t*8); drawCell(c,-s/2,-s/2,p.ci||8,s,skin,1-p.t); c.restore(); }
    if(b.pend>0){ const hgt=Math.min(ROWS,b.pend)*CS; c.fillStyle='#ff4d6a'; rr(c,-9,ROWS*CS-hgt,5,hgt,2); c.fill(); } // 快被塞進來的垃圾行
    c.restore();
    c.textAlign='center'; c.textBaseline='middle'; if(label){ c.font='900 14px '+TC; const w=c.measureText(label).width+22; c.fillStyle=isMe?'#ffd23f':'rgba(11,10,28,.75)'; rr(c,bx+COLS*CS/2-w/2,by-34,w,22,11); c.fill(); c.fillStyle=isMe?'#14122b':'#fff'; c.fillText(label,bx+COLS*CS/2,by-23); } }
  function nextBox(b,x,y,n){ c.fillStyle='rgba(11,10,28,.72)'; rr(c,x,y,92,30+n*56,12); c.fill(); c.fillStyle='#fff'; c.font='900 12px '+TC; c.textAlign='center'; c.fillText('下一個',x+46,y+15);
    (b.queue||[]).slice(0,n).forEach((k,i)=>{ const m=MAT[k],s=i?14:18,ci=KINDS.indexOf(k)+1; let mnx=9,mxx=-1,mny=9,mxy=-1; m.forEach((r,ry)=>r.forEach((v,rx)=>{ if(v){ mnx=Math.min(mnx,rx); mxx=Math.max(mxx,rx); mny=Math.min(mny,ry); mxy=Math.max(mxy,ry); } }));
      const ox=x+46-(mxx-mnx+1)*s/2,oy=y+34+i*56+24-(mxy-mny+1)*s/2; m.forEach((r,ry)=>r.forEach((v,rx)=>{ if(v) drawCell(c,ox+(rx-mnx)*s,oy+(ry-mny)*s,ci,s,skin); })); }); }
  function stat(x,y,w,lbl,val,col){ c.fillStyle='rgba(11,10,28,.72)'; rr(c,x,y,w,46,12); c.fill(); c.textAlign='left'; c.fillStyle='#cfd0ff'; c.font='700 11px '+TC; c.fillText(lbl,x+12,y+14); c.fillStyle=col||'#fff'; c.font='900 18px '+TC; c.fillText(val,x+12,y+33); }
  function mascot(x,y){ const kid=window.ARCADE_GAMES.stairs&&window.ARCADE_GAMES.stairs._kid; if(!kid) return; const jump=cheer>0?Math.abs(Math.sin(t*10))*14:0;
    c.save(); c.translate(x,y-jump); c.scale(2.6,2.6); kid(c,0,0,1,cheer>0?t:0,cheer>0||sad>0,0,L.color||'#ff7eb6',L.char||'girl'); c.restore();
    const txt=sad>0?'沒關係，再來！':cheer>0?'好厲害！':intro>0?'加油！':''; if(txt){ c.font='900 13px '+TC; const w=c.measureText(txt).width+20; c.fillStyle='#fff'; rr(c,x-w/2,y-112,w,26,12); c.fill(); c.fillStyle='#14122b'; c.textAlign='center'; c.fillText(txt,x,y-99); } }
  function draw(){
    bg(c,W,H,ST.w,t);
    if(!vs){ const b=boards[0],bx=290,by=40; drawBoard(b,bx,by,'',false); nextBox(b,bx+COLS*CS+22,by,3);
      stat(60,40,180,'第 '+(si+1)+' 關',ST.name,'#ffd23f'); stat(60,94,180,'分數',String(b.score)); stat(60,148,180,'消行',b.lines+' / '+ST.lines);
      const u=Math.min(1,b.lines/ST.lines); c.fillStyle='rgba(11,10,28,.72)'; rr(c,60,198,180,14,7); c.fill(); c.fillStyle='#86dc4f'; rr(c,63,201,Math.max(8,174*u),8,4); c.fill();
      mascot(150,430); }
    else { const pos=[[60,52],[450,52]]; boards.forEach((b,i)=>{ const [bx,by]=pos[i],mine=net?i===me:true; drawBoard(b,bx,by,(names[i]||'')+'　'+b.score+' 分',net&&i===me); nextBox(b,bx+COLS*CS+18,by,2);
        c.fillStyle='rgba(11,10,28,.72)'; rr(c,bx+COLS*CS+18,by+150,92,40,12); c.fill(); c.fillStyle='#fff'; c.font='700 11px '+TC; c.textAlign='center'; c.fillText('消 '+b.lines+' 行',bx+COLS*CS+64,by+170); }); }
    // 浮出的文字
    for(const p of popups){ const bx=vs?[60,450][p.bi]:290,a=Math.min(1,(1.4-p.t)*2); c.globalAlpha=a; c.font='900 22px '+TC; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='#14122b'; const y=230-p.t*40; c.strokeText(p.txt,bx+COLS*CS/2,y); c.fillStyle=p.col; c.fillText(p.txt,bx+COLS*CS/2,y); c.globalAlpha=1; }
    if(intro>0){ c.fillStyle='rgba(11,10,28,.55)'; c.fillRect(0,0,W,H); c.textAlign='center'; c.fillStyle='#fff'; c.font='900 30px '+TC;
      c.fillText(vs?'對戰開始！':'第 '+(si+1)+' 關　'+ST.name,W/2,H/2-30); c.font='700 18px '+TC; c.fillStyle='#ffd23f'; c.fillText(vs?'消 2 行以上會把垃圾行丟給對方':'消掉 '+ST.lines+' 行就過關'+(ST.junk?'（底下有 '+ST.junk+' 行垃圾）':''),W/2,H/2+12);
      c.font='900 40px '+PIX; c.fillStyle='#fff'; c.fillText(intro>1.4?'3':intro>.7?'2':'1',W/2,H/2+70); }
    if(ended&&endT>.2){ c.textAlign='center'; c.font='900 34px '+TC; c.lineWidth=7; c.strokeStyle='#14122b'; const txt=!vs?(winner===0?'過關！':'堆滿了…'):net?(winner===me?'你贏了！':'輸了…'):names[winner]+' 獲勝！';
      c.strokeText(txt,W/2,H/2); c.fillStyle='#ffd23f'; c.fillText(txt,W/2,H/2); } }
  return {update,draw,destroy(){},_dbg:{boards,get ended(){return ended;},get winner(){return winner;},ST}};
}

/* ---------- 開始畫面、縮圖、造型 ---------- */
function miniBoard(ctx,x,y,s,t,skin,fill){ ctx.fillStyle='rgba(18,14,40,.82)'; rr(ctx,x-4,y-4,COLS*s+8,ROWS*s+8,6); ctx.fill();
  const rows=fill||['','','','','','','','','','','','','','','8888808888','1100022333','1150622233','5556677733','4455667888','4444667788'];
  rows.forEach((r,ry)=>{ for(let rx=0;rx<r.length;rx++){ const v=+r[rx]; if(v) drawCell(ctx,x+rx*s,y+ry*s,v,s,skin); } });
  const fy=(t*4)%14; MAT.T.forEach((r,ry)=>r.forEach((v,rx)=>{ if(v) drawCell(ctx,x+(4+rx)*s,y+(Math.floor(fy)+ry)*s,3,s,skin); })); }
function stageShow(ctx,w,h,si,t){ const S=STAGES[si]; bg(ctx,w,h,S.w,t); const s=h/26; miniBoard(ctx,w/2-COLS*s/2,h*.08,s,t,'candy');
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.06)+'px '+TC; ctx.lineWidth=5; ctx.strokeStyle='#14122b'; const tx='消 '+S.lines+' 行'+(S.junk?'・垃圾 '+S.junk+' 行':''); ctx.strokeText(tx,w/2,h*.95); ctx.fillStyle='#fff'; ctx.fillText(tx,w/2,h*.95); }
function thumb(ctx,w,h,t){ bg(ctx,w,h,Math.floor(t/4)%6,t); const s=h/24; miniBoard(ctx,w*.5-COLS*s/2,h*.1,s,t,'candy');
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.12)+'px '+TC; ctx.lineWidth=7; ctx.strokeStyle='#14122b'; ctx.strokeText('方塊疊疊樂',w/2,h*.88); ctx.fillStyle='#ffd23f'; ctx.fillText('方塊疊疊樂',w/2,h*.88); }
function preview(ctx,w,h,L,t){ bg(ctx,w,h,0,t); const s=22; ['I','T','O','S'].forEach((k,i)=>{ const m=MAT[k]; m.forEach((r,ry)=>r.forEach((v,rx)=>{ if(v) drawCell(ctx,w*.12+i*62+rx*s*.6,h*.3+ry*s*.6+(i%2)*30,KINDS.indexOf(k)+1,s*.6,L.skin||'candy'); })); });
  const kid=window.ARCADE_GAMES.stairs&&window.ARCADE_GAMES.stairs._kid; if(kid){ ctx.save(); ctx.translate(w*.78,h*.86-Math.abs(Math.sin(t*4))*10); ctx.scale(3,3); kid(ctx,0,0,-1,t,true,0,L.color||'#ff7eb6',L.char||'girl'); ctx.restore(); } }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).blocks={
  name:'方塊疊疊樂',tag:'BLOCK STACK',color:'#ff7eb6',online:true,maxPlayers:2,
  desc:'七種方塊從上面掉下來，排滿一整行就消掉。30 關闖關，或兩個人對戰互丟垃圾行。',
  goal:'把方塊排滿一整行就會消掉，消到指定行數就過關；方塊堆到頂就輸了。',
  stageGoal:si=>{ const S=STAGES[si]; return '消掉 '+S.lines+' 行就過關'+(S.junk?'，一開始底下有 '+S.junk+' 行垃圾':'')+'。方塊堆到頂就輸了；一次消越多行分數越高。雙人對戰時一次消 2 行以上會把垃圾行丟給對方。'; },
  stages:STAGES.map(s=>s.name),stars:STAGES.map((s,i)=>1+Math.floor(i/6)),stageLabel:'選擇關卡',
  stageBest:i=>{ const v=getRec(i); return v==null?'':'✓ '+v+' 分'; },
  stageLocked:i=>i>0&&getRec(i-1)==null,
  modes:[{id:'1p',label:'單人闖關'},{id:'2p',label:'雙人對戰',kb:true}],
  help:[['← →','左右移動'],['↑','旋轉'],['↓ ／ 空白鍵','慢慢放下／一口氣落下'],['雙人','1P：W A S D＋空白鍵；2P：方向鍵＋Enter']],
  touchHelp:[['◀ ▶','左右移動'],['旋轉','轉方向'],['▼ ／ 落下','慢慢放下／一口氣落下']],
  touch:{left:[{l:'◀',c:'ArrowLeft',big:true},{l:'▶',c:'ArrowRight',big:true}],right:[{l:'旋轉',c:'ArrowUp'},{l:'▼',c:'ArrowDown'},{l:'落下',c:'Space',act:true}]},
  best:{label:'最高分',fmt:v=>v+' 分',lower:false},
  looks:[{key:'skin',label:'方塊樣式',opts:[{id:'candy',label:'糖果'},{id:'gem',label:'寶石'},{id:'pixel',label:'像素'}]},
    {key:'char',label:'加油夥伴',opts:[{id:'girl',label:'女孩'},{id:'boy',label:'男孩'},{id:'robot',label:'機器人'},{id:'ninja',label:'忍者'}]},
    {key:'color',label:'衣服顏色',type:'color',opts:['#ff7eb6','#ff5d4f','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#b98cff']}],
  stageShow,preview,thumb,create
};
})();
