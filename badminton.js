// 羽球對決：從球員背後看的轉播視角，單打或雙打（寫實球員、骨架動作）。雙打照 BWF：發球區較寬但只到雙打後發球線，發球方得分同一人換邊續發，接發方得分換發球不換位。
//照真實規則：每球得分，先拿 11／15／21 分（要領先 2 分，最多到 30 分）就贏；
//  發球：分數偶數站右半場、奇數站左半場，低手發到斜對角的發球區（要過前發球線、不能出界），掛網、太短、出界都是發球失誤。
//  羽毛球不會彈，落在對方界內就得分；打出界、掛網就失分。擊球依姿勢（撲球、邊跑邊打、太低）會有誤差，自然會掛網或出界。
// 座標：x＝球場長邊（左邊選手在 x<400）、w＝左右、y＝高度（GY 是地面）。操作：方向鍵前後左右跑、跳（空中揮拍＝殺球）、揮拍（自動判斷高遠球／平抽／挑球）、吊球。
(function(){
'use strict';
const W=800,H=450,GY=400,NETX=400,NETTOP=318,BACK=44,CW=135,SSL=103,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,LV=200;
const G=700,K=.0021,REACH=50;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,r1=v=>Math.round(v*10)/10,lerp=(a,b,u)=>a+(b-a)*u;
const LS=(k,v)=>{ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } };
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function shade(hex,k){ const n=parseInt(hex.slice(1),16),f=v=>clamp(Math.round(k>1?v+(255-v)*(k-1):v*k),0,255); return 'rgb('+f(n>>16&255)+','+f(n>>8&255)+','+f(n&255)+')'; }
// 拍子打得到的範圍：身體四周 REACH、高度從膝蓋到伸直手臂（跳起來更高）
const reachD=(p,b)=>{ const h=GY-b.y,base=(GY-p.y); return Math.hypot(b.x-p.x,b.w-p.w,Math.max(0,Math.abs(h-(base+100))-72)); };

/* ---------- 8 個球館，每個 25 關 ---------- */
const VENUES=[
  {n:'學校體育館',wall:['#e8d8b8','#d0b890'],floor:'#3f8a5a',crowd:.3,ban:'#2f6fd0',wood:'#c8945a'},
  {n:'社區活動中心',wall:['#f0e4d0','#d8c4a4'],floor:'#4a9a5e',crowd:.4,ban:'#e0602a',wood:'#c89a62'},
  {n:'公園球場',sky:['#7ec8ff','#d8f0ff'],floor:'#4f9a4a',crowd:.2,tree:1,out:'#6a9a4a'},
  {n:'海濱度假村',sky:['#5ec8ff','#fff1c8'],floor:'#3a8aa8',crowd:.3,sea:1,out:'#e8d098'},
  {n:'城市夜間球館',wall:['#2a2a48','#1a1a30'],floor:'#2f7a52',crowd:.6,night:1,ban:'#b45cff',wood:'#8a6a4a'},
  {n:'山中木屋球館',wall:['#b8875a','#8a5e3a'],floor:'#4a8a5a',crowd:.4,ban:'#3a8a3a',wood:'#a8784a'},
  {n:'全國錦標賽',wall:['#3a4a7a','#24305a'],floor:'#2f6fa8',crowd:.85,ban:'#ffd23f',wood:'#7a6a5a'},
  {n:'國際大賽主場',wall:['#5a2a3a','#3a1424'],floor:'#2a7ac0',crowd:1,night:1,ban:'#ff5d8f',wood:'#6a5040'}];
const FOES=['小安','阿凱','小美','大熊','阿宏','小芸','志明','春嬌','阿哲','小琪','大山','阿妹','小傑','阿娟','大寶','小芳','阿翔','小雯','阿德','小蓉','阿強','小慧','阿龍','小婷','阿偉'];
const FCOL=['#4f9dff','#ff9d3d','#5fd068','#b98cff','#ff5d8f','#3ddbd9','#e8c040','#ff6b4a'];
const STAGES=Array.from({length:LV},(_,i)=>{ const v=Math.floor(i/25),k=i/(LV-1); return {i,v,k,foe:FOES[(i*7+v*3)%FOES.length]+(i>=100?'・進階':''),col:FCOL[(i*3+1)%FCOL.length],hair:i%3,name:VENUES[v].n+' '+(i%25+1),stars:Math.min(5,1+Math.floor(i/40))}; });
const recKey=i=>'arcade.badminton.w.'+i,getRec=i=>LS(recKey(i));

/* ---------- 羽毛球：重力＋空氣阻力（速度越快阻力越大），左右等速 ---------- */
function stepSh(s,dt){ const sp=Math.hypot(s.vx,s.vy); s.vx-=K*sp*s.vx*dt; s.vy+=(G-K*sp*s.vy)*dt; s.x+=s.vx*dt; s.y+=s.vy*dt; s.w=(s.w||0)+(s.vw||0)*dt; s.vw=(s.vw||0)*(1-1.2*dt); }
function simLand(x,y,vx,vy){ const s={x,y,vx,vy}; let netY=null,t=0; for(let i=0;i<600;i++){ const px=s.x; stepSh(s,1/90); t+=1/90; if(netY==null&&(px-NETX)*(s.x-NETX)<=0) netY=s.y; if(s.y>=GY) break; } return {x:s.x,netY,t}; }
function aimShot(x,y,tx,angs,dir){ for(const a of angs){ const ca=Math.cos(a*Math.PI/180)*dir,sa=-Math.sin(a*Math.PI/180); let lo=100,hi=1900,best=null;
    for(let it=0;it<18;it++){ const v=(lo+hi)/2,L=simLand(x,y,ca*v,sa*v); if((L.x-tx)*dir<0) lo=v; else hi=v; best={v,L}; }
    if(best&&best.L.netY!=null&&best.L.netY<NETTOP-10&&Math.abs(best.L.x-tx)<40) return {vx:ca*best.v,vy:sa*best.v,t:best.L.t}; } return null; }
function aimFixed(x,y,tx,v,dir,a0,a1){ let best=null,bd=1e9; for(let a=a0;a<=a1;a+=1.5){ const ca=Math.cos(a*Math.PI/180)*dir,sa=-Math.sin(a*Math.PI/180),L=simLand(x,y,ca*v,sa*v);
    if(L.netY==null||L.netY>=NETTOP-8||L.x<BACK+12||L.x>W-BACK-12||(L.x-NETX)*dir<40) continue; const d=Math.abs(L.x-tx); if(d<bd){ bd=d; best={vx:ca*v,vy:sa*v,t:L.t}; } } return best&&bd<120?best:null; }

/* ---------- 透視鏡頭 ---------- */
const CAMX=-360,CAMH=270,FOC=520,HY=64,SCP=.52,SWD=.4;
function proj(x,w,h,ct){ if(ct===1){ x=W-x; w=-w; } const d=Math.max(30,x-CAMX),s=FOC/d; return [W/2+w*s,HY+(CAMH-h)*s,s,d]; }

/* ---------- 寫實球員：骨架＋關鍵影格（約 7.5 頭身） ----------
   身體座標：x＝球員自己的右手邊、y＝往上（腳底 0、頭頂約 176）、z＝球員面向的前方。
   正面看（front）：右手在畫面左邊、前方朝鏡頭；背面看：右手在畫面右邊、前方遠離鏡頭。 */
const SKINS=['#f1c9a5','#e8b88f','#d9a37a','#c48a62'];
function lerp3(a,b,u){ return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u]; }
function keyAt(K,u){ for(let i=0;i<K.length-1;i++){ if(u<=K[i+1][0]){ const s=(u-K[i][0])/Math.max(1e-6,K[i+1][0]-K[i][0]),e=s*s*(3-2*s); return lerp3(K[i][1],K[i+1][1],e); } } return K[K.length-1][1]; }
// 揮拍動作：拿拍手的位置（關鍵影格 u＝0～1，0.45 左右擊球）、肩膀轉多少、膝蓋蹲多少
const SWING={
  ready:{hand:[[0,[24,122,32]],[1,[24,122,32]]],rot:[[0,0],[1,0]],crouch:.35},
  fh:{hand:[[0,[12,112,24]],[.28,[46,104,-30]],[.45,[34,98,30]],[.75,[-8,140,30]],[1,[-14,138,22]]],rot:[[0,0],[.28,-.7],[.45,.1],[.75,.6],[1,.4]],crouch:.45},
  bh:{hand:[[0,[10,112,24]],[.28,[-34,108,-24]],[.45,[-20,100,30]],[.75,[30,138,24]],[1,[34,134,16]]],rot:[[0,0],[.28,.7],[.45,0],[.75,-.5],[1,-.35]],crouch:.45},
  net:{hand:[[0,[14,118,26]],[.3,[18,110,14]],[.45,[12,124,40]],[.75,[8,128,44]],[1,[8,126,36]]],rot:[[0,0],[.3,-.15],[.45,0],[1,.05]],crouch:.75},
  dink:{hand:[[0,[12,100,26]],[.3,[16,62,6]],[.45,[12,70,30]],[.75,[8,92,40]],[1,[8,96,34]]],rot:[[0,0],[.3,-.15],[.45,0],[1,.05]],crouch:.85},
  over:{hand:[[0,[18,156,6]],[.28,[30,150,-30]],[.45,[14,204,22]],[.75,[-6,104,30]],[1,[-14,98,20]]],rot:[[0,0],[.28,-.6],[.45,.15],[.75,.5],[1,.35]],crouch:.25},
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
      if(racket&&st.pad&&st.pad.racket){ const H=P(hd),E=P(el),a=Math.atan2(H[1]-E[1],H[0]-E[0]),up=!st.type||st.type==='ready'; /* 準備姿勢：拍頭朝上舉在身前 */ c.save(); c.translate(H[0],H[1]); c.rotate(up?m*.35:a+Math.PI/2); c.scale(sc,sc); c.fillStyle='#2a2a30'; c.fillRect(-2.2,-10,4.4,12); c.strokeStyle='#cfd2dc'; c.lineWidth=1.6; c.beginPath(); c.moveTo(0,-10); c.lineTo(0,-30); c.stroke(); c.strokeStyle=st.pad.face||'#ff7a3d'; c.lineWidth=2.2; c.beginPath(); c.ellipse(0,-42,8.5,12,0,0,TAU); c.stroke(); c.strokeStyle='rgba(255,255,255,.55)'; c.lineWidth=.6; c.beginPath(); for(let i=-6;i<=6;i+=3){ const hh=12*Math.sqrt(1-(i/8.5)**2); c.moveTo(i,-42-hh); c.lineTo(i,-42+hh); } for(let j=-9;j<=9;j+=3){ const ww=8.5*Math.sqrt(1-(j/12)**2); c.moveTo(-ww,-42+j); c.lineTo(ww,-42+j); } c.stroke(); c.restore(); }
      else if(racket&&st.pad){ const H=P(hd),E=P(el),a=Math.atan2(H[1]-E[1],H[0]-E[0]),PD=st.pad,shp=PD.pad==='long'?[15,32,6]:PD.pad==='wide'?[22,25,9]:[19,27,7]; c.save(); c.translate(H[0],H[1]); c.rotate(a+Math.PI/2); c.scale(sc,sc); c.fillStyle=PD.grip||'#333'; c.fillRect(-2.5,-12,5,13); c.fillStyle=PD.face||'#ff7a3d'; c.strokeStyle='rgba(0,0,0,.4)'; c.lineWidth=1.2; rr(c,-shp[0]/2,-12-shp[1],shp[0],shp[1],shp[2]); c.fill(); c.stroke(); c.strokeStyle='rgba(255,255,255,.45)'; rr(c,-shp[0]/2+2,-10-shp[1],shp[0]-4,shp[1]-4,shp[2]-2); c.stroke(); c.restore(); }
      const H=P(hd); c.fillStyle=skin; c.beginPath(); c.arc(H[0],H[1],4.2*sc,0,TAU); c.fill(); }}); };
  arm('R',true); arm('L',false);
  parts.sort((a,b)=>a.z-b.z).forEach(p=>p.f());
  if(st.label){ const H=P(J.head); c.font='900 17px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=4; c.strokeStyle='#14122b'; c.strokeText(st.label,H[0],H[1]-30*sc-8); c.fillStyle='#ffd23f'; c.fillText(st.label,H[0],H[1]-30*sc-8); } }

function drawShuttle(c,b,ct){ const g=proj(b.x,b.w||0,0,ct),p=proj(b.x,b.w||0,GY-b.y,ct),q=proj(b.x-(b.vx||1)*.02,(b.w||0)-(b.vw||0)*.02,GY-b.y+(b.vy||0)*.02,ct),s=Math.max(.35,p[2]*.6);
  c.fillStyle='rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(g[0],g[1],7*s,2.5*s,0,0,TAU); c.fill();
  const a=Math.atan2(p[1]-q[1],p[0]-q[0]); c.save(); c.translate(p[0],p[1]); c.rotate(a); c.scale(s,s); c.fillStyle='#fff'; c.strokeStyle='#8a8a9a'; c.lineWidth=1.2; c.beginPath(); c.moveTo(-2,-4); c.lineTo(-17,-9); c.lineTo(-17,9); c.lineTo(-2,4); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#d8302a'; c.fillRect(-14,-8,2.5,16); c.fillStyle='#f4ead8'; c.beginPath(); c.arc(1,0,5,0,TAU); c.fill(); c.stroke(); c.restore(); }

/* ---------- 球館背景＋羽球場（線：單打邊線、雙打邊線、前發球線、中線、雙打後發球線） ---------- */
const BGC={};
function courtBg(v){ if(BGC[v]) return BGC[v]; const e=document.createElement('canvas'); e.width=W; e.height=H; const c=e.getContext('2d'),V=VENUES[v],R=n=>((Math.sin(n*12.9898+v*7.1)*43758.5453)%1+1)%1,hz=166;
  if(V.wall){ const g=c.createLinearGradient(0,0,0,hz); g.addColorStop(0,V.wall[1]); g.addColorStop(1,V.wall[0]); c.fillStyle=g; c.fillRect(0,0,W,hz+4);
    for(let i=0;i<6;i++){ const x=70+i*132; c.fillStyle='#ddd'; c.fillRect(x-28,6,56,8); const lg=c.createRadialGradient(x,14,2,x,14,80); lg.addColorStop(0,'rgba(255,255,230,.5)'); lg.addColorStop(1,'rgba(255,255,230,0)'); c.fillStyle=lg; c.fillRect(x-80,0,160,90); }
    c.fillStyle=V.ban; rr(c,280,60,240,32,8); c.fill(); c.fillStyle='#fff'; c.font='900 19px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(V.n,400,77);
    c.fillStyle=V.night?'#1a1a2a':'#7a6a5a'; c.fillRect(0,104,W,hz-104); for(let r=0;r<3;r++){ c.fillStyle=r%2?'rgba(0,0,0,.16)':'rgba(255,255,255,.06)'; c.fillRect(0,106+r*20,W,18); }
    const n=Math.round(90*V.crowd); for(let i=0;i<n;i++){ c.fillStyle=['#ff6b6b','#4f9dff','#ffd23f','#5fd068','#b98cff','#ff9d3d'][i%6]; const x=(i*53)%W+6,y=118+(i%3)*20; c.beginPath(); c.arc(x,y,6,0,TAU); c.fill(); c.fillStyle='#f1c9a5'; c.beginPath(); c.arc(x,y-9,4.5,0,TAU); c.fill(); }
    c.fillStyle=V.wood; c.fillRect(0,hz,W,H-hz); c.strokeStyle='rgba(0,0,0,.08)'; c.lineWidth=1; for(let y=hz+6;y<H;y+=6+(y-hz)*.08){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); } }
  else { const g=c.createLinearGradient(0,0,0,hz); g.addColorStop(0,V.sky[0]); g.addColorStop(1,V.sky[1]); c.fillStyle=g; c.fillRect(0,0,W,hz+4); c.fillStyle='rgba(255,255,255,.85)'; for(const [x,y,s] of [[150,44,1],[480,30,1.3],[700,62,.8]]){ c.beginPath(); c.arc(x,y,18*s,0,TAU); c.arc(x+20*s,y+5,14*s,0,TAU); c.arc(x-18*s,y+6,12*s,0,TAU); c.fill(); }
    if(V.sea){ c.fillStyle='#2f8ad0'; c.fillRect(0,130,W,hz-130); for(const px of [70,730]){ c.strokeStyle='#7a5a3a'; c.lineWidth=7; c.beginPath(); c.moveTo(px,hz); c.quadraticCurveTo(px+8,120,px,84); c.stroke(); c.fillStyle='#3a9a4a'; for(let a=0;a<6;a++){ c.save(); c.translate(px,84); c.rotate(a*1.05); c.beginPath(); c.ellipse(22,0,24,6,.3,0,TAU); c.fill(); c.restore(); } } }
    if(V.tree){ for(let i=0;i<9;i++){ const tx=20+i*95+R(i)*20; c.fillStyle='#6a4a2a'; c.fillRect(tx-5,hz-56,10,56); c.fillStyle='#3f8a3a'; c.beginPath(); c.arc(tx,hz-66,26+R(i+5)*10,0,TAU); c.fill(); } }
    c.fillStyle=V.out; c.fillRect(0,hz,W,H-hz); }
  const Q=(pts,col)=>{ c.fillStyle=col; c.beginPath(); pts.forEach((p,i)=>{ const q=proj(p[0],p[1],0,0); i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]); }); c.closePath(); c.fill(); };
  const L=(a,b)=>{ const p=proj(a[0],a[1],0,0),q=proj(b[0],b[1],0,0); c.beginPath(); c.moveTo(p[0],p[1]); c.lineTo(q[0],q[1]); c.stroke(); };
  const DW=CW+24; Q([[BACK-30,-DW-30],[W-BACK+30,-DW-30],[W-BACK+30,DW+30],[BACK-30,DW+30]],shade(V.floor,.85)); Q([[BACK,-DW],[W-BACK,-DW],[W-BACK,DW],[BACK,DW]],V.floor);
  c.strokeStyle='#fff'; c.lineWidth=2.4; for(const w of [-DW,-CW,CW,DW]) L([BACK,w],[W-BACK,w]); L([BACK,-DW],[BACK,DW]); L([W-BACK,-DW],[W-BACK,DW]);
  for(const s of [-1,1]){ L([NETX+s*SSL,-DW],[NETX+s*SSL,DW]); L([NETX+s*SSL,0],[s>0?W-BACK:BACK,0]); L([s>0?W-BACK-40:BACK+40,-DW],[s>0?W-BACK-40:BACK+40,DW]); }
  return BGC[v]=e; }
function drawNet(c,ct){ const DW=CW+24,a=proj(NETX,-DW-6,0,ct),b=proj(NETX,DW+6,0,ct),at=proj(NETX,-DW-6,GY-NETTOP,ct),bt=proj(NETX,DW+6,GY-NETTOP,ct),ab=proj(NETX,-DW-6,(GY-NETTOP)*.55,ct),bb=proj(NETX,DW+6,(GY-NETTOP)*.55,ct);
  c.fillStyle='rgba(20,20,26,.4)'; c.beginPath(); c.moveTo(at[0],at[1]); c.lineTo(bt[0],bt[1]); c.lineTo(bb[0],bb[1]); c.lineTo(ab[0],ab[1]); c.closePath(); c.fill();
  c.strokeStyle='rgba(255,255,255,.25)'; c.lineWidth=1; for(let i=1;i<30;i++){ const u=i/30; c.beginPath(); c.moveTo(lerp(at[0],bt[0],u),lerp(at[1],bt[1],u)); c.lineTo(lerp(ab[0],bb[0],u),lerp(ab[1],bb[1],u)); c.stroke(); }
  c.strokeStyle='#fff'; c.lineWidth=3; c.beginPath(); c.moveTo(at[0],at[1]); c.lineTo(bt[0],bt[1]); c.stroke(); c.fillStyle='#2a2a30'; c.fillRect(a[0]-3,at[1]-2,6,a[1]-at[1]+2); c.fillRect(b[0]-3,bt[1]-2,6,b[1]-bt[1]+2); }

/* ---------- 遊戲 ---------- */
function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,two=!net&&opts.mode==='2p',solo=!net&&!two,OPT=opts.options||{};
  // 雙打：照 BWF 規則。場地兩邊多出雙打邊線；發球區比單打寬，但後面只到雙打後發球線（底線前 40）。
  const TM=['vs','coop'].includes(OPT.team)?OPT.team:'1v1',pair=two||(!!net&&net.count===2); // 兩個真人：1 對 1、各配電腦 2 對 2、兩人同隊打 2 個電腦
  const dbl=net&&net.count>2?true:pair?TM!=='1v1':OPT.fmt==='doubles',N=dbl?4:2,coop=pair&&dbl&&TM==='coop',SL=h=>coop&&h===1?2:h,HI=i=>coop?(i===2?1:i===1?-1:i):i,me=net?SL(Math.min(N-1,net.me)):0,DW=CW+24,PW=dbl?DW:CW,SVB=dbl?40:0;
  const {ctx:c}=env.canvas2d(W,H),si=clamp(opts.stage|0,0,LV-1),ST=STAGES[si],GOAL=[11,15,21].includes(+OPT.win)?+OPT.win:11,CAP=GOAL+9;
  const vsAI=solo||(net&&net.count<2)||(dbl&&(net?net.count:two?2:1)<N),k=vsAI?ST.k:1,AI={spd:170+120*k,react:.36-.22*k,err:200-160*k,lat:110-80*k,smash:k<.12?0:.15+.55*k,drop:.1+.35*k};
  const ctrl=[]; for(let i=0;i<N;i++){ let cc='ai';
    if(net){ const h=HI(i); if(h>=0&&h<net.count) cc=i===me?'self':'net'; }
    else if(two){ if(!dbl) cc=i===0?'key0':'key1'; else if(coop) cc=i===0?'key0':i===2?'key1':'ai'; else cc=i===0?'key0':i===1?'key1':'ai'; }
    else cc=i===0?'solo':'ai'; ctrl.push(cc); }
  const isAI=i=>ctrl[i]==='ai',human=i=>!isAI(i),CT=net?ps0team():0; function ps0team(){ return me%2; }
  const RW=t=>t?-1:1;
  const mk=n=>({n,team:n%2,side:dbl?(n<2?1:-1):1,x:n%2?600:200,w:0,y:GY,vy:0,face:n%2?-1:1,sw:0,hitOK:false,drop:false,moving:false,tx:n%2?600:200,tw:0,swType:'ready',run:0,aim:0});
  const ps=Array.from({length:N},(_,i)=>mk(i)),sh={x:200,y:300,w:0,vx:0,vy:0,vw:0,held:0,tx:200,ty:300,tw:0},fx=[],score=[0,0];
  const ALTC=['#ff5d6d',solo&&!dbl?ST.col:'#4f9dff','#ff9d3d','#3ddbd9'];
  ps.forEach((p,i)=>{ p.look=Object.assign({color:ALTC[i],hair:i===1&&solo&&!dbl?ST.hair:i%3},(net?net.looks&&HI(i)>=0&&net.looks[HI(i)]:i===0?opts.look:null)||{}); if(!p.look.color) p.look.color=ALTC[i]; });
  // 兩個真人同一隊（自己用方向鍵跑位）不容易站得剛好，打得到球的距離放寬一點
  for(const p of ps){ const m=ps.find(q=>q.team===p.team&&q!==p); p.rm=dbl&&m&&human(p.n)&&human(m.n)?1.4:1; }
  for(let i=1;i<N;i++) if(ps[i].team!==ps[0].team&&ps[i].look.color===ps[0].look.color) ps[i].look.color=ps[0].look.color==='#4f9dff'?'#5fd068':'#4f9dff';
  const nm=i=>net?(HI(i)>=0&&HI(i)<net.count?(net.names[HI(i)]||'玩家 '+(HI(i)+1)):'電腦'+(i+1)):ctrl[i]==='key0'?'1P':ctrl[i]==='key1'?'2P':ctrl[i]==='solo'?(opts.name||'你'):(dbl&&ps[i].team===0?'電腦隊友':ST.foe+(dbl?(i<2?'A':'B'):'（電腦）'));
  const names=ps.map((p,i)=>nm(i)),myTeam=me%2,TN=tm=>dbl?(!two&&tm===myTeam?'我方':tm?'右隊':'左隊'):names[tm];
  let t=0,phase='serve',ptT=0,lastHit=-1,lastTeam=-1,servT=opts.first===1?1:0,server=-1,lastW=-1,ended=false,overT=0,rally=0,best=0,shake=0,aiServeT=1.2,ev=[],sendT=0,msg='',msgT=0,introT=2.4,svSign=1,recv=-1;
  const aiS=ps.map(()=>({pred:null,t:0,dec:{n:-1},react:0,rt:0})),rin=ps.map(()=>({dx:0,dy:0,jump:false,sw:false,drop:false}));
  const sfx=n=>{ env.sfx(n); if(net&&net.host) ev.push(n); };
  const pop=(txt,col,x,w,h)=>fx.push({k:'txt',txt,col,x,w,h,t:0});
  const sideOf=p=>dbl?p.side:(score[p.team]%2?-1:1);
  // 發球的人：單打就是那一隊；雙打是「站在跟發球方分數單雙數對應那一邊」的人（偶數右、奇數左）
  function pickServer(){ const sd=score[servT]%2?-1:1; return dbl?ps.find(q=>q.team===servT&&q.side===sd).n:servT; }
  function setServe(){ phase='serve'; lastHit=-1; lastTeam=-1; rally=0; aiServeT=1.1; server=pickServer(); sh.held=server; const S=ps[server]; svSign=RW(S.team)*sideOf(S);
    recv=dbl?ps.find(q=>q.team!==servT&&RW(q.team)*q.side===-svSign).n:1-servT;
    for(const p of ps){ p.y=GY; p.vy=0; p.sw=0; const sw=RW(p.team)*sideOf(p),fwd=p.team?-1:1;
      if(p.n===server){ p.x=NETX-fwd*(SSL+60); p.w=svSign*50; }
      else if(p.n===recv){ p.x=NETX-fwd*(SSL+70); p.w=-svSign*50; }
      else if(p.team===servT){ p.x=NETX-fwd*(SSL+150); p.w=-svSign*60; } // 發球方搭檔站在後面另一半
      else { p.x=NETX-fwd*(SSL+150); p.w=svSign*60; } }
    for(const a of aiS) a.pred=null; }
  setServe();
  function keyIn(which){ const kk=env.keys;
    if(which==='key0') return {dx:(kk.KeyD?1:0)-(kk.KeyA?1:0),dy:(kk.KeyW?1:0)-(kk.KeyS?1:0),jump:!!kk.KeyR||!!kk.KeyE,sw:env.hit('KeyF')||env.hit('Space'),drop:env.hit('KeyG')};
    if(which==='key1') return {dx:(kk.ArrowRight?1:0)-(kk.ArrowLeft?1:0),dy:(kk.ArrowUp?1:0)-(kk.ArrowDown?1:0),jump:!!kk.ShiftRight||!!kk.Numpad0,sw:env.hit('Enter')||env.hit('NumpadEnter'),drop:env.hit('Slash')||env.hit('Period')};
    return {dx:(kk.ArrowRight||kk.KeyD?1:0)-(kk.ArrowLeft||kk.KeyA?1:0),dy:(kk.ArrowUp||kk.KeyW?1:0)-(kk.ArrowDown||kk.KeyS?1:0),jump:!!kk.KeyC||!!kk.KeyL,sw:env.hit('Space')||env.hit('KeyJ')||env.hit('Enter'),drop:env.hit('KeyX')||env.hit('KeyK')}; }
  function inputOf(n,dt){ const cc=ctrl[n]; if(cc==='ai') return aiInput(ps[n],dt); if(cc==='net'){ const r=rin[n],o={dx:r.dx,dy:r.dy,jump:r.jump,sw:r.sw,drop:r.drop}; r.sw=r.drop=false; return o; } return keyIn(cc==='self'?'solo':cc); }
  const mySide=p=>p.team?sh.x>NETX:sh.x<NETX;
  // 電腦：沿著羽毛球路線找最早跑得到、拍子打得到的點
  function predict(p){ const s={x:sh.x,y:sh.y,w:sh.w,vx:sh.vx,vy:sh.vy,vw:sh.vw}; let last=null; for(let i=1;i<420;i++){ stepSh(s,1/90); if(s.y>=GY) break; if(p.team?s.x<=NETX+8:s.x>=NETX-8) continue; const h=GY-s.y; if(h<20||h>176) continue; last={x:s.x,w:s.w,h,t:i/90};
      const need=Math.max(0,Math.hypot(s.x-p.x,s.w-p.w)-REACH*.5)/AI.spd+AI.react; if(need<=i/90) return last; } return last||{x:sh.x,w:sh.w,h:0,t:0}; }
  // 雙打誰去接：發球只能由接發球的人接；之後離得近的去（隊友是真人時，照左右半邊分工）
  function mine(p,pred){ if(!dbl) return true; if(rally===0&&lastTeam>=0) return p.n===recv; const mate=ps.find(q=>q.team===p.team&&q!==p),dm=Math.hypot(mate.x-pred.x,mate.w-pred.w),dp=Math.hypot(p.x-pred.x,p.w-pred.w);
    if(!human(mate.n)) return dp<=dm;
    // 隊友是真人：照他站的前後分工——他在網前，後場的球我去；他在後場，網前的球我去；他在中間就左右分工；離他太遠的球也由我補
    const mz=zoneOf(mate),pd=Math.abs(pred.x-NETX),far=Math.abs(pred.w-mate.w)>110;
    if(mz==='front') return pd>190||far; if(mz==='back') return pd<200||far;
    return Math.sign(pred.w||1)===Math.sign(p.w||1)&&dp<dm+60; }
  const zoneOf=q=>{ const d=Math.abs(q.x-NETX); return d<175?'front':d>240?'back':'mid'; };
  function aiInput(p,dt){ const o={dx:0,dy:0,jump:false,sw:false,drop:false,wx:0,ww:0},A=aiS[p.n],dir=p.face;
    if(phase==='serve'){ if(sh.held===p.n&&introT<=0&&(aiServeT-=dt)<=0){ const sht=dbl?Math.random()<.75:Math.random()<.5*k; o.sw=!sht; o.drop=sht; } return o; }
    if(phase!=='play') return o;
    const coming=lastTeam>=0&&lastTeam!==p.team;
    if(coming){ if((A.t-=dt)<=0||!A.pred){ A.t=.1; A.pred=predict(p); if(A.dec.n!==rally){ const ty=sh.type; A.dec={n:rally,whiff:Math.random()<(ty==='smash'?.42-.32*k:ty==='drive'?.18-.14*k:.08-.07*k),jmp:Math.random()<(sh.weak?Math.min(.95,AI.smash*1.7):AI.smash),off:(Math.random()-.5)*AI.err*.25}; } } A.react-=dt; }
    else { A.pred=null; A.react=AI.react; }
    // 站位：單打回中央，越強越會預判；雙打：進攻時前後站（殺球的人在後、隊友在網前），防守時左右站
    const mx=x=>p.team?x:W-x,myT=lastTeam===p.team?sh.type:'';
    let baseX=k<.3?mx(620):myT==='drop'||myT==='net'?mx(lerp(590,NETX+110,k)):myT==='smash'?mx(lerp(600,540,k)):myT==='clear'||myT==='lift'?mx(lerp(610,600,k)):mx(lerp(620,565,k)),baseW=0;
    if(dbl){ const mate=ps.find(q=>q.team===p.team&&q!==p),attack=lastTeam===p.team&&(sh.type==='smash'||sh.type==='drop'||sh.type==='net'||sh.type==='drive');
      if(attack&&k>.3){ const front=lastHit===p.n?Math.abs(p.x-NETX)<Math.abs(mate.x-NETX):Math.abs(p.x-NETX)<=Math.abs(mate.x-NETX); baseX=front?NETX-dir*95:NETX-dir*250; baseW=front?clamp(sh.w*.4,-60,60):0; }
      else { baseX=NETX-dir*215; baseW=RW(p.team)*p.side*68; }
      // 隊友是真人：像真人搭檔一樣補位——你上網我就退後場中間；你退後場，進攻時我上網、防守時我站你的另一邊；你在中間我就站另一邊
      if(human(mate.n)){ const mz=zoneOf(mate),atk=attack||(coming&&GY-sh.y>120&&Math.abs(sh.x-NETX)>220&&Math.sign(sh.w||1)===Math.sign(mate.w||1));
        let role=mz==='front'?'back':mz==='back'&&atk?'front':'side'; if(A.role&&A.role!==role&&(A.roleT||0)<.5){ role=A.role; } if(role!==A.role){ A.role=role; A.roleT=0; } A.roleT=(A.roleT||0)+dt;
        if(role==='back'){ baseX=NETX-dir*265; baseW=clamp(sh.w*.35,-50,50); }
        else if(role==='front'){ baseX=NETX-dir*100; baseW=clamp(sh.w*.5,-60,60); }
        else { baseX=NETX-dir*215; baseW=-Math.sign(mate.w||RW(p.team)*p.side*-1)*70; } } }
    const shade=clamp(sh.w+(sh.vw||0)*.3,-PW,PW)*(.1+.4*k)*(dbl?.5:1); if(coming) A.rt=0; else A.rt+=dt;
    const go=coming&&A.pred&&mine(p,A.pred);
    let tx=go?A.pred.x-dir*6+(A.dec.off||0):baseX,tw=go?A.pred.w:baseW+shade;
    if(!coming&&!(dbl&&human(ps.find(q=>q.team===p.team&&q!==p).n))&&(A.rt<(1-k)*.45||Math.hypot(tx-p.x,tw-p.w)<(1-k)*60)){ tx=p.x; tw=p.w; } // 當你的隊友時一定補位，不偷懶
    tx=p.team?clamp(tx,NETX+30,W+40):clamp(tx,-40,NETX-30);
    o.wx=tx-p.x; o.ww=tw-p.w;
    if(go&&A.dec.jmp&&p.y>=GY&&sh.vy>0&&GY-sh.y>150&&GY-sh.y<230&&Math.hypot(sh.x-p.x,sh.w-p.w)<70) o.jump=true;
    if(A.react<=0&&go&&mySide(p)&&reachD(p,sh)<REACH*.9&&!(A.dec.n===rally&&A.dec.whiff)) o.sw=true; return o; }
  // 擊球
  function shoot(p,dropKey){ const dir=p.face,opp=ps.filter(q=>q.team!==p.team),R=Math.random,ai=isAI(p.n),h=GY-sh.y,air=p.y<GY-10,nearNet=Math.abs(sh.x-NETX)<140;
    let type=dropKey?'drop':air&&h>p.y*0+GY-p.y+150?'smash':nearNet&&h<GY-NETTOP+10?'net':h<60?'lift':h>150?'clear':'drive';
    const oFar=Math.min(...opp.map(o=>Math.abs(o.x-NETX)))/(NETX-BACK);
    if(ai&&(type==='clear'||type==='drive'||type==='lift')){ if(oFar>.62&&R()<AI.drop*1.6) type='drop'; else if(oFar<.4&&type!=='lift') type='clear'; else if(dbl&&type==='drive'&&R()<.3) type='drive'; }
    const oppBack=dir>0?W-BACK:BACK; let tx,v=null;
    if(type==='clear'||type==='lift') tx=oppBack-dir*(30+R()*70); else if(type==='drop'||type==='net') tx=NETX+dir*(55+R()*70); else if(type==='smash') tx=oFar>.55?NETX+dir*(110+R()*90):oppBack-dir*(70+R()*80); else tx=NETX+dir*(200+R()*140);
    if(ai) tx+=(R()-.5)*AI.err;
    const ANG={clear:[48,56,64],lift:[62,70,76],drive:[10,18,26,36],drop:[24,34,46,58],net:[30,44,58,70],smash:[-22,-14,-6,4,14]}[type];
    v=(type==='smash'?aimFixed(sh.x,sh.y,tx,(ai?.8+.2*k:1)*(1000+480*clamp(1-Math.abs(sh.x-NETX)/(NETX-BACK),0,1)),dir,-40,20):type==='drive'?aimFixed(sh.x,sh.y,tx,ai?850+250*k:1050,dir,-8,28):null)||aimShot(sh.x,sh.y,tx,ANG,dir)||aimShot(sh.x,sh.y,oppBack-dir*80,[50,60,70,78],dir)||{vx:dir*260,vy:-760,t:1.4};
    // 左右：按著左右就往那邊，不然打對手比較少的那一邊（雙打常打兩人中間）
    const oW=opp.reduce((a,o)=>a+o.w,0)/opp.length; let tw=p.aim?p.aim*(60+R()*(PW-80)):dbl&&R()<.35?(opp[0].w+opp[1].w)/2:(oW>0?-1:1)*(40+R()*(PW-65)); if(type==='net'||type==='drop') tw=clamp(sh.w*.4+(R()-.5)*90,-PW+15,PW-15); if(ai) tw+=(R()-.5)*AI.lat; tw=clamp(tw,-PW+8,PW-8);
    const stretch=clamp(reachD(p,sh)/(REACH*(p.rm||1)),0,1),base={net:.3,drop:.34,drive:.24,smash:.2,clear:.18,lift:.2}[type]||.22; let e=base*(1+stretch*1.6+(p.moving?.45:0)+(h<40?.6:0))*(ai?(1.45-1.05*k):1);
    const gs=()=>((R()+R()+R())/1.5-1); v={vx:v.vx*(1+gs()*e*.3),vy:v.vy*(1+gs()*e*.38),t:v.t}; tw+=gs()*e*140;
    sh.vx=v.vx; sh.vy=v.vy; sh.vw=(tw-sh.w)/Math.max(.3,(v.t||1)*.9); sh.type=type; sh.weak=stretch>.8; sh.net=0; lastHit=p.n; lastTeam=p.team; rally++; best=Math.max(best,rally);
    p.swType=type==='smash'||type==='clear'?'over':type==='net'||type==='drop'&&h<100?'net':((sh.w-p.w)*RW(p.team)>=0?'fh':'bh'); p.sw=SWD*.55;
    if(type==='smash'){ sfx('boom'); shake=.25; pop('殺球！','#ff5d8f',sh.x,sh.w,h+40); } else { sfx(type==='drop'||type==='net'?'pop':'place'); if(type==='drop'||type==='net') pop('吊球','#7af0ff',sh.x,sh.w,h+40); }
    fx.push({k:'ring',x:sh.x,w:sh.w,h,t:0,col:type==='smash'?'#ff5d8f':'#fff'}); sh.smash=type==='smash'?.5:0; for(const a of aiS) a.pred=null; }
  // 得分（每球得分）：發球方贏＝同一人換到另一邊續發（雙打跟搭檔交換位置）；接發球方贏＝得分並換發球，站位不換
  function point(w,why){ score[w]++; lastW=w; phase='point'; ptT=1.5; let txt='';
    if(w===servT){ if(dbl){ const S=ps[server],P=ps.find(q=>q.team===w&&q!==S),sd=S.side; S.side=P.side; P.side=sd; } txt=dbl?'發球方得分，同一人換邊續發':''; }
    else { servT=w; txt=dbl?'換發球（站位不換）':''; }
    const my=w===myTeam; msg=(two?(dbl?TN(w):w?'2P':'1P')+' 得分':my?'得分！':'失分')+'　'+why+(txt?'　'+txt:''); msgT=1.6; env.sfx(two||my?'item':'hurt'); if(net) ev.push('p'+w);
    const a=score[0],b=score[1],hi=Math.max(a,b),lo=Math.min(a,b); if((hi>=GOAL&&hi-lo>=2)||hi>=CAP){ phase='over'; overT=0; } }
  function conclude(a,b,note){ if(ended) return; ended=true; score[0]=a; score[1]=b; const w=a>b?0:1,mine2=two||w===myTeam;
    if(solo&&w===0){ const old=getRec(si); if(old==null||a-b>+old.split(':')[0]-+old.split(':')[1]) LS(recKey(si),a+':'+b); }
    env.sfx(mine2?'win':'lose'); env.end({title:two?(dbl?TN(w):w?'2P':'1P')+' 獲勝！':mine2?(solo?'贏了！過關':'你們贏了！'):'輸了',big:a+' : '+b,text:(note?note+' ':'')+(solo?ST.name+'　對手：'+ST.foe+(dbl?'隊':'')+'。':'')+(best>2?'最長來回 '+best+' 拍。':''),score:solo&&w===0?si+1:null,next:solo&&w===0&&si<LV-1}); }
  function snap(){ const m={s:[ps.map(p=>[r1(p.x),r1(p.w),r1(p.y),r1(p.sw),p.swType,p.moving?1:0,p.side]),r1(sh.x),r1(sh.y),r1(sh.w),r1(sh.vx),r1(sh.vy),r1(sh.vw),score[0],score[1],sh.held,['serve','play','point','over'].indexOf(phase),lastW,rally,server,servT,recv],e:ev,m:msgT>0?msg:''}; ev=[]; return m; }
  if(net){ if(client) net.onmsg=m=>{ if(m.s){ const s=m.s; s[0].forEach((q,i)=>{ const p=ps[i]; if(!p) return; p.tx=q[0]; p.tw=q[1]; p.y=q[2]; p.sw=q[3]; p.swType=q[4]; p.moving=!!q[5]; p.side=q[6]; }); sh.tx=s[1]; sh.ty=s[2]; sh.tw=s[3]; sh.vx=s[4]; sh.vy=s[5]; sh.vw=s[6]; score[0]=s[7]; score[1]=s[8]; sh.held=s[9]; phase=['serve','play','point','over'][s[10]]; lastW=s[11]; rally=s[12]; server=s[13]; servT=s[14]; recv=s[15];
        for(const n of m.e){ if(n==='p0'||n==='p1') env.sfx(+n[1]===myTeam?'item':'hurt'); else env.sfx(n); } if(m.m){ msg=m.m; msgT=1.4; } } else if(m.end) conclude(m.end[0],m.end[1],m.end[2]); };
    else { net.onmsg=(m,from)=>{ if(m.i&&rin[SL(from)]){ const r=rin[SL(from)]; r.dx=m.i[0]; r.dy=m.i[1]; r.jump=!!m.i[2]; if(m.i[3]) r.sw=true; if(m.i[4]) r.drop=true; } };
      net.onleave=i=>{ const j=SL(i); if(j<N&&!ended) ctrl[j]='ai'; }; } }
  function movePlayer(p,i,dt){ const sp=isAI(p.n)?AI.spd:255,cam=net?myTeam:0,fx2=cam?-1:1; let mx,mw;
    if(isAI(p.n)){ const d=Math.hypot(i.wx||0,i.ww||0); mx=d>4?(i.wx/d)*Math.min(1,d/28):0; mw=d>4?(i.ww/d)*Math.min(1,d/28):0; }
    else { mx=(i.dy||0)*fx2; mw=(i.dx||0)*fx2; const l=Math.hypot(mx,mw); if(l>1){ mx/=l; mw/=l; } p.aim=(i.dx||0)*fx2; }
    p.moving=Math.abs(mx)+Math.abs(mw)>.05; if(p.moving) p.run+=dt*11;
    if(phase==='serve'&&p.n===server){ /* 發球：站在自己那半邊的發球區內 */ const lo=p.team?NETX+SSL+10:BACK+6+SVB,hi=p.team?W-BACK-6-SVB:NETX-SSL-10; p.x=clamp(p.x+mx*sp*dt,lo,hi); p.w=svSign>0?clamp(p.w+mw*sp*dt,8,PW-6):clamp(p.w+mw*sp*dt,-PW+6,-8); }
    else { p.x+=mx*sp*dt; p.w=clamp(p.w+mw*sp*dt,-PW-50,PW+50); const lo=p.team?NETX+22:-60,hi=p.team?W+60:NETX-22; p.x=clamp(p.x,lo,hi); }
    if(i.jump&&p.y>=GY&&phase==='play'){ p.vy=-560; sfx('land'); } p.vy+=1500*dt; p.y+=p.vy*dt; if(p.y>=GY){ p.y=GY; p.vy=0; }
    const swT=dk=>phase==='serve'&&p.n===server?'serve':GY-sh.y>150||p.y<GY-10?'over':dk&&Math.abs(sh.x-NETX)<160?'net':((sh.w-p.w)*RW(p.team)>=0?'fh':'bh');
    if((i.sw||i.drop)&&p.sw<=0){ p.sw=SWD; p.hitOK=true; p.drop=!!i.drop; p.swType=swT(!!i.drop); } if(p.sw>0) p.sw-=dt; }
  let lastIn='';
  function update(dt){ t+=dt; if(introT>0) introT-=dt; if(shake>0) shake-=dt; if(msgT>0) msgT-=dt; for(const f of fx) f.t+=dt; for(let i=fx.length-1;i>=0;i--) if(fx[i].t>1) fx.splice(i,1);
    if(client){ const i=keyIn('solo'),key=''+i.dx+i.dy+(+i.jump); sendT-=dt; if(key!==lastIn||i.sw||i.drop||sendT<=0){ lastIn=key; sendT=1/20; net.send({i:[i.dx,i.dy,+i.jump,+i.sw,+i.drop]}); }
      const f=Math.min(1,dt*18); for(const p of ps){ p.x+=(p.tx-p.x)*f; p.w+=(p.tw-p.w)*f; if(p.moving) p.run+=dt*11; } if(Math.hypot(sh.tx-sh.x,sh.ty-sh.y)>90){ sh.x=sh.tx; sh.y=sh.ty; sh.w=sh.tw; } else { sh.x+=(sh.tx-sh.x)*f; sh.y+=(sh.ty-sh.y)*f; sh.w+=(sh.tw-sh.w)*f; } return; }
    if(ended) return; if(net){ sendT-=dt; if(sendT<=0){ sendT=1/20; net.send(snap()); } }
    if(phase==='over'){ overT+=dt; if(overT>1.5){ const a=score[0],b=score[1]; if(net){ net.send(snap()); net.send({end:[a,b,'']}); } conclude(a,b); } return; }
    for(const p of ps) movePlayer(p,inputOf(p.n,dt),dt);
    if(phase==='point'){ ptT-=dt; if(sh.y<GY){ stepSh(sh,dt); if(sh.y>GY) sh.y=GY; } if(ptT<=0) setServe(); return; }
    if(phase==='serve'){ const p=ps[sh.held]; sh.x=p.x+p.face*16; sh.y=GY-70; sh.w=p.w+RW(p.team)*12; sh.vx=p.face*10; sh.vy=10; sh.vw=0;
      if(p.sw>0&&p.hitOK&&introT<=0){ p.hitOK=false; p.swType='serve'; p.sw=SWD*.55; const dir=p.face,R=Math.random,ai=isAI(p.n),shortS=p.drop;
        const tx=shortS?NETX+dir*(SSL+20+R()*40):(dir>0?W-BACK-40-SVB:BACK+40+SVB)-dir*R()*(60-SVB*.6); let v=(shortS?aimShot(sh.x,sh.y,tx,[18,24,30,38],dir):null)||aimShot(sh.x,sh.y,tx,[58,64,70],dir)||{vx:dir*600,vy:-700,t:1.4};
        let tw=-svSign*(25+R()*(PW-50)); const gs=()=>((R()+R()+R())/1.5-1),e=(shortS?.3:.18)*(ai?(1.4-1.1*k):1)*(p.moving?1.4:1); v={vx:v.vx*(1+gs()*e*.28),vy:v.vy*(1+gs()*e*.3),t:v.t}; tw+=gs()*e*110;
        sh.vx=v.vx; sh.vy=v.vy; sh.vw=(tw-sh.w)/Math.max(.3,(v.t||1)*.9); sh.type=shortS?'net':'clear'; sh.weak=false; sh.net=0; lastHit=p.n; lastTeam=p.team; phase='play'; rally=0; sfx('place'); pop(shortS?'發短球':'發高遠球','#fff',sh.x,sh.w,110); fx.push({k:'ring',x:sh.x,w:sh.w,h:70,t:0,col:'#fff'}); }
      return; }
    const n=Math.max(1,Math.ceil(dt*240)); for(let s=0;s<n&&phase==='play';s++){ const px=sh.x; stepSh(sh,dt/n);
      if((px-NETX)*(sh.x-NETX)<=0&&sh.y>NETTOP&&Math.abs(sh.w)<DW+10){ sh.x=NETX-Math.sign(sh.vx||1)*5; sh.vx*=-.12; sh.vw*=.3; sh.vy=Math.max(0,sh.vy)*.3; sh.net=1; sfx('bump'); fx.push({k:'ring',x:NETX,w:sh.w,h:GY-sh.y,t:0,col:'#ff8a8a'}); }
      for(const p of ps){ if(p.sw>.04&&p.hitOK&&p.team!==lastTeam&&mySide(p)&&reachD(p,sh)<REACH*(p.rm||1)){ if(dbl&&rally===0&&p.n!==recv) continue; /* 發球只能由接發球的人接 */ p.hitOK=false; shoot(p,p.drop); break; } }
      if(sh.y>=GY){ sh.y=GY; const side=sh.x<NETX?0:1,serve=rally===0,inb=sh.x>=BACK-2&&sh.x<=W-BACK+2&&Math.abs(sh.w)<=PW+2,ht=lastTeam;
        if(side===ht) point(1-ht,(serve?'發球':'')+(sh.net?'掛網':'沒過網'));
        else if(!inb) point(1-ht,(serve?'發球':'')+(Math.abs(sh.w)>PW+2?'出邊線':'出底線'));
        else if(serve&&Math.abs(sh.x-NETX)<SSL) point(1-ht,'發球太短（沒過前發球線）');
        else if(serve&&dbl&&Math.abs(sh.x-NETX)>NETX-BACK-SVB+2) point(1-ht,'發球太長（超過雙打後發球線）');
        else if(serve&&sh.w*-svSign<-2) point(1-ht,'發球沒落在斜對角發球區');
        else point(ht,'界內！');
        fx.push({k:'dust',x:sh.x,w:sh.w,h:0,t:0}); break; } }
    if(sh.smash>0) sh.smash-=dt; }
  function draw(){ c.save(); if(shake>0) c.translate((Math.random()-.5)*7,(Math.random()-.5)*5); const ct=CT; c.drawImage(courtBg(ST.v),0,0);
    const items=[]; for(const p of ps){ const q=proj(p.x,p.w,0,ct),qa=proj(p.x,p.w,GY-p.y,ct); items.push({d:q[3],f:()=>{ const back=p.team===ct; if(p.y<GY-2){ c.fillStyle='rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(q[0],q[1],22*q[2]*SCP,6*q[2]*SCP,0,0,TAU); c.fill(); }
      drawHuman(c,qa[0],qa[1],q[2]*SCP,!back,p.look,{u:p.sw>0?1-p.sw/SWD:0,type:p.sw>0?p.swType:(phase==='serve'&&p.n===server?'serve':'ready'),run:p.run,mv:p.moving?1:0,crouch:phase==='play'?.6:.3,pad:{racket:1,face:p.look.rcol||(p.team?'#3ddbd9':'#ff7a3d')},label:lbl(p),air:p.y<GY-2},t); }}); }
    { const q=proj(NETX,0,0,ct); items.push({d:q[3]+.5,f:()=>drawNet(c,ct)}); }
    { const q=proj(sh.x,sh.w,0,ct); items.push({d:q[3]-6,f:()=>{ if(sh.smash>0){ const a=proj(sh.x,sh.w,GY-sh.y,ct),b=proj(sh.x-sh.vx*.05,sh.w-sh.vw*.05,GY-sh.y+sh.vy*.05,ct); c.strokeStyle='rgba(255,93,143,.5)'; c.lineWidth=5; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]); c.stroke(); } drawShuttle(c,sh,ct); }}); }
    items.sort((a,b)=>b.d-a.d).forEach(it=>it.f());
    for(const f of fx){ const a=1-f.t,q=proj(f.x,f.w||0,f.h||0,ct); if(f.k==='ring'){ c.strokeStyle=f.col; c.globalAlpha=a; c.lineWidth=3; c.beginPath(); c.arc(q[0],q[1],(6+f.t*30)*q[2]*.6,0,TAU); c.stroke(); c.globalAlpha=1; }
      else if(f.k==='dust'){ c.fillStyle='rgba(255,255,255,'+a*.7+')'; for(let i=0;i<6;i++){ const an=Math.PI+i*Math.PI/5; c.beginPath(); c.arc(q[0]+Math.cos(an)*f.t*30*q[2]*.6,q[1]+Math.sin(an)*f.t*10*q[2]*.6,2.5,0,TAU); c.fill(); } }
      else if(f.k==='txt'){ c.globalAlpha=a; c.font='900 21px '+TC; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='#14122b'; c.strokeText(f.txt,q[0],q[1]-f.t*30); c.fillStyle=f.col; c.fillText(f.txt,q[0],q[1]-f.t*30); c.globalAlpha=1; } }
    c.restore();
    const lt=ct,tName=tm=>dbl?ps.filter(p=>p.team===tm).map(p=>names[p.n]).join('＋'):names[tm]; c.fillStyle='rgba(11,10,28,.8)'; rr(c,W/2-240,6,480,54,14); c.fill(); c.textAlign='center'; c.textBaseline='middle';
    c.font='900 15px '+TC; c.fillStyle=ps[1-lt].look.color; c.fillText(tName(1-lt),W/2-160,22,150); c.fillStyle=ps[lt].look.color; c.fillText(tName(lt),W/2+160,22,150);
    c.font='900 28px '+TC; c.fillStyle='#fff'; c.fillText(score[1-lt]+'　:　'+score[lt],W/2,28); c.font='700 13px '+TC; c.fillStyle='#cfd2e8'; c.fillText((dbl?'雙打・':'')+'先拿 '+GOAL+' 分（要贏 2 分）',W/2,48);
    c.fillStyle='#ffd23f'; c.font='900 13px '+TC; c.fillText('🏸 發球',servT===lt?W/2+160:W/2-160,44);
    const a=score[0],b=score[1]; if(phase!=='over'&&Math.max(a,b)>=GOAL-1&&Math.abs(a-b)>=1){ c.font='900 18px '+TC; c.lineWidth=4; c.strokeStyle='#14122b'; c.strokeText('賽末點！',W/2,78); c.fillStyle='#ff5d8f'; c.fillText('賽末點！',W/2,78); }
    if(phase==='serve'&&server>=0){ c.fillStyle='rgba(11,10,28,.7)'; rr(c,W/2-210,92,420,28,14); c.fill(); c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText('報分 '+score[servT]+'－'+score[1-servT]+'，'+names[server]+'從'+(score[servT]%2?'左':'右')+'半場發球給 '+names[recv]+'（打斜對角）',W/2,106,410); }
    const meServe=two?human(sh.held):sh.held===me;
    if(phase==='serve'&&introT<=0&&meServe){ const tch=document.body.classList.contains('touch'); c.fillStyle='rgba(11,10,28,.7)'; rr(c,W/2-210,126,420,30,15); c.fill(); c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText(tch?'「揮拍」發高遠球、「吊球」發短球':'空白鍵發高遠球、X 發短球（方向鍵可以移動站位）',W/2,141,410); }
    if(rally>=4&&phase==='play'){ c.font='900 15px '+TC; c.fillStyle='#ffd23f'; c.fillText('來回 '+rally+' 拍',W/2,78); }
    if(msgT>0&&phase!=='serve'){ c.font='900 26px '+TC; c.lineWidth=6; c.strokeStyle='#14122b'; c.strokeText(msg,W/2,190,780); c.fillStyle='#ffd23f'; c.fillText(msg,W/2,190,780); }
    if(introT>0&&solo){ c.font='900 26px '+TC; c.lineWidth=6; c.strokeStyle='#14122b'; const s2='第 '+(si+1)+' 關　對手：'+ST.foe+(dbl?'隊':''); c.strokeText(s2,W/2,190); c.fillStyle='#ffd23f'; c.fillText(s2,W/2,190); } }
  const lbl=p=>introT>0||(dbl&&phase==='serve'&&(p.n===server||p.n===recv))?(two?(ctrl[p.n]==='key0'?'1P':ctrl[p.n]==='key1'?'2P':''):(p.n===me?'你':dbl&&p.team===myTeam?'隊友':'')):'';
  return {update,draw,destroy(){},_dbg:{ps,sh,score,ctrl,dbl,get msg(){ return msg; },get phase(){ return phase; },get rally(){ return rally; },get lastHit(){ return lastHit; },get lastTeam(){ return lastTeam; },get server(){ return server; },get servT(){ return servT; },get recv(){ return recv; },AI,predict}};
}

function demo(c,v,t,col0,col1,foe){ c.drawImage(courtBg(v),0,0); const T=2.6,u=(t%T)/T,dir=u<.5?1:-1,kk=u<.5?u*2:(u-.5)*2,x0=dir>0?150:640,x1=dir>0?640:150,bx=x0+(x1-x0)*kk,bw=(dir>0?-40:40)*(1-2*kk),bh=110+Math.sin(kk*Math.PI)*200;
  const far=proj(650,30,0,0),nr=proj(140,-30,0,0),fu=dir>0?clamp((kk-.7)/.5,0,1):0,nu=dir<0?clamp((kk-.7)/.5,0,1):(u<.12?.45+u*4:0);
  drawHuman(c,far[0],far[1],far[2]*SCP,true,{color:col1,hair:1},{u:fu,type:fu?'over':'ready',pad:{racket:1,face:'#3ddbd9'},label:foe||''},t); drawNet(c,0); drawShuttle(c,{x:bx,w:bw,y:GY-bh,vx:dir*300,vy:Math.cos(kk*Math.PI)*-300,vw:0},0); drawHuman(c,nr[0],nr[1],nr[2]*SCP,false,{color:col0,hair:0},{u:nu,type:nu?'over':'ready',pad:{racket:1,face:'#ff7a3d'}},t); }
function stageShow(c,w,h,si,t){ const S=STAGES[si]; c.save(); c.scale(w/W,h/H); demo(c,S.v,t,'#ff5d6d',S.col,S.foe); c.fillStyle='rgba(11,10,28,.72)'; rr(c,W/2-190,8,380,40,14); c.fill(); c.fillStyle='#ffd23f'; c.font='900 21px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(S.name+'　對手 '+S.foe,W/2,28,360); c.restore(); }
function preview(c,w,h,L,t){ L=Object.assign({color:'#ff5d6d',hair:0},L||{}); c.save(); c.scale(w/W,h/H); c.drawImage(courtBg(0),0,0); drawHuman(c,W/2,H-12,2.2,true,L,{u:(t%2.2)<1.2?(t%2.2)/1.2:0,type:(t%2.2)<1.2?'over':'ready',pad:{racket:1,face:L.rcol||'#ff7a3d'}},t); c.restore(); }
function thumb(c,w,h,t){ c.save(); c.scale(w/W,h/H); demo(c,6,t,'#ff5d6d','#4f9dff',''); c.font='900 54px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=10; c.strokeStyle='#14122b'; c.strokeText('羽球對決',W/2,110); c.fillStyle='#ffd23f'; c.fillText('羽球對決',W/2,110); c.restore(); }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).badminton={
  name:'羽球對決',tag:'SHUTTLE DUEL',color:'#5fd068',online:true,maxPlayers:4,
  coin:o=>{ const O=o.options||{},pr=o.mode==='2p'&&!o.net||(o.net&&o.net.count===2),d=o.net&&o.net.count>2||(pr?['vs','coop'].includes(O.team):O.fmt==='doubles'); return {verb:'先發球',names:d?['左隊','右隊']:o.net?[o.net.names[0]||'玩家 1',o.net.count>1?(o.net.names[1]||'玩家 2'):'電腦']:o.mode==='2p'?['1P','2P']:['你','電腦']}; },
  desc:'從球員背後看的羽球單打或雙打！前後左右跑位，揮拍自動判斷高遠球、平抽、挑球，跳起來揮就是殺球，也能輕輕吊網前。發球照分數站左右半場打斜對角。單人 200 關（1 對 1 或 2 對 2），也能兩人同一台或連線對打（最多 4 人）。',
  goal:'羽毛球落在對方界內就得 1 分；打出界、掛網、發球太短或沒發到斜對角都算失分。每球得分，先拿到開始前選的分數、而且領先 2 分就贏（最多到 30 分）。雙打：發球方得分時同一人和搭檔換邊續發；接發球方得分就換他們發球、站位不換，由分數偶數站右、奇數站左的那位發。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  options:[{key:'fmt',label:'賽制（單人）',def:'singles',opts:[{id:'singles',label:'單打 1 對 1'},{id:'doubles',label:'雙打：配電腦隊友 2 對 2'}]},{key:'win',label:'打幾分',def:'11',opts:[{id:'11',label:'11 分'},{id:'15',label:'15 分'},{id:'21',label:'21 分（正式）'}]},
    {key:'team',label:'兩個玩家時（雙人／連線 2 人）',def:'1v1',opts:[{id:'1v1',label:'兩人 1 對 1'},{id:'vs',label:'各配電腦隊友 2 對 2'},{id:'coop',label:'兩人同隊打 2 個電腦'}]}],
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  stageGoal:i=>{ const S=STAGES[i]; return '第 '+(i+1)+' 關・'+S.name+'：打贏 '+S.foe+'。'+(i<10?'對手動作慢、常常打出界，先熟悉跑位和揮拍。':i<60?'對手開始會吊網前，記得往前跑。':i<130?'對手會跳殺，退後一點等球。':'高手對決：殺球又快又準。'); },
  stageLocked:i=>i>0&&getRec(i-1)==null,stageBest:i=>{ const v=getRec(i); return v?'✓ '+v.replace(':',' : '):''; },
  hubBest:()=>{ let n=0; for(let i=0;i<LV;i++) if(getRec(i)!=null) n++; return n?'過關 <b>'+n+' / '+LV+'</b>':'尚無紀錄'; },
  help:[['↑ ↓ ← →','前後左右跑位'],['C','跳起來（在空中揮拍＝殺球）'],['空白鍵','揮拍：自動打高遠球、平抽或挑球；發球＝發高遠球'],['X','吊球：輕輕吊過網；發球＝發短球']],
  touchHelp:[['方向盤','前後左右跑位'],['跳','跳起來，空中揮拍＝殺球'],['揮拍','自動判斷怎麼打；發高遠球'],['吊球','輕輕吊過網；發短球']],
  touch:{left:'dpad',right:[{l:'跳',c:'KeyC'},{l:'吊球',c:'KeyX'},{l:'揮拍',c:'Space',act:true}]},
  looks:[{key:'color',label:'球衣顏色',type:'color',opts:['#ff5d6d','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#b98cff','#ff7eb6']},{key:'rcol',label:'球拍顏色',type:'color',opts:['#ff7a3d','#ff5d6d','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#2a2a30']},{key:'hair',label:'髮型',opts:[{id:'0',label:'短髮'},{id:'1',label:'馬尾'},{id:'2',label:'捲毛'}]}],
  best:{label:'過關',fmt:v=>v+' 關',lower:false},
  stageShow,preview,thumb,create,_sim:{stepSh,simLand,aimShot,STAGES,proj,drawHuman,NETX,GY,CW,SSL}};
})();
