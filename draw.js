// 你畫我猜：連線時輪流畫題目、其他人打字猜，越快猜對分數越高。單人時電腦畫、你來猜。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const WORDS={
  animal:['貓咪','小狗','大象','長頸鹿','企鵝','烏龜','兔子','獅子','鯊魚','章魚','蝴蝶','蜜蜂','蝸牛','恐龍','貓頭鷹','斑馬','無尾熊','海豚','螃蟹','青蛙','蛇','猴子','老鼠','母雞','金魚'],
  food:['珍珠奶茶','雞排','小籠包','西瓜','香蕉','蘋果','披薩','漢堡','薯條','壽司','甜甜圈','冰淇淋','蛋糕','荷包蛋','滷肉飯','泡麵','臭豆腐','鳳梨','櫻桃','葡萄','熱狗','棒棒糖','蚵仔煎','粽子','湯圓'],
  thing:['雨傘','手機','眼鏡','剪刀','牙刷','電風扇','馬桶','時鐘','鑰匙','吉他','鋼琴','腳踏車','飛機','火車','機車','帆船','火箭','安全帽','書包','鉛筆','氣球','電視','沙發','檯燈','皇冠'],
  place:['台北101','城堡','金字塔','摩天輪','游泳池','燈塔','夜市','廟宇','學校','公園','便利商店','沙灘','火山','彩虹','雪人','月亮','太陽','颱風','聖誕樹','溜滑梯','鬼屋','機場','醫院','動物園','瀑布'],
  act:['打籃球','游泳','釣魚','睡覺','跳舞','刷牙','放風箏','洗澡','滑手機','吃飯','爬山','打噴嚏','唱KTV','騎機車','拍照','跳繩','做瑜珈','擦眼淚','烤肉','衝浪','放煙火','玩躲貓貓','搭捷運','打麻將','追公車']};
const CAT=[['all','全部'],['animal','動物'],['food','美食'],['thing','生活用品'],['place','地點與景色'],['act','動作']],PAL=['#1c1c22','#ffffff','#e23b3b','#ff9d3d','#ffd23f','#3fae5a','#2f8fe8','#7a4ac8','#ff7eb6','#8a5a2a'],SIZES=[3,7,14,26];
// 單人：電腦畫（每個題目是幾筆線），一筆一筆畫出來
const C={k:'#1c1c22',r:'#e23b3b',o:'#ff9d3d',y:'#ffd23f',g:'#3fae5a',b:'#2f8fe8',p:'#ff7eb6',n:'#8a5a2a'};
const arc=(x,y,r,a0,a1,sy)=>{ const p=[]; for(let i=0;i<=16;i++){ const a=a0+(a1-a0)*i/16; p.push([x+Math.cos(a)*r,y+Math.sin(a)*r*(sy||1)]); } return p; },O=(x,y,r,sy)=>arc(x,y,r,0,6.3,sy);
const CPU=[
 {w:'太陽',s:[[C.o,O(.5,.5,.16)],[C.o,[[.5,.14],[.5,.26]]],[C.o,[[.5,.74],[.5,.86]]],[C.o,[[.14,.5],[.26,.5]]],[C.o,[[.74,.5],[.86,.5]]],[C.o,[[.25,.25],[.33,.33]]],[C.o,[[.75,.25],[.67,.33]]],[C.o,[[.25,.75],[.33,.67]]],[C.o,[[.75,.75],[.67,.67]]]]},
 {w:'雨傘',s:[[C.r,arc(.5,.5,.3,3.14,6.28,.9)],[C.r,[[.2,.5],[.3,.46],[.4,.5],[.5,.46],[.6,.5],[.7,.46],[.8,.5]]],[C.k,[[.5,.5],[.5,.8]]],[C.k,arc(.46,.8,.04,0,3.14,1.4)]]},
 {w:'蘋果',s:[[C.r,[[.5,.32],[.38,.28],[.26,.36],[.24,.54],[.32,.72],[.42,.8],[.5,.76],[.58,.8],[.68,.72],[.76,.54],[.74,.36],[.62,.28],[.5,.32]]],[C.n,[[.5,.32],[.52,.18]]],[C.g,[[.52,.24],[.6,.16],[.68,.2],[.6,.27],[.52,.24]]]]},
 {w:'房子',alt:['屋子','家'],s:[[C.k,[[.26,.46],[.26,.8],[.74,.8],[.74,.46]]],[C.r,[[.18,.48],[.5,.2],[.82,.48],[.18,.48]]],[C.n,[[.44,.8],[.44,.6],[.56,.6],[.56,.8]]],[C.b,[[.3,.54],[.38,.54],[.38,.62],[.3,.62],[.3,.54]]]]},
 {w:'魚',alt:['金魚'],s:[[C.b,O(.46,.5,.22,.6)],[C.b,[[.67,.5],[.84,.36],[.84,.64],[.67,.5]]],[C.k,O(.33,.46,.018)],[C.k,arc(.42,.5,.09,-1,1,1.2)]]},
 {w:'冰淇淋',s:[[C.n,[[.36,.46],[.5,.84],[.64,.46],[.36,.46]]],[C.p,arc(.5,.42,.16,3.0,6.42,1.1)],[C.y,arc(.5,.26,.09,0,6.3,1)]]},
 {w:'雪人',s:[[C.k,O(.5,.64,.19)],[C.k,O(.5,.34,.12)],[C.k,O(.46,.31,.012)],[C.k,O(.54,.31,.012)],[C.o,[[.5,.35],[.6,.37],[.5,.38]]],[C.k,[[.32,.58],[.16,.46]]],[C.k,[[.68,.58],[.84,.46]]],[C.r,[[.4,.46],[.6,.46]]]]},
 {w:'月亮',s:[[C.y,arc(.5,.5,.28,1.0,5.3)],[C.y,arc(.62,.5,.2,1.5,4.8)]]},
 {w:'花',alt:['花朵'],s:[[C.y,O(.5,.36,.06)],[C.p,O(.5,.22,.08)],[C.p,O(.36,.36,.08)],[C.p,O(.64,.36,.08)],[C.p,O(.5,.5,.08)],[C.g,[[.5,.58],[.5,.88]]],[C.g,arc(.58,.72,.08,3.14,5.5,.7)]]},
 {w:'氣球',s:[[C.r,O(.5,.36,.2,1.2)],[C.r,[[.47,.6],[.5,.64],[.53,.6]]],[C.k,[[.5,.64],[.47,.72],[.53,.8],[.48,.9]]]]},
 {w:'眼鏡',s:[[C.k,O(.33,.5,.13)],[C.k,O(.67,.5,.13)],[C.k,[[.46,.5],[.54,.5]]],[C.k,[[.2,.48],[.08,.42]]],[C.k,[[.8,.48],[.92,.42]]]]},
 {w:'時鐘',alt:['鐘'],s:[[C.k,O(.5,.5,.3)],[C.k,[[.5,.5],[.5,.28]]],[C.r,[[.5,.5],[.66,.56]]]]},
 {w:'船',alt:['帆船'],s:[[C.n,[[.2,.62],[.8,.62],[.68,.78],[.32,.78],[.2,.62]]],[C.k,[[.5,.62],[.5,.18]]],[C.r,[[.5,.2],[.74,.52],[.5,.52]]],[C.b,[[.08,.84],[.2,.8],[.32,.84],[.44,.8],[.56,.84],[.68,.8],[.8,.84],[.92,.8]]]]},
 {w:'彩虹',s:[[C.r,arc(.5,.72,.4,3.14,6.28)],[C.o,arc(.5,.72,.34,3.14,6.28)],[C.y,arc(.5,.72,.28,3.14,6.28)],[C.g,arc(.5,.72,.22,3.14,6.28)],[C.b,arc(.5,.72,.16,3.14,6.28)]]},
 {w:'貓咪',alt:['貓'],s:[[C.k,O(.5,.52,.24)],[C.k,[[.3,.4],[.3,.2],[.44,.3]]],[C.k,[[.7,.4],[.7,.2],[.56,.3]]],[C.k,O(.41,.5,.02)],[C.k,O(.59,.5,.02)],[C.p,[[.48,.58],[.52,.58],[.5,.61],[.48,.58]]],[C.k,[[.34,.58],[.16,.54]]],[C.k,[[.34,.64],[.16,.68]]],[C.k,[[.66,.58],[.84,.54]]],[C.k,[[.66,.64],[.84,.68]]]]},
 {w:'蛇',s:[[C.g,[[.84,.26],[.7,.2],[.5,.26],[.34,.24],[.2,.36],[.3,.5],[.56,.48],[.72,.58],[.62,.72],[.36,.7],[.16,.78]]],[C.r,[[.86,.26],[.94,.24]]],[C.k,O(.8,.23,.012)]]},
 {w:'鑰匙',s:[[C.y,O(.3,.5,.14)],[C.y,[[.44,.5],[.84,.5]]],[C.y,[[.74,.5],[.74,.62]]],[C.y,[[.84,.5],[.84,.64]]]]},
 {w:'蛋糕',s:[[C.p,[[.22,.5],[.78,.5],[.78,.78],[.22,.78],[.22,.5]]],[C.k,[[.22,.6],[.3,.66],[.4,.6],[.5,.66],[.6,.6],[.7,.66],[.78,.6]]],[C.r,[[.4,.5],[.4,.32]]],[C.r,[[.6,.5],[.6,.32]]],[C.o,O(.4,.27,.025)],[C.o,O(.6,.27,.025)]]},
 {w:'棒棒糖',s:[[C.p,O(.5,.32,.2)],[C.r,arc(.5,.32,.12,0,5)],[C.n,[[.5,.52],[.5,.9]]]]},
 {w:'火箭',s:[[C.k,[[.5,.12],[.62,.34],[.62,.68],[.38,.68],[.38,.34],[.5,.12]]],[C.b,O(.5,.38,.05)],[C.r,[[.38,.56],[.26,.74],[.38,.68]]],[C.r,[[.62,.56],[.74,.74],[.62,.68]]],[C.o,[[.42,.7],[.5,.9],[.58,.7]]]]}];
function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,solo=!net,OP=opts.options||{},ROUNDS=+OP.rounds||2,SEC=+OP.sec||70,me=net?net.me:0,n=net?Math.max(1,net.count):1,CATK=OP.cat||'all';
  const {ctx:c,canvas}=env.canvas2d(W,H),names=[]; for(let i=0;i<n;i++) names.push(net?(net.names&&net.names[i])||'玩家'+(i+1):(opts.name||'你'));
  const BX=14,BY=56,BW=526,BH=372; // 畫布位置（畫面座標）
  const board=document.createElement('canvas'); board.width=BW*2; board.height=BH*2; const b=board.getContext('2d'); b.lineCap='round'; b.lineJoin='round'; const wipe=()=>{ b.fillStyle='#fff'; b.fillRect(0,0,BW*2,BH*2); }; wipe();
  const pool=()=>CATK==='all'?[].concat(WORDS.animal,WORDS.food,WORDS.thing,WORDS.place,WORDS.act):WORDS[CATK];
  // 共用狀態：G 由房主決定
  let G={score:Array(n).fill(0),phase:'pick',dr:0,turn:0,total:n*ROUNDS,word:'',choices:[],T:12,got:[],hint:'',reveal:0},chat=[],stroke=[],strokes=[],curCol=PAL[0],curSz=1,erasing=false,t=0,ended=false,sendT=0,lastSec=99,fx=[],soloList=null,soloI=0,soloP=0,soloStroke=0,soloGood=0,soloTotal=+OP.rounds*4||8;
  const say=(who,txt,col)=>{ chat.push({who,txt,col}); if(chat.length>40) chat.shift(); renderChat(); };
  // DOM：打字猜答案
  const wrap=document.createElement('div'); wrap.style.cssText='position:absolute;z-index:6;display:flex;gap:6px;'; const inp=document.createElement('input'); inp.placeholder='輸入答案，按 Enter'; inp.maxLength=20; inp.autocomplete='off'; inp.style.cssText='flex:1;min-width:0;font:700 15px '+TC+';padding:6px 10px;border-radius:10px;border:2px solid #4a4680;background:#fff;color:#14122b'; const btn=document.createElement('button'); btn.textContent='送出'; btn.style.cssText='font:900 14px '+TC+';padding:0 12px;border-radius:10px;border:0;background:#ffd23f;color:#14122b'; wrap.append(inp,btn); env.stage.appendChild(wrap);
  const place=()=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=r.left+(r.width-W*s)/2-env.stage.getBoundingClientRect().left,oy=r.top+(r.height-H*s)/2-env.stage.getBoundingClientRect().top; wrap.style.left=(ox+550*s)+'px'; wrap.style.top=(oy+454*s)+'px'; wrap.style.width=(238*s)+'px'; wrap.style.height=(36*s)+'px'; };
  addEventListener('resize',place); place();
  const norm=s=>String(s||'').replace(/\s/g,'').toLowerCase();
  function submit(){ const v=inp.value.trim(); if(!v) return; inp.value=''; if(solo) soloGuess(v); else if(client) net.send({guess:v}); else guess(0,v); inp.focus(); }
  btn.addEventListener('click',submit); inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ submit(); e.preventDefault(); } e.stopPropagation(); });
  // 聊天紀錄用 canvas 畫
  const chatC=document.createElement('canvas'); chatC.width=476; chatC.height=480; const chx=chatC.getContext('2d'); function renderChat(){ const x=chx; x.setTransform(2,0,0,2,0,0); x.clearRect(0,0,238,240); x.textBaseline='top'; x.font='700 12px '+TC; let y=236; for(let i=chat.length-1;i>=0&&y>0;i--){ const m=chat[i],s=(m.who?m.who+'：':'')+m.txt,lines=[]; let line=''; for(const ch of s){ if(x.measureText(line+ch).width>226){ lines.push(line); line=''; } line+=ch; } lines.push(line); y-=lines.length*16+2; lines.forEach((ln,k)=>{ x.fillStyle=m.col||'#e8e6ff'; x.fillText(ln,4,y+k*16); }); } }
  /* ---- 房主流程 ---- */
  const broadcast=()=>{ if(net&&net.host) net.send({st:G}); };
  function pick3(){ const p=pool().slice(),o=[]; for(let i=0;i<3;i++) o.push(p.splice(Math.floor(Math.random()*p.length),1)[0]); return o; }
  function beginTurn(){ G.dr=G.turn%n; G.phase='pick'; G.choices=pick3(); G.word=''; G.T=12; G.got=[]; G.reveal=0; G.hint=''; clearBoard(); net&&net.send({clear:1}); env.sfx('go'); broadcast(); }
  function chooseWord(w){ if(G.phase!=='pick') return; G.word=w; G.phase='draw'; G.T=SEC; G.hint=[...w].map(ch=>'＿').join(' '); broadcast(); }
  function guess(from,v){ if(G.phase!=='draw'){ const m={who:names[from],txt:v}; if(net) net.send({chat:m}); say(m.who,m.txt); return; } if(from===G.dr){ return; } if(G.got.includes(from)) return;
    if(norm(v)===norm(G.word)){ const rank=G.got.length,pts=Math.round(40+60*(G.T/SEC))+Math.max(0,(3-rank)*10); G.score[from]+=pts; G.score[G.dr]+=Math.round(25+15*(G.T/SEC)); G.got.push(from); const m={who:'',txt:'🎉 '+names[from]+' 猜對了！+'+pts,col:'#86dc4f'}; if(net) net.send({chat:m,ok:from}); say('',m.txt,m.col); env.sfx('win'); if(G.got.length>=n-1) endTurn(); broadcast(); }
    else { const close=[...norm(G.word)].filter(ch=>norm(v).includes(ch)).length>=Math.max(1,norm(G.word).length-1); const m={who:names[from],txt:v}; if(net) net.send({chat:m}); say(m.who,m.txt); if(close){ const h={who:'',txt:'💡 '+names[from]+' 很接近了！',col:'#ffd23f'}; if(net) net.send({chat:h}); say('',h.txt,h.col); } } }
  function endTurn(){ G.phase='result'; G.T=4.5; const m={who:'',txt:'答案是「'+G.word+'」',col:'#ffb36b'}; if(net) net.send({chat:m}); say('',m.txt,m.col); broadcast(); }
  function hostTick(dt){ G.T-=dt; if(G.phase==='pick'&&G.T<=0) chooseWord(G.choices[0]);
    else if(G.phase==='draw'){ const W2=[...G.word]; const k=Math.floor((1-G.T/SEC)*W2.length*.7); if(k!==G.reveal&&W2.length>1){ G.reveal=k; G.hint=W2.map((ch,i)=>i<k&&(i*7+G.turn)%2===0?ch:'＿').join(' '); broadcast(); } if(G.T<=0) endTurn(); }
    else if(G.phase==='result'&&G.T<=0){ G.turn++; if(G.turn>=G.total){ G.phase='end'; broadcast(); if(net) net.send({over:1}); finish(); } else beginTurn(); }
    sendT-=dt; if(sendT<=0){ sendT=1; broadcast(); } }
  /* ---- 畫圖 ---- */
  function seg(a,bb,col,sz){ b.strokeStyle=col; b.lineWidth=sz*2; b.beginPath(); b.moveTo(a[0]*BW*2,a[1]*BH*2); b.lineTo(bb[0]*BW*2,bb[1]*BH*2); b.stroke(); if(a===bb){ b.fillStyle=col; b.beginPath(); b.arc(a[0]*BW*2,a[1]*BH*2,sz,0,7); b.fill(); } }
  function clearBoard(){ strokes=[]; wipe(); }
  function redraw(){ wipe(); for(const s of strokes){ for(let i=1;i<s.p.length;i++) seg(s.p[i-1],s.p[i],s.c,s.z); if(s.p.length===1) seg(s.p[0],s.p[0],s.c,s.z); } }
  const toG=e=>{ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*s)/2)/s,(e.clientY-r.top-(r.height-H*s)/2)/s]; };
  const iDraw=()=>!solo&&G.dr===me&&G.phase==='draw'; let pen=null,outbox=[];
  const TOOLS=(()=>{ const a=[]; PAL.forEach((col,i)=>a.push({k:'c',col,x:BX+2+i*29,y:BY+BH+8,w:25,h:25})); SIZES.forEach((z,i)=>a.push({k:'z',i,x:BX+300+i*30,y:BY+BH+8,w:26,h:25})); a.push({k:'undo',x:BX+424,y:BY+BH+8,w:48,h:25,l:'復原'},{k:'clr',x:BX+476,y:BY+BH+8,w:48,h:25,l:'清除'}); return a; })();
  const hit=(q,a)=>q[0]>=a.x&&q[0]<=a.x+a.w&&q[1]>=a.y&&q[1]<=a.y+a.h;
  function onDown(e){ const q=toG(e); if(solo){ return; }
    if(G.phase==='pick'&&G.dr===me){ G.choices.forEach((w,i)=>{ const a={x:BX+BW/2-110,y:BY+110+i*62,w:220,h:50}; if(hit(q,a)){ if(client) net.send({choose:w}); else chooseWord(w); env.sfx('click'); } }); return; }
    if(!iDraw()) return; for(const a of TOOLS) if(hit(q,a)){ env.sfx('click'); if(a.k==='c'){ curCol=a.col; } else if(a.k==='z') curSz=a.i; else if(a.k==='undo'){ strokes.pop(); redraw(); sendDraw({undo:1}); } else { clearBoard(); sendDraw({clear:1}); } return; }
    if(q[0]<BX||q[0]>BX+BW||q[1]<BY||q[1]>BY+BH) return; try{ canvas.setPointerCapture(e.pointerId); }catch(er){} const p=[(q[0]-BX)/BW,(q[1]-BY)/BH]; pen={c:curCol,z:SIZES[curSz],p:[p]}; strokes.push(pen); seg(p,p,pen.c,pen.z); outbox.push({n:1,c:pen.c,z:pen.z,p:[p.map(v=>+v.toFixed(3))]}); e.preventDefault(); }
  function onMove(e){ if(!pen) return; const q=toG(e),p=[clamp((q[0]-BX)/BW,0,1),clamp((q[1]-BY)/BH,0,1)],l=pen.p[pen.p.length-1]; if(Math.hypot(p[0]-l[0],p[1]-l[1])<.004) return; seg(l,p,pen.c,pen.z); pen.p.push(p); outbox.push({p:[p.map(v=>+v.toFixed(3))]}); }
  const onUp=()=>{ pen=null; };
  canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointermove',onMove); canvas.addEventListener('pointerup',onUp); canvas.addEventListener('pointercancel',onUp); canvas.style.touchAction='none';
  function sendDraw(m){ if(net) net.send(m); }
  function flushDraw(){ if(!outbox.length) return; const merged=[]; for(const o of outbox){ const l=merged[merged.length-1]; if(!o.n&&l) l.p.push(...o.p); else merged.push({n:o.n,c:o.c,z:o.z,p:o.p.slice()}); } outbox=[]; if(net) net.send({dw:merged,by:me}); }
  function applyDraw(list){ for(const o of list){ if(o.n){ pen2={c:o.c,z:o.z,p:[]}; strokes.push(pen2); } if(!pen2) continue; for(const p of o.p){ const l=pen2.p[pen2.p.length-1]; seg(l||p,p,pen2.c,pen2.z); pen2.p.push(p); } } }
  let pen2=null;
  function clientMsg(m){ if(m.st){ const was=G.phase,wasT=G.turn; G=m.st; if(G.turn!==wasT&&G.phase==='pick') clearBoard(); if(was!==G.phase&&G.phase==='pick') env.sfx('go'); } if(m.chat) say(m.chat.who,m.chat.txt,m.chat.col); if(m.ok!=null&&m.ok===me) env.sfx('win'); if(m.clear) clearBoard(); if(m.undo){ strokes.pop(); redraw(); } if(m.dw&&m.by!==me) applyDraw(m.dw); if(m.over) finish(); }
  if(net){ if(client) net.onmsg=clientMsg; else net.onmsg=(m,from)=>{ if(m.guess) guess(from,m.guess); if(m.choose&&from===G.dr) chooseWord(m.choose); if(from===G.dr&&G.phase==='draw'){ if(m.dw){ applyDraw(m.dw); net.send({dw:m.dw,by:from}); } if(m.clear){ clearBoard(); net.send({clear:1}); } if(m.undo){ strokes.pop(); redraw(); net.send({undo:1}); } } }; if(!client) beginTurn(); }
  /* ---- 單人：電腦畫 ---- */
  function soloNext(){ if(soloI>=soloList.length){ G.phase='end'; finish(); return; } wipe(); G.phase='draw'; G.T=SEC>45?45:SEC; G.word=soloList[soloI].w; G.hint=[...G.word].map(()=>'＿').join(' '); soloP=0; soloStroke=0; G.reveal=0; env.sfx('go'); }
  function soloGuess(v){ say(names[0],v); if(G.phase!=='draw') return; const it=soloList[soloI]; if(norm(v)===norm(it.w)||(it.alt||[]).some(a=>norm(a)===norm(v))){ const pts=Math.round(40+60*(G.T/45)); G.score[0]+=pts; soloGood++; say('','🎉 答對了！+'+pts,'#86dc4f'); env.sfx('win'); soloEnd(); } else env.sfx('bump'); }
  function soloEnd(){ const it=soloList[soloI]; while(soloStroke<it.s.length) soloDraw(1e9); G.phase='result'; G.T=2.2; if(!chat.length||!chat[chat.length-1].txt.includes('答對')) say('','答案是「'+it.w+'」','#ffb36b'); }
  function soloDraw(dp){ const it=soloList[soloI]; let budget=dp; while(budget>0&&soloStroke<it.s.length){ const [col,pts]=it.s[soloStroke]; if(soloP+1>=pts.length){ soloStroke++; soloP=0; continue; } seg(pts[soloP],pts[soloP+1],col,4); soloP++; budget--; } }
  if(solo){ const l=CPU.slice().sort(()=>Math.random()-.5); soloList=l.slice(0,Math.min(l.length,soloTotal)); soloNext(); say('','電腦開始畫了，打字猜猜看！','#ffd23f'); }
  function finish(){ if(ended) return; ended=true; const L=names.map((m,i)=>({m,s:G.score[i]})).sort((a,b)=>b.s-a.s); env.sfx('win'); env.end({title:solo?'猜完了！':L[0].m+' 獲勝！',big:solo?soloGood+' / '+soloList.length+' 題':L[0].s+' 分',html:solo?'':'<table class="ls"><tr><th>玩家</th><th>分數</th></tr>'+L.map(q=>'<tr><td>'+q.m+'</td><td>'+q.s+'</td></tr>').join('')+'</table>',text:solo?'總分 '+G.score[0]:'',score:solo?G.score[0]:null}); }
  let simAcc=0;
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt; if(client){ G.T-=dt; } else if(solo){ G.T-=dt; if(G.phase==='draw'){ simAcc+=dt*14; const k=Math.floor(simAcc); if(k){ simAcc-=k; soloDraw(k); } const W2=[...G.word],rv=Math.floor((1-G.T/45)*W2.length*.8); if(rv!==G.reveal&&W2.length>1){ G.reveal=rv; G.hint=W2.map((ch,i)=>i<rv&&i%2===0?ch:'＿').join(' '); } if(G.T<=0) soloEnd(); } else if(G.phase==='result'&&G.T<=0){ soloI++; soloNext(); } } else hostTick(dt);
    if(net&&outbox.length&&!pen||net&&outbox.length>12) flushDraw(); sendT-=0; const sec=Math.ceil(G.T); if(G.phase==='draw'&&sec!==lastSec&&sec<=10&&sec>0){ env.sfx('click'); } lastSec=sec; }
  function draw(){ const g=c.createLinearGradient(0,0,W,H); g.addColorStop(0,'#2a2460'); g.addColorStop(1,'#4a2a70'); c.fillStyle=g; c.fillRect(0,0,W,H); c.fillStyle='rgba(255,255,255,.04)'; for(let i=0;i<14;i++){ c.beginPath(); c.arc((i*137)%W,(i*91)%H,18+i%4*14,0,7); c.fill(); }
    // 題目列
    c.fillStyle='rgba(11,10,28,.75)'; rr(c,BX,8,BW,42,11); c.fill(); c.textAlign='center'; c.textBaseline='middle'; const drawer=!solo&&G.dr===me; let top='';
    if(G.phase==='pick') top=solo?'':drawer?'選一個題目來畫':names[G.dr]+' 正在選題目⋯'; else if(G.phase==='draw') top=drawer?'你要畫：'+G.word:G.hint; else if(G.phase==='result') top='答案：'+G.word;
    c.font='900 21px '+TC; c.fillStyle=drawer&&G.phase==='draw'?'#ffd23f':'#fff'; c.fillText(top,BX+BW/2,29,BW-110);
    const left=Math.max(0,Math.ceil(G.T)); if(G.phase==='draw'||G.phase==='pick'){ c.fillStyle=left<=10?'#ff5d6d':'#3ddbd9'; c.beginPath(); c.arc(BX+BW-24,29,17,0,7); c.fill(); c.fillStyle='#14122b'; c.font='900 15px '+TC; c.fillText(left,BX+BW-24,30); }
    if(!solo){ c.fillStyle='#cfc8ff'; c.font='700 11px '+TC; c.textAlign='left'; c.fillText('第 '+(Math.min(G.turn,G.total-1)+1)+' / '+G.total+' 回',BX+10,29); }
    // 畫布
    c.fillStyle='rgba(0,0,0,.3)'; rr(c,BX+3,BY+4,BW,BH,8); c.fill(); c.save(); rr(c,BX,BY,BW,BH,8); c.clip(); c.drawImage(board,BX,BY,BW,BH); c.restore(); c.strokeStyle='#ffd23f'; c.lineWidth=2.5; rr(c,BX,BY,BW,BH,8); c.stroke();
    if(G.phase==='pick'&&!solo){ c.fillStyle='rgba(11,10,28,.72)'; c.fillRect(BX,BY,BW,BH); if(drawer) G.choices.forEach((w,i)=>{ const x=BX+BW/2-110,y=BY+110+i*62; c.fillStyle='#ffd23f'; rr(c,x,y,220,50,12); c.fill(); c.fillStyle='#14122b'; c.font='900 21px '+TC; c.textAlign='center'; c.fillText(w,x+110,y+26); }); else { c.fillStyle='#fff'; c.font='900 22px '+TC; c.textAlign='center'; c.fillText(names[G.dr]+' 準備畫圖',BX+BW/2,BY+BH/2); } }
    // 工具
    if(iDraw()){ for(const a of TOOLS){ if(a.k==='c'){ c.fillStyle=a.col; rr(c,a.x,a.y,a.w,a.h,6); c.fill(); c.strokeStyle=curCol===a.col?'#ffd23f':'rgba(255,255,255,.4)'; c.lineWidth=curCol===a.col?3:1; c.stroke(); } else if(a.k==='z'){ c.fillStyle=curSz===a.i?'#ffd23f':'rgba(255,255,255,.14)'; rr(c,a.x,a.y,a.w,a.h,6); c.fill(); c.fillStyle=curSz===a.i?'#14122b':'#fff'; c.beginPath(); c.arc(a.x+a.w/2,a.y+a.h/2,Math.min(10,SIZES[a.i]*.42+1),0,7); c.fill(); } else { c.fillStyle='rgba(255,255,255,.14)'; rr(c,a.x,a.y,a.w,a.h,6); c.fill(); c.fillStyle='#fff'; c.font='900 12px '+TC; c.textAlign='center'; c.fillText(a.l,a.x+a.w/2,a.y+13); } } }
    else { c.fillStyle='#cfc8ff'; c.font='700 13px '+TC; c.textAlign='center'; c.fillText(solo?'第 '+(soloI+1)+' / '+soloList.length+' 題　總分 '+G.score[0]:G.phase==='draw'&&G.got.includes(me)?'你猜對了，等其他人⋯':G.phase==='draw'?'看圖在右下打字猜':'',BX+BW/2,BY+BH+21); }
    // 右邊：分數、對話
    const X=550; c.fillStyle='rgba(11,10,28,.72)'; rr(c,X-4,8,246,166,11); c.fill(); c.textAlign='left'; c.font='900 13px '+TC; c.fillStyle='#ffd23f'; c.fillText(solo?'分數':'排行榜',X+6,23); const L=names.map((m,i)=>({m,s:G.score[i],i})).sort((a,b)=>b.s-a.s); L.slice(0,8).forEach((q,k)=>{ const y=42+k*16; c.font=(q.i===me?'900 ':'700 ')+'12px '+TC; c.fillStyle=G.got&&G.got.includes(q.i)?'#86dc4f':q.i===G.dr&&!solo?'#ffb36b':q.i===me?'#ffd23f':'#fff'; c.textAlign='left'; c.fillText((q.i===G.dr&&!solo?'✏ ':'')+q.m.slice(0,9),X+6,y); c.textAlign='right'; c.fillText(q.s,X+232,y); });
    c.fillStyle='rgba(11,10,28,.72)'; rr(c,X-4,180,246,268,11); c.fill(); c.drawImage(chatC,X,194,238,240);
    if(drawer&&G.phase==='draw'){ inp.disabled=true; inp.placeholder='你在畫圖，不能猜'; } else { inp.disabled=false; inp.placeholder='輸入答案，按 Enter'; } }
  renderChat();
  return {update,draw,destroy(){ removeEventListener('resize',place); if(wrap.parentNode) wrap.remove(); },_dbg:{get G(){return G;},guess,soloGuess,get soloList(){return soloList;},chooseWord}};
}
function art(ctx,w,h,t){ ctx.save(); ctx.scale(w/W,h/H); const g=ctx.createLinearGradient(0,0,W,H); g.addColorStop(0,'#2a2460'); g.addColorStop(1,'#4a2a70'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); ctx.fillStyle='#fff'; rr(ctx,150,50,500,350,10); ctx.fill(); ctx.strokeStyle='#ffd23f'; ctx.lineWidth=4; ctx.stroke(); const it=CPU[Math.floor(t/4)%CPU.length],u=(t%4)/3,total=it.s.reduce((a,s)=>a+s[1].length,0); let left=Math.floor(u*total); ctx.lineWidth=7; ctx.lineCap='round'; ctx.lineJoin='round'; for(const [col,p] of it.s){ if(left<=1) break; ctx.strokeStyle=col; ctx.beginPath(); p.forEach((q,i)=>{ if(i<left){ const x=150+q[0]*500,y=50+q[1]*350; i?ctx.lineTo(x,y):ctx.moveTo(x,y); } }); ctx.stroke(); left-=p.length; } ctx.fillStyle='#14122b'; rr(ctx,250,420,300,50,14); ctx.fill(); ctx.fillStyle='#ffd23f'; ctx.font='900 26px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('猜猜我畫什麼？',W/2,445); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).draw={
  name:'你畫我猜',tag:'DRAW & GUESS',color:'#ffd23f',online:true,maxPlayers:8,minPlayers:2,
  desc:'一個人畫、其他人猜！連線時輪流畫題目，越快猜對分數越高。一個人玩時，換電腦畫給你猜。',
  goal:'輪到你就選題目畫出來；其他時候看圖打字猜答案。全部輪完分數最高的贏。',
  modes:[{id:'1p',label:'單人（電腦畫）'}],
  options:[{key:'cat',label:'題目類型',def:'all',opts:CAT.map(q=>({id:q[0],label:q[1]}))},{key:'rounds',label:'每人畫幾輪',def:'2',opts:[{id:'1',label:'1 輪'},{id:'2',label:'2 輪'},{id:'3',label:'3 輪'}]},{key:'sec',label:'每題秒數',def:'70',opts:[{id:'50',label:'50 秒'},{id:'70',label:'70 秒'},{id:'90',label:'90 秒'}]}],
  help:[['滑鼠','輪到你時在白板上畫圖'],['Enter','輸入答案後送出']],touchHelp:[['手指','輪到你時在白板上畫圖'],['輸入框','打字猜答案']],
  touch:{left:[],right:[]},best:{label:'單人最高',fmt:v=>v+' 分',lower:false},thumb:art,create};
})();
