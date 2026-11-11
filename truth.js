// 真心話轉轉樂：轉盤轉到誰，誰就選「真心話」或「大冒險」，抽一張題目卡照做！跳過要接受小懲罰。
// 大家用一台（3～10 人輪流）或連線最多 8 人（房主轉盤，大家同步看；被轉到的人在自己那台選）。6 種題庫共 144 題。
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
你覺得自己最大的優點是什麼？`,`用娃娃音說「我是全場最可愛的人」
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
讓右邊的人幫你取綽號，今晚大家都要這樣叫你`],
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
如果可以放一天假，你要做什麼？`,`用主播的口氣播報今天的天氣
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
把手機桌布給大家看`],
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
你覺得家裡誰最像你？`,`給在場每個人一個擁抱
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
講一個笑話，沒人笑就再講一個`],
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
你最喜歡收到什麼樣的驚喜？`,`深情地對左邊的人說「你今天好好看」
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
跳一段可愛的手指舞`],
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
你最想擁有哪一種超能力？`,`用鼻音唱一句歌
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
用自創的外星語自我介紹`]];
const THEMES=BANK.map(b=>b[0]).concat(['綜合隨機']),TCOL=BANK.map(b=>b[1]).concat(['#c56bff']);
const Q=BANK.map(b=>({truth:b[2].split('\n'),dare:b[3].split('\n')}));
const PUN=['喝一大口水','做 10 下開合跳','學貓叫 3 聲','唱一句歌','說一個冷笑話','原地轉 5 圈','用屁股寫自己的名字','比一個超可愛的動作'];
const PCOL=['#ff5d4f','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d','#3ddbd9','#ff7eb6','#8a5a3c','#a8e05a'];
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
  const n=net?net.count:pv?6:clamp(+OP.seats||5,3,10),me=net?net.me:-1,ROUNDS=+OP.rounds||12,local=!net;
  const names=[],looks=[]; for(let i=0;i<n;i++){ names.push(net?(net.names&&net.names[i])||'玩家'+(i+1):i===0&&opts.name&&opts.name!=='你'?opts.name:'玩家 '+(i+1)); looks.push(net?(net.looks&&net.looks[i])||BOTLOOK(i):i===0&&opts.look?opts.look:BOTLOOK(i)); }
  const colOf=i=>{ const L=looks[i]; return !L||!L.color||L.color==='auto'?PCOL[i%PCOL.length]:L.color; },cols=names.map((_,i)=>colOf(i));
  const CX=270,CY=272,RAD=186,K=1.15;
  let t=0,ended=false,sendT=0,evq=[],fx=[],lastSeg=-1,hover='';
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
  const BTN={spin:[520,330,240,64],truth:[510,250,130,110],dare:[650,250,130,110],rand:[540,372,210,44],ok:[510,404,130,52],no:[650,404,130,52],go:[560,404,180,52],end:[W-92,H-38,80,28]};
  const inR=(x,y,[a,b,w,h])=>x>=a&&y>=b&&x<=a+w&&y<=b+h;
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const which=(x,y)=>{ if(canSpin()&&(inR(x,y,BTN.spin)||Math.hypot(x-CX,y-CY)<RAD)) return ['spin']; if(canPick()){ if(inR(x,y,BTN.truth)) return ['pick','truth']; if(inR(x,y,BTN.dare)) return ['pick','dare']; if(inR(x,y,BTN.rand)) return ['pick','rand']; }
    if(G.ph==='card'&&canRes()){ if(inR(x,y,BTN.ok)) return ['res',true]; if(inR(x,y,BTN.no)) return ['res',false]; } if(G.ph==='pun'&&canRes()&&inR(x,y,BTN.go)) return ['go']; if(local&&G.ph==='next'&&ROUNDS>=99&&inR(x,y,BTN.end)) return ['end']; return null; };
  const pd=e=>{ const [x,y]=toG(e),w=which(x,y); if(!w) return; if(w[0]==='end'){ G.ph='end'; return; } act(w[0],w[1]); };
  const pm=e=>{ const [x,y]=toG(e),w=which(x,y); hover=w?w.join(':'):''; canvas.style.cursor=w?'pointer':''; };
  canvas.addEventListener('pointerdown',pd); canvas.addEventListener('pointermove',pm);
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt; if(G.flip<1) G.flip=Math.min(1,G.flip+dt*3);
    if(!pv){ if(env.hit('Space')){ if(canSpin()) act('spin'); else if(G.ph==='pun') act('go'); } if(env.hit('Digit1')||env.hit('ArrowLeft')) canPick()&&act('pick','truth'); if(env.hit('Digit2')||env.hit('ArrowRight')) canPick()&&act('pick','dare'); if(env.hit('Digit3')||env.hit('ArrowDown')) canPick()&&act('pick','rand');
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
    /* 左上：每個人完成幾題 */ c.textAlign='left'; c.font='700 12px '+TC; c.fillStyle='rgba(255,255,255,.75)'; c.fillText(local?(env.touch?'大家輪流用同一台手機':'大家輪流用同一台電腦'):'',12,40); }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',pd); canvas.removeEventListener('pointermove',pm); },_dbg:{get G(){return G;},doSpin,choose,resolve,nextRound,Q}};
}
function stageShow(ctx,w,h,si,t){ ctx.save(); ctx.scale(w/W,h/H); bgArt(ctx,t,TCOL[si]); const nm=['小胖','阿美','大雄','小綠','阿花','鐵蛋'],cols=PCOL.slice(0,6); wheelArt(ctx,300,260,190,t*1.4,nm,cols,t,-1);
  const q=si<BANK.length?Q[si][Math.floor(t/3)%2?'dare':'truth'][Math.floor(t/6)%12]:Q[Math.floor(t/3)%5].truth[0],truth=!(Math.floor(t/3)%2);
  ctx.save(); ctx.translate(640,250); ctx.rotate(.06); ctx.fillStyle='#fffaf0'; rr(ctx,-130,-120,260,230,18); ctx.fill(); ctx.fillStyle=truth?'#4f9dff':'#ff5d4f'; rr(ctx,-130,-120,260,46,18); ctx.fill(); ctx.fillRect(-130,-92,260,18); ctx.fillStyle='#fff'; ctx.font='900 21px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(truth?'💬 真心話':'🔥 大冒險',0,-96);
  ctx.fillStyle='#2a0e40'; ctx.font='900 19px '+TC; const L=wrap(ctx,q,224); L.forEach((s,k)=>ctx.fillText(s,0,-10+(k-(L.length-1)/2)*28)); ctx.restore();
  ctx.textAlign='center'; ctx.font='900 24px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#2a0e40'; ctx.strokeText(THEMES[si],640,440); ctx.fillStyle='#ffd23f'; ctx.fillText(THEMES[si],640,440); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).truth={
  name:'真心話轉轉樂',tag:'TRUTH OR DARE',color:'#c56bff',online:true,maxPlayers:8,minPlayers:2,bots:false,
  desc:'轉盤轉到誰，誰就要選「真心話」或「大冒險」，抽一張題目卡照做！不敢做就跳過，但要接受小懲罰。6 種題庫共 144 題，大家用一台輪流玩，或連線各用各的手機。',
  goal:'轉轉盤選人，被轉到的人選真心話或大冒險，照卡片做完按「完成」。',
  stages:THEMES,stageLabel:'選擇題庫',stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,0,t),
  stageGoal:i=>i<BANK.length?'「'+THEMES[i]+'」12 題真心話＋12 題大冒險。':'從全部 120 題裡隨機抽。',
  modes:[{id:'1p',label:'大家用一台'}],
  options:[{key:'seats',label:'幾個人玩',def:'5',opts:[{id:'3',label:'3 人'},{id:'4',label:'4 人'},{id:'5',label:'5 人'},{id:'6',label:'6 人'},{id:'8',label:'8 人'},{id:'10',label:'10 人'}]},{key:'rounds',label:'玩幾輪',def:'12',opts:[{id:'8',label:'8 輪'},{id:'12',label:'12 輪'},{id:'20',label:'20 輪'},{id:'99',label:'不限'}]}],
  help:[['空白鍵','轉轉盤'],['1 / 2 / 3','真心話／大冒險／讓命運決定'],['Enter','完成（也可以用滑鼠點按鈕）']],
  touchHelp:[['點轉盤','轉轉盤'],['點按鈕','選真心話或大冒險、完成']],touch:null,
  looks:[{key:'char',label:'人物',opts:[{id:'cap',label:'帽子'},{id:'cat',label:'貓耳'},{id:'bunny',label:'兔耳'},{id:'crown',label:'皇冠'},{id:'chef',label:'廚師'},{id:'pirate',label:'海盜'},{id:'ninja',label:'忍者'},{id:'bow',label:'蝴蝶結'}]},{key:'color',label:'人物顏色',type:'color',opts:['auto','#ff5d4f','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d','#3ddbd9','#ff7eb6']}],
  preview:(ctx,w,h,L,t)=>{ ctx.save(); ctx.scale(w/W,h/H); bgArt(ctx,t,'#c56bff'); ctx.restore(); const C=window.ARCADE_CHAR; if(C) C.drawChar(ctx,w/2,h*.6,!L||!L.color||L.color==='auto'?PCOL[0]:L.color,1,false,t,2.6,(L&&L.char)||'cap',(L&&L.deco)||''); },
  create};
})();
