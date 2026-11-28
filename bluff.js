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
熊貓一天大約要花＿＿個小時吃東西|12|2/4/1/6`],
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
北半球一年中白天最長的節氣是＿＿|夏至|立夏/大暑/芒種/小滿`],
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
台灣的特有種鳥類「台灣藍鵲」的嘴巴是＿＿色的|紅|黃/黑/藍/白`]];
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
  stageGoal:i=>(i<BANK.length?'題庫「'+BANK[i][0]+'」':'三種題庫混在一起')+'。每題各編一個像真的假答案，再選出真答案：選中 +2 分，假答案每騙到一人 +1 分。',
  modes:[{id:'1p',label:'單人（和電腦）'},{id:'room',label:'大家用一台'}],
  options:[{key:'n',label:'玩家人數',def:'5',solo:true,opts:[3,4,5,6,7,8].map(n=>({id:String(n),label:n+' 人'}))},{key:'rounds',label:'題數',def:'6',opts:[{id:'4',label:'4 題'},{id:'6',label:'6 題'},{id:'8',label:'8 題'},{id:'10',label:'10 題'}]}],
  help:[['打字＋Enter','編一個假答案送出（💡 幫你想一個）'],['點答案','選出你覺得是真的那一個'],['空白鍵','大家用一台：開始、看完分數換下一題']],
  touchHelp:[['打字','編一個假答案送出（💡 幫你想一個）'],['點答案','選出你覺得是真的那一個']],touch:null,
  looks:[{key:'char',label:'人物',opts:[{id:'cap',label:'帽子'},{id:'cat',label:'貓耳'},{id:'bunny',label:'兔耳'},{id:'crown',label:'皇冠'},{id:'chef',label:'廚師'},{id:'pirate',label:'海盜'},{id:'ninja',label:'忍者'},{id:'bow',label:'蝴蝶結'}]},{key:'color',label:'人物顏色',type:'color',opts:['auto','#ff7a3d','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d','#3ddbd9','#ff7eb6']}],
  preview:(ctx,w,h,L,t)=>{ ctx.drawImage(bg(),0,0,w,h); const C=window.ARCADE_CHAR; if(C) C.drawChar(ctx,w/2,h*.6,!L||!L.color||L.color==='auto'?PCOL[0]:L.color,1,false,t,2.6,(L&&L.char)||'cap',''); },
  hubBest:()=>{ const v=LSn('arcade.bluff.w'); return v?'當上唬爛王 <b>'+v+'</b> 次':'尚無紀錄'; },
  best:{label:'',fmt:v=>v,lower:false},create};
})();
