// 鋼琴音樂家：黑色琴鍵磚從上往下掉，掉到琴鍵上時按下對應的鍵（D F J K 或點琴鍵），按對才會彈出那個音。
// 200 首原創曲（每首用種子即時作曲）；第 15 關起有長按音，第 40 關起有雙音和弦。達成率 60% 以上過關，過一關開下一關。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,LV=200;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rng(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const LX=230,LW=85,NL=4,JY=402,KEYS=[['KeyD','Digit1','ArrowLeft'],['KeyF','Digit2','ArrowDown'],['KeyJ','Digit3','ArrowUp'],['KeyK','Digit4','ArrowRight']],KL=['D','F','J','K'];
const W1=['晨光','月光','星空','花園','雨滴','海風','森林','雪花','彩虹','夏夜'],W2=['小步舞曲','練習曲','圓舞曲','夜曲','進行曲','奏鳴曲','幻想曲','搖籃曲','狂想曲','前奏曲'];
const titleOf=i=>i>=100?titleOf(i-100)+' Ⅱ':W1[(i*3)%10]+W2[(i*7+Math.floor(i/10))%10];
const HALLS=[{n:'音樂教室',a:'#f4e4c8',b:'#d8b88a',wall:'#e8d4b0',acc:'#8a5a2a'},{n:'花園露台',a:'#bfe8ff',b:'#e8f8d8',wall:'#cfeac0',acc:'#3a8a4a'},{n:'金色音樂廳',a:'#5a1a22',b:'#2a0a10',wall:'#7a2a30',acc:'#ffd23f'},{n:'星空舞台',a:'#141a48',b:'#05061a',wall:'#20286a',acc:'#9ad0ff'},{n:'水晶宮殿',a:'#2a4a7a',b:'#0e1a3a',wall:'#3a5a9a',acc:'#c8f0ff'}];
const starsOf=i=>Math.min(5,1+Math.floor(i/20));
/* ---------- 作曲：原創旋律（鋼琴右手）＋伴奏（左手） ---------- */
const SC={major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10]},QQ={M:[0,4,7],m:[0,3,7]};
const PROGS={major:[['0:M','5:M','7:M','0:M'],['0:M','9:m','5:M','7:M'],['0:M','7:M','9:m','5:M'],['0:M','4:m','5:M','7:M'],['0:M','2:m','7:M','0:M'],['5:M','7:M','4:m','9:m']],minor:[['0:m','8:M','10:M','0:m'],['0:m','5:m','10:M','3:M'],['0:m','10:M','8:M','7:M'],['0:m','3:M','8:M','7:M']]};
const RHY=[ /* 一小節 16 格：[開始, 長度] */
 [[[0,8],[8,8]],[[0,4],[4,4],[8,8]],[[0,8],[8,4],[12,4]],[[0,4],[4,4],[8,4],[12,4]],[[0,12],[12,4]]],
 [[[0,4],[4,2],[6,2],[8,4],[12,4]],[[0,2],[2,2],[4,4],[8,8]],[[0,4],[4,4],[8,2],[10,2],[12,4]],[[0,6],[6,2],[8,8]],[[0,4],[4,4],[8,4],[12,2],[14,2]]],
 [[[0,2],[2,2],[4,2],[6,2],[8,4],[12,4]],[[0,3],[3,3],[6,2],[8,2],[10,2],[12,4]],[[0,2],[2,2],[4,4],[8,2],[10,2],[12,2],[14,2]],[[0,4],[4,2],[6,2],[8,2],[10,2],[12,4]]],
 [[[0,2],[2,1],[3,1],[4,2],[6,2],[8,2],[10,2],[12,2],[14,2]],[[0,1],[1,1],[2,2],[4,2],[6,2],[8,2],[10,2],[12,4]],[[0,2],[2,2],[4,1],[5,1],[6,2],[8,2],[10,1],[11,1],[12,4]],[[0,2],[2,2],[4,2],[6,2],[8,1],[9,1],[10,2],[12,2],[14,2]]]];
function makeSong(i){ const r=rng(7919*(i+1)+11),d=i<100?i/99:.55+.45*(i-100)/99,tier=i<15?0:i<40?1:i<70?2:i<100?3:(d<.75?2:3); /* 第 101 首起：難度在中後段，旋律用新種子 */
  const bpm=Math.round(70+d*62+r()*6),scn=r()<.62?'major':'minor',scale=SC[scn],root=58+Math.floor(r()*7),pick=a=>a[Math.floor(r()*a.length)];
  const pa=pick(PROGS[scn]),pb=pick(PROGS[scn].filter(p=>p!==pa));
  const pool=[]; for(let oc=0;oc<3;oc++) for(const iv of scale){ const m=root+12+oc*12+iv; if(m>=root+12&&m<=root+31) pool.push(m); }
  const chordOf=(pr,b)=>{ const [o,q]=pr[b%4].split(':'); return {o:+o,q:QQ[q]}; },isCT=(m,ch)=>ch.q.some(iv=>((m-root-ch.o-iv)%12+12)%12===0);
  const pos=tier===0?i/14:tier===1?(i-15)/24:tier===2?(i-40)/29:(i-70)/29;
  function phrase(pr){ const bars=[]; let idx=Math.floor(pool.length*.45); for(let b=0;b<4;b++){ const ch=chordOf(pr,b),set=tier>0&&r()>.3+.65*pos?RHY[tier-1]:RHY[tier],pat=pick(set),notes=[];
      for(const [st,len] of pat){ idx=clamp(idx+[-2,-1,-1,0,1,1,2,3,-3][Math.floor(r()*9)],0,pool.length-1); if(st%4===0&&!isCT(pool[idx],ch)) for(const dd of [1,-1,2,-2]){ const j=idx+dd; if(j>=0&&j<pool.length&&isCT(pool[j],ch)){ idx=j; break; } } notes.push({st,len,m:pool[idx]}); }
      if(b===3){ const last=notes[notes.length-1]; let best=pool[0]; for(const p of pool) if(((p-root)%12+12)%12===0&&Math.abs(p-last.m)<Math.abs(best-last.m)) best=p; last.m=best; }
      bars.push({ch,notes}); } return bars; }
  const A=phrase(pa),A2=phrase(pa),B=phrase(pb); A2[0]=A[0]; A2[1]=A[1];
  const form=tier===3&&pos>.4?[A,A2,B,A2,B,A]:tier>=2&&(tier===3||pos>.5)?[A,A2,B,A2,A]:tier>=1?[A,A2,B,A2]:[A,A2,B];
  const bars=[{ch:chordOf(pa,0),notes:[],intro:true}]; for(const ph of form) for(const bar of ph) bars.push(bar); bars.push({ch:chordOf(pa,0),notes:[{st:0,len:12,m:pool.find(p=>((p-root)%12+12)%12===0)||pool[0]}],outro:true});
  const sd=60/bpm/4;
  /* 譜面：音高決定落在哪一道，太快的同音避開同一道 */
  const lo=Math.min(...pool),hi=Math.max(...pool),notes=[]; let prevL=-1,prevM=-1,prevT=-9; const busy=[-9,-9,-9,-9],free=(L,t)=>busy[L]<t-.25,near=(L,t)=>{ if(free(L,t)) return L; for(const dd of [1,-1,2,-2,3,-3]){ const k=L+dd; if(k>=0&&k<4&&free(k,t)) return k; } return L; };
  bars.forEach((bar,b)=>{ if(bar.intro) return; bar.notes.forEach(nt=>{ const t=(b*16+nt.st)*sd,dur=nt.len*sd; let L=clamp(Math.round((nt.m-lo)/(hi-lo)*3.4-.2),0,3);
      if(nt.m!==prevM&&L===prevL) L=nt.m>prevM?Math.min(3,L+1):Math.max(0,L-1); if(nt.m!==prevM&&L===prevL) L=(L+2)%4;
      if(nt.m===prevM&&t-prevT<.36) L=(prevL+(r()<.5?1:3))%4;
      L=near(L,t);
      const hold=i>=15&&nt.len>=(tier>=2?4:6)&&dur>=.42&&!bar.outro; const o={t,L,m:nt.m,hold:hold?dur*.85:0}; notes.push(o); busy[L]=t+o.hold;
      if(i>=40&&nt.st===0&&(b%2===0||tier===3)&&r()<.35+d*.4){ let L2=(L+2)%4; if(!free(L2,t)) L2=[0,1,2,3].find(k=>k!==L&&free(k,t)); if(L2!=null){ busy[L2]=t; } if(L2!=null) notes.push({t,L:L2,m:nt.m-(scn==='major'?4:3),hold:0,chord:1}); }
      prevL=L; prevM=nt.m; prevT=t; }); });
  return {i,bpm,sd,root,scn,bars,notes,dur:bars.length*16*sd,title:titleOf(i),tier}; }
/* ---------- 鋼琴音色 ---------- */
function Piano(env){ const A=env.audio&&env.audio(); let bus=null;
  const mk=()=>{ if(!A||bus) return; bus=A.createGain(); bus.gain.value=.9; const lp=A.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=3800; bus.connect(lp); lp.connect((env.out&&env.out())||A.destination); };
  const hz=m=>440*Math.pow(2,(m-69)/12);
  function key(m,t,d,v){ if(!A) return; mk(); const f=hz(m),dd=Math.min(2.2,Math.max(.35,d)); try{ for(const [mult,amp,type] of [[1,1,'triangle'],[2,.35,'sine'],[3,.12,'sine'],[1.003,.4,'sine']]){ const o=A.createOscillator(),g=A.createGain(); o.type=type; o.frequency.value=f*mult; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v*amp,t+.006); g.gain.exponentialRampToValueAtTime(v*amp*.35,t+.18); g.gain.exponentialRampToValueAtTime(.0005,t+dd); o.connect(g); g.connect(bus); o.start(t); o.stop(t+dd+.05); } }catch(e){} }
  return {get ok(){ return !!A; },now:()=>A?A.currentTime:0,running:()=>!!A&&A.state==='running',key,stop(){ if(bus){ try{ bus.gain.setTargetAtTime(0,A.currentTime,.05); const b=bus; setTimeout(()=>{ try{ b.disconnect(); }catch(e){} },400); }catch(e){} bus=null; } }}; }
const WIN={perfect:.05,great:.1,good:.15},JT={perfect:'完美！',great:'很好',good:'不錯',miss:'MISS'},JC={perfect:'#ffd23f',great:'#7af0ff',good:'#86dc4f',miss:'#ff6b7d'},JG={perfect:1,great:.8,good:.5,miss:0},JP={perfect:100,great:70,good:40,miss:0};
const grade=a=>a>=95?'S':a>=85?'A':a>=70?'B':a>=60?'C':'D';
const bKey='arcade.piano.b.',getRec=i=>{ try{ const v=localStorage.getItem(bKey+i); return v==null?null:+v; }catch(e){ return null; } },setRec=(i,v)=>{ try{ const o=getRec(i); if(o==null||v>o) localStorage.setItem(bKey+i,String(v)); }catch(e){} };
/* ---------- 背景：舞台＋三角鋼琴＋鋼琴家 ---------- */
const BGC={};
function hallBg(k){ if(BGC[k]) return BGC[k]; const T=HALLS[k],e=document.createElement('canvas'); e.width=W; e.height=H; const c=e.getContext('2d'),r=rng(k*97+5);
  const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,T.a); g.addColorStop(1,T.b); c.fillStyle=g; c.fillRect(0,0,W,H);
  if(k===0){ c.fillStyle='#2a4a3a'; rr(c,20,40,170,100,6); c.fill(); c.strokeStyle='#8a5a2a'; c.lineWidth=6; c.stroke(); c.strokeStyle='rgba(255,255,255,.75)'; c.lineWidth=1.5; for(let l=0;l<5;l++){ c.beginPath(); c.moveTo(34,62+l*10); c.lineTo(176,62+l*10); c.stroke(); } c.fillStyle='#fff'; c.font='26px serif'; c.fillText('𝄞',34,100); for(let q=0;q<5;q++){ c.beginPath(); c.ellipse(80+q*20,92-q*5,4.5,3.4,-.4,0,TAU); c.fill(); }
    c.fillStyle='#6a8ad0'; rr(c,640,40,130,90,4); c.fill(); c.fillStyle='#bfe0ff'; c.fillRect(648,48,114,74); c.fillStyle='#6a8ad0'; c.fillRect(703,48,4,74); c.fillStyle='#c89a62'; c.fillRect(0,H-60,W,60); }
  else if(k===1){ c.fillStyle='#fff'; for(let i=0;i<5;i++){ const x=r()*W,y=30+r()*80; c.beginPath(); c.ellipse(x,y,46,14,0,0,TAU); c.ellipse(x+26,y-8,30,12,0,0,TAU); c.fill(); } c.fillStyle='#e8e0d0'; for(const x of [30,770]){ c.fillRect(x-14,90,28,H-150); c.fillRect(x-20,84,40,10); } c.fillStyle='#8ad07a'; c.fillRect(0,H-60,W,60); for(let i=0;i<40;i++){ c.fillStyle=['#ff7aa8','#ffd23f','#fff','#c88aff'][i%4]; c.beginPath(); c.arc(r()*W,H-50+r()*40,3+r()*3,0,TAU); c.fill(); } }
  else if(k===2){ c.fillStyle='#a8202a'; for(let x=0;x<W;x+=30){ c.fillStyle=(x/30)%2?'#8a1820':'#a8202a'; c.fillRect(x,0,30,90); } c.fillStyle='#ffd23f'; c.fillRect(0,88,W,6); for(let i=0;i<14;i++){ const x=i*60+20; c.fillStyle='rgba(255,220,140,.15)'; c.beginPath(); c.moveTo(x,0); c.lineTo(x+30,0); c.lineTo(x+80,H); c.lineTo(x-50,H); c.fill(); } c.fillStyle='#4a2a14'; c.fillRect(0,H-60,W,60); c.fillStyle='rgba(0,0,0,.55)'; for(let i=0;i<26;i++){ c.beginPath(); c.arc(i*32+10,H-8,14,Math.PI,0); c.fill(); } }
  else if(k===3){ for(let i=0;i<180;i++){ c.fillStyle='rgba(255,255,255,'+(.3+r()*.7)+')'; c.fillRect(r()*W,r()*H*.75,1.5,1.5); } c.fillStyle='#fffbe8'; c.beginPath(); c.arc(680,80,30,0,TAU); c.fill(); c.fillStyle=T.b; c.beginPath(); c.arc(694,72,26,0,TAU); c.fill(); c.fillStyle='#1a2058'; c.fillRect(0,H-60,W,60); c.strokeStyle='#9ad0ff'; c.lineWidth=2; c.beginPath(); c.moveTo(0,H-60); c.lineTo(W,H-60); c.stroke(); }
  else { for(let i=0;i<16;i++){ const x=r()*W,y=r()*H*.7,h=30+r()*70; c.globalAlpha=.35; const gg=c.createLinearGradient(x-10,0,x+10,0); gg.addColorStop(0,'#9ad8ff'); gg.addColorStop(.5,'#fff'); gg.addColorStop(1,'#9ad8ff'); c.fillStyle=gg; c.beginPath(); c.moveTo(x-10,y+h); c.lineTo(x-10,y+12); c.lineTo(x,y); c.lineTo(x+10,y+12); c.lineTo(x+10,y+h); c.fill(); c.globalAlpha=1; } c.fillStyle='#1a2a5a'; c.fillRect(0,H-60,W,60); }
  return BGC[k]=e; }
function grandPiano(c,x,y,s,t,hit){ c.save(); c.translate(x,y); c.scale(s,s); c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0,52,96,14,0,0,TAU); c.fill();
  c.strokeStyle='#0a0a10'; c.lineWidth=5; for(const lx of [-60,40]){ c.beginPath(); c.moveTo(lx,20); c.lineTo(lx,52); c.stroke(); }
  c.fillStyle='#14141c'; c.beginPath(); c.moveTo(-80,20); c.lineTo(70,20); c.quadraticCurveTo(100,18,96,-6); c.quadraticCurveTo(60,-30,-10,-14); c.lineTo(-80,-14); c.closePath(); c.fill();
  c.fillStyle='#2a2a38'; c.beginPath(); c.moveTo(-76,-14); c.lineTo(-20,-14); c.lineTo(10,-86); c.lineTo(-40,-60); c.closePath(); c.fill(); c.strokeStyle='#0a0a10'; c.lineWidth=3; c.beginPath(); c.moveTo(-30,-14); c.lineTo(0,-74); c.stroke();
  c.fillStyle='rgba(255,255,255,.16)'; c.beginPath(); c.ellipse(20,0,50,8,-.1,0,TAU); c.fill();
  c.fillStyle='#f4f4f4'; c.fillRect(-84,12,46,8); c.fillStyle='#14141c'; for(let k=0;k<7;k++) if(k%7!==2&&k%7!==6) c.fillRect(-82+k*6.4,12,3.4,5); if(hit>0){ c.fillStyle='rgba(255,230,120,'+hit+')'; c.fillRect(-84,10,46,10); }
  c.fillStyle='#14141c'; rr(c,-112,26,30,10,3); c.fill(); c.fillRect(-108,36,4,16); c.fillRect(-90,36,4,16); c.restore(); }
function pianist(c,x,y,s,t,L,hands,happy){ const R=window.__RHY; if(!R){ c.fillStyle='#ff7eb6'; c.beginPath(); c.arc(x,y-30,14,0,TAU); c.fill(); return; } const hl=hands[0],hr2=hands[1];
  R.drawChibi(c,x,y,s,{t,body:(L&&L.color)||'#2a2a40',pants:'#1a1a28',shoe:'#0a0a10',sleeve:(L&&L.color)||'#2a2a40',hair:(L&&L.hair)||'#3a2418',hairStyle:(L&&L.style)||'girl',acc:(L&&L.acc)||'bow',face:1,armL:-1.9+hl*.5,armR:-1.9+hr2*.5,legL:-1.2,legR:-1.2,bob:Math.sin(t*4)*.6,mouth:happy?'open':'smile'}); }
function lanesBg(c,k,t,press){ const T=HALLS[k]; c.save(); c.fillStyle='rgba(8,6,20,.55)'; rr(c,LX-12,0,LW*NL+24,H,0); c.fill();
  for(let l=0;l<NL;l++){ const x=LX+l*LW; const g=c.createLinearGradient(0,0,0,JY); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(1,press[l]>0?'rgba(255,240,200,.22)':'rgba(255,255,255,.05)'); c.fillStyle=g; c.fillRect(x+2,0,LW-4,JY); c.strokeStyle='rgba(255,255,255,.12)'; c.lineWidth=1; c.beginPath(); c.moveTo(x,0); c.lineTo(x,JY); c.stroke(); }
  c.beginPath(); c.moveTo(LX+NL*LW,0); c.lineTo(LX+NL*LW,JY); c.stroke();
  /* 判定線：金色五線 */ c.strokeStyle=T.acc; c.lineWidth=3; c.beginPath(); c.moveTo(LX-8,JY); c.lineTo(LX+NL*LW+8,JY); c.stroke(); c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=1; for(const dy of [-8,-4,4,8]){ c.beginPath(); c.moveTo(LX-8,JY+dy); c.lineTo(LX+NL*LW+8,JY+dy); c.stroke(); }
  /* 琴鍵 */ for(let l=0;l<NL;l++){ const x=LX+l*LW,p=press[l]>0; const g=c.createLinearGradient(0,JY+10,0,H); g.addColorStop(0,p?'#e8e0c8':'#ffffff'); g.addColorStop(1,p?'#c8bfa8':'#e8e8ee'); c.fillStyle=g; rr(c,x+3,JY+12+(p?3:0),LW-6,H-JY-16,8); c.fill(); c.strokeStyle='#8a8aa0'; c.lineWidth=1.5; c.stroke(); c.fillStyle=p?'#8a6a2a':'#9a9ab0'; c.font='900 18px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(KL[l],x+LW/2,H-28+(p?3:0)); }
  for(let l=1;l<NL;l++){ const x=LX+l*LW; c.fillStyle='#14141c'; rr(c,x-13,JY+12,26,44,4); c.fill(); c.fillStyle='rgba(255,255,255,.18)'; c.fillRect(x-9,JY+14,4,36); }
  c.restore(); }
function tile(c,x,y,w,h,col,hold,glow){ c.save(); if(hold){ const g=c.createLinearGradient(x,0,x+w,0); g.addColorStop(0,'#1a1a2a'); g.addColorStop(.5,'#3a3a5a'); g.addColorStop(1,'#1a1a2a'); c.fillStyle=g; rr(c,x+w*.3,y,w*.4,h,6); c.fill(); if(glow){ c.fillStyle='rgba(255,220,120,.6)'; rr(c,x+w*.3,y,w*.4,h,6); c.fill(); } }
  c.restore(); }
function head(c,x,y,w,col,chord){ c.save(); c.fillStyle='rgba(0,0,0,.3)'; rr(c,x+5,y-20,w-6,34,8); c.fill(); const g=c.createLinearGradient(0,y-24,0,y+10); g.addColorStop(0,'#3a3a50'); g.addColorStop(.5,'#14141c'); g.addColorStop(1,'#08080e'); c.fillStyle=g; rr(c,x+2,y-24,w-4,32,8); c.fill(); c.strokeStyle=col; c.lineWidth=2.5; c.stroke(); c.fillStyle='rgba(255,255,255,.28)'; rr(c,x+8,y-21,w-16,6,3); c.fill(); c.fillStyle=col; c.font='900 16px serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(chord?'♫':'♪',x+w/2,y-7); c.restore(); }

function create(env,opts){
  const si=clamp(opts.stage|0,0,LV-1),song=makeSong(si),pv=!!opts.preview,OP=opts.options||{},SPD=({slow:230,normal:310,fast:400})[OP.speed]||310,hk=Math.floor(si/20)%5,L=opts.look||{};
  const {ctx:c,canvas}=env.canvas2d(W,H),P=Piano(env),ease=1+Math.max(0,1-si/15)*.35;
  const notes=song.notes.map((n,k)=>({...n,k,res:null,tail:null,held:false}));
  const lead=2.4; let fakeClk=false,T=-lead,startAC=null,ended=false,t=0,score=0,combo=0,maxCombo=0,gain=0,cnt={perfect:0,great:0,good:0,miss:0},fx=[],judg=null,press=[0,0,0,0],down=[false,false,false,false],hands=[0,0],keyHit=0,nextAcc=0,aud=0,happy=0,paused=false;
  const total=notes.length+notes.filter(n=>n.hold).length;
  /* 伴奏：每拍一個低音或分解和弦 */
  const accomp=[]; song.bars.forEach((bar,b)=>{ const R=song.root+bar.ch.o-12; for(let st=0;st<16;st+=4){ const iv=bar.ch.q[(st/4)%3]; accomp.push({t:(b*16+st)*song.sd,m:st===0?R-12:R+iv,v:st===0?.16:.08}); } if(bar.outro) accomp.length=accomp.length-3; });
  function clock(dt){ if(paused) return; if(P.running()&&!pv&&!fakeClk){ if(startAC==null) startAC=P.now()-T; T=P.now()-startAC; } else T+=dt;
    if(!pv&&P.running()) while(nextAcc<accomp.length&&accomp[nextAcc].t<T+.2){ const a=accomp[nextAcc++]; if(a.t>=T-.05) P.key(a.m,startAC+a.t,song.sd*4,a.v); } }
  function judgeOf(dt){ const a=Math.abs(dt); return a<=WIN.perfect*ease?'perfect':a<=WIN.great*ease?'great':a<=WIN.good*ease?'good':null; }
  function add(j,l){ cnt[j]++; if(j==='miss'){ combo=0; } else { combo++; maxCombo=Math.max(maxCombo,combo); gain+=JG[j]; score+=Math.round(JP[j]*(1+Math.min(combo,100)/100)); } judg={j,l:.6}; if(l!=null&&j!=='miss'){ const x=LX+l*LW+LW/2; for(let i=0;i<(j==='perfect'?14:8);i++){ const a=-Math.PI*Math.random(),v=80+Math.random()*180; fx.push({x,y:JY,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:.5,c:JC[j],note:Math.random()<.3}); } fx.push({ring:1,x,y:JY,l:.3,c:JC[j]}); } if(combo>0&&combo%25===0){ happy=1.5; aud=1.5; } }
  function hitLane(l){ press[l]=.12; hands[l<2?0:1]=1; keyHit=.6; let best=null,bd=1e9; for(const n of notes){ if(n.res||n.L!==l) continue; const d=Math.abs(n.t-T); if(d<bd){ bd=d; best=n; } if(n.t>T+.4) break; }
    if(best&&bd<=WIN.good*ease*1.6){ const j=judgeOf(best.t-T)||'good'; if(bd>WIN.good*ease){ return; } best.res=j; add(j,l); if(!pv) P.key(best.m,P.now(),best.hold?best.hold+.3:.9,.22); if(best.hold) best.held=true; }
    else if(!pv) P.key(song.root+12+[0,4,7,12][l],P.now(),.25,.05); }
  function relLane(l){ for(const n of notes){ if(n.L===l&&n.held&&n.tail==null){ const end=n.t+n.hold; if(T<end-.15){ n.tail='miss'; add('miss',null); } else { n.tail='ok'; add('perfect',l); } n.held=false; } } }
  /* 觸控／滑鼠：點琴鍵或那一道 */
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const ptr=new Map();
  const pd=e=>{ if(pv) return; const [x]=toG(e),l=Math.floor((x-LX)/LW); if(l<0||l>=NL) return; ptr.set(e.pointerId,l); if(!down[l]){ down[l]=true; hitLane(l); } try{ canvas.setPointerCapture(e.pointerId); }catch(_){} };
  const pu=e=>{ const l=ptr.get(e.pointerId); if(l==null) return; ptr.delete(e.pointerId); if(![...ptr.values()].includes(l)&&!KEYS[l].some(k=>env.keys[k])){ down[l]=false; relLane(l); } };
  canvas.addEventListener('pointerdown',pd); canvas.addEventListener('pointerup',pu); canvas.addEventListener('pointercancel',pu); canvas.style.touchAction='none';
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt; clock(dt);
    if(!pv){ for(let l=0;l<NL;l++){ const k=KEYS[l].some(k=>env.keys[k]),pt=[...ptr.values()].includes(l); if(KEYS[l].some(k=>env.hit(k))&&!down[l]){ down[l]=true; hitLane(l); } if(down[l]&&!k&&!pt){ down[l]=false; relLane(l); } } }
    else { for(const n of notes){ if(!n.res&&n.t<=T){ n.res='perfect'; add('perfect',n.L); press[n.L]=.12; hands[n.L<2?0:1]=1; if(n.hold) n.held=true; } if(n.held&&T>=n.t+n.hold){ n.held=false; n.tail='ok'; } } }
    for(const n of notes){ if(!n.res&&T-n.t>WIN.good*ease){ n.res='miss'; add('miss',null); if(n.hold){ n.tail='miss'; add('miss',null); } } if(n.held&&T>=n.t+n.hold+.02&&!pv){ n.held=false; n.tail='ok'; add('perfect',n.L); } if(n.held&&Math.random()<.3) fx.push({x:LX+n.L*LW+LW/2+(Math.random()-.5)*30,y:JY,vx:(Math.random()-.5)*40,vy:-80-Math.random()*60,l:.4,c:'#ffd23f'}); }
    for(let l=0;l<NL;l++) press[l]=Math.max(0,press[l]-dt); hands=hands.map(h=>Math.max(0,h-dt*5)); keyHit=Math.max(0,keyHit-dt*2); aud=Math.max(0,aud-dt); happy=Math.max(0,happy-dt); if(judg&&(judg.l-=dt)<=0) judg=null;
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; if(f.l<=0){ fx.splice(i,1); continue; } if(!f.ring){ f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=220*dt; } }
    if(T>song.dur+.6&&!ended){ if(pv){ notes.forEach(n=>{ n.res=null; n.tail=null; n.held=false; }); T=-1; return; } ended=true; P.stop(); const acc=total?gain/total*100:0,g=grade(acc),pass=acc>=60; if(pass) setRec(si,Math.round(acc*10)/10); env.sfx(pass?'win':'lose');
      env.end({title:pass?'第 '+(si+1)+' 首演奏成功！':'再練習一下吧',big:g+'　'+acc.toFixed(1)+'%',text:'《'+song.title+'》　完美 '+cnt.perfect+'・很好 '+cnt.great+'・不錯 '+cnt.good+'・MISS '+cnt.miss+'　最大連擊 '+maxCombo+(pass?'':'　（達成率 60% 才過關）'),score:pass?Math.round(acc*10)/10:null,next:pass&&si<LV-1}); } }
  function draw(){ c.drawImage(hallBg(hk),0,0); const T0=T;
    /* 左邊：鋼琴家 */ grandPiano(c,178,336,1.12,t,keyHit); pianist(c,64,376,2.1,t,L,hands,happy>0);
    /* 右邊：觀眾 */ for(let k=0;k<5;k++){ const x=630+(k%3)*58+(k>2?29:0),y=k>2?452:420,j=aud>0?Math.abs(Math.sin(t*12+k))*8:Math.sin(t*2+k)*1.5; const R=window.__RHY; if(R) R.drawChibi(c,x,y-j,1.25,{t:t+k,body:['#ff7eb6','#4f9dff','#ffd23f','#5fd068','#c56bff'][k],pants:'#2b2b44',hairStyle:k%2?'girl':'boy',acc:['cat','bow','cap','bunny','crown'][k],armL:aud>0?-2.6:-.3,armR:aud>0?-2.6:.3,face:-1,mouth:aud>0?'open':'smile'}); }
    lanesBg(c,hk,t,press);
    c.save(); c.beginPath(); c.rect(LX,0,LW*NL,JY+6); c.clip();
    for(const n of notes){ if(n.res&&!n.held&&!(n.hold&&n.tail==null&&n.res!=='miss')) continue; const y=JY-(n.t-T0)*SPD; if(y<-40&&!n.hold) break; const x=LX+n.L*LW;
      if(n.hold){ const yEnd=JY-(n.t+n.hold-T0)*SPD; if(yEnd>JY+30) continue; tile(c,x,Math.max(-10,yEnd),LW,Math.min(JY,y)-Math.max(-10,yEnd),'#fff',true,n.held); if(n.tail!=='miss'&&yEnd>-20){ c.fillStyle='#ffd23f'; c.beginPath(); c.arc(x+LW/2,yEnd,7,0,TAU); c.fill(); } }
      if(!n.res&&y>-40) head(c,x,y,LW,n.chord?'#ff7eb6':n.hold?'#ffd23f':'#9ad0ff',n.chord); if(n.held) head(c,x,JY,LW,'#ffd23f',false); }
    c.restore();
    for(const f of fx){ c.globalAlpha=Math.min(1,f.l*2.2); if(f.ring){ c.strokeStyle=f.c; c.lineWidth=4; c.beginPath(); c.ellipse(f.x,f.y,LW*.5*(1.6-f.l*2),14*(1.6-f.l*2),0,0,TAU); c.stroke(); } else if(f.note){ c.fillStyle=f.c; c.font='900 16px serif'; c.textAlign='center'; c.fillText('♪',f.x,f.y); } else { c.fillStyle=f.c; c.fillRect(f.x-2.5,f.y-2.5,5,5); } } c.globalAlpha=1;
    /* 判定字、連擊 */ if(judg){ c.font='900 30px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=6; c.strokeStyle='#14122b'; const s=1+Math.max(0,judg.l-.45)*2; c.save(); c.translate(W/2,250); c.scale(s,s); c.strokeText(JT[judg.j],0,0); c.fillStyle=JC[judg.j]; c.fillText(JT[judg.j],0,0); c.restore(); }
    if(combo>=5){ c.font='900 44px '+TC; c.textAlign='center'; c.fillStyle='rgba(255,255,255,.22)'; c.fillText(combo,W/2,180); c.font='900 13px '+TC; c.fillText('COMBO',W/2,210); }
    /* 資訊 */ c.fillStyle='rgba(10,8,24,.75)'; rr(c,10,10,206,86,12); c.fill(); c.textAlign='left'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 17px '+TC; c.fillText('第 '+(si+1)+' 首　'+'★'.repeat(starsOf(si)),22,30); c.fillStyle='#fff'; c.font='900 14px '+TC; c.fillText('《'+song.title+'》',22,52); c.fillStyle='#cfc8ff'; c.font='700 12px '+TC; c.fillText(HALLS[hk].n+'　♩='+song.bpm,22,74);
    const acc=total?gain/Math.max(1,cnt.perfect+cnt.great+cnt.good+cnt.miss)*100:100; c.fillStyle='rgba(10,8,24,.75)'; rr(c,W-196,10,186,62,12); c.fill(); c.fillStyle='#fff'; c.font='900 22px '+TC; c.textAlign='right'; c.fillText(score,W-22,32); c.fillStyle='#cfc8ff'; c.font='700 12px '+TC; c.fillText('達成率 '+(cnt.perfect+cnt.great+cnt.good+cnt.miss?acc.toFixed(1):'--')+'%',W-22,56);
    const pr=clamp(T/song.dur,0,1); c.fillStyle='rgba(255,255,255,.18)'; c.fillRect(LX,4,LW*NL,4); c.fillStyle=HALLS[hk].acc; c.fillRect(LX,4,LW*NL*pr,4);
    if(T<0&&!pv){ c.fillStyle='rgba(10,8,24,.78)'; rr(c,W/2-170,160,340,90,16); c.fill(); c.fillStyle='#fff'; c.font='900 20px '+TC; c.textAlign='center'; c.fillText('《'+song.title+'》',W/2,190); c.fillStyle='#ffd23f'; c.font='900 14px '+TC; c.fillText(env.touch?'琴鍵磚掉到琴鍵上時點那一道':'琴鍵磚掉到琴鍵上時按 D F J K',W/2,222); c.fillStyle='#fff'; c.font='900 30px '+TC; c.fillText(Math.ceil(-T),W/2,130); } }
  return {update,draw,pause(p){ if(p===paused) return; paused=p; if(p) update.pAt=P.now(); else if(startAC!=null){ startAC+=P.now()-update.pAt; while(nextAcc<accomp.length&&accomp[nextAcc].t<T) nextAcc++; } },destroy(){ P.stop(); canvas.removeEventListener('pointerdown',pd); canvas.removeEventListener('pointerup',pu); canvas.removeEventListener('pointercancel',pu); },_dbg:{fake(){ fakeClk=true; },song,notes,get T(){return T;},hitLane,relLane,get acc(){ return total?gain/total*100:0; }}};
}
function stageShow(ctx,w,h,si,t){ const song=makeSong(si),hk=Math.floor(si/20)%5; ctx.save(); ctx.scale(w/W,h/H); ctx.drawImage(hallBg(hk),0,0); grandPiano(ctx,178,336,1.12,t,Math.sin(t*6)>.5?.5:0); pianist(ctx,64,376,2.1,t,{},[Math.abs(Math.sin(t*6)),Math.abs(Math.cos(t*6))],false);
  const press=[0,0,0,0]; const T=(t%8); for(const n of song.notes){ if(Math.abs(n.t-T)<.08) press[n.L]=.1; } lanesBg(ctx,hk,t,press); ctx.save(); ctx.beginPath(); ctx.rect(LX,0,LW*NL,JY); ctx.clip(); for(const n of song.notes){ const y=JY-(n.t-T)*300; if(y>JY+10) continue; if(y<-40) break; head(ctx,LX+n.L*LW,y,LW,n.chord?'#ff7eb6':n.hold?'#ffd23f':'#9ad0ff',n.chord); } ctx.restore();
  ctx.fillStyle='rgba(10,8,24,.78)'; rr(ctx,W-250,20,230,70,14); ctx.fill(); ctx.fillStyle='#ffd23f'; ctx.font='900 18px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('第 '+(si+1)+' 首',W-135,42); ctx.fillStyle='#fff'; ctx.font='900 16px '+TC; ctx.fillText('《'+song.title+'》',W-135,68); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).piano={
  name:'鋼琴音樂家',tag:'PIANO MAESTRO',color:'#2a2a40',ownMusic:true,
  desc:'黑色琴鍵磚往下掉，掉到琴鍵時按下去就會彈出旋律！200 首原創曲、五個舞台，從慢慢的小品彈到快速的狂想曲。',
  goal:'琴鍵磚掉到琴鍵上時按對應的鍵，按對才會彈出那個音。整首彈完達成率 60% 以上就過關。',
  stages:Array.from({length:LV},(_,i)=>'第 '+(i+1)+' 首'),stars:Array.from({length:LV},(_,i)=>starsOf(i)),stageGrid:true,
  stageGoal:i=>{ const s=makeSong(i); return '第 '+(i+1)+' 首《'+s.title+'》（'+HALLS[Math.floor(i/20)%5].n+'，♩='+s.bpm+'）：琴鍵磚掉到琴鍵上時按下去。'+(i>=40?'有長按音（按住到結束）和粉紅色雙音（兩個一起按）。':i>=15?'金色的是長按音，要按住到結束。':'')+' 達成率 60% 過關。'; },
  stageLocked:i=>i>0&&getRec(i-1)==null,stageBest:i=>{ const v=getRec(i); return v==null?'':grade(v)+' '+v+'%'; },
  hubBest:()=>{ let n=0; for(let i=0;i<LV;i++) if(getRec(i)!=null) n++; return n?'已過關 <b>'+n+' / '+LV+'</b> 首':'尚無紀錄'; },
  options:[{key:'speed',label:'磚塊速度',def:'normal',opts:[{id:'slow',label:'慢'},{id:'normal',label:'正常'},{id:'fast',label:'快'}]}],
  stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,47,t),
  looks:[{key:'color',label:'演奏服顏色',type:'color',opts:['#2a2a40','#c8202a','#3a5aa8','#f4f4f4','#ff7eb6','#5a2a8a','#2a7a4a','#d8a040']},{key:'acc',label:'頭飾',opts:[{id:'bow',label:'蝴蝶結'},{id:'crown',label:'皇冠'},{id:'cat',label:'貓耳'},{id:'bunny',label:'兔耳'},{id:'cap',label:'帽子'},{id:'none',label:'不戴'}]},{key:'style',label:'髮型',opts:[{id:'girl',label:'長髮'},{id:'boy',label:'短髮'},{id:'bun',label:'包包頭'}]}],
  preview:(ctx,w,h,L,t)=>{ ctx.drawImage(hallBg(2),0,0,w,h); ctx.save(); ctx.scale(w/W,h/H); grandPiano(ctx,470,330,1.6,t,0); pianist(ctx,250,370,3,t,L,[Math.abs(Math.sin(t*6)),Math.abs(Math.cos(t*6))],false); ctx.restore(); },
  help:[['D F J K','琴鍵磚掉到琴鍵時按對應的那一道'],['按住','金色長按音要按住到結束'],['滑鼠','也可以點琴鍵']],touchHelp:[['點琴鍵','琴鍵磚掉下來時點那一道'],['按住','金色長按音要按住到結束']],touch:null,
  best:{label:'達成率',fmt:v=>v+'%',lower:false},create,_sim:{makeSong,LV}};
})();
