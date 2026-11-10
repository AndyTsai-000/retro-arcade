// 臥底在身邊：每人拿到一個詞，臥底的詞跟大家很像但不一樣。輪流用一句話描述，投票找出臥底。
// 單人配電腦；連線由房主主持（電腦可補人）。連自己都不知道是不是臥底。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,pick=a=>a[Math.floor(Math.random()*a.length)];
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const LS=(k,v)=>{ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } };
/* 詞組：平民詞｜臥底詞｜兩個都適用的描述｜只適合第一個｜只適合第二個（哪個是臥底詞每局隨機） */
const RAW=`珍珠奶茶|綠茶|手搖飲料店有賣,可以調甜度冰塊,用杯子裝著喝|有QQ的料,要用粗吸管|顏色淡淡的,喝起來有點澀
牛肉麵|拉麵|熱熱的一大碗,有湯又有麵,用筷子吃|台灣很有名,常常加酸菜|日本來的,常放溏心蛋
便利商店|超市|買東西的地方,有冷藏櫃,結帳要排隊|二十四小時都開,可以繳費領包裹|要推推車,通常比較大間
捷運|公車|大眾運輸,上班族常搭,可以刷悠遊卡|在軌道上跑,有月台|走在馬路上,下車要按鈴
機車|腳踏車|兩個輪子,可以載人,騎的時候要小心|要加油,要考駕照|要用腳踩,很環保
貓|狗|常見的寵物,毛茸茸的,會撒嬌|喜歡鑽紙箱,會喵喵叫|要帶出去散步,會搖尾巴
包子|饅頭|早餐常吃,用蒸的,白白軟軟|裡面有包餡,常常是肉|裡面沒有餡,可以夾蛋
火鍋|燒烤|很多人一起吃,自己動手煮,要準備沾醬|有一鍋湯,冬天最想吃|會冒煙,中秋節必備
醫生|護士|在醫院工作,常穿白色衣服,照顧病人|會開藥,要讀很多年醫學系|幫忙打針量血壓,常常輪大夜班
西瓜|哈密瓜|夏天的水果,水分很多,很甜|外皮綠色條紋,裡面紅紅的有黑籽|外皮有網紋,果肉是橘色
枕頭|棉被|睡覺會用,放在床上,軟軟的|墊在頭下面,有人會抱著睡|蓋在身上,冬天要厚一點
雨傘|雨衣|下雨天用,可以擋雨,出門前要記得帶|要用手撐著,可以收起來|穿在身上,騎車常用
鋼琴|吉他|樂器,可以自彈自唱,要練很久|黑白鍵,很重搬不動|有六條弦,可以背著走
足球|籃球|球類運動,分兩隊比賽,很會流汗|主要用腳踢,有守門員|要投進籃框,可以運球
漢堡|三明治|早餐店有賣,中間夾東西,可以帶著吃|圓圓的麵包,速食店招牌|常切成三角形,用吐司做
電影院|KTV|休閒娛樂,可以跟朋友去,裡面暗暗的|要安靜不能講話,有大螢幕跟爆米花|可以大聲唱歌,有包廂
眼鏡|隱形眼鏡|近視要戴,幫你看清楚,要配度數|架在鼻樑上,有鏡框|直接戴在眼睛裡,要泡藥水
手機|平板|3C產品,有觸控螢幕,可以看影片|可以放口袋,每天都帶著|螢幕比較大,很少拿來打電話
夜市|菜市場|很多攤販,很熱鬧,可以殺價|晚上才開,有很多小吃跟遊戲|早上去,買菜買肉
太陽|月亮|掛在天上,圓圓的,有很多神話故事|白天出現,很熱很刺眼|晚上出現,有陰晴圓缺
老師|校長|在學校,學生要聽他的,常常要講話|上課教書改考卷|一間學校只有一個,朝會常致詞
草莓|櫻桃|紅色水果,小小一顆,很適合放蛋糕上|表面有很多小籽,冬天大湖有產|有長長的梗,裡面有一顆籽
冰箱|冷氣|家電,會變冷,很耗電|放食物,有冷凍庫|裝在牆上,夏天一直吹
牙刷|牙膏|刷牙用,每天早晚都用,放在浴室|有刷毛,要定期換新|要擠出來,有薄荷味
鉛筆|原子筆|文具,用來寫字,放在筆袋|要削,寫錯可以用橡皮擦|有墨水,按一下就能寫
婚禮|生日派對|開心的日子,有蛋糕,會收到祝福|有新郎新娘,要包紅包|每年一次,要吹蠟燭
飛機|直升機|在天上飛,有駕駛員,聲音很大|有大大的機翼,出國要搭|螺旋槳在頭上,可以停在空中
蚊子|蒼蠅|小昆蟲,很煩人,會嗡嗡飛|會吸血,被咬會癢|喜歡停在食物上,會搓手
咖啡|奶茶|飲料,可以熱的或冰的,早上常喝|有咖啡因提神,有拿鐵美式|用茶加牛奶,很多人加珍珠
洗衣機|洗碗機|家電,會用水,幫你洗東西|洗衣服,要放洗衣精|放在廚房,洗盤子
消防員|警察|保護大家,穿制服,打電話就會來|打119,負責滅火|打110,負責抓壞人
衛生紙|濕紙巾|擦東西用,一張一張抽,出門會帶|乾乾的,可以丟馬桶|濕濕的,摸起來涼涼的
豆漿|米漿|早餐店飲料,可以喝熱的,常配燒餅油條|黃豆做的,還能做豆花|花生跟米做的,顏色咖啡色
海邊|游泳池|可以玩水,夏天常去,要擦防曬|有沙灘跟浪,可以撿貝殼|有消毒水味道,水是藍色磁磚
麥克風|喇叭|跟聲音有關,唱歌會用到,要接電|拿在手上對著講,收聲音|把聲音放大播出來
戒指|項鍊|飾品,常常是金的或銀的,可以當禮物|戴在手指上,求婚會用|戴在脖子上,可以掛墜子
熊貓|無尾熊|很可愛的動物,動物園人氣王,愛吃植物|黑白相間,吃竹子|抱著樹,從澳洲來的
魔術師|小丑|表演的人,逗大家開心,常在派對出現|會把東西變不見,戴高帽子|紅鼻子,畫大濃妝
吸塵器|掃把|打掃用,把灰塵弄走,家裡都有|要插電,轟轟很吵|要配畚箕,不用電
爆米花|洋芋片|零食,鹹鹹脆脆,看電影常吃|玉米做的,一顆一顆|馬鈴薯切薄片,一片一片
聖誕節|過年|冬天的節日,會收到禮物,家人會團聚|有聖誕樹,麋鹿拉雪橇|拿紅包,吃年夜飯
蝴蝶|蜜蜂|昆蟲,會飛,常在花旁邊|翅膀很漂亮,毛毛蟲變的|會螫人,會做蜂蜜
口罩|圍巾|遮住一部分臉,冬天常戴,出門會用|防病毒,掛在耳朵上|繞在脖子上,毛線織的
水餃|餛飩|有包餡,可以煮湯,冷凍庫常常有|形狀像元寶,過年會包|皮很薄,常常放在麵裡
摩天輪|雲霄飛車|遊樂園有,要排隊,可以到很高的地方|慢慢轉一圈,適合約會|很刺激會尖叫,有大迴環
鬧鐘|手錶|看時間,有指針或數字,要換電池|早上會吵醒你|戴在手腕上
樓梯|電梯|上下樓用,大樓裡都有,每天都會用到|一階一階爬,很好運動|按按鈕就會動,有時要等很久
鉛筆盒|書包|上學要帶,裝東西用,有很多卡通圖案|放筆跟橡皮擦,放在桌上|背在背上,裝課本`;
const PAIRS=RAW.trim().split('\n').map(l=>{ const [a,b,s,x,y]=l.split('|'); return {w:[a,b],s:s.split(','),o:[x.split(','),y.split(',')]}; });
const bg=s=>{ const o=new Set(); s=String(s).replace(/[\s，,。！？!?、～~]/g,''); for(let i=0;i<s.length-1;i++) o.add(s.slice(i,i+2)); return o; };
/* 玩家打的字比較像哪一個詞：0／1，分不出來就當成兩邊都適用的 's' */
const KW={'珍珠奶茶':[['珍珠','粉圓','QQ','Q彈','吸管','奶','甜','波霸','嚼'],['茶葉','澀','苦','清淡','淡淡','無糖','綠色','回甘','抹茶']],'牛肉麵':[['牛肉','酸菜','紅燒','清燉','牛腱','台灣'],['日本','溏心','叉燒','豚骨','味噌','日式','海苔']],'便利商店':[['24','二十四','繳費','包裹','小七','隨時','關東煮','御飯糰','便當'],['推車','大間','生鮮','量販','大量','蔬菜']],'捷運':[['軌道','月台','地下','車廂','列車','高架'],['馬路','按鈴','司機','站牌','塞車','下車鈴']],'機車':[['加油','駕照','引擎','汽油','車牌','排氣'],['踩','環保','運動','鏈條','自行車','Ubike','單車','踏板']],'貓':[['喵','紙箱','抓','貓砂','高冷','鬍鬚','爬高','逗貓'],['散步','搖尾巴','汪','忠心','看家','骨頭','遛']],'包子':[['餡','肉','菜包','豬肉','內餡'],['沒有餡','沒餡','夾蛋','原味','黑糖','實心']],'火鍋':[['湯','鍋','涮','冬天','麻辣','鍋底'],['煙','中秋','烤肉','炭','烤架','肉串','烤']],'醫生':[['開藥','醫學系','診斷','手術','看診','處方'],['打針','量血壓','輪班','大夜','照護','抽血','換藥']],'西瓜':[['紅紅','黑籽','條紋','綠皮','西瓜汁','很大顆'],['網紋','橘色','橘','香氣','新疆']],'枕頭':[['頭','抱著','墊','脖子'],['蓋','身上','厚','保暖']],'雨傘':[['撐','收起來','傘骨','手拿','折疊'],['穿','騎車','披','雨褲']],'鋼琴':[['黑白鍵','琴鍵','很重','演奏廳','88'],['弦','背著','撥','彈唱','六條','木吉他','電吉他']],'足球':[['腳','踢','守門員','世足','球門','射門','草地'],['投','籃框','運球','灌籃','三分','NBA','籃板']],'漢堡':[['圓圓','速食','麥當勞','漢堡排','牛肉餅'],['三角','吐司','切邊','火腿']],'電影院':[['大螢幕','爆米花','安靜','電影','影廳','3D'],['唱歌','包廂','麥克風','點歌','歡唱','唱']],'眼鏡':[['鼻樑','鏡框','鏡腳','掛在'],['眼睛裡','藥水','日拋','月拋','放大片']],'手機':[['口袋','打電話','隨身','通話'],['螢幕比較大','畫畫','iPad','不打電話']],'夜市':[['晚上','小吃','遊戲','雞排','撈魚','逛街'],['早上','買菜','肉攤','傳統','阿嬤','蔬菜']],'太陽':[['白天','熱','刺眼','曬','日出'],['晚上','圓缺','中秋','嫦娥','月餅','玉兔']],'老師':[['上課','教書','改考卷','班級','作業','黑板'],['只有一個','朝會','致詞','管老師','校長室']],'草莓':[['小籽','大湖','煉乳','草莓季'],['梗','一顆籽','核','車厘子','進口']],'冰箱':[['食物','冷凍','冰塊','放菜','飲料'],['吹','牆上','遙控','冷風']],'牙刷':[['刷毛','換新','刷頭','電動'],['擠','薄荷','泡泡']],'鉛筆':[['削','橡皮擦','筆芯','2B'],['墨水','按一下','擦不掉','立可白']],'婚禮':[['新郎','新娘','紅包','喜餅','結婚','喜宴','婚紗'],['蠟燭','吹','每年','許願','幾歲']],'飛機':[['機翼','出國','機場','登機','空服員'],['螺旋槳','停在空中','救援','停機坪']],'蚊子':[['吸血','癢','叮','蚊香','登革熱'],['搓手','食物','垃圾','大便','蒼蠅拍']],'咖啡':[['咖啡因','提神','拿鐵','美式','咖啡豆','星巴克'],['茶','牛奶','珍珠','紅茶']],'洗衣機':[['衣服','洗衣精','脫水','烘'],['廚房','盤子','碗','餐具']],'消防員':[['119','滅火','火災','水柱','消防車','救火'],['110','抓壞人','警車','罰單','手銬','壞人']],'衛生紙':[['乾乾','馬桶','廁所','擤鼻涕'],['濕','涼','酒精','嬰兒']],'豆漿':[['黃豆','豆花','豆腐'],['花生','米做','咖啡色','香濃']],'海邊':[['沙灘','浪','貝殼','大海','鹹','沙子'],['消毒水','磁磚','泳道','室內','水道']],'麥克風':[['拿在手','對著講','收音','講話'],['放大','播出','音響','播放']],'戒指':[['手指','求婚','婚戒'],['脖子','墜子']],'熊貓':[['黑白','竹子','圓仔','黑眼圈'],['抱樹','澳洲','尤加利','樹上','育兒袋']],'魔術師':[['變不見','高帽','撲克牌','兔子','變魔術'],['紅鼻子','濃妝','馬戲團','氣球','搞笑']],'吸塵器':[['插電','吵','吸','轟轟'],['畚箕','不用電','掃地']],'爆米花':[['玉米','一顆一顆','焦糖','爆'],['馬鈴薯','薄片','一片一片']],'聖誕節':[['聖誕樹','麋鹿','雪橇','聖誕老人','襪子','12月'],['紅包','年夜飯','鞭炮','春聯','農曆','壓歲錢']],'蝴蝶':[['翅膀','毛毛蟲','蛹','彩色'],['螫','蜂蜜','嗡','蜂窩','黃黑']],'口罩':[['病毒','耳朵','感冒','防疫','口鼻'],['脖子','毛線','織','保暖']],'水餃':[['元寶','過年','煎','餃子'],['皮很薄','麵裡','扁食','紅油','抄手']],'摩天輪':[['慢慢','轉一圈','約會','看風景'],['刺激','尖叫','迴環','很快','倒立','翻轉']],'鬧鐘':[['吵醒','早上','鈴','起床','床頭'],['手腕','錶帶','手上']],'樓梯':[['一階','爬','運動','台階'],['按鈕','等很久','超重','按']],'鉛筆盒':[['筆','橡皮擦','桌上'],['背','課本','肩膀','背帶']]};
/* 玩家打的字比較像哪一個詞（像一般人聽描述那樣判斷）：先看有沒有講到這個詞的特徵關鍵字，再比對描述用語。
   0／1＝明顯是那個詞；'s'＝兩個都說得通（模糊）；'u'＝聽不出來 */
function classify(P,txt){ txt=String(txt); const kw=KW[P.w[0]]||[[],[]],sc=[0,0]; for(let k=0;k<2;k++){ for(const w of kw[k]) if(txt.includes(w)) sc[k]+=2; if(txt.includes(P.w[k])) sc[k]+=3; const T=bg(txt),ref=bg(P.o[k].join('')); for(const g of T) if(ref.has(g)) sc[k]+=.5; }
  if(sc[0]>=sc[1]+1) return 0; if(sc[1]>=sc[0]+1) return 1; if(sc[0]+sc[1]>0) return 's'; const T=bg(txt),sh=bg(P.s.join('')+VAGUE.join('')); for(const g of T) if(sh.has(g)) return 's'; return 'u'; }
const VAGUE=['生活中常常看到','很多人都喜歡','小朋友也知道','我很常接觸到','台灣很多地方都有','有分很多種','價錢不一定','家裡附近就有','有人很討厭有人很愛','想到就覺得開心'];
const spiesOf=n=>n<=6?1:n<=9?2:3;
const BOTN=['阿明','小美','老王','阿珠','大頭','小林','阿翔','小芳','阿財','阿嬌','小虎','阿桃'];
const SK=['#ffe0c4','#f6cba4','#e8b48a','#d39a6e'],HR=['#3a2418','#1c1420','#8a4a22','#e0a040','#5a3a8a','#c84a3a','#2a4a6a','#f2c890'],CL=['#ff6b6b','#4d96ff','#6bcb77','#ffd93d','#b983ff','#ff9f45','#3ddbd9','#ff7eb6','#8d9eb8','#f4f4f4','#c27b4a','#2f8f6a'];
/* Q 版小人：大頭小身體、大眼睛兩個亮點、腮紅、ω 嘴 */
function chibi(c,x,y,s,i,t,o){ o=o||{}; c.save(); c.translate(x,y); c.scale(s,s); const INK='#2a1e2e',dead=o.dead,sk=dead?'#b4adb8':SK[i%4],h=dead?'#5a5460':HR[i%8],cl=dead?'#7a7482':CL[i%12],bob=dead?0:Math.sin(t*2.2+i)*1.2+(o.talk?Math.abs(Math.sin(t*9))*1.6:0);
  c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0,17,21,5,0,0,TAU); c.fill();
  c.lineWidth=2.2; c.strokeStyle=INK; c.lineJoin='round'; c.fillStyle=cl; c.beginPath(); c.moveTo(-16,16); c.quadraticCurveTo(-18,-6,0,-8); c.quadraticCurveTo(18,-6,16,16); c.closePath(); c.fill(); c.stroke();
  c.fillStyle='rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(-6,2,4,7,.3,0,TAU); c.fill();
  c.fillStyle=sk; for(const d of [-1,1]){ const up=o.talk&&d>0?Math.abs(Math.sin(t*6))*6:o.hand&&d>0?14:0; c.beginPath(); c.arc(d*16,7-up,4.6,0,TAU); c.fill(); c.stroke(); }
  c.translate(0,-bob);
  const st=i%5; c.fillStyle=h;
  if(st===1){ for(const d of [-1,1]){ c.beginPath(); c.arc(d*17,-46,8,0,TAU); c.fill(); c.stroke(); } }
  if(st===2){ c.beginPath(); c.moveTo(-23,-30); c.quadraticCurveTo(-27,-2,-16,-4); c.lineTo(16,-4); c.quadraticCurveTo(27,-2,23,-30); c.closePath(); c.fill(); c.stroke(); }
  if(st===4){ c.beginPath(); c.ellipse(20,-36,7,13,.5,0,TAU); c.fill(); c.stroke(); }
  c.fillStyle=sk; c.beginPath(); c.arc(0,-28,22,0,TAU); c.fill(); c.stroke();
  c.fillStyle=h; c.beginPath(); c.moveTo(-22.5,-27); c.bezierCurveTo(-24,-56,24,-56,22.5,-27);
  if(st===3){ c.lineTo(17,-36); c.lineTo(11,-30); c.lineTo(5,-38); c.lineTo(-2,-31); c.lineTo(-8,-38); c.lineTo(-14,-31); c.lineTo(-19,-36); }
  else { c.quadraticCurveTo(14,-40,2,-37); c.quadraticCurveTo(-12,-40,-22.5,-27); } c.closePath(); c.fill(); c.stroke();
  if(o.hat){ c.fillStyle=o.hat; c.beginPath(); c.ellipse(0,-47,20,5,0,0,TAU); c.fill(); c.stroke(); }
  c.fillStyle=INK;
  if(dead){ c.lineWidth=2.2; for(const d of [-1,1]){ c.beginPath(); c.moveTo(d*8-3.5,-29); c.lineTo(d*8+3.5,-22); c.moveTo(d*8+3.5,-29); c.lineTo(d*8-3.5,-22); c.stroke(); } }
  else if(o.shades){ c.fillStyle='#111'; for(const d of [-1,1]){ rr(c,d*9-7,-30,14,9,4); c.fill(); } c.fillRect(-3,-28,6,2); c.fillStyle='rgba(255,255,255,.6)'; c.fillRect(-13,-28,4,2); c.fillRect(5,-28,4,2); }
  else { const bl=Math.sin(t*1.3+i*2.1)>.985; for(const d of [-1,1]){ if(bl){ c.fillRect(d*8-4,-25,8,2); continue; } c.beginPath(); c.ellipse(d*8,-25,4.2,5.2,0,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(d*8-1.4,-27,1.6,0,TAU); c.fill(); c.beginPath(); c.arc(d*8+1.5,-23.4,.9,0,TAU); c.fill(); c.fillStyle=INK; } }
  if(!dead){ c.fillStyle='rgba(255,105,130,.45)'; c.beginPath(); c.ellipse(-14,-18,3.6,2.2,0,0,TAU); c.ellipse(14,-18,3.6,2.2,0,0,TAU); c.fill(); }
  c.strokeStyle=INK; c.lineWidth=1.7; c.beginPath();
  if(o.talk){ c.fillStyle='#8a2a3a'; c.ellipse(0,-16,3.2,1.5+Math.abs(Math.sin(t*12))*2.4,0,0,TAU); c.fill(); c.stroke(); }
  else if(dead){ c.moveTo(-4,-15); c.quadraticCurveTo(0,-18,4,-15); c.stroke(); }
  else { c.arc(-2.2,-17,2.2,.2,Math.PI-.2); c.moveTo(4.4,-17); c.arc(2.2,-17,2.2,.2,Math.PI-.2); c.stroke(); }
  c.restore(); }
/* 場景：晚上的客廳、桌燈、圓桌 */
function room(c,t,cx,cy,rx,ry){ const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#3a2550'); g.addColorStop(.55,'#4a2f5e'); g.addColorStop(.56,'#6a4430'); g.addColorStop(1,'#3e2618'); c.fillStyle=g; c.fillRect(0,0,W,H);
  c.fillStyle='rgba(255,255,255,.05)'; for(let y=12;y<270;y+=26) for(let x=(y/26%2)*20;x<W;x+=40){ c.beginPath(); c.arc(x,y,3,0,TAU); c.fill(); }
  // 窗戶與夜景
  c.fillStyle='#1a1440'; rr(c,40,40,170,120,8); c.fill(); const sky=c.createLinearGradient(0,44,0,156); sky.addColorStop(0,'#1d2a6a'); sky.addColorStop(1,'#6a4a9a'); c.fillStyle=sky; c.fillRect(48,48,154,104);
  for(let i=0;i<9;i++){ const bx=50+i*17,bh=24+(i*37)%50; c.fillStyle='#241a48'; c.fillRect(bx,152-bh,15,bh); c.fillStyle='#ffd98a'; for(let k=0;k<bh/10-1;k++) if((i+k)%3) c.fillRect(bx+4,156-bh+k*10,3,4); }
  c.fillStyle='#fff8d0'; c.beginPath(); c.arc(180,70,10,0,TAU); c.fill(); c.strokeStyle='#5a3a28'; c.lineWidth=6; c.strokeRect(44,44,162,112); c.beginPath(); c.moveTo(125,44); c.lineTo(125,156); c.stroke();
  // 掛畫與吊燈
  c.fillStyle='#c89a5a'; rr(c,560,50,90,64,4); c.fill(); c.fillStyle='#2f6f6a'; c.fillRect(567,57,76,50); c.fillStyle='#ffd23f'; c.beginPath(); c.arc(590,80,9,0,TAU); c.fill(); c.fillStyle='#6bcb77'; c.beginPath(); c.moveTo(567,107); c.lineTo(600,75); c.lineTo(643,107); c.fill();
  c.strokeStyle='#2a1e2e'; c.lineWidth=2; c.beginPath(); c.moveTo(cx,0); c.lineTo(cx,52); c.stroke(); c.fillStyle='#ffb347'; c.beginPath(); c.moveTo(cx-30,72); c.lineTo(cx-14,48); c.lineTo(cx+14,48); c.lineTo(cx+30,72); c.closePath(); c.fill(); c.stroke();
  const lg=c.createRadialGradient(cx,80,10,cx,cy,rx*1.3); lg.addColorStop(0,'rgba(255,220,140,.35)'); lg.addColorStop(1,'rgba(255,220,140,0)'); c.fillStyle=lg; c.fillRect(0,0,W,H);
  // 地板木紋
  c.strokeStyle='rgba(0,0,0,.18)'; c.lineWidth=1; for(let k=0;k<12;k++){ c.beginPath(); c.moveTo(cx+(k-6)*30,280); c.lineTo(cx+(k-6)*130,H); c.stroke(); }
  // 地毯
  c.fillStyle='#8a3a4a'; c.beginPath(); c.ellipse(cx,cy+20,rx+70,ry+48,0,0,TAU); c.fill(); c.strokeStyle='#e8c070'; c.lineWidth=3; c.setLineDash([8,6]); c.beginPath(); c.ellipse(cx,cy+20,rx+58,ry+38,0,0,TAU); c.stroke(); c.setLineDash([]); }
function table(c,cx,cy,t){ c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(cx,cy+16,150,52,0,0,TAU); c.fill(); c.fillStyle='#7a4a2a'; c.beginPath(); c.ellipse(cx,cy+8,146,48,0,0,TAU); c.fill(); c.fillStyle='#a8683a'; c.beginPath(); c.ellipse(cx,cy,146,48,0,0,TAU); c.fill();
  c.fillStyle='#f4ecd8'; c.beginPath(); c.ellipse(cx,cy,104,32,0,0,TAU); c.fill(); c.strokeStyle='#d8c8a8'; c.lineWidth=2; c.beginPath(); c.ellipse(cx,cy,94,27,0,0,TAU); c.stroke();
  // 桌上的卡片、杯子、零食
  for(let k=0;k<5;k++){ c.save(); c.translate(cx-60+k*30,cy-4+(k%2)*8); c.rotate(-.3+k*.15); c.fillStyle='#fff'; rr(c,-9,-12,18,24,3); c.fill(); c.strokeStyle='#4d96ff'; c.lineWidth=1.5; c.stroke(); c.fillStyle='#4d96ff'; c.font='900 10px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('?',0,1); c.restore(); }
  c.fillStyle='#fff'; c.beginPath(); c.ellipse(cx+76,cy-6,9,4,0,0,TAU); c.fill(); c.fillStyle='#ff9f45'; c.fillRect(cx+67,cy-6,18,12); c.fillStyle='#ffd93d'; c.beginPath(); c.ellipse(cx-84,cy+4,14,6,0,0,TAU); c.fill(); for(let k=0;k<5;k++){ c.fillStyle=['#fff7c8','#ffe08a'][k%2]; c.beginPath(); c.arc(cx-90+k*3,cy+1-(k%2)*2,3,0,TAU); c.fill(); } }
function bubble(c,x,y,txt,col,al){ c.save(); c.globalAlpha=al==null?1:al; c.font='800 11px '+TC; const lines=[]; let ln=''; for(const ch of txt){ if(c.measureText(ln+ch).width>104){ lines.push(ln); ln=''; } ln+=ch; } lines.push(ln); const L=lines.slice(0,3),w=Math.max(...L.map(s=>c.measureText(s).width))+14,h=L.length*14+8;
  x=clamp(x,w/2+4,W-188-w/2); c.fillStyle=col||'#fff'; rr(c,x-w/2,y-h,w,h,8); c.fill(); c.beginPath(); c.moveTo(x-5,y-1); c.lineTo(x,y+7); c.lineTo(x+5,y-1); c.fill(); c.strokeStyle='rgba(42,30,46,.5)'; c.lineWidth=1.2; rr(c,x-w/2,y-h,w,h,8); c.stroke();
  c.fillStyle='#2a1e2e'; c.textAlign='center'; c.textBaseline='middle'; L.forEach((s,k)=>c.fillText(s,x,y-h+11+k*14)); c.restore(); }
const CX=318,CY=290,RX=232,RY=112;
function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,OP=opts.options||{},humans=net?net.count:1,me=net?net.me:0,AUTO=!!opts._auto,pv=!!opts.preview;
  const n=clamp(net?net.count+(net.bots||0):+OP.seats||6,3,12);
  const TALK=+OP.talk||30,{ctx:c,canvas}=env.canvas2d(W,H),names=[]; for(let i=0;i<n;i++) names.push(i<humans?(net?(net.names&&net.names[i])||'玩家'+(i+1):(opts.name||'你')):BOTN[i%12]);
  const seat=i=>{ const a=Math.PI/2+(i-me)/n*TAU; return [CX+Math.cos(a)*RX,CY+Math.sin(a)*RY]; };
  const nsp=spiesOf(n),idx=[...Array(n).keys()].sort(()=>Math.random()-.5),role=Array(n).fill(false); for(let k=0;k<nsp;k++) role[idx[k]]=true;
  let G={pair:Math.floor(Math.random()*PAIRS.length),civ:Math.random()<.5?0:1,role,alive:Array(n).fill(true),ph:'intro',T:pv?2:8,round:0,order:[],speak:-1,hints:[...Array(n)].map(()=>[]),vote:{},out:-1,msg:'',win:null,sayN:0,warn:-1,warnT:0,nsp};
  let t=0,ended=false,sendT=0,botT=1,botSay=0,hover=-1,said={},used={};
  const sus=Array.from({length:n},()=>Array(n).fill(0)),odd=Array(n).fill(0),same=Array(n).fill(0);
  const sfx=k=>{ if(!pv) env.sfx(k); };
  const P=()=>PAIRS[G.pair],side=i=>G.role[i]?1-G.civ:G.civ,word=i=>P().w[side(i)];
  const aliveL=()=>G.alive.map((v,i)=>v?i:-1).filter(i=>i>=0),isBot=i=>i>=humans||AUTO||pv;
  const broadcast=()=>{ if(net&&net.host) net.send({st:G}); };
  /* ---- 流程 ---- */
  function roundStart(){ G.round++; said={}; G.pk=null; const a=aliveL(),s=(G.round-1)%a.length; G.order=a.slice(s).concat(a.slice(0,s)); G.speak=-1; nextSpeaker(); }
  function nextSpeaker(){ if(G.ph==='talk'&&G.speak>=0&&!said[G.speak]) addHint(G.speak,'（想不到，跳過）','n'); G.speak=G.order.length?G.order.shift():-1; if(G.speak<0){ votePhase(); return; } G.ph='talk'; G.T=isBot(G.speak)?12:TALK; G.msg='第 '+G.round+' 輪：輪到 '+names[G.speak]+' 描述'; botSay=2.2+Math.random()*1.8; /* 電腦先想一下再說 */ broadcast(); }
  function addHint(i,txt,tag){ said[i]=1; G.hints[i].push({r:G.round,t:txt,g:tag}); G.sayN++; renderLog(); sfx('click');
    /* 電腦像一般人一樣想：
       明顯符合我的詞 → 他跟我同一邊，放心；明顯對不上我的詞 → 很可疑；
       第一輪講得模糊很正常，之後還一直模糊 → 像在躲；跳過沒講 → 可疑；聽不太懂的 → 稍微留意 */
    for(let b=0;b<n;b++){ if(b===i) continue; const sd=side(b);
      if(tag==='n') sus[b][i]+=1.2; else if(tag==='u') sus[b][i]+=.35; else if(tag==='s') sus[b][i]+=G.round===1?.15:.7;
      else if(tag===sd){ sus[b][i]-=1.5; same[b]++; } else { sus[b][i]+=2.5; odd[b]++; } } }
  function say(i,txt){ if(G.ph!=='talk'||G.speak!==i||said[i]) return; txt=String(txt).trim().slice(0,24); if(!txt) return; if(txt.includes(word(i))){ G.warn=i; G.warnT=2.5; broadcast(); return; } addHint(i,txt,classify(P(),txt)); G.T=Math.min(G.T,3); broadcast(); }
  function aware(i){ return odd[i]>=2&&odd[i]>same[i]; } /* 好幾個人的描述都跟我的詞對不上，而且比對得上的多 → 我大概是臥底 */
  function botHint(i){ const p=P(),sd=side(i),fr=(a,tag)=>a.filter(h=>!used[h]).map(h=>[h,tag]); let pool;
    if(aware(i)&&Math.random()<.8) pool=fr(p.o[1-sd],1-sd).concat(fr(p.s,'s')); /* 發現自己是臥底：改講大家的詞，混進去 */
    else if(odd[i]>=1&&odd[i]>=same[i]&&Math.random()<.95) pool=fr(p.s,'s'); /* 聽到有人的描述對不上，先小心講模糊一點 */
    else if(G.round>1&&same[i]===0&&Math.random()<.7) pool=fr(p.s,'s'); /* 還沒聽到有人跟我的詞對得上，先保守 */
    else pool=Math.random()<(G.round===1?.88:.4)?fr(p.s,'s'):fr(p.o[sd],sd);
    if(!pool.length) pool=fr(p.s,'s').concat(fr(VAGUE,'s')); /* 想講的用完了 → 換通用的模糊說法 */ if(!pool.length) pool=fr(p.o[sd],sd); if(!pool.length) return ['我跟前面的人想的一樣','s'];
    const h=pick(pool); used[h[0]]=1; return h; }
  function votePhase(){ G.vote={}; G.ph='vote'; G.T=aliveL().some(i=>!isBot(i))?30:6; G.msg=G.pk?'平票！再投一次：只能投 '+G.pk.map(i=>names[i]).join('、'):'投票！點一個你覺得是臥底的人'; botT=3; /* 電腦先想 3 秒才開始投 */ sfx('beep'); broadcast(); }
  function castVote(i,tg){ if(G.ph!=='vote'||!G.alive[i]||G.vote[i]!=null||!G.alive[tg]||tg===i||(G.pk&&!G.pk.includes(tg))) return; G.vote[i]=tg; sfx('place'); if(aliveL().every(q=>G.vote[q]!=null)) G.T=Math.min(G.T,3); broadcast(); }
  const pub=(q,ex)=>{ const o=aliveL().filter(p=>p!==q&&p!==ex); return o.length?o.reduce((a,p)=>a+sus[p][q],0)/o.length:0; };
  function botVote(i){ const a=aliveL().filter(q=>q!==i&&(!G.pk||G.pk.includes(q))); if(!a.length) return null; const vn=q=>Object.values(G.vote).filter(v=>v===q).length*.35; /* 拿不定主意時跟著大家投 */ const sc=aware(i)?q=>pub(q,i)+vn(q)+Math.random()*.25:q=>sus[i][q]+vn(q)+Math.random()*.25; /* 臥底知道自己是臥底後，會跟著投大家最懷疑的平民 */ return a.sort((x,y)=>sc(y)-sc(x))[0]; }
  function tally(){ const cnt={}; for(const k in G.vote) cnt[G.vote[k]]=(cnt[G.vote[k]]||0)+1; let m=0,top=[]; for(const k in cnt){ if(cnt[k]>m){ m=cnt[k]; top=[+k]; } else if(cnt[k]===m) top.push(+k); }
    if(top.length>1&&!G.pk){ G.pk=top.sort((a,b)=>a-b); G.ph='pk'; G.T=4; G.msg='平票！'+G.pk.map(i=>names[i]).join('、')+' 再投一次'; sfx('beep'); broadcast(); return; } /* 平票的人再投一次 */
    G.ph='reveal'; G.T=7; if(top.length===1){ const x=top[0]; G.out=x; G.alive[x]=false; G.msg=names[x]+' 被投出去了（'+m+' 票）… 他是'+(G.role[x]?'「臥底」！':'「平民」'); sfx(G.role[x]?'win':'hurt'); for(const p of aliveL()) for(const q of aliveL()) if(G.vote[q]===x&&!G.role[x]) sus[p][q]+=.4; }
    else { G.out=-1; G.msg='又平票了！這一輪沒有人出局'; sfx('bump'); } G.pk=null; broadcast(); }
  function checkWin(){ const a=aliveL(),s=a.filter(i=>G.role[i]).length,cv=a.length-s; if(s===0) G.win='civ'; else if(s>=cv||G.round>=10) G.win='spy'; /* 臥底撐過 10 輪也算贏 */ if(G.win){ G.ph='end'; G.T=5; G.msg=G.win==='civ'?'臥底全部被找出來，平民獲勝！':G.round>=10&&s<cv?'臥底撐過 10 輪，臥底獲勝！':'臥底撐到最後，臥底獲勝！'; sfx(myWin()?'win':'lose'); broadcast(); return true; } return false; }
  const myWin=()=>G.win==='civ'?!G.role[me]:G.role[me];
  function botsAct(){ botT=1.6+Math.random()*1.6; if(G.ph==='vote'){ for(const i of aliveL()) if(isBot(i)&&G.vote[i]==null){ const v=botVote(i); if(v!=null) castVote(i,v); break; } } }
  function hostStep(dt){ G.T-=dt; botT-=dt; if(G.warnT>0) G.warnT-=dt; if(botT<=0) botsAct(); if(G.ph==='talk'&&isBot(G.speak)&&!said[G.speak]&&(botSay-=dt)<=0){ const h=botHint(G.speak); addHint(G.speak,h[0],h[1]); G.T=Math.min(G.T,3.2+h[0].length*.12); /* 說完留時間讓大家看清楚 */ broadcast(); } if(G.T>0) return;
    switch(G.ph){ case 'intro': roundStart(); break; case 'talk': nextSpeaker(); break; case 'vote': for(const i of aliveL()) if(G.vote[i]==null&&isBot(i)){ const v=botVote(i); if(v!=null) G.vote[i]=v; } tally(); break; case 'reveal': if(!checkWin()) roundStart(); break; case 'pk': votePhase(); break; case 'end': if(!ended){ ended=true; if(net) net.send({st:G,fin:1}); finish(); } break; } }
  function finish(){ if(pv){ env.end({}); return; } const win=myWin(); if(!net&&win) LS('arcade.spy.w',(+LS('arcade.spy.w')||0)+1); env.sfx(win?'win':'lose');
    env.end({title:G.win==='civ'?'平民獲勝！':'臥底獲勝！',big:win?'你贏了':'你輸了',html:'<p style="margin:0 0 6px">平民的詞：<b>'+P().w[G.civ]+'</b>　臥底的詞：<b style="color:#ff6b6b">'+P().w[1-G.civ]+'</b></p><table class="ls"><tr><th>玩家</th><th>身分</th><th>結果</th></tr>'+names.map((m,i)=>'<tr><td>'+m+'</td><td>'+(G.role[i]?'臥底':'平民')+'</td><td>'+(G.alive[i]?'存活':'出局')+'</td></tr>').join('')+'</table>',text:'共 '+G.round+' 輪'}); }
  // 連線
  if(net){ if(client) net.onmsg=m=>{ if(m.st){ const n0=G.sayN; G=m.st; if(G.sayN!==n0) renderLog(); if(m.fin&&!ended){ ended=true; finish(); } } }; else net.onmsg=(m,from)=>{ if(m.a) doAct(from,m.a); }; }
  function doAct(i,a){ if(a.k==='say') say(i,a.t); else if(a.k==='pass'&&G.ph==='talk'&&G.speak===i){ G.T=.05; broadcast(); } else if(a.k==='vote') castVote(i,a.t); }
  const act=a=>{ if(client) net.send({a}); else doAct(me,a); };
  /* ---- 描述輸入框 ---- */
  const wrap=document.createElement('div'); wrap.style.cssText='position:absolute;z-index:6;display:none;gap:6px'; const inp=document.createElement('input'); inp.maxLength=24; inp.placeholder='用一句話描述你的詞（不能直接說出來）'; inp.autocomplete='off'; inp.style.cssText='flex:1;min-width:0;font:700 14px '+TC+';padding:4px 10px;border-radius:9px;border:2px solid #b983ff;background:#fff;color:#2a1e2e';
  const mk=(tx,bgc)=>{ const b=document.createElement('button'); b.textContent=tx; b.style.cssText='font:900 13px '+TC+';padding:0 10px;border-radius:9px;border:0;background:'+bgc+';color:#2a1e2e;white-space:nowrap'; return b; };
  const b1=mk('說','#ffd23f'),b2=mk('💡 靈感','#bdf0ff'),b3=mk('跳過','#e0d8ee'); wrap.append(inp,b1,b2,b3); if(!pv) env.stage.appendChild(wrap);
  const send=()=>{ const v=inp.value.trim(); if(v){ act({k:'say',t:v}); inp.value=''; } inp.focus(); }; b1.addEventListener('click',send); b3.addEventListener('click',()=>act({k:'pass'}));
  b2.addEventListener('click',()=>{ const p=P(),sd=side(me),a=p.s.concat(p.o[sd]); inp.value=pick(a); inp.focus(); });
  inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ send(); e.preventDefault(); } e.stopPropagation(); });
  const place=()=>{ const r=canvas.getBoundingClientRect(),st=env.stage.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=r.left+(r.width-W*s)/2-st.left,oy=r.top+(r.height-H*s)/2-st.top; wrap.style.left=(ox+60*s)+'px'; wrap.style.top=(oy+456*s)+'px'; wrap.style.width=(520*s)+'px'; wrap.style.height=(36*s)+'px'; }; addEventListener('resize',place); place();
  /* ---- 右邊紀錄 ---- */
  const logC=document.createElement('canvas'); logC.width=340; logC.height=760; const lx=logC.getContext('2d');
  function renderLog(){ lx.setTransform(2,0,0,2,0,0); lx.clearRect(0,0,170,380); lx.textBaseline='top'; lx.font='700 11.5px '+TC; const all=[]; for(let i=0;i<n;i++) for(const h of G.hints[i]) all.push([h.r,i,h.t]); all.sort((a,b)=>a[0]-b[0]); let y=376,lr=null;
    for(let k=all.length-1;k>=0&&y>0;k--){ const [r,i,tx]=all[k],s=names[i]+'：'+tx,lines=[]; let ln=''; for(const ch of s){ if(lx.measureText(ln+ch).width>160){ lines.push(ln); ln=''; } ln+=ch; } lines.push(ln); y-=lines.length*14+3; lines.forEach((q,j)=>{ lx.fillStyle=i===me?'#ffd23f':'#f4eeff'; lx.fillText(q,4,y+j*14); });
      if(k===0||all[k-1][0]!==r){ y-=16; lx.fillStyle='#b983ff'; lx.font='900 11px '+TC; lx.fillText('— 第 '+r+' 輪 —',4,y); lx.font='700 11.5px '+TC; } } }
  /* ---- 輸入 ---- */
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const seatAt=q=>{ for(let i=0;i<n;i++){ const p=seat(i); if(Math.hypot(q[0]-p[0],q[1]-(p[1]-22))<30) return i; } return -1; };
  const canVote=()=>G.ph==='vote'&&G.alive[me]&&G.vote[me]==null;
  function down(e){ const q=toG(e); if(!canVote()) return; const i=seatAt(q); if(i<0||i===me||!G.alive[i]||(G.pk&&!G.pk.includes(i))) return; act({k:'vote',t:i}); sfx('click'); }
  const mv=e=>{ hover=seatAt(toG(e)); }; if(!pv){ canvas.addEventListener('pointerdown',down); canvas.addEventListener('pointermove',mv); }
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt; if(client){ G.T-=dt; if(G.warnT>0) G.warnT-=dt; } else { hostStep(dt); sendT-=dt; if(net&&sendT<=0){ sendT=1; broadcast(); } } const my=G.ph==='talk'&&G.speak===me&&!G.hints[me].some(h=>h.r===G.round); wrap.style.display=my&&!pv?'flex':'none'; }
  function draw(){ room(c,t,CX,CY,RX,RY); const order=[...Array(n).keys()].sort((a,b)=>seat(a)[1]-seat(b)[1]),showAll=G.ph==='end';
    const fig=i=>{ const p=seat(i),dead=!G.alive[i],sp=G.ph==='talk'&&G.speak===i;
      if(sp){ c.fillStyle='rgba(255,210,63,.35)'; c.beginPath(); c.ellipse(p[0],p[1]+14,34,11,0,0,TAU); c.fill(); }
      if(canVote()&&i!==me&&!dead&&(!G.pk||G.pk.includes(i))){ c.strokeStyle=hover===i?'#ffd23f':'rgba(255,255,255,'+(.35+.3*Math.sin(t*5))+')'; c.lineWidth=hover===i?4:2; c.beginPath(); c.ellipse(p[0],p[1]-18,30,40,0,0,TAU); c.stroke(); }
      chibi(c,p[0],p[1],.9,i,t,{dead,talk:sp,hand:G.ph==='vote'&&G.vote[i]!=null,shades:showAll&&G.role[i]&&!dead});
      c.font=(i===me?'900 ':'700 ')+'11px '+TC; c.textAlign='center'; c.textBaseline='middle'; const nm=(i===me?'你 ':'')+names[i].slice(0,6),w2=c.measureText(nm).width+12; c.fillStyle=i===me?'#ffd23f':'rgba(20,14,30,.75)'; rr(c,p[0]-w2/2,p[1]+20,w2,16,8); c.fill(); c.fillStyle=i===me?'#2a1e2e':'#fff'; c.fillText(nm,p[0],p[1]+28);
      if(dead||showAll){ const lab=G.role[i]?'臥底':'平民',co=G.role[i]?'#ff5d6d':'#4d96ff'; c.font='900 10px '+TC; const lw=c.measureText(lab).width+10; c.fillStyle=co; rr(c,p[0]+12,p[1]-62,lw,15,6); c.fill(); c.fillStyle='#fff'; c.fillText(lab,p[0]+12+lw/2,p[1]-54); }
      if(G.ph==='vote'||G.ph==='reveal'){ const cnt=Object.values(G.vote).filter(v=>v===i).length; if(cnt&&(G.vote[me]!=null||G.ph==='reveal'||!G.alive[me])){ c.fillStyle='#ff5d4f'; c.beginPath(); c.arc(p[0]-22,p[1]-42,10,0,TAU); c.fill(); c.fillStyle='#fff'; c.font='900 12px '+TC; c.fillText(cnt,p[0]-22,p[1]-41); } } };
    const back=order.filter(i=>seat(i)[1]<CY),front=order.filter(i=>seat(i)[1]>=CY); back.forEach(fig); table(c,CX,CY,t); front.forEach(fig);
    // 對話泡泡：這一輪說的話（還沒說的顯示上一輪，淡一點）
    for(const i of order){ const hs=G.hints[i]; if(!hs.length) continue; const h=hs[hs.length-1],p=seat(i),cur=h.r===G.round; if(!cur&&G.ph==='talk'&&G.speak!==i&&!G.alive[i]) continue; bubble(c,p[0],p[1]-58-(p[1]<CY?0:4),h.t,i===me?'#fff6c8':'#fff',cur?1:.55); }
    if(G.warnT>0&&G.warn>=0){ const p=seat(G.warn); bubble(c,p[0],p[1]-96,'不能直接說出詞喔！','#ffb0b0',1); }
    // 左上：我的詞
    c.fillStyle='rgba(20,14,30,.85)'; rr(c,10,8,150,62,10); c.fill(); c.textAlign='left'; c.textBaseline='middle'; c.font='900 12px '+TC; c.fillStyle='#d8c8ff'; c.fillText('你的詞',20,22); c.font='900 22px '+TC; c.fillStyle='#ffd23f'; c.fillText(word(me),20,47,132); if(!G.alive[me]){ c.font='900 11px '+TC; c.fillStyle='#ff8a9a'; c.fillText('已出局（觀戰）',84,22); }
    // 上方提示與倒數
    let hint=G.msg; if(G.ph==='intro') hint='記住你的詞！臥底的詞跟大家很像，連你自己都不知道是不是臥底'; else if(G.ph==='talk'&&G.speak===me&&!said[me]&&!G.hints[me].some(h=>h.r===G.round)) hint='輪到你：在下方用一句話描述你的詞'; else if(G.ph==='vote') hint=G.alive[me]?(G.vote[me]==null?(G.pk?'平票重投：只能投 '+G.pk.map(i=>names[i]).join('、'):'點一個你覺得是臥底的人'):'等其他人投票…'):'觀戰中：大家正在投票';
    const hx=170,hw=440; c.fillStyle='rgba(20,14,30,.85)'; rr(c,hx,8,hw,44,10); c.fill(); c.fillStyle='#fff'; c.textAlign='center'; c.font='900 '+(hint.length>24?13:15)+'px '+TC; if(hint.length>26){ const cut=Math.ceil(hint.length/2); c.fillText(hint.slice(0,cut),hx+hw/2-16,21,hw-60); c.fillText(hint.slice(cut),hx+hw/2-16,39,hw-60); } else c.fillText(hint,hx+hw/2-16,30,hw-60);
    if(G.ph==='talk'||G.ph==='vote'){ const sc=Math.max(0,Math.ceil(G.T)); c.fillStyle=sc<=5?'#ff5d6d':'#3ddbd9'; c.beginPath(); c.arc(hx+hw-24,30,16,0,TAU); c.fill(); c.fillStyle='#2a1e2e'; c.font='900 14px '+TC; c.fillText(sc,hx+hw-24,31); }
    // 右邊紀錄
    c.fillStyle='rgba(20,14,30,.75)'; rr(c,W-182,8,174,H-16,10); c.fill(); c.fillStyle='#ffd23f'; c.font='900 13px '+TC; c.textAlign='center'; c.fillText('描述紀錄　臥底 '+G.nsp+' 人',W-95,26); c.drawImage(logC,W-178,40,170,380);
    // 開場：翻開詞卡
    if(G.ph==='intro'){ const u=clamp((6-G.T)/.8,0,1),sx=Math.abs(Math.cos(u*Math.PI)); c.fillStyle='rgba(10,6,20,.55)'; c.fillRect(0,0,W-186,H); c.save(); c.translate(CX,CY-40); c.scale(Math.max(.05,sx),1); c.fillStyle=u<.5?'#b983ff':'#fffaf0'; rr(c,-110,-70,220,140,16); c.fill(); c.strokeStyle='#2a1e2e'; c.lineWidth=4; c.stroke();
      c.textAlign='center'; c.textBaseline='middle'; if(u<.5){ c.fillStyle='#fff'; c.font='900 60px '+TC; c.fillText('?',0,4); } else { c.fillStyle='#8a6ab8'; c.font='900 15px '+TC; c.fillText('你的詞是',0,-38); c.fillStyle='#2a1e2e'; c.font='900 40px '+TC; c.fillText(word(me),0,6,200); c.fillStyle='#ff6b6b'; c.font='700 12px '+TC; c.fillText('共 '+n+' 人，其中 '+G.nsp+' 個臥底',0,46); } c.restore(); }
    if(G.ph==='reveal'||G.ph==='end'||G.ph==='pk'){ c.fillStyle='rgba(20,14,30,.85)'; rr(c,CX-200,H-84,400,40,12); c.fill(); c.fillStyle=G.ph==='end'?'#ffd23f':'#fff'; c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(G.msg,CX,H-64,380); } }
  renderLog();
  return {update,draw,destroy(){ removeEventListener('resize',place); if(wrap.parentNode) wrap.remove(); canvas.removeEventListener('pointerdown',down); canvas.removeEventListener('pointermove',mv); },_dbg:{get G(){return G;},act,say,castVote,word,names,sus,aware}};
}
function thumb(ctx,w,h,t){ ctx.save(); ctx.scale(w/W,h/H); room(ctx,t,W/2,300,260,110); const N=7,pos=i=>{ const a=Math.PI/2+i/N*TAU; return [W/2+Math.cos(a)*240,300+Math.sin(a)*105]; },ord=[...Array(N).keys()].sort((a,b)=>pos(a)[1]-pos(b)[1]);
  ord.filter(i=>pos(i)[1]<300).forEach(i=>chibi(ctx,pos(i)[0],pos(i)[1],1.05,i+2,t,{shades:i===3,talk:i===5})); table(ctx,W/2,300,t); ord.filter(i=>pos(i)[1]>=300).forEach(i=>chibi(ctx,pos(i)[0],pos(i)[1],1.05,i+2,t,{shades:i===3,talk:i===5}));
  const p3=pos(3),p5=pos(5),p1=pos(1); bubble(ctx,p5[0],p5[1]-66,'有QQ的料，要用粗吸管','#fff'); bubble(ctx,p3[0],p3[1]-66,'手搖飲料店有賣…','#fff'); bubble(ctx,p1[0],p1[1]-70,'顏色淡淡的？','#ffe0e0');
  ctx.save(); ctx.translate(W/2,92); ctx.rotate(-.05); ctx.font='900 52px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=10; ctx.strokeStyle='#2a1e2e'; ctx.strokeText('找出臥底！',0,0); ctx.fillStyle='#ffd23f'; ctx.fillText('找出臥底！',0,0); ctx.restore(); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).spy={
  name:'臥底在身邊',tag:'FIND THE SPY',color:'#b983ff',online:true,maxPlayers:12,minPlayers:3,bots:true,netVariants:false,
  desc:'每人拿到一個詞，只有臥底的詞不一樣（但很像）！輪流用一句話描述，聽出誰怪怪的再投票。連你自己都不知道是不是臥底。一個人玩有電腦同桌，也能和朋友連線。',
  goal:'平民：把臥底全部投出去就贏。臥底：撐到臥底跟平民一樣多（或撐過 10 輪）就贏。平票的人再投一次，再平票就沒人出局。描述時不能直接說出詞。',
  modes:[{id:'1p',label:'單人'}],
  options:[{key:'seats',label:'單機人數',solo:true,def:'6',opts:['4','5','6','7','8','10'].map(k=>({id:k,label:k+' 人'}))},{key:'talk',label:'描述秒數',def:'30',opts:[{id:'30',label:'30 秒'},{id:'45',label:'45 秒'},{id:'60',label:'60 秒'}]}],
  help:[['輸入框','輪到你時用一句話描述你的詞'],['💡 靈感','想不到時給你一句'],['滑鼠','投票時點一個人']],touchHelp:[['輸入框','輪到你時用一句話描述'],['💡 靈感','想不到時給你一句'],['點人物','投票']],
  touch:{left:[],right:[]},hubBest:()=>{ const v=+LS('arcade.spy.w')||0; return v?'單人贏了 <b>'+v+'</b> 場':'尚無紀錄'; },thumb,create};
})();
