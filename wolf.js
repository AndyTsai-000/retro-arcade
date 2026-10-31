// 狼人殺：天黑請閉眼。狼人、預言家、女巫、獵人、村民。單人配電腦；連線由房主主持，電腦補人。
// 電腦會依身分行動、發言、投票；白天可以打字發言。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const clamp=(v,a,b)=>v<a?a:v>b?b:v,TAU=Math.PI*2,pick=a=>a[Math.floor(Math.random()*a.length)];
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const ROLE={wolf:{n:'狼人',c:'#ff4d6d',d:'晚上一起選一個人殺掉。把好人殺到比狼人少就贏。'},seer:{n:'預言家',c:'#b98cff',d:'每晚查驗一個人是好人還是狼人。'},witch:{n:'女巫',c:'#5fd068',d:'一瓶解藥救人、一瓶毒藥毒人，各用一次。'},hunter:{n:'獵人',c:'#ffb02a',d:'死掉時可以開槍帶走一個人（被毒死不能開槍）。'},vill:{n:'村民',c:'#7ab8ff',d:'沒有技能，靠推理在白天投出狼人。'}};
const SETS={6:['wolf','wolf','seer','witch','vill','vill'],7:['wolf','wolf','seer','witch','hunter','vill','vill'],8:['wolf','wolf','seer','witch','hunter','vill','vill','vill'],9:['wolf','wolf','wolf','seer','witch','hunter','vill','vill','vill'],10:['wolf','wolf','wolf','seer','witch','hunter','vill','vill','vill','vill'],12:['wolf','wolf','wolf','wolf','seer','witch','hunter','vill','vill','vill','vill','vill']};
const BOTN=['阿明','小美','老王','阿珠','大頭','小林','阿翔','小芳','阿財','阿嬌','小虎','阿桃'];
const SK=['#ffdcb8','#f2c39a','#e0ac80','#c68a5e'],HR=['#2a1a10','#6a3a1a','#111','#c8903a','#7a2a1a','#3a2a4a'],CL=['#ff5d4f','#3d8bff','#5fd068','#ffd23f','#b98cff','#ff9d3d','#3ddbd9','#ff7eb6','#8a9ab8','#e8e8e8','#a85a2a','#2f6f4a'];
const SAY={idle:['我是好人啦，昨晚什麼也不知道。','大家先別亂投，聽完再說。','我覺得有人講話怪怪的。','我沒有資訊，跟著多數人。','昨晚好安靜，有點可怕。'],accuse:n=>pick(['我覺得 '+n+' 很可疑。',n+' 剛剛講話很心虛，投他吧。','我懷疑 '+n+'。',n+' 一直帶風向，不太對勁。']),seerB:n=>'我是預言家！昨晚驗了 '+n+'，他是狼人！',seerG:n=>'我是預言家，昨晚驗了 '+n+'，是好人。',defend:['不是我！我是好人！','你們弄錯了，我是村民。','投我你們會後悔的。'],wolf:n=>pick(['我是好人，'+n+' 比較可疑吧。','我也覺得是 '+n+'。','昨晚我什麼都不知道，投 '+n+' 看看？'])};
function guy(c,x,y,s,i,t,o){ o=o||{}; c.save(); c.translate(x,y); c.scale(s,s); const INK='#1c1420',sk=SK[i%4],h=HR[i%6],cl=CL[i%12]; if(o.dead){ c.globalAlpha=.55; c.rotate(0); }
  c.lineWidth=2; c.strokeStyle=INK; c.fillStyle=o.dead?'#55505a':cl; rr(c,-14,-8,28,22,9); c.fill(); c.stroke();
  c.fillStyle=o.dead?'#8a8490':sk; c.beginPath(); c.arc(0,-24,18,0,TAU); c.fill(); c.stroke(); c.fillStyle=o.dead?'#55505a':h; c.beginPath(); c.arc(0,-27,18,Math.PI*1.02,Math.PI*1.98); c.quadraticCurveTo(6,-31,-4,-29); c.quadraticCurveTo(-13,-29,-18,-25); c.fill(); c.stroke();
  c.fillStyle=INK; if(o.dead||o.sleep){ c.lineWidth=2; for(const d of [-1,1]){ c.beginPath(); if(o.dead){ c.moveTo(d*7-3,-26); c.lineTo(d*7+3,-20); c.moveTo(d*7+3,-26); c.lineTo(d*7-3,-20); } else { c.arc(d*7,-22,3,3.5,5.9); } c.stroke(); } } else for(const d of [-1,1]){ const bl=Math.sin(t*1.3+i*2)>.98; if(bl) c.fillRect(d*7-3,-23,6,1.6); else { c.beginPath(); c.arc(d*7,-23,3.3,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(d*7-1,-24.3,1.1,0,TAU); c.fill(); c.fillStyle=INK; } }
  if(!o.dead){ c.fillStyle='rgba(255,110,130,.45)'; c.beginPath(); c.ellipse(-12,-17,3.2,2,0,0,TAU); c.ellipse(12,-17,3.2,2,0,0,TAU); c.fill(); c.strokeStyle=INK; c.lineWidth=1.5; c.beginPath(); c.arc(0,-18,o.talk?2.6+Math.abs(Math.sin(t*12))*2:3,.3,Math.PI-.3); c.stroke(); }
  if(o.wolf){ c.fillStyle='#55505a'; for(const d of [-1,1]){ c.beginPath(); c.moveTo(d*16,-38); c.lineTo(d*8,-44); c.lineTo(d*18,-52); c.closePath(); c.fill(); c.strokeStyle=INK; c.lineWidth=2; c.stroke(); } c.fillStyle='#ff3b3b'; for(const d of [-1,1]){ c.beginPath(); c.arc(d*7,-23,2.2,0,TAU); c.fill(); } }
  c.restore(); }
function scene(c,t,night,k){ const g=c.createLinearGradient(0,0,0,H); if(night){ g.addColorStop(0,'#050822'); g.addColorStop(.7,'#1a1a48'); g.addColorStop(1,'#0c0e24'); } else { g.addColorStop(0,'#7ac4f0'); g.addColorStop(.6,'#d6ecf8'); g.addColorStop(1,'#8ab86a'); } c.fillStyle=g; c.fillRect(0,0,W,H);
  if(night){ c.fillStyle='#fff'; for(let i=0;i<70;i++){ c.globalAlpha=.3+.6*Math.abs(Math.sin(t+i)); c.fillRect((i*97)%W,(i*53)%190,1.6,1.6); } c.globalAlpha=1; const mg=c.createRadialGradient(650,70,10,650,70,110); mg.addColorStop(0,'rgba(255,250,210,.5)'); mg.addColorStop(1,'rgba(255,250,210,0)'); c.fillStyle=mg; c.fillRect(530,0,240,190); c.fillStyle='#fff8d0'; c.beginPath(); c.arc(650,70,34,0,TAU); c.fill(); c.fillStyle='rgba(200,190,150,.5)'; c.beginPath(); c.arc(640,62,7,0,TAU); c.arc(662,82,5,0,TAU); c.fill(); } else { c.fillStyle='#fff2b0'; c.beginPath(); c.arc(660,66,32,0,TAU); c.fill(); c.fillStyle='rgba(255,255,255,.8)'; for(let i=0;i<4;i++){ const x=((i*220+t*7)%(W+200))-100; c.beginPath(); c.ellipse(x,50+i*18,48,12,0,0,TAU); c.ellipse(x+30,44+i*18,30,12,0,0,TAU); c.fill(); } }
  // 村子
  const dk=night?.32:1,sh=(r,gg,b)=>'rgb('+Math.round(r*dk)+','+Math.round(gg*dk)+','+Math.round(b*dk)+')'; for(let i=0;i<9;i++){ const x=i*96-20,hh=52+(i*37)%40,y=212-hh; c.fillStyle=sh(200-(i%3)*30,170-(i%3)*18,130); c.fillRect(x,y,70,hh); c.fillStyle=sh(150,70,50); c.beginPath(); c.moveTo(x-8,y); c.lineTo(x+35,y-30); c.lineTo(x+78,y); c.fill(); c.fillStyle=night&&i%2?'#ffd98a':sh(90,120,150); c.fillRect(x+12,y+14,14,14); c.fillRect(x+44,y+14,14,14); }
  c.fillStyle=night?'#17281c':'#6fa84a'; c.fillRect(0,210,W,H); const g2=c.createRadialGradient(W/2,350,20,W/2,350,330); g2.addColorStop(0,night?'rgba(120,70,30,.32)':'rgba(210,180,110,.5)'); g2.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g2; c.fillRect(0,210,W,H);
  // 營火
  c.fillStyle='#4a3020'; c.fillRect(W/2-26,350,52,8); c.fillRect(W/2-20,344,40,7); for(let i=0;i<3;i++){ c.fillStyle=['#ff7a2a','#ffb02a','#fff0a0'][i]; const s=1-i*.28,h2=(36+Math.sin(t*11+i)*7)*s; c.beginPath(); c.moveTo(W/2-18*s,350); c.quadraticCurveTo(W/2-10*s,350-h2*.6,W/2,350-h2); c.quadraticCurveTo(W/2+10*s,350-h2*.6,W/2+18*s,350); c.fill(); } }
function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,OP=opts.options||{},humans=net?net.count:1,me=net?net.me:0;
  let n=net?net.count+(net.bots||0):+OP.seats||8; n=[6,7,8,9,10,12].includes(n)?n:n<6?6:n===11?12:n;
  const TALK=+OP.talk||25,{ctx:c,canvas}=env.canvas2d(W,H),names=[]; for(let i=0;i<n;i++) names.push(i<humans?(net?(net.names&&net.names[i])||'玩家'+(i+1):(opts.name||'你')):BOTN[i%12]);
  const seat=i=>{ const a=-Math.PI/2+(i-me)/n*TAU+Math.PI; return [W/2-90+Math.cos(a)*236,330+Math.sin(a)*92]; };
  const deal=SETS[n].slice().sort(()=>Math.random()-.5);
  let G={role:deal,alive:Array(n).fill(true),day:1,ph:'intro',T:6,msg:'',wv:{},seerL:{},kill:-1,saved:false,poison:-1,heal:1,pois:1,vote:{},speak:-1,speakQ:[],say:[],hunter:-1,dead:[],win:null,cause:{},exile:-1,sayN:0};
  let t=0,ended=false,sus=Array.from({length:n},()=>Array(n).fill(0)),botT=.8,sendT=0,seen=0,hover=-1,sel=-1,localK=null,botSpoke={};
  const sfx=k=>env.sfx(k);
  /* ---- 工具 ---- */
  const aliveL=()=>G.alive.map((v,i)=>v?i:-1).filter(i=>i>=0),isWolf=i=>G.role[i]==='wolf',wolves=()=>aliveL().filter(isWolf),goods=()=>aliveL().filter(i=>!isWolf(i)),isBot=i=>i>=humans;
  const speak=(i,txt)=>{ const m={i,t:txt}; G.say.push(m); if(G.say.length>30) G.say.shift(); G.sayN++; renderLog(); if(i>=0) sfx('click'); };
  const sys=txt=>speak(-1,txt);
  const broadcast=()=>{ if(net&&net.host) net.send({st:G}); };
  function checkWin(){ const w=wolves().length,g=goods().length; if(w===0){ G.win='good'; } else if(w>=g){ G.win='wolf'; } if(G.win){ G.ph='end'; G.T=3; sys(G.win==='good'?'🌞 狼人全滅，好人獲勝！':'🐺 狼人佔領村莊！'); sfx(myWin()?'win':'lose'); return true; } return false; }
  const myWin=()=>G.win==='good'?!isWolf(me):isWolf(me);
  /* ---- 夜晚 ---- */
  function night(){ G.ph='wolf'; G.T=humans>1||isWolf(0)?15:2.2; G.wv={}; G.kill=-1; G.saved=false; G.poison=-1; G.msg='天黑請閉眼，狼人請睜眼'; sel=-1; sfx('trap'); broadcast(); botT=1; }
  function endWolf(){ const c2={}; for(const k in G.wv) c2[G.wv[k]]=(c2[G.wv[k]]||0)+1; let b=-1,m=0; for(const k in c2) if(c2[k]>m){ m=c2[k]; b=+k; } if(b<0){ const g=goods(); b=pick(g); } G.kill=b; goSeer(); }
  function goSeer(){ const s=aliveL().find(i=>G.role[i]==='seer'); G.ph='seer'; G.msg='預言家請睜眼'; G.T=s==null?2:isBot(s)?2.2:13; sel=-1; G.sees=null; botT=1; broadcast(); }
  function see(i,tg){ if(G.ph!=='seer'||G.role[i]!=='seer'||G.sees!=null||!G.alive[tg]||tg===i) return; G.sees=tg; G.seerL[tg]=isWolf(tg)?1:0; G.T=Math.min(G.T,isBot(i)?.5:3); broadcast(); }
  function goWitch(){ const s=aliveL().find(i=>G.role[i]==='witch'); G.ph='witch'; G.msg='女巫請睜眼'; G.T=s==null||(G.heal<=0&&G.pois<=0)?2:isBot(s)?2.2:14; sel=-1; botT=1; broadcast(); }
  function witchAct(i,a,tg){ if(G.ph!=='witch'||G.role[i]!=='witch') return; if(a==='save'&&G.heal>0&&G.kill>=0){ G.heal=0; G.saved=true; sys0(); } else if(a==='poison'&&G.pois>0&&G.alive[tg]&&tg!==i){ G.pois=0; G.poison=tg; } else if(a==='pass'){ G.T=.1; } if(a!=='pass') G.T=Math.min(G.T,.6); broadcast(); }
  const sys0=()=>{};
  function dawn(){ G.ph='dawn'; G.T=4; const list=[]; if(G.kill>=0&&!G.saved){ list.push(G.kill); G.cause[G.kill]='狼人'; } if(G.poison>=0&&!list.includes(G.poison)){ list.push(G.poison); G.cause[G.poison]='毒'; } for(const i of list) G.alive[i]=false; G.dead=list; G.msg=list.length?'昨晚 '+list.map(i=>names[i]).join('、')+' 死了':'昨晚是平安夜'; sys('☀ 第 '+G.day+' 天：'+G.msg); sfx(list.length?'hurt':'heal'); broadcast(); }
  function afterDeaths(next){ // 獵人開槍
    const h=G.dead.find(i=>G.role[i]==='hunter'&&G.cause[i]!=='毒'); if(h!=null){ G.dead=G.dead.filter(i=>i!==h); G.hunter=h; G.ph='hunter'; G.T=isBot(h)?2:12; G.next=next; G.msg=names[h]+' 是獵人，可以開槍帶走一個人'; botT=1; broadcast(); return; } G.dead=[]; if(checkWin()){ broadcast(); return; } next(); }
  function shoot(i,tg){ if(G.ph!=='hunter'||G.hunter!==i||!G.alive[tg]||G.shot) return; G.alive[tg]=false; G.cause[tg]='獵槍'; sys('🔫 '+names[i]+' 開槍帶走了 '+names[tg]); sfx('boom'); if(G.role[tg]==='hunter') {} G.T=.1; G.shot=1; broadcast(); }
  /* ---- 白天 ---- */
  function talkPhase(){ const a=aliveL(); const start=a.indexOf(G.day%a.length); G.speakQ=a.slice(Math.max(0,start)).concat(a.slice(0,Math.max(0,start))); nextSpeaker(); }
  function nextSpeaker(){ G.speak=G.speakQ.length?G.speakQ.shift():-1; if(G.speak<0){ votePhase(); return; } G.ph='talk'; G.T=isBot(G.speak)?2.6:TALK; G.msg='輪到 '+names[G.speak]+' 發言'; botSpoke={}; broadcast(); if(isBot(G.speak)) setTimeout(()=>{ if(G.ph==='talk'&&!ended&&isBot(G.speak)&&!botSpoke[G.speak]) botTalk(G.speak); },700); }
  function votePhase(){ G.ph='vote'; G.T=humans>1||G.alive[0]?18:3; G.vote={}; G.msg='投票！選一個人放逐'; sel=-1; botT=1.1; sfx('beep'); broadcast(); }
  function castVote(i,tg){ if(G.ph!=='vote'||!G.alive[i]||G.vote[i]!=null||!G.alive[tg]) return; G.vote[i]=tg; sfx('place'); if(aliveL().every(q=>G.vote[q]!=null)) G.T=Math.min(G.T,1.2); broadcast(); }
  function tally(){ const cnt={}; for(const k in G.vote) cnt[G.vote[k]]=(cnt[G.vote[k]]||0)+1; let m=0,top=[]; for(const k in cnt){ if(cnt[k]>m){ m=cnt[k]; top=[+k]; } else if(cnt[k]===m) top.push(+k); } G.ph='exile'; G.T=4; G.dead=[]; if(top.length===1){ const x=top[0]; G.exile=x; G.alive[x]=false; G.cause[x]='放逐'; G.dead=[x]; G.msg=names[x]+' 被放逐了（'+m+' 票）'; sfx('hurt'); } else { G.exile=-1; G.msg='平票，今天沒有人被放逐'; } sys('🗳 '+G.msg); broadcast(); }
  /* ---- 電腦 ---- */
  function learn(){ for(const k in G.seerL){ const seer=aliveL().find(i=>G.role[i]==='seer'); } }
  function botTalk(i){ botSpoke[i]=1; const a=aliveL().filter(q=>q!==i),role=G.role[i]; let txt; if(role==='seer'&&Object.keys(G.seerL).length&&G.alive[i]){ const ks=Object.keys(G.seerL).map(Number),wolf=ks.find(q=>G.seerL[q]&&G.alive[q]),q=wolf!=null?wolf:ks[ks.length-1]; if(G.seerL[q]){ txt=SAY.seerB(names[q]); a.forEach(p=>{ sus[p][q]+=4; }); } else if(Math.random()<.6){ txt=SAY.seerG(names[q]); a.forEach(p=>{ sus[p][q]-=2; }); } }
    if(!txt&&role==='wolf'){ const tg=pick(goods().filter(q=>q!==i)); if(tg!=null){ txt=SAY.wolf(names[tg]); a.forEach(p=>{ sus[p][tg]+=.8; }); } }
    if(!txt&&Math.random()<.5&&a.length){ const tg=pick(a); txt=SAY.accuse(names[tg]); a.forEach(p=>{ sus[p][tg]+=.5; }); } if(!txt) txt=pick(SAY.idle); speak(i,txt); broadcast(); }
  function botPickVote(i){ const a=aliveL().filter(q=>q!==i); if(isWolf(i)){ const g=a.filter(q=>!isWolf(q)); g.sort((x,y)=>sus[i][y]-sus[i][x]); return g[0]; } if(G.role[i]==='seer'){ const k=a.find(q=>G.seerL[q]===1); if(k!=null) return k; } a.sort((x,y)=>sus[i][y]+Math.random()*1.4-sus[i][x]-Math.random()*1.4); return a[0]; }
  function botsAct(){ botT=.6+Math.random()*.6; if(G.ph==='wolf'){ for(const i of wolves()) if(isBot(i)&&G.wv[i]==null){ const hum=wolves().find(q=>!isBot(q)&&G.wv[q]!=null); const g=goods(); G.wv[i]=hum!=null?G.wv[hum]:(Object.values(G.wv)[0]!=null?Object.values(G.wv)[0]:pick(g.sort((x,y)=>(G.role[y]==='seer'?1:0)-(G.role[x]==='seer'?1:0)))); broadcast(); break; } if(wolves().every(i=>G.wv[i]!=null)) G.T=Math.min(G.T,.8); }
    else if(G.ph==='seer'){ const s=aliveL().find(i=>G.role[i]==='seer'); if(s!=null&&isBot(s)&&G.sees==null){ const o=aliveL().filter(q=>q!==s&&G.seerL[q]==null); if(o.length) see(s,pick(o)); else G.T=.2; } }
    else if(G.ph==='witch'){ const s=aliveL().find(i=>G.role[i]==='witch'); if(s!=null&&isBot(s)){ if(G.heal>0&&G.kill>=0&&(G.day<=2||Math.random()<.4)) witchAct(s,'save'); else if(G.pois>0&&G.day>1){ const cand=aliveL().filter(q=>q!==s&&sus[s][q]>2.5); if(cand.length) witchAct(s,'poison',cand[0]); else witchAct(s,'pass'); } else witchAct(s,'pass'); } }
    else if(G.ph==='hunter'&&isBot(G.hunter)){ const o=aliveL(); o.sort((x,y)=>sus[G.hunter][y]-sus[G.hunter][x]); shoot(G.hunter,o[0]); }
    else if(G.ph==='vote'){ for(const i of aliveL()) if(isBot(i)&&G.vote[i]==null){ castVote(i,botPickVote(i)); break; } } }
  /* ---- 流程 ---- */
  function hostStep(dt){ G.T-=dt; botT-=dt; if(botT<=0) botsAct(); if(G.T>0) return;
    switch(G.ph){ case 'intro': night(); break; case 'wolf': endWolf(); break; case 'seer': goWitch(); break; case 'witch': dawn(); break; case 'dawn': afterDeaths(talkPhase); break;
      case 'hunter': { const nx=G.next,did=G.shot; G.shot=0; G.hunter=-1; if(!did&&!isBot(G.hunter)) {} G.dead=[]; if(checkWin()){ broadcast(); return; } (nx==='night'?nextNight:nx==='talk'?talkPhase:(nx||talkPhase))(); break; }
      case 'talk': nextSpeaker(); break; case 'vote': for(const i of aliveL()) if(G.vote[i]==null&&isBot(i)) G.vote[i]=botPickVote(i); tally(); break; case 'exile': afterDeaths(nextNight); break; case 'end': if(!ended){ ended=true; if(net) net.send({st:G,fin:1}); finish(); } break; } }
  function nextNight(){ G.day++; night(); }
  function finish(){ const win=myWin(); env.sfx(win?'win':'lose'); env.end({title:G.win==='good'?'好人獲勝！':'狼人獲勝！',big:win?'你贏了':'你輸了',html:'<table class="ls"><tr><th>玩家</th><th>身分</th><th>結果</th></tr>'+names.map((m,i)=>'<tr><td>'+m+'</td><td>'+ROLE[G.role[i]].n+'</td><td>'+(G.alive[i]?'存活':(G.cause[i]||'死亡'))+'</td></tr>').join('')+'</table>',text:'第 '+G.day+' 天結束',score:!net&&win?G.day:null}); }
  // 連線
  if(net){ if(client) net.onmsg=m=>{ if(m.st){ const n0=G.sayN; G=m.st; if(G.sayN!==n0) renderLog(); if(m.fin&&!ended){ ended=true; finish(); } } }; else net.onmsg=(m,from)=>{ if(m.a) doAct(from,m.a); }; }
  function doAct(i,a){ if(a.k==='wolf'&&G.ph==='wolf'&&isWolf(i)&&G.alive[i]&&G.alive[a.t]&&!isWolf(a.t)){ G.wv[i]=a.t; if(wolves().every(q=>G.wv[q]!=null)) G.T=Math.min(G.T,1); broadcast(); }
    else if(a.k==='see') see(i,a.t); else if(a.k==='witch') witchAct(i,a.a,a.t); else if(a.k==='shoot') shoot(i,a.t); else if(a.k==='vote') castVote(i,a.t); else if(a.k==='say'&&G.ph==='talk'&&i===G.speak){ const tx=String(a.t).slice(0,60); speak(i,tx); for(const q of aliveL()) if(isBot(q)) for(const p of aliveL()) if(tx.includes(names[p])&&!isWolf(q)) sus[q][p]+=.7; broadcast(); } else if(a.k==='pass'&&G.ph==='talk'&&i===G.speak){ G.T=.05; broadcast(); } }
  const act=a=>{ if(client) net.send({a}); else doAct(me,a); };
  /* ---- 發言框 ---- */
  const wrap=document.createElement('div'); wrap.style.cssText='position:absolute;z-index:6;display:none;gap:6px'; const inp=document.createElement('input'); inp.maxLength=60; inp.placeholder='輸入發言，按 Enter'; inp.autocomplete='off'; inp.style.cssText='flex:1;min-width:0;font:700 14px '+TC+';padding:4px 10px;border-radius:9px;border:2px solid #4a4680;background:#fff;color:#14122b'; const b1=document.createElement('button'); b1.textContent='說'; const b2=document.createElement('button'); b2.textContent='說完了'; for(const b of [b1,b2]) b.style.cssText='font:900 13px '+TC+';padding:0 10px;border-radius:9px;border:0;background:#ffd23f;color:#14122b'; wrap.append(inp,b1,b2); env.stage.appendChild(wrap);
  const send=()=>{ const v=inp.value.trim(); if(v){ act({k:'say',t:v}); inp.value=''; } inp.focus(); }; b1.addEventListener('click',send); b2.addEventListener('click',()=>act({k:'pass'})); inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ send(); e.preventDefault(); } e.stopPropagation(); });
  const place=()=>{ const r=canvas.getBoundingClientRect(),st=env.stage.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=r.left+(r.width-W*s)/2-st.left,oy=r.top+(r.height-H*s)/2-st.top; wrap.style.left=(ox+150*s)+'px'; wrap.style.top=(oy+458*s)+'px'; wrap.style.width=(330*s)+'px'; wrap.style.height=(34*s)+'px'; }; addEventListener('resize',place); place();
  /* ---- 紀錄 ---- */
  const logC=document.createElement('canvas'); logC.width=420; logC.height=720; const lx=logC.getContext('2d'); function renderLog(){ lx.setTransform(2,0,0,2,0,0); lx.clearRect(0,0,210,360); lx.textBaseline='top'; lx.font='700 12px '+TC; let y=356; for(let i=G.say.length-1;i>=0&&y>0;i--){ const m=G.say[i],s=(m.i>=0?names[m.i]+'：':'')+m.t,lines=[]; let ln=''; for(const ch of s){ if(lx.measureText(ln+ch).width>198){ lines.push(ln); ln=''; } ln+=ch; } lines.push(ln); y-=lines.length*15+3; lines.forEach((q,k)=>{ lx.fillStyle=m.i<0?'#ffd23f':(m.i===me?'#86dc4f':'#f0eeff'); lx.fillText(q,4,y+k*15); }); } }
  /* ---- 輸入 ---- */
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const seatAt=q=>{ for(let i=0;i<n;i++){ const p=seat(i); if(Math.hypot(q[0]-p[0],q[1]-(p[1]-14))<28) return i; } return -1; };
  const myTarget=()=>{ if(!G.alive[me]&&G.ph!=='hunter') return false; const r=G.role[me]; return G.ph==='wolf'&&r==='wolf'&&G.wv[me]==null||G.ph==='seer'&&r==='seer'&&G.sees==null||G.ph==='witch'&&r==='witch'&&G.pois>0&&G.poison<0||G.ph==='hunter'&&G.hunter===me||G.ph==='vote'&&G.vote[me]==null; };
  const BTN=()=>{ const a=[]; if(G.ph==='witch'&&G.role[me]==='witch'&&G.alive[me]){ if(G.heal>0&&G.kill>=0&&!G.saved) a.push({l:'救 '+names[G.kill].slice(0,5),k:'save'}); a.push({l:'不用藥',k:'pass'}); } return a.map((b,i)=>Object.assign(b,{x:166+i*150,y:448,w:138,h:36})); };
  function down(e){ const q=toG(e); for(const b of BTN()) if(q[0]>=b.x&&q[0]<=b.x+b.w&&q[1]>=b.y&&q[1]<=b.y+b.h){ act({k:'witch',a:b.k}); sfx('click'); return; } if(!myTarget()) return; const i=seatAt(q); if(i<0||!G.alive[i]) return; if(G.ph==='wolf'){ if(!isWolf(i)) act({k:'wolf',t:i}); } else if(G.ph==='seer'){ if(i!==me) act({k:'see',t:i}); } else if(G.ph==='witch'){ if(i!==me) act({k:'witch',a:'poison',t:i}); } else if(G.ph==='hunter'){ act({k:'shoot',t:i}); } else if(G.ph==='vote'){ act({k:'vote',t:i}); } sfx('click'); }
  const mv=e=>{ hover=seatAt(toG(e)); }; canvas.addEventListener('pointerdown',down); canvas.addEventListener('pointermove',mv);
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt; if(client) G.T-=dt; else { hostStep(dt); sendT-=dt; if(net&&sendT<=0){ sendT=1; broadcast(); } } const my=G.ph==='talk'&&G.speak===me; wrap.style.display=my?'flex':'none'; }
  function draw(){ const ni=['wolf','seer','witch','intro'].includes(G.ph); scene(c,t,ni); const r=G.role[me],R=ROLE[r],tg=myTarget(),order=[...Array(n).keys()].sort((a,b)=>seat(a)[1]-seat(b)[1]);
    for(const i of order){ const p=seat(i),dead=!G.alive[i],wolfKnown=(isWolf(me)&&isWolf(i))||G.ph==='end'&&isWolf(i),eyes=ni&&!(G.ph==='wolf'&&isWolf(i)&&isWolf(me))&&i!==me; const sp=G.ph==='talk'&&G.speak===i;
      if(sp){ c.fillStyle='rgba(255,210,63,.3)'; c.beginPath(); c.ellipse(p[0],p[1]+10,32,12,0,0,TAU); c.fill(); }
      if(tg&&G.alive[i]&&!(G.ph==='wolf'&&isWolf(i))&&!(i===me&&G.ph!=='vote'&&G.ph!=='hunter')){ c.strokeStyle=hover===i?'#ffd23f':'rgba(255,255,255,'+(.4+.3*Math.sin(t*5))+')'; c.lineWidth=hover===i?4:2; c.beginPath(); c.ellipse(p[0],p[1]-12,30,38,0,0,TAU); c.stroke(); }
      guy(c,p[0],p[1],1,i,t,{dead,sleep:eyes&&!dead,wolf:wolfKnown&&!dead,talk:sp}); if(dead){ c.fillStyle='#fff'; c.font='900 11px '+TC; c.textAlign='center'; c.fillText('✝',p[0]+22,p[1]-40); }
      c.font=(i===me?'900 ':'700 ')+'11px '+TC; c.textAlign='center'; c.textBaseline='middle'; const nm=(i===me?'你 ':'')+names[i].slice(0,6),w2=c.measureText(nm).width+12; c.fillStyle=i===me?'#ffd23f':'rgba(11,10,28,.72)'; rr(c,p[0]-w2/2,p[1]+16,w2,16,8); c.fill(); c.fillStyle=i===me?'#14122b':'#fff'; c.fillText(nm,p[0],p[1]+24);
      if(G.ph==='end'||(r==='seer'&&G.seerL[i]!=null)){ const lab=G.ph==='end'?ROLE[G.role[i]].n:(G.seerL[i]?'狼人':'好人'),co=G.ph==='end'?ROLE[G.role[i]].c:(G.seerL[i]?'#ff4d6d':'#5fd068'); c.font='900 10px '+TC; const lw=c.measureText(lab).width+10; c.fillStyle=co; rr(c,p[0]-lw/2,p[1]-60,lw,15,6); c.fill(); c.fillStyle='#14122b'; c.fillText(lab,p[0],p[1]-52); }
      if(G.ph==='vote'||G.ph==='exile'){ const cnt=Object.values(G.vote).filter(v=>v===i).length; if(cnt&&(G.vote[me]!=null||G.ph==='exile')){ c.fillStyle='#ff5d4f'; c.beginPath(); c.arc(p[0]+24,p[1]-34,10,0,TAU); c.fill(); c.fillStyle='#fff'; c.font='900 12px '+TC; c.fillText(cnt,p[0]+24,p[1]-33); } }
      if(G.ph==='wolf'&&isWolf(me)&&Object.values(G.wv).includes(i)){ c.fillStyle='#ff3b3b'; c.font='20px sans-serif'; c.fillText('🎯',p[0],p[1]-58); } }
    // 上方：階段、倒數、身分
    c.fillStyle='rgba(11,10,28,.82)'; rr(c,10,8,160,66,10); c.fill(); c.textAlign='left'; c.textBaseline='middle'; c.font='900 12px '+TC; c.fillStyle='#cfc8ff'; c.fillText('你的身分',20,22); c.font='900 21px '+TC; c.fillStyle=R.c; c.fillText(R.n,20,45); if(!G.alive[me]){ c.font='900 12px '+TC; c.fillStyle='#ff8a9a'; c.fillText('已出局（觀戰）',86,46); } c.font='700 10px '+TC; c.fillStyle='#fff'; c.fillText(ni?'第 '+G.day+' 夜':'第 '+G.day+' 天',20,64);
    let hint=G.msg; const rl=G.role[me]; if(G.ph==='intro') hint='你的身分是「'+R.n+'」。'+R.d; if(G.alive[me]||G.ph==='hunter'){ if(G.ph==='wolf'&&rl==='wolf') hint=G.wv[me]==null?'點一個人當今晚的目標':'等其他狼人決定⋯'; if(G.ph==='seer'&&rl==='seer') hint=G.sees==null?'點一個人查驗':names[G.sees]+' 是「'+(isWolf(G.sees)?'狼人':'好人')+'」'; if(G.ph==='witch'&&rl==='witch') hint=(G.kill>=0?names[G.kill]+' 今晚被殺。':'今晚沒人被殺。')+(G.pois>0?'點人可下毒，':'')+(G.heal>0?'或按下方解藥':''); if(G.ph==='hunter'&&G.hunter===me) hint='開槍！點一個人帶走'; if(G.ph==='vote') hint=G.alive[me]&&G.vote[me]==null?'點一個人投票放逐':'等其他人投票⋯'; if(G.ph==='talk'&&G.speak===me) hint='輪到你發言：在下方打字'; }
    const hw=430; c.fillStyle='rgba(11,10,28,.82)'; rr(c,180,8,hw,44,10); c.fill(); c.fillStyle='#fff'; c.font='900 15px '+TC; c.textAlign='center'; c.fillText(hint,180+hw/2-16,30,hw-60); if(G.ph!=='end'&&G.ph!=='intro'&&G.ph!=='dawn'&&G.ph!=='exile'){ const sc=Math.max(0,Math.ceil(G.T)); c.fillStyle=sc<=5?'#ff5d6d':'#3ddbd9'; c.beginPath(); c.arc(180+hw-24,30,16,0,TAU); c.fill(); c.fillStyle='#14122b'; c.font='900 14px '+TC; c.fillText(sc,180+hw-24,31); }
    // 右邊紀錄
    c.fillStyle='rgba(11,10,28,.7)'; rr(c,W-178,60,170,290,10); c.fill(); c.save(); c.translate(W-175,66); c.drawImage(logC,0,0,164,281);  c.restore();
    for(const b of BTN()){ c.fillStyle=b.k==='save'?'#5fd068':'#ffd23f'; rr(c,b.x,b.y,b.w,b.h,10); c.fill(); c.fillStyle='#14122b'; c.font='900 14px '+TC; c.textAlign='center'; c.fillText(b.l,b.x+b.w/2,b.y+19); } }
  renderLog(); sys('村子來了狼人⋯ 共 '+n+' 人，狼人 '+SETS[n].filter(x=>x==='wolf').length+' 隻。');
  return {update,draw,destroy(){ removeEventListener('resize',place); if(wrap.parentNode) wrap.remove(); },_dbg:{get G(){return G;},act}};
}
function thumb(ctx,w,h,t){ ctx.save(); ctx.scale(w/W,h/H); scene(ctx,t,true); for(let i=0;i<8;i++){ const a=-Math.PI/2+i/8*TAU; guy(ctx,W/2+Math.cos(a)*250,335+Math.sin(a)*95,1.2,i,t,{wolf:i===2||i===5,sleep:!(i===2||i===5)}); } ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).wolf={
  name:'狼人殺',tag:'WEREWOLF',color:'#ff4d6d',online:true,maxPlayers:12,minPlayers:6,bots:true,netVariants:false,
  desc:'天黑請閉眼！狼人、預言家、女巫、獵人、村民，靠推理和說服力找出誰是狼。一個人玩有電腦同桌，也能和朋友連線。',
  goal:'好人要把狼人全部投出去；狼人要殺到好人數量不比狼人多。',
  modes:[{id:'1p',label:'單人'}],
  options:[{key:'seats',label:'單機人數',def:'8',opts:[{id:'6',label:'6 人'},{id:'8',label:'8 人'},{id:'9',label:'9 人'},{id:'12',label:'12 人'}]},{key:'talk',label:'發言秒數',def:'25',opts:[{id:'15',label:'15 秒'},{id:'25',label:'25 秒'},{id:'40',label:'40 秒'}]}],
  help:[['滑鼠','點人物：查驗、下毒、開槍、投票'],['Enter','白天輪到你時打字發言']],touchHelp:[['點人物','查驗、下毒、開槍、投票'],['輸入框','白天輪到你時打字發言']],
  touch:{left:[],right:[]},best:{label:'單人勝利',fmt:v=>'撐到第 '+v+' 天',lower:false},thumb,create};
})();
