// 經典小遊戲合集：把桌面小遊戲（踩地雷、彈珠台、五子棋、貪食蛇、打殭屍、恐龍跳躍、數字拼圖）放進遊戲區。
// 每款都是獨立網頁（classic/*.html），選哪一關就把那一款嵌進遊戲畫面；離開時移除。
(function(){
'use strict';
const TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2;
const LS=k=>{ try{ return localStorage.getItem(k); }catch(e){ return null; } };
const GAMES=[
  {f:'minesweeper',n:'踩地雷',stars:2,goal:'翻開所有沒有地雷的格子。數字是周圍 8 格的地雷數。',best:()=>{ const b=['easy','mid','hard'].map(k=>+LS('mine-best-'+k)).filter(Boolean); return b.length?'最佳 '+Math.min(...b)+' 秒':''; },
    help:[['左鍵','翻開格子'],['右鍵','插旗／拔旗'],['F2','重新開始']],touch:[['點一下','翻開格子'],['長按','插旗／拔旗']]},
  {f:'pinball',n:'彈珠台',stars:2,goal:'用擋板把球打回去，撞到彈簧和目標得分，球掉下去就少一顆。',best:()=>LS('pinball-best')>0?'最高 '+LS('pinball-best')+' 分':'',
    help:[['← →','左右擋板（Z ／ 也可以）'],['空白鍵','按住蓄力、放開發射']],touch:[['點左半邊／右半邊','左右擋板'],['按住再放開','發射球']]},
  {f:'gomoku',n:'五子棋',stars:2,goal:'兩個人輪流下，先把五顆棋子連成一直線（橫、直、斜都可以）的贏。',best:()=>'',
    help:[['滑鼠','點棋盤下子（兩人輪流）']],touch:[['點一下','下子（兩人輪流）']]},
  {f:'snake',n:'貪食蛇',stars:1,goal:'吃到食物會變長，撞到牆或自己就結束，越吃越快。',best:()=>LS('snake-best')>0?'最高 '+LS('snake-best')+' 分':'',
    help:[['方向鍵 ／ WASD','轉向'],['空白鍵','暫停']],touch:[['手指滑動','往滑的方向轉']]},
  {f:'zombie',n:'打殭屍',stars:3,goal:'在草地種植物守住 5 條路，別讓殭屍走到最左邊；每排有一台除草機救急。',best:()=>LS('zombie-td-best')>0?'最高 '+LS('zombie-td-best')+' 分':'',
    help:[['滑鼠','點卡片再點草地種下'],['1～4','選植物'],['空白鍵','暫停']],touch:[['點卡片','選植物'],['點草地','種下（陽光點一下收集）']]},
  {f:'dino',n:'恐龍跳躍',stars:1,goal:'跳過仙人掌、蹲下躲翼龍，跑越遠分數越高。',best:()=>LS('dino-best')>0?'最高 '+LS('dino-best')+' 分':'',
    help:[['空白鍵 ／ ↑','跳躍'],['↓','蹲下']],touch:[['點一下畫面','跳躍']]},
  {f:'puzzle15',n:'數字拼圖',stars:2,goal:'把 1 到 15 按順序排好、空格在右下角就完成，步數越少越好。',best:()=>LS('puzzle15-best')>0?'最少 '+LS('puzzle15-best')+' 步':'',
    help:[['滑鼠','點空格旁邊的方塊滑動'],['方向鍵','移動方塊']],touch:[['點方塊','滑到空格']]}];
// 關卡圖（還沒截圖時用）：每款畫一張簡單的示意
function art(c,w,h,i,t){ c.save(); c.scale(w/480,h/270); const g=GAMES[i];
  const bg=['#008080','#1a1440','#d8a860','#10200f','#3a7a2a','#f4f4f4','#2a3a5a'][i]; c.fillStyle=bg; c.fillRect(0,0,480,270);
  if(i===0){ for(let y=0;y<8;y++) for(let x=0;x<12;x++){ const X=96+x*24,Y=40+y*24,o=(x*7+y*3)%5<3; c.fillStyle=o?'#c0c0c0':'#d0d0d0'; c.fillRect(X,Y,23,23); if(o){ c.fillStyle='#fff'; c.fillRect(X,Y,23,3); c.fillRect(X,Y,3,23); } else if((x+y)%4===1){ c.fillStyle=['#00f','#080','#f00'][(x+y)%3]; c.font='bold 16px Arial'; c.textAlign='center'; c.fillText(''+(1+(x+y)%3),X+12,Y+18); } } }
  if(i===1){ c.strokeStyle='#ff7eb6'; c.lineWidth=4; c.strokeRect(150,20,180,240); for(const [x,y,r] of [[200,80,16],[280,90,16],[240,140,18]]){ c.fillStyle='#ffd23f'; c.beginPath(); c.arc(x,y,r,0,TAU); c.fill(); } c.fillStyle='#e8e8f0'; c.beginPath(); c.arc(240+Math.sin(t*2)*60,200-Math.abs(Math.sin(t*3))*120,7,0,TAU); c.fill(); c.fillStyle='#3ddbd9'; c.save(); c.translate(200,240); c.rotate(-.3+Math.sin(t*5)*.2); c.fillRect(0,-4,36,8); c.restore(); c.save(); c.translate(280,240); c.rotate(Math.PI+.3-Math.sin(t*5)*.2); c.fillRect(0,-4,36,8); c.restore(); }
  if(i===2){ c.strokeStyle='#5a3a1a'; c.lineWidth=1; for(let k=0;k<11;k++){ c.beginPath(); c.moveTo(140+k*20,35); c.lineTo(140+k*20,235); c.stroke(); c.beginPath(); c.moveTo(140,35+k*20); c.lineTo(340,35+k*20); c.stroke(); } [[4,4],[5,5],[6,4],[5,4],[4,5],[6,6],[3,3]].forEach(([x,y],k)=>{ c.fillStyle=k%2?'#fff':'#14122b'; c.beginPath(); c.arc(140+x*20,35+y*20,8,0,TAU); c.fill(); }); }
  if(i===3){ c.fillStyle='#3ed16a'; const n=12; for(let k=0;k<n;k++){ const x=120+((k+Math.floor(t*6))%20)*12; c.fillRect(Math.min(x,360),130,11,11); } c.fillStyle='#ff4d4d'; c.beginPath(); c.arc(380,136,6,0,TAU); c.fill(); }
  if(i===4){ for(let r=0;r<5;r++){ c.fillStyle=r%2?'#4a9a3a':'#5aaa48'; c.fillRect(0,20+r*48,480,48); } for(let r=0;r<5;r++){ c.fillStyle='#2f8a2f'; c.beginPath(); c.arc(80,44+r*48,14,0,TAU); c.fill(); c.fillStyle='#8aa080'; c.fillRect(380-((t*20+r*40)%200),28+r*48,18,34); } }
  if(i===5){ c.fillStyle='#535353'; c.fillRect(0,200,480,2); const jy=Math.max(0,Math.sin(t*3))*60; c.fillRect(110,160-jy,30,40); c.fillRect(132,150-jy,22,16); for(let k=0;k<3;k++){ const x=480-((t*140+k*190)%560); c.fillRect(x,170,10,30); c.fillRect(x-8,178,8,4); } }
  if(i===6){ const N=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,0]; N.forEach((n,k)=>{ if(!n) return; const x=170+(k%4)*36,y=55+Math.floor(k/4)*36; c.fillStyle='#ffd23f'; c.fillRect(x,y,33,33); c.fillStyle='#14122b'; c.font='bold 16px Arial'; c.textAlign='center'; c.fillText(n,x+16,y+22); }); }
  c.font='900 22px '+TC; c.textAlign='center'; c.lineWidth=6; c.strokeStyle='#14122b'; c.strokeText(g.n,240,262); c.fillStyle='#fff'; c.fillText(g.n,240,262); c.restore(); }
/* 七款原本各自一種配色：嵌進來時套上遊戲區的外觀（深紫背景、霓虹格線、金框圓角、按鈕同一種樣式） */
const THEME_CSS=`html,body{background:radial-gradient(ellipse at 50% -10%,#3a2470 0%,#140c34 55%,#07051a 100%) fixed!important;color:#f0ecff!important;font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif!important}
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(150,120,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(150,120,255,.08) 1px,transparent 1px);background-size:34px 34px;-webkit-mask-image:linear-gradient(transparent,#000 40%,#000 70%,transparent);mask-image:linear-gradient(transparent,#000 40%,#000 70%,transparent)}
#top,#hud{position:relative;z-index:1;background:rgba(20,14,48,.88)!important;border:2px solid rgba(255,210,63,.4);border-radius:14px;padding:6px 14px!important;margin:8px auto 8px!important;box-shadow:0 4px 18px rgba(0,0,0,.45);color:#f0ecff!important}
#top button,#hud button{background:#2b2560!important;color:#fff!important;border:2px solid #ffd23f!important;border-radius:10px!important;font-weight:900!important;padding:4px 12px!important;cursor:pointer;font-family:inherit!important}
#top button:hover,#hud button:hover{background:#ffd23f!important;color:#14122b!important}
body>canvas,#win,#mid>#board{position:relative;z-index:1;border-radius:12px;box-shadow:0 0 0 3px rgba(255,210,63,.4),0 0 24px rgba(160,120,255,.35),0 12px 30px rgba(0,0,0,.6)}
#tip{position:relative;z-index:1;color:#cfc8ff!important}`;
function theme(d){ if(!d||d.getElementById('arcTheme')) return; const st=d.createElement('style'); st.id='arcTheme'; st.textContent=THEME_CSS; (d.head||d.documentElement).appendChild(st); }
function create(env,opts){ const si=Math.max(0,Math.min(GAMES.length-1,opts.stage|0)),G=GAMES[si],{ctx:c}=env.canvas2d(480,270);
  c.fillStyle='#0b0a1c'; c.fillRect(0,0,480,270);
  if(opts.preview){ let t=0; return {update(dt){ t+=dt; if(t>30) env.end({}); },draw(){ art(c,480,270,si,t); },destroy(){}}; }
  const fr=document.createElement('iframe'); fr.title=G.n; fr.src='classic/'+G.f+'.html'+(window.ARCADE_V?'?v='+window.ARCADE_V:''); fr.setAttribute('allow','autoplay');
  fr.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:0;display:block;z-index:3;background:#0b0a1c';
  env.stage.appendChild(fr); const focus=()=>{ try{ fr.contentWindow.focus(); }catch(e){} };
  fr.addEventListener('load',()=>{ focus(); try{ const d=fr.contentDocument; d.addEventListener('pointerdown',focus); theme(d); }catch(e){} });
  let t=0; return {update(dt){ t+=dt; },draw(){},destroy(){ fr.remove(); },_dbg:{fr,G}}; }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).classic={name:'經典小遊戲合集',tag:'CLASSIC PACK',color:'#3ddbd9',
  desc:'以前電腦裡的經典小遊戲一次收齊：踩地雷、彈珠台、五子棋、貪食蛇、打殭屍、恐龍跳躍、數字拼圖。選一款就能玩，紀錄會自動保存。',
  goal:'每款玩法不同，左邊選好遊戲就能開始；玩完按「回到遊戲區大廳」離開。',
  stages:GAMES.map(g=>g.n),stars:GAMES.map(g=>g.stars),stageLabel:'選擇遊戲',
  stageGoal:i=>GAMES[i].goal,
  stageHelp:i=>({help:GAMES[i].help,touchHelp:GAMES[i].touch}),
  help:GAMES[0].help,touchHelp:GAMES[0].touch,
  hubBest:()=>{ const b=GAMES.map(g=>g.best()).filter(Boolean).length; return b?'玩過 <b>'+b+' / '+GAMES.length+'</b> 款':'尚無紀錄'; },
  stageBest:i=>GAMES[i].best(),
  livePreview:false,stageShow:(c,w,h,i,t)=>art(c,w,h,i,t),thumb:(c,w,h,t)=>art(c,w,h,Math.floor(t/4)%GAMES.length,t),create};
})();
