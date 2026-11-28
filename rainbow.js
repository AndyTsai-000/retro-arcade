// 彩虹出光光：牌桌派對第 12 種，玩法照 UNO 正式規則（換色出牌，先出完手牌的人贏）。
// 108 張：紅黃綠藍各 0 一張、1～9／禁止／迴轉／+2 各兩張，變色、+4 各四張。每人 7 張，翻一張開始。
// 出同顏色、同數字或同符號的牌；沒得出就抽一張，抽到能出的可以馬上出。+4 只能在手上沒有目前顏色時出，下一家可以質疑。
// 剩一張要喊 UNO，被抓到沒喊罰抽 2 張。先出完的人贏（也可以選正式的先到 500 分：拿走其他人手上的點數）。
// 單機是你和電腦同桌；連線時房主負責發牌與判定，其他人送出動作。牌桌派對的 create 選到第 12 種時會轉到這裡。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2;
const COL=['#e8433a','#f5b62a','#35a852','#2f7fe0'],DARK=['#9a1f1a','#a0700a','#1d6a32','#174c96'],CN=['紅','黃','綠','藍'];
const cc=id=>id>>4,cv=id=>id&15; // 顏色 0～3（4＝萬用牌）；點數 0～9、10 禁止、11 迴轉、12 +2、13 變色、14 +4
const PTS=v=>v<10?v:v<13?20:50;
const VN=v=>v<10?String(v):['禁止','迴轉','+2','變色','+4'][v-10];
const cardName=id=>cv(id)>=13?VN(cv(id)):CN[cc(id)]+VN(cv(id));
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const shuffle=a=>{ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
function newDeck(){ const d=[]; for(let c=0;c<4;c++){ d.push(c*16); for(let v=1;v<=12;v++) d.push(c*16+v,c*16+v); } for(let k=0;k<4;k++) d.push(64+13,64+14); return shuffle(d); }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const sortKey=id=>cc(id)*16+cv(id);
/* ---------- 牌面：自己的樣式（圓角卡、白色圓章、四色風車） ---------- */
function pinwheel(c,x,y,r){ for(let k=0;k<4;k++){ c.fillStyle=COL[k]; c.beginPath(); c.moveTo(x,y); c.arc(x,y,r,-Math.PI/2+k*Math.PI/2,k*Math.PI/2); c.closePath(); c.fill(); } c.strokeStyle='#fff'; c.lineWidth=Math.max(1,r*.12); c.beginPath(); c.arc(x,y,r,0,TAU); c.stroke(); }
function symbol(c,v,x,y,s,col){ c.fillStyle=col; c.strokeStyle=col; c.textAlign='center'; c.textBaseline='middle';
  if(v<10){ c.font='900 '+Math.round(s)+'px '+TC; c.fillText(v,x,y+s*.04); if(v===6||v===9){ c.fillRect(x-s*.22,y+s*.4,s*.44,s*.07); } }
  else if(v===10){ c.lineWidth=s*.13; c.beginPath(); c.arc(x,y,s*.36,0,TAU); c.stroke(); c.beginPath(); c.moveTo(x-s*.25,y+s*.25); c.lineTo(x+s*.25,y-s*.25); c.stroke(); }
  else if(v===11){ c.lineWidth=s*.12; c.lineCap='round'; for(const d of [1,-1]){ c.beginPath(); c.arc(x,y,s*.3,d>0?Math.PI*1.1:Math.PI*.1,d>0?Math.PI*1.9:Math.PI*.9); c.stroke(); const a=d>0?Math.PI*1.9:Math.PI*.9,ex=x+Math.cos(a)*s*.3,ey=y+Math.sin(a)*s*.3; c.beginPath(); c.moveTo(ex+s*.16*d,ey-s*.02*d); c.lineTo(ex-s*.04*d,ey+s*.16*d); c.lineTo(ex-s*.1*d,ey-s*.12*d); c.closePath(); c.fill(); } c.lineCap='butt'; }
  else if(v===12||v===14){ c.font='900 '+Math.round(s*.78)+'px '+TC; c.fillText(v===12?'+2':'+4',x,y+s*.04); }
  else if(v===13){ c.font='900 '+Math.round(s*.4)+'px '+TC; c.fillText('變色',x,y); } }
function drawUno(c,x,y,w,h,id,up,o){ o=o||{}; c.save(); if(o.dim) c.globalAlpha=.5;
  c.fillStyle='rgba(0,0,0,.32)'; rr(c,x+2,y+3,w,h,w*.14); c.fill();
  c.fillStyle='#fff'; rr(c,x,y,w,h,w*.14); c.fill();
  const ix=x+w*.07,iy=y+w*.07,iw=w*.86,ih=h-w*.14;
  if(!up){ const g=c.createLinearGradient(ix,iy,ix+iw,iy+ih); g.addColorStop(0,'#2a1c48'); g.addColorStop(1,'#120c24'); c.fillStyle=g; rr(c,ix,iy,iw,ih,w*.1); c.fill();
    c.save(); c.translate(x+w/2,y+h/2); c.rotate(-.5); for(let k=0;k<4;k++){ c.strokeStyle=COL[k]; c.lineWidth=w*.07; c.beginPath(); c.ellipse(0,0,w*(.36-k*.07),h*(.3-k*.055),0,0,TAU); c.stroke(); } c.restore();
    c.fillStyle='#fff'; c.font='900 '+Math.round(w*.2)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('彩虹',x+w/2,y+h/2); c.restore(); return; }
  const k=cc(id),v=cv(id),wild=k===4,base=wild?'#1c1a26':COL[k];
  const g=c.createLinearGradient(ix,iy,ix,iy+ih); g.addColorStop(0,wild?'#2c2838':COL[k]); g.addColorStop(1,wild?'#101018':DARK[k]); c.fillStyle=g; rr(c,ix,iy,iw,ih,w*.1); c.fill();
  /* 斜光澤 */ c.save(); rr(c,ix,iy,iw,ih,w*.1); c.clip(); c.fillStyle='rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(ix,iy); c.lineTo(ix+iw*.7,iy); c.lineTo(ix,iy+ih*.45); c.fill(); c.restore();
  const cx=x+w/2,cy=y+h/2,R=w*.33;
  if(wild){ pinwheel(c,cx,cy,R); if(v===14){ c.fillStyle='rgba(0,0,0,.55)'; c.beginPath(); c.arc(cx,cy,R*.62,0,TAU); c.fill(); symbol(c,14,cx,cy,w*.36,'#fff'); } }
  else { c.fillStyle='#fff'; c.beginPath(); c.arc(cx,cy,R,0,TAU); c.fill(); c.strokeStyle=DARK[k]; c.lineWidth=Math.max(1,w*.025); c.stroke(); symbol(c,v,cx,cy,v<10?w*.5:w*.44,base); }
  /* 角落小字 */ const cs=w*.2; if(v===13){ pinwheel(c,ix+cs*.75,iy+cs*.75,cs*.45); pinwheel(c,ix+iw-cs*.75,iy+ih-cs*.75,cs*.45); }
  else { c.save(); c.shadowColor='rgba(0,0,0,.35)'; c.shadowBlur=2; symbol(c,v,ix+cs*.75,iy+cs*.8,cs*(v<10?1:.95),'#fff'); c.translate(ix+iw-cs*.75,iy+ih-cs*.8); c.rotate(Math.PI); symbol(c,v,0,0,cs*(v<10?1:.95),'#fff'); c.restore(); }
  if(o.hl){ c.strokeStyle='#ffe066'; c.lineWidth=3; rr(c,x-1,y-1,w+2,h+2,w*.15); c.stroke(); }
  c.restore(); }

function create(env,opts){
  const K=window.__pokerKit||{},net=opts.net,client=!!net&&!net.host,host=!client,me=net?net.me:0,OP=opts.options||{},pv=!!opts.preview;
  const humans=pv?0:net?net.count:1,np=net?clamp(net.count+(net.bots||0),2,6):clamp(+OP.unoseats||4,2,6),target=OP.unogoal==='500'?500:0;
  const spd=['slow','normal','fast'].indexOf(OP.speed||'normal'),AID=[2.6,1.8,1.1][spd<0?1:spd];
  const {ctx:c,canvas}=env.canvas2d(W,H),L=K.themed?K.themed(opts.look,'uno'):{bg:'night',felt:'#3a2d57'};
  const names=[]; for(let i=0;i<np;i++) names.push(i<humans?(net?(net.names&&net.names[i])||'玩家'+(i+1):(opts.name||'你')):'電腦 '+(i-humans+1));
  const bot=[]; for(let i=0;i<np;i++) bot.push(i>=humans);
  const sfx=k=>{ if(!pv) env.sfx(k); };
  let G={n:np,hands:[],draw:[],dn:0,disc:[],col:0,dir:1,cur:0,dealer:Math.floor(Math.random()*np),ph:'deal',PT:pv?.6:1.4,drawn:-1,uno:Array(np).fill(false),said:Array(np).fill(0),risk:-1,riskT:0,ch:null,wd4:null,startWild:false,score:Array(np).fill(0),round:0,log:'',last:null,rw:null,over:false,seq:0,pen:null};
  let t=0,ended=false,sendT=0,dirty=true,btns=[],hoverB=-1,catchBot=null,fly=null,seenSeq=-1,seenPen=null,seenFk='',fx=[];
  const nx=(i,k)=>((i+G.dir*(k==null?1:k))%np+np)%np;
  const top=()=>G.disc[G.disc.length-1];
  const canPlay=id=>{ const v=cv(id); if(v>=13) return true; return cc(id)===G.col||v===cv(top()); };
  const nm=i=>i===me&&!pv&&!bot[i]?'你':names[i];
  const lg=i=>net?names[i]:nm(i); /* 出牌紀錄：連線時由房主寫，用真名 */
  /* ---------- 房主流程 ---------- */
  function drawN(p,k){ let got=0; for(let j=0;j<k;j++){ if(!G.draw.length){ const tp=G.disc.pop(); G.draw=shuffle(G.disc.slice()); G.disc=[tp]; } if(!G.draw.length) break; G.hands[p].push(G.draw.pop()); got++; } if(G.hands[p].length>1) G.uno[p]=false; G.pen={p,k:got,s:G.seq+1}; return got; }
  function setTurn(i){ G.cur=i; G.ph='turn'; G.PT=bot[i]?AID:.3; G.drawn=-1; G.seq++; dirty=true; }
  function endRisk(by){ if(G.risk>=0&&by!==G.risk){ G.risk=-1; catchBot=null; } }
  function startRound(){ G.round++; G.draw=newDeck(); G.disc=[]; G.hands=Array(np).fill(0).map(()=>[]); G.uno=Array(np).fill(false); G.risk=-1; G.dir=1; G.ch=null; G.wd4=null; G.drawn=-1; G.rw=null; G.pen=null; catchBot=null;
    for(let k=0;k<7;k++) for(let i=0;i<np;i++) G.hands[(G.dealer+1+i)%np].push(G.draw.pop());
    let tp=G.draw.pop(); while(cv(tp)===14){ G.draw.unshift(tp); shuffle(G.draw); tp=G.draw.pop(); } /* 翻到 +4 放回去重洗 */
    G.disc=[tp]; G.col=cc(tp); const v=cv(tp); let first=nx(G.dealer,1); G.last={p:-1,id:tp};
    G.log=lg(G.dealer)+' 發牌，翻開「'+cardName(tp)+'」';
    if(v===10){ G.log+='：'+lg(first)+' 被跳過'; first=nx(first,1); }
    else if(v===11){ G.dir=-1; first=G.dealer; G.log+='：方向反過來，'+lg(G.dealer)+' 先出'; }
    else if(v===12){ drawN(first,2); G.log+='：'+lg(first)+' 抽 2 張、跳過'; first=nx(first,1); }
    G.cur=first; G.seq++;
    if(v===13){ G.col=-1; G.ph='color'; G.startWild=true; G.PT=bot[first]?AID:.3; G.log+='：'+lg(first)+' 先指定顏色'; }
    else { G.ph='turn'; G.PT=bot[first]?AID+.8:.6; }
    dirty=true; }
  function play(p,id){ const h=G.hands[p],k=h.indexOf(id); if(k<0||!canPlay(id)) return false;
    const prevCol=G.col,guilty=h.some(x=>x!==id&&cc(x)===prevCol);
    endRisk(p); h.splice(k,1); G.disc.push(id); G.drawn=-1; G.last={p,id}; G.seq++; dirty=true;
    if(h.length===1&&!G.uno[p]){ G.risk=p; G.riskT=3.2; const cat=[]; for(let i=0;i<np;i++) if(i!==p&&bot[i]) cat.push(i); catchBot=cat.length&&Math.random()<.6?{who:cat[Math.floor(Math.random()*cat.length)],t:.7+Math.random()*1.6}:null; }
    const v=cv(id); G.log=lg(p)+' 出「'+cardName(id)+'」';
    if(v>=13){ G.col=-1; G.ph='color'; G.cur=p; G.wd4=v===14?{by:p,guilty}:null; G.PT=bot[p]?AID*.7:0; return true; }
    G.col=cc(id); after(p,v); return true; }
  function after(p,v){ const out=!G.hands[p].length;
    if(v===10){ const s=nx(p,1); G.log+='，'+lg(s)+' 被跳過'; if(out) return endRound(p); setTurn(nx(p,2)); return; }
    if(v===11){ if(np===2){ G.log+='，兩個人時等於禁止，再出一次'; if(out) return endRound(p); setTurn(p); return; } G.dir*=-1; G.log+='，方向反過來'; if(out) return endRound(p); setTurn(nx(p,1)); return; }
    if(v===12){ const s=nx(p,1); drawN(s,2); G.log+='，'+lg(s)+' 抽 2 張、跳過'; if(out) return endRound(p); setTurn(nx(p,2)); return; }
    if(out) return endRound(p); setTurn(nx(p,1)); }
  function chooseColor(p,col){ if(G.ph!=='color'||G.cur!==p||!(col>=0&&col<4)) return; G.col=col; G.seq++; dirty=true; G.log=lg(p)+' 指定「'+CN[col]+'色」';
    if(G.startWild){ G.startWild=false; setTurn(p); return; }
    const out=!G.hands[p].length;
    if(G.wd4){ const s=nx(p,1); if(out){ drawN(s,4); G.log+='，'+lg(s)+' 抽 4 張'; G.wd4=null; return endRound(p); }
      G.ch={by:p,victim:s,guilty:G.wd4.guilty}; G.wd4=null; G.cur=s; G.ph='challenge'; G.PT=bot[s]?AID:.3; return; }
    if(out) return endRound(p); setTurn(nx(p,1)); }
  function challenge(p,yes){ if(G.ph!=='challenge'||G.cur!==p||!G.ch) return; const C=G.ch; G.ch=null; G.seq++; dirty=true;
    if(!yes){ drawN(p,4); G.log=lg(p)+' 抽 4 張、跳過'; setTurn(nx(p,1)); return; }
    if(C.guilty){ drawN(C.by,4); G.log='質疑成功！'+lg(C.by)+' 手上還有可以出的顏色，罰抽 4 張'; setTurn(p); sfxAll('bump'); }
    else { drawN(p,6); G.log='質疑失敗！'+lg(C.by)+' 真的沒得出，'+lg(p)+' 罰抽 6 張'; setTurn(nx(p,1)); } }
  function sfxAll(){ }
  function endRound(w){ let pts=0; for(let i=0;i<np;i++) if(i!==w) for(const id of G.hands[i]) pts+=PTS(cv(id)); G.score[w]+=pts; G.risk=-1; catchBot=null;
    G.rw={w,pts,hand:G.hands.map(h=>h.reduce((a,id)=>a+PTS(cv(id)),0))}; G.ph='roundEnd'; G.PT=target?5.5:4; G.over=!target||G.score[w]>=target; G.seq++; dirty=true; }
  function doAct(from,a){ if(!a||ended||G.over&&G.ph!=='roundEnd') return; const p=from;
    if(a.k==='uno'){ const h=G.hands[p]; if(!h) return; if(h.length===2&&G.cur===p&&(G.ph==='turn'||G.ph==='drawn')||h.length===1&&G.risk===p){ G.uno[p]=true; G.said[p]=t; if(G.risk===p){ G.risk=-1; catchBot=null; } dirty=true; } return; }
    if(a.k==='catch'){ if(G.risk>=0&&G.risk!==p){ const r=G.risk; G.risk=-1; catchBot=null; drawN(r,2); G.log=lg(p)+' 抓到 '+lg(r)+' 沒喊 UNO！罰抽 2 張'; G.seq++; dirty=true; } return; }
    if(G.cur!==p||G.PT>0&&bot[p]) return;
    if(a.k==='play'&&(G.ph==='turn'||G.ph==='drawn'&&a.id===G.drawn)){ play(p,a.id); return; }
    if(a.k==='draw'&&G.ph==='turn'){ endRisk(p); drawN(p,1); const id=G.hands[p][G.hands[p].length-1]; G.seq++; dirty=true;
      if(id!=null&&canPlay(id)){ G.ph='drawn'; G.drawn=id; G.log=lg(p)+' 抽了一張'+(bot[p]?'':'，這張可以出'); G.PT=bot[p]?AID*.6:0; } else { G.log=lg(p)+' 抽了一張，沒得出'; setTurn(nx(p,1)); G.PT=Math.max(G.PT,bot[G.cur]?AID:.6); } return; }
    if(a.k==='keep'&&G.ph==='drawn'){ G.log=lg(p)+' 把抽到的牌留著'; setTurn(nx(p,1)); return; }
    if(a.k==='color'){ chooseColor(p,a.c|0); return; }
    if(a.k==='chal'){ challenge(p,!!a.y); return; } }
  /* ---------- 電腦 ---------- */
  function botPick(p){ const h=G.hands[p],ok=h.filter(canPlay); if(!ok.length) return null;
    const legal=ok.filter(id=>cv(id)!==14||!h.some(x=>cc(x)===G.col)); const pool=legal.length?legal:ok;
    const nxt=nx(p,1),danger=G.hands[nxt].length<=2,cnt=[0,0,0,0]; h.forEach(id=>{ if(cc(id)<4) cnt[cc(id)]++; });
    let best=null,bs=-1e9; for(const id of pool){ const v=cv(id); let s=0;
      if(v>=13) s=danger?40:-30+(h.length<=2?60:0); else { s=cnt[cc(id)]*4+(v<10?v*.3:0); if(v>=10&&v<=12) s+=danger?30:6; if(cc(id)===G.col) s+=2; }
      s+=Math.random()*3; if(s>bs){ bs=s; best=id; } } return best; }
  function botColor(p){ const cnt=[0,0,0,0]; G.hands[p].forEach(id=>{ if(cc(id)<4) cnt[cc(id)]+=1+(cv(id)>=10?.5:0); }); let b=Math.floor(Math.random()*4); for(let k=0;k<4;k++) if(cnt[k]>cnt[b]) b=k; return b; }
  function botStep(){ const p=G.cur; if(!bot[p]||G.PT>0) return;
    if(G.ph==='turn'){ const id=botPick(p); if(id==null){ doAct(p,{k:'draw'}); return; } if(G.hands[p].length===2&&Math.random()<.88) doAct(p,{k:'uno'}); doAct(p,{k:'play',id}); }
    else if(G.ph==='drawn'){ if(G.hands[p].length===2&&Math.random()<.88) doAct(p,{k:'uno'}); doAct(p,{k:'play',id:G.drawn}); }
    else if(G.ph==='color') doAct(p,{k:'color',c:botColor(p)});
    else if(G.ph==='challenge'){ const by=G.ch.by,many=G.hands[by].length>=4; doAct(p,{k:'chal',y:Math.random()<(many?.38:.18)}); } }
  function hostStep(dt){ G.PT-=dt;
    if(G.ph==='deal'){ if(G.PT<=0) startRound(); }
    else if(G.ph==='roundEnd'){ if(G.PT<=0){ if(G.over){ if(!ended){ ended=true; dirty=true; send(1); finish(); } return; } G.dealer=(G.dealer+1)%np; startRound(); } }
    else botStep();
    if(G.risk>=0){ G.riskT-=dt; if(catchBot){ catchBot.t-=dt; if(catchBot.t<=0){ const w=catchBot.who; catchBot=null; doAct(w,{k:'catch'}); } } if(G.riskT<=0&&G.risk>=0){ G.risk=-1; catchBot=null; dirty=true; } }
    if(net){ sendT-=dt; if(dirty||sendT<=0) send(0); } dirty=false; }
  function send(end){ if(!net) return; sendT=1; const S=Object.assign({},G,{draw:null,dn:G.draw.length}); net.send(end?{G:S,end:1}:{G:S}); }
  if(net){ if(client) net.onmsg=m=>{ if(m.G){ G=m.G; } if(m.end&&!ended){ ended=true; finish(); } };
    else { net.onmsg=(m,from)=>{ if(m.a) doAct(from,m.a); }; net.onleave=i=>{ if(i>0&&i<np&&!bot[i]){ bot[i]=true; names[i]+='（電腦代打）'; dirty=true; } }; } }
  const act=a=>{ if(pv) return; if(client) net.send({a}); else doAct(me,a); };
  /* ---------- 結算 ---------- */
  function finish(){ if(pv){ env.end({}); return; } const rw=G.rw||{w:0,hand:[]};
    const order=[...Array(np).keys()].sort((a,b)=>target?(G.score[b]-G.score[a]):(a===rw.w?-1:b===rw.w?1:rw.hand[a]-rw.hand[b]));
    const win=order[0],iWin=win===me&&!bot[me]; let html='<table class="ls"><tr><th>名次</th><th>玩家</th><th>'+(target?'總分':'手上剩的點數')+'</th></tr>'+order.map((i,k)=>'<tr><td>'+(k+1)+'</td><td>'+nm(i)+'</td><td>'+(target?G.score[i]:i===rw.w?'出光光！':rw.hand[i])+'</td></tr>').join('')+'</table>';
    if(!net&&K.partyLog) html+=K.partyLog('poker','彩虹出光光',K.GAMES||['彩虹出光光'],iWin?'w':'l');
    env.sfx(iWin?'win':'lose'); env.end({title:iWin?'你贏了！':nm(win)+' 贏了！',big:'彩虹出光光',html,text:target?'先到 '+target+' 分的人贏（打了 '+G.round+' 局）':'先把手牌出光光的人贏',score:target&&!net?G.score[me]:null,next:false}); }
  /* ---------- 版面 ---------- */
  const CW=62,CHh=92,PX=338,DX=462,MY=196;
  function seatXY(i){ const k=((i-me)%np+np)%np; if(k===0) return [W/2,440]; const m=np-1,a=Math.PI+Math.PI*k/(m+1); return [W/2+Math.cos(a)*330,212+Math.sin(a)*168]; }
  function handLayout(){ const h=(G.hands[me]||[]).slice().sort((a,b)=>sortKey(a)-sortKey(b)),n=h.length,step=n>1?Math.min(CW+6,(700-CW)/(n-1)):0,x0=W/2-((n-1)*step+CW)/2; return h.map((id,k)=>({id,x:x0+k*step,y:396})); }
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const inR=(x,y,b)=>x>=b.x&&y>=b.y&&x<=b.x+b.w&&y<=b.y+b.h;
  const myTurn=()=>!pv&&!bot[me]&&G.cur===me&&!G.over;
  const pd=e=>{ if(pv) return; const [x,y]=toG(e); for(let k=btns.length-1;k>=0;k--) if(inR(x,y,btns[k])){ btns[k].fn(); return; } };
  const pm=e=>{ if(pv) return; const [x,y]=toG(e); hoverB=-1; for(let k=btns.length-1;k>=0;k--) if(inR(x,y,btns[k])){ hoverB=k; break; } canvas.style.cursor=hoverB>=0?'pointer':''; };
  canvas.addEventListener('pointerdown',pd); canvas.addEventListener('pointermove',pm);
  function hit(x,y,w,h,fn){ btns.push({x,y,w,h,fn:()=>{ sfx('click'); fn(); }}); }
  function btn(x,y,w,h,tx,col,fn,fg){ const k=btns.length,hv=hoverB===k; hit(x,y,w,h,fn); c.save(); c.shadowColor='rgba(0,0,0,.45)'; c.shadowBlur=10; c.shadowOffsetY=4; c.fillStyle=col; rr(c,x,y-(hv?2:0),w,h,h/2.6); c.fill(); c.restore();
    c.fillStyle='rgba(255,255,255,.25)'; rr(c,x+4,y+3-(hv?2:0),w-8,h*.38,h/3.5); c.fill(); c.fillStyle=fg||'#1a1430'; c.font='900 '+(h>40?17:15)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(tx,x+w/2,y+h/2-(hv?2:0)); }
  /* ---------- 更新 ---------- */
  function update(dt){ if(ended&&!pv) return; dt=Math.min(dt,.05); t+=dt; if(host) hostStep(dt); else G.PT-=dt;
    if(!pv&&!bot[me]){ if(env.hit('KeyU')) act({k:'uno'}); if(myTurn()&&G.ph==='turn'&&env.hit('Space')) act({k:'draw'}); }
    if(G.seq!==seenSeq){ const fk=G.disc.length+':'+top(); if(G.last&&G.disc.length&&top()===G.last.id&&G.last.p>=0&&fk!==seenFk){ const [sx,sy]=G.last.p===me&&!pv?[W/2,420]:seatXY(G.last.p); fly={id:G.last.id,sx,sy,u:0}; if(seenSeq>=0) sfx(cv(G.last.id)>=13?'item':'click'); } seenFk=fk;
      if(G.ph==='roundEnd'&&seenSeq>=0){ sfx(G.rw&&G.rw.w===me?'win':'beep'); for(let k=0;k<60;k++) fx.push({x:W/2,y:220,vx:(Math.random()-.5)*520,vy:-200-Math.random()*260,l:1.8,c:COL[k%4],r:0,vr:(Math.random()-.5)*12}); }
      seenSeq=G.seq; }
    if(G.pen&&(!seenPen||seenPen.s!==G.pen.s||seenPen.p!==G.pen.p)){ if(seenPen&&G.pen.k>=2) sfx('bump'); seenPen=G.pen; }
    if(fly){ fly.u+=dt*3.2; if(fly.u>=1) fly=null; }
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=420*dt; f.r+=f.vr*dt; if(f.l<=0) fx.splice(i,1); } }
  function draw(){ btns=[]; if(K.drawTable) K.drawTable(c,W,H,L,t); else { c.fillStyle='#1d1240'; c.fillRect(0,0,W,H); }
    if(G.ph==='deal'||!G.hands.length){ drawUno(c,PX-CW/2,MY-CHh/2,CW,CHh,0,false); c.fillStyle='#fff'; c.font='900 22px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('洗牌、發牌中…',W/2,320); return; }
    /* 方向箭頭 */ c.save(); c.translate(W/2,MY+4); c.strokeStyle='rgba(255,255,255,.22)'; c.fillStyle='rgba(255,255,255,.22)'; c.lineWidth=5; const rot=t*.5*G.dir;
    for(let k=0;k<3;k++){ const a0=rot+k*TAU/3,a1=a0+1.3*G.dir; c.beginPath(); c.ellipse(0,0,150,86,0,Math.min(a0,a1),Math.max(a0,a1)); c.stroke(); const ex=Math.cos(a1)*150,ey=Math.sin(a1)*86,tx=-Math.sin(a1)*150*G.dir,ty=Math.cos(a1)*86*G.dir,l=Math.hypot(tx,ty); c.beginPath(); c.moveTo(ex+tx/l*12,ey+ty/l*12); c.lineTo(ex-ty/l*9,ey+tx/l*9); c.lineTo(ex+ty/l*9,ey-tx/l*9); c.fill(); } c.restore();
    /* 牌堆 */ const dn=host?G.draw.length:G.dn; for(let k=Math.min(4,Math.ceil(dn/15));k>=0;k--) drawUno(c,PX-CW/2-k*1.5,MY-CHh/2-k*1.5,CW,CHh,0,false);
    c.fillStyle='#fff'; c.font='700 12px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('牌堆 '+dn+' 張',PX,MY+CHh/2+14);
    if(myTurn()&&G.ph==='turn'){ hit(PX-CW/2-6,MY-CHh/2-6,CW+12,CHh+12,()=>act({k:'draw'})); c.strokeStyle='rgba(255,224,102,'+(.5+.4*Math.sin(t*6))+')'; c.lineWidth=3; rr(c,PX-CW/2-6,MY-CHh/2-6,CW+12,CHh+12,10); c.stroke(); }
    /* 棄牌堆與目前顏色 */ if(G.col>=0){ c.save(); c.shadowColor=COL[G.col]; c.shadowBlur=26; c.strokeStyle=COL[G.col]; c.lineWidth=5; rr(c,DX-CW/2-7,MY-CHh/2-7,CW+14,CHh+14,12); c.stroke(); c.restore(); }
    const d=G.disc; if(d.length>1){ c.save(); c.translate(DX,MY); c.rotate(-.12); drawUno(c,-CW/2,-CHh/2,CW,CHh,d[d.length-2],true); c.restore(); }
    if(d.length){ let x=DX,y=MY,s=1; if(fly&&fly.id===top()){ const u=1-Math.pow(1-fly.u,3); x=fly.sx+(DX-fly.sx)*u; y=fly.sy+(MY-fly.sy)*u-Math.sin(u*Math.PI)*40; s=.8+.2*u; } c.save(); c.translate(x,y); c.rotate(.06); c.scale(s,s); drawUno(c,-CW/2,-CHh/2,CW,CHh,top(),true); c.restore(); }
    c.fillStyle='rgba(10,6,24,.75)'; rr(c,DX+CW/2+14,MY-16,86,32,12); c.fill(); c.font='900 14px '+TC; c.textAlign='center'; c.fillStyle=G.col>=0?COL[G.col]:'#fff'; c.fillText(G.col>=0?'● '+CN[G.col]+'色':'選顏色中',DX+CW/2+57,MY);
    /* 其他玩家 */ for(let i=0;i<np;i++){ if(i===me&&!pv) continue; const [x,y]=seatXY(i),n=G.hands[i].length,cur=G.cur===i&&G.ph!=='roundEnd';
      const fan=Math.min(n,10),cw=30,ch=44; for(let k=0;k<fan;k++){ c.save(); c.translate(x+(k-(fan-1)/2)*8,y-6); c.rotate((k-(fan-1)/2)*.08); drawUno(c,-cw/2,-ch/2,cw,ch,0,false); c.restore(); }
      c.fillStyle=cur?'#ffd23f':'rgba(10,6,24,.8)'; rr(c,x-58,y+20,116,24,12); c.fill(); c.fillStyle=cur?'#1a1430':'#fff'; c.font='900 13px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(names[i].slice(0,7)+'　'+n+' 張',x,y+32);
      if(target){ c.fillStyle='rgba(255,255,255,.8)'; c.font='700 11px '+TC; c.fillText(G.score[i]+' 分',x,y+54); }
      if(n===1&&G.uno[i]||t-G.said[i]<1.5&&G.said[i]>0) bubble(x+40,y-34,'UNO！');
      if(G.risk===i) { c.fillStyle='#ff6a7a'; c.font='900 12px '+TC; c.fillText('沒喊 UNO！',x,y-38); } }
    /* 自己 */ if(!pv){ const lay=handLayout(),my=myTurn(),ph=G.ph; let hv=-1; const [mx,myy]=[hoverPos[0],hoverPos[1]];
      for(let k=lay.length-1;k>=0;k--){ const q=lay[k]; if(mx>=q.x&&mx<=q.x+(k===lay.length-1?CW:Math.min(CW,lay[k+1].x-q.x))&&myy>=q.y-20&&myy<=q.y+CHh){ hv=k; break; } }
      lay.forEach((q,k)=>{ const ok=my&&(ph==='turn'&&canPlay(q.id)||ph==='drawn'&&q.id===G.drawn),lift=ok?(k===hv?24:10):0; drawUno(c,q.x,q.y-lift,CW,CHh,q.id,true,{dim:my&&(ph==='turn'||ph==='drawn')&&!ok,hl:ok});
        if(ok){ const nxq=lay[k+1],w=nxq?Math.min(CW,nxq.x-q.x):CW; hit(q.x,q.y-lift-4,w,CHh+lift+4,()=>act({k:'play',id:q.id})); } });
      c.fillStyle=G.cur===me&&G.ph!=='roundEnd'?'#ffd23f':'rgba(10,6,24,.8)'; rr(c,14,454,150,30,13); c.fill(); c.fillStyle=G.cur===me&&G.ph!=='roundEnd'?'#1a1430':'#fff'; c.font='900 14px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(names[me].slice(0,6)+'　'+lay.length+' 張'+(target?'・'+G.score[me]+' 分':''),89,469);
      if(G.uno[me]&&lay.length===1||t-G.said[me]<1.5&&G.said[me]>0) bubble(150,430,'UNO！'); if(G.risk===me){ c.fillStyle='#ff6a7a'; c.font='900 13px '+TC; c.fillText('你還沒喊 UNO！快按',W/2,370); } }
    /* 訊息 */ c.font='900 15px '+TC; const LG=String(G.log||'').replace(/(^|[，：！])你 /g,'$1你'); const lw=Math.min(560,c.measureText(LG).width+30); c.fillStyle='rgba(10,6,24,.72)'; rr(c,W/2-lw/2,282,lw,30,14); c.fill(); c.fillStyle='#fff'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(LG,W/2,297,550);
    c.fillStyle='rgba(10,6,24,.72)'; rr(c,14,10,170,30,12); c.fill(); c.fillStyle='#ffd23f'; c.font='900 14px '+TC; c.fillText(target?'第 '+G.round+' 局・先到 '+target+' 分':'一局定輸贏',99,25);
    if(!pv) controls(); drawFx(); }
  const hoverPos=[0,0]; canvas.addEventListener('pointermove',e=>{ const q=toG(e); hoverPos[0]=q[0]; hoverPos[1]=q[1]; });
  function bubble(x,y,s){ c.save(); c.translate(x,y); c.rotate(-.12); c.fillStyle='#ffd23f'; rr(c,-34,-14,68,28,12); c.fill(); c.strokeStyle='#e8433a'; c.lineWidth=3; c.stroke(); c.fillStyle='#e8433a'; c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(s,0,1); c.restore(); }
  function controls(){ const my=myTurn(),h=G.hands[me]||[];
    /* 喊 UNO、抓人 */ if(!bot[me]&&(h.length===2&&my&&(G.ph==='turn'||G.ph==='drawn')&&!G.uno[me]||G.risk===me)) btn(660,326,120,44,'UNO！','#ffd23f',()=>act({k:'uno'}),'#c0261e');
    if(!bot[me]&&G.risk>=0&&G.risk!==me) btn(612,326,168,44,'抓！'+names[G.risk].slice(0,4)+'沒喊','#ff7a8a',()=>act({k:'catch'}));
    if(!my) { if(G.ph!=='roundEnd'&&G.cur!==me){ c.fillStyle='rgba(255,255,255,.75)'; c.font='700 13px '+TC; c.textAlign='center'; c.fillText(G.ph==='challenge'?nm(G.cur)+' 要不要質疑…':'等 '+nm(G.cur)+' 出牌…',W/2,372); } }
    else if(G.ph==='turn'){ btn(20,326,130,44,'抽一張','#9fd8ff',()=>act({k:'draw'})); c.fillStyle='#ffe066'; c.font='900 14px '+TC; c.textAlign='center'; c.fillText(h.some(canPlay)?'輪到你：點亮起來的牌出牌':'沒有能出的牌，點牌堆抽一張',W/2,372); }
    else if(G.ph==='drawn'){ btn(20,326,130,44,'留著不出','#e8dcff',()=>act({k:'keep'})); c.fillStyle='#ffe066'; c.font='900 14px '+TC; c.textAlign='center'; c.fillText('抽到能出的牌：點它出牌，或按「留著不出」',W/2,372); }
    if(my&&G.ph==='color'){ c.fillStyle='rgba(10,6,24,.86)'; rr(c,W/2-210,120,420,170,22); c.fill(); c.fillStyle='#fff'; c.font='900 20px '+TC; c.textAlign='center'; c.fillText('要換成什麼顏色？',W/2,152);
      for(let k=0;k<4;k++){ const x=W/2-165+k*90; hit(x,180,70,80,()=>act({k:'color',c:k})); c.fillStyle=COL[k]; rr(c,x,180,70,80,16); c.fill(); c.strokeStyle='#fff'; c.lineWidth=3; c.stroke(); c.fillStyle='#fff'; c.font='900 22px '+TC; c.fillText(CN[k],x+35,221); } }
    if(my&&G.ph==='challenge'&&G.ch){ c.fillStyle='rgba(10,6,24,.88)'; rr(c,W/2-240,110,480,190,22); c.fill(); c.fillStyle='#fff'; c.font='900 19px '+TC; c.textAlign='center'; c.fillText(nm(G.ch.by)+' 出了 +4！',W/2,142);
      c.font='700 13px '+TC; c.fillStyle='#e8dcff'; c.fillText('+4 只能在手上沒有原本顏色時出。覺得他亂出可以質疑：',W/2,172); c.fillText('猜對他罰抽 4 張；猜錯你要抽 6 張',W/2,192);
      btn(W/2-200,222,180,52,'乖乖抽 4 張','#e8dcff',()=>act({k:'chal',y:0})); btn(W/2+20,222,180,52,'我要質疑！','#ffd23f',()=>act({k:'chal',y:1})); }
    if(G.ph==='roundEnd'&&G.rw){ c.fillStyle='rgba(10,6,24,.9)'; rr(c,W/2-230,96,460,214,22); c.fill(); c.textAlign='center'; c.fillStyle='#ffd23f'; c.font='900 26px '+TC; c.fillText('🌈 '+nm(G.rw.w)+' 出光光了！',W/2,134);
      c.fillStyle='#fff'; c.font='700 14px '+TC; c.fillText('拿到其他人手上的 '+G.rw.pts+' 分',W/2,166);
      for(let i=0;i<np;i++){ const y=192+i*18; c.fillStyle=i===G.rw.w?'#7affa0':'#e8dcff'; c.font='700 13px '+TC; c.fillText(nm(i)+'：'+(i===G.rw.w?'出完了':'手上 '+G.rw.hand[i]+' 點')+(target?'　總分 '+G.score[i]:''),W/2,y); } } }
  function drawFx(){ for(const f of fx){ c.save(); c.globalAlpha=Math.min(1,f.l); c.translate(f.x,f.y); c.rotate(f.r); c.fillStyle=f.c; c.fillRect(-5,-3,10,6); c.restore(); } }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',pd); canvas.removeEventListener('pointermove',pm); },
    _dbg:{get G(){ return G; },set G(v){ G=v; },doAct,botPick,canPlay,cc,cv,names,bot,startRound,PTS}};
}
/* ---------- 開始畫面的示意圖 ---------- */
function stageShow(ctx,w,h,t){ const K=window.__pokerKit||{},s=w/800; if(K.drawTable) K.drawTable(ctx,w,h,K.themed(window.__pokerLook||null,'uno'),t); else { ctx.fillStyle='#1d1240'; ctx.fillRect(0,0,w,h); }
  ctx.save(); ctx.scale(s,h/500);
  const ids=[0*16+7,1*16+7,2*16+11,3*16+12,64+13,64+14],u=(t%6)/6,n=Math.min(ids.length,1+Math.floor(u*8));
  for(let k=0;k<n;k++){ ctx.save(); ctx.translate(400+(k-2.5)*18,250+Math.sin(k)*6); ctx.rotate((k-2.5)*.18); drawUno(ctx,-46,-68,92,136,ids[k],true); ctx.restore(); }
  drawUno(ctx,120,170,80,118,0,false); drawUno(ctx,600,170,80,118,0,false);
  ctx.font='900 46px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=8; ctx.strokeStyle='#120c24'; ctx.strokeText('彩虹出光光',400,70); const g=ctx.createLinearGradient(260,0,540,0); COL.forEach((col,k)=>g.addColorStop(k/3,col)); ctx.fillStyle=g; ctx.fillText('彩虹出光光',400,70);
  ctx.font='900 20px '+TC; ctx.fillStyle='#fff'; ctx.fillText('同色、同數字或同符號就能出，先出完的人贏',400,440); ctx.restore(); }
window.ARCADE_RAINBOW={create,stageShow,drawUno,name:'彩虹出光光',
  goal:'彩虹出光光（玩法參考 UNO）：每人 7 張，出跟桌上同顏色、同數字或同符號的牌；沒得出就抽一張，抽到能出的可以馬上出。禁止＝下一家跳過、迴轉＝方向反過來、+2＝下一家抽 2 張跳過、變色＝自己指定顏色、+4＝指定顏色＋下一家抽 4 張（只能在手上沒有目前顏色時出，下一家可以質疑：質疑成功出的人罰抽 4 張，失敗質疑的人抽 6 張）。剩一張要喊「UNO」，沒喊被抓到罰抽 2 張。先出光光的人贏；也可以選正式的「先到 500 分」：出完的人拿走其他人手上的點數（數字照點數、功能牌 20、變色和 +4 50）。',
  help:[['點亮起來的牌','出牌（同顏色、同數字或同符號）'],['點牌堆／空白鍵','沒得出就抽一張'],['UNO！／U 鍵','剩兩張時出牌前按，或剩一張時趕快補喊'],['抓！','別人剩一張沒喊，按它讓他罰抽 2 張']]};
})();
