// 羽球對決：側面單打。照真實規則每球得分，先拿 11／15／21 分（要領先 2 分，最多到 30 分）就贏。
// 操作：左右移動、跳、揮拍（自動判斷高遠球／平抽／挑球，跳起來揮＝殺球），另外一顆「吊球」輕輕吊過網。
// 單人 200 關（8 個球館，電腦一關一關變強）、兩人同一台、連線（房主運算，加入的人在右邊、只送按鍵）。
(function(){
'use strict';
const W=800,H=450,GY=400,NETX=400,NETTOP=292,BACK=44,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2;
const G=700,K=.0021,REACH=52,LV=200;
// 拍子打得到的範圍：從頭頂上方到膝蓋這一段（半徑 REACH）
const reachD=(p,sx,sy)=>{ const rx=p.x+p.face*22,my=p.y-82; return Math.hypot(sx-rx,Math.max(0,Math.abs(sy-my)-52)); };
const clamp=(v,a,b)=>v<a?a:v>b?b:v,r1=v=>Math.round(v*10)/10;
const LS=(k,v)=>{ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } };
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function shade(hex,k){ const n=parseInt(hex.slice(1),16),f=v=>clamp(Math.round(k>1?v+(255-v)*(k-1):v*k),0,255); return 'rgb('+f(n>>16&255)+','+f(n>>8&255)+','+f(n&255)+')'; }

/* ---------- 8 個球館，每個 25 關；對手名字 ---------- */
const VENUES=[
  {n:'學校體育館',wall:['#e8d8b8','#d0b890'],floor:'#3f8a5a',crowd:.3,in:1,ban:'#2f6fd0'},
  {n:'社區活動中心',wall:['#f0e4d0','#d8c4a4'],floor:'#4a9a5e',crowd:.4,in:1,ban:'#e0602a'},
  {n:'公園球場',sky:['#7ec8ff','#d8f0ff'],floor:'#4f9a4a',crowd:.2,in:0,tree:1},
  {n:'海濱度假村',sky:['#5ec8ff','#fff1c8'],floor:'#3a8aa8',crowd:.3,in:0,sea:1},
  {n:'城市夜間球館',wall:['#2a2a48','#1a1a30'],floor:'#2f7a52',crowd:.6,in:1,night:1,ban:'#b45cff'},
  {n:'山中木屋球館',wall:['#b8875a','#8a5e3a'],floor:'#4a8a5a',crowd:.4,in:1,wood:1,ban:'#3a8a3a'},
  {n:'全國錦標賽',wall:['#3a4a7a','#24305a'],floor:'#2f6fa8',crowd:.85,in:1,ban:'#ffd23f'},
  {n:'國際大賽主場',wall:['#5a2a3a','#3a1424'],floor:'#2a7ac0',crowd:1,in:1,night:1,ban:'#ff5d8f'}];
const FOES=['小安','阿凱','小美','大熊','阿宏','小芸','志明','春嬌','阿哲','小琪','大山','阿妹','小傑','阿娟','大寶','小芳','阿翔','小雯','阿德','小蓉','阿強','小慧','阿龍','小婷','阿偉'];
const FCOL=['#4f9dff','#ff9d3d','#5fd068','#b98cff','#ff5d8f','#3ddbd9','#e8c040','#ff6b4a'];
const STAGES=Array.from({length:LV},(_,i)=>{ const v=Math.floor(i/25),k=i/(LV-1); return {i,v,k,foe:FOES[(i*7+v*3)%FOES.length]+(i>=100?'・進階':''),col:FCOL[(i*3+1)%FCOL.length],hair:i%3,name:VENUES[v].n+' '+(i%25+1),stars:Math.min(5,1+Math.floor(i/40))}; });
const recKey=i=>'arcade.badminton.w.'+i,getRec=i=>{ const v=LS(recKey(i)); return v==null?null:v; };

/* ---------- 羽球飛行：重力＋空氣阻力（速度越快阻力越大） ---------- */
function stepSh(s,dt){ const sp=Math.hypot(s.vx,s.vy); s.vx-=K*sp*s.vx*dt; s.vy+=(G-K*sp*s.vy)*dt; s.x+=s.vx*dt; s.y+=s.vy*dt; }
function simLand(x,y,vx,vy){ const s={x,y,vx,vy}; let netY=null; for(let i=0;i<500;i++){ const px=s.x; stepSh(s,1/60); if(netY==null&&(px-NETX)*(s.x-NETX)<=0) netY=s.y; if(s.y>=GY) break; } return {x:s.x,netY}; }
// 找一組初速：從 (x,y) 用某個角度打到 tx；角度清單照順序試，要過得了網
function aimShot(x,y,tx,angs,dir){ for(const a of angs){ const ca=Math.cos(a*Math.PI/180)*dir,sa=-Math.sin(a*Math.PI/180); let lo=120,hi=1800,best=null;
    for(let it=0;it<18;it++){ const v=(lo+hi)/2,L=simLand(x,y,ca*v,sa*v); if((L.x-tx)*dir<0) lo=v; else hi=v; best={v,L}; }
    if(best&&best.L.netY!=null&&best.L.netY<NETTOP-10&&Math.abs(best.L.x-tx)<40) return {vx:ca*best.v,vy:sa*best.v}; } return null; }

// 速度固定、只找角度（殺球、平抽要又快又平）：角度從低往高找，第一個過得了網又落在 tx 附近的
function aimFixed(x,y,tx,v,dir,a0,a1){ let best=null,bd=1e9; for(let a=a0;a<=a1;a+=1.5){ const ca=Math.cos(a*Math.PI/180)*dir,sa=-Math.sin(a*Math.PI/180),L=simLand(x,y,ca*v,sa*v); if(L.netY==null||L.netY>=NETTOP-8||L.x<BACK+12||L.x>W-BACK-12||(L.x-NETX)*dir<40) continue; const d=Math.abs(L.x-tx); if(d<bd){ bd=d; best={vx:ca*v,vy:sa*v,x:L.x}; } } return best&&bd<120?best:null; }
/* ---------- Q 版羽球選手 ---------- */
function drawPlayer(c,x,y,face,col,sw,air,t,moving,hair,label){
  const INK='#2a1a26',skin='#ffe0c8',bob=!air&&moving?Math.abs(Math.sin(t*14))*3:0,yy=y-bob,blink=(t*.7+x*.01)%3<.12;
  c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x,GY+3,26,6,0,0,TAU); c.fill();
  c.lineWidth=2.5; c.strokeStyle=INK;
  // 腳＋圓鞋
  const st=moving&&!air?Math.sin(t*14)*6:0;
  for(const [dx,o] of [[-9,st],[9,-st]]){ c.fillStyle='#ffe0c8'; c.fillRect(x+dx-4,yy-22,8,16); c.strokeRect(x+dx-4,yy-22,8,16); c.fillStyle='#fff'; c.beginPath(); c.ellipse(x+dx+o*.3+face*3,yy-5,9,6,0,0,TAU); c.fill(); c.stroke(); c.fillStyle=col; c.fillRect(x+dx+o*.3+face*3-6,yy-7,12,2.5); }
  // 短褲、上衣
  c.fillStyle='#2a2a3a'; rr(c,x-15,yy-34,30,14,4); c.fill(); c.stroke();
  c.fillStyle=col; rr(c,x-17,yy-60,34,30,10); c.fill(); c.stroke(); c.fillStyle='rgba(255,255,255,.35)'; c.fillRect(x-11,yy-55,6,20);
  // 沒拿拍的手
  c.fillStyle=skin; c.beginPath(); c.arc(x-face*18,yy-40,6,0,TAU); c.fill(); c.stroke();
  // 拿拍的手：揮拍時從後面往前上方甩
  const a0=-2.5,a1=.5,u=sw>0?1-sw/.28:0,ang=sw>0?(u<.35?a0-u*1.2:a0-.42+(u-.35)/.65*(a1-a0+.42)):-1.9+Math.sin(t*2)*.05;
  const sx=x+face*14,sy=yy-54,ax=Math.cos(ang),ay=Math.sin(ang),hx=sx+face*ax*20,hy=sy+ay*20;
  c.strokeStyle=INK; c.lineWidth=7; c.beginPath(); c.moveTo(sx,sy); c.lineTo(hx,hy); c.stroke(); c.strokeStyle=col; c.lineWidth=4.5; c.beginPath(); c.moveTo(sx,sy); c.lineTo(hx,hy); c.stroke();
  const rx=hx+face*ax*34,ry=hy+ay*34; c.strokeStyle='#555'; c.lineWidth=3; c.beginPath(); c.moveTo(hx,hy); c.lineTo(rx,ry); c.stroke();
  c.save(); c.translate(hx+face*ax*44,hy+ay*44); c.rotate(Math.atan2(ay,face*ax)); c.strokeStyle='#e8402a'; c.lineWidth=3; c.beginPath(); c.ellipse(0,0,14,10,0,0,TAU); c.stroke(); c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=.8; for(let i=-2;i<=2;i++){ c.beginPath(); c.moveTo(i*5,-9); c.lineTo(i*5,9); c.moveTo(-13,i*3.6); c.lineTo(13,i*3.6); c.stroke(); } c.restore();
  c.fillStyle=skin; c.strokeStyle=INK; c.lineWidth=2.5; c.beginPath(); c.arc(hx,hy,6,0,TAU); c.fill(); c.stroke();
  if(sw>.12){ c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=5; c.beginPath(); c.arc(sx,sy,62,face>0?-2.6:-.55,face>0?-1:-2.1,face<0); c.stroke(); }
  // 頭：大頭、大眼睛兩個亮點、腮紅、ω 嘴
  const hy0=yy-86; c.fillStyle=skin; c.beginPath(); c.arc(x,hy0,28,0,TAU); c.fill(); c.stroke();
  const hc=['#3a2416','#1a1410','#8a4a2a'][hair%3]; c.fillStyle=hc; c.beginPath(); c.arc(x,hy0-4,29,Math.PI*1.05,Math.PI*1.95); c.quadraticCurveTo(x+face*10,hy0-14,x-face*28,hy0-6); c.closePath(); c.fill(); c.stroke();
  if(hair%3===1){ c.beginPath(); c.ellipse(x-face*30,hy0-6,8,14,face*.5,0,TAU); c.fill(); c.stroke(); }
  c.fillStyle=col; c.fillRect(x-27,hy0-16,54,5); // 頭帶
  if(blink){ c.strokeStyle=INK; c.lineWidth=2.5; for(const ex of [-9,9]){ c.beginPath(); c.moveTo(x+face*4+ex-5,hy0+2); c.lineTo(x+face*4+ex+5,hy0+2); c.stroke(); } }
  else for(const ex of [-9,9]){ c.fillStyle=INK; c.beginPath(); c.ellipse(x+face*4+ex,hy0+2,4.5,6,0,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(x+face*4+ex-1.5,hy0-.5,1.8,0,TAU); c.arc(x+face*4+ex+1.5,hy0+4,1,0,TAU); c.fill(); }
  c.fillStyle='rgba(255,110,140,.45)'; c.beginPath(); c.ellipse(x+face*4-17,hy0+11,5,3,0,0,TAU); c.ellipse(x+face*4+17,hy0+11,5,3,0,0,TAU); c.fill();
  c.strokeStyle=INK; c.lineWidth=2; c.beginPath(); c.arc(x+face*4-3,hy0+12,3,0,Math.PI); c.arc(x+face*4+3,hy0+12,3,0,Math.PI); c.stroke();
  if(label){ c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=4; c.strokeStyle='#14122b'; c.strokeText(label,x,hy0-44); c.fillStyle='#ffd23f'; c.fillText(label,x,hy0-44); }
}
function drawShuttle(c,s,t){ const a=Math.atan2(s.vy||1,s.vx||0); c.save(); c.translate(s.x,s.y); c.rotate(a); c.fillStyle='#fff'; c.strokeStyle='#8a8a9a'; c.lineWidth=1.2; c.beginPath(); c.moveTo(-2,-4); c.lineTo(-18,-9); c.lineTo(-18,9); c.lineTo(-2,4); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); for(let i=-1;i<=1;i++){ c.moveTo(-2,i*3); c.lineTo(-18,i*8); } c.stroke(); c.fillStyle='#d8302a'; c.fillRect(-15,-8,2.5,16); c.fillStyle='#f4ead8'; c.beginPath(); c.arc(1,0,5,0,TAU); c.fill(); c.stroke(); c.restore(); }

/* ---------- 球館 ---------- */
const BGC={};
function venueBg(v){ if(BGC[v]) return BGC[v]; const e=document.createElement('canvas'); e.width=W; e.height=H; const c=e.getContext('2d'),V=VENUES[v];
  if(V.in){ const g=c.createLinearGradient(0,0,0,GY); g.addColorStop(0,V.wall[1]); g.addColorStop(1,V.wall[0]); c.fillStyle=g; c.fillRect(0,0,W,GY);
    if(V.wood){ c.strokeStyle='rgba(0,0,0,.12)'; c.lineWidth=2; for(let y=10;y<GY;y+=22){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); } }
    // 天花板燈
    for(let i=0;i<5;i++){ const x=80+i*160; c.fillStyle='#ccc'; c.fillRect(x-30,6,60,8); const lg=c.createRadialGradient(x,14,2,x,14,90); lg.addColorStop(0,'rgba(255,255,230,.5)'); lg.addColorStop(1,'rgba(255,255,230,0)'); c.fillStyle=lg; c.fillRect(x-90,0,180,110); }
    // 看台＋觀眾
    c.fillStyle=V.night?'#1a1a2a':'#7a6a5a'; c.fillRect(0,170,W,110); for(let r=0;r<4;r++){ c.fillStyle=r%2?'rgba(0,0,0,.18)':'rgba(255,255,255,.06)'; c.fillRect(0,174+r*26,W,24); }
    // 布條
    c.fillStyle=V.ban; rr(c,250,110,300,40,8); c.fill(); c.fillStyle='#fff'; c.font='900 24px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(V.n,400,131);
    if(!V.night){ for(const wx of [40,640]){ c.fillStyle='#bfe4ff'; c.fillRect(wx,40,120,60); c.strokeStyle='#fff'; c.lineWidth=4; c.strokeRect(wx,40,120,60); c.beginPath(); c.moveTo(wx+60,40); c.lineTo(wx+60,100); c.stroke(); } } }
  else { const g=c.createLinearGradient(0,0,0,GY); g.addColorStop(0,V.sky[0]); g.addColorStop(1,V.sky[1]); c.fillStyle=g; c.fillRect(0,0,W,GY);
    c.fillStyle='rgba(255,255,255,.85)'; for(const [x,y,s] of [[120,60,1],[520,40,1.4],[700,90,.8]]){ c.beginPath(); c.arc(x,y,18*s,0,TAU); c.arc(x+20*s,y+5,14*s,0,TAU); c.arc(x-18*s,y+6,12*s,0,TAU); c.fill(); }
    if(V.sea){ c.fillStyle='#2f8ad0'; c.fillRect(0,230,W,60); c.fillStyle='#f2dc9a'; c.fillRect(0,290,W,GY-290); for(const px of [60,740]){ c.strokeStyle='#7a5a3a'; c.lineWidth=8; c.beginPath(); c.moveTo(px,300); c.quadraticCurveTo(px+10,230,px,170); c.stroke(); c.fillStyle='#3a9a4a'; for(let a=0;a<6;a++){ c.save(); c.translate(px,170); c.rotate(a*1.05); c.beginPath(); c.ellipse(26,0,28,7,.3,0,TAU); c.fill(); c.restore(); } } }
    if(V.tree){ c.fillStyle='#7ab86a'; c.beginPath(); c.moveTo(0,260); for(let x=0;x<=W;x+=40) c.lineTo(x,240+Math.sin(x*.02)*14); c.lineTo(W,GY); c.lineTo(0,GY); c.fill(); for(const tx of [60,180,620,740]){ c.fillStyle='#6a4a2a'; c.fillRect(tx-6,200,12,70); c.fillStyle='#3f8a3a'; c.beginPath(); c.arc(tx,190,34,0,TAU); c.fill(); } } }
  // 地板：木頭地板＋有透視的綠色球場（遠邊在 322、近邊在畫面底），球員站在 GY
  const FY=300; let fg=c.createLinearGradient(0,FY,0,H); fg.addColorStop(0,V.in?(V.wood?'#a8784a':'#c8a070'):shade(V.floor,.6)); fg.addColorStop(1,V.in?(V.wood?'#8a5a32':'#a8804a'):shade(V.floor,.45)); c.fillStyle=fg; c.fillRect(0,FY,W,H-FY);
  if(V.in){ c.strokeStyle='rgba(0,0,0,.08)'; c.lineWidth=1; for(let y=FY+8;y<H;y+=10+(y-FY)*.08){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); } }
  const top=322,bot=H+4,xl=y=>lerpX(BACK+40,BACK-6,(y-top)/(bot-top)),xr=y=>W-xl(y); function lerpX(a,b,u){ return a+(b-a)*u; }
  c.fillStyle=V.floor; c.beginPath(); c.moveTo(xl(top)-14,top-6); c.lineTo(xr(top)+14,top-6); c.lineTo(xr(bot)+20,bot); c.lineTo(xl(bot)-20,bot); c.closePath(); c.fill();
  c.strokeStyle='#fff'; c.lineWidth=3; c.beginPath(); c.moveTo(xl(top),top); c.lineTo(xr(top),top); c.lineTo(xr(bot),bot); c.moveTo(xl(top),top); c.lineTo(xl(bot),bot); c.moveTo(xl(top)+18,top); c.lineTo(xl(bot)+22,bot); c.moveTo(xr(top)-18,top); c.lineTo(xr(bot)-22,bot); c.stroke();
  c.lineWidth=2.5; c.beginPath(); for(const sx of [-1,1]){ const u=NETX+sx*118; c.moveTo(u+sx*(-4),top); c.lineTo(u+sx*6,bot); } c.moveTo(NETX,top); c.lineTo(NETX,bot); c.stroke();
  c.fillStyle='rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(NETX,GY+2,10,4,0,0,TAU); c.fill();
  return BGC[v]=e; }
function drawCrowd(c,v,t,excite){ const V=VENUES[v]; if(!V.in) return; const n=Math.round(60*V.crowd); for(let i=0;i<n;i++){ const x=(i*97)%W+8,row=i%4,y=196+row*26-(Math.sin(t*(4+excite*6)+i)>.6?3+excite*4:0); c.fillStyle=['#ff6b6b','#4f9dff','#ffd23f','#5fd068','#b98cff','#ff9d3d'][i%6]; c.beginPath(); c.arc(x,y,7,0,TAU); c.fill(); c.fillStyle='#ffe0c8'; c.beginPath(); c.arc(x,y-11,6,0,TAU); c.fill(); } }
function drawNet(c){ c.fillStyle='#3a3a44'; c.fillRect(NETX-3,NETTOP-6,6,GY-NETTOP+6); c.fillStyle='rgba(30,30,40,.55)'; c.fillRect(NETX-2,NETTOP,4,GY-NETTOP-40); c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=1; for(let y=NETTOP+6;y<GY-40;y+=7){ c.beginPath(); c.moveTo(NETX-3,y); c.lineTo(NETX+3,y); c.stroke(); } c.fillStyle='#fff'; c.fillRect(NETX-4,NETTOP-3,8,6); }

/* ---------- 遊戲 ---------- */
function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,two=!net&&opts.mode==='2p',me=net?Math.min(1,net.me):0,vsHuman=!!net&&net.count>1,solo=!net&&!two;
  const {ctx:c}=env.canvas2d(W,H),OPT=opts.options||{},si=clamp(opts.stage|0,0,LV-1),ST=STAGES[si];
  const GOAL=[11,15,21].includes(+OPT.win)?+OPT.win:11,CAP=GOAL+9;
  const k=solo||(net&&!vsHuman)?ST.k:1,AI={spd:140+120*k,react:.34-.22*k,err:250-205*k,smash:k<.12?0:.15+.55*k,drop:.1+.35*k,miss:.18*(1-k)};
  const mk=n=>({n,x:n?600:200,y:GY,vy:0,face:n?-1:1,sw:0,hitOK:false,moving:false,score:0,drop:false,tx:n?600:200,ty:GY,swv:0});
  const ps=[mk(0),mk(1)],sh={x:200,y:300,vx:0,vy:0,held:0,tx:200,ty:300},fx=[];
  const names=net?[net.names[0]||'玩家 1',vsHuman?(net.names[1]||'玩家 2'):ST.foe+'（電腦）']:two?['1P','2P']:[opts.name||'你',ST.foe+'（電腦）'];
  ps[0].look=(net?net.looks&&net.looks[0]:opts.look)||{color:'#ff5d6d',hair:0}; ps[1].look=(net&&vsHuman?net.looks&&net.looks[1]:two?null:null)||{color:ST.col,hair:ST.hair};
  if(ps[1].look.color===ps[0].look.color) ps[1].look=Object.assign({},ps[1].look,{color:ps[0].look.color==='#4f9dff'?'#5fd068':'#4f9dff'});
  let aiDec={n:-1},t=0,phase='serve',ptT=0,lastHit=-1,server=opts.first===1?1:0,lastW=-1,ended=false,overT=0,rally=0,best=0,shake=0,aiT=0,aiPred=null,aiReact=0,aiServeT=1.2,ev=[],sendT=0,msg='',msgT=0,introT=2.2;
  const rin={dx:0,jump:false,sw:false,drop:false};
  const sfx=n=>{ env.sfx(n); if(net&&net.host) ev.push(n); };
  function pop(txt,col,x,y){ fx.push({k:'txt',txt,col,x,y,t:0}); }
  function setServe(n){ server=n; phase='serve'; sh.held=n; lastHit=-1; rally=0; for(const p of ps){ p.x=p.n?600:200; p.y=GY; p.vy=0; p.sw=0; } aiServeT=1.1; aiPred=null; }
  setServe(server);
  // 輸入
  function keyIn(n){ const kk=env.keys; if(two){ if(n===0) return {dx:(kk.KeyD?1:0)-(kk.KeyA?1:0),jump:!!kk.KeyW,sw:env.hit('KeyF')||env.hit('Space'),drop:env.hit('KeyG')||(!!kk.KeyS&&env.hit('KeyF'))};
      return {dx:(kk.ArrowRight?1:0)-(kk.ArrowLeft?1:0),jump:!!kk.ArrowUp,sw:env.hit('Enter')||env.hit('NumpadEnter'),drop:env.hit('ShiftRight')||env.hit('Slash')}; }
    return {dx:(kk.ArrowRight||kk.KeyD?1:0)-(kk.ArrowLeft||kk.KeyA?1:0),jump:!!(kk.ArrowUp||kk.KeyW),sw:env.hit('Space')||env.hit('KeyJ')||env.hit('Enter'),drop:env.hit('KeyX')||env.hit('KeyK')||(!!(kk.ArrowDown||kk.KeyS)&&env.hit('Space'))}; }
  function inputOf(n,dt){ if(n===0) return keyIn(0); if(two) return keyIn(1); if(vsHuman){ const o={dx:rin.dx,jump:rin.jump,sw:rin.sw,drop:rin.drop}; rin.sw=rin.drop=false; return o; } return aiInput(dt); }
  // 電腦：預測球會在哪裡降到拍子高度，跑過去、反應一下再揮
  // 沿著球的路線找「最早跑得到、拍子打得到」的點（殺球一路往下，不能只看第一次掉到擊球高度的地方）
  function predict(){ const p=ps[1],s={x:sh.x,y:sh.y,vx:sh.vx,vy:sh.vy},sp=AI.spd; let last=null; for(let i=1;i<360;i++){ stepSh(s,1/60); if(s.y>=GY) break; if(s.x<=NETX+8) continue; last={x:s.x,y:s.y,t:i/60}; const sy=s.y,ok=sy>GY-150&&sy<GY-10; if(!ok) continue; const need=Math.max(0,Math.abs(s.x+22-p.x)-REACH*.5)/sp+AI.react; if(need<=i/60) return last; } return last||{x:s.x,y:s.y,t:0}; }
  function aiInput(dt){ const p=ps[1],o={dx:0,jump:false,sw:false,drop:false};
    if(phase==='serve'){ if(sh.held===1&&(aiServeT-=dt)<=0) o.sw=true; const d=600-p.x; o.dx=Math.abs(d)<6?0:Math.sign(d)*.6; return o; }
    if(phase!=='play') return o;
    const coming=sh.x>NETX-40||sh.vx>0;
    if(coming&&lastHit!==1){ if((aiT-=dt)<=0||!aiPred){ aiT=.1; aiPred=predict(); if(aiPred.x>NETX){ if(aiDec.n!==rally){ const ty=sh.type; aiDec={n:rally,whiff:Math.random()<(ty==='smash'?.45-.37*k:ty==='drive'?.24-.18*k:.16-.14*k)+(sh.weak?-.05:0),jmp:Math.random()<(sh.weak?Math.min(.95,AI.smash*1.7):AI.smash)}; } aiPred.off=(Math.random()<AI.miss?(Math.random()-.5)*120:0)+(Math.random()-.5)*14; } } }
    else { aiPred=null; aiReact=AI.react; }
    let tx=aiPred&&aiPred.x>NETX?aiPred.x+22+(aiPred.off||0):620; tx=clamp(tx,NETX+30,W-24); const d=tx-p.x; o.dx=Math.abs(d)<5?0:Math.sign(d)*Math.min(1,Math.abs(d)/30);
    if(sh.x>NETX) aiReact-=dt;
    const rx=p.x-22,dd=reachD(p,sh.x,sh.y);
    if(aiPred&&aiDec.jmp&&p.y>=GY&&sh.vy>0&&sh.x>NETX&&Math.abs(sh.x-rx)<70&&sh.y<GY-170&&sh.y>GY-250) o.jump=true;
    if(aiReact<=0&&lastHit!==1&&dd<REACH*.9&&!(aiDec.n===rally&&aiDec.whiff)) o.sw=true; return o; }
  // 擊球：依球的高度、位置自動選球路
  function shoot(p,dropKey){ const dir=p.n?-1:1,o=ps[1-p.n],R=Math.random,ai=!two&&!vsHuman&&p.n===1&&!net||(net&&!vsHuman&&p.n===1);
    const air=p.y<GY-12,high=sh.y<GY-150,nearNet=Math.abs(sh.x-NETX)<140; let type;
    if(dropKey) type='drop'; else if(air&&sh.y<p.y-70) type='smash'; else if(nearNet&&sh.y>NETTOP-30) type='net'; else if(sh.y>GY-95) type='lift'; else if(high) type='clear'; else type='drive';
    const oFar=Math.abs(o.x-NETX)/(NETX-BACK); /* 對手離網多遠：0 網前、1 底線 */
    if(ai&&(type==='clear'||type==='drive'||type==='lift')){ if(oFar>.62&&R()<AI.drop*1.6) type='drop'; else if(oFar<.4&&type!=='lift') type='clear'; }
    const oppBack=dir>0?W-BACK:BACK,oppNet=NETX+dir*40; let tx;
    if(type==='clear'||type==='lift') tx=oppBack-dir*(30+R()*70); else if(type==='drop'||type==='net') tx=NETX+dir*(55+R()*70); else if(type==='smash') tx=NETX+dir*(170+R()*170); else tx=NETX+dir*(200+R()*140);
    const stretch=reachD(p,sh.x,sh.y)/REACH; if(stretch>.78&&type!=='smash'){ type='lift'; tx=NETX+dir*(170+R()*120); p.weak=1; } /* 撲著接：回一顆軟軟的高球 */
    if(ai&&type==='smash') tx=oFar>.55?NETX+dir*(110+R()*90):oppBack-dir*(70+R()*80); /* 殺向對手不在的地方 */
    if(ai) tx+=(R()-.5)*AI.err;
    const ANG={clear:[48,56,64],lift:[62,70,76],drive:[10,18,26,36],drop:[24,34,46,58],net:[30,44,58,70],smash:[-22,-14,-6,4,14]}[type];
    let v=(p.weak?aimShot(sh.x,sh.y,tx,[42,50,58,66],dir):null)||(type==='smash'?aimFixed(sh.x,sh.y,tx,(ai?.8+.2*k:1)*(1000+480*clamp(1-Math.abs(sh.x-NETX)/(NETX-BACK),0,1)),dir,-40,20):type==='drive'?aimFixed(sh.x,sh.y,tx,ai?850+250*k:1050,dir,-8,28):null)||aimShot(sh.x,sh.y,tx,ANG,dir)||aimShot(sh.x,sh.y,oppBack-dir*80,[50,60,70,78],dir)||aimShot(sh.x,sh.y,NETX+dir*200,[60,70,80],dir)||{vx:dir*260,vy:-760};
    sh.vx=v.vx; sh.vy=v.vy; sh.type=type; sh.weak=!!p.weak; lastHit=p.n; if(rally++>=0) best=Math.max(best,rally);
    if(type==='smash'){ sfx('boom'); shake=.25; pop('殺球！','#ff5d8f',sh.x,sh.y-30); fx.push({k:'ring',x:sh.x,y:sh.y,t:0,col:'#ff5d8f'}); }
    else { sfx(type==='drop'||type==='net'?'pop':'place'); fx.push({k:'ring',x:sh.x,y:sh.y,t:0,col:'#fff'}); if(type==='drop'||type==='net') pop('吊球','#7af0ff',sh.x,sh.y-30); }
    sh.smash=type==='smash'?.5:0; sh.net=false; aiPred=null; if(p.weak){ p.weak=0; pop('好險！','#cfd2e8',sh.x,sh.y-30); } }
  function point(w,why){ ps[w].score++; lastW=w; phase='point'; ptT=1.4; msg=why; msgT=1.4; env.sfx(two||w===me||(!net&&w===0)?'item':'hurt'); if(net) ev.push('p'+w);
    const a=ps[0].score,b=ps[1].score,hi=Math.max(a,b),lo=Math.min(a,b); if((hi>=GOAL&&hi-lo>=2)||hi>=CAP){ phase='over'; overT=0; } }
  function conclude(a,b,note){ if(ended) return; ended=true; ps[0].score=a; ps[1].score=b; const w=a>b?0:1,mine=two||w===me;
    if(solo&&w===0){ const old=getRec(si); if(old==null||a-b>+old.split(':')[0]-+old.split(':')[1]) LS(recKey(si),a+':'+b); }
    env.sfx(mine?'win':'lose');
    env.end({title:two?(w?'2P':'1P')+' 獲勝！':mine?(solo?'贏了！過關':'你贏了！'):'輸了',big:a+' : '+b,text:(note?note+' ':'')+(solo?ST.name+'　對手：'+ST.foe+'。':'')+(best>2?'最長來回 '+best+' 拍。':''),score:solo&&w===0?si+1:null,next:solo&&w===0&&si<LV-1}); }
  // 連線
  function snap(){ const m={s:[r1(ps[0].x),r1(ps[0].y),r1(ps[0].sw),r1(ps[1].x),r1(ps[1].y),r1(ps[1].sw),r1(sh.x),r1(sh.y),r1(sh.vx),r1(sh.vy),ps[0].score,ps[1].score,sh.held,phase==='serve'?0:phase==='play'?1:2,lastW,rally],e:ev,m:msgT>0?msg:''}; ev=[]; return m; }
  if(net){ if(client) net.onmsg=m=>{ if(m.s){ const s=m.s; ps[0].tx=s[0]; ps[0].ty=s[1]; ps[0].sw=s[2]; ps[1].tx=s[3]; ps[1].ty=s[4]; ps[1].sw=s[5]; sh.tx=s[6]; sh.ty=s[7]; sh.vx=s[8]; sh.vy=s[9]; ps[0].score=s[10]; ps[1].score=s[11]; sh.held=s[12]; phase=['serve','play','point'][s[13]]; lastW=s[14]; rally=s[15];
        for(const n of m.e){ if(n==='p0'||n==='p1') env.sfx(+n[1]===me?'item':'hurt'); else env.sfx(n); } if(m.m){ msg=m.m; msgT=1.2; } } else if(m.end) conclude(m.end[0],m.end[1],m.end[2]); };
    else { net.onmsg=(m,from)=>{ if(from===1&&m.i){ rin.dx=m.i[0]; rin.jump=!!m.i[1]; if(m.i[2]) rin.sw=true; if(m.i[3]) rin.drop=true; } };
      net.onleave=i=>{ if(i===1&&!ended){ const a=Math.max(ps[0].score,ps[1].score+1); conclude(a,ps[1].score,'對手離開了。'); } }; } }
  function movePlayer(p,i,dt){ const sp=p.n===1&&!two&&!vsHuman?AI.spd:245; p.moving=!!i.dx; p.x+=i.dx*sp*dt; if(i.jump&&p.y>=GY){ p.vy=-560; sfx('land'); } p.vy+=1500*dt; p.y+=p.vy*dt; if(p.y>=GY){ p.y=GY; p.vy=0; }
    const lo=p.n?NETX+26:22,hi=p.n?W-22:NETX-26; p.x=clamp(p.x,lo,hi); if(i.sw||i.drop){ if(p.sw<=0){ p.sw=.28; p.hitOK=true; p.drop=!!i.drop; } } if(p.sw>0) p.sw-=dt; }
  let lastIn='';
  function update(dt){ t+=dt; if(introT>0) introT-=dt; if(shake>0) shake-=dt; if(msgT>0) msgT-=dt; for(const f of fx) f.t+=dt; for(let i=fx.length-1;i>=0;i--) if(fx[i].t>1) fx.splice(i,1);
    if(client){ const i=keyIn(0),key=''+i.dx+(+i.jump); sendT-=dt; if(key!==lastIn||i.sw||i.drop||sendT<=0){ lastIn=key; sendT=1/20; net.send({i:[i.dx,+i.jump,+i.sw,+i.drop]}); }
      const f=Math.min(1,dt*18); for(const p of ps){ p.moving=Math.abs(p.tx-p.x)>.8; p.x+=(p.tx-p.x)*f; p.y+=(p.ty-p.y)*f; } if(Math.hypot(sh.tx-sh.x,sh.ty-sh.y)>90){ sh.x=sh.tx; sh.y=sh.ty; } else { sh.x+=(sh.tx-sh.x)*f; sh.y+=(sh.ty-sh.y)*f; } return; }
    if(ended) return;
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/20; net.send(snap()); } }
    if(phase==='over'){ overT+=dt; if(overT>1.5){ const a=ps[0].score,b=ps[1].score; if(net){ net.send(snap()); net.send({end:[a,b,'']}); } conclude(a,b); } return; }
    for(const p of ps){ const i=inputOf(p.n,dt); movePlayer(p,i,dt); }
    if(phase==='point'){ ptT-=dt; sh.vx*=.9; if(sh.y<GY){ stepSh(sh,dt); if(sh.y>GY) sh.y=GY; } if(ptT<=0) setServe(lastW); return; }
    if(phase==='serve'){ const p=ps[sh.held]; sh.x=p.x+p.face*20; sh.y=p.y-62; sh.vx=p.face*10; sh.vy=10;
      if(p.sw>0&&p.hitOK&&introT<=0){ p.hitOK=false; const dir=p.face,aiS=p.n===1&&!two&&!vsHuman,shortS=aiS?Math.random()<.65*k:p.drop,tx=shortS?NETX+dir*(125+Math.random()*30):(dir>0?W-BACK-60:BACK+60)-dir*Math.random()*70; const v=(shortS?aimShot(sh.x,sh.y,tx,[18,24,30,38],dir):null)||aimShot(sh.x,sh.y,tx,[60,66,72],dir)||{vx:dir*600,vy:-700}; sh.type=shortS?'net':'clear'; sh.weak=false; sh.vx=v.vx; sh.vy=v.vy; lastHit=p.n; phase='play'; rally=0; sfx('place'); fx.push({k:'ring',x:sh.x,y:sh.y,t:0,col:'#fff'}); }
      return; }
    // 比賽中
    const n=Math.max(1,Math.ceil(dt*240)); for(let s=0;s<n;s++){ const px=sh.x; stepSh(sh,dt/n);
      if((px-NETX)*(sh.x-NETX)<=0&&sh.y>NETTOP){ sh.x=NETX-Math.sign(sh.vx||1)*5; sh.vx*=-.12; sh.vy=Math.max(0,sh.vy)*.3; sh.net=true; sfx('bump'); fx.push({k:'ring',x:NETX,y:sh.y,t:0,col:'#aaa'}); }
      for(const p of ps){ if(p.sw>.04&&p.hitOK&&lastHit!==p.n){ if(reachD(p,sh.x,sh.y)<REACH){ p.hitOK=false; shoot(p,p.drop); break; } } }
      if(sh.y>=GY){ sh.y=GY; const inside=sh.x>=BACK&&sh.x<=W-BACK,side=sh.x<NETX?0:1; let w;
        if(inside){ w=1-side; point(w,sh.net&&side===lastHit?'掛網':''); } else { w=1-lastHit; point(w,'出界！'); }
        fx.push({k:'dust',x:sh.x,y:GY,t:0}); break; } }
    if(sh.smash>0) sh.smash-=dt; }
  function draw(){ c.save(); if(shake>0) c.translate((Math.random()-.5)*8*shake*4,(Math.random()-.5)*6*shake*4);
    c.drawImage(venueBg(ST.v),0,0); drawCrowd(c,ST.v,t,phase==='point'?1:0); drawNet(c);
    // 落點提示（球往下掉時地上的小影子）
    if(phase==='play'){ const sz=clamp((GY-sh.y)/300,0,1); c.fillStyle='rgba(0,0,0,'+(.25-sz*.15)+')'; c.beginPath(); c.ellipse(sh.x,GY+2,6+sz*8,3,0,0,TAU); c.fill(); }
    ps.forEach(p=>drawPlayer(c,p.x,p.y,p.face,p.look.color,p.sw,p.y<GY-2,t,p.moving,p.look.hair|0,introT>0?(two?(p.n?'2P':'1P'):net?(p.n===me?'你':''):p.n===0?'你':''):''));
    if(sh.smash>0){ c.strokeStyle='rgba(255,93,143,.5)'; c.lineWidth=6; c.beginPath(); c.moveTo(sh.x,sh.y); c.lineTo(sh.x-sh.vx*.05,sh.y-sh.vy*.05); c.stroke(); }
    drawShuttle(c,sh,t);
    for(const f of fx){ const a=1-f.t; if(f.k==='ring'){ c.strokeStyle=f.col; c.globalAlpha=a; c.lineWidth=3; c.beginPath(); c.arc(f.x,f.y,8+f.t*40,0,TAU); c.stroke(); c.globalAlpha=1; }
      else if(f.k==='dust'){ c.fillStyle='rgba(255,255,255,'+a*.7+')'; for(let i=0;i<8;i++){ const an=Math.PI+i*Math.PI/7; c.beginPath(); c.arc(f.x+Math.cos(an)*f.t*40,f.y+Math.sin(an)*f.t*18,3,0,TAU); c.fill(); } }
      else if(f.k==='txt'){ c.globalAlpha=a; c.font='900 22px '+TC; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='#14122b'; c.strokeText(f.txt,f.x,f.y-f.t*30); c.fillStyle=f.col; c.fillText(f.txt,f.x,f.y-f.t*30); c.globalAlpha=1; } }
    c.restore();
    // 比分
    c.fillStyle='rgba(11,10,28,.78)'; rr(c,W/2-210,8,420,52,14); c.fill(); c.textAlign='center'; c.textBaseline='middle';
    c.font='900 16px '+TC; c.fillStyle=ps[0].look.color; c.fillText(names[0],W/2-130,24,150); c.fillStyle=ps[1].look.color; c.fillText(names[1],W/2+130,24,150);
    c.font='900 30px '+TC; c.fillStyle='#fff'; c.fillText(ps[0].score+'　:　'+ps[1].score,W/2,32); c.font='700 13px '+TC; c.fillStyle='#cfd2e8'; c.fillText('先拿 '+GOAL+' 分（要贏 2 分）',W/2,52);
    for(const p of ps) if(phase==='serve'&&sh.held===p.n){ c.fillStyle='#ffd23f'; c.font='900 14px '+TC; c.fillText('發球',p.n?W/2+130:W/2-130,48); }
    const a=ps[0].score,b=ps[1].score; if(phase!=='over'&&Math.max(a,b)>=GOAL-1&&Math.abs(a-b)>=1){ c.font='900 18px '+TC; c.lineWidth=4; c.strokeStyle='#14122b'; c.strokeText('賽末點！',W/2,82); c.fillStyle='#ff5d8f'; c.fillText('賽末點！',W/2,82); }
    if(rally>=4&&phase==='play'){ c.font='900 15px '+TC; c.fillStyle='#ffd23f'; c.fillText('來回 '+rally+' 拍',W/2,104); }
    if(msgT>0&&phase!=="serve"){ c.font='900 32px '+TC; c.lineWidth=6; c.strokeStyle='#14122b'; const w=lastW,txt=(two?(w?'2P':'1P'):w===me||(!net&&w===0)?'得分！':'失分')+'　'+msg; c.strokeText(txt,W/2,170); c.fillStyle='#ffd23f'; c.fillText(txt,W/2,170); }
    if(phase==='serve'&&introT<=0&&(sh.held===0&&!client||sh.held===me&&client||two)){ const tch=document.body.classList.contains('touch'); c.font='900 17px '+TC; c.fillStyle='rgba(11,10,28,.7)'; rr(c,W/2-150,190,300,34,17); c.fill(); c.fillStyle='#fff'; c.fillText(tch?'按「揮拍」發球':'按空白鍵發球',W/2,207); }
    if(introT>0&&solo){ c.font='900 30px '+TC; c.lineWidth=6; c.strokeStyle='#14122b'; c.strokeText('第 '+(si+1)+' 關　對手：'+ST.foe,W/2,150); c.fillStyle='#ffd23f'; c.fillText('第 '+(si+1)+' 關　對手：'+ST.foe,W/2,150); }
  }
  return {update,draw,destroy(){},_dbg:{ps,sh,get phase(){ return phase; },get aiDec(){ return aiDec; },get aiReact(){ return aiReact; },get rally(){ return rally; },get lastHit(){ return lastHit; },AI,shoot,predict}};
}

/* ---------- 開始畫面、造型、封面 ---------- */
function demo(c,v,t,col0,col1,foe){ c.drawImage(venueBg(v),0,0); drawCrowd(c,v,t,.3); drawNet(c);
  const T=2.4,u=(t%T)/T,dir=u<.5?1:-1,k=u<.5?u*2:(u-.5)*2,x0=dir>0?240:560,x1=dir>0?560:240,sx=x0+(x1-x0)*k,sy=GY-110-Math.sin(k*Math.PI)*190;
  drawPlayer(c,240,GY,1,col0,dir<0&&k>.85?.2:u<.08?.2:0,false,t,false,0,''); drawPlayer(c,560,GY,-1,col1,dir>0&&k>.85?.2:u>.5&&u<.58?.2:0,false,t,false,1,foe||'');
  drawShuttle(c,{x:sx,y:sy,vx:dir*300,vy:Math.cos(k*Math.PI)*-300},t); }
function stageShow(c,w,h,si,t){ const S=STAGES[si]; c.save(); c.scale(w/W,h/H); demo(c,S.v,t,'#ff5d6d',S.col,S.foe); c.fillStyle='rgba(11,10,28,.72)'; rr(c,W/2-190,10,380,44,14); c.fill(); c.fillStyle='#ffd23f'; c.font='900 22px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(S.name+'　對手 '+S.foe,W/2,33,360); c.restore(); }
function preview(c,w,h,L,t){ L=Object.assign({color:'#ff5d6d',hair:0},L||{}); c.save(); c.scale(w/W,h/H); c.drawImage(venueBg(0),0,0); drawPlayer(c,W/2,GY,1,L.color,(t%1.6)<.28?.28-(t%1.6):0,false,t,false,+L.hair||0,''); c.restore(); }
function thumb(c,w,h,t){ c.save(); c.scale(w/W,h/H); demo(c,6,t,'#ff5d6d','#4f9dff',''); c.font='900 54px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=10; c.strokeStyle='#14122b'; c.strokeText('羽球對決',W/2,90); c.fillStyle='#ffd23f'; c.fillText('羽球對決',W/2,90); c.restore(); }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).badminton={
  name:'羽球對決',tag:'SHUTTLE DUEL',color:'#5fd068',online:true,maxPlayers:2,
  coin:o=>({verb:'先發球',names:o.net?[o.net.names[0]||'玩家 1',o.net.count>1?(o.net.names[1]||'玩家 2'):'電腦']:o.mode==='2p'?['1P','2P']:['你','電腦']}),
  desc:'一對一打羽球！揮拍會自動判斷高遠球、平抽、挑球，跳起來揮就是殺球，也能輕輕吊網前。單人 200 關一關一關挑戰對手，也能兩人同一台或連線對打。',
  goal:'球落在對方界內就得 1 分（打出界算對方得分），先拿到開始前選的分數、而且領先 2 分就贏。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  options:[{key:'win',label:'打幾分',def:'11',opts:[{id:'11',label:'11 分'},{id:'15',label:'15 分'},{id:'21',label:'21 分（正式）'}]}],
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  stageGoal:i=>{ const S=STAGES[i]; return '第 '+(i+1)+' 關・'+S.name+'：打贏 '+S.foe+'。'+(i<10?'對手動作慢、常常打出界，先熟悉揮拍和跑位。':i<60?'對手開始會吊網前，記得往前跑。':i<130?'對手會跳殺，退後一點等球。':'高手對決：殺球又快又準。'); },
  stageLocked:i=>i>0&&getRec(i-1)==null,stageBest:i=>{ const v=getRec(i); return v?'✓ '+v.replace(':',' : '):''; },
  hubBest:()=>{ let n=0; for(let i=0;i<LV;i++) if(getRec(i)!=null) n++; return n?'過關 <b>'+n+' / '+LV+'</b>':'尚無紀錄'; },
  help:[['← →','移動'],['↑','跳起來（在空中揮拍＝殺球）'],['空白鍵','揮拍：自動打高遠球、平抽或挑球'],['X','吊球：輕輕吊過網']],
  touchHelp:[['◀ ▶','移動'],['跳','跳起來，空中揮拍＝殺球'],['揮拍','自動判斷怎麼打'],['吊球','輕輕吊過網']],
  touch:{left:[{l:'◀',c:'ArrowLeft'},{l:'▶',c:'ArrowRight'}],right:[{l:'跳',c:'ArrowUp'},{l:'吊球',c:'KeyX'},{l:'揮拍',c:'Space',act:true}]},
  looks:[{key:'color',label:'球衣顏色',type:'color',opts:['#ff5d6d','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#b98cff','#ff7eb6']},{key:'hair',label:'髮型',opts:[{id:'0',label:'短髮'},{id:'1',label:'馬尾'},{id:'2',label:'捲毛'}]}],
  best:{label:'過關',fmt:v=>v+' 關',lower:false},
  stageShow,preview,thumb,create,_sim:{stepSh,simLand,aimShot,STAGES}};
})();
