// 爆爆王：格子地圖、水球十字爆炸、被炸到會困在水泡裡。
// 連線時房主負責全部運算，每秒 20 次把畫面狀態傳給其他人；其他人只送出方向和放水球。
(function(){
'use strict';
const COLS=15,ROWS=13,T=40,HUD=64,W=COLS*T,H=ROWS*T+HUD,N=COLS*ROWS;
const FUSE=2.8,FLAME=.45,TRAP=5;
const DIRS=[[0,-1],[0,1],[-1,0],[1,0]];
const PIX='"Press Start 2P","Noto Sans TC","Microsoft JhengHei",monospace';
const TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const COLORS=['#ff5d4f','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d'];
const SPAWN=[[0,0],[COLS-1,ROWS-1],[COLS-1,0],[0,ROWS-1],[7,0],[7,ROWS-1]];
const STAGES=[
  {name:'水球村',info:'棋盤式的房子，箱子多，最標準的地圖。',solid:(x,y)=>x%2===1&&y%2===1,box:.78,drop:.38,
   g:['#8fd16a','#84c760'],s:['#c9573f','#f0e2c0'],b:['#e3a24a','#b9772a']},
  {name:'沙漠綠洲',info:'柱子少、箱子最多，前期要先炸出路。',solid:(x,y)=>x%3===1&&y%3===1,box:.84,drop:.4,
   g:['#e8cf8e','#dfc481'],s:['#3f9a56','#2c7a40'],b:['#c98a55','#9b6234']},
  {name:'冰原要塞',info:'中間有十字大道，箱子少，很快就會碰面。',solid:(x,y)=>x%2===1&&y%2===1&&x!==7&&y!==6,box:.62,drop:.45,
   g:['#dff1fb','#cfe6f4'],s:['#6fa9d6','#e9f7ff'],b:['#9fd0ea','#5f9cc0']},
  {name:'森林迷宮',info:'樹木交錯排列，走道彎彎曲曲。',solid:(x,y)=>(x%4===1&&y%2===1)||(x%4===3&&y%4===2),box:.74,drop:.4,
   g:['#6fae5a','#66a352'],s:['#2f7d32','#7a5a36'],b:['#c9a45a','#8a6a3a']},
  {name:'海盜船',info:'甲板上有兩排桅杆圍出內外兩圈。',solid:(x,y)=>((x===3||x===11)&&y%2===1&&y!==5&&y!==7)||((y===3||y===9)&&x%2===1&&x!==7),box:.7,drop:.42,
   g:['#c9a06a','#bf955f'],s:['#3a3a4a','#8a8fa8'],b:['#b9783a','#7a4a1f']},
  {name:'糖果屋',info:'柱子只有一半，視野開闊，水球容易連鎖。',solid:(x,y)=>x%2===1&&y%2===1&&(x+y)%4===2,box:.72,drop:.5,
   g:['#ffe3ef','#ffd3e6'],s:['#ff7eb6','#fff3c8'],b:['#a8e0ff','#5fb8e8']},
  {name:'火山口',info:'柱子最密，通道窄，很容易被自己的水球困住。',solid:(x,y)=>(x%2===1&&y%2===1)||(x%4===2&&y%4===2),box:.66,drop:.42,
   g:['#5a4640','#52403a'],s:['#3a2a26','#ff7a3a'],b:['#8a6a5a','#5a3f33']}
];
// 電腦強度：想多久出手一次、看到機會放水球的機率、一開始的水球威力與數量
// hunt：會不會瞄準玩家放水球、去刺破被困的人；itemR：多遠內的道具會去撿；cap：水球數與威力上限；slow：移動速度倍率；flee：看到危險後多久才反應
const DIFF={easy:{think:[.55,.9],bombP:.3,power:1,maxB:1,hunt:0,itemR:3,cap:2,slow:.82,flee:.3},normal:{think:[.15,.28],bombP:.75,power:1,maxB:1,hunt:1,itemR:8,cap:7,slow:1,flee:.08},hard:{think:[.07,.14],bombP:.97,power:2,maxB:2,hunt:1,itemR:8,cap:7,slow:1,flee:.08}};
const r2=v=>Math.round(v*100)/100;

/* ---------- 畫圖 ---------- */
const WATER=['#57a8ff','#ff7eb6','#5fd068','#ff9d3d','#b98cff','#3ddbd9'];
const rgb=hex=>{ const n=parseInt(hex.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; };
const mix=(hex,k)=>'rgb('+rgb(hex).map(v=>Math.round(k<1?v*k:v+(255-v)*(k-1))).join(',')+')';
function drawChar(ctx,cx,cy,color,dir,moving,t,sc,style){
  const s=sc||1,bob=moving?Math.sin(t*16)*1.5:0,st=style||'cap';
  ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(cx,cy+15*s,11*s,4*s,0,0,7); ctx.fill();
  ctx.fillStyle='#3a2a20'; ctx.fillRect(cx-8*s,cy+10*s+bob,6*s,5*s); ctx.fillRect(cx+2*s,cy+10*s-bob,6*s,5*s);
  ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(cx,cy+5*s,10*s,9*s,0,0,7); ctx.fill();
  if(st==='bunny'){ ctx.beginPath(); ctx.ellipse(cx-5*s,cy-22*s,3.5*s,9*s,-.15,0,7); ctx.ellipse(cx+5*s,cy-22*s,3.5*s,9*s,.15,0,7); ctx.fill(); }
  if(st==='cat'){ ctx.beginPath(); ctx.moveTo(cx-11*s,cy-11*s); ctx.lineTo(cx-9*s,cy-22*s); ctx.lineTo(cx-2*s,cy-16*s); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx+11*s,cy-11*s); ctx.lineTo(cx+9*s,cy-22*s); ctx.lineTo(cx+2*s,cy-16*s); ctx.fill(); }
  ctx.fillStyle='#ffe0b8'; ctx.beginPath(); ctx.arc(cx,cy-7*s,11*s,0,7); ctx.fill();
  ctx.fillStyle=color;
  if(st==='cap'){ ctx.beginPath(); ctx.arc(cx,cy-9*s,11.5*s,Math.PI,0); ctx.fill(); ctx.fillRect(cx-12*s,cy-10*s,24*s,3*s); }
  else if(st==='chef'){ ctx.fillStyle='#fff'; ctx.strokeStyle='#14122b'; ctx.lineWidth=1; ctx.fillRect(cx-8*s,cy-18*s,16*s,6*s); ctx.beginPath(); ctx.arc(cx-5*s,cy-22*s,6*s,0,7); ctx.arc(cx+5*s,cy-22*s,6*s,0,7); ctx.arc(cx,cy-25*s,6.5*s,0,7); ctx.fill(); ctx.fillStyle=color; ctx.fillRect(cx-8*s,cy-14*s,16*s,2*s); }
  else if(st==='pirate'){ ctx.fillStyle='#22222c'; ctx.beginPath(); ctx.moveTo(cx-14*s,cy-13*s); ctx.quadraticCurveTo(cx,cy-30*s,cx+14*s,cy-13*s); ctx.quadraticCurveTo(cx,cy-17*s,cx-14*s,cy-13*s); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillRect(cx-2*s,cy-21*s,4*s,4*s); ctx.fillStyle='#22222c'; ctx.fillRect(cx-11*s,cy-9*s,22*s,1.5*s); if(dir!==0) ctx.fillRect(cx+(dir===2?-9:1)*s,cy-9*s,6*s,6*s); }
  else if(st==='ninja'){ ctx.fillStyle='#2b2f55'; ctx.beginPath(); ctx.arc(cx,cy-7*s,11.6*s,Math.PI*.98,Math.PI*2.02); ctx.fill(); ctx.fillRect(cx-11.6*s,cy-2*s,23.2*s,6.5*s); ctx.fillStyle=color; ctx.fillRect(cx-12*s,cy-13*s,24*s,3*s); ctx.fillRect(cx+(dir===2?9:-14)*s,cy-13*s,5*s,7*s); }
  else if(st==='bow'){ ctx.beginPath(); ctx.arc(cx,cy-10*s,10.5*s,Math.PI*1.08,Math.PI*1.92); ctx.fill(); ctx.fillStyle='#ff5d8f'; ctx.beginPath(); ctx.moveTo(cx,cy-18*s); ctx.lineTo(cx-10*s,cy-25*s); ctx.lineTo(cx-10*s,cy-12*s); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx,cy-18*s); ctx.lineTo(cx+10*s,cy-25*s); ctx.lineTo(cx+10*s,cy-12*s); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(cx,cy-18*s,3*s,0,7); ctx.fill(); }
  else if(st==='crown'){ ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.moveTo(cx-10*s,cy-13*s); ctx.lineTo(cx-10*s,cy-23*s); ctx.lineTo(cx-5*s,cy-17*s); ctx.lineTo(cx,cy-25*s); ctx.lineTo(cx+5*s,cy-17*s); ctx.lineTo(cx+10*s,cy-23*s); ctx.lineTo(cx+10*s,cy-13*s); ctx.fill(); ctx.fillStyle=color; ctx.fillRect(cx-10*s,cy-15*s,20*s,3*s); }
  else { ctx.beginPath(); ctx.arc(cx,cy-10*s,10.5*s,Math.PI*1.08,Math.PI*1.92); ctx.fill(); }
  ctx.fillStyle='#14122b';
  if(dir===1){ ctx.fillRect(cx-5*s,cy-5*s,3*s,4*s); ctx.fillRect(cx+2*s,cy-5*s,3*s,4*s); }
  else if(dir===2){ ctx.fillRect(cx-8*s,cy-5*s,3*s,4*s); ctx.fillRect(cx-2*s,cy-5*s,3*s,4*s); }
  else if(dir===3){ ctx.fillRect(cx+5*s,cy-5*s,3*s,4*s); ctx.fillRect(cx-1*s,cy-5*s,3*s,4*s); }
}
function drawBalloon(ctx,cx,cy,t,r0,shape,col){
  const r=(r0||15)*(1+.07*Math.sin(t*9)),c=col||WATER[0],sh=shape||'ball';
  if(sh==='star'){ ctx.fillStyle=mix(c,.7); ctx.beginPath();
    for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5,rr=(i%2?.52:1.12)*r; ctx[i?'lineTo':'moveTo'](cx+Math.cos(a)*rr,cy+1+Math.sin(a)*rr); } ctx.closePath(); ctx.fill();
    ctx.fillStyle=c; ctx.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5,rr=(i%2?.42:.95)*r; ctx[i?'lineTo':'moveTo'](cx+Math.cos(a)*rr,cy+Math.sin(a)*rr); } ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(cx-r*.2,cy-r*.25,r*.14,0,7); ctx.fill(); return; }
  ctx.fillStyle=mix(c,.62); ctx.beginPath(); ctx.arc(cx,cy+1,r,0,7); ctx.fill();
  ctx.fillStyle=c; ctx.beginPath(); ctx.arc(cx-1,cy-1,r*.82,0,7); ctx.fill();
  if(sh==='melon'){ ctx.strokeStyle=mix(c,.55); ctx.lineWidth=r*.16; for(const k of [-.5,0,.5]){ ctx.beginPath(); ctx.ellipse(cx,cy,Math.abs(k)*r*1.2+.01,r*.82,0,0,7); ctx.stroke(); } }
  ctx.fillStyle='rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(cx-r*.35,cy-r*.4,r*.25,r*.16,-.6,0,7); ctx.fill();
  ctx.fillStyle=mix(c,.62); ctx.fillRect(cx-2,cy-r-3,4,4);
}
function drawItem(ctx,x,y,type,t){
  const cx=x+T/2,cy=y+T/2+Math.sin(t*4+x)*1.5;
  ctx.fillStyle='rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(cx,y+T-6,11,3,0,0,7); ctx.fill();
  ctx.fillStyle='#fff'; ctx.strokeStyle='#14122b'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy,13,0,7); ctx.fill(); ctx.stroke();
  if(type==='b'){ drawBalloon(ctx,cx,cy+1,0,8); }
  else if(type==='p'){ ctx.fillStyle='#ff5d8f'; ctx.beginPath(); ctx.arc(cx,cy+3,7,0,7); ctx.fill(); ctx.fillRect(cx-3,cy-9,6,7); ctx.fillStyle='#14122b'; ctx.fillRect(cx-4,cy-10,8,2); }
  else if(type==='s'){ ctx.fillStyle='#ff9d3d'; ctx.fillRect(cx-7,cy-7,7,10); ctx.fillRect(cx-7,cy,15,5); ctx.fillStyle='#14122b'; ctx.beginPath(); ctx.arc(cx-4,cy+7,2.5,0,7); ctx.arc(cx+5,cy+7,2.5,0,7); ctx.fill(); }
  else { ctx.strokeStyle='#6b7280'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx-7,cy+7); ctx.lineTo(cx+6,cy-6); ctx.stroke(); ctx.fillStyle='#ff5d8f'; ctx.beginPath(); ctx.arc(cx-7,cy+7,3,0,7); ctx.fill(); }
}
function drawTile(ctx,st,v,x,y,gx,gy){
  ctx.fillStyle=st.g[(gx+gy)%2]; ctx.fillRect(x,y,T,T);
  if(v===1){ ctx.fillStyle='rgba(0,0,0,.18)'; ctx.fillRect(x+3,y+T-6,T-4,5);
    ctx.fillStyle=st.s[1]; ctx.fillRect(x+3,y+14,T-6,T-18); ctx.fillStyle=st.s[0];
    ctx.beginPath(); ctx.moveTo(x+1,y+17); ctx.lineTo(x+T/2,y+1); ctx.lineTo(x+T-1,y+17); ctx.fill();
    ctx.fillStyle='rgba(20,18,43,.55)'; ctx.fillRect(x+16,y+23,8,13); }
  else if(v===2){ ctx.fillStyle='rgba(0,0,0,.18)'; ctx.fillRect(x+3,y+T-5,T-4,4);
    ctx.fillStyle=st.b[1]; ctx.fillRect(x+2,y+2,T-4,T-5); ctx.fillStyle=st.b[0]; ctx.fillRect(x+5,y+5,T-10,T-11);
    ctx.strokeStyle=st.b[1]; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(x+5,y+5); ctx.lineTo(x+T-5,y+T-6); ctx.moveTo(x+T-5,y+5); ctx.lineTo(x+5,y+T-6); ctx.stroke(); }
}

function create(env,opts){
  const st=STAGES[opts.stage||0],D=DIFF[opts.variant]||DIFF.normal,net=opts.net,client=!!net&&!net.host,local2=!net&&opts.mode==='2p',single=!net&&!local2,me=net?net.me:0,humans=net?net.count:local2?2:1;
  const {ctx}=env.canvas2d(W,H);
  const grid=new Uint8Array(N),flameT=new Float32Array(N),bombAt=new Uint8Array(N),flameC=new Uint8Array(N);
  let items=new Map(),bombs=[],pending=[],time=180,t=0,overT=0,ended=false,evq=[],sendT=0,lastSent='';
  const inputs=[],pressT=[[0,0,0,0],[0,0,0,0]];
  const sfx=n=>{ env.sfx(n); if(net&&net.host) evq.push(n); };

  // 地圖
  const keep=new Set(); for(const [sx,sy] of SPAWN.slice(0,Math.max(4,humans))){ for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]]) keep.add((sy+dy)*COLS+sx+dx); }
  if(!client) for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){ const i=y*COLS+x;
    if(st.solid(x,y)) grid[i]=1; else if(!keep.has(i)&&Math.random()<st.box) grid[i]=2; }
  const total=net?Math.min(6,humans+(net.bots||0)):Math.max(4,humans); // 單機不足 4 人由電腦補滿；連線只有房間裡的人，加不加電腦由房主決定
  const players=SPAWN.slice(0,total).map(([x,y],i)=>({id:i,x,y,rx:x,ry:y,dir:1,moving:false,state:'alive',trapT:0,inv:0,
    maxB:i<humans?1:D.maxB,power:i<humans?1:D.power,spd:0,needles:0,human:i<humans,
    name:local2&&i<2?(i+1)+'P':i===me?'你':i<humans?((net&&net.names&&net.names[i])||'玩家'+(i+1)).slice(0,5):'電腦',
    ai:i<humans?null:{think:Math.random()*.5,path:[],flee:false,avoid:new Map()}}));
  for(let i=0;i<total;i++) inputs.push({dir:-1,bomb:false});
  const CH=['cap','cat','bunny','crown','chef','pirate','ninja','bow'],SHP=['ball','star','melon'];
  players.forEach((p,i)=>{ p.look=(p.human?(net?net.looks&&net.looks[i]:i===0?opts.look:null):null)||{char:CH[(i*3+1)%CH.length],bomb:SHP[i%3],water:WATER[i%WATER.length]};
    p.wc=Math.max(0,WATER.indexOf(p.look.water)); });

  const cellOf=p=>Math.round(p.y)*COLS+Math.round(p.x);
  const speedOf=p=>p.state==='trapped'?.5:(3.6+p.spd*.55)*(p.human?1:D.slow);
  const active=p=>{ let n=0; for(const b of bombs) if(b.owner===p.id) n++; return n; };
  function blocked(cx,cy){ if(cx<0||cy<0||cx>=COLS||cy>=ROWS) return true; const i=cy*COLS+cx; return grid[i]!==0||bombAt[i]===1; }
  function step(p,dir,dist){
    const dx=DIRS[dir][0],dy=DIRS[dir][1],cx=Math.round(p.x),cy=Math.round(p.y);
    if(dx){
      const off=cy-p.y;
      if(Math.abs(off)>1e-3){ if(blocked(cx+dx,cy)&&(p.x-cx)*dx>=0) return; const m=Math.min(dist,Math.abs(off)); p.y+=Math.sign(off)*m; dist-=m; if(dist<=0) return; }
      else p.y=cy;
      let nx=p.x+dx*dist; if(blocked(cx+dx,cy)&&(nx-cx)*dx>0) nx=(p.x-cx)*dx>0?p.x:cx; p.x=nx;
    } else {
      const off=cx-p.x;
      if(Math.abs(off)>1e-3){ if(blocked(cx,cy+dy)&&(p.y-cy)*dy>=0) return; const m=Math.min(dist,Math.abs(off)); p.x+=Math.sign(off)*m; dist-=m; if(dist<=0) return; }
      else p.x=cx;
      let ny=p.y+dy*dist; if(blocked(cx,cy+dy)&&(ny-cy)*dy>0) ny=(p.y-cy)*dy>0?p.y:cy; p.y=ny;
    }
  }
  function placeBomb(p){
    const i=cellOf(p); if(p.state!=='alive'||bombAt[i]||active(p)>=p.maxB) return false;
    bombs.push({x:i%COLS,y:(i/COLS)|0,t:FUSE,power:p.power,owner:p.id,done:false}); bombAt[i]=1; sfx('place'); return true;
  }
  function rollItem(){ const r=Math.random(); return r<.36?'b':r<.68?'p':r<.92?'s':'n'; }
  function detonate(first){
    const q=[first]; first.done=true;
    while(q.length){ const b=q.pop(),i0=b.y*COLS+b.x,wc=players[b.owner]?players[b.owner].wc:0; bombAt[i0]=0; flameT[i0]=FLAME; flameC[i0]=wc;
      for(const [dx,dy] of DIRS) for(let s=1;s<=b.power;s++){
        const x=b.x+dx*s,y=b.y+dy*s; if(x<0||y<0||x>=COLS||y>=ROWS) break; const i=y*COLS+x;
        if(grid[i]===1) break;
        if(grid[i]===2){ grid[i]=0; flameT[i]=FLAME; flameC[i]=wc; if(Math.random()<st.drop) pending.push({i,t:FLAME+.02,type:rollItem()}); break; }
        if(bombAt[i]){ const o=bombs.find(o=>!o.done&&o.x===x&&o.y===y); if(o){ o.done=true; q.push(o); } }
        items.delete(i); flameT[i]=FLAME; flameC[i]=wc; } }
    bombs=bombs.filter(b=>!b.done); sfx('boom');
  }
  // 預測用：不改動地圖
  function blast(bx,by,power){
    const cells=[by*COLS+bx]; let boxes=0;
    for(const [dx,dy] of DIRS) for(let s=1;s<=power;s++){ const x=bx+dx*s,y=by+dy*s; if(x<0||y<0||x>=COLS||y>=ROWS) break; const i=y*COLS+x;
      if(grid[i]===1) break; if(grid[i]===2){ boxes++; break; } cells.push(i); }
    return {cells,boxes};
  }
  function dangerMap(extra){
    const list=extra?bombs.concat([extra]):bombs,tm=list.map(b=>b.t),bl=list.map(b=>blast(b.x,b.y,b.power).cells);
    for(let pass=0;pass<4;pass++){ let ch=false;
      for(let a=0;a<list.length;a++) for(let b=0;b<list.length;b++){ if(a===b||tm[b]<=tm[a]) continue;
        if(bl[a].indexOf(list[b].y*COLS+list[b].x)>=0){ tm[b]=tm[a]; ch=true; } }
      if(!ch) break; }
    const d=new Float32Array(N).fill(Infinity);
    for(let a=0;a<list.length;a++) for(const c of bl[a]) if(tm[a]<d[c]) d[c]=tm[a];
    for(let i=0;i<N;i++) if(flameT[i]>0) d[i]=0;
    return d;
  }
  function bfs(p,danger,safeOnly){
    const dist=new Int16Array(N).fill(-1),prev=new Int16Array(N).fill(-1),s=cellOf(p),q=[s],spd=speedOf(p); dist[s]=0;
    for(let h=0;h<q.length;h++){ const c=q[h],cx=c%COLS,cy=(c/COLS)|0;
      for(const [dx,dy] of DIRS){ const x=cx+dx,y=cy+dy; if(x<0||y<0||x>=COLS||y>=ROWS) continue; const n=y*COLS+x;
        if(dist[n]>=0||grid[n]||bombAt[n]||flameT[n]>0) continue;
        const d=dist[c]+1,dg=danger[n];
        if(dg!==Infinity){ if(safeOnly||d/spd+.45>dg) continue; }
        dist[n]=d; prev[n]=c; q.push(n); } }
    return {dist,prev};
  }
  function pathTo(prev,target){ const out=[]; let c=target; while(prev[c]>=0){ out.unshift(c); c=prev[c]; } return out; }

  function think(p){
    const a=p.ai,cur=cellOf(p),cx=cur%COLS,cy=(cur/COLS)|0,danger=dangerMap(); a.flee=false;
    if(danger[cur]!==Infinity){
      const r=bfs(p,danger,false); let best=-1;
      for(let i=0;i<N;i++) if(r.dist[i]>=0&&danger[i]===Infinity&&(best<0||r.dist[i]<r.dist[best])) best=i;
      a.path=best>=0?pathTo(r.prev,best):[]; a.flee=true; return;
    }
    const r=bfs(p,danger,true); let goal=-1,gd=99;
    if(D.hunt) for(const q of players) if(q!==p&&q.state==='trapped'){ const c=cellOf(q); if(r.dist[c]>=0&&r.dist[c]<gd){ goal=c; gd=r.dist[c]; } }
    if(goal<0) for(const i of items.keys()) if(r.dist[i]>=0&&r.dist[i]<Math.min(gd,D.itemR)){ goal=i; gd=r.dist[i]; }
    if(goal>=0&&goal!==cur){ a.path=pathTo(r.prev,goal); return; }
    if(active(p)<p.maxB&&!bombAt[cur]){
      const b=blast(cx,cy,p.power); let value=b.boxes;
      for(const q of players) if(D.hunt&&q!==p&&q.state==='alive'&&b.cells.indexOf(cellOf(q))>=0) value+=3;
      if(value>0){
        const d2=dangerMap({x:cx,y:cy,t:FUSE,power:p.power}),r2=bfs(p,d2,false),spd=speedOf(p); let best=-1;
        for(let i=0;i<N;i++) if(r2.dist[i]>0&&d2[i]===Infinity&&r2.dist[i]/spd<FUSE-.9&&(best<0||r2.dist[i]<r2.dist[best])) best=i;
        if(best>=0){ if(Math.random()<D.bombP){ placeBomb(p); a.path=pathTo(r2.prev,best); a.flee=true; } return; }
        a.avoid.set(cur,t+4);
      }
    }
    let best=-1,bs=-1e9;
    for(let i=0;i<N;i++){ const d=r.dist[i]; if(d<=0||d>14) continue; if((a.avoid.get(i)||0)>t) continue;
      const x=i%COLS,y=(i/COLS)|0,bx=blast(x,y,p.power).boxes; let s;
      if(bx>0) s=12+bx*2-d; else { let m=99; for(const q of players) if(q!==p&&q.state==='alive') m=Math.min(m,Math.abs(q.x-x)+Math.abs(q.y-y)); s=D.hunt?-m*.5-d*.1:-d*.3; }
      s+=Math.random()*1.5; if(s>bs){ bs=s; best=i; } }
    a.path=best>=0?pathTo(r.prev,best):[];
  }
  function aiDir(p){
    const a=p.ai;
    while(a.path.length){ const c=a.path[0],cx=c%COLS,cy=(c/COLS)|0;
      if(Math.abs(p.x-cx)<.06&&Math.abs(p.y-cy)<.06){ p.x=cx; p.y=cy; a.path.shift(); continue; }
      if(flameT[c]>0) return -1;
      if(grid[c]||(bombAt[c]&&c!==cellOf(p))){ a.path=[]; return -1; }
      const dx=cx-p.x,dy=cy-p.y; return Math.abs(dx)>Math.abs(dy)?(dx<0?2:3):(dy<0?0:1); }
    return -1;
  }
  // 鍵組 0＝方向鍵，1＝WASD；同時按兩個方向時以最後按下的為準
  const KS=[['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'],['KeyW','KeyS','KeyA','KeyD']];
  function dirFrom(sets,pt){
    const K=env.keys; let best=-1;
    for(let d=0;d<4;d++){ let held=false; for(const k of sets) if(K[KS[k][d]]) held=true;
      if(held){ if(!pt[d]) pt[d]=t+1e-6; if(best<0||pt[d]>pt[best]) best=d; } else pt[d]=0; }
    return best;
  }

  function conclude(w){
    if(ended) return; ended=true; const win=w===me;
    if(local2){ env.sfx('win'); env.end({title:w>=0?players[w].name+' 獲勝':w===-1?'平手':'兩人都出局',text:w===-2?'電腦留到了最後。':'',score:null}); return; }
    env.sfx(win?'win':'lose');
    env.end({title:win?'你贏了！':w===-1?'平手':'你輸了',
      text:win?(single?'過關！':'最後留在場上的是你。'):w===-1?'時間到，沒有人勝出。':w>=0?players[w].name+'留到了最後。':'你被困在水泡裡了。',
      score:single&&win?(opts.stage||0)+1:null,next:single&&win&&(opts.stage||0)<STAGES.length-1});
  }

  function snapshot(){
    let g=''; for(let i=0;i<N;i++) g+=grid[i];
    const f=[]; for(let i=0;i<N;i++) if(flameT[i]>0) f.push(i,r2(flameT[i]),flameC[i]);
    const m={s:1,g,i:[...items],b:bombs.map(b=>[b.x,b.y,r2(b.t),b.owner]),f,tm:Math.ceil(time),e:evq,
      p:players.map(p=>[r2(p.x),r2(p.y),p.dir,p.state==='alive'?0:p.state==='trapped'?1:2,r2(p.trapT),p.maxB,p.power,p.spd,p.needles,p.moving?1:0])};
    evq=[]; return m;
  }
  function apply(m){
    for(let i=0;i<N;i++){ grid[i]=m.g.charCodeAt(i)-48; flameT[i]=0; bombAt[i]=0; }
    for(let k=0;k<m.f.length;k+=3){ flameT[m.f[k]]=m.f[k+1]; flameC[m.f[k]]=m.f[k+2]; }
    items=new Map(m.i); bombs=m.b.map(b=>({x:b[0],y:b[1],t:b[2],owner:b[3]})); time=m.tm;
    m.p.forEach((a,i)=>{ const p=players[i]; p.x=a[0]; p.y=a[1]; p.dir=a[2]; p.state=a[3]===0?'alive':a[3]===1?'trapped':'dead'; p.trapT=a[4]; p.maxB=a[5]; p.power=a[6]; p.spd=a[7]; p.needles=a[8]; p.moving=!!a[9]; });
    for(const n of m.e) env.sfx(n);
  }
  if(net){
    if(client) net.onmsg=m=>{ if(m.s) apply(m); else if(m.end!==undefined) conclude(m.end); };
    else { net.onmsg=(m,from)=>{ const inp=inputs[from]; if(!inp) return; if(m.d!==undefined) inp.dir=m.d; if(m.b) inp.bomb=true; };
      net.onleave=i=>{ const p=players[i]; if(p&&p.state!=='dead'){ p.state='dead'; sfx('pop'); } }; }
  }

  function update(dt){
    t+=dt;
    const myDir=local2?dirFrom([1],pressT[0]):dirFrom([0,1],pressT[0]),myBomb=local2?env.hit('Space'):env.hit('Space')||env.hit('Enter');
    if(client){
      const key=myDir+(myBomb?'b':''); if(key!==lastSent||myBomb){ net.send(myBomb?{d:myDir,b:1}:{d:myDir}); lastSent=''+myDir; }
      for(const p of players){ const f=Math.min(1,dt*20); if(Math.abs(p.x-p.rx)+Math.abs(p.y-p.ry)>2){ p.rx=p.x; p.ry=p.y; } else { p.rx+=(p.x-p.rx)*f; p.ry+=(p.y-p.ry)*f; } if(p.trapT>0) p.trapT-=dt; }
      for(let i=0;i<N;i++) if(flameT[i]>0) flameT[i]-=dt;
      for(const b of bombs) b.t-=dt;
      return;
    }
    inputs[me].dir=myDir; if(myBomb) inputs[me].bomb=true;
    if(local2){ inputs[1].dir=dirFrom([0],pressT[1]); if(env.hit('Enter')||env.hit('NumpadEnter')) inputs[1].bomb=true; }
    if(ended) return;
    time-=dt;
    for(let i=0;i<N;i++) if(flameT[i]>0) flameT[i]-=dt;
    for(let k=pending.length-1;k>=0;k--){ const it=pending[k]; it.t-=dt; if(it.t<=0){ pending.splice(k,1); if(!grid[it.i]&&!bombAt[it.i]&&flameT[it.i]<=0) items.set(it.i,it.type); } }
    for(const b of bombs) b.t-=dt;
    for(;;){ const b=bombs.find(b=>b.t<=0&&!b.done); if(!b) break; detonate(b); }

    for(const p of players){
      if(p.state==='dead') continue;
      if(p.inv>0) p.inv-=dt;
      let dir=-1,bomb=false;
      if(p.ai){ const a=p.ai; a.think-=dt;
        if(p.state==='alive'){ if(a.think<=0||(!a.path.length&&a.think<D.think[0]*.5)){ think(p); a.think=a.flee?D.flee:D.think[0]+Math.random()*(D.think[1]-D.think[0]); } dir=aiDir(p); }
        else if(p.needles>0&&p.trapT<TRAP-1) bomb=true;
      } else { const inp=inputs[p.id]; dir=inp.dir; bomb=inp.bomb; inp.bomb=false; }
      if(p.state==='trapped'){
        p.trapT-=dt;
        if(bomb&&p.needles>0){ p.needles--; p.state='alive'; p.inv=1.2; sfx('item'); }
        else { for(const q of players) if(q!==p&&q.state==='alive'&&Math.hypot(q.x-p.x,q.y-p.y)<.62){ p.trapT=0; break; }
          if(p.trapT<=0){ p.state='dead'; sfx('pop'); continue; } }
      } else if(bomb) placeBomb(p);
      p.moving=dir>=0;
      if(dir>=0){ p.dir=dir; step(p,dir,speedOf(p)*dt); }
      const c=cellOf(p);
      if(p.state==='alive'){
        const it=items.get(c);
        if(it){ items.delete(c); sfx('item'); const cap=p.human?99:D.cap; if(it==='b') p.maxB=Math.min(6,cap,p.maxB+1); else if(it==='p') p.power=Math.min(7,cap,p.power+1); else if(it==='s') p.spd=Math.min(5,p.spd+1); else p.needles=Math.min(3,p.needles+1); }
        if(flameT[c]>0&&p.inv<=0){ p.state='trapped'; p.trapT=TRAP; if(p.ai) p.ai.path=[]; sfx('trap'); }
      }
      p.rx=p.x; p.ry=p.y;
    }
    const alive=players.filter(p=>p.state!=='dead');
    let w;
    if(single&&players[0].state==='dead') w=-2; else if(local2&&players[0].state==='dead'&&players[1].state==='dead') w=-2; else if(alive.length<=1) w=alive.length?alive[0].id:-1; else if(time<=0) w=-1;
    if(w!==undefined){ overT+=dt; if(overT>1.2){ if(net){ net.send(snapshot()); net.send({end:w}); } conclude(w); } }
    if(net&&!ended){ sendT-=dt; if(sendT<=0){ sendT=.05; net.send(snapshot()); } }
  }

  function draw(){
    ctx.fillStyle='#0b0a1c'; ctx.fillRect(0,0,W,H);
    // 計分列
    ctx.textBaseline='middle'; ctx.textAlign='left'; ctx.font='14px '+PIX; ctx.fillStyle=time<30?'#ff5d8f':'#fff';
    const tm=Math.max(0,Math.ceil(time)); ctx.fillText(Math.floor(tm/60)+':'+String(tm%60).padStart(2,'0'),12,19);
    const wide=players.length<=4,cw=wide?127:84; // 超過 4 人時改用名字顏色表示狀態
    players.forEach((p,i)=>{ const x=92+i*cw,sc=p.state==='alive'?'#86dc4f':p.state==='trapped'?'#ffd23f':'#6b6799'; ctx.fillStyle='#211e45'; ctx.fillRect(x,5,cw-7,28);
      ctx.fillStyle=COLORS[i]; ctx.beginPath(); ctx.arc(x+13,19,7,0,7); ctx.fill();
      ctx.font='700 13px '+TC; ctx.fillStyle=wide?(p.state==='dead'?'#6b6799':'#fff'):sc; ctx.fillText(p.name,x+25,19);
      if(wide){ ctx.textAlign='right'; ctx.fillStyle=sc; ctx.fillText(p.state==='alive'?'存活':p.state==='trapped'?'被困':'出局',x+114,19); ctx.textAlign='left'; } });
    const mp=players[me]; ctx.font='700 13px '+TC; ctx.fillStyle='#aaa4d8';
    if(local2){ for(const q of [players[0],players[1]]){ ctx.fillStyle=COLORS[q.id]; ctx.fillText(q.name+'　水球 '+q.maxB+'　威力 '+q.power+'　速度 '+(q.spd+1)+'　針 '+q.needles,12+q.id*300,49); } }
    else ctx.fillText('水球 '+mp.maxB+'　威力 '+mp.power+'　速度 '+(mp.spd+1)+'　針 '+mp.needles,12,49);
    if(local2){} else if(mp.state==='trapped'){ ctx.textAlign='right'; ctx.fillStyle='#ffd23f'; ctx.fillText(mp.needles>0?'按水球鍵用針脫困！':'被困住了…',W-12,49); ctx.textAlign='left'; }
    else if(mp.state==='dead'&&net){ ctx.textAlign='right'; ctx.fillStyle='#aaa4d8'; ctx.fillText('已出局，觀戰中',W-12,49); ctx.textAlign='left'; }

    ctx.save(); ctx.translate(0,HUD);
    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) drawTile(ctx,st,grid[y*COLS+x],x*T,y*T,x,y);
    for(const [i,type] of items) drawItem(ctx,(i%COLS)*T,((i/COLS)|0)*T,type,t);
    for(const b of bombs){ const o=players[b.owner],L=o?o.look:null; drawBalloon(ctx,b.x*T+T/2,b.y*T+T/2,t+b.x,15,L&&L.bomb,L&&L.water); }
    for(let i=0;i<N;i++){ const f=flameT[i]; if(f<=0) continue; const x=(i%COLS)*T,y=((i/COLS)|0)*T,k=Math.min(1,f/.2),m=(1-k)*10;
      ctx.fillStyle='rgba('+rgb(WATER[flameC[i]]||WATER[0]).join(',')+','+(.55+.4*k)+')'; ctx.fillRect(x+m,y+m,T-2*m,T-2*m);
      ctx.fillStyle='rgba(255,255,255,'+.75*k+')'; ctx.fillRect(x+m+8,y+m+8,T-2*m-16,T-2*m-16); }
    const order=players.filter(p=>p.state!=='dead').sort((a,b)=>a.ry-b.ry);
    for(const p of order){ const cx=p.rx*T+T/2,cy=p.ry*T+T/2;
      if(p.state==='trapped'){ const bob=Math.sin(t*5)*2; if(p.trapT<1.5&&Math.floor(t*10)%2) ctx.globalAlpha=.6;
        drawChar(ctx,cx,cy+bob,COLORS[p.id],1,false,t,.72,p.look.char);
        ctx.fillStyle='rgba(120,200,255,.5)'; ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx,cy+bob,18,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(cx-7,cy+bob-8,5,3,-.6,0,7); ctx.fill(); ctx.globalAlpha=1; }
      else { if(p.inv>0&&Math.floor(t*14)%2) ctx.globalAlpha=.5; drawChar(ctx,cx,cy-4,COLORS[p.id],p.dir,p.moving,t,1,p.look.char); ctx.globalAlpha=1; }
      if(p.id===me||(local2&&p.id<2)){ ctx.fillStyle=local2?COLORS[p.id]:'#fff'; ctx.beginPath(); ctx.moveTo(cx-5,cy-30); ctx.lineTo(cx+5,cy-30); ctx.lineTo(cx,cy-23); ctx.fill(); } }
    ctx.restore();
  }
  return {update,draw,destroy(){},_dbg:{players,grid,bombs:()=>bombs,inputs}};
}

function preview(ctx,w,h,L,t){
  const st=STAGES[0]; for(let y=0;y<5;y++) for(let x=0;x<9;x++){ ctx.fillStyle=st.g[(x+y)%2]; ctx.fillRect(x*T,y*T,T,T); }
  ctx.save(); ctx.translate(w*.3,h*.56); ctx.scale(3,3); drawChar(ctx,0,0,COLORS[0],1,true,t,1,L.char); ctx.restore();
  const ph=(t%2.4)/2.4;
  if(ph<.7){ ctx.save(); ctx.translate(w*.72,h*.52); ctx.scale(2.6,2.6); drawBalloon(ctx,0,0,t,15,L.bomb,L.water); ctx.restore(); }
  else { const k=1-(ph-.7)/.3,c=rgb(L.water).join(','); ctx.fillStyle='rgba('+c+','+(.5+.4*k)+')'; ctx.fillRect(w*.72-70,h*.52-22,140,44); ctx.fillRect(w*.72-22,h*.52-70,44,140);
    ctx.fillStyle='rgba(255,255,255,'+.7*k+')'; ctx.fillRect(w*.72-58,h*.52-10,116,20); ctx.fillRect(w*.72-10,h*.52-58,20,116); }
}

// 用這個場景的地形和配色畫一張實際的遊戲畫面（箱子位置固定，方便每次看到一樣的圖）
function stagePreview(ctx,w,h,si){
  const st=STAGES[si],k=w/W; let seed=si*7919+13; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
  const keep=new Set(); for(const [sx,sy] of SPAWN.slice(0,4)) for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]]) keep.add((sy+dy)*COLS+sx+dx);
  ctx.save(); ctx.scale(k,k); ctx.fillStyle='#0b0a1c'; ctx.fillRect(0,0,W,ROWS*T);
  const open=new Set([3*COLS+2,3*COLS+3,2*COLS+2,9*COLS+12,9*COLS+11,10*COLS+12,6*COLS+7,6*COLS+6,6*COLS+8,5*COLS+6]);
  for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){ const i=y*COLS+x,v=st.solid(x,y)?1:(!keep.has(i)&&!open.has(i)&&rnd()<st.box?2:0); drawTile(ctx,st,v,x*T,y*T,x,y); }
  const flame=(x,y,c)=>{ if(st.solid(x,y)) return; ctx.fillStyle='rgba('+rgb(c).join(',')+',.9)'; ctx.fillRect(x*T+3,y*T+3,T-6,T-6); ctx.fillStyle='rgba(255,255,255,.7)'; ctx.fillRect(x*T+11,y*T+11,T-22,T-22); };
  for(const [x,y] of [[6,6],[7,6],[8,6],[6,5]]) flame(x,y,WATER[1]);
  drawBalloon(ctx,2*T+20,3*T+20,0,15,'ball',WATER[0]); drawBalloon(ctx,12*T+20,9*T+20,0,15,'star',WATER[3]);
  drawItem(ctx,3*T,3*T,'p',0); drawItem(ctx,11*T,9*T,'s',0);
  [[0,0,'cap',3],[14,12,'ninja',2],[14,0,'pirate',1],[0,12,'chef',0],[2,2,'bow',1]].forEach((a,n)=>drawChar(ctx,a[0]*T+20,a[1]*T+16,COLORS[n],a[3],false,0,1,a[2]));
  ctx.restore();
}
const stageInfo=si=>STAGES[si].info;

function thumb(ctx,w,h,t){
  const st=STAGES[0],ox=0,oy=-10;
  ctx.save(); ctx.scale(w/480,w/480);
  const map=['000220002200','010101010101','020002200020','010101010101','002200002200','010101010101','000022000020'];
  for(let y=0;y<7;y++) for(let x=0;x<12;x++) drawTile(ctx,st,+map[y][x],ox+x*T,oy+y*T,x,y);
  const ph=(t%3)/3;
  if(ph<.8) drawBalloon(ctx,ox+4*T+20,oy+2*T+20,t);
  else for(const [x,y] of [[4,2],[3,2],[5,2],[4,1],[4,3]]){ ctx.fillStyle='rgba(87,168,255,.9)'; ctx.fillRect(ox+x*T,oy+y*T,T,T); ctx.fillStyle='rgba(255,255,255,.7)'; ctx.fillRect(ox+x*T+8,oy+y*T+8,T-16,T-16); }
  drawItem(ctx,ox+8*T,oy+4*T,'p',t); drawItem(ctx,ox+2*T,oy+4*T,'s',t);
  drawChar(ctx,ox+(6+Math.min(1,ph*2)*1.6)*T+20,oy+2*T+16,COLORS[0],3,ph<.5,t);
  drawChar(ctx,ox+9*T+20,oy+(6-Math.abs(Math.sin(t*.8))*2)*T+16,COLORS[1],0,true,t);
  drawChar(ctx,ox+1*T+20,oy+0*T+16,COLORS[2],1,false,t);
  ctx.restore();
}

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).bomb={
  name:'爆爆王',tag:'WATER BOMB',color:'#ff5d8f',online:true,maxPlayers:6,bots:true,minPlayers:2,
  desc:'放水球炸開箱子、撿道具，把對手困進水泡再碰破。7 個場景、電腦有簡單／中等／困難三種強度，可單人、兩人同一台，或開房間連線對戰。',
  goal:'放水球把對手困進水泡，再走過去碰破。自己被困住時，有針可以脫困；沒有針就會出局。',
  stages:STAGES.map(s=>s.name),stageSize:[360,312],
  variants:[{id:'easy',label:'電腦：簡單'},{id:'normal',label:'電腦：中等',def:true},{id:'hard',label:'電腦：困難'}],
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['↑ ↓ ← →','移動'],['Space','放水球，被困時用針'],['W A S D Space','雙人 1P'],['↑ ↓ ← → Enter','雙人 2P']],
  touchHelp:[['方向盤','移動'],['水球','放水球，被困時用針']],
  touch:{left:'dpad',right:[{l:'水球',c:'Space',act:true}]},
  best:{label:'已過關',fmt:v=>v+' / '+STAGES.length,lower:false},
  looks:[{key:'char',label:'人物',opts:[{id:'cap',label:'帽子'},{id:'cat',label:'貓耳'},{id:'bunny',label:'兔耳'},{id:'crown',label:'皇冠'},{id:'chef',label:'廚師'},{id:'pirate',label:'海盜'},{id:'ninja',label:'忍者'},{id:'bow',label:'蝴蝶結'}]},
    {key:'bomb',label:'炸彈造型',opts:[{id:'ball',label:'水球'},{id:'star',label:'星星'},{id:'melon',label:'西瓜紋'}]},
    {key:'water',label:'水球顏色',type:'color',opts:['#57a8ff','#ff7eb6','#5fd068','#ff9d3d','#b98cff','#3ddbd9']}],
  stagePreview,stageInfo,preview,thumb,create
};
})();
