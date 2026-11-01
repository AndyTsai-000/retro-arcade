// 幸運夾夾樂：懷舊夾娃娃機。投幣、左右移動、按一下下爪，夾到送進出口。單人玩，用完代幣結算。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PIX='"Press Start 2P","Noto Sans TC",monospace',TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const MX=170,MW=460,GX=MX+22,GY=86,GW=MW-44,GH=300,FLOOR=GY+GH-6,CHUTE=GX+84; // 玻璃櫃範圍；左邊是出口
const MACH=[
  {name:'懷舊柑仔店',body:'#e23b3b',trim:'#ffd23f',glass:'#fff4d8',floor:'#d8a860',p:[['柴犬','dog','#e8a860'],['虎斑貓','cat','#f2b45a'],['小黃鴨','duck','#ffd23f'],['白兔','rabbit','#f4f0e8'],['粉紅豬','pig','#ffa8c0'],['招財貓','cat','#fff8e8']]},
  {name:'夜市彈珠檯',body:'#7a3ad8',trim:'#3ddbd9',glass:'#2a2050',floor:'#4a3a7a',p:[['熊貓','panda','#f4f4f0'],['黑貓','cat','#4a4658'],['紅狐狸','fox','#ff8a4a'],['藍企鵝','penguin','#4f8dd8'],['小綿羊','sheep','#fffaf0'],['金元寶龍','dino','#ffc83f']]},
  {name:'糖果遊樂場',body:'#ff7eb6',trim:'#fff0a0',glass:'#fff0f8',floor:'#ffc0dc',p:[['草莓兔','rabbit','#ff9ab0'],['布丁熊','bear','#ffd878'],['薄荷貓','cat','#a8ecd8'],['葡萄豬','pig','#c8a8ff'],['檸檬鴨','duck','#fff07a'],['彩虹獨角獸','rabbit','#ffb8ff']]},
  {name:'海底水族館',body:'#1f7ab8',trim:'#7ae8ff',glass:'#d0f4ff',floor:'#e8d8a0',p:[['小海豹','seal','#d8e0e8'],['章魚哥','octo','#ff7a7a'],['海星星','star','#ffb04a'],['藍企鵝','penguin','#3a6ab8'],['河豚','puffer','#ffd878'],['金鯨魚','seal','#ffc83f']]},
  {name:'太空基地',body:'#2a2e48',trim:'#ff9d3d',glass:'#141838',floor:'#4a4e6a',p:[['外星貓','cat','#86dc4f'],['機器熊','robot','#a8b4c8'],['太空兔','rabbit','#d8d8f0'],['星星','star','#ffe14d'],['紫章魚','octo','#b98cff'],['金機器人','robot','#ffc83f']]}];
const TIER=[{n:'普通',v:10,w:44,grip:.86},{n:'普通',v:10,w:30,grip:.82},{n:'少見',v:30,w:14,grip:.66},{n:'少見',v:30,w:7,grip:.62},{n:'稀有',v:60,w:3.6,grip:.48},{n:'超稀有',v:150,w:1.4,grip:.34}];
const INK='#2a1a26';
function plush(c,x,y,r,kind,col,o){ o=o||{}; c.save(); c.translate(x,y); if(o.a) c.rotate(o.a); const s=r/20; c.scale(s,s); c.lineWidth=2; c.strokeStyle=INK; c.lineJoin='round'; const dk=shade(col,.82),fl=(f)=>{ c.fillStyle=col; f(); c.fill(); c.stroke(); },dot=(a,b,q)=>{ c.fillStyle=INK; c.beginPath(); c.arc(a,b,q,0,TAU); c.fill(); };
  /* 耳朵等 */
  if(kind==='cat'||kind==='fox'){ for(const k of [-1,1]) fl(()=>{ c.beginPath(); c.moveTo(k*15,-9); c.lineTo(k*17,-25); c.lineTo(k*4,-17); c.closePath(); }); }
  else if(kind==='dog'||kind==='bear'||kind==='panda'||kind==='robot'){ for(const k of [-1,1]){ c.fillStyle=kind==='panda'?'#2a2a30':dk; c.beginPath(); c.arc(k*14,-15,kind==='robot'?3:7,0,TAU); c.fill(); c.stroke(); } if(kind==='robot'){ c.beginPath(); c.moveTo(0,-20); c.lineTo(0,-28); c.stroke(); c.fillStyle='#ff5d5d'; c.beginPath(); c.arc(0,-29,3,0,TAU); c.fill(); } }
  else if(kind==='rabbit'){ for(const k of [-1,1]) fl(()=>{ c.beginPath(); c.ellipse(k*7,-25,5,14,k*.12,0,TAU); }); }
  else if(kind==='sheep'){ c.fillStyle='#fff'; for(let i=0;i<9;i++){ const a=i/9*TAU; c.beginPath(); c.arc(Math.cos(a)*18,Math.sin(a)*17,7,0,TAU); c.fill(); c.stroke(); } }
  else if(kind==='dino'){ c.fillStyle='#ff9d3d'; for(let i=-1;i<=1;i++){ c.beginPath(); c.moveTo(i*9-5,-17); c.lineTo(i*9,-27+Math.abs(i)*3); c.lineTo(i*9+5,-17); c.fill(); c.stroke(); } }
  else if(kind==='octo'){ for(let i=-2;i<=2;i++) fl(()=>{ c.beginPath(); c.ellipse(i*7,16,4.4,9,i*.2,0,TAU); }); }
  else if(kind==='pig'){ for(const k of [-1,1]) fl(()=>{ c.beginPath(); c.moveTo(k*8,-16); c.lineTo(k*17,-20); c.lineTo(k*16,-8); c.closePath(); }); }
  else if(kind==='puffer'){ c.fillStyle=dk; for(let i=0;i<10;i++){ const a=i/10*TAU; c.beginPath(); c.moveTo(Math.cos(a-.2)*18,Math.sin(a-.2)*18); c.lineTo(Math.cos(a)*25,Math.sin(a)*25); c.lineTo(Math.cos(a+.2)*18,Math.sin(a+.2)*18); c.fill(); c.stroke(); } }
  /* 身體 */
  if(kind==='star'){ c.fillStyle=col; c.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i/10*TAU,q=i%2?11:22; c.lineTo(Math.cos(a)*q,Math.sin(a)*q+2); } c.closePath(); c.fill(); c.stroke(); }
  else if(kind==='robot'){ c.fillStyle=col; rr(c,-17,-18,34,36,8); c.fill(); c.stroke(); }
  else { c.fillStyle=col; c.beginPath(); c.arc(0,0,20,0,TAU); c.fill(); c.stroke(); }
  if(kind==='panda'){ c.fillStyle='#2a2a30'; for(const k of [-1,1]){ c.beginPath(); c.ellipse(k*8,-3,6,7,k*.3,0,TAU); c.fill(); } }
  if(kind==='penguin'){ c.fillStyle='#fff'; c.beginPath(); c.ellipse(0,5,13,13,0,0,TAU); c.fill(); }
  if(kind==='fox'||kind==='dog'||kind==='cat'&&col==='#f2b45a'){ c.fillStyle='rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(0,8,10,8,0,0,TAU); c.fill(); }
  const ey=kind==='star'?1:-3,wh=kind==='panda'?'#fff':null; for(const k of [-1,1]){ if(wh){ c.fillStyle='#fff'; c.beginPath(); c.arc(k*8,ey,3.4,0,TAU); c.fill(); dot(k*8,ey,2); } else { dot(k*8,ey,3.2); c.fillStyle='#fff'; c.beginPath(); c.arc(k*8-1,ey-1.2,1,0,TAU); c.fill(); } }
  c.fillStyle='rgba(255,110,130,.45)'; c.beginPath(); c.ellipse(-12,ey+6,3.2,2,0,0,TAU); c.ellipse(12,ey+6,3.2,2,0,0,TAU); c.fill();
  if(kind==='duck'||kind==='penguin'){ c.fillStyle='#ff9a3d'; c.beginPath(); c.ellipse(0,ey+7,6,3.4,0,0,TAU); c.fill(); c.stroke(); } else if(kind==='pig'){ c.fillStyle=dk; c.beginPath(); c.ellipse(0,ey+8,6,4.4,0,0,TAU); c.fill(); c.stroke(); dot(-2,ey+8,1); dot(2,ey+8,1); } else if(kind==='robot'){ c.strokeRect(-6,ey+7,12,4); } else { c.lineWidth=1.6; c.beginPath(); c.moveTo(-3,ey+6); c.quadraticCurveTo(-1.4,ey+9,0,ey+6.4); c.quadraticCurveTo(1.4,ey+9,3,ey+6); c.stroke(); }
  c.restore(); }
function shade(h,k){ const n=parseInt(h.slice(1),16),q=v=>clamp(Math.round(v*k),0,255); return 'rgb('+q(n>>16)+','+q(n>>8&255)+','+q(n&255)+')'; }
const aKey='arcade.claw.album.',album=mi=>{ try{ return JSON.parse(localStorage.getItem(aKey+mi)||'{}'); }catch(e){ return {}; } },saveAlbum=(mi,a)=>{ try{ localStorage.setItem(aKey+mi,JSON.stringify(a)); }catch(e){} };
function machine(c,M,t,mi){ /* 機台外殼，燈泡輪流亮 */
  const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#2a2240'); g.addColorStop(1,'#120e22'); c.fillStyle=g; c.fillRect(0,0,W,H); c.fillStyle='rgba(255,255,255,.04)'; for(let i=0;i<9;i++) c.fillRect(i*96,0,48,H); c.fillStyle='#3a2c48'; c.fillRect(0,H-34,W,34); c.fillStyle='#2a1e34'; for(let i=0;i<14;i++) c.fillRect(i*62+(i%2)*10,H-34,2,34);
  c.fillStyle=shade(M.body,.62); rr(c,MX-6,12,MW+12,H-8,20); c.fill(); c.fillStyle=M.body; rr(c,MX,14,MW,H-14,18); c.fill(); c.strokeStyle='#14122b'; c.lineWidth=3; c.stroke();
  c.fillStyle=M.trim; rr(c,MX+18,22,MW-36,50,12); c.fill(); c.strokeStyle='#14122b'; c.stroke(); c.textAlign='center'; c.textBaseline='middle'; c.font='900 26px '+TC; c.fillStyle='#14122b'; c.fillText(M.name,MX+MW/2,47);
  for(let i=0;i<16;i++){ const on=(Math.floor(t*5)+i)%2===0,x=MX+14+i*(MW-28)/15; c.fillStyle=on?'#fff8a0':'#7a6a3a'; c.beginPath(); c.arc(x,18,4.2,0,TAU); c.fill(); c.beginPath(); c.arc(x,77,3.6,0,TAU); c.fill(); }
  c.fillStyle=M.glass; c.fillRect(GX,GY,GW,GH); const gg=c.createLinearGradient(GX,GY,GX,GY+GH); gg.addColorStop(0,'rgba(0,0,0,.08)'); gg.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=gg; c.fillRect(GX,GY,GW,GH); c.fillStyle=M.floor; c.fillRect(GX,FLOOR,GW,GY+GH-FLOOR);
  /* 出口 */ c.fillStyle='rgba(20,18,43,.82)'; c.fillRect(GX,GY+GH-70,CHUTE-GX,70); c.strokeStyle=M.trim; c.lineWidth=4; c.strokeRect(GX+2,GY+GH-70,CHUTE-GX-4,70); c.fillStyle=M.trim; c.font='900 13px '+TC; c.fillText('出口',(GX+CHUTE)/2,GY+GH-52); }
function machineFront(c,M){ c.strokeStyle='#14122b'; c.lineWidth=3; c.strokeRect(GX,GY,GW,GH); c.fillStyle='rgba(255,255,255,.14)'; c.beginPath(); c.moveTo(GX+GW-130,GY); c.lineTo(GX+GW-70,GY); c.lineTo(GX+GW-200,GY+GH); c.lineTo(GX+GW-260,GY+GH); c.closePath(); c.fill(); c.fillStyle=shade(M.body,.8); c.fillRect(MX+22,GY+GH+3,MW-44,28); c.fillStyle='#14122b'; rr(c,MX+40,GY+GH+8,66,18,5); c.fill(); c.fillStyle='#ffd23f'; c.font='900 11px '+TC; c.textAlign='center'; c.fillText('取物口',MX+73,GY+GH+17); c.fillStyle='#d8d8e0'; c.beginPath(); c.arc(MX+MW-70,GY+GH+17,10,0,TAU); c.fill(); c.strokeStyle='#14122b'; c.lineWidth=2; c.stroke(); c.fillStyle='#14122b'; c.fillRect(MX+MW-71,GY+GH+11,2,12); }
function claw(c,x,y,cl,top){ c.strokeStyle='#8a8a98'; c.lineWidth=4; c.beginPath(); c.moveTo(x,top); c.lineTo(x,y-10); c.stroke(); c.fillStyle='#c8ccd8'; rr(c,x-11,y-14,22,14,5); c.fill(); c.strokeStyle='#2a2a38'; c.lineWidth=2; c.stroke(); c.lineWidth=4.5; c.lineCap='round'; c.strokeStyle='#d8dce8'; const sp=lerp(26,7,cl); for(const k of [-1,1]){ c.beginPath(); c.moveTo(x+k*7,y-2); c.quadraticCurveTo(x+k*(sp+8),y+14,x+k*sp,y+30); c.stroke(); } c.beginPath(); c.moveTo(x,y); c.lineTo(x,y+26); c.stroke(); c.lineCap='butt'; }
const lerp=(a,b,k)=>a+(b-a)*k;
function create(env,opts){
  const mi=clamp(opts.stage|0,0,MACH.length-1),M=MACH[mi],{ctx:c,canvas}=env.canvas2d(W,H),sfx=n=>env.sfx(n),COINS=12;
  const roll=()=>{ let tot=0; for(const q of TIER) tot+=q.w; let r=Math.random()*tot; for(let i=0;i<TIER.length;i++){ if(r<TIER[i].w) return i; r-=TIER[i].w; } return 0; };
  const P=[]; const addP=(x,y)=>{ const ti=roll(); P.push({x,y,vx:0,vy:0,r:ti>=4?26:ti>=2?23:21,ti,a:(Math.random()-.5)*.5,g:false}); };
  for(let i=0;i<26;i++) addP(CHUTE+30+Math.random()*(GX+GW-CHUTE-60),GY+20-i*22);
  let t=0,coins=COINS,score=0,X=GX+GW-60,Y=GY+10,cl=0,ph='move',timer=12,held=null,got=[],streak=0,ended=false,msg=null,slipAt=0,sw=0,fx=[],endT=0,mv=0;
  const say=(s,col)=>{ msg={s,l:1.6,c:col||'#ffd23f'}; };
  function physics(dt){ const WL=CHUTE+2,WR=GX+GW; for(let it=0;it<2;it++){ for(const p of P){ if(p.g) continue; p.vy+=720*dt/2; p.x+=p.vx*dt/2; p.y+=p.vy*dt/2; const inChute=p.x<WL&&p.y>GY+GH-70; if(p.y+p.r>FLOOR){ p.y=FLOOR-p.r; p.vy=0; p.vx*=.7; } if(p.x+p.r>WR){ p.x=WR-p.r; p.vx=0; } if(p.x-p.r<GX){ p.x=GX+p.r; p.vx=0; } if(!inChute&&p.x-p.r<WL&&p.y+p.r>GY+GH-70){ p.x=WL+p.r; p.vx=Math.abs(p.vx)*.3; } } for(let i=0;i<P.length;i++){ const a=P[i]; if(a.g) continue; for(let j=i+1;j<P.length;j++){ const b=P[j]; if(b.g) continue; const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),m=a.r+b.r-3; if(d<m&&d>.01){ const q=(m-d)/d*.5; a.x-=dx*q; a.y-=dy*q; b.x+=dx*q; b.y+=dy*q; const nv=(b.vy-a.vy)*.5; a.vy+=nv*.5; b.vy-=nv*.5; } } } } }
  function burst(x,y,col,n){ for(let i=0;i<n;i++){ const a=Math.random()*TAU,v=70+Math.random()*180; fx.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,l:.7,c:col,s:2+Math.random()*3}); } }
  function drop(){ if(ph!=='move'||coins<=0) return; coins--; ph='down'; sfx('beep'); }
  function update(dt){ if(ended) return; dt=Math.min(dt,.05); t+=dt; physics(dt); const K=env.keys; for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.l-=dt; if(f.l<=0){ fx.splice(i,1); continue; } f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=300*dt; } if(msg&&(msg.l-=dt)<=0) msg=null;
    if(ph==='move'){ const d=(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0); if(d){ X=clamp(X+d*165*dt,CHUTE+24,GX+GW-24); mv+=dt; if(mv>.14){ mv=0; sfx('click'); } } timer-=dt; if(env.hit('Space')||env.hit('KeyJ')||env.hit('Enter')||timer<=0) drop(); }
    else if(ph==='down'){ Y+=190*dt; const bot=FLOOR-34; let touch=false; for(const p of P){ if(p.g) continue; if(Math.abs(p.x-X)<p.r+4&&Y+34>p.y-p.r*.55) touch=true; } if(touch||Y>=bot){ ph='close'; sfx('click'); } }
    else if(ph==='close'){ cl=Math.min(1,cl+dt*2.1); if(cl>=1){ let best=null,bd=1e9; for(const p of P){ if(p.g) continue; const d=Math.hypot(p.x-X,p.y-(Y+22)); if(d<p.r+18&&d<bd){ bd=d; best=p; } } if(best){ const center=clamp(1-Math.abs(best.x-X)/(best.r+14),0,1),ch=TIER[best.ti].grip*(.45+.55*center)+.1; if(Math.random()<ch){ held=best; best.g=true; slipAt=Math.random()<ch*.78+.12?-1:GY+60+Math.random()*90; } } ph='up'; sw=0; } }
    else if(ph==='up'){ Y-=170*dt; if(held){ held.x=X; held.y=Y+36; held.a=Math.sin(t*9)*.12; if(slipAt>0&&Y<slipAt){ held.g=false; held.vy=20; held.vx=(Math.random()-.5)*50; held=null; cl=.3; say('哎呀！滑掉了⋯','#ff8a9a'); sfx('bump'); streak=0; } } if(Y<=GY+10){ Y=GY+10; if(held) ph='carry'; else { if(cl>=1&&!msg){ say('沒夾到','#cfc8ff'); streak=0; } ph='back'; } } }
    else if(ph==='carry'){ X-=170*dt; sw+=dt; held.x=X+Math.sin(t*7)*2; held.y=Y+36; if(X<=(GX+CHUTE)/2){ X=(GX+CHUTE)/2; held.g=false; held.vy=40; held.vx=0; cl=.2; ph='drop'; sw=0; sfx('place'); } }
    else if(ph==='drop'){ sw+=dt; if(held&&held.y>GY+GH-30||sw>.9){ const T=TIER[held.ti],q=M.p[held.ti]; P.splice(P.indexOf(held),1); score+=T.v; got.push(held.ti); streak++; burst(held.x,held.y,'#ffd23f',22); sfx(T.v>=60?'win':'item'); const al=album(mi),fresh=!al[held.ti]; al[held.ti]=(al[held.ti]||0)+1; saveAlbum(mi,al); say('夾到「'+q[0]+'」！+'+T.v+(fresh?'　新收藏！':''),T.v>=60?'#ffb0ec':'#ffd23f'); if(streak>=3){ streak=0; coins++; say('連續 3 次，送你 1 枚代幣！','#86dc4f'); sfx('heal'); } held=null; addP(CHUTE+40+Math.random()*(GX+GW-CHUTE-80),GY+10); ph='back'; } }
    else if(ph==='back'){ cl=Math.max(0,cl-dt*2); const dx=GX+GW-60-X; X+=clamp(dx,-210*dt,210*dt); if(Math.abs(dx)<2){ if(coins<=0){ ph='end'; endT=1.2; } else { ph='move'; timer=12; } } }
    else if(ph==='end'){ endT-=dt; if(endT<=0&&!ended){ ended=true; const cnt={}; for(const g of got) cnt[g]=(cnt[g]||0)+1; const al=album(mi),n=Object.keys(al).length; env.end({title:got.length?'夾到 '+got.length+' 隻！':'今天手氣不好',big:score+' 分',html:got.length?'<table class="ls"><tr><th>獎品</th><th>數量</th></tr>'+Object.keys(cnt).map(k=>'<tr><td>'+M.p[k][0]+'</td><td>'+cnt[k]+'</td></tr>').join('')+'</table>':'',text:'這台機器已收藏 '+n+' / 6 種。',score:score||null}); } } }
  function draw(){ machine(c,M,t,mi); c.save(); c.beginPath(); c.rect(GX,GY,GW,GH); c.clip(); for(const p of P.slice().sort((a,b)=>a.y-b.y)) plush(c,p.x,p.y,p.r,M.p[p.ti][1],M.p[p.ti][2],{a:p.a}); claw(c,X,Y,cl,GY); c.restore(); machineFront(c,M); for(const f of fx){ c.globalAlpha=clamp(f.l/.7,0,1); c.fillStyle=f.c; c.beginPath(); c.arc(f.x,f.y,f.s,0,TAU); c.fill(); c.globalAlpha=1; }
    /* 左：代幣分數 */ const panel=(x,y,w,h)=>{ c.fillStyle='rgba(11,10,28,.85)'; rr(c,x,y,w,h,12); c.fill(); }; panel(8,14,152,150); c.textAlign='left'; c.font='900 12px '+TC; c.fillStyle='#cfc8ff'; c.fillText('分數',22,34); c.font='900 26px '+TC; c.fillStyle='#fff'; c.fillText(score,22,60); c.font='900 12px '+TC; c.fillStyle='#cfc8ff'; c.fillText('代幣',22,90); for(let i=0;i<coins;i++){ const x=30+(i%6)*20,y=112+Math.floor(i/6)*20; c.fillStyle='#ffc83f'; c.beginPath(); c.arc(x,y,8,0,TAU); c.fill(); c.strokeStyle='#8a5a10'; c.lineWidth=1.5; c.stroke(); }
    panel(8,172,152,74); c.font='700 12px '+TC; c.fillStyle='#fff'; c.fillText(env.touch?'← → 移動':'← → 移動爪子',20,194); c.fillText(env.touch?'夾！下爪':'空白鍵 下爪',20,216); c.fillStyle='#86dc4f'; c.fillText('連續 3 次送代幣',20,236);
    /* 右：這台的獎品 */ panel(W-160,14,152,300); c.font='900 13px '+TC; c.fillStyle='#ffd23f'; c.textAlign='left'; c.fillText('獎品（✓ 已收藏）',W-150,34); const al=album(mi); M.p.forEach((q,i)=>{ const y=66+i*41; plush(c,W-132,y,15,q[1],q[2]); c.font='700 11.5px '+TC; c.fillStyle='#fff'; c.textAlign='left'; c.fillText(q[0],W-112,y-7,96); c.font='700 10.5px '+TC; c.fillStyle=TIER[i].v>=60?'#ffb0ec':TIER[i].v>=30?'#7ad8ff':'#cfc8ff'; c.fillText(TIER[i].n+' '+TIER[i].v+(al[i]?' ✓':''),W-112,y+9); });
    if(ph==='move'){ c.font='900 18px '+PIX; c.textAlign='center'; c.fillStyle=timer<4?'#ff5d6d':'#fff'; c.lineWidth=4; c.strokeStyle='#14122b'; c.strokeText(Math.ceil(timer),X,GY+GH/2-40); c.fillText(Math.ceil(timer),X,GY+GH/2-40); }
    if(msg){ c.font='900 20px '+TC; c.textAlign='center'; c.lineWidth=6; c.strokeStyle='#14122b'; c.strokeText(msg.s,MX+MW/2,GY+60); c.fillStyle=msg.c; c.fillText(msg.s,MX+MW/2,GY+60); } }
  return {update,draw,destroy(){},_dbg:{P,get ph(){return ph;},get X(){return X;},set X(v){ X=v; },get coins(){return coins;},get score(){return score;},get got(){return got;},drop}};
}
function stageShow(ctx,w,h,si,t){ const M=MACH[si]; ctx.save(); ctx.scale(w/W,h/H); machine(ctx,M,t,si); ctx.save(); ctx.beginPath(); ctx.rect(GX,GY,GW,GH); ctx.clip(); const pos=[[0,0],[1,0],[2,0],[3,0],[4,0],[.5,1],[1.5,1],[2.5,1],[3.5,1],[1,2],[2,2],[3,2]]; pos.forEach((p,i)=>{ const q=M.p[i%6]; plush(ctx,CHUTE+44+p[0]*62,FLOOR-24-p[1]*38,24,q[1],q[2],{a:(i%3-1)*.15}); }); claw(ctx,CHUTE+150+Math.sin(t)*90,GY+60,0,GY); ctx.restore(); machineFront(ctx,M); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).claw={
  name:'幸運夾夾樂',tag:'LUCKY CLAW',color:'#ffc83f',
  desc:'懷舊夾娃娃機！左右移動爪子、按一下下爪，夾到就送進出口。五台機器各有六種娃娃可以收藏，越稀有越難夾。',
  goal:'每局 12 枚代幣，一次下爪用一枚。爪子對準娃娃正中間比較夾得住，連續夾到 3 次多送 1 枚。',
  stages:MACH.map(m=>m.name),stageLabel:'選擇機台',stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,0,t),
  stageBest:i=>{ const n=Object.keys(album(i)).length; return n?'收藏 '+n+'/6':''; },
  help:[['← →','移動爪子'],['空白鍵','下爪']],touchHelp:[['← →','移動爪子'],['夾！','下爪']],
  touch:{left:[{l:'←',c:'ArrowLeft'},{l:'→',c:'ArrowRight'}],right:[{l:'夾！',c:'Space',act:true}]},
  best:{label:'最高分',fmt:v=>v+' 分',lower:false},create};
})();
