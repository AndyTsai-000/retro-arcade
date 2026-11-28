// 誰在唬爛：冷知識唬爛派對遊戲（2～8 人）。每輪一題冷知識，大家各自編一個「看起來很像真的」假答案，
// 再把所有假答案和真答案混在一起，每人選一個自己覺得是真的。選中真答案 +2 分，你的假答案每騙到一個人 +1 分。
// 單人時和電腦玩；連線各自用自己的螢幕打字；大家用一台時輪流偷偷打答案、輪流選。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const shuf=a=>{ for(let k=a.length-1;k>0;k--){ const j=Math.floor(Math.random()*(k+1)),t=a[k]; a[k]=a[j]; a[j]=t; } return a; };
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
/* 題庫：題目（＿＿是要填的地方）|真答案|電腦用的假答案（/ 分開） */
const BANK=[
['動物冷知識',`章魚有＿＿顆心臟|3|2/5/8/4
無尾熊一天大約要睡＿＿個小時|20|8/12/6/4
蜂鳥是唯一能＿＿飛的鳥|倒著|側著/閉著眼/睡著/在水裡
長頸鹿的舌頭是＿＿色的|深紫|粉紅/綠/黃/白
北極熊的皮膚其實是＿＿色的|黑|白/粉紅/灰/透明
袋熊的便便是＿＿形的|方|愛心/星星/三角/螺旋
海獺睡覺時會＿＿，免得被海浪沖走|手牽手|抱著石頭/咬著尾巴/把頭埋進沙裡/排成一直線
蝴蝶是用＿＿嚐味道的|腳|翅膀/肚子/眼睛/尾巴
河馬會流出＿＿色的汗|紅|藍/綠/金/紫
鴕鳥的眼睛比牠的＿＿還大|腦|嘴巴/心臟/腳趾/胃
斑馬的皮膚是＿＿色的|黑|白/粉紅/灰/咖啡
企鵝求偶時會送對方＿＿|石頭|魚/羽毛/貝殼/海草
海星身上沒有＿＿|腦|嘴巴/胃/眼睛/腳
海馬是由＿＿懷孕生小孩的|爸爸|媽媽/姊姊/爺爺/最大隻的
紅鶴是粉紅色的，因為牠吃了＿＿|蝦子和藻類|草莓/粉紅色的花/紅色石頭/鮭魚卵
鴨嘴獸是會＿＿的哺乳動物|生蛋|飛/發光/變色/吐絲
海豚睡覺的時候會＿＿|只睡一半的腦|浮在水面打呼/沉到海底/抱著同伴/倒立
貓咪吃不出＿＿味|甜|鹹/酸/苦/鮮
蟑螂沒有頭還能活大約＿＿|一個星期|一分鐘/一小時/一年/一天
熊貓一天大約要花＿＿個小時吃東西|12|2/4/1/6
牛的胃分成＿＿個部分|4|1/2/3/6
蜘蛛有＿＿隻腳|8|6/10/12/4
昆蟲有＿＿隻腳|6|4/8/10/12
鯨魚是用＿＿呼吸的|肺|鰓/皮膚/背鰭/尾巴
蝙蝠是唯一真正會飛的＿＿|哺乳動物|爬蟲類/兩棲類/魚類/鳥類
駱駝的駝峰裡主要儲存的是＿＿|脂肪|水/血/空氣/奶
貓頭鷹的頭最多能轉大約＿＿度|270|90/180/360/120
大象懷孕大約要＿＿個月|22|9/12/6/36
鯊魚一輩子會換掉大約＿＿顆牙齒|上萬|幾十/一百/五百/一千
蝸牛是用＿＿爬行的|腹足|觸角/殼/尾巴/牙齒
獵豹最快的時速大約是＿＿公里|110|50/70/200/300
世界上最大的鳥是＿＿|鴕鳥|老鷹/信天翁/禿鷹/帝王企鵝
蜂鳥的心跳每分鐘可以超過＿＿下|1000|100/300/50/5000
青蛙吞東西時會用＿＿幫忙往下壓|眼睛|耳朵/腳/尾巴/鼻子
長頸鹿的脖子有＿＿節頸椎|7|20/12/30/3
刺蝟身上大約有＿＿根刺|5000|50/500/50000/100
鱷魚沒辦法＿＿|吐舌頭|游泳/閉氣/張嘴/曬太陽
樹懶大約＿＿才下樹上一次廁所|一個星期|一天/一小時/一年/一個月
蟑螂已經在地球上生活了大約＿＿年|3億|3千/300萬/30萬/30億
金魚的記憶其實可以維持＿＿|好幾個月|3秒/1分鐘/1小時/半天
蝴蝶的幼蟲叫做＿＿|毛毛蟲|蝌蚪/孑孓/蛆/蛹
孑孓長大後會變成＿＿|蚊子|蒼蠅/蝴蝶/青蛙/蜻蜓
斑馬身上的條紋每一隻都＿＿|不一樣|一模一樣/左右對稱/會變色/會發光
犀牛的角是由＿＿構成的|角蛋白|骨頭/象牙/石頭/牙齒
鯨魚噴出的水柱主要是＿＿|呼出的氣|海水/尿/口水/奶
科學家認為鳥類是＿＿的後代|恐龍|青蛙/蛇/蜥蜴/烏龜
烏賊有＿＿條腕足|10|8/6/12/4
會叮人吸血的是＿＿|母蚊子|公蚊子/小蚊子/老蚊子/所有蚊子
無尾熊幾乎只吃＿＿|尤加利葉|竹子/香蕉/草/樹皮
熊貓的「第六根手指」其實是＿＿|腕骨|大拇指/指甲/肉墊/尾巴`],
['世界與科學',`世界上最小的國家是＿＿|梵蒂岡|摩納哥/列支敦斯登/聖馬利諾/馬爾他
澳洲的首都是＿＿|坎培拉|雪梨/墨爾本/伯斯/布里斯本
加拿大的首都是＿＿|渥太華|多倫多/溫哥華/蒙特婁/卡加利
地球上最深的海溝是＿＿海溝|馬里亞納|日本/菲律賓/秘魯/阿拉斯加
世界最高的瀑布是委內瑞拉的＿＿瀑布|天使|彩虹/魔鬼/黃金/白龍
艾菲爾鐵塔夏天會熱脹冷縮，長高大約＿＿公分|15|1/50/100/3
在金星上，一天比一年還＿＿|長|短/亮/熱/快
閃電的溫度大約是太陽表面的＿＿倍|5|2/20/100/1000
香蕉在植物學上算是＿＿|漿果|堅果/蔬菜/穀物/種子
蜂蜜密封好，放＿＿年都不會壞|幾千|一/十/五十/一百
人體最小的骨頭在＿＿裡面|耳朵|腳趾/手指/鼻子/眼睛
嬰兒剛出生時大約有＿＿塊骨頭|300|206/150/500/100
人的心臟一天大約跳＿＿次|10萬|1萬/1千/100萬/5千
冥王星在＿＿年被降級成矮行星|2006|1999/2010/2001/2015
世界最高的大樓是杜拜的＿＿|哈里發塔|帆船塔/阿拉伯之星/沙漠之心/黃金塔
世界上第一張郵票叫做＿＿|黑便士|紅先令/金英鎊/白銀幣/綠便士
可口可樂一開始是當作＿＿來賣的|藥|香水/酒/牙膏/洗髮精
鉛筆的筆芯裡其實沒有＿＿|鉛|石墨/黏土/蠟/碳
樂高（LEGO）這個名字在丹麥文的意思是＿＿|玩得好|小積木/快樂/蓋房子/小朋友
拿破崙的身高其實大約是＿＿公分|169|150/155/180/145
玻璃主要是用＿＿做的|沙子|鹽/冰/貝殼/糖
西洋棋的棋盤一共有＿＿格|64|81/100/72/49
一副撲克牌（不算鬼牌）的點數全部加起來是＿＿|364|365/360/312/400
自由女神像剛蓋好的時候是＿＿色的|紅銅|綠/金/白/銀
打噴嚏的時候，＿＿幾乎一定會閉起來|眼睛|嘴巴/耳朵/鼻孔/喉嚨
陽光從太陽照到地球大約要＿＿分鐘|8|1/30/60/3
北半球一年中白天最長的節氣是＿＿|夏至|立夏/大暑/芒種/小滿
北半球一年中白天最短的節氣是＿＿|冬至|小寒/大寒/立冬/小雪
在一大氣壓下，水在＿＿度沸騰|100|90/120/80/110
彩虹傳統上說有＿＿種顏色|7|5/6/8/12
從滿月到下一次滿月大約要＿＿天|29.5|7/14/45/60
光每秒大約可以跑＿＿萬公里|30|3/300/3000/100
世界上面積最大的沙漠是＿＿|南極洲|撒哈拉沙漠/戈壁沙漠/阿拉伯沙漠/喀拉哈里沙漠
鑽石是由＿＿元素組成的|碳|矽/鐵/金/氧
聲音在＿＿裡不能傳播|真空|水/鐵/空氣/木頭
地球大氣中最多的氣體是＿＿|氮氣|氧氣/二氧化碳/氫氣/氦氣
2023 年起，世界上人口最多的國家是＿＿|印度|中國/美國/印尼/巴西
俄羅斯橫跨＿＿個時區|11|5/7/15/24
聖母峰位在尼泊爾和＿＿的邊界|中國|印度/不丹/巴基斯坦/孟加拉
國家數量最多的洲是＿＿|非洲|亞洲/歐洲/美洲/大洋洲
袋鼠幾乎不會＿＿|倒退走|跳/游泳/打架/吃草
地球的年齡大約是＿＿億年|46|1/10/100/460
人類第一次登陸月球是在＿＿年|1969|1959/1979/1949/1989
鐵生鏽主要是因為和水以及＿＿起反應|氧氣|氮氣/氦氣/二氧化碳/鹽
世界上最大的海洋是＿＿|太平洋|大西洋/印度洋/北冰洋/南冰洋
世界上最大的島是＿＿|格陵蘭|婆羅洲/馬達加斯加/新幾內亞/冰島
世界上面積最大的湖是＿＿|裏海|貝加爾湖/蘇必略湖/維多利亞湖/死海
人可以輕鬆浮在死海上，因為死海的水很＿＿|鹹|冰/熱/甜/濁
世界上最乾燥的地方之一是智利的＿＿沙漠|阿他加馬|撒哈拉/戈壁/莫哈維/塔克拉瑪干
南極洲目前＿＿|不屬於任何國家|屬於美國/屬於英國/屬於澳洲/屬於聯合國`],
['台灣與生活',`玉山主峰的高度是＿＿公尺|3952|3886/3997/4011/3800
台灣的國寶魚是＿＿|櫻花鉤吻鮭|黑鮪魚/虱目魚/烏魚/台灣鯛
台灣面積最大的縣市是＿＿|花蓮縣|南投縣/台東縣/屏東縣/高雄市
台灣最長的河流是＿＿|濁水溪|高屏溪/淡水河/大甲溪/曾文溪
蘭嶼屬於＿＿縣|台東|屏東/花蓮/澎湖/宜蘭
九份在新北市的＿＿區|瑞芳|平溪/貢寮/雙溪/金山
台灣第一條高速公路是＿＿|中山高|北二高/北宜高/福爾摩沙高/西濱快速道路
阿里山在＿＿縣|嘉義|南投/雲林/台南/高雄
澎湖群島大約有＿＿座島|90|10/30/200/50
台灣家裡插座的電壓是＿＿伏特|110|220/100/240/12
綠島以前的名字叫＿＿|火燒島|海龜島/青仔島/烈火島/小琉球
龜山島在＿＿縣|宜蘭|基隆/新北/花蓮/桃園
台灣最長的國道是＿＿|國道三號|國道一號/國道五號/國道十號/國道六號
台南鹽水的元宵節最有名的是＿＿|蜂炮|炸寒單/天燈/放水燈/搶孤
日月潭位在＿＿縣|南投|台中/嘉義/苗栗/彰化
台灣最北端的岬角是新北市的＿＿|富貴角|鼻頭角/三貂角/野柳/貂山角
台灣的特有種鳥類「台灣藍鵲」的嘴巴是＿＿色的|紅|黃/黑/藍/白
國道五號連接台北和＿＿|宜蘭|花蓮/基隆/桃園/新竹
台灣第一條捷運路線是＿＿線|木柵|淡水/板南/新店/中和
台灣高鐵在＿＿年通車|2007|2000/2010/2004/1999
中華民國的國花是＿＿|梅花|櫻花/蘭花/玫瑰/蓮花
台灣本島的面積大約是＿＿萬平方公里|3.6|1/10/20/5
台灣目前有＿＿個直轄市|6|3/5/8/10
台灣本島最東端的岬角是＿＿|三貂角|鼻頭角/富貴角/野柳/貂山角
雪山隧道大約長＿＿公里|12.9|3/5/20/30
台灣黑熊胸前有一塊＿＿字形的白毛|V|O/X/W/T
平溪最有名的是在元宵節放＿＿|天燈|水燈/鞭炮/風箏/蜂炮
台灣第一座國家公園是＿＿|墾丁|玉山/陽明山/太魯閣/雪霸
台北市的市花是＿＿|杜鵑|櫻花/梅花/桐花/茶花
油桐花盛開時常被叫做＿＿|五月雪|三月雪/春天雨/白蝴蝶/山中雲
媽祖是＿＿的守護神|航海|讀書/戀愛/生意/打獵
月下老人負責＿＿|姻緣|考試/財運/健康/平安
文昌帝君保佑＿＿|考試讀書|姻緣/財運/生小孩/航海
大腸包小腸外面那層「大腸」其實是＿＿|糯米腸|麵包/豬腸/蛋皮/餅皮
珍珠奶茶的珍珠主要是用＿＿做的|樹薯粉|糯米/麵粉/蒟蒻/玉米粉
傳統鳳梨酥的內餡常會混入＿＿|冬瓜|地瓜/芋頭/南瓜/蘋果
愛玉凍是用愛玉的＿＿搓洗出來的|種子|葉子/樹皮/花/根
蚵仔煎的粉漿主要是用＿＿|地瓜粉|麵粉/玉米粉/綠豆粉/米粉
太陽餅最早出名的地方是台灣的＿＿|台中|台南/台北/高雄/嘉義
台南「擔仔麵」的擔仔，指的是＿＿|挑擔子賣麵|一種碗/攤位的名字/老闆的名字/一種鍋子
台北 101 的高度大約是＿＿公尺|508|408/608/1000/101
台灣面積最大的平原是＿＿平原|嘉南|屏東/蘭陽/台北/宜蘭
黑面琵鷺冬天最多出現在＿＿|台南|宜蘭/台北/花蓮/澎湖
台灣官方認定的原住民族目前有＿＿族|16|9/12/20/30
荷蘭人在台南安平建的城堡原本叫＿＿|熱蘭遮城|億載金城/聖多明哥城/鄭氏城/台灣府城
赤崁樓原本是荷蘭人建的＿＿|普羅民遮城|熱蘭遮城/紅毛城/億載金城/安平城
淡水紅毛城最早是＿＿人建的|西班牙|英國/日本/葡萄牙/法國
台灣第一條鐵路由＿＿主持興建|劉銘傳|鄭成功/後藤新平/李鴻章/林則徐
鄭成功是從＿＿人手中取得台灣的|荷蘭|西班牙/日本/英國/葡萄牙
甲午戰爭後，台灣被割讓給＿＿|日本|英國/荷蘭/西班牙/法國`],
['人體奧秘',`成年人大約有＿＿塊骨頭|206|300/150/250/500
人體最大的器官是＿＿|皮膚|肝臟/大腦/心臟/肺
人身上最硬的部分是＿＿|牙齒|頭骨/指甲/大腿骨/膝蓋
人的心臟有＿＿個腔室|4|2/3/6/8
成人的恆齒加上智齒一共有＿＿顆|32|24/36/40/20
小孩的乳牙一共有＿＿顆|20|28/32/16/12
人身上最長的骨頭是＿＿|大腿骨|脊椎/手臂骨/肋骨/小腿骨
大腦大約佔人體重的＿＿|2%|10%/20%/0.5%/30%
人的右肺有＿＿葉|3|2/4/1/5
人體裡含量最多的物質是＿＿|水|蛋白質/脂肪/鈣/血
頭髮一個月大約長＿＿公分|1|5/0.1/10/3
人一天大約眨眼＿＿次|一萬多|一百/一千/十萬/五十
人體最小的肌肉在＿＿|耳朵|眼睛/手指/腳趾/鼻子
人體最大的肌肉是＿＿|臀大肌|二頭肌/胸大肌/背闊肌/腹肌
人的靜脈血其實是＿＿色的|暗紅|藍/紫/綠/黑
人每天大約會掉＿＿根頭髮|50到100|5/1000/10/5000
人的指紋在＿＿就形成了|媽媽肚子裡|一歲/三歲/青春期/成年後
打哈欠會＿＿|傳染給別人|讓人變矮/讓人發燒/讓眼睛變色/讓牙齒變白
人的身高早上比晚上＿＿|高一點|矮一點/一樣/胖一點/瘦一點
舌頭上負責嚐味道的是＿＿|味蕾|牙齦/唾腺/舌骨/扁桃腺
人體負責解毒的主要器官是＿＿|肝臟|胃/心臟/肺/脾臟
製造胰島素的器官是＿＿|胰臟|肝臟/腎臟/胃/膽囊
人的正常體溫大約是＿＿度|37|35/39/40/33
人的小腸大約有＿＿公尺長|6|1/2/20/50
骨頭和骨頭連接活動的地方叫＿＿|關節|肌肉/血管/神經/皮膚
耳朵除了聽聲音，還負責＿＿|平衡|呼吸/嗅覺/消化/體溫
嬰兒頭頂軟軟的地方叫＿＿|囟門|頭皮/腦門/髮旋/額頭
ABO 血型系統一共有＿＿種血型|4|3/2/6/8
人的血液裡數量最多的血球是＿＿|紅血球|白血球/血小板/淋巴球/幹細胞
一隻手大約有＿＿塊骨頭|27|5/12/50/100
膝蓋前面那塊骨頭叫＿＿|髕骨|脛骨/腓骨/股骨/距骨
在暗處幫我們看東西、但分不出顏色的是＿＿細胞|視桿|視錐/神經/紅血球/角膜
人的嗅覺比狗＿＿|差很多|好很多/一樣/快很多/強十倍
腎臟的主要工作是＿＿|製造尿液|製造膽汁/消化食物/製造胰島素/儲存脂肪
膽汁是由＿＿製造的|肝臟|膽囊/胃/胰臟/腎臟
指甲和頭髮都是由＿＿構成的|角蛋白|鈣/骨頭/脂肪/膠原蛋白
太空人在太空中身高會＿＿|變高|變矮/不變/變胖/變瘦
抽筋時肌肉其實是在＿＿|收縮|放鬆/斷掉/變長/融化
五種基本味覺是酸、甜、苦、鹹和＿＿|鮮|辣/澀/涼/麻
負責對抗病菌的主要是＿＿|白血球|紅血球/血小板/膽汁/胃酸
人的心臟位在胸腔＿＿|中間偏左|右邊/肚子裡/喉嚨下/肋骨外面
「三高」是高血壓、高血脂和＿＿|高血糖|高體溫/高心跳/高血氧/高血量
DNA 主要存在細胞的＿＿裡|細胞核|細胞膜/細胞質/液泡/血液
人體最小的骨頭叫＿＿|鐙骨|錘骨/砧骨/指骨/尾骨
防止食物跑進氣管的是＿＿|會厭|扁桃腺/聲帶/食道/舌頭
人體最大的內臟器官是＿＿|肝臟|肺/胃/腸/心臟
人大多是在＿＿睡眠時做夢|快速動眼期|深睡期/剛躺下時/起床後/打呼時
剛出生的嬰兒大約只能看清楚＿＿公分內的東西|30|3/100/500/1000
人的血液大約佔體重的＿＿|7%|1%/20%/30%/50%
人的鼻涕主要的功用是＿＿|擋住灰塵和細菌|讓鼻子變香/幫助消化/讓聲音變好聽/保持體重`],
['食物冷知識',`花生其實屬於＿＿|豆類|堅果/水果/穀物/根莖類
番茄在植物學上算是＿＿|水果|蔬菜/根莖/種子/菇類
草莓的種子長在＿＿|外面|裡面/蒂頭/根部/葉子
腰果在樹上是掛在＿＿下面|腰果梨|鳳梨/椰子/芒果/香蕉
白巧克力裡面沒有＿＿|可可粉|可可脂/糖/牛奶/香草
辣椒會辣主要是因為含有＿＿|辣椒素|維他命C/糖分/胡椒素/鹽分
吃辣其實是一種＿＿|痛覺|味覺/嗅覺/聽覺/視覺
吃鳳梨舌頭刺刺的，是因為鳳梨有＿＿|鳳梨酵素|檸檬酸/辣椒素/咖啡因/鹽
奇異果原產於＿＿|中國|紐西蘭/澳洲/日本/巴西
馬鈴薯我們吃的部分其實是＿＿|莖|根/葉/花/果實
洋蔥我們吃的部分其實是＿＿|鱗莖|根/果實/花/種子
雞蛋殼的顏色主要和＿＿有關|母雞品種|營養價值/新不新鮮/公雞顏色/季節
糙米和白米差在白米去掉了＿＿|米糠和胚芽|稻殼/澱粉/水分/米心
豆腐是用＿＿做的|黃豆|綠豆/紅豆/花生/米
咖啡豆其實是咖啡果實的＿＿|種子|果皮/花/葉子/根
巧克力是用＿＿做的|可可豆|咖啡豆/黑豆/花生/栗子
味精的主要成分是＿＿|麩胺酸鈉|鹽/糖/小蘇打/醋
醋的酸味主要來自＿＿|醋酸|檸檬酸/鹽酸/乳酸/碳酸
優格是牛奶經過＿＿發酵做成的|乳酸菌|酵母/黴菌/醋/鹽
一般麵包會膨脹主要是靠＿＿|酵母|雞蛋/鹽/糖/空氣
鹽巴的化學名稱是＿＿|氯化鈉|碳酸鈉/氫氧化鈉/硫酸鈉/碳酸鈣
蜂蜜是蜜蜂用＿＿釀成的|花蜜|花粉/樹汁/露水/糖水
香蕉樹其實是一種＿＿|草本植物|大樹/灌木/藤蔓/仙人掌
鳳梨是長在＿＿|矮矮的植株上|高高的樹上/地底下/藤蔓上/水裡
西瓜大約有＿＿%是水|92|50/70/99/60
小黃瓜大約有＿＿%是水|95|50/70/80/60
燕窩是＿＿用唾液做成的窩|金絲燕|麻雀/燕子/鴿子/海鷗
魚子醬傳統上是＿＿的卵|鱘魚|鮭魚/鱈魚/鯊魚/鯉魚
松露是一種長在＿＿的菇|地底下|樹幹上/石頭上/水裡/葉子上
寒天（洋菜）是用＿＿做的|海藻|豬皮/牛骨/米/豆子
吉利丁是從＿＿萃取出來的|動物的皮和骨|海藻/米/豆子/花
蒟蒻是用＿＿做的|魔芋|海藻/米/豆子/魚漿
臭豆腐的臭味主要來自＿＿|發酵的滷汁|榴槤/放太久壞掉/臭雞蛋/炸太久
世界上最辣的辣椒之一叫＿＿|卡羅萊納死神|哈瓦那/墨西哥青/朝天椒/雞心椒
米其林原本是一家＿＿公司|輪胎|餐廳/食品/飯店/旅行社
漢堡的名字來自德國的＿＿|漢堡市|柏林/慕尼黑/法蘭克福/科隆
紅蘿蔔吃太多，皮膚可能會變＿＿|黃|紅/綠/藍/白
吃完蘆筍後，尿可能會有＿＿|特別的味道|藍色/綠色/甜味/亮光
切洋蔥會流眼淚，是因為洋蔥放出＿＿|刺激性的硫化物|胡椒/辣椒素/酒精/花粉
杏仁分成甜杏仁和＿＿杏仁|苦|酸/辣/鹹/香
芒果和＿＿是同一科的植物|腰果|蘋果/香蕉/鳳梨/木瓜
可可的果實直接長在＿＿上|樹幹|樹梢/地底/藤蔓/葉子
世界上最貴的香料是＿＿|番紅花|胡椒/肉桂/香草/丁香
綠茶、紅茶、烏龍茶都是用＿＿的葉子做的|同一種茶樹|不同的樹/桑樹/薄荷/竹子
花椰菜我們吃的部分是＿＿|花|葉/莖/根/果實
竹筍是竹子的＿＿|嫩芽|根/花/果實/葉子
米酒是用＿＿釀的|米|麥/葡萄/甘蔗/玉米
啤酒的主要原料是＿＿|麥芽|米/葡萄/甘蔗/馬鈴薯
酸梅湯的主要材料是＿＿|烏梅|鳳梨/柳丁/蘋果/葡萄
酪梨又被叫做＿＿|牛油果|黃油瓜/綠蘋果/山芒果/奶果`],
['歷史故事',`秦始皇統一中國是在西元前＿＿年|221|121/321/206/1
萬里長城最早被連接成一大段是在＿＿朝|秦|漢/唐/明/宋
東漢時改良造紙術的是＿＿|蔡倫|張衡/李白/孔子/司馬遷
宋朝時發明活字印刷術的是＿＿|畢昇|蔡倫/沈括/包拯/岳飛
《史記》的作者是＿＿|司馬遷|司馬光/班固/孔子/蘇軾
唐朝的首都是＿＿|長安|杭州/北京/南京/開封
三國指的是魏、蜀和＿＿|吳|秦/楚/燕/趙
赤壁之戰中，孫劉聯軍用＿＿打敗曹操|火攻|水淹/投石/毒箭/大象
孔子是＿＿時代的人|春秋|戰國/秦朝/漢朝/唐朝
鄭和下西洋是在＿＿朝|明|元/清/宋/唐
埃及金字塔是＿＿的陵墓|法老|祭司/士兵/商人/奴隸
第一屆現代奧運在＿＿舉行|雅典|巴黎/倫敦/羅馬/柏林
拿破崙是＿＿的皇帝|法國|英國/德國/義大利/西班牙
美國第一任總統是＿＿|華盛頓|林肯/傑佛遜/富蘭克林/羅斯福
鐵達尼號在＿＿年沉沒|1912|1902/1922/1898/1945
鐵達尼號撞上的是＿＿|冰山|礁石/鯨魚/另一艘船/潛水艇
第二次世界大戰在＿＿年結束|1945|1939/1918/1950/1941
柏林圍牆在＿＿年倒下|1989|1979/1991/1961/1999
哥倫布在 1492 年抵達的是＿＿|美洲|印度/非洲/澳洲/日本
第一支環繞地球航行的船隊是由＿＿率領出發|麥哲倫|哥倫布/鄭和/庫克/達伽馬
《蒙娜麗莎》是＿＿畫的|達文西|米開朗基羅/梵谷/畢卡索/拉斐爾
梵谷曾經割下自己的＿＿|耳朵|手指/鼻子/頭髮/腳趾
萊特兄弟在＿＿年第一次動力飛行成功|1903|1893/1913/1923/1869
在歐洲改良並推廣活字印刷的是＿＿|古騰堡|牛頓/伽利略/達文西/哥白尼
提出「地動說」的是＿＿|哥白尼|托勒密/牛頓/亞里斯多德/阿基米德
傳說被蘋果砸到頭而想到萬有引力的是＿＿|牛頓|愛因斯坦/伽利略/達爾文/愛迪生
提出演化論的是＿＿|達爾文|孟德爾/牛頓/愛因斯坦/巴斯德
第一個踏上月球的人是＿＿|阿姆斯壯|艾德林/加加林/柯林斯/甘迺迪
第一個進入太空的人是＿＿|加加林|阿姆斯壯/艾德林/柯林斯/楊利偉
古埃及人寫字用的是＿＿|莎草紙|竹簡/宣紙/樹葉/石板
楚漢相爭最後贏的是＿＿|劉邦|項羽/韓信/秦始皇/曹操
「臥薪嘗膽」的主角是＿＿|勾踐|夫差/項羽/劉備/孫權
端午節是為了紀念＿＿|屈原|孔子/岳飛/李白/諸葛亮
傳說背上刺著「精忠報國」的是＿＿|岳飛|文天祥/關羽/戚繼光/包拯
清朝最後一位皇帝是＿＿|溥儀|光緒/乾隆/康熙/雍正
武則天是中國歷史上唯一的正統＿＿|女皇帝|女宰相/女將軍/女狀元/女詩人
秦始皇陵附近挖出的大批陶俑叫＿＿|兵馬俑|泥娃娃/石人/土偶兵/陶武士
馬可波羅是來自＿＿的旅行家|威尼斯|羅馬/巴黎/倫敦/雅典
古代絲路主要連接中國和＿＿|中亞與歐洲|美洲/澳洲/南極/非洲南部
法國大革命在＿＿年爆發|1789|1689/1889/1776/1815
美國獨立宣言在＿＿年發表|1776|1676/1876/1789/1812
古代奧運起源於＿＿|希臘|羅馬/埃及/中國/波斯
印加帝國位在＿＿|南美洲|北美洲/非洲/亞洲/歐洲
文藝復興起源於＿＿|義大利|法國/英國/德國/西班牙
「破釜沉舟」的主角是＿＿|項羽|劉邦/韓信/曹操/關羽
「三顧茅廬」是劉備去請＿＿|諸葛亮|關羽/張飛/趙雲/龐統
「草船借箭」是＿＿想出的計謀|諸葛亮|周瑜/曹操/孫權/司馬懿
古羅馬的大型競技場又叫＿＿|圓形競技場|萬神殿/帕德嫩神廟/凱旋門/羅馬廣場
「焚書坑儒」的是＿＿|秦始皇|漢武帝/唐太宗/隋煬帝/朱元璋
發明地動儀的東漢科學家是＿＿|張衡|蔡倫/祖沖之/華佗/扁鵲`],
['太空與地球',`太陽系有＿＿顆行星|8|9/7/10/12
太陽系最大的行星是＿＿|木星|土星/海王星/天王星/地球
離太陽最近的行星是＿＿|水星|金星/火星/地球/月球
太陽系表面溫度最高的行星是＿＿|金星|水星/火星/木星/土星
被稱為「紅色星球」的是＿＿|火星|金星/木星/水星/土星
土星最有名的是它的＿＿|光環|紅斑/尾巴/極光/大山
木星上有一個超大風暴叫＿＿|大紅斑|大藍眼/小紅點/金色漩渦/風暴眼
月球的重力大約是地球的＿＿|六分之一|一半/十分之一/兩倍/三分之一
月球總是用＿＿對著地球|同一面|每天換一面/亮的那面/背面/側面
太陽是一顆＿＿|恆星|行星/衛星/彗星/星系
「一光年」指的是光走一年的＿＿|距離|時間/速度/亮度/重量
離太陽系最近的恆星系統是＿＿|半人馬座α|天狼星/北極星/織女星/牛郎星
夜空中最亮的恆星是＿＿|天狼星|北極星/織女星/參宿四/牛郎星
北極星屬於＿＿座|小熊|大熊/獵戶/天鵝/仙后
我們所在的星系叫＿＿|銀河系|仙女座星系/麥哲倫星系/太陽系/獵戶座星系
冥王星現在被歸類為＿＿|矮行星|行星/衛星/彗星/恆星
火星有＿＿顆天然衛星|2|0/1/4/12
目前已知衛星最多的行星是＿＿|土星|木星/天王星/海王星/火星
地球到月球的距離大約是＿＿萬公里|38|3/380/1/100
地球到太陽的距離大約是＿＿億公里|1.5|0.5/3/150/50
地球最外面的一層叫＿＿|地殼|地函/地核/岩漿/板塊
地球的中心叫＿＿|地核|地殼/地函/岩漿庫/地心海
地球表面大約有＿＿%是海洋|71|50/30/90/60
流星其實是＿＿進入大氣層燒起來|太空中的小石塊|掉下來的星星/雷電/外星飛船/燃燒的雲
彗星的尾巴總是背對著＿＿|太陽|地球/月球/北極星/木星
極光主要是＿＿和地球大氣作用產生的|太陽風|月光/閃電/火山/雲
日食的時候是＿＿擋住了太陽|月球|地球/金星/雲/木星
月食的時候是＿＿的影子遮住了月亮|地球|太陽/金星/火星/雲
第一顆人造衛星是＿＿發射的|蘇聯|美國/中國/日本/英國
國際太空站大約每＿＿分鐘繞地球一圈|90|10/30/300/1440
哈伯是一台＿＿|太空望遠鏡|太空梭/火星車/人造衛星/火箭
黑洞的重力大到連＿＿都逃不出來|光|聲音/空氣/石頭/火箭
宇宙大約有＿＿億年的歷史|138|46/10/1000/20
銀河系的形狀是＿＿|螺旋狀|球形/方形/甜甜圈形/心形
太陽主要是由＿＿組成的|氫|氧/鐵/碳/氮
天王星的自轉軸幾乎是＿＿的|橫躺|直立/顛倒/歪 45 度/不轉
金星自轉的方向和大多數行星＿＿|相反|一樣/垂直/隨機/不轉
太陽系最高的火山在＿＿上|火星|地球/金星/木星/水星
太陽系最大的衛星是＿＿|木衛三|月球/泰坦/歐羅巴/卡戎
土星的平均密度比＿＿還小|水|空氣/鐵/冰/石頭
地球大氣中的氧氣大約佔＿＿%|21|50/78/10/1
臭氧層主要幫我們擋住＿＿|紫外線|紅外線/X光/隕石/雷電
從海底算起最高的山是＿＿|毛納基山|聖母峰/K2/富士山/吉力馬札羅山
地球自轉的方向是＿＿|由西向東|由東向西/由南向北/由北向南/不轉
月球上的腳印可以保存很久，因為月球沒有＿＿|大氣和風|重力/光/石頭/溫度
太空站上的太空人一天大約可以看到＿＿次日出|16|1/2/100/4
地球繞太陽一圈大約要＿＿天|365|360/366/300/400
太陽的光大約要＿＿分鐘才能照到地球|8|1/30/60/3
地球上的潮汐主要是＿＿的引力造成的|月球|太陽/火星/木星/地心
天上「牛郎星」和「織女星」中間隔著＿＿|銀河|月亮/太陽/北斗七星/雲`],
['發明與品牌',`世界上第一座迪士尼樂園開在＿＿|加州|佛羅里達/東京/巴黎/香港
取得電話專利的是＿＿|貝爾|愛迪生/特斯拉/瓦特/馬可尼
改良出實用電燈泡而出名的是＿＿|愛迪生|貝爾/特斯拉/瓦特/牛頓
改良蒸汽機讓它普及的是＿＿|瓦特|愛迪生/貝爾/牛頓/福特
發明炸藥的人後來設立了＿＿獎|諾貝爾|普立茲/奧斯卡/葛萊美/金馬
發現盤尼西林的是＿＿|弗萊明|巴斯德/居禮夫人/愛迪生/達爾文
發現放射性元素鐳的是＿＿|居禮夫人|愛因斯坦/牛頓/諾貝爾/弗萊明
發明全球資訊網（WWW）的是＿＿|伯納斯-李|比爾蓋茲/賈伯斯/祖克柏/馬斯克
第一支 iPhone 在＿＿年發表|2007|2001/2010/2004/1999
便利貼其實來自一次＿＿實驗的失敗|強力膠|油漆/紙張/香水/墨水
微波爐的發明者是因為口袋裡的＿＿融化而想到的|巧克力|冰淇淋/奶油/起司/口香糖
傳說洋芋片是因為客人一直嫌薯條太＿＿|厚|鹹/冷/少/軟
魔術方塊是＿＿人發明的|匈牙利|日本/德國/美國/俄羅斯
樂高（LEGO）來自＿＿|丹麥|瑞典/德國/荷蘭/挪威
IKEA 來自＿＿|瑞典|丹麥/德國/芬蘭/荷蘭
任天堂最早是賣＿＿的|花札紙牌|電視/玩具車/糖果/相機
三星最早是一家＿＿|賣乾貨的商行|電視工廠/手機公司/汽車公司/服裝店
Nokia 最早是一家＿＿公司|造紙|手機/汽車/電視/銀行
星巴克的名字取自小說《白鯨記》裡＿＿|大副的名字|船的名字/鯨魚的名字/作者的狗/港口的名字
Google 這個名字來自數學上的＿＿|10的100次方|圓周率/無限大/質數/黃金比例
Amazon 這個名字取自＿＿|亞馬遜河|女戰士/森林/鸚鵡/老闆的狗
第一個電腦滑鼠的外殼是用＿＿做的|木頭|鐵/塑膠/玻璃/橡膠
QR Code 是＿＿人發明的|日本|韓國/美國/德國/中國
發明泡麵的是＿＿|安藤百福|日清太郎/味之素/松下幸之助/本田宗一郎
牛仔褲最早是做給＿＿穿的|礦工|水手/軍人/學生/廚師
最早的腳踏車沒有＿＿|踏板|輪子/座椅/把手/車架
被認為做出第一輛實用汽油汽車的是＿＿|卡爾賓士|福特/本田/豐田/法拉利
福特汽車最有名的創舉是＿＿|生產線組裝|發明輪胎/發明方向盤/發明汽油/發明紅綠燈
世界上第一則手機簡訊的內容是＿＿|Merry Christmas|Hello/Happy New Year/I love you/Test
世界上第一張照片大約需要曝光＿＿|好幾個小時|一秒/一分鐘/一年/十秒
指南針最早是在＿＿發明的|中國|希臘/埃及/印度/英國
火藥最早是在＿＿發明的|中國|印度/阿拉伯/英國/日本
微軟的創辦人之一是＿＿|比爾蓋茲|賈伯斯/祖克柏/貝佐斯/馬斯克
蘋果公司的創辦人之一是＿＿|賈伯斯|比爾蓋茲/祖克柏/貝佐斯/馬斯克
Facebook 的創辦人是＿＿|祖克柏|賈伯斯/比爾蓋茲/貝佐斯/馬斯克
Hello Kitty 來自＿＿|日本|美國/韓國/英國/台灣
米老鼠的創作者是＿＿|華特迪士尼|史丹李/宮崎駿/手塚治蟲/查理布朗
麥當勞的創始兄弟姓＿＿|麥當勞|克洛克/桑德斯/漢堡/肯德基
肯德基的創辦人常被稱為＿＿|桑德斯上校|麥當勞叔叔/漢堡王/炸雞先生/肯德基爺爺
世界上第一條商業鐵路在＿＿|英國|美國/德國/法國/日本
常被認為發明無線電收音機的是＿＿|馬可尼|愛迪生/貝爾/瓦特/諾貝爾
發明現代冷氣機的是＿＿|開利|大金/松下/日立/三菱
讓充氣輪胎普及的是＿＿|鄧祿普|米其林/固特異/普利司通/馬牌
第一台數位相機是＿＿公司的工程師做出來的|柯達|富士/佳能/索尼/尼康
隨身聽 Walkman 是＿＿公司推出的|Sony|Panasonic/Philips/Apple/Samsung
寶可夢最早是出現在＿＿遊戲機上|Game Boy|紅白機/PlayStation/Switch/超級任天堂
瑪利歐最早登場時的職業設定是＿＿|木匠|廚師/警察/郵差/農夫
3M 的三個 M 是指＿＿|明尼蘇達礦業製造|三個老闆/三個月/三種材料/三座工廠
「藍牙」這個名字來自一位＿＿國王|丹麥|瑞典/英國/芬蘭/德國
可口可樂最早是在＿＿的藥房賣的|美國|英國/法國/墨西哥/德國`],
['運動與遊戲',`籃球比賽每隊上場＿＿人|5|6/7/4/11
足球比賽每隊上場＿＿人|11|9/10/12/7
棒球每半局要＿＿個出局才換邊|3|2/4/5/9
排球比賽每隊上場＿＿人|6|5/7/9/11
奧運每＿＿年舉辦一次|4|2/3/5/6
全程馬拉松大約是＿＿公里|42.195|40/50/21.0975/45
網球的比分零分叫做＿＿|Love|Zero/Egg/Nil/Duck
桌球比賽一局打到＿＿分|11|21/15/7/10
羽球比賽一局打到＿＿分|21|11/15/25/30
排球比賽一般局打到＿＿分|25|21/15/11/30
拿過最多次世界盃足球冠軍的國家是＿＿|巴西|德國/義大利/阿根廷/法國
第一屆世界盃足球賽在＿＿舉辦|烏拉圭|巴西/英國/義大利/法國
西洋棋每一方有＿＿個兵|8|6/10/12/4
西洋棋裡只能斜著走的是＿＿|主教|城堡/騎士/兵/國王
象棋裡的「馬」走＿＿|日字|田字/直線/斜一格/任意格
象棋裡的「象」走＿＿|田字|日字/直線/斜一格/任意格
標準圍棋棋盤是＿＿路|19|15/21/17/25
台灣十六張麻將含花牌一共＿＿張|144|136/108/128/160
骰子相對兩面的點數加起來是＿＿|7|6/8/10/12
撲克牌裡沒有鬍子的國王是＿＿|紅心K|黑桃K/梅花K/方塊K/每一張都沒有
保齡球一局有＿＿格|10|12/9/15/20
保齡球的完美比賽是＿＿分|300|200/100/500/1000
NBA 籃球比賽每節＿＿分鐘|12|15/20/8/30
奧運標準游泳池長＿＿公尺|50|25/100/40/75
跳水比賽的高台高度是＿＿公尺|10|5/3/20/15
奧運金牌其實主要是＿＿做的|銀|純金/銅/鐵/鋁
相撲是＿＿的傳統運動|日本|韓國/蒙古/中國/泰國
跆拳道來自＿＿|韓國|日本/中國/泰國/越南
柔道來自＿＿|日本|韓國/中國/巴西/泰國
板球在＿＿非常受歡迎|印度|美國/日本/巴西/中國
冰上曲棍球打的是＿＿|橡膠圓餅|小圓球/羽毛球/沙包/冰塊
美式足球的球是＿＿形的|橄欖|圓/方/蛋/星星
高爾夫球表面的小凹洞是為了讓球＿＿|飛更遠|更好看/比較輕/比較好抓/防水
比賽用的羽毛球羽毛通常來自＿＿|鵝或鴨|雞/孔雀/老鷹/鴿子
鐵人三項是游泳、騎自行車和＿＿|跑步|划船/射箭/跳遠/舉重
足球比賽中只有＿＿可以用手碰球|守門員|隊長/前鋒/裁判/後衛
標準魔術方塊有＿＿種顏色|6|4/5/8/9
大富翁的前身原本是想說明＿＿的壞處|地主壟斷|賭博/打架/說謊/浪費
UNO 在西班牙文的意思是＿＿|一|贏/出完/最後/全部
跳棋棋盤的形狀是＿＿|六角星|正方形/圓形/三角形/八角形
拔河在奧運中＿＿|曾經是正式比賽項目|從來沒有/現在還有/只在冬奧/只是表演賽
史上最長的網球比賽打了超過＿＿小時|11|3/5/24/48
傳說馬拉松起源於一位士兵跑回＿＿報告勝利|雅典|羅馬/斯巴達/特洛伊/馬其頓
棒球的本壘板是＿＿形|五角|正方/圓/三角/六角
九號球撞球最後要打進＿＿號球|9|8/1/15/10
擊劍的三種劍是鈍劍、銳劍和＿＿|軍刀|長劍/短劍/武士刀/雙刀
籃球最早的籃框是＿＿|裝桃子的籃子|鐵桶/漁網/木箱/水桶
足球世界盃每＿＿年舉辦一次|4|2/3/5/6
棒球比賽一般打＿＿局|9|7/5/10/12
冬季奧運的冰壺比賽，選手會用＿＿刷冰|掃帚|拖把/手套/毛巾/刷子腳`],
['語言與文字',`「咖啡」是英文＿＿的音譯|coffee|copy/cough/coke/cookie
「沙發」是從＿＿音譯來的|英文|法文/日文/台語/德文
「幽默」這個譯詞是＿＿翻譯的|林語堂|魯迅/胡適/徐志摩/梁實秋
「卡哇伊」這個詞來自＿＿|日文|韓文/英文/台語/法文
「歐巴」這個詞來自＿＿|韓文|日文/英文/台語/泰文
「迷因」是英文＿＿的音譯|meme|mean/mini/mine/men
「森」這個字由＿＿個木組成|3|2/4/5/6
「龘」這個字裡有＿＿個龍|3|2/4/5/6
「齉」這個字的意思是＿＿|鼻子不通|牙齒痛/肚子餓/打雷/很生氣
「囧」這個字本來的意思是＿＿|光明|尷尬/悲傷/驚訝/房子
英文字母一共有＿＿個|26|24/28/30/22
英文裡最常出現的字母是＿＿|E|A/T/S/O
注音符號一共有＿＿個|37|26/40/30/42
台灣的舊稱 Formosa 來自＿＿語|葡萄牙|西班牙/荷蘭/英/法
Formosa 的意思是＿＿|美麗|島嶼/綠色/寶藏/山
「吐司」是英文＿＿的音譯|toast|taste/toss/test/touch
「馬殺雞」是英文＿＿的音譯|massage|message/match/mask/marshal
「秀逗」據說源自英文的＿＿|short|show/stupid/shoot/soda
「歇斯底里」是英文＿＿的音譯|hysteria|history/hysteric/mystery/hesitate
「烏托邦」是英文＿＿的音譯|utopia|Europe/utility/ultra/topic
「邏輯」是英文＿＿的音譯|logic|logo/log/look/lock
「模特兒」是英文＿＿的音譯|model|motor/mother/modern/medal
「三明治」是以英國一位＿＿命名的|伯爵|國王/廚師/將軍/船長
「香波」是＿＿的舊稱|洗髮精|香水/香皂/沐浴乳/洗衣粉
「雷射」是英文＿＿的音譯|laser|razor/radar/racer/later
「維他命」是英文＿＿的音譯|vitamin|vita/vitality/victim/visit
「畫蛇添足」比喻＿＿|多此一舉|畫畫很厲害/想像力豐富/做事認真/動作很快
「杯弓蛇影」比喻＿＿|疑神疑鬼|膽子很大/喝太多酒/射箭很準/很怕蛇
「守株待兔」的農夫在等＿＿|兔子撞樹|下雨/老虎/朋友/收成
「對牛彈琴」的意思是＿＿|說話不看對象|音樂很好聽/牛很聰明/彈琴很累/很有耐心
「井底之蛙」比喻＿＿|見識很少|很會游泳/很安靜/住很深/很勇敢
「塞翁失馬」的下一句是＿＿|焉知非福|失而復得/馬上回來/必有後福/禍不單行
「一石二鳥」和＿＿意思相近|一舉兩得|一刀兩斷/一落千丈/一乾二淨/一心一意
台語俗語「狗吠火車」的意思是＿＿|白費力氣|很吵/狗很兇/很危險/跑很快
台語「歹勢」的意思是＿＿|不好意思|很壞/很累/很生氣/很難過
台語「古錐」的意思是＿＿|可愛|古老/很醜/很尖/很錐
台語「頭家」的意思是＿＿|老闆|頭髮/家長/房子/頭目
「阿莎力」源自日文，意思是＿＿|爽快|謝謝/很美/很累/再見
「趴趴走」的意思是＿＿|到處亂跑|趴著睡/走很慢/跳舞/爬行
「凸」這個字有＿＿畫|5|3/4/6/8
「鬱」這個字有＿＿畫|29|19/25/33/39
世界上母語人口最多的語言是＿＿|中文|英文/西班牙文/印地語/阿拉伯文
「麥克風」是英文＿＿的音譯|microphone|megaphone/microwave/mike/micro
「巧克力」是英文＿＿的音譯|chocolate|cocoa/cookie/cola/caramel
「布丁」是英文＿＿的音譯|pudding|putting/budding/padding/pending
「咖哩」是英文＿＿的音譯|curry|carry/cherry/cream/curve
「芭樂」在台灣是指＿＿|番石榴|香蕉/芒果/鳳梨/蓮霧
「便當」這個詞一般認為來自＿＿|日文|英文/台語/韓文/廣東話
「Ｑ彈」的「Ｑ」最早來自＿＿|台語|英文/日文/韓文/數學
「掰掰」是英文＿＿的音譯|bye-bye|baby/buy/bubble/best`]];
const QS=[]; BANK.forEach(([cat,txt],ci)=>txt.trim().split('\n').forEach(line=>{ const [q,a,f]=line.split('|'); QS.push({ci,q,a:a.trim(),f:f.trim().split('/')}); }));
const STAGES=BANK.map(b=>b[0]).concat(['綜合隨機']);
const PCOL=['#ff7a3d','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff5d6d','#3ddbd9','#ff9d3d'];
const BOTN=['阿唬','小騙','大頭','咪咪','阿呆','球球','小白','胖胖'];
const BOTLOOK=i=>({char:['pirate','cat','cap','bunny','ninja','chef','crown','bow'][i%8],deco:['shades','blush','','scarf'][i%4]});
const norm=s=>String(s||'').replace(/[\s，。、！？!?,.\-－~～「」『』（）()]/g,'').replace(/[０-９]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-65248)).toLowerCase();
const clean=s=>String(s||'').replace(/[<>&"']/g,'').trim().slice(0,12);
/* ---------- 背景：深夜談話節目的舞台 ---------- */
let BG=null;
function bg(){ if(BG) return BG; const e=document.createElement('canvas'); e.width=W*2; e.height=H*2; const c=e.getContext('2d'); c.scale(2,2);
  const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#0e1638'); g.addColorStop(.6,'#1a1446'); g.addColorStop(1,'#0a0a1e'); c.fillStyle=g; c.fillRect(0,0,W,H);
  /* 布幕 */ for(const side of [0,1]){ for(let k=0;k<6;k++){ const x=side?W-22-k*20:k*20,gg=c.createLinearGradient(x,0,x+20,0); gg.addColorStop(0,'#5a0e22'); gg.addColorStop(.5,'#a8243e'); gg.addColorStop(1,'#5a0e22'); c.fillStyle=gg; c.beginPath(); c.moveTo(x,0); c.lineTo(x+22,0); c.quadraticCurveTo(x+11+(side?-8:8),H*.5,x+22+(side?-10:10)*(k/5),H); c.lineTo(x+(side?-10:10)*(k/5),H); c.quadraticCurveTo(x+11+(side?-8:8),H*.5,x,0); c.fill(); } }
  /* 城市夜景窗 */ c.fillStyle='rgba(120,140,255,.08)'; rr(c,150,24,500,140,14); c.fill(); for(let i=0;i<40;i++){ const x=160+(i*53)%480,h=30+(i*37)%90; c.fillStyle='rgba(30,30,80,.9)'; c.fillRect(x,164-h,24,h); for(let y=164-h+6;y<160;y+=10) for(let xx=x+4;xx<x+22;xx+=7){ if((xx*7+y*3+i)%5<2){ c.fillStyle='rgba(255,220,140,.5)'; c.fillRect(xx,y,3,4); } } }
  /* 聚光燈 */ for(const x of [200,600]){ const lg=c.createRadialGradient(x,0,10,x,300,330); lg.addColorStop(0,'rgba(180,200,255,.12)'); lg.addColorStop(1,'rgba(180,200,255,0)'); c.fillStyle=lg; c.beginPath(); c.moveTo(x-30,0); c.lineTo(x+30,0); c.lineTo(x+200,440); c.lineTo(x-200,440); c.fill(); }
  /* 舞台地板 */ const fg=c.createLinearGradient(0,400,0,H); fg.addColorStop(0,'#3a2a5a'); fg.addColorStop(1,'#120a22'); c.fillStyle=fg; c.fillRect(0,402,W,H-402); c.strokeStyle='rgba(120,220,255,.5)'; c.lineWidth=2; c.beginPath(); c.moveTo(0,402); c.lineTo(W,402); c.stroke();
  return BG=e; }
function neon(c,x,y,s,t){ c.save(); c.font='900 '+s+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; const fl=.85+.15*Math.sin(t*9)*Math.sin(t*2.3); c.shadowColor='#ff4fd8'; c.shadowBlur=18*fl; c.fillStyle='rgba(255,140,230,'+fl+')'; c.fillText('誰在唬爛',x,y); c.shadowBlur=0; c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=1; c.strokeText('誰在唬爛',x,y); c.restore(); }
function wrapLines(c,s,w,max){ const out=[]; let line=''; for(const ch of s){ if(c.measureText(line+ch).width>w){ out.push(line); line=ch; if(out.length===max) break; } else line+=ch; } if(out.length<max&&line) out.push(line); return out; }

function create(env,opts){
  const {ctx:c,canvas}=env.canvas2d(W,H),net=opts.net,client=!!net&&!net.host,host=!client,pv=!!opts.preview,OP=opts.options||{},si=clamp(opts.stage|0,0,STAGES.length-1);
  const room=!net&&!pv&&opts.mode==='room',me=net?net.me:0,ROUNDS=clamp(+OP.rounds||6,3,10);
  const N=net?clamp(net.count+(net.bots||0),2,8):pv?5:clamp(+OP.n||5,3,8);
  const humans=pv?0:net?net.count:room?N:1;
  const names=[],looks=[],bot=[]; for(let i=0;i<N;i++){ const h=i<humans; bot.push(!h);
    if(h){ names.push(net?(net.names&&net.names[i])||'玩家'+(i+1):room?'玩家 '+(i+1):(opts.name||'你')); looks.push(net?(net.looks&&net.looks[i])||{}:room?BOTLOOK(i):opts.look||{}); }
    else { names.push(BOTN[(i-humans)%BOTN.length]); looks.push(BOTLOOK(i)); } }
  if(room&&window.PARTY_NAMES) window.PARTY_NAMES.fill(names);
  const left=Array(N).fill(false),local=i=>!pv&&!bot[i]&&(net?i===me:true);
  const colOf=i=>{ const L=looks[i]; return !L||!L.color||L.color==='auto'?PCOL[i%8]:L.color; };
  const pool=shuf(QS.map((q,k)=>k).filter(k=>si>=BANK.length||QS[k].ci===si));
  const SP=pv?.45:1;
  const newG=()=>({ph:'intro',PT:pv?1.2:4,r:-1,q:-1,fake:Array(N).fill(null),ans:[],pick:Array(N).fill(-1),score:Array(N).fill(0),gain:Array(N).fill(0),rv:0,rs:0,hi:0,peekOn:false,warn:Array(N).fill(''),hist:[]});
  let G=newG();
  let t=0,ended=false,sendT=0,fx=[],btns=[],hoverB=-1,prevKey='',editing=false,botT=Array(N).fill(0);
  const sfx=k=>{ if(!pv) env.sfx(k); };
  const Q=()=>QS[G.q];
  const alive=()=>{ const a=[]; for(let i=0;i<N;i++) if(!left[i]) a.push(i); return a; };
  const humansIn=()=>alive().filter(i=>!bot[i]);
  /* ---------- 房主流程 ---------- */
  function startRound(){ G.r++; G.q=pool[G.r%pool.length]; G.fake=Array(N).fill(null); G.pick=Array(N).fill(-1); G.ans=[]; G.gain=Array(N).fill(0); G.warn=Array(N).fill(''); G.rv=0; G.rs=0; G.hi=0; G.peekOn=false; G.ph='q'; G.PT=3.2*SP;
    for(let i=0;i<N;i++) botT[i]=2.5+Math.random()*4; }
  function giveFake(i,txt){ if(G.ph!=='write'||G.fake[i]!=null) return; txt=clean(txt); if(!txt) return;
    if(norm(txt)===norm(Q().a)){ G.warn[i]='你寫到正確答案了！換一個唬爛的答案'; return; }
    G.fake[i]=txt; G.warn[i]=''; if(room){ G.hi++; G.peekOn=false; } checkWrite(); }
  function checkWrite(){ if(alive().every(i=>G.fake[i]!=null)) buildAns(); }
  function buildAns(){ const list=[{t:Q().a,by:[],truth:true}]; for(const i of alive()){ const f=G.fake[i]; const ex=list.find(x=>!x.truth&&norm(x.t)===norm(f)); if(ex) ex.by.push(i); else list.push({t:f,by:[i],truth:false}); }
    G.ans=shuf(list); G.ph='pick'; G.PT=1.2*SP; G.hi=0; G.peekOn=false; for(let i=0;i<N;i++) botT[i]=2.5+Math.random()*3.5; }
  function givePick(i,k){ if(G.ph!=='pick'||G.pick[i]>=0||G.PT>0) return; const a=G.ans[k]; if(!a||a.by.includes(i)) return; G.pick[i]=k; if(room){ G.hi++; G.peekOn=false; } if(alive().every(j=>G.pick[j]>=0)) startReveal(); }
  function startReveal(){ /* 先揭曉有人選的假答案，最後才是真答案 */ const fakes=G.ans.map((a,k)=>k).filter(k=>!G.ans[k].truth&&G.pick.some(p=>p===k)),truth=G.ans.findIndex(a=>a.truth);
    G.order=fakes.concat([truth]); G.rv=0; G.rs=0; G.ph='reveal'; G.PT=1.4*SP; }
  function revealStep(){ const k=G.order[G.rv],a=G.ans[k],voters=[]; for(let i=0;i<N;i++) if(G.pick[i]===k) voters.push(i);
    if(G.rs===0){ G.rs=1; G.PT=2.2*SP; return; } /* 先亮出誰選了它 */
    if(G.rs===1){ G.rs=2; G.PT=2.8*SP; if(a.truth){ voters.forEach(i=>{ G.score[i]+=2; G.gain[i]+=2; }); } else { a.by.forEach(i=>{ G.score[i]+=voters.length; G.gain[i]+=voters.length; }); } return; }
    G.rv++; G.rs=0; G.PT=.5*SP; if(G.rv>=G.order.length){ G.hist.push({q:G.q,fool:G.ans.filter(x=>!x.truth).map(x=>({t:x.t,by:x.by,n:G.pick.filter(p=>G.ans[p]===x).length})),right:G.pick.filter((p,i)=>p>=0&&G.ans[p].truth).length}); G.ph='score'; G.PT=3.6*SP; } }
  function afterRound(){ if(G.r+1>=ROUNDS){ G.ph='final'; G.PT=4; return; } startRound(); }
  function botFake(i){ const used=G.fake.filter(x=>x).map(norm),opts=Q().f.filter(f=>!used.includes(norm(f))); return opts.length?opts[Math.floor(Math.random()*opts.length)]:Q().f[i%Q().f.length]+'吧'; }
  function botPick(i){ const ok=G.ans.map((a,k)=>k).filter(k=>!G.ans[k].by.includes(i)),tr=ok.find(k=>G.ans[k].truth);
    if(Math.random()<.42&&tr!=null) return tr; /* 有人的假答案特別像真的：電腦比較容易被騙 */ const fk=ok.filter(k=>!G.ans[k].truth); if(!fk.length) return tr; const hum=fk.filter(k=>G.ans[k].by.some(j=>!bot[j])),src=hum.length&&Math.random()<.55?hum:fk; return src[Math.floor(Math.random()*src.length)]; }
  function doAct(from,a){ if(!a||ended) return;
    if(a.k==='go'&&room&&G.ph==='intro'){ startRound(); return; }
    if(a.k==='peek'&&room) { G.peekOn=true; return; }
    if(a.k==='fake'&&G.ph==='write'){ const i=room?roomCur():from; if(i==null||bot[i]||(net&&from!==i)) return; giveFake(i,a.t); return; }
    if(a.k==='pick'&&G.ph==='pick'){ const i=room?roomCur():from; if(i==null||bot[i]||(net&&from!==i)) return; givePick(i,a.i|0); return; }
    if(a.k==='next'&&G.ph==='score'&&G.PT<2.6){ G.PT=0; } }
  const roomCur=()=>{ const h=humansIn(); if(G.ph==='write'){ const r=h.filter(i=>G.fake[i]==null); return r[0]; } if(G.ph==='pick'){ const r=h.filter(i=>G.pick[i]<0); return r[0]; } return null; };
  function hostStep(dt){ G.PT-=dt;
    if(G.ph==='intro'){ if(G.PT<=0&&!room) startRound(); }
    else if(G.ph==='q'){ if(G.PT<=0){ G.ph='write'; G.PT=0; } }
    else if(G.ph==='write'){ for(const i of alive()) if(bot[i]&&G.fake[i]==null){ botT[i]-=dt; if(botT[i]<=0){ G.fake[i]=botFake(i); checkWrite(); if(G.ph!=='write') break; } } }
    else if(G.ph==='pick'){ if(G.PT<=0) for(const i of alive()) if(bot[i]&&G.pick[i]<0){ botT[i]-=dt; if(botT[i]<=0){ givePick(i,botPick(i)); if(G.ph!=='pick') break; } } }
    else if(G.ph==='reveal'){ if(G.PT<=0) revealStep(); }
    else if(G.ph==='score'){ if(G.PT<=0) afterRound(); }
    else if(G.ph==='final'&&G.PT<=0&&!ended){ if(pv){ G=newG(); return; } ended=true; if(net) net.send({G,end:1}); finish(); }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/6; net.send({G}); } } }
  if(net){ if(client) net.onmsg=m=>{ if(m.G) G=m.G; if(m.end&&!ended){ ended=true; finish(); } };
    else { net.onmsg=(m,from)=>{ if(m.a) doAct(from,m.a); }; net.onleave=i=>{ if(i>0&&i<N&&!left[i]){ bot[i]=true; names[i]+='（電腦代打）'; botT[i]=1; } }; } }
  const act=a=>{ if(pv) return; if(client) net.send({a}); else doAct(me,a); };
  /* ---------- 打字輸入 ---------- */
  const wrap=document.createElement('div'); wrap.style.cssText='position:absolute;z-index:6;display:none;gap:6px'; const inp=document.createElement('input'); inp.maxLength=12; inp.placeholder='編一個像真的假答案'; inp.autocomplete='off'; inp.style.cssText='flex:1;min-width:0;font:700 16px '+TC+';padding:4px 10px;border-radius:10px;border:2px solid #ff8ad0;background:#fff;color:#2a1040';
  const ib=document.createElement('button'); ib.textContent='💡'; ib.title='幫我想一個'; ib.style.cssText='font:900 15px '+TC+';padding:0 10px;border-radius:10px;border:0;background:#e8dcff;cursor:pointer'; ib.addEventListener('click',()=>{ const f=Q()&&Q().f; if(f){ inp.value=f[Math.floor(Math.random()*f.length)]; inp.focus(); } });
  const sb=document.createElement('button'); sb.textContent='送出'; sb.style.cssText='font:900 15px '+TC+';padding:0 18px;border-radius:10px;border:0;background:#ffd23f;color:#2a1e0e;white-space:nowrap;cursor:pointer'; wrap.append(inp,ib,sb); if(!pv) env.stage.appendChild(wrap);
  const sendFake=()=>{ const v=inp.value.trim(); if(!v) return; act({k:'fake',t:v}); inp.value=''; sfx('click'); inp.blur(); };
  sb.addEventListener('click',sendFake); inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ sendFake(); e.preventDefault(); } e.stopPropagation(); }); inp.addEventListener('keyup',e=>e.stopPropagation());
  const place=()=>{ const r=canvas.getBoundingClientRect(),st=env.stage.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=r.left+(r.width-W*s)/2-st.left,oy=r.top+(r.height-H*s)/2-st.top; wrap.style.left=(ox+190*s)+'px'; wrap.style.top=(oy+250*s)+'px'; wrap.style.width=(420*s)+'px'; wrap.style.height=(40*s)+'px'; const fz=Math.max(11,Math.round(17*s))+'px'; inp.style.fontSize=fz; sb.style.fontSize=fz; inp.style.padding='0 '+Math.round(8*s+2)+'px'; sb.style.padding='0 '+Math.round(16*s)+'px'; ib.style.padding='0 '+Math.round(8*s)+'px'; ib.style.fontSize=fz; }; addEventListener('resize',place); place();
  const myWriter=()=>{ if(G.ph!=='write') return null; if(room){ const i=roomCur(); return i!=null&&G.peekOn?i:null; } return local(me)&&G.fake[me]==null?me:null; };
  const myPicker=()=>{ if(G.ph!=='pick'||G.PT>0) return null; if(room){ const i=roomCur(); return i!=null&&G.peekOn?i:null; } return local(me)&&G.pick[me]<0?me:null; };
  /* ---------- 輸入 ---------- */
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const inR=(x,y,b)=>x>=b.x&&y>=b.y&&x<=b.x+b.w&&y<=b.y+b.h;
  const pd=e=>{ if(pv||editing) return; const [x,y]=toG(e); for(const b of btns) if(inR(x,y,b)){ b.fn(); return; } };
  const pm=e=>{ if(pv) return; const [x,y]=toG(e); hoverB=btns.findIndex(b=>inR(x,y,b)); canvas.style.cursor=hoverB>=0?'pointer':''; };
  canvas.addEventListener('pointerdown',pd); canvas.addEventListener('pointermove',pm);
  /* ---------- 更新 ---------- */
  function update(dt){ if(ended&&!pv) return; dt=Math.min(dt,.05); t+=dt; if(host) hostStep(dt); else G.PT-=dt;
    if(!pv&&!editing&&document.activeElement!==inp){ if(room&&G.ph==='intro'&&(env.hit('Space')||env.hit('Enter'))) act({k:'go'}); if(G.ph==='score'&&(env.hit('Space')||env.hit('Enter'))) act({k:'next'}); }
    if(!pv){ const show=myWriter()!=null; const was=wrap.style.display==='flex'; wrap.style.display=show?'flex':'none'; if(show&&!was){ place(); inp.value=''; if(!env.touch) setTimeout(()=>{ try{ inp.focus(); }catch(e){} },50); } }
    const key=G.ph+'|'+G.r+'|'+G.rv+'|'+G.rs; if(key!==prevKey){ onChange(prevKey); prevKey=key; }
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=420*dt; f.r+=f.vr*dt; if(f.l<=0) fx.splice(i,1); } }
  function onChange(old){ const op=old.split('|')[0];
    if(G.ph==='q'&&op!=='q') sfx('beep'); if(G.ph==='pick'&&op==='write') sfx('go');
    if(G.ph==='reveal'&&G.rs===2&&G.order){ const a=G.ans[G.order[G.rv]]; if(a.truth){ sfx('win'); for(let k=0;k<44;k++) fx.push({x:W/2,y:200,vx:(Math.random()-.5)*480,vy:-220-Math.random()*240,l:1.7,c:['#ff5aa8','#ffd23f','#5bd1ff','#7affa0'][k%4],r:0,vr:(Math.random()-.5)*12}); } else sfx(G.pick.some((p,i)=>p===G.order[G.rv]&&local(i))?'bump':'item'); }
    if(G.ph==='final'&&op!=='final') sfx('win'); }
  function rank(){ return [...Array(N).keys()].sort((a,b)=>G.score[b]-G.score[a]); }
  function finish(){ if(pv){ env.end({}); return; } const R=rank(),top=G.score[R[0]],winners=R.filter(i=>G.score[i]===top),iWin=winners.some(i=>local(i)&&!room);
    if(iWin){ try{ localStorage.setItem('arcade.bluff.w',String((+localStorage.getItem('arcade.bluff.w')||0)+1)); }catch(e){} }
    const rows=R.map((i,k)=>'<tr><td>'+(k+1)+'</td><td>'+(local(i)&&!room?'你':names[i])+'</td><td>'+G.score[i]+' 分</td></tr>').join('');
    const qs=G.hist.map((h,k)=>'<tr><td>'+(k+1)+'</td><td style="text-align:left">'+QS[h.q].q.replace('＿＿','<b>'+QS[h.q].a+'</b>')+'</td><td>'+h.right+' 人猜中</td></tr>').join('');
    env.end({title:room?names[winners[0]]+(winners.length>1?' 等人':'')+' 最會唬爛！':iWin?'你是唬爛王！':names[winners[0]]+' 是唬爛王！',big:top+' 分',text:'選中真答案 +2，假答案每騙到一人 +1',
      html:'<table class="ls"><tr><th>名次</th><th>玩家</th><th>分數</th></tr>'+rows+'</table><table class="ls"><tr><th>題</th><th>正確答案</th><th></th></tr>'+qs+'</table>',score:null}); }
  /* ---------- 版面 ---------- */
  function person(x,y,i,s,bob){ const C=window.ARCADE_CHAR,L=looks[i]||{}; c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x,y,13*s,4*s,0,0,TAU); c.fill(); if(C) C.drawChar(c,x,y-15*s+(bob||0),colOf(i),1,false,t+i,s*1.1,L.char||'cap',L.deco||''); }
  function hit(x,y,w,h,fn){ btns.push({x,y,w,h,fn:()=>{ sfx('click'); fn(); }}); }
  function btn(x,y,w,h,tx,col,fn,sub){ const k=btns.length,hv=hoverB===k; hit(x,y,w,h,fn); c.save(); c.shadowColor='rgba(0,0,0,.45)'; c.shadowBlur=10; c.shadowOffsetY=4; c.fillStyle=col; rr(c,x,y-(hv?2:0),w,h,14); c.fill(); c.restore(); c.fillStyle='rgba(255,255,255,.28)'; rr(c,x+4,y+3-(hv?2:0),w-8,h*.38,10); c.fill();
    c.fillStyle='#1a1430'; c.font='900 '+(h>44?17:14)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(tx,x+w/2,y+h/2-(sub?7:0)-(hv?2:0)); if(sub){ c.font='700 11px '+TC; c.fillStyle='rgba(26,20,48,.65)'; c.fillText(sub,x+w/2,y+h-9-(hv?2:0)); } }
  function status(s,col,y){ c.fillStyle=col||'#f2e8ff'; c.font='900 16px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(s,W/2,y||226); }
  function qCard(reveal){ const q=G.q>=0?Q():QS[pool[0]]; c.save(); c.shadowColor='rgba(0,0,0,.5)'; c.shadowBlur=16; c.shadowOffsetY=6; c.fillStyle='#fffaf0'; rr(c,120,52,560,104,18); c.fill(); c.restore();
    const g=c.createLinearGradient(120,0,680,0); g.addColorStop(0,'#ff4fd8'); g.addColorStop(1,'#5bd1ff'); c.fillStyle=g; rr(c,120,52,560,10,5); c.fill();
    c.fillStyle='#8a6aa8'; c.font='900 12px '+TC; c.textAlign='left'; c.textBaseline='middle'; c.fillText(BANK[q.ci][0],138,76);
    const s=reveal?q.q.replace('＿＿','【'+q.a+'】'):q.q; c.font='900 '+(s.length>20?19:23)+'px '+TC; c.textAlign='center'; const ls=wrapLines(c,s,520,2); ls.forEach((l,j)=>{ c.fillStyle='#2a1040'; c.fillText(l,W/2,110+(j-(ls.length-1)/2)*28); }); }
  function players(){ const al=[...Array(N).keys()],n=al.length,step=Math.min(96,760/n); al.forEach((i,k)=>{ const x=W/2+(k-(n-1)/2)*step,y=452,mine=local(i)&&!room;
      let done=false; if(G.ph==='write') done=G.fake[i]!=null; if(G.ph==='pick') done=G.pick[i]>=0;
      person(x,y,i,.78,done?0:Math.sin(t*6+i)*1.5);
      c.font=(mine?'900 ':'700 ')+'11px '+TC; const nm=(mine?'你':names[i]).slice(0,5)+' '+G.score[i],w=c.measureText(nm).width+12; c.fillStyle=mine?'#ffd23f':'rgba(20,8,40,.8)'; rr(c,x-w/2,y+4,w,16,8); c.fill(); c.fillStyle=mine?'#2a1e0e':'#fff'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(nm,x,y+12);
      if((G.ph==='write'||G.ph==='pick')){ c.font='900 14px '+TC; c.fillStyle=done?'#7affa0':'rgba(255,255,255,.6)'; c.fillText(done?'✔':'💭',x+18,y-44); }
      if(G.ph==='score'&&G.gain[i]){ c.font='900 15px '+TC; c.fillStyle='#ffd23f'; c.fillText('+'+G.gain[i],x,y-52); } }); }
  function ansGrid(mode){ /* mode: pick（可以點）、reveal（揭曉中）、score */ const n=G.ans.length,cols=n>4?2:1,rows=Math.ceil(n/cols),bw=cols===2?300:420,bh=Math.min(44,(220-(rows-1)*8)/rows),x0=W/2-(cols*bw+(cols-1)*14)/2,y0=170;
    const picker=myPicker(),cur=G.order&&G.ph==='reveal'?G.order[G.rv]:-1;
    G.ans.forEach((a,k)=>{ const col=k%cols,row=Math.floor(k/cols),x=x0+col*(bw+14),y=y0+row*(bh+8),own=picker!=null&&a.by.includes(picker),mine=G.pick.some((p,i)=>p===k&&(room?false:local(i)));
      const done=G.ph==='reveal'&&G.order.indexOf(k)>=0&&(G.order.indexOf(k)<G.rv||G.order.indexOf(k)===G.rv&&G.rs===2)||G.ph==='score',hl=k===cur;
      let bgc='rgba(255,255,255,.92)'; if(done) bgc=a.truth?'#7affa0':'#ffb0c8'; if(own) bgc='rgba(200,190,220,.6)';
      const canHit=mode==='pick'&&picker!=null&&!own;
      if(canHit) hit(x,y,bw,bh,()=>act({k:'pick',i:k}));
      const hv=canHit&&hoverB===btns.length-1;
      c.save(); c.shadowColor=hl?'#ffd23f':'rgba(0,0,0,.4)'; c.shadowBlur=hl?20:8; c.fillStyle=bgc; rr(c,x,y-(hv?2:0),bw,bh,12); c.fill(); c.restore(); if(hl){ c.strokeStyle='#ffd23f'; c.lineWidth=3; rr(c,x,y,bw,bh,12); c.stroke(); }
      c.fillStyle='#2a1040'; c.font='900 '+(bh>36?18:15)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(a.t,x+bw/2,y+bh/2-(hv?2:0),bw-20);
      if(own){ c.fillStyle='#5a4a7a'; c.font='700 11px '+TC; c.textAlign='right'; c.fillText('你寫的',x+bw-10,y+bh/2); }
      if(mine&&G.ph==='pick'){ c.fillStyle='#ff4fd8'; c.font='900 12px '+TC; c.textAlign='left'; c.fillText('你選的',x+8,y+bh/2); }
      /* 揭曉：誰選了、誰寫的 */ const shownV=G.ph==='score'||G.ph==='reveal'&&(G.order.indexOf(k)<G.rv||G.order.indexOf(k)===G.rv&&G.rs>=1);
      if(shownV){ const vs=[]; for(let i=0;i<N;i++) if(G.pick[i]===k) vs.push(i); vs.forEach((i,j)=>{ c.fillStyle=colOf(i); c.beginPath(); c.arc(x+14+j*16,y+bh/2,6.5,0,TAU); c.fill(); c.strokeStyle='#fff'; c.lineWidth=1.5; c.stroke(); }); }
      if(done){ c.font='900 11px '+TC; c.textAlign='right'; c.fillStyle=a.truth?'#0a6a2a':'#9a1040'; c.fillText(a.truth?'✔ 正確答案':'唬爛：'+a.by.map(i=>local(i)&&!room?'你':names[i]).join('、').slice(0,10),x+bw-10,y+bh/2); } });
    return y0+rows*(bh+8); }
  function draw(){ btns=[]; c.drawImage(bg(),0,0,W,H);
    c.fillStyle='rgba(20,8,40,.75)'; rr(c,14,10,140,30,12); c.fill(); c.fillStyle='#fff'; c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(G.ph==='intro'?'誰在唬爛':'第 '+Math.min(ROUNDS,G.r+1)+' / '+ROUNDS+' 題',84,25);
    neon(c,W-90,26,24,t);
    if(G.ph==='intro'){ introPanel(); players(); drawFx(); return; }
    qCard(G.ph==='reveal'&&G.order&&G.rv===G.order.length-1&&G.rs===2||G.ph==='score');
    const ph=G.ph;
    if(ph==='q'){ status('🎤 想一個看起來很像真的假答案！','#ffd23f',226); }
    else if(ph==='write'){ const w=myWriter();
      if(room&&w==null){ const i=roomCur(); if(i!=null){ status('把螢幕交給「'+names[i]+'」，其他人先別看！','#ffd23f',210); btn(W/2-130,240,260,58,'🙈 我是 '+names[i]+'，開始寫','#ffd23f',()=>act({k:'peek'})); } }
      else if(w!=null){ status((room?names[w]+'：':'')+'在「＿＿」填一個唬爛的答案（最多 12 個字）','#ffd23f',210); const wn=G.warn[w]; if(wn){ c.fillStyle='#ff8aa0'; c.font='900 14px '+TC; c.fillText(wn,W/2,310); } }
      else { const n=alive().filter(i=>G.fake[i]!=null).length; status('✍ 大家正在編假答案…（'+n+' / '+alive().length+'）','#f2e8ff',226); } }
    else if(ph==='pick'){ const p=myPicker();
      if(room&&p==null&&G.PT<=0){ const i=roomCur(); if(i!=null){ status('把螢幕交給「'+names[i]+'」，選一個你覺得是真的答案',  '#ffd23f',210); btn(W/2-130,240,260,58,'👀 我是 '+names[i]+'，開始選','#ffd23f',()=>act({k:'peek'})); } }
      else { ansGrid('pick'); const n=alive().filter(i=>G.pick[i]>=0).length; status(p!=null?(room?names[p]+'：':'')+'哪一個才是真的？點它！':'🤔 大家正在選…（'+n+' / '+alive().length+'）',p!=null?'#ffd23f':'#f2e8ff',158); } }
    else if(ph==='reveal'||ph==='score'){ const yb=ansGrid('reveal');
      if(ph==='reveal'&&G.order){ const a=G.ans[G.order[G.rv]],vs=[]; for(let i=0;i<N;i++) if(G.pick[i]===G.order[G.rv]) vs.push(local(i)&&!room?'你':names[i]);
        let s=''; if(G.rs===0) s='「'+a.t+'」…'; else if(G.rs===1) s=(vs.length?vs.join('、')+' 選了「'+a.t+'」':'沒有人選「'+a.t+'」')+'，它是…'; else s=a.truth?'🎉 正確答案！選中的人 +2 分':'😈 是 '+a.by.map(i=>local(i)&&!room?'你':names[i]).join('、')+' 唬爛的！騙到 '+vs.length+' 人 +'+vs.length;
        c.fillStyle='rgba(20,8,40,.85)'; rr(c,W/2-280,Math.min(yb+4,392)-4,560,34,14); c.fill(); status(s,G.rs===2?(a.truth?'#7affa0':'#ff9ad8'):'#fff',Math.min(yb+4,392)+13); }
      if(ph==='score'){ c.fillStyle='rgba(20,8,40,.85)'; rr(c,W/2-200,Math.min(yb+2,388),400,36,14); c.fill(); status(G.r+1>=ROUNDS?'最後一題結束！':'看看分數，馬上下一題','#ffd23f',Math.min(yb+2,388)+18); } }
    else if(ph==='final'){ c.fillStyle='rgba(20,8,40,.9)'; rr(c,W/2-220,176,440,200,20); c.fill(); const R=rank(); c.textAlign='center'; c.fillStyle='#ffd23f'; c.font='900 26px '+TC; c.fillText('🏆 唬爛王：'+(local(R[0])&&!room?'你':names[R[0]]),W/2,212);
      R.slice(0,5).forEach((i,k)=>{ c.font='700 15px '+TC; c.fillStyle=k?'#e8dcff':'#fff'; c.fillText((k+1)+'. '+(local(i)&&!room?'你':names[i])+'　'+G.score[i]+' 分',W/2,250+k*24); }); }
    players(); drawFx(); }
  function introPanel(){ c.fillStyle='rgba(20,8,40,.88)'; rr(c,W/2-260,70,520,290,22); c.fill(); c.textAlign='center'; c.textBaseline='middle'; neon(c,W/2,112,34,t);
    c.font='700 15px '+TC; c.fillStyle='#f0dcff'; ['每一題是一個冷知識，答案被挖空了','大家各自編一個「看起來很像真的」假答案','所有答案混在一起，選出你覺得是真的那個'].forEach((s,k)=>c.fillText(s,W/2,160+k*28));
    c.fillStyle='#ffd23f'; c.font='900 16px '+TC; c.fillText('選中真答案 +2 分・假答案每騙到一個人 +1 分',W/2,256);
    c.fillStyle='#fff'; c.font='700 13px '+TC; c.fillText(net?'連線：每個人用自己的螢幕打字、選答案':room?'大家用一台：輪流偷偷打字、輪流選':'和電腦一起玩，共 '+ROUNDS+' 題',W/2,284);
    if(room){ btn(W/2-200,300,180,50,'✏️ 改名字','#e8dcff',()=>{ editing=true; hoverB=-1; window.PARTY_NAMES.edit(env.stage,names,()=>{ editing=false; }); }); btn(W/2+20,300,180,50,'▶ 開始遊戲','#ffd23f',()=>act({k:'go'}),env.touch?'':'空白鍵'); }
    else { c.fillStyle='rgba(255,255,255,.7)'; c.fillText('馬上開始…',W/2,326); } }
  function drawFx(){ for(const f of fx){ c.save(); c.globalAlpha=Math.min(1,f.l); c.translate(f.x,f.y); c.rotate(f.r); c.fillStyle=f.c; c.fillRect(-4,-2.5,8,5); c.restore(); } }
  return {update,draw,destroy(){ const o=env.stage&&env.stage.querySelector('.pnEdit'); if(o) o.remove(); removeEventListener('resize',place); if(wrap.parentNode) wrap.remove(); canvas.removeEventListener('pointerdown',pd); canvas.removeEventListener('pointermove',pm); },
    _dbg:{get G(){ return G; },set G(v){ G=v; },doAct,QS,bot,names,N,botFake,botPick,roomCur}};
}
function stageShow(ctx,w,h,si,t){ ctx.save(); ctx.scale(w/W,h/H); const c=ctx; c.drawImage(bg(),0,0,W,H); neon(c,W/2,40,34,t);
  const list=QS.filter(q=>si>=BANK.length||q.ci===si),q=list[Math.floor(t/6)%list.length],u=(t%6)/6;
  c.save(); c.shadowColor='rgba(0,0,0,.5)'; c.shadowBlur=16; c.fillStyle='#fffaf0'; rr(c,120,76,560,84,18); c.fill(); c.restore(); c.fillStyle='#2a1040'; c.font='900 '+(q.q.length>20?19:23)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; const ls=wrapLines(c,u>.7?q.q.replace('＿＿','【'+q.a+'】'):q.q,520,2); ls.forEach((l,j)=>c.fillText(l,W/2,118+(j-(ls.length-1)/2)*26));
  const ans=[q.a].concat(q.f.slice(0,3)).sort((a,b)=>(a+b).length%2-.5); ans.forEach((a,k)=>{ const x=W/2-310+(k%2)*320,y=190+Math.floor(k/2)*58,tr=a===q.a&&u>.7; c.fillStyle=tr?'#7affa0':'rgba(255,255,255,.92)'; rr(c,x,y,300,46,12); c.fill(); c.fillStyle='#2a1040'; c.font='900 19px '+TC; c.fillText(a,x+150,y+23,280); if(tr){ c.fillStyle='#0a6a2a'; c.font='900 12px '+TC; c.textAlign='right'; c.fillText('✔ 正確答案',x+290,y+23); c.textAlign='center'; } });
  const C=window.ARCADE_CHAR; for(let k=0;k<5;k++) if(C) C.drawChar(c,W/2-240+k*120,420,PCOL[k],1,false,t+k,1.1,BOTLOOK(k).char,BOTLOOK(k).deco);
  c.font='900 24px '+TC; c.lineWidth=6; c.strokeStyle='#2a1040'; c.strokeText(STAGES[si],W/2,476); c.fillStyle='#ffd23f'; c.fillText(STAGES[si],W/2,476); ctx.restore(); }
const LSn=k=>{ try{ return +localStorage.getItem(k)||0; }catch(e){ return 0; } };
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).bluff={
  name:'誰在唬爛',tag:'WHO IS BLUFFING',color:'#ff4fd8',online:true,maxPlayers:8,minPlayers:2,bots:true,
  desc:'冷知識唬爛大賽！每題的答案被挖空，大家各編一個像真的假答案，再從所有答案裡找出真的那個。騙到越多人分數越高。一個人和電腦玩，也能連線或大家用一台。',
  goal:'在「＿＿」編一個像真的假答案，再從所有答案裡選出真的。選中真答案 +2 分，你的假答案每騙到一個人 +1 分，最後分數最高的人贏。',
  stages:STAGES,stageLabel:'選擇題庫',stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,Math.floor(t/6)%STAGES.length,t),
  stageGoal:i=>(i<BANK.length?'題庫「'+BANK[i][0]+'」':'十種題庫混在一起')+'。每題各編一個像真的假答案，再選出真答案：選中 +2 分，假答案每騙到一人 +1 分。',
  modes:[{id:'1p',label:'單人（和電腦）'},{id:'room',label:'大家用一台'}],
  options:[{key:'n',label:'玩家人數',def:'5',solo:true,opts:[3,4,5,6,7,8].map(n=>({id:String(n),label:n+' 人'}))},{key:'rounds',label:'題數',def:'6',opts:[{id:'4',label:'4 題'},{id:'6',label:'6 題'},{id:'8',label:'8 題'},{id:'10',label:'10 題'}]}],
  help:[['打字＋Enter','編一個假答案送出（💡 幫你想一個）'],['點答案','選出你覺得是真的那一個'],['空白鍵','大家用一台：開始、看完分數換下一題']],
  touchHelp:[['打字','編一個假答案送出（💡 幫你想一個）'],['點答案','選出你覺得是真的那一個']],touch:null,
  looks:[{key:'char',label:'人物',opts:[{id:'cap',label:'帽子'},{id:'cat',label:'貓耳'},{id:'bunny',label:'兔耳'},{id:'crown',label:'皇冠'},{id:'chef',label:'廚師'},{id:'pirate',label:'海盜'},{id:'ninja',label:'忍者'},{id:'bow',label:'蝴蝶結'}]},{key:'color',label:'人物顏色',type:'color',opts:['auto','#ff7a3d','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d','#3ddbd9','#ff7eb6']}],
  preview:(ctx,w,h,L,t)=>{ ctx.drawImage(bg(),0,0,w,h); const C=window.ARCADE_CHAR; if(C) C.drawChar(ctx,w/2,h*.6,!L||!L.color||L.color==='auto'?PCOL[0]:L.color,1,false,t,2.6,(L&&L.char)||'cap',''); },
  hubBest:()=>{ const v=LSn('arcade.bluff.w'); return v?'當上唬爛王 <b>'+v+'</b> 次':'尚無紀錄'; },
  best:{label:'',fmt:v=>v,lower:false},create};
})();
