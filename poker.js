// 牌桌派對：一副撲克牌玩四種遊戲——大老二、德州撲克、十三支、二十一點。
// 單機是你和電腦同桌；連線時房主負責發牌與判定，其他人送出動作（作法同拉密）。
// 牌的編號 0～51：點數 rk＝id%13+2（2～14，14 是 A），花色 su＝id/13（0 梅花、1 方塊、2 紅心、3 黑桃）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PIX='"Press Start 2P","Noto Sans TC",monospace';
const GAMES=['大老二','德州撲克','十三支','二十一點'],GID=['b2','th','13','bj'];
const SUITS=['♣','♦','♥','♠'];
const rk=id=>id%13+2,su=id=>(id/13)|0,RN=r=>r<=10?String(r):['J','Q','K','A'][r-11];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const shuffle=a=>{ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const newDeck=()=>shuffle([...Array(52).keys()]);

/* ---------- 牌型判斷（德州撲克、十三支共用） ---------- */
const HAND_NAMES=['高牌','一對','兩對','三條','順子','同花','葫蘆','鐵支','同花順'];
function evalHand(cards){ // 3 或 5 張；分數越大越強，cat＝牌型
  const r=cards.map(rk).sort((a,b)=>b-a),five=cards.length===5,flush=five&&cards.every(c=>su(c)===su(cards[0]));
  const cnt={}; r.forEach(v=>cnt[v]=(cnt[v]||0)+1);
  const g=Object.entries(cnt).map(([v,c])=>[c,+v]).sort((a,b)=>b[0]-a[0]||b[1]-a[1]),uniq=[...new Set(r)];
  let st=0; if(five&&uniq.length===5){ if(uniq[0]-uniq[4]===4) st=uniq[0]; else if(uniq.join()==='14,5,4,3,2') st=5; }
  let cat,k;
  if(st&&flush){ cat=8; k=[st]; } else if(g[0][0]===4){ cat=7; k=[g[0][1],g[1][1]]; } else if(g[0][0]===3&&g[1]&&g[1][0]===2){ cat=6; k=[g[0][1],g[1][1]]; }
  else if(flush){ cat=5; k=r; } else if(st){ cat=4; k=[st]; } else if(g[0][0]===3){ cat=3; k=g.map(x=>x[1]); }
  else if(g[0][0]===2&&g[1]&&g[1][0]===2){ cat=2; k=g.map(x=>x[1]); } else if(g[0][0]===2){ cat=1; k=g.map(x=>x[1]); } else { cat=0; k=r; }
  let s=cat; for(let i=0;i<5;i++) s=s*15+(k[i]||0); return {s,cat};
}
const C5=n=>{ const out=[]; for(let a=0;a<n;a++) for(let b=a+1;b<n;b++) for(let c=b+1;c<n;c++) for(let d=c+1;d<n;d++) for(let e=d+1;e<n;e++) out.push([a,b,c,d,e]); return out; };
const C7=C5(7);
function best7(cards){ let b={s:-1,cat:0}; for(const ix of C7){ const e=evalHand(ix.map(i=>cards[i])); if(e.s>b.s) b=e; } return b; }
function bestN(cards){ if(cards.length<5) return evalHand(cards.slice(0,3)); if(cards.length===7) return best7(cards); let b={s:-1,cat:0}; for(const ix of C5(cards.length)){ const e=evalHand(ix.map(i=>cards[i])); if(e.s>b.s) b=e; } return b; }

/* ---------- 大老二規則 ---------- */
// 大小：3 最小、2 最大；同點數比花色 梅花＜方塊＜紅心＜黑桃
const b2=id=>((rk(id)-3+13)%13)*4+su(id);
const B2SEQ=[[3,4,5,6,7],[4,5,6,7,8],[5,6,7,8,9],[6,7,8,9,10],[7,8,9,10,11],[8,9,10,11,12],[9,10,11,12,13],[10,11,12,13,14],[14,2,3,4,5],[2,3,4,5,6]];
const B2T=['順子','同花','葫蘆','鐵支','同花順'];
function b2Combo(ids){
  const n=ids.length;
  if(n===1) return {n:1,p:b2(ids[0]),name:'單張'};
  if(n===2) return rk(ids[0])===rk(ids[1])?{n:2,p:Math.max(b2(ids[0]),b2(ids[1])),name:'一對'}:null;
  if(n!==5) return null;
  const rs=ids.map(rk),flush=ids.every(i=>su(i)===su(ids[0])),set=rs.slice().sort((a,b)=>a-b).join(),top=Math.max(...ids.map(b2));
  const si=B2SEQ.findIndex(q=>q.slice().sort((a,b)=>a-b).join()===set),cnt={}; rs.forEach(v=>cnt[v]=(cnt[v]||0)+1); const cs=Object.values(cnt).sort((a,b)=>b-a);
  const rankOf=c=>((+Object.keys(cnt).find(v=>cnt[v]===c)-3+13)%13);
  let t=-1,inner=0;
  if(si>=0&&flush){ t=4; inner=si*4+su(ids[0]); } else if(cs[0]===4){ t=3; inner=rankOf(4); } else if(cs[0]===3&&cs[1]===2){ t=2; inner=rankOf(3); }
  else if(flush){ t=1; inner=top; } else if(si>=0){ t=0; const hi=ids.reduce((a,b)=>b2(b)>b2(a)?b:a); inner=si*4+su(hi); }
  return t<0?null:{n:5,p:t*1000+inner,name:B2T[t]};
}
const b2Beats=(a,b)=>!b||a.n===b.n&&a.p>b.p;
function b2Plays(hand){ // 手上所有能出的組合
  const out=[]; for(const id of hand) out.push([id]);
  for(let a=0;a<hand.length;a++) for(let b=a+1;b<hand.length;b++) if(rk(hand[a])===rk(hand[b])) out.push([hand[a],hand[b]]);
  if(hand.length>=5) for(const ix of C5(hand.length)){ const ids=ix.map(i=>hand[i]); if(b2Combo(ids)) out.push(ids); }
  return out.map(ids=>({ids,c:b2Combo(ids)})).filter(x=>x.c);
}

/* ---------- 十三支：自動排牌（頭墩 3、中墩 5、尾墩 5，要尾≧中≧頭） ---------- */
const rowScore=cards=>evalHand(cards).s;
function arrange13(hand){
  let best=null,bs=-1e18; const idx=[...Array(13).keys()],C13=C5(13),C8=C5(8);
  for(const b of C13){ const bot=b.map(i=>hand[i]),rest=idx.filter(i=>!b.includes(i)).map(i=>hand[i]),eb=evalHand(bot);
    for(const m of C8){ const mid=m.map(i=>rest[i]),top=rest.filter((_,i)=>!m.includes(i)),em=evalHand(mid),et=evalHand(top);
      if(em.s>eb.s||et.s>em.s) continue;
      const sc=eb.cat*1+em.cat*1.6+et.cat*2.6+(et.s%759375)/759375*1.2+(em.s%759375)/759375*.6;
      if(sc>bs){ bs=sc; best=[top,mid,bot]; } } }
  return best;
}
const foul13=rows=>!rows||rowScore(rows[1])>rowScore(rows[2])||rowScore(rows[0])>rowScore(rows[1]);

/* ---------- 二十一點 ---------- */
function bjTotal(cards){ let t=0,a=0; for(const c of cards){ const r=rk(c); if(r===14){ t+=11; a++; } else t+=r>=10?10:r; } while(t>21&&a){ t-=10; a--; } return t; }
const bjSoft=cards=>{ let t=0,a=0; for(const c of cards){ const r=rk(c); if(r===14){ t+=11; a++; } else t+=r>=10?10:r; } while(t>21&&a){ t-=10; a--; } return a>0; };

/* ---------- 畫牌 ---------- */
const BACKS={red:['#c8323c','#8a1f28'],blue:['#2f6fd0','#1d4a94'],purple:['#7a4ac8','#4f2f88'],green:['#2f8a5a','#1d5a3a']};
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function drawCard(c,x,y,w,h,id,up,o){
  o=o||{}; c.save(); if(o.dim) c.globalAlpha=.45;
  c.fillStyle='rgba(0,0,0,.28)'; rr(c,x+1.5,y+2.5,w,h,w*.12); c.fill();
  if(!up){ const B=BACKS[o.back]||BACKS.red; c.fillStyle='#fff'; rr(c,x,y,w,h,w*.12); c.fill(); c.fillStyle=B[0]; rr(c,x+w*.08,y+w*.08,w*.84,h-w*.16,w*.08); c.fill();
    c.save(); rr(c,x+w*.08,y+w*.08,w*.84,h-w*.16,w*.08); c.clip(); c.strokeStyle=B[1]; c.lineWidth=Math.max(1,w*.05); c.beginPath(); for(let i=-h;i<w+h;i+=w*.2){ c.moveTo(x+i,y); c.lineTo(x+i+h,y+h); c.moveTo(x+i+h,y); c.lineTo(x+i,y+h); } c.stroke(); c.restore();
    c.restore(); return; }
  c.fillStyle=o.hl?'#fff8d8':'#fdfcf8'; rr(c,x,y,w,h,w*.12); c.fill(); c.strokeStyle=o.sel?'#ffd23f':o.hl?'#ffb000':'#9a95a8'; c.lineWidth=o.sel?3:1; c.stroke();
  const red=su(id)===1||su(id)===2; c.fillStyle=red?'#d4283a':'#1c1a26'; c.textAlign='left'; c.textBaseline='top';
  c.font='900 '+Math.round(w*.34)+'px '+TC; c.fillText(RN(rk(id)),x+w*.09,y+w*.06);
  c.font=Math.round(w*.3)+'px '+TC; c.fillText(SUITS[su(id)],x+w*.1,y+w*.42);
  c.textAlign='center'; c.textBaseline='middle'; c.font=Math.round(w*.62)+'px '+TC; c.fillText(SUITS[su(id)],x+w*.6,y+h*.66);
  c.restore();
}

function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,me=net?net.me:0;
  const kind=GID[clamp(opts.stage||0,0,3)],humans=net?net.count:1;
  const OP=(opts.options||{}),seats=+OP.seats||6,bjSeats=+OP.bjseats||3;
  const np=net?Math.min(kind==='th'?9:kind==='bj'?7:4,net.count+(net.bots||0)):kind==='bj'?clamp(bjSeats,1,7):kind==='th'?clamp(seats,2,9):4; // 德州撲克最多 9 人、二十一點最多 7 人
  const L=opts.look||{felt:'#1f6b4a',back:'red'},spd=['slow','normal','fast'].indexOf((opts.options||{}).speed||'normal'),AID=[1.5,.9,.45][spd<0?1:spd];
  const {ctx:c,canvas}=env.canvas2d(W,H);
  const names=[]; for(let i=0;i<np;i++) names.push(i<humans?(net?(net.names&&net.names[i])||'玩家'+(i+1):(opts.name||'你')):'電腦 '+(i-humans+1));
  const isAI=p=>p>=humans,sfx=n=>env.sfx(n);
  let G={kind,log:'',over:null},t=0,aiT=0,msg='',msgT=0,sel=new Set(),ended=false,btns=[],hits=[],pendingT=0;
  const say=(s,sec)=>{ msg=s; msgT=sec||2; };
  const log=s=>{ G.log=s; };

  /* ===== 大老二 ===== */
  function b2Setup(){ const d=newDeck(); G.hands=[]; for(let p=0;p<np;p++) G.hands.push(d.splice(0,13).sort((a,b)=>b2(a)-b2(b)));
    let low=999,lp=0; G.hands.forEach((h,p)=>{ if(b2(h[0])<low){ low=b2(h[0]); lp=p; } }); G.turn=lp; G.mustInclude=G.hands[lp][0]; G.last=null; G.passed=new Array(np).fill(false);
    log(names[lp]+' 拿到最小的牌，先出（要包含 '+SUITS[su(G.mustInclude)]+RN(rk(G.mustInclude))+'）'); }
  function b2Play(p,ids){
    const h=G.hands[p]; if(G.over||G.turn!==p||!ids.length||!ids.every(i=>h.includes(i))) return '不是你的回合或牌不對';
    const cb=b2Combo(ids); if(!cb) return '只能出單張、一對，或五張的順子、同花、葫蘆、鐵支、同花順';
    if(G.mustInclude!=null&&!ids.includes(G.mustInclude)) return '第一手要包含 '+SUITS[su(G.mustInclude)]+RN(rk(G.mustInclude));
    if(G.last&&G.last.by!==p&&!b2Beats(cb,G.last.c)) return G.last.c.n!==cb.n?'要出跟上一手一樣的張數（'+G.last.c.name+'）':'這手牌壓不過上一手';
    G.hands[p]=h.filter(i=>!ids.includes(i)); G.last={ids:ids.slice().sort((a,b)=>b2(a)-b2(b)),c:cb,by:p}; G.mustInclude=null; G.passed.fill(false);
    log(names[p]+' 出 '+cb.name); sfx('place');
    if(!G.hands[p].length){ const pen=G.hands.map(h2=>h2.length>=10?h2.length*2:h2.length); G.over={w:p,pen}; return null; }
    b2Next(); return null; }
  function b2Pass(p){ if(G.over||G.turn!==p) return '不是你的回合'; if(!G.last||G.last.by===p) return '現在輪你自由出牌，不能過'; G.passed[p]=true; log(names[p]+' 過'); sfx('click'); b2Next(); return null; }
  function b2Next(){ G.turn=(G.turn+1)%np; if(G.last&&G.turn===G.last.by){ G.last=null; G.passed.fill(false); log(names[G.turn]+' 沒人壓得過，自由出牌'); } }
  function b2AI(p){
    const h=G.hands[p],free=!G.last||G.last.by===p; let ps=b2Plays(h); if(G.mustInclude!=null) ps=ps.filter(x=>x.ids.includes(G.mustInclude));
    const danger=G.hands.some((h2,q)=>q!==p&&h2.length<=2);
    if(free){ const big=ps.filter(x=>x.c.n===5&&!x.ids.some(i=>rk(i)===2)).sort((a,b)=>a.c.p-b.c.p);
      const pairs=ps.filter(x=>x.c.n===2&&rk(x.ids[0])!==2).sort((a,b)=>a.c.p-b.c.p),singles=ps.filter(x=>x.c.n===1).sort((a,b)=>a.c.p-b.c.p);
      const pick=big[0]||pairs[0]||(danger?singles[singles.length-1]:singles[0])||ps[0]; return b2Play(p,pick.ids); }
    const ok=ps.filter(x=>b2Beats(x.c,G.last.c)).sort((a,b)=>a.c.p-b.c.p);
    if(!ok.length) return b2Pass(p);
    let pick=ok[0]; if(danger&&G.last.c.n===1) pick=ok[ok.length-1];
    const costly=pick.ids.some(i=>rk(i)===2)&&h.length>6&&!danger; if(costly&&Math.random()<.6) return b2Pass(p);
    return b2Play(p,pick.ids); }

  /* ===== 德州撲克 ===== */
  const BLIND=String(OP.blind||'10/20').split('/').map(Number),BB=BLIND[1]||20,SB=BLIND[0]||BB/2,START=+OP.chips||1000,MAXH=8; // 起始籌碼和盲注可以在開始前選
  function thSetup(){ G.chips=new Array(np).fill(START); G.handNo=0; G.dealer=Math.floor(Math.random()*np); thNewHand(); }
  const live=p=>G.chips[p]>0||G.contrib&&G.contrib[p]>0;
  function thNewHand(){
    const alive=[...Array(np).keys()].filter(p=>G.chips[p]>0);
    if(G.handNo>=MAXH||alive.length<=1||(!net&&G.chips[0]<=0)){ G.over={chips:G.chips.slice()}; return; }
    G.handNo++; const d=newDeck(); G.deck=d; G.board=[]; G.hole=[]; G.folded=new Array(np).fill(false); G.allin=new Array(np).fill(false);
    G.bet=new Array(np).fill(0); G.contrib=new Array(np).fill(0); G.show=null; G.street=0;
    for(let p=0;p<np;p++){ if(G.chips[p]>0) G.hole[p]=[d.pop(),d.pop()]; else { G.hole[p]=[]; G.folded[p]=true; } }
    const nxt=q=>{ for(let k=1;k<=np;k++){ const r=(q+k)%np; if(G.chips[r]>0) return r; } return q; };
    G.dealer=nxt(G.dealer); const sb=alive.length===2?G.dealer:nxt(G.dealer),bb=nxt(sb);
    thPut(sb,SB); thPut(bb,BB); G.cur=BB; G.minR=BB; G.acted=new Set(); G.turn=nxt(bb); G.sb=sb; G.bbp=bb;
    log('第 '+G.handNo+' / '+MAXH+' 手　'+names[sb]+' 小盲 '+SB+'、'+names[bb]+' 大盲 '+BB); thSkip(); }
  function thSkip(){ if(!canAct(G.turn)) thAdvance(); } // 輪到的人已經全下（例如大盲就全下）時直接跳過
  function thPut(p,a){ a=Math.min(a,G.chips[p]); G.chips[p]-=a; G.bet[p]+=a; G.contrib[p]+=a; if(G.chips[p]===0) G.allin[p]=true; }
  const canAct=p=>!G.folded[p]&&!G.allin[p];
  const pot=()=>G.contrib.reduce((a,b)=>a+b,0);
  function thAct(p,a){
    if(G.over||G.show||G.turn!==p||!canAct(p)) return '不是你的回合';
    const toCall=G.cur-G.bet[p];
    if(a==='fold'){ G.folded[p]=true; log(names[p]+' 棄牌'); sfx('click'); }
    else if(a==='call'){ if(toCall>0){ thPut(p,toCall); log(names[p]+(G.allin[p]?' 全下':' 跟注 '+toCall)); } else log(names[p]+' 過牌'); sfx('place'); }
    else if(a==='raise'||a==='allin'){ const target=a==='allin'?G.bet[p]+G.chips[p]:G.cur+G.minR,add=Math.min(target-G.bet[p],G.chips[p]); if(add<=toCall) return thAct(p,'call');
      thPut(p,add); const raised=G.bet[p]-G.cur; if(raised>=G.minR) G.minR=raised; G.cur=Math.max(G.cur,G.bet[p]); G.acted=new Set(); log(names[p]+(G.allin[p]?' 全下 ':' 加注到 ')+G.bet[p]); sfx('item'); }
    G.acted.add(p); thAdvance(); return null; }
  function thAdvance(){
    const inHand=[...Array(np).keys()].filter(p=>!G.folded[p]);
    if(inHand.length===1){ thFinish([inHand[0]]); return; }
    const pending=inHand.filter(p=>canAct(p)&&(!G.acted.has(p)||G.bet[p]<G.cur));
    if(pending.length){ for(let k=1;k<=np;k++){ const q=(G.turn+k)%np; if(pending.includes(q)){ G.turn=q; return; } } }
    // 這一輪結束，進下一張公牌
    G.bet.fill(0); G.cur=0; G.minR=BB; G.acted=new Set();
    const actors=inHand.filter(canAct);
    if(G.street>=3){ thShowdown(); return; }
    G.street++; if(G.street===1) G.board.push(G.deck.pop(),G.deck.pop(),G.deck.pop()); else G.board.push(G.deck.pop());
    log(['','翻牌','轉牌','河牌'][G.street]+'：'+G.board.map(id=>SUITS[su(id)]+RN(rk(id))).join(' '));
    if(actors.length<=1){ thAdvance(); return; }
    for(let k=1;k<=np;k++){ const q=(G.dealer+k)%np; if(canAct(q)){ G.turn=q; break; } } }
  function thShowdown(){ while(G.board.length<5) G.board.push(G.deck.pop()); const inHand=[...Array(np).keys()].filter(p=>!G.folded[p]); thFinish(inHand,true); }
  function thFinish(inHand,show){
    // 依每個人投入的多寡分主池、邊池
    const sc={}; if(show) for(const p of inHand) sc[p]=best7(G.hole[p].concat(G.board));
    const lv=[...new Set(G.contrib.filter(v=>v>0))].sort((a,b)=>a-b),win=new Array(np).fill(0); let prev=0;
    for(const L of lv){ let part=0; for(let p=0;p<np;p++) part+=Math.max(0,Math.min(G.contrib[p],L)-prev);
      const el=inHand.filter(p=>G.contrib[p]>=L); if(!el.length){ prev=L; continue; }
      let best=-1,ws=[]; for(const p of el){ const s=show?sc[p].s:0; if(s>best){ best=s; ws=[p]; } else if(s===best) ws.push(p); }
      ws.forEach((p,i)=>win[p]+=Math.floor(part/ws.length)+(i<part%ws.length?1:0)); prev=L; }
    win.forEach((v,p)=>G.chips[p]+=v);
    const winners=win.map((v,p)=>v>0?p:-1).filter(p=>p>=0);
    G.show={win,sc:show?Object.fromEntries(Object.entries(sc).map(([p,e])=>[p,HAND_NAMES[e.cat]])):null,until:3.6};
    log(winners.map(p=>names[p]+' 贏 '+win[p]+(show?'（'+HAND_NAMES[sc[p].cat]+'）':'')).join('、')); sfx('win'); }
  function thEquity(p,n){ // 蒙地卡羅估計勝率
    const opp=[...Array(np).keys()].filter(q=>q!==p&&!G.folded[q]).length; if(!opp) return 1;
    const known=new Set(G.hole[p].concat(G.board)),rest=[...Array(52).keys()].filter(i=>!known.has(i)); let w=0;
    for(let it=0;it<n;it++){ const d=shuffle(rest.slice()),board=G.board.concat(d.splice(0,5-G.board.length)),mine=best7(G.hole[p].concat(board)).s; let lose=false,tie=0;
      for(let o=0;o<opp;o++){ const s=best7([d.pop(),d.pop()].concat(board)).s; if(s>mine){ lose=true; break; } if(s===mine) tie++; }
      if(!lose) w+=tie?1/(tie+1):1; }
    return w/n; }
  function thAI(p){
    const eq=thEquity(p,G.street===0?90:140),toCall=G.cur-G.bet[p],potOdds=toCall/(pot()+toCall||1),r=Math.random();
    if(eq>.72&&r<.7||eq>.55&&r<.25) return thAct(p,G.chips[p]<=G.cur+G.minR-G.bet[p]?'allin':'raise');
    if(toCall===0) return thAct(p,'call');
    if(eq>potOdds+.04||toCall<=BB&&eq>.25) return thAct(p,'call');
    return thAct(p,'fold'); }

  /* ===== 十三支 ===== */
  function t13Setup(){ const d=newDeck(); G.hands=[]; for(let p=0;p<np;p++) G.hands.push(d.splice(0,13).sort((a,b)=>rk(a)-rk(b)||su(a)-su(b))); G.rows=new Array(np).fill(null); G.res=null; log('把 13 張牌分成頭墩 3 張、中墩 5 張、尾墩 5 張，尾墩要最大、頭墩最小'); }
  function t13Submit(p,rows){
    if(G.over||G.rows[p]) return '已經送出了';
    const all=rows.flat().slice().sort((a,b)=>a-b).join(),own=G.hands[p].slice().sort((a,b)=>a-b).join();
    if(rows.length!==3||rows[0].length!==3||rows[1].length!==5||rows[2].length!==5||all!==own) return '頭墩要 3 張、中墩 5 張、尾墩 5 張';
    G.rows[p]=rows.map(r=>r.slice()); log(names[p]+' 排好了'); sfx('place');
    if(G.rows.every(Boolean)) t13Show(); return null; }
  function t13Show(){
    const foul=G.rows.map(foul13),tot=new Array(np).fill(0),detail=[];
    for(let a=0;a<np;a++) for(let b=a+1;b<np;b++){ let s=0,wins=0,loss=0;
      for(let k=0;k<3;k++){ let v; if(foul[a]&&foul[b]) v=0; else if(foul[a]) v=-1; else if(foul[b]) v=1; else { const x=rowScore(G.rows[a][k]),y=rowScore(G.rows[b][k]); v=x>y?1:x<y?-1:0; } s+=v; if(v>0) wins++; if(v<0) loss++; }
      if(wins===3||loss===3) s*=2; // 打槍：三墩全贏加倍
      tot[a]+=s; tot[b]-=s; detail.push([a,b,s]); }
    G.res={tot,foul,detail}; G.over={tot}; log('比牌結果出爐'); sfx('win'); }

  /* ===== 二十一點 ===== */
  const BJR=6;
  function bjSetup(){ G.chips=new Array(np).fill(1000); G.round=0; bjNewRound(); }
  function bjNewRound(){
    if(G.round>=BJR||G.chips.every(v=>v<=0)||(!net&&G.chips[0]<=0)){ G.over={chips:G.chips.slice()}; return; }
    G.round++; G.phase='bet'; G.bets=new Array(np).fill(0); G.hands=[]; G.dealer=[]; G.done=new Array(np).fill(false); G.res=null; G.deck=G.deck&&G.deck.length>60?G.deck:newDeck().concat(newDeck()); // 兩副牌的牌靴，剩不多就重洗（7 人同桌也不會沒牌）
    log('第 '+G.round+' / '+BJR+' 局：先下注'); }
  function bjBet(p,a){ if(G.phase!=='bet'||G.bets[p]) return '現在不能下注'; if(G.chips[p]<=0){ G.bets[p]=-1; } else G.bets[p]=Math.min(a,G.chips[p]);
    if(G.bets[p]>0) G.chips[p]-=G.bets[p]; sfx('place'); if(G.bets.every(b=>b!==0)) bjDeal(); return null; }
  function bjDeal(){ G.phase='play'; for(let p=0;p<np;p++){ G.hands[p]=G.bets[p]>0?[G.deck.pop(),G.deck.pop()]:[]; G.done[p]=G.bets[p]<=0||bjTotal(G.hands[p])===21; } G.dealer=[G.deck.pop(),G.deck.pop()];
    G.turn=-1; bjNext(); log('發牌了，輪流決定要牌或停牌'); }
  function bjNext(){ for(let p=0;p<np;p++) if(!G.done[p]){ G.turn=p; return; } bjDealer(); }
  function bjAct(p,a){
    if(G.phase!=='play'||G.turn!==p||G.done[p]) return '不是你的回合'; const h=G.hands[p];
    if(a==='hit'){ h.push(G.deck.pop()); sfx('place'); const v=bjTotal(h); if(v>=21){ G.done[p]=true; log(names[p]+(v>21?' 爆了！':' 21 點')); } else log(names[p]+' 要牌（'+v+' 點）'); }
    else if(a==='double'){ if(h.length!==2||G.chips[p]<G.bets[p]) return '只有前兩張牌、籌碼夠時才能加倍'; G.chips[p]-=G.bets[p]; G.bets[p]*=2; h.push(G.deck.pop()); G.done[p]=true; log(names[p]+' 加倍（'+bjTotal(h)+' 點）'); sfx('item'); }
    else { G.done[p]=true; log(names[p]+' 停牌（'+bjTotal(h)+' 點）'); sfx('click'); }
    if(G.done[p]) bjNext(); return null; }
  function bjDealer(){ G.phase='dealer'; const d=G.dealer; while(bjTotal(d)<17) d.push(G.deck.pop());
    const dv=bjTotal(d),dbj=dv===21&&d.length===2,res=new Array(np).fill(0);
    for(let p=0;p<np;p++){ const b=G.bets[p]; if(b<=0) continue; const h=G.hands[p],v=bjTotal(h),pbj=v===21&&h.length===2; let pay=0;
      if(v>21) pay=0; else if(pbj&&!dbj) pay=b+Math.floor(b*1.5); else if(dv>21||v>dv) pay=b*2; else if(v===dv) pay=b; else pay=0;
      G.chips[p]+=pay; res[p]=pay-b; }
    G.res={res,dv,until:3.4}; log('莊家 '+(dv>21?'爆了':dv+' 點')); sfx('win'); }
  function bjAI(p){ if(G.phase==='bet') return bjBet(p,[50,100,200][Math.floor(Math.random()*3)]);
    const h=G.hands[p],v=bjTotal(h),up=Math.min(10,rk(G.dealer[0])>=10?(rk(G.dealer[0])===14?11:10):rk(G.dealer[0]));
    if(h.length===2&&(v===11||v===10&&up<10)&&G.chips[p]>=G.bets[p]) return bjAct(p,'double');
    if(v<=11) return bjAct(p,'hit'); if(bjSoft(h)&&v<=17) return bjAct(p,'hit');
    if(v>=17) return bjAct(p,'stand'); return bjAct(p,up>=7?'hit':'stand'); }

  /* ===== 共用：誰該動作、電腦、連線 ===== */
  const SETUP={b2:b2Setup,th:thSetup,'13':t13Setup,bj:bjSetup};
  function aiStep(){
    if(G.over) return;
    if(kind==='b2'&&isAI(G.turn)) b2AI(G.turn);
    else if(kind==='th'&&!G.show&&isAI(G.turn)) thAI(G.turn);
    else if(kind==='13'){ for(let p=0;p<np;p++) if(isAI(p)&&!G.rows[p]){ t13Submit(p,arrange13(G.hands[p])); break; } }
    else if(kind==='bj'){ if(G.phase==='bet'){ const p=G.bets.findIndex((b,i)=>b===0&&isAI(i)); if(p>=0) bjAI(p); } else if(G.phase==='play'&&isAI(G.turn)) bjAI(G.turn); }
    broadcast(); }
  function doAct(p,a){ // 所有人的動作都經過這裡（連線時在房主這邊執行）
    let err=null;
    if(kind==='b2') err=a.t==='play'?b2Play(p,a.ids):b2Pass(p);
    else if(kind==='th') err=thAct(p,a.t);
    else if(kind==='13') err=t13Submit(p,a.rows);
    else if(kind==='bj') err=a.t==='bet'?bjBet(p,a.v):bjAct(p,a.t);
    return err; }
  function act(a){ if(client){ net.send({act:a}); return; } const err=doAct(me,a); if(err){ say(err,2.4); sfx('bump'); } else { sel.clear(); broadcast(); } }
  function broadcast(){ if(net&&net.host) net.send({st:G}); }
  if(net){
    if(client) net.onmsg=m=>{ if(m.st){ const was=G.turn; G=m.st; if(kind==='13'&&G.rows&&G.rows[me]) arr=null; if(G.turn!==was) sel.clear(); } if(m.bad&&m.bad[0]===me){ say(m.bad[1],2.4); sfx('bump'); } };
    else { net.onmsg=(m,from)=>{ if(!m.act) return; const err=doAct(from,m.act); if(err) net.send({bad:[from,err]}); broadcast(); };
      net.onleave=i=>{ names[i]+='（離開）'; if(kind==='b2'&&G.turn===i&&!G.over){ b2AIForce(i); } broadcast(); }; }
  }
  // 有人離開時由電腦代打
  const left=new Set(); function b2AIForce(i){ left.add(i); }
  if(!client){ SETUP[kind](); broadcast(); }

  /* ===== 十三支：自己排牌的狀態 ===== */
  let arr=kind==='13'?{rows:[[],[],[]]}:null;
  function arrHand(){ const used=new Set(arr.rows.flat()); return (G.hands&&G.hands[me]||[]).filter(i=>!used.has(i)); }

  /* ===== 座位 ===== */
  function seatOf(p){ const rel=(p-me+np)%np; const S={1:['b'],2:['b','t'],3:['b','l','r'],4:['b','l','t','r']}[np]; return S[rel]; }
  const POS={b:[400,470],l:[64,230],t:[400,58],r:[736,230]};
  function thPos(p){ if(np<=4){ const s=seatOf(p),[x,y]=POS[s]; return {x,y:s==='t'?y+10:y-30,top:s==='t'}; }
    const rel=(p-me+np)%np,a=Math.PI*(.97+1.06*(rel-1)/(np-2)); return {x:400+Math.cos(a)*335,y:200+Math.sin(a)*145-24,top:Math.sin(a)<-.3}; } // 其他人坐在桌子上半圈，下面留給自己的牌和按鈕
  const BJPOS={b:[400,470],l:[110,250],t:[690,250],r:[690,250]};

  /* ===== 更新 ===== */
  function update(dt){
    t+=dt; if(msgT>0) msgT-=dt;
    if(client){ if(G.over&&!ended){ ended=true; setTimeout(finish,1600); } return; }
    if(ended) return;
    if(G.over){ if(!ended){ ended=true; setTimeout(finish,1600); } return; }
    // 結算畫面停一下再進下一手／下一局
    if(kind==='th'&&G.show){ G.show.until-=dt; if(G.show.until<=0){ thNewHand(); broadcast(); } return; }
    if(kind==='bj'&&G.res){ G.res.until-=dt; if(G.res.until<=0){ bjNewRound(); broadcast(); } return; }
    // 離開的人由電腦代打
    if(kind==='b2'&&left.has(G.turn)){ aiT+=dt; if(aiT>AID){ aiT=0; b2AI(G.turn); broadcast(); } return; }
    aiT+=dt; if(aiT>AID){ aiT=0; aiStep(); }
  }
  function finish(){
    const tbl=(rows)=>'<table class="ls"><tr><th>名次</th><th>玩家</th><th>'+rows.h+'</th></tr>'+rows.list.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>').join('')+'</table>';
    let title,html,text='',score=null;
    if(kind==='b2'){ const w=G.over.w,list=names.map((n,p)=>[n,p===w?'出完了':'-'+G.over.pen[p]+' 分（剩 '+G.hands[p].length+' 張）',p===w?1e9:-G.over.pen[p]]).sort((a,b)=>b[2]-a[2]);
      title=w===me?'你贏了！':names[w]+' 先出完'; html=tbl({h:'結果',list}); text='輸家照剩下的張數扣分，剩 10 張以上加倍。'; }
    else if(kind==='13'){ const tot=G.over.tot,list=names.map((n,p)=>[n,(tot[p]>0?'+':'')+tot[p]+' 墩'+(G.res.foul[p]?'（倒水）':''),tot[p]]).sort((a,b)=>b[2]-a[2]);
      title=list[0][0]===names[me]?'你贏最多！':list[0][0]+' 贏最多'; html=tbl({h:'得分',list}); text='每墩和每位對手比，贏 +1、輸 -1；三墩全贏「打槍」加倍；排錯（倒水）三墩都算輸。'; }
    else { const ch=G.over.chips,list=names.map((n,p)=>[n,ch[p]+' 籌碼',ch[p]]).sort((a,b)=>b[2]-a[2]);
      title=list[0][0]===names[me]?'你是籌碼王！':list[0][0]+' 籌碼最多'; html=tbl({h:'籌碼',list}); score=ch[me]>0?ch[me]:null; text=kind==='th'?'打完 '+MAXH+' 手或只剩一人有籌碼就結束。':'打完 '+BJR+' 局就結束。'; }
    env.sfx(title.startsWith('你')?'win':'lose'); env.end({title,big:GAMES[GID.indexOf(kind)],html,text,score,next:false});
  }
  if(client) { /* 連線的另一邊：收到房主的結束狀態 */ }

  /* ===== 操作 ===== */
  function toLogical(e){ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=(r.width-W*s)/2,oy=(r.height-H*s)/2; return [(e.clientX-r.left-ox)/s,(e.clientY-r.top-oy)/s]; }
  function onDown(e){ e.preventDefault(); const [x,y]=toLogical(e);
    for(const b of btns) if(!b.dis&&x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h){ sfx('click'); b.fn(); return; }
    for(let i=hits.length-1;i>=0;i--){ const h=hits[i]; if(x>=h.x&&x<h.x+h.w&&y>=h.y&&y<h.y+h.h){ h.fn(); return; } } }
  canvas.addEventListener('pointerdown',onDown); canvas.style.touchAction='none';
  const myTurn=()=>!G.over&&G.turn===me;

  /* ===== 畫面 ===== */
  function btn(label,x,y,w,fn,dis,main){ btns.push({label,x,y,w,h:36,fn,dis,main}); }
  function drawBtns(){ for(const b of btns){ c.fillStyle=b.dis?'rgba(20,18,40,.6)':b.main?'#ffd23f':'#2b2759'; rr(c,b.x,b.y,b.w,b.h,10); c.fill(); c.strokeStyle=b.dis?'#3a3570':'#0b0a1c'; c.lineWidth=2; c.stroke();
    c.fillStyle=b.dis?'#6b6799':b.main?'#14122b':'#fff'; c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(b.label,b.x+b.w/2,b.y+b.h/2+1); } }
  function plate(p,x,y,extra,active){ const s=names[p]+(extra?'　'+extra:''); c.font='700 13px '+TC; const w=c.measureText(s).width+20;
    c.fillStyle=active?'rgba(255,210,63,.95)':'rgba(11,10,28,.7)'; rr(c,x-w/2,y-12,w,24,12); c.fill(); c.fillStyle=active?'#14122b':'#fff'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(s,x,y+1); }
  function backs(x,y,n,vertical){ const k=Math.min(n,13); for(let i=0;i<k;i++){ const o=(i-(k-1)/2)*(vertical?7:9); drawCard(c,vertical?x-14:x+o-14,vertical?y+o-20:y-20,28,40,0,false,{back:L.back}); } }
  function hand(ids,y,o){ // 自己的手牌：可點選
    o=o||{}; const n=ids.length,cw=56,chh=80,gap=n>1?Math.min(cw+4,(560-cw)/(n-1)):0,x0=W/2-((n-1)*gap+cw)/2;
    ids.forEach((id,i)=>{ const s=sel.has(id),x=x0+i*gap,yy=y-(s?16:0); drawCard(c,x,yy,cw,chh,id,true,{sel:s,dim:o.dim&&o.dim(id)}); if(o.click) hits.push({x,y:yy,w:i===n-1?cw:gap,h:chh,fn:()=>o.click(id)}); }); }
  const toggle=id=>{ if(sel.has(id)) sel.delete(id); else sel.add(id); sfx('click'); };

  function draw(){
    btns=[]; hits=[];
    const g=c.createRadialGradient(W/2,H/2,60,W/2,H/2,520); g.addColorStop(0,L.felt||'#1f6b4a'); g.addColorStop(1,'#0b0a1c'); c.fillStyle=g; c.fillRect(0,0,W,H);
    c.strokeStyle='rgba(255,255,255,.08)'; c.lineWidth=3; c.beginPath(); c.ellipse(W/2,H/2-10,330,170,0,0,7); c.stroke();
    c.textAlign='left'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 16px '+TC; c.fillText(GAMES[GID.indexOf(kind)],14,20);
    if(G.log){ c.font='700 12px '+TC; c.textAlign='left'; let tx=G.log; while(c.measureText(tx).width>250&&tx.length>4) tx=tx.slice(0,-2); if(tx!==G.log) tx+='…'; const w=c.measureText(tx).width+20; c.fillStyle='rgba(11,10,28,.7)'; rr(c,10,34,w,22,11); c.fill(); c.fillStyle='#fff'; c.fillText(tx,20,45); } // 訊息放左上角，不擋到對面的人
    if(kind==='b2') drawB2(); else if(kind==='th') drawTH(); else if(kind==='13') draw13(); else drawBJ();
    drawBtns();
    if(msgT>0&&msg){ c.font='900 16px '+TC; c.textAlign='center'; const w=c.measureText(msg).width+30; c.fillStyle='rgba(180,30,50,.92)'; rr(c,W/2-w/2,H/2-22,w,40,14); c.fill(); c.fillStyle='#fff'; c.fillText(msg,W/2,H/2-1); }
  }
  function drawB2(){
    if(!G.hands) return;
    for(let p=0;p<np;p++){ if(p===me) continue; const s=seatOf(p),[x,y]=POS[s]; backs(x,y+(s==='t'?6:0),G.hands[p].length,s!=='t');
      plate(p,x,s==='t'?y+42:y+80,G.hands[p].length+' 張',G.turn===p&&!G.over); if(G.passed[p]){ c.fillStyle='#ffd23f'; c.font='900 18px '+TC; c.textAlign='center'; c.fillText('過',x,s==='t'?y+66:y-62); } }
    if(G.last){ const n=G.last.ids.length,cw=52,x0=W/2-(n*36+16)/2; G.last.ids.forEach((id,i)=>drawCard(c,x0+i*36,170,cw,74,id,true)); c.font='700 13px '+TC; c.fillStyle='#cfe8d8'; c.textAlign='center'; c.fillText(names[G.last.by]+'：'+G.last.c.name,W/2,262); }
    const mine=G.hands[me]||[]; hand(mine,392,{click:id=>{ if(!G.over) toggle(id); }});
    plate(me,110,330,mine.length+' 張',myTurn());
    const ids=[...sel],cb=ids.length?b2Combo(ids):null;
    c.font='700 13px '+TC; c.fillStyle='#fff'; c.textAlign='center'; c.fillText(ids.length?(cb?'選了：'+cb.name:'這幾張不能一起出'):myTurn()?'點牌選取，再按「出牌」':'',W/2,300);
    btn('提示',470,330,70,()=>{ const h=G.hands[me]; let ps=b2Plays(h); if(G.mustInclude!=null) ps=ps.filter(x=>x.ids.includes(G.mustInclude)); const free=!G.last||G.last.by===me; const ok=ps.filter(x=>free||b2Beats(x.c,G.last.c)).sort((a,b)=>a.c.n-b.c.n||a.c.p-b.c.p); sel.clear(); if(ok[0]) ok[0].ids.forEach(i=>sel.add(i)); else say('沒有壓得過的牌，只能過',2); },!myTurn());
    btn('過',550,330,70,()=>act({t:'pass'}),!myTurn()||!G.last||G.last.by===me);
    btn('出牌',630,330,90,()=>act({t:'play',ids}),!myTurn()||!cb,true);
  }
  function drawTH(){
    if(!G.hole) return;
    for(let p=0;p<np;p++){ if(p===me) continue; const sp=thPos(p),x=sp.x,yy=sp.y;
      const shown=G.show&&G.show.sc&&!G.folded[p];
      const cw=np>6?(np>8?24:26):32,chh=np>6?(np>8?34:37):46; if(G.hole[p].length){ if(shown){ drawCard(c,x-cw-1,yy,cw,chh,G.hole[p][0],true); drawCard(c,x+1,yy,cw,chh,G.hole[p][1],true); } else if(!G.folded[p]){ drawCard(c,x-cw*.75,yy,cw,chh,0,false,{back:L.back}); drawCard(c,x-cw*.25,yy,cw,chh,0,false,{back:L.back}); } }
      plate(p,x,yy+chh+16,G.folded[p]?'棄牌':G.allin[p]?'全下':String(G.chips[p]),G.turn===p&&!G.show&&!G.over);
      if(G.bet[p]){ c.fillStyle='#ffd23f'; c.font='900 13px '+TC; c.textAlign='center'; c.fillText('下注 '+G.bet[p],x,yy+chh+38); }
      if(G.show&&G.show.win[p]){ c.fillStyle='#86dc4f'; c.font='900 14px '+TC; c.fillText('+'+G.show.win[p]+(G.show.sc&&G.show.sc[p]?' '+G.show.sc[p]:''),x,yy-12); } }
    for(let i=0;i<5;i++){ const x=W/2-140+i*58; if(G.board[i]!=null) drawCard(c,x,150,52,74,G.board[i],true); else { c.strokeStyle='rgba(255,255,255,.18)'; c.setLineDash([4,4]); rr(c,x,150,52,74,6); c.stroke(); c.setLineDash([]); } }
    c.fillStyle='#fff'; c.font='900 16px '+TC; c.textAlign='center'; c.fillText('彩池 '+(pot()),W/2,246); c.font='700 12px '+TC; c.fillStyle='#cfe8d8'; c.fillText('第 '+G.handNo+' / '+MAXH+' 手',W/2,266);
    const mine=G.hole[me]||[]; hand(mine,392); plate(me,110,330,G.folded[me]?'棄牌':G.chips[me]+' 籌碼'+(G.bet[me]?'（下注 '+G.bet[me]+'）':''),myTurn()&&!G.show);
    if(G.show&&G.show.win[me]){ c.fillStyle='#86dc4f'; c.font='900 18px '+TC; c.textAlign='center'; c.fillText('你贏 '+G.show.win[me]+(G.show.sc&&G.show.sc[me]?'（'+G.show.sc[me]+'）':''),W/2,300); }
    else if(mine.length&&G.board.length>=3){ c.fillStyle='#cfe8d8'; c.font='700 13px '+TC; c.textAlign='center'; c.fillText('目前牌型：'+HAND_NAMES[bestN(mine.concat(G.board)).cat],W/2,300); }
    const on=myTurn()&&!G.show&&canAct(me),toCall=on?G.cur-G.bet[me]:0;
    btn('棄牌',430,330,70,()=>act({t:'fold'}),!on);
    btn(toCall>0?'跟注 '+Math.min(toCall,G.chips[me]):'過牌',508,330,96,()=>act({t:'call'}),!on,true);
    btn('加注',612,330,70,()=>act({t:'raise'}),!on||G.chips[me]<=toCall);
    btn('全下',690,330,70,()=>act({t:'allin'}),!on);
  }
  function draw13(){
    if(!G.hands) return;
    const done=!!G.res;
    for(let p=0;p<np;p++){ if(p===me) continue; const s=seatOf(p),[x,y]=POS[s];
      if(done){ const rows=G.rows[p]; rows.forEach((r,k)=>r.forEach((id,i)=>drawCard(c,x-((r.length-1)*13+20)/2+i*13,(s==='t'?y-30:y-70)+k*30,20,28,id,true))); }
      else backs(x,y,13,s!=='t');
      plate(p,x,s==='t'?(done?y+66:y+42):y+(done?42:80),done?((G.res.tot[p]>0?'+':'')+G.res.tot[p]+(G.res.foul[p]?' 倒水':'')):G.rows[p]?'排好了':'排牌中',false); }
    const LBL=['頭墩','中墩','尾墩'],CAP=[3,5,5],rows=done?G.rows[me]:G.rows[me]||arr.rows;
    for(let k=0;k<3;k++){ const y=136+k*62,x0=W/2-150;
      c.fillStyle='rgba(0,0,0,.25)'; rr(c,x0-70,y-4,380,60,10); c.fill(); c.fillStyle='#ffd23f'; c.font='900 14px '+TC; c.textAlign='left'; c.fillText(LBL[k],x0-60,y+26);
      const r=rows[k]||[]; if(r.length===CAP[k]){ c.fillStyle='#cfe8d8'; c.font='700 12px '+TC; c.textAlign='right'; c.fillText(HAND_NAMES[evalHand(r).cat],x0+302,y+26); }
      for(let i=0;i<CAP[k];i++){ const x=x0+i*44; if(r[i]!=null){ drawCard(c,x,y,40,52,r[i],true); if(!done&&!G.rows[me]) hits.push({x,y,w:40,h:52,fn:()=>{ arr.rows[k]=arr.rows[k].filter(v=>v!==r[i]); sfx('click'); }}); }
        else { c.strokeStyle='rgba(255,255,255,.2)'; c.setLineDash([3,3]); rr(c,x,y,40,52,5); c.stroke(); c.setLineDash([]); if(!done&&!G.rows[me]) hits.push({x,y,w:40,h:52,fn:()=>{ const ids=[...sel].slice(0,CAP[k]-arr.rows[k].length); arr.rows[k]=arr.rows[k].concat(ids); sel.clear(); if(ids.length) sfx('place'); }}); } } }
    if(done){ const tot=G.res.tot[me]; c.fillStyle=tot>=0?'#86dc4f':'#ff8a8a'; c.font='900 18px '+TC; c.textAlign='center'; c.fillText((G.res.foul[me]?'倒水！ ':'')+'你這局 '+(tot>0?'+':'')+tot+' 墩',W/2,330); return; }
    if(G.rows[me]){ c.fillStyle='#fff'; c.font='700 15px '+TC; c.textAlign='center'; c.fillText('已送出，等其他人排好…',W/2,340); return; }
    hand(arrHand(),392,{click:toggle});
    c.fillStyle='#fff'; c.font='700 12px '+TC; c.textAlign='left'; c.fillText('點牌選取 → 點上面的空位放進去；點已放的牌拿回來',14,330);
    const full=arr.rows.every((r,k)=>r.length===CAP[k]),bad=full&&foul13(arr.rows);
    if(bad){ c.fillStyle='#ff8a8a'; c.font='900 13px '+TC; c.textAlign='center'; c.fillText('尾墩要最大、頭墩最小，現在會「倒水」',W/2,322); }
    btn('自動排牌',470,340,96,()=>{ arr.rows=arrange13(G.hands[me]).map(r=>r.slice()); sel.clear(); },false);
    btn('清空',574,340,70,()=>{ arr.rows=[[],[],[]]; sel.clear(); },false);
    btn('確定',652,340,80,()=>{ act({rows:arr.rows}); },!full,true);
  }
  function drawBJ(){
    if(!G.chips) return;
    // 莊家
    c.fillStyle='#fff'; c.font='900 15px '+TC; c.textAlign='center'; c.fillText('莊家',W/2,40);
    const hide=G.phase==='play'||G.phase==='bet'; (G.dealer||[]).forEach((id,i)=>drawCard(c,W/2-40+i*30,52,46,66,id,!(hide&&i===1),{back:L.back}));
    if(G.dealer&&G.dealer.length&&!hide){ c.fillStyle='#ffd23f'; c.font='900 14px '+TC; c.fillText(bjTotal(G.dealer)+' 點',W/2,132); }
    // 玩家坐成一個弧形面對莊家，自己在正中間
    const order=[...Array(np).keys()].filter(q=>q!==me),mid=Math.floor(np/2),slotOf=p=>{ if(p===me) return mid; const i=order.indexOf(p); return i<mid?i:i+1; };
    const pos=p=>{ if(np<=3){ const s=seatOf(p); return s==='b'?[W/2,300]:s==='l'?[130,250]:s==='r'?[670,250]:[670,150]; }
      const a=Math.PI*(.95-.9*slotOf(p)/(np-1)); return [400+Math.cos(a)*(np>5?340:330),170+Math.sin(a)*150+(p===me?0:10)]; };
    for(let p=0;p<np;p++){ const [x,y]=pos(p),h=G.hands[p]||[],small=p!==me,cw=small?(np>5?28:34):52,chh=small?(np>5?40:48):74;
      h.forEach((id,i)=>drawCard(c,x-((h.length-1)*(cw*.55)+cw)/2+i*cw*.55,y-chh,cw,chh,id,true));
      if(h.length){ const v=bjTotal(h); c.fillStyle=v>21?'#ff8a8a':'#ffd23f'; c.font='900 '+(small?13:15)+'px '+TC; c.textAlign='center'; c.fillText(v>21?'爆了 '+v:v+' 點',x,y+12); }
      const crowd=np>3&&p!==me,extra=crowd?String(G.chips[p]):G.chips[p]+' 籌碼'+(G.bets[p]>0?'　下注 '+G.bets[p]:''); // 人多時名牌只放籌碼，下注另一行
      if(crowd&&G.bets[p]>0){ c.fillStyle='#ffd23f'; c.font='900 12px '+TC; c.textAlign='center'; c.fillText('下注 '+G.bets[p],x,y+52); }
      plate(p,x,y+(p===me?38:34),extra,G.phase==='play'&&G.turn===p||G.phase==='bet'&&!G.bets[p]&&G.chips[p]>0);
      if(G.res&&G.res.res[p]){ const v=G.res.res[p]; c.fillStyle=v>0?'#86dc4f':'#ff8a8a'; c.font='900 15px '+TC; c.fillText((v>0?'+':'')+v,x,y-(small?58:86)); } }
    c.fillStyle='#cfe8d8'; c.font='700 12px '+TC; c.textAlign='center'; c.fillText('第 '+G.round+' / '+BJR+' 局',W/2,150);
    if(G.phase==='bet'&&!G.bets[me]&&G.chips[me]>0){ [50,100,200].forEach((v,i)=>btn('下注 '+v,W/2-170+i*116,400,104,()=>act({t:'bet',v}),G.chips[me]<1,i===1)); }
    else if(G.phase==='play'&&G.turn===me){ const h=G.hands[me];
      btn('要牌',W/2-170,400,104,()=>act({t:'hit'}),false,true); btn('停牌',W/2-54,400,104,()=>act({t:'stand'}),false); btn('加倍',W/2+62,400,104,()=>act({t:'double'}),h.length!==2||G.chips[me]<G.bets[me]); }
    else if(!G.over){ c.fillStyle='#fff'; c.font='700 14px '+TC; c.textAlign='center'; c.fillText(G.phase==='bet'?'等其他人下注…':G.phase==='play'?'等 '+names[G.turn]+' 決定…':'',W/2,420); }
  }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',onDown); },
    _dbg:{get G(){return G;},doAct,aiStep,arrange13,b2Combo,evalHand,best7,names}};
}

/* ---------- 開始畫面的示意圖 ---------- */
function stageShow(ctx,w,h,si,t){
  const g=ctx.createRadialGradient(w/2,h/2,30,w/2,h/2,w*.7); g.addColorStop(0,'#1f6b4a'); g.addColorStop(1,'#0b0a1c'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.09)+'px '+TC; ctx.fillStyle='#ffd23f'; ctx.fillText(GAMES[si],w/2,h*.1);
  const k=w/480,cw=48*k,ch=68*k,u=(t%4)/4;
  if(si===0){ // 大老二：中間依序出牌
    const plays=[[1,14,27],[3,16],[25,38,12,51,0]]; const pl=plays[Math.floor(t/1.3)%3];
    [[w*.12,h*.55],[w*.5,h*.2],[w*.88,h*.55]].forEach(([x,y])=>{ for(let i=0;i<6;i++) drawCard(ctx,x-cw*.4+i*4*k-12*k,y,cw*.6,ch*.6,0,false); });
    pl.forEach((id,i)=>drawCard(ctx,w/2-(pl.length*30*k)/2+i*30*k,h*.38,cw,ch,id,true));
    [0,5,18,31,44,9,22].forEach((id,i)=>drawCard(ctx,w/2-110*k+i*30*k,h*.72,cw,ch,id,true,{sel:i===Math.floor(t*2)%7})); }
  else if(si===1){ // 德州撲克：公牌一張張翻開
    const board=[12,25,38,10,49],n=Math.min(5,2+Math.floor(u*8));
    board.forEach((id,i)=>drawCard(ctx,w/2-130*k+i*54*k,h*.3,cw,ch,id,i<n));
    drawCard(ctx,w/2-54*k,h*.66,cw,ch,51,true); drawCard(ctx,w/2+6*k,h*.66,cw,ch,50,true);
    for(let i=0;i<6;i++){ ctx.fillStyle=['#e23b3b','#2f6fd0','#ffd23f'][i%3]; ctx.beginPath(); ctx.ellipse(w*.82,h*.8-i*5*k,22*k,8*k,0,0,7); ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke(); }
    ctx.fillStyle='#86dc4f'; ctx.font='900 '+Math.round(h*.07)+'px '+TC; ctx.fillText(n>=5?'同花順！':'',w/2,h*.92); }
  else if(si===2){ // 十三支：三墩牌滑進來
    const rows=[[12,25,38],[3,4,5,6,7],[48,49,50,51,47]],lbl=['頭墩','中墩','尾墩'];
    rows.forEach((r,k2)=>{ const y=h*.2+k2*ch*.82; ctx.fillStyle='#ffd23f'; ctx.font='900 '+Math.round(13*k)+'px '+TC; ctx.textAlign='left'; ctx.fillText(lbl[k2],w*.12,y+ch*.35);
      r.forEach((id,i)=>{ const appear=clamp(u*3-k2*.6-i*.08,0,1); drawCard(ctx,w*.28+i*40*k+(1-appear)*w*.5,y,cw*.8,ch*.8,id,true); }); }); ctx.textAlign='center'; }
  else { // 二十一點
    ctx.fillStyle='#fff'; ctx.font='900 '+Math.round(14*k)+'px '+TC; ctx.fillText('莊家',w/2,h*.2);
    drawCard(ctx,w/2-50*k,h*.25,cw,ch,9,true); drawCard(ctx,w/2+4*k,h*.25,cw,ch,0,u>.5);
    drawCard(ctx,w/2-50*k,h*.6,cw,ch,12,true); drawCard(ctx,w/2+4*k,h*.6,cw,ch,8,true);
    ctx.fillStyle='#86dc4f'; ctx.font='900 '+Math.round(h*.08)+'px '+TC; ctx.fillText(u>.3?'21 點！':'',w/2,h*.93); }
}
function thumb(ctx,w,h,t){
  const g=ctx.createRadialGradient(w/2,h/2,30,w/2,h/2,w*.7); g.addColorStop(0,'#1f6b4a'); g.addColorStop(1,'#0b0a1c'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  const ids=[47,48,49,50,51],k=w/480;
  ids.forEach((id,i)=>{ const a=(i-2)*.22+Math.sin(t*1.2)*.04; ctx.save(); ctx.translate(w/2+(i-2)*38*k,h*.62); ctx.rotate(a); drawCard(ctx,-30*k,-90*k,60*k,86*k,id,true); ctx.restore(); });
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.13)+'px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#0b0a1c'; ctx.strokeText('牌桌派對',w/2,h*.16); ctx.fillStyle='#ffd23f'; ctx.fillText('牌桌派對',w/2,h*.16);
  ctx.font='700 '+Math.round(h*.06)+'px '+TC; ctx.fillStyle='#cfe8d8'; ctx.fillText('大老二・德州撲克・十三支・二十一點',w/2,h*.9);
}

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).poker={
  name:'牌桌派對',tag:'CARD PARTY',color:'#e23b3b',online:true,maxPlayers:si=>si===1?9:si===3?7:4,bots:true,minPlayers:2, // 德州撲克最多 9 人、二十一點 7 人，其他 4 人
  desc:'一副撲克牌玩四種：大老二、德州撲克、十三支、二十一點。和電腦同桌，或開房間 2～4 人連線。',
  goal:'大老二：拿到最小牌的人先出，跟著出同張數、比上一手大的牌，先出完的人贏。德州撲克：兩張手牌配五張公牌湊最大的五張，打 8 手比籌碼；起始籌碼、盲注和人數（單機 4～9 人、連線最多 9 人）可以在開始前選。十三支：把 13 張分成頭墩 3、中墩 5、尾墩 5，尾墩最大、頭墩最小，和每家逐墩比大小。二十一點：和莊家比點數，越接近 21 越好，超過就爆，打 6 局比籌碼；最多 7 位玩家同桌（單機 3／5／7 人可選）。',
  stages:GAMES,
  options:[{key:'speed',label:'電腦速度',def:'normal',opts:[{id:'slow',label:'慢'},{id:'normal',label:'正常'},{id:'fast',label:'快'}]},
    {key:'chips',label:'德州撲克　起始籌碼',def:'1000',opts:[{id:'500',label:'500'},{id:'1000',label:'1000'},{id:'2000',label:'2000'},{id:'5000',label:'5000'}]},
    {key:'blind',label:'德州撲克　盲注',def:'10/20',opts:[{id:'5/10',label:'5／10'},{id:'10/20',label:'10／20'},{id:'25/50',label:'25／50'},{id:'50/100',label:'50／100'}]},
    {key:'seats',label:'德州撲克　單機人數',def:'6',opts:[{id:'4',label:'4 人'},{id:'6',label:'6 人'},{id:'8',label:'8 人'},{id:'9',label:'9 人'}]},
    {key:'bjseats',label:'二十一點　單機人數',def:'3',opts:[{id:'3',label:'3 人'},{id:'5',label:'5 人'},{id:'7',label:'7 人'}]}],
  help:[['點牌','選取／取消選取'],['按鈕','出牌、過、跟注、加注、要牌、停牌…'],['大老二','單張、一對、五張牌型（順子＜同花＜葫蘆＜鐵支＜同花順）'],['十三支','點牌再點空位放進墩裡，或按「自動排牌」']],
  touchHelp:[['點牌','選取／取消選取'],['按鈕','出牌、過、跟注、加注、要牌、停牌…'],['十三支','點牌再點空位放進墩裡，或按「自動排牌」']],
  touch:null,
  looks:[{key:'felt',label:'桌布顏色',type:'color',opts:['#1f6b4a','#1f4f7a','#6b1f3a','#3a2d57','#5a4630','#2b2b33']},
    {key:'back',label:'牌背',opts:[{id:'red',label:'紅色'},{id:'blue',label:'藍色'},{id:'purple',label:'紫色'},{id:'green',label:'綠色'}]}],
  best:{label:'最多籌碼',fmt:v=>v+' 籌碼',lower:false},
  stageShow,preview:(ctx,w,h,L,t)=>{ thumb(ctx,w,h,t); },thumb,create
};
})();
