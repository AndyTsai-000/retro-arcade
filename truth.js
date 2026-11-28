// 真心話轉轉樂：轉盤轉到誰，誰就選「真心話」或「大冒險」，抽一張題目卡照做！跳過要接受小懲罰。
// 大家用一台（3～10 人輪流）或連線最多 8 人（房主轉盤，大家同步看；被轉到的人在自己那台選）。10 種題庫共 1000 題（每種真心話、大冒險各 50 題）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
/* 題庫：每類 12 題真心話＋12 題大冒險 */
const BANK=[
['朋友聚會','#ff5a9a',`你手機裡最近一張照片是什麼？給大家看看
你做過最丟臉的事是什麼？
在場誰最可能成為明星？為什麼？
你最怕什麼動物？
最近一次哭是為了什麼？
你偷偷喜歡過誰？不用說名字，講三個特徵就好
你最想跟在場哪個人交換人生一天？
你說過最大的謊是什麼？
你小時候的夢想是什麼？
如果中了一千萬，第一件事做什麼？
你最受不了別人哪個習慣？
你覺得自己最大的優點是什麼？
你最近一次笑到停不下來是因為什麼？
在場誰是你最早認識的？當時對他的第一印象是什麼？
你手機裡最常聯絡的前三個人是誰？
你做過最衝動的一件事是什麼？
你覺得在場誰最會照顧人？
你最想刪掉的一張照片是什麼樣子？
如果今晚可以叫外送，你會點什麼？
你最近迷上的一首歌是什麼？
你有沒有被朋友放鴿子過？後來怎麼了？
你最常被朋友吐槽的一點是什麼？
你最想跟在場誰一起去旅行？
你參加過最好玩的一場聚會是什麼？
在場誰最可能半夜打電話給你？
你最不想被朋友知道的一個習慣？
你覺得自己在朋友圈裡是什麼角色？
如果要選在場一個人當室友，你選誰？
你有沒有說過朋友壞話被聽到？
你最想學在場哪個人的哪一項技能？
你最近一次花最多錢買的東西是什麼？
你最怕朋友問你什麼問題？
你有沒有偷偷幫朋友取過綽號？
在場誰的笑聲最有特色？
你記得最清楚的一個生日是哪一年？
你最想重來一次的一天是哪一天？
你上一次熬夜是在做什麼？
你最常講的一句口頭禪是什麼？
你覺得在場誰最會說謊？
你曾經為朋友做過最瘋狂的事？
你最想對十年前的自己說什麼？
你有沒有偷看過別人的手機？
你最近一次被感動是什麼時候？
你有什麼一直想做卻還沒做的事？
你覺得在場誰最適合當老闆？
你最喜歡朋友送你的哪一件禮物？
你曾經暗戀過朋友的朋友嗎？
你最近一次說「下次一定」是什麼事？
你在聚會上最常扮演什麼角色？
你最想跟在場誰交換衣櫃？`,`用娃娃音說「我是全場最可愛的人」
模仿在場一個人，讓大家猜是誰
跳一段 10 秒鐘的舞
用屁股在空中寫自己的名字
學一種動物叫三聲，讓大家猜是什麼
做一個超誇張的表情，維持 5 秒
對左邊的人說三句稱讚的話
唱一首兒歌的副歌
做 10 下深蹲
用台語自我介紹
保持一個搞笑姿勢 15 秒
讓右邊的人幫你取綽號，今晚大家都要這樣叫你
用三個字形容今晚的聚會
請大家各說一個你的優點，你要一一說謝謝
模仿一位在場朋友的招牌動作
用歌劇的唱法說「我好餓」
跟右邊的人比手指愛心並拍照
說出在場每個人的生日（猜錯也沒關係）
倒立或靠牆倒立 5 秒（做不到就換成扎馬步 15 秒）
學一位明星說話的樣子讓大家猜
用 30 秒推銷你自己，像在面試一樣
對大家鞠躬並說「感謝各位來參加我的演唱會」
閉上眼睛摸左邊的人的臉，猜他是誰
用一首歌的旋律唱出今天吃了什麼
做出你最帥或最美的自拍表情 5 秒
用新聞主播的口氣介紹右邊的人
說一個你覺得很好笑但可能很冷的笑話
用在場一個人的口頭禪說三句話
扮演服務生，問每個人要點什麼
跳一段廣播體操的前 8 拍
大聲喊出你的手機桌布是什麼
用氣音說一段話，讓大家猜你說什麼
假裝是導遊，介紹這個房間
做出 3 種不同的笑法
讓大家看你相簿裡的第 10 張照片
用台語唱一句歌
學一種卡通人物的聲音說「大家好」
跟左邊的人玩一次剪刀石頭布，輸了做 5 下深蹲
用最戲劇化的方式說「我不行了」
連續說 5 句稱讚自己的話
用肢體表演一種天氣，讓大家猜
維持木頭人姿勢 20 秒，大家可以逗你笑
用電影預告的語氣介紹今晚
學企鵝走路走到門口再回來
用 10 秒畫一幅自畫像給大家看
跟大家擊掌一輪
用綜藝節目主持人的口氣宣布下一位
把你的名字用 5 種不同的語氣喊出來
表演你早上剛起床的樣子
用一句話讓大家都笑，失敗就再試一次`],
['同學同事','#4f9dff',`你上課或上班時偷做過最誇張的事？
你考過最低的分數是幾分？
你最想對老師或主管說的一句話？
你有沒有假裝生病請假過？
你覺得在場誰最像班長？
你遲到最久的一次是多久？為什麼？
你最常用的貼圖是哪一張？
你的第一份打工是什麼？
你有沒有偷偷幫同學或同事取綽號？
你最喜歡一天裡的哪個時段？
你覺得自己是什麼類型的同學／同事？
如果可以放一天假，你要做什麼？
你在學校或公司最好的朋友是誰？
你有沒有在課堂或會議中睡著過？
你最討厭的一門課或一種工作是什麼？
你作弊過嗎？
你最想跟哪個同學或同事交換座位？
你在學校或公司做過最熱血的事？
你最常用什麼理由遲交作業或報告？
你有沒有被老師或主管當眾點名？
你最喜歡的一位老師或主管是誰？為什麼？
你最怕上台報告嗎？
你最常在午休做什麼？
你曾經暗戀過同學或同事嗎？
你有沒有在群組裡傳錯訊息過？
你覺得自己最像哪一種動物同學或同事？
你最得意的一次考試或專案是什麼？
你最受不了哪一種同學或同事？
你最想翹掉的一堂課或一個會議是什麼？
你畢業旅行或員工旅遊最難忘的事？
你有沒有偷偷吃過別人的零食？
你最常在桌上放什麼東西？
你有沒有假裝很忙其實在滑手機？
你寫過最長的一份報告有幾頁？
你最想從學校或公司帶走什麼？
你參加過什麼社團或社團活動？
你有沒有幫同學或同事背過黑鍋？
你最常在課堂或上班時想什麼？
你通勤時最常做什麼？
你被老師或主管稱讚過最開心的一次？
如果可以改一條校規或公司規定，你改哪一條？
你曾經在廁所躲過嗎？為什麼？
你最想聽到的一句加薪或加分理由？
你覺得在場誰最像老師？
你第一天上學或上班發生什麼事？
你最常點的午餐是什麼？
你有沒有記錯開會或考試的時間過？
你最想對同組的人說什麼？
你有沒有寫過情書或卡片給同學？
你最拿手的科目或工作技能是什麼？`,`用主播的口氣播報今天的天氣
用最正經的表情說一個冷笑話
假裝在開會，報告「為什麼要吃宵夜」30 秒
模仿你印象最深的老師或主管
用三個字形容在場每一個人
倒著念自己的名字三次
用不習慣的那隻手寫字給大家看
當一分鐘服務生，幫大家倒水
說一個你最近學到的冷知識
用饒舌的方式自我介紹
表演你上課或上班最累的樣子
把手機桌布給大家看
用老師點名的口氣點在場每個人的名字
模仿上課打瞌睡被叫醒的樣子
用 20 秒報告「我為什麼值得放假」
當一次班長喊「起立、敬禮、坐下」
用板書的方式在空中寫出今天的日期
假裝接到主管電話，說「好的我馬上處理」
模仿開會時有人一直講不停的樣子
用三個成語形容在場一個人
表演交報告前一晚趕作業的樣子
用最快速度念完九九乘法的九的那一排
當司儀，宣布「今天的會議到此結束」
模仿午休被吵醒的表情
當體育老師帶大家做 3 個暖身動作
用英文自我介紹 3 句
假裝在台上領獎並發表感言
模仿上班打卡差一分鐘遲到的樣子
說出你最常用的三個表情貼圖，並表演出來
用廣播的口氣宣布「午餐時間到了」
用雙手畫出你的座位位置圖
表演考試時偷看時鐘的樣子
用一句話形容你的工作或學業
模仿下課鐘響時大家衝出教室的樣子
當主管，對大家說一段精神喊話
表演被叫到黑板解題卻不會的樣子
用唱的念出你的學號或員工編號（可以亂編）
扮演班長收作業，跟每個人要一樣東西
說出你記得的一首校歌或一段口號
模仿同學或同事最常見的動作
表演在電梯遇到主管的尷尬樣子
當面試官，問右邊的人一個問題
學老師說「這個會考喔」
表演跑步趕公車的樣子
做 10 下開合跳
用超正式的口氣請大家喝水
大聲說出你最想放假的日期
模仿電腦當機時你的反應
用一分鐘教大家一個你會的東西
表演午餐吃太飽想睡覺的樣子`],
['家庭親子','#5fd068',`你最喜歡家裡哪一道菜？
你小時候最常被念的原因是什麼？
家裡誰最會撒嬌？
你最難忘的一次家庭旅行是哪次？
你最想跟家人一起做什麼事？
你有沒有偷偷藏過零食？藏在哪？
家裡誰最愛碎碎念？
你小時候怕黑嗎？
你收過最棒的禮物是什麼？
如果可以養任何寵物，你想養什麼？
你最想學會的一項才藝是什麼？
你覺得家裡誰最像你？
你小時候最喜歡的卡通是什麼？
你第一次離家過夜是去哪裡？
你最常跟家人吵什麼？
家裡誰煮的菜最好吃？
你小時候最想要的玩具是什麼？
你有沒有偷偷把不喜歡的菜藏起來？
你覺得家人最常誤會你什麼？
你最想對爸爸或媽媽說的一句話？
你小時候有沒有離家出走過？
家裡最常看的電視節目是什麼？
你最喜歡跟家人過哪一個節日？
你小時候最怕什麼？
家裡誰最會講笑話？
你有沒有被家人發現藏東西？
你最喜歡家裡哪個角落？
你小時候的綽號是什麼？
你最想帶家人去哪裡玩？
你有沒有偷用過爸媽的東西？
家裡誰最常賴床？
你小時候最常玩的遊戲是什麼？
你最想學家人的哪一道拿手菜？
你最難忘的一次生日是怎麼過的？
你小時候哭最慘的一次是為什麼？
家裡誰最會存錢？
你最喜歡家人怎麼叫你？
你小時候寫過最好笑的作文是什麼？
你最想跟家人說謝謝的一件事？
家裡誰最怕蟑螂？
你小時候最常被稱讚什麼？
你有沒有幫家人做過驚喜？
你最喜歡的一張全家福是在哪裡拍的？
家裡誰最常忘記東西？
你小時候最愛吃的零食是什麼？
你覺得自己最像爸爸還是媽媽？
家裡最常出現的一句話是什麼？
你最想把哪個家庭傳統傳下去？
你小時候學過什麼才藝？
你最想跟家人一起完成的願望？`,`給在場每個人一個擁抱
學爸爸或媽媽說一句口頭禪
做一個鬼臉維持 5 秒
用動作表演你最喜歡的動物，讓大家猜
唱生日快樂歌給左邊的人
說出每個人的一個優點
單腳站 15 秒
用超慢的速度說「我最愛吃青菜」
假裝自己是機器人走一圈
幫右邊的人捶背 10 秒
用三種不同的語氣說「晚安」
講一個笑話，沒人笑就再講一個
表演你小時候被叫起床的樣子
學家裡長輩打電話的樣子
用爸爸或媽媽的口氣叫大家吃飯
說一個家裡發生過的好笑小故事
給在場年紀最小的人一個稱讚
模仿家裡寵物或你想養的寵物
唱一首小時候學的兒歌
表演小時候寫功課分心的樣子
用三種方式說「我愛你」
學家人看電視睡著的樣子
假裝是小嬰兒說想喝奶
跟大家分享一張小時候的照片（沒有就描述一張）
用動作演出你最喜歡的家事
學長輩用手機傳訊息的樣子
說出家裡每個人的生日
表演過年拿到紅包的反應
當一次小老師，教大家一個字
做出你小時候最愛的姿勢拍照
用 15 秒說一個睡前故事
表演挑食被抓到的樣子
學家人催你出門的口頭禪
扮演家裡最會碎碎念的人說 10 秒
模仿你小時候最怕的事情
跟在場一個人玩拍手遊戲
用台語說「呷飽未」三種語氣
學卡通人物的招牌動作
表演第一次騎腳踏車的樣子
用最可愛的聲音說「我要零用錢」
跳一段小時候學過的舞
學爺爺奶奶散步的樣子走一圈
表演吃到很酸的東西的表情
假裝打電話回家報平安
用一句話感謝在場一個人
表演被蚊子叮到抓癢的樣子
做一個超大的伸懶腰
用最慢的速度說「我去洗澡了」
表演打翻牛奶的反應
說出三個你最喜歡的家常菜`],
['情侶閨蜜','#ff7e6a',`你的理想型是什麼樣子？
你的初戀是幾歲？
你最在意另一半哪一點？
你最浪漫的一次約會是什麼？
你會偷看另一半的手機嗎？
如果只能帶一個人去無人島，你帶誰？
對方生氣時，你最怕他做什麼？
你吃過最奇怪的醋是什麼？
你最想和誰一起去哪裡旅行？
你被告白過幾次？
你覺得在場誰最會談戀愛？
你最喜歡收到什麼樣的驚喜？
你覺得戀愛中最重要的是什麼？
你最受不了另一半哪種行為？
你談過最短的一段感情多久？
你會在第一次約會時做什麼？
你最想收到的情人節禮物是什麼？
你有沒有偷偷追蹤過前任的社群？
你和好朋友吵過最兇的一次是什麼？
你最喜歡閨蜜或好友的哪一點？
你會為了另一半改變自己嗎？
你最難忘的一句告白是什麼？
你覺得遠距離戀愛可行嗎？
你最想跟另一半一起完成的事？
你有沒有幫朋友追過人？
你最怕在另一半面前出什麼糗？
你相信一見鍾情嗎？
你心動的瞬間通常是什麼時候？
你最常跟好朋友聊什麼話題？
你有沒有吃過好朋友的醋？
你的戀愛中誰比較常先道歉？
你最想跟另一半一起養什麼寵物？
你覺得約會應該誰付錢？
你最喜歡哪一種告白方式？
你最想對前任說什麼？
你覺得在場誰最專情？
你會跟好朋友分享戀愛的細節嗎？
你最受不了好朋友哪一點？
你理想中的婚禮是什麼樣子？
你曾經為了喜歡的人做過什麼傻事？
你最喜歡另一半怎麼稱呼你？
你最在意另一半的哪一個習慣？
你覺得異性之間有純友誼嗎？
你最想跟好朋友去哪裡旅行？
你和好朋友最瘋狂的一次經歷？
你吵架後通常怎麼和好？
你最喜歡收到怎樣的訊息？
你有沒有被朋友背叛過？
你覺得自己是黏人的人嗎？
你最想跟喜歡的人一起看什麼電影？`,`深情地對左邊的人說「你今天好好看」
用 10 秒說出你好朋友的三個優點
模仿偶像劇主角說一句經典台詞
用眼神對大家放電 5 秒
對著空氣表演一段告白
用一句歌詞形容你現在的心情
跟右邊的人一起比愛心
說一句你覺得最甜的情話
學網美拍照擺三個姿勢
用撒嬌的語氣說「我肚子餓了」
花 20 秒形容你心中完美的約會
跳一段可愛的手指舞
用 10 秒說出你理想型的三個特點
對左邊的人說一句土味情話
表演收到告白時的反應
模仿偶像劇裡的壁咚（對著牆就好）
跟好朋友一起比出你們的招牌手勢
用一首情歌的歌詞跟大家打招呼
表演約會遲到的道歉
用 15 秒描述你心中最浪漫的畫面
用撒嬌語氣請右邊的人幫你倒水
表演看到喜歡的人時的緊張樣子
學閨蜜或好友說話的語氣
跟右邊的人對看 10 秒不能笑
說出在場每個人最適合哪種約會
表演第一次牽手的害羞樣子
用 3 個表情貼圖描述你的戀愛觀
唱一句情歌給大家聽
模仿網美拍照時的經典姿勢
用最深情的眼神看著一顆水果或杯子說「我愛你」
表演吵架後傳「在幹嘛」的樣子
跟在場一個人合作比一個大愛心
說一句你聽過最肉麻的話
用慢動作表演收到花的反應
假裝打電話跟另一半說晚安
用三個詞形容你最好的朋友
表演你被放閃時的表情
對大家說一句最酷的分手台詞
模仿男女主角在雨中奔跑
用超快的速度說「我喜歡你」10 次
學電影裡的求婚動作（單膝跪地）
表演等訊息已讀不回的樣子
把手機裡最後一則訊息念出來（可以挑一則不私密的）
跟左邊的人玩一次默契比手勢
表演吃醋的樣子
說出你最好的朋友的生日
用韻腳說兩句情話
表演約會時找不到話題的尷尬
用 10 秒介紹你的好朋友給大家
表演收到驚喜禮物的誇張反應`],
['搞笑挑戰','#ffb02a',`你最奇怪的習慣是什麼？
你有沒有對著鏡子練習過表情？
你最尷尬的一次口誤是什麼？
你在路上跌倒過嗎？當時怎麼辦？
你有沒有跟錯人打招呼過？
你吃過最奇怪的食物組合是什麼？
你洗澡時會唱歌嗎？都唱什麼？
你做過最奇怪的夢是什麼？
你曾經相信過最扯的謠言是什麼？
你最不會做的一件小事是什麼？
你手機裡最奇怪的 App 是哪個？
你最想擁有哪一種超能力？
你最常做的奇怪動作是什麼？
你有沒有在公共場合放屁被發現？
你上一次笑到岔氣是什麼時候？
你最尷尬的一次自拍是什麼？
你有沒有走錯廁所過？
你最奇怪的收藏是什麼？
你有沒有對寵物或植物說過話？
你最愛的冷笑話是哪一個？
你有沒有穿反衣服出門過？
你最誇張的一次睡過頭是多久？
你做過最好笑的手機自動選字錯誤是什麼？
你有沒有被自己嚇到過？
你最常找不到的東西是什麼？
你有沒有對著電視大喊過？
你吃過最難吃的東西是什麼？
你有沒有假裝自己很懂某件事？
你最怕的一種小東西是什麼？
你曾經在夢裡做過什麼好笑的事？
你有沒有不小心按到視訊電話？
你最奇怪的一個怕的東西是什麼？
你有沒有對自動門揮過手？
你在路上被認錯過嗎？
你最常唱錯的歌詞是哪一句？
你有沒有自言自語被聽到？
你最好笑的一張大頭照長怎樣？
你有沒有在電梯裡做過奇怪的事？
你曾經相信過什麼好笑的迷信？
你有沒有對錯人說「我愛你」？
你最常做的白日夢是什麼？
你有沒有不小心叫老師「媽媽」？
你玩遊戲最輸不起的時候做過什麼？
你有沒有偷偷模仿過某個人？
你曾經為了一個小東西找了多久？
你最奇怪的口頭禪是什麼？
你有沒有在洗澡時想到超棒的點子？
你有沒有被自己的鬧鐘嚇到？
你最常被說「你很怪」的原因？
你曾經做過最沒必要的努力是什麼？`,`用鼻音唱一句歌
學小雞走路繞一圈
當電視購物主持人，推銷身邊一樣東西
一口氣說三次「紅鯉魚與綠鯉魚與驢」
表演一個超誇張的打噴嚏
讓大家聽你最招牌的笑聲
假裝睡著 3 秒，再假裝被嚇醒
用超慢動作喝一口水
學猴子叫並抓癢 5 秒
表演恐怖片裡的尖叫
讓左邊的人指定一個表情，你要維持 10 秒
用自創的外星語自我介紹
用肚子發出聲音（或假裝）
學一隻打瞌睡的貓
當一次機器人，只能用機器人語氣說話直到下一輪
表演吃到超辣的東西
用 5 種語氣說「好喔」
學青蛙跳一圈
表演一個慢動作摔倒（注意安全）
用鼻子說話說一句完整的句子
學電視廣告說一句台詞
用嘴巴發出 3 種樂器的聲音
假裝在下大雨的路上走路
模仿一種家電的聲音讓大家猜
表演一個人打羽球，自己發球自己接
用手指當小人在桌上走路演一段小劇場
扮演超市廣播找走失的小孩
學一位運動員得分後的慶祝動作
用超誇張的表情吃一口零食
表演被看不見的蚊子追著跑
用屁股坐著原地轉一圈
學殭屍跳 3 下
說繞口令「四是四，十是十，十四是十四，四十是四十」
用最帥的方式喝一口水
學小嬰兒爬行一小段
表演在冰上滑倒（假裝，不要真的摔）
用手比出 5 種動物的影子
學一個超級英雄的出場姿勢
裝作被定格 10 秒
表演一場 10 秒的默劇
用破音唱一句高音
學鴨子叫並走路
表演一個人在演恐怖片
用一個奇怪的姿勢拍一張照
學外星人跟大家打招呼
用嘴巴吹出一首歌讓大家猜
表演搶到最後一塊披薩的勝利姿勢
學老爺爺說「年輕人啊」
表演找眼鏡但眼鏡在頭上的樣子
用超大聲說一句悄悄話`],
['旅行冒險','#3ddbd9',`你去過最遠的地方是哪裡？
你最想去的國家是哪一個？
你旅行時最不能少的東西是什麼？
你在旅行中迷路過嗎？
你最難忘的一頓旅行美食是什麼？
你喜歡自由行還是跟團？
你旅行時遇過最倒楣的事？
你最想再去一次的地方是哪裡？
你有沒有錯過飛機或火車過？
你旅行時一定會買的紀念品是什麼？
你最怕搭哪一種交通工具？
你在國外遇過最好心的人是誰？
你最喜歡住飯店還是民宿？
你旅行時拍最多的是風景還是自己？
你最想跟誰一起環遊世界？
你玩過最刺激的遊樂設施是什麼？
你露營過嗎？發生什麼事？
你有沒有在旅行中吵架過？
你旅行時最常忘記帶什麼？
你最喜歡的台灣景點是哪裡？
你看過最美的日出或夕陽在哪裡？
你最想體驗哪一種極限運動？
你最長的一次旅行是幾天？
你旅行時會寫日記或寄明信片嗎？
你有沒有在旅行中被騙過？
你最想去哪個地方看極光或看雪？
你旅行時最喜歡做什麼？
你最受不了的旅伴行為是什麼？
你有沒有在國外鬧過語言笑話？
你最想搭哪一種特別的交通工具？
如果可以馬上出發，你想去哪裡？
你最喜歡的一張旅行照片是什麼？
你爬過最高的山是哪一座？
你最想住一晚的特別地方是哪裡？
你旅行時最常買的東西是什麼？
你有沒有一個人旅行過？
你旅行時會規劃很詳細嗎？
你最想去的海島是哪裡？
你在旅行中做過最勇敢的事？
你最難忘的一次搭車經驗？
你去過最冷或最熱的地方是哪裡？
你最想去的城市夜景是哪裡？
你在飛機上睡得著嗎？
你最想體驗的一種節慶是什麼？
你旅行時最常吃壞肚子嗎？
你有沒有在旅行中認識新朋友？
你最喜歡的一間博物館或展覽是什麼？
你最想帶家人去哪裡玩？
你旅行時最想逃離的是什麼？
你下一趟旅行打算去哪裡？`,`當導遊介紹你最喜歡的一個景點 20 秒
表演在機場找登機門找不到的樣子
用三種語言說「你好」
學空服員示範安全帶怎麼扣
表演第一次坐雲霄飛車的表情
假裝在山頂上大喊一句話
用動作演出你最想去的國家讓大家猜
表演在國外點餐看不懂菜單
學外國人用中文說「謝謝」
假裝拖著超重的行李箱走一圈
表演坐飛機遇到亂流
用 15 秒推銷你的家鄉
學沙灘上的寄居蟹橫著走
當領隊，用旗子（用手代替）帶大家走一圈
表演在溫泉裡很燙的樣子
學背包客問路
用三個詞形容你最難忘的旅行
表演在帳篷裡被蚊子吵醒
假裝在拍旅遊 Vlog 開場 10 秒
表演搭火車差點錯過下車
學海關人員問右邊的人「來旅遊嗎？」
表演第一次看到雪的反應
用動作表演衝浪
學在高空玻璃橋上走路的樣子
假裝在吃路邊攤吃到很燙
表演迷路時看地圖的樣子
用氣音當一次博物館導覽員
學一種異國舞蹈 10 秒
表演在沙漠裡很渴找水
扮演旅館櫃檯幫大家辦入住
學觀光客瘋狂拍照的樣子
表演坐長途巴士睡著頭一直點
用最快速度說出 5 個國家的首都
表演抵達目的地時的歡呼
學站在船頭張開雙手
表演在纜車上不敢往下看
假裝打包行李但塞不進去
用台語介紹一個台灣景點
表演在遊樂園排隊排很久
學野外求生節目的主持人說一句話
用動作表演攀岩
表演在夜市一路吃不停
假裝搭熱氣球往下揮手
學觀光導覽車的廣播
表演找不到護照的慌張
用 10 秒畫出台灣的形狀
表演第一次潛水看到魚
學旅遊節目主持人吃到美食的反應
扮演計程車司機問「去哪裡？」
表演旅行最後一天捨不得回家`],
['吃貨人生','#ff9d3d',`你這輩子吃過最貴的一餐是什麼？
你最不能接受的食物是什麼？
你一餐最多吃過幾碗飯？
你最喜歡的宵夜是什麼？
如果只能吃一種食物一個月，你選什麼？
你最愛的手搖飲點法是什麼？
你有沒有偷吃過別人的食物？
你最常去的一家店是哪一家？
你吃火鍋一定要點什麼？
你覺得香菜好吃嗎？
你最拿手的一道菜是什麼？
你吃過最奇怪的口味是什麼？
你吃到飽最高紀錄吃了多少？
你最喜歡的早餐組合是什麼？
你有沒有為了吃排隊排很久？
你最想學做的一道料理是什麼？
你吃東西會先拍照嗎？
你最喜歡的甜點是什麼？
你有沒有吃東西吃到哭過？
你減肥最常失敗的原因是什麼食物？
你吃過最辣的東西是什麼？
你最喜歡的夜市小吃是什麼？
你覺得鳳梨可以放在披薩上嗎？
你最愛的泡麵口味是什麼？
你會為了美食專程跑去另一個城市嗎？
你最喜歡的水果是什麼？
你吃飯最常配什麼飲料？
你最討厭的一種青菜是什麼？
你最愛的便利商店食物是什麼？
你有沒有煮東西煮到燒焦？
你吃過最好吃的一碗麵在哪裡？
你最喜歡的零食是什麼？
你最想在哪個國家吃一頓大餐？
你會吃動物內臟嗎？
你吃牛排喜歡幾分熟？
你最喜歡的冰品是什麼？
你最常點的外送是什麼？
你吃過最難吃的一頓飯在哪裡？
你最喜歡的媽媽的味道是哪道菜？
你半夜最想吃什麼？
你喝咖啡還是喝茶？
你吃飯速度快還是慢？
你有沒有吃東西被噎到過？
你最想發明什麼新口味？
你最喜歡的麵包是什麼？
你吃過最大份的食物是什麼？
你覺得臭豆腐是香還是臭？
你最喜歡的過年料理是什麼？
你最想把哪一種食物變成無限供應？
你吃東西最奇怪的習慣是什麼？`,`用美食評論家的口氣評論你手邊的飲料
表演吃到超燙的小籠包
學廚師甩鍋炒菜的樣子
用 10 秒推銷一碗滷肉飯
表演喝到很酸的檸檬汁
假裝在做一個巨大的漢堡，一層一層疊
表演吃泡麵吃到最後一口的滿足感
學夜市老闆叫賣
用動作表演剝螃蟹
表演吃到不喜歡的菜但要假裝好吃
用三個形容詞讚美你最愛的食物
表演吃冰淇淋吃太快頭痛
學吃播主播的開場
表演餓到不行的樣子
用歌唱的方式點一份套餐
假裝拉麵很長一直吸不完
表演打開便當發現沒有肉
學外國人第一次吃臭豆腐
表演喝珍奶珍珠卡在吸管
用 5 秒說出 5 種水果
表演切洋蔥流眼淚
學蛋被打進鍋子的聲音
扮演服務生介紹今日特餐
表演吃到很辣的麻辣鍋
用動作演出你最愛的食物讓大家猜
表演看到吃到飽餐廳的興奮
學大胃王比賽最後衝刺
表演吃飯吃到睡著
用最誇張的方式說「好吃！」
表演第一次用筷子夾滑滑的湯圓
學烤肉翻面的樣子
假裝在試吃攤一直拿
表演搶最後一塊雞排
說一個跟食物有關的冷笑話
表演吃到很硬的法國麵包
學打果汁機的聲音
表演做蛋糕失敗的樣子
用三種語氣說「我吃飽了」
扮演外送員按門鈴說「您的餐點到了」
表演吃西瓜吐籽比賽
學嬰兒吃副食品的表情
表演咬到舌頭的樣子
用動作表演包水餃
表演第一次喝黑咖啡
學老饕品嘗紅酒
表演吃到中獎的幸運餅乾
假裝在節目上當美食評審打分數
表演吃太飽解開褲子扣子（假裝）
學冰淇淋融化的樣子
用唱的說出今晚的晚餐`],
['網路與手機','#7a8aff',`你一天大概用手機幾個小時？
你手機裡最常開的 App 是什麼？
你最後一則搜尋的內容是什麼？
你有沒有發過後悔的貼文？
你追蹤最多的是哪一類帳號？
你最常用的表情符號是哪一個？
你手機裡最多的照片是什麼？
你有沒有被已讀不回過？
你最長一次沒用手機是多久？
你有沒有在網路上吵過架？
你最常看哪一類影片？
你的手機桌布是什麼？
你有沒有用過別人的帳號？
你最想刪掉的一則留言是什麼？
你有沒有在網路上認識朋友？
你玩過最久的手機遊戲是什麼？
你最常在什麼時候滑手機？
你手機電量低於多少會開始緊張？
你有沒有偷偷封鎖過誰？
你最常傳的一句訊息是什麼？
你會在群組裡潛水嗎？
你有沒有打錯字造成誤會？
你覺得自己是手機成癮嗎？
你最常用的濾鏡是哪一個？
你最喜歡的網紅或頻道是誰？
你有沒有在網路上買過踩雷的東西？
你最近一次截圖截了什麼？
你有幾個群組？最吵的是哪個？
你會看別人的限時動態但不留言嗎？
你最常聽的 Podcast 或音樂清單是什麼？
你有沒有手機掉進水裡過？
你最常忘記的密碼是哪一個？
你最想發明什麼 App？
你有沒有在半夜發過貼文？
你最怕手機被誰看到？
你最常點的推薦影片是什麼類型？
你有沒有幫手機取名字？
你最常用的通訊軟體是什麼？
你最多一天收到幾則訊息？
你會一直重看自己的貼文嗎？
你有沒有被網路謠言騙過？
你第一支手機是什麼？
你會用語音訊息還是打字？
你最想取消追蹤的類型是什麼？
你最喜歡的迷因是什麼？
你有沒有在網路上講過別人壞話？
你會把手機放在床邊睡覺嗎？
你最常拍的影片是什麼？
你最受不了的訊息習慣是什麼？
如果一週不能用手機，你最想念什麼？`,`念出你手機最後一則搜尋紀錄（可以挑不私密的）
表演手機只剩 1% 電的慌張
學 YouTuber 開場說「哈囉大家好」
用表情演出 3 個常用的表情符號
表演收到已讀不回的心情
假裝在直播並跟觀眾打招呼
學語音助理回答一個問題
表演手機掉到地上撿起來檢查的樣子
用 10 秒介紹你最常用的 App
表演自拍找角度的過程
學網購開箱的反應
表演群組訊息爆量的崩潰
用動作演出一個熱門舞蹈挑戰
表演網路很慢在轉圈圈
學打字很慢的長輩傳訊息
表演找手機但手機在手上
用超快的速度念一串訊息
假裝在錄限時動態介紹今晚
表演被手機遊戲激怒的樣子
學新聞說「根據網友爆料」
表演滑手機滑到睡著
用迷因表情做出 3 個經典表情
表演收到驚喜訊息的反應
學客服機器人說「很抱歉我聽不懂」
用 15 秒介紹一個你喜歡的頻道
表演視訊時畫面卡住定格
學自動語音說「您撥的電話未開機」
表演找 Wi-Fi 密碼的樣子
假裝拍美食照片擺盤
表演傳錯訊息後瘋狂想收回
學網紅推薦商品
表演第一次用 VR 眼鏡
用動作表演你最常看的影片類型
表演手機螢幕摔破的反應
學手機鈴聲讓大家猜是哪一種
表演按讚按到手痠
用三句話寫一篇超短的貼文念出來
表演看恐怖影片被嚇到
學外送 App 的通知聲
表演在電影院手機突然響
用一個表情符號形容每個人
表演網路突然斷線的反應
學直播主感謝贈禮
表演玩手遊抽卡抽到大獎
假裝跟語音助理吵架
表演手機掉進馬桶（假裝）
學打電動時的激動喊叫
表演看到前任貼文的表情
用 10 秒講一個網路流行語的意思
表演把手機鎖起來一分鐘的痛苦（真的放下手機一分鐘）`],
['深夜談心','#8a5ac8',`你最近最煩惱的一件事是什麼？
你覺得自己最大的改變是什麼？
你最想感謝的一個人是誰？
你曾經最孤單的時候是什麼時候？
你最想實現的夢想是什麼？
你最害怕失去什麼？
你覺得什麼時候的自己最快樂？
你有沒有一個一直放不下的遺憾？
你最想跟誰道歉？
你覺得朋友之間最重要的是什麼？
你最常在什麼時候想家？
你覺得自己被誤會最深的一點是什麼？
你最想重新選擇的一個決定是什麼？
你心情不好時會做什麼？
你最佩服的人是誰？為什麼？
你覺得十年後的自己在做什麼？
你最想對在場誰說謝謝？
你最近一次哭是為了什麼？
你覺得人生最重要的三件事是什麼？
你有沒有一句很喜歡的座右銘？
你最想放下的一件事是什麼？
你覺得愛是什麼？
你最想回到哪一年？
你覺得自己最勇敢的一次是什麼？
你最不想讓人看到的一面是什麼？
你最珍惜的一樣東西是什麼？
你有沒有一個想念但聯絡不到的人？
你覺得成功是什麼？
你最怕別人怎麼看你？
你曾經放棄過什麼很重要的東西？
你最喜歡自己的哪一點？
你覺得在場誰最懂你？
你壓力大時會跟誰說？
你最想改掉自己的哪個習慣？
你曾經最失落的一次是什麼？
你覺得什麼樣的生活是幸福？
你最想對未來的自己說什麼？
你有沒有一件做了很驕傲的事？
你最常想起的一段回憶是什麼？
你覺得長大最難的是什麼？
你最想學會的人生技能是什麼？
你有沒有一個不敢說出口的願望？
你覺得自己是樂觀還是悲觀的人？
你最希望別人怎麼記得你？
你最喜歡一個人的時候做什麼？
你最近一次真心大笑是為什麼？
你覺得朋友會因為什麼走散？
你最想跟家人說但沒說的話是什麼？
如果明天是最後一天，你想做什麼？
你今晚最開心的一刻是什麼？`,`對在場每個人說一句真心的謝謝
用一句話形容你現在的心情
給右邊的人一個溫暖的擁抱
說一件今天讓你開心的小事
閉上眼睛深呼吸三次，說出你現在聽到的聲音
對大家說一句鼓勵的話
用 15 秒分享一個你喜歡的回憶
唱一句讓你感動的歌
說出左邊的人讓你欣賞的地方
用三個詞形容你的十年後
寫下（或說出）一個今年的小目標
跟大家分享一首睡前想聽的歌
用最溫柔的聲音說晚安
說一個你最近學到的人生道理
對著大家比一個加油的手勢
說出一個你想對自己說的稱讚
分享一張讓你最放鬆的照片（沒有就描述）
用 10 秒描述你理想的週末
說一個你很感謝的小人物
跟在場一個人約定下次一起做的事
用動作表演你放鬆的方式
說出今晚你最想記住的一句話
對著鏡子（或手機前鏡頭）說「你很棒」
分享一本或一部影響你很深的書或電影
用一個顏色形容在場每個人
說出你最喜歡的季節和原因
用一句話安慰一個假想中難過的朋友
分享一個你最近的小確幸
說一個你從朋友身上學到的事
唱一首搖籃曲的開頭
用三句話介紹你最好的朋友
說出一個你小時候的夢想
跟大家分享一個讓你安心的味道
對左邊的人說「辛苦了」並說原因
說出一件你想重新開始的事
用一個動作代表你今年的關鍵字
跟大家說一句你最喜歡的話
說出你現在最想見的人
分享一個你覺得很溫暖的瞬間
用 10 秒描述你心中的家
跟大家一起倒數 10 秒然後一起微笑
說出你最近一次幫助別人的事
跟在場一個人說一句「我挺你」
描述一個你最想再看一次的風景
說出你今年最想感謝的三件事
用一句話給明天的自己打氣
分享一個你難過時會做的小儀式
說出你最喜歡的一個節日回憶
跟大家說你下次聚會想做什麼
說一句今晚的結語`],
['腦洞假設','#a8e05a',`如果你可以隱形一天，你要做什麼？
如果動物會說話，你最想跟哪種動物聊天？
如果你變成一種食物，你會是什麼？
如果可以穿越時空，你要去哪一年？
如果你是校長或老闆，第一條新規定是什麼？
如果世界上沒有手機，你會怎麼過？
如果你可以有一個機器人管家，你要它做什麼？
如果你變成貓一天，你會做什麼？
如果可以換一個名字，你要叫什麼？
如果你能跟任何名人吃飯，你選誰？
如果你住在海底，你的家長怎樣？
如果你可以發明一個節日，那是什麼節？
如果你醒來變成另一個性別，第一件事做什麼？
如果你有一台時光機只能用一次，你會怎麼用？
如果可以讀別人的心，你最想讀誰的？
如果你是超級英雄，你的弱點是什麼？
如果你可以飛，第一個想去哪裡？
如果世界只剩一種顏色，你希望是什麼顏色？
如果你可以在任何地方睡一晚，你選哪裡？
如果你中了樂透但只能花在一個城市，你選哪？
如果你是一種天氣，你是什麼天氣？
如果你可以讓一種動物變成巨大，你選什麼？
如果你可以跟過去的自己說一句話，你說什麼？
如果你變成一隻螞蟻，你怎麼度過一天？
如果你可以擁有一間任意房間，你要什麼房？
如果所有人都要戴面具，你的面具長怎樣？
如果你能控制一個季節，你選哪個？
如果你是電影主角，那部電影叫什麼？
如果你的人生有背景音樂，是哪首歌？
如果明天開始不用睡覺，你多出的時間做什麼？
如果你可以把一種食物變成零熱量，你選什麼？
如果你是一間店的老闆，你賣什麼？
如果外星人來地球，你會帶他去哪？
如果你可以複製自己，你讓分身做什麼？
如果你能變成任何東西一小時，你變成什麼？
如果你可以發明一種新顏色，它叫什麼？
如果你住在月球，你最想念地球什麼？
如果你可以跟一個卡通角色交朋友，你選誰？
如果你是一本書，書名是什麼？
如果你可以把一個缺點變成超能力，是哪個？
如果你可以只用三個字說話一天，你選哪三個字？
如果世界上的貓都變成狗，會怎樣？
如果你是一隻鳥，你要飛去哪裡過冬？
如果你可以重新設計人體，你要加什麼功能？
如果你是一種水果，你會是什麼？
如果可以讓一個明星當你的家人，你選誰？
如果你能讓下雨下的是一種食物，你選什麼？
如果你有一扇任意門，第一個打開去哪？
如果你可以讓時間暫停十分鐘，你要做什麼？
如果你是一種家電，你會是什麼？`,`用動作表演你變成一種食物
假裝自己是外星人第一次看到地球的東西
表演你有超能力時的出場姿勢
用 15 秒介紹你發明的新節日
學你想變成的動物 10 秒
假裝你是一台會說話的冰箱
表演在月球上走路
用動作表演你最想要的超能力
扮演時光旅人剛到現代的驚訝
假裝你是機器人管家，服務左邊的人
表演變成隱形人偷偷走一圈
用三句話介紹你人生電影的劇情
假裝自己是一顆正在融化的冰淇淋
表演你是一隻剛學會飛的鳥
用一種新語言（亂編）說一句話
扮演國王或女王頒布一條命令
假裝你是一台壞掉的電視
表演你在海底的家
學一隻貓變成人第一次走路
用 10 秒設計一個新運動並示範
假裝你是天氣預報裡的颱風
表演你是一棵被風吹的樹
扮演博物館裡的雕像，大家可以逗你笑
用動作表演你發明的機器
假裝你是一隻螞蟻扛著大餅乾
表演你是穿越到古代的人點餐
用最誇張的方式介紹自己是一顆星球
扮演一個超級英雄最弱的時刻
假裝你是一台正在找訊號的收音機
表演你是一顆彈跳的球
用歌唱的方式介紹你的超能力
扮演一隻害羞的恐龍
假裝你是 GPS 導航帶大家去廁所
表演你是被冷凍又解凍的人
用 3 個動作演出你理想的一天
扮演一位魔法師對右邊的人施法
假裝你是一顆正在發芽的種子
表演你醒來變成一隻狗
用 10 秒推銷一個不存在的產品
扮演一隻會說話的鸚鵡重複別人的話
假裝你是一支正在充電的手機
表演你是童話故事裡的反派
用動作演出你變成雲
扮演一位未來人介紹 2100 年
假裝你是一架起飛的紙飛機
表演你是一隻怕水的魚
用奇怪的聲音當一次電影旁白
扮演一個剛甦醒的木乃伊
假裝你是一顆正在爆開的爆米花
表演你獲得超能力後第一件做的事`]];
const THEMES=BANK.map(b=>b[0]).concat(['綜合隨機']),TCOL=BANK.map(b=>b[1]).concat(['#c56bff']);
const Q=BANK.map(b=>({truth:b[2].split('\n'),dare:b[3].split('\n')}));
const PUN=['喝一大口水','做 10 下開合跳','學貓叫 3 聲','唱一句歌','說一個冷笑話','原地轉 5 圈','用屁股寫自己的名字','比一個超可愛的動作'];
const PCOL=['#ff5d4f','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d','#3ddbd9','#ff7eb6','#8a5a3c','#a8e05a','#7a8aff','#e8c050'];
const BOTLOOK=i=>({char:['cat','bunny','chef','pirate','ninja','crown','bow','cap'][i%8],color:'auto',deco:['','shades','scarf','cape','blush','tie'][i%6]});
function wrap(c,s,maxW){ const out=[]; let line=''; for(const ch of s){ if(c.measureText(line+ch).width>maxW&&line){ out.push(line); line=ch; } else line+=ch; } if(line) out.push(line); return out; }
function bgArt(c,t,col){ const g=c.createRadialGradient(400,250,40,400,250,520); g.addColorStop(0,'#3a1450'); g.addColorStop(1,'#12061e'); c.fillStyle=g; c.fillRect(0,0,W,H);
  for(let i=0;i<10;i++){ const a=t*.25+i/10*TAU; c.save(); c.globalAlpha=.06; c.fillStyle=i%2?col:'#fff'; c.translate(270,268); c.rotate(a); c.beginPath(); c.moveTo(0,0); c.lineTo(620,-80); c.lineTo(620,80); c.fill(); c.restore(); }
  for(let i=0;i<40;i++){ const x=(i*131)%W,y=(i*71)%H,tw=.4+.6*Math.abs(Math.sin(t*2+i)); c.fillStyle='rgba(255,255,255,'+tw*.6+')'; c.fillRect(x,y,2,2); }
  /* 燈泡串 */ for(let i=0;i<22;i++){ const x=i*38+10,y=14+Math.sin(i*.6)*4,on=(Math.floor(t*4)+i)%3===0; c.fillStyle=on?'#ffe86a':'#7a5a2a'; c.beginPath(); c.arc(x,y,5,0,TAU); c.fill(); if(on){ c.fillStyle='rgba(255,232,106,.25)'; c.beginPath(); c.arc(x,y,12,0,TAU); c.fill(); } } }
function wheelArt(c,cx,cy,R,ang,names,cols,t,hi){ const n=names.length,seg=TAU/n; c.save(); c.translate(cx,cy);
  c.fillStyle='rgba(0,0,0,.35)'; c.beginPath(); c.arc(6,10,R+14,0,TAU); c.fill(); c.fillStyle='#ffd23f'; c.beginPath(); c.arc(0,0,R+14,0,TAU); c.fill(); c.fillStyle='#c8901a'; c.beginPath(); c.arc(0,0,R+6,0,TAU); c.fill();
  for(let k=0;k<24;k++){ const a=k/24*TAU,on=(Math.floor(t*6)+k)%2; c.fillStyle=on?'#fff6c8':'#a8701a'; c.beginPath(); c.arc(Math.cos(a)*(R+10),Math.sin(a)*(R+10),3.2,0,TAU); c.fill(); }
  c.rotate(ang); for(let i=0;i<n;i++){ c.fillStyle=cols[i%cols.length]; c.beginPath(); c.moveTo(0,0); c.arc(0,0,R,i*seg,(i+1)*seg); c.closePath(); c.fill(); c.fillStyle=i%2?'rgba(255,255,255,.12)':'rgba(0,0,0,.06)'; c.fill(); if(hi===i){ c.fillStyle='rgba(255,255,255,'+(.25+.2*Math.sin(t*10))+')'; c.fill(); } c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=2; c.stroke();
    c.save(); c.rotate((i+.5)*seg); const flip=Math.cos(ang+(i+.5)*seg)<0; if(flip) c.rotate(Math.PI); c.fillStyle='#fff'; c.font='900 '+(n>8?14:17)+'px '+TC; c.textAlign=flip?'left':'right'; c.textBaseline='middle'; c.lineWidth=4; c.strokeStyle='rgba(0,0,0,.35)'; const s=names[i].slice(0,5),tx=flip?-(R-16):R-16; c.strokeText(s,tx,0); c.fillText(s,tx,0); c.restore(); }
  c.restore(); c.save(); c.translate(cx,cy); const hub=c.createRadialGradient(-8,-8,4,0,0,34); hub.addColorStop(0,'#fff'); hub.addColorStop(1,'#d8d0e8'); c.fillStyle=hub; c.beginPath(); c.arc(0,0,32,0,TAU); c.fill(); c.strokeStyle='#c8901a'; c.lineWidth=4; c.stroke(); c.fillStyle='#ff5a9a'; c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('轉！',0,1);
  /* 指針（上方） */ c.fillStyle='#ff3b5a'; c.strokeStyle='#7a0a1a'; c.lineWidth=3; c.beginPath(); c.moveTo(0,-R+18); c.lineTo(-16,-R-22); c.lineTo(16,-R-22); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#fff'; c.beginPath(); c.arc(0,-R-14,5,0,TAU); c.fill(); c.restore(); }
function create(env,opts){
  const {ctx:c,canvas}=env.canvas2d(W,H),net=opts.net,client=!!net&&!net.host,host=!client,pv=!!opts.preview,OP=opts.options||{},si=clamp(opts.stage|0,0,THEMES.length-1);
  const n=net?net.count:pv?6:clamp(+OP.seats||5,3,12),me=net?net.me:-1,ROUNDS=+OP.rounds||12,local=!net;
  const names=[],looks=[]; for(let i=0;i<n;i++){ names.push(net?(net.names&&net.names[i])||'玩家'+(i+1):i===0&&opts.name&&opts.name!=='你'?opts.name:'玩家 '+(i+1)); looks.push(net?(net.looks&&net.looks[i])||BOTLOOK(i):i===0&&opts.look?opts.look:BOTLOOK(i)); }
  if(local&&!pv&&window.PARTY_NAMES) window.PARTY_NAMES.fill(names);
  const colOf=i=>{ const L=looks[i]; return !L||!L.color||L.color==='auto'?PCOL[i%PCOL.length]:L.color; },cols=names.map((_,i)=>colOf(i));
  const CX=270,CY=272,RAD=186,K=1.15;
  let t=0,ended=false,sendT=0,evq=[],fx=[],lastSeg=-1,hover='',editing=false;
  const used={truth:new Set(),dare:new Set()};
  let G={ph:'spin0',a0:-Math.PI/2-Math.PI/n,v0:0,el:0,dur:0,who:-1,kind:'',q:'',pun:'',round:1,spinBy:0,done:Array(n).fill(0),skip:Array(n).fill(0),cnt:Array(n).fill(0),flip:0,evN:0};
  const ang=()=>G.ph==='spin'?G.a0+G.v0/K*(1-Math.exp(-K*G.el)):G.a0+(G.v0?G.v0/K:0);
  const segAt=a=>{ const seg=TAU/n,rel=((-Math.PI/2-a)%TAU+TAU)%TAU; return Math.floor(rel/seg)%n; };
  const sfx=k=>{ if(pv) return; env.sfx(k); if(net&&host) evq.push(k); };
  const tone=(f,d,type,v)=>{ const A=env.audio&&env.audio(); if(!A||pv) return; try{ const o=A.createOscillator(),g=A.createGain(),t0=A.currentTime; o.type=type||'triangle'; o.frequency.value=f; g.gain.setValueAtTime(v||.05,t0); g.gain.exponentialRampToValueAtTime(.001,t0+d); o.connect(g); g.connect((env.out&&env.out())||A.destination); o.start(t0); o.stop(t0+d+.02); }catch(e){} };
  function pickQ(kind){ const pool=si<BANK.length?Q[si][kind].map(q=>[si,q]):Q.flatMap((b,bi)=>b[kind].map(q=>[bi,q])),fresh=pool.filter(p=>!used[kind].has(p[1])),from=fresh.length?fresh:(used[kind].clear(),pool),p=from[Math.floor(Math.random()*from.length)]; used[kind].add(p[1]); return p[1]; }
  /* 動作（房主執行；連線時客人送過來） */
  function doSpin(by){ if(G.ph!=='spin0'&&G.ph!=='next') return; if(net&&by!==G.spinBy&&!(by===0&&G.ph==='spin0'&&G.round===1)) return;
    // 轉到誰：越少被轉到的人機會越大，不會一直同一個人
    const w=G.cnt.map(k=>1/(1+k*1.6)),tot=w.reduce((a,b)=>a+b,0); let r=Math.random()*tot,tg=0; for(let i=0;i<n;i++){ r-=w[i]; if(r<=0){ tg=i; break; } }
    const cur=ang(),seg=TAU/n,want=-Math.PI/2-(tg+.2+Math.random()*.6)*seg; let d=((want-cur)%TAU+TAU)%TAU; d+=TAU*(3+Math.floor(Math.random()*2));
    G.a0=cur; G.v0=d*K; G.el=0; G.dur=Math.log(d*K/.05)/K; G.ph='spin'; G.who=-1; G.kind=''; G.q=''; G.pun=''; G.flip=0; sfx('go'); }
  function choose(by,kind){ if(G.ph!=='choose'||(net&&by!==G.who)) return; if(kind==='rand') kind=Math.random()<.5?'truth':'dare'; G.kind=kind; G.q=pickQ(kind); G.ph='card'; G.flip=0; G.evN++; sfx('item'); }
  function resolve(by,ok){ if(G.ph!=='card'||(net&&by!==G.who)) return; G.spinBy=G.who; if(G.round>=ROUNDS&&ROUNDS<99) G.last=1;
    if(ok){ G.done[G.who]++; sfx('win'); burst(); nextRound(); } else { G.skip[G.who]++; G.pun=PUN[Math.floor(Math.random()*PUN.length)]; G.ph='pun'; sfx('lose'); } }
  function nextRound(){ if(G.last){ G.ph='end'; return; } G.round++; G.ph='next'; }
  function burst(){ for(let i=0;i<60;i++){ const a=Math.random()*TAU,s=120+Math.random()*300; fx.push({x:590,y:220,vx:Math.cos(a)*s,vy:Math.sin(a)*s-120,l:.8+Math.random()*.6,c:PCOL[i%PCOL.length],r:Math.random()*TAU}); } }
  function stepHost(dt){ if(G.ph==='spin'){ G.el+=dt; if(G.el>=G.dur){ G.a0=G.a0+G.v0/K*(1-Math.exp(-K*G.el)); G.v0=0; G.who=segAt(G.a0); G.cnt[G.who]++; G.ph='choose'; G.evN++; sfx('pop'); } } }
  function finish(){ const order=[...Array(n).keys()].sort((a,b)=>G.done[b]-G.done[a]||G.skip[a]-G.skip[b]),top=order[0];
    env.sfx('win'); env.end({title:'真心話轉轉樂結束',big:G.done[top]?'最勇敢：'+names[top]:'大家都好害羞！',text:'一共玩了 '+G.round+' 輪',
      html:'<table class="ls"><tr><th>玩家</th><th>完成</th><th>跳過</th></tr>'+order.map(i=>'<tr><td>'+names[i]+'</td><td>'+G.done[i]+'</td><td>'+G.skip[i]+'</td></tr>').join('')+'</table>',score:null}); }
  if(net){ if(client) net.onmsg=m=>{ if(m.st){ const was=G.evN,ph=G.ph; G=m.st; if(G.ph==='next'&&ph==='card') burst(); if(G.ph==='end'&&!ended){ ended=true; finish(); } } if(m.ev) for(const k of m.ev) env.sfx(k); };
    else net.onmsg=(m,from)=>{ if(m.a==='spin') doSpin(from); else if(m.a==='pick') choose(from,m.k); else if(m.a==='res') resolve(from,!!m.ok); else if(m.a==='go') { if(from===G.who&&G.ph==='pun') nextRound(); } }; }
  /* 自己這台能不能操作 */
  const canSpin=()=>(G.ph==='spin0'||G.ph==='next')&&(local||G.spinBy===me||G.ph==='spin0'&&G.round===1&&me===0);
  const canPick=()=>G.ph==='choose'&&(local||G.who===me);
  const canRes=()=>(G.ph==='card'||G.ph==='pun')&&(local||G.who===me);
  function act(a,k){ if(pv) return; if(a==='spin'&&!canSpin()) return; if(a==='pick'&&!canPick()) return; if((a==='res'||a==='go')&&!canRes()) return; tone(720,.05);
    if(client){ net.send({a,k,ok:k}); return; } const by=net?me:G.who; if(a==='spin') doSpin(net?me:G.spinBy); else if(a==='pick') choose(by,k); else if(a==='res') resolve(by,k); else if(a==='go'&&G.ph==='pun') nextRound(); }
  /* 按鈕 */
  const BTN={spin:[520,330,240,64],truth:[510,250,130,110],dare:[650,250,130,110],rand:[540,372,210,44],ok:[510,404,130,52],no:[650,404,130,52],go:[560,404,180,52],end:[W-92,H-38,80,28],name:[12,52,104,30]};
  const canName=()=>local&&!pv&&!editing&&!!window.PARTY_NAMES&&(G.ph==='spin0'||G.ph==='next');
  const inR=(x,y,[a,b,w,h])=>x>=a&&y>=b&&x<=a+w&&y<=b+h;
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const which=(x,y)=>{ if(canName()&&inR(x,y,BTN.name)) return ['name']; if(canSpin()&&(inR(x,y,BTN.spin)||Math.hypot(x-CX,y-CY)<RAD)) return ['spin']; if(canPick()){ if(inR(x,y,BTN.truth)) return ['pick','truth']; if(inR(x,y,BTN.dare)) return ['pick','dare']; if(inR(x,y,BTN.rand)) return ['pick','rand']; }
    if(G.ph==='card'&&canRes()){ if(inR(x,y,BTN.ok)) return ['res',true]; if(inR(x,y,BTN.no)) return ['res',false]; } if(G.ph==='pun'&&canRes()&&inR(x,y,BTN.go)) return ['go']; if(local&&G.ph==='next'&&ROUNDS>=99&&inR(x,y,BTN.end)) return ['end']; return null; };
  const pd=e=>{ const [x,y]=toG(e),w=which(x,y); if(!w) return; if(w[0]==='end'){ G.ph='end'; return; } if(w[0]==='name'){ editing=true; hover=''; window.PARTY_NAMES.edit(env.stage,names,()=>{ editing=false; }); return; } act(w[0],w[1]); };
  const pm=e=>{ const [x,y]=toG(e),w=which(x,y); hover=w?w.join(':'):''; canvas.style.cursor=w?'pointer':''; };
  canvas.addEventListener('pointerdown',pd); canvas.addEventListener('pointermove',pm);
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt; if(G.flip<1) G.flip=Math.min(1,G.flip+dt*3);
    if(!pv&&!editing){ if(env.hit('Space')){ if(canSpin()) act('spin'); else if(G.ph==='pun') act('go'); } if(env.hit('Digit1')||env.hit('ArrowLeft')) canPick()&&act('pick','truth'); if(env.hit('Digit2')||env.hit('ArrowRight')) canPick()&&act('pick','dare'); if(env.hit('Digit3')||env.hit('ArrowDown')) canPick()&&act('pick','rand');
      if(env.hit('Enter')){ if(G.ph==='card') act('res',true); else if(G.ph==='pun') act('go'); } if(env.hit('Backspace')||env.hit('KeyX')) G.ph==='card'&&act('res',false); }
    if(client&&G.ph==='spin') G.el=Math.min(G.dur,G.el+dt);
    if(G.ph==='spin'){ const s=segAt(ang()); if(s!==lastSeg){ lastSeg=s; tone(900+Math.random()*80,.03,'square',.04); } }
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; if(f.l<=0){ fx.splice(i,1); continue; } f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=400*dt; f.r+=dt*8; }
    if(host){ stepHost(dt); if(G.ph==='end'&&!ended){ ended=true; if(net) net.send({st:G}); finish(); return; }
      if(net){ sendT-=dt; if(sendT<=0){ sendT=1/12; net.send({st:G}); if(evq.length){ net.send({ev:evq}); evq=[]; } } } } }
  function button(r,label,col,on,sub){ const [x,y,w,h]=r,hv=hover&&on; c.fillStyle='rgba(0,0,0,.3)'; rr(c,x,y+5,w,h,14); c.fill(); c.fillStyle=col; rr(c,x,y-(hv?2:0),w,h,14); c.fill(); c.fillStyle='rgba(255,255,255,.22)'; rr(c,x+4,y+4-(hv?2:0),w-8,h*.38,10); c.fill();
    c.fillStyle='#fff'; c.textAlign='center'; c.textBaseline='middle'; c.font='900 '+(h>80?24:19)+'px '+TC; c.lineWidth=4; c.strokeStyle='rgba(0,0,0,.25)'; c.strokeText(label,x+w/2,y+h/2-(sub?10:0)-(hv?2:0)); c.fillText(label,x+w/2,y+h/2-(sub?10:0)-(hv?2:0)); if(sub){ c.font='700 12px '+TC; c.fillText(sub,x+w/2,y+h/2+20-(hv?2:0)); } }
  function draw(){ bgArt(c,t,TCOL[si]); const a=ang(),hi=G.ph==='spin'?segAt(a):G.who; wheelArt(c,CX,CY,RAD,a,names,cols,t,G.ph==='spin'?-1:hi);
    /* 右邊面板 */ c.fillStyle='rgba(11,10,28,.55)'; rr(c,496,56,296,436,18); c.fill(); c.fillStyle=TCOL[si]; rr(c,496,56,296,8,4); c.fill();
    c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#ffd8f0'; c.font='700 13px '+TC; c.fillText('題庫：'+THEMES[si]+'　第 '+G.round+(ROUNDS<99?' / '+ROUNDS:'')+' 輪',644,80);
    const C=window.ARCADE_CHAR,who=G.who,mineTurn=local||who===me;
    if(G.ph==='spin0'||G.ph==='next'||G.ph==='spin'){ const by=G.ph==='spin'?-1:G.spinBy;
      c.fillStyle='#fff'; c.font='900 24px '+TC; c.fillText(G.ph==='spin'?'轉轉轉～':'轉到誰呢？',644,130);
      if(C){ for(let i=0;i<Math.min(n,5);i++){ const k=(Math.floor(t*1.5)+i)%n; C.drawChar(c,548+i*48,236,colOf(k),1,G.ph==='spin',t*2+i,1.5,looks[k].char||'cap',looks[k].deco||''); } }
      if(G.ph!=='spin'){ if(canSpin()) button(BTN.spin,'轉轉盤！','#ff5a9a',hover==='spin',env.touch?'點這裡或點轉盤':'空白鍵或點轉盤'); else { c.fillStyle='#fff'; c.font='700 16px '+TC; c.fillText('等 '+names[G.ph==='spin0'&&G.round===1?0:by]+' 轉轉盤…',644,362); }
        if(G.ph==='next'){ c.fillStyle='#ffd23f'; c.font='700 13px '+TC; c.fillText(local?'換 '+names[G.spinBy]+' 來轉':'由 '+names[G.spinBy]+' 轉下一輪',644,312); } } }
    if(G.ph==='choose'&&who>=0){ c.fillStyle='#fff'; c.font='900 22px '+TC; c.fillText('轉到 '+names[who]+'！',644,104); if(C) C.drawChar(c,644,196,colOf(who),1,false,t,2,looks[who].char||'cap',looks[who].deco||'');
      if(mineTurn){ button(BTN.truth,'真心話','#4f9dff',hover==='pick:truth','說實話'); button(BTN.dare,'大冒險','#ff5d4f',hover==='pick:dare','做挑戰'); button(BTN.rand,'🎲 讓命運決定','#8a5ad8',hover==='pick:rand'); }
      else { c.fillStyle='#fff'; c.font='700 16px '+TC; c.fillText(names[who]+' 正在選…',644,320); } }
    if((G.ph==='card'||G.ph==='pun')&&who>=0){ const truth=G.kind==='truth',f=G.flip,sx=Math.abs(Math.cos((1-f)*Math.PI)),showFront=f>.5;
      c.save(); c.translate(644,212); c.scale(Math.max(.04,sx),1); c.fillStyle='rgba(0,0,0,.3)'; rr(c,-128,-112,256,224,18); c.fill();
      if(!showFront){ c.fillStyle='#2a1a4a'; rr(c,-130,-118,260,224,18); c.fill(); c.strokeStyle='#ffd23f'; c.lineWidth=4; c.stroke(); c.fillStyle='#ffd23f'; c.font='900 54px '+TC; c.fillText('?',0,-6); }
      else { c.fillStyle='#fffaf0'; rr(c,-130,-118,260,224,18); c.fill(); c.fillStyle=truth?'#4f9dff':'#ff5d4f'; rr(c,-130,-118,260,46,18); c.fill(); c.fillRect(-130,-90,260,18); c.fillStyle='#fff'; c.font='900 21px '+TC; c.fillText(truth?'💬 真心話':'🔥 大冒險',0,-94);
        c.fillStyle='#2a0e40'; c.font='900 19px '+TC; const L=wrap(c,G.q,224); L.forEach((s,k)=>c.fillText(s,0,-14+(k-(L.length-1)/2)*28)); c.fillStyle='#a090b0'; c.font='700 12px '+TC; c.fillText(names[who]+' 抽到的題目',0,90); }
      c.restore();
      if(G.ph==='card'){ if(mineTurn){ button(BTN.ok,'✔ 完成','#2aa85a',hover==='res:true'); button(BTN.no,'✘ 跳過','#8a8aa8',hover==='res:false',''); } else { c.fillStyle='#fff'; c.font='700 15px '+TC; c.fillText('等 '+names[who]+' 完成挑戰…',644,428); } }
      else { c.fillStyle='rgba(11,10,28,.85)'; rr(c,510,340,270,60,12); c.fill(); c.fillStyle='#ffb0b8'; c.font='900 14px '+TC; c.fillText('跳過要接受小懲罰：',644,358); c.fillStyle='#ffd23f'; c.font='900 19px '+TC; c.fillText(G.pun,644,382); if(mineTurn) button(BTN.go,'做完了，下一輪','#ff5a9a',hover==='go'); } }
    if(local&&G.ph==='next'&&ROUNDS>=99){ c.fillStyle='rgba(255,255,255,.18)'; rr(c,...BTN.end,10); c.fill(); c.fillStyle='#fff'; c.font='700 13px '+TC; c.fillText('結束',BTN.end[0]+40,BTN.end[1]+14); }
    for(const f of fx){ c.save(); c.globalAlpha=Math.min(1,f.l*2); c.translate(f.x,f.y); c.rotate(f.r); c.fillStyle=f.c; c.fillRect(-5,-3,10,6); c.restore(); }
    if(canName()){ c.fillStyle=hover==='name'?'rgba(255,255,255,.32)':'rgba(255,255,255,.18)'; rr(c,...BTN.name,10); c.fill(); c.fillStyle='#fff'; c.font='700 13px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('✏️ 改名字',BTN.name[0]+52,BTN.name[1]+15); }
    /* 左上：每個人完成幾題 */ c.textAlign='left'; c.font='700 12px '+TC; c.fillStyle='rgba(255,255,255,.75)'; c.fillText(local?(env.touch?'大家輪流用同一台手機':'大家輪流用同一台電腦'):'',12,40); }
  return {update,draw,destroy(){ const o=env.stage&&env.stage.querySelector('.pnEdit'); if(o) o.remove(); canvas.removeEventListener('pointerdown',pd); canvas.removeEventListener('pointermove',pm); },_dbg:{get G(){return G;},doSpin,choose,resolve,nextRound,Q}};
}
function stageShow(ctx,w,h,si,t){ ctx.save(); ctx.scale(w/W,h/H); bgArt(ctx,t,TCOL[si]); const nm=['小胖','阿美','大雄','小綠','阿花','鐵蛋'],cols=PCOL.slice(0,6); wheelArt(ctx,300,260,190,t*1.4,nm,cols,t,-1);
  const q=si<BANK.length?Q[si][Math.floor(t/3)%2?'dare':'truth'][Math.floor(t/6)%12]:Q[Math.floor(t/3)%5].truth[0],truth=!(Math.floor(t/3)%2);
  ctx.save(); ctx.translate(640,250); ctx.rotate(.06); ctx.fillStyle='#fffaf0'; rr(ctx,-130,-120,260,230,18); ctx.fill(); ctx.fillStyle=truth?'#4f9dff':'#ff5d4f'; rr(ctx,-130,-120,260,46,18); ctx.fill(); ctx.fillRect(-130,-92,260,18); ctx.fillStyle='#fff'; ctx.font='900 21px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(truth?'💬 真心話':'🔥 大冒險',0,-96);
  ctx.fillStyle='#2a0e40'; ctx.font='900 19px '+TC; const L=wrap(ctx,q,224); L.forEach((s,k)=>ctx.fillText(s,0,-10+(k-(L.length-1)/2)*28)); ctx.restore();
  ctx.textAlign='center'; ctx.font='900 24px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#2a0e40'; ctx.strokeText(THEMES[si],640,440); ctx.fillStyle='#ffd23f'; ctx.fillText(THEMES[si],640,440); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).truth={
  name:'真心話轉轉樂',tag:'TRUTH OR DARE',color:'#c56bff',online:true,maxPlayers:12,minPlayers:2,bots:false,
  desc:'轉盤轉到誰，誰就要選「真心話」或「大冒險」，抽一張題目卡照做！不敢做就跳過，但要接受小懲罰。10 種題庫共 1000 題（每種真心話、大冒險各 50 題），大家用一台輪流玩，或連線各用各的手機。',
  goal:'轉轉盤選人，被轉到的人選真心話或大冒險，照卡片做完按「完成」。',
  stages:THEMES,stageLabel:'選擇題庫',stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,0,t),
  stageGoal:i=>i<BANK.length?'「'+THEMES[i]+'」50 題真心話＋50 題大冒險。':'從全部 1000 題裡隨機抽。',
  modes:[{id:'1p',label:'大家用一台'}],
  options:[{key:'seats',label:'幾個人玩',def:'5',opts:[{id:'3',label:'3 人'},{id:'4',label:'4 人'},{id:'5',label:'5 人'},{id:'6',label:'6 人'},{id:'7',label:'7 人'},{id:'8',label:'8 人'},{id:'9',label:'9 人'},{id:'10',label:'10 人'},{id:'11',label:'11 人'},{id:'12',label:'12 人'}]},{key:'rounds',label:'玩幾輪',def:'12',opts:[{id:'8',label:'8 輪'},{id:'12',label:'12 輪'},{id:'20',label:'20 輪'},{id:'99',label:'不限'}]}],
  help:[['空白鍵','轉轉盤'],['1 / 2 / 3','真心話／大冒險／讓命運決定'],['Enter','完成（也可以用滑鼠點按鈕）']],
  touchHelp:[['點轉盤','轉轉盤'],['點按鈕','選真心話或大冒險、完成']],touch:null,
  looks:[{key:'char',label:'人物',opts:[{id:'cap',label:'帽子'},{id:'cat',label:'貓耳'},{id:'bunny',label:'兔耳'},{id:'crown',label:'皇冠'},{id:'chef',label:'廚師'},{id:'pirate',label:'海盜'},{id:'ninja',label:'忍者'},{id:'bow',label:'蝴蝶結'}]},{key:'color',label:'人物顏色',type:'color',opts:['auto','#ff5d4f','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d','#3ddbd9','#ff7eb6']}],
  preview:(ctx,w,h,L,t)=>{ ctx.save(); ctx.scale(w/W,h/H); bgArt(ctx,t,'#c56bff'); ctx.restore(); const C=window.ARCADE_CHAR; if(C) C.drawChar(ctx,w/2,h*.6,!L||!L.color||L.color==='auto'?PCOL[0]:L.color,1,false,t,2.6,(L&&L.char)||'cap',(L&&L.deco)||''); },
  create};
})();
