// 心中有數：合作猜心派對遊戲（4～9 人）。每輪一位主持人念題目，其他人暗抽 1～10 的數字牌，
// 照自己數字的程度回答（1 最低、10 最高）。主持人聽完，一張一張從小到大翻牌；翻到比上一張小就碎一顆默契心，這輪照樣翻完。
// 默契心＝玩家人數（最多 8 顆），全部碎掉大家一起輸；撐過 5 輪大家一起贏。
// 全部真人玩：連線進同一個房間（4～9 人，各自看自己的數字、打字回答），或大家用一台（輪流偷看數字、用說的回答）。電腦只在開始畫面的預覽動畫裡出現。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,ROUNDS=5;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const gauss=()=>{ let u=0,v=0; while(!u) u=Math.random(); while(!v) v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v); };
const shuf=a=>{ for(let k=a.length-1;k>0;k--){ const j=Math.floor(Math.random()*(k+1)),t=a[k]; a[k]=a[j]; a[j]=t; } return a; };
/* 題目：題目|1 的意思|10 的意思|程度 1～10 的參考答案（每級兩個，用 / 分開）。電腦照自己的數字挑答案 */
const BANK=[
['生活日常',`說一件會讓人生氣的事|有點煩|氣到爆炸|鞋帶鬆了/原子筆沒水 等紅燈/下毛毛雨 網路有點慢/飲料太冰 排隊排很久/樓上很吵 被插隊/手機沒電 公車過站不停/被已讀不回 外送送錯/電腦當機沒存檔 被放鴿子/錢包被偷 新車被刮/被冤枉 被好朋友背叛/重要檔案全部消失
說一件很累的事|很輕鬆|累到虛脫|躺著滑手機/睡午覺 洗碗/散步 打掃房間/逛街 上一整天班/爬樓梯到五樓 搬家打包/跑三公里 通宵加班/顧小孩一整天 爬玉山/跑半馬 跑全馬/連續值班兩天 鐵人三項/帶三個小孩出國 橫越沙漠/登上聖母峰
說一種交通工具|最慢|最快|輪椅/牛車 滑板/三輪車 腳踏車/馬車 電動滑板車/公車 機車/渡輪 汽車/捷運 火車/快艇 高鐵/賽車 噴射客機/戰鬥機 火箭/太空梭
說一樣出門要帶的東西|可有可無|不帶不行|髮夾/口香糖 衛生紙/護唇膏 耳機/墨鏡 雨傘/水壺 行動電源/口罩 悠遊卡/外套 家裡鑰匙/眼鏡 錢包/手機 出國的護照/看病的健保卡 自己/褲子
說一個會吵醒你的聲音|很小聲|超大聲|蚊子飛/翻書聲 時鐘滴答/冷氣運轉 下雨聲/貓叫 鬧鐘/手機震動 狗叫/鄰居講話 垃圾車音樂/吹風機 救護車/裝潢電鑽 鞭炮/打雷 戰鬥機飛過/火災警報 火山爆發/隕石撞地球
說一個很髒的地方|有點髒|超級髒|書桌/鍵盤 手機螢幕/門把 書包裡面/車子裡 抹布/冰箱角落 菜市場地上/機車坐墊 運動後的球鞋/夜市垃圾桶旁 公共廁所/廚房排水孔 垃圾車/豬圈 化糞池/垃圾掩埋場 下水道/十年沒洗的廁所
說一件很浪費錢的事|還好|超浪費|多加一顆蛋/買瓶水 飲料加料/買雜誌 搭計程車/訂閱沒在看的頻道 衝動買衣服/轉扭蛋 吃到飽吃太少/辦健身房沒去 買限量球鞋/每年換新手機 買名牌包/手遊課金一萬 買跑車放著不開/婚禮請一千人 買私人飛機/在月球買地 拿鈔票點火/買一座島不去住
說一個讓人緊張的時刻|一點點|心臟要跳出來|點餐/等電梯 接陌生電話/上課被點名 考小考/第一天上班 面試/看牙醫 上台報告/第一次上高速公路 考大考/見對方家長 告白/等開刀結果 高空彈跳/被叫進校長室 跳傘/超大地震 被鯊魚追/飛機引擎起火`],
['美食',`說一種食物|一點都不辣|辣到噴火|白飯/牛奶 蛋糕/豆漿 黑胡椒牛排/洋蔥 泡菜/一點點芥末 辣味洋芋片/韓式炒年糕 麻婆豆腐/宮保雞丁 麻辣鍋/辣子雞 魔鬼辣泡麵/朝天椒 魔鬼椒/死神辣醬 整顆最辣的辣椒/辣椒泡辣椒
說一種飲料|最健康|最不健康|白開水/無糖綠茶 黑咖啡/檸檬水 豆漿/牛奶 果汁/優酪乳 運動飲料/拿鐵 半糖奶茶/養樂多 全糖珍奶/可樂 能量飲料/調酒 可樂加冰淇淋/烈酒 醬油/過期牛奶
說一份早餐|最簡單|最澎湃|一杯水/一顆蘋果 白吐司/茶葉蛋 饅頭/燕麥粥 蛋餅/三明治 飯糰/蘿蔔糕加蛋 鐵板麵/總匯三明治 燒餅油條加豆漿/漢堡套餐 飯店自助早餐/港式飲茶 早午餐大拼盤/英式全套早餐 吃到飽自助餐/辦桌
說一種甜點|最不甜|甜死人|原味優格/全麥餅乾 微糖綠豆湯/蘇打餅乾 布丁/豆花 鬆餅/紅豆餅 冰淇淋/甜甜圈 巧克力蛋糕/馬卡龍 棉花糖/牛軋糖 糖葫蘆/焦糖爆米花 直接喝蜂蜜/一整罐煉乳 一湯匙純糖/糖漿泡糖果
說一種食物|最便宜|最貴|白飯/一顆茶葉蛋 泡麵/饅頭 飯糰/烤地瓜 便當/滷肉飯套餐 牛肉麵/拉麵 火鍋套餐/披薩 燒肉吃到飽/牛排館 高級壽司/龍蝦 和牛/魚子醬 白松露/一大碗燕窩
說一種宵夜|最健康|最罪惡|燙青菜/一顆蘋果 豆花/優格 清粥小菜/關東煮 滷味/飯糰 泡麵/小份鹹酥雞 雞排/麥當勞 炸雞桶/大份鹹酥雞加起司 炸雞配啤酒/一整個起司披薩 炸物全家餐/雙層起司堡加大薯 炸奶油/通宵吃炸物
說一個難吃的東西|還能吃|完全吞不下去|冷掉的薯條/太鹹的湯 苦瓜/營養午餐 太甜的蛋糕/青椒 中藥/討厭香菜的人吃香菜 燒焦的蛋/不愛的人吃臭豆腐 過期一天的麵包/苦茶 生茄子/放三天的便當 發霉的麵包/牙膏炒飯 臭掉的牛奶/掉了蟑螂的湯 肥皂/泥巴`],
['戀愛與朋友',`說一個約會地點|最不浪漫|最浪漫|便利商店/菜市場 加油站/大賣場 速食店/圖書館 夜市/電影院 公園/咖啡廳 遊樂園/動物園 海邊/夜景餐廳 摩天輪頂端/星空露營 鐵塔下/熱氣球上 極光底下/無人島燭光晚餐
說一種告白方式|最隨便|最隆重|傳一個貼圖/在遊戲裡打字 傳訊息/打電話 寫紙條/當面說 送花/寫情書 準備小禮物/吃完飯後說 在海邊說/請朋友幫忙佈置 用蠟燭排愛心/唱情歌 包場電影院/在大螢幕打字 請樂隊演奏/放煙火 讓整棟大樓亮燈/讓飛機拉布條
送我一個禮物|最不用心|最用心|一張發票/路邊撿的石頭 超商禮券/一包面紙 現金紅包/一杯飲料 巧克力/馬克杯 香水/我喜歡的書 我想要的耳機/演唱會門票 手寫長信/親手烤的蛋糕 做一本相簿/親手織圍巾 安排驚喜旅行/拍一支回憶影片 寫一整年的交換日記/把我們的故事做成一本書
說一句朋友會說的謊|無傷大雅|超級嚴重|我在路上了/我吃飽了 我很好/我沒看到訊息 我很喜歡這個禮物/我沒偷吃 我有在減肥/我在忙 我忘記了/手機沒電 我沒錢/我生病要請假 我沒說你壞話/錢下週一定還 我沒去那場聚會/我沒碰你的車 我沒拿你的錢/我不認識他 我單身其實已婚/不是我做的其實就是我
說一個吵架的原因|小事一件|直接絕交|吃什麼/誰沒關燈 遲到五分鐘/衛生紙用完沒補 已讀不回/搶電視遙控器 忘記回電/搶最後一塊 遲到一小時/忘記紀念日 偷看手機/亂花錢 在背後說壞話/借錢不還 把秘密說出去/放鴿子三次 偷錢/搶走喜歡的人 劈腿/出賣朋友
稱讚我一句|最敷衍|最感人|喔/還好 不錯/可以 好看/很棒 你今天很好看/你好厲害 你很有品味/跟你聊天很開心 你是我最好的朋友/你好可靠 有你真好/你讓我變得更好 你是我的榜樣/你改變了我的人生 沒有你就沒有今天的我/你是我的光 我願意守護你一輩子/下輩子還要遇到你
假裝跟我分手，說一個理由|最好接受|最傷人|要出國唸書/工作調到外地 個性不合/想專心工作 價值觀不同/覺得進展太快 沒感覺了/家人反對 你太忙了/我想要自由 你變了/我們不適合 我喜歡上別人/你很無聊 我只是玩玩/你配不上我 我跟你最好的朋友在一起/我早就有對象了 我從來沒愛過你/其實我已經結婚了`],
['腦洞大開',`說一種超能力|最沒用|最厲害|讓指甲變長/聞出蘋果品種 讓頭髮變色/跟螞蟻說話 不會流汗/永遠不迷路 夜視/超級跳躍 秒睡/學什麼都會 隱形/怪力 飛行/讀心術 瞬間移動/操控天氣 時間暫停/治好所有病 創造宇宙/所有願望成真
說一隻怪物|最可愛|最可怕|棉花糖精靈/小雞怪 會跳舞的香菇/迷你恐龍 調皮小鬼/會說話的貓 綠色黏液怪/愛惡作劇的狐仙 森林巨人/大腳怪 吸血鬼/木乃伊 狼人/殭屍 巨大章魚怪/無頭騎士 吞下城市的巨獸/地獄三頭犬 吞噬宇宙的魔王/世界末日巨龍
被困在無人島，你帶了什麼|最沒用|最有用|吹風機/領帶 鈔票/高跟鞋 遊戲機/香水 一本小說/枕頭 防曬乳/毯子 釣竿/手電筒 帳篷/鍋子 打火機/淨水器 刀子/急救包 一艘船/衛星電話
世界末日前一天，你要做什麼|最平淡|最瘋狂|睡覺/寫功課 上班/洗衣服 看電視/滑手機 吃大餐/跟家人聊天 打給所有朋友/去海邊 跟喜歡的人告白/把存款全花掉 高空跳傘/開跑車飆一圈 在大樓頂樓跳舞/去偶像家敲門 搭火箭上太空/在總統府前唱歌 去打外星人/騎恐龍環島
說一種動物|最小|最大|螞蟻/跳蚤 蚊子/瓢蟲 蜜蜂/蝴蝶 麻雀/老鼠 兔子/貓 狗/猴子 獅子/鱷魚 熊/馬 大象/長頸鹿 藍鯨/暴龍
沒交作業，跟我說一個藉口|最可信|最扯|我生病了/電腦壞了 忘在家裡/印表機沒墨 檔案打不開/太晚才知道 被弟弟撕了/網路斷了 被狗吃了/被雨淋濕了 被風吹走/掉進水溝 被鄰居的貓叼走/被外送員拿走 被外星人拿走/寫完後時光倒流 被恐龍吃了/作業自己逃跑了 我穿越到平行宇宙寫完了/作業寄給了未來的我
說一種職業|最安全|最危險|試吃員/圖書館員 上班族/收銀員 老師/司機 廚師/外送員 建築工人/保全 警察/漁夫 消防員/礦工 特技演員/高樓外牆清潔工 拆彈專家/戰地記者 太空人/馴獅人
說一種天氣|最舒服|最可怕|微風晴天/春天早晨 多雲/秋天傍晚 有點熱/有點涼 毛毛雨/悶熱 大太陽/寒流 大雨/大霧 颱風/冰雹 沙塵暴/暴風雪 龍捲風/超級颱風 火山灰雨/隕石雨`]];
const QS=[]; BANK.forEach(([cat,txt],ci)=>txt.trim().split('\n').forEach(line=>{ const [q,lo,hi,a]=line.split('|'); QS.push({ci,q,lo,hi,a:a.trim().split(/\s+/).map(s=>s.split('/'))}); }));
const STAGES=BANK.map(b=>b[0]).concat(['綜合隨機']);
const PCOL=['#ff7a3d','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff5d6d','#3ddbd9','#ff9d3d','#ff7eb6'];
const BOTN=['阿數','小心','嘟嘟','咪寶','阿樂','球球','小花','胖虎','豆豆'];
const BOTLOOK=i=>({char:['crown','cat','bunny','chef','cap','bow','pirate','ninja'][i%8],deco:['blush','','scarf','shades'][i%4]});
const RATE=[[1,'心中有數，默契滿分！'],[.75,'超有默契'],[.5,'還算有默契'],[.01,'驚險過關'],[0,'下次再努力']];
/* ---------- 背景：益智節目攝影棚 ---------- */
let BG=null;
function bg(){ if(BG) return BG; const e=document.createElement('canvas'); e.width=W*2; e.height=H*2; const c=e.getContext('2d'); c.scale(2,2);
  const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#2a1050'); g.addColorStop(.55,'#3b1a62'); g.addColorStop(1,'#140826'); c.fillStyle=g; c.fillRect(0,0,W,H);
  /* 後面的數字燈牆 */ c.font='900 30px '+TC; c.textAlign='center'; c.textBaseline='middle'; for(let y=0;y<4;y++) for(let x=0;x<14;x++){ const n=(x*3+y*7)%10+1; c.fillStyle='rgba(255,255,255,'+(.025+((x+y)%3)*.015)+')'; c.fillText(n,30+x*58,40+y*58); }
  /* 聚光燈 */ for(const x of [120,400,680]){ const lg=c.createRadialGradient(x,0,10,x,260,320); lg.addColorStop(0,'rgba(255,220,255,.13)'); lg.addColorStop(1,'rgba(255,220,255,0)'); c.fillStyle=lg; c.beginPath(); c.moveTo(x-30,0); c.lineTo(x+30,0); c.lineTo(x+180,420); c.lineTo(x-180,420); c.fill(); }
  /* 舞台地板 */ const fg=c.createLinearGradient(0,330,0,H); fg.addColorStop(0,'#5a2a6e'); fg.addColorStop(1,'#1c0a2a'); c.fillStyle=fg; c.beginPath(); c.moveTo(0,H); c.lineTo(0,350); c.quadraticCurveTo(W/2,318,W,350); c.lineTo(W,H); c.fill();
  c.strokeStyle='rgba(255,140,220,.55)'; c.lineWidth=3; c.beginPath(); c.moveTo(0,350); c.quadraticCurveTo(W/2,318,W,350); c.stroke();
  for(let i=0;i<34;i++){ c.fillStyle=i%2?'#ffd23f':'#ff7eb6'; c.beginPath(); c.arc(12+i*23.6,353-Math.sin(i/33*Math.PI)*15,2.6,0,TAU); c.fill(); }
  return BG=e; }
function heart(c,x,y,s,col,broken){ c.save(); c.translate(x,y); c.beginPath(); c.moveTo(0,s*.9); c.bezierCurveTo(-s*1.6,-s*.1,-s*.7,-s*1.2,0,-s*.45); c.bezierCurveTo(s*.7,-s*1.2,s*1.6,-s*.1,0,s*.9); c.closePath();
  c.fillStyle=broken?'#4a3a5a':col; c.fill(); c.strokeStyle=broken?'#2a1e36':'rgba(255,255,255,.7)'; c.lineWidth=1.5; c.stroke();
  if(broken){ c.strokeStyle='#1a1026'; c.lineWidth=2.4; c.beginPath(); c.moveTo(0,-s*.45); c.lineTo(-s*.25,0); c.lineTo(s*.2,s*.25); c.lineTo(0,s*.85); c.stroke(); }
  else { c.fillStyle='rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-s*.5,-s*.25,s*.22,s*.14,-.6,0,TAU); c.fill(); } c.restore(); }
/* 數字牌：face 0＝背面、1＝正面；sc 做翻牌的左右壓扁 */
function numCard(c,x,y,w,h,n,face,sc,bad,mine){ c.save(); c.translate(x,y); c.scale(Math.max(.02,Math.abs(sc)),1);
  c.save(); c.shadowColor='rgba(0,0,0,.5)'; c.shadowBlur=8; c.shadowOffsetY=4;
  if(!face){ const g=c.createLinearGradient(-w/2,-h/2,w/2,h/2); g.addColorStop(0,'#ff5aa8'); g.addColorStop(1,'#7a3cff'); c.fillStyle=g; rr(c,-w/2,-h/2,w,h,8); c.fill(); c.restore();
    c.strokeStyle='rgba(255,255,255,.75)'; c.lineWidth=2; rr(c,-w/2+4,-h/2+4,w-8,h-8,6); c.stroke(); c.fillStyle='rgba(255,255,255,.9)'; c.font='900 '+(w*.42)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('?',0,1); }
  else { c.fillStyle=bad?'#ffe1e1':mine?'#fff6cc':'#fffdf6'; rr(c,-w/2,-h/2,w,h,8); c.fill(); c.restore(); c.strokeStyle=bad?'#ff4a5a':'#ffb02a'; c.lineWidth=3; rr(c,-w/2+3,-h/2+3,w-6,h-6,6); c.stroke();
    const col=n<=3?'#3a8aff':n<=7?'#ff9d1a':'#ff3a5a'; c.fillStyle=col; c.font='900 '+(w*.6)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(n,0,2);
    c.font='700 '+(w*.16)+'px '+TC; c.fillStyle='rgba(60,40,30,.5)'; c.fillText(n,-w/2+8,-h/2+9); }
  c.restore(); }
function wrapLines(c,s,w,max){ const out=[]; let line=''; for(const ch of s){ if(c.measureText(line+ch).width>w){ out.push(line); line=ch; if(out.length===max) break; } else line+=ch; } if(out.length<max&&line) out.push(line); if(out.length===max&&out.join('').length<s.length){ out[max-1]=out[max-1].slice(0,-1)+'…'; } return out; }

function create(env,opts){
  const {ctx:c,canvas}=env.canvas2d(W,H),net=opts.net,client=!!net&&!net.host,host=!client,pv=!!opts.preview,OP=opts.options||{},si=clamp(opts.stage|0,0,STAGES.length-1);
  const room=!net&&!pv,me=net?net.me:0;
  const N=net?clamp(net.count,2,9):pv?5:clamp(+OP.n||5,4,9);
  const humans=pv?0:net?net.count:room?N:1;
  const names=[],looks=[],bot=[]; for(let i=0;i<N;i++){ const h=i<humans; bot.push(!h);
    if(h){ names.push(net?(net.names&&net.names[i])||'玩家'+(i+1):room?'玩家 '+(i+1):(opts.name||'你')); looks.push(net?(net.looks&&net.looks[i])||{}:room?BOTLOOK(i):opts.look||{}); }
    else { names.push(BOTN[(i-humans)%BOTN.length]); looks.push(BOTLOOK(i)); } }
  if(room&&window.PARTY_NAMES) window.PARTY_NAMES.fill(names);
  const HEARTS=Math.min(8,N);
  /* 主持人順序：單人讓電腦先示範一輪、第二輪換你；連線只讓真人當主持人 */
  const hostSeq=[]; for(let r=0;r<ROUNDS;r++) hostSeq.push(r%N); const left=Array(N).fill(false);
  const local=i=>!pv&&!bot[i]&&(net?i===me:true);
  const colOf=i=>{ const L=looks[i]; return !L||!L.color||L.color==='auto'?PCOL[i%9]:L.color; };
  const pool=shuf(QS.map((q,k)=>k).filter(k=>si>=BANK.length||QS[k].ci===si));
  const newG=()=>({ph:'intro',PT:pv?1.5:4.2,r:-1,q:-1,host:-1,hearts:HEARTS,num:Array(N).fill(0),ans:Array(N).fill(null),lv:Array(N).fill(0),order:[],ai:0,peekI:0,peekOn:false,flip:[],bad:[],prev:0,miss:0,hist:[],est:[],opt:[],win:null});
  let G=newG();
  let t=0,ended=false,sendT=0,fx=[],btns=[],hoverB=-1,prevKey='',flipA={},shake=0,lastFlipN=0,editing=false;
  const sfx=k=>{ if(!pv) env.sfx(k); };
  const tone=(f,d,type,v)=>{ const A=env.audio&&env.audio(); if(!A||pv) return; try{ const o=A.createOscillator(),g=A.createGain(),t0=A.currentTime; o.type=type||'sine'; o.frequency.value=f; g.gain.setValueAtTime(v||.06,t0); g.gain.exponentialRampToValueAtTime(.001,t0+d); o.connect(g); g.connect((env.out&&env.out())||A.destination); o.start(t0); o.stop(t0+d+.02); }catch(e){} };
  const Q=()=>QS[G.q];
  const answerers=()=>{ const a=[]; for(let k=1;k<N;k++){ const i=((G.host<0?0:G.host)+k)%N; if(!left[i]) a.push(i); } return a; };
  const SP=pv?.5:1;
  /* ---------- 房主流程 ---------- */
  function startRound(){ G.r++; G.host=hostSeq[G.r]; for(let k=0;k<N&&left[G.host];k++) G.host=(G.host+1)%N; G.q=pool[G.r%pool.length]; const nums=shuf([1,2,3,4,5,6,7,8,9,10]); G.num=Array(N).fill(0); G.ans=Array(N).fill(null); G.lv=Array(N).fill(0); G.opt=Array(N).fill(null);
    G.order=answerers(); G.order.forEach((i,k)=>{ G.num[i]=nums[k]; }); G.ai=0; G.peekI=0; G.peekOn=false; G.flip=[]; G.bad=[]; G.prev=0; G.miss=0; G.est=[];
    /* 連線：💡 靈感按鈕給的參考答案（自己數字那一級） */ G.order.forEach(i=>{ if(!bot[i]) G.opt[i]=[[G.num[i],Q().a[G.num[i]-1][Math.random()<.5?0:1]]]; });
    G.ph='theme'; G.PT=3.4*SP; }
  function giveAns(i,txt,lv){ txt=String(txt||'').replace(/[<>&"']/g,'').trim().slice(0,18); if(!txt) return; G.ans[i]=txt; G.lv[i]=lv||0; G.ai++; G.PT=(pv?.6:1.2); if(G.ai>=G.order.length){ G.ph='order'; G.PT=2.2*SP; G.est=Array(N).fill(0).map((v,j)=>G.lv[j]+gauss()*.8); } }
  function doFlip(i){ if(G.ph!=='order'||G.flip.includes(i)||!G.order.includes(i)) return; const n=G.num[i],bad=G.prev>0&&n<G.prev; G.flip.push(i); if(bad){ G.bad.push(i); G.miss++; G.hearts=Math.max(0,G.hearts-1); } G.prev=n; G.PT=1.6*SP;
    if(G.flip.length>=G.order.length||G.hearts<=0){ G.ph='result'; G.PT=(G.hearts<=0?3:4.6)*SP; G.hist.push({host:G.host,q:G.q,miss:G.miss,seq:G.flip.map(j=>G.num[j])}); if(G.hearts<=0) G.order.forEach(j=>{ if(!G.flip.includes(j)) G.flip.push(j); }); } }
  function afterRound(){ if(G.hearts<=0){ G.win=false; G.ph='final'; G.PT=3.6; return; } if(G.r+1>=ROUNDS){ G.win=true; G.ph='final'; G.PT=3.6; return; } startRound(); }
  function doAct(from,a){ if(!a||ended) return; const cur=G.order[G.ai];
    if(a.k==='go'&&room&&G.ph==='intro'){ startRound(); return; }
    if(a.k==='peek'&&room&&G.ph==='peek') G.peekOn=true;
    else if(a.k==='peekDone'&&room&&G.ph==='peek'&&G.peekOn){ G.peekOn=false; G.peekI++; if(G.peekI>=G.order.length){ G.ph='answer'; G.ai=0; G.PT=.6; } }
    else if(a.k==='said'&&room&&G.ph==='answer'&&G.PT<=0) giveAns(cur,'🗣',0);
    else if(a.k==='ans'&&G.ph==='answer'&&!room&&G.PT<=0&&cur!=null&&!bot[cur]&&(net?from===cur:true)){ const o=G.opt[cur]; if(a.o!=null&&o&&o[a.o]) giveAns(cur,o[a.o][1],o[a.o][0]); else if(net&&a.t) giveAns(cur,a.t,0); }
    else if(a.k==='flip'&&G.ph==='order'&&!bot[G.host]&&(net?from===G.host||left[G.host]:true)&&G.PT<=1.0*SP) doFlip(a.i); }
  function hostStep(dt){ G.PT-=dt;
    if(G.ph==='intro'){ if(G.PT<=0&&!room) startRound(); }
    else if(G.ph==='theme'){ if(G.PT<=0){ if(room){ G.ph='peek'; G.peekI=0; } else { G.ph='answer'; G.ai=0; G.PT=.4; } } }
    else if(G.ph==='answer'){ const cur=G.order[G.ai]; if(cur!=null&&left[cur]&&G.PT<=0) giveAns(cur,'（已離開）',0); else if(cur!=null&&bot[cur]&&G.PT<=-1.2*SP){ const n=G.num[cur]; giveAns(cur,Q().a[n-1][G.opt.some(o=>o)?1:Math.random()<.5?0:1],n); /* 有真人要選參考答案時，電腦用另一個說法，免得重複 */ } }
    else if(G.ph==='order'){ if(bot[G.host]&&G.PT<=0){ let best=-1,bv=1e9; for(const i of G.order) if(!G.flip.includes(i)&&G.est[i]<bv){ bv=G.est[i]; best=i; } if(best>=0) doFlip(best); } }
    else if(G.ph==='result'){ if(G.PT<=0) afterRound(); }
    else if(G.ph==='final'&&G.PT<=0&&!ended){ if(pv){ G=newG(); return; } ended=true; if(net) net.send({G,end:1}); finish(); }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/8; net.send({G}); } } }
  if(net){ if(client) net.onmsg=m=>{ if(m.G) G=m.G; if(m.end&&!ended){ ended=true; finish(); } };
    else { net.onmsg=(m,from)=>{ if(m.a) doAct(from,m.a); }; net.onleave=i=>{ if(i>0&&i<N&&!left[i]){ left[i]=true; names[i]+='（離開）'; } }; } }
  const act=a=>{ if(client) net.send({a}); else doAct(me,a); };
  /* ---------- 連線：自己打答案 ---------- */
  const wrap=document.createElement('div'); wrap.style.cssText='position:absolute;z-index:6;display:none;gap:6px'; const inp=document.createElement('input'); inp.maxLength=18; inp.placeholder='照你的數字程度回答'; inp.autocomplete='off'; inp.style.cssText='flex:1;min-width:0;font:700 15px '+TC+';padding:4px 10px;border-radius:10px;border:2px solid #ff8ad0;background:#fff;color:#2a1040';
  const ib=document.createElement('button'); ib.textContent='💡'; ib.title='給我一點靈感'; ib.style.cssText='font:900 15px '+TC+';padding:0 10px;border-radius:10px;border:0;background:#e8dcff;cursor:pointer'; ib.addEventListener('click',()=>{ const o=G.opt[me]; if(o&&o[0]){ inp.value=o[0][1]; inp.focus(); } });
  const sb=document.createElement('button'); sb.textContent='送出'; sb.style.cssText='font:900 14px '+TC+';padding:0 16px;border-radius:10px;border:0;background:#ffd23f;color:#2a1e0e;white-space:nowrap;cursor:pointer'; wrap.append(inp,ib,sb); if(!pv&&net) env.stage.appendChild(wrap);
  const sendAns=()=>{ const v=inp.value.trim(); if(!v) return; act({k:'ans',t:v}); inp.value=''; sfx('click'); inp.blur(); };
  sb.addEventListener('click',sendAns); inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ sendAns(); e.preventDefault(); } e.stopPropagation(); }); inp.addEventListener('keyup',e=>e.stopPropagation());
  const place=()=>{ const r=canvas.getBoundingClientRect(),st=env.stage.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=r.left+(r.width-W*s)/2-st.left,oy=r.top+(r.height-H*s)/2-st.top; wrap.style.left=(ox+200*s)+'px'; wrap.style.top=(oy+426*s)+'px'; wrap.style.width=(400*s)+'px'; wrap.style.height=(32*s)+'px'; }; addEventListener('resize',place); place();
  /* ---------- 輸入 ---------- */
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const inR=(x,y,b)=>x>=b.x&&y>=b.y&&x<=b.x+b.w&&y<=b.y+b.h;
  const pd=e=>{ if(pv||editing) return; const [x,y]=toG(e); for(const b of btns) if(inR(x,y,b)){ b.fn(); return; } };
  const pm=e=>{ if(pv) return; const [x,y]=toG(e); hoverB=btns.findIndex(b=>inR(x,y,b)); canvas.style.cursor=hoverB>=0?'pointer':''; };
  canvas.addEventListener('pointerdown',pd); canvas.addEventListener('pointermove',pm);
  const iHost=()=>G.host>=0&&local(G.host);
  const myTurnAns=()=>G.ph==='answer'&&G.order[G.ai]!=null&&local(G.order[G.ai])&&G.PT<=0&&!room;
  /* ---------- 更新 ---------- */
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt; if(host) hostStep(dt); else G.PT-=dt;
    if(!pv&&!editing&&document.activeElement!==inp){       if(room&&G.ph==='intro'&&(env.hit('Space')||env.hit('Enter'))) act({k:'go'});
       if(room&&G.ph==='peek'&&(env.hit('Space')||env.hit('Enter'))) act({k:G.peekOn?'peekDone':'peek'});
      if(room&&G.ph==='answer'&&G.PT<=0&&(env.hit('Space')||env.hit('Enter'))) act({k:'said'}); }
    if(net&&!pv){ const show=myTurnAns(); const was=wrap.style.display==='flex'; wrap.style.display=show?'flex':'none'; if(show&&!was){ place(); if(!env.touch) setTimeout(()=>{ try{ inp.focus(); }catch(e){} },50); } }
    const key=G.ph+'|'+G.r+'|'+G.ai+'|'+G.flip.length; if(key!==prevKey){ onChange(prevKey); prevKey=key; }
    for(const k in flipA) flipA[k]=Math.min(1,flipA[k]+dt*2.6);
    if(shake>0) shake=Math.max(0,shake-dt*2);
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=420*dt; f.r+=f.vr*dt; if(f.l<=0) fx.splice(i,1); } }
  function onChange(old){ const op=old.split('|')[0];
    if(G.ph==='theme'&&op!=='theme'){ sfx('beep'); flipA={}; lastFlipN=0; }
    if(G.ph==='answer'&&G.ai>0) tone(700+G.ai*40,.08,'triangle');
    if(G.ph==='order'&&op==='answer') tone(880,.1,'triangle');
    if(G.flip.length>lastFlipN){ const real=G.hist.length&&G.ph==='result'?G.hist[G.hist.length-1].seq.length:G.flip.length;
      for(let k=lastFlipN;k<G.flip.length;k++){ const i=G.flip[k]; flipA[i]=flipA[i]||0; if(k>=real) continue;
        if(G.bad.includes(i)){ sfx('bump'); shake=1; const [x,y]=slotXY(i); for(let j=0;j<20;j++) fx.push({x,y:y-40,vx:(Math.random()-.5)*260,vy:-120-Math.random()*160,l:1.1,c:j%2?'#ff4a5a':'#4a3a5a',r:0,vr:(Math.random()-.5)*10,h:1}); }
        else tone(330*Math.pow(2,(G.num[i]-1)/12),.18,'triangle',.07); } lastFlipN=G.flip.length; }
    if(G.ph==='result'&&op==='order'){ if(G.hearts<=0) sfx('lose'); else if(!G.miss){ sfx('win'); for(let k=0;k<50;k++) fx.push({x:W/2+(Math.random()-.5)*400,y:200,vx:(Math.random()-.5)*480,vy:-240-Math.random()*240,l:1.8,c:['#ff5aa8','#ffd23f','#5bd1ff','#7affa0'][k%4],r:0,vr:(Math.random()-.5)*12}); } else sfx('item'); }
    if(G.ph==='final'&&op!=='final') sfx(G.win?'win':'lose'); }
  function finish(){ if(pv){ env.end({}); return; } const win=!!G.win;
    if(!pv&&win){ try{ localStorage.setItem('arcade.dial.w',String((+localStorage.getItem('arcade.dial.w')||0)+1)); }catch(e){} }
    const rows=G.hist.map((h,k)=>'<tr><td>'+(k+1)+'</td><td>'+names[h.host]+'</td><td>'+QS[h.q].q+'</td><td>'+h.seq.join(' → ')+'</td><td>'+(h.miss?'💔 '+h.miss:'✔ 全對')+'</td></tr>').join('');
    const r=win?RATE.find(x=>G.hearts/HEARTS>=x[0])[1]:'';
    env.end({title:win?'大家一起過關！':'默契心全碎了…',big:win?'剩下 '+G.hearts+' / '+HEARTS+' 顆默契心':'撐到第 '+(G.r+1)+' 輪',text:win?r:'再玩一次，抓到彼此的感覺！',
      html:'<table class="ls"><tr><th>輪</th><th>主持人</th><th>題目</th><th>翻牌順序</th><th>結果</th></tr>'+rows+'</table>',score:null}); }
  /* ---------- 版面 ---------- */
  function slotXY(i){ const ord=G.order.length?G.order:answerers(),k=ord.indexOf(i),n=ord.length,step=Math.min(96,740/n); return [W/2+(k-(n-1)/2)*step,282]; }
  function person(x,y,i,s,bob){ const C=window.ARCADE_CHAR,L=looks[i]||{}; c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x,y,14*s,4.5*s,0,0,TAU); c.fill(); if(C) C.drawChar(c,x,y-15*s+(bob||0),colOf(i),1,false,t+i,s*1.1,L.char||'cap',L.deco||''); }
  function hit(x,y,w,h,fn){ btns.push({x,y,w,h,fn:()=>{ sfx('click'); fn(); }}); }
  function btn(x,y,w,h,tx,col,fn,sub){ const k=btns.length,hv=hoverB===k; hit(x,y,w,h,fn); c.save(); c.shadowColor='rgba(0,0,0,.45)'; c.shadowBlur=10; c.shadowOffsetY=4; c.fillStyle=col; rr(c,x,y-(hv?2:0),w,h,14); c.fill(); c.restore(); c.fillStyle='rgba(255,255,255,.28)'; rr(c,x+4,y+3-(hv?2:0),w-8,h*.38,10); c.fill();
    c.fillStyle='#1a1430'; c.font='900 '+(h>44?16:14)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; const ls=wrapLines(c,tx,w-14,2); ls.forEach((l,j)=>c.fillText(l,x+w/2,y+h/2-(sub?7:0)-(hv?2:0)+(j-(ls.length-1)/2)*17)); if(sub){ c.font='700 11px '+TC; c.fillStyle='rgba(26,20,48,.65)'; c.fillText(sub,x+w/2,y+h-9-(hv?2:0)); } }
  function status(s,col){ c.fillStyle=col||'#f2e8ff'; c.font='900 16px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(s,W/2,410); }
  function themeCard(){ const q=G.q>=0?Q():QS[pool[0]]; c.save(); c.shadowColor='rgba(0,0,0,.5)'; c.shadowBlur=16; c.shadowOffsetY=6; c.fillStyle='#fffaf0'; rr(c,170,44,460,92,18); c.fill(); c.restore();
    const g=c.createLinearGradient(170,0,630,0); g.addColorStop(0,'#5aa8ff'); g.addColorStop(.5,'#ffb02a'); g.addColorStop(1,'#ff4a6a'); c.fillStyle=g; rr(c,170,44,460,10,5); c.fill();
    c.fillStyle='#2a1040'; c.font='900 '+(q.q.length>12?19:22)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(q.q,W/2,80);
    c.font='900 13px '+TC; const lt='1 '+q.lo,ht=q.hi+' 10',lw=c.measureText(lt).width,hw=c.measureText(ht).width,y=114,x0=190+lw+12,x1=610-hw-12;
    c.fillStyle='#3a8aff'; c.textAlign='left'; c.fillText(lt,190,y); c.textAlign='right'; c.fillStyle='#ff3a5a'; c.fillText(ht,610,y); c.textAlign='center';
    const gg=c.createLinearGradient(x0,0,x1,0); gg.addColorStop(0,'#5aa8ff'); gg.addColorStop(.5,'#ffb02a'); gg.addColorStop(1,'#ff4a6a'); c.strokeStyle=gg; c.lineWidth=6; c.lineCap='round'; c.beginPath(); c.moveTo(x0,y); c.lineTo(x1,y); c.stroke();
    for(let k=0;k<10;k++){ c.fillStyle='#fff'; c.beginPath(); c.arc(x0+(x1-x0)*k/9,y,2,0,TAU); c.fill(); } }
  function heartsRow(){ const n=HEARTS,x0=W-14-n*24; c.fillStyle='rgba(20,8,40,.7)'; rr(c,x0-10,8,n*24+16,30,12); c.fill(); for(let k=0;k<n;k++){ const br=k>=G.hearts,s=8+(br?0:Math.sin(t*4+k)*.6); heart(c,x0+6+k*24,24,s,'#ff4f8b',br); } }
  function draw(){ btns=[]; c.save(); if(shake>0) c.translate((Math.random()-.5)*10*shake,(Math.random()-.5)*6*shake); c.drawImage(bg(),0,0,W,H);
    c.fillStyle='rgba(20,8,40,.7)'; rr(c,14,8,150,30,12); c.fill(); c.fillStyle='#fff'; c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(G.ph==='intro'?'心中有數':'第 '+Math.min(ROUNDS,G.r+1)+' / '+ROUNDS+' 輪',89,24); heartsRow();
    themeCard();
    if(G.ph==='intro'){ introPanel(); c.restore(); drawFx(); return; }
    /* 主持人 */ if(G.host>=0){ person(92,124,G.host,1.15,0); c.font='18px '+TC; c.fillText('👑',92,62); const nm=(local(G.host)&&!room?'你':names[G.host]).slice(0,6)+'（主持人）'; c.font='900 11px '+TC; const w=c.measureText(nm).width+14; c.fillStyle='rgba(20,8,40,.8)'; rr(c,92-w/2,132,w,18,9); c.fill(); c.fillStyle='#ffd23f'; c.fillText(nm,92,141); }
    /* 作答者一排 */ const ord=G.order,n=ord.length,step=Math.min(96,740/n),cw=Math.min(50,step-14),ch=cw*1.35;
    ord.forEach((i,k)=>{ const [x,y]=slotXY(i),cur=G.ph==='answer'&&G.ai===k,fi=G.flip.indexOf(i),shown=fi>=0,mine=local(i)&&!room,bad=G.bad.includes(i);
      if(cur){ c.fillStyle='rgba(255,210,63,.25)'; c.beginPath(); c.ellipse(x,y+4,40,12,0,0,TAU); c.fill(); }
      person(x,y,i,.95,cur?Math.sin(t*8)*2:0);
      c.font=(mine?'900 ':'700 ')+'11px '+TC; const nm=(mine?'你':names[i]).slice(0,5),w=c.measureText(nm).width+12; c.fillStyle=mine?'#ffd23f':'rgba(20,8,40,.75)'; rr(c,x-w/2,y+5,w,16,8); c.fill(); c.fillStyle=mine?'#2a1e0e':'#fff'; c.fillText(nm,x,y+13);
      /* 答案泡泡 */ const a=G.ans[i]; if(a){ c.font='900 13px '+TC; const bw=step-8,ls=wrapLines(c,a,bw-10,3),bh=ls.length*16+12,by=y-66-bh; c.save(); c.shadowColor='rgba(0,0,0,.35)'; c.shadowBlur=6; c.fillStyle='#fff'; rr(c,x-bw/2,by,bw,bh,10); c.fill(); c.beginPath(); c.moveTo(x-6,by+bh); c.lineTo(x+6,by+bh); c.lineTo(x,by+bh+8); c.fill(); c.restore(); c.fillStyle='#2a1040'; ls.forEach((l,j)=>c.fillText(l,x,by+14+j*16)); }
      else if(cur){ c.fillStyle='rgba(255,255,255,.85)'; c.font='900 16px '+TC; c.fillText('💭'+'…'.repeat(1+Math.floor(t*3)%3),x,y-84); }
      /* 數字牌 */ const cy=y+30+ch/2,fa=shown?(flipA[i]||0):0,sc=shown?Math.cos(fa*Math.PI):1,face=shown?fa>=.5:(mine&&G.ph!=='theme');
      numCard(c,x,cy,cw,ch,G.num[i],face,sc,bad&&fa>=.5,mine); if(mine&&!shown&&G.ph!=='theme'){ c.fillStyle='#ffd23f'; c.font='900 10px '+TC; c.fillText('你的數字',x,cy+ch/2+9); }
      if(shown&&fa>=.5){ c.fillStyle=bad?'#ff4a5a':'#7affa0'; c.font='900 12px '+TC; c.fillText(bad?'✘ 翻錯':'第 '+(fi+1)+' 張',x,cy+ch/2+10); }
      if(G.ph==='order'&&iHost()&&!shown){ hit(x-step/2+4,y-150,step-8,180+ch,()=>act({k:'flip',i})); c.strokeStyle='rgba(255,210,63,'+(.5+.4*Math.sin(t*6))+')'; c.lineWidth=3; rr(c,x-cw/2-4,cy-ch/2-4,cw+8,ch+8,10); c.stroke(); } });
    phaseUI(); c.restore(); drawFx(); }
  function introPanel(){ c.fillStyle='rgba(20,8,40,.86)'; rr(c,W/2-250,160,500,210,22); c.fill(); c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#fff'; c.font='900 30px '+TC; c.fillText('心中有數',W/2,196);
    c.font='700 15px '+TC; c.fillStyle='#f0dcff'; ['每人暗抽一張 1～10 的數字牌','照數字的程度回答題目（1 最低、10 最高）','主持人從小到大一張一張翻牌，翻錯碎一顆心'].forEach((s,k)=>c.fillText(s,W/2,234+k*26));
    c.fillStyle='#ffd23f'; c.font='900 16px '+TC; c.fillText('大家一起撐過 '+ROUNDS+' 輪就贏！共 '+HEARTS+' 顆默契心',W/2,322);
    c.fillStyle='#fff'; c.font='700 13px '+TC; c.fillText(net?'連線：每個人看自己的螢幕、打字回答':'大家用一台：輪流偷看數字，用說的回答',W/2,350);
    if(room){ btn(W/2-200,388,180,52,'✏️ 改名字','#e8dcff',()=>{ editing=true; hoverB=-1; window.PARTY_NAMES.edit(env.stage,names,()=>{ editing=false; }); }); btn(W/2+20,388,180,52,'▶ 開始遊戲','#ffd23f',()=>act({k:'go'}),env.touch?'':'空白鍵'); } }
  function phaseUI(){ const hostNm=local(G.host)&&!room?'你':names[G.host];
    if(G.ph==='theme'){ status(hostNm+(hostNm==='你'?'':' ')+'當主持人，大家抽數字牌…','#ffd23f'); }
    else if(G.ph==='peek'){ const i=G.order[G.peekI]; if(i==null) return; if(!G.peekOn){ status('把螢幕交給「'+names[i]+'」，其他人先別看！','#ffd23f'); btn(W/2-130,420,260,58,'👀 我是 '+names[i]+'，看數字','#ffd23f',()=>act({k:'peek'}),'看完按「記住了」'); }
      else { c.fillStyle='rgba(20,8,40,.94)'; rr(c,W/2-160,150,320,240,24); c.fill(); c.fillStyle='#fff'; c.font='900 18px '+TC; c.textAlign='center'; c.fillText(names[i]+' 的數字',W/2,178); numCard(c,W/2,272,100,135,G.num[i],1,1,false,true); btn(W/2-110,420,220,58,'✔ 記住了','#7affa0',()=>act({k:'peekDone'}),'把螢幕交給下一位'); } }
    else if(G.ph==='answer'){ const cur=G.order[G.ai]; if(cur==null) return; const nm=local(cur)&&!room?'你':names[cur];
      if(room){ if(G.PT<=0){ status('「'+names[cur]+'」照自己的數字程度說出答案','#ffd23f'); btn(W/2-110,424,220,56,'🗣 說完了，下一位','#ffd23f',()=>act({k:'said'}),env.touch?'':'空白鍵'); } }
      else if(myTurnAns()){ status('輪到你！你的數字是 '+G.num[cur]+'，照這個程度回答（想不到可以按 💡）','#ffd23f');
        }
      else status('💭 '+nm+' 正在想答案…'); }
    else if(G.ph==='order'){ if(iHost()) status(G.flip.length?'點下一張（要比剛才的大）':'你是主持人：點你覺得「最小」的那張牌翻開','#ffd23f'); else status('👑 '+hostNm+' 正在決定翻哪一張…'); if(G.flip.length){ c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText('翻牌順序：'+G.flip.map(j=>G.num[j]).join(' → '),W/2,446); } }
    else if(G.ph==='result'){ const h=G.hist[G.hist.length-1]; if(!h) return; c.fillStyle='rgba(20,8,40,.85)'; rr(c,W/2-230,402,460,86,18); c.fill(); c.textAlign='center';
      c.font='900 24px '+TC; c.fillStyle=G.hearts<=0?'#ff6a7a':h.miss?'#ffd23f':'#7affa0'; c.fillText(G.hearts<=0?'💔 默契心全碎了…':h.miss?'翻錯 '+h.miss+' 次，碎了 '+h.miss+' 顆心':'🎉 全部翻對！',W/2,430);
      c.font='700 14px '+TC; c.fillStyle='#f0dcff'; c.fillText('翻牌順序：'+h.seq.join(' → '),W/2,464); }
    else if(G.ph==='final'){ c.fillStyle='rgba(20,8,40,.88)'; rr(c,W/2-220,402,440,86,20); c.fill(); c.textAlign='center'; c.font='900 28px '+TC; c.fillStyle=G.win?'#7affa0':'#ff6a7a'; c.fillText(G.win?'🏆 大家一起過關！':'默契心全碎了…',W/2,430); c.font='700 15px '+TC; c.fillStyle='#fff'; c.fillText(G.win?'剩下 '+G.hearts+' 顆默契心':'下一次一定可以！',W/2,466); } }
  function drawFx(){ for(const f of fx){ c.save(); c.globalAlpha=Math.min(1,f.l); c.translate(f.x,f.y); c.rotate(f.r); if(f.h){ heart(c,0,0,5,f.c,false); } else { c.fillStyle=f.c; c.fillRect(-4,-2.5,8,5); } c.restore(); } }
  return {update,draw,destroy(){ const o=env.stage&&env.stage.querySelector('.pnEdit'); if(o) o.remove(); removeEventListener('resize',place); if(wrap.parentNode) wrap.remove(); canvas.removeEventListener('pointerdown',pd); canvas.removeEventListener('pointermove',pm); },
    _dbg:{get G(){ return G; },set G(v){ G=v; },doAct,QS,bot,names,N,hostSeq,doFlip}};
}
function stageShow(ctx,w,h,si,t){ ctx.save(); ctx.scale(w/W,h/H); const c=ctx; c.drawImage(bg(),0,0,W,H);
  const list=QS.filter(q=>si>=BANK.length||q.ci===si),q=list[Math.floor(t/6)%list.length];
  c.save(); c.shadowColor='rgba(0,0,0,.5)'; c.shadowBlur=16; c.fillStyle='#fffaf0'; rr(c,150,40,500,96,18); c.fill(); c.restore(); c.fillStyle='#2a1040'; c.font='900 23px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(q.q,W/2,76);
  c.font='900 14px '+TC; c.fillStyle='#3a8aff'; c.textAlign='left'; c.fillText('1 '+q.lo,180,112); c.textAlign='right'; c.fillStyle='#ff3a5a'; c.fillText(q.hi+' 10',620,112); c.textAlign='center';
  const nums=[2,5,8,10],ph=(t%6)/6,C=window.ARCADE_CHAR; nums.forEach((n,k)=>{ const x=190+k*140,y=300; if(C) C.drawChar(c,x,y-15,PCOL[k],1,false,t+k,1.2,BOTLOOK(k).char,BOTLOOK(k).deco);
    const a=q.a[n-1][k%2]; c.font='900 15px '+TC; const bw=124; c.fillStyle='#fff'; rr(c,x-bw/2,y-112,bw,44,10); c.fill(); c.fillStyle='#2a1040'; const ls=wrapLines(c,a,bw-10,2); ls.forEach((l,j)=>c.fillText(l,x,y-90+(j-(ls.length-1)/2)*17));
    const fl=clamp((ph-.35-k*.12)/.08,0,1); numCard(c,x,y+60,54,72,n,fl>=.5,Math.cos(fl*Math.PI),false,false); });
  for(let k=0;k<6;k++) heart(c,W-150+k*24,24,8,'#ff4f8b',false);
  c.font='900 26px '+TC; c.lineWidth=6; c.strokeStyle='#2a1040'; c.strokeText(STAGES[si],W/2,450); c.fillStyle='#ffd23f'; c.fillText(STAGES[si],W/2,450); ctx.restore(); }
const LSn=k=>{ try{ return +localStorage.getItem(k)||0; }catch(e){ return 0; } };
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).dial={
  name:'心中有數',tag:'TOP OF MIND',color:'#ff5aa8',online:true,maxPlayers:9,minPlayers:4,
  desc:'合作猜心派對遊戲！每人暗抽 1～10 的數字牌，照數字的程度回答題目，主持人聽完從小到大翻牌。30 個題目、4 種題庫，4～9 人連線進同一個房間，或大家用一台輪流玩。',
  goal:'每人照自己數字的程度回答，主持人從小到大一張張翻牌；翻到比上一張小就碎一顆默契心。撐過 5 輪大家一起贏，心全碎就輸。',
  stages:STAGES,stageLabel:'選擇題庫',stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,Math.floor(t/6)%STAGES.length,t),
  stageGoal:i=>(i<BANK.length?'題庫「'+BANK[i][0]+'」':'四種題庫混在一起')+'。照自己數字的程度回答（1 最低、10 最高），主持人從小到大翻牌，翻錯碎一顆心，撐過 5 輪就贏。',
  modes:[{id:'room',label:'大家用一台'}],
  options:[{key:'n',label:'玩家人數',def:'5',solo:true,opts:[{id:'4',label:'4 人'},{id:'5',label:'5 人'},{id:'6',label:'6 人'},{id:'7',label:'7 人'},{id:'8',label:'8 人'},{id:'9',label:'9 人'}]}],
  help:[['Enter','連線：打好答案送出（💡 給你靈感）'],['滑鼠點牌','主持人從小到大翻牌'],['空白鍵','大家用一台：看數字、說完換下一位']],
  touchHelp:[['打字回答','連線時照自己的數字程度回答'],['點牌','主持人從小到大翻牌'],['大家用一台','輪流偷看數字，用說的回答']],touch:null,
  looks:[{key:'char',label:'人物',opts:[{id:'cap',label:'帽子'},{id:'cat',label:'貓耳'},{id:'bunny',label:'兔耳'},{id:'crown',label:'皇冠'},{id:'chef',label:'廚師'},{id:'pirate',label:'海盜'},{id:'ninja',label:'忍者'},{id:'bow',label:'蝴蝶結'}]},{key:'color',label:'人物顏色',type:'color',opts:['auto','#ff7a3d','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d','#3ddbd9','#ff7eb6']}],
  preview:(ctx,w,h,L,t)=>{ ctx.drawImage(bg(),0,0,w,h); const C=window.ARCADE_CHAR; if(C) C.drawChar(ctx,w/2,h*.6,!L||!L.color||L.color==='auto'?PCOL[0]:L.color,1,false,t,2.6,(L&&L.char)||'cap',''); },
  hubBest:()=>{ const v=LSn('arcade.dial.w'); return v?'一起過關 <b>'+v+'</b> 次':'尚無紀錄'; },
  best:{label:'',fmt:v=>v,lower:false},create};
})();
