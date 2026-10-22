// 格鬥合集：浮島大混戰（橫向平台亂鬥，把對手打出場外）、羽毛枕頭戰（俯視角枕頭大戰，比打中次數）。
// 人物共用水球炸翻天的 Q 版畫法（window.ARCADE_CHAR，所以 bomb.js 要先載入）。
// 連線：房主算全部的攻擊、命中、道具和電腦；其他人自己的移動在本機先算再送位置給房主（被打中時照房主的結果）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PIX='"Press Start 2P","Noto Sans TC",monospace';
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k,R1=v=>Math.round(v*10)/10;
const PCOL=['#ff5d4f','#4f9dff','#5fd068','#ffd23f'];
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function glow(c,x,y,r,col){ const g=c.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.fillRect(x-r,y-r,r*2,r*2); }
const colorOf=(L,i)=>!L||!L.color||L.color==='auto'?PCOL[i%4]:L.color;
// Q 版人物：dir 0 背面、1 正面、2 左、3 右；(x,y)＝腳底
function person(c,x,y,L,i,dir,moving,t,sc){ const C=window.ARCADE_CHAR; sc=sc||1;
  if(C&&C.drawChar) C.drawChar(c,x,y-15*sc,colorOf(L,i),dir,moving,t,sc,(L&&L.char)||'cap',(L&&L.deco)||'');
  else { c.fillStyle=colorOf(L,i); c.beginPath(); c.arc(x,y-14*sc,14*sc,0,7); c.fill(); } }
const LOOKS=()=>{ const C=window.ARCADE_CHAR; return [{key:'char',label:'人物',opts:[{id:'cap',label:'帽子'},{id:'cat',label:'貓耳'},{id:'bunny',label:'兔耳'},{id:'crown',label:'皇冠'},{id:'chef',label:'廚師'},{id:'pirate',label:'海盜'},{id:'ninja',label:'忍者'},{id:'bow',label:'蝴蝶結'}]},
  {key:'color',label:'人物顏色',type:'color',opts:C&&C.BODY?C.BODY:['auto','#ff5d4f','#4f9dff','#5fd068','#ffd23f','#c56bff','#ff9d3d','#3ddbd9','#ff7eb6']},
  {key:'deco',label:'擺飾',type:'multi',hint:'每一類選一個，再按一次取下',opts:[{id:'shades',label:'墨鏡',grp:'臉部'},{id:'blush',label:'腮紅',grp:'臉部'},{id:'stache',label:'八字鬍',grp:'臉部'},
    {id:'scarf',label:'圍巾',grp:'身上'},{id:'tie',label:'領結',grp:'身上'},{id:'cape',label:'披風',grp:'身上'},{id:'pack',label:'背包',grp:'身上'},{id:'halo',label:'光環',grp:'頭上'},{id:'balloon',label:'愛心氣球',grp:'頭上'},{id:'stars',label:'轉圈星星',grp:'頭上'}]}]; };
const BOTLOOK=i=>({char:['cat','bunny','chef','pirate','ninja','crown','bow','cap'][i%8],color:'auto',deco:['','shades','scarf','cape'][i%4]});
// 名單、分隊（各自分開／分隊對戰／玩家對決／玩家同隊打電腦，最多 4 人）
function roster(opts){ const net=opts.net,local2=!net&&opts.mode==='2p',humans=net?net.count:local2?2:1;
  let mode=(opts.options&&opts.options.team)||'ffa'; if(!net&&!local2) mode='ffa'; if(mode==='coop'&&humans>2) mode='vs';
  let n=net?Math.min(4,net.count+(net.bots||0)):clamp(+(opts.options&&opts.options.seats)||4,2,4); // 單機可以選 2～4 人
  if(mode==='coop') n=humans*2; else if(mode==='pvp') n=Math.max(2,humans+humans%2); else if(mode==='vs'&&n%2) n=Math.min(4,n+1);
  n=clamp(Math.max(n,humans),2,4);
  const TEAMS=mode==='coop'?[{name:'玩家隊',col:'#ffd23f'},{name:'電腦隊',col:'#a8adc0'}]:[{name:'紅隊',col:'#ff5d5d'},{name:'藍隊',col:'#4f9dff'}];
  const cnt=[0,0],team=[]; for(let i=0;i<n;i++){ let tm=null; if(mode==='coop') tm=i<humans?0:1; else if(mode==='vs'||mode==='pvp') tm=i<humans?i%2:(cnt[0]<=cnt[1]?0:1); if(tm!=null) cnt[tm]++; team.push(tm); }
  const names=[],looks=[]; for(let i=0;i<n;i++){ const h=i<humans; names.push(h?(net?(net.names&&net.names[i])||'玩家'+(i+1):local2?(i+1)+'P':opts.name||'你'):'電腦'+(i-humans+1));
    const L=h?(net?net.looks&&net.looks[i]:i===0?opts.look:null):null; looks.push(L&&Object.keys(L).length?L:h?{char:'cap',color:'auto'}:BOTLOOK(i)); }
  return {net,local2,humans,mode,n,team,TEAMS,names,looks,host:!net||net.host,me:net?net.me:0}; }
function readInput(env,i,local2,spaceAtk){ const K=env.keys,h=c=>env.hit(c); let L,R,U,D,J,A,S;
  if(local2&&i===0){ L=K.KeyA; R=K.KeyD; U=K.KeyW; D=K.KeyS; J=h('KeyW'); A=h('KeyF'); S=h('KeyG'); }
  else if(local2){ L=K.ArrowLeft; R=K.ArrowRight; U=K.ArrowUp; D=K.ArrowDown; J=h('ArrowUp'); A=h('Comma')||h('KeyK'); S=h('Period')||h('KeyL'); }
  else { L=K.ArrowLeft; R=K.ArrowRight; U=K.ArrowUp; D=K.ArrowDown; J=h('ArrowUp')||(!spaceAtk&&h('Space')); A=h('KeyX')||h('KeyJ')||(spaceAtk&&h('Space')); S=h('KeyC')||h('KeyK'); }
  return {mx:(R?1:0)-(L?1:0),my:(D?1:0)-(U?1:0),jump:!!J,atk:!!A,sp:!!S,down:!!D}; }
const NOIN={mx:0,my:0,jump:false,atk:false,sp:false,down:false};
// 開場：大箭頭標出自己
function meArrow(c,x,y,label,t){ const yy=y+Math.sin(t*8)*5; c.fillStyle='#ffd23f'; c.strokeStyle='#0b0a1c'; c.lineWidth=3; c.beginPath(); c.moveTo(x-14,yy-22); c.lineTo(x+14,yy-22); c.lineTo(x,yy); c.closePath(); c.stroke(); c.fill();
  c.font='900 18px '+TC; c.textAlign='center'; c.textBaseline='bottom'; c.lineWidth=4; c.strokeText(label,x,yy-26); c.fillText(label,x,yy-26); }
// 頒獎台
function podium(c,order,R,t,bg){ bg(); c.fillStyle='rgba(11,10,28,.45)'; c.fillRect(0,0,W,H);
  const spots=[[1,W/2,330,'#ffd23f'],[0,W/2-170,370,'#c8ccd6'],[2,W/2+170,395,'#e0905a']];
  for(const [rk,x,yTop,col] of spots){ const f=order[rk]; c.fillStyle=col; c.fillRect(x-70,yTop,140,H-yTop); c.fillStyle='#14122b'; c.font='900 30px '+PIX; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(rk+1),x,yTop+40);
    if(f){ const hop=Math.abs(Math.sin(t*5+rk))*(rk===0?14:6); person(c,x,yTop-hop,R.looks[f.i],f.i,1,false,t,rk===0?2.4:2); c.fillStyle='#fff'; c.font='900 16px '+TC; c.fillText(R.names[f.i],x,yTop+78); } }
  for(let i=0;i<60;i++){ c.fillStyle=PCOL[i%4]; c.fillRect((i*97+t*40*(i%3+1))%W,(i*53+t*120*(1+i%4))%H,6,9); } }
// 勝場紀錄：每個場地贏過就打勾
function recWin(id,stage){ try{ localStorage.setItem('arcade.'+id+'.w.'+stage,'1'); }catch(e){} }
const hasWin=(id,stage)=>{ try{ return localStorage.getItem('arcade.'+id+'.w.'+stage)==='1'; }catch(e){ return false; } };

/* =========================================================================================
   浮島大混戰：橫向平台亂鬥。被打越多下（％ 越高）飛越遠，飛出畫面外就少一條命。
   ========================================================================================= */
const SW=1000,SH=640,MAINY=440,BZ=260;
const ISLE=[
  {name:'草原浮島',stars:1,th:'grass',main:[180,640],plats:[[260,320,140],[600,320,140],[430,220,140]]},
  {name:'海灘浮島',stars:1,th:'beach',main:[150,700],plats:[[300,330,160],[550,330,160]]},
  {name:'糖果浮島',stars:1,th:'candy',main:[200,600],plats:[[230,330,120],[650,330,120],[440,250,120]]},
  {name:'森林樹頂',stars:2,th:'forest',main:[120,760],plats:[[200,340,120],[420,280,160],[680,340,120],[440,170,120]]},
  {name:'天空雲端',stars:2,th:'sky',main:[260,480],plats:[[110,360,140],[750,360,140],[430,260,140]]},
  {name:'城堡屋頂',stars:2,th:'castle',main:[200,600],plats:[[220,300,100],[680,300,100],[450,300,100]]},
  {name:'火山浮島',stars:3,th:'volcano',main:[200,600],plats:[[290,320,140],[570,320,140],[430,210,140]],hz:'lava'},
  {name:'冰雪浮島',stars:3,th:'snow',main:[180,640],plats:[[280,320,140],[580,320,140]],hz:'ice'},
  {name:'工廠輸送帶',stars:3,th:'factory',main:[160,680],plats:[[300,300,120],[580,300,120]],hz:'conveyor'},
  {name:'移動平台',stars:4,th:'tech',main:[300,400],plats:[[110,330,140,[0,90,4]],[750,330,140,[0,90,4]],[430,210,140,[170,0,6]]]},
  {name:'太空站',stars:4,th:'space',main:[220,560],plats:[[260,300,120],[620,300,120],[440,180,120]],hz:'lowg'},
  {name:'海盜船',stars:4,th:'pirate',main:[200,600],plats:[[300,270,110],[590,270,110]],hz:'cannon'},
  {name:'龍捲風峽谷',stars:5,th:'canyon',main:[180,640],plats:[[320,320,120],[560,320,120]],hz:'wind'},
  {name:'迷你小島',stars:5,th:'ocean',main:[330,340],plats:[[230,330,90],[680,330,90]]},
  {name:'彩虹天梯',stars:5,th:'rainbow',main:[390,220],plats:[[140,380,140],[720,380,140],[290,280,120],[590,280,120],[440,180,120]]}];
const ISLE_TH={grass:{sky:['#7ac8ff','#e0f4ff'],top:'#5fbf4a',dirt:'#8a6040',plat:'#a8784a'},beach:{sky:['#5ab8f0','#d8f4ff'],top:'#f0dc9c',dirt:'#c8a060',plat:'#c89a5a',sea:1},
  candy:{sky:['#ffc8e8','#fff0f8'],top:'#ff8ac0',dirt:'#c86a3a',plat:'#ff6fae'},forest:{sky:['#8fd0e8','#e8f8f0'],top:'#3f9a3a',dirt:'#6a4a2a',plat:'#7a5432'},
  sky:{sky:['#a8dcff','#f4fbff'],top:'#ffffff',dirt:'#dfeaf6',plat:'#ffffff',cloud:1},castle:{sky:['#f4a86a','#ffe0b8'],top:'#9a958c',dirt:'#6a655c',plat:'#c0392b'},
  volcano:{sky:['#3a1420','#a0402a'],top:'#5a4038',dirt:'#3a2a28',plat:'#6a5048'},snow:{sky:['#a8d8f4','#f0faff'],top:'#f4fbff',dirt:'#9ab8d0',plat:'#cfe8f8'},
  factory:{sky:['#7a8494','#c8ccd4'],top:'#5a5e66',dirt:'#3a3c42',plat:'#e0a020'},tech:{sky:['#1a2a4a','#3a5a8a'],top:'#3ddbd9',dirt:'#2a3a5a',plat:'#3ddbd9'},
  space:{sky:['#05061a','#1a1240'],top:'#8a8fa8',dirt:'#4a4e66',plat:'#c8ccd8',stars:1},pirate:{sky:['#5ab0e0','#d8f0ff'],top:'#8a5a32',dirt:'#5a3a22',plat:'#7a5432',sea:1},
  canyon:{sky:['#e8a86a','#f8dcb8'],top:'#c8743f',dirt:'#8a4a2a',plat:'#a8603a'},ocean:{sky:['#3a9ad8','#cfeaf8'],top:'#5fbf4a',dirt:'#8a6040',plat:'#a8784a',sea:1},
  rainbow:{sky:['#120c30','#3a2a6a'],top:'#ff8ad0',dirt:'#7a5aff',plat:'#ffd23f',stars:1}};
// 招式：持續時間、命中時段、判定框（以面向為準的 x 範圍、y 範圍，腳底為 0）、傷害、基礎擊退、成長、角度
const MOVES={
  jab:{dur:.22,a:.04,b:.12,box:[10,46,-46,-14],dmg:3,kb:110,gr:.55,ang:30},
  jab3:{dur:.36,a:.08,b:.18,box:[10,52,-48,-12],dmg:6,kb:200,gr:1.1,ang:38},
  air:{dur:.36,a:.07,b:.22,box:[-14,46,-48,4],dmg:7,kb:190,gr:1.15,ang:40},
  smash:{dur:.62,a:.3,b:.42,box:[8,64,-50,-8],dmg:14,kb:320,gr:2.3,ang:35},
  up:{dur:.5,a:.02,b:.26,box:[-24,24,-78,-8],dmg:9,kb:250,gr:1.4,ang:85},
  pound:{dur:.55,a:.05,b:.42,box:[-22,22,-24,10],dmg:10,kb:240,gr:1.5,ang:-55},
  bat:{dur:.5,a:.16,b:.3,box:[8,74,-56,-6],dmg:18,kb:420,gr:2.7,ang:32}};
function createIsle(env,opts){
  const si=clamp(opts.stage|0,0,ISLE.length-1),ST=ISLE[si],TH=ISLE_TH[ST.th],OP=opts.options||{},R=roster(opts),{net,host,me,local2}=R,client=!!net&&!host;
  const STOCK=+OP.stock||3,ITEMS=OP.items!=='off',LV=Math.max(0,['easy','normal','hard'].indexOf(OP.lv||'normal')),GRAV=ST.hz==='lowg'?1000:1900;
  const {ctx:c,canvas}=env.canvas2d(W,H);
  const plats=()=>[{x:ST.main[0],y:MAINY,w:ST.main[1],main:true}].concat(ST.plats.map(([x,y,w,m])=>{ let dx=0,dy=0; if(m){ const u=Math.sin(t*Math.PI*2/m[2]); dx=m[0]*u; dy=m[1]*u; } return {x:x+dx,y:y+dy,w,dx,dy}; }));
  let t=0,cd=3,intro=3,fxs=[],items=[],proj=[],ev=[],itemT=6,lava={y:SH+60,t:0},wind=0,conv=0,cer=null,ended=false,cam={x:SW/2,y:340,s:1},sendT=0,lastBeep=4,shake=0,nextId=1;
  const F=[]; for(let i=0;i<R.n;i++){ const sx=ST.main[0]+ST.main[1]*(i+1)/(R.n+1);
    F.push({i,x:sx,y:MAINY-200,vx:0,vy:0,face:i<R.n/2?1:-1,ground:false,jumps:1,upUsed:false,dmg:0,stocks:STOCK,stun:0,atk:null,cd:0,shield:false,shp:1,inv:2,out:false,outT:0,item:null,star:0,drop:0,hs:0,last:-1,lastT:0,ko:0,jabN:0,jabT:0,
      human:i<R.humans,local:i<R.humans&&(!net||i===me),remote:i<R.humans&&!!net&&i!==me,ai:i>=R.humans?{skill:clamp(.45+ST.stars*.07+LV*.15+(i-R.humans)*.03,.3,1),t:0,mx:0,act:0}:null,qx:null,inBuf:{...NOIN}}); }
  const alive=f=>!f.out&&f.stocks>0,foe=(a,b)=>a!==b&&(a.team==null||R.team[a.i]==null||R.team[a.i]!==R.team[b.i]);
  F.forEach(f=>f.team=R.team[f.i]);
  const fx=(k,x,y,o)=>{ fxs.push(Object.assign({k,x,y,t:0},o||{})); if(host&&net) ev.push([k,R1(x),R1(y),o&&o.col||'']); };
  const snd=n=>{ env.sfx(n); if(host&&net) ev.push(['s',n]); };
  function onPlat(f,P){ for(const p of P) if(f.x>=p.x-4&&f.x<=p.x+p.w+4&&Math.abs(f.y-p.y)<2) return p; return null; }
  // 命中：被打的人加 ％，往外飛
  function hitF(a,b,M,face){ if(b.inv>0||b.star>0||!alive(b)) return false;
    if(b.shield&&b.shp>0){ b.shp-=M.dmg*.045; b.vx+=face*120; fx('block',b.x,b.y-24); snd('bump'); if(b.shp<=0){ b.shield=false; b.stun=1.8; fx('txt',b.x,b.y-60,{s:'護盾破了！'}); } return true; }
    b.dmg=Math.min(999,b.dmg+M.dmg*(a.star>0?1.2:1)); const K=M.kb+M.gr*b.dmg,an=M.ang*Math.PI/180;
    b.vx=Math.cos(an)*K*face*1.6; b.vy=-Math.sin(an)*K*1.6; b.stun=Math.min(1.6,.12+K/900); b.ground=false; b.atk=null; b.shield=false; b.hs++; b.last=a.i; b.lastT=t;
    fx(K>500?'big':'hit',b.x,b.y-24,{col:K>500?'#ffd23f':'#fff'}); snd(K>500?'boom':'hurt'); if(K>500) shake=.25; return true; }
  function startAtk(f,inp){ if(f.atk||f.cd>0||f.stun>0) return;
    let k=null;
    if(inp.sp){ if(inp.my<0) k='up'; else if(inp.my>0&&!f.ground) k='pound'; else k='smash'; }
    else if(inp.atk){ if(f.item&&f.item.k==='bomb'){ proj.push({id:nextId++,k:'bomb',x:f.x+f.face*20,y:f.y-36,vx:f.face*560+f.vx*.3,vy:-320,own:f.i,t:0}); f.item=null; snd('place'); return; }
      if(f.item&&f.item.k==='bat') k='bat'; else if(!f.ground) k='air'; else { f.jabN=t-f.jabT<.5?(f.jabN+1)%3:0; f.jabT=t; k=f.jabN===2?'jab3':'jab'; } }
    if(!k) return; if(k==='up'){ if(f.upUsed) return; f.upUsed=true; f.vy=-920; }
    if(k==='pound'){ f.vy=900; }
    if(k==='bat'){ f.item.n--; if(f.item.n<=0) f.item=null; }
    f.atk={k,t:0,hit:new Set()}; f.shield=false; }
  function stepF(f,inp,dt,P){
    if(f.out){ if(f.stocks<=0) return; f.outT-=dt; if(f.outT<=0){ f.out=false; f.x=SW/2; f.y=120; f.vx=f.vy=0; f.dmg=0; f.inv=2.2; f.ground=false; f.jumps=1; f.upUsed=false; } return; }
    if(f.inv>0) f.inv-=dt; if(f.star>0) f.star-=dt; if(f.cd>0) f.cd-=dt; if(f.drop>0) f.drop-=dt;
    const ice=ST.hz==='ice'&&f.ground;
    if(f.stun>0){ f.stun-=dt; inp=NOIN; f.vx*=Math.exp(-1.2*dt); }
    else {
      const run=f.ground?(ice?1.4:9):4.5,top=f.atk&&f.ground?60:300;
      if(!f.shield) f.vx+=(inp.mx*top-f.vx)*Math.min(1,run*dt); else f.vx*=Math.exp(-10*dt);
      if(inp.mx&&!f.atk) f.face=inp.mx;
      // 按鍵緩衝：早按 0.25 秒內也算，能動的那一刻馬上執行（按了比較靈敏）
      if(inp.jump) f.bj=.25; if(inp.atk) f.ba=.25; if(inp.sp) f.bs=.25; f.bj=(f.bj||0)-dt; f.ba=(f.ba||0)-dt; f.bs=(f.bs||0)-dt;
      if(f.bj>0&&!f.shield&&!(f.atk&&f.atk.k==='smash')&&(f.ground||f.jumps>0)){ f.bj=0; if(f.ground){ f.vy=-720*(ST.hz==='lowg'?.85:1); f.ground=false; snd('spring'); } else if(f.jumps>0){ f.jumps--; f.vy=-640*(ST.hz==='lowg'?.85:1); fx('puff',f.x,f.y); snd('spring'); } }
      const onP=f.ground?onPlat(f,P):null; // 薄平台上按 ↓ 穿下去；主島上按 ↓ 是防禦
      if(inp.down&&onP&&!onP.main&&!inp.atk&&!inp.sp){ f.drop=.3; f.ground=false; f.y+=3; }
      f.shield=inp.down&&f.ground&&onP&&onP.main&&!f.atk&&f.shp>.05;
      if(!f.shield&&f.shp<1) f.shp=Math.min(1,f.shp+dt*.12);
      if(inp.down&&!f.ground&&f.vy>-60&&!f.atk) f.vy=Math.max(f.vy,780);
      if((f.ba>0||f.bs>0)&&!f.atk&&f.cd<=0){ const offStage=(f.x<P[0].x-4||f.x>P[0].x+P[0].w+4||f.y>MAINY+8)&&!f.ground;
        const want=Object.assign({},inp,{atk:f.ba>0&&!(f.bs>0),sp:f.bs>0}); if(want.sp&&offStage&&!f.upUsed) want.my=-1; // 被打飛在場外按必殺：自動往上衝回場
        const had=f.item; startAtk(f,want); if(f.atk||f.item!==had){ f.ba=0; f.bs=0; } }
    }
    // 攻擊進行
    if(f.atk){ const M=MOVES[f.atk.k]; f.atk.t+=dt;
      if(f.atk.t>=M.a&&f.atk.t<=M.b&&!client){ const [x0,x1,y0,y1]=M.box,ax0=f.face>0?f.x+x0:f.x-x1,ax1=f.face>0?f.x+x1:f.x-x0;
        for(const g of F){ if(!foe(f,g)||!alive(g)||f.atk.hit.has(g.i)) continue; if(g.x+12<ax0||g.x-12>ax1||g.y<f.y+y0||g.y-44>f.y+y1) continue; f.atk.hit.add(g.i); hitF(f,g,M,f.face); } }
      if(f.atk.k==='pound'&&f.ground) f.atk.t=Math.max(f.atk.t,M.b);
      if(f.atk.t>=M.dur){ f.atk=null; f.cd=.08; } }
    // 環境
    if(ST.hz==='wind') f.vx+=wind*dt;
    if(ST.hz==='conveyor'&&f.ground&&onPlat(f,P)&&onPlat(f,P).main) f.x+=conv*dt;
    f.vy+=GRAV*dt; if(f.vy>1150) f.vy=1150;
    const px=f.x,py=f.y; f.x+=f.vx*dt; f.y+=f.vy*dt;
    // 站在平台上（從上面落下才會站住；按 ↓ 可以穿過薄平台）
    const was=f.ground; f.ground=false;
    if(f.vy>=0) for(const p of P){ if(p.main||f.drop<=0){ if(py<=p.y+Math.abs(p.dy0||0)+4&&f.y>=p.y&&f.x>=p.x-6&&f.x<=p.x+p.w+6){ f.y=p.y; if(f.stun>.2&&f.vy>520){ f.vy=-f.vy*.45; f.y=p.y-1; fx('puff',f.x,f.y); continue; } f.vy=0; f.ground=true; f.jumps=1; f.upUsed=false; if(p.dx!=null&&p.pdx!=null){ f.x+=p.dx-p.pdx; } if(!was) fx('dust',f.x,f.y); break; } } }
    // 熔岩：碰到就被往上燙飛
    if(ST.hz==='lava'&&f.y>lava.y&&!client){ f.dmg+=12; f.vy=-1050; f.vx*=.5; f.stun=.5; f.hs++; fx('big',f.x,f.y-10,{col:'#ff6a1a'}); snd('hurt'); }
    // 飛出場外
    if(!client&&(f.x<-BZ||f.x>SW+BZ||f.y>SH+BZ||f.y<-BZ-200)){ f.stocks--; f.out=true; f.outT=1.8; f.hs++; f.atk=null; f.item=null;
      fx('ko',clamp(f.x,10,SW-10),clamp(f.y,20,SH-10)); snd('boom'); shake=.4; if(f.last>=0&&t-f.lastT<6) F[f.last].ko++; } }
  // 道具
  const ITK=['bat','bomb','heart','star'];
  function stepItems(dt,P){ if(ITEMS&&!client){ itemT-=dt; if(itemT<=0&&items.length<3){ itemT=7+Math.random()*6; const p=P[(Math.random()*P.length)|0]; items.push({id:nextId++,k:ITK[(Math.random()*4)|0],x:p.x+20+Math.random()*(p.w-40),y:p.y-200,vy:0,t:0}); } }
    for(let n=items.length-1;n>=0;n--){ const it=items[n]; it.t+=dt; it.vy+=GRAV*.6*dt; it.y+=it.vy*dt; for(const p of P) if(it.vy>0&&it.y>=p.y&&it.y-it.vy*dt<=p.y+2&&it.x>=p.x&&it.x<=p.x+p.w){ it.y=p.y; it.vy=0; }
      if(it.y>SH+200||it.t>20){ items.splice(n,1); continue; }
      if(client) continue;
      for(const f of F){ if(!alive(f)||Math.abs(f.x-it.x)>26||Math.abs(f.y-18-(it.y-14))>40) continue;
        if(it.k==='heart'){ f.dmg=Math.max(0,f.dmg-40); fx('txt',f.x,f.y-60,{s:'-40％'}); snd('heal'); }
        else if(it.k==='star'){ f.star=6; fx('txt',f.x,f.y-60,{s:'無敵！'}); snd('item'); }
        else { if(f.item) continue; f.item={k:it.k,n:it.k==='bat'?5:1}; fx('txt',f.x,f.y-60,{s:it.k==='bat'?'球棒！':'炸彈！'}); snd('item'); }
        items.splice(n,1); break; } }
    for(let n=proj.length-1;n>=0;n--){ const b=proj[n]; b.t+=dt; b.vy+=GRAV*.7*dt; b.x+=b.vx*dt; b.y+=b.vy*dt; let boom=b.t>2.2||b.y>SH+100;
      for(const p of P) if(b.vy>0&&b.y>=p.y&&b.y-b.vy*dt<=p.y+2&&b.x>=p.x&&b.x<=p.x+p.w){ b.y=p.y; b.vy*=-.35; b.vx*=.6; if(Math.abs(b.vy)<60) b.vy=0; }
      for(const f of F) if(alive(f)&&(f.i!==b.own||b.t>.4)&&Math.abs(f.x-b.x)<22&&Math.abs(f.y-20-b.y)<30) boom=true;
      if(ST.hz==='cannon'&&b.k==='ball') boom=boom||b.x<-200||b.x>SW+200;
      if(boom){ proj.splice(n,1); if(client) continue; fx('boom',b.x,b.y); snd('boom'); shake=.3;
        for(const f of F){ const d=Math.hypot(f.x-b.x,f.y-20-b.y); if(d<80&&alive(f)) hitF(b.own>=0?F[b.own]:{i:-1,star:0},f,{dmg:b.k==='ball'?12:16,kb:340,gr:2,ang:55},f.x>=b.x?1:-1); } } } }
  // 電腦
  function aiInput(f,dt,P){ const a=f.ai,inp={mx:0,my:0,jump:false,atk:false,sp:false,down:false},main=P[0];
    if(f.out||f.stun>0) return inp;
    let tg=null,bd=1e9; for(const g of F){ if(!foe(f,g)||!alive(g)) continue; const d=Math.hypot(g.x-f.x,g.y-f.y)+(g.inv>0?300:0); if(d<bd){ bd=d; tg=g; } }
    const off=f.x<main.x-4||f.x>main.x+main.w+4,below=f.y>MAINY+10;
    if(off||below&&!f.ground){ // 回場：往中間、二段跳、上必殺
      inp.mx=f.x<SW/2?1:-1; if(f.vy>0&&f.jumps>0&&f.y>MAINY-60) inp.jump=true; else if(f.vy>0&&!f.upUsed&&f.jumps<=0&&f.y>MAINY-40){ inp.sp=true; inp.my=-1; } return inp; }
    // 撿道具
    if(!f.item&&items.length){ const it=items.find(x=>Math.abs(x.x-f.x)<260&&Math.abs(x.y-f.y)<120); if(it&&Math.random()<a.skill){ inp.mx=Math.sign(it.x-f.x); return inp; } }
    if(!tg) return inp;
    const dx=tg.x-f.x,dy=tg.y-f.y; a.t-=dt;
    if(Math.abs(dx)>34) inp.mx=Math.sign(dx);
    // 不要自己走下去
    if(f.ground&&onPlat(f,P)&&onPlat(f,P).main){ if((f.x<main.x+30&&inp.mx<0)||(f.x>main.x+main.w-30&&inp.mx>0)) inp.mx=0; }
    if(dy<-70&&Math.abs(dx)<170&&(f.ground||f.jumps>0&&f.vy>0)&&Math.random()<.08+a.skill*.08) inp.jump=true;
    if(dy>60&&f.ground&&Math.abs(dx)<120&&onPlat(f,P)&&!onPlat(f,P).main&&Math.random()<.04){ inp.down=true; inp.jump=true; }
    const close=Math.abs(dx)<58&&Math.abs(dy)<56;
    if(close&&a.t<=0){ a.t=(.7-a.skill*.45)*(.6+Math.random()*.8);
      if(f.item&&f.item.k==='bomb'){ inp.atk=true; }
      else if(tg.dmg>70&&Math.random()<.25+a.skill*.3){ inp.sp=true; if(dy<-40) inp.my=-1; }
      else inp.atk=true;
      if(Math.sign(dx)) f.face=Math.sign(dx); }
    else if(f.item&&f.item.k==='bomb'&&Math.abs(dx)<320&&Math.abs(dy)<80&&a.t<=0){ a.t=1; f.face=Math.sign(dx)||f.face; inp.atk=true; }
    if(tg.atk&&Math.abs(dx)<70&&Math.abs(dy)<50&&f.ground&&Math.random()<a.skill*.12) { inp.down=true; inp.mx=0; inp.atk=false; inp.sp=false; }
    return inp; }
  // 連線
  const pk=f=>[f.i,R1(f.x),R1(f.y),R1(f.vx),R1(f.vy),f.face,Math.round(f.dmg),f.stocks,R1(f.stun),f.atk?f.atk.k:'',R1(f.atk?f.atk.t:0),+f.shield,R1(f.shp),R1(f.inv),f.out?1:0,f.item?f.item.k:'',R1(f.star),f.hs,f.ground?1:0,f.ko];
  function unpk(a){ const f=F[a[0]]; if(!f) return; const mine=f.local,newHit=a[17]!==f.hs;
    if(!mine||newHit||a[14]||a[8]>0){ if(mine&&!newHit&&!a[14]&&f.stun<=0){} else { f.x=a[1]; f.y=a[2]; f.vx=a[3]; f.vy=a[4]; } }
    if(!mine){ f.face=a[5]; f.atk=a[9]?{k:a[9],t:a[10],hit:new Set()}:null; f.shield=!!a[11]; f.ground=!!a[18]; }
    f.dmg=a[6]; f.stocks=a[7]; f.stun=Math.max(mine?f.stun:0,a[8]); if(newHit&&mine) f.stun=a[8]; f.shp=a[12]; f.inv=a[13]; f.out=!!a[14]; f.item=a[15]?{k:a[15],n:1}:null; f.star=a[16]; f.hs=a[17]; f.ko=a[19]; }
  const inBuf={};
  if(net){
    if(client) net.onmsg=m=>{ if(m.s){ m.s.f.forEach(unpk); items=m.s.it.map(a=>({id:a[0],k:a[1],x:a[2],y:a[3],vy:0,t:0})); proj=m.s.pr.map(a=>({id:a[0],k:a[1],x:a[2],y:a[3],vx:a[4],vy:a[5],own:a[6],t:a[7]})); t=m.s.t; lava.y=m.s.lv; wind=m.s.w; conv=m.s.cv; if(m.s.cd!=null) cd=m.s.cd;
        for(const e of m.s.ev){ if(e[0]==='s') env.sfx(e[1]); else fxs.push({k:e[0],x:e[1],y:e[2],t:0,col:e[3]}); } }
      if(m.end){ cer={t:0,order:m.end.map(i=>F[i])}; } };
    else { net.onmsg=(m,from)=>{ const f=F[from]; if(!f) return; if(m.i){ const b=inBuf[from]||(inBuf[from]={...NOIN}); b.mx=m.i[0]; b.my=m.i[1]; b.down=!!m.i[5]; if(m.i[2]) b.jump=true; if(m.i[3]) b.atk=true; if(m.i[4]) b.sp=true; }
        if(m.q&&f.stun<=0&&!f.out&&m.q[5]===f.hs){ f.x=m.q[0]; f.y=m.q[1]; f.vx=m.q[2]; f.vy=m.q[3]; f.face=m.q[4]; f.ground=!!m.q[6]; } };
      net.onleave=i=>{ if(F[i]){ F[i].remote=false; F[i].ai={skill:.6,t:0}; R.names[i]+='（離開）'; } }; }
  }
  let myIn={...NOIN},sentHit={j:0,a:0,s:0};
  function update(dt){
    if(cer){ cer.t+=dt; if(cer.t>4.5&&!cer.done){ cer.done=true; finish(); } return; }
    for(const e of fxs) e.t+=dt; fxs=fxs.filter(e=>e.t<(e.k==='ko'?1.2:e.k==='txt'?1.2:.6));
    if(shake>0) shake-=dt;
    if(intro>0){ intro-=dt; if(!net&&(env.hit('Space')||env.hit('Enter'))) intro=0; if(intro>0) return; }
    if(cd>0&&!client){ cd-=dt; const n=Math.ceil(cd); if(n<lastBeep&&n>=1){ lastBeep=n; env.sfx('beep'); } if(cd<=0) env.sfx('go'); }
    else if(cd>0) cd-=dt;
    const steps=Math.max(1,Math.ceil(dt/(1/60))),h=dt/steps;
    for(let s=0;s<steps;s++){ const P=plats(); if(cd<=0) t+=h;
      const pre=ST.plats.map(([x,y,w,m])=>m?Math.sin(t*Math.PI*2/m[2]):0); P.forEach((p,j)=>{ if(j>0){ const m=ST.plats[j-1][3]; if(m){ const u0=Math.sin((t-h)*Math.PI*2/m[2]); p.pdx=m[0]*u0; p.dy0=m[1]*(Math.sin(t*Math.PI*2/m[2])-u0); } } });
      if(!client&&cd<=0){ if(ST.hz==='lava'){ lava.t+=h; const ph=(lava.t%18)/18; lava.y=ph<.6?SH+60:ph<.7?lerp(SH+60,MAINY-20,(ph-.6)/.1):ph<.85?MAINY-20:lerp(MAINY-20,SH+60,(ph-.85)/.15); }
        if(ST.hz==='wind'){ const ph=t%12; wind=ph<4?0:ph<8?520:-520; }
        if(ST.hz==='conveyor') conv=(Math.floor(t/8)%2?-1:1)*150;
        if(ST.hz==='cannon'&&Math.random()<h*.35){ const L=Math.random()<.5; proj.push({id:nextId++,k:'ball',x:L?-60:SW+60,y:MAINY-60-Math.random()*200,vx:L?520:-520,vy:-120,own:-1,t:0}); } }
      for(const f of F){ let inp=NOIN;
        if(cd>0){ inp=NOIN; }
        else if(f.local){ if(s===0){ inp=readInput(env,local2?f.i:0,local2); if(net&&!host){ if(inp.jump) sentHit.j++; if(inp.atk) sentHit.a++; if(inp.sp) sentHit.s++; myIn=inp; } } else inp={...readInput(env,local2?f.i:0,local2),jump:false,atk:false,sp:false}; }
        else if(f.remote){ if(client){ f.x+=f.vx*h; continue; } const b=inBuf[f.i]||NOIN; inp={...b}; if(inBuf[f.i]){ inBuf[f.i].jump=inBuf[f.i].atk=inBuf[f.i].sp=false; } }
        else if(f.ai){ if(client) { f.x+=f.vx*h*.0; continue; } inp=aiInput(f,h,P); }
        if(client&&f.local){ const keep={atk:inp.atk,sp:inp.sp}; inp=Object.assign({},inp,{atk:false,sp:false}); stepF(f,inp,h,P); if((keep.atk||keep.sp)&&!f.atk&&f.stun<=0){ /* 自己的出招動畫先演，結果照房主 */ startAtk(f,Object.assign({},inp,keep)); } }
        else stepF(f,inp,h,P); }
      if(cd<=0) stepItems(h,P); }
    // 連線傳送
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/20;
      if(host){ net.send({s:{f:F.map(pk),it:items.map(i=>[i.id,i.k,R1(i.x),R1(i.y)]),pr:proj.map(b=>[b.id,b.k,R1(b.x),R1(b.y),R1(b.vx),R1(b.vy),b.own,R1(b.t)]),t:R1(t),lv:R1(lava.y),w:wind,cv:conv,cd:R1(cd),ev}}); ev=[]; }
      else { const f=F[me]; net.send({i:[myIn.mx,myIn.my,sentHit.j,sentHit.a,sentHit.s,+myIn.down],q:[R1(f.x),R1(f.y),R1(f.vx),R1(f.vy),f.face,f.hs,f.ground?1:0]}); sentHit={j:0,a:0,s:0}; } } }
    // 結束：只剩一人（或一隊）有命
    if(!client&&!ended&&cd<=0){ const live=F.filter(f=>f.stocks>0); const teams=new Set(live.map(f=>R.team[f.i]==null?'p'+f.i:'t'+R.team[f.i]));
      if(teams.size<=1){ ended=true; const order=F.slice().sort((a,b)=>(b.stocks-a.stocks)||(a.dmg-b.dmg)||(b.ko-a.ko)); cer={t:0,order}; env.sfx('win'); if(net) net.send({end:order.map(f=>f.i)}); } } }
  function finish(){ const order=cer.order,myF=F[me]; let title,text='';
    const rows=order.map((f,i)=>'<tr><td>'+(i+1)+'</td><td>'+(f.team!=null?'<span style="color:'+R.TEAMS[f.team].col+'">●</span> ':'')+R.names[f.i]+'</td><td>'+(f.stocks>0?'剩 '+f.stocks+' 命':'出局')+'</td><td>打飛 '+f.ko+'</td></tr>').join('');
    const html='<table class="ls"><tr><th>名次</th><th>選手</th><th>結果</th><th>擊飛</th></tr>'+rows+'</table>';
    const win=order[0]; let won;
    if(R.mode!=='ffa'){ won=R.team[win.i]===R.team[me]; title=local2?R.TEAMS[R.team[win.i]].name+'獲勝！':won?'你的隊伍贏了！':R.TEAMS[R.team[win.i]].name+'獲勝'; }
    else { won=win.i===me; title=local2?R.names[win.i]+' 獲勝！':won?'你贏了！':R.names[win.i]+' 獲勝'; }
    if(won&&!net&&!local2) recWin('isle',ST.name);
    env.sfx(won||local2?'win':'lose'); env.end({title,big:ST.name,html,text:'把對手打出場外就少一條命，最後還有命的人（隊伍）獲勝。',score:null,next:!net&&won&&si<ISLE.length-1}); }
  // 畫面
  function bgDraw(){ isleBg(c,TH,ST,t,cam); }
  function draw(){
    if(cer){ podium(c,cer.order,R,cer.t,()=>{ isleBg(c,TH,ST,cer.t,{x:SW/2,y:340,s:1}); }); c.fillStyle='#ffd23f'; c.font='900 30px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=6; c.strokeStyle='#0b0a1c'; const tx=R.mode!=='ffa'?R.TEAMS[R.team[cer.order[0].i]].name+' 獲勝！':R.names[cer.order[0].i]+' 第一名！'; c.strokeText(tx,W/2,50); c.fillText(tx,W/2,50); return; }
    // 鏡頭：把所有人框進畫面
    let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for(const f of F){ if(f.out||f.stocks<=0) continue; x0=Math.min(x0,f.x); x1=Math.max(x1,f.x); y0=Math.min(y0,f.y-60); y1=Math.max(y1,f.y); }
    if(x0>x1){ x0=200; x1=800; y0=200; y1=MAINY; } x0=Math.min(x0,ST.main[0]); x1=Math.max(x1,ST.main[0]+ST.main[1]); y1=Math.max(y1,MAINY+40);
    const ts=clamp(Math.min(W/(x1-x0+240),(H-90)/(y1-y0+200)),.55,1.15),tx=(x0+x1)/2,ty=(y0+y1)/2;
    cam.s+=(ts-cam.s)*.08; cam.x+=(tx-cam.x)*.1; cam.y+=(ty-cam.y)*.1;
    isleBg(c,TH,ST,t,cam);
    c.save(); const sx=shake>0?(Math.random()-.5)*10:0,sy=shake>0?(Math.random()-.5)*10:0; c.translate(W/2+sx,(H-80)/2+sy); c.scale(cam.s,cam.s); c.translate(-cam.x,-cam.y);
    const P=plats();
    if(ST.hz==='lava'){ const g=c.createLinearGradient(0,lava.y,0,lava.y+300); g.addColorStop(0,'#ffb02a'); g.addColorStop(.2,'#ff5a1a'); g.addColorStop(1,'#8a1a0a'); c.fillStyle=g; c.fillRect(-600,lava.y,SW+1200,900); c.fillStyle='rgba(255,230,120,.6)'; for(let i=0;i<30;i++){ c.beginPath(); c.arc(-400+i*70+Math.sin(t*2+i)*10,lava.y+4+Math.sin(t*3+i)*3,6,0,7); c.fill(); } }
    for(const p of P) drawPlat(c,p,TH,ST,t,conv);
    for(const it of items) drawItem(c,it.k,it.x,it.y,t);
    for(const b of proj) drawItem(c,b.k==='ball'?'ball':'bomb',b.x,b.y+12,t,true);
    for(const f of F){ if(f.out||f.stocks<=0) continue; if(f.inv>0&&!f.star&&Math.floor(t*12)%2) c.globalAlpha=.45;
      const moving=Math.abs(f.vx)>40&&f.ground,dir=f.face>0?3:2,st=1.55;
      if(f.star>0) glow(c,f.x,f.y-26,46,'hsla('+(t*400%360)+',100%,60%,.5)');
      c.save(); if(f.stun>0&&!f.ground){ c.translate(f.x,f.y-24); c.rotate(t*12*Math.sign(f.vx||1)); c.translate(-f.x,-f.y+24); }
      person(c,f.x,f.y,R.looks[f.i],f.i,dir,moving,t+f.i,st); c.restore(); c.globalAlpha=1;
      if(f.item) drawItem(c,f.item.k,f.x+f.face*20,f.y-22,t,true,f.face);
      if(f.atk){ const M=MOVES[f.atk.k],act=f.atk.t>=M.a&&f.atk.t<=M.b; if(f.atk.t<M.a&&(f.atk.k==='smash'||f.atk.k==='bat')){ c.fillStyle='rgba(255,210,63,'+(.3+.3*Math.sin(t*40))+')'; c.beginPath(); c.arc(f.x,f.y-26,30,0,7); c.fill(); }
        if(act){ const [a0,a1,b0,b1]=M.box,cx=f.x+f.face*(a0+a1)/2,cy=f.y+(b0+b1)/2; c.strokeStyle=f.atk.k==='up'?'#ffd23f':'#fff'; c.lineWidth=5; c.globalAlpha=.85; c.beginPath(); if(f.atk.k==='up') c.arc(f.x,f.y-40,32,Math.PI*1.1,Math.PI*1.9); else c.arc(cx-f.face*14,cy,(a1-a0)/2+6,f.face>0?-1.1:Math.PI-0.9+1,f.face>0?1.1:Math.PI+1.1+0.0); c.stroke(); c.globalAlpha=1; } }
      if(f.shield){ c.fillStyle='rgba(120,200,255,'+(.25+.35*f.shp)+')'; c.strokeStyle='rgba(200,240,255,.9)'; c.lineWidth=2; c.beginPath(); c.arc(f.x,f.y-24,28*(.5+.5*f.shp),0,7); c.fill(); c.stroke(); }
      if(f.stun>0&&f.ground){ for(let k=0;k<3;k++){ const a=t*6+k*2.1; c.fillStyle='#ffd23f'; c.font='12px '+TC; c.textAlign='center'; c.fillText('★',f.x+Math.cos(a)*16,f.y-62+Math.sin(a)*5); } }
      const tag=f.local?(local2?(f.i+1)+'P':'你'):R.names[f.i],tc=f.team!=null?R.TEAMS[f.team].col:f.local?'#ffd23f':'#fff';
      c.font='900 12px '+TC; c.textAlign='center'; c.textBaseline='bottom'; c.lineWidth=3; c.strokeStyle='#0b0a1c'; c.strokeText(tag,f.x,f.y-58); c.fillStyle=tc; c.fillText(tag,f.x,f.y-58);
      if((intro>0||cd>0)&&f.local) meArrow(c,f.x,f.y-76,local2?(f.i+1)+'P':'你',t+intro); }
    // 特效
    for(const e of fxs){ const u=e.t;
      if(e.k==='hit'||e.k==='big'){ c.strokeStyle=e.col||'#fff'; c.lineWidth=3; for(let k=0;k<8;k++){ const a=k*Math.PI/4,r1=8+u*80,r2=r1+(e.k==='big'?22:12); c.beginPath(); c.moveTo(e.x+Math.cos(a)*r1,e.y+Math.sin(a)*r1); c.lineTo(e.x+Math.cos(a)*r2,e.y+Math.sin(a)*r2); c.stroke(); } }
      else if(e.k==='block'){ c.strokeStyle='#9ad8ff'; c.lineWidth=3; c.beginPath(); c.arc(e.x,e.y,10+u*60,0,7); c.stroke(); }
      else if(e.k==='puff'||e.k==='dust'){ c.fillStyle='rgba(255,255,255,'+(.6-u)+')'; for(const k of [-1,1]){ c.beginPath(); c.arc(e.x+k*(6+u*30),e.y-4,5+u*10,0,7); c.fill(); } }
      else if(e.k==='boom'){ glow(c,e.x,e.y,30+u*160,'rgba(255,170,60,'+(.8-u)+')'); }
      else if(e.k==='txt'){ c.fillStyle='#ffd23f'; c.font='900 16px '+TC; c.textAlign='center'; c.lineWidth=4; c.strokeStyle='#0b0a1c'; c.strokeText(e.s,e.x,e.y-u*30); c.fillText(e.s,e.x,e.y-u*30); } }
    c.restore();
    for(const e of fxs) if(e.k==='ko'){ const u=e.t,sx2=(e.x-cam.x)*cam.s+W/2,sy2=(e.y-cam.y)*cam.s+(H-80)/2; c.save(); c.globalAlpha=Math.max(0,1-u); glow(c,clamp(sx2,0,W),clamp(sy2,0,H-80),120+u*200,'rgba(255,240,180,.9)'); c.fillStyle='#fff'; c.font='900 40px '+PIX; c.textAlign='center'; c.textBaseline='middle'; c.fillText('KO!',clamp(sx2,60,W-60),clamp(sy2,60,H-140)); c.restore(); }
    if(ST.hz==='wind'&&wind){ c.strokeStyle='rgba(255,255,255,.5)'; c.lineWidth=2; for(let i=0;i<24;i++){ const y=(i*37)%(H-80),x=((i*131+t*Math.sign(wind)*700)%W+W)%W; c.beginPath(); c.moveTo(x,y); c.lineTo(x-Math.sign(wind)*40,y); c.stroke(); } c.fillStyle='#fff'; c.font='900 16px '+TC; c.textAlign='center'; c.fillText(wind>0?'強風 → → →':'← ← ← 強風',W/2,24); }
    if(ST.hz==='lava'&&lava.y<SH){ c.fillStyle='#ff8a5a'; c.font='900 16px '+TC; c.textAlign='center'; c.fillText('熔岩上來了！跳到高的平台上',W/2,24); }
    // 下方：每個人的 ％ 和命
    c.fillStyle='rgba(11,10,28,.78)'; c.fillRect(0,H-80,W,80); const bw=W/F.length;
    F.forEach((f,j)=>{ const x=j*bw+bw/2; person(c,x-bw*.3,H-14,R.looks[f.i],f.i,1,false,t,.9);
      c.fillStyle=f.team!=null?R.TEAMS[f.team].col:'#fff'; c.font='900 12px '+TC; c.textAlign='left'; c.textBaseline='middle'; c.fillText(R.names[f.i]+(f.local&&!local2?'（你）':''),x-bw*.18,H-64);
      const d=Math.round(f.dmg),col=d<50?'#fff':d<100?'#ffd23f':d<150?'#ff9d3d':'#ff4d4d'; c.fillStyle=f.stocks<=0?'#6b6799':col; c.font='900 26px '+PIX; c.fillText(f.stocks<=0?'OUT':d+'%',x-bw*.18,H-34);
      for(let k=0;k<f.stocks;k++){ c.fillStyle=colorOf(R.looks[f.i],f.i); c.beginPath(); c.arc(x-bw*.16+k*12,H-10,4.5,0,7); c.fill(); } });
    if(intro>0){ c.fillStyle='rgba(11,10,28,.55)'; rr(c,W/2-200,60,400,70,16); c.fill(); c.fillStyle='#ffd23f'; c.font='900 26px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(ST.name,W/2,86); c.fillStyle='#fff'; c.font='700 13px '+TC; c.fillText('把對手打出場外！每人 '+STOCK+' 條命'+(R.mode!=='ffa'?'　'+R.TEAMS[0].name+' vs '+R.TEAMS[1].name:''),W/2,112); }
    else if(cd>0){ const n=Math.ceil(cd); c.font='900 80px '+PIX; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=10; c.strokeStyle='#0b0a1c'; c.strokeText(String(n),W/2,H*.38); c.fillStyle='#ffd23f'; c.fillText(String(n),W/2,H*.38); }
    else if(t<.8){ c.font='900 64px '+PIX; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=10; c.strokeStyle='#0b0a1c'; c.strokeText('GO!',W/2,H*.38); c.fillStyle='#5fd068'; c.fillText('GO!',W/2,H*.38); } }
  return {update,draw,destroy(){},_dbg:{F,R,get t(){return t;},skip(){ intro=0; cd=0; },items,MOVES}};
}
function isleBg(c,TH,ST,t,cam){ const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,TH.sky[0]); g.addColorStop(1,TH.sky[1]); c.fillStyle=g; c.fillRect(0,0,W,H);
  const px=(cam.x-SW/2)*.15;
  if(TH.stars){ for(let i=0;i<80;i++){ c.fillStyle='rgba(255,255,255,'+(.3+.6*Math.abs(Math.sin(t+i)))+')'; c.fillRect(((i*137-px)%W+W)%W,(i*61)%H,2,2); } c.fillStyle='#c8a0ff'; c.beginPath(); c.arc(W*.8-px*.3,H*.2,40,0,7); c.fill(); }
  else { c.fillStyle='rgba(255,255,255,.75)'; for(let i=0;i<6;i++){ const x=((i*190-px*1.5+t*10)%(W+200)+W+200)%(W+200)-100,y=50+(i*47)%150; c.beginPath(); c.arc(x,y,24,0,7); c.arc(x+26,y-8,28,0,7); c.arc(x+54,y,22,0,7); c.fill(); } }
  if(TH.sea){ c.fillStyle='#2a86c8'; c.fillRect(0,H*.66,W,H); c.fillStyle='rgba(255,255,255,.3)'; for(let i=0;i<20;i++) c.fillRect(((i*97+t*20)%W),H*.68+(i%5)*14,30,2); }
  else { c.fillStyle='rgba(0,0,0,.12)'; c.beginPath(); c.moveTo(0,H); for(let x=0;x<=W;x+=20) c.lineTo(x,H*.62-Math.sin((x+px)/120)*30-Math.sin((x+px)/47)*12); c.lineTo(W,H); c.fill(); }
  if(ST.th==='volcano'){ glow(c,W*.5,H*.6,240,'rgba(255,90,30,.35)'); }
  if(ST.th==='rainbow'){ const cl=['#ff3b3b','#ff9d3d','#ffe14a','#5fd068','#3d8bff','#7a5aff']; cl.forEach((col,i)=>{ c.strokeStyle=col; c.globalAlpha=.25; c.lineWidth=14; c.beginPath(); c.arc(W/2,H*1.1,H*.9-i*14,Math.PI,0); c.stroke(); }); c.globalAlpha=1; } }
function drawPlat(c,p,TH,ST,t,conv){
  if(p.main){ c.fillStyle=TH.dirt; c.beginPath(); c.moveTo(p.x,p.y+14); c.lineTo(p.x+p.w,p.y+14); c.lineTo(p.x+p.w*.8,p.y+110); c.lineTo(p.x+p.w*.55,p.y+170); c.lineTo(p.x+p.w*.35,p.y+120); c.lineTo(p.x+p.w*.15,p.y+90); c.closePath(); c.fill();
    c.fillStyle='rgba(0,0,0,.15)'; c.beginPath(); c.moveTo(p.x+p.w*.55,p.y+14); c.lineTo(p.x+p.w*.8,p.y+110); c.lineTo(p.x+p.w*.55,p.y+170); c.fill();
    c.fillStyle=TH.top; rr(c,p.x-6,p.y-2,p.w+12,20,8); c.fill(); c.strokeStyle='rgba(0,0,0,.2)'; c.lineWidth=2; c.stroke();
    if(ST.hz==='conveyor'){ c.fillStyle='#ffd23f'; for(let x=0;x<p.w;x+=28){ const xx=p.x+((x+(t*conv))%p.w+p.w)%p.w; c.beginPath(); c.moveTo(xx,p.y+3); c.lineTo(xx+(conv>0?10:-10),p.y+9); c.lineTo(xx,p.y+15); c.fill(); } }
    if(ST.hz==='ice'){ c.fillStyle='rgba(180,230,255,.6)'; c.fillRect(p.x,p.y+1,p.w,6); }
    if(ST.th==='grass'||ST.th==='forest'||ST.th==='ocean'){ c.fillStyle='#3f8a3a'; for(let x=p.x;x<p.x+p.w;x+=18){ c.beginPath(); c.moveTo(x,p.y); c.lineTo(x+4,p.y-8); c.lineTo(x+8,p.y); c.fill(); } }
    return; }
  if(TH.cloud||ST.th==='sky'){ c.fillStyle='#fff'; for(let x=0;x<p.w;x+=22){ c.beginPath(); c.arc(p.x+x+11,p.y+6,12,0,7); c.fill(); } return; }
  c.fillStyle=TH.plat; rr(c,p.x,p.y-2,p.w,12,5); c.fill(); c.fillStyle='rgba(255,255,255,.3)'; c.fillRect(p.x+4,p.y,p.w-8,3); c.strokeStyle='rgba(0,0,0,.3)'; c.lineWidth=1.5; rr(c,p.x,p.y-2,p.w,12,5); c.stroke();
  if(ST.th==='rainbow'||ST.th==='tech') glow(c,p.x+p.w/2,p.y+4,p.w*.6,'rgba(255,255,255,.18)'); }
function drawItem(c,k,x,y,t,held,face){ const b=held?0:Math.sin(t*4)*3; c.save(); c.translate(x,y-12+b);
  if(!held){ glow(c,0,0,26,'rgba(255,240,150,.4)'); }
  if(k==='bat'){ c.rotate((face||1)*.6); c.fillStyle='#c8904a'; rr(c,-3,-22,7,30,3); c.fill(); c.fillStyle='#a8703a'; rr(c,-5,-24,11,16,5); c.fill(); }
  else if(k==='bomb'||k==='ball'){ c.fillStyle=k==='ball'?'#3a3a48':'#2a2a36'; c.beginPath(); c.arc(0,0,k==='ball'?11:10,0,7); c.fill(); c.fillStyle='rgba(255,255,255,.4)'; c.beginPath(); c.arc(-3,-3,3,0,7); c.fill(); if(k==='bomb'){ c.strokeStyle='#8a6a3a'; c.lineWidth=2; c.beginPath(); c.moveTo(4,-8); c.quadraticCurveTo(8,-16,12,-14); c.stroke(); c.fillStyle=Math.floor(t*10)%2?'#ffd23f':'#ff6a1a'; c.beginPath(); c.arc(12,-14,3,0,7); c.fill(); } }
  else if(k==='heart'){ c.fillStyle='#ff4d6d'; c.beginPath(); c.moveTo(0,8); c.bezierCurveTo(-14,-2,-8,-14,0,-6); c.bezierCurveTo(8,-14,14,-2,0,8); c.fill(); }
  else if(k==='star'){ c.fillStyle='hsl('+(t*300%360)+',100%,60%)'; c.beginPath(); for(let i=0;i<10;i++){ const r=i%2?5:12,a=-Math.PI/2+i*Math.PI/5; c.lineTo(Math.cos(a)*r,Math.sin(a)*r); } c.fill(); }
  c.restore(); }

/* =========================================================================================
   羽毛枕頭戰：俯視角的房間裡互丟、互揮枕頭，打中一下得 1 分，連中 3 下對手會頭暈（再加 2 分）。
   ========================================================================================= */
const AX0=30,AY0=56,AX1=770,AY1=486;
const PILLOW=[
  {name:'溫馨臥室',stars:1,th:'bedroom',obs:[['bed',90,120,150,200],['ward',600,70,140,60],['plant',700,400,40,40]]},
  {name:'學生宿舍',stars:1,th:'dorm',obs:[['bed',50,90,90,170],['bed',660,90,90,170],['desk',330,70,140,50],['desk',330,410,140,50]]},
  {name:'客廳睡衣派對',stars:1,th:'living',obs:[['sofa',300,80,200,60],['table',360,250,80,60],['plant',60,80,40,40],['plant',700,420,40,40]]},
  {name:'露營帳篷',stars:2,th:'camp',obs:[['tent',120,100,140,110],['tent',540,320,140,110],['fire',380,260,40,40],['tree',650,90,60,60],['tree',100,380,60,60]],zones:[['water',280,80,100,60]]},
  {name:'飯店大床房',stars:2,th:'hotel',obs:[['ward',60,70,120,50],['plant',710,70,40,40]],zones:[['tramp',140,200,200,170],['tramp',460,200,200,170]]},
  {name:'樹屋',stars:2,th:'tree',obs:[['trunk',370,230,60,60],['crate',100,100,60,60],['crate',640,380,60,60],['crate',640,100,60,60],['crate',100,380,60,60]]},
  {name:'日式和室',stars:3,th:'tatami',obs:[['lowtable',350,240,100,60],['lamp',80,80,40,40],['lamp',680,400,40,40]],zones:[['tramp',80,300,160,110],['tramp',560,90,160,110]]},
  {name:'雪地小屋',stars:3,th:'snow',obs:[['snowman',200,140,50,50],['snowman',560,300,50,50],['fire',380,90,40,40]],zones:[['ice',60,250,680,120]]},
  {name:'海邊度假屋',stars:3,th:'beach',obs:[['chair',120,110,60,90],['chair',620,110,60,90],['umbrella',380,240,40,40]],zones:[['water',60,380,680,90]]},
  {name:'城堡寢室',stars:4,th:'castle',obs:[['pillar',200,150,50,50],['pillar',550,150,50,50],['pillar',200,330,50,50],['pillar',550,330,50,50],['bed',330,70,140,110]]},
  {name:'太空艙',stars:4,th:'space',obs:[['pod',140,120,80,80],['pod',580,300,80,80],['pod',360,230,80,50]],zones:[['ice',AX0,AY0,AX1-AX0,AY1-AY0]]},
  {name:'恐龍博物館夜宿',stars:4,th:'museum',obs:[['dino',250,160,300,70],['crate',80,380,60,60],['crate',660,90,60,60],['pillar',120,100,40,40],['pillar',640,400,40,40]]},
  {name:'遊樂園旅館',stars:5,th:'fun',obs:[['crate',370,240,60,60]],zones:[['tramp',70,80,180,140],['tramp',550,80,180,140],['tramp',70,320,180,140],['tramp',550,320,180,140]]},
  {name:'公主城堡',stars:5,th:'princess',obs:[['pillar',150,120,40,40],['pillar',610,120,40,40],['pillar',150,380,40,40],['pillar',610,380,40,40],['bed',330,200,140,110]],zones:[['hole',40,250,80,60],['hole',680,250,80,60]]},
  {name:'雲端枕頭島',stars:5,th:'cloud',obs:[['cloudpuff',370,240,60,50]],zones:[['hole',40,60,120,100],['hole',640,60,120,100],['hole',40,380,120,100],['hole',640,380,120,100],['hole',300,60,200,50],['hole',300,436,200,50]]}];
const PTH={bedroom:{floor:'#d8b48a',line:'#c8a07a',wall:'#f4d8c8'},dorm:{floor:'#c8c0b4',line:'#b8b0a4',wall:'#d8e4f0'},living:{floor:'#e0c49a',line:'#d0b48a',wall:'#f8e8c8',rug:'#c84a5a'},
  camp:{floor:'#6faa4a',line:'#64a044',wall:'#2f6a3a',grass:1},hotel:{floor:'#8a3a4a',line:'#7a3442',wall:'#e8d8b8'},tree:{floor:'#a8784a',line:'#8a6038',wall:'#5a8a3a'},
  tatami:{floor:'#c8b878',line:'#2e3b2c',wall:'#f4ecd8',tatami:1},snow:{floor:'#eef6ff',line:'#dce8f4',wall:'#8a5a32'},beach:{floor:'#f0dc9c',line:'#e8d090',wall:'#7ac4f4'},
  castle:{floor:'#9a958c',line:'#8a857c',wall:'#5a3a5a',rug:'#a82a3a'},space:{floor:'#2a2e48',line:'#3ddbd9',wall:'#14122b'},museum:{floor:'#5a5048',line:'#4a4038',wall:'#2a2420'},
  fun:{floor:'#ffd8ec',line:'#ffc0e0',wall:'#7a5aff'},princess:{floor:'#ffe0f0',line:'#ffd0e8',wall:'#ff8ac0',rug:'#c890ff'},cloud:{floor:'#f4f8ff',line:'#e0ecfa',wall:'#9ad0ff',holeCol:'#7ac4f4'}};
function createPillow(env,opts){
  const si=clamp(opts.stage|0,0,PILLOW.length-1),ST=PILLOW[si],TH=PTH[ST.th],OP=opts.options||{},R=roster(opts),{net,host,me,local2}=R,client=!!net&&!host;
  const DUR=+OP.ptime||90,LV=Math.max(0,['easy','normal','hard'].indexOf(OP.lv||'normal'));
  const {ctx:c,canvas}=env.canvas2d(W,H);
  const OBS=ST.obs.map(([k,x,y,w,h])=>{ if(x-AX0<36) x=AX0; if(AX1-x-w<36) x=AX1-w; if(y-AY0<36) y=AY0; if(AY1-y-h<36) y=AY1-h; return {k,x,y,w,h}; }), // 家具離牆太近就貼牆，不留卡人的窄縫
    ZN=(ST.zones||[]).map(([k,x,y,w,h])=>({k,x,y,w,h}));
  const starts=[[120,AY0+60],[AX1-90,AY1-50],[AX1-90,AY0+60],[120,AY1-50]];
  const F=[]; for(let i=0;i<R.n;i++){ const [x,y]=free(starts[i][0],starts[i][1]); F.push({i,x,y,vx:0,vy:0,fx:i%2?-1:1,fy:0,dir:i%2?2:3,pillow:true,big:0,spd:0,bomb:false,dizzy:0,hits:0,stun:0,score:0,swing:0,cd:0,inv:1.5,fall:0,hs:0,team:R.team[i],
    human:i<R.humans,local:i<R.humans&&(!net||i===me),remote:i<R.humans&&!!net&&i!==me,ai:i>=R.humans?{skill:clamp(.45+ST.stars*.07+LV*.15+(i-R.humans)*.03,.3,1),t:0,wx:0,wy:0}:null}); }
  function blocked(x,y,r){ if(x<AX0+r||x>AX1-r||y<AY0+r||y>AY1-r) return true; for(const o of OBS) if(x>o.x-r&&x<o.x+o.w+r&&y>o.y-r*.6&&y<o.y+o.h+r*.4) return true; return false; }
  function free(x,y){ for(let k=0;k<60;k++){ const a=k*2.4,d=k*6,X=x+Math.cos(a)*d,Y=y+Math.sin(a)*d; if(!blocked(X,Y,14)&&!zoneAt(X,Y,'hole')) return [X,Y]; } return [x,y]; }
  function zoneAt(x,y,k){ for(const z of ZN) if(z.k===k&&x>z.x&&x<z.x+z.w&&y>z.y&&y<z.y+z.h) return z; return null; }
  let t=0,timeLeft=DUR,cd=3,intro=3,fxs=[],floor=[],proj=[],powers=[],ev=[],powT=8,cer=null,ended=false,sendT=0,lastBeep=4,lastTick=99,nextId=1,feathers=[];
  const foe=(a,b)=>a!==b&&(R.team[a.i]==null||R.team[a.i]!==R.team[b.i]);
  const fx=(k,x,y,o)=>{ fxs.push(Object.assign({k,x,y,t:0},o||{})); if(host&&net) ev.push([k,R1(x),R1(y),o&&o.s||'']); };
  const snd=n=>{ env.sfx(n); if(host&&net) ev.push(['s',n]); };
  function featherBurst(x,y,n){ for(let k=0;k<n;k++) feathers.push({x,y,vx:(Math.random()-.5)*200,vy:-60-Math.random()*120,a:Math.random()*6,t:0}); }
  function hitP(a,b,kn,pts,kind){ if(b.inv>0||b.fall>0) return;
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,boost=zoneAt(b.x,b.y,'tramp')?1.35:1,dz=b.dizzy>0?1.6:1;
    b.vx=dx/d*kn*boost*dz; b.vy=dy/d*kn*boost*dz; b.stun=.35; b.inv=.9; /* 被打中後短暫無敵，不會被連續狂打 */ b.hits++; b.hs++; a.score+=pts; let msg='+'+pts;
    if(b.hits>=3&&b.dizzy<=0){ b.dizzy=1.7; b.hits=0; a.score+=2; msg='+'+(pts+2)+' 暈了！'; snd('boom'); } else snd('hurt');
    fx('hit',b.x,b.y-20,{s:msg}); featherBurst(b.x,b.y-18,kind==='bomb'?18:10); if(host&&net) ev.push(['fe',R1(b.x),R1(b.y-18),kind==='bomb'?18:10]); }
  function swing(f){ if(f.cd>0||f.stun>0||f.dizzy>0||f.fall>0) return; f.swing=.28; f.cd=.45; f.didHit=false; snd('click'); }
  function throwP(f){ if(f.cd>0||f.stun>0||f.dizzy>0||f.fall>0) return;
    if(f.bomb){ f.bomb=false; proj.push({id:nextId++,k:'fbomb',x:f.x+f.fx*24,y:f.y+f.fy*24,vx:0,vy:0,own:f.i,t:0}); f.cd=.4; snd('place'); return; }
    if(!f.pillow) return; f.pillow=false; const d=Math.hypot(f.fx,f.fy)||1; proj.push({id:nextId++,k:'pillow',x:f.x+f.fx/d*18,y:f.y-14+f.fy/d*18,vx:f.fx/d*600,vy:f.fy/d*600,own:f.i,t:0,big:f.big>0}); f.cd=.35; snd('place'); }
  function stepF(f,inp,dt){
    if(f.fall>0){ f.fall-=dt; if(f.fall<=0){ const [x,y]=free(W/2,H/2+20); f.x=x; f.y=y; f.vx=f.vy=0; f.inv=1.5; } return; }
    if(f.inv>0) f.inv-=dt; if(f.big>0) f.big-=dt; if(f.spd>0) f.spd-=dt; if(f.cd>0) f.cd-=dt; if(f.dizzy>0) f.dizzy-=dt;
    const ice=zoneAt(f.x,f.y,'ice'),wat=zoneAt(f.x,f.y,'water'),tr=zoneAt(f.x,f.y,'tramp');
    let mx=inp.mx,my=inp.my; if(f.stun>0){ f.stun-=dt; mx=my=0; } if(f.dizzy>0){ mx=Math.sin(t*5+f.i)*.8; my=Math.cos(t*4+f.i)*.8; }
    const sp=(f.spd>0?270:190)*(wat?.55:1)*(tr?1.2:1),acc=ice?1.5:12,l=Math.hypot(mx,my)||1;
    f.vx+=((mx/l)*sp*(mx||my?1:0)-f.vx)*Math.min(1,acc*dt); f.vy+=((my/l)*sp*(mx||my?1:0)-f.vy)*Math.min(1,acc*dt);
    if(mx||my){ if(f.stun<=0&&f.dizzy<=0){ f.fx=mx/l; f.fy=my/l; } f.dir=Math.abs(mx)>Math.abs(my)?(mx<0?2:3):(my<0?0:1); }
    const nx=f.x+f.vx*dt,ny=f.y+f.vy*dt; if(!blocked(nx,f.y,14)) f.x=nx; else f.vx*=-.3; if(!blocked(f.x,ny,14)) f.y=ny; else f.vy*=-.3;
    if(zoneAt(f.x,f.y,'hole')&&!client){ f.fall=1.6; f.score=Math.max(0,f.score-1); f.hs++; fx('txt',f.x,f.y-30,{s:'掉下去了 -1'}); snd('die'); f.pillow=true; return; }
    if(inp.atk) f.ba=.25; if(inp.sp) f.bs=.25; f.ba=(f.ba||0)-dt; f.bs=(f.bs||0)-dt;
    if(f.ba>0&&f.cd<=0&&f.stun<=0&&f.dizzy<=0){ // 攻擊鍵：自動轉向最近的對手，近的揮、遠的丟
      let tg=null,td=1e9; for(const g of F){ if(!foe(f,g)||g.fall>0) continue; const d=Math.hypot(g.x-f.x,g.y-f.y); if(d<td){ td=d; tg=g; } }
      if(tg&&td<360){ f.fx=(tg.x-f.x)/(td||1); f.fy=(tg.y-f.y)/(td||1); f.dir=Math.abs(f.fx)>Math.abs(f.fy)?(f.fx<0?2:3):(f.fy<0?0:1); }
      const reach=(f.pillow?(f.big>0?80:54):34)+20; f.ba=0; if(tg&&td>reach&&f.pillow&&td<360) throwP(f); else swing(f); }
    if(f.bs>0&&f.cd<=0&&f.stun<=0&&f.dizzy<=0){ f.bs=0; if(f.bomb) throwP(f); else if(f.pillow){ throwP(f); } }
    if(f.swing>0){ f.swing-=dt; if(!f.didHit&&f.swing<.18&&!client){ f.didHit=true; const r=f.pillow?(f.big>0?80:54):34;
        for(const g of F){ if(!foe(f,g)||g.fall>0) continue; const dx=g.x-f.x,dy=g.y-f.y,d=Math.hypot(dx,dy); if(d>r+12) continue; if((dx*f.fx+dy*f.fy)/(d||1)<.15&&d>18) continue; hitP(f,g,f.pillow?(f.big>0?520:330):170,f.pillow?1:1,'swing'); } } }
    // 撿地上的枕頭、道具
    if(!client){ if(!f.pillow) for(let n=floor.length-1;n>=0;n--){ const p=floor[n]; if(Math.hypot(p.x-f.x,p.y-f.y)<26){ floor.splice(n,1); f.pillow=true; snd('click'); break; } }
      for(let n=powers.length-1;n>=0;n--){ const p=powers[n]; if(Math.hypot(p.x-f.x,p.y-f.y)<26){ powers.splice(n,1); if(p.k==='big'){ f.big=8; fx('txt',f.x,f.y-40,{s:'巨無霸枕頭！'}); } else if(p.k==='spd'){ f.spd=7; fx('txt',f.x,f.y-40,{s:'加速拖鞋！'}); } else { f.bomb=true; fx('txt',f.x,f.y-40,{s:'羽毛炸彈！按丟放下'}); } snd('item'); break; } } } }
  function stepWorld(dt){
    for(let n=proj.length-1;n>=0;n--){ const b=proj[n]; b.t+=dt;
      if(b.k==='fbomb'){ if(b.t>.9){ proj.splice(n,1); if(client) continue; fx('boom',b.x,b.y); snd('boom'); for(const g of F){ if(!foe(F[b.own],g)) continue; if(Math.hypot(g.x-b.x,g.y-b.y)<120){ g.hits++; hitP({i:b.own,x:b.x,y:b.y,score:0,get score(){return F[b.own].score;},set score(v){F[b.own].score=v;}},g,460,1,'bomb'); } } featherBurst(b.x,b.y,40); if(host&&net) ev.push(['fe',R1(b.x),R1(b.y),40]); } continue; }
      b.x+=b.vx*dt; b.y+=b.vy*dt; let land=b.t>1.1||blocked(b.x,b.y+14,6);
      if(!client) for(const g of F){ if(g.i===b.own||!foe(F[b.own],g)||g.fall>0) continue; if(Math.hypot(g.x-b.x,g.y-14-b.y)<(b.big?34:24)){ hitP(F[b.own],g,b.big?460:300,1,'throw'); land=true; break; } }
      if(land){ proj.splice(n,1); if(!client){ let x=clamp(b.x,AX0+20,AX1-20),y=clamp(b.y+14,AY0+20,AY1-20); [x,y]=free(x,y); if(!zoneAt(x,y,'hole')) floor.push({id:nextId++,x,y}); } } }
    if(!client){ const want=R.n+2,held=F.filter(f=>f.pillow).length+proj.filter(p=>p.k==='pillow').length; if(floor.length+held<want){ const [x,y]=free(AX0+60+Math.random()*(AX1-AX0-120),AY0+60+Math.random()*(AY1-AY0-120)); if(!zoneAt(x,y,'hole')) floor.push({id:nextId++,x,y}); }
      powT-=dt; if(powT<=0&&powers.length<2){ powT=9+Math.random()*6; const [x,y]=free(AX0+80+Math.random()*(AX1-AX0-160),AY0+80+Math.random()*(AY1-AY0-160)); if(!zoneAt(x,y,'hole')) powers.push({id:nextId++,k:['big','spd','bomb'][(Math.random()*3)|0],x,y}); } }
    for(const fe of feathers){ fe.t+=dt; fe.x+=fe.vx*dt; fe.y+=fe.vy*dt; fe.vy+=140*dt; fe.vx*=.98; fe.a+=dt*4; } feathers=feathers.filter(fe=>fe.t<1.6); }
  function lineClear(a,b){ for(let k=1;k<10;k++){ const x=lerp(a.x,b.x,k/10),y=lerp(a.y,b.y,k/10); if(blocked(x,y,4)) return false; } return true; }
  function aiInput(f,dt){ const a=f.ai,inp={mx:0,my:0,atk:false,sp:false};
    if(f.fall>0||f.stun>0||f.dizzy>0) return inp;
    let goal=null;
    if(!f.pillow&&!f.bomb){ let bd=1e9; for(const p of floor){ const d=Math.hypot(p.x-f.x,p.y-f.y); if(d<bd){ bd=d; goal=p; } } }
    const pw=powers.find(p=>Math.hypot(p.x-f.x,p.y-f.y)<160); if(pw&&Math.random()<a.skill) goal=pw;
    let tg=null,td=1e9; for(const g of F){ if(!foe(f,g)||g.fall>0) continue; const d=Math.hypot(g.x-f.x,g.y-f.y)+(g.inv>0?200:0); if(d<td){ td=d; tg=g; } }
    if(!goal&&tg){ goal=tg; a.t-=dt; const close=td<(f.big>0?70:48);
      if(close&&a.t<=0){ a.t=(1.15-a.skill*.5)*(.7+Math.random()*.6); f.fx=(tg.x-f.x)/(td||1); f.fy=(tg.y-f.y)/(td||1); inp.atk=true; }
      else if((f.pillow||f.bomb)&&td>110&&td<300&&a.t<=0&&lineClear(f,tg)&&Math.random()<.02+a.skill*.03){ a.t=1; f.fx=(tg.x-f.x)/td; f.fy=(tg.y-f.y)/td; inp.sp=true; }
      if(f.bomb&&td<120&&a.t<=0){ inp.sp=true; a.t=1.2; } }
    a.ck=(a.ck||0)+dt; if(a.ck>1){ a.ck=0; if(Math.hypot(f.x-(a.px||0),f.y-(a.py||0))<12) a.wand=1.2; a.px=f.x; a.py=f.y; } // 卡住了就亂走一下
    if(a.wand>0){ a.wand-=dt; if(!a.wd||Math.random()<.02) a.wd=[Math.random()*2-1,Math.random()*2-1]; inp.mx=a.wd[0]; inp.my=a.wd[1]; return inp; }
    if(goal){ let dx=goal.x-f.x,dy=goal.y-f.y; const d=Math.hypot(dx,dy)||1; if(d>(goal===tg?36:4)){ dx/=d; dy/=d;
        if(blocked(f.x+dx*18,f.y+dy*18,14)||zoneAt(f.x+dx*30,f.y+dy*30,'hole')){ const s=(f.i%2?1:-1); const ex=-dy*s,ey=dx*s; dx=dx*.3+ex; dy=dy*.3+ey; } // 繞過家具
        inp.mx=clamp(dx*1.4,-1,1); inp.my=clamp(dy*1.4,-1,1); } }
    return inp; }
  // 連線
  const pk=f=>[f.i,R1(f.x),R1(f.y),R1(f.vx),R1(f.vy),R1(f.fx),R1(f.fy),f.dir,f.pillow?1:0,R1(f.big),R1(f.spd),f.bomb?1:0,R1(f.dizzy),f.hits,R1(f.stun),f.score,R1(f.swing),R1(f.inv),R1(f.fall),f.hs];
  function unpk(a){ const f=F[a[0]]; if(!f) return; const mine=f.local,newHit=a[19]!==f.hs;
    if(!mine||newHit||a[18]>0){ f.x=a[1]; f.y=a[2]; f.vx=a[3]; f.vy=a[4]; }
    if(!mine){ f.fx=a[5]; f.fy=a[6]; f.dir=a[7]; f.swing=a[16]; }
    f.pillow=!!a[8]; f.big=a[9]; f.spd=a[10]; f.bomb=!!a[11]; f.dizzy=a[12]; f.hits=a[13]; if(newHit) f.stun=a[14]; f.score=a[15]; f.inv=a[17]; f.fall=a[18]; f.hs=a[19]; }
  const inBuf={};
  if(net){
    if(client) net.onmsg=m=>{ if(m.s){ m.s.f.forEach(unpk); floor=m.s.fl.map(a=>({id:a[0],x:a[1],y:a[2]})); powers=m.s.pw.map(a=>({id:a[0],k:a[1],x:a[2],y:a[3]})); proj=m.s.pr.map(a=>({id:a[0],k:a[1],x:a[2],y:a[3],vx:a[4],vy:a[5],own:a[6],t:a[7],big:!!a[8]})); timeLeft=m.s.tl; t=m.s.t; if(m.s.cd!=null) cd=m.s.cd;
        for(const e of m.s.ev){ if(e[0]==='s') env.sfx(e[1]); else if(e[0]==='fe') featherBurst(e[1],e[2],e[3]); else fxs.push({k:e[0],x:e[1],y:e[2],t:0,s:e[3]}); } }
      if(m.end) cer={t:0,order:m.end.map(i=>F[i])}; };
    else { net.onmsg=(m,from)=>{ const f=F[from]; if(!f) return; if(m.i){ const b=inBuf[from]||(inBuf[from]={...NOIN}); b.mx=m.i[0]; b.my=m.i[1]; if(m.i[3]) b.atk=true; if(m.i[4]) b.sp=true; }
        if(m.q&&f.stun<=0&&f.fall<=0&&m.q[6]===f.hs){ f.x=m.q[0]; f.y=m.q[1]; f.vx=m.q[2]; f.vy=m.q[3]; if(f.dizzy<=0){ f.fx=m.q[4]; f.fy=m.q[5]; } f.dir=m.q[7]; } };
      net.onleave=i=>{ if(F[i]){ F[i].remote=false; F[i].ai={skill:.6,t:0}; R.names[i]+='（離開）'; } }; }
  }
  let myIn={...NOIN},sentHit={a:0,s:0};
  function update(dt){
    if(cer){ cer.t+=dt; if(cer.t>4.5&&!cer.done){ cer.done=true; finish(); } return; }
    for(const e of fxs) e.t+=dt; fxs=fxs.filter(e=>e.t<1.1);
    if(intro>0){ intro-=dt; if(!net&&(env.hit('Space')||env.hit('Enter'))) intro=0; if(intro>0) return; }
    if(cd>0){ cd-=dt; const n=Math.ceil(cd); if(n<lastBeep&&n>=1){ lastBeep=n; env.sfx('beep'); } if(cd<=0) env.sfx('go'); return; }
    const steps=Math.max(1,Math.ceil(dt/(1/60))),h=dt/steps;
    for(let s=0;s<steps;s++){ t+=h; if(!client) timeLeft-=h;
      for(const f of F){ let inp=NOIN;
        if(f.local){ inp=readInput(env,local2?f.i:0,local2,true); if(s>0) inp={...inp,atk:false,sp:false}; if(client){ if(inp.atk) sentHit.a++; if(inp.sp) sentHit.s++; myIn=inp; if(inp.atk&&f.swing<=0&&f.cd<=0&&f.stun<=0&&f.dizzy<=0){ f.swing=.28; f.cd=.45; f.didHit=true; } inp={...inp,atk:false,sp:false}; } }
        else if(f.remote){ if(client){ f.x+=f.vx*h; f.y+=f.vy*h; continue; } const b=inBuf[f.i]||NOIN; inp={...b,jump:false}; if(inBuf[f.i]) inBuf[f.i].atk=inBuf[f.i].sp=false; }
        else if(f.ai){ if(client){ f.x+=f.vx*h; f.y+=f.vy*h; continue; } inp=aiInput(f,h); }
        stepF(f,inp,h); }
      stepWorld(h); }
    if(!client){ const c2=Math.ceil(timeLeft); if(c2<lastTick&&c2<=5&&c2>=1) env.sfx('beep'); lastTick=c2; }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/20;
      if(host){ net.send({s:{f:F.map(pk),fl:floor.map(p=>[p.id,R1(p.x),R1(p.y)]),pw:powers.map(p=>[p.id,p.k,R1(p.x),R1(p.y)]),pr:proj.map(b=>[b.id,b.k,R1(b.x),R1(b.y),R1(b.vx),R1(b.vy),b.own,R1(b.t),b.big?1:0]),tl:R1(timeLeft),t:R1(t),cd:R1(cd),ev}}); ev=[]; }
      else { const f=F[me]; net.send({i:[myIn.mx,myIn.my,0,sentHit.a,sentHit.s],q:[R1(f.x),R1(f.y),R1(f.vx),R1(f.vy),R1(f.fx),R1(f.fy),f.hs,f.dir]}); sentHit={a:0,s:0}; } } }
    if(!client&&!ended&&timeLeft<=0){ ended=true; const order=F.slice().sort((a,b)=>b.score-a.score); cer={t:0,order}; env.sfx('win'); if(net) net.send({end:order.map(f=>f.i)}); } }
  function teamPts(){ const p=[0,0]; F.forEach(f=>{ if(R.team[f.i]!=null) p[R.team[f.i]]+=f.score; }); return p; }
  function finish(){ const order=cer.order; let title,won,text='打中一下 1 分，讓對手頭暈多 2 分，掉進洞裡扣 1 分。';
    const rows=order.map((f,i)=>'<tr><td>'+(i+1)+'</td><td>'+(f.team!=null?'<span style="color:'+R.TEAMS[f.team].col+'">●</span> ':'')+R.names[f.i]+'</td><td>'+f.score+' 分</td></tr>').join('');
    const html='<table class="ls"><tr><th>名次</th><th>選手</th><th>得分</th></tr>'+rows+'</table>';
    if(R.mode!=='ffa'){ const p=teamPts(),w=p[0]===p[1]?-1:p[0]>p[1]?0:1; won=w>=0&&R.team[me]===w; title=w<0?'平手！':local2?R.TEAMS[w].name+'獲勝！':won?'你的隊伍贏了！':R.TEAMS[w].name+'獲勝'; text=R.TEAMS[0].name+' '+p[0]+' 分 vs '+R.TEAMS[1].name+' '+p[1]+' 分。'+text; }
    else { const top=order[0].score,ws=order.filter(f=>f.score===top); won=ws.some(f=>f.i===me); title=ws.length>1?'平手！'+ws.map(f=>R.names[f.i]).join('、'):local2?R.names[ws[0].i]+' 獲勝！':won?'你贏了！':R.names[ws[0].i]+' 獲勝'; }
    if(won&&!net&&!local2) recWin('pillow',ST.name);
    env.sfx(won||local2?'win':'lose'); env.end({title,big:ST.name,html,text,score:null,next:!net&&won&&si<PILLOW.length-1}); }
  function draw(){
    if(cer){ podium(c,cer.order,R,cer.t,()=>pillowRoom(c,ST,TH,OBS,ZN,cer.t)); c.fillStyle='#ffd23f'; c.font='900 30px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=6; c.strokeStyle='#0b0a1c'; const p=teamPts(),tx=R.mode!=='ffa'?(p[0]===p[1]?'平手！':R.TEAMS[p[0]>p[1]?0:1].name+' 獲勝！'):R.names[cer.order[0].i]+' 第一名！'; c.strokeText(tx,W/2,50); c.fillText(tx,W/2,50); return; }
    pillowRoom(c,ST,TH,OBS,ZN,t);
    for(const p of floor) drawPillow(c,p.x,p.y,0,1,t,false);
    for(const p of powers){ const b=Math.sin(t*4+p.id)*3; glow(c,p.x,p.y-8+b,26,'rgba(255,240,150,.5)'); c.font='22px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(p.k==='big'?'🛏':p.k==='spd'?'🩴':'💣',p.x,p.y-8+b); }
    const list=F.slice().sort((a,b)=>a.y-b.y);
    for(const f of list){ if(f.fall>0){ c.save(); c.globalAlpha=Math.max(0,f.fall-.8); const s=Math.max(.2,f.fall/1.6); c.translate(f.x,f.y); c.scale(s,s); c.translate(-f.x,-f.y); person(c,f.x,f.y,R.looks[f.i],f.i,1,false,t,1.15); c.restore(); continue; }
      if(f.inv>0&&Math.floor(t*12)%2) c.globalAlpha=.5;
      const moving=Math.hypot(f.vx,f.vy)>30,tr=zoneAt(f.x,f.y,'tramp'),hop=tr?Math.abs(Math.sin(t*7+f.i))*10:0;
      if(f.spd>0){ c.fillStyle='rgba(120,220,255,.4)'; c.beginPath(); c.ellipse(f.x,f.y+2,18,6,0,0,7); c.fill(); }
      // 枕頭：揮的時候往面向的方向畫弧，不然拿在旁邊
      const sw=f.swing>0?(1-f.swing/.28):-1,ang=Math.atan2(f.fy,f.fx);
      if(f.pillow&&f.dir===0) drawPillow(c,f.x+f.fx*16,f.y-26-hop,ang,f.big>0?1.6:1,t,true);
      c.save(); c.translate(0,-hop); person(c,f.x,f.y,R.looks[f.i],f.i,f.dir,moving,t+f.i,1.15); c.restore(); c.globalAlpha=1;
      if(f.pillow&&f.dir!==0){ if(sw>=0){ const a2=ang-1.2+sw*2.4; drawPillow(c,f.x+Math.cos(a2)*30,f.y-16+Math.sin(a2)*18-hop,a2,f.big>0?1.6:1,t,true); c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=4; c.beginPath(); c.ellipse(f.x,f.y-16,f.big>0?60:38,f.big>0?36:22,0,ang-1.2,ang-1.2+sw*2.4); c.stroke(); }
        else drawPillow(c,f.x+f.fx*18+(f.fx?0:14),f.y-14+f.fy*8-hop,ang*.2,f.big>0?1.6:1,t,true); }
      else if(sw>=0){ c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=3; c.beginPath(); c.arc(f.x+f.fx*16,f.y-16+f.fy*10,12,0,7); c.stroke(); }
      if(f.bomb){ c.font='16px '+TC; c.textAlign='center'; c.fillText('💣',f.x+14,f.y-46); }
      if(f.dizzy>0) for(let k=0;k<3;k++){ const a=t*7+k*2.1; c.fillStyle='#ffd23f'; c.font='13px '+TC; c.textAlign='center'; c.fillText('★',f.x+Math.cos(a)*16,f.y-52+Math.sin(a)*5); }
      for(let k=0;k<f.hits;k++){ c.fillStyle='#ff8a8a'; c.beginPath(); c.arc(f.x-6+k*6,f.y+20,2.4,0,7); c.fill(); }
      const tag=f.local?(local2?(f.i+1)+'P':'你'):R.names[f.i],tc=f.team!=null?R.TEAMS[f.team].col:f.local?'#ffd23f':'#fff';
      c.font='900 12px '+TC; c.textAlign='center'; c.textBaseline='bottom'; c.lineWidth=3; c.strokeStyle='#0b0a1c'; c.strokeText(tag+' '+f.score,f.x,f.y-50-hop); c.fillStyle=tc; c.fillText(tag+' '+f.score,f.x,f.y-50-hop);
      if((intro>0||cd>0)&&f.local) meArrow(c,f.x,f.y-66,local2?(f.i+1)+'P':'你',t+intro); }
    for(const b of proj){ if(b.k==='fbomb'){ c.font='20px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('💣',b.x,b.y); c.strokeStyle='rgba(255,90,60,'+(.4+.4*Math.sin(t*30))+')'; c.lineWidth=2; c.beginPath(); c.arc(b.x,b.y,120,0,7); c.stroke(); } else drawPillow(c,b.x,b.y,b.t*14,b.big?1.6:1,t,true); }
    for(const fe of feathers){ c.save(); c.translate(fe.x,fe.y); c.rotate(Math.sin(fe.a)*.8); c.globalAlpha=Math.max(0,1-fe.t/1.6); c.fillStyle='#fff'; c.beginPath(); c.ellipse(0,0,6,2.4,0,0,7); c.fill(); c.strokeStyle='#d8d8e0'; c.lineWidth=.8; c.beginPath(); c.moveTo(-6,0); c.lineTo(6,0); c.stroke(); c.restore(); }
    for(const e of fxs){ const u=e.t; if(e.k==='boom') glow(c,e.x,e.y,40+u*140,'rgba(255,255,255,'+(.8-u*.7)+')'); else if(e.s){ c.fillStyle='#ffd23f'; c.font='900 15px '+TC; c.textAlign='center'; c.lineWidth=4; c.strokeStyle='#0b0a1c'; c.strokeText(e.s,e.x,e.y-u*30); c.fillText(e.s,e.x,e.y-u*30); } }
    // 上方：時間、分數
    c.fillStyle='rgba(11,10,28,.78)'; c.fillRect(0,0,W,AY0-6); const tl=Math.max(0,Math.ceil(timeLeft)); c.fillStyle=tl<=10?'#ff8a8a':'#fff'; c.font='900 20px '+PIX; c.textAlign='center'; c.textBaseline='middle'; c.fillText(Math.floor(tl/60)+':'+String(tl%60).padStart(2,'0'),W/2,25);
    const half=F.length/2; F.forEach((f,j)=>{ const x=j<half?20+j*170:W-20-(F.length-1-j)*170-150; person(c,x+14,46,R.looks[f.i],f.i,1,false,t,.62);
      c.fillStyle=f.team!=null?R.TEAMS[f.team].col:'#fff'; c.font='900 12px '+TC; c.textAlign='left'; c.fillText(R.names[f.i],x+32,16); c.fillStyle='#ffd23f'; c.font='900 18px '+PIX; c.fillText(String(f.score),x+32,36); });
    if(R.mode!=='ffa'){ const p=teamPts(); c.font='900 12px '+TC; c.textAlign='center'; c.fillStyle=R.TEAMS[0].col; c.fillText(R.TEAMS[0].name+' '+p[0],W/2-60,44); c.fillStyle=R.TEAMS[1].col; c.fillText(R.TEAMS[1].name+' '+p[1],W/2+60,44); }
    if(intro>0){ c.fillStyle='rgba(11,10,28,.6)'; rr(c,W/2-210,170,420,80,16); c.fill(); c.fillStyle='#ffd23f'; c.font='900 26px '+TC; c.textAlign='center'; c.fillText(ST.name,W/2,198); c.fillStyle='#fff'; c.font='700 13px '+TC; c.fillText(DUR+' 秒內打中最多下的人贏！連中 3 下對手會頭暈',W/2,228); }
    else if(cd>0){ const n=Math.ceil(cd); c.font='900 80px '+PIX; c.textAlign='center'; c.lineWidth=10; c.strokeStyle='#0b0a1c'; c.strokeText(String(n),W/2,H*.5); c.fillStyle='#ffd23f'; c.fillText(String(n),W/2,H*.5); }
    else if(t<.8){ c.font='900 60px '+PIX; c.textAlign='center'; c.lineWidth=10; c.strokeStyle='#0b0a1c'; c.strokeText('GO!',W/2,H*.5); c.fillStyle='#5fd068'; c.fillText('GO!',W/2,H*.5); } }
  return {update,draw,destroy(){},_dbg:{F,R,get t(){return t;},get timeLeft(){return timeLeft;},skip(){ intro=0; cd=0; }}};
}
function drawPillow(c,x,y,a,s,t,held){ c.save(); c.translate(x,y); c.rotate(a||0); c.scale(s||1,s||1);
  if(!held){ c.fillStyle='rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(1,6,16,5,0,0,7); c.fill(); }
  c.fillStyle='#fdfcff'; c.beginPath(); c.moveTo(-15,-8); c.quadraticCurveTo(0,-13,15,-8); c.quadraticCurveTo(19,0,15,8); c.quadraticCurveTo(0,13,-15,8); c.quadraticCurveTo(-19,0,-15,-8); c.fill();
  c.strokeStyle='#b8b4d0'; c.lineWidth=1.3; c.stroke(); c.strokeStyle='rgba(120,160,255,.6)'; c.lineWidth=2; c.beginPath(); c.moveTo(-9,-6); c.lineTo(-9,6); c.moveTo(9,-6); c.lineTo(9,6); c.stroke(); c.restore(); }
function pillowRoom(c,ST,TH,OBS,ZN,t){
  c.fillStyle=TH.wall; c.fillRect(0,0,W,H);
  c.fillStyle=TH.floor; c.fillRect(AX0,AY0,AX1-AX0,AY1-AY0);
  c.strokeStyle=TH.line; c.lineWidth=1;
  if(TH.tatami){ c.lineWidth=3; for(let x=AX0;x<AX1;x+=148) for(let y=AY0;y<AY1;y+=86) c.strokeRect(x,y,148,86); }
  else if(TH.grass){ c.fillStyle='rgba(30,80,25,.25)'; for(let i=0;i<120;i++) c.fillRect(AX0+(i*137)%(AX1-AX0),AY0+(i*71)%(AY1-AY0),3,6); }
  else if(ST.th==='space'){ c.strokeStyle='rgba(61,219,217,.25)'; for(let x=AX0;x<AX1;x+=40){ c.beginPath(); c.moveTo(x,AY0); c.lineTo(x,AY1); c.stroke(); } for(let y=AY0;y<AY1;y+=40){ c.beginPath(); c.moveTo(AX0,y); c.lineTo(AX1,y); c.stroke(); } }
  else for(let y=AY0+24;y<AY1;y+=24){ c.beginPath(); c.moveTo(AX0,y); c.lineTo(AX1,y); c.stroke(); }
  if(TH.rug){ c.fillStyle=TH.rug; rr(c,W/2-150,H/2-70,300,160,30); c.fill(); c.strokeStyle='rgba(255,220,150,.6)'; c.lineWidth=4; rr(c,W/2-140,H/2-60,280,140,24); c.stroke(); }
  for(const z of ZN){ if(z.k==='tramp'){ c.fillStyle='#3d8bff'; rr(c,z.x,z.y,z.w,z.h,16); c.fill(); c.fillStyle='#f4f8ff'; rr(c,z.x+8,z.y+8,z.w-16,z.h-16,12); c.fill(); c.fillStyle='rgba(61,139,255,.25)'; for(let k=0;k<3;k++){ c.beginPath(); c.ellipse(z.x+z.w/2,z.y+z.h/2,(z.w-30)/2*(1-k*.3),(z.h-30)/2*(1-k*.3),0,0,7); c.fill(); } c.fillStyle='#5a3a22'; c.font='900 12px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('彈跳床',z.x+z.w/2,z.y+z.h/2); }
    else if(z.k==='ice'){ c.fillStyle='rgba(170,220,255,.55)'; c.fillRect(z.x,z.y,z.w,z.h); c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=1; for(let i=0;i<12;i++){ c.beginPath(); c.moveTo(z.x+(i*97)%z.w,z.y+(i*43)%z.h); c.lineTo(z.x+(i*97)%z.w+30,z.y+(i*43)%z.h+10); c.stroke(); } }
    else if(z.k==='water'){ c.fillStyle='#4aa8e8'; rr(c,z.x,z.y,z.w,z.h,14); c.fill(); c.strokeStyle='rgba(255,255,255,.5)'; c.lineWidth=2; for(let i=0;i<6;i++){ c.beginPath(); const yy=z.y+12+i*z.h/6; for(let x=z.x+6;x<z.x+z.w-6;x+=8) c.lineTo(x,yy+Math.sin(x/12+t*3)*2); c.stroke(); } }
    else if(z.k==='hole'){ c.fillStyle=TH.holeCol||'#14122b'; rr(c,z.x,z.y,z.w,z.h,18); c.fill(); if(TH.holeCol){ c.fillStyle='rgba(255,255,255,.7)'; for(let i=0;i<3;i++){ c.beginPath(); c.arc(z.x+20+i*30+Math.sin(t+i)*6,z.y+z.h/2,10,0,7); c.fill(); } } else { const g=c.createRadialGradient(z.x+z.w/2,z.y+z.h/2,4,z.x+z.w/2,z.y+z.h/2,Math.max(z.w,z.h)/2); g.addColorStop(0,'#000'); g.addColorStop(1,'#3a2a4a'); c.fillStyle=g; rr(c,z.x,z.y,z.w,z.h,18); c.fill(); } c.fillStyle='#fff'; c.font='900 11px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('小心掉下去',z.x+z.w/2,z.y+z.h/2); } }
  for(const o of OBS) drawObs(c,o,TH,t);
  c.strokeStyle='rgba(0,0,0,.35)'; c.lineWidth=4; c.strokeRect(AX0,AY0,AX1-AX0,AY1-AY0); }
function drawObs(c,o,TH,t){ const {x,y,w,h}=o; c.fillStyle='rgba(0,0,0,.18)'; rr(c,x+4,y+6,w,h,8); c.fill();
  switch(o.k){
    case 'bed': c.fillStyle='#8a5a32'; rr(c,x,y,w,h,8); c.fill(); c.fillStyle='#f4f4fa'; rr(c,x+6,y+6,w-12,h-12,6); c.fill(); c.fillStyle='#7ab0e8'; rr(c,x+6,y+h*.35,w-12,h*.6,6); c.fill(); drawPillow(c,x+w/2,y+h*.2,0,w/60,t,true); break;
    case 'ward': c.fillStyle='#a8784a'; rr(c,x,y,w,h,4); c.fill(); c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=2; c.beginPath(); c.moveTo(x+w/2,y+4); c.lineTo(x+w/2,y+h-4); c.stroke(); break;
    case 'desk': case 'lowtable': c.fillStyle=o.k==='desk'?'#c8904a':'#7a4a2a'; rr(c,x,y,w,h,6); c.fill(); c.fillStyle='rgba(255,255,255,.2)'; c.fillRect(x+6,y+6,w-12,6); if(o.k==='lowtable'){ c.fillStyle='#f4f0e6'; c.beginPath(); c.arc(x+w*.3,y+h/2,8,0,7); c.arc(x+w*.7,y+h/2,8,0,7); c.fill(); } break;
    case 'sofa': c.fillStyle='#c84a5a'; rr(c,x,y,w,h,14); c.fill(); c.fillStyle='#e06a7a'; rr(c,x+12,y+14,w-24,h-20,10); c.fill(); break;
    case 'table': c.fillStyle='#a8784a'; c.beginPath(); c.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,7); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(x+w/2,y+h/2,8,0,7); c.fill(); break;
    case 'plant': c.fillStyle='#c8603a'; rr(c,x+8,y+h*.5,w-16,h*.5,4); c.fill(); c.fillStyle='#3f9a3a'; c.beginPath(); c.arc(x+w/2,y+h*.4,w*.45,0,7); c.fill(); break;
    case 'tent': c.fillStyle='#e8a020'; c.beginPath(); c.moveTo(x,y+h); c.lineTo(x+w/2,y); c.lineTo(x+w,y+h); c.fill(); c.fillStyle='#5a3a10'; c.beginPath(); c.moveTo(x+w*.4,y+h); c.lineTo(x+w/2,y+h*.45); c.lineTo(x+w*.6,y+h); c.fill(); break;
    case 'fire': c.fillStyle='#6a4a2a'; c.fillRect(x+4,y+h*.6,w-8,8); glow(c,x+w/2,y+h/2,w,'rgba(255,160,60,.6)'); c.fillStyle='#ff8a1a'; c.beginPath(); c.moveTo(x+w*.3,y+h*.7); c.quadraticCurveTo(x+w/2,y-Math.sin(t*9)*4,x+w*.7,y+h*.7); c.fill(); break;
    case 'tree': c.fillStyle='#2f7a3a'; c.beginPath(); c.arc(x+w/2,y+h/2,w/2,0,7); c.fill(); c.fillStyle='#3f9a4a'; c.beginPath(); c.arc(x+w*.4,y+h*.4,w*.3,0,7); c.fill(); break;
    case 'trunk': c.fillStyle='#6a4a2a'; c.beginPath(); c.arc(x+w/2,y+h/2,w/2,0,7); c.fill(); c.strokeStyle='#8a6038'; c.lineWidth=2; for(const r of [.35,.2]){ c.beginPath(); c.arc(x+w/2,y+h/2,w*r,0,7); c.stroke(); } break;
    case 'crate': c.fillStyle='#b8864a'; rr(c,x,y,w,h,4); c.fill(); c.strokeStyle='#7a5432'; c.lineWidth=3; c.strokeRect(x+4,y+4,w-8,h-8); c.beginPath(); c.moveTo(x+4,y+4); c.lineTo(x+w-4,y+h-4); c.stroke(); break;
    case 'lamp': c.fillStyle='#f4ecd8'; rr(c,x,y,w,h,6); c.fill(); glow(c,x+w/2,y+h/2,w,'rgba(255,230,150,.45)'); break;
    case 'snowman': c.fillStyle='#fff'; c.beginPath(); c.arc(x+w/2,y+h*.6,w*.45,0,7); c.arc(x+w/2,y+h*.15,w*.3,0,7); c.fill(); c.fillStyle='#ff8a1a'; c.fillRect(x+w/2,y+h*.12,8,3); break;
    case 'chair': c.fillStyle='#ffd23f'; rr(c,x,y,w,h,6); c.fill(); c.fillStyle='#ff7a5a'; for(let k=0;k<4;k++) c.fillRect(x+6,y+8+k*20,w-12,8); break;
    case 'umbrella': c.fillStyle='#ff4d6d'; c.beginPath(); c.arc(x+w/2,y+h/2,w*.9,0,7); c.fill(); c.fillStyle='#fff'; for(let k=0;k<4;k++){ c.beginPath(); c.moveTo(x+w/2,y+h/2); c.arc(x+w/2,y+h/2,w*.9,k*Math.PI/2,k*Math.PI/2+Math.PI/4); c.fill(); } break;
    case 'pillar': c.fillStyle='#d8d2c2'; c.beginPath(); c.arc(x+w/2,y+h/2,w/2,0,7); c.fill(); c.fillStyle='rgba(0,0,0,.15)'; c.beginPath(); c.arc(x+w/2+4,y+h/2+4,w*.3,0,7); c.fill(); break;
    case 'pod': c.fillStyle='#c8ccd8'; rr(c,x,y,w,h,20); c.fill(); c.fillStyle='#3ddbd9'; rr(c,x+10,y+10,w-20,h-20,14); c.fill(); glow(c,x+w/2,y+h/2,w*.6,'rgba(61,219,217,.3)'); break;
    case 'dino': c.strokeStyle='#e8e0cc'; c.lineWidth=7; c.lineCap='round'; c.beginPath(); c.moveTo(x,y+h*.7); c.lineTo(x+w*.8,y+h*.5); c.quadraticCurveTo(x+w*.95,y,x+w,y+h*.2); c.stroke(); for(let k=0;k<8;k++){ c.beginPath(); c.moveTo(x+w*.15+k*w*.08,y+h*.65-k*2); c.lineTo(x+w*.15+k*w*.08,y+h); c.stroke(); } c.lineCap='butt'; break;
    case 'cloudpuff': c.fillStyle='#fff'; c.beginPath(); c.arc(x+w*.3,y+h*.6,h*.4,0,7); c.arc(x+w*.6,y+h*.4,h*.5,0,7); c.arc(x+w*.85,y+h*.65,h*.35,0,7); c.fill(); break;
    default: c.fillStyle='#8a8580'; rr(c,x,y,w,h,6); c.fill(); } }

/* ===== 註冊 ===== */
const TEAMOPT={key:'team',label:'雙人／連線玩法',def:'ffa',opts:[{id:'ffa',label:'各自分開'},{id:'vs',label:'分隊對戰（電腦補人）'},{id:'pvp',label:'玩家對決（不加電腦）'},{id:'coop',label:'玩家同隊打電腦'}]};
const LVOPT={key:'lv',label:'電腦強度',def:'normal',opts:[{id:'easy',label:'簡單'},{id:'normal',label:'中等'},{id:'hard',label:'困難'}]};
const G=window.ARCADE_GAMES=window.ARCADE_GAMES||{};
G.isle={name:'浮島大混戰',tag:'PARTY BRAWL',color:'#ff8a3d',online:true,maxPlayers:4,bots:true,
  desc:'2～4 人在浮空小島上大亂鬥！被打越多下（％ 越高）飛越遠，把對手打出畫面外就少一條命。球棒、炸彈、愛心、無敵星星，15 座浮島：火山熔岩、冰面、輸送帶、移動平台、太空低重力、海盜砲彈、龍捲風…',
  goal:'把對手打出場外！每被打一下 ％ 會增加，％ 越高飛越遠。被打飛時用二段跳和「↑＋特殊」（往上衝的上勾拳）飛回島上。最後還有命的人（或隊伍）獲勝。',
  stages:ISLE.map(s=>s.name),stars:ISLE.map(s=>s.stars),
  stageGoal:si=>{ const s=ISLE[si],h={lava:'熔岩會定時上漲，要跳到高的平台上。',ice:'地面結冰很滑，不好停。',conveyor:'地面是輸送帶，會把人往一邊送，方向會換。',lowg:'太空低重力，跳得很高、飛得也遠。',cannon:'兩邊會射砲彈過來，碰到會爆炸。',wind:'定時颳強風，把人往一邊吹。'}[s.hz]||''; return s.name+'：把對手打出場外！'+(h?h:'')+(s.plats.some(p=>p[3])?'有會移動的平台。':''); },
  options:[{key:'seats',label:'人數',def:'4',opts:[{id:'2',label:'2 人'},{id:'3',label:'3 人'},{id:'4',label:'4 人'}]},{key:'stock',label:'每人幾條命',def:'3',opts:[{id:'2',label:'2 條'},{id:'3',label:'3 條'},{id:'5',label:'5 條'}]},{key:'items',label:'道具',def:'on',opts:[{id:'on',label:'有'},{id:'off',label:'沒有'}]},LVOPT,TEAMOPT],
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['← →','移動'],['↑ 或 空白鍵','跳（空中可以再跳一次）'],['X','攻擊（連按三連擊；拿到球棒、炸彈會自動揮棒、丟炸彈）'],['C','必殺：大力重擊；被打飛到場外時按 C 會自動往上衝回島上'],['↓','島上：防禦；薄平台上：穿下去'],['W A S D F G','雙人 1P：W 跳、F 攻擊、G 必殺'],['↑ ↓ ← → , .','雙人 2P：↑ 跳、, 攻擊、. 必殺']],
  touchHelp:[['方向盤','移動，↓ 防禦'],['跳','跳，空中再按一次二段跳'],['攻擊','連按三連擊'],['必殺','大力重擊；被打飛時按這個飛回來']],
  touch:{left:'dpad',right:[{l:'跳',c:'Space'},{l:'攻擊',c:'KeyX',act:true},{l:'必殺',c:'KeyC'}]},
  get looks(){ return LOOKS(); },
  hubBest:()=>{ const n=ISLE.filter(s=>hasWin('isle',s.name)).length; return n?'贏過 <b>'+n+' / '+ISLE.length+'</b> 座浮島':'尚無紀錄'; },
  stageBest:i=>hasWin('isle',ISLE[i].name)?'★ 贏過':'',
  stageShow:(ctx,w,h,si,t)=>{ const ST=ISLE[si],TH=ISLE_TH[ST.th]; ctx.save(); ctx.scale(w/W,h/H); isleBg(ctx,TH,ST,t,{x:SW/2,y:340,s:1}); ctx.translate(W/2,(H-40)/2); ctx.scale(.72,.72); ctx.translate(-SW/2,-330);
    const P=[{x:ST.main[0],y:MAINY,w:ST.main[1],main:true}].concat(ST.plats.map(([x,y,w,m])=>{ const u=m?Math.sin(t*Math.PI*2/m[2]):0; return {x:x+(m?m[0]*u:0),y:y+(m?m[1]*u:0),w}; }));
    if(ST.hz==='lava'){ ctx.fillStyle='#ff5a1a'; ctx.fillRect(-300,MAINY+60+Math.sin(t)*20,SW+600,400); }
    for(const p of P) drawPlat(ctx,p,TH,ST,t,150);
    const u=t%2.4,ax=ST.main[0]+ST.main[1]*.42,bx=ax+60+(u>1?(u-1)*260:0),by=MAINY-(u>1?Math.sin(Math.min(1,(u-1))*Math.PI)*120:0);
    person(ctx,ax,MAINY,BOTLOOK(7),0,3,u<1,t,1.6); person(ctx,bx,by,BOTLOOK(1),1,2,false,t,1.6); if(u>.9&&u<1.2){ ctx.strokeStyle='#fff'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(ax+30,MAINY-30,30,-1,1); ctx.stroke(); }
    ctx.restore(); },
  thumb:(ctx,w,h,t)=>{ G.isle.stageShow(ctx,w,h,0,t); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.13)+'px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#0b0a1c'; ctx.strokeText('浮島大混戰',w/2,h*.15); ctx.fillStyle='#ffd23f'; ctx.fillText('浮島大混戰',w/2,h*.15); },
  preview:(ctx,w,h,L,t)=>{ isleBg(ctx,ISLE_TH.grass,ISLE[0],t,{x:SW/2,y:340,s:1}); ctx.fillStyle='#5fbf4a'; ctx.fillRect(0,h*.78,w,h*.22); person(ctx,w*.32,h*.82,L,0,1,false,t,2.4); person(ctx,w*.68,h*.82,L,0,3,true,t,2.4); },
  create:createIsle};
G.pillow={name:'羽毛枕頭戰',tag:'PILLOW FIGHT',color:'#9ab8ff',online:true,maxPlayers:4,bots:true,
  desc:'睡衣派對開打！在臥室、宿舍、帳篷、和室、太空艙、雲端…15 個房間裡揮枕頭、丟枕頭，連中 3 下對手會頭暈。巨無霸枕頭、羽毛炸彈、加速拖鞋，彈跳床、冰面、水池、掉下去的洞，2～4 人混戰或分隊。',
  goal:'時間內打中最多下的人贏：打中一下 1 分，連中 3 下讓對手頭暈多 2 分，掉進洞裡扣 1 分。丟出去的枕頭會掉在地上，要再撿起來。',
  stages:PILLOW.map(s=>s.name),stars:PILLOW.map(s=>s.stars),
  stageGoal:si=>{ const s=PILLOW[si],z=new Set((s.zones||[]).map(x=>x[0])),h=[]; if(z.has('tramp')) h.push('彈跳床上跑得快、被打飛得更遠'); if(z.has('ice')) h.push('冰面很滑'); if(z.has('water')) h.push('水裡走得慢'); if(z.has('hole')) h.push('有會掉下去的洞（掉下去扣 1 分）');
    return s.name+'：揮枕頭、丟枕頭，時間內打中最多下的人贏。'+(h.length?h.join('，')+'。':''); },
  options:[{key:'seats',label:'人數',def:'4',opts:[{id:'2',label:'2 人'},{id:'3',label:'3 人'},{id:'4',label:'4 人'}]},{key:'ptime',label:'時間',def:'90',opts:[{id:'60',label:'60 秒'},{id:'90',label:'90 秒'},{id:'120',label:'120 秒'}]},LVOPT,TEAMOPT],
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['↑ ↓ ← →','移動'],['X 或 空白鍵','攻擊：會自動對準最近的對手，靠近時揮枕頭、離遠時丟枕頭'],['C','放羽毛炸彈（撿到時）；沒有炸彈時是丟枕頭'],['W A S D F G','雙人 1P：F 攻擊、G 炸彈'],['↑ ↓ ← → , .','雙人 2P：, 攻擊、. 炸彈']],
  touchHelp:[['方向盤','移動'],['攻擊','自動對準最近的對手：近的揮、遠的丟'],['炸彈','放羽毛炸彈（撿到時）']],
  touch:{left:'dpad',right:[{l:'攻擊',c:'KeyX',act:true},{l:'炸彈',c:'KeyC'}]},
  get looks(){ return LOOKS(); },
  hubBest:()=>{ const n=PILLOW.filter(s=>hasWin('pillow',s.name)).length; return n?'贏過 <b>'+n+' / '+PILLOW.length+'</b> 個房間':'尚無紀錄'; },
  stageBest:i=>hasWin('pillow',PILLOW[i].name)?'★ 贏過':'',
  stageShow:(ctx,w,h,si,t)=>{ const ST=PILLOW[si],TH=PTH[ST.th]; ctx.save(); ctx.scale(w/W,h/H); pillowRoom(ctx,ST,TH,ST.obs.map(([k,x,y,w2,h2])=>({k,x,y,w:w2,h:h2})),(ST.zones||[]).map(([k,x,y,w2,h2])=>({k,x,y,w:w2,h:h2})),t);
    const u=t%2,ax=330,ay=300,bx=470,by=300; person(ctx,ax,ay,BOTLOOK(7),0,3,false,t,1.5); person(ctx,bx-(u<.4?0:0),by,BOTLOOK(1),1,2,false,t,1.5);
    const sw=u<.5?u/.5:1; drawPillow(ctx,ax+Math.cos(-1.2+sw*2.4)*40,ay-20+Math.sin(-1.2+sw*2.4)*24,-1.2+sw*2.4,1.3,t,true); if(u>.4&&u<1.2){ for(let k=0;k<10;k++){ const a=k*.63,r=(u-.4)*80; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(bx+Math.cos(a)*r,by-24+Math.sin(a)*r*.6,6,2.4,a,0,7); ctx.fill(); } }
    ctx.restore(); },
  thumb:(ctx,w,h,t)=>{ G.pillow.stageShow(ctx,w,h,0,t); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.13)+'px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#0b0a1c'; ctx.strokeText('羽毛枕頭戰',w/2,h*.15); ctx.fillStyle='#ffd23f'; ctx.fillText('羽毛枕頭戰',w/2,h*.15); },
  preview:(ctx,w,h,L,t)=>{ ctx.fillStyle='#f4d8c8'; ctx.fillRect(0,0,w,h); ctx.fillStyle='#d8b48a'; ctx.fillRect(0,h*.3,w,h*.7); person(ctx,w*.32,h*.85,L,0,1,false,t,2.4); person(ctx,w*.68,h*.85,L,0,3,true,t,2.4); drawPillow(ctx,w*.8,h*.62,.3,2,t,true); },
  create:createPillow};
})();
