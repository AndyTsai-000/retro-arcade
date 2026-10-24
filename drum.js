// 節奏小鼓手：夏日祭典打鼓。音符從右邊滑到左邊的判定圈，紅色「咚」敲鼓面、藍色「咔」敲鼓邊，黃色長條連打。
// 這個檔也放兩款節奏遊戲共用的「節奏引擎」（window.__RHY）：每關用亂數種子即時作一首原創曲、照旋律產生譜面、合成器排程、Q 版人物。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PIX='"Press Start 2P","Noto Sans TC",monospace';
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,u)=>a+(b-a)*u;
function rng(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }

/* ================= 節奏引擎 ================= */
const RHY=(()=>{
  const SC={major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],penta:[0,2,4,7,9]},Q={M:[0,4,7],m:[0,3,7]};
  const PROGS=[['0:M','5:M','7:M','0:M'],['0:M','9:m','5:M','7:M'],['0:m','8:M','10:M','0:m'],['0:M','7:M','9:m','5:M'],['0:m','5:m','10:M','3:M'],['0:M','4:m','5:M','7:M'],['0:m','10:M','8:M','7:M'],['0:M','2:m','5:M','7:M']];
  // 旋律節奏型（一小節 16 格），四個難度層
  const RH=[[[[0,4],[4,4],[8,8]],[[0,8],[8,4],[12,4]],[[0,4],[4,4],[8,4],[12,4]],[[0,4],[8,4],[12,4]]],
    [[[0,4],[4,2],[6,2],[8,4],[12,4]],[[0,2],[2,2],[4,4],[8,2],[10,2],[12,4]],[[0,4],[4,4],[8,2],[10,2],[12,4]],[[0,6],[6,2],[8,4],[12,4]]],
    [[[0,3],[3,3],[6,2],[8,2],[10,2],[12,4]],[[0,2],[2,2],[4,2],[6,2],[8,2],[10,2],[12,4]],[[0,2],[2,2],[4,4],[8,2],[10,2],[12,2],[14,2]],[[0,3],[3,1],[4,2],[6,2],[8,4],[12,2],[14,2]]],
    [[[0,1],[1,1],[2,2],[4,2],[6,2],[8,1],[9,1],[10,2],[12,2],[14,2]],[[0,2],[2,1],[3,1],[4,2],[6,2],[8,2],[10,1],[11,1],[12,2],[14,2]],[[0,2],[2,2],[4,1],[5,1],[6,2],[8,2],[10,2],[12,1],[13,1],[14,2]],[[0,2],[2,2],[4,2],[6,2],[8,1],[9,1],[10,1],[11,1],[12,4]]]];
  function makeSong(i,kind){
    const r=rng(9973*(i+1)+(kind==='dance'?77:0)),tier=i<6?0:i<12?1:i<20?2:3,d=i/29;
    const bpm=Math.round((kind==='dance'?100:88)+d*(kind==='dance'?72:84)+r()*6);
    const scn=kind==='drum'&&r()<.5?'penta':r()<.5?'major':'minor',scale=SC[scn],root=55+Math.floor(r()*9);
    const pick=a=>a[Math.floor(r()*a.length)];
    const pa=pick(PROGS.filter(p=>(p[0].endsWith(':m'))===(scn==='minor'))),pb=pick(PROGS.filter(p=>p!==pa&&(p[0].endsWith(':m'))===(scn==='minor')));
    const pool=[]; for(let oc=0;oc<3;oc++) for(const iv of scale){ const m=root+12+oc*12+iv; if(m>=root+10&&m<=root+31) pool.push(m); }
    const chordOf=(pr,b)=>{ const [o,q]=pr[b%4].split(':'); return {o:+o,q:Q[q]}; };
    const isCT=(m,ch)=>ch.q.some(iv=>((m-root-ch.o-iv)%12+12)%12===0);
    const T0=[0,6,12,20][tier],T1=[5,11,19,29][tier],pos=(i-T0)/Math.max(1,T1-T0); // 同一層裡越前面的關卡，越常混用上一層比較簡單的節奏型
    function phrase(pr,seedShift){ for(let k=0;k<seedShift;k++) r(); const bars=[]; let idx=Math.floor(pool.length*.4);
      for(let b=0;b<4;b++){ const ch=chordOf(pr,b),set=tier>0&&r()>.35+.6*pos?RH[tier-1]:RH[tier],pat=set[Math.floor(r()*set.length)],notes=[];
        for(const [st,len] of pat){ idx=clamp(idx+[-2,-1,-1,0,1,1,2][Math.floor(r()*7)],0,pool.length-1);
          if(st%4===0&&!isCT(pool[idx],ch)) for(const dd of [1,-1,2,-2]){ const j=idx+dd; if(j>=0&&j<pool.length&&isCT(pool[j],ch)){ idx=j; break; } }
          notes.push({st,len,m:pool[idx]}); }
        if(b===3){ const last=notes[notes.length-1]; let best=last.m; for(const p of pool) if(((p-root)%12+12)%12===0&&Math.abs(p-last.m)<Math.abs(best-last.m)+(best===last.m?99:0)) best=p; last.m=best; }
        bars.push({ch,notes}); }
      return bars; }
    const A=phrase(pa,0),A2=phrase(pa,0),B=phrase(pb,5);
    A2[3]=phrase(pa,9)[3]; // 第二次的 A 換個結尾
    const form=tier>=2?[A,A2,B,B,A,A2,B,A]:tier===1?[A,A2,B,A,A2,A]:[A,A2,B,A,A2];
    const INTRO=2,bars=[]; for(let b=0;b<INTRO;b++) bars.push({ch:chordOf(pa,b),notes:[],intro:true}); for(const ph of form) for(const bar of ph) bars.push(bar); bars.push({ch:chordOf(pa,0),notes:[{st:0,len:12,m:pool.find(p=>((p-root)%12+12)%12===0)||pool[0]}],outro:true});
    const sd=60/bpm/4,total=bars.length*16;
    return {i,kind,bpm,sd,root,scale:scn,bars,total,INTRO,tier,dur:total*sd,drum:kind==='drum'?'taiko':tier>=2?'rock':'four'}; }
  // 譜面：旋律每個音就是一顆音符；節奏遊戲各自決定音符種類
  function makeChart(song,assign){ const r=rng(31337+song.i*101+(song.kind==='dance'?5:0)),out=[]; let prevM=null;
    song.bars.forEach((bar,b)=>{ if(bar.intro) return; bar.notes.forEach((n,ni)=>{ const s=b*16+n.st; const o={t:s*song.sd,s,m:n.m,len:n.len,bar:b,st:n.st,ni,phraseStart:(b-song.INTRO)%4===0&&n.st===0,last:bar.outro};
      assign(o,prevM,r,song); prevM=n.m; if(o.k) out.push(o); }); });
    return out; }
  /* ---------- 合成器：照步數排程 ---------- */
  function Synth(env,song){ const AC=env.audio&&env.audio(); let bus=null,next=0,startAC=0,muted=false;
    const hz=m=>440*Math.pow(2,(m-69)/12);
    function mk(){ if(!AC) return; bus=AC.createGain(); bus.gain.value=.9; bus.connect(env.out?env.out():AC.destination); }
    function osc(type,f,t,d,v,att){ const o=AC.createOscillator(),g=AC.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+(att||.006)); g.gain.exponentialRampToValueAtTime(.0005,t+d); o.connect(g); g.connect(bus); o.start(t); o.stop(t+d+.05); }
    let nb=null; const noiseBuf=()=>{ if(nb) return nb; const n=Math.floor(AC.sampleRate*.4); nb=AC.createBuffer(1,n,AC.sampleRate); const a=nb.getChannelData(0); for(let i=0;i<n;i++) a[i]=Math.random()*2-1; return nb; };
    function noise(t,d,v,hp,lp){ const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain(); s.buffer=noiseBuf(); f.type=lp?'lowpass':'highpass'; f.frequency.value=lp||hp; g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0005,t+d); s.connect(f); f.connect(g); g.connect(bus); s.start(t); s.stop(t+d+.02); }
    function kick(t,v,f0){ const o=AC.createOscillator(),g=AC.createGain(); o.frequency.setValueAtTime(f0||150,t); o.frequency.exponentialRampToValueAtTime(45,t+.12); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0005,t+.2); o.connect(g); g.connect(bus); o.start(t); o.stop(t+.22); }
    function play(s,t){ const b=Math.floor(s/16),st=s%16,bar=song.bars[b]; if(!bar) return; const ch=bar.ch,R=song.root+ch.o-24,sd=song.sd;
      for(const n of bar.notes) if(n.st===st){ const f=hz(n.m),d=n.len*sd*.9; if(song.kind==='drum'){ osc('triangle',f,t,Math.min(d,.5)+.15,.11,.004); osc('square',f*2,t,.08,.018); } else { osc('square',f,t,d,.04); osc('triangle',f/2,t,d,.05); } }
      if(st%4===0) osc('triangle',hz(R+(st===8?7:0)),t,sd*3,.16); // 低音
      if(st===0) ch.q.forEach(iv=>osc('triangle',hz(song.root+ch.o+iv),t,sd*15,.022,.1)); // 和弦墊底
      if(song.kind==='dance'&&st%2===0){ const cn=ch.q.map(iv=>song.root+ch.o+iv+12); osc('square',hz(cn[(st/2)%3]),t,sd*1.4,.01); }
      const dr=song.drum; if(bar.outro&&st>0) return;
      if(dr==='taiko'){ if(st===0||st===8) kick(t,.32,95); if(st%4===2) osc('square',1500,t,.03,.02); if(st===12) noise(t,.18,.08,600); }
      else if(dr==='rock'){ if(st===0||st===8||st===10) kick(t,.45); if(st===4||st===12) noise(t,.14,.18,1200); if(st%2===0) noise(t,.04,.06,7000); }
      else { if(st%4===0) kick(t,.42); if(st===4||st===12) noise(t,.12,.14,1500); if(st%4===2) noise(t,.05,.07,7000); } }
    return {
      get ok(){ return !!AC; },
      start(delay){ if(!AC) return; mk(); startAC=AC.currentTime+delay; next=0; },
      time(){ return AC&&AC.state==='running'?AC.currentTime-startAC:null; },
      rebase(T){ if(AC) startAC=AC.currentTime-T; }, // 音訊還沒啟動時用一般計時，接上後不會跳
      tick(songT){ if(!AC||!bus||muted) return; const ahead=songT+.25; while(next<song.total&&next*song.sd<ahead){ const at=startAC+next*song.sd; if(at>=AC.currentTime-.01) play(next,at); next++; } },
      pause(){ if(!AC) return; muted=true; this.pausedAt=AC.currentTime; try{ bus.disconnect(); }catch(e){} },
      resume(){ if(!AC) return; startAC+=AC.currentTime-this.pausedAt; muted=false; mk(); const now=AC.currentTime-startAC; next=Math.max(0,Math.ceil(now/song.sd)); },
      stop(){ if(bus) try{ bus.gain.setTargetAtTime(0,AC.currentTime,.05); const b=bus; setTimeout(()=>{ try{ b.disconnect(); }catch(e){} },400); }catch(e){} bus=null; },
      // 打擊音效
      don(){ if(!AC||!bus) return; const t=AC.currentTime; kick(t,.7,170); noise(t,.08,.12,0,900); },
      ka(){ if(!AC||!bus) return; const t=AC.currentTime; osc('square',1250,t,.05,.12,.001); noise(t,.04,.1,3000); },
      clap(){ if(!AC||!bus) return; const t=AC.currentTime; noise(t,.06,.1,2000); } }; }
  const WIN={perfect:.045,great:.09,good:.135};
  const judgeOf=dt=>{ const a=Math.abs(dt); return a<=WIN.perfect?'perfect':a<=WIN.great?'great':a<=WIN.good?'good':null; };
  const JTXT={perfect:'完美！',great:'很好',good:'不錯',miss:'MISS'},JCOL={perfect:'#ffd23f',great:'#7af0ff',good:'#86dc4f',miss:'#ff6b7d'},JPT={perfect:100,great:70,good:40,miss:0};
  const grade=a=>a>=95?'S':a>=85?'A':a>=70?'B':a>=60?'C':'D';
  /* ---------- Q 版人物（兩款共用）：大頭、大眼睛兩個亮點、腮紅、ω 嘴；手腳用角度控制 ---------- */
  function drawChibi(c,x,y,s,o){ const OL='#2a1a26',SK=o.skin||'#ffe2c6',HAIR=o.hair||'#3a2418',f=o.face||1,now=o.t||0;
    c.save(); c.translate(x,y); c.scale(s,s); c.lineJoin='round'; c.lineCap='round';
    const ol=w=>{ c.strokeStyle=OL; c.lineWidth=w||1.2; c.stroke(); },ell=(cx,cy,rx,ry,col,lw,a)=>{ c.fillStyle=col; c.beginPath(); c.ellipse(cx,cy,rx,ry,a||0,0,7); c.fill(); if(lw!==0) ol(lw); };
    const limb=(x0,y0,ang,len,wd,col,end,endCol,endR)=>{ const x1=x0+Math.sin(ang)*len,y1=y0+Math.cos(ang)*len; c.strokeStyle=OL; c.lineWidth=wd+2.2; c.beginPath(); c.moveTo(x0,y0); c.lineTo(x1,y1); c.stroke(); c.strokeStyle=col; c.lineWidth=wd; c.beginPath(); c.moveTo(x0,y0); c.lineTo(x1,y1); c.stroke(); if(end) ell(x1,y1,endR||2.6,endR?endR*.75:2.6,endCol||col); return [x1,y1]; };
    const by=-(o.bob||0); // 整個人上下彈
    // 腳
    const shoe=o.shoe||'#e8463a',pants=o.pants||'#3a3a5a';
    for(const [k,a] of [[-1,o.legL||0],[1,o.legR||0]]){ const [fx,fy]=limb(k*3.2,by-9,a,8,4.6,pants); ell(fx+k*.6,fy+.8,3.6,2.4,shoe); }
    // 身體（衣服）
    c.fillStyle=o.body||'#e23b3b'; rr(c,-7,by-21,14,14,5); c.fill(); ol();
    if(o.happi){ c.fillStyle=o.happi; c.beginPath(); c.moveTo(-1.5,by-21); c.lineTo(-7,by-21); c.lineTo(-7,by-10); c.lineTo(-1.5,by-14); c.closePath(); c.fill(); c.beginPath(); c.moveTo(1.5,by-21); c.lineTo(7,by-21); c.lineTo(7,by-10); c.lineTo(1.5,by-14); c.closePath(); c.fill(); c.fillStyle='rgba(255,255,255,.85)'; c.fillRect(-7,by-11.5,14,2); }
    else { c.fillStyle='rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-2,by-17,3,2,0,0,7); c.fill(); }
    // 手（可以拿鼓棒）
    for(const [k,a] of [[-1,o.armL||0],[1,o.armR||0]]){ const [hx,hy]=limb(k*6.5,by-19,a*k,8,3.6,o.sleeve||o.body||'#e23b3b',true,SK,2.5);
      if(o.stick){ const sa=a*k+(k<0?-.5:.5); c.strokeStyle='#6b4a2a'; c.lineWidth=2.4; c.beginPath(); c.moveTo(hx,hy); c.lineTo(hx+Math.sin(sa)*11,hy+Math.cos(sa)*11); c.stroke(); c.strokeStyle='#e8c88a'; c.lineWidth=1.4; c.stroke(); } }
    // 頭
    const hx=f*.6,hy=by-34,R=11.5;
    if(o.hairStyle==='girl') for(const k of [-1,1]){ ell(hx+k*11,hy+3,3.4,6.5,HAIR); }
    if(o.hairStyle==='bun') ell(hx,hy-R-2,4.5,4,HAIR);
    ell(hx,hy,R*1.05,R*.97,SK,1.3);
    // 頭髮
    c.fillStyle=HAIR; c.beginPath(); c.moveTo(hx-R*1.03,hy+1); c.quadraticCurveTo(hx-R,hy-R*1.06,hx,hy-R*.99); c.quadraticCurveTo(hx+R,hy-R*1.06,hx+R*1.03,hy+1);
    c.lineTo(hx+R*.98,hy-R*.2); for(let i=3;i>=-3;i--){ const bx=hx+i*R*.3+f*1.2; c.quadraticCurveTo(bx+R*.16,hy-R*(i===0?.1:.2),bx,hy-R*.46); } c.quadraticCurveTo(hx-R*.98,hy-R*.3,hx-R*1.03,hy+1); c.closePath(); c.fill(); ol(.9);
    if(o.hairStyle!=='girl'&&o.hairStyle!=='bun'){ c.beginPath(); c.moveTo(hx+1,hy-R*.95); c.quadraticCurveTo(hx+5*f,hy-R*1.5,hx+7*f,hy-R*1.25); c.quadraticCurveTo(hx+3*f,hy-R*1.1,hx+2*f,hy-R*.9); c.fill(); ol(.8); }
    // 配件
    if(o.acc==='band'){ c.fillStyle='#fff'; c.beginPath(); c.ellipse(hx,hy-R*.42,R*1.06,2.6,0,0,7); c.fill(); ol(.8); c.fillStyle='#e23b3b'; c.beginPath(); c.arc(hx,hy-R*.42,1.6,0,7); c.fill();
      c.fillStyle='#fff'; c.beginPath(); c.moveTo(hx-f*R,hy-R*.42); c.lineTo(hx-f*(R+6),hy-R*.42-4+Math.sin(now*9)*1.5); c.lineTo(hx-f*(R+5),hy-R*.42+2+Math.sin(now*9)*1.5); c.closePath(); c.fill(); ol(.7); }
    else if(o.acc==='cap'){ c.fillStyle=o.capCol||'#4f9dff'; c.beginPath(); c.ellipse(hx,hy-R*.55,R*1.02,R*.62,0,Math.PI,0); c.fill(); ol(.9); c.beginPath(); c.ellipse(hx+f*R*.7,hy-R*.5,R*.62,2.2,0,0,7); c.fill(); ol(.8); }
    else if(o.acc==='bow'){ c.fillStyle='#ff6fa8'; for(const k of [-1,1]){ c.beginPath(); c.moveTo(hx+R*.55,hy-R*.75); c.lineTo(hx+R*.55+k*5,hy-R*.75-4); c.lineTo(hx+R*.55+k*5,hy-R*.75+3); c.closePath(); c.fill(); ol(.7); } }
    else if(o.acc==='phones'){ c.strokeStyle='#2b2b44'; c.lineWidth=2.4; c.beginPath(); c.arc(hx,hy-1,R*1.08,Math.PI*1.08,Math.PI*1.92); c.stroke(); ell(hx-R*1.02,hy+1,2.6,4,o.capCol||'#ff5d8f'); ell(hx+R*1.02,hy+1,2.6,4,o.capCol||'#ff5d8f'); }
    // 臉
    const ex=[-4,4].map(v=>hx+v+f*1.3),ey=hy+2,blink=(now*.7+x*.01)%4<.12;
    for(const e of ex){ if(blink||o.mouth==='closed'){ c.strokeStyle=OL; c.lineWidth=1.2; c.beginPath(); c.moveTo(e-2.4,ey); c.quadraticCurveTo(e,ey-1.6,e+2.4,ey); c.stroke(); continue; }
      c.fillStyle='#2a1a2a'; c.beginPath(); c.ellipse(e,ey,2.6,3.4,0,0,7); c.fill(); c.fillStyle='#6a4a9a'; c.beginPath(); c.ellipse(e,ey+1,1.9,1.6,0,0,7); c.fill();
      c.fillStyle='#fff'; c.beginPath(); c.arc(e+.8,ey-1.4,1.15,0,7); c.fill(); c.beginPath(); c.arc(e-.8,ey+1.3,.5,0,7); c.fill(); }
    c.fillStyle='rgba(255,120,150,.55)'; for(const e of ex){ c.beginPath(); c.ellipse(e+(e<hx+f*1.3?-1.6:1.6),hy+6,2.2,1.2,0,0,7); c.fill(); }
    const mx=hx+f*1.3; c.strokeStyle=OL; c.lineWidth=1.1;
    if(o.mouth==='o'){ c.fillStyle='#8a2a3a'; c.beginPath(); c.ellipse(mx,hy+7,1.8,2.2,0,0,7); c.fill(); }
    else if(o.mouth==='open'){ c.fillStyle='#8a2a3a'; c.beginPath(); c.moveTo(mx-3,hy+5.6); c.quadraticCurveTo(mx,hy+11,mx+3,hy+5.6); c.closePath(); c.fill(); c.fillStyle='#ff8aa0'; c.beginPath(); c.ellipse(mx,hy+8,1.6,1,0,0,7); c.fill(); }
    else { c.beginPath(); c.moveTo(mx-1.8,hy+6); c.quadraticCurveTo(mx-.9,hy+7.4,mx,hy+6.2); c.quadraticCurveTo(mx+.9,hy+7.4,mx+1.8,hy+6); c.stroke(); }
    c.restore(); }
  // 一場演奏的流程：時鐘、計分、判定、暫停
  function Play(env,song,notes,opt){
    const syn=Synth(env,song),useAC=syn.ok&&!opt.fake; let T=-(opt.lead||2.2); syn.start(opt.lead||2.2);
    const st={notes,score:0,combo:0,maxCombo:0,cnt:{perfect:0,great:0,good:0,miss:0},gain:0,total:notes.reduce((a,n)=>a+(n.roll?0:1),0),done:false,syn,fx:[]};
    st.time=()=>T;
    st.tick=dt=>{ const a=useAC?syn.time():null; if(a==null){ T+=dt; if(useAC) syn.rebase(T); } else T=a; syn.tick(T); };
    st.add=(j,big)=>{ st.cnt[j]++; if(j==='miss'){ st.combo=0; } else { st.combo++; st.maxCombo=Math.max(st.maxCombo,st.combo); st.gain+=j==='perfect'?1:j==='great'?.8:.5; st.score+=Math.round(JPT[j]*(big?2:1)*(1+Math.min(st.combo,100)/100)); } };
    st.rate=()=>st.total?st.gain/st.total*100:100;
    st.pause=p=>{ if(p) syn.pause(); else syn.resume(); };
    return st; }
  return {makeSong,makeChart,Synth,Play,WIN,judgeOf,JTXT,JCOL,JPT,grade,drawChibi,rng,rr,clamp}; })();
window.__RHY=RHY;

/* ================= 節奏小鼓手 ================= */
const SONGS=['金魚撈撈舞','棉花糖遊行','風車轉呀轉','烤魷魚恰恰','提燈小夜曲',
  '浪花拍拍手','海風煙火秀','貝殼尋寶歌','夜光水母','沙灘西瓜祭',
  '櫻花飄飄','鳥居下的約定','狐狸面具舞','春風太鼓','花見糰子',
  '紅葉翻翻','山寺鐘聲','秋月搗麻糬','楓林追風','落葉進行曲',
  '雪燈籠之夜','暖暖甜酒','雪人大合唱','冰雕嘉年華','北風快板',
  '星空大舞台','流星連打','銀河祭典','月亮兔太鼓','最終大祭典'];
const THEMES=[{name:'夏日祭典',sky:['#1a1240','#3a2a6a']},{name:'海邊煙火',sky:['#0b1c3a','#1f4a7a']},{name:'櫻花神社',sky:['#ff9ec4','#ffd9a8']},{name:'楓葉山寺',sky:['#ff8a4d','#ffd27a']},{name:'雪祭典',sky:['#1f2f5a','#5a7ab0']},{name:'星空大舞台',sky:['#140a30','#4a1f6a']}];
const recKey=i=>'arcade.drum.s'+i,getRec=i=>{ try{ const v=localStorage.getItem(recKey(i)); return v==null?null:+v; }catch(e){ return null; } };
function scene(c,w,h,th,t,fw){ const T=THEMES[th],k=w/800,g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,T.sky[0]); g.addColorStop(1,T.sky[1]); c.fillStyle=g; c.fillRect(0,0,w,h);
  const stars=n=>{ for(let i=0;i<n;i++){ const a=.3+.6*Math.abs(Math.sin(t*1.3+i)); c.fillStyle='rgba(255,255,255,'+a+')'; c.fillRect((i*137%800)*k,(i*71%260)*k,1.6*k,1.6*k); } };
  const firework=(x,y,r,col,u)=>{ if(u<0||u>1) return; c.globalAlpha=1-u; c.fillStyle=col; for(let i=0;i<18;i++){ const a=i/18*6.28,d=r*Math.sqrt(u); c.beginPath(); c.arc(x+Math.cos(a)*d,y+Math.sin(a)*d+u*u*20*k,2.4*k*(1-u*.5),0,7); c.fill(); } c.globalAlpha=1; };
  const lanterns=(y,n,col)=>{ c.strokeStyle='rgba(0,0,0,.5)'; c.lineWidth=1.5*k; c.beginPath(); c.moveTo(0,y); for(let i=0;i<=n;i++) c.quadraticCurveTo((i-.5)*w/n,y+18*k,i*w/n,y); c.stroke();
    for(let i=0;i<n;i++){ const x=(i+.5)*w/n,yy=y+14*k+Math.sin(t*2+i)*1.5*k; c.fillStyle=col[i%col.length]; rr(c,x-9*k,yy,18*k,24*k,8*k); c.fill(); c.fillStyle='rgba(255,240,200,.45)'; rr(c,x-5*k,yy+4*k,10*k,16*k,5*k); c.fill(); c.fillStyle='#2a1a26'; c.fillRect(x-6*k,yy-2*k,12*k,3*k); c.fillRect(x-6*k,yy+23*k,12*k,3*k); } };
  if(th===0){ stars(40); for(let i=0;i<3;i++) firework(w*(.2+i*.3),h*(.2+(i%2)*.08),70*k,['#ff6b7d','#ffd23f','#7af0ff'][i],((t+i*1.1)%3.3)/1.6);
    c.fillStyle='#2a1a3a'; for(let i=0;i<6;i++){ const x=i*w/6; c.beginPath(); c.moveTo(x,h*.75); c.lineTo(x+w/12,h*.66); c.lineTo(x+w/6,h*.75); c.fill(); c.fillRect(x+6*k,h*.75,w/6-12*k,h*.25); }
    c.fillStyle='#ff6b4d'; for(let i=0;i<6;i++){ c.fillRect(i*w/6+6*k,h*.75,w/6-12*k,6*k); } lanterns(h*.42,8,['#ff5d4f','#ffb000','#ff5d4f','#ffffff']); }
  else if(th===1){ stars(60); for(let i=0;i<4;i++) firework(w*(.15+i*.23),h*(.15+(i%2)*.1),85*k,['#ffd23f','#ff7eb6','#86dc4f','#b77bff'][i],((t+i*.8)%3.4)/1.7);
    c.fillStyle='#1a3a6a'; c.fillRect(0,h*.62,w,h*.38); c.strokeStyle='rgba(255,255,255,.25)'; c.lineWidth=2*k; for(let j=0;j<6;j++){ c.beginPath(); for(let x=0;x<=w;x+=20*k) c.lineTo(x,h*(.66+j*.06)+Math.sin(x/40/k+t*2+j)*3*k); c.stroke(); }
    c.fillStyle='#e8d29a'; c.beginPath(); c.moveTo(0,h); c.lineTo(0,h*.86); c.quadraticCurveTo(w*.5,h*.8,w,h*.88); c.lineTo(w,h); c.fill(); }
  else if(th===2){ c.fillStyle='rgba(255,255,255,.6)'; c.beginPath(); c.arc(w*.82,h*.2,30*k,0,7); c.fill();
    c.fillStyle='#d4283a'; const tx=w*.78; c.fillRect(tx-70*k,h*.38,140*k,12*k); c.fillRect(tx-62*k,h*.45,124*k,8*k); c.fillRect(tx-52*k,h*.38,12*k,h*.4); c.fillRect(tx+40*k,h*.38,12*k,h*.4); c.fillStyle='#2a1a26'; c.fillRect(tx-74*k,h*.36,148*k,5*k);
    for(const [x,s] of [[.12,1],[.32,.8],[.55,.9]]){ c.fillStyle='#6b3a2a'; c.fillRect(w*x-5*k,h*.5,10*k,h*.3); c.fillStyle='#ffc2d9'; for(const [dx,dy,r] of [[0,0,40],[-30,12,30],[30,12,30],[0,-22,30]]){ c.beginPath(); c.arc(w*x+dx*k*s,h*.48+dy*k*s,r*k*s,0,7); c.fill(); } }
    c.fillStyle='#8ac06a'; c.fillRect(0,h*.78,w,h*.22); c.fillStyle='#ffd9e8'; for(let i=0;i<24;i++){ const x=((i*91+t*30)%w),y=((i*53+t*45)%h); c.save(); c.translate(x,y); c.rotate(t+i); c.beginPath(); c.ellipse(0,0,4*k,2.4*k,0,0,7); c.fill(); c.restore(); } }
  else if(th===3){ c.fillStyle='#c45a2a'; c.beginPath(); c.moveTo(0,h*.6); c.lineTo(w*.25,h*.35); c.lineTo(w*.5,h*.58); c.lineTo(w*.75,h*.32); c.lineTo(w,h*.55); c.lineTo(w,h); c.lineTo(0,h); c.fill();
    const px=w*.7,py=h*.42; c.fillStyle='#5a3a2a'; c.fillRect(px-50*k,py,100*k,60*k); c.fillStyle='#3a2a2a'; c.beginPath(); c.moveTo(px-70*k,py); c.quadraticCurveTo(px,py-50*k,px+70*k,py); c.fill(); c.beginPath(); c.moveTo(px-50*k,py-28*k); c.quadraticCurveTo(px,py-70*k,px+50*k,py-28*k); c.fill();
    for(const x of [.1,.35,.9]){ c.fillStyle='#5a3a2a'; c.fillRect(w*x-5*k,h*.55,10*k,h*.3); c.fillStyle=['#e23b3b','#ff8a3d','#ffb000'][Math.floor(x*10)%3]; for(const [dx,dy,r] of [[0,0,36],[-24,14,26],[24,14,26]]){ c.beginPath(); c.arc(w*x+dx*k,h*.52+dy*k,r*k,0,7); c.fill(); } }
    c.fillStyle='#7a4a2a'; c.fillRect(0,h*.8,w,h*.2); for(let i=0;i<18;i++){ const x=((i*97+t*25)%w),y=((i*61+t*38)%h); c.fillStyle=['#e23b3b','#ff8a3d','#ffb000'][i%3]; c.save(); c.translate(x,y); c.rotate(t*2+i); c.beginPath(); c.moveTo(0,-5*k); c.lineTo(4*k,0); c.lineTo(0,5*k); c.lineTo(-4*k,0); c.closePath(); c.fill(); c.restore(); } }
  else if(th===4){ stars(30); c.fillStyle='#dfe8ff'; c.beginPath(); c.moveTo(0,h*.75); c.quadraticCurveTo(w*.3,h*.62,w*.6,h*.74); c.quadraticCurveTo(w*.8,h*.8,w,h*.7); c.lineTo(w,h); c.lineTo(0,h); c.fill();
    for(const x of [.15,.4,.85]){ const X=w*x,Y=h*.78; c.fillStyle='#fff'; c.beginPath(); c.arc(X,Y,22*k,Math.PI,0); c.lineTo(X+22*k,Y+20*k); c.lineTo(X-22*k,Y+20*k); c.fill(); c.fillStyle='rgba(255,200,90,'+(.6+.3*Math.sin(t*3+x*9))+')'; c.beginPath(); c.arc(X,Y+2*k,7*k,0,7); c.fill(); }
    c.fillStyle='#fff'; for(let i=0;i<50;i++){ const x=((i*73)%100)/100*w+Math.sin(t+i)*10*k,y=((t*28+i*41)%(h+10)); c.beginPath(); c.arc(x,y,(1.4+i%3)*k,0,7); c.fill(); } lanterns(h*.4,7,['#ff5d4f','#fff3c0']); }
  else { stars(80); for(let i=0;i<4;i++){ const a=Math.sin(t*.8+i*1.6)*.5; c.save(); c.translate(w*(.15+i*.23),0); c.rotate(a); const g2=c.createLinearGradient(0,0,0,h*.8); g2.addColorStop(0,'rgba(255,240,180,.35)'); g2.addColorStop(1,'rgba(255,240,180,0)'); c.fillStyle=g2; c.beginPath(); c.moveTo(-6*k,0); c.lineTo(6*k,0); c.lineTo(70*k,h*.8); c.lineTo(-70*k,h*.8); c.fill(); c.restore(); }
    for(let i=0;i<3;i++) firework(w*(.25+i*.25),h*.18,60*k,['#ff7eb6','#7af0ff','#ffd23f'][i],((t+i)%3)/1.5);
    c.fillStyle='#2a1a4a'; c.fillRect(0,h*.78,w,h*.22); c.fillStyle='#ffd23f'; for(let i=0;i<20;i++){ c.globalAlpha=.4+.4*Math.sin(t*4+i); c.beginPath(); c.arc((i+.5)*w/20,h*.79,3*k,0,7); c.fill(); } c.globalAlpha=1; } }
// 大鼓
function drawTaiko(c,x,y,s,hit,side){ c.save(); c.translate(x,y); c.scale(s,s);
  c.fillStyle='#6b3a1f'; c.fillRect(-26,10,6,26); c.fillRect(20,10,6,26); // 鼓架
  c.fillStyle='#a8521f'; rr(c,-34,-30,68,46,18); c.fill(); c.strokeStyle='#2a1a26'; c.lineWidth=2.4; c.stroke();
  c.fillStyle='#d2722f'; rr(c,-30,-26,60,38,14); c.fill(); c.strokeStyle='#2a1a26'; c.lineWidth=1.2; for(let i=-2;i<=2;i++){ c.beginPath(); c.moveTo(i*11,-26); c.lineTo(i*11,12); c.stroke(); }
  c.fillStyle='#ffd23f'; for(let i=0;i<7;i++){ c.beginPath(); c.arc(-30+i*10,-27,1.8,0,7); c.fill(); c.beginPath(); c.arc(-30+i*10,13,1.8,0,7); c.fill(); }
  c.fillStyle=hit&&side==='d'?'#fff8d8':'#f4e6c8'; c.beginPath(); c.ellipse(0,-34,34,10,0,0,7); c.fill(); c.strokeStyle=hit&&side==='k'?'#5ec8ff':'#2a1a26'; c.lineWidth=hit&&side==='k'?4:2.4; c.stroke();
  if(hit&&side==='d'){ c.fillStyle='rgba(255,90,70,.35)'; c.beginPath(); c.ellipse(0,-34,26,7,0,0,7); c.fill(); }
  c.restore(); }
// 鼓手站在大鼓後面：咚兩手一起敲鼓面、咔單手敲鼓邊、沒敲時鼓棒舉高跟著拍子晃
function drummer(c,x,y,k,o){ const L=o.L||{},h=o.hitting,armL=h?(o.side==='d'?.55:o.up):o.up,armR=h?(o.side==='d'?.55:1.25):o.up+.1;
  RHY.drawChibi(c,x,y-34*k,2.4*k,{t:o.t,face:1,body:L.color||'#e23b3b',happi:'#14122b',sleeve:L.color||'#e23b3b',acc:L.acc||'band',hairStyle:L.hair||'boy',armL,armR,bob:h?-1.5:o.bob||0,stick:true,mouth:h?'open':'w',capCol:'#4f9dff'});
  drawTaiko(c,x,y+6*k,1.7*k,o.drumHit,o.drumSide); }
// 音符：圓形、白邊，中間寫「咚」或「咔」
function drawNote(c,x,y,k,big,alpha){ const r=big?30:21,col=k==='d'?'#ff4d4d':'#3aa0ff'; if(alpha!=null) c.globalAlpha=alpha;
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.arc(x+2,y+3,r+3,0,7); c.fill();
  c.fillStyle='#fff'; c.beginPath(); c.arc(x,y,r+3,0,7); c.fill(); c.strokeStyle='#2a1a26'; c.lineWidth=2; c.stroke();
  const g=c.createRadialGradient(x-r*.3,y-r*.35,r*.15,x,y,r); g.addColorStop(0,k==='d'?'#ff9a8a':'#9ad6ff'); g.addColorStop(1,col); c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,7); c.fill();
  c.fillStyle='#fff'; c.font='900 '+Math.round(r*.95)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(k==='d'?'咚':'咔',x,y+1); c.globalAlpha=1; }

function create(env,opts){
  const si=clamp(opts.stage|0,0,29),th=Math.floor(si/5),song=RHY.makeSong(si,'drum'),L=opts.look||{};
  const spdMul=({slow:.8,normal:1,fast:1.3})[(opts.options||{}).speed||'normal']||1,SPEED=(300+song.bpm*1.1)*spdMul;
  // 譜面：重拍或往下走的音是「咚」，往上走的是「咔」；後面的關卡在樂句開頭放大音符、在樂句尾巴放連打
  const notes=RHY.makeChart(song,(o,prev,r)=>{ if(o.last){ o.k='d'; o.big=true; return; }
    const up=prev!=null&&o.m>prev; o.k=o.st%8===0||(!up&&r()<.8)||(up&&r()<.2)?'d':'k';
    if(o.phraseStart&&song.tier>=1&&r()<.6) o.big=true;
    if(song.tier>=1&&(o.bar-song.INTRO)%8===7&&o.st>=8&&o.ni===o.ni){ o.roll=true; } });
  // 連打：同一小節後半的音合併成一條黃色長條
  const chart=[]; for(const n of notes){ if(n.roll){ const prev=chart[chart.length-1]; if(prev&&prev.roll&&prev.bar===n.bar){ prev.te=n.t+n.len*song.sd*.8; continue; } chart.push({t:n.t,te:n.t+n.len*song.sd*.8,roll:true,bar:n.bar,hits:0}); } else chart.push({t:n.t,k:n.k,big:!!n.big}); }
  const P=RHY.Play(env,song,chart,{lead:2.4,fake:!!(opts.options||{}).__fake}); const {ctx:c}=env.canvas2d(W,H);
  const JX=170,LY=150;
  let t=0,ended=false,endT=0,hitFx=[],lastHit={d:0,k:0},judgeTxt=null,armT=0,armSide='d',paused=false,rollCount=0,beatT=0;
  function press(k){ const T=P.time(); lastHit[k]=.12; armT=.12; armSide=k; if(k==='d') P.syn.don(); else P.syn.ka();
    // 連打中：每一下都算
    const roll=chart.find(n=>n.roll&&T>=n.t-.05&&T<=n.te+.05); if(roll){ roll.hits++; rollCount++; P.score+=10; hitFx.push({x:JX,y:LY,t:0,col:'#ffd23f'}); return; }
    let best=null,bd=1; for(const n of chart){ if(n.roll||n.res) continue; const dt=T-n.t; if(dt<-RHY.WIN.good) break; if(Math.abs(dt)<=RHY.WIN.good&&n.k===k&&Math.abs(dt)<bd){ best=n; bd=Math.abs(dt); } }
    if(!best) return; const j=RHY.judgeOf(T-best.t); best.res=j; P.add(j,best.big); judgeTxt={j,t:0}; hitFx.push({x:JX,y:LY,t:0,col:RHY.JCOL[j],big:best.big}); }
  function update(dt){ t+=dt; for(const f of hitFx) f.t+=dt; hitFx=hitFx.filter(f=>f.t<.5); if(judgeTxt) judgeTxt.t+=dt; for(const k in lastHit) if(lastHit[k]>0) lastHit[k]-=dt; if(armT>0) armT-=dt;
    if(ended){ endT+=dt; if(endT>2.2) finish(); return; }
    P.tick(dt); const T=P.time();
    if(env.hit('KeyF')||env.hit('KeyJ')||env.hit('Space')) press('d');
    if(env.hit('KeyD')||env.hit('KeyK')) press('k');
    for(const n of chart){ if(n.roll||n.res) continue; if(T-n.t>RHY.WIN.good){ n.res='miss'; P.add('miss'); judgeTxt={j:'miss',t:0}; } else if(n.t>T) break; }
    if(T>song.dur+.6){ ended=true; endT=0; P.syn.stop(); env.sfx(P.rate()>=60?'win':'lose'); } }
  let done=false;
  function finish(){ if(done) return; done=true; const rate=P.rate(),clear=rate>=60,g=RHY.grade(rate),old=getRec(si),rec=clear&&(old==null||P.score>old);
    if(rec) try{ localStorage.setItem(recKey(si),String(P.score)); }catch(e){}
    const C=P.cnt,html='<table class="ls"><tr><th>完美</th><th>很好</th><th>不錯</th><th>MISS</th><th>最高連擊</th><th>連打</th></tr><tr><td>'+C.perfect+'</td><td>'+C.great+'</td><td>'+C.good+'</td><td>'+C.miss+'</td><td>'+P.maxCombo+'</td><td>'+rollCount+'</td></tr></table>';
    env.end({title:clear?'演奏成功！評價 '+g:'差一點點…',big:P.score+' 分',html,text:'「'+SONGS[si]+'」達成率 '+rate.toFixed(1)+'%（60% 以上過關）。'+(rec?'這關的新紀錄！':old!=null?'這關最高 '+old+' 分':''),score:clear?P.score:null,next:clear&&si<29}); }
  function draw(){ const T=P.time(); scene(c,W,H,th,t);
    // 上方：曲名、分數
    c.fillStyle='rgba(11,10,28,.72)'; rr(c,12,10,320,52,14); c.fill(); c.textAlign='left'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 18px '+TC; c.fillText('♪ '+SONGS[si],26,30); c.fillStyle='#cfd0ff'; c.font='700 11px '+TC; c.fillText('第 '+(si+1)+' 關・'+THEMES[th].name+'・'+song.bpm+' BPM',26,50);
    c.fillStyle='rgba(11,10,28,.72)'; rr(c,W-232,10,220,52,14); c.fill(); c.textAlign='right'; c.fillStyle='#fff'; c.font='900 24px '+PIX; c.fillText(String(P.score).padStart(7,'0'),W-24,32);
    // 達成率條（60% 那裡畫一條線）
    const rate=P.rate(),u=clamp(P.gain/Math.max(1,P.total),0,1); c.fillStyle='rgba(0,0,0,.4)'; rr(c,W-220,48,196,9,4); c.fill(); c.fillStyle=rate>=60?'#ffd23f':'#ff8a5d'; rr(c,W-220,48,Math.max(6,196*u),9,4); c.fill(); c.fillStyle='#fff'; c.fillRect(W-220+196*.6,45,2,15);
    // 軌道
    c.fillStyle='rgba(20,12,30,.78)'; rr(c,100,LY-48,W-110,96,20); c.fill(); c.strokeStyle='rgba(255,210,63,.65)'; c.lineWidth=3; c.stroke();
    // 節拍線
    const beat=60/song.bpm; c.strokeStyle='rgba(255,255,255,.12)'; c.lineWidth=2; for(let b=Math.ceil(T/beat);b*beat<T+(W-JX)/SPEED;b++){ const x=JX+(b*beat-T)*SPEED; if(x>110){ c.beginPath(); c.moveTo(x,LY-42); c.lineTo(x,LY+42); c.stroke(); } }
    // 判定圈
    c.strokeStyle='rgba(255,255,255,.85)'; c.lineWidth=3; c.beginPath(); c.arc(JX,LY,26,0,7); c.stroke(); c.strokeStyle='rgba(255,255,255,.4)'; c.beginPath(); c.arc(JX,LY,34,0,7); c.stroke();
    if(lastHit.d>0){ c.fillStyle='rgba(255,77,77,'+lastHit.d*4+')'; c.beginPath(); c.arc(JX,LY,30,0,7); c.fill(); } if(lastHit.k>0){ c.strokeStyle='rgba(58,160,255,'+lastHit.k*6+')'; c.lineWidth=8; c.beginPath(); c.arc(JX,LY,34,0,7); c.stroke(); }
    // 音符（後面的先畫，前面的蓋在上面）
    const vis=[]; for(const n of chart){ const xe=JX+((n.roll?n.te:n.t)-T)*SPEED,x=JX+(n.t-T)*SPEED; if(x>W+40) break; if(xe<JX-60) continue; if(n.res&&n.res!=='miss') continue; vis.push([n,x,xe]); }
    for(let i=vis.length-1;i>=0;i--){ const [n,x,xe]=vis[i];
      if(n.roll){ const x0=Math.max(JX,x),x1=Math.max(x0,xe); c.fillStyle='#ffb000'; rr(c,x0-20,LY-20,x1-x0+40,40,20); c.fill(); c.strokeStyle='#fff'; c.lineWidth=3; c.stroke(); c.fillStyle='#fff'; c.font='900 16px '+TC; c.textAlign='center'; c.textBaseline='middle'; if(x1-x0>40) c.fillText('連打！',(x0+x1)/2,LY+1); continue; }
      drawNote(c,x,LY,n.k,n.big,n.res==='miss'?.35:null); }
    for(const f of hitFx){ const u=f.t/.5; c.strokeStyle=f.col; c.globalAlpha=1-u; c.lineWidth=4; c.beginPath(); c.arc(f.x,f.y,30+u*(f.big?60:40),0,7); c.stroke(); for(let i=0;i<8;i++){ const a=i/8*6.28+f.t; c.fillStyle=f.col; c.beginPath(); c.arc(f.x+Math.cos(a)*(20+u*50),f.y+Math.sin(a)*(20+u*50),3,0,7); c.fill(); } c.globalAlpha=1; }
    if(judgeTxt&&judgeTxt.t<.6){ const j=judgeTxt.j; c.font='900 22px '+TC; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='#14122b'; const y=LY-62-judgeTxt.t*20; c.strokeText(RHY.JTXT[j],JX,y); c.fillStyle=RHY.JCOL[j]; c.fillText(RHY.JTXT[j],JX,y); }
    // 鼓手：咚兩手一起敲中間、咔單手敲鼓邊；沒敲的時候跟著拍子點頭
    const sw=Math.sin(T/beat*Math.PI),bob=Math.abs(sw)*2.5,hitting=armT>0,up=2.3+sw*.12,dx=150,dy=420;
    drummer(c,dx,dy,1,{t,L,hitting,side:armSide,up,bob,drumHit:lastHit.d>0||lastHit.k>0,drumSide:lastHit.d>0?'d':'k'});
    // 連擊
    if(P.combo>=5){ c.textAlign='center'; c.font='900 30px '+PIX; c.lineWidth=6; c.strokeStyle='#14122b'; c.strokeText(P.combo,dx+130,dy-10); c.fillStyle=P.combo>=50?'#ff7eb6':'#ffd23f'; c.fillText(P.combo,dx+130,dy-10); c.font='900 13px '+TC; c.fillStyle='#fff'; c.strokeText('連擊',dx+130,dy+18); c.fillText('連擊',dx+130,dy+18); }
    // 說明
    if(T<0){ c.fillStyle='rgba(11,10,28,.75)'; rr(c,W/2-210,262,420,96,18); c.fill(); c.textAlign='center'; c.fillStyle='#fff'; c.font='900 18px '+TC; c.fillText('紅色「咚」按 F／J，藍色「咔」按 D／K',W/2,292); c.fillStyle='#ffd23f'; c.font='900 30px '+PIX; c.fillText(T<-1.6?'3':T<-.8?'2':'1',W/2,334); }
    // 進度條
    c.fillStyle='rgba(0,0,0,.35)'; c.fillRect(0,H-6,W,6); c.fillStyle='#ffd23f'; c.fillRect(0,H-6,W*clamp(T/song.dur,0,1),6);
    if(ended&&endT>.3){ const ok=P.rate()>=60; c.textAlign='center'; c.font='900 40px '+TC; c.lineWidth=8; c.strokeStyle='#14122b'; c.strokeText(ok?'演奏成功！':'再接再厲',W/2,H/2+20); c.fillStyle=ok?'#ffd23f':'#ff8a8a'; c.fillText(ok?'演奏成功！':'再接再厲',W/2,H/2+20); } }
  return {update,draw,pause(p){ if(p===paused) return; paused=p; P.pause(p); },destroy(){ P.syn.stop(); },_dbg:{chart,P,song,press,get T(){ return P.time(); }}};
}

function stageShow(ctx,w,h,si,t){ scene(ctx,w,h,Math.floor(si/5),t); const k=w/800,song=RHY.makeSong(si,'drum');
  ctx.save(); ctx.scale(k,k); ctx.fillStyle='rgba(20,12,30,.78)'; rr(ctx,40,170,720,90,20); ctx.fill(); ctx.strokeStyle='rgba(255,210,63,.65)'; ctx.lineWidth=3; ctx.stroke();
  ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(110,215,26,0,7); ctx.stroke();
  const pat='dkddkdkkdd'; for(let i=0;i<pat.length;i++){ const x=110+((i*70-t*140)%700+700)%700; if(x<740) drawNote(ctx,x,215,pat[i],i%5===0); }
  const hh=Math.sin(t*8)>.6; drummer(ctx,140,410,.95,{t,hitting:hh,side:'d',up:2.3,bob:Math.abs(Math.sin(t*4))*2,drumHit:hh,drumSide:'d'});
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 34px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#14122b'; ctx.strokeText('♪ '+SONGS[si],470,90); ctx.fillStyle='#ffd23f'; ctx.fillText('♪ '+SONGS[si],470,90);
  ctx.font='900 20px '+TC; ctx.fillStyle='#fff'; ctx.strokeText(song.bpm+' BPM',470,128); ctx.fillText(song.bpm+' BPM',470,128); ctx.restore(); }
function thumb(ctx,w,h,t){ scene(ctx,w,h,0,t); const k=w/800; ctx.save(); ctx.scale(k,k); ctx.fillStyle='rgba(20,12,30,.78)'; rr(ctx,250,120,520,80,20); ctx.fill();
  for(let i=0;i<6;i++){ const x=300+((i*90-t*120)%540+540)%540; if(x<740) drawNote(ctx,x,160,'dkdkkd'[i],i===0); }
  const hh=Math.sin(t*7)>.5; drummer(ctx,170,400,1.15,{t,hitting:hh,side:'d',up:2.3,drumHit:hh,drumSide:'d'});
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 64px '+TC; ctx.lineWidth=10; ctx.strokeStyle='#14122b'; ctx.strokeText('節奏小鼓手',520,330); ctx.fillStyle='#ffd23f'; ctx.fillText('節奏小鼓手',520,330); ctx.restore(); }
function preview(ctx,w,h,L,t){ scene(ctx,w,h,2,t); const hit=Math.sin(t*6)>.5,side=Math.sin(t*3)>0?'d':'k'; drummer(ctx,w/2,h*.62,h/420,{t,L,hitting:hit,side,up:2.3,drumHit:hit,drumSide:side}); }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).drum={
  name:'節奏小鼓手',tag:'DRUM BEAT',color:'#ff5d4f',ownMusic:true,
  desc:'祭典的夜晚來打鼓！跟著原創曲子，紅色「咚」敲鼓面、藍色「咔」敲鼓邊，30 首曲子一首比一首快。',
  goal:'音符滑到左邊的圓圈時敲下去：紅色「咚」、藍色「咔」，黃色長條就連續狂敲。達成率 60% 以上過關。',
  stageGoal:si=>{ const s=RHY.makeSong(si,'drum'); return '「'+SONGS[si]+'」'+s.bpm+' BPM。音符滑到左邊圓圈時敲：紅色「咚」、藍色「咔」'+(s.tier>=1?'，大顆的音符分數加倍，黃色長條要連續狂敲':'')+'。達成率 60% 以上就過關，解鎖下一首。'; },
  stages:SONGS,stars:SONGS.map((s,i)=>1+Math.floor(i/6)),stageLabel:'選擇曲子',
  stageBest:i=>{ const v=getRec(i); return v==null?'':'✓ '+v+' 分'; },
  stageLocked:i=>i>0&&getRec(i-1)==null,
  modes:[{id:'1p',label:'開始演奏'}],
  options:[{key:'speed',label:'音符速度',def:'normal',opts:[{id:'slow',label:'慢'},{id:'normal',label:'正常'},{id:'fast',label:'快'}]}],
  help:[['F 或 J（空白鍵）','咚：紅色音符'],['D 或 K','咔：藍色音符'],['黃色長條','任何鍵連續狂敲']],
  touchHelp:[['咚','紅色音符'],['咔','藍色音符'],['黃色長條','兩顆都可以連續狂敲']],
  touch:{left:[{l:'咔',c:'KeyD',big:true}],right:[{l:'咚',c:'KeyJ',big:true,act:true}]},
  best:{label:'最高分',fmt:v=>v+' 分',lower:false},
  looks:[{key:'hair',label:'髮型',opts:[{id:'boy',label:'短髮'},{id:'girl',label:'長髮'},{id:'bun',label:'包包頭'}]},
    {key:'acc',label:'頭上',opts:[{id:'band',label:'頭巾'},{id:'cap',label:'帽子'},{id:'bow',label:'蝴蝶結'},{id:'none',label:'不戴'}]},
    {key:'color',label:'法被顏色',type:'color',opts:['#e23b3b','#ff8a3d','#ffd23f','#3ddbd9','#4f9dff','#b98cff','#ff7eb6']}],
  stageShow,preview,thumb,create
};
})();
