// 骰子派對：吹牛、十八仔、妞妞、紅黑大小單雙四種骰子遊戲。
// 單機是你和電腦同桌；連線時房主負責擲骰與判定，其他人送出動作（作法同牌桌派對）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const GAMES=['吹牛','十八仔','妞妞','紅黑大小單雙'],GID=['liar','sb','nn','rb'];
const clamp=(v,a,b)=>v<a?a:v>b?b:v,rnd=()=>1+Math.floor(Math.random()*6),roll=n=>Array.from({length:n},rnd);
const CN=['','一','二','三','四','五','六','七','八','九'];

/* ---------- 牌型 ---------- */
// 十八仔：四顆一樣＝一色（最大）；要有一對，其他兩顆相加是點數（兩對取大的那對相加），12 點叫「十八」、3 點叫「BG」；三同一異或四顆都不同要重擲
function sbEval(d){ const cnt=[0,0,0,0,0,0,0]; d.forEach(v=>cnt[v]++);
  const four=cnt.indexOf(4); if(four>0) return {v:100+four,name:'一色'};
  if(cnt.includes(3)) return null;
  const pairs=[]; for(let f=1;f<=6;f++) if(cnt[f]===2) pairs.push(f); if(!pairs.length) return null;
  let pt; if(pairs.length===2) pt=Math.max(...pairs)*2; else { const o=d.filter(v=>v!==pairs[0]); pt=o[0]+o[1]; }
  return {v:pt,name:pt===12?'十八':pt===3?'BG':pt+' 點'}; }
// 妞妞：五顆一樣＝豹子；三顆湊成 10 是「妞」，另外兩顆相加取個位數（0＝妞妞最大）；湊不出來＝無妞
function nnEval(d){ if(d.every(v=>v===d[0])) return {v:1000+d[0],name:'豹子',grp:null};
  let best=null;
  for(let i=0;i<5;i++) for(let j=i+1;j<5;j++) for(let k=j+1;k<5;k++){ if((d[i]+d[j]+d[k])%10) continue;
    const rest=[0,1,2,3,4].filter(x=>x!==i&&x!==j&&x!==k),pt=(d[rest[0]]+d[rest[1]])%10,v=(pt===0?10:pt)*10+Math.max(d[rest[0]],d[rest[1]])/10;
    if(!best||v>best.v) best={v,name:pt===0?'妞妞':'妞'+CN[pt],grp:[i,j,k]}; }
  return best||{v:d.reduce((a,b)=>a+b,0)/100,name:'無妞',grp:null}; }
// 紅黑大小單雙：紅＝1、4（骰子上紅色的點），黑＝2、3、5、6
const CATS={red:[1,4],black:[2,3,5,6],big:[4,5,6],small:[1,2,3],odd:[1,3,5],even:[2,4,6]},CATK=['red','black','big','small','odd','even'],CATN={red:'紅',black:'黑',big:'大',small:'小',odd:'單',even:'雙'};

/* ---------- 畫骰子、骰盅、牌桌 ---------- */
let STY={die:'#fdfcf8',cup:'#8a3a2a'};
const setSty=L=>{ L=L||{}; STY={die:L.die||'#fdfcf8',cup:L.cup||'#8a3a2a'}; };
const dark=h=>{ const n=parseInt(String(h).slice(1),16); if(isNaN(n)) return false; return ((n>>16)&255)*.3+((n>>8)&255)*.59+(n&255)*.11<120; };
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const PIPS={1:[[.5,.5]],2:[[.27,.27],[.73,.73]],3:[[.27,.27],[.5,.5],[.73,.73]],4:[[.27,.27],[.73,.27],[.27,.73],[.73,.73]],5:[[.27,.27],[.73,.27],[.5,.5],[.27,.73],[.73,.73]],6:[[.27,.25],[.73,.25],[.27,.5],[.73,.5],[.27,.75],[.73,.75]]};
function drawDie(c,x,y,s,f,o){ o=o||{}; c.save(); if(o.dim) c.globalAlpha=.3;
  c.fillStyle='rgba(0,0,0,.3)'; rr(c,x+2,y+3,s,s,s*.2); c.fill();
  c.fillStyle=STY.die; rr(c,x,y,s,s,s*.2); c.fill(); c.strokeStyle=o.hl?'#ffd23f':'rgba(0,0,0,.35)'; c.lineWidth=o.hl?3:1; c.stroke();
  if(f){ const dk=dark(STY.die); for(const [px,py] of PIPS[f]){ c.fillStyle=(f===1||f===4)?'#e2232f':dk?'#fff':'#1c1a26'; c.beginPath(); c.arc(x+px*s,y+py*s,s*(f===1?.15:.085),0,7); c.fill(); } }
  else { c.fillStyle=dark(STY.die)?'#fff':'#1c1a26'; c.font='900 '+Math.round(s*.6)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('?',x+s/2,y+s/2+1); }
  c.restore(); }
function drawCup(c,x,y,s,lift,rot,al,noPlate){ // x,y＝底盤中心；lift＝蓋子抬起多高；rot＝傾斜；al＝透明度
  const col=STY.cup; c.save();
  if(!noPlate){ c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(x,y+3,s*.7,s*.17,0,0,7); c.fill();
    c.fillStyle='#d9b25a'; c.beginPath(); c.ellipse(x,y,s*.66,s*.15,0,0,7); c.fill(); c.fillStyle='#a8823a'; c.beginPath(); c.ellipse(x,y-1,s*.56,s*.11,0,0,7); c.fill(); }
  c.translate(x,y-(lift||0)); c.rotate(rot||0); if(al!=null) c.globalAlpha=Math.max(0,al);
  const g=c.createLinearGradient(-s*.55,0,s*.55,0); g.addColorStop(0,col); g.addColorStop(.35,'#ffffff40'); g.addColorStop(.5,col); g.addColorStop(1,'#00000055');
  const body=()=>{ c.beginPath(); c.moveTo(-s*.55,0); c.bezierCurveTo(-s*.58,-s*.45,-s*.42,-s*.78,0,-s*.8); c.bezierCurveTo(s*.42,-s*.78,s*.58,-s*.45,s*.55,0); c.closePath(); };
  body(); c.fillStyle=col; c.fill(); body(); c.fillStyle=g; c.fill(); c.strokeStyle='rgba(0,0,0,.35)'; c.lineWidth=1.5; c.stroke();
  c.fillStyle='#d9b25a'; c.beginPath(); c.ellipse(0,-s*.02,s*.56,s*.07,0,0,7); c.fill();
  c.strokeStyle='#d9b25a'; c.lineWidth=Math.max(1.5,s*.03); c.beginPath(); c.ellipse(0,-s*.42,s*.5,s*.05,0,Math.PI*.05,Math.PI*.95); c.stroke();
  c.fillStyle='#d9b25a'; c.fillRect(-s*.07,-s*.9,s*.14,s*.12); c.beginPath(); c.arc(0,-s*.93,s*.1,0,7); c.fill();
  c.fillStyle='rgba(255,255,255,.5)'; c.beginPath(); c.arc(-s*.03,-s*.96,s*.035,0,7); c.fill();
  c.restore(); }
function drawTable(c,w,h,L,t){
  const k=w/800,bg=(L&&L.bg)||'felt',felt=(L&&L.felt)||'#5a2a2a',cx=w/2,cy=h*.46,rx=w*.47,ry=h*.43;
  if(bg==='felt'){ const g=c.createRadialGradient(cx,h/2,60*k,cx,h/2,520*k); g.addColorStop(0,felt); g.addColorStop(1,'#0b0a1c'); c.fillStyle=g; c.fillRect(0,0,w,h); return; }
  if(bg==='wood'){ c.fillStyle='#3a2416'; c.fillRect(0,0,w,h); c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=2*k; for(let y=0;y<h;y+=26*k){ c.beginPath(); c.moveTo(0,y); c.lineTo(w,y); c.stroke(); } }
  else if(bg==='night'){ const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#0b0f2e'); g.addColorStop(1,'#1d1240'); c.fillStyle=g; c.fillRect(0,0,w,h); for(let i=0;i<70;i++){ c.globalAlpha=.4+.6*Math.abs(Math.sin((t||0)*1.3+i)); c.fillStyle='#fff'; c.fillRect((i*137)%w,(i*71)%h,1.6*k,1.6*k); } c.globalAlpha=1; }
  else if(bg==='market'){ c.fillStyle='#2a1a30'; c.fillRect(0,0,w,h); for(let i=0;i<9;i++){ const x=w*(.06+i*.11),y=h*.08+Math.sin(i)*8*k; c.fillStyle='rgba(255,90,60,.9)'; c.beginPath(); c.ellipse(x,y,12*k,16*k,0,0,7); c.fill(); c.fillStyle='rgba(255,220,120,'+(.5+.3*Math.sin((t||0)*3+i))+')'; c.beginPath(); c.arc(x,y,6*k,0,7); c.fill(); } }
  c.fillStyle=bg==='wood'?'#7a4a22':bg==='night'?'#2a2a4a':'#6a3a2a'; c.beginPath(); c.ellipse(cx,cy,rx+16*k,ry+16*k,0,0,7); c.fill();
  c.strokeStyle='#d9b25a'; c.lineWidth=3*k; c.beginPath(); c.ellipse(cx,cy,rx+7*k,ry+7*k,0,0,7); c.stroke();
  const g2=c.createRadialGradient(cx,cy,30*k,cx,cy,rx); g2.addColorStop(0,felt); g2.addColorStop(1,'rgba(0,0,0,.55)'); c.fillStyle=felt; c.beginPath(); c.ellipse(cx,cy,rx,ry,0,0,7); c.fill(); c.fillStyle=g2; c.fill(); }

function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,me=net?net.me:0;
  const kind=GID[clamp(opts.stage||0,0,3)],humans=net?net.count:1,OP=opts.options||{};
  const np=net?Math.min(6,net.count+(net.bots||0)):clamp(+OP.seats||4,2,6);
  const L=opts.look||{}; setSty(L);
  const AID=[3.2,2.2,1.3][Math.max(0,['slow','normal','fast'].indexOf(OP.speed||'normal'))];
  const {ctx:c,canvas}=env.canvas2d(W,H);
  const names=[]; for(let i=0;i<np;i++) names.push(i<humans?(net?(net.names&&net.names[i])||'玩家'+(i+1):(opts.name||'你')):'電腦 '+(i-humans+1));
  const isAI=p=>p>=humans,sfx=n=>env.sfx(n),SHK=1.3,shake=who=>{ G.shk++; G.shkWho=who; };
  let G={kind,log:'',over:null,seq:0,shk:0,shkWho:-1},t=0,lastTurn=-2,aiWait=0,shkSeen=0,shkT=9,aiT=0,msg='',msgT=0,ended=false,btns=[],seenSeq=-1,animT=0;
  const say=(s,sec)=>{ msg=s; msgT=sec||2; },log=s=>{ G.log=s; };

  /* ===== 吹牛 ===== */
  const LIVES=clamp(+OP.lives||3,1,9),fr=f=>f===1?7:f; // 喊「一」最大（喊一的時候一不當萬用）
  const aliveL=()=>[...Array(np).keys()].filter(p=>G.lives[p]>0);
  const totalDice=()=>aliveL().length*5,minQ=()=>aliveL().length;
  function liarSetup(){ G.lives=new Array(np).fill(LIVES); liarRound(Math.floor(Math.random()*np)); }
  function liarRound(start){ G.dice=[]; for(let p=0;p<np;p++) G.dice[p]=G.lives[p]>0?roll(5).sort((a,b)=>a-b):[]; G.bid=null; G.reveal=null; G.turn=start; G.seq++; shake(-1); log('大家搖好骰子了，'+names[start]+' 先喊（至少 '+minQ()+' 個）'); }
  const liarOK=(q,f)=>q<=totalDice()&&f>=1&&f<=6&&(G.bid?(q>G.bid.q||q===G.bid.q&&fr(f)>fr(G.bid.f)):q>=minQ());
  function liarBid(p,q,f){ if(G.over||G.reveal||G.turn!==p) return '不是你的回合'; if(!liarOK(q,f)) return G.bid?'要喊得比「'+G.bid.q+' 個 '+G.bid.f+'」大：個數多，或同個數但點數大（1 最大）':'第一個喊至少 '+minQ()+' 個';
    G.bid={q,f,by:p}; log(names[p]+' 喊：'+q+' 個 '+f+(f===1?'（一不當萬用）':'')); sfx('click'); const al=aliveL(); G.turn=al[(al.indexOf(p)+1)%al.length]; return null; }
  function liarOpen(p){ if(G.over||G.reveal||G.turn!==p||!G.bid) return '還沒有人喊，不能開'; const b=G.bid;
    let cnt=0; for(const q of aliveL()) for(const d of G.dice[q]) if(d===b.f||(b.f!==1&&d===1)) cnt++;
    const loser=cnt>=b.q?p:b.by; G.lives[loser]--; G.reveal={f:b.f,q:b.q,cnt,loser,opener:p,until:5.5}; G.seq++;
    log(names[p]+' 開！共 '+cnt+' 個 '+b.f+'，'+names[loser]+' 輸了'+(G.lives[loser]<=0?'，出局！':'')); sfx(loser===me?'hurt':'boom'); return null; }
  function liarAI(p){ const mine=G.dice[p],tot=totalDice(),E=f=>mine.filter(d=>d===f||(f!==1&&d===1)).length+(tot-5)*(f===1?1/6:1/3);
    if(G.bid&&G.bid.q>E(G.bid.f)+1.1+Math.random()*.9) return liarOpen(p);
    let best=null,br=1e9; for(let f=1;f<=6;f++){ const q=G.bid?(fr(f)>fr(G.bid.f)?G.bid.q:G.bid.q+1):minQ(); if(q>tot) continue; const risk=q-E(f)+Math.random()*.7; if(risk<br){ br=risk; best={q,f}; } }
    if(!best||G.bid&&br>1.3) return liarOpen(p);
    return liarBid(p,best.q,best.f); }

  /* ===== 十八仔／妞妞：每局下注、輪流擲骰，最大的贏彩池 ===== */
  const START=+OP.chips||1000,BET=+OP.bet||50,ROUNDS=8;
  function potSetup(){ G.chips=new Array(np).fill(START); G.round=0; potRound(); }
  function potRound(){ const ok=[...Array(np).keys()].filter(p=>G.chips[p]>0);
    if(G.round>=ROUNDS||ok.length<2||(!net&&G.chips[0]<=0)){ G.over={chips:G.chips.slice()}; return; }
    G.round++; G.rolls=new Array(np).fill(null); G.inRound=new Array(np).fill(false); G.pot=0; G.show=null;
    if(kind==='nn'){ // 妞妞：莊家照順序輪；閒家下注，最後莊家擲
      const bk=G.banker==null?ok[Math.floor(Math.random()*ok.length)]:(ok.find(q=>q>G.banker)??ok[0]); G.banker=bk; G.bets=new Array(np).fill(0);
      for(const p of ok){ G.inRound[p]=true; if(p!==bk){ const b=Math.min(BET,G.chips[p]); G.chips[p]-=b; G.bets[p]=b; } }
      G.turn=ok.find(q=>q>bk)??ok[0]; log('第 '+G.round+' / '+ROUNDS+' 局：'+names[bk]+' 當莊家，閒家每人下注 '+BET); return; }
    for(const p of ok){ const b=Math.min(BET,G.chips[p]); G.chips[p]-=b; G.pot+=b; G.inRound[p]=true; }
    G.turn=ok[0]; log('第 '+G.round+' / '+ROUNDS+' 局：每人下注 '+BET+'，彩池 '+G.pot); }
  // 妞妞賠率：妞妞、豹子 3 倍，妞七～妞九 2 倍，其他 1 倍
  const nnMul=e=>e.v>=100?3:e.v>=70?2:1;
  function nnSettle(){ const bk=G.banker,be=G.rolls[bk].e,res=new Array(np).fill(0),ws=[];
    for(let p=0;p<np;p++){ if(p===bk||!G.rolls[p]) continue; const e=G.rolls[p].e,b=G.bets[p];
      if(e.v>be.v){ const pay=Math.min(G.chips[bk],b*nnMul(e)); G.chips[bk]-=pay; G.chips[p]+=b+pay; res[p]=pay; res[bk]-=pay; ws.push(p); }
      else { const extra=Math.min(G.chips[p],b*(nnMul(be)-1)); G.chips[p]-=extra; G.chips[bk]+=b+extra; res[p]=-(b+extra); res[bk]+=b+extra; } } // 一樣大算莊家贏
    if(res[bk]>0) ws.push(bk);
    G.show={ws,res,until:5}; G.turn=-1; log('莊家 '+names[bk]+' '+be.name+'：'+(res[bk]>=0?'贏 '+res[bk]:'輸 '+(-res[bk]))); sfx('win'); }
  function potRoll(p){ if(G.over||G.show||G.turn!==p||!G.inRound[p]) return '不是你的回合';
    let d,e,re=0; if(kind==='sb'){ do{ d=roll(4); e=sbEval(d); re++; }while(!e&&re<30); if(!e){ d=[1,1,1,2]; e={v:0,name:'無點'}; } } else { d=roll(5); e=nnEval(d); re=1; }
    G.rolls[p]={d,e,re:re-1}; G.seq++; shake(p); log(names[p]+' 擲出 '+e.name+(re>1?'（重擲 '+(re-1)+' 次）':''));
    const rest=[...Array(np).keys()].filter(q=>G.inRound[q]&&!G.rolls[q]);
    if(rest.length){ const order=[...Array(np).keys()]; for(let k=1;k<=np;k++){ const q=(p+k)%np; if(rest.includes(q)){ G.turn=q; break; } } }
    else if(kind==='nn') nnSettle(); else potSettle(); return null; }
  function potSettle(){ let best=-1,ws=[]; for(let p=0;p<np;p++){ const r=G.rolls[p]; if(!r) continue; if(r.e.v>best){ best=r.e.v; ws=[p]; } else if(r.e.v===best) ws.push(p); }
    const share=Math.floor(G.pot/ws.length); ws.forEach((p,i)=>G.chips[p]+=share+(i<G.pot%ws.length?1:0));
    G.show={ws,until:4.5}; G.turn=-1; log(ws.map(p=>names[p]).join('、')+' 贏得彩池 '+G.pot+'（'+G.rolls[ws[0]].e.name+'）'); sfx('win'); }

  /* ===== 紅黑大小單雙 ===== */
  function rbSetup(){ G.lives=new Array(np).fill(LIVES); rbRound(Math.floor(Math.random()*np)); }
  function rbRound(start){ G.dice=[]; for(let p=0;p<np;p++) G.dice[p]=G.lives[p]>0?roll(5):[]; G.turn=start; G.last=null; G.lost=null; G.phase='call'; rbShake(); }
  function rbShake(){ for(let p=0;p<np;p++) G.dice[p]=roll(G.dice[p].length).sort((a,b)=>a-b); G.seq++; shake(-1);
    log('換 '+names[G.turn]+' 喊'+(G.dice[G.turn].length===1?'（只剩一顆，要盲猜）':'，大家重新搖骰了')); }
  function rbCall(p,cat){ if(G.over||G.phase!=='call'||G.turn!==p) return '不是你的回合'; if(!CATS[cat]) return '請選一種';
    const own=G.dice[p].slice(),blind=own.length===1,set=CATS[cat],removed=G.dice.map(d=>d.filter(v=>set.includes(v)).length),before=G.dice.map(d=>d.slice());
    G.dice=G.dice.map(d=>d.filter(v=>!set.includes(v)));
    G.last={by:p,cat,blind,own,removed,before,safe:blind&&removed[p]===0}; G.phase='show'; G.until=4.5; G.seq++;
    log(names[p]+(blind?' 盲猜拿掉「':' 亮骰，拿掉「')+CATN[cat]+'」'+(blind?(removed[p]?'，猜中自己的骰子……':'，過關！'):'')); sfx(blind&&removed[p]?'hurt':'item'); return null; }
  function rbNext(){ const zero=aliveL().filter(p=>!G.dice[p].length);
    if(zero.length){ zero.forEach(p=>G.lives[p]--); if(!aliveL().length) zero.forEach(p=>G.lives[p]=1); // 大家同時用完命：都留一條再比
      G.lost={who:zero,out:zero.filter(p=>G.lives[p]<=0)}; G.phase='lost'; G.until=4.2; G.seq++;
      log(zero.map(p=>names[p]).join('、')+' 的骰子被拿光，少一條命'+(G.lost.out.length?'，'+G.lost.out.map(p=>names[p]).join('、')+' 出局！':'')); sfx(zero.includes(me)?'hurt':'boom'); return; }
    const al=aliveL(); G.turn=al.find(q=>q>G.turn)??al[0]; G.phase='call'; rbShake(); }
  function rbAfterLost(){ const al=aliveL(); if(al.length<=1){ G.over={win:al[0]}; return; }
    const L2=G.lost.who[0]; rbRound(G.lives[L2]>0?L2:al.find(q=>q>L2)??al[0]); }
  function rbAI(p){ const own=G.dice[p],others=G.dice.reduce((a,d,q)=>q===p?a:a+d.length,0);
    let best='red',bs=-1e9;
    for(const k of CATK){ const pr=CATS[k].length/6; let sc;
      if(own.length===1) sc=others*pr-pr*30; // 盲猜：猜中自己就輸，挑最不容易中的
      else { const mine=own.filter(v=>CATS[k].includes(v)).length; sc=others*pr-mine*(1.2+(5-own.length)*.4); if(mine===own.length) sc-=100; }
      sc+=Math.random()*.4; if(sc>bs){ bs=sc; best=k; } }
    return rbCall(p,best); }

  /* ===== 共用 ===== */
  const SETUP={liar:liarSetup,sb:potSetup,nn:potSetup,rb:rbSetup};
  function doAct(p,a){
    if(kind==='liar') return a.t==='open'?liarOpen(p):liarBid(p,a.q|0,a.f|0);
    if(kind==='rb') return rbCall(p,a.cat);
    return potRoll(p); }
  function act(a){ if(client){ net.send({act:a}); return; } const err=doAct(me,a); if(err){ say(err,2.4); sfx('bump'); } else broadcast(); }
  function broadcast(){ if(net&&net.host) net.send({st:G}); }
  const left=new Set();
  if(net){
    if(client) net.onmsg=m=>{ if(m.st) G=m.st; if(m.bad&&m.bad[0]===me){ say(m.bad[1],2.4); sfx('bump'); } };
    else { net.onmsg=(m,from)=>{ if(!m.act) return; const err=doAct(from,m.act); if(err) net.send({bad:[from,err]}); broadcast(); };
      net.onleave=i=>{ left.add(i); names[i]+='（離開）'; broadcast(); }; }
  }
  if(!client){ SETUP[kind](); broadcast(); }
  function aiStep(){
    if(G.over) return; const p=G.turn; if(p<0||!(isAI(p)||left.has(p))) return;
    if(kind==='liar'&&!G.reveal) liarAI(p); else if(kind==='rb'&&G.phase==='call') rbAI(p); else if((kind==='sb'||kind==='nn')&&!G.show) potRoll(p);
    broadcast(); }
  function update(dt){
    t+=dt; if(msgT>0) msgT-=dt; if(G.shk!==shkSeen){ shkSeen=G.shk; shkT=0; sfx('rattle'); } shkT+=dt;
    if(client){ if(G.over&&!ended){ ended=true; setTimeout(finish,1800); } return; }
    if(ended) return;
    if(G.over){ ended=true; setTimeout(finish,1800); return; }
    if(kind==='liar'&&G.reveal){ G.reveal.until-=dt; if(G.reveal.until<=0){ const al=aliveL(); if(al.length<=1){ G.over={win:al[0]}; } else { const L2=G.reveal.loser; liarRound(G.lives[L2]>0?L2:al.find(q=>q>L2)??al[0]); } broadcast(); } return; }
    if((kind==='sb'||kind==='nn')&&G.show){ G.show.until-=dt; if(G.show.until<=0){ potRound(); broadcast(); } return; }
    if(kind==='rb'&&(G.phase==='show'||G.phase==='lost')){ G.until-=dt; if(G.until<=0){ if(G.phase==='show') rbNext(); else rbAfterLost(); broadcast(); } return; }
    if(shkT<SHK) return; if(G.turn!==lastTurn){ lastTurn=G.turn; aiT=0; aiWait=AID*(.75+Math.random()*.6); } aiT+=dt; if(aiT>aiWait){ aiT=0; lastTurn=-2; aiStep(); }
  }
  function finish(){
    const tbl=(h,list)=>'<table class="ls"><tr><th>名次</th><th>玩家</th><th>'+h+'</th></tr>'+list.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>').join('')+'</table>';
    let title,html,text='',score=null;
    if(kind==='liar'){ const w=G.over.win,list=names.map((n,p)=>[n,G.lives[p]>0?'剩 '+G.lives[p]+' 條命':'出局',G.lives[p]]).sort((a,b)=>b[2]-a[2]);
      title=w===me?'你是吹牛王！':names[w]+' 撐到最後'; html=tbl('結果',list); text='喊錯或開錯都會少一條命，命用完就出局。'; }
    else if(kind==='rb'){ const w=G.over.win,list=names.map((n,p)=>[n,G.lives[p]>0?'剩 '+G.lives[p]+' 條命':'出局',G.lives[p]]).sort((a,b)=>b[2]-a[2]);
      title=w===me?'你撐到最後！':names[w]+' 撐到最後'; html=tbl('結果',list); text='骰子被拿光就少一條命，命用完就出局。'; }
    else { const ch=G.over.chips,list=names.map((n,p)=>[n,ch[p]+' 籌碼',ch[p]]).sort((a,b)=>b[2]-a[2]);
      title=list[0][0]===names[me]?'你贏最多！':list[0][0]+' 贏最多'; html=tbl('籌碼',list); score=ch[me]>0?ch[me]:null; text='打完 '+ROUNDS+' 局比籌碼。'; }
    env.sfx(title.startsWith('你')?'win':'lose'); env.end({title,big:GAMES[GID.indexOf(kind)],html,text,score,next:false});
  }

  /* ===== 操作 ===== */
  function toLogical(e){ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=(r.width-W*s)/2,oy=(r.height-H*s)/2; return [(e.clientX-r.left-ox)/s,(e.clientY-r.top-oy)/s]; }
  function onDown(e){ e.preventDefault(); const [x,y]=toLogical(e); for(const b of btns) if(!b.dis&&x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h){ sfx('click'); b.fn(); return; } }
  canvas.addEventListener('pointerdown',onDown); canvas.style.touchAction='none';
  let bq=0,bf=0; // 吹牛：自己要喊的個數、點數

  /* ===== 畫面 ===== */
  function btn(label,x,y,w,fn,dis,main,h){ btns.push({label,x,y,w,h:h||36,fn,dis,main}); }
  function drawBtns(){ for(const b of btns){ c.fillStyle=b.dis?'rgba(20,18,40,.6)':b.main?'#ffd23f':b.sel?'#3ddbd9':'#2b2759'; rr(c,b.x,b.y,b.w,b.h,10); c.fill(); c.strokeStyle='#0b0a1c'; c.lineWidth=2; c.stroke();
    if(b.die){ drawDie(c,b.x+(b.w-b.h*.7)/2,b.y+b.h*.15,b.h*.7,b.die,{hl:b.sel}); continue; }
    c.fillStyle=b.dis?'#6b6799':b.main||b.sel?'#14122b':'#fff'; c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(b.label,b.x+b.w/2,b.y+b.h/2+1); } }
  function plate(p,x,y,extra,active){ const s=names[p]+(extra?'　'+extra:''); c.font='700 13px '+TC; const w=c.measureText(s).width+20;
    c.fillStyle=active?'rgba(255,210,63,.95)':'rgba(11,10,28,.72)'; rr(c,x-w/2,y-12,w,24,12); c.fill(); c.fillStyle=active?'#14122b':'#fff'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(s,x,y+1);
    if(active&&p!==me&&!shaking()){ const tx='思考中'+'.'.repeat(1+Math.floor(t*2.5)%3); c.font='900 12px '+TC; const bw=64; // 輪到誰：名牌下面跳出「思考中…」
      c.fillStyle='#fff'; rr(c,x-bw/2,y+14,bw,20,10); c.fill(); c.fillStyle='#14122b'; c.textAlign='left'; c.fillText(tx,x-bw/2+10,y+25); } }
  function seat(p){ if(p===me) return {x:400,y:430}; const rel=(p-me+np)%np,a=Math.PI*(.97+1.06*(rel-1)/Math.max(1,np-2)); return np===2?{x:400,y:120}:{x:400+Math.cos(a)*300,y:205+Math.sin(a)*140}; }
  const shaking=()=>shkT<SHK;
  function cupAnim(p){ if(shkT>=SHK||(G.shkWho!==-1&&G.shkWho!==p)) return null; const k=shkT;
    if(k<.9) return {dx:Math.sin(k*28)*7,rot:Math.sin(k*34)*.22,lift:Math.abs(Math.sin(k*22))*.08,cover:true};
    const u=(k-.9)/(SHK-.9); return {dx:0,rot:-u*.3,lift:u*.9,al:1-u,cover:false}; }
  // 有骰盅的位置：搖的時候蓋著晃，掀蓋時骰子露出來；沒在搖就看 idleCover（蓋著或直接秀骰子）
  function cupSpot(p,x,y,s,dice,idleCover){ const a=cupAnim(p);
    if(!a){ if(idleCover) drawCup(c,x,y,s); else dice(); return; }
    if(!a.cover) dice(); drawCup(c,x+a.dx,y,s,a.lift*s,a.rot,a.al,!a.cover); }
  function diceRow(arr,x,y,s,o){ o=o||{}; const n=arr.length,gap=s*1.12; arr.forEach((f,i)=>drawDie(c,x-(n*gap-gap+s)/2+i*gap,y,s,f,{hl:o.hl&&o.hl(f,i),dim:o.dim&&o.dim(f,i)})); }

  function draw(){
    btns=[]; setSty(L); drawTable(c,W,H,L,t);
    c.textAlign='left'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 16px '+TC; c.fillText(GAMES[GID.indexOf(kind)],14,20);
    if(G.log){ c.font='700 12px '+TC; let tx=G.log; while(c.measureText(tx).width>330&&tx.length>4) tx=tx.slice(0,-2); if(tx!==G.log) tx+='…'; const w=c.measureText(tx).width+20; c.fillStyle='rgba(11,10,28,.72)'; rr(c,10,34,w,22,11); c.fill(); c.fillStyle='#fff'; c.textAlign='left'; c.fillText(tx,20,45); }
    if(kind==='liar') drawLiar(); else if(kind==='rb') drawRB(); else drawPot();
    drawBtns();
    if(msgT>0&&msg){ c.font='900 16px '+TC; c.textAlign='center'; const w=c.measureText(msg).width+30; c.fillStyle='rgba(180,30,50,.92)'; rr(c,W/2-w/2,H/2-22,w,40,14); c.fill(); c.fillStyle='#fff'; c.fillText(msg,W/2,H/2-1); }
  }
  function drawLiar(){
    if(!G.lives) return; const R=G.reveal,b=G.bid;
    for(let p=0;p<np;p++){ if(p===me) continue; const {x,y}=seat(p),out=G.lives[p]<=0;
      if(R&&!out){ diceRow(G.dice[p],x,y-26,20,{hl:f=>f===R.f||(R.f!==1&&f===1)}); }
      else if(!out){ const a=cupAnim(p); drawCup(c,x+(a?a.dx:0),y-4,48,a&&a.cover?a.lift*48:0,a&&a.cover?a.rot:0); }
      plate(p,x,y+18,out?'出局':'♥'.repeat(G.lives[p]),!R&&G.turn===p&&!G.over); }
    // 中間：目前喊的
    if(b){ c.fillStyle='rgba(11,10,28,.6)'; rr(c,W/2-150,170,300,70,16); c.fill(); c.fillStyle='#cfe8d8'; c.font='700 13px '+TC; c.textAlign='center'; c.fillText(names[b.by]+' 喊',W/2,186);
      c.fillStyle='#ffd23f'; c.font='900 30px '+TC; c.fillText(b.q+' 個',W/2-30,218); drawDie(c,W/2+30,198,40,b.f); }
    if(R){ c.fillStyle=R.loser===me?'#ff8a8a':'#86dc4f'; c.font='900 20px '+TC; c.textAlign='center'; c.fillText('開盅！共 '+R.cnt+' 個 '+R.f+'　'+names[R.loser]+' 輸',W/2,268); }
    // 自己
    const out=G.lives[me]<=0; if(!out) cupSpot(me,W/2,432,120,()=>diceRow(G.dice[me],W/2,384,46,{hl:f=>R&&(f===R.f||(R.f!==1&&f===1))}),false);
    plate(me,W/2,458,out?'出局':'♥'.repeat(G.lives[me]),!R&&G.turn===me&&!G.over);
    const my=!R&&G.turn===me&&!G.over&&!out&&!shaking();
    if(my){ if(!bq||!liarOK(bq,bf||1)){ const f0=bf||(G.bid?G.bid.f:6); bq=G.bid?(fr(f0)>fr(G.bid.f)?G.bid.q:G.bid.q+1):minQ(); bf=f0; }
      c.fillStyle='#fff'; c.font='900 14px '+TC; c.textAlign='left'; c.fillText('我要喊：',24,300);
      btn('−',96,282,36,()=>{ bq=Math.max(1,bq-1); }); c.fillStyle='#ffd23f'; c.font='900 24px '+TC; c.textAlign='center'; c.fillText(bq+' 個',170,300); btn('＋',206,282,36,()=>{ bq=Math.min(totalDice(),bq+1); });
      for(let f=1;f<=6;f++){ btn('',250+(f-1)*46,280,42,()=>{ bf=f; },false,false,40); btns[btns.length-1].die=f; btns[btns.length-1].sel=bf===f; }
      btn('喊',540,282,70,()=>act({t:'bid',q:bq,f:bf}),!liarOK(bq,bf),true); btn('開！',620,282,80,()=>act({t:'open'}),!G.bid); }
    else if(!G.over&&!R&&!out){ c.fillStyle='#fff'; c.font='700 14px '+TC; c.textAlign='center'; c.fillText(shaking()?'大家搖骰中…':'等 '+names[G.turn]+' 喊…',W/2,shaking()?258:300); }
  }
  function drawPot(){
    if(!G.chips) return; const S=G.show;
    for(let p=0;p<np;p++){ if(p===me) continue; const {x,y}=seat(p),r=G.rolls[p];
      if(r){ cupSpot(p,x,y-4,48,()=>diceRow(r.d,x,y-28,kind==='sb'?22:19,{hl:(f,i)=>kind==='nn'&&r.e.grp&&r.e.grp.includes(i)}),false); if(!cupAnim(p)){ c.fillStyle=S&&S.ws.includes(p)?'#86dc4f':'#ffd23f'; c.font='900 13px '+TC; c.textAlign='center'; c.fillText(r.e.name,x,y-38); } }
      else if(G.inRound[p]) drawCup(c,x,y-4,44);
      plate(p,x,y+18,(kind==='nn'&&G.banker===p?'莊 ':'')+G.chips[p]+(G.inRound[p]?'':'（觀戰）')+(S&&S.res&&S.res[p]&&!shaking()?'（'+(S.res[p]>0?'+':'')+S.res[p]+'）':''),!S&&G.turn===p&&!G.over); }
    c.fillStyle='rgba(11,10,28,.6)'; rr(c,W/2-110,176,220,56,14); c.fill(); c.fillStyle='#fff'; c.font='900 18px '+TC; c.textAlign='center'; c.fillText(kind==='nn'?'莊家：'+names[G.banker]:'彩池 '+G.pot,W/2,198); c.fillStyle='#cfe8d8'; c.font='700 12px '+TC; c.fillText('第 '+G.round+' / '+ROUNDS+' 局　'+(kind==='nn'?'閒家下注 ':'每局 ')+BET,W/2,220);
    const r=G.rolls[me];
    if(r){ cupSpot(me,W/2,430,120,()=>diceRow(r.d,W/2,370,48,{hl:(f,i)=>kind==='nn'&&r.e.grp&&r.e.grp.includes(i)}),false); if(!cupAnim(me)){ c.fillStyle=S&&S.ws.includes(me)?'#86dc4f':'#ffd23f'; c.font='900 24px '+TC; c.textAlign='center'; c.fillText(r.e.name+(r.re?'（重擲 '+r.re+' 次）':''),W/2,350); } }
    else if(G.inRound[me]) drawCup(c,W/2,430,120);
    plate(me,W/2,458,(kind==='nn'&&G.banker===me?'莊家　':'')+G.chips[me]+' 籌碼'+(S&&S.res&&S.res[me]&&!shaking()?'（'+(S.res[me]>0?'+':'')+S.res[me]+'）':''),!S&&G.turn===me&&!G.over);
    if(S&&S.ws.includes(me)&&!shaking()){ c.fillStyle='#86dc4f'; c.font='900 18px '+TC; c.textAlign='center'; c.fillText(kind==='nn'&&G.banker!==me?'你贏過莊家！':'你贏了這局！',W/2,262); }
    else if(S&&S.res&&S.res[me]<0&&!shaking()){ c.fillStyle='#ff8a8a'; c.font='900 18px '+TC; c.textAlign='center'; c.fillText(G.banker===me?'莊家這局輸了':'輸給莊家了',W/2,262); }
    if(!S&&G.turn===me&&!G.over&&!shaking()) btn('擲骰',W/2+150,400,110,()=>act({t:'roll'}),false,true,46);
    if(kind==='nn'&&r&&r.e.grp&&!cupAnim(me)){ c.fillStyle='#cfe8d8'; c.font='700 12px '+TC; c.textAlign='center'; c.fillText('亮起來的三顆湊成 10',W/2,428); }
  }
  function drawRB(){
    if(!G.dice||!G.lives) return; const Ls=G.last,show=G.phase==='show',LO=G.phase==='lost'?G.lost:null,hearts=p=>'♥'.repeat(Math.max(0,G.lives[p]));
    for(let p=0;p<np;p++){ if(p===me) continue; const {x,y}=seat(p),n=G.dice[p].length,out=G.lives[p]<=0&&!(LO&&LO.who.includes(p));
      if(show&&Ls&&Ls.by===p&&!Ls.blind) diceRow(Ls.own,x,y-26,20,{dim:f=>CATS[Ls.cat].includes(f)});
      else if(!out&&n){ const a=cupAnim(p); drawCup(c,x+(a?a.dx:0),y-4,46,a&&a.cover?a.lift*46:0,a&&a.cover?a.rot:0); }
      plate(p,x,y+18,out?'出局':hearts(p)+'　'+n+' 顆'+(show&&Ls&&Ls.removed[p]?'（-'+Ls.removed[p]+'）':''),G.phase==='call'&&G.turn===p&&!G.over); }
    if(LO){ c.fillStyle='rgba(11,10,28,.75)'; rr(c,W/2-200,240,400,52,16); c.fill(); c.fillStyle=LO.who.includes(me)?'#ff8a8a':'#ffd23f'; c.font='900 17px '+TC; c.textAlign='center';
      c.fillText(LO.who.map(p=>names[p]).join('、')+' 被拿光，少一條命'+(LO.out.length?'（出局）':''),W/2,266); }
    if(Ls){ c.fillStyle='rgba(11,10,28,.6)'; rr(c,W/2-170,168,340,64,16); c.fill(); c.fillStyle='#fff'; c.font='900 18px '+TC; c.textAlign='center';
      c.fillText(names[Ls.by]+(Ls.blind?' 盲猜':' 喊')+'：拿掉「'+CATN[Ls.cat]+'」',W/2,190);
      c.font='700 13px '+TC; c.fillStyle=Ls.blind?(Ls.safe?'#86dc4f':'#ff8a8a'):'#cfe8d8'; c.fillText(Ls.blind?(Ls.safe?'和喊的不一樣，過關！':'猜中自己的骰子……'):'大家都要拿掉這一種',W/2,214); }
    const mine=G.dice[me],myTurn=G.phase==='call'&&G.turn===me&&!G.over&&!shaking(),blind=mine.length===1&&myTurn;
    if(show&&Ls&&Ls.before) diceRow(Ls.before[me],W/2,372,46,{dim:f=>CATS[Ls.cat].includes(f)});
    else if(mine.length===1&&G.phase==='call'&&G.turn===me){ cupSpot(me,W/2,420,110,()=>diceRow([0],W/2,372,46),false); c.fillStyle='#ffd23f'; c.font='900 14px '+TC; c.textAlign='center'; c.fillText('只剩一顆：不能看，要盲猜',W/2,354); }
    else if(mine.length) cupSpot(me,W/2,420,110,()=>diceRow(mine,W/2,372,46),false);
    plate(me,W/2,458,G.lives[me]<=0&&!(LO&&LO.who.includes(me))?'出局':hearts(me)+'　'+mine.length+' 顆'+(show&&Ls&&Ls.removed[me]?'（-'+Ls.removed[me]+'）':''),myTurn);
    if(myTurn){ CATK.forEach((k,i)=>{ btn(CATN[k],120+i*96,278,86,()=>act({cat:k})); });
      c.fillStyle='#fff'; c.font='700 12px '+TC; c.textAlign='center'; c.fillText('紅＝1、4　黑＝2、3、5、6　大＝4～6　小＝1～3　單＝1、3、5　雙＝2、4、6',W/2,330); }
    else if(G.phase==='call'&&!G.over){ c.fillStyle='#fff'; c.font='700 14px '+TC; c.textAlign='center'; c.fillText(shaking()?'大家搖骰中…':'等 '+names[G.turn]+' 喊…',W/2,shaking()?258:300); }
  }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',onDown); },_dbg:{get G(){return G;},doAct,aiStep,names}};
}

/* ---------- 開始畫面示意圖、縮圖、造型預覽 ---------- */
function stageShow(ctx,w,h,si,t){
  setSty(window.__diceLook); drawTable(ctx,w,h,window.__diceLook||{},t);
  const k=w/480,s=34*k,u=(t%3)/3;
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.09)+'px '+TC; ctx.fillStyle='#ffd23f'; ctx.fillText(GAMES[si],w/2,h*.12);
  const row=(arr,y,o)=>arr.forEach((f,i)=>drawDie(ctx,w/2-(arr.length*s*1.12-s*.12)/2+i*s*1.12,y,s,f,o&&o(f,i)));
  if(si===0){ drawCup(ctx,w*.2,h*.5,60*k,u<.5?Math.sin(u*Math.PI*2)*8*k:0); drawCup(ctx,w*.8,h*.5,60*k,0); ctx.fillStyle='#ffd23f'; ctx.font='900 '+Math.round(26*k)+'px '+TC; ctx.fillText('4 個',w/2-24*k,h*.42); drawDie(ctx,w/2+10*k,h*.42-18*k,36*k,5); row([1,5,5,3,6],h*.72,f=>({hl:f===5||f===1})); }
  else if(si===1){ const d=u<.6?[1+Math.floor(t*9)%6,1+Math.floor(t*7)%6,1+Math.floor(t*5)%6,1+Math.floor(t*11)%6]:[6,6,6,6].map((v,i)=>i<2?v:[5,1][i-2]); row(d,h*.45); ctx.fillStyle='#86dc4f'; ctx.font='900 '+Math.round(28*k)+'px '+TC; if(u>=.6) ctx.fillText('6 點',w/2,h*.75); }
  else if(si===2){ row([3,3,4,6,3],h*.45,(f,i)=>({hl:i<3})); ctx.fillStyle='#86dc4f'; ctx.font='900 '+Math.round(28*k)+'px '+TC; ctx.fillText('3+3+4＝10　6+3＝妞九',w/2,h*.75); }
  else { row([1,4,3,4,6],h*.42,f=>({dim:u>.5&&[2,3,5,6].includes(f)})); ctx.fillStyle='#ffd23f'; ctx.font='900 '+Math.round(24*k)+'px '+TC; ctx.fillText(u>.5?'拿掉「黑」！':'紅？黑？大？小？單？雙？',w/2,h*.72); }
}
function thumb(ctx,w,h,t){ setSty(null); drawTable(ctx,w,h,{felt:'#5a2a2a'},t); const k=w/480,s=40*k;
  [6,6,5,1].forEach((f,i)=>{ const a=Math.sin(t*2+i)*.15; ctx.save(); ctx.translate(w/2+(i-1.5)*52*k,h*.58); ctx.rotate(a); drawDie(ctx,-s/2,-s/2,s,f); ctx.restore(); });
  drawCup(ctx,w*.18,h*.66,64*k,Math.abs(Math.sin(t*2))*10*k); drawCup(ctx,w*.82,h*.66,64*k,0);
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.13)+'px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#0b0a1c'; ctx.strokeText('骰子派對',w/2,h*.17); ctx.fillStyle='#ffd23f'; ctx.fillText('骰子派對',w/2,h*.17);
  ctx.font='700 '+Math.round(h*.06)+'px '+TC; ctx.fillStyle='#ffe8c8'; ctx.fillText('吹牛・十八仔・妞妞・紅黑大小單雙',w/2,h*.9); }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).dice={
  name:'骰子派對',tag:'DICE PARTY',color:'#ff7a5c',online:true,maxPlayers:6,bots:true,minPlayers:2,
  desc:'一組骰盅玩四種：吹牛、十八仔、妞妞、紅黑大小單雙。和電腦同桌，或開房間 2～6 人連線。',
  goal:'選一種骰子遊戲開始玩。',
  stages:GAMES,stageLabel:'選擇遊戲',
  stageGoal:si=>[
    '吹牛：每人一個骰盅、5 顆骰子，只看得到自己的。輪流喊「全場有幾個某點數」，下一個人要喊得更大（個數多，或同個數點數大），不相信就「開」。1 可以當任何點數（萬用），但有人喊 1 時就不算萬用。開盅後數量夠，開的人輸；不夠，喊的人輸。輸一次少一條命，撐到最後的人贏。',
    '十八仔：每局每人下注後輪流擲 4 顆骰子。要有一對，另外兩顆相加就是點數；兩對時取大的那對相加。12 點叫「十八」，3 點叫「BG」最小；四顆一樣是「一色」最大。三同一異或四顆都不同會自動重擲。點數最大的人贏彩池，打 8 局比籌碼。',
    '妞妞：每局每人下注後擲 5 顆骰子。找出三顆加起來是 10（妞），另外兩顆相加取個位數比大小：0 叫「妞妞」最大，再來妞九、妞八…妞一；湊不出 10 是「無妞」最小；五顆一樣是「豹子」最大。遊戲會自動幫你湊最好的組合。每局輪一個人當莊家，閒家下注後各自和莊家比，一樣大算莊家贏；妞妞、豹子賠 3 倍，妞七～妞九賠 2 倍，其他賠 1 倍。打 8 局比籌碼。',
    '紅黑大小單雙：每人一個骰盅、5 顆骰子。輪到你時，亮出自己的骰子，從紅黑、大小、單雙裡選一種拿掉（紅＝1、4，黑＝2、3、5、6；大＝4～6，小＝1～3；單＝1、3、5，雙＝2、4、6），所有人都要拿掉這種骰子。只剩一顆時不能看，要盲猜：亮出來和喊的不一樣就過關。骰子被拿光就少一條命，大家再重拿 5 顆開新的一輪；命用完出局，撐到最後的人贏（命數可以在開始前選）。'][si],
  options:[{key:'speed',label:'電腦速度',def:'normal',opts:[{id:'slow',label:'慢'},{id:'normal',label:'正常'},{id:'fast',label:'快'}]},
    {key:'seats',label:'單機人數',def:'4',opts:[2,3,4,5,6].map(n=>({id:String(n),label:n+' 人'}))},
    {key:'lives',label:'每人幾條命',def:'3',only:[0,3],opts:[{id:'1',label:'1 條'},{id:'3',label:'3 條'},{id:'5',label:'5 條'}]},
    {key:'chips',label:'起始籌碼',def:'1000',only:[1,2],opts:[{id:'500',label:'500'},{id:'1000',label:'1000'},{id:'2000',label:'2000'}]},
    {key:'bet',label:'每局下注',def:'50',only:[1,2],opts:[{id:'10',label:'10'},{id:'50',label:'50'},{id:'100',label:'100'}]}],
  help:[['按鈕','喊、開、擲骰、選要拿掉的骰子'],['吹牛','先用 − ＋ 選個數、點骰子選點數，再按「喊」；不信就按「開！」']],
  touchHelp:[['按鈕','喊、開、擲骰、選要拿掉的骰子'],['吹牛','先用 − ＋ 選個數、點骰子選點數，再按「喊」；不信就按「開！」']],
  touch:null,
  looks:[{key:'die',label:'骰子顏色',type:'color',opts:['#fdfcf8','#fff1c4','#ff8a8a','#2b2b36','#8ac8ff','#a8e6a1']},
    {key:'cup',label:'骰盅顏色',type:'color',opts:['#8a3a2a','#2b2b36','#2f6fd0','#c8a040','#7a4ac8','#1f6b4a']},
    {key:'felt',label:'桌布顏色',type:'color',opts:['#5a2a2a','#1f6b4a','#1f4f7a','#3a2d57','#5a4630','#2b2b33']},
    {key:'bg',label:'背景',opts:[{id:'felt',label:'經典'},{id:'wood',label:'木框賭桌'},{id:'night',label:'星空'},{id:'market',label:'夜市'}]}],
  best:{label:'最多籌碼',fmt:v=>v+' 籌碼',lower:false},
  stageShow,thumb,create,
  preview:(ctx,w,h,L,t)=>{ window.__diceLook=L; drawTable(ctx,w,h,L,t); setSty(L); const k=w/480,s=44*k;
    [1,4,6,3,5].forEach((f,i)=>drawDie(ctx,w*.36+(i-2)*s*1.15-s/2,h*.55,s,f)); drawCup(ctx,w*.78,h*.78,80*k,Math.abs(Math.sin(t*2))*8*k); setSty(null); }
};
})();
