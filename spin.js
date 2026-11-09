// 陀螺旋風戰：斜上方視角的戰鬥陀螺對戰。玩法參考現在流行的第四代比賽規則：
// 開賽前用方向鍵選落點，裁判喊「3、2、1，GO SHOOT！」就發射，之後陀螺自己轉、自己撞；場邊齒輪軌道會讓陀螺「極限衝刺」。
// 四種終結：旋轉勝利 1 分、擊飛勝利 2 分（黃色擊飛區域或飛出護欄）、爆裂勝利 2 分、極限勝利 3 分（紅色極限區域），先拿 4 分的贏；每人帶 3 顆輪流上場。
// 單人、同機雙人、連線最多 2 人（房主運算，客人只送落點按鍵）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,R1=v=>Math.round(v*10)/10,hyp=Math.hypot;
const AR=200,RAD=19,S=1.45,SQ=.6,CX=400,CY=284,TS=1.18; /* TS：陀螺畫大一點比較清楚 */
const sx=x=>CX+x*S,sy=y=>CY+y*S*SQ;
const DIP=18,sz=(x,y)=>sy(y)+DIP*Math.max(0,1-(x*x+y*y)/(AR*AR)); /* 碗面中間比較低，看起來有深度 */
const LPOS=[[-AR-26,-6],[AR+26,-6]],LZ=96,LD=1.3,PF=.55,REFX=650,REFY=214; /* 兩位選手的發射器位置、高度、發射時間（前 PF 拉線、後面飛出去）；裁判站的位置 */
const PCOL=['#ff4d4d','#3d8bff','#3ed16a','#ffc21a'];
const TYPES={攻擊:{atk:1.35,def:.85,sta:.88,wgt:1,emb:'tri'},防禦:{atk:.85,def:1.35,sta:1,wgt:1.3,emb:'hex'},持久:{atk:.8,def:1,sta:1.32,wgt:1.05,emb:'ring'},
  平衡:{atk:1.1,def:1.1,sta:1.08,wgt:1.1,emb:'star'},左旋:{atk:1.15,def:1,sta:1.06,wgt:1,emb:'bolt'}};
const BITS={flat:{mv:1.35,sta:.82,dash:1.25,wander:1,def:0,cruise:270,curv:.35,seek:3.2},taper:{mv:1,sta:1,dash:1,wander:.6,def:.08,cruise:170,curv:.25,seek:2.2},ball:{mv:.8,sta:1.22,dash:.8,wander:.3,def:.05,cruise:110,curv:.2,seek:.9},
  needle:{mv:.6,sta:1.12,dash:.55,wander:0,def:.2,cruise:60,curv:.1,seek:.5},rush:{mv:1.15,sta:.95,dash:1.65,wander:.7,def:0,cruise:300,curv:.45,seek:3.5}};
const BITK={O:'ball',HT:'taper',GB:'ball',GN:'needle',D:'needle',FB:'ball',Q:'flat',F:'flat',T:'taper',B:'ball',N:'needle',HN:'needle',P:'taper',S:'needle',GF:'rush',GP:'rush',U:'taper',C:'flat',TP:'ball',BS:'needle',M:'flat',A:'flat',DB:'ball',LF:'flat',LR:'rush',R:'rush',H:'taper'};
const BITN={O:'球形',HT:'高錐',GB:'齒輪球',GN:'齒輪針',D:'點狀',FB:'自由球',Q:'震擊',F:'平頭',T:'錐形',B:'球頭',N:'針頭',HN:'高針頭',P:'尖頭',S:'尖釘',GF:'齒輪平頭',GP:'齒輪尖頭',U:'聯合',C:'旋風',TP:'轉換點',BS:'彈性尖釘',M:'融合',A:'加速',DB:'圓盤球頭',LF:'低平頭',LR:'低衝刺',R:'衝刺',H:'H 軸'};
const TP_=(id,code,n,type,dir,rat,bit,sh,c,a,m,feat,x)=>({id,code,n,type,dir,rat,bit,sh,c,a,m,feat,x:x||{}});
const SILV='#c8ccd6',GOLD='#d8b04a',DARK='#4a4a56';
const TOPS=[
  TP_('dransword','BX-01','蒼龍神劍','攻擊',1,'3-60','F',{k:'hook',n:3,d:.34,h:2.4},'#2f6fe0','#e8eef8',SILV,'三片劍刃的經典攻擊型，入門最常見，撞擊力強。'),
  TP_('hellsscythe','BX-02','惡魔紅鐮','平衡',1,'4-60','T',{k:'hook',n:4,d:.24,h:1.6},'#c8242a','#2a2a30',SILV,'四片鐮刀刃攻守兼備，錐形底座穩又能進攻。'),
  TP_('wizardarrow','BX-03','魔導幻箭','持久',1,'4-80','B',{k:'round',n:6},'#2a9a5a','#d8b84a',GOLD,'圓弧外型減少碰撞損耗，球頭底座轉得久。'),
  TP_('knightshield','BX-04','騎士重盾','防禦',1,'3-80','N',{k:'round',n:8},'#2a4fa8','#e8e8f0',SILV,'厚重盾形刀刃擋下衝擊，針頭底座穩穩站在中央。'),
  TP_('knightlance','BX-13','騎士長槍','防禦',1,'4-80','HN',{k:'spike',n:2,d:.3,h:1.2},'#3a58c8','#f0f0f0',SILV,'兩支長槍狀刀刃，高針頭重心穩、防禦強。'),
  TP_('leonclaw','BX-15','雄獅獵爪','平衡',1,'5-60','P',{k:'claw',n:6,d:.2},'#e8a020','#7a3a10',GOLD,'六爪造型的獅子，尖頭底座可攻可守。'),
  TP_('rhinohorn','BX-19','戰犀號角','防禦',1,'3-80','S',{k:'wing',n:2,d:.28,h:2},'#8a8f9c','#3a3f4c',SILV,'犀牛角凸起把攻擊彈開，尖釘底座很耐撞。'),
  TP_('phoenixwing','BX-23','鳳凰飛翼','攻擊',1,'9-60','GF',{k:'wing',n:3,d:.36,h:1.6},'#d8341c','#ffb02a',GOLD,'重量級三翼攻擊型，齒輪平頭衝刺快、撞擊猛。',{wgt:1.2}),
  TP_('unicornsting','BX-26','獨角刺心','平衡',1,'5-60','GP',{k:'spike',n:5,d:.2,h:1.5},'#f2f2f8','#b98cff',SILV,'尖刺外緣配齒輪尖頭，衝刺完還能回到中央。'),
  TP_('weisstiger','BX-33','皓戰猛虎','平衡',1,'3-60','U',{k:'claw',n:3,d:.26},'#f4f4f8','#2a2a30',SILV,'白虎三爪，聯合底座兼顧移動與持久。'),
  TP_('cobaltdragoon','BX-34','蒼穹龍騎士','攻擊',-1,'2-60','C',{k:'rhook',n:4,d:.32,h:2.4},'#1f4fd0','#ffd23f',SILV,'左旋轉攻擊型，撞上右旋陀螺時能吸走對方轉速。'),
  TP_('crimsongaruda','BX-38','赫燃天鳳','平衡',1,'4-70','TP',{k:'wing',n:4,d:.15,h:2},'#e0402a','#ffd23f',GOLD,'寬大雙翼抓穩平衡，轉換點底座兼顧持久與反擊。'),
  TP_('tricerapress','BX-44','三角強襲','防禦',1,'M-85','BS',{k:'spike',n:3,d:.14,h:1},'#5a7a3a','#c8b48a',SILV,'三角龍頭盾防禦力高，彈性尖釘化解衝擊。'),
  TP_('samuraicalibur','BX-45','武士魂斬','平衡',1,'6-70','M',{k:'hook',n:2,d:.4,h:3},'#e8e8f0','#c8242a',SILV,'雙刀武士刃，一刀就能把對手砍出場。'),
  TP_('dranbuster','UX-01','蒼龍爆刃','攻擊',1,'1-60','A',{k:'hook',n:3,d:.42,h:1.4},'#1a5ae0','#ff7a3d',DARK,'超大刀刃的重攻擊型，加速底座衝刺力驚人。',{atk:1.08}),
  TP_('wizardrod','UX-03','魔導神杖','持久',1,'5-70','DB',{k:'round',n:4},'#3a4ab8','#d8b84a',GOLD,'目前賽場上（T0）極具代表性的超強持久型陀螺，表現極為穩定。',{sta:1.1}),
  TP_('impactdrake','UX-11','衝擊龍神','攻擊',1,'9-60','LR',{k:'hook',n:3,d:.26,h:2},'#7a3ad8','#ffd23f',SILV,'新手入坑推薦組合包常客，均衡好上手。'),
  TP_('sharkedge','UX-15','鮫鯊狂鱗','攻擊',1,'3-60','LF',{k:'hook',n:4,d:.3,h:2},'#2aa8c8','#f0f0f0',SILV,'具備強大下砍與彈飛對手的攻擊力，是攻擊手的熱門選擇。'),
  TP_('meteordragoon','UX-17','隕星龍騎士','攻擊',-1,'3-70','R',{k:'rhook',n:3,d:.34,h:2.2},'#3a2a8a','#ff4d4d',SILV,'支援左旋轉向，深受老玩家與特殊戰術喜愛。'),
  TP_('bulletgriffon','UX-19','子彈獅鷲','平衡',1,'3-85','H',{k:'hook',n:5,d:.2,h:1.4},'#d0262c','#20b894',SILV,'分離式子彈單位：激烈碰撞時內層子彈靠彈簧彈開，子彈衝去追撞對手，本體繼續旋轉維持持久。',{split:1}),
  TP_('pegasusblast','CX-07','天馬爆擊','攻擊',1,'1-60','A',{k:'wing',n:3,d:.3,h:2.4},'#f4f6fa','#3d8bff',SILV,'來自最新可拆解的 CX（客製）系統，具備高度爆發力。'),
  TP_('vipertail','BX-16','王蛇鞭尾','持久',1,'5-80','O',{k:'wing',n:3,d:.18,h:1.6},'#6a3ab8','#e8e8f0',SILV,'三條蛇尾般的刀刃減少撞擊損耗，球形軸心穩穩繞著場中央轉。'),
  TP_('drandagger','BX-20','蒼龍利刃','攻擊',1,'4-60','R',{k:'hook',n:6,d:.22,h:2},'#d02a2a','#ffd23f',SILV,'六片短刃連續快攻，衝刺軸心沿著軌道一路砍。'),
  TP_('hellschain','BX-21','惡魔鎖鏈','平衡',1,'5-60','HT',{k:'hook',n:5,d:.25,h:1.8},'#8a1a2a','#c8c8d0',SILV,'鎖鏈狀刀刃攻守兼備，高錐軸心能衝能守。'),
  TP_('wyverngale','BX-24','飛龍旋翼','持久',1,'5-80','GB',{k:'wing',n:4,d:.18,h:2},'#3ab88a','#e8e8f0',SILV,'飛龍翅膀造型的持久型，齒輪球軸心有時會衝刺閃避。'),
  TP_('sphinxcowl','BX-27','魔獸護甲','防禦',1,'9-80','GN',{k:'spike',n:3,d:.2,h:1.2},'#d8b04a','#2a2a30',GOLD,'獅身人面的厚重護甲，齒輪針軸心站得穩又能稍微移動。'),
  TP_('blackshell','BX-35','玄冥戰甲','防禦',1,'4-60','D',{k:'round',n:8},'#2a2a30','#8a96a8',DARK,'龜殼般的圓形外甲把攻擊滑開，防禦力是 BX 系列頂尖。'),
  TP_('leoncrest','UX-06','雄獅巔峰','防禦',1,'7-60','GN',{k:'claw',n:6,d:.16},'#e8a020','#f4f4f8',GOLD,'獅鬃般的六角外圈，防禦力 70，正面衝撞也推不動。'),
  TP_('silverwolf','UX-08','霜輝銀狼','持久',1,'3-80','FB',{k:'wing',n:6,d:.12,h:1.4},'#c8ccd6','#7a5ab8',SILV,'持久力 70 的頂尖持久型，自由球軸心能自己轉正、轉很久。'),
  TP_('tyrannobeat','BX-31','暴龍霸擊','攻擊',1,'4-70','Q',{k:'spike',n:4,d:.32,h:2.2},'#c84a2a','#2a2a30',SILV,'暴龍利齒的重攻擊型，震擊軸心橫衝直撞、攻擊力 65。')];
const TOP={}; TOPS.forEach(q=>TOP[q.id]=q);
const spinOfR=r=>clamp(40+(r-6000)/10000*60,40,100); /* 6,000 RPM→40、10,000→64、13,000→82、16,000 以上→100 */
const rpmTier=r=>r>=16000?{n:'極限',c:'#ff6bd6',say:'極限發射！'}:r>=14000?{n:'專業',c:'#3ed16a',say:'漂亮！專業級發射！'}:r>=10000?{n:'一般',c:'#9ae0ff',say:'發射！'}:{n:'初階',c:'#ffb02a',say:'力道不足……'};
/* 每顆陀螺的能力值（0～100）：攻擊、防禦、持久、衝刺、爆裂耐性。參考玩家資料站整理的數值與實戰評價 */
const AB={ /* 官方 App 數值（資料來源：beyblade.phstudy.org）：[攻擊,防禦,持久]＝機體，[衝刺,耐久]＝原廠軸心；惡魔紅鐮、魔導幻箭用 2.0 版數值 */
  dransword:[60,30,25,35,80],hellsscythe:[33,38,39,25,80],wizardarrow:[17,33,60,10,30],knightshield:[25,60,30,10,30],knightlance:[25,60,15,10,30],
  leonclaw:[40,40,20,25,80],rhinohorn:[20,50,30,10,30],phoenixwing:[65,30,20,40,80],unicornsting:[35,35,30,30,80],weisstiger:[45,30,25,20,80],
  cobaltdragoon:[65,20,30,45,80],crimsongaruda:[45,25,30,15,80],tricerapress:[20,65,15,5,30],samuraicalibur:[40,30,30,20,80],dranbuster:[75,25,15,40,80],
  wizardrod:[20,30,65,10,30],impactdrake:[75,25,10,35,80],sharkedge:[70,15,15,40,80],meteordragoon:[75,15,35,30,80],bulletgriffon:[45,45,40,15,80],pegasusblast:[75,20,20,40,80],
  vipertail:[30,20,50,10,30],drandagger:[50,25,25,30,80],hellschain:[35,40,25,25,80],wyverngale:[10,40,50,30,30],sphinxcowl:[35,55,10,30,30],
  blackshell:[10,65,25,10,30],leoncrest:[15,70,15,30,30],silverwolf:[20,35,70,5,30],tyrannobeat:[65,30,5,25,80]};
TOPS.forEach(q=>{ if(!AB[q.id]) AB[q.id]=[40,30,30,30,45]; });
const PK=(a,w,k)=>({a,w,k});
const STAGES=[
  {name:'新手練習場',stars:1,th:'gym',slope:1,fric:1,decay:1,pk:[PK(Math.PI/2,.24,'x'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'街頭對戰盤',stars:1,th:'street',slope:1,fric:1,decay:1,pk:[PK(Math.PI/2,.26,'x'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'寬口競技場',stars:2,th:'arena',slope:1,fric:1,decay:1,pk:[PK(Math.PI/2,.32,'x'),PK(.1,.28,'over'),PK(Math.PI-.1,.28,'over')]},
  {name:'冰晶競技場',stars:2,th:'ice',slope:1,fric:.35,decay:.85,pk:[PK(Math.PI/2,.26,'x'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'沙漠鬥技場',stars:3,th:'desert',slope:1.1,fric:1.7,decay:1.25,pk:[PK(Math.PI/2,.26,'x'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'四口袋競技場',stars:3,th:'twin',slope:1,fric:1,decay:1,pk:[PK(Math.PI/2,.2,'x'),PK(-Math.PI/2,.2,'over'),PK(0,.17,'over'),PK(Math.PI,.17,'over')]},
  {name:'熔岩火山場',stars:4,th:'lava',slope:1,fric:1,decay:1,lava:1,pk:[PK(Math.PI/2,.26,'x'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'星空低重力',stars:4,th:'space',slope:.5,fric:.8,decay:.9,pk:[PK(Math.PI/2,.26,'x'),PK(0,.22,'over'),PK(Math.PI,.22,'over')]},
  {name:'暴風競技場',stars:5,th:'storm',slope:1,fric:1,decay:1,wind:1,pk:[PK(Math.PI/2,.26,'x'),PK(0,.2,'over'),PK(Math.PI,.2,'over')]},
  {name:'冠軍決賽場',stars:5,th:'final',slope:1,fric:1,decay:1,pk:[PK(Math.PI/2,.24,'x'),PK(0,.19,'over'),PK(Math.PI,.19,'over')]}];
STAGES.forEach(s=>s.pk.forEach(p=>p.w*=p.k==='x'?.9:1.55)); /* v243：紅色極限區域（3 分）變窄、黃色擊飛區域（2 分）變寬，比賽不會太快結束 */
const TH={gym:{bg:['#1d2a44','#0e1526'],fl:['#f2f5f9','#a8b2c4'],rim:'#2a3550',acc:'#3d8bff',rail:'#5cf03c'},
  street:{bg:['#2a2230','#121018'],fl:['#d8d0c4','#8a8070'],rim:'#3a3038',acc:'#ff7a3d'},
  arena:{bg:['#1a1240','#08061a'],fl:['#dfe6ff','#8a94c8'],rim:'#2a2060',acc:'#b98cff'},
  ice:{bg:['#bfe6ff','#5a9ac8'],fl:['#f4fbff','#9cd2f0'],rim:'#4a7aa8',acc:'#3ddbd9'},
  desert:{bg:['#f0b870','#a0602a'],fl:['#f2dcaa','#c49a5a'],rim:'#7a4a22',acc:'#ffb02a'},
  twin:{bg:['#102a2a','#061212'],fl:['#e0f4ee','#86b8aa'],rim:'#1a4a42',acc:'#3ed16a'},
  lava:{bg:['#3a0c08','#120404'],fl:['#4a3a36','#241a18'],rim:'#2a1210',acc:'#ff5a1a'},
  space:{bg:['#0a0a2a','#000008'],fl:['#3a3e6a','#141630'],rim:'#22264a',acc:'#c8a0ff'},
  storm:{bg:['#3a4656','#141a24'],fl:['#cfd8e0','#7a8898'],rim:'#2a3440',acc:'#9ae0ff'},
  final:{bg:['#2a1a08','#0a0602'],fl:['#fff4d8','#c8a860'],rim:'#4a3410',acc:'#ffd23f'}};
const FIN={foul:{n:'發射失敗',p:1,col:'#ff5a5a'},spin:{n:'旋轉勝利',p:1,col:'#9ae0ff'},over:{n:'擊飛勝利',p:2,col:'#ffd23f'},burst:{n:'爆裂勝利',p:2,col:'#ff7a3d'},x:{n:'極限勝利',p:3,col:'#ff3d5a'}};
// 電腦對手：前面的關卡出入門機體，後面越來越強
const OPP=['dransword','knightshield','wizardarrow','hellsscythe','leonclaw','rhinohorn','unicornsting','weisstiger','cobaltdragoon','phoenixwing','crimsongaruda','tricerapress','samuraicalibur','knightlance','sharkedge','impactdrake','meteordragoon','dranbuster','pegasusblast','bulletgriffon','wizardrod','vipertail','drandagger','hellschain','wyverngale','sphinxcowl','blackshell','leoncrest','silverwolf','tyrannobeat'];
const BOTN=['旋風小子','鐵壁','流星','閃電','颶風','黑曜','赤焰','白狼','銀河','雷神'];
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function shade(hex,k){ const n=parseInt(hex.slice(1),16); let r=n>>16,g=n>>8&255,b=n&255; const f=v=>clamp(Math.round(k>0?v+(255-v)*k:v*(1+k)),0,255); return 'rgb('+f(r)+','+f(g)+','+f(b)+')'; }
const partsOf=L=>{ const id=L&&TOP[L.top]?L.top:L&&TOP[L.t1]?L.t1:'dransword'; return {top:id,blade:id,ratchet:TOP[id].rat,bit:TOP[id].bit}; };
const ratOf=r=>{ const tth=/^\d/.test(r)?+r[0]:5,hh=+r.split('-')[1]||70; return {teeth:tth,h:hh,res:.82+.05*Math.min(tth,8),low:hh<=60?1:hh<=70?.5:0,atk:hh<=60?1.06:hh<=70?1:.96}; };
// 3 對 3：三顆不能同一顆，棘輪、底座也不能重複
const clash=(d,slot,id)=>d.some((q,i)=>i!==slot&&(q.top===id||TOP[q.top].rat===TOP[id].rat||TOP[q.top].bit===TOP[id].bit));
function fixDeck(d){ d=d.map(q=>partsOf(q)); for(let i=0;i<d.length;i++){ const pre=d.slice(0,i); if(pre.some(q=>q.top===d[i].top||TOP[q.top].rat===TOP[d[i].top].rat||TOP[q.top].bit===TOP[d[i].top].bit)){ const ok=TOPS.find(t=>!pre.some(q=>q.top===t.id||TOP[q.top].rat===t.rat||TOP[q.top].bit===t.bit)); d[i]=partsOf({top:ok.id}); } } return d; }
// 比賽的三顆陀螺：以「我的造型」的第 1～3 顆為準；舊版存的出場順序（deck2）在造型還沒設定過時沿用一次
function myDeck(L){ L=L||{}; let raw=null,d=null; try{ raw=JSON.parse(localStorage.getItem('arcade.look.spin')||'null'); }catch(e){}
  if(L.t1&&TOP[L.t1]&&raw&&raw.t1) d=[{top:L.t1},{top:L.t2},{top:L.t3}];
  if(!d){ try{ d=JSON.parse(localStorage.getItem('arcade.spin.deck2')||'null'); }catch(e){} }
  if(!Array.isArray(d)||d.length!==3||d.some(q=>!q||!TOP[q.top])) d=[{top:L.t1&&TOP[L.t1]?L.t1:'dransword'},{top:L.t2&&TOP[L.t2]?L.t2:'knightshield'},{top:L.t3&&TOP[L.t3]?L.t3:'wizardrod'}];
  return fixDeck(d); }
function saveDeck(d){ try{ localStorage.setItem('arcade.spin.deck2',JSON.stringify(d.map(q=>({top:q.top})))); const L=JSON.parse(localStorage.getItem('arcade.look.spin')||'{}')||{}; L.t1=d[0].top; L.t2=d[1].top; L.t3=d[2].top; L.top=d[0].top; localStorage.setItem('arcade.look.spin',JSON.stringify(L)); }catch(e){} } /* 開賽前改了也存回我的造型 */
function botDeck(si,i){ const d=[]; for(let k=0;k<3;k++) d.push({top:OPP[(si*2+i+k*7)%OPP.length]}); return fixDeck(d); }
function statsOf(p){ const T0=TOP[p.top],Ty=TYPES[T0.type],B=BITS[BITK[T0.bit]],Rr=ratOf(T0.rat),x=T0.x;
  const [a,d,st,ds,br]=AB[T0.id]; /* 能力值換算成物理係數：數值越高越強 */
  return {atk:(.5+a/100*1.1)*Rr.atk,def:.75+d/100*.8+B.def,wgt:Ty.wgt*(x.wgt||1),sta:(.7+st/100*1.0)*B.sta,mv:B.mv,dash:B.dash*(.8+ds/100*.9),wander:B.wander,cruise:B.cruise*(.85+ds/100*.35),curv:B.curv,seek:B.seek,res:.7+br/100*.5+(Rr.res-.97)*.5,low:Rr.low,dir:T0.dir,ab:AB[T0.id]}; }
// 刀刃外形：極座標 r(θ)，回傳 0～1
function bladeR(sh,a){ const u=((a*sh.n/TAU)%1+1)%1,d=sh.d||.2,h=sh.h||2;
  if(sh.k==='hook') return 1-d+d*Math.pow(u,h);
  if(sh.k==='rhook') return 1-d+d*Math.pow(1-u,h);
  if(sh.k==='wing') return 1-d+d*Math.pow(Math.abs(Math.cos(a*sh.n/2)),h);
  if(sh.k==='spike') return 1-d+d*Math.pow(1-Math.abs(2*u-1),h);
  if(sh.k==='claw') return 1-d+d*Math.pow(u,2)*(u>.82?.55:1);
  return .95+.035*Math.cos(a*sh.n); }
function bladePath(c,sh,R){ c.beginPath(); for(let i=0;i<=120;i++){ const a=i/120*TAU,r=bladeR(sh,a)*R; i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r); } c.closePath(); }
function emblem(c,k,r){ c.beginPath();
  if(k==='tri'){ for(let i=0;i<3;i++){ const a=i/3*TAU-Math.PI/2; c.lineTo(Math.cos(a)*r,Math.sin(a)*r); } }
  else if(k==='hex'){ for(let i=0;i<6;i++){ const a=i/6*TAU; c.lineTo(Math.cos(a)*r,Math.sin(a)*r); } }
  else if(k==='ring'){ c.arc(0,0,r,0,TAU); c.moveTo(r*.5,0); c.arc(0,0,r*.5,0,TAU,true); }
  else if(k==='star'){ for(let i=0;i<10;i++){ const a=i/10*TAU-Math.PI/2,q=i%2?r*.45:r; c.lineTo(Math.cos(a)*q,Math.sin(a)*q); } }
  else { c.moveTo(-r*.2,-r); c.lineTo(r*.5,-r*.1); c.lineTo(0,0); c.lineTo(r*.3,r); c.lineTo(-r*.5,r*.05); c.lineTo(0,0); }
  c.closePath(); c.fill('evenodd'); }
// 畫一顆陀螺：(x,y)＝地面接觸點的畫面座標（顏色、外型照機體）
function softShadow(c,x,y,r,a){ c.save(); c.translate(x,y); c.scale(1,SQ); const g=c.createRadialGradient(0,0,0,0,0,r); g.addColorStop(0,'rgba(0,0,0,'+a+')'); g.addColorStop(.6,'rgba(0,0,0,'+a*.45+')'); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.beginPath(); c.arc(0,0,r,0,TAU); c.fill(); c.restore(); }
function drawTop(c,x,y,s,P,col,ang,frac,o){ o=o||{}; const B=TOP[P.top]||TOPS[0],sh=B.sh,R=20*s,tilt=o.tilt||0,ta=o.ta||0,tx=Math.cos(ta)*tilt*s,ty=Math.sin(ta)*tilt*s*SQ,bk=BITK[B.bit],rt=ratOf(B.rat),main=B.c,acc=B.a;
  c.save(); c.translate(x,y);
  if(!o.noShadow) softShadow(c,tx*.4+2*s,1.5*s,R*1.15,.5);
  // 底座：彩色圓柱＋照種類的尖端
  const bitC=B.x.split?'#d0262c':bk==='needle'?'#c8ccd6':bk==='ball'?'#8a8f9c':bk==='rush'?'#ffb02a':bk==='taper'?'#7a8090':'#5a5f6c',bx0=tx*.3,byT=-7*s+ty*.3;
  c.fillStyle='#14161b'; c.beginPath();
  if(bk==='needle'){ c.moveTo(bx0-3.4*s,byT+3*s); c.lineTo(bx0+3.4*s,byT+3*s); c.lineTo(0,1.2*s); }
  else if(bk==='ball'){ c.moveTo(bx0-4*s,byT+3*s); c.lineTo(bx0+4*s,byT+3*s); c.quadraticCurveTo(4.2*s,0,0,.6*s); c.quadraticCurveTo(-4.2*s,0,bx0-4*s,byT+3*s); }
  else { const w=bk==='taper'?1.6:bk==='rush'?3.6:2.8; c.moveTo(bx0-4.2*s,byT+3*s); c.lineTo(bx0+4.2*s,byT+3*s); c.lineTo(w*s,0); c.lineTo(-w*s,0); }
  c.closePath(); c.fill();
  const bg=c.createLinearGradient(bx0-6.5*s,0,bx0+6.5*s,0); bg.addColorStop(0,shade(bitC,-.5)); bg.addColorStop(.35,shade(bitC,.35)); bg.addColorStop(1,shade(bitC,-.6));
  c.fillStyle=bg; c.beginPath(); c.ellipse(bx0,byT+3*s,6.5*s,6.5*s*SQ,0,0,Math.PI); c.lineTo(bx0-6.5*s,byT); c.ellipse(bx0,byT,6.5*s,6.5*s*SQ,0,Math.PI,TAU); c.closePath(); c.fill();
  c.fillStyle=shade(bitC,.15); c.beginPath(); c.ellipse(bx0,byT,6.5*s,6.5*s*SQ,0,0,TAU); c.fill();
  // 棘輪：塑膠圓柱＋外緣凸塊（凸塊數＝型號第一個數字，高度照 60／70／80）
  const rh=6+(rt.h-55)/5,ry=-rh*s+ty*.6,rx=tx*.6,rc='#30343f';
  const rg=c.createLinearGradient(rx-13*s,0,rx+13*s,0); rg.addColorStop(0,'#1a1c22'); rg.addColorStop(.3,'#5a6070'); rg.addColorStop(.55,'#2c3038'); rg.addColorStop(1,'#121318');
  c.fillStyle=rg; c.beginPath(); c.ellipse(rx,ry+3*s,13*s,13*s*SQ,0,0,Math.PI); c.lineTo(rx-13*s,ry); c.ellipse(rx,ry,13*s,13*s*SQ,0,Math.PI,TAU); c.closePath(); c.fill();
  for(let i=0;i<rt.teeth;i++){ const a=ang+i/rt.teeth*TAU,w=.32,p=(r,t)=>[rx+Math.cos(t)*r*s,ry+Math.sin(t)*r*s*SQ];
    const q=[p(12,a-w),p(16,a-w*.7),p(16,a+w*.7),p(12,a+w)]; c.fillStyle=Math.sin(a)>0?'#4a505e':'#272a33';
    c.beginPath(); q.forEach((v,j)=>j?c.lineTo(v[0],v[1]+2.6*s):c.moveTo(v[0],v[1]+2.6*s)); for(let j=3;j>=0;j--) c.lineTo(q[j][0],q[j][1]); c.closePath(); c.fill();
    c.fillStyle='#5c6372'; c.beginPath(); q.forEach((v,j)=>j?c.lineTo(v[0],v[1]):c.moveTo(v[0],v[1])); c.closePath(); c.fill(); }
  c.fillStyle=rc; c.beginPath(); c.ellipse(rx,ry,13*s,13*s*SQ,0,0,TAU); c.fill();
  // 刀刃：金屬厚度
  const by=ry-(5*s),bx=rx+tx*.4;
  for(let k=5;k>=1;k--){ c.save(); c.translate(bx,by+k*1.1*s); c.scale(1,SQ); c.rotate(ang); bladePath(c,sh,R); c.fillStyle=k>3?'#16181e':shade(B.m,k>1?-.62:-.4); c.fill(); c.restore(); }
  c.save(); c.translate(bx,by); c.scale(1,SQ); c.rotate(ang);
  const rot=(x0,y0)=>[x0*Math.cos(-ang)-y0*Math.sin(-ang),x0*Math.sin(-ang)+y0*Math.cos(-ang)]; /* 光源固定在左上，不跟著轉 */
  // 拉絲金屬：圓錐漸層做出旋轉時的反光帶
  let g; if(c.createConicGradient){ g=c.createConicGradient(-ang-2.4,0,0); [[0,.7],[.1,-.1],[.2,.5],[.33,-.5],[.5,.15],[.62,-.35],[.75,.65],[.88,-.2],[1,.7]].forEach(v=>g.addColorStop(v[0],shade(B.m,v[1]))); }
  else { const p1=rot(-R,-R),p2=rot(R,R); g=c.createLinearGradient(p1[0],p1[1],p2[0],p2[1]); g.addColorStop(0,shade(B.m,.6)); g.addColorStop(.5,shade(B.m,-.2)); g.addColorStop(1,shade(B.m,-.45)); }
  bladePath(c,sh,R); c.fillStyle=g; c.fill();
  c.save(); bladePath(c,sh,R); c.clip();
  c.strokeStyle='rgba(255,255,255,.08)'; c.lineWidth=.6*s; for(let r=R*.45;r<R;r+=R*.07){ c.beginPath(); c.arc(0,0,r,0,TAU); c.stroke(); } /* 車床紋 */
  const o1=rot(1.3*s,1.3*s); c.translate(o1[0],o1[1]); bladePath(c,sh,R); c.lineWidth=2.4*s; c.strokeStyle='rgba(0,0,0,.45)'; c.stroke(); c.translate(-2*o1[0],-2*o1[1]); bladePath(c,sh,R); c.strokeStyle='rgba(255,255,255,.5)'; c.lineWidth=1.6*s; c.stroke(); c.restore();
  bladePath(c,sh,R); c.lineWidth=1*s; c.strokeStyle='rgba(12,14,20,.9)'; c.stroke();
  // 刀刃前緣的切削面
  const sp=sh.n; if(sh.k!=='round'){ c.strokeStyle='rgba(255,255,255,.55)'; c.lineWidth=.9*s; for(let i=0;i<sp;i++){ const a0=i/sp*TAU+(sh.k==='rhook'?TAU/sp-.02:.02); c.beginPath(); c.moveTo(Math.cos(a0)*R*.78,Math.sin(a0)*R*.78); c.lineTo(Math.cos(a0)*R*bladeR(sh,a0+.03),Math.sin(a0)*R*bladeR(sh,a0+.03)); c.stroke(); } }
  // 彩色塑膠層（有鏤空窗口露出底下金屬）
  const p1=rot(-R*.7,-R*.7),p2=rot(R*.7,R*.7),pg=c.createLinearGradient(p1[0],p1[1],p2[0],p2[1]); pg.addColorStop(0,shade(main,.35)); pg.addColorStop(.45,main); pg.addColorStop(1,shade(main,-.4));
  c.fillStyle=pg; bladePath(c,sh,R*.74);
  for(let i=0;i<sp;i++){ const a0=i/sp*TAU+TAU/sp*.5; c.moveTo(Math.cos(a0)*R*.62,Math.sin(a0)*R*.62); c.arc(0,0,R*.62,a0,a0+TAU/sp*.22); c.arc(0,0,R*.5,a0+TAU/sp*.22,a0,true); c.closePath(); }
  c.fill('evenodd'); c.lineWidth=.8*s; c.strokeStyle=shade(main,-.6); c.stroke();
  // 配色條紋（斜向，順著旋轉方向）
  c.fillStyle=acc; for(let i=0;i<sp;i++){ const a0=i/sp*TAU+(B.dir<0?.55:.12),w=TAU/sp*.2,sk=.18*B.dir; c.beginPath(); c.moveTo(Math.cos(a0)*R*.4,Math.sin(a0)*R*.4); c.lineTo(Math.cos(a0+sk)*R*.7,Math.sin(a0+sk)*R*.7); c.lineTo(Math.cos(a0+sk+w)*R*.7,Math.sin(a0+sk+w)*R*.7); c.lineTo(Math.cos(a0+w)*R*.4,Math.sin(a0+w)*R*.4); c.closePath(); c.fill(); }
  if(sh.k==='round'){ c.strokeStyle=acc; c.lineWidth=1.8*s; c.beginPath(); c.arc(0,0,R*.84,0,TAU); c.stroke(); }
  // 金屬鉚釘
  for(let i=0;i<sp;i++){ const a0=i/sp*TAU+TAU/sp*.85,x0=Math.cos(a0)*R*.46,y0=Math.sin(a0)*R*.46; c.fillStyle='#22252c'; c.beginPath(); c.arc(x0,y0,1.5*s,0,TAU); c.fill(); c.fillStyle=SILV; c.beginPath(); c.arc(x0,y0,1*s,0,TAU); c.fill(); }
  // 中央鎖芯（Lock Chip）
  if(B.x.split){ c.fillStyle=o.split?'#0a0b0e':'#1fa889'; c.beginPath(); c.arc(0,0,R*.47,0,TAU); c.fill(); if(o.split){ c.strokeStyle='#20b894'; c.lineWidth=1.4*s; for(let i=0;i<3;i++){ const a0=i/3*TAU; c.beginPath(); c.arc(0,0,R*.4,a0,a0+.9); c.stroke(); } } }
  if(!(B.x.split&&o.split)){ c.fillStyle='#101218'; c.beginPath(); c.arc(0,0,R*.37,0,TAU); c.fill();
  const cg=c.createLinearGradient(p1[0]*.5,p1[1]*.5,p2[0]*.5,p2[1]*.5); cg.addColorStop(0,'#f4f6fa'); cg.addColorStop(.5,'#8a90a0'); cg.addColorStop(1,'#3a3e48');
  c.strokeStyle=cg; c.lineWidth=1.6*s; c.beginPath(); c.arc(0,0,R*.33,0,TAU); c.stroke();
  const chg=c.createRadialGradient(...rot(-R*.1,-R*.1),0,0,0,R*.28); chg.addColorStop(0,shade(acc,.35)); chg.addColorStop(1,shade(acc,-.45));
  c.fillStyle=chg; c.beginPath(); c.arc(0,0,R*.27,0,TAU); c.fill();
  c.fillStyle='#14161c'; emblem(c,TYPES[B.type].emb,R*.19); c.fillStyle='#fff'; emblem(c,TYPES[B.type].emb,R*.14); }
  c.restore();
  // 鎖芯光澤
  c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=1.2*s; c.beginPath(); c.ellipse(bx,by,R*.22,R*.22*SQ,0,3.4,4.6); c.stroke();
  // 高速旋轉的殘影與光澤
  if(frac>.15&&!o.still){ c.save(); c.translate(bx,by); c.scale(1,SQ); const al=Math.min(.6,frac*.65); /* 高速旋轉：刀刃糊成一圈 */
    c.globalAlpha=al*.55; c.fillStyle=shade(B.m,-.1); c.beginPath(); c.arc(0,0,R*.99,0,TAU); c.arc(0,0,R*.72,0,TAU,true); c.fill();
    if(c.createConicGradient){ const cg=c.createConicGradient(ang*.37,0,0); for(let i=0;i<=16;i++) cg.addColorStop(i/16,i%2?'rgba(255,255,255,.55)':'rgba(255,255,255,0)'); c.globalAlpha=al; c.fillStyle=cg; c.beginPath(); c.arc(0,0,R*1.01,0,TAU); c.arc(0,0,R*.36,0,TAU,true); c.fill(); }
    c.globalAlpha=frac*.18; c.fillStyle=main; c.beginPath(); c.arc(0,0,R*.74,0,TAU); c.fill(); c.restore(); }
  c.fillStyle='rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(bx-R*.32,by-R*.32*SQ,R*.3,R*.12,-.5,0,TAU); c.fill();
  if(o.ring){ c.strokeStyle=o.ring; c.lineWidth=3; c.beginPath(); c.ellipse(0,2*s,R*1.25,R*1.25*SQ,0,0,TAU); c.stroke(); }
  c.restore(); }
// 子彈獅鷲分離出來的子彈單位（綠色內核＋紅色 H 軸）
function drawBullet(c,X,Y,ang,frac){ const s=S*TS,r=8.5*s; softShadow(c,X+2,Y+1,r*1.3,.45);
  c.save(); c.translate(X,Y);
  c.fillStyle='#14161b'; c.beginPath(); c.moveTo(-3*s,-6*s); c.lineTo(3*s,-6*s); c.lineTo(1.4*s,0); c.lineTo(-1.4*s,0); c.closePath(); c.fill();
  c.fillStyle='#d0262c'; c.beginPath(); c.ellipse(0,-5*s,4*s,4*s*SQ,0,0,TAU); c.fill();
  const y0=-9*s; c.fillStyle='#0f6e58'; c.beginPath(); c.ellipse(0,y0+2.4*s,r,r*SQ,0,0,Math.PI); c.lineTo(-r,y0); c.ellipse(0,y0,r,r*SQ,0,Math.PI,TAU); c.closePath(); c.fill();
  c.translate(0,y0); c.scale(1,SQ); c.rotate(ang); const g=c.createLinearGradient(-r,-r,r,r); g.addColorStop(0,'#7af0d0'); g.addColorStop(.5,'#20b894'); g.addColorStop(1,'#0b5a48'); c.fillStyle=g;
  c.beginPath(); for(let i=0;i<=24;i++){ const a=i/24*TAU,q=r*(i%4<2?1:.86); i?c.lineTo(Math.cos(a)*q,Math.sin(a)*q):c.moveTo(Math.cos(a)*q,Math.sin(a)*q); } c.closePath(); c.fill(); c.strokeStyle='#08382d'; c.lineWidth=.8; c.stroke();
  c.fillStyle='#c8ccd6'; c.beginPath(); c.arc(0,0,r*.42,0,TAU); c.fill(); c.fillStyle='#d0262c'; c.beginPath(); c.arc(0,0,r*.28,0,TAU); c.fill();
  if(frac>.1){ c.globalAlpha=Math.min(.5,frac*.6); c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=1.2; c.beginPath(); c.arc(0,0,r*.92,ang*.3,ang*.3+1.4); c.stroke(); }
  c.restore(); }
// 文字換行
function wrapText(c,txt,x,y,maxW,lh,maxL){ let line='',n=0; for(const ch of txt){ if(c.measureText(line+ch).width>maxW){ c.fillText(line,x,y+n*lh); line=ch; n++; if(n>=maxL) return; } else line+=ch; } if(line) c.fillText(line,x,y+n*lh); }
// 場地（每個場景畫一次存起來）
const stadCache={};
function themeBg(c,th,t){ const T=TH[th],g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,T.bg[0]); g.addColorStop(1,T.bg[1]); c.fillStyle=g; c.fillRect(0,0,W,H);
  if(th==='space'||th==='arena'||th==='final'){ for(let i=0;i<90;i++){ c.fillStyle='rgba(255,255,255,'+(.25+.5*Math.abs(Math.sin(t*.7+i)))+')'; c.fillRect((i*137)%W,(i*71)%H,1.6,1.6); } }
  if(th==='final'||th==='arena'||th==='gym'){ for(let i=0;i<5;i++){ const x=80+i*160+Math.sin(t*.5+i)*40,gg=c.createLinearGradient(x,0,x,H*.7); gg.addColorStop(0,'rgba(255,240,200,.22)'); gg.addColorStop(1,'rgba(255,240,200,0)'); c.fillStyle=gg; c.beginPath(); c.moveTo(x-12,0); c.lineTo(x+12,0); c.lineTo(x+90,H*.7); c.lineTo(x-90,H*.7); c.fill(); }
    c.fillStyle='rgba(0,0,0,.45)'; for(let i=0;i<40;i++){ const x=i*21,h=14+((i*37)%9); c.beginPath(); c.arc(x+10,H-8-h,7,0,TAU); c.fill(); c.fillRect(x+3,H-8-h,14,h+8); } }
  if(th==='street'){ for(let i=0;i<9;i++){ c.fillStyle=['#3a3046','#2a2434','#463a50'][i%3]; c.fillRect(i*92-10,40+(i%3)*24,86,H); c.fillStyle='rgba(255,210,120,.45)'; for(let k=0;k<5;k++) for(let j=0;j<3;j++) if((i+k+j)%3) c.fillRect(i*92+j*24,60+(i%3)*24+k*30,12,14); } }
  if(th==='ice'){ c.fillStyle='rgba(255,255,255,.8)'; for(let i=0;i<60;i++) c.fillRect((i*97+t*20)%W,(i*53+t*40*(1+i%3))%H,2.5,2.5); }
  if(th==='desert'){ c.fillStyle='#d89040'; c.beginPath(); c.moveTo(0,160); for(let x=0;x<=W;x+=40) c.lineTo(x,150+Math.sin(x*.012)*30); c.lineTo(W,H); c.lineTo(0,H); c.fill(); c.fillStyle='#fff3c0'; c.beginPath(); c.arc(660,60,30,0,TAU); c.fill(); }
  if(th==='lava'){ for(let i=0;i<30;i++){ c.fillStyle='rgba(255,'+(90+i*4)+',30,'+(.3+.3*Math.sin(t*2+i))+')'; c.beginPath(); c.arc((i*71)%W,H-((t*30+i*40)%H),2+i%3,0,TAU); c.fill(); } }
  if(th==='storm'){ c.strokeStyle='rgba(220,240,255,.35)'; c.lineWidth=2; for(let i=0;i<24;i++){ const x=(i*83+t*300)%(W+200)-100,y=(i*41)%H; c.beginPath(); c.moveTo(x,y); c.lineTo(x+60,y+6); c.stroke(); } }
  if(th==='twin'){ c.strokeStyle='rgba(62,209,106,.15)'; c.lineWidth=1; for(let i=0;i<W;i+=40){ c.beginPath(); c.moveTo(i,0); c.lineTo(i,H); c.stroke(); } for(let j=0;j<H;j+=40){ c.beginPath(); c.moveTo(0,j); c.lineTo(W,j); c.stroke(); } } }
const inPk=(st,a,extra)=>{ for(const p of st.pk){ let d=Math.abs(((a-p.a)%TAU+TAU*1.5)%TAU-Math.PI); if(d<p.w+(extra||0)) return p; } return null; };
let ATT=60,POCKV=430,BMK=.04,LUNGE=9,KBK=1.3; const OCT_R=AR+60,OCT_Y=16,OCT_H=90,WALL_H=46;
const octP=(k,r,dy)=>{ const a=k*Math.PI/4+Math.PI/8; return [sx(Math.cos(a)*r),sy(Math.sin(a)*r)+dy]; };
function acryl(c,k,al,back){ const [x0,y0]=octP(k,OCT_R-4,OCT_Y),[x1,y1]=octP(k+1,OCT_R-4,OCT_Y),H2=WALL_H; /* 透明壓克力護罩一片 */
  c.save(); c.beginPath(); c.moveTo(x0,y0); c.lineTo(x1,y1); c.lineTo(x1,y1-H2); c.lineTo(x0,y0-H2); c.closePath();
  const g=c.createLinearGradient(0,Math.min(y0,y1)-H2,0,Math.max(y0,y1)); g.addColorStop(0,'rgba(225,240,255,'+al*1.3+')'); g.addColorStop(1,'rgba(200,225,255,'+al*.45+')'); c.fillStyle=g; c.fill();
  c.clip(); c.strokeStyle='rgba(255,255,255,'+(back?.16:.2)+')'; c.lineWidth=10; for(const u of [.22,.3,.72]){ const px=x0+(x1-x0)*u,py=y0+(y1-y0)*u; c.beginPath(); c.moveTo(px-20,py+4); c.lineTo(px+22,py-H2-4); c.stroke(); c.lineWidth=4; } c.restore(); /* 反光斜紋 */
  c.strokeStyle='rgba(255,255,255,'+(back?.5:.6)+')'; c.lineWidth=2.4; c.beginPath(); c.moveTo(x0,y0-H2); c.lineTo(x1,y1-H2); c.stroke(); /* 上緣 */
  c.strokeStyle='rgba(20,22,30,.85)'; c.lineWidth=5; c.beginPath(); c.moveTo(x0,y0); c.lineTo(x0,y0-H2); c.moveTo(x1,y1); c.lineTo(x1,y1-H2); c.stroke(); /* 黑色角柱 */
  c.strokeStyle='rgba(255,255,255,.3)'; c.lineWidth=1; c.beginPath(); c.moveTo(x0+1.5,y0); c.lineTo(x0+1.5,y0-H2); c.moveTo(x1+1.5,y1); c.lineTo(x1+1.5,y1-H2); c.stroke(); }
const stadFC={}; function stadiumFront(si){ if(stadFC[si]) return stadFC[si]; const cv=document.createElement('canvas'); cv.width=W*2; cv.height=H*2; const c=cv.getContext('2d'); c.scale(2,2);
  for(let k=0;k<8;k++){ const m=k*Math.PI/4+Math.PI/4; if(Math.sin(m)<.01) continue; acryl(c,k,.07,false); } stadFC[si]=cv; return cv; }
function stadium(si){ if(stadCache[si]) return stadCache[si]; const ST=STAGES[si],T=TH[ST.th],cv=document.createElement('canvas'); cv.width=W*2; cv.height=H*2; const c=cv.getContext('2d'); c.scale(2,2);
  const dip=r=>DIP*Math.max(0,1-(r/AR)*(r/AR)),E=(r,dy)=>{ c.beginPath(); c.ellipse(CX,CY+(dy||0)+dip(r),r*S,r*S*SQ,0,0,TAU); };
  // 圓柱側面（只畫看得到的前半圈），左右暗、偏左亮
  const side=(r,y0,h,col)=>{ const rx=r*S,ry=r*S*SQ,g=c.createLinearGradient(CX-rx,0,CX+rx,0); g.addColorStop(0,shade(col,-.65)); g.addColorStop(.28,shade(col,.2)); g.addColorStop(.55,shade(col,-.2)); g.addColorStop(1,shade(col,-.75));
    c.beginPath(); c.ellipse(CX,CY+y0,rx,ry,0,0,Math.PI); c.lineTo(CX-rx,CY+y0+h); c.ellipse(CX,CY+y0+h,rx,ry,0,Math.PI,0,true); c.closePath(); c.fillStyle=g; c.fill(); };
  // 黑色壓克力底座（八角形）＋透明護罩的後半圈；前半圈護罩在 stadiumFront 畫在陀螺前面
  const SH=T.shell||(ST.th==='lava'||ST.th==='space'?T.rim:'#dde2ea'),RL=T.rail||T.acc;
  c.fillStyle='rgba(0,0,0,.6)'; c.beginPath(); c.ellipse(CX,CY+96,(OCT_R+20)*S,(OCT_R+20)*S*SQ,0,0,TAU); c.fill();
  for(let k=0;k<8;k++){ const m=k*Math.PI/4+Math.PI/4; if(Math.sin(m)<.01) continue; const [x0,y0]=octP(k,OCT_R,OCT_Y),[x1,y1]=octP(k+1,OCT_R,OCT_Y),lit=.5+.5*Math.cos(m-Math.PI*.75); /* 底座側面 */
    c.beginPath(); c.moveTo(x0,y0); c.lineTo(x1,y1); c.lineTo(x1,y1+OCT_H); c.lineTo(x0,y0+OCT_H); c.closePath(); const sg=c.createLinearGradient(0,Math.min(y0,y1),0,Math.max(y0,y1)+OCT_H); sg.addColorStop(0,shade('#2a2d36',lit*.25)); sg.addColorStop(1,'#08090c'); c.fillStyle=sg; c.fill();
    c.save(); c.clip(); c.transform(x1-x0,y1-y0,0,OCT_H,x0,y0); /* 面板座標：0～1 */
    c.fillStyle='rgba(255,255,255,.05)'; for(let q=0;q<7;q++) c.fillRect(.08+q*.04,.3,.025,.5); for(let q=0;q<7;q++) c.fillRect(.64+q*.04,.3,.025,.5); /* 散熱格柵 */
    c.strokeStyle=RL; c.globalAlpha=.85; c.lineWidth=.03; c.beginPath(); c.moveTo(.36,.18); c.lineTo(.64,.95); c.moveTo(.64,.18); c.lineTo(.36,.95); c.stroke(); c.globalAlpha=.25; c.lineWidth=.09; c.stroke(); c.restore();
    c.strokeStyle='rgba(255,255,255,.18)'; c.lineWidth=1; c.beginPath(); c.moveTo(x0,y0+.5); c.lineTo(x1,y1+.5); c.stroke(); }
  { c.beginPath(); for(let k=0;k<=8;k++){ const [x,y]=octP(k,OCT_R,OCT_Y); k?c.lineTo(x,y):c.moveTo(x,y); } const tg=c.createLinearGradient(0,CY-OCT_R*S*SQ,0,CY+OCT_R*S*SQ); tg.addColorStop(0,'#3a3e4a'); tg.addColorStop(1,'#14161c'); c.fillStyle=tg; c.fill(); c.strokeStyle='rgba(255,255,255,.25)'; c.lineWidth=1.2; c.stroke(); }
  for(let k=0;k<8;k++){ const m=k*Math.PI/4+Math.PI/4; if(Math.sin(m)>-.01) continue; acryl(c,k,.17,true); } /* 後面的透明護罩 */
  // 場地外殼（白色塑膠）
  side(AR+40,0,22,SH); const g0=c.createLinearGradient(0,CY-(AR+40)*S*SQ,0,CY+(AR+40)*S*SQ); g0.addColorStop(0,shade(SH,.3)); g0.addColorStop(1,shade(SH,-.28)); c.fillStyle=g0; E(AR+40); c.fill();
  c.strokeStyle='rgba(255,255,255,.55)'; c.lineWidth=1.5; c.beginPath(); c.ellipse(CX,CY,(AR+40)*S,(AR+40)*S*SQ,0,Math.PI*1.08,Math.PI*1.92); c.stroke();
  c.strokeStyle='rgba(0,0,0,.18)'; c.lineWidth=1; for(let q=0;q<16;q++){ const a=q/16*TAU+.1; if(inPk(ST,a,.08)) continue; c.beginPath(); c.moveTo(sx(Math.cos(a)*(AR+14)),sy(Math.sin(a)*(AR+14))); c.lineTo(sx(Math.cos(a)*(AR+36)),sy(Math.sin(a)*(AR+36))); c.stroke(); } /* 外殼分模線 */
  // 得分口袋（往下凹的洞）
  for(const p of ST.pk){ c.save(); const a0=p.a-p.w,a1=p.a+p.w; c.beginPath(); for(let i=0;i<=20;i++){ const a=a0+(a1-a0)*i/20; c.lineTo(sx(Math.cos(a)*(AR+38)),sy(Math.sin(a)*(AR+38))); } for(let i=20;i>=0;i--){ const a=a0+(a1-a0)*i/20; c.lineTo(sx(Math.cos(a)*(AR-4)),sy(Math.sin(a)*(AR-4))); } c.closePath();
    const xz=p.k==='x'; c.fillStyle=xz?'#1c0408':'#141004'; c.fill(); c.clip(); c.strokeStyle=xz?'rgba(255,61,90,.55)':'rgba(255,210,63,.5)'; c.lineWidth=6; for(let i=-30;i<30;i++){ c.beginPath(); c.moveTo(sx(Math.cos(p.a)*AR)+i*14-40,sy(Math.sin(p.a)*AR)-60); c.lineTo(sx(Math.cos(p.a)*AR)+i*14+40,sy(Math.sin(p.a)*AR)+60); c.stroke(); }
    const hg=c.createRadialGradient(sx(Math.cos(p.a)*(AR+18)),sy(Math.sin(p.a)*(AR+18)),0,sx(Math.cos(p.a)*(AR+18)),sy(Math.sin(p.a)*(AR+18)),60); hg.addColorStop(0,'rgba(0,0,0,.7)'); hg.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=hg; c.fillRect(0,0,W,H); c.restore();
    c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle=xz?'#ff6a80':'#ffd23f'; const lx=sx(Math.cos(p.a)*(AR+22)),ly=sy(Math.sin(p.a)*(AR+22)),lb=xz?'極限 3分':'擊飛 2分'; c.lineWidth=4; c.strokeStyle='#000'; c.strokeText(lb,lx,ly); c.fillText(lb,lx,ly); }
  // 碗面：中間低、遠處的內壁朝向鏡頭比較亮、近處比較暗
  const g=c.createRadialGradient(CX,CY+DIP-10,10,CX,CY+DIP,AR*S); g.addColorStop(0,T.fl[0]); g.addColorStop(1,T.fl[1]); c.fillStyle=g; E(AR-2); c.fill();
  c.save(); E(AR-2); c.clip();
  const vg=c.createLinearGradient(0,CY-AR*S*SQ,0,CY+AR*S*SQ); vg.addColorStop(0,'rgba(255,255,255,.2)'); vg.addColorStop(.45,'rgba(255,255,255,0)'); vg.addColorStop(1,'rgba(0,0,0,.28)'); c.fillStyle=vg; c.fillRect(0,0,W,H);
  c.beginPath(); c.ellipse(CX,CY,(AR-2)*S,(AR-2)*S*SQ,0,0,TAU); c.ellipse(CX,CY+14,(AR-2)*S,(AR-2)*S*SQ,0,0,TAU); c.fillStyle='rgba(0,0,0,.22)'; c.fill('evenodd'); /* 遠處內壁 */
  c.strokeStyle='rgba(0,0,0,.09)'; c.lineWidth=1.2; for(let r=30;r<AR;r+=28){ E(r); c.stroke(); }
  c.globalAlpha=.12; c.fillStyle=T.acc; c.font='900 120px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.save(); c.translate(CX,CY+DIP); c.scale(1,SQ); c.fillText('旋',0,0); c.restore(); c.globalAlpha=1;
  if(ST.lava){ const lg=c.createRadialGradient(CX,CY,AR*S*.6,CX,CY,AR*S); lg.addColorStop(0,'rgba(255,90,26,0)'); lg.addColorStop(1,'rgba(255,90,26,.55)'); c.fillStyle=lg; c.fillRect(0,0,W,H); }
  if(ST.th==='ice'){ c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=1; for(let i=0;i<14;i++){ c.beginPath(); const a=i*1.7; c.moveTo(CX+Math.cos(a)*40,CY+DIP+Math.sin(a)*20); c.lineTo(CX+Math.cos(a)*260,CY+Math.sin(a+.2)*160); c.stroke(); } }
  const sp=c.createRadialGradient(CX-60,CY-40,0,CX-60,CY-40,200); sp.addColorStop(0,'rgba(255,255,255,.22)'); sp.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=sp; c.fillRect(0,0,W,H); /* 頂燈反光 */
  c.restore();
  // 中心
  c.fillStyle='rgba(0,0,0,.14)'; E(14); c.fill(); c.fillStyle=T.acc; c.globalAlpha=.5; E(8); c.fill(); c.globalAlpha=1;
  // 齒輪軌道（有內緣陰影）
  for(let i=0;i<180;i++){ const a=i/180*TAU; if(inPk(ST,a)) continue; const a2=a+TAU/180; c.beginPath(); c.moveTo(sx(Math.cos(a)*(AR-6)),sy(Math.sin(a)*(AR-6))); c.lineTo(sx(Math.cos(a)*(AR+6)),sy(Math.sin(a)*(AR+6))); c.lineTo(sx(Math.cos(a2)*(AR+6)),sy(Math.sin(a2)*(AR+6))); c.lineTo(sx(Math.cos(a2)*(AR-6)),sy(Math.sin(a2)*(AR-6))); c.closePath();
    const lit=.5+.5*Math.sin(a+.6); c.fillStyle=ST.lava?(i%2?'#ff9a4a':'#a83a1a'):shade(i%2?'#5a606e':'#2a2e38',(lit-.5)*.5); c.fill(); }
  c.strokeStyle='rgba(0,0,0,.35)'; c.lineWidth=2; E(AR-7); c.stroke();
  { const seg=[]; let a0=null; for(let i=0;i<=360;i++){ const a=i/360*TAU,inn=!inPk(ST,a,.03); if(inn&&a0==null) a0=a; if((!inn||i===360)&&a0!=null){ seg.push([a0,a]); a0=null; } } /* 發光軌道線（口袋處斷開） */
    for(const [p0,p1] of seg){ for(const [lw,al] of [[9,.18],[5,.35],[2.6,1]]){ c.strokeStyle=al<1?RL:shade(RL,.35); c.globalAlpha=al; c.lineWidth=lw; c.beginPath(); c.ellipse(CX,CY,(AR+9)*S,(AR+9)*S*SQ,0,p0,p1); c.stroke(); } } c.globalAlpha=1; }
  stadCache[si]=cv; return cv; }
// 看台觀眾（固定亂數產生，三排，後排比較小、比較暗）
const CROWD=(()=>{ const a=[]; let sd=7; const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;
  const shirts=['#e04848','#3a7ae0','#f0c040','#40b070','#f4f4f4','#8a5ad8','#ff8a3d','#2a2a34','#e070b0','#50c8d8','#7a8090'],skins=['#f2d0b0','#e0b090','#c08a60','#8a5a3a','#f8dcc4'],hairs=['#1a1410','#3a2414','#6a4422','#c89a50','#2a2a2a','#a83a20'];
  for(let r=0;r<3;r++){ const s=.62+r*.17,y=82+r*22,n=Math.ceil((W+80)/(28*s)); for(let i=0;i<n;i++) a.push({id:a.length,r,s,x:-40+i*28*s+(r%2?14*s:0)+(rnd()-.5)*8*s,y:y+(rnd()-.5)*4,sh:shirts[rnd()*shirts.length|0],sk:skins[rnd()*skins.length|0],hr:hairs[rnd()*hairs.length|0],ph:rnd()*TAU,up:rnd(),stick:rnd()<.25?['#ff4d4d','#3d8bff','#ffd23f','#3ed16a'][rnd()*4|0]:null,cam:rnd()<.12}); }
  return a; })();
// 畫過一次就存起來（觀眾、裁判、地板），每格只要貼圖，手機也跑得動
const CC={}; function cacheCv(key,w,h,f,res){ if(CC[key]) return CC[key]; res=res||2; const k=document.createElement('canvas'); k.width=Math.ceil(w*res); k.height=Math.ceil(h*res); const x=k.getContext('2d'); x.scale(res,res); f(x); return CC[key]=k; }
const ROWDK=[.54,.32,0];
const ACOL=16; function crowdAtlas(){ return cacheCv('atlas',ACOL*40,Math.ceil(CROWD.length/ACOL)*58,c=>{ for(const p of CROWD){ c.save(); c.translate((p.id%ACOL)*40,Math.floor(p.id/ACOL)*58); c.beginPath(); c.rect(0,0,40,58); c.clip(); personSprite(c,p); c.restore(); } }); }
function crowdStill(){ return cacheCv('crowd0',W+160,130,c=>{ c.translate(80,-40); for(const p of CROWD) blitPerson(c,p,p.x,p.y); }); }
function blitPerson(c,p,x,y){ const s=p.s; c.drawImage(crowdAtlas(),(p.id%ACOL)*80,Math.floor(p.id/ACOL)*116,80,116,x-20*s,y-22*s,40*s,58*s); }
function personSprite(c,p){ c.translate(20,22);
  const bg=c.createLinearGradient(-14,0,14,0); bg.addColorStop(0,shade(p.sh,-.55)); bg.addColorStop(.4,p.sh); bg.addColorStop(1,shade(p.sh,-.65)); c.fillStyle=bg; c.beginPath(); c.moveTo(-14,34); c.lineTo(-13,7); c.quadraticCurveTo(-12,0,-5,-1); c.lineTo(5,-1); c.quadraticCurveTo(12,0,13,7); c.lineTo(14,34); c.closePath(); c.fill();
  c.fillStyle=shade(p.sk,-.3); c.fillRect(-2.5,-5,5,6);
  const hg=c.createRadialGradient(-2,-13,1,0,-11,9); hg.addColorStop(0,shade(p.sk,.2)); hg.addColorStop(1,shade(p.sk,-.35)); c.fillStyle=hg; c.beginPath(); c.ellipse(0,-11,6.5,8,0,0,TAU); c.fill();
  c.fillStyle=p.hr; c.beginPath(); c.ellipse(0,-13.5,7,5.6,0,Math.PI,TAU); c.fill(); c.fillRect(-7,-14,2,5); c.fillRect(5,-14,2,5);
  c.fillStyle='rgba(30,16,12,.75)'; c.fillRect(-3.2,-11,1.6,1.4); c.fillRect(1.6,-11,1.6,1.4);
  if(ROWDK[p.r]){ c.globalCompositeOperation='source-atop'; c.fillStyle='rgba(8,8,18,'+ROWDK[p.r]+')'; c.fillRect(-20,-22,40,58); c.globalCompositeOperation='source-over'; } }
function cheerPerson(c,p,t){ const s=p.s,jump=Math.max(0,Math.sin(t*7+p.ph))*5,x=p.x,y=p.y-jump*s;
  if(p.up<.85){ const w=Math.sin(t*9+p.ph),dk=ROWDK[p.r],ac=shade(p.sh,-.15-dk),hc=shade(p.sk,-dk);
    for(const sd of [-1,1]){ const hx=x+sd*(13+w*5*sd)*s,hy=y+(-24+Math.abs(w)*3)*s; c.strokeStyle=ac; c.lineWidth=5*s; c.beginPath(); c.moveTo(x+sd*9*s,y+4*s); c.lineTo(hx,hy); c.stroke(); c.fillStyle=hc; c.beginPath(); c.arc(hx,hy-2*s,3*s,0,TAU); c.fill();
      if(p.stick&&sd>0){ const ex=hx+(3+w*3)*s,ey=hy-20*s; c.globalAlpha=.35; c.strokeStyle=p.stick; c.lineWidth=8*s; c.beginPath(); c.moveTo(hx,hy-2*s); c.lineTo(ex,ey); c.stroke(); c.globalAlpha=1; c.lineWidth=3*s; c.stroke(); } } }
  blitPerson(c,p,x,y); }
function drawCrowd(c,t,ch){
  c.drawImage(cacheCv('cbg',W+160,120,x=>{ const g=x.createLinearGradient(0,0,0,112); g.addColorStop(0,'rgba(10,10,20,0)'); g.addColorStop(.3,'rgba(14,14,26,.9)'); g.addColorStop(1,'#0c0c16'); x.fillStyle=g; x.fillRect(0,0,W+160,120); }),-80,48,W+160,120);
  if(ch<.05) c.drawImage(crowdStill(),-80,40,W+160,130);
  else { const k=Math.floor(t*8)%4; c.drawImage(cacheCv('crowdF'+k,W+160,150,x=>{ x.translate(80,-30); x.lineCap='round'; const tt=k/4*TAU/7; for(const p of CROWD) cheerPerson(x,p,tt); }),-80,30,W+160,150); }
  if(ch>.3) for(const p of CROWD) if(p.cam&&Math.random()<.025*ch){ c.drawImage(cacheCv('flash',28,28,x=>{ const fg=x.createRadialGradient(14,14,0,14,14,14); fg.addColorStop(0,'rgba(255,255,255,.95)'); fg.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=fg; x.fillRect(0,0,28,28); }),p.x-14,p.y-24,28,28); }
  // 廣告看板
  c.drawImage(cacheCv('bill',W+160,20,x=>{ const bb=x.createLinearGradient(0,0,0,20); bb.addColorStop(0,'#1c2236'); bb.addColorStop(1,'#0a0c16'); x.fillStyle=bb; x.fillRect(0,0,W+160,20);
    x.fillStyle='#ff7a3d'; x.fillRect(0,0,W+160,2); x.font='900 11px '+TC; x.textAlign='center'; x.textBaseline='middle'; for(let i=0;i<6;i++){ x.fillStyle=i%2?'rgba(255,210,63,.75)':'rgba(154,224,255,.75)'; x.fillText(i%2?'陀螺旋風戰　冠軍盃':'SPIN STORM  ·  GO SHOOT!',i*160+60,11); } }),-80,146,W+160,20); }
function drawFloor(c,th){ c.drawImage(cacheCv('floor'+th,W+400,H-126,x=>{ x.translate(200,-166); const T=TH[th],g=x.createLinearGradient(0,166,0,H); g.addColorStop(0,shade(T.bg[1],-.35)); g.addColorStop(1,shade(T.bg[1],.1)); x.fillStyle=g; x.fillRect(-200,166,W+400,H+200);
  x.strokeStyle='rgba(255,255,255,.06)'; x.lineWidth=1; for(let i=-14;i<=14;i++){ x.beginPath(); x.moveTo(CX+i*34,166); x.lineTo(CX+i*150,H+60); x.stroke(); } for(const y of [176,192,214,244,284,336,404]){ x.beginPath(); x.moveTo(-200,y); x.lineTo(W+200,y); x.stroke(); }
  const sp=x.createRadialGradient(CX,CY+40,40,CX,CY+40,440); sp.addColorStop(0,'rgba(255,245,220,.2)'); sp.addColorStop(1,'rgba(255,245,220,0)'); x.fillStyle=sp; x.fillRect(-200,166,W+400,H); },1),-200,166,W+400,H-126); }
// 寫實人物用的肢體：膠囊形、橫向明暗
function limb(c,a,b,wa,wb,col){ const dx=b[0]-a[0],dy=b[1]-a[1],l=hyp(dx,dy)||1,nx=-dy/l,ny=dx/l,g=c.createLinearGradient(a[0]+nx*wa/2,a[1]+ny*wa/2,a[0]-nx*wa/2,a[1]-ny*wa/2); g.addColorStop(0,shade(col,.12)); g.addColorStop(.45,col); g.addColorStop(1,shade(col,-.45));
  c.fillStyle=g; c.beginPath(); c.moveTo(a[0]+nx*wa/2,a[1]+ny*wa/2); c.lineTo(b[0]+nx*wb/2,b[1]+ny*wb/2); c.arc(b[0],b[1],wb/2,Math.atan2(ny,nx),Math.atan2(ny,nx)+Math.PI,true); c.lineTo(a[0]-nx*wa/2,a[1]-ny*wa/2); c.arc(a[0],a[1],wa/2,Math.atan2(-ny,-nx),Math.atan2(-ny,-nx)+Math.PI,true); c.closePath(); c.fill(); }
const jnt=(p,len,ang)=>[p[0]+Math.sin(ang)*len,p[1]+Math.cos(ang)*len]; /* ang 0＝往下、正值往右 */
// 裁判（寫實、正面、黑白條紋上衣）：pose idle／count（舉手數 n）／go（手往場中揮下）／point（指向得分的一方 n＝0 左 1 右）
function drawRef(c,x,y,s,pose,t,talk,n){ const mouth=talk?(Math.sin(t*16)>0?2:1):0,k=cacheCv('ref'+pose+(n|0)+mouth,170,215,q=>refRaw(q,85,205,pose,mouth,n)); c.drawImage(k,x-85*s,y-205*s,170*s,215*s); }
function refRaw(c,x,y,pose,mouth,n){ c.save(); c.translate(x,y); const SK='#e6bc96',PANT='#1c1e26',INK='#16161c';
  limb(c,[-9,-88],[-10,-46],15,11,PANT); limb(c,[9,-88],[10,-46],15,11,PANT); limb(c,[-10,-46],[-10,-6],11,9,PANT); limb(c,[10,-46],[10,-6],11,9,PANT);
  c.fillStyle='#0c0c10'; c.beginPath(); c.ellipse(-12,-3,9,4,0,0,TAU); c.ellipse(12,-3,9,4,0,0,TAU); c.fill();
  const body=()=>{ c.beginPath(); c.moveTo(-23,-139); c.quadraticCurveTo(0,-146,23,-139); c.lineTo(20,-88); c.lineTo(-20,-88); c.closePath(); };
  body(); c.fillStyle='#f2f2f2'; c.fill(); c.save(); body(); c.clip(); c.fillStyle=INK; for(let i=-26;i<26;i+=9) c.fillRect(i,-150,4.5,64);
  const tg=c.createLinearGradient(-23,0,23,0); tg.addColorStop(0,'rgba(0,0,0,.4)'); tg.addColorStop(.38,'rgba(255,255,255,.08)'); tg.addColorStop(1,'rgba(0,0,0,.5)'); c.fillStyle=tg; c.fillRect(-26,-150,52,64); c.restore();
  c.fillStyle='#111'; c.fillRect(-20,-91,40,5); c.fillStyle='#c8ccd6'; c.fillRect(-3,-91,6,5);
  c.fillStyle=INK; c.beginPath(); c.moveTo(-9,-143); c.lineTo(0,-132); c.lineTo(9,-143); c.lineTo(5,-145); c.lineTo(0,-138); c.lineTo(-5,-145); c.closePath(); c.fill();
  c.fillStyle='#ffd23f'; c.fillRect(-17,-129,10,7); c.fillStyle=INK; c.font='900 5px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('JUDGE',-12,-125.5);
  limb(c,[0,-145],[0,-152],10,10,SK);
  c.strokeStyle='#d03030'; c.lineWidth=1.2; c.beginPath(); c.moveTo(-5,-145); c.quadraticCurveTo(0,-126,5,-145); c.stroke(); c.fillStyle='#c8ccd6'; c.fillRect(-2,-130,6,3);
  // 頭
  const hy=-165; c.fillStyle=shade(SK,-.15); c.beginPath(); c.ellipse(-10.5,hy+1,2.6,4,0,0,TAU); c.ellipse(10.5,hy+1,2.6,4,0,0,TAU); c.fill();
  const hg=c.createRadialGradient(-3,hy-4,2,0,hy,15); hg.addColorStop(0,shade(SK,.18)); hg.addColorStop(1,shade(SK,-.3)); c.fillStyle=hg; c.beginPath(); c.ellipse(0,hy,10.5,13.5,0,0,TAU); c.fill();
  c.fillStyle='#231812'; c.beginPath(); c.ellipse(0,hy-5,11.2,9.8,0,Math.PI,TAU); c.fill(); c.beginPath(); c.moveTo(-11,hy-5); c.quadraticCurveTo(-4,hy-11,8,hy-6); c.lineTo(11,hy-5); c.lineTo(11,hy-8); c.fill(); c.fillRect(-11.2,hy-6,2.4,6); c.fillRect(8.8,hy-6,2.4,6);
  c.strokeStyle='#2a1a12'; c.lineWidth=1.4; c.beginPath(); c.moveTo(-7,hy-3.6); c.lineTo(-2,hy-3.2); c.moveTo(2,hy-3.2); c.lineTo(7,hy-3.6); c.stroke();
  c.fillStyle='#fff'; c.beginPath(); c.ellipse(-4.3,hy-.6,2.3,1.4,0,0,TAU); c.ellipse(4.3,hy-.6,2.3,1.4,0,0,TAU); c.fill(); c.fillStyle='#2a1a10'; c.beginPath(); c.arc(-4,hy-.6,1.1,0,TAU); c.arc(4.6,hy-.6,1.1,0,TAU); c.fill();
  c.strokeStyle=shade(SK,-.4); c.lineWidth=1; c.beginPath(); c.moveTo(.4,hy); c.lineTo(1.4,hy+4.2); c.lineTo(-.6,hy+4.6); c.stroke();
  const mo=mouth===2?3.2:mouth===1?1.6:0; if(mo){ c.fillStyle='#5a1a1a'; c.beginPath(); c.ellipse(0,hy+8,3,mo,0,0,TAU); c.fill(); } else { c.strokeStyle='#8a4a3a'; c.lineWidth=1.2; c.beginPath(); c.moveTo(-3,hy+8); c.lineTo(3,hy+8); c.stroke(); }
  // 手臂
  let R=[.22,-.08],L=[-.22,.08]; const br=0;
  if(pose==='count'){ R=[Math.PI-.12,.05]; } else if(pose==='go'){ L=[-1.25,-.2]; R=[.35,-.2]; } else if(pose==='point'){ if(n===0) L=[-1.5,-.05]; else R=[1.5,.05]; }
  const arm=(sh,a,sd)=>{ const el=jnt(sh,26,a[0]+br*sd),ha=jnt(el,23,a[0]+a[1]+br*sd),mid=jnt(sh,13,a[0]+br*sd); limb(c,sh,mid,12.5,11,INK); limb(c,mid,el,9.5,8.5,SK); limb(c,el,ha,8.5,6.5,SK); c.fillStyle=shade(SK,-.08); c.beginPath(); c.ellipse(ha[0],ha[1],4.6,5.2,0,0,TAU); c.fill(); return ha; };
  arm([-21,-137],L,-1); const hr=arm([21,-137],R,1);
  if(pose==='count'&&n>=1){ c.strokeStyle=SK; c.lineWidth=2.4; c.lineCap='round'; for(let i=0;i<n;i++){ const fx=hr[0]-3+i*3; c.beginPath(); c.moveTo(fx,hr[1]-3); c.lineTo(fx,hr[1]-10); c.stroke(); } }
  c.restore(); }
// 裁判的語音（瀏覽器內建中文語音）；音量跟著遊戲音效音量
function speak(txt,urgent){ try{ const vol=(typeof sfxVol!=='undefined'?sfxVol:80)/100; if(!vol||!window.speechSynthesis) return; const S2=window.speechSynthesis; if(urgent) S2.cancel();
  const u=new SpeechSynthesisUtterance(txt); u.lang='zh-TW'; u.rate=1.15; u.pitch=.95; u.volume=Math.min(1,vol*1.2); const vs=S2.getVoices(); const v=vs.find(q=>/zh[-_]TW/i.test(q.lang))||vs.find(q=>/zh/i.test(q.lang)); if(v) u.voice=v; S2.speak(u); }catch(e){} }
function meArrow(c,x,y,label,t){ const yy=y+Math.sin(t*8)*5; c.fillStyle='#ffd23f'; c.strokeStyle='#0b0a1c'; c.lineWidth=3; c.beginPath(); c.moveTo(x-13,yy-20); c.lineTo(x+13,yy-20); c.lineTo(x,yy); c.closePath(); c.stroke(); c.fill();
  c.font='900 17px '+TC; c.textAlign='center'; c.textBaseline='bottom'; c.lineWidth=4; c.strokeText(label,x,yy-24); c.fillText(label,x,yy-24); }
function recWin(stage){ try{ localStorage.setItem('arcade.spin.w.'+stage,'1'); }catch(e){} }
const hasWin=stage=>{ try{ return localStorage.getItem('arcade.spin.w.'+stage)==='1'; }catch(e){ return false; } };
// 名單：比賽永遠是一對一（單人對電腦、同機兩人、連線兩人；連線只有一人時補電腦）
function roster(opts){ const net=opts.net,local2=!net&&opts.mode==='2p',pv=!!opts.preview,humans=pv?0:net?Math.min(2,net.count):local2?2:1,n=2;
  const si=clamp(opts.stage|0,0,STAGES.length-1),names=[],looks=[];
  for(let i=0;i<n;i++){ const h=i<humans; names.push(h?(net?(net.names&&net.names[i])||'玩家'+(i+1):local2?(i+1)+'P':opts.name||'你'):BOTN[(si+i)%BOTN.length]);
    const L=h?(net?net.looks&&net.looks[i]:i===0?opts.look:null):null;
    looks.push(h&&L&&Object.keys(L).length?L:h?{}:{top:OPP[(si*2+(pv?i:i===1?0:i))%OPP.length]}); }
  return {net,local2,humans,mode:'ffa',n,team:[null,null],TEAMS:[],names,looks,host:!net||net.host,me:net?net.me:0,pv}; }
function readIn(env,i,local2){ const K=env.keys,h=c=>env.hit(c); let L,Rt,U,D,A;
  if(local2&&i===0){ L=K.KeyA; Rt=K.KeyD; U=K.KeyW; D=K.KeyS; A=h('KeyF')||h('KeyG'); }
  else if(local2){ L=K.ArrowLeft; Rt=K.ArrowRight; U=K.ArrowUp; D=K.ArrowDown; A=h('Enter')||h('Comma')||h('Slash'); }
  else { L=K.ArrowLeft||K.KeyA; Rt=K.ArrowRight||K.KeyD; U=K.ArrowUp||K.KeyW; D=K.ArrowDown||K.KeyS; A=h('Space')||h('KeyX')||h('KeyJ'); }
  return {mx:(Rt?1:0)-(L?1:0),my:(D?1:0)-(U?1:0),dash:!!A}; }
const NOIN={mx:0,my:0,dash:false};

function create(env,opts){
  const si=clamp(opts.stage|0,0,STAGES.length-1),ST=STAGES[si],OP=opts.options||{},R=roster(opts),{net,host,me,local2}=R,client=!!net&&!host,TARGET=4,RT=60,FMT3=true;
  const {ctx:c,canvas}=env.canvas2d(W,H),bg=stadium(si);
  const colOf=i=>TOP[partsOf(R.looks[i]).top].c;
  const deckOf=i=>FMT3?(i<R.humans?myDeck(R.looks[i]):botDeck(si,i)):[partsOf(R.looks[i])];
  const T=[]; for(let i=0;i<R.n;i++){ const P=partsOf(R.looks[i]),LK=R.looks[i]||{}; T.push({i,P,lc:i<R.humans&&LK.lc||PCOL[i],ls:i<R.humans&&LK.ls||'cord',pull:0,k:statsOf(P),col:colOf(i),team:R.team[i],human:i<R.humans,local:i<R.humans&&(!net||i===me),remote:i<R.humans&&!!net&&i!==me,
    ai:i>=R.humans?{sk:clamp(.25+si*.075,.2,1),t:0,mx:0,my:0}:null,deck:deckOf(i),lastX:-9,dEnd:-9,x:0,y:0,vx:0,vy:0,ang:Math.random()*TAU,spin:100,bm:0,st:'on',dashT:0,cd:0,railCD:0,last:-1,lastT:-9,out:0,ox:0,oy:0,ta:0,hs:0,lx:null,ly:null,tx:0,ty:0,wa:Math.random()*TAU}); }
  const teamKey=f=>f.team!=null?'t'+f.team:'p'+f.i;
  const keys=[...new Set(T.map(teamKey))],score={}; keys.forEach(k=>score[k]=0);
  const keyName=k=>k[0]==='t'?R.TEAMS[+k.slice(1)].name:R.names[+k.slice(1)];
  const setP=f=>{ f.P=f.deck[(round-1)%f.deck.length]; f.k=statsOf(f.P); f.col=TOP[f.P.top].c; };
  const rdy=T.map(f=>!f.human); let ed=local2?0:me,cur=0,waiting=false,deckT=net?60:0;
  let t=0,rt=0,round=0,phase='ready',PT=opts.preview?.2:2.6,fx=[],deb=[],ban=null,ev=[],shake=0,hitstop=0,ended=false,sendT=0,lastBeep=9,winKey=null,inBuf={},sentDash=0,myIn={...NOIN},windA=0,cam={x:W/2,y:H/2,z:1},focus=null,punch=0,slow=0,cheer=0,refSay=null,camOn=true,nb=null,BUL=[];
  const snd=k=>{ if(opts.preview) return; env.sfx(k); if(host&&net) ev.push(['s',k]); };
  let wallHits=0; const addFx=(k,x,y,a,b)=>{ spawn(k,x,y,a,b); if(host&&net) ev.push([k,R1(x),R1(y),a==null?0:a,b==null?0:b]); };
  // 裁判喊話（同時出對話框）、觀眾歡呼聲
  function voice(txt,urgent){ refSay={txt,t:Math.max(1.3,txt.length*.17)}; if(opts.preview) return; if(host&&net) ev.push(['v',txt,urgent?1:0]); speak(txt,urgent); }
  function roar(v,d){ cheer=Math.max(cheer,v*1.3); if(opts.preview) return; if(host&&net) ev.push(['c',v,d]); roarL(v,d); }
  function roarL(v,d){ try{ const AC=env.audio&&env.audio(),vol=(typeof sfxVol!=='undefined'?sfxVol:80)/100*v; if(!AC||vol<=0) return;
    if(!nb){ nb=AC.createBuffer(1,AC.sampleRate*3,AC.sampleRate); const D=nb.getChannelData(0); let m=0; for(let i=0;i<D.length;i++){ m=Math.sin(i/AC.sampleRate*TAU*3.1)*.3+.7; D[i]=(Math.random()*2-1)*m; } }
    const so=AC.createBufferSource(); so.buffer=nb; so.playbackRate.value=.85+Math.random()*.2; const bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=650+v*450; bp.Q.value=.55; const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=2600;
    const g=AC.createGain(),n0=AC.currentTime; g.gain.setValueAtTime(.0001,n0); g.gain.linearRampToValueAtTime(.3*vol,n0+.18); g.gain.setValueAtTime(.3*vol,n0+d*.45); g.gain.exponentialRampToValueAtTime(.0001,n0+d);
    so.connect(bp); bp.connect(lp); lp.connect(g); g.connect(AC.destination); so.start(n0); so.stop(n0+d+.05); }catch(e){} }
  function spawn(k,x,y,a,b){
    if(k==='clash'){ const q0=b/100; for(let i=0;i<10;i++){ const q=q0+Math.PI/2*(i%2?1:-1)+(Math.random()-.5)*1.1; fx.push({k:'sl',x,y,a:q,l:.22,L:.22,r:40+Math.min(120,a*.25)*(.6+Math.random()*.6)}); } fx.push({k:'ring',x,y,l:.3,L:.3,r:70+Math.min(90,a*.2),c:'#fff3c0'}); if(a>300) fx.push({k:'flash',l:.12,L:.12}); }
    if(k==='wall'){ const r=hyp(x,y)||1,nx=x/r,ny=y/r,tx=-ny*(b||1),ty=nx*(b||1),n=Math.min(40,10+a*.08); for(let i=0;i<n;i++){ const sd=(i%2?1:-1),s=150+Math.random()*(150+a*.6),q=(Math.random()-.5)*.6; fx.push({k:'sp',x,y,z:8,vx:(tx*sd-nx*.6+q)*s,vy:(ty*sd-ny*.6-q)*s,vz:60+Math.random()*180,l:.15+Math.random()*.35,c:['#ffffff','#fff3a0','#9cff6a','#ffb040'][i%4]}); }
      fx.push({k:'wf',a:Math.atan2(y,x),l:.35,L:.35,w:.1+Math.min(.25,a/2000)}); fx.push({k:'glow',x,y,l:.14,L:.14,r:40+Math.min(80,a*.12)}); return; }
    if(k==='spark'){ const n=Math.min(64,12+a*.13); for(let i=0;i<n;i++){ const q=Math.random()*TAU,s=120+Math.random()*(220+a*.7); fx.push({k:'sp',x,y,z:10,vx:Math.cos(q)*s,vy:Math.sin(q)*s,vz:40+Math.random()*170,l:.12+Math.random()*.38,c:['#fffbe8','#ffe08a','#ffb040','#ff8a2a'][i%4]}); }
      fx.push({k:'glow',x,y,l:.16,L:.16,r:30+Math.min(90,a*.16)}); if(a>260) fx.push({k:'ring',x,y,l:.25,L:.25,r:60,c:'#ffffff'}); }
    else if(k==='dash'){ for(let i=0;i<14;i++) fx.push({k:'sp',x:x+(Math.random()-.5)*16,y:y+(Math.random()-.5)*16,z:4,vx:(Math.random()-.5)*200,vy:(Math.random()-.5)*200,vz:80+Math.random()*80,l:.3+Math.random()*.3,c:i%2?'#ff7a3d':'#ffe060'}); fx.push({k:'ring',x,y,l:.35,L:.35,r:60,c:'#ff9d3d'}); }
    else if(k==='trail') fx.push({k:'tr',x,y,l:.35,L:.35,c:a||'#ffb02a'});
    else if(k==='land') { fx.push({k:'ring',x,y,l:.35,L:.35,r:46,c:'#ffffff'}); for(let i=0;i<14;i++){ const q=Math.random()*TAU,s=30+Math.random()*60; fx.push({k:'sm',x,y,vx:Math.cos(q)*s,vy:Math.sin(q)*s,l:.7,L:.7}); } for(let i=0;i<10;i++){ const q=Math.random()*TAU; fx.push({k:'sp',x,y,z:4,vx:Math.cos(q)*160,vy:Math.sin(q)*160,vz:60+Math.random()*60,l:.2+Math.random()*.2,c:'#fff3c0'}); } }
    else if(k==='burst'){ const f=T[a]; for(let i=0;i<50;i++){ const q=Math.random()*TAU,s=100+Math.random()*320; fx.push({k:'sp',x,y,z:12,vx:Math.cos(q)*s,vy:Math.sin(q)*s,vz:100+Math.random()*200,l:.4+Math.random()*.5,c:['#fff','#ffd23f','#ff7a3d',f?f.col:'#fff'][i%4]}); }
      fx.push({k:'ring',x,y,l:.6,L:.6,r:160,c:'#ff7a3d'}); fx.push({k:'glow',x,y,l:.35,L:.35,r:150}); fx.push({k:'flash',l:.2,L:.2});
      if(f) for(let j=0;j<3;j++){ const q=Math.random()*TAU; deb.push({p:j,x,y,z:14,vx:Math.cos(q)*(140+Math.random()*120),vy:Math.sin(q)*(140+Math.random()*120),vz:220+Math.random()*120,ang:0,va:(Math.random()-.5)*30,P:f.P,col:f.col,l:3}); } }
    else if(k==='out'){ fx.push({k:'ring',x,y,l:.5,L:.5,r:120,c:b==='x'?'#ff3d5a':'#ffd23f'}); for(let i=0;i<30;i++){ const q=Math.random()*TAU; fx.push({k:'sp',x,y,z:4,vx:Math.cos(q)*240,vy:Math.sin(q)*240,vz:150,l:.5,c:b==='x'?'#ff8a9a':'#ffe58a'}); } } }
  const clampAim=(f,k)=>{ const x=k?'tx':'lx',y=k?'ty':'ly',r=hyp(f[x],f[y]),m=AR-34; if(r>m){ f[x]*=m/r; f[y]*=m/r; } };
  // 電腦選落點：攻擊型靠場邊（方便衝刺），持久、防禦型放中間
  function prepAim(){ T.forEach((f,k)=>{ const L=LPOS[k]||LPOS[0]; f.x=L[0]; f.y=L[1]; f.vx=f.vy=0;
      if(f.lx==null||!f.human){ f.lx=(k?1:-1)*AR*.42; f.ly=0; }
      const B=TOP[f.P.top],rad=B.type==='攻擊'?.74:B.type==='左旋'?.6:B.type==='平衡'?.45:.12; let a=0; for(let q=0;q<30;q++){ a=Math.random()*TAU; if(!inPk(ST,a,.4)) break; }
      const r2=AR*rad*(.85+Math.random()*.3),e=f.ai?(1-f.ai.sk)*50:0; f.tx=Math.cos(a)*r2+(Math.random()-.5)*e; f.ty=Math.sin(a)*r2+(Math.random()-.5)*e; clampAim(f,1); clampAim(f); }); }
  function land(f){ const L=LPOS[f.i]||LPOS[0],dx=f.lx-L[0],dy=f.ly-L[1],d=hyp(dx,dy)||1,r=hyp(f.lx,f.ly)||1,K=f.k; f.x=f.lx; f.y=f.ly;
    const v0=K.cruise*.6+20; f.vx=-f.ly/r*K.dir*v0*.6-f.lx/r*v0*.3; f.vy=f.lx/r*K.dir*v0*.6-f.ly/r*v0*.3; addFx('land',f.x,f.y); } /* 落地後往中間衝、帶一點旋轉方向的偏移（花瓣路線） */
  function setupRound(){ round++; rt=0; phase='aim'; PT=opts.preview?1.2:5.6; lastBeep=9; deb=[]; focus=null; if(!client) T.forEach(setP);
    T.forEach(f=>{ setRPM(f,f.ai?Math.round((9000+f.ai.sk*6000+Math.random()*1200)/10)*10:15000); f.bm=0; f.st='on'; f.dashT=0; f.cd=1; f.railCD=0; f.last=-1; f.lastT=-9; f.out=0; f.lastX=-9; f.dEnd=-9; f.split=false; f.sh=null; f.lp=0; f.landed=false; f.pull=0; f.grab=false; f.aiR=(f.human?9:.22+(f.ai?(1-f.ai.sk)*.45:.2)+Math.random()*.18); }); BUL=[];
    prepAim(); if(round>1) voice('第 '+round+' 回合，選好落點！'); }
  setupRound(); if(!R.pv&&R.humans) phase='deck';
  // 一對一：每人帶 3 顆，開賽前組 3 顆陀螺、排出場順序（刀刃、棘輪、底座都不能重複）
  const CW=228,CX0=i=>34+i*252,CY0=70,SELY=CY0+192,BTN=[W/2-100,436,200,46];
  function cyc(d,slot,dir){ let i=TOPS.findIndex(q=>q.id===d[slot].top); for(let k=0;k<TOPS.length;k++){ i=(i+dir+TOPS.length)%TOPS.length; if(!clash(d,slot,TOPS[i].id)){ d[slot]=partsOf({top:TOPS[i].id}); break; } } popT[slot]=t; env.sfx('click'); }
  function confirmDeck(){ const f=T[ed]; f.deck=fixDeck(f.deck); env.sfx('item');
    if(ed===0||(net&&ed===me)) saveDeck(f.deck);
    if(client){ waiting=true; net.send({deck:f.deck.map(q=>({top:q.top}))}); return; }
    rdy[ed]=true; if(local2&&ed===0){ ed=1; cur=0; } else waiting=true; }
  function deckKeys(){ if(waiting) return; const h=c2=>env.hit(c2); let U,D,L,Rt,A;
    if(local2&&ed===0){ U=h('KeyW'); D=h('KeyS'); L=h('KeyA'); Rt=h('KeyD'); A=h('KeyF')||h('Space'); }
    else if(local2){ U=h('ArrowUp'); D=h('ArrowDown'); L=h('ArrowLeft'); Rt=h('ArrowRight'); A=h('Enter'); }
    else { U=h('ArrowUp')||h('KeyW'); D=h('ArrowDown')||h('KeyS'); L=h('ArrowLeft')||h('KeyA'); Rt=h('ArrowRight')||h('KeyD'); A=h('Space')||h('Enter')||h('KeyX'); }
    if(U) cur=(cur+3)%4; if(D) cur=(cur+1)%4; const d=T[ed].deck;
    if((L||Rt)&&cur<3) cyc(d,cur,Rt?1:-1);
    if(A){ if(cur===3) confirmDeck(); else cur=3; } }
  const inR=(x,y,r)=>x>=r[0]&&x<=r[0]+r[2]&&y>=r[1]&&y<=r[1]+r[3];
  function onDown(e){ if(phase!=='deck'||waiting) return; const r=canvas.getBoundingClientRect(),k=Math.min(r.width/W,r.height/H),x=(e.clientX-r.left-(r.width-W*k)/2)/k,y=(e.clientY-r.top-(r.height-H*k)/2)/k,d=T[ed].deck;
    if(inR(x,y,BTN)){ confirmDeck(); return; }
    for(let i=0;i<3;i++){ const X=CX0(i); if(inR(x,y,[X+2,SELY-18,44,36])){ cur=i; cyc(d,i,-1); return; } if(inR(x,y,[X+CW-46,SELY-18,44,36])){ cur=i; cyc(d,i,1); return; }
      if(inR(x,y,[X,CY0,CW,350])){ cur=i; return; }
      if(i<2&&inR(x,y,[X+CW,CY0+96,24,60])){ const tmp=d[i]; d[i]=d[i+1]; d[i+1]=tmp; env.sfx('place'); return; } } }
  if(canvas&&canvas.addEventListener&&FMT3){ canvas.addEventListener('pointerdown',onDown); canvas.style.touchAction='none'; }
  function drawDeck(){ themeBg(c,ST.th,t); c.fillStyle='rgba(8,8,20,.72)'; c.fillRect(0,0,W,H); const d=T[ed].deck;
    c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 22px '+TC; c.fillText((local2?(ed+1)+'P ':'')+'選 3 顆陀螺、排好出場順序（每回合派一顆上場）',W/2,24);
    c.fillStyle='rgba(255,255,255,.75)'; c.font='700 13px '+TC; c.fillText('點陀螺名稱用下拉選單選（或按 ◀ ▶ 換）、按 ⇄ 換出場順序　三顆的機體、棘輪、底座都不能重複'+(net?'　還剩 '+Math.max(0,Math.ceil(deckT))+' 秒':''),W/2,50);
    for(let i=0;i<3;i++){ const X=CX0(i),P=d[i],B=TOP[P.top],sel=cur===i; c.fillStyle='rgba(255,255,255,.08)'; rr(c,X,CY0,CW,354,14); c.fill(); c.strokeStyle=sel?'#ffd23f':'rgba(255,255,255,.2)'; c.lineWidth=2; c.stroke();
      c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText('第 '+(i+1)+' 顆出場',X+CW/2,CY0+18);
      c.fillStyle='rgba(255,255,255,.08)'; c.beginPath(); c.ellipse(X+CW/2,CY0+118,72,72*SQ,0,0,TAU); c.fill(); const pop=Math.max(0,1-(t-(popT[i]||-9))/.4); drawTop(c,X+CW/2,CY0+124-pop*18,2.4*(1+.22*pop),P,0,t*B.dir*(4+pop*20),.7); if(pop>0){ c.strokeStyle='rgba(255,210,63,'+pop+')'; c.lineWidth=3; c.beginPath(); c.ellipse(X+CW/2,CY0+124,90*(1.3-pop*.3),90*SQ*(1.3-pop*.3),0,0,TAU); c.stroke(); } /* 選好的陀螺彈出來亮相 */
      c.fillStyle=sel?'rgba(255,210,63,.25)':'rgba(0,0,0,.3)'; rr(c,X+6,SELY-17,CW-12,34,8); c.fill();
      c.fillStyle=sel?'#ffd23f':'#cfd6e2'; c.font='900 20px '+TC; c.fillText('◀',X+24,SELY+1); c.fillText('▶',X+CW-24,SELY+1);
      c.fillStyle='#fff'; c.font='900 16px '+TC; c.fillText(B.n,X+CW/2,SELY+1);
      c.fillStyle='#9ac8ff'; c.font='700 12px '+TC; c.fillText(B.code+'　'+B.rat+' '+BITN[B.bit],X+CW/2,SELY+30);
      c.fillStyle=TYPES[B.type]?['#ff6a5a','#5aa8ff','#5fd068','#ffd23f','#c8a0ff'][Object.keys(TYPES).indexOf(B.type)]:'#fff'; c.font='900 13px '+TC; c.fillText(B.type+(B.type==='左旋'?'特化型':'型'),X+CW/2,SELY+52);
      { const ab=AB[B.id],L=['攻','防','持','衝','耐'],CL=['#ff6a5a','#5aa8ff','#5fd068','#ff9d3d','#c8a0ff']; /* 官方能力值 */
        for(let q=0;q<5;q++){ const cx=X+CW/2+(q-2)*40; c.fillStyle='rgba(255,255,255,.08)'; rr(c,cx-18,SELY+66,36,30,6); c.fill(); c.fillStyle=CL[q]; c.font='900 11px '+TC; c.fillText(L[q],cx,SELY+74); c.fillStyle='#fff'; c.font='900 13px '+TC; c.fillText(ab[q],cx,SELY+88); } }
      c.fillStyle='rgba(255,255,255,.8)'; c.font='700 12px '+TC; wrapText(c,B.feat,X+CW/2,SELY+110,CW-24,17,3);
      if(i<2){ c.fillStyle='#3d8bff'; rr(c,X+CW+1,CY0+96,22,60,8); c.fill(); c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText('⇄',X+CW+12,CY0+126); } }
    c.fillStyle=cur===3?'#ffd23f':'#3ed16a'; rr(c,BTN[0],BTN[1],BTN[2],BTN[3],12); c.fill(); c.fillStyle='#14122b'; c.font='900 18px '+TC; c.fillText(local2&&ed===0?'確定，換 2P':'確定出場',W/2,BTN[1]+24);
    if(waiting){ c.fillStyle='rgba(8,8,20,.7)'; c.fillRect(0,0,W,H); c.fillStyle='#fff'; c.font='900 24px '+TC; c.fillText('等對手組好陀螺…',W/2,H/2); } }
  // 終結判定與給分
  function finish(f,kind,pk){ if(f.st!=='on') return; f.st=kind==='spin'?'stop':kind==='burst'?'burst':'out'; f.out=0; f.ox=f.x; f.oy=f.y; f.fly=(kind==='over'||kind==='x')&&!pk;
    const vk=teamKey(f); let to=null; if(f.last>=0&&rt-f.lastT<4&&teamKey(T[f.last])!==vk&&T[f.last].st==='on') to=teamKey(T[f.last]);
    if(!to){ const alive=[...new Set(T.filter(q=>q.st==='on'&&teamKey(q)!==vk).map(teamKey))]; if(alive.length===1) to=alive[0]; }
    const F=FIN[kind]; if(to) score[to]+=F.p;
    if(kind==='burst') addFx('burst',f.x,f.y,f.i); else if(kind!=='spin') addFx('out',f.x,f.y,0,kind);
    snd(kind==='spin'?'die':'boom'); if(kind!=='spin'){ shake=Math.max(shake,.35); hitstop=Math.max(hitstop,.12); }
    ban={k:kind,who:f.i,to,t:0}; if(host&&net) ev.push(['b',kind,f.i,to||'']);
    focus={x:f.x,y:f.y,who:f.i,t:kind==='spin'?.9:1.4}; if(kind!=='spin') slow=.9; roar(kind==='spin'?.6:1,kind==='spin'?1.6:2.6);
    voice(F.n+'！'+(to?keyName(to)+' 得 '+F.p+' 分，':'')+'比數 '+score[keys[0]]+' 比 '+score[keys[1]]); }
  function endRound(){ phase='after'; PT=2.4; }
  function aliveKeys(){ return [...new Set(T.filter(q=>q.st==='on').map(teamKey))]; }
  function stepTop(f,inp,h){ const K=f.k,frac=f.spin/100;
    f.ang+=K.dir*(6+34*frac)*h; if(f.cd>0) f.cd-=h; if(f.railCD>0) f.railCD-=h;
    let r=hyp(f.x,f.y)||.001,nx=f.x/r,ny=f.y/r,tx=-ny*K.dir,ty=nx*K.dir;
    let ax=-f.x*2.3*ST.slope,ay=-f.y*2.3*ST.slope; /* 碗面坡度：把陀螺一直拉回中間互撞 */
    ax+=tx*120*K.wander*K.mv*frac; ay+=ty*120*K.wander*K.mv*frac;
    f.wa+=(Math.random()-.5)*h*10; const wn=40*(.25+K.wander)*frac; ax+=Math.cos(f.wa)*wn; ay+=Math.sin(f.wa)*wn; /* 陀螺自己晃動 */
    if(f.kT>0) f.kT-=h; { const v=hyp(f.vx,f.vy)||.001,vd=K.cruise*Math.pow(frac,.6)*(f.spin<20?.5:1); if(v<vd&&!(f.kT>0)){ const a=(vd-v)*1.6; ax+=f.vx/v*a; ay+=f.vy/v*a; } /* 底座抓地自己往前跑（平頭跑得快、針頭幾乎不動） */
      f.cp=(f.cp||Math.random()*TAU)+h*(.8+Math.random()*.8); const cv=K.curv*K.dir*frac*h*(.3+.9*Math.sin(f.cp)),cs=Math.cos(cv),sn=Math.sin(cv),vx0=f.vx; f.vx=vx0*cs-f.vy*sn; f.vy=vx0*sn+f.vy*cs; } /* 順著旋轉方向轉彎，跑出花瓣路線 */
    if(f.spin>15&&!(f.kT>0)){ const tg=T.find(q=>q!==f&&q.st==='on'); if(tg){ const dx=tg.x-f.x,dy=tg.y-f.y,d=hyp(dx,dy); if(d>RAD*2.4){ const v=hyp(f.vx,f.vy)||1,cr=clamp((f.vx*dy-f.vy*dx)/(v*d),-1,1),tn=cr*(d<120?LUNGE:Math.max(K.seek,1.6)*1.25)*frac*h*clamp((rt-1)/1.5,0,1),cs=Math.cos(tn),sn=Math.sin(tn),vx0=f.vx; f.vx=vx0*cs-f.vy*sn; f.vy=vx0*sn+f.vy*cs; } const at=(ATT+60*Math.min(K.seek,3.5))*frac*clamp((rt-1)/1.5,0,1); ax+=dx/d*at; ay+=dy/d*at; } } /* 攻擊型底座一直掃向對手（真實比賽裡花瓣路線會反覆撞上中間的陀螺） */
    if(ST.wind){ const wd=Math.sin(windA)>0?1:-1; ax+=-ny*wd*70; ay+=nx*wd*70; }
    if(f.dashT>0){ f.dashT-=h; ax+=tx*1100*K.dash*(ST.lava?1.3:1); ay+=ty*1100*K.dash*(ST.lava?1.3:1);
      if(f.dashT<=0){ f.vx-=nx*260; f.vy-=ny*260; f.dEnd=rt; f.wallT=0; } }
    f.vx+=ax*h; f.vy+=ay*h; const damp=Math.exp(-h*ST.fric*(.35+.35/K.mv)*(f.spin<20?2:1)*(f.kT>0?.6:1)); f.vx*=damp; f.vy*=damp;
    const vmax=f.dashT>0?620:520,v=hyp(f.vx,f.vy); if(v>vmax){ f.vx*=vmax/v; f.vy*=vmax/v; }
    f.x+=f.vx*h; f.y+=f.vy*h;
    r=hyp(f.x,f.y); nx=f.x/r; ny=f.y/r; const wall=AR-RAD+6;
    if(r>wall){ const pk=inPk(ST,Math.atan2(f.y,f.x));
      if(pk){ const vr=f.vx*nx+f.vy*ny; if(vr<POCKV&&r<AR+4&&rt-f.lastT>.5){ if(vr>0){ f.vx-=vr*nx*1.6; f.vy-=vr*ny*1.6; } f.x=nx*Math.min(r,wall+4); f.y=ny*Math.min(r,wall+4); } /* 口袋前緣：慢慢滑過去不會掉，被撞或衝太快才出場 */
        else if(r>AR+6){ finish(f,pk.k==='x'?'x':'over',pk); return; } } /* 掉進紅色極限區域＝極限勝利 3 分，黃色擊飛區域＝擊飛勝利 2 分 */
      else { const vr=f.vx*nx+f.vy*ny; if(vr>470*Math.sqrt(K.wgt)&&rt-f.lastT<.35){ finish(f,'over',null); return; } /* 被重擊：直接飛過護欄出場＝擊飛勝利 */
        if(vr>170&&!(f.wcd>rt)){ f.wcd=rt+.25; wallHits++; addFx('wall',nx*AR,ny*AR,Math.round(vr),K.dir); snd(vr>320?'hurt':'bump'); shake=Math.max(shake,Math.min(.3,vr/1400)); if(vr>320){ hitstop=Math.max(hitstop,.05); roar(.45,1); } f.spin-=vr*.004; }
        if(vr>0){ f.vx-=vr*nx*1.75; f.vy-=vr*ny*1.75; } f.x=nx*wall; f.y=ny*wall; const touch=!f.wallT; f.wallT=(f.wallT||0)+h; if(f.wallT>.7&&f.dashT<=0){ f.wallT=0; f.vx-=nx*200; f.vy-=ny*200; } /* 貼著場邊太久會被彈回中間 */
        const vt=f.vx*(-ny*K.dir)+f.vy*(nx*K.dir);
        if(f.dashT<=0&&f.railCD<=0&&f.spin>25&&vt>70&&(touch?Math.random()<.42*K.dash:Math.random()<.02*K.dash*(1+vt/200))){ f.dashT=.34; f.railCD=1.6; addFx('dash',f.x,f.y); snd('boost'); }
        if(ST.lava) f.spin-=h*4; } }
    f.spin-=h*(1.3+hyp(f.vx,f.vy)/520)/K.sta*ST.decay*(1-.15*(f.over||0)); if(f.spin<=0){ f.spin=0; finish(f,'spin'); } }
  // 子彈獅鷲：激烈碰撞時內層子彈彈開，變成追撞對手的子彈單位，本體繼續旋轉
  function splitTop(f,o){ if(f.split||!TOP[f.P.top].x.split||f.st!=='on') return; f.split=true; f.k=Object.assign({},f.k,{wgt:f.k.wgt*.8,atk:f.k.atk*.9,sta:f.k.sta*1.1});
    const dx=o.x-f.x,dy=o.y-f.y,d=hyp(dx,dy)||1,px=-dy/d*K_SIDE(f),py=dx/d*K_SIDE(f);
    BUL.push({own:f.i,x:f.x+px*14,y:f.y+py*14,vx:f.vx*.4+px*330+dx/d*120,vy:f.vy*.4+py*330+dy/d*120,spin:Math.max(50,f.spin),ang:f.ang,cd:.35});
    addFx('dash',f.x,f.y); snd('boost'); voice('子彈分離！'); }
  const K_SIDE=f=>f.k.dir>0?1:-1;
  function stepBullet(b,h){ const own=T[b.own],o=T.find(q=>q.i!==b.own&&q.st==='on'); b.ang+=(10+40*b.spin/100)*h*K_SIDE(own); if(b.cd>0) b.cd-=h;
    let ax=-b.x*2.3*ST.slope,ay=-b.y*2.3*ST.slope;
    if(o){ const dx=o.x-b.x,dy=o.y-b.y,d=hyp(dx,dy)||1; ax+=dx/d*720*b.spin/100; ay+=dy/d*720*b.spin/100; } /* 子彈一直追著對手衝 */
    b.vx+=ax*h; b.vy+=ay*h; const dm=Math.exp(-h*ST.fric*.6); b.vx*=dm; b.vy*=dm; const v=hyp(b.vx,b.vy); if(v>560){ b.vx*=560/v; b.vy*=560/v; }
    b.x+=b.vx*h; b.y+=b.vy*h; const r=hyp(b.x,b.y)||1,nx=b.x/r,ny=b.y/r,wall=AR-10;
    if(r>wall){ if(inPk(ST,Math.atan2(b.y,b.x))&&r>AR+4){ b.spin=0; addFx('out',b.x,b.y,0,'over'); return; } const vr=b.vx*nx+b.vy*ny; if(vr>0){ b.vx-=vr*nx*1.8; b.vy-=vr*ny*1.8; } b.x=nx*wall; b.y=ny*wall; }
    b.spin-=h*(9+hyp(b.vx,b.vy)/200)*ST.decay;
    if(o&&b.cd<=0){ const dx=o.x-b.x,dy=o.y-b.y,d=hyp(dx,dy); if(d<RAD+11&&d>.01){ const nx2=dx/d,ny2=dy/d,vn=(b.vx-o.vx)*nx2+(b.vy-o.vy)*ny2,I=Math.max(0,vn)+140;
        const kb=I*1.25*own.k.atk/o.k.def/o.k.wgt*(1-.12*o.k.low); o.vx+=nx2*kb; o.vy+=ny2*kb; b.vx-=nx2*(I*1.3); b.vy-=ny2*(I*1.3); b.cd=.3;
        o.spin-=I*.012*own.k.atk/o.k.def; o.bm+=Math.max(0,I-200)*.12/(o.k.def*o.k.res); o.last=own.i; o.lastT=rt; b.spin-=6;
        addFx('spark',(b.x+o.x)/2,(b.y+o.y)/2,Math.round(I*.8)); snd('bump'); if(o.bm>=100) finish(o,'burst'); else if(o.spin<=0){ o.spin=0; finish(o,'spin'); } } } }
  function collide(a,b){ const dx=b.x-a.x,dy=b.y-a.y,d=hyp(dx,dy); if(d>=RAD*2||d<.01) return; const nx=dx/d,ny=dy/d,ma=a.k.wgt,mb=b.k.wgt,ov=RAD*2-d;
    a.x-=nx*ov*mb/(ma+mb); a.y-=ny*ov*mb/(ma+mb); b.x+=nx*ov*ma/(ma+mb); b.y+=ny*ov*ma/(ma+mb);
    const vn=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny; if(vn>-10) return;
    const fa=a.spin/100,fb=b.spin/100,same=a.k.dir===b.k.dir,ex=(same?300:120)*(a.k.atk*fa+b.k.atk*fb)/2+(a.dashT>0||b.dashT>0?230:0);
    const j=-(1.55)*vn/(1/ma+1/mb),I=-vn+ex*.6;
    const stab=f=>1.25-.25*f.spin/100,pw=f=>1+.08*(f.over||0); /* 轉速越低越站不穩、越容易被擊飛；極限轉速撞擊力更強 */
    const kb=KBK*(j+ex)*a.k.atk*pw(a)/b.k.def/mb*(1-.12*b.k.low)*stab(b),ka=KBK*(j+ex)*b.k.atk*pw(b)/a.k.def/ma*(1-.12*a.k.low)*stab(a);
    b.vx+=nx*kb; b.vy+=ny*kb; a.vx-=nx*ka; a.vy-=ny*ka;
    for(const [f,k] of [[a,ka],[b,kb]]) if(k>200){ const r=hyp(f.x,f.y)||1; f.vx+=f.x/r*k*.1; f.vy+=f.y/r*k*.1; if(k>200) f.kT=Math.min(.55,.2+k/1400); } /* 被撞的一方往外飛、一路滑到場邊 */
    b.spin-=I*.010*a.k.atk/b.k.def/Math.sqrt(b.k.sta); a.spin-=I*.010*b.k.atk/a.k.def/Math.sqrt(a.k.sta); /* 持久力高的被撞時轉速掉得少 */
    if(!same){ const m=(a.spin+b.spin)/2; a.spin+=(m-a.spin)*.12; b.spin+=(m-b.spin)*.12; }
    if(I>110&&rt>.8){ splitTop(a,b); splitTop(b,a); }
    const thr=210;
    if(I>thr){ b.bm+=(I-thr)*BMK*a.k.atk/(b.k.def*b.k.res)*(.4+Math.random()); a.bm+=(I-thr)*BMK*b.k.atk/(a.k.def*a.k.res)*(.4+Math.random()); }
    if(a.bm>=100&&b.bm>=100){ if(a.bm>b.bm) b.bm=99; else a.bm=99; } /* 同時爆裂只算一顆 */
    a.last=b.i; a.lastT=rt; b.last=a.i; b.lastT=rt; a.hs++; b.hs++;
    if(a.dashT>0||rt-a.dEnd<.4) b.lastX=rt; if(b.dashT>0||rt-b.dEnd<.4) a.lastX=rt;
    const mx=(a.x+b.x)/2,my=(a.y+b.y)/2; addFx('spark',mx,my,Math.round(I)); if(I>150) addFx('clash',mx,my,Math.round(I),Math.round(Math.atan2(ny,nx)*100)); snd(I>260?'hurt':'bump');
    if(I>260){ hitstop=Math.max(hitstop,.07); shake=Math.max(shake,.22); punch=.5; roar(.4,1); }
    for(const f of [a,b]) if(f.bm>=100&&f.st==='on') finish(f,'burst');
    if(a.spin<=0&&a.st==='on'){ a.spin=0; finish(a,'spin'); } if(b.spin<=0&&b.st==='on'){ b.spin=0; finish(b,'spin'); } }
  // 連線
  const pk=f=>[R1(f.x),R1(f.y),R1(f.vx),R1(f.vy),R1(f.spin),Math.round(f.bm),f.st,R1(f.dashT),R1(f.cd),R1(f.ox),R1(f.oy),R1(f.out),f.P.blade,f.P.ratchet,f.P.bit,R1(f.lx||0),R1(f.ly||0),f.split?1:0,f.sh==null?-1:R1(f.lp)];
  if(net){
    if(client) net.onmsg=m=>{ if(m.s){ m.s.f.forEach((a,i)=>{ const f=T[i]; if(!f) return; f.x=a[0]; f.y=a[1]; f.vx=a[2]; f.vy=a[3]; f.spin=a[4]; f.bm=a[5]; if(f.st!==a[6]&&a[6]!=='on'){ f.ta=Math.random()*TAU; } f.st=a[6]; f.dashT=a[7]; f.cd=a[8]; f.ox=a[9]; f.oy=a[10]; f.out=a[11]; if(a[12]&&f.P.top!==a[12]&&TOP[a[12]]){ f.P=partsOf({top:a[12]}); f.k=statsOf(f.P); f.col=TOP[a[12]].c; } if(a[15]!=null){ f.lx=a[15]; f.ly=a[16]; } f.split=!!a[17]; if(a[18]!=null){ if(a[18]<0){ f.sh=null; f.lp=0; } else { if(f.sh==null) f.sh=0; f.lp=a[18]; } } }); BUL=(m.s.bl||[]).map(q=>({own:q[0],x:q[1],y:q[2],spin:q[3],ang:0,vx:0,vy:0}));
        Object.assign(score,m.s.sc); if(m.s.fo){ fouls[0]=m.s.fo[0]; fouls[1]=m.s.fo[1]; } if(m.s.ph==='launch'&&phase!=='launch') shootT=0; phase=m.s.ph; PT=m.s.pt; round=m.s.rd; rt=m.s.rt; windA=m.s.wa;
        for(const e of m.s.ev){ if(e[0]==='s') env.sfx(e[1]); else if(e[0]==='b'){ ban={k:e[1],who:e[2],to:e[3]||null,t:0}; const v=T[e[2]]; if(v) focus={x:v.x,y:v.y,who:v.i,t:e[1]==='spin'?.9:1.4}; if(e[1]!=='spin'){ shake=.35; } } else if(e[0]==='v'){ refSay={txt:e[1],t:Math.max(1.3,e[1].length*.17)}; speak(e[1],e[2]); } else if(e[0]==='c'){ cheer=Math.max(cheer,e[1]*1.3); roarL(e[1],e[2]); } else spawn(e[0],e[1],e[2],e[3],e[4]); } }
      if(m.end){ winKey=m.end; phase='over'; PT=2.6; } };
    else { net.onmsg=(m,from)=>{ if(m.deck&&T[from]&&phase==='deck'){ T[from].deck=fixDeck(m.deck.map(q=>({top:q&&q.top}))); rdy[from]=true; } if(m.i){ const b=inBuf[from]||(inBuf[from]={...NOIN,dn:0}); b.mx=m.i[0]; b.my=m.i[1]; if(m.i[2]>b.dn){ b.dash=true; b.dn=m.i[2]; b.spd=m.i[3]||0; } } };
      net.onleave=i=>{ const f=T[i]; if(f){ rdy[i]=true; f.remote=false; f.ai={sk:.6,t:0,mx:0,my:0}; R.names[i]+='（離開）'; } }; } }
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt;
    for(const e of fx){ e.l-=dt; if(e.k==='sp'){ e.x+=e.vx*dt; e.y+=e.vy*dt; e.z+=e.vz*dt; e.vz-=600*dt; if(e.z<0){ e.z=0; e.vz*=-.4; } e.vx*=.97; e.vy*=.97; } else if(e.k==='sm'){ e.x+=e.vx*dt; e.y+=e.vy*dt; } }
    fx=fx.filter(e=>e.l>0); if(fx.length>500) fx.splice(0,fx.length-500);
    for(const d of deb){ d.l-=dt; d.x+=d.vx*dt; d.y+=d.vy*dt; d.z+=d.vz*dt; d.vz-=700*dt; d.ang+=d.va*dt; if(d.z<0){ d.z=0; d.vz*=-.35; d.vx*=.6; d.vy*=.6; d.va*=.6; } }
    deb=deb.filter(d=>d.l>0);
    if(ban) ban.t+=dt; if(shake>0) shake-=dt;
    for(const f of T) if(f.st!=='on') f.out=Math.min(1.5,f.out+dt);
    if(hitstop>0){ hitstop-=dt; return; }
    if(phase==='deck'){ deckKeys(); if(net){ deckT-=dt; if(deckT<=0&&!waiting) confirmDeck(); }
      if(!client){ if(net&&deckT<-5) T.forEach((f,i)=>rdy[i]=true); if(rdy.every(Boolean)){ T.forEach(setP); prepAim(); phase='aim'; PT=5.6; lastBeep=9; waiting=false; voice('第 1 回合，選好落點！'); }
        if(net){ sendT-=dt; if(sendT<=0){ sendT=1/10; net.send({s:{f:T.map(pk),sc:score,ph:phase,pt:R1(PT),rd:round,rt:0,wa:0,ev}}); ev=[]; } } }
      return; }
    // 自己的按鍵（只用來移動落點）
    const lin=[]; for(const f of T) if(f.local) lin[f.i]=readIn(env,local2?f.i:0,local2);
    if(env.hit('KeyV')) camOn=!camOn;
    visStep(dt); camStep(dt);
    if(client){ const q=lin[me]||NOIN; myIn=q; for(const f of T){ f.ang+=f.k.dir*(6+34*f.spin/100)*dt; if(f.st==='on'&&phase!=='aim'&&phase!=='launch'){ f.x+=f.vx*dt; f.y+=f.vy*dt; } } for(const b of BUL) b.ang+=30*dt;
      if(phase==='launch'){ shootT+=dt; for(const f of T) if(f.sh!=null) f.lp+=dt; if(local2&&myIn.dash&&T[me]&&T[me].sh==null) shotN++; }
      sendT-=dt; if(sendT<=0){ sendT=1/20; net.send({i:[myIn.mx,myIn.my,shotN,shotV]}); } if(phase==='over'){ PT-=dt; if(PT<=0&&!ended){ ended=true; finishGame(); } } return; }
    const sdt=slow>0?dt*.3:dt; if(slow>0) slow-=dt;
    if(phase==='aim'){ PT-=dt; const n=Math.ceil(PT-.6); if(n<lastBeep&&n>=1&&n<=3){ lastBeep=n; snd('beep'); voice(String(n),1); }
      for(const f of T){ let mx=0,my=0;
        if(f.local){ const q=lin[f.i]||NOIN; mx=q.mx; my=q.my; } else if(f.remote){ const b=inBuf[f.i]; if(b){ mx=b.mx||0; my=b.my||0; } }
        else { const dx=f.tx-f.lx,dy=f.ty-f.ly,d=hyp(dx,dy); if(d>5){ mx=dx/d; my=dy/d; } }
        const m=hyp(mx,my); if(m>1){ mx/=m; my/=m; } f.lx+=mx*200*dt; f.ly+=my*200*dt; clampAim(f); }
      if(PT<=.6&&lastBeep>0){ lastBeep=0; snd('go'); voice('Go Shoot！',1); roar(.7,1.6); phase='launch'; shootT=0; PT=LD; } }
    else if(phase==='launch'){ shootT+=dt; /* 喊完 GO SHOOT 才能按發射鍵，反應越快轉速越高；3 秒沒按就自動發射 */
      const late=[]; for(const f of T){ if(f.sh==null){ let go=false,v=null; if(f.local) go=local2&&!!(lin[f.i]||NOIN).dash; else if(f.remote){ const b=inBuf[f.i]; if(b&&b.dash){ go=true; b.dash=false; v=b.spd||null; } } else go=shootT>=f.aiR; if(go) shoot(f,v); else if(shootT>=SHOOT_MAX+(f.remote?.35:0)&&f.human) late.push(f); /* 連線的對手多給一點網路延遲的時間 */ else if(shootT>=SHOOT_MAX) shoot(f); }
        else { f.lp+=dt; if(f.lp>=LD&&!f.landed){ f.landed=true; land(f); shake=Math.max(shake,.1); snd('bump'); } }
        const [pl]=lu(f); f.ang+=f.k.dir*(f.sh==null?10:pl<1?10+80*yank(pl):40)*dt; } /* 拉線時陀螺越轉越快 */
      if(late.length){ foul(late); return; }
      if(T.every(f=>f.landed)){ phase='fight'; rt=0; } }
    else if(phase==='fight'||phase==='after'){ const steps=Math.max(1,Math.ceil(sdt/(1/120))),h=sdt/steps; rt+=sdt; windA+=sdt*Math.PI/6;
      for(let s=0;s<steps;s++){ for(let i=0;i<T.length;i++) if(T[i].st==='on') stepTop(T[i],NOIN,h);
        for(let i=0;i<T.length;i++) for(let k=i+1;k<T.length;k++) if(T[i].st==='on'&&T[k].st==='on') collide(T[i],T[k]);
          for(const b of BUL) stepBullet(b,h); BUL=BUL.filter(b=>b.spin>0); }
      if(phase==='fight'){ const ak=aliveKeys();
        if(ak.length<=1) endRound();
        else if(rt>=RT){ /* 時間到：轉速最高的一方拿旋轉勝利 */ let best=null,bs=-1; for(const f of T) if(f.st==='on'&&f.spin>bs){ bs=f.spin; best=f; } const loser=T.filter(f=>f.st==='on'&&teamKey(f)!==teamKey(best)); for(const f of loser){ f.last=best.i; f.lastT=rt; finish(f,'spin'); } endRound(); } }
      else { PT-=sdt; if(PT<=0){ const top=Object.keys(score).filter(k=>score[k]>=TARGET).sort((a,b)=>score[b]-score[a]); if(top.length){ winKey=top[0]; phase='over'; PT=3.2; snd('win'); voice('比賽結束！'+keyName(winKey)+' 獲勝！'); roar(1,3); if(net) net.send({end:winKey}); } else { ban=null; setupRound(); } } } }
    else if(phase==='over'){ PT-=dt; if(PT<=0&&!ended){ ended=true; finishGame(); } }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/20; net.send({s:{f:T.map(pk),sc:score,ph:phase,pt:R1(PT),rd:round,fo:fouls,rt:R1(rt),wa:R1(windA),ev,bl:BUL.map(b=>[b.own,R1(b.x),R1(b.y),R1(b.spin)])}}); ev=[]; } } }
  // 衝刺時軌道磨出火花、地上留下擦痕；觀眾情緒、裁判對話框
  function visStep(dt){ for(const f of T){ if(f.hint>0) f.hint-=dt; if(f.hint2>0) f.hint2-=dt; } if(cheer>0) cheer=Math.max(0,cheer-dt*.35); if(refSay){ refSay.t-=dt; if(refSay.t<=0) refSay=null; }
    if(phase==='fight'||phase==='after') for(const f of T) if(f.st==='on'&&hyp(f.vx,f.vy)>330){ f.ghT=(f.ghT||0)-dt; if(f.ghT<=0){ f.ghT=.03; fx.push({k:'gh',x:f.x,y:f.y,l:.16,L:.16,c:f.col}); } }
    for(const f of T) if(f.st==='on'&&f.dashT>0&&(phase==='fight'||phase==='after')){ const r=hyp(f.x,f.y)||1,nx=f.x/r,ny=f.y/r,wx=f.x+nx*RAD*.9,wy=f.y+ny*RAD*.9,tx=-ny*f.k.dir,ty=nx*f.k.dir;
      for(let i=0;i<3;i++){ const q=(Math.random()-.5)*.8,s=120+Math.random()*240; fx.push({k:'sp',x:wx,y:wy,z:3,vx:(-tx+nx*.5+q)*s,vy:(-ty+ny*.5-q)*s,vz:40+Math.random()*100,l:.12+Math.random()*.25,c:Math.random()<.5?'#fff3c0':'#ffb040'}); }
      fx.push({k:'tr',x:f.x,y:f.y,l:1.6,L:1.6}); } }
  // 鏡頭：發射時看全場，對戰時跟著兩顆陀螺、靠近時拉近，終結時特寫
  const scr=(x,y)=>[sx(x),sz(x,y)];
  function camStep(dt){ let tx=W/2,ty=H/2,tz=1; const on=T.filter(f=>f.st==='on');
    if(camOn&&(phase==='fight'||phase==='after'||phase==='launch')){
      if(phase==='launch'){ tz=1.08; ty=CY-10; }
      else if(focus&&focus.t>0){ const v=T[focus.who],p=v&&v.st==='out'?topScreen(v):scr(focus.x,focus.y); tx=p[0]; ty=p[1]-24; tz=v&&v.fly?1.45:1.8; } /* 鏡頭跟著掉進洞／飛出去的陀螺 */
      else if(on.length){ let ax=0,ay=0; on.forEach(f=>{ const p=scr(f.x,f.y); ax+=p[0]; ay+=p[1]; }); ax/=on.length; ay/=on.length; let d=0; if(on.length>1){ const p=scr(on[0].x,on[0].y),q=scr(on[1].x,on[1].y); d=hyp(p[0]-q[0],(p[1]-q[1])/SQ); }
        tz=clamp(1.62-d/400,1.06,1.5); tx=W/2+(ax-W/2)*.8; ty=H/2+(ay-24-H/2)*.8; } }
    if(punch>0){ tz+=punch*.18; punch=Math.max(0,punch-dt*2); }
    const k=Math.min(1,dt*(focus&&focus.t>0?5:2)); cam.z+=(tz-cam.z)*k; cam.x+=(tx-cam.x)*k; cam.y+=(ty-cam.y)*k;
    const hw=W/2/cam.z,hh=H/2/cam.z; cam.x=clamp(cam.x,hw,W-hw); cam.y=clamp(cam.y,hh,H-hh); if(focus) focus.t-=dt; }
  function finishGame(){ if(opts.preview){ env.end({}); return; } const myKey=teamKey(T[me]),won=winKey===myKey;
    const rows=keys.slice().sort((a,b)=>score[b]-score[a]).map((k,i)=>'<tr><td>'+(i+1)+'</td><td>'+keyName(k)+'</td><td>'+score[k]+' 分</td></tr>').join('');
    if(won&&!net&&!local2) recWin(ST.name);
    env.sfx(won||local2?'win':'lose');
    env.end({title:local2?keyName(winKey)+' 獲勝！':won?'你贏了！':keyName(winKey)+' 獲勝',big:ST.name,html:'<table class="ls"><tr><th>名次</th><th>選手</th><th>得分</th></tr>'+rows+'</table>',
      text:'旋轉勝利 1 分、擊飛勝利 2 分、爆裂勝利 2 分、極限勝利 3 分，先拿 '+TARGET+' 分的贏。'+'（每人 3 顆輪流上場）',score:null,next:!net&&!local2&&won&&si<STAGES.length-1}); }
  // 畫面
  function topScreen(f){ let x=f.x,y=f.y,z=0; const L=LPOS[f.i]||LPOS[0];
    if(phase==='aim'){ x=L[0]; y=L[1]; z=LZ-26; }
    else if(phase==='launch'){ const u=lu(f)[1]; x=L[0]+(f.lx-L[0])*u; y=L[1]+(f.ly-L[1])*u; z=(LZ-26)*(1-u)+70*Math.sin(Math.PI*u); }
    else if(f.st==='out'){ const r=hyp(f.ox,f.oy)||1;
      if(f.fly){ const u=Math.min(1,f.out/.9); x=f.ox+f.ox/r*150*u; y=f.oy+f.oy/r*150*u; z=200*u-260*u*u; } /* 撞飛過護欄：往外高高飛出去 */
      else { const u=Math.min(1,f.out/.8); x=f.ox+f.ox/r*34*Math.min(1,u*1.6); y=f.oy+f.oy/r*34*Math.min(1,u*1.6); z=-55*u*u; } } /* 掉進口袋：滑進洞裡往下沉 */
    return [sx(x),sz(x,y)-z,z,x,y]; }
  let shootT=0,shotN=0,shotV=0; const SHOOT_MAX=1,fouls=[0,0]; /* 喊 GO SHOOT 後 1 秒內要發射，晚了就是發射失敗 */
  // 發射轉速（RPM）：10,000 以下初階、10,000～13,999 一般、14,000～15,999 專業、16,000 以上極限（要握把式發射器才拉得到，最高約 18,000）
  const rpmOfV=(v,ls)=>{ const u=Math.pow(clamp((v-250)/1450,0,1),.85); let r=6000+12000*u+(Math.random()-.5)*500; return Math.round(clamp(r,5500,ls==='grip'?18000:15900)/10)*10; };
  const spinOfV=(v,ls)=>spinOfR(rpmOfV(v,ls));
  function shoot(f,v){ f.sh=shootT; f.lp=0; f.pull=0; snd('boost'); if(f.human){ const r=v!=null?rpmOfV(v,f.ls):Math.round(clamp(15500-(shootT-.2)*9000,9000,15500)/10)*10; setRPM(f,r); voice(rpmTier(r).say,1); } }
  function setRPM(f,r){ f.rpm=r; f.spin=spinOfR(r); f.over=clamp((r-16000)/2000,0,1); f.shv=r; } /* 超過 16,000 RPM 額外更持久、更有力 */
  // 滑鼠／手指拖曳拉繩：放開時看最後一段的拉動速度
  const drags={};
  function cvXY(e){ const r=canvas.getBoundingClientRect(),k=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*k)/2)/k,(e.clientY-r.top-(r.height-H*k)/2)/k]; }
  // 拖曳軌道：按住軌道上的握把，往外拖到底或放開就發射
  const TRK=i=>{ const sd=i?-1:1; return {sd,x0:i?650:150,y:412,len:230}; };
  const canDrag=i=>{ const f=T[i]; return f&&f.human&&f.local&&f.sh==null&&phase==='launch'&&!Object.values(drags).some(d=>d.i===i); };
  function onPDown(e){ const [x,y]=cvXY(e);
    if(phase==='aim'){ for(const f of T){ if(!f.human||!f.local||(!local2&&f.i!==me)) continue; const tr=TRK(f.i); if(hyp(x-tr.x0,y-tr.y)<44){ f.hint2=1.2; e.preventDefault(); } } return; } /* 還沒喊 GO SHOOT：鎖住 */
    if(phase!=='launch') return;
    for(let i=0;i<T.length;i++){ if(!canDrag(i)||(!local2&&i!==me)) continue; const tr=TRK(i),kx=tr.x0+tr.sd*(T[i].pull||0)*tr.len; if(hyp(x-kx,y-tr.y)>44) continue;
      drags[e.pointerId]={i,off:x-kx,pts:[[performance.now(),(T[i].pull||0)*tr.len]]}; T[i].grab=true; try{ canvas.setPointerCapture(e.pointerId); }catch(er){} e.preventDefault(); return; } }
  function onPMove(e){ const d=drags[e.pointerId]; if(!d) return; const [x]=cvXY(e),f=T[d.i],tr=TRK(d.i); if(f.sh!=null) return;
    f.pull=clamp((x-d.off-tr.x0)*tr.sd/tr.len,0,1); d.pts.push([performance.now(),f.pull*tr.len]); if(d.pts.length>40) d.pts.shift();
    if(f.pull>=1){ delete drags[e.pointerId]; release(d,f); } } /* 拉到底直接發射 */
  function onPUp(e){ const d=drags[e.pointerId]; if(!d) return; delete drags[e.pointerId]; const f=T[d.i]; f.grab=false; if(phase!=='launch'||f.sh!=null){ f.pull=0; return; }
    if(f.pull<.35){ f.pull=0; f.hint=1.2; return; } /* 拉太短不算，握把彈回去 */
    release(d,f); }
  function release(d,f){ f.grab=false; const P=d.pts,Lp=P[P.length-1]; let q=P.length-1; while(q>0&&Lp[0]-P[q-1][0]<120) q--; const A=P[q],dt=Math.max(.016,(Lp[0]-A[0])/1000),v=Math.max((Lp[1]-A[1])/dt,(Lp[1]-P[0][1])/Math.max(.05,(Lp[0]-P[0][0])/1000));
    if(client){ shotN++; shotV=Math.round(v); f.pull=0; f.sh=0; f.shv=rpmOfV(v,f.ls); } else shoot(f,v); }
  if(canvas&&canvas.addEventListener){ canvas.addEventListener('pointerdown',onPDown); canvas.addEventListener('pointermove',onPMove); canvas.addEventListener('pointerup',onPUp); canvas.addEventListener('pointercancel',onPUp); }
  // 喊完 GO SHOOT 超過時間還沒發射＝犯規；同一人犯規 2 次，對方得 1 分，之後重新發射
  function foul(list){ for(const f of list){ fouls[f.i]++; const opp=T.find(q=>teamKey(q)!==teamKey(f)),ok=opp&&fouls[f.i]>=2?teamKey(opp):null; if(ok){ fouls[f.i]=0; score[ok]+=1; }
      ban={k:'foul',who:f.i,to:ok,t:0}; if(host&&net) ev.push(['b','foul',f.i,ok||'']); }
    for(const k in drags) delete drags[k]; snd('lose'); roar(.5,1.2); const f=list[0],ok=ban.to; round--; setupRound(); ban={k:'foul',who:f.i,to:ok,t:0}; PT=ok?7.2:6.6; /* 先讓裁判把失誤講完，再重新喊 3、2、1，GO SHOOT */
    voice(R.names[f.i]+' 發射失敗！'+(ok?'失誤兩次，'+keyName(ok)+' 得 1 分，比數 '+score[keys[0]]+' 比 '+score[keys[1]]:'記失誤一次，重新發射'),1);
    const top=Object.keys(score).filter(k=>score[k]>=TARGET); if(top.length){ winKey=top[0]; phase='over'; PT=3.2; snd('win'); voice('比賽結束！'+keyName(winKey)+' 獲勝！'); roar(1,3); if(net) net.send({end:winKey}); } }
  function lu(f){ const u0=phase==='launch'&&f&&f.sh!=null?clamp(f.lp/LD,0,1):0; return [clamp(u0/PF,0,1),clamp((u0-PF)/(1-PF),0,1)]; } /* [拉線進度, 飛行進度] */
  const shootKey=f=>local2?(f.i?'Enter':'F'):'';
  const yank=pl=>clamp((pl-.3)/.7,0,1); /* 拉線前 30% 握住繩把，後面一口氣拉出 */
  function view(k){ const z=1+(cam.z-1)*k,fx=W/2+(cam.x-W/2)*k,fy=H/2+(cam.y-H/2)*k; c.translate(W/2,H/2); c.scale(z,z); c.translate(-fx,-fy); }
  function refState(){ if(phase==='aim'){ const n=Math.ceil(PT-.6); return n<=3&&n>=1?['count',n]:['idle']; } if(phase==='launch'||(phase==='fight'&&rt<.8)) return ['go'];
    if(ban&&ban.t<2.4&&ban.to) return ['point',ban.to===keys[0]?0:1]; return ['idle']; }
  function bubble(txt){ c.font='900 15px '+TC; const w=Math.min(330,c.measureText(txt).width+52),x1=W-12-w,y1=10; c.fillStyle='rgba(255,255,255,.95)'; rr(c,x1,y1,w,32,10); c.fill(); /* 裁判對話框固定在右上角，鏡頭拉近也看得到 */
    c.beginPath(); c.moveTo(W-70,y1+30); c.lineTo(W-58,y1+44); c.lineTo(W-50,y1+30); c.fill(); c.fillStyle='#14122b'; c.textAlign='left'; c.textBaseline='middle'; c.fillText('🎙',x1+10,y1+16); c.textAlign='center'; c.fillText(txt,x1+w/2+12,y1+16,w-44); }
  const drawLauncher=(X,Y,col,sd,pl,ready,cut,lc,ls)=>drawLauncherC(c,X,Y,col,sd,pl,ready,cut,lc,ls);
  // 選陀螺：每顆名稱的位置放一個下拉選單（疊在畫面上），選了馬上換；別格已經選的陀螺不會出現在選單裡
  let selBox=null; const popT=[];
  function deckUI(){ const show=phase==='deck'&&!waiting&&canvas&&canvas.isConnected&&env.stage&&!opts.preview;
    if(!show){ if(selBox){ selBox.remove(); selBox=null; } return; }
    if(!selBox){ selBox=document.createElement('div'); selBox.style.cssText='position:absolute;left:0;top:0;width:0;height:0;z-index:4'; env.stage.appendChild(selBox);
      selBox.sels=[0,1,2].map(i=>{ const sl=document.createElement('select'); sl.setAttribute('aria-label','第 '+(i+1)+' 顆陀螺');
        sl.style.cssText='position:absolute;box-sizing:border-box;font-weight:900;font-family:'+TC+';background:#1d1a3a;color:#fff;border:2px solid #ffd23f;border-radius:8px;padding:0 6px;text-align:center;text-align-last:center;cursor:pointer;outline:none';
        sl.addEventListener('change',()=>{ const d=T[ed].deck; if(clash(d,i,sl.value)){ selBox.key=''; return; } d[i]=partsOf({top:sl.value}); cur=i; popT[i]=t; env.sfx('item'); selBox.key=''; });
        sl.addEventListener('focus',()=>{ cur=i; }); selBox.appendChild(sl); return sl; }); }
    const r=canvas.getBoundingClientRect(),pr=env.stage.getBoundingClientRect(),k=Math.min(r.width/W,r.height/H),ox=r.left-pr.left+(r.width-W*k)/2,oy=r.top-pr.top+(r.height-H*k)/2;
    const d=T[ed].deck,key=ed+':'+d.map(q=>q.top).join()+'|'+k.toFixed(3)+'|'+Math.round(ox)+'|'+Math.round(oy); if(selBox.key===key) return; selBox.key=key;
    selBox.sels.forEach((sl,i)=>{ const X=CX0(i); const hh=Math.max(30,32*k); Object.assign(sl.style,{left:(ox+(X+40)*k)+'px',top:(oy+SELY*k-hh/2)+'px',width:((CW-80)*k)+'px',height:hh+'px',fontSize:Math.max(12,14*k)+'px'}); /* 手機上至少 30px 高，手指點得到 */
      sl.innerHTML=TOPS.filter(q=>q.id===d[i].top||!d.some((o,j)=>j!==i&&o.top===q.id)).map(q=>{ const bad=q.id!==d[i].top&&clash(d,i,q.id); /* 棘輪或底座和別顆重複：看得到但不能選 */
        return '<option value="'+q.id+'"'+(q.id===d[i].top?' selected':'')+(bad?' disabled':'')+'>'+q.n+(bad?'（零件重複）':'')+'</option>'; }).join(''); }); }
  function draw(){ deckUI(); if(phase==='deck'){ drawDeck(); return; } c.save(); if(shake>0) c.translate((Math.random()-.5)*shake*24,(Math.random()-.5)*shake*24);
    c.save(); view(.12); themeBg(c,ST.th,t); c.restore();
    c.save(); view(.4); drawCrowd(c,t,cheer); c.restore();
    c.save(); view(.75); drawFloor(c,ST.th); const rs=refState(); drawRef(c,REFX,REFY,1,rs[0],t,!!refSay,rs[1]); c.restore();
    c.save(); view(1); c.drawImage(bg,0,0,W,H);
    // 地上的擦痕與煙
    for(const e of fx){ if(e.k==='tr'){ c.globalAlpha=e.l/e.L*.28; c.fillStyle='#14141c'; c.beginPath(); c.ellipse(sx(e.x),sz(e.x,e.y),9,9*SQ,0,0,TAU); c.fill(); }
      else if(e.k==='gh'){ c.globalAlpha=e.l/e.L*.32; c.fillStyle=e.c; c.beginPath(); c.ellipse(sx(e.x),sz(e.x,e.y)-9,20*S*TS*.85,20*S*TS*.85*SQ,0,0,TAU); c.fill(); } /* 被撞飛的殘影 */
      else if(e.k==='sm'){ c.globalAlpha=e.l/e.L*.35; c.fillStyle='#d8d8d8'; c.beginPath(); c.arc(sx(e.x),sz(e.x,e.y)-6,8+(1-e.l/e.L)*16,0,TAU); c.fill(); } }
    c.globalAlpha=1;
    for(const d of deb){ c.globalAlpha=Math.min(1,d.l); const X=sx(d.x),Y=sz(d.x,d.y)-d.z; softShadow(c,X,sz(d.x,d.y),12,.35);
      if(d.p===0){ c.save(); c.translate(X,Y); c.scale(1,SQ); c.rotate(d.ang); const mg=c.createLinearGradient(-14,-14,14,14); mg.addColorStop(0,'#f0f2f6'); mg.addColorStop(.5,'#7a8090'); mg.addColorStop(1,'#d8dce4'); bladePath(c,TOP[d.P.top].sh,20*S*.62); c.fillStyle=mg; c.fill(); bladePath(c,TOP[d.P.top].sh,20*S*.45); c.fillStyle=d.col; c.fill(); c.restore(); }
      else if(d.p===1){ c.fillStyle='#2a2d36'; c.beginPath(); c.ellipse(X,Y+2,9,9*SQ,0,0,TAU); c.fill(); c.fillStyle='#5a6070'; c.beginPath(); c.ellipse(X,Y,9,9*SQ,d.ang,0,TAU); c.fill(); c.fillStyle='#30343f'; c.beginPath(); c.ellipse(X,Y,5,5*SQ,0,0,TAU); c.fill(); }
      else { c.fillStyle='#2a2d36'; c.beginPath(); c.moveTo(X-5,Y-4); c.lineTo(X+5,Y-4); c.lineTo(X,Y+5); c.fill(); } }
    c.globalAlpha=1;
    // 選落點：落點標記＋拋物線
    if(phase==='aim'||phase==='launch') for(const f of T){ const [mx,my]=scr(f.lx,f.ly),col=PCOL[f.i],pu=1+Math.sin(t*6)*.08,mine=f.human&&(local2||f.i===me);
      const la=phase==='launch'?1-clamp(f.lp/LD,0,1)*(f.sh!=null?1:0):1; c.globalAlpha=la; c.strokeStyle=col; c.lineWidth=3; c.beginPath(); c.ellipse(mx,my,24*pu,24*SQ*pu,0,0,TAU); c.stroke(); c.fillStyle=col; c.globalAlpha*=.22; c.fill(); c.globalAlpha=la;
      c.lineWidth=2; c.beginPath(); c.moveTo(mx-10,my); c.lineTo(mx+10,my); c.moveTo(mx,my-6); c.lineTo(mx,my+6); c.stroke();
      if(phase==='aim'){ const L=LPOS[f.i]||LPOS[0],X0=sx(L[0]),Y0=sz(L[0],L[1])-LZ+26; c.setLineDash([5,7]); c.lineWidth=2; c.globalAlpha=.55; c.beginPath(); c.moveTo(X0,Y0); c.quadraticCurveTo((X0+mx)/2,Math.min(Y0,my)-80,mx,my); c.stroke(); c.setLineDash([]); c.globalAlpha=1;
        const nm=mine&&!local2?'你的落點':R.names[f.i].slice(0,6)+' 的落點'; c.font='900 11px '+TC; c.textAlign='center'; c.textBaseline='middle'; const w2=c.measureText(nm).width+12; c.fillStyle=mine?'#ffd23f':'rgba(11,10,28,.75)'; rr(c,mx-w2/2,my+14,w2,15,7); c.fill(); c.fillStyle=mine?'#14122b':'#fff'; c.fillText(nm,mx,my+22); }
      c.globalAlpha=1; }
    for(const b of BUL) drawBullet(c,sx(b.x),sz(b.x,b.y),b.ang,b.spin/100);
    const order=T.slice().sort((a,b)=>topScreen(a)[1]-topScreen(b)[1]);
    for(const f of order){ const [X,Y,z,wx,wy]=topScreen(f),frac=f.spin/100;
      if(f.st==='burst') continue;
      if(f.st==='out'&&f.out>(f.fly?.9:.8)) continue;
      if(phase==='aim'||phase==='launch'){ const [pl,u]=lu(f),L=LPOS[f.i]||LPOS[0],jit=phase==='launch'&&pl<1&&pl>.3?(Math.random()-.5)*2.4:0;
        if(u>0) softShadow(c,sx(wx),sz(wx,wy),26*u+8,.15+.35*u);
        drawTop(c,X+jit,Y,S*TS,f.P,f.col,f.ang,phase==='launch'&&f.sh!=null?Math.max(.3,yank(pl)):0,{tilt:(1-u)*9,ta:f.i?2.4:.7,noShadow:true,still:phase==='aim'});
        if(u<1){ c.globalAlpha=1-u; drawLauncher(sx(L[0])+jit,sz(L[0],L[1])-LZ-u*30,PCOL[f.i],f.i?-1:1,phase==='launch'?(f.sh==null?(f.pull||0)*.6:yank(pl)):0,false,false,f.lc,f.ls); c.globalAlpha=1; }
        if(phase==='aim'&&f.human&&round===1&&!opts.preview) meArrow(c,sx(L[0]),sz(L[0],L[1])-LZ-46,local2?(f.i+1)+'P':'你',t);
        continue; }
      let tilt=0,ta=0; if(f.st==='on'&&f.spin<28){ tilt=(28-f.spin)/28*7; ta=t*(10-f.spin*.2); } if(f.st==='stop'){ tilt=12; ta=f.ta||.7; }
      if(f.st==='out'){ c.globalAlpha=f.fly?1-Math.max(0,(f.out-.6)/.3):1-Math.max(0,(f.out-.35)/.45); tilt=f.fly?20:8+f.out*40; ta=f.out*14; }
      drawTop(c,X,Y,S*TS,f.P,f.col,f.ang,f.st==='on'?frac:0,{tilt,ta,still:f.st!=='on',split:f.split});
      c.globalAlpha=1;
      if(f.dashT>0){ const dg=c.createRadialGradient(X,Y-10,0,X,Y-10,40); dg.addColorStop(0,'rgba(255,170,80,.45)'); dg.addColorStop(1,'rgba(255,120,40,0)'); c.fillStyle=dg; c.fillRect(X-40,Y-50,80,80); }
      if(f.st==='on'&&phase!=='over'&&cam.z<1.3){ const nm=R.names[f.i].slice(0,6),mine=local2?f.human:f.i===me&&f.human; c.font='900 11px '+TC; c.textAlign='center'; c.textBaseline='middle'; const w2=c.measureText(nm).width+12;
        c.fillStyle=mine?'#ffd23f':'rgba(11,10,28,.7)'; rr(c,X-w2/2,Y+14,w2,15,7); c.fill(); c.fillStyle=mine?'#14122b':'#fff'; c.fillText(nm,X,Y+22); } }
    c.drawImage(stadiumFront(si),0,0,W,H); /* 前半圈透明護罩 */
    // 火花、撞擊閃光、衝擊波（不用加亮混色，部分手機會很卡）
    c.lineCap='round';
    for(const e of fx){ if(e.k==='sl'){ const u=1-e.l/e.L,X=sx(e.x),Y=sz(e.x,e.y)-12,dx=Math.cos(e.a),dy=Math.sin(e.a)*SQ,d0=e.r*u*.7,d1=e.r*(.35+u*.9); c.globalAlpha=e.l/e.L; c.strokeStyle='#fffbe8'; c.lineWidth=4*e.l/e.L+1; c.beginPath(); c.moveTo(X+dx*d0,Y+dy*d0); c.lineTo(X+dx*d1,Y+dy*d1); c.stroke(); } /* 撞擊放射線 */
      else if(e.k==='wf'){ const a=e.l/e.L,RL=TH[ST.th].rail||TH[ST.th].acc; for(const [lw,al] of [[16,.25],[7,.6],[3,1]]){ c.globalAlpha=a*al; c.strokeStyle=al<1?RL:'#ffffff'; c.lineWidth=lw; c.beginPath(); c.ellipse(CX,CY,(AR+9)*S,(AR+9)*S*SQ,0,e.a-e.w,e.a+e.w); c.stroke(); } } } /* 撞牆時軌道閃光 */
    c.globalAlpha=1;
    for(const e of fx){ if(e.k==='sp'){ const X=sx(e.x),Y=sz(e.x,e.y)-e.z; c.globalAlpha=Math.min(1,e.l*4); c.strokeStyle=e.c; c.lineWidth=1.7; c.beginPath(); c.moveTo(X,Y); c.lineTo(X-e.vx*.028*S,Y-e.vy*.028*S*SQ+e.vz*.02); c.stroke(); }
      else if(e.k==='glow'){ const a=e.l/e.L,X=sx(e.x),Y=sz(e.x,e.y)-10,rg=c.createRadialGradient(X,Y,0,X,Y,e.r); rg.addColorStop(0,'rgba(255,250,225,'+a*.95+')'); rg.addColorStop(.25,'rgba(255,200,110,'+a*.5+')'); rg.addColorStop(1,'rgba(255,120,40,0)'); c.globalAlpha=1; c.fillStyle=rg; c.fillRect(X-e.r,Y-e.r,e.r*2,e.r*2); } }
    for(const e of fx) if(e.k==='ring'){ const a=e.l/e.L; c.globalAlpha=a*.6; c.strokeStyle=e.c; c.lineWidth=3*a+.6; c.beginPath(); c.ellipse(sx(e.x),sz(e.x,e.y)-6,(1-a)*e.r*S+8,((1-a)*e.r*S+8)*SQ,0,0,TAU); c.stroke(); }
    c.globalAlpha=1; c.restore(); c.restore();
    for(const e of fx) if(e.k==='flash'){ c.fillStyle='rgba(255,250,230,'+(e.l/e.L*.35)+')'; c.fillRect(0,0,W,H); }
    if(slow>0){ c.fillStyle='rgba(0,0,0,'+Math.min(.18,slow*.25)+')'; c.fillRect(0,0,W,22); c.fillRect(0,H-22,W,22); }
    hud(); }
  function drawTrack(f,lock){ const tr=TRK(f.i),pu=lock?0:f.pull||0,x1=tr.x0+tr.sd*tr.len,kx=tr.x0+tr.sd*pu*tr.len,y=tr.y,col=lock?'#8a909c':f.lc||PCOL[f.i]; /* 拖曳軌道＋握把（喊 GO SHOOT 前鎖住、灰色） */
    c.save(); c.lineCap='round'; c.strokeStyle='rgba(0,0,0,.55)'; c.lineWidth=20; c.beginPath(); c.moveTo(tr.x0,y); c.lineTo(x1,y); c.stroke(); c.strokeStyle='rgba(255,255,255,.18)'; c.lineWidth=14; c.stroke();
    if(lock){ const s2=f.hint2>0?'還不能拖！等裁判喊 GO SHOOT':'🔒 裁判喊 GO SHOOT 後才能拖'; c.font='900 14px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=4; c.strokeStyle='#0b0a1c'; const mx=tr.x0+tr.sd*tr.len/2; c.strokeText(s2,mx,y-26); c.fillStyle=f.hint2>0?'#ff6a6a':'#fff'; c.fillText(s2,mx,y-26); }
    else { const g=c.createLinearGradient(tr.x0,0,x1,0); g.addColorStop(0,'#3ed16a'); g.addColorStop(.6,'#ffd23f'); g.addColorStop(1,'#ff5a3a'); c.strokeStyle=g; c.lineWidth=10; c.beginPath(); c.moveTo(tr.x0,y); c.lineTo(kx,y); c.stroke();
    c.fillStyle='rgba(255,255,255,'+(.35+.35*Math.sin(t*8))+')'; for(let q=0;q<4;q++){ const cx=tr.x0+tr.sd*(tr.len*(.3+q*.18)),u=((t*1.6+q*.25)%1); if(cx*tr.sd<kx*tr.sd+18) continue; c.globalAlpha=1-u*.5; c.beginPath(); c.moveTo(cx-tr.sd*5,y-6); c.lineTo(cx+tr.sd*3,y); c.lineTo(cx-tr.sd*5,y+6); c.fill(); } c.globalAlpha=1; } /* 箭頭 */
    c.fillStyle='#fff'; c.font='900 11px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.strokeStyle='#0b0a1c'; c.lineWidth=3; c.strokeText('發射',x1,y-20); c.fillText('發射',x1,y-20);
    const r=f.grab?20:17+Math.sin(t*6)*1.5,kg=c.createRadialGradient(kx-5,y-6,2,kx,y,r); kg.addColorStop(0,shade(col,.55)); kg.addColorStop(1,shade(col,-.35)); c.fillStyle='rgba(0,0,0,.4)'; c.beginPath(); c.arc(kx+2,y+3,r,0,TAU); c.fill(); c.fillStyle=kg; c.beginPath(); c.arc(kx,y,r,0,TAU); c.fill();
    c.strokeStyle='#fff'; c.lineWidth=2.5; c.stroke(); c.strokeStyle='rgba(0,0,0,.4)'; c.lineWidth=2; for(const o of [-5,0,5]){ c.beginPath(); c.moveTo(kx+o,y-7); c.lineTo(kx+o,y+7); c.stroke(); } c.restore(); }
  function hud(){ const n=keys.length,cw=Math.min(190,(W-20)/n-8);
    keys.forEach((k,j)=>{ const x=10+j*(cw+8),mem=T.filter(f=>teamKey(f)===k),col=k[0]==='t'?R.TEAMS[+k.slice(1)].col:mem[0].col;
      c.fillStyle='rgba(11,10,28,.78)'; rr(c,x,8,cw,50,10); c.fill(); c.fillStyle=col; rr(c,x,8,6,50,3); c.fill();
      c.fillStyle='#fff'; c.font='900 13px '+TC; c.textAlign='left'; c.textBaseline='middle'; c.fillText(keyName(k).slice(0,7),x+14,21);
      for(let p=0;p<TARGET;p++){ c.fillStyle=p<score[k]?'#ffd23f':'rgba(255,255,255,.18)'; c.beginPath(); c.arc(x+cw-12-(TARGET-1-p)*13,21,5,0,TAU); c.fill(); }
      mem.forEach((f,q)=>{ const y=34+q*(mem.length>1?10:0),bw=cw-24,hh=mem.length>1?6:9; c.fillStyle='rgba(255,255,255,.15)'; c.fillRect(x+14,y,bw,hh); const fr=f.st==='on'?f.spin/100:0; c.fillStyle=fr>.5?'#3ed16a':fr>.25?'#ffc21a':'#ff4d4d'; c.fillRect(x+14,y,bw*fr,hh);
        if(f.st==='on'&&f.bm>0){ c.fillStyle='#ff7a3d'; c.fillRect(x+14,y+hh,bw*Math.min(1,f.bm/100),2); } });
      { const f=mem[0],ci=(round-1)%3,B=TOP[f.P.top]; c.fillStyle='rgba(11,10,28,.78)'; rr(c,x,60,cw,20,8); c.fill(); let tx0=x+10; if(FMT3){ for(let q=0;q<3;q++){ c.fillStyle=q===ci?'#ffd23f':'rgba(255,255,255,.25)'; c.beginPath(); c.arc(x+14+q*14,70,5,0,TAU); c.fill(); } tx0=x+52; } c.fillStyle='#fff'; c.font='700 11px '+TC; c.textAlign='left'; c.fillText(B.code+' '+B.n+'（'+B.type+'）',tx0,70,cw-(tx0-x)-(fouls[f.i]?44:8)); if(fouls[f.i]){ c.fillStyle='#ff5a5a'; c.font='900 11px '+TC; c.textAlign='right'; c.fillText('失誤 '+fouls[f.i],x+cw-8,70); } } });
    c.textAlign='center'; c.textBaseline='middle'; c.font='900 13px '+TC; c.fillStyle='rgba(255,255,255,.8)';
    if(phase==='fight'){ c.textAlign='right'; c.fillText('第 '+round+' 回合　'+Math.max(0,Math.ceil(RT-rt))+' 秒',W-12,H-14); c.textAlign='center'; }
    const big=(s,y,col,fs)=>{ c.font='900 '+fs+'px '+TC; c.lineWidth=9; c.strokeStyle='#0b0a1c'; c.strokeText(s,W/2,y); c.fillStyle=col; c.fillText(s,W/2,y); };
    if(phase==='aim'){ const n=Math.ceil(PT-.6); if(n>=1&&n<=3) big(String(n),CY-60,'#fff',72);
      c.font='900 15px '+TC; c.lineWidth=5; c.strokeStyle='#0b0a1c'; const vs='第 '+round+' 回合　'+TOP[T[0].P.top].n+'　對　'+TOP[T[1].P.top].n; c.strokeText(vs,W/2,H-46); c.fillStyle='#ffd23f'; c.fillText(vs,W/2,H-46);
      if(R.humans){ const hs=(env.touch?'用方向盤':local2?'1P 用 WASD、2P 用方向鍵':'用方向鍵')+'移動落點，GO SHOOT 後按住軌道上的握把往外拖，越快轉速越高'; c.font='700 13px '+TC; c.strokeText(hs,W/2,H-22); c.fillStyle='#fff'; c.fillText(hs,W/2,H-22); } }
    if(phase==='launch'){ const inA=clamp(shootT/.22,0,1); /* 發射特寫：兩位選手握住拉繩，按下發射鍵一口氣拉出 */
      for(let i=0;i<2;i++){ const f=T[i],[pl,fu]=lu(f),ye=f.sh==null?(f.pull||0)*.6:yank(pl),outA=1-clamp(fu/.25,0,1); if(outA<=0) continue; const sd=i?-1:1,sl=(1-inA)*(1-inA)*420*-sd,x0=i?W/2+4:0,y0=262,pw=W/2-4,ph=212;
        c.save(); c.globalAlpha=outA; c.translate(sl,0); c.beginPath(); c.moveTo(x0+(i?24:0),y0); c.lineTo(x0+pw,y0); c.lineTo(x0+pw-(i?0:24),y0+ph); c.lineTo(x0,y0+ph); c.closePath(); c.save(); c.clip();
        const bg=c.createLinearGradient(x0,y0,x0,y0+ph); bg.addColorStop(0,shade(PCOL[i],-.55)); bg.addColorStop(1,'#0b0a1c'); c.fillStyle=bg; c.fillRect(x0,y0,pw,ph);
        c.strokeStyle='rgba(255,255,255,'+(.1+.25*ye)+')'; c.lineWidth=2; for(let q=0;q<14;q++){ const yy=y0+((q*37+t*900*(ye>0?1:.15))%ph),xx=x0+(q*61)%pw; c.beginPath(); c.moveTo(xx,yy); c.lineTo(xx+sd*90,yy+8); c.stroke(); } /* 速度線 */
        const cx=x0+pw/2-sd*110,cy=y0+96,K2=2; c.translate(cx,cy); c.scale(K2,K2); const jt=ye>0&&ye<1?(Math.random()-.5)*1.5:0;
        drawTop(c,jt,26,S*TS,f.P,f.col,f.ang,Math.max(.3,ye),{tilt:0,noShadow:true}); drawLauncher(jt,0,PCOL[i],sd,ye,f.sh==null&&!f.pull,true,f.lc,f.ls); c.restore();
        if(f.sh==null&&f.human&&(local2||f.i===me)){ const bl=.75+.25*Math.sin(t*16),tx=x0+pw/2+sd*70,ty=y0+70; c.save(); c.translate(tx,ty); c.scale(bl,bl); c.font='900 28px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=7; c.strokeStyle='#0b0a1c'; const left=Math.max(0,SHOOT_MAX-shootT),s2=f.hint>0?'拉遠一點再放開！':(sd>0?'按住握把往右拖 →':'← 按住握把往左拖'); c.strokeText(s2,0,0); c.fillStyle=f.hint>0?'#ff8a5a':'#ffd23f'; c.fillText(s2,0,0); c.restore();
          c.font='900 15px '+TC; c.textAlign='center'; c.lineWidth=4; c.strokeStyle='#0b0a1c'; const s3=(local2?'或按 '+shootKey(f)+'　':'')+'快！剩 '+left.toFixed(1)+' 秒，晚了算失誤'; c.strokeText(s3,tx,ty+30); c.fillStyle=left<1.2?'#ff6a6a':'#fff'; c.fillText(s3,tx,ty+30); }
        else if(f.sh!=null&&f.human&&fu<.2){ c.font='900 18px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=5; c.strokeStyle='#0b0a1c'; const sv=f.shv||0,tr=rpmTier(sv),s2=sv.toLocaleString('en-US')+' RPM　'+tr.n; c.strokeText(s2,x0+pw/2+sd*70,y0+70); c.fillStyle=tr.c; c.fillText(s2,x0+pw/2+sd*70,y0+70); }
        c.strokeStyle=PCOL[i]; c.lineWidth=4; c.stroke(); c.font='900 15px '+TC; c.textAlign=i?'right':'left'; c.textBaseline='top'; c.lineWidth=4; c.strokeStyle='#0b0a1c'; const nm=R.names[i]+'　'+TOP[f.P.top].n; c.strokeText(nm,i?x0+pw-12:x0+12,y0+ph-26); c.fillStyle='#fff'; c.fillText(nm,i?x0+pw-12:x0+12,y0+ph-26); c.restore(); } }
    if(phase==='aim'||phase==='launch') for(const f of T) if(f.human&&f.local&&(local2||f.i===me)&&(phase==='aim'||f.sh==null)) drawTrack(f,phase==='aim');
    if(phase==='launch'||(phase==='fight'&&rt<.7)){ const u=phase==='launch'?shootT/LD:1; c.save(); c.translate(W/2,CY-60); const sc=1+Math.max(0,.4-u)*.8; c.scale(sc,sc); c.translate(-W/2,-(CY-60)); big('GO SHOOT！',CY-60,'#ffd23f',58); c.restore(); }
    if(ban&&ban.t<2.2&&(ban.k==='foul'||phase!=='aim'&&phase!=='launch')){ const F=FIN[ban.k],u=Math.min(1,ban.t*5),sc=1+(1-u)*.8; c.save(); c.translate(W/2,CY-118); c.scale(sc,sc); c.globalAlpha=Math.min(1,(2.2-ban.t)*3);
      c.font='900 40px '+TC; c.lineWidth=8; c.strokeStyle='#0b0a1c'; c.strokeText(F.n+'！',0,0); c.fillStyle=F.col; c.fillText(F.n+'！',0,0);
      c.font='900 18px '+TC; const s2=ban.to?keyName(ban.to)+' +'+F.p+' 分':ban.k==='foul'?R.names[ban.who]+' 發射失敗，失誤 1 次':R.names[ban.who]+' 出局'; c.lineWidth=5; c.strokeText(s2,0,34); c.fillStyle='#fff'; c.fillText(s2,0,34); c.restore(); }
    if(refSay&&phase!=='over') bubble(refSay.txt);
    if(phase==='over'&&winKey){ c.fillStyle='rgba(11,10,28,.35)'; c.fillRect(0,0,W,H); for(let i=0;i<50;i++){ c.fillStyle=PCOL[i%4]; c.fillRect((i*97+t*50*(i%3+1))%W,(i*53+t*140*(1+i%4))%H,6,9); }
      const s=keyName(winKey)+' 獲勝！'; c.font='900 44px '+TC; c.lineWidth=9; c.strokeStyle='#0b0a1c'; c.strokeText(s,W/2,CY-30); c.fillStyle='#ffd23f'; c.fillText(s,W/2,CY-30); } }
  return {update,draw,destroy(){ if(selBox){ selBox.remove(); selBox=null; } if(canvas&&canvas.removeEventListener){ canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('pointerdown',onPDown); canvas.removeEventListener('pointermove',onPMove); canvas.removeEventListener('pointerup',onPUp); canvas.removeEventListener('pointercancel',onPUp); } },_dbg:{T,TRK,fouls,shoot,onPDown,onPMove,onPUp,get shootT(){return shootT;},get wallHits(){return wallHits;},get ed(){return ed;},confirmDeck,cyc,get score(){return score;},get phase(){return phase;},get round(){return round;},finish,setPT(v){PT=v;},get cam(){return cam;}}};
}
function drawLauncherC(c,X,Y,col,sd,pl,ready,cut,lc,ls){ lc=lc||col; ls=ls||'cord'; c.save(); c.translate(X,Y); c.scale(sd,1);
  const e=1-Math.pow(1-(pl||0),3),tr=ready?(Math.random()-.5)*1.6:0,hx=40+e*(cut?78:50)+tr,hy=-8+e*(cut?26:16)+tr,CE=[24,-8]; /* 拉線：握把從發射器側邊一口氣往外拉 */
  if(pl>0&&pl<1){ c.strokeStyle='rgba(255,255,255,.55)'; c.lineCap='round'; for(let i=0;i<5;i++){ const o=(i-2)*7; c.lineWidth=2-Math.abs(i-2)*.4; c.beginPath(); c.moveTo(hx-46+o*.3,hy-30+o); c.lineTo(hx-14+o*.3,hy-9+o); c.stroke(); } } /* 速度線 */
  // 拉繩：鋸齒繩帶，拉出來的長度越來越長
  const cl=hyp(hx-CE[0],hy-CE[1]),ca=Math.atan2(hy-CE[1],hx-CE[0]); c.save(); c.translate(CE[0],CE[1]); c.rotate(ca); if(ls==='string'){ c.strokeStyle='#f4f0e0'; c.lineWidth=1.6; c.beginPath(); c.moveTo(0,0); c.lineTo(cl,0); c.stroke(); } else { c.fillStyle='#e8e8ee'; c.fillRect(0,-2.6,cl,5.2); c.fillStyle='#9aa0ae'; for(let q=4;q<cl-4;q+=5) c.fillRect(q,-2.6,2,5.2); } c.restore();
  limb(c,[-110,-50],[-46,-24],24,20,col); limb(c,[-46,-24],[-14,-12],15,12,'#e6bc96'); c.fillStyle='#d8a884'; c.beginPath(); c.ellipse(-10,-12,8,7,0,0,TAU); c.fill(); /* 選手的手 */
  if(ls==='grip'){ const gg=c.createLinearGradient(0,-19,0,-1); gg.addColorStop(0,shade(lc,.3)); gg.addColorStop(.45,lc); gg.addColorStop(1,shade(lc,-.6)); c.fillStyle=gg; rr(c,-66,-19,44,18,8); c.fill(); c.fillStyle='rgba(0,0,0,.35)'; for(let q=0;q<5;q++) c.fillRect(-60+q*7,-19,2.4,18); c.fillStyle='#14161c'; rr(c,-30,-16,8,14,2); c.fill(); } /* 握把式：下面多一支防滑握柄 */
  const g=c.createLinearGradient(0,-16,0,4); g.addColorStop(0,'#5a606e'); g.addColorStop(.5,'#2a2d36'); g.addColorStop(1,'#14161c'); c.fillStyle=g; if(ls==='string'){ c.beginPath(); c.ellipse(0,-7,28,11,0,0,TAU); c.fill(); } else { rr(c,-26,-16,52,18,6); c.fill(); }
  { const lg=c.createLinearGradient(0,-12,0,-6); lg.addColorStop(0,shade(lc,.35)); lg.addColorStop(1,shade(lc,-.25)); c.fillStyle=lg; if(ls==='string'){ c.beginPath(); c.ellipse(0,-9,24,5,0,0,TAU); c.fill(); } else { rr(c,-24,-12,48,5,2); c.fill(); } } c.fillStyle='#14161c'; rr(c,-7,-36,14,22,4); c.fill(); c.fillStyle='rgba(255,255,255,.25)'; c.fillRect(-5,-34,3,18);
  c.fillStyle='#1a1c22'; c.beginPath(); c.ellipse(CE[0],CE[1],3,4,0,0,TAU); c.fill(); /* 拉繩出口 */
  // 握把＋另一隻手（從靠鏡頭那側伸過來）
  if(ls==='string'){ c.fillStyle=lc; c.beginPath(); c.arc(hx+4,hy,8,0,TAU); c.fill(); c.fillStyle='rgba(255,255,255,.35)'; c.beginPath(); c.arc(hx+2,hy-3,3,0,TAU); c.fill(); } /* 捲線式：圓球拉柄 */
  else { c.fillStyle=shade(lc,-.2); rr(c,hx-4,hy-13,9,26,4); c.fill(); c.strokeStyle=ls==='grip'?lc:'#c8ccd6'; c.lineWidth=3.5; c.beginPath(); c.ellipse(hx+8,hy,8,11,0,0,TAU); c.stroke(); }
  if(cut){ const sh=[200,120],hd=[hx+6,hy+2],dx=hd[0]-sh[0],dy=hd[1]-sh[1],d=Math.min(hyp(dx,dy),206),a0=Math.atan2(dy,dx),b=Math.acos(clamp(d/210,-1,1)),el=[sh[0]+Math.cos(a0-b)*105,sh[1]+Math.sin(a0-b)*105]; /* 拉繩的手：肩膀固定，手肘自然彎 */
    limb(c,sh,el,30,24,col); limb(c,el,hd,22,16,'#e6bc96'); c.fillStyle='#d8a884'; c.beginPath(); c.ellipse(hd[0],hd[1],11,9.5,-.3,0,TAU); c.fill(); c.strokeStyle='rgba(120,70,50,.5)'; c.lineWidth=1.2; for(let q=-1;q<=1;q++){ c.beginPath(); c.moveTo(hd[0]-6,hd[1]+q*3.4); c.lineTo(hd[0]+4,hd[1]+q*3.4); c.stroke(); } }
  c.fillStyle='#1a1c22'; c.beginPath(); c.moveTo(-14,2); c.lineTo(14,2); c.lineTo(10,8); c.lineTo(-10,8); c.closePath(); c.fill(); c.restore(); }
// 開始畫面：場地＋兩顆陀螺互撞
function stageShow(ctx,w,h,si,t){ ctx.save(); ctx.scale(w/W,h/H); themeBg(ctx,STAGES[si].th,t); drawCrowd(ctx,t,.6); drawFloor(ctx,STAGES[si].th); drawRef(ctx,REFX,REFY,1,'idle',t,false); ctx.drawImage(stadium(si),0,0,W,H);
  const a=t*1.3,r=90+Math.sin(t*.8)*40;
  drawTop(ctx,sx(Math.cos(a)*r),sz(Math.cos(a)*r,Math.sin(a)*r),S*TS,{top:OPP[(si*2+1)%OPP.length]},0,t*30,1);
  drawTop(ctx,sx(Math.cos(a+2.6)*r*.8),sz(Math.cos(a+2.6)*r*.8,Math.sin(a+2.6)*r*.8),S*TS,{top:OPP[(si*2)%OPP.length]},0,-t*30,1); ctx.drawImage(stadiumFront(si),0,0,W,H); ctx.restore(); }
function preview(ctx,w,h,L,t){ const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#1d2a44'); g.addColorStop(1,'#0b0a1c'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  L=L||{}; const ids=[L.t1,L.t2,L.t3].map((x,i)=>TOP[x]?x:['dransword','knightshield','wizardrod'][i]),fixed=fixDeck(ids.map(x=>({top:x}))).map(q=>q.top),s=Math.min(w,h)/150;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ids.forEach((id,i)=>{ const B=TOP[id],cx=w*(.18+i*.32),cy=h*.36,P=partsOf({top:id}),ab=AB[id],dup=fixed[i]!==id;
    ctx.fillStyle='rgba(255,255,255,.07)'; ctx.beginPath(); ctx.ellipse(cx,cy+h*.04,w*.12,w*.12*SQ,0,0,TAU); ctx.fill();
    drawTop(ctx,cx,cy+h*.06,s,P,0,t*B.dir*3+i,.7);
    ctx.font='900 '+Math.round(h*.055)+'px '+TC; ctx.fillStyle='#ffd23f'; ctx.fillText((i+1)+'　'+B.n,cx,h*.62);
    ctx.font='700 '+Math.round(h*.042)+'px '+TC; ctx.fillStyle=['#ff6a5a','#5aa8ff','#5fd068','#ffd23f','#c8a0ff'][Object.keys(TYPES).indexOf(B.type)]||'#fff'; ctx.fillText(B.type+'型　'+B.code,cx,h*.71);
    ctx.fillStyle='rgba(255,255,255,.85)'; ctx.font='700 '+Math.round(h*.04)+'px '+TC; ctx.fillText('攻'+ab[0]+' 防'+ab[1]+' 持'+ab[2],cx,h*.8); ctx.fillText('衝'+ab[3]+' 耐'+ab[4],cx,h*.88);
    if(dup){ ctx.fillStyle='#ff6a6a'; ctx.font='900 '+Math.round(h*.04)+'px '+TC; ctx.fillText('零件重複，比賽時會換成 '+TOP[fixed[i]].n,cx,h*.96); } });
  { const k=s/(S*TS)*.55; ctx.save(); ctx.translate(w*.06,h*.12); ctx.scale(k,k); drawLauncherC(ctx,0,0,'#3d8bff',1,.25+.2*Math.sin(t*2),false,false,L.lc,L.ls); ctx.restore(); } }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).spin={name:'陀螺旋風戰',tag:'SPIN STORM',color:'#ff7a3d',online:true,maxPlayers:2,
  desc:'30 顆熱門比賽陀螺一對一對決！開賽前選好落點，裁判喊「3、2、1，GO SHOOT！」就用滑鼠或手指拖曳拉繩發射（拉越快轉速越高，晚 1 秒就算發射失敗），之後全看陀螺自己轉、自己撞，鏡頭會自動拉近特寫。每人帶 3 顆輪流上場，旋轉勝利、擊飛勝利、爆裂勝利、極限勝利，裁判報分、觀眾歡呼，先拿 4 分的贏。10 座競技場：冰晶、沙漠、熔岩、星空低重力、暴風…',
  goal:'選好落點發射，比對手轉得久＝旋轉勝利 1 分、撞進黃色擊飛區域或飛出場外＝擊飛勝利 2 分、撞到解體＝爆裂勝利 2 分、撞進紅色極限區域＝極限勝利 3 分。先拿 4 分的贏。',
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  stageGoal:si=>{ const s=STAGES[si],h={ice:'冰面很滑，陀螺停不下來。',desert:'沙地摩擦大，轉速掉得快。',twin:'前面是紅色極限區域，後左右是黃色擊飛區域。',lava:'碰到滾燙的軌道會掉轉速，但衝刺更猛。',space:'低重力，碗面拉回中間的力比較小。',storm:'暴風會把陀螺往一個方向吹，每隔幾秒換方向。',arena:'兩側的場外口袋特別寬。',final:'冠軍等級的對手。'}[s.th]||'';
    return s.name+'：先拿 4 分的贏。'+h; },
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['↑ ↓ ← →','開賽前移動落點'],['滑鼠拖曳','裁判喊 GO SHOOT 後，按住下方軌道上的握把往外拖，拖到底或放開就發射；拖得越快轉速越高（14,000 RPM 以上專業，16,000 以上極限要用握把式發射器）。喊完 1 秒內沒發射就算發射失敗、記失誤一次，失誤 2 次對方得 1 分'],['發射之後','陀螺自己轉、自己撞，不用操作'],['V','切換特寫鏡頭／看全場'],['雙人','1P 用 WASD、拖曳左半邊或按 F 發射；2P 用方向鍵、拖曳右半邊或按 Enter 發射']],
  touchHelp:[['方向盤','開賽前移動落點'],['手指拖曳','裁判喊 GO SHOOT 後按住軌道上的握把往外拖，越快轉速越高；晚 1 秒算失誤'],['鏡頭','切換特寫鏡頭／看全場']],
  touch:{left:'dpad',right:[{l:'鏡頭',c:'KeyV'}]},
  looks:[{key:'t1',label:'第 1 顆出場',type:'select',uniq:'deck',def:'dransword',opts:TOPS.map(q=>({id:q.id,label:q.n+'（'+q.type+'）'+q.code}))},
    {key:'t2',label:'第 2 顆出場',type:'select',uniq:'deck',def:'knightshield',opts:TOPS.map(q=>({id:q.id,label:q.n+'（'+q.type+'）'+q.code}))},
    {key:'t3',label:'第 3 顆出場',type:'select',uniq:'deck',def:'wizardrod',opts:TOPS.map(q=>({id:q.id,label:q.n+'（'+q.type+'）'+q.code}))},
    {key:'lc',label:'發射器顏色',type:'color',opts:['#e23b3b','#3d8bff','#ffd23f','#3ed16a','#b98cff','#ff7a3d','#2a2d36','#f4f4f4']},
    {key:'ls',label:'發射器款式',opts:[{id:'cord',label:'拉繩式'},{id:'string',label:'捲線式'},{id:'grip',label:'握把式'}]}],
  preview,
  hubBest:()=>{ const n=STAGES.filter(s=>hasWin(s.name)).length; return n?'贏過 <b>'+n+' / '+STAGES.length+'</b> 座競技場':'尚無紀錄'; },
  stageBest:i=>hasWin(STAGES[i].name)?'★ 贏過':'',
  stageShow,
  thumb:(ctx,w,h,t)=>{ stageShow(ctx,w,h,9,t); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.13)+'px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#0b0a1c'; ctx.strokeText('陀螺旋風戰',w/2,h*.13); ctx.fillStyle='#ffd23f'; ctx.fillText('陀螺旋風戰',w/2,h*.13); },
  create,_draw:{drawTop,STAGES,TOPS}};
})();
