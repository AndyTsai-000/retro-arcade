// 王城密令：陣營推理派對遊戲（5～10 人），玩法參考阿瓦隆。
// 好人（先知、護衛、忠臣）要完成 3 次密令任務；壞人（刺客、幻影師、影首、獨行者、爪牙）要讓 3 次任務失敗。
// 每輪隊長挑隊員，全體公開投票贊成／反對；過半贊成才出發，連續 5 次被否決壞人直接贏。
// 出任務的人暗中出「成功／失敗」，好人只能出成功；有一張失敗任務就失敗（7 人以上第 4 次任務要 2 張）。
// 好人完成 3 次任務後，刺客可以刺殺一個人：刺中先知，壞人翻盤。
// 單人有電腦同桌；連線各用各的手機（人不夠可以加電腦，中途離開的人由電腦接手）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const shuf=a=>{ for(let k=a.length-1;k>0;k--){ const j=Math.floor(Math.random()*(k+1)),t=a[k]; a[k]=a[j]; a[j]=t; } return a; };
const TEAM={5:[2,3,2,3,3],6:[2,3,4,3,4],7:[2,3,3,4,4],8:[3,4,4,5,5],9:[3,4,4,5,5],10:[3,4,4,5,5]};
const EVIL={5:2,6:2,7:3,8:3,9:3,10:4};
const ROLE={
  seer:{n:'先知',s:'知道誰是壞人（影首除外），但不能被刺客認出來',av:'梅林',g:1,ic:'🔮',d:'你知道誰是壞人（影首除外）。帶好人避開壞人，但別太明顯，最後刺客會找你。'},
  guard:{n:'護衛',s:'看得到先知和幻影師，分不出誰是誰',av:'派西維爾',g:1,ic:'🛡',d:'你看得到先知和幻影師，但分不出誰是誰。找出真的先知，保護他。'},
  loyal:{n:'忠臣',s:'沒有特殊能力，靠推理',av:'亞瑟的忠臣',g:1,ic:'⚔',d:'你什麼都不知道，看投票和任務結果推理誰是壞人。'},
  assassin:{n:'刺客',s:'好人過關後可以刺殺一人，刺中先知就翻盤',av:'刺客',g:0,ic:'🗡',d:'壞人。好人完成 3 次任務後，由你刺殺一個人；刺中先知就翻盤。'},
  illus:{n:'幻影師',s:'在護衛眼中假扮成先知',av:'莫甘娜',g:0,ic:'🎭',d:'壞人。在護衛眼中你跟先知長得一樣，假裝自己是先知。'},
  shadow:{n:'影首',s:'先知看不到他',av:'莫德雷德',g:0,ic:'🌑',d:'壞人。連先知都看不到你。'},
  lone:{n:'獨行者',s:'不知道同夥，同夥也不知道他',av:'奧伯倫',g:0,ic:'🐺',d:'壞人，但你不知道隊友是誰，隊友也不知道你。'},
  minion:{n:'爪牙',s:'知道其他壞人是誰',av:'莫德雷德的爪牙',g:0,ic:'💀',d:'壞人，你知道其他壞人是誰。讓任務失敗！'}};
const SETS=[{id:'basic',label:'基本',d:'先知、刺客，其他是忠臣和爪牙'},{id:'std',label:'標準',d:'再加上護衛、幻影師，7 人以上再加影首'},{id:'all',label:'全部',d:'標準再加上獨行者（10 人）'}];
const noSh=(t,L)=>L.includes('shadow')?t:t.replace('（影首除外）','');
function roleList(n,set){ const E=EVIL[n],g=['seer'],e=['assassin']; if(set!=='basic'){ g.push('guard'); e.push('illus'); } if(set!=='basic'&&E>=3) e.push('shadow'); if(set==='all'&&E>=4) e.push('lone'); /* 照推薦配置：7 人以上有影首，10 人全部再加獨行者 */
  while(g.length<n-E) g.push('loyal'); while(e.length<E) e.push('minion'); return g.concat(e); }
const PCOL=['#ff7a3d','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff5d6d','#3ddbd9','#ff9d3d','#ff7eb6','#9ad04a'];
const BOTN=['亞瑟','小蘭','阿傑','米亞','老王','珊珊','大熊','可可','阿德','露露'];
const BOTLOOK=i=>({char:['crown','cat','bunny','chef','cap','bow','pirate','ninja'][i%8],deco:['blush','','scarf','shades'][i%4]});
/* ---------- 背景：夜晚王城大廳＋圓桌 ---------- */
let BG=null;
function bg(){ if(BG) return BG; const e=document.createElement('canvas'); e.width=W*2; e.height=H*2; const c=e.getContext('2d'); c.scale(2,2);
  const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#141a3a'); g.addColorStop(.55,'#231a3e'); g.addColorStop(1,'#1a1226'); c.fillStyle=g; c.fillRect(0,0,W,H);
  /* 石牆 */ c.strokeStyle='rgba(255,255,255,.05)'; c.lineWidth=1; for(let y=0;y<200;y+=26){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); for(let x=(y/26)%2?0:30;x<W;x+=60){ c.beginPath(); c.moveTo(x,y); c.lineTo(x,y+26); c.stroke(); } }
  /* 拱窗＋月光 */ for(const x of [110,690]){ c.fillStyle='#0b1030'; c.beginPath(); c.moveTo(x-34,150); c.lineTo(x-34,70); c.arc(x,70,34,Math.PI,0); c.lineTo(x+34,150); c.closePath(); c.fill(); c.fillStyle='#fff6c8'; c.beginPath(); c.arc(x+8,64,10,0,TAU); c.fill(); c.fillStyle='rgba(255,255,255,.7)'; for(let k=0;k<6;k++){ c.fillRect(x-26+k*9,90+(k*13)%40,1.5,1.5); } c.strokeStyle='#4a3a20'; c.lineWidth=3; c.beginPath(); c.moveTo(x,36); c.lineTo(x,150); c.moveTo(x-34,104); c.lineTo(x+34,104); c.stroke(); }
  /* 旗幟 */ for(const [x,col] of [[250,'#7a2a3a'],[550,'#2a4a7a']]){ c.fillStyle=col; c.beginPath(); c.moveTo(x-22,18); c.lineTo(x+22,18); c.lineTo(x+22,104); c.lineTo(x,90); c.lineTo(x-22,104); c.closePath(); c.fill(); c.fillStyle='#e8c050'; c.font='900 22px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(x<400?'✦':'♜',x,58); }
  /* 火把光 */ for(const x of [30,770]){ const rg=c.createRadialGradient(x,120,4,x,120,140); rg.addColorStop(0,'rgba(255,170,60,.35)'); rg.addColorStop(1,'rgba(255,170,60,0)'); c.fillStyle=rg; c.fillRect(x-140,0,280,280); }
  /* 地板 */ const fg=c.createLinearGradient(0,170,0,H); fg.addColorStop(0,'#2c2036'); fg.addColorStop(1,'#140e1c'); c.fillStyle=fg; c.fillRect(0,170,W,H-170);
  /* 圓桌 */ c.fillStyle='rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(400,300,250,100,0,0,TAU); c.fill(); const tg=c.createRadialGradient(400,268,20,400,286,260); tg.addColorStop(0,'#8a5a32'); tg.addColorStop(1,'#4a2c16'); c.fillStyle=tg; c.beginPath(); c.ellipse(400,284,246,96,0,0,TAU); c.fill(); c.strokeStyle='#c89650'; c.lineWidth=4; c.stroke();
  c.strokeStyle='rgba(255,220,150,.12)'; c.lineWidth=2; c.beginPath(); c.ellipse(400,284,200,76,0,0,TAU); c.stroke();
  BG=e; return e; }
/* 小圖：任務標記 */
function token(c,x,y,r,st,num,cur,two){ c.save(); c.translate(x,y);
  if(cur){ c.fillStyle='rgba(255,210,63,.3)'; c.beginPath(); c.arc(0,0,r+6,0,TAU); c.fill(); }
  c.fillStyle=st==='ok'?'#3a8aff':st==='fail'?'#e8364a':'#2a2440'; c.beginPath(); c.arc(0,0,r,0,TAU); c.fill(); c.strokeStyle=cur?'#ffd23f':'#c89650'; c.lineWidth=3; c.stroke();
  c.fillStyle='#fff'; c.textAlign='center'; c.textBaseline='middle'; c.font='900 '+(st?16:15)+'px '+TC; c.fillText(st==='ok'?'✔':st==='fail'?'✘':num+'人',0,1);
  if(two&&!st){ c.font='700 9px '+TC; c.fillStyle='#ffb0b8'; c.fillText('要2張失敗',0,r+9); } c.restore(); }
function qcard(c,x,y,w,h,face,ok,sc){ c.save(); c.translate(x,y); c.scale(Math.max(.05,Math.abs(sc)),1); c.fillStyle='rgba(0,0,0,.35)'; rr(c,-w/2+3,-h/2+4,w,h,8); c.fill();
  if(!face){ c.fillStyle='#3a2a5a'; rr(c,-w/2,-h/2,w,h,8); c.fill(); c.strokeStyle='#e8c050'; c.lineWidth=2.5; c.stroke(); c.fillStyle='#e8c050'; c.font='900 22px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('✦',0,1); }
  else { c.fillStyle=ok?'#3a8aff':'#e8364a'; rr(c,-w/2,-h/2,w,h,8); c.fill(); c.strokeStyle='#fff'; c.lineWidth=2.5; c.stroke(); c.fillStyle='#fff'; c.font='900 24px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(ok?'✔':'✘',0,-6); c.font='900 11px '+TC; c.fillText(ok?'成功':'失敗',0,h/2-12); }
  c.restore(); }
function create(env,opts){
  const {ctx:c,canvas}=env.canvas2d(W,H),net=opts.net,client=!!net&&!net.host,host=!client,pv=!!opts.preview,OP=opts.options||{};
  const humans=pv?0:net?net.count:1,n=clamp(pv?7:net?net.count:7,5,10),me=pv?-1:net?net.me:0,SET=OP.roles||'std';
  const names=[],looks=[],bot=[]; for(let i=0;i<n;i++){ const h=i<humans; bot.push(!h); names.push(h?(net?(net.names&&net.names[i])||'玩家'+(i+1):(opts.name||'你')):BOTN[i%BOTN.length]); looks.push(h?(net?(net.looks&&net.looks[i])||BOTLOOK(i):opts.look||BOTLOOK(i)):BOTLOOK(i)); }
  const colOf=i=>{ const L=looks[i]; return !L||!L.color||L.color==='auto'?PCOL[i%PCOL.length]:L.color; };
  const SP=pv?.35:1,SIZES=TEAM[n],E=EVIL[n];
  const newG=()=>{ const role=shuf(roleList(n,SET)); return {ph:'intro',PT:pv?1:2.5,role,ready:Array(n).fill(false),q:0,lead:Math.floor(Math.random()*n),rej:0,team:[],vote:Array(n).fill(null),qc:Array(n).fill(null),cards:[],res:[],props:[],msg:'',target:-1,win:null,why:'',evN:0}; };
  let G=newG();
  let t=0,ended=false,sendT=0,btns=[],hoverB=-1,fx=[],showRole=false,sel=-1,prevKey='',revealT=0,botAt=Array(n).fill(0),shake=0;
  const sfx=k=>{ if(!pv) env.sfx(k); };
  const tone=(f,d,type,v)=>{ const A=env.audio&&env.audio(); if(!A||pv) return; try{ const o=A.createOscillator(),g=A.createGain(),t0=A.currentTime; o.type=type||'triangle'; o.frequency.value=f; g.gain.setValueAtTime(v||.06,t0); g.gain.exponentialRampToValueAtTime(.001,t0+d); o.connect(g); g.connect((env.out&&env.out())||A.destination); o.start(t0); o.stop(t0+d+.02); }catch(e){} };
  const isEvil=i=>!ROLE[G.role[i]].g;
  const need=q=>q===3&&n>=7?2:1;
  const succ=()=>G.res.filter(r=>r.ok).length,fails=()=>G.res.filter(r=>!r.ok).length;
  /* 誰知道誰：回傳 i 眼中 j 的標籤 */
  function know(i,j){ if(i<0||j===i) return ''; const ri=G.role[i],rj=G.role[j];
    if(!ROLE[ri].g&&ri!=='lone'&&!ROLE[rj].g&&rj!=='lone') return 'evil';
    if(ri==='seer'&&!ROLE[rj].g&&rj!=='shadow') return 'evil';
    if(ri==='guard'&&(rj==='seer'||rj==='illus')) return 'seer?';
    return ''; }
  /* ---------- 電腦的推理（只在房主算） ---------- */
  const sus=Array(n).fill(0),priv=Array.from({length:n},()=>Array(n).fill(0)); // 大家公開看得到的可疑程度；priv＝每個人自己出任務得到的線索
  function botSus(i,j){ const k=know(i,j); if(k==='evil'&&G.role[i]!=='seer') return 50; let s=sus[j]+priv[i][j]; if(k==='seer?') s-=1.2; if(G.role[i]==='seer'&&isEvil(j)&&G.role[j]!=='shadow') s+=3; /* 先知看得到壞人，但不會做得太明顯 */ return s; }
  function botTeam(i){ const k=SIZES[G.q],others=[...Array(n).keys()].filter(j=>j!==i);
    if(isEvil(i)){ /* 壞人隊長：自己加上看起來最乾淨的好人 */ const good=others.filter(j=>know(i,j)!=='evil').sort((a,b)=>sus[a]-sus[b]+(Math.random()-.5)*.8); return [i].concat(good.slice(0,k-1)); }
    const sorted=others.sort((a,b)=>botSus(i,a)-botSus(i,b)+(Math.random()-.5)*(G.role[i]==='seer'?.6:.4)); return [i].concat(sorted.slice(0,k-1)); }
  function botVote(i){ const T=G.team; if(G.lead===i&&!isEvil(i)) return true; if(G.rej>=4) return !isEvil(i)||Math.random()<.25; // 第 5 次提案：好人一定贊成
    if(isEvil(i)){ const ev=T.some(j=>j===i||know(i,j)==='evil'); return ev?Math.random()<.9:Math.random()<.3; }
    if(G.role[i]==='seer'){ const bad=T.some(j=>isEvil(j)&&G.role[j]!=='shadow'); return bad?Math.random()<.3:Math.random()<.85; } /* 先知不能太明顯 */
    if(G.q===0&&G.rej===0) return Math.random()<.8;
    /* 照自己的可疑度排：最可信的 n-1-壞人數 個人以外的都不想讓他出任務 */ const ord=[...Array(n).keys()].filter(j=>j!==i).sort((a,b)=>botSus(i,a)-botSus(i,b)),trust=ord.slice(0,n-1-E),lim=botSus(i,ord[n-2-E]);
    return T.every(j=>j===i||trust.includes(j)||botSus(i,j)<=lim+.05)||Math.random()<.06; }
  function botQuest(i){ if(!isEvil(i)) return true; const evT=G.team.filter(j=>isEvil(j)); if(G.role[i]==='lone') return Math.random()<.25;
    const known=evT.filter(j=>G.role[j]!=='lone').sort((a,b)=>a-b),nd=need(G.q);
    if(nd>=2) return known.length<2?Math.random()<.5:false;
    if(known[0]!==i) return true; // 一張失敗就夠，讓同夥裡號碼最小的人出
    return Math.random()<[.45,.3,.15,.1,.1][G.q]; } /* 前面幾次比較會藏，不急著出失敗 */
  function botAssn(i){ const cand=[...Array(n).keys()].filter(j=>j!==i&&know(i,j)!=='evil'),sc={};
    for(const j of cand){ let s=0; for(const p of G.props){ const bad=p.team.some(x=>isEvil(x)&&G.role[x]!=='shadow'); if(p.votes[j]===false&&bad) s+=1; if(p.votes[j]===true&&bad) s-=1; if(p.votes[j]===false&&!bad) s-=.3; if(p.lead===j&&!bad) s+=.6; if(p.lead===j&&bad) s-=1.5; } sc[j]=s; }
    /* 照分數抽籤：越像先知越容易被選，但不會每次都猜中 */ const wt=cand.map(j=>Math.exp(sc[j]*.45)),tot=wt.reduce((x,y)=>x+y,0); let r=Math.random()*tot; for(let k=0;k<cand.length;k++){ r-=wt[k]; if(r<=0) return cand[k]; } return cand[0]; }
  /* ---------- 房主流程 ---------- */
  const nextLead=()=>{ G.lead=(G.lead+1)%n; };
  function toPick(){ G.ph='pick'; G.team=[]; G.vote=Array(n).fill(null); G.qc=Array(n).fill(null); G.PT=(bot[G.lead]?2.6:0)*SP; G.evN++; }
  function propose(T){ if(G.ph!=='pick'||T.length!==SIZES[G.q]) return; G.team=T.slice(); G.ph='vote'; G.vote=Array(n).fill(null); G.PT=0; for(let i=0;i<n;i++) botAt[i]=(1+Math.random()*2.2)*SP; G.msg=names[G.lead]+' 派出：'+T.map(j=>names[j]).join('、'); G.evN++; }
  function castVote(i,v){ if(G.ph!=='vote'||G.vote[i]!=null) return; G.vote[i]=!!v; if(G.vote.every(x=>x!=null)){ const yes=G.vote.filter(x=>x).length,ok=yes>n/2; G.props.push({q:G.q,lead:G.lead,team:G.team.slice(),votes:G.vote.slice(),ok});
      /* 公開的可疑度：贊成被否決的爛隊伍……這裡只記錄，任務結果出來再算 */ G.ph='vres'; G.ok=ok; G.yes=yes; G.PT=3.4*SP; G.evN++; } }
  function afterVote(){ if(G.ok){ G.ph='quest'; G.qc=Array(n).fill(null); for(const i of G.team) botAt[i]=(1+Math.random()*2)*SP; G.PT=0; G.evN++; return; }
    G.rej++; if(G.rej>=5){ endGame('evil','連續 5 次隊伍被否決'); return; } nextLead(); toPick(); }
  function playCard(i,ok){ if(G.ph!=='quest'||!G.team.includes(i)||G.qc[i]!=null) return; if(!isEvil(i)) ok=true; /* 好人只能出成功 */ G.qc[i]=!!ok;
    if(G.team.every(j=>G.qc[j]!=null)){ const cards=shuf(G.team.map(j=>G.qc[j])),f=cards.filter(x=>!x).length,ok2=f<need(G.q); G.cards=cards; G.res.push({q:G.q,lead:G.lead,team:G.team.slice(),f,ok:ok2});
      /* 更新大家看得到的可疑度 */ const p=G.props[G.props.length-1]; for(const i of G.team) if(!isEvil(i)) for(const j of G.team) if(j!==i) priv[i][j]+=f?3*f/(G.team.length-1):-.6; /* 自己是好人：失敗牌一定是別人出的 */
      if(!ok2||f){ for(const j of G.team) sus[j]+=3*f/G.team.length; sus[G.lead]+=.8; p&&p.votes.forEach((v,j)=>{ if(v) sus[j]+=.8; else sus[j]-=.5; }); } else { for(const j of G.team) sus[j]-=.3; p&&p.votes.forEach((v,j)=>{ if(v) sus[j]-=.2; else sus[j]+=.5; }); }
      G.ph='qres'; G.PT=(1.2+cards.length*.7+2.6)*SP; G.evN++; } }
  function afterQuest(){ G.rej=0; if(succ()>=3){ G.ph='assn'; G.target=-1; G.PT=(bot[assassin()]?3.5:0)*SP; G.evN++; return; } if(fails()>=3){ endGame('evil','3 次任務失敗'); return; } G.q++; nextLead(); toPick(); }
  const assassin=()=>G.role.indexOf('assassin');
  function stab(i,tg){ if(G.ph!=='assn'||i!==assassin()||tg===i||tg<0||tg>=n) return; G.target=tg; const hit=G.role[tg]==='seer'; endGame(hit?'evil':'good',hit?'刺客刺中了先知 '+names[tg]:'好人完成 3 次任務，刺客沒刺中先知'); }
  function endGame(w,why){ G.win=w; G.why=why; G.ph='final'; G.PT=(pv?4:5)*SP; G.evN++; }
  function doAct(from,a){ if(!a||ended) return;
    if(a.k==='ready'&&G.ph==='role') G.ready[from]=true;
    else if(a.k==='prop'&&G.ph==='pick'&&from===G.lead&&Array.isArray(a.t)){ const T=[...new Set(a.t.map(x=>x|0))].filter(x=>x>=0&&x<n); propose(T); }
    else if(a.k==='vote') castVote(from,a.v);
    else if(a.k==='card') playCard(from,a.v);
    else if(a.k==='stab') stab(from,a.i|0); }
  function hostStep(dt){ G.PT-=dt;
    if(G.ph==='intro'){ if(G.PT<=0){ G.ph='role'; G.ready=bot.slice(); G.PT=pv?2:0; G.evN++; } }
    else if(G.ph==='role'){ if(pv?G.PT<=0:G.ready.every(x=>x)){ G.msg='第 1 次任務，隊長是 '+names[G.lead]; toPick(); } }
    else if(G.ph==='pick'){ if(bot[G.lead]&&G.PT<=0) propose(botTeam(G.lead)); }
    else if(G.ph==='vote'){ for(let i=0;i<n;i++) if(bot[i]&&G.vote[i]==null){ botAt[i]-=dt; if(botAt[i]<=0) castVote(i,botVote(i)); } }
    else if(G.ph==='vres'){ if(G.PT<=0) afterVote(); }
    else if(G.ph==='quest'){ for(const i of G.team) if(bot[i]&&G.qc[i]==null){ botAt[i]-=dt; if(botAt[i]<=0) playCard(i,botQuest(i)); } }
    else if(G.ph==='qres'){ if(G.PT<=0) afterQuest(); }
    else if(G.ph==='assn'){ const a=assassin(); if(bot[a]&&G.PT<=0) stab(a,botAssn(a)); }
    else if(G.ph==='final'&&G.PT<=0&&!ended){ if(pv){ G=newG(); sus.fill(0); priv.forEach(r=>r.fill(0)); return; } ended=true; if(net) net.send({G,end:1}); finish(); }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/8; net.send({G}); } } }
  if(net){ if(client) net.onmsg=m=>{ if(m.G) G=m.G; if(m.end&&!ended){ ended=true; finish(); } };
    else { net.onmsg=(m,from)=>{ if(m.a) doAct(from,m.a); }; net.onleave=i=>{ if(i>0&&i<n&&!bot[i]){ bot[i]=true; names[i]+='（離開，電腦代打）'; G.ready[i]=true; botAt[i]=1; if(G.ph==='pick'&&G.lead===i) G.PT=1.5; if(G.ph==='assn'&&assassin()===i) G.PT=2; } }; } }
  const act=a=>{ if(pv) return; if(client) net.send({a}); else doAct(me,a); };
  function finish(){ const mine=me>=0?(G.win==='good')===!isEvil(me):false;
    if(mine){ try{ localStorage.setItem('arcade.mission.w',String((+localStorage.getItem('arcade.mission.w')||0)+1)); }catch(e){} }
    const rows=G.res.map((r,k)=>'<tr><td>'+(k+1)+'</td><td>'+names[r.lead]+'</td><td>'+r.team.map(j=>names[j]).join('、')+'</td><td>'+(r.ok?'✔ 成功':'✘ 失敗')+(r.f?'（'+r.f+' 張失敗）':'')+'</td></tr>').join('');
    const roles=[...Array(n).keys()].map(i=>'<tr><td>'+names[i]+'</td><td>'+ROLE[G.role[i]].ic+' '+ROLE[G.role[i]].n+'</td><td>'+(isEvil(i)?'壞人':'好人')+'</td></tr>').join('');
    env.end({title:G.win==='good'?'好人獲勝！':'壞人獲勝！',big:me<0?'':mine?'🏆 你的陣營贏了':'你的陣營輸了',text:G.why,
      html:'<table class="ls"><tr><th>任務</th><th>隊長</th><th>隊員</th><th>結果</th></tr>'+rows+'</table><table class="ls"><tr><th>玩家</th><th>角色</th><th>陣營</th></tr>'+roles+'</table>',score:null}); }
  /* ---------- 輸入 ---------- */
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const inR=(x,y,b)=>x>=b.x&&y>=b.y&&x<=b.x+b.w&&y<=b.y+b.h;
  const pd=e=>{ if(pv) return; const [x,y]=toG(e); for(let k=btns.length-1;k>=0;k--) if(inR(x,y,btns[k])){ btns[k].fn(); return; } };
  const pm=e=>{ if(pv) return; const [x,y]=toG(e); hoverB=-1; for(let k=btns.length-1;k>=0;k--) if(inR(x,y,btns[k])){ hoverB=k; break; } canvas.style.cursor=hoverB>=0?'pointer':''; };
  canvas.addEventListener('pointerdown',pd); canvas.addEventListener('pointermove',pm);
  let pickSel=[];
  const iLead=()=>me>=0&&G.ph==='pick'&&G.lead===me;
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt; if(host) hostStep(dt); else G.PT-=dt;
    if(!iLead()) pickSel=[]; else pickSel=pickSel.filter(j=>j>=0&&j<n);
    if(G.ph!=='assn') sel=-1;
    const key=G.ph+'|'+G.q+'|'+G.rej+'|'+G.res.length; if(key!==prevKey){ onChange(prevKey.split('|')[0]); prevKey=key; }
    if(G.ph==='qres') revealT+=dt; if(shake>0) shake=Math.max(0,shake-dt*2);
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=380*dt; f.r+=f.vr*dt; if(f.l<=0) fx.splice(i,1); }
    if(!pv&&me>=0){ if(G.ph==='role'&&!G.ready[me]&&(env.hit('Space')||env.hit('Enter'))) act({k:'ready'}); } }
  function onChange(op){ if(G.ph==='role') { sfx('item'); showRole=false; }
    if(G.ph==='pick') tone(520,.12); if(G.ph==='vote') tone(660,.1); if(G.ph==='vres') sfx(G.ok?'click':'bump');
    if(G.ph==='quest') tone(440,.2,'sine'); if(G.ph==='qres'){ revealT=0; }
    if(G.ph==='assn') sfx('trap'); if(G.ph==='final'){ const mine=me>=0&&(G.win==='good')===!isEvil(me); sfx(me<0?'win':mine?'win':'lose'); if(mine||me<0) burst(); } }
  function burst(){ for(let k=0;k<60;k++) fx.push({x:400+(Math.random()-.5)*300,y:220,vx:(Math.random()-.5)*480,vy:-220-Math.random()*240,l:1.8,c:['#ffd23f','#3a8aff','#fff','#e8c050'][k%4],r:0,vr:(Math.random()-.5)*12}); }
  /* ---------- 版面 ---------- */
  function seat(i){ const k=me>=0?i-me:i,a=Math.PI/2+k/n*TAU; return [400+Math.cos(a)*322,286+Math.sin(a)*150]; }
  function hit(x,y,w,h,fn){ btns.push({x,y,w,h,fn:()=>{ sfx('click'); fn(); }}); }
  function btn(x,y,w,h,tx,col,fn,sub,dis){ const k=btns.length,hv=hoverB===k&&!dis; if(!dis) hit(x,y,w,h,fn); else btns.push({x,y,w,h,fn:()=>{}}); c.save(); c.globalAlpha=dis?.45:1; c.shadowColor='rgba(0,0,0,.45)'; c.shadowBlur=10; c.shadowOffsetY=4; c.fillStyle=col; rr(c,x,y-(hv?2:0),w,h,14); c.fill(); c.restore(); c.save(); c.globalAlpha=dis?.45:1; c.fillStyle='rgba(255,255,255,.25)'; rr(c,x+4,y+3-(hv?2:0),w-8,h*.38,10); c.fill();
    c.fillStyle='#1a1430'; c.font='900 '+(h>44?17:14)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(tx,x+w/2,y+h/2-(sub?7:0)-(hv?2:0)); if(sub){ c.font='700 11px '+TC; c.fillStyle='rgba(26,20,48,.7)'; c.fillText(sub,x+w/2,y+h-10-(hv?2:0)); } c.restore(); }
  function txt(s,x,y,font,col,align){ c.font=font; c.fillStyle=col; c.textAlign=align||'center'; c.textBaseline='middle'; c.fillText(s,x,y); }
  function pill(s,x,y,bgc,fg,font){ c.font=font||'900 11px '+TC; const w=c.measureText(s).width+12; c.fillStyle=bgc; rr(c,x-w/2,y-8,w,16,8); c.fill(); c.fillStyle=fg; c.textAlign='center'; c.textBaseline='middle'; c.fillText(s,x,y+.5); }
  function draw(){ btns=[]; c.save(); if(shake>0) c.translate((Math.random()-.5)*8*shake,0); c.drawImage(bg(),0,0,W,H);
    /* 上方：任務進度＋否決次數 */ c.fillStyle='rgba(10,8,24,.72)'; rr(c,226,6,348,58,16); c.fill();
    const hideLast=G.ph==='qres'&&revealT<1+G.cards.length*.7; for(let k=0;k<5;k++){ const r=hideLast&&k===G.res.length-1?null:G.res[k]; token(c,270+k*65,30,20,r?(r.ok?'ok':'fail'):'',SIZES[k],G.q===k&&!r&&G.ph!=='final'&&G.ph!=='assn',k===3&&n>=7); }
    c.fillStyle='rgba(10,8,24,.72)'; rr(c,590,8,200,30,12); c.fill(); txt('否決',618,23,'700 12px '+TC,'#f0e0ff'); for(let k=0;k<5;k++){ c.fillStyle=k<G.rej?'#ff6a7a':'rgba(255,255,255,.18)'; c.beginPath(); c.arc(652+k*24,23,8,0,TAU); c.fill(); if(k===4){ c.strokeStyle='#ff6a7a'; c.lineWidth=2; c.stroke(); } }
    /* 左上：我的角色 */ if(me>=0&&G.ph!=='intro'){ const R=ROLE[G.role[me]],ev=isEvil(me); btn(10,8,200,40,R.ic+' 你是「'+R.n+'」',ev?'#ff8a9a':'#8ac4ff',()=>{ showRole=!showRole; },'點我看角色說明'); }
    /* 人物 */ for(let i=0;i<n;i++) person(i);
    centerUI(); if(showRole&&G.ph!=='role') roleCard(false);
    if(G.ph==='role'&&me>=0) roleCard(true);
    for(const f of fx){ c.save(); c.globalAlpha=Math.min(1,f.l); c.translate(f.x,f.y); c.rotate(f.r); c.fillStyle=f.c; c.fillRect(-4,-2.5,8,5); c.restore(); }
    c.restore(); }
  function person(i){ const [x,y]=seat(i),C=window.ARCADE_CHAR,L=looks[i]||{},onT=G.team.includes(i)&&['vote','vres','quest','qres'].includes(G.ph),picked=iLead()&&pickSel.includes(i);
    const lit=onT||picked||(G.ph==='assn'&&sel===i)||(G.ph==='final'&&G.target===i);
    if(lit){ c.fillStyle=G.ph==='assn'||G.ph==='final'?'rgba(255,90,110,.35)':'rgba(255,210,63,.3)'; c.beginPath(); c.ellipse(x,y+2,36,11,0,0,TAU); c.fill(); }
    c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x,y,15,5,0,0,TAU); c.fill();
    if(C) C.drawChar(c,x,y-16,colOf(i),1,false,t+i*.7,1.05,L.char||'cap',L.deco||'');
    if(G.lead===i&&G.ph!=='final'&&G.ph!=='assn') pill('👑 隊長',x,y-70,'#ffd23f','#2a1e0e');
    if(onT||picked) txt('🛡',x+24,y-30,'16px '+TC,'#fff');
    /* 名字牌：我知道的資訊直接標在名字上（紅＝壞人、紫＝可能是先知；結束時亮出全部角色） */ const nm=(i===me?'你':names[i]).slice(0,6),k=know(me,i);
    if(G.ph==='final') pill(ROLE[G.role[i]].n+'・'+nm,x,y+10,isEvil(i)?'#e8364a':'#3a8aff','#fff');
    else if(k==='evil') pill('😈 '+nm,x,y+10,'#e8364a','#fff'); else if(k==='seer?') pill('🔮? '+nm,x,y+10,'#8a5ad8','#fff');
    else pill(nm,x,y+10,i===me?'#ffd23f':'rgba(14,10,30,.82)',i===me?'#2a1e0e':'#fff');
    /* 投票泡泡 */ if((G.ph==='vres')&&G.vote[i]!=null){ const v=G.vote[i]; c.fillStyle=v?'#3ac46a':'#e8364a'; c.beginPath(); c.arc(x-26,y-48,14,0,TAU); c.fill(); c.strokeStyle='#fff'; c.lineWidth=2; c.stroke(); txt(v?'✔':'✘',x-26,y-47,'900 15px '+TC,'#fff'); }
    else if(G.ph==='vote'){ txt(G.vote[i]!=null?'✉':'💭',x-26,y-48,'15px '+TC,'#fff'); }
    else if(G.ph==='quest'&&G.team.includes(i)){ txt(G.qc[i]!=null?'✉':'💭',x-26,y-48,'15px '+TC,'#fff'); }
    /* 可以點的人 */ if(iLead()){ hit(x-32,y-62,64,82,()=>{ const p=pickSel.indexOf(i); if(p>=0) pickSel.splice(p,1); else if(pickSel.length<SIZES[G.q]) pickSel.push(i); }); }
    if(G.ph==='assn'&&me===assassin()&&i!==me&&know(me,i)!=='evil'){ hit(x-30,y-64,60,84,()=>{ sel=i; }); c.strokeStyle='rgba(255,90,110,'+(.4+.4*Math.sin(t*6))+')'; c.lineWidth=2; c.beginPath(); c.ellipse(x,y-20,30,40,0,0,TAU); c.stroke(); } }
  function panel(y,h){ c.fillStyle='rgba(12,8,28,.82)'; rr(c,230,y,340,h,18); c.fill(); }
  function centerUI(){ const k=SIZES[G.q],lead=G.lead===me?'你':names[G.lead];
    if(G.ph==='intro'){ panel(170,150); txt('王城密令',400,204,'900 30px '+TC,'#ffd23f'); txt(n+' 人：好人 '+(n-E)+'、壞人 '+E,400,240,'700 15px '+TC,'#fff'); txt('好人完成 3 次任務就贏，壞人要讓 3 次任務失敗',400,268,'700 13px '+TC,'#e0d0ff'); txt('發角色中…',400,296,'700 13px '+TC,'#aaa0c8'); return; }
    if(G.ph==='role'){ if(me<0) { panel(200,90); txt('大家看自己的角色…',400,245,'900 18px '+TC,'#fff'); } return; }
    if(G.ph==='pick'){ panel(178,140); txt('第 '+(G.q+1)+' 次任務：派 '+k+' 人'+(need(G.q)>1?'（要 2 張失敗才算失敗）':''),400,198,'900 16px '+TC,'#ffd23f');
      if(iLead()){ txt('你是隊長！點人物選隊員（可以選自己）',400,226,'700 13px '+TC,'#fff'); txt('已選：'+(pickSel.length?pickSel.map(j=>j===me?'你':names[j]).join('、'):'—'),400,250,'700 13px '+TC,'#e0d0ff');
        btn(310,266,180,44,'派出隊伍（'+pickSel.length+'/'+k+'）','#ffd23f',()=>{ act({k:'prop',t:pickSel.slice()}); pickSel=[]; },'',pickSel.length!==k); }
      else { txt('👑 '+lead+' 正在挑隊員…',400,238,'900 17px '+TC,'#fff'); txt(G.rej?'已經否決 '+G.rej+' 次，第 5 次被否決壞人直接贏':'大家可以討論該派誰',400,268,'700 12px '+TC,G.rej>=3?'#ff9aa8':'#c8b8e8'); }
      return; }
    if(G.ph==='vote'){ panel(178,140); txt('隊伍：'+G.team.map(j=>j===me?'你':names[j]).join('、'),400,198,'900 15px '+TC,'#ffd23f'); const done=G.vote.filter(v=>v!=null).length;
      if(me>=0&&G.vote[me]==null){ txt('贊成這支隊伍出任務嗎？（投票會公開）',400,224,'700 13px '+TC,'#fff'); btn(250,244,140,56,'✔ 贊成','#7ae0a0',()=>act({k:'vote',v:true})); btn(410,244,140,56,'✘ 反對','#ff8a9a',()=>act({k:'vote',v:false})); if(G.rej>=4) txt('這是第 5 次提案，再被否決壞人就贏了',400,308,'700 11px '+TC,'#ff9aa8'); }
      else txt('已投票 '+done+' / '+n+'，等其他人…',400,250,'700 15px '+TC,'#fff'); return; }
    if(G.ph==='vres'){ panel(190,110); txt(G.ok?'✔ 通過，隊伍出發！':'✘ 被否決，換下一位隊長',400,226,'900 20px '+TC,G.ok?'#7ae0a0':'#ff8a9a'); txt('贊成 '+G.yes+' 票、反對 '+(n-G.yes)+' 票',400,262,'700 14px '+TC,'#fff'); return; }
    if(G.ph==='quest'){ panel(178,140); txt('任務進行中：'+G.team.map(j=>j===me?'你':names[j]).join('、'),400,198,'900 15px '+TC,'#ffd23f');
      if(me>=0&&G.team.includes(me)&&G.qc[me]==null){ const ev=isEvil(me); txt(ev?'偷偷選：讓任務成功，還是失敗？':'你是好人，只能讓任務成功',400,224,'700 13px '+TC,'#fff');
        btn(ev?250:310,244,ev?140:180,56,'✔ 成功','#8ac4ff',()=>act({k:'card',v:true})); if(ev) btn(410,244,140,56,'✘ 失敗','#ff8a9a',()=>act({k:'card',v:false})); }
      else { const d=G.team.filter(j=>G.qc[j]!=null).length; txt('隊員暗中出牌 '+d+' / '+G.team.length+'…',400,250,'700 15px '+TC,'#fff'); } return; }
    if(G.ph==='qres'){ const cs=G.cards,m=cs.length,w=46,h=64,gap=8,x0=400-(m*(w+gap)-gap)/2+w/2; panel(170,160); txt('第 '+(G.q+1)+' 次任務結果',400,188,'900 15px '+TC,'#ffd23f');
      cs.forEach((ok,k)=>{ const tt=clamp((revealT-1-k*.7)/.3,0,1); if(tt>0&&tt<1&&Math.abs(tt-.5)<.05&&!ok) shake=.6; qcard(c,x0+k*(w+gap),246,w,h,tt>=.5,ok,Math.cos(tt*Math.PI)); });
      if(revealT>1+m*.7){ const r=G.res[G.res.length-1]; txt(r.ok?'✔ 任務成功！':'✘ 任務失敗！（'+r.f+' 張失敗）',400,304,'900 18px '+TC,r.ok?'#8ac4ff':'#ff6a7a'); } return; }
    if(G.ph==='assn'){ const a=assassin(); panel(170,160); txt('好人完成 3 次任務！',400,190,'900 17px '+TC,'#8ac4ff'); txt('最後機會：刺客刺中先知，壞人就翻盤',400,216,'700 13px '+TC,'#fff');
      if(me===a){ txt(sel>=0?'要刺殺 '+names[sel]+' 嗎？':'點你覺得是先知的人',400,244,'900 15px '+TC,'#ffd23f'); btn(320,262,160,46,'🗡 刺殺','#ff8a9a',()=>act({k:'stab',i:sel}),'',sel<0); }
      else txt((me>=0&&isEvil(me)?'刺客 '+names[a]+' 正在找先知…（可以跟刺客討論）':'刺客正在找先知…'),400,256,'900 15px '+TC,'#ffd23f'); return; }
    if(G.ph==='final'){ panel(176,130); txt(G.win==='good'?'🏆 好人獲勝！':'😈 壞人獲勝！',400,214,'900 26px '+TC,G.win==='good'?'#8ac4ff':'#ff6a7a'); txt(G.why,400,252,'700 13px '+TC,'#fff'); if(G.target>=0) txt('刺客刺殺了 '+names[G.target]+'（'+ROLE[G.role[G.target]].n+'）',400,278,'700 12px '+TC,'#ffd23f'); } }
  function roleCard(first){ const R=ROLE[G.role[me]],ev=isEvil(me); c.fillStyle='rgba(6,4,16,.6)'; c.fillRect(0,0,W,H); c.fillStyle=ev?'#3a1424':'#14244a'; rr(c,220,70,360,330,22); c.fill(); c.strokeStyle=ev?'#ff6a7a':'#8ac4ff'; c.lineWidth=3; c.stroke();
    txt(R.ic,400,112,'40px '+TC,'#fff'); txt('你是「'+R.n+'」',400,156,'900 24px '+TC,'#fff'); txt('（＝阿瓦隆的'+R.av+'）',400,180,'700 12px '+TC,'#c8b8e8'); pill(ev?'壞人陣營':'好人陣營',400,200,ev?'#e8364a':'#3a8aff','#fff','900 12px '+TC);
    c.font='700 13px '+TC; const lines=wrapL(noSh(R.d,G.role),300); lines.forEach((l,k)=>txt(l,400,226+k*20,'700 13px '+TC,'#f0e8ff'));
    const ev2=[],sq=[]; for(let j=0;j<n;j++){ const k=know(me,j); if(k==='evil') ev2.push(names[j]); if(k==='seer?') sq.push(names[j]); }
    let y=236+lines.length*20; if(ev2.length){ txt((G.role[me]==='seer'?'你看到的壞人：':'你的壞人同夥：')+ev2.join('、'),400,y,'900 13px '+TC,'#ff9aa8'); y+=22; }
    if(sq.length) { txt('先知是其中一個：'+sq.join('、'),400,y,'900 13px '+TC,'#c8a8ff'); y+=22; }
    if(G.role[me]==='lone') { txt('你不知道其他壞人是誰',400,y,'700 12px '+TC,'#ffb0b8'); }
    if(first){ if(!G.ready[me]) btn(320,334,160,50,'看好了','#ffd23f',()=>act({k:'ready'}),env.touch?'':'空白鍵'); else txt('等其他人看完角色…（'+G.ready.filter(x=>x).length+'/'+n+'）',400,358,'700 13px '+TC,'#fff'); }
    else btn(340,340,120,42,'關閉','#d8d0f0',()=>{ showRole=false; }); }
  function wrapL(s,w){ const out=[]; let cur=''; for(const ch of s){ if(c.measureText(cur+ch).width>w){ out.push(cur); cur=ch; } else cur+=ch; } if(cur) out.push(cur); return out; }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',pd); canvas.removeEventListener('pointermove',pm); },
    _dbg:{get G(){ return G; },set G(v){ G=v; },reset(){ G=newG(); sus.fill(0); priv.forEach(r=>r.fill(0)); },doAct,bot,names,n,know,sus,propose,castVote,playCard,stab,botTeam}};
}
function thumb(ctx,w,h,t){ ctx.save(); ctx.scale(w/W,h/H); const c=ctx; c.drawImage(bg(),0,0,W,H); const C=window.ARCADE_CHAR;
  for(let i=0;i<7;i++){ const a=Math.PI/2+i/7*TAU,x=400+Math.cos(a)*322,y=286+Math.sin(a)*150; if(C) C.drawChar(c,x,y-16,PCOL[i],1,false,t+i,1.05,BOTLOOK(i).char,BOTLOOK(i).deco); if(i===2) { c.font='900 12px '+TC; c.textAlign='center'; c.fillStyle='#ffd23f'; c.fillText('👑 隊長',x,y-70); } }
  const st=['ok','fail','ok','',''],ph=Math.floor(t/2)%4; for(let k=0;k<5;k++) token(c,270+k*65,34,20,k<=ph-1?st[k]:'',TEAM[7][k],k===ph,k===3);
  const cards=[true,false,true],tt=(t%4)/4; cards.forEach((ok,k)=>{ const f=clamp((tt-.2-k*.15)/.1,0,1); qcard(c,340+k*60,256,48,66,f>=.5,ok,Math.cos(f*Math.PI)); });
  c.font='900 28px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=6; c.strokeStyle='#140e1c'; c.strokeText('王城密令',400,440); c.fillStyle='#ffd23f'; c.fillText('王城密令',400,440); ctx.restore(); }
const LSn=k=>{ try{ return +localStorage.getItem(k)||0; }catch(e){ return 0; } };
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).mission={
  name:'王城密令',tag:'SECRET ORDERS',color:'#e8c050',online:true,maxPlayers:10,minPlayers:5,
  desc:'玩法參考桌遊《阿瓦隆》，會玩的人不用重學規則。好人與壞人藏在同一張圓桌！隊長挑隊員出任務，大家公開投票，出任務的人暗中出成功或失敗。好人完成 3 次任務、壞人讓 3 次任務失敗；最後刺客還能刺殺先知翻盤。5～10 位真人連線，每個人用自己的手機看身分。',
  goal:'（玩法同《阿瓦隆》）好人完成 3 次任務、壞人讓 3 次任務失敗就贏。隊伍要過半贊成才出發，連續 5 次被否決壞人贏；好人過關後刺客刺中先知，壞人翻盤。',
  optNote(sel,count){ const m=clamp(count||7,5,10),L=roleList(m,sel.roles||'std'),cnt={}; for(const k of L) cnt[k]=(cnt[k]||0)+1;
    const side=g=>Object.keys(cnt).filter(k=>ROLE[k].g===g).map(k=>'・'+ROLE[k].n+'（阿瓦隆的'+ROLE[k].av+'）'+(cnt[k]>1?' ×'+cnt[k]:'')+'：'+noSh(ROLE[k].s,L)).join('<br>');
    return m+' 人局，每次任務人數：'+TEAM[m].join('、')+(m>=7?'（第 4 次要 2 張失敗）':'')+'<br><span style="color:#8ac4ff">🔵 好人陣營 '+(m-EVIL[m])+' 人</span>：完成 3 次任務<br>'+side(1)+'<br><span style="color:#ff8a9a">🔴 壞人陣營 '+EVIL[m]+' 人</span>：讓 3 次任務失敗<br>'+side(0)+(L.includes('lone')?'':'<br><span style="color:#c8b8e8">這局沒有'+(L.includes('shadow')?'':'影首（阿瓦隆的莫德雷德）、')+'獨行者（阿瓦隆的奧伯倫）：'+(L.includes('shadow')?'角色選「全部」、10 人才會加入':'影首要角色選「標準」以上、7 人以上；獨行者要選「全部」、10 人')+'</span>'); },
  modes:[],
  options:[{key:'roles',label:'角色',def:'std',opts:SETS.map(s=>({id:s.id,label:s.label}))}],
  help:[['點人物','隊長挑隊員；刺客選要刺殺的人'],['按鈕','投票贊成／反對、出任務成功／失敗'],['左上角','隨時看自己的角色和知道的資訊']],
  touchHelp:[['點人物','隊長挑隊員；刺客選要刺殺的人'],['按鈕','投票、出任務'],['左上角','看自己的角色']],touch:null,
  hubBest:()=>{ const v=LSn('arcade.mission.w'); return v?'陣營獲勝 <b>'+v+'</b> 次':'尚無紀錄'; },
  best:{label:'',fmt:v=>v,lower:false},thumb,create};
})();
