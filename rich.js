// 環島地產王：擲骰子繞棋盤，買地、蓋房子、收過路費。三張地圖（寶島環遊、環遊世界、甜點樂園），
// 和電腦玩、同一台輪流玩，或開房間 2～4 人連線（房主負責運算、其他人送動作，人不夠電腦補）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PIX='"Press Start 2P","Noto Sans TC",monospace';
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function shade(hex,k){ const n=parseInt(hex.slice(1),16); let r=n>>16&255,g=n>>8&255,b=n&255; if(k>1){ r+=(255-r)*(k-1); g+=(255-g)*(k-1); b+=(255-b)*(k-1); } else { r*=k; g*=k; b*=k; } return 'rgb('+[r,g,b].map(v=>Math.round(clamp(v,0,255))).join(',')+')'; }
const money=n=>(n<0?'-':'')+'$'+Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g,',');

/* ---------- 地圖 ---------- */
const GCOL=['#9a6a4a','#5ec8ff','#ff7eb6','#ff9a3d','#e23b3b','#ffd23f','#3fae5a','#3a5ad8'];
const MAPS=[
  {name:'寶島環遊',corner:['起點','醫院','夜市公園','救護車'],st:['捷運站','火車站','高鐵站','機場'],
   props:['基隆','宜蘭','花蓮','台東','屏東','澎湖','高雄','台南','嘉義','雲林','彰化','南投','台中','苗栗','新竹','台北'],
   bg:['#7ed0ff','#c8f0ff'],board:'#fff8e8',frame:'#c8864a',center:'taiwan'},
  {name:'環遊世界',corner:['起點','醫院','中央公園','救護車'],st:['港口','火車','郵輪','機場'],
   props:['曼谷','河內','首爾','釜山','開羅','杜拜','雪梨','奧克蘭','羅馬','巴塞隆納','巴黎','倫敦','舊金山','紐約','新加坡','東京'],
   bg:['#3a6ad8','#8ac8ff'],board:'#f4f8ff',frame:'#3a4a8a',center:'world'},
  {name:'甜點樂園',corner:['起點','保健室','彩虹公園','救護車'],st:['小火車','熱氣球','旋轉木馬','雲霄飛車'],
   props:['糖果屋','棉花糖','布丁','果凍','餅乾','馬卡龍','冰淇淋','聖代','甜甜圈','泡芙','巧克力','可可','蛋糕','千層','水晶糖宮','彩虹城'],
   bg:['#ffb3d9','#fff0f8'],board:'#fffaf2',frame:'#e87aa8',center:'candy'}];
const PAT=['p','p','x','s','p','y','p']; // 每邊 7 格：地、地、機會／命運、車站、地、命運／機會、地
function makeTiles(mi){ const M=MAPS[mi],T=[]; let pi=0,si=0;
  for(let i=0;i<32;i++){ const side=Math.floor(i/8),k=i%8;
    if(k===0){ T.push({i,type:['start','hosp','park','amb'][side],name:M.corner[side]}); continue; }
    const p=PAT[k-1];
    if(p==='p'){ const g=Math.floor(pi/2),price=600+g*260; T.push({i,type:'prop',name:M.props[pi],g,price,base:Math.round(price*.1/10)*10,cost:Math.round(price*.5/10)*10}); pi++; }
    else if(p==='s'){ T.push({i,type:'st',name:M.st[si++],price:1500}); }
    else T.push({i,type:(p==='x')===(side%2===0)?'chance':'fate',name:(p==='x')===(side%2===0)?'機會':'命運'}); }
  return T; }
// 格子在棋盤上的位置：0 在右下角，往左、往上、往右、往下繞一圈
const STEPT=.28; // 棋子走一格的時間
const BS=488,BX=6,BY=6,CN=62,EG=(BS-CN*2)/7;
function rect(i){ const side=Math.floor(i/8),k=i%8;
  if(k===0) return [[BS-CN,BS-CN],[0,BS-CN],[0,0],[BS-CN,0]][side].concat([CN,CN,side]);
  if(side===0) return [BS-CN-k*EG,BS-CN,EG,CN,0]; if(side===1) return [0,BS-CN-k*EG,CN,EG,1]; if(side===2) return [CN+(k-1)*EG,0,EG,CN,2]; return [BS-CN,CN+(k-1)*EG,CN,EG,3]; }
const center=i=>{ const [x,y,w,h]=rect(i); return [BX+x+w/2,BY+y+h/2]; };

/* ---------- 卡片 ---------- */
const CHANCE=[['拿到購地卡！停到別人的地時，可以付原價強制買下',{card:'buy'}],['拿到換地卡！停在自己的地上時，可以跟別人的地互換',{card:'swap'}],['中了發票獎！',{gain:2000}],['走到起點，領 $2,000',{goto:0}],['往前走 3 格',{fwd:3}],['免費加蓋：自己的一塊地升一級',{up:1}],['過生日：每個人給你 $500',{each:500}],['股票大漲，賺 $1,500',{gain:1500}],['搭車到最近的車站',{station:1}],['拿到免過路費卡一張',{free:1}]];
const FATE=[['撿到一張購地卡！',{card:'buy'}],['繳房屋稅：每塊地 $200',{tax:200}],['超速罰款 $1,000（放進公園）',{fine:1000}],['吃壞肚子，送去醫院休息一回合',{hosp:1}],['請大家吃飯，每人 $500',{pay:500}],['往回走 3 格',{fwd:-3}],['颱風來了：一塊地的房子少一層',{down:1}],['路邊撿到 $800',{gain:800}],['修房子：每一層 $300',{repair:300}]];

/* ---------- 人物 ---------- */
const PCOL=['#3d8bff','#ff5d8f','#3fae5a','#ffb000'];
const CHARS=[{hair:'boy',acc:'cap'},{hair:'girl',acc:'bow'},{hair:'bun',acc:'none'},{hair:'boy',acc:'phones'}];
function chibi(c,x,y,s,p,o){ const RH=window.__RHY; if(!RH){ c.fillStyle=p.col; c.beginPath(); c.arc(x,y-12*s,10*s,0,7); c.fill(); return; }
  const L=p.look||{},ch=CHARS[p.seat%4];
  RH.drawChibi(c,x,y,s,Object.assign({t:o.t||0,face:o.face||1,body:L.color||p.col,pants:'#2b2b44',shoe:'#fff',hairStyle:L.hair||ch.hair,acc:L.acc||ch.acc,capCol:p.col},o.pose||{})); }

/* ---------- 遊戲 ---------- */
function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,OP=opts.options||{},mi=clamp(opts.stage|0,0,2),M=MAPS[mi],TI=makeTiles(mi);
  const hot=!net&&opts.mode==='local',seats=net?clamp(net.count+(net.bots||0),2,4):clamp(+OP.seats||4,2,4);
  const humans=net?net.count:hot?seats:1,me=net?net.me:0,ROUNDS=+OP.rounds||15,START=+OP.cash||15000,PACE=({slow:2,normal:1.5,fast:1})[OP.pace||'normal']||1.5; // 動作之間停多久
  const isAI=p=>p>=humans||left.has(p),left=new Set(),sfx=n=>env.sfx(n);
  const {ctx:c,canvas}=env.canvas2d(W,H);
  const names=[]; for(let p=0;p<seats;p++) names.push(p<humans?(net?(net.names&&net.names[p])||'玩家 '+(p+1):hot?'玩家 '+(p+1):(opts.name||'你')):'電腦 '+(p-humans+1));
  const looks=[]; for(let p=0;p<seats;p++) looks.push(net?(net.looks&&net.looks[p])||{}:p===0?opts.look||{}:{});
  let G={tiles:TI.map(()=>({own:-1,lv:0})),pl:[],turn:0,phase:'intro',dice:[3,4],ds:0,mv:null,ms:0,card:null,cs:0,prompt:null,log:'',hist:[],round:1,pot:0,over:null,fx:[],fs:0,wait:2.6,after:'start'};
  for(let p=0;p<seats;p++) G.pl.push({cash:START,pos:0,out:false,hosp:0,free:0,cards:{buy:0,swap:0}});
  G.turn=net?((Number(net.seed)>>>3)%seats):Math.floor(Math.random()*seats);
  let t=0,aiT=0,ended=false,btns=[],hover=null,anim=null,seenMv=0,diceT=9,seenDs=0,flying=[],seenFx=0,banner=null,bannerQ=[],pickSel=0;
  const P=p=>Object.assign({seat:p,col:PCOL[p%4],look:looks[p]},G.pl[p]);
  const log=s=>{ G.log=s; G.hist.push(s); if(G.hist.length>5) G.hist.shift(); },toast=(txt,col)=>{ G.fs++; G.fx.push({k:'txt',txt,col:col||'#ffd23f',s:G.fs}); if(G.fx.length>12) G.fx.shift(); };
  const flow=(a,b,amt)=>{ G.fs++; G.fx.push({k:'pay',a,b,amt,s:G.fs}); if(G.fx.length>12) G.fx.shift(); };
  const alive=()=>G.pl.map((q,i)=>i).filter(i=>!G.pl[i].out);
  const owned=p=>G.tiles.map((x,i)=>i).filter(i=>G.tiles[i].own===p);
  const groupAll=(g,p)=>TI.filter(x=>x.g===g).every(x=>G.tiles[x.i].own===p);
  function rent(i){ const T=TI[i],S=G.tiles[i]; if(T.type==='st') return 300*owned(S.own).filter(j=>TI[j].type==='st').length; return T.base*[1,3,6,10][S.lv]*(S.lv===0&&groupAll(T.g,S.own)?2:1); }
  const assets=p=>G.pl[p].cash+owned(p).reduce((a,i)=>a+TI[i].price+(TI[i].cost||0)*G.tiles[i].lv,0);

  /* ----- 規則（房主執行） ----- */
  function pay(a,b,amt){ if(amt<=0) return; G.pl[a].cash-=amt; if(b>=0) G.pl[b].cash+=amt; else if(b===-2) G.pot+=amt; flow(a,b,amt); sfx('bump'); if(G.pl[a].cash<0) liquidate(a); }
  function gain(p,amt){ G.pl[p].cash+=amt; flow(-1,p,amt); sfx('item'); }
  function liquidate(p){ const pl=G.pl[p]; const mine=owned(p).sort((x,y)=>(TI[y].price||0)-(TI[x].price||0));
    for(const i of mine){ while(pl.cash<0&&G.tiles[i].lv>0){ G.tiles[i].lv--; pl.cash+=Math.round(TI[i].cost/2); } }
    for(const i of mine){ if(pl.cash>=0) break; G.tiles[i].own=-1; pl.cash+=Math.round(TI[i].price/2); }
    if(pl.cash<0){ pl.out=true; pl.cash=0; for(const i of owned(p)){ G.tiles[i].own=-1; G.tiles[i].lv=0; } toast(names[p]+' 破產了！','#ff6b7d'); log(names[p]+' 破產出局'); sfx('lose'); }
    else toast(names[p]+' 賣掉地產還債','#ff9a5d'); }
  function startTurn(){ const pl=G.pl[G.turn]; G.prompt=null; G.card=null;
    if(pl.hosp>0){ pl.hosp--; log(names[G.turn]+' 在'+M.corner[1]+'休息，這回合不能走'); toast(names[G.turn]+' 在'+M.corner[1]+'休息，這回合不能走','#9ad6ff');
      if(isAI(G.turn)){ G.phase='wait'; G.wait=2*PACE; G.after='end'; } else { G.phase='rest'; G.prompt={k:'rest',i:pl.pos}; } return; }
    G.phase='roll'; log('輪到 '+names[G.turn]+'，擲骰子！'); }
  function roll(p){ if(G.phase!=='roll'||G.turn!==p) return '還沒輪到你'; const a=1+Math.floor(Math.random()*6),b=1+Math.floor(Math.random()*6); G.dice=[a,b]; G.ds++; sfx('rattle'); move(p,a+b,.9); log(names[p]+' 擲出 '+(a+b)+' 點'); return null; }
  function move(p,steps,delay){ const pl=G.pl[p],path=[]; let pos=pl.pos,passed=false;
    for(let k=0;k<Math.abs(steps);k++){ pos=(pos+(steps>0?1:31))%32; path.push(pos); if(pos===0&&steps>0) passed=true; }
    G.ms++; G.mv={p,from:pl.pos,path,s:G.ms,delay}; pl.pos=pos; if(passed){ G.pl[p].cash+=2000; G.passBonus=p; }
    G.phase='wait'; G.wait=delay+path.length*STEPT+.3*PACE; G.after='land'; }
  function warp(p,to){ G.ms++; G.mv={p,from:G.pl[p].pos,path:[to],s:G.ms,delay:0,warp:1}; G.pl[p].pos=to; G.phase='wait'; G.wait=1.1; G.after='land'; }
  function land(){ const p=G.turn,pl=G.pl[p],T=TI[pl.pos],S=G.tiles[pl.pos];
    if(G.passBonus===p){ G.passBonus=null; flow(-1,p,2000); toast(names[p]+' 經過起點 +$2,000'); sfx('item'); }
    if(T.type==='prop'||T.type==='st'){
      if(S.own<0){ if(pl.cash>=T.price){ G.phase='buy'; G.prompt={k:'buy',i:pl.pos}; log(names[p]+' 要買下「'+T.name+'」嗎？'); } else { log('錢不夠買「'+T.name+'」'); endSoon(1); } return; }
      if(S.own===p){ if(pl.cards.swap>0&&swapTargets(p).length){ G.phase='swap'; G.prompt={k:'swap',i:pl.pos}; log(names[p]+' 要用換地卡嗎？'); return; } return ownLand(p); }
      if(!G.pl[S.own].out){ if(pl.cards.buy>0&&pl.cash>=T.price){ G.phase='force'; G.prompt={k:'force',i:pl.pos}; log(names[p]+' 要用購地卡買下「'+T.name+'」嗎？'); return; } payRent(p,pl.pos); }
      endSoon(1.3); return; }
    if(T.type==='chance'||T.type==='fate'){ const deck=T.type==='chance'?CHANCE:FATE,cd=deck[Math.floor(Math.random()*deck.length)]; G.cs++; G.card={k:T.type,txt:cd[0],s:G.cs}; sfx('item'); G.phase='wait'; G.wait=2.2*PACE; G.after='card'; G.cardFx=cd[1]; log(T.name+'：'+cd[0]); return; }
    if(T.type==='park'){ if(G.pot>0){ const v=G.pot; G.pot=0; gain(p,v); toast(names[p]+' 撿到公園裡的 '+money(v)+'！'); log(names[p]+' 拿走公園的錢 '+money(v)); } else log('在'+T.name+'散步'); endSoon(1.2); return; }
    if(T.type==='amb'){ toast(names[p]+' 被救護車載去'+M.corner[1]+'，下一回合要休息','#ff6b7d'); log(names[p]+' 被送去'+M.corner[1]+'，下一回合休息'); pl.hosp=1; sfx('hurt'); warp(p,8); G.after='endAfterWarp'; return; }
    endSoon(.8); }
  function endSoon(d){ G.phase='wait'; G.wait=d*PACE; G.after='end'; }
  function payRent(p,i){ const pl=G.pl[p],S=G.tiles[i],r=rent(i); if(pl.free>0){ pl.free--; toast('用了免過路費卡！'); log(names[p]+' 用免過路費卡'); } else { pay(p,S.own,r); toast(names[p]+' 付過路費 '+money(r)+' 給 '+names[S.own],'#ff9a5d'); log(names[p]+' 付過路費 '+money(r)+' 給 '+names[S.own]); } }
  function ownLand(p){ const pl=G.pl[p],T=TI[pl.pos],S=G.tiles[pl.pos]; if(T.type==='prop'&&S.lv<3&&pl.cash>=T.cost){ G.phase='build'; G.prompt={k:'build',i:pl.pos}; log(names[p]+' 要在「'+T.name+'」加蓋嗎？'); } else endSoon(.8); }
  const swapTargets=p=>G.tiles.map((x,i)=>i).filter(i=>{ const o=G.tiles[i].own; return o>=0&&o!==p&&!G.pl[o].out; });
  const worth=i=>TI[i].price+(TI[i].cost||0)*G.tiles[i].lv;
  function applyCard(){ const p=G.turn,pl=G.pl[p],e=G.cardFx||{}; G.card=null;
    if(e.card){ pl.cards[e.card]++; toast(names[p]+' 拿到'+(e.card==='buy'?'購地卡':'換地卡')+'！','#ffd23f'); sfx('item'); return endSoon(1); }
    if(e.gain){ gain(p,e.gain); return endSoon(1); }
    if(e.goto!=null){ return move(p,(32-pl.pos)%32||32,0); }
    if(e.fwd){ return move(p,e.fwd,0); }
    if(e.up){ const mine=owned(p).filter(i=>TI[i].type==='prop'&&G.tiles[i].lv<3); if(mine.length){ const i=mine[0]; G.tiles[i].lv++; toast('「'+TI[i].name+'」免費加蓋！'); sfx('item'); } else toast('沒有可以加蓋的地'); return endSoon(1); }
    if(e.each){ for(const q of alive()) if(q!==p) pay(q,p,Math.min(e.each,Math.max(0,G.pl[q].cash))); return endSoon(1.2); }
    if(e.station){ let k=1; while(TI[(pl.pos+k)%32].type!=='st') k++; return move(p,k,0); }
    if(e.free){ pl.free++; return endSoon(1); }
    if(e.tax){ pay(p,-2,e.tax*owned(p).length); return endSoon(1); }
    if(e.fine){ pay(p,-2,e.fine); return endSoon(1); }
    if(e.hosp){ pl.hosp=1; toast(names[p]+' 下一回合要在'+M.corner[1]+'休息','#ff6b7d'); warp(p,8); G.after='endAfterWarp'; return; }
    if(e.pay){ for(const q of alive()) if(q!==p) pay(p,q,e.pay); return endSoon(1.2); }
    if(e.down){ const mine=owned(p).filter(i=>G.tiles[i].lv>0); if(mine.length){ const i=mine[Math.floor(Math.random()*mine.length)]; G.tiles[i].lv--; toast('「'+TI[i].name+'」的房子被吹掉一層','#9ad6ff'); } else toast('還好沒有房子'); return endSoon(1); }
    if(e.repair){ pay(p,-2,e.repair*owned(p).reduce((a,i)=>a+G.tiles[i].lv,0)); return endSoon(1); }
    endSoon(.8); }
  function nextTurn(){ const al=alive(); if(al.length<=1){ G.over={why:'只剩一個人沒破產'}; return; }
    let n=G.turn; do{ n=(n+1)%seats; }while(G.pl[n].out); if(n<=G.turn){ G.round++; if(ROUNDS&&G.round>ROUNDS){ G.over={why:'打完 '+ROUNDS+' 回合，比總資產'}; return; } }
    G.turn=n; startTurn(); }
  function decide(p,yes){ if(G.turn!==p||!G.prompt) return '還沒輪到你'; const i=G.prompt.i,T=TI[i],S=G.tiles[i],pl=G.pl[p],k=G.prompt.k;
    if(k==='rest'){ G.prompt=null; endSoon(.4); return null; }
    if(k==='force'){ G.prompt=null; const ow=S.own; if(yes){ if(pl.cash<T.price) return '錢不夠'; pl.cards.buy--; pay(p,ow,T.price); S.own=p; toast(names[p]+' 用購地卡買下 '+names[ow]+' 的「'+T.name+'」！','#ff7eb6'); log(names[p]+' 用購地卡付原價 '+money(T.price)+' 買下「'+T.name+'」'); sfx('win'); } else payRent(p,i); endSoon(1.4); return null; }
    if(k==='swap'){ if(yes){ G.phase='pick'; G.prompt={k:'pick',i,targets:swapTargets(p)}; log('選一塊別人的地來交換'); return null; } G.prompt=null; ownLand(p); return null; }
    if(k==='pick'){ G.prompt=null; ownLand(p); return null; }
    if(G.prompt.k==='buy'&&yes){ if(pl.cash<T.price) return '錢不夠'; pl.cash-=T.price; S.own=p; flow(p,-1,T.price); toast(names[p]+' 買下「'+T.name+'」','#86dc4f'); sfx('place'); log(names[p]+' 買下「'+T.name+'」'); }
    else if(G.prompt.k==='build'&&yes){ if(pl.cash<T.cost) return '錢不夠'; pl.cash-=T.cost; S.lv++; flow(p,-1,T.cost); toast('「'+T.name+'」蓋到 '+['','一','兩','三'][S.lv]+' 層'+(S.lv===3?'大樓！':'！'),'#86dc4f'); sfx('win'); }
    G.prompt=null; endSoon(1.1); return null; }
  function pick(p,j){ if(G.turn!==p||!G.prompt||G.prompt.k!=='pick') return '還沒輪到你'; if(!G.prompt.targets.includes(j)) return '要選別人的地';
    const i=G.prompt.i,ow=G.tiles[j].own; G.tiles[j].own=p; G.tiles[i].own=ow; G.pl[p].cards.swap--; G.prompt=null;
    toast(names[p]+' 用「'+TI[i].name+'」換走 '+names[ow]+' 的「'+TI[j].name+'」！','#ff7eb6'); log(names[p]+' 用換地卡把「'+TI[i].name+'」換成「'+TI[j].name+'」'); sfx('win'); endSoon(1.6); return null; }
  function doAct(p,a){ if(G.over) return '遊戲結束了'; if(a.t==='roll') return roll(p); if(a.t==='pick') return pick(p,a.j|0); if(a.t==='yes') return decide(p,true); if(a.t==='no') return decide(p,false); return null; }
  function act(a){ if(client){ net.send({act:a}); return; } const p=hot?G.turn:me; const err=doAct(p,a); if(err) showMsg(err); broadcast(); }
  function broadcast(){ if(net&&net.host) net.send({st:G}); }
  if(net){ if(client) net.onmsg=m=>{ if(m.st) G=m.st; if(m.bad&&m.bad[0]===me) showMsg(m.bad[1]); };
    else { net.onmsg=(m,from)=>{ if(!m.act) return; const err=doAct(from,m.act); if(err) net.send({bad:[from,err]}); broadcast(); };
      net.onleave=i=>{ names[i]+='（離開）'; left.add(i); broadcast(); }; } }
  // 電腦：錢夠就買（留一點預備金），能湊成同色就一定買；錢多才蓋房子
  function ai(p){ const pl=G.pl[p];
    if(G.phase==='roll') return roll(p);
    if(G.prompt&&G.prompt.k==='rest') return decide(p,true);
    if(G.prompt&&G.prompt.k==='force'){ const i=G.prompt.i,T=TI[i],S=G.tiles[i]; return decide(p,pl.cash-T.price>=1500&&(S.lv>=1||T.price>=1400||T.g!=null&&TI.some(x=>x.g===T.g&&x.i!==i&&G.tiles[x.i].own===p))); }
    if(G.prompt&&(G.prompt.k==='swap'||G.prompt.k==='pick')){ const i=G.prompt.i,best=swapTargets(p).sort((a,b)=>worth(b)-worth(a))[0],good=best!=null&&worth(best)-worth(i)>=800;
      if(G.prompt.k==='swap') return decide(p,good); return good?pick(p,best):decide(p,false); }
    if(G.prompt){ const T=TI[G.prompt.i],reserve=1500+G.round*150; let yes;
      if(G.prompt.k==='buy') yes=pl.cash-T.price>=reserve||(T.g!=null&&TI.some(x=>x.g===T.g&&x.i!==T.i&&G.tiles[x.i].own===p)&&pl.cash-T.price>=500);
      else yes=pl.cash-T.cost>=reserve+1000; return decide(p,yes); } }
  let msg='',msgT=0; const showMsg=s=>{ msg=s; msgT=2; sfx('bump'); };

  /* ----- 更新 ----- */
  function update(dt){ t+=dt; if(msgT>0) msgT-=dt; diceT+=dt;
    if(G.mv&&G.mv.s!==seenMv){ seenMv=G.mv.s; anim={mv:G.mv,t:-(G.mv.delay||0)}; }
    if(anim){ anim.t+=dt; if(anim.t>anim.mv.path.length*STEPT+.15) anim=null; else if(anim.t>0&&Math.floor(anim.t/STEPT)!==Math.floor((anim.t-dt)/STEPT)) sfx('land'); }
    if(G.ds!==seenDs){ seenDs=G.ds; diceT=0; }
    for(const f of G.fx) if(f.s>seenFx){ seenFx=f.s; if(f.k==='pay') for(let k=0;k<Math.min(8,2+Math.floor(f.amt/400));k++) flying.push({a:f.a,b:f.b,t:-k*.06}); else bannerQ.push({txt:f.txt,col:f.col,t:0}); }
    for(const f of flying) f.t+=dt; flying=flying.filter(f=>f.t<.9); if(banner){ banner.t+=dt; if(banner.t>(bannerQ.length?1.8:2.8)) banner=null; } if(!banner&&bannerQ.length) banner=bannerQ.shift(); // 大字提示一個一個出來，不會一閃就換掉
    // 鍵盤
    const mine=hot?!isAI(G.turn):G.turn===me&&!isAI(me);
    if(mine&&!G.over){ const pk=G.prompt&&G.prompt.k==='pick'?G.prompt.targets:null; if(pk){ if(env.hit('ArrowRight')||env.hit('ArrowDown')) pickSel=(pickSel+1)%pk.length; if(env.hit('ArrowLeft')||env.hit('ArrowUp')) pickSel=(pickSel+pk.length-1)%pk.length; pickSel=Math.min(pickSel,pk.length-1); }
      if(env.hit('Space')||env.hit('Enter')){ if(G.phase==='roll') act({t:'roll'}); else if(pk) act({t:'pick',j:pk[pickSel]}); else if(G.prompt) act({t:'yes'}); } if(env.hit('KeyN')&&G.prompt) act({t:'no'}); }
    if(client){ if(G.over&&!ended){ ended=true; setTimeout(finish,2200); } return; }
    if(ended) return; if(G.over){ ended=true; setTimeout(finish,2200); broadcast(); return; }
    if(G.phase==='intro'||G.phase==='wait'){ G.wait-=dt; if(G.wait<=0){ const a=G.after; G.after=null;
        if(a==='start') startTurn(); else if(a==='land') land(); else if(a==='card') applyCard(); else if(a==='end') nextTurn(); else if(a==='endAfterWarp') endSoon(.6); broadcast(); } return; }
    if(isAI(G.turn)){ aiT+=dt; if(aiT>(G.prompt?.9:.7)*PACE){ aiT=0; ai(G.turn); broadcast(); } } else aiT=0; }
  let done=false;
  function finish(){ if(done) return; done=true; const order=G.pl.map((q,i)=>i).sort((a,b)=>(G.pl[a].out-G.pl[b].out)||assets(b)-assets(a)),w=order[0];
    const html='<table class="ls"><tr><th>名次</th><th>玩家</th><th>總資產</th><th>現金</th><th>地產</th></tr>'+order.map((p,k)=>'<tr><td>'+(k+1)+'</td><td>'+names[p]+'</td><td>'+(G.pl[p].out?'破產':money(assets(p)))+'</td><td>'+money(G.pl[p].cash)+'</td><td>'+owned(p).length+' 塊</td></tr>').join('')+'</table>';
    const meWin=!hot&&w===me; env.sfx(meWin||hot?'win':'lose');
    env.end({title:hot?names[w]+' 是地產王！':meWin?'你是地產王！':names[w]+' 是地產王',big:money(assets(w)),html,text:G.over.why+'。總資產＝現金＋土地＋房子。',score:!net&&!hot&&meWin?Math.round(assets(me)):null}); }
  if(!client){ broadcast(); }

  /* ----- 操作 ----- */
  const toLogical=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=(r.width-W*s)/2,oy=(r.height-H*s)/2; return [(e.clientX-r.left-ox)/s,(e.clientY-r.top-oy)/s]; };
  const onDown=e=>{ e.preventDefault&&e.preventDefault(); const [x,y]=toLogical(e); for(const b of btns) if(!b.dis&&x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h){ sfx('click'); b.fn(); return; }
    if(G.prompt&&G.prompt.k==='pick') for(const j of G.prompt.targets){ const [rx,ry,rw,rh]=rect(j); if(x>=BX+rx&&x<BX+rx+rw&&y>=BY+ry&&y<BY+ry+rh){ sfx('click'); act({t:'pick',j}); return; } } };
  const onMove=e=>{ hover=toLogical(e); };
  if(canvas.addEventListener){ canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointermove',onMove); canvas.style.touchAction='none'; }

  /* ----- 畫面 ----- */
  const boardImg=typeof document!=='undefined'?paintBoard(mi):null;
  function tokenPos(p){ const pl=G.pl[p]; let x,y,hop=0;
    if(anim&&anim.mv.p===p&&anim.t>0&&!anim.mv.warp){ const path=[anim.mv.from].concat(anim.mv.path),k=Math.min(path.length-2,Math.floor(anim.t/STEPT)),u=clamp(anim.t/STEPT-k,0,1),[x0,y0]=center(path[k]),[x1,y1]=center(path[k+1]);
      x=x0+(x1-x0)*u; y=y0+(y1-y0)*u; hop=Math.sin(u*Math.PI)*16; }
    else { const pos=anim&&anim.mv.p===p&&anim.t<=0?anim.mv.from:pl.pos; [x,y]=center(pos); }
    const here=G.pl.map((q,i)=>i).filter(i=>!G.pl[i].out&&G.pl[i].pos===pl.pos&&!(anim&&anim.mv.p===i)),k=here.indexOf(p),n=here.length;
    if(!(anim&&anim.mv.p===p)&&n>1){ x+=((k%2)-.5)*18; y+=(Math.floor(k/2)-(n>2?.5:0))*14; }
    return [x,Math.max(BY+52,y+14),hop]; } /* 最上面一排的人往下站，頭不會超出棋盤 */
  function drawBuilding(x,y,lv,col,s){ // 小房子：一層一棟、三層變大樓
    if(lv>=3){ c.fillStyle=shade(col,.75); c.fillRect(x-7*s,y-22*s,14*s,22*s); c.fillStyle=col; c.fillRect(x-7*s,y-22*s,7*s,22*s); c.fillStyle='#fff8c0'; for(let r=0;r<4;r++) for(let q=0;q<2;q++) c.fillRect(x-5.5*s+q*6*s,y-19*s+r*5*s,3*s,3*s); c.fillStyle=shade(col,.5); c.fillRect(x-8*s,y-24*s,16*s,3*s); c.fillStyle='#ffd23f'; c.beginPath(); c.moveTo(x,y-31*s); c.lineTo(x+2*s,y-24*s); c.lineTo(x-2*s,y-24*s); c.fill(); return; }
    for(let k=0;k<lv;k++){ const hx=x+(k-(lv-1)/2)*11*s; c.fillStyle='#fff'; c.fillRect(hx-4.5*s,y-8*s,9*s,8*s); c.strokeStyle='rgba(0,0,0,.35)'; c.lineWidth=1; c.strokeRect(hx-4.5*s,y-8*s,9*s,8*s);
      c.fillStyle=col; c.beginPath(); c.moveTo(hx-6*s,y-8*s); c.lineTo(hx,y-14*s); c.lineTo(hx+6*s,y-8*s); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#8a5a3a'; c.fillRect(hx-1.5*s,y-4*s,3*s,4*s); } }
  function die(x,y,s,v,rot){ c.save(); c.translate(x,y); c.rotate(rot); c.fillStyle='rgba(0,0,0,.25)'; rr(c,-s/2+3,-s/2+4,s,s,s*.2); c.fill();
    const g=c.createLinearGradient(-s/2,-s/2,s/2,s/2); g.addColorStop(0,'#ffffff'); g.addColorStop(1,'#e2dcd0'); c.fillStyle=g; rr(c,-s/2,-s/2,s,s,s*.2); c.fill(); c.strokeStyle='#b8b0a0'; c.lineWidth=1.5; c.stroke();
    const P2={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]}[v];
    for(const [px,py] of P2){ c.fillStyle=v===1?'#e23b3b':'#2a1a26'; c.beginPath(); c.arc(px*s*.26,py*s*.26,s*(v===1?.13:.09),0,7); c.fill(); } c.restore(); }
  function btn(label,x,y,w,h,fn,main,dis){ btns.push({x,y,w,h,fn,dis}); const hv=hover&&hover[0]>=x&&hover[0]<x+w&&hover[1]>=y&&hover[1]<y+h;
    c.fillStyle=dis?'rgba(40,36,70,.7)':main?(hv?'#ffe066':'#ffd23f'):(hv?'#3a357a':'#2b2759'); rr(c,x,y,w,h,12); c.fill(); c.strokeStyle='#0b0a1c'; c.lineWidth=2; c.stroke();
    c.fillStyle=dis?'#6b6799':main?'#14122b':'#fff'; c.font='900 '+(h>40?18:15)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(label,x+w/2,y+h/2+1); }
  function draw(){ btns=[];
    const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,M.bg[0]); g.addColorStop(1,M.bg[1]); c.fillStyle=g; c.fillRect(0,0,W,H);
    if(boardImg) c.drawImage(boardImg,0,0,W,H);
    // 地產主人和房子
    G.tiles.forEach((S,i)=>{ if(S.own<0) return; const [x,y,w,h,side]=rect(i),X=BX+x,Y=BY+y,col=PCOL[S.own%4];
      c.strokeStyle=col; c.lineWidth=3; rr(c,X+2,Y+2,w-4,h-4,6); c.stroke();
      const fx=X+(side===3?w-10:side===1?10:w-9),fy=Y+(side===0?h-12:side===2?12:h-12); c.fillStyle=col; c.beginPath(); c.moveTo(fx,fy); c.lineTo(fx,fy-12); c.lineTo(fx-9,fy-8); c.lineTo(fx,fy-5); c.fill(); c.fillStyle='#2a1a26'; c.fillRect(fx,fy-12,1.4,13);
      if(S.lv>0){ const bx=X+w/2,by=side===0?Y+h*.62:side===2?Y+h*.62:Y+h*.72; drawBuilding(bx,by,S.lv,col,side===1||side===3?.9:.85); } });
    if(G.prompt&&G.prompt.k==='pick'){ const pk=G.prompt.targets,mineP=hot?!isAI(G.turn):G.turn===me; pk.forEach((j,n)=>{ const [x,y,w,h]=rect(j),hv=hover&&hover[0]>=BX+x&&hover[0]<BX+x+w&&hover[1]>=BY+y&&hover[1]<BY+y+h,on=mineP&&(hv||n===pickSel);
      c.strokeStyle=on?'#ff2d7a':'rgba(255,210,63,'+(.6+.4*Math.sin(t*8))+')'; c.lineWidth=on?5:3; rr(c,BX+x+1,BY+y+1,w-2,h-2,7); c.stroke(); if(on){ c.fillStyle='#ff2d7a'; c.font='900 11px '+TC; c.textAlign='center'; c.fillText('換這塊',BX+x+w/2,BY+y-6); } }); }
    // 目前輪到的格子發亮
    { const [x,y,w,h]=rect(G.pl[G.turn].pos); c.strokeStyle='rgba(255,255,255,'+(.5+.4*Math.sin(t*6))+')'; c.lineWidth=3; rr(c,BX+x+1,BY+y+1,w-2,h-2,7); c.stroke(); }
    // 棋子（後面的先畫）
    const order=G.pl.map((q,i)=>i).filter(i=>!G.pl[i].out).sort((a,b)=>tokenPos(a)[1]-tokenPos(b)[1]);
    for(const p of order){ const [x,y,hop]=tokenPos(p),cur=p===G.turn;
      c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x,y,12,4,0,0,7); c.fill(); if(cur){ c.strokeStyle=PCOL[p%4]; c.lineWidth=2.5; c.beginPath(); c.ellipse(x,y,15,5.5,0,0,7); c.stroke(); }
      const moving=anim&&anim.mv.p===p&&anim.t>0,pose=moving?{legL:-.5,legR:.4,armL:2.2,armR:.8,mouth:'open'}:G.pl[p].hosp>0?{mouth:'o',armL:.2,armR:.2}:{bob:Math.abs(Math.sin(t*3+p))*1.2,armL:.3+(cur?Math.sin(t*5)*.4:0),armR:.3};
      chibi(c,x,y-hop,.92,P(p),{t,pose,face:x<BX+BS/2?1:-1});
      if(cur&&!moving){ c.fillStyle=PCOL[p%4]; c.beginPath(); c.moveTo(x-6,y-58+Math.sin(t*5)*3); c.lineTo(x+6,y-58+Math.sin(t*5)*3); c.lineTo(x,y-50+Math.sin(t*5)*3); c.fill(); }
      if(G.pl[p].hosp>0){ c.fillStyle='#fff'; rr(c,x+6,y-60,14,14,3); c.fill(); c.fillStyle='#e23b3b'; c.fillRect(x+11.5,y-58,3,10); c.fillRect(x+8,y-54.5,10,3); } }
    // 中間：骰子、訊息
    const cx=BX+BS/2,cy=BY+BS/2;
    if(diceT<.85){ for(let k=0;k<2;k++){ const u=diceT/.85,ox=(k?24:-24)+(1-u)*Math.sin(diceT*20+k)*20,oy=-(1-u)*Math.abs(Math.sin(diceT*14))*40; die(cx+ox,cy+40+oy,34,1+Math.floor((t*30+k*3)%6),diceT*14+k); } }
    else { die(cx-24,cy+40,34,G.dice[0],-.12); die(cx+24,cy+40,34,G.dice[1],.1); if(diceT<2.5){ c.font='900 16px '+TC; c.fillStyle='#14122b'; c.textAlign='center'; c.fillText(G.dice[0]+G.dice[1]+' 點',cx,cy+78); } }
    c.textAlign='center'; c.textBaseline='middle'; if(G.log){ c.font='700 13px '+TC; const tw=Math.min(300,c.measureText(G.log).width+24); c.fillStyle='rgba(20,18,43,.82)'; rr(c,cx-tw/2,cy-32,tw,26,13); c.fill(); c.fillStyle='#fff'; c.fillText(G.log,cx,cy-19,tw-16); }
    if(G.pot>0){ c.fillStyle='rgba(20,18,43,.7)'; rr(c,cx-80,cy+96,160,22,11); c.fill(); c.fillStyle='#ffd23f'; c.font='700 12px '+TC; c.fillText(M.corner[2]+'裡有 '+money(G.pot),cx,cy+107); }
    // 錢飛過去
    for(const f of flying){ if(f.t<0) continue; const from=f.a>=0?tokenPos(f.a):[cx,cy],to=f.b>=0?tokenPos(f.b):f.b===-2?center(16):[cx,cy],u=Math.min(1,f.t/.7),x=from[0]+(to[0]-from[0])*u,y=from[1]-30+(to[1]-from[1])*u-Math.sin(u*Math.PI)*50;
      c.fillStyle='#ffd23f'; c.beginPath(); c.arc(x,y,6,0,7); c.fill(); c.strokeStyle='#b8800a'; c.lineWidth=1.5; c.stroke(); c.fillStyle='#b8800a'; c.font='900 8px '+TC; c.fillText('$',x,y+.5); }
    // 機會／命運卡
    if(G.card){ const k=G.card.k==='chance'; c.save(); c.translate(cx,cy-10); const pop=Math.min(1,(t%100)>0?1:1); c.fillStyle='rgba(0,0,0,.3)'; rr(c,-128,-58,264,124,16); c.fill();
      c.fillStyle=k?'#fff3c8':'#e8e0ff'; rr(c,-132,-62,264,124,16); c.fill(); c.strokeStyle=k?'#ff9a3d':'#7a5cff'; c.lineWidth=4; c.stroke();
      c.fillStyle=k?'#ff9a3d':'#7a5cff'; c.font='900 22px '+TC; c.fillText(k?'？機會':'★命運',0,-34); c.fillStyle='#2a1a26'; c.font='900 15px '+TC; c.fillText(G.card.txt,0,8,250); c.restore(); }
    // 右邊：玩家資料
    const RX=508,RW=W-RX-8; for(let p=0;p<seats;p++){ const y=8+p*74,pl=G.pl[p],cur=p===G.turn&&!pl.out;
      c.fillStyle=cur?'rgba(255,210,63,.95)':'rgba(20,18,43,.82)'; rr(c,RX,y,RW,66,14); c.fill(); if(pl.out){ c.fillStyle='rgba(120,120,140,.6)'; rr(c,RX,y,RW,66,14); c.fill(); }
      c.save(); rr(c,RX+6,y+6,54,54,12); c.clip(); c.fillStyle=shade(PCOL[p%4],1.5); c.fillRect(RX+6,y+6,54,54); chibi(c,RX+33,y+108,2.2,P(p),{t,pose:{mouth:pl.out?'o':'w'}}); c.restore();
      c.strokeStyle=PCOL[p%4]; c.lineWidth=3; rr(c,RX+6,y+6,54,54,12); c.stroke();
      c.textAlign='left'; c.fillStyle=cur?'#14122b':'#fff'; c.font='900 15px '+TC; c.fillText(names[p]+(pl.out?'（破產）':''),RX+68,y+18,RW-74);
      c.font='900 17px '+TC; c.fillStyle=cur?'#6a3a00':'#ffd23f'; c.fillText(money(pl.cash),RX+68,y+40);
      c.font='700 11px '+TC; c.fillStyle=cur?'#3a2a10':'#cfd0ff'; c.fillText('地產 '+owned(p).length+' 塊　總資產 '+money(assets(p))+(pl.free?'　免費×'+pl.free:'')+(pl.cards.buy?'　購地×'+pl.cards.buy:'')+(pl.cards.swap?'　換地×'+pl.cards.swap:'')+(pl.hosp?'　下回合休息':''),RX+68,y+58,RW-74); }
    // 回合與按鈕
    const by=8+seats*74+4; c.textAlign='center'; c.fillStyle='rgba(20,18,43,.82)'; rr(c,RX,by,RW,26,13); c.fill(); c.fillStyle='#fff'; c.font='700 12px '+TC; c.fillText('第 '+Math.min(G.round,ROUNDS||G.round)+(ROUNDS?' / '+ROUNDS:'')+' 回合　'+M.name,RX+RW/2,by+13);
    const mine=!G.over&&(hot?!isAI(G.turn):G.turn===me&&!isAI(me)),ay=by+36;
    if(mine&&G.phase==='roll') btn('🎲 擲骰子',RX,ay,RW,52,()=>act({t:'roll'}),true);
    else if(mine&&G.prompt&&G.prompt.k!=='buy'&&G.prompt.k!=='build'){ const k=G.prompt.k,T=TI[G.prompt.i],S=G.tiles[G.prompt.i];
      c.fillStyle='rgba(255,255,255,.95)'; rr(c,RX,ay,RW,70,14); c.fill(); c.strokeStyle=k==='rest'?'#3fae5a':'#ff7eb6'; c.lineWidth=4; c.stroke(); c.fillStyle='#14122b'; c.font='900 15px '+TC;
      const L1=k==='rest'?'在'+M.corner[1]+'休息，這回合不能走':k==='force'?'用購地卡買下「'+T.name+'」？':k==='swap'?'用換地卡拿「'+T.name+'」換別人的地？':'點一塊閃黃框的地來交換',
        L2=k==='rest'?'下一回合就可以繼續走':k==='force'?'付原價 '+money(T.price)+' 給 '+names[S.own]+'（房子一起過來）':k==='swap'?'房子跟著地一起換':'也可以用 ← → 選，空白鍵確定';
      c.fillText(L1,RX+RW/2,ay+22,RW-12); c.font='700 11px '+TC; c.fillStyle='#5a5470'; c.fillText(L2,RX+RW/2,ay+46,RW-12);
      if(k==='rest') btn('知道了',RX,ay+78,RW,44,()=>act({t:'yes'}),true);
      else if(k==='pick') btn('不換了',RX,ay+78,RW,44,()=>act({t:'no'}),false);
      else { btn(k==='force'?'使用購地卡':'使用換地卡',RX,ay+78,RW/2-4,44,()=>act({t:'yes'}),true); btn(k==='force'?'付過路費':'不用',RX+RW/2+4,ay+78,RW/2-4,44,()=>act({t:'no'}),false); } }
    else if(mine&&G.prompt){ const T=TI[G.prompt.i],buy=G.prompt.k==='buy',cost=buy?T.price:T.cost;
      c.fillStyle='rgba(255,255,255,.95)'; rr(c,RX,ay,RW,70,14); c.fill(); c.strokeStyle=T.g!=null?GCOL[T.g]:'#5a5a7a'; c.lineWidth=4; c.stroke();
      c.fillStyle='#14122b'; c.font='900 15px '+TC; c.fillText((buy?'買下「':'加蓋「')+T.name+'」　'+money(cost),RX+RW/2,ay+20,RW-10);
      c.font='700 11px '+TC; c.fillStyle='#5a5470'; const S=G.tiles[G.prompt.i]; c.fillText(T.type==='st'?'過路費：每有一個車站 $300':'過路費 '+[0,1,2,3].map(l=>money(T.base*[1,3,6,10][l])).join('→')+(buy?'':'（現在 '+S.lv+' 層）'),RX+RW/2,ay+44,RW-10);
      btn(buy?'買下':'加蓋',RX,ay+78,RW/2-4,44,()=>act({t:'yes'}),true); btn('不要',RX+RW/2+4,ay+78,RW/2-4,44,()=>act({t:'no'}),false); }
    else if(!G.over){ c.fillStyle='rgba(20,18,43,.6)'; rr(c,RX,ay,RW,40,12); c.fill(); c.fillStyle='#fff'; c.font='700 13px '+TC; c.fillText(isAI(G.turn)?names[G.turn]+' 想一想…':(G.phase==='roll'?'等 '+names[G.turn]+' 擲骰子':'等 '+names[G.turn]+' 決定'),RX+RW/2,ay+20); }
    { const hy=ay+(mine&&G.prompt?132:mine&&G.phase==='roll'?62:50),hs=G.hist.slice(-Math.max(0,Math.floor((H-hy-6)/18))); c.textAlign='left'; c.font='700 11px '+TC; hs.forEach((h,n)=>{ c.fillStyle='rgba(20,18,43,'+(.35+.45*(n+1)/hs.length)+')'; rr(c,RX,hy+n*18,RW,16,8); c.fill(); c.fillStyle='rgba(255,255,255,'+(.55+.45*(n+1)/hs.length)+')'; c.fillText('・'+h,RX+8,hy+n*18+8.5,RW-14); }); }
    // 大字提示
    if(banner){ const a=Math.min(1,(2.8-banner.t)*2,banner.t*6),s=banner.t<.15?.7+banner.t*2:1; c.save(); c.globalAlpha=a; c.translate(cx,cy-64); c.scale(s,s); c.font='900 17px '+TC; const tw=c.measureText(banner.txt).width+30; c.fillStyle='rgba(20,18,43,.9)'; rr(c,-tw/2,-18,tw,36,18); c.fill(); c.fillStyle=banner.col; c.fillText(banner.txt,0,1); c.restore(); }
    if(msgT>0){ c.font='900 15px '+TC; const tw=c.measureText(msg).width+30; c.fillStyle='rgba(200,30,60,.92)'; rr(c,cx-tw/2,cy+120,tw,32,14); c.fill(); c.fillStyle='#fff'; c.fillText(msg,cx,cy+136); }
    if(G.phase==='intro'){ c.fillStyle='rgba(11,10,28,.6)'; c.fillRect(0,0,W,H); c.fillStyle='#ffd23f'; c.font='900 30px '+TC; c.fillText('環島地產王・'+M.name,W/2,H/2-24); c.fillStyle='#fff'; c.font='700 16px '+TC; c.fillText(names[G.turn]+' 先開始！'+(ROUNDS?'打 '+ROUNDS+' 回合':'打到只剩一個人'),W/2,H/2+14); } }
  return {update,draw,destroy(){ if(canvas.removeEventListener){ canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('pointermove',onMove); } },
    _dbg:{get G(){return G;},doAct,TI,names,assets,rent}};
}

/* ---------- 棋盤（畫一次存起來）：木框、格子、名字、價錢、中間的插圖 ---------- */
function paintBoard(mi){ const cv=document.createElement('canvas'),S=2; cv.width=W*S; cv.height=H*S; const c=cv.getContext('2d'); c.scale(S,S); drawBoard(c,mi,0); return cv; }
function drawBoard(c,mi,t){ const M=MAPS[mi],TI=makeTiles(mi);
  c.fillStyle='rgba(0,0,0,.25)'; rr(c,BX+4,BY+6,BS,BS,16); c.fill();
  c.fillStyle=M.frame; rr(c,BX-4,BY-4,BS+8,BS+8,16); c.fill(); c.fillStyle=shade(M.frame,1.25); rr(c,BX-4,BY-4,BS+8,6,4); c.fill();
  c.fillStyle=M.board; rr(c,BX,BY,BS,BS,12); c.fill();
  centerArt(c,mi,BX+CN+4,BY+CN+4,BS-CN*2-8,t);
  for(const T of TI){ const [x,y,w,h,side]=rect(T.i),X=BX+x,Y=BY+y;
    const g=c.createLinearGradient(X,Y,X,Y+h); g.addColorStop(0,'#ffffff'); g.addColorStop(1,shade(M.board,.93)); c.fillStyle=g; rr(c,X+1.5,Y+1.5,w-3,h-3,6); c.fill(); c.strokeStyle='rgba(90,70,50,.35)'; c.lineWidth=1.2; c.stroke();
    c.textAlign='center'; c.textBaseline='middle';
    if(T.type==='prop'){ const col=GCOL[T.g]; c.fillStyle=col; // 內側的顏色帶
      if(side===0) rr(c,X+3,Y+3,w-6,11,4); else if(side===2) rr(c,X+3,Y+h-14,w-6,11,4); else if(side===1) rr(c,X+w-14,Y+3,11,h-6,4); else rr(c,X+3,Y+3,11,h-6,4); c.fill();
      const tx=X+w/2+(side===1?-6:side===3?6:0),ty=Y+h/2+(side===0?5:side===2?-5:0); c.fillStyle='#2a1a26'; c.font='900 '+(T.name.length>3?9.5:11.5)+'px '+TC; c.fillText(T.name,tx,ty-7,w-16); c.fillStyle='#8a6a4a'; c.font='700 9.5px '+TC; c.fillText('$'+T.price,tx,ty+8); }
    else if(T.type==='st'){ c.fillStyle='#5a5a7a'; c.font='18px '+TC; c.fillText(['🚇','🚆','🚄','✈'][Math.floor(T.i/8)],X+w/2,Y+h/2-8); c.fillStyle='#2a1a26'; c.font='900 10px '+TC; c.fillText(T.name,X+w/2,Y+h/2+11,w-6); }
    else if(T.type==='chance'||T.type==='fate'){ const k=T.type==='chance'; c.fillStyle=k?'#ff9a3d':'#7a5cff'; c.font='900 22px '+TC; c.fillText(k?'？':'★',X+w/2,Y+h/2-7); c.font='900 11px '+TC; c.fillText(T.name,X+w/2,Y+h/2+13); }
    else { const col={start:'#e23b3b',hosp:'#3fae5a',park:'#ff9a3d',amb:'#3d8bff'}[T.type]; c.fillStyle=shade(col,1.75); rr(c,X+4,Y+4,w-8,h-8,8); c.fill();
      c.fillStyle=col; c.font='900 13px '+TC; c.fillText(T.name,X+w/2,Y+h-14,w-8); c.font='22px '+TC; c.fillText({start:'🏁',hosp:'🏥',park:'🌳',amb:'🚑'}[T.type],X+w/2,Y+h/2-6);
      if(T.type==='start'){ c.font='700 9px '+TC; c.fillStyle='#8a2a2a'; c.fillText('經過 +$2,000',X+w/2,Y+11); } } } }
function centerArt(c,mi,x,y,s,t){ const cx=x+s/2,cy=y+s/2; c.save(); rr(c,x,y,s,s,14); c.clip();
  if(mi===0){ const g=c.createLinearGradient(x,y,x,y+s); g.addColorStop(0,'#bfeaff'); g.addColorStop(1,'#5ec8ff'); c.fillStyle=g; c.fillRect(x,y,s,s);
    c.strokeStyle='rgba(255,255,255,.5)'; c.lineWidth=2; for(let k=0;k<6;k++){ c.beginPath(); for(let q=0;q<=s;q+=10) c.lineTo(x+q,y+s*.15+k*s*.15+Math.sin(q/18+k)*3); c.stroke(); }
    // 台灣島
    const pts=[[.62,.06],[.7,.12],[.68,.25],[.64,.4],[.6,.55],[.56,.7],[.5,.84],[.47,.94],[.43,.86],[.38,.72],[.34,.58],[.33,.42],[.38,.28],[.46,.16],[.54,.09]];
    c.fillStyle='#8ad06a'; c.beginPath(); pts.forEach(([a,b],k)=>k?c.lineTo(x+a*s,y+b*s):c.moveTo(x+a*s,y+b*s)); c.closePath(); c.fill(); c.strokeStyle='#f4e0a8'; c.lineWidth=4; c.stroke();
    c.fillStyle='#4f9a3a'; c.beginPath(); c.moveTo(x+.6*s,y+.18*s); c.lineTo(x+.62*s,y+.4*s); c.lineTo(x+.55*s,y+.66*s); c.lineTo(x+.5*s,y+.6*s); c.lineTo(x+.52*s,y+.36*s); c.closePath(); c.fill();
    c.fillStyle='#fff'; for(const [a,b] of [[.57,.3],[.55,.46]]){ c.beginPath(); c.moveTo(x+a*s-6,y+b*s+4); c.lineTo(x+a*s,y+b*s-6); c.lineTo(x+a*s+6,y+b*s+4); c.fill(); }
    const tx=x+.6*s,ty=y+.14*s; c.fillStyle='#3a8a5a'; for(let k=0;k<6;k++){ c.fillRect(tx-5+k*.6,ty-k*6,10-k*1.2,6); } c.fillRect(tx-.7,ty-44,1.4,10); // 101
    c.fillStyle='#fff'; c.beginPath(); c.moveTo(x+.2*s,y+.6*s); c.lineTo(x+.27*s,y+.6*s); c.lineTo(x+.25*s,y+.64*s); c.lineTo(x+.22*s,y+.64*s); c.fill(); c.fillStyle='#e23b3b'; c.fillRect(x+.235*s,y+.52*s,2,s*.08); c.beginPath(); c.moveTo(x+.237*s,y+.52*s); c.lineTo(x+.29*s,y+.56*s); c.lineTo(x+.237*s,y+.58*s); c.fill(); }
  else if(mi===1){ c.fillStyle='#0b1a4a'; c.fillRect(x,y,s,s); for(let k=0;k<40;k++){ c.fillStyle='rgba(255,255,255,'+(.3+(k%3)*.2)+')'; c.fillRect(x+(k*73%100)/100*s,y+(k*37%100)/100*s,1.5,1.5); }
    const R=s*.34,g=c.createRadialGradient(cx-R*.3,cy-R*.3,R*.1,cx,cy,R); g.addColorStop(0,'#7ad8ff'); g.addColorStop(1,'#1f6ab8'); c.fillStyle=g; c.beginPath(); c.arc(cx,cy,R,0,7); c.fill();
    c.save(); c.beginPath(); c.arc(cx,cy,R,0,7); c.clip(); c.fillStyle='#6fd35a'; for(const [a,b,rx,ry] of [[-.4,-.3,.35,.25],[-.2,.35,.2,.35],[.35,-.2,.45,.3],[.45,.4,.2,.15]]){ c.beginPath(); c.ellipse(cx+a*R,cy+b*R,rx*R,ry*R,.3,0,7); c.fill(); } c.restore();
    c.strokeStyle='rgba(255,255,255,.4)'; c.lineWidth=1.5; c.beginPath(); c.ellipse(cx,cy,R,R*.35,0,0,7); c.stroke(); c.beginPath(); c.ellipse(cx,cy,R*.35,R,0,0,7); c.stroke();
    const a=t*.6,px=cx+Math.cos(a)*R*1.25,py=cy+Math.sin(a)*R*.5; c.fillStyle='#fff'; c.save(); c.translate(px,py); c.rotate(a+Math.PI/2); c.beginPath(); c.ellipse(0,0,10,3,0,0,7); c.fill(); c.fillRect(-2,-10,4,20); c.restore();
    c.fillStyle='#ffd23f'; c.beginPath(); c.moveTo(x+s*.12,y+s*.86); c.lineTo(x+s*.18,y+s*.6); c.lineTo(x+s*.24,y+s*.86); c.fill(); c.fillStyle='#e8c070'; c.beginPath(); c.moveTo(x+s*.75,y+s*.88); c.lineTo(x+s*.85,y+s*.7); c.lineTo(x+s*.95,y+s*.88); c.fill(); }
  else { const g=c.createLinearGradient(x,y,x,y+s); g.addColorStop(0,'#ffd6ec'); g.addColorStop(1,'#ffeef8'); c.fillStyle=g; c.fillRect(x,y,s,s);
    const cols=['#ff5d5d','#ffb000','#ffe14d','#5fd068','#4fb8ff','#b77bff']; cols.forEach((col,k)=>{ c.strokeStyle=col; c.lineWidth=7; c.beginPath(); c.arc(cx,y+s*.78,s*.42-k*7,Math.PI,0); c.stroke(); });
    c.fillStyle='#fff0f6'; rr(c,cx-40,cy-10,80,60,6); c.fill(); for(const k of [-1,1]){ c.fillStyle='#ffe0ee'; c.fillRect(cx+k*40-12,cy-30,24,80); c.fillStyle='#ff7eb6'; c.beginPath(); c.moveTo(cx+k*40-16,cy-30); c.lineTo(cx+k*40,cy-56); c.lineTo(cx+k*40+16,cy-30); c.fill(); }
    c.fillStyle='#ff9ec8'; c.beginPath(); c.moveTo(cx-18,cy-10); c.lineTo(cx,cy-46); c.lineTo(cx+18,cy-10); c.fill(); c.fillStyle='#8a4a2a'; rr(c,cx-10,cy+22,20,28,10); c.fill();
    for(const [a,col] of [[.15,'#ff5d8f'],[.85,'#7a5cff']]){ c.strokeStyle='#fff'; c.lineWidth=4; c.beginPath(); c.moveTo(x+a*s,y+s*.92); c.lineTo(x+a*s,y+s*.62); c.stroke(); c.fillStyle=col; c.beginPath(); c.arc(x+a*s,y+s*.58,16,0,7); c.fill(); } }
  c.restore();
  // 標題
  c.textAlign='center'; c.textBaseline='middle'; c.font='900 26px '+TC; c.lineWidth=6; c.strokeStyle='#ffffff'; c.strokeText('環島地產王',cx,y+26); c.fillStyle='#e23b3b'; c.fillText('環島地產王',cx,y+26);
  c.font='900 13px '+TC; c.fillStyle='#14122b'; c.strokeText(MAPS[mi].name,cx,y+50); c.fillText(MAPS[mi].name,cx,y+50); }

function stageShow(ctx,w,h,si,t){ const k=Math.min(w/W,h/H); ctx.fillStyle='#14122b'; ctx.fillRect(0,0,w,h); ctx.save(); ctx.translate((w-BS*k*1.0)/2-BX*k,0); ctx.scale(k*1,k*1); const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,MAPS[si].bg[0]); g.addColorStop(1,MAPS[si].bg[1]); ctx.fillStyle=g; ctx.fillRect(-200,0,W+400,H);
  drawBoard(ctx,si,t); const RH=window.__RHY; if(RH){ for(let p=0;p<4;p++){ const i=(Math.floor(t*2)+p*5)%32,[x,y]=center(i); RH.drawChibi(ctx,x,y+12,1.05,{t,body:PCOL[p],pants:'#2b2b44',shoe:'#fff',hairStyle:CHARS[p].hair,acc:CHARS[p].acc,capCol:PCOL[p],bob:Math.abs(Math.sin(t*4+p))*2}); } } ctx.restore(); }
function thumb(ctx,w,h,t){ stageShow(ctx,w,h,Math.floor(t/4)%3,t); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.12)+'px '+TC; ctx.lineWidth=7; ctx.strokeStyle='#14122b'; ctx.strokeText('環島地產王',w/2,h*.88); ctx.fillStyle='#ffd23f'; ctx.fillText('環島地產王',w/2,h*.88); }
function preview(ctx,w,h,L,t){ const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#7ed0ff'); g.addColorStop(1,'#c8f0ff'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  const RH=window.__RHY; if(RH) RH.drawChibi(ctx,w/2,h*.9,h/60,{t,body:L.color||PCOL[0],pants:'#2b2b44',shoe:'#fff',hairStyle:L.hair||'boy',acc:L.acc||'cap',capCol:L.color||PCOL[0],bob:Math.abs(Math.sin(t*3))*2,armL:.3+Math.sin(t*4)*.4,armR:.3}); }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).rich={
  name:'環島地產王',tag:'PROPERTY KING',color:'#e23b3b',online:true,maxPlayers:4,bots:true,minPlayers:2,
  desc:'擲骰子繞著寶島、世界或甜點樂園跑，買地蓋房子收過路費！和電腦玩、同一台輪流玩，或開房間 2～4 人連線。',
  goal:'擲骰子前進，買地、蓋房子，別人停到你的地要付過路費。打完回合數時總資產最多的人贏（或其他人都破產）。',
  stageGoal:si=>'地圖「'+MAPS[si].name+'」：停到空地可以買，機會、命運可能抽到購地卡（停到別人的地時付原價強制買下）和換地卡（停在自己的地上時跟別人的地互換），再停到自己的地可以加蓋（最多三層大樓），同色兩塊都買下過路費加倍。經過起點拿 $2,000；機會、命運卡有好有壞；停到救護車會被送去'+MAPS[si].corner[1]+'休息一回合；罰款會放進'+MAPS[si].corner[2]+'，誰停到就全部拿走。錢不夠會自動賣房賣地，還是不夠就破產。',
  stages:MAPS.map(m=>m.name),stageLabel:'選擇地圖',
  modes:[{id:'1p',label:'和電腦玩'},{id:'local',label:'同一台輪流玩'}],
  options:[{key:'seats',label:'人數',def:'4',opts:[{id:'2',label:'2 人'},{id:'3',label:'3 人'},{id:'4',label:'4 人'}]},
    {key:'rounds',label:'回合數',def:'15',opts:[{id:'10',label:'10 回合'},{id:'15',label:'15 回合'},{id:'20',label:'20 回合'},{id:'30',label:'30 回合'}]},
    {key:'pace',label:'動作速度',def:'normal',opts:[{id:'slow',label:'慢'},{id:'normal',label:'正常'},{id:'fast',label:'快'}]},
    {key:'cash',label:'起始現金',def:'15000',opts:[{id:'10000',label:'$10,000'},{id:'15000',label:'$15,000'},{id:'20000',label:'$20,000'}]}],
  help:[['空白鍵','擲骰子；買下、加蓋、使用卡片'],['N','不要'],['← →','換地卡選要換的地（也可以直接點）'],['滑鼠','點右邊的按鈕']],
  touchHelp:[['擲骰子','輪到你時按'],['買下／加蓋／不要','停到地上時選']],
  touch:null,
  best:{label:'最多資產',fmt:v=>money(v),lower:false},
  looks:[{key:'hair',label:'髮型',opts:[{id:'boy',label:'短髮'},{id:'girl',label:'長髮'},{id:'bun',label:'包包頭'}]},
    {key:'acc',label:'頭上',opts:[{id:'cap',label:'帽子'},{id:'bow',label:'蝴蝶結'},{id:'phones',label:'耳機'},{id:'band',label:'頭巾'},{id:'none',label:'不戴'}]},
    {key:'color',label:'衣服顏色',type:'color',opts:['#3d8bff','#ff5d8f','#3fae5a','#ffb000','#7a5cff','#e23b3b']}],
  stageShow,preview,thumb,create
};
})();
