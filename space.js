// 太空艦隊：縱向捲軸射擊。自動開火，只要移動和放炸彈；50 個星域，每關最後打王。單人闖關，過一關開下一關。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PIX='"Press Start 2P","Noto Sans TC",monospace';
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k,TAU=Math.PI*2;
function mul(seed){ let a=seed>>>0||1; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
// 100 關：難度照關卡平滑上升；原本的十關保留原紀錄（rec）
const OLD10=[0,5,11,16,22,27,33,38,44,49];
const STAGES=[
  ['初航星帶','#050a24','#10245a','#3d6bff','#6fb4ff','#4f9dff'],
  ['晨曦航道','#0a0a2a','#2a2a6a','#ff8ab0','#ffc0a0','#ff8a7a'],
  ['碎冰帶','#04101f','#14385a','#7ac8ff','#d0f0ff','#5fb4e8'],
  ['藍環外圍','#030c28','#0c2c6c','#3d9bff','#8ad0ff','#3d8bff'],
  ['流星雨區','#070718','#1c1c48','#8a8aff','#d8d8ff','#ffb02a'],
  ['翡翠星雲','#03140f','#0c3a30','#2fd08a','#7fe8b8','#3ddb9a'],
  ['螢光孢子海','#02120f','#084038','#3dffc8','#a0ffe0','#3ddbd9'],
  ['綠洲衛星','#04140a','#123c1c','#6fdc4a','#b8f08a','#86dc4f'],
  ['藤蔓殘骸','#0a1206','#28381a','#9aba3a','#d0dc7a','#a8c83a'],
  ['翠玉小行星','#021410','#0a3a34','#20c8a0','#70e0c8','#2fd0b0'],
  ['砂岩峽谷','#160c04','#40240e','#d88a3a','#f0c080','#e0964a'],
  ['熔岩小行星','#1a0605','#44140c','#ff6a2a','#ff9a5a','#ff7a3d'],
  ['火山衛星','#1c0403','#4c1006','#ff4a1a','#ff8a4a','#ff5a2a'],
  ['灰燼航線','#100c0c','#34282a','#c86a4a','#c8a090','#d8704a'],
  ['赤銅礦帶','#140805','#3c1c10','#d8703a','#e8a880','#d88040'],
  ['星火走廊','#160a14','#401c34','#ff7a5a','#ffb8a0','#ff6a7a'],
  ['紫晶裂谷','#10062a','#2e1260','#a85aff','#c89aff','#b06aff'],
  ['迷幻星雲','#160428','#44105c','#e05aff','#f0a8ff','#d85aff'],
  ['水晶迷宮','#0a0a2c','#26246c','#8a7aff','#c8c0ff','#9a8aff'],
  ['靛藍風暴','#04062a','#101a6c','#4a5aff','#a0b0ff','#5a6aff'],
  ['深海行星','#010e1c','#04304c','#1a9ac8','#70d0e8','#20b0d8'],
  ['極光帶','#02101c','#0a3048','#3dffb0','#a8ffe0','#3de0c8'],
  ['冰環行星','#04121f','#123a54','#6fe0ff','#c8f4ff','#5fd4f0'],
  ['霜雪彗星','#061220','#1c3c58','#a8e0ff','#e8f8ff','#8ad0f0'],
  ['寒晶要塞','#060c1c','#1c2c4c','#7aa8e8','#c0d8f4','#7ab0f0'],
  ['鋼鐵船塢','#0a0c10','#242a34','#7a8a9a','#b0bcc8','#c0a060'],
  ['廢棄太空站','#0c0c0e','#2c2a2c','#8a8078','#b8b0a8','#b89060'],
  ['機械要塞','#0c0e14','#262c3c','#8a9ab8','#a8b4c8','#d8a040'],
  ['齒輪星帶','#0e0c0a','#30281c','#b89050','#d0c0a0','#d09840'],
  ['電磁風暴','#060a18','#142048','#5ac8ff','#b0e8ff','#40d0ff'],
  ['沙海星球','#181004','#46300c','#e8b040','#f4d890','#e8a830'],
  ['琥珀星雲','#1a0e02','#4a2a06','#ffa02a','#ffd080','#ffa830'],
  ['日冕航線','#1e0c02','#54260a','#ff9a2a','#ffc870','#ff9030'],
  ['黃金太陽','#1c0f02','#4e2c06','#ffc23f','#ffe08a','#ffb02a'],
  ['烈陽熔爐','#200802','#581c04','#ff8a1a','#ffc060','#ff7a1a'],
  ['暗紅矮星','#180404','#440e0e','#e84a3a','#ff9a8a','#e8503a'],
  ['戰火航道','#180606','#42140e','#ff5a3a','#ffa080','#ff5a30'],
  ['猩紅艦隊','#1a0208','#4a0a1a','#ff2a5a','#ff8aa0','#ff3a5a'],
  ['血月戰線','#180208','#44081c','#ff3b6b','#ff8aa8','#ff3b6b'],
  ['赤霧星域','#16020c','#401026','#e83a7a','#ff90b8','#f0407a'],
  ['幽影星雲','#06041a','#1a1440','#6a4ac8','#a890e0','#7a5ae0'],
  ['重力陷阱','#040414','#14123a','#5a5ae8','#9090e8','#6a6af0'],
  ['虛空裂縫','#04020e','#180c30','#8a3ae8','#b890f0','#9a4af0'],
  ['事象之界','#020208','#100c28','#5a4ae8','#8880d0','#7a6af8'],
  ['黑洞邊緣','#020208','#141030','#6a5aff','#2a2050','#8a7aff'],
  ['星骸墳場','#080810','#20202c','#7a7a9a','#a8a8c0','#a08ab8'],
  ['時空亂流','#08021c','#240a50','#c04aff','#e0a0ff','#d050ff'],
  ['超新星遺跡','#10021a','#380a40','#ff6ac0','#ffb8e0','#ff70c8'],
  ['皇家艦隊','#0a0218','#28104a','#e0b040','#f0d890','#ffc840'],
  ['銀河終戰','#080218','#2a0a4a','#ff5ad4','#ffb0ec','#ff5ad4'],
  ['彩虹星橋','#05141a','#143f52','#1fb8f9','#86c2f9','#33f3ff'],
  ['珍珠星環','#050d1a','#142d51','#1f76f9','#869ff9','#33b6ff'],
  ['薄荷星海','#051a10','#145134','#1ff991','#86f9d6','#33ff6c'],
  ['蜂巢小行星','#191404','#503f14','#f9bc1f','#f9ed86','#ff9533'],
  ['棉花糖星雲','#190413','#50143f','#f91fbc','#f986c4','#ff33f7'],
  ['鏡面星域','#040f19','#143350','#1f91f9','#86adf9','#33ceff'],
  ['琉璃航道','#040519','#14164f','#1f28f9','#9686f9','#336cff'],
  ['海妖星系','#041919','#144f4f','#1ff9f9','#86e4f9','#33ffce'],
  ['螺旋星系','#0e0419','#31144e','#8c1ff9','#d486f9','#6833ff'],
  ['雙子太陽','#181004','#4e3613','#f9a21f','#f9df86','#ff7c33'],
  ['雷霆雲海','#040a18','#13244d','#1f5cf9','#8691f9','#339dff'],
  ['寶瓶星流','#041418','#13434d','#1fd2f9','#86cff9','#33fff3'],
  ['孔雀星雲','#041812','#134d3b','#1ff9b8','#86f9eb','#33ff91'],
  ['橘子行星','#180c04','#4c2b13','#f97b1f','#f9cb86','#ff5833'],
  ['楓紅星帶','#180604','#4c1a13','#f9391f','#f9a886','#ff334b'],
  ['薰衣草星原','#110417','#39134b','#b31ff9','#e986f9','#8d33ff'],
  ['冰晶彗尾','#041017','#13374b','#1fabf9','#86bbf9','#33e7ff'],
  ['金屬雨區','#040c17','#13294b','#1f76f9','#869ff9','#33b6ff'],
  ['磁暴深淵','#060417','#17134a','#311ff9','#a486f9','#3354ff'],
  ['碧海衛星','#041714','#124a43','#1ff9df','#86f2f9','#33ffb6'],
  ['沙暴星球','#160f04','#493312','#f9a21f','#f9df86','#ff7c33'],
  ['翠羽星團','#041609','#124922','#1ff95c','#86f9bb','#33ff3b'],
  ['糖霜星環','#16040d','#48122c','#f91f88','#f986a8','#ff33c6'],
  ['暮光航線','#120416','#3d1248','#ce1ff9','#f686f9','#a533ff'],
  ['天鵝星座','#040b16','#122748','#1f76f9','#869ff9','#33b6ff'],
  ['獵戶星門','#040716','#121a47','#1f42f9','#8886f9','#3385ff'],
  ['赤焰彗星','#150704','#471b12','#f9461f','#f9af86','#ff333f'],
  ['霓虹星港','#150413','#461241','#f91fe3','#f986d8','#e233ff'],
  ['光子迴廊','#041315','#114046','#1fdff9','#86d6f9','#33ffe7'],
  ['星塵沙漠','#150f04','#463411','#f9af1f','#f9e686','#ff8933'],
  ['暗礁星帶','#040d15','#112c45','#1f91f9','#86adf9','#33ceff'],
  ['玫瑰星雲','#150409','#451121','#f91f61','#f98694','#ff33a1'],
  ['雪豹冰原','#040f14','#113544','#1fb8f9','#86c2f9','#33f3ff'],
  ['鋼鐵巨城','#040a14','#112544','#1f76f9','#869ff9','#33b6ff'],
  ['閃電峽谷','#141204','#433e11','#f9e31f','#eff986','#ffba33'],
  ['幽藍星海','#030814','#111f43','#1f5cf9','#8691f9','#339dff'],
  ['翡翠王城','#03140a','#114325','#1ff976','#86f9c8','#33ff54'],
  ['紫電風暴','#0d0313','#2f1142','#a61ff9','#e286f9','#8133ff'],
  ['流浪行星','#031313','#104242','#1ff9f9','#86e4f9','#33ffce'],
  ['熾焰日冕','#130803','#411f10','#f9611f','#f9bd86','#ff3f33'],
  ['冥王邊境','#050313','#141041','#311ff9','#a486f9','#3354ff'],
  ['星門迷宮','#080313','#201041','#651ff9','#bf86f9','#4333ff'],
  ['暗物質帶','#0a0313','#251040','#7f1ff9','#cd86f9','#5c33ff'],
  ['白矮星墓園','#030912','#102340','#1f76f9','#869ff9','#33b6ff'],
  ['脈衝星燈塔','#030e12','#10313f','#1fb8f9','#86c2f9','#33f3ff'],
  ['黑曜石帶','#060312','#19103f','#4b1ff9','#b186f9','#333bff'],
  ['星雲王座','#110312','#3b103e','#e81ff9','#f986ed','#be33ff'],
  ['宇宙裂口','#0e0312','#32103e','#c11ff9','#ef86f9','#9933ff'],
  ['終焉星環','#12030c','#3e0f2b','#f91fa2','#f986b6','#ff33de'],
  ['銀河之心','#110311','#3c0f3d','#f51ff9','#f986e6','#ca33ff']
].map((a,i,A)=>({name:a[0],sky:[a[1],a[2]],neb:a[3],pl:a[4],boss:a[5],stars:Math.min(5,Math.ceil((i+1)/20)),k:.5+.88*i/(A.length-1),len:Math.round(42+i*.3),rec:OLD10.includes(i)?OLD10.indexOf(i):10+i}));
const COL=['#3ddbd9','#ffd23f','#ff7eb6','#86dc4f'];
/* ---------- 精靈圖快取（有光暈的東西先畫好，畫面才順） ---------- */
const CACHE={};
function spr(key,w,h,f,res){ let e=CACHE[key]; if(!e){ res=res||2; e=document.createElement('canvas'); e.width=w*res; e.height=h*res; const c=e.getContext('2d'); c.scale(res,res); c.translate(w/2,h/2); f(c); e.hw=w/2; e.hh=h/2; CACHE[key]=e; } return e; }
const put=(c,s,x,y,a,k)=>{ if(a||k){ c.save(); c.translate(x,y); if(a) c.rotate(a); if(k) c.scale(k,k); c.drawImage(s,-s.hw,-s.hh,s.hw*2,s.hh*2); c.restore(); } else c.drawImage(s,x-s.hw,y-s.hh,s.hw*2,s.hh*2); };
const shade=(h,f)=>{ const n=parseInt(h.slice(1),16),q=v=>clamp(Math.round(v*f),0,255); return 'rgb('+q(n>>16)+','+q(n>>8&255)+','+q(n&255)+')'; };
function metal(c,x0,x1,col){ const g=c.createLinearGradient(x0,0,x1,0); g.addColorStop(0,shade(col,.45)); g.addColorStop(.45,shade(col,1.2)); g.addColorStop(.6,col); g.addColorStop(1,shade(col,.4)); return g; }
const poly=(c,p)=>{ c.beginPath(); p.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1])); c.closePath(); };
/* 機型：俯視的飛機外型。fus＝機身寬度表 [y,半寬]；其他部位只寫右半邊，畫的時候左右對稱 */
const SHIPS=[
  {fus:[[-36,0],[-28,3.2],[-14,5.6],[4,6],[22,5.4],[30,4]],wing:[[4,-12],[9,0],[30,14],[31,19],[5,17]],flap:[[9,14.5],[24,15.2],[24,18],[9,17.5]],tail:[[4,20],[15,29],[15,32],[4,29]],can:[-17,8,3.4],noz:[[0,31,3.6]],mis:[[31,6,14]]},
  {fus:[[-37,0],[-26,3.4],[-10,5.6],[14,6],[30,4.4]],wing:[[4,-10],[31,24],[31,27],[4,27]],flap:[[8,23.5],[29,24.5],[29,27],[8,27]],can:[-14,8,3.2],noz:[[0,32,3.8]],mis:[[20,10,12]]},
  {fus:[[-35,0],[-24,3.6],[-8,6.4],[16,7],[28,5]],wing:[[5,6],[30,-12],[33,-8],[24,10],[6,20]],flap:[[9,14],[22,8],[24,10],[9,18]],canard:[[5,-14],[15,-9],[15,-6],[5,-8]],tail:[[7,20],[17,28],[17,31],[7,28]],eng:[[6,8,30,3.6]],noz:[[6,32,3.2]],can:[-13,8,3.2]},
  {fus:[[-36,0],[-24,4],[-6,7.6],[18,8.4],[28,7]],wing:[[6,-6],[32,14],[30,19],[7,18]],flap:[[10,15.5],[26,16.5],[26,18.5],[10,18]],tail:[[7,18],[19,30],[15,33],[7,28]],fin:[[7,8],[13,18],[12,23],[7,18]],intake:[[6.4,-8,3,8]],noz:[[4.4,30,2.8]],can:[-15,7.5,3.2]},
  {fus:[[-36,0],[-26,3.4],[-12,5.2],[0,9],[24,10],[30,9]],wing:[[8,-2],[33,12],[33,18],[10,18]],flap:[[12,15],[24,16],[24,18],[12,18]],tail:[[9,20],[21,29],[21,33],[9,30]],fin:[[6,14],[9,9],[10,22],[6,24]],intake:[[6.4,-6,3.6,10]],eng:[[5.5,5,31,4.2]],noz:[[5.5,33,3.8]],can:[-14,8,3.4],mis:[[23,4,12],[16,2,12]]},
  {fus:[[-36,0],[-28,3],[-12,5],[10,5.6],[28,5]],wing:[[5,-2],[30,18],[30,23],[5,23]],flap:[[8,20],[28,21],[28,23],[8,23]],canard:[[4.5,-20],[14,-14],[14,-11],[4.5,-14]],noz:[[3.6,30,3]],can:[-20,7,3],mis:[[26,10,10]]},
  {fus:[[-24,0],[-10,6],[6,6.5],[12,3]],wing:[[0,-26],[34,10],[28,16],[18,8],[10,18],[0,10]],flap:[[19,5],[29,12],[28,16],[18,8]],intake:[[5,-8,4,3]],noz:[[6,14,2.4]],can:[-13,5,3.6]},
  {fus:[[-37,0],[-30,5],[-18,8.4],[20,9],[30,8.4]],wing:[[8,-8],[15,8],[30,22],[30,27],[8,27]],flap:[[10,24],[28,24.5],[28,27],[10,27]],noz:[[0,31,3],[5.5,30,2.6]],can:[-21,5,4],white:1}];
function drawShip(c,S,col,foe){ const line='rgba(0,0,0,.5)',both=f=>{ f(); c.save(); c.scale(-1,1); f(); c.restore(); },plate=(p,x0,x1,f0,f1)=>{ const g=c.createLinearGradient(x0,0,x1,0); g.addColorStop(0,shade(col,f0)); g.addColorStop(1,shade(col,f1)); poly(c,p); c.fillStyle=g; c.fill(); c.lineWidth=.6; c.strokeStyle=line; c.stroke(); };
  both(()=>{ if(S.tail) plate(S.tail,0,22,1,.62);
    /* 主翼：明暗、前緣亮線、襟翼、蒙皮線 */
    plate(S.wing,0,34,1.12,.66); c.save(); poly(c,S.wing); c.clip(); c.strokeStyle='rgba(0,0,0,.2)'; c.lineWidth=.45; for(let x=9;x<34;x+=6.5){ c.beginPath(); c.moveTo(x,-30); c.lineTo(x,32); c.stroke(); } c.strokeStyle='rgba(255,255,255,.55)'; c.lineWidth=.9; c.beginPath(); S.wing.slice(0,2).forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1])); c.stroke(); c.restore();
    if(S.flap){ poly(c,S.flap); c.fillStyle='rgba(0,0,0,.28)'; c.fill(); }
    if(S.canard) plate(S.canard,0,16,1.1,.7);
    for(const m of S.mis||[]){ c.fillStyle='#e8ecf2'; c.fillRect(m[0]-.9,m[1],1.8,m[2]); c.fillStyle='#d83a3a'; c.beginPath(); c.moveTo(m[0]-.9,m[1]); c.lineTo(m[0],m[1]-2.4); c.lineTo(m[0]+.9,m[1]); c.fill(); c.fillStyle='#5a6270'; c.fillRect(m[0]-1.8,m[1]+m[2]-2.4,3.6,2.4); }
    for(const e of S.eng||[]){ const g=c.createLinearGradient(e[0]-e[3],0,e[0]+e[3],0); g.addColorStop(0,shade(col,.5)); g.addColorStop(.5,shade(col,1.05)); g.addColorStop(1,shade(col,.45)); c.fillStyle=g; rr(c,e[0]-e[3],e[1],e[3]*2,e[2]-e[1],2); c.fill(); c.lineWidth=.6; c.strokeStyle=line; c.stroke(); } });
  /* 機身：圓筒明暗 */
  const hw=Math.max(...S.fus.map(q=>q[1])),body=S.white?'#eef0f4':col,path=()=>{ c.beginPath(); const f=S.fus; c.moveTo(0,f[0][0]); for(let i=1;i<f.length;i++) c.lineTo(f[i][1],f[i][0]); for(let i=f.length-1;i>0;i--) c.lineTo(-f[i][1],f[i][0]); c.closePath(); };
  const g=c.createLinearGradient(-hw,0,hw,0); g.addColorStop(0,shade(body,.5)); g.addColorStop(.38,shade(body,1.22)); g.addColorStop(.62,shade(body,1)); g.addColorStop(1,shade(body,.45)); path(); c.fillStyle=g; c.fill(); c.lineWidth=.7; c.strokeStyle=line; c.stroke();
  const f0=S.fus[0][0],f1=S.fus[S.fus.length-1][0]; c.save(); path(); c.clip(); c.fillStyle=S.white?'#23262e':'rgba(24,28,38,.86)'; c.fillRect(-hw,f0,hw*2,S.white?11:9); c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=.45; for(let y=f0+16;y<f1;y+=8){ c.beginPath(); c.moveTo(-hw,y); c.lineTo(hw,y); c.stroke(); } c.beginPath(); c.moveTo(0,S.can[0]+S.can[1]+2); c.lineTo(0,f1); c.stroke(); c.restore();
  if(S.white){ c.strokeStyle='rgba(0,0,0,.35)'; c.lineWidth=.6; c.strokeRect(-4.5,-8,9,26); }
  both(()=>{ for(const q of S.intake||[]){ c.fillStyle='#10131b'; c.fillRect(q[0]-q[2]/2,q[1],q[2],q[3]); } if(S.fin){ poly(c,S.fin); c.fillStyle=shade(col,.42); c.fill(); c.lineWidth=.5; c.strokeStyle=line; c.stroke(); }
    for(const n of S.noz){ if(!n[0]) continue; c.fillStyle='#2a2e38'; c.beginPath(); c.ellipse(n[0],n[1],n[2],n[2]*.8,0,0,TAU); c.fill(); c.fillStyle='#0a0c12'; c.beginPath(); c.ellipse(n[0],n[1],n[2]*.62,n[2]*.48,0,0,TAU); c.fill(); } });
  for(const n of S.noz) if(!n[0]){ c.fillStyle='#2a2e38'; c.beginPath(); c.ellipse(0,n[1],n[2],n[2]*.8,0,0,TAU); c.fill(); c.fillStyle='#0a0c12'; c.beginPath(); c.ellipse(0,n[1],n[2]*.62,n[2]*.48,0,0,TAU); c.fill(); }
  /* 座艙罩 */
  const[cy,ch,cw]=S.can,w=c.createLinearGradient(0,cy-ch,0,cy+ch); w.addColorStop(0,foe?'#ffb0a0':'#d8f6ff'); w.addColorStop(.55,foe?'#a82020':'#2a78b8'); w.addColorStop(1,foe?'#400808':'#0c2c50'); c.fillStyle=w; c.beginPath(); c.ellipse(0,cy,cw,ch,0,0,TAU); c.fill(); c.lineWidth=.8; c.strokeStyle='rgba(10,14,24,.85)'; c.stroke(); c.beginPath(); c.moveTo(-cw*.8,cy+ch*.35); c.lineTo(cw*.8,cy+ch*.35); c.stroke(); c.fillStyle='rgba(255,255,255,.65)'; c.beginPath(); c.ellipse(-cw*.3,cy-ch*.35,cw*.22,ch*.3,0,0,TAU); c.fill(); }
function shipSpr(col,kind){ return spr('p'+col+kind,76,84,c=>drawShip(c,SHIPS[kind]||SHIPS[0],col),4); }
function foeSpr(t,col){ return spr('f'+t+col,t==='tank'?90:60,t==='tank'?80:60,c=>{ const jet=(k,s)=>{ c.save(); c.rotate(Math.PI); c.scale(s,s); drawShip(c,SHIPS[k],col,true); c.restore(); };
    if(t==='scout') jet(0,.56);
    else if(t==='weave') jet(2,.62);
    else if(t==='gun'){ c.fillStyle=metal(c,-20,20,col); c.beginPath(); for(let i=0;i<6;i++){ const a=i/6*TAU+.52; c.lineTo(Math.cos(a)*20,Math.sin(a)*20); } c.closePath(); c.fill(); c.strokeStyle='rgba(0,0,0,.5)'; c.lineWidth=1.5; c.stroke(); c.fillStyle='#262c3c'; c.fillRect(-4,6,8,18); c.fillStyle='#ff5d5d'; c.beginPath(); c.arc(0,0,7,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(-2,-2,2,0,TAU); c.fill(); }
    else if(t==='spin'){ for(let i=0;i<4;i++){ c.save(); c.rotate(i*TAU/4); c.fillStyle=metal(c,-8,8,col); c.beginPath(); c.moveTo(-7,0); c.lineTo(0,-24); c.lineTo(7,0); c.fill(); c.restore(); } c.fillStyle='#14182a'; c.beginPath(); c.arc(0,0,9,0,TAU); c.fill(); c.fillStyle='#3ddbd9'; c.beginPath(); c.arc(0,0,4.5,0,TAU); c.fill(); }
    else if(t==='dive') jet(3,.58);
    else if(t==='rock'){ c.fillStyle='#6a6058'; c.beginPath(); for(let i=0;i<9;i++){ const a=i/9*TAU,r=16+((i*37)%7); c.lineTo(Math.cos(a)*r,Math.sin(a)*r); } c.closePath(); c.fill(); c.fillStyle='rgba(255,255,255,.14)'; c.beginPath(); c.arc(-5,-6,6,0,TAU); c.fill(); c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.arc(6,5,5,0,TAU); c.fill(); }
    else jet(6,1.25); }); }
function bossSpr(si,col){ return spr('b'+si,260,160,c=>{ const n=2+si%3,mir=f=>{ f(); c.save(); c.scale(-1,1); f(); c.restore(); };
    mir(()=>{ for(let i=0;i<n;i++){ const k=i/n,x=30+k*90,y=-20+k*44; poly(c,[[x-24,y-20],[x+24,y-30+(si%2)*12],[x+18,y+22],[x-4,y+40],[x-28,y+18]]); c.fillStyle=metal(c,x-28,x+24,i%2?shade(col,.7):col); c.fill(); c.strokeStyle='rgba(0,0,0,.45)'; c.lineWidth=1.5; c.stroke(); c.fillStyle='#232838'; c.fillRect(x-5,y+18,10,24+(i%2)*8); c.fillStyle=col; c.fillRect(x-2,y+36,4,8+(i%2)*8); } });
    const b=c.createLinearGradient(-42,0,42,0); b.addColorStop(0,'#2a3044'); b.addColorStop(.5,'#8a94ac'); b.addColorStop(1,'#232838'); c.fillStyle=b; c.beginPath(); const hull=[[[0,-62],[38,-30],[44,30],[14,62],[-14,62],[-44,30],[-38,-30]],[[0,-70],[30,-30],[52,24],[20,60],[-20,60],[-52,24],[-30,-30]],[...Array(14).keys()].map(i=>[Math.cos(i/14*TAU)*54,Math.sin(i/14*TAU)*46]),[[-20,-62],[20,-62],[24,-24],[54,-12],[54,22],[18,62],[-18,62],[-54,22],[-54,-12],[-24,-24]],[[0,-50],[16,-66],[34,-42],[50,-52],[48,26],[14,62],[-14,62],[-48,26],[-50,-52],[-34,-42],[-16,-66]]][si%5]; poly(c,hull); c.fill(); c.strokeStyle='rgba(0,0,0,.5)'; c.lineWidth=2; c.stroke();
    c.fillStyle=shade(col,.8); c.fillRect(-30,-22,60,6); c.fillRect(-34,14,68,5); const g=c.createRadialGradient(0,0,2,0,0,24); g.addColorStop(0,'#fff'); g.addColorStop(.35,col); g.addColorStop(1,'#141826'); c.fillStyle=g; c.beginPath(); c.arc(0,0,22,0,TAU); c.fill(); c.strokeStyle='#fff'; c.globalAlpha=.4; c.stroke(); c.globalAlpha=1; }); }
const ebSpr=(col,r)=>spr('e'+col+r,r*5,r*5,c=>{ const g=c.createRadialGradient(0,0,0,0,0,r*2.4); g.addColorStop(0,'#fff'); g.addColorStop(.32,'#fff'); g.addColorStop(.42,col); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.beginPath(); c.arc(0,0,r*2.4,0,TAU); c.fill(); });
const beamSpr=col=>spr('pb'+col,14,34,c=>{ const g=c.createLinearGradient(0,-16,0,16); g.addColorStop(0,'#fff'); g.addColorStop(.5,col); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.beginPath(); c.moveTo(0,-16); c.lineTo(3.4,-8); c.lineTo(2.4,16); c.lineTo(-2.4,16); c.lineTo(-3.4,-8); c.closePath(); c.fill(); });
const missSpr=spr.bind(null,'miss',12,26,c=>{ c.fillStyle='#e8ecf4'; c.fillRect(-2.5,-10,5,16); c.fillStyle='#ff5d5d'; c.beginPath(); c.moveTo(-2.5,-10); c.lineTo(0,-14); c.lineTo(2.5,-10); c.fill(); c.fillStyle='#ffb02a'; c.beginPath(); c.moveTo(-2,6); c.lineTo(0,12); c.lineTo(2,6); c.fill(); });
const POW={w:['#ff7a3d','武'],s:['#3ddbd9','盾'],b:['#ffd23f','爆'],c:['#86dc4f','$']};
const powSpr=k=>spr('pw'+k,40,40,c=>{ const g=c.createRadialGradient(0,0,4,0,0,19); g.addColorStop(0,'rgba(255,255,255,.3)'); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.fillRect(-20,-20,40,40); c.fillStyle=POW[k][0]; c.beginPath(); c.arc(0,0,12,0,TAU); c.fill(); c.strokeStyle='#fff'; c.lineWidth=2; c.stroke(); c.fillStyle='#14122b'; c.font='900 14px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(POW[k][1],0,1); });
const bgCache={};
function bg(si){ if(bgCache[si]) return bgCache[si]; const S=STAGES[si],e=document.createElement('canvas'); e.width=800; e.height=1000; const c=e.getContext('2d'),R=mul(si*97+5),g=c.createLinearGradient(0,0,0,1000); g.addColorStop(0,S.sky[0]); g.addColorStop(.5,S.sky[1]); g.addColorStop(1,S.sky[0]); c.fillStyle=g; c.fillRect(0,0,800,1000);
  c.globalCompositeOperation='lighter'; const blob=(x,y,r,a)=>{ for(const dy of [0,1000,-1000]){ const q=c.createRadialGradient(x,y+dy,0,x,y+dy,r); q.addColorStop(0,S.neb); q.addColorStop(1,'rgba(0,0,0,0)'); c.globalAlpha=a; c.fillStyle=q; c.fillRect(x-r,y+dy-r,r*2,r*2); } }; for(let i=0;i<9;i++) blob(R()*800,R()*1000,120+R()*220,.09+R()*.13); c.globalAlpha=1; c.globalCompositeOperation='source-over';
  for(let i=0;i<220;i++){ c.fillStyle='rgba(255,255,255,'+(.2+R()*.6)+')'; const s=R()<.08?2:1; c.fillRect(R()*800,R()*1000,s,s); }
  bgCache[si]=e; return e; }
function planet(c,x,y,r,col,ring){ const ag=c.createRadialGradient(x,y,r*.9,x,y,r*1.35); ag.addColorStop(0,'rgba(160,200,255,.35)'); ag.addColorStop(1,'rgba(160,200,255,0)'); c.fillStyle=ag; c.beginPath(); c.arc(x,y,r*1.35,0,TAU); c.fill();
  if(ring){ c.strokeStyle='rgba(255,255,255,.22)'; c.lineWidth=r*.12; c.beginPath(); c.ellipse(x,y,r*1.6,r*.34,-.3,Math.PI,TAU); c.stroke(); }
  const g=c.createRadialGradient(x-r*.4,y-r*.4,r*.1,x,y,r); g.addColorStop(0,'#fff'); g.addColorStop(.25,col); g.addColorStop(1,'#05060f'); c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,TAU); c.fill();
  c.save(); c.beginPath(); c.arc(x,y,r,0,TAU); c.clip(); c.globalAlpha=.18; for(let k=0;k<6;k++){ c.fillStyle=k%2?'#ffffff':'#000000'; c.beginPath(); c.ellipse(x,y-r*.7+k*r*.28,r*1.2,r*.07+(k%3)*r*.03,-.3,0,TAU); c.fill(); } c.globalAlpha=1;
  const sh=c.createLinearGradient(x-r,y-r,x+r,y+r); sh.addColorStop(.45,'rgba(0,0,10,0)'); sh.addColorStop(1,'rgba(0,0,10,.75)'); c.fillStyle=sh; c.fillRect(x-r,y-r,r*2,r*2); c.restore();
  if(ring){ c.strokeStyle='rgba(255,255,255,.4)'; c.lineWidth=r*.09; c.beginPath(); c.ellipse(x,y,r*1.6,r*.34,-.3,0,Math.PI); c.stroke(); } }
const ROCKS=[]; function rockSpr(k){ return spr('rock'+k,40,40,c=>{ const R=mul(k*31+7),n=9,pts=[]; for(let i=0;i<n;i++){ const a=i/n*TAU,r=11+R()*6; pts.push([Math.cos(a)*r,Math.sin(a)*r]); } const g=c.createRadialGradient(-5,-5,2,0,0,18); g.addColorStop(0,'#a8a0b8'); g.addColorStop(1,'#3a3448'); c.fillStyle=g; c.beginPath(); pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y)); c.closePath(); c.fill(); c.strokeStyle='rgba(0,0,0,.45)'; c.lineWidth=1.2; c.stroke(); c.fillStyle='rgba(0,0,0,.25)'; for(let i=0;i<3;i++){ c.beginPath(); c.arc(-6+R()*12,-6+R()*12,2+R()*3,0,TAU); c.fill(); } }); }
const galSpr=col=>spr('gal'+col,300,300,c=>{ c.globalCompositeOperation='lighter'; const g=c.createRadialGradient(0,0,0,0,0,40); g.addColorStop(0,'rgba(255,250,230,.9)'); g.addColorStop(1,'rgba(255,250,230,0)'); c.fillStyle=g; c.fillRect(-40,-40,80,40*2); const R=mul(col.length*13+7);
  for(let arm=0;arm<3;arm++) for(let i=0;i<160;i++){ const u=i/160,a=arm/3*TAU+u*4.4,r=14+u*130,x=Math.cos(a)*r+(R()-.5)*14*(1+u),y=(Math.sin(a)*r+(R()-.5)*14*(1+u))*.5; c.globalAlpha=(1-u)*.55; c.fillStyle=i%5?col:'#ffffff'; c.beginPath(); c.arc(x,y,1+R()*2*(1-u),0,TAU); c.fill(); } c.globalAlpha=1; },1);
const stnSpr=spr.bind(null,'stn',220,120,c=>{ c.fillStyle='#1a1e2a'; c.fillRect(-100,-6,200,12); for(const x of [-90,-60,60,90]){ c.fillStyle='#232a3c'; c.fillRect(x-12,-36,24,72); c.strokeStyle='rgba(120,160,220,.35)'; c.lineWidth=1; for(let y=-32;y<36;y+=8){ c.beginPath(); c.moveTo(x-12,y); c.lineTo(x+12,y); c.stroke(); } }
  c.fillStyle='#2c3448'; c.beginPath(); c.arc(0,0,30,0,TAU); c.fill(); c.strokeStyle='#4a5a7a'; c.lineWidth=5; c.beginPath(); c.ellipse(0,0,46,18,0,0,TAU); c.stroke(); c.fillStyle='#ffd88a'; for(let k=-2;k<=2;k++) c.fillRect(k*9-2,-4,4,4); });
function deco(c,si,t,S){ const k=si%6; c.save();
  if(k===0){ c.globalAlpha=.55; put(c,galSpr(S.neb),620-si%4*90,((t*5+si*90)%(H+300))-150,t*.03+si); }
  else if(k===1){ const u=((t*.07+si*.13)%1),x=-120+u*(W+240),y=80+u*260+(si%3)*40,a=Math.atan2(260,W+240); const g=c.createLinearGradient(x,y,x-Math.cos(a)*220,y-Math.sin(a)*220); g.addColorStop(0,'rgba(255,255,255,.75)'); g.addColorStop(.2,S.pl); g.addColorStop(1,'rgba(0,0,0,0)'); c.strokeStyle=g; c.lineCap='round'; c.lineWidth=10; c.globalAlpha=.6; c.beginPath(); c.moveTo(x,y); c.lineTo(x-Math.cos(a)*220,y-Math.sin(a)*220); c.stroke(); c.globalAlpha=1; c.fillStyle='#fff'; c.beginPath(); c.arc(x,y,5,0,TAU); c.fill(); }
  else if(k===2){ const yy=((t*6+si*70)%(H+400))-200; c.globalAlpha=.8; planet(c,W-120,yy,34,S.boss,false); planet(c,W-200,yy+70,20,S.pl,false); }
  else if(k===3){ const yy=((t*12+si*60)%(H+300))-150; c.globalAlpha=.45; put(c,stnSpr(),180+si%5*100,yy); c.globalAlpha=Math.sin(t*4)>0?.9:.2; c.fillStyle='#ff4a4a'; c.beginPath(); c.arc(180+si%5*100-100,yy,3,0,TAU); c.arc(180+si%5*100+100,yy,3,0,TAU); c.fill(); }
  else if(k===4){ c.globalCompositeOperation='lighter'; for(let b=0;b<3;b++){ c.strokeStyle=b===1?S.pl:S.neb; c.globalAlpha=.06+b*.02; c.lineWidth=60-b*16; c.beginPath(); for(let x=0;x<=W;x+=40) c.lineTo(x,200+b*120+Math.sin(x*.008+t*.5+b+si)*60); c.stroke(); } }
  else { c.globalCompositeOperation='lighter'; const cx=200+si%7*60,cy=((t*4+si*50)%(H+200))-100; for(let i=0;i<40;i++){ const a=i*2.4,r=Math.sqrt(i)*12; c.globalAlpha=.25+.5*Math.abs(Math.sin(t*1.3+i)); c.fillStyle=i%4?'#fff':S.pl; c.beginPath(); c.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,1.2+(i%3)*.6,0,TAU); c.fill(); } }
  c.restore(); }
function drawBg(c,si,t){ const e=bg(si),y=(t*22)%1000; c.drawImage(e,0,y-1000,800,1000); c.drawImage(e,0,y,800,1000); const S=STAGES[si],py=((t*9)%(H+500))-250; deco(c,si,t,S); planet(c,160+si%10*60,py,70+si%10*6,S.pl,si%2===0);
  for(let i=0;i<7;i++){ const v=34+(i%3)*14,yy=((t*v+i*173)%(H+80))-40,x=((i*271+si*53)%W),sp=rockSpr(i%4),sz=.32+(i%3)*.14; c.save(); c.translate(x,yy); c.rotate(t*(.3+i*.1)*(i%2?1:-1)); c.globalAlpha=.22+(i%3)*.06; c.drawImage(sp,-20*sz,-20*sz,40*sz,40*sz); c.restore(); } c.globalAlpha=1;
  c.fillStyle='rgba(255,255,255,.75)'; for(let i=0;i<34;i++){ const v=70+(i%5)*55,yy=((t*v+i*97)%(H+20))-10,x=(i*233)%W; c.fillRect(x,yy,1.3,v/22); }
  const vg=c.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.85); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.45)'); c.fillStyle=vg; c.fillRect(0,0,W,H); }

/* ---------- 遊戲本體 ---------- */
function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,local2=!net&&opts.mode==='2p',si=clamp(opts.stage||0,0,STAGES.length-1),S=STAGES[si],K=S.k,np=net?Math.min(4,net.count):local2?2:1,me=net?net.me:0;
  const {ctx:c,canvas}=env.canvas2d(W,H),R=mul((net?net.seed:Date.now())>>>0||7),sfx=n=>{ env.sfx(n); if(net&&net.host) evq.push(n); };
  const looks=[]; for(let i=0;i<np;i++) looks.push(Object.assign({color:COL[i%4],ship:String(i%3)},(net?net.looks&&net.looks[i]:i===0?opts.look:null)||{}));
  const PL=looks.map((L,i)=>({i,x:W/2+(i-(np-1)/2)*80,y:H-70,lv:1,lives:3,bomb:2,inv:2.5,sh:0,score:0,dead:false,col:L.color,ship:L.ship,fire:0,name:net?(net.names&&net.names[i])||'玩家'+(i+1):local2?(i+1)+'P':(opts.name||'你')}));
  let E=[],B=[],EB=[],PW=[],FX=[],boss=null,t=0,clock=0,spawnT=1.6,over=null,ended=false,evq=[],sendT=0,shake=0,flash=0,banT=3,inN=[{},{},{},{}],kills=0,warn=0,waveI=0,snapT=0,bossDone=false;
  const fxB=(x,y,col,n,sp,life)=>{ if(FX.length>380) return; for(let i=0;i<n;i++){ const a=Math.random()*TAU,v=sp*(.3+Math.random()); FX.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:life*(.5+Math.random()*.6),L:life,c:col,s:1.5+Math.random()*2.5}); } };
  const blast=(x,y,r,col)=>{ FX.push({ring:1,x,y,r:r*.2,R:r,l:.4,L:.4,c:col||'#ffd23f'}); fxB(x,y,'#fff',Math.ceil(r/5),r*5,.35); fxB(x,y,col||'#ff9d3d',Math.ceil(r/2),r*3.4,.65); };
  const alive=()=>PL.filter(p=>!p.dead),nearP=(x,y)=>{ let b=null,d=1e9; for(const p of alive()){ const q=Math.hypot(p.x-x,p.y-y); if(q<d){ d=q; b=p; } } return b; };
  const shot=(x,y,a,v,r,col)=>{ if(EB.length<400) EB.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:r||5,c:col||'#ff5d8f'}); };
  const aim=(x,y)=>{ const p=nearP(x,y); return p?Math.atan2(p.y-y,p.x-x):Math.PI/2; };
  const FOE={scout:{hp:2,r:15,pts:50,col:S.boss},weave:{hp:3,r:17,pts:80,col:S.pl},gun:{hp:9,r:20,pts:180,col:S.boss},spin:{hp:6,r:18,pts:140,col:S.pl},dive:{hp:2,r:15,pts:70,col:'#ff7a3d'},rock:{hp:6,r:17,pts:40,col:'#6a6058'},tank:{hp:30,r:34,pts:600,col:S.boss}};
  const add=(tp,x,y,o)=>{ const f=FOE[tp]; E.push(Object.assign({t:tp,x,y,vx:0,vy:60+K*50,hp:Math.ceil(f.hp*(.75+K*.5)),hpM:Math.ceil(f.hp*(.75+K*.5)),r:f.r,pts:f.pts,ph:R()*6,cd:1+R()*1.4,a:0,hit:0,x0:x},o||{})); };
  // 敵人一波一波來：每波一種隊形
  function wave(){ waveI++; const pick=R(),n=Math.round(3+K*5),gap=Math.max(.95,2.2-K*.9);
    if(clock>6&&pick<.2){ const x=120+R()*560; for(let i=0;i<n;i++) add('scout',x+(i-n/2)*36,-30-Math.abs(i-n/2)*30,{vy:70+K*70}); }
    else if(pick<.4){ const s=R()<.5?1:-1; for(let i=0;i<n;i++) add('weave',W/2+s*180,-30-i*44,{mx:1,amp:150+R()*80,vy:75+K*50,ph:i*.5}); }
    else if(pick<.56&&K>.55){ const k=K>1?3:2; for(let i=0;i<k;i++) add('gun',160+i*(480/(k-1||1))+R()*40,-40,{vy:50,stop:80+R()*80}); }
    else if(pick<.7){ const s=R()<.5?1:-1; for(let i=0;i<n;i++) add('dive',W/2+s*(120+i*42),-30-i*60,{dv:1,vy:120+K*60}); }
    else if(pick<.82){ for(let i=0;i<Math.round(n*.9);i++) add('rock',50+R()*700,-30-R()*200,{vy:90+R()*90+K*30,vx:(R()-.5)*50,rot:(R()-.5)*3}); }
    else if(K>.65&&pick<.92) add('spin',200+R()*400,-30,{vy:65,mx:1,amp:120,stop:120});
    else if(clock>18&&K>.75&&!E.some(e=>e.t==='tank')) add('tank',200+R()*400,-50,{vy:36,stop:90});
    else { for(let i=0;i<n;i++) add('scout',80+i*(640/(n-1||1)),-30-(i%2)*40,{vy:70+K*60}); }
    spawnT=gap+R()*.8; }
  function startBoss(){ const hp=Math.round((260+si*36)*(np>1?1+.5*(np-1):1)); boss={x:W/2,y:-90,tx:W/2,hp,hpM:hp,t:0,cd:1.2,ph:0,pat:0,hit:0,dying:0,beam:0,bx:0}; warn=2.6; sfx('trap'); }
  function bossAI(dt){ const b=boss; b.t+=dt; if(b.hit>0) b.hit-=dt; if(b.dying>0){ b.dying-=dt; shake=Math.max(shake,5); if(Math.random()<dt*20) blast(b.x+(Math.random()-.5)*210,b.y+(Math.random()-.5)*110,28,'#ff9d3d'); if(Math.random()<dt*8) sfx('bump'); if(b.dying<=0){ blast(b.x,b.y,120,'#fff'); flash=.8; shake=14; sfx('boom'); boss=null; bossDone=true; for(let i=0;i<8;i++) PW.push({k:'c',x:W/2+(i-3.5)*50,y:90,vy:80}); over={win:true,T:2.6}; sfx('win'); } return; }
    if(b.y<105){ b.y+=dt*70; return; } b.x+=(b.tx-b.x)*dt*.9; if(Math.abs(b.tx-b.x)<14||b.t%4<dt) b.tx=170+R()*460;
    const hpK=b.hp/b.hpM,stage=hpK>.66?0:hpK>.33?1:2,diff=K*(1+stage*.28); b.cd-=dt;
    if(b.beam>0){ b.beam-=dt; if(b.beam<.9&&b.beam>0){ for(const p of alive()) if(Math.abs(p.x-b.bx)<22) hurt(p); } if(b.beam<=0) b.cd=.9; return; }
    if(b.cd<=0){ b.pat=(b.pat+1)%4; if(stage===0&&b.pat===3) b.pat=0;
      if(b.pat===0){ const n=Math.round(5+diff*7),a0=aim(b.x,b.y+40); for(let i=0;i<n;i++) shot(b.x,b.y+40,a0+(i-(n-1)/2)*.15,130+diff*90,6); b.cd=1.45-diff*.45; sfx('pop'); }
      else if(b.pat===1){ const n=Math.round(10+diff*14),o=b.t*1.7; for(let i=0;i<n;i++) shot(b.x,b.y,o+i/n*TAU,105+diff*70,5,'#7ab8ff'); if(stage>0) for(let i=0;i<n;i++) shot(b.x,b.y,-o+i/n*TAU,75+diff*55,5,'#ffd23f'); b.cd=1.5-diff*.4; sfx('pop'); }
      else if(b.pat===2){ const p=nearP(b.x,b.y); b.bx=p?p.x:b.x; b.beam=1.9; b.tx=b.bx; sfx('beep'); b.cd=2.4; return; }
      else { const k=2+stage; for(let i=0;i<k;i++) add(i%2?'dive':'scout',b.x+(i-(k-1)/2)*70,b.y+30,{vy:120+K*50,dv:i%2}); b.cd=1.3; } } }
  function hurt(p){ if(p.inv>0||p.dead) return; if(p.sh>0){ p.sh=0; p.inv=1.3; sfx('bump'); fxB(p.x,p.y,'#3ddbd9',18,180,.5); return; } p.lives--; p.lv=Math.max(1,p.lv-1); blast(p.x,p.y,60,p.col); shake=10; sfx('hurt'); sfx('boom'); if(p.lives<=0){ p.dead=true; p.x=-200; if(!alive().length&&!over) over={win:false,T:2.2}; } else { p.inv=2.8; p.x=W/2; p.y=H-60; p.bomb=Math.max(p.bomb,2); } }
  function bombAt(p){ if(p.bomb<=0||p.dead) return; p.bomb--; p.inv=Math.max(p.inv,1.6); flash=.7; shake=12; sfx('boom'); blast(p.x,p.y-80,190,'#fff'); FX.push({ring:1,x:p.x,y:p.y,r:20,R:760,l:.7,L:.7,c:p.col}); EB=[]; for(const e of E){ e.hp-=26; e.hit=.1; } if(boss&&boss.y>=100) damageBoss(p,48); }
  function damageBoss(p,d){ if(!boss||boss.dying>0) return; boss.hp-=d; boss.hit=.06; if(p) p.score+=Math.round(d*2); if(boss.hp<=0){ boss.hp=0; boss.dying=2.6; EB=[]; E.forEach(e=>{ e.hp=0; }); if(p) p.score+=3000+si*800; sfx('boost'); } }
  const KM=[{u:['ArrowUp'],d:['ArrowDown'],l:['ArrowLeft'],r:['ArrowRight'],b:['KeyJ','Space','Enter']},{u:['KeyW'],d:['KeyS'],l:['KeyA'],r:['KeyD'],b:['KeyF','KeyG']}],ALL={u:['ArrowUp','KeyW'],d:['ArrowDown','KeyS'],l:['ArrowLeft','KeyA'],r:['ArrowRight','KeyD'],b:['KeyJ','Space','Enter','KeyF']};
  const readIn=h=>{ const m=local2?KM[h]:ALL,K2=env.keys,any=a=>a.some(k=>K2[k]); return {mx:(any(m.r)?1:0)-(any(m.l)?1:0),my:(any(m.d)?1:0)-(any(m.u)?1:0),b:m.b.some(k=>env.hit(k))}; };
  // 手指或滑鼠直接拖飛機
  let drag=null; const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const dn=e=>{ const q=toG(e),p=PL[local2?0:me]; drag={sx:q[0],sy:q[1],px:p.x,py:p.y,tx:q[0],ty:q[1]}; }; const mv=e=>{ if(drag){ const q=toG(e); drag.tx=q[0]; drag.ty=q[1]; } }; const up=()=>{ drag=null; };
  canvas.addEventListener('pointerdown',dn); addEventListener('pointermove',mv); addEventListener('pointerup',up);
  function stepPlayer(p,inp,dt){ if(p.dead) return; if(p.inv>0) p.inv-=dt; const sp=350;
    if(inp.dg){ p.x=clamp(inp.dg[0],16,W-16); p.y=clamp(inp.dg[1],60,H-22); } else { const l=Math.hypot(inp.mx,inp.my)||1; p.x=clamp(p.x+inp.mx/l*sp*dt,16,W-16); p.y=clamp(p.y+inp.my/l*sp*dt,60,H-22); }
    p.tilt=inp.mx||0; if(inp.b) bombAt(p);
    p.fire-=dt; if(p.fire<=0){ p.fire=.115; const L=p.lv,sh=(dx,a,dm,k)=>B.push({x:p.x+dx,y:p.y-22,vx:Math.sin(a)*760,vy:-Math.cos(a)*760,d:dm,o:p.i,k:k||0});
      if(L===1) sh(0,0,1); else if(L===2){ sh(-7,0,1); sh(7,0,1); } else if(L===3){ sh(0,0,1); sh(-9,-.1,1); sh(9,.1,1); } else if(L===4){ sh(-5,0,1); sh(5,0,1); sh(-14,-.14,1); sh(14,.14,1); } else { sh(-5,0,1.4); sh(5,0,1.4); sh(-14,-.13,1); sh(14,.13,1); sh(-20,-.3,1); sh(20,.3,1); }
      if(L>=4&&(p.mc=(p.mc||0)+1)%4===0){ for(const s of [-1,1]) B.push({x:p.x+s*22,y:p.y-4,vx:s*90,vy:-260,d:3,o:p.i,k:1}); } if(p.i===(local2?0:me)&&(p.sn=(p.sn||0)+1)%3===0) env.sfx('click'); }
    for(let i=PW.length-1;i>=0;i--){ const w=PW[i]; if(Math.hypot(w.x-p.x,w.y-p.y)<30){ PW.splice(i,1); if(w.k==='w'){ p.lv=Math.min(5,p.lv+1); } else if(w.k==='s') p.sh=1; else if(w.k==='b') p.bomb=Math.min(5,p.bomb+1); else p.score+=500; sfx('item'); fxB(w.x,w.y,POW[w.k][0],12,120,.4); } } }
  function kill(e,by){ blast(e.x,e.y,e.t==='tank'?70:e.r*1.5,e.t==='rock'?'#a89080':'#ff9d3d'); sfx(e.t==='tank'?'boom':'bump'); const p=PL[by]; if(p) p.score+=e.pts; kills++; const r=R(),dr=e.t==='tank'?.0:(kills%9===0?.1:r); if(e.t==='tank'||kills%9===0||r<.05){ const rr2=R(); PW.push({k:rr2<.55?'w':rr2<.78?'s':rr2<.93?'b':'c',x:e.x,y:e.y,vy:72}); } else if(dr<.14) PW.push({k:'c',x:e.x,y:e.y,vy:90}); }
  function step(dt){ t+=dt; clock+=dt; if(banT>0) banT-=dt; if(shake>0) shake=Math.max(0,shake-dt*24); if(flash>0) flash-=dt; if(warn>0) warn-=dt;
    if(!boss&&!bossDone&&clock<S.len){ spawnT-=dt; if(spawnT<=0&&clock>2) wave(); } else if(!boss&&!bossDone&&clock>=S.len&&!E.some(e=>e.y>0)) startBoss();
    if(boss) bossAI(dt);
    for(let h=0;h<np;h++){ const p=PL[h]; let inp; if(net) { inp=h===0?readIn(0):inN[h]; if(h===0&&drag){ inp=Object.assign({},inp,{dg:[drag.px+drag.tx-drag.sx,drag.py+drag.ty-drag.sy]}); } } else { inp=readIn(h); if(h===0&&drag) inp.dg=[drag.px+drag.tx-drag.sx,drag.py+drag.ty-drag.sy]; } stepPlayer(p,inp,dt); if(net&&h>0) inN[h].b=false; }
    for(const e of E){ e.ph+=dt; if(e.hit>0) e.hit-=dt; if(e.dv&&e.y>20&&!e.tg){ const a=aim(e.x,e.y); e.vx=Math.cos(a)*(170+K*60); e.vy=Math.sin(a)*(170+K*60); e.tg=1; e.a=a-Math.PI/2; }
      if(e.stop!=null&&e.y>=e.stop) e.vy=e.t==='gun'||e.t==='tank'||e.t==='spin'?0:e.vy; e.y+=e.vy*dt; e.x+=e.vx*dt; if(e.mx) e.x=e.x0+Math.sin(e.ph*1.6)*e.amp; if(e.rot) e.a+=e.rot*dt; if(e.t==='spin') e.a+=dt*2.4;
      e.cd-=dt; if(e.cd<=0&&e.y>0&&e.y<H*.7){ if(e.t==='gun'){ const a0=aim(e.x,e.y); const n=K>.85?3:1; for(let i=0;i<n;i++) shot(e.x,e.y+14,a0+(i-(n-1)/2)*.22,120+K*90,5); e.cd=2.1-K*.8; e.life=(e.life||0)+1; if(e.life>6) e.vy=70; } else if(e.t==='spin'){ const n=Math.round(5+K*5); for(let i=0;i<n;i++) shot(e.x,e.y,e.a+i/n*TAU,95+K*65,4,'#7ab8ff'); e.cd=2.3-K*.7; } else if(e.t==='tank'){ const a0=aim(e.x,e.y),n=Math.round(4+K*4); for(let i=0;i<n;i++) shot(e.x,e.y+20,a0+(i-(n-1)/2)*.18,110+K*80,6,'#ffd23f'); e.cd=2.2-K*.7; e.life=(e.life||0)+1; if(e.life>6) e.vy=50; } else if(K>.7&&e.t==='scout'&&R()<.35){ shot(e.x,e.y,aim(e.x,e.y),120+K*70,4); e.cd=2.5; } else e.cd=2.4; }
      for(const p of alive()) if(Math.hypot(e.x-p.x,e.y-p.y)<e.r*.7+6){ hurt(p); if(e.t!=='tank') e.hp=0; } }
    for(let i=B.length-1;i>=0;i--){ const b=B[i]; if(b.k===1){ let tg=null,dm=1e9; for(const e of E){ const q=Math.hypot(e.x-b.x,e.y-b.y); if(q<dm){ dm=q; tg=e; } } if(boss&&boss.y>=100&&!tg) tg=boss; if(tg){ const a=Math.atan2(tg.y-b.y,tg.x-b.x),v=460; b.vx+=(Math.cos(a)*v-b.vx)*dt*6; b.vy+=(Math.sin(a)*v-b.vy)*dt*6; } } b.x+=b.vx*dt; b.y+=b.vy*dt; if(b.y<-30||b.x<-30||b.x>W+30||b.y>H+20){ B.splice(i,1); continue; }
      let hit=false; for(const e of E){ if(e.y>-10&&Math.hypot(e.x-b.x,e.y-b.y)<e.r+3){ e.hp-=b.d; e.hit=.07; hit=true; break; } }
      if(!hit&&boss&&boss.y>=100&&Math.abs(b.x-boss.x)<118&&Math.abs(b.y-boss.y)<62){ damageBoss(PL[b.o],b.d); hit=true; }
      if(hit){ if(FX.length<320) FX.push({x:b.x,y:b.y,vx:(Math.random()-.5)*120,vy:60,l:.14,L:.14,c:'#fff',s:2.4}); B.splice(i,1); E=E.filter(e=>{ if(e.hp<=0){ kill(e,b.o); return false; } return true; }); } }
    E=E.filter(e=>e.hp>0&&e.y<H+60&&e.x>-90&&e.x<W+90||(e.hp<=0&&(kill(e,0),false)));
    for(let i=EB.length-1;i>=0;i--){ const b=EB[i]; b.x+=b.vx*dt; b.y+=b.vy*dt; if(b.x<-20||b.x>W+20||b.y<-20||b.y>H+20){ EB.splice(i,1); continue; } for(const p of alive()) if(Math.hypot(b.x-p.x,b.y-p.y)<b.r*.6+4){ hurt(p); EB.splice(i,1); break; } }
    for(let i=PW.length-1;i>=0;i--){ const w=PW[i]; w.y+=w.vy*dt; if(w.y>H+30) PW.splice(i,1); }
    if(over){ over.T-=dt; if(over.T<=0&&!ended){ ended=true; if(net) net.send({end:snapEnd()}); finish(); } }
  }
  const snapEnd=()=>({win:over.win,sc:PL.map(p=>p.score)});
  function finish(){ const total=PL.reduce((a,p)=>a+p.score,0),win=over.win; if(win&&!net){ try{ const k='arcade.space.w.'+S.rec,o=+localStorage.getItem(k)||0; if(total>o) localStorage.setItem(k,String(total)); }catch(e){} } env.sfx(win?'win':'lose');
    env.end({title:win?S.name+' 突破！':'艦隊全滅',big:total+' 分',html:np>1?'<table class="ls"><tr><th>駕駛員</th><th>分數</th></tr>'+PL.map(p=>'<tr><td>'+p.name+'</td><td>'+p.score+'</td></tr>').join('')+'</table>':'',text:win?'擊敗 '+kills+' 架敵機':'撐到第 '+Math.floor(clock)+' 秒',score:!net?total:null,next:win&&!net&&si<STAGES.length-1}); }
  // 連線：房主算全部，傳快照；客人只送按鍵
  const R0=v=>Math.round(v);
  const pack=()=>({P:PL.map(p=>[R0(p.x),R0(p.y),p.lv,p.lives,p.bomb,p.inv>0?1:0,p.sh,p.score,p.dead?1:0]),E:E.map(e=>[e.t,R0(e.x),R0(e.y),e.hit>0?1:0,+(e.a||0).toFixed(1),R0(e.vx),R0(e.vy)]),B:B.map(b=>[R0(b.x),R0(b.y),b.k,R0(b.vx),R0(b.vy)]).slice(0,70),X:EB.map(b=>[R0(b.x),R0(b.y),R0(b.vx),R0(b.vy),b.r,b.c]).slice(0,180),W:PW.map(w=>[w.k,R0(w.x),R0(w.y)]),Bo:boss?[R0(boss.x),R0(boss.y),boss.hp,boss.hpM,boss.hit>0?1:0,boss.beam>0?+boss.beam.toFixed(2):0,R0(boss.bx),boss.dying>0?1:0]:null,ev:evq,sh:+shake.toFixed(1),fl:+flash.toFixed(2),wn:+warn.toFixed(1),ck:+clock.toFixed(1)});
  if(net){ if(client) net.onmsg=m=>{ if(m.end){ over={win:m.end.win,T:0}; m.end.sc.forEach((v,i)=>{ PL[i].score=v; }); if(!ended){ ended=true; finish(); } return; } if(!m.s) return; const s=m.s; s.P.forEach((a,i)=>{ const p=PL[i]; p.tx=a[0]; p.ty=a[1]; p.lv=a[2]; p.lives=a[3]; p.bomb=a[4]; p.inv=a[5]?1:0; p.sh=a[6]; p.score=a[7]; p.dead=!!a[8]; });
        for(const a of s.E) { if(!a.done) a.done=1; } const old=E; E=s.E.map(a=>({t:a[0],x:a[1],y:a[2],hit:a[3],a:a[4],vx:a[5],vy:a[6]})); B=s.B.map(a=>({x:a[0],y:a[1],k:a[2],vx:a[3],vy:a[4]})); EB=s.X.map(a=>({x:a[0],y:a[1],vx:a[2],vy:a[3],r:a[4],c:a[5]})); PW=s.W.map(a=>({k:a[0],x:a[1],y:a[2]})); boss=s.Bo?{x:s.Bo[0],y:s.Bo[1],hp:s.Bo[2],hpM:s.Bo[3],hit:s.Bo[4],beam:s.Bo[5],bx:s.Bo[6],dying:s.Bo[7]}:null; if(s.sh>shake) shake=s.sh; if(s.fl>flash) flash=s.fl; warn=s.wn; clock=s.ck; for(const n of s.ev){ env.sfx(n); } if(old.length>E.length) for(const e of old){ if(!E.some(q=>Math.hypot(q.x-e.x,q.y-e.y)<40)) blast(e.x,e.y,22,'#ff9d3d'); } };
    else net.onmsg=(m,from)=>{ if(m.i&&inN[from]){ inN[from].mx=m.i[0]; inN[from].my=m.i[1]; if(m.i[2]) inN[from].b=true; if(m.i[3]) inN[from].dg=m.i[3]; else inN[from].dg=null; } }; for(let i=0;i<4;i++) inN[i]={mx:0,my:0,b:false}; }
  function update(dt){ if(ended) return; dt=Math.min(dt,.05);
    if(client){ t+=dt; if(shake>0) shake=Math.max(0,shake-dt*24); if(flash>0) flash-=dt; if(banT>0) banT-=dt; const I=readIn(0); const dg=drag?[R0(drag.px+drag.tx-drag.sx),R0(drag.py+drag.ty-drag.sy)]:0; if(I.b) inN.b=1; sendT-=dt; if(sendT<=0){ sendT=1/20; net.send({i:[I.mx,I.my,inN.b?1:0,dg]}); inN.b=0; }
      for(const p of PL) if(p.tx!=null){ p.x+=(p.tx-p.x)*Math.min(1,dt*16); p.y+=(p.ty-p.y)*Math.min(1,dt*16); } const pm=PL[me]; if(!pm.dead){ const l=Math.hypot(I.mx,I.my)||1; pm.x=clamp(pm.x+I.mx/l*260*dt,16,W-16); pm.y=clamp(pm.y+I.my/l*260*dt,60,H-22); pm.tilt=I.mx; }
      for(const a of [EB,B,E]) for(const b of a){ b.x+=(b.vx||0)*dt; b.y+=(b.vy||0)*dt; } } else { step(dt); if(net){ snapT-=dt; if(snapT<=0){ snapT=1/12; net.send({s:pack()}); evq=[]; } } }
    for(let i=FX.length-1;i>=0;i--){ const f=FX[i]; f.l-=dt; if(f.l<=0){ FX.splice(i,1); continue; } if(!f.ring){ f.x+=f.vx*dt; f.y+=f.vy*dt; f.vx*=.97; f.vy*=.97; } } }
  function draw(){ c.save(); if(shake>0) c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake); drawBg(c,si,t);
    for(const w of PW) put(c,powSpr(w.k),w.x,w.y+Math.sin(t*5+w.x)*2);
    if(boss){ const b=boss; if(b.beam>0){ const on=b.beam<.9,w=on?44:3+Math.sin(t*50)*2; const g=c.createLinearGradient(b.bx-w,0,b.bx+w,0); g.addColorStop(0,'rgba(255,60,120,0)'); g.addColorStop(.5,on?'#fff':'#ff5d8f'); g.addColorStop(1,'rgba(255,60,120,0)'); c.fillStyle=g; c.fillRect(b.bx-w,b.y,w*2,H); } if(!b.dying||Math.sin(t*50)>-.4){ put(c,bossSpr(si,S.boss),b.x,b.y+Math.sin(t*2)*4); if(b.hit>0){ c.globalCompositeOperation='lighter'; c.globalAlpha=.55; put(c,bossSpr(si,S.boss),b.x,b.y); c.globalAlpha=1; c.globalCompositeOperation='source-over'; } } }
    for(const e of E){ const s=foeSpr(e.t,FOE[e.t].col); put(c,s,e.x,e.y,e.a||.0001); if(e.hit>0){ c.globalCompositeOperation='lighter'; put(c,s,e.x,e.y,e.a||.0001); c.globalCompositeOperation='source-over'; } }
    for(const b of B){ if(b.k===1) put(c,missSpr(),b.x,b.y,Math.atan2(b.vy,b.vx)+Math.PI/2); else put(c,beamSpr(PL[b.o]?PL[b.o].col:PL[0].col),b.x,b.y+6,Math.atan2(b.vy,b.vx)+Math.PI/2); }
    for(const p of PL){ if(p.dead) continue; if(p.inv>0&&Math.floor(t*14)%2) continue; const fl=8+Math.sin(t*50)*3; for(const n of (SHIPS[p.ship]||SHIPS[0]).noz) for(const d of n[0]?[-1,1]:[1]){ const fx=p.x+d*n[0],fy=p.y+n[1]+n[2]*.6,fw=n[2]*.9; c.fillStyle='#ffb02a'; c.beginPath(); c.moveTo(fx-fw,fy); c.lineTo(fx+fw,fy); c.lineTo(fx,fy+fl*1.7); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.moveTo(fx-fw*.5,fy); c.lineTo(fx+fw*.5,fy); c.lineTo(fx,fy+fl*.9); c.fill(); }
      c.save(); c.translate(p.x,p.y); c.scale(1-Math.abs(p.tilt||0)*.14,1); put(c,shipSpr(p.col,p.ship),0,0); c.restore(); if(p.sh>0){ c.strokeStyle='rgba(61,219,217,'+(.5+.3*Math.sin(t*6))+')'; c.lineWidth=3; c.beginPath(); c.arc(p.x,p.y,36,0,TAU); c.stroke(); } c.fillStyle='#fff'; c.beginPath(); c.arc(p.x,p.y,3,0,TAU); c.fill(); c.strokeStyle=p.col; c.lineWidth=1.4; c.stroke();
      if(np>1||t<3.2){ const lab=np>1?p.name.slice(0,6):'你'; if(np>1||t<3.2){ c.font='900 11px '+TC; c.textAlign='center'; c.textBaseline='bottom'; c.lineWidth=3; c.strokeStyle='#0b0a1c'; c.strokeText(lab,p.x,p.y-38); c.fillStyle=p.col; c.fillText(lab,p.x,p.y-38); } } }
    for(const b of EB) put(c,ebSpr(b.c,b.r),b.x,b.y);
    for(const f of FX){ const a=f.l/f.L; if(f.ring){ c.globalAlpha=a; c.strokeStyle=f.c; c.lineWidth=2+a*7; c.beginPath(); c.arc(f.x,f.y,lerp(f.R,f.r,a),0,TAU); c.stroke(); c.globalAlpha=1; } else { c.globalAlpha=a; c.fillStyle=f.c; c.fillRect(f.x-f.s/2,f.y-f.s/2,f.s,f.s); c.globalAlpha=1; } }
    c.restore(); if(flash>0){ c.fillStyle='rgba(255,255,255,'+Math.min(.85,flash)+')'; c.fillRect(0,0,W,H); }
    // 介面
    c.fillStyle='rgba(6,8,24,.68)'; rr(c,8,8,250,46,10); c.fill(); const P=PL[client||net?me:0]; c.textAlign='left'; c.textBaseline='middle'; c.fillStyle='#fff'; c.font='900 15px '+PIX; c.fillText(String(PL.reduce((a,p)=>a+p.score,0)).padStart(7,'0'),16,22); c.font='700 11px '+TC; c.fillStyle='#ffd23f'; c.fillText('武器 Lv.'+P.lv,16,43); for(let i=0;i<P.lives;i++){ c.save(); c.translate(116+i*16,43); c.scale(.2,.2); put(c,shipSpr(P.col,P.ship),0,0); c.restore(); } for(let i=0;i<P.bomb;i++){ put(c,powSpr('b'),186+i*14,43,0,.46); }
    c.textAlign='right'; c.fillStyle='rgba(6,8,24,.68)'; rr(c,W-168,8,160,26,9); c.fill(); c.fillStyle='#cfe8ff'; c.font='900 12px '+TC; c.fillText(S.name,W-16,21);
    if(!boss&&!bossDone){ c.fillStyle='rgba(255,255,255,.2)'; c.fillRect(W-168,38,160,5); c.fillStyle=S.neb; c.fillRect(W-168,38,160*Math.min(1,clock/S.len),5); }
    if(boss){ c.fillStyle='rgba(6,8,24,.75)'; rr(c,270,12,260,18,8); c.fill(); const k=clamp(boss.hp/boss.hpM,0,1),g=c.createLinearGradient(274,0,526,0); g.addColorStop(0,'#ff3b6b'); g.addColorStop(1,'#ffb02a'); c.fillStyle=g; rr(c,274,16,252*k+1,10,5); c.fill(); c.fillStyle='#fff'; c.font='900 10px '+TC; c.textAlign='center'; c.fillText('BOSS',W/2,21); }
    if(warn>0&&Math.floor(t*5)%2){ c.fillStyle='rgba(255,40,70,.18)'; c.fillRect(0,H/2-40,W,80); c.fillStyle='#ff5d7a'; c.font='900 38px '+PIX; c.textAlign='center'; c.fillText('WARNING',W/2,H/2); }
    if(banT>0){ c.globalAlpha=Math.min(1,banT); c.fillStyle='#fff'; c.font='900 34px '+TC; c.textAlign='center'; c.lineWidth=7; c.strokeStyle='#0b0a1c'; c.strokeText('第 '+(si+1)+' 區　'+S.name,W/2,H*.38); c.fillText('第 '+(si+1)+' 區　'+S.name,W/2,H*.38); c.globalAlpha=1; } }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',dn); removeEventListener('pointermove',mv); removeEventListener('pointerup',up); },_dbg:{PL,get E(){return E;},get boss(){return boss;},get clock(){return clock;},set clock(v){clock=v;},get over(){return over;}}};
}
function stageShow(ctx,w,h,si,t){ ctx.save(); ctx.scale(w/W,h/H); drawBg(ctx,si,t); const S=STAGES[si]; put(ctx,bossSpr(si,S.boss),W/2,120+Math.sin(t*1.2)*8); for(let i=0;i<7;i++){ const a=t*.9+i/7*TAU; put(ctx,ebSpr('#ff5d8f',5),W/2+Math.cos(a)*(90+((t*50)%140)),130+Math.sin(a)*(90+((t*50)%140))); } put(ctx,shipSpr('#3ddbd9','0'),W/2+Math.sin(t)*150,H-90); for(let i=0;i<6;i++) put(ctx,beamSpr('#3ddbd9'),W/2+Math.sin(t)*150,H-120-((t*700+i*60)%340)); ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle='rgba(6,8,24,.7)'; rr(ctx,14,14,290,48,10); ctx.fill(); ctx.fillStyle='#ffd23f'; ctx.font='900 26px '+TC; ctx.fillText(S.name+'　'+'★'.repeat(S.stars),28,38); ctx.restore(); }
function thumb(ctx,w,h,t){ stageShow(ctx,w,h,16,t); }
function preview(ctx,w,h,L,t){ L=L||{}; ctx.save(); ctx.scale(w/W,h/H); drawBg(ctx,0,t); put(ctx,shipSpr(L.color||'#3ddbd9',L.ship||'0'),W/2,H/2,0,3); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).space={
  name:'太空艦隊',tag:'STAR FLEET',color:'#6fb4ff',
  desc:'縱向捲軸射擊：戰機會自動開火，你只要閃子彈、撿武器，每個星域的最後打巨大的王。共 100 關，過一關開下一關。',
  goal:'躲開子彈撐到王出現，打倒王就過關。撿「武」升級武器、「盾」擋一次、「爆」多一顆炸彈。',
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),stageShow,stageGoal:si=>STAGES[si].name+'：撐過敵機，打倒最後的王。白點是你的中彈位置，只有那裡被打到才算。',
  stageBest:i=>{ try{ const v=localStorage.getItem('arcade.space.w.'+STAGES[i].rec); return v?'最高 '+v:''; }catch(e){ return ''; } },
  stageLocked:i=>{ if(i===0) return false; for(let k=i-1;k<STAGES.length;k++){ try{ if(localStorage.getItem('arcade.space.w.'+STAGES[k].rec)) return false; }catch(e){ return false; } } return true; }, // 過了前一關才解鎖；打過後面關卡的舊紀錄照算
  help:[['↑ ↓ ← →','移動（自動開火，也可以用滑鼠拖）'],['J 或 空白鍵','放炸彈：清光子彈']],
  touchHelp:[['手指拖曳','移動戰機（自動開火）'],['炸彈','清光畫面上的子彈']],
  touch:{left:'dpad',right:[{l:'炸彈',c:'KeyJ',act:true}]},
  best:{label:'最高分',fmt:v=>v+' 分',lower:false},
  looks:[{key:'color',label:'機身顏色',type:'color',opts:['#3ddbd9','#ffd23f','#ff7eb6','#86dc4f','#ff7a3d','#b98cff','#e8ecf4','#4f9dff']},{key:'ship',label:'機型',opts:[{id:'0',label:'突擊型'},{id:'1',label:'三角翼'},{id:'2',label:'前掠翼'},{id:'3',label:'隱形戰機'},{id:'4',label:'重型雙發'},{id:'5',label:'鴨翼戰機'},{id:'6',label:'飛翼轟炸機'},{id:'7',label:'太空梭'}]}],
  thumb,preview,create};
})();
