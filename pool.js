// 一桿清台：俯視角撞球，可選八號球或九號球。寫實球桌（木框、台呢、皮革球袋）、會滾動的號碼球，打球的是從上方看下去的真人。
// 單人挑戰 10 位電腦對手（各自的球館），雙人同一台輪流，也可以連線：擊球的人送出擊球參數，大家各自模擬，停下後由擊球的人送出結果對齊。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PIX='"Press Start 2P","Noto Sans TC",monospace';
const R=8,TX0=110,TX1=690,TY0=150,TY1=440,MX=(TX0+TX1)/2,MY=(TY0+TY1)/2,SUB=1/240,MAXV=1500;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const shade=(h,f)=>{ const n=parseInt(String(h).slice(1),16); if(isNaN(n)) return h; const ch=v=>clamp(Math.round(v*f),0,255); return 'rgb('+ch((n>>16)&255)+','+ch((n>>8)&255)+','+ch(n&255)+')'; };
const BCOL=['#f6f2e6','#f2c418','#1e4fb8','#d8261c','#5a2a8a','#f07a18','#1e8a3a','#7a1a1a','#141414'];
const ballCol=n=>BCOL[n>8?n-8:n];
// 對手（關卡）：每位有自己的球館、台呢顏色和實力
const STAGES=[
  {name:'阿明',place:'社區撞球間',stars:1,skill:.3,cloth:'#1f7a3e',room:'#3a2a22',look:{skin:'#e0ac80',hair:'#1a1410',shirt:'#3d8bff'}},
  {name:'小芳',place:'大學撞球社',stars:1,skill:.4,cloth:'#1f6aa8',room:'#2a3040',look:{skin:'#f2c9a0',hair:'#3a2416',shirt:'#ff7eb6',long:1}},
  {name:'阿伯',place:'老街撞球店',stars:2,skill:.5,cloth:'#2a7a3a',room:'#4a3a2a',look:{skin:'#c68a5e',hair:'#d8d0c8',shirt:'#8a6a4a'}},
  {name:'黑面',place:'夜市撞球攤',stars:2,skill:.58,cloth:'#8a1e2a',room:'#2a1a28',look:{skin:'#8d5a3a',hair:'#1a1410',shirt:'#e23b3b'}},
  {name:'Lisa',place:'運動酒吧',stars:3,skill:.66,cloth:'#1e5a8a',room:'#20262e',look:{skin:'#f6d6b8',hair:'#c8a060',shirt:'#1e1e24',long:1}},
  {name:'刀疤',place:'地下球館',stars:3,skill:.72,cloth:'#3a3a40',room:'#141418',look:{skin:'#c68a5e',hair:'#1a1410',shirt:'#5a5a5a',bald:1}},
  {name:'林教練',place:'撞球學院',stars:4,skill:.8,cloth:'#1f7a3e',room:'#2a3a30',look:{skin:'#e0ac80',hair:'#3a2416',shirt:'#ffffff',vest:'#1e1e24'}},
  {name:'美琪',place:'飯店俱樂部',stars:4,skill:.86,cloth:'#5a2a6a',room:'#2a1a2a',look:{skin:'#f2c9a0',hair:'#1a1410',shirt:'#c0392b',long:1,vest:'#1e1e24'}},
  {name:'撞球王子',place:'職業聯賽',stars:5,skill:.92,cloth:'#1a5aa0',room:'#101830',look:{skin:'#e0ac80',hair:'#1a1410',shirt:'#ffffff',vest:'#2a2a6a'}},
  {name:'無敵大師',place:'世界錦標賽',stars:5,skill:.97,cloth:'#1a6a8a',room:'#0c1018',look:{skin:'#e0ac80',hair:'#d8d0c8',shirt:'#ffffff',vest:'#141414'}}];
// 袋口與台邊（含袋口兩側斜邊）
const PK=[[TX0-5,TY0-5,15],[MX,TY0-13,14],[TX1+5,TY0-5,15],[TX0-5,TY1+5,15],[MX,TY1+13,14],[TX1+5,TY1+5,15]];
const SEG=(()=>{ const s=[],C=17,S=15; const add=(a,b,cc,d)=>s.push([a,b,cc,d]);
  add(TX0+C,TY0,MX-S,TY0); add(MX+S,TY0,TX1-C,TY0); add(TX0+C,TY1,MX-S,TY1); add(MX+S,TY1,TX1-C,TY1); add(TX0,TY0+C,TX0,TY1-C); add(TX1,TY0+C,TX1,TY1-C);
  // 斜邊
  add(TX0+C,TY0,TX0+C-11,TY0-11); add(TX0,TY0+C,TX0-11,TY0+C-11); add(TX1-C,TY0,TX1-C+11,TY0-11); add(TX1,TY0+C,TX1+11,TY0+C-11);
  add(TX0+C,TY1,TX0+C-11,TY1+11); add(TX0,TY1-C,TX0-11,TY1-C+11); add(TX1-C,TY1,TX1-C+11,TY1+11); add(TX1,TY1-C,TX1+11,TY1-C+11);
  add(MX-S,TY0,MX-S+4,TY0-12); add(MX+S,TY0,MX+S-4,TY0-12); add(MX-S,TY1,MX-S+4,TY1+12); add(MX+S,TY1,MX+S-4,TY1+12); return s; })();
const HEAD=TX0+(TX1-TX0)*.25,FOOT=[TX0+(TX1-TX0)*.75,MY];

/* ---------- 物理 ---------- */
function rack(rule){ const B=[{n:0,x:HEAD,y:MY}],fx=FOOT[0],fy=FOOT[1],d=R*2+.2,dx=d*Math.cos(Math.PI/6);
  if(rule==='9'){ const pos=[[0,0],[1,-.5],[1,.5],[2,-1],[2,0],[2,1],[3,-.5],[3,.5],[4,0]],ord=[1,2,3,4,9,5,6,7,8]; pos.forEach((p,i)=>B.push({n:ord[i],x:fx+p[0]*dx,y:fy+p[1]*d})); }
  else { const pos=[]; for(let r=0;r<5;r++) for(let k=0;k<=r;k++) pos.push([r,k-r/2]); const ord=[1,9,14,2,8,10,15,3,6,4,11,7,13,5,12]; pos.forEach((p,i)=>B.push({n:ord[i],x:fx+p[0]*dx,y:fy+p[1]*d})); }
  B.forEach(b=>{ b.vx=b.vy=0; b.in=false; b.ru=Math.random()*6; b.rv=Math.random()*6; }); return B; }
function stepPhys(B,S,dt){
  for(const b of B){ if(b.in) continue; const sp=Math.hypot(b.vx,b.vy); if(sp>0){ const f=Math.max(0,sp-(62+.32*sp)*dt)/sp; b.vx*=f; b.vy*=f; if(sp<2.5){ b.vx=b.vy=0; } }
    b.x+=b.vx*dt; b.y+=b.vy*dt; b.ru+=b.vx*dt/R; b.rv+=b.vy*dt/R; }
  for(let i=0;i<B.length;i++){ const a=B[i]; if(a.in) continue; for(let j=i+1;j<B.length;j++){ const b=B[j]; if(b.in) continue; const dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy; if(d2>=4*R*R||d2<1e-9) continue;
    const d=Math.sqrt(d2),nx=dx/d,ny=dy/d,ov=(2*R-d)/2; a.x-=nx*ov; a.y-=ny*ov; b.x+=nx*ov; b.y+=ny*ov; const vn=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny; if(vn<=0) continue;
    const imp=vn*.975; const cueSp=a.n===0?Math.hypot(a.vx,a.vy):0; a.vx-=imp*nx; a.vy-=imp*ny; b.vx+=imp*nx; b.vy+=imp*ny; S.clicks=(S.clicks||0)+1; S.hard=Math.max(S.hard||0,vn);
    if(a.n===0&&S.first==null){ S.first=b.n; if(S.spin){ const k=S.spin*cueSp*.55; a.vx+=S.dx*k; a.vy+=S.dy*k; } }
    else if(b.n===0&&S.first==null){ S.first=a.n; } } }
  for(const b of B){ if(b.in) continue;
    for(const s of SEG){ const ex=s[2]-s[0],ey=s[3]-s[1],L2=ex*ex+ey*ey,u=clamp(((b.x-s[0])*ex+(b.y-s[1])*ey)/L2,0,1),qx=s[0]+ex*u,qy=s[1]+ey*u,dx=b.x-qx,dy=b.y-qy,d=Math.hypot(dx,dy);
      if(d<R&&d>1e-9){ const nx=dx/d,ny=dy/d; b.x=qx+nx*R; b.y=qy+ny*R; const vn=b.vx*nx+b.vy*ny; if(vn<0){ b.vx-=1.8*vn*nx; b.vy-=1.8*vn*ny; b.vx*=.97; b.vy*=.97; if(S.first!=null) S.rail=true; S.cush=(S.cush||0)+1; } } }
    for(const p of PK){ if(Math.hypot(b.x-p[0],b.y-p[1])<p[2]-2){ b.in=true; b.vx=b.vy=0; b.px=p[0]; b.py=p[1]; S.pots.push(b.n); break; } }
    if(!b.in&&(b.x<TX0-22||b.x>TX1+22||b.y<TY0-22||b.y>TY1+22)){ b.in=true; b.vx=b.vy=0; S.pots.push(b.n); } } }
const moving=B=>B.some(b=>!b.in&&(b.vx||b.vy));
function newShot(B,ang,pow,spin){ const c=B[0],dx=Math.cos(ang),dy=Math.sin(ang); c.vx=dx*pow*MAXV; c.vy=dy*pow*MAXV; return {first:null,pots:[],rail:false,spin,dx,dy}; }
function simulate(B0,ang,pow,spin){ const B=B0.map(b=>Object.assign({},b)),S=newShot(B,ang,pow,spin); for(let i=0;i<240*15&&moving(B);i++) stepPhys(B,S,SUB); return {B,S}; }

/* ---------- 規則 ---------- */
const isSolid=n=>n>=1&&n<=7,isStripe=n=>n>=9&&n<=15;
function legalTargets(st,p){ const on=st.B.filter(b=>!b.in&&b.n);
  if(st.rule==='9'){ const lo=Math.min(...on.map(b=>b.n)); return [lo]; }
  const g=st.grp[p]; if(!g) return on.filter(b=>b.n!==8).map(b=>b.n);
  const mine=on.filter(b=>g==='solid'?isSolid(b.n):isStripe(b.n)).map(b=>b.n); return mine.length?mine:[8]; }
// 判定一桿的結果：回傳 {foul,cont,win,lose,msg,respot:[...],assign}
function judge(st,p,S,before){ const pots=S.pots,cue=pots.includes(0),first=S.first,legal=legalTargets(Object.assign({},st,{B:before}),p),r={foul:false,cont:false,win:false,lose:false,msg:'',respot:[]};
  if(st.rule==='9'){ const nine=pots.includes(9);
    if(cue) { r.foul=true; r.msg='母球落袋，犯規'; } else if(first==null){ r.foul=true; r.msg='沒有打到球，犯規'; } else if(first!==legal[0]){ r.foul=true; r.msg='要先打到 '+legal[0]+' 號球，犯規'; }
    if(nine){ if(!r.foul){ r.win=true; r.msg='9 號球進袋！'; return r; } r.respot.push(9); }
    r.cont=!r.foul&&pots.some(n=>n&&n!==9); if(!r.foul&&!r.cont) r.msg=''; return r; }
  const eight=pots.includes(8),g=st.grp[p];
  if(cue){ r.foul=true; r.msg='母球落袋，犯規'; } else if(first==null){ r.foul=true; r.msg='沒有打到球，犯規'; }
  else if(!st.brk&&!legal.includes(first)){ r.foul=true; r.msg=first===8?'不能先打 8 號球，犯規':'先打到對方的球，犯規'; }
  if(eight){ if(st.brk){ r.respot.push(8); r.msg='開球打進 8 號球，放回置球點'; }
    else { const cleared=legal.length===1&&legal[0]===8; if(cleared&&!r.foul){ r.win=true; r.msg='8 號球進袋，贏了！'; } else { r.lose=true; r.msg=r.foul?'打進 8 號球時犯規，輸了':'太早打進 8 號球，輸了'; } return r; } }
  const own=pots.filter(n=>n&&n!==8);
  if(!r.foul&&!g&&!st.brk&&own.length){ const s=own.filter(isSolid).length,t=own.filter(isStripe).length,fst=own[0]; r.assign=s&&!t?'solid':t&&!s?'stripe':isSolid(fst)?'solid':'stripe'; }
  const grp=r.assign||g; r.cont=!r.foul&&(grp?own.some(n=>grp==='solid'?isSolid(n):isStripe(n)):own.length>0||st.brk&&own.length>0);
  return r; }

/* ---------- 繪圖 ---------- */
function drawRoom(c,ST,t){ const g=c.createRadialGradient(W/2,H/2,60,W/2,H/2,520); g.addColorStop(0,shade(ST.room,1.4)); g.addColorStop(1,shade(ST.room,.6)); c.fillStyle=g; c.fillRect(0,0,W,H);
  c.strokeStyle='rgba(0,0,0,.18)'; c.lineWidth=1; for(let x=-H;x<W;x+=26){ c.beginPath(); c.moveTo(x,0); c.lineTo(x+H,H); c.stroke(); } }
function drawTable(c,cloth,t){
  // 桌腳陰影、木框
  c.fillStyle='rgba(0,0,0,.45)'; rr(c,TX0-46,TY0-40,TX1-TX0+100,TY1-TY0+96,22); c.fill();
  const wg=c.createLinearGradient(0,TY0-44,0,TY1+44); wg.addColorStop(0,'#7a4424'); wg.addColorStop(.5,'#5a2e16'); wg.addColorStop(1,'#3e1e0c'); c.fillStyle=wg; rr(c,TX0-44,TY0-44,TX1-TX0+88,TY1-TY0+88,20); c.fill();
  c.strokeStyle='rgba(255,220,180,.12)'; c.lineWidth=1; for(let i=0;i<14;i++){ c.beginPath(); c.moveTo(TX0-40,TY0-40+i*2.6); c.bezierCurveTo(TX0+150,TY0-44+i*2.6+3,TX1-150,TY0-38+i*2.6-3,TX1+40,TY0-40+i*2.6); c.stroke(); c.beginPath(); c.moveTo(TX0-40,TY1+8+i*2.4); c.bezierCurveTo(TX0+150,TY1+6+i*2.4+3,TX1-150,TY1+10+i*2.4-3,TX1+40,TY1+8+i*2.4); c.stroke(); }
  c.strokeStyle='rgba(255,230,200,.25)'; c.lineWidth=2; rr(c,TX0-43,TY0-43,TX1-TX0+86,TY1-TY0+86,19); c.stroke();
  // 台呢（含燈光）
  const cg=c.createRadialGradient(MX,MY,40,MX,MY,420); cg.addColorStop(0,shade(cloth,1.25)); cg.addColorStop(1,shade(cloth,.72)); c.fillStyle=cg; c.fillRect(TX0-20,TY0-20,TX1-TX0+40,TY1-TY0+40);
  c.fillStyle='rgba(255,255,255,.03)'; for(let i=0;i<500;i++) c.fillRect(TX0-20+((i*137)%(TX1-TX0+40)),TY0-20+((i*71)%(TY1-TY0+40)),1,1);
  // 台邊橡膠（比台呢深一點、有斜面）
  c.fillStyle=shade(cloth,.6); const cush=(pts)=>{ c.beginPath(); pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])); c.closePath(); c.fill(); };
  const C=17,S=15,Z=20; cush([[TX0+C-11,TY0-Z+9],[MX-S+4,TY0-Z+9],[MX-S,TY0],[TX0+C,TY0]]); cush([[MX+S-4,TY0-Z+9],[TX1-C+11,TY0-Z+9],[TX1-C,TY0],[MX+S,TY0]]);
  cush([[TX0+C-11,TY1+Z-9],[MX-S+4,TY1+Z-9],[MX-S,TY1],[TX0+C,TY1]]); cush([[MX+S-4,TY1+Z-9],[TX1-C+11,TY1+Z-9],[TX1-C,TY1],[MX+S,TY1]]);
  cush([[TX0-Z+9,TY0+C-11],[TX0-Z+9,TY1-C+11],[TX0,TY1-C],[TX0,TY0+C]]); cush([[TX1+Z-9,TY0+C-11],[TX1+Z-9,TY1-C+11],[TX1,TY1-C],[TX1,TY0+C]]);
  c.strokeStyle='rgba(255,255,255,.12)'; c.lineWidth=1; c.strokeRect(TX0,TY0,TX1-TX0,TY1-TY0);
  // 袋口
  for(const p of PK){ c.fillStyle='#2a1a10'; c.beginPath(); c.arc(p[0],p[1],p[2]+5,0,7); c.fill(); const g=c.createRadialGradient(p[0],p[1],2,p[0],p[1],p[2]); g.addColorStop(0,'#000'); g.addColorStop(1,'#1a1410'); c.fillStyle=g; c.beginPath(); c.arc(p[0],p[1],p[2],0,7); c.fill(); c.strokeStyle='rgba(255,255,255,.15)'; c.beginPath(); c.arc(p[0],p[1],p[2]+4,Math.PI*1.1,Math.PI*1.6); c.stroke(); }
  // 台邊菱形標記、開球線、置球點
  c.fillStyle='#f4ecd8'; for(let i=1;i<8;i++){ if(i===4) continue; const x=TX0+(TX1-TX0)*i/8; for(const y of [TY0-31,TY1+31]){ c.beginPath(); c.moveTo(x,y-3); c.lineTo(x+2.5,y); c.lineTo(x,y+3); c.lineTo(x-2.5,y); c.fill(); } }
  for(let i=1;i<4;i++){ const y=TY0+(TY1-TY0)*i/4; for(const x of [TX0-31,TX1+31]){ c.beginPath(); c.moveTo(x,y-3); c.lineTo(x+2.5,y); c.lineTo(x,y+3); c.lineTo(x-2.5,y); c.fill(); } }
  c.strokeStyle='rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(HEAD,TY0); c.lineTo(HEAD,TY1); c.stroke(); c.fillStyle='rgba(255,255,255,.4)'; c.beginPath(); c.arc(FOOT[0],FOOT[1],1.8,0,7); c.fill(); c.beginPath(); c.arc(HEAD,MY,1.8,0,7); c.fill(); }
function drawBall(c,b,x,y,sc){ x=x==null?b.x:x; y=y==null?b.y:y; sc=sc||1; const r=R*sc,n=b.n,col=ballCol(n);
  c.fillStyle='rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x+2.5*sc,y+3*sc,r,r*.85,0,0,7); c.fill();
  c.save(); c.beginPath(); c.arc(x,y,r,0,7); c.clip();
  c.fillStyle=n>8||n===0?'#f6f2e6':col; c.fillRect(x-r,y-r,r*2,r*2);
  const ox=Math.sin(b.ru||0)*r*.55,oy=Math.sin(b.rv||0)*r*.55,vis=Math.cos(b.ru||0)*Math.cos(b.rv||0);
  if(n>8){ c.fillStyle=col; c.save(); c.translate(x+ox*.4,y+oy*.4); c.rotate(Math.atan2(Math.cos(b.rv||0),Math.cos(b.ru||0))*.4); c.fillRect(-r*1.2,-r*.55,r*2.4,r*1.1); c.restore(); }
  if(n>0&&vis>-.2){ const a=clamp(vis+.4,0,1); c.globalAlpha=a; c.fillStyle='#f6f2e6'; c.beginPath(); c.ellipse(x+ox,y+oy,r*.48,r*.48*(.6+.4*Math.abs(Math.cos(b.rv||0))),0,0,7); c.fill(); c.fillStyle='#141414'; c.font='900 '+Math.round(r*.78)+'px Arial,sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(n),x+ox,y+oy+.5); c.globalAlpha=1; }
  if(n===0){ c.fillStyle='rgba(200,30,30,.5)'; c.beginPath(); c.arc(x+ox,y+oy,r*.18,0,7); c.fill(); }
  const g=c.createRadialGradient(x-r*.4,y-r*.45,r*.05,x,y,r*1.05); g.addColorStop(0,'rgba(255,255,255,.85)'); g.addColorStop(.25,'rgba(255,255,255,.12)'); g.addColorStop(.7,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.45)'); c.fillStyle=g; c.fillRect(x-r,y-r,r*2,r*2);
  c.restore(); }
// 球桿：從母球後方往外延伸，pull＝往後拉的距離
function drawCue(c,cx,cy,ang,pull){ const dx=Math.cos(ang),dy=Math.sin(ang),s0=R+4+pull,L=300,tx=cx-dx*s0,ty=cy-dy*s0,bx=cx-dx*(s0+L),by=cy-dy*(s0+L),px=-dy,py=dx;
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.moveTo(tx+6+px*1.5,ty+8+py*1.5); c.lineTo(bx+6+px*5,by+8+py*5); c.lineTo(bx+6-px*5,by+8-py*5); c.lineTo(tx+6-px*1.5,ty+8-py*1.5); c.fill();
  const seg=(u0,u1,w0,w1,col)=>{ const ax=cx-dx*(s0+L*u0),ay=cy-dy*(s0+L*u0),ex=cx-dx*(s0+L*u1),ey=cy-dy*(s0+L*u1); const g=c.createLinearGradient(ax+px*w0,ay+py*w0,ax-px*w0,ay-py*w0); g.addColorStop(0,shade(col,.7)); g.addColorStop(.4,shade(col,1.3)); g.addColorStop(1,shade(col,.6)); c.fillStyle=g; c.beginPath(); c.moveTo(ax+px*w0,ay+py*w0); c.lineTo(ex+px*w1,ey+py*w1); c.lineTo(ex-px*w1,ey-py*w1); c.lineTo(ax-px*w0,ay-py*w0); c.closePath(); c.fill(); };
  seg(0,.012,1.5,1.5,'#3a6ab8'); seg(.012,.04,1.6,1.7,'#f4f0e4'); seg(.04,.62,1.7,3.2,'#d8b07a'); seg(.62,.66,3.2,3.3,'#1e1e24'); seg(.66,.86,3.3,3.9,'#2a1a2a'); seg(.86,.995,3.9,4.3,'#5a2a14'); seg(.995,1,4.3,4.3,'#141414'); }
// 從上方看的真人：肩膀、頭髮、伸出去的雙手握桿
function drawShooter(c,cx,cy,ang,pull,L){ const dx=Math.cos(ang),dy=Math.sin(ang),px=-dy,py=dx,s0=R+4+pull,at=(d,o)=>[cx-dx*d+px*o,cy-dy*d+py*o];
  // 趴在球桿上：頭在桿子正上方，左手架橋、右手在後面握桿
  const bridge=at(R+30,0),grip=at(s0+232,0),head=at(s0+96,2),torso=at(s0+128,9),shL=at(s0+118,24),shR=at(s0+136,-8),elR=at(s0+186,-14);
  c.save();
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(torso[0]+9,torso[1]+11,30,19,ang,0,7); c.fill();
  const arm=(pts,col,w)=>{ c.strokeStyle=col; c.lineWidth=w; c.lineCap='round'; c.lineJoin='round'; c.beginPath(); pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1])); c.stroke(); };
  const sleeve=L.shirt,elL=[lerp(shL[0],bridge[0],.5)+px*6,lerp(shL[1],bridge[1],.5)+py*6];
  arm([shL,elL],sleeve,9); arm([elL,bridge],L.skin,6.5);
  c.fillStyle=L.skin; c.beginPath(); c.ellipse(bridge[0],bridge[1],7,5,ang,0,7); c.fill(); c.fillStyle=shade(L.skin,.85); for(let k=-1;k<=1;k++){ c.beginPath(); c.arc(bridge[0]-dx*5+px*(k*4+4),bridge[1]-dy*5+py*(k*4+4),2,0,7); c.fill(); }
  arm([shR,elR],sleeve,9); arm([elR,grip],L.skin,6.5); c.fillStyle=L.skin; c.beginPath(); c.arc(grip[0],grip[1],4.6,0,7); c.fill();
  // 上半身（往前趴，沿著球桿方向）
  c.save(); c.translate(torso[0],torso[1]); c.rotate(ang); const tc=L.vest||L.shirt,g=c.createLinearGradient(0,-20,0,20); g.addColorStop(0,shade(tc,.7)); g.addColorStop(.5,tc); g.addColorStop(1,shade(tc,.65)); c.fillStyle=g; c.beginPath(); c.ellipse(-6,0,30,20,0,0,7); c.fill();
  if(L.vest){ c.fillStyle=L.shirt; c.beginPath(); c.ellipse(14,0,8,6,0,0,7); c.fill(); }
  c.fillStyle='rgba(0,0,0,.15)'; c.fillRect(-34,-1,26,2); c.restore();
  // 頭（從上面看：頭頂和頭髮，下巴貼近球桿）
  c.save(); c.translate(head[0],head[1]); c.rotate(ang); if(L.long){ c.fillStyle=L.hair; c.beginPath(); c.ellipse(-12,0,9,8,0,0,7); c.fill(); }
  c.fillStyle=L.skin; c.beginPath(); c.ellipse(1,0,9,8,0,0,7); c.fill(); c.beginPath(); c.ellipse(0,-8.4,2.4,1.6,0,0,7); c.ellipse(0,8.4,2.4,1.6,0,0,7); c.fill();
  c.fillStyle=L.bald?shade(L.skin,.9):L.hair; c.beginPath(); c.ellipse(-2,0,L.bald?6:8.6,L.bald?6:8.2,0,0,7); c.fill(); if(!L.bald){ c.fillStyle='rgba(255,255,255,.14)'; c.beginPath(); c.ellipse(-4,-3,3.5,2.4,0,0,7); c.fill(); } else { c.fillStyle='rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(-3,-2,2.5,1.6,0,0,7); c.fill(); }
  c.restore(); c.restore(); }
// 計分列的頭像（正面半身）
function drawBust(c,x,y,s,L,t){ c.save(); c.translate(x,y); c.scale(s,s);
  const g=c.createLinearGradient(-20,0,20,0); g.addColorStop(0,shade(L.vest||L.shirt,.7)); g.addColorStop(.5,L.vest||L.shirt); g.addColorStop(1,shade(L.vest||L.shirt,.7)); c.fillStyle=g; c.beginPath(); c.moveTo(-20,20); c.quadraticCurveTo(-19,4,-8,2); c.lineTo(8,2); c.quadraticCurveTo(19,4,20,20); c.closePath(); c.fill();
  if(L.vest){ c.fillStyle=L.shirt; c.beginPath(); c.moveTo(-6,2); c.lineTo(0,14); c.lineTo(6,2); c.fill(); }
  c.fillStyle=L.skin; c.fillRect(-4,-4,8,7);
  if(L.long){ c.fillStyle=L.hair; c.beginPath(); c.ellipse(0,-6,11,14,0,0,7); c.fill(); }
  c.fillStyle=L.skin; c.beginPath(); c.ellipse(0,-12,8,10,0,0,7); c.fill(); c.beginPath(); c.ellipse(-8,-11,1.6,2.6,0,0,7); c.ellipse(8,-11,1.6,2.6,0,0,7); c.fill();
  const bl=Math.sin(t*1.3)>.97?.3:1; c.fillStyle='#1a1418'; c.beginPath(); c.ellipse(-3.2,-12,1.2,1.3*bl,0,0,7); c.ellipse(3.2,-12,1.2,1.3*bl,0,0,7); c.fill();
  c.strokeStyle='#1a1418'; c.lineWidth=.9; c.beginPath(); c.moveTo(-5,-15); c.lineTo(-1.5,-15.4); c.moveTo(5,-15); c.lineTo(1.5,-15.4); c.stroke();
  c.strokeStyle=shade(L.skin,.65); c.beginPath(); c.moveTo(0,-11); c.lineTo(-.8,-8); c.lineTo(.6,-7.6); c.stroke(); c.strokeStyle='#8a3a3a'; c.beginPath(); c.moveTo(-2.4,-5.2); c.quadraticCurveTo(0,-4.3,2.4,-5.2); c.stroke();
  c.fillStyle=L.bald?'rgba(0,0,0,0)':L.hair; if(!L.bald){ c.beginPath(); c.ellipse(0,-17,8.6,6,0,Math.PI,0); c.fill(); c.beginPath(); c.ellipse(-6.5,-15,2.6,4,.2,0,7); c.ellipse(6.5,-15,2.6,4,-.2,0,7); c.fill(); }
  c.restore(); }

/* ---------- 遊戲 ---------- */
function create(env,opts){
  const si=clamp(opts.stage|0,0,STAGES.length-1),ST=STAGES[si],OP=opts.options||{},rule=OP.rule==='9'?'9':'8',raceTo=+(OP.race||1)||1,net=opts.net,local2=!net&&opts.mode==='2p',vsAI=!net&&!local2;
  const cloth=OP.cloth&&OP.cloth!=='stage'?OP.cloth:ST.cloth,me=net?net.me:0;
  const {ctx:c,canvas}=env.canvas2d(W,H),sfx=n=>env.sfx(n),L0=opts.look||{};
  const myLook={skin:['#f2c9a0','#e0ac80','#c68a5e','#8d5a3a'][+(L0.skin||1)]||'#e0ac80',hair:L0.hair||'#1a1410',shirt:L0.shirt||'#3d8bff',vest:L0.vest&&L0.vest!=='none'?L0.vest:null,long:L0.style==='long',bald:L0.style==='bald'};
  const lookOf=i=>{ if(vsAI) return i===0?myLook:ST.look; if(net){ const l=(net.looks&&net.looks[i])||{}; return {skin:['#f2c9a0','#e0ac80','#c68a5e','#8d5a3a'][+(l.skin||1)]||'#e0ac80',hair:l.hair||'#1a1410',shirt:l.shirt||(i?'#e23b3b':'#3d8bff'),vest:l.vest&&l.vest!=='none'?l.vest:null,long:l.style==='long',bald:l.style==='bald'}; } return i===0?myLook:{skin:'#c68a5e',hair:'#3a2416',shirt:'#e23b3b'}; };
  const PL=[0,1].map(i=>({name:vsAI?(i?ST.name:(opts.name||'你')):net?((net.names&&net.names[i])||'玩家 '+(i+1)):(i?'2P':'1P'),L:lookOf(i),ai:vsAI&&i===1,wins:0}));
  let st={rule,B:rack(rule),grp:[null,null],brk:true},turn=opts.first===1?1:0,breaker=turn,phase='intro',phT=2.2,ang=0,pow=0,spin=0,charging=false,mt=0,shotS=null,before=null,banner='',banT=0,t=0,fouls=[0,0],ended=false,waitRes=false,aiT=0,aiPlan=null,pull=0,strikeT=0,potFx=[],inHand=true,kitchen=true,winner=-1,pending=null,arrowT=3;
  const local=i=>net?i===me:!PL[i].ai;
  function say(s,d){ banner=s; banT=d||2; }
  function cue(){ return st.B[0]; }
  function aimDefault(){ const tg=legalTargets(st,turn).map(n=>st.B.find(b=>b.n===n)).filter(Boolean); const c0=cue(); if(tg.length){ const b=tg.reduce((a,b)=>Math.hypot(b.x-c0.x,b.y-c0.y)<Math.hypot(a.x-c0.x,a.y-c0.y)?b:a); ang=Math.atan2(b.y-c0.y,b.x-c0.x); } }
  function startRack(){ st={rule,B:rack(rule),grp:[null,null],brk:true}; turn=breaker; inHand=true; kitchen=true; phase='place'; fouls=[0,0]; say(PL[turn].name+' 開球',1.6); ang=0; pow=0; spin=0; aiPlan=null; aiT=0; }
  function freeSpot(x,y){ for(let k=0;k<60;k++){ const xx=x+k*(R*2+1)*(k%2?1:-1)*.5; if(!st.B.some(b=>!b.in&&Math.hypot(b.x-xx,b.y-y)<R*2+.5)) return [xx,y]; } return [x,y]; }
  function validCue(x,y){ if(x<TX0+R||x>TX1-R||y<TY0+R||y>TY1-R) return false; if(kitchen&&x>HEAD) return false; return !st.B.some(b=>b.n&&!b.in&&Math.hypot(b.x-x,b.y-y)<R*2+.5); }
  function take(a,p,s,cx,cy){ const c0=cue(); c0.in=false; c0.x=cx; c0.y=cy; before=st.B.map(b=>Object.assign({},b)); shotS=newShot(st.B,a,p,s); phase='roll'; sfx(p>.55?'boom':'click'); strikeT=.25; pull=0; charging=false; ang=a; }
  function shoot(){ if(net) net.send({sh:[turn,ang,pow,spin,cue().x,cue().y]}); take(ang,pow,spin,cue().x,cue().y); pow=0; }
  function afterShot(){ const S=shotS,p=turn,r=judge(st,p,S,before); shotS=null;
    for(const n of r.respot){ const b=st.B.find(x=>x.n===n); const sp=freeSpot(FOOT[0],FOOT[1]); b.in=false; b.x=sp[0]; b.y=sp[1]; b.vx=b.vy=0; }
    if(r.assign){ st.grp[p]=r.assign; st.grp[1-p]=r.assign==='solid'?'stripe':'solid'; say(PL[p].name+' 打'+(r.assign==='solid'?'全色球（1-7）':'花色球（9-15）'),2); }
    const wasBrk=st.brk; st.brk=false; kitchen=false;
    if(r.win||r.lose){ const w=r.win?p:1-p; say(r.msg,2.2); rackOver(w); return; }
    if(r.foul){ fouls[p]++; say(r.msg+(rule==='9'?'':'')+'，'+PL[1-p].name+' 自由球',2); sfx('hurt'); turn=1-p; inHand=true; const c0=cue(); if(c0.in){ c0.in=false; const sp=freeSpot(HEAD,MY); c0.x=sp[0]; c0.y=sp[1]; } phase='place'; }
    else if(r.cont){ fouls[p]=0; if(!r.assign) say(wasBrk?'開球進球，繼續！':'進球！繼續',1.2); sfx('score'); phase='aim'; inHand=false; }
    else { fouls[p]=0; if(r.msg) say(r.msg,1.6); else say('換 '+PL[1-p].name,1.1); turn=1-p; phase='aim'; inHand=false; }
    if(rule==='9'&&r.foul&&fouls[p]>=3){ say(PL[p].name+' 連續三次犯規，輸掉這局',2.2); rackOver(1-p); return; }
    aiPlan=null; aiT=.8; if(phase==='aim') aimDefault(); }
  function rackOver(w){ PL[w].wins++; sfx(local(w)||local2?'win':'lose'); if(PL[w].wins>=raceTo){ winner=w; phase='over'; phT=2.4; } else { phase='between'; phT=2.6; breaker=1-breaker; } }
  // 電腦：找能打進的球（鬼球瞄準法），用模擬確認，再依實力加誤差
  function clearPath(x0,y0,x1,y1,skip){ const dx=x1-x0,dy=y1-y0,L2=dx*dx+dy*dy||1; for(const b of st.B){ if(b.in||skip.includes(b.n)) continue; const u=clamp(((b.x-x0)*dx+(b.y-y0)*dy)/L2,0,1),qx=x0+dx*u,qy=y0+dy*u; if(Math.hypot(b.x-qx,b.y-qy)<R*2-.5) return false; } return true; }
  function shotCands(cx,cy){ const out=[],legal=legalTargets(st,turn);
    for(const n of (rule==='9'?st.B.filter(b=>!b.in&&b.n).map(b=>b.n):legal)){ const b=st.B.find(x=>x.n===n);
      for(const p of PK){ const px=p[0]-b.x,py=p[1]-b.y,pd=Math.hypot(px,py),ux=px/pd,uy=py/pd,gx=b.x-ux*R*2,gy=b.y-uy*R*2,cdx=gx-cx,cdy=gy-cy,cd=Math.hypot(cdx,cdy); if(cd<1) continue;
        const cos=(cdx*ux+cdy*uy)/cd; if(cos<.3) continue; if(rule==='9'&&n!==legal[0]) continue;
        if(!clearPath(cx,cy,gx,gy,[0,n])||!clearPath(b.x,b.y,p[0],p[1],[n])) continue;
        out.push({n,a:Math.atan2(cdy,cdx),score:cos*cos/(1+cd/500+pd/450),need:Math.min(1,.18+(cd+pd/Math.max(.35,cos))/1500)}); } }
    // 九號球：打低號球去撞進 9 號（組合球）
    if(rule==='9'){ const nine=st.B.find(b=>b.n===9&&!b.in),lo=st.B.find(b=>b.n===legal[0]); if(nine&&lo&&lo.n!==9) for(const p of PK){ const px=p[0]-nine.x,py=p[1]-nine.y,pd=Math.hypot(px,py); const g9x=nine.x-px/pd*R*2,g9y=nine.y-py/pd*R*2,lx=g9x-lo.x,ly=g9y-lo.y,ld=Math.hypot(lx,ly),gx=lo.x-lx/ld*R*2,gy=lo.y-ly/ld*R*2,cdx=gx-cx,cdy=gy-cy,cd=Math.hypot(cdx,cdy); const cos=(cdx*lx+cdy*ly)/(cd*ld),cos2=(lx*px+ly*py)/(ld*pd); if(cos>.5&&cos2>.6&&clearPath(cx,cy,gx,gy,[0,lo.n])&&clearPath(lo.x,lo.y,g9x,g9y,[lo.n,9])&&clearPath(nine.x,nine.y,p[0],p[1],[9])) out.push({n:9,a:Math.atan2(cdy,cdx),score:cos*cos2*.5/(1+cd/500+pd/450),need:Math.min(1,.3+(cd+ld+pd)/1300)}); } }
    return out.sort((a,b)=>b.score-a.score); }
  function evalShot(a,p,s){ const {B,S}=simulate(st.B,a,p,s),r=judge(st,turn,S,st.B); let v=r.win?100:r.lose?-100:r.foul?-30:r.cont?20:0; if(r.cont||r.win){ const c0=B[0]; v+=Math.max(0,8-Math.min(...PK.map(k=>Math.hypot(k[0]-c0.x,k[1]-c0.y)))/30*0); }
    if(!r.cont&&!r.foul){ // 防守：讓母球離目標遠一點
      const ob=B.filter(b=>!b.in&&b.n),c0=B[0]; if(ob.length) v+=Math.min(...ob.map(b=>Math.hypot(b.x-c0.x,b.y-c0.y)))/80; }
    return v; }
  function aiChoose(){ const c0=cue(),sk=ST.skill; let best=null,bv=-1e9;
    const cands=shotCands(c0.x,c0.y).slice(0,5);
    for(const cd of cands) for(const pw of [cd.need,Math.min(1,cd.need*1.25)]) for(const s of [0,-.5,.5]){ const v=evalShot(cd.a,pw,s)+cd.score*10; if(v>bv){ bv=v; best={a:cd.a,p:pw,s}; } }
    if(!best||bv<10){ // 找不到好球：試各種角度，至少不要犯規
      const legal=legalTargets(st,turn); for(let k=0;k<24;k++){ const n=legal[k%legal.length],b=st.B.find(x=>x.n===n); const a=Math.atan2(b.y-c0.y,b.x-c0.x)+(k<legal.length?0:(Math.random()-.5)*1.2),p=.25+Math.random()*.35,v=evalShot(a,p,0); if(v>bv){ bv=v; best={a,p,s:0}; } } }
    // 實力越低誤差越大
    const err=(1-sk)*.05; best.a+=(Math.random()+Math.random()-1)*err; best.p=clamp(best.p*(1+(Math.random()-.5)*(1-sk)*.3),.08,1); return best; }
  function aiPlace(){ // 自由球：挑一個打得最好的位置
    let bx=HEAD,by=MY,bs=-1; for(let k=0;k<80;k++){ const x=kitchen?TX0+R+Math.random()*(HEAD-TX0-R*2):TX0+R+Math.random()*(TX1-TX0-R*2),y=TY0+R+Math.random()*(TY1-TY0-R*2); if(!validCue(x,y)) continue; const cs=shotCands(x,y),s=cs.length?cs[0].score:0; if(s>bs){ bs=s; bx=x; by=y; } } cue().x=bx; cue().y=by; }
  // 連線
  if(net){
    net.onmsg=(m,from)=>{
      if(net.host&&from&&(m.sh||m.rs||m.pc)) net.send(m);
      if(m.pc&&m.pc[0]===turn&&!local(turn)){ cue().x=m.pc[1]; cue().y=m.pc[2]; }
      if(m.sh&&m.sh[0]===turn&&!local(turn)&&(phase==='aim'||phase==='place')){ ang=m.sh[1]; take(m.sh[1],m.sh[2],m.sh[3],m.sh[4],m.sh[5]); }
      if(m.rs&&m.rs[0]===turn&&!local(turn)&&(phase==='roll'||waitRes)){ m.rs[1].forEach((a,i)=>{ const b=st.B[i]; b.x=a[0]; b.y=a[1]; b.in=!!a[2]; b.vx=b.vy=0; }); shotS.first=m.rs[2]; shotS.pots=m.rs[3]; waitRes=false; afterShot(); } };
    net.onleave=()=>{ if(phase!=='over'&&!ended){ say('對手離線了',2); winner=me; phase='over'; phT=1.5; } };
  }
  // 滑鼠：移動瞄準、按住往後拉蓄力、放開擊球；自由球時點一下放母球
  let drag=null,mouse=null; const toC=e=>{ const r=canvas.getBoundingClientRect?canvas.getBoundingClientRect():{left:0,top:0,width:W,height:H}; return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height]; };
  const onMove=e=>{ const p=toC(e); mouse=p; if(!local(turn)) return; if(phase==='place'&&e.pointerType!=='touch'&&!drag){ if(validCue(p[0],p[1])){ cue().x=p[0]; cue().y=p[1]; } return; }
      if(phase!=='aim') return; if(drag){ const d=Math.hypot(p[0]-drag[0],p[1]-drag[1]); pow=clamp(d/170,0,1); if(d>6) drag.moved=true; } else if(e.pointerType!=='touch'){ const c0=cue(); ang=Math.atan2(p[1]-c0.y,p[0]-c0.x); } },
    onDown=e=>{ const p=toC(e); if(!local(turn)||e.button>0) return; if(phase==='place'){ if(validCue(p[0],p[1])){ cue().x=p[0]; cue().y=p[1]; confirmPlace(); } return; } if(phase!=='aim') return; drag=p; drag.moved=false; e.preventDefault&&e.preventDefault(); },
    onUp=e=>{ if(!drag) return; const p=mouse||drag,moved=drag.moved; drag=null; if(phase!=='aim'||!local(turn)) return; if(!moved){ const c0=cue(); if(Math.hypot(p[0]-c0.x,p[1]-c0.y)>R*1.5) ang=Math.atan2(p[1]-c0.y,p[0]-c0.x); pow=0; return; } if(pow>.03) shoot(); else pow=0; };
  if(canvas.addEventListener){ canvas.addEventListener('pointerdown',onDown); addEventListener('pointermove',onMove); addEventListener('pointerup',onUp); addEventListener('pointercancel',onUp); }
  function confirmPlace(){ if(!validCue(cue().x,cue().y)) return; phase='aim'; inHand=false; if(net) net.send({pc:[turn,cue().x,cue().y]}); aimDefault(); sfx('click'); }
  function update(dt){
    t+=dt; if(banT>0) banT-=dt; if(strikeT>0) strikeT-=dt; if(arrowT>0) arrowT-=dt;
    for(const f of potFx) f.l-=dt; potFx=potFx.filter(f=>f.l>0);
    if(ended) return;
    if(phase==='intro'){ phT-=dt; if(phT<=0||!net&&env.hit('Space')){ startRack(); } return; }
    if(phase==='between'){ phT-=dt; if(phT<=0) startRack(); return; }
    if(phase==='over'){ phT-=dt; if(phT<=0) finish(); return; }
    const K=env.keys;
    if(phase==='place'){ const c0=cue(); c0.in=false;
      if(PL[turn].ai){ aiT-=dt; if(aiT<=0){ aiPlace(); phase='aim'; inHand=false; aiPlan=null; aiT=.6; } return; }
      if(!local(turn)) return;
      const v=dt*160; let nx=c0.x+((K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0))*v,ny=c0.y+((K.ArrowDown||K.KeyS?1:0)-(K.ArrowUp||K.KeyW?1:0))*v; if(validCue(nx,ny)){ c0.x=nx; c0.y=ny; }
      if(env.hit('Space')||env.hit('Enter')) confirmPlace(); return; }
    if(phase==='aim'){
      if(PL[turn].ai){ aiT-=dt; if(!aiPlan&&aiT<=0){ aiPlan=aiChoose(); aiPlan.t=0; } if(aiPlan){ aiPlan.t+=dt; let da=aiPlan.a-ang; da=Math.atan2(Math.sin(da),Math.cos(da)); ang+=da*Math.min(1,dt*5); spin=aiPlan.s; if(aiPlan.t>1.1){ pow=Math.min(aiPlan.p,(aiPlan.t-1.1)*1.6); } if(aiPlan.t>1.1+aiPlan.p/1.6+.25){ ang=aiPlan.a; pow=aiPlan.p; take(ang,pow,spin,cue().x,cue().y); pow=0; aiPlan=null; } } return; }
      if(!local(turn)) return;
      if(K.ArrowLeft) ang-=dt*.9; if(K.ArrowRight) ang+=dt*.9; if(K.ArrowUp) ang-=dt*.1; if(K.ArrowDown) ang+=dt*.1;
      spin=0;
      const held=K.Space||K.Enter; if(held&&!drag){ if(!charging){ charging=true; mt=0; } mt+=dt; pow=.5-Math.cos(mt*1.9)*.5; } else if(charging){ charging=false; pow=Math.max(.04,pow); shoot(); }
      return; }
    if(phase==='roll'){ if(waitRes) return; for(let i=0;i<Math.round(dt/SUB);i++){ const np=shotS.pots.length; stepPhys(st.B,shotS,SUB); for(let k=np;k<shotS.pots.length;k++){ const n=shotS.pots[k],b=st.B.find(x=>x.n===n); potFx.push({x:b.px||b.x,y:b.py||b.y,l:.6,n}); sfx(n===0?'hurt':'score'); } }
      if((shotS.clicks||0)>(shotS.lc||0)){ shotS.lc=shotS.clicks; sfx('bump'); }
      if(!moving(st.B)){ if(local(turn)||PL[turn].ai&&(!net||net.host)){ if(net) net.send({rs:[turn,st.B.map(b=>[Math.round(b.x*100)/100,Math.round(b.y*100)/100,b.in?1:0]),shotS.first,shotS.pots]}); afterShot(); } else waitRes=true; } } }
  function finish(){ ended=true; const w=winner,meWin=vsAI?w===0:net?w===me:true;
    const html='<table class="ls"><tr><th>玩家</th><th>贏的局數</th></tr>'+PL.map(p=>'<tr><td>'+p.name+'</td><td>'+p.wins+'</td></tr>').join('')+'</table>';
    if(vsAI&&meWin){ try{ const k='arcade.pool.best',old=+localStorage.getItem(k)||0; if(si+1>old) localStorage.setItem(k,String(si+1)); localStorage.setItem('arcade.pool.w.'+si,'1'); }catch(e){} }
    env.sfx(meWin?'win':'lose');
    env.end({title:local2?PL[w].name+' 獲勝！':meWin?'你贏了！':PL[w].name+' 獲勝',big:PL[0].wins+' : '+PL[1].wins,html,text:(rule==='9'?'九號球':'八號球')+'，搶 '+raceTo+' 局。',score:vsAI&&meWin?si+1:null,next:vsAI&&meWin&&si<STAGES.length-1}); }
  function draw(){
    drawRoom(c,ST,t); drawTable(c,cloth,t);
    // 頭頂燈光
    const lg=c.createRadialGradient(MX,MY-20,20,MX,MY,380); lg.addColorStop(0,'rgba(255,245,210,.12)'); lg.addColorStop(1,'rgba(255,245,210,0)'); c.fillStyle=lg; c.fillRect(0,0,W,H);
    for(const f of potFx){ c.globalAlpha=f.l/.6; c.strokeStyle='#ffd23f'; c.lineWidth=2; c.beginPath(); c.arc(f.x,f.y,18-f.l*10,0,7); c.stroke(); c.globalAlpha=1; }
    const c0=cue(),myTurn=local(turn)&&!PL[turn].ai;
    // 瞄準輔助線：母球路徑到第一顆碰到的球，以及目標球的去向
    if(phase==='aim'&&!c0.in){ const dx=Math.cos(ang),dy=Math.sin(ang); let hit=null,ht=1e9; for(const b of st.B){ if(b.in||!b.n) continue; const fx=b.x-c0.x,fy=b.y-c0.y,tp=fx*dx+fy*dy; if(tp<=0) continue; const pd2=fx*fx+fy*fy-tp*tp; if(pd2>4*R*R) continue; const tt=tp-Math.sqrt(4*R*R-pd2); if(tt<ht){ ht=tt; hit=b; } }
      let wt=1e9; for(const [x,y,lim] of [[TX0+R,null,-1],[TX1-R,null,1],[null,TY0+R,-1],[null,TY1-R,1]]){ if(x!=null&&dx){ const tt=(x-c0.x)/dx; if(tt>0) wt=Math.min(wt,tt); } if(y!=null&&dy){ const tt=(y-c0.y)/dy; if(tt>0) wt=Math.min(wt,tt); } }
      const L=Math.min(ht,wt),gx=c0.x+dx*L,gy=c0.y+dy*L; c.save(); c.setLineDash&&c.setLineDash([4,5]); c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=1.4; c.beginPath(); c.moveTo(c0.x,c0.y); c.lineTo(gx,gy); c.stroke(); c.restore();
      c.strokeStyle='rgba(255,255,255,.75)'; c.lineWidth=1.2; c.beginPath(); c.arc(gx,gy,R,0,7); c.stroke();
      if(hit&&ht<=wt&&(myTurn||!net)){ const nx=(hit.x-gx)/(R*2),ny=(hit.y-gy)/(R*2),legal=legalTargets(st,turn).includes(hit.n)||st.brk; c.strokeStyle=legal?'rgba(255,255,255,.75)':'rgba(255,90,90,.85)'; c.lineWidth=2; c.beginPath(); c.moveTo(hit.x,hit.y); c.lineTo(hit.x+nx*70,hit.y+ny*70); c.stroke(); if(!legal){ c.font='900 11px '+TC; c.fillStyle='#ff8a8a'; c.textAlign='center'; c.fillText('不能先打這顆',hit.x,hit.y-16); } } }
    // 球
    for(const b of st.B) if(!b.in) drawBall(c,b);
    if(phase==='place'&&!c0.in){ c.strokeStyle=validCue(c0.x,c0.y)?'#5fd068':'#ff4d4d'; c.lineWidth=2; c.beginPath(); c.arc(c0.x,c0.y,R+5+Math.sin(t*6)*1.5,0,7); c.stroke(); if(kitchen){ c.fillStyle='rgba(255,255,255,.05)'; c.fillRect(TX0,TY0,HEAD-TX0,TY1-TY0); } }
    // 打球的人和球桿
    if((phase==='aim'||phase==='place')&&!c0.in){ const pl=charging||pow>0?8+pow*55:4; drawShooter(c,c0.x,c0.y,ang,pl,PL[turn].L); drawCue(c,c0.x,c0.y,ang,pl); }
    else if(phase==='roll'&&strikeT>0&&before){ const b0=before[0]; drawShooter(c,b0.x,b0.y,ang,-6+(1-strikeT/.25)*-4,PL[turn].L); drawCue(c,b0.x,b0.y,ang,-6); }
    // 上方計分列
    c.fillStyle='rgba(11,10,28,.85)'; c.fillRect(0,0,W,78);
    for(let i=0;i<2;i++){ const x=i?W-330:10,act=turn===i&&phase!=='over'; c.fillStyle=act?'rgba(255,210,63,.18)':'rgba(255,255,255,.05)'; rr(c,x,6,320,66,12); c.fill(); if(act){ c.strokeStyle='#ffd23f'; c.lineWidth=2; rr(c,x,6,320,66,12); c.stroke(); }
      c.save(); c.beginPath(); rr(c,x+6,10,56,58,10); c.clip(); c.fillStyle=shade(ST.room,1.6); c.fillRect(x+6,10,56,58); drawBust(c,x+34,48,1.45,PL[i].L,t+i); c.restore();
      c.fillStyle='#fff'; c.font='900 15px '+TC; c.textAlign='left'; c.textBaseline='middle'; c.fillText(PL[i].name,x+72,22); c.fillStyle='#ffd23f'; c.font='900 13px '+PIX; c.fillText(String(PL[i].wins),x+290,22);
      // 這位玩家還要打的球
      let list=[]; if(rule==='9'){ if(i===turn){ const lg=legalTargets(st,i); list=lg; } }
      else { const g=st.grp[i]; if(g) list=st.B.filter(b=>!b.in&&(g==='solid'?isSolid(b.n):isStripe(b.n))).map(b=>b.n); if(g&&!list.length) list=[8]; }
      c.font='700 11px '+TC; c.fillStyle='#cfe8d8'; c.fillText(rule==='9'?(i===turn?'要先打：':''):st.grp[i]?(st.grp[i]==='solid'?'全色球':'花色球'):'還沒分組',x+72,44);
      list.slice(0,8).forEach((n,k)=>drawBall(c,{n,ru:0,rv:0},x+136+k*20,44,1)); if(rule==='9'&&i===turn){ const on=st.B.filter(b=>!b.in&&b.n).map(b=>b.n); c.fillStyle='#8aa'; c.fillText('台上：'+on.join(' '),x+72,62); }
      if(PL[i].ai&&turn===i&&phase==='aim'){ c.fillStyle='#cfe8d8'; c.fillText('思考中⋯',x+240,62); } }
    c.fillStyle='#ffd23f'; c.font='900 13px '+TC; c.textAlign='center'; c.fillText((rule==='9'?'九號球':'八號球')+'　搶 '+raceTo,W/2,24); c.fillStyle='#cfe8d8'; c.font='700 11px '+TC; c.fillText(vsAI?ST.place:'',W/2,44);
    // 力道條與旋轉
    if(phase==='aim'&&myTurn){ const x=W-34,y=H-170; c.fillStyle='rgba(11,10,28,.75)'; rr(c,x-8,y-22,28,160,10); c.fill(); const g=c.createLinearGradient(0,y+130,0,y); g.addColorStop(0,'#5fd068'); g.addColorStop(.6,'#ffd23f'); g.addColorStop(1,'#ff4d4d'); c.fillStyle=g; c.fillRect(x,y+130-pow*130,12,pow*130); c.strokeStyle='#fff'; c.lineWidth=1; c.strokeRect(x,y,12,130); c.fillStyle='#fff'; c.font='700 10px '+TC; c.textAlign='center'; c.fillText('力道',x+6,y-11); }
    if(phase==='place'&&myTurn){ c.fillStyle='rgba(11,10,28,.75)'; rr(c,W/2-200,H-34,400,26,12); c.fill(); c.fillStyle='#fff'; c.font='700 12px '+TC; c.textAlign='center'; c.fillText((kitchen?'開球：':'自由球：')+'用方向鍵或滑鼠移動白球，按空白鍵或點一下放好',W/2,H-21); }
    if(!myTurn&&!PL[turn].ai&&net&&(phase==='aim'||phase==='place')){ c.fillStyle='rgba(11,10,28,.75)'; rr(c,W/2-110,H-34,220,26,12); c.fill(); c.fillStyle='#fff'; c.font='700 12px '+TC; c.textAlign='center'; c.fillText('等 '+PL[turn].name+' 出桿⋯',W/2,H-21); }
    if(arrowT>0&&(phase==='place'||phase==='aim')&&!c0.in){ const lab=vsAI?(turn===0?'你':ST.name):net?(local(turn)?'你':PL[turn].name):PL[turn].name; const yy=c0.y-34+Math.sin(t*8)*4; c.fillStyle='#ffd23f'; c.strokeStyle='#0b0a1c'; c.lineWidth=3; c.beginPath(); c.moveTo(c0.x-12,yy-16); c.lineTo(c0.x+12,yy-16); c.lineTo(c0.x,yy); c.closePath(); c.stroke(); c.fill(); c.font='900 13px '+TC; c.textAlign='center'; c.lineWidth=4; c.strokeText(lab,c0.x,yy-25); c.fillText(lab,c0.x,yy-25); }
    if(banT>0&&banner){ c.globalAlpha=Math.min(1,banT*2); c.fillStyle='rgba(11,10,28,.78)'; rr(c,W/2-220,MY-24,440,48,14); c.fill(); c.fillStyle='#ffd23f'; c.font='900 18px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(banner,W/2,MY); c.globalAlpha=1; }
    if(phase==='intro'){ c.fillStyle='rgba(11,10,28,.7)'; rr(c,W/2-220,MY-60,440,120,16); c.fill(); c.fillStyle='#ffd23f'; c.font='900 26px '+TC; c.textAlign='center'; c.fillText(vsAI?ST.place+'　對手：'+ST.name:(rule==='9'?'九號球':'八號球'),W/2,MY-24); c.fillStyle='#fff'; c.font='700 14px '+TC; c.fillText((rule==='9'?'九號球':'八號球')+'，先贏 '+raceTo+' 局的人獲勝',W/2,MY+8); c.fillText(PL[turn].name+' 先開球',W/2,MY+34); } }
  return {update,draw,destroy(){ if(canvas.removeEventListener){ canvas.removeEventListener('pointerdown',onDown); removeEventListener('pointermove',onMove); removeEventListener('pointerup',onUp); removeEventListener('pointercancel',onUp); } },
    _dbg:{PL,get st(){return st;},get phase(){return phase;},get turn(){return turn;},aiChoose,skip(){ phT=0; }}};
}
function stageShow(ctx,w,h,si,t){ const ST=STAGES[si]; ctx.save(); ctx.scale(w/W,h/H); drawRoom(ctx,ST,t); drawTable(ctx,ST.cloth,t); const B=rack(si%2?'9':'8'); B.forEach((b,i)=>{ b.ru=i; b.rv=i*2; });
  const u=(t%3)/3; B[0].x=lerp(HEAD-60,FOOT[0]-30,Math.min(1,u*2.5)); if(u<.4) drawCue(ctx,B[0].x,B[0].y,0,Math.max(0,20-u*60)); for(const b of B) drawBall(ctx,b); drawShooter(ctx,B[0].x,B[0].y,0,u<.4?Math.max(0,20-u*60):10,ST.look);
  ctx.fillStyle='rgba(11,10,28,.8)'; rr(ctx,12,8,420,96,14); ctx.fill(); ctx.save(); ctx.beginPath(); rr(ctx,20,14,80,84,10); ctx.clip(); ctx.fillStyle=shade(ST.room,1.6); ctx.fillRect(20,14,80,84); drawBust(ctx,60,72,2.1,ST.look,t); ctx.restore();
  ctx.fillStyle='#ffd23f'; ctx.font='900 26px '+TC; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(ST.name,112,40); ctx.fillStyle='#fff'; ctx.font='700 17px '+TC; ctx.fillText(ST.place+'　'+'★'.repeat(ST.stars),112,76); ctx.restore(); }
function thumb(ctx,w,h,t){ ctx.save(); ctx.scale(w/W,h/H); const ST=STAGES[8]; drawRoom(ctx,ST,t); drawTable(ctx,'#1f7a3e',t); const B=rack('8'); B.forEach((b,i)=>{ b.ru=i; b.rv=i*1.7; }); for(const b of B) drawBall(ctx,b); drawShooter(ctx,B[0].x,B[0].y,0,8+Math.sin(t*2)*8,{skin:'#e0ac80',hair:'#1a1410',shirt:'#ffffff',vest:'#1e1e24'}); drawCue(ctx,B[0].x,B[0].y,0,8+Math.sin(t*2)*8);
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 64px '+TC; ctx.lineWidth=10; ctx.strokeStyle='#0b0a1c'; ctx.strokeText('一桿清台',W/2,90); ctx.fillStyle='#ffd23f'; ctx.fillText('一桿清台',W/2,90); ctx.restore(); }
function preview(ctx,w,h,L,t){ ctx.save(); ctx.scale(w/W,h/H); L=L||{}; drawRoom(ctx,STAGES[0],t); drawTable(ctx,'#1f7a3e',t);
  const lk={skin:['#f2c9a0','#e0ac80','#c68a5e','#8d5a3a'][+(L.skin||1)],hair:L.hair||'#1a1410',shirt:L.shirt||'#3d8bff',vest:L.vest&&L.vest!=='none'?L.vest:null,long:L.style==='long',bald:L.style==='bald'};
  ctx.save(); ctx.translate(-420,-260); ctx.scale(1.9,1.9); drawBall(ctx,{n:0,ru:0,rv:0},560,300); drawShooter(ctx,560,300,-.3,10+Math.sin(t*2)*8,lk); drawCue(ctx,560,300,-.3,10+Math.sin(t*2)*8); ctx.restore();
  ctx.fillStyle='rgba(11,10,28,.75)'; rr(ctx,W-200,H-210,170,190,14); ctx.fill(); ctx.save(); ctx.beginPath(); rr(ctx,W-190,H-200,150,170,10); ctx.clip(); drawBust(ctx,W-115,H-70,4,lk,t); ctx.restore(); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).pool={
  coin:o=>({verb:'先開球',names:o.net?[o.net.names[0]||'玩家 1',o.net.names[1]||'玩家 2']:o.mode==='2p'?['1P','2P']:[o.name||'你',STAGES[o.stage||0].name]}),
  name:'一桿清台',tag:'BILLIARDS',color:'#ffd23f',online:true,maxPlayers:2,
  desc:'寫實風撞球，可選八號球或九號球。木框球桌、皮革球袋、會滾動的號碼球，有瞄準輔助線，只要瞄準和控制力道。挑戰 10 位各有球館的電腦對手，也能雙人輪流或連線對打。',
  goal:'八號球：先打進第一顆球決定你打全色（1-7）或花色（9-15），清完自己的球再打進 8 號就贏。九號球：每桿先碰台上最小號的球，打進 9 號就贏。母球掉進袋子或碰錯球是犯規，換對手隨意擺母球。',
  stages:STAGES.map(s=>s.name+'（'+s.place+'）'),stars:STAGES.map(s=>s.stars),stageLabel:'選擇對手',
  stageShow,
  stageGoal:si=>'對手：'+STAGES[si].name+'（'+STAGES[si].place+'，'+'★'.repeat(STAGES[si].stars)+'）。八號球清完自己那組再打進 8 號就贏；九號球打進 9 號就贏。',
  stageBest:i=>{ try{ return localStorage.getItem('arcade.pool.w.'+i)?'★ 贏過':''; }catch(e){ return ''; } },
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人輪流'}],
  options:[{key:'rule',label:'玩法',def:'8',opts:[{id:'8',label:'八號球'},{id:'9',label:'九號球'}]},{key:'race',label:'搶幾局',def:'1',opts:[{id:'1',label:'1 局'},{id:'2',label:'搶 2 局'},{id:'3',label:'搶 3 局'}]},
    {key:'cloth',label:'台呢顏色',def:'stage',opts:[{id:'stage',label:'照球館'},{id:'#1f7a3e',label:'綠'},{id:'#1f6aa8',label:'藍'},{id:'#8a1e2a',label:'紅'},{id:'#5a2a6a',label:'紫'}]}],
  help:[['← →','瞄準（↑ ↓ 慢慢微調）'],['空白鍵','按住蓄力，放開出桿'],['滑鼠','移到想打的方向；按住往後拉，放開出桿']],
  touchHelp:[['點台面','對準點的方向'],['出桿','按住蓄力，放開出桿']],
  touch:{left:[{l:'◀',c:'ArrowLeft'},{l:'▶',c:'ArrowRight'}],right:[{l:'出桿',c:'Space',act:true}]},
  looks:[{key:'shirt',label:'上衣',type:'color',opts:['#3d8bff','#ffffff','#e23b3b','#1e1e24','#2e9e4f','#ffd23f','#ff7eb6']},{key:'vest',label:'背心',opts:[{id:'none',label:'不穿'},{id:'#1e1e24',label:'黑背心'},{id:'#2a2a6a',label:'藍背心'},{id:'#5a2a14',label:'咖啡背心'}]},
    {key:'style',label:'髮型',opts:[{id:'short',label:'短髮'},{id:'long',label:'長髮'},{id:'bald',label:'光頭'}]},{key:'hair',label:'髮色',type:'color',opts:['#1a1410','#3a2416','#6a4a2a','#c8a060','#d8d0c8']},
    {key:'skin',label:'膚色',opts:[{id:'0',label:'白皙'},{id:'1',label:'自然'},{id:'2',label:'小麥'},{id:'3',label:'深色'}]}],
  best:{label:'已打敗',fmt:v=>v+' / '+STAGES.length+' 位',lower:false},
  preview,thumb,create,_sim:{rack,simulate,judge,STAGES}
};
})();
