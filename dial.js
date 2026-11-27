// 腦波對頻：兩隊輪流。每回合抽一張「兩端相反」的卡（例如 冷 ↔ 熱），轉盤上藏著一個目標位置，只有提示人看得到。
// 提示人給一個提示詞（例如「洗澡水」），隊友轉指針猜目標在哪；對手再猜目標在指針左邊還是右邊。
// 計分照實體桌遊：正中 4 分、旁邊 3 分、外圈 2 分；對手猜對左右 +1（正中紅心時不算）。後攻隊先拿 1 分；拿 4 分還落後的隊伍可以再玩一回合。先到 10 分獲勝。
// 單人＝你和電腦隊友對電腦隊；雙人同一台（同隊打電腦或分兩隊）；大家用一台（兩隊真人輪流）；連線最多 8 人。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const gauss=()=>{ let u=0,v=0; while(!u) u=Math.random(); while(!v) v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v); };
/* 題卡：左端|右端|提示詞:位置（0＝最左、100＝最右）。電腦出提示、猜指針都照這些位置 */
const BANK=[
['日常生活',`冷|熱|北極:1 冰塊:5 雪人:9 冬天清晨:20 冷氣房:28 自來水:40 溫開水:55 夏天中午:70 洗澡水:76 熱咖啡:84 火鍋湯:91 太陽表面:99
便宜|昂貴|路邊的石頭:1 茶葉蛋:6 一包衛生紙:11 珍珠奶茶:19 便當:24 電影票:31 運動鞋:45 牛排大餐:52 手機:66 機車:74 名牌包:84 跑車:94 豪宅:99
安靜|吵鬧|深夜的房間:3 圖書館:7 考場:12 公園的早上:28 咖啡廳:36 教室下課:58 菜市場:70 夜市:76 KTV:84 施工現場:90 演唱會:94 放鞭炮:97
乾淨|髒|手術室:2 剛洗好的衣服:8 新買的手機:13 飯店房間:17 辦公室:34 書包:47 機車坐墊:58 雨天的鞋子:68 公共廁所:75 運動後的襪子:84 垃圾桶:90 下水道:97
清晨會做的事|深夜會做的事|晨跑:4 吃早餐:9 送小孩上學:14 喝第一杯咖啡:21 開會:36 吃午餐:46 下午茶:58 吃晚餐:68 洗澡:77 追劇:83 吃宵夜:90 熬夜打電動:96
很簡單|超困難|呼吸:1 眨眼:4 煮泡麵:10 綁鞋帶:15 騎腳踏車:29 游泳:43 早起:56 考駕照:61 學外語:72 戒菸:80 爬上聖母峰:93 中樂透頭獎:99
一下子就沒了|永遠都在|眨眼:2 打噴嚏:5 煙火:10 彩虹:18 冰淇淋融化:22 一首歌:29 一場電影:36 暑假:48 手機電池:58 刺青:84 金字塔:94 鑽石:98
軟|硬|雲:1 棉花糖:4 布丁:7 枕頭:11 豆腐:15 麵包:25 橡皮擦:43 牛排:52 蘋果:61 木頭桌子:79 石頭:90 鑽石:99
危險|安全|跟鯊魚游泳:3 闖紅燈:9 玩火:13 吃河豚:24 高空彈跳:30 騎機車:42 爬山:55 坐雲霄飛車:62 搭飛機:70 散步:84 在家看電視:91 睡覺:96
輕|重|羽毛:1 衛生紙:5 手機:17 一本書:27 筆電:35 書包:41 西瓜:51 行李箱:64 機車:79 汽車:87 大象:93 鯨魚:98`],
['吃吃喝喝',`難吃|好吃|黑暗料理:2 過期麵包:6 中藥:13 醫院伙食:25 苦瓜:31 營養午餐:48 泡麵:61 牛舌餅:66 雞排:79 生日蛋糕:85 媽媽的菜:89 五星級牛排:95
健康|不健康|燙青菜:3 水果沙拉:8 糙米飯:12 水煮蛋:16 牛奶:22 壽司:35 牛肉麵:50 漢堡:69 泡麵:77 鹹酥雞:85 可樂:89 炸雞配啤酒:96
清淡|重口味|白開水:1 白粥:5 蒸蛋:12 清湯:17 炒青菜:27 壽司:33 滷肉飯:54 三杯雞:64 咖哩:70 泡菜:76 臭豆腐:86 麻辣鍋:96
早餐|宵夜|燒餅油條:4 蛋餅:7 三明治:13 飯糰:19 便當:44 牛肉麵:52 下午茶點心:59 火鍋:69 烤肉串:79 滷味:85 泡麵:89 鹹酥雞:94
甜|鹹|蜂蜜:1 棉花糖:4 巧克力:7 蛋糕:11 鳳梨酥:20 月餅:30 番茄:42 爆米花:48 洋芋片:77 鹹蛋:89 醬油:96 海水:99
小孩愛吃|大人愛吃|棒棒糖:3 果凍:7 炸雞塊:12 薯條:17 披薩:30 壽司:49 牛排:59 臭豆腐:71 皮蛋:80 生蠔:85 苦瓜:89 黑咖啡:94
夏天吃|冬天吃|芒果冰:3 西瓜:6 冰淇淋:9 涼麵:15 壽司:35 鹹酥雞:50 牛肉麵:64 烤地瓜:78 熱可可:82 火鍋:86 羊肉爐:93 薑母鴨:97
正常的吃法|怪怪的吃法|白飯配滷肉:3 薯條沾番茄醬:6 咖啡配蛋糕:10 豆花加花生:16 炸雞配鬆餅:39 西瓜沾鹽:46 披薩加鳳梨:55 薯條沾冰淇淋:62 珍奶火鍋:79 美乃滋配西瓜:86 巧克力配泡麵:91 牙膏配餅乾:99
家常菜|異國料理|番茄炒蛋:3 滷肉飯:6 牛肉麵:12 水餃:16 拉麵:54 壽司:59 泡菜鍋:62 咖哩:66 披薩:73 墨西哥捲餅:87 西班牙海鮮飯:92 法式蝸牛:98
吃得超飽|吃不飽|吃到飽餐廳:2 火鍋套餐:9 牛肉麵:17 便當:21 一碗白飯:40 三明治:54 一根香蕉:67 沙拉:72 優格:78 一顆小籠包:86 一顆糖果:95 一片洋芋片:97`],
['人與個性',`內向|外向|作家:22 圖書館員:18 貓:25 畫家:30 上班族:48 老師:63 狗:78 業務員:82 網紅:85 啦啦隊:89 主持人:93 宅在家的人:8
人人討厭|人人喜歡|蟑螂:2 蚊子:4 插隊的人:8 考試:13 鬧鐘:20 星期一:26 數學課:40 午休:69 小狗:87 熊貓:90 放假:93 發薪日:97
沒用的超能力|超有用的超能力|跟螞蟻說話:5 讓頭髮變長:10 看到更多顏色:20 不會流汗:31 夜視:49 秒睡:55 吃不胖:65 隱形:74 讀心術:80 瞬間移動:94 讓時間暫停:97 治好所有的病:99
很孩子氣|很大人|哭著要糖果:3 扮家家酒:8 看卡通:19 打電動:29 熬夜追劇:35 自己煮飯:59 吃苦瓜:68 早睡早起:72 記帳:78 開會:81 繳房租:86 存退休金:95
冷靜|激動|和尚:3 圖書館員:12 法官:15 下棋高手:20 醫生:26 老師改考卷:44 塞車中的司機:74 被插隊:80 搶限量球鞋:85 看決賽的球迷:90 中發票:92 演唱會的歌迷:95
普通的禮物|超驚喜的禮物|一包衛生紙:2 原子筆:6 襪子:15 馬克杯:20 巧克力:30 香水:50 手寫卡片:55 耳機:61 演唱會門票:80 一隻小狗:86 出國機票:92 一台車:97
爛藉口|好藉口|被外星人抓走:2 睡過頭:9 我在路上了:19 鬧鐘沒響:29 幫老奶奶過馬路:35 鞋子壞了:41 家裡的貓生病:47 塞車:56 身體不舒服:70 捷運故障:80 颱風天:95
平凡|傳奇|路人甲:2 鄰居阿姨:6 上班族:11 班長:22 里長:39 網紅:54 冠軍主廚:68 奧運選手:80 總統:85 太空人:88 愛因斯坦:96 超人:99
小事|天大的事|掉一根頭髮:2 奶茶沒有珍珠:10 忘記帶傘:16 手機沒電:30 考試考砸:49 錢包掉了:56 搬家:65 換工作:72 結婚:88 中樂透:90 生小孩:93 世界末日:100
可愛|可怕|小貓:3 兔子:5 熊貓:8 企鵝:12 青蛙:40 老師點名:55 小丑:65 老虎:70 蛇:78 蜘蛛:81 鯊魚:86 鬼:96`],
['腦洞大開',`很普通|超不可思議|下雨:2 彩虹:14 下冰雹:21 雙彩虹:30 自動駕駛車:36 會說話的鸚鵡:42 機器人管家:55 火星移民:70 隱形斗篷:85 會飛的豬:90 時光旅行:94 貓咪統治地球:97
沒用的發明|偉大的發明|會唱歌的馬桶:5 雨傘帽:11 指尖陀螺:16 自拍棒:35 電動牙刷:45 鬧鐘:60 冷氣:80 手機:89 電燈:92 輪子:94 網路:96 抗生素:98
不可能發生|一定會發生|豬會飛:1 中樂透頭獎:3 遇到外星人:4 撿到一億元:6 台北下大雪:15 颱風天放假:50 便利商店要排隊:79 考試前想睡:85 下午會肚子餓:90 鬧鐘響了還想睡:93 捷運上有人滑手機:97 星期一會到來:99
地球上|外太空|海底:2 你家:5 高山上:15 熱氣球:25 雲上面:31 飛機上:36 太空站:75 月球:85 火星:90 太陽:93 銀河中心:97 黑洞裡:99
很古老|很未來|恐龍:1 金字塔:5 武士刀:12 毛筆:15 蒸汽火車:35 黑白電視:44 手機:65 自動駕駛車:74 機器人:80 飛天汽車:91 瞬間移動:95 時光機:97
童話故事|現實生活|會說話的狼:3 魔法掃帚:4 美人魚:6 噴火龍:8 玻璃鞋:12 公主:38 城堡:50 白馬:56 南瓜:79 加班:95 塞車:97 繳稅:99
讓人大笑|讓人大哭|搔癢:3 小丑:6 整人節目:9 貓咪影片:13 婚禮:50 畢業典禮:64 看牙醫:69 考卷發下來:75 切洋蔥:80 悲劇電影:89 分手:94 寵物離開:97
荒島上超有用|荒島上沒用|水:2 打火機:4 刀子:6 帳篷:10 漁網:13 手電筒:21 一本書:54 沒訊號的手機:70 遊戲機:84 鈔票:90 西裝領帶:93 吹風機:96
好行為|壞行為|讓座給老人:3 幫忙撿東西:6 準時還錢:12 善意的謊言:39 偷偷放屁:49 已讀不回:55 搶最後一塊披薩:61 吃掉室友的布丁:66 插隊:75 偷看別人手機:81 劈腿:92 詐騙:98
適合約會|不適合約會|浪漫晚餐:3 海邊看夕陽:4 摩天輪:6 遊樂園:12 看電影:16 逛夜市:21 打保齡球:34 逛大賣場:54 傳統市場買菜:61 一起加班:80 牙醫診所:92 考場:96`]];
const CARDS=[]; BANK.forEach(([cat,txt],ci)=>txt.trim().split('\n').forEach(line=>{ const [l,r,it]=line.split('|'); CARDS.push({ci,l,r,it:it.trim().split(/\s+/).map(s=>{ const k=s.lastIndexOf(':'); return {w:s.slice(0,k),p:+s.slice(k+1)}; }).sort((a,b)=>a.p-b.p)}); }));
const STAGES=BANK.map(b=>b[0]).concat(['綜合隨機']);
const TN=['日光隊','月光隊'],TCOL=['#ff9f43','#5b8cff'],TDK=['#7a3a00','#1d2f7a'];
const PCOL=['#ff7a3d','#4f9dff','#ffb02a','#7a8aff','#ff5d6d','#3ddbd9','#ffd23f','#c56bff'];
const BOTN=['阿波','小頻','嘟嘟','咪寶','阿樂','球球','小花','胖虎'];
const BOTLOOK=i=>({char:['crown','cat','bunny','chef','cap','bow','pirate','ninja'][i%8],deco:['blush','','scarf','shades'][i%4]});
const BAND=[[3.5,4],[10.5,3],[17.5,2]];
const ptsOf=d=>{ d=Math.abs(d); for(const [w,p] of BAND) if(d<=w) return p; return 0; };
const BCOL={4:'#ff4f7b',3:'#ff9f43',2:'#ffd84a'};
/* 轉盤座標：pos 0 在左、100 在右，畫布角度 -π → 0 */
const CX=400,CY=318,R=188;
const angOf=p=>-Math.PI+clamp(p,0,100)/100*Math.PI;
/* ---------- 背景：深夜廣播電台 ---------- */
let BG=null;
function bg(){ if(BG) return BG; const e=document.createElement('canvas'); e.width=W*2; e.height=H*2; const c=e.getContext('2d'); c.scale(2,2);
  const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#101a3a'); g.addColorStop(.6,'#1b1240'); g.addColorStop(1,'#0a0a1c'); c.fillStyle=g; c.fillRect(0,0,W,H);
  /* 隔音牆 */ c.globalAlpha=.07; for(let y=60;y<H;y+=26) for(let x=(y/26%2)*13;x<W;x+=26){ c.fillStyle='#9fb6ff'; c.beginPath(); c.moveTo(x,y); c.lineTo(x+13,y+13); c.lineTo(x,y+26); c.lineTo(x-13,y+13); c.fill(); } c.globalAlpha=1;
  /* 電波圈 */ for(let k=1;k<7;k++){ c.strokeStyle='rgba(120,200,255,'+(.09-k*.011)+')'; c.lineWidth=2; c.beginPath(); c.arc(CX,CY,R+k*34,Math.PI,TAU); c.stroke(); }
  /* 桌面 */ const tg=c.createLinearGradient(0,CY,0,H); tg.addColorStop(0,'#5a3622'); tg.addColorStop(.1,'#3d2416'); tg.addColorStop(1,'#1e110a'); c.fillStyle=tg; c.fillRect(0,CY+4,W,H-CY); for(let i=0;i<14;i++){ c.strokeStyle='rgba(0,0,0,.18)'; c.lineWidth=1; c.beginPath(); c.moveTo(0,CY+14+i*13); c.bezierCurveTo(260,CY+10+i*13+6,540,CY+20+i*13-5,W,CY+14+i*13); c.stroke(); }
  c.fillStyle='rgba(255,220,180,.25)'; c.fillRect(0,CY+4,W,2);
  /* 吊燈光 */ const lg=c.createRadialGradient(CX,CY-40,20,CX,CY-40,360); lg.addColorStop(0,'rgba(255,230,170,.16)'); lg.addColorStop(1,'rgba(255,230,170,0)'); c.fillStyle=lg; c.fillRect(0,0,W,H);
  return BG=e; }
/* 轉盤底座（不含目標、指針、蓋子） */
let DIALC=null;
function dialBase(){ if(DIALC) return DIALC; const e=document.createElement('canvas'); e.width=W*2; e.height=H*2; const c=e.getContext('2d'); c.scale(2,2);
  c.save(); c.shadowColor='rgba(0,0,0,.6)'; c.shadowBlur=24; c.shadowOffsetY=10; c.fillStyle='#2a2f45'; c.beginPath(); c.arc(CX,CY,R+20,Math.PI,TAU); c.lineTo(CX+R+20,CY+14); c.lineTo(CX-R-20,CY+14); c.closePath(); c.fill(); c.restore();
  /* 金屬外框 */ const mg=c.createLinearGradient(CX-R,CY-R,CX+R,CY); mg.addColorStop(0,'#d9dde8'); mg.addColorStop(.35,'#8a91a8'); mg.addColorStop(.6,'#f2f4fa'); mg.addColorStop(1,'#70778e'); c.fillStyle=mg; c.beginPath(); c.arc(CX,CY,R+16,Math.PI,TAU); c.lineTo(CX+R+16,CY+12); c.lineTo(CX-R-16,CY+12); c.closePath(); c.fill();
  /* 面板 */ const fg=c.createRadialGradient(CX,CY-60,10,CX,CY,R); fg.addColorStop(0,'#fff8ea'); fg.addColorStop(1,'#e9dcc2'); c.fillStyle=fg; c.beginPath(); c.arc(CX,CY,R,Math.PI,TAU); c.closePath(); c.fill();
  /* 刻度 */ for(let i=0;i<=50;i++){ const a=angOf(i*2),big=i%5===0; c.strokeStyle=big?'rgba(60,40,30,.55)':'rgba(60,40,30,.25)'; c.lineWidth=big?2:1; c.beginPath(); c.moveTo(CX+Math.cos(a)*(R-2),CY+Math.sin(a)*(R-2)); c.lineTo(CX+Math.cos(a)*(R-(big?14:8)),CY+Math.sin(a)*(R-(big?14:8))); c.stroke(); }
  c.fillStyle='#d6c7a8'; c.fillRect(CX-R-16,CY,2*R+32,12); c.fillStyle='rgba(0,0,0,.25)'; c.fillRect(CX-R-16,CY+10,2*R+32,2);
  return DIALC=e; }
function wedge(c,tg,alpha){ c.save(); c.globalAlpha=alpha; c.beginPath(); c.arc(CX,CY,R-1,Math.PI,TAU); c.closePath(); c.clip();
  const sl=[[-17.5,-10.5,2],[-10.5,-3.5,3],[-3.5,3.5,4],[3.5,10.5,3],[10.5,17.5,2]];
  for(const [a,b,p] of sl){ c.fillStyle=BCOL[p]; c.beginPath(); c.moveTo(CX,CY); c.arc(CX,CY,R-1,angOf(tg+a),angOf(tg+b)); c.closePath(); c.fill(); c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=1.5; c.stroke(); }
  c.textAlign='center'; c.textBaseline='middle'; c.font='900 20px '+TC; for(const [a,b,p] of sl){ const m=angOf(tg+(a+b)/2); if(tg+(a+b)/2<1||tg+(a+b)/2>99) continue; c.fillStyle='rgba(60,20,20,.75)'; c.fillText(p,CX+Math.cos(m)*(R-28),CY+Math.sin(m)*(R-28)); }
  c.restore(); }
function needle(c,p,col,glow){ const a=angOf(p),x=CX+Math.cos(a)*(R-12),y=CY+Math.sin(a)*(R-12);
  c.save(); if(glow){ c.shadowColor=col; c.shadowBlur=16; } c.strokeStyle='rgba(0,0,0,.3)'; c.lineWidth=9; c.lineCap='round'; c.beginPath(); c.moveTo(CX+3,CY+4); c.lineTo(x+3,y+4); c.stroke();
  c.strokeStyle=col; c.lineWidth=7; c.beginPath(); c.moveTo(CX,CY); c.lineTo(x,y); c.stroke(); c.fillStyle=col; c.beginPath(); c.arc(x,y,7,0,TAU); c.fill(); c.restore();
  const kg=c.createRadialGradient(CX-6,CY-8,2,CX,CY,26); kg.addColorStop(0,'#fff'); kg.addColorStop(.4,'#c8ccd8'); kg.addColorStop(1,'#5a6078'); c.fillStyle=kg; c.beginPath(); c.arc(CX,CY,24,0,TAU); c.fill(); c.fillStyle=col; c.beginPath(); c.arc(CX,CY,9,0,TAU); c.fill(); }
/* 蓋子：open 0＝蓋住、1＝轉到下面藏起來 */
function lid(c,open,t){ if(open>=.999) return; c.save(); c.beginPath(); c.rect(CX-R-30,CY-R-30,2*R+60,R+30); c.clip(); c.translate(CX,CY); c.rotate(open*Math.PI);
  const g=c.createLinearGradient(-R,-R,R,0); g.addColorStop(0,'#26306a'); g.addColorStop(1,'#10163a'); c.fillStyle=g; c.beginPath(); c.arc(0,0,R+2,Math.PI,TAU); c.closePath(); c.fill();
  c.strokeStyle='rgba(140,200,255,.5)'; c.lineWidth=3; c.stroke();
  for(let k=1;k<5;k++){ c.strokeStyle='rgba(120,200,255,'+(.12+.08*Math.sin(t*3-k))+')'; c.lineWidth=2; c.beginPath(); c.arc(0,0,k*40,Math.PI,TAU); c.stroke(); }
  for(let i=0;i<22;i++){ const a=-Math.PI+((i*.618)%1)*Math.PI,d=30+((i*.37)%1)*(R-40); c.fillStyle='rgba(255,255,255,'+(.3+.3*Math.sin(t*2+i))+')'; c.beginPath(); c.arc(Math.cos(a)*d,Math.sin(a)*d,1.4,0,TAU); c.fill(); }
  c.fillStyle='rgba(255,255,255,.85)'; c.font='900 22px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('？',0,-R*.55); c.restore(); }
function cardDraw(c,cd,y){ const lw=200;
  for(let s=0;s<2;s++){ const x=s?CX+8:CX-8-lw,col=s?'#36c2b4':'#ff6b8a'; c.save(); c.shadowColor='rgba(0,0,0,.45)'; c.shadowBlur=8; c.shadowOffsetY=3; c.fillStyle=col; rr(c,x,y,lw,44,12); c.fill(); c.restore();
    c.fillStyle='rgba(255,255,255,.18)'; rr(c,x+3,y+3,lw-6,16,8); c.fill(); c.fillStyle='#fff'; c.font='900 '+(cd[s?'r':'l'].length>7?15:19)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText((s?'':'◀ ')+cd[s?'r':'l']+(s?' ▶':''),x+lw/2,y+23); } }

function create(env,opts){
  const {ctx:c,canvas}=env.canvas2d(W,H),net=opts.net,client=!!net&&!net.host,host=!client,pv=!!opts.preview,OP=opts.options||{},si=clamp(opts.stage|0,0,STAGES.length-1);
  const room=!net&&!pv&&opts.mode==='room',two=!net&&!pv&&opts.mode==='2p',GOAL=+OP.goal||10;
  const humans=pv?0:net?net.count:room?2:two?2:1,me=net?net.me:0;
  let coop=OP.team==='coop'; if(!net&&!two) coop=false; if(net&&net.count>=8) coop=false;
  /* 座位與隊伍 */
  const team=[],bot=[],names=[],looks=[];
  if(room){ for(let i=0;i<2;i++){ team.push(i); bot.push(false); names.push(TN[i]); looks.push({char:i?'bunny':'cap'}); } }
  else { let n; if(net) n=coop?Math.min(8,net.count+clamp(net.count,2,8-net.count)):Math.max(4,Math.min(8,net.count+(net.bots||0))); else n=4;
    if(net&&!coop&&n%2) n=Math.min(8,n+1);
    let bi=0; for(let i=0;i<n;i++){ const h=i<humans; bot.push(!h);
      team.push(i%2);
      if(h){ names.push(net?(net.names&&net.names[i])||'玩家'+(i+1):two?(i+1)+'P':(opts.name||'你')); looks.push(net?(net.looks&&net.looks[i])||{}:i===0?opts.look||{}:{}); } else { names.push(BOTN[bi%BOTN.length]); looks.push(BOTLOOK(bi)); bi++; } }
    /* 單人／預覽：0、1 是日光隊，2、3 是月光隊；同隊打電腦：真人全在日光隊 */
    if(!net&&!two){ team[0]=0; team[1]=0; team[2]=1; team[3]=1; }
    if(coop){ for(let i=0;i<n;i++) team[i]=i<humans?0:1; } }
  const N=team.length,members=k=>{ const a=[]; for(let i=0;i<N;i++) if(team[i]===k) a.push(i); return a; };
  const myTeam=net?team[me]:room||(two&&!coop)?-1:0;
  const local=i=>!pv&&!bot[i]&&(net?i===me:true);
  const needPeek=!net&&!pv&&(room||two);
  const colOf=i=>{ const L=looks[i]; return !L||!L.color||L.color==='auto'?(room?TCOL[i]:PCOL[i%8]):L.color; };
  /* 牌堆 */
  const pool=CARDS.map((q,k)=>k).filter(k=>si>=BANK.length||CARDS[k].ci===si); for(let k=pool.length-1;k>0;k--){ const j=Math.floor(Math.random()*(k+1)),tt=pool[k]; pool[k]=pool[j]; pool[j]=tt; }
  const first=Math.random()<.5?0:1;
  const newG=()=>({ph:'intro',PT:pv?1.2:3.6,turn:first,first,sc:first?[1,0]:[0,1],rnd:0,deck:0,card:-1,tg:50,ps:-1,clue:null,nd:50,lr:null,peek:false,chips:[],pk:[0,(!net&&!two&&!room)?0:0],last:null,catch:false,hist:[],bg:50,gt:0,win:-1});
  let G=newG(); if(!net&&!two&&!room) G.pk=[1,0]; /* 單人第一回合先看電腦隊友示範 */
  let revT=0,t=0,ended=false,sendT=0,fx=[],pops=[],btns=[],drag=false,ndLocal=50,ndSendT=0,disp=50,lidO=0,prevPh='',prevRnd=-1,tickP=50,hoverB=-1,bannerT=0;
  const sfx=k=>{ if(!pv) env.sfx(k); };
  const tone=(f,d,type,v)=>{ const A=env.audio&&env.audio(); if(!A||pv) return; try{ const o=A.createOscillator(),g=A.createGain(),t0=A.currentTime; o.type=type||'sine'; o.frequency.value=f; g.gain.setValueAtTime(v||.06,t0); g.gain.exponentialRampToValueAtTime(.001,t0+d); o.connect(g); g.connect((env.out&&env.out())||A.destination); o.start(t0); o.stop(t0+d+.02); }catch(e){} };
  const CD=()=>CARDS[G.card];
  const guessers=k=>room?[k]:members(k).filter(i=>i!==G.ps);
  const allBotGuess=()=>guessers(G.turn).every(i=>bot[i]);
  const oppHuman=()=>members(1-G.turn).some(i=>!bot[i]);
  const SP=pv?.55:1;
  /* ---------- 房主流程 ---------- */
  function startTurn(){ G.rnd++; G.card=pool[G.deck++%pool.length]; G.tg=4+Math.random()*92; const m=room?[G.turn]:members(G.turn); G.ps=m[G.pk[G.turn]%m.length]; G.pk[G.turn]++;
    G.clue=null; G.nd=50; G.lr=null; G.peek=false; G.last=null; G.gt=0; G.ph='clue'; G.PT=bot[G.ps]?2.8*SP:0;
    /* 提示詞卡：最接近目標的兩個＋隨機四個 */ const it=CD().it,ord=it.map((x,k)=>k).sort((a,b)=>Math.abs(it[a].p-G.tg)-Math.abs(it[b].p-G.tg)),rest=ord.slice(2); for(let k=rest.length-1;k>0;k--){ const j=Math.floor(Math.random()*(k+1)),tt=rest[k]; rest[k]=rest[j]; rest[j]=tt; }
    G.chips=ord.slice(0,2).concat(rest.slice(0,4)).sort((a,b)=>Math.random()-.5); }
  function setClue(txt,item){ txt=String(txt||'').replace(/[<>&"']/g,'').trim().slice(0,14); if(!txt) return; if(item==null){ const k=CD().it.findIndex(x=>x.w===txt); if(k>=0) item=k; }
    G.clue={t:txt,item:item==null?null:item}; G.ph='guess'; G.gt=0; G.PT=0; G.nd=50;
    const est=item!=null?CD().it[item].p:50; G.bg=clamp(est+gauss()*9,1,99); }
  function lockGuess(){ if(G.ph!=='guess') return; G.ph='lr'; G.PT=2.4*SP; G.lr=null; }
  function botLR(){ const it=G.clue&&G.clue.item!=null?CD().it[G.clue.item].p:50,e=it+gauss()*(G.clue&&G.clue.item!=null?9:28); return e<G.nd?0:1; }
  function reveal(){ const d=G.tg-G.nd,p=ptsOf(d),side=d<0?0:1,opp=p<4&&G.lr===side?1:0; G.sc[G.turn]+=p; G.sc[1-G.turn]+=opp;
    G.catch=p===4&&G.sc[G.turn]<G.sc[1-G.turn]; G.last={p,opp,side}; G.hist.push({team:G.turn,card:G.card,clue:G.clue?G.clue.t:'',ps:G.ps,p,opp,tg:Math.round(G.tg),nd:Math.round(G.nd)}); G.ph='reveal'; G.PT=5.2*SP; }
  function afterReveal(){ const a=G.sc[0],b=G.sc[1]; if(Math.max(a,b)>=GOAL&&a!==b){ G.win=a>b?0:1; G.ph='final'; G.PT=4; return; } if(!G.catch) G.turn=1-G.turn; startTurn(); }
  function doAct(from,a){ if(!a||ended) return;
    if(a.k==='peek'&&G.ph==='clue'&&!net) G.peek=true;
    else if(a.k==='clue'&&G.ph==='clue'&&!G.clue&&(net?from===G.ps:!bot[G.ps])){ const it=a.item!=null&&CD().it[a.item]?a.item:null; if(it==null&&allBotGuess()) return; setClue(it!=null?CD().it[it].w:a.t,it); }
    else if((a.k==='nd'||a.k==='ok')&&G.ph==='guess'&&!allBotGuess()&&(net?guessers(G.turn).includes(from)&&!bot[from]:true)){ if(typeof a.v==='number') G.nd=clamp(a.v,0,100); if(a.k==='ok') lockGuess(); }
    else if(a.k==='lr'&&G.ph==='lr'&&G.lr==null&&oppHuman()&&(net?team[from]!==G.turn&&!bot[from]:true)){ G.lr=a.v?1:0; reveal(); } }
  function hostStep(dt){ G.PT-=dt;
    if(G.ph==='intro'){ if(G.PT<=0) startTurn(); }
    else if(G.ph==='clue'){ if(bot[G.ps]&&G.PT<=0){ const it=CD().it,ord=it.map((x,k)=>k).sort((a,b)=>Math.abs(it[a].p-G.tg)-Math.abs(it[b].p-G.tg)),k=Math.random()<.65?ord[0]:ord[1]; setClue(it[k].w,k); } }
    else if(G.ph==='guess'){ if(allBotGuess()){ G.gt+=dt/SP; const k=clamp((G.gt-.8)/2.4,0,1),e=k*k*(3-2*k); G.nd=clamp(50+(G.bg-50)*e+Math.sin(G.gt*5)*(1-e)*6*(k>0?1:0),0,100); if(G.gt>4.2){ G.nd=G.bg; lockGuess(); } } }
    else if(G.ph==='lr'){ if(!oppHuman()&&G.PT<=0){ G.lr=botLR(); reveal(); } }
    else if(G.ph==='reveal'){ if(G.PT<=0) afterReveal(); }
    else if(G.ph==='final'&&G.PT<=0&&!ended){ if(pv){ const p=G.pk; G=newG(); G.pk=p; return; } ended=true; if(net) net.send({G,end:1}); finish(); }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/10; net.send({G}); } } }
  if(net){ if(client) net.onmsg=m=>{ if(m.G){ G=m.G; } if(m.end&&!ended){ ended=true; finish(); } };
    else { net.onmsg=(m,from)=>{ if(m.a) doAct(from,m.a); }; net.onleave=i=>{ if(i>0&&i<N){ bot[i]=true; names[i]+='（電腦）'; } }; } }
  const act=a=>{ if(client) net.send({a}); else doAct(me,a); };
  /* ---------- 提示輸入框 ---------- */
  const wrap=document.createElement('div'); wrap.style.cssText='position:absolute;z-index:6;display:none;gap:6px'; const inp=document.createElement('input'); inp.maxLength=14; inp.placeholder='自己想一個提示（不能說數字）'; inp.autocomplete='off'; inp.style.cssText='flex:1;min-width:0;font:700 15px '+TC+';padding:4px 10px;border-radius:10px;border:2px solid #7ac8ff;background:#fff;color:#1a1e3a';
  const sb=document.createElement('button'); sb.textContent='送出提示'; sb.style.cssText='font:900 14px '+TC+';padding:0 14px;border-radius:10px;border:0;background:#ffd23f;color:#2a1e0e;white-space:nowrap;cursor:pointer'; wrap.append(inp,sb); if(!pv) env.stage.appendChild(wrap);
  const sendClue=()=>{ const v=inp.value.trim(); if(!v) return; if(/^[0-9０-９%％.\s]+$/.test(v)){ inp.value=''; inp.placeholder='不能只打數字喔'; return; } act({k:'clue',t:v}); inp.value=''; sfx('click'); inp.blur(); };
  sb.addEventListener('click',sendClue); inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ sendClue(); e.preventDefault(); } e.stopPropagation(); }); inp.addEventListener('keyup',e=>e.stopPropagation());
  const place=()=>{ const r=canvas.getBoundingClientRect(),st=env.stage.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=r.left+(r.width-W*s)/2-st.left,oy=r.top+(r.height-H*s)/2-st.top; wrap.style.left=(ox+220*s)+'px'; wrap.style.top=(oy+398*s)+'px'; wrap.style.width=(360*s)+'px'; wrap.style.height=(34*s)+'px'; }; addEventListener('resize',place); place();
  /* ---------- 這台看到的狀態 ---------- */
  const iAmPs=()=>G.ps>=0&&local(G.ps);
  const canClue=()=>G.ph==='clue'&&!G.clue&&iAmPs()&&(!needPeek||G.peek);
  const freeOK=()=>!allBotGuess();
  const canDrag=()=>G.ph==='guess'&&!allBotGuess()&&guessers(G.turn).some(i=>local(i));
  const canLR=()=>G.ph==='lr'&&G.lr==null&&oppHuman()&&members(1-G.turn).some(i=>local(i));
  const showTg=()=>G.ph==='reveal'||G.ph==='final'?true:G.ps<0||!iAmPs()?false:needPeek?(G.ph==='clue'&&G.peek):(G.ph==='clue'||G.ph==='guess'||G.ph==='lr');
  /* ---------- 輸入 ---------- */
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const inR=(x,y,b)=>x>=b.x&&y>=b.y&&x<=b.x+b.w&&y<=b.y+b.h;
  const posAt=(x,y)=>{ let a=Math.atan2(CY-y,x-CX); if(y>CY) a=x<CX?Math.PI:0; return clamp(100-a/Math.PI*100,0,100); };
  function setNd(v){ v=clamp(v,0,100); if(client){ ndLocal=v; ndSendT=0; } else G.nd=v; if(Math.abs(v-tickP)>=4){ tickP=v; tone(1400,.025,'square',.025); } }
  const pd=e=>{ if(pv) return; const [x,y]=toG(e); for(const b of btns) if(inR(x,y,b)){ b.fn(); sfx('click'); return; }
    if(canDrag()&&Math.hypot(x-CX,y-CY)<R+40&&y<CY+30){ drag=true; ndLocal=G.nd; setNd(posAt(x,y)); try{ canvas.setPointerCapture(e.pointerId); }catch(er){} } };
  const pm=e=>{ if(pv) return; const [x,y]=toG(e); hoverB=btns.findIndex(b=>inR(x,y,b)); if(drag&&canDrag()) setNd(posAt(x,y)); };
  const pu=()=>{ if(drag&&client) net.send({a:{k:'nd',v:ndLocal}}); drag=false; };
  canvas.addEventListener('pointerdown',pd); canvas.addEventListener('pointermove',pm); canvas.addEventListener('pointerup',pu); canvas.addEventListener('pointercancel',pu);
  const curNd=()=>client&&(drag||ndSendT<.6)&&canDrag()?ndLocal:G.nd;
  const confirm=()=>{ if(!canDrag()) return; act({k:'ok',v:curNd()}); };
  /* ---------- 更新 ---------- */
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt; if(host) hostStep(dt); else { ndSendT+=dt; }
    if(!pv&&document.activeElement!==inp){ if(canDrag()){ const K=env.keys||{},sp=(K.ShiftLeft||K.ShiftRight?14:38)*dt; if(K.ArrowLeft||K.KeyA) setNd(curNd()-sp); if(K.ArrowRight||K.KeyD) setNd(curNd()+sp); if(env.hit('Enter')||env.hit('Space')) confirm(); }
      else if(canLR()){ if(env.hit('ArrowLeft')||env.hit('KeyA')) act({k:'lr',v:0}); else if(env.hit('ArrowRight')||env.hit('KeyD')) act({k:'lr',v:1}); }
      else if(G.ph==='clue'&&iAmPs()&&needPeek&&!G.peek&&(env.hit('Enter')||env.hit('Space'))) act({k:'peek'});
      else if(canClue()&&!freeOK()){ for(let k=0;k<6;k++) if(env.hit('Digit'+(k+1))) act({k:'clue',item:G.chips[k]}); } }
    if(client&&drag){ ndSendT+=0; if((t*10|0)!==((t-dt)*10|0)) net.send({a:{k:'nd',v:ndLocal}}); }
    if(!pv){ const show=canClue()&&freeOK(); const was=wrap.style.display==='flex'; wrap.style.display=show?'flex':'none'; if(show&&!was){ place(); if(!env.touch) setTimeout(()=>{ try{ inp.focus(); }catch(e){} },50); } }
    const target=curNd(); disp+=(target-disp)*Math.min(1,dt*14);
    const want=showTg()?1:0; lidO=want?Math.min(1,lidO+dt*1.4):Math.max(0,lidO-dt*3);
    if(revT>0){ revT-=dt; if(revT<=0) revealFx(); }
    if(G.ph!==prevPh||G.rnd!==prevRnd){ onPhase(); prevPh=G.ph; prevRnd=G.rnd; }
    if(bannerT>0) bannerT-=dt;
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=420*dt; f.r+=f.vr*dt; if(f.l<=0) fx.splice(i,1); }
    for(let i=pops.length-1;i>=0;i--){ pops[i].l-=dt; if(pops[i].l<=0) pops.splice(i,1); } }
  function onPhase(){ if(G.ph==='clue'){ sfx('beep'); bannerT=2.2; disp=50; }
    if(G.ph==='guess'&&G.clue){ tone(520,.12,'triangle'); tone(780,.16,'triangle'); }
    if(G.ph==='lr') tone(660,.1,'triangle');
    if(G.ph==='reveal'&&G.last) revT=.75;
    if(G.ph==='final'){ const w=G.win; sfx(myTeam<0||w===myTeam?'win':'lose'); for(let k=0;k<60;k++) fx.push({x:W/2+(Math.random()-.5)*500,y:120,vx:(Math.random()-.5)*400,vy:-200-Math.random()*240,l:2,c:[TCOL[w],'#fff','#ffd84a'][k%3],r:0,vr:(Math.random()-.5)*10}); } }
  function revealFx(){ const L=G.last; if(!L||ended) return; const tm=G.hist.length?G.hist[G.hist.length-1].team:G.turn;
    if(L.p===4){ sfx('win'); for(let k=0;k<46;k++) fx.push({x:CX+(Math.random()-.5)*120,y:CY-120,vx:(Math.random()-.5)*520,vy:-260-Math.random()*260,l:1.6,c:['#ff4f7b','#ffd84a','#5bd1ff','#ff9f43'][k%4],r:0,vr:(Math.random()-.5)*12}); } else if(L.p>0) sfx('item'); else sfx('bump');
    if(L.p) pops.push({tx:'+'+L.p,team:tm,l:2.4}); if(L.opp) pops.push({tx:'+1',team:1-tm,l:2.4}); }
  function finish(){ if(pv){ env.end({}); return; } const w=G.win<0?(G.sc[0]>=G.sc[1]?0:1):G.win,mine=myTeam<0||w===myTeam;
    if(!net&&!room&&!two&&mine){ try{ localStorage.setItem('arcade.dial.w',String((+localStorage.getItem('arcade.dial.w')||0)+1)); }catch(e){} }
    const rows=G.hist.map((h,k)=>{ const cd=CARDS[h.card]; return '<tr><td style="color:'+TCOL[h.team]+'">'+TN[h.team]+'</td><td>'+cd.l+' ↔ '+cd.r+'</td><td>'+(h.clue||'')+'</td><td>'+(h.p?'+'+h.p:'0')+(h.opp?'（對手 +1）':'')+'</td></tr>'; }).slice(-12).join('');
    const nice=G.hist.filter(h=>h.p===4&&(myTeam<0||h.team===myTeam)).length;
    env.end({title:myTeam<0?TN[w]+'獲勝！'+(two?'（'+members(w).filter(i=>!bot[i]).map(i=>names[i]).join('、')+'）':''):mine?(net||two?TN[w]+'獲勝！你們贏了':'你們隊贏了！'):TN[w]+'獲勝',big:TN[0]+' '+G.sc[0]+' : '+G.sc[1]+' '+TN[1],
      text:'共 '+G.hist.length+' 回合'+(nice?'，正中紅心 '+nice+' 次！':''),html:'<table class="ls"><tr><th>隊伍</th><th>題卡</th><th>提示</th><th>得分</th></tr>'+rows+'</table>',score:null}); }
  /* ---------- 畫面 ---------- */
  function person(x,y,i,s){ const C=window.ARCADE_CHAR,L=looks[i]||{}; c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(x,y,13*s,4*s,0,0,TAU); c.fill(); if(C) C.drawChar(c,x,y-15*s,colOf(i),1,false,t+i,s*1.1,L.char||'cap',L.deco||''); }
  function btn(x,y,w,h,tx,col,fn,sub){ const k=btns.length,hv=hoverB===k; btns.push({x,y,w,h,fn}); c.save(); c.shadowColor='rgba(0,0,0,.45)'; c.shadowBlur=10; c.shadowOffsetY=4; c.fillStyle=col; rr(c,x,y-(hv?2:0),w,h,14); c.fill(); c.restore(); c.fillStyle='rgba(255,255,255,.25)'; rr(c,x+4,y+3-(hv?2:0),w-8,h*.38,10); c.fill();
    c.fillStyle='#1a1430'; c.font='900 '+(h>40?18:15)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(tx,x+w/2,y+h/2-(sub?7:0)-(hv?2:0)); if(sub){ c.font='700 11px '+TC; c.fillStyle='rgba(26,20,48,.7)'; c.fillText(sub,x+w/2,y+h/2+11-(hv?2:0)); } }
  function teamPanel(k){ const x=k?W-176:12,y=62,w=164,act=G.turn===k&&G.ph!=='intro'&&G.ph!=='final',m=room?[k]:members(k);
    c.save(); if(act){ c.shadowColor=TCOL[k]; c.shadowBlur=18+6*Math.sin(t*4); } c.fillStyle='rgba(12,14,36,.78)'; rr(c,x,y,w,248,16); c.fill(); c.restore(); c.strokeStyle=act?TCOL[k]:'rgba(255,255,255,.12)'; c.lineWidth=act?3:1.5; rr(c,x,y,w,248,16); c.stroke();
    c.fillStyle=TCOL[k]; rr(c,x,y,w,34,16); c.fill(); c.fillRect(x,y+18,w,16); c.fillStyle='#fff'; c.font='900 16px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText((k?'🌙 ':'☀ ')+TN[k]+(myTeam===k&&!two?'（你）':''),x+w/2,y+18);
    c.font='900 38px '+TC; c.fillStyle='#fff'; c.fillText(G.sc[k],x+w/2,y+64); let pop=pops.find(p=>p.team===k); if(pop){ const a=Math.min(1,pop.l); c.globalAlpha=a; c.fillStyle='#ffd84a'; c.font='900 24px '+TC; c.fillText(pop.tx,x+w/2+44,y+56-(2.4-pop.l)*12); c.globalAlpha=1; }
    /* 進度格 */ const pw=(w-24)/GOAL; for(let i=0;i<GOAL;i++){ c.fillStyle=i<G.sc[k]?TCOL[k]:'rgba(255,255,255,.12)'; rr(c,x+12+i*pw,y+92,pw-3,8,3); c.fill(); }
    c.fillStyle='rgba(255,255,255,.5)'; c.font='700 11px '+TC; c.fillText(GOAL+' 分獲勝',x+w/2,y+112);
    const step=Math.min(70,(w-30)/Math.max(1,Math.min(m.length,2))),rows=Math.ceil(m.length/2);
    m.forEach((i,j)=>{ const col=j%2,row=Math.floor(j/2),cnt=Math.min(2,m.length-row*2),px=x+w/2+(col-(cnt-1)/2)*step,py=y+(rows>1?166+row*62:190); person(px,py,i,rows>1?.8:1.05);
      const isPs=G.ps===i&&G.ph!=='intro'&&G.ph!=='final'; c.font=(local(i)&&net?'900 ':'700 ')+'11px '+TC; const nm=room?(isPs?'提示人':''):names[i].slice(0,6); if(nm){ const ww=c.measureText(nm).width+12; c.fillStyle=net&&i===me?'#ffd23f':'rgba(0,0,0,.55)'; rr(c,px-ww/2,py+6,ww,16,8); c.fill(); c.fillStyle=net&&i===me?'#2a1e0e':'#fff'; c.fillText(nm,px,py+14); }
      if(isPs){ c.save(); c.translate(px+(room?24:22),py-(rows>1?34:44)); c.scale(1+.08*Math.sin(t*5),1+.08*Math.sin(t*5)); c.font='16px '+TC; c.fillText('🔮',0,0); c.restore(); } });
    if(k===G.first&&G.rnd<=1&&G.ph!=='final'){} }
  function statusLine(s,col){ c.fillStyle=col||'#e8ecff'; c.font='900 17px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(s,W/2,386); }
  function draw(){ btns=[]; c.drawImage(bg(),0,0,W,H); const cd=G.card>=0?CD():CARDS[pool[0]];
    /* 上方：回合 */ c.fillStyle='rgba(8,10,30,.7)'; rr(c,W/2-150,8,300,40,14); c.fill(); c.textAlign='center'; c.textBaseline='middle'; c.font='900 17px '+TC; c.fillStyle='#fff';
    c.fillText(G.ph==='intro'?'腦波對頻':G.ph==='final'?'比賽結束':'第 '+G.rnd+' 回合　'+TN[G.turn]+'出題',W/2,28);
    teamPanel(0); teamPanel(1);
    c.drawImage(dialBase(),0,0,W,H);
    if(G.ph!=='intro'&&lidO>.01) wedge(c,G.tg,Math.min(1,lidO*1.5));
    lid(c,G.ph==='intro'?0:lidO,t);
    if(G.ph!=='intro'&&G.ph!=='clue') needle(c,disp,'#e8323c',canDrag());
    else needle(c,50,'#8a8fa8',false);
    if(G.ph==='intro'||G.card<0) cardDraw(c,{l:'冷',r:'熱'},332); else cardDraw(c,cd,332);
    /* 提示泡泡 */ if(G.clue&&G.ph!=='intro'){ c.font='900 22px '+TC; const s='「'+G.clue.t+'」',w=Math.max(160,c.measureText(s).width+60); c.save(); c.shadowColor='rgba(0,0,0,.5)'; c.shadowBlur=12; c.fillStyle='#fffbe8'; rr(c,W/2-w/2,58,w,52,18); c.fill(); c.beginPath(); c.moveTo(W/2-10,108); c.lineTo(W/2+10,108); c.lineTo(W/2,120); c.fill(); c.restore();
      c.fillStyle='#2a1e3e'; c.textAlign='center'; c.fillText(s,W/2,92); c.font='700 11px '+TC; c.fillStyle='#8a6a40'; c.fillText(room?TN[G.turn]+'提示人':names[G.ps]+' 的提示',W/2,70); }
    /* 下方：依階段 */
    const P=G.ps>=0?(room?TN[G.turn]+'提示人':names[G.ps]):'';
    if(G.ph==='intro'){ c.fillStyle='rgba(8,10,30,.82)'; rr(c,W/2-230,120,460,170,22); c.fill(); c.fillStyle='#fff'; c.font='900 30px '+TC; c.textAlign='center'; c.fillText('腦波對頻',W/2,158);
      c.font='700 15px '+TC; c.fillStyle='#cfe4ff'; c.fillText('提示人給一個詞，隊友把指針轉到目標上',W/2,196); c.fillText('正中 4 分、旁邊 3 分、外圈 2 分，先到 '+GOAL+' 分獲勝',W/2,220);
      c.fillStyle='#ffd84a'; c.font='900 16px '+TC; c.fillText(TN[G.first]+'先出題，'+TN[1-G.first]+'先拿 1 分',W/2,256);
      if(!net&&!room&&!pv){ c.fillStyle='#fff'; c.font='700 13px '+TC; c.fillText(two&&!coop?'1P、2P 各帶一個電腦隊友':two?'1P、2P 同一隊，對手是電腦':'你和電腦隊友「'+names[1]+'」一隊',W/2,280); } }
    else if(G.ph==='clue'){ if(bannerT>0){ const a=Math.min(1,bannerT); c.globalAlpha=a; c.fillStyle=TCOL[G.turn]; c.font='900 20px '+TC; c.textAlign='center'; c.fillText(room?TN[G.turn]+'出題':P+' 當提示人',W/2,84); c.globalAlpha=1; }
      if(!iAmPs()) statusLine('🔮 '+P+' 正在想提示…');
      else if(needPeek&&!G.peek){ statusLine((room?TN[G.turn]+'：派一個人當提示人':P+' 是提示人')+'，其他人先別看螢幕！','#ffd84a'); btn(W/2-130,410,260,58,'👀 我是提示人，偷看目標','#ffd84a',()=>act({k:'peek'}),'看完給提示，再把螢幕給隊友'); }
      else { statusLine(freeOK()?'目標在彩色區中間，打一個提示或點下面的詞':'目標在彩色區中間，選一個最符合位置的詞','#ffd84a');
        const cw=118,gap=8,x0=W/2-(6*cw+5*gap)/2,y0=freeOK()?442:412,h=freeOK()?42:58; G.chips.forEach((k,j)=>{ const w=cd.it[k].w; btn(x0+j*(cw+gap),y0,cw,h,w,'#e8f2ff',()=>act({k:'clue',item:k,t:w}),freeOK()?'':(env.touch?'':'按 '+(j+1))); }); } }
    else if(G.ph==='guess'){ if(canDrag()){ statusLine('拖曳指針到你覺得的位置','#ffd84a'); btn(W/2-90,410,180,56,'✔ 確定','#7affa0',confirm,env.touch?'':'Enter'); }
      else statusLine(TN[G.turn]+' 正在轉指針…'); }
    else if(G.ph==='lr'){ if(canLR()){ statusLine(TN[1-G.turn]+'：目標在指針的左邊還是右邊？猜對 +1','#ffd84a'); btn(W/2-250,410,230,56,'⬅ 在左邊','#ff8aa6',()=>act({k:'lr',v:0}),env.touch?'':'← 鍵'); btn(W/2+20,410,230,56,'在右邊 ➡','#6fe0d2',()=>act({k:'lr',v:1}),env.touch?'':'→ 鍵'); }
      else statusLine(TN[1-G.turn]+' 正在猜目標在左邊還是右邊…'); }
    else if(G.ph==='reveal'&&G.last){ const L=G.last,k=Math.min(1,(5.2*SP-G.PT)/.9); c.globalAlpha=k; const msg=L.p===4?'🎯 正中紅心！+4':L.p===3?'很接近！+3':L.p===2?'有中！+2':'沒中… 0 分';
      c.fillStyle=L.p===4?'#ff6b95':L.p?'#ffd84a':'#aab4d8'; c.font='900 28px '+TC; c.textAlign='center'; c.fillText(msg,W/2,400);
      c.font='700 15px '+TC; c.fillStyle='#e8ecff'; c.fillText(TN[1-G.turn]+'猜「'+(G.lr?'右邊':'左邊')+'」'+(L.p===4?'（正中紅心不算左右）':L.opp?' ✔ 猜對 +1':' ✘ 猜錯'),W/2,434);
      if(G.catch){ c.fillStyle='#7affa0'; c.font='900 16px '+TC; c.fillText('拿 4 分還落後，'+TN[G.turn]+'再玩一回合！',W/2,462); } c.globalAlpha=1; }
    else if(G.ph==='final'){ const w=G.win; c.fillStyle='rgba(8,10,30,.85)'; rr(c,W/2-210,130,420,140,22); c.fill(); c.fillStyle=TCOL[w]; c.font='900 34px '+TC; c.textAlign='center'; c.fillText('🏆 '+TN[w]+'獲勝！',W/2,180); c.fillStyle='#fff'; c.font='900 22px '+TC; c.fillText(G.sc[0]+' : '+G.sc[1],W/2,228); }
    if(G.ph==='guess'||G.ph==='lr'||G.ph==='reveal'){ /* 目前指針讀數（不顯示目標） */ }
    for(const f of fx){ c.save(); c.globalAlpha=Math.min(1,f.l); c.translate(f.x,f.y); c.rotate(f.r); c.fillStyle=f.c; c.fillRect(-4,-2.5,8,5); c.restore(); }
    if(t<7&&G.rnd<=1&&!pv&&canDrag()&&!env.touch){ c.fillStyle='rgba(255,255,255,.75)'; c.font='700 12px '+TC; c.textAlign='center'; c.fillText('也可以用 ← → 轉指針（按住 Shift 微調）',W/2,486); } }
  return {update,draw,destroy(){ removeEventListener('resize',place); if(wrap.parentNode) wrap.remove(); canvas.removeEventListener('pointerdown',pd); canvas.removeEventListener('pointermove',pm); canvas.removeEventListener('pointerup',pu); canvas.removeEventListener('pointercancel',pu); },
    _dbg:{get G(){ return G; },set G(v){ G=v; },doAct,CARDS,team,bot,names,members,ptsOf,lockGuess,reveal}};
}
function stageShow(ctx,w,h,si,t){ ctx.save(); ctx.scale(w/W,h/H); ctx.drawImage(bg(),0,0,W,H); ctx.drawImage(dialBase(),0,0,W,H);
  const list=CARDS.filter(q=>si>=BANK.length||q.ci===si),cd=list[Math.floor(t/5)%list.length],k=Math.floor(t/5),tg=20+((k*37)%60),ph=(t%5)/5;
  const c=ctx; if(ph>.6){ wedge(c,tg,1); lid(c,clamp((ph-.6)/.15,0,1),t); } else lid(c,0,t);
  const nd=50+(tg+((k*13)%15-7)-50)*clamp((ph-.15)/.4,0,1); needle(c,nd,'#e8323c',false); cardDraw(c,cd,332);
  const it=cd.it.slice().sort((a,b)=>Math.abs(a.p-tg)-Math.abs(b.p-tg))[0]; c.font='900 22px '+TC; const s='「'+it.w+'」',bw=c.measureText(s).width+60; c.fillStyle='#fffbe8'; rr(c,W/2-bw/2,60,bw,46,18); c.fill(); c.fillStyle='#2a1e3e'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(s,W/2,84);
  const C=window.ARCADE_CHAR; if(C){ C.drawChar(c,110,250,TCOL[0],1,false,t,1.6,'crown','blush'); C.drawChar(c,690,250,TCOL[1],1,false,t+1,1.6,'bunny',''); }
  c.font='900 26px '+TC; c.lineWidth=6; c.strokeStyle='#10163a'; c.strokeText(STAGES[si],W/2,430); c.fillStyle='#ffd84a'; c.fillText(STAGES[si],W/2,430); ctx.restore(); }
const wins=()=>{ try{ return +localStorage.getItem('arcade.dial.w')||0; }catch(e){ return 0; } };
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).dial={
  name:'腦波對頻',tag:'MIND DIAL',color:'#5bd1ff',online:true,maxPlayers:8,minPlayers:2,bots:true,
  desc:'轉盤上藏著一個目標，只有提示人看得到！提示人給一個詞，隊友轉指針猜位置，越準分數越高。40 張題卡、480 個提示詞，單人配電腦隊友、雙人、大家用一台或連線都能玩。',
  goal:'提示人看目標、給一個詞，隊友把指針轉過去：正中 4 分、旁邊 3 分、外圈 2 分；對手猜左右對了 +1。先到 10 分的隊伍贏。',
  stages:STAGES,stageLabel:'選擇題庫',stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,Math.floor(t/5)%STAGES.length,t),
  stageGoal:i=>(i<BANK.length?'「'+BANK[i][0]+'」10 張題卡':'40 張題卡全部混在一起')+'。提示人給一個詞，隊友轉指針；正中 4 分、旁邊 3 分、外圈 2 分，對手猜左右對了 +1。',
  modes:[{id:'1p',label:'單人（配電腦隊友）'},{id:'2p',label:'雙人同一台'},{id:'room',label:'大家用一台（分兩隊）'}],
  options:[{key:'goal',label:'獲勝分數',def:'10',opts:[{id:'10',label:'10 分'},{id:'6',label:'6 分（快速）'}]},
    {key:'team',label:'雙人／連線',def:'split',opts:[{id:'split',label:'分兩隊對戰'},{id:'coop',label:'玩家同隊打電腦'}]}],
  help:[['滑鼠拖曳 ← →','轉動指針'],['Enter','確定指針位置'],['← →','對手猜目標在左邊或右邊'],['提示人','打一個提示詞，或點下面的詞']],
  touchHelp:[['拖曳轉盤','轉動指針'],['確定','送出指針位置'],['左邊／右邊','對手猜目標在哪一邊'],['提示人','打字或點一個提示詞']],touch:null,
  looks:[{key:'char',label:'人物',opts:[{id:'cap',label:'帽子'},{id:'cat',label:'貓耳'},{id:'bunny',label:'兔耳'},{id:'crown',label:'皇冠'},{id:'chef',label:'廚師'},{id:'pirate',label:'海盜'},{id:'ninja',label:'忍者'},{id:'bow',label:'蝴蝶結'}]},{key:'color',label:'人物顏色',type:'color',opts:['auto','#ff7a3d','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d','#3ddbd9','#ff7eb6']}],
  preview:(ctx,w,h,L,t)=>{ ctx.drawImage(bg(),0,0,w,h); const C=window.ARCADE_CHAR; if(C) C.drawChar(ctx,w/2,h*.6,!L||!L.color||L.color==='auto'?PCOL[0]:L.color,1,false,t,2.6,(L&&L.char)||'cap',''); },
  hubBest:()=>{ const v=wins(); return v?'單人贏了 <b>'+v+'</b> 場':'尚無紀錄'; },
  best:{label:'',fmt:v=>v,lower:false},create};
})();
