// 比手畫腳：大家用一台，分兩隊輪流。表演的人看題目卡，只能用動作（不能說話、不能發出聲音、不能用嘴型）讓隊友猜。
// 猜中按「答對」，太難按「跳過」。預設每輪 5 題不限時，也可以改成限時 60／90 秒。輪完設定的輪數，答對最多的隊伍贏。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const BANK=[
  ['動物','貓咪 小狗 大象 長頸鹿 猴子 袋鼠 企鵝 青蛙 蛇 老虎 兔子 烏龜 螃蟹 章魚 老鷹 公雞 豬 熊 獅子 鱷魚 蝴蝶 蚊子 魚 馬 綿羊 無尾熊 海豚 松鼠 貓頭鷹 蜘蛛'],
  ['職業','醫生 警察 消防員 老師 廚師 司機 理髮師 記者 魔術師 指揮家 歌手 舞者 拳擊手 郵差 清潔員 牙醫 攝影師 畫家 太空人 飛行員 外送員 店員 農夫 漁夫 木匠 主播 魔術師助手 健身教練 守門員 交通警察'],
  ['日常動作','刷牙 洗臉 洗澡 化妝 刮鬍子 穿襪子 綁鞋帶 打哈欠 伸懶腰 打噴嚏 擤鼻涕 寫字 打字 滑手機 自拍 拍照 煮麵 切菜 炒菜 洗碗 掃地 拖地 晾衣服 開車 騎腳踏車 搭捷運 排隊 打電話 吹頭髮 照鏡子'],
  ['運動','游泳 跑步 打籃球 踢足球 打棒球 打桌球 打網球 打羽球 跳繩 跳高 跳遠 射箭 拳擊 舉重 衝浪 滑雪 溜冰 騎馬 划船 爬山 打保齡球 打高爾夫 柔道 瑜伽 體操 擊劍 投籃 扣殺 跨欄 丟鉛球'],
  ['食物','珍珠奶茶 牛肉麵 臭豆腐 雞排 小籠包 刈包 滷肉飯 蚵仔煎 冰淇淋 西瓜 香蕉 鳳梨 甘蔗 玉米 棉花糖 爆米花 漢堡 披薩 壽司 火鍋 烤肉 泡麵 粽子 月餅 湯圓 豆花 糖葫蘆 剝蝦 吃麵 啃雞腿'],
  ['綜合挑戰','放風箏 吹泡泡 放煙火 盪鞦韆 溜滑梯 拔河 捉迷藏 跳舞 唱 KTV 彈鋼琴 拉小提琴 打鼓 釣魚 撐傘 搭帳篷 堆雪人 打雪仗 看電影 坐雲霄飛車 打麻將 下象棋 抓娃娃 套圈圈 撈金魚 拜拜 放天燈 划龍舟 搶紅包 走紅毯 求婚']];
const STAGES=BANK.map(b=>b[0]),TEAMC=['#ff5d6d','#4f9dff'],TEAMN=['紅隊','藍隊'];
function bg(c,t,col){ const g=c.createRadialGradient(W/2,H*.4,40,W/2,H/2,W*.75); g.addColorStop(0,'#3a2470'); g.addColorStop(1,'#0b0a1c'); c.fillStyle=g; c.fillRect(0,0,W,H);
  c.save(); c.globalAlpha=.12; for(let i=0;i<10;i++){ const a=t*.25+i*TAU/10; c.fillStyle=i%2?col:'#ffd23f'; c.beginPath(); c.moveTo(W/2,H+40); c.lineTo(W/2+Math.cos(a)*900,H+40+Math.sin(a)*900); c.lineTo(W/2+Math.cos(a+.18)*900,H+40+Math.sin(a+.18)*900); c.closePath(); c.fill(); } c.restore();
  // 舞台布幕
  for(const s of [-1,1]){ const x0=s<0?0:W; const g2=c.createLinearGradient(x0,0,x0-s*90,0); g2.addColorStop(0,'#7a0e1a'); g2.addColorStop(1,'#c8202e'); c.fillStyle=g2; c.beginPath(); c.moveTo(x0,0); c.lineTo(x0-s*96,0); for(let y=0;y<=H;y+=40) c.quadraticCurveTo(x0-s*(70+Math.sin(y*.05+t)*6),y+20,x0-s*(84+Math.sin(y*.04)*8),y+40); c.lineTo(x0,H); c.closePath(); c.fill(); }
  c.fillStyle='#a8141c'; c.fillRect(0,0,W,22); for(let i=0;i<20;i++){ c.fillStyle='#c8202e'; c.beginPath(); c.arc(i*42+21,22,21,0,Math.PI); c.fill(); } }
// 表演小人（剪影）：依時間換姿勢，示意「用動作表演」
function mime(c,x,y,s,t,col){ const ph=Math.floor(t*1.2)%4,a=[[-1.2,1.2],[-.3,-2.4],[-2.4,.4],[.6,-.6]][ph]; c.save(); c.translate(x,y); c.scale(s,s); c.strokeStyle=col; c.fillStyle=col; c.lineWidth=7; c.lineCap='round';
  c.beginPath(); c.arc(0,-78,14,0,TAU); c.fill(); c.beginPath(); c.moveTo(0,-62); c.lineTo(0,-20); c.moveTo(0,-20); c.lineTo(-14,14); c.moveTo(0,-20); c.lineTo(14,14);
  c.moveTo(0,-54); c.lineTo(Math.cos(a[0]-1.57)*30,-54+Math.sin(a[0]-1.57)*30); c.moveTo(0,-54); c.lineTo(Math.cos(a[1]-1.57)*30,-54+Math.sin(a[1]-1.57)*30); c.stroke();
  c.fillStyle='#fff'; c.font='900 16px '+TC; c.textAlign='center'; c.fillText('🤐',22,-92); c.restore(); }
function create(env,opts){ const OP=opts.options||{},si=clamp(opts.stage|0,0,BANK.length-1),{ctx:c,canvas}=env.canvas2d(W,H);
  const ROUNDS=clamp(+OP.rounds||3,1,6),TIME=OP.time==='60'?60:OP.time==='90'?90:OP.time==='120'?120:0,PERTURN=5;
  let pool=BANK[si][1].split(' ').sort(()=>Math.random()-.5),pi=0;
  const next=()=>{ if(pi>=pool.length){ pool.sort(()=>Math.random()-.5); pi=0; } return pool[pi++]; };
  let t=0,ph='ready',team=0,round=1,score=[0,0],word='',left=0,timeT=0,done=[],flip=0,conf=[],btns=[],ended=false,flash=0,flashC='#86dc4f',lastTick=-1;
  function startTurn(){ ph='play'; done=[]; left=PERTURN; timeT=TIME; word=next(); flip=0; env.sfx('go'); }
  function mark(ok){ if(ph!=='play') return; done.push([word,ok]); if(ok){ score[team]++; env.sfx('item'); flash=.35; flashC='#86dc4f'; for(let i=0;i<40;i++) conf.push({x:W/2,y:200,vx:(Math.random()-.5)*600,vy:-200-Math.random()*300,c:['#ffd23f','#ff5d8f','#5fd068','#4f9dff'][i%4],t:0,r:Math.random()*6}); } else { env.sfx('bump'); flash=.25; flashC='#cfc8ff'; }
    if(!TIME){ left--; if(left<=0){ endTurn(); return; } } word=next(); flip=0; }
  function endTurn(){ ph='sum'; env.sfx('lap'); }
  function after(){ if(team===1){ if(round>=ROUNDS){ finish(); return; } round++; } team=1-team; ph='ready'; }
  function finish(){ if(ended) return; ended=true; ph='over'; const w=score[0]===score[1]?-1:score[0]>score[1]?0:1; env.sfx('win');
    env.end({title:w<0?'平手！兩隊一樣厲害':TEAMN[w]+' 獲勝！',big:score[0]+' : '+score[1],text:'題庫「'+BANK[si][0]+'」，每隊 '+ROUNDS+' 輪。',score:null,next:false}); }
  function key(){ if(ph==='ready'&&(env.hit('Space')||env.hit('Enter'))) startTurn(); else if(ph==='play'){ if(env.hit('Space')||env.hit('Enter')||env.hit('ArrowRight')) mark(true); else if(env.hit('KeyX')||env.hit('ArrowLeft')) mark(false); } else if(ph==='sum'&&(env.hit('Space')||env.hit('Enter'))) after(); }
  function update(dt){ t+=dt; if(flash>0) flash-=dt; flip=Math.min(1,flip+dt*3.5); for(const p of conf){ p.t+=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=700*dt; } conf=conf.filter(p=>p.t<1.6);
    if(opts.preview) return; key();
    if(ph==='play'&&TIME){ timeT-=dt; const s=Math.ceil(timeT); if(s<=5&&s!==lastTick&&s>0){ lastTick=s; env.sfx('beep'); } if(timeT<=0) endTurn(); } }
  const toLogical=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=(r.width-W*s)/2,oy=(r.height-H*s)/2; return [(e.clientX-r.left-ox)/s,(e.clientY-r.top-oy)/s]; };
  const onDown=e=>{ e.preventDefault(); const [x,y]=toLogical(e); for(const b of btns) if(x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h){ env.sfx('click'); b.fn(); return; } };
  canvas.addEventListener('pointerdown',onDown); canvas.style.touchAction='none';
  function button(label,x,y,w,h,col,fn,sub){ btns.push({x,y,w,h,fn}); c.fillStyle='rgba(0,0,0,.35)'; rr(c,x+3,y+5,w,h,16); c.fill(); c.fillStyle=col; rr(c,x,y,w,h,16); c.fill(); c.fillStyle='rgba(255,255,255,.25)'; rr(c,x+4,y+4,w-8,h*.4,12); c.fill();
    c.fillStyle='#fff'; c.font='900 24px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=4; c.strokeStyle='rgba(0,0,0,.25)'; c.strokeText(label,x+w/2,y+h/2-(sub?7:0)); c.fillText(label,x+w/2,y+h/2-(sub?7:0)); if(sub){ c.font='700 12px '+TC; c.fillText(sub,x+w/2,y+h/2+16); } }
  function scoreBoard(){ for(const tm of [0,1]){ const x=tm?W-250:110; c.fillStyle='rgba(11,10,28,.8)'; rr(c,x,32,140,54,14); c.fill(); c.strokeStyle=TEAMC[tm]; c.lineWidth=team===tm&&ph!=='over'?4:1.5; c.stroke();
      c.fillStyle=TEAMC[tm]; c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(TEAMN[tm],x+70,48); c.fillStyle='#fff'; c.font='900 24px '+TC; c.fillText(score[tm]+' 題',x+70,72); }
    c.fillStyle='#ffe8a0'; c.font='900 14px '+TC; c.textAlign='center'; c.fillText('第 '+round+' / '+ROUNDS+' 輪・'+BANK[si][0],W/2,52); }
  function draw(){ btns=[]; c.save(); bg(c,t,TEAMC[team]); scoreBoard(); c.textAlign='center'; c.textBaseline='middle';
    if(ph==='ready'){ mime(c,W/2-210,330,1.4,t,TEAMC[team]); c.fillStyle='#fff'; c.font='900 34px '+TC; c.fillText('輪到 '+TEAMN[team]+' 表演！',W/2+40,170); c.fillStyle='#ffe8c8'; c.font='700 16px '+TC;
      c.fillText('請一位隊員拿著螢幕當表演者，別讓隊友看到題目',W/2+40,214,520); c.fillText('只能比動作：不能說話、不能發出聲音、不能用嘴型',W/2+40,240,520); c.fillText(TIME?'限時 '+TIME+' 秒，能猜幾題算幾題':'這一輪 '+PERTURN+' 題，慢慢來不限時',W/2+40,266,520);
      button('開始表演',W/2-60,320,200,70,TEAMC[team],startTurn,env.touch?'':'空白鍵'); }
    else if(ph==='play'){ const sc=Math.abs(Math.cos(flip*Math.PI/2*0+0)),k=Math.min(1,flip*1.3),cw=440,ch=200,cx=W/2,cy=220;
      c.save(); c.translate(cx,cy); c.scale(Math.max(.05,Math.sin(k*Math.PI/2)),1); c.rotate(Math.sin(t*1.6)*.01);
      c.fillStyle='rgba(0,0,0,.35)'; rr(c,-cw/2+6,-ch/2+10,cw,ch,24); c.fill(); const g=c.createLinearGradient(0,-ch/2,0,ch/2); g.addColorStop(0,'#fffdf4'); g.addColorStop(1,'#f4e8c8'); c.fillStyle=g; rr(c,-cw/2,-ch/2,cw,ch,24); c.fill(); c.strokeStyle=TEAMC[team]; c.lineWidth=6; rr(c,-cw/2+8,-ch/2+8,cw-16,ch-16,18); c.stroke();
      c.fillStyle='#8a6a40'; c.font='900 16px '+TC; c.fillText(BANK[si][0],0,-ch/2+34); c.fillStyle='#14122b'; c.font='900 '+(word.length>5?44:58)+'px '+TC; c.fillText(word,0,12,cw-40); c.restore();
      c.fillStyle='#fff'; c.font='900 20px '+TC; c.fillText(TIME?'剩 '+Math.max(0,Math.ceil(timeT))+' 秒':'第 '+(PERTURN-left+1)+' / '+PERTURN+' 題',W/2,346);
      if(TIME){ c.fillStyle='rgba(255,255,255,.2)'; rr(c,W/2-200,362,400,10,5); c.fill(); c.fillStyle=timeT<10?'#ff5d6d':'#ffd23f'; rr(c,W/2-200,362,400*clamp(timeT/TIME,0,1),10,5); c.fill(); }
      button('跳過',W/2-260,392,200,72,'#6a6aa0',()=>mark(false),env.touch?'':'X 或 ←'); button('答對！',W/2+60,392,200,72,'#3aa84a',()=>mark(true),env.touch?'':'空白鍵或 →'); }
    else if(ph==='sum'){ c.fillStyle='rgba(11,10,28,.82)'; rr(c,W/2-220,104,440,290,20); c.fill(); c.fillStyle='#ffd23f'; c.font='900 24px '+TC; c.fillText(TEAMN[team]+' 這一輪答對 '+done.filter(d=>d[1]).length+' 題',W/2,134);
      done.slice(0,12).forEach(([w,ok],i)=>{ const x=W/2-110+(i%2)*220,y=172+Math.floor(i/2)*32; c.fillStyle=ok?'#86dc4f':'#9a98b0'; c.font='900 17px '+TC; c.fillText((ok?'✔ ':'✘ ')+w,x,y,140); });
      button(team===1&&round>=ROUNDS?'看結果':'換 '+TEAMN[1-team],W/2-110,404,220,64,TEAMC[1-team],after,env.touch?'':'空白鍵'); }
    if(flash>0){ c.fillStyle=flashC; c.globalAlpha=flash*.5; c.fillRect(0,0,W,H); c.globalAlpha=1; }
    for(const p of conf){ c.save(); c.translate(p.x,p.y); c.rotate(p.r+p.t*8); c.fillStyle=p.c; c.globalAlpha=1-p.t/1.6; c.fillRect(-5,-3,10,6); c.restore(); }
    c.restore(); }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',onDown); },_dbg:{get ph(){return ph;},mark,startTurn,after,get score(){return score;}}}; }
function stageShow(c,w,h,si,t){ c.save(); c.scale(w/W,h/H); bg(c,t,'#ff5d6d'); mime(c,W/2-150,380,1.6,t,'#ffd23f');
  c.fillStyle='#fffdf4'; rr(c,W/2-40,150,300,140,20); c.fill(); c.fillStyle='#8a6a40'; c.font='900 18px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(BANK[si][0],W/2+110,180); c.fillStyle='#14122b'; c.font='900 44px '+TC; c.fillText(BANK[si][1].split(' ')[Math.floor(t/1.5)%6],W/2+110,236);
  c.font='900 40px '+TC; c.lineWidth=8; c.strokeStyle='#14122b'; c.strokeText('比手畫腳',W/2,90); c.fillStyle='#ffd23f'; c.fillText('比手畫腳',W/2,90); c.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).charades={
  name:'比手畫腳',tag:'CHARADES',color:'#ff8a3d',
  desc:'分成紅隊、藍隊，表演的人拿著螢幕看題目，只能用動作讓隊友猜！6 種題庫共 180 題：動物、職業、日常動作、運動、食物、綜合挑戰。大家用一台輪流玩。',
  goal:'表演的人只用動作（不說話、不出聲）讓隊友猜題目，猜中按「答對」。輪完設定的輪數，答對最多題的隊伍贏。',
  stages:STAGES,stageLabel:'選擇題庫',stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,Math.floor(t/3)%BANK.length,t),
  stageGoal:i=>'題庫「'+BANK[i][0]+'」：表演的人只能比動作，不能說話、發出聲音或用嘴型。隊友喊出答案就按「答對」，太難可以「跳過」。',
  modes:[{id:'1p',label:'大家用一台'}],
  options:[{key:'time',label:'每輪',def:'none',opts:[{id:'none',label:'5 題（不限時）'},{id:'60',label:'限時 60 秒'},{id:'90',label:'限時 90 秒'},{id:'120',label:'限時 120 秒'}]},
    {key:'rounds',label:'每隊幾輪',def:'3',opts:[{id:'2',label:'2 輪'},{id:'3',label:'3 輪'},{id:'4',label:'4 輪'}]}],
  help:[['空白鍵／→','答對'],['X／←','跳過'],['空白鍵','開始表演、換隊']],touchHelp:[['答對','隊友猜中了'],['跳過','換下一題']],touch:null,
  best:{label:'',fmt:v=>v,lower:false},create};
})();
