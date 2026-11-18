// 匹克球對決：從球員背後看的透視視角，單打或雙打。照中華民國匹克球總會／PaddleLab 整理的規則：
//  發球站底線後、照分數站右（偶數）或左（奇數）半場，低手發到斜對角發球區（落在廚房區、廚房線或錯的那一半＝失誤，每次只有一次機會，擦網落點對就繼續）；
//  雙彈地：接發球、發球方的第三拍都要等球彈地；廚房區（網前 7 呎，含線）裡不能截擊，截擊後衝進廚房區也算違例；碰線算界內。
//  計分可選：發球得分制（只有發球方得分，先到 11 分，不用 Deuce）／落地得分制（每球都得分，先到 15 分，不用 Deuce）。雙打照 0-0-2、1 號／2 號發球員輪替，發球方得分搭檔換邊。
// 座標：x＝球場長邊（左隊在 x<400）、w＝左右（左隊面向 +x 時右手邊是 +w）、y＝高度（GY 是地面，越小越高）。
// 操作：方向鍵前後左右跑、揮拍（自動判斷抽球／扣殺；按著左右揮拍會往那邊打）、「小球」吊進對方廚房區；發球前「小球」換發球種類。
(function(){
'use strict';
const W=800,H=450,GY=400,NETX=400,NETTOP=344,BACK=60,KIT=108,CW=155,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,LV=200;
const G=900,K=.0009,REST=.62,REACH=44;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,r1=v=>Math.round(v*10)/10,lerp=(a,b,u)=>a+(b-a)*u;
const LS=(k,v)=>{ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } };
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function shade(hex,k){ const n=parseInt(hex.slice(1),16),f=v=>clamp(Math.round(k>1?v+(255-v)*(k-1):v*k),0,255); return 'rgb('+f(n>>16&255)+','+f(n>>8&255)+','+f(n&255)+')'; }
const inKitchen=x=>Math.abs(x-NETX)<=KIT+2; // 廚房區含線
// 拍子打得到的範圍：身體四周 REACH、高度從膝蓋到頭頂
const reachD=(p,b)=>Math.hypot(b.x-p.x,b.w-p.w,Math.max(0,Math.abs(b.y-(GY-62))-50));

/* ---------- 球場、對手 ---------- */
const VENUES=[
  {n:'社區球場',sky:['#8fd3ff','#e0f4ff'],court:'#2f6fb8',kit:'#3a82c8',out:'#3f8a5a',bg:'trees'},
  {n:'公園球場',sky:['#7ec8ff','#d8f0ff'],court:'#2a8a6a',kit:'#36a07a',out:'#6a9a4a',bg:'park'},
  {n:'河濱運動公園',sky:['#9ad8ff','#eaf8ff'],court:'#3a5ab8',kit:'#4a6ac8',out:'#7a8a5a',bg:'river'},
  {n:'學校操場',sky:['#8fd0ff','#e8f6ff'],court:'#b84a3a',kit:'#c85a48',out:'#4f8a4a',bg:'school'},
  {n:'海濱度假村',sky:['#5ec8ff','#fff1c8'],court:'#2a7ac8',kit:'#3a8ad8',out:'#e8d098',bg:'sea'},
  {n:'屋頂球場',sky:['#ffb88a','#ffe8c8'],court:'#4a3a8a',kit:'#5a4a9a',out:'#6a6a72',bg:'city'},
  {n:'夜間燈光球場',sky:['#0a1030','#2a2a5a'],court:'#1f5aa8',kit:'#2a6ab8',out:'#2a4a3a',bg:'night'},
  {n:'全國公開賽',sky:['#3a4a7a','#24305a'],court:'#1a6ab0',kit:'#2a7ac0',out:'#2a3a5a',bg:'arena'},
  {n:'室內運動中心',sky:['#e8dcc4','#d0bc98'],court:'#2a7a5a',kit:'#348a68',out:'#c8a070',bg:'gym',in:1},
  {n:'社區活動中心',sky:['#f0e4d0','#d8c4a4'],court:'#3a6ab8',kit:'#4a7ac8',out:'#b8905a',bg:'center',in:1}];
const FOES=['阿伯','小安','阿凱','美玲','大熊','阿宏','小芸','志明','春嬌','阿哲','小琪','大山','阿妹','小傑','阿娟','大寶','小芳','阿翔','小雯','阿德','小蓉','阿強','小慧','阿龍','小婷'];
const FCOL=['#4f9dff','#ff9d3d','#5fd068','#b98cff','#ff5d8f','#3ddbd9','#e8c040','#ff6b4a'];
const STAGES=Array.from({length:LV},(_,i)=>{ const v=Math.floor(i/20),k=i/(LV-1); return {i,v,k,foe:FOES[(i*7+v*3)%FOES.length]+(i>=100?'・進階':''),col:FCOL[(i*3+1)%FCOL.length],hair:i%3,name:VENUES[v].n+' '+(i%20+1),stars:Math.min(5,1+Math.floor(i/40))}; });
const recKey=i=>'arcade.pickleball.w.'+i,getRec=i=>LS(recKey(i));

/* ---------- 球：長邊＋高度用重力和空氣阻力，左右等速；落地會彈 ---------- */
function stepB(b,dt){ const sp=Math.hypot(b.vx,b.vy); b.vx-=K*sp*b.vx*dt; b.vy+=(G+(b.spin==='top'?420:0)-K*sp*b.vy)*dt; b.x+=b.vx*dt; b.y+=b.vy*dt; b.w=(b.w||0)+(b.vw||0)*dt; }
// 落地反彈：一般、上旋（往前竄、彈得低）、側旋（彈得很低、往旁邊偏、速度被吃掉）
function bounce(b){ if(b.spin==='top'){ b.vy=-Math.abs(b.vy)*.5; b.vx*=1.08; } else if(b.spin==='slice'){ b.vy=-Math.abs(b.vy)*.34; b.vx*=.7; b.vw=(b.vw||0)*.8+(b.curlDir||1)*70; b.curl=1; } else { b.vy=-Math.abs(b.vy)*REST; b.vx*=.82; b.vw=(b.vw||0)*.85; } b.spin=''; }
function simLand(x,y,vx,vy,spin){ const s={x,y,vx,vy,spin}; let netY=null,t=0; for(let i=0;i<600;i++){ const px=s.x; stepB(s,1/90); t+=1/90; if(netY==null&&(px-NETX)*(s.x-NETX)<=0) netY=s.y; if(s.y>=GY) break; } return {x:s.x,netY,t}; }
function aimShot(x,y,tx,angs,dir,clr,spin){ for(const a of angs){ const ca=Math.cos(a*Math.PI/180)*dir,sa=-Math.sin(a*Math.PI/180); let lo=60,hi=1500,best=null;
    for(let it=0;it<18;it++){ const v=(lo+hi)/2,L=simLand(x,y,ca*v,sa*v,spin); if((L.x-tx)*dir<0) lo=v; else hi=v; best={v,L}; }
    if(best&&best.L.netY!=null&&best.L.netY<NETTOP-(clr||8)&&Math.abs(best.L.x-tx)<26) return {vx:ca*best.v,vy:sa*best.v,t:best.L.t}; } return null; }
function aimFixed(x,y,tx,v,dir,a0,a1,minD,spin){ let best=null,bd=1e9; for(let a=a0;a<=a1;a+=1.2){ const ca=Math.cos(a*Math.PI/180)*dir,sa=-Math.sin(a*Math.PI/180),L=simLand(x,y,ca*v,sa*v,spin);
    if(L.netY==null||L.netY>=NETTOP-6||L.x<BACK+6||L.x>W-BACK-6||(L.x-NETX)*dir<(minD||KIT+10)) continue; const d=Math.abs(L.x-tx); if(d<bd){ bd=d; best={vx:ca*v,vy:sa*v,t:L.t}; } } return best&&bd<110?best:null; }

/* ---------- 透視鏡頭：在自己這隊底線後方，看向對面 ---------- */
const CAMX=-360,CAMH=260,FOC=520,HY=70,SCP=.52,SWD=.36;
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
  J.handL=swing?[J.shL[0]-22-rot*8,hipY+34,12-rot*14]:mv>.3?[J.shL[0]-4,hipY+26,18-step*24]:[-4,hipY+30,26]; /* 準備時另一隻手扶在身體前面，揮拍時張開平衡，跑步時跟腳反向擺 */ J.elbL=el(J.shL,J.handL,-1);
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
      if(racket&&st.pad){ const H=P(hd),E=P(el),a=Math.atan2(H[1]-E[1],H[0]-E[0]),PD=st.pad,shp=PD.pad==='long'?[15,32,6]:PD.pad==='wide'?[22,25,9]:[19,27,7]; c.save(); c.translate(H[0],H[1]); c.rotate(a+Math.PI/2); c.scale(sc,sc); c.fillStyle=PD.grip||'#333'; c.fillRect(-2.5,-12,5,13); c.fillStyle=PD.face||'#ff7a3d'; c.strokeStyle='rgba(0,0,0,.4)'; c.lineWidth=1.2; rr(c,-shp[0]/2,-12-shp[1],shp[0],shp[1],shp[2]); c.fill(); c.stroke(); c.strokeStyle='rgba(255,255,255,.45)'; rr(c,-shp[0]/2+2,-10-shp[1],shp[0]-4,shp[1]-4,shp[2]-2); c.stroke(); c.restore(); }
      const H=P(hd); c.fillStyle=skin; c.beginPath(); c.arc(H[0],H[1],4.2*sc,0,TAU); c.fill(); }}); };
  arm('R',true); arm('L',false);
  parts.sort((a,b)=>a.z-b.z).forEach(p=>p.f());
  if(st.label){ const H=P(J.head); c.font='900 17px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=4; c.strokeStyle='#14122b'; c.strokeText(st.label,H[0],H[1]-30*sc-8); c.fillStyle='#ffd23f'; c.fillText(st.label,H[0],H[1]-30*sc-8); } }

function drawBall(c,b,ct){ const g=proj(b.x,b.w||0,0,ct),p=proj(b.x,b.w||0,GY-b.y,ct),r=Math.max(2.5,7*p[2]*.62);
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(g[0],g[1],r*1.3,r*.5,0,0,TAU); c.fill();
  c.fillStyle='#e8f040'; c.strokeStyle='#8a8a20'; c.lineWidth=1.2; c.beginPath(); c.arc(p[0],p[1],r,0,TAU); c.fill(); c.stroke(); c.fillStyle='rgba(120,120,30,.6)'; for(const a of [0,2.1,4.2]){ c.beginPath(); c.arc(p[0]+Math.cos(a+b.x*.05)*r*.5,p[1]+Math.sin(a+b.x*.05)*r*.5,Math.max(.8,r*.18),0,TAU); c.fill(); } }

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
  Q([[BACK-30,-CW-30],[W-BACK+30,-CW-30],[W-BACK+30,CW+30],[BACK-30,CW+30]],shade(V.out,1.08));
  Q([[BACK,-CW],[W-BACK,-CW],[W-BACK,CW],[BACK,CW]],V.court); Q([[NETX-KIT,-CW],[NETX+KIT,-CW],[NETX+KIT,CW],[NETX-KIT,CW]],V.kit);
  c.strokeStyle='#fff'; c.lineWidth=2.5; L([BACK,-CW],[W-BACK,-CW]); L([BACK,CW],[W-BACK,CW]); L([BACK,-CW],[BACK,CW]); L([W-BACK,-CW],[W-BACK,CW]); L([NETX-KIT,-CW],[NETX-KIT,CW]); L([NETX+KIT,-CW],[NETX+KIT,CW]); L([BACK,0],[NETX-KIT,0]); L([NETX+KIT,0],[W-BACK,0]);
  return BGC[v]=e; }
function drawNet(c,ct){ const a=proj(NETX,-CW-14,0,ct),b=proj(NETX,CW+14,0,ct),at=proj(NETX,-CW-14,GY-NETTOP+4,ct),bt=proj(NETX,CW+14,GY-NETTOP+4,ct),mt=proj(NETX,0,GY-NETTOP,ct);
  c.fillStyle='rgba(20,20,26,.45)'; c.beginPath(); c.moveTo(at[0],at[1]); c.quadraticCurveTo(mt[0],mt[1]+3,bt[0],bt[1]); c.lineTo(b[0],b[1]); c.lineTo(a[0],a[1]); c.closePath(); c.fill();
  c.strokeStyle='rgba(255,255,255,.25)'; c.lineWidth=1; for(let i=1;i<24;i++){ const u=i/24,x=lerp(a[0],b[0],u); c.beginPath(); c.moveTo(x,lerp(at[1],bt[1],u)+2); c.lineTo(x,lerp(a[1],b[1],u)); c.stroke(); }
  c.strokeStyle='#fff'; c.lineWidth=3; c.beginPath(); c.moveTo(at[0],at[1]); c.quadraticCurveTo(mt[0],mt[1]+3,bt[0],bt[1]); c.stroke(); c.fillStyle='#2a2a30'; c.fillRect(a[0]-3,at[1]-2,6,a[1]-at[1]+2); c.fillRect(b[0]-3,bt[1]-2,6,b[1]-bt[1]+2); }

/* ---------- 遊戲 ---------- */
function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,two=!net&&opts.mode==='2p',solo=!net&&!two,OPT=opts.options||{};
  const TM=['vs','coop'].includes(OPT.team)?OPT.team:'1v1',pair=two||(!!net&&net.count===2); // 兩個真人：1 對 1、各配電腦 2 對 2、兩人同隊打 2 個電腦
  const dbl=net&&net.count>2?true:pair?TM!=='1v1':OPT.fmt==='doubles',N=dbl?4:2,coop=pair&&dbl&&TM==='coop',SL=h=>coop&&h===1?2:h,HI=i=>coop?(i===2?1:i===1?-1:i):i,me=net?SL(Math.min(N-1,net.me)):0;
  const {ctx:c}=env.canvas2d(W,H),si=clamp(opts.stage|0,0,LV-1),ST=STAGES[si],VEN=solo?ST.v:clamp(+OPT.court||0,0,VENUES.length-1),RALLY=OPT.score==='rally',GOAL=RALLY?15:11;
  const SERVES=[['deep','高遠深球'],['drive','快速平擊'],['top','上旋發球'],['slice','側旋發球']];
  const vsAI=solo||(net&&net.count<2)||(dbl&&(net?net.count:two?2:1)<N),k=vsAI?ST.k:1,AI={spd:155+95*k,react:.36-.22*k,err:150-125*k,lat:110-80*k,miss:.14*(1-k)};
  const ctrl=[]; for(let i=0;i<N;i++){ let cc='ai';
    if(net){ const h=HI(i); if(h>=0&&h<net.count) cc=i===me?'self':'net'; }
    else if(two){ if(!dbl) cc=i===0?'key0':'key1'; else if(coop) cc=i===0?'key0':i===2?'key1':'ai'; else cc=i===0?'key0':i===1?'key1':'ai'; }
    else cc=i===0?'solo':'ai'; ctrl.push(cc); }
  const isAI=i=>ctrl[i]==='ai',human=i=>!isAI(i);
  const ALTC=['#ff5d6d',solo&&!dbl?ST.col:'#4f9dff','#ff7eb6','#3ddbd9'];
  const RW=tm=>tm?-1:1; // 這隊的「右手邊」在 w 的哪個方向
  const ps=Array.from({length:N},(_,i)=>{ const tm=i%2,lk=Object.assign({},(net?net.looks&&HI(i)>=0&&net.looks[HI(i)]:null)||(i===0?opts.look:null)||{color:ALTC[i],hair:i%3});
    if(!lk.color) lk.color=ALTC[i]; return {n:i,team:tm,side:dbl?(i<2?1:-1):1,x:tm?700:100,w:0,face:tm?-1:1,sw:0,hitOK:false,dk:false,moving:false,volT:0,tx:tm?700:100,tw:0,look:lk,sv:Math.max(0,SERVES.findIndex(q=>q[0]===OPT.serve)),aim:0,swType:'ready',run:0}; });
  // 兩個真人同一隊（自己用方向鍵跑位）不容易站得剛好，打得到球的距離放寬一點
  for(const p of ps){ const m=ps.find(q=>q.team===p.team&&q!==p); p.rm=dbl&&m&&human(p.n)&&human(m.n)?1.4:1; }
  for(let i=1;i<N;i++) if(ps[i].team!==ps[0].team&&ps[i].look.color===ps[0].look.color) ps[i].look.color='#4f9dff';
  const nm=i=>net?(HI(i)>=0&&HI(i)<net.count?(net.names[HI(i)]||'玩家 '+(HI(i)+1)):'電腦'+(i+1)):ctrl[i]==='key0'?'1P':ctrl[i]==='key1'?'2P':ctrl[i]==='solo'?(opts.name||'你'):(dbl&&ps[i].team===0?'電腦隊友':ST.foe+(dbl?(i<2?'A':'B'):''));
  const names=ps.map((p,i)=>nm(i)),myTeam=ps[me].team,CT=net?myTeam:0,TN=tm=>dbl?(!two&&tm===myTeam?'我方':tm?'右隊':'左隊'):names[tm];
  const ball={x:0,y:0,w:0,vx:0,vy:0,vw:0,bn:0,tx:0,ty:0,tw:0,spin:''},fx=[],score=[0,0];
  let t=0,phase='serve',servT=opts.first===1?1:0,server=-1,sNum=2,hits=0,lastHit=-1,lastTeam=-1,ptT=0,lastW=-1,msg='',msgT=0,ended=false,overT=0,introT=2.4,aiServeT=1.2,rally=0,best=0,ev=[],sendT=0,shake=0,waitTip=0,svSign=1;
  const aiS={},rin={}; for(let i=0;i<N;i++){ aiS[i]={pred:null,t:0,dec:{n:-1},react:0}; rin[i]={dx:0,dy:0,sw:false,dk:false}; }
  const sfx=n=>{ env.sfx(n); if(net&&net.host) ev.push(n); };
  const pop=(txt,col,x,w,h)=>fx.push({k:'txt',txt,col,x,w,h,t:0});
  const rightP=tm=>ps.find(p=>p.team===tm&&p.side===1)||ps[tm];
  const sideOf=p=>dbl?p.side:(score[p.team]%2?-1:1); // 單打：自己分數偶數站右、奇數站左
  function setServe(){ phase='serve'; hits=0; lastHit=-1; lastTeam=-1; rally=0; ball.bn=0; aiServeT=1.1;
    if(server<0) server=rightP(servT).n; const S=ps[server]; svSign=RW(S.team)*sideOf(S); // 發球站的那半邊（w 的正負）
    for(const p of ps){ const base=p.team?1:-1,sw=RW(p.team)*sideOf(p);
      if(p.team===servT){ p.x=p===S?(p.team?W-BACK+20:BACK-20):(p.team?W-BACK-40:BACK+40); p.w=dbl?sw*78:svSign*78; }
      else { const recv=dbl?RW(p.team)*sideOf(p)===-svSign:true; p.x=recv?(p.team?W-BACK+38:BACK-38):NETX-base*0+(p.team?KIT+30:-(KIT+30)); p.w=dbl?sw*78:-svSign*78; }
      p.sw=0; p.volT=0; }
    for(const i in aiS) aiS[i].pred=null; }
  setServe();
  function keyIn(which){ const kk=env.keys;
    if(which==='key0') return {dx:(kk.KeyD?1:0)-(kk.KeyA?1:0),dy:(kk.KeyW?1:0)-(kk.KeyS?1:0),sw:env.hit('KeyF')||env.hit('Space'),dk:env.hit('KeyG')};
    if(which==='key1') return {dx:(kk.ArrowRight?1:0)-(kk.ArrowLeft?1:0),dy:(kk.ArrowUp?1:0)-(kk.ArrowDown?1:0),sw:env.hit('Enter')||env.hit('NumpadEnter'),dk:env.hit('ShiftRight')||env.hit('Slash')};
    return {dx:(kk.ArrowRight||kk.KeyD?1:0)-(kk.ArrowLeft||kk.KeyA?1:0),dy:(kk.ArrowUp||kk.KeyW?1:0)-(kk.ArrowDown||kk.KeyS?1:0),sw:env.hit('Space')||env.hit('KeyJ')||env.hit('Enter'),dk:env.hit('KeyX')||env.hit('KeyK')}; }
  const mustBounce=()=>hits<3;
  const mySide=p=>p.team?ball.x>NETX+4:ball.x<NETX-4;
  // 電腦：照球的路線找最早跑得到、合法、打得到的點；雙打由離得近的那一個去接
  function predict(p){ const b={x:ball.x,y:ball.y,w:ball.w,vx:ball.vx,vy:ball.vy,vw:ball.vw,spin:ball.spin},sp=AI.spd; let bn=ball.bn,last=null;
    for(let i=1;i<480;i++){ stepB(b,1/90); if(b.y>=GY){ if(bn>=1) break; bn=1; b.y=GY; b.spin=''; b.vy=-Math.abs(b.vy)*REST; b.vx*=.82; b.vw*=.85; }
      if(p.team?b.x<=NETX+8:b.x>=NETX-8) continue; const vol=bn===0; if(vol&&(mustBounce()||inKitchen(b.x))) continue; if(b.y<GY-118||b.y>GY-6) continue; last={x:b.x,w:b.w,vol,t:i/90};
      const need=Math.max(0,Math.hypot(b.x-p.x,b.w-p.w)-REACH*.5)/sp+AI.react; if(need<=i/90) return last; } return last; }
  function mine(p,pred){ if(!dbl||!pred) return true; const mate=ps.find(q=>q.team===p.team&&q!==p),dm=Math.hypot(mate.x-pred.x,mate.w-pred.w),dp=Math.hypot(p.x-pred.x,p.w-pred.w); return human(mate.n)?(Math.sign(pred.w||1)===Math.sign(p.w||1)&&dp<dm+60):dp<=dm; }
  function aiInput(p,dt){ const o={dx:0,dy:0,sw:false,dk:false,wx:0,ww:0},A=aiS[p.n],dir=p.face;
    if(phase==='serve'){ if(server===p.n&&introT<=0&&(aiServeT-=dt)<=0){ p.sv=Math.random()<.4-.25*k?0:Math.floor(Math.random()*4); o.sw=true; } return o; }
    if(phase!=='play') return o;
    const coming=lastTeam>=0&&lastTeam!==p.team;
    if(coming){ if((A.t-=dt)<=0||!A.pred){ A.t=.1; A.pred=predict(p); if(A.dec.n!==hits){ A.dec={n:hits,whiff:Math.random()<(ball.smash?.42-.3*k:.1-.08*k),off:Math.random()<AI.miss?(Math.random()-.5)*90:0}; } } A.react-=dt; }
    else { A.pred=null; A.react=AI.react; }
    // 站位：照正式打法，接發球方回完球就上網、發球方打完第三拍才上網（雙彈跳規則）；越強越會站到廚房線，
    //  中等的常停在中場「無人區」，弱的一直留在底線。左右會跟著對手擊球的位置偏過去（雙打兩人一起移動），越強偏得越準。
    const back=p.team?W-BACK-30:BACK+30,front=NETX-dir*(KIT+18),canNet=p.team!==servT?hits>=2:hits>=3;
    const homeX=!canNet||k<.3?back:k>.62?front:lerp(back,front,.4+(k-.3)*1.1);
    const ant=coming?ball.w:ball.w+(ball.vw||0)*.35,shade=clamp(ant,-CW,CW)*(.12+.42*k),homeW=(dbl?RW(p.team)*p.side*(canNet&&k>.3?60:75):0)+shade;
    let tx=homeX,tw=homeW;
    // 回位：越弱的電腦打完球越晚回位、而且差一點就懶得動
    if(coming) A.rt=0; else A.rt=(A.rt||0)+dt; const lazy=!coming&&(A.rt<(1-k)*.5||Math.hypot(tx-p.x,tw-p.w)<(1-k)*70);
    if(lazy){ tx=p.x; tw=p.w; }
    const go=coming&&A.pred&&mine(p,A.pred); if(go){ tx=A.pred.x-dir*6+(A.dec.off||0); tw=A.pred.w; }
    tx=p.team?clamp(tx,NETX+24,W+56):clamp(tx,-56,NETX-24); if(go&&A.pred.vol) tx=p.team?Math.max(tx,NETX+KIT+8):Math.min(tx,NETX-KIT-8);
    o.wx=tx-p.x; o.ww=tw-p.w;
    if(A.react<=0&&go&&mySide(p)&&!(ball.bn===0&&mustBounce())&&reachD(p,ball)<REACH*.9&&!(A.dec.n===hits&&A.dec.whiff)&&!(ball.bn===0&&inKitchen(p.x))) o.sw=true; return o; }
  function inputOf(p,dt){ const cc=ctrl[p.n]; if(cc==='ai') return aiInput(p,dt); if(cc==='net'){ const r=rin[p.n],o={dx:r.dx,dy:r.dy,sw:r.sw,dk:r.dk}; r.sw=r.dk=false; return o; } return keyIn(cc==='self'?'solo':cc); }
  // 擊球：長邊用原本的瞄準；左右往對手不在的那邊（按著左右就往那邊）
  function shoot(p,dk){ const dir=p.face,R=Math.random,ai=isAI(p.n),near=Math.abs(p.x-NETX)<KIT+70,high=ball.y<GY-112,low=ball.y>NETTOP-6,opp=ps.filter(q=>q.team!==p.team);
    let type=high?'smash':dk||(near&&low)?'dink':'drive';
    if(ai){ const oFar=opp.every(o=>Math.abs(o.x-NETX)>KIT+90); if(type==='drive'&&hits===2&&R()<.35+.5*k) type='drop'; else if(type==='drive'&&!oFar&&R()<.5*k) type='dink'; else if(type==='drive'&&oFar&&near&&R()<.4) type='dink'; }
    else if(dk&&!near) type='drop';
    const oppBack=dir>0?W-BACK:BACK; let tx,v=null;
    if(type==='dink'||type==='drop') tx=NETX+dir*(34+R()*(KIT-50)); else if(type==='smash') tx=NETX+dir*(KIT+40+R()*150); else tx=oppBack-dir*(40+R()*140);
    if(ai) tx+=(R()-.5)*AI.err;
    if(type==='smash') v=aimFixed(ball.x,ball.y,tx,ai?560+200*k:760,dir,-35,12,KIT+20);
    else if(type==='drive') v=aimFixed(ball.x,ball.y,tx,ai?420+180*k:560,dir,-6,22,KIT+30);
    else v=aimShot(ball.x,ball.y,tx,type==='drop'?[30,40,50,60]:[18,28,38,50,62],dir,10);
    // 左右：玩家按著左右就往那邊；不然打向對手比較少的那一邊
    const oppW=opp.reduce((a,o)=>a+o.w,0)/opp.length; let tw=p.aim?p.aim*(70+R()*60):(oppW>0?-1:1)*(50+R()*80); if(type==='dink') tw=clamp(ball.w*.5+(R()-.5)*80,-CW+20,CW-20);
    if(ai) tw+=(R()-.5)*AI.lat; tw=clamp(tw,-CW+8,CW-8);
    v=v||aimShot(ball.x,ball.y,oppBack-dir*120,[30,40,50,60],dir)||aimShot(ball.x,ball.y,NETX+dir*200,[40,55,70],dir)||{vx:dir*300,vy:-420,t:1};
    // 擊球品質 e：越大偏得越多（照真人：撲球、邊跑邊打、低球、小球最容易失手；電腦照關卡）
    const stretch=clamp(reachD(p,ball)/(REACH*(p.rm||1)),0,1),lowB=ball.y>GY-22?1:0,base={dink:.3,drop:.42,drive:.24,smash:.2}[type]||.25;
    let e=base*(1+stretch*1.6+(p.moving?.45:0)+lowB*.6)*(ai?(1.45-1.05*k):1); if(p.weak) e*=1.4;
    const gs=()=>((R()+R()+R())/1.5-1); v={vx:v.vx*(1+gs()*e*.42),vy:v.vy*(1+gs()*e*.42),t:v.t}; tw+=gs()*e*150;
    const vol=ball.bn===0; ball.vx=v.vx; ball.vy=v.vy; ball.vw=(tw-ball.w)/Math.max(.25,v.t||1); ball.bn=0; ball.net=0; ball.spin=''; ball.curl=0; ball.smash=type==='smash';
    lastHit=p.n; lastTeam=p.team; hits++; rally++; best=Math.max(best,rally); if(vol) p.volT=.3;
    p.swType=type==='smash'?'over':type==='dink'||type==='drop'?'dink':((ball.w-p.w)*RW(p.team)>=0?'fh':'bh'); p.sw=SWD*.55; // 動作對到擊球點
    if(type==='smash'){ sfx('boom'); shake=.2; pop('扣殺！','#ff5d8f',ball.x,ball.w,GY-ball.y+40); } else { sfx(type==='drive'?'place':'pop'); if(type==='dink'||type==='drop') pop(type==='dink'?'小球':'放小球','#7af0ff',ball.x,ball.w,GY-ball.y+40); }
    fx.push({k:'ring',x:ball.x,w:ball.w,h:GY-ball.y,t:0,col:ball.smash?'#ff5d8f':'#fff'}); }
  /* 報分：第一個數字是發球方隊伍分數、第二個是對方分數、雙打發球得分制第三個是發球順位（落地得分制沒有第三個） */
  function callStr(){ return score[servT]+'－'+score[1-servT]+(dbl&&!RALLY?'－'+sNum:''); }
  function rallyEnd(wt,why){ if(phase!=='play'&&phase!=='serve') return; phase='point'; ptT=1.6; lastW=wt; let txt;
    // 照正式規則：發球方得分→同一位發球員換到另一邊繼續發（雙打跟搭檔交換位置，單打依自己分數單雙數換邊）
    if(wt===servT){ score[wt]++; txt='得分・同一位發球員換邊續發'; if(dbl){ const S=ps[server],P=ps.find(q=>q.team===wt&&q!==S),sd=S.side; S.side=P.side; P.side=sd; } }
    // 落地得分制：接發球方贏球＝得分＋換發球，站位不換；由「分數偶數站右、奇數站左」那一邊的人發球，每隊只有一位發球員
    else if(RALLY){ score[wt]++; txt='得分・換對方發球'; servT=wt; const sd=score[wt]%2?-1:1; server=((dbl&&ps.find(q=>q.team===wt&&q.side===sd))||rightP(wt)).n; sNum=1; }
    else if(dbl&&sNum===1){ sNum=2; server=ps.find(q=>q.team===servT&&q.n!==server).n; txt='換搭檔（第二發球員）在原位置發球'; }
    else { servT=wt; server=rightP(wt).n; sNum=1; txt=dbl?'換發球・由右半場的人（第一發球員）先發':'換發球'; }
    if(Math.max(score[0],score[1])<GOAL) txt+='　報分 '+callStr();
    const my=wt===myTeam; msg=(two?(dbl?TN(wt):wt?'2P':'1P')+' ':my?'':'對手')+txt+'　'+why; msgT=1.6;
    env.sfx(two||my?'item':'hurt'); if(net) ev.push('p'+wt);
    if(Math.max(score[0],score[1])>=GOAL){ phase='over'; overT=0; } } /* 兩種計分都不用 Deuce：發球得分制先到 11 分、落地得分制先到 15 分就贏 */
  function conclude(a,b,note){ if(ended) return; ended=true; score[0]=a; score[1]=b; const w=a>b?0:1,my=two||w===myTeam;
    if(solo&&w===0) LS(recKey(si),a+':'+b); env.sfx(my?'win':'lose');
    env.end({title:two?(dbl?TN(w):w?'2P':'1P')+' 獲勝！':my?(solo?'贏了！過關':'你們贏了！'):'輸了',big:a+' : '+b,text:(note?note+' ':'')+(solo?ST.name+'　對手：'+ST.foe+(dbl?'隊':'')+'。':'')+(best>3?'最長來回 '+best+' 拍。':''),score:solo&&w===0?si+1:null,next:solo&&w===0&&si<LV-1}); }
  function snap(){ const m={s:[ps.map(p=>[r1(p.x),r1(p.w),r1(p.sw),p.side,p.sv,p.moving?1:0]),r1(ball.x),r1(ball.y),r1(ball.w),r1(ball.vx),r1(ball.vy),r1(ball.vw),score[0],score[1],servT,server,sNum,['serve','play','point','over'].indexOf(phase),hits,lastW,lastTeam],e:ev,m:msgT>0?msg:''}; ev=[]; return m; }
  if(net){ if(client) net.onmsg=m=>{ if(m.s){ const s=m.s; s[0].forEach((q,i)=>{ const p=ps[i]; if(!p) return; p.tx=q[0]; p.tw=q[1]; p.sw=q[2]; p.side=q[3]; p.sv=q[4]; p.moving=!!q[5]; }); ball.tx=s[1]; ball.ty=s[2]; ball.tw=s[3]; ball.vx=s[4]; ball.vy=s[5]; ball.vw=s[6]; score[0]=s[7]; score[1]=s[8]; servT=s[9]; server=s[10]; sNum=s[11]; phase=['serve','play','point','over'][s[12]]; hits=s[13]; lastW=s[14]; lastTeam=s[15];
        for(const n of m.e){ if(n==='p0'||n==='p1') env.sfx(+n[1]===myTeam?'item':'hurt'); else env.sfx(n); } if(m.m){ msg=m.m; msgT=1.4; } } else if(m.end) conclude(m.end[0],m.end[1],m.end[2]); };
    else { net.onmsg=(m,from)=>{ if(m.i&&rin[SL(from)]){ const r=rin[SL(from)]; r.dx=m.i[0]; r.dy=m.i[1]; if(m.i[2]) r.sw=true; if(m.i[3]) r.dk=true; } };
      net.onleave=i=>{ const j=SL(i); if(j<N&&!ended) ctrl[j]='ai'; }; } }
  // 移動：方向是照「這個人自己的鏡頭」看的（同一台都用左隊的鏡頭；連線各自從自己這隊看）
  function movePlayer(p,i,dt){ const sp=isAI(p.n)?AI.spd:235,cam=net?p.team:0,fx2=cam?-1:1; let mx,mw;
    if(isAI(p.n)){ const d=Math.hypot(i.wx||0,i.ww||0); mx=d>4?(i.wx/d)*Math.min(1,d/28):0; mw=d>4?(i.ww/d)*Math.min(1,d/28):0; }
    else { mx=(i.dy||0)*fx2; mw=(i.dx||0)*fx2; const l=Math.hypot(mx,mw); if(l>1){ mx/=l; mw/=l; } p.aim=(i.dx||0)*fx2*RW(0)*1; }
    p.moving=Math.abs(mx)+Math.abs(mw)>.05;
    if(phase==='serve'&&p.n===server){ const bx=p.team?W-BACK+6:BACK-6; p.x=p.team?Math.max(bx,p.x+mx*sp*dt):Math.min(bx,p.x+mx*sp*dt); p.x=clamp(p.x,10,W-10); p.w=svSign>0?clamp(p.w+mw*sp*dt,8,CW):clamp(p.w+mw*sp*dt,-CW,-8); if(i.dk){ p.sv=(p.sv+1)%4; sfx('click'); } } // 發球前「小球」換發球種類
    else { p.x+=mx*sp*dt; p.w=clamp(p.w+mw*sp*dt,-CW-50,CW+50); const lo=p.team?NETX+18:-60,hi=p.team?W+60:NETX-18; p.x=clamp(p.x,lo,hi); } // 可以退到底線後面接深球
    const swType=dk=>phase==='serve'&&p.n===server?'serve':ball.y<GY-112?'over':dk?'dink':((ball.w-p.w)*RW(p.team)>=0?'fh':'bh'); // 照球在哪裡選動作：正手／反手／小球／高壓
    if(i.sw&&p.sw<=0){ p.sw=SWD; p.hitOK=true; p.dk=false; p.swType=swType(false); } else if(i.dk&&p.sw<=0&&!(phase==='serve'&&p.n===server)){ p.sw=SWD; p.hitOK=true; p.dk=true; p.swType=swType(true); } if(p.sw>0) p.sw-=dt;
    if(p.moving) p.run+=dt*11;
    if(p.volT>0){ p.volT-=dt; if(inKitchen(p.x)&&phase==='play'){ p.volT=0; rallyEnd(1-p.team,'截擊後衝進廚房區'); } } }
  let lastIn='';
  function update(dt){ t+=dt; if(introT>0) introT-=dt; if(msgT>0) msgT-=dt; if(shake>0) shake-=dt; if(waitTip>0) waitTip-=dt; for(const f of fx) f.t+=dt; for(let i=fx.length-1;i>=0;i--) if(fx[i].t>1) fx.splice(i,1);
    if(client){ const i=keyIn('solo'),key=''+i.dx+i.dy; sendT-=dt; if(key!==lastIn||i.sw||i.dk||sendT<=0){ lastIn=key; sendT=1/20; net.send({i:[i.dx,i.dy,+i.sw,+i.dk]}); }
      const f=Math.min(1,dt*18); for(const p of ps){ p.x+=(p.tx-p.x)*f; p.w+=(p.tw-p.w)*f; } if(Math.hypot(ball.tx-ball.x,ball.ty-ball.y)>90){ ball.x=ball.tx; ball.y=ball.ty; ball.w=ball.tw; } else { ball.x+=(ball.tx-ball.x)*f; ball.y+=(ball.ty-ball.y)*f; ball.w+=(ball.tw-ball.w)*f; } return; }
    if(ended) return; if(net){ sendT-=dt; if(sendT<=0){ sendT=1/20; net.send(snap()); } }
    if(phase==='over'){ overT+=dt; if(overT>1.6){ if(net){ net.send(snap()); net.send({end:[score[0],score[1],'']}); } conclude(score[0],score[1]); } return; }
    for(const p of ps) movePlayer(p,inputOf(p,dt),dt);
    if(phase==='point'){ ptT-=dt; if(ball.y<GY){ stepB(ball,dt); if(ball.y>GY) ball.y=GY; } if(ptT<=0) setServe(); return; }
    if(phase==='serve'){ const p=ps[server]; ball.x=p.x+p.face*16; ball.y=GY-42; ball.w=p.w+RW(p.team)*14; ball.vx=0; ball.vy=0; ball.vw=0;
      if(p.sw>0&&p.hitOK&&introT<=0){ p.hitOK=false; p.swType='serve'; p.sw=SWD*.55; const dir=p.face,ty=SERVES[p.sv][0],R2=Math.random,ai=isAI(p.n),oppBack=dir>0?W-BACK:BACK; let v=null,tx;
        if(ty==='deep'){ tx=oppBack-dir*(25+R2()*60); v=aimShot(ball.x,ball.y,tx,[42,46,50,55],dir,14); }
        else if(ty==='drive'){ tx=oppBack-dir*(50+R2()*90); v=aimFixed(ball.x,ball.y,tx,ai?470+140*k:560,dir,2,24,KIT+40); }
        else if(ty==='top'){ tx=NETX+dir*(KIT+90+R2()*110); v=aimShot(ball.x,ball.y,tx,[36,44,52,60],dir,14,'top'); }
        else { tx=NETX+dir*(KIT+70+R2()*130); v=aimShot(ball.x,ball.y,tx,[26,34,42,50],dir,14); }
        v=v||aimShot(ball.x,ball.y,NETX+dir*(KIT+120),[38,46,54],dir,14)||{vx:dir*480,vy:-430,t:1};
        let tw=-svSign*(30+R2()*(CW-60)); // 發到斜對角的發球區
        { const gs=()=>((R2()+R2()+R2())/1.5-1),e={deep:.16,drive:.32,top:.24,slice:.24}[ty]*(ai?(1.4-1.1*k):1)*(p.moving?1.4:1); v={vx:v.vx*(1+gs()*e*.36),vy:v.vy*(1+gs()*e*.36),t:v.t}; tw+=gs()*e*130; }
        ball.vx=v.vx; ball.vy=v.vy; ball.vw=(tw-ball.w)/Math.max(.3,v.t||1); ball.bn=0; ball.net=0; ball.smash=false; ball.spin=ty==='top'?'top':ty==='slice'?'slice':''; ball.curlDir=-svSign; ball.curl=0;
        lastHit=p.n; lastTeam=p.team; hits=1; rally=1; phase='play'; sfx('pop'); pop(SERVES[p.sv][1],'#fff',ball.x,ball.w,80); fx.push({k:'ring',x:ball.x,w:ball.w,h:42,t:0,col:'#fff'}); }
      return; }
    const n=Math.max(1,Math.ceil(dt*240)); for(let s=0;s<n&&phase==='play';s++){ const px=ball.x; stepB(ball,dt/n);
      if((px-NETX)*(ball.x-NETX)<=0&&ball.y>NETTOP-6&&Math.abs(ball.w)<CW+14){ if(ball.y>NETTOP+2){ ball.x=NETX-Math.sign(ball.vx||1)*6; ball.vx*=-.15; ball.vw*=.3; ball.vy=Math.max(0,ball.vy)*.3; ball.net=1; sfx('bump'); fx.push({k:'ring',x:NETX,w:ball.w,h:GY-ball.y,t:0,col:'#ff8a8a'}); } else { ball.vy=Math.min(ball.vy,0)-40; ball.vx*=.75; fx.push({k:'ring',x:NETX,w:ball.w,h:GY-NETTOP,t:0,col:'#aaa'}); } }
      for(const p of ps){ if(p.sw>.04&&p.hitOK&&reachD(p,ball)<REACH*(p.rm||1)){ if(!mySide(p)||p.team===lastTeam) continue;
          if(ball.bn===0&&mustBounce()){ if(human(p.n)) waitTip=1; continue; }
          p.hitOK=false; if(ball.bn===0&&inKitchen(p.x)){ rallyEnd(1-p.team,'在廚房區截擊'); break; } shoot(p,p.dk); break; } }
      if(phase!=='play') break;
      if(ball.y>=GY){ ball.y=GY; const sideT=ball.x<NETX?0:1,inb=ball.x>=BACK-3&&ball.x<=W-BACK+3&&Math.abs(ball.w)<=CW+3,ht=lastTeam;
        if(ball.bn===0){ if(sideT===ht){ rallyEnd(1-ht,hits===1?(ball.net?'發球掛網':'發球沒過網'):(ball.net?'掛網':'球沒過網')); break; } if(!inb){ const wide=Math.abs(ball.w)>CW+3; rallyEnd(1-ht,(hits===1?'發球':'')+(wide?'出邊線':'出底線')); break; }
          if(hits===1&&inKitchen(ball.x)){ rallyEnd(1-ht,'發球落在廚房區'); break; }
          if(hits===1&&ball.w*-svSign<-3){ rallyEnd(1-ht,'發球沒落在斜對角發球區'); break; }
          ball.bn=1; bounce(ball); sfx('land'); fx.push({k:'dust',x:ball.x,w:ball.w,h:0,t:0}); }
        else { rallyEnd(ht,'球落地兩次'); break; } } } }
  function draw(){ c.save(); if(shake>0) c.translate((Math.random()-.5)*6,(Math.random()-.5)*5); const ct=CT;
    c.drawImage(courtBg(VEN),0,0);
    // 依遠近排序：遠的先畫
    const items=[]; for(const p of ps){ const q=proj(p.x,p.w,0,ct); items.push({d:q[3],f:()=>{ const back=p.team===ct; drawHuman(c,q[0],q[1],q[2]*SCP,!back,p.look,{u:p.sw>0?1-p.sw/SWD:0,type:p.sw>0?p.swType:(phase==='serve'&&p.n===server?'serve':'ready'),run:p.run,mv:p.moving?1:0,crouch:phase==='play'?.6:.3,pad:{pad:p.look.pad,face:p.look.face||(p.team?'#3ddbd9':'#ff7a3d'),grip:p.look.grip},label:lbl(p)},t); }}); }
    { const q=proj(NETX,0,0,ct); items.push({d:q[3]+.5,f:()=>drawNet(c,ct)}); }
    { const q=proj(ball.x,ball.w,0,ct); items.push({d:q[3]-6,f:()=>{ drawBall(c,ball,ct); if(ball.curl&&ball.bn>=1&&phase==='play'){ const p=proj(ball.x,ball.w,GY-ball.y,ct); c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=2; c.beginPath(); c.arc(p[0],p[1],10,t*12,t*12+4); c.stroke(); } }}); }
    items.sort((a,b)=>b.d-a.d).forEach(it=>it.f());
    for(const f of fx){ const a=1-f.t,q=proj(f.x,f.w||0,f.h||0,ct); if(f.k==='ring'){ c.strokeStyle=f.col; c.globalAlpha=a; c.lineWidth=3; c.beginPath(); c.arc(q[0],q[1],(5+f.t*30)*q[2]*.6,0,TAU); c.stroke(); c.globalAlpha=1; }
      else if(f.k==='dust'){ c.fillStyle='rgba(255,255,255,'+a*.7+')'; for(let i=0;i<6;i++){ const an=Math.PI+i*Math.PI/5; c.beginPath(); c.arc(q[0]+Math.cos(an)*f.t*30*q[2]*.6,q[1]+Math.sin(an)*f.t*10*q[2]*.6,2.5,0,TAU); c.fill(); } }
      else if(f.k==='txt'){ c.globalAlpha=a; c.font='900 20px '+TC; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='#14122b'; c.strokeText(f.txt,q[0],q[1]-f.t*30); c.fillStyle=f.col; c.fillText(f.txt,q[0],q[1]-f.t*30); c.globalAlpha=1; } }
    c.restore();
    // 比分：照現實報分（單打兩個數字、雙打三個數字）
    c.fillStyle='rgba(11,10,28,.8)'; rr(c,W/2-240,6,480,86,14); c.fill(); c.textAlign='center'; c.textBaseline='middle';
    const tName=tm=>dbl?ps.filter(p=>p.team===tm).map(p=>names[p.n]).join('＋'):names[tm],lt=ct===0?0:1;
    c.font='900 15px '+TC; c.fillStyle=ps[1-lt].look.color; c.fillText(tName(1-lt),W/2-155,22,150); c.fillStyle=ps[lt].look.color; c.fillText(tName(lt),W/2+155,22,150);
    c.font='900 28px '+TC; c.fillStyle='#fff'; c.fillText(score[1-lt]+'　:　'+score[lt],W/2,28); 
    const call=callStr(); c.font='900 15px '+TC; c.fillStyle='#ffd23f'; c.fillText('目前報分 '+call+(dbl&&!RALLY?'（發球方－接發球方－發球順位）':'（發球方－接發球方）'),W/2,62,460);
    c.font='700 12px '+TC; c.fillStyle='#cfd2e8'; c.fillText((dbl?'雙打・':'單打・')+(RALLY?'落地得分制・先拿 15 分（不用 Deuce）':'發球得分制・先拿 11 分（不用 Deuce）'),W/2,80,440);
    c.fillStyle='#ffd23f'; c.font='900 13px '+TC; c.fillText('🟡 發球',servT===lt?W/2+155:W/2-155,41);
    if(phase==='serve'&&server>=0){ const sd=sideOf(ps[server]); c.fillStyle='rgba(11,10,28,.7)'; rr(c,W/2-200,98,400,28,14); c.fill(); c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText('報分 '+call+'，'+(dbl?names[server]+'在':'從')+(sd>0?'右':'左')+'半場發球（打斜對角）',W/2,112,390); }
    const my=ps[me],tch=document.body.classList.contains('touch'),meServe=two?human(server):server===me,mq=proj(my.x,my.w,0,ct);
    if(phase==='serve'&&introT<=0&&meServe){ const P=ps[server]; c.fillStyle='rgba(11,10,28,.78)'; rr(c,W/2-230,132,460,58,15); c.fill();
      SERVES.forEach((q,i)=>{ const x=W/2-171+i*114,on=i===P.sv; c.fillStyle=on?'#ffd23f':'rgba(255,255,255,.12)'; rr(c,x-52,138,104,24,12); c.fill(); c.fillStyle=on?'#14122b':'#cfd2e8'; c.font='900 14px '+TC; c.fillText(q[1],x,150); });
      c.fillStyle='#fff'; c.font='700 13px '+TC; c.fillText(tch?'「小球」換發球種類，「揮拍」低手發球':'X 換發球種類，空白鍵低手發球（方向鍵可以移動站位）',W/2,176,440); }
    if(phase==='play'&&hits<3){ c.fillStyle='rgba(11,10,28,.6)'; rr(c,W/2-150,98,300,26,13); c.fill(); c.fillStyle='#7af0ff'; c.font='900 14px '+TC; c.fillText(hits===1?'接發球：要等球彈地一次':'第三拍：也要等球彈地一次',W/2,111); }
    if(waitTip>0){ c.fillStyle='#ffd23f'; c.font='900 17px '+TC; c.lineWidth=4; c.strokeStyle='#14122b'; c.strokeText('先等球彈地（雙彈地規則）',mq[0],mq[1]-110*mq[2]); c.fillText('先等球彈地（雙彈地規則）',mq[0],mq[1]-110*mq[2]); }
    if(phase==='play'&&hits>=3&&inKitchen(my.x)){ c.fillStyle='#ff9d3d'; c.font='900 15px '+TC; c.lineWidth=4; c.strokeStyle='#14122b'; c.strokeText('在廚房區：不能截擊',mq[0],mq[1]+18); c.fillText('在廚房區：不能截擊',mq[0],mq[1]+18); }
    if(msgT>0&&phase!=='serve'){ c.font='900 28px '+TC; c.lineWidth=6; c.strokeStyle='#14122b'; c.strokeText(msg,W/2,180); c.fillStyle='#ffd23f'; c.fillText(msg,W/2,180); }
    if(introT>0&&solo){ c.font='900 26px '+TC; c.lineWidth=6; c.strokeStyle='#14122b'; const s2='第 '+(si+1)+' 關　對手：'+ST.foe+(dbl?'隊':''); c.strokeText(s2,W/2,180); c.fillStyle='#ffd23f'; c.fillText(s2,W/2,180); } }
  const lbl=p=>introT>0||(dbl&&phase==='serve'&&p.n===server)?(two?(ctrl[p.n]==='key0'?'1P':ctrl[p.n]==='key1'?'2P':''):(p.n===me?'你':dbl&&p.team===myTeam?'隊友':'')):'';
  return {update,draw,destroy(){},_dbg:{ps,ball,score,get msg(){ return msg; },get phase(){ return phase; },get hits(){ return hits; },get server(){ return server; },get servT(){ return servT; },get lastTeam(){ return lastTeam; },get lastHit(){ return lastHit; },get sNum(){ return sNum; },get svSign(){ return svSign; },AI,predict,ctrl,dbl}};
}

function demo(c,v,t,col0,col1,foe){ c.drawImage(courtBg(v),0,0); const T=2.6,u=(t%T)/T,dir=u<.5?1:-1,kk=u<.5?u*2:(u-.5)*2,x0=dir>0?150:640,x1=dir>0?640:150,bx=x0+(x1-x0)*kk,bw=(dir>0?-40:40)*(1-2*kk),bh=40+Math.sin(kk*Math.PI)*130;
  const far=proj(650,30,0,0),nr=proj(140,-30,0,0),fu=dir>0?clamp((kk-.7)/.5,0,1):0,nu=dir<0?clamp((kk-.7)/.5,0,1):(u<.12?.45+u*4:0); drawHuman(c,far[0],far[1],far[2]*SCP,true,{color:col1,hair:1},{u:fu,type:fu?'fh':'ready',pad:{face:'#3ddbd9'},label:foe||''},t); drawNet(c,0); drawBall(c,{x:bx,w:bw,y:GY-bh},0); drawHuman(c,nr[0],nr[1],nr[2]*SCP,false,{color:col0,hair:0},{u:nu,type:nu?'fh':'ready',pad:{face:'#ff7a3d'}},t); }
function stageShow(c,w,h,si,t){ const S=STAGES[si]; c.save(); c.scale(w/W,h/H); demo(c,S.v,t,'#ff5d6d',S.col,S.foe); c.fillStyle='rgba(11,10,28,.72)'; rr(c,W/2-190,8,380,40,14); c.fill(); c.fillStyle='#ffd23f'; c.font='900 21px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(S.name+'　對手 '+S.foe,W/2,28,360); c.restore(); }
function preview(c,w,h,L,t){ L=Object.assign({color:'#ff5d6d',hair:0,pad:'std',face:'#ff7a3d',grip:'#333333'},L||{}); c.save(); c.scale(w/W,h/H); c.drawImage(courtBg(0),0,0); drawHuman(c,W/2,H-12,2.2,true,L,{u:(t%2.2)/1.2<1?(t%2.2)/1.2:0,type:(t%2.2)<1.2?'fh':'ready',pad:{pad:L.pad,face:L.face,grip:L.grip}},t); c.restore(); }
function thumb(c,w,h,t){ c.save(); c.scale(w/W,h/H); demo(c,6,t,'#ff5d6d','#4f9dff',''); c.font='900 54px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=10; c.strokeStyle='#14122b'; c.strokeText('匹克球對決',W/2,110); c.fillStyle='#e8f040'; c.fillText('匹克球對決',W/2,110); c.restore(); }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).pickleball={
  name:'匹克球對決',tag:'PICKLEBALL DUEL',color:'#e8f040',online:true,maxPlayers:4,
  coin:o=>{ const O=o.options||{},pr=o.mode==='2p'&&!o.net||(o.net&&o.net.count===2),d=o.net&&o.net.count>2||(pr?['vs','coop'].includes(O.team):O.fmt==='doubles'); return {verb:'先發球',names:d?['左隊','右隊']:o.net?[o.net.names[0]||'玩家 1',o.net.count>1?(o.net.names[1]||'玩家 2'):'電腦']:o.mode==='2p'?['1P','2P']:['你','電腦']}; },
  desc:'從球員背後看的匹克球！單打或雙打，照真實規則：低手發球（四種發球）、雙彈地、廚房區不能截擊。前後左右跑位，揮拍自動判斷抽球或扣殺，「小球」輕輕吊進對方廚房區。單人 200 關（1 對 1 或 2 對 2），雙人同一台，連線最多 4 人。',
  goal:'球在對方那邊落地兩次、或對方失誤（出界、下網、發球落在廚房區或錯的發球區、在廚房區截擊）就贏這球。發球得分制只有發球方贏球才得分，先到 11 分就贏；落地得分制每球都得分，先到 15 分就贏（兩種都不用 Deuce）。發球方得分時，同一位發球員換到另一邊繼續發；雙打發球得分制失誤時換搭檔發，兩人都失誤才換對方。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  options:[{key:'fmt',label:'賽制（單人）',def:'singles',opts:[{id:'singles',label:'單打 1 對 1'},{id:'doubles',label:'雙打：配電腦隊友 2 對 2'}]},
    {key:'score',label:'計分',def:'side',opts:[{id:'side',label:'發球得分制（11 分，不用 Deuce）'},{id:'rally',label:'落地得分制（15 分，不用 Deuce）'}]},
    {key:'serve',label:'預設發球',def:'deep',opts:[{id:'deep',label:'高遠深球'},{id:'drive',label:'快速平擊'},{id:'top',label:'上旋發球'},{id:'slice',label:'側旋發球'}]},
    {key:'team',label:'兩個玩家時（雙人／連線 2 人）',def:'1v1',opts:[{id:'1v1',label:'兩人 1 對 1'},{id:'vs',label:'各配電腦隊友 2 對 2'},{id:'coop',label:'兩人同隊打 2 個電腦'}]},
    {key:'court',label:'場地（雙人／連線）',def:'0',opts:VENUES.map((v,i)=>({id:String(i),label:v.n}))}],
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  stageGoal:i=>{ const S=STAGES[i]; return '第 '+(i+1)+' 關・'+S.name+'：打贏 '+S.foe+'。'+(i<10?'對手很慢、常失誤，先熟悉發球、等彈地和小球。':i<60?'對手開始會上網打小球，你也試著站到廚房線外。':i<130?'對手會在網前截擊，回球要低、打兩邊。':'高手對決：小球、抽球、扣殺都很準。'); },
  stageLocked:i=>i>0&&getRec(i-1)==null,stageBest:i=>{ const v=getRec(i); return v?'✓ '+v.replace(':',' : '):''; },
  hubBest:()=>{ let n=0; for(let i=0;i<LV;i++) if(getRec(i)!=null) n++; return n?'過關 <b>'+n+' / '+LV+'</b>':'尚無紀錄'; },
  help:[['↑ ↓ ← →','前後左右跑位（發球時在底線後的那半邊移動）'],['空白鍵','揮拍：低手發球；自動抽球，球很高時扣殺；按著 ← → 揮拍會往那邊打'],['X','小球：輕輕吊進對方廚房區；發球前按＝換發球種類'],['規則','前兩拍要等球彈地；站在廚房區不能截擊']],
  touchHelp:[['方向盤','前後左右跑位'],['揮拍','發球、自動抽球或扣殺'],['小球','吊進對方廚房區；發球前按＝換發球種類'],['規則','前兩拍等彈地；廚房區不能截擊']],
  touch:{left:'dpad',right:[{l:'小球',c:'KeyX'},{l:'揮拍',c:'Space',act:true}]},
  looks:[{key:'pad',label:'球拍種類',opts:[{id:'std',label:'標準拍'},{id:'long',label:'加長拍'},{id:'wide',label:'寬面拍'}]},{key:'face',label:'拍面顏色',type:'color',opts:['#ff7a3d','#ff5d6d','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#b98cff','#2a2a30']},{key:'grip',label:'握把顏色',type:'color',opts:['#333333','#f4f0e8','#ff5d6d','#4f9dff','#5fd068','#ffd23f']},
    {key:'color',label:'球衣顏色',type:'color',opts:['#ff5d6d','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#b98cff','#ff7eb6']},{key:'hair',label:'髮型',opts:[{id:'0',label:'短髮'},{id:'1',label:'馬尾'},{id:'2',label:'捲毛'}]}],
  best:{label:'過關',fmt:v=>v+' 關',lower:false},
  stageShow,preview,thumb,create,_sim:{stepB,simLand,aimShot,STAGES,inKitchen,NETX,KIT,GY,CW,proj,drawHuman}};
})();
