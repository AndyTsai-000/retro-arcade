// 舞動踩踩樂：箭頭從下往上升，碰到上面的框時按對應的方向鍵。30 首原創曲（用 drum.js 的節奏引擎 window.__RHY），
// 雙人同機（1P WASD、2P 方向鍵）或連線比分數；舞台上的 Q 版舞者照你按的方向跳舞。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PIX='"Press Start 2P","Noto Sans TC",monospace';
const R=()=>window.__RHY,clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const SONGS=['霓虹第一步','閃亮亮滑步','迪斯可貓咪','彩虹轉轉圈','午夜跳跳糖',
  '浪花衝浪舞','椰子森巴','沙灘排排站','夕陽小步舞','海鷗大合跳',
  '星光大道','麥克風派對','螢光棒揮揮','安可安可','舞台中央',
  '棉花糖踢踏','巧克力旋風','果凍彈彈跳','甜甜圈迴旋','糖果大遊行',
  '霓虹高速公路','機器人電音','飛天滑板','數位心跳','未來節拍',
  '月光摩天輪','旋轉木馬快跑','星月雙人舞','嘉年華狂歡','最終舞王'];
const THEMES=[{name:'霓虹舞廳',sky:['#1a0a3a','#3a0f5a'],floor:['#ff3ea5','#3ad8ff','#ffd23f','#7aff6b']},{name:'海灘派對',sky:['#ff8a5d','#ffd27a'],floor:['#ffd23f','#ff7eb6','#5ec8ff','#86dc4f']},
  {name:'星光演唱會',sky:['#0b0a2e','#2b1f5e'],floor:['#b77bff','#ffd23f','#5ec8ff','#ff7eb6']},{name:'糖果樂園',sky:['#ffb3d9','#ffe6f2'],floor:['#ff7eb6','#ffd23f','#7af0ff','#b77bff']},
  {name:'未來城市',sky:['#06142e','#103a5a'],floor:['#3ad8ff','#7a5cff','#3aff9a','#ff3ea5']},{name:'月光嘉年華',sky:['#140a30','#3a1f5a'],floor:['#ffd23f','#ff6b7d','#7af0ff','#c08aff']}];
const LCOL=['#ff5da8','#3aa0ff','#3adb7a','#ffa03a'],LANG=[Math.PI/2,0,Math.PI,-Math.PI/2]; // ← ↓ ↑ →（箭頭圖往下畫再旋轉）
const recKey=i=>'arcade.dance.s'+i,getRec=i=>{ try{ const v=localStorage.getItem(recKey(i)); return v==null?null:+v; }catch(e){ return null; } };

// 箭頭：厚厚的、有光澤
function arrow(c,x,y,s,lane,o){ o=o||{}; c.save(); c.translate(x,y); c.rotate(LANG[lane]); c.scale(s,s);
  const path=()=>{ c.beginPath(); c.moveTo(0,22); c.lineTo(-22,0); c.lineTo(-11,0); c.lineTo(-11,-20); c.lineTo(11,-20); c.lineTo(11,0); c.lineTo(22,0); c.closePath(); };
  if(o.target){ path(); c.fillStyle=o.flash?'rgba(255,255,255,'+(.25+o.flash*2)+')':'rgba(255,255,255,.08)'; c.fill(); c.lineJoin='round'; c.lineWidth=3.5; c.strokeStyle=o.flash?'#fff':'rgba(255,255,255,.55)'; c.stroke(); c.restore(); return; }
  if(o.alpha!=null) c.globalAlpha=o.alpha;
  path(); c.lineJoin='round'; c.lineWidth=7; c.strokeStyle='#1a1028'; c.stroke(); c.lineWidth=3.5; c.strokeStyle='#fff'; c.stroke();
  const g=c.createLinearGradient(-20,-20,20,20); g.addColorStop(0,'#fff'); g.addColorStop(.25,LCOL[lane]); g.addColorStop(1,LCOL[lane]); c.fillStyle=g; c.fill();
  c.fillStyle='rgba(255,255,255,.45)'; c.beginPath(); c.moveTo(-7,-16); c.lineTo(-2,-16); c.lineTo(-2,4); c.lineTo(-7,4); c.closePath(); c.fill(); c.restore(); }
// 舞台：背景、聚光燈、觀眾、會跟著拍子亮的地板
function stage(c,w,h,th,t,beat){ const T=THEMES[th],k=w/800,g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,T.sky[0]); g.addColorStop(1,T.sky[1]); c.fillStyle=g; c.fillRect(0,0,w,h);
  const pulse=Math.max(0,1-((beat%1)+1)%1*3);
  if(th===0||th===2||th===5){ for(let i=0;i<60;i++){ const a=.3+.6*Math.abs(Math.sin(t*1.4+i)); c.fillStyle='rgba(255,255,255,'+a+')'; c.fillRect((i*137%800)*k,(i*71%280)*k,1.6*k,1.6*k); } }
  if(th===0){ const bx=w*.5,by=h*.27,r=26*k; c.strokeStyle='#888'; c.lineWidth=2*k; c.beginPath(); c.moveTo(bx,0); c.lineTo(bx,by-r); c.stroke(); const gg=c.createRadialGradient(bx-8*k,by-8*k,2,bx,by,r); gg.addColorStop(0,'#fff'); gg.addColorStop(1,'#8a8aa8'); c.fillStyle=gg; c.beginPath(); c.arc(bx,by,r,0,7); c.fill();
    for(let i=0;i<14;i++){ const a=t*1.5+i*.45; c.fillStyle=T.floor[i%4]; c.globalAlpha=.6; c.beginPath(); c.arc(bx+Math.cos(a)*w*.35,by+Math.abs(Math.sin(a*1.3))*h*.5,4*k,0,7); c.fill(); } c.globalAlpha=1; }
  else if(th===1){ c.fillStyle='rgba(255,240,160,.9)'; c.beginPath(); c.arc(w*.75,h*.38,46*k,0,7); c.fill(); c.fillStyle='#3a9ad8'; c.fillRect(0,h*.42,w,h*.2); c.strokeStyle='rgba(255,255,255,.4)'; c.lineWidth=2*k; for(let j=0;j<3;j++){ c.beginPath(); for(let x=0;x<=w;x+=20*k) c.lineTo(x,h*(.46+j*.05)+Math.sin(x/40/k+t*2+j)*3*k); c.stroke(); }
    for(const x of [.08,.94]){ c.strokeStyle='#6b4a2a'; c.lineWidth=8*k; c.beginPath(); c.moveTo(w*x,h*.62); c.quadraticCurveTo(w*x+10*k,h*.4,w*x-6*k,h*.22); c.stroke(); c.fillStyle='#3fa05a'; for(let i=0;i<5;i++){ const a=i/5*6.28+Math.sin(t)*.1; c.beginPath(); c.ellipse(w*x-6*k+Math.cos(a)*30*k,h*.22+Math.sin(a)*12*k,30*k,8*k,a,0,7); c.fill(); } } }
  else if(th===2){ for(let i=0;i<5;i++){ const a=Math.sin(t*.9+i*1.3)*.45; c.save(); c.translate(w*(.1+i*.2),0); c.rotate(a); const g2=c.createLinearGradient(0,0,0,h*.75); g2.addColorStop(0,'rgba(255,240,200,.4)'); g2.addColorStop(1,'rgba(255,240,200,0)'); c.fillStyle=g2; c.beginPath(); c.moveTo(-6*k,0); c.lineTo(6*k,0); c.lineTo(80*k,h*.75); c.lineTo(-80*k,h*.75); c.fill(); c.restore(); } }
  else if(th===3){ for(let i=0;i<4;i++){ const x=((i*230+t*14)%(w+160))-80,y=60*k+i%2*40*k; c.fillStyle='rgba(255,255,255,.85)'; for(const [dx,dy,r] of [[0,0,26],[24,-10,22],[46,0,24]]){ c.beginPath(); c.arc(x+dx*k,y+dy*k,r*k,0,7); c.fill(); } }
    for(const [x,col] of [[.08,'#ff5d8f'],[.93,'#7a5cff']]){ const X=w*x,Y=h*.6,Rr=28*k; c.strokeStyle='#fff'; c.lineWidth=5*k; c.beginPath(); c.moveTo(X,Y); c.lineTo(X,Y-Rr*3); c.stroke(); c.fillStyle=col; c.beginPath(); c.arc(X,Y-Rr*3,Rr,0,7); c.fill(); c.strokeStyle='rgba(255,255,255,.8)'; c.lineWidth=3*k; c.beginPath(); for(let a=0;a<12;a+=.3) c.lineTo(X+Math.cos(a+t)*Rr*a/12,Y-Rr*3+Math.sin(a+t)*Rr*a/12); c.stroke(); } }
  else if(th===4){ for(let i=0;i<14;i++){ const bw=40*k+(i*17%30)*k,bh=h*(.2+(i*37%40)/100),x=i*w/13; c.fillStyle='#0a1a3a'; c.fillRect(x,h*.62-bh,bw,bh); c.fillStyle=T.floor[i%4]; c.globalAlpha=.6; for(let y=h*.62-bh+8*k;y<h*.6;y+=14*k) for(let xx=x+6*k;xx<x+bw-6*k;xx+=12*k) if((xx*7+y*3+Math.floor(t*2))%5<2) c.fillRect(xx,y,5*k,6*k); c.globalAlpha=1; }
    c.strokeStyle='#3ad8ff'; c.lineWidth=2*k; c.globalAlpha=.5; for(let i=0;i<3;i++){ const y=h*(.15+i*.08); c.beginPath(); c.moveTo(((t*200+i*300)%(w+200))-100,y); c.lineTo(((t*200+i*300)%(w+200))-40,y); c.stroke(); } c.globalAlpha=1; }
  else { const fx=w*.8,fy=h*.36,fr=110*k; c.strokeStyle='#ffd23f'; c.lineWidth=3*k; c.beginPath(); c.arc(fx,fy,fr,0,7); c.stroke(); for(let i=0;i<8;i++){ const a=t*.3+i/8*6.28; c.beginPath(); c.moveTo(fx,fy); c.lineTo(fx+Math.cos(a)*fr,fy+Math.sin(a)*fr); c.stroke(); c.fillStyle=T.floor[i%4]; rr(c,fx+Math.cos(a)*fr-8*k,fy+Math.sin(a)*fr-6*k,16*k,14*k,3*k); c.fill(); }
    c.fillStyle='#fff8d0'; c.beginPath(); c.arc(w*.15,h*.18,26*k,0,7); c.fill(); c.fillStyle=T.sky[0]; c.beginPath(); c.arc(w*.15+10*k,h*.15,22*k,0,7); c.fill(); }
  // 地板：格子跟著拍子亮
  const fy=h*.62,rows=5,cols=10; for(let r2=0;r2<rows;r2++) for(let q=0;q<cols;q++){ const y0=fy+(r2/rows)**1.4*(h-fy),y1=fy+((r2+1)/rows)**1.4*(h-fy),sx=(y=>.5+(y-fy)/(h-fy)*.5),x0=w/2+(q/cols-.5)*w*sx(y0)*1.6,x1=w/2+((q+1)/cols-.5)*w*sx(y0)*1.6,x2=w/2+((q+1)/cols-.5)*w*sx(y1)*1.6,x3=w/2+(q/cols-.5)*w*sx(y1)*1.6;
    const on=(q+r2+Math.floor(beat))%3===0; c.fillStyle=on?T.floor[(q+r2)%4]:'rgba(20,10,40,.85)'; c.globalAlpha=on?.55+pulse*.4:1; c.beginPath(); c.moveTo(x0,y0); c.lineTo(x1,y0); c.lineTo(x2,y1); c.lineTo(x3,y1); c.closePath(); c.fill(); c.globalAlpha=1; c.strokeStyle='rgba(255,255,255,.15)'; c.lineWidth=1; c.stroke(); }
  // 觀眾剪影（跟著拍子跳）
  c.fillStyle='rgba(10,5,25,.9)'; for(let i=0;i<22;i++){ const x=(i+.5)*w/22,jy=((Math.floor(beat)+i)%2?pulse*6*k:0),y=h-6*k-jy; c.beginPath(); c.arc(x,y-30*k,10*k,0,7); c.fill(); rr(c,x-12*k,y-20*k,24*k,30*k,8*k); c.fill(); if(i%3===0){ c.fillStyle=T.floor[i%4]; c.fillRect(x+8*k,y-58*k-jy,3*k,22*k); c.fillStyle='rgba(10,5,25,.9)'; } } }
// 舞者：照最後按的方向擺姿勢
function dancer(c,x,y,s,o){ const P=o.pose,u=o.pt>0?1:0,b=Math.sin(o.beat*Math.PI); let a={armL:.35+Math.max(0,b)*1.6,armR:.35+Math.max(0,-b)*1.6,legL:-.15,legR:.15,bob:Math.abs(b)*2.5,face:o.face||1,mouth:'w'};
  if(u){ if(P===0) a={armL:1.6,armR:.25,legL:-.55,legR:.1,bob:0,face:-1,mouth:'open'}; else if(P===3) a={armL:.25,armR:1.6,legL:-.1,legR:.55,bob:0,face:1,mouth:'open'};
    else if(P===2) a={armL:2.8,armR:2.8,legL:-.1,legR:.1,bob:4,face:o.face||1,mouth:'open'}; else if(P===1) a={armL:.9,armR:.9,legL:-.7,legR:.7,bob:-3.5,face:o.face||1,mouth:'w'}; }
  if(o.miss>0){ a.mouth='o'; a.armL=2.2; a.armR=.3; }
  const L=o.L||{}; R().drawChibi(c,x,y,s,Object.assign({t:o.t,body:L.color||'#7a5cff',pants:'#2b2b44',shoe:'#fff',acc:L.acc||'phones',hairStyle:L.hair||'girl',capCol:L.color||'#ff5d8f',hair:L.hairCol},a)); }

function create(env,opts){
  const RHY=R(),net=opts.net,two=!net&&opts.mode==='2p',si=clamp(opts.stage|0,0,29),_e=RHY.setEase(si),th=Math.floor(si/5),song=RHY.makeSong(si,'dance'),L=opts.look||{};
  const me=net?net.me:0,np=two||net?2:1,names=net?(net.names||['玩家 1','玩家 2']):two?['1P','2P']:[opts.name||'你'];
  const SPEED=(250+song.bpm*1.3)*(({slow:.8,normal:1,fast:1.3})[(opts.options||{}).speed]||1);
  // 譜面：旋律往上走就按 ↑／→，往下走按 ↓／←，一樣高就左右換；後面的關卡在樂句開頭加「雙踩」
  const base=RHY.makeChart(song,(o,prev,r)=>{ let ln; if(prev==null||o.m===prev) ln=r()<.5?0:3; else if(o.m>prev) ln=r()<.6?2:3; else ln=r()<.6?1:0; o.k=ln; if(song.tier>=2&&o.phraseStart&&r()<.7) o.jump=true; });
  let lastLn=-1,lastT=-9; const chart=[]; for(const n of base){ let ln=n.k; if(ln===lastLn&&n.t-lastT<.2) ln=(ln+2)%4; lastLn=ln; lastT=n.t; chart.push({t:n.t,ln}); if(n.jump){ chart.push({t:n.t,ln:(ln+1+((n.m|0)%3))%4}); } }
  chart.sort((a,b)=>a.t-b.t||a.ln-b.ln); chart.forEach((n,i)=>n.i=i);
  // 每位玩家各自一份判定紀錄（連線時對手的由對方送來）
  const P=RHY.Play(env,song,chart.map(n=>({t:n.t,ln:n.ln})),{lead:2.4}),players=[];
  for(let p=0;p<np;p++){ const local=!net||p===me; players.push({p,local,res:new Array(chart.length).fill(null),score:0,combo:0,maxCombo:0,cnt:{perfect:0,great:0,good:0,miss:0},gain:0,flash:[0,0,0,0],judge:null,pose:-1,pt:0,miss:0,fx:[]}); }
  const {ctx:c}=env.canvas2d(W,H);
  const KEYS=two?[[['KeyA'],['KeyS'],['KeyW'],['KeyD']],[['ArrowLeft'],['ArrowDown'],['ArrowUp'],['ArrowRight']]]:[[['ArrowLeft','KeyA'],['ArrowDown','KeyS'],['ArrowUp','KeyW'],['ArrowRight','KeyD']]];
  let t=0,ended=false,endT=0,paused=false,sendT=0,outbox=[],oppDone=null,myDone=false;
  const rate=pl=>pl.gain/Math.max(1,chart.length)*100;
  function mark(pl,i,j){ if(pl.res[i]) return; pl.res[i]=j; pl.cnt[j]++; if(j==='miss'){ pl.combo=0; pl.miss=.4; } else { pl.combo++; pl.maxCombo=Math.max(pl.maxCombo,pl.combo); pl.gain+=j==='perfect'?1:j==='great'?.8:.5; pl.score+=Math.round(RHY.JPT[j]*(1+Math.min(pl.combo,100)/100)); }
    pl.judge={j,t:0}; if(pl.local&&net) outbox.push([i,j]); }
  function press(pl,ln){ const T=P.time(); pl.flash[ln]=.15; pl.pose=ln; pl.pt=.28;
    let best=-1,bd=1; for(const n of chart){ if(n.t-T>RHY.WIN.good) break; if(n.ln!==ln||pl.res[n.i]) continue; const d=Math.abs(T-n.t); if(d<=RHY.WIN.good&&d<bd){ best=n.i; bd=d; } }
    if(best<0) return; const j=RHY.judgeOf(T-chart[best].t); mark(pl,best,j); pl.fx.push({ln,t:0,col:RHY.JCOL[j]}); }
  if(net){ net.onmsg=m=>{ const op=players[1-me]; if(m.jd) for(const [i,j] of m.jd){ if(!op.res[i]){ mark(op,i,j); if(j!=='miss'){ op.pose=chart[i].ln; op.pt=.28; op.flash[chart[i].ln]=.15; } } } if(m.fin) oppDone=m.fin; };
    net.onleave=()=>{ oppDone=oppDone||{left:true}; }; }
  function update(dt){ t+=dt;
    for(const pl of players){ for(let l=0;l<4;l++) if(pl.flash[l]>0) pl.flash[l]-=dt; if(pl.pt>0) pl.pt-=dt; if(pl.miss>0) pl.miss-=dt; if(pl.judge) pl.judge.t+=dt; for(const f of pl.fx) f.t+=dt; pl.fx=pl.fx.filter(f=>f.t<.35); }
    if(ended){ endT+=dt; if(endT>2.2&&(!net||oppDone)) finish(); else if(endT>8) finish(); return; }
    P.tick(dt); const T=P.time();
    players.forEach((pl,pi)=>{ if(!pl.local) return; const K=KEYS[two?pi:0]; for(let l=0;l<4;l++) if(K[l].some(k=>env.hit(k))) press(pl,l);
      for(const n of chart){ if(n.t>T) break; if(!pl.res[n.i]&&T-n.t>RHY.WIN.good) mark(pl,n.i,'miss'); } });
    if(net){ sendT-=dt; if(sendT<=0&&outbox.length){ sendT=.1; net.send({jd:outbox}); outbox=[]; } }
    if(T>song.dur+.6){ ended=true; endT=0; P.syn.stop(); const pl=players[me]; if(net){ if(outbox.length) net.send({jd:outbox}); outbox=[]; net.send({fin:{score:pl.score}}); } env.sfx(rate(pl)>=60?'win':'lose'); } }
  let done=false;
  function finish(){ if(done) return; done=true;
    const row=pl=>{ const C=pl.cnt; return '<tr><td>'+names[pl.p]+'</td><td>'+pl.score+'</td><td>'+RHY.grade(rate(pl))+'</td><td>'+rate(pl).toFixed(1)+'%</td><td>'+C.perfect+' / '+C.great+' / '+C.good+' / '+C.miss+'</td><td>'+pl.maxCombo+'</td></tr>'; };
    const html='<table class="ls"><tr><th>玩家</th><th>分數</th><th>評價</th><th>達成率</th><th>完美／很好／不錯／MISS</th><th>最高連擊</th></tr>'+players.map(row).join('')+'</table>';
    if(np===1){ const pl=players[0],r2=rate(pl),clear=r2>=60,old=getRec(si),rec=clear&&(old==null||pl.score>old); if(rec) try{ localStorage.setItem(recKey(si),String(pl.score)); }catch(e){}
      env.end({title:clear?'跳得好！評價 '+RHY.grade(r2):'差一點點…',big:pl.score+' 分',html,text:'「'+SONGS[si]+'」達成率 '+r2.toFixed(1)+'%（60% 以上過關）。'+(rec?'這關的新紀錄！':old!=null?'這關最高 '+old+' 分':''),score:clear?pl.score:null,next:clear&&si<29}); return; }
    const a=players[0].score,b=players[1].score,w=a===b?-1:a>b?0:1;
    env.end({title:w<0?'平手！':net?(w===me?'你贏了！':names[w]+' 獲勝'):names[w]+' 獲勝！',big:a+' ： '+b,html,text:'兩個人跳同一首「'+SONGS[si]+'」，分數高的贏。',score:null}); }

  /* ---------- 畫面 ---------- */
  function lanes(pl,x0,label,highlight){ const T=P.time(),LW=60,TY=78; c.fillStyle='rgba(8,4,20,.55)'; rr(c,x0-8,8,LW*4+16,H-16,16); c.fill(); if(highlight){ c.strokeStyle='#ffd23f'; c.lineWidth=2; c.stroke(); }
    for(let l=0;l<4;l++) arrow(c,x0+LW*l+LW/2,TY,1.15,l,{target:true,flash:Math.max(0,pl.flash[l])});
    for(let i=chart.length-1;i>=0;i--){ const n=chart[i],y=TY+(n.t-T)*SPEED; if(y>H+40||y<TY-40) continue; const r=pl.res[n.i]; if(r&&r!=='miss') continue; arrow(c,x0+LW*n.ln+LW/2,y,1.08,n.ln,{alpha:r==='miss'?.3:null}); }
    for(const f of pl.fx){ const u=f.t/.35,x=x0+LW*f.ln+LW/2; c.strokeStyle=f.col; c.globalAlpha=1-u; c.lineWidth=5; c.beginPath(); c.arc(x,TY,26+u*30,0,7); c.stroke(); c.globalAlpha=1; }
    if(pl.judge&&pl.judge.t<.6){ const j=pl.judge.j,x=x0+LW*2,y=200-pl.judge.t*16; c.font='900 30px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=6; c.strokeStyle='#14122b'; c.strokeText(RHY.JTXT[j],x,y); c.fillStyle=RHY.JCOL[j]; c.fillText(RHY.JTXT[j],x,y);
      if(pl.combo>=4){ c.font='900 26px '+PIX; c.strokeText(pl.combo,x,y+42); c.fillStyle='#fff'; c.fillText(pl.combo,x,y+42); c.font='900 12px '+TC; c.fillText('連擊',x,y+66); } }
    c.textAlign='center'; c.fillStyle='rgba(11,10,28,.8)'; rr(c,x0,H-58,LW*4,46,12); c.fill(); c.fillStyle='#ffd23f'; c.font='900 13px '+TC; c.fillText(label,x0+LW*2,H-44); c.fillStyle='#fff'; c.font='900 16px '+PIX; c.fillText(String(pl.score).padStart(7,'0'),x0+LW*2,H-24);
    const u=clamp(pl.gain/Math.max(1,chart.length),0,1); c.fillStyle='rgba(0,0,0,.4)'; rr(c,x0+8,H-13,LW*4-16,6,3); c.fill(); c.fillStyle=rate(pl)>=60?'#ffd23f':'#ff8a5d'; rr(c,x0+8,H-13,Math.max(6,(LW*4-16)*u),6,3); c.fill(); c.fillStyle='#fff'; c.fillRect(x0+8+(LW*4-16)*.6,H-15,2,10); }
  function draw(){ const T=P.time(),beat=T/(60/song.bpm); stage(c,W,H,th,t,beat);
    if(np===1){ lanes(players[0],40,'第 '+(si+1)+' 關',false); const pl=players[0]; dancer(c,560,420,3.4,{t,beat,pose:pl.pose,pt:pl.pt,miss:pl.miss,L});
      c.fillStyle='rgba(11,10,28,.72)'; rr(c,350,12,438,52,14); c.fill(); c.textAlign='left'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 18px '+TC; c.fillText('♪ '+SONGS[si],366,32); c.fillStyle='#cfd0ff'; c.font='700 11px '+TC; c.fillText(THEMES[th].name+'・'+song.bpm+' BPM',366,52); }
    else { lanes(players[0],24,names[0],net&&me===0); lanes(players[1],W-24-240,names[1],net&&me===1);
      const L2=Object.assign({},L,{color:'#ff7a3a',hair:'boy',acc:'cap'}); dancer(c,345,430,2.3,{t,beat,pose:players[0].pose,pt:players[0].pt,miss:players[0].miss,L:me===0?L:L2,face:1}); dancer(c,455,430,2.3,{t,beat,pose:players[1].pose,pt:players[1].pt,miss:players[1].miss,L:me===1&&net?L:L2,face:-1});
      c.textAlign='center'; c.fillStyle='rgba(11,10,28,.72)'; rr(c,284,12,232,44,12); c.fill(); c.fillStyle='#ffd23f'; c.font='900 15px '+TC; c.textBaseline='middle'; c.fillText('♪ '+SONGS[si],400,34); }
    if(T<0){ c.fillStyle='rgba(11,10,28,.75)'; rr(c,W/2-200,250,400,90,18); c.fill(); c.textAlign='center'; c.fillStyle='#fff'; c.font='900 17px '+TC; c.fillText(two?'1P：W A S D　2P：方向鍵':'箭頭碰到上面的框時按方向鍵',W/2,278); c.fillStyle='#ffd23f'; c.font='900 30px '+PIX; c.fillText(T<-1.6?'3':T<-.8?'2':'1',W/2,318); }
    c.fillStyle='rgba(0,0,0,.35)'; c.fillRect(0,H-4,W,4); c.fillStyle='#ffd23f'; c.fillRect(0,H-4,W*clamp(T/song.dur,0,1),4);
    if(ended&&endT>.3){ c.textAlign='center'; c.font='900 40px '+TC; c.lineWidth=8; c.strokeStyle='#14122b'; const txt=net&&!oppDone?'等對手跳完…':'結束！'; c.strokeText(txt,W/2,H/2); c.fillStyle='#ffd23f'; c.fillText(txt,W/2,H/2); } }
  return {update,draw,pause(p){ if(p===paused) return; paused=p; P.pause(p); },destroy(){ P.syn.stop(); },_dbg:{chart,players,song,press,get T(){ return P.time(); }}};
}

function stageShow(ctx,w,h,si,t){ const RHY=R(); if(!RHY) return; const song=RHY.makeSong(si,'dance'),beat=t*song.bpm/60; stage(ctx,w,h,Math.floor(si/5),t,beat); const k=w/800;
  ctx.save(); ctx.scale(k,k); ctx.fillStyle='rgba(8,4,20,.55)'; rr(ctx,40,20,256,460,16); ctx.fill();
  for(let l=0;l<4;l++) arrow(ctx,40+30+l*64,70,1.1,l,{target:true}); for(let i=0;i<8;i++){ const y=70+((i*70-t*200)%560+560)%560; arrow(ctx,40+30+(i*3%4)*64,y,1,(i*3)%4); }
  const pose=Math.floor(beat)%4; dancer(ctx,560,430,3.2,{t,beat,pose,pt:(beat%1)<.4?1:0,miss:0});
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 32px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#14122b'; ctx.strokeText('♪ '+SONGS[si],560,60); ctx.fillStyle='#ffd23f'; ctx.fillText('♪ '+SONGS[si],560,60);
  ctx.font='900 20px '+TC; ctx.fillStyle='#fff'; ctx.strokeText(song.bpm+' BPM',560,96); ctx.fillText(song.bpm+' BPM',560,96); ctx.restore(); }
function thumb(ctx,w,h,t){ if(!R()) return; const beat=t*2; stage(ctx,w,h,0,t,beat); const k=w/800; ctx.save(); ctx.scale(k,k);
  for(let l=0;l<4;l++) arrow(ctx,90+l*70,90,1.2,l,{target:true}); for(let i=0;i<6;i++){ const y=90+((i*90-t*220)%540+540)%540; arrow(ctx,90+(i%4)*70,y,1.1,i%4); }
  dancer(ctx,600,440,3.6,{t,beat,pose:Math.floor(beat)%4,pt:(beat%1)<.45?1:0,miss:0});
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 60px '+TC; ctx.lineWidth=10; ctx.strokeStyle='#14122b'; ctx.strokeText('舞動踩踩樂',580,90); ctx.fillStyle='#ffd23f'; ctx.fillText('舞動踩踩樂',580,90); ctx.restore(); }
function preview(ctx,w,h,L,t){ if(!R()) return; const beat=t*2; stage(ctx,w,h,3,t,beat); dancer(ctx,w/2,h*.92,h/150,{t,beat,pose:Math.floor(beat)%4,pt:(beat%1)<.45?1:0,miss:0,L}); }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).dance={
  name:'舞動踩踩樂',tag:'DANCE STEP',color:'#ff5da8',ownMusic:true,online:true,maxPlayers:2,
  desc:'箭頭從下面升上來，碰到上面的框就按方向鍵！30 首原創舞曲，舞台上的小舞者跟著你跳；可以兩個人比分數。',
  goal:'箭頭碰到上面的框時按對應的方向鍵，越準分數越高。達成率 60% 以上過關；雙人比分數。',
  stageGoal:si=>{ const s=R()?R().makeSong(si,'dance'):null; return '「'+SONGS[si]+'」'+(s?s.bpm+' BPM。':'')+'箭頭碰到上面的框時按方向鍵'+(s&&s.tier>=2?'，兩個箭頭一起來就兩個鍵一起按':'')+'。達成率 60% 以上過關，解鎖下一首；雙人時分數高的贏。'; },
  stages:SONGS,stars:SONGS.map((s,i)=>1+Math.floor(i/6)),stageLabel:'選擇曲子',
  stageBest:i=>{ const v=getRec(i); return v==null?'':'✓ '+v+' 分'; },
  stageLocked:i=>i>0&&getRec(i-1)==null,
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人比賽',kb:true}],
  options:[{key:'speed',label:'箭頭速度',def:'normal',opts:[{id:'slow',label:'慢'},{id:'normal',label:'正常'},{id:'fast',label:'快'}]}],
  help:[['← ↓ ↑ →','箭頭碰到框時按（也可以用 W A S D）'],['兩個箭頭','一起按'],['雙人','1P：W A S D；2P：方向鍵']],
  touchHelp:[['◀ ▼ ▲ ▶','箭頭碰到上面的框時按'],['兩個箭頭','兩個按鈕一起按']],
  touch:{left:[{l:'◀',c:'ArrowLeft',big:true},{l:'▼',c:'ArrowDown',big:true}],right:[{l:'▲',c:'ArrowUp',big:true},{l:'▶',c:'ArrowRight',big:true,act:true}]},
  best:{label:'最高分',fmt:v=>v+' 分',lower:false},
  looks:[{key:'hair',label:'髮型',opts:[{id:'girl',label:'長髮'},{id:'boy',label:'短髮'},{id:'bun',label:'包包頭'}]},
    {key:'acc',label:'頭上',opts:[{id:'phones',label:'耳機'},{id:'cap',label:'帽子'},{id:'bow',label:'蝴蝶結'},{id:'none',label:'不戴'}]},
    {key:'color',label:'衣服顏色',type:'color',opts:['#7a5cff','#ff5da8','#3aa0ff','#3adb7a','#ffa03a','#ffd23f','#e23b3b']}],
  stageShow,preview,thumb,create
};
})();
