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
const PAL={tw:{walk:'#c9b8a0',bld:['#e8d7c0','#d9c6a8','#c8d0d8','#e4c4b0','#d0d8c4','#f0e0c8'],sign:['#e23b3b','#2f6fd0','#f5a623','#2a9d5c','#9b51e0']},
  jp:{walk:'#c8c4c0',bld:['#e8e4e0','#d8dce8','#f0e8e0','#c8d4dc','#e0d8d0'],sign:['#e23b3b','#1f3f9f','#f5a623','#222','#d4247a']},
  kr:{walk:'#b8b4c0',bld:['#d8d4e0','#c8c8d8','#e0d8e8','#b8c8d8','#d8c8c8'],sign:['#ff4f7f','#3ddbd9','#ffd23f','#7a5cff','#ff8a3d']},
  us:{walk:'#b0aca8',bld:['#b8a898','#a8b0b8','#c8b0a0','#9898a8','#b8b8b0'],sign:['#ff3d3d','#ffd23f','#3d9dff','#ff3dcf','#3dff8a']},
  th:{walk:'#c8b498',bld:['#e8c8a0','#d8b890','#e0d0b0','#f0c8a8','#c8b8a0'],sign:['#ffd23f','#ff7a3d','#e23b3b','#3dbf6a','#d43dff']}};

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
/* ---------- 第一人稱畫面：騎在機車上往前看 ---------- */
const SKY={day:['#6ab8f0','#d8f0ff'],eve:['#ff8a5a','#ffd6a0'],night:['#070b24','#2a2050']};
const VH={car:20,taxi:20,truck:34,bus:46,garbage:34,scoot:26,runner:26,tuk:28};
// 車子從後面看（同方向）或從前面看（對向）
function vehBack(c,X,Y,s,e,front,t){ const w=e.w*s,h=(VH[e.k]||20)*s,k=e.k;
  c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(X,Y,w*.55,w*.12,0,0,7); c.fill();
  if(k==='scoot'||k==='runner'){ c.fillStyle='#222'; rr(c,X-w*.18,Y-h*.32,w*.36,h*.32,w*.1); c.fill(); c.fillStyle=e.col; rr(c,X-w*.38,Y-h*.62,w*.76,h*.36,w*.2); c.fill();
    c.fillStyle=front?'#fffbe0':'#ff3030'; c.fillRect(X-w*.12,Y-h*.5,w*.24,h*.06);
    c.fillStyle=e.shirt||'#4f6fa0'; rr(c,X-w*.42,Y-h*.95,w*.84,h*.42,w*.3); c.fill(); c.fillStyle=e.helm||'#ffd23f'; c.beginPath(); c.arc(X,Y-h*1.02,w*.36,0,7); c.fill(); c.strokeStyle='rgba(0,0,0,.4)'; c.lineWidth=Math.max(1,s*.4); c.stroke();
    if(e.box){ c.fillStyle=e.box; rr(c,X-w*.45,Y-h*.78,w*.9,h*.36,w*.08); c.fill(); } return; }
  if(k==='tuk'){ c.fillStyle='#222'; c.fillRect(X-w*.55,Y-h*.2,w*.18,h*.2); c.fillRect(X+w*.37,Y-h*.2,w*.18,h*.2); c.fillStyle=e.col; rr(c,X-w*.55,Y-h*.75,w*1.1,h*.58,w*.12); c.fill();
    c.fillStyle='#ffd23f'; rr(c,X-w*.6,Y-h*1.05,w*1.2,h*.34,w*.15); c.fill(); c.fillStyle='#e23b3b'; c.fillRect(X-w*.6,Y-h*.75,w*1.2,h*.05); c.fillStyle='rgba(30,40,60,.7)'; c.fillRect(X-w*.4,Y-h*.68,w*.8,h*.25); return; }
  // 汽車、計程車、卡車、公車、垃圾車
  c.fillStyle='#1a1a1a'; c.fillRect(X-w*.46,Y-h*.14,w*.16,h*.14); c.fillRect(X+w*.3,Y-h*.14,w*.16,h*.14);
  const body=k==='garbage'?'#f5d020':e.col; c.fillStyle=body; rr(c,X-w*.5,Y-h*.62,w,h*.52,w*.08); c.fill(); c.strokeStyle='rgba(0,0,0,.35)'; c.lineWidth=Math.max(1,s*.3); c.stroke();
  if(k==='bus'||k==='truck'||k==='garbage'){ c.fillStyle=k==='bus'?e.col:k==='garbage'?'#2a7a4a':'#ddd'; rr(c,X-w*.5,Y-h,w,h*.45,w*.06); c.fill(); c.stroke();
    c.fillStyle='rgba(30,40,60,.8)'; if(k==='bus'||front) c.fillRect(X-w*.38,Y-h*.95,w*.76,h*.3);
    if(k==='bus'&&!front){ c.fillStyle='#ffd23f'; c.font='900 '+Math.max(6,Math.round(h*.12))+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(200+(e.idx||0)%300),X,Y-h*.8); }
    if(k==='garbage'){ c.fillStyle='#fff'; c.font='900 '+Math.max(6,Math.round(h*.16))+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('♪',X+Math.sin(t*6)*w*.2,Y-h*1.08-Math.abs(Math.sin(t*3))*h*.1); } }
  else { c.fillStyle=shade(body,.85); rr(c,X-w*.4,Y-h,w*.8,h*.42,w*.12); c.fill(); c.fillStyle='rgba(30,40,60,.85)'; rr(c,X-w*.34,Y-h*.94,w*.68,h*.3,w*.06); c.fill();
    if(k==='taxi'){ c.fillStyle='#fff'; c.fillRect(X-w*.12,Y-h*1.1,w*.24,h*.1); } }
  c.fillStyle=front?'#fffbe0':(e.brake?'#ff2020':'#a01818'); const ly=Y-h*.45; c.fillRect(X-w*.46,ly,w*.18,h*.09); c.fillRect(X+w*.28,ly,w*.18,h*.09);
  if(front&&(e.night)){ c.fillStyle='rgba(255,250,200,.25)'; c.beginPath(); c.arc(X-w*.37,ly,w*.25,0,7); c.arc(X+w*.37,ly,w*.25,0,7); c.fill(); }
  c.fillStyle='#ddd'; c.fillRect(X-w*.12,Y-h*.3,w*.24,h*.08); }
// 橫向經過（側面）
function vehSide(c,X,Y,s,e,dirX){ const L=e.h*s,h=(VH[e.k]||20)*s;
  c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(X,Y,L*.5,L*.06,0,0,7); c.fill();
  if(e.k==='scoot'||e.k==='runner'){ c.fillStyle='#222'; c.beginPath(); c.arc(X-L*.32,Y-L*.1,L*.1,0,7); c.arc(X+L*.32,Y-L*.1,L*.1,0,7); c.fill(); c.fillStyle=e.col; rr(c,X-L*.38,Y-h*.55,L*.76,h*.3,h*.1); c.fill();
    c.fillStyle='#4f6fa0'; rr(c,X-L*.12,Y-h*.95,L*.24,h*.42,L*.08); c.fill(); c.fillStyle=e.helm||'#ffd23f'; c.beginPath(); c.arc(X+dirX*L*.04,Y-h*1.02,L*.13,0,7); c.fill(); return; }
  c.fillStyle='#1a1a1a'; c.beginPath(); c.arc(X-L*.32,Y-h*.1,h*.16,0,7); c.arc(X+L*.32,Y-h*.1,h*.16,0,7); c.fill();
  c.fillStyle=e.col; rr(c,X-L*.5,Y-h*.6,L,h*.45,h*.1); c.fill(); c.fillStyle=shade(e.col,.85); rr(c,X-L*.3+dirX*L*.04,Y-h,L*.55,h*.45,h*.15); c.fill();
  c.fillStyle='rgba(30,40,60,.85)'; c.fillRect(X-L*.25+dirX*L*.04,Y-h*.92,L*.2,h*.3); c.fillRect(X+L*.0+dirX*L*.04,Y-h*.92,L*.2,h*.3);
  c.fillStyle='#fffbe0'; c.fillRect(dirX>0?X+L*.46:X-L*.5,Y-h*.5,L*.04,h*.12); }
function pedFront(c,X,Y,s,col,hair,t,ph){ const h=30*s,sw=Math.sin(t*9+(ph||0));
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(X,Y,h*.25,h*.05,0,0,7); c.fill();
  c.fillStyle='#333'; c.fillRect(X-h*.12,Y-h*.32+sw*h*.03,h*.09,h*.32); c.fillRect(X+h*.03,Y-h*.32-sw*h*.03,h*.09,h*.32);
  c.fillStyle=col; rr(c,X-h*.18,Y-h*.66,h*.36,h*.38,h*.1); c.fill();
  c.fillStyle='#ffe0c0'; c.beginPath(); c.arc(X,Y-h*.8,h*.17,0,7); c.fill(); c.fillStyle=hair; c.beginPath(); c.arc(X,Y-h*.84,h*.17,Math.PI,0); c.fill(); }
function dogSide(c,X,Y,s,t,dirX){ const h=12*s; c.fillStyle='#b07a3a'; rr(c,X-h*.8,Y-h*.75,h*1.6,h*.5,h*.2); c.fill(); c.fillRect(X-h*.7,Y-h*.3,h*.18,h*.3); c.fillRect(X+h*.5,Y-h*.3,h*.18,h*.3);
  c.beginPath(); c.arc(X+dirX*h*.9,Y-h*.85,h*.32,0,7); c.fill(); c.strokeStyle='#b07a3a'; c.lineWidth=h*.15; c.beginPath(); c.moveTo(X-dirX*h*.8,Y-h*.65); c.lineTo(X-dirX*h*1.1,Y-h*(1+Math.sin(t*14)*.2)); c.stroke(); }
// 機車把手、雙手、儀表、照後鏡（照後鏡顯示後面的車）
function drawCockpit(c,vx,vw,L,speed,lean,t,mirrorL,mirrorR,fuel,night){ const cx=vx+vw/2,k=vw/800,y0=H-8;
  c.save(); c.translate(cx,y0); c.rotate(lean*.05); c.scale(k,k);
  // 車頭、儀表板
  c.fillStyle=L.bike; c.beginPath(); c.moveTo(-120,20); c.quadraticCurveTo(-110,-46,-40,-58); c.lineTo(40,-58); c.quadraticCurveTo(110,-46,120,20); c.closePath(); c.fill(); c.strokeStyle='#1a1530'; c.lineWidth=3; c.stroke();
  c.fillStyle='#1a1a24'; rr(c,-58,-54,116,40,12); c.fill(); c.strokeStyle='#555'; c.lineWidth=2; c.stroke();
  c.fillStyle='#86dc4f'; c.font='900 22px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(Math.round(Math.abs(speed)/250*60)),-18,-34); c.fillStyle='#9a9ab0'; c.font='700 9px '+TC; c.fillText('km/h',-18,-20);
  c.fillStyle='#3a3a4a'; rr(c,14,-44,34,8,4); c.fill(); c.fillStyle=fuel<20?'#ff5d5d':'#ffd23f'; rr(c,14,-44,34*clamp(fuel/100,0,1),8,4); c.fill(); c.fillStyle='#9a9ab0'; c.fillText('油',31,-28);
  // 把手
  c.strokeStyle='#2a2a32'; c.lineWidth=10; c.lineCap='round'; c.beginPath(); c.moveTo(-250,-40); c.quadraticCurveTo(0,-74,250,-40); c.stroke();
  // 照後鏡
  for(const [sx,list] of [[-1,mirrorL],[1,mirrorR]]){ c.strokeStyle='#2a2a32'; c.lineWidth=5; c.beginPath(); c.moveTo(sx*190,-52); c.lineTo(sx*230,-120); c.stroke();
    c.save(); c.translate(sx*236,-140); c.beginPath(); c.ellipse(0,0,46,28,0,0,7); c.fillStyle='#1a1a24'; c.fill(); c.beginPath(); c.ellipse(0,0,42,24,0,0,7); c.clip();
    const g=c.createLinearGradient(0,-24,0,24); g.addColorStop(0,night?'#0b1030':'#9ac8f0'); g.addColorStop(.45,night?'#2a2050':'#cfe0f0'); g.addColorStop(.46,night?'#2a2a34':'#555a66'); g.addColorStop(1,night?'#22222a':'#44444e'); c.fillStyle=g; c.fillRect(-46,-28,92,56);
    for(const m of list){ const ss=clamp(40/Math.max(12,m.dz),.12,1.2),mx=clamp(m.dx*ss*.6,-40,40); c.fillStyle=m.col; rr(c,mx-12*ss,4-14*ss,24*ss,14*ss,3*ss); c.fill(); }
    c.restore(); c.strokeStyle='#2a2a32'; c.lineWidth=4; c.beginPath(); c.ellipse(sx*236,-140,46,28,0,0,7); c.stroke(); }
  // 戴手套的手
  for(const sx of [-1,1]){ c.fillStyle=L.shirt; c.beginPath(); c.moveTo(sx*300,40); c.quadraticCurveTo(sx*270,-10,sx*228,-34); c.lineTo(sx*200,-18); c.quadraticCurveTo(sx*240,10,sx*250,40); c.closePath(); c.fill(); c.strokeStyle='#1a1530'; c.lineWidth=3; c.stroke();
    c.fillStyle='#2b2b36'; c.beginPath(); c.ellipse(sx*212,-42,24,18,sx*.3,0,7); c.fill(); c.strokeStyle='#1a1530'; c.stroke(); c.fillStyle='#4a4a58'; c.beginPath(); c.ellipse(sx*206,-48,10,6,sx*.3,0,7); c.fill(); }
  c.restore(); }
// 整個第一人稱世界
function drawFP(c,vx,vw,st){
  const {lv,S,M,px,pd,simT,t}=st,F=vw*.62,camH=17,cx=vx+vw/2,hz=H*.42,cd=pd-6,night=S.night;
  const X=(x,s)=>cx+(x-px)*s*M,proj=(x,d,h)=>{ const dz=d-cd; if(dz<2.5) return null; const s=F/dz; return [cx+(x-px)*s*M,hz+(camH-(h||0))*s,s,dz]; };
  c.save(); c.beginPath(); c.rect(vx,0,vw,H); c.clip(); c.translate(cx,H); c.rotate(-(st.lean||0)*.035); c.translate(-cx,-H);
  // 天空、遠方城市、地標
  const sk=night?'night':S.evening?'eve':'day',g=c.createLinearGradient(0,0,0,hz); g.addColorStop(0,SKY[sk][0]); g.addColorStop(1,SKY[sk][1]); c.fillStyle=g; c.fillRect(vx-40,-40,vw+80,hz+42);
  if(night){ c.fillStyle='#fff'; for(let i=0;i<40;i++){ c.globalAlpha=.4+.5*Math.abs(Math.sin(t+i)); c.fillRect(vx+(i*97)%vw,(i*53)%(hz*.7),1.5,1.5); } c.globalAlpha=1; }
  else { c.fillStyle='rgba(255,255,255,.8)'; for(let i=0;i<4;i++){ const x=vx+((i*230+t*6)%(vw+200))-100,y=hz*.2+i*hz*.12; c.beginPath(); c.ellipse(x,y,40,10,0,0,7); c.ellipse(x+24,y-6,26,9,0,0,7); c.fill(); } }
  drawLandmark(c,S.land,vx+vw*(M>0?.74:.26),hz-vw*.075,vw/800*1.1,t,night);
  const pal=PAL[S.pal]; for(let i=0;i<26;i++){ const w2=vw/22,x=vx+i*w2-w2*.5-((pd*.02)%w2),h=18+hash(i,7,Math.floor((pd*.02+i*w2)/w2))*44;
    c.fillStyle=night?'#1a1830':shade(pal.bld[i%pal.bld.length],.62); c.fillRect(x,hz-h,w2+1,h+1); if(night){ c.fillStyle='rgba(255,230,128,.55)'; for(let j=0;j<3;j++) c.fillRect(x+3+j*w2*.3,hz-h+5+((i+j)%3)*8,2,3); } }
  // 地面（人行道顏色）
  c.fillStyle=night?'#2a2a38':pal.walk; c.fillRect(vx-40,hz,vw+80,H-hz+40);
  const asph=S.rain?'#2c2e38':night?'#2f2f3a':'#4a4a54',tgt=st.target;
  for(let y=Math.ceil(hz)+1;y<H+30;y+=2){ const dz=camH*F/(y-hz),d=cd+dz,s=F/dz;
    const inI=lv.inter.find(I=>d>=I.d&&d<=I.d+90),seg=(x0,x1,col)=>{ let a=X(x0,s),b=X(x1,s); if(a>b){ const q=a; a=b; b=q; } c.fillStyle=col; c.fillRect(a,y,b-a+1,2.6); };
    if(inI){ c.fillStyle=asph; c.fillRect(vx-40,y,vw+80,2.6); continue; }
    seg(-30,0,night?'#4a4858':'#d8d0c0'); seg(ROADW,ROADW+30,night?'#4a4858':'#d8d0c0'); seg(-3,0,'#a8a090'); seg(ROADW,ROADW+3,'#a8a090');
    seg(0,ROADW,asph);
    const cw=lv.inter.find(I=>d>I.d-34&&d<I.d-14||d>I.d+104&&d<I.d+124);
    if(cw){ for(let x=4;x<ROADW;x+=24) seg(x,x+13,'rgba(255,255,255,.88)'); continue; }
    if(lv.inter.some(I=>d>I.d-13&&d<I.d-8)) seg(144,ROADW,'#fff');
    seg(140,142.5,'#ffc020'); seg(145.5,148,'#ffc020'); seg(287,289.5,'rgba(255,255,255,.85)');
    if(Math.floor(d/22)%2===0){ seg(70.5,73.5,'rgba(255,255,255,.75)'); seg(214.5,217.5,'rgba(255,255,255,.75)'); }
    if(tgt&&Math.abs(d-tgt.d)<46) seg(288,ROADW,'rgba(134,220,79,'+(.3+.15*Math.sin(t*6))+')');
    for(const gs of lv.gas) if(Math.abs(d-gs.d)<46) seg(288,ROADW,'rgba(255,210,63,.22)'); }
  // 遠方霧氣
  const fog=c.createLinearGradient(0,hz,0,hz+26); fog.addColorStop(0,night?'rgba(20,20,50,.8)':'rgba(220,235,250,.7)'); fog.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=fog; c.fillRect(vx-40,hz,vw+80,26);
  // 地上的坑洞、水窪、機車道字
  const groundEll=(x,d,rx,col,stroke)=>{ const p=proj(x,d,0); if(!p||p[3]>700) return; c.fillStyle=col; c.beginPath(); c.ellipse(p[0],p[1],rx*p[2],rx*p[2]*camH/Math.max(8,p[3])*1.2+.5,0,0,7); c.fill(); if(stroke){ c.strokeStyle=stroke; c.lineWidth=1; c.stroke(); } };
  for(const pd2 of lv.puddles) groundEll(pd2.x,pd2.d,pd2.r,'rgba(140,180,230,.5)');
  for(const h of lv.holes) groundEll(h.x,h.d,h.r,'#1e1e26','#5a5a66');
  // 立起來的東西，由遠畫到近
  const B=[]; const add=(dz,fn)=>{ if(dz>9&&dz<1100) B.push([dz,fn]); }; // 已經在身旁的東西（被車頭擋住）就不畫，免得塞滿畫面
  for(const sg of lv.signs){ const d1=sg.d,d2=sg.d+sg.w*.9,dz=d1-cd; if(d2-cd<12||dz>1100) continue;
    add(Math.max(dz,10),()=>{ const xs=sg.side<0?-50:ROADW+50,n1=Math.max(d1,cd+3),hh=sg.h*1.5,a=proj(xs,n1,0),b=proj(xs,d2,0),a2=proj(xs,n1,hh),b2=proj(xs,d2,hh); if(!a||!b) return;
      c.fillStyle=night?'#3a3550':sg.col; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(a2[0],a2[1]); c.lineTo(b2[0],b2[1]); c.lineTo(b[0],b[1]); c.closePath(); c.fill(); c.strokeStyle='rgba(0,0,0,.2)'; c.lineWidth=1; c.stroke();
      // 窗戶
      c.fillStyle=night?(sg.lit<.6?'rgba(255,230,128,.9)':'rgba(80,70,110,.9)'):'rgba(255,255,255,.5)';
      for(let r2=0;r2<3;r2++) for(let q=0;q<3;q++){ const u1=.12+q*.3,u2=u1+.18,v1=.3+r2*.22,v2=v1+.12,P2=(u,v)=>{ const dd=lerp(n1,d2,u),pp=proj(xs,dd,hh*v); return pp; }; const p1=P2(u1,v1),p2=P2(u2,v1),p3=P2(u2,v2),p4=P2(u1,v2); if(!p1||!p2) continue;
        c.beginPath(); c.moveTo(p1[0],p1[1]); c.lineTo(p2[0],p2[1]); c.lineTo(p3[0],p3[1]); c.lineTo(p4[0],p4[1]); c.closePath(); c.fill(); }
      // 店面招牌（台灣直式）
      const sp=proj(sg.side<0?-36:ROADW+36,n1+6,0); if(sp&&sp[3]<600){ const sw=10*sp[2],sh=34*sp[2],sy0=sp[1]-62*sp[2]; c.fillStyle=sg.sc; if(night){ c.shadowColor=sg.sc; c.shadowBlur=12; } c.fillRect(sp[0]-sw/2,sy0,sw,sh); c.shadowBlur=0;
        if(sw>6){ c.fillStyle='#fff'; c.font='900 '+Math.round(sw*.75)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; [...sg.txt].slice(0,3).forEach((ch,i)=>c.fillText(ch,sp[0],sy0+sh*(.2+i*.3))); } } }); }
  // 店家、客人、加油站
  for(const s2 of lv.stops){ const dz=s2.d-cd; if(dz<40) continue; add(dz,()=>{ const p=proj(ROADW+42,s2.d,0); if(!p) return; const isT=s2===tgt,isG=s2.kind==='gas',w2=60*p[2],h2=50*p[2];
      c.fillStyle=isG?'#e23b3b':s2.kind==='shop'?'#ff7a3d':'#4f9dff'; rr(c,p[0]-w2/2,p[1]-h2-26*p[2],w2,h2,6*p[2]); c.fill(); c.strokeStyle='#1a1530'; c.lineWidth=Math.max(1,p[2]*.6); c.stroke();
      if(w2>30){ c.fillStyle='#fff'; c.font='900 '+Math.round(w2*.16)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(isG?'⛽ 加油':s2.kind==='shop'?'🍱 取餐':'🏠 送達',p[0],p[1]-h2*.75-26*p[2]); c.font='700 '+Math.round(w2*.13)+'px '+TC; c.fillText(s2.name,p[0],p[1]-h2*.4-26*p[2]); }
      if(isT){ const ay=p[1]-h2-40*p[2]-Math.abs(Math.sin(t*5))*8; c.fillStyle='#86dc4f'; c.beginPath(); c.moveTo(p[0]-12,ay-14); c.lineTo(p[0]+12,ay-14); c.lineTo(p[0],ay); c.fill(); }
      if(s2.kind==='cus'&&isT) pedFront(c,proj(ROADW+18,s2.d,0)[0],p[1],p[2],'#ffd23f','#4a2a1a',t); }); }
  // 公車站牌
  for(const b2 of lv.busStops) add(b2.d-cd,()=>{ const p=proj(ROADW+10,b2.d,0); if(!p) return; c.fillStyle='#555'; c.fillRect(p[0]-1.5*p[2],p[1]-50*p[2],3*p[2],50*p[2]); c.fillStyle='#2f6fd0'; c.fillRect(p[0]-7*p[2],p[1]-56*p[2],14*p[2],12*p[2]); });
  // 紅綠燈（台灣有倒數秒數）＋照相機
  for(const I of lv.inter){ const dz=I.d-10-cd; add(dz,()=>{ const Lg=lightOf(I,simT),p=proj(ROADW+14,I.d-10,0),arm=proj(200,I.d-10,62); if(!p||!arm) return;
      c.fillStyle='#3a3a44'; c.fillRect(p[0]-1.6*p[2],p[1]-64*p[2],3.2*p[2],64*p[2]); c.fillRect(Math.min(arm[0],p[0]),arm[1]-1.2*p[2],Math.abs(arm[0]-p[0]),2.4*p[2]);
      const bx=arm[0],by=arm[1]; c.fillStyle='#222'; rr(c,bx-15*p[2],by,30*p[2],10*p[2],2*p[2]); c.fill();
      [['r','#ff3030'],['y','#ffc020'],['g','#30e060']].forEach(([k2,col],i)=>{ c.fillStyle=Lg.col===k2?col:'#3a3a3a'; if(Lg.col===k2){ c.shadowColor=col; c.shadowBlur=10; } c.beginPath(); c.arc(bx+(i-1)*9*p[2]*M,by+5*p[2],3.6*p[2],0,7); c.fill(); c.shadowBlur=0; });
      if(S.pal==='tw'){ c.fillStyle='#111'; rr(c,bx+16*p[2]*M-7*p[2],by,14*p[2],10*p[2],1.5*p[2]); c.fill(); c.fillStyle=Lg.col==='g'?'#30e060':Lg.col==='y'?'#ffc020':'#ff3030'; c.font='900 '+Math.max(5,Math.round(8*p[2]))+'px monospace'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(Math.ceil(Lg.left)).padStart(2,'0'),bx+16*p[2]*M,by+5.5*p[2]); }
      if(I.cam){ c.fillStyle='#ffd23f'; rr(c,p[0]-6*p[2],p[1]-46*p[2],12*p[2],9*p[2],2*p[2]); c.fill(); c.fillStyle='#222'; c.beginPath(); c.arc(p[0],p[1]-41.5*p[2],2.6*p[2],0,7); c.fill(); }
      // 路口對面的另一支燈
      const q=proj(-14,I.d+100,0); if(q){ c.fillStyle='#3a3a44'; c.fillRect(q[0]-1.4*q[2],q[1]-60*q[2],2.8*q[2],60*q[2]); } }); }
  // 停在路邊的車、攤販、陣頭、白煙
  for(const pk of lv.parked) add(pk.d-26-cd,()=>{ const p=proj(LANE[4]+6,pk.d-26,0); if(!p) return; vehBack(c,p[0],p[1],p[2],{k:'car',w:28,col:pk.col},false,t);
      if(pk.door>0){ const q=proj(LANE[4]-8,pk.d-18,0); if(q){ c.fillStyle=pk.col; const dw=12*q[2]*pk.door; c.fillRect(M>0?q[0]-dw:q[0],q[1]-17*q[2],dw,13*q[2]); c.strokeStyle='#222'; c.lineWidth=1; c.strokeRect(M>0?q[0]-dw:q[0],q[1]-17*q[2],dw,13*q[2]); } } });
  for(const sl of lv.stalls) add(sl.d-sl.len/2-cd,()=>{ const p=proj(LANE[4]-4,sl.d-sl.len/2,0); if(!p) return; const w2=40*p[2],h2=30*p[2]; c.fillStyle='#6a4a2a'; c.fillRect(p[0]-w2/2,p[1]-h2,w2,h2);
      for(let i=0;i<4;i++){ c.fillStyle=i%2?'#fff':sl.col; c.fillRect(p[0]-w2*.6+i*w2*.3,p[1]-h2*1.35,w2*.3,h2*.35); } c.fillStyle='#ffd23f'; c.beginPath(); c.arc(p[0],p[1]-h2*1.5,4*p[2],0,7); c.fill(); });
  if(lv.parade){ const pdd=lv.parade.d0+lv.parade.v*Math.max(0,simT); for(let i=0;i<10;i++){ const x=LANE[3]+(i%3)*30-10,d=pdd-lv.parade.len/2+i*13; add(d-cd,()=>{ const p=proj(x,d,0); if(!p) return; pedFront(c,p[0],p[1],p[2]*1.15,['#e23b3b','#ffd23f','#2a9d5c'][i%3],'#222',t,i); if(i%3===0){ c.fillStyle='#e23b3b'; c.fillRect(p[0]+4*p[2],p[1]-52*p[2],12*p[2],16*p[2]); c.fillStyle='#333'; c.fillRect(p[0]+3*p[2],p[1]-52*p[2],1.5*p[2],52*p[2]); } }); } }
  for(const s3 of lv.steam) add(s3.d-cd,()=>{ const a=.35+.3*Math.sin(t*1.5+s3.ph); if(a<.2) return; const p=proj(s3.x,s3.d,0); if(!p) return; c.fillStyle='rgba(240,240,245,'+a+')'; for(let i=0;i<4;i++){ c.beginPath(); c.arc(p[0]+Math.sin(t+i)*10*p[2],p[1]-i*12*p[2],(16+i*6)*p[2],0,7); c.fill(); } });
  // 車流
  for(const e of lv.veh){ const near=e.d-e.h/2; add(near-cd,()=>{ const p=proj(e.x,near,0); if(!p) return; vehBack(c,p[0],p[1],p[2],Object.assign({night},e),e.dir<0,t); }); }
  const cr=[]; for(const I of lv.inter) if(I.d-cd<1100&&I.d+130-cd>0){ crossers(lv,I,simT,cr); crossPeds(lv,I,simT,cr); }
  for(const e of cr){ const near=e.k==='ped'?e.d:e.d-e.w/2; add(near-cd,()=>{ const p=proj(e.x,near,0); if(!p) return;
      if(e.k==='ped'){ pedFront(c,p[0],p[1],p[2],e.col,'#3a2a1a',simT,e.x); return; }
      if(e.warn){ const q=proj(e.horiz>0?-20:ROADW+20,near,30); if(q){ c.fillStyle='#ff3030'; c.font='900 '+Math.round(30*q[2])+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('！',q[0],q[1]); } return; }
      vehSide(c,p[0],p[1],p[2],e,e.horiz*M); }); }
  for(const l of st.locals||[]) add(l.d-cd,()=>{ const p=proj(l.x,l.d,0); if(!p) return; if(l.k==='dog') dogSide(c,p[0],p[1],p[2],t,Math.sign(l.vx)*M); else pedFront(c,p[0],p[1],p[2],l.col,'#3a2a1a',t,l.d); });
  // 其他外送員
  for(const r of st.riders||[]) add(r.d-cd,()=>{ const p=proj(r.x,r.d,0); if(!p) return; c.save(); if(r.ghost) c.globalAlpha=.75;
      vehBack(c,p[0],p[1],p[2],{k:'scoot',w:16,col:r.look.bike,helm:r.look.helmet,shirt:r.look.shirt,box:r.look.box},false,t); c.restore();
      if(r.name&&p[3]<500){ c.font='900 12px '+TC; const w2=c.measureText(r.name).width+12; c.fillStyle='rgba(11,10,28,.75)'; rr(c,p[0]-w2/2,p[1]-40*p[2]-20,w2,18,9); c.fill(); c.fillStyle='#fff'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(r.name,p[0],p[1]-40*p[2]-11); } });
  B.sort((a,b)=>b[0]-a[0]); for(const [,fn] of B) fn();
  c.restore(); }

/* ---------- 遊戲 ---------- */
function create(env,opts){
  const net=opts.net,two=!net&&opts.mode==='2p',num=net?net.count:two?2:1,me=net?net.me:0,si=clamp(opts.stage||0,0,STAGES.length-1),S=STAGES[si];
  const seed=net?(Number(net.seed)>>>0)||7:Math.floor(Math.random()*1e9),lv=buildLevel(si,seed),M=S.left?-1:1;
  const {ctx:c}=env.canvas2d(W,H);
  const ALT=[{char:'boy',helmet:'#ffd23f',shirt:'#2f8a5a',bike:'#e23b3b',box:'#ff7a3d'},{char:'girl',helmet:'#ff7eb6',shirt:'#4f9dff',bike:'#f0f0e8',box:'#3ddbd9'},{char:'cat',helmet:'#b98cff',shirt:'#ffd23f',bike:'#2b2b36',box:'#ff5d8f'},{char:'bear',helmet:'#c8935a',shirt:'#ff9d3d',bike:'#2f6fd0',box:'#86dc4f'}];
  const names=[]; for(let i=0;i<num;i++) names.push(net?(net.names&&net.names[i])||'玩家'+(i+1):two?(i+1)+'P':(opts.name||'你'));
  const ps=[]; for(let n=0;n<num;n++){ const look=Object.assign({},ALT[n%4],(net?net.looks&&net.looks[n]:n===0?opts.look:null)||{});
    ps.push({n,x:LANE[4]-14+(n%2)*-30-Math.floor(n/2)*10,d:60-n*46,wasIn:false,v:0,vx:0,fall:0,inv:0,look,remote:!!net&&n!==me,tx:0,td:0,
      oi:0,phase:'pick',stopT:0,food:3,fuel:100,deadline:0,money:{fee:0,tip:0,fine:0,gas:0,late:0,comp:0},done:false,doneT:0,log:[],lean:0,gust:0,lastD:60-n*46,warned:{}}); }
  let t=-3,simT=0,acc=0,ended=false,sendT=0,windT=0,windF=0,windDir=1,camD=[0,0],fx=[],introT=0,goSaid=false,endT=0,engine=null;
  const total=p=>p.money.fee+p.money.tip-p.money.fine-p.money.gas-p.money.late-p.money.comp;
  const order=p=>lv.orders[p.oi];
  function startOrder(p){ const o=order(p); if(!o){ p.done=true; p.doneT=t; return; } p.phase='pick'; p.food=3; p.deadline=t+((o.cus.d-p.d)/150)*1.5+18; }
  ps.forEach(startOrder); ps.forEach(p=>{ p.tx=p.x; p.td=p.d; });
  const pop=(p,txt,col)=>fx.push({k:'txt',x:p.x,d:p.d+30,txt,col,t:0,n:p.n});

  // 引擎聲（只有自己／1P）
  try{ const ac=env.audio(),out=env.out(); if(ac&&out){ const o=ac.createOscillator(),f=ac.createBiquadFilter(),g=ac.createGain(); o.type='sawtooth'; f.type='lowpass'; f.frequency.value=500; g.gain.value=0; o.connect(f); f.connect(g); g.connect(out); o.start(); engine={o,g,ac}; } }catch(e){}

  // 按鍵：1P 方向鍵（單人時 WASD 也可以）、2P 用 WASD
  function input(p){ const k=env.keys; let L,R,U,D;
    if(two){ if(p.n===0){ L=k.ArrowLeft; R=k.ArrowRight; U=k.ArrowUp; D=k.ArrowDown; } else { L=k.KeyA; R=k.KeyD; U=k.KeyW; D=k.KeyS; } }
    else { L=k.ArrowLeft||k.KeyA; R=k.ArrowRight||k.KeyD; U=k.ArrowUp||k.KeyW; D=k.ArrowDown||k.KeyS; }
    return {dir:((R?1:0)-(L?1:0))*M,gas:!!U,brake:!!D}; }

  function crash(p,why){ if(p.inv>0||p.fall>0) return; p.fall=1.3; p.inv=2.6; p.v=0; env.sfx('hurt'); env.sfx('bump');
    const carry=p.phase==='drop'; if(carry) p.food--; fx.push({k:'star',x:p.x,d:p.d,t:0}); pop(p,why+(carry?'　餐點 -1':''),'#ff8a8a');
    if(carry&&p.food<=0){ p.money.comp+=80; p.log.push('餐點翻了，賠償 $80'); setTimeout(()=>pop(p,'餐點全毀！賠 $80','#ff5d5d'),500); p.oi++; startOrder(p); } }
  function rectHit(p,x,d,w,h){ return Math.abs(p.x-x)<(w+12)/2&&Math.abs(p.d-d)<(h+28)/2; }
  // 自己附近才出現的突發狀況：亂穿越的行人、狗、開車門
  const locals=[];
  function localHazards(p,dt){
    if(p.remote) return;
    if(Math.random()<dt*S.jay*.35&&p.v>60){ const side=Math.random()<.5?1:-1; locals.push({k:'ped',x:side>0?-30:ROADW+30,d:p.d+230+Math.random()*120,vx:side*(40+Math.random()*25),col:CAR_COL[Math.floor(Math.random()*8)],face:side>0?Math.PI/2:-Math.PI/2,n:p.n}); }
    if(S.dog&&Math.random()<dt*S.dog*.25&&p.v>60){ const side=Math.random()<.5?1:-1; locals.push({k:'dog',x:side>0?-20:ROADW+20,d:p.d+220+Math.random()*100,vx:side*(80+Math.random()*40),face:side>0?Math.PI/2:-Math.PI/2,n:p.n,wig:Math.random()*6}); }
    for(const pk of lv.parked){ if(pk.trig&&!pk.done&&pk.d-p.d>60&&pk.d-p.d<150&&Math.abs(p.x-LANE[4])<70){ pk.done=true; pk.doorT=2.4; env.sfx('beep'); } }
  }

  function updatePlayer(p,dt){
    if(p.remote){ const f=Math.min(1,dt*12); p.x+=(p.tx-p.x)*f; p.d+=(p.td-p.d)*f; return; }
    if(p.done){ p.v=Math.max(0,p.v-200*dt); p.d+=p.v*dt; return; }
    if(p.inv>0) p.inv-=dt;
    if(p.fall>0){ p.fall-=dt; return; }
    const I=input(p),rain=!!S.rain,vmax=p.fuel>0?250:55;
    if(t<0){ return; }
    if(I.gas) p.v=Math.min(vmax,p.v+(p.v<0?260:150)*dt);
    else if(I.brake){ if(p.v>0) p.v=Math.max(0,p.v-(rain?170:270)*dt); else p.v=Math.max(-55,p.v-60*dt); } // 停下來再按 ↓ 可以慢慢倒車
    else p.v+=(p.v>0?-Math.min(p.v,55*dt):Math.min(-p.v,80*dt));
    const steer=I.dir*150*(.45+.55*Math.min(1,Math.abs(p.v)/150));
    p.vx=rain?lerp(p.vx,steer,Math.min(1,dt*3)):steer;
    // 風、水窪
    let push=0; if(S.wind&&windT>0) push=windDir*windF;
    let inP=false; for(const pd of lv.puddles) if(Math.hypot(p.x-pd.x,(p.d-pd.d)*.6)<pd.r&&p.v>40){ inP=true; p.vx+=(Math.random()-.5)*400*dt; } if(inP&&!p.wasIn) env.sfx('pop'); p.wasIn=inP;
    p.x=clamp(p.x+(p.vx+push)*dt,10,ROADW-10); p.lean=lerp(p.lean,I.dir*M,Math.min(1,dt*8));
    const lastD=p.d; p.d=Math.max(-40,Math.min(lv.L+200,p.d+p.v*dt));
    p.fuel=Math.max(0,p.fuel-Math.abs(p.d-lastD)*.0075); if(p.fuel<=0&&!p.noFuel){ p.noFuel=1; pop(p,'沒油了！慢慢推去加油站','#ffd23f'); env.sfx('trap'); }
    // 路口：闖紅燈拍照
    for(const I2 of lv.inter){ const sl=I2.d-10; if(lastD<sl&&p.d>=sl){ const L2=lightOf(I2,simT); if(L2.col==='r'&&I2.cam&&L2.p>Y_END+.4){ p.money.fine+=300; p.log.push('闖紅燈被拍，罰單 $300'); pop(p,'📸 闖紅燈！罰 $300','#ff5d5d'); env.sfx('trap'); fx.push({k:'flash',t:0,n:p.n}); } } }
    // 坑洞
    for(const h of lv.holes) if(Math.hypot(p.x-h.x,p.d-h.d)<h.r+5&&!h.hit){ h.hit=1; if(p.v>140){ p.v*=.6; if(p.phase==='drop'&&p.inv<=0){ if(p.food>1){ p.food--; pop(p,'坑洞！湯灑出來了','#ffb36b'); env.sfx('bump'); } else crash(p,'坑洞'); } } else env.sfx('land'); }
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
        if(busyStop.kind==='gas'){ const cost=Math.round((100-p.fuel)*1.3); p.money.gas+=cost; p.fuel=100; p.noFuel=0; pop(p,'加滿油 -$'+cost,'#ffd23f'); env.sfx('heal'); }
        else if(p.phase==='pick'){ p.phase='drop'; pop(p,'取到餐了！','#86dc4f'); env.sfx('item'); }
        else { const late=t>p.deadline,fee=o.fee; p.money.fee+=fee; let tip=0; if(!late){ tip=Math.round((p.deadline-t)*.8)+(p.food>=3?15:0); p.money.tip+=tip; }
          if(late){ p.money.late+=Math.round(fee/2); p.log.push('超時，扣 $'+Math.round(fee/2)); }
          pop(p,late?'送達（超時扣一半）+$'+(fee-Math.round(fee/2)):'送達！+$'+fee+(tip?'　小費 $'+tip:''),late?'#ffb36b':'#86dc4f'); env.sfx(late?'land':'lap'); p.oi++; startOrder(p); } } }
    else p.stopT=0;
  }

  // 連線：每個人只算自己，位置和收入傳給別人；房主決定什麼時候結束
  const pack=p=>[p.n,Math.round(p.x),Math.round(p.d),Math.round(p.v),p.fall>0?1:0,total(p),p.done?1:0,p.oi,p.food,p.lean.toFixed(2)];
  function apply(a){ const p=ps[a[0]]; if(!p||!p.remote) return; p.tx=a[1]; p.td=a[2]; p.v=a[3]; p.fall=a[4]?.5:0; p.netMoney=a[5]; p.done=!!a[6]; p.oi=a[7]; p.food=a[8]; p.lean=+a[9]; }
  if(net){ net.onmsg=m=>{ if(m.k) apply(m.k); if(m.ks) for(const a of m.ks) if(a[0]!==me) apply(a); if(m.end) conclude(m.end); };
    net.onleave=i=>{ const p=ps[i]; if(p){ p.done=true; p.left=true; names[i]+='（離開）'; } }; }
  const moneyOf=p=>p.remote?(p.netMoney||0):total(p);

  function conclude(list){
    if(ended) return; ended=true; if(engine){ try{ engine.g.gain.value=0; }catch(e){} }
    const mine=ps[me],net$=list?list[me]:total(mine),stars=net$>=S.target?3:net$>=S.target*.7?2:net$>=S.target*.4?1:0;
    try{ const k='arcade.deliver.b.'+si,old=parseInt(localStorage.getItem(k),10); if(!two&&!net&&(isNaN(old)||net$>old)) localStorage.setItem(k,net$); }catch(e){}
    const m=mine.money,row=(a,b,col)=>'<tr><td>'+a+'</td><td style="text-align:right;color:'+col+'">'+b+'</td></tr>';
    let html='<table class="ls">'+row('外送費','+$'+m.fee,'#86dc4f')+row('小費','+$'+m.tip,'#86dc4f')+row('油錢','-$'+m.gas,'#ff8a8a')+row('罰單','-$'+m.fine,'#ff8a8a')+row('超時扣款','-$'+m.late,'#ff8a8a')+row('餐點賠償','-$'+m.comp,'#ff8a8a')+'</table>';
    let title=stars?'收工！'+'★'.repeat(stars)+'☆'.repeat(3-stars):'今天白跑了…',text='淨收入 $'+net$+'（目標 $'+S.target+'）';
    if(num>1){ const L2=ps.map((p,i)=>[names[i],list?list[i]:moneyOf(p)]).sort((a,b)=>b[1]-a[1]);
      html='<table class="ls"><tr><th>名次</th><th>外送員</th><th>淨收入</th></tr>'+L2.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+r[0]+'</td><td>$'+r[1]+'</td></tr>').join('')+'</table>'+(two?'':html);
      title=L2[0][0]===names[me]&&!two?'你是外送王！':L2[0][0]+' 是外送王！'; }
    env.sfx(stars||num>1?'win':'lose'); env.end({title,big:'$'+net$,html,text,score:two||net?null:net$,next:false});
  }

  function update(dt){
    if(ended) return; dt=Math.min(dt,.05);
    const was=t; t+=dt; introT+=dt;
    if(was<-2&&t>=-2||was<-1&&t>=-1||was<0&&t>=0) env.sfx(t>=0?'go':'beep');
    if(t>0){ acc+=dt; while(acc>=SIM){ acc-=SIM; simT+=SIM; simStep(lv,simT); } }
    for(const pk of lv.parked) if(pk.doorT>0){ pk.doorT-=dt; pk.door=Math.min(1,pk.door+dt*4); } else if(pk.door>0) pk.door=Math.max(0,pk.door-dt*3);
    if(S.wind&&t>0){ windT-=dt; if(windT<-4-Math.random()*4){ windT=2.2; windDir=Math.random()<.5?-1:1; windF=70+Math.random()*50; env.sfx('boost'); } }
    for(const p of ps){ localHazards(p,dt); updatePlayer(p,dt); }
    for(let i=locals.length-1;i>=0;i--){ const l=locals[i]; l.x+=l.vx*dt; if(l.k==='dog') l.d+=Math.sin(t*5+l.wig)*30*dt; if(l.x<-80||l.x>ROADW+80) locals.splice(i,1); }
    for(let i=fx.length-1;i>=0;i--){ fx[i].t+=dt; if(fx[i].t>2) fx.splice(i,1); }
    // 闖紅燈機車的喇叭警告
    const own=ps[me]; for(const I of lv.inter){ if(Math.abs(I.d-own.d)>420) continue; const cr=[]; crossers(lv,I,simT,cr); for(const e of cr) if(e.k==='runner'&&e.warn){ const key=I.idx+':'+Math.floor((simT+I.off)/CYC); if(!own.warned[key]){ own.warned[key]=1; env.sfx('beep'); env.sfx('beep'); } } }
    if(engine&&!ps[me].remote){ const v=Math.abs(ps[me].v); try{ engine.o.frequency.setTargetAtTime(55+v*.55,engine.ac.currentTime,.05); engine.g.gain.setTargetAtTime(t>-3&&!ps[me].done?.018+v/250*.03:0,engine.ac.currentTime,.1); }catch(e){} }
    for(let n=0;n<num;n++){ const p=ps[n]; camD[n]=camD[n]===0&&t<-2.9?p.d:lerp(camD[n]||p.d,p.d+Math.max(0,p.v)*.35,Math.min(1,dt*4)); }
    // 時間到（每單 80 秒）也收工
    const limit=S.orders*80+20; if(t>limit) for(const p of ps) if(!p.remote&&!p.done){ p.done=true; p.log.push('下班時間到'); }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/15; if(net.host) net.send({ks:ps.map(pack)}); else net.send({k:pack(ps[me])}); }
      if(net.host){ const all=ps.every(p=>p.done); const first=Math.min(...ps.filter(p=>p.done&&!p.left).map(p=>p.doneT||t),1e9);
        if(all||t-first>45){ endT+=dt; if(endT>1.5){ const list=ps.map(moneyOf); net.send({ks:ps.map(pack)}); net.send({end:list}); conclude(list); } } } }
    else if(ps.every(p=>p.done)){ endT+=dt; if(endT>1.6) conclude(null); }
  }

  /* ----- 畫面 ----- */
  function view(vx,vw,n){
    const p=ps[n],o=order(p),tgt=o&&!p.done?(p.phase==='pick'?o.shop:o.cus):null,shake=p.fall>0?Math.sin(t*60)*4*p.fall:0;
    c.save(); c.translate(shake,0);
    const riders=ps.filter(q=>q!==p).map(q=>({x:q.x,d:q.d,look:q.look,name:num>1?names[q.n]:'',ghost:!!net}));
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
    if(S.wind&&windT>0){ c.fillStyle='rgba(255,255,255,.75)'; c.font='900 22px '+TC; c.textAlign='center'; c.fillText(windDir*M>0?'強風 →→→':'←←← 強風',vx+vw/2,96); c.strokeStyle='rgba(255,255,255,.4)'; c.lineWidth=2; c.beginPath(); for(let i=0;i<10;i++){ const y=(i*61)%H,x=vx+((t*600*windDir*M+i*140)%vw+vw)%vw; c.moveTo(x,y); c.lineTo(x-40*windDir*M,y); } c.stroke(); }
    if(S.night){ const g=c.createRadialGradient(vx+vw/2,H*.62,40,vx+vw/2,H*.62,vw*.7); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(5,5,25,.45)'); c.fillStyle=g; c.fillRect(vx,0,vw,H); }
    else if(S.evening){ c.fillStyle='rgba(255,120,60,.07)'; c.fillRect(vx,0,vw,H); }
    // 自己的機車
    drawCockpit(c,vx,vw,p.look,p.v,p.lean,t,mL,mR,p.fuel,S.night);
    if(p.fall>0){ c.fillStyle='rgba(255,60,60,'+Math.min(.35,p.fall*.3)+')'; c.fillRect(vx,0,vw,H); for(let i=0;i<5;i++){ const a=t*5+i*1.26; c.fillStyle='#ffd23f'; c.font='22px sans-serif'; c.textAlign='center'; c.fillText('★',vx+vw/2+Math.cos(a)*90,H*.42+Math.sin(a)*30); } }
    // 取餐／送餐進度
    if(p.stopT>0){ const w2=160; c.fillStyle='rgba(11,10,28,.8)'; rr(c,vx+vw/2-w2/2-6,H*.6-6,w2+12,30,10); c.fill(); c.fillStyle='#3a3670'; rr(c,vx+vw/2-w2/2,H*.6+8,w2,10,5); c.fill(); c.fillStyle='#86dc4f'; rr(c,vx+vw/2-w2/2,H*.6+8,w2*p.stopT/.8,10,5); c.fill();
      c.fillStyle='#fff'; c.font='900 11px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(p.phase==='pick'?'取餐中…':'送餐中…',vx+vw/2,H*.6); }
    // 飄字（畫面中間往上飄）
    let k2=0; for(const f of fx){ if(f.k==='txt'&&f.n===n){ c.globalAlpha=Math.max(0,1-f.t/2); c.fillStyle=f.col; c.font='900 18px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.strokeStyle='#1a1530'; c.lineWidth=5; const y=H*.34-f.t*26+k2*24; c.strokeText(f.txt,vx+vw/2,y); c.fillText(f.txt,vx+vw/2,y); c.globalAlpha=1; k2++; }
      if(f.k==='flash'&&f.n===n&&f.t<.3){ c.fillStyle='rgba(255,255,255,'+(.8-f.t*2.6)+')'; c.fillRect(vx,0,vw,H); } }
    if(two){ c.fillStyle=n===0?'#ffd23f':'#3ddbd9'; c.font='900 16px '+TC; c.textAlign='left'; c.fillText((n+1)+'P',vx+12,74); }
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
    else { c.fillStyle='#ffd23f'; c.font='900 15px '+TC; c.fillText(p.done?'收工了！'+(ps.some(q=>!q.done)?'等其他人…':''):'',vx+110,32); }
    // 油量
    const fx0=vx+vw-(small?78:88); c.fillStyle='#fff'; c.font='700 11px '+TC; c.textAlign='left'; c.fillText('油',fx0-16,44); c.fillStyle='#3a3670'; rr(c,fx0,38,small?62:72,12,5); c.fill(); c.fillStyle=p.fuel<20?'#ff5d5d':'#ffd23f'; rr(c,fx0,38,(small?62:72)*p.fuel/100,12,5); c.fill();
    c.fillStyle='#fff'; c.textAlign='right'; c.font='700 11px '+TC; c.fillText(Math.round(Math.abs(p.v)/250*60)+' km/h',vx+vw-16,22);
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
  drawCockpit(ctx,0,W,{bike:'#e23b3b',shirt:'#2f8a5a'},150,lean,t,[],[],80); ctx.restore();
  const k=w/480; ctx.fillStyle='rgba(11,10,28,.75)'; rr(ctx,8,8,w*.62,34*k,10); ctx.fill(); ctx.fillStyle='#ffd23f'; ctx.font='900 '+Math.round(17*k)+'px '+TC; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(S.name+'　'+'★'.repeat(S.stars),18,8+17*k);
}
function thumb(ctx,w,h,t){
  stageShow(ctx,w,h,0,t);
  ctx.fillStyle='rgba(11,10,28,.35)'; ctx.fillRect(0,0,w,h);
  const k=w/480; drawRiderFront(ctx,w*.5,h*.58,k*1.35,{char:'boy',helmet:'#ffd23f',shirt:'#2f8a5a',bike:'#e23b3b',box:'#ff7a3d'},t);
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.14)+'px '+TC; ctx.lineWidth=7; ctx.strokeStyle='#1a1530'; ctx.strokeText('街頭外送王',w/2,h*.16); ctx.fillStyle='#ffd23f'; ctx.fillText('街頭外送王',w/2,h*.16);
}
function preview(ctx,w,h,L,t){
  ctx.fillStyle='#c9b8a0'; ctx.fillRect(0,0,w,h); ctx.fillStyle='#44444e'; ctx.fillRect(w*.58,0,w*.34,h); ctx.fillStyle='#ffc020'; ctx.fillRect(w*.6,0,4,h);
  const k=w/480; drawRiderFront(ctx,w*.3,h*.62,k*1.6,L,t); drawRiderTop(ctx,w*.76,h*.55,k*2.2,L,Math.sin(t*1.5),t,1,0);
}

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).deliver={
  name:'街頭外送王',tag:'STREET DELIVERY',color:'#ff7a3d',online:true,maxPlayers:4,
  desc:'騎機車在台灣和世界各地街頭送外送：取餐、送餐、躲開闖紅燈的機車和亂穿越的行人，扣掉油錢罰單看淨賺多少。',
  goal:'到店家取餐、送到客人手上：在機車道停下來就會自動取餐／送達。越快送到小費越多；撞車會把餐點撞壞，闖紅燈遇到照相機會吃罰單，油用完要去加油站。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人'}],
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  stageGoal:si=>{ const S=STAGES[si]; return S.name+'：'+S.desc+'這一趟要送 '+S.orders+' 單，淨收入 $'+S.target+' 以上拿三顆星。到店家門口的機車道停下來取餐，再送到客人門口；越快送到小費越多，撞車會撞壞餐點（全毀要賠錢），闖紅燈遇到照相機罰 $300，油用完要去加油站加。'; },
  stageBest:i=>{ try{ const v=localStorage.getItem('arcade.deliver.b.'+i); return v==null?'':'最高 $'+v; }catch(e){ return ''; } },
  help:[['← →','左右移動（雙人時是 1P）'],['↑','加油門'],['↓','煞車；停下來再按是倒車'],['W A S D','雙人時 2P 的油門、方向、煞車'],['停在綠框裡','取餐、送餐、加油（在機車道停一下）']],
  touchHelp:[['◀ ▶','左右移動'],['▲','加油門'],['▼','煞車；停下來再按是倒車'],['停在綠框裡','取餐、送餐、加油（在機車道停一下）']],
  touch:m=>m==='2p'?{left:[{l:'◀',c:'KeyA'},{l:'▶',c:'KeyD'},{l:'▲',c:'KeyW',act:true},{l:'▼',c:'KeyS'}],right:[{l:'◀',c:'ArrowLeft'},{l:'▶',c:'ArrowRight'},{l:'▲',c:'ArrowUp',act:true},{l:'▼',c:'ArrowDown'}]}
    :{left:[{l:'◀',c:'ArrowLeft'},{l:'▶',c:'ArrowRight'}],right:[{l:'▼',c:'ArrowDown'},{l:'▲',c:'ArrowUp',act:true}]},
  best:{label:'最高收入',fmt:v=>'$'+v,lower:false},
  looks:[{key:'char',label:'人物',opts:[{id:'boy',label:'男孩'},{id:'girl',label:'女孩'},{id:'cat',label:'貓耳'},{id:'bear',label:'熊熊'}]},
    {key:'helmet',label:'安全帽',type:'color',opts:['#ffd23f','#ff7eb6','#b98cff','#3ddbd9','#ffffff','#2b2b36','#ff5d4f','#86dc4f']},
    {key:'shirt',label:'衣服',type:'color',opts:['#2f8a5a','#4f9dff','#ffd23f','#ff9d3d','#e23b3b','#7a4ac8','#2b2b36','#f0f0e8']},
    {key:'bike',label:'機車',type:'color',opts:['#e23b3b','#f0f0e8','#2b2b36','#2f6fd0','#86dc4f','#ff7eb6','#f5a623','#9aa0a8']},
    {key:'box',label:'外送箱',type:'color',opts:['#ff7a3d','#3ddbd9','#ff5d8f','#86dc4f','#ffd23f','#7a4ac8','#2f6fd0','#e23b3b']}],
  stageShow,thumb,preview,create
};
})();
