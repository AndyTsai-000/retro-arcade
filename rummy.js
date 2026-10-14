// 拉密（Rummikub）：106 張牌（1～13 紅藍橘黑各兩副＋2 張鬼牌），每人 14 張。
// 牌組：同數字不同顏色 3～4 張（群組），或同顏色連號 3 張以上（順子）。鬼牌可以代替任何牌。
// 第一次出牌要用自己的牌組出合計 30 分以上；之後可以把桌上的牌重新拆組，只要回合結束時桌上每一組都合法。
// 不出牌就摸一張。先把手牌出完的人獲勝。
// 連線時房主負責發牌與判定，輪到的人在自己畫面排好後送出整個桌面。
(function(){
'use strict';
const W=800,H=500,TW=30,TH=40,RACK_Y=372,PIX='"Press Start 2P","Noto Sans TC","Microsoft JhengHei",monospace',TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const COL=['#e23b3b','#2f6fd0','#e08a1a','#22222c'],CNAME=['紅','藍','橘','黑'];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const isJ=t=>t.c===4;

/* ---------- 規則：判斷一組牌合不合法、值多少分、怎麼排 ---------- */
function analyze(tiles){
  if(tiles.length<3) return null;
  const js=tiles.filter(isJ),ns=tiles.filter(t=>!isJ(t)),L=tiles.length;
  if(!ns.length) return {kind:'run',vals:tiles.map((_,i)=>i+1),order:tiles.slice()};
  // 群組
  if(L<=4&&ns.every(t=>t.n===ns[0].n)&&new Set(ns.map(t=>t.c)).size===ns.length){
    const order=ns.slice().sort((a,b)=>a.c-b.c).concat(js); return {kind:'group',vals:order.map(()=>ns[0].n),order}; }
  // 順子
  if(ns.every(t=>t.c===ns[0].c)&&new Set(ns.map(t=>t.n)).size===ns.length&&L<=13){
    const s=ns.slice().sort((a,b)=>a.n-b.n),lo=s[0].n,hi=s[s.length-1].n,gaps=hi-lo+1-ns.length;
    if(gaps>js.length) return null;
    let extra=js.length-gaps,start=lo; const up=Math.min(extra,13-hi); extra-=up; start=lo-extra; if(start<1) return null;
    const len=L,order=[],vals=[]; let ji=0,si=0;
    for(let v=start;v<start+len;v++){ if(si<s.length&&s[si].n===v){ order.push(s[si++]); } else order.push(js[ji++]); vals.push(v); }
    return {kind:'run',vals,order};
  }
  return null;
}
const setValue=tiles=>{ const a=analyze(tiles); return a?a.vals.reduce((x,y)=>x+y,0):0; };
const tilePenalty=t=>isJ(t)?30:t.n;

function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,me=net?net.me:0;
  const humans=net?net.count:1,np=net?Math.min(4,net.count+(net.bots||0)):1+(+(opts.variant||2)||2); // 連線時電腦由房主決定
  const L=opts.look||{felt:'#1f6b4a'};
  const {ctx,canvas}=env.canvas2d(W,H);
  const names=[];
  for(let i=0;i<np;i++) names.push(i<humans?(net?(net.names&&net.names[i])||'玩家'+(i+1):(opts.name||'你')):'電腦 '+(i-humans+1));
  // 牌：id 0..105
  const TILES=[]; for(let k=0;k<2;k++) for(let c=0;c<4;c++) for(let n=1;n<=13;n++) TILES.push({id:TILES.length,c,n}); TILES.push({id:104,c:4,n:0}); TILES.push({id:105,c:4,n:0});
  const T=id=>TILES[id];
  // 房主（或單機）持有的完整狀態
  let G={deck:[],racks:[],table:[],melded:[],turn:0,passes:0,over:null,scores:new Array(np).fill(0),gone:new Array(np).fill(false),log:''};
  // 自己這一回合在畫面上的編輯狀態
  let E=null,drag=null,msg='',msgT=0,t=0,aiT=0,sortMode=0,turnT=0,ended=false,lastTurn=-1,hover=null,sendT=0;
  const TIMES=[60,90,120,180,0];
  let TURN_SEC=(()=>{ let v=null; try{ v=localStorage.getItem('arcade.rummy.time'); }catch(_){} v=v==null?(net?90:0):+v; return TIMES.includes(v)?v:90; })();
  function setTime(v){ TURN_SEC=v; turnT=v; try{ localStorage.setItem('arcade.rummy.time',String(v)); }catch(_){} G.ts=v; broadcast(); }
  function cycleTime(){ if(client) return; setTime(TIMES[(TIMES.indexOf(TURN_SEC)+1)%TIMES.length]); say(TURN_SEC?'每回合思考時間 '+TURN_SEC+' 秒':'思考時間不限',1.4); sfx('click'); }
  const sfx=n=>env.sfx(n);
  const say=(s,sec)=>{ msg=s; msgT=sec||2; };

  function deal(){
    const d=TILES.map(t=>t.id); for(let i=d.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [d[i],d[j]]=[d[j],d[i]]; }
    G.deck=d; G.racks=[]; for(let p=0;p<np;p++) G.racks.push(d.splice(0,14)); G.melded=new Array(np).fill(false); G.table=[]; G.turn=Math.floor(Math.random()*np); G.passes=0;
  }
  const isMyTurn=()=>!G.over&&G.turn===me&&!G.gone[me];
  const isAI=p=>p>=humans;
  function beginEdit(){ // 回合開始時記下原本的桌面，可以「復原」
    E={table:G.table.map(s=>s.slice()),rack:G.racks[me].slice(),start:G.table.map(s=>s.slice()),startRack:G.racks[me].slice()};
    sortRack(); turnT=TURN_SEC;
  }
  function sortRack(){ if(!E) return; E.rack.sort(sortMode===0?(a,b)=>(T(a).c-T(b).c)||(T(a).n-T(b).n):(a,b)=>(T(a).n-T(b).n)||(T(a).c-T(b).c)); }

  /* ---- 回合結束的檢查 ---- */
  function checkPlay(p,table,rack){
    const start=G.table,startRack=G.racks[p];
    if(rack.length>=startRack.length) return '至少要從手牌出一張到桌上，或按「摸牌」。';
    for(const s of table){ if(!analyze(s.map(T))) return '桌上有不成立的牌組（紅框），要 3 張以上的同色連號或同數字不同色。'; }
    // 原本在桌上的牌不能拿回手牌
    const onTable=new Set(table.flat()); for(const s of start) for(const id of s) if(!onTable.has(id)) return '桌上的牌不能收回手牌。';
    if(!G.melded[p]){ // 第一次出牌：不能動到桌上原有的牌組，自己出的牌要湊滿 30 分
      const key=s=>s.slice().sort((a,b)=>a-b).join(','),keep=new Map(); for(const s of start) keep.set(key(s),(keep.get(key(s))||0)+1);
      let pts=0;
      for(const s of table){ const k=key(s); if(keep.get(k)){ keep.set(k,keep.get(k)-1); continue; } if(s.some(id=>!startRack.includes(id))) return '第一次出牌時不能動到桌上原有的牌。'; pts+=setValue(s.map(T)); }
      for(const v of keep.values()) if(v>0) return '第一次出牌時不能動到桌上原有的牌。';
      if(pts<30) return '第一次出牌要用自己的牌組湊滿 30 分（現在 '+pts+' 分）。';
    }
    return null;
  }
  function applyPlay(p,table,rack){
    G.table=table.map(s=>{ const a=analyze(s.map(T)); return a?a.order.map(x=>x.id):s; }); G.racks[p]=rack.slice(); G.melded[p]=true; G.passes=0;
    sfx('item'); G.log=names[p]+(G.racks[p].length?' 出牌了':' 出完最後一張牌！');
    if(!G.racks[p].length) finish(p); else nextTurn();
  }
  function drawPass(p){
    if(G.deck.length){ G.racks[p].push(G.deck.pop()); G.passes=0; G.log=names[p]+' 摸了一張牌'; } else { G.passes++; G.log=names[p]+' 沒牌可摸，跳過'; }
    sfx('click'); if(G.passes>=np) finish(-1); else nextTurn();
  }
  function nextTurn(){ for(let k=0;k<np;k++){ G.turn=(G.turn+1)%np; if(!G.gone[G.turn]) break; } aiT=0; }
  function finish(w){
    if(w<0){ let best=0,bs=1e9; G.racks.forEach((r,i)=>{ if(G.gone[i]) return; const s=r.reduce((a,id)=>a+tilePenalty(T(id)),0); if(s<bs){ bs=s; best=i; } }); w=best; }
    const pen=G.racks.map(r=>r.reduce((a,id)=>a+tilePenalty(T(id)),0)); let gain=0;
    G.scores=G.scores.map((s,i)=>{ if(i===w) return s; gain+=pen[i]; return s-pen[i]; }); G.scores[w]+=gain; G.over={w,pen};
  }

  /* ---- 電腦：找出手牌裡能組的牌組，已經出過牌的話再試著接到桌上 ---- */
  function aiMove(p){
    const rack=G.racks[p].slice(),used=new Set(),sets=[],jok=rack.filter(id=>isJ(T(id)));
    const free=id=>!used.has(id);
    // 順子
    for(let c=0;c<4;c++){
      const byN=new Map(); for(const id of rack){ const t=T(id); if(t.c===c&&!byN.has(t.n)) byN.set(t.n,id); }
      let run=[]; for(let n=1;n<=14;n++){ if(byN.has(n)&&free(byN.get(n))) run.push(byN.get(n)); else { if(run.length>=3){ sets.push(run.slice()); run.forEach(id=>used.add(id)); } run=[]; } }
    }
    // 群組
    for(let n=1;n<=13;n++){ const pick=[],cs=new Set(); for(const id of rack){ const t=T(id); if(free(id)&&t.n===n&&!cs.has(t.c)){ cs.add(t.c); pick.push(id); } } if(pick.length>=3){ sets.push(pick); pick.forEach(id=>used.add(id)); } }
    // 用鬼牌補兩張的組合
    let jl=jok.filter(free);
    if(jl.length) for(let n=13;n>=1&&jl.length;n--){ const pick=[],cs=new Set(); for(const id of rack){ const t=T(id); if(free(id)&&!isJ(t)&&t.n===n&&!cs.has(t.c)){ cs.add(t.c); pick.push(id); } } if(pick.length===2){ const j=jl.pop(); pick.push(j); sets.push(pick); pick.forEach(id=>used.add(id)); } }
    let table=G.table.map(s=>s.slice());
    const pts=sets.reduce((a,s)=>a+setValue(s.map(T)),0);
    if(!G.melded[p]&&pts<30) return null;
    table=table.concat(sets);
    if(G.melded[p]){ // 接到桌上現有的牌組尾巴
      let moved=true; while(moved){ moved=false; for(const id of rack){ if(used.has(id)) continue; for(const s of table){ if(analyze(s.concat([id]).map(T))){ s.push(id); used.add(id); moved=true; break; } } } }
    }
    if(!used.size) return null;
    return {table,rack:rack.filter(id=>!used.has(id))};
  }

  /* ---- 連線 ---- */
  function pub(){ return {ts:TURN_SEC,racks:G.racks,table:G.table,turn:G.turn,melded:G.melded,deckN:G.deck.length,over:G.over,scores:G.scores,gone:G.gone,log:G.log}; }
  function broadcast(){ if(net&&net.host) net.send({st:pub()}); }
  if(net){
    if(client) net.onmsg=m=>{ if(m.st){ const s=m.st; G.racks=s.racks; G.table=s.table; G.turn=s.turn; G.melded=s.melded; G.deckN=s.deckN; G.over=s.over; G.scores=s.scores; G.gone=s.gone; if(s.ts!=null&&s.ts!==TURN_SEC){ TURN_SEC=s.ts; turnT=s.ts; } if(s.log&&s.log!==G.log){ G.log=s.log; } } if(m.bad&&m.bad[0]===me){ say(m.bad[1],3); sfx('bump'); if(E) E.sent=false; } };
    else { net.onmsg=(m,from)=>{ if(G.over||G.turn!==from) return;
        if(m.draw){ drawPass(from); broadcast(); }
        else if(m.play){ const err=checkPlay(from,m.play.table,m.play.rack); if(err){ net.send({bad:[from,err]}); } else { applyPlay(from,m.play.table,m.play.rack); } broadcast(); } };
      net.onleave=i=>{ G.gone[i]=true; G.deck=G.deck.concat(G.racks[i]); G.racks[i]=[]; if(G.turn===i) nextTurn(); if(G.gone.filter(g=>!g).length<=1) finish(G.gone.indexOf(false)); broadcast(); }; }
  }
  if(!client){ deal(); broadcast(); } else G.deckN=0;

  /* ---- 操作：拖曳牌 ---- */
  const layout={table:[],rack:[],btn:[]};
  function toLogical(e){ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=(r.width-W*s)/2,oy=(r.height-H*s)/2; return [(e.clientX-r.left-ox)/s,(e.clientY-r.top-oy)/s]; }
  function hitTile(x,y){
    for(const b of layout.rack) if(x>=b.x-1&&x<b.x+TW+1&&y>=b.y-4&&y<b.y+TH+4) return {from:'rack',i:b.i,id:b.id};
    for(const b of layout.table) if(x>=b.x-1&&x<b.x+TW+1&&y>=b.y-5&&y<b.y+TH+5) return {from:'table',s:b.s,i:b.i,id:b.id};
    return null;
  }
  function onDown(e){ e.preventDefault(); const [x,y]=toLogical(e);
    for(const b of layout.btn) if(x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h){ b.fn(); return; }
    if(!E||G.over) return; const h=hitTile(x,y); if(!h) return;
    if(h.from==='table'&&!isMyTurn()) return;
    drag={...h,x,y,ox:x,oy:y,moved:false,lift:e.pointerType==='touch'?30:0}; try{ canvas.setPointerCapture(e.pointerId); }catch(_){} }
  function onMove(e){ if(!drag) return; e.preventDefault(); const [x,y]=toLogical(e); drag.x=x; drag.y=y; if(Math.hypot(x-drag.ox,y-drag.oy)>5) drag.moved=true; }
  function onUp(e){
    if(!drag) return; const d=drag; drag=null; if(!d.moved){ // 輕點：手牌直接放到桌上新的一組（輪到自己時）
      if(d.from==='rack'&&isMyTurn()){ removeFrom(d); dropTo({kind:'newset'},d.id); } return; }
    const [x,y0]=toLogical(e),y=y0-d.lift; const tgt=dropTarget(x,y,d);
    if(!tgt) return;
    if(tgt.kind==='rack'&&d.from==='table'&&!E.startRack.includes(d.id)){ say('桌上原本的牌不能收回手牌。'); return; }
    if(tgt.kind!=='rack'&&!isMyTurn()){ say('還沒輪到你。'); return; }
    removeFrom(d); dropTo(tgt,d.id); sfx('click');
  }
  function removeFrom(d){
    if(d.from==='rack') E.rack.splice(E.rack.indexOf(d.id),1);
    else { const s=E.table[d.s]; s.splice(s.indexOf(d.id),1);
      // 從順子中間抽走一張時，在斷掉的地方自動分成兩段
      const ts=s.map(T); if(s.length>=2&&!analyze(ts)&&ts.every(t=>!isJ(t)&&t.c===ts[0].c)){ const o=s.slice().sort((a,b)=>T(a).n-T(b).n),parts=[[o[0]]];
        for(let i=1;i<o.length;i++){ if(T(o[i]).n===T(o[i-1]).n+1) parts[parts.length-1].push(o[i]); else parts.push([o[i]]); }
        if(parts.length>1) E.table.splice(d.s,1,...parts); } }
    E.table=E.table.filter(s=>s.length); }
  function dropTo(tgt,id){
    if(tgt.kind==='rack'){ E.rack.splice(clamp(tgt.i,0,E.rack.length),0,id); }
    else if(tgt.kind==='set'){ const s=E.table[tgt.s]; if(!s){ E.table.push([id]); return; } s.splice(clamp(tgt.i,0,s.length),0,id);
      if(!analyze(s.map(T))){ const sp=autoSplit(s); if(sp){ E.table.splice(tgt.s,1,sp[0],sp[1]); say('自動拆成兩組',1.4); } } }
    else E.table.push([id]);
  }
  // 放進去之後牌組不成立時，試著拆成兩組都成立的牌組（例如 3456789 放進一張 5 → 345 和 56789）
  function autoSplit(ids){
    const js=ids.filter(id=>isJ(T(id))),ns=ids.filter(id=>!isJ(T(id))).sort((a,b)=>T(a).n-T(b).n);
    if(ns.length<2||!ns.every(id=>T(id).c===T(ns[0]).c)) return null;
    for(let k=1;k<ns.length;k++) for(let m=0;m<=js.length;m++){ // 前段 k 張數字牌加上 m 張鬼牌，其餘給後段
      const a=ns.slice(0,k).concat(js.slice(0,m)),b=ns.slice(k).concat(js.slice(m));
      const A=analyze(a.map(T)),B=analyze(b.map(T)); if(A&&B) return [A.order.map(t=>t.id),B.order.map(t=>t.id)]; }
    return null;
  }
  function dropTarget(x,y,d){
    if(y>=RACK_Y-6){ let best=E.rack.length,bd=1e9; for(const b of layout.rack){ if(b.id===d.id) continue; const dd=Math.abs(b.x+TW/2-x)+Math.abs(b.y+TH/2-y)*2; if(dd<bd){ bd=dd; best=b.i+(x>b.x+TW/2?1:0); } } return {kind:'rack',i:best}; }
    for(const g of layout.sets){ if(x>=g.x-14&&x<=g.x+g.w+14&&y>=g.y-6&&y<=g.y+TH+6){ const i=Math.round((x-g.x)/TW); return {kind:'set',s:g.s,i}; } }
    return {kind:'newset'};
  }
  canvas.style.touchAction='none';
  canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointermove',onMove); canvas.addEventListener('pointerup',onUp); canvas.addEventListener('pointercancel',()=>{ drag=null; });

  function doDone(){
    if(!isMyTurn()||!E) return;
    const err=checkPlay(me,E.table,E.rack); if(err){ say(err,3.2); sfx('bump'); return; }
    if(client){ net.send({play:{table:E.table,rack:E.rack}}); E.sent=true; return; }
    applyPlay(me,E.table,E.rack); broadcast();
  }
  function doDraw(){ if(!isMyTurn()) return; if(client){ net.send({draw:1}); E.sent=true; return; } drawPass(me); broadcast(); }
  function doUndo(){ if(!E||!isMyTurn()) return; E.table=E.start.map(s=>s.slice()); E.rack=E.startRack.slice(); sortRack(); sfx('click'); }
  function doSort(){ sortMode=1-sortMode; sortRack(); sfx('click'); }

  function update(dt){
    t+=dt; if(msgT>0) msgT-=dt;
    if(G.over){ if(!ended){ ended=true; const w=G.over.w,win=w===me; setTimeout(()=>{ env.sfx(win?'win':'lose');
      env.end({title:win?'你贏了！':names[w]+' 獲勝',big:'',html:'<ul class="rest">'+names.map((n,i)=>'<li>'+n+'　剩 '+(G.racks[i]||[]).length+' 張　'+(G.scores[i]>0?'+':'')+G.scores[i]+' 分'+(G.gone[i]?'（離開）':'')+'</li>').join('')+'</ul>',text:'剩下的牌每張照數字扣分，鬼牌扣 30 分；贏家拿走大家扣的分數。',score:win?G.scores[me]:null}); },900); } return; }
    // 換人時重設自己的編輯狀態
    if(G.turn!==lastTurn||!E){ lastTurn=G.turn; E=null; beginEdit(); if(isMyTurn()) say('輪到你了',1.4); }
    else if(!isMyTurn()){ // 別人的回合：自己的手牌可以照樣排，但桌面跟著最新狀態
      E.table=G.table.map(s=>s.slice()); const mine=G.racks[me]; if(E.rack.length!==mine.length||mine.some(id=>!E.rack.includes(id))){ E.rack=mine.slice(); sortRack(); } E.startRack=mine.slice(); E.start=G.table.map(s=>s.slice()); }
    if(TURN_SEC&&isMyTurn()&&!E.sent){ turnT-=dt; if(turnT<=0){ say('時間到，自動摸一張牌',2); doUndo(); doDraw(); } }
    if(!client&&isAI(G.turn)&&!G.gone[G.turn]){ aiT+=dt; if(aiT>1.1){ const mv=aiMove(G.turn); if(mv){ applyPlay(G.turn,mv.table,mv.rack); } else drawPass(G.turn); broadcast(); } }
    if(net&&net.host){ sendT-=dt; if(sendT<=0){ sendT=2; broadcast(); } }
  }

  /* ---- 畫面 ---- */
  const dp=new Map(); // 每張牌目前畫在哪裡，往目標位置滑過去
  function slide(id,x,y){ let p=dp.get(id); if(!p){ p={x,y}; dp.set(id,p); } p.x+=(x-p.x)*.32; p.y+=(y-p.y)*.32; if(Math.abs(x-p.x)<.4) p.x=x; if(Math.abs(y-p.y)<.4) p.y=y; return p; }
  function tile(x,y,id,opt){
    const tl=T(id),o=opt||{};
    ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(x+2,y+3,TW,TH);
    ctx.fillStyle=o.ghost?'rgba(255,248,230,.5)':'#fff8e6'; ctx.beginPath(); ctx.roundRect?ctx.roundRect(x,y,TW-2,TH,4):ctx.rect(x,y,TW-2,TH); ctx.fill();
    ctx.strokeStyle=o.sel?'#ffd23f':o.newT?'#3ddbd9':'#c9b89a'; ctx.lineWidth=o.sel||o.newT?2:1; ctx.stroke();
    ctx.fillStyle='#e9dcc0'; ctx.fillRect(x+3,y+TH-9,TW-8,5);
    ctx.textAlign='center'; ctx.textBaseline='middle';
    if(isJ(tl)){ ctx.font='900 17px '+TC; ctx.fillStyle=tl.id===104?'#e23b3b':'#22222c'; ctx.fillText('☺',x+TW/2-1,y+15); ctx.font='700 8px '+TC; ctx.fillText('鬼',x+TW/2-1,y+28); }
    else { ctx.font='900 17px '+TC; ctx.fillStyle=COL[tl.c]; ctx.fillText(String(tl.n),x+TW/2-1,y+16); ctx.beginPath(); ctx.arc(x+TW/2-1,y+29,2.5,0,7); ctx.fill(); }
  }
  function button(x,y,w,h,label,on,fn,hot){ ctx.fillStyle=on?(hot?'#ffd23f':'#3a3670'):'#2b2759'; ctx.fillRect(x,y,w,h); ctx.strokeStyle='#0b0a1c'; ctx.lineWidth=2; ctx.strokeRect(x,y,w,h);
    ctx.fillStyle=on?(hot?'#14122b':'#fff'):'#6b6799'; ctx.font='900 14px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(label,x+w/2,y+h/2+1); if(on) layout.btn.push({x,y,w,h,fn}); }
  function draw(){
    layout.table=[]; layout.rack=[]; layout.btn=[]; layout.sets=[];
    ctx.fillStyle=L.felt; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='rgba(255,255,255,.04)'; for(let i=0;i<W;i+=8) ctx.fillRect(i,0,1,H);
    // 上方：每位玩家
    const pw=W/np; ctx.textBaseline='middle';
    for(let i=0;i<np;i++){ const x=i*pw,act=G.turn===i&&!G.over; ctx.fillStyle=act?'rgba(255,210,63,.25)':'rgba(11,10,28,.55)'; ctx.fillRect(x+3,3,pw-6,30);
      ctx.textAlign='left'; ctx.font='900 13px '+TC; ctx.fillStyle=G.gone[i]?'#6b6799':i===me?'#ffd23f':'#fff'; ctx.fillText((act?'▶ ':'')+names[i],x+10,14);
      ctx.font='700 10px '+TC; ctx.fillStyle='#cfe8d8'; ctx.fillText((G.racks[i]?G.racks[i].length:0)+' 張'+(G.melded[i]?'':'　尚未破冰'),x+10,26);
      if(act&&TURN_SEC&&i===me){ ctx.textAlign='right'; ctx.fillStyle=turnT<15?'#ff5d8f':'#fff'; ctx.font='11px '+PIX; ctx.fillText(Math.max(0,Math.ceil(turnT))+'',x+pw-10,18); } }
    // 牌堆
    const deckN=client?G.deckN:G.deck.length; ctx.fillStyle='#7a2a45'; ctx.fillRect(W-58,42,40,52); ctx.strokeStyle='#0b0a1c'; ctx.lineWidth=2; ctx.strokeRect(W-58,42,40,52); ctx.fillStyle='#fff'; ctx.font='900 13px '+TC; ctx.textAlign='center'; ctx.fillText(deckN,W-38,62); ctx.font='700 9px '+TC; ctx.fillText('牌堆',W-38,82);
    ctx.fillStyle='#cfe8d8'; ctx.font='700 10px '+TC; ctx.textAlign='center'; ctx.fillText('思考時間',W-38,108);
    button(W-66,116,56,26,TURN_SEC?TURN_SEC+'秒':'不限',!client,cycleTime);
    if(client){ ctx.fillStyle='#cfe8d8'; ctx.font='700 13px '+TC; ctx.textAlign='center'; ctx.fillText(TURN_SEC?TURN_SEC+'秒':'不限',W-38,130); }
    // 桌面
    const table=E?E.table:G.table,startSet=E?new Set(E.start.flat()):new Set();
    let x=14,y=46; const maxX=W-72;
    table.forEach((s,si)=>{ const w=s.length*TW; if(x+w>maxX&&x>14){ x=14; y+=TH+12; }
      const ok=!!analyze(s.map(T)); ctx.strokeStyle=ok?'rgba(134,220,79,.7)':'rgba(255,93,143,.9)'; ctx.lineWidth=2; ctx.strokeRect(x-4,y-4,w+4,TH+8);
      layout.sets.push({s:si,x,y,w});
      s.forEach((id,i)=>{ const p=slide(id,x+i*TW,y); if(drag&&drag.moved&&drag.id===id){ tile(p.x,p.y,id,{ghost:true}); return; } tile(p.x,p.y,id,{newT:E&&!startSet.has(id)}); layout.table.push({s:si,i,id,x:x+i*TW,y}); });
      x+=w+16; });
    if(x+TW>maxX){ x=14; y+=TH+12; } const slot={x,y}; // 下一組會放的位置
    if(!table.length){ ctx.fillStyle='rgba(255,255,255,.35)'; ctx.font='700 15px '+TC; ctx.textAlign='center'; ctx.fillText(isMyTurn()?'把手牌拖到這裡組成牌組（點一下手牌也會放上來）':'桌面還是空的',W/2-30,180); }
    // 手牌
    ctx.fillStyle='rgba(11,10,28,.6)'; ctx.fillRect(0,RACK_Y-10,W,H-RACK_Y+10);
    const rack=E?E.rack:(G.racks[me]||[]),perRow=Math.floor((W-150)/TW);
    rack.forEach((id,i)=>{ const rx=10+(i%perRow)*TW,ry=RACK_Y+Math.floor(i/perRow)*(TH+8),p=slide(id,rx,ry); if(drag&&drag.moved&&drag.id===id){ tile(p.x,p.y,id,{ghost:true}); return; } tile(p.x,p.y,id); layout.rack.push({i,id,x:rx,y:ry}); });
    // 按鈕
    const bx=W-132,my=isMyTurn()&&E&&!E.sent;
    button(bx,RACK_Y-4,58,30,'完成',my,doDone,true); button(bx+64,RACK_Y-4,58,30,'摸牌',my,doDraw);
    button(bx,RACK_Y+32,58,30,'復原',my,doUndo); button(bx+64,RACK_Y+32,58,30,sortMode?'按數字':'按顏色',true,doSort);
    if(E){ const rest=E.startRack.length-E.rack.length; ctx.textAlign='right'; ctx.font='700 11px '+TC; ctx.fillStyle='#cfe8d8';
      let info=isMyTurn()?'這回合出了 '+rest+' 張':'等 '+names[G.turn]+' 出牌…';
      if(isMyTurn()&&!G.melded[me]){ const key=s=>s.slice().sort((a,b)=>a-b).join(','),old=new Set(E.start.map(key)); const pts=E.table.filter(s=>!old.has(key(s))).reduce((a,s)=>a+setValue(s.map(T)),0); info+='　破冰分數 '+pts+' / 30'; }
      ctx.fillText(info,W-10,RACK_Y-20); }
    if(drag&&drag.moved){ // 標出放開後會落在哪裡
      const gy=drag.y-drag.lift,tg=dropTarget(drag.x,gy,drag); ctx.fillStyle='#ffd23f';
      if(tg.kind==='set'){ const g=layout.sets.find(q=>q.s===tg.s); if(g) ctx.fillRect(g.x+clamp(tg.i,0,99)*TW-3,g.y-6,4,TH+12); }
      else if(tg.kind==='rack'){ const b=layout.rack.find(q=>q.i===tg.i)||layout.rack[layout.rack.length-1]; if(b) ctx.fillRect(b.i===tg.i?b.x-3:b.x+TW-1,b.y-4,4,TH+8); }
      else if(isMyTurn()){ ctx.setLineDash([5,4]); ctx.strokeStyle='#ffd23f'; ctx.lineWidth=2; ctx.strokeRect(slot.x-2,slot.y-2,TW+2,TH+4); ctx.setLineDash([]); }
      tile(drag.x-TW/2,gy-TH/2,drag.id,{sel:true}); }
    if(G.log){ ctx.textAlign='left'; ctx.font='700 11px '+TC; ctx.fillStyle='rgba(255,255,255,.7)'; ctx.fillText(G.log,14,RACK_Y-20); }
    if(msgT>0&&msg){ ctx.textAlign='center'; ctx.font='900 16px '+TC; const w=ctx.measureText(msg).width+30; ctx.fillStyle='rgba(11,10,28,.88)'; ctx.fillRect(W/2-w/2-30,RACK_Y-64,w,30); ctx.fillStyle='#ffd23f'; ctx.fillText(msg,W/2-30,RACK_Y-48); }
  }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',onDown); },_dbg:{autoSplit:ids=>autoSplit(ids),G,get E(){return E;},analyze:s=>analyze(s.map(T)),checkPlay,aiMove,T,doDone,doDraw}};
}

function thumb(ctx,w,h,t){
  ctx.fillStyle='#1f6b4a'; ctx.fillRect(0,0,w,h);
  const tl=(x,y,c,n,rot)=>{ ctx.save(); ctx.translate(x,y); ctx.rotate(rot||0); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.fillRect(3,4,36,48); ctx.fillStyle='#fff8e6'; ctx.fillRect(0,0,36,48); ctx.strokeStyle='#c9b89a'; ctx.strokeRect(0,0,36,48);
    ctx.fillStyle=c<0?'#e23b3b':COL[c]; ctx.font='900 22px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(c<0?'☺':String(n),18,20); ctx.restore(); };
  [[0,5],[0,6],[0,7],[0,8]].forEach((a,i)=>tl(40+i*38,40,a[0],a[1]));
  [[1,9],[2,9],[3,9]].forEach((a,i)=>tl(240+i*38,40,a[0],a[1]));
  [[3,11],[3,12],[-1,0]].forEach((a,i)=>tl(110+i*38,120,a[0],a[1]));
  const u=(t%2.4)/2.4,fy=230-Math.sin(Math.min(1,u*1.4)*Math.PI/2)*110; tl(200+Math.min(1,u*1.4)*34,fy,3,13,(1-Math.min(1,u*1.4))*.4);
  ctx.fillStyle='rgba(11,10,28,.6)'; ctx.fillRect(0,h-50,w,50); for(let i=0;i<9;i++) tl(14+i*38,h-46,i%4,(i*5)%13+1);
}

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).rummy={
  name:'拉密',tag:'RUMMIKUB',color:'#3fae8a',online:true,maxPlayers:4,bots:true,minPlayers:2,netVariants:false,
  desc:'數字牌的拉密（Rummikub）：組出同色連號或同數字不同色的牌組，先把手牌出完的人贏。可以和電腦玩，或開房間 2～4 人連線。',
  goal:'把手牌拖到桌上組成牌組：同顏色連號 3 張以上，或同數字不同顏色 3～4 張，鬼牌可以代替任何牌。第一次出牌要湊滿 30 分，之後可以拆開桌上的牌重新組合。出不了牌就按「摸牌」。',
  variants:[{id:'2',label:'對手 2 人'},{id:'1',label:'對手 1 人'},{id:'3',label:'對手 3 人'}],
  help:[['拖曳','把牌拖到桌上、拖到別的牌組或拖回手牌'],['點一下手牌','直接放到桌上成為新的一組'],['完成','檢查桌面後結束這回合'],['摸牌','這回合不出牌，摸一張'],['復原','把這回合動過的牌放回原位'],['思考時間','牌堆下方的按鈕，切換每回合可以移動牌的秒數（60／90／120／180 秒或不限），時間到會自動摸一張牌；連線時由房主設定']],
  touchHelp:[['拖曳','把牌拖到桌上、拖到別的牌組或拖回手牌'],['點一下手牌','直接放到桌上成為新的一組'],['完成／摸牌','結束這回合'],['思考時間','點牌堆下方的按鈕切換每回合秒數']],
  touch:null,
  looks:[{key:'felt',label:'桌布顏色',type:'color',opts:['#1f6b4a','#1f4f7a','#6b1f3a','#3a2d57','#5a4630','#2b2b33']}],
  best:{label:'最高得分',fmt:v=>v+' 分',lower:false},
  preview:(ctx,w,h,L,t)=>{ thumb(ctx,w,h,t); ctx.globalCompositeOperation='multiply'; ctx.fillStyle=L.felt; ctx.fillRect(0,0,w,h); ctx.globalCompositeOperation='source-over'; },
  thumb,create,_analyze:null
};
})();
