// 網球對決：從球員背後看的透視視角，單打或雙打，照國際網球總會（ITF）規則：
//  發球站底線後、照這一局的總分站右（偶數）或左（奇數）半場，上手發到斜對角的發球區；一發失誤還有二發，兩次都失誤＝雙發失誤；擦網落在發球區＝重發（Let）。
//  接發球一定要等球彈地；之後可以截擊；球在自己這邊彈地兩次、出界、掛網就輸這一分。
//  計分 0、15、30、40，40 平＝Deuce，之後要連贏兩分（占先 Ad）；每局換發球。可選先贏 2 局、短盤 4 局、一盤 6 局（局數平手時搶七）。
// 座標：x＝球場長邊（左隊在 x<400）、w＝左右（左隊面向 +x 時右手邊是 +w）、y＝高度（GY 是地面，越小越高）。
(function(){
'use strict';
const W=800,H=450,GY=400,NETX=400,NETTOP=346,BACK=60,SVC=190,CWS=118,CWD=156,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,LV=200;
const G=900,K=.0008,REST=.66,REACH=46;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,r1=v=>Math.round(v*10)/10,lerp=(a,b,u)=>a+(b-a)*u;
const LS=(k,v)=>{ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } };
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function shade(hex,k){ const n=parseInt(hex.slice(1),16),f=v=>clamp(Math.round(k>1?v+(255-v)*(k-1):v*k),0,255); return 'rgb('+f(n>>16&255)+','+f(n>>8&255)+','+f(n&255)+')'; }
// 拍子打得到的範圍：身體四周 REACH、高度從腳踝到伸直手臂的高壓（約 215）
const reachD=(p,b)=>{ const h=GY-b.y; return Math.hypot(b.x-p.x,b.w-p.w,Math.max(0,h-215,8-h)); };

/* ---------- 球場、對手 ---------- */
const VENUES=[
  {n:'社區網球場',sky:['#8fd3ff','#e0f4ff'],court:'#2f6fb8',out:'#3f8a5a',bg:'trees'},
  {n:'公園紅土場',sky:['#7ec8ff','#d8f0ff'],court:'#c8643a',out:'#b8583a',bg:'park',clay:1},
  {n:'河濱網球場',sky:['#9ad8ff','#eaf8ff'],court:'#3a5ab8',out:'#4f8a5a',bg:'river'},
  {n:'大學網球場',sky:['#8fd0ff','#e8f6ff'],court:'#2a7a5a',out:'#5a8a4a',bg:'school'},
  {n:'海濱度假村',sky:['#5ec8ff','#fff1c8'],court:'#2a7ac8',out:'#e8d098',bg:'sea'},
  {n:'草地俱樂部',sky:['#9ad0ff','#eef8ff'],court:'#5aa03a',out:'#4a8a30',bg:'trees',grass:1},
  {n:'夜間燈光球場',sky:['#0a1030','#2a2a5a'],court:'#1f5aa8',out:'#2a4a3a',bg:'night'},
  {n:'紅土公開賽',sky:['#3a4a7a','#24305a'],court:'#c05a30',out:'#b0502a',bg:'arena',clay:1},
  {n:'室內網球館',sky:['#e8dcc4','#d0bc98'],court:'#3a6ab8',out:'#4a7a5a',bg:'gym',in:1},
  {n:'中央球場決賽',sky:['#2a3a6a','#1a2448'],court:'#2a5ab0',out:'#2a6a4a',bg:'arena'}];
const FOES=['阿凱','小安','美玲','大熊','阿宏','小芸','志明','春嬌','阿哲','小琪','大山','阿妹','小傑','阿娟','大寶','小芳','阿翔','小雯','阿德','小蓉','阿強','小慧','阿龍','小婷','阿伯'];
const FCOL=['#4f9dff','#ff9d3d','#5fd068','#b98cff','#ff5d8f','#3ddbd9','#e8c040','#ff6b4a'];
const STAGES=Array.from({length:LV},(_,i)=>{ const v=Math.floor(i/20),k=i/(LV-1); return {i,v,k,foe:FOES[(i*7+v*3)%FOES.length]+(i>=100?'・進階':''),col:FCOL[(i*3+1)%FCOL.length],hair:i%3,name:VENUES[v].n+' '+(i%20+1),stars:Math.min(5,1+Math.floor(i/40))}; });
const recKey=i=>'arcade.tennis.w.'+i,getRec=i=>LS(recKey(i));

/* ---------- 球：長邊＋高度用重力和空氣阻力，左右等速；落地會彈 ---------- */
function stepB(b,dt){ const sp=Math.hypot(b.vx,b.vy); b.vx-=K*sp*b.vx*dt; b.vy+=(G+(b.spin==='top'?380:0)-K*sp*b.vy)*dt; b.x+=b.vx*dt; b.y+=b.vy*dt; b.w=(b.w||0)+(b.vw||0)*dt; }
// 落地反彈：上旋（往前竄、彈得高）、切削（彈得低、速度被吃掉）、平擊；紅土彈得慢一點、草地彈得低一點
let SURF={rest:1,sp:1};
function bounce(b){ if(b.spin==='top'){ b.vy=-Math.abs(b.vy)*.62*SURF.rest; b.vx*=.95*SURF.sp; } else if(b.spin==='slice'){ b.vy=-Math.abs(b.vy)*.4*SURF.rest; b.vx*=.68*SURF.sp; } else { b.vy=-Math.abs(b.vy)*REST*SURF.rest; b.vx*=.84*SURF.sp; } b.vw=(b.vw||0)*.88; b.spin=''; }
function simLand(x,y,vx,vy,spin){ const s={x,y,vx,vy,spin}; let netY=null,t=0; for(let i=0;i<600;i++){ const px=s.x; stepB(s,1/90); t+=1/90; if(netY==null&&(px-NETX)*(s.x-NETX)<=0) netY=s.y; if(s.y>=GY) break; } return {x:s.x,netY,t}; }
function aimShot(x,y,tx,angs,dir,clr,spin){ for(const a of angs){ const ca=Math.cos(a*Math.PI/180)*dir,sa=-Math.sin(a*Math.PI/180); let lo=60,hi=1600,best=null;
    for(let it=0;it<18;it++){ const v=(lo+hi)/2,L=simLand(x,y,ca*v,sa*v,spin); if((L.x-tx)*dir<0) lo=v; else hi=v; best={v,L}; }
    if(best&&best.L.netY!=null&&best.L.netY<NETTOP-(clr||8)&&Math.abs(best.L.x-tx)<26) return {vx:ca*best.v,vy:sa*best.v,t:best.L.t}; } return null; }
// 固定速度找角度：落點最接近 tx、過網、落在對面場內
function aimFixed(x,y,tx,v,dir,a0,a1,minD,maxD,spin){ let best=null,bd=1e9; for(let a=a0;a<=a1;a+=1){ const ca=Math.cos(a*Math.PI/180)*dir,sa=-Math.sin(a*Math.PI/180),L=simLand(x,y,ca*v,sa*v,spin);
    if(L.netY==null||L.netY>=NETTOP-5) continue; const dd=(L.x-NETX)*dir; if(dd<minD||dd>maxD) continue; const d=Math.abs(L.x-tx); if(d<bd){ bd=d; best={vx:ca*v,vy:sa*v,t:L.t}; } } return best&&bd<120?best:null; }

/* ---------- 透視鏡頭：在自己這隊底線後方，看向對面 ---------- */
const CAMX=-380,CAMH=270,FOC=530,HY=66,SCP=.52,SWD=.36,SVD=1.0;
function proj(x,w,h,ct){ if(ct===1){ x=W-x; w=-w; } const d=Math.max(30,x-CAMX),s=FOC/d; return [W/2+w*s,HY+(CAMH-h)*s,s,d]; }

/* ---------- 寫實球員：骨架＋關鍵影格（約 7.5 頭身） ----------
   身體座標：x＝球員自己的右手邊、y＝往上（腳底 0、頭頂約 176）、z＝球員面向的前方。
   正面看（front）：右手在畫面左邊、前方朝鏡頭；背面看：右手在畫面右邊、前方遠離鏡頭。 */
const SKINS=['#f1c9a5','#e8b88f','#d9a37a','#c48a62'];
function lerp3(a,b,u){ return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u]; }
function keyAt(K,u){ for(let i=0;i<K.length-1;i++){ if(u<=K[i+1][0]){ const s=(u-K[i][0])/Math.max(1e-6,K[i+1][0]-K[i][0]),e=s*s*(3-2*s); return lerp3(K[i][1],K[i+1][1],e); } } return K[K.length-1][1]; }
// 揮拍動作：拿拍手的位置（關鍵影格 u＝0～1，0.45 左右擊球）、肩膀轉多少、膝蓋蹲多少
const SWING={
  ready:{hand:[[0,[10,112,26]],[1,[10,112,26]]],rot:[[0,0],[1,0]],crouch:.35},
  fh:{hand:[[0,[12,112,24]],[.28,[46,104,-30]],[.45,[34,98,30]],[.75,[-8,140,30]],[1,[-14,138,22]]],rot:[[0,0],[.28,-.7],[.45,.1],[.75,.6],[1,.4]],crouch:.45},
  bh:{hand:[[0,[10,112,24]],[.28,[-34,108,-24]],[.45,[-20,100,30]],[.75,[30,138,24]],[1,[34,134,16]]],rot:[[0,0],[.28,.7],[.45,0],[.75,-.5],[1,-.35]],crouch:.45},
  dink:{hand:[[0,[12,100,26]],[.3,[16,62,6]],[.45,[12,70,30]],[.75,[8,92,40]],[1,[8,96,34]]],rot:[[0,0],[.3,-.15],[.45,0],[1,.05]],crouch:.85},
  over:{hand:[[0,[16,150,10]],[.28,[26,196,-18]],[.45,[16,190,26]],[.75,[-6,104,30]],[1,[-14,98,20]]],rot:[[0,0],[.28,-.6],[.45,.15],[.75,.5],[1,.35]],crouch:.25},
  slice:{hand:[[0,[12,112,24]],[.28,[40,150,-24]],[.45,[30,100,30]],[.75,[0,84,44]],[1,[-6,90,34]]],rot:[[0,0],[.28,-.6],[.45,0],[.75,.3],[1,.25]],crouch:.6},
  volley:{hand:[[0,[12,120,28]],[.28,[30,128,10]],[.45,[22,124,40]],[.75,[14,118,44]],[1,[12,116,34]]],rot:[[0,0],[.28,-.3],[.45,0],[1,.1]],crouch:.55},
  tserve:{hand:[[0,[22,108,14]],[.3,[34,150,-26]],[.5,[28,176,-40]],[.62,[18,222,18]],[.82,[-16,112,34]],[1,[-20,100,22]]],rot:[[0,-.3],[.3,-.8],[.5,-.6],[.62,.15],[.82,.6],[1,.45]],crouch:.25},
  serve:{hand:[[0,[30,90,-6]],[.3,[34,52,-40]],[.45,[22,72,24]],[.75,[6,150,34]],[1,[0,156,24]]],rot:[[0,-.2],[.3,-.45],[.45,0],[.75,.35],[1,.3]],crouch:.4}};
function poseOf(st,t){ const S=SWING[st.type]||SWING.ready,u=st.u||0,rot=keyAt(S.rot.map(k=>[k[0],[k[1],0,0]]),u)[0],cr=(S.crouch*.6+.4*(st.crouch||.35)),rp=st.run||0,mv=st.mv||0;
  const hipY=96-cr*22,J={}; const lift=Math.sin(rp)*mv,step=Math.cos(rp)*mv;
  J.hipC=[0,hipY,0]; J.neck=[0,hipY+54,4+cr*6]; J.head=[0,hipY+70,6+cr*8];
  const ca=Math.cos(rot),sa=Math.sin(rot); J.shR=[19*ca,hipY+50,-19*sa+4]; J.shL=[-19*ca,hipY+50,19*sa+4];
  J.hipR=[10,hipY,0]; J.hipL=[-10,hipY,0];
  // 腳：準備姿勢兩腳打開、膝蓋微彎；跑步時左右交替前後擺
  const fw=22+cr*12; J.ankR=[fw,6+Math.max(0,lift)*10,step*22]; J.ankL=[-fw,6+Math.max(0,-lift)*10,-step*22];
  const knee=(h,a,s)=>[ (h[0]+a[0])/2+s*(4+cr*9),(h[1]+a[1])/2+cr*3,(h[2]+a[2])/2+10+cr*12 ]; /* 運動員準備姿勢：膝蓋微彎往外 */ J.kneeR=knee(J.hipR,J.ankR,1); J.kneeL=knee(J.hipL,J.ankL,-1);
  // 拿拍手（右手）照揮拍動作；手肘從肩膀和手之間往外下方彎
  const hand=keyAt(S.hand,u); hand[1]-=cr*10; J.handR=hand;
  const el=(s,h,side)=>{ const m=lerp3(s,h,.5),dx=h[0]-s[0],dy=h[1]-s[1],dz=h[2]-s[2],L=Math.hypot(dx,dy,dz),bend=Math.max(0,(56-L))*.55; return [m[0]+side*bend*.5,m[1]-bend*.7,m[2]-bend*.25]; };
  J.elbR=el(J.shR,hand,1);
  // 另一隻手：揮拍時往反方向張開平衡，跑步時跟腳反向擺
  const swing=st.type&&st.type!=='ready';
  J.handL=st.type==='tserve'&&u<.55?[-12,hipY+40+Math.min(1,u/.4)*150,22]:swing?[J.shL[0]-22-rot*8,hipY+34,12-rot*14]:mv>.3?[J.shL[0]-4,hipY+26,18-step*24]:[-4,hipY+30,26]; /* 準備時另一隻手扶在身體前面，揮拍時張開平衡，跑步時跟腳反向擺 */ J.elbL=el(J.shL,J.handL,-1);
  return J; }
function drawHuman(c,X,Y,sc,front,look,st,t){ const J=poseOf(st,t),m=front?-1:1,INK='rgba(30,20,20,.55)',skin=look.skin||SKINS[(look.hair|0)%4],shirt=look.color||'#ff5d6d',shorts=look.shorts||'#2a2c38',hairC=['#2a1a10','#14100c','#6a3a1a'][(look.hair|0)%3];
  const P=v=>[X+v[0]*m*sc,Y-(v[1]+v[2]*(front?-.18:.18))*sc],dz=v=>front?v[2]:-v[2]; // dz 越大越靠近鏡頭
  const limb=(a,b,w1,w2,col)=>{ const A=P(a),B=P(b),dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,r1=w1*sc/2,r2=w2*sc/2; c.fillStyle=col; c.beginPath(); c.moveTo(A[0]+nx*r1,A[1]+ny*r1); c.lineTo(B[0]+nx*r2,B[1]+ny*r2); c.lineTo(B[0]-nx*r2,B[1]-ny*r2); c.lineTo(A[0]-nx*r1,A[1]-ny*r1); c.closePath(); c.fill(); c.beginPath(); c.arc(A[0],A[1],r1,0,TAU); c.arc(B[0],B[1],r2,0,TAU); c.fill(); };
  // 影子
  c.fillStyle='rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(X,Y,30*sc,8*sc,0,0,TAU); c.fill();
  const parts=[];
  // 腳（大腿穿短褲、小腿皮膚、鞋子）
  for(const s of ['R','L']){ const h=J['hip'+s],k=J['knee'+s],a=J['ank'+s],z=(h[2]+a[2])/2;
    parts.push({z:dz([0,0,z])-20,f:()=>{ limb(h,k,17,13,skin); limb(lerp3(h,k,0),lerp3(h,k,.55),19,16,shorts); limb(k,a,12,8,skin); const A=P(a); c.fillStyle='#f4f4f4'; c.beginPath(); c.ellipse(A[0],A[1]+2*sc,8*sc,5*sc,0,0,TAU); c.fill(); c.fillStyle=shirt; c.fillRect(A[0]-7*sc,A[1]-1*sc,14*sc,2*sc); c.fillStyle='#fff'; c.fillRect(A[0]-4*sc,A[1]-7*sc,8*sc,5*sc); }}); }
  // 軀幹
  parts.push({z:0,f:()=>{ const hl=P(J.hipL),hr=P(J.hipR),sl=P(J.shL),sr=P(J.shR),nk=P(J.neck); c.fillStyle=shorts; c.beginPath(); c.moveTo(hl[0]-3*sc*m,hl[1]-6*sc); c.lineTo(hr[0]+3*sc*m,hr[1]-6*sc); c.lineTo(hr[0]+4*sc*m,hr[1]+10*sc); c.lineTo(hl[0]-4*sc*m,hl[1]+10*sc); c.closePath(); c.fill();
    const g=c.createLinearGradient(sl[0],0,sr[0],0); g.addColorStop(0,shade(shirt,.82)); g.addColorStop(.5,shirt); g.addColorStop(1,shade(shirt,.9)); c.fillStyle=g; c.beginPath(); c.moveTo(sl[0],sl[1]-3*sc); c.quadraticCurveTo(nk[0],nk[1]-4*sc,sr[0],sr[1]-3*sc); c.lineTo(hr[0]+2*sc*m,hr[1]-2*sc); c.lineTo(hl[0]-2*sc*m,hl[1]-2*sc); c.closePath(); c.fill();
    c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=2*sc; c.beginPath(); c.moveTo(sl[0]+(sr[0]-sl[0])*.3,sl[1]+6*sc); c.lineTo(hl[0]+(hr[0]-hl[0])*.3,hl[1]-6*sc); c.stroke(); limb(J.neck,lerp3(J.neck,J.head,.4),9,9,skin); }});
  // 頭（正面有臉、背面看到頭髮和帽子）
  parts.push({z:3,f:()=>{ const H=P(J.head),r=12*sc; c.fillStyle=skin; c.beginPath(); c.ellipse(H[0],H[1],r*.86,r,0,0,TAU); c.fill();
    if(front){ c.fillStyle=hairC; c.beginPath(); c.ellipse(H[0],H[1]-r*.35,r*.9,r*.7,0,Math.PI,0); c.fill(); c.fillStyle='#2a1a14'; c.beginPath(); c.ellipse(H[0]-r*.33,H[1]+r*.05,r*.1,r*.13,0,0,TAU); c.ellipse(H[0]+r*.33,H[1]+r*.05,r*.1,r*.13,0,0,TAU); c.fill(); c.strokeStyle='rgba(120,60,40,.6)'; c.lineWidth=1.2*sc; c.beginPath(); c.moveTo(H[0],H[1]+r*.15); c.lineTo(H[0]-r*.06,H[1]+r*.38); c.moveTo(H[0]-r*.2,H[1]+r*.6); c.quadraticCurveTo(H[0],H[1]+r*.7,H[0]+r*.2,H[1]+r*.6); c.stroke(); }
    else { c.fillStyle=hairC; c.beginPath(); c.ellipse(H[0],H[1]-r*.05,r*.9,r*.98,0,0,TAU); c.fill(); if((look.hair|0)%3===1){ c.beginPath(); c.ellipse(H[0],H[1]+r*1.1,r*.25,r*.6,0,0,TAU); c.fill(); } }
    c.fillStyle=shade(shirt,.9); c.beginPath(); c.ellipse(H[0],H[1]-r*.55,r*.95,r*.52,0,Math.PI,0); c.fill(); if(front){ c.beginPath(); c.ellipse(H[0],H[1]-r*.52,r*1.15,r*.25,0,0,Math.PI); c.fill(); } else { } }});
  // 手臂＋球拍
  const arm=(s,racket)=>{ const sh=J['sh'+s],el=J['elb'+s],hd=J['hand'+s];
    parts.push({z:dz([0,0,(sh[2]+hd[2])/2])+(racket?1:0),f:()=>{ limb(sh,lerp3(sh,el,.45),13,12,shirt); limb(sh,el,10,8,skin); limb(lerp3(sh,el,0),lerp3(sh,el,.42),13,11,shirt); limb(el,hd,8,6.5,skin);
      if(racket&&st.pad){ const H=P(hd),E=P(el),a=Math.atan2(H[1]-E[1],H[0]-E[0]),PD=st.pad,fr=PD.face||'#e83a3a'; c.save(); c.translate(H[0],H[1]); c.rotate(a+Math.PI/2); c.scale(sc,sc);
        c.fillStyle=PD.grip||'#333'; rr(c,-2.6,-14,5.2,17,2); c.fill(); c.strokeStyle=fr; c.lineWidth=2.6; c.beginPath(); c.moveTo(-1.5,-14); c.lineTo(-7,-28); c.moveTo(1.5,-14); c.lineTo(7,-28); c.stroke(); // 握把＋拍喉
        c.save(); c.beginPath(); c.ellipse(0,-46,11,19,0,0,TAU); c.clip(); c.fillStyle='rgba(255,255,255,.12)'; c.fill(); c.strokeStyle='rgba(250,250,240,.75)'; c.lineWidth=.7; c.beginPath(); for(let i=-10;i<=10;i+=3.3){ c.moveTo(i,-66); c.lineTo(i,-26); } for(let j=-64;j<=-28;j+=3.6){ c.moveTo(-12,j); c.lineTo(12,j); } c.stroke(); c.restore();
        c.strokeStyle=fr; c.lineWidth=3; c.beginPath(); c.ellipse(0,-46,11,19,0,0,TAU); c.stroke(); c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=1; c.beginPath(); c.ellipse(0,-46,9.6,17.6,0,Math.PI*1.1,Math.PI*1.6); c.stroke(); c.restore(); }
      const H=P(hd); c.fillStyle=skin; c.beginPath(); c.arc(H[0],H[1],4.2*sc,0,TAU); c.fill(); }}); };
  arm('R',true); arm('L',false);
  parts.sort((a,b)=>a.z-b.z).forEach(p=>p.f());
  if(st.label){ const H=P(J.head); c.font='900 17px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=4; c.strokeStyle='#14122b'; c.strokeText(st.label,H[0],H[1]-30*sc-8); c.fillStyle='#ffd23f'; c.fillText(st.label,H[0],H[1]-30*sc-8); } }

/* ---------- 背景＋球場（依鏡頭在哪一隊快取；球場左右對稱，兩隊看起來一樣） ---------- */
const BGC={};
function courtBg(v){ if(BGC[v]) return BGC[v]; const e=document.createElement('canvas'); e.width=W; e.height=H; const c=e.getContext('2d'),V=VENUES[v],R=n=>((Math.sin(n*12.9898+v*7.1)*43758.5453)%1+1)%1;
  let g=c.createLinearGradient(0,0,0,200); g.addColorStop(0,V.sky[0]); g.addColorStop(1,V.sky[1]); c.fillStyle=g; c.fillRect(0,0,W,210);
  const hz=172; // 遠方地平線（場地後面）
  if(V.in){ c.fillStyle=shade(V.sky[1],.9); c.fillRect(0,40,W,hz-40); for(let i=0;i<6;i++){ const x=70+i*132; c.fillStyle='#ddd'; c.fillRect(x-28,6,56,8); const lg=c.createRadialGradient(x,14,2,x,14,80); lg.addColorStop(0,'rgba(255,255,230,.5)'); lg.addColorStop(1,'rgba(255,255,230,0)'); c.fillStyle=lg; c.fillRect(x-80,0,160,90); }
    c.fillStyle=V.bg==='gym'?'#2f6fd0':'#e0602a'; rr(c,300,70,200,34,8); c.fill(); c.fillStyle='#fff'; c.font='900 20px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(V.n,400,88);
    c.fillStyle='#7a6a5a'; c.fillRect(0,124,W,hz-124); for(let i=0;i<70;i++){ c.fillStyle=['#ff6b6b','#4f9dff','#ffd23f','#5fd068','#b98cff'][i%5]; c.beginPath(); c.arc((i*61)%W+6,136+(i%3)*20,6,0,TAU); c.fill(); } }
  else { if(V.bg==='night'||V.bg==='arena'){ c.fillStyle='#fff'; for(let i=0;i<60;i++){ c.globalAlpha=.3+R(i)*.7; c.fillRect(R(i+100)*W,R(i+200)*120,1.5,1.5); } c.globalAlpha=1; for(const lx of [60,740]){ c.fillStyle='#555'; c.fillRect(lx-3,30,6,hz-30); c.fillStyle='#fffbe0'; rr(c,lx-24,22,48,14,4); c.fill(); } }
    else { c.fillStyle='rgba(255,255,255,.85)'; for(const [x,y,s] of [[150,50,1],[480,32,1.3],[700,70,.8]]){ c.beginPath(); c.arc(x,y,18*s,0,TAU); c.arc(x+20*s,y+5,14*s,0,TAU); c.arc(x-18*s,y+6,12*s,0,TAU); c.fill(); } }
    if(V.bg==='sea'){ c.fillStyle='#2f8ad0'; c.fillRect(0,150,W,hz-150); for(const px of [80,720]){ c.strokeStyle='#7a5a3a'; c.lineWidth=7; c.beginPath(); c.moveTo(px,hz); c.quadraticCurveTo(px+8,140,px,100); c.stroke(); c.fillStyle='#3a9a4a'; for(let a=0;a<6;a++){ c.save(); c.translate(px,100); c.rotate(a*1.05); c.beginPath(); c.ellipse(22,0,24,6,.3,0,TAU); c.fill(); c.restore(); } } }
    else if(V.bg==='city'||V.bg==='arena'){ for(let i=0;i<10;i++){ const x=i*84,h=50+R(i)*80; c.fillStyle=V.bg==='arena'?'#24203a':(i%2?'#6a6a7a':'#7a7a8a'); c.fillRect(x,hz-h,78,h); c.fillStyle='rgba(255,230,160,.6)'; for(let r=0;r<h/20;r++) for(let q=0;q<3;q++) if((r+q+i)%3) c.fillRect(x+8+q*24,hz-h+6+r*20,12,10); } }
    else if(V.bg==='school'){ c.fillStyle='#e8dcc8'; c.fillRect(160,110,480,hz-110); c.fillStyle='#c8402a'; c.fillRect(150,102,500,12); c.fillStyle='#8ab8d8'; for(let i=0;i<8;i++) c.fillRect(180+i*56,124,36,26); }
    else if(V.bg==='river'){ c.fillStyle='#7ab0d8'; c.fillRect(0,170,W,hz-170); }
    if(V.bg==='trees'||V.bg==='park'||V.bg==='night'||V.bg==='river'||V.bg==='school'){ for(let i=0;i<9;i++){ const tx=20+i*95+R(i+40)*20; c.fillStyle='#6a4a2a'; c.fillRect(tx-5,hz-60,10,60); c.fillStyle=V.bg==='night'?'#24402a':'#3f8a3a'; c.beginPath(); c.arc(tx,hz-70,26+R(i+60)*10,0,TAU); c.fill(); } }
    // 圍網
    c.strokeStyle='rgba(60,60,70,.35)'; c.lineWidth=1; for(let x=0;x<W;x+=12){ c.beginPath(); c.moveTo(x,hz-74); c.lineTo(x+30,hz); c.moveTo(x+30,hz-74); c.lineTo(x,hz); c.stroke(); } c.fillStyle='#555'; c.fillRect(0,hz-76,W,3); }
  // 地面
  c.fillStyle=V.out; c.fillRect(0,hz,W,H-hz);
  const Q=(pts,col)=>{ c.fillStyle=col; c.beginPath(); pts.forEach((p,i)=>{ const q=proj(p[0],p[1],0,0); i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]); }); c.closePath(); c.fill(); };
  const L=(a,b)=>{ const p=proj(a[0],a[1],0,0),q=proj(b[0],b[1],0,0); c.beginPath(); c.moveTo(p[0],p[1]); c.lineTo(q[0],q[1]); c.stroke(); };
  Q([[BACK-60,-CWD-40],[W-BACK+60,-CWD-40],[W-BACK+60,CWD+40],[BACK-60,CWD+40]],V.court===V.out?shade(V.out,1.05):V.out);
  Q([[BACK,-CWD],[W-BACK,-CWD],[W-BACK,CWD],[BACK,CWD]],V.court);
  if(V.grass){ for(let i=0;i<14;i++){ if(i%2) continue; const x0=BACK+i*(W-2*BACK)/14,x1=BACK+(i+1)*(W-2*BACK)/14; Q([[x0,-CWD],[x1,-CWD],[x1,CWD],[x0,CWD]],shade(V.court,1.08)); } c.fillStyle='rgba(200,180,120,.25)'; Q([[BACK-10,-60],[BACK+40,-60],[BACK+40,60],[BACK-10,60]],'rgba(200,180,120,.22)'); Q([[W-BACK-40,-60],[W-BACK+10,-60],[W-BACK+10,60],[W-BACK-40,60]],'rgba(200,180,120,.22)'); }
  if(V.clay){ for(let i=0;i<220;i++){ const q=proj(BACK-40+R(i)*(W-2*BACK+80),(R(i+300)-.5)*2*(CWD+30),0,0); c.fillStyle='rgba(255,200,160,'+(.08+R(i+600)*.12)+')'; c.fillRect(q[0],q[1],2*q[2],1); } }
  c.strokeStyle='#fff'; c.lineWidth=2.4; L([BACK,-CWD],[W-BACK,-CWD]); L([BACK,CWD],[W-BACK,CWD]); L([BACK,-CWS],[W-BACK,-CWS]); L([BACK,CWS],[W-BACK,CWS]); L([BACK,-CWD],[BACK,CWD]); L([W-BACK,-CWD],[W-BACK,CWD]);
  L([NETX-SVC,-CWS],[NETX-SVC,CWS]); L([NETX+SVC,-CWS],[NETX+SVC,CWS]); L([NETX-SVC,0],[NETX+SVC,0]); L([BACK,0],[BACK+8,0]); L([W-BACK,0],[W-BACK-8,0]);
  return BGC[v]=e; }
function drawNet(c,ct){ const a=proj(NETX,-CWD-18,0,ct),b=proj(NETX,CWD+18,0,ct),at=proj(NETX,-CWD-18,GY-NETTOP+8,ct),bt=proj(NETX,CWD+18,GY-NETTOP+8,ct),mt=proj(NETX,0,GY-NETTOP,ct);
  c.fillStyle='rgba(20,20,26,.45)'; c.beginPath(); c.moveTo(at[0],at[1]); c.quadraticCurveTo(mt[0],mt[1]+3,bt[0],bt[1]); c.lineTo(b[0],b[1]); c.lineTo(a[0],a[1]); c.closePath(); c.fill();
  c.strokeStyle='rgba(255,255,255,.25)'; c.lineWidth=1; for(let i=1;i<32;i++){ const u=i/32,x=lerp(a[0],b[0],u); c.beginPath(); c.moveTo(x,lerp(at[1],bt[1],u)+2); c.lineTo(x,lerp(a[1],b[1],u)); c.stroke(); }
  c.strokeStyle='#fff'; c.lineWidth=3.5; c.beginPath(); c.moveTo(at[0],at[1]); c.quadraticCurveTo(mt[0],mt[1]+3,bt[0],bt[1]); c.stroke(); c.fillStyle='#2a2a30'; c.fillRect(a[0]-3,at[1]-2,6,a[1]-at[1]+2); c.fillRect(b[0]-3,bt[1]-2,6,b[1]-bt[1]+2); }

function drawBall(c,b,ct){ const g=proj(b.x,b.w||0,0,ct),p=proj(b.x,b.w||0,GY-b.y,ct),r=Math.max(2.5,6.5*p[2]*.62);
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(g[0],g[1],r*1.3,r*.5,0,0,TAU); c.fill();
  const gr=c.createRadialGradient(p[0]-r*.35,p[1]-r*.35,r*.1,p[0],p[1],r); gr.addColorStop(0,'#f6ff8a'); gr.addColorStop(1,'#b8d020'); c.fillStyle=gr; c.beginPath(); c.arc(p[0],p[1],r,0,TAU); c.fill();
  c.strokeStyle='rgba(255,255,255,.9)'; c.lineWidth=Math.max(1,r*.18); const a=b.x*.06; c.beginPath(); c.arc(p[0]+Math.cos(a)*r*.9,p[1]+Math.sin(a)*r*.9,r*.75,a+2.2,a+4.1); c.stroke(); c.beginPath(); c.arc(p[0]-Math.cos(a)*r*.9,p[1]-Math.sin(a)*r*.9,r*.75,a-.95,a+.95); c.stroke(); }

/* ---------- 遊戲 ---------- */
function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,two=!net&&opts.mode==='2p',solo=!net&&!two,OPT=opts.options||{};
  const dbl=net?(net.count>2||OPT.fmt==='doubles'):OPT.fmt==='doubles',N=dbl?4:2,me=net?Math.min(N-1,net.me):0,CW=dbl?CWD:CWS;
  const {ctx:c}=env.canvas2d(W,H),si=clamp(opts.stage|0,0,LV-1),ST=STAGES[si],VEN=solo?ST.v:clamp(+OPT.court||0,0,VENUES.length-1),V=VENUES[VEN];
  SURF=V.clay?{rest:1.08,sp:.9}:V.grass?{rest:.86,sp:1.04}:{rest:1,sp:1};
  const LEN=OPT.len==='g6'?6:OPT.len==='g4'?4:2,TBAT=LEN>2?LEN:99; // 局數平手 LEN:LEN 時搶七
  const vsAI=solo||(net&&net.count<2)||(two&&dbl),k=vsAI?ST.k:1,AI={spd:150+105*k,react:.4-.24*k,err:190-155*k,lat:130-95*k,miss:.15*(1-k)};
  const ctrl=[]; for(let i=0;i<N;i++){ let cc='ai';
    if(net){ if(i<net.count) cc=i===me?'self':'net'; }
    else if(two){ if(!dbl) cc=i===0?'key0':'key1'; else if(OPT.team==='coop') cc=i===0?'key0':i===2?'key1':'ai'; else cc=i===0?'key0':i===1?'key1':'ai'; }
    else cc=i===0?'solo':'ai'; ctrl.push(cc); }
  const isAI=i=>ctrl[i]==='ai',human=i=>!isAI(i);
  const ALTC=['#ff5d6d',solo&&!dbl?ST.col:'#4f9dff','#ff7eb6','#3ddbd9'];
  const RW=tm=>tm?-1:1; // 這隊的「右手邊」在 w 的哪個方向
  const ps=Array.from({length:N},(_,i)=>{ const tm=i%2,lk=Object.assign({},(net?net.looks&&net.looks[i]:null)||(i===0?opts.look:null)||{color:ALTC[i],hair:i%3});
    if(!lk.color) lk.color=ALTC[i]; return {n:i,team:tm,side:dbl?(i<2?1:-1):1,x:tm?700:100,w:0,face:tm?-1:1,sw:0,hitOK:false,dk:false,moving:false,tx:tm?700:100,tw:0,look:lk,aim:0,swType:'ready',run:0,svA:0}; });
  for(let i=1;i<N;i++) if(ps[i].team!==ps[0].team&&ps[i].look.color===ps[0].look.color) ps[i].look.color='#4f9dff';
  const nm=i=>net?(i<net.count?(net.names[i]||'玩家 '+(i+1)):'電腦'+(i+1)):ctrl[i]==='key0'?'1P':ctrl[i]==='key1'?'2P':ctrl[i]==='solo'?(opts.name||'你'):(dbl&&ps[i].team===0?'電腦隊友':ST.foe+(dbl?(i<2?'A':'B'):''));
  const names=ps.map((p,i)=>nm(i)),myTeam=ps[me].team,CT=net?myTeam:0,TN=tm=>dbl?(!two&&tm===myTeam?'我方':tm?'右隊':'左隊'):names[tm];
  const ball={x:0,y:0,w:0,vx:0,vy:0,vw:0,bn:0,tx:0,ty:0,tw:0,spin:''},fx=[],pts=[0,0],games=[0,0];
  // 發球順序：單打兩人輪流；雙打照「A 隊第一位、B 隊第一位、A 隊第二位、B 隊第二位」輪流，每局換一次
  const F=opts.first===1?1:0,ORD=dbl?[ps.find(p=>p.team===F&&p.side===1).n,ps.find(p=>p.team!==F&&p.side===1).n,ps.find(p=>p.team===F&&p.side===-1).n,ps.find(p=>p.team!==F&&p.side===-1).n]:[F,1-F];
  let t=0,phase='serve',gIdx=0,tb=false,tbFirst=0,server=ORD[0],servT=ps[ORD[0]].team,svNo=1,hits=0,lastHit=-1,lastTeam=-1,ptT=0,lastW=-1,msg='',msgT=0,ended=false,overT=0,introT=2.4,aiServeT=1.2,rally=0,best=0,ev=[],sendT=0,shake=0,svSign=1,tossT=0,aces=[0,0];
  const aiS={},rin={}; for(let i=0;i<N;i++){ aiS[i]={pred:null,t:0,dec:{n:-1},react:0}; rin[i]={dx:0,dy:0,sw:false,dk:false}; }
  const sfx=n=>{ env.sfx(n); if(net&&net.host) ev.push(n); };
  const pop=(txt,col,x,w,h)=>fx.push({k:'txt',txt,col,x,w,h,t:0});
  const PN=['0','15','30','40'];
  // 報分：發球方的分數先講
  function callStr(){ const a=pts[servT],b=pts[1-servT]; if(tb) return a+'－'+b;
    if(a>=3&&b>=3) return a===b?'Deuce（40 平）':'占先 '+TN(a>b?servT:1-servT); return (PN[a]||'40')+'－'+(PN[b]||'40'); }
  const tbPts=()=>pts[0]+pts[1];
  function setServe(){ phase='serve'; hits=0; lastHit=-1; lastTeam=-1; rally=0; ball.bn=0; aiServeT=1.2; tossT=0;
    const tot=tb?tbPts():pts[0]+pts[1]; server=tb?ORD[(tbFirst+Math.floor((tot+1)/2))%ORD.length]:ORD[gIdx%ORD.length]; servT=ps[server].team;
    const S=ps[server]; svSign=RW(S.team)*(tot%2?-1:1); // 總分偶數站右半邊、奇數站左半邊
    for(const p of ps){ const base=p.team?1:-1; p.sw=0; p.svA=0;
      if(p===S){ p.x=p.team?W-BACK+16:BACK-16; p.w=svSign*44; }
      else if(p.team===servT){ p.x=NETX+base*120; p.w=-svSign*80; } // 發球方搭檔站網前另一半
      else { const recv=!dbl||RW(p.team)*p.side===-svSign; if(recv){ p.x=p.team?W-BACK+26:BACK-26; p.w=-svSign*84; } else { p.x=NETX+base*SVC; p.w=svSign*84; } } }
    for(const i in aiS) aiS[i].pred=null; }
  setServe();
  function keyIn(which){ const kk=env.keys;
    if(which==='key0') return {dx:(kk.KeyD?1:0)-(kk.KeyA?1:0),dy:(kk.KeyW?1:0)-(kk.KeyS?1:0),sw:env.hit('KeyF')||env.hit('Space'),dk:env.hit('KeyG')};
    if(which==='key1') return {dx:(kk.ArrowRight?1:0)-(kk.ArrowLeft?1:0),dy:(kk.ArrowUp?1:0)-(kk.ArrowDown?1:0),sw:env.hit('Enter')||env.hit('NumpadEnter'),dk:env.hit('ShiftRight')||env.hit('Slash')};
    return {dx:(kk.ArrowRight||kk.KeyD?1:0)-(kk.ArrowLeft||kk.KeyA?1:0),dy:(kk.ArrowUp||kk.KeyW?1:0)-(kk.ArrowDown||kk.KeyS?1:0),sw:env.hit('Space')||env.hit('KeyJ')||env.hit('Enter'),dk:env.hit('KeyX')||env.hit('KeyK')}; }
  const mySide=p=>p.team?ball.x>NETX+4:ball.x<NETX-4;
  const isOut=(x,w)=>x<BACK-3||x>W-BACK+3||Math.abs(w)>CW+3;
  // 電腦：照球的路線找最早跑得到、打得到的點（接發球一定要等彈地；在底線的時候不截擊）
  function predict(p){ const b={x:ball.x,y:ball.y,w:ball.w,vx:ball.vx,vy:ball.vy,vw:ball.vw,spin:ball.spin},sp=AI.spd,netMan=Math.abs(p.x-NETX)<230; let bn=ball.bn,last=null;
    for(let i=1;i<520;i++){ stepB(b,1/90); if(b.y>=GY){ if(bn>=1) break; bn=1; b.y=GY; bounce(b); }
      if(p.team?b.x<=NETX+8:b.x>=NETX-8) continue; const vol=bn===0; if(vol&&(hits===1||!netMan&&Math.abs(b.x-NETX)>200)) continue; const h=GY-b.y; if(h>(vol?200:150)||h<14) continue; last={x:b.x,w:b.w,vol,t:i/90};
      const need=Math.max(0,Math.hypot(b.x-p.x,b.w-p.w)-REACH*.5)/sp+AI.react; if(need<=i/90) return last; } return last; }
  function mine(p,pred){ if(!dbl||!pred) return true; const mate=ps.find(q=>q.team===p.team&&q!==p),dm=Math.hypot(mate.x-pred.x,mate.w-pred.w),dp=Math.hypot(p.x-pred.x,p.w-pred.w); return human(mate.n)?(Math.sign(pred.w||1)===Math.sign(p.w||1)&&dp<dm+60):dp<=dm; }
  // 這一球（還沒彈地）會不會出界：越強的電腦越會「放掉」出界球
  function willOut(){ if(ball.bn!==0) return false; const s={x:ball.x,y:ball.y,vx:ball.vx,vy:ball.vy,spin:ball.spin}; let w=ball.w,tt=0; for(let i=0;i<500;i++){ stepB(s,1/90); tt+=1/90; if(s.y>=GY) break; } w+=(ball.vw||0)*tt; return isOut(s.x,w); }
  function aiInput(p,dt){ const o={dx:0,dy:0,sw:false,dk:false,wx:0,ww:0},A=aiS[p.n],dir=p.face;
    if(phase==='serve'){ if(server===p.n&&introT<=0&&tossT<=0&&(aiServeT-=dt)<=0){ o.sw=true; aiServeT=9; } return o; }
    if(phase!=='play') return o;
    const coming=lastTeam>=0&&lastTeam!==p.team;
    if(coming){ if((A.t-=dt)<=0||!A.pred){ A.t=.1; A.pred=predict(p); if(A.dec.n!==hits){ A.dec={n:hits,whiff:Math.random()<(ball.smash?.4-.3*k:.08-.07*k),off:Math.random()<AI.miss?(Math.random()-.5)*90:0,leave:willOut()&&Math.random()<.35+.65*k}; } } A.react-=dt; }
    else { A.pred=null; A.react=AI.react; }
    // 站位：底線中央附近，越強越會往對手打過來的那邊預先偏；雙打發球方搭檔守網前，強的電腦接完發球也會上網
    const base=p.team?W-BACK+14:BACK-14,netPos=NETX-dir*125,mate=dbl?ps.find(q=>q.team===p.team&&q!==p):null;
    const atNet=dbl&&(hits<=1?(p.team===servT&&p.n!==server):(Math.abs(p.x-NETX)<170||(k>.5&&mate&&Math.abs(mate.x-NETX)>170&&p.n!==lastHit&&p.team===servT)));
    const ant=coming?ball.w:ball.w+(ball.vw||0)*.35,sh=clamp(ant,-CW,CW)*(.12+.42*k),homeW=(dbl?RW(p.team)*p.side*70:0)+sh;
    let tx=atNet?netPos:base,tw=homeW;
    if(coming) A.rt=0; else A.rt=(A.rt||0)+dt; const lazy=!coming&&(A.rt<(1-k)*.5||Math.hypot(tx-p.x,tw-p.w)<(1-k)*70);
    if(lazy){ tx=p.x; tw=p.w; }
    const go=coming&&A.pred&&mine(p,A.pred)&&!A.dec.leave; if(go){ tx=A.pred.x-dir*8+(A.dec.off||0); tw=A.pred.w; }
    tx=p.team?clamp(tx,NETX+24,W+70):clamp(tx,-70,NETX-24);
    o.wx=tx-p.x; o.ww=tw-p.w;
    if(A.react<=0&&go&&mySide(p)&&!(ball.bn===0&&hits===1)&&reachD(p,ball)<REACH*.9&&!(A.dec.n===hits&&A.dec.whiff)) o.sw=true; return o; }
  function inputOf(p,dt){ const cc=ctrl[p.n]; if(cc==='ai') return aiInput(p,dt); if(cc==='net'){ const r=rin[p.n],o={dx:r.dx,dy:r.dy,sw:r.sw,dk:r.dk}; r.sw=r.dk=false; return o; } return keyIn(cc==='self'?'solo':cc); }
  // 擊球：自動判斷抽球（上旋）、截擊、高壓扣殺；「小球」＝放小球，對手在網前時自動改挑高球
  function shoot(p,dk){ const dir=p.face,R=Math.random,ai=isAI(p.n),near=Math.abs(p.x-NETX)<200,high=ball.y<GY-150,vol=ball.bn===0,opp=ps.filter(q=>q.team!==p.team),oppNet=opp.some(o=>Math.abs(o.x-NETX)<200);
    let type=high&&(near||ball.y<GY-175)?'smash':dk?(oppNet?'lob':'drop'):vol&&near?'volley':'drive';
    if(ai&&type==='drive'){ if(oppNet&&R()<.25+.4*k) type='lob'; else if(!oppNet&&near&&R()<.25*k) type='drop'; }
    const oppBack=dir>0?W-BACK:BACK; let tx,v=null;
    if(type==='drop') tx=NETX+dir*(40+R()*80); else if(type==='lob') tx=oppBack-dir*(40+R()*90); else if(type==='smash') tx=NETX+dir*(SVC+R()*160); else if(type==='volley') tx=NETX+dir*(150+R()*170); else tx=oppBack-dir*(45+R()*190);
    if(ai) tx+=(R()-.5)*AI.err;
    if(type==='smash') v=aimFixed(ball.x,ball.y,tx,ai?640+220*k:860,dir,-40,12,SVC*.5,W);
    else if(type==='drive') v=aimFixed(ball.x,ball.y,tx,ai?470+230*k:640,dir,-4,24,SVC*.6,W,'top');
    else if(type==='volley') v=aimFixed(ball.x,ball.y,tx,ai?440+160*k:540,dir,-14,16,60,W);
    else if(type==='lob') v=aimShot(ball.x,ball.y,tx,[48,55,62,68],dir,60,'top');
    else v=aimShot(ball.x,ball.y,tx,[14,22,30,38],dir,10,'slice');
    const oppW=opp.reduce((a,o)=>a+o.w,0)/opp.length; let tw=p.aim?p.aim*(60+R()*(CW-80)):(oppW>0?-1:1)*(40+R()*(CW-80)); if(type==='drop') tw=clamp(ball.w*.4+(R()-.5)*90,-CW+20,CW-20);
    if(ai) tw+=(R()-.5)*AI.lat; tw=clamp(tw,-CW+10,CW-10);
    v=v||aimShot(ball.x,ball.y,oppBack-dir*140,[24,32,40,50],dir,12,'top')||aimShot(ball.x,ball.y,NETX+dir*220,[36,48,60],dir)||{vx:dir*320,vy:-420,t:1};
    // 擊球品質 e：撲球、邊跑邊打、低球、放小球最容易失手；電腦照關卡
    const stretch=clamp(reachD(p,ball)/REACH,0,1),lowB=ball.y>GY-26?1:0,baseE={drop:.4,lob:.32,drive:.24,volley:.26,smash:.22}[type]||.25;
    let e=baseE*(1+stretch*1.6+(p.moving?.45:0)+lowB*.6)*(ai?(1.45-1.05*k):1);
    const gs=()=>((R()+R()+R())/1.5-1); v={vx:v.vx*(1+gs()*e*.4),vy:v.vy*(1+gs()*e*.4),t:v.t}; tw+=gs()*e*150;
    ball.vx=v.vx; ball.vy=v.vy; ball.vw=(tw-ball.w)/Math.max(.25,v.t||1); ball.bn=0; ball.net=0; ball.spin=type==='drive'||type==='lob'?'top':type==='drop'?'slice':''; ball.smash=type==='smash';
    lastHit=p.n; lastTeam=p.team; hits++; rally++; best=Math.max(best,rally);
    p.swType=type==='smash'?'over':type==='drop'?'slice':type==='volley'?'volley':((ball.w-p.w)*RW(p.team)>=0?'fh':'bh'); p.sw=SWD*.55;
    if(type==='smash'){ sfx('boom'); shake=.2; pop('高壓扣殺！','#ff5d8f',ball.x,ball.w,GY-ball.y+40); } else { sfx(type==='drive'?'place':'pop'); const L={drop:'放小球',lob:'挑高球',volley:'截擊'}[type]; if(L) pop(L,'#7af0ff',ball.x,ball.w,GY-ball.y+40); }
    fx.push({k:'ring',x:ball.x,w:ball.w,h:GY-ball.y,t:0,col:ball.smash?'#ff5d8f':'#fff'}); }
  function winGame(wt){ const brk=wt!==servT&&!tb; games[wt]++; pts[0]=pts[1]=0; gIdx++; const wasTb=tb; tb=false;
    if(wasTb){ gIdx=tbFirst+1; } // 搶七之後，由搶七第一位發球員的下一位發下一局
    const gw=games[wt],gl=games[1-wt],done=LEN===2?gw>=2:(wasTb||gw>=LEN&&gw-gl>=2);
    if(done){ phase='over'; overT=0; return '拿下這盤！'; }
    if(games[0]===TBAT&&games[1]===TBAT){ tb=true; tbFirst=gIdx; return '局數 '+TBAT+'：'+TBAT+'，進入搶七'; }
    return (brk?'破發！':'保發！')+'局數 '+games[wt]+'：'+games[1-wt]; }
  function pointTo(wt,why){ if(phase!=='play'&&phase!=='serve') return; phase='point'; ptT=1.7; lastW=wt; let txt;
    svNo=1; pts[wt]++; const a=pts[wt],b=pts[1-wt];
    if(tb?(a>=7&&a-b>=2):(a>=4&&a-b>=2)) txt=winGame(wt); else txt='報分 '+callStr();
    const my=wt===myTeam; msg=(two?(dbl?TN(wt):wt?'2P':'1P')+' 得分　':my?'得分！':'對手得分　')+txt+'　'+why; msgT=1.7;
    env.sfx(two||my?'item':'hurt'); if(net) ev.push('p'+wt); }
  function fault(why){ if(svNo===1){ svNo=2; phase='point'; ptT=1.2; msg='一發失誤（'+why+'），第二發球'; msgT=1.2; sfx('bump'); return; } svNo=1; pointTo(1-servT,'雙發失誤（'+why+'）'); }
  function conclude(a,b,note){ if(ended) return; ended=true; const w=a>b?0:1,my=two||w===myTeam;
    if(solo&&w===0) LS(recKey(si),a+':'+b); env.sfx(my?'win':'lose');
    env.end({title:two?(dbl?TN(w):w?'2P':'1P')+' 獲勝！':my?(solo?'贏了！過關':'你們贏了！'):'輸了',big:a+' : '+b,text:(note?note+' ':'')+'局數 '+a+' : '+b+'。'+(solo?ST.name+'　對手：'+ST.foe+(dbl?'隊':'')+'。':'')+(best>3?'最長來回 '+best+' 拍。':''),score:solo&&w===0?si+1:null,next:solo&&w===0&&si<LV-1}); }
  function snap(){ const m={s:[ps.map(p=>[r1(p.x),r1(p.w),r1(p.sw),r1(p.svA),p.moving?1:0,p.swType]),r1(ball.x),r1(ball.y),r1(ball.w),r1(ball.vx),r1(ball.vy),r1(ball.vw),pts[0],pts[1],games[0],games[1],servT,server,svNo,['serve','play','point','over'].indexOf(phase),hits,lastW,lastTeam,tb?1:0,svSign],e:ev,m:msgT>0?msg:''}; ev=[]; return m; }
  if(net){ if(client) net.onmsg=m=>{ if(m.s){ const s=m.s; s[0].forEach((q,i)=>{ const p=ps[i]; if(!p) return; p.tx=q[0]; p.tw=q[1]; p.sw=q[2]; p.svA=q[3]; p.moving=!!q[4]; p.swType=q[5]; }); ball.tx=s[1]; ball.ty=s[2]; ball.tw=s[3]; ball.vx=s[4]; ball.vy=s[5]; ball.vw=s[6]; pts[0]=s[7]; pts[1]=s[8]; games[0]=s[9]; games[1]=s[10]; servT=s[11]; server=s[12]; svNo=s[13]; phase=['serve','play','point','over'][s[14]]; hits=s[15]; lastW=s[16]; lastTeam=s[17]; tb=!!s[18]; svSign=s[19];
        for(const n of m.e){ if(n==='p0'||n==='p1') env.sfx(+n[1]===myTeam?'item':'hurt'); else env.sfx(n); } if(m.m){ msg=m.m; msgT=1.4; } } else if(m.end) conclude(m.end[0],m.end[1],m.end[2]); };
    else { net.onmsg=(m,from)=>{ if(m.i&&rin[from]){ const r=rin[from]; r.dx=m.i[0]; r.dy=m.i[1]; if(m.i[2]) r.sw=true; if(m.i[3]) r.dk=true; } };
      net.onleave=i=>{ if(i<N&&!ended) ctrl[i]='ai'; }; } }
  function movePlayer(p,i,dt){ const sp=isAI(p.n)?AI.spd:240,cam=net?p.team:0,fx2=cam?-1:1; let mx,mw;
    if(isAI(p.n)){ const d=Math.hypot(i.wx||0,i.ww||0); mx=d>4?(i.wx/d)*Math.min(1,d/28):0; mw=d>4?(i.ww/d)*Math.min(1,d/28):0; }
    else { mx=(i.dy||0)*fx2; mw=(i.dx||0)*fx2; const l=Math.hypot(mx,mw); if(l>1){ mx/=l; mw/=l; } p.aim=(i.dx||0)*fx2; }
    p.moving=Math.abs(mx)+Math.abs(mw)>.05&&!(phase==='serve'&&p.n===server&&tossT>0);
    if(phase==='serve'&&p.n===server){ if(tossT<=0){ p.w=svSign>0?clamp(p.w+mw*sp*dt,10,CW-10):clamp(p.w+mw*sp*dt,-CW+10,-10); } } // 發球前只能沿著底線左右移動
    else if(phase==='serve'){ }
    else { p.x+=mx*sp*dt; p.w=clamp(p.w+mw*sp*dt,-CW-60,CW+60); const lo=p.team?NETX+18:-80,hi=p.team?W+80:NETX-18; p.x=clamp(p.x,lo,hi); }
    if(phase==='serve'&&p.n===server){ if(i.sw&&tossT<=0&&introT<=0&&phase==='serve'){ tossT=.62; p.svA=.001; sfx('click'); } }
    else if(i.sw&&p.sw<=0&&phase!=='serve'){ p.sw=SWD; p.hitOK=true; p.dk=false; p.swType=ball.y<GY-150?'over':(ball.w-p.w)*RW(p.team)>=0?'fh':'bh'; }
    else if(i.dk&&p.sw<=0&&phase!=='serve'){ p.sw=SWD; p.hitOK=true; p.dk=true; p.swType='slice'; }
    if(p.sw>0) p.sw-=dt; if(p.svA>0){ p.svA+=dt/SVD; if(p.svA>=1) p.svA=0; }
    if(p.moving) p.run+=dt*11; }
  function doServe(p){ const dir=p.face,R=Math.random,ai=isAI(p.n),first=svNo===1,sp=first?(ai?560+200*k:720):(ai?440+120*k:500),tx=NETX+dir*(SVC-34-R()*(first?60:90));
    let v=aimFixed(ball.x,ball.y,tx,sp,dir,-18,20,30,SVC-6,first?'':'top')||aimFixed(ball.x,ball.y,tx,sp*.85,dir,-18,24,30,SVC-6,'top')||aimShot(ball.x,ball.y,tx,[4,10,16,24],dir,8,'top')||{vx:dir*520,vy:-80,t:.9};
    let tw=-svSign*(26+R()*(CWS-56)); // 發到斜對角的發球區
    const gs=()=>((R()+R()+R())/1.5-1),e=(first?.6:.22)*(ai?(1.45-1.1*k):1); v={vx:v.vx*(1+gs()*e*.12),vy:v.vy+gs()*e*150,t:v.t}; tw+=gs()*e*110;
    ball.vx=v.vx; ball.vy=v.vy; ball.vw=(tw-ball.w)/Math.max(.3,v.t||1); ball.bn=0; ball.net=0; ball.smash=false; ball.spin=first?'':'top';
    lastHit=p.n; lastTeam=p.team; hits=1; rally=1; phase='play'; sfx(first?'boom':'pop'); pop(first?'第一發球':'第二發球','#fff',ball.x,ball.w,240); fx.push({k:'ring',x:ball.x,w:ball.w,h:GY-ball.y,t:0,col:'#fff'}); }
  let lastIn='';
  function update(dt){ t+=dt; if(introT>0) introT-=dt; if(msgT>0) msgT-=dt; if(shake>0) shake-=dt; for(const f of fx) f.t+=dt; for(let i=fx.length-1;i>=0;i--) if(fx[i].t>1) fx.splice(i,1);
    if(client){ const i=keyIn('solo'),key=''+i.dx+i.dy; sendT-=dt; if(key!==lastIn||i.sw||i.dk||sendT<=0){ lastIn=key; sendT=1/20; net.send({i:[i.dx,i.dy,+i.sw,+i.dk]}); }
      const f=Math.min(1,dt*18); for(const p of ps){ p.x+=(p.tx-p.x)*f; p.w+=(p.tw-p.w)*f; if(p.moving) p.run+=dt*11; } if(Math.hypot(ball.tx-ball.x,ball.ty-ball.y)>90){ ball.x=ball.tx; ball.y=ball.ty; ball.w=ball.tw; } else { ball.x+=(ball.tx-ball.x)*f; ball.y+=(ball.ty-ball.y)*f; ball.w+=(ball.tw-ball.w)*f; } return; }
    if(ended) return; if(net){ sendT-=dt; if(sendT<=0){ sendT=1/20; net.send(snap()); } }
    if(phase==='over'){ overT+=dt; if(overT>1.8){ if(net){ net.send(snap()); net.send({end:[games[0],games[1],'']}); } conclude(games[0],games[1]); } return; }
    for(const p of ps) movePlayer(p,inputOf(p,dt),dt);
    if(phase==='point'){ ptT-=dt; if(ball.y<GY){ stepB(ball,dt); if(ball.y>GY) ball.y=GY; } if(ptT<=0) setServe(); return; }
    if(phase==='serve'){ const p=ps[server],hx=p.x+p.face*10,hw=p.w-RW(p.team)*6;
      if(tossT>0){ tossT-=dt; const u=1-tossT/.62; ball.x=hx+p.face*8*u; ball.w=hw; ball.y=GY-110-Math.sin(u*Math.PI*.5)*120;
        if(tossT<=0){ ball.y=GY-226; doServe(p); } }
      else { ball.x=hx; ball.y=GY-104; ball.w=hw; ball.vx=0; ball.vy=0; ball.vw=0; }
      return; }
    const n=Math.max(1,Math.ceil(dt*240)); for(let s=0;s<n&&phase==='play';s++){ const px=ball.x; stepB(ball,dt/n);
      if((px-NETX)*(ball.x-NETX)<=0&&ball.y>NETTOP-6&&Math.abs(ball.w)<CWD+18){ if(ball.y>NETTOP+2){ ball.x=NETX-Math.sign(ball.vx||1)*6; ball.vx*=-.15; ball.vw*=.3; ball.vy=Math.max(0,ball.vy)*.3; ball.net=1; sfx('bump'); fx.push({k:'ring',x:NETX,w:ball.w,h:GY-ball.y,t:0,col:'#ff8a8a'}); } else { ball.vy=Math.min(ball.vy,0)-40; ball.vx*=.75; ball.net=2; fx.push({k:'ring',x:NETX,w:ball.w,h:GY-NETTOP,t:0,col:'#aaa'}); } }
      for(const p of ps){ if(p.sw>.04&&p.hitOK&&reachD(p,ball)<REACH){ if(!mySide(p)||p.team===lastTeam) continue;
          if(ball.bn===0&&hits===1) continue; // 接發球要等彈地
          p.hitOK=false; shoot(p,p.dk); break; } }
      if(phase!=='play') break;
      if(ball.y>=GY){ ball.y=GY; const sideT=ball.x<NETX?0:1,ht=lastTeam;
        if(ball.bn===0){
          if(hits===1){ const box=sideT!==ht&&Math.abs(ball.x-NETX)<=SVC+3&&Math.abs(ball.w)<=CWS+3&&ball.w*-svSign>=-3;
            if(box&&ball.net===2){ phase='point'; ptT=1.1; msg='擦網（Let），重新發球'; msgT=1.1; sfx('click'); break; }
            if(!box){ fault(sideT===ht?(ball.net?'掛網':'沒過網'):Math.abs(ball.x-NETX)>SVC+3?'出發球線':Math.abs(ball.w)>CWS+3?'出邊線':'沒發到斜對角'); break; } }
          else if(sideT===ht){ pointTo(1-ht,ball.net?'掛網':'球沒過網'); break; }
          else if(isOut(ball.x,ball.w)){ pointTo(1-ht,Math.abs(ball.w)>CW+3?'出邊線':'出底線'); break; }
          ball.bn=1; bounce(ball); sfx('land'); fx.push({k:'dust',x:ball.x,w:ball.w,h:0,t:0}); if(V.clay) fx.push({k:'mark',x:ball.x,w:ball.w,t:0}); }
        else { if(hits===1){ aces[ht]++; pointTo(ht,'發球得分（Ace）'); } else pointTo(ht,'球彈地兩次'); break; } } } }
  function draw(){ c.save(); if(shake>0) c.translate((Math.random()-.5)*6,(Math.random()-.5)*5); const ct=CT;
    c.drawImage(courtBg(VEN),0,0);
    const items=[]; for(const p of ps){ const q=proj(p.x,p.w,0,ct); items.push({d:q[3],f:()=>{ const back=p.team===ct,sv=p.svA>0; drawHuman(c,q[0],q[1],q[2]*SCP,!back,p.look,{u:sv?p.svA:p.sw>0?1-p.sw/SWD:0,type:sv?'tserve':p.sw>0?p.swType:'ready',run:p.run,mv:p.moving?1:0,crouch:phase==='play'?.6:.3,pad:{face:p.look.face||(p.team?'#2a6ad8':'#e83a3a'),grip:p.look.grip},label:lbl(p)},t); }}); }
    { const q=proj(NETX,0,0,ct); items.push({d:q[3]+.5,f:()=>drawNet(c,ct)}); }
    { const q=proj(ball.x,ball.w,0,ct); items.push({d:q[3]-6,f:()=>drawBall(c,ball,ct)}); }
    items.sort((a,b)=>b.d-a.d).forEach(it=>it.f());
    for(const f of fx){ const a=1-f.t,q=proj(f.x,f.w||0,f.h||0,ct); if(f.k==='ring'){ c.strokeStyle=f.col; c.globalAlpha=a; c.lineWidth=3; c.beginPath(); c.arc(q[0],q[1],(5+f.t*30)*q[2]*.6,0,TAU); c.stroke(); c.globalAlpha=1; }
      else if(f.k==='dust'){ c.fillStyle=V.clay?'rgba(230,140,90,'+a*.8+')':'rgba(255,255,255,'+a*.7+')'; for(let i=0;i<7;i++){ const an=Math.PI+i*Math.PI/6; c.beginPath(); c.arc(q[0]+Math.cos(an)*f.t*30*q[2]*.6,q[1]+Math.sin(an)*f.t*10*q[2]*.6,2.5,0,TAU); c.fill(); } }
      else if(f.k==='mark'){ c.fillStyle='rgba(120,50,20,'+a*.5+')'; c.beginPath(); c.ellipse(q[0],q[1],8*q[2],3*q[2],0,0,TAU); c.fill(); }
      else if(f.k==='txt'){ c.globalAlpha=a; c.font='900 20px '+TC; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='#14122b'; c.strokeText(f.txt,q[0],q[1]-f.t*30); c.fillStyle=f.col; c.fillText(f.txt,q[0],q[1]-f.t*30); c.globalAlpha=1; } }
    c.restore();
    // 記分板：局數＋這一局的報分（發球方先講）
    c.fillStyle='rgba(11,10,28,.82)'; rr(c,W/2-250,6,500,80,14); c.fill(); c.textAlign='center'; c.textBaseline='middle';
    const tName=tm=>dbl?ps.filter(p=>p.team===tm).map(p=>names[p.n]).join('＋'):names[tm],lt=ct===0?0:1;
    c.font='900 15px '+TC; c.fillStyle=ps[1-lt].look.color; c.fillText(tName(1-lt),W/2-160,22,150); c.fillStyle=ps[lt].look.color; c.fillText(tName(lt),W/2+160,22,150);
    c.font='700 12px '+TC; c.fillStyle='#cfd2e8'; c.fillText('局數',W/2,13);
    c.font='900 28px '+TC; c.fillStyle='#fff'; c.fillText(games[1-lt]+'　:　'+games[lt],W/2,34);
    c.fillStyle='#ffd23f'; c.font='900 13px '+TC; c.fillText('🎾 發球',servT===lt?W/2+160:W/2-160,42);
    c.font='900 16px '+TC; c.fillStyle='#ffd23f'; c.fillText((tb?'搶七 ':'這一局 ')+callStr()+(phase==='serve'||phase==='play'&&hits===1?'　'+(svNo===1?'第一發球':'第二發球'):''),W/2,60,470);
    c.font='700 12px '+TC; c.fillStyle='#cfd2e8'; c.fillText((dbl?'雙打・':'單打・')+(LEN===2?'先贏 2 局':LEN===4?'短盤：先贏 4 局（4：4 搶七）':'一盤：先贏 6 局（6：6 搶七）'),W/2,77,460);
    const my=ps[me],tch=document.body.classList.contains('touch'),meServe=two?human(server):server===me;
    if(phase==='serve'&&introT<=0){ const sd=svSign*RW(servT)>0; c.fillStyle='rgba(11,10,28,.7)'; rr(c,W/2-210,94,420,28,14); c.fill(); c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText((dbl?names[server]+'在':'從')+(sd?'右':'左')+'半場發球，發到斜對角的發球區',W/2,108,400);
      if(meServe&&tossT<=0){ c.fillStyle='#7af0ff'; c.font='900 14px '+TC; c.fillText(tch?'按「揮拍」拋球發球（可以先左右移動站位）':'空白鍵拋球發球（← → 可以先移動站位）',W/2,134,440); } }
    if(msgT>0&&phase!=='serve'){ c.font='900 26px '+TC; c.lineWidth=6; c.strokeStyle='#14122b'; c.strokeText(msg,W/2,180,780); c.fillStyle='#ffd23f'; c.fillText(msg,W/2,180,780); }
    if(introT>0&&solo){ c.font='900 26px '+TC; c.lineWidth=6; c.strokeStyle='#14122b'; const s2='第 '+(si+1)+' 關　對手：'+ST.foe+(dbl?'隊':''); c.strokeText(s2,W/2,180); c.fillStyle='#ffd23f'; c.fillText(s2,W/2,180); } }
  const lbl=p=>introT>0||(dbl&&phase==='serve'&&p.n===server)?(two?(ctrl[p.n]==='key0'?'1P':ctrl[p.n]==='key1'?'2P':''):(p.n===me?'你':dbl&&p.team===myTeam?'隊友':'')):'';
  return {update,draw,destroy(){},_dbg:{ps,ball,pts,games,get msg(){ return msg; },get phase(){ return phase; },get hits(){ return hits; },get server(){ return server; },get servT(){ return servT; },get svNo(){ return svNo; },get tb(){ return tb; },get lastTeam(){ return lastTeam; },get svSign(){ return svSign; },AI,predict,ctrl,dbl,callStr}};
}

function demo(c,v,t,col0,col1,foe){ c.drawImage(courtBg(v),0,0); const T=2.4,u=(t%T)/T,dir=u<.5?1:-1,kk=u<.5?u*2:(u-.5)*2,x0=dir>0?110:690,x1=dir>0?690:110,bx=x0+(x1-x0)*kk,bw=(dir>0?-50:50)*(1-2*kk),bh=50+Math.sin(kk*Math.PI)*110;
  const far=proj(700,40,0,0),nr=proj(100,-40,0,0),fu=dir>0?clamp((kk-.7)/.5,0,1):0,nu=dir<0?clamp((kk-.7)/.5,0,1):(u<.12?.45+u*4:0); drawHuman(c,far[0],far[1],far[2]*SCP,true,{color:col1,hair:1},{u:fu,type:fu?'fh':'ready',pad:{face:'#2a6ad8'},label:foe||''},t); drawNet(c,0); drawBall(c,{x:bx,w:bw,y:GY-bh},0); drawHuman(c,nr[0],nr[1],nr[2]*SCP,false,{color:col0,hair:0},{u:nu,type:nu?'fh':'ready',pad:{face:'#e83a3a'}},t); }
function stageShow(c,w,h,si,t){ const S=STAGES[si]; c.save(); c.scale(w/W,h/H); demo(c,S.v,t,'#ff5d6d',S.col,S.foe); c.fillStyle='rgba(11,10,28,.72)'; rr(c,W/2-190,8,380,40,14); c.fill(); c.fillStyle='#ffd23f'; c.font='900 21px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(S.name+'　對手 '+S.foe,W/2,28,360); c.restore(); }
function preview(c,w,h,L,t){ L=Object.assign({color:'#ff5d6d',hair:0,face:'#e83a3a',grip:'#333333'},L||{}); c.save(); c.scale(w/W,h/H); c.drawImage(courtBg(0),0,0); const u=(t%2.6)/1.4; drawHuman(c,W/2,H-12,2.1,true,L,{u:u<1?u:0,type:u<1?'fh':'ready',pad:{face:L.face,grip:L.grip}},t); c.restore(); }
function thumb(c,w,h,t){ c.save(); c.scale(w/W,h/H); demo(c,9,t,'#ff5d6d','#4f9dff',''); c.font='900 54px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=10; c.strokeStyle='#14122b'; c.strokeText('網球對決',W/2,110); c.fillStyle='#d8f040'; c.fillText('網球對決',W/2,110); c.restore(); }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).tennis={
  name:'網球對決',tag:'TENNIS MATCH',color:'#d8f040',online:true,maxPlayers:4,
  coin:o=>{ const d=(o.options||{}).fmt==='doubles'||(o.net&&o.net.count>2); return {verb:'先發球',names:d?['左隊','右隊']:o.net?[o.net.names[0]||'玩家 1',o.net.count>1?(o.net.names[1]||'玩家 2'):'電腦']:o.mode==='2p'?['1P','2P']:['你','電腦']}; },
  desc:'從球員背後看的網球！單打或雙打，照正式規則：上手發球、一發二發、15／30／40、Deuce 與占先、局數平手搶七。揮拍自動判斷抽球、截擊、高壓扣殺，「小球」放短球或挑高球。硬地、紅土、草地十種球場，單人 200 關，雙人同一台，連線最多 4 人。',
  goal:'球在對方那邊彈地兩次、或對方出界、掛網、雙發失誤就得一分。0、15、30、40，先拿 4 分而且多 2 分贏一局（40 平叫 Deuce）；先贏到設定的局數就贏。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  options:[{key:'fmt',label:'賽制',def:'singles',opts:[{id:'singles',label:'單打 1 對 1'},{id:'doubles',label:'雙打 2 對 2'}]},
    {key:'len',label:'比賽長度',def:'g2',opts:[{id:'g2',label:'先贏 2 局'},{id:'g4',label:'短盤 4 局'},{id:'g6',label:'一盤 6 局'}]},
    {key:'team',label:'雙人玩雙打',def:'vs',opts:[{id:'vs',label:'各帶電腦隊友對打'},{id:'coop',label:'兩人同隊打電腦'}]},
    {key:'court',label:'場地（雙人／連線）',def:'0',opts:VENUES.map((v,i)=>({id:String(i),label:v.n}))}],
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  stageGoal:i=>{ const S=STAGES[i],V=VENUES[S.v]; return '第 '+(i+1)+' 關・'+S.name+(V.clay?'（紅土：球彈得高、慢）':V.grass?'（草地：球彈得低、快）':'')+'：打贏 '+S.foe+'。'+(i<10?'對手很慢、常失誤，先熟悉發球和抽球。':i<60?'對手開始會調動你左右跑。':i<130?'對手會上網截擊、放小球，記得挑高球。':'高手對決：發球又快又準，很少失誤。'); },
  stageLocked:i=>i>0&&getRec(i-1)==null,stageBest:i=>{ const v=getRec(i); return v?'✓ '+v.replace(':',' : '):''; },
  hubBest:()=>{ let n=0; for(let i=0;i<LV;i++) if(getRec(i)!=null) n++; return n?'過關 <b>'+n+' / '+LV+'</b>':'尚無紀錄'; },
  help:[['↑ ↓ ← →','前後左右跑位（發球前只能左右移動）'],['空白鍵','發球；自動抽球、截擊，球很高時高壓扣殺；按著 ← → 揮拍會往那邊打'],['X','放小球；對手在網前時自動挑高球']],
  touchHelp:[['方向盤','前後左右跑位'],['揮拍','發球、自動抽球或扣殺'],['小球','放小球／對手上網時挑高球']],
  touch:{left:'dpad',right:[{l:'小球',c:'KeyX'},{l:'揮拍',c:'Space',act:true}]},
  looks:[{key:'face',label:'球拍顏色',type:'color',opts:['#e83a3a','#2a6ad8','#ffd23f','#5fd068','#2a2a30','#f4f4f4','#ff8a1a','#b98cff']},{key:'grip',label:'握把顏色',type:'color',opts:['#333333','#f4f0e8','#ff5d6d','#4f9dff','#5fd068','#ffd23f']},
    {key:'color',label:'球衣顏色',type:'color',opts:['#ff5d6d','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#b98cff','#f4f4f4']},{key:'hair',label:'髮型',opts:[{id:'0',label:'短髮'},{id:'1',label:'馬尾'},{id:'2',label:'捲毛'}]}],
  best:{label:'過關',fmt:v=>v+' 關',lower:false},
  stageShow,preview,thumb,create,_sim:{stepB,simLand,aimShot,aimFixed,STAGES,NETX,GY,SVC,CWS,CWD,proj,drawHuman}};
})();
