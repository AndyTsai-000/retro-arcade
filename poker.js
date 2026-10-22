// 牌桌派對：一副撲克牌玩六種遊戲——大老二、德州撲克、十三支、二十一點、賽馬、妞妞。
// 單機是你和電腦同桌；連線時房主負責發牌與判定，其他人送出動作（作法同拉密）。
// 牌的編號 0～51：點數 rk＝id%13+2（2～14，14 是 A），花色 su＝id/13（0 梅花、1 方塊、2 紅心、3 黑桃）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PIX='"Press Start 2P","Noto Sans TC",monospace';
const GAMES=['大老二','德州撲克','十三支','二十一點','賽馬','妞妞'],GID=['b2','th','13','bj','hr','nn'];
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

/* ---------- 畫牌（樣式跟著「我的造型」） ---------- */
const BACKS={red:['#c8323c','#8a1f28'],blue:['#2f6fd0','#1d4a94'],purple:['#7a4ac8','#4f2f88'],green:['#2f8a5a','#1d5a3a'],black:['#2b2b36','#111118'],gold:['#d9a520','#9a7010']};
const FOUR=['#1f9a4a','#2f6fd0','#d4283a','#1c1a26']; // 四色牌：梅花綠、方塊藍、紅心紅、黑桃黑
let STYLE={face:'#fdfcf8',suit:'classic',back:'red',pat:'stripe'};
const setStyle=L=>{ L=L||{}; STYLE={face:L.face||'#fdfcf8',suit:L.suit||'classic',back:L.back||'red',pat:L.pat||'stripe'}; };
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function drawCard(c,x,y,w,h,id,up,o){
  o=o||{}; c.save(); if(o.dim) c.globalAlpha=.45;
  c.fillStyle='rgba(0,0,0,.28)'; rr(c,x+1.5,y+2.5,w,h,w*.12); c.fill();
  if(!up){ const B=BACKS[o.back||STYLE.back]||BACKS.red,ix=x+w*.08,iy=y+w*.08,iw=w*.84,ih=h-w*.16; c.fillStyle='#fff'; rr(c,x,y,w,h,w*.12); c.fill(); c.fillStyle=B[0]; rr(c,ix,iy,iw,ih,w*.08); c.fill();
    c.save(); rr(c,ix,iy,iw,ih,w*.08); c.clip(); c.strokeStyle=B[1]; c.fillStyle=B[1]; c.lineWidth=Math.max(1,w*.05); const pat=STYLE.pat;
    if(pat==='stripe'){ c.beginPath(); for(let i=-h;i<w+h;i+=w*.2){ c.moveTo(x+i,y); c.lineTo(x+i+h,y+h); c.moveTo(x+i+h,y); c.lineTo(x+i,y+h); } c.stroke(); }
    else if(pat==='dots'){ for(let yy=iy+w*.1;yy<iy+ih;yy+=w*.2) for(let xx=ix+w*.1+((yy-iy)/(w*.2)%2)*w*.1;xx<ix+iw;xx+=w*.2){ c.beginPath(); c.arc(xx,yy,w*.045,0,7); c.fill(); } }
    else if(pat==='star'){ c.fillStyle='rgba(255,255,255,.55)'; c.font=Math.round(w*.5)+'px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('★',x+w/2,y+h/2); c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=Math.max(1,w*.03); rr(c,ix+w*.06,iy+w*.06,iw-w*.12,ih-w*.12,w*.05); c.stroke(); }
    c.restore(); c.restore(); return; }
  c.fillStyle=STYLE.face; rr(c,x,y,w,h,w*.12); c.fill(); if(o.hl){ c.fillStyle='rgba(255,220,120,.25)'; rr(c,x,y,w,h,w*.12); c.fill(); }
  c.strokeStyle=o.sel?'#ffd23f':o.hl?'#ffb000':'#9a95a8'; c.lineWidth=o.sel?3:1; c.stroke();
  const sg=su(id),col=STYLE.suit==='four'?FOUR[sg]:(sg===1||sg===2)?'#d4283a':'#1c1a26',big=STYLE.suit==='big';
  c.fillStyle=col; c.textAlign='left'; c.textBaseline='top';
  c.font='900 '+Math.round(w*(big?.5:.34))+'px '+TC; c.fillText(RN(rk(id)),x+w*.08,y+w*.04);
  c.font=Math.round(w*(big?.36:.3))+'px '+TC; c.fillText(SUITS[sg],x+w*.1,y+w*(big?.56:.42));
  c.textAlign='center'; c.textBaseline='middle'; c.font=Math.round(w*(big?.5:.62))+'px '+TC; c.fillText(SUITS[sg],x+w*(big?.66:.6),y+h*(big?.74:.66));
  c.restore();
}
// 每種牌戲預設的場景：大老二在咖啡廳、德州撲克在賭場、十三支在木框賭桌、二十一點在半圓的二十一點桌
const THEME={b2:{bg:'cafe',felt:'#2f7a52'},th:{bg:'casino',felt:'#1f6b4a'},'13':{bg:'wood',felt:'#3a2d57'},bj:{bg:'bjt',felt:'#1f6b4a'},hr:{bg:'turf',felt:'#2f7a3a'},nn:{bg:'cny',felt:'#1f6b4a'}};
const savedLook=()=>{ try{ return JSON.parse(localStorage.getItem('arcade.look.poker')||'null')||{}; }catch(e){ return {}; } }; // 開始畫面左邊的圖也用自己存的造型
const themed=(L,kind)=>{ L=L||{}; const T=THEME[kind]; return Object.assign({},L,{bg:!L.bg||L.bg==='auto'?T.bg:L.bg,felt:L.felt||T.felt}); };
// 牌桌背景：經典綠桌、木框賭桌、星空、咖啡廳、賭場、二十一點桌
function drawTable(c,w,h,L,t){
  const k=w/800,bg=(L&&L.bg)||'felt',felt=(L&&L.felt)||'#1f6b4a',cx=w/2,cy=h*.46,rx=w*.47,ry=h*.43;
  if(bg==='felt'){ const g=c.createRadialGradient(cx,h/2,60*k,cx,h/2,520*k); g.addColorStop(0,felt); g.addColorStop(1,'#0b0a1c'); c.fillStyle=g; c.fillRect(0,0,w,h);
    c.strokeStyle='rgba(255,255,255,.08)'; c.lineWidth=3*k; c.beginPath(); c.ellipse(cx,h/2-10*k,330*k,170*k,0,0,7); c.stroke(); return; }
  if(bg==='wood'){ c.fillStyle='#3a2416'; c.fillRect(0,0,w,h); c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=2*k; for(let y=0;y<h;y+=26*k){ c.beginPath(); c.moveTo(0,y); c.lineTo(w,y); c.stroke(); }
    c.fillStyle='rgba(255,220,150,.08)'; for(let i=0;i<5;i++){ c.beginPath(); c.arc(w*(.1+i*.2),-20*k,120*k,0,7); c.fill(); } }
  else if(bg==='night'){ const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#0b0f2e'); g.addColorStop(1,'#1d1240'); c.fillStyle=g; c.fillRect(0,0,w,h);
    for(let i=0;i<70;i++){ c.globalAlpha=.4+.6*Math.abs(Math.sin((t||0)*1.3+i)); c.fillStyle='#fff'; c.fillRect((i*137)%w,(i*71)%h,1.6*k,1.6*k); } c.globalAlpha=1;
    c.fillStyle='#f6f0c8'; c.beginPath(); c.arc(w*.9,h*.12,22*k,0,7); c.fill(); c.fillStyle='#0b0f2e'; c.beginPath(); c.arc(w*.88,h*.1,20*k,0,7); c.fill(); }
  else if(bg==='casino'){ c.fillStyle='#4a0e16'; c.fillRect(0,0,w,h); c.fillStyle='rgba(217,178,90,.16)'; const g0=34*k;
    for(let y=0;y<h+g0;y+=g0) for(let x=((y/g0)%2)*g0/2;x<w+g0;x+=g0){ c.beginPath(); c.moveTo(x,y-7*k); c.lineTo(x+7*k,y); c.lineTo(x,y+7*k); c.lineTo(x-7*k,y); c.fill(); }
    c.fillStyle='rgba(255,220,150,.10)'; for(let i=0;i<3;i++){ c.beginPath(); c.arc(w*(.2+i*.3),-30*k,150*k,0,7); c.fill(); } }
  else if(bg==='bjt'){ // 二十一點桌：上面是莊家的直邊，玩家坐在下面的圓弧
    const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#2a1620'); g.addColorStop(1,'#120a14'); c.fillStyle=g; c.fillRect(0,0,w,h);
    c.fillStyle='#3a1c0c'; c.beginPath(); c.ellipse(cx,-h*.04,w*.5+6*k,h*.93+16*k,0,0,Math.PI); c.fill();
    const g2=c.createRadialGradient(cx,h*.2,30*k,cx,h*.2,w*.55); g2.addColorStop(0,felt); g2.addColorStop(1,'rgba(0,0,0,.5)');
    c.fillStyle=felt; c.beginPath(); c.ellipse(cx,-h*.04,w*.5-8*k,h*.93,0,0,Math.PI); c.fill(); c.fillStyle=g2; c.fill();
    c.strokeStyle='#d9b25a'; c.lineWidth=2*k; c.beginPath(); c.ellipse(cx,-h*.04,w*.33,h*.5,0,Math.PI*.08,Math.PI*.92); c.stroke();
    c.fillStyle='rgba(217,178,90,.55)'; c.font='900 '+Math.round(13*k)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('黑傑克賠 3 比 2　・　莊家 17 點以上停牌',cx,h*.405); return; }
  else if(bg==='turf'){ // 賽馬場：藍天、看台、草地、白色圍欄
    const g=c.createLinearGradient(0,0,0,h*.3); g.addColorStop(0,'#7ac4f4'); g.addColorStop(1,'#d8f0ff'); c.fillStyle=g; c.fillRect(0,0,w,h*.3);
    c.fillStyle='#8a8f9a'; c.fillRect(0,h*.16,w,h*.14); for(let r=0;r<3;r++) for(let q=0;q<40;q++){ c.fillStyle=['#ff6f6f','#ffd23f','#5ac8ff','#7ad85a','#ff9ae0','#fff'][(q*3+r)%6]; c.beginPath(); c.arc(q*w/40+10*k,h*.19+r*h*.035-Math.abs(Math.sin((t||0)*5+q+r))*2*k,4*k,0,7); c.fill(); }
    c.fillStyle='#4f9a3a'; c.fillRect(0,h*.3,w,h*.7); c.fillStyle='rgba(255,255,255,.06)'; for(let x=0;x<w;x+=60*k) c.fillRect(x,h*.3,30*k,h*.7);
    c.fillStyle='#fff'; c.fillRect(0,h*.3,w,4*k); for(let x=0;x<w;x+=40*k) c.fillRect(x,h*.3-12*k,4*k,14*k); c.fillRect(0,h*.3-12*k,w,3*k); return; }
  else if(bg==='cny'){ // 過年：紅色牆面、金色花紋、燈籠、春聯
    const g=c.createRadialGradient(cx,h*.4,40*k,cx,h*.4,w*.7); g.addColorStop(0,'#c8322a'); g.addColorStop(1,'#6a0e12'); c.fillStyle=g; c.fillRect(0,0,w,h);
    c.fillStyle='rgba(255,210,90,.12)'; for(let y=0;y<h;y+=36*k) for(let x=((y/(36*k))%2)*18*k;x<w;x+=36*k){ c.beginPath(); c.arc(x,y,5*k,0,7); c.fill(); }
    for(const [x,txt] of [[.035,'恭喜發財'],[.965,'大吉大利']]){ c.fillStyle='#b8141c'; c.fillRect(w*x-15*k,h*.18,30*k,h*.62); c.strokeStyle='#ffd23f'; c.lineWidth=2*k; c.strokeRect(w*x-15*k,h*.18,30*k,h*.62);
      c.fillStyle='#ffd23f'; c.font='900 '+Math.round(20*k)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; [...txt].forEach((ch,i)=>c.fillText(ch,w*x,h*.26+i*h*.15)); }
    for(const x of [.4,.6]){ const y=h*.07+Math.sin((t||0)*1.5+x*9)*3*k; c.strokeStyle='#5a2a10'; c.lineWidth=2*k; c.beginPath(); c.moveTo(w*x,0); c.lineTo(w*x,y-20*k); c.stroke();
      c.fillStyle='#e8231c'; c.beginPath(); c.ellipse(w*x,y,24*k,20*k,0,0,7); c.fill(); c.fillStyle='#ffd23f'; c.fillRect(w*x-12*k,y-22*k,24*k,5*k); c.fillRect(w*x-12*k,y+17*k,24*k,5*k); c.fillRect(w*x-2*k,y+22*k,4*k,12*k);
      c.fillStyle='#ffd23f'; c.font='900 '+Math.round(16*k)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('福',w*x,y+1); } }
  else if(bg==='cafe'){ c.fillStyle='#e9d6b8'; c.fillRect(0,0,w,h); c.fillStyle='rgba(150,100,60,.12)'; for(let x=0;x<w;x+=40*k) c.fillRect(x,0,20*k,h);
    c.fillStyle='#bfe0f0'; for(const x of [.08,.82]){ c.fillRect(w*x,h*.08,w*.1,h*.22); c.strokeStyle='#8a5a3a'; c.lineWidth=4*k; c.strokeRect(w*x,h*.08,w*.1,h*.22); c.beginPath(); c.moveTo(w*(x+.05),h*.08); c.lineTo(w*(x+.05),h*.3); c.stroke(); } }
  // 橢圓牌桌：外框＋桌布
  c.fillStyle=bg==='wood'?'#7a4a22':bg==='night'?'#2a2a4a':bg==='casino'?'#2a1408':'#8a5a3a'; c.beginPath(); c.ellipse(cx,cy,rx+16*k,ry+16*k,0,0,7); c.fill();
  c.strokeStyle=bg==='night'?'#7a7ac8':'#d9b25a'; c.lineWidth=3*k; c.beginPath(); c.ellipse(cx,cy,rx+7*k,ry+7*k,0,0,7); c.stroke();
  const g2=c.createRadialGradient(cx,cy,30*k,cx,cy,rx); g2.addColorStop(0,felt); g2.addColorStop(1,'rgba(0,0,0,.55)'); c.fillStyle=felt; c.beginPath(); c.ellipse(cx,cy,rx,ry,0,0,7); c.fill(); c.fillStyle=g2; c.fill();
}
function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,me=net?net.me:0;
  const kind=GID[clamp(opts.stage||0,0,5)],humans=net?net.count:1;
  const OP=(opts.options||{}),seats=+OP.seats||6,bjSeats=+OP.bjseats||3;
  const np=net?Math.min(kind==='th'?9:kind==='bj'?7:kind==='hr'?8:kind==='nn'?6:4,net.count+(net.bots||0)):kind==='bj'?clamp(bjSeats,1,7):kind==='th'?clamp(seats,2,9):kind==='hr'?clamp(+OP.hrseats||4,2,8):kind==='nn'?clamp(+OP.nnseats||5,2,6):4; // 德州撲克最多 9 人、二十一點最多 7 人
  const L=themed(opts.look,kind); setStyle(L); const LK=L,spd=['slow','normal','fast'].indexOf((opts.options||{}).speed||'normal'),AID=[2.6,1.8,1][spd<0?1:spd];
  const {ctx:c,canvas}=env.canvas2d(W,H);
  const names=[]; for(let i=0;i<np;i++) names.push(i<humans?(net?(net.names&&net.names[i])||'玩家'+(i+1):(opts.name||'你')):'電腦 '+(i-humans+1));
  const isAI=p=>p>=humans,sfx=n=>env.sfx(n);
  let G={kind,log:'',over:null},t=0,aiT=0,msg='',msgT=0,sel=new Set(),ended=false,btns=[],hits=[],pendingT=0,sliders=[],drag=null,amt=0;
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
  function thAct(p,a,v){
    if(G.over||G.show||G.turn!==p||!canAct(p)) return '不是你的回合';
    const toCall=G.cur-G.bet[p];
    if(a==='fold'){ G.folded[p]=true; log(names[p]+' 棄牌'); sfx('click'); }
    else if(a==='call'){ if(toCall>0){ thPut(p,toCall); log(names[p]+(G.allin[p]?' 全下':' 跟注 '+toCall)); } else log(names[p]+' 過牌'); sfx('place'); }
    else if(a==='raise'||a==='allin'){ const target=a==='allin'?G.bet[p]+G.chips[p]:Math.max(G.cur+G.minR,Math.round(+v||0)),add=Math.min(target-G.bet[p],G.chips[p]); if(add<=toCall) return thAct(p,'call');
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
    if(eq>.72&&r<.7||eq>.55&&r<.25){ const size=Math.round(Math.max(G.minR,pot()*(eq>.72?.6+Math.random()*.6:.4+Math.random()*.3))/BB)*BB; return thAct(p,G.chips[p]<=G.cur+size-G.bet[p]?'allin':'raise',G.cur+size); }
    if(toCall===0) return thAct(p,'call');
    if(eq>potOdds+.04||toCall<=BB&&eq>.25) return thAct(p,'call');
    return thAct(p,'fold'); }

  /* ===== 十三支 ===== */
  const R13=+OP.t13r||6;
  function t13Setup(){ G.total=new Array(np).fill(0); G.r13=0; t13Deal(); }
  function t13Deal(){ G.r13++; const d=newDeck(); G.hands=[]; for(let p=0;p<np;p++) G.hands.push(d.splice(0,13).sort((a,b)=>rk(a)-rk(b)||su(a)-su(b))); G.rows=new Array(np).fill(null); G.res=null; log('第 '+G.r13+' / '+R13+' 局：把 13 張牌分成頭墩 3 張、中墩 5 張、尾墩 5 張'); }
  function t13Submit(p,rows){
    if(G.over||G.res||G.rows[p]) return '已經送出了';
    const all=rows.flat().slice().sort((a,b)=>a-b).join(),own=G.hands[p].slice().sort((a,b)=>a-b).join();
    if(rows.length!==3||rows[0].length!==3||rows[1].length!==5||rows[2].length!==5||all!==own) return '頭墩要 3 張、中墩 5 張、尾墩 5 張';
    G.rows[p]=rows.map(r=>r.slice()); log(names[p]+' 排好了'); sfx('place');
    if(G.rows.every(Boolean)) t13Show(); return null; }
  function t13Show(){
    const foul=G.rows.map(foul13),tot=new Array(np).fill(0),M=[...Array(np)].map(()=>new Array(np).fill(0)),gun=[...Array(np)].map(()=>new Array(np).fill(false));
    for(let a=0;a<np;a++) for(let b=a+1;b<np;b++){ let s=0,wins=0,loss=0;
      for(let k=0;k<3;k++){ let v; if(foul[a]&&foul[b]) v=0; else if(foul[a]) v=-1; else if(foul[b]) v=1; else { const x=rowScore(G.rows[a][k]),y=rowScore(G.rows[b][k]); v=x>y?1:x<y?-1:0; } s+=v; if(v>0) wins++; if(v<0) loss++; }
      if(wins===3){ s*=2; gun[a][b]=true; } else if(loss===3){ s*=2; gun[b][a]=true; } // 打槍：三墩全贏加倍
      M[a][b]=s; M[b][a]=-s; }
    const homer=[]; if(np>=3) for(let a=0;a<np;a++) if([...Array(np).keys()].every(b=>b===a||gun[a][b])){ homer.push(a); for(let b=0;b<np;b++) if(b!==a){ M[a][b]*=2; M[b][a]=-M[a][b]; } } // 全壘打：槍斃所有人再加倍
    for(let a=0;a<np;a++) for(let b=0;b<np;b++) tot[a]+=M[a][b];
    tot.forEach((v,p)=>G.total[p]+=v);
    const guns=[]; for(let a=0;a<np;a++) for(let b=0;b<np;b++) if(gun[a][b]) guns.push([a,b]);
    G.res={tot,foul,guns,homer,until:8}; log(homer.length?names[homer[0]]+' 全壘打！':guns.length?guns.map(([a,b])=>names[a]+' 打槍 '+names[b]).join('、'):'比牌結果出爐'); sfx('win'); }

  /* ===== 二十一點 ===== */
  const BJR=8,BJS=+OP.bjchips||1000,MINB=+OP.bjmin||25;
  function bjSetup(){ G.chips=new Array(np).fill(BJS); G.round=0; bjNewRound(); }
  const bjCur=p=>G.hi[p]===1?G.sp[p].h:G.hands[p],bjBetOf=p=>G.hi[p]===1?G.sp[p].b:G.bets[p];
  function bjEndHand(p){ if(G.sp[p]&&G.hi[p]===0){ G.hi[p]=1; log(names[p]+' 換打第二手'); if(bjTotal(G.sp[p].h)>=21||G.sp[p].aces) G.done[p]=true; } else G.done[p]=true; }
  function bjNewRound(){
    if(G.round>=BJR||G.chips.every(v=>v<=0)||(!net&&G.chips[0]<=0)){ G.over={chips:G.chips.slice()}; return; }
    G.round++; G.phase='bet'; G.bets=new Array(np).fill(0); G.hands=[]; G.dealer=[]; G.done=new Array(np).fill(false); G.res=null; G.sp=new Array(np).fill(null); G.hi=new Array(np).fill(0); G.deck=G.deck&&G.deck.length>60?G.deck:newDeck().concat(newDeck()); // 兩副牌的牌靴，剩不多就重洗（7 人同桌也不會沒牌）
    log('第 '+G.round+' / '+BJR+' 局：先下注'); }
  function bjBet(p,a){ if(G.phase!=='bet'||G.bets[p]) return '現在不能下注'; if(G.chips[p]<=0){ G.bets[p]=-1; } else G.bets[p]=clamp(Math.round(+a||MINB),Math.min(MINB,G.chips[p]),G.chips[p]);
    if(G.bets[p]>0) G.chips[p]-=G.bets[p]; sfx('place'); if(G.bets.every(b=>b!==0)) bjDeal(); return null; }
  function bjDeal(){ G.phase='play'; for(let p=0;p<np;p++){ G.hands[p]=G.bets[p]>0?[G.deck.pop(),G.deck.pop()]:[]; G.done[p]=G.bets[p]<=0||bjTotal(G.hands[p])===21; } G.dealer=[G.deck.pop(),G.deck.pop()];
    G.turn=-1; const up=rk(G.dealer[0]);
    if((up===14||up>=10)&&bjTotal(G.dealer)===21){ G.done.fill(true); log('莊家翻牌：黑傑克！'); bjDealer(); return; } // 莊家明牌是 A 或十點牌時先偷看，黑傑克就直接結算
    bjNext(); log('發牌了，輪流決定要牌、停牌、加倍或分牌'); }
  function bjNext(){ for(let p=0;p<np;p++) if(!G.done[p]){ G.turn=p; return; } bjDealer(); }
  function bjAct(p,a){
    if(G.phase!=='play'||G.turn!==p||G.done[p]) return '不是你的回合'; const h=bjCur(p),b=bjBetOf(p);
    if(a==='hit'){ h.push(G.deck.pop()); sfx('place'); const v=bjTotal(h); if(v>=21){ log(names[p]+(v>21?' 爆了！':' 21 點')); bjEndHand(p); } else log(names[p]+' 要牌（'+v+' 點）'); }
    else if(a==='double'){ if(h.length!==2||G.chips[p]<b) return '只有前兩張牌、籌碼夠時才能加倍'; G.chips[p]-=b; if(G.hi[p]===1) G.sp[p].b*=2; else G.bets[p]*=2; h.push(G.deck.pop()); log(names[p]+' 加倍（'+bjTotal(h)+' 點）'); sfx('item'); bjEndHand(p); }
    else if(a==='split'){ if(!bjCanSplit(p)) return '前兩張一樣大、籌碼夠時才能分牌';
      G.chips[p]-=G.bets[p]; const aces=rk(h[0])===14; G.sp[p]={h:[h.pop(),G.deck.pop()],b:G.bets[p],aces}; h.push(G.deck.pop()); log(names[p]+' 分牌'+(aces?'（A 分牌各補一張）':'')); sfx('item');
      if(aces){ G.hi[p]=1; G.done[p]=true; } else if(bjTotal(h)===21) bjEndHand(p); }
    else { log(names[p]+' 停牌（'+bjTotal(h)+' 點）'); sfx('click'); bjEndHand(p); }
    if(G.done[p]) bjNext(); return null; }
  const bjCanSplit=p=>{ const h=G.hands[p]; return G.phase==='play'&&!G.sp[p]&&h&&h.length===2&&rk(h[0])===rk(h[1])&&G.chips[p]>=G.bets[p]; };
  function bjDealer(){ G.phase='dealer'; const d=G.dealer; while(bjTotal(d)<17) d.push(G.deck.pop());
    const dv=bjTotal(d),dbj=dv===21&&d.length===2,res=new Array(np).fill(0);
    for(let p=0;p<np;p++){ if(G.bets[p]<=0) continue; const hs=[{h:G.hands[p],b:G.bets[p]}].concat(G.sp[p]?[G.sp[p]]:[]);
      for(const {h,b} of hs){ const v=bjTotal(h),pbj=v===21&&h.length===2&&!G.sp[p]; let pay=0; // 分牌後的 21 點不算黑傑克
        if(v>21) pay=0; else if(dbj) pay=pbj?b:0; else if(pbj) pay=b+Math.floor(b*1.5); else if(dv>21||v>dv) pay=b*2; else if(v===dv) pay=b; else pay=0;
        G.chips[p]+=pay; res[p]+=pay-b; } }
    G.res={res,dv,until:4.2}; log('莊家 '+(dv>21?'爆了':dv+' 點')); sfx('win'); }
  function bjAI(p){ if(G.phase==='bet') return bjBet(p,MINB*[1,2,4][Math.floor(Math.random()*3)]);
    if(bjCanSplit(p)&&G.hi[p]===0&&(rk(G.hands[p][0])===14||rk(G.hands[p][0])===8)) return bjAct(p,'split'); // 電腦：A、8 一定分
    const h=bjCur(p),v=bjTotal(h),up=Math.min(10,rk(G.dealer[0])>=10?(rk(G.dealer[0])===14?11:10):rk(G.dealer[0]));
    if(h.length===2&&(v===11||v===10&&up<10)&&G.chips[p]>=bjBetOf(p)) return bjAct(p,'double');
    if(v<=11) return bjAct(p,'hit'); if(bjSoft(h)&&v<=17) return bjAct(p,'hit');
    if(v>=17) return bjAct(p,'stand'); return bjAct(p,up>=7?'hit':'stand'); }

  /* ===== 賽馬：四張 A 當馬，翻到什麼花色那匹馬就前進一格 ===== */
  const HRL=clamp(+OP.hrlen||6,5,8),HRB=+OP.hrbet||50,HRR=+OP.hrr||8,HRPEN=OP.hrpen||'back',HRSTART=1000,FLIP=[2.4,1.7,1.2][spd<0?1:spd]; // 翻牌間隔（使用者覺得太快，看不清楚發生什麼事）
  const LANES=[3,2,1,0],SUN=['梅花','方塊','紅心','黑桃']; // 由上到下：黑桃、紅心、方塊、梅花
  function hrSetup(){ G.chips=new Array(np).fill(HRSTART); G.round=0; G.pool=0; hrNewRace(); }
  function hrNewRace(){ if(G.round>=HRR||!G.chips.some(v=>v>=HRB)){ G.over={chips:G.chips.slice()}; return; }
    G.round++; const deck=shuffle([...Array(52).keys()].filter(id=>rk(id)!==14)); G.track=deck.splice(0,HRL).map(id=>({id,up:false})); G.deck=deck; G.disc=[];
    G.pos=[0,0,0,0]; G.bet=G.chips.map(v=>v>=HRB?-1:-2); G.phase='bet'; G.last=null; G.res=null; G.flipT=0;
    G.log='第 '+G.round+' / '+HRR+' 場：每人下注 '+HRB+'，選一匹看好的馬'; }
  function hrBet(p,s2){ if(G.phase!=='bet') return '比賽已經開始了'; if(G.bet[p]===-2) return '籌碼不夠，這場只能看'; if(G.bet[p]>=0) return '你已經下注了'; if(!(s2>=0&&s2<4)) return '請選一匹馬';
    G.bet[p]=s2; G.chips[p]-=HRB; G.pool+=HRB; G.log=names[p]+' 押 '+SUN[s2]+SUITS[s2]; sfx('item');
    if(!G.bet.includes(-1)){ G.phase='run'; G.flipT=1.2; G.log='全部下注完成，比賽開始！'; sfx('go'); } return null; }
  // 每一步：先看有沒有賽道牌要翻（四匹馬都到了那一格），沒有就從牌堆翻一張讓那匹馬前進
  function hrStep(){
    for(let j=1;j<=HRL;j++){ const cell=G.track[j-1]; if(cell.up||!G.pos.every(v=>v>=j)) continue;
      cell.up=true; const s2=su(cell.id); G.last={id:cell.id,s:s2,pen:j};
      if(HRPEN==='back'){ G.pos[s2]=Math.max(0,G.pos[s2]-1); G.log='翻開賽道第 '+j+' 格：'+SUN[s2]+SUITS[s2]+' 退後一格！'; }
      else { let tot=0; for(let p=0;p<np;p++) if(G.bet[p]===s2){ const f=Math.min(G.chips[p],Math.round(HRB/2)); G.chips[p]-=f; G.pool+=f; tot+=f; } G.log='翻開賽道第 '+j+' 格：押 '+SUN[s2]+' 的人罰 '+Math.round(HRB/2)+' 籌碼進彩池'+(tot?'':'（沒人押）'); }
      sfx('bump'); return 'pen'; }
    if(!G.deck.length){ G.deck=shuffle(G.disc); G.disc=[]; }
    const id=G.deck.pop(); G.disc.push(id); const s2=su(id); G.pos[s2]++; G.last={id,s:s2}; sfx('place');
    if(G.pos[s2]>HRL){ // 衝過終點
      const win=[...Array(np).keys()].filter(p=>G.bet[p]===s2),pay={};
      if(win.length){ const share=Math.floor(G.pool/win.length); for(const p of win){ G.chips[p]+=share; pay[p]=share; } G.pool-=share*win.length; }
      G.phase='done'; G.res={win:s2,pay,until:5.5,none:!win.length}; G.log=SUN[s2]+SUITS[s2]+' 衝過終點！'+(win.length?win.map(p=>names[p]).join('、')+' 押中，平分彩池':'沒人押中，彩池留到下一場'); sfx('win'); return; }
    G.log='翻到 '+SUN[s2]+SUITS[s2]+RN(rk(id))+'，'+SUN[s2]+'前進一格';
    for(let j=1;j<=HRL;j++) if(!G.track[j-1].up&&G.pos.every(v=>v>=j)) return 'pre'; } // 接下來要翻賽道牌：多停一下
  function hrAI(p){ const w=[1,1,1,1]; return hrBet(p,(Math.random()*4)|0); }

  /* ===== 妞妞：5 張分成 3＋2，3 張湊 10 的倍數，剩下 2 張的個位數比大小，各自和莊家比 ===== */
  const NNSTART=+OP.nnchips||1000,NNMIN=+OP.nnmin||50,NNR=+OP.nnr||8,NNBANK=OP.nnbank||'rot',NNT=OP.nntime==='none'?0:+(OP.nntime||30); // NNT：組牌秒數，0＝不限
  const nnMax=p=>Math.max(NNMIN,Math.min(NNMIN*10,Math.floor(G.chips[p]/5/NNMIN)*NNMIN)); // 雙向賠率最多 5 倍：押的錢不超過籌碼的五分之一
  const nnV=id=>{ const r=rk(id); return r===14?1:r>=10?10:r; },nnKey=id=>{ const r=rk(id); return (r===14?1:r)*4+su(id); }; // 同點比最大那張：K＞Q＞J＞10…＞A，再比花色 ♠＞♥＞♦＞♣
  const NNCAT=e=>e.cat===12?'五公':e.cat===10?'妞妞':e.cat>0?'妞'+'一二三四五六七八九'[e.cat-1]:'烏龍';
  const C3=h=>{ const out=[]; for(let a=0;a<5;a++) for(let b=a+1;b<5;b++) for(let d=b+1;d<5;d++) out.push([h[a],h[b],h[d]]); return out; };
  function nnEval(h,tri){ const top=Math.max(...h.map(nnKey));
    if(h.every(id=>rk(id)>=11&&rk(id)<=13)) return {cat:12,top,tri:h.slice(0,3)};
    let best=null; for(const tr of tri?[tri]:C3(h)){ if(tr.reduce((a,id)=>a+nnV(id),0)%10) continue; const p2=h.filter(id=>!tr.includes(id)).reduce((a,id)=>a+nnV(id),0)%10,cat=p2===0?10:p2; if(!best||cat>best.cat) best={cat,top,tri:tr}; }
    return best||{cat:0,top,tri:null}; }
  const nnMul=e=>e.cat===12?5:e.cat===10?3:e.cat>=8?2:1;
  const nnIn=p=>p===G.banker||G.bets[p]>0;
  function nnSetup(){ G.chips=new Array(np).fill(NNSTART); G.round=0; G.banker=-1; nnNewRound(); }
  function nnNewRound(){ const ok=[...Array(np).keys()].filter(p=>G.chips[p]>=NNMIN);
    if(G.round>=NNR||ok.length<2){ G.over={chips:G.chips.slice()}; return; }
    G.round++; G.banker=NNBANK==='fix'&&G.banker>=0&&ok.includes(G.banker)?G.banker:G.banker<0?ok[(Math.random()*ok.length)|0]:ok.find(p=>p>G.banker)??ok[0]; // 輪莊：照順序換人；固定莊：同一個人一直當（籌碼不夠才換）
    G.bets=G.chips.map((v,p)=>p===G.banker?0:v>=NNMIN?0:-1); G.phase='bet'; G.hands=[]; G.sub=new Array(np).fill(null); G.res=null;
    G.log='第 '+G.round+' / '+NNR+' 局：'+names[G.banker]+' 當莊家，閒家下注'; }
  function nnBet(p,v){ if(G.phase!=='bet') return '現在不是下注時間'; if(p===G.banker) return '莊家不用下注'; if(G.bets[p]!==0) return G.bets[p]<0?'籌碼不夠，這局在旁邊看':'你已經下注了';
    const mx=Math.min(G.chips[p],nnMax(p)); v=clamp(Math.round(v||0),NNMIN,mx); G.bets[p]=v; G.log=names[p]+' 下注 '+v; sfx('item');
    if(!G.bets.includes(0)||G.bets.every((b,q)=>q===G.banker||b!==0)){ const d=newDeck(); for(let q=0;q<np;q++) G.hands[q]=nnIn(q)?d.splice(0,5):[]; G.phase='arr'; G.arrT=NNT; G.log='發牌了！把 5 張分成 3＋2'+(NNT?'（'+NNT+' 秒內）':''); sfx('rattle'); }
    return null; }
  function nnSubmit(p,tri){ if(G.phase!=='arr') return '還沒發牌'; if(!nnIn(p)) return '你這局沒有下注'; if(G.sub[p]) return '你已經亮牌了'; const h=G.hands[p];
    if(tri){ if(tri.length!==3||new Set(tri).size!==3||!tri.every(id=>h.includes(id))) return '要選 3 張自己的牌'; if(tri.reduce((a,id)=>a+nnV(id),0)%10) return '這 3 張加起來不是 10 的倍數'; G.sub[p]={tri:tri.slice()}; }
    else G.sub[p]={none:true};
    G.log=names[p]+' 亮牌了'; sfx('click'); if([...Array(np).keys()].every(q=>!nnIn(q)||G.sub[q])) nnSettle(); return null; }
  const nnHandOf=p=>{ const h=G.hands[p],sb=G.sub[p]; if(h.every(id=>rk(id)>=11&&rk(id)<=13)) return nnEval(h); return sb&&sb.none?{cat:0,top:Math.max(...h.map(nnKey)),tri:null}:nnEval(h,sb.tri); };
  function nnSettle(){ const bk=G.banker,ev=[],res=new Array(np).fill(0); for(let p=0;p<np;p++) ev[p]=nnIn(p)?nnHandOf(p):null; const be=ev[bk];
    for(let p=0;p<np;p++){ if(p===bk||!nnIn(p)) continue; const pe=ev[p],b=G.bets[p];
      if(!(pe.cat===0&&be.cat===0)&&pe.cat*1000+pe.top>be.cat*1000+be.top){ /* 都是烏龍：莊家通吃 */ const pay=Math.min(G.chips[bk],b*nnMul(pe)); G.chips[bk]-=pay; G.chips[p]+=pay; res[p]+=pay; res[bk]-=pay; }
      else { const loss=Math.min(G.chips[p],b*nnMul(be)); G.chips[p]-=loss; G.chips[bk]+=loss; res[p]-=loss; res[bk]+=loss; } }
    G.phase='show'; G.res={res,ev,until:6.5}; G.log='開牌！莊家 '+names[bk]+' '+NNCAT(be)+'，'+(res[bk]>=0?'贏 '+res[bk]:'輸 '+(-res[bk])); sfx('win'); }
  function nnAI(p){ if(G.phase==='bet') return nnBet(p,Math.min(nnMax(p),NNMIN*(1+((Math.random()*3)|0)))); const e=nnEval(G.hands[p]); return nnSubmit(p,e.cat>0&&e.cat<12?e.tri:e.cat===12?null:null); }

  /* ===== 共用：誰該動作、電腦、連線 ===== */
  const SETUP={b2:b2Setup,th:thSetup,'13':t13Setup,bj:bjSetup,hr:hrSetup,nn:nnSetup};
  function aiStep(){
    if(G.over) return;
    if(kind==='b2'&&isAI(G.turn)) b2AI(G.turn);
    else if(kind==='th'&&!G.show&&isAI(G.turn)) thAI(G.turn);
    else if(kind==='13'&&!G.res){ for(let p=0;p<np;p++) if(isAI(p)&&!G.rows[p]){ t13Submit(p,arrange13(G.hands[p])); break; } }
    else if(kind==='bj'){ if(G.phase==='bet'){ const p=G.bets.findIndex((b,i)=>b===0&&isAI(i)); if(p>=0) bjAI(p); } else if(G.phase==='play'&&isAI(G.turn)) bjAI(G.turn); }
    else if(kind==='hr'&&G.phase==='bet'){ const p=G.bet.findIndex((b,i)=>b===-1&&(isAI(i)||left.has(i))); if(p>=0) hrAI(p); }
    else if(kind==='nn'&&!G.res){ const ai=q=>isAI(q)||left.has(q); let p=-1; if(G.phase==='bet') p=G.bets.findIndex((b,q)=>b===0&&q!==G.banker&&ai(q)); else if(G.phase==='arr') p=[...Array(np).keys()].find(q=>nnIn(q)&&!G.sub[q]&&ai(q))??-1; if(p>=0) nnAI(p); }
    broadcast(); }
  function doAct(p,a){ // 所有人的動作都經過這裡（連線時在房主這邊執行）
    let err=null;
    if(kind==='b2') err=a.t==='play'?b2Play(p,a.ids):b2Pass(p);
    else if(kind==='th') err=thAct(p,a.t,a.v);
    else if(kind==='13') err=t13Submit(p,a.rows);
    else if(kind==='bj') err=a.t==='bet'?bjBet(p,a.v):bjAct(p,a.t);
    else if(kind==='hr') err=hrBet(p,a.s);
    else if(kind==='nn') err=a.t==='bet'?nnBet(p,a.v):nnSubmit(p,a.none?null:a.tri);
    return err; }
  function act(a){ if(client){ net.send({act:a}); return; } const err=doAct(me,a); if(err){ say(err,2.4); sfx('bump'); } else { sel.clear(); broadcast(); } }
  function broadcast(){ if(net&&net.host) net.send({st:G}); }
  if(net){
    if(client) net.onmsg=m=>{ if(m.st){ const was=G.turn; G=m.st; if(kind==='13'&&G.rows&&G.rows[me]) arr=null; if(G.turn!==was) sel.clear(); } if(m.bad&&m.bad[0]===me){ say(m.bad[1],2.4); sfx('bump'); } };
    else { net.onmsg=(m,from)=>{ if(!m.act) return; const err=doAct(from,m.act); if(err) net.send({bad:[from,err]}); broadcast(); };
      net.onleave=i=>{ names[i]+='（離開）'; if(kind==='b2'&&G.turn===i&&!G.over){ b2AIForce(i); } if(kind==='hr'||kind==='nn') left.add(i); broadcast(); }; }
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
    if(kind==='13'&&G.res){ G.res.until-=dt; if(G.res.until<=0){ if(G.r13>=R13) G.over={tot:G.total.slice()}; else t13Deal(); broadcast(); } return; }
    if(kind==='bj'&&G.res){ G.res.until-=dt; if(G.res.until<=0){ bjNewRound(); broadcast(); } return; }
    if(kind==='nn'&&G.res){ G.res.until-=dt; if(G.res.until<=0){ nnNewRound(); broadcast(); } return; }
    if(kind==='nn'&&G.phase==='arr'&&NNT){ const was=Math.ceil(G.arrT); G.arrT-=dt; if(Math.ceil(G.arrT)!==was) broadcast(); // 時間到：還沒亮牌的人自動組最好的牌
      if(G.arrT<=0){ for(let p=0;p<np;p++) if(G.phase==='arr'&&nnIn(p)&&!G.sub[p]){ const e=nnEval(G.hands[p]); nnSubmit(p,e.cat>0&&e.cat<12?e.tri:null); if(p===me) say('時間到！自動幫你組牌',2.2); } broadcast(); return; } }
    if(kind==='hr'){ if(G.res){ G.res.until-=dt; if(G.res.until<=0){ hrNewRace(); broadcast(); } return; }
      if(G.phase==='run'){ G.flipT-=dt; if(G.flipT<=0){ const r=hrStep(); G.flipT=FLIP*(r==='pen'?2.2:r==='pre'?1.6:1); broadcast(); } return; } }
    // 離開的人由電腦代打
    if(kind==='b2'&&left.has(G.turn)){ aiT+=dt; if(aiT>AID){ aiT=0; b2AI(G.turn); broadcast(); } return; }
    aiT+=dt; if(aiT>AID){ aiT=0; aiStep(); }
  }
  function finish(){
    const tbl=(rows)=>'<table class="ls"><tr><th>名次</th><th>玩家</th><th>'+rows.h+'</th></tr>'+rows.list.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>').join('')+'</table>';
    let title,html,text='',score=null;
    if(kind==='b2'){ const w=G.over.w,list=names.map((n,p)=>[n,p===w?'出完了':'-'+G.over.pen[p]+' 分（剩 '+G.hands[p].length+' 張）',p===w?1e9:-G.over.pen[p]]).sort((a,b)=>b[2]-a[2]);
      title=w===me?'你贏了！':names[w]+' 先出完'; html=tbl({h:'結果',list}); text='輸家照剩下的張數扣分，剩 10 張以上加倍。'; }
    else if(kind==='13'){ const tot=G.over.tot,list=names.map((n,p)=>[n,(tot[p]>0?'+':'')+tot[p]+' 分',tot[p]]).sort((a,b)=>b[2]-a[2]);
      title=list[0][0]===names[me]?'你贏最多！':list[0][0]+' 贏最多'; html=tbl({h:'總分',list}); text='打完 '+R13+' 局累計分數。每墩和每位對手比，贏 +1、輸 -1；三墩全贏「打槍」加倍，槍斃所有人「全壘打」再加倍；排錯（倒水）三墩都算輸。'; }
    else { const ch=G.over.chips,list=names.map((n,p)=>[n,ch[p]+' 籌碼',ch[p]]).sort((a,b)=>b[2]-a[2]);
      title=list[0][0]===names[me]?'你是籌碼王！':list[0][0]+' 籌碼最多'; html=tbl({h:'籌碼',list}); score=ch[me]>0?ch[me]:null; text=kind==='th'?'打完 '+MAXH+' 手或只剩一人有籌碼就結束。':kind==='hr'?'跑完 '+HRR+' 場賽馬比籌碼。':kind==='nn'?'打完 '+NNR+' 局（莊家輪流當）比籌碼。':'打完 '+BJR+' 局就結束。'; }
    env.sfx(title.startsWith('你')?'win':'lose'); env.end({title,big:GAMES[GID.indexOf(kind)],html,text,score,next:false});
  }
  if(client) { /* 連線的另一邊：收到房主的結束狀態 */ }

  /* ===== 操作 ===== */
  function toLogical(e){ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=(r.width-W*s)/2,oy=(r.height-H*s)/2; return [(e.clientX-r.left-ox)/s,(e.clientY-r.top-oy)/s]; }
  function slideTo(sl,x){ let v=sl.min+clamp((x-sl.x)/sl.w,0,1)*(sl.max-sl.min); v=Math.round(v/sl.step)*sl.step; if(x>=sl.x+sl.w-2) v=sl.max; amt=clamp(v,sl.min,sl.max); }
  function onMove(e){ if(!drag) return; e.preventDefault(); slideTo(drag,toLogical(e)[0]); }
  function onUp(){ drag=null; }
  function onDown(e){ e.preventDefault(); const [x,y]=toLogical(e);
    for(const sl of sliders) if(x>=sl.x-14&&x<=sl.x+sl.w+14&&Math.abs(y-sl.y)<=16){ drag=sl; slideTo(sl,x); return; }
    for(const b of btns) if(!b.dis&&x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h){ sfx('click'); b.fn(); return; }
    for(let i=hits.length-1;i>=0;i--){ const h=hits[i]; if(x>=h.x&&x<h.x+h.w&&y>=h.y&&y<h.y+h.h){ h.fn(); return; } } }
  canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointermove',onMove); addEventListener('pointerup',onUp); canvas.style.touchAction='none';
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
  // 拉桿：拖拉或點一下選金額；−／＋ 微調
  function slider(x,y,w,min,max,step){ amt=clamp(Math.round(amt/step)*step||min,min,max); if(amt>max) amt=max; sliders.push({x,y,w,min,max,step});
    const u=max>min?(amt-min)/(max-min):1; c.fillStyle='rgba(0,0,0,.4)'; rr(c,x,y-5,w,10,5); c.fill(); c.fillStyle='#ffd23f'; rr(c,x,y-5,Math.max(10,w*u),10,5); c.fill();
    c.fillStyle='#fff'; c.beginPath(); c.arc(x+w*u,y,11,0,7); c.fill(); c.strokeStyle='#14122b'; c.lineWidth=2; c.stroke();
    btn('−',x-46,y-18,36,()=>{ amt=Math.max(min,amt-step); }); btn('＋',x+w+10,y-18,36,()=>{ amt=Math.min(max,amt+step); }); }
  const toggle=id=>{ if(sel.has(id)) sel.delete(id); else sel.add(id); sfx('click'); };

  function draw(){
    btns=[]; hits=[]; sliders=[];
    setStyle(L); drawTable(c,W,H,L,t);
    c.textAlign='left'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 16px '+TC; c.fillText(GAMES[GID.indexOf(kind)],14,20);
    if(G.log){ c.font='700 12px '+TC; c.textAlign='left'; let tx=G.log; while(c.measureText(tx).width>250&&tx.length>4) tx=tx.slice(0,-2); if(tx!==G.log) tx+='…'; const w=c.measureText(tx).width+20; c.fillStyle='rgba(11,10,28,.7)'; rr(c,10,34,w,22,11); c.fill(); c.fillStyle='#fff'; c.fillText(tx,20,45); } // 訊息放左上角，不擋到對面的人
    if(kind==='b2') drawB2(); else if(kind==='th') drawTH(); else if(kind==='13') draw13(); else if(kind==='hr') drawHR(); else if(kind==='nn') drawNN(); else drawBJ();
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
    else if(mine.length&&G.board.length>=3){ c.fillStyle='#cfe8d8'; c.font='700 13px '+TC; c.textAlign='center'; c.fillText('目前牌型：'+HAND_NAMES[bestN(mine.concat(G.board)).cat],110,298); }
    const on=myTurn()&&!G.show&&canAct(me),toCall=on?G.cur-G.bet[me]:0,minT=on?G.cur+G.minR:0,maxT=on?G.bet[me]+G.chips[me]:0,canR=on&&maxT>minT;
    if(!on) amt=0;
    if(canR){ slider(360,302,250,minT,maxT,BB); c.fillStyle='#fff'; c.font='700 12px '+TC; c.textAlign='left'; c.fillText('拖拉選加注金額',662,302); }
    btn('棄牌',300,336,64,()=>act({t:'fold'}),!on);
    btn(toCall>0?'跟注 '+Math.min(toCall,G.chips[me]):'過牌',372,336,104,()=>act({t:'call'}),!on,true);
    btn(canR?(amt>=maxT?'全下 '+amt:'加注到 '+amt):'加注',484,336,124,()=>act(amt>=maxT?{t:'allin'}:{t:'raise',v:amt}),!canR);
    btn('全下',616,336,70,()=>act({t:'allin'}),!on);
  }
  let arrR=-1;
  function draw13(){
    if(!G.hands) return;
    if(!arr||arrR!==G.r13){ arr={rows:[[],[],[]]}; arrR=G.r13; sel.clear(); } // 新的一局重新排
    const done=!!G.res;
    c.fillStyle='#ffd23f'; c.font='900 14px '+TC; c.textAlign='right'; c.fillText('第 '+G.r13+' / '+R13+' 局　總分 '+(G.total[me]>0?'+':'')+G.total[me],W-14,20);
    for(let p=0;p<np;p++){ if(p===me) continue; const s=seatOf(p),[x,y]=POS[s];
      if(done){ const rows=G.rows[p]; rows.forEach((r,k)=>r.forEach((id,i)=>drawCard(c,x-((r.length-1)*13+20)/2+i*13,(s==='t'?y-30:y-70)+k*30,20,28,id,true))); }
      else backs(x,y,13,s!=='t');
      plate(p,x,s==='t'?(done?y+66:y+42):y+(done?42:80),(done?((G.res.tot[p]>0?'+':'')+G.res.tot[p]+(G.res.foul[p]?' 倒水':'')):G.rows[p]?'排好了':'排牌中')+'　總 '+G.total[p],false); }
    const LBL=['頭墩','中墩','尾墩'],CAP=[3,5,5],rows=done?G.rows[me]:G.rows[me]||arr.rows;
    for(let k=0;k<3;k++){ const y=136+k*62,x0=W/2-150;
      c.fillStyle='rgba(0,0,0,.25)'; rr(c,x0-70,y-4,380,60,10); c.fill(); c.fillStyle='#ffd23f'; c.font='900 14px '+TC; c.textAlign='left'; c.fillText(LBL[k],x0-60,y+26);
      const r=rows[k]||[]; if(r.length===CAP[k]){ c.fillStyle='#cfe8d8'; c.font='700 12px '+TC; c.textAlign='right'; c.fillText(HAND_NAMES[evalHand(r).cat],x0+302,y+26); }
      for(let i=0;i<CAP[k];i++){ const x=x0+i*44; if(r[i]!=null){ drawCard(c,x,y,40,52,r[i],true); if(!done&&!G.rows[me]) hits.push({x,y,w:40,h:52,fn:()=>{ arr.rows[k]=arr.rows[k].filter(v=>v!==r[i]); sfx('click'); }}); }
        else { c.strokeStyle='rgba(255,255,255,.2)'; c.setLineDash([3,3]); rr(c,x,y,40,52,5); c.stroke(); c.setLineDash([]); if(!done&&!G.rows[me]) hits.push({x,y,w:40,h:52,fn:()=>{ const ids=[...sel].slice(0,CAP[k]-arr.rows[k].length); arr.rows[k]=arr.rows[k].concat(ids); sel.clear(); if(ids.length) sfx('place'); }}); } } }
    if(done){ const tot=G.res.tot[me],R=G.res; c.fillStyle=tot>=0?'#86dc4f':'#ff8a8a'; c.font='900 18px '+TC; c.textAlign='center'; c.fillText((R.foul[me]?'倒水！ ':'')+'你這局 '+(tot>0?'+':'')+tot+' 分',W/2,330);
      const gs=R.homer.length?[names[R.homer[0]]+' 全壘打！']:R.guns.map(([a,b])=>names[a]+' 打槍 '+names[b]); if(gs.length){ c.fillStyle='#ffd23f'; c.font='900 14px '+TC; c.fillText(gs.slice(0,3).join('　'),W/2,356); }
      c.fillStyle='#cfe8d8'; c.font='700 12px '+TC; c.fillText(G.r13>=R13?'最後一局結束':'下一局馬上開始…',W/2,380); return; }
    if(G.rows[me]){ c.fillStyle='#fff'; c.font='700 15px '+TC; c.textAlign='center'; c.fillText('已送出，等其他人排好…',W/2,340); return; }
    hand(arrHand(),392,{click:toggle});
    c.fillStyle='#fff'; c.font='700 12px '+TC; c.textAlign='left'; c.fillText('點牌選取 → 點上面的空位放進去；點已放的牌拿回來',14,330);
    const full=arr.rows.every((r,k)=>r.length===CAP[k]),bad=full&&foul13(arr.rows);
    if(bad){ c.fillStyle='#ff8a8a'; c.font='900 13px '+TC; c.textAlign='center'; c.fillText('尾墩要最大、頭墩最小，現在會「倒水」',W/2,322); }
    btn('自動排牌',470,340,96,()=>{ arr.rows=arrange13(G.hands[me]).map(r=>r.slice()); sel.clear(); },false);
    btn('清空',574,340,70,()=>{ arr.rows=[[],[],[]]; sel.clear(); },false);
    btn('確定',652,340,80,()=>{ act({rows:arr.rows}); },!full,true);
  }
  // 賽馬：上面一排是賽道牌，下面四條跑道，A 在跑道上往右跑；馬的位置用動畫慢慢移過去
  const hrShown=[0,0,0,0]; let hrPenSeen=null,hrPenT=0;
  function drawHR(){ if(!G.pos) return;
    const x0=96,cw=Math.min(78,560/(HRL+2)),ly=168,lh=54,cardW=Math.min(48,cw*.66),cardH=cardW*1.4,colX=j=>x0+j*cw+cw/2;
    c.fillStyle='rgba(11,10,28,.6)'; rr(c,x0-6,ly-cardH*.8-20,cw*(HRL+2)+12,cardH*.8+14,10); c.fill(); // 賽道牌那一排墊深色底，不和看台混在一起
    c.fillStyle='rgba(255,255,255,.85)'; c.font='900 13px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('起跑',colX(0),ly-cardH*.4-13);
    for(let j=1;j<=HRL;j++){ const cell=G.track[j-1],x=colX(j)-cardW*.4,y=ly-cardH*.8-13; drawCard(c,x,y,cardW*.8,cardH*.8,cell.id,cell.up,{back:L.back,hl:G.last&&G.last.pen===j}); }
    c.fillStyle='rgba(255,255,255,.85)'; c.fillText('終點',colX(HRL+1),ly-cardH*.4-13);
    for(let li=0;li<4;li++){ const s2=LANES[li],y=ly+li*lh; c.fillStyle=li%2?'rgba(255,255,255,.08)':'rgba(0,0,0,.08)'; c.fillRect(x0,y,cw*(HRL+2),lh-4);
      c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=1; for(let j=1;j<=HRL+1;j++){ c.beginPath(); c.moveTo(x0+j*cw,y); c.lineTo(x0+j*cw,y+lh-4); c.stroke(); }
      c.fillStyle=(s2===1||s2===2)?'#ff6a6a':'#fff'; c.font='900 22px '+TC; c.fillText(SUITS[s2],x0-56,y+lh/2-2); c.font='700 11px '+TC; c.fillStyle='#fff'; c.fillText(SUN[s2],x0-28,y+lh/2-2);
      // 押這匹的人
      const who=[...Array(np).keys()].filter(p=>G.bet[p]===s2); c.textAlign='left'; c.font='700 11px '+TC; c.fillStyle='#ffe8a8'; c.fillText(who.map(p=>p===me?'你':names[p]).join('、'),x0+cw*(HRL+2)+8,y+lh/2-2); c.textAlign='center'; }
    // 終點線（黑白格）
    const fx=x0+(HRL+1)*cw; for(let r=0;r<Math.ceil(4*lh/8);r++) for(let q=0;q<2;q++){ c.fillStyle=(r+q)%2?'#14122b':'#fff'; c.fillRect(fx-8+q*4,ly+r*8,4,8); }
    for(let li=0;li<4;li++){ const s2=LANES[li],y=ly+li*lh; hrShown[s2]+=(G.pos[s2]-hrShown[s2])*.07; const x=colX(hrShown[s2]),bob=G.phase==='run'?Math.abs(Math.sin(t*9+li))*3:0,win=G.res&&G.res.win===s2;
      drawCard(c,x-17,y+3-bob,34,lh-10,s2*13+12,true,{sel:win,hl:G.last&&G.last.s===s2&&!G.last.pen});
      c.font='16px '+TC; c.fillText('🐎',x+24,y+lh/2-4-bob); }
    // 牌堆和剛翻的牌
    const by=ly+4*lh+14; drawCard(c,24,by,46,64,0,false,{back:L.back}); c.fillStyle='#fff'; c.font='700 11px '+TC; c.fillText('牌堆 '+G.deck.length,47,by+76);
    if(G.last){ drawCard(c,80,by,46,64,G.last.id,true,{hl:true}); c.textAlign='left'; c.font='900 14px '+TC; c.fillStyle=G.last.pen?'#ff8a8a':'#ffd23f'; c.fillText(G.last.pen?'賽道牌：'+SUN[G.last.s]+(HRPEN==='back'?'退後':'罰籌碼'):SUN[G.last.s]+'前進',136,by+20); c.textAlign='center'; }
    // 彩池、場次
    c.fillStyle='rgba(11,10,28,.7)'; rr(c,W-196,8,186,46,12); c.fill(); c.fillStyle='#ffd23f'; c.font='900 16px '+TC; c.textAlign='center'; c.fillText('彩池 '+G.pool,W-103,24); c.fillStyle='#cfe8d8'; c.font='700 11px '+TC; c.fillText('第 '+G.round+' / '+HRR+' 場　每場 '+HRB,W-103,43);
    // 玩家
    const px0=300,pw=Math.min(122,(W-px0-10)/Math.min(np,4)); [...Array(np).keys()].forEach((p,i)=>{ const x=px0+(i%4)*pw+pw/2,y=by+14+Math.floor(i/4)*28,b=G.bet[p];
      plate(p,x,y,G.chips[p]+(b>=0?' '+SUITS[b]:''),G.phase==='bet'&&b===-1);
      if(G.res&&G.res.pay[p]){ c.fillStyle='#86dc4f'; c.font='900 12px '+TC; c.fillText('+'+G.res.pay[p],x,y-18); } });
    // 翻開賽道牌：中間跳出大字提示
    if(G.last&&G.last.pen){ if(hrPenSeen!==G.last){ hrPenSeen=G.last; hrPenT=2.4; } }
    if(hrPenT>0&&G.last&&G.last.pen&&!G.res){ hrPenT-=1/60; const a=Math.min(1,hrPenT*2),s2=G.last.s; c.globalAlpha=a; c.fillStyle='#7a1420'; rr(c,10,8,W-220,50,14); c.fill(); // 放在最上面，不擋住跑道上的馬
      c.fillStyle='#fff'; c.font='900 19px '+TC; c.fillText('賽道第 '+G.last.pen+' 格翻開：'+SUITS[s2]+' '+SUN[s2]+'　'+(HRPEN==='back'?SUN[s2]+'退後一格！':'押'+SUN[s2]+'的人罰籌碼！'),10+(W-220)/2,33); c.globalAlpha=1; }
    if(G.phase==='bet'&&G.bet[me]===-1){ c.fillStyle='rgba(11,10,28,.82)'; rr(c,W/2-250,ly+40,500,120,16); c.fill(); c.fillStyle='#fff'; c.font='900 16px '+TC; c.fillText('押哪一匹馬？（下注 '+HRB+'）',W/2,ly+62);
      [3,2,1,0].forEach((s2,i)=>btn(SUITS[s2]+' '+SUN[s2],W/2-236+i*120,ly+86,110,()=>act({t:'bet',s:s2}),false,true)); }
    else if(G.phase==='bet'){ c.fillStyle='#fff'; c.font='700 14px '+TC; c.fillText(G.bet[me]===-2?'籌碼不夠，這場在旁邊看':'等其他人下注…',W/2,ly+4*lh+2); }
    if(G.res){ c.fillStyle='rgba(11,10,28,.85)'; rr(c,W/2-210,ly+50,420,90,16); c.fill(); c.fillStyle='#ffd23f'; c.font='900 24px '+TC; c.fillText(SUITS[G.res.win]+' '+SUN[G.res.win]+' 奪冠！',W/2,ly+80);
      c.fillStyle=G.res.pay[me]?'#86dc4f':'#fff'; c.font='700 14px '+TC; c.fillText(G.res.pay[me]?'你押中了！贏得 '+G.res.pay[me]:G.res.none?'沒人押中，彩池留到下一場':G.bet[me]>=0?'沒押中，下一場再來':'',W/2,ly+114); } }
  // 妞妞：開牌時把每家的牌排成 3＋2，標出牌型和輸贏
  function nnCards(p,x,y,cw,ch,up,sp){ const h=G.hands[p]||[]; if(!h.length) return; sp=sp||.62; const e=G.res&&G.res.ev[p],tri=e&&e.tri,ord=tri?tri.concat(h.filter(id=>!tri.includes(id))):h,gp=tri?cw*.45:0;
    ord.forEach((id,i)=>drawCard(c,x-(cw*sp*4+cw+gp)/2+i*cw*sp+(tri&&i>=3?gp:0),y,cw,ch,id,up,{back:L.back})); } // 開牌時 3 張和 2 張中間空一格
  let nnBeep=-1;
  function drawNN(){ if(!G.chips) return; const bk=G.banker,R2=G.res;
    c.fillStyle='rgba(11,10,28,.7)'; rr(c,W-206,8,196,46,12); c.fill(); c.fillStyle='#ffd23f'; c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('莊家：'+names[bk],W-108,24); c.fillStyle='#cfe8d8'; c.font='700 11px '+TC; c.fillText('第 '+G.round+' / '+NNR+' 局　最低下注 '+NNMIN,W-108,43);
    for(let p=0;p<np;p++){ if(p===me) continue; const pos=thPos(p),x=pos.x,y=pos.y+(pos.top?18:-6),inR=nnIn(p),done=G.sub&&G.sub[p];
      if(G.hands[p]&&G.hands[p].length) nnCards(p,x,y-30,30,42,!!R2,.72);
      if(R2&&R2.ev[p]){ const e=R2.ev[p]; c.fillStyle=e.cat>=8?'#ffd23f':'#fff'; c.font='900 13px '+TC; c.textAlign='center'; const rv=R2.res[p]; c.fillText(NNCAT(e)+(nnMul(e)>1?' ×'+nnMul(e):'')+(rv?'　':''),x-(rv?18:0),y+22); if(rv){ c.fillStyle=rv>0?'#86dc4f':'#ff8a8a'; c.textAlign='left'; c.fillText((rv>0?'+':'')+rv,x+c.measureText(NNCAT(e)).width/2-6,y+22); c.textAlign='center'; } }
      else if(done&&G.phase==='arr'){ c.fillStyle='#86dc4f'; c.font='900 12px '+TC; c.textAlign='center'; c.fillText('亮牌好了',x,y+22); }
      plate(p,x,y+40,(p===bk?'莊 ':'')+G.chips[p]+(G.bets[p]>0?'　押 '+G.bets[p]:''),G.phase==='bet'&&G.bets[p]===0&&p!==bk||G.phase==='arr'&&inR&&!done);
    }
    // 自己
    plate(me,W/2,486,(me===bk?'莊家　':'')+G.chips[me]+' 籌碼'+(G.bets[me]>0?'　押 '+G.bets[me]:''),G.phase==='bet'&&G.bets[me]===0&&me!==bk||G.phase==='arr'&&nnIn(me)&&!G.sub[me]);
    const mh=G.hands[me]||[];
    if(R2&&mh.length){ nnCards(me,W/2,380,56,80,true,1.06); const e=R2.ev[me]; c.fillStyle=e.cat>=8?'#ffd23f':'#fff'; c.font='900 20px '+TC; c.textAlign='center'; c.fillText(NNCAT(e)+(nnMul(e)>1?'（'+nnMul(e)+' 倍）':''),W/2,356);
      if(R2.res[me]){ c.fillStyle=R2.res[me]>0?'#86dc4f':'#ff8a8a'; c.font='900 18px '+TC; c.fillText(me===bk?'莊家這局 '+(R2.res[me]>0?'+':'')+R2.res[me]:(R2.res[me]>0?'贏了 +':'輸了 ')+R2.res[me],W/2,330); } }
    else if(G.phase==='arr'&&mh.length){ const mine=!G.sub[me]&&nnIn(me);
      if(NNT&&G.arrT!=null){ const left2=Math.max(0,Math.ceil(G.arrT)),warn=left2<=5; if(mine&&warn&&left2!==nnBeep){ nnBeep=left2; if(left2>0) sfx('beep'); }
        c.fillStyle=warn?'rgba(180,30,50,.92)':'rgba(11,10,28,.7)'; rr(c,W-128,62,118,34,12); c.fill(); c.fillStyle='#fff'; c.font='900 16px '+TC; c.textAlign='center'; c.fillText('組牌 '+left2+' 秒',W-69,80); }
      if(mine){ hand(mh,392,{click:toggle}); const tri=[...sel],sum=tri.reduce((a,id)=>a+nnV(id),0);
        c.fillStyle='#fff'; c.font='700 13px '+TC; c.textAlign='center'; c.fillText(tri.length?'選了 '+tri.length+' 張，加起來 '+sum+' 點'+(tri.length===3?(sum%10?'（不是 10 的倍數）':'　✔ 有妞'):''):'點 3 張加起來是 10、20、30 的牌（J、Q、K、10 都算 10，A 算 1）',W/2,326);
        btn('亮牌',W/2-170,340,96,()=>act({t:'nn',tri:[...sel]}),!(tri.length===3&&sum%10===0),true); btn('沒妞',W/2-64,340,90,()=>act({t:'nn',none:true}),false); btn('幫我組牌',W/2+36,340,120,()=>{ const e=nnEval(mh); sel.clear(); if(e.tri&&e.cat<12) e.tri.forEach(id=>sel.add(id)); else if(e.cat===12) mh.slice(0,3).forEach(id=>sel.add(id)); else say('怎麼選都湊不出 10 的倍數：沒妞',2.2); },false); }
      else { mh.forEach((id,i)=>drawCard(c,W/2-150+i*62,392,56,80,id,true)); c.fillStyle='#fff'; c.font='700 14px '+TC; c.textAlign='center'; c.fillText('亮牌好了，等其他人…',W/2,356); } }
    else if(G.phase==='bet'){ c.textAlign='center';
      if(me===bk){ c.fillStyle='#ffd23f'; c.font='900 18px '+TC; c.fillText('你是莊家！等閒家下注…',W/2,400); }
      else if(G.bets[me]===0){ const mx=Math.min(G.chips[me],nnMax(me)); if(mx>NNMIN) slider(W/2-165,418,210,NNMIN,mx,NNMIN); else amt=NNMIN; btn('下注 '+amt,W/2+96,400,124,()=>act({t:'bet',v:amt}),false,true);
        c.fillStyle='#fff'; c.font='700 13px '+TC; c.fillText('選這局要押多少（最多 '+mx+'：輸的時候可能要賠到 5 倍）',W/2,374); }
      else { c.fillStyle='#fff'; c.font='700 14px '+TC; c.fillText(G.bets[me]<0?'籌碼不夠，這局在旁邊看':'等其他人下注…',W/2,400); } } }
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
    for(let p=0;p<np;p++){ const [x,y]=pos(p),small=p!==me,cw=small?(np>5?28:34):52,chh=small?(np>5?40:48):74,sp=G.sp&&G.sp[p];
      const hs=sp?[[G.hands[p],x-(small?cw*.9:70)],[sp.h,x+(small?cw*.9:70)]]:[[G.hands[p]||[],x]];
      hs.forEach(([h,hx],hiI)=>{ const scale=sp&&small?.8:1,w2=cw*scale,h2=chh*scale,on1=sp&&G.phase==='play'&&G.turn===p&&G.hi[p]===hiI;
        h.forEach((id,i)=>drawCard(c,hx-((h.length-1)*(w2*.55)+w2)/2+i*w2*.55,y-h2,w2,h2,id,true,{sel:on1}));
        if(h.length){ const v=bjTotal(h); c.fillStyle=v>21?'#ff8a8a':'#ffd23f'; c.font='900 '+(small?12:15)+'px '+TC; c.textAlign='center'; c.fillText(v>21?'爆了 '+v:v+' 點',hx,y+12); } });
      const bt=G.bets[p]>0?G.bets[p]+(sp?sp.b:0):0,crowd=np>3&&p!==me,extra=crowd?String(G.chips[p]):G.chips[p]+' 籌碼'+(bt?'　下注 '+bt:''); // 人多時名牌只放籌碼，下注另一行
      if(crowd&&bt){ c.fillStyle='#ffd23f'; c.font='900 12px '+TC; c.textAlign='center'; c.fillText('下注 '+bt,x,y+52); }
      plate(p,x,y+(p===me?38:34),extra,G.phase==='play'&&G.turn===p||G.phase==='bet'&&!G.bets[p]&&G.chips[p]>0);
      if(G.res&&G.res.res[p]){ const v=G.res.res[p]; c.fillStyle=v>0?'#86dc4f':'#ff8a8a'; c.font='900 15px '+TC; c.fillText((v>0?'+':'')+v,x,y-(small?58:86)); } }
    c.fillStyle='#cfe8d8'; c.font='700 12px '+TC; c.textAlign='center'; c.fillText('第 '+G.round+' / '+BJR+' 局',W/2,150);
    if(G.phase==='bet'&&!G.bets[me]&&G.chips[me]>0){ const lo=Math.min(MINB,G.chips[me]); if(G.chips[me]>lo) slider(W/2-165,422,210,lo,G.chips[me],MINB); else amt=lo;
      btn('下注 '+amt,W/2+96,404,124,()=>act({t:'bet',v:amt}),false,true); }
    else if(G.phase==='play'&&G.turn===me){ const h=bjCur(me); amt=0;
      btn('要牌',W/2-226,404,100,()=>act({t:'hit'}),false,true); btn('停牌',W/2-116,404,100,()=>act({t:'stand'}),false); btn('加倍',W/2-6,404,100,()=>act({t:'double'}),h.length!==2||G.chips[me]<bjBetOf(me));
      btn('分牌',W/2+104,404,100,()=>act({t:'split'}),!bjCanSplit(me)); }
    else if(!G.over){ c.fillStyle='#fff'; c.font='700 14px '+TC; c.textAlign='center'; c.fillText(G.phase==='bet'?'等其他人下注…':G.phase==='play'?'等 '+names[G.turn]+' 決定…':'',W/2,420); }
  }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('pointermove',onMove); removeEventListener('pointerup',onUp); },
    _dbg:{get G(){return G;},doAct,aiStep,arrange13,b2Combo,evalHand,best7,names}};
}

/* ---------- 開始畫面的示意圖 ---------- */
function stageShow(ctx,w,h,si,t){
  setStyle(window.__pokerLook); drawTable(ctx,w,h,themed(window.__pokerLook||savedLook(),GID[si]),t); // 背景跟著選的牌戲
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
  else if(si===3){ // 二十一點
    ctx.fillStyle='#fff'; ctx.font='900 '+Math.round(14*k)+'px '+TC; ctx.fillText('莊家',w/2,h*.2);
    drawCard(ctx,w/2-50*k,h*.25,cw,ch,9,true); drawCard(ctx,w/2+4*k,h*.25,cw,ch,0,u>.5);
    drawCard(ctx,w/2-50*k,h*.6,cw,ch,12,true); drawCard(ctx,w/2+4*k,h*.6,cw,ch,8,true);
    ctx.fillStyle='#86dc4f'; ctx.font='900 '+Math.round(h*.08)+'px '+TC; ctx.fillText(u>.3?'21 點！':'',w/2,h*.93); }
  else if(si===5){ // 妞妞：8、2、J 湊 20，9＋7＝16 → 妞六
    const ids=[45,26,22,7,31],sp=u>.35?1:u/.35; ids.forEach((id,i)=>{ const x=w/2-130*k+i*54*k+(i<3?-20*k*sp:20*k*sp); drawCard(ctx,x,h*.32,cw,ch,id,true); });
    ctx.fillStyle='#fff'; ctx.font='900 '+Math.round(15*k)+'px '+TC; if(u>.35){ ctx.fillText('8＋2＋J＝20',w/2-80*k,h*.75); ctx.fillText('9＋7＝16',w/2+95*k,h*.75); }
    ctx.fillStyle='#ffd23f'; ctx.font='900 '+Math.round(h*.09)+'px '+TC; if(u>.6) ctx.fillText('妞六！',w/2,h*.9); }
  else { // 賽馬：四張 A 在跑道上往前衝
    const x0=w*.14,cw2=w*.11,ly=h*.3,lh=h*.15,mv=[[1,2,0,1],[2,3,1,2],[3,3,2,4],[4,5,3,4],[4,6,4,5],[5,7,4,5]][Math.floor(t*1.4)%6];
    for(let j=1;j<=6;j++) drawCard(ctx,x0+j*cw2+cw2*.2,h*.14,cw2*.55,cw2*.75,[5,20,33,48,9,27][j-1],j<=2&&Math.floor(t*1.4)%6>2);
    [3,2,1,0].forEach((s2,i)=>{ const y=ly+i*lh; ctx.fillStyle=i%2?'rgba(255,255,255,.1)':'rgba(0,0,0,.1)'; ctx.fillRect(x0,y,cw2*8,lh-3); drawCard(ctx,x0+mv[i]*cw2+cw2*.1,y+2,cw2*.6,lh-7,s2*13+12,true); });
    ctx.fillStyle='#ffd23f'; ctx.font='900 '+Math.round(h*.07)+'px '+TC; ctx.fillText('押中冠軍馬，平分彩池！',w/2,h*.94); }
}
function thumb(ctx,w,h,t){
  setStyle(null);
  const g=ctx.createRadialGradient(w/2,h/2,30,w/2,h/2,w*.7); g.addColorStop(0,'#1f6b4a'); g.addColorStop(1,'#0b0a1c'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  const ids=[47,48,49,50,51],k=w/480;
  ids.forEach((id,i)=>{ const a=(i-2)*.22+Math.sin(t*1.2)*.04; ctx.save(); ctx.translate(w/2+(i-2)*38*k,h*.62); ctx.rotate(a); drawCard(ctx,-30*k,-90*k,60*k,86*k,id,true); ctx.restore(); });
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.13)+'px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#0b0a1c'; ctx.strokeText('牌桌派對',w/2,h*.16); ctx.fillStyle='#ffd23f'; ctx.fillText('牌桌派對',w/2,h*.16);
  ctx.font='700 '+Math.round(h*.06)+'px '+TC; ctx.fillStyle='#cfe8d8'; ctx.fillText('大老二・德撲・十三支・21點・賽馬・妞妞',w/2,h*.9);
}

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).poker={
  name:'牌桌派對',tag:'CARD PARTY',color:'#e23b3b',online:true,maxPlayers:si=>si===1?9:si===3?7:si===4?8:si===5?6:4,bots:true,minPlayers:2, // 德州撲克最多 9 人、二十一點 7 人，其他 4 人
  desc:'一副撲克牌玩六種：大老二、德州撲克、十三支、二十一點、賽馬、妞妞。和電腦同桌，或開房間 2～4 人連線。',
  goal:'大老二：拿到最小牌的人先出，跟著出同張數、比上一手大的牌，先出完的人贏。德州撲克：兩張手牌配五張公牌湊最大的五張，打 8 手比籌碼；起始籌碼、盲注和人數（單機 4～9 人、連線最多 9 人）可以在開始前選。十三支：把 13 張分成頭墩 3、中墩 5、尾墩 5，尾墩最大、頭墩最小，和每家逐墩比大小。二十一點：和莊家比點數，越接近 21 越好，超過就爆，打 6 局比籌碼；最多 7 位玩家同桌（單機 2～7 人可選）。',
  stages:GAMES,stageLabel:'選擇遊戲', // 這裡的「關卡」其實是四種牌戲
  stageGoal:si=>[
    '大老二：拿到最小牌（通常是梅花 3）的人先出，之後跟著出同張數、比上一手大的牌，壓不過就「過」。可以出單張、一對，或五張的順子＜同花＜葫蘆＜鐵支＜同花順。先出完的人贏，其他人照剩下的張數扣分，剩 10 張以上加倍。',
    '德州撲克：每人兩張手牌，配合桌上五張公牌湊出最大的五張牌。每一輪可以棄牌、過牌／跟注、加注（金額自己拉）或全下，打 8 手後比籌碼。起始籌碼、盲注和人數（單機 4～9 人、連線最多 9 人）可以在下面選。',
    '十三支：每局把 13 張牌分成頭墩 3 張、中墩 5 張、尾墩 5 張，尾墩要最大、頭墩最小，不然算「倒水」。和每一家逐墩比大小，贏一墩 +1、輸一墩 -1，三墩全贏「打槍」加倍，槍斃所有人「全壘打」再加倍。打好幾局累計總分（局數可以選），不會排可以按「自動排牌」。',
    '賽馬：四張 A（黑桃、紅心、方塊、梅花）是四匹馬，排在左邊的起跑線，右邊蓋著幾張牌當賽道。比賽前每人押一匹馬（每場下注金額一樣），押的錢放進彩池。開跑後莊家一張一張翻牌堆，翻到什麼花色，那匹馬就前進一格。四匹馬都跑到賽道上某一格時，就翻開那一格的牌，翻到的花色要退後一格（也可以在開始前改成「押那匹馬的人罰籌碼進彩池」）。最先衝過最後一格的馬就是冠軍，押中的人平分彩池；沒人押中，彩池留到下一場。賽道長度、下注金額、場數和人數都可以在開始前選。',
    '妞妞：J、Q、K、10 算 10 點，A 算 1 點，其他照數字。莊家輪流當，閒家先下注，每人發 5 張。從 5 張裡挑 3 張加起來是 10、20 或 30（有妞），剩下 2 張相加取個位數就是點數（妞一～妞九，個位數是 0 叫「妞妞」）；怎麼挑都湊不出來就是「烏龍」最小。5 張都是 J、Q、K 叫「五公」最大。每位閒家各自和莊家比：五公＞妞妞＞妞九＞…＞妞一＞烏龍，一樣大就比最大那張（K＞Q＞J＞10…＞A），再一樣就比花色（♠＞♥＞♦＞♣）。贏的那方照自己的牌型拿賠率（雙向）：五公 5 倍、妞妞 3 倍、妞八妞九 2 倍、其他 1 倍——你拿妞妞贏莊家，莊家賠你 3 倍；莊家拿妞妞贏你，你也要付 3 倍，所以每次押的錢最多是自己籌碼的五分之一。莊家和閒家都是烏龍時莊家通吃。莊家可以選輪流當或固定一個人當；組牌有時間限制（開始前選），時間到還沒亮牌會自動幫你組最好的牌。打完設定的局數比籌碼。',
    '二十一點：先選金額下注，再和莊家比點數，越接近 21 越好，超過就爆。可以要牌、停牌、前兩張時加倍，兩張一樣大可以分牌。莊家 17 點以上停牌，明牌是 A 或十點牌時會先看有沒有黑傑克。拿到黑傑克（A＋十點牌）賠 1.5 倍。打 8 局比籌碼，起始籌碼和最低下注可以選，最多 7 位玩家同桌。'][si],
  options:[{key:'speed',label:'電腦速度',def:'normal',opts:[{id:'slow',label:'慢'},{id:'normal',label:'正常'},{id:'fast',label:'快'}]},
    {key:'chips',label:'起始籌碼',only:[1],def:'1000',opts:[{id:'500',label:'500'},{id:'1000',label:'1000'},{id:'2000',label:'2000'},{id:'5000',label:'5000'}]},
    {key:'blind',label:'盲注',only:[1],def:'10/20',opts:[{id:'5/10',label:'5／10'},{id:'10/20',label:'10／20'},{id:'25/50',label:'25／50'},{id:'50/100',label:'50／100'}]},
    {key:'seats',label:'單機人數',only:[1],def:'6',opts:[{id:'4',label:'4 人'},{id:'6',label:'6 人'},{id:'8',label:'8 人'},{id:'9',label:'9 人'}]},
    {key:'t13r',label:'局數',only:[2],def:'6',opts:[{id:'4',label:'4 局'},{id:'6',label:'6 局'},{id:'8',label:'8 局'},{id:'10',label:'10 局'}]},
    {key:'bjchips',label:'起始籌碼',only:[3],def:'1000',opts:[{id:'500',label:'500'},{id:'1000',label:'1000'},{id:'2000',label:'2000'},{id:'5000',label:'5000'}]},
    {key:'bjmin',label:'最低下注',only:[3],def:'25',opts:[{id:'10',label:'10'},{id:'25',label:'25'},{id:'50',label:'50'},{id:'100',label:'100'}]},
    {key:'hrseats',label:'單機人數',only:[4],def:'4',opts:[2,3,4,5,6,7,8].map(n=>({id:String(n),label:n+' 人'}))},
    {key:'hrlen',label:'賽道長度',only:[4],def:'6',opts:[5,6,7,8].map(n=>({id:String(n),label:n+' 格'}))},
    {key:'hrbet',label:'每場下注',only:[4],def:'50',opts:[{id:'10',label:'10'},{id:'50',label:'50'},{id:'100',label:'100'}]},
    {key:'hrr',label:'場數',only:[4],def:'8',opts:[{id:'5',label:'5 場'},{id:'8',label:'8 場'},{id:'10',label:'10 場'}]},
    {key:'hrpen',label:'翻開賽道牌',only:[4],def:'back',opts:[{id:'back',label:'那匹馬退後一格'},{id:'fine',label:'押那匹的人罰籌碼'}]},
    {key:'nnseats',label:'單機人數',only:[5],def:'5',opts:[2,3,4,5,6].map(n=>({id:String(n),label:n+' 人'}))},
    {key:'nnchips',label:'起始籌碼',only:[5],def:'1000',opts:[{id:'500',label:'500'},{id:'1000',label:'1000'},{id:'2000',label:'2000'}]},
    {key:'nnmin',label:'最低下注',only:[5],def:'50',opts:[{id:'10',label:'10'},{id:'50',label:'50'},{id:'100',label:'100'}]},
    {key:'nntime',label:'組牌時間',only:[5],def:'30',opts:[{id:'15',label:'15 秒'},{id:'30',label:'30 秒'},{id:'45',label:'45 秒'},{id:'60',label:'60 秒'},{id:'none',label:'不限'}]},
    {key:'nnbank',label:'莊家',only:[5],def:'rot',opts:[{id:'rot',label:'輪流當莊'},{id:'fix',label:'固定莊家'}]},
    {key:'nnr',label:'局數',only:[5],def:'8',opts:[{id:'6',label:'6 局'},{id:'8',label:'8 局'},{id:'10',label:'10 局'}]},
    {key:'bjseats',label:'單機人數',only:[3],def:'3',opts:[2,3,4,5,6,7].map(n=>({id:String(n),label:n+' 人'}))}],
  stageHelp:si=>{ const H=[
      [['點牌','選取／取消選取，可以一次選好幾張'],['出牌','選好後按「出牌」；壓不過就按「過」'],['提示','幫你挑一手能出的牌'],['牌型','單張、一對，或五張：順子＜同花＜葫蘆＜鐵支＜同花順']],
      [['棄牌','這一手不玩了'],['過牌／跟注','跟上目前的下注金額'],['加注','拖拉桿或按 −／＋ 選金額，再按「加注到 …」'],['全下','把手上籌碼全部押上']],
      [['點牌','選取要放進墩裡的牌'],['點空位','把選好的牌放進頭墩、中墩或尾墩'],['點已放的牌','拿回手上重排'],['自動排牌','幫你排好，再按「確定」送出']],
      [['下注','拖拉桿或按 −／＋ 選金額，再按「下注」'],['要牌／停牌','再拿一張，或不要了換下一位'],['加倍','前兩張時下注加倍，只再拿一張'],['分牌','前兩張一樣大時分成兩手各自打（A 分牌各補一張）']],
      [['押馬','比賽前點一個花色按鈕下注'],['看比賽','莊家自動翻牌，翻到的花色那匹馬前進；四匹都到某一格就翻開那格的牌，翻到的退後'],['結算','押中冠軍馬的人平分彩池']],
      [['下注','閒家拖拉桿選金額，再按「下注」'],['點牌','選 3 張加起來是 10 的倍數的牌'],['亮牌','選好 3 張後按「亮牌」；湊不出來按「沒妞」'],['幫我組牌','自動挑出最好的 3 張']]][si];
    return {help:H,touchHelp:H}; },
  help:[['點牌','選取／取消選取'],['按鈕','出牌、過、跟注、加注、要牌、停牌…'],['大老二','單張、一對、五張牌型（順子＜同花＜葫蘆＜鐵支＜同花順）'],['十三支','點牌再點空位放進墩裡，或按「自動排牌」']],
  touchHelp:[['點牌','選取／取消選取'],['按鈕','出牌、過、跟注、加注、要牌、停牌…'],['十三支','點牌再點空位放進墩裡，或按「自動排牌」']],
  touch:null,
  looks:[{key:'face',label:'牌面顏色',type:'color',opts:['#fdfcf8','#fff3d6','#e6f2ff','#ffe6ee','#e9ffe6']},
    {key:'suit',label:'牌面樣式',opts:[{id:'classic',label:'經典'},{id:'four',label:'四色牌'},{id:'big',label:'大字'}]},
    {key:'back',label:'牌背顏色',opts:[{id:'red',label:'紅色'},{id:'blue',label:'藍色'},{id:'purple',label:'紫色'},{id:'green',label:'綠色'},{id:'black',label:'黑色'},{id:'gold',label:'金色'}]},
    {key:'pat',label:'牌背圖案',opts:[{id:'stripe',label:'斜紋'},{id:'dots',label:'圓點'},{id:'star',label:'星星'},{id:'plain',label:'素面'}]},
    {key:'felt',label:'桌布顏色',type:'color',opts:['#1f6b4a','#1f4f7a','#6b1f3a','#3a2d57','#5a4630','#2b2b33']},
    {key:'bg',label:'背景',opts:[{id:'auto',label:'跟著牌戲'},{id:'felt',label:'經典牌桌'},{id:'turf',label:'賽馬場'},{id:'cny',label:'過年'},{id:'casino',label:'賭場'},{id:'wood',label:'木框賭桌'},{id:'night',label:'星空'},{id:'cafe',label:'咖啡廳'}]}],
  best:{label:'最多籌碼',fmt:v=>v+' 籌碼',lower:false},
  stageShow,preview:(ctx,w,h,L,t)=>{ // 造型預覽：背景＋牌面＋牌背
    window.__pokerLook=L; drawTable(ctx,w,h,themed(L,'th'),t); setStyle(L); const k=w/480,cw=58*k,ch=84*k;
    [47,22,9,35].forEach((id,i)=>{ ctx.save(); ctx.translate(w*.36+(i-1.5)*40*k,h*.6); ctx.rotate((i-1.5)*.16); drawCard(ctx,-cw/2,-ch*.9,cw,ch,id,true); ctx.restore(); });
    drawCard(ctx,w*.66,h*.6-ch*.9,cw,ch,0,false); drawCard(ctx,w*.66+cw*.35,h*.6-ch*.85,cw,ch,0,false);
    setStyle(null); },thumb,create
};
})();
