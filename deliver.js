// 街頭外送王：騎機車在台灣（和國外）街頭穿梭，到店家取餐、送到客人手上，躲開闖紅燈的機車、亂切的汽車、突然衝出來的行人。
// 收入扣掉油錢、罰單、超時扣款、餐點賠償，看這一趟淨賺多少。
// 道路車流用同一個亂數種子＋固定步長模擬，連線時每個人看到的車流一樣；每個人只算自己的機車，再把位置傳給別人（作法同樓梯大逃亡）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const ROADW=360,LANE=[36,108,180,252,324],SIM=1/60,CYC=16,G_END=9,Y_END=11; // 號誌：0～9 綠、9～11 黃、11～16 紅（橫向綠）
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,u)=>a+(b-a)*u;
function mul(seed){ let a=seed>>>0||1; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const hash=(a,b,c)=>{ let h=(a*374761393+b*668265263+(c||0)*2246822519)>>>0; h=Math.imul(h^h>>>13,1274126177)>>>0; return ((h^h>>>16)>>>0)/4294967296; };
function rr(c,x,y,w,h,r){ r=Math.min(r,w/2,h/2); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }

/* ---------- 十個城市 ---------- */
const TW_SHOP=['阿嬤滷肉飯','巷口牛肉麵','夜市雞排','珍奶工坊','早安蛋餅','鹽酥雞','蚵仔煎','臭豆腐','排骨便當','麻辣燙','豆花','肉圓'];
const TW_CUS=['林小姐','陳先生','王同學','張阿姨','李大哥','黃老師','吳太太','蔡先生','許小姐','鄭阿伯'];
const TW_SIGN=['便當','手搖飲','藥局','早餐','五金','診所','眼鏡','當舖','檳榔','電器','麵店','補習班'];
const STAGES=[
  {name:'台北・西門町',stars:1,orders:3,traffic:.55,onc:.5,scoot:.5,bus:.3,peds:.5,cam:.3,jay:.25,runner:.12,park:.35,pal:'tw',land:'redhouse',sky:'#9fd8ff',target:260,
   shop:TW_SHOP,cus:TW_CUS,sign:TW_SIGN,desc:'入門路線：車不多，先熟悉取餐、送餐和紅綠燈。'},
  {name:'台中・逢甲夜市',stars:1,orders:3,traffic:.45,onc:.45,scoot:.7,bus:.15,peds:.9,cam:.2,jay:.4,runner:.15,park:.2,stall:1,night:1,pal:'tw',land:'market',target:270,
   shop:TW_SHOP,cus:TW_CUS,sign:TW_SIGN,desc:'夜市攤販佔了機車道，逛街人潮隨時穿越馬路。'},
  {name:'高雄・愛河晚風',stars:2,orders:4,traffic:.6,onc:.6,scoot:1,bus:.4,peds:.5,cam:.35,jay:.3,runner:.25,park:.35,garbage:1,pal:'tw',land:'tower85',evening:1,target:360,
   shop:TW_SHOP,cus:TW_CUS,sign:TW_SIGN,desc:'下班機車大軍、公車進站，還有放著音樂的垃圾車。'},
  {name:'台南・府城巷弄',stars:2,orders:4,traffic:.5,onc:.55,scoot:.8,bus:.1,peds:.6,cam:.25,jay:.4,runner:.3,park:.6,parade:1,dog:.5,pal:'tw',land:'temple',target:360,
   shop:TW_SHOP,cus:TW_CUS,sign:TW_SIGN,desc:'路邊停滿車、車門隨時打開，還會遇到廟會陣頭和巷口的狗。'},
  {name:'新竹・風城午後',stars:3,orders:4,traffic:.6,onc:.6,scoot:.8,bus:.3,peds:.45,cam:.4,jay:.3,runner:.3,park:.4,wind:1,pal:'tw',land:'windmill',target:380,
   shop:TW_SHOP,cus:TW_CUS,sign:TW_SIGN,desc:'九降風一陣一陣把機車往旁邊吹，要穩住車頭。'},
  {name:'台北・信義尖峰',stars:3,orders:5,traffic:.85,onc:.8,scoot:1,bus:.6,peds:.6,cam:.6,jay:.3,runner:.35,park:.4,taxi:.4,pal:'tw',land:'tower101',target:480,
   shop:TW_SHOP,cus:TW_CUS,sign:TW_SIGN,desc:'上下班尖峰，車多、公車多、照相機也多，闖紅燈很容易吃罰單。'},
  {name:'東京・澀谷十字路口',stars:4,orders:5,traffic:.7,onc:.7,scoot:.3,bus:.4,peds:1,cam:.5,jay:.15,runner:.15,park:.35,taxi:.5,left:1,scramble:1,pal:'jp',land:'tokyotower',target:500,
   shop:['拉麵屋','壽司亭','咖哩飯','炸豬排','烏龍麵','章魚燒','鯛魚燒','丼飯'],cus:['佐藤先生','鈴木小姐','高橋同學','田中太太','山本先生','中村小姐'],sign:['拉麵','居酒屋','藥妝','書店','咖啡','壽司','電玩','服飾'],desc:'日本靠左行駛！紅燈時行人會從四面八方斜著穿越路口。'},
  {name:'首爾・弘大雨夜',stars:4,orders:5,traffic:.7,onc:.7,scoot:.8,bus:.4,peds:.6,cam:.45,jay:.35,runner:.3,park:.45,rain:1,night:1,pal:'kr',land:'namsan',target:520,
   shop:['炸雞店','辣炒年糕','部隊鍋','紫菜飯捲','韓式烤肉','冷麵','炸醬麵','煎餅'],cus:['金先生','朴小姐','李同學','崔太太','鄭先生','姜小姐'],sign:['炸雞','咖啡','練歌房','烤肉','服飾','網咖','化妝品','便利店'],desc:'下雨路滑，煞車變長、轉向會滑，小心路上的水窪。'},
  {name:'紐約・時代廣場',stars:5,orders:6,traffic:.85,onc:.85,scoot:.2,bus:.4,peds:.7,cam:.55,jay:.5,runner:.4,park:.4,taxi:1,steam:1,pal:'us',land:'billboard',target:620,
   shop:['披薩店','熱狗攤','貝果店','漢堡店','牛排館','甜甜圈','墨西哥捲餅','中餐館'],cus:['史密斯先生','強森小姐','布朗同學','米勒太太','戴維斯先生','威爾森小姐'],sign:['PIZZA','DELI','BAR','SHOW','HOTEL','CAFE','DINER','24H'],desc:'黃色計程車亂切亂停，人孔蓋冒出的白煙會擋住視線。'},
  {name:'曼谷・考山路',stars:5,orders:6,traffic:.75,onc:.75,scoot:1,bus:.2,peds:.8,cam:.4,jay:.5,runner:.45,park:.4,tuk:1,dog:.7,stall:.6,night:1,left:1,pal:'th',land:'wat',target:640,
   shop:['打拋豬飯','泰式炒河粉','芒果糯米飯','冬蔭功','泰式奶茶','綠咖哩','烤肉串','椰子冰'],cus:['頌猜先生','娜娜小姐','阿南同學','蘇妲太太','差猜先生','妮妮小姐'],sign:['按摩','烤肉','冰沙','旅店','酒吧','刺青','水果','夜市'],desc:'泰國也是靠左行駛，嘟嘟車左鑽右鑽，路邊攤和流浪狗特別多。'}
];
const PAL={tw:{walk:'#b3a596',bld:['#d6cfc2','#c2b8a8','#b8b0a4','#dcd2c0','#a8a196','#cbbfae','#9f968a','#e2dccf','#b8a48e','#a0644e'],sign:['#d8322c','#1f5fbf','#e8a010','#1f8a4c','#8a3fc0','#e0e0e0']},
  jp:{walk:'#b8b6b2',bld:['#e6e4de','#cfd2d4','#bfc4c8','#d8d2c8','#a9adb2','#efece6'],sign:['#d8322c','#1f3f9f','#e8a010','#222','#c4246a']},
  kr:{walk:'#a8a6ac',bld:['#cfc8bf','#b9b3ad','#a59c94','#d8d2ca','#8f8a86','#c6beb4','#9a5a48'],sign:['#ff3f6f','#20b8b6','#e8c020','#6a4cff','#ff7a2d']},
  us:{walk:'#a8a49e',bld:['#8a4e3a','#9a5a42','#7a4434','#b8a890','#a89a86','#6e6a66'],sign:['#e82d2d','#e8c020','#2d8de8','#e02dbf','#2de07a']},
  th:{walk:'#b8a890',bld:['#e0cfa8','#d4bc90','#c8b8a0','#e8d8b8','#b8a080','#d8c4a4'],sign:['#e8c020','#f06a2d','#d8322c','#2daf5a','#c42def']}};

/* ---------- 人物（Q 版外送員） ---------- */
const CHARS=['boy','girl','cat','bear'];
// 由上往下看：機車、外送箱、安全帽
function drawRiderTop(c,x,y,s,L,lean,t,M,fall){
  c.save(); c.translate(x,y); c.scale(s,s); c.rotate((lean||0)*.22*M+(fall?fall*6:0));
  c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(2,4,13,22,0,0,7); c.fill();
  c.fillStyle='#222'; rr(c,-3,-24,6,10,3); c.fill(); rr(c,-3,14,6,10,3); c.fill(); // 前後輪
  c.fillStyle=L.bike; rr(c,-8,-20,16,36,7); c.fill(); c.strokeStyle='rgba(0,0,0,.45)'; c.lineWidth=1.2; c.stroke();
  c.fillStyle='rgba(255,255,255,.35)'; rr(c,-5,-18,4,12,2); c.fill();
  c.strokeStyle='#333'; c.lineWidth=2.4; c.beginPath(); c.moveTo(-12,-14); c.lineTo(12,-14); c.stroke(); // 把手
  c.fillStyle='#fffbe0'; c.beginPath(); c.arc(0,-22,2.4,0,7); c.fill();
  // 外送箱
  c.fillStyle=L.box; rr(c,-11,4,22,18,3); c.fill(); c.strokeStyle='rgba(0,0,0,.4)'; c.stroke();
  c.fillStyle='#fff'; c.beginPath(); c.arc(0,13,5.5,0,Math.PI); c.fill(); c.fillRect(-6.5,12,13,1.6);
  c.strokeStyle='#fff'; c.lineWidth=1.2; for(const k of [-2.5,0,2.5]){ c.beginPath(); c.moveTo(k,10); c.quadraticCurveTo(k+1.5,8,k,6); c.stroke(); }
  // 身體＋手
  c.fillStyle=L.shirt; c.beginPath(); c.ellipse(0,-2,9,7,0,0,7); c.fill(); c.strokeStyle='rgba(0,0,0,.4)'; c.lineWidth=1; c.stroke();
  c.strokeStyle=L.shirt; c.lineWidth=3.4; c.lineCap='round'; c.beginPath(); c.moveTo(-7,-4); c.lineTo(-11,-13); c.moveTo(7,-4); c.lineTo(11,-13); c.stroke();
  // 安全帽＋角色特色
  if(L.char==='cat'){ c.fillStyle=L.helmet; for(const sx of [-1,1]){ c.beginPath(); c.moveTo(sx*7,-9); c.lineTo(sx*9,-17); c.lineTo(sx*2,-12); c.fill(); } }
  if(L.char==='bear'){ c.fillStyle=L.helmet; for(const sx of [-1,1]){ c.beginPath(); c.arc(sx*7,-12,3.6,0,7); c.fill(); } }
  if(L.char==='girl'){ c.fillStyle='#4a2a1a'; c.beginPath(); c.ellipse(0,3,3.5,6,0,0,7); c.fill(); }
  c.fillStyle=L.helmet; c.beginPath(); c.arc(0,-6,8.5,0,7); c.fill(); c.strokeStyle='rgba(0,0,0,.5)'; c.lineWidth=1.2; c.stroke();
  c.fillStyle='rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-3,-9,3,2,-.5,0,7); c.fill();
  c.fillStyle='rgba(30,40,70,.75)'; c.beginPath(); c.ellipse(0,-12.5,5.5,2.2,0,0,7); c.fill(); // 護目鏡
  c.restore(); }
// 正面 Q 版：大頭、大眼睛兩個亮點、腮紅、ω 嘴（開始畫面、造型、開場用）
function drawRiderFront(c,x,y,s,L,t){
  c.save(); c.translate(x,y); c.scale(s,s); const bob=Math.sin(t*6)*1.2; c.translate(0,bob);
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0,40,30,7,0,0,7); c.fill();
  // 機車正面
  c.fillStyle='#222'; rr(c,-6,26,12,16,5); c.fill();
  c.fillStyle=L.bike; c.beginPath(); c.moveTo(-20,30); c.quadraticCurveTo(-22,4,-12,0); c.lineTo(12,0); c.quadraticCurveTo(22,4,20,30); c.closePath(); c.fill(); c.strokeStyle='#1a1530'; c.lineWidth=2; c.stroke();
  c.fillStyle='#fffbe0'; c.beginPath(); c.ellipse(0,16,7,5,0,0,7); c.fill(); c.strokeStyle='#1a1530'; c.lineWidth=1.5; c.stroke();
  c.strokeStyle='#333'; c.lineWidth=3; c.beginPath(); c.moveTo(-26,0); c.lineTo(26,0); c.stroke();
  // 外送箱（頭後面）
  c.fillStyle=L.box; rr(c,-24,-56,48,34,5); c.fill(); c.strokeStyle='#1a1530'; c.lineWidth=2; c.stroke();
  c.fillStyle='#fff'; c.beginPath(); c.arc(0,-40,8,0,Math.PI); c.fill(); c.fillRect(-9,-41,18,2);
  // 身體＋手
  c.fillStyle=L.shirt; rr(c,-13,-14,26,18,8); c.fill(); c.strokeStyle='#1a1530'; c.lineWidth=2; c.stroke();
  c.fillStyle='#ffd9b8'; for(const sx of [-1,1]){ c.beginPath(); c.arc(sx*22,0,4.5,0,7); c.fill(); c.stroke(); }
  // 頭
  const blink=(t%3.2)<.12;
  c.fillStyle='#ffe3c8'; c.beginPath(); c.arc(0,-30,19,0,7); c.fill(); c.strokeStyle='#1a1530'; c.lineWidth=2; c.stroke();
  if(L.char==='girl'){ c.fillStyle='#4a2a1a'; for(const sx of [-1,1]){ c.beginPath(); c.ellipse(sx*20,-24,5,9,sx*.3,0,7); c.fill(); } }
  // 安全帽
  c.fillStyle=L.helmet; c.beginPath(); c.arc(0,-34,21,Math.PI*1.02,Math.PI*1.98); c.lineTo(20,-30); c.quadraticCurveTo(0,-40,-20,-30); c.closePath(); c.fill(); c.strokeStyle='#1a1530'; c.lineWidth=2; c.stroke();
  if(L.char==='cat'){ c.fillStyle=L.helmet; for(const sx of [-1,1]){ c.beginPath(); c.moveTo(sx*8,-52); c.lineTo(sx*17,-64); c.lineTo(sx*19,-46); c.closePath(); c.fill(); c.stroke(); } }
  if(L.char==='bear'){ c.fillStyle=L.helmet; for(const sx of [-1,1]){ c.beginPath(); c.arc(sx*15,-52,6.5,0,7); c.fill(); c.stroke(); } }
  c.fillStyle='rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-8,-46,5,3,-.4,0,7); c.fill();
  // 臉
  c.fillStyle='#1a1530'; for(const sx of [-1,1]){ if(blink){ c.fillRect(sx*7-3.5,-28,7,2); continue; } c.beginPath(); c.ellipse(sx*7,-27,3.6,4.6,0,0,7); c.fill();
    c.fillStyle='#fff'; c.beginPath(); c.arc(sx*7-1.2,-28.6,1.5,0,7); c.fill(); c.beginPath(); c.arc(sx*7+1.2,-25.6,.8,0,7); c.fill(); c.fillStyle='#1a1530'; }
  c.fillStyle='rgba(255,120,140,.55)'; for(const sx of [-1,1]){ c.beginPath(); c.ellipse(sx*12,-21,4,2.5,0,0,7); c.fill(); }
  c.strokeStyle='#1a1530'; c.lineWidth=1.6; c.beginPath(); c.arc(-2,-20,2,0,Math.PI); c.arc(2,-20,2,0,Math.PI); c.stroke();
  c.restore(); }

/* ---------- 車輛、行人 ---------- */
const CAR_COL=['#e8e8ec','#2b2b36','#c8323c','#2f6fd0','#9aa0a8','#f0f0e8','#5a6a4a','#3a4a7a'];
function drawVeh(c,e,X,Y,s,M,t){ // X,Y＝螢幕中心；方向 dir（+1 往上、-1 往下）
  const w=e.w*s,h=e.h*s; c.save(); c.translate(X,Y); if(e.dir<0) c.rotate(Math.PI); if(e.horiz) c.rotate(e.horiz>0?Math.PI/2:-Math.PI/2);
  c.fillStyle='rgba(0,0,0,.3)'; rr(c,-w/2+2*s,-h/2+3*s,w,h,4*s); c.fill();
  const k=e.k;
  if(k==='scoot'||k==='runner'){ c.fillStyle='#222'; rr(c,-2*s,-h/2,4*s,h,2*s); c.fill(); c.fillStyle=e.col; rr(c,-5*s,-h/2+4*s,10*s,h-8*s,4*s); c.fill();
    c.fillStyle=e.helm||'#ffd23f'; c.beginPath(); c.arc(0,0,5*s,0,7); c.fill(); c.strokeStyle='rgba(0,0,0,.4)'; c.lineWidth=1; c.stroke();
    c.strokeStyle='#333'; c.lineWidth=2*s; c.beginPath(); c.moveTo(-7*s,-h/2+7*s); c.lineTo(7*s,-h/2+7*s); c.stroke(); }
  else if(k==='tuk'){ c.fillStyle='#222'; c.fillRect(-w/2-1*s,h/2-8*s,3*s,7*s); c.fillRect(w/2-2*s,h/2-8*s,3*s,7*s); c.fillRect(-1.5*s,-h/2,3*s,6*s);
    c.fillStyle=e.col; rr(c,-w/2,-h/2+3*s,w,h-4*s,5*s); c.fill(); c.fillStyle='#ffd23f'; rr(c,-w/2+2*s,-h/2+12*s,w-4*s,h-18*s,4*s); c.fill(); c.fillStyle='#e23b3b'; c.fillRect(-w/2+2*s,-h/2+12*s,w-4*s,3*s); }
  else if(k==='bus'||k==='garbage'||k==='truck'){ c.fillStyle=e.col; rr(c,-w/2,-h/2,w,h,4*s); c.fill(); c.strokeStyle='rgba(0,0,0,.4)'; c.lineWidth=1; c.stroke();
    if(k==='bus'){ c.fillStyle='rgba(255,255,255,.75)'; for(let i=0;i<4;i++) c.fillRect(-w/2+5*s,-h/2+16*s+i*24*s,w-10*s,10*s); c.fillStyle='#223'; c.fillRect(-w/2+3*s,-h/2+3*s,w-6*s,8*s); }
    else if(k==='garbage'){ c.fillStyle='#f5d020'; rr(c,-w/2+3*s,-h/2+22*s,w-6*s,h-26*s,3*s); c.fill(); c.fillStyle='#223'; c.fillRect(-w/2+4*s,-h/2+4*s,w-8*s,10*s);
      c.fillStyle='#2a9d5c'; c.font='900 '+Math.round(10*s)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.save(); c.rotate(e.dir<0?Math.PI:0); c.fillText('♪',0,6*s*(e.dir<0?-1:1)); c.restore(); }
    else { c.fillStyle='#ddd'; rr(c,-w/2+2*s,-h/2+20*s,w-4*s,h-22*s,2*s); c.fill(); c.fillStyle='#223'; c.fillRect(-w/2+4*s,-h/2+4*s,w-8*s,10*s); } }
  else { // 汽車、計程車
    c.fillStyle=e.col; rr(c,-w/2,-h/2,w,h,7*s); c.fill(); c.strokeStyle='rgba(0,0,0,.45)'; c.lineWidth=1; c.stroke();
    c.fillStyle='rgba(30,40,60,.85)'; rr(c,-w/2+4*s,-h/2+12*s,w-8*s,10*s,3*s); c.fill(); rr(c,-w/2+5*s,h/2-16*s,w-10*s,7*s,3*s); c.fill();
    c.fillStyle='rgba(255,255,255,.18)'; rr(c,-w/2+4*s,-h/2+23*s,w-8*s,h-42*s,3*s); c.fill();
    c.fillStyle='#fffbe0'; c.fillRect(-w/2+3*s,-h/2+1*s,6*s,3*s); c.fillRect(w/2-9*s,-h/2+1*s,6*s,3*s);
    c.fillStyle=e.brake?'#ff2020':'#a01818'; c.fillRect(-w/2+3*s,h/2-4*s,6*s,3*s); c.fillRect(w/2-9*s,h/2-4*s,6*s,3*s);
    if(k==='taxi'){ c.fillStyle='#fff'; c.fillRect(-6*s,-2*s,12*s,5*s); c.strokeStyle='#222'; c.strokeRect(-6*s,-2*s,12*s,5*s); }
    if(e.door){ c.fillStyle=e.col; c.save(); c.translate((e.door>0?-1:1)*w/2,-14*s); c.rotate(e.door*1.1); c.fillRect(-1.5*s,0,3*s,16*s); c.restore(); } }
  c.restore(); }
function drawPed(c,X,Y,s,col,hair,t,face){ // 由上往下看的小人
  const sw=Math.sin(t*10)*3*s; c.save(); c.translate(X,Y); c.rotate(face||0);
  c.fillStyle='#333'; c.beginPath(); c.ellipse(-3*s,sw,2*s,3*s,0,0,7); c.fill(); c.beginPath(); c.ellipse(3*s,-sw,2*s,3*s,0,0,7); c.fill();
  c.fillStyle=col; c.beginPath(); c.ellipse(0,0,7*s,4.5*s,0,0,7); c.fill(); c.strokeStyle='rgba(0,0,0,.35)'; c.lineWidth=1; c.stroke();
  c.fillStyle=hair; c.beginPath(); c.arc(0,0,4.2*s,0,7); c.fill(); c.restore(); }
function drawDog(c,X,Y,s,t,face){ c.save(); c.translate(X,Y); c.rotate(face||0); c.fillStyle='#b07a3a'; c.beginPath(); c.ellipse(0,0,4*s,8*s,0,0,7); c.fill();
  c.beginPath(); c.arc(0,-8*s,4*s,0,7); c.fill(); c.fillStyle='#6a4520'; c.beginPath(); c.ellipse(-3.5*s,-9*s,1.6*s,3*s,.4,0,7); c.fill(); c.beginPath(); c.ellipse(3.5*s,-9*s,1.6*s,3*s,-.4,0,7); c.fill();
  c.strokeStyle='#b07a3a'; c.lineWidth=2*s; c.beginPath(); c.moveTo(0,8*s); c.lineTo(Math.sin(t*14)*4*s,13*s); c.stroke(); c.restore(); }

/* ---------- 地標（路邊的大建築） ---------- */
function drawLandmark(c,k,X,Y,s,t,night){
  c.save(); c.translate(X,Y); c.scale(s,s);
  const lit=night?'#ffe680':'#cfe6ff';
  if(k==='redhouse'){ c.fillStyle='#b8442e'; c.beginPath(); for(let i=0;i<8;i++){ const a=i/8*Math.PI*2+Math.PI/8; c.lineTo(Math.cos(a)*44,Math.sin(a)*44); } c.fill(); c.fillStyle='#8a2e1e'; c.beginPath(); c.arc(0,0,24,0,7); c.fill(); c.fillStyle='#f0d8a0'; c.font='900 13px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('紅樓',0,1); }
  else if(k==='market'){ for(let i=0;i<6;i++){ c.fillStyle=['#e23b3b','#ffd23f'][i%2]; c.beginPath(); c.ellipse(-50+i*20,-30+Math.sin(t*2+i)*2,7,9,0,0,7); c.fill(); } c.fillStyle='#5a2a1a'; c.fillRect(-60,-14,120,64); c.fillStyle='#ffd23f'; c.font='900 16px '+TC; c.textAlign='center'; c.fillText('夜市',0,22); }
  else if(k==='tower85'){ c.fillStyle='#5a6a8a'; c.fillRect(-36,-10,26,90); c.fillRect(10,-10,26,90); c.fillRect(-36,-50,72,40); c.fillStyle='#7a8aaa'; c.fillRect(-10,-90,20,40); c.fillStyle=lit; for(let i=0;i<8;i++) c.fillRect(-30,-4+i*10,14,4); }
  else if(k==='temple'){ c.fillStyle='#c8442e'; c.fillRect(-46,-20,92,60); c.fillStyle='#2a6a4a'; c.beginPath(); c.moveTo(-60,-20); c.quadraticCurveTo(0,-40,60,-20); c.lineTo(50,-34); c.quadraticCurveTo(0,-52,-50,-34); c.closePath(); c.fill();
    c.fillStyle='#ffd23f'; c.fillRect(-4,-56,8,12); c.fillStyle='#ffd23f'; c.font='900 12px '+TC; c.textAlign='center'; c.fillText('廟',0,14); }
  else if(k==='windmill'){ for(const dx of [-30,30]){ c.fillStyle='#eee'; c.fillRect(dx-2,-30,4,90); c.save(); c.translate(dx,-30); c.rotate(t*2+dx); c.fillStyle='#fff'; for(let i=0;i<3;i++){ c.rotate(Math.PI*2/3); c.fillRect(-2,0,4,32); } c.restore(); } }
  else if(k==='tower101'){ c.fillStyle='#3a6a6a'; for(let i=0;i<8;i++){ c.beginPath(); c.moveTo(-22,80-i*18); c.lineTo(22,80-i*18); c.lineTo(28,62-i*18); c.lineTo(-28,62-i*18); c.closePath(); c.fill(); }
    c.fillStyle='#4a8a8a'; c.fillRect(-6,-90,12,24); c.fillRect(-1,-120,2,30); c.fillStyle=lit; for(let i=0;i<8;i++) c.fillRect(-18,66-i*18,36,3); }
  else if(k==='tokyotower'){ c.strokeStyle='#e8442e'; c.lineWidth=3; c.beginPath(); c.moveTo(-40,80); c.lineTo(-4,-90); c.lineTo(4,-90); c.lineTo(40,80); c.stroke(); for(let i=0;i<8;i++){ const y=70-i*20,w=36-i*4.2; c.beginPath(); c.moveTo(-w,y); c.lineTo(w,y); c.stroke(); }
    c.fillStyle='#fff'; c.fillRect(-14,-6,28,6); c.fillRect(-8,-50,16,5); }
  else if(k==='namsan'){ c.fillStyle='#3a6a3a'; c.beginPath(); c.ellipse(0,70,70,30,0,Math.PI,0); c.fill(); c.fillStyle='#ddd'; c.fillRect(-4,-60,8,110); c.fillStyle='#bbb'; c.beginPath(); c.ellipse(0,-50,14,8,0,0,7); c.fill(); c.fillStyle=night?'#ff5d8f':'#eee'; c.fillRect(-1,-90,2,32); }
  else if(k==='billboard'){ for(let i=0;i<3;i++){ c.fillStyle=['#ff3d3d','#3d9dff','#ffd23f'][(i+Math.floor(t))%3]; c.fillRect(-50,-70+i*44,100,36); c.fillStyle='#fff'; c.font='900 16px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(['SHOW','SALE','NEWS'][i],0,-52+i*44); } }
  else if(k==='wat'){ c.fillStyle='#e8a020'; c.beginPath(); c.moveTo(-50,60); c.lineTo(-30,10); c.lineTo(-10,-20); c.lineTo(0,-80); c.lineTo(10,-20); c.lineTo(30,10); c.lineTo(50,60); c.closePath(); c.fill(); c.fillStyle='#c8442e'; c.fillRect(-36,30,72,30); c.fillStyle='#fff3c0'; c.fillRect(-2,-80,4,20); }
  c.restore(); }

/* ---------- 關卡產生：店家、客人、加油站、路口、停車、障礙（同一個種子產生的都一樣） ---------- */
function buildLevel(si,seed){
  const S=STAGES[si],R=mul(seed*31+si*7+3),pick=a=>a[Math.floor(R()*a.length)];
  const stops=[],orders=[],gas=[],busStops=[],inter=[],parked=[],holes=[],stalls=[],puddles=[],steam=[],landmarks=[],signs=[];
  let d=320;
  const shops=S.shop.slice().sort(()=>R()-.5),cuses=S.cus.slice().sort(()=>R()-.5);
  for(let i=0;i<S.orders;i++){ d+=480+R()*420; const shop={d,kind:'shop',name:shops[i%shops.length]}; d+=800+R()*700; const cus={d,kind:'cus',name:cuses[i%cuses.length]};
    stops.push(shop,cus); orders.push({shop,cus,fee:Math.round(55+(cus.d-shop.d)/30)}); }
  const L=d+700;
  for(let g=1400+R()*600;g<L-300;g+=2200+R()*800){ const st={d:g,kind:'gas',name:'加油站'}; stops.push(st); gas.push(st); }
  const busy=dd=>stops.some(s=>Math.abs(s.d-dd)<130);
  for(let x=520+R()*300;x<L-200;x+=720+R()*460){ if(busy(x)||busy(x+90)) { x+=150; if(busy(x)) continue; } inter.push({d:x,off:R()*CYC,cam:R()<S.cam,idx:inter.length}); }
  const nearI=dd=>inter.some(I=>dd>I.d-150&&dd<I.d+190);
  for(let x=600;x<L;x+=900+R()*900){ if(!busy(x)&&!nearI(x)) busStops.push({d:x}); }
  const free=dd=>!busy(dd)&&!nearI(dd)&&!busStops.some(b=>Math.abs(b.d-dd)<170);
  for(let x=200;x<L;x+=70+R()*160){ if(R()<S.park&&free(x)) parked.push({d:x,col:pick(CAR_COL),door:0,trig:R()<.45,done:false}); }
  for(let x=400;x<L;x+=260+R()*500){ if(nearI(x)) continue; holes.push({x:LANE[2+Math.floor(R()*3)]+(R()-.5)*30,d:x,r:9+R()*4}); }
  if(S.stall) for(let x=300;x<L;x+=170+R()*260){ if(free(x)&&R()<S.stall) stalls.push({d:x,len:40+R()*30,col:pick(['#e23b3b','#2f6fd0','#f5a623','#2a9d5c'])}); }
  if(S.rain) for(let x=300;x<L;x+=180+R()*260) puddles.push({x:LANE[2+Math.floor(R()*3)]+(R()-.5)*30,d:x,r:16+R()*12});
  if(S.steam) for(let x=400;x<L;x+=500+R()*500) steam.push({x:LANE[1+Math.floor(R()*3)],d:x,ph:R()*6});
  for(let x=900;x<L+800;x+=1600+R()*700) landmarks.push({d:x,side:R()<.5?-1:1});
  for(let x=-200;x<L+800;x+=60+R()*40) signs.push({d:x,side:R()<.5?-1:1,h:46+R()*60,w:70+R()*40,col:pick(PAL[S.pal].bld),sc:pick(PAL[S.pal].sign),txt:pick(S.sign),lit:R()});
  // 車流
  const veh=[],cnt=Math.floor(L/120);
  const mk=(o)=>{ o.idx=veh.length; o.v=o.vmax*.8; veh.push(o); };
  for(let i=0;i<cnt;i++){
    if(R()<S.traffic){ const lane=2+Math.floor(R()*2),k=S.taxi&&R()<S.taxi*.5?'taxi':R()<.12?'truck':'car';
      mk({k,lane,x:LANE[lane],d:i*120+R()*60,dir:1,w:k==='truck'?32:28,h:k==='truck'?70:52,col:k==='taxi'?'#f5c518':k==='truck'?'#6a7a8a':pick(CAR_COL),vmax:95+R()*70,lc:3+R()*10}); }
    if(R()<S.onc){ const lane=Math.floor(R()*2); mk({k:R()<.15?'truck':'car',lane,x:LANE[lane],d:i*120+R()*60,dir:-1,w:28,h:52,col:pick(CAR_COL),vmax:130+R()*80,lc:999}); }
    if(R()<S.scoot*.8){ const lane=2+Math.floor(R()*2); mk({k:S.tuk&&R()<.45?'tuk':'scoot',lane,x:LANE[lane]+(R()-.5)*30,d:i*120+R()*90,dir:1,w:S.tuk?22:14,h:S.tuk?36:28,col:pick(['#e23b3b','#2f6fd0','#eee','#2b2b36','#f5a623','#7a4ac8']),helm:pick(['#ffd23f','#fff','#e23b3b','#3ddbd9']),vmax:110+R()*80,lc:2+R()*5,weave:R()*6}); }
    if(R()<S.scoot*.35){ const lane=Math.floor(R()*2); mk({k:'scoot',lane,x:LANE[lane]+(R()-.5)*20,d:i*120+R()*90,dir:-1,w:14,h:28,col:pick(['#e23b3b','#2f6fd0','#eee']),helm:'#fff',vmax:140+R()*60,lc:999}); }
  }
  const nb=Math.round(L/1600*S.bus); for(let i=0;i<nb;i++) mk({k:'bus',lane:3,x:LANE[3],d:R()*L,dir:1,w:34,h:112,col:pick(['#2f8a5a','#2f6fd0','#e8e8ec']),vmax:95,lc:999,bus:1,stopT:0,used:-1});
  if(S.garbage) for(let i=0;i<2;i++) mk({k:'garbage',lane:3,x:LANE[3],d:600+R()*(L-800),dir:1,w:30,h:66,col:'#2a7a4a',vmax:45,lc:999});
  // 慢慢前進的廟會陣頭
  const parade=S.parade?{d0:L*.45,v:28,len:130}:null;
  return {S,L,stops,orders,gas,busStops,inter,parked,holes,stalls,puddles,steam,landmarks,signs,veh,parade};
}
const lightOf=(I,t)=>{ const p=((t+I.off)%CYC+CYC)%CYC; return {p,col:p<G_END?'g':p<Y_END?'y':'r',left:p<G_END?G_END-p:p<Y_END?Y_END-p:CYC-p}; };

/* ---------- 車流模擬（固定步長，每台電腦算出來都一樣） ---------- */
function simStep(lv,t){
  const V=lv.veh,dt=SIM;
  // 依車道分組，找前車
  const lanes=[[],[],[],[],[]]; for(const e of V){ const li=clamp(Math.round((e.x-36)/72),0,4); e.li=li; lanes[li].push(e); }
  for(const ls of lanes) ls.sort((a,b)=>a.d-b.d);
  for(const e of V){
    let tv=e.vmax; const ls=lanes[e.li],i=ls.indexOf(e);
    // 前車
    const lead=e.dir>0?ls[i+1]:ls[i-1];
    if(lead&&lead.dir===e.dir){ const gap=Math.abs(lead.d-e.d)-(lead.h+e.h)/2; if(gap<30+e.v*.55) tv=Math.min(tv,Math.max(0,lead.v*(gap<14?.5:1)-(gap<10?40:0))); }
    // 紅綠燈：停在停止線前
    for(const I of lv.inter){ const sl=e.dir>0?I.d-12-e.h/2:I.d+102+e.h/2,dist=(sl-e.d)*e.dir; if(dist<-5||dist>170) continue;
      const L=lightOf(I,t); if(L.col==='r'||L.col==='y'&&dist>e.v*.5+8){ tv=Math.min(tv,Math.max(0,dist*1.6-4)); } break; }
    // 公車進站
    if(e.bus){ if(e.stopT>0){ e.stopT-=dt; tv=0; if(e.stopT<=0) e.lane=3; }
      else for(const b of lv.busStops){ const dist=b.d-e.d; if(dist>0&&dist<190&&e.used!==b.d){ e.lane=4; if(dist<8){ e.stopT=4; e.used=b.d; } else tv=Math.min(tv,dist*1.2+6); break; } } }
    const acc=tv>e.v?70:220; e.v+=clamp(tv-e.v,-acc*dt,acc*dt); e.brake=tv<e.v-5||e.v<3;
    e.d+=e.v*e.dir*dt;
    // 換車道（照預先排好的時間）
    if(e.lc<999&&t>=e.lc){ e.n=(e.n||0)+1; const h=hash(e.idx,e.n); e.lc=t+3+h*9; if(e.k!=='bus'){ const opts=e.dir>0?[2,3]:[0,1],nl=opts[(opts.indexOf(e.lane)+1)%2];
        if(!V.some(o=>o!==e&&Math.abs(o.x-LANE[nl])<30&&Math.abs(o.d-e.d)<(o.h+e.h)/2+40)) e.lane=nl; } }
    const tx=LANE[e.lane]+(e.weave!=null?Math.sin(t*1.3+e.weave)*16:0); e.x+=clamp(tx-e.x,-55*dt,55*dt);
    // 跑出關卡就從另一頭回來
    if(e.dir>0&&e.d>lv.L+400) e.d-=lv.L+800; if(e.dir<0&&e.d<-400) e.d+=lv.L+800;
  }
}
// 橫向車流（路口紅燈時）＋闖紅燈機車，用時間直接算位置
function crossers(lv,I,t,out){
  const n=Math.floor((t+I.off)/CYC),S=lv.S;
  for(const cn of [n-1,n]){ const c0=cn*CYC-I.off;
    const k=Math.floor(hash(I.idx,cn,1)*3*(.4+S.traffic))+1;
    for(let m=0;m<k;m++){ for(const side of [1,-1]){ const ts=c0+Y_END+.4+m*1.3+hash(I.idx,cn,m*2+(side>0?3:4))*.5,v=170+hash(I.idx,cn,m+9)*60,dt2=t-ts; if(dt2<0) continue;
      const x=side>0?-140+v*dt2:ROADW+140-v*dt2; if(x<-160||x>ROADW+160) continue; const sc=hash(I.idx,cn,m+20)<.45;
      out.push({k:sc?'scoot':'car',x,d:I.d+(side>0?24:66),w:sc?14:28,h:sc?28:52,horiz:side,col:CAR_COL[Math.floor(hash(I.idx,cn,m+30)*8)],helm:'#fff',dir:1}); } }
    if(hash(I.idx,cn,77)<S.runner){ const ts=c0+1.5+hash(I.idx,cn,78)*6,side=hash(I.idx,cn,79)<.5?1:-1,dt2=t-ts,v=250;
      if(dt2>-1.3){ const x=side>0?-140+v*dt2:ROADW+140-v*dt2; if(x>-170&&x<ROADW+170) out.push({k:'runner',x,d:I.d+(side>0?30:60),w:14,h:28,horiz:side,col:'#e23b3b',helm:'#ff5d8f',dir:1,warn:dt2<0,I}); } } }
}
function crossPeds(lv,I,t,out){
  const n=Math.floor((t+I.off)/CYC),S=lv.S;
  for(const cn of [n-1,n]){ const c0=cn*CYC-I.off,k=Math.round(S.peds*4);
    for(let m=0;m<k;m++){ const ts=c0+Y_END+.3+hash(I.idx,cn,m+40)*2.2,side=hash(I.idx,cn,m+50)<.5?1:-1,dt2=t-ts; if(dt2<0) continue;
      if(S.scramble&&m%2){ const a=side>0?Math.atan2(90,ROADW):Math.atan2(90,-ROADW),dist=dt2*42,len=Math.hypot(ROADW+60,90); if(dist>len) continue; const u=dist/len;
        out.push({x:side>0?-30+u*(ROADW+60):ROADW+30-u*(ROADW+60),d:I.d+u*90,col:CAR_COL[m%8],face:side>0?Math.PI/2-a:-Math.PI/2-a,k:'ped'}); continue; }
      const x=side>0?-40+dt2*44:ROADW+40-dt2*44; if(x<-50||x>ROADW+50) continue; out.push({x,d:I.d-24+(m%3)*-7+(hash(I.idx,cn,m+60)<.5?0:138),col:CAR_COL[(m+3)%8],face:side>0?Math.PI/2:-Math.PI/2,k:'ped'}); } }
}

function shade(hex,k){ const n=parseInt(String(hex).slice(1),16); if(isNaN(n)) return hex; const f=v=>clamp(Math.round(v*k),0,255); return 'rgb('+f(n>>16&255)+','+f(n>>8&255)+','+f(n&255)+')'; }
/* ---------- 第一人稱畫面：騎在機車上往前看（參考實景：騎樓、老公寓鐵窗、電線桿、路邊整排機車） ---------- */
const SKY={day:['#4a7fb8','#a9c3d8'],eve:['#55608e','#e6a27e'],night:['#04071a','#1a1838']},HAZE={day:'#d6dde2',eve:'#efc6a2',night:'#262240'};
const VH={car:20,taxi:20,truck:34,bus:46,garbage:34,scoot:26,runner:26,tuk:28};
const SKIN=['#f1cfb0','#e6bf9a','#d9a983','#c48c66'],PANTS=['#2b3550','#3a3a40','#6a5a48','#1e2a40','#cfc6b4','#4a4a4a'];
const SHIRT=['#e8e8e4','#2b2b36','#c8323c','#2f6fd0','#7a8a5a','#e0a030','#8a5aa0','#5a8ab0','#d86a8a','#f0f0f0'];
const BOXC=['#2aa05a','#e8457a','#f08a24','#2f9ad0'],SCOL=['#e8e8e4','#2b2b30','#c8323c','#9aa0a8','#2f5fa0','#f0e8d8','#5a6a4a','#d0a040'];
const hcol=(a,i,s)=>a[Math.floor(hash(Math.abs(Math.floor(i)),s||1)*a.length)];
// 機車騎士（後面＝同方向，前面＝對向）：照真實機車畫尾燈、車牌、排氣管、外送箱；玩家的貓耳／熊耳裝在安全帽上
function riderBack(c,X,Y,w,h,e,front,t){ const id=e.idx!=null?e.idx:Math.floor(Math.abs(e.d||0)),sh=e.shirt||hcol(SHIRT,id,3),pants=e.pants||hcol(PANTS,id,4),hc=e.helm||'#f2f2f2',k=h/26,skin=SKIN[id%4];
  const box=front?null:(e.box||(hash(id,5)<.35?hcol(BOXC,id,6):null));
  c.save(); c.translate(X,Y); c.scale(k,k); c.lineCap='round';
  c.fillStyle='#141414'; rr(c,-1.5,-5.4,3,5.4,1.3); c.fill(); c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(-.3,-5,.6,4.6);
  const bg=c.createLinearGradient(-5.5,0,5.5,0); bg.addColorStop(0,shade(e.col,.6)); bg.addColorStop(.35,shade(e.col,1.15)); bg.addColorStop(1,shade(e.col,.56));
  if(!front){ c.fillStyle=bg; c.beginPath(); c.moveTo(-2.6,-4); c.quadraticCurveTo(-5.4,-6.2,-5,-10.4); c.lineTo(5,-10.4); c.quadraticCurveTo(5.4,-6.2,2.6,-4); c.closePath(); c.fill();
    c.fillStyle=e.brake?'#ff2a2a':'#b81c1c'; c.beginPath(); c.moveTo(-3.6,-9.3); c.quadraticCurveTo(0,-8.3,3.6,-9.3); c.lineTo(3.2,-8.1); c.quadraticCurveTo(0,-7.3,-3.2,-8.1); c.closePath(); c.fill();
    if(e.brake){ c.fillStyle='rgba(255,40,40,.3)'; c.beginPath(); c.ellipse(0,-8.7,4.8,1.9,0,0,7); c.fill(); }
    c.fillStyle='#ffb020'; c.fillRect(-4.9,-9.8,.9,.8); c.fillRect(4,-9.8,.9,.8);
    c.fillStyle='#f4f4ee'; c.fillRect(-1.7,-6.9,3.4,1.8); c.strokeStyle='#333'; c.lineWidth=.2; c.strokeRect(-1.7,-6.9,3.4,1.8);
    c.fillStyle='#3a3a40'; rr(c,2.9,-5.5,2.4,1.4,.6); c.fill(); c.fillStyle='#9a9ea4'; c.beginPath(); c.arc(4.8,-4.8,.55,0,7); c.fill(); }
  // 腳：小腿、鞋子在車身兩邊；坐在座墊上的大腿
  c.fillStyle=pants; for(const sx of [-1,1]){ c.beginPath(); c.moveTo(sx*4.2,-12.4); c.quadraticCurveTo(sx*6.2,-9.5,sx*5.4,-6.4); c.lineTo(sx*3.9,-6.4); c.quadraticCurveTo(sx*4.6,-9.4,sx*3,-11.6); c.closePath(); c.fill(); }
  c.fillStyle='#1e1e22'; rr(c,-5.9,-6.9,2.3,1.4,.6); c.fill(); rr(c,3.6,-6.9,2.3,1.4,.6); c.fill();
  c.fillStyle=shade(pants,.9); c.beginPath(); c.ellipse(0,-11.6,4.6,1.9,0,0,7); c.fill();
  // 上身（外套）
  const tg=c.createLinearGradient(-5.5,0,5.5,0); tg.addColorStop(0,shade(sh,.66)); tg.addColorStop(.4,shade(sh,1.08)); tg.addColorStop(1,shade(sh,.6)); c.fillStyle=tg;
  c.beginPath(); c.moveTo(-3.8,-11.4); c.quadraticCurveTo(-4.6,-16,-5.4,-19.4); c.quadraticCurveTo(-4.8,-21.2,-2.2,-21.4); c.lineTo(2.2,-21.4); c.quadraticCurveTo(4.8,-21.2,5.4,-19.4); c.quadraticCurveTo(4.6,-16,3.8,-11.4); c.closePath(); c.fill();
  c.fillStyle=shade(sh,.82); for(const sx of [-1,1]){ c.beginPath(); c.moveTo(sx*4.6,-20.4); c.quadraticCurveTo(sx*6.9,-18.4,sx*6.5,-15.4); c.lineTo(sx*5,-15.1); c.quadraticCurveTo(sx*5.2,-17.6,sx*3.8,-18.8); c.closePath(); c.fill(); }
  if(front){ c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=.3; c.beginPath(); c.moveTo(0,-21); c.lineTo(0,-12); c.stroke();
    // 車頭：護腳板、頭燈、把手、照後鏡、手套
    const fg=c.createLinearGradient(-4.6,0,4.6,0); fg.addColorStop(0,shade(e.col,.62)); fg.addColorStop(.4,shade(e.col,1.18)); fg.addColorStop(1,shade(e.col,.6)); c.fillStyle=fg;
    c.beginPath(); c.moveTo(-3,-4.6); c.quadraticCurveTo(-4.8,-11,-3.4,-16.4); c.quadraticCurveTo(0,-17.4,3.4,-16.4); c.quadraticCurveTo(4.8,-11,3,-4.6); c.closePath(); c.fill();
    c.fillStyle='#d8dde2'; c.beginPath(); c.ellipse(0,-15,2,1.3,0,0,7); c.fill(); c.fillStyle='#fffbe6'; c.beginPath(); c.ellipse(0,-15,1.5,.9,0,0,7); c.fill();
    if(e.night){ c.fillStyle='rgba(255,250,210,.3)'; c.beginPath(); c.arc(0,-15,4,0,7); c.fill(); }
    c.fillStyle='#ffb020'; c.fillRect(-3.7,-13.6,1,.7); c.fillRect(2.7,-13.6,1,.7);
    c.strokeStyle='#2a2a30'; c.lineWidth=.7; c.beginPath(); c.moveTo(-6.9,-15.6); c.quadraticCurveTo(0,-16.6,6.9,-15.6); c.stroke();
    c.strokeStyle='#555'; c.lineWidth=.3; c.beginPath(); c.moveTo(-4.6,-16); c.lineTo(-5.6,-19.6); c.moveTo(4.6,-16); c.lineTo(5.6,-19.6); c.stroke();
    c.fillStyle='#222'; c.beginPath(); c.ellipse(-5.8,-20,1.1,.75,0,0,7); c.ellipse(5.8,-20,1.1,.75,0,0,7); c.fill();
    c.fillStyle='#2b2b34'; c.beginPath(); c.arc(-6.4,-15.5,.95,0,7); c.arc(6.4,-15.5,.95,0,7); c.fill(); }
  else { c.fillStyle='rgba(235,235,225,.55)'; c.fillRect(-4.7,-16.3,9.4,.8); }
  if(box){ c.fillStyle=box; rr(c,-4.4,-21.8,8.8,9.8,1); c.fill(); c.fillStyle=shade(box,1.22); rr(c,-4.4,-21.8,8.8,1.6,1); c.fill(); c.fillStyle=shade(box,.78); c.fillRect(-4.4,-13.2,8.8,1.2);
    c.fillStyle='rgba(255,255,255,.92)'; c.beginPath(); c.arc(0,-17.2,1.9,0,7); c.fill(); c.fillStyle=box; c.fillRect(-.22,-18.5,.44,2.7); c.fillRect(-.95,-18.5,.36,1.3); c.fillRect(.6,-18.5,.36,1.3); c.fillRect(-.95,-17.3,1.9,.4); }
  // 脖子、臉、安全帽
  c.fillStyle=front?skin:shade(skin,.85); c.fillRect(-1,-22.7,2,1.6);
  if(front){ c.fillStyle=skin; c.beginPath(); c.ellipse(0,-24,2.3,2.7,0,0,7); c.fill(); }
  if(e.char==='girl'&&!front){ c.fillStyle='#3a2216'; c.beginPath(); c.ellipse(0,-21.2,1.1,2.3,0,0,7); c.fill(); }
  const hg=c.createLinearGradient(-3.4,-28.4,3.4,-22); hg.addColorStop(0,shade(hc,1.3)); hg.addColorStop(.5,hc); hg.addColorStop(1,shade(hc,.62)); c.fillStyle=hg;
  if(front){ c.beginPath(); c.arc(0,-24.6,3.4,Math.PI*1.02,Math.PI*1.98); c.quadraticCurveTo(3.7,-23,3,-22.1); c.lineTo(2.3,-23.6); c.quadraticCurveTo(0,-26.2,-2.3,-23.6); c.lineTo(-3,-22.1); c.quadraticCurveTo(-3.7,-23,-3.4,-24.6); c.fill();
    c.fillStyle='rgba(30,40,60,.6)'; rr(c,-2.5,-25.3,5,1.5,.6); c.fill(); c.fillStyle='rgba(255,255,255,.35)'; c.fillRect(-2,-25.1,1.6,.4); }
  else { c.beginPath(); c.ellipse(0,-24.6,3.4,3.5,0,0,7); c.fill(); c.fillStyle=shade(hc,.5); c.beginPath(); c.ellipse(0,-21.9,3,.9,0,0,Math.PI); c.fill(); c.fillStyle='rgba(255,255,255,.45)'; c.fillRect(-.4,-28,.8,4.6); }
  c.fillStyle='rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-1.3,-26.7,1.1,.6,-.5,0,7); c.fill();
  c.restore(); }
// 汽車（後面＝同方向，前面＝對向）
function carBack(c,X,Y,w,h,e,front,t){ const col=e.col,id=e.idx||0;
  c.fillStyle='#121212'; rr(c,X-w*.46,Y-h*.22,w*.17,h*.22,w*.03); c.fill(); rr(c,X+w*.29,Y-h*.22,w*.17,h*.22,w*.03); c.fill();
  const g=c.createLinearGradient(0,Y-h*.64,0,Y-h*.12); g.addColorStop(0,shade(col,1.12)); g.addColorStop(.55,col); g.addColorStop(1,shade(col,.6)); c.fillStyle=g; rr(c,X-w*.5,Y-h*.64,w,h*.52,w*.07); c.fill();
  c.fillStyle=shade(col,.92); c.beginPath(); c.moveTo(X-w*.46,Y-h*.62); c.lineTo(X-w*.34,Y-h); c.lineTo(X+w*.34,Y-h); c.lineTo(X+w*.46,Y-h*.62); c.closePath(); c.fill();
  const gg=c.createLinearGradient(0,Y-h*.97,0,Y-h*.66); gg.addColorStop(0,front?'#9ab0c4':'#222c3a'); gg.addColorStop(1,front?'#3a4a5c':'#5a6c82'); c.fillStyle=gg;
  c.beginPath(); c.moveTo(X-w*.41,Y-h*.66); c.lineTo(X-w*.31,Y-h*.96); c.lineTo(X+w*.31,Y-h*.96); c.lineTo(X+w*.41,Y-h*.66); c.closePath(); c.fill();
  if(front){ c.fillStyle='rgba(20,20,26,.55)'; c.beginPath(); c.ellipse(X+w*.16*(e.left?-1:1),Y-h*.78,w*.07,h*.1,0,0,7); c.fill(); }
  c.fillStyle=shade(col,.8); c.fillRect(X-w*.57,Y-h*.72,w*.09,h*.08); c.fillRect(X+w*.48,Y-h*.72,w*.09,h*.08);
  c.fillStyle=shade(col,.48); rr(c,X-w*.5,Y-h*.27,w,h*.12,w*.04); c.fill();
  if(front){ c.fillStyle='#1c1c20'; rr(c,X-w*.22,Y-h*.47,w*.44,h*.13,w*.03); c.fill(); c.fillStyle='#f4f4e8';
    for(const sx of [-1,1]){ c.beginPath(); c.moveTo(X+sx*w*.47,Y-h*.55); c.lineTo(X+sx*w*.26,Y-h*.52); c.lineTo(X+sx*w*.28,Y-h*.44); c.lineTo(X+sx*w*.47,Y-h*.46); c.closePath(); c.fill(); }
    if(e.night){ c.fillStyle='rgba(255,250,210,.28)'; c.beginPath(); c.arc(X-w*.38,Y-h*.5,w*.24,0,7); c.arc(X+w*.38,Y-h*.5,w*.24,0,7); c.fill(); } }
  else { c.fillStyle=e.brake?'#ff2a2a':'#a81818';
    for(const sx of [-1,1]){ c.beginPath(); c.moveTo(X+sx*w*.49,Y-h*.57); c.lineTo(X+sx*w*.25,Y-h*.57); c.lineTo(X+sx*w*.29,Y-h*.46); c.lineTo(X+sx*w*.49,Y-h*.44); c.closePath(); c.fill(); }
    if(e.brake){ c.fillStyle='rgba(255,40,40,.22)'; c.beginPath(); c.ellipse(X-w*.38,Y-h*.51,w*.2,h*.14,0,0,7); c.ellipse(X+w*.38,Y-h*.51,w*.2,h*.14,0,0,7); c.fill(); }
    c.fillStyle='#f4f4ee'; c.fillRect(X-w*.12,Y-h*.43,w*.24,h*.1);
    if(w>40){ c.fillStyle='#222'; c.font='700 '+Math.round(h*.08)+'px monospace'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String.fromCharCode(65+id%26,65+id*7%26,65+id*3%26)+'-'+(1000+id*137%9000),X,Y-h*.375); } }
  if(e.k==='taxi'){ c.fillStyle='#fff'; rr(c,X-w*.13,Y-h*1.1,w*.26,h*.1,w*.02); c.fill(); c.fillStyle='#222'; c.fillRect(X-w*.13,Y-h*1.03,w*.26,h*.02); } }
// 公車、卡車、垃圾車
function bigBack(c,X,Y,w,h,e,front,t){ const k=e.k,col=k==='garbage'?'#f1c40f':k==='truck'&&!front?'#e6e6e2':e.col,id=e.idx||0;
  c.fillStyle='#121212'; c.fillRect(X-w*.46,Y-h*.12,w*.2,h*.12); c.fillRect(X+w*.26,Y-h*.12,w*.2,h*.12);
  const g=c.createLinearGradient(X-w*.5,0,X+w*.5,0); g.addColorStop(0,shade(col,.8)); g.addColorStop(.4,shade(col,1.05)); g.addColorStop(1,shade(col,.78)); c.fillStyle=g; rr(c,X-w*.5,Y-h,w,h*.9,w*.05); c.fill();
  const glass=(x,y,ww,hh)=>{ const gg=c.createLinearGradient(0,y,0,y+hh); gg.addColorStop(0,'#2a3444'); gg.addColorStop(1,'#5a6c82'); c.fillStyle=gg; c.fillRect(x,y,ww,hh); };
  if(k==='bus'){ if(front) glass(X-w*.44,Y-h*.86,w*.88,h*.44); else glass(X-w*.36,Y-h*.86,w*.72,h*.2);
    c.fillStyle='#111'; c.fillRect(X-w*.38,Y-h*.97,w*.76,h*.09); c.fillStyle='#ffa020'; c.font='900 '+Math.max(6,Math.round(h*.07))+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(200+id%300)+(front?' 捷運站':''),X,Y-h*.925);
    if(!front){ c.fillStyle=shade(col,.7); c.fillRect(X-w*.5,Y-h*.6,w,h*.2); } }
  else if(k==='truck'){ if(front) glass(X-w*.42,Y-h*.82,w*.84,h*.3); else { c.strokeStyle='rgba(0,0,0,.3)'; c.lineWidth=Math.max(1,w*.01); c.beginPath(); c.moveTo(X,Y-h*.96); c.lineTo(X,Y-h*.2); c.stroke(); c.fillStyle='#777'; c.fillRect(X-w*.06,Y-h*.6,w*.03,h*.1); c.fillRect(X+w*.03,Y-h*.6,w*.03,h*.1); } }
  else { c.fillStyle='#2a6a8a'; c.fillRect(X-w*.5,Y-h*.4,w,h*.1); if(!front){ c.fillStyle='#2a2a2e'; rr(c,X-w*.38,Y-h*.82,w*.76,h*.38,w*.05); c.fill(); } else glass(X-w*.42,Y-h*.82,w*.84,h*.3);
    c.fillStyle='#fff'; c.font='900 '+Math.max(6,Math.round(h*.16))+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('♪',X+Math.sin(t*6)*w*.2,Y-h*1.08-Math.abs(Math.sin(t*3))*h*.1); }
  c.fillStyle='#2a2a2e'; c.fillRect(X-w*.5,Y-h*.2,w,h*.08);
  c.fillStyle=front?'#f4f4e8':(e.brake?'#ff2a2a':'#a81818'); c.fillRect(X-w*.47,Y-h*.32,w*.1,h*.09); c.fillRect(X+w*.37,Y-h*.32,w*.1,h*.09);
  if(front&&e.night){ c.fillStyle='rgba(255,250,210,.28)'; c.beginPath(); c.arc(X-w*.42,Y-h*.28,w*.18,0,7); c.arc(X+w*.42,Y-h*.28,w*.18,0,7); c.fill(); } }
function vehBack(c,X,Y,s,e,front,t){ const w=e.w*s,h=(VH[e.k]||20)*s,k=e.k;
  c.fillStyle='rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(X,Y,w*.58,Math.max(1,w*.1),0,0,7); c.fill();
  if(k==='scoot'||k==='runner'){ riderBack(c,X,Y,w,h,e,front,t); return; }
  if(k==='tuk'){ c.fillStyle='#222'; c.fillRect(X-w*.55,Y-h*.2,w*.18,h*.2); c.fillRect(X+w*.37,Y-h*.2,w*.18,h*.2); c.fillStyle=e.col; rr(c,X-w*.55,Y-h*.75,w*1.1,h*.58,w*.12); c.fill();
    c.fillStyle='#2a6a3a'; rr(c,X-w*.6,Y-h*1.05,w*1.2,h*.34,w*.15); c.fill(); c.fillStyle='#ffd23f'; c.fillRect(X-w*.6,Y-h*.75,w*1.2,h*.05); c.fillStyle='rgba(30,40,60,.7)'; c.fillRect(X-w*.4,Y-h*.68,w*.8,h*.25); return; }
  if(k==='bus'||k==='truck'||k==='garbage'){ bigBack(c,X,Y,w,h,e,front,t); return; }
  carBack(c,X,Y,w,h,e,front,t); }
// 橫向經過（側面）
function vehSide(c,X,Y,s,e,dirX){ const L=e.h*s,h=(VH[e.k]||20)*s;
  c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(X,Y,L*.5,L*.06,0,0,7); c.fill();
  if(e.k==='scoot'||e.k==='runner'){ const id=Math.floor(Math.abs(e.x||0)); scooterSide(c,X,Y,L/24,e.col,dirX,{shirt:e.k==='runner'?'#2b2b36':hcol(SHIRT,id,3),pants:hcol(PANTS,id,4),helm:e.helm,skin:SKIN[id%4]},0); return; }
  const col=e.col,g=c.createLinearGradient(0,Y-h*.66,0,Y-h*.2); g.addColorStop(0,shade(col,1.12)); g.addColorStop(1,shade(col,.62)); c.fillStyle=g; rr(c,X-L*.5,Y-h*.66,L,h*.46,h*.12); c.fill();
  c.fillStyle=shade(col,.92); c.beginPath(); c.moveTo(X-dirX*L*.44,Y-h*.64); c.lineTo(X-dirX*L*.3,Y-h); c.lineTo(X+dirX*L*.12,Y-h); c.lineTo(X+dirX*L*.3,Y-h*.64); c.closePath(); c.fill();
  c.fillStyle='#34404e'; c.beginPath(); c.moveTo(X-dirX*L*.38,Y-h*.67); c.lineTo(X-dirX*L*.28,Y-h*.94); c.lineTo(X+dirX*L*.1,Y-h*.94); c.lineTo(X+dirX*L*.24,Y-h*.67); c.closePath(); c.fill();
  c.fillStyle=shade(col,.92); c.fillRect(X-dirX*L*.08-L*.015,Y-h*.96,L*.03,h*.3);
  c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=1; c.beginPath(); c.moveTo(X-dirX*L*.08,Y-h*.64); c.lineTo(X-dirX*L*.08,Y-h*.24); c.stroke();
  for(const sx of [-1,1]){ c.fillStyle='#121212'; c.beginPath(); c.arc(X+sx*L*.32,Y-h*.2,h*.2,0,7); c.fill(); c.fillStyle='#9a9aa0'; c.beginPath(); c.arc(X+sx*L*.32,Y-h*.2,h*.1,0,7); c.fill(); }
  c.fillStyle='#fffbe0'; c.fillRect(dirX>0?X+L*.47:X-L*.5,Y-h*.56,L*.03,h*.1); c.fillStyle='#c41e1e'; c.fillRect(dirX>0?X-L*.5:X+L*.47,Y-h*.56,L*.03,h*.1);
  if(e.k==='taxi'){ c.fillStyle='#fff'; c.fillRect(X-L*.06,Y-h*1.08,L*.12,h*.08); } }
// 行人：真實比例、走路擺手；有的背對、有的正面，髮型、裙子、包包都不一樣
function pedFront(c,X,Y,s,col,hair,t,ph){ const id=Math.floor(Math.abs(ph||0)*7),sw=Math.sin(t*7+(ph||0)),sk=SKIN[id%4],back=id%4===2,pants=hcol(PANTS,id,8),style=id%6,skirt=(style===1||style===2)&&id%3===0;
  c.save(); c.translate(X,Y); c.scale(s,s);
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0,0,4,.9,0,0,7); c.fill();
  for(const sx of [-1,1]){ const lift=Math.max(0,sx*sw)*1.3; c.fillStyle=skirt?sk:pants; rr(c,sx*1.05-.95,-12.2,1.9,11.8-lift,.8); c.fill(); c.fillStyle=skirt?'#2a2a30':'#222'; rr(c,sx*1.05-1.1,-1.2-lift,2.2,1.1,.5); c.fill(); }
  const tg=c.createLinearGradient(-3.4,0,3.4,0); tg.addColorStop(0,shade(col,.72)); tg.addColorStop(.45,shade(col,1.05)); tg.addColorStop(1,shade(col,.72)); c.fillStyle=tg;
  c.beginPath(); c.moveTo(-2.6,-12); c.quadraticCurveTo(-3.4,-17,-3.4,-19.2); c.quadraticCurveTo(-3,-20.5,-1.2,-20.7); c.lineTo(1.2,-20.7); c.quadraticCurveTo(3,-20.5,3.4,-19.2); c.quadraticCurveTo(3.4,-17,2.6,-12); c.closePath(); c.fill();
  if(skirt){ c.fillStyle=shade(col,.78); c.beginPath(); c.moveTo(-2.6,-12.6); c.lineTo(-3.7,-7.4); c.quadraticCurveTo(0,-6.8,3.7,-7.4); c.lineTo(2.6,-12.6); c.closePath(); c.fill(); }
  else { c.fillStyle=shade(pants,.75); c.fillRect(-2.6,-12.7,5.2,.7); }
  if(!back){ c.fillStyle=sk; c.beginPath(); c.moveTo(-1,-20.7); c.lineTo(0,-19.3); c.lineTo(1,-20.7); c.closePath(); c.fill(); }
  for(const sx of [-1,1]){ c.save(); c.translate(sx*3.1,-19.7); c.rotate(sx*sw*.22); c.fillStyle=shade(col,.86); rr(c,-.8,0,1.6,7.4,.8); c.fill(); c.fillStyle=sk; c.beginPath(); c.arc(0,7.8,.8,0,7); c.fill(); c.restore(); }
  if(id%5===1){ c.fillStyle=hcol(['#6a4a2a','#222','#c8a070','#8a2a3a'],id,9); if(back){ rr(c,-2.5,-19.6,5,5.8,1); c.fill(); } else { c.strokeStyle=c.fillStyle; c.lineWidth=.35; c.beginPath(); c.moveTo(-2,-20.4); c.lineTo(3.2,-13.6); c.stroke(); rr(c,2.6,-14.4,2.6,3,.6); c.fill(); } }
  c.fillStyle=shade(sk,.9); c.fillRect(-.6,-21.8,1.2,1.4);
  if(style===1&&!back){ c.fillStyle=hair; rr(c,-2.25,-24.4,1.1,6.2,.5); c.fill(); rr(c,1.15,-24.4,1.1,6.2,.5); c.fill(); }
  c.fillStyle=sk; c.beginPath(); c.ellipse(0,-23.3,1.75,2.1,0,0,7); c.fill();
  c.fillStyle=hair;
  if(back){ c.beginPath(); c.ellipse(0,-23.5,1.92,2.25,0,0,7); c.fill(); if(style===1){ rr(c,-2,-23.8,4,5.2,1.4); c.fill(); } }
  else { c.beginPath(); c.ellipse(0,-24.3,1.95,1.4,0,Math.PI,0); c.fill(); c.fillRect(-1.95,-24.4,.6,1.7); c.fillRect(1.35,-24.4,.6,1.7);
    if(s>1.6){ c.fillStyle='#222'; c.fillRect(-.85,-23.4,.4,.4); c.fillRect(.45,-23.4,.4,.4); c.fillStyle=shade(sk,.8); c.fillRect(-.4,-22.3,.8,.2); } c.fillStyle=hair; }
  if(style===2){ c.beginPath(); c.ellipse(back?0:1.9,back?-21.6:-22.6,.8,1.7,back?0:.35,0,7); c.fill(); }
  if(style===3){ c.beginPath(); c.arc(0,-25.7,.95,0,7); c.fill(); }
  if(style===4){ const cp=hcol(['#e23b3b','#2f6fd0','#222','#f0f0f0'],id,12); c.fillStyle=cp; c.beginPath(); c.ellipse(0,-24.5,2.05,1.45,0,Math.PI,0); c.fill(); if(!back) c.fillRect(-2.3,-24.6,4.6,.5); }
  c.restore(); }
// 機車側面（停在路邊、橫向經過、造型預覽共用）：k＝縮放，dir＝1 車頭朝右；rider＝騎士（沒有就是停著的車）
function scooterSide(c,X,Y,k,col,dir,rider,t){
  c.save(); c.translate(X,Y); c.scale(k*dir,k); c.lineCap='round'; c.lineJoin='round';
  c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(.4,0,12.6,1.3,0,0,7); c.fill();
  const wheel=x=>{ c.fillStyle='#161616'; c.beginPath(); c.arc(x,-2.7,2.7,0,7); c.fill(); c.fillStyle='#8c9096'; c.beginPath(); c.arc(x,-2.7,1.5,0,7); c.fill(); c.fillStyle='#4a4d52'; c.beginPath(); c.arc(x,-2.7,.6,0,7); c.fill(); };
  wheel(-7.6); wheel(8.2);
  c.fillStyle='#3a3a40'; rr(c,-10.6,-4.7,7,1.6,.8); c.fill(); c.fillStyle='#a4a8ae'; rr(c,-11,-4.6,2.2,1.3,.6); c.fill();
  const g=c.createLinearGradient(0,-16,0,-4); g.addColorStop(0,shade(col,1.2)); g.addColorStop(.6,col); g.addColorStop(1,shade(col,.68)); c.fillStyle=g;
  if(rider&&rider.box){ const B=rider.box; c.fillStyle='#333'; c.fillRect(-12,-11.2,5,.7); c.fillStyle=B; rr(c,-12.8,-20.6,6.8,9,1); c.fill(); c.fillStyle=shade(B,1.22); rr(c,-12.8,-20.6,6.8,1.5,1); c.fill(); c.fillStyle=shade(B,.8); c.fillRect(-12.8,-12.8,6.8,1.1);
    c.fillStyle='rgba(255,255,255,.9)'; c.beginPath(); c.arc(-9.4,-16.2,1.5,0,7); c.fill(); c.fillStyle=g; }
  c.beginPath(); c.moveTo(-12.2,-7.2); c.quadraticCurveTo(-12.4,-10.4,-9.6,-10.7); c.lineTo(-1.2,-10.3); c.quadraticCurveTo(.3,-8,-.6,-5.2); c.lineTo(-4.4,-5); c.quadraticCurveTo(-7.6,-8.8,-10.8,-5.4); c.closePath(); c.fill();
  c.fillStyle='#2a2a30'; rr(c,-1.4,-5.7,7,1.2,.5); c.fill();
  c.fillStyle=g; c.beginPath(); c.moveTo(4.4,-4.7); c.quadraticCurveTo(5.6,-10,6.2,-14.9); c.lineTo(8.7,-15.5); c.quadraticCurveTo(10.5,-11,10.2,-7.4); c.quadraticCurveTo(11.7,-6.6,11.5,-5.5); c.quadraticCurveTo(8.2,-7.8,5.8,-5.2); c.closePath(); c.fill();
  c.fillStyle='#1e1e22'; c.beginPath(); c.moveTo(-10.7,-10.5); c.quadraticCurveTo(-10.5,-12.3,-7,-12.1); c.lineTo(-2,-11.7); c.quadraticCurveTo(-.7,-11.5,-.9,-10.3); c.closePath(); c.fill();
  c.fillStyle='#d42020'; rr(c,-12.6,-9.3,1.2,1.7,.5); c.fill(); c.fillStyle='#ffb020'; c.fillRect(-12.3,-7.6,.8,.7);
  c.fillStyle='#e8ecf0'; c.beginPath(); c.ellipse(9.4,-13,1.1,1.5,.3,0,7); c.fill(); c.fillStyle='#ffb020'; c.fillRect(9.6,-10.8,.9,.7);
  c.strokeStyle='rgba(255,255,255,.45)'; c.lineWidth=.35; c.beginPath(); c.moveTo(-11.5,-9.7); c.quadraticCurveTo(-9.5,-10.5,-6,-10.4); c.moveTo(6.5,-14.4); c.quadraticCurveTo(5.9,-10,5,-6); c.stroke();
  c.fillStyle=shade(col,.85); rr(c,6.2,-17.3,2.5,2.3,.6); c.fill();
  c.strokeStyle='#2a2a30'; c.lineWidth=.75; c.beginPath(); c.moveTo(7.5,-17.1); c.lineTo(5.5,-17.7); c.stroke();
  c.strokeStyle='#555'; c.lineWidth=.35; c.beginPath(); c.moveTo(7.7,-17.1); c.lineTo(7.3,-20.5); c.stroke(); c.fillStyle='#222'; c.beginPath(); c.ellipse(7.3,-20.9,1.05,.65,0,0,7); c.fill();
  if(rider){ const R=rider,ch=!!R.chibi;
    c.strokeStyle=R.pants; c.lineWidth=2.7; c.beginPath(); c.moveTo(-5.8,-12.3); c.lineTo(.2,-12.5); c.lineTo(1.5,-6.6); c.stroke();
    c.fillStyle='#1e1e22'; rr(c,.4,-6.6,3.2,1.4,.6); c.fill();
    const sg=c.createLinearGradient(-7.5,0,-1.5,0); sg.addColorStop(0,shade(R.shirt,.72)); sg.addColorStop(1,shade(R.shirt,1.1)); c.fillStyle=sg;
    c.beginPath(); c.moveTo(-7.5,-11.6); c.quadraticCurveTo(-8.1,-17,-5.5,-20.5); c.quadraticCurveTo(-3,-21.3,-1.8,-19.7); c.quadraticCurveTo(-1.6,-15,-2.8,-11.4); c.closePath(); c.fill();
    c.strokeStyle=shade(R.shirt,.9); c.lineWidth=1.8; c.beginPath(); c.moveTo(-3.7,-19.1); c.quadraticCurveTo(.6,-16.8,4.2,-17.4); c.stroke(); c.fillStyle='#2b2b34'; c.beginPath(); c.arc(5.2,-17.6,1,0,7); c.fill();
    c.fillStyle=R.skin; c.fillRect(-4.4,-22.2,1.7,1.8);
    const hr=ch?4.6:2.75,hx=ch?-3.1:-3.4,hy=ch?-25.6:-23.4,hc=R.helm||'#f2f2f2';
    c.fillStyle=R.skin; c.beginPath(); c.arc(hx+hr*.12,hy+hr*.12,hr*.92,0,7); c.fill();
    if(ch){ c.fillStyle='#1a1530'; c.beginPath(); c.ellipse(hx+hr*.62,hy+hr*.28,hr*.12,hr*.17,0,0,7); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(hx+hr*.58,hy+hr*.2,hr*.05,0,7); c.fill();
      c.fillStyle='rgba(255,120,140,.5)'; c.beginPath(); c.ellipse(hx+hr*.45,hy+hr*.55,hr*.16,hr*.09,0,0,7); c.fill(); }
    if(R.char==='girl'){ c.fillStyle='#3a2216'; c.beginPath(); c.ellipse(hx-hr*.9,hy+hr*.6,hr*.3,hr*.55,.3,0,7); c.fill(); }
    const hg=c.createLinearGradient(hx-hr,hy-hr,hx+hr,hy+hr*.4); hg.addColorStop(0,shade(hc,1.3)); hg.addColorStop(1,shade(hc,.68)); c.fillStyle=hg;
    c.beginPath(); c.arc(hx,hy,hr,Math.PI*.82,Math.PI*2.05); c.quadraticCurveTo(hx+hr*.3,hy-hr*.05,hx-hr*.2,hy+hr*.2); c.lineTo(hx-hr*.62,hy+hr*.95); c.closePath(); c.fill();
    c.fillStyle='rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(hx-hr*.3,hy-hr*.6,hr*.3,hr*.15,-.4,0,7); c.fill();
    if(!ch){ c.fillStyle='rgba(30,40,60,.6)'; c.fillRect(hx+hr*.3,hy-hr*.15,hr*.75,hr*.32); } }
  c.restore(); }
function scootSide(c,X,Y,s,col,dirX){ scooterSide(c,X,Y,s,col,dirX,null); }
// 流浪狗（側面）
function dogSide(c,X,Y,s,t,dirX){ c.save(); c.translate(X,Y); c.scale(s*dirX,s); const st=Math.sin(t*16)*.9;
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0,0,6,.8,0,0,7); c.fill();
  const g=c.createLinearGradient(0,-10,0,-4); g.addColorStop(0,'#c08a4a'); g.addColorStop(1,'#8a5a2a'); c.fillStyle='#7a4e24';
  rr(c,-4.6+st*.4,-5.4,1.1,5.4,.5); c.fill(); rr(c,2.8-st*.4,-5.4,1.1,5.4,.5); c.fill(); c.fillStyle=g;
  rr(c,-3.6-st*.4,-5.6,1.2,5.6,.5); c.fill(); rr(c,3.8+st*.4,-5.6,1.2,5.6,.5); c.fill();
  c.beginPath(); c.ellipse(0,-6.6,5.2,2.3,0,0,7); c.fill();
  c.beginPath(); c.moveTo(4,-7.6); c.quadraticCurveTo(5.4,-10.4,6.6,-10); c.lineTo(8.6,-9); c.quadraticCurveTo(8.8,-8,7.4,-7.8); c.quadraticCurveTo(6,-6.4,4.4,-5.6); c.closePath(); c.fill();
  c.fillStyle='#5a3618'; c.beginPath(); c.moveTo(5.8,-10.2); c.lineTo(6.4,-12); c.lineTo(7,-10.2); c.closePath(); c.fill(); c.fillStyle='#1a1410'; c.beginPath(); c.arc(8.6,-8.8,.45,0,7); c.fill(); c.beginPath(); c.arc(7,-9.4,.3,0,7); c.fill();
  c.strokeStyle='#8a5a2a'; c.lineWidth=1; c.lineCap='round'; c.beginPath(); c.moveTo(-5,-7.4); c.quadraticCurveTo(-7,-8.6+Math.sin(t*14)*.8,-7.6,-10.4+Math.sin(t*14)*1.2); c.stroke();
  c.restore(); }
// 機車把手、雙手、液晶儀表、手機導航、照後鏡（照後鏡顯示後面的車）：照實際騎車的視角，畫面下方只看到車頭和握把手的手
function phoneNav(c,nav,t,night){ c.save(); c.translate(118,-128); c.rotate(-.12);
  c.fillStyle='#26262c'; rr(c,-7,34,14,26,3); c.fill(); c.fillStyle='#1a1a1e'; rr(c,-30,-4,6,22,2); c.fill(); rr(c,24,-4,6,22,2); c.fill();
  c.fillStyle='#0b0b0d'; rr(c,-27,-46,54,94,9); c.fill(); c.strokeStyle='#3c3c44'; c.lineWidth=1.5; c.stroke();
  c.save(); rr(c,-24,-42,48,86,6); c.clip();
  c.fillStyle=night?'#1c2130':'#eceae4'; c.fillRect(-24,-42,48,86);
  const off=(t*16)%40;
  c.fillStyle=night?'#223a2c':'#cfe5c2'; for(let i=-1;i<3;i++){ c.fillRect(-22,-34+i*40+off,12,16); c.fillRect(8,-22+i*40+off,14,12); }
  c.strokeStyle=night?'#3a4258':'#ffffff'; c.lineWidth=5; c.beginPath(); for(let i=-1;i<4;i++){ const y=-42+i*40+off; c.moveTo(-24,y); c.lineTo(24,y); } c.moveTo(0,-42); c.lineTo(0,44); c.stroke();
  const dist=nav&&nav.dist!=null?nav.dist:180,py=clamp(32-Math.max(0,dist)*.22,-26,30);
  c.strokeStyle='#2f7cf6'; c.lineWidth=4.5; c.lineCap='round'; c.beginPath(); c.moveTo(0,36); c.lineTo(0,py); c.stroke();
  c.fillStyle=nav&&nav.pick?'#f08a24':'#e8402e'; c.beginPath(); c.arc(0,py-7,5,Math.PI*.85,Math.PI*2.15); c.lineTo(0,py); c.closePath(); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(0,py-7,2,0,7); c.fill();
  c.fillStyle='#fff'; c.beginPath(); c.arc(0,34,5.5,0,7); c.fill(); c.fillStyle='#2f7cf6'; c.beginPath(); c.moveTo(0,29.5); c.lineTo(3.6,37); c.lineTo(0,35); c.lineTo(-3.6,37); c.closePath(); c.fill();
  c.fillStyle='rgba(18,22,30,.88)'; c.fillRect(-24,-42,48,15); c.fillStyle='#fff'; c.font='700 9px '+TC; c.textAlign='center'; c.textBaseline='middle';
  c.fillText(nav&&nav.dist!=null?(dist>=0?Math.round(dist)+' m':'迴轉'):'導航',0,-34.5);
  c.restore(); c.fillStyle='rgba(255,255,255,.07)'; c.beginPath(); c.moveTo(-24,-42); c.lineTo(10,-42); c.lineTo(-24,10); c.closePath(); c.fill();
  c.restore(); }
function drawCockpit(c,vx,vw,L,speed,lean,t,mirrorL,mirrorR,fuel,night,nav){ const cx=vx+vw/2,k=vw/800,dk=night?.5:1,bike=L.bike;
  c.save(); c.translate(cx,H+Math.sin(t*38)*Math.min(1,Math.abs(speed)/200)*.8); c.rotate(lean*.05); c.scale(k,k); c.lineCap='round';
  // 把手（在車頭後面）、煞車拉桿、開關座
  c.strokeStyle='#1c1c20'; c.lineWidth=10; c.beginPath(); c.moveTo(-236,-66); c.quadraticCurveTo(0,-92,236,-66); c.stroke();
  c.strokeStyle='rgba(255,255,255,.12)'; c.lineWidth=2; c.beginPath(); c.moveTo(-230,-70); c.quadraticCurveTo(0,-95,230,-70); c.stroke();
  c.strokeStyle='#b4b8c0'; c.lineWidth=3.5; c.beginPath(); c.moveTo(-160,-80); c.quadraticCurveTo(-200,-97,-234,-93); c.moveTo(160,-80); c.quadraticCurveTo(200,-97,234,-93); c.stroke();
  c.fillStyle='#202024'; rr(c,-178,-88,28,20,5); c.fill(); rr(c,150,-88,28,20,5); c.fill(); c.fillStyle='#e23b3b'; c.fillRect(160,-82,8,5);
  // 車頭殼（烤漆：左右暗、中間亮、上面一道反光）
  const cowl=()=>{ c.beginPath(); c.moveTo(-128,10); c.bezierCurveTo(-120,-80,-90,-128,-40,-138); c.quadraticCurveTo(0,-144,40,-138); c.bezierCurveTo(90,-128,120,-80,128,10); c.closePath(); };
  const g=c.createLinearGradient(-130,0,130,0); g.addColorStop(0,shade(bike,.4*dk)); g.addColorStop(.24,shade(bike,.88*dk)); g.addColorStop(.42,shade(bike,1.15*dk)); g.addColorStop(.62,shade(bike,.92*dk)); g.addColorStop(1,shade(bike,.38*dk)); c.fillStyle=g; cowl(); c.fill();
  const vg=c.createLinearGradient(0,-144,0,10); vg.addColorStop(0,'rgba(255,255,255,.14)'); vg.addColorStop(.35,'rgba(255,255,255,0)'); vg.addColorStop(1,'rgba(0,0,0,.4)'); c.fillStyle=vg; cowl(); c.fill();
  c.fillStyle='rgba(255,255,255,'+(night?.07:.3)+')'; c.beginPath(); c.moveTo(-70,-129); c.quadraticCurveTo(-98,-100,-106,-36); c.lineTo(-96,-36); c.quadraticCurveTo(-86,-98,-58,-131); c.closePath(); c.fill();
  c.fillStyle='rgba(255,255,255,'+(night?.04:.16)+')'; c.beginPath(); c.ellipse(46,-118,18,4,.35,0,7); c.fill();
  // 頭燈燈殼、鑰匙孔
  const hl=c.createLinearGradient(0,-143,0,-130); hl.addColorStop(0,night?'#fffbe0':'#f4f8fb'); hl.addColorStop(1,night?'#e8d890':'#9aa8b4'); c.fillStyle=hl; c.beginPath(); c.ellipse(0,-136,28,6.5,0,0,7); c.fill(); c.strokeStyle='rgba(0,0,0,.45)'; c.lineWidth=1.5; c.stroke();
  c.fillStyle='#1c1c20'; rr(c,-20,-46,40,24,7); c.fill(); c.fillStyle='#b8bcc4'; c.beginPath(); c.arc(0,-34,7,0,7); c.fill(); c.fillStyle='#2a2a30'; c.fillRect(-1.5,-39,3,10);
  // 液晶儀表
  c.fillStyle='#0d0f12'; rr(c,-72,-122,144,54,12); c.fill(); c.strokeStyle='#2c2f36'; c.lineWidth=2; c.stroke();
  const lg=c.createLinearGradient(0,-116,0,-74); lg.addColorStop(0,night?'#0f1e2a':'#1c2c33'); lg.addColorStop(1,'#0a1014'); c.fillStyle=lg; rr(c,-62,-116,124,42,6); c.fill();
  const kmh=Math.round(Math.abs(speed)/250*60),lcd=night?'#9fd8ff':'#bdeaff'; c.fillStyle=lcd; c.textBaseline='middle';
  c.font='700 30px "Courier New",monospace'; c.textAlign='right'; c.fillText(String(kmh),12,-95); c.font='700 9px sans-serif'; c.textAlign='left'; c.fillText('km/h',15,-85);
  const fb=Math.ceil(clamp(fuel/100,0,1)*6); for(let i=0;i<6;i++){ c.fillStyle=i<fb?(fuel<20?'#ff6a5a':lcd):'rgba(189,234,255,.12)'; c.fillRect(40,-81-i*5.4,15,4); }
  c.fillStyle='rgba(189,234,255,.7)'; c.font='700 7px sans-serif'; c.fillText('F',57,-107); c.fillText('E',57,-80);
  c.fillStyle='rgba(189,234,255,.45)'; c.font='700 7px "Courier New",monospace'; c.textAlign='left'; c.fillText('ODO '+String(10234+Math.floor(t*speed/9000)).padStart(6,'0'),-56,-80);
  c.fillStyle='rgba(255,255,255,.06)'; c.beginPath(); c.moveTo(-62,-116); c.lineTo(-10,-116); c.lineTo(-40,-74); c.lineTo(-62,-74); c.closePath(); c.fill();
  phoneNav(c,nav,t,night);
  // 照後鏡（鍍鉻鏡框）
  for(const [sx,list] of [[-1,mirrorL],[1,mirrorR]]){ c.strokeStyle='#7c8088'; c.lineWidth=4.5; c.beginPath(); c.moveTo(sx*150,-80); c.lineTo(sx*196,-150); c.stroke();
    c.save(); c.translate(sx*206,-170); c.beginPath(); c.ellipse(0,0,39,31,0,0,7); c.fillStyle='#141418'; c.fill(); c.beginPath(); c.ellipse(0,0,34,26,0,0,7); c.clip();
    const mg=c.createLinearGradient(0,-26,0,26); mg.addColorStop(0,night?'#0b1030':'#9ab8d4'); mg.addColorStop(.45,night?'#2a2050':'#cfd8de'); mg.addColorStop(.46,night?'#2a2a34':'#5c5c62'); mg.addColorStop(1,night?'#22222a':'#48484e'); c.fillStyle=mg; c.fillRect(-40,-30,80,60);
    for(const m of list){ const ss=clamp(40/Math.max(12,m.dz),.12,1.2),mx=clamp(m.dx*ss*.6,-34,34); c.fillStyle=m.col; rr(c,mx-12*ss,4-14*ss,24*ss,14*ss,3*ss); c.fill(); c.fillStyle='rgba(30,40,55,.7)'; c.fillRect(mx-9*ss,4-12*ss,18*ss,5*ss); }
    c.fillStyle='rgba(255,255,255,.12)'; c.beginPath(); c.ellipse(-12,-10,16,6,-.4,0,7); c.fill();
    c.restore(); c.strokeStyle='#c4c8d0'; c.lineWidth=2.5; c.beginPath(); c.ellipse(sx*206,-170,38,30,0,0,7); c.stroke(); }
  // 手臂（外套袖子有皺褶）＋手套握住握把
  for(const sx of [-1,1]){ const ag=c.createLinearGradient(sx*440,30,sx*240,-60); ag.addColorStop(0,shade(L.shirt,.45*dk)); ag.addColorStop(.7,shade(L.shirt,.95*dk)); ag.addColorStop(1,shade(L.shirt,.75*dk)); c.fillStyle=ag;
    c.beginPath(); c.moveTo(sx*470,40); c.quadraticCurveTo(sx*380,-30,sx*270,-80); c.lineTo(sx*222,-46); c.quadraticCurveTo(sx*290,10,sx*320,40); c.closePath(); c.fill();
    c.strokeStyle='rgba(0,0,0,.2)'; c.lineWidth=2.5; c.beginPath(); c.moveTo(sx*300,-50); c.quadraticCurveTo(sx*320,-40,sx*318,-22); c.moveTo(sx*340,-30); c.quadraticCurveTo(sx*360,-18,sx*352,4); c.stroke();
    c.fillStyle=shade(L.shirt,.38*dk); c.beginPath(); c.moveTo(sx*276,-84); c.lineTo(sx*258,-74); c.lineTo(sx*230,-46); c.lineTo(sx*222,-46); c.lineTo(sx*270,-80); c.closePath(); c.fill();
    c.fillStyle='#1c1c20'; rr(c,sx>0?198:-272,-79,74,24,10); c.fill();
    const gg=c.createRadialGradient(sx*228,-76,4,sx*236,-66,32); gg.addColorStop(0,night?'#34343c':'#4a4a54'); gg.addColorStop(1,night?'#121216':'#1c1c22'); c.fillStyle=gg;
    c.beginPath(); c.ellipse(sx*238,-66,31,21,sx*.35,0,7); c.fill();
    c.strokeStyle='rgba(0,0,0,.45)'; c.lineWidth=1.6; c.beginPath(); for(let i=0;i<3;i++){ c.moveTo(sx*(224+i*10),-85); c.quadraticCurveTo(sx*(218+i*10),-70,sx*(222+i*10),-50); } c.stroke();
    c.strokeStyle='rgba(255,255,255,.1)'; c.lineWidth=2; c.beginPath(); c.moveTo(sx*218,-80); c.quadraticCurveTo(sx*240,-88,sx*258,-78); c.stroke(); }
  c.restore(); }
// 整個第一人稱世界
function drawFP(c,vx,vw,st){
  const {lv,S,M,px,pd,simT,t}=st,F=vw*.6,camH=14,cx=vx+vw/2,hz=H*.46,cd=pd-6,night=S.night,pal=PAL[S.pal],arc=S.pal==='tw'||S.pal==='th',dim=night?.42:S.evening?.9:1;
  const X=(x,s)=>cx+(x-px)*s*M,proj=(x,d,h)=>{ const dz=d-cd; if(dz<2.5) return null; const s=F/dz; return [cx+(x-px)*s*M,hz+(camH-(h||0))*s,s,dz]; };
  const E=(x,d)=>{ const dz=d-cd; if(dz<2.5) return null; const s=F/dz; return [cx+(x-px)*s*M,s]; },Yv=(e,v)=>hz+(camH-v)*e[1];
  const fq=(A,B,va,vb)=>{ c.beginPath(); c.moveTo(A[0],Yv(A,va)); c.lineTo(B[0],Yv(B,va)); c.lineTo(B[0],Yv(B,vb)); c.lineTo(A[0],Yv(A,vb)); c.closePath(); };
  c.save(); c.beginPath(); c.rect(vx,0,vw,H); c.clip(); c.translate(cx,H); c.rotate(-(st.lean||0)*.035); c.translate(-cx,-H);
  // 天空、遠方城市、地標
  const sk=night?'night':S.evening?'eve':'day',HZ=HAZE[sk],g=c.createLinearGradient(0,-40,0,hz); g.addColorStop(0,SKY[sk][0]); g.addColorStop(.72,SKY[sk][1]); g.addColorStop(1,HZ); c.fillStyle=g; c.fillRect(vx-40,-40,vw+80,hz+42);
  if(!night){ const sx=vx+vw*(M>0?.22:.78),sy=S.evening?hz*.7:hz*.12,sg=c.createRadialGradient(sx,sy,4,sx,sy,vw*.45); sg.addColorStop(0,S.evening?'rgba(255,214,150,.75)':'rgba(255,252,235,.55)'); sg.addColorStop(1,'rgba(255,240,220,0)'); c.fillStyle=sg; c.fillRect(vx-40,-40,vw+80,hz+42); }
  if(night){ c.fillStyle='#fff'; for(let i=0;i<40;i++){ c.globalAlpha=.4+.5*Math.abs(Math.sin(t+i)); c.fillRect(vx+(i*97)%vw,(i*53)%(hz*.7),1.5,1.5); } c.globalAlpha=1; }
  else for(let i=0;i<5;i++){ const x=vx+((i*260+t*4)%(vw+320))-160,y=hz*.12+i*hz*.13,r=60+i*14;
    for(let j=0;j<4;j++){ const bx=x+j*r*.45,by=y+(j%2)*6,cg=c.createRadialGradient(bx,by,2,bx,by,r*.55); cg.addColorStop(0,S.evening?'rgba(255,224,200,.5)':'rgba(255,255,255,.5)'); cg.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=cg; c.beginPath(); c.ellipse(bx,by,r*.55,r*.2,0,0,7); c.fill(); } }
  c.save(); c.globalAlpha=night?.8:.5; drawLandmark(c,S.land,vx+vw*(M>0?.6:.4),hz-vw*.075,vw/800*1.1,t,night); c.restore();
  const haze=night?'#1c1a34':S.evening?'#b88a80':'#a3b1bf'; for(let i=0;i<30;i++){ const w2=vw/26,x=vx+i*w2-w2*.5-((pd*.02)%w2),h=22+hash(i,7,Math.floor((pd*.02+i*w2)/w2))*64;
    c.fillStyle=shade(haze,.92+hash(i,9)*.14); c.fillRect(x,hz-h,w2+1,h+1); if(night){ c.fillStyle='rgba(255,230,128,.5)'; for(let j=0;j<3;j++) c.fillRect(x+3+j*w2*.3,hz-h+5+((i+j)%3)*9,2,3); } }
  { const hg2=c.createLinearGradient(0,hz-110,0,hz); hg2.addColorStop(0,'rgba(0,0,0,0)'); hg2.addColorStop(1,HZ); c.globalAlpha=night?.5:.7; c.fillStyle=hg2; c.fillRect(vx-40,hz-110,vw+80,110); c.globalAlpha=1; }
  // 兩旁的房子：同一邊連成一整排（騎樓、鐵窗、冷氣、頂樓加蓋、招牌），每一關固定
  if(!lv.bld){ lv.bld=[]; const sd0=Math.floor(lv.L)%997; for(const sd of [-1,1]){ let d=-400,i=0; while(d<lv.L+1600){ const w=56+hash(i,sd+3+sd0,201)*70,id=i*2+(sd>0?1:0)+sd0*1000;
      const nf=S.pal==='us'?3+Math.floor(hash(id,21)*7):2+Math.floor(hash(id,21)*(S.pal==='jp'?6:5)); lv.bld.push({d,w,side:sd,id,nf,hh:(arc?54:46)+nf*34,col:hcol(pal.bld,id,202),sc:hcol(pal.sign,id,203),txt:hcol(S.sign,id,204)}); d+=w+(hash(i,sd+3+sd0,205)<.1?16:0); i++; } }
    lv.hmap=[]; for(const b of lv.bld) if(b.side<0) for(let d=Math.floor(b.d/8);d<(b.d+b.w)/8;d++) lv.hmap[d+200]=b.hh; }
  // 地面：人行道磚、紅線、柏油（有深淺、補丁、輪胎痕）、左邊房子的影子
  const walk=night?'#3e3c48':shade(pal.walk,dim); c.fillStyle=walk; c.fillRect(vx-40,hz,vw+80,H-hz+40);
  const asph=S.rain?'#30323a':night?'#2e2e36':S.pal==='us'?'#55555a':'#5c5c60',tgt=st.target,red=S.pal==='tw';
  const shK=night?0:S.evening?.85:.5,shadeAt=d=>{ if(!shK||lv.inter.some(I=>d>I.d-38&&d<I.d+128)) return 0; return lv.hmap[Math.floor(d/8)+200]||0; };
  for(let y=Math.ceil(hz)+1;y<H+30;y+=2){ const dz=camH*F/(y-hz),d=cd+dz,s=F/dz,sh=shadeAt(d);
    const seg=(x0,x1,col)=>{ let a=X(x0,s),b=X(x1,s); if(a>b){ const q=a; a=b; b=q; } c.fillStyle=col; c.fillRect(a,y,b-a+1,2.6); };
    const A=dz<500?shade(asph,1+(hash(Math.floor(d/6),3)-.5)*.08):asph,inI=lv.inter.find(I=>d>=I.d&&d<=I.d+90);
    if(inI){ c.fillStyle=A; c.fillRect(vx-40,y,vw+80,2.6); continue; }
    if(dz<400&&Math.floor(d/9)%2){ const wk=shade(walk,.92); seg(-80,0,wk); seg(ROADW,ROADW+80,wk); }
    const rc=red?(hash(Math.floor(d/240),5)<.25?'#d8a820':'#c0403a'):'#a8a090'; seg(-3,0,rc); seg(ROADW,ROADW+3,rc);
    seg(0,ROADW,A);
    if(dz<600){ const pk=Math.floor(d/53); if(hash(pk,11)<.16){ const x0=hash(pk,12)*300; seg(x0,x0+18+hash(pk,13)*40,shade(asph,.86)); } }
    const cw=lv.inter.find(I=>d>I.d-34&&d<I.d-14||d>I.d+104&&d<I.d+124);
    if(dz<500) for(const lx of LANE){ seg(lx-21,lx-13,'rgba(0,0,0,.055)'); seg(lx+13,lx+21,'rgba(0,0,0,.055)'); }
    if(cw){ for(let x=4;x<ROADW;x+=24) seg(x,x+13,'rgba(240,240,236,.9)'); if(sh) seg(-80,Math.min(ROADW+40,-44+sh*shK),'rgba(12,22,48,.2)'); continue; }
    if(lv.inter.some(I=>d>I.d-13&&d<I.d-8)) seg(144,ROADW,'#f0f0ec');
    seg(140,142.5,'#e8b020'); seg(145.5,148,'#e8b020'); seg(287,289.5,'rgba(240,240,236,.85)');
    if(Math.floor(d/22)%2===0){ seg(70.5,73.5,'rgba(240,240,236,.75)'); seg(214.5,217.5,'rgba(240,240,236,.75)'); }
    if(tgt&&Math.abs(d-tgt.d)<46) seg(288,ROADW,'rgba(134,220,79,'+(.3+.15*Math.sin(t*6))+')');
    for(const gs of lv.gas) if(Math.abs(d-gs.d)<46) seg(288,ROADW,'rgba(255,210,63,.22)');
    if(sh) seg(-80,Math.min(ROADW+40,-44+sh*shK),'rgba(12,22,48,.2)'); }
  // 路面「慢」字、人孔蓋
  const groundEll=(x,d,rx,col,stroke)=>{ const p=proj(x,d,0); if(!p||p[3]>700) return; c.fillStyle=col; c.beginPath(); c.ellipse(p[0],p[1],rx*p[2],rx*p[2]*camH/Math.max(8,p[3])*1.2+.5,0,0,7); c.fill(); if(stroke){ c.strokeStyle=stroke; c.lineWidth=1; c.stroke(); } };
  if(S.pal==='tw'||S.pal==='th') for(let d=Math.ceil((cd+30)/430)*430;d<cd+520;d+=430){ if(lv.inter.some(I=>d>I.d-70&&d<I.d+150)) continue; const p=proj(LANE[3],d,0); if(!p) continue;
    c.save(); c.translate(p[0],p[1]); c.scale(1,Math.min(1,camH/p[3]*1.6)); c.fillStyle='rgba(240,240,236,.7)'; c.font='900 '+Math.round(42*p[2])+'px '+TC; c.textAlign='center'; c.textBaseline='bottom'; c.fillText(S.pal==='tw'?'慢':'SLOW',0,0); c.restore(); }
  for(let d=Math.ceil(cd/170)*170;d<cd+700;d+=170){ const k=d/170; if(hash(k,31)<.45) groundEll(LANE[1+Math.floor(hash(k,32)*4)]+(hash(k,33)-.5)*30,d,9,'#3c3c42','#76767c'); }
  for(let d=Math.ceil(cd/90)*90;d<cd+600;d+=90){ const k=d/90; if(hash(k,41)<.5) groundEll(LANE[Math.floor(hash(k,42)*5)]+(hash(k,43)-.5)*10,d,6+hash(k,44)*6,'rgba(20,20,24,.18)'); }
  if(night) for(const sd of [-1,1]) for(let d=Math.ceil(cd/150)*150;d<cd+700;d+=150){ if((d/150)%2) continue; const p=proj(sd<0?40:ROADW-40,d+10,0); if(!p) continue; const r=70*p[2],lg2=c.createRadialGradient(p[0],p[1],1,p[0],p[1],r); lg2.addColorStop(0,'rgba(255,214,150,.32)'); lg2.addColorStop(1,'rgba(255,214,150,0)'); c.fillStyle=lg2; c.beginPath(); c.ellipse(p[0],p[1],r,r*camH/p[3]*1.6+1,0,0,7); c.fill(); }
  for(const pd2 of lv.puddles) groundEll(pd2.x,pd2.d,pd2.r,'rgba(140,180,230,.5)');
  for(const h of lv.holes) groundEll(h.x,h.d,h.r,'#1e1e26','#5a5a66');
  const fog=c.createLinearGradient(0,hz,0,hz+30); fog.addColorStop(0,night?'rgba(20,20,50,.8)':'rgba(214,226,236,.75)'); fog.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=fog; c.fillRect(vx-40,hz,vw+80,30);

  const B1=[],B=[]; const add=(dz,fn)=>{ if(dz>14&&dz<1100) B.push([dz,fn]); }; // 已經貼在眼前的東西（被車頭擋住）不畫，免得塞滿畫面
  const qText=(x,da,db,va,vb,txt,col)=>{ const a=proj(x,da,vb),b=proj(x,db,vb); if(!a||!b||Math.abs(b[0]-a[0])<30) return; let p0=a,p1=b,p3=proj(x,da,va); if(b[0]<a[0]){ p0=b; p1=a; p3=proj(x,db,va); } if(!p3) return;
    c.save(); c.transform((p1[0]-p0[0])/100,(p1[1]-p0[1])/100,(p3[0]-p0[0])/30,(p3[1]-p0[1])/30,p0[0],p0[1]); c.fillStyle=col; c.font='900 22px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(txt,50,16,90); c.restore(); };
  function building(b,d1,d2){
    const o=b.side<0?1:-1,xs=b.side<0?-44:ROADW+44,id=b.id,n1=Math.max(d1,cd+3),A=E(xs,n1),Bq=E(xs,d2); if(!A||!Bq) return;
    const nf=b.nf,G=arc?54:46,FH=34,hh=b.hh;
    const lk=(b.side<0)===(M>0)?1:.86,wall=shade(b.col,lk*dim),len=Math.abs(Bq[0]-A[0]),near=d1-cd<700;
    const U=(x,u)=>E(x,Math.max(lerp(d1,d2,u),cd+3));
    // 靠近自己這一端的側牆
    if(d1>=cd+3){ const C=E(xs-o*170,d1),Ar=E(xs-o*28,d1); c.fillStyle=shade(b.col,.68*dim);
      c.fillRect(Math.min(A[0],C[0]),Yv(A,hh),Math.abs(C[0]-A[0]),Yv(A,arc?40:0)-Yv(A,hh)); if(arc) c.fillRect(Math.min(Ar[0],C[0]),Yv(A,40),Math.abs(C[0]-Ar[0]),Yv(A,0)-Yv(A,40)); }
    if(arc){ const xr=xs-o*28,Ar=E(xr,n1),Br=E(xr,d2);
      c.fillStyle=night?'#3a3630':shade('#9a9284',dim); c.beginPath(); c.moveTo(A[0],Yv(A,0)); c.lineTo(Bq[0],Yv(Bq,0)); c.lineTo(Br[0],Yv(Br,0)); c.lineTo(Ar[0],Yv(Ar,0)); c.closePath(); c.fill();
      const open=hash(id,22)<.62; c.fillStyle=open?(night?'#ffdf9e':'#5e5244'):(night?'#3a3a3e':'#a4a6a8'); fq(Ar,Br,0,40); c.fill();
      if(near&&len>30){ if(open){ for(let i=0;i<3;i++){ const P=U(xr+o,.08+i*.31),Q=U(xr+o,.3+i*.31); c.fillStyle=hcol(['#e8c060','#c05040','#4a90c0','#f0f0e0','#70a050','#d0d0d0'],id+i,23); fq(P,Q,3,20); c.fill(); } }
        else { c.strokeStyle='rgba(0,0,0,.16)'; c.lineWidth=1; c.beginPath(); for(let v=4;v<38;v+=4){ c.moveTo(Ar[0],Yv(Ar,v)); c.lineTo(Br[0],Yv(Br,v)); } c.stroke(); } }
      c.fillStyle=night?'#2a2620':shade('#4a443c',dim); c.beginPath(); c.moveTo(A[0],Yv(A,40)); c.lineTo(Bq[0],Yv(Bq,40)); c.lineTo(Br[0],Yv(Br,40)); c.lineTo(Ar[0],Yv(Ar,40)); c.closePath(); c.fill();
      if(night&&near){ c.fillStyle='rgba(255,240,200,.9)'; const P=U(xs-o*14,.5); c.beginPath(); c.ellipse(P[0],Yv(P,39.5),Math.max(1,3*P[1]),Math.max(.6,P[1]*.8),0,0,7); c.fill(); }
      for(const u of (d2-d1>80?[0,.5,1]:[0,1])){ const da=lerp(d1,d2,u)-(u===1?7:u===.5?3.5:0); if(da<cd+3) continue; const P1=E(xs,da),P2=E(xs,da+7),Pc=E(xs-o*7,da);
        c.fillStyle=shade(b.col,.72*dim); c.fillRect(Math.min(P1[0],Pc[0]),Yv(P1,40),Math.abs(Pc[0]-P1[0]),Yv(P1,0)-Yv(P1,40)); c.fillStyle=wall; fq(P1,P2,0,40); c.fill(); }
      c.fillStyle=wall; fq(A,Bq,40,hh); c.fill();
      // 騎樓上的橫式招牌
      const P=U(xs+o*2,0),Q=E(xs+o*2,d2); if(P&&Q){ c.fillStyle=shade(b.sc,night?1.1:.95); fq(P,Q,41,53); c.fill(); if(near) qText(xs+o*2.2,Math.max(d1,cd+3),d2,41,53,b.txt,'#fff'); } }
    else { c.fillStyle=wall; fq(A,Bq,0,hh); c.fill();
      c.fillStyle=night?'#ffe6b0':shade('#3a4654',dim); fq(U(xs,.06),U(xs,.94),3,32); c.fill();
      if(near&&len>30){ c.fillStyle=night?'#c8a060':'#22262c'; fq(U(xs+o*.5,.4),U(xs+o*.5,.58),3,28); c.fill(); }
      const a1=U(xs,0),a2=E(xs,d2),b1=U(xs+o*14,0),b2=E(xs+o*14,d2); if(b1&&b2){ c.fillStyle=shade(b.sc,.9*dim); c.beginPath(); c.moveTo(a1[0],Yv(a1,38)); c.lineTo(a2[0],Yv(a2,38)); c.lineTo(b2[0],Yv(b2,31)); c.lineTo(b1[0],Yv(b1,31)); c.closePath(); c.fill(); }
      c.fillStyle=shade(b.sc,night?1.1:.85); fq(U(xs+o,.1),U(xs+o,.9),39,46); c.fill(); if(near) qText(xs+o*1.2,lerp(d1,d2,.1),lerp(d1,d2,.9),39,46,b.txt,'#fff'); }
    // 樓層：窗戶、鐵窗、冷氣
    const nw=Math.max(1,Math.min(5,Math.round((d2-d1)/32))),dirty=S.pal==='tw'||S.pal==='th'||S.pal==='kr';
    for(let f=0;f<nf;f++){ const v0=G+f*FH; c.fillStyle='rgba(0,0,0,.13)'; fq(A,Bq,v0,v0+2.5); c.fill(); if(!near&&len<12) continue;
      for(let i=0;i<nw;i++){ const da=lerp(d1,d2,(i+.18)/nw),db=lerp(d1,d2,(i+.82)/nw); if(da<cd+3) continue; const P=E(xs,da),Q=E(xs,db),hs=hash(id*7+f,i+30);
        c.fillStyle=night?(hs<.45?'#ffd98a':'#1c1e2a'):shade(hs<.3?'#7f93a8':'#4e5d6e',dim); fq(P,Q,v0+9,v0+27); c.fill();
        if(!near||Math.abs(Q[0]-P[0])<6) continue;
        if(!night){ c.fillStyle='rgba(200,220,235,.22)'; fq(P,E(xs,lerp(da,db,.45)),v0+19,v0+27); c.fill(); } else if(hs<.45&&hs>.2){ c.fillStyle='rgba(200,120,90,.35)'; fq(P,E(xs,lerp(da,db,.35)),v0+9,v0+27); c.fill(); }
        c.strokeStyle=night?'rgba(90,90,100,.6)':'rgba(205,208,212,.75)'; c.lineWidth=Math.max(.5,P[1]*.12); fq(P,Q,v0+9,v0+27); c.stroke();
        if(dirty&&hs>.3){ const P3=E(xs+o*5,da-2),Q3=E(xs+o*5,db+2); if(P3&&Q3){ c.strokeStyle=night?'rgba(110,110,120,.85)':'rgba(222,222,212,.92)'; c.lineWidth=Math.max(.5,P3[1]*.3); fq(P3,Q3,v0+7,v0+29); c.stroke();
          c.beginPath(); for(let k=1;k<5;k++){ const Pb=E(xs+o*5,lerp(da-2,db+2,k/5)); if(Pb) c.moveTo(Pb[0],Yv(Pb,v0+7)); c.lineTo(Pb[0],Yv(Pb,v0+29)); } c.stroke();
          c.fillStyle=night?'rgba(80,80,90,.5)':'rgba(200,200,190,.35)'; c.beginPath(); c.moveTo(P[0],Yv(P,v0+29)); c.lineTo(Q[0],Yv(Q,v0+29)); c.lineTo(Q3[0],Yv(Q3,v0+29)); c.lineTo(P3[0],Yv(P3,v0+29)); c.closePath(); c.fill(); } }
        if(hash(id+f,i+40)<.32&&S.pal!=='us'){ const P4=E(xs+o*5,lerp(da,db,.15)),Q4=E(xs+o*5,lerp(da,db,.62)); if(P4&&Q4){ c.fillStyle=night?'#55555a':shade('#e2e2da',dim); fq(P4,Q4,v0+1,v0+8); c.fill(); c.fillStyle='rgba(0,0,0,.25)'; fq(E(xs+o*5,lerp(da,db,.2)),E(xs+o*5,lerp(da,db,.36)),v0+2,v0+7); c.fill(); } }
        if(S.pal==='us'&&i===Math.floor(nw/2)){ c.strokeStyle='#26262a'; c.lineWidth=Math.max(.6,P[1]*.35); const R1=E(xs+o*9,da-4),R2=E(xs+o*9,db+4); if(R1&&R2){ c.beginPath(); c.moveTo(R1[0],Yv(R1,v0+2)); c.lineTo(R2[0],Yv(R2,v0+2)); c.moveTo(R1[0],Yv(R1,v0+11)); c.lineTo(R2[0],Yv(R2,v0+11)); c.moveTo(R1[0],Yv(R1,v0+2)); c.lineTo(R2[0],Yv(R2,v0-30)); c.stroke(); } } } }
    // 髒污、頂樓（女兒牆、鐵皮加蓋、水塔）
    if(dirty&&near){ c.fillStyle='rgba(40,30,20,.08)'; for(let k=0;k<3;k++){ const u=hash(id,60+k); fq(U(xs,u),U(xs,Math.min(1,u+.05)),G,hh-4); c.fill(); } }
    { const ao=c.createLinearGradient(0,Yv(A,hh),0,Yv(A,0)); ao.addColorStop(0,'rgba(255,255,255,.07)'); ao.addColorStop(.75,'rgba(0,0,0,0)'); ao.addColorStop(1,'rgba(0,0,0,.22)'); c.fillStyle=ao; fq(A,Bq,arc?40:0,hh); c.fill(); }
    if(near&&d1-cd<320&&len>40&&S.pal!=='us'){ c.strokeStyle='rgba(0,0,0,.05)'; c.lineWidth=1; c.beginPath(); for(let v=G+2;v<hh;v+=4.5){ c.moveTo(A[0],Yv(A,v)); c.lineTo(Bq[0],Yv(Bq,v)); } c.stroke(); }
    c.fillStyle=shade(b.col,.78*dim); fq(A,Bq,hh-3,hh); c.fill();
    if(S.pal==='tw'&&hash(id,50)<.55){ const u2=.5+hash(id,51)*.42,P=U(xs-o*12,.06),Q=U(xs-o*12,u2); if(P&&Q){ const sc=hcol(['#5a7f9a','#6f8f7a','#9aa0a0','#4a6a8a'],id,52); c.fillStyle=shade(sc,dim); fq(P,Q,hh,hh+22); c.fill();
      if(near&&Math.abs(Q[0]-P[0])>20){ c.strokeStyle='rgba(0,0,0,.18)'; c.lineWidth=1; c.beginPath(); for(let k=1;k<12;k++){ const R=U(xs-o*12,.06+(u2-.06)*k/12); c.moveTo(R[0],Yv(R,hh)); c.lineTo(R[0],Yv(R,hh+22)); } c.stroke(); } } }
    if((S.pal==='tw'||S.pal==='th')&&hash(id,53)<.45){ const P=U(xs-o*40,.62),Q=U(xs-o*40,.76); if(P&&Q){ c.fillStyle=shade('#c8ccd2',dim); fq(P,Q,hh+(hash(id,50)<.55?22:0),hh+(hash(id,50)<.55?38:16)); c.fill(); } }
    // 直式招牌（伸出來，正對騎士）
    if(S.pal!=='us'&&hash(id,70)<.8){ const ds=lerp(d1,d2,.12+hash(id,71)*.4); if(ds>cd+8){ const v1=G+4,v2=Math.min(hh-2,v1+56+hash(id,72)*44),P1=proj(xs+o*3,ds,v2),P2=proj(xs+o*16,ds,v1);
      if(P1&&P2){ const x0=Math.min(P1[0],P2[0]),wS=Math.abs(P2[0]-P1[0]),hS=P2[1]-P1[1],sc=hcol(pal.sign,id+5,73); c.fillStyle=night?sc:shade(sc,dim); if(night&&wS>4){ c.shadowColor=sc; c.shadowBlur=10; } c.fillRect(x0,P1[1],wS,hS); c.shadowBlur=0;
        if(wS>5){ c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=Math.max(.5,wS*.05); c.strokeRect(x0+wS*.08,P1[1]+wS*.08,wS*.84,hS-wS*.16); }
        if(wS>7){ const tx=hcol(S.sign,id+9,74),ch=[...tx].slice(0,4); c.fillStyle='#fff'; c.font='900 '+Math.round(wS*.62)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; ch.forEach((q,i)=>c.fillText(q,x0+wS/2,P1[1]+hS*(i+.5)/Math.max(3,ch.length))); } } } }
    // 越遠越淡進霧裡
    const fogA=clamp((d1-cd-160)/1200,0,.8); if(fogA>.02){ c.globalAlpha=fogA; c.fillStyle=HZ; fq(A,Bq,0,hh+40); c.fill(); if(d1>=cd+3){ const C=E(xs-o*170,d1); c.fillRect(Math.min(A[0],C[0]),Yv(A,hh+40),Math.abs(C[0]-A[0]),Yv(A,0)-Yv(A,hh+40)); } c.globalAlpha=1; } }
  for(const b of lv.bld){ let d1=b.d,d2=b.d+b.w; for(const I of lv.inter) if(d2>I.d-38&&d1<I.d+128){ if(d1>=I.d-38) d1=I.d+128; else d2=I.d-38; }
    if(d2-d1<16||d2-cd<6||d1-cd>1300) continue; B1.push([Math.max(d1-cd,3),()=>building(b,d1,d2)]); }
  B1.sort((a,b)=>b[0]-a[0]); for(const [,fn] of B1) fn();

  // 電線桿和電線、行道樹、騎樓前停滿的機車、走路的人
  if(S.pal!=='us') for(const sd of [-1,1]){ const x=sd<0?-8:ROADW+8; for(let d=Math.ceil((cd+10)/150)*150;d<cd+900;d+=150){ const k=d/150; if(lv.inter.some(I=>d>I.d-40&&d<I.d+130)) continue;
    add(d-cd,()=>{ const p=proj(x,d,0),q=proj(x,d,96); if(!p||!q) return; c.fillStyle=night?'#3a3a40':shade('#8e8c86',dim); c.fillRect(p[0]-1.5*p[2],q[1],3*p[2],p[1]-q[1]);
      const a1=proj(x-12,d,88),a2=proj(x+12,d,88); c.fillRect(Math.min(a1[0],a2[0]),a1[1]-.8*p[2],Math.abs(a2[0]-a1[0]),1.6*p[2]);
      if(k%2===0){ const l1=proj(x,d,80),l2=proj(x-sd*26,d,84); if(l1&&l2){ c.strokeStyle=night?'#2a2a30':'#6a6c70'; c.lineWidth=Math.max(.8,p[2]*.9); c.beginPath(); c.moveTo(l1[0],l1[1]); c.lineTo(l2[0],l2[1]); c.stroke(); c.fillStyle=night?'#fff4d0':'#b8bcc0'; if(night){ c.shadowColor='#ffd890'; c.shadowBlur=14; } c.fillRect(l2[0]-3*p[2],l2[1],6*p[2],1.6*p[2]); c.shadowBlur=0; } }
      if(hash(k,sd,82)<.4){ const tp=proj(x,d,74); c.fillStyle='#66696c'; rr(c,tp[0]-3.6*p[2],tp[1]-6*p[2],7.2*p[2],13*p[2],1.5*p[2]); c.fill(); }
      c.strokeStyle='rgba(25,25,30,.8)'; c.lineWidth=clamp(p[2]*.16,.6,1.6); c.beginPath();
      for(const wx of [-11,0,11]){ const a=proj(x+wx,d,88),b2=proj(x+wx,d+150,88),m=proj(x+wx,d+75,80); if(a&&b2&&m){ c.moveTo(a[0],a[1]); c.quadraticCurveTo(2*m[0]-(a[0]+b2[0])/2,2*m[1]-(a[1]+b2[1])/2,b2[0],b2[1]); } }
      if(sd<0&&k%2===0){ const a=proj(x,d,88),b2=proj(ROADW+8,d+40,88),m=proj(ROADW/2,d+20,74); if(a&&b2&&m){ c.moveTo(a[0],a[1]); c.quadraticCurveTo(2*m[0]-(a[0]+b2[0])/2,2*m[1]-(a[1]+b2[1])/2,b2[0],b2[1]); } }
      c.stroke(); }); } }
  if(!arc) for(const sd of [-1,1]){ const x=sd<0?-18:ROADW+18; for(let d=Math.ceil(cd/110)*110;d<cd+800;d+=110){ const k=d/110; if(hash(k,sd,85)>.6||lv.inter.some(I=>d>I.d-40&&d<I.d+130)) continue;
    add(d-cd,()=>{ const p=proj(x,d,0),q=proj(x,d,38); if(!p||!q) return; c.fillStyle='#5a4030'; c.fillRect(p[0]-1.4*p[2],q[1],2.8*p[2],p[1]-q[1]);
      for(let i=0;i<5;i++){ const cp=proj(x+(hash(k,i,86)-.5)*22,d,46+hash(k,i,87)*18); c.fillStyle=shade(['#4f7a3a','#5f8a44','#3f6a30'][i%3],night?.4:dim); c.beginPath(); c.arc(cp[0],cp[1],(9+hash(k,i,88)*5)*p[2],0,7); c.fill(); } }); } }
  if(arc) for(const sd of [-1,1]){ const x=sd<0?-22:ROADW+22; for(let d=Math.ceil((cd+12)/12)*12;d<cd+560;d+=12){ const k=d/12; if(hash(k,sd+5,71)>.6) continue;
    if(lv.inter.some(I=>d>I.d-50&&d<I.d+140)||lv.stops.some(s2=>Math.abs(s2.d-d)<45)||lv.busStops.some(b=>Math.abs(b.d-d)<60)) continue;
    add(d-cd,()=>{ const p=proj(x+(hash(k,sd,72)-.5)*6,d,0); if(p) scootSide(c,p[0],p[1],p[2],hcol(SCOL,k*2+(sd>0?1:0),73),sd<0?M:-M); }); } }
  for(const sd of [-1,1]){ const x0=arc?(sd<0?-58:ROADW+58):(sd<0?-30:ROADW+30); for(let k=Math.floor(cd/80);k<(cd+600)/80;k++){ if(hash(k,sd,91)>S.peds*.6+.25) continue;
    const dir=hash(k,sd,92)<.5?1:-1,d=k*80+(((t*13*dir+hash(k,sd,93)*80)%80)+80)%80; if(lv.inter.some(I=>d>I.d-36&&d<I.d+126)) continue;
    add(d-cd,()=>{ const p=proj(x0+(hash(k,sd,94)-.5)*8,d,0); if(p) pedFront(c,p[0],p[1],p[2],hcol(SHIRT,k*3+sd,95),hcol(['#1a1410','#3a2a1a','#6a5a4a','#111'],k,96),t,k+sd*.37); }); } }
  // 店家、客人、加油站：人行道上的燈箱招牌；目前要去的地方上面有導航定位針
  for(const s2 of lv.stops){ const dz=s2.d-cd; if(dz<40) continue; add(dz,()=>{ const p=proj(ROADW+26,s2.d,0); if(!p) return; const isT=s2===tgt,isG=s2.kind==='gas',w2=46*p[2],h2=30*p[2],top=p[1]-h2-30*p[2];
      c.fillStyle='#5a5c62'; c.fillRect(p[0]-1.2*p[2],p[1]-30*p[2],2.4*p[2],30*p[2]); c.fillStyle='#3a3c42'; c.fillRect(p[0]-5*p[2],p[1]-1.2*p[2],10*p[2],1.2*p[2]);
      const bg=isG?'#c8302a':s2.kind==='shop'?'#f4f1ea':'#e8edf2'; c.fillStyle=night?shade(bg,1.05):shade(bg,dim); if(night){ c.shadowColor='rgba(255,240,200,.8)'; c.shadowBlur=12; } c.fillRect(p[0]-w2/2,top,w2,h2); c.shadowBlur=0;
      c.fillStyle=isG?'#f4f1ea':s2.kind==='shop'?'#c8302a':'#2f6fd0'; c.fillRect(p[0]-w2/2,top,w2,h2*.26); c.strokeStyle='#2a2c30'; c.lineWidth=Math.max(.6,p[2]*.5); c.strokeRect(p[0]-w2/2,top,w2,h2);
      if(w2>26){ c.fillStyle=isG?'#fff':'#222'; c.font='900 '+Math.round(w2*.17)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(isG?'加油站':s2.name,p[0],top+h2*.62,w2*.9);
        c.fillStyle=isG?'#c8302a':'#fff'; c.font='700 '+Math.round(w2*.1)+'px '+TC; c.fillText(isG?'':s2.kind==='shop'?'外送取餐':'客人住處',p[0],top+h2*.13); }
      if(isT){ const bob=Math.sin(t*3)*4,py=top-16*p[2]-14+bob,r=Math.max(8,7*p[2]); c.fillStyle=s2.kind==='shop'?'#f08a24':'#e8402e'; c.shadowColor='rgba(0,0,0,.35)'; c.shadowBlur=6;
        c.beginPath(); c.arc(p[0],py-r,r,Math.PI*.82,Math.PI*2.18); c.lineTo(p[0],py+r*.6); c.closePath(); c.fill(); c.shadowBlur=0; c.fillStyle='#fff'; c.beginPath(); c.arc(p[0],py-r,r*.42,0,7); c.fill(); }
      if(s2.kind==='cus'&&isT){ const q=proj(ROADW+12,s2.d,0); if(q) pedFront(c,q[0],q[1],q[2],'#d8a030','#2a1a10',t,3); } }); }
  // 公車站牌
  for(const b2 of lv.busStops) add(b2.d-cd,()=>{ const p=proj(ROADW+10,b2.d,0); if(!p) return; c.fillStyle='#555'; c.fillRect(p[0]-1.5*p[2],p[1]-50*p[2],3*p[2],50*p[2]); c.fillStyle='#2f6fd0'; c.fillRect(p[0]-7*p[2],p[1]-56*p[2],14*p[2],12*p[2]); });
  // 紅綠燈（台灣有倒數秒數）＋照相機
  for(const I of lv.inter){ const dz=I.d-10-cd; add(dz,()=>{ const Lg=lightOf(I,simT),p=proj(ROADW+14,I.d-10,0),arm=proj(200,I.d-10,62); if(!p||!arm) return;
      c.fillStyle='#3a3a44'; c.fillRect(p[0]-1.6*p[2],p[1]-64*p[2],3.2*p[2],64*p[2]); c.fillRect(Math.min(arm[0],p[0]),arm[1]-1.2*p[2],Math.abs(arm[0]-p[0]),2.4*p[2]);
      const bx=arm[0],by=arm[1]; c.fillStyle='#222'; rr(c,bx-15*p[2],by,30*p[2],10*p[2],2*p[2]); c.fill();
      [['r','#ff3030'],['y','#ffc020'],['g','#30e060']].forEach(([k2,col],i)=>{ c.fillStyle=Lg.col===k2?col:'#3a3a3a'; if(Lg.col===k2){ c.shadowColor=col; c.shadowBlur=10; } c.beginPath(); c.arc(bx+(i-1)*9*p[2]*M,by+5*p[2],3.6*p[2],0,7); c.fill(); c.shadowBlur=0; });
      if(S.pal==='tw'){ c.fillStyle='#111'; rr(c,bx+16*p[2]*M-7*p[2],by,14*p[2],10*p[2],1.5*p[2]); c.fill(); c.fillStyle=Lg.col==='g'?'#30e060':Lg.col==='y'?'#ffc020':'#ff3030'; c.font='900 '+Math.max(5,Math.round(8*p[2]))+'px monospace'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(Math.ceil(Lg.left)).padStart(2,'0'),bx+16*p[2]*M,by+5.5*p[2]); }
      if(I.cam){ c.fillStyle='#ffd23f'; rr(c,p[0]-6*p[2],p[1]-46*p[2],12*p[2],9*p[2],2*p[2]); c.fill(); c.fillStyle='#222'; c.beginPath(); c.arc(p[0],p[1]-41.5*p[2],2.6*p[2],0,7); c.fill(); }
      const q=proj(-14,I.d+100,0); if(q){ c.fillStyle='#3a3a44'; c.fillRect(q[0]-1.4*q[2],q[1]-60*q[2],2.8*q[2],60*q[2]); } }); }
  // 停在路邊的車、攤販、陣頭、白煙
  for(const pk of lv.parked) add(pk.d-26-cd,()=>{ const p=proj(LANE[4]+6,pk.d-26,0); if(!p) return; vehBack(c,p[0],p[1],p[2],{k:'car',w:28,col:pk.col,idx:Math.floor(pk.d)},false,t);
      if(pk.door>0){ const q=proj(LANE[4]-8,pk.d-18,0); if(q){ c.fillStyle=pk.col; const dw=12*q[2]*pk.door; c.fillRect(M>0?q[0]-dw:q[0],q[1]-17*q[2],dw,13*q[2]); c.strokeStyle='#222'; c.lineWidth=1; c.strokeRect(M>0?q[0]-dw:q[0],q[1]-17*q[2],dw,13*q[2]); } } });
  // 夜市攤車：不鏽鋼台面、玻璃櫃、條紋遮雨棚、燈泡、老闆
  for(const sl of lv.stalls) add(sl.d-sl.len/2-cd,()=>{ const p=proj(LANE[4]-4,sl.d-sl.len/2,0); if(!p) return; const k=p[2],w2=40*k,X=p[0],Y=p[1],id=Math.floor(sl.d);
      c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(X,Y,w2*.6,w2*.06,0,0,7); c.fill();
      pedFront(c,X+w2*.18,Y-6*k,k,hcol(SHIRT,id,5),'#1a1410',t,id%7+.5);
      c.fillStyle='#1a1a1a'; c.beginPath(); c.arc(X-w2*.36,Y-2.4*k,2.4*k,0,7); c.arc(X+w2*.36,Y-2.4*k,2.4*k,0,7); c.fill();
      const g=c.createLinearGradient(0,Y-18*k,0,Y-3*k); g.addColorStop(0,'#dfe3e6'); g.addColorStop(1,'#80858c'); c.fillStyle=g; c.fillRect(X-w2/2,Y-18*k,w2,15*k);
      c.fillStyle='rgba(0,0,0,.2)'; c.fillRect(X-w2/2,Y-11*k,w2,.8*k);
      c.fillStyle=sl.col; c.fillRect(X-w2*.42,Y-16*k,w2*.84,4*k); if(w2>40){ c.fillStyle='#fff'; c.font='900 '+Math.round(3.4*k)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(hcol(['香雞排','臭豆腐','烤香腸','蚵仔煎','大腸包小腸','珍珠奶茶'],id,6),X,Y-14*k); }
      c.fillStyle='rgba(210,235,245,.4)'; c.fillRect(X-w2*.46,Y-26*k,w2*.92,8*k); c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=Math.max(.5,k*.3); c.strokeRect(X-w2*.46,Y-26*k,w2*.92,8*k);
      for(let i=0;i<5;i++){ c.fillStyle=hcol(['#d8a050','#c05030','#e8d8a0','#8a5a30','#f0c060'],id+i,7); c.beginPath(); c.ellipse(X-w2*.36+i*w2*.18,Y-19.6*k,w2*.06,1.4*k,0,0,7); c.fill(); }
      c.fillStyle='#4a4a50'; c.fillRect(X-w2*.48,Y-42*k,1.2*k,24*k); c.fillRect(X+w2*.48-1.2*k,Y-42*k,1.2*k,24*k);
      for(let i=0;i<6;i++){ const x0=X-w2*.62+i*w2*.207; c.fillStyle=i%2?'#f2f0ea':shade(sl.col,night?.8:1); c.beginPath(); c.moveTo(x0,Y-46*k); c.lineTo(x0+w2*.207,Y-46*k); c.lineTo(x0+w2*.207*1.04,Y-40*k); c.lineTo(x0-w2*.01,Y-40*k); c.closePath(); c.fill(); }
      c.fillStyle='rgba(0,0,0,.18)'; c.fillRect(X-w2*.62,Y-40.6*k,w2*1.24,.8*k);
      for(let i=0;i<4;i++){ const bx=X-w2*.36+i*w2*.24,by=Y-38*k; if(night){ const lg=c.createRadialGradient(bx,by,0,bx,by,7*k); lg.addColorStop(0,'rgba(255,220,140,.7)'); lg.addColorStop(1,'rgba(255,220,140,0)'); c.fillStyle=lg; c.fillRect(bx-7*k,by-7*k,14*k,14*k); } c.fillStyle=night?'#fff2c0':'#e8e4d0'; c.beginPath(); c.arc(bx,by,1*k,0,7); c.fill(); } });
  if(lv.parade){ const pdd=lv.parade.d0+lv.parade.v*Math.max(0,simT); for(let i=0;i<10;i++){ const x=LANE[3]+(i%3)*30-10,d=pdd-lv.parade.len/2+i*13; add(d-cd,()=>{ const p=proj(x,d,0); if(!p) return; pedFront(c,p[0],p[1],p[2]*1.1,['#e23b3b','#ffd23f','#2a9d5c'][i%3],'#222',t,i); if(i%3===0){ c.fillStyle='#e23b3b'; c.fillRect(p[0]+4*p[2],p[1]-46*p[2],12*p[2],16*p[2]); c.fillStyle='#333'; c.fillRect(p[0]+3*p[2],p[1]-46*p[2],1.5*p[2],46*p[2]); } }); } }
  for(const s3 of lv.steam) add(s3.d-cd,()=>{ const a=.35+.3*Math.sin(t*1.5+s3.ph); if(a<.2) return; const p=proj(s3.x,s3.d,0); if(!p) return; c.fillStyle='rgba(240,240,245,'+a+')'; for(let i=0;i<4;i++){ c.beginPath(); c.arc(p[0]+Math.sin(t+i)*10*p[2],p[1]-i*12*p[2],(16+i*6)*p[2],0,7); c.fill(); } });
  // 車流
  for(const e of lv.veh){ const near=e.d-e.h/2; add(near-cd,()=>{ const p=proj(e.x,near,0); if(!p) return; vehBack(c,p[0],p[1],p[2],Object.assign({night},e),e.dir<0,t); }); }
  // 路口橫向車流（被路口兩邊的房子擋住的部分不畫）
  const cr=[]; for(const I of lv.inter) if(I.d-cd<1100&&I.d+130-cd>0){ const n0=cr.length; crossers(lv,I,simT,cr); crossPeds(lv,I,simT,cr); for(let i=n0;i<cr.length;i++) cr[i].I2=I; }
  for(const e of cr){ const near=e.k==='ped'?e.d:e.d-e.w/2; add(near-cd,()=>{ const p=proj(e.x,near,0); if(!p) return; const I=e.I2,l=proj(-44,I.d-38,0),r=proj(ROADW+44,I.d-38,0);
      c.save(); if(l&&r){ const a=Math.min(l[0],r[0]),b=Math.max(l[0],r[0]); c.beginPath(); c.rect(a,-50,b-a,H+100); c.clip(); }
      if(e.k==='ped') pedFront(c,p[0],p[1],p[2],e.col,'#3a2a1a',simT,e.x);
      else if(e.warn){ const q=proj(e.horiz>0?-20:ROADW+20,near,30); if(q){ c.fillStyle='#ff3030'; c.font='900 '+Math.round(30*q[2])+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('！',q[0],q[1]); } }
      else vehSide(c,p[0],p[1],p[2],e,e.horiz*M);
      c.restore(); }); }
  for(const l of st.locals||[]) add(l.d-cd,()=>{ const p=proj(l.x,l.d,0); if(!p) return; if(l.k==='dog') dogSide(c,p[0],p[1],p[2],t,Math.sign(l.vx)*M); else pedFront(c,p[0],p[1],p[2],l.col,'#3a2a1a',t,l.d); });
  // 其他外送員
  for(const r of st.riders||[]) add(r.d-cd,()=>{ const p=proj(r.x,r.d,0); if(!p) return; c.save(); if(r.ghost) c.globalAlpha=.75;
      vehBack(c,p[0],p[1],p[2],{k:'scoot',w:16,col:r.look.bike,helm:r.look.helmet,shirt:r.look.shirt,box:r.look.box,char:r.look.char,idx:r.n},false,t); c.restore();
      if(r.name&&p[3]<320){ const nm=r.name.replace('（電腦）',''),a=clamp((320-p[3])/120,0,1)*.85; c.globalAlpha=a; c.font='700 11px '+TC; const w2=c.measureText(nm).width+10; c.fillStyle='rgba(11,10,28,.6)'; rr(c,p[0]-w2/2,p[1]-34*p[2]-16,w2,15,7); c.fill(); c.fillStyle='#fff'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(nm,p[0],p[1]-34*p[2]-8.5); c.globalAlpha=1; } });
  B.sort((a,b)=>b[0]-a[0]); for(const [,fn] of B) fn();
  const vg=c.createRadialGradient(cx,H*.5,vw*.3,cx,H*.5,vw*.75); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,night?'rgba(0,0,10,.45)':'rgba(10,15,25,.28)'); c.fillStyle=vg; c.fillRect(vx-40,-40,vw+80,H+80);
  if(!night){ c.fillStyle=S.evening?'rgba(255,150,80,.07)':'rgba(255,236,210,.05)'; c.fillRect(vx-40,-40,vw+80,H+80); }
  c.restore(); }

/* ---------- 遊戲 ---------- */
function create(env,opts){
  const net=opts.net,two=!net&&opts.mode==='2p',humans=net?net.count:two?2:1,me=net?net.me:0,host=!net||net.host,si=clamp(opts.stage||0,0,STAGES.length-1),S=STAGES[si];
  const seed=net?(Number(net.seed)>>>0)||7:Math.floor(Math.random()*1e9),lv=buildLevel(si,seed),M=S.left?-1:1;
  const {ctx:c}=env.canvas2d(W,H);
  // 玩法：各自搶單（電腦補到 4 人）／分隊對戰／玩家同隊打電腦／玩家對決（不加電腦）；分隊時整隊淨收入相加
  let mode=(opts.options&&opts.options.team)||'ffa'; if(humans===1&&mode==='pvp') mode='ffa'; if(mode==='coop'&&humans>3) mode='vs';
  let num=net?Math.min(6,net.count+(net.bots||0)):4;
  if(mode==='coop') num=humans*2; else if(mode==='pvp') num=Math.max(2,humans+humans%2); else if(mode==='vs'){ if(num%2) num=Math.min(6,num+1); if(num<2) num=2; }
  const TEAMS=mode==='coop'?[{name:'玩家隊',col:'#ffd23f'},{name:'電腦隊',col:'#a8adc0'}]:[{name:'紅隊',col:'#ff4d4d'},{name:'藍隊',col:'#3d8bff'}];
  const teamOf=[],cnt=[0,0]; for(let i=0;i<num;i++){ let tm=null; if(mode==='coop') tm=i<humans?0:1; else if(mode!=='ffa') tm=i<humans?i%2:(cnt[0]<=cnt[1]?0:1); if(tm!=null) cnt[tm]++; teamOf.push(tm); }
  const ALT=[{char:'boy',helmet:'#ffd23f',shirt:'#2f8a5a',bike:'#e23b3b',box:'#ff7a3d'},{char:'girl',helmet:'#ff7eb6',shirt:'#4f9dff',bike:'#f0f0e8',box:'#3ddbd9'},{char:'cat',helmet:'#b98cff',shirt:'#ffd23f',bike:'#2b2b36',box:'#ff5d8f'},{char:'bear',helmet:'#c8935a',shirt:'#ff9d3d',bike:'#2f6fd0',box:'#86dc4f'}];
  const BOTN=['阿凱','小芳','阿明','阿珠','小胖','阿翔'];
  const names=[]; for(let i=0;i<num;i++) names.push(i>=humans?BOTN[(i-humans+seed%3)%BOTN.length]+'（電腦）':net?(net.names&&net.names[i])||'玩家'+(i+1):two?(i+1)+'P':(opts.name||'你'));
  const ps=[]; for(let n=0;n<num;n++){ const bot=n>=humans,look=Object.assign({},ALT[n%4],(bot?null:net?net.looks&&net.looks[n]:n===0?opts.look:null)||{});
    const sk=clamp(.5+S.stars*.06+Math.random()*.16,.5,.92);
    ps.push({n,x:LANE[4]-14+(n%2)*-30-Math.floor(n/2)*10,d:60-n*46,wasIn:false,v:0,vx:0,fall:0,inv:0,look,bot,team:teamOf[n],remote:!!net&&(bot?!host:n!==me),tx:0,td:0,
      ai:bot&&host?{skill:sk,lane:[252,300,180][n%3],top:.78+sk*.22,obey:Math.random()<sk,blT:3+Math.random()*6,blind:0}:null,
      oi:0,phase:'pick',stopT:0,food:3,fuel:100,deadline:0,money:{fee:0,tip:0,fine:0,gas:0,late:0,comp:0,fix:0},done:false,doneT:0,deliv:0,lost:0,timeout:false,log:[],lean:0,gust:0,lastD:60-n*46,warned:{}}); }
  const SHIFT=S.orders*50+30; // 這一班的時間（秒），時間到就收工
  let t=-3,simT=0,acc=0,ended=false,sendT=0,windT=0,windF=0,windDir=1,camD=[0,0],fx=[],introT=0,goSaid=false,endT=0,engine=null,ff=false;
  const total=p=>p.money.fee+p.money.tip-p.money.fine-p.money.gas-p.money.late-p.money.comp-p.money.fix;
  const order=p=>lv.orders[p.oi];
  const local=p=>!p.remote&&!p.bot; // 自己這台電腦上操作的真人（音效只給他們）
  const sfx=(p,k)=>{ if(local(p)) env.sfx(k); };
  function startOrder(p){ const o=order(p); if(!o){ p.done=true; p.doneT=t; return; } p.phase='pick'; p.food=3; p.deadline=t+((o.cus.d-p.d)/150)*1.5+18; }
  ps.forEach(startOrder); ps.forEach(p=>{ p.tx=p.x; p.td=p.d; });
  const pop=(p,txt,col)=>fx.push({k:'txt',x:p.x,d:p.d+30,txt,col,t:0,n:p.n});

  // 引擎聲（只有自己／1P）
  try{ const ac=env.audio(),out=env.out(); if(ac&&out){ const o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain(); o.type='sawtooth'; f.type='lowpass'; f.frequency.value=500; g.gain.value=0; o.connect(f); f.connect(g); g.connect(out); o.start(); engine={o,g,ac}; } }catch(e){}

  // 按鍵：1P 方向鍵（單人時 WASD 也可以）、2P 用 WASD
  function input(p,dt){ if(p.ai) return botInput(p,dt); const k=env.keys; let L,R,U,D;
    if(two){ if(p.n===0){ L=k.ArrowLeft; R=k.ArrowRight; U=k.ArrowUp; D=k.ArrowDown; } else { L=k.KeyA; R=k.KeyD; U=k.KeyW; D=k.KeyS; } }
    else { L=k.ArrowLeft||k.KeyA; R=k.ArrowRight||k.KeyD; U=k.ArrowUp||k.KeyW; D=k.ArrowDown||k.KeyS; }
    return {dir:((R?1:0)-(L?1:0))*M,gas:!!U,brake:!!D}; }
  // 電腦外送員：往目標騎，前面有車就換車道；偶爾分心（技術越差越常分心），有的會守紅燈、有的會闖
  function botInput(p,dt){ const ai=p.ai,o=order(p),tgt=o?(p.phase==='pick'?o.shop:o.cus):null; if(!tgt||p.done) return {dir:0,gas:false,brake:true};
    ai.blT-=dt; if(ai.blT<=0){ ai.blT=4+Math.random()*9; ai.blind=Math.random()<(1-ai.skill)*.7?1+Math.random():0; } if(ai.blind>0) ai.blind-=dt;
    const dist=tgt.d-p.d; let want=dist<260&&dist>-60?330:ai.lane;
    if(ai.blind<=0&&dist>200){ const ahead=lv.veh.some(e=>e.d-p.d>0&&e.d-p.d<70+90*ai.skill&&Math.abs(e.x-p.x)<30)||lv.parked.some(pk=>pk.d-p.d>0&&pk.d-p.d<120&&Math.abs(LANE[4]+6-p.x)<34)||lv.stalls.some(sl=>sl.d-p.d>-sl.len/2&&sl.d-p.d<130&&Math.abs(LANE[4]-4-p.x)<34);
      if(ahead){ if(!ai.dodge) ai.dodge=p.x>220?180:300; want=ai.dodge; } else ai.dodge=0; }
    const gas=p.fuel<25?lv.gas.find(gs=>gs.d-p.d>-20&&gs.d-p.d<300):null; let stopAt=gas?gas.d:tgt.d; if(gas) want=330;
    let brakeFor=1e9; if(ai.obey&&ai.blind<=0) for(const I of lv.inter){ const sl=I.d-12-p.d; if(sl>0&&sl<p.v*.9+40){ const L2=lightOf(I,simT); if(L2.col==='r'||L2.col==='y'&&sl>p.v*.4) brakeFor=sl; } }
    const dd=Math.min(stopAt-p.d,brakeFor),dir=Math.abs(want-p.x)>6?(want>p.x?1:-1):0;
    if(stopAt-p.d<-30) return {dir,gas:false,brake:true};
    if(dd<p.v*.7+10&&dd<200) return {dir,gas:false,brake:true};
    return {dir,gas:p.v<250*ai.top,brake:false}; }

  function crash(p,why){ if(p.inv>0||p.fall>0) return; p.fall=1.3; p.inv=2.6; p.v=0; sfx(p,'hurt'); sfx(p,'bump');
    p.money.fix+=20; const carry=p.phase==='drop'; if(carry) p.food--; fx.push({k:'star',x:p.x,d:p.d,t:0,n:p.n}); pop(p,why+'　修車 -$20'+(carry?'　餐點 -1':''),'#ff8a8a');
    if(carry&&p.food<=0){ p.money.comp+=80; p.lost++; p.log.push('餐點翻了，賠償 $80'); setTimeout(()=>pop(p,'餐點全毀！賠 $80','#ff5d5d'),500); p.oi++; startOrder(p); } }
  function rectHit(p,x,d,w,h){ return Math.abs(p.x-x)<(w+12)/2&&Math.abs(p.d-d)<(h+28)/2; }
  // 自己附近才出現的突發狀況：亂穿越的行人、狗、開車門（只對真人）
  const locals=[];
  function localHazards(p,dt){
    if(p.remote||p.bot) return;
    if(Math.random()<dt*S.jay*.35&&p.v>60){ const side=Math.random()<.5?1:-1; locals.push({k:'ped',x:side>0?-30:ROADW+30,d:p.d+230+Math.random()*120,vx:side*(40+Math.random()*25),col:CAR_COL[Math.floor(Math.random()*8)],face:side>0?Math.PI/2:-Math.PI/2,n:p.n}); }
    if(S.dog&&Math.random()<dt*S.dog*.25&&p.v>60){ const side=Math.random()<.5?1:-1; locals.push({k:'dog',x:side>0?-20:ROADW+20,d:p.d+220+Math.random()*100,vx:side*(80+Math.random()*40),face:side>0?Math.PI/2:-Math.PI/2,n:p.n,wig:Math.random()*6}); }
    for(const pk of lv.parked){ if(pk.trig&&!pk.done&&pk.d-p.d>60&&pk.d-p.d<150&&Math.abs(p.x-LANE[4])<70){ pk.done=true; pk.doorT=2.4; env.sfx('beep'); } }
  }

  function updatePlayer(p,dt){
    if(p.remote){ const f=Math.min(1,dt*12); p.x+=(p.tx-p.x)*f; p.d+=(p.td-p.d)*f; return; }
    if(p.done){ p.v=Math.max(0,p.v-200*dt); p.d+=p.v*dt; return; }
    if(p.inv>0) p.inv-=dt;
    if(p.fall>0){ p.fall-=dt; return; }
    const I=input(p,dt),rain=!!S.rain,vmax=p.fuel>0?250:55;
    if(t<0){ return; }
    if(I.gas) p.v=Math.min(vmax,p.v+(p.v<0?260:150)*dt);
    else if(I.brake){ if(p.v>0) p.v=Math.max(0,p.v-(rain?170:270)*dt); else p.v=Math.max(-55,p.v-60*dt); } // 停下來再按 ↓ 可以慢慢倒車
    else p.v+=(p.v>0?-Math.min(p.v,55*dt):Math.min(-p.v,80*dt));
    const steer=I.dir*150*(.45+.55*Math.min(1,Math.abs(p.v)/150));
    p.vx=rain?lerp(p.vx,steer,Math.min(1,dt*3)):steer;
    // 風、水窪
    let push=0; if(S.wind&&windT>0) push=windDir*windF;
    let inP=false; for(const pd of lv.puddles) if(Math.hypot(p.x-pd.x,(p.d-pd.d)*.6)<pd.r&&p.v>40){ inP=true; p.vx+=(Math.random()-.5)*400*dt; } if(inP&&!p.wasIn) sfx(p,'pop'); p.wasIn=inP;
    p.x=clamp(p.x+(p.vx+push)*dt,10,ROADW-10); p.lean=lerp(p.lean,I.dir*M,Math.min(1,dt*8));
    const lastD=p.d; p.d=Math.max(-40,Math.min(lv.L+200,p.d+p.v*dt));
    p.fuel=Math.max(0,p.fuel-Math.abs(p.d-lastD)*.0075); if(p.fuel<=0&&!p.noFuel){ p.noFuel=1; pop(p,'沒油了！慢慢推去加油站','#ffd23f'); sfx(p,'trap'); }
    // 路口：闖紅燈拍照
    for(const I2 of lv.inter){ const sl=I2.d-10; if(lastD<sl&&p.d>=sl){ const L2=lightOf(I2,simT); if(L2.col==='r'&&I2.cam&&L2.p>Y_END+.4){ p.money.fine+=300; p.log.push('闖紅燈被拍，罰單 $300'); pop(p,'📸 闖紅燈！罰 $300','#ff5d5d'); sfx(p,'trap'); fx.push({k:'flash',t:0,n:p.n}); } } }
    // 坑洞（每個人各自算有沒有壓過）
    for(const h of lv.holes) if(Math.hypot(p.x-h.x,p.d-h.d)<h.r+5&&!(h.hit&1<<p.n)){ h.hit=(h.hit||0)|1<<p.n; if(p.v>140){ p.v*=.6; if(p.phase==='drop'&&p.inv<=0){ if(p.food>1){ p.food--; pop(p,'坑洞！湯灑出來了','#ffb36b'); sfx(p,'bump'); } else crash(p,'坑洞'); } } else sfx(p,'land'); }
    // 撞車、撞人
    if(p.inv<=0){
      for(const e of lv.veh) if(Math.abs(e.d-p.d)<80&&rectHit(p,e.x,e.d,e.w,e.h)){ crash(p,e.k==='bus'?'撞到公車':e.k==='scoot'||e.k==='tuk'?'撞到機車':'撞到車'); break; }
      const cr=[]; for(const I2 of lv.inter) if(Math.abs(I2.d-p.d)<200){ crossers(lv,I2,simT,cr); crossPeds(lv,I2,simT,cr); }
      for(const e of cr){ if(e.k==='ped'){ if(rectHit(p,e.x,e.d,10,10)){ crash(p,'撞到行人'); break; } } else if(!e.warn&&rectHit(p,e.x,e.d,e.h,e.w)){ crash(p,e.k==='runner'?'闖紅燈的機車！':'撞到橫向來車'); break; } }
      for(const pk of lv.parked){ if(rectHit(p,LANE[4]+6,pk.d,28,52)){ crash(p,'撞到路邊停車'); break; } if(pk.doorT>0&&rectHit(p,LANE[4]-20,pk.d-4,14,18)){ crash(p,'車門突然打開'); break; } }
      for(const st of lv.stalls) if(rectHit(p,LANE[4]-4,st.d,40,st.len)){ crash(p,'撞到攤販'); break; }
      for(const lc of locals) if(lc.n===p.n&&rectHit(p,lc.x,lc.d,10,12)){ crash(p,lc.k==='dog'?'撞到狗狗':'撞到亂穿越的行人'); break; }
      if(lv.parade){ const pd=lv.parade.d0+lv.parade.v*Math.max(0,simT); if(p.x>LANE[3]-40&&Math.abs(p.d-pd)<lv.parade.len/2+14) crash(p,'撞進廟會陣頭'); }
    }
    // 取餐、送餐、加油：在機車道停下來
    const o=order(p),tgt=o?(p.phase==='pick'?o.shop:o.cus):null;
    const atStop=st=>Math.abs(p.d-st.d)<46&&p.x>LANE[4]-44&&Math.abs(p.v)<28;
    let busyStop=null; if(tgt&&atStop(tgt)) busyStop=tgt; else for(const g of lv.gas) if(atStop(g)&&p.fuel<95) busyStop=g;
    if(busyStop){ p.stopT+=dt; if(p.stopT>=.8){ p.stopT=0;
        if(busyStop.kind==='gas'){ const cost=Math.round((100-p.fuel)*1.3); p.money.gas+=cost; p.fuel=100; p.noFuel=0; pop(p,'加滿油 -$'+cost,'#ffd23f'); sfx(p,'heal'); }
        else if(p.phase==='pick'){ p.phase='drop'; pop(p,'取到餐了！','#86dc4f'); sfx(p,'item'); }
        else { const late=t>p.deadline,fee=o.fee; p.money.fee+=fee; p.deliv++; let tip=0; if(!late){ tip=Math.round((p.deadline-t)*.8)+(p.food>=3?15:0); p.money.tip+=tip; }
          if(late){ p.money.late+=Math.round(fee/2); p.log.push('超時，扣 $'+Math.round(fee/2)); }
          pop(p,late?'送達（超時扣一半）+$'+(fee-Math.round(fee/2)):'送達！+$'+fee+(tip?'　小費 $'+tip:''),late?'#ffb36b':'#86dc4f'); sfx(p,late?'land':'lap'); p.oi++; startOrder(p); } } }
    else p.stopT=0;
  }

  // 連線：每個人只算自己，電腦外送員由房主算，位置和收入傳給別人；房主決定什麼時候結束
  const pack=p=>[p.n,Math.round(p.x),Math.round(p.d),Math.round(p.v),p.fall>0?1:0,total(p),p.done?1:0,p.oi,p.food,p.lean.toFixed(2),p.deliv,p.lost,Math.round(p.doneT*100),p.timeout?1:0];
  function apply(a){ const p=ps[a[0]]; if(!p||!p.remote) return; p.tx=a[1]; p.td=a[2]; p.v=a[3]; p.fall=a[4]?.5:0; p.netMoney=a[5]; p.done=!!a[6]; p.oi=a[7]; p.food=a[8]; p.lean=+a[9]; p.deliv=a[10]||0; p.lost=a[11]||0; p.doneT=(a[12]||0)/100; p.timeout=!!a[13]; }
  if(net){ net.onmsg=m=>{ if(m.k) apply(m.k); if(m.ks) for(const a of m.ks) if(a[0]!==me) apply(a); if(m.end) conclude(m.end); };
    net.onleave=i=>{ const p=ps[i]; if(p){ p.done=true; p.left=true; names[i]+='（離開）'; } }; }
  const moneyOf=p=>p.remote?(p.netMoney||0):total(p);
  const statOf=p=>[moneyOf(p),p.deliv,p.lost,Math.round(p.doneT*100)/100,p.timeout?1:0];
  const fmtT=s=>{ s=Math.max(0,s); const m=Math.floor(s/60),r=s-m*60; return String(m).padStart(2,'0')+':'+r.toFixed(2).padStart(5,'0'); };

  function conclude(list){
    if(ended) return; ended=true; if(engine){ try{ engine.g.gain.value=0; }catch(e){} }
    list=list||ps.map(statOf); const st=i=>list[i]||[0,0,0,0,1];
    const mine=ps[me],net$=st(me)[0],stars=net$>=S.target?3:net$>=S.target*.7?2:net$>=S.target*.4?1:0;
    try{ const k='arcade.deliver.b.'+si,old=parseInt(localStorage.getItem(k),10); if(!two&&!net&&(isNaN(old)||net$>old)) localStorage.setItem(k,net$); }catch(e){}
    const m=mine.money,row=(a,b,col)=>'<tr><td>'+a+'</td><td style="text-align:right;color:'+col+'">'+b+'</td></tr>';
    const mineHtml='<table class="ls">'+row('外送費','+$'+m.fee,'#86dc4f')+row('小費','+$'+m.tip,'#86dc4f')+row('油錢','-$'+m.gas,'#ff8a8a')+row('罰單','-$'+m.fine,'#ff8a8a')+row('超時扣款','-$'+m.late,'#ff8a8a')+row('撞車修理費','-$'+m.fix,'#ff8a8a')+row('餐點賠償','-$'+m.comp,'#ff8a8a')+'</table>';
    // 名次：淨收入高的贏；一樣多就比誰先收工
    const R=ps.map((p,i)=>({i,name:names[i],team:p.team,money:st(i)[0],deliv:st(i)[1],lost:st(i)[2],tm:st(i)[3],out:!!st(i)[4]})).sort((a,b)=>b.money-a.money||(a.out-b.out)||a.tm-b.tm);
    const all=lv.orders.length,safe=R.filter(r=>!r.out&&r.deliv===all&&r.lost===0).sort((a,b)=>a.tm-b.tm)[0];
    const humanWin=R[0].i<humans;
    let title,text='淨收入 $'+net$+'（目標 $'+S.target+'）',html='';
    html='<table class="ls"><tr><th>名次</th><th>外送員</th><th>淨收入</th><th>送達</th><th>收工時間</th></tr>'+R.map((r,k)=>'<tr><td>'+(k+1)+'</td><td>'+(r.team!=null?'<span style="color:'+TEAMS[r.team].col+'">■</span> ':'')+r.name+'</td><td>'+(r.money<0?'-$'+(-r.money):'$'+r.money)+'</td><td>'+r.deliv+'/'+all+'</td><td>'+(r.out?'時間到':fmtT(r.tm))+'</td></tr>').join('')+'</table>';
    if(safe) html+='<p>🏁 最速安全送達：<b>'+safe.name+'</b>（'+fmtT(safe.tm)+'，'+all+' 單全部完整送到）</p>';
    if(mode!=='ffa'){ const sum=[0,0]; R.forEach(r=>{ if(r.team!=null) sum[r.team]+=r.money; }); const wt=sum[0]===sum[1]?-1:sum[0]>sum[1]?0:1;
      const $f=v=>v<0?'-$'+(-v):'$'+v; html='<p>'+TEAMS[0].name+' '+$f(sum[0])+'　vs　'+TEAMS[1].name+' '+$f(sum[1])+'</p>'+html;
      const myT=ps[me].team,ok=wt>=0&&(two?(ps[0].team===wt||ps[1].team===wt):myT===wt);
      title=wt<0?'兩隊平手！':TEAMS[wt].name+'贏了！'+(ok&&!(two&&ps[0].team!==ps[1].team)?'你們是外送王！':''); env.sfx(ok?'win':'lose'); }
    else { title=two?R[0].name+' 是外送王！':R[0].i===me?'你是外送王！':R[0].name+' 是外送王！'; if(!two&&!net&&R[0].i!==me) title+=' 你第 '+(R.findIndex(r=>r.i===me)+1)+' 名'; env.sfx(R[0].i===me||two&&humanWin?'win':'lose'); }
    if(!two) html+=mineHtml;
    if(!two&&!net) title+=stars?'　'+'★'.repeat(stars)+'☆'.repeat(3-stars):'';
    env.end({title,big:'$'+net$,html,text,score:two||net?null:net$,next:false});
  }

  function step(dt){
    const was=t; t+=dt; introT+=dt;
    if(!ff&&(was<-2&&t>=-2||was<-1&&t>=-1||was<0&&t>=0)) env.sfx(t>=0?'go':'beep');
    if(t>0){ acc+=dt; while(acc>=SIM){ acc-=SIM; simT+=SIM; simStep(lv,simT); } }
    for(const pk of lv.parked) if(pk.doorT>0){ pk.doorT-=dt; pk.door=Math.min(1,pk.door+dt*4); } else if(pk.door>0) pk.door=Math.max(0,pk.door-dt*3);
    if(S.wind&&t>0){ windT-=dt; if(windT<-4-Math.random()*4){ windT=2.2; windDir=Math.random()<.5?-1:1; windF=70+Math.random()*50; if(!ff) env.sfx('boost'); } }
    for(const p of ps){ localHazards(p,dt); updatePlayer(p,dt); }
    for(let i=locals.length-1;i>=0;i--){ const l=locals[i]; l.x+=l.vx*dt; if(l.k==='dog') l.d+=Math.sin(t*5+l.wig)*30*dt; if(l.x<-80||l.x>ROADW+80) locals.splice(i,1); }
    for(let i=fx.length-1;i>=0;i--){ fx[i].t+=dt; if(fx[i].t>2) fx.splice(i,1); }
    // 下班時間到：還沒送完的收工，手上有餐沒送到要賠
    if(t>SHIFT) for(const p of ps) if(!p.remote&&!p.done){ p.done=true; p.timeout=true; p.doneT=SHIFT; if(p.phase==='drop'){ p.money.comp+=80; p.log.push('時間到，手上的餐沒送到，賠 $80'); pop(p,'下班時間到！手上的餐沒送到 賠 $80','#ff5d5d'); } else pop(p,'下班時間到！','#ffd23f'); }
  }
  function update(dt){
    if(ended) return; dt=Math.min(dt,.05);
    // 真人都收工了，剩電腦還在送：快轉
    ff=host&&t>0&&ps.every(p=>p.bot||p.done)&&ps.some(p=>p.bot&&!p.done);
    for(let i=0,k=ff?10:1;i<k&&!ended;i++) step(dt);
    // 闖紅燈機車的喇叭警告
    const own=ps[me]; for(const I of lv.inter){ if(Math.abs(I.d-own.d)>420) continue; const cr=[]; crossers(lv,I,simT,cr); for(const e of cr) if(e.k==='runner'&&e.warn){ const key=I.idx+':'+Math.floor((simT+I.off)/CYC); if(!own.warned[key]){ own.warned[key]=1; env.sfx('beep'); env.sfx('beep'); } } }
    if(engine&&!ps[me].remote){ const v=Math.abs(ps[me].v); try{ engine.o.frequency.setTargetAtTime(55+v*.55,engine.ac.currentTime,.05); engine.g.gain.setTargetAtTime(t>-3&&!ps[me].done?.018+v/250*.03:0,engine.ac.currentTime,.1); }catch(e){} }
    for(let n=0;n<num;n++){ const p=ps[n]; camD[n]=camD[n]===0&&t<-2.9?p.d:lerp(camD[n]||p.d,p.d+Math.max(0,p.v)*.35,Math.min(1,dt*4)); }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/15; if(net.host) net.send({ks:ps.map(pack)}); else net.send({k:pack(ps[me])}); }
      if(net.host&&(ps.every(p=>p.done)||t>SHIFT+1)){ endT+=dt; if(endT>1.5){ const list=ps.map(statOf); net.send({ks:ps.map(pack)}); net.send({end:list}); conclude(list); } } }
    else if(ps.every(p=>p.done)){ endT+=dt; if(endT>1.6) conclude(null); }
  }

  /* ----- 畫面 ----- */
  function view(vx,vw,n){
    const p=ps[n],o=order(p),tgt=o&&!p.done?(p.phase==='pick'?o.shop:o.cus):null,shake=p.fall>0?Math.sin(t*60)*4*p.fall:0;
    c.save(); c.translate(shake,0);
    const riders=ps.filter(q=>q!==p).map(q=>({x:q.x,d:q.d,look:q.look,n:q.n,name:num>1?names[q.n]:'',ghost:!!net}));
    drawFP(c,vx,vw,{lv,S,M,px:p.x,pd:p.d,simT,t,lean:p.lean,locals:locals.filter(l=>l.n===p.n),riders,target:tgt});
    c.restore();
    c.save(); c.beginPath(); c.rect(vx,0,vw,H); c.clip();
    // 照後鏡：後面 220 以內的車；身旁看不到的車用紅色箭頭提醒
    const mL=[],mR=[],side=[];
    const look=(x,d,len,col)=>{ const dx=(x-p.x)*M,dz=p.d-(d+len/2); if(dz>2&&dz<220) (dx<0?mL:mR).push({dx,dz,col}); if(Math.abs(p.d-d)<len/2+26&&Math.abs(dx)>12&&Math.abs(dx)<95) side.push(dx); };
    for(const e of lv.veh) look(e.x,e.d,e.h,e.k==='taxi'?'#f5c518':e.col);
    for(const q of ps) if(q!==p) look(q.x,q.d,28,q.look.bike);
    for(const dx of side){ const sx=dx<0?vx+18:vx+vw-18,a=.6+.4*Math.sin(t*12); c.fillStyle='rgba(255,60,60,'+a+')'; c.beginPath(); if(dx<0){ c.moveTo(sx-10,H*.55); c.lineTo(sx+8,H*.55-18); c.lineTo(sx+8,H*.55+18); } else { c.moveTo(sx+10,H*.55); c.lineTo(sx-8,H*.55-18); c.lineTo(sx-8,H*.55+18); } c.fill(); }
    // 天氣、夜晚
    if(S.rain){ c.strokeStyle='rgba(190,210,255,.45)'; c.lineWidth=1.2; c.beginPath(); for(let i=0;i<80;i++){ const x=vx+((i*97+t*40)%vw),y=((i*53+t*800)%H); c.moveTo(x,y); c.lineTo(x-4,y+16); } c.stroke();
      c.fillStyle='rgba(200,220,255,.18)'; for(let i=0;i<6;i++){ c.beginPath(); c.arc(vx+((i*173)%vw),(i*97+t*20)%(H*.6),6+i%3*3,0,7); c.fill(); } }
    if(S.wind&&windT>0){ c.fillStyle='rgba(255,255,255,.75)'; c.font='900 22px '+TC; c.textAlign='center'; c.fillText(windDir*M>0?'強風 →→→':'←←← 強風',vx+vw/2,124); c.strokeStyle='rgba(255,255,255,.4)'; c.lineWidth=2; c.beginPath(); for(let i=0;i<10;i++){ const y=(i*61)%H,x=vx+((t*600*windDir*M+i*140)%vw+vw)%vw; c.moveTo(x,y); c.lineTo(x-40*windDir*M,y); } c.stroke(); }
    if(S.night){ const g=c.createRadialGradient(vx+vw/2,H*.62,40,vx+vw/2,H*.62,vw*.7); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(5,5,25,.45)'); c.fillStyle=g; c.fillRect(vx,0,vw,H); }
    else if(S.evening){ c.fillStyle='rgba(255,120,60,.07)'; c.fillRect(vx,0,vw,H); }
    // 自己的機車
    drawCockpit(c,vx,vw,p.look,p.v,p.lean,t,mL,mR,p.fuel,S.night,tgt?{dist:(tgt.d-p.d)/10,pick:p.phase==='pick'}:null);
    if(p.fall>0){ c.fillStyle='rgba(255,60,60,'+Math.min(.35,p.fall*.3)+')'; c.fillRect(vx,0,vw,H); for(let i=0;i<5;i++){ const a=t*5+i*1.26; c.fillStyle='#ffd23f'; c.font='22px sans-serif'; c.textAlign='center'; c.fillText('★',vx+vw/2+Math.cos(a)*90,H*.42+Math.sin(a)*30); } }
    // 取餐／送餐進度
    if(p.stopT>0){ const w2=160; c.fillStyle='rgba(11,10,28,.8)'; rr(c,vx+vw/2-w2/2-6,H*.6-6,w2+12,30,10); c.fill(); c.fillStyle='#3a3670'; rr(c,vx+vw/2-w2/2,H*.6+8,w2,10,5); c.fill(); c.fillStyle='#86dc4f'; rr(c,vx+vw/2-w2/2,H*.6+8,w2*p.stopT/.8,10,5); c.fill();
      c.fillStyle='#fff'; c.font='900 11px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(p.phase==='pick'?'取餐中…':'送餐中…',vx+vw/2,H*.6); }
    // 飄字（畫面中間往上飄）
    let k2=0; for(const f of fx){ if(f.k==='txt'&&f.n===n){ c.globalAlpha=Math.max(0,1-f.t/2); c.fillStyle=f.col; c.font='900 18px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.strokeStyle='#1a1530'; c.lineWidth=5; const y=H*.34-f.t*26+k2*24; c.strokeText(f.txt,vx+vw/2,y); c.fillText(f.txt,vx+vw/2,y); c.globalAlpha=1; k2++; }
      if(f.k==='flash'&&f.n===n&&f.t<.3){ c.fillStyle='rgba(255,255,255,'+(.8-f.t*2.6)+')'; c.fillRect(vx,0,vw,H); } }
    if(two){ c.fillStyle=n===0?'#ffd23f':'#3ddbd9'; c.font='900 16px '+TC; c.textAlign='left'; c.fillText((n+1)+'P',vx+12,110); }
    hud(p,vx,vw,n);
    c.restore(); }
  function hud(p,vx,vw,n,sx,sy){
    const o=order(p),small=vw<500;
    c.fillStyle='rgba(11,10,28,.82)'; rr(c,vx+6,6,vw-12,54,10); c.fill();
    c.textBaseline='middle'; c.textAlign='left'; c.fillStyle='#86dc4f'; c.font='900 18px '+TC; c.fillText('$'+total(p),vx+16,24);
    c.fillStyle='#cfe8d8'; c.font='700 11px '+TC; c.fillText(Math.min(p.oi+1,lv.orders.length)+' / '+lv.orders.length+' 單',vx+16,46);
    // 目前任務
    if(o&&!p.done){ const tgt=p.phase==='pick'?o.shop:o.cus,dist=Math.round((tgt.d-p.d)/10),left=Math.ceil(p.deadline-t);
      c.fillStyle=p.phase==='pick'?'#ff9d5c':'#7ab8ff'; c.font='900 14px '+TC; c.fillText((p.phase==='pick'?'取餐：':'送到：')+tgt.name,vx+(small?88:110),22);
      c.fillStyle='#fff'; c.font='700 12px '+TC; c.fillText((dist>=0?'前方 '+dist+' 公尺':'已經過頭 '+(-dist)+' 公尺，倒車回去')+'　'+(left>=0?'剩 '+left+' 秒':'超時 '+(-left)+' 秒'),vx+(small?88:110),44);
      // 餐點完整度
      if(p.phase==='drop'){ for(let i=0;i<3;i++){ c.fillStyle=i<p.food?'#ffd23f':'#3a3670'; c.beginPath(); c.arc(vx+vw-(small?118:136)+i*14,24,5.5,0,Math.PI); c.fill(); c.fillRect(vx+vw-(small?124:142)+i*14,23,12,2); } } }
    else { c.fillStyle='#ffd23f'; c.font='900 15px '+TC; c.fillText(p.done?(p.timeout?'下班時間到！':'收工了！')+(ff?'電腦還在送，快轉中…':ps.some(q=>!q.done)?'等其他人…':''):'',vx+110,32); }
    // 油量
    const fx0=vx+vw-(small?78:88); c.fillStyle='#fff'; c.font='700 11px '+TC; c.textAlign='left'; c.fillText('油',fx0-16,44); c.fillStyle='#3a3670'; rr(c,fx0,38,small?62:72,12,5); c.fill(); c.fillStyle=p.fuel<20?'#ff5d5d':'#ffd23f'; rr(c,fx0,38,(small?62:72)*p.fuel/100,12,5); c.fill();
    c.fillStyle='#fff'; c.textAlign='right'; c.font='700 11px '+TC; c.fillText(Math.round(Math.abs(p.v)/250*60)+' km/h',vx+vw-16,22);
    // 下班倒數（像碼錶一樣跳到小數點）
    const left=SHIFT-Math.max(0,t),warn=left<30; c.fillStyle=warn?'rgba(120,20,30,.85)':'rgba(11,10,28,.78)'; rr(c,vx+8,66,small?112:128,28,9); c.fill();
    c.textAlign='left'; c.textBaseline='middle'; c.fillStyle=warn&&Math.sin(t*8)>0?'#ffd23f':'#fff'; c.font='900 '+(small?15:17)+'px monospace'; c.fillText('⏳'+fmtT(left),vx+14,81);
    // 即時排名（淨收入）
    if(num>1){ const L=ps.map(q=>({q,m:moneyOf(q)})).sort((a,b)=>b.m-a.m),rh=17,bw=small?132:150,bx=vx+vw-bw-8;
      c.fillStyle='rgba(11,10,28,.7)'; rr(c,bx,66,bw,8+L.length*rh,9); c.fill();
      L.forEach((r,k)=>{ const y=74+k*rh+rh/2,isMe=r.q===p; if(r.q.team!=null){ c.fillStyle=TEAMS[r.q.team].col; c.fillRect(bx+4,y-6,3,12); }
        c.textAlign='left'; c.fillStyle=isMe?'#ffd23f':r.q.bot?'#c9c6e6':'#fff'; c.font=(isMe?'900 ':'700 ')+'11px '+TC; c.fillText((k+1)+'. '+names[r.q.n].replace('（電腦）','').slice(0,6)+(r.q.done?' ✓':''),bx+11,y);
        c.textAlign='right'; c.fillStyle=r.m<0?'#ff8a8a':'#86dc4f'; c.fillText(r.m<0?'-$'+(-r.m):'$'+r.m,bx+bw-8,y); }); }
    if(t<0){ c.fillStyle='rgba(11,10,28,.6)'; c.fillRect(vx,H/2-50,vw,100); c.fillStyle='#ffd23f'; c.font='900 54px '+TC; c.textAlign='center'; c.fillText(String(Math.ceil(-t)),vx+vw/2,H/2); }
    else if(t<1){ c.fillStyle='#86dc4f'; c.font='900 46px '+TC; c.textAlign='center'; c.fillText('出發！',vx+vw/2,H/2); }
  }
  function draw(){
    c.fillStyle='#111'; c.fillRect(0,0,W,H);
    if(two){ view(0,398,0,.74); view(402,398,1,.74); c.fillStyle='#0b0a1c'; c.fillRect(398,0,4,H); }
    else view(0,W,me,1);
  }
  return {update,draw,destroy(){ if(engine){ try{ engine.o.stop(); engine.o.disconnect(); }catch(e){} } },_dbg:{ps,lv,get t(){return t;},get simT(){return simT;},total}};
}

/* ---------- 開始畫面示意圖、縮圖、造型預覽 ---------- */
let demoLv=null,demoSi=-1,demoT=0;
function stageShow(ctx,w,h,si,t){ // 開始畫面左邊：用第一人稱騎一段那個城市
  const S=STAGES[si],M=S.left?-1:1; if(demoSi!==si||t<demoT-1){ demoSi=si; demoLv=buildLevel(si,12345); demoT=0; }
  let n=0; while(demoT<t&&n++<240){ demoT+=SIM; simStep(demoLv,demoT); }
  const pd=(t*120)%Math.max(1200,demoLv.L-900)+200,px=LANE[3]+Math.sin(t*.7)*36,lean=Math.cos(t*.7)*.5;
  ctx.save(); ctx.scale(w/W,h/H); drawFP(ctx,0,W,{lv:demoLv,S,M,px,pd,simT:demoT,t,lean,riders:[],locals:[],target:null});
  drawCockpit(ctx,0,W,{bike:'#e23b3b',shirt:'#2f8a5a'},150,lean,t,[],[],80,S.night,{dist:120-(t*6)%100,pick:true}); ctx.restore();
  const k=w/480; ctx.fillStyle='rgba(11,10,28,.75)'; rr(ctx,8,8,w*.62,34*k,10); ctx.fill(); ctx.fillStyle='#ffd23f'; ctx.font='900 '+Math.round(17*k)+'px '+TC; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(S.name+'　'+'★'.repeat(S.stars),18,8+17*k);
}
function thumb(ctx,w,h,t){
  stageShow(ctx,w,h,0,t);
  ctx.fillStyle='rgba(11,10,28,.35)'; ctx.fillRect(0,0,w,h);
  riderBack(ctx,w*.5,h*.98,0,h*.58,{col:'#e23b3b',helm:'#f2f2f2',shirt:'#2f8a5a',pants:'#2b3550',idx:1},true,t);
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.14)+'px '+TC; ctx.lineWidth=7; ctx.strokeStyle='#1a1530'; ctx.strokeText('街頭外送王',w/2,h*.16); ctx.fillStyle='#ffd23f'; ctx.fillText('街頭外送王',w/2,h*.16);
}
function preview(ctx,w,h,L,t){ // 我的造型：正面＋側面（寫實）
  const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#cfc8bc'); g.addColorStop(.6,'#b8ae9e'); g.addColorStop(.61,'#8e8a84'); g.addColorStop(1,'#56565a'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#a3a7ab'; ctx.fillRect(w*.03,h*.06,w*.94,h*.5); ctx.strokeStyle='rgba(0,0,0,.12)'; ctx.lineWidth=1; for(let y=h*.08;y<h*.56;y+=h*.024){ ctx.beginPath(); ctx.moveTo(w*.03,y); ctx.lineTo(w*.97,y); ctx.stroke(); }
  ctx.fillStyle='rgba(0,0,0,.18)'; ctx.fillRect(0,h*.6,w,h*.02);
  riderBack(ctx,w*.27,h*.96,0,h*.6,{col:L.bike,helm:L.helmet,shirt:L.shirt,pants:'#2b3550',char:L.char,idx:1},true,t);
  scooterSide(ctx,w*.7,h*.94,h*.026,L.bike,-1,{shirt:L.shirt,pants:'#2b3550',helm:L.helmet,skin:SKIN[1],box:L.box,char:L.char},t);
}

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).deliver={
  name:'街頭外送王',tag:'STREET DELIVERY',color:'#ff7a3d',online:true,maxPlayers:4,bots:true,
  desc:'外送員生存賽：在下班前搶著取餐、送餐，躲開馬路三寶。扣掉油錢、罰單、超時、撞車修理費，淨賺最多的就是外送王。',
  goal:'和電腦（或朋友）比賽，在下班倒數結束前把單送完：到店家取餐、送到客人手上，在機車道停下來就會自動取餐／送達。淨收入最高的贏；全部完整送達又最快收工的拿「最速安全送達」。越快送到小費越多；撞車要付修車費還會撞壞餐點，闖紅燈遇到照相機會吃罰單，時間到手上的餐沒送到要賠錢。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人'}],
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  stageGoal:si=>{ const S=STAGES[si]; const m=S.orders*50+30; return S.name+'：'+S.desc+'下班時間 '+Math.floor(m/60)+' 分 '+(m%60)+' 秒內要送 '+S.orders+' 單，和其他外送員比淨收入，最多的就是外送王；自己淨收入 $'+S.target+' 以上拿三顆星。到店家門口的機車道停下來取餐，再送到客人門口；越快送到小費越多。撞車修理費 $20、餐點會撞壞（全毀賠 $80），闖紅燈遇到照相機罰 $300，超時扣一半外送費，油用完要去加油站加。'; },
  stageBest:i=>{ try{ const v=localStorage.getItem('arcade.deliver.b.'+i); return v==null?'':'最高 $'+v; }catch(e){ return ''; } },
  help:[['← →','左右移動（雙人時是 1P）'],['↑','加油門'],['↓','煞車；停下來再按是倒車'],['W A S D','雙人時 2P 的油門、方向、煞車'],['停在綠框裡','取餐、送餐、加油（在機車道停一下）']],
  touchHelp:[['◀ ▶','左右移動'],['▲','加油門'],['▼','煞車；停下來再按是倒車'],['停在綠框裡','取餐、送餐、加油（在機車道停一下）']],
  touch:m=>m==='2p'?{left:[{l:'◀',c:'KeyA'},{l:'▶',c:'KeyD'},{l:'▲',c:'KeyW',act:true},{l:'▼',c:'KeyS'}],right:[{l:'◀',c:'ArrowLeft'},{l:'▶',c:'ArrowRight'},{l:'▲',c:'ArrowUp',act:true},{l:'▼',c:'ArrowDown'}]}
    :{left:[{l:'◀',c:'ArrowLeft'},{l:'▶',c:'ArrowRight'}],right:[{l:'▼',c:'ArrowDown'},{l:'▲',c:'ArrowUp',act:true}]},
  options:[{key:'team',label:'玩法',def:'ffa',opts:[{id:'ffa',label:'各自搶單（電腦補到 4 人）'},{id:'vs',label:'分隊對戰（電腦補人）'},{id:'pvp',label:'玩家對決（不加電腦）'},{id:'coop',label:'玩家同隊打電腦'}]}],
  best:{label:'最高收入',fmt:v=>'$'+v,lower:false},
  looks:[{key:'char',label:'人物',opts:[{id:'boy',label:'男孩'},{id:'girl',label:'女孩'},{id:'cat',label:'貓耳'},{id:'bear',label:'熊熊'}]},
    {key:'helmet',label:'安全帽',type:'color',opts:['#ffd23f','#ff7eb6','#b98cff','#3ddbd9','#ffffff','#2b2b36','#ff5d4f','#86dc4f']},
    {key:'shirt',label:'衣服',type:'color',opts:['#2f8a5a','#4f9dff','#ffd23f','#ff9d3d','#e23b3b','#7a4ac8','#2b2b36','#f0f0e8']},
    {key:'bike',label:'機車',type:'color',opts:['#e23b3b','#f0f0e8','#2b2b36','#2f6fd0','#86dc4f','#ff7eb6','#f5a623','#9aa0a8']},
    {key:'box',label:'外送箱',type:'color',opts:['#ff7a3d','#3ddbd9','#ff5d8f','#86dc4f','#ffd23f','#7a4ac8','#2f6fd0','#e23b3b']}],
  stageShow,thumb,preview,create,_art:{vehBack,vehSide,pedFront,scootSide,scooterSide,dogSide,drawCockpit,preview,thumb}
};
})();
