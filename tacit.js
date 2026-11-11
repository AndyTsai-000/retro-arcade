// 默契大考驗：大家看同一題、各自偷偷選答案，選得一樣就有默契！100 題分 10 類。
// 單人＝跟電腦搭檔「小默」（它照大家最常選的比例回答）；雙人同一台（1P 按 1～4、2P 按 7～0 或點自己那邊）；連線最多 8 人，看誰跟誰最有默契。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function mul(seed){ let a=seed>>>0||1; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
/* 題庫：題目|選項:大家選的比例 ×4 */
const CATS=[
['生活習慣','#4f9dff',`早上醒來第一件事？|看手機:46|上廁所:24|喝水:14|再睡五分鐘:16
洗澡習慣先洗哪裡？|頭髮:44|臉:22|身體:20|腳:14
搭捷運最常做什麼？|滑手機:58|聽音樂:20|發呆看窗外:12|閉眼休息:10
襪子穿破了你會？|直接丟掉:56|補一補:8|繼續穿:30|當抹布:6
最受不了室友哪一點？|不倒垃圾:34|太吵:26|亂用東西:22|不洗碗:18
睡前最後一件事？|滑手機:52|刷牙:20|看書:10|設鬧鐘:18
手機電量剩多少會開始焦慮？|50%:20|30%:36|20%:30|10%:14
冷氣最舒服的溫度？|24 度:28|25 度:26|26 度:34|27 度:12
雨天出門你會帶？|折疊傘:52|長柄傘:22|穿雨衣:10|直接淋:16
房間最常亂的地方？|椅子上的衣服:50|書桌:24|床上:16|地板:10`],
['美食','#ff7a3d',`宵夜首選？|鹹酥雞:42|泡麵:24|滷味:20|麥當勞:14
吃火鍋必點？|肉片:40|丸子:22|蛋餃:14|高麗菜:24
珍珠奶茶甜度？|半糖:42|微糖:28|全糖:12|無糖:18
吃蛋包飯先吃哪裡？|中間:36|邊邊:30|先把醬拌開:22|最喜歡的留最後:12
早餐店必點？|蛋餅:44|漢堡:20|蘿蔔糕:18|鐵板麵:18
炸雞最好吃的部位？|雞腿:46|雞翅:28|雞胸:12|雞屁股:14
吃到討厭的菜你會？|挑出來:46|硬吞:18|給別人:24|整盤不吃:12
最愛的水果？|芒果:30|草莓:26|西瓜:22|葡萄:22
點飲料最常加料？|珍珠:46|椰果:14|仙草:16|不加料:24
火鍋湯底？|麻辣:34|昆布:24|番茄:22|酸菜白肉:20`],
['旅行','#3ddbd9',`出國第一站最想去？|日本:52|韓國:16|歐洲:20|泰國:12
旅行最重要的是？|好吃的:42|好拍的:22|好睡的:18|好買的:18
行李箱一定會帶？|充電器:44|零食:10|多一件外套:26|枕頭:20
搭飛機喜歡坐？|靠窗:62|走道:30|中間:2|哪裡都好:6
旅遊住宿選？|飯店:42|民宿:34|露營:10|青年旅館:14
旅行時最常買？|零食:38|紀念品:24|衣服:20|藥妝:18
迷路的時候你會？|開地圖:58|問路人:20|跟著感覺走:16|叫別人處理:6
台灣環島最想去？|花蓮:32|墾丁:26|台東:24|澎湖:18
最想體驗的交通工具？|熱氣球:36|郵輪:24|直升機:20|雪地摩托車:20
旅行拍照你通常是？|拍風景:36|拍自己:24|拍食物:24|幫別人拍:16`],
['童年回憶','#ffd23f',`小時候最愛的下課遊戲？|鬼抓人:36|跳繩:18|躲貓貓:26|紅綠燈:20
小時候最怕？|打針:42|鬼:30|考試:16|被罵:12
最懷念的零食？|乖乖:34|科學麵:30|王子麵:20|孔雀餅乾:16
小時候的夢想職業？|老師:28|醫生:24|警察:20|太空人:28
小時候最常被罵的原因？|看電視太久:38|不寫功課:26|挑食:20|太吵:16
放學後第一件事？|看卡通:44|吃點心:24|寫功課:14|出去玩:18
小時候存零用錢買？|玩具:40|零食:30|文具:16|卡片:14
最怕的科目？|數學:58|英文:20|國文:10|自然:12
小時候過年最期待？|紅包:62|放假:16|吃大餐:12|放鞭炮:10
睡覺前的必備？|抱玩偶:40|聽故事:20|開小燈:26|喝牛奶:14`],
['戀愛與朋友','#ff5a9a',`第一次約會去哪裡？|看電影:40|吃飯:30|逛夜市:18|遊樂園:12
朋友生日送什麼？|蛋糕:28|實用小物:34|手寫卡片:20|直接給紅包:18
吵架之後通常誰先道歉？|我:34|對方:26|看情況:30|誰都不道歉:10
最喜歡的告白方式？|當面說:58|寫信:16|傳訊息:16|大聲公:10
好朋友最重要的特質？|講義氣:36|好聊天:26|守秘密:24|很好笑:14
和朋友出去最常做？|吃飯:46|唱歌:18|逛街:20|看電影:16
收到最開心的禮物？|手作的:34|很貴的:14|想要很久的:42|吃的:10
理想的週末約會？|在家耍廢:36|戶外走走:28|吃美食:24|看展覽:12
朋友遲到多久會生氣？|5 分鐘:12|15 分鐘:36|30 分鐘:38|不會生氣:14
最想跟朋友一起去？|日本旅行:40|露營:22|演唱會:24|遊樂園:14`],
['動物','#5fd068',`最想養的寵物？|貓:42|狗:40|兔子:10|烏龜:8
如果可以變成動物？|貓:32|鳥:30|海豚:20|獅子:18
動物園最想先看？|熊貓:40|長頸鹿:20|企鵝:24|獅子:16
最怕的動物？|蟑螂:52|蛇:26|蜘蛛:14|老鼠:8
貓咪最可愛的時候？|睡覺:36|踩踩:24|翻肚子:28|喵喵叫:12
十二生肖最想當？|龍:40|兔:18|虎:22|狗:20
最像你的動物？|貓:34|狗:28|無尾熊:22|松鼠:16
海裡最想看到？|海豚:44|鯨魚:28|海龜:20|小丑魚:8
如果狗會說話，第一句是？|我要吃:40|陪我玩:28|你回來了:24|出去走走:8
最想騎的動物？|馬:36|大象:28|海豚:22|恐龍:14`],
['假日休閒','#c56bff',`放假第一天會做？|睡到自然醒:56|出去玩:18|打電動:16|追劇:10
最喜歡的運動？|游泳:26|籃球:24|跑步:20|騎腳踏車:30
唱 KTV 你是？|麥霸:22|點歌王:24|吃東西的:34|拍手的:20
最常看的影片類型？|搞笑:34|美食:22|遊戲:24|旅遊:20
看電影最愛？|喜劇:34|動作:28|恐怖:16|愛情:22
最想學的才藝？|樂器:32|跳舞:22|畫畫:24|料理:22
下雨天在家做什麼？|睡覺:38|追劇:32|打電動:20|看書:10
逛夜市最先買？|飲料:34|雞排:30|臭豆腐:18|遊戲攤:18
去遊樂園先玩？|雲霄飛車:46|旋轉木馬:12|鬼屋:16|摩天輪:26
理想的放鬆方式？|泡溫泉:34|按摩:28|睡覺:26|吃大餐:12`],
['個性','#ff5d4f',`做決定的時候你？|很快決定:30|想很久:36|問別人:22|丟銅板:12
排隊排很久你會？|繼續等:44|換一家:36|滑手機殺時間:18|找人代排:2
中了一百萬先做？|存起來:44|出國玩:28|買想要的東西:16|請客:12
考試前一晚你是？|熬夜念書:36|早點睡:24|臨時抱佛腳:30|已經放棄:10
開會時你是？|認真記筆記:30|偷偷滑手機:26|發呆:24|一直發言:20
遇到不會的題目？|先跳過:52|猜一個:30|想到最後:12|問隔壁:6
朋友說「隨便」吃什麼，你會？|直接決定:46|再問一次:20|也說隨便:20|列三個選項:14
最不能忍受的事？|等人:38|被說謊:34|很吵:16|沒有網路:12
收到訊息你會？|馬上回:40|看了晚點回:34|已讀不回:16|不想看:10
你覺得自己是？|早起的鳥:30|夜貓子:54|隨時都想睡:12|精神超好:4`],
['如果世界','#7a8aff',`如果有超能力，選？|瞬間移動:40|隱形:20|讀心術:24|飛行:16
如果能回到過去，回到？|小學:36|國中:18|高中:30|昨天:16
如果世界末日只剩一天？|跟家人在一起:56|吃大餐:18|告白:14|睡覺:12
如果只能帶一樣東西去荒島？|刀子:34|打火機:30|手機:20|朋友:16
如果可以跟一位名人吃飯？|偶像:44|歷史人物:20|科學家:18|運動員:18
如果變成透明人一天？|偷聽別人說話:30|免費看電影:24|整人:30|去銀行:16
如果有時光機，去哪？|未來:52|恐龍時代:20|古代:18|一百年前:10
如果只能吃一種食物一年？|白飯:38|麵:24|麵包:16|火鍋:22
如果能跟動物說話，先找？|自己的寵物:50|海豚:16|鸚鵡:14|貓:20
如果中樂透頭獎？|辭職:36|買房子:34|環遊世界:22|捐出去:8`],
['台灣味','#3a9a4a',`最能代表台灣的小吃？|珍珠奶茶:34|滷肉飯:30|臭豆腐:18|小籠包:18
便利商店最常買？|飲料:44|御飯糰:24|茶葉蛋:14|關東煮:18
颱風天必備？|泡麵:52|手電筒:16|零食:20|行動電源:12
跨年最想去？|101 看煙火:44|在家看電視:28|演唱會:20|去海邊:8
最愛的夜市？|士林:30|逢甲:32|六合:18|饒河:20
過年必吃？|年糕:24|佛跳牆:22|魚:30|蘿蔔糕:24
中秋節烤肉必烤？|香腸:34|玉米:20|肉片:28|甜不辣:18
台灣最美的季節？|春天:26|夏天:20|秋天:40|冬天:14
騎機車最怕遇到？|下雨:52|紅燈很長:20|塞車:16|警察:12
最想推薦外國朋友的地方？|九份:36|日月潭:24|太魯閣:22|阿里山:18`],
];
const QS=[]; CATS.forEach(([n,col,txt],ci)=>txt.trim().split('\n').forEach(line=>{ const [q,...o]=line.split('|'); QS.push({ci,q,o:o.map(s=>s.split(':')[0]),w:o.map(s=>+s.split(':')[1])}); }));
const PCOL=['#ff5d4f','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d','#3ddbd9','#ff7eb6'];
const BOTN=['小默','阿心','嘟嘟','咪寶','阿樂','球球','小花','胖虎'];
const BOTLOOK=i=>({char:['bow','cat','bunny','chef','crown','cap','pirate','ninja'][i%8],deco:['blush','','scarf','shades'][i%4]});
const OCOL=['#ff5d6d','#4f9dff','#ffb02a','#3ac87a'],OL=['A','B','C','D'];
const RATE=[[90,'心有靈犀！'],[70,'超有默契'],[50,'好麻吉'],[30,'還不錯喔'],[0,'要多聊聊天～']];
const rateOf=p=>RATE.find(r=>p>=r[0])[1];
const STAGES=CATS.map(c=>c[0]).concat(['綜合隨機 10 題']);
/* 背景：電視節目棚 */
let BG=null;
function bg(){ if(BG) return BG; const e=document.createElement('canvas'); e.width=W; e.height=H; const c=e.getContext('2d');
  const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#3a1658'); g.addColorStop(1,'#14082a'); c.fillStyle=g; c.fillRect(0,0,W,H);
  for(let i=0;i<9;i++){ const x=i*100+50; c.globalAlpha=.08; c.fillStyle='#ffd8ff'; c.beginPath(); c.moveTo(x-10,0); c.lineTo(x+10,0); c.lineTo(x+90,H); c.lineTo(x-90,H); c.fill(); c.globalAlpha=1; }
  c.fillStyle='#2a0e40'; c.fillRect(0,H-70,W,70); c.fillStyle='#ff5a9a'; c.fillRect(0,H-72,W,4); for(let i=0;i<40;i++){ c.fillStyle=i%2?'#ffd23f':'#ff7eb6'; c.beginPath(); c.arc(i*20+10,H-60,3,0,TAU); c.fill(); }
  /* 舞台燈 */ for(const x of [40,760]){ c.fillStyle='#1a1a2a'; c.fillRect(x-14,8,28,22); c.fillStyle='#fff6c0'; c.beginPath(); c.arc(x,32,8,0,TAU); c.fill(); }
  /* 愛心霓虹 */ c.save(); c.translate(W/2,58); c.shadowColor='#ff5a9a'; c.shadowBlur=18; c.strokeStyle='#ff8ac8'; c.lineWidth=4; heartPath(c,0,0,22); c.stroke(); c.restore();
  return BG=e; }
function heartPath(c,x,y,s){ c.beginPath(); c.moveTo(x,y+s*.9); c.bezierCurveTo(x-s*1.6,y-s*.1,x-s*.7,y-s*1.2,x,y-s*.45); c.bezierCurveTo(x+s*.7,y-s*1.2,x+s*1.6,y-s*.1,x,y+s*.9); c.closePath(); }
function wrap(c,s,x,y,w,lh){ const lines=[]; let line=''; for(const ch of s){ if(c.measureText(line+ch).width>w){ lines.push(line); line=ch; } else line+=ch; } lines.push(line); lines.forEach((l,k)=>c.fillText(l,x,y+(k-(lines.length-1)/2)*lh)); }

function create(env,opts){
  const {ctx:c,canvas}=env.canvas2d(W,H),net=opts.net,client=!!net&&!net.host,host=!client,two=!net&&opts.mode==='2p',pv=!!opts.preview,OP=opts.options||{},si=clamp(opts.stage|0,0,STAGES.length-1);
  const humans=net?net.count:two?2:pv?0:1,n=net?clamp(net.count+(net.bots||0),2,8):2,me=net?net.me:0,TL=OP.time==='0'?0:(+OP.time||15);
  const names=[],looks=[]; for(let i=0;i<n;i++){ if(i<humans){ names.push(net?(net.names&&net.names[i])||'玩家'+(i+1):two?(i+1)+'P':(opts.name||'你')); looks.push(net?(net.looks&&net.looks[i])||{}:i===0?opts.look||{}:{}); } else { names.push(BOTN[(i-humans)%BOTN.length]); looks.push(BOTLOOK(i)); } }
  const colOf=i=>{ const L=looks[i]; return !L||!L.color||L.color==='auto'?PCOL[i%8]:L.color; };
  const isBot=i=>i>=humans;
  /* 出題：分類 10 題洗牌，或全部隨機 10 題 */
  const pool=si<CATS.length?QS.map((q,k)=>k).filter(k=>QS[k].ci===si):QS.map((q,k)=>k); for(let k=pool.length-1;k>0;k--){ const j=Math.floor(Math.random()*(k+1)),tt=pool[k]; pool[k]=pool[j]; pool[j]=tt; }
  let G={ph:'intro',PT:pv?.6:2.6,k:0,order:pool.slice(0,10),ans:Array(n).fill(-1),sc:Array(n).fill(0),pair:{},hist:[]};
  let t=0,ended=false,sendT=0,fx=[],botT=[],flip=0,prevPh='',prevK=-1,hover=-1,lastTick=99;
  const sfx=k=>{ if(!pv) env.sfx(k); };
  const tone=(f,d,type,v)=>{ const A=env.audio&&env.audio(); if(!A||pv) return; try{ const o=A.createOscillator(),g=A.createGain(),t0=A.currentTime; o.type=type||'sine'; o.frequency.value=f; g.gain.setValueAtTime(v||.07,t0); g.gain.exponentialRampToValueAtTime(.001,t0+d); o.connect(g); g.connect((env.out&&env.out())||A.destination); o.start(t0); o.stop(t0+d+.02); }catch(e){} };
  const Q=()=>QS[G.order[G.k]];
  function pickBot(){ const q=Q(); let r=Math.random()*q.w.reduce((a,b)=>a+b,0); for(let k=0;k<4;k++){ r-=q.w[k]; if(r<=0) return k; } return 0; }
  function newQ(){ G.ans=Array(n).fill(-1); G.ph='ask'; G.PT=TL||9999; botT=[]; for(let i=0;i<n;i++) botT.push(isBot(i)?1.6+Math.random()*3.2:0); }
  function answer(i,k){ if(G.ph!=='ask'||G.ans[i]>=0||k<0||k>3) return; G.ans[i]=k; if(!isBot(i)||pv) tone(660,.08,'triangle'); }
  function reveal(){ G.ph='reveal'; G.PT=3.6; const a=G.ans; let pm=0; for(let i=0;i<n;i++) for(let j=i+1;j<n;j++) if(a[i]>=0&&a[i]===a[j]){ pm++; G.sc[i]++; G.sc[j]++; const key=i+'-'+j; G.pair[key]=(G.pair[key]||0)+1; } G.hist.push(a.slice()); G.lastPm=pm; }
  if(net){ if(client) net.onmsg=m=>{ if(m.G) G=m.G; if(m.end&&!ended){ ended=true; finish(); } }; else net.onmsg=(m,from)=>{ if(m.a!=null) answer(from,m.a); }; }
  function myPick(k,who){ if(client){ if(G.ph==='ask'&&G.ans[me]<0){ G.ans[me]=k; net.send({a:k}); tone(660,.08,'triangle'); } return; } answer(who,k); }
  /* 點選：一般四張大卡；雙人時左右各一排小按鈕 */
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const cardRect=k=>[70+(k%2)*340,214+Math.floor(k/2)*96,320,82];
  const btn2=(p,k)=>[p===0?20:W-20-170,214+k*48,170,42];
  const inR=(x,y,[a,b,w,h])=>x>=a&&y>=b&&x<=a+w&&y<=b+h;
  const pd=e=>{ if(pv) return; const [x,y]=toG(e); if(G.ph!=='ask') return; if(two){ for(let p=0;p<2;p++) for(let k=0;k<4;k++) if(inR(x,y,btn2(p,k))) myPick(k,p); } else for(let k=0;k<4;k++) if(inR(x,y,cardRect(k))) myPick(k,me); };
  const pm=e=>{ if(two||pv) return; const [x,y]=toG(e); hover=-1; for(let k=0;k<4;k++) if(inR(x,y,cardRect(k))) hover=k; };
  canvas.addEventListener('pointerdown',pd); canvas.addEventListener('pointermove',pm);
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt;
    if(!pv){ const K1=['Digit1','Digit2','Digit3','Digit4'],K2=['Digit7','Digit8','Digit9','Digit0'],KA=['KeyA','KeyS','KeyD','KeyF'],KB=['KeyJ','KeyK','KeyL','Semicolon'];
      for(let k=0;k<4;k++){ if(two){ if(env.hit(K1[k])||env.hit(KA[k])) myPick(k,0); if(env.hit(K2[k])||env.hit(KB[k])) myPick(k,1); } else if(env.hit(K1[k])||env.hit(KA[k])||env.hit('Numpad'+(k+1))) myPick(k,me); } }
    if(host){ G.PT-=dt;
      if(G.ph==='intro'&&G.PT<=0) newQ();
      else if(G.ph==='ask'){ for(let i=0;i<n;i++) if((isBot(i)||pv)&&G.ans[i]<0){ botT[i]-=dt; if(botT[i]<=0) answer(i,pickBot()); }
        if(G.ans.every(a=>a>=0)||G.PT<=0) reveal(); }
      else if(G.ph==='reveal'&&G.PT<=0){ G.k++; if(G.k>=G.order.length){ G.ph='final'; G.PT=3; } else newQ(); }
      else if(G.ph==='final'&&G.PT<=0&&!ended){ if(pv){ G={ph:'intro',PT:.6,k:0,order:pool.slice(0,10),ans:Array(n).fill(-1),sc:Array(n).fill(0),pair:{},hist:[]}; return; } ended=true; if(net) net.send({G,end:1}); finish(); }
      if(net){ sendT-=dt; if(sendT<=0){ sendT=1/8; net.send({G}); } } }
    if(G.ph!==prevPh||G.k!==prevK){ if(G.ph==='reveal'){ flip=0; const a=G.ans; const mine=two?(a[0]>=0&&a[0]===a[1]):a.some((v,j)=>j!==me&&v>=0&&v===a[me]); if(mine||(!two&&n>2&&G.lastPm>0)){ sfx('win'); for(let k=0;k<30;k++) fx.push({x:W/2+(Math.random()-.5)*300,y:200,vx:(Math.random()-.5)*300,vy:-200-Math.random()*200,l:1.4,c:['#ff5a9a','#ffd23f','#ff8ac8'][k%3],h:Math.random()<.5}); } else sfx('bump'); }
      if(G.ph==='ask') sfx('beep'); if(G.ph==='final') sfx('win'); prevPh=G.ph; prevK=G.k; lastTick=99; }
    if(G.ph==='ask'&&TL){ const s=Math.ceil(G.PT); if(s<=3&&s>=1&&s!==lastTick){ lastTick=s; tone(880,.08,'square',.05); } }
    flip=Math.min(1,flip+dt*3);
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=380*dt; if(f.l<=0) fx.splice(i,1); } }
  function finish(){ const tot=G.hist.length||1; let best=null,bv=-1; for(const k in G.pair) if(G.pair[k]>bv){ bv=G.pair[k]; best=k; }
    const pairPct=n===2?Math.round(100*(G.pair['0-1']||0)/tot):null;
    let html='<table class="ls"><tr><th>玩家</th><th>跟別人選一樣</th></tr>'+names.map((nm,i)=>'<tr'+(i===me&&!two?' style="color:#ffd23f"':'')+'><td>'+nm+'</td><td>'+G.sc[i]+' 次</td></tr>').join('')+'</table>';
    if(n>2&&best){ const [a,b]=best.split('-').map(Number); html='<p>最有默契的搭檔：<b>'+names[a]+' ＆ '+names[b]+'</b>（'+bv+' / '+tot+' 題）</p>'+html; }
    if(n===2&&!net&&!two){ try{ const o=+localStorage.getItem('arcade.tacit.b.'+si)||0; if(pairPct>o) localStorage.setItem('arcade.tacit.b.'+si,String(pairPct)); }catch(e){} }
    env.end({title:n===2?names[0]+' ＆ '+names[1]:'默契大考驗結束',big:n===2?'默契度 '+pairPct+'%':(best?'最有默契：'+names[+best.split('-')[0]]+' ＆ '+names[+best.split('-')[1]]:'大家都很有個性！'),text:n===2?rateOf(pairPct):'',html,score:null}); }
  function draw(){ c.drawImage(bg(),0,0); const q=G.order[G.k]!=null?QS[G.order[G.k]]:null,cat=q?CATS[q.ci]:CATS[0];
    /* 標題列 */ c.textAlign='center'; c.textBaseline='middle'; c.font='900 22px '+TC; c.lineWidth=6; c.strokeStyle='#2a0e40'; c.strokeText('默契大考驗',W/2,58); c.fillStyle='#fff'; c.fillText('默契大考驗',W/2,58);
    c.fillStyle='rgba(10,4,24,.7)'; rr(c,14,14,210,40,12); c.fill(); c.fillStyle=cat[1]; c.font='900 15px '+TC; c.textAlign='left'; c.fillText((si<CATS.length?cat[0]:'綜合題')+'　第 '+Math.min(10,G.k+1)+' / 10 題',28,34);
    if(G.ph==='ask'&&TL){ const k=clamp(G.PT/TL,0,1); c.fillStyle='rgba(10,4,24,.7)'; rr(c,W-130,14,116,40,12); c.fill(); c.strokeStyle='rgba(255,255,255,.2)'; c.lineWidth=5; c.beginPath(); c.arc(W-110,34,12,0,TAU); c.stroke(); c.strokeStyle=k<.25?'#ff5a6a':'#7affa0'; c.beginPath(); c.arc(W-110,34,12,-Math.PI/2,-Math.PI/2+k*TAU); c.stroke(); c.fillStyle='#fff'; c.font='900 18px '+TC; c.textAlign='center'; c.fillText(Math.ceil(G.PT)+' 秒',W-62,35); }
    if(G.ph==='intro'){ c.fillStyle='#fff'; c.font='900 34px '+TC; c.textAlign='center'; c.fillText(n===2?names[0]+' ＆ '+names[1]:n+' 人一起考默契！',W/2,190); c.fillStyle='#ffd8f0'; c.font='700 17px '+TC; c.fillText('同一題各自偷偷選，選一樣就有默契！',W/2,236); drawCast(300); return; }
    if(G.ph==='final'){ const tot=G.hist.length||1,p=n===2?Math.round(100*(G.pair['0-1']||0)/tot):null; c.save(); c.translate(W/2,210); const s=1+Math.sin(t*4)*.06; c.scale(s,s); c.fillStyle='#ff5a9a'; heartPath(c,0,0,70); c.fill(); c.fillStyle='#fff'; c.font='900 34px '+TC; c.textAlign='center'; c.fillText(p!=null?p+'%':'完成！',0,6); c.restore(); c.fillStyle='#ffd23f'; c.font='900 26px '+TC; c.textAlign='center'; c.fillText(p!=null?rateOf(p):'看看誰最有默契',W/2,320); drawCast(400); drawFx(); return; }
    if(!q) return;
    /* 題目卡 */ c.fillStyle='#fff'; rr(c,70,88,660,104,20); c.fill(); c.fillStyle=cat[1]; rr(c,70,88,660,12,6); c.fill(); c.fillStyle='#2a0e40'; c.font='900 26px '+TC; c.textAlign='center'; wrap(c,q.q,W/2,144,600,32);
    const rev=G.ph==='reveal',tot=q.w.reduce((a,b)=>a+b,0);
    if(two&&!rev){ /* 雙人：中間顯示選項，兩邊各自的按鈕（不顯示對方選了什麼） */
      for(let k=0;k<4;k++){ c.fillStyle=OCOL[k]; rr(c,250,214+k*48,300,42,12); c.fill(); c.fillStyle='#fff'; c.font='900 19px '+TC; c.textAlign='center'; c.fillText(OL[k]+'　'+q.o[k],W/2,236+k*48); }
      for(let p=0;p<2;p++){ const done=G.ans[p]>=0; for(let k=0;k<4;k++){ const [x,y,w,h]=btn2(p,k); c.fillStyle=done?'rgba(255,255,255,.12)':'rgba(255,255,255,.88)'; rr(c,x,y,w,h,10); c.fill(); c.fillStyle=done?'rgba(255,255,255,.4)':OCOL[k]; c.font='900 16px '+TC; c.textAlign='center'; c.fillText((p===0?['1','2','3','4']:['7','8','9','0'])[k]+'　選 '+OL[k],x+w/2,y+h/2+1); }
        c.fillStyle=done?'#7affa0':'#fff'; c.font='900 16px '+TC; c.fillText(done?names[p]+' ✔ 選好了':names[p]+' 請選擇',p===0?105:W-105,200); }
      drawFx(); return; }
    for(let k=0;k<4;k++){ const [x,y,w,h]=cardRect(k),picked=G.ans[me]===k&&!two,ff=rev?flip:1; c.save(); c.translate(x+w/2,y+h/2); if(hover===k&&G.ph==='ask'&&G.ans[me]<0) c.scale(1.03,1.03); if(picked&&!rev) c.translate(0,-3);
      c.fillStyle='rgba(0,0,0,.3)'; rr(c,-w/2+4,-h/2+6,w,h,16); c.fill(); c.fillStyle=OCOL[k]; rr(c,-w/2,-h/2,w,h,16); c.fill(); if(picked){ c.strokeStyle='#fff'; c.lineWidth=5; c.stroke(); }
      c.fillStyle='rgba(255,255,255,.25)'; c.beginPath(); c.arc(-w/2+36,0,22,0,TAU); c.fill(); c.fillStyle='#fff'; c.font='900 22px '+TC; c.textAlign='center'; c.fillText(OL[k],-w/2+36,1); c.font='900 22px '+TC; c.textAlign='left'; c.fillText(q.o[k],-w/2+70,rev?-10:1);
      if(rev){ /* 大家選的比例 */ const pc=Math.round(q.w[k]/tot*100); c.fillStyle='rgba(0,0,0,.25)'; rr(c,-w/2+70,8,w-210,12,6); c.fill(); c.fillStyle='#fff'; rr(c,-w/2+70,8,Math.max(12,(w-210)*pc/100*ff),12,6); c.fill(); c.font='700 12px '+TC; c.fillText('大家 '+pc+'%',w/2-134,15); }
      c.restore(); }
    /* 翻牌：每個人站在自己選的那張卡旁 */
    if(rev){ const by=[[],[],[],[]]; G.ans.forEach((a,i)=>{ if(a>=0) by[a].push(i); }); by.forEach((arr,k)=>{ const [x,y,w,h]=cardRect(k); arr.forEach((i,j)=>{ const px=x+w-28-j*30,py=y+h-10; person(c,px,py+(1-flip)*30,i,.95); }); if(arr.length>=2){ c.save(); c.translate(x+w-30-(arr.length-1)*15,y-6); const s=1+Math.sin(t*8)*.1; c.scale(s,s); c.fillStyle='#ff3a7a'; heartPath(c,0,0,13); c.fill(); c.restore(); } });
      const a=G.ans,matchTxt=n===2?(a[0]>=0&&a[0]===a[1]?'💕 選一樣！默契 +1':'差一點點…選得不一樣'):(G.lastPm>0?'💕 有 '+G.lastPm+' 對選一樣！':'大家都選得不一樣！');
      c.fillStyle='rgba(10,4,24,.8)'; c.font='900 20px '+TC; const ww=c.measureText(matchTxt).width+40; rr(c,W/2-ww/2,H-56,ww,40,14); c.fill(); c.fillStyle=matchTxt[0]==='💕'?'#ffd8f0':'#cfc8ff'; c.textAlign='center'; c.fillText(matchTxt,W/2,H-35); }
    else { /* 作答中：下方顯示誰選好了 */ const y0=H-30; c.font='700 13px '+TC; c.textAlign='center'; const step=Math.min(96,(W-80)/n); for(let i=0;i<n;i++){ const x=W/2+(i-(n-1)/2)*step; person(c,x,y0+6,i,.85); const done=G.ans[i]>=0; c.fillStyle=done?'#7affa0':'rgba(255,255,255,.6)'; c.fillText(done?'✔':'思考中…',x+24,y0-30); }
      if(t<6&&!pv&&G.k===0){ c.fillStyle='#ffd8f0'; c.font='700 13px '+TC; c.textAlign='left'; c.fillText(env.touch?'點一張卡片作答':'點卡片或按 1～4 作答',18,H-86); } }
    drawFx(); }
  function person(c2,x,y,i,s){ const C=window.ARCADE_CHAR,L=looks[i]||{}; c2.fillStyle='rgba(0,0,0,.25)'; c2.beginPath(); c2.ellipse(x,y,12*s,4*s,0,0,TAU); c2.fill(); if(C) C.drawChar(c2,x,y-15*s,colOf(i),1,false,t+i,s*1.1,L.char||'cap',L.deco||''); c2.fillStyle='#fff'; c2.font='700 10px '+TC; c2.textAlign='center'; c2.fillText(names[i],x,y+10); }
  function drawCast(y){ const step=Math.min(110,(W-100)/n); for(let i=0;i<n;i++) person(c,W/2+(i-(n-1)/2)*step,y+Math.sin(t*3+i)*3,i,1.5); }
  function drawFx(){ for(const f of fx){ c.globalAlpha=Math.min(1,f.l); c.fillStyle=f.c; if(f.h){ heartPath(c,f.x,f.y,7); c.fill(); } else c.fillRect(f.x-3,f.y-3,6,6); } c.globalAlpha=1; }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',pd); canvas.removeEventListener('pointermove',pm); },_dbg:{get G(){return G;},answer,QS}};
}
function stageShow(ctx,w,h,si,t){ ctx.save(); ctx.scale(w/W,h/H); ctx.drawImage(bg(),0,0); const cat=si<CATS.length?CATS[si]:['綜合隨機 10 題','#ff5a9a'],q=QS.find(q=>si>=CATS.length||q.ci===si);
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#fff'; rr(ctx,90,90,620,96,20); ctx.fill(); ctx.fillStyle=cat[1]; rr(ctx,90,90,620,12,6); ctx.fill(); ctx.fillStyle='#2a0e40'; ctx.font='900 26px '+TC; ctx.fillText(q.q,W/2,142);
  for(let k=0;k<4;k++){ const x=90+(k%2)*320,y=210+Math.floor(k/2)*86; ctx.fillStyle=OCOL[k]; rr(ctx,x,y,300,72,14); ctx.fill(); ctx.fillStyle='#fff'; ctx.font='900 21px '+TC; ctx.textAlign='left'; ctx.fillText(OL[k]+'　'+q.o[k],x+22,y+37); }
  const C=window.ARCADE_CHAR,pk=Math.floor(t/2)%4; if(C){ for(let i=0;i<2;i++){ const k=(pk+(i&&Math.floor(t/2)%3===0?1:0))%4,x=90+(k%2)*320+250-i*34,y=210+Math.floor(k/2)*86+62; C.drawChar(ctx,x,y-15,PCOL[i],1,false,t+i,1.05,BOTLOOK(i).char,BOTLOOK(i).deco); } }
  ctx.textAlign='center'; ctx.font='900 24px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#2a0e40'; ctx.strokeText(cat[0],W/2,H-40); ctx.fillStyle='#ffd23f'; ctx.fillText(cat[0],W/2,H-40); ctx.fillStyle='#ff5a9a'; heartPath(ctx,W/2,58,16); ctx.fill(); ctx.restore(); }
const bestOf=i=>{ try{ const v=localStorage.getItem('arcade.tacit.b.'+i); return v==null?null:+v; }catch(e){ return null; } };
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).tacit={
  name:'默契大考驗',tag:'MIND MATCH',color:'#ff5a9a',online:true,maxPlayers:8,minPlayers:2,bots:true,
  desc:'同一題、各自偷偷選答案，選得一樣才算有默契！100 題分 10 類，單人跟電腦搭檔、雙人同一台，或連線大家一起看誰最有默契。',
  goal:'每題四個選項，和搭檔選到一樣的就得一分，10 題看你們的默契度有幾 %。',
  stages:STAGES,stageLabel:'選擇題庫',stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,4,t),
  stageGoal:i=>(i<CATS.length?'「'+CATS[i][0]+'」10 題':'從 100 題隨機出 10 題')+'：和搭檔選一樣就得一分，最後看默契度幾 %。',
  modes:[{id:'1p',label:'單人（跟電腦搭檔）'},{id:'2p',label:'雙人同一台'}],
  options:[{key:'time',label:'每題時間',def:'15',opts:[{id:'10',label:'10 秒'},{id:'15',label:'15 秒'},{id:'20',label:'20 秒'},{id:'0',label:'不限'}]}],
  help:[['1 2 3 4','選 A B C D（也可以用滑鼠點卡片）'],['雙人','1P 按 1～4、2P 按 7～0，或點自己那邊的按鈕']],
  touchHelp:[['點卡片','選答案'],['雙人','各自點自己那一邊的按鈕']],touch:null,
  looks:[{key:'char',label:'人物',opts:[{id:'cap',label:'帽子'},{id:'cat',label:'貓耳'},{id:'bunny',label:'兔耳'},{id:'crown',label:'皇冠'},{id:'chef',label:'廚師'},{id:'pirate',label:'海盜'},{id:'ninja',label:'忍者'},{id:'bow',label:'蝴蝶結'}]},{key:'color',label:'人物顏色',type:'color',opts:['auto','#ff5d4f','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d','#3ddbd9','#ff7eb6']}],
  preview:(ctx,w,h,L,t)=>{ ctx.drawImage(bg(),0,0,w,h); const C=window.ARCADE_CHAR; if(C) C.drawChar(ctx,w/2,h*.6,!L||!L.color||L.color==='auto'?PCOL[0]:L.color,1,false,t,2.6,(L&&L.char)||'cap',''); },
  hubBest:()=>{ let b=null; for(let i=0;i<STAGES.length;i++){ const v=bestOf(i); if(v!=null&&(b==null||v>b)) b=v; } return b!=null?'最高默契 <b>'+b+'%</b>':'尚無紀錄'; },
  stageBest:i=>{ const v=bestOf(i); return v!=null?'💕 '+v+'%':''; },
  best:{label:'默契度',fmt:v=>v+'%',lower:false},create};
})();
