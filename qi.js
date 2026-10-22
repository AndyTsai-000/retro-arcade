// 棋類派對：圍棋、五子棋、跳棋、象棋、暗棋、象棋麻將六種棋戲。
// 單機和電腦下，或兩個人在同一台輪流下；連線時房主負責判定與電腦，其他人只送出動作（作法同骰子派對）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',KAI='"BiauKai","DFKai-SB","標楷體","KaiTi","STKaiti","Noto Serif TC","Songti TC",serif';
const GAMES=['圍棋','五子棋','跳棋','象棋','暗棋','象棋麻將'],GID=['go','gm','cc','xq','bq','mj'];
const clamp=(v,a,b)=>v<a?a:v>b?b:v,rand=n=>Math.floor(Math.random()*n);
const shuffle=a=>{ for(let i=a.length-1;i>0;i--){ const j=rand(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const D4=[[-1,0],[1,0],[0,-1],[0,1]],DD=[[-1,-1],[-1,1],[1,-1],[1,1]];
// 棋子種類：1 帥將、2 仕士、3 相象、4 傌馬、5 俥車、6 炮包、7 兵卒；黑方再加 8
const PN=[['','帥','仕','相','傌','俥','炮','兵'],['','將','士','象','馬','車','包','卒']];

/* ---------- 共用畫法：背景、木紋棋盤、棋子、圍棋子、彈珠 ---------- */
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function shade(hex,f){ const n=parseInt(String(hex).slice(1),16); if(isNaN(n)) return hex; const ch=v=>clamp(Math.round(v*f),0,255); return 'rgb('+ch((n>>16)&255)+','+ch((n>>8)&255)+','+ch(n&255)+')'; }
function wood(c,x,y,w,h,col,k){ k=k||1;
  c.fillStyle='rgba(0,0,0,.35)'; rr(c,x+5*k,y+8*k,w,h,8*k); c.fill();
  const g=c.createLinearGradient(x,y,x+w,y+h); g.addColorStop(0,shade(col,1.08)); g.addColorStop(.5,col); g.addColorStop(1,shade(col,.84)); c.fillStyle=g; rr(c,x,y,w,h,8*k); c.fill();
  c.save(); rr(c,x,y,w,h,8*k); c.clip(); c.strokeStyle='rgba(110,60,15,.13)'; c.lineWidth=1.2*k;
  for(let i=0;i<24;i++){ const yy=y+(i+.5)*h/24; c.beginPath(); for(let s=0;s<=20;s++){ const xx=x+s*w/20,v=yy+Math.sin(s*.31+i*1.7)*3*k+Math.sin(s*.9+i)*1.2*k; s?c.lineTo(xx,v):c.moveTo(xx,v); } c.stroke(); }
  c.restore(); c.strokeStyle='rgba(60,30,8,.45)'; c.lineWidth=2*k; rr(c,x,y,w,h,8*k); c.stroke(); }
function stone(c,x,y,r,col,al){ c.save(); if(al!=null) c.globalAlpha=al;
  c.fillStyle='rgba(0,0,0,.32)'; c.beginPath(); c.arc(x+r*.12,y+r*.2,r,0,7); c.fill();
  const g=c.createRadialGradient(x-r*.35,y-r*.4,r*.08,x,y,r);
  if(col===1){ g.addColorStop(0,'#707070'); g.addColorStop(.35,'#2c2c2c'); g.addColorStop(1,'#060606'); } else { g.addColorStop(0,'#ffffff'); g.addColorStop(.6,'#eeede6'); g.addColorStop(1,'#b7b5aa'); }
  c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,7); c.fill(); c.restore(); }
function piece(c,x,y,r,col,ty,o){ o=o||{}; c.save(); if(o.al!=null) c.globalAlpha=o.al;
  if(o.sx!=null){ c.translate(x,y); c.scale(Math.max(.02,o.sx),1); c.translate(-x,-y); }
  c.fillStyle='rgba(0,0,0,.33)'; c.beginPath(); c.ellipse(x+r*.08,y+r*.22,r,r*.98,0,0,7); c.fill();
  c.fillStyle=o.back?'#6e4520':'#a8783e'; c.beginPath(); c.arc(x,y+r*.13,r,0,7); c.fill();
  const g=c.createRadialGradient(x-r*.3,y-r*.35,r*.1,x,y,r*1.05);
  if(o.back){ g.addColorStop(0,'#d7a464'); g.addColorStop(1,'#93602f'); } else { g.addColorStop(0,'#fff7e2'); g.addColorStop(.7,'#f1dbab'); g.addColorStop(1,'#cfa86a'); }
  c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,7); c.fill();
  if(o.back){ c.strokeStyle='rgba(80,45,12,.42)'; c.lineWidth=Math.max(1,r*.06); for(const f of [.8,.52,.26]){ c.beginPath(); c.arc(x,y,r*f,0,7); c.stroke(); } }
  else { const ink=col?'#1e1c1a':'#c2261b'; c.strokeStyle=ink; c.lineWidth=Math.max(1,r*.07); c.beginPath(); c.arc(x,y,r*.8,0,7); c.stroke();
    c.fillStyle=ink; c.font='900 '+Math.round(r*1.12)+'px '+KAI; c.textAlign='center'; c.textBaseline='middle'; c.fillText(PN[col][ty],x,y+r*.07); }
  if(o.hl){ c.strokeStyle=o.hl; c.lineWidth=Math.max(2,r*.14); c.beginPath(); c.arc(x,y,r*1.1,0,7); c.stroke(); }
  c.restore(); }
function marble(c,x,y,r,col,al){ c.save(); if(al!=null) c.globalAlpha=al;
  c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.arc(x+r*.12,y+r*.22,r,0,7); c.fill();
  const g=c.createRadialGradient(x-r*.35,y-r*.4,r*.05,x,y,r); g.addColorStop(0,'#ffffff'); g.addColorStop(.25,shade(col,1.25)); g.addColorStop(.75,col); g.addColorStop(1,shade(col,.55));
  c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,7); c.fill(); c.fillStyle='rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(x-r*.3,y-r*.42,r*.28,r*.16,-.5,0,7); c.fill(); c.restore(); }
// 每種棋預設的場景：圍棋在和室、五子棋在庭園、跳棋在遊戲室、象棋在公園、暗棋在廟口、象棋麻將在茶館
const THEME={go:'tatami',gm:'garden',cc:'play',xq:'park',bq:'temple',mj:'tea'};
const savedLook=()=>{ try{ return JSON.parse(localStorage.getItem('arcade.look.qi')||'null')||{}; }catch(e){ return {}; } };
const themed=(L,kind)=>{ L=L||{}; return {bg:!L.bg||L.bg==='auto'?THEME[kind]:L.bg,board:L.board||'#dcae66',felt:L.felt||'#2f6b4f'}; };
function drawBg(c,w,h,bg,t){ const k=w/800; t=t||0;
  if(bg==='tatami'){ c.fillStyle='#b4a062'; c.fillRect(0,0,w,h); const mw=220*k,mh=110*k;
    for(let r=0;r*mh<h;r++) for(let q=-1;q*mw<w+mw;q++){ const x=q*mw+(r%2)*mw/2,y=r*mh,g=c.createLinearGradient(x,y,x,y+mh); g.addColorStop(0,'#c7b376'); g.addColorStop(1,'#a99556'); c.fillStyle=g; c.fillRect(x,y,mw,mh);
      c.strokeStyle='rgba(90,75,30,.16)'; c.lineWidth=1; for(let xx=x+4*k;xx<x+mw;xx+=5*k){ c.beginPath(); c.moveTo(xx,y); c.lineTo(xx,y+mh); c.stroke(); }
      c.fillStyle='#2e3b2c'; c.fillRect(x,y,mw,5*k); }
    c.fillStyle='rgba(255,250,235,.85)'; c.fillRect(0,0,w,14*k); }
  else if(bg==='garden'){ const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#7fb069'); g.addColorStop(1,'#4f8a43'); c.fillStyle=g; c.fillRect(0,0,w,h);
    for(let i=0;i<60;i++){ c.fillStyle='rgba(30,70,25,.25)'; c.beginPath(); c.ellipse((i*137)%w,(i*89)%h,5*k,2*k,(i%5)*.6,0,7); c.fill(); }
    for(const [x,y,s] of [[.07,.2,1],[.12,.55,.8],[.06,.85,1.1],[.94,.3,.9],[.9,.75,1]]){ c.fillStyle='#9a958c'; c.beginPath(); c.ellipse(w*x,h*y,28*k*s,18*k*s,.3,0,7); c.fill(); c.fillStyle='rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(w*x-6*k,h*y-5*k,14*k*s,7*k*s,.3,0,7); c.fill(); }
    for(let i=0;i<5;i++){ const x=w*(.975+i*.005)-i*9*k; c.fillStyle='#6e9a3c'; c.fillRect(x,0,6*k,h); c.fillStyle='rgba(0,0,0,.25)'; for(let y=30*k+i*13*k;y<h;y+=70*k) c.fillRect(x,y,6*k,2*k); } }
  else if(bg==='play'){ const g=c.createLinearGradient(0,0,w,h); g.addColorStop(0,'#ffe7f1'); g.addColorStop(1,'#e2f0ff'); c.fillStyle=g; c.fillRect(0,0,w,h);
    const cols=['#ff7a9c','#ffc93c','#5cc8ff','#8be08b','#b78cff']; for(let i=0;i<46;i++){ c.fillStyle=cols[i%5]; c.globalAlpha=.35; c.beginPath(); c.arc((i*157+40)%w,(i*97+20)%h,(4+(i%4)*3)*k,0,7); c.fill(); } c.globalAlpha=1; }
  else if(bg==='park'){ c.fillStyle='#6f9a52'; c.fillRect(0,0,w,h); c.fillStyle='#b9a27a'; c.fillRect(0,h*.82,w,h*.18);
    for(let i=0;i<9;i++){ c.fillStyle='rgba(20,50,20,.28)'; c.beginPath(); c.arc((i*211)%w,(i%2?h*.05:h*.95),(90+(i%3)*30)*k,0,7); c.fill(); }
    for(let i=0;i<26;i++){ c.fillStyle='rgba(255,250,200,'+(.08+.06*Math.sin(t*.8+i))+')'; c.beginPath(); c.ellipse((i*173)%w,(i*67)%h,12*k,7*k,0,0,7); c.fill(); } }
  else if(bg==='temple'){ const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#2a0d10'); g.addColorStop(1,'#5a1a18'); c.fillStyle=g; c.fillRect(0,0,w,h);
    c.fillStyle='#7a1a14'; c.fillRect(0,0,22*k,h); c.fillRect(w-22*k,0,22*k,h); c.strokeStyle='rgba(0,0,0,.5)'; c.lineWidth=1; for(let y=0;y<h;y+=20*k){ c.beginPath(); c.moveTo(0,y); c.lineTo(w,y); c.stroke(); }
    for(let i=0;i<8;i++){ const x=w*(.06+i*.125),y=24*k+Math.sin(i+t)*2*k; c.strokeStyle='#3a1a0a'; c.beginPath(); c.moveTo(x,0); c.lineTo(x,y-14*k); c.stroke();
      const lg=c.createRadialGradient(x,y,2*k,x,y,40*k); lg.addColorStop(0,'rgba(255,170,80,.35)'); lg.addColorStop(1,'rgba(255,170,80,0)'); c.fillStyle=lg; c.fillRect(x-40*k,y-40*k,80*k,80*k);
      c.fillStyle='#e0322a'; c.beginPath(); c.ellipse(x,y,13*k,16*k,0,0,7); c.fill(); c.fillStyle='#f6c64a'; c.fillRect(x-7*k,y-17*k,14*k,3*k); c.fillRect(x-7*k,y+14*k,14*k,3*k); } }
  else if(bg==='tea'){ c.fillStyle='#5b3a22'; c.fillRect(0,0,w,h); for(let x=0;x<w;x+=40*k){ c.fillStyle=(x/40|0)%2?'#62402a':'#573620'; c.fillRect(x,0,40*k,h); }
    c.strokeStyle='#2e1a0c'; c.lineWidth=3*k; for(const x0 of [.03,.85]){ const x=w*x0,y=h*.08,ww=w*.12,hh=h*.3; c.fillStyle='rgba(255,236,190,.22)'; c.fillRect(x,y,ww,hh); c.strokeRect(x,y,ww,hh); for(let i=1;i<4;i++){ c.beginPath(); c.moveTo(x+ww*i/4,y); c.lineTo(x+ww*i/4,y+hh); c.stroke(); c.beginPath(); c.moveTo(x,y+hh*i/4); c.lineTo(x+ww,y+hh*i/4); c.stroke(); } } }
  else { c.fillStyle='#2b2b33'; c.fillRect(0,0,w,h); }
  const v=c.createRadialGradient(w/2,h/2,h*.35,w/2,h/2,w*.75); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.35)'); c.fillStyle=v; c.fillRect(0,0,w,h); }
// 圍棋、五子棋的格線棋盤
function gridBoard(c,x0,y0,S,N,col,stars){ wood(c,x0,y0,S,S,col,S/472); const cs=S/N,o=cs/2;
  c.strokeStyle='rgba(35,20,8,.85)'; c.lineWidth=Math.max(.6,S/472);
  for(let q=0;q<N;q++){ c.beginPath(); c.moveTo(x0+o,y0+o+q*cs); c.lineTo(x0+o+(N-1)*cs,y0+o+q*cs); c.stroke(); c.beginPath(); c.moveTo(x0+o+q*cs,y0+o); c.lineTo(x0+o+q*cs,y0+o+(N-1)*cs); c.stroke(); }
  c.lineWidth=Math.max(1.2,S/240); c.strokeRect(x0+o,y0+o,(N-1)*cs,(N-1)*cs);
  c.fillStyle='rgba(35,20,8,.9)'; for(const [a,b] of stars){ c.beginPath(); c.arc(x0+o+a*cs,y0+o+b*cs,Math.max(1.6,cs*.1),0,7); c.fill(); } }
const STARS=N=>{ const p=N===9?[2,6]:N===13?[3,9]:N===15?[3,11]:[3,9,15],m=(N-1)/2,out=[]; for(const a of p) for(const b of p) out.push([a,b]); if(N!==19) out.push([m,m]); else for(const a of p) for(const b of p) if(a===9||b===9) out.push([a,b]); return out; };
// 象棋棋盤（九路十線）
function xqBoard(c,ox,oy,cs,col){ const k=cs/45; wood(c,ox-cs*.75,oy-cs*.75,8*cs+cs*1.5,9*cs+cs*1.5,col,k);
  c.strokeStyle='rgba(35,20,8,.9)'; c.lineWidth=1.2*k; const ln=(a,b,cc,d)=>{ c.beginPath(); c.moveTo(ox+a*cs,oy+b*cs); c.lineTo(ox+cc*cs,oy+d*cs); c.stroke(); };
  for(let r=0;r<10;r++) ln(0,r,8,r); for(let q=0;q<9;q++){ if(q===0||q===8) ln(q,0,q,9); else { ln(q,0,q,4); ln(q,5,q,9); } }
  ln(3,0,5,2); ln(5,0,3,2); ln(3,7,5,9); ln(5,7,3,9); c.lineWidth=2.4*k; c.strokeRect(ox-4*k,oy-4*k,8*cs+8*k,9*cs+8*k);
  c.lineWidth=1*k; for(const [q,r] of [[1,2],[7,2],[1,7],[7,7],[0,3],[2,3],[4,3],[6,3],[8,3],[0,6],[2,6],[4,6],[6,6],[8,6]]){ const x=ox+q*cs,y=oy+r*cs,a=4*k,b=10*k;
    for(const [sx,sy] of DD){ if((q===0&&sx<0)||(q===8&&sx>0)) continue; c.beginPath(); c.moveTo(x+sx*a,y+sy*b); c.lineTo(x+sx*a,y+sy*a); c.lineTo(x+sx*b,y+sy*a); c.stroke(); } }
  c.fillStyle='rgba(60,30,10,.75)'; c.font='900 '+Math.round(cs*.62)+'px '+KAI; c.textAlign='center'; c.textBaseline='middle'; c.fillText('楚　河',ox+2*cs,oy+4.5*cs); c.fillText('漢　界',ox+6*cs,oy+4.5*cs); }

/* ---------- 圍棋引擎（電腦用隨機對局估計勝率、數地時判斷死活） ---------- */
function goEng(N){
  const NN=N*N,NB=[],DG=[];
  for(let i=0;i<NN;i++){ const x=i%N,y=(i/N)|0,a=[],d=[]; if(x>0) a.push(i-1); if(x<N-1) a.push(i+1); if(y>0) a.push(i-N); if(y<N-1) a.push(i+N);
    for(const [dx,dy] of DD){ const X=x+dx,Y=y+dy; if(X>=0&&Y>=0&&X<N&&Y<N) d.push(Y*N+X); } NB.push(a); DG.push(d); }
  const gcd=(a,b)=>b?gcd(b,a%b):a,STEPS=[1,5,7,11,13,17,19,23,29,31].filter(s=>gcd(s,NN)===1);
  const mark=new Int32Array(NN),stk=new Int32Array(NN),grp=new Int32Array(NN); let stamp=1;
  const E={N,NN,NB,ko:-1,gn:0,grp};
  // 算 i 這塊棋的氣（數到 cap 就停）；整塊數完時 grp 裡是這塊的棋子、E.gn 是子數
  E.libs=(b,i,cap)=>{ stamp++; const col=b[i]; let sp=0,lc=0,gn=0; stk[sp++]=i; mark[i]=stamp;
    while(sp){ const j=stk[--sp]; grp[gn++]=j; for(const k of NB[j]){ if(mark[k]===stamp) continue; mark[k]=stamp; if(b[k]===0){ if(++lc>=cap){ E.gn=gn; return lc; } } else if(b[k]===col) stk[sp++]=k; } }
    E.gn=gn; return lc; };
  // 下一手：成功回傳提掉的子數（並設好 E.ko），不合法回傳 -1
  E.play=(b,i,col,ko)=>{ if(b[i]||i===ko) return -1; b[i]=col; const o=3-col; let cap=0,at=-1;
    for(const k of NB[i]) if(b[k]===o&&E.libs(b,k,1)===0){ for(let q=0;q<E.gn;q++) b[grp[q]]=0; cap+=E.gn; at=k; }
    if(!cap&&E.libs(b,i,1)===0){ b[i]=0; return -1; }
    E.ko=-1; if(cap===1&&E.libs(b,i,2)===1&&E.gn===1) E.ko=at; return cap; };
  E.eye=(b,i,col)=>{ for(const k of NB[i]) if(b[k]!==col) return false; let bad=0; for(const k of DG[i]) if(b[k]===3-col) bad++; return DG[i].length<4?bad===0:bad<2; };
  E.playout=(b,col,ko)=>{ let pass=0,mv=0; const lim=NN*3;
    while(pass<2&&mv<lim){ const st=rand(NN),sp=STEPS[rand(STEPS.length)]; let done=false;
      for(let q=0;q<NN;q++){ const i=(st+q*sp)%NN; if(b[i]||i===ko||E.eye(b,i,col)) continue; if(E.play(b,i,col,ko)>=0){ ko=E.ko; done=true; break; } }
      if(done) pass=0; else { pass++; ko=-1; } col=3-col; mv++; } };
  const own1=(b,i)=>{ const v=b[i]; if(v===1) return 1; if(v===2) return -1; let bl=0,wh=0; for(const k of NB[i]){ if(b[k]===1) bl=1; else if(b[k]===2) wh=1; } return bl&&!wh?1:wh&&!bl?-1:0; };
  E.area=b=>{ let s=0; for(let i=0;i<NN;i++) s+=own1(b,i); return s; };
  E.ownership=(b0,col,n)=>{ const own=new Float32Array(NN); for(let r=0;r<n;r++){ const b=Int8Array.from(b0); E.playout(b,col,-1); for(let i=0;i<NN;i++) own[i]+=own1(b,i); } for(let i=0;i<NN;i++) own[i]/=n; return own; };
  // 候選點：吃子、救子、叫吃、避免自己送死、開局佔角邊、往雙方勢力交界下
  E.cands=(b,col,ko,mv,noise)=>{ const o=3-col,out=[],inf=new Float32Array(NN),early=mv<NN*.2;
    for(let i=0;i<NN;i++) if(b[i]){ const s=b[i]===col?1:-1,x=i%N,y=(i/N)|0; for(let dy=-3;dy<=3;dy++) for(let dx=-3;dx<=3;dx++){ const d=Math.abs(dx)+Math.abs(dy); if(d>3) continue; const X=x+dx,Y=y+dy; if(X<0||Y<0||X>=N||Y>=N) continue; inf[Y*N+X]+=s*[4,2,1,.5][d]; } }
    for(let i=0;i<NN;i++){ if(b[i]||i===ko||E.eye(b,i,col)) continue;
      const bb=Int8Array.from(b),cap=E.play(bb,i,col,ko); if(cap<0) continue;
      let s=cap?cap*10+4:0; const L=E.libs(bb,i,999),sz=E.gn;
      if(L===1) s-=cap?2:12+sz*3;
      for(const k of NB[i]) if(b[k]===col&&E.libs(b,k,2)===1) s+=L>=3?12+sz*2:L===2?4:0;
      for(const k of NB[i]) if(bb[k]===o){ const l2=E.libs(bb,k,3); if(l2===1) s+=5+E.gn*2; else if(l2===2) s+=1; }
      const x=i%N,y=(i/N)|0,line=Math.min(x,y,N-1-x,N-1-y);
      if(early){ if(line===0) s-=6; else if(line===1) s-=2.5; else if(line===2||line===3) s+=2; } else if(line===0) s-=2;
      const f=inf[i]; s+=f>7?-4:f<-7?-3:3-Math.abs(f)*.35;
      for(const k of NB[i]) if(b[k]){ s+=1; break; }
      s+=(Math.random()-.5)*noise; out.push({i,s}); }
    return out.sort((a,b)=>b.s-a.s); };
  return E; }

/* ---------- 跳棋棋盤：121 個洞的六角星 ---------- */
const CC=(()=>{ const cells=[],idx={};
  for(let x=-8;x<=8;x++) for(let y=-8;y<=8;y++){ const z=-x-y; if(z<-8||z>8) continue; if(!((x<=4&&y<=4&&z<=4)||(x>=-4&&y>=-4&&z>=-4))) continue; idx[x+','+y]=cells.length; cells.push([x,y,z]); }
  const DIR=[[1,-1],[1,0],[0,1],[-1,1],[-1,0],[0,-1]];
  const nb=cells.map(([x,y])=>DIR.map(([a,b])=>idx[(x+a)+','+(y+b)]??-1)),jp=cells.map(([x,y])=>DIR.map(([a,b])=>idx[(x+2*a)+','+(y+2*b)]??-1));
  const pos=cells.map(([x,,z])=>[Math.sqrt(3)*(x+z/2),1.5*z]);
  const tests=[q=>q[2]>=5,q=>q[2]<=-5,q=>q[0]>=5,q=>q[0]<=-5,q=>q[1]>=5,q=>q[1]<=-5];
  let corners=tests.map(f=>cells.map((q,i)=>f(q)?i:-1).filter(i=>i>=0));
  const ang=cs=>{ let sx=0,sy=0; for(const i of cs){ sx+=pos[i][0]; sy+=pos[i][1]; } return ((Math.atan2(sy,sx)-Math.PI/2)+Math.PI*4)%(Math.PI*2); };
  corners.sort((a,b)=>ang(a)-ang(b)); // 0 在正下方，順時針排
  const apex=corners.map(cs=>cs.find(i=>Math.max(...cells[i].map(Math.abs))===8));
  const zone=new Int8Array(cells.length).fill(-1); corners.forEach((cs,k)=>cs.forEach(i=>zone[i]=k));
  const dist=(i,j)=>Math.max(Math.abs(cells[i][0]-cells[j][0]),Math.abs(cells[i][1]-cells[j][1]),Math.abs(cells[i][2]-cells[j][2]));
  return {cells,nb,jp,pos,corners,apex,zone,dist,n:cells.length}; })();
const CC_HOMES={2:[0,3],3:[0,2,4],4:[0,1,3,4],5:[0,1,2,3,4],6:[0,1,2,3,4,5]};
const CC_COL=['#e2383a','#2f6fd0','#2e9e4f','#f2b51d','#8a4ac8','#f07a2a'];
function ccReach(cells,from){ const res=new Map(),b=cells.slice(); b[from]=-1;
  for(const n of CC.nb[from]) if(n>=0&&b[n]<0) res.set(n,[from,n]);
  const q=[[from,[from]]],seen=new Set([from]);
  while(q.length){ const [cur,path]=q.shift(); for(let d=0;d<6;d++){ const o=CC.nb[cur][d],j=CC.jp[cur][d]; if(o<0||j<0||b[o]<0||b[j]>=0||seen.has(j)) continue; seen.add(j); const p2=path.concat(j); if(!res.has(j)) res.set(j,p2); q.push([j,p2]); } }
  return res; }

/* ---------- 象棋引擎：走法、將軍判斷、α-β 搜尋 ---------- */
// 棋盤索引 r*9+c，r=0 在上（黑方），紅方在下
const XQ_INIT=(()=>{ const b=new Array(90).fill(0),back=[5,4,3,2,1,2,3,4,5]; for(let q=0;q<9;q++){ b[q]=back[q]+8; b[81+q]=back[q]; } b[19]=b[25]=14; b[64]=b[70]=6; for(let q=0;q<9;q+=2){ b[27+q]=15; b[54+q]=7; } return b; })();
const NM=[[-2,-1,-1,0],[-2,1,-1,0],[2,-1,1,0],[2,1,1,0],[-1,-2,0,-1],[1,-2,0,-1],[-1,2,0,1],[1,2,0,1]];
function xqGen(b,s,capOnly){ const mv=[];
  for(let i=0;i<90;i++){ const v=b[i]; if(!v||(v>>3)!==s) continue; const ty=v&7,r=(i/9)|0,C=i%9;
    const add=j=>{ const w=b[j]; if(w&&(w>>3)===s) return; if(capOnly&&!w) return; mv.push(i<<7|j); };
    const inPal=(R,Q)=>Q>=3&&Q<=5&&(s===0?R>=7&&R<=9:R>=0&&R<=2);
    if(ty===1){ for(const [dr,dc] of D4) if(inPal(r+dr,C+dc)) add((r+dr)*9+C+dc); }
    else if(ty===2){ for(const [dr,dc] of DD) if(inPal(r+dr,C+dc)) add((r+dr)*9+C+dc); }
    else if(ty===3){ for(const [dr,dc] of DD){ const R=r+2*dr,Q=C+2*dc; if(R<0||R>9||Q<0||Q>8||(s===0?R<5:R>4)||b[(r+dr)*9+C+dc]) continue; add(R*9+Q); } }
    else if(ty===4){ for(const [dr,dc,lr,lc] of NM){ const R=r+dr,Q=C+dc; if(R<0||R>9||Q<0||Q>8||b[(r+lr)*9+C+lc]) continue; add(R*9+Q); } }
    else if(ty===5){ for(const [dr,dc] of D4){ let R=r+dr,Q=C+dc; while(R>=0&&R<=9&&Q>=0&&Q<=8){ const j=R*9+Q; if(b[j]){ add(j); break; } if(!capOnly) mv.push(i<<7|j); R+=dr; Q+=dc; } } }
    else if(ty===6){ for(const [dr,dc] of D4){ let R=r+dr,Q=C+dc,scr=false; while(R>=0&&R<=9&&Q>=0&&Q<=8){ const j=R*9+Q; if(!scr){ if(b[j]) scr=true; else if(!capOnly) mv.push(i<<7|j); } else if(b[j]){ if((b[j]>>3)!==s) mv.push(i<<7|j); break; } R+=dr; Q+=dc; } } }
    else { const R=r+(s===0?-1:1); if(R>=0&&R<=9) add(R*9+C); if(s===0?r<=4:r>=5){ if(C>0) add(i-1); if(C<8) add(i+1); } } }
  return mv; }
function xqInCheck(b,s){ const KV=s?9:1; let k=-1; for(let i=0;i<90;i++) if(b[i]===KV){ k=i; break; } if(k<0) return true;
  const r=(k/9)|0,C=k%9,o=1-s,R5=o*8+5,K=o*8+1,C6=o*8+6,P=o*8+7,N4=o*8+4;
  for(const [dr,dc] of D4){ let R=r+dr,Q=C+dc,n=0; while(R>=0&&R<=9&&Q>=0&&Q<=8){ const v=b[R*9+Q]; if(v){ n++; if(n===1){ if(v===R5||(v===K&&dc===0)) return true; } else { if(v===C6) return true; break; } } R+=dr; Q+=dc; } }
  const pf=s===0?-1:1; if(r+pf>=0&&r+pf<=9&&b[(r+pf)*9+C]===P) return true; if(C>0&&b[k-1]===P) return true; if(C<8&&b[k+1]===P) return true;
  for(const [dr,dc] of [[-2,-1],[-2,1],[2,-1],[2,1],[-1,-2],[1,-2],[-1,2],[1,2]]){ const R=r+dr,Q=C+dc; if(R<0||R>9||Q<0||Q>8||b[R*9+Q]!==N4) continue;
    const lr=R-(Math.abs(dr)===2?Math.sign(dr):0),lc=Q-(Math.abs(dc)===2?Math.sign(dc):0); if(!b[lr*9+lc]) return true; }
  return false; }
function xqLegal(b,s){ const out=[]; for(const m of xqGen(b,s)){ const f=m>>7,to=m&127,cp=b[to]; b[to]=b[f]; b[f]=0; if(!xqInCheck(b,s)) out.push(m); b[f]=b[to]; b[to]=cp; } return out; }
const XV=[0,0,120,120,270,600,285,30];
function xqEval(b){ let s=0; for(let i=0;i<90;i++){ const v=b[i]; if(!v) continue; const ty=v&7,sd=v>>3,r=(i/9)|0,C=i%9,adv=sd?r:9-r; let x=XV[ty];
    if(ty===7){ if(adv>=5) x+=40+(adv>=7&&adv<=8?25:0)-Math.abs(C-4)*4; } else if(ty===4) x+=12-Math.abs(C-4)*3+adv*3; else if(ty===5||ty===6) x+=adv*2;
    s+=sd?-x:x; } return s; }
function xqSearch(b0,s,ms,maxD,noise){ const b=b0.slice(),t0=performance.now(),MATE=1e6; let nodes=0,stop=false;
  const ev=sd=>sd?-xqEval(b):xqEval(b);
  const order=list=>list.map(m=>{ const to=m&127,f=m>>7; return [m,b[to]?XV[b[to]&7]*10+1000-XV[b[f]&7]/10:0]; }).sort((x,y)=>y[1]-x[1]).map(x=>x[0]);
  function q(sd,a,be,d){ nodes++; const sp=ev(sd); if(sp>=be) return sp; if(sp>a) a=sp; if(d>5) return sp;
    for(const m of order(xqGen(b,sd,true))){ const f=m>>7,to=m&127,cp=b[to]; b[to]=b[f]; b[f]=0; if(xqInCheck(b,sd)){ b[f]=b[to]; b[to]=cp; continue; }
      const v=-q(1-sd,-be,-a,d+1); b[f]=b[to]; b[to]=cp; if(v>=be) return v; if(v>a) a=v; }
    return a; }
  function nm(sd,d,a,be,ply){ if((++nodes&1023)===0&&performance.now()-t0>ms) stop=true; if(stop) return 0;
    if(d<=0) return q(sd,a,be,0);
    let best=-MATE,any=false;
    for(const m of order(xqGen(b,sd))){ const f=m>>7,to=m&127,cp=b[to]; b[to]=b[f]; b[f]=0; if(xqInCheck(b,sd)){ b[f]=b[to]; b[to]=cp; continue; }
      any=true; const v=-nm(1-sd,d-1,-be,-a,ply+1); b[f]=b[to]; b[to]=cp; if(stop) return 0; if(v>best) best=v; if(v>a) a=v; if(a>=be) break; }
    return any?best:-MATE+ply; }
  const root=xqLegal(b,s); if(!root.length) return -1; let bestM=root[0],prev=null;
  for(let d=1;d<=maxD;d++){ let a=-MATE-1,bm=null; const list=order(root); if(prev!=null){ list.splice(list.indexOf(prev),1); list.unshift(prev); }
    for(const m of list){ const f=m>>7,to=m&127,cp=b[to]; b[to]=b[f]; b[f]=0; const v=-nm(1-s,d-1,-MATE-1,noise?MATE+1:-a,1); b[f]=b[to]; b[to]=cp; if(stop) break;
      const vv=v+(noise?(Math.random()-.5)*noise:0); if(vv>a){ a=vv; bm=m; } }
    if(stop&&d>1) break; if(bm!=null){ bestM=bm; prev=bm; } if(a>MATE-200||performance.now()-t0>ms*.45) break; }
  return bestM; }

/* ---------- 象棋麻將的牌 ---------- */
const MJN=['帥','仕','相','俥','傌','炮','兵','將','士','象','車','馬','包','卒'],MJT=[1,2,3,5,4,6,7];
const MJSEQ=[[0,1,2],[3,4,5],[7,8,9],[10,11,12]];
const tile=(c,x,y,r,k,o)=>piece(c,x,y,r,k>=7?1:0,MJT[k%7],o);
// 32 張：帥將各 1、兵卒各 5、其他各 2。胡牌＝一組（順子或三兵／三卒）＋一對（同字，或帥將配對）
const MJC=[1,2,2,2,2,2,5,1,2,2,2,2,2,5];
function mjSh(a,need,noJ){ let best=9;
  const rec=(i,s,pt,pr)=>{ while(i<14&&!a[i]) i++;
    if(i>=14){ const v=2*(need-s)-Math.min(pt,Math.max(0,need-s))-(pr?1:0); if(v<best) best=v; return; }
    if(a[i]>=3){ a[i]-=3; rec(i,s+1,pt,pr); a[i]+=3; }
    const q=MJSEQ.find(x=>x[0]===i); if(q&&a[q[1]]&&a[q[2]]){ a[i]--; a[q[1]]--; a[q[2]]--; rec(i,s+1,pt,pr); a[i]++; a[q[1]]++; a[q[2]]++; }
    if(a[i]>=2){ a[i]-=2; if(!pr) rec(i,s,pt,true); rec(i,s,pt+1,pr); a[i]+=2; }
    if(i===0&&a[7]&&!noJ){ a[0]--; a[7]--; if(!pr) rec(i,s,pt,true); rec(i,s,pt+1,pr); a[0]++; a[7]++; }
    const q2=MJSEQ.find(x=>x.includes(i)); if(q2) for(const j of q2) if(j>i&&a[j]){ a[i]--; a[j]--; rec(i,s,pt+1,pr); a[i]++; a[j]++; }
    a[i]--; rec(i,s,pt,pr); a[i]++; };
  rec(0,0,0,false); return best; }

function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,me=net?net.me:0,OP=opts.options||{};
  const si=clamp(opts.stage|0,0,5),kind=GID[si],TWO=kind!=='cc'&&kind!=='mj',local2=!net&&opts.mode==='2p';
  const humans=net?net.count:local2?2:1;
  const np=TWO?2:kind==='cc'?(net?clamp(net.count+(net.bots||0),2,6):clamp(+OP.ccn||3,2,6)):(net?clamp(net.count+(net.bots||0),2,4):clamp(+OP.mjn||4,2,4));
  const LV=Math.max(0,['easy','normal','hard'].indexOf(OP.lv||'normal')),SP=Math.max(0,['slow','normal','fast'].indexOf(OP.speed||'normal'));
  const AID=kind==='mj'?[2.6,1.6,.8][SP]:[2,1.1,.5][SP],first=opts.first===1?1:0,L=themed(opts.look,kind);
  const {ctx:c,canvas}=env.canvas2d(W,H);
  const left=new Set(),isAI=p=>p>=humans||left.has(p),sfx=n=>env.sfx(n);
  const names=[]; for(let i=0;i<np;i++) names.push(i<humans?(net?(net.names&&net.names[i])||'玩家'+(i+1):local2?(i?'2P':'1P'):(opts.name||'你')):(np-humans>1?'電腦 '+(i-humans+1):'電腦'));
  let G={kind,seq:0,log:'',over:null,snd:null},t=0,msg='',msgT=0,ended=false,btns=[],hover=null,hist=[],lastP=-2,lastSeq=-1,aiT=0,aiWait=1,sndSeq=0,anim=null,animSeq=-1,sel=-1,shown=0,curtain=-1;
  const say=(s,sec)=>{ msg=s; msgT=sec||2.2; },log=s=>{ G.log=s; };
  const setAnim=(path,v,extra)=>{ G.anim=Object.assign({id:(G.anim?G.anim.id:0)+1,path,v},extra||{}); };
  const view=()=>net?me:local2&&kind==='mj'?shown:0;

  /* ===== 圍棋 ===== */
  function goMod(){
    const N=+OP.gsize||9,NN=N*N,KOMI=7.5,E=goEng(N),B=472,X0=14,Y0=14,cs=B/N,o=cs/2,px=i=>X0+o+(i%N)*cs,py=i=>Y0+o+((i/N)|0)*cs;
    function count(){ const b=Int8Array.from(G.b),own=E.ownership(b,G.col[G.turn],N<=9?300:N<=13?150:80),dead=[];
      for(let i=0;i<NN;i++) if(b[i]&&(b[i]===1?own[i]<-.25:own[i]>.25)) dead.push(i);
      for(const i of dead) b[i]=0;
      const terr=new Array(NN).fill(0),seen=new Uint8Array(NN); let sb=0,sw=0;
      for(let i=0;i<NN;i++){ if(b[i]===1) sb++; else if(b[i]===2) sw++; }
      for(let i=0;i<NN;i++){ if(b[i]||seen[i]) continue; const reg=[i]; seen[i]=1; let bl=0,wh=0;
        for(let q=0;q<reg.length;q++) for(const k of E.NB[reg[q]]){ if(b[k]===1) bl=1; else if(b[k]===2) wh=1; else if(!seen[k]){ seen[k]=1; reg.push(k); } }
        if(bl!==wh){ for(const j of reg) terr[j]=bl?1:2; if(bl) sb+=reg.length; else sw+=reg.length; } }
      const swk=sw+KOMI; G.res={terr,dead,sb,sw:swk,until:6,win:sb>swk?G.col.indexOf(1):G.col.indexOf(2)}; G.turn=-1;
      log('數地：黑 '+sb+' 目，白 '+sw+' 目＋貼 '+KOMI+'＝'+swk+' 目'); G.snd='item'; }
    function mc(b,col,cs2,ms){ const st=cs2.slice(0,LV===2?10:6).map(x=>({i:x.i,w:0,n:0,pr:x.s})),t0=performance.now();
      let rounds=0; while(performance.now()-t0<ms&&rounds<5000){ rounds++; for(const s of st){ if(s.bad) continue; const bb=Int8Array.from(b); if(E.play(bb,s.i,col,G.ko)<0){ s.bad=1; continue; }
        E.playout(bb,3-col,E.ko); const d=E.area(bb)-KOMI; if(col===1?d>0:d<0) s.w++; s.n++; } }
      let best=null,bv=-1; for(const s of st){ if(s.bad||!s.n) continue; const v=s.w/s.n+s.pr*.002; if(v>bv){ bv=v; best=s; } }
      return best?{i:best.i,rate:best.w/best.n}:{i:cs2[0].i,rate:.5}; }
    const hit=(x,y)=>{ const q=Math.round((x-X0-o)/cs),r=Math.round((y-Y0-o)/cs); return q<0||r<0||q>=N||r>=N?-1:r*N+q; };
    return {
      setup(){ G.b=new Array(NN).fill(0); G.turn=first; G.col=[0,0]; G.col[first]=1; G.col[1-first]=2; G.cap=[0,0]; G.ko=-1; G.pass=0; G.mv=0; G.lastI=-1; G.res=null; log(names[first]+' 執黑先下'); },
      waiting:()=>G.res?-1:G.turn,
      act(p,a){ if(G.res) return '正在數地'; if(p!==G.turn) return '還沒輪到你';
        if(a.t==='pass'){ G.pass++; G.ko=-1; G.lastI=-1; G.mv++; G.snd='click'; log(names[p]+' 虛手（停一手）'+(G.pass>=2?'':'；對方也虛手就數地')); if(G.pass>=2) count(); else G.turn=1-p; return null; }
        const i=a.i|0; if(i<0||i>=NN) return '不能下這裡'; if(G.b[i]) return '這裡已經有棋子了'; if(i===G.ko) return '打劫：要先在別處下一手才能提回來';
        const b=Int8Array.from(G.b),r=E.play(b,i,G.col[p],G.ko); if(r<0) return '這裡沒有氣，不能下';
        G.b=Array.from(b); G.cap[p]+=r; G.ko=E.ko; G.pass=0; G.lastI=i; G.mv++; G.turn=1-p; G.snd=r?'pop':'place';
        log('第 '+G.mv+' 手'+(r?'：'+names[p]+' 提掉 '+r+' 子':'')); return null; },
      tick(dt){ if(G.res&&!G.over){ G.res.until-=dt; if(G.res.until<=0){ G.over={win:G.res.win,why:'黑 '+G.res.sb+' 目，白 '+G.res.sw+' 目（含貼 '+KOMI+' 目）'}; return true; } } return false; },
      ai(p){ const col=G.col[p],b=Int8Array.from(G.b),cs2=E.cands(b,col,G.ko,G.mv,[9,2.5,1][LV]);
        if(!cs2.length||G.mv>NN*1.6) return {t:'pass'};
        if(G.mv>NN*.35){ const own=E.ownership(b,col,N<=9?60:N<=13?36:24); let open=0; for(let i=0;i<NN;i++) if(!b[i]&&Math.abs(own[i])<.55) open++;
          if(cs2[0].s<9&&(open===0||(G.pass===1&&open<=(N<=9?1:3)))) return {t:'pass'}; }
        if(LV===2||(LV===1&&N===9)){ const r=mc(b,col,cs2,LV===2?(N===9?700:N===13?900:1100):300); if(r.rate<.03&&G.mv>NN*.45) return {t:'resign'}; return {t:'play',i:r.i}; }
        return {t:'play',i:cs2[0].i}; },
      fallback:()=>({t:'pass'}),
      draw(){ gridBoard(c,X0,Y0,B,N,L.board,STARS(N)); const R=G.res;
        for(let i=0;i<NN;i++) if(G.b[i]){ const dead=R&&R.dead.includes(i); stone(c,px(i),py(i),cs*.47,G.b[i],dead?.45:null); }
        if(R) for(let i=0;i<NN;i++){ const tt=R.terr[i]||(R.dead.includes(i)?3-G.b[i]:0); if(!tt) continue; c.fillStyle=tt===1?'rgba(15,15,15,.85)':'rgba(255,255,255,.92)'; c.strokeStyle='rgba(0,0,0,.4)'; c.lineWidth=1; const s=cs*.32; c.fillRect(px(i)-s/2,py(i)-s/2,s,s); c.strokeRect(px(i)-s/2,py(i)-s/2,s,s); }
        if(G.lastI>=0&&G.b[G.lastI]){ c.strokeStyle='#e8302a'; c.lineWidth=Math.max(1.5,cs*.07); c.beginPath(); c.arc(px(G.lastI),py(G.lastI),cs*.2,0,7); c.stroke(); }
        const a=actor(); if(hover&&a>=0){ const i=hit(hover[0],hover[1]); if(i>=0&&!G.b[i]) stone(c,px(i),py(i),cs*.47,G.col[a],.45); } },
      click(x,y){ const i=hit(x,y); if(i>=0) act({t:'play',i}); },
      sub:()=>N+' 路・黑先・白貼 '+KOMI+' 目・數地',
      rows:()=>[0,1].map(p=>({p,icon:(x,y,r)=>stone(c,x,y,r,G.col[p]),info:(G.col[p]===1?'黑棋':'白棋')+'・提 '+G.cap[p]+' 子'+(G.res?'・'+(G.col[p]===1?G.res.sb:G.res.sw)+' 目':'')})),
      btns:()=>[{label:'虛手',fn:()=>act({t:'pass'}),dis:actor()<0}],
      hint:()=>G.res?'數地中：小方塊是各自的地，半透明的是死子':G.pass===1&&!G.over?'對方虛手了；你也虛手就數地':''
    }; }

  /* ===== 五子棋 ===== */
  function gmMod(){
    const N=15,NN=N*N,DIRS=[[1,0],[0,1],[1,1],[1,-1]],B=472,X0=14,Y0=14,cs=B/N,o=cs/2,px=i=>X0+o+(i%N)*cs,py=i=>Y0+o+((i/N)|0)*cs;
    const at=(x,y)=>x<0||y<0||x>=N||y>=N?-1:y*N+x;
    function five(b,i,col){ const x=i%N,y=(i/N)|0; for(const [dx,dy] of DIRS){ let a=0,bb=0; while(b[at(x+(a+1)*dx,y+(a+1)*dy)]===col) a++; while(b[at(x-(bb+1)*dx,y-(bb+1)*dy)]===col) bb++; if(a+bb+1>=5) return [at(x-bb*dx,y-bb*dy),at(x+a*dx,y+a*dy)]; } return null; }
    const PAT=[['xxxxx',1e6],['_xxxx_',5e4],['xxxx_',6e3],['_xxxx',6e3],['xxx_x',6e3],['x_xxx',6e3],['xx_xx',6e3],['_xxx_',3e3],['_xx_x_',2500],['_x_xx_',2500],
      ['xxx__',300],['__xxx',300],['xx_x_',250],['_x_xx',250],['x_xx_',250],['_xx_x',250],['x__xx',200],['xx__x',200],['x_x_x',200],['__xx__',200],['_xx_',120],['_x_x_',80],['_x__x_',40],['x',2]];
    const lineS=s=>{ let v=0; for(const [p,w] of PAT){ let k=s.indexOf(p); while(k>=0){ v+=w; k=s.indexOf(p,k+1); } } return v; };
    function gain(b,i,col){ const x=i%N,y=(i/N)|0; let g=0; for(const [dx,dy] of DIRS){ let s1='',s0=''; for(let k=-5;k<=5;k++){ if(!k){ s1+='x'; s0+='_'; continue; } const j=at(x+k*dx,y+k*dy),ch=j<0?'o':b[j]===col?'x':b[j]===0?'_':'o'; s1+=ch; s0+=ch; } g+=lineS(s1)-lineS(s0); } return g; }
    function cands(b){ const out=[]; let any=false; for(let i=0;i<NN;i++){ if(b[i]){ any=true; continue; } const x=i%N,y=(i/N)|0; let near=false; for(let dy=-2;dy<=2&&!near;dy++) for(let dx=-2;dx<=2;dx++){ const j=at(x+dx,y+dy); if(j>=0&&b[j]){ near=true; break; } } if(near) out.push(i); } return any?out:[at(7,7)]; }
    const evalM=(b,col,dw)=>cands(b).map(i=>{ const a=gain(b,i,col),d=gain(b,i,3-col); return {i,a,d,s:a+d*dw}; }).sort((p,q)=>q.s-p.s);
    const hit=(x,y)=>{ const q=Math.round((x-X0-o)/cs),r=Math.round((y-Y0-o)/cs); return q<0||r<0||q>=N||r>=N?-1:r*N+q; };
    return {
      setup(){ G.b=new Array(NN).fill(0); G.turn=first; G.col=[0,0]; G.col[first]=1; G.col[1-first]=2; G.mv=0; G.lastI=-1; G.line=null; log(names[first]+' 執黑先下'); },
      waiting:()=>G.turn,
      act(p,a){ if(p!==G.turn) return '還沒輪到你'; const i=a.i|0; if(i<0||i>=NN) return '不能下這裡'; if(G.b[i]) return '這裡已經有棋子了';
        const col=G.col[p]; G.b[i]=col; G.lastI=i; G.mv++; G.snd='place';
        const ln=five(G.b,i,col); if(ln){ G.line=ln; G.over={win:p,why:names[p]+' 連成五子'}; } else if(G.mv>=NN) G.over={win:null,why:'棋盤下滿了'}; else { G.turn=1-p; log('第 '+G.mv+' 手'); } return null; },
      ai(p){ const col=G.col[p],b=G.b.slice(),ms=evalM(b,col,LV===0?.6:.92);
        if(ms[0].a>=9e5) return {t:'play',i:ms[0].i};
        if(LV===0){ ms.forEach(m=>m.s*=.55+Math.random()*.9); ms.sort((p2,q)=>q.s-p2.s); }
        else if(LV===2){ const top=ms.slice(0,8); for(const m of top){ b[m.i]=col; const r=evalM(b,3-col,.92)[0]; b[m.i]=0; m.s2=m.s-(r?r.s*.55:0); } top.sort((p2,q)=>q.s2-p2.s2); return {t:'play',i:top[0].i}; }
        else { ms.forEach(m=>m.s*=.95+Math.random()*.1); ms.sort((p2,q)=>q.s-p2.s); }
        return {t:'play',i:ms[0].i}; },
      fallback:()=>({t:'play',i:G.b.indexOf(0)}),
      draw(){ gridBoard(c,X0,Y0,B,N,L.board,STARS(15));
        for(let i=0;i<NN;i++) if(G.b[i]) stone(c,px(i),py(i),cs*.46,G.b[i]);
        if(G.lastI>=0){ c.fillStyle='#e8302a'; c.beginPath(); c.arc(px(G.lastI),py(G.lastI),cs*.1,0,7); c.fill(); }
        if(G.line){ c.strokeStyle='rgba(232,48,42,.85)'; c.lineWidth=5; c.lineCap='round'; c.beginPath(); c.moveTo(px(G.line[0]),py(G.line[0])); c.lineTo(px(G.line[1]),py(G.line[1])); c.stroke(); c.lineCap='butt'; }
        const a=actor(); if(hover&&a>=0){ const i=hit(hover[0],hover[1]); if(i>=0&&!G.b[i]) stone(c,px(i),py(i),cs*.46,G.col[a],.45); } },
      click(x,y){ const i=hit(x,y); if(i>=0) act({t:'play',i}); },
      sub:()=>'15 路・黑先・連成五子就贏',
      rows:()=>[0,1].map(p=>({p,icon:(x,y,r)=>stone(c,x,y,r,G.col[p]),info:G.col[p]===1?'黑棋（先下）':'白棋'})),
      btns:()=>[],hint:()=>''
    }; }

  /* ===== 跳棋 ===== */
  function ccMod(){
    const homes=CC_HOMES[np],U=18,CX=250,CY=252;
    const home=p=>homes[p],tgt=p=>(homes[p]+3)%6,inZ=(i,z)=>CC.zone[i]===z;
    const rot=()=>-home(view())*Math.PI/3;
    const P=i=>{ const a=rot(),[x,y]=CC.pos[i]; return [CX+(x*Math.cos(a)-y*Math.sin(a))*U,CY+(x*Math.sin(a)+y*Math.cos(a))*U]; };
    const dsum=p=>{ let s=0; const ap=CC.apex[tgt(p)]; for(let i=0;i<CC.n;i++) if(G.cells[i]===p) s+=CC.dist(i,ap); return s; };
    const inHome=p=>{ let n=0; for(let i=0;i<CC.n;i++) if(G.cells[i]===p&&inZ(i,tgt(p))) n++; return n; };
    const won=p=>CC.corners[tgt(p)].every(i=>G.cells[i]>=0)&&CC.corners[tgt(p)].some(i=>G.cells[i]===p);
    function allMoves(cells,p){ const out=[]; for(let i=0;i<CC.n;i++) if(cells[i]===p) for(const [to,path] of ccReach(cells,i)) out.push({f:i,to,path}); return out; }
    function rank(w){ const rest=[...Array(np).keys()].filter(q=>q!==w).sort((a,b)=>dsum(a)-dsum(b)); return w==null?rest:[w].concat(rest); }
    function score(cells,p,m){ const ap=CC.apex[tgt(p)],df=CC.dist(m.f,ap),dt=CC.dist(m.to,ap); let s=df-dt+df*.08;
      if(inZ(m.f,tgt(p))&&!inZ(m.to,tgt(p))) s-=5;
      if(inZ(m.f,home(p))&&G.mv>np*12) s+=1.5;
      if(CC.zone[m.to]>=0&&CC.zone[m.to]!==tgt(p)&&CC.zone[m.to]!==home(p)) s-=.5;
      return s; }
    const hit=(x,y)=>{ let best=-1,bd=U*U; for(let i=0;i<CC.n;i++){ const [a,b]=P(i),d=(a-x)**2+(b-y)**2; if(d<bd){ bd=d; best=i; } } return best; };
    return {
      setup(){ G.cells=new Array(CC.n).fill(-1); for(let p=0;p<np;p++) for(const i of CC.corners[home(p)]) G.cells[i]=p; G.turn=rand(np); G.mv=0; G.lastPath=null; log(names[G.turn]+' 先走'); },
      waiting:()=>G.turn,
      act(p,a){ if(p!==G.turn) return '還沒輪到你'; if(G.cells[a.f]!==p) return '要選自己的彈珠'; const path=ccReach(G.cells,a.f).get(a.to); if(!path) return '走不到那裡';
        G.cells[a.to]=p; G.cells[a.f]=-1; G.lastPath=path; setAnim(path,p); G.mv++; G.snd=path.length>2?'item':'place';
        if(won(p)){ G.over={rank:rank(p),why:names[p]+' 全部到家了！'}; return null; }
        if(G.mv>=np*160){ G.over={rank:rank(null),why:'步數到上限，照離終點的距離排名'}; return null; }
        G.turn=(p+1)%np; if(!allMoves(G.cells,G.turn).length) G.turn=(G.turn+1)%np; log(names[p]+(path.length>2?' 連跳 '+(path.length-1)+' 次':' 走一步')); return null; },
      ai(p){ const cells=G.cells.slice(),ms=allMoves(cells,p); if(!ms.length) return null; let best=null,bv=-1e9;
        for(const m of ms){ let s=score(cells,p,m);
          if(LV===2){ cells[m.to]=p; cells[m.f]=-1; let nx=0; for(const m2 of allMoves(cells,p)){ const v=score(cells,p,m2); if(v>nx) nx=v; } cells[m.f]=p; cells[m.to]=-1; s+=nx*.5; }
          s+=(Math.random()-.5)*[2.5,.4,.1][LV]; if(s>bv){ bv=s; best=m; } }
        return {t:'mv',f:best.f,to:best.to}; },
      fallback(p){ const m=allMoves(G.cells,p)[0]; return m?{t:'mv',f:m.f,to:m.to}:null; },
      draw(){ // 星形棋盤
        const pts=[]; for(let k=0;k<6;k++){ const [x,y]=P(CC.apex[k]); pts.push([x,y,1.5]); }
        for(const [x,y,z] of [[4,-4,0],[4,0,-4],[0,4,-4],[-4,4,0],[-4,0,4],[0,-4,4]]){ const i=CC.cells.findIndex(q=>q[0]===x&&q[1]===y&&q[2]===z),[a,b]=P(i); pts.push([a,b,1.1]); }
        pts.sort((p1,p2)=>Math.atan2(p1[1]-CY,p1[0]-CX)-Math.atan2(p2[1]-CY,p2[0]-CX));
        const poly=()=>{ c.beginPath(); pts.forEach(([x,y,z],j)=>{ const dx=x-CX,dy=y-CY,d=Math.hypot(dx,dy),f=(d+U*z)/d; j?c.lineTo(CX+dx*f,CY+dy*f):c.moveTo(CX+dx*f,CY+dy*f); }); c.closePath(); };
        c.save(); c.translate(5,8); poly(); c.fillStyle='rgba(0,0,0,.3)'; c.fill(); c.restore();
        const g=c.createRadialGradient(CX,CY,20,CX,CY,250); g.addColorStop(0,shade(L.board,1.1)); g.addColorStop(1,shade(L.board,.82)); poly(); c.fillStyle=g; c.fill(); c.strokeStyle='rgba(70,40,10,.55)'; c.lineWidth=3; c.stroke();
        const zcol=new Array(6).fill(null); for(let p=0;p<np;p++){ zcol[home(p)]=CC_COL[p]; if(!zcol[tgt(p)]) zcol[tgt(p)]=CC_COL[p]; }
        const S=sel>=0&&G.cells[sel]===actor()?ccReach(G.cells,sel):null;
        const A=anim&&G.anim&&G.anim.path?anim:null,dest=A?A.path[A.path.length-1]:-1;
        for(let i=0;i<CC.n;i++){ const [x,y]=P(i),z=CC.zone[i]; c.fillStyle=z>=0&&zcol[z]?shade(zcol[z],.75):'rgba(80,45,15,.55)'; c.globalAlpha=z>=0&&zcol[z]?.55:1; c.beginPath(); c.arc(x,y,U*.42,0,7); c.fill(); c.globalAlpha=1;
          c.fillStyle='rgba(40,20,5,.55)'; c.beginPath(); c.arc(x,y+1,U*.3,0,7); c.fill(); }
        if(G.lastPath){ c.strokeStyle='rgba(255,255,255,.75)'; c.setLineDash([4,4]); c.lineWidth=2; c.beginPath(); G.lastPath.forEach((i,j)=>{ const [x,y]=P(i); j?c.lineTo(x,y):c.moveTo(x,y); }); c.stroke(); c.setLineDash([]); }
        for(let i=0;i<CC.n;i++){ const p=G.cells[i]; if(p<0||i===dest) continue; const [x,y]=P(i); marble(c,x,y,U*.62,CC_COL[p]); if(i===sel){ c.strokeStyle='#ffd23f'; c.lineWidth=3; c.beginPath(); c.arc(x,y,U*.78,0,7); c.stroke(); } }
        if(A){ const segs=A.path.length-1,u=Math.min(segs,A.t/.17),k=Math.min(segs-1,Math.floor(u)),f=u-k,[x1,y1]=P(A.path[k]),[x2,y2]=P(A.path[k+1]),hop=Math.sin(f*Math.PI)*(segs>1||CC.dist(A.path[0],A.path[1])>1?10:3);
          marble(c,x1+(x2-x1)*f,y1+(y2-y1)*f-hop,U*.62,CC_COL[A.v]); }
        if(S) for(const [to] of S){ const [x,y]=P(to); c.fillStyle='rgba(255,210,63,.85)'; c.beginPath(); c.arc(x,y,U*.28,0,7); c.fill(); c.strokeStyle='#14122b'; c.lineWidth=1.5; c.stroke(); } },
      animDur:a=>(a.path.length-1)*.17,
      click(x,y){ const i=hit(x,y),a=actor(); if(i<0||a<0) return; if(G.cells[i]===a){ sel=i===sel?-1:i; sfx('click'); return; }
        if(sel>=0&&G.cells[i]<0){ if(ccReach(G.cells,sel).has(i)) act({t:'mv',f:sel,to:i}); else say('走不到那裡：只能走到旁邊，或跳過一顆棋子'); } },
      sub:()=>np+' 人・每人 10 顆・先全部到對面的角就贏',
      rows:()=>[...Array(np).keys()].map(p=>({p,icon:(x,y,r)=>marble(c,x,y,r,CC_COL[p]),info:'到家 '+inHome(p)+' / 10'})),
      btns:()=>[],hint:()=>{ const a=actor(); return a>=0?'目標：正對面的 '+['紅','藍','綠','黃','紫','橘'][a]+'色角落'+(sel<0?'（先點自己的彈珠）':''):''; }
    }; }

  /* ===== 象棋 ===== */
  function xqMod(){
    const CS=45,OX=70,OY=47.5,flip=()=>!local2&&G.side[view()]===1;
    const P=i=>{ let r=(i/9)|0,q=i%9; if(flip()){ r=9-r; q=8-q; } return [OX+q*CS,OY+r*CS]; };
    const hit=(x,y)=>{ let q=Math.round((x-OX)/CS),r=Math.round((y-OY)/CS); if(q<0||q>8||r<0||r>9) return -1; if(Math.hypot(x-OX-q*CS,y-OY-r*CS)>CS*.48) return -1; if(flip()){ r=9-r; q=8-q; } return r*9+q; };
    const key=(b,s)=>b.map(v=>String.fromCharCode(65+v)).join('')+s;
    return {
      setup(){ G.b=XQ_INIT.slice(); G.turn=first; G.side=[0,0]; G.side[first]=0; G.side[1-first]=1; G.mv=0; G.quiet=0; G.rep={}; G.lastM=-1; G.capt=[[],[]]; G.chk=false; log(names[first]+' 執紅先走'); },
      waiting:()=>G.turn,
      act(p,a){ if(p!==G.turn) return '還沒輪到你'; const s=G.side[p],f=a.f|0,to=a.to|0,m=f<<7|to;
        if(!xqLegal(G.b,s).includes(m)) return xqGen(G.b,s).includes(m)?'這樣走自己的帥會被吃（被將軍）':'這步不能這樣走';
        const cp=G.b[to]; setAnim([f,to],G.b[f]); G.b[to]=G.b[f]; G.b[f]=0; G.lastM=m; G.mv++;
        if(cp){ G.capt[p].push(cp); G.quiet=0; } else G.quiet++;
        const o=1-s,op=1-p,k=key(G.b,o); G.chk=xqInCheck(G.b,o); G.rep[k]=(G.rep[k]||0)+1; G.snd=G.chk?'beep':cp?'pop':'place';
        if(!xqLegal(G.b,o).length) G.over={win:p,why:G.chk?names[op]+' 被將死了':names[op]+' 無棋可走（困斃）'};
        else if(G.rep[k]>=3) G.over={win:null,why:'同一個局面重複三次，和棋'};
        else if(G.quiet>=120) G.over={win:null,why:'60 回合都沒有吃子，和棋'};
        else { G.turn=op; log(G.chk?names[p]+' 將軍！':cp?names[p]+' 吃掉「'+PN[cp>>3][cp&7]+'」':'第 '+G.mv+' 步'); }
        return null; },
      ai(p){ const m=xqSearch(G.b,G.side[p],[350,800,1600][LV],[2,3,8][LV],[180,12,0][LV]); return m<0?null:{t:'mv',f:m>>7,to:m&127}; },
      fallback(p){ const m=xqLegal(G.b,G.side[p])[0]; return m==null?null:{t:'mv',f:m>>7,to:m&127}; },
      draw(){ xqBoard(c,OX,OY,CS,L.board);
        if(G.lastM>=0){ for(const i of [G.lastM>>7,G.lastM&127]){ const [x,y]=P(i); c.strokeStyle='rgba(30,120,255,.85)'; c.lineWidth=2.5; const a=CS*.48,b=CS*.2;
          for(const [sx,sy] of DD){ c.beginPath(); c.moveTo(x+sx*a,y+sy*(a-b)); c.lineTo(x+sx*a,y+sy*a); c.lineTo(x+sx*(a-b),y+sy*a); c.stroke(); } } }
        const A=anim&&G.anim?anim:null,dest=A?A.path[1]:-1,a=actor(),mine=a>=0?G.side[a]:-1;
        for(let i=0;i<90;i++){ const v=G.b[i]; if(!v||i===dest) continue; const [x,y]=P(i);
          const chk=G.chk&&!G.over&&(v&7)===1&&(v>>3)===G.side[G.turn];
          if(chk){ const g=c.createRadialGradient(x,y,CS*.3,x,y,CS*.8); g.addColorStop(0,'rgba(255,40,30,.8)'); g.addColorStop(1,'rgba(255,40,30,0)'); c.fillStyle=g; c.fillRect(x-CS,y-CS,CS*2,CS*2); }
          piece(c,x,y,CS*.44,v>>3,v&7,{hl:i===sel?'#ffd23f':null}); }
        if(A){ const u=Math.min(1,A.t/.22),e=1-(1-u)*(1-u),[x1,y1]=P(A.path[0]),[x2,y2]=P(A.path[1]); piece(c,x1+(x2-x1)*e,y1+(y2-y1)*e-Math.sin(u*Math.PI)*6,CS*.44,A.v>>3,A.v&7); }
        if(sel>=0&&mine>=0) for(const m of xqLegal(G.b,mine)){ if(m>>7!==sel) continue; const [x,y]=P(m&127); if(G.b[m&127]){ c.strokeStyle='rgba(255,60,40,.95)'; c.lineWidth=3; c.beginPath(); c.arc(x,y,CS*.5,0,7); c.stroke(); } else { c.fillStyle='rgba(40,200,90,.85)'; c.beginPath(); c.arc(x,y,CS*.14,0,7); c.fill(); } } },
      animDur:()=>.22,
      click(x,y){ const i=hit(x,y),a=actor(); if(i<0||a<0) return; const s=G.side[a],v=G.b[i];
        if(v&&(v>>3)===s){ sel=i===sel?-1:i; sfx('click'); return; }
        if(sel>=0) act({t:'mv',f:sel,to:i}); },
      sub:()=>'紅先黑後・將死對方就贏',
      rows:()=>[0,1].map(p=>({p,icon:(x,y,r)=>piece(c,x,y,r,G.side[p],1),info:(G.side[p]?'黑方':'紅方')+'・吃 '+G.capt[p].length+' 子'})),
      btns:()=>[],hint:()=>G.chk&&!G.over?(actor()>=0?'你被將軍了！要先解將':'將軍！'):''
    }; }

  /* ===== 暗棋 ===== */
  function bqMod(){
    const RANK=[0,7,6,5,3,4,2,1],BV=[0,60,35,20,9,12,30,7],CS=58,OX=18,OY=134;
    const col=v=>(v>>3)&1,ty=v=>v&7,hid=v=>v&16;
    const P=i=>[OX+(i&7)*CS+CS/2,OY+(i>>3)*CS+CS/2];
    const hit=(x,y)=>{ const q=Math.floor((x-OX)/CS),r=Math.floor((y-OY)/CS); return q<0||q>7||r<0||r>3?-1:r*8+q; };
    function canCap(a,b){ const A=a&7,B=b&7; if(A===6) return false; if(A===7) return B===7||B===1; if(A===1) return B!==7; return RANK[A]>=RANK[B]; }
    function moves(b,s){ const out=[]; for(let i=0;i<32;i++){ const v=b[i]; if(!v) continue; if(hid(v)){ out.push({t:'flip',i}); continue; } if(col(v)!==s) continue; const r=i>>3,q=i&7;
        for(const [dr,dc] of D4){ const R=r+dr,Q=q+dc; if(R<0||R>3||Q<0||Q>7) continue; const j=R*8+Q,w=b[j]; if(!w||(!hid(w)&&col(w)!==s&&canCap(v,w))) out.push({t:'mv',f:i,to:j}); }
        if(ty(v)===6) for(const [dr,dc] of D4){ let R=r+dr,Q=q+dc,scr=false; while(R>=0&&R<=3&&Q>=0&&Q<=7){ const w=b[R*8+Q]; if(w){ if(!scr) scr=true; else { if(!hid(w)&&col(w)!==s) out.push({t:'mv',f:i,to:R*8+Q}); break; } } R+=dr; Q+=dc; } } }
      return out; }
    const mat=(b,s)=>{ let v=0; for(const x of b) if(x) v+=col(x)===s?BV[ty(x)]:-BV[ty(x)]; return v; };
    function bestCap(b,s){ let best=0; for(const m of moves(b,s)){ if(m.t!=='mv'||!b[m.to]) continue; const w=b[m.to],x=b[m.f]; b[m.to]=x; b[m.f]=0; let back=0; for(const m2 of moves(b,1-s)) if(m2.t==='mv'&&m2.to===m.to) back=BV[ty(x)]; b[m.f]=x; b[m.to]=w; const g=BV[ty(w)]-back*.9; if(g>best) best=g; } return best; }
    function chase(b,s){ let d=99; for(let i=0;i<32;i++){ const v=b[i]; if(!v||hid(v)||col(v)!==s) continue; for(let j=0;j<32;j++){ const w=b[j]; if(!w||hid(w)||col(w)===s) continue; if(ty(v)===6||canCap(v,w)) d=Math.min(d,Math.abs((i>>3)-(j>>3))+Math.abs((i&7)-(j&7))); } } return d===99?0:-d; }
    // 往後看幾步（只算走棋和吃子；還有蓋著的棋時允許「先翻別的」當作停一手）
    function evalB(b,s,hh){ let v=mat(b,s); if(!hh) v+=(chase(b,s)-chase(b,1-s))*.3; return v; }
    function search(b,s,d,a,be,hh){ if(d<=0) return evalB(b,s,hh);
      let mine=0,theirs=0; for(const x of b) if(x){ if(col(x)===s) mine++; else theirs++; } if(!mine) return -900-d; if(!theirs) return 900+d;
      const ms=moves(b,s).filter(m=>m.t==='mv').sort((x,y)=>(b[y.to]?BV[ty(b[y.to])]:0)-(b[x.to]?BV[ty(b[x.to])]:0)); let best=-1e9;
      if(hh){ best=-search(b,1-s,d-1,-be,-a,hh); if(best>a) a=best; if(a>=be) return a; }
      else if(!ms.length) return -900-d;
      for(const m of ms){ const w=b[m.to],x=b[m.f]; b[m.to]=x; b[m.f]=0; const v=-search(b,1-s,d-1,-be,-a,hh); b[m.f]=x; b[m.to]=w; if(v>best) best=v; if(v>a) a=v; if(a>=be) break; }
      return best; }
    function flipVal(b,i,s){ let mine=0,tot=0; for(const v of b) if(v&&hid(v)){ tot++; if(col(v)===s) mine++; } const pm=tot?mine/tot:.5; let v=1.5; const r=i>>3,q=i&7;
      for(const [dr,dc] of D4){ const R=r+dr,Q=q+dc; if(R<0||R>3||Q<0||Q>7) continue; const w=b[R*8+Q]; if(!w||hid(w)) continue;
        if(col(w)!==s) v-=pm*(RANK[ty(w)]>=4||ty(w)===6?9:4); else v-=(1-pm)*BV[ty(w)]*.22; }
      return v; }
    function why(a,s){ const v=G.b[a.f],w=G.b[a.to]; if(!v||hid(v)||col(v)!==s) return '要選自己翻開的棋子'; if(w&&hid(w)) return '蓋著的棋不能吃，要先翻開';
      if(w&&col(w)===s) return '不能吃自己的棋'; if(ty(v)===6) return '炮（包）只能走一格，吃子要隔一顆棋子'; if(Math.abs((a.f>>3)-(a.to>>3))+Math.abs((a.f&7)-(a.to&7))!==1) return '一次只能走一格（上下左右）';
      if(w) return ty(v)===1?'帥（將）不能吃兵（卒）':'小的不能吃大的'; return '這步不能走'; }
    return {
      setup(){ const pcs=[]; for(const s of [0,8]) for(const [k,n] of [[1,1],[2,2],[3,2],[4,2],[5,2],[6,2],[7,5]]) for(let i=0;i<n;i++) pcs.push(k+s+16);
        G.b=shuffle(pcs); G.turn=first; G.side=[-1,-1]; G.idle=0; G.mv=0; G.capt=[[],[]]; G.lastM=null; log(names[first]+' 先翻棋'); },
      waiting:()=>G.turn,
      act(p,a){ if(p!==G.turn) return '還沒輪到你'; const s=G.side[p];
        if(a.t==='flip'){ const i=a.i|0,v=G.b[i]; if(!v||!hid(v)) return '這顆已經翻開了'; G.b[i]=v&~16; G.idle=0; setAnim([i,i],G.b[i],{flip:1}); G.snd='click';
          if(s<0){ G.side[p]=col(v); G.side[1-p]=1-col(v); log(names[p]+' 翻到'+(col(v)?'黑':'紅')+'棋，執'+(col(v)?'黑':'紅')+'方'); } else log(names[p]+' 翻開「'+PN[col(v)][ty(v)]+'」'); G.lastM={flip:i}; }
        else { if(s<0) return '要先翻一顆棋'; const f=a.f|0,to=a.to|0; if(!moves(G.b,s).some(m=>m.t==='mv'&&m.f===f&&m.to===to)) return why({f,to},s);
          const w=G.b[to]; setAnim([f,to],G.b[f]); G.b[to]=G.b[f]; G.b[f]=0; G.lastM={f,to}; (G.lastMv=G.lastMv||[null,null])[p]=[f,to];
          if(w){ G.capt[p].push(w); G.idle=0; G.snd='pop'; log(names[p]+' 吃掉「'+PN[col(w)][ty(w)]+'」'); } else { G.idle++; G.snd='place'; log(names[p]+' 走一步'); } }
        G.mv++; const op=1-p,os=G.side[op];
        if(os>=0){ if(!G.b.some(v=>v&&col(v)===os)){ G.over={win:p,why:names[op]+' 的棋子全被吃光了'}; return null; }
          if(!moves(G.b,os).length){ G.over={win:p,why:names[op]+' 沒有棋可以走'}; return null; } }
        if(G.idle>=50){ G.over={win:null,why:'連續 50 步沒有翻棋或吃子，和棋'}; return null; }
        G.turn=op; return null; },
      ai(p){ const s=G.side[p],b=G.b.slice(); let ms=moves(b,s<0?0:s); if(s<0){ const fl=ms.filter(m=>m.t==='flip'); const m=fl[rand(fl.length)]; return {t:'flip',i:m.i}; }
        const hh=b.some(v=>v&&hid(v)),D=[1,3,4][LV],LM=G.lastMv&&G.lastMv[p]; let best=null,bv=-1e9;
        for(const m of ms){ let v;
          if(m.t==='mv'){ const w=b[m.to],x=b[m.f]; b[m.to]=x; b[m.f]=0; v=(D>1?-search(b,1-s,D-1,-1e9,1e9,hh):mat(b,s)-bestCap(b,1-s))-(w?0:.4)-(LM&&LM[0]===m.to&&LM[1]===m.f?1.5:0); b[m.f]=x; b[m.to]=w; }
          else v=(D>1?-search(b,1-s,D-1,-1e9,1e9,true):mat(b,s)-bestCap(b,1-s))+flipVal(b,m.i,s)+G.idle*.15; // 太久沒翻棋就越想翻
          v+=Math.random()*[6,1,.3][LV]; if(LV===0&&Math.random()<.3) v+=Math.random()*12;
          if(v>bv){ bv=v; best=m; } }
        return best.t==='flip'?{t:'flip',i:best.i}:{t:'mv',f:best.f,to:best.to}; },
      fallback(p){ const s=G.side[p],m=moves(G.b,s<0?0:s).find(x=>s>=0||x.t==='flip'); return !m?null:m.t==='flip'?{t:'flip',i:m.i}:{t:'mv',f:m.f,to:m.to}; },
      draw(){ wood(c,OX-14,OY-14,8*CS+28,4*CS+28,L.board,1);
        c.strokeStyle='rgba(40,20,5,.7)'; c.lineWidth=1.5; for(let r=0;r<=4;r++){ c.beginPath(); c.moveTo(OX,OY+r*CS); c.lineTo(OX+8*CS,OY+r*CS); c.stroke(); } for(let q=0;q<=8;q++){ c.beginPath(); c.moveTo(OX+q*CS,OY); c.lineTo(OX+q*CS,OY+4*CS); c.stroke(); }
        const LM=G.lastM; if(LM) for(const i of LM.flip!=null?[LM.flip]:[LM.f,LM.to]){ c.fillStyle='rgba(30,120,255,.22)'; c.fillRect(OX+(i&7)*CS+2,OY+(i>>3)*CS+2,CS-4,CS-4); }
        const A=anim&&G.anim?anim:null,dest=A?A.path[1]:-1,a=actor(),mine=a>=0?G.side[a]:-1;
        for(let i=0;i<32;i++){ const v=G.b[i]; if(!v||i===dest) continue; const [x,y]=P(i); if(hid(v)) piece(c,x,y,CS*.4,0,0,{back:true,hl:hover&&a>=0&&hit(hover[0],hover[1])===i?'rgba(255,210,63,.8)':null}); else piece(c,x,y,CS*.4,col(v),ty(v),{hl:i===sel?'#ffd23f':null}); }
        if(A){ const v=A.v; if(A.flip){ const u=Math.min(1,A.t/.3),[x,y]=P(A.path[0]); if(u<.5) piece(c,x,y,CS*.4,0,0,{back:true,sx:1-u*2}); else piece(c,x,y,CS*.4,col(v),ty(v),{sx:u*2-1}); }
          else { const u=Math.min(1,A.t/.22),[x1,y1]=P(A.path[0]),[x2,y2]=P(A.path[1]); piece(c,x1+(x2-x1)*u,y1+(y2-y1)*u-Math.sin(u*Math.PI)*6,CS*.4,col(v),ty(v)); } }
        if(sel>=0&&mine>=0) for(const m of moves(G.b,mine)){ if(m.t!=='mv'||m.f!==sel) continue; const [x,y]=P(m.to); if(G.b[m.to]){ c.strokeStyle='rgba(255,60,40,.95)'; c.lineWidth=3; c.beginPath(); c.arc(x,y,CS*.46,0,7); c.stroke(); } else { c.fillStyle='rgba(40,200,90,.85)'; c.beginPath(); c.arc(x,y,CS*.13,0,7); c.fill(); } }
        // 吃掉的棋子
        for(let p=0;p<2;p++){ const L2=G.capt[p],y=p===view()?OY+4*CS+44:OY-44; L2.forEach((v,j)=>piece(c,OX+12+j*24,y,10,col(v),ty(v))); } },
      animDur:a=>a.flip?.3:.22,
      click(x,y){ const i=hit(x,y),a=actor(); if(i<0||a<0) return; const s=G.side[a],v=G.b[i];
        if(v&&hid(v)){ if(sel>=0&&G.b[sel]&&ty(G.b[sel])===6&&moves(G.b,s).some(m=>m.t==='mv'&&m.f===sel&&m.to===i)){ act({t:'mv',f:sel,to:i}); return; } sel=-1; act({t:'flip',i}); return; }
        if(v&&col(v)===s){ sel=i===sel?-1:i; sfx('click'); return; }
        if(sel>=0) act({t:'mv',f:sel,to:i}); },
      sub:()=>'半盤 4×8・翻棋定色・吃光對方就贏',
      rows:()=>[0,1].map(p=>({p,icon:(x,y,r)=>G.side[p]<0?piece(c,x,y,r,0,0,{back:true}):piece(c,x,y,r,G.side[p],1),info:(G.side[p]<0?'還沒翻棋':G.side[p]?'黑方':'紅方')+'・吃 '+G.capt[p].length+' 子'})),
      btns:()=>[],hint:()=>actor()>=0?(G.side[actor()]<0?'點任一顆棋翻開，翻到的顏色就是你的':'翻棋，或走自己的棋子'):(G.idle>=40&&!G.over?'再 '+(50-G.idle)+' 步沒翻棋或吃子就和棋':'')
    }; }

  /* ===== 象棋麻將 ===== */
  function mjMod(){
    const HN=+OP.mjh||8,BASE=3;
    const cnt=h=>{ const a=new Array(14).fill(0); for(const k of h) a[k]++; return a; };
    const melds=p=>G.meld[p].length,need=p=>1-melds(p);
    const shOf=(p,a)=>{ a=a||cnt(G.hand[p]); let v=mjSh(a,need(p)); if(!melds(p)) v=Math.min(v,4-Math.max(a[6],a[13])); return v; }; // 五兵、五卒也能胡
    const canWin=(p,extra)=>{ const a=cnt(G.hand[p]); if(extra!=null) a[extra]++; return shOf(p,a)===-1; };
    function visible(p){ const v=new Array(14).fill(0); for(const k of G.hand[p]) v[k]++; for(let q=0;q<np;q++){ for(const k of G.river[q]) v[k]++; for(const m of G.meld[q]) for(const k of m.k) v[k]++; } return v.map((x,k)=>MJC[k]-x); } // 還沒看到的張數
    function waits(p){ const a=cnt(G.hand[p]),out=[]; for(let k=0;k<14;k++){ if(a[k]>=MJC[k]) continue; a[k]++; if(shOf(p,a)===-1) out.push(k); a[k]--; } return out; }
    function aiDiscard(p){ const a=cnt(G.hand[p]),vis=visible(p),ds=[];
      for(let k=0;k<14;k++){ if(!a[k]) continue; a[k]--; const s=shOf(p,a); let acc=0; for(let x=0;x<14;x++){ const u=vis[x]; if(u<=0) continue; a[x]++; if(shOf(p,a)<s) acc+=u; a[x]--; } a[k]++;
        ds.push({k,v:-s*100+acc*(LV?3:1)+(LV===2?(MJC[k]-vis[k])*.8:0)+Math.random()*[60,2,.5][LV]}); }
      ds.sort((x,y)=>y.v-x.v); return ds[0].k; }
    function aiClaim(q,o,k){ if(o.includes('hu')) return 'hu'; if(LV===0&&Math.random()<.5) return 'pass';
      const cur=shOf(q); let best='pass',bv=cur;
      for(const op of o){ const a=cnt(G.hand[q]); if(op==='pon') a[k]-=2; else for(const x of MJSEQ[+op.slice(3)]) if(x!==k) a[x]--;
        const n2=need(q)-1; let v=9; for(let x=0;x<14;x++) if(a[x]){ a[x]--; v=Math.min(v,mjSh(a,n2)); a[x]++; }
        if(v<bv){ bv=v; best=op; } }
      return best; }
    function claimOpts(q,k,from){ const a=cnt(G.hand[q]),o=[]; if(canWin(q,k)) o.push('hu');
      if(G.wall.length&&!melds(q)){ if(a[k]>=2) o.push('pon'); if(q===(from+1)%np) MJSEQ.forEach((s,j)=>{ if(s.includes(k)&&s.every(x=>x===k||a[x])) o.push('chi'+j); }); }
      return o; }
    const sortH=p=>G.hand[p].sort((a,b)=>a-b);
    function drawTile(p){ if(!G.wall.length){ G.show={draw:true,until:4}; G.phase='show'; G.turn=-1; log('牌摸完了，流局'); G.snd='lose'; return; }
      const k=G.wall.pop(); G.hand[p].push(k); sortH(p); G.drawn=k; G.turn=p; G.phase='discard'; }
    function deal(){ const w=[]; for(let k=0;k<14;k++) for(let i=0;i<MJC[k];i++) w.push(k); G.wall=shuffle(w); G.hand=[]; G.meld=[]; G.river=[];
      for(let p=0;p<np;p++){ G.hand[p]=G.wall.splice(-4); sortH(p); G.meld[p]=[]; G.river[p]=[]; }
      G.show=null; G.claim=null; G.lastD=null; G.nd=0; G.called=false; drawTile(G.dealer); log('第 '+(G.hno+1)+' 局，'+names[G.dealer]+' 當莊'); }
    function discard(p,k){ const h=G.hand[p],ix=h.indexOf(k); if(ix<0) return '手上沒有這張';
      h.splice(ix,1); G.river[p].push(k); G.drawn=-1; G.lastD={k,p}; G.snd='place'; G.nd++; log(names[p]+' 打出「'+MJN[k]+'」');
      const opts={},resp={}; let any=false;
      for(let d=1;d<np;d++){ const q=(p+d)%np,o=claimOpts(q,k,p); if(!o.length) continue; any=true; opts[q]=o; if(isAI(q)) resp[q]=aiClaim(q,o,k); }
      if(!any){ drawTile((p+1)%np); return null; }
      G.claim={k,from:p,opts,resp}; G.phase='claim'; G.turn=-1; resolve(); return null; }
    function resolve(){ const C=G.claim; for(const q in C.opts) if(!C.resp[q]) return;
      const order=[]; for(let d=1;d<np;d++) order.push((C.from+d)%np); const pick=f=>order.find(q=>C.resp[q]&&f(C.resp[q]));
      let q=pick(r=>r==='hu'); G.claim=null; if(q!=null) return win(q,C.from,C.k);
      q=pick(r=>r==='pon'); if(q==null) q=pick(r=>r.startsWith('chi'));
      if(q==null){ drawTile((C.from+1)%np); return; }
      const r=C.resp[q],k=C.k,h=G.hand[q],take=x=>h.splice(h.indexOf(x),1); G.river[C.from].pop(); G.lastD=null;
      G.called=true; if(r==='pon'){ take(k); take(k); G.meld[q].push({t:'pon',k:[k,k,k]}); log(names[q]+' 碰「'+MJN[k]+'」'); }
      else { const s=MJSEQ[+r.slice(3)]; for(const x of s) if(x!==k) take(x); G.meld[q].push({t:'chi',k:s.slice()}); log(names[q]+' 吃 '+s.map(x=>MJN[x]).join('')); }
      G.snd='item'; G.turn=q; G.phase='discard'; G.drawn=-1; }
    function win(p,from,k){ const self=from<0,a=cnt(G.hand[p]); if(!self) a[k]++;
      const all=G.hand[p].slice(); if(!self) all.push(k); for(const m of G.meld[p]) all.push(...m.k);
      const five=!melds(p)&&(a[6]===5||a[13]===5),tai=[];
      if(self&&p===G.dealer&&G.nd===0) tai.push(['天胡',6]); else if(self&&p!==G.dealer&&!G.river[p].length&&!G.called&&G.nd<np) tai.push(['地胡',6]); else tai.push(self?['自摸',2]:['胡牌',1]);
      if(five) tai.push([a[6]===5?'五兵合縱':'五卒連橫',5]);
      else if(mjSh(a.slice(),need(p),true)!==-1) tai.push(['將帥聽令',2]);
      if(all.every(x=>x<7)) tai.push(['紅一色',1]); else if(all.every(x=>x>=7)) tai.push(['黑一色',1]);
      if(self&&!G.wall.length) tai.push(['海底撈月',1]);
      const T=tai.reduce((s,x)=>s+x[1],0),pay=new Array(np).fill(0);
      for(const q of self?[...Array(np).keys()].filter(q=>q!==p):[from]){ const v=BASE+T+(p===G.dealer||q===G.dealer?1:0); pay[q]-=v; pay[p]+=v; }
      for(let q=0;q<np;q++) G.pts[q]+=pay[q];
      G.show={win:p,from,k,self,tai,pay,hand:G.hand[p].slice(),melds:G.meld[p].map(m=>m.k.slice()),until:7};
      G.phase='show'; G.turn=-1; G.snd='win'; log(names[p]+(self?' 自摸！':' 胡了！'+names[from]+' 放槍')); return null; }
    function nextHand(){ const S=G.show; if(!(S.draw||S.win===G.dealer)) G.dealer=(G.dealer+1)%np; G.hno++;
      if(G.hno>=HN){ G.over={rank:[...Array(np).keys()].sort((a,b)=>G.pts[b]-G.pts[a]),why:'打完 '+HN+' 局，比總分'}; return; } deal(); }
    // 畫面配置：自己在下面，其他人照順序排在右、上、左
    const SPOT={2:['b','t'],3:['b','r','l'],4:['b','r','t','l']}[np];
    const spot=p=>SPOT[(p-view()+np)%np];
    const HR=22,HG=48;
    function myLayout(){ const V=view(),h=G.hand[V].slice(),dr=G.turn===V&&G.phase==='discard'&&G.drawn>=0?G.drawn:-1; if(dr>=0) h.splice(h.indexOf(dr),1);
      const mw=G.meld[V].reduce((s,m)=>s+m.k.length*35+10,0),n=h.length+(dr>=0?1:0),w=n*HG+(dr>=0?14:0),x0=Math.max(30+mw+HR,420-w/2+HR);
      const out=h.map((k,j)=>({k,x:x0+j*HG,y:452})); if(dr>=0) out.push({k:dr,x:x0+h.length*HG+14,y:452,drawn:true}); return out; }
    function riverPos(p,j){ const s=spot(p),row=Math.floor(j/8),col=j%8;
      if(s==='b') return [296+col*26,300+row*26]; if(s==='t') return [504-col*26,162-row*26];
      if(s==='r') return [612+row*26,322-col*26]; return [188-row*26,138+col*26]; }
    function plate(p,x,y,al){ const V=view(),txt=names[p]+(p===G.dealer?'（莊）':'')+'　'+(G.pts[p]>0?'+':'')+G.pts[p]; c.font='700 13px '+TC; const w=c.measureText(txt).width+20,on=G.turn===p&&!G.over,X=al==='l'?x:al==='r'?x-w:x-w/2;
      c.fillStyle=on?'rgba(255,210,63,.95)':'rgba(11,10,28,.75)'; rr(c,X,y-12,w,24,12); c.fill(); c.fillStyle=on?'#14122b':'#fff'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(txt,X+w/2,y+1);
      if(on&&p!==actor()&&G.phase==='discard'&&p!==V){ c.font='900 11px '+TC; c.fillStyle='#ffd23f'; c.fillText('思考中'+'.'.repeat(1+Math.floor(t*2.5)%3),X+w/2,y+22); } }
    return {
      setup(){ G.pts=new Array(np).fill(0); G.hno=0; G.dealer=rand(np); deal(); },
      waiting(){ if(G.phase==='discard') return G.turn; if(G.phase==='claim'){ for(let d=1;d<np;d++){ const q=(G.claim.from+d)%np; if(G.claim.opts[q]&&!G.claim.resp[q]) return q; } } return -1; },
      aiMul:()=>G.phase==='claim'?.4:1,
      act(p,a){
        if(G.phase==='claim'){ const C=G.claim; if(!C||!C.opts[p]||C.resp[p]) return '現在不用你決定'; const r=a.c; if(r!=='pass'&&!C.opts[p].includes(r)) return '不能這樣叫'; C.resp[p]=r; resolve(); return null; }
        if(G.phase!=='discard'||G.turn!==p) return '還沒輪到你';
        if(a.t==='dis') return discard(p,a.k|0);
        if(a.t==='tsumo') return canWin(p)?win(p,-1,G.drawn):'還不能胡';
        return '不能這樣做'; },
      tick(dt){ if(G.phase==='show'&&!G.over){ G.show.until-=dt; if(G.show.until<=0){ nextHand(); return true; } } return false; },
      ai(p){ if(G.phase==='claim') return {t:'claim',c:aiClaim(p,G.claim.opts[p],G.claim.k)};
        if(canWin(p)) return {t:'tsumo'};
        return {t:'dis',k:aiDiscard(p)}; },
      fallback:p=>G.phase==='claim'?{t:'claim',c:'pass'}:{t:'dis',k:G.hand[p][G.hand[p].length-1]},
      draw(){ const V=view(),a=actor();
        c.fillStyle='rgba(0,0,0,.3)'; rr(c,150,80,500,316,30); c.fill(); const g=c.createRadialGradient(400,232,40,400,232,330); g.addColorStop(0,shade(L.felt,1.15)); g.addColorStop(1,shade(L.felt,.7)); c.fillStyle=g; rr(c,146,72,508,316,30); c.fill(); c.strokeStyle='#7a4a22'; c.lineWidth=8; c.stroke();
        c.fillStyle='rgba(0,0,0,.35)'; rr(c,316,200,168,64,14); c.fill(); c.fillStyle='#ffd23f'; c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('第 '+Math.min(G.hno+1,HN)+' / '+HN+' 局',400,220); c.fillStyle='#e8f5ea'; c.font='700 12px '+TC; c.fillText('牌牆剩 '+G.wall.length+' 張　莊：'+names[G.dealer],400,244);
        for(let p=0;p<np;p++){ const s=spot(p); G.river[p].forEach((k,j)=>{ const [x,y]=riverPos(p,j); tile(c,x,y,12,k,{hl:G.lastD&&G.lastD.p===p&&j===G.river[p].length-1?'#ffd23f':null}); });
          if(s==='b') continue; const n=G.hand[p].length,M=G.meld[p];
          if(s==='t'){ const w=n*27,x0=400-w/2+13; for(let j=0;j<n;j++) piece(c,x0+j*27,38,13,0,0,{back:true}); let mx=x0+n*27+10; for(const m of M){ for(const k of m.k){ tile(c,mx,38,13,k); mx+=27; } mx+=8; } plate(p,x0-24,38,'r'); }
          else { const x=s==='r'?712:88,y0=130; for(let j=0;j<n;j++) piece(c,x,y0+j*27,13,0,0,{back:true}); let my=y0+n*27+10; for(const m of M){ for(const k of m.k){ tile(c,x,my,13,k); my+=27; } my+=8; } plate(p,x,y0-30,'c'); } }
        // 自己
        let mx=26; for(const m of G.meld[V]){ for(const k of m.k){ tile(c,mx,458,16,k); mx+=35; } mx+=10; }
        const lay=myLayout(),hv=hover&&a===V&&G.phase==='discard'?lay.find(o=>Math.hypot(hover[0]-o.x,hover[1]-o.y)<HR):null;
        for(const o of lay) tile(c,o.x,o.y-(o===hv?10:0),HR,o.k,{hl:o.drawn?'rgba(255,210,63,.8)':null});
        plate(V,26,418,'l');
        if(G.phase!=='show'&&G.hand[V].length%3===1){ const w=waits(V); if(w.length){ c.fillStyle='rgba(11,10,28,.75)'; const tx='聽：'+w.map(k=>MJN[k]).join('、'); c.font='900 13px '+TC; const tw=c.measureText(tx).width+20; rr(c,640-tw/2,404,tw,24,12); c.fill(); c.fillStyle='#86dc4f'; c.textAlign='center'; c.fillText(tx,640,417); } }
        // 按鈕
        if(a===V&&a>=0){ const B=[];
          if(G.phase==='claim'){ const o=G.claim.opts[a],k=G.claim.k; for(const op of o) B.push([op==='hu'?'胡！':op==='pon'?'碰':'吃 '+MJSEQ[+op.slice(3)].map(x=>MJN[x]).join(''),()=>act({t:'claim',c:op}),op==='hu']); B.push(['過',()=>act({t:'claim',c:'pass'})]);
            c.fillStyle='#fff'; c.font='900 14px '+TC; c.textAlign='right'; c.fillText(names[G.claim.from]+' 打出「'+MJN[k]+'」，要叫嗎？',780,346); }
          else if(canWin(a)) B.push(['自摸！',()=>act({t:'tsumo'}),true]);
          let bx=790; for(let j=B.length-1;j>=0;j--){ c.font='900 15px '+TC; const w=Math.max(64,c.measureText(B[j][0]).width+26); bx-=w; btn(B[j][0],bx,358,w,B[j][1],false,B[j][2]); bx-=8; } }
        // 結算
        const S=G.show; if(S){ c.fillStyle='rgba(11,10,28,.86)'; rr(c,190,120,420,220,18); c.fill(); c.textAlign='center'; c.textBaseline='middle';
          if(S.draw){ c.fillStyle='#ffd23f'; c.font='900 30px '+TC; c.fillText('流局',400,210); c.fillStyle='#fff'; c.font='700 14px '+TC; c.fillText('牌摸完了，沒有人胡；莊家連莊',400,252); }
          else { c.fillStyle='#ffd23f'; c.font='900 24px '+TC; c.fillText(names[S.win]+(S.self?' 自摸！':' 胡了！'),400,146); c.fillStyle='#cfe8d8'; c.font='700 12px '+TC; c.fillText(S.self?'其他人都要付':names[S.from]+' 放槍',400,170);
            const all=S.hand.slice(); if(!S.self) all.push(S.k); let x=400-(all.length*30+S.melds.reduce((s,m)=>s+m.length*30+8,0))/2+15; for(const m of S.melds){ for(const k of m){ tile(c,x,206,14,k); x+=30; } x+=8; } for(const k of all){ tile(c,x,206,14,k); x+=30; }
            c.fillStyle='#fff'; c.font='700 14px '+TC; c.fillText(S.tai.map(x=>x[0]+(x[1]?' '+x[1]+' 台':'')).join('　'),400,246);
            c.font='700 13px '+TC; c.fillText([...Array(np).keys()].filter(q=>S.pay[q]).map(q=>names[q]+' '+(S.pay[q]>0?'+':'')+S.pay[q]).join('　'),400,276);
            c.fillStyle='#bfb8dc'; c.font='700 11px '+TC; c.fillText('底 '+BASE+' 分＋每台 1 分，莊家多 1 台',400,306); } } },
      click(x,y){ const a=actor(),V=view(); if(a!==V||G.phase!=='discard') return; for(const o of myLayout()) if(Math.hypot(x-o.x,y-o.y)<HR+2){ act({t:'dis',k:o.k}); return; } },
      sub:()=>'',rows:()=>[],btns:()=>[],hint:()=>''
    }; }

  const M={go:goMod,gm:gmMod,cc:ccMod,xq:xqMod,bq:bqMod,mj:mjMod}[kind]();

  /* ===== 共用流程 ===== */
  function actor(){ if(G.over) return -1; const p=M.waiting(); if(p<0) return -1; if(net) return p===me?p:-1; return isAI(p)?-1:p; }
  function doAct(p,a){ if(G.over) return '這盤已經結束了'; G.snd=null;
    if(a.t==='resign'){ if(!TWO) return '這個遊戲不能認輸'; G.over={win:1-p,why:names[p]+' 認輸'}; G.seq++; return null; }
    const e=M.act(p,a); if(!e) G.seq++; return e; }
  function broadcast(){ if(net&&net.host) net.send({st:G}); }
  function act(a){ const p=a.t==='resign'?(net?me:local2?Math.max(0,M.waiting()):0):actor();
    if(p<0){ say('還沒輪到你'); sfx('bump'); return; }
    if(client){ net.send({act:a}); return; }
    const snap=!net&&kind!=='mj'&&a.t!=='resign'?JSON.stringify(G):null,err=doAct(p,a);
    if(err){ say(err); sfx('bump'); } else { if(snap) hist.push(snap); sel=-1; broadcast(); } }
  function undo(){ if(!hist.length||G.over) return; G=JSON.parse(hist.pop()); lastP=-2; aiT=0; sel=-1; sndSeq=G.seq; animSeq=G.anim?G.anim.id:-1; anim=null; say('悔棋',1); }
  if(net){
    if(client) net.onmsg=m=>{ if(m.st) G=m.st; if(m.bad&&m.bad[0]===me){ say(m.bad[1]); sfx('bump'); } };
    else { net.onmsg=(m,from)=>{ if(!m.act) return; const err=doAct(from,m.act); if(err) net.send({bad:[from,err]}); broadcast(); };
      net.onleave=i=>{ left.add(i); names[i]+='（離開）'; broadcast(); }; }
  }
  if(!client){ M.setup(); broadcast(); }

  function update(dt){
    t+=dt; if(msgT>0) msgT-=dt;
    if(G.seq!==sndSeq){ sndSeq=G.seq; if(G.snd) sfx(G.snd); }
    if(G.anim&&G.anim.id!==animSeq){ animSeq=G.anim.id; anim={path:G.anim.path,v:G.anim.v,flip:G.anim.flip,t:0}; }
    if(anim){ anim.t+=dt; if(anim.t>(M.animDur?M.animDur(anim):.25)) anim=null; }
    if(local2&&kind==='mj'){ const a=actor(); if(a>=0&&a!==shown&&curtain<0) curtain=a; }
    if(client){ if(G.over&&!ended){ ended=true; setTimeout(finish,2000); } return; }
    if(ended) return;
    if(G.over){ ended=true; setTimeout(finish,2000); return; }
    if(M.tick&&M.tick(dt)){ G.snd=null; G.seq++; broadcast(); return; }
    const p=M.waiting(); if(p<0||!isAI(p)){ lastP=-2; return; }
    if(p!==lastP||G.seq!==lastSeq){ lastP=p; lastSeq=G.seq; aiT=0; aiWait=AID*(.7+Math.random()*.6)*(M.aiMul?M.aiMul(p):1); }
    aiT+=dt; if(aiT<aiWait||anim) return;
    lastP=-2; let a=null; try{ a=M.ai(p); }catch(e){ console.error(e); }
    let err=a?doAct(p,a):'沒有動作'; if(err&&M.fallback){ const f=M.fallback(p); err=f?doAct(p,f):err; } if(err) console.warn('電腦',err,a);
    broadcast(); }
  const WK='arcade.qi.w.'+kind;
  function finish(){ const o=G.over; let title,html='',won=false;
    const tbl=(h,rows)=>'<table class="ls"><tr>'+h.map(x=>'<th>'+x+'</th>').join('')+'</tr>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')+'</table>';
    if(o.rank){ const w=o.rank[0]; title=!local2&&w===me?'你贏了！':names[w]+' 獲勝！'; won=!local2&&w===me;
      html=kind==='mj'?tbl(['名次','玩家','總分'],o.rank.map((p,i)=>[i+1,names[p],(G.pts[p]>0?'+':'')+G.pts[p]])):tbl(['名次','玩家','到家'],o.rank.map((p,i)=>{ let n=0; for(let j=0;j<CC.n;j++) if(G.cells[j]===p&&CC.zone[j]===(CC_HOMES[np][p]+3)%6) n++; return [i+1,names[p],n+' / 10']; })); }
    else if(o.win==null) title='和棋';
    else { won=!local2&&o.win===me; title=won?'你贏了！':local2?names[o.win]+' 獲勝！':net?names[o.win]+' 獲勝':'電腦獲勝'; }
    if(won&&!net){ try{ localStorage.setItem(WK,String((+localStorage.getItem(WK)||0)+1)); }catch(e){} }
    env.sfx(won||local2&&o.win!=null?'win':'lose'); env.end({title,big:GAMES[si],html,text:o.why||'',score:null,next:false}); }

  /* ===== 操作 ===== */
  function toLogical(e){ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=(r.width-W*s)/2,oy=(r.height-H*s)/2; return [(e.clientX-r.left-ox)/s,(e.clientY-r.top-oy)/s]; }
  function onDown(e){ e.preventDefault(); const [x,y]=toLogical(e); hover=[x,y];
    if(curtain>=0){ shown=curtain; curtain=-1; sfx('click'); return; }
    for(const b of btns) if(!b.dis&&x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h){ sfx('click'); b.fn(); return; }
    if(!G.over&&!anim) M.click(x,y); }
  const onMove=e=>{ if(e.pointerType==='mouse') hover=toLogical(e); },onOut=()=>{ hover=null; };
  canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointermove',onMove); canvas.addEventListener('pointerleave',onOut); canvas.style.touchAction='none';

  /* ===== 畫面 ===== */
  function btn(label,x,y,w,fn,dis,main,h){ btns.push({label,x,y,w,h:h||36,fn,dis,main}); }
  function drawBtns(){ for(const b of btns){ c.fillStyle=b.dis?'rgba(20,18,40,.6)':b.main?'#ffd23f':'#2b2759'; rr(c,b.x,b.y,b.w,b.h,10); c.fill(); c.strokeStyle='#0b0a1c'; c.lineWidth=2; c.stroke();
    c.fillStyle=b.dis?'#6b6799':b.main?'#14122b':'#fff'; c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(b.label,b.x+b.w/2,b.y+b.h/2+1); } }
  const fit=(s,w)=>{ if(c.measureText(s).width<=w) return s; while(s.length>1&&c.measureText(s+'…').width>w) s=s.slice(0,-1); return s+'…'; };
  function wrap(s,w){ const out=[]; let line=''; for(const ch of s){ if(c.measureText(line+ch).width>w){ out.push(line); line=ch; } else line+=ch; } if(line) out.push(line); return out; }
  function drawPanel(){ const X=506,PW=284; c.fillStyle='rgba(12,10,24,.76)'; rr(c,X,10,PW,480,16); c.fill();
    c.textAlign='left'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 22px '+TC; c.fillText(GAMES[si],X+16,34);
    c.fillStyle='#cfc8e8'; c.font='700 12px '+TC; c.fillText(M.sub(),X+16,58);
    const rows=M.rows(),ph=rows.length>3?42:56,wt=G.over?-1:M.waiting(),A=actor(); let y=72;
    for(const r of rows){ const on=wt===r.p,cy=y+(ph-6)/2; c.fillStyle=on?'rgba(255,210,63,.16)':'rgba(255,255,255,.06)'; rr(c,X+10,y,PW-20,ph-6,10); c.fill(); if(on){ c.strokeStyle='#ffd23f'; c.lineWidth=2; c.stroke(); }
      r.icon(X+30,cy,ph>50?14:11);
      c.textAlign='left'; c.fillStyle='#fff'; c.font='900 14px '+TC; c.fillText(fit(names[r.p]+(net&&r.p===me?'（你）':''),120),X+50,ph>50?cy-9:cy);
      c.fillStyle='#bfb8dc'; c.font='700 12px '+TC; if(ph>50) c.fillText(fit(r.info||'',206),X+50,cy+11); else { c.textAlign='right'; c.fillText(r.info||'',X+PW-22,cy); }
      if(on&&A!==r.p){ c.textAlign='right'; c.fillStyle='#ffd23f'; c.font='900 12px '+TC; c.fillText('思考中'+'.'.repeat(1+Math.floor(t*2.5)%3),X+PW-22,ph>50?cy-9:cy-13); }
      y+=ph; }
    y+=6; c.font='700 13px '+TC; c.fillStyle='#e8e4ff'; c.textAlign='left'; for(const ln of wrap(G.log||'',PW-32).slice(0,3)){ c.fillText(ln,X+16,y+8); y+=20; }
    y+=6; if(A>=0){ c.fillStyle='#86dc4f'; c.font='900 20px '+TC; c.fillText(local2?'輪到 '+names[A]+' 了':'輪到你了',X+16,y+12); y+=34; }
    const h=M.hint(); if(h){ c.fillStyle=G.chk?'#ff8a8a':'#ffe8a8'; c.font='700 13px '+TC; for(const ln of wrap(h,PW-32).slice(0,3)){ c.fillText(ln,X+16,y+8); y+=20; } }
    const B=M.btns().slice(); if(!net&&hist.length&&!G.over) B.push({label:'悔棋',fn:undo});
    if(TWO&&!G.over) B.push({label:'認輸',fn:()=>{ if(window.confirm('確定要認輸嗎？')) act({t:'resign'}); }});
    if(B.length){ const bw=(PW-20-(B.length-1)*8)/B.length; B.forEach((b,j)=>btn(b.label,X+10+j*(bw+8),444,bw,b.fn,b.dis,j===0&&b.label==='虛手'&&!b.dis)); } }
  function draw(){
    btns=[]; drawBg(c,W,H,L.bg,t);
    if(kind==='mj'){ M.draw(); c.textAlign='left'; c.textBaseline='middle';
      if(G.log){ c.font='700 12px '+TC; const tx=fit(G.log,300),w=c.measureText(tx).width+20; c.fillStyle='rgba(11,10,28,.72)'; rr(c,10,10,w,22,11); c.fill(); c.fillStyle='#fff'; c.textAlign='left'; c.fillText(tx,20,21); } }
    else { M.draw(); drawPanel(); }
    drawBtns();
    if(msgT>0&&msg){ c.font='900 16px '+TC; c.textAlign='center'; c.textBaseline='middle'; const w=c.measureText(msg).width+30,cx=kind==='mj'?400:250; c.fillStyle='rgba(180,30,50,.92)'; rr(c,cx-w/2,H/2-22,w,40,14); c.fill(); c.fillStyle='#fff'; c.fillText(msg,cx,H/2-1); }
    if(curtain>=0){ c.fillStyle='rgba(11,10,28,.94)'; c.fillRect(0,0,W,H); c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 30px '+TC; c.fillText('換 '+names[curtain]+' 了',W/2,H/2-24); c.fillStyle='#fff'; c.font='700 16px '+TC; c.fillText('其他人先別看畫面，'+names[curtain]+' 按一下就會顯示手牌',W/2,H/2+20); }
  }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('pointermove',onMove); canvas.removeEventListener('pointerleave',onOut); },
    _dbg:{get G(){ return G; },doAct,M,names,act,actor}};
}

/* ---------- 開始畫面示意圖、縮圖、造型預覽 ---------- */
function stageShow(ctx,w,h,si,t){
  const L=themed(window.__qiLook||savedLook(),GID[si]),k=w/480; drawBg(ctx,w,h,L.bg,t);
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.085)+'px '+TC; ctx.lineWidth=5; ctx.strokeStyle='rgba(11,10,28,.8)'; ctx.strokeText(GAMES[si],w/2,h*.1); ctx.fillStyle='#ffd23f'; ctx.fillText(GAMES[si],w/2,h*.1);
  const u=(t%6)/6;
  if(si===0||si===1){ const N=si?9:7,S=h*.74,x0=w/2-S/2,y0=h*.2,cs=S/N; gridBoard(ctx,x0,y0,S,N,L.board,si?[[2,2],[6,2],[4,4],[2,6],[6,6]]:[[3,3]]);
    const seq=si?[[2,6,1],[3,5,2],[3,6,1],[4,4,2],[4,6,1],[5,6,2],[1,6,1],[1,5,2],[5,5,1]]:[[3,3,1],[3,2,2],[2,3,1],[4,3,2],[3,4,1],[2,2,2],[4,4,1],[4,2,2]];
    const n=Math.floor(u*(seq.length+3)); for(let j=0;j<Math.min(n,seq.length);j++){ const [x,y,cl]=seq[j]; stone(ctx,x0+cs/2+x*cs,y0+cs/2+y*cs,cs*.46,cl); }
    if(si&&n>seq.length){ ctx.strokeStyle='rgba(232,48,42,.85)'; ctx.lineWidth=4*k; ctx.beginPath(); ctx.moveTo(x0+cs/2+1*cs,y0+cs/2+6*cs); ctx.lineTo(x0+cs/2+5*cs,y0+cs/2+6*cs); ctx.stroke(); } }
  else if(si===2){ const U=h*.032,cx=w/2,cy=h*.58; ctx.fillStyle=shade(L.board,1); for(let i=0;i<CC.n;i++){ const [x,y]=CC.pos[i]; ctx.fillStyle='rgba(70,40,10,.35)'; ctx.beginPath(); ctx.arc(cx+x*U,cy+y*U,U*.4,0,7); ctx.fill(); }
    [0,2,4].forEach((z,p)=>CC.corners[z].forEach(i=>{ const [x,y]=CC.pos[i]; marble(ctx,cx+x*U,cy+y*U,U*.62,CC_COL[p]); }));
    const a=Math.min(1,(u*3)%1*1.6),[x1,y1]=CC.pos[CC.corners[0][0]]; marble(ctx,cx+x1*U,cy+(y1-a*6)*U-Math.sin(a*Math.PI)*12*k,U*.62,CC_COL[0]); }
  else if(si===3){ const cs=h*.075,ox=w/2-4*cs,oy=h*.2+cs*.55; xqBoard(ctx,ox,oy,cs,L.board); const P=(q,r)=>[ox+q*cs,oy+r*cs];
    for(let q=0;q<9;q++){ const v=XQ_INIT[q],v2=XQ_INIT[81+q]; piece(ctx,...P(q,0),cs*.44,1,v&7); piece(ctx,...P(q,9),cs*.44,0,v2&7); }
    for(const [q,r,s,ty] of [[1,2,1,6],[7,2,1,6],[1,7,0,6],[0,3,1,7],[2,3,1,7],[4,3,1,7],[6,3,1,7],[8,3,1,7],[0,6,0,7],[2,6,0,7],[6,6,0,7],[8,6,0,7]]) piece(ctx,...P(q,r),cs*.44,s,ty);
    const e=Math.min(1,u*2.5),[x1,y1]=P(7,7),[x2,y2]=P(4,7); piece(ctx,x1+(x2-x1)*e,y1+(y2-y1)*e,cs*.44,0,6,{hl:'#ffd23f'}); const [x3,y3]=P(4,6); piece(ctx,x3-(e<1?0:0),y3-e*0,cs*.44,0,7); }
  else if(si===4){ const cs=h*.15,ox=w/2-4*cs,oy=h*.28; wood(ctx,ox-8*k,oy-8*k,8*cs+16*k,4*cs+16*k,L.board,k); ctx.strokeStyle='rgba(40,20,5,.7)'; ctx.lineWidth=1;
    for(let r=0;r<=4;r++){ ctx.beginPath(); ctx.moveTo(ox,oy+r*cs); ctx.lineTo(ox+8*cs,oy+r*cs); ctx.stroke(); } for(let q=0;q<=8;q++){ ctx.beginPath(); ctx.moveTo(ox+q*cs,oy); ctx.lineTo(ox+q*cs,oy+4*cs); ctx.stroke(); }
    const up={3:[0,5],9:[1,1],12:[1,6],18:[0,2],22:[1,7],27:[0,1]},fl=Math.floor(u*6)%6,keys=Object.keys(up);
    for(let i=0;i<32;i++){ const x=ox+(i&7)*cs+cs/2,y=oy+(i>>3)*cs+cs/2,v=up[i],j=keys.indexOf(String(i)); if(v&&j<=fl) piece(ctx,x,y,cs*.4,v[0],v[1]); else piece(ctx,x,y,cs*.4,0,0,{back:true}); } }
  else { const r=h*.09,hand=[0,1,2,6,6]; const n=Math.floor(u*10); ctx.fillStyle='rgba(0,0,0,.25)'; rr(ctx,w*.06,h*.24,w*.88,h*.66,18*k); ctx.fill();
    hand.forEach((kk,j)=>tile(ctx,w/2+(j-2)*r*2.3,h*.72-(j===4&&n>5?Math.sin(t*6)*3*k:0),r,kk,{hl:n>=8?'#86dc4f':null}));
    [7,7,12,10].forEach((kk,j)=>tile(ctx,w*.3+j*r*1.6,h*.4,r*.7,kk)); ctx.fillStyle='#86dc4f'; ctx.font='900 '+Math.round(h*.06)+'px '+TC; if(n>=8) ctx.fillText('帥仕相＋兵兵　胡！',w/2,h*.88); }
}
function thumb(ctx,w,h,t){ drawBg(ctx,w,h,'tea',t); const k=w/480;
  const S=h*.5,x0=w*.06,y0=h*.3; gridBoard(ctx,x0,y0,S,7,'#dcae66',[[3,3]]); const cs=S/7; [[2,3,1],[3,3,2],[3,2,1],[4,4,2],[2,4,1]].forEach(([x,y,cl])=>stone(ctx,x0+cs/2+x*cs,y0+cs/2+y*cs,cs*.46,cl));
  piece(ctx,w*.66,h*.55,34*k,0,1); piece(ctx,w*.82,h*.5+Math.sin(t*2)*4*k,30*k,1,5); piece(ctx,w*.74,h*.78,26*k,0,0,{back:true});
  [0,1,2,3].forEach(i=>marble(ctx,w*.55+i*18*k,h*.86,8*k,CC_COL[i]));
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.13)+'px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#0b0a1c'; ctx.strokeText('棋類派對',w/2,h*.15); ctx.fillStyle='#ffd23f'; ctx.fillText('棋類派對',w/2,h*.15);
  ctx.font='700 '+Math.round(h*.055)+'px '+TC; ctx.fillStyle='#ffe8c8'; ctx.fillText('圍棋・五子棋・跳棋・象棋・暗棋・象棋麻將',w/2,h*.95); }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).qi={
  name:'棋類派對',tag:'BOARD PARTY',color:'#c8913a',online:true,maxPlayers:si=>si===2?6:si===5?4:2,bots:true,minPlayers:2,
  desc:'一盒棋玩六種：圍棋、五子棋、跳棋、象棋、暗棋、象棋麻將。和電腦下、兩個人同一台輪流下，或開房間連線對戰。',
  goal:'選一種棋開始玩。',
  stages:GAMES,stageLabel:'選擇遊戲',
  stageGoal:si=>[
    '圍棋：黑白輪流把棋子下在交叉點上，黑先。把對方一塊棋四周的「氣」都堵住就能提掉。不能下在沒有氣的地方（除非能提子）；打劫時要先在別處下一手才能提回來。雙方都「虛手」後數地：自己的棋子加上圍住的空點，白棋另外貼 7.5 目，多的人贏。棋盤可以選 9、13、19 路。',
    '五子棋：黑白輪流下在 15 路棋盤的交叉點上，黑先。橫、直、斜任何一個方向先連成五顆（或更多）的人贏。',
    '跳棋：每人 10 顆彈珠，從自己的角出發，先把全部彈珠移到正對面的角就贏。每次可以走到旁邊的空洞，或跳過旁邊一顆棋子（自己的、別人的都可以）落到後面的空洞，還能一直連跳。對面的角被別人的彈珠卡住時，只要那個角全部填滿、裡面有你的彈珠就算到家。2～6 人，有人到家就結束，其他人照離終點的遠近排名。',
    '象棋：紅先黑後，把對方的帥（將）將死就贏。帥仕不出九宮、相象不過河、馬走日會被絆馬腳、象走田會被塞象眼、車直走、炮要隔一顆棋子才能吃、兵過河後可以橫走；兩個帥不能在同一直線上直接見面。對方無棋可走也算贏；同一局面重複三次或 60 回合沒吃子算和棋。',
    '暗棋：32 顆棋子全部蓋著放在半張棋盤（4×8）上，第一個翻棋的人翻到什麼顏色就執那一色。每回合可以翻一顆棋，或把自己的棋子往上下左右走一格、吃掉旁邊的對手棋子。大小：帥將＞仕士＞相象＞俥車＞傌馬＞炮包＞兵卒，大的吃小的、一樣大可以互吃；但兵卒可以吃帥將，帥將不能吃兵卒。炮包要隔一顆棋子（不論遠近，蓋著的也算）才能吃，而且什麼都能吃。把對方吃光或讓對方無棋可走就贏；連續 50 步沒有翻棋或吃子算和棋。',
    '象棋麻將（32 張）：一副象棋當麻將牌，帥、將各 1 張，兵、卒各 5 張，其他各 2 張。莊家 5 張先打，其他人 4 張，輪流摸一張打一張，湊成「一組＋一對」就胡。一組是同色的帥仕相、俥傌炮、將士象、車馬包（順子），或三兵、三卒（刻子）；一對是兩張一樣，帥和將也能配成一對；五兵、五卒也算胡。上家打的牌可以「吃」成順子，兩張一樣時可以「碰」。台數：放槍胡 1 台、自摸 2 台、天胡地胡 6 台、將帥聽令（帥將當對子）2 台、五兵合縱／五卒連橫 5 台、紅一色／黑一色 1 台、海底撈月 1 台，莊家多 1 台；底 3 分、每台 1 分。放槍的人付，自摸其他人都付，打完設定的局數比總分。'][si],
  modes:[{id:'1p',label:'對電腦'},{id:'2p',label:'兩人同一台'}],
  coin:o=>{ const s=o.stage||0; if(s===2||s===5) return null; return {verb:['執黑先下','執黑先下','','執紅先走','先翻棋'][s],names:o.net?[o.net.names[0]||'玩家 1',o.net.count>1?(o.net.names[1]||'玩家 2'):'電腦']:o.mode==='2p'?['1P','2P']:['你','電腦']}; },
  options:[{key:'lv',label:'電腦強度',def:'normal',opts:[{id:'easy',label:'簡單'},{id:'normal',label:'中等'},{id:'hard',label:'困難'}]},
    {key:'speed',label:'電腦速度',def:'normal',opts:[{id:'slow',label:'慢'},{id:'normal',label:'正常'},{id:'fast',label:'快'}]},
    {key:'gsize',label:'棋盤大小',def:'9',only:[0],opts:[{id:'9',label:'9 路'},{id:'13',label:'13 路'},{id:'19',label:'19 路'}]},
    {key:'ccn',label:'單機人數',def:'3',only:[2],opts:[2,3,4,6].map(n=>({id:String(n),label:n+' 人'}))},
    {key:'mjn',label:'單機人數',def:'4',only:[5],opts:[2,3,4].map(n=>({id:String(n),label:n+' 人'}))},
    {key:'mjh',label:'局數',def:'8',only:[5],opts:[{id:'4',label:'4 局'},{id:'8',label:'8 局'},{id:'12',label:'12 局'}]}],
  stageHelp:si=>{ const U=['悔棋','單機時退回上一手（對電腦會連電腦那手一起退）'],R=['認輸','直接結束這盤'];
    const H=[
      [['點交叉點','下子（電腦上移過去會先看到半透明的棋子）'],['虛手','這一手不下；雙方連續虛手就數地'],U,R],
      [['點交叉點','下子'],U,R],
      [['點自己的彈珠','選取，能去的洞會亮起黃點'],['點黃點','走過去（連跳會自動照路線跳）'],U],
      [['點自己的棋子','選取，能走的位置亮綠點、能吃的亮紅圈'],['點綠點／紅圈','走棋或吃子'],U,R],
      [['點蓋著的棋','翻開'],['點自己的棋子','選取，再點旁邊的格子走過去或吃子'],U,R],
      [['點手牌','打出那一張（剛摸的那張在最右邊）'],['自摸／胡','湊成一組＋一對時出現'],['吃／碰','別人打牌時能叫就會跳出按鈕，不要就按「過」'],['聽','手牌上面會提示你在等哪幾張']]][si];
    return {help:H,touchHelp:H}; },
  help:[['點棋盤','下子、選棋子、走棋'],['按鈕','虛手、悔棋、認輸、吃碰胡']],
  touch:null,
  looks:[{key:'board',label:'棋盤顏色',type:'color',opts:['#dcae66','#e8c48a','#c98f4e','#a8763e','#d9d0b8','#9fb8a0']},
    {key:'felt',label:'麻將桌布',type:'color',opts:['#2f6b4f','#1f4f7a','#6b1f3a','#3a2d57','#5a4630','#2b2b33']},
    {key:'bg',label:'背景',opts:[{id:'auto',label:'跟著棋戲'},{id:'tatami',label:'和室'},{id:'garden',label:'庭園'},{id:'play',label:'遊戲室'},{id:'park',label:'公園'},{id:'temple',label:'廟口'},{id:'tea',label:'茶館'}]}],
  hubBest:()=>{ let n=0; for(const g of GID){ try{ n+=+localStorage.getItem('arcade.qi.w.'+g)||0; }catch(e){} } return n?'贏過電腦 <b>'+n+' 盤</b>':'尚無紀錄'; },
  stageBest:i=>{ let n=0; try{ n=+localStorage.getItem('arcade.qi.w.'+GID[i])||0; }catch(e){} return n?'贏過電腦 '+n+' 盤':''; },
  stageShow,thumb,create,
  preview:(ctx,w,h,L,t)=>{ window.__qiLook=L; const T=themed(L,'xq'); drawBg(ctx,w,h,T.bg,t); const k=w/480,cs=h*.07,ox=w*.08,oy=h*.18;
    xqBoard(ctx,ox+cs,oy+cs*.4,cs,T.board); piece(ctx,ox+cs*5,oy+cs*9.4,cs*.44,0,1); piece(ctx,ox+cs*5,oy+cs*.4,cs*.44,1,1); piece(ctx,ox+cs*2,oy+cs*7.4,cs*.44,0,6);
    ctx.fillStyle='rgba(0,0,0,.3)'; rr(ctx,w*.66,h*.3,w*.3,h*.45,14*k); ctx.fill(); ctx.fillStyle=T.felt; rr(ctx,w*.66,h*.28,w*.3,h*.45,14*k); ctx.fill();
    [0,1,2,7,8,9].forEach((kk,j)=>tile(ctx,w*.7+(j%3)*30*k+12*k,h*.4+Math.floor(j/3)*40*k,13*k,kk)); }
};
})();
