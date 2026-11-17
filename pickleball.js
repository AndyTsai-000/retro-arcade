// 匹克球對決：側面單打，照中華民國匹克球總會整理的規則（https://www.ctpf.org.tw/blog/pickleball-rules/）：
//  發球站底線後、球要越過廚房區落進對面發球區（落在廚房區或廚房線＝失誤，每次只有一次機會，擦網落點對就繼續）；
//  雙彈地：接發球、發球方的第三拍都要等球彈地；廚房區（網前 7 呎，含線）裡不能截擊，截擊後衝進廚房區也算違例；
//  碰線算界內；傳統計分只有發球方得分（也可選每球得分），先拿 11 分且領先 2 分贏；單打發球者分數偶數從右邊、奇數從左邊發球。
// 操作：左右移動、揮拍（自動判斷抽球／扣殺），「小球」輕輕吊進對方廚房區（dink）。需要等彈地的球，揮拍會自動等，不會讓你白白犯規。
(function(){
'use strict';
const W=800,H=450,GY=400,NETX=400,NETTOP=344,BACK=60,KIT=108,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,LV=200;
const G=900,K=.0009,REST=.62,REACH=40;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,r1=v=>Math.round(v*10)/10,lerp=(a,b,u)=>a+(b-a)*u;
const LS=(k,v)=>{ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } };
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function shade(hex,k){ const n=parseInt(hex.slice(1),16),f=v=>clamp(Math.round(k>1?v+(255-v)*(k-1):v*k),0,255); return 'rgb('+f(n>>16&255)+','+f(n>>8&255)+','+f(n&255)+')'; }
const inKitchen=x=>Math.abs(x-NETX)<=KIT+2; // 廚房區含線
// 拍子打得到的範圍：膝蓋到頭頂這一段
const reachD=(p,bx,by)=>{ const rx=p.x+p.face*22,my=p.y-62; return Math.hypot(bx-rx,Math.max(0,Math.abs(by-my)-48)); };

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

/* ---------- 球：重力＋一點空氣阻力，落地會彈 ---------- */
function stepB(b,dt){ const sp=Math.hypot(b.vx,b.vy); b.vx-=K*sp*b.vx*dt; b.vy+=(G+(b.spin==='top'?420:0)-K*sp*b.vy)*dt; b.x+=b.vx*dt; b.y+=b.vy*dt; }
// 落地反彈：一般球、上旋（落地往前竄、彈得低一點）、側旋（彈得很低、往旁邊偏，速度被吃掉）
function bounce(b){ if(b.spin==='top'){ b.vy=-Math.abs(b.vy)*.5; b.vx*=1.08; } else if(b.spin==='slice'){ b.vy=-Math.abs(b.vy)*.34; b.vx*=.7; b.curl=1; } else { b.vy=-Math.abs(b.vy)*REST; b.vx*=.82; } b.spin=''; }
function simLand(x,y,vx,vy,spin){ const s={x,y,vx,vy,spin}; let netY=null; for(let i=0;i<600;i++){ const px=s.x; stepB(s,1/90); if(netY==null&&(px-NETX)*(s.x-NETX)<=0) netY=s.y; if(s.y>=GY) break; } return {x:s.x,netY}; }
function aimShot(x,y,tx,angs,dir,clr,spin){ for(const a of angs){ const ca=Math.cos(a*Math.PI/180)*dir,sa=-Math.sin(a*Math.PI/180); let lo=60,hi=1500,best=null;
    for(let it=0;it<18;it++){ const v=(lo+hi)/2,L=simLand(x,y,ca*v,sa*v,spin); if((L.x-tx)*dir<0) lo=v; else hi=v; best={v,L}; }
    if(best&&best.L.netY!=null&&best.L.netY<NETTOP-(clr||8)&&Math.abs(best.L.x-tx)<26) return {vx:ca*best.v,vy:sa*best.v}; } return null; }
function aimFixed(x,y,tx,v,dir,a0,a1,minD,spin){ let best=null,bd=1e9; for(let a=a0;a<=a1;a+=1.2){ const ca=Math.cos(a*Math.PI/180)*dir,sa=-Math.sin(a*Math.PI/180),L=simLand(x,y,ca*v,sa*v,spin);
    if(L.netY==null||L.netY>=NETTOP-6||L.x<BACK+6||L.x>W-BACK-6||(L.x-NETX)*dir<(minD||KIT+10)) continue; const d=Math.abs(L.x-tx); if(d<bd){ bd=d; best={vx:ca*v,vy:sa*v}; } } return best&&bd<110?best:null; }

/* ---------- Q 版選手（拿匹克球拍） ---------- */
function drawPlayer(c,x,y,face,col,sw,t,moving,hair,label,paddle){
  const INK='#2a1a26',skin='#ffe0c8',bob=moving?Math.abs(Math.sin(t*14))*3:0,yy=y-bob,blink=(t*.7+x*.01)%3<.12;
  c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x,GY+3,26,6,0,0,TAU); c.fill(); c.lineWidth=2.5; c.strokeStyle=INK;
  const st=moving?Math.sin(t*14)*6:0;
  for(const [dx,o] of [[-9,st],[9,-st]]){ c.fillStyle=skin; c.fillRect(x+dx-4,yy-22,8,16); c.strokeRect(x+dx-4,yy-22,8,16); c.fillStyle='#fff'; c.beginPath(); c.ellipse(x+dx+o*.3+face*3,yy-5,9,6,0,0,TAU); c.fill(); c.stroke(); c.fillStyle=col; c.fillRect(x+dx+o*.3+face*3-6,yy-7,12,2.5); }
  c.fillStyle='#2a2a3a'; rr(c,x-15,yy-34,30,14,4); c.fill(); c.stroke();
  c.fillStyle=col; rr(c,x-17,yy-60,34,30,10); c.fill(); c.stroke(); c.fillStyle='rgba(255,255,255,.35)'; c.fillRect(x-11,yy-55,6,20);
  c.fillStyle=skin; c.beginPath(); c.arc(x-face*18,yy-40,6,0,TAU); c.fill(); c.stroke();
  // 拿拍的手：從後下方往前揮（低手）
  const u=sw>0?1-sw/.26:0,ang=sw>0?lerp(2.4,-.2,Math.min(1,u*1.3)):1.25+Math.sin(t*2)*.05;
  const sx=x+face*14,sy=yy-50,ax=Math.cos(ang),ay=Math.sin(ang),hx=sx+face*ax*20,hy=sy+ay*20;
  c.strokeStyle=INK; c.lineWidth=7; c.beginPath(); c.moveTo(sx,sy); c.lineTo(hx,hy); c.stroke(); c.strokeStyle=col; c.lineWidth=4.5; c.beginPath(); c.moveTo(sx,sy); c.lineTo(hx,hy); c.stroke();
  const PD=typeof paddle==='object'&&paddle?paddle:{face:paddle||'#ff7a3d'},sh=PD.pad==='long'?[30,18,7]:PD.pad==='wide'?[22,26,10]:[24,22,8];
  c.save(); c.translate(hx+face*ax*16,hy+ay*16); c.rotate(Math.atan2(ay,face*ax)); c.fillStyle=PD.grip||'#333'; c.fillRect(-15,-3.2,12,6.4); c.strokeStyle='rgba(0,0,0,.35)'; c.lineWidth=1; for(let gx=-14;gx<-4;gx+=3){ c.beginPath(); c.moveTo(gx,-3); c.lineTo(gx+2,3); c.stroke(); }
  c.fillStyle=PD.face||'#ff7a3d'; c.strokeStyle=INK; c.lineWidth=2; rr(c,-4,-sh[1]/2,sh[0],sh[1],sh[2]); c.fill(); c.stroke(); c.strokeStyle='rgba(255,255,255,.5)'; c.lineWidth=1.5; rr(c,-2,-sh[1]/2+2,sh[0]-4,sh[1]-4,sh[2]-2); c.stroke(); c.fillStyle='rgba(255,255,255,.3)'; rr(c,0,-sh[1]/2+4,7,sh[1]-8,3); c.fill(); c.restore();
  c.fillStyle=skin; c.strokeStyle=INK; c.lineWidth=2.5; c.beginPath(); c.arc(hx,hy,6,0,TAU); c.fill(); c.stroke();
  if(sw>.1){ c.strokeStyle='rgba(255,255,255,.55)'; c.lineWidth=5; c.beginPath(); c.arc(sx,sy,40,face>0?-.4:Math.PI-1.6,face>0?1.6:Math.PI+.4); c.stroke(); }
  const hy0=yy-86; c.fillStyle=skin; c.beginPath(); c.arc(x,hy0,28,0,TAU); c.fill(); c.stroke();
  const hc=['#3a2416','#1a1410','#8a4a2a'][hair%3]; c.fillStyle=hc; c.beginPath(); c.arc(x,hy0-4,29,Math.PI*1.05,Math.PI*1.95); c.quadraticCurveTo(x+face*10,hy0-14,x-face*28,hy0-6); c.closePath(); c.fill(); c.stroke();
  if(hair%3===1){ c.beginPath(); c.ellipse(x-face*30,hy0-6,8,14,face*.5,0,TAU); c.fill(); c.stroke(); }
  c.fillStyle=col; c.beginPath(); c.ellipse(x+face*6,hy0-22,26,6,0,0,TAU); c.fill(); c.stroke(); c.beginPath(); c.arc(x,hy0-20,24,Math.PI,0); c.fill(); c.stroke(); // 遮陽帽
  if(blink){ c.strokeStyle=INK; c.lineWidth=2.5; for(const ex of [-9,9]){ c.beginPath(); c.moveTo(x+face*4+ex-5,hy0+2); c.lineTo(x+face*4+ex+5,hy0+2); c.stroke(); } }
  else for(const ex of [-9,9]){ c.fillStyle=INK; c.beginPath(); c.ellipse(x+face*4+ex,hy0+2,4.5,6,0,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(x+face*4+ex-1.5,hy0-.5,1.8,0,TAU); c.arc(x+face*4+ex+1.5,hy0+4,1,0,TAU); c.fill(); }
  c.fillStyle='rgba(255,110,140,.45)'; c.beginPath(); c.ellipse(x+face*4-17,hy0+11,5,3,0,0,TAU); c.ellipse(x+face*4+17,hy0+11,5,3,0,0,TAU); c.fill();
  c.strokeStyle=INK; c.lineWidth=2; c.beginPath(); c.arc(x+face*4-3,hy0+12,3,0,Math.PI); c.arc(x+face*4+3,hy0+12,3,0,Math.PI); c.stroke();
  if(label){ c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=4; c.strokeStyle='#14122b'; c.strokeText(label,x,hy0-48); c.fillStyle='#ffd23f'; c.fillText(label,x,hy0-48); } }
function drawBall(c,b){ c.fillStyle='rgba(0,0,0,.18)'; const sz=clamp((GY-b.y)/300,0,1); c.beginPath(); c.ellipse(b.x,GY+2,5+sz*6,2.5,0,0,TAU); c.fill();
  c.fillStyle='#e8f040'; c.strokeStyle='#8a8a20'; c.lineWidth=1.2; c.beginPath(); c.arc(b.x,b.y,7,0,TAU); c.fill(); c.stroke(); c.fillStyle='rgba(120,120,30,.6)'; for(const [a,r] of [[0,3.5],[2.1,3.5],[4.2,3.5],[1,0]]){ c.beginPath(); c.arc(b.x+Math.cos(a+b.x*.05)*r,b.y+Math.sin(a+b.x*.05)*r,1.3,0,TAU); c.fill(); } }

/* ---------- 背景 ---------- */
const BGC={};
function courtBg(v){ if(BGC[v]) return BGC[v]; const e=document.createElement('canvas'); e.width=W; e.height=H; const c=e.getContext('2d'),V=VENUES[v];
  let g=c.createLinearGradient(0,0,0,300); g.addColorStop(0,V.sky[0]); g.addColorStop(1,V.sky[1]); c.fillStyle=g; c.fillRect(0,0,W,310);
  if(V.bg==='night'||V.bg==='arena'){ c.fillStyle='#fff'; for(let i=0;i<50;i++){ c.globalAlpha=.3+(i*37%10)/14; c.fillRect((i*97)%W,(i*53)%140,1.5,1.5); } c.globalAlpha=1;
    for(const lx of [80,720]){ c.fillStyle='#555'; c.fillRect(lx-3,40,6,260); c.fillStyle='#fffbe0'; rr(c,lx-24,30,48,16,4); c.fill(); const lg=c.createRadialGradient(lx,40,4,lx,40,160); lg.addColorStop(0,'rgba(255,250,220,.45)'); lg.addColorStop(1,'rgba(255,250,220,0)'); c.fillStyle=lg; c.fillRect(lx-160,0,320,220); } }
  else if(!V.in){ c.fillStyle='rgba(255,255,255,.85)'; for(const [x,y,s] of [[150,60,1],[480,40,1.3],[700,80,.8]]){ c.beginPath(); c.arc(x,y,18*s,0,TAU); c.arc(x+20*s,y+5,14*s,0,TAU); c.arc(x-18*s,y+6,12*s,0,TAU); c.fill(); } }
  if(V.bg==='sea'){ c.fillStyle='#2f8ad0'; c.fillRect(0,220,W,60); for(const px of [60,740]){ c.strokeStyle='#7a5a3a'; c.lineWidth=8; c.beginPath(); c.moveTo(px,300); c.quadraticCurveTo(px+10,230,px,170); c.stroke(); c.fillStyle='#3a9a4a'; for(let a=0;a<6;a++){ c.save(); c.translate(px,170); c.rotate(a*1.05); c.beginPath(); c.ellipse(26,0,28,7,.3,0,TAU); c.fill(); c.restore(); } } }
  else if(V.bg==='city'){ for(let i=0;i<9;i++){ const x=i*92,h=80+(i*53)%120; c.fillStyle=i%2?'#6a6a7a':'#7a7a8a'; c.fillRect(x,290-h,84,h); c.fillStyle='rgba(255,230,160,.6)'; for(let r=0;r<h/24;r++) for(let q=0;q<4;q++) if((r+q+i)%3) c.fillRect(x+8+q*19,300-h+r*24,10,12); } }
  else if(V.bg==='river'){ c.fillStyle='#7ab0d8'; c.fillRect(0,250,W,40); c.fillStyle='#8a9aa8'; for(let x=0;x<W;x+=60) c.fillRect(x,236,40,8); }
  else if(V.bg==='school'){ c.fillStyle='#e8dcc8'; c.fillRect(120,150,560,140); c.fillStyle='#c8402a'; c.fillRect(110,140,580,14); c.fillStyle='#8ab8d8'; for(let i=0;i<8;i++) c.fillRect(140+i*68,175,44,34); c.fillStyle='#fff'; c.font='900 20px '+TC; c.textAlign='center'; c.fillText('快樂國小',400,264); }
  else if(V.bg==='arena'){ c.fillStyle='#24203a'; c.fillRect(0,170,W,130); for(let i=0;i<70;i++){ c.fillStyle=['#ff6b6b','#4f9dff','#ffd23f','#5fd068','#b98cff'][i%5]; c.beginPath(); c.arc((i*61)%W+6,184+(i%4)*28,7,0,TAU); c.fill(); } }
  if(V.bg==='trees'||V.bg==='park'||V.bg==='night'){ c.fillStyle=V.bg==='night'?'#1a2a2a':'#5a9a4a'; c.beginPath(); c.moveTo(0,300); for(let x=0;x<=W;x+=40) c.lineTo(x,250+Math.sin(x*.02+v)*16); c.lineTo(W,310); c.fill(); for(const tx of [50,170,630,750]){ c.fillStyle='#6a4a2a'; c.fillRect(tx-6,210,12,80); c.fillStyle=V.bg==='night'?'#24402a':'#3f8a3a'; c.beginPath(); c.arc(tx,200,34,0,TAU); c.fill(); } }
  if(V.in){ c.fillStyle='rgba(255,255,255,.1)'; for(let y=20;y<300;y+=24) c.fillRect(0,y,W,2); for(let i=0;i<5;i++){ const x=80+i*160; c.fillStyle='#ccc'; c.fillRect(x-30,6,60,8); const lg=c.createRadialGradient(x,14,2,x,14,90); lg.addColorStop(0,'rgba(255,255,230,.5)'); lg.addColorStop(1,'rgba(255,255,230,0)'); c.fillStyle=lg; c.fillRect(x-90,0,180,110); }
    c.fillStyle=V.bg==='gym'?'#2f6fd0':'#e0602a'; rr(c,20,150,180,34,8); c.fill(); c.fillStyle='#fff'; c.font='900 18px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(V.n,110,168); c.fillStyle='#7a6a5a'; c.fillRect(0,200,W,100); for(let r=0;r<3;r++){ c.fillStyle=r%2?'rgba(0,0,0,.15)':'rgba(255,255,255,.06)'; c.fillRect(0,204+r*30,W,28); } for(let i=0;i<40;i++){ c.fillStyle=['#ff6b6b','#4f9dff','#ffd23f','#5fd068','#b98cff'][i%5]; c.beginPath(); c.arc((i*97)%W+8,218+(i%3)*30,7,0,TAU); c.fill(); } }
  // 圍網（戶外才有）
  if(!V.in){ c.strokeStyle='rgba(60,60,70,.35)'; c.lineWidth=1; for(let x=0;x<W;x+=14){ c.beginPath(); c.moveTo(x,190); c.lineTo(x+40,300); c.moveTo(x+40,190); c.lineTo(x,300); c.stroke(); } c.fillStyle='#555'; c.fillRect(0,186,W,4); }
  // 地面＋有透視的球場：遠邊 318、近邊在畫面底；廚房區顏色不同
  c.fillStyle=V.out; c.fillRect(0,300,W,H-300);
  const top=318,bot=H+4,xl=y=>lerp(BACK+44,BACK-8,(y-top)/(bot-top)),xr=y=>W-xl(y),kx=(s,y)=>NETX+s*lerp(KIT*.9,KIT*1.08,(y-top)/(bot-top));
  c.fillStyle=V.court; c.beginPath(); c.moveTo(xl(top),top); c.lineTo(xr(top),top); c.lineTo(xr(bot),bot); c.lineTo(xl(bot),bot); c.closePath(); c.fill();
  c.fillStyle=V.kit; c.beginPath(); c.moveTo(kx(-1,top),top); c.lineTo(kx(1,top),top); c.lineTo(kx(1,bot),bot); c.lineTo(kx(-1,bot),bot); c.closePath(); c.fill();
  c.strokeStyle='#fff'; c.lineWidth=3; c.beginPath(); c.moveTo(xl(top),top); c.lineTo(xr(top),top); c.lineTo(xr(bot),bot); c.moveTo(xl(top),top); c.lineTo(xl(bot),bot); for(const s of [-1,1]){ c.moveTo(kx(s,top),top); c.lineTo(kx(s,bot),bot); } c.stroke();
  c.lineWidth=2; c.beginPath(); const my=(top+bot)/2; c.moveTo(xl(my),my); c.lineTo(kx(-1,my),my); c.moveTo(kx(1,my),my); c.lineTo(xr(my),my); c.stroke(); // 中線（分左右發球區）
  c.fillStyle='rgba(255,255,255,.55)'; c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('廚房區',NETX-KIT/2,top+14); c.fillText('廚房區',NETX+KIT/2,top+14);
  return BGC[v]=e; }
function drawNet(c){ c.fillStyle='#2a2a30'; c.fillRect(NETX-3,NETTOP-8,6,GY-NETTOP+8); c.fillStyle='rgba(20,20,26,.55)'; c.fillRect(NETX-2,NETTOP,4,GY-NETTOP-8); c.strokeStyle='rgba(255,255,255,.3)'; c.lineWidth=1; for(let y=NETTOP+5;y<GY-8;y+=6){ c.beginPath(); c.moveTo(NETX-3,y); c.lineTo(NETX+3,y); c.stroke(); } c.fillStyle='#fff'; c.fillRect(NETX-4,NETTOP-3,8,6); }

/* ---------- 遊戲 ----------
   選手 i：隊伍 i%2（0 在左、1 在右）。單打 2 人、雙打 4 人（i<2 在前排 z=0、i>=2 在後排 z=1）。
   側面看不到左右，雙打用「前排／後排」兩條跑道代表左右半場：球飛向哪一排，就由那一排的人接。 */
const ZOFF=34;
function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,two=!net&&opts.mode==='2p',solo=!net&&!two,OPT=opts.options||{};
  const dbl=net?(net.count>2||OPT.fmt==='doubles'):OPT.fmt==='doubles',N=dbl?4:2,me=net?Math.min(N-1,net.me):0;
  const {ctx:c}=env.canvas2d(W,H),si=clamp(opts.stage|0,0,LV-1),ST=STAGES[si],VEN=solo?ST.v:clamp(+OPT.court||0,0,VENUES.length-1),RALLY=OPT.score==='rally',GOAL=RALLY?15:11;
  const SERVES=[['deep','高遠深球'],['drive','快速平擊'],['top','上旋發球'],['slice','側旋發球']];
  const vsAI=solo||(net&&net.count<2)||(two&&dbl),k=vsAI?ST.k:1,AI={spd:130+110*k,react:.36-.22*k,err:150-125*k,miss:.14*(1-k)};
  // 誰控制哪個選手：key0／key1（同一台）、solo（單人鍵盤）、self（連線時自己）、net（連線的其他人）、ai
  const ctrl=[]; for(let i=0;i<N;i++){ let cc='ai';
    if(net){ if(i<net.count) cc=i===me?'self':'net'; }
    else if(two){ if(!dbl) cc=i===0?'key0':'key1'; else if(OPT.team==='coop') cc=i===0?'key0':i===2?'key1':'ai'; else cc=i===0?'key0':i===1?'key1':'ai'; }
    else cc=i===0?'solo':'ai'; ctrl.push(cc); }
  const isAI=i=>ctrl[i]==='ai',human=i=>!isAI(i);
  const ALTC=['#ff5d6d',solo&&!dbl?ST.col:'#4f9dff','#ff7eb6','#3ddbd9']; /* 雙打：左隊紅粉、右隊藍綠 */
  const ps=Array.from({length:N},(_,i)=>{ const tm=i%2,lk=(net?net.looks&&net.looks[i]:null)||(i===0?opts.look:null)||{color:ALTC[i],hair:i%3};
    return {n:i,team:tm,z:dbl?(i<2?0:1):0,x:tm?700:100,y:GY,face:tm?-1:1,sw:0,hitOK:false,dk:false,moving:false,volT:0,tx:tm?700:100,look:lk,sv:Math.max(0,SERVES.findIndex(q=>q[0]===OPT.serve))}; });
  for(let i=1;i<N;i++) if(ps[i].team!==ps[0].team&&ps[i].look.color===ps[0].look.color) ps[i].look=Object.assign({},ps[i].look,{color:'#4f9dff'});
  const nm=i=>net?(i<net.count?(net.names[i]||'玩家 '+(i+1)):'電腦'+(i+1)):ctrl[i]==='key0'?'1P':ctrl[i]==='key1'?'2P':ctrl[i]==='solo'?(opts.name||'你'):(dbl&&ps[i].team===0?'電腦隊友':ST.foe+(dbl?(i<2?'A':'B'):''));
  const names=ps.map((p,i)=>nm(i)),myTeam=ps[me].team,TN=tm=>dbl?(!two&&tm===myTeam?'我方':tm?'右隊':'左隊'):names[tm];
  const ball={x:0,y:0,vx:0,vy:0,bn:0,z:0,tz:0,tx:0,ty:0,spin:''},fx=[],score=[0,0];
  let t=0,phase='serve',servT=opts.first===1?1:0,server=-1,sNum=2,hits=0,lastHit=-1,lastTeam=-1,ptT=0,lastW=-1,msg='',msgT=0,ended=false,overT=0,introT=2.4,aiServeT=1.2,rally=0,best=0,ev=[],sendT=0,shake=0,waitTip=0;
  const aiS={},rin={}; for(let i=0;i<N;i++){ aiS[i]={pred:null,t:0,dec:{n:-1},react:0}; rin[i]={dx:0,sw:false,dk:false,up:false,dn:false}; }
  const sfx=n=>{ env.sfx(n); if(net&&net.host) ev.push(n); };
  const pop=(txt,col,x,y)=>fx.push({k:'txt',txt,col,x,y,t:0});
  const right=tm=>ps.find(p=>p.team===tm&&p.z===0)||ps[tm]; // 站右邊發球區的人（單打只有一人）
  function setServe(){ phase='serve'; hits=0; lastHit=-1; lastTeam=-1; rally=0; ball.bn=0; aiServeT=1.1;
    if(server<0) server=right(servT).n; const S=ps[server];
    for(const p of ps){ p.y=GY; p.sw=0; p.volT=0; const recv=right(1-servT); p.x=p.team===servT?(p===S?(p.team?W-BACK+22:BACK-22):(p.team?W-BACK-70:BACK+70)):(p===recv||!dbl?(p.team?W-BACK-10:BACK+10):NETX+(p.team?1:-1)*(KIT+30)); }
    for(const i in aiS) aiS[i].pred=null; }
  setServe();
  function keyIn(which){ const kk=env.keys;
    if(which==='key0') return {dx:(kk.KeyD?1:0)-(kk.KeyA?1:0),sw:env.hit('KeyF')||env.hit('Space'),dk:env.hit('KeyG'),up:env.hit('KeyW'),dn:env.hit('KeyS')};
    if(which==='key1') return {dx:(kk.ArrowRight?1:0)-(kk.ArrowLeft?1:0),sw:env.hit('Enter')||env.hit('NumpadEnter'),dk:env.hit('ShiftRight')||env.hit('Slash'),up:env.hit('ArrowUp'),dn:env.hit('ArrowDown')};
    return {dx:(kk.ArrowRight||kk.KeyD?1:0)-(kk.ArrowLeft||kk.KeyA?1:0),sw:env.hit('Space')||env.hit('KeyJ')||env.hit('Enter'),dk:env.hit('KeyX')||env.hit('KeyK'),up:env.hit('ArrowUp')||env.hit('KeyW'),dn:env.hit('ArrowDown')||env.hit('KeyS')}; }
  const mustBounce=()=>hits<3;
  const laneOK=p=>!dbl||p.z===ball.tz;
  const mySide=p=>p.team?ball.x>NETX+4:ball.x<NETX-4;
  // 電腦：照球的路線（含彈地）找最早跑得到、合法、拍子打得到的點；不是自己這一排的球就守位置
  function predict(p){ const b={x:ball.x,y:ball.y,vx:ball.vx,vy:ball.vy,spin:ball.spin},sp=AI.spd,dir=p.face; let bn=ball.bn,last=null;
    for(let i=1;i<480;i++){ stepB(b,1/90); if(b.y>=GY){ if(bn>=1) break; bn=1; b.y=GY; b.spin=''; b.vy=-Math.abs(b.vy)*REST; b.vx*=.82; }
      if(p.team?b.x<=NETX+8:b.x>=NETX-8) continue; const standX=b.x-dir*22,vol=bn===0; if(vol&&(mustBounce()||inKitchen(standX))) continue; if(b.y<GY-118||b.y>GY-6) continue; last={x:b.x,y:b.y,vol};
      const need=Math.max(0,Math.abs(standX-p.x)-REACH*.5)/sp+AI.react; if(need<=i/90) return last; } return last; }
  function aiInput(p,dt){ const o={dx:0,sw:false,dk:false},A=aiS[p.n],dir=p.face;
    if(phase==='serve'){ if(server===p.n&&introT<=0&&(aiServeT-=dt)<=0){ p.sv=Math.random()<.4-.25*k?0:Math.floor(Math.random()*4); o.sw=true; } return o; }
    if(phase!=='play') return o;
    const coming=lastTeam>=0&&lastTeam!==p.team&&laneOK(p);
    if(coming){ if((A.t-=dt)<=0||!A.pred){ A.t=.1; A.pred=predict(p); if(A.dec.n!==hits){ A.dec={n:hits,whiff:Math.random()<(ball.smash?.42-.3*k:.1-.08*k),off:Math.random()<AI.miss?(Math.random()-.5)*90:0}; } } A.react-=dt; }
    else { A.pred=null; A.react=AI.react; }
    const homeNet=NETX-dir*(KIT+24+(1-k)*60),homeBack=p.team?W-BACK-30:BACK+30;
    let tx=A.pred?A.pred.x-dir*22+(A.dec.off||0):(hits>=2&&k>.25?homeNet:homeBack); if(!A.pred&&servT===p.team&&hits<3) tx=homeBack;
    tx=p.team?clamp(tx,NETX+24,W-14):clamp(tx,14,NETX-24); if(A.pred&&A.pred.vol) tx=p.team?Math.max(tx,NETX+KIT+8):Math.min(tx,NETX-KIT-8);
    const d=tx-p.x; o.dx=Math.abs(d)<4?0:Math.sign(d)*Math.min(1,Math.abs(d)/28);
    if(A.react<=0&&coming&&mySide(p)&&!(ball.bn===0&&mustBounce())&&reachD(p,ball.x,ball.y)<REACH*.9&&!(A.dec.n===hits&&A.dec.whiff)&&!(ball.bn===0&&inKitchen(p.x))) o.sw=true; return o; }
  function inputOf(p,dt){ const cc=ctrl[p.n]; if(cc==='ai') return aiInput(p,dt); if(cc==='net'){ const r=rin[p.n],o={dx:r.dx,sw:r.sw,dk:r.dk,up:r.up,dn:r.dn}; r.sw=r.dk=r.up=r.dn=false; return o; } return keyIn(cc==='self'?'solo':cc); }
  // 擊球：自動判斷扣殺／小球／抽球
  function shoot(p,dk){ const dir=p.face,R=Math.random,ai=isAI(p.n),near=Math.abs(p.x-NETX)<KIT+70,high=ball.y<p.y-112,low=ball.y>NETTOP-6,opp=ps.filter(q=>q.team!==p.team);
    let type=high?'smash':dk||(near&&low)?'dink':'drive';
    if(ai){ const oFar=opp.every(o=>Math.abs(o.x-NETX)>KIT+90); if(type==='drive'&&hits===2&&R()<.35+.5*k) type='drop'; else if(type==='drive'&&!oFar&&R()<.5*k) type='dink'; else if(type==='drive'&&oFar&&near&&R()<.4) type='dink'; }
    else if(dk&&!near) type='drop';
    const oppBack=dir>0?W-BACK:BACK; let tx,v=null;
    if(type==='dink'||type==='drop') tx=NETX+dir*(34+R()*(KIT-50)); else if(type==='smash') tx=NETX+dir*(KIT+40+R()*150); else tx=oppBack-dir*(40+R()*140);
    if(ai) tx+=(R()-.5)*AI.err;
    if(type==='smash') v=aimFixed(ball.x,ball.y,tx,ai?560+200*k:760,dir,-35,12,KIT+20);
    else if(type==='drive') v=aimFixed(ball.x,ball.y,tx,ai?420+180*k:560,dir,-6,22,KIT+30);
    else v=aimShot(ball.x,ball.y,tx,type==='drop'?[30,40,50,60]:[18,28,38,50,62],dir,10);
    if(ai&&R()<.22*Math.pow(1-k,1.5)){ v=R()<.5?aimShot(ball.x,ball.y,oppBack+dir*(30+R()*60),[25,35,45],dir):{vx:dir*(260+R()*120),vy:-(60+R()*80)}; } /* 低關卡電腦偶爾打出界或下網 */
    v=v||aimShot(ball.x,ball.y,oppBack-dir*120,[30,40,50,60],dir)||aimShot(ball.x,ball.y,NETX+dir*200,[40,55,70],dir)||{vx:dir*300,vy:-420};
    const vol=ball.bn===0; ball.vx=v.vx; ball.vy=v.vy; ball.bn=0; ball.spin=''; ball.curl=0; ball.smash=type==='smash';
    if(dbl) ball.tz=type==='dink'?p.z:(R()<.5?0:1); // 雙打：小球直線、其他球隨機打前排或後排
    lastHit=p.n; lastTeam=p.team; hits++; rally++; best=Math.max(best,rally); if(vol) p.volT=.3;
    if(type==='smash'){ sfx('boom'); shake=.2; pop('扣殺！','#ff5d8f',ball.x,ball.y-30); } else { sfx(type==='drive'?'place':'pop'); if(type==='dink'||type==='drop') pop(type==='dink'?'小球':'放小球','#7af0ff',ball.x,ball.y-30); }
    fx.push({k:'ring',x:ball.x,y:ball.y,z:ball.z,t:0,col:ball.smash?'#ff5d8f':'#fff'}); }
  // 一球結束：wt 贏這球的隊伍。傳統計分只有發球方得分；雙打照 1 號／2 號發球員輪替，發球方得分時搭檔換邊
  function rallyEnd(wt,why){ if(phase!=='play'&&phase!=='serve') return; phase='point'; ptT=1.6; lastW=wt; let txt;
    if(wt===servT){ score[wt]++; txt='得分'; if(dbl){ const S=ps[server],P=ps.find(q=>q.team===wt&&q!==S),z=S.z; S.z=P.z; P.z=z; } }
    else if(RALLY){ score[wt]++; txt='得分・換發球'; servT=wt; server=right(wt).n; sNum=1; }
    else if(dbl&&sNum===1){ sNum=2; server=ps.find(q=>q.team===servT&&q.n!==server).n; txt='換第二發球員'; }
    else { servT=wt; server=right(wt).n; sNum=1; txt='換發球'; }
    const mine=wt===myTeam; msg=(two?(dbl?TN(wt):wt?'2P':'1P')+' ':mine?'':'對手')+txt+'　'+why; msgT=1.6;
    env.sfx(two||mine?'item':'hurt'); if(net) ev.push('p'+wt);
    if(Math.max(score[0],score[1])>=GOAL&&(!RALLY||Math.abs(score[0]-score[1])>=2)){ phase='over'; overT=0; } } /* 發球得分制先到 11 分就贏（不用 Deuce）；落地得分制 15 分要贏 2 分 */
  function conclude(a,b,note){ if(ended) return; ended=true; score[0]=a; score[1]=b; const w=a>b?0:1,mine=two||w===myTeam;
    if(solo&&w===0) LS(recKey(si),a+':'+b); env.sfx(mine?'win':'lose');
    env.end({title:two?(dbl?TN(w):w?'2P':'1P')+' 獲勝！':mine?(solo?'贏了！過關':'你們贏了！'):'輸了',big:a+' : '+b,text:(note?note+' ':'')+(solo?ST.name+'　對手：'+ST.foe+(dbl?'隊':'')+'。':'')+(best>3?'最長來回 '+best+' 拍。':''),score:solo&&w===0?si+1:null,next:solo&&w===0&&si<LV-1}); }
  function snap(){ const m={s:[ps.map(p=>[r1(p.x),r1(p.sw),p.z,p.sv]),r1(ball.x),r1(ball.y),r1(ball.vx),r1(ball.vy),r1(ball.z),score[0],score[1],servT,server,sNum,['serve','play','point','over'].indexOf(phase),hits,lastW,ball.tz,lastTeam],e:ev,m:msgT>0?msg:''}; ev=[]; return m; }
  if(net){ if(client) net.onmsg=m=>{ if(m.s){ const s=m.s; s[0].forEach((q,i)=>{ if(!ps[i]) return; ps[i].tx=q[0]; ps[i].sw=q[1]; ps[i].z=q[2]; ps[i].sv=q[3]; }); ball.tx=s[1]; ball.ty=s[2]; ball.vx=s[3]; ball.vy=s[4]; ball.z=s[5]; score[0]=s[6]; score[1]=s[7]; servT=s[8]; server=s[9]; sNum=s[10]; phase=['serve','play','point','over'][s[11]]; hits=s[12]; lastW=s[13]; ball.tz=s[14]; lastTeam=s[15];
        for(const n of m.e){ if(n==='p0'||n==='p1') env.sfx(+n[1]===myTeam?'item':'hurt'); else env.sfx(n); } if(m.m){ msg=m.m; msgT=1.4; } } else if(m.end) conclude(m.end[0],m.end[1],m.end[2]); };
    else { net.onmsg=(m,from)=>{ if(m.i&&rin[from]){ const r=rin[from]; r.dx=m.i[0]; if(m.i[1]) r.sw=true; if(m.i[2]) r.dk=true; if(m.i[3]) r.up=true; if(m.i[4]) r.dn=true; } };
      net.onleave=i=>{ if(i<N&&!ended) ctrl[i]='ai'; }; } }
  function movePlayer(p,i,dt){ const sp=isAI(p.n)?AI.spd:235; p.moving=!!i.dx;
    if(phase==='serve'&&p.n===server){ const bx=p.team?W-BACK+6:BACK-6; p.x=p.team?Math.max(bx,p.x+i.dx*sp*dt):Math.min(bx,p.x+i.dx*sp*dt); p.x=clamp(p.x,10,W-10);
      if(i.up){ p.sv=(p.sv+3)%4; sfx('click'); } if(i.dn||i.dk){ p.sv=(p.sv+1)%4; sfx('click'); } } // 發球前 ↑ ↓（或「小球」）換發球種類
    else { p.x+=i.dx*sp*dt; const lo=p.team?NETX+18:10,hi=p.team?W-10:NETX-18; p.x=clamp(p.x,lo,hi); }
    if(i.sw&&p.sw<=0){ p.sw=.26; p.hitOK=true; p.dk=false; } else if(i.dk&&p.sw<=0&&!(phase==='serve'&&p.n===server)){ p.sw=.26; p.hitOK=true; p.dk=true; } if(p.sw>0) p.sw-=dt;
    if(p.volT>0){ p.volT-=dt; if(inKitchen(p.x)&&phase==='play'){ p.volT=0; rallyEnd(1-p.team,'截擊後衝進廚房區'); } } }
  let lastIn='';
  function update(dt){ t+=dt; if(introT>0) introT-=dt; if(msgT>0) msgT-=dt; if(shake>0) shake-=dt; if(waitTip>0) waitTip-=dt; for(const f of fx) f.t+=dt; for(let i=fx.length-1;i>=0;i--) if(fx[i].t>1) fx.splice(i,1);
    if(client){ const i=keyIn('solo'),key=''+i.dx; sendT-=dt; if(key!==lastIn||i.sw||i.dk||i.up||i.dn||sendT<=0){ lastIn=key; sendT=1/20; net.send({i:[i.dx,+i.sw,+i.dk,+i.up,+i.dn]}); }
      const f=Math.min(1,dt*18); for(const p of ps){ p.moving=Math.abs(p.tx-p.x)>.8; p.x+=(p.tx-p.x)*f; } if(Math.hypot(ball.tx-ball.x,ball.ty-ball.y)>90){ ball.x=ball.tx; ball.y=ball.ty; } else { ball.x+=(ball.tx-ball.x)*f; ball.y+=(ball.ty-ball.y)*f; } return; }
    if(ended) return; if(net){ sendT-=dt; if(sendT<=0){ sendT=1/20; net.send(snap()); } }
    if(phase==='over'){ overT+=dt; if(overT>1.6){ if(net){ net.send(snap()); net.send({end:[score[0],score[1],'']}); } conclude(score[0],score[1]); } return; }
    for(const p of ps) movePlayer(p,inputOf(p,dt),dt);
    ball.z+=(ball.tz-ball.z)*Math.min(1,dt*2.4);
    if(phase==='point'){ ptT-=dt; if(ball.y<GY){ stepB(ball,dt); if(ball.y>GY) ball.y=GY; } if(ptT<=0) setServe(); return; }
    if(phase==='serve'){ const p=ps[server]; ball.x=p.x+p.face*20; ball.y=p.y-40; ball.vx=0; ball.vy=0; ball.z=ball.tz=p.z;
      if(p.sw>0&&p.hitOK&&introT<=0){ p.hitOK=false; const dir=p.face,ty=SERVES[p.sv][0],R2=Math.random,ai=isAI(p.n),oppBack=dir>0?W-BACK:BACK; let v=null,tx;
        if(ty==='deep'){ tx=oppBack-dir*(25+R2()*60); v=aimShot(ball.x,ball.y,tx,[42,46,50,55],dir,14); }
        else if(ty==='drive'){ tx=oppBack-dir*(50+R2()*90); v=aimFixed(ball.x,ball.y,tx,ai?470+140*k:560,dir,2,24,KIT+40); }
        else if(ty==='top'){ tx=NETX+dir*(KIT+90+R2()*110); v=aimShot(ball.x,ball.y,tx,[36,44,52,60],dir,14,'top'); }
        else { tx=NETX+dir*(KIT+70+R2()*130); v=aimShot(ball.x,ball.y,tx,[26,34,42,50],dir,14); }
        v=v||aimShot(ball.x,ball.y,NETX+dir*(KIT+120),[38,46,54],dir,14)||{vx:dir*480,vy:-430};
        ball.vx=v.vx; ball.vy=v.vy; ball.bn=0; ball.smash=false; ball.spin=ty==='top'?'top':ty==='slice'?'slice':''; ball.curl=0; ball.tz=dbl?1-p.z:0; // 發球打斜對角
        lastHit=p.n; lastTeam=p.team; hits=1; rally=1; phase='play'; sfx('pop'); pop(SERVES[p.sv][1],'#fff',ball.x,ball.y-40); fx.push({k:'ring',x:ball.x,y:ball.y,z:ball.z,t:0,col:'#fff'}); }
      return; }
    const n=Math.max(1,Math.ceil(dt*240)); for(let s=0;s<n&&phase==='play';s++){ const px=ball.x; stepB(ball,dt/n);
      if((px-NETX)*(ball.x-NETX)<=0&&ball.y>NETTOP-6){ if(ball.y>NETTOP+2){ ball.x=NETX-Math.sign(ball.vx||1)*6; ball.vx*=-.15; ball.vy=Math.max(0,ball.vy)*.3; sfx('bump'); } else { ball.vy=Math.min(ball.vy,0)-40; ball.vx*=.75; fx.push({k:'ring',x:NETX,y:NETTOP,z:ball.z,t:0,col:'#aaa'}); } }
      for(const p of ps){ if(p.sw>.04&&p.hitOK&&laneOK(p)&&reachD(p,ball.x,ball.y)<REACH){ if(!mySide(p)||p.team===lastTeam) continue;
          if(ball.bn===0&&mustBounce()){ if(human(p.n)) waitTip=1; continue; }
          p.hitOK=false; if(ball.bn===0&&inKitchen(p.x)){ rallyEnd(1-p.team,'在廚房區截擊'); break; } shoot(p,p.dk); break; } }
      if(phase!=='play') break;
      if(ball.y>=GY){ ball.y=GY; const sideT=ball.x<NETX?0:1,inb=ball.x>=BACK-3&&ball.x<=W-BACK+3,ht=lastTeam;
        if(ball.bn===0){ if(sideT===ht){ rallyEnd(1-ht,hits===1?'發球沒過網':'球沒過網'); break; } if(!inb){ rallyEnd(1-ht,'出界'); break; }
          if(hits===1&&inKitchen(ball.x)){ rallyEnd(1-ht,'發球落在廚房區'); break; }
          ball.bn=1; bounce(ball); sfx('land'); fx.push({k:'dust',x:ball.x,y:GY,z:ball.z,t:0}); }
        else { rallyEnd(ht,'球落地兩次'); break; } } } }
  function draw(){ c.save(); if(shake>0) c.translate((Math.random()-.5)*6,(Math.random()-.5)*5); c.drawImage(courtBg(VEN),0,0); drawNet(c);
    const order=ps.slice().sort((a,b)=>b.z-a.z),lbl=p=>introT>0||(dbl&&phase==='serve'&&p.n===server)?(two?(ctrl[p.n]==='key0'?'1P':ctrl[p.n]==='key1'?'2P':''):(p.n===me?'你':dbl&&p.team===myTeam?'隊友':'')):'';
    const drawP=p=>{ const sc=1-p.z*.12; c.save(); c.translate(p.x,GY-p.z*ZOFF); c.scale(sc,sc); c.translate(-p.x,-GY); drawPlayer(c,p.x,GY,p.face,p.look.color,p.sw,t,p.moving,p.look.hair|0,lbl(p),{pad:p.look.pad,face:p.look.face||(p.team?'#3ddbd9':'#ff7a3d'),grip:p.look.grip}); c.restore(); };
    const drawB=()=>{ c.save(); c.translate(0,-ball.z*ZOFF); drawBall(c,ball); if(ball.curl&&ball.bn>=1&&phase==='play'){ c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=2; c.beginPath(); c.arc(ball.x,ball.y,12,t*12,t*12+4); c.stroke(); } c.restore(); };
    for(const p of order) if(p.z>=.5) drawP(p); if(ball.z>=.5) drawB();
    for(const p of order) if(p.z<.5) drawP(p); if(ball.z<.5) drawB();
    for(const f of fx){ const a=1-f.t,oy=-(f.z||0)*ZOFF; if(f.k==='ring'){ c.strokeStyle=f.col; c.globalAlpha=a; c.lineWidth=3; c.beginPath(); c.arc(f.x,f.y+oy,6+f.t*34,0,TAU); c.stroke(); c.globalAlpha=1; }
      else if(f.k==='dust'){ c.fillStyle='rgba(255,255,255,'+a*.7+')'; for(let i=0;i<6;i++){ const an=Math.PI+i*Math.PI/5; c.beginPath(); c.arc(f.x+Math.cos(an)*f.t*30,f.y+oy+Math.sin(an)*f.t*12,2.5,0,TAU); c.fill(); } }
      else if(f.k==='txt'){ c.globalAlpha=a; c.font='900 20px '+TC; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='#14122b'; c.strokeText(f.txt,f.x,f.y-f.t*30); c.fillStyle=f.col; c.fillText(f.txt,f.x,f.y-f.t*30); c.globalAlpha=1; } }
    c.restore();
    // 比分：照現實報分（單打兩個數字、雙打三個數字）
    c.fillStyle='rgba(11,10,28,.8)'; rr(c,W/2-230,8,460,60,14); c.fill(); c.textAlign='center'; c.textBaseline='middle';
    const tName=tm=>dbl?ps.filter(p=>p.team===tm).map(p=>names[p.n]).join('＋'):names[tm];
    c.font='900 15px '+TC; c.fillStyle=ps[0].look.color; c.fillText(tName(0),W/2-150,24,150); c.fillStyle=ps[1].look.color; c.fillText(tName(1),W/2+150,24,150);
    c.font='900 30px '+TC; c.fillStyle='#fff'; c.fillText(score[0]+'　:　'+score[1],W/2,32);
    c.font='700 13px '+TC; c.fillStyle='#cfd2e8'; c.fillText((dbl?'雙打・':'單打・')+(RALLY?'落地得分制・先拿 15 分（要贏 2 分）':'發球得分制・先拿 11 分（不用 Deuce）'),W/2,56,280);
    c.fillStyle='#ffd23f'; c.font='900 13px '+TC; c.fillText('🟡 發球',servT?W/2+150:W/2-150,46);
    if(phase==='serve'&&server>=0){ const call=score[servT]+'－'+score[1-servT]+(dbl?'－'+sNum:''); c.fillStyle='rgba(11,10,28,.7)'; rr(c,W/2-190,84,380,30,15); c.fill(); c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText('報分 '+call+(dbl?'，'+names[server]+'發球':'，從'+(score[servT]%2?'左':'右')+'邊發球'),W/2,99,370); }
    const mine=ps[me],tch=document.body.classList.contains('touch'),meServe=two?human(server):server===me;
    if(phase==='serve'&&introT<=0&&meServe){ const P=ps[server]; c.fillStyle='rgba(11,10,28,.78)'; rr(c,W/2-230,120,460,64,15); c.fill();
      SERVES.forEach((q,i)=>{ const x=W/2-171+i*114,on=i===P.sv; c.fillStyle=on?'#ffd23f':'rgba(255,255,255,.12)'; rr(c,x-52,128,104,26,13); c.fill(); c.fillStyle=on?'#14122b':'#cfd2e8'; c.font='900 14px '+TC; c.fillText(q[1],x,141); });
      c.fillStyle='#fff'; c.font='700 13px '+TC; c.fillText(tch?'「小球」換發球種類，「揮拍」低手發球':'↑ ↓ 換發球種類，空白鍵低手發球',W/2,170); }
    if(phase==='play'&&hits<3){ c.fillStyle='rgba(11,10,28,.6)'; rr(c,W/2-150,84,300,26,13); c.fill(); c.fillStyle='#7af0ff'; c.font='900 14px '+TC; c.fillText(hits===1?'接發球：要等球彈地一次':'第三拍：也要等球彈地一次',W/2,97); }
    if(waitTip>0){ c.fillStyle='#ffd23f'; c.font='900 17px '+TC; c.lineWidth=4; c.strokeStyle='#14122b'; c.strokeText('先等球彈地（雙彈地規則）',mine.x,GY-150); c.fillText('先等球彈地（雙彈地規則）',mine.x,GY-150); }
    if(phase==='play'&&hits>=3&&inKitchen(mine.x)){ c.fillStyle='#ff9d3d'; c.font='900 14px '+TC; c.lineWidth=4; c.strokeStyle='#14122b'; c.strokeText('在廚房區：不能截擊',mine.x,GY-130); c.fillText('在廚房區：不能截擊',mine.x,GY-130); }
    if(dbl&&!two&&phase==='play'&&lastTeam>=0&&lastTeam!==myTeam&&ball.tz===mine.z){ c.fillStyle='#86dc4f'; c.font='900 14px '+TC; c.lineWidth=4; c.strokeStyle='#14122b'; c.strokeText('你的球！',mine.x,GY-mine.z*ZOFF-150); c.fillText('你的球！',mine.x,GY-mine.z*ZOFF-150); }
    if(msgT>0&&phase!=='serve'){ c.font='900 28px '+TC; c.lineWidth=6; c.strokeStyle='#14122b'; c.strokeText(msg,W/2,190); c.fillStyle='#ffd23f'; c.fillText(msg,W/2,190); }
    if(introT>0&&solo){ c.font='900 28px '+TC; c.lineWidth=6; c.strokeStyle='#14122b'; const s2='第 '+(si+1)+' 關　對手：'+ST.foe+(dbl?'隊':''); c.strokeText(s2,W/2,190); c.fillStyle='#ffd23f'; c.fillText(s2,W/2,190); } }
  return {update,draw,destroy(){},_dbg:{ps,ball,score,get msg(){ return msg; },get phase(){ return phase; },get hits(){ return hits; },get server(){ return server; },get servT(){ return servT; },get lastTeam(){ return lastTeam; },get lastHit(){ return lastHit; },get sNum(){ return sNum; },AI,predict,ctrl,dbl}};
}

function demo(c,v,t,col0,col1,foe){ c.drawImage(courtBg(v),0,0); drawNet(c);
  const T=2.6,u=(t%T)/T,dir=u<.5?1:-1,kk=u<.5?u*2:(u-.5)*2,x0=dir>0?250:550,x1=dir>0?550:250,bx=x0+(x1-x0)*kk,by=GY-60-Math.sin(kk*Math.PI)*120;
  drawPlayer(c,250,GY,1,col0,dir<0&&kk>.85?.2:u<.08?.2:0,t,false,0,'','#ff7a3d'); drawPlayer(c,560,GY,-1,col1,dir>0&&kk>.85?.2:u>.5&&u<.58?.2:0,t,false,1,foe||'','#3ddbd9'); drawBall(c,{x:bx,y:by}); }
function stageShow(c,w,h,si,t){ const S=STAGES[si]; c.save(); c.scale(w/W,h/H); demo(c,S.v,t,'#ff5d6d',S.col,S.foe); c.fillStyle='rgba(11,10,28,.72)'; rr(c,W/2-190,10,380,44,14); c.fill(); c.fillStyle='#ffd23f'; c.font='900 22px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(S.name+'　對手 '+S.foe,W/2,33,360); c.restore(); }
function preview(c,w,h,L,t){ L=Object.assign({color:'#ff5d6d',hair:0,pad:'std',face:'#ff7a3d',grip:'#333333'},L||{}); c.save(); c.scale(w/W,h/H); c.drawImage(courtBg(0),0,0); c.save(); c.translate(W/2,H*.58); c.scale(2.2,2.2); c.translate(-(W/2+18),-(GY-58)); drawPlayer(c,W/2,GY,1,L.color,(t%1.6)<.26?.26-(t%1.6):0,t,false,+L.hair||0,'',{pad:L.pad,face:L.face,grip:L.grip}); c.restore(); c.restore(); }
function thumb(c,w,h,t){ c.save(); c.scale(w/W,h/H); demo(c,6,t,'#ff5d6d','#4f9dff',''); c.font='900 54px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=10; c.strokeStyle='#14122b'; c.strokeText('匹克球對決',W/2,100); c.fillStyle='#e8f040'; c.fillText('匹克球對決',W/2,100); c.restore(); }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).pickleball={
  name:'匹克球對決',tag:'PICKLEBALL DUEL',color:'#e8f040',online:true,maxPlayers:4,
  coin:o=>{ const d=(o.options||{}).fmt==='doubles'||(o.net&&o.net.count>2); return {verb:'先發球',names:d?['左隊','右隊']:o.net?[o.net.names[0]||'玩家 1',o.net.count>1?(o.net.names[1]||'玩家 2'):'電腦']:o.mode==='2p'?['1P','2P']:['你','電腦']}; },
  desc:'照真實規則打匹克球：單打或雙打、低手發球（四種發球）、雙彈地、廚房區不能截擊。揮拍自動判斷抽球或扣殺，「小球」輕輕吊進對方廚房區。單人 200 關（1 對 1 或 2 對 2），雙人同一台，連線最多 4 人。',
  goal:'球在對方那邊落地兩次、或對方失誤（出界、下網、發球落在廚房區、在廚房區截擊）就贏這球。發球得分制只有發球方贏球才得分，先到 11 分就贏；落地得分制每球都得分，先到 15 分、領先 2 分就贏。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  options:[{key:'court',label:'場地（雙人／連線）',def:'0',opts:VENUES.map((v,i)=>({id:String(i),label:v.n}))},{key:'fmt',label:'賽制',def:'singles',opts:[{id:'singles',label:'單打 1 對 1'},{id:'doubles',label:'雙打 2 對 2'}]},{key:'team',label:'雙人玩雙打',def:'vs',opts:[{id:'vs',label:'各帶電腦隊友對打'},{id:'coop',label:'兩人同隊打電腦'}]},{key:'serve',label:'預設發球',def:'deep',opts:[{id:'deep',label:'高遠深球'},{id:'drive',label:'快速平擊'},{id:'top',label:'上旋發球'},{id:'slice',label:'側旋發球'}]},{key:'score',label:'計分',def:'side',opts:[{id:'side',label:'發球得分制（11 分，不用 Deuce）'},{id:'rally',label:'落地得分制（15 分）'}]}],
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  stageGoal:i=>{ const S=STAGES[i]; return '第 '+(i+1)+' 關・'+S.name+'：打贏 '+S.foe+'。'+(i<10?'對手很慢、常失誤，先熟悉發球、等彈地和小球。':i<60?'對手開始會上網打小球，你也試著站到廚房線外。':i<130?'對手會在網前截擊，回球要低。':'高手對決：小球、抽球、扣殺都很準。'); },
  stageLocked:i=>i>0&&getRec(i-1)==null,stageBest:i=>{ const v=getRec(i); return v?'✓ '+v.replace(':',' : '):''; },
  hubBest:()=>{ let n=0; for(let i=0;i<LV;i++) if(getRec(i)!=null) n++; return n?'過關 <b>'+n+' / '+LV+'</b>':'尚無紀錄'; },
  help:[['← →','移動（發球時要站在底線後）'],['↑ ↓','發球前換發球種類：高遠深球、快速平擊、上旋、側旋'],['空白鍵','揮拍：低手發球；自動抽球，球很高時扣殺'],['X','小球：輕輕吊進對方廚房區'],['規則','前兩拍要等球彈地；站在廚房區不能截擊']],
  touchHelp:[['◀ ▶','移動'],['揮拍','發球、自動抽球或扣殺'],['小球','輕輕吊進對方廚房區；發球前按＝換發球種類'],['規則','前兩拍等彈地；廚房區不能截擊']],
  touch:{left:[{l:'◀',c:'ArrowLeft'},{l:'▶',c:'ArrowRight'}],right:[{l:'小球',c:'KeyX'},{l:'揮拍',c:'Space',act:true}]},
  looks:[{key:'pad',label:'球拍種類',opts:[{id:'std',label:'標準拍'},{id:'long',label:'加長拍'},{id:'wide',label:'寬面拍'}]},{key:'face',label:'拍面顏色',type:'color',opts:['#ff7a3d','#ff5d6d','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#b98cff','#2a2a30']},{key:'grip',label:'握把顏色',type:'color',opts:['#333333','#f4f0e8','#ff5d6d','#4f9dff','#5fd068','#ffd23f']},{key:'color',label:'球衣顏色',type:'color',opts:['#ff5d6d','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#b98cff','#ff7eb6']},{key:'hair',label:'髮型',opts:[{id:'0',label:'短髮'},{id:'1',label:'馬尾'},{id:'2',label:'捲毛'}]}],
  best:{label:'過關',fmt:v=>v+' 關',lower:false},
  stageShow,preview,thumb,create,_sim:{stepB,simLand,aimShot,STAGES,inKitchen,NETX,KIT,GY}};
})();
