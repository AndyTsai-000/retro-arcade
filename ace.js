// 蒼穹王牌：3D 追尾視角空戰。鏡頭跟在飛機後面，在群島、峽谷、雪山、雷雨和極光夜空裡跟敵機纏鬥。
// 機槍對準敵機就自動開火；導彈鍵發射追蹤導彈、閃避鍵翻滾＋灑熱焰彈甩掉來襲導彈。打下指定數量的敵機後王牌出現，打下王牌就過關。
// 雙人：上下分割畫面一起合作；連線時房主算敵機和傷害，每個人自己算自己的飛行（比較跟手）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PI=Math.PI,TAU=PI*2,LIVES=3,SPD=150,BOUND=2300;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k,r1=v=>Math.round(v*10)/10,r3=v=>Math.round(v*1000)/1000;
function mul(seed){ let a=seed>>>0||1; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function shade(hex,k){ const n=parseInt(hex.slice(1),16); let r=n>>16,g=n>>8&255,b=n&255; const f=v=>clamp(Math.round(k>0?v+(255-v)*k:v*(1+k)),0,255); return 'rgb('+f(r)+','+f(g)+','+f(b)+')'; }
const THREE_URL='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
function load(){ const K=window.ARCADE_GAMES&&window.ARCADE_GAMES.kart; if(window.THREE) return Promise.resolve(); if(K&&K.load) return K.load();
  return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=THREE_URL; s.onload=()=>res(); s.onerror=()=>{ s.remove(); rej(new Error('three')); }; document.head.appendChild(s); }); }
// 50 關：名稱、場景、王牌名字、王牌顏色、王牌機種（最後一關固定是天際決戰）
const AS=[['晴空海峽','sea','銀翼','#c8d0dc','jet'],['翡翠群島','isle','紅隼','#e04a3a','prop'],['黃昏峽谷','canyon','赤狐','#ff7a2a','jet'],['沙丘風暴','desert','沙暴','#d8a040','prop'],['雪峰冰原','ice','白狼','#e8f0ff','jet'],
  ['雷暴前線','storm','雷公','#6a7a90','stealth'],['火山熔岩','volcano','炎魔','#c8202a','jet'],['極光夜航','night','夜鴉','#3a3a4a','stealth'],['颶風之眼','typhoon','風神','#3ddbd9','jet'],
  ['楓紅山谷','autumn','楓葉','#d8502a','prop'],['熱帶雨林','jungle','翠蛇','#3a8a3a','jet'],['珊瑚環礁','reef','海燕','#3ac8e8','prop'],['晨曦海岸','seaDawn','曙光','#ffb07a','jet'],['紫霞峽谷','canyonDusk','紫鳶','#a85ad8','stealth'],
  ['冰河峽灣','fjord','冰隼','#a8d8f0','jet'],['月夜沙海','desertNight','月狐','#c8b88a','prop'],['薄霧群島','isleFog','霧鷹','#9aa8b8','jet'],['黃金麥田','farm','麥穗','#e8c040','prop'],['極地暴雪','blizzard','雪鴞','#f0f4ff','stealth'],
  ['夕陽海峽','seaDusk','落日','#ff7a3a','jet'],['翡翠夜島','isleNight','螢火','#7aff8a','stealth'],['赤岩高原','mesa','赤鷲','#c8502a','jet'],['雷雨群島','isleStorm','雷鳥','#8a9ab8','jet'],['櫻花山脈','sakura','櫻吹雪','#ff8ab8','prop'],
  ['熔岩之夜','volcanoNight','冥火','#ff3a1a','stealth'],['北極光海','auroraSea','極光','#3dffb0','jet'],['沙塵峽谷','canyonDust','沙蠍','#d89a50','jet'],['秋日湖畔','autumnLake','紅楓','#e86a3a','prop'],['雨林瀑布','jungleRain','雨蛙','#4aa84a','stealth'],
  ['冰原夕照','iceDusk','霜狼','#ffc8a8','jet'],['颱風外圍','typhoonEdge','旋風','#5ab0c8','jet'],['黑夜雷暴','stormNight','黑雷','#4a5a7a','stealth'],['金色沙漠','desertGold','金鷹','#ffc040','jet'],['環礁黃昏','reefDusk','晚霞','#ff8a6a','prop'],
  ['雪山星空','iceNight','星狼','#c8d8ff','stealth'],['火山群島','volcanoIsle','火鳥','#ff6a2a','jet'],['峽灣極光','fjordNight','北辰','#7affd8','stealth'],['高原風暴','mesaStorm','狂風','#8a6a5a','jet'],['麥田黃昏','farmDusk','稻草人','#d8a040','prop'],
  ['暴雪之夜','blizzardNight','白夜','#e0e8ff','stealth'],['颶風雷鳴','typhoonStorm','雷神','#2adbd9','jet'],['熔岩峽谷','canyonLava','熔岩','#ff4a1a','jet'],['平流層晨光','stratoDawn','晨星','#ffd8a0','stealth'],['夜色海峽','seaNight','暗影','#3a4a6a','stealth'],
  ['雲海之上','stratoDusk','雲龍','#ff9ac8','jet'],['極光風暴','auroraStorm','電光','#5affe0','stealth'],['火山雷暴','volcanoStorm','火雷','#ff2a2a','stealth'],['星海天頂','stratoNight','天狼','#9ab8ff','stealth'],['峽谷星夜','canyonNight','夜梟','#5a4a8a','stealth'],
  ['天際決戰','strato','蒼穹之王','#ffd23f','stealth']];
const STAGES=AS.map((a,i)=>{ const k=i/(AS.length-1); return {name:a[0],th:a[1],ace:a[2],acol:a[3],am:a[4],k,stars:1+Math.round(k*4),kills:5+Math.round(k*5),maxE:2+Math.round(k*2.4),
  eturn:.62+.32*k,espd:112+18*k,eacc:.05-.032*k,edmg:1.6+2.4*k,efire:.75+.5*k,ahp:60+110*k,amis:k>.15?11-5*k:0,aspd:126+16*k,jcd:2.6-1.1*k}; });
const TIPS=['敵機飛得慢、很少開火，先熟悉轉彎和自動開火。','小島很多，低空飛行小心別撞山。','峽谷的岩壁很高，敵機會躲在裡面。','沙塵讓視線變差，敵機開始會發射導彈。','雪山又高又尖，拉高才安全。',
  '雷雨雲裡看不清楚，還會打雷。','火山灰天空，熔岩海不能碰。','夜裡只看得到敵機的航行燈，跟著雷達找。','颶風會把飛機吹偏，敵機又快又準。',
  '紅葉山谷起伏大，貼著山腰飛最好找敵機。','雨林濕氣重、視線短，注意雷達。','環礁海面很亮，敵機的影子很好認。','朝陽在正前方，逆光時跟著準星。','峽谷黃昏光線斜，岩壁影子很深。',
  '峽灣兩邊是高聳冰壁，轉彎要早。','月光下的沙丘看不太清楚，靠航行燈找敵機。','霧裡的小島突然冒出來，飛高一點。','平原很開闊，敵機無處可躲。','暴雪讓視線很短，敵機會突然出現。',
  '夕陽很刺眼，背對太陽比較好瞄準。','夜晚的群島只剩航行燈，跟著雷達。','高原上的岩柱很多，低空要小心。','群島下著雷雨，雲裡會打雷。','山脈很高，拉高高度比較安全。',
  '夜裡的熔岩很亮，但地形看不清楚。','極光下的海面很暗，敵機開始常發導彈。','沙塵吹進峽谷，視線變差。','湖面很平，低空飛行很快。','瀑布附近有亂流，飛機會晃。',
  '冰原夕陽低垂，冰山的影子很長。','颱風邊緣風很大，飛機會被吹偏。','黑夜雷暴，只有閃電時看得清楚。','金色沙漠很熱，敵機飛得很快。','黃昏的環礁，敵機會從夕陽方向來。',
  '雪山夜空，雷達是你最好的朋友。','火山島到處噴發，熔岩不能碰。','峽灣夜空有極光，敵機很會閃。','高原起風暴了，敵機又快又準。','黃昏麥田，敵機成群出現。',
  '暴雪之夜幾乎看不見，跟著鎖定框。','颶風加上雷鳴，最混亂的天空。','峽谷底下是熔岩，千萬別飛太低。','平流層的晨光，敵機都是高手。','夜色海峽，敵機導彈一直來。',
  '雲海上沒有地形，只有高手對決。','極光加雷暴，敵機又快又會閃。','火山雷暴，最危險的天空之一。','星空下的天頂，王牌們都在這裡。','峽谷夜裡岩壁看不清楚，拉高才安全。',
  '最強的王牌：又快又會閃，導彈一直來。'];
/* 舊版第 10 關（天際決戰）的過關紀錄搬到新的第 50 關 */
try{ if(!localStorage.getItem('arcade.ace.mig50')){ if(localStorage.getItem('arcade.ace.w.9')==='1') localStorage.setItem('arcade.ace.w.49','1'); localStorage.removeItem('arcade.ace.w.9'); localStorage.setItem('arcade.ace.mig50','1'); } }catch(e){}
const hasWin=i=>{ try{ return localStorage.getItem('arcade.ace.w.'+i)==='1'; }catch(e){ return false; } };
const recWin=i=>{ try{ localStorage.setItem('arcade.ace.w.'+i,'1'); }catch(e){} };
// 場景：天空上下顏色、霧、水（熔岩）、地面四層顏色、地形高度、太陽位置
const TH={
  sea:{sky:['#2f74cc','#bfe0f8'],fog:'#cde4f4',fogF:3400,water:'#1d6aa8',land:['#e8d8a0','#5a9a48','#3d7a3a','#8a8a80'],base:-90,amp:150,ridge:0,sun:[.55,.6],sunC:'#fff6e0',hemi:.8,cloud:'#ffffff',cn:1},
  isle:{sky:['#2a8ad8','#c8f0f8'],fog:'#d0eef4',fogF:3400,water:'#17a0a8',land:['#f0e2b0','#4aa040','#2f7a34','#6a8a5a'],base:-40,amp:170,ridge:120,sun:[.7,2.2],sunC:'#ffffff',hemi:.85,cloud:'#ffffff',cn:1.1},
  canyon:{sky:['#4a5aa8','#ffb478'],fog:'#f0a87c',fogF:2800,water:'#5a6a8a',land:['#c8784a','#b0603c','#8a4a32','#e0a070'],base:20,amp:110,ridge:330,sun:[.12,3.4],sunC:'#ffc890',hemi:.7,cloud:'#ffd8c0',cn:.6},
  desert:{sky:['#5a98d0','#f4e0b8'],fog:'#efd8aa',fogF:2400,water:'#3a9aa8',land:['#e8cc90','#dcb878','#c8a060','#b88850'],base:40,amp:70,ridge:90,sun:[.75,1.2],sunC:'#fff4d8',hemi:.85,cloud:'#fff8ec',cn:.4,dust:1},
  ice:{sky:['#6aa4dc','#eaf4ff'],fog:'#e4eff8',fogF:3000,water:'#24527a',land:['#c0d0e0','#e4ecf6','#ffffff','#a8b8c8'],base:-60,amp:200,ridge:360,sun:[.35,5.2],sunC:'#ffffff',hemi:.95,cloud:'#ffffff',cn:.9},
  storm:{sky:['#262e38','#5a6470'],fog:'#4c5560',fogF:1900,water:'#1a2e3c',land:['#6a7060','#3a5a40','#2a4030','#4a4c50'],base:-50,amp:160,ridge:100,sun:[.5,1],sunC:'#aab4c0',hemi:.55,cloud:'#8a929c',cn:1.6,rain:1,storm:1},
  volcano:{sky:['#24100e','#8a3a22'],fog:'#5a2a1c',fogF:2200,water:'#ff5a1a',lava:1,land:['#3a2a26','#2a2020','#1a1414','#5a3a2a'],base:-40,amp:190,ridge:240,sun:[.2,2.6],sunC:'#ff9a5a',hemi:.5,cloud:'#6a4a40',cn:.8,ash:1},
  night:{sky:['#030718','#1a2450'],fog:'#0c1430',fogF:2400,water:'#0a1a30',land:['#3a4050','#1a3024','#14241c','#3a3c48'],base:-70,amp:170,ridge:150,sun:[.45,4],sunC:'#c8d4ff',hemi:.42,cloud:'#3a4a6a',cn:.7,night:1},
  typhoon:{sky:['#34546a','#8aa8b8'],fog:'#6a8a98',fogF:2200,water:'#22465a',land:['#7a8a70','#3a6a4a','#2a5038','#5a6060'],base:-80,amp:150,ridge:80,sun:[.6,.4],sunC:'#e0eaf0',hemi:.65,cloud:'#c0ccd4',cn:1.3,rain:1,wind:1},
  strato:{sky:['#061650','#6a9ae0'],fog:'#c8dcf4',fogF:3600,water:'#f2f6ff',cloudFloor:1,land:['#f2f6ff','#f2f6ff','#f2f6ff','#f2f6ff'],base:-600,amp:10,ridge:0,sun:[.3,1.8],sunC:'#ffffff',hemi:1,cloud:'#ffffff',cn:.7,stars:1}};
/* 新場景：用原本的地形做底，換季節、時段、天氣 */
{ const X=(b,o)=>Object.assign({},TH[b],o),DUSK={sky:['#2a2a6a','#ff9a6a'],fog:'#e8a088',sunC:'#ffb070',hemi:.7,cloud:'#ffc8b0'},NIGHT={sky:['#030718','#1a2450'],fog:'#0c1430',sunC:'#c8d4ff',hemi:.42,cloud:'#3a4a6a',night:1},DAWN={sky:['#3a5aa8','#ffd0b0'],fog:'#f4d0c0',sunC:'#ffe0c0',hemi:.8,cloud:'#ffe8e0'},STORM={sky:['#262e38','#5a6470'],fog:'#4c5560',fogF:1900,sunC:'#aab4c0',hemi:.55,cloud:'#8a929c',cn:1.6,rain:1,storm:1};
  Object.assign(TH,{
    autumn:X('isle',{sky:['#3a7ad0','#f8e0b8'],fog:'#f0dcc0',water:'#2a6a8a',land:['#e8c890','#d8702a','#a83a1a','#8a6a50'],ridge:200,base:-20}),
    jungle:X('isle',{sky:['#3a8ab0','#d8f0d8'],fog:'#bcd8c0',fogF:2400,water:'#2a7a6a',land:['#c8b880','#2a8a2a','#1a5a1a','#4a6a3a'],ridge:180,cn:1.4}),
    reef:X('sea',{sky:['#1a90e8','#d8f8ff'],water:'#14c0c8',land:['#fff0c0','#6ac850','#3a9a3a','#9aa880'],base:-110,amp:120}),
    seaDawn:X('sea',DAWN),seaDusk:X('sea',DUSK),seaNight:X('sea',NIGHT),
    canyonDusk:X('canyon',{sky:['#3a2a7a','#ff8ab0'],fog:'#d890a8',sunC:'#ffa0c0'}),canyonDust:X('canyon',{dust:1,fog:'#e0b888',fogF:2000}),canyonLava:X('canyon',{water:'#ff5a1a',lava:1,sky:['#2a100e','#a84a2a'],fog:'#7a3a24',ash:1,base:60}),
    fjord:X('ice',{sky:['#4a84c8','#d8ecff'],water:'#1a4a6a',land:['#8a9aa8','#5a7a6a','#e8f0f8','#6a7a88'],base:-90,ridge:400}),fjordNight:X('ice',Object.assign({},NIGHT,{water:'#0a1a30',ridge:400})),
    desertNight:X('desert',NIGHT),desertGold:X('desert',{sky:['#e89a3a','#ffe8a8'],fog:'#f8d890',sunC:'#fff0c0'}),
    isleFog:X('isle',{fog:'#e0e8f0',fogF:1500,sky:['#a8b8c8','#e8eef4'],cn:1.6}),isleNight:X('isle',NIGHT),isleStorm:X('isle',STORM),
    farm:X('sea',{sky:['#3a8ae0','#e0f0ff'],water:'#3a7ab0',land:['#d8c070','#e8c84a','#8ab040','#7a6a40'],base:-10,amp:60,ridge:0}),farmDusk:X('sea',Object.assign({},DUSK,{water:'#3a5a8a',land:['#d8b060','#d8a03a','#7a9a3a','#6a5a3a'],base:-10,amp:60,ridge:0})),
    blizzard:X('ice',{fog:'#e8eef4',fogF:1300,rain:1,cn:1.4,sky:['#a8b8c8','#e8f0f8']}),blizzardNight:X('ice',Object.assign({},NIGHT,{fogF:1500,rain:1})),
    iceDusk:X('ice',DUSK),iceNight:X('ice',NIGHT),
    mesa:X('canyon',{sky:['#3a8ad8','#f8d8a8'],fog:'#f0c8a0',land:['#d8a070','#c0603a','#a04a2a','#e8b080'],ridge:280,base:40}),mesaStorm:X('canyon',Object.assign({},STORM,{wind:1})),
    sakura:X('ice',{sky:['#6aa0e0','#ffe8f0'],fog:'#f8e0ea',water:'#3a6aa0',land:['#e8d8c8','#ff9ac0','#ff7aa8','#8a7a80'],sunC:'#fff0f4',cloud:'#fff4f8'}),
    volcanoNight:X('volcano',NIGHT),volcanoIsle:X('volcano',{sky:['#4a6aa8','#e8a07a'],fog:'#c8907a',base:-80}),volcanoStorm:X('volcano',{storm:1,rain:1,sky:['#1a0a0a','#4a2a2a'],cn:1.4}),
    auroraSea:X('night',{base:-120,amp:100,ridge:0}),auroraStorm:X('night',{storm:1,rain:1}),
    autumnLake:X('isle',{sky:['#5a8ad8','#ffe8c8'],water:'#3a8ac8',land:['#e8d0a0','#e8803a','#c04a2a','#8a7060'],base:-60,ridge:100}),
    jungleRain:X('isle',{sky:['#4a6a6a','#a8c0b0'],fog:'#90a898',fogF:1800,water:'#2a6a5a',land:['#a8a070','#2a7a2a','#1a4a1a','#3a5a3a'],rain:1,cn:1.6}),
    typhoonEdge:X('typhoon',{sky:['#4a7aa0','#c0d8e8'],fog:'#a0b8c8',fogF:2800}),typhoonStorm:X('typhoon',{storm:1}),stormNight:X('storm',NIGHT),canyonNight:X('canyon',NIGHT),
    reefDusk:X('sea',Object.assign({},DUSK,{water:'#1a8aa8',land:['#ffe0b0','#5ab048','#3a8a3a','#8a9a70'],base:-110,amp:120})),
    stratoDawn:X('strato',{sky:['#2a3a8a','#ffc8a0'],sunC:'#ffd8b0',stars:0}),stratoDusk:X('strato',{sky:['#3a1a6a','#ff8aa8'],sunC:'#ffa0b0',water:'#ffe0e8'}),stratoNight:X('strato',{sky:['#020414','#18265a'],water:'#8a9ac8',hemi:.5,sunC:'#c8d4ff',night:1})}); }
function mkHgt(si){ const T0=TH[STAGES[si].th],s=si*7.31+1.7;
  return (x,z)=>{ let h=T0.base+T0.amp*(Math.sin(x*.0011+s)*Math.cos(z*.0013-s*.7)+.45*Math.sin(x*.0029-z*.0021+s*2.1)+.18*Math.sin(x*.0083+z*.0067+s));
    if(T0.ridge){ const q=1-Math.abs(Math.sin(x*.0017+z*.0009+s)*Math.cos(z*.0012-x*.0004)); h+=Math.pow(q,5)*T0.ridge; }
    const d=Math.hypot(x,z); if(d>2700) h-=(d-2700)*.35; return h; }; }

// ---------- 飛機模型（噴射戰機／螺旋槳戰機／隱形戰機），塗裝貼圖、配件 ----------
const PLANES=[{id:'jet',label:'噴射戰機'},{id:'prop',label:'螺旋槳戰機'},{id:'stealth',label:'隱形戰機'}];
const PAINTS=[{id:'none',label:'素面'},{id:'stripe',label:'雙條紋'},{id:'camo',label:'迷彩'},{id:'shark',label:'鯊魚嘴'},{id:'flame',label:'火焰'}];
const PODS=[{id:'none',label:'無'},{id:'aam',label:'翼尖飛彈'},{id:'tank',label:'副油箱'},{id:'both',label:'飛彈＋油箱'}];
const TEXC={};
function paintTex(T,col,paint,plan){ const key=(plan?'p':'l')+col+paint; if(TEXC[key]) return TEXC[key];
  const cv=document.createElement('canvas'),Wt=512,Ht=256; cv.width=Wt; cv.height=Ht; const g=cv.getContext('2d'),R=mul(col.length*97+paint.length*13),acc=/^#(e|f|d|c)[0-9a-f]2/.test(col)&&parseInt(col.slice(3,5),16)<120?'#14122b':'#e8343a';
  g.fillStyle=col; g.fillRect(0,0,Wt,Ht);
  if(!plan){ const b=g.createLinearGradient(0,0,Wt,0); b.addColorStop(0,'rgba(0,0,0,.08)'); b.addColorStop(.3,'rgba(0,0,0,0)'); b.addColorStop(.5,'rgba(255,255,255,.25)'); b.addColorStop(.7,'rgba(0,0,0,0)'); b.addColorStop(1,'rgba(0,0,0,.08)'); g.fillStyle=b; g.fillRect(0,0,Wt,Ht); }
  g.strokeStyle='rgba(0,0,0,.16)'; g.lineWidth=1.2; for(let i=1;i<7;i++){ const y=i*Ht/7+(R()-.5)*8; g.beginPath(); g.moveTo(0,y); g.lineTo(Wt,y); g.stroke(); } for(let i=0;i<10;i++){ const x=R()*Wt,y=R()*Ht; g.strokeRect(x,y,14+R()*30,8+R()*16); }
  if(paint==='camo'){ for(let i=0;i<46;i++){ g.fillStyle=[shade(col,-.35),shade(col,.25),shade(col,-.6)][i%3]; g.beginPath(); const x=R()*Wt,y=R()*Ht; g.ellipse(x,y,14+R()*34,8+R()*20,R()*PI,0,TAU); g.fill(); g.beginPath(); g.ellipse(x+16,y+6,10+R()*20,6+R()*12,R()*PI,0,TAU); g.fill(); } }
  if(paint==='stripe'){ g.fillStyle='#ffffff'; if(plan){ g.fillRect(Wt/2-22,0,12,Ht); g.fillRect(Wt/2+10,0,12,Ht); g.fillStyle=acc; g.fillRect(Wt/2-6,0,12,Ht); } else { g.fillRect(0,0,14,Ht); g.fillRect(Wt-14,0,14,Ht); g.fillStyle=acc; g.fillRect(18,0,9,Ht); g.fillRect(Wt-27,0,9,Ht); g.fillRect(0,Ht*.8,Wt,10); g.fillStyle='#fff'; g.fillRect(0,Ht*.8+12,Wt,5); } }
  const mouth=(cx,cy,w,h,up)=>{ g.fillStyle='#7a0e14'; g.beginPath(); g.moveTo(cx-w,cy); g.quadraticCurveTo(cx,cy+(up?-h:h)*1.6,cx+w,cy); g.quadraticCurveTo(cx,cy+(up?-h:h)*.35,cx-w,cy); g.fill(); g.strokeStyle='#14122b'; g.lineWidth=3; g.stroke();
    g.fillStyle='#fff'; for(let k=0;k<12;k++){ const u=k/11,x=cx-w*.9+u*w*1.8,y=cy+(up?-1:1)*h*.35*(1-Math.pow(2*u-1,2))*.9; g.beginPath(); g.moveTo(x-6,y); g.lineTo(x+6,y); g.lineTo(x,y+(up?-1:1)*13); g.fill(); } };
  const eye=(x,y,k)=>{ k=k||1; g.fillStyle='#fff'; g.beginPath(); g.ellipse(x,y,13*k,9*k,0,0,TAU); g.fill(); g.fillStyle='#14122b'; g.beginPath(); g.arc(x+2*k,y,5*k,0,TAU); g.fill(); };
  if(paint==='shark'){ if(plan){ mouth(Wt/2,Ht-36,80,18,true); eye(Wt/2-70,Ht-70); eye(Wt/2+70,Ht-70); } else { mouth(Wt/2,96,200,46,false); eye(Wt*.2,62,1.5); eye(Wt*.8,62,1.5); } }
  if(paint==='flame'){ const fl=(x,y0,dir,len,w)=>{ const gr=g.createLinearGradient(0,y0,0,y0+dir*len); gr.addColorStop(0,'#fff2a0'); gr.addColorStop(.35,'#ffb020'); gr.addColorStop(1,'#e8202a'); g.fillStyle=gr;
      for(let k=-2;k<=2;k++){ const x0=x+k*w*.42,L=len*(1-Math.abs(k)*.18); g.beginPath(); g.moveTo(x0-w*.25,y0); g.quadraticCurveTo(x0-w*.35,y0+dir*L*.5,x0+w*.12,y0+dir*L); g.quadraticCurveTo(x0+w*.05,y0+dir*L*.45,x0+w*.25,y0); g.fill(); } };
    if(plan) fl(Wt/2,Ht,-1,150,70); else { fl(Wt*.25,0,1,160,64); fl(Wt*.75,0,1,160,64); } }
  if(!plan){ const sh=g.createLinearGradient(0,0,0,Ht); sh.addColorStop(0,'rgba(0,0,0,0)'); sh.addColorStop(.85,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(20,10,0,.35)'); g.fillStyle=sh; g.fillRect(0,0,Wt,Ht); } /* 尾端排氣燻黑 */
  const tex=new T.CanvasTexture(cv); tex.anisotropy=4; if(plan){ tex.repeat.set(1/13,1/13); tex.offset.set(.5,.5); } TEXC[key]=tex; return tex; }
function wingTex(T,col){ const key='w'+col; if(TEXC[key]) return TEXC[key]; const cv=document.createElement('canvas'); cv.width=cv.height=256; const g=cv.getContext('2d'),R=mul(col.length*31+7); g.fillStyle=col; g.fillRect(0,0,256,256);
  for(let i=0;i<34;i++){ g.fillStyle=[shade(col,-.35),shade(col,.25),shade(col,-.6)][i%3]; g.beginPath(); g.ellipse(R()*256,R()*256,12+R()*30,8+R()*18,R()*PI,0,TAU); g.fill(); }
  const tex=new T.CanvasTexture(cv); tex.wrapS=tex.wrapT=T.RepeatWrapping; tex.repeat.set(.16,.16); TEXC[key]=tex; return tex; }
function buildPlane(T,L){ L=L||{}; const m=L.model||'jet',col=L.color||'#5a8ad8',paint=L.paint||'none',pod=L.pod||'none',G=new T.Group(),V2=T.Vector2;
  const ph=(o)=>new T.MeshPhongMaterial(Object.assign({shininess:70,specular:0x5a5a5a},o));
  const M={body:ph({map:paintTex(T,col,paint,m==='stealth'),flatShading:m==='stealth'}),wing:ph(paint==='camo'?{map:wingTex(T,col),flatShading:m==='stealth'}:{color:col,flatShading:m==='stealth'}),
    dark:ph({color:0x2a2e36,shininess:40,specular:0x333333}),metal:ph({color:0x9a9ea6,shininess:110,specular:0xaaaaaa}),white:ph({color:0xeeeeee}),red:ph({color:0xd8303a}),
    glass:ph({color:m==='stealth'?0x5a4418:0x162a46,shininess:160,specular:0xffffff,transparent:true,opacity:.93})};
  const add=(geo,mat,x,y,z,rx,ry,rz,par)=>{ const o=new T.Mesh(geo,mat); o.position.set(x||0,y||0,z||0); o.rotation.set(rx||0,ry||0,rz||0); (par||G).add(o); return o; };
  const lathe=(pts,seg)=>{ const g=new T.LatheGeometry(pts.map(p=>new V2(p[0],p[1])),seg||28); g.rotateX(-PI/2); return g; };
  const slab=(pts,th,bev)=>{ const s=new T.Shape(); pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1])); return new T.ExtrudeGeometry(s,{depth:th,bevelEnabled:!!bev,bevelThickness:bev||0,bevelSize:bev||0,bevelSegments:1}); };
  const wingG=(pts,th,y,sx)=>{ const g=slab(pts.map(p=>[p[0]*sx,p[1]]),th,th*.35); g.rotateX(PI/2); g.translate(0,y+th/2,0); return g; };
  const finG=(pts,th)=>{ const g=slab(pts,th,th*.3); g.rotateY(-PI/2); g.translate(th/2,0,0); return g; };
  const ell=(span,x0,le,te,z0)=>{ const a=[],b=[]; for(let k=0;k<=12;k++){ const u=k/12,f=Math.sqrt(Math.max(0,1-u*u*.97)); a.push([x0+span*u,z0-le*f]); b.push([x0+span*u,z0+te*f]); } return a.concat(b.reverse()); };
  const flames=[],nav=[]; let prop=null,tips,belly,tail;
  const flame=(x,z,r,len)=>{ const f=new T.Group(); f.position.set(x,0,z); const o=new T.Mesh(new T.ConeGeometry(r,len,14,1,true).rotateX(PI/2).translate(0,0,len/2),new T.MeshBasicMaterial({color:0xff7a2a,transparent:true,opacity:.6,blending:T.NormalBlending,depthWrite:false,side:T.DoubleSide}));
    const n=new T.Mesh(new T.ConeGeometry(r*.55,len*.6,12,1,true).rotateX(PI/2).translate(0,0,len*.3),new T.MeshBasicMaterial({color:0xffd890,transparent:true,opacity:.7,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide})); f.add(o); f.add(n); G.add(f); flames.push(f); };
  if(m==='jet'){
    add(lathe([[.58,-6.0],[.82,-5.4],[1.0,-3.6],[1.06,-1],[1.0,1.6],[.82,3.0],[.55,4.4],[.24,5.5],[.04,6.1]]).scale(1,.86,1),M.body);
    for(const sx of [1,-1]){ add(wingG([[.8,-1.4],[5.4,2.2],[5.5,3.0],[.8,3.5]],.16,-.25,sx),M.wing); add(wingG([[.7,-3.6],[1.25,-1.4],[.8,-1.2]],.1,-.2,sx),M.wing);
      add(wingG([[.5,3.7],[2.9,5.2],[2.9,5.8],[.5,5.9]],.1,-.15,sx),M.wing);
      add(finG([[0,0],[1.7,0],[2.5,2.7],[1.6,2.7]],.12),M.wing,sx*.72,.45,3.1,0,0,-sx*.28);
      add(new T.BoxGeometry(.55,.75,2.6),M.dark,sx*1.08,-.2,-.4); add(new T.BoxGeometry(.5,.1,.5),M.red,sx*5.45,-.2,2.75); }
    add(new T.SphereGeometry(.62,20,12).scale(.82,.72,2.3),M.glass,0,.72,-2.7); add(new T.TorusGeometry(.5,.05,6,16,PI).scale(1,.9,1),M.dark,0,.7,-1.7,0,0,0);
    add(new T.CylinderGeometry(.62,.52,.9,18,1,true).rotateX(PI/2),M.metal,0,0,5.95); add(new T.CylinderGeometry(.03,.03,1.2,6).rotateX(PI/2),M.metal,0,0,-6.6);
    flame(0,6.35,.5,3.4); tips=[[5.45,-.25,2.6],[-5.45,-.25,2.6]]; belly=[0,-1.0,.6]; tail=[0,0,6.6]; }
  else if(m==='prop'){
    add(lathe([[.18,-5.4],[.42,-4.6],[.72,-2.8],[.98,-.8],[1.1,1.0],[1.12,2.5],[1.06,3.3],[.8,3.7]]),M.body);
    add(new T.CylinderGeometry(1.14,1.1,1.0,28,1,true).rotateX(PI/2),M.dark,0,0,-3.05); add(new T.ConeGeometry(.5,1.1,18).rotateX(-PI/2),M.red,0,0,-4.25);
    prop=new T.Group(); prop.position.set(0,0,-4.0); G.add(prop); for(let k=0;k<3;k++){ const b=add(new T.BoxGeometry(.24,2.4,.07).translate(0,1.25,0),M.dark,0,0,0,0,0,k*TAU/3,prop); add(new T.BoxGeometry(.25,.3,.08),new T.MeshBasicMaterial({color:0xffd23f}),0,2.3,0,0,0,0,b); }
    const disc=add(new T.CircleGeometry(2.5,32),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.1,depthWrite:false,side:T.DoubleSide}),0,0,-4.02); disc.userData.disc=1; prop.userData.disc=disc;
    for(const sx of [1,-1]){ add(wingG(ell(5.6,.9,1.25,1.5,-.2),.17,-.55,sx),M.wing,0,0,0,0,0,sx*.07); add(wingG(ell(2.3,.3,.55,.6,4.45),.09,.05,sx),M.wing);
      add(new T.BoxGeometry(.18,.18,.8),M.dark,sx*.95,.2,-2.2); add(new T.CylinderGeometry(.05,.05,1.4,6).rotateX(PI/2),M.dark,sx*2.4,-.5,-1.7); }
    add(finG([[0,0],[1.9,0],[1.7,1.5],[1.0,2.1],[.3,1.4]],.1),M.wing,0,.55,3.5);
    add(new T.SphereGeometry(.56,20,12).scale(.9,.9,1.9),M.glass,0,.92,-.2); add(new T.BoxGeometry(.5,.35,1.4),M.body,0,.75,1.3);
    tips=[[6.3,-.1,0],[-6.3,-.1,0]]; belly=[0,-1.2,-.3]; tail=[0,0,5.4]; }
  else { const rt=[[0,-6.4],[.9,-3.6],[1.6,-1.6],[6.0,2.4],[6.0,3.2],[3.4,2.6],[2.6,4.0],[1.4,3.4],[0,4.4]],full=rt.concat(rt.slice(1,-1).reverse().map(([x,z])=>[-x,z]));
    const g=slab(full,.22,.34); g.rotateX(PI/2); g.translate(0,.12,0); add(g,M.body);
    add(new T.SphereGeometry(1,10,8).scale(1.25,.55,3.9),M.wing,0,.22,-.7); add(new T.SphereGeometry(.6,12,8).scale(.75,.55,1.9),M.glass,0,.66,-2.6);
    for(const sx of [1,-1]){ add(finG([[0,0],[1.5,0],[2.2,2.0],[1.3,2.0]],.1),M.wing,sx*1.4,.3,2.0,0,0,-sx*.55); add(new T.BoxGeometry(.8,.2,.5),new T.MeshBasicMaterial({color:0xff9a4a}),sx*.65,.02,4.05); flame(sx*.65,4.3,.3,2.2); }
    tips=[[5.8,0,2.8],[-5.8,0,2.8]]; belly=[0,-.7,.4]; tail=[0,0,4.6]; }
  // 翼尖航行燈：左紅右綠
  tips.forEach((p,i)=>{ const l=add(new T.SphereGeometry(.16,8,6),new T.MeshBasicMaterial({color:i?0xff3030:0x30ff60}),p[0],p[1]+.15,p[2]); nav.push(l); });
  if(pod==='aam'||pod==='both') tips.forEach(p=>{ const s=p[0]>0?1:-1,mg=new T.Group(); mg.position.set(p[0]+s*.25,p[1]-.05,p[2]-1.2); G.add(mg); add(new T.CylinderGeometry(.13,.13,2.8,10).rotateX(PI/2),M.white,0,0,0,0,0,0,mg); add(new T.ConeGeometry(.13,.55,10).rotateX(-PI/2),M.dark,0,0,-1.67,0,0,0,mg);
    add(new T.BoxGeometry(.6,.04,.4),M.dark,0,0,1.1,0,0,0,mg); add(new T.BoxGeometry(.04,.6,.4),M.dark,0,0,1.1,0,0,0,mg); });
  if(pod==='tank'||pod==='both'){ add(new T.SphereGeometry(.5,14,10).scale(1,1,4.2),M.wing,belly[0],belly[1]-.15,belly[2]); add(new T.BoxGeometry(.12,.45,1.2),M.dark,belly[0],belly[1]+.3,belly[2]); }
  G.traverse(o=>{ if(o.isMesh&&!o.material.transparent) o.castShadow=false; });
  return {g:G,flames,prop,nav,tail:tail,tips}; }

// ---------- 煙、火、雲的貼圖 ----------
function texPuff(T){ const cv=document.createElement('canvas'); cv.width=cv.height=128; const g=cv.getContext('2d'),R=mul(5);
  for(let i=0;i<14;i++){ const x=30+R()*68,y=36+R()*56,r=18+R()*26,q=g.createRadialGradient(x,y,0,x,y,r); q.addColorStop(0,'rgba(255,255,255,.55)'); q.addColorStop(.6,'rgba(255,255,255,.25)'); q.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=q; g.fillRect(0,0,128,128); }
  return new T.CanvasTexture(cv); }
function texGlow(T){ const cv=document.createElement('canvas'); cv.width=cv.height=64; const g=cv.getContext('2d'),q=g.createRadialGradient(32,32,0,32,32,32); q.addColorStop(0,'rgba(255,255,255,1)'); q.addColorStop(.25,'rgba(255,255,255,.7)'); q.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=q; g.fillRect(0,0,64,64); return new T.CanvasTexture(cv); }
function texNoise(T,seed){ const cv=document.createElement('canvas'); cv.width=cv.height=256; const g=cv.getContext('2d'),R=mul(seed); g.fillStyle='#d8d8d8'; g.fillRect(0,0,256,256);
  for(let i=0;i<1800;i++){ const v=150+R()*105|0; g.fillStyle='rgba('+v+','+v+','+v+',.55)'; g.fillRect(R()*256,R()*256,2+R()*6,2+R()*6); }
  for(let i=0;i<40;i++){ const v=170+R()*60|0; g.fillStyle='rgba('+v+','+v+','+v+',.35)'; g.beginPath(); g.ellipse(R()*256,R()*256,10+R()*30,6+R()*16,R()*PI,0,TAU); g.fill(); }
  const t=new T.CanvasTexture(cv); t.wrapS=t.wrapT=T.RepeatWrapping; return t; }
function skyTex(T,TT,seed){ const cv=document.createElement('canvas'),SW=1024,SH=512; cv.width=SW; cv.height=SH; const g=cv.getContext('2d'),R=mul(seed),gr=g.createLinearGradient(0,0,0,SH/2);
  gr.addColorStop(0,TT.sky[0]); gr.addColorStop(.45,TT.sky[0]); gr.addColorStop(.88,TT.sky[1]); gr.addColorStop(1,TT.fog); g.fillStyle=gr; g.fillRect(0,0,SW,SH); g.fillStyle=TT.fog; g.fillRect(0,SH/2,SW,SH/2);
    if(TT.night){ for(let k=0;k<3;k++){ const y0=SH*(.14+k*.07); for(let x=0;x<SW;x+=3){ const h=40+30*Math.sin(x*.012+k*2)+20*Math.sin(x*.031+k),a=.10+.08*Math.sin(x*.02+k*3); const q=g.createLinearGradient(0,y0-h,0,y0+20); q.addColorStop(0,'rgba(120,255,180,0)'); q.addColorStop(.6,'rgba(90,255,170,'+a+')'); q.addColorStop(1,'rgba(160,120,255,0)'); g.fillStyle=q; g.fillRect(x,y0-h,3,h+20); } } }
  return new T.CanvasTexture(cv); }

// ---------- 開始畫面、關卡圖：用 2D 畫一張追尾視角的示意圖 ----------
function jet2d(c,x,y,s,col,bank,t,flame){ c.save(); c.translate(x,y); c.rotate(bank); c.scale(s,s); c.lineJoin='round';
  c.fillStyle=shade(col,-.2); c.beginPath(); c.moveTo(-6,-2); c.lineTo(-90,22); c.lineTo(-92,30); c.lineTo(-8,14); c.closePath(); c.fill(); c.beginPath(); c.moveTo(6,-2); c.lineTo(90,22); c.lineTo(92,30); c.lineTo(8,14); c.closePath(); c.fill();
  c.fillStyle=shade(col,-.35); c.beginPath(); c.moveTo(-8,-6); c.lineTo(-22,-44); c.lineTo(-16,-44); c.lineTo(-3,-6); c.fill(); c.beginPath(); c.moveTo(8,-6); c.lineTo(22,-44); c.lineTo(16,-44); c.lineTo(3,-6); c.fill();
  const bg=c.createLinearGradient(0,-16,0,18); bg.addColorStop(0,shade(col,.4)); bg.addColorStop(1,shade(col,-.3)); c.fillStyle=bg; c.beginPath(); c.ellipse(0,2,15,15,0,0,TAU); c.fill();
  c.fillStyle='#14182a'; c.beginPath(); c.ellipse(0,-11,7,5,0,0,TAU); c.fill(); c.fillStyle='#3a3e46'; c.beginPath(); c.arc(0,4,8,0,TAU); c.fill();
  if(flame){ const f=c.createRadialGradient(0,4,0,0,4,12+Math.sin(t*30)*2); f.addColorStop(0,'#fff6d0'); f.addColorStop(.5,'rgba(255,150,40,.9)'); f.addColorStop(1,'rgba(255,80,20,0)'); c.fillStyle=f; c.beginPath(); c.arc(0,4,14,0,TAU); c.fill(); }
  c.fillStyle='#ff3a3a'; c.fillRect(-93,24,4,4); c.fillStyle='#3aff6a'; c.fillRect(89,24,4,4); c.restore(); }
function art(ctx,w,h,si,t){ const S=STAGES[si],TT=TH[S.th]; ctx.save(); ctx.scale(w/W,h/H); const g=ctx.createLinearGradient(0,0,0,H*.62); g.addColorStop(0,TT.sky[0]); g.addColorStop(1,TT.sky[1]); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.fillStyle=TT.fog; ctx.fillRect(0,H*.62,W,H); const hz=H*.6+Math.sin(t*.7)*10;
  ctx.fillStyle=shade(TT.land[1],TT.night?-.3:-.05); ctx.beginPath(); ctx.moveTo(0,H); for(let x=0;x<=W;x+=10){ const v=x+t*30; ctx.lineTo(x,hz-30-28*Math.sin(v*.012+si)-14*Math.sin(v*.033)-(TT.ridge>200?Math.pow(Math.abs(Math.sin(v*.008)),6)*90:0)); } ctx.lineTo(W,H); ctx.fill();
  ctx.fillStyle=TT.water||TT.land[0]; ctx.fillRect(0,hz+8,W,H); if(!TT.lava&&!TT.cloudFloor){ ctx.fillStyle='rgba(255,255,255,.18)'; for(let i=0;i<30;i++){ const y=hz+12+i*i*.4,x=((i*97-t*200*(1+i*.1))%W+W)%W; ctx.fillRect(x,y,30+i*3,2); } }
  for(let i=0;i<7;i++){ const x=((i*173-t*80*(1+i%3*.5))%(W+200)+W+200)%(W+200)-100,y=60+i*37%180; ctx.fillStyle='rgba(255,255,255,'+(TT.night?.12:.55)+')'; ctx.beginPath(); ctx.ellipse(x,y,70,18,0,0,TAU); ctx.ellipse(x+40,y-8,40,16,0,0,TAU); ctx.fill(); }
  jet2d(ctx,W*.62+Math.sin(t*.9)*60,H*.36+Math.sin(t*1.3)*20,.32,S.acol,Math.sin(t*.9)*.4,t,true);
  jet2d(ctx,W/2+Math.sin(t*.6)*30,H*.66,1.05,'#5a8ad8',-Math.sin(t*.6)*.25,t,true);
  if(TT.night){ ctx.fillStyle='rgba(6,8,30,.28)'; ctx.fillRect(0,0,W,H); }
  ctx.font='900 22px '+TC; ctx.textAlign='center'; ctx.lineWidth=6; ctx.strokeStyle='#14122b'; ctx.strokeText('王牌：'+S.ace,W/2,40); ctx.fillStyle='#ffd23f'; ctx.fillText('王牌：'+S.ace,W/2,40); ctx.restore(); }

// ---------- 遊戲 ----------
function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,host=!!net&&net.host,pv=!!opts.preview,two=!net&&opts.mode==='2p',me=net?Math.min(1,net.me):0,np=two?2:net?Math.min(2,net.count):1;
  const si=clamp(opts.stage|0,0,STAGES.length-1),ST=STAGES[si],TT=TH[ST.th],{ctx:c}=env.canvas2d(W,H),T=window.THREE;
  if(!T){ c.fillStyle='#14122b'; c.fillRect(0,0,W,H); c.fillStyle='#fff'; c.font='900 22px '+TC; c.textAlign='center'; c.fillText('3D 元件載入失敗，請重新整理再試',W/2,H/2); setTimeout(()=>env.end(pv?{}:{title:'無法開始',big:'',text:'載不到 three.js'}),2500); return {update(){},draw(){},destroy(){}}; }
  const V3=T.Vector3,hgt=mkHgt(si),RS=mul(si*977+13),low=!!env.touch||pv,Q=pv?.7:env.touch?1:1.4;
  const cv=document.createElement('canvas'),r=new T.WebGLRenderer({canvas:cv,antialias:!pv}); r.setPixelRatio(1); r.setSize(W*Q,H*Q,false); r.toneMapping=T.ACESFilmicToneMapping; r.toneMappingExposure=TT.night?1.35:1.12;
  const scene=new T.Scene(); scene.fog=new T.Fog(TT.fog,260,TT.fogF);
  const hemi=new T.HemisphereLight(TT.sky[1],TT.land[1],TT.hemi); scene.add(hemi); const sunDir=new V3(Math.cos(TT.sun[1])*Math.cos(TT.sun[0]),Math.sin(TT.sun[0]),Math.sin(TT.sun[1])*Math.cos(TT.sun[0]));
  const sun=new T.DirectionalLight(TT.sunC,TT.night?.55:1.0); sun.position.copy(sunDir).multiplyScalar(100); scene.add(sun);
  const sky=new T.Mesh(new T.SphereGeometry(5200,32,16),new T.MeshBasicMaterial({map:skyTex(T,TT,si+3),side:T.BackSide,fog:false,depthWrite:false,toneMapped:false})); scene.add(sky);
  if(TT.night||TT.stars){ const n=900,a=new Float32Array(n*3); for(let i=0;i<n;i++){ const th=RS()*TAU,el=.04+Math.asin(RS())*.95; a[i*3]=Math.cos(th)*Math.cos(el)*5000; a[i*3+1]=Math.sin(el)*5000; a[i*3+2]=Math.sin(th)*Math.cos(el)*5000; } const sg=new T.BufferGeometry(); sg.setAttribute('position',new T.BufferAttribute(a,3));
    const st=new T.Points(sg,new T.PointsMaterial({color:0xffffff,size:TT.stars?1.4:1.8,sizeAttenuation:false,fog:false,transparent:true,opacity:TT.stars?.6:.9,depthWrite:false})); st.frustumCulled=false; sky.add(st); }
  const GLOW=texGlow(T),PUFF=texPuff(T);
  const sunSp=new T.Sprite(new T.SpriteMaterial({map:GLOW,color:TT.sunC,fog:false,depthWrite:false,blending:T.AdditiveBlending,transparent:true})); sunSp.scale.setScalar(TT.night?420:900); scene.add(sunSp);
  // 地形：高度圖＋頂點顏色＋細節貼圖
  { const N=low?110:150,geo=new T.PlaneGeometry(7600,7600,N,N); geo.rotateX(-PI/2); const p=geo.attributes.position,cols=new Float32Array(p.count*3),C=TT.land.map(x=>new T.Color(x)),tc=new T.Color();
    for(let i=0;i<p.count;i++){ const x=p.getX(i),z=p.getZ(i),y=hgt(x,z); p.setY(i,y); const u=y<8?0:y<60?(y-8)/52:y<200?1+(y-60)/140:2+clamp((y-200)/160,0,1);
      const a=Math.min(2,Math.floor(u)),f=u-a; tc.copy(C[a]).lerp(C[Math.min(3,a+1)],f); if(TT.th==='ice'||TT.ridge>300){ if(y>230) tc.lerp(new T.Color('#ffffff'),clamp((y-230)/80,0,1)); } cols[i*3]=tc.r; cols[i*3+1]=tc.g; cols[i*3+2]=tc.b; }
    geo.setAttribute('color',new T.BufferAttribute(cols,3)); geo.computeVertexNormals(); const nt=texNoise(T,si+9); nt.repeat.set(70,70);
    if(!TT.cloudFloor) scene.add(new T.Mesh(geo,new T.MeshLambertMaterial({vertexColors:true,map:nt}))); }
  const wt=texNoise(T,si+21); wt.repeat.set(90,90);
  const water=new T.Mesh(new T.PlaneGeometry(12000,12000).rotateX(-PI/2),TT.lava?new T.MeshBasicMaterial({color:TT.water,map:wt}):TT.cloudFloor?new T.MeshLambertMaterial({color:TT.water,map:wt,emissive:0x6a7a90}):new T.MeshPhongMaterial({color:TT.water,map:wt,shininess:90,specular:0x8899aa}));
  scene.add(water);
  // 雲：一團一團的柔和小球
  const CLD=[]; { const n=Math.round((low?34:60)*TT.cn),mats=[0,1,2].map(k=>new T.SpriteMaterial({map:PUFF,color:new T.Color(TT.cloud).lerp(new T.Color(k?'#ffffff':TT.fog),k*.15),transparent:true,depthWrite:false,opacity:TT.night?.4:.85}));
    const put=(x,y,z,s)=>{ const k=4+Math.floor(RS()*5); for(let j=0;j<k;j++){ const sp=new T.Sprite(mats[j%3]); sp.position.set(x+(RS()-.5)*s*1.6,y+(RS()-.3)*s*.4,z+(RS()-.5)*s*1.2); sp.scale.setScalar(s*(.7+RS()*.7)); scene.add(sp); CLD.push(sp); } };
    for(let i=0;i<n;i++){ const a=RS()*TAU,d=300+RS()*2800,L=i%5; put(Math.cos(a)*d,TT.cloudFloor?20+RS()*120:L<2?140+RS()*120:L<4?820+RS()*260:330+RS()*420,Math.sin(a)*d,L===4?60+RS()*60:90+RS()*140); }
    if(TT.wind) for(let i=0;i<(low?30:48);i++){ const a=i/(low?30:48)*TAU; for(let k=0;k<3;k++) put(Math.cos(a)*2500,80+k*260,Math.sin(a)*2500,260); } }
  // 雨、火山灰
  let rain=null; if(TT.rain||TT.ash||TT.dust){ const n=low?500:900,pos=new Float32Array(n*6); rain={n,pos,geo:new T.BufferGeometry()}; rain.geo.setAttribute('position',new T.BufferAttribute(pos,3)); for(let i=0;i<n;i++){ pos[i*6]=(Math.random()-.5)*300; pos[i*6+1]=(Math.random()-.5)*200; pos[i*6+2]=(Math.random()-.5)*300; }
    const ln=new T.LineSegments(rain.geo,new T.LineBasicMaterial({color:TT.ash?0xff8a4a:TT.dust?0xe8cc90:0xc8d8ea,transparent:true,opacity:TT.ash?.8:.45})); ln.frustumCulled=false; scene.add(ln); rain.mesh=ln; }
  // 特效（煙、火、熱焰彈、尾煙）
  const FXN=low?320:560,FX=[]; for(let i=0;i<FXN;i++){ const sp=new T.Sprite(new T.SpriteMaterial({map:PUFF,transparent:true,depthWrite:false})); sp.visible=false; scene.add(sp); FX.push({sp,l:0}); } let fxI=0;
  const fx=(k,p,s0,s1,life,col,vel)=>{ const f=FX[fxI=(fxI+1)%FXN]; f.k=k; f.l=f.L=life; f.s0=s0; f.s1=s1; f.v=vel?vel.clone():null; f.sp.position.copy(p); const m=f.sp.material; m.map=k==='smoke'?PUFF:GLOW; m.blending=k==='smoke'?T.NormalBlending:T.AdditiveBlending; m.color.set(col); m.opacity=1; m.needsUpdate=true; f.sp.visible=true; f.sp.scale.setScalar(s0); };
  const boom=(p,big)=>{ for(let i=0;i<(big?14:6);i++){ const v=new V3(Math.random()-.5,Math.random()-.4,Math.random()-.5).multiplyScalar(big?60:30); fx('fire',p.clone().addScaledVector(v,.1),big?10:5,big?34:16,.5+Math.random()*.5,['#fff0c0','#ffb040','#ff6a20'][i%3],v); }
    for(let i=0;i<(big?10:4);i++){ const v=new V3(Math.random()-.5,Math.random()*.6,Math.random()-.5).multiplyScalar(big?30:16); fx('smoke',p,big?10:6,big?44:20,1.6+Math.random(),TT.night?'#2a2e3a':'#3a3a3e',v); } };
  // 子彈（曳光彈）、導彈
  const BM=n=>{ const m=new T.InstancedMesh(new T.BoxGeometry(.32,.32,9),new T.MeshBasicMaterial({color:n?0xff5a4a:0xffe08a,fog:false}),400); m.count=0; m.frustumCulled=false; scene.add(m); return m; },BMP=BM(0),BME=BM(1),dum=new T.Object3D();
  const MSM=[]; for(let i=0;i<24;i++){ const g=new T.Group(); g.add(new T.Mesh(new T.CylinderGeometry(.22,.22,3.4,8).rotateX(PI/2),new T.MeshPhongMaterial({color:0xeeeeee}))); const n=new T.Mesh(new T.ConeGeometry(.22,.7,8).rotateX(-PI/2),new T.MeshPhongMaterial({color:0xd8303a})); n.position.z=-2; g.add(n);
    const f=new T.Mesh(new T.SphereGeometry(.6,8,6),new T.MeshBasicMaterial({color:0xffc060,blending:T.AdditiveBlending,transparent:true,depthWrite:false})); f.position.z=1.9; g.add(f); g.visible=false; scene.add(g); MSM.push(g); }
  // 玩家
  const names=net?[net.names[0]||'玩家 1',net.names[1]||'玩家 2']:two?['1P','2P']:[pv?'王牌':(opts.name||'你')];
  const lk=i=>net?(net.looks&&net.looks[i])||{}:i===0?(opts.look||{}):{model:'jet',color:'#e8a03a',paint:'stripe',pod:'aam',smoke:'#ffd23f'};
  const spawnAt=i=>({x:i*50-25,y:Math.max(380,hgt(i*50-25,1100)+260),z:1100});
  const mkCam=()=>new T.PerspectiveCamera(62,two?W/(H/2):W/H,1,7000);
  const P=[]; for(let i=0;i<np;i++){ const L=lk(i),m=buildPlane(T,L),s=spawnAt(i); scene.add(m.g); P.push({i,pos:new V3(s.x,s.y,s.z),dir:new V3(0,0,-1),yaw:0,pitch:0,roll:0,spd:SPD,hp:100,lives:LIVES,miss:4,dead:0,score:0,kills:0,inv:2.5,dodge:0,dcd:0,fcd:0,fire:0,lock:null,hitT:0,warn:0,
    ai:pv&&i===0,m,L,smoke:L.smoke||'#ffffff',cam:mkCam(),cp:new V3(s.x,s.y+8,s.z+30),trT:0,dsp:1,aiT:0,aj:0}); }
  const q0=new T.Quaternion(),e0=new T.Euler(0,0,0,'YXZ'),UP=new V3(0,1,0),UPV=new V3(),pr=new V3();
  const E=[]; let eid=0,kn=0,spT=1,phase='intro',PT=pv?1:2.4,t=0,ban=null,ended=false,result=null,ev=[],sendT=0,flash=0,ace=null,MS=[],B=[],quake=0;
  const need=Math.round(ST.kills*(np>1?1.5:1));
  const rin={dx:0,dy:0,miss:false,dodge:false};
  const sfx=n=>{ if(pv) return; env.sfx(n); if(host) ev.push(n); };
  const say=(txt,col)=>{ ban={txt,col:col||'#ffd23f',t:0}; if(host) ev.push('b:'+txt+'|'+(col||'')); };
  const ENL=[{model:'jet',color:'#7a8490',paint:'none'},{model:'prop',color:'#6a7a5a',paint:'camo'},{model:'jet',color:'#5a5e66',paint:'shark'}];
  function mkE(isAce,pos,yaw){ const L=isAce?{model:ST.am,color:ST.acol,paint:si%2?'flame':'shark',pod:'both'}:ENL[(eid+si)%3],m=buildPlane(T,L); if(isAce) m.g.scale.setScalar(1.15); scene.add(m.g);
    const e={id:++eid,ace:isAce,pos,dir:new V3(),yaw,pitch:0,roll:0,spd:isAce?ST.aspd:ST.espd,hp:isAce?ST.ahp*(np>1?1.4:1):16,turn:isAce?ST.eturn+.15:ST.eturn,jcd:0,fcd:1.5,mcd:isAce&&ST.amis?ST.amis*.6:1e9,jT:0,jx:0,jy:0,m,L,hitT:0,trT:0,fire:0}; e.max=e.hp; E.push(e); return e; }
  function spawnE(isAce){ const al=P.filter(p=>p.dead<=0&&p.lives>0),p=al[0]||P[0],a=p.yaw+(Math.random()-.5)*1.4,d=isAce?1300:900+Math.random()*500;
    const x=clamp(p.pos.x-Math.sin(a)*d,-BOUND+200,BOUND-200),z=clamp(p.pos.z-Math.cos(a)*d,-BOUND+200,BOUND-200),y=Math.max(hgt(x,z)+180,clamp(p.pos.y+(Math.random()-.5)*160,200,800));
    return mkE(isAce,new V3(x,y,z),Math.atan2(-(p.pos.x-x),-(p.pos.z-z))); }
  function killMesh(o){ scene.remove(o.m.g); o.m.g.traverse(q=>{ if(q.geometry) q.geometry.dispose(); if(q.material&&q.material.dispose) q.material.dispose(); }); }
  // 飛行：左右傾斜轉彎、上下拉高俯衝，放開就慢慢改平
  function fly(o,dx,dy,dt,turn,spd){ o.roll+=(-dx*1.08-o.roll)*Math.min(1,dt*3.6); o.yaw+=o.roll*turn*dt;
    if(dy) o.pitch=clamp(o.pitch+dy*1.05*dt,-1.15,1.15); else o.pitch*=1-Math.min(1,dt*.6);
    const cp=Math.cos(o.pitch); o.dir.set(-Math.sin(o.yaw)*cp,Math.sin(o.pitch),-Math.cos(o.yaw)*cp); o.pos.addScaledVector(o.dir,spd*dt);
    if(TT.wind){ o.pos.x+=Math.sin(t*.35)*22*dt; o.pos.y+=Math.sin(t*1.7+o.pos.x*.01)*8*dt; } }
  function steer(o,tx,ty,tz){ const vx=tx-o.pos.x,vy=ty-o.pos.y,vz=tz-o.pos.z,d=Math.hypot(vx,vy,vz)||1; let ye=Math.atan2(-vx,-vz)-o.yaw; ye=Math.atan2(Math.sin(ye),Math.cos(ye));
    return {dx:-clamp(ye*2.4,-1,1),dy:clamp((Math.asin(clamp(vy/d,-1,1))-o.pitch)*3,-1,1)}; }
  function guard(o,ctl){ const ah=o.pos.clone().addScaledVector(o.dir,160),g=Math.max(hgt(o.pos.x,o.pos.z),hgt(ah.x,ah.z),TT.cloudFloor?0:-5); if(o.pos.y-g<130||ah.y-g<90) ctl.dy=1; if(o.pos.y>1050) ctl.dy=-1;
    if(Math.hypot(o.pos.x,o.pos.z)>BOUND){ const s=steer(o,0,o.pos.y,0); ctl.dx=s.dx; } return ctl; }
  const ang=(o,p)=>{ const v=p.clone().sub(o.pos),d=v.length()||1; return [Math.acos(clamp(v.dot(o.dir)/d,-1,1)),d]; };
  const lead=(o,tg,bs)=>{ const d=o.pos.distanceTo(tg.pos); return tg.pos.clone().addScaledVector(tg.dir,tg.spd*d/bs); };
  function inputOf(p){ const k=env.keys; if(p.ai) return aiIn(p);
    if(two){ if(p.i===0) return {dx:(k.KeyD?1:0)-(k.KeyA?1:0),dy:(k.KeyW?1:0)-(k.KeyS?1:0),miss:env.hit('KeyF'),dodge:env.hit('KeyG')}; return {dx:(k.ArrowRight?1:0)-(k.ArrowLeft?1:0),dy:(k.ArrowUp?1:0)-(k.ArrowDown?1:0),miss:env.hit('Comma')||env.hit('Enter'),dodge:env.hit('Period')||env.hit('ShiftRight')}; }
    if(host&&p.i===1){ const o={dx:rin.dx,dy:rin.dy,miss:rin.miss,dodge:rin.dodge}; rin.miss=rin.dodge=false; return o; }
    return {dx:(k.ArrowRight||k.KeyD?1:0)-(k.ArrowLeft||k.KeyA?1:0),dy:(k.ArrowUp||k.KeyW?1:0)-(k.ArrowDown||k.KeyS?1:0),miss:env.hit('KeyK')||env.hit('Space'),dodge:env.hit('KeyJ')}; }
  function aiIn(p){ let tg=null,td=1e9; for(const e of E){ const d=e.pos.distanceTo(p.pos); if(d<td){ td=d; tg=e; } } const ctl=tg?steer(p,...lead(p,tg,900).toArray()):steer(p,0,420,0); ctl.dx*=.9; guard(p,ctl);
    return {dx:ctl.dx,dy:ctl.dy,miss:!!tg&&p.miss>0&&Math.random()<.004,dodge:MS.some(m=>m.tg===p)&&Math.random()<.04}; }
  function hurt(p,d){ if(p.dead>0||p.inv>0||p.dodge>0||p.lives<=0) return; p.hp-=d; p.hitT=.2; if(Math.random()<.3) sfx('hurt'); if(p.hp<=0) die(p); }
  function die(p){ p.hp=0; p.lives--; p.dead=3; boom(p.pos,true); sfx('boom'); p.m.g.visible=false; if(p.lives>0) say((np>1?names[p.i]+' ':'')+'被擊落！還剩 '+p.lives+' 架','#ff6a6a'); if(host) ev.push('x|'+r1(p.pos.x)+'|'+r1(p.pos.y)+'|'+r1(p.pos.z)+'|1'); }
  function respawn(p){ const s=spawnAt(p.i),o=P.find(q=>q!==p&&q.dead<=0&&q.lives>0); if(o){ s.x=o.pos.x+40; s.y=Math.max(o.pos.y,hgt(o.pos.x,o.pos.z)+200); s.z=o.pos.z+120; }
    p.pos.set(s.x,s.y,s.z); p.yaw=o?o.yaw:Math.atan2(s.x,s.z); p.pitch=0; p.roll=0; p.hp=100; p.inv=3; p.m.g.visible=true; p.cp.set(s.x,s.y+8,s.z+30); }
  function killE(e,by){ boom(e.pos,true); sfx('boom'); quake=.3; if(host) ev.push('x|'+r1(e.pos.x)+'|'+r1(e.pos.y)+'|'+r1(e.pos.z)+'|1'); const i=E.indexOf(e); if(i>=0) E.splice(i,1); killMesh(e); for(const m of MS) if(m.tg===e) m.tg=null;
    const p=P[by]; if(e.ace){ for(const q of P) q.score+=Math.round(2000/np); phase='over'; PT=3; result=true; ace=null; say('擊落王牌「'+ST.ace+'」！'); sfx('win'); return; }
    kn++; if(p){ p.score+=100; p.kills++; p.miss=Math.min(6,p.miss+1); } if(kn<need) say('擊落！ '+kn+' / '+need,'#7ae8ff'); }
  function conclude(win){ if(ended) return; ended=true; if(pv){ env.end({}); return; } const sc=P.reduce((a,p)=>a+p.score,0); if(win&&!two&&!net) recWin(si); env.sfx(win?'win':'lose');
    env.end({title:win?'擊落王牌！過關':'任務失敗',big:sc+' 分',text:ST.name+'（王牌：'+ST.ace+'）'+(win?'':'　被導彈鎖定時按閃避翻滾；低空小心地形。'),score:!two&&!net&&win?sc:null,next:win&&!two&&!net&&si<STAGES.length-1}); }
  function fireGun(o,dirv,own){ for(const sx of [-1.6,1.6]){ const sp=o.pos.clone().addScaledVector(dirv,8); sp.x+=Math.cos(o.yaw)*sx; sp.z-=Math.sin(o.yaw)*sx; B.push({p:sp,v:dirv.clone().multiplyScalar(own>=0?950:760),l:own>=0?.9:1.0,o:own}); } }
  // ---- 連線 ----
  function snap(){ return {s:[P.map(p=>[r1(p.pos.x),r1(p.pos.y),r1(p.pos.z),r3(p.yaw),r3(p.pitch),r3(p.roll),Math.round(p.hp),p.lives,p.miss,r1(p.dead),p.score,p.fire,r1(p.dodge),r1(p.inv)]),
    E.map(e=>[e.id,r1(e.pos.x),r1(e.pos.y),r1(e.pos.z),r3(e.yaw),r3(e.pitch),r3(e.roll),Math.round(e.hp),Math.round(e.max),e.ace?1:0,e.fire,ENL.indexOf(e.L)]),
    MS.map(m=>[r1(m.p.x),r1(m.p.y),r1(m.p.z),r3(m.v.x),r3(m.v.y),r3(m.v.z)]),phase,kn,need],e:ev.splice(0)}; }
  if(net){
    if(client) net.onmsg=m=>{ if(m.s){ const s=m.s;
        s[0].forEach((a,i)=>{ const p=P[i]; if(!p) return; const wasDead=p.dead>0; if(i!==me){ p.tp=new V3(a[0],a[1],a[2]); p.tyaw=a[3]; p.tpi=a[4]; p.tro=a[5]; p.fire=a[11]; p.dodge=a[12]; }
          p.hp=a[6]; p.lives=a[7]; p.miss=a[8]; p.dead=a[9]; p.score=a[10]; p.inv=a[13]; if(!wasDead&&p.dead>0){ p.m.g.visible=false; } if(wasDead&&p.dead<=0){ p.m.g.visible=true; if(i===me) respawn(p); } });
        const seen={}; for(const q of s[1]){ seen[q[0]]=1; let e=E.find(x=>x.id===q[0]); if(!e){ e=q[9]?(ace=mkE(true,new V3(q[1],q[2],q[3]),q[4])):mkE(false,new V3(q[1],q[2],q[3]),q[4]); e.id=q[0]; }
          e.tp=new V3(q[1],q[2],q[3]); e.tyaw=q[4]; e.tpi=q[5]; e.tro=q[6]; if(q[7]<e.hp) e.hitT=.1; e.hp=q[7]; e.max=q[8]; e.fire=q[10]; }
        for(let i=E.length-1;i>=0;i--) if(!seen[E[i].id]){ killMesh(E[i]); if(E[i]===ace) ace=null; E.splice(i,1); }
        MS=s[2].map(q=>({p:new V3(q[0],q[1],q[2]),v:new V3(q[3],q[4],q[5])})); if(s[3]!==phase&&s[3]==='ace') ace=E.find(e=>e.ace)||null; phase=s[3]; kn=s[4];
        for(const e2 of m.e){ if(e2.startsWith('b:')){ const [tx,cl]=e2.slice(2).split('|'); ban={txt:tx,col:cl||'#ffd23f',t:0}; } else if(e2.startsWith('x|')){ const q=e2.split('|'); boom(new V3(+q[1],+q[2],+q[3]),q[4]==='1'); quake=.3; } else if(e2.startsWith('w|')){ if(+e2.slice(2)===me) P[me].warn=1.2; } else env.sfx(e2); } }
      else if(m.end) conclude(m.end[0]); };
    else { net.onmsg=(m,from)=>{ if(from===1){ if(m.i){ rin.dx=m.i[0]; rin.dy=m.i[1]; if(m.i[2]) rin.miss=true; if(m.i[3]) rin.dodge=true; } if(m.p&&P[1]&&P[1].dead<=0){ const p=P[1]; p.pos.set(m.p[0],m.p[1],m.p[2]); p.yaw=m.p[3]; p.pitch=m.p[4]; p.roll=m.p[5]; } } };
      net.onleave=i=>{ if(P[i]){ P[i].lives=0; P[i].dead=99; P[i].m.g.visible=false; } }; }
  }
  // ---- 每一格 ----
  function stepFx(dt){ for(const f of FX){ if(f.l<=0) continue; f.l-=dt; if(f.l<=0){ f.sp.visible=false; continue; } const u=1-f.l/f.L; if(f.v) f.sp.position.addScaledVector(f.v,dt); f.sp.scale.setScalar(lerp(f.s0,f.s1,u)); f.sp.material.opacity=f.k==='smoke'?(1-u)*.55:(1-u); }
    if(ban) ban.t+=dt; if(flash>0) flash-=dt; if(quake>0) quake-=dt; for(const p of P){ if(p.hitT>0) p.hitT-=dt; if(p.warn>0) p.warn-=dt; } for(const e of E) if(e.hitT>0) e.hitT-=dt;
    if(TT.storm&&Math.random()<dt*.12){ flash=.3; if(!pv) env.sfx('boom'); } }
  function trails(o,dt,col,own){ o.trT-=dt; if(o.trT>0) return; o.trT=low?.06:.035; const q=new T.Quaternion().setFromEuler(new T.Euler(o.pitch,o.yaw,o.roll,'YXZ'));
    const tl=new V3(...o.m.tail).applyQuaternion(q).add(o.pos); fx('smoke',tl,own?1.6:1.2,own?5:3.5,own?.9:.5,col);
    if(Math.abs(o.roll)>.6&&!low) for(const tp of o.m.tips){ fx('smoke',new V3(...tp).applyQuaternion(q).add(o.pos),.6,2.2,.5,'#ffffff'); }
    if(o.hp<(o.max||100)*.4) fx('smoke',o.pos,3,12,1.2,'#2a2a2e'); }
  function step(dt){ t+=dt; stepFx(dt);
    if(phase==='intro'){ PT-=dt; if(PT<=0){ phase='fight'; say(ST.name+'　擊落 '+need+' 架敵機！'); sfx('go'); spT=.5; } }
    if(phase==='over'){ PT-=dt; if(PT<=0){ if(host){ net.send(snap()); net.send({end:[result]}); } conclude(result); return; } }
    const al=P.filter(p=>p.dead<=0&&p.lives>0);
    // 玩家
    for(const p of P){ if(p.lives<=0&&p.dead<=0) continue; if(p.dead>0){ p.dead-=dt; if(p.dead<=0){ if(p.lives>0){ respawn(p); sfx('item'); } } continue; }
      if(p.inv>0) p.inv-=dt; if(p.dodge>0) p.dodge-=dt; if(p.dcd>0) p.dcd-=dt; if(p.fcd>0) p.fcd-=dt;
      const I=inputOf(p),ctl=guardSoft(p,{dx:I.dx||0,dy:I.dy||0});
      if(!(host&&p.i===1)) fly(p,ctl.dx,ctl.dy,dt,1.12,p.spd); else { const cp=Math.cos(p.pitch); p.dir.set(-Math.sin(p.yaw)*cp,Math.sin(p.pitch),-Math.cos(p.yaw)*cp); p.pos.addScaledVector(p.dir,p.spd*dt*.0); }
      const g=hgt(p.pos.x,p.pos.z);
      if(TT.cloudFloor&&p.pos.y<12){ p.pos.y=12; p.pitch=Math.max(p.pitch,.35); hurt(p,8); }
      else if(p.pos.y<Math.max(g,TT.cloudFloor?-1e9:0)+3){ if(p.inv>0){ p.pos.y=Math.max(g,0)+4; p.pitch=.45; } else { die(p); continue; } }
      if(I.dodge&&p.dcd<=0){ p.dodge=.8; p.dcd=3; sfx('skid'); for(let k=0;k<8;k++) fx('fire',p.pos.clone().addScaledVector(p.dir,-6),4,7,1.2,'#fff2a0',new V3((Math.random()-.5)*60,-20-Math.random()*30,(Math.random()-.5)*60).addScaledVector(p.dir,-40)); for(const m of MS) if(m.tg===p) m.tg=null; }
      // 鎖定：畫面中間附近最近的敵機
      let lb=null,la=.42; for(const e of E){ const [a,d]=ang(p,e.pos); if(d<1400&&a<la){ la=a; lb=e; } } p.lock=lb;
      if(I.miss&&p.miss>0&&phase!=='intro'){ p.miss--; MS.push({p:p.pos.clone().addScaledVector(p.dir,6).add(new V3(0,-1.5,0)),v:p.dir.clone(),spd:p.spd+40,o:p.i,tg:lb,l:6}); sfx('boost'); }
      // 機槍：敵機在準星附近就自動開火，子彈會稍微修正到提前量
      p.fire=0; let gt=null,ga=.15; for(const e of E){ const [a,d]=ang(p,e.pos); if(d<720&&a<ga){ ga=a; gt=e; } }
      if(gt&&phase!=='intro'){ p.fire=1; if(p.fcd<=0){ p.fcd=.09; const tp=lead(p,gt,950),dv=tp.sub(p.pos).normalize(); dv.x+=(Math.random()-.5)*.012; dv.y+=(Math.random()-.5)*.012; dv.normalize(); fireGun(p,dv,p.i); if(Math.random()<.35) sfx('click'); } }
      trails(p,dt,p.smoke,true); }
    if(client) return;
    // 敵機出現
    if(phase==='fight'){ spT-=dt; const n=E.filter(e=>!e.ace).length; if(spT<=0&&n<ST.maxE+(np>1?1:0)&&kn+n<need){ spawnE(false); spT=2.2-ST.k; }
      if(kn>=need&&!ace){ phase='ace'; ace=spawnE(true); say('王牌「'+ST.ace+'」出現！','#ff6a6a'); sfx('beep'); if(ST.k>.5){ spawnE(false); } } }
    // 敵機 AI：追最近的玩家，被咬住就亂閃；對準了就開火
    for(const e of E.slice()){ let tg=null,td=1e9; for(const p of al){ const d=p.pos.distanceTo(e.pos); if(d<td){ td=d; tg=p; } }
      let ctl; if(tg){ const bl=lead(e,tg,760); e.mT=(e.mT==null?5+Math.random()*3:e.mT)-dt; if(e.mT<=0){ e.ext=!e.ext; e.mT=e.ext?2.5+Math.random()*1.5:5+Math.random()*3; } /* 追一陣子就拉開距離再回頭，不會一直繞圈 */
          ctl=e.ext?steer(e,e.pos.x+(e.pos.x-tg.pos.x),e.pos.y,e.pos.z+(e.pos.z-tg.pos.z)):steer(e,bl.x,bl.y,bl.z); const [ba,bd]=ang(tg,e.pos); e.jT-=dt;
          e.jcd-=dt; if(ba<.3&&bd<500&&e.jT<=0&&e.jcd<=0){ e.jT=.8+Math.random()*.8; e.jcd=e.jT+ST.jcd*(e.ace?.8:1)*(.7+Math.random()*.6); e.jx=Math.random()<.5?-1:1; e.jy=(Math.random()-.5)*2; } /* 被咬住時亂閃一陣子，閃完會有空檔 */
          if(e.jT>0){ ctl.dx=e.jx; ctl.dy=e.jy*(e.ace?.9:.6); }
          if(td<70){ ctl.dy=1; }
          const [ea]=ang(e,bl); e.fire=0; e.fcd-=dt; if(ea<.11&&td<560&&phase!=='intro'){ e.fire=1; if(e.fcd<=0){ e.fcd=1/(6*ST.efire); const dv=bl.sub(e.pos).normalize(); dv.x+=(Math.random()-.5)*ST.eacc*2; dv.y+=(Math.random()-.5)*ST.eacc*2; dv.normalize(); fireGun(e,dv,-1); } }
          e.mcd-=dt; if(e.mcd<=0&&td<1300){ e.mcd=ST.amis; MS.push({p:e.pos.clone().addScaledVector(e.dir,6),v:e.dir.clone(),spd:e.spd+20,o:-1,tg,l:7}); tg.warn=1.5; if(host) ev.push('w|'+tg.i); sfx('beep'); } }
      else ctl=steer(e,0,500,0);
      guard(e,ctl); fly(e,ctl.dx,ctl.dy,dt,e.turn,e.spd); if(e.pos.y<hgt(e.pos.x,e.pos.z)+3) e.pos.y=hgt(e.pos.x,e.pos.z)+60; trails(e,dt,'#ffffff',false); }
    // 子彈
    const tmp=new V3(); for(let i=B.length-1;i>=0;i--){ const b=B[i]; b.l-=dt; const p0=b.p.clone(); b.p.addScaledVector(b.v,dt); let hit=false;
      const segHit=(c0,rad)=>{ tmp.copy(c0).sub(p0); const sv=b.p.clone().sub(p0),L2=sv.lengthSq()||1,u=clamp(tmp.dot(sv)/L2,0,1); return sv.multiplyScalar(u).add(p0).distanceTo(c0)<rad; };
      if(b.o>=0){ for(const e of E) if(segHit(e.pos,e.ace?10:8)){ e.hp-=1; e.hitT=.08; hit=true; if(Math.random()<.3) fx('fire',b.p,2,6,.15,'#fff0b0'); if(e.hp<=0) killE(e,b.o); break; } }
      else for(const p of al) if(segHit(p.pos,6.5)){ hurt(p,ST.edmg); hit=true; break; }
      if(hit||b.l<=0||b.p.y<hgt(b.p.x,b.p.z)) B.splice(i,1); }
    // 導彈：追目標，太近就爆
    for(let i=MS.length-1;i>=0;i--){ const m=MS[i]; m.l-=dt; const pl=m.o>=0; if(m.tg&&(m.tg.dead>0||(m.tg.hp!=null&&m.tg.hp<=0)||(!pl&&m.tg.dodge>0))) m.tg=null;
      if(m.tg){ const want=m.tg.pos.clone().sub(m.p).normalize(); m.v.lerp(want,Math.min(1,(pl?2.6:1.25)*dt)).normalize(); }
      m.spd=Math.min(pl?470:300,m.spd+(pl?260:120)*dt); m.p.addScaledVector(m.v,m.spd*dt); m.trT=(m.trT||0)-dt; if(m.trT<=0){ m.trT=low?.05:.025; fx('smoke',m.p,1.4,6,1.2,'#e8e8e8'); }
      let hit=null; if(pl){ for(const e of E) if(e.pos.distanceTo(m.p)<11){ hit=e; break; } } else for(const p of al) if(p.pos.distanceTo(m.p)<9&&p.dodge<=0){ hit=p; break; }
      if(hit){ boom(m.p,false); if(host) ev.push('x|'+r1(m.p.x)+'|'+r1(m.p.y)+'|'+r1(m.p.z)+'|0'); sfx('boom'); if(pl){ hit.hp-=hit.ace?22:12; hit.hitT=.2; if(hit.hp<=0) killE(hit,m.o); } else hurt(hit,34); MS.splice(i,1); continue; }
      if(m.l<=0||m.p.y<hgt(m.p.x,m.p.z)){ boom(m.p,false); MS.splice(i,1); } }
    if(phase!=='over'&&P.every(p=>p.lives<=0)){ phase='over'; PT=2.6; result=false; say('全軍覆沒…','#ff6a6a'); sfx('lose'); }
    if(pv&&t>70&&phase!=='over'){ phase='over'; PT=.5; result=false; } }
  function guardSoft(p,ctl){ if(p.pos.y>1150) ctl.dy=Math.min(ctl.dy,-.6); if(Math.hypot(p.pos.x,p.pos.z)>BOUND+150){ const s=steer(p,0,p.pos.y,0); ctl.dx=s.dx; } return ctl; }
  function camStep(dt){ for(const p of P){ if(p.dead>0||p.lives<=0) continue; e0.set(p.pitch,p.yaw,p.roll); q0.setFromEuler(e0); const up=UPV.set(0,1,0).applyQuaternion(q0); p.cp.lerp(pr.copy(p.pos).addScaledVector(p.dir,-27).addScaledVector(up,7.5),1-Math.exp(-dt*7)); } }
  function update(dt){ dt=Math.min(dt,1/20); updateIn(dt); camStep(dt); }
  function updateIn(dt){
    if(client){ const p=P[me],k=env.keys,I={dx:(k.ArrowRight||k.KeyD?1:0)-(k.ArrowLeft||k.KeyA?1:0),dy:(k.ArrowUp||k.KeyW?1:0)-(k.ArrowDown||k.KeyS?1:0),miss:env.hit('KeyK')||env.hit('Space'),dodge:env.hit('KeyJ')};
      t+=dt; stepFx(dt);
      if(p.dead<=0&&p.lives>0){ const ctl=guardSoft(p,{dx:I.dx,dy:I.dy}); fly(p,ctl.dx,ctl.dy,dt,1.12,p.spd); const g=hgt(p.pos.x,p.pos.z); if(p.pos.y<Math.max(g,TT.cloudFloor?12:0)+3){ p.pos.y=Math.max(g,TT.cloudFloor?12:0)+3; p.pitch=Math.max(p.pitch,.3); } trails(p,dt,p.smoke,true);
        let lb=null,la=.42; for(const e of E){ const [a,d]=ang(p,e.pos); if(d<1400&&a<la){ la=a; lb=e; } } p.lock=lb; p.fire=E.some(e=>{ const [a,d]=ang(p,e.pos); return d<720&&a<.15; })?1:0; if(p.dcd>0) p.dcd-=dt; if(p.dodge>0) p.dodge-=dt; if(I.dodge&&p.dcd<=0){ p.dcd=3; p.dodge=.8; } }
      sendT-=dt; if(sendT<=0||I.miss||I.dodge){ sendT=1/20; net.send({i:[I.dx,I.dy,I.miss?1:0,I.dodge?1:0],p:[r1(p.pos.x),r1(p.pos.y),r1(p.pos.z),r3(p.yaw),r3(p.pitch),r3(p.roll)]}); }
      const f=Math.min(1,dt*10),wa=(a,b)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*f;
      for(const o of P.concat(E)){ if(o===p||!o.tp) continue; o.pos.lerp(o.tp,f); o.yaw=wa(o.yaw,o.tyaw); o.pitch+=(o.tpi-o.pitch)*f; o.roll+=(o.tro-o.roll)*f; const cp=Math.cos(o.pitch); o.dir.set(-Math.sin(o.yaw)*cp,Math.sin(o.pitch),-Math.cos(o.yaw)*cp); if(o.m.g.visible||o.dead==null) trails(o,dt,o.smoke||'#ffffff',!!o.smoke);
        o.fcd=(o.fcd||0)-dt; if(o.fire&&o.fcd<=0){ o.fcd=o.smoke?.075:.15; fireGun(o,o.dir,o.smoke?o.i:-1); } }
      if(p.fire){ p.fcd=(p.fcd||0)-dt; if(p.fcd<=0){ p.fcd=.075; let gt=null,ga=.15; for(const e of E){ const [a,d]=ang(p,e.pos); if(d<720&&a<ga){ ga=a; gt=e; } } fireGun(p,gt?lead(p,gt,950).sub(p.pos).normalize():p.dir,p.i); } }
      for(let i=B.length-1;i>=0;i--){ const b=B[i]; b.l-=dt; b.p.addScaledVector(b.v,dt); if(b.l<=0) B.splice(i,1); }
      for(const m of MS){ m.p.addScaledVector(m.v,300*dt); fx('smoke',m.p,1.4,6,1,'#e8e8e8'); }
      return; }
    if(ended) return; step(dt); if(host){ sendT-=dt; if(sendT<=0){ sendT=1/20; net.send(snap()); } } }
  // ---- 畫面 ----

  function placeMeshes(dt){ for(const o of P.concat(E)){ const g=o.m.g; if(o.dead>0){ g.visible=false; continue; } if(o.lives!=null&&o.lives<=0){ g.visible=false; continue; } g.visible=true;
      const spin=o.dodge>0?(1-o.dodge/.8)*TAU:0; e0.set(o.pitch,o.yaw,o.roll+spin); g.quaternion.setFromEuler(e0); g.position.copy(o.pos); if(o.inv>0&&!(o.dodge>0)) g.visible=Math.sin(t*28)>-.3;
      for(const f of o.m.flames){ const s=.85+Math.random()*.3; f.scale.set(1,1,s*(o.fire?1.15:1)); } if(o.m.prop) o.m.prop.rotation.z+=dt*40;
      if(TT.night) for(const n of o.m.nav) n.scale.setScalar(Math.sin(t*6+o.pos.x)>0?2.2:1.2); }
    let nP=0,nE=0; for(const b of B){ dum.position.copy(b.p); dum.lookAt(pr.copy(b.p).add(b.v)); dum.updateMatrix(); if(b.o>=0){ if(nP<400) BMP.setMatrixAt(nP++,dum.matrix); } else if(nE<400) BME.setMatrixAt(nE++,dum.matrix); }
    BMP.count=nP; BME.count=nE; BMP.instanceMatrix.needsUpdate=true; BME.instanceMatrix.needsUpdate=true;
    MSM.forEach((g,i)=>{ const m=MS[i]; if(!m){ g.visible=false; return; } g.visible=true; g.position.copy(m.p); g.lookAt(pr.copy(m.p).sub(m.v)); });
    water.material.map&&(water.material.map.offset.x=t*.003); }
  function camFor(p,dt){ const cam=p.cam; e0.set(p.pitch,p.yaw,p.roll); q0.setFromEuler(e0); const up=new V3(0,1,0).applyQuaternion(q0);
    if(p.dead<=0&&p.lives>0){ cam.position.copy(p.cp); cam.up.copy(UP).lerp(up,.4).normalize(); cam.lookAt(pr.copy(p.pos).addScaledVector(p.dir,40).addScaledVector(up,3)); }
    else { cam.position.copy(p.cp); cam.lookAt(p.pos); }
    if(quake>0||p.hitT>0||TT.wind){ const s=Math.max(quake,p.hitT)*1.5+(TT.wind?.15:0); cam.position.x+=(Math.random()-.5)*s; cam.position.y+=(Math.random()-.5)*s; }
    cam.updateMatrixWorld(); }
  let lastT=performance.now();
  function draw(){ const now=performance.now(),dt=Math.min(.05,(now-lastT)/1000); lastT=now; placeMeshes(dt);
    const views=two?[[P[0],0,0,W,H/2],[P[1],0,H/2,W,H/2]]:[[P[client||host?me:0],0,0,W,H]];
    r.setScissorTest(two); for(const [p,vx,vy,vw,vh] of views){ camFor(p,dt); const cam=p.cam; sky.position.copy(cam.position); sunSp.position.copy(cam.position).addScaledVector(sunDir,4600);
      if(rain){ const pos=rain.pos,fall=TT.ash?40:TT.dust?30:420,dy=TT.dust?0:fall*dt; for(let i=0;i<rain.n;i++){ let x=pos[i*6],y=pos[i*6+1],z=pos[i*6+2]; y-=dy; if(TT.dust||TT.ash) x+=60*dt;
          const rx=x-cam.position.x,ry=y-cam.position.y,rz=z-cam.position.z; if(Math.abs(rx)>150||Math.abs(ry)>100||Math.abs(rz)>150){ x=cam.position.x+(Math.random()-.5)*300; y=cam.position.y+(Math.random()-.3)*200; z=cam.position.z+(Math.random()-.5)*300; }
          pos[i*6]=x; pos[i*6+1]=y; pos[i*6+2]=z; const L=TT.ash||TT.dust?.8:6; pos[i*6+3]=x+(TT.ash||TT.dust?L:-p.dir.x*2); pos[i*6+4]=y+(TT.ash||TT.dust?.3:L); pos[i*6+5]=z-p.dir.z*2; } rain.geo.attributes.position.needsUpdate=true; }
      hemi.intensity=TT.hemi+(flash>0?flash*4:0); const sy=H-vy-vh; r.setViewport(vx*Q,sy*Q,vw*Q,vh*Q); r.setScissor(vx*Q,sy*Q,vw*Q,vh*Q); r.render(scene,cam); }
    c.drawImage(cv,0,0,W,H); for(const [p,vx,vy,vw,vh] of views) hud(p,vx,vy,vw,vh); banner(); }
  const prj=(v,cam,vx,vy,vw,vh)=>{ pr.copy(v).project(cam); return [vx+(pr.x+1)/2*vw,vy+(1-pr.y)/2*vh,pr.z<1&&Math.abs(pr.x)<1.05&&Math.abs(pr.y)<1.05]; };
  function hud(p,vx,vy,vw,vh){ const cam=p.cam,sc=vh/H; c.save(); c.beginPath(); c.rect(vx,vy,vw,vh); c.clip(); c.textAlign='center'; c.textBaseline='middle';
    if(TT.night){ c.fillStyle='rgba(4,6,24,.12)'; c.fillRect(vx,vy,vw,vh); }
    if(flash>0){ c.fillStyle='rgba(235,240,255,'+flash*1.6+')'; c.fillRect(vx,vy,vw,vh); }
    if(p.hitT>0){ const g=c.createRadialGradient(vx+vw/2,vy+vh/2,vh*.3,vx+vw/2,vy+vh/2,vw*.7); g.addColorStop(0,'rgba(255,0,0,0)'); g.addColorStop(1,'rgba(255,30,30,'+p.hitT*2+')'); c.fillStyle=g; c.fillRect(vx,vy,vw,vh); }
    if(p.dead<=0&&p.lives>0){
      // 準星
      const [rx,ry]=prj(p.pos.clone().addScaledVector(p.dir,320),cam,vx,vy,vw,vh); c.strokeStyle=p.fire?'#ff6a5a':'rgba(140,255,170,.9)'; c.lineWidth=2; c.beginPath(); c.arc(rx,ry,14*sc+4,0,TAU); c.moveTo(rx-26*sc-6,ry); c.lineTo(rx-10,ry); c.moveTo(rx+10,ry); c.lineTo(rx+26*sc+6,ry); c.moveTo(rx,ry+10); c.lineTo(rx,ry+18*sc+4); c.stroke(); c.fillStyle=c.strokeStyle; c.fillRect(rx-1.5,ry-1.5,3,3);
      // 敵機框、鎖定、畫面外箭頭
      for(const e of E){ const [x,y,on]=prj(e.pos,cam,vx,vy,vw,vh),d=p.pos.distanceTo(e.pos),bs=clamp(1400/d,6,30)*sc+4,col=e.ace?'#ffd23f':'#ff5a4a';
        if(on){ c.strokeStyle=col; c.lineWidth=2; const k=bs*.45; c.beginPath(); for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ c.moveTo(x+sx*bs,y+sy*bs-sy*k); c.lineTo(x+sx*bs,y+sy*bs); c.lineTo(x+sx*bs-sx*k,y+sy*bs); } c.stroke();
          c.font='800 '+Math.round(10*sc+3)+'px '+TC; c.fillStyle=col; c.fillText((e.ace?ST.ace+' ':'')+Math.round(d)+'m',x,y+bs+9);
          if(e.hp<e.max){ c.fillStyle='rgba(0,0,0,.5)'; c.fillRect(x-bs,y-bs-8,bs*2,4); c.fillStyle=col; c.fillRect(x-bs,y-bs-8,bs*2*e.hp/e.max,4); }
          if(p.lock===e){ c.save(); c.translate(x,y); c.rotate(t*3); c.strokeStyle='#ff2a4a'; c.lineWidth=2.5; const s=bs+8; c.beginPath(); c.moveTo(0,-s); c.lineTo(s,0); c.lineTo(0,s); c.lineTo(-s,0); c.closePath(); c.stroke(); c.restore(); c.font='900 '+Math.round(10*sc+4)+'px '+TC; c.fillStyle='#ff2a4a'; c.fillText(p.miss>0?'鎖定':'沒導彈',x,y-bs-18); } }
        else { const v=e.pos.clone().applyMatrix4(cam.matrixWorldInverse),a=Math.atan2(-v.y,v.x),cx0=vx+vw/2,cy0=vy+vh/2,rx2=vw/2-26,ry2=vh/2-26,ax=cx0+Math.cos(a)*rx2,ay=cy0+Math.sin(a)*ry2;
          c.save(); c.translate(ax,ay); c.rotate(a); c.fillStyle=col; c.beginPath(); c.moveTo(12,0); c.lineTo(-6,-8); c.lineTo(-6,8); c.closePath(); c.fill(); c.restore(); } }
      // 警告
      const msl=MS.some(m=>m.tg===p)||p.warn>0,g=hgt(p.pos.x,p.pos.z); c.font='900 '+Math.round(16*sc+6)+'px '+TC; c.lineWidth=5; c.strokeStyle='#14122b';
      const warn=(txt,y,col)=>{ if(Math.sin(t*10)>-.2){ c.strokeText(txt,vx+vw/2,vy+y); c.fillStyle=col; c.fillText(txt,vx+vw/2,vy+y); } };
      if(msl&&!client||p.warn>0) warn(env.touch?'飛彈來襲！按閃避':'飛彈來襲！按 J 閃避',vh*.7,'#ff4a5a');
      else if(p.pos.y-Math.max(g,0)<90&&p.pitch<.1&&!TT.cloudFloor) warn('高度太低！拉高',vh*.7,'#ffb02a');
      else if(Math.hypot(p.pos.x,p.pos.z)>BOUND) warn('回到戰區',vh*.7,'#ffd23f');
      // 雷達
      const R0=(two?36:48),cxr=vx+vw-R0-12,cyr=vy+vh-R0-12; c.fillStyle='rgba(8,20,16,.6)'; c.beginPath(); c.arc(cxr,cyr,R0,0,TAU); c.fill(); c.strokeStyle='rgba(120,255,160,.5)'; c.lineWidth=1.2; c.beginPath(); c.arc(cxr,cyr,R0,0,TAU); c.moveTo(cxr,cyr-R0); c.lineTo(cxr,cyr+R0); c.moveTo(cxr-R0,cyr); c.lineTo(cxr+R0,cyr); c.stroke();
      const cy_=Math.cos(p.yaw),sy_=Math.sin(p.yaw),rs=R0/1600,dot=(o,col,s)=>{ const dx=o.pos.x-p.pos.x,dz=o.pos.z-p.pos.z; let lx=(dx*cy_-dz*sy_)*rs,lf=(-dx*sy_-dz*cy_)*rs; const L=Math.hypot(lx,lf); if(L>R0-3){ lx*=(R0-3)/L; lf*=(R0-3)/L; } c.fillStyle=col; c.beginPath(); c.arc(cxr+lx,cyr-lf,s,0,TAU); c.fill(); };
      for(const e of E) dot(e,e.ace?'#ffd23f':'#ff5a4a',e.ace?4:3); for(const q of P) if(q!==p&&q.dead<=0&&q.lives>0) dot(q,'#7ae8ff',3); c.fillStyle='#8aff9a'; c.beginPath(); c.moveTo(cxr,cyr-6); c.lineTo(cxr+4,cyr+4); c.lineTo(cxr-4,cyr+4); c.fill(); }
    // 左下：血量、命、導彈、閃避
    const bx=vx+12,bh=two?42:62,by=vy+vh-bh-10,bw=two?190:230; c.fillStyle='rgba(10,14,30,.66)'; c.fillRect(bx,by,bw,bh); c.fillStyle=p.L.color||'#5a8ad8'; c.fillRect(bx,by,5,bh);
    c.textAlign='left'; c.font='900 12px '+TC; c.fillStyle='#fff'; c.fillText(names[p.i]+'　'+p.score+' 分',bx+12,by+11); c.textAlign='right'; for(let k=0;k<LIVES;k++){ c.fillStyle=k<p.lives?'#ff6a8a':'rgba(255,255,255,.2)'; c.fillText('✈',bx+bw-8-k*15,by+11); }
    c.fillStyle='rgba(255,255,255,.15)'; c.fillRect(bx+12,by+21,bw-24,7); c.fillStyle=p.hp>50?'#3ed16a':p.hp>25?'#ffc21a':'#ff4d4d'; c.fillRect(bx+12,by+21,(bw-24)*Math.max(0,p.hp)/100,7);
    c.textAlign='left'; c.font='800 11px '+TC; c.fillStyle='#ffd23f'; c.fillText('導彈 '+'▮'.repeat(p.miss)+'　'+(p.dcd>0?'閃避 '+p.dcd.toFixed(1):'閃避 OK'),bx+12,by+(two?35:38)); if(!two){ c.fillStyle='rgba(255,255,255,.6)'; c.fillText('高度 '+Math.round(p.pos.y)+'　速度 '+Math.round(p.spd*6)+' km/h',bx+12,by+53); }
    if(p.dead>0&&p.lives>0){ c.textAlign='center'; c.font='900 20px '+TC; c.fillStyle='#fff'; c.fillText('重新出擊 '+Math.ceil(p.dead),vx+vw/2,vy+vh*.62); }
    // 上方：擊落進度／王牌血量
    c.textAlign='center'; if(phase==='fight'||phase==='intro'){ c.fillStyle='rgba(10,14,30,.6)'; c.fillRect(vx+vw/2-90,vy+8,180,22); c.font='900 12px '+TC; c.fillStyle='#fff'; c.fillText('擊落 '+Math.min(kn,need)+' / '+need+'　接著王牌「'+ST.ace+'」',vx+vw/2,vy+19); }
    const A=E.find(e=>e.ace); if(A){ c.fillStyle='rgba(10,14,30,.7)'; c.fillRect(vx+vw/2-160,vy+8,320,22); c.fillStyle='#ff4d6a'; c.fillRect(vx+vw/2-156,vy+12,312*Math.max(0,A.hp)/A.max,14); c.font='900 11px '+TC; c.fillStyle='#fff'; c.fillText('王牌 '+ST.ace,vx+vw/2,vy+19); }
    c.restore(); }
  function banner(){ if(!ban||ban.t>2) return; const u=Math.min(1,ban.t*6),s=1+(1-u)*.7; c.save(); c.translate(W/2,two?H/2:H*.3); c.scale(s,s); c.globalAlpha=Math.min(1,(2-ban.t)*3); c.textAlign='center'; c.textBaseline='middle'; c.font='900 34px '+TC; c.lineWidth=8; c.strokeStyle='#14122b'; c.strokeText(ban.txt,0,0); c.fillStyle=ban.col; c.fillText(ban.txt,0,0); c.restore(); }
  function destroy(){ scene.traverse(m=>{ if(m.geometry) m.geometry.dispose(); if(m.material){ if(m.material.map&&!Object.values(TEXC).includes(m.material.map)&&m.material.map!==PUFF&&m.material.map!==GLOW) m.material.map.dispose(); m.material.dispose(); } }); PUFF.dispose(); GLOW.dispose(); r.dispose(); try{ r.forceContextLoss(); }catch(e){} }
  return {update,draw,destroy,_dbg:{P,get E(){return E;},get phase(){return phase;},get kn(){return kn;},set kn(v){kn=v;},need,get MS(){return MS;},get B(){return B;},killAll(){ for(const e of E.slice()) killE(e,0); }}};
}
// 造型預覽：藍天白雲裡慢慢轉的 3D 飛機，可以拖曳旋轉
function viewer(host,look){ const T=window.THREE; if(!T) return null; const r=new T.WebGLRenderer({antialias:true}),w=host.clientWidth||360,h=host.clientHeight||200; r.setPixelRatio(Math.min(2,window.devicePixelRatio||1)); r.setSize(w,h,false); r.toneMapping=T.ACESFilmicToneMapping; r.toneMappingExposure=1.15;
  const cv=r.domElement; cv.style.cssText='width:100%;height:100%;display:block;touch-action:none;cursor:grab'; host.appendChild(cv);
  const scene=new T.Scene(),bg=document.createElement('canvas'); bg.width=8; bg.height=256; { const g=bg.getContext('2d'),q=g.createLinearGradient(0,0,0,256); q.addColorStop(0,'#2f74cc'); q.addColorStop(.7,'#bfe0f8'); q.addColorStop(1,'#e8f4ff'); g.fillStyle=q; g.fillRect(0,0,8,256); } scene.background=new T.CanvasTexture(bg);
  scene.add(new T.HemisphereLight(0xdff0ff,0x5a7a5a,.85)); const d=new T.DirectionalLight(0xfff6e0,1.0); d.position.set(5,8,4); scene.add(d); const d2=new T.DirectionalLight(0xaaccff,.35); d2.position.set(-6,-2,-5); scene.add(d2);
  const PU=texPuff(T); for(let i=0;i<14;i++){ const s=new T.Sprite(new T.SpriteMaterial({map:PU,transparent:true,depthWrite:false,opacity:.85})); s.position.set((i%7-3)*14,-8-(i%3)*3,-30-(i*7%20)); s.scale.setScalar(16+i%4*4); scene.add(s); }
  const cam=new T.PerspectiveCamera(36,w/h,.5,400); let yaw=-2.3,pit=.28,dist=26,drag=null,auto=1,P=null;
  const set=L=>{ if(P){ scene.remove(P.g); P.g.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); } P=buildPlane(T,L||{}); scene.add(P.g); };
  set(look); const dn=e=>{ drag={x:e.clientX,y:e.clientY}; auto=0; cv.setPointerCapture&&cv.setPointerCapture(e.pointerId); },mv=e=>{ if(!drag) return; yaw-=(e.clientX-drag.x)*.01; pit=clamp(pit+(e.clientY-drag.y)*.01,-.6,1.2); drag={x:e.clientX,y:e.clientY}; },up=()=>{ drag=null; },wh=e=>{ e.preventDefault(); dist=clamp(dist+e.deltaY*.02,14,44); };
  cv.addEventListener('pointerdown',dn); cv.addEventListener('pointermove',mv); cv.addEventListener('pointerup',up); cv.addEventListener('wheel',wh,{passive:false}); let lt=performance.now();
  return {set,draw(){ const now=performance.now(),dt=Math.min(.05,(now-lt)/1000); lt=now; if(auto) yaw+=dt*.35; const W2=host.clientWidth||w,H2=host.clientHeight||h; if(Math.abs(W2-cv.width/r.getPixelRatio())>2){ r.setSize(W2,H2,false); cam.aspect=W2/H2; cam.updateProjectionMatrix(); }
      P.g.position.y=Math.sin(now/700)*.3; P.g.rotation.z=Math.sin(now/1100)*.08; for(const f of P.flames) f.scale.z=.85+Math.random()*.3; if(P.prop) P.prop.rotation.z+=dt*40;
      cam.position.set(Math.sin(yaw)*Math.cos(pit)*dist,Math.sin(pit)*dist,Math.cos(yaw)*Math.cos(pit)*dist); cam.lookAt(0,0,0); r.render(scene,cam); },
    destroy(){ cv.removeEventListener('wheel',wh); scene.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); r.dispose(); try{ r.forceContextLoss(); }catch(e){} cv.remove(); }}; }
function preview(ctx,w,h,L,t){ const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#2f74cc'); g.addColorStop(1,'#bfe0f8'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); jet2d(ctx,w/2,h/2,h/160,(L&&L.color)||'#5a8ad8',Math.sin(t)*.2,t,true); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).ace={name:'蒼穹王牌',tag:'SKY ACE 3D',color:'#2f74cc',online:true,maxPlayers:2,
  desc:'3D 追尾視角空戰！鏡頭跟在飛機後面，在海峽、群島、峽谷、雪山、雨林、雷雨、火山和極光夜空等 50 個戰場跟敵機纏鬥。機槍對準就自動開火，導彈會追蹤，被鎖定時翻滾閃避。打下敵機群後，王牌就會出現。可以兩個人一起合作。',
  goal:'打下指定數量的敵機，再擊落關底王牌就過關；三架飛機都被打下來就失敗。',
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  stageGoal:i=>STAGES[i].name+'（王牌：'+STAGES[i].ace+'）：'+TIPS[i]+' 先打下 '+STAGES[i].kills+' 架敵機。',
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人合作',kb:true}],
  help:[['← →','左右轉彎'],['↑ ↓','↑ 拉高、↓ 俯衝（放開會慢慢改平）'],['機槍','敵機在準星附近就自動開火'],['K 或 空白鍵','發射追蹤導彈（紅色菱形＝已鎖定）'],['J','翻滾閃避，甩掉來襲導彈'],['雙人','1P：WASD＋F 導彈、G 閃避　2P：方向鍵＋, 導彈、. 閃避']],
  touchHelp:[['方向盤','轉彎、拉高俯衝'],['導彈','發射追蹤導彈'],['閃避','翻滾甩掉導彈']],
  touch:{left:'dpad',right:[{l:'閃避',c:'KeyJ'},{l:'導彈',c:'KeyK',act:true}]},
  looks:[{key:'model',label:'機種',def:'jet',opts:PLANES},{key:'color',label:'機身顏色',type:'color',opts:['#5a8ad8','#2a3a5a','#c8202a','#e8a03a','#3a6a3a','#8a8e96','#f4f4f4','#14141a','#b98cff','#3ddbd9']},
    {key:'paint',label:'塗裝',def:'none',opts:PAINTS},{key:'pod',label:'配件',def:'none',opts:PODS},{key:'smoke',label:'尾煙顏色',type:'color',opts:['#ffffff','#ff5a5a','#ffd23f','#5ab0ff','#7aff8a','#ff7eb6']}],
  hubBest:()=>{ const n=STAGES.filter((s,i)=>hasWin(i)).length; return n?'打下 <b>'+n+' / '+STAGES.length+'</b> 位王牌':'尚無紀錄'; },
  stageBest:i=>hasWin(i)?'★ 贏過':'',
  stageShow:(ctx,w,h,si,t)=>art(ctx,w,h,si,t),preview,viewer,thumb:(ctx,w,h,t)=>art(ctx,w,h,0,t),load,ready:()=>!!window.THREE,create};
})();
