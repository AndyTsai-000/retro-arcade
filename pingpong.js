// 桌球對決：從球員背後、稍高的轉播視角看球桌。照國際桌球總會（ITTF）規則：
//  發球：球拋起來再打，先在自己這半邊彈一次、過網後在對方那半邊彈一次（單打不限方向）；擦網但落點正確＝重發。
//  來回：球在自己這邊彈一次之後要打回去，直接落到對方那半邊；沒打到桌面、掛網、在自己這邊彈兩次都輸這一分。
//  一局 11 分，10 平之後要多贏 2 分；每 2 分換發球，10 平之後每 1 分換。可選打一局、三戰兩勝、五戰三勝。
// 座標：x＝球桌長邊（左邊選手在 x<400）、w＝左右（左邊選手面向 +x 時右手邊是 +w）、h＝離地高度。
(function(){
'use strict';
const W=800,H=450,NETX=400,TX0=250,TX1=550,TW=86,TH=76,NETH=15,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,LV=200;
const G=760,REACH=50,SWD=.34;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,r1=v=>Math.round(v*10)/10,lerp=(a,b,u)=>a+(b-a)*u;
const LS=(k,v)=>{ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } };
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function shade(hex,k){ const n=parseInt(hex.slice(1),16),f=v=>clamp(Math.round(k>1?v+(255-v)*(k-1):v*k),0,255); return 'rgb('+f(n>>16&255)+','+f(n>>8&255)+','+f(n&255)+')'; }

/* ---------- 場館、對手 ---------- */
const VENUES=[
  {n:'社區活動中心',wall:'#d8c8a8',floor:'#8a5a3a',bar:'#2a5ab8',tbl:'#1f5aa8',lamp:'#fff6d8'},
  {n:'學校體育館',wall:'#e0d4bc',floor:'#b8844a',bar:'#2a7a4a',tbl:'#1d6a4a',lamp:'#fffbe8'},
  {n:'桌球教室',wall:'#e8e4dc',floor:'#5a6a7a',bar:'#c83a3a',tbl:'#1f4aa0',lamp:'#ffffff'},
  {n:'公司休閒室',wall:'#c8d0d8',floor:'#6a5a4a',bar:'#3a3a48',tbl:'#22408a',lamp:'#fff4d8'},
  {n:'老街球館',wall:'#b8a888',floor:'#7a4a2a',bar:'#8a2a2a',tbl:'#1a5a3a',lamp:'#ffe8b0'},
  {n:'市民運動中心',wall:'#3a4a6a',floor:'#2a4a8a',bar:'#1a2a5a',tbl:'#1f5ab0',lamp:'#ffffff',dark:1},
  {n:'全國錦標賽',wall:'#1a2440',floor:'#b83a3a',bar:'#1a3a8a',tbl:'#1a4aa8',lamp:'#ffffff',dark:1},
  {n:'亞洲盃',wall:'#141a30',floor:'#2a5aa8',bar:'#c8a040',tbl:'#1a4a9a',lamp:'#ffffff',dark:1},
  {n:'世界巡迴賽',wall:'#10142a',floor:'#c0402a',bar:'#2a2a3a',tbl:'#1a46a0',lamp:'#ffffff',dark:1},
  {n:'冠軍決賽',wall:'#0a0c1c',floor:'#3a2a6a',bar:'#c8a040',tbl:'#1f4ab8',lamp:'#fff8e0',dark:1}];
const FOES=['小安','阿凱','美玲','大熊','阿宏','小芸','志明','春嬌','阿哲','小琪','大山','阿妹','小傑','阿娟','大寶','小芳','阿翔','小雯','阿德','小蓉','阿強','小慧','阿龍','小婷','阿伯'];
const FCOL=['#4f9dff','#ff9d3d','#5fd068','#b98cff','#ff5d8f','#3ddbd9','#e8c040','#ff6b4a'];
const STAGES=Array.from({length:LV},(_,i)=>{ const v=Math.floor(i/20),k=i/(LV-1); return {i,v,k,foe:FOES[(i*7+v*5)%FOES.length]+(i>=100?'・進階':''),col:FCOL[(i*5+2)%FCOL.length],hair:(i+1)%3,name:VENUES[v].n+' '+(i%20+1),stars:Math.min(5,1+Math.floor(i/40))}; });
const recKey=i=>'arcade.pingpong.w.'+i,getRec=i=>LS(recKey(i));

/* ---------- 球：重力＋旋轉（上旋往下壓、下旋飄、側旋拐彎），撞到桌面會彈 ---------- */
const gEff=sp=>G+(sp==='top'?260:sp==='back'?-170:0);
function stepB(b,dt){ b.vh-=gEff(b.spin)*dt; b.vx*=1-.18*dt; b.vw*=1-.18*dt; b.x+=b.vx*dt; b.h+=b.vh*dt; b.w+=b.vw*dt+(b.side||0)*dt*dt*40; }
const onTable=(x,w)=>x>=TX0-1&&x<=TX1+1&&Math.abs(w)<=TW+1;
function tblBounce(b){ b.h=TH; b.vh=Math.abs(b.vh)*(b.spin==='back'?.72:.86); if(b.spin==='top') b.vx*=1.06; else if(b.spin==='back') b.vx*=.78; else b.vx*=.94; b.spin=b.spin==='top'?'top':''; }
// 模擬一球：回傳彈跳順序、是否過網，用來瞄準
function simPath(x,w,h,vx,vw,vh,spin,max){ const s={x,w,h,vx,vw,vh,spin},ev=[]; let netOK=null;
  for(let i=0;i<(max||400);i++){ const px=s.x; stepB(s,1/120); if(netOK==null&&(px-NETX)*(s.x-NETX)<=0) netOK=s.h>TH+NETH+3;
    if(s.h<=TH&&s.vh<0&&onTable(s.x,s.w)){ ev.push({x:s.x,w:s.w,t:i/120}); if(ev.length>=2) break; tblBounce(s); continue; } if(s.h<=0){ ev.push({x:s.x,w:s.w,t:i/120,floor:1}); break; } }
  return {ev,netOK}; }
// 瞄準：從擊球點打到對面 (tx,tw)，用飛行時間 T 算初速；過不了網就把 T 拉長（打得比較高）
function aimTo(x,w,h,tx,tw,T,spin){ const g=gEff(spin); for(let k=0;k<10;k++,T*=1.12){ const vx=(tx-x)/T,vw=(tw-w)/T,vh=(TH-h+.5*g*T*T)/T,tn=(NETX-x)/vx,hn=h+vh*tn-.5*g*tn*tn; if(tn>0&&tn<T&&hn>TH+NETH+5) return {vx:vx/(1-.09*T),vw,vh,T}; } return null; }

/* ---------- 轉播鏡頭：在自己這邊後上方 ---------- */
const CAMX=-500,CAMH=315,FOC=1320,HY=-170,SCP=.56,SCF=.82; // 近的選手縮小一點才不會擋住球桌，遠的放大一點才看得到上半身
function proj(x,w,h,ct){ if(ct===1){ x=W-x; w=-w; } const d=Math.max(30,x-CAMX),s=FOC/d; return [W/2+w*s,HY+(CAMH-h)*s,s,d]; }

/* ---------- 寫實選手（骨架＋關鍵影格） ---------- */
const SKINS=['#f1c9a5','#e8b88f','#d9a37a','#c48a62'];
function lerp3(a,b,u){ return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u]; }
function keyAt(K,u){ for(let i=0;i<K.length-1;i++){ if(u<=K[i+1][0]){ const s=(u-K[i][0])/Math.max(1e-6,K[i+1][0]-K[i][0]),e=s*s*(3-2*s); return lerp3(K[i][1],K[i+1][1],e); } } return K[K.length-1][1]; }
const SWING={
  ready:{hand:[[0,[30,102,22]],[1,[30,102,22]]],rot:[[0,0],[1,0]],crouch:.6},
  fh:{hand:[[0,[16,104,30]],[.28,[44,92,-6]],[.45,[30,112,34]],[.75,[-4,150,30]],[1,[-8,146,22]]],rot:[[0,0],[.28,-.65],[.45,.1],[.75,.55],[1,.4]],crouch:.65},
  bh:{hand:[[0,[12,104,30]],[.28,[-14,96,16]],[.45,[0,108,40]],[.75,[26,132,36]],[1,[30,130,26]]],rot:[[0,0],[.28,.45],[.45,0],[.75,-.35],[1,-.25]],crouch:.65},
  push:{hand:[[0,[16,104,30]],[.28,[18,118,16]],[.45,[16,100,44]],[.75,[14,94,50]],[1,[14,98,40]]],rot:[[0,0],[.28,-.15],[.45,0],[1,.05]],crouch:.75},
  smash:{hand:[[0,[16,110,24]],[.28,[38,170,-14]],[.45,[24,150,34]],[.75,[-10,100,30]],[1,[-14,96,20]]],rot:[[0,0],[.28,-.6],[.45,.15],[.75,.55],[1,.4]],crouch:.4},
  serve:{hand:[[0,[22,100,10]],[.3,[36,104,-14]],[.5,[24,98,26]],[.75,[4,122,34]],[1,[0,120,26]]],rot:[[0,-.3],[.3,-.55],[.5,0],[.75,.3],[1,.25]],crouch:.75}};
function poseOf(st){ const S=SWING[st.type]||SWING.ready,u=st.u||0,rot=keyAt(S.rot.map(k=>[k[0],[k[1],0,0]]),u)[0],cr=S.crouch,rp=st.run||0,mv=st.mv||0;
  const hipY=94-cr*22,J={},lift=Math.sin(rp)*mv,step=Math.cos(rp)*mv;
  J.hipC=[0,hipY,0]; J.neck=[0,hipY+52,8+cr*10]; J.head=[0,hipY+68,11+cr*12];
  const ca=Math.cos(rot),sa=Math.sin(rot); J.shR=[19*ca,hipY+48,-19*sa+8]; J.shL=[-19*ca,hipY+48,19*sa+8];
  J.hipR=[10,hipY,0]; J.hipL=[-10,hipY,0];
  const fw=26+cr*12; J.ankR=[fw+step*6,6+Math.max(0,lift)*8,4]; J.ankL=[-fw+step*6,6+Math.max(0,-lift)*8,-4];
  const knee=(h,a,s)=>[(h[0]+a[0])/2+s*(4+cr*9),(h[1]+a[1])/2+cr*3,(h[2]+a[2])/2+12+cr*12]; J.kneeR=knee(J.hipR,J.ankR,1); J.kneeL=knee(J.hipL,J.ankL,-1);
  const hand=keyAt(S.hand,u); J.handR=hand;
  const el=(s,h,side)=>{ const m=lerp3(s,h,.5),dx=h[0]-s[0],dy=h[1]-s[1],dz=h[2]-s[2],L=Math.hypot(dx,dy,dz),bend=Math.max(0,(56-L))*.55; return [m[0]+side*bend*.5,m[1]-bend*.7,m[2]-bend*.25]; };
  J.elbR=el(J.shR,hand,1);
  J.handL=st.type==='serve'&&u<.5?[-14,hipY+42+Math.sin(Math.min(1,u/.45)*Math.PI*.5)*44,26]:st.type&&st.type!=='ready'?[J.shL[0]-20-rot*8,hipY+34,16-rot*12]:[-10,hipY+32,30]; J.elbL=el(J.shL,J.handL,-1);
  return J; }
function drawHuman(c,X,Y,sc,front,look,st){ const J=poseOf(st),m=front?-1:1,skin=look.skin||SKINS[(look.hair|0)%4],shirt=look.color||'#ff5d6d',shorts=look.shorts||'#1c1e2a',hairC=['#2a1a10','#14100c','#6a3a1a'][(look.hair|0)%3];
  const P=v=>[X+v[0]*m*sc,Y-(v[1]+v[2]*(front?-.2:.2))*sc],dz=v=>front?v[2]:-v[2];
  const limb=(a,b,w1,w2,col)=>{ const A=P(a),B=P(b),dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,r1=w1*sc/2,r2=w2*sc/2; c.fillStyle=col; c.beginPath(); c.moveTo(A[0]+nx*r1,A[1]+ny*r1); c.lineTo(B[0]+nx*r2,B[1]+ny*r2); c.lineTo(B[0]-nx*r2,B[1]-ny*r2); c.lineTo(A[0]-nx*r1,A[1]-ny*r1); c.closePath(); c.fill(); c.beginPath(); c.arc(A[0],A[1],r1,0,TAU); c.arc(B[0],B[1],r2,0,TAU); c.fill(); };
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(X,Y,34*sc,9*sc,0,0,TAU); c.fill();
  const parts=[];
  for(const s of ['R','L']){ const h=J['hip'+s],k=J['knee'+s],a=J['ank'+s],z=(h[2]+a[2])/2;
    parts.push({z:dz([0,0,z])-20,f:()=>{ limb(h,k,17,13,skin); limb(lerp3(h,k,0),lerp3(h,k,.5),19,16,shorts); limb(k,a,12,8,skin); const A=P(a); c.fillStyle='#f4f4f4'; c.beginPath(); c.ellipse(A[0],A[1]+2*sc,8.5*sc,5*sc,0,0,TAU); c.fill(); c.fillStyle=shirt; c.fillRect(A[0]-7*sc,A[1]-1*sc,14*sc,2*sc); c.fillStyle='#fff'; c.fillRect(A[0]-4*sc,A[1]-8*sc,8*sc,6*sc); }}); }
  parts.push({z:0,f:()=>{ const hl=P(J.hipL),hr=P(J.hipR),sl=P(J.shL),sr=P(J.shR),nk=P(J.neck); c.fillStyle=shorts; c.beginPath(); c.moveTo(hl[0]-3*sc*m,hl[1]-6*sc); c.lineTo(hr[0]+3*sc*m,hr[1]-6*sc); c.lineTo(hr[0]+4*sc*m,hr[1]+10*sc); c.lineTo(hl[0]-4*sc*m,hl[1]+10*sc); c.closePath(); c.fill();
    const g=c.createLinearGradient(sl[0],0,sr[0],0); g.addColorStop(0,shade(shirt,.78)); g.addColorStop(.5,shirt); g.addColorStop(1,shade(shirt,.88)); c.fillStyle=g; c.beginPath(); c.moveTo(sl[0],sl[1]-3*sc); c.quadraticCurveTo(nk[0],nk[1]-4*sc,sr[0],sr[1]-3*sc); c.lineTo(hr[0]+2*sc*m,hr[1]-2*sc); c.lineTo(hl[0]-2*sc*m,hl[1]-2*sc); c.closePath(); c.fill();
    c.fillStyle='rgba(255,255,255,.7)'; c.beginPath(); c.moveTo(sl[0],sl[1]-2*sc); c.lineTo(sl[0]+(sr[0]-sl[0])*.12,sl[1]-2*sc); c.lineTo(hl[0]+(hr[0]-hl[0])*.1,hl[1]-3*sc); c.lineTo(hl[0],hl[1]-3*sc); c.closePath(); c.fill(); c.beginPath(); c.moveTo(sr[0],sr[1]-2*sc); c.lineTo(sr[0]-(sr[0]-sl[0])*.12,sr[1]-2*sc); c.lineTo(hr[0]-(hr[0]-hl[0])*.1,hr[1]-3*sc); c.lineTo(hr[0],hr[1]-3*sc); c.closePath(); c.fill();
    if(!front&&look.num){ c.fillStyle='rgba(255,255,255,.85)'; c.font='900 '+Math.round(16*sc)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(look.num,(sl[0]+sr[0])/2,(sl[1]+hl[1])/2); }
    limb(J.neck,lerp3(J.neck,J.head,.4),9,9,skin); }});
  parts.push({z:3,f:()=>{ const H=P(J.head),r=12*sc; c.fillStyle=skin; c.beginPath(); c.ellipse(H[0],H[1],r*.86,r,0,0,TAU); c.fill();
    if(front){ c.fillStyle=hairC; c.beginPath(); c.ellipse(H[0],H[1]-r*.35,r*.92,r*.72,0,Math.PI,0); c.fill(); c.fillStyle='#2a1a14'; c.beginPath(); c.ellipse(H[0]-r*.33,H[1]+r*.05,r*.1,r*.13,0,0,TAU); c.ellipse(H[0]+r*.33,H[1]+r*.05,r*.1,r*.13,0,0,TAU); c.fill(); c.strokeStyle='rgba(120,60,40,.6)'; c.lineWidth=1.2*sc; c.beginPath(); c.moveTo(H[0],H[1]+r*.15); c.lineTo(H[0]-r*.06,H[1]+r*.38); c.moveTo(H[0]-r*.2,H[1]+r*.6); c.quadraticCurveTo(H[0],H[1]+r*.7,H[0]+r*.2,H[1]+r*.6); c.stroke(); }
    else { c.fillStyle=hairC; c.beginPath(); c.ellipse(H[0],H[1]-r*.05,r*.92,r*.98,0,0,TAU); c.fill(); if((look.hair|0)%3===1){ c.beginPath(); c.ellipse(H[0],H[1]+r*1.1,r*.25,r*.6,0,0,TAU); c.fill(); } } }});
  const arm=(s,racket)=>{ const sh=J['sh'+s],el=J['elb'+s],hd=J['hand'+s];
    parts.push({z:dz([0,0,(sh[2]+hd[2])/2])+(racket?1:0),f:()=>{ limb(sh,lerp3(sh,el,.45),13,12,shirt); limb(sh,el,10,8,skin); limb(lerp3(sh,el,0),lerp3(sh,el,.42),13,11,shirt); limb(el,hd,8,6.5,skin);
      if(racket){ const H=P(hd),E=P(el),a=Math.atan2(H[1]-E[1],H[0]-E[0]); c.save(); c.translate(H[0],H[1]); c.rotate(a+Math.PI/2); c.scale(sc,sc); c.fillStyle=look.grip||'#c89a5a'; rr(c,-2.6,-12,5.2,14,2); c.fill(); c.fillStyle=front?(look.rub||'#d82a2a'):'#16161c'; c.beginPath(); c.ellipse(0,-22,9.5,10.5,0,0,TAU); c.fill(); c.strokeStyle='#e8d4a8'; c.lineWidth=1.2; c.stroke(); c.fillStyle='rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(-2.5,-25,4,5,-.4,0,TAU); c.fill(); c.restore(); }
      const H=P(hd); c.fillStyle=skin; c.beginPath(); c.arc(H[0],H[1],4.2*sc,0,TAU); c.fill(); }}); };
  arm('R',true); arm('L',false);
  parts.sort((a,b)=>a.z-b.z).forEach(p=>p.f());
  if(st.label){ const H=P(J.head); c.font='900 17px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=4; c.strokeStyle='#14122b'; c.strokeText(st.label,H[0],H[1]-30*sc-8); c.fillStyle='#ffd23f'; c.fillText(st.label,H[0],H[1]-30*sc-8); } }

/* ---------- 場館背景（地板、擋板、燈光、觀眾）快取 ---------- */
const BGC={};
function hallBg(v){ if(BGC[v]) return BGC[v]; const e=document.createElement('canvas'); e.width=W; e.height=H; const c=e.getContext('2d'),V=VENUES[v],R=n=>((Math.sin(n*12.9898+v*7.1)*43758.5453)%1+1)%1;
  // 牆面與看台
  let g=c.createLinearGradient(0,0,0,170); g.addColorStop(0,shade(V.wall,.7)); g.addColorStop(1,V.wall); c.fillStyle=g; c.fillRect(0,0,W,180);
  if(V.dark){ for(let r=0;r<5;r++) for(let i=0;i<46;i++){ const x=i*18+(r%2)*9+R(i+r*50)*4,y=40+r*22; c.fillStyle=['#3a3a52','#4a3a3a','#3a4a5a','#5a4a3a','#2a2a40'][(i+r)%5]; c.beginPath(); c.arc(x,y,6.5,0,TAU); c.fill(); c.fillRect(x-7,y+5,14,10); }
    for(let i=0;i<5;i++){ const x=80+i*160,lg=c.createRadialGradient(x,0,4,x,0,170); lg.addColorStop(0,'rgba(255,255,240,.45)'); lg.addColorStop(1,'rgba(255,255,240,0)'); c.fillStyle=lg; c.fillRect(x-170,0,340,180); } }
  else { c.fillStyle=shade(V.wall,.92); for(let i=0;i<8;i++) c.fillRect(i*110+20,30,70,46); c.fillStyle='rgba(140,190,230,.5)'; for(let i=0;i<8;i++) c.fillRect(i*110+24,34,62,38);
    for(let i=0;i<4;i++){ const x=100+i*200; c.fillStyle='#e8e8e8'; c.fillRect(x-36,4,72,6); const lg=c.createRadialGradient(x,8,2,x,8,110); lg.addColorStop(0,'rgba(255,255,230,.5)'); lg.addColorStop(1,'rgba(255,255,230,0)'); c.fillStyle=lg; c.fillRect(x-110,0,220,120); } }
  c.fillStyle='rgba(0,0,0,.25)'; c.fillRect(0,92,W,4);
  // 地板（透視，木紋或運動地墊）
  const q=(x,w)=>proj(x,w,0,0); const fl=[q(-200,-700),q(1000,-700),q(1000,700),q(-200,700)];
  g=c.createLinearGradient(0,96,0,H); g.addColorStop(0,shade(V.floor,.7)); g.addColorStop(1,shade(V.floor,1.1)); c.fillStyle=g; c.fillRect(0,96,W,H-96);
  c.strokeStyle='rgba(0,0,0,.12)'; c.lineWidth=1; for(let i=-12;i<=12;i++){ const a=q(-200,i*60),b=q(1100,i*60); c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]); c.stroke(); }
  // 比賽區擋板（矮的布條板）
  const barX0=80,barX1=720,BW=230,bh=22;
  const board=(x0,w0,x1,w1)=>{ const a=proj(x0,w0,0,0),b=proj(x1,w1,0,0),at=proj(x0,w0,bh,0),bt=proj(x1,w1,bh,0); c.fillStyle=V.bar; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]); c.lineTo(bt[0],bt[1]); c.lineTo(at[0],at[1]); c.closePath(); c.fill(); c.fillStyle='rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(at[0],at[1]); c.lineTo(bt[0],bt[1]); c.lineTo(bt[0],bt[1]+3); c.lineTo(at[0],at[1]+3); c.closePath(); c.fill(); };
  board(barX1,-BW,barX1,BW); board(barX0+60,-BW,barX1,-BW); board(barX0+60,BW,barX1,BW);
  { const a=proj(barX1,0,bh*.5,0); c.fillStyle='rgba(255,255,255,.85)'; c.font='900 '+Math.round(13*a[2])+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('桌球對決　'+V.n,a[0],a[1]); }
  // 場地內的運動地墊
  const mat=[proj(barX0+40,-BW+6,0,0),proj(barX1-6,-BW+6,0,0),proj(barX1-6,BW-6,0,0),proj(barX0+40,BW-6,0,0)]; c.fillStyle=shade(V.floor,1.05); c.beginPath(); mat.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])); c.closePath(); c.fill();
  // 球桌下的影子
  const sh=[proj(TX0-20,-TW-14,0,0),proj(TX1+20,-TW-14,0,0),proj(TX1+20,TW+14,0,0),proj(TX0-20,TW+14,0,0)]; c.fillStyle='rgba(0,0,0,.35)'; c.beginPath(); sh.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])); c.closePath(); c.fill();
  return BGC[v]=e; }
// 球桌（每次畫，因為兩邊鏡頭不同）：桌腳、桌面、白線、桌邊厚度
function drawTable(c,V,ct){ const P=(x,w,h)=>proj(x,w,h,ct),poly=(pts,col)=>{ c.fillStyle=col; c.beginPath(); pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])); c.closePath(); c.fill(); };
  for(const [x,w] of [[TX0+30,-TW+12],[TX0+30,TW-12],[TX1-30,-TW+12],[TX1-30,TW-12],[NETX-10,-TW+20],[NETX+10,TW-20]]){ const a=P(x,w,0),b=P(x,w,TH-3); c.strokeStyle='#2a2a30'; c.lineWidth=Math.max(2,5*a[2]); c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]); c.stroke(); c.fillStyle='#1a1a20'; c.beginPath(); c.ellipse(a[0],a[1],6*a[2],2*a[2],0,0,TAU); c.fill(); }
  const nx=ct?TX1:TX0; poly([P(nx,-TW,TH),P(nx,TW,TH),P(nx,TW,TH-5),P(nx,-TW,TH-5)],shade(V.tbl,.55)); // 靠近鏡頭這一端的桌邊
  for(const sd of [-1,1]) poly([P(TX0,sd*TW,TH),P(TX1,sd*TW,TH),P(TX1,sd*TW,TH-5),P(TX0,sd*TW,TH-5)],shade(V.tbl,.5));
  const top=[P(TX0,-TW,TH),P(TX1,-TW,TH),P(TX1,TW,TH),P(TX0,TW,TH)],g=c.createLinearGradient(0,top[1][1],0,top[0][1]); g.addColorStop(0,shade(V.tbl,.9)); g.addColorStop(.6,V.tbl); g.addColorStop(1,shade(V.tbl,1.12)); poly(top,g);
  // 燈光反光
  const hl=c.createRadialGradient(W/2,(top[0][1]+top[1][1])/2,4,W/2,(top[0][1]+top[1][1])/2,200); hl.addColorStop(0,'rgba(255,255,255,.16)'); hl.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=hl; c.beginPath(); top.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])); c.closePath(); c.fill();
  c.strokeStyle='#f4f4f4'; const L=(a,b,lw)=>{ c.lineWidth=lw*a[2]; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]); c.stroke(); };
  L(P(TX0,-TW+1,TH),P(TX1,-TW+1,TH),2); L(P(TX0,TW-1,TH),P(TX1,TW-1,TH),2); L(P(TX0+1,-TW,TH),P(TX0+1,TW,TH),2); L(P(TX1-1,-TW,TH),P(TX1-1,TW,TH),2); L(P(TX0,0,TH),P(TX1,0,TH),1); }
function drawNet(c,ct){ const a=proj(NETX,-TW-8,TH,ct),b=proj(NETX,TW+8,TH,ct),at=proj(NETX,-TW-8,TH+NETH,ct),bt=proj(NETX,TW+8,TH+NETH,ct);
  c.fillStyle='rgba(20,22,30,.55)'; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]); c.lineTo(bt[0],bt[1]); c.lineTo(at[0],at[1]); c.closePath(); c.fill();
  c.strokeStyle='rgba(255,255,255,.18)'; c.lineWidth=.8; for(let i=1;i<40;i++){ const u=i/40; c.beginPath(); c.moveTo(lerp(at[0],bt[0],u),lerp(at[1],bt[1],u)); c.lineTo(lerp(a[0],b[0],u),lerp(a[1],b[1],u)); c.stroke(); }
  c.strokeStyle='#f4f4f4'; c.lineWidth=3; c.beginPath(); c.moveTo(at[0],at[1]); c.lineTo(bt[0],bt[1]); c.stroke();
  c.fillStyle='#9aa0aa'; for(const p of [[a,at],[b,bt]]){ c.fillRect(p[0][0]-3,p[1][1]-2,6,p[0][1]-p[1][1]+5); } }
function drawBall(c,b,ct,trail){ const p=proj(b.x,b.w,b.h,ct),r=Math.max(2.6,3.6*p[2]);
  if(trail) trail.forEach((q,i)=>{ const pp=proj(q[0],q[1],q[2],ct); c.fillStyle='rgba(255,240,220,'+(i/trail.length*.35)+')'; c.beginPath(); c.arc(pp[0],pp[1],r*(.4+.6*i/trail.length),0,TAU); c.fill(); });
  const gh=b.x>=TX0&&b.x<=TX1&&Math.abs(b.w)<=TW&&b.h>=TH-1?TH:0,g=proj(b.x,b.w,gh,ct); c.fillStyle='rgba(0,0,0,'+(gh?.35:.25)+')'; c.beginPath(); c.ellipse(g[0],g[1],r*1.2,r*.45,0,0,TAU); c.fill();
  const gr=c.createRadialGradient(p[0]-r*.35,p[1]-r*.4,r*.1,p[0],p[1],r); gr.addColorStop(0,'#fff'); gr.addColorStop(1,b.col||'#f0e8dc'); c.fillStyle=gr; c.beginPath(); c.arc(p[0],p[1],r,0,TAU); c.fill(); }

/* ---------- 遊戲 ---------- */
function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,two=!net&&opts.mode==='2p',solo=!net&&!two,OPT=opts.options||{};
  // 雙打照 ITTF：發球從自己的右半邊斜對角打到對方的右半邊；同一隊兩人一定要輪流擊球（A1→B1→A2→B2 的順序）；每 2 分換發球，上一個接發球的人變成發球員
  const TM=['vs','coop'].includes(OPT.team)?OPT.team:'1v1',pair=two||(!!net&&net.count===2);
  const dbl=net&&net.count>2?true:pair?TM!=='1v1':OPT.fmt==='doubles',N=dbl?4:2,coop=pair&&dbl&&TM==='coop',SL=h=>coop&&h===1?2:h,HI=i=>coop?(i===2?1:i===1?-1:i):i,me=net?SL(Math.min(N-1,net.me)):0;
  const {ctx:c}=env.canvas2d(W,H),si=clamp(opts.stage|0,0,LV-1),ST=STAGES[si],VEN=solo?ST.v:clamp(+OPT.court||0,0,VENUES.length-1),V=VENUES[VEN];
  const BO=OPT.len==='g5'?3:OPT.len==='g3'?2:1; // 贏幾局拿下比賽
  const vsAI=solo||(net&&net.count<2)||(dbl&&(net?net.count:two?2:1)<N),k=vsAI?ST.k:1,AI={spd:120+95*k,react:.36-.2*k,err:60-50*k,lat:70-55*k,miss:.16*(1-k)};
  const ctrl=[]; for(let i=0;i<N;i++){ let cc='ai';
    if(net){ const h=HI(i); if(h>=0&&h<net.count) cc=i===me?'self':'net'; }
    else if(two){ if(!dbl) cc=i===0?'key0':'key1'; else if(coop) cc=i===0?'key0':i===2?'key1':'ai'; else cc=i===0?'key0':i===1?'key1':'ai'; }
    else cc=i===0?'solo':'ai'; ctrl.push(cc); }
  const isAI=i=>ctrl[i]==='ai',human=i=>!isAI(i);
  const ALTC=['#ff5d6d',solo&&!dbl?ST.col:'#4f9dff','#ff9d3d','#3ddbd9'];
  const ps=Array.from({length:N},(_,i)=>{ const tm=i%2,lk=Object.assign({},(net?net.looks&&HI(i)>=0&&net.looks[HI(i)]:null)||(i===0?opts.look:null)||{color:ALTC[i],hair:i===1&&solo&&!dbl?ST.hair:i%3}); if(!lk.color) lk.color=ALTC[i];
    return {n:i,team:tm,x:tm?TX1+40:TX0-40,w:0,face:tm?-1:1,sw:0,hitOK:false,dk:false,moving:false,tx:0,tw:0,look:lk,aim:0,swType:'ready',run:0}; });
  for(let i=1;i<N;i++) if(ps[i].team!==ps[0].team&&ps[i].look.color===ps[0].look.color) ps[i].look.color='#4f9dff';
  const nm=i=>net?(HI(i)>=0&&HI(i)<net.count?(net.names[HI(i)]||'玩家 '+(HI(i)+1)):'電腦'+(i+1)):ctrl[i]==='key0'?'1P':ctrl[i]==='key1'?'2P':ctrl[i]==='solo'?(opts.name||'你'):(dbl&&ps[i].team===0?'電腦隊友':ST.foe+(dbl?(i<2?'A':'B'):''));
  const names=ps.map((p,i)=>nm(i)),myTeam=me%2,CT=net?myTeam:0,TN=tm=>dbl?ps.filter(p=>p.team===tm).map(p=>names[p.n]).join('＋'):names[tm];
  const ball={x:0,w:0,h:0,vx:0,vw:0,vh:0,spin:'',side:0,tx:0,tw:0,th:0},fx=[],pts=[0,0],games=[0,0],trail=[];
  let t=0,phase='serve',first=opts.first===1?1:0,server=first,recv=1-first,svI=0,hits=0,lastHit=-1,lastTeam=-1,bnSide=-1,bnCount=0,ptT=0,msg='',msgT=0,ended=false,overT=0,introT=2.4,aiServeT=1.3,rally=0,best=0,ev=[],sendT=0,shake=0,tossT=0,svKind='top',netTouch=false,gameNo=0,bigMsg='',bigT=0,svOK1=true;
  const aiS=ps.map(()=>({pred:null,t:0,dec:{n:-1},react:0})),rin=ps.map(()=>({dx:0,dy:0,sw:false,dk:false}));
  const sfx=n=>{ env.sfx(n); if(net&&net.host) ev.push(n); };
  const pop=(txt,col,x,w,h)=>fx.push({k:'txt',txt,col,x,w,h,t:0});
  const total=()=>pts[0]+pts[1];
  const RWs=p=>p.team?-1:1;
  // 換發球：每 2 分換一次，10 平之後每 1 分換；每局由上一局的接發球方先發。雙打照 A1→B1→A2→B2 輪，下一個發球員是上一個接發球的人
  const CYC=[0,1,2,3];
  function setWho(){ const gFirst=(first+gameNo)%2,n=total(),sw=n<20?Math.floor(n/2):10+(n-20);
    if(dbl){ svI=(gFirst+sw)%4; server=CYC[svI]; recv=CYC[(svI+1)%4]; } else { server=(gFirst+sw)%2; recv=1-server; } }
  const svLeft=()=>total()>=20?1:2-total()%2;
  // 雙打下一個該擊球的人：從發球員開始照順序輪
  const nextHitter=()=>dbl?CYC[(svI+hits)%4]:-1;
  function setServe(){ phase='serve'; hits=0; lastHit=-1; lastTeam=-1; bnSide=-1; bnCount=0; rally=0; aiServeT=1.3; tossT=0; netTouch=false; trail.length=0; setWho();
    for(const p of ps){ p.sw=0; const S=p.n===server,Rv=p.n===recv;
      if(!dbl){ p.x=p.team?TX1+(S?24:46):TX0-(S?24:46); p.w=S?RWs(p)*28:-RWs(ps[server])*10; }
      else { const fwd=p.team?1:-1; if(S){ p.x=(p.team?TX1:TX0)+fwd*24; p.w=RWs(p)*36; } else if(Rv){ p.x=(p.team?TX1:TX0)+fwd*40; p.w=RWs(p)*36; } else { p.x=(p.team?TX1:TX0)+fwd*90; p.w=-RWs(p)*55; } } }
    for(const a of aiS) a.pred=null; }
  setServe();
  function keyIn(which){ const kk=env.keys;
    if(which==='key0') return {dx:(kk.KeyD?1:0)-(kk.KeyA?1:0),dy:(kk.KeyW?1:0)-(kk.KeyS?1:0),sw:env.hit('KeyF')||env.hit('Space'),dk:env.hit('KeyG')};
    if(which==='key1') return {dx:(kk.ArrowRight?1:0)-(kk.ArrowLeft?1:0),dy:(kk.ArrowUp?1:0)-(kk.ArrowDown?1:0),sw:env.hit('Enter')||env.hit('NumpadEnter'),dk:env.hit('ShiftRight')||env.hit('Slash')};
    return {dx:(kk.ArrowRight||kk.KeyD?1:0)-(kk.ArrowLeft||kk.KeyA?1:0),dy:(kk.ArrowUp||kk.KeyW?1:0)-(kk.ArrowDown||kk.KeyS?1:0),sw:env.hit('Space')||env.hit('KeyJ')||env.hit('Enter'),dk:env.hit('KeyX')||env.hit('KeyK')}; }
  const xLim=p=>p.team?[TX1+14,TX1+(dbl?150:120)]:[TX0-(dbl?150:120),TX0-14];
  const reachD=(p,b)=>Math.hypot(b.x-(p.x+p.face*24),b.w-p.w,Math.max(0,Math.abs(b.h-(TH+44))-52));
  const canHit=p=>p.team!==lastTeam&&bnSide===p.team&&bnCount===1&&(!dbl||p.n===nextHitter());
  // 電腦：模擬球路，找彈到自己這邊之後、最早站得到的位置
  function predict(p){ const b={x:ball.x,w:ball.w,h:ball.h,vx:ball.vx,vw:ball.vw,vh:ball.vh,spin:ball.spin,side:ball.side},[lo,hi]=xLim(p); let bounced=bnSide===p.team,last=null,sv1=false;
    for(let i=1;i<300;i++){ stepB(b,1/120); if(b.h<=TH&&b.vh<0&&onTable(b.x,b.w)&&b.h>TH-6){ if(bounced) break; if((b.x<NETX?0:1)!==p.team){ if(hits===1&&bnSide===-1&&!sv1){ sv1=true; tblBounce(b); continue; } break; } bounced=true; tblBounce(b); continue; } if(b.h<=0) break;
      if(!bounced) continue; if(b.h<TH+8||b.h>TH+120) continue; const sx=b.x-p.face*24; if(sx<lo-10||sx>hi+10) continue; last={x:clamp(sx,lo,hi),w:b.w,t:i/120};
      const need=Math.max(0,Math.hypot(last.x-p.x,b.w-p.w)-REACH*.5)/AI.spd+AI.react; if(need<=i/120) return last; } return last; }
  function aiInput(p,dt){ const o={sw:false,dk:false,wx:0,ww:0},A=aiS[p.n];
    if(phase==='serve'){ if(server===p.n&&introT<=0&&tossT<=0&&(aiServeT-=dt)<=0){ if(Math.random()<.45) o.dk=true; else o.sw=true; aiServeT=9; } return o; }
    if(phase!=='play') return o;
    const coming=lastTeam>=0&&lastTeam!==p.team,myTurn=!dbl||p.n===nextHitter();
    if(coming&&myTurn){ if((A.t-=dt)<=0||!A.pred){ A.t=.08; A.pred=predict(p); if(A.dec.n!==hits) A.dec={n:hits,whiff:Math.random()<(ball.fast?.3-.24*k:.07-.06*k),off:Math.random()<AI.miss?(Math.random()-.5)*60:0,push:Math.random()<(ball.spin==='back'?.55:.15)}; } A.react-=dt; }
    else { A.pred=null; A.react=AI.react; }
    const [lo,hi]=xLim(p),home=p.team?TX1+50-k*14:TX0-50+k*14,sh=clamp(ball.w,-TW,TW)*(.15+.45*k);
    let tx=home,tw=sh;
    if(dbl&&!myTurn){ // 不是輪到自己：退開讓隊友打，站到球的另一邊、稍微後面
      const mate=ps.find(q=>q.team===p.team&&q!==p),side=(mate.w>=ball.w?-1:1); tx=p.team?TX1+95:TX0-95; tw=clamp(mate.w+side*80,-TW-80,TW+80); }
    else if(dbl&&!coming){ tx=p.team?TX1+70:TX0-70; tw=sh*.6; }
    if(coming&&myTurn) A.rt=0; else A.rt=(A.rt||0)+dt; if(!(coming&&myTurn)&&!dbl&&(A.rt<(1-k)*.4||Math.hypot(tx-p.x,tw-p.w)<(1-k)*40)){ tx=p.x; tw=p.w; }
    if(coming&&myTurn&&A.pred){ tx=A.pred.x+(A.dec.off||0)*.3; tw=A.pred.w+(A.dec.off||0); }
    tx=clamp(tx,lo,hi); o.wx=tx-p.x; o.ww=tw-p.w;
    if(A.react<=0&&coming&&canHit(p)&&reachD(p,ball)<REACH*.85&&!(A.dec.n===hits&&A.dec.whiff)){ if(A.dec.push&&ball.h<TH+50) o.dk=true; else o.sw=true; } return o; }
  function inputOf(p,dt){ const cc=ctrl[p.n]; if(cc==='ai') return aiInput(p,dt); if(cc==='net'){ const r=rin[p.n],o={dx:r.dx,dy:r.dy,sw:r.sw,dk:r.dk}; r.sw=r.dk=false; return o; } return keyIn(cc==='self'?'solo':cc); }
  // 回球：自動判斷拉球（上旋）／扣殺（球很高）；「切球」＝下旋短球。按著左右會往那邊打
  function shoot(p,dk){ const dir=p.face,R=Math.random,ai=isAI(p.n),high=ball.h>TH+70,opp=ps.filter(q=>q.team!==p.team),oW=opp.reduce((a,q)=>a+q.w,0)/opp.length;
    let type=high&&!dk?'smash':dk?'push':'drive'; const oppEnd=dir>0?TX1:TX0;
    let tx=type==='push'?NETX+dir*(50+R()*70):oppEnd-dir*(18+R()*70),tw=p.aim?p.aim*(30+R()*(TW-40)):(oW>0?-1:1)*(20+R()*(TW-34));
    if(ai){ tx+=(R()-.5)*AI.err; tw+=(R()-.5)*AI.lat; }
    const T0=type==='smash'?(ai?.42-.1*k:.32):type==='push'?.78:(ai?.72-.2*k:.5)*(dbl?1.12:1),spin=type==='push'?'back':type==='smash'?'':'top';
    const stretch=clamp(reachD(p,ball)/REACH,0,1),baseE={push:.22,drive:.26,smash:.32}[type],spinIn=ball.spin==='back'&&type!=='push'?.5:0;
    let e=baseE*(1+stretch*1.5+(p.moving?.4:0)+spinIn)*(ai?(1.45-1.05*k):1);
    const gs=()=>((R()+R()+R())/1.5-1); tx+=gs()*e*80; tw+=gs()*e*60;
    let v=aimTo(ball.x,ball.w,ball.h,tx,clamp(tw,-TW-10,TW+10),T0*(1+gs()*e*.15),spin)||aimTo(ball.x,ball.w,ball.h,NETX+dir*90,0,.9,'')||{vx:dir*300,vw:0,vh:200};
    v.vh+=gs()*e*45; // 打得太高會出界、太低會掛網
    ball.vx=v.vx; ball.vw=v.vw; ball.vh=v.vh; ball.spin=spin; ball.side=0; ball.fast=type==='smash'||Math.abs(v.vx)>520; bnSide=-1; bnCount=0; netTouch=false;
    lastHit=p.n; lastTeam=p.team; hits++; rally++; best=Math.max(best,rally);
    p.swType=type==='smash'?'smash':type==='push'?'push':((ball.w-p.w)*RWs(p)>=-6?'fh':'bh'); p.sw=SWD*.55;
    if(type==='smash'){ sfx('boom'); shake=.18; pop('扣殺！','#ff5d8f',ball.x,ball.w,ball.h+30); } else sfx(type==='push'?'pop':'place');
    if(type==='push') pop('切球','#7af0ff',ball.x,ball.w,ball.h+30);
    fx.push({k:'ring',x:ball.x,w:ball.w,h:ball.h,t:0,col:type==='smash'?'#ff5d8f':'#fff'}); }
  function doServe(p,kind){ const dir=p.face,R=Math.random,ai=isAI(p.n),opp=ps.filter(q=>q.team!==p.team),oppEnd=dir>0?TX1:TX0;
    // 先彈自己這邊、再落到對面：試幾組速度找最接近目標的。雙打要從自己的右半邊打到對方的右半邊
    const tx=kind==='back'?NETX+dir*(55+R()*60):oppEnd-dir*(25+R()*60),tw=dbl?-RWs(p)*(20+R()*(TW-40)):((opp[0].w>0?-1:1)*(20+R()*(TW-36)));
    let best=null,bd=1e9; for(let a=0;a<14;a++) for(let b=0;b<10;b++){ const vx=dir*(kind==='back'?170+a*18:230+a*26),vh=-60-b*28,vw=(tw-ball.w)*(.9+.25*R())/(Math.abs((tx-ball.x)/vx)+.05),sp=simPath(ball.x,ball.w,ball.h,vx,vw,vh,kind==='back'?'back':'top',360);
      if(sp.ev.length<2||sp.ev[0].floor||sp.ev[1].floor) continue; const e0=sp.ev[0],e1=sp.ev[1]; if((e0.x-NETX)*dir>=0||(e1.x-NETX)*dir<=0||!sp.netOK) continue; if(dbl&&(e0.w*RWs(p)<4||e1.w*RWs(p)>-4)) continue; const d=Math.abs(e1.x-tx)+Math.abs(e1.w-tw)*.5; if(d<bd){ bd=d; best={vx,vw,vh}; } }
    best=best||{vx:dir*260,vw:0,vh:-120}; const e=(ai?(1.3-1.0*k):.9)*.12,gs=()=>((R()+R()+R())/1.5-1);
    ball.vx=best.vx*(1+gs()*e*.5); ball.vw=best.vw+gs()*e*40; ball.vh=best.vh+gs()*e*60; ball.spin=kind==='back'?'back':'top'; ball.side=0; ball.fast=false;
    lastHit=p.n; lastTeam=p.team; hits=1; rally=1; bnSide=-1; bnCount=0; phase='play'; p.swType='serve'; p.sw=SWD*.55; sfx('pop'); pop(kind==='back'?'下旋短球':'上旋長球','#fff',ball.x,ball.w,ball.h+40); }
  function pointTo(wt,why){ if(phase!=='play'&&phase!=='serve') return; phase='point'; ptT=1.6; pts[wt]++; let txt='';
    const a=pts[wt],b=pts[1-wt];
    if(a>=11&&a-b>=2){ games[wt]++; txt=TN(wt)+' 拿下第 '+(gameNo+1)+' 局（'+a+'：'+b+'）'; if(games[wt]>=BO){ phase='over'; overT=0; } else { gameNo++; pts[0]=pts[1]=0; bigMsg=txt; bigT=2.2; ptT=2.4; } }
    else if(a===10&&b===10) txt='10 平（Deuce）：要多贏 2 分';
    else if(a>=10&&a-b===1) txt=TN(wt)+' 局點';
    const my=wt===myTeam; msg=(two?(dbl?(wt?'右隊':'左隊'):wt?'2P':'1P')+' 得分':my?'得分！':'對手得分')+'　'+why+(txt?'　'+txt:''); msgT=1.8;
    env.sfx(two||my?'item':'hurt'); if(net) ev.push('p'+wt); }
  function conclude(a,b){ if(ended) return; ended=true; const w=a>b?0:1,my=two||w===myTeam; if(solo&&w===0) LS(recKey(si),a+':'+b); env.sfx(my?'win':'lose');
    env.end({title:two?(dbl?(w?'右隊':'左隊'):w?'2P':'1P')+' 獲勝！':my?(solo?'贏了！過關':dbl?'你們贏了！':'你贏了！'):'輸了',big:BO>1?a+' : '+b:pts[0]+' : '+pts[1],text:(BO>1?'局數 '+a+' : '+b+'。':'')+(solo?ST.name+'　對手：'+ST.foe+(dbl?'隊':'')+'。':'')+(best>3?'最長來回 '+best+' 拍。':''),score:solo&&w===0?si+1:null,next:solo&&w===0&&si<LV-1}); }
  function snap(){ const m={s:[ps.map(p=>[r1(p.x),r1(p.w),r1(p.sw),p.moving?1:0,p.swType]),r1(ball.x),r1(ball.w),r1(ball.h),pts[0],pts[1],games[0],games[1],server,['serve','play','point','over'].indexOf(phase),gameNo,tossT>0?1:0,recv,hits,svI],e:ev,m:msgT>0?msg:'',b:bigT>0?bigMsg:''}; ev=[]; return m; }
  if(net){ if(client) net.onmsg=m=>{ if(m.s){ const s=m.s; s[0].forEach((q,i)=>{ const p=ps[i]; if(!p) return; p.tx=q[0]; p.tw=q[1]; p.sw=q[2]; p.moving=!!q[3]; p.swType=q[4]; }); ball.tx=s[1]; ball.tw=s[2]; ball.th=s[3]; pts[0]=s[4]; pts[1]=s[5]; games[0]=s[6]; games[1]=s[7]; server=s[8]; phase=['serve','play','point','over'][s[9]]; gameNo=s[10]; tossT=s[11]?.1:0; recv=s[12]; hits=s[13]; svI=s[14];
        for(const n of m.e){ if(n==='p0'||n==='p1') env.sfx(+n[1]===myTeam?'item':'hurt'); else env.sfx(n); } if(m.m){ msg=m.m; msgT=1.4; } if(m.b&&!bigT){ bigMsg=m.b; bigT=2; } } else if(m.end) conclude(m.end[0],m.end[1]); };
    else { net.onmsg=(m,from)=>{ const j=SL(from); if(m.i&&rin[j]){ const r=rin[j]; r.dx=m.i[0]; r.dy=m.i[1]; if(m.i[2]) r.sw=true; if(m.i[3]) r.dk=true; } }; net.onleave=i=>{ const j=SL(i); if(j<N&&!ended) ctrl[j]='ai'; }; } }
  function movePlayer(p,i,dt){ const sp=isAI(p.n)?AI.spd:215,cam=net?myTeam:0,fx2=cam?-1:1; let mx,mw;
    if(isAI(p.n)){ const d=Math.hypot(i.wx||0,i.ww||0); mx=d>3?(i.wx/d)*Math.min(1,d/20):0; mw=d>3?(i.ww/d)*Math.min(1,d/20):0; }
    else { mx=(i.dy||0)*fx2; mw=(i.dx||0)*fx2; const l=Math.hypot(mx,mw); if(l>1){ mx/=l; mw/=l; } p.aim=(i.dx||0)*fx2; }
    p.moving=Math.abs(mx)+Math.abs(mw)>.05; const [lo,hi]=xLim(p);
    if(phase==='serve'&&p.n===server){ if(tossT<=0) p.w=dbl?(RWs(p)>0?clamp(p.w+mw*sp*dt,8,TW-10):clamp(p.w+mw*sp*dt,-TW+10,-8)):clamp(p.w+mw*sp*dt,-TW+10,TW-10); p.moving=p.moving&&tossT<=0; } // 發球前沿著底線左右移動（雙打只能在右半邊）
    else if(phase!=='serve'){ p.x=clamp(p.x+mx*sp*dt*.7,lo,hi); p.w=clamp(p.w+mw*sp*dt,-TW-90,TW+90); }
    if(phase==='serve'&&p.n===server){ if((i.sw||i.dk)&&tossT<=0&&introT<=0){ tossT=.55; svKind=i.dk?'back':'top'; p.swType='serve'; sfx('click'); } }
    else if(phase==='play'&&(i.sw||i.dk)&&p.sw<=0){ p.sw=SWD; p.hitOK=true; p.dk=!!i.dk&&!i.sw; p.swType=p.dk?'push':ball.h>TH+70?'smash':(ball.w-p.w)*RWs(p)>=-6?'fh':'bh'; }
    if(p.sw>0) p.sw-=dt; if(p.moving) p.run+=dt*12; }
  let lastIn='';
  function update(dt){ t+=dt; if(introT>0) introT-=dt; if(msgT>0) msgT-=dt; if(bigT>0) bigT-=dt; if(shake>0) shake-=dt; for(const f of fx) f.t+=dt; for(let i=fx.length-1;i>=0;i--) if(fx[i].t>1) fx.splice(i,1);
    if(client){ const i=keyIn('solo'),key=''+i.dx+i.dy; sendT-=dt; if(key!==lastIn||i.sw||i.dk||sendT<=0){ lastIn=key; sendT=1/20; net.send({i:[i.dx,i.dy,+i.sw,+i.dk]}); }
      const f=Math.min(1,dt*20); for(const p of ps){ p.x+=(p.tx-p.x)*f; p.w+=(p.tw-p.w)*f; if(p.moving) p.run+=dt*12; } if(Math.hypot(ball.tx-ball.x,ball.th-ball.h)>60){ ball.x=ball.tx; ball.w=ball.tw; ball.h=ball.th; } else { ball.x+=(ball.tx-ball.x)*f; ball.w+=(ball.tw-ball.w)*f; ball.h+=(ball.th-ball.h)*f; }
      if(phase==='play'){ trail.push([ball.x,ball.w,ball.h]); if(trail.length>7) trail.shift(); } else trail.length=0; return; }
    if(ended) return; if(net){ sendT-=dt; if(sendT<=0){ sendT=1/20; net.send(snap()); } }
    if(phase==='over'){ overT+=dt; if(overT>1.8){ if(net){ net.send(snap()); net.send({end:[games[0],games[1]]}); } conclude(games[0],games[1]); } return; }
    for(const p of ps){ const i=inputOf(p,dt); movePlayer(p,i,dt); }
    if(phase==='point'){ ptT-=dt; if(ball.h>0){ stepB(ball,dt); if(ball.h<0) ball.h=0; } if(ptT<=0) setServe(); return; }
    if(phase==='serve'){ const p=ps[server],hx=p.x+p.face*22,hw=p.w-RWs(p)*10;
      if(tossT>0){ tossT-=dt; const u=1-tossT/.55; ball.x=hx; ball.w=hw; ball.h=TH+10+Math.sin(u*Math.PI)*58; p.sw=0; if(tossT<=0){ ball.x=hx+p.face*6; ball.h=TH+22; doServe(p,svKind); } }
      else { ball.x=hx; ball.w=hw; ball.h=TH+10; }
      return; }
    trail.push([ball.x,ball.w,ball.h]); if(trail.length>7) trail.shift();
    const n=Math.max(1,Math.ceil(dt*360)); for(let s=0;s<n&&phase==='play';s++){ const px=ball.x; stepB(ball,dt/n);
      if((px-NETX)*(ball.x-NETX)<=0&&Math.abs(ball.w)<TW+8&&ball.h<TH+NETH+2&&ball.h>TH-4){ if(ball.h<TH+NETH-2){ ball.x=NETX-Math.sign(ball.vx||1)*3; ball.vx*=-.2; ball.vw*=.3; ball.vh=Math.max(ball.vh,0)*.3; sfx('bump'); } else { ball.vh=Math.abs(ball.vh)*.4+30; ball.vx*=.7; netTouch=true; fx.push({k:'ring',x:NETX,w:ball.w,h:TH+NETH,t:0,col:'#aaa'}); } }
      for(const p of ps){ if(p.sw>.05&&p.hitOK&&canHit(p)&&reachD(p,ball)<REACH){ p.hitOK=false; shoot(p,p.dk); break; } }
      if(ball.h<=TH&&ball.vh<0&&onTable(ball.x,ball.w)&&ball.h>TH-6){ const sd=ball.x<NETX?0:1,ht=lastTeam,sv=ps[server];
        if(hits===1){ // 發球：先彈自己這邊、再彈對面；雙打要從右半邊打到對方右半邊（中線算）
          if(bnSide===-1){ if(sd!==ht){ pointTo(1-ht,'發球要先彈在自己這邊'); break; } if(dbl&&ball.w*RWs(sv)<-2){ pointTo(1-ht,'雙打發球要先彈在自己的右半邊'); break; } bnSide=sd; bnCount=0; tblBounce(ball); sfx('land'); fx.push({k:'dot',x:ball.x,w:ball.w,t:0}); continue; }
          if(bnSide===ht){ if(sd===ht){ pointTo(1-ht,'發球沒過網'); break; } if(dbl&&ball.w*RWs(sv)>2){ pointTo(1-ht,'雙打發球要落在對方的右半邊'); break; } if(netTouch){ phase='point'; ptT=1.1; msg='擦網（Let），重新發球'; msgT=1.1; sfx('click'); break; } bnSide=sd; bnCount=1; tblBounce(ball); sfx('land'); fx.push({k:'dot',x:ball.x,w:ball.w,t:0}); continue; } }
        if(bnSide===1-ht&&bnCount>=1){ pointTo(ht,'在桌上彈了兩次'); break; }
        if(sd===ht){ pointTo(1-ht,ball.vx*(ht?-1:1)<0||Math.abs(ball.x-NETX)<4?'掛網':'沒過網'); break; }
        bnSide=sd; bnCount=1; tblBounce(ball); sfx('land'); fx.push({k:'dot',x:ball.x,w:ball.w,t:0}); continue; }
      if(ball.h<=0){ const ht=lastTeam; if(bnSide===1-ht&&bnCount>=1) pointTo(ht,hits===1?'發球得分':'對手沒接到'); else pointTo(1-ht,hits===1?'發球失誤':bnSide===ht?'沒過網':'出界（沒打到球桌）'); break; } } }
  function draw(){ c.save(); if(shake>0) c.translate((Math.random()-.5)*5,(Math.random()-.5)*4); const ct=CT;
    c.drawImage(hallBg(VEN),0,0);
    const drawP=p=>{ const q=proj(p.x,p.w,0,ct); drawHuman(c,q[0],q[1],q[2]*(p.team===ct?SCP:SCF),p.team!==ct,p.look,{u:p.sw>0?1-p.sw/SWD:(phase==='serve'&&p.n===server&&tossT>0?1-tossT/.55*.5:0),type:p.sw>0?p.swType:(phase==='serve'&&p.n===server?'serve':'ready'),run:p.run,mv:p.moving?1:0,label:lbl(p)}); };
    const byD=arr=>arr.map(p=>({p,d:proj(p.x,p.w,0,ct)[3]})).sort((a,b)=>b.d-a.d).map(o=>o.p);
    byD(ps.filter(p=>p.team!==ct)).forEach(drawP);
    const ballBehindNet=(ct===0?ball.x>NETX:ball.x<NETX);
    if(ballBehindNet&&ball.h<TH) drawBall(c,ball,ct,null);
    drawTable(c,V,ct);
    for(const f of fx) if(f.k==='dot'){ const q=proj(f.x,f.w,TH,ct); c.strokeStyle='rgba(255,255,255,'+(1-f.t)*.8+')'; c.lineWidth=1.5; c.beginPath(); c.ellipse(q[0],q[1],(3+f.t*14)*q[2],(1+f.t*5)*q[2],0,0,TAU); c.stroke(); }
    if(ballBehindNet&&ball.h>=TH) drawBall(c,ball,ct,phase==='play'?trail:null);
    drawNet(c,ct);
    if(!ballBehindNet) drawBall(c,ball,ct,phase==='play'?trail:null);
    byD(ps.filter(p=>p.team===ct)).forEach(drawP);
    // 雙打：標出下一個該接球的人
    if(dbl&&phase==='play'){ const nh=ps[nextHitter()]; if(nh&&lastTeam!==nh.team){ const q=proj(nh.x,nh.w,0,ct); c.strokeStyle='rgba(255,210,63,'+(.6+.4*Math.sin(t*10))+')'; c.lineWidth=3; c.beginPath(); c.ellipse(q[0],q[1],34*q[2]*(nh.team===ct?SCP:SCF),9*q[2]*(nh.team===ct?SCP:SCF),0,0,TAU); c.stroke(); } }
    for(const f of fx){ const a=1-f.t,q=proj(f.x,f.w||0,f.h||0,ct); if(f.k==='ring'){ c.strokeStyle=f.col; c.globalAlpha=a; c.lineWidth=2.5; c.beginPath(); c.arc(q[0],q[1],(4+f.t*24)*q[2]*.7,0,TAU); c.stroke(); c.globalAlpha=1; }
      else if(f.k==='txt'){ c.globalAlpha=a; c.font='900 20px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=5; c.strokeStyle='#14122b'; c.strokeText(f.txt,q[0],q[1]-f.t*30); c.fillStyle=f.col; c.fillText(f.txt,q[0],q[1]-f.t*30); c.globalAlpha=1; } }
    c.restore();
    // 電子記分板（左上角，才不會擋住對面的選手）
    const lt=ct,rt=1-ct,X0=10,BW2=286; c.fillStyle='rgba(8,10,22,.86)'; rr(c,X0,8,BW2,98,10); c.fill(); c.strokeStyle='rgba(255,210,63,.5)'; c.lineWidth=1.5; rr(c,X0,8,BW2,98,10); c.stroke(); c.textBaseline='middle';
    const row=(tm,y)=>{ const p=ps[tm]; c.fillStyle=p.look.color; c.fillRect(X0+8,y-9,5,18); c.textAlign='left'; c.font='900 15px '+TC; c.fillStyle='#fff'; c.fillText(TN(tm),X0+20,y,124); if(ps[server].team===tm&&phase!=='over'){ c.fillStyle='#ffd23f'; c.beginPath(); c.arc(X0+152,y,5,0,TAU); c.fill(); }
      c.textAlign='center'; if(BO>1){ c.fillStyle='#4a5070'; c.fillRect(X0+166,y-11,32,22); c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText(games[tm],X0+182,y); }
      c.fillStyle='#14162a'; c.fillRect(X0+206,y-12,48,24); c.fillStyle='#ffd23f'; c.font='900 20px '+TC; c.fillText(pts[tm],X0+230,y+1); };
    row(rt,32); row(lt,60);
    c.textAlign='center'; c.font='700 10px '+TC; c.fillStyle='#cfd2e8'; if(BO>1) c.fillText('局',X0+182,15); c.fillText('分',X0+230,15);
    c.textAlign='left'; c.font='700 12px '+TC; c.fillText((dbl?'雙打・':'')+(BO===1?'一局 11 分':BO===2?'三戰兩勝':'五戰三勝')+(BO>1?'・第 '+(gameNo+1)+' 局':'')+'　🟡 發球剩 '+svLeft()+' 球'+(total()>=20&&Math.abs(pts[0]-pts[1])<2?'　Deuce':''),X0+6,96,BW2);
    const tch=document.body.classList.contains('touch'),meServe=two?human(server):server===me;
    if(phase==='serve'&&dbl&&introT<=0){ c.fillStyle='rgba(11,10,28,.7)'; rr(c,W/2-210,380,420,26,13); c.fill(); c.fillStyle='#fff'; c.font='900 14px '+TC; c.textAlign='center'; c.fillText(names[server]+' 發球給 '+names[recv]+'（右半邊打到對方右半邊）',W/2,393,410); }
    if(phase==='serve'&&introT<=0&&meServe&&tossT<=0&&human(server)){ c.fillStyle='rgba(11,10,28,.72)'; rr(c,W/2-230,412,460,30,15); c.fill(); c.fillStyle='#7af0ff'; c.font='900 14px '+TC; c.textAlign='center'; c.fillText((two?names[server]+' 發球：':'')+(tch?'「揮拍」上旋長球、「切球」下旋短球':'空白鍵＝上旋長球、X＝下旋短球（← → 先移動位置）'),W/2,427,440); }
    if(dbl&&phase==='play'){ const nh=nextHitter(); if(human(nh)&&lastTeam!==ps[nh].team&&(two||nh===me)){ c.fillStyle='#ffd23f'; c.font='900 16px '+TC; c.textAlign='center'; c.lineWidth=4; c.strokeStyle='#14122b'; const s2=(two?names[nh]+' ':'')+'輪到你接！'; c.strokeText(s2,W/2,360); c.fillText(s2,W/2,360); } }
    if(msgT>0&&phase!=='serve'){ c.font='900 24px '+TC; c.textAlign='center'; c.lineWidth=6; c.strokeStyle='#14122b'; c.strokeText(msg,W/2,392,780); c.fillStyle='#ffd23f'; c.fillText(msg,W/2,392,780); }
    if(bigT>0){ c.fillStyle='rgba(8,10,22,.8)'; rr(c,W/2-220,150,440,56,16); c.fill(); c.font='900 24px '+TC; c.fillStyle='#fff'; c.textAlign='center'; c.fillText(bigMsg,W/2,178,420); }
    if(introT>0&&solo){ c.font='900 26px '+TC; c.textAlign='center'; c.lineWidth=6; c.strokeStyle='#14122b'; const s2='第 '+(si+1)+' 關　對手：'+ST.foe+(dbl?'隊':''); c.strokeText(s2,W/2,130); c.fillStyle='#ffd23f'; c.fillText(s2,W/2,130); } }
  const lbl=p=>introT>0||(dbl&&phase==='serve'&&(p.n===server||p.n===recv))?(two?(ctrl[p.n]==='key0'?'1P':ctrl[p.n]==='key1'?'2P':''):(p.n===me?'你':dbl&&p.team===myTeam?'隊友':'')):'';
  return {update,draw,destroy(){},_dbg:{ps,ball,pts,games,ctrl,dbl,get msg(){ return msg; },get phase(){ return phase; },get hits(){ return hits; },get server(){ return server; },get recv(){ return recv; },get bnSide(){ return bnSide; },get lastHit(){ return lastHit; },AI,predict}};
}

function demo(c,v,t,col0,col1,foe){ c.drawImage(hallBg(v),0,0); const T=1.6,u=(t%T)/T,dir=u<.5?1:-1,kk=u<.5?u*2:(u-.5)*2,x0=dir>0?TX0-10:TX1+10,x1=dir>0?TX1+10:TX0-10,bx=x0+(x1-x0)*kk,bh=TH+20+Math.abs(Math.sin(kk*Math.PI*1.5))*55*(kk<.67?1:.6),bw=(dir>0?-30:30)*(1-2*kk);
  const fq=proj(TX1+40,20,0,0),nq=proj(TX0-40,-20,0,0),fu=dir>0?clamp((kk-.75)/.4,0,1):0,nu=dir<0?clamp((kk-.75)/.4,0,1):(u<.1?.45+u*5:0);
  drawHuman(c,fq[0],fq[1],fq[2]*SCF,true,{color:col1,hair:1},{u:fu,type:fu?'fh':'ready',label:foe||''}); drawTable(c,VENUES[v],0); drawNet(c,0); drawBall(c,{x:bx,w:bw,h:bh},0); drawHuman(c,nq[0],nq[1],nq[2]*SCP,false,{color:col0,hair:0},{u:nu,type:nu?'fh':'ready'}); }
function stageShow(c,w,h,si,t){ const S=STAGES[si]; c.save(); c.scale(w/W,h/H); demo(c,S.v,t,'#ff5d6d',S.col,S.foe); c.fillStyle='rgba(11,10,28,.72)'; rr(c,W/2-190,8,380,40,14); c.fill(); c.fillStyle='#ffd23f'; c.font='900 21px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(S.name+'　對手 '+S.foe,W/2,28,360); c.restore(); }
function preview(c,w,h,L,t){ L=Object.assign({color:'#ff5d6d',hair:0,rub:'#d82a2a',grip:'#c89a5a'},L||{}); c.save(); c.scale(w/W,h/H); c.drawImage(hallBg(6),0,0); const u=(t%2.2)/1.2; drawHuman(c,W/2,H-10,2.1,true,L,{u:u<1?u:0,type:u<1?'fh':'ready'}); c.restore(); }
function thumb(c,w,h,t){ c.save(); c.scale(w/W,h/H); demo(c,8,t,'#ff5d6d','#4f9dff',''); c.font='900 54px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=10; c.strokeStyle='#14122b'; c.strokeText('桌球對決',W/2,70); c.fillStyle='#ff8a3d'; c.fillText('桌球對決',W/2,70); c.restore(); }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).pingpong={
  name:'桌球對決',tag:'TABLE TENNIS',color:'#ff8a3d',online:true,maxPlayers:4,
  coin:o=>{ const O=o.options||{},pr=o.mode==='2p'&&!o.net||(o.net&&o.net.count===2),d=o.net&&o.net.count>2||(pr?['vs','coop'].includes(O.team):O.fmt==='doubles'); return {verb:'先發球',names:d?['左隊','右隊']:o.net?[o.net.names[0]||'玩家 1',o.net.count>1?(o.net.names[1]||'玩家 2'):'電腦']:o.mode==='2p'?['1P','2P']:['你','電腦']}; },
  desc:'轉播視角的桌球！照正式規則：拋球發球、先彈自己這邊再過網、一局 11 分、10 平要多贏 2 分、每 2 分換發。揮拍自動判斷正手、反手、扣殺，「切球」打下旋短球。十個場館從社區活動中心打到冠軍決賽，單打或雙打，單人 200 關，雙人同一台，連線最多 4 人。',
  goal:'球在自己這邊彈一次之後打回去，要直接落在對面的桌上。對手沒接到、掛網、出界就得分；先拿 11 分（10 平要多贏 2 分）贏一局。雙打：發球要從自己的右半邊斜對角打到對方的右半邊，同隊兩人一定要輪流擊球（腳下有黃圈的人接）。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  options:[{key:'fmt',label:'賽制（單人）',def:'singles',opts:[{id:'singles',label:'單打 1 對 1'},{id:'doubles',label:'雙打：配電腦隊友 2 對 2'}]},
    {key:'team',label:'兩個玩家時（雙人／連線 2 人）',def:'1v1',opts:[{id:'1v1',label:'兩人 1 對 1'},{id:'vs',label:'各配電腦隊友 2 對 2'},{id:'coop',label:'兩人同隊打 2 個電腦'}]},
    {key:'len',label:'比賽長度',def:'g1',opts:[{id:'g1',label:'一局 11 分'},{id:'g3',label:'三戰兩勝'},{id:'g5',label:'五戰三勝'}]},
    {key:'court',label:'場館（雙人／連線）',def:'0',opts:VENUES.map((v,i)=>({id:String(i),label:v.n}))}],
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  stageGoal:i=>{ const S=STAGES[i]; return '第 '+(i+1)+' 關・'+S.name+'：打贏 '+S.foe+'。'+(i<10?'對手動作慢、常失誤，先熟悉發球和正反手。':i<60?'對手開始會左右調動，也會切下旋球。':i<130?'對手拉球又快又低，要早點移動。':'高手對決：扣殺很準、很少失誤。'); },
  stageLocked:i=>i>0&&getRec(i-1)==null,stageBest:i=>{ const v=getRec(i); return v?'✓ '+v.replace(':',' : '):''; },
  hubBest:()=>{ let n=0; for(let i=0;i<LV;i++) if(getRec(i)!=null) n++; return n?'過關 <b>'+n+' / '+LV+'</b>':'尚無紀錄'; },
  help:[['← →','左右移動（↑ ↓ 前後一點）'],['空白鍵','發上旋長球；揮拍自動正手／反手，球很高時扣殺；按著 ← → 會往那邊打'],['X','發下旋短球；切球（下旋短球）']],
  touchHelp:[['方向盤','左右移動'],['揮拍','發球、正反手自動、高球扣殺'],['切球','下旋短球']],
  touch:{left:'dpad',right:[{l:'切球',c:'KeyX'},{l:'揮拍',c:'Space',act:true}]},
  looks:[{key:'rub',label:'膠皮顏色',type:'color',opts:['#d82a2a','#2a5ad8','#2ab85a','#d82aa8','#e8a020','#7a3ad8']},{key:'grip',label:'握把',type:'color',opts:['#c89a5a','#8a5a2a','#2a2a30','#e8d8b8']},
    {key:'color',label:'球衣顏色',type:'color',opts:['#ff5d6d','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#b98cff','#2a2a38']},{key:'hair',label:'髮型',opts:[{id:'0',label:'短髮'},{id:'1',label:'馬尾'},{id:'2',label:'捲毛'}]}],
  best:{label:'過關',fmt:v=>v+' 關',lower:false},
  stageShow,preview,thumb,create,_sim:{stepB,simPath,aimTo,STAGES,TX0,TX1,TW,TH,NETX,proj}};
})();
