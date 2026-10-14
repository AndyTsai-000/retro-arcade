// 台灣十六張麻將：雙人或四人。144 張（含 8 張花），每人 16 張，胡牌是 5 組加 1 對。
// 有補花、吃（只能吃上家）、碰、明槓、暗槓、加槓、放槍、自摸；牌牆剩 16 張流局；莊家胡或流局連莊。
// 連線時房主判定，其他人只送出動作（打牌、吃碰槓胡、過）。
(function(){
'use strict';
const W=800,H=500,RESERVE=16;
const PIX='"Press Start 2P","Noto Sans TC","Microsoft JhengHei",monospace',TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const NUMS='一二三四五六七八九',HON='東南西北中發白',FLW='春夏秋冬梅蘭竹菊';
const kindOf=id=>id<136?id>>2:34+(id-136);
const isFlower=id=>id>=136;
const kname=k=>k<9?NUMS[k]+'萬':k<18?NUMS[k-9]+'筒':k<27?NUMS[k-18]+'條':k<34?HON[k-27]:FLW[k-34];
const cnt=ids=>{ const c=new Array(34).fill(0); for(const id of ids){ const k=kindOf(id); if(k<34) c[k]++; } return c; };
const sortIds=a=>a.slice().sort((x,y)=>kindOf(x)-kindOf(y)||x-y);

/* ---- 胡牌拆解：一對加若干組（刻子或順子） ---- */
function rec(c,i,sets,need,emit){
  while(i<34&&!c[i]) i++;
  if(i>=34){ if(sets.length===need) emit(sets); return; }
  if(sets.length>=need) return;
  if(c[i]>=3){ c[i]-=3; sets.push({t:'pung',k:i}); rec(c,i,sets,need,emit); sets.pop(); c[i]+=3; }
  if(i<27&&i%9<=6&&c[i+1]&&c[i+2]){ c[i]--; c[i+1]--; c[i+2]--; sets.push({t:'chow',k:i}); rec(c,i,sets,need,emit); sets.pop(); c[i]++; c[i+1]++; c[i+2]++; }
}
function decomps(c,need,limit){
  const out=[];
  for(let p=0;p<34&&out.length<limit;p++){ if(c[p]<2) continue; c[p]-=2; rec(c,0,[],need,s=>{ if(out.length<limit) out.push({pair:p,sets:s.map(x=>({t:x.t,k:x.k}))}); }); c[p]+=2; }
  return out;
}
const shMemo=new Map(); // 跨次共用，太大就清掉
function shDfs(c,i,M,T,need){
  while(i<34&&!c[i]) i++;
  if(i>=34) return 2*need-2*M-Math.min(T,need-M);
  const key=need+'|'+i+'|'+M+'|'+T+'|'+c.slice(i).join(''); if(shMemo.has(key)) return shMemo.get(key);
  c[i]--; let best=shDfs(c,i,M,T,need); c[i]++; // 這張當孤張不用
  if(c[i]>=3){ c[i]-=3; best=Math.min(best,shDfs(c,i,M+1,T,need)); c[i]+=3; }
  if(i<27&&i%9<=6&&c[i+1]&&c[i+2]){ c[i]--; c[i+1]--; c[i+2]--; best=Math.min(best,shDfs(c,i,M+1,T,need)); c[i]++; c[i+1]++; c[i+2]++; }
  if(M+T<need){
    if(c[i]>=2){ c[i]-=2; best=Math.min(best,shDfs(c,i,M,T+1,need)); c[i]+=2; }
    if(i<27&&i%9<=7&&c[i+1]){ c[i]--; c[i+1]--; best=Math.min(best,shDfs(c,i,M,T+1,need)); c[i]++; c[i+1]++; }
    if(i<27&&i%9<=6&&c[i+2]){ c[i]--; c[i+2]--; best=Math.min(best,shDfs(c,i,M,T+1,need)); c[i]++; c[i+2]++; }
  }
  shMemo.set(key,best); return best;
}
function shanten(c,need){
  if(shMemo.size>400000) shMemo.clear();
  let best=shDfs(c,0,0,0,need);
  for(let k=0;k<34;k++) if(c[k]>=2){ c[k]-=2; best=Math.min(best,shDfs(c,0,0,0,need)-1); c[k]+=2; }
  return best;
}
const canWin=(ids,melds)=>{ const need=5-melds.length; return ids.length===need*3+2&&decomps(cnt(ids),need,1).length>0; };

/* ---- 畫牌 ---- */
const DP={1:[[.5,.5]],2:[[.5,.26],[.5,.74]],3:[[.22,.2],[.5,.5],[.78,.8]],4:[[.28,.27],[.72,.27],[.28,.73],[.72,.73]],5:[[.25,.22],[.75,.22],[.5,.5],[.25,.78],[.75,.78]],
  6:[[.28,.18],[.72,.18],[.28,.5],[.72,.5],[.28,.82],[.72,.82]],7:[[.2,.13],[.5,.24],[.8,.35],[.28,.62],[.72,.62],[.28,.87],[.72,.87]],
  8:[[.28,.13],[.72,.13],[.28,.38],[.72,.38],[.28,.62],[.72,.62],[.28,.87],[.72,.87]],9:[[.2,.17],[.5,.17],[.8,.17],[.2,.5],[.5,.5],[.8,.5],[.2,.83],[.5,.83],[.8,.83]]};
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function face(c,x,y,w,h,k){
  const fx=x+w*.12,fy=y+h*.09,fw=w*.76,fh=h*.82; c.textAlign='center'; c.textBaseline='middle';
  if(k<9){ c.fillStyle='#1d2a6b'; c.font='900 '+h*.34+'px '+TC; c.fillText(NUMS[k],x+w/2,y+h*.3); c.fillStyle='#c62828'; c.font='900 '+h*.36+'px '+TC; c.fillText('萬',x+w/2,y+h*.7); return; }
  if(k<18){ const n=k-8,pos=DP[n],r=n===1?fw*.36:n<=4?fw*.17:n<=6?fw*.14:fw*.12,cols=['#1d6fd1','#2e9a4a','#d63b3b'];
    pos.forEach(([u,v],i)=>{ const cx=fx+u*fw,cy=fy+v*fh,col=n===1?'#d63b3b':n===2?'#2e9a4a':cols[(i+(n===3?0:1))%3]; c.fillStyle=col; c.beginPath(); c.arc(cx,cy,r,0,7); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(cx,cy,r*.55,0,7); c.fill(); c.fillStyle=col; c.beginPath(); c.arc(cx,cy,r*.28,0,7); c.fill(); });
    return; }
  if(k<27){ const n=k-17;
    if(n===1){ const cx=x+w/2,cy=y+h/2; c.fillStyle='#2e9a4a'; c.beginPath(); c.ellipse(cx,cy+h*.05,w*.22,h*.2,0,0,7); c.fill(); c.fillStyle='#d63b3b'; c.beginPath(); c.arc(cx,cy-h*.2,w*.12,0,7); c.fill(); c.fillStyle='#1d6fd1'; c.beginPath(); c.moveTo(cx,cy+h*.1); c.lineTo(cx-w*.25,cy+h*.36); c.lineTo(cx+w*.25,cy+h*.36); c.fill(); c.fillStyle='#ffd23f'; c.beginPath(); c.moveTo(cx+w*.1,cy-h*.21); c.lineTo(cx+w*.24,cy-h*.18); c.lineTo(cx+w*.1,cy-h*.15); c.fill(); return; }
    const pos=DP[n],sw=fw*.15,sh=fh*(n<=3?.3:n<=6?.26:.2);
    pos.forEach(([u,v],i)=>{ const cx=fx+u*fw,cy=fy+v*fh,col=(n===7&&i===0)||(n===9&&i%3===1)||(n===5&&i===2)?'#d63b3b':'#2e8b3a'; c.fillStyle=col; rr(c,cx-sw/2,cy-sh/2,sw,sh,sw/2); c.fill(); c.fillStyle='rgba(255,255,255,.55)'; c.fillRect(cx-sw/2,cy-.6,sw,1.2); });
    return; }
  if(k<34){ if(k===33){ c.strokeStyle='#1d6fd1'; c.lineWidth=Math.max(1.2,w*.07); rr(c,x+w*.22,y+h*.2,w*.56,h*.6,w*.06); c.stroke(); return; }
    c.fillStyle=k===31?'#c62828':k===32?'#1f8a3a':'#1b1b2a'; c.font='900 '+h*.56+'px '+TC; c.fillText(HON[k-27],x+w/2,y+h*.53); return; }
  const f=k-34; c.fillStyle=f<4?'#c62828':'#1f6fb0'; c.font='900 '+h*.5+'px '+TC; c.fillText(FLW[f],x+w/2,y+h*.55); c.font='700 '+h*.2+'px '+TC; c.fillText(String(f%4+1),x+w*.24,y+h*.18);
}
// id<0 是牌背
function drawTile(c,x,y,w,h,id,o){
  o=o||{}; const d=Math.max(2,h*.09);
  c.fillStyle='rgba(0,0,0,.3)'; rr(c,x+1,y+2,w,h+d,Math.max(2,w*.12)); c.fill();
  c.fillStyle='#1f7a4c'; rr(c,x,y+d*.4,w,h+d*.6,Math.max(2,w*.12)); c.fill(); // 綠色牌背的厚度
  if(id<0){ const g=c.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#3fae74'); g.addColorStop(1,'#237d50'); c.fillStyle=g; rr(c,x,y,w,h,Math.max(2,w*.12)); c.fill(); c.fillStyle='rgba(255,255,255,.18)'; c.fillRect(x+w*.15,y+h*.06,w*.7,Math.max(1,h*.03)); return; }
  const g=c.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#fffdf6'); g.addColorStop(1,'#efe4c9'); c.fillStyle=g; rr(c,x,y,w,h,Math.max(2,w*.12)); c.fill();
  c.strokeStyle=o.sel?'#ffd23f':o.last?'#ff5d4f':'rgba(140,120,80,.55)'; c.lineWidth=o.sel||o.last?2:1; c.stroke();
  face(c,x,y,w,h,kindOf(id));
  if(o.dim){ c.fillStyle='rgba(0,0,0,.35)'; rr(c,x,y,w,h,Math.max(2,w*.12)); c.fill(); }
}

/* ---- 牌桌：木框＋絨布，畫一次存起來 ---- */
const tableCache={};
function tableArt(felt){
  if(tableCache[felt]) return tableCache[felt];
  const cv=document.createElement('canvas'),S=2; cv.width=W*S; cv.height=H*S; const c=cv.getContext('2d'); c.scale(S,S);
  let seed=11; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  let g=c.createLinearGradient(0,0,W,H); g.addColorStop(0,'#5a3016'); g.addColorStop(.5,'#6e3c1b'); g.addColorStop(1,'#4a2610'); c.fillStyle=g; c.fillRect(0,0,W,H);
  for(let i=0;i<80;i++){ const y=rnd()*H; c.strokeStyle='rgba('+(rnd()<.5?'0,0,0':'255,215,160')+','+(.04+rnd()*.07)+')'; c.lineWidth=1; c.beginPath(); c.moveTo(0,y); for(let x=0;x<=W;x+=40) c.lineTo(x,y+Math.sin(x*.018+i)*3); c.stroke(); }
  const fx=7,fy=7,fw=W-14,fh=H-14; rr(c,fx,fy,fw,fh,16); c.save(); c.clip();
  c.fillStyle=felt; c.fillRect(fx,fy,fw,fh);
  g=c.createRadialGradient(W/2,H*.46,40,W/2,H*.46,W*.62); g.addColorStop(0,'rgba(255,255,255,.14)'); g.addColorStop(.5,'rgba(255,255,255,0)'); g.addColorStop(1,'rgba(0,0,0,.45)'); c.fillStyle=g; c.fillRect(fx,fy,fw,fh);
  for(let i=0;i<11000;i++){ c.fillStyle=rnd()<.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.07)'; c.fillRect(fx+rnd()*fw,fy+rnd()*fh,1,1); }
  c.strokeStyle='rgba(255,255,255,.02)'; for(let k=-fh;k<fw;k+=4){ c.beginPath(); c.moveTo(fx+k,fy); c.lineTo(fx+k+fh,fy+fh); c.stroke(); }
  c.restore();
  c.save(); rr(c,fx,fy,fw,fh,16); c.clip(); c.shadowColor='rgba(0,0,0,.65)'; c.shadowBlur=16; c.lineWidth=12; c.strokeStyle='rgba(0,0,0,.5)'; rr(c,fx-6,fy-6,fw+12,fh+12,20); c.stroke(); c.restore();
  c.strokeStyle='rgba(222,184,96,.5)'; c.lineWidth=1.2; rr(c,fx+6,fy+6,fw-12,fh-12,11); c.stroke();
  // 中央的骰盤
  c.save(); c.translate(W/2,240); g=c.createLinearGradient(0,-58,0,58); g.addColorStop(0,'rgba(20,14,8,.55)'); g.addColorStop(1,'rgba(20,14,8,.35)'); c.fillStyle=g; rr(c,-96,-56,192,112,16); c.fill();
  c.strokeStyle='rgba(222,184,96,.55)'; c.lineWidth=1.5; rr(c,-96,-56,192,112,16); c.stroke(); rr(c,-90,-50,180,100,12); c.strokeStyle='rgba(222,184,96,.22)'; c.stroke(); c.restore();
  return tableCache[felt]=cv;
}

function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,me=net?net.me:0;
  const humans=net?net.count:1,np=net?Math.max(2,Math.min(4,net.count+(net.bots||0))):(opts.variant==='2'?2:4);
  const LEN=(opts.options||{}).len||'c',TARGET=LEN==='q'?1:LEN==='j'?4*np:np,LENNAME={q:'1/4 圈',c:'1 圈',j:'1 將'}[LEN]||'1 圈',L=opts.look||{felt:'#1d5e45'};
  const {ctx,canvas}=env.canvas2d(W,H);
  const names=[]; for(let i=0;i<np;i++) names.push(i<humans?(net?(net.names&&net.names[i])||'玩家'+(i+1):(opts.name||'你')):'電腦 '+(i-humans+1));
  const isAI=p=>p>=humans;
  const sfx=n=>env.sfx(n);
  let msg='',msgT=0,t=0,aiT=0,sel=-1,sendT=0,ended=false,claimT=0,playT=0,lastKey='';
  const say=(s,sec)=>{ msg=s; msgT=sec||1.8; };
  const G={wall:[],wallN:0,hands:[],melds:[],flowers:[],discards:[],turn:0,phase:'play',drawn:-1,last:null,claim:null,dealer:0,lian:0,moves:0,handNo:0,scores:new Array(np).fill(0),result:null,log:'',afterKong:false,ev:[]};
  const seatOf=p=>{ const r=(p-G.dealer+np)%np; return np===2?[0,2][r]:r; };
  const next=p=>(p+1)%np;
  const windOf=()=>Math.floor(G.moves/np)%4;

  /* ---- 一局的流程（房主或單機才執行） ---- */
  function startHand(){
    const w=[]; for(let i=0;i<144;i++) w.push(i); for(let i=w.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [w[i],w[j]]=[w[j],w[i]]; }
    G.wall=w; G.hands=[]; G.melds=[]; G.flowers=[]; G.discards=[];
    for(let p=0;p<np;p++){ G.hands.push([]); G.melds.push([]); G.flowers.push([]); G.discards.push([]); }
    for(let r=0;r<16;r++) for(let k=0;k<np;k++){ const p=(G.dealer+k)%np; G.hands[p].push(G.wall.shift()); }
    for(let k=0;k<np;k++){ const p=(G.dealer+k)%np; let f; while((f=G.hands[p].find(isFlower))!=null){ G.hands[p].splice(G.hands[p].indexOf(f),1); G.flowers[p].push(f); G.hands[p].push(G.wall.pop()); } }
    G.result=null; G.claim=null; G.last=null; G.afterKong=false; G.log='第 '+(G.handNo+1)+' 局開始，'+names[G.dealer]+' 當莊';
    drawFor(G.dealer,false);
  }
  function drawFor(p,back){
    if(G.wall.length<=RESERVE){ endDraw(); return; }
    let id=back?G.wall.pop():G.wall.shift(),fl=0;
    while(isFlower(id)){ G.flowers[p].push(id); fl++; if(G.wall.length<=RESERVE){ endDraw(); return; } id=G.wall.pop(); }
    if(fl) { G.log=names[p]+' 補花 '+fl+' 張'; sfx('item'); }
    G.hands[p].push(id); G.drawn=id; G.turn=p; G.phase='play'; G.claim=null; G.afterKong=!!back; playT=0; aiT=0;
  }
  function discard(p,id){
    const h=G.hands[p],i=h.indexOf(id); if(i<0||G.phase!=='play'||G.turn!==p) return;
    h.splice(i,1); G.discards[p].push(id); G.last={p,id}; G.drawn=-1; G.afterKong=false; sfx('place'); G.log=names[p]+' 打出 '+kname(kindOf(id));
    const k=kindOf(id),opts={};
    for(let q=0;q<np;q++){ if(q===p) continue; const o=[],hq=G.hands[q],c=cnt(hq)[k];
      if(canWin(hq.concat([id]),G.melds[q])) o.push({c:'hu'});
      if(G.wall.length>RESERVE){ if(c>=3) o.push({c:'kong'}); if(c>=2) o.push({c:'pong'});
        if(q===next(p)&&k<27){ const s=k%9,have=x=>hq.some(t=>kindOf(t)===x); for(const pr of [[-2,-1],[-1,1],[1,2]]){ const a=k+pr[0],b=k+pr[1]; if(s+pr[0]>=0&&s+pr[1]<=8&&have(a)&&have(b)) o.push({c:'chow',k:[a,b]}); } } }
      if(o.length) opts[q]=o; }
    if(!Object.keys(opts).length){ drawFor(next(p),false); return; }
    G.phase='claim'; G.claim={from:p,id,opts,resp:{}}; claimT=0;
    for(const q in opts) if(isAI(+q)) G.claim.resp[q]=aiClaim(+q,opts[q],k);
    tryResolve();
  }
  function respond(q,r){ if(G.phase!=='claim'||!G.claim.opts[q]||G.claim.resp[q]!==undefined) return; G.claim.resp[q]=r; tryResolve(); }
  function tryResolve(){
    const C=G.claim; if(Object.keys(C.opts).some(q=>C.resp[q]===undefined)) return;
    const order=[]; for(let k=1;k<np;k++) order.push((C.from+k)%np);
    const pick=c=>order.find(q=>C.resp[q]&&C.resp[q].c===c);
    let q=pick('hu'); if(q!=null){ win(q,C.id,false,C.from); return; }
    q=pick('kong'); if(q==null) q=pick('pong');
    const k=kindOf(C.id),take=()=>{ const d=G.discards[C.from]; d.splice(d.lastIndexOf(C.id),1); };
    const pull=(p,kind,n)=>{ const out=[]; for(let i=0;i<n;i++){ const h=G.hands[p],j=h.findIndex(t=>kindOf(t)===kind); out.push(h.splice(j,1)[0]); } return out; };
    if(q!=null){ const kong=C.resp[q].c==='kong',ids=pull(q,k,kong?3:2).concat([C.id]); take(); G.melds[q].push({t:kong?'kong':'pong',ids,k,from:C.from}); G.log=names[q]+(kong?' 槓！':' 碰！'); say(names[q]+(kong?'　槓！':'　碰！'),1.2); sfx('boom');
      if(kong) drawFor(q,true); else { G.turn=q; G.phase='play'; G.drawn=-1; G.claim=null; playT=0; aiT=0; } return; }
    q=pick('chow');
    if(q!=null){ const ks=C.resp[q].k,ids=[pull(q,ks[0],1)[0],pull(q,ks[1],1)[0],C.id]; take(); G.melds[q].push({t:'chow',ids:sortIds(ids),k:Math.min(k,ks[0],ks[1]),from:C.from}); G.log=names[q]+' 吃！'; say(names[q]+'　吃！',1.2); sfx('item');
      G.turn=q; G.phase='play'; G.drawn=-1; G.claim=null; playT=0; aiT=0; return; }
    drawFor(next(C.from),false);
  }
  function selfKong(p,k){
    if(G.phase!=='play'||G.turn!==p||G.wall.length<=RESERVE) return;
    const h=G.hands[p],c=cnt(h)[k];
    if(c===4){ const ids=h.filter(t=>kindOf(t)===k); G.hands[p]=h.filter(t=>kindOf(t)!==k); G.melds[p].push({t:'ankong',ids,k}); }
    else { const m=G.melds[p].find(m=>m.t==='pong'&&m.k===k); if(!m||!c) return; const id=h.find(t=>kindOf(t)===k); h.splice(h.indexOf(id),1); m.ids.push(id); m.t='kong'; }
    G.log=names[p]+' 槓！'; say(names[p]+'　槓！',1.2); sfx('boom'); drawFor(p,true);
  }
  const kongKinds=p=>{ const h=G.hands[p],c=cnt(h),out=[]; for(let k=0;k<34;k++){ if(c[k]===4) out.push(k); else if(c[k]&&G.melds[p].some(m=>m.t==='pong'&&m.k===k)) out.push(k); } return out; };
  function tsumo(p){ if(G.phase!=='play'||G.turn!==p||!canWin(G.hands[p],G.melds[p])) return; win(p,G.hands[p][G.hands[p].length-1],true,-1); }

  /* ---- 台數（照台灣十六張常見算法） ---- */
  function tally(p,winId,self,from){
    const ids=self?G.hands[p].slice():G.hands[p].concat([winId]),ms=G.melds[p],ds=decomps(cnt(ids),5-ms.length,80),wk=kindOf(winId);
    let best=null;
    for(const d of ds){
      const L=[],add=(n,v)=>L.push([n,v]),seat=seatOf(p),rw=windOf();
      const sets=ms.map(m=>({t:m.t==='chow'?'chow':'pung',k:m.k,open:m.t!=='ankong'})).concat(d.sets.map(s=>({t:s.t,k:s.k,open:false,mine:1})));
      if(!self&&d.pair!==wk&&!d.sets.some(s=>s.t==='chow'&&wk>=s.k&&wk<=s.k+2)){ const ps=sets.find(s=>s.mine&&s.t==='pung'&&s.k===wk); if(ps) ps.open=true; }
      const open=ms.some(m=>m.t!=='ankong');
      if(!open&&self) add('門清自摸',3); else { if(!open) add('門清',1); if(self) add('自摸',1); }
      const pk=sets.filter(s=>s.t==='pung').map(s=>s.k),dr=[31,32,33].filter(k=>pk.includes(k)).length;
      if(dr===3) add('大三元',8); else if(dr===2&&d.pair>=31) add('小三元',4); else for(const k of [31,32,33]) if(pk.includes(k)) add(HON[k-27]+'（三元牌）',1);
      const wn=[27,28,29,30].filter(k=>pk.includes(k)).length;
      if(wn===4) add('大四喜',16); else if(wn===3&&d.pair>=27&&d.pair<=30) add('小四喜',8); else { if(pk.includes(27+rw)) add('圈風 '+HON[rw],1); if(pk.includes(27+seat)) add('門風 '+HON[seat],1); }
      const fl=G.flowers[p].map(kindOf),zh=fl.filter(k=>(k-34)%4===seat).length; if(zh) add('正花',zh);
      if([34,35,36,37].every(k=>fl.includes(k))) add('春夏秋冬',2); if([38,39,40,41].every(k=>fl.includes(k))) add('梅蘭竹菊',2);
      if(sets.every(s=>s.t==='pung')) add('碰碰胡',4);
      const all=ids.map(kindOf).concat(ms.flatMap(m=>m.ids.map(kindOf))),suits=new Set(all.filter(k=>k<27).map(k=>Math.floor(k/9))),hasH=all.some(k=>k>=27);
      if(!suits.size) add('字一色',16); else if(suits.size===1) add(hasH?'混一色':'清一色',hasH?4:8);
      if(!self&&!fl.length&&!hasH&&sets.every(s=>s.t==='chow')) add('平胡',2);
      const an=sets.filter(s=>s.t==='pung'&&!s.open).length; if(an>=5) add('五暗刻',8); else if(an===4) add('四暗刻',5); else if(an===3) add('三暗刻',2);
      if(!self&&ms.length===5&&ms.every(m=>m.t!=='ankong')) add('全求人',2);
      if(G.wall.length<=RESERVE) add(self?'海底撈月':'河底撈魚',1);
      if(self&&G.afterKong) add('槓上開花',1);
      const tai=L.reduce((a,b)=>a+b[1],0); if(!best||tai>best.tai) best={tai,items:L};
    }
    return best||{tai:0,items:[]};
  }
  function win(p,id,self,from){
    // 莊家台：莊家 1 台＋連 N 拉 N 共 2N 台，只算在莊家跟對方之間（莊家胡牌，或莊家放槍／被自摸）
    const r=tally(p,id,self,from),dt=1+2*G.lian,delta=new Array(np).fill(0),pays={},payOf=q=>3+r.tai+(p===G.dealer||q===G.dealer?dt:0);
    const dItems=[['莊家',1]]; if(G.lian) dItems.push(['連'+G.lian+'拉'+G.lian,G.lian*2]);
    if(self){ for(let q=0;q<np;q++) if(q!==p){ const v=payOf(q); pays[q]=v; delta[q]-=v; delta[p]+=v; } }
    else { const v=payOf(from); pays[from]=v; delta[from]-=v; delta[p]+=v; const d=G.discards[from]; d.splice(d.lastIndexOf(id),1); G.hands[p].push(id); }
    for(let q=0;q<np;q++) G.scores[q]+=delta[q];
    const withD=p===G.dealer||Object.keys(pays).some(q=>+q===G.dealer);
    G.result={w:p,from,self,tai:r.tai,items:r.items,dItems:withD?dItems:[],dealerWin:p===G.dealer,dt,pays,delta,win:id}; G.phase='end'; G.claim=null;
    G.log=self?names[p]+' 自摸！':names[p]+' 胡了！（'+names[from]+' 放槍）'; sfx('win');
  }
  function endDraw(){ G.result={draw:true,delta:new Array(np).fill(0)}; G.phase='end'; G.claim=null; G.log='流局'; sfx('lose'); }
  function nextHand(){
    if(G.phase!=='end') return;
    const r=G.result; G.handNo++;
    if(r.draw||r.w===G.dealer) G.lian++; else { G.dealer=next(G.dealer); G.lian=0; G.moves++; }
    if(G.moves>=TARGET||G.handNo>=60){ G.phase='over'; finish(); return; } // 莊家輪換次數到了就結束（連莊不算）
    startHand();
  }
  function finish(){
    if(ended) return; ended=true;
    const rank=names.map((n,i)=>({i,n,s:G.scores[i]})).sort((a,b)=>b.s-a.s),winMe=rank[0].i===me;
    setTimeout(()=>{ env.sfx(winMe?'win':'lose'); env.end({title:winMe?'你贏了！':rank[0].n+' 獲勝',big:'',
      html:'<ul class="rest">'+rank.map((r,k)=>'<li>第 '+(k+1)+' 名　'+r.n+'　'+(r.s>0?'+':'')+r.s+' 分</li>').join('')+'</ul>',
      text:LENNAME+'（共 '+G.handNo+' 把），'+np+' 人麻將。每把底 3 分、每台 1 分。',score:G.scores[me]>0?G.scores[me]:null}); },600);
  }

  /* ---- 電腦 ---- */
  const valuable=(p,k)=>k>=31||k===27+seatOf(p)||k===27+windOf();
  function keepScore(p,c,k){
    if(k>=27) return c[k]>=3?30:c[k]===2?(valuable(p,k)?16:11):(valuable(p,k)?2:0);
    const s=k%9; let v=c[k]>=3?30:c[k]===2?10:0;
    if(s>0&&c[k-1]) v+=6; if(s<8&&c[k+1]) v+=6; if(s>1&&c[k-2]) v+=3; if(s<7&&c[k+2]) v+=3;
    return v+(s===0||s===8?0:1.5);
  }
  // 場上看得到的牌：自己手牌＋所有人打出的牌＋別人的吃碰槓
  function seen(p){ const c=cnt(G.hands[p]); for(let q=0;q<np;q++){ for(const id of G.discards[q]){ const k=kindOf(id); if(k<34) c[k]++; } if(q!==p) for(const m of G.melds[q]) for(const id of m.ids) c[kindOf(id)]++; } return c; }
  // 這手牌的向聽數，以及還能進幾張讓它更接近胡牌的牌
  // 只有跟手牌同種或差兩張以內的牌才可能有用
  const near=(c,k)=>{ if(c[k]) return true; if(k>=27) return false; const s=k%9; return s>0&&c[k-1]||s<8&&c[k+1]||s>1&&c[k-2]||s<7&&c[k+2]; };
  function evalHand(c,need,vis){
    const sh=shanten(c,need); let uke=0;
    for(let k=0;k<34;k++){ const left=4-vis[k]; if(left<=0) continue; if(!near(c,k)) continue; c[k]++; if(shanten(c,need)<sh) uke+=left; c[k]--; }
    return {sh,uke};
  }
  // 看起來快聽牌的對手（副露三組以上，或牌快摸完時副露兩組以上）
  function threats(p){ const out=[]; for(let q=0;q<np;q++) if(q!==p&&(G.melds[q].length>=3||G.wall.length<RESERVE+12&&G.melds[q].length>=2)) out.push(q); return out; }
  function danger(k,th,vis){ let d=0; for(const q of th){ if(G.discards[q].some(id=>kindOf(id)===k)) continue; d+=k>=27?(vis[k]>=3?0:vis[k]>=2?.3:1):(k%9===0||k%9===8?.7:1); } return d; }
  const lexLess=(a,b)=>{ for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return a[i]<b[i]; return false; };
  function aiDiscard(p){
    const h=G.hands[p],c=cnt(h),need=5-G.melds[p].length,vis=seen(p),th=threats(p);
    let best=-1,bk=null;
    for(let k=0;k<34;k++){ if(!c[k]) continue; c[k]--; const e=evalHand(c,need,vis); c[k]++;
      const dz=danger(k,th,vis),key=th.length&&e.sh>=2?[dz*3+e.sh,-e.uke]:[e.sh,-e.uke,dz,keepScore(p,c,k)];
      if(!bk||lexLess(key,bk)){ bk=key; best=k; } }
    return h.find(id=>kindOf(id)===best);
  }
  function aiClaim(p,o,k){
    if(o.some(x=>x.c==='hu')) return {c:'hu'};
    const c=cnt(G.hands[p]),need=5-G.melds[p].length,before=shanten(c,need);
    // 吃碰之後還要打掉一張：看打完後最好的向聽數
    const after=rm=>{ const d=c.slice(); for(const x of rm) d[x]--; let b=99; for(let j=0;j<34;j++){ if(!d[j]) continue; d[j]--; b=Math.min(b,shanten(d,need-1)); d[j]++; } return b; };
    if(o.some(x=>x.c==='kong')){ const d=c.slice(); d[k]-=3; if(shanten(d,need-1)<=before) return {c:'kong'}; }
    let pick={c:'pass'},bestSh=before;
    if(o.some(x=>x.c==='pong')){ const a=after([k,k]); if(a<bestSh||a===bestSh&&valuable(p,k)){ bestSh=a; pick={c:'pong'}; } }
    for(const x of o.filter(x=>x.c==='chow')){ const a=after(x.k); if(a<bestSh){ bestSh=a; pick=x; } }
    return pick;
  }
  function aiPlay(p){
    if(canWin(G.hands[p],G.melds[p])){ tsumo(p); return; }
    const kk=kongKinds(p);
    if(kk.length&&G.wall.length>RESERVE){ const c=cnt(G.hands[p]),need=5-G.melds[p].length,now=shanten(c,need);
      for(const k of kk){ const d=c.slice(); let n2=need; if(d[k]===4){ d[k]=0; n2=need-1; } else d[k]--; if(shanten(d,n2)<=now){ selfKong(p,k); return; } } }
    discard(p,aiDiscard(p));
  }

  /* ---- 連線 ---- */
  function pub(){ return {hands:G.hands,melds:G.melds,flowers:G.flowers,discards:G.discards,wallN:G.wall.length,turn:G.turn,phase:G.phase,drawn:G.drawn,last:G.last,claim:G.claim,dealer:G.dealer,lian:G.lian,moves:G.moves,handNo:G.handNo,scores:G.scores,result:G.result,log:G.log}; }
  function broadcast(){ if(net&&net.host) net.send({st:pub()}); }
  function act(p,m){
    if(m.a==='discard') discard(p,m.id);
    else if(m.a==='claim') respond(p,m.r);
    else if(m.a==='kong') selfKong(p,m.k);
    else if(m.a==='tsumo') tsumo(p);
    else if(m.a==='next'&&p===0) nextHand();
  }
  function doAct(m){ sel=-1; if(client) net.send(m); else { act(me,m); broadcast(); } }
  if(net){
    if(client) net.onmsg=m=>{ if(m.st){ const s=m.st,was=G.phase; Object.assign(G,s); if(s.phase==='over'&&was!=='over') finish(); } };
    else net.onmsg=(m,from)=>{ if(m.a){ act(from,m); broadcast(); } };
    if(!client) net.onleave=()=>{};
  }
  if(!client){ G.dealer=Math.floor(Math.random()*np); startHand(); broadcast(); }

  /* ---- 操作 ---- */
  const layout={hand:[],btn:[]};
  function toLogical(e){ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=(r.width-W*s)/2,oy=(r.height-H*s)/2; return [(e.clientX-r.left-ox)/s,(e.clientY-r.top-oy)/s]; }
  function onDown(e){ e.preventDefault(); const [x,y]=toLogical(e);
    for(const b of layout.btn) if(x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h){ sfx('click'); b.fn(); return; }
    for(const h of layout.hand) if(x>=h.x&&x<h.x+h.w&&y>=h.y-10&&y<h.y+h.h){ if(!myPlay()) { sel=sel===h.id?-1:h.id; return; } if(sel===h.id) doAct({a:'discard',id:h.id}); else { sel=h.id; sfx('click'); } return; }
    sel=-1; }
  canvas.style.touchAction='none'; canvas.addEventListener('pointerdown',onDown);
  const myPlay=()=>G.phase==='play'&&G.turn===me&&G.hands[me]&&G.hands[me].length%3===2;

  function update(dt){
    t+=dt; if(msgT>0) msgT-=dt;
    if(client||G.phase==='over') return;
    if(G.phase==='play'){ playT+=dt;
      if(isAI(G.turn)){ aiT+=dt; if(aiT>.75){ aiT=0; aiPlay(G.turn); broadcast(); } }
      else if(net&&G.turn!==me&&playT>30){ const h=G.hands[G.turn]; discard(G.turn,G.drawn>=0?G.drawn:h[h.length-1]); broadcast(); } }
    else if(G.phase==='claim'){ claimT+=dt; if(net&&claimT>12){ for(const q in G.claim.opts) if(G.claim.resp[q]===undefined) G.claim.resp[q]={c:'pass'}; tryResolve(); broadcast(); } }
    else if(G.phase==='end'&&net&&!humansIn()) { /* 只有電腦時不會發生 */ }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1; broadcast(); } }
  }
  const humansIn=()=>humans>0;

  /* ---- 畫面 ---- */
  // 位置：0 下（自己）、1 右、2 上、3 左
  const posOf=p=>{ const r=(p-me+np)%np; return np===2?[0,2][r]:np===3?[0,1,3][r]:r; };
  function button(x,y,w,h,label,fn,hot){ ctx.fillStyle='rgba(0,0,0,.4)'; rr(ctx,x+1,y+3,w,h,8); ctx.fill(); ctx.fillStyle=hot?'#ffd23f':'#3a3670'; rr(ctx,x,y,w,h,8); ctx.fill(); ctx.strokeStyle='rgba(11,10,28,.8)'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.2)'; ctx.fillRect(x+6,y+2,w-12,1.5); ctx.fillStyle=hot?'#14122b':'#fff'; ctx.font='900 15px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(label,x+w/2,y+h/2+1); layout.btn.push({x,y,w,h,fn}); }
  function txt(s,x,y,col,size,align,weight){ ctx.font=(weight||'700')+' '+size+'px '+TC; ctx.textAlign=align||'left'; ctx.textBaseline='middle'; ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,.55)'; ctx.strokeText(s,x,y); ctx.fillStyle=col; ctx.fillText(s,x,y); }
  function info(p,x,y,align){
    const act=G.turn===p&&(G.phase==='play'||G.phase==='claim'&&false),wnd=HON[seatOf(p)],dl=p===G.dealer;
    const label=(dl?'莊 ':'')+wnd+'　'+names[p],sc=(G.scores[p]>0?'+':'')+G.scores[p];
    ctx.font='900 13px '+TC; const w=Math.max(ctx.measureText(label).width,60)+16,bx=align==='right'?x-w:align==='center'?x-w/2:x;
    ctx.fillStyle=act?'rgba(255,210,63,.28)':'rgba(11,10,28,.5)'; rr(ctx,bx,y-12,w,38,8); ctx.fill(); if(act){ ctx.strokeStyle='rgba(255,210,63,.9)'; ctx.lineWidth=1.5; ctx.stroke(); }
    txt(label,bx+8,y-1,p===me?'#ffd23f':'#fff',13,'left','900'); txt(sc+' 分　花 '+G.flowers[p].length,bx+8,y+15,'#cfe8d8',10);
    return bx+w;
  }
  function flowersRow(p,x,y){ G.flowers[p].forEach((id,i)=>drawTile(ctx,x+i*15,y,14,19,id)); }
  function meldTiles(p,m){ return m.t==='ankong'&&p!==me&&G.phase!=='end'?[-1,m.ids[1],m.ids[2],-1]:m.ids; }
  function discardsZone(p,pos){
    const ds=G.discards[p],tw=22,th=29,lastId=G.last&&G.last.p===p?G.last.id:-1;
    let x0,y0,cols;
    if(pos===0||pos===2){ cols=np===2?20:14; x0=W/2-cols*tw/2; y0=pos===0?300:92; }
    else { cols=5; x0=pos===3?132:W-132-cols*tw; y0=150; }
    ds.forEach((id,i)=>{ const r=Math.floor(i/cols),c=i%cols; drawTile(ctx,x0+c*tw,y0+r*(th+2),tw-1,th,id,{last:id===lastId&&i===ds.length-1}); });
  }
  function draw(){
    layout.hand=[]; layout.btn=[];
    ctx.drawImage(tableArt(L.felt),0,0,W,H);
    if(!G.hands.length) { txt('等待房主發牌…',W/2,H/2,'#fff',16,'center'); return; }
    // 中央：圈風、局數、剩餘張數
    const rw=HON[windOf()]; txt(rw+'風'+HON[np===2?[0,2][G.moves%np]:G.moves%np]+'局　'+LENNAME,W/2,214,'#ffe2a8',14,'center','900');
    txt('剩 '+Math.max(0,(G.wallN!=null&&client?G.wallN:G.wall.length)-RESERVE)+' 張'+(G.lian?'　連莊 '+G.lian:''),W/2,238,'#fff',13,'center');
    if(G.log) txt(G.log,W/2,264,'#cfe8d8',11,'center');
    // 輪到誰的指示
    { const pp=posOf(G.turn),ax=[W/2,W/2+86,W/2,W/2-86][pp],ay=[284,240,196,240][pp]; ctx.fillStyle='rgba(255,210,63,'+(.55+.4*Math.sin(t*5))+')'; ctx.beginPath(); ctx.arc(ax,ay,5,0,7); ctx.fill(); }
    for(let p=0;p<np;p++){ const pos=posOf(p); discardsZone(p,pos); if(p===me) continue;
      const n=G.hands[p].length,show=G.phase==='end';
      if(pos===2){ const tw=22,th=30,ms=G.melds[p],mw=ms.reduce((a,m)=>a+meldTiles(p,m).length*20+6,0),x0=W/2-(n*tw+mw)/2;
        for(let i=0;i<n;i++) drawTile(ctx,x0+i*tw,10,tw-1,th,show?sortIds(G.hands[p])[i]:-1);
        let mx=x0+n*tw+10; for(const m of ms){ meldTiles(p,m).forEach(id=>{ drawTile(ctx,mx,14,19,26,id); mx+=20; }); mx+=6; }
        const ex=info(p,W/2-60,58,'right'); flowersRow(p,W/2-50,46);
      } else {
        const left=pos===3,bx=left?14:W-14-28;
        for(let i=0;i<n;i++){ const id=show?sortIds(G.hands[p])[i]:-1; if(show) drawTile(ctx,bx,86+i*16,20,15,id); else { ctx.fillStyle='#1f7a4c'; rr(ctx,bx,86+i*15,28,14,3); ctx.fill(); ctx.fillStyle='#3fae74'; rr(ctx,bx+(left?0:4),86+i*15,24,12,3); ctx.fill(); } }
        G.melds[p].forEach((m,j)=>{ meldTiles(p,m).forEach((id,i)=>drawTile(ctx,left?50+i*19:W-50-19*4+i*19,86+j*30,18,25,id)); });
        info(p,left?14:W-14,48,left?'left':'right'); flowersRow(p,left?14:W-14-G.flowers[p].length*15,350);
      }
    }
    // 自己
    const myH=G.hands[me]||[],ms=G.melds[me]||[];
    let x=14; for(const m of ms){ meldTiles(me,m).forEach(id=>{ drawTile(ctx,x,448,27,37,id); x+=28; }); x+=8; }
    x+=6; const drawnShow=G.turn===me&&G.phase==='play'&&G.drawn>=0&&myH.includes(G.drawn);
    const list=sortIds(myH.filter(id=>!(drawnShow&&id===G.drawn))); if(drawnShow) list.push(G.drawn);
    const tw=Math.min(40,(W-x-20)/(list.length+.5));
    list.forEach((id,i)=>{ const gx=x+i*tw+(drawnShow&&i===list.length-1?10:0),up=id===sel?12:0; drawTile(ctx,gx,436-up,tw-2,52,id,{sel:id===sel}); layout.hand.push({id,x:gx,y:436-up,w:tw-2,h:52}); });
    const ix=info(me,14,404,'left'); flowersRow(me,ix+8,394);
    // 按鈕
    let bx=W-14; const btn=(label,fn,hot)=>{ bx-=70; button(bx,388,64,34,label,fn,hot); };
    if(G.phase==='play'&&G.turn===me&&myH.length%3===2){
      if(sel>=0&&myH.includes(sel)) btn('打出',()=>doAct({a:'discard',id:sel}),true);
      for(const k of kongKinds(me).slice(0,2)) if(G.wallN==null||client?(G.wallN>RESERVE):(G.wall.length>RESERVE)) btn('槓 '+kname(k),()=>doAct({a:'kong',k}));
      if(canWin(myH,ms)) btn('自摸',()=>doAct({a:'tsumo'}),true);
      if(sel<0) txt('點一張牌選起來，再點一次打出',W-14,370,'#ffe2a8',12,'right');
    }
    if(G.phase==='claim'&&G.claim&&G.claim.opts[me]&&G.claim.resp[me]==null){
      btn('過',()=>doAct({a:'claim',r:{c:'pass'}}));
      for(const o of G.claim.opts[me].slice().reverse()){ if(o.c==='chow') btn('吃 '+o.k.concat([kindOf(G.claim.id)]).sort((a,b)=>a-b).map(k=>NUMS[k%9]).join(''),()=>doAct({a:'claim',r:o}));
        else btn(o.c==='hu'?'胡':o.c==='pong'?'碰':'槓',()=>doAct({a:'claim',r:{c:o.c}}),o.c==='hu'); }
      txt('要 '+kname(kindOf(G.claim.id))+' 嗎？',W-14,370,'#ffe2a8',13,'right','900');
    }
    if(G.phase==='end'&&G.result) drawResult();
    if(msgT>0&&msg){ ctx.font='900 22px '+TC; const w=ctx.measureText(msg).width+40; ctx.fillStyle='rgba(11,10,28,.85)'; rr(ctx,W/2-w/2,150,w,40,10); ctx.fill(); txt(msg,W/2,171,'#ffd23f',22,'center','900'); }
  }
  function drawResult(){
    const r=G.result; ctx.fillStyle='rgba(8,6,20,.82)'; rr(ctx,130,70,540,330,16); ctx.fill(); ctx.strokeStyle='rgba(222,184,96,.7)'; ctx.lineWidth=1.5; ctx.stroke();
    if(r.draw){ txt('流局',W/2,120,'#ffd23f',30,'center','900'); txt('牌摸完了，沒有人胡牌，莊家連莊。',W/2,160,'#fff',14,'center'); }
    else {
      txt(r.self?names[r.w]+'　自摸！':names[r.w]+'　胡牌！',W/2,104,'#ffd23f',26,'center','900');
      if(!r.self) txt(names[r.from]+' 放槍',W/2,132,'#ffb0b0',13,'center');
      let x=150; for(const m of G.melds[r.w]){ m.ids.forEach(id=>{ drawTile(ctx,x,148,22,30,id); x+=23; }); x+=6; }
      x+=6; sortIds(G.hands[r.w].filter(id=>id!==r.win)).forEach(id=>{ drawTile(ctx,x,148,22,30,id); x+=23; }); drawTile(ctx,x+8,148,22,30,r.win,{sel:true});
      const items=(r.items.length?r.items:[['無台（底分）',0]]).concat((r.dItems||[]).map(x=>[x[0]+(r.dealerWin?'':'（莊家付）'),x[1]]));
      items.forEach((it,i)=>{ const cx=170+(i%3)*170,cy=200+Math.floor(i/3)*22; txt(it[0]+'　'+it[1]+' 台',cx,cy,'#fff',13); });
      txt(r.dealerWin||!r.dItems||!r.dItems.length?'共 '+(r.tai+(r.dealerWin?r.dt:0))+' 台　'+(r.self?'每家':'放槍的人')+'付 '+(3+r.tai+(r.dealerWin?r.dt:0))+' 分':'共 '+r.tai+' 台（莊家另加 '+r.dt+' 台）',W/2,200+Math.ceil(items.length/3)*22+8,'#ffd23f',15,'center','900');
    }
    names.forEach((n,i)=>{ const d=r.delta[i]; txt(n+'　'+(d>0?'+':'')+d+'　（'+(G.scores[i]>0?'+':'')+G.scores[i]+'）',170+(i%2)*260,318+Math.floor(i/2)*22,d>0?'#86dc4f':d<0?'#ff8a8a':'#cfe8d8',13); });
    if(!client) button(W/2-60,356,120,34,!(r.draw||r.w===G.dealer)&&G.moves+1>=TARGET?'看總成績':'下一局',()=>doAct({a:'next'}),true);
    else txt('等房主開下一局…',W/2,372,'#cfe8d8',13,'center');
  }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',onDown); },_dbg:{G,shanten,aiDiscard,canWin,decomps,cnt,tally,discard,respond,tsumo,selfKong,nextHand,aiPlay,kindOf,get me(){return me;}}};
}

/* ---- 示意圖：一手好牌，最後一張摸進來自摸 ---- */
function thumb(ctx,w,h,t){
  ctx.save(); ctx.scale(w/W,w/W); ctx.translate(0,-60);
  ctx.drawImage(tableArt('#1d5e45'),0,0,W,H);
  const T=3,u=(t%T)/T,id=k=>k*4;
  const hand=[0,1,2,3,4,5,9,10,11,18,18,18,31,31,31,6].map(id);
  hand.forEach((x,i)=>drawTile(ctx,70+i*40,380,38,52,x));
  for(let i=0;i<14;i++) drawTile(ctx,250+i*22,150,21,28,-1);
  [27,13,22,8,30,15].forEach((k,i)=>drawTile(ctx,260+i*23,300,22,29,id(k)));
  const k=u<.4?0:Math.min(1,(u-.4)/.2),dx=70+16*40+14,dy=380-60*(1-k);
  if(u>.25) drawTile(ctx,dx,dy,38,52,id(6)+1,{sel:true});
  if(u>.62){ const a=Math.min(1,(u-.62)*8),sc=1+Math.max(0,.1-(u-.62))*6; ctx.globalAlpha=a; ctx.save(); ctx.translate(W/2,250); ctx.scale(sc,sc); ctx.rotate(-.08);
    ctx.fillStyle='#c62828'; rr(ctx,-110,-50,220,100,18); ctx.fill(); ctx.strokeStyle='#ffd23f'; ctx.lineWidth=5; ctx.stroke();
    ctx.font='900 64px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#ffd23f'; ctx.fillText('自摸！',0,4); ctx.restore(); ctx.globalAlpha=1; }
  ctx.restore();
}
function preview(ctx,w,h,L,t){
  ctx.save(); ctx.scale(w/W,w/W); ctx.translate(0,-80); ctx.drawImage(tableArt(L.felt),0,0,W,H);
  [0,9,18,27,31,32,33,34].forEach((k,i)=>drawTile(ctx,150+i*64,250+Math.sin(t*2+i)*4,56,76,k===34?136:k*4));
  ctx.restore();
}

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).mahjong={
  name:'十六張麻將',tag:'MAHJONG 16',color:'#e8524a',online:true,maxPlayers:4,bots:true,minPlayers:2,netVariants:false,
  desc:'台灣十六張麻將：吃、碰、槓、補花、自摸、放槍、算台。可選四人麻將或雙人麻將，也可開房間 2～4 人連線，房主可以加電腦。',
  goal:'每人 16 張，湊成 5 組（順子或刻子）加 1 對就胡牌。輪到你時先摸一張，再點兩下打出一張；別人打出的牌可以碰、槓、胡，上家打的還可以吃。牌牆剩 16 張時流局，莊家胡牌或流局連莊。',
  variants:[{id:'4',label:'四人麻將'},{id:'2',label:'雙人麻將'}],
  options:[{key:'len',label:'打多久',def:'c',opts:[{id:'q',label:'1/4 圈'},{id:'c',label:'1 圈'},{id:'j',label:'1 將'}]}],
  help:[['點牌','選起來（往上浮），再點一次打出'],['打出','打出選起來的牌'],['吃 碰 槓 胡','別人打牌時跳出來的按鈕，不要就按「過」'],['自摸／槓','輪到自己時出現']],
  touchHelp:[['點牌','選起來，再點一次打出'],['吃 碰 槓 胡','別人打牌時出現的按鈕，不要就按「過」'],['自摸／槓','輪到自己時出現']],
  touch:null,
  looks:[{key:'felt',label:'桌布顏色',type:'color',opts:['#1d5e45','#1f4f7a','#6b1f3a','#3a2d57','#5a4630','#2b2b33']}],
  best:{label:'最高得分',fmt:v=>'+'+v+' 分',lower:false},
  preview,thumb,create,_canWin:canWin,_decomps:decomps
};
})();
