// 彈弓攻城隊：拉彈弓把毛球射出去，打垮木頭、冰塊、石頭搭的城堡，消滅躲在裡面的壞史萊姆。
// 物理用 planck.js（Box2D 的 JS 版，進遊戲才載入）。單人 12 關；雙人／對電腦／連線是「對轟」：兩邊各有城堡輪流射。
(function(){
'use strict';
const W=800,H=450,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,GY=H-34;
const PLANCK_URL='https://cdn.jsdelivr.net/npm/planck@1.0.6/dist/planck.min.js';
const clamp=(v,a,b)=>v<a?a:v>b?b:v,pick=a=>a[Math.floor(Math.random()*a.length)];
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const LS=(k,v)=>{ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } };
function load(){ if(window.planck) return Promise.resolve(); return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=PLANCK_URL; s.onload=()=>res(); s.onerror=()=>{ s.remove(); rej(new Error('planck')); }; document.head.appendChild(s); }); }
/* 材質：密度、耐久、分數、顏色 */
const MAT={wood:{d:.7,hp:7,sc:200,c:'#c98a45',e:'#8a5426'},ice:{d:.45,hp:3,sc:100,c:'rgba(170,225,255,.82)',e:'#5aa8d8'},stone:{d:2.2,hp:16,sc:300,c:'#9ea4ac',e:'#5e646c'}};
/* 毛球：紅＝普通；藍＝飛到最高點自動分成三顆；黃＝又重又大能貫穿；黑＝撞到後爆炸 */
const AMMO={red:{n:'紅毛球',c:'#ff5a5a',r:.5,d:3},blue:{n:'藍毛球',c:'#4aa8ff',r:.42,d:3},yellow:{n:'黃毛球',c:'#ffcc33',r:.58,d:7},black:{n:'炸彈毛球',c:'#3a3448',r:.52,d:4}};
/* 場景主題 */
const THEMES={meadow:['#8fd3ff','#d8f3ff','#6cc04a','#4e9a34'],forest:['#7ac8e0','#cdeedd','#3f8f4a','#2f6a38'],snow:['#a8c8ee','#eef6ff','#f4f8ff','#c6d6e8'],desert:['#ffc88a','#fff0c8','#e8b868','#c08a48'],beach:['#6ad0f0','#d8f8ff','#f2dc9a','#d8b870'],canyon:['#ff9a6a','#ffd8a8','#c8683a','#9a4a2a'],night:['#141a48','#3a3a7a','#2a4a3a','#1a3028'],ice:['#7aa8e8','#d8ecff','#cde8ff','#9ac0e8'],castle:['#9ab8e8','#e8e0f0','#7a9a5a','#5a7a40'],volcano:['#3a1a2a','#a84a3a','#4a3030','#2a1818'],sky:['#5ab0ff','#e0f4ff','#ffffff','#d0e4f8'],dark:['#1a1030','#4a2a5a','#3a2a48','#24182e']};
/* ---- 關卡：用公尺描述，地面 y=0，x 往右 ---- */
function B(){ const L=[]; const add=(k,o)=>{ L.push(Object.assign({k},o)); };
  const api={L,
    blk:(x,y,w,h,m,a)=>add('blk',{x:x+w/2,y:y+h/2,w,h,m,a:a||0}),
    post:(x,y,h,m)=>api.blk(x,y,.34,h,m),
    beam:(x,y,w,m)=>api.blk(x,y,w,.34,m),
    frame:(x,y,w,h,m,top)=>{ api.post(x,y,h,m); api.post(x+w-.34,y,h,m); api.beam(x-.15,y+h,w+.3,top||m); return y+h+.34; },
    slime:(x,y,s,h)=>add('slm',{x,y:y+.45*(s||1),r:.45*(s||1),king:(s||1)>1.3,helm:!!h}),
    tri:(x,y,w,m)=>{ api.blk(x,y,w,.34,m); api.blk(x+w*.15,y+.34,w*.7,.34,m); api.blk(x+w*.3,y+.68,w*.4,.34,m); }};
  return api; }
const STAGES=[
  {n:'草原入門',th:'meadow',am:['red','red','red'],b(a){ const y=a.frame(16,0,2.4,1.8,'wood'); a.slime(17.2,0); a.frame(21,0,2.4,1.8,'wood'); a.slime(22.2,2.14); }},
  {n:'森林小木屋',th:'forest',am:['red','red','red'],b(a){ let y=a.frame(17,0,3,1.8,'wood'); a.slime(18.5,0); y=a.frame(17.3,y,2.4,1.6,'wood'); a.slime(18.5,y-1.94+.0); a.slime(18.5,y); a.post(22,0,2.6,'wood'); a.post(22.6,0,2.6,'wood'); }},
  {n:'雪地冰塊塔',th:'snow',am:['red','blue','red'],b(a){ let y=0; for(let k=0;k<3;k++){ a.slime(19.6,y); y=a.frame(18.6,y,2,1.5,'ice'); } a.slime(19.6,y); a.blk(22.5,0,1,1,'ice'); a.slime(23,1); }},
  {n:'沙漠石頭堡',th:'desert',am:['red','yellow','red'],b(a){ a.blk(16,0,1,1,'stone'); a.blk(20.4,0,1,1,'stone'); a.beam(15.8,1,5.8,'stone'); a.slime(18.7,0); let y=a.frame(16.4,1.34,4.4,1.6,'wood'); a.slime(18.6,1.34); a.slime(18.6,y); }},
  {n:'海邊高台',th:'beach',am:['blue','red','yellow'],b(a){ a.blk(18,0,1.2,3.2,'stone'); a.beam(17,3.2,3.2,'wood'); a.slime(17.6,3.54); a.slime(19.6,3.54); a.frame(22,0,2.2,1.6,'ice'); a.slime(23.1,0); }},
  {n:'峽谷金字塔',th:'canyon',am:['black','red','yellow'],b(a){ const m=['wood','stone','wood','ice']; let x=16.5,w=7; for(let k=0;k<4;k++){ a.blk(x,k*.9,w,.9,m[k]); x+=.8; w-=1.6; } a.slime(19.8,3.6); }},
  {n:'月夜雙塔',th:'night',am:['red','blue','black','yellow'],b(a){ for(const x0 of [16.5,22]){ let y=0; for(let k=0;k<3;k++){ y=a.frame(x0,y,2.2,1.4,k===1?'stone':'wood'); a.slime(x0+1.1,y-1.74); } a.slime(x0+1.1,y); } a.beam(18.4,4.2,3.8,'wood'); }},
  {n:'冰雪宮殿',th:'ice',am:['blue','blue','black'],b(a){ a.blk(16,0,6.6,.5,'stone'); let y=a.frame(16.2,.5,3,1.6,'ice'); a.slime(17.7,.5); a.frame(19.4,.5,3,1.6,'ice'); a.slime(20.9,.5); y=a.frame(17.4,y,3.8,1.4,'ice','stone'); a.slime(19.3,y-1.74); a.tri(17.6,y,3.4,'ice'); a.slime(19.3,y+1.02); }},
  {n:'城牆吊橋',th:'castle',am:['yellow','black','red','blue'],b(a){ a.blk(15.5,0,1,3.6,'stone'); a.blk(24,0,1,3.6,'stone'); a.beam(15.3,3.6,9.9,'wood'); for(const x of [17.5,20,22.3]){ a.frame(x-.2,0,1.5,1.6,'wood'); a.slime(x+.55,0); } a.slime(17,3.94); a.slime(23,3.94); a.frame(19.2,3.94,2,1.3,'ice'); a.slime(20.2,3.94); }},
  {n:'火山要塞',th:'volcano',am:['black','black','yellow','red'],b(a){ a.blk(16,0,7,.8,'stone'); let y=.8; for(let k=0;k<3;k++){ const w=6-k*1.4,x=16.5+k*.7; y=a.frame(x,y,w,1.5,k%2?'wood':'stone'); a.slime(x+w/2,y-1.84); } a.slime(19.5,y); a.post(24.5,0,3,'stone'); a.slime(24.67,3); }},
  {n:'雲端之城',th:'sky',am:['blue','yellow','black','red'],b(a){ a.blk(16.5,0,.8,4.4,'stone'); a.blk(21.5,0,.8,4.4,'stone'); a.beam(16.3,4.4,6.2,'stone'); let y=a.frame(16.8,4.74,2.4,1.5,'wood'); a.slime(18,4.74); a.frame(19.6,4.74,2.4,1.5,'ice'); a.slime(20.8,4.74); a.slime(18,y); a.slime(19.4,0); a.frame(18.2,0,2.4,1.6,'wood'); }},
  {n:'魔王城',th:'dark',am:['black','yellow','blue','red','black'],b(a){ a.blk(15.5,0,9.5,.6,'stone'); for(const x of [15.8,23.2]){ let y=.6; for(let k=0;k<3;k++){ y=a.frame(x,y,1.6,1.3,'stone'); } a.slime(x+.8,y); } let y=a.frame(18.2,.6,4.2,1.8,'wood'); a.slime(20.3,.6,1.6); y=a.frame(18.6,y,3.4,1.4,'ice'); a.slime(20.3,y-1.74); a.tri(18.8,y,3,'stone'); }}];
/* ---- 第 13～50 關：城堡藍圖產生器（固定種子，每次都一樣） ---- */
function srng(seed){ let s=(seed*2654435761)>>>0||1; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
const GTH=['meadow','forest','snow','desert','beach','canyon','night','ice','castle','volcano','sky','dark'];
const GTN={meadow:'草原',forest:'森林',snow:'雪原',desert:'沙漠',beach:'海灘',canyon:'峽谷',night:'月夜',ice:'冰河',castle:'王城',volcano:'火山',sky:'天空',dark:'暗黑'};
const GSN={tower:['高塔','雙塔','三塔'],pyr:'金字塔',bunker:'碉堡',bridge:'吊橋',stairs:'階梯城',wall:'城牆'};
function gTower(a,R,x,k,lv,w){ const ms=k<.3?['wood','wood','ice']:k<.65?['wood','stone','ice','wood']:['stone','wood','stone','ice']; let y=0; const helm=k>.45;
  for(let i=0;i<lv;i++){ const m=ms[Math.floor(R()*ms.length)],h=1.3+R()*.5,ww=Math.max(1.5,w-i*.3),xx=x+(w-ww)/2; if(R()<.75||i===0) a.slime(xx+ww/2,y,1,helm&&R()<.4); y=a.frame(xx,y,ww,h,m,R()<.3?'stone':m); }
  a.slime(x+w/2,y,R()<k*.8?1.6:1,helm&&R()<.5); return w; }
function gPyr(a,R,x,k){ const ms=['wood','stone','wood','ice','stone']; let xx=x,w=5.6+R()*1.4; const n=3+Math.floor(k*2); for(let i=0;i<n;i++){ a.blk(xx,i*.8,w,.8,ms[(i+Math.floor(R()*2))%ms.length]); if(i<n-1&&w>2.4){ a.slime(xx+.45,i*.8+.8,.85,k>.5&&R()<.4); a.slime(xx+w-.45,i*.8+.8,.85,k>.5&&R()<.4); } xx+=.75; w-=1.5; if(w<1.2) break; } a.slime(xx+w/2-.75+.75,(n)*.8,k>.6?1.6:1); return 7.2; }
function gBunker(a,R,x,k){ const h=2.2+R()*.8; a.blk(x,0,.7,h,'stone'); a.beam(x-.1,h,1.1+2.6,'stone'); let y=a.frame(x+1.2,0,2.4,h-.34,'wood'); a.slime(x+2.4,0,1,k>.4); a.slime(x+2.4,h+.34,1,k>.6&&R()<.5); if(k>.5){ a.frame(x+1.4,h+.34,2,1.3,'ice'); a.slime(x+2.4,h+.34+1.64,1); } return 3.9; }
function gBridge(a,R,x,k){ const span=3.6+R()*1.6,h=2.4+R()*1.2,m=k>.5?'stone':'wood'; a.blk(x,0,.8,h,'stone'); a.blk(x+span-.8,0,.8,h,'stone'); a.beam(x-.1,h,span+.2,m); a.slime(x+span/2,0,k>.55?1.6:1); a.frame(x+span/2-1.2,0,2.4,1.4,'ice'); let y=a.frame(x+span/2-1.1,h+.34,2.2,1.4,'wood'); a.slime(x+span/2,h+.34,1,k>.5); a.slime(x+span/2,y,1); return span; }
function gStairs(a,R,x,k){ let y=0; for(let i=0;i<3;i++){ const xx=x+i*1.9; let yy=0; for(let j=0;j<=i;j++){ yy=a.frame(xx,yy,1.7,1.25,j===i?'ice':j%2?'stone':'wood'); } a.slime(xx+.85,yy,1,k>.5&&i===2); if(i>0) a.slime(xx+.85,0,.8); } return 5.6; }
function gWall(a,R,x,k){ for(let i=0;i<3;i++) a.post(x+i*.5,0,2.6+R()*.6,'stone'); a.beam(x-.2,3.2,1.6,'stone'); return 1.6+gTower(a,R,x+2,k,2+Math.floor(k*2),2.4)*0+2.6; }
function genStage(i){ const R=srng(i*97+13),k=i/49,th=GTH[(i*5+3)%GTH.length],pool=k<.35?['tower','tower','pyr','bunker','stairs']:['tower','pyr','bunker','bridge','stairs','wall','tower']; const used=[];
  const b=a=>{ const R2=srng(i*97+13); R2(); let x=14.6+R2()*1.2; const want=k<.25?2:3; for(let n=0;n<want&&x<24.5;n++){ const kind=used[n]; let w=0;
      if(kind==='tower'){ const lv=2+Math.floor(R2()*(1+k*2.2)); w=gTower(a,R2,x,k,Math.min(4,lv),2+R2()*.8); } else if(kind==='pyr') w=gPyr(a,R2,x,k); else if(kind==='bunker') w=gBunker(a,R2,x,k); else if(kind==='bridge') w=gBridge(a,R2,x,k); else if(kind==='stairs') w=gStairs(a,R2,x,k); else { gWall(a,R2,x,k); w=4.6; }
      x+=w+.9+R2()*.6; } };
  const want=k<.25?2:3; let x=14.6+R()*1.2; for(let n=0;n<want;n++){ let kind=pool[Math.floor(R()*pool.length)]; const wEst={tower:2.8,pyr:7.2,bunker:3.9,bridge:5.2,stairs:5.6,wall:5}[kind]; if(x+wEst>27.4){ kind='tower'; if(x+2.8>27.4) break; } used.push(kind); x+=wEst+1.2; }
  const tmp=B(); b(tmp); const ns=tmp.L.filter(o=>o.k==='slm').length,hasStone=tmp.L.some(o=>o.m==='stone'),hasIce=tmp.L.some(o=>o.m==='ice');
  const nA=clamp(Math.ceil(ns*.55)+2-Math.floor(k*1.5),3,6),bag=['red','red'].concat(hasStone?['yellow','black']:[],hasIce?['blue']:[],k>.5?['black','yellow']:['red']),am=[]; for(let j=0;j<nA;j++) am.push(bag[Math.floor(R()*bag.length)]);
  const main=used.includes('pyr')?'pyr':used.includes('bridge')?'bridge':used.includes('bunker')?'bunker':used.includes('wall')?'wall':used.includes('stairs')?'stairs':'tower';
  let nm=GTN[th]+(main==='tower'?GSN.tower[Math.min(2,used.filter(q=>q==='tower').length-1)]:GSN[main]);
  return {n:nm,th,am,b}; }
for(let i=12;i<50;i++){ const g=genStage(i); let nm=g.n,q=2; while(STAGES.some(s=>s.n===nm)) nm=g.n+' '+['Ⅱ','Ⅲ','Ⅳ','Ⅴ'][q++-2]; g.n=nm; STAGES.push(g); }

STAGES.forEach((s,i)=>{ s.k=i/(STAGES.length-1); s.stars=1+Math.round(s.k*4); });
/* 對轟戰場：兩邊對稱的城堡 */
function duelFort(a,x0,flip){ const X=x=>flip?44-x:x,xs=(x,w)=>flip?44-x-w:x,blk=(x,y,w,h,m)=>a.blk(xs(x,w),y,w,h,m);
  blk(x0,0,5.2,.5,'stone'); blk(x0+.2,.5,.34,1.9,'wood'); blk(x0+2.2,.5,.34,1.9,'wood'); blk(x0+4.3,.5,.7,1.9,'stone'); blk(x0-.1,2.4,5.3,.34,'stone');
  a.slime(X(x0+1.25),.5); a.slime(X(x0+3.35),.5); blk(x0+1,2.74,.34,1.3,'wood'); blk(x0+3.2,2.74,.34,1.3,'ice'); blk(x0+.85,4.04,2.85,.34,'stone'); a.slime(X(x0+2.27),2.74); blk(x0+4.4,2.74,.6,1.3,'stone'); }
const STG=i=>STAGES[clamp(i|0,0,STAGES.length-1)];
function specOf(si,duel){ const a=B(); if(duel){ duelFort(a,6,false); duelFort(a,6,true); } else STG(si).b(a); return a.L; }
/* ---- 畫圖（精緻版）：背景靜態部分先畫好存起來，會動的再疊上去 ---- */
const BGC={};
function shd(h,k){ if(h[0]!=='#') return h; const n=parseInt(h.slice(1),16),f=v=>clamp(Math.round(k<0?v*(1+k):v+(255-v)*k),0,255); return 'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')'; }
function hills(c,base,amp,f1,f2,ph,colTop,colBot,y0){ const g=c.createLinearGradient(0,y0-base-amp,0,GY); g.addColorStop(0,colTop); g.addColorStop(1,colBot); c.fillStyle=g; c.beginPath(); c.moveTo(0,GY); for(let x=0;x<=W;x+=10) c.lineTo(x,GY-base-Math.sin(x*f1+ph)*amp-Math.sin(x*f2+ph*2)*amp*.45); c.lineTo(W,GY); c.fill(); }
function treeArt(c,x,y,s,kind,col){ c.save(); c.translate(x,y); c.scale(s,s);
  if(kind==='pine'||kind==='snowpine'){ c.fillStyle='#5a3a22'; c.fillRect(-3,-14,6,14); for(let k=0;k<3;k++){ const yy=-14-k*14,w=22-k*5; c.fillStyle=k%2?'#2f6a3a':'#3a7a44'; c.beginPath(); c.moveTo(-w,yy); c.lineTo(0,yy-22); c.lineTo(w,yy); c.fill(); c.fillStyle='rgba(0,0,0,.15)'; c.beginPath(); c.moveTo(0,yy-22); c.lineTo(w,yy); c.lineTo(2,yy); c.fill(); if(kind==='snowpine'){ c.fillStyle='#fff'; c.beginPath(); c.moveTo(-w*.55,yy-9); c.lineTo(0,yy-22); c.lineTo(w*.55,yy-9); c.quadraticCurveTo(0,yy-13,-w*.55,yy-9); c.fill(); } } }
  else if(kind==='cactus'){ c.fillStyle='#4a9a4a'; rr(c,-6,-46,12,46,6); c.fill(); rr(c,-20,-32,8,18,4); c.fill(); rr(c,-20,-18,16,6,3); c.fill(); rr(c,12,-38,8,20,4); c.fill(); rr(c,6,-22,14,6,3); c.fill(); c.fillStyle='rgba(255,255,255,.2)'; c.fillRect(-4,-44,3,40); }
  else if(kind==='palm'){ c.strokeStyle='#8a6a3a'; c.lineWidth=7; c.lineCap='round'; c.beginPath(); c.moveTo(0,0); c.quadraticCurveTo(10,-40,4,-78); c.stroke(); c.strokeStyle='#6a4a22'; c.lineWidth=1.5; for(let k=0;k<8;k++){ c.beginPath(); c.moveTo(-3+k*1.2,-8-k*9); c.lineTo(5+k*1.2,-10-k*9); c.stroke(); } c.fillStyle='#3a9a4a'; for(let k=0;k<6;k++){ const a=-Math.PI/2+(k-2.5)*.6; c.save(); c.translate(4,-78); c.rotate(a); c.beginPath(); c.ellipse(22,0,24,6,.2,0,TAU); c.fill(); c.restore(); } c.fillStyle='#6a4a22'; c.beginPath(); c.arc(2,-74,4,0,TAU); c.arc(8,-73,4,0,TAU); c.fill(); }
  else { c.fillStyle='#6a4428'; c.fillRect(-4,-24,8,24); const cs=col||['#4aa848','#3a9a3a','#5ab858']; [[0,-40,20],[-14,-30,14],[14,-30,14],[-6,-48,12],[8,-46,12]].forEach(([dx,dy,r],i)=>{ c.fillStyle=cs[i%3]; c.beginPath(); c.arc(dx,dy,r,0,TAU); c.fill(); }); c.fillStyle='rgba(255,255,255,.18)'; c.beginPath(); c.arc(-6,-48,6,0,TAU); c.fill(); }
  c.restore(); }
function bgStatic(th){ if(BGC[th]) return BGC[th]; const k=document.createElement('canvas'); k.width=W*2; k.height=H*2; const c=k.getContext('2d'); c.scale(2,2); const T=THEMES[th]||THEMES.meadow,night=th==='night'||th==='dark'||th==='volcano';
  const g=c.createLinearGradient(0,0,0,GY); g.addColorStop(0,T[0]); g.addColorStop(1,T[1]); c.fillStyle=g; c.fillRect(0,0,W,H);
  // 太陽／月亮光暈
  const sx=560,sy=80,sg=c.createRadialGradient(sx,sy,10,sx,sy,170); sg.addColorStop(0,night?(th==='volcano'?'rgba(255,120,60,.45)':'rgba(255,250,220,.35)'):'rgba(255,250,210,.7)'); sg.addColorStop(1,'rgba(255,250,210,0)'); c.fillStyle=sg; c.fillRect(0,0,W,GY);
  c.fillStyle=night?(th==='volcano'?'#ff8a4a':'#fff6d0'):'#fffbe0'; c.beginPath(); c.arc(sx,sy,night?24:30,0,TAU); c.fill(); if(night&&th!=='volcano'){ c.fillStyle=T[0]; c.beginPath(); c.arc(sx+10,sy-6,20,0,TAU); c.fill(); }
  // 遠山（三層）
  const far=night?['rgba(40,30,80,.75)','rgba(30,24,60,.9)']:th==='desert'||th==='canyon'?['rgba(220,150,100,.55)','rgba(200,120,80,.6)']:th==='snow'||th==='ice'?['rgba(210,225,245,.9)','rgba(170,195,230,.9)']:['rgba(140,170,210,.55)','rgba(110,140,190,.6)'];
  hills(c,110,45,.008,.021,1,far[0],far[1],GY); if(th==='snow'||th==='ice'){ c.fillStyle='rgba(255,255,255,.8)'; for(let x=0;x<W;x+=10){ const y=GY-110-Math.sin(x*.008+1)*45-Math.sin(x*.021+2)*20; if(y<GY-140) c.fillRect(x,y,10,6); } }
  if(th==='canyon'){ c.fillStyle='rgba(170,80,40,.7)'; for(const [x,w,h] of [[40,90,150],[520,120,170],[680,80,120]]){ c.beginPath(); c.moveTo(x,GY); c.lineTo(x+8,GY-h); c.lineTo(x+w-8,GY-h); c.lineTo(x+w,GY); c.fill(); c.fillStyle='rgba(255,180,120,.25)'; for(let yy=GY-h+20;yy<GY;yy+=24) c.fillRect(x+6,yy,w-12,3); c.fillStyle='rgba(170,80,40,.7)'; } }
  if(th==='volcano'){ c.fillStyle='#2a1418'; c.beginPath(); c.moveTo(380,GY); c.lineTo(540,GY-200); c.lineTo(610,GY-200); c.lineTo(780,GY); c.fill(); const lg=c.createLinearGradient(0,GY-200,0,GY); lg.addColorStop(0,'#ff8a2a'); lg.addColorStop(1,'rgba(255,60,20,0)'); c.fillStyle=lg; c.beginPath(); c.moveTo(560,GY-200); c.quadraticCurveTo(540,GY-120,520,GY-40); c.lineTo(536,GY-40); c.quadraticCurveTo(566,GY-120,590,GY-200); c.fill(); }
  if(th==='castle'||th==='dark'){ const cc=th==='dark'?'rgba(50,25,70,.9)':'rgba(130,130,165,.7)'; c.fillStyle=cc; c.fillRect(560,GY-150,170,150); for(let q=0;q<8;q++) c.fillRect(560+q*22,GY-164,12,14); c.fillRect(600,GY-230,46,80); c.fillRect(680,GY-200,40,60); c.beginPath(); c.moveTo(596,GY-230); c.lineTo(623,GY-272); c.lineTo(650,GY-230); c.fill(); c.beginPath(); c.moveTo(676,GY-200); c.lineTo(700,GY-236); c.lineTo(724,GY-200); c.fill(); c.fillStyle=th==='dark'?'rgba(255,90,200,.6)':'rgba(255,230,150,.7)'; for(const [x,y] of [[615,GY-200],[700,GY-175],[590,GY-110],[650,GY-110],[710,GY-110]]) c.fillRect(x,y,8,12); }
  if(th==='sky'){ for(const [x,y,w] of [[90,170,120],[640,150,140],[360,120,90]]){ c.fillStyle='#7ac06a'; c.beginPath(); c.ellipse(x,y,w/2,12,0,0,TAU); c.fill(); c.fillStyle='#8a6a4a'; c.beginPath(); c.moveTo(x-w/2,y); c.lineTo(x,y+w*.45); c.lineTo(x+w/2,y); c.fill(); treeArt(c,x-10,y-4,.5); } }
  // 近丘
  const mid=night?['#24384a','#162430']:th==='snow'||th==='ice'?['#e8f2ff','#c8d8f0']:th==='desert'||th==='canyon'?['#e8b870','#c8904a']:th==='beach'?['#f0d890','#d8b868']:th==='sky'?['#ffffff','#d8e8f8']:['#7ac860','#4e9a3a'];
  hills(c,46,16,.017,.041,2,mid[0],mid[1],GY);
  // 主題道具
  const props={meadow:[['tree',40,1.1],['tree',700,1.3],['tree',760,.9]],forest:[['pine',30,1.4],['pine',90,1.1],['tree',150,1],['pine',640,1.5],['pine',720,1.2],['tree',780,1.1]],snow:[['snowpine',40,1.3],['snowpine',110,1],['snowpine',700,1.4],['snowpine',770,1.1]],desert:[['cactus',60,1.1],['cactus',700,1.3],['cactus',770,.9]],beach:[['palm',50,1.1],['palm',730,1.2]],canyon:[['cactus',120,.9],['cactus',760,1]],night:[['pine',50,1.2],['tree',720,1.2]],ice:[['snowpine',60,1.1],['snowpine',740,1.2]],castle:[['tree',40,1.2],['tree',110,.9]],volcano:[],sky:[],dark:[['pine',50,1.1],['pine',760,1.3]]}[th]||[];
  for(const [kd,x,s] of props) treeArt(c,x,GY-26-Math.sin(x*.017+4)*12,s,kd,night?['#2a4a3a','#1e3a2e','#345a44']:null);
  if(th==='beach'){ const wg=c.createLinearGradient(0,GY-34,0,GY); wg.addColorStop(0,'#3ab8e8'); wg.addColorStop(1,'#1a88c8'); c.fillStyle=wg; c.fillRect(0,GY-34,W,34); }
  // 地面：草皮＋泥土層＋小石頭與花
  const gg=c.createLinearGradient(0,GY,0,H); gg.addColorStop(0,T[2]); gg.addColorStop(1,shd(T[3],-.25)); c.fillStyle=gg; c.fillRect(0,GY,W,H-GY);
  c.fillStyle=T[3]; c.fillRect(0,GY,W,4); c.fillStyle='rgba(0,0,0,.1)'; for(let x=0;x<W;x+=9){ c.beginPath(); c.ellipse(x+(x*13)%7,GY+12+(x*7)%18,3+(x%3),1.6,0,0,TAU); c.fill(); }
  if(['meadow','forest','castle','night','dark'].includes(th)){ for(let x=0;x<W;x+=4){ const h=4+((x*31)%7); c.strokeStyle=night?'rgba(60,110,80,.9)':(x%3?'#5ab040':'#7ad058'); c.lineWidth=1.4; c.beginPath(); c.moveTo(x,GY+2); c.lineTo(x+((x*7)%5-2),GY-h); c.stroke(); } if(!night) for(let x=20;x<W;x+=53){ c.fillStyle=['#ff6a8a','#ffd23f','#fff','#b48aff'][(x/53|0)%4]; c.beginPath(); c.arc(x+(x*3)%17,GY-4,2.4,0,TAU); c.fill(); } }
  if(th==='snow'||th==='ice'){ c.fillStyle='rgba(255,255,255,.9)'; for(let x=0;x<W;x+=26){ c.beginPath(); c.ellipse(x,GY+1,16,4,0,0,TAU); c.fill(); } }
  if(th==='desert'||th==='canyon'||th==='beach'){ c.fillStyle='rgba(255,255,255,.18)'; for(let x=0;x<W;x+=30){ c.beginPath(); c.ellipse(x+(x*7)%11,GY+20+(x*3)%14,10,1.4,0,0,TAU); c.fill(); } }
  if(th==='volcano'){ c.fillStyle='rgba(255,90,30,.5)'; for(let x=0;x<W;x+=70){ c.beginPath(); c.ellipse(x+20,GY+18+(x*7)%10,16,3,0,0,TAU); c.fill(); } }
  return BGC[th]=k; }
function sky(c,th,t,ww){ c.drawImage(bgStatic(th),0,0,W,H); const night=th==='night'||th==='dark'||th==='volcano';
  if(night){ c.fillStyle='#fff'; for(let i=0;i<70;i++){ c.globalAlpha=.25+.65*Math.abs(Math.sin(t*.8+i*1.7)); const s=i%7===0?2.2:1.3; c.fillRect((i*137)%W,(i*71)%(GY*.55),s,s); } c.globalAlpha=1; }
  else { for(let i=0;i<5;i++){ const x=((i*190+t*(5+i))%(W+260))-130,y=36+(i*37)%95,s=.8+(i%3)*.25; c.fillStyle='rgba(180,200,230,.35)'; c.beginPath(); c.ellipse(x+4,y+8,48*s,12*s,0,0,TAU); c.fill(); c.fillStyle='rgba(255,255,255,.95)'; c.beginPath(); c.ellipse(x,y,46*s,13*s,0,0,TAU); c.ellipse(x+24*s,y-10*s,26*s,15*s,0,0,TAU); c.ellipse(x-20*s,y-6*s,22*s,12*s,0,0,TAU); c.fill(); }
    if(th!=='sky'&&th!=='snow') for(let i=0;i<3;i++){ const bx=((t*28+i*260)%(W+100))-50,by=110+i*24+Math.sin(t*2+i)*6,f=Math.sin(t*9+i)*4; c.strokeStyle='rgba(40,40,60,.6)'; c.lineWidth=1.6; c.beginPath(); c.moveTo(bx-7,by-f); c.quadraticCurveTo(bx-3,by-3,bx,by); c.quadraticCurveTo(bx+3,by-3,bx+7,by-f); c.stroke(); } }
  if(th==='snow'||th==='ice'){ c.fillStyle='rgba(255,255,255,.85)'; for(let i=0;i<50;i++){ const x=((i*97+Math.sin(t+i)*20)%W+W)%W,y=((i*53+t*30)%GY); c.beginPath(); c.arc(x,y,1.2+(i%3)*.6,0,TAU); c.fill(); } }
  if(th==='forest'){ for(let i=0;i<8;i++){ const x=((i*113+t*20)%W),y=((i*67+t*26)%GY); c.save(); c.translate(x,y); c.rotate(t*2+i); c.fillStyle=i%2?'#e8a030':'#c86a2a'; c.beginPath(); c.ellipse(0,0,4,2,0,0,TAU); c.fill(); c.restore(); } }
  if(th==='volcano'){ c.fillStyle='rgba(255,110,40,'+(.5+.3*Math.sin(t*3))+')'; c.beginPath(); c.ellipse(575,GY-202,32,8,0,0,TAU); c.fill(); for(let i=0;i<14;i++){ const u=((t*.4+i/14)%1); c.fillStyle='rgba(255,'+(140+i*6)+',60,'+(1-u)+')'; c.beginPath(); c.arc(575+Math.sin(i*2.3)*u*80,GY-205-u*140,2,0,TAU); c.fill(); } }
  if(th==='beach'){ c.fillStyle='rgba(255,255,255,.7)'; for(let x=0;x<W;x+=48){ const xx=(x+t*18)%W; c.fillRect(xx,GY-28+Math.sin(t*2+x)*2,24,2); } c.fillStyle='rgba(255,255,255,.5)'; c.fillRect(0,GY-3+Math.sin(t*1.5)*1.5,W,3); }
  if(th==='dark'){ for(let i=0;i<10;i++){ const u=((t*.15+i/10)%1); c.fillStyle='rgba(200,120,255,'+(.6*(1-u))+')'; c.beginPath(); c.arc((i*83)%W,GY-u*200,2,0,TAU); c.fill(); } } }
function crack(c,w,h,seed,amt){ c.strokeStyle='rgba(30,20,10,.6)'; c.lineWidth=1.3; let s=seed; const R=()=>{ s=(s*9301+49297)%233280; return s/233280; }; for(let k=0;k<1+amt*4;k++){ let x=(R()-.5)*w,y=(R()-.5)*h; c.beginPath(); c.moveTo(x,y); for(let j=0;j<4;j++){ x+=(R()-.5)*w*.5; y+=(R()-.5)*h*.5; c.lineTo(clamp(x,-w/2,w/2),clamp(y,-h/2,h/2)); } c.stroke(); } }
function drawBlk(c,o,S,toS){ const [X,Y]=toS(o.x,o.y),w=o.w*S,h=o.h*S,M=MAT[o.m],r=Math.min(3,w*.15,h*.15),L=w>=h; c.save(); c.translate(X,Y); c.rotate(-o.a);
  c.fillStyle='rgba(0,0,0,.18)'; rr(c,-w/2+2,-h/2+3,w,h,r); c.fill();
  if(o.m==='wood'){ const g=L?c.createLinearGradient(0,-h/2,0,h/2):c.createLinearGradient(-w/2,0,w/2,0); g.addColorStop(0,'#e0a560'); g.addColorStop(.5,'#c98a45'); g.addColorStop(1,'#9a6430'); c.fillStyle=g; rr(c,-w/2,-h/2,w,h,r); c.fill();
    c.save(); rr(c,-w/2,-h/2,w,h,r); c.clip(); c.strokeStyle='rgba(110,60,20,.4)'; c.lineWidth=1; const n=Math.max(2,Math.round((L?h:w)/5)); for(let k=1;k<n;k++){ c.beginPath(); if(L){ const yy=-h/2+k*h/n; c.moveTo(-w/2,yy); c.bezierCurveTo(-w/6,yy-1.5,w/6,yy+1.5,w/2,yy); } else { const xx=-w/2+k*w/n; c.moveTo(xx,-h/2); c.bezierCurveTo(xx+1.5,-h/6,xx-1.5,h/6,xx,h/2); } c.stroke(); }
    c.fillStyle='rgba(110,60,20,.35)'; const kx=((o.id*37)%60/60-.5)*w*.6,ky=((o.id*53)%60/60-.5)*h*.5; c.beginPath(); c.ellipse(kx,ky,Math.min(w,h)*.16,Math.min(w,h)*.1,L?0:Math.PI/2,0,TAU); c.fill(); c.restore();
    c.fillStyle='#6a6a74'; for(const d of [-1,1]){ const nx=L?d*(w/2-4):0,ny=L?0:d*(h/2-4); c.beginPath(); c.arc(nx,ny,1.4,0,TAU); c.fill(); }
    c.strokeStyle='#7a4a1e'; c.lineWidth=1.4; rr(c,-w/2,-h/2,w,h,r); c.stroke(); c.fillStyle='rgba(255,235,190,.45)'; c.fillRect(-w/2+2,-h/2+1.5,w-4,1.5); }
  else if(o.m==='stone'){ const g=c.createLinearGradient(0,-h/2,0,h/2); g.addColorStop(0,'#b8bec6'); g.addColorStop(1,'#80868e'); c.fillStyle=g; rr(c,-w/2,-h/2,w,h,r); c.fill();
    c.save(); rr(c,-w/2,-h/2,w,h,r); c.clip(); c.strokeStyle='rgba(60,64,72,.45)'; c.lineWidth=1.2; const bh=Math.max(7,Math.min(h,12)),bw=bh*1.8; for(let yy=-h/2,row=0;yy<h/2;yy+=bh,row++){ c.beginPath(); c.moveTo(-w/2,yy); c.lineTo(w/2,yy); c.stroke(); for(let xx=-w/2+(row%2?bw/2:0);xx<w/2;xx+=bw){ c.beginPath(); c.moveTo(xx,yy); c.lineTo(xx,yy+bh); c.stroke(); c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(xx+1,yy+1,bw-2,1.5); } }
    if(o.id%3===0){ c.fillStyle='rgba(90,150,70,.55)'; c.beginPath(); c.ellipse(-w*.3,-h/2+2,w*.2,3,0,0,TAU); c.fill(); } c.restore();
    c.strokeStyle='#5a606a'; c.lineWidth=1.6; rr(c,-w/2,-h/2,w,h,r); c.stroke(); }
  else { const g=c.createLinearGradient(-w/2,-h/2,w/2,h/2); g.addColorStop(0,'rgba(220,245,255,.92)'); g.addColorStop(.5,'rgba(150,210,250,.78)'); g.addColorStop(1,'rgba(110,180,235,.85)'); c.fillStyle=g; rr(c,-w/2,-h/2,w,h,r); c.fill();
    c.save(); rr(c,-w/2,-h/2,w,h,r); c.clip(); c.strokeStyle='rgba(255,255,255,.55)'; c.lineWidth=1; c.beginPath(); c.moveTo(-w/2,h*.1); c.lineTo(-w*.1,-h/2); c.moveTo(w*.1,h/2); c.lineTo(w/2,-h*.1); c.stroke(); c.fillStyle='rgba(255,255,255,.6)'; c.beginPath(); c.moveTo(-w/2+2,-h/2+2); c.lineTo(-w/2+2+Math.min(w,h)*.55,-h/2+2); c.lineTo(-w/2+2,-h/2+2+Math.min(w,h)*.55); c.fill(); c.fillStyle='rgba(255,255,255,.25)'; for(let k=0;k<3;k++){ c.beginPath(); c.arc(((o.id*17+k*29)%100/100-.5)*w*.7,((o.id*23+k*41)%100/100-.5)*h*.6,1.5,0,TAU); c.fill(); } c.restore();
    c.strokeStyle='#5aa8d8'; c.lineWidth=1.5; rr(c,-w/2,-h/2,w,h,r); c.stroke(); }
  if(o.hr<.75) crack(c,w,h,o.id*7+3,1-o.hr); c.restore(); }
function drawSlime(c,o,S,toS,t){ const [X,Y]=toS(o.x,o.y),r=o.r*S,sq=1+Math.sin(t*4+o.id)*.06,hurt=o.hr<.7,blink=Math.sin(t*1.3+o.id*2.1)>.97; c.save(); c.translate(X,Y); c.rotate(-o.a*.3);
  c.fillStyle='rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(0,r*.95,r*.95,r*.2,0,0,TAU); c.fill();
  const c0=o.king?'#e0b8ff':o.helm?'#c8f0a0':'#c6f88a',c1=o.king?'#7a3ac8':'#3e9a28';
  const g=c.createRadialGradient(-r*.35,-r*.45,r*.08,0,r*.1,r*1.15); g.addColorStop(0,c0); g.addColorStop(.6,o.king?'#a86ae8':'#6ac840'); g.addColorStop(1,c1); c.fillStyle=g; c.beginPath(); c.moveTo(-r*1.05*sq,r*.9); c.bezierCurveTo(-r*1.15*sq,-r*.2,-r*.6,-r*.98/sq,0,-r*.98/sq); c.bezierCurveTo(r*.6,-r*.98/sq,r*1.15*sq,-r*.2,r*1.05*sq,r*.9); c.quadraticCurveTo(0,r*1.05,-r*1.05*sq,r*.9); c.fill();
  c.strokeStyle=o.king?'#3a1a5a':'#245018'; c.lineWidth=2; c.stroke();
  c.fillStyle='rgba(255,255,255,.65)'; c.beginPath(); c.ellipse(-r*.42,-r*.5,r*.24,r*.13,-.6,0,TAU); c.fill(); c.beginPath(); c.arc(-r*.12,-r*.7,r*.06,0,TAU); c.fill(); c.fillStyle='rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(r*.5,r*.35,r*.2,r*.3,.4,0,TAU); c.fill();
  if(o.king){ c.fillStyle='#ffd23f'; c.beginPath(); c.moveTo(-r*.55,-r*.8); c.lineTo(-r*.6,-r*1.3); c.lineTo(-r*.28,-r*1.02); c.lineTo(0,-r*1.42); c.lineTo(r*.28,-r*1.02); c.lineTo(r*.6,-r*1.3); c.lineTo(r*.55,-r*.8); c.closePath(); c.fill(); c.strokeStyle='#8a6a10'; c.lineWidth=1.5; c.stroke(); c.fillStyle='#ff4a6a'; c.beginPath(); c.arc(0,-r*.95,r*.08,0,TAU); c.fill(); c.fillStyle='#4ac8ff'; c.beginPath(); c.arc(-r*.32,-r*.9,r*.06,0,TAU); c.arc(r*.32,-r*.9,r*.06,0,TAU); c.fill(); }
  else if(o.helm){ const hg=c.createLinearGradient(0,-r*1.1,0,-r*.4); hg.addColorStop(0,'#e8ecf4'); hg.addColorStop(1,'#8a90a0'); c.fillStyle=hg; c.beginPath(); c.arc(0,-r*.42,r*.78,Math.PI,0); c.lineTo(r*.86,-r*.36); c.lineTo(-r*.86,-r*.36); c.closePath(); c.fill(); c.strokeStyle='#4a505c'; c.lineWidth=1.5; c.stroke(); c.fillStyle='#c83a3a'; c.fillRect(-r*.08,-r*1.28,r*.16,r*.3); c.fillStyle='rgba(255,255,255,.6)'; c.fillRect(-r*.5,-r*.92,r*.24,r*.08); c.fillStyle='#6a707c'; for(const d of [-1,0,1]){ c.beginPath(); c.arc(d*r*.45,-r*.45,r*.05,0,TAU); c.fill(); } }
  else { c.fillStyle='#2f5a22'; for(const d of [-1,1]){ c.beginPath(); c.moveTo(d*r*.32,-r*.84); c.quadraticCurveTo(d*r*.5,-r*1.3,d*r*.7,-r*1.18); c.quadraticCurveTo(d*r*.58,-r*.98,d*r*.62,-r*.74); c.fill(); } }
  c.fillStyle='#fff'; for(const d of [-1,1]){ c.beginPath(); c.ellipse(d*r*.33,-r*.1,r*.23,blink?r*.04:r*.27,0,0,TAU); c.fill(); }
  c.fillStyle='#1a1a1a'; if(!blink) for(const d of [-1,1]){ if(hurt){ c.lineWidth=2; c.strokeStyle='#1a1a1a'; c.beginPath(); c.moveTo(d*r*.33-r*.12,-r*.2); c.lineTo(d*r*.33+r*.12,-r*.02); c.moveTo(d*r*.33+r*.12,-r*.2); c.lineTo(d*r*.33-r*.12,-r*.02); c.stroke(); } else { c.beginPath(); c.arc(d*r*.28,-r*.06,r*.12,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(d*r*.28-r*.04,-r*.11,r*.045,0,TAU); c.fill(); c.fillStyle='#1a1a1a'; } }
  c.strokeStyle='#1a1a1a'; c.lineWidth=2.4; c.lineCap='round'; for(const d of [-1,1]){ c.beginPath(); c.moveTo(d*r*.12,-r*.4); c.lineTo(d*r*.56,-r*.5); c.stroke(); }
  c.lineWidth=1.8; c.fillStyle='#5a1a1a'; c.beginPath(); c.moveTo(-r*.28,r*.3); c.quadraticCurveTo(0,r*(hurt?.2:.56),r*.28,r*.3); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#fff'; c.beginPath(); c.moveTo(-r*.16,r*.32); c.lineTo(-r*.09,r*.43); c.lineTo(-r*.02,r*.33); c.fill(); c.beginPath(); c.moveTo(r*.06,r*.33); c.lineTo(r*.13,r*.42); c.lineTo(r*.2,r*.32); c.fill();
  if(hurt){ c.fillStyle='rgba(120,200,255,.85)'; c.beginPath(); c.moveTo(r*.75,-r*.5); c.quadraticCurveTo(r*.92,-r*.2,r*.75,-r*.15); c.quadraticCurveTo(r*.58,-r*.2,r*.75,-r*.5); c.fill(); }
  c.restore(); }
function fluff(c,X,Y,r,type,a,t,o){ o=o||{}; const A=AMMO[type]; c.save(); c.translate(X,Y);
  if(o.ground){ c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0,r*.95,r*.8,r*.18,0,0,TAU); c.fill(); }
  c.rotate(a); const dk=shd(A.c,-.35),lt=shd(A.c,.3);
  c.fillStyle=dk; c.beginPath(); for(let k=0;k<26;k++){ const an=k/26*TAU,rr2=r*(k%2?1.16:.98); k?c.lineTo(Math.cos(an)*rr2,Math.sin(an)*rr2):c.moveTo(Math.cos(an)*rr2,Math.sin(an)*rr2); } c.closePath(); c.fill();
  const g=c.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r*1.05); g.addColorStop(0,lt); g.addColorStop(.7,A.c); g.addColorStop(1,dk); c.fillStyle=g; c.beginPath(); for(let k=0;k<26;k++){ const an=k/26*TAU+.12,rr2=r*(k%2?1.05:.9); k?c.lineTo(Math.cos(an)*rr2,Math.sin(an)*rr2):c.moveTo(Math.cos(an)*rr2,Math.sin(an)*rr2); } c.closePath(); c.fill();
  c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=1.2; for(let k=0;k<7;k++){ const an=k*.9+.4; c.beginPath(); c.moveTo(Math.cos(an)*r*.45,Math.sin(an)*r*.45); c.lineTo(Math.cos(an+.15)*r*.8,Math.sin(an+.15)*r*.8); c.stroke(); }
  c.strokeStyle='rgba(20,10,30,.55)'; c.lineWidth=1.4; c.beginPath(); for(let k=0;k<26;k++){ const an=k/26*TAU,rr2=r*(k%2?1.16:.98); k?c.lineTo(Math.cos(an)*rr2,Math.sin(an)*rr2):c.moveTo(Math.cos(an)*rr2,Math.sin(an)*rr2); } c.closePath(); c.stroke();
  c.rotate(-a); if(type==='black'){ c.strokeStyle='#8a6a40'; c.lineWidth=2; c.beginPath(); c.moveTo(r*.2,-r*.9); c.quadraticCurveTo(r*.5,-r*1.4,r*.8,-r*1.3); c.stroke(); c.fillStyle=Math.sin(t*30)>0?'#ffd23f':'#ff6a2a'; c.beginPath(); c.arc(r*.82,-r*1.32,r*.18,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(r*.82,-r*1.32,r*.07,0,TAU); c.fill(); }
  if(type==='yellow'){ c.fillStyle='#fff6a0'; c.strokeStyle='#c89a10'; c.lineWidth=1; c.beginPath(); c.moveTo(-r*.1,-r*1.05); c.lineTo(-r*.38,-r*.6); c.lineTo(-r*.14,-r*.62); c.lineTo(-r*.3,-r*.28); c.lineTo(r*.14,-r*.74); c.lineTo(-r*.08,-r*.72); c.closePath(); c.fill(); c.stroke(); }
  if(type==='blue'){ c.fillStyle='#bfe4ff'; for(const d of [-1,0,1]){ c.beginPath(); c.arc(d*r*.3,-r*.9-Math.abs(d)*-r*.08,r*.12,0,TAU); c.fill(); } }
  if(type==='red'){ c.fillStyle=dk; c.beginPath(); c.moveTo(-r*.1,-r*.95); c.quadraticCurveTo(-r*.2,-r*1.35,r*.15,-r*1.3); c.quadraticCurveTo(0,-r*1.1,r*.1,-r*.92); c.fill(); }
  c.fillStyle='#fff'; for(const d of [-1,1]){ c.beginPath(); c.ellipse(d*r*.3,-r*.05,r*.26,r*.31,0,0,TAU); c.fill(); c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=1; c.stroke(); } c.fillStyle='#1a1420'; for(const d of [-1,1]){ c.beginPath(); c.arc(d*r*.3+(o.fly?r*.09:0),-r*.02,r*.14,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(d*r*.3-r*.04+(o.fly?r*.09:0),-r*.08,r*.055,0,TAU); c.fill(); c.fillStyle='#1a1420'; }
  c.strokeStyle='#1a1420'; c.lineWidth=2.2; c.lineCap='round'; for(const d of [-1,1]){ c.beginPath(); c.moveTo(d*r*.1,-r*.42); c.lineTo(d*r*.52,-r*.34+(o.fly?-r*.12:0)); c.stroke(); }
  c.lineWidth=1.6; c.beginPath(); if(o.fly){ c.fillStyle='#8a2a3a'; c.ellipse(0,r*.44,r*.16,r*.13,0,0,TAU); c.fill(); } else { c.arc(0,r*.3,r*.17,.3,Math.PI-.3); c.stroke(); }
  c.fillStyle='rgba(255,120,140,.55)'; c.beginPath(); c.ellipse(-r*.58,r*.24,r*.13,r*.08,0,0,TAU); c.ellipse(r*.58,r*.24,r*.13,r*.08,0,0,TAU); c.fill();
  if(o.ground){ c.fillStyle=dk; for(const d of [-1,1]){ c.beginPath(); c.ellipse(d*r*.38,r*.98,r*.2,r*.1,0,0,TAU); c.fill(); } }
  c.restore(); }
function slingshot(c,X,Y,S,flip,back){ c.save(); c.translate(X,Y); c.scale(flip?-1:1,1); c.lineCap='round'; c.lineJoin='round';
  const arm=(dx)=>{ c.strokeStyle='#4a2a14'; c.lineWidth=S*.36; c.beginPath(); c.moveTo(0,-S*1.55); c.quadraticCurveTo(dx*S*.15,-S*2.3,dx*S*.48,-S*2.95); c.stroke(); c.strokeStyle='#8a5a2a'; c.lineWidth=S*.22; c.beginPath(); c.moveTo(0,-S*1.55); c.quadraticCurveTo(dx*S*.15,-S*2.3,dx*S*.48,-S*2.95); c.stroke(); c.strokeStyle='rgba(255,220,170,.35)'; c.lineWidth=S*.06; c.beginPath(); c.moveTo(-S*.04,-S*1.6); c.quadraticCurveTo(dx*S*.12-S*.05,-S*2.3,dx*S*.44-S*.05,-S*2.9); c.stroke(); c.fillStyle='#3a2010'; c.beginPath(); c.arc(dx*S*.48,-S*2.95,S*.14,0,TAU); c.fill(); };
  if(back){ c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0,0,S*.6,S*.14,0,0,TAU); c.fill(); c.strokeStyle='#4a2a14'; c.lineWidth=S*.42; c.beginPath(); c.moveTo(0,0); c.lineTo(0,-S*1.6); c.stroke(); c.strokeStyle='#8a5a2a'; c.lineWidth=S*.28; c.beginPath(); c.moveTo(0,-S*.05); c.lineTo(0,-S*1.6); c.stroke(); c.strokeStyle='rgba(60,30,10,.6)'; c.lineWidth=1; for(let k=0;k<5;k++){ c.beginPath(); c.moveTo(-S*.1,-S*(.2+k*.28)); c.lineTo(S*.1,-S*(.3+k*.28)); c.stroke(); } arm(-1); }
  else { arm(1); c.fillStyle='#c83a3a'; for(let k=0;k<4;k++){ c.fillRect(-S*.2,-S*(1.25+k*.1),S*.4,S*.06); } c.fillStyle='rgba(0,0,0,.25)'; c.fillRect(-S*.2,-S*1.3,S*.4,S*.04); } c.restore(); }

function create(env,opts){
  const PL=window.planck,Vec2=PL.Vec2,net=opts.net,host=!!net&&net.host,client=!!net&&!net.host,pv=!!opts.preview;
  const mode=net?'net':opts.mode||'1p',duel=mode!=='1p',si=clamp(opts.stage|0,0,STAGES.length-1),ST=STAGES[si],th=duel?['meadow','desert','snow','beach','night','canyon','castle','volcano','sky','dark','forest','ice'][si]||ST.th:ST.th;
  const WW=duel?44:28.6,S=W/WW,toS=(x,y)=>[x*S,GY-y*S],toW=(X,Y)=>[X/S,(GY-Y)/S];
  const SL=[[duel?3:4,0],[44-3,0]],POUCH=s=>[SL[s][0]+(s?-.15:.15),duel?2.55:2.95];
  const MAXP=duel?2.4:2.5,KV=duel?8.4:7.4;
  const {ctx:c,canvas}=env.canvas2d(W,H); canvas.style.touchAction='none'; const sfx=k=>{ if(!pv) env.sfx(k); };
  const names=net?net.names.map((n,i)=>n||('玩家 '+(i+1))):mode==='2p'?['1P','2P']:mode==='cpu'?[opts.name||'你','電腦']:[opts.name||'你'];
  let world=null,bodies=[],uid=0,acc=0,t=0,ended=false,fx=[],pops=[],shake=0,trail=[],lastTrail=[],kill=[],score=0,armed=true,aim=null,flyT=0,live=[],turn=0,shots=[0,0],ammoI=0,phase='intro',PT=pv?.3:1.6,ban=null,evq=[],snap=null,sendT=0,cpuT=0,ammoT=duel?pick(['red','blue','yellow','black']):ST.am[0],winSide=-1;
  const say=(txt,col)=>{ ban={txt,col:col||'#ffd23f',t:0}; };
  /* ---- 物理世界（連線的客人不算物理，只畫房主送來的畫面） ---- */
  if(!client){ world=PL.World({gravity:Vec2(0,-10)}); const g=world.createBody(); g.createFixture(PL.Edge(Vec2(-30,0),Vec2(WW+30,0)),{friction:.9});
    for(const o of specOf(si,duel)){ let b; if(o.k==='blk'){ b=world.createBody({type:'dynamic',position:Vec2(o.x,o.y),angle:o.a}); b.createFixture(PL.Box(o.w/2,o.h/2),{density:MAT[o.m].d,friction:.75,restitution:.05}); b.setUserData({k:'blk',m:o.m,w:o.w,h:o.h,hp:MAT[o.m].hp*(o.w*o.h>1?1.6:1),max:MAT[o.m].hp*(o.w*o.h>1?1.6:1),id:uid++}); }
      else { b=world.createBody({type:'dynamic',position:Vec2(o.x,o.y),angularDamping:2}); b.createFixture(PL.Circle(o.r),{density:.9,friction:.6,restitution:.15}); const hp=(o.king?4.5:1.6)*(o.helm?1.8:1)*(duel?3:1+ST.k*.6); b.setUserData({k:'slm',r:o.r,king:o.king,helm:o.helm,hp,max:hp,id:uid++,side:duel?(o.x<WW/2?0:1):1}); } bodies.push(b); }
    let armedHit=false; world.on('post-solve',(ct,imp)=>{ if(!armedHit) return; const ni=Math.max(imp.normalImpulses[0]||0,imp.normalImpulses[1]||0); const A=ct.getFixtureA().getBody(),Bb=ct.getFixtureB().getBody(),ua=A.getUserData(),ub=Bb.getUserData();
      const ammoHit=(ua&&ua.k==='ammo')||(ub&&ub.k==='ammo'),th0=ammoHit?.35:1.2; if(ni<th0) return; for(const [u,o] of [[ua,ub],[ub,ua]]){ if(!u||u.hp==null) continue; const am=o&&o.k==='ammo'; let d=am?ni*(o.type==='yellow'?.42:o.type==='black'?.2:.3):ni*(u.k==='slm'?(duel?.12:.6):.12); /* 毛球撞擊：木頭一下就破、石頭要黃毛球或炸彈；方塊互撞只會小小損傷，壓到史萊姆就有傷害 */ if(am&&u.k==='slm') d*=1.2; u.hp-=d; } });
    world.on('begin-contact',ct=>{ for(const f of [ct.getFixtureA(),ct.getFixtureB()]){ const u=f.getBody().getUserData(); if(u&&u.k==='ammo'&&!u.hit){ u.hit=true; if(u.type==='black') u.fuse=.55; } } });
    for(let k=0;k<150;k++) world.step(1/60,8,3); /* 先讓城堡站穩 */ armedHit=true; window.__slingArm=()=>{ armedHit=true; }; }
  const slimes=s=>bodies.filter(b=>{ const u=b.getUserData(); return u.k==='slm'&&(s==null||u.side===s); });
  function addFx(k,x,y,o){ fx.push(Object.assign({k,x,y,t:0},o||{})); if(host) evq.push([k,+(x.toFixed(2)),+(y.toFixed(2)),o&&o.m||'']); }
  function burst(x,y,m,n){ for(let i=0;i<(n||10);i++){ const a=Math.random()*TAU,v=1+Math.random()*4; fx.push({k:'chip',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v+2,t:0,m,rot:Math.random()*6,sz:.08+Math.random()*.14}); } fx.push({k:'puff',x,y,t:0}); }
  function destroyB(b,why){ const u=b.getUserData(),p=b.getPosition(); if(u.dead) return; u.dead=true; kill.push(b);
    if(u.k==='blk'){ burst(p.x,p.y,u.m,10); addFx('pop',p.x,p.y,{m:u.m}); const sc=MAT[u.m].sc; if(!duel){ score+=sc; pops.push({x:p.x,y:p.y,t:0,s:'+'+sc}); } sfx(u.m==='ice'?'pop':'bump'); }
    else if(u.k==='slm'){ burst(p.x,p.y,'slime',14); addFx('poof',p.x,p.y,{m:'slime'}); if(!duel){ score+=u.king?3000:1000; pops.push({x:p.x,y:p.y,t:0,s:'+'+(u.king?3000:1000),big:1}); } shake=Math.max(shake,.25); sfx('item'); } }
  function explode(b){ const p=b.getPosition(),R=3.2; addFx('boom',p.x,p.y); shake=.6; sfx('boom'); for(const o of bodies){ const u=o.getUserData(); if(u.dead||o===b) continue; const q=o.getPosition(),dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy); if(d>R) continue; const f=(1-d/R); o.applyLinearImpulse(Vec2(dx/(d||1)*f*28*o.getMass()**.5,dy/(d||1)*f*28*o.getMass()**.5+f*6),q,true); if(u.hp!=null) u.hp-=f*12; } destroyB(b); }
  function launch(s,vx,vy,type){ const [px,py]=POUCH(s),A=AMMO[type],b=world.createBody({type:'dynamic',position:Vec2(px,py),bullet:true,angularDamping:.6}); b.createFixture(PL.Circle(A.r),{density:A.d,friction:.6,restitution:.3}); b.setLinearVelocity(Vec2(vx,vy)); b.setUserData({k:'ammo',type,r:A.r,id:uid++,split:type!=='blue',side:s}); bodies.push(b); live=[b]; flyT=0; trail=[]; armed=false; phase='fly'; sfx('throw'); shots[s]++; }
  function split(b){ const u=b.getUserData(); u.split=true; const p=b.getPosition(),v=b.getLinearVelocity(); for(const da of [-.22,.22]){ const ca=Math.cos(da),sa=Math.sin(da),n=world.createBody({type:'dynamic',position:Vec2(p.x,p.y+da),bullet:true}); n.createFixture(PL.Circle(.36),{density:3,friction:.6,restitution:.3}); n.setLinearVelocity(Vec2(v.x*ca-v.y*sa,v.x*sa+v.y*ca)); n.setUserData({k:'ammo',type:'blue',r:.36,id:uid++,split:true,side:u.side}); bodies.push(n); live.push(n); } addFx('spark',p.x,p.y); sfx('pop'); }
  function stepWorld(dt){ acc+=Math.min(dt,.1); let n=0; while(acc>=1/60&&n<5){ acc-=1/60; n++; world.step(1/60,8,3);
      for(const b of bodies){ const u=b.getUserData(); if(u.dead) continue; const p=b.getPosition(); if(p.y<-4||p.x<-6||p.x>WW+6){ if(u.k==='ammo'){ u.dead=true; kill.push(b); } else destroyB(b); continue; } if(u.hp!=null&&u.hp<=0) destroyB(b);
        if(u.k==='ammo'){ if(!u.split&&!u.hit&&b.getLinearVelocity().y<0) split(b); if(u.fuse!=null){ u.fuse-=1/60; if(u.fuse<=0){ u.fuse=null; explode(b); } } } }
      for(const b of kill){ const i=bodies.indexOf(b); if(i>=0) bodies.splice(i,1); world.destroyBody(b); } kill=[]; } }
  const settled=()=>bodies.every(b=>{ const u=b.getUserData(); if(u.k==='ammo') return b.getLinearVelocity().length()<.25; return !b.isAwake()||b.getLinearVelocity().length()<.12; });
  /* ---- 回合 ---- */
  function nextShot(){ for(const b of bodies.slice()){ const u=b.getUserData(); if(u.k==='ammo'){ const p=b.getPosition(); fx.push({k:'puff',x:p.x,y:p.y,t:0}); u.dead=true; bodies.splice(bodies.indexOf(b),1); world.destroyBody(b); } } lastTrail=trail.slice(); live=[];
    if(!duel){ if(!slimes().length){ win(); return; } ammoI++; if(ammoI>=ST.am.length){ lose(); return; } ammoT=ST.am[ammoI]; phase='aim'; armed=true; return; }
    const a0=slimes(0).length,a1=slimes(1).length; if(!a0||!a1||(shots[0]>=10&&shots[1]>=10)){ winSide=a0===a1?-1:a0>a1?0:1; endDuel(); return; }
    turn=1-turn; ammoT=pick(['red','red','blue','yellow','black']); phase='aim'; armed=true; cpuT=1.2; say(names[turn]+(turn===0?'（左）':'（右）')+' 發射！',turn?'#ff9a6a':'#7ae8ff'); if(host) push(true); }
  function win(){ phase='done'; const left=Math.max(0,ST.am.length-ammoI-1); score+=left*2000; const stars=1+(left>=1?1:0)+(left>=2?1:0); sfx('win'); say('全部消滅！');
    const k='arcade.sling.s.'+si; if(stars>(+LS(k)||0)) LS(k,stars); const kb='arcade.sling.b.'+si; if(score>(+LS(kb)||0)) LS(kb,score);
    later(()=>{ if(ended) return; ended=true; env.end({title:'城堡攻下了！',big:'★'.repeat(stars)+'☆'.repeat(3-stars),text:ST.n+'：'+score+' 分'+(left?'（剩 '+left+' 顆毛球 +'+left*2000+'）':''),score,next:si<STAGES.length-1}); },1.6); }
  function lose(){ phase='done'; let wait=0; /* 城堡可能還在倒：多等一下，最後一隻被壓死也算過關 */ const chk=()=>{ if(ended) return; if(!slimes().length){ win(); return; } wait+=.5; if(wait<3&&!settled()){ later(chk,.5); return; } sfx('lose'); const n=slimes().length; later(()=>{ if(ended) return; if(!slimes().length){ win(); return; } ended=true; env.end({title:'毛球用完了',big:'還剩 '+n+' 隻史萊姆',text:'試試打城堡的支柱，或用炸彈毛球炸開石頭。'}); },1.4); }; later(chk,.5); }
  function endDuel(){ phase='done'; if(host) push(true); const me=net?net.me:0,txt=winSide<0?'平手！':names[winSide]+' 贏了！'; sfx(winSide<0||(mode==='2p')||winSide===me?'win':'lose'); later(()=>{ if(ended) return; ended=true; env.end({title:txt,big:slimesN(0)+' ： '+slimesN(1),text:'剩下的史萊姆數（左：右）'}); },1.5); }
  const slimesN=s=>client&&snap?snap.it.filter(o=>o[0]===1&&o[8]===s).length:slimes(s).length;
  /* ---- 電腦瞄準：只算拋物線，找最接近目標的角度與力道，再加上誤差 ---- */
  function aiShot(s){ const tg=slimes(1-s); if(!tg.length) return [s?-10:10,6]; const T=pick(tg).getPosition(),[px,py]=POUCH(s); let best=null;
    for(let an=8;an<=78;an+=2) for(let pw=.45;pw<=1.001;pw+=.05){ const a=an*Math.PI/180,v=pw*MAXP*KV,vx=Math.cos(a)*v*(s?-1:1),vy=Math.sin(a)*v; let d=1e9; for(let k=1;k<120;k++){ const tt=k*.04,x=px+vx*tt,y=py+vy*tt-5*tt*tt; if(y<-1) break; d=Math.min(d,Math.hypot(x-T.x,y-T.y-.3)); } const sc=d+(an>55?.4:0); if(!best||sc<best[0]) best=[sc,vx,vy]; }
    const err=duel?(mode==='cpu'?.22-ST.k*.12:.07):.04; const a=Math.atan2(best[2],best[1])+(Math.random()-.5)*err*2,v=Math.hypot(best[1],best[2])*(1+(Math.random()-.5)*err); return [Math.cos(a)*v,Math.sin(a)*v]; }
  /* ---- 連線：房主送畫面 ---- */
  function items(){ return bodies.map(b=>{ const u=b.getUserData(),p=b.getPosition(); return u.k==='blk'?[0,+p.x.toFixed(3),+p.y.toFixed(3),+b.getAngle().toFixed(3),u.id,u.m,u.w,u.h,+(u.hp/u.max).toFixed(2)]:u.k==='slm'?[1,+p.x.toFixed(3),+p.y.toFixed(3),+b.getAngle().toFixed(3),u.id,u.r,u.king?1:0,+(u.hp/u.max).toFixed(2),u.side,u.helm?1:0]:[2,+p.x.toFixed(3),+p.y.toFixed(3),+b.getAngle().toFixed(3),u.id,u.type,u.r,u.fuse!=null?1:0]; }); }
  function push(force){ if(!host) return; net.send({s:{it:items(),turn,ammoT,phase,shots,ev:evq,aim:aim&&turn!==0?null:aim?[aim.x,aim.y]:null,ws:winSide}}); evq=[]; }
  if(net){ net.onmsg=(m,from)=>{ if(host&&m.sh&&turn===from&&phase==='aim'){ launch(from,m.sh[0],m.sh[1],ammoT); push(true); } else if(host&&m.aim&&turn===from) { remAim=m.aim; }
      else if(client&&m.s){ const old=snap; snap=m.s; for(const e of m.s.ev||[]){ if(e[0]==='pop'||e[0]==='poof'){ burst(e[1],e[2],e[3]||'wood',e[0]==='poof'?14:10); sfx(e[0]==='poof'?'item':'bump'); } else if(e[0]==='boom'){ fx.push({k:'boom',x:e[1],y:e[2],t:0}); shake=.6; sfx('boom'); } else if(e[0]==='spark') fx.push({k:'spark',x:e[1],y:e[2],t:0}); }
        if(old&&old.turn!==snap.turn&&snap.phase==='aim'){ say(names[snap.turn]+(snap.turn===0?'（左）':'（右）')+' 發射！',snap.turn?'#ff9a6a':'#7ae8ff'); lastTrail=trail.slice(); trail=[]; } if(old&&old.phase==='aim'&&snap.phase==='fly') sfx('throw');
        if(snap.phase==='done'&&!ended&&!(old&&old.phase==='done')){ winSide=snap.ws; later(()=>{ if(ended) return; ended=true; const me=net.me; env.sfx(winSide===me?'win':winSide<0?'win':'lose'); env.end({title:winSide<0?'平手！':names[winSide]+' 贏了！',big:slimesN(0)+' ： '+slimesN(1),text:'剩下的史萊姆數（左：右）'}); },1.5); } } }; net.onleave=()=>{ if(!ended&&phase!=='done'){ winSide=net.me; if(host) endDuel(); } }; }
  let remAim=null,endFn=null,endT=0; function later(f,s){ endFn=f; endT=s; }
  /* ---- 輸入：從彈弓往後拉、放開發射 ---- */
  const myTurn=()=>{ if(pv) return false; if(mode==='1p') return true; if(mode==='2p') return true; if(mode==='cpu') return turn===0; const tn=client?(snap?snap.turn:0):turn; return tn===net.me; };
  const curPhase=()=>client?(snap?snap.phase:'intro'):phase,curTurn=()=>client?(snap?snap.turn:0):turn,curAmmo=()=>client?(snap?snap.ammoT:'red'):ammoT;
  const pos=e=>{ const r=canvas.getBoundingClientRect(),k=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*k)/2)/k,(e.clientY-r.top-(r.height-H*k)/2)/k]; };
  function pullVec(X,Y){ const [wx,wy]=toW(X,Y),s=curTurn(),[px,py]=POUCH(s); let dx=px-wx,dy=py-wy; const L=Math.hypot(dx,dy); if(L>MAXP){ dx*=MAXP/L; dy*=MAXP/L; } return {dx,dy,L:Math.min(L,MAXP)}; }
  function onDown(e){ e.preventDefault(); if(curPhase()!=='aim'||!myTurn()) return; const [X,Y]=pos(e); const s=curTurn(),[sx,sy]=toS(...POUCH(s)); if(Math.hypot(X-sx,Y-sy)>Math.max(90,S*3.4)&&(s?X<W*.6:X>W*.45)) return; try{ canvas.setPointerCapture(e.pointerId); }catch(er){} aim={x:X,y:Y,ok:true}; sfx('click'); }
  function onMove(e){ if(!aim) return; const [X,Y]=pos(e); aim.x=X; aim.y=Y; }
  function onUp(){ if(!aim) return; const p=pullVec(aim.x,aim.y); aim=null; if(p.L<.35||curPhase()!=='aim') return; const vx=p.dx*KV,vy=p.dy*KV; if(client){ net.send({sh:[vx,vy]}); } else launch(curTurn(),vx,vy,ammoT); }
  if(!pv){ canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointermove',onMove); addEventListener('pointerup',onUp); }
  /* ---- 每一格 ---- */
  function update(dt){ t+=dt; if(ban) ban.t+=dt; shake=Math.max(0,shake-dt*1.5);
    if(endFn){ endT-=dt; if(endT<=0){ const f=endFn; endFn=null; f(); } }
    for(const f of fx){ f.t+=dt; if(f.k==='chip'){ f.vy-=12*dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.rot+=dt*6; if(f.y<.05){ f.y=.05; f.vy*=-.3; f.vx*=.6; } } } fx=fx.filter(f=>f.t<(f.k==='chip'?1.3:f.k==='boom'?.7:.6)); for(const p of pops) p.t+=dt; pops=pops.filter(p=>p.t<1.2);
    if(client){ return; }
    if(phase==='intro'){ PT-=dt; if(PT<=0){ phase='aim'; armed=true; cpuT=1.4; if(!duel) say(ST.n+'：消滅 '+slimes().length+' 隻史萊姆！'); else say(names[0]+'（左）先發射！','#7ae8ff'); if(host) push(true); } stepWorld(dt); return; }
    stepWorld(dt);
    if(phase==='aim'){ const bot=pv||(mode==='cpu'&&turn===1); if(bot){ cpuT-=dt; if(cpuT<=0){ const v=aiShot(duel?turn:0); launch(duel?turn:0,v[0],v[1],ammoT); } } }
    if(phase==='fly'){ flyT+=dt; for(const b of live){ const u=b.getUserData(); if(!u.dead){ const p=b.getPosition(); if(!trail.length||Math.hypot(trail[trail.length-1][0]-p.x,trail[trail.length-1][1]-p.y)>.45) trail.push([p.x,p.y]); } }
      if((flyT>2.2&&settled())||flyT>9||(!duel&&flyT>1.4&&!slimes().length)) nextShot(); }
    /* 瞄準的時候城堡才慢慢倒下、壓死最後一隻：也要馬上過關 */
    if(phase==='aim'&&!aim){ if(!duel){ if(!slimes().length) nextShot(); } else if(!slimes(0).length||!slimes(1).length) nextShot(); }
    if(host){ sendT-=dt; if(sendT<=0){ sendT=1/15; push(); } } }
  /* ---- 畫面 ---- */
  function view(){ if(client){ if(!snap) return []; return snap.it.map(o=>o[0]===0?{k:'blk',x:o[1],y:o[2],a:o[3],id:o[4],m:o[5],w:o[6],h:o[7],hr:o[8]}:o[0]===1?{k:'slm',x:o[1],y:o[2],a:o[3],id:o[4],r:o[5],king:!!o[6],hr:o[7],side:o[8],helm:!!o[9]}:{k:'ammo',x:o[1],y:o[2],a:o[3],id:o[4],type:o[5],r:o[6],fuse:o[7]}); }
    return bodies.map(b=>{ const u=b.getUserData(),p=b.getPosition(); return {k:u.k,x:p.x,y:p.y,a:b.getAngle(),id:u.id,m:u.m,w:u.w,h:u.h,hr:u.hp!=null?u.hp/u.max:1,r:u.r,king:u.king,helm:u.helm,type:u.type,fuse:u.fuse!=null,side:u.side}; }); }
  function draw(){ c.save(); c.setTransform(2,0,0,2,0,0); if(shake>0) c.translate((Math.random()-.5)*shake*14,(Math.random()-.5)*shake*14);
    sky(c,th,t,WW); const V=view(),ph=curPhase(),tn=curTurn(),am=curAmmo();
    if(client&&ph==='fly') for(const o of V) if(o.k==='ammo'){ if(!trail.length||Math.hypot(trail[trail.length-1][0]-o.x,trail[trail.length-1][1]-o.y)>.45) trail.push([o.x,o.y]); }
    c.fillStyle='rgba(255,255,255,.35)'; for(const p of lastTrail){ const [X,Y]=toS(p[0],p[1]); c.beginPath(); c.arc(X,Y,2,0,TAU); c.fill(); } c.fillStyle='rgba(255,255,255,.85)'; trail.forEach((p,i)=>{ const [X,Y]=toS(p[0],p[1]); c.beginPath(); c.arc(X,Y,i%3===0?3.2:2,0,TAU); c.fill(); });
    const sides=duel?[0,1]:[0]; for(const s of sides){ const [X,Y]=toS(SL[s][0],0); slingshot(c,X,Y,S*(duel?1.05:1),s===1,true); }
    if(!duel){ const q=ST.am.slice(ammoI+1); q.forEach((a,i)=>{ const r=AMMO[a].r*S*.85,[X,Y]=toS(3-i*1.05,0),hop=Math.max(0,Math.sin(t*3+i*1.3))*6; fluff(c,X,Y-r-hop,r,a,0,t+i,{ground:true}); }); }
    for(const o of V){ if(o.k==='blk') drawBlk(c,o,S,toS); } for(const o of V){ if(o.k==='slm') drawSlime(c,o,S,toS,t); }
    for(const o of V){ if(o.k==='ammo'){ const [X,Y]=toS(o.x,o.y); fluff(c,X,Y,o.r*S,o.type,-o.a,t,{fly:true}); } }
    // 彈弓上的毛球與橡皮筋
    for(const s of sides){ const [X0,Y0]=toS(SL[s][0],0),fs=S*(duel?1.05:1),tipA=[X0+(s?.45:-.45)*fs,Y0-2.9*fs],tipB=[X0+(s?-.45:.45)*fs,Y0-2.9*fs]; let [PX,PY]=toS(...POUCH(s));
      const loaded=ph==='aim'&&tn===s&&!(mode==='1p'&&ammoI>=ST.am.length); let A=null; if(loaded&&aim&&myTurn()){ const p=pullVec(aim.x,aim.y),[px,py]=POUCH(s); [PX,PY]=toS(px-p.dx,py-p.dy); A=p; }
      c.strokeStyle='#5a1a1a'; c.lineWidth=5; c.beginPath(); c.moveTo(...tipA); c.lineTo(PX,PY); c.stroke(); c.strokeStyle='#8a2a2a'; c.lineWidth=2.5; c.beginPath(); c.moveTo(...tipA); c.lineTo(PX,PY); c.stroke(); c.fillStyle='#6a3a1a'; c.beginPath(); c.ellipse(PX-4,PY,7,10,0,0,TAU); c.fill(); if(loaded){ const r=AMMO[am].r*S; fluff(c,PX,PY,r,am,0,t,{}); } c.strokeStyle='#5a1a1a'; c.lineWidth=5; c.beginPath(); c.moveTo(PX,PY); c.lineTo(...tipB); c.stroke(); c.strokeStyle='#8a2a2a'; c.lineWidth=2.5; c.beginPath(); c.moveTo(PX,PY); c.lineTo(...tipB); c.stroke();
      slingshot(c,X0,Y0,fs,s===1,false);
      if(A&&A.L>.35){ const [px,py]=POUCH(s),vx=A.dx*KV,vy=A.dy*KV; c.fillStyle='rgba(255,255,255,.9)'; for(let k=1;k<14;k++){ const tt=k*.07,x=px+vx*tt,y=py+vy*tt-5*tt*tt; const [X,Y]=toS(x,y); c.globalAlpha=1-k/14; c.beginPath(); c.arc(X,Y,3.4-k*.15,0,TAU); c.fill(); } c.globalAlpha=1; c.fillStyle='#fff'; c.font='900 12px '+TC; c.textAlign='center'; c.fillText(Math.round(A.L/MAXP*100)+'%',PX,PY+AMMO[am].r*S+16); } }
    // 特效
    for(const f of fx){ const [X,Y]=toS(f.x,f.y); if(f.k==='chip'){ c.save(); c.translate(X,Y); c.rotate(f.rot); c.globalAlpha=1-f.t/1.3; c.fillStyle=f.m==='slime'?'#8ad04a':MAT[f.m]?MAT[f.m].c:'#c98a45'; const s=f.sz*S; c.fillRect(-s,-s/2,s*2,s); c.restore(); c.globalAlpha=1; }
      else if(f.k==='puff'){ c.fillStyle='rgba(255,255,255,'+(.7*(1-f.t/.6))+')'; for(let k=0;k<5;k++){ c.beginPath(); c.arc(X+Math.cos(k*1.3)*f.t*40,Y+Math.sin(k*1.3)*f.t*30,8+f.t*22,0,TAU); c.fill(); } }
      else if(f.k==='boom'){ const r=(.3+f.t*3.5)*S*1.4; c.fillStyle='rgba(255,200,60,'+(1-f.t/.7)+')'; c.beginPath(); c.arc(X,Y,r,0,TAU); c.fill(); c.fillStyle='rgba(255,90,30,'+(1-f.t/.7)+')'; c.beginPath(); c.arc(X,Y,r*.65,0,TAU); c.fill(); c.strokeStyle='rgba(255,255,255,'+(1-f.t/.7)+')'; c.lineWidth=4; c.beginPath(); c.arc(X,Y,r*1.25,0,TAU); c.stroke(); }
      else if(f.k==='spark'){ c.strokeStyle='rgba(120,200,255,'+(1-f.t/.6)+')'; c.lineWidth=3; for(let k=0;k<8;k++){ const a=k/8*TAU; c.beginPath(); c.moveTo(X+Math.cos(a)*6,Y+Math.sin(a)*6); c.lineTo(X+Math.cos(a)*(10+f.t*50),Y+Math.sin(a)*(10+f.t*50)); c.stroke(); } } }
    for(const p of pops){ const [X,Y]=toS(p.x,p.y); c.globalAlpha=1-p.t/1.2; c.font='900 '+(p.big?20:14)+'px '+TC; c.textAlign='center'; c.lineWidth=4; c.strokeStyle='#14122b'; c.strokeText(p.s,X,Y-20-p.t*30); c.fillStyle=p.big?'#ffd23f':'#fff'; c.fillText(p.s,X,Y-20-p.t*30); c.globalAlpha=1; }
    hud(ph,tn,am); c.restore(); }
  function hud(ph,tn,am){ c.textBaseline='middle';
    if(!duel){ c.fillStyle='rgba(20,18,43,.78)'; rr(c,8,8,190,58,10); c.fill(); c.fillStyle='#fff'; c.font='900 13px '+TC; c.textAlign='left'; c.fillText(ST.n,18,23); c.fillStyle='#ffd23f'; c.font='900 20px '+TC; c.fillText(score+' 分',18,47);
      c.fillStyle='rgba(20,18,43,.78)'; rr(c,W-8-(ST.am.length*34+70),8,ST.am.length*34+70,40,10); c.fill(); c.fillStyle='#fff'; c.font='800 12px '+TC; c.textAlign='left'; c.fillText('毛球',W-(ST.am.length*34+70),28); ST.am.forEach((a,i)=>{ const x=W-8-ST.am.length*34+i*34+10,used=i<ammoI||(i===ammoI&&ph!=='aim'&&ph!=='intro'); c.globalAlpha=used?.25:1; fluff(c,x,28,12,a,0,t,{}); c.globalAlpha=1; });
      const sl=slimes().length; c.fillStyle='rgba(20,18,43,.78)'; rr(c,W-140,54,132,28,8); c.fill(); c.fillStyle='#b6f07a'; c.font='900 13px '+TC; c.textAlign='center'; c.fillText('史萊姆剩 '+sl+' 隻',W-74,69);
      if(ph==='aim'&&!aim){ c.fillStyle='rgba(20,18,43,.6)'; rr(c,W/2-150,H-28,300,22,8); c.fill(); c.fillStyle='#fff'; c.font='800 12px '+TC; c.fillText(AMMO[am].n+'：從彈弓往後拉、放開發射',W/2,H-17); } }
    else { for(const s of [0,1]){ const x=s?W-200:8; c.fillStyle=tn===s&&ph!=='done'?'rgba(255,210,63,.9)':'rgba(20,18,43,.78)'; rr(c,x,8,192,40,10); c.fill(); c.fillStyle=tn===s&&ph!=='done'?'#14122b':'#fff'; c.font='900 14px '+TC; c.textAlign=s?'right':'left'; c.fillText(names[s]+(s?'（右）':'（左）'),s?x+182:x+10,22); c.font='700 11px '+TC; c.fillText('史萊姆 '+slimesN(s)+'　已射 '+(client&&snap?snap.shots[s]:shots[s])+'/10',s?x+182:x+10,38); }
      if(ph==='aim'){ c.textAlign='center'; c.fillStyle='rgba(20,18,43,.78)'; rr(c,W/2-120,8,240,40,10); c.fill(); fluff(c,W/2-92,28,12,am,0,t,{}); c.fillStyle='#fff'; c.font='800 12px '+TC; c.fillText(myTurn()?AMMO[am].n+'：往後拉、放開發射':'等 '+names[tn]+' 發射…',W/2+12,28); } }
    if(ban&&ban.t<2.2){ const u=Math.min(1,ban.t*6),s=1+(1-u)*.5; c.save(); c.translate(W/2,H*.3); c.scale(s,s); c.globalAlpha=Math.min(1,(2.2-ban.t)*3); c.textAlign='center'; c.font='900 26px '+TC; c.lineWidth=7; c.strokeStyle='#14122b'; c.strokeText(ban.txt,0,0); c.fillStyle=ban.col; c.fillText(ban.txt,0,0); c.restore(); c.globalAlpha=1; } }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('pointermove',onMove); removeEventListener('pointerup',onUp); },
    _dbg:{get bodies(){return bodies;},get phase(){return phase;},get score(){return score;},get ammoI(){return ammoI;},launch:(vx,vy)=>launch(curTurn(),vx,vy,ammoT),aiShot,slimes,get turn(){return turn;},get shots(){return shots;}}};
}
/* 開始畫面／封面：照關卡設計畫靜態城堡 */
function stageShow(c,w,h,si,t){ c.save(); c.scale(w/W,h/H); const ST=STAGES[si],S=W/28.6,toS=(x,y)=>[x*S,GY-y*S]; sky(c,ST.th,t,28.6); slingshot(c,4*S,GY,S,false,true); slingshot(c,4*S,GY,S,false,false); fluff(c,4.15*S,GY-2.95*S,.5*S,ST.am[0],0,t,{});
  specOf(si,false).forEach((o,i)=>{ const v=Object.assign({id:i,hr:1,a:o.a||0},o); if(o.k==='blk') drawBlk(c,v,S,toS); }); specOf(si,false).forEach((o,i)=>{ if(o.k==='slm') drawSlime(c,Object.assign({id:i,hr:1,a:0},o),S,toS,t); });
  const u=(t*.45)%1,x=4.15+u*13,y=2.95+u*13*.9-u*u*13*.75; if(u<.95){ const [X,Y]=toS(x,y); c.fillStyle='rgba(255,255,255,.8)'; for(let k=1;k<6;k++){ const uu=u-k*.03; if(uu<0) break; const [x2,y2]=toS(4.15+uu*13,2.95+uu*13*.9-uu*uu*13*.75); c.beginPath(); c.arc(x2,y2,2.5,0,TAU); c.fill(); } fluff(c,X,Y,.5*S,ST.am[1]||'red',t*6,t,{fly:true}); } c.restore(); }
function thumb(c,w,h,t){ stageShow(c,w,h,6,t); c.save(); c.scale(w/W,h/H); c.font='900 46px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=9; c.strokeStyle='#14122b'; c.strokeText('彈弓攻城隊',W/2,70); c.fillStyle='#ffd23f'; c.fillText('彈弓攻城隊',W/2,70); c.restore(); }
const starOf=i=>+LS('arcade.sling.s.'+i)||0;
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).sling={name:'彈弓攻城隊',tag:'SLING SIEGE',color:'#ff8a3d',online:true,maxPlayers:2,
  desc:'拉開彈弓，把毛球射向木頭、冰塊、石頭搭的城堡，打垮城堡消滅壞史萊姆！四種毛球：紅色普通、藍色自動分三顆、黃色又重又猛、黑色會爆炸。50 關闖關（後面有戴頭盔的硬史萊姆），也能雙人或連線對轟。',
  goal:'闖關：用手上的毛球消滅全部史萊姆，剩越多毛球星星越多。對轟：兩邊輪流射，先把對方史萊姆全部打倒的贏。',
  stages:STAGES.map(s=>s.n),stars:STAGES.map(s=>s.stars),
  stageGoal:i=>STAGES[i].n+'：史萊姆 '+specOf(i,false).filter(o=>o.k==='slm').length+' 隻，毛球 '+STAGES[i].am.map(a=>AMMO[a].n).join('、')+'。（對轟模式用這關的場景）',
  stageLocked:i=>i>0&&!starOf(i-1),stageBest:i=>{ const s=starOf(i); return s?'★'.repeat(s)+'☆'.repeat(3-s)+'　最高 '+(+LS('arcade.sling.b.'+i)||0)+' 分':''; },
  hubBest:()=>{ let n=0,s=0; STAGES.forEach((x,i)=>{ const v=starOf(i); if(v){ n++; s+=v; } }); return n?'過關 <b>'+n+' / '+STAGES.length+'</b>　★ '+s:'尚無紀錄'; },
  modes:[{id:'1p',label:'闖關'},{id:'cpu',label:'對電腦'},{id:'2p',label:'雙人對轟'}],
  help:[['滑鼠拖曳','從彈弓往後拉，放開發射'],['白點','瞄準時會顯示一小段飛行路線'],['毛球','藍＝自動分三顆、黃＝重、黑＝撞到會爆炸']],touchHelp:[['手指拖曳','從彈弓往後拉，放開發射'],['毛球','藍＝自動分三顆、黃＝重、黑＝撞到會爆炸']],
  touch:{left:[],right:[]},livePreview:false,stageShow,thumb,load,ready:()=>!!window.planck,create};
})();
