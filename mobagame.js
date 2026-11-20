// 鬥魂峽谷：遊戲本體（戰鬥、電腦、操作、畫面上的介面、連線）。資料在 moba.js、3D 在 moba3d.js。
(function(){
'use strict';
const W=960,H=540,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PI=Math.PI,TAU=PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k,dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function rr(c,x,y,w,h,r){ r=Math.min(r,w/2,h/2); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const MODES=['三路峽谷','單路激戰'];
const LVS={easy:{dm:.68,re:.7,sk:.45,ret:.38,n:'簡單'},mid:{dm:.88,re:.4,sk:.8,ret:.3,n:'中等'},hard:{dm:1.05,re:.22,sk:1,ret:.24,n:'困難'}};
const ROLE_CLS={top:['tank','fighter'],jg:['assassin','fighter'],mid:['mage'],bot:['marksman'],sup:['support','tank']};
const TW_R=8.5,CORE_R=9.5,XPN=l=>100+l*70,MAXL=15;
function create(env,opts){
  const M0=window.__MOBA,G3M=window.__MOBA3D,T=window.THREE,H3=window.__H3D,{ctx:c,canvas}=env.canvas2d(W,H);
  if(!M0||!G3M||!T||!H3){ c.fillStyle='#14122b'; c.fillRect(0,0,W,H); c.fillStyle='#fff'; c.font='900 22px '+TC; c.textAlign='center'; c.fillText('3D 元件載入失敗，請重新整理再試',W/2,H/2); setTimeout(()=>env.end({title:'無法開始',big:'',text:'載不到 three.js'}),2500); return {update(){},draw(){},destroy(){}}; }
  const {HEROES,CLS,ITEMS,BUILD,MIN,buildMap,ROLES,portrait,along,project,TEAMC}=M0;
  const net=opts.net,client=!!net&&!net.host,host=!client,OP=opts.options||{},mode=clamp(opts.stage|0,0,1),humans=net?net.count:1,myIdx=net?net.me:0;
  const size=Math.max(clamp(+OP.size||5,1,5),Math.ceil(humans/2)),LV=LVS[OP.lv]||LVS.mid,seed=net?(Number(net.seed)>>>0)||7:(Math.random()*1e9|0),map=buildMap(mode,seed),sfx=n=>env.sfx(n);
  /* ---------- 座位：真人輪流分到兩隊，其餘電腦 ---------- */
  const defRoles=mode?['mid','mid','mid','mid','mid']:size>=5?['top','jg','mid','bot','sup']:size===4?['top','jg','mid','bot']:size===3?['top','mid','bot']:size===2?['mid','bot']:['mid'];
  const slots=[]; for(let tm=0;tm<2;tm++) for(let p=0;p<size;p++) slots.push({team:tm,pos:p,human:-1,hero:-1,role:defRoles[p]||'mid',ok:false});
  for(let k=0;k<humans;k++){ const tm=k%2,p=k>>1; const s=slots[tm*size+p]; s.human=k; }
  slots.forEach((s,i)=>{ s.name=s.human>=0?(net?(net.names&&net.names[s.human])||'玩家'+(s.human+1):(opts.name||'你')):'電腦・'+['阿凱','小雨','大熊','米可','老王','阿哲','小魚','肉丸','阿樂','皮蛋'][i%10]; });
  const mySlot=slots.findIndex(s=>s.human===myIdx),myTeam=slots[mySlot].team,flip=myTeam===1;
  /* ---------- 3D ---------- */
  const G3=G3M(T,{W,H,map,low:!!env.touch});
  /* ---------- 狀態 ---------- */
  let phase='pick',pickT=net?40:75,Tm=0,t=0,ended=false,winner=-1,acc=0,nextWave=12,waveN=0,minId=1000,vpId=1,sendT=0,inT=0,overT=0;
  const heroes=[],minions=[],towers=map.towers.map(q=>Object.assign({k:'t',hp:q.tier?3200:2600,max:q.tier?3200:2600,r:1.7,cd:0,tgt:null,hits:0,inv:false},q)),cores=map.cores.map(q=>Object.assign({k:'c',hp:5000,max:5000,r:3.6,cd:0,tgt:null,hits:0,inv:true},q));
  const mons=map.camps.map((cp,i)=>({id:300+i,k:'j',camp:cp,big:cp.big,kind:cp.kind,team:2,x:cp.x,z:cp.z,home:[cp.x,cp.z],hp:0,max:1,dead:true,rsp:cp.big?75:25,face:PI/2,cd:0,tgt:null,r:cp.big?1.8:1,slam:6}));
  const teamBuff=[{dmg:0,reg:0},{dmg:0,reg:0}],kills=[0,0],projs=[],zones=[],timers=[],floats=[],feed=[],vproj=new Map();
  let EV=[],sendEV=[];
  const units=function*(){ yield* heroes; yield* minions; for(const m of mons) yield m; };
  const GS={units,towers,cores};
  const emit=e=>{ EV.push(e); if(host&&net) sendEV.push(e); };
  const byId=id=>{ if(id<100) return heroes[id-1]; if(id<200) return towers.find(q=>q.id===id); if(id<300) return cores[id-200]; if(id<1000) return mons[id-300]; return minions.find(q=>q.id===id); };
  /* ---------- 英雄數值 ---------- */
  function stats(h){ const C=CLS[h.def.cls],l=h.lvl-1,o={atk:C.atk+C.atkL*l,as:C.as+(h.def.cls==='marksman'?.02*l:.01*l),arm:C.arm+C.armL*l,hp:C.hp+C.hpL*l,spd:C.spd,sp:0,cdr:0,ls:0,heal:0,dmg:0,jg:0,rng:C.rng};
    for(const id of h.items){ const it=ITEMS[id]; o.atk+=it.atk||0; o.as+=(it.as||0)*C.as; o.arm+=it.arm||0; o.hp+=it.hp||0; o.spd+=(it.spd||0)*C.spd; o.sp+=it.sp||0; o.cdr+=it.cdr||0; o.ls+=it.ls||0; o.heal+=it.heal||0; if(it.jg) o.jg=1; }
    for(const b of h.buffs){ o.as+=(b.as||0)*C.as; o.spd+=(b.spd||0)*C.spd; o.dmg+=b.dmg||0; o.arm+=b.arm||0; }
    const tb=teamBuff[h.team]; if(tb.dmg>0) o.dmg+=.2; if(tb.reg>0) o.spd*=1.1;
    if(h.slow>0) o.spd*=.6; o.as=Math.min(2.6,o.as); return o; }
  function mkHero(s,i){ const d=HEROES[s.hero],h={id:i+1,k:'h',slot:i,team:s.team,def:d,name:s.name,human:s.human>=0,me:i===mySlot,role:s.role,lvl:1,xp:0,gold:mode?400:300,items:[],x:map.fount[s.team][0],z:map.fount[s.team][1],face:s.team?PI*.75:-PI/4,hp:1,max:1,r:.7,dead:false,rsp:0,cd:[0,0,0],smCd:0,atkCd:0,atkT:0,atkDur:.35,castT:0,shield:0,shT:0,stun:0,slow:0,buffs:[],recall:0,kc:0,dc:0,ac:0,streak:0,hits:{},force:0,dash:null,auto:true,mx:0,mz:0,wantAtk:false,q:[],ai:{t:0,mode:null,tgt:null,goal:null,path:null,pg:null}};
    h.max=h.hp=stats(h).hp; if(s.role==='jg'&&mode===0) h.build=['jg'].concat(BUILD[d.cls].slice(0,5)); else h.build=BUILD[d.cls].slice(); return h; }
  const isEnemy=(a,b)=>b.team!==a.team;
  const alive=u=>u&&!u.dead&&u.hp>0;
  const myHero=()=>heroes[mySlot];
  /* ---------- 移動、碰撞 ---------- */
  function tryMove(u,ux,uz,st){ let nx=u.x+ux*st,nz=u.z+uz*st;
    for(const o of map.obst){ const ddx=nx-o.x,ddz=nz-o.z,d=Math.hypot(ddx,ddz),m=o.r+u.r*.6; if(d<m&&d>0){ nx=o.x+ddx/d*m; nz=o.z+ddz/d*m; } }
    for(const s of towers.concat(cores)){ if(s.hp<=0) continue; const ddx=nx-s.x,ddz=nz-s.z,d=Math.hypot(ddx,ddz),m=s.r+u.r*.5; if(d<m&&d>0){ nx=s.x+ddx/d*m; nz=s.z+ddz/d*m; } }
    return map.inB(nx,nz); }
  function moveUnit(u,dx,dz,spd,dt){ const l=Math.hypot(dx,dz); if(l<.01) return; const ux=dx/l,uz=dz/l,st=spd*dt; let [nx,nz]=tryMove(u,ux,uz,st);
    if(Math.hypot(nx-u.x,nz-u.z)<st*.35){ // 卡住了：往左或右偏一點繞過去
      for(const a of [.9,-.9,1.5,-1.5]){ const c2=Math.cos(a),s2=Math.sin(a),vx=ux*c2-uz*s2,vz=ux*s2+uz*c2,[px,pz]=tryMove(u,vx,vz,st); if(Math.hypot(px-u.x,pz-u.z)>st*.5){ nx=px; nz=pz; break; } } }
    u.x=nx; u.z=nz; u.face=Math.atan2(dz,dx); }
  function goTo(u,x,z,spd,dt,stopAt){ const dx=x-u.x,dz=z-u.z,d=Math.hypot(dx,dz); if(d<=(stopAt||.3)) return true; moveUnit(u,dx,dz,Math.min(spd,d/dt),dt); return false; }
  /* ---------- 傷害、死亡、獎勵 ---------- */
  function armorOf(u){ return u.k==='h'?stats(u).arm:u.arm||0; }
  function dmg(src,tgt,amt,o){ o=o||{}; if(!alive(tgt)||tgt.inv) return 0; if(src&&src.k==='h'){ const S=stats(src); amt*=1+S.dmg; if(!src.human) amt*=LV.dm; if(tgt.k==='j'&&S.jg) amt*=1.3; }
    if(!o.tru) amt*=100/(100+Math.max(0,armorOf(tgt)));
    if(tgt.shield>0){ const a=Math.min(tgt.shield,amt); tgt.shield-=a; amt-=a; } tgt.hp-=amt;
    if(tgt.k==='h'){ tgt.recall=0; if(src&&src.k==='h'){ tgt.hits[src.id]=Tm; src.hitHeroT=Tm; } tgt.lastHitBy=src; }
    if(tgt.k==='j'&&src&&!tgt.tgt) tgt.tgt=src; if(tgt.k==='j'&&src&&src.k==='h') tgt.tgt=src;
    if(src&&src.k==='h'&&o.basic){ const S=stats(src); if(S.ls>0) src.hp=Math.min(src.max,src.hp+amt*S.ls); }
    if(amt>=1&&(tgt.k==='h'||src&&src.k==='h')) emit(['dn',+tgt.x.toFixed(1),+tgt.z.toFixed(1),Math.round(amt),o.tru?'#ffffff':o.skill?'#c8a0ff':tgt.k==='h'?'#ff6a5a':'#ffe8a0',tgt.id,src?src.id:0]);
    if(tgt.hp<=0) die(tgt,src); return amt; }
  function heal(h,amt){ if(!alive(h)) return; const S=stats(h); h.hp=Math.min(h.max,h.hp+amt); emit(['dn',+h.x.toFixed(1),+h.z.toFixed(1),'+'+Math.round(amt),'#5fff7a',h.id,0]); }
  function gainXp(h,n){ if(h.lvl>=MAXL) return; h.xp+=n; while(h.lvl<MAXL&&h.xp>=XPN(h.lvl)){ h.xp-=XPN(h.lvl); h.lvl++; const r0=h.hp/h.max; h.max=stats(h).hp; h.hp=h.max*r0+80; h.hp=Math.min(h.hp,h.max); emit(['beam',+h.x.toFixed(1),+h.z.toFixed(1),.9,'#ffe066',.7]); if(h.me) emit(['sfx','heal']); } }
  function die(u,src){ u.hp=0;
    if(u.k==='h'){ u.dead=true; u.rsp=Math.min(32,4+u.lvl*2.1); u.dc++; u.streak=0; u.shield=0; u.buffs=[]; u.recall=0; u.dash=null; let killer=src&&src.k==='h'?src:null;
      if(!killer){ let best=0; for(const id in u.hits){ const hh=heroes[id-1]; if(hh&&hh.team!==u.team&&u.hits[id]>best&&Tm-u.hits[id]<10){ best=u.hits[id]; killer=hh; } } }
      const asst=heroes.filter(hh=>hh!==killer&&hh.team!==u.team&&u.hits[hh.id]!=null&&Tm-u.hits[hh.id]<10);
      if(killer){ killer.kc++; killer.streak++; killer.gold+=250+Math.min(150,u.streak*40); kills[killer.team]++; } else kills[1-u.team]++;
      asst.forEach(a=>{ a.ac++; a.gold+=110; }); const xpw=[killer].concat(asst).filter(Boolean); xpw.forEach(a=>gainXp(a,(140+u.lvl*28)/Math.max(1,xpw.length)*1.3));
      u.hits={}; emit(['feed',(killer?TEAMN(killer.team)+' '+killer.def.n:'')+(killer?' 擊殺了 ':'')+TEAMN(u.team)+' '+u.def.n+(killer?'':' 陣亡'),killer?killer.team:2]); emit(['boom',+u.x.toFixed(1),+u.z.toFixed(1),2.5,TEAMC[u.team]]); emit(['sfx','die']);
      if(killer&&killer.streak>=3) emit(['feed',killer.def.n+' '+['三連殺！','四連殺！','五連殺！','勢不可擋！'][Math.min(3,killer.streak-3)],killer.team]); }
    else if(u.k==='m'){ u.dead=true; const S=MIN[u.mt]; if(src&&src.k==='h'){ src.gold+=S.gold+Math.round(Tm/60); } const near=heroes.filter(hh=>alive(hh)&&hh.team!==u.team&&dist(hh,u)<13); near.forEach(hh=>gainXp(hh,S.xp*1.25/Math.max(1,near.length)));
      emit(['burst',+u.x.toFixed(1),1,+u.z.toFixed(1),TEAMC[u.team],6,3]); }
    else if(u.k==='j'){ u.dead=true; u.rsp=u.big?120:60; u.tgt=null; const killer=src&&src.k==='h'?src:null; if(killer){ const S=stats(killer),m=S.jg?1.3:1; killer.gold+=Math.round((u.big?220:55)*m); gainXp(killer,(u.big?320:80)*m); heroes.filter(hh=>hh!==killer&&hh.team===killer.team&&alive(hh)&&dist(hh,u)<12).forEach(hh=>gainXp(hh,u.big?160:30));
        if(u.big){ const tb=teamBuff[killer.team]; if(u.kind===0) tb.dmg=90; else tb.reg=90; emit(['feed',TEAMN(killer.team)+' 擊敗了 '+(u.kind===0?'紫晶岩魔（全隊傷害提升）':'翠鱗巨獸（全隊回血、加速）'),killer.team]); emit(['beam',+u.x.toFixed(1),+u.z.toFixed(1),3,u.kind?'#8affc8':'#c08aff',1.2]); } }
      emit(['boom',+u.x.toFixed(1),+u.z.toFixed(1),u.big?4:2,u.big?'#c08aff':'#ffd06a']); }
    else if(u.k==='t'){ heroes.forEach(hh=>{ if(hh.team!==u.team) hh.gold+=150; }); emit(['feed',TEAMN(1-u.team)+' 摧毀了 '+map.laneName[u.lane]+(u.tier?'內塔':'外塔'),1-u.team]); emit(['boom',+u.x.toFixed(1),+u.z.toFixed(1),5,'#ffb040']); emit(['sfx','boom']); invUpdate(); }
    else if(u.k==='c'){ winner=1-u.team; emit(['boom',+u.x.toFixed(1),+u.z.toFixed(1),8,'#ffffff']); emit(['sfx','boom']); } }
  const TEAMN=tm=>['藍方','紅方','野怪'][tm];
  function invUpdate(){ towers.forEach(tw=>{ if(tw.tier===1) tw.inv=towers.some(o=>o.team===tw.team&&o.lane===tw.lane&&o.tier===0&&o.hp>0); else tw.inv=false; });
    cores.forEach(co=>{ co.inv=!towers.some(o=>o.team===co.team&&o.tier===1&&o.hp<=0); }); }
  invUpdate();
  /* ---------- 投射物 ---------- */
  function homing(src,tgt,amt,o,col,size,spd){ const id=vpId++; projs.push({id,src,tgt,amt,o,spd:spd||24,x:src.x,y:src.k==='t'?6.8:src.k==='c'?4.6:1.3,z:src.z}); emit(['P',id,+src.x.toFixed(1),src.k==='t'?6.8:src.k==='c'?4.6:1.3,+src.z.toFixed(1),tgt.id,spd||24,col,size||1]); }
  function skillshot(src,ang,len,amt,o,col,size){ const id=vpId++; projs.push({id,src,ang,len,amt,o,spd:28,x:src.x,y:1.2,z:src.z,trav:0,line:1}); emit(['Q',id,+src.x.toFixed(1),+src.z.toFixed(1),+ang.toFixed(3),len,28,col,size||1.5]); }
  function projTick(dt){ for(let i=projs.length-1;i>=0;i--){ const p=projs[i];
      if(p.line){ const st=p.spd*dt; p.x+=Math.cos(p.ang)*st; p.z+=Math.sin(p.ang)*st; p.trav+=st; let hit=null; for(const u of enemiesOf(p.src.team)){ if(dist(u,p)<u.r+.8){ hit=u; break; } } if(hit){ dmg(p.src,hit,p.amt,p.o); applyCC(hit,p.o); emit(['hit',+hit.x.toFixed(1),+hit.z.toFixed(1),p.o.col]); projs.splice(i,1); continue; } if(p.trav>=p.len) projs.splice(i,1); continue; }
      if(!alive(p.tgt)){ projs.splice(i,1); continue; } const dx=p.tgt.x-p.x,dz=p.tgt.z-p.z,d=Math.hypot(dx,dz),st=p.spd*dt; if(d<=st+.4){ dmg(p.src,p.tgt,p.amt,p.o); if(p.o.cc) applyCC(p.tgt,p.o.cc); projs.splice(i,1); continue; } p.x+=dx/d*st; p.z+=dz/d*st; } }
  const enemiesOf=function*(tm){ for(const h of heroes) if(h.team!==tm&&alive(h)) yield h; for(const m of minions) if(m.team!==tm&&alive(m)) yield m; for(const m of mons) if(alive(m)) yield m; };
  function applyCC(u,o){ if(!o||!alive(u)) return; if(o.st){ u.stun=Math.max(u.stun||0,o.st); u.recall=0; } if(o.sl) u.slow=Math.max(u.slow||0,o.sl); }
  /* ---------- 小兵 ---------- */
  function spawnWave(){ waveN++; const sc=1+Tm/60*.05; map.lanes.forEach((L,li)=>{ for(let tm=0;tm<2;tm++){ const comp=['melee','melee','melee','ranged','ranged']; if(waveN%3===0||Tm>900) comp.push('cannon'); if(Tm>600) comp.push('melee'); const lost=towers.filter(q=>q.team!==tm&&q.lane===li&&q.tier===1&&q.hp<=0).length; if(lost) comp.push('cannon'); comp.forEach((mt,k)=>{ const S=MIN[mt],s0=tm?L.len-3-k*1.6:3+k*1.6,p=along(L,s0);
        minions.push({id:minId++,k:'m',mt,big:mt==='cannon',team:tm,lane:li,x:p[0]+(k%2?.6:-.6),z:p[1]+(k%2?-.6:.6),hp:S.hp*sc,max:S.hp*sc,atk:S.atk*(1+Tm/60*.04),as:S.as,rng:S.rng,arm:S.arm,spd:S.spd,r:S.r,cd:0,tgt:null,face:0,atkT:0,s:s0,think:0}); }); } }); }
  function minionTick(m,dt){ const L=map.lanes[m.lane]; m.cd-=dt; if(m.atkT>0) m.atkT-=dt; if(m.stun>0){ m.stun-=dt; return; } if(m.slow>0) m.slow-=dt; m.think-=dt;
    if(m.think<=0){ m.think=.3; if(!(alive(m.tgt)&&dist(m,m.tgt)<9&&!(m.tgt.inv))){ m.tgt=null; let best=null,bd=8; for(const o of minions) if(o.team!==m.team&&alive(o)){ const d=dist(m,o); if(d<bd){ bd=d; best=o; } }
        if(!best) for(const s of towers.concat(cores)) if(s.team!==m.team&&s.hp>0&&!s.inv&&dist(m,s)<9){ best=s; break; }
        if(!best){ let hd=6; for(const h of heroes) if(h.team!==m.team&&alive(h)&&dist(m,h)<hd){ hd=dist(m,h); best=h; } } m.tgt=best; } }
    const spd=m.spd*(m.slow>0?.6:1);
    if(m.tgt){ const d=dist(m,m.tgt),reach=m.rng+m.r+(m.tgt.r||.6); if(d>reach){ moveUnit(m,m.tgt.x-m.x,m.tgt.z-m.z,spd,dt); } else { m.face=Math.atan2(m.tgt.z-m.z,m.tgt.x-m.x); if(m.cd<=0){ m.cd=1/m.as; m.atkT=.3; const a=m.tgt.k==='h'?m.atk:m.atk*(m.tgt.k==='t'||m.tgt.k==='c'?1.15:1); if(m.mt==='melee') dmg(m,m.tgt,a,{basic:1}); else homing(m,m.tgt,a,{basic:1},TEAMC[m.team],m.mt==='cannon'?1.4:.8,20); } } }
    else { // 沿著路往敵方基地走
      const dir=m.team?-1:1; m.s=project(L,m.x,m.z)[0]; const p=along(L,m.s+dir*3); moveUnit(m,p[0]-m.x,p[1]-m.z,spd,dt); } }
  /* ---------- 防禦塔、主堡 ---------- */
  function towerTick(s,dt){ if(s.hp<=0) return; s.cd-=dt; const R0=s.k==='c'?CORE_R:TW_R; let tg=s.tgt;
    if(!alive(tg)||dist(s,tg)>R0+.5||tg.team===s.team) tg=null;
    const diver=heroes.find(h=>h.team!==s.team&&alive(h)&&dist(h,s)<=R0&&h.hitHeroT!=null&&Tm-h.hitHeroT<2&&heroes.some(a=>a.team===s.team&&alive(a)&&dist(a,s)<=R0+2&&a.hits[h.id]!=null&&Tm-a.hits[h.id]<2));
    if(diver) tg=diver;
    if(!tg){ let bd=1e9; for(const m of minions) if(m.team!==s.team&&alive(m)){ const d=dist(m,s); if(d<=R0&&d<bd){ bd=d; tg=m; } } }
    if(!tg){ let bd=1e9; for(const h of heroes) if(h.team!==s.team&&alive(h)){ const d=dist(h,s); if(d<=R0&&d<bd){ bd=d; tg=h; } } }
    if(tg!==s.tgt) s.hits=0; s.tgt=tg;
    if(tg&&s.cd<=0){ s.cd=s.k==='c'?1:1.1; let a; if(tg.k==='m') a=tg.max*(tg.mt==='cannon'?.22:.42); else { a=(s.k==='c'?240:175)+Tm/60*9; a*=1+Math.min(3,s.hits)*.3; s.hits++; }
      homing(s,tg,a,{tru:tg.k==='m'},TEAMC[s.team],2.2,26); } }
  /* ---------- 野怪 ---------- */
  function spawnMon(m){ const sc=1+Tm/60*.05; m.dead=false; m.hp=m.max=(m.big?4200:900)*sc; m.atk=(m.big?75:30)*sc; m.as=m.big?.7:.8; m.rng=m.big?3.2:2; m.arm=m.big?35:15; m.spd=4; m.x=m.home[0]; m.z=m.home[1]; m.tgt=null; m.ret=false; emit(['ring',m.x,m.z,m.big?6:3,m.big?(m.kind?'#8affc8':'#c08aff'):'#ffd06a',.8]); }
  function monTick(m,dt){ if(m.dead){ m.rsp-=dt; if(m.rsp<=0) spawnMon(m); return; } m.cd-=dt; if(m.atkT>0) m.atkT-=dt; if(m.stun>0){ m.stun-=dt; return; } if(m.slow>0) m.slow-=dt;
    const hd=Math.hypot(m.x-m.home[0],m.z-m.home[1]);
    if(m.tgt&&(!alive(m.tgt)||hd>14||dist(m.tgt,{x:m.home[0],z:m.home[1]})>16)){ m.tgt=null; m.ret=true; }
    if(m.ret||!m.tgt){ if(hd>.5) moveUnit(m,m.home[0]-m.x,m.home[1]-m.z,m.spd*1.4,dt); else { m.ret=false; m.face=PI/2; } m.hp=Math.min(m.max,m.hp+m.max*(m.ret?.2:.05)*dt); return; }
    const d=dist(m,m.tgt),reach=m.rng+m.r+(m.tgt.r||.6); if(d>reach) moveUnit(m,m.tgt.x-m.x,m.tgt.z-m.z,m.spd,dt); else { m.face=Math.atan2(m.tgt.z-m.z,m.tgt.x-m.x); if(m.cd<=0){ m.cd=1/m.as; m.atkT=.4; dmg(m,m.tgt,m.atk,{basic:1}); emit(['hit',+m.tgt.x.toFixed(1),+m.tgt.z.toFixed(1),'#ffd06a']); } }
    if(m.big){ m.slam-=dt; if(m.slam<=0&&d<5){ m.slam=7; emit(['ring',+m.x.toFixed(1),+m.z.toFixed(1),4.5,m.kind?'#8affc8':'#c08aff',.6]); for(const h of heroes) if(alive(h)&&dist(h,m)<4.5){ dmg(m,h,m.atk*1.6,{}); applyCC(h,{st:.6}); } } } }
  /* ---------- 英雄：普攻、技能 ---------- */
  function pickTarget(h,range,prefer){ const S=stats(h); let best=null,bs=-1e9; const R0=range!=null?range:S.rng+.6;
    const consider=(u,base)=>{ if(!alive(u)||u.team===h.team||u.inv) return; const d=dist(h,u)-(u.r||.6); if(d>R0) return; const sc=base-d*.5-(u.hp/u.max)*20; if(sc>bs){ bs=sc; best=u; } };
    for(const u of heroes) consider(u,prefer==='farm'?50:200); for(const u of minions) consider(u,prefer==='farm'?150:100+(u.hp<stats(h).atk*1.2?60:0)); for(const u of mons) consider(u,prefer==='jg'?220:90); for(const u of towers) consider(u,60); for(const u of cores) consider(u,70);
    return best; }
  function basicAttack(h,tg){ const S=stats(h); if(!alive(tg)) return false; const d=dist(h,tg)-(tg.r||.6); if(d>S.rng+.6) return false; h.face=Math.atan2(tg.z-h.z,tg.x-h.x); if(h.atkCd>0) return true;
    h.atkCd=1/S.as; h.atkDur=Math.min(.35,.75/S.as); h.atkT=h.atkDur; h.recall=0; const a=S.atk;
    if(S.rng>3) homing(h,tg,a,{basic:1},h.def.pal.fx,1.1,26); else { dmg(h,tg,a,{basic:1}); emit(['slash',+h.x.toFixed(1),+h.z.toFixed(1),1.5,+h.face.toFixed(2),h.def.pal.fx]); }
    if(h.me||tg.me) emit(['sfx','bump']); return true; }
  const unlocked=(h,i)=>h.lvl>=[1,2,4][i];
  const skPow=(h,s)=>{ const S=stats(h),C=CLS[h.def.cls]; return s.d*(1+.11*(h.lvl-1))*(1+S.sp)+S.atk*C.ad*.6; };
  function skillTarget(h,s){ const R0=(s.r||s.a||6)+.8; let best=null,bs=1e9; for(const u of heroes) if(u.team!==h.team&&alive(u)&&dist(h,u)<=R0){ const sc=u.hp/u.max+dist(h,u)*.02; if(sc<bs){ bs=sc; best=u; } } if(best) return best;
    for(const u of mons) if(alive(u)&&dist(h,u)<=R0) return u; for(const u of minions) if(u.team!==h.team&&alive(u)&&dist(h,u)<=R0){ if(!best||u.hp<best.hp) best=u; } return best; }
  function areaHit(h,x,z,a,amt,cc,col){ let n=0; for(const u of [...enemiesOf(h.team)]) if(Math.hypot(u.x-x,u.z-z)<=a+u.r*.5){ dmg(h,u,amt,{skill:1}); applyCC(u,cc); n++; } for(const s of towers.concat(cores)) if(s.team!==h.team&&s.hp>0&&!s.inv&&Math.hypot(s.x-x,s.z-z)<=a+s.r) dmg(h,s,amt*.4,{skill:1}); return n; }
  function cast(h,i){ if(h.dead||h.stun>0||h.dash||!unlocked(h,i)||h.cd[i]>0) return false; const s=h.def.sk[i],S=stats(h),pw=skPow(h,s),col=h.def.pal.fx,cc={st:s.st,sl:s.sl},R0=s.r||s.a||6;
    let tg=skillTarget(h,s); const need=['strike','exec','pull'].includes(s.t); if(need&&(!tg||dist(h,tg)>R0+.8)) return false;
    const ang=tg?Math.atan2(tg.z-h.z,tg.x-h.x):h.face; h.face=ang; h.recall=0;
    const sx=h.x,sz=h.z,ax=Math.cos(ang),az=Math.sin(ang);
    switch(s.t){
      case 'dash': { const dd=tg?Math.max(0,Math.min(R0,dist(h,tg)-1.2)):R0; h.dash={x:sx+ax*dd,z:sz+az*dd,cb:()=>{ if(s.d) areaHit(h,h.x,h.z,s.a||2.2,pw,cc,col); emit(['ring',+h.x.toFixed(1),+h.z.toFixed(1),s.a||2.2,col,.45]); }}; break; }
      case 'blink': { let dd=tg?Math.max(0,Math.min(R0,dist(h,tg)-1)):R0,a2=ang; if(s.back){ a2=ang+PI; dd=R0; } const [nx,nz]=map.inB(sx+Math.cos(a2)*dd,sz+Math.sin(a2)*dd); emit(['burst',sx,1,sz,col,10,4]); h.x=nx; h.z=nz; h.force++; emit(['burst',+nx.toFixed(1),1,+nz.toFixed(1),col,10,4]); if(s.d&&tg&&!s.back){ dmg(h,tg,pw,{skill:1}); applyCC(tg,cc); } break; }
      case 'strike': dmg(h,tg,pw,{skill:1}); applyCC(tg,cc); emit(['slash',+tg.x.toFixed(1),+tg.z.toFixed(1),2.2,+ang.toFixed(2),col]); emit(['hit',+tg.x.toFixed(1),+tg.z.toFixed(1),col]); break;
      case 'nova': areaHit(h,sx,sz,s.a,pw,cc,col); emit(['ring',+sx.toFixed(1),+sz.toFixed(1),s.a,col,.5]); emit(['ring',+sx.toFixed(1),+sz.toFixed(1),s.a,col,.35,1]); break;
      case 'blast': { const px=tg?tg.x:sx+ax*R0*.7,pz=tg?tg.z:sz+az*R0*.7; emit(['ring',+px.toFixed(1),+pz.toFixed(1),s.a,col,.45,1]); timers.push({t:.4,fn:()=>{ areaHit(h,px,pz,s.a,pw,cc,col); emit(['boom',+px.toFixed(1),+pz.toFixed(1),s.a,col]); }}); break; }
      case 'shot': skillshot(h,ang,R0+1,pw,{skill:1,st:s.st,sl:s.sl,col},col,1.6); break;
      case 'pierce': { const len=R0+1,w=(s.w||2.2)/2; for(const u of [...enemiesOf(h.team)]){ const rx=u.x-sx,rz=u.z-sz,along2=rx*ax+rz*az,side=Math.abs(-rx*az+rz*ax); if(along2>-.5&&along2<len&&side<w+u.r*.5){ dmg(h,u,pw,{skill:1}); applyCC(u,cc); } } emit(['line',+sx.toFixed(1),+sz.toFixed(1),+ang.toFixed(3),0,len,w*2,col]); break; }
      case 'shield': { const v=s.v*(1+.1*(h.lvl-1))*(1+S.heal); const L0=s.ally?heroes.filter(a=>a.team===h.team&&alive(a)&&dist(a,h)<10):[h]; L0.forEach(a=>{ a.shield=Math.max(a.shield,v); a.shT=4; emit(['ring',+a.x.toFixed(1),+a.z.toFixed(1),1.4,'#9ad8ff',.5]); }); break; }
      case 'heal': { const v=s.v*(1+.1*(h.lvl-1))*(1+S.heal+S.sp*.5); const L0=s.self?[h]:heroes.filter(a=>a.team===h.team&&alive(a)&&dist(a,h)<(s.a||8)); L0.forEach(a=>heal(a,v)); emit(['ring',+sx.toFixed(1),+sz.toFixed(1),s.self?1.6:(s.a||8),'#7aff9a',.6,1]); break; }
      case 'buff': { const L0=s.ally?heroes.filter(a=>a.team===h.team&&alive(a)&&dist(a,h)<10):[h]; L0.forEach(a=>{ a.buffs.push({as:s.as,spd:s.spd,dmg:s.dmg,arm:s.arm,t:s.dur||4}); emit(['beam',+a.x.toFixed(1),+a.z.toFixed(1),.9,col,.6]); }); break; }
      case 'exec': { if(s.blink){ const a2=Math.atan2(h.z-tg.z,h.x-tg.x); emit(['burst',sx,1,sz,col,8,4]); [h.x,h.z]=map.inB(tg.x+Math.cos(a2)*1.2,tg.z+Math.sin(a2)*1.2); h.force++; } dmg(h,tg,pw+(tg.max-tg.hp)*s.m,{skill:1}); emit(['slash',+tg.x.toFixed(1),+tg.z.toFixed(1),2.6,+ang.toFixed(2),col]); emit(['boom',+tg.x.toFixed(1),+tg.z.toFixed(1),1.6,col]); break; }
      case 'pull': { const a2=Math.atan2(tg.z-h.z,tg.x-h.x); emit(['line',+sx.toFixed(1),+sz.toFixed(1),+a2.toFixed(3),0,dist(h,tg),.5,col]); if(tg.k!=='t'&&tg.k!=='c'){ [tg.x,tg.z]=map.inB(h.x+Math.cos(a2)*1.6,h.z+Math.sin(a2)*1.6); if(tg.k==='h') tg.force++; } dmg(h,tg,pw,{skill:1}); applyCC(tg,cc); break; }
      case 'storm': { const px=s.self?sx:tg?tg.x:sx+ax*R0*.7,pz=s.self?sz:tg?tg.z:sz+az*R0*.7; zones.push({h,x:px,z:pz,a:s.a,dps:pw*.5,t:s.dur||4,tick:0,cc:{sl:s.sl?1:0},col,follow:s.self}); break; }
    }
    h.cd[i]=s.cd*(1-Math.min(.4,S.cdr)); h.castT=.45; h.atkT=0; if(h.me||(myHero()&&dist(h,myHero())<20)) emit(['sfx',i===2?'boost':'pop']); return true; }
  function smite(h){ if(h.dead||h.smCd>0||!stats(h).jg) return false; let tg=null,bd=6.5; for(const u of mons) if(alive(u)&&dist(h,u)<bd){ bd=dist(h,u); tg=u; } if(!tg) for(const u of minions) if(u.team!==h.team&&alive(u)&&dist(h,u)<bd){ bd=dist(h,u); tg=u; } if(!tg) return false;
    dmg(h,tg,700+h.lvl*70,{tru:1}); h.smCd=28; emit(['beam',+tg.x.toFixed(1),+tg.z.toFixed(1),1.2,'#ffe066',.5]); emit(['sfx','boom']); return true; }
  const smiteDmg=h=>700+h.lvl*70;
  function buyNext(h,manual){ const nxt=h.build[h.items.length]; if(!nxt||h.items.length>=6) return false; const it=ITEMS[nxt]; if(h.gold<it.c) return false; h.gold-=it.c; h.items.push(nxt); const r0=h.hp/h.max; h.max=stats(h).hp; h.hp=Math.max(1,h.max*r0); if(h.me){ emit(['sfx','item']); floatMsg('買了 '+it.n,'#ffd23f'); } return true; }
  /* ---------- 英雄每一刻 ---------- */
  function heroTick(h,dt){ h.cd=h.cd.map(v=>Math.max(0,v-dt)); h.smCd=Math.max(0,h.smCd-dt); h.atkCd-=dt; if(h.atkT>0) h.atkT-=dt; if(h.castT>0) h.castT-=dt; if(h.shT>0){ h.shT-=dt; if(h.shT<=0) h.shield=0; }
    h.buffs=h.buffs.filter(b=>(b.t-=dt)>0); if(h.slow>0) h.slow-=dt;
    if(h.dead){ h.rsp-=dt; if(h.rsp<=0){ h.dead=false; h.max=stats(h).hp; h.hp=h.max; const f=map.fount[h.team]; h.x=f[0]; h.z=f[1]; h.force++; h.stun=0; h.slow=0; } return; }
    const F=map.fount[h.team],EF=map.fount[1-h.team];
    if(Math.hypot(h.x-F[0],h.z-F[1])<8){ h.hp=Math.min(h.max,h.hp+h.max*.15*dt); }
    if(Math.hypot(h.x-EF[0],h.z-EF[1])<9) dmg(null,h,900*dt,{tru:1});
    h.hp=Math.min(h.max,h.hp+h.max*(.004+(teamBuff[h.team].reg>0?.02:0))*dt); h.gold+=3.2*dt;
    if(h.dash){ const d=h.dash,dx=d.x-h.x,dz=d.z-h.z,l=Math.hypot(dx,dz),st=28*dt; if(l<=st){ h.x=d.x; h.z=d.z; h.dash=null; h.force++; d.cb&&d.cb(); } else { h.x+=dx/l*st; h.z+=dz/l*st; h.face=Math.atan2(dz,dx); } return; }
    if(h.stun>0){ h.stun-=dt; return; }
    if(h.recall>0){ h.recall-=dt; if(h.recall<=0){ h.x=F[0]; h.z=F[1]; h.force++; emit(['beam',h.x,h.z,1.2,'#9ad8ff',.8]); } }
    if(h.bot) botAct(h,dt);
    else if(h===myHero()&&host) applyInput(h,dt,myIn);
    else if(h.human&&host&&h.netIn) applyInput(h,dt,h.netIn,true);
    if(h.auto||h.bot) buyNext(h); }
  function applyInput(h,dt,I,remote){ // I={mx,mz,atk,acts:[]}
    if(remote){ if(I.x!=null&&!h.dash){ if(h.force===I.f){ const moved=Math.hypot(I.x-h.x,I.z-h.z)>.05; if(moved){ h.recall=0; } h.x=I.x; h.z=I.z; if(I.face!=null) h.face=I.face; } } }
    else if(I.mx||I.mz){ moveUnit(h,I.mx,I.mz,stats(h).spd,dt); h.recall=0; }
    for(const a of I.acts||[]){ if(a==='s0'||a==='s1'||a==='s2'){ if(!cast(h,+a[1])&&h.me) floatMsg(h.cd[+a[1]]>0?'還在冷卻':!unlocked(h,+a[1])?'等級 '+[1,2,4][+a[1]]+' 才能用':'附近沒有目標','#ffb0b0'); } else if(a==='sm'){ if(!smite(h)&&h.me) floatMsg(stats(h).jg?'附近沒有野怪':'要先買打野刀','#ffb0b0'); } else if(a==='rc'){ if(!h.recall) { h.recall=3.5; emit(['ring',+h.x.toFixed(1),+h.z.toFixed(1),1.5,'#9ad8ff',.6]); } } else if(a==='buy') buyNext(h,true); else if(a==='auto'){ h.auto=!h.auto; } }
    I.acts=[]; if(I.atk){ const tg=pickTarget(h,null); if(tg) basicAttack(h,tg); else if(!remote&&!(I.mx||I.mz)){ const e=pickTarget(h,7); if(e&&e.k==='h'){ moveUnit(h,e.x-h.x,e.z-h.z,stats(h).spd,dt); } } } }
  /* ---------- 電腦英雄 ---------- */
  const laneOf=h=>mode?0:{top:0,mid:1,bot:2,sup:2}[h.role]??1;
  const progress=(h,u)=>{ const L=map.lanes[laneOf(h)],s=project(L,u.x,u.z)[0]; return h.team?L.len-s:s; };
  function botThink(h){ const ai=h.ai,S=stats(h),hp=h.hp/h.max,F=map.fount[h.team],dF=Math.hypot(h.x-F[0],h.z-F[1]);
    const E=heroes.filter(e=>e.team!==h.team&&alive(e)&&dist(e,h)<13),Al=heroes.filter(a=>a.team===h.team&&alive(a)&&dist(a,h)<14);
    ai.tgt=null; ai.goal=null;
    if(ai.mode==='back'){ if(hp>.92||h.dead){ ai.mode=null; } else { if(!E.length&&dF>25&&!h.recall) h.recall=3.5; if(!h.recall) ai.goal=F; return; } }
    if(hp<LV.ret&&!(E.length&&E.every(e=>e.hp/e.max<.15))){ ai.mode='back'; if(!E.length&&dF>25) h.recall=3.5; else ai.goal=F; return; }
    if(h.recall>0) return;
    const enemyTowerNear=(x,z)=>towers.concat(cores).find(s=>s.team!==h.team&&s.hp>0&&Math.hypot(s.x-x,s.z-z)<(s.k==='c'?CORE_R:TW_R)+1);
    if(E.length){ const weak=E.reduce((a,b)=>a.hp/a.max<b.hp/b.max?a:b),myPow=Al.reduce((s,a)=>s+a.hp,0),thPow=E.reduce((s,e)=>s+e.hp,0);
      const tw=enemyTowerNear(weak.x,weak.z),safe=!tw||minions.some(m=>m.team===h.team&&alive(m)&&dist(m,tw)<TW_R)||weak.hp<pwEst(h)*1.5&&OP.lv==='hard';
      if(safe&&(myPow>thPow*.9||weak.hp/weak.max<.35||hp>.4&&Al.length>=E.length)){ ai.tgt=weak; ai.mode='fight'; return; }
      if(!safe||myPow<thPow*.6){ ai.goal=towardHome(h,8); return; } }
    ai.mode=null;
    if(h.role==='jg'&&mode===0){ let best=null,bd=1e9; for(const m of mons){ if(!alive(m)) continue; if(m.big&&h.lvl<6&&Al.length<3) continue; const d=dist(h,m)+(m.camp.side===h.team?0:25); if(d<bd){ bd=d; best=m; } }
      // 隊友附近有殘血敵人就去支援
      const gank=heroes.find(e=>e.team!==h.team&&alive(e)&&e.hp/e.max<.5&&heroes.some(a=>a.team===h.team&&a!==h&&alive(a)&&dist(a,e)<9)&&dist(h,e)<35);
      if(gank&&h.lvl>=3){ ai.tgt=gank; ai.mode='fight'; return; }
      if(best){ ai.tgt=best; return; } ai.goal=along(map.lanes[1],map.lanes[1].len/2); return; }
    if(h.role==='sup'){ const carry=heroes.find(a=>a.team===h.team&&a!==h&&alive(a)&&a.role==='bot')||heroes.find(a=>a.team===h.team&&a!==h&&alive(a)); if(carry&&dist(h,carry)>6){ ai.goal=[carry.x-(h.team?-2:2),carry.z+(h.team?-2:2)]; return; } }
    // 對手死了一半以上：趁機拆塔
    const deadE=heroes.filter(e=>e.team!==h.team&&e.dead).length;
    if(deadE>=Math.max(1,Math.ceil(size/2))&&hp>.45){ const L2=map.lanes[laneOf(h)],st=towers.concat(cores).filter(q=>q.team!==h.team&&q.hp>0&&!q.inv).sort((a,b)=>(a.lane===laneOf(h)?0:40)+dist(a,h)-((b.lane===laneOf(h)?0:40)+dist(b,h)))[0];
      if(st){ if(dist(st,h)<(st.k==='c'?CORE_R:TW_R)+1) ai.tgt=st; else ai.goal=[st.x,st.z]; return; } }
    // 兵線：跟在最前面的自己小兵後面，打敵方小兵；小兵在塔下時才打塔
    const li=laneOf(h),L=map.lanes[li],mine=minions.filter(m=>m.team===h.team&&m.lane===li&&alive(m));
    let front=null,fp=-1; for(const m of mine){ const p=progress(h,m); if(p>fp){ fp=p; front=m; } }
    let tg=null,bd=9; for(const m of minions) if(m.team!==h.team&&alive(m)&&m.lane===li){ const d=dist(h,m); if(d<bd&&!(enemyTowerNear(m.x,m.z)&&!mine.some(q=>enemyTowerNear(q.x,q.z)))){ bd=d; tg=m; } }
    if(tg){ ai.tgt=tg; return; }
    const tw=towers.concat(cores).filter(s=>s.team!==h.team&&s.hp>0&&!s.inv).find(s=>dist(s,h)<18&&(mine.some(q=>dist(q,s)<TW_R+1)||hp>.5&&heroes.filter(a=>a.team===h.team&&alive(a)&&dist(a,s)<16).length>=2&&!heroes.some(e=>e.team!==h.team&&alive(e)&&dist(e,s)<20)));
    if(tw&&!E.length){ ai.tgt=tw; return; }
    if(front){ const p=along(L,clamp(project(L,front.x,front.z)[0]+(h.team?3:-3),0,L.len)); ai.goal=[p[0]+(h.slot%3-1)*1.2,p[1]+(h.slot%2?1:-1)]; }
    else { const own=towers.filter(s=>s.team===h.team&&s.lane===li&&s.hp>0).sort((a,b)=>a.tier-b.tier)[0]||cores[h.team]; const s0=project(L,own.x,own.z)[0],p=along(L,s0+(h.team?-4:4)); ai.goal=[p[0],p[1]]; } }
  const pwEst=h=>stats(h).atk*3+skPow(h,h.def.sk[0]);
  function towardHome(h,d){ const F=map.fount[h.team],dx=F[0]-h.x,dz=F[1]-h.z,l=Math.hypot(dx,dz)||1; return [h.x+dx/l*d,h.z+dz/l*d]; }
  function botAct(h,dt){ const ai=h.ai; ai.t-=dt; if(ai.t<=0){ ai.t=LV.re*(.8+Math.random()*.4); botThink(h); ai.skT=(ai.skT||0)-1; }
    if(h.recall>0) return; const S=stats(h);
    const tg=ai.tgt; if(tg&&alive(tg)){ const reach=S.rng+.6+(tg.r||.6),d=dist(h,tg);
      if(tg.k==='h'||tg.k==='j'||Math.random()<.04){ // 技能
        for(let i=2;i>=0;i--){ if(h.cd[i]>0||!unlocked(h,i)) continue; const s=h.def.sk[i]; if(Math.random()>LV.sk*dt*6) continue;
          if(s.t==='heal'||s.t==='shield'){ if(h.hp/h.max<.6||heroes.some(a=>a.team===h.team&&alive(a)&&a.hp/a.max<.5&&dist(a,h)<8)) cast(h,i); continue; }
          if(s.t==='buff'){ if(d<reach+2) cast(h,i); continue; } if(s.back){ if(h.hp/h.max<.45) cast(h,i); continue; }
          if(tg.k!=='h'&&i===2) continue; if(d<=(s.r||s.a||6)+.5) cast(h,i); } }
      if(stats(h).jg&&tg.k==='j'&&tg.hp<smiteDmg(h)&&dist(h,tg)<6) smite(h);
      if(d>reach){ chase(h,tg.x,tg.z,S.spd,dt); } else basicAttack(h,tg); return; }
    if(ai.goal){ chase(h,ai.goal[0],ai.goal[1],S.spd,dt); } }
  function chase(h,x,z,spd,dt){ const ai=h.ai,d=Math.hypot(x-h.x,z-h.z); if(d<.6) return;
    if(d<14||mode===1){ moveUnit(h,x-h.x,z-h.z,spd,dt); return; }
    if(!ai.path||!ai.pg||Math.hypot(ai.pg[0]-x,ai.pg[1]-z)>6){ ai.path=map.path(h.x,h.z,x,z); ai.pg=[x,z]; }
    const p=ai.path[0]; if(!p){ moveUnit(h,x-h.x,z-h.z,spd,dt); return; } if(Math.hypot(p[0]-h.x,p[1]-h.z)<1.6&&ai.path.length>1) ai.path.shift(); moveUnit(h,p[0]-h.x,p[1]-h.z,spd,dt); }
  /* ---------- 模擬一步 ---------- */
  function sim(dt){ Tm+=dt;
    if(Tm>=nextWave){ spawnWave(); nextWave+=30; }
    for(const h of heroes) heroTick(h,dt);
    for(const m of minions) if(alive(m)) minionTick(m,dt);
    for(const m of mons) monTick(m,dt);
    for(const s of towers) towerTick(s,dt); for(const s of cores) towerTick(s,dt);
    projTick(dt);
    for(let i=timers.length-1;i>=0;i--){ if((timers[i].t-=dt)<=0){ const f=timers[i].fn; timers.splice(i,1); f(); } }
    for(let i=zones.length-1;i>=0;i--){ const z=zones[i]; if(z.follow&&alive(z.h)){ z.x=z.h.x; z.z=z.h.z; } z.t-=dt; z.tick-=dt; if(z.tick<=0){ z.tick=.5; areaHit(z.h,z.x,z.z,z.a,z.dps*.5,z.cc,z.col); emit(['ring',+z.x.toFixed(1),+z.z.toFixed(1),z.a,z.col,.55,1]); emit(['burst',+(z.x+(Math.random()-.5)*z.a).toFixed(1),1.5,+(z.z+(Math.random()-.5)*z.a).toFixed(1),z.col,5,3]); } if(z.t<=0) zones.splice(i,1); }
    for(let i=minions.length-1;i>=0;i--) if(minions[i].dead) minions.splice(i,1);
    // 小兵、野怪互相推開
    for(let i=0;i<minions.length;i++){ const a=minions[i]; for(let j=i+1;j<minions.length;j++){ const b=minions[j],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),m=a.r+b.r; if(d<m&&d>.001){ const k=(m-d)/2/d; a.x-=dx*k; a.z-=dz*k; b.x+=dx*k; b.z+=dz*k; } } }
    for(const tb of teamBuff){ tb.dmg=Math.max(0,tb.dmg-dt); tb.reg=Math.max(0,tb.reg-dt); }
    if(winner>=0&&!ended) gameOver(winner); }
  /* ---------- 本機輸入 ---------- */
  const J={on:false,id:null,cx:0,cy:0,x:0,y:0};let acts=[],hold=false; const myIn={mx:0,mz:0,atk:false,acts:[]};
  const BTN=()=>{ const bx=W-92,by=H-92; return [{k:'atk',x:bx,y:by,r:46},{k:'s0',x:bx-112,y:by+22,r:30},{k:'s1',x:bx-86,y:by-66,r:30},{k:'s2',x:bx-12,y:by-112,r:34},{k:'sm',x:bx-196,y:by+30,r:24},{k:'rc',x:bx-176,y:by-36,r:22},{k:'buy',x:96,y:H-30-0,r:0}]; };
  function localIn(){ const K=env.keys; let ix=0,iy=0; if(K.KeyA||K.ArrowLeft) ix-=1; if(K.KeyD||K.ArrowRight) ix+=1; if(K.KeyW||K.ArrowUp) iy+=1; if(K.KeyS||K.ArrowDown) iy-=1; if(J.on){ ix=J.x; iy=-J.y; }
    const mx=flip?-ix:ix,mz=flip?iy:-iy;
    if(env.hit('KeyK')||env.hit('Digit1')) acts.push('s0'); if(env.hit('KeyL')||env.hit('Digit2')) acts.push('s1'); if(env.hit('KeyI')||env.hit('Digit3')) acts.push('s2'); if(env.hit('KeyF')) acts.push('sm'); if(env.hit('KeyB')) acts.push('rc'); if(env.hit('KeyP')) acts.push('buy');
    const atk=hold||!!(K.KeyJ||K.Space); const out={mx,mz,atk,acts}; acts=[]; return out; }
  /* ---------- 觸控／滑鼠 ---------- */
  function toL(e){ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=(r.width-W*s)/2,oy=(r.height-H*s)/2; return [(e.clientX-r.left-ox)/s,(e.clientY-r.top-oy)/s]; }
  const ptr=new Map();
  function onDown(e){ e.preventDefault(); const [x,y]=toL(e); if(phase==='pick'){ pickClick(x,y); return; } if(phase!=='play') return;
    for(const b of BTN()){ if(b.r&&Math.hypot(x-b.x,y-b.y)<b.r+6){ if(b.k==='atk'){ hold=true; ptr.set(e.pointerId,'atk'); } else acts.push(b.k); sfx('click'); return; } }
    const by=HUDY()+98; if(x>=12&&x<=192&&y>=by&&y<=by+42){ acts.push('buy'); return; } if(x>=196&&x<=250&&y>=by&&y<=by+42){ acts.push('auto'); return; }
    if(env.touch&&x<W*.5&&y>H*.3){ J.on=true; J.id=e.pointerId; J.cx=x; J.cy=y; J.x=0; J.y=0; ptr.set(e.pointerId,'joy'); } }
  function HUDY(){ return env.touch?168:H-152; }
  function onMove(e){ if(ptr.get(e.pointerId)!=='joy') return; const [x,y]=toL(e),dx=x-J.cx,dy=y-J.cy,l=Math.hypot(dx,dy),R0=56; J.x=dx/Math.max(R0,l); J.y=dy/Math.max(R0,l); if(l>R0*1.4){ J.cx=x-dx/l*R0*1.4; J.cy=y-dy/l*R0*1.4; } }
  function onUp(e){ const k=ptr.get(e.pointerId); if(k==='atk') hold=false; if(k==='joy'){ J.on=false; J.x=J.y=0; } ptr.delete(e.pointerId); }
  canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointermove',onMove); addEventListener('pointerup',onUp); addEventListener('pointercancel',onUp); canvas.style.touchAction='none';
  /* ---------- 選英雄 ---------- */
  let pkSel=Math.floor(Math.random()*30),pkTab=0,pkDone=false;
  const TABS=[['all','全部']].concat(Object.entries(CLS).map(([k,v])=>[k,v.n]));
  const pkList=()=>HEROES.filter(h=>TABS[pkTab][0]==='all'||h.cls===TABS[pkTab][0]);
  const takenBy=(team,hid,except)=>slots.some((s,i)=>i!==except&&s.team===team&&s.hero===hid);
  function pickClick(x,y){ if(pkDone) return; TABS.forEach((tb,i)=>{ if(x>=20+i*84&&x<20+i*84+78&&y>=52&&y<=80){ pkTab=i; sfx('click'); } });
    pkList().forEach((h,i)=>{ const cx=24+(i%6)*100,cy=92+Math.floor(i/6)*82; if(x>=cx&&x<cx+94&&y>=cy&&y<cy+76){ pkSel=h.i; sfx('click'); } });
    if(mode===0) ROLES.forEach(([id,n],i)=>{ const bx=640+(i%3)*102,by=372+Math.floor(i/3)*34; if(x>=bx&&x<bx+96&&y>=by&&y<by+28){ setRole(mySlot,id); sfx('click'); } });
    if(x>=700&&x<=940&&y>=452&&y<=500) confirmPick(); }
  function setRole(si,role){ const s=slots[si]; if(s.role===role) return; const o=slots.find((q,i)=>i!==si&&q.team===s.team&&q.role===role&&q.human<0); if(o) o.role=s.role; s.role=role; if(client) net.send({t:'pk',role}); }
  function confirmPick(){ if(takenBy(myTeam,pkSel,mySlot)){ floatMsg('隊友已經選了這位英雄','#ffb0b0'); return; } slots[mySlot].hero=pkSel; slots[mySlot].ok=true; pkDone=true; sfx('go'); if(client) net.send({t:'pk',h:pkSel,role:slots[mySlot].role,ok:1}); }
  function botPicks(){ slots.forEach((s,i)=>{ if(s.hero>=0) return; const want=ROLE_CLS[s.role]||CLS_IDS(); let pool=HEROES.filter(h=>want.includes(h.cls)&&!takenBy(s.team,h.i,i)); if(!pool.length) pool=HEROES.filter(h=>!takenBy(s.team,h.i,i)); s.hero=pool[Math.floor(Math.random()*pool.length)].i; s.ok=true; }); }
  const CLS_IDS=()=>Object.keys(CLS);
  function startPlay(){ phase='play'; slots.forEach((s,i)=>{ const h=mkHero(s,i); h.bot=s.human<0; heroes.push(h); }); emit(['sfx','go']); floatMsg('全軍出擊！','#ffd23f',2.5); }
  /* ---------- 連線 ---------- */
  let snapIn=null;
  if(net){ if(client){ net.onmsg=m=>{ if(m.t==='pks'&&phase==='pick'){ m.sl.forEach((q,i)=>{ if(i===mySlot&&pkDone) return; slots[i].hero=q[0]; slots[i].role=q[1]; slots[i].ok=!!q[2]; }); pickT=m.tl; }
        else if(m.t==='go'&&phase==='pick'){ m.sl.forEach((q,i)=>{ slots[i].hero=q[0]; slots[i].role=q[1]; }); startPlay(); }
        else if(m.t==='s'&&phase==='play') snapIn=m; else if(m.t==='over') gameOver(m.w); }; }
    else { net.onmsg=(m,from)=>{ const si=slots.findIndex(s=>s.human===from); if(si<0) return; if(m.t==='pk'&&phase==='pick'){ if(m.role) setRoleHost(si,m.role); if(m.h!=null&&!takenBy(slots[si].team,m.h,si)){ slots[si].hero=m.h; slots[si].ok=!!m.ok; } }
        else if(m.t==='i'&&phase==='play'){ const h=heroes[si]; if(!h) return; h.netIn={x:m.x,z:m.z,face:m.fc,f:m.f,atk:!!m.a,acts:(h.netIn&&h.netIn.acts||[]).concat(m.q||[])}; } };
      net.onleave=i=>{ const s=slots.find(q=>q.human===i); if(!s) return; s.name+='（離開）'; s.human=-1; if(s.hero<0) botPicks(); const h=heroes[slots.indexOf(s)]; if(h){ h.bot=true; h.human=false; h.name=s.name; } }; } }
  function setRoleHost(si,role){ const s=slots[si]; const o=slots.find((q,i)=>i!==si&&q.team===s.team&&q.role===role&&q.human<0); if(o) o.role=s.role; s.role=role; }
  function sendSnap(){ const r1=v=>Math.round(v*10)/10;
    const hs=heroes.map(h=>[r1(h.x),r1(h.z),r1(h.face),Math.round(h.hp),Math.round(h.max),h.lvl,Math.round(h.xp),Math.round(h.gold),h.dead?r1(h.rsp):0,Math.round(h.shield),r1(h.stun),r1(h.recall),r1(Math.max(0,h.atkT)),r1(Math.max(0,h.castT)),h.kc,h.dc,h.ac,h.items.join(','),h.cd.map(r1),r1(h.smCd),h.force,h.auto?1:0,h.buffs.length?1:0]);
    const ms=minions.map(m=>[m.id,['melee','ranged','cannon'].indexOf(m.mt),m.team,r1(m.x),r1(m.z),Math.round(m.hp),Math.round(m.max),r1(m.face),r1(Math.max(0,m.atkT))]);
    const jm=mons.map(m=>[m.dead?1:0,Math.round(m.hp),Math.round(m.max),r1(m.x),r1(m.z),r1(m.face),r1(Math.max(0,m.atkT||0))]);
    net.send({t:'s',T:r1(Tm),hs,ms,jm,tw:towers.map(q=>Math.round(q.hp)),ti:towers.map(q=>q.inv?1:0),co:cores.map(q=>Math.round(q.hp)),ci:cores.map(q=>q.inv?1:0),tb:teamBuff.map(q=>[r1(q.dmg),r1(q.reg)]),kl:kills,ev:sendEV}); sendEV=[]; }
  function applySnap(m){ Tm=m.T; kills[0]=m.kl[0]; kills[1]=m.kl[1]; m.tb.forEach((q,i)=>{ teamBuff[i].dmg=q[0]; teamBuff[i].reg=q[1]; });
    m.hs.forEach((a,i)=>{ const h=heroes[i]; if(!h) return; const mine=i===mySlot,forced=a[20]!==h.force; h.tx=a[0]; h.tz=a[1];
      if(!mine||forced||a[8]>0||a[10]>0){ if(mine&&(forced||a[8]>0)){ h.x=a[0]; h.z=a[1]; } if(!mine) h.face=a[2]; }
      h.force=a[20]; h.hp=a[3]; h.max=a[4]; h.lvl=a[5]; h.xp=a[6]; h.gold=a[7]; h.dead=a[8]>0; h.rsp=a[8]; h.shield=a[9]; h.stun=a[10]; h.recall=a[11]; h.atkT=a[12]; h.castT=a[13]; h.kc=a[14]; h.dc=a[15]; h.ac=a[16]; h.items=a[17]?a[17].split(','):[]; h.cd=a[18]; h.smCd=a[19]; h.auto=!!a[21]; });
    const seen=new Set(); m.ms.forEach(a=>{ seen.add(a[0]); let u=minions.find(q=>q.id===a[0]); if(!u){ u={id:a[0],k:'m',mt:['melee','ranged','cannon'][a[1]],team:a[2],x:a[3],z:a[4],r:.6,big:a[1]===2}; u.big=u.mt==='cannon'; minions.push(u); } u.tx=a[3]; u.tz=a[4]; u.hp=a[5]; u.max=a[6]; u.face=a[7]; u.atkT=a[8]; u.dead=false; });
    for(let i=minions.length-1;i>=0;i--) if(!seen.has(minions[i].id)) minions.splice(i,1);
    m.jm.forEach((a,i)=>{ const u=mons[i]; u.dead=!!a[0]; u.hp=a[1]; u.max=a[2]; u.tx=a[3]; u.tz=a[4]; if(u.x==null||u.dead){ u.x=a[3]; u.z=a[4]; } u.face=a[5]; u.atkT=a[6]; });
    m.tw.forEach((v,i)=>{ towers[i].hp=v; towers[i].inv=!!m.ti[i]; }); m.co.forEach((v,i)=>{ cores[i].hp=v; cores[i].inv=!!m.ci[i]; });
    for(const e of m.ev) EV.push(e); }
  /* ---------- 特效、浮動文字 ---------- */
  function floatMsg(s,col,dur){ feed.push({s,col:col||'#fff',t:dur||1.6,big:1}); }
  function runEvents(){ const mh=myHero(); for(const e of EV){ const k=e[0];
      if(k==='dn'){ if(!mh||e[5]===mh.id||e[6]===mh.id||Math.hypot(e[1]-camX,e[2]-camZ)<16) floats.push({x:e[1],z:e[2],txt:String(e[3]),col:e[4],t:0,mine:mh&&(e[5]===mh.id),dx:(Math.random()-.5)*.8}); }
      else if(k==='feed'){ feed.push({s:e[1],col:e[2]===2?'#ffffff':TEAMC[e[2]],t:4}); const sm=feed.filter(f=>!f.big); if(sm.length>5) feed.splice(feed.indexOf(sm[0]),1); }
      else if(k==='sfx') sfx(e[1]);
      else if(k==='P'){ vproj.set(e[1],{x:e[2],y:e[3],z:e[4],tid:e[5],spd:e[6],col:e[7]}); G3.fx(['p',e[1],e[2],e[3],e[4],e[7],e[8]]); }
      else if(k==='Q'){ vproj.set(e[1],{x:e[2],y:1.2,z:e[3],ang:e[4],len:e[5],spd:e[6],col:e[7],trav:0}); G3.fx(['p',e[1],e[2],1.2,e[3],e[7],e[8]]); }
      else G3.fx(e); }
    EV=[]; }
  function vprojTick(dt){ for(const [id,p] of vproj){ if(p.ang!=null){ const st=p.spd*dt; p.x+=Math.cos(p.ang)*st; p.z+=Math.sin(p.ang)*st; p.trav+=st; if(p.trav>=p.len){ G3.fx(['px',id]); vproj.delete(id); continue; } G3.fx(['pm',id,p.x,p.y,p.z]); continue; }
      const tg=byId(p.tid); if(!tg||tg.dead){ G3.fx(['px',id]); vproj.delete(id); continue; } const ty=tg.k==='t'?3:tg.k==='c'?3:1.1,dx=tg.x-p.x,dz=tg.z-p.z,dy=ty-p.y,d=Math.hypot(dx,dz,dy),st=p.spd*dt; if(d<=st+.3){ G3.fx(['px',id]); vproj.delete(id); continue; } p.x+=dx/d*st; p.y+=dy/d*st; p.z+=dz/d*st; G3.fx(['pm',id,p.x,p.y,p.z]); } }
  /* ---------- 結束 ---------- */
  function gameOver(w){ if(ended) return; ended=true; winner=w; if(host&&net) net.send({t:'over',w}); const win=w===myTeam; sfx(win?'win':'lose');
    const rows=heroes.slice().sort((a,b)=>a.team-b.team||b.kc-a.kc).map(h=>'<tr style="color:'+TEAMC[h.team]+'"><td>'+h.def.n+'</td><td>'+h.name+(h.me?'（你）':'')+'</td><td>'+h.kc+' / '+h.dc+' / '+h.ac+'</td><td>'+h.lvl+'</td></tr>').join('');
    setTimeout(()=>env.end({title:win?'勝利！':'失敗…',big:win?'VICTORY':'DEFEAT',html:'<table class="ls"><tr><th>英雄</th><th>玩家</th><th>擊殺 / 陣亡 / 助攻</th><th>等級</th></tr>'+rows+'</table>',text:'比賽時間 '+fmtT(Tm),score:win?1:null,next:false}),2200); }
  const fmtT=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
  /* ---------- 每一幀 ---------- */
  let camX=map.fount[myTeam][0],camZ=map.fount[myTeam][1];
  function update(dt){ dt=Math.min(dt,.1); t+=dt;
    for(const f of feed) f.t-=dt; for(let i=feed.length-1;i>=0;i--) if(feed[i].t<=0) feed.splice(i,1);
    if(phase==='pick'){ pickT-=dt; if(host){ const allOk=slots.every(s=>s.human<0||s.ok); if(net){ sendT-=dt; if(sendT<=0){ sendT=.3; net.send({t:'pks',sl:slots.map(s=>[s.hero,s.role,s.ok?1:0]),tl:pickT}); } }
        if(pickT<=0||allOk){ slots.forEach((s,i)=>{ if(s.human>=0&&s.hero<0){ if(i===mySlot&&!pkDone){ if(takenBy(s.team,pkSel,i)) pkSel=HEROES.find(h=>!takenBy(s.team,h.i,i)).i; s.hero=pkSel; pkDone=true; } } }); botPicks(); if(net) net.send({t:'go',sl:slots.map(s=>[s.hero,s.role])}); startPlay(); } }
      else if(pickT<=0&&!pkDone) confirmPick(); return; }
    if(phase!=='play') return;
    const mh=myHero();
    if(host){ const I=localIn(); myIn.mx=I.mx; myIn.mz=I.mz; myIn.atk=I.atk; myIn.acts.push(...I.acts); acc+=dt; while(acc>=.05&&!ended){ acc-=.05; sim(.05); } if(net){ sendT-=dt; if(sendT<=0){ sendT=.1; sendSnap(); } } }
    else { if(snapIn){ applySnap(snapIn); snapIn=null; } const I=localIn();
      for(const h of heroes){ if(h!==mh&&h.tx!=null){ const f=Math.min(1,dt*10); h.x+=(h.tx-h.x)*f; h.z+=(h.tz-h.z)*f; } }
      for(const m of minions) if(m.tx!=null){ const f=Math.min(1,dt*10); m.x+=(m.tx-m.x)*f; m.z+=(m.tz-m.z)*f; } for(const m of mons) if(m.tx!=null){ const f=Math.min(1,dt*10); m.x+=(m.tx-m.x)*f; m.z+=(m.tz-m.z)*f; }
      if(mh&&!mh.dead&&!(mh.stun>0)){ if(I.mx||I.mz){ const sp=stats(mh).spd; moveUnit(mh,I.mx,I.mz,sp,dt); } else if(I.atk){ /* 普攻時面向目標 */ } }
      inT-=dt; if(inT<=0||I.acts.length){ inT=1/15; net.send({t:'i',x:+mh.x.toFixed(2),z:+mh.z.toFixed(2),fc:+mh.face.toFixed(2),f:mh.force,a:I.atk?1:0,q:I.acts}); } }
    runEvents(); vprojTick(dt);
    for(const f of floats) f.t+=dt; for(let i=floats.length-1;i>=0;i--) if(floats[i].t>1) floats.splice(i,1);
    if(mh){ const tx=mh.x,tz=mh.z; camX+=(tx-camX)*Math.min(1,dt*6); camZ+=(tz-camZ)*Math.min(1,dt*6); }
  }
  /* ---------- 畫面 ---------- */
  let lt=0,tS=0,tN=0,lvl=0;
  function draw(){ if(phase==='pick'){ drawPick(); return; }
    G3.render(GS,camX,camZ,flip,t); c.drawImage(G3.canvas,0,0,W,H);
    const now=performance.now()/1000; if(lt){ const d=now-lt; if(d<.3){ tS+=d; tN++; } } lt=now; if(tN>=90){ const av=tS/tN; tS=0; tN=0; if(av>.034&&lvl<2){ lvl++; if(lvl===1) G3.shadows(false); else G3.setQ(Math.max(.8,G3.Q-.3)); } }
    drawBars(); drawFloats(); drawHUD(); drawMini(); drawFeed(); }
  function bar(x,y,w,h,k,col,bg){ c.fillStyle=bg||'rgba(10,10,20,.75)'; rr(c,x-1,y-1,w+2,h+2,2); c.fill(); c.fillStyle=col; c.fillRect(x,y,w*clamp(k,0,1),h); }
  function drawBars(){ const mh=myHero();
    for(const s of towers.concat(cores)){ if(s.hp<=0) continue; const p=G3.toScreen(s.x,s.k==='c'?8.5:7.4,s.z); if(!p[2]||p[0]<-50||p[0]>W+50||p[1]<-20||p[1]>H+20) continue; const w=s.k==='c'?80:64; bar(p[0]-w/2,p[1],w,6,s.hp/s.max,s.team===myTeam?'#3d8bff':'#ff4a4a'); if(s.inv){ c.fillStyle='#ffd23f'; c.font='900 11px '+TC; c.textAlign='center'; c.fillText('🛡',p[0],p[1]-8); }
      if(mh&&!mh.dead&&s.team!==myTeam&&dist(mh,s)<(s.k==='c'?CORE_R:TW_R)+3){ /* 塔的攻擊範圍提示 */ } }
    for(const m of minions){ if(m.dead) continue; const p=G3.toScreen(m.x,m.big?2.4:2,m.z); if(!p[2]||p[0]<-20||p[0]>W+20||p[1]<-10||p[1]>H+10) continue; bar(p[0]-14,p[1],28,3,m.hp/m.max,m.team===myTeam?'#5aa8ff':'#ff5a5a'); }
    for(const m of mons){ if(m.dead) continue; const p=G3.toScreen(m.x,m.big?5:2.6,m.z); if(!p[2]) continue; bar(p[0]-(m.big?40:22),p[1],m.big?80:44,m.big?6:4,m.hp/m.max,'#ffb040'); }
    for(const h of heroes){ if(h.dead) continue; const p=G3.toScreen(h.x,3.25,h.z); if(!p[2]||p[0]<-60||p[0]>W+60||p[1]<-30||p[1]>H+30) continue; const col=h.me?'#5fd068':h.team===myTeam?'#3d8bff':'#ff4a4a',w=66;
      bar(p[0]-w/2+8,p[1],w-8,7,h.hp/h.max,col); if(h.shield>0){ c.fillStyle='rgba(235,240,255,.9)'; c.fillRect(p[0]-w/2+8,p[1]+7,(w-8)*clamp(h.shield/h.max,0,1),2); }
      for(let k=1;k*500<h.max;k++){ c.fillStyle='rgba(0,0,0,.5)'; c.fillRect(p[0]-w/2+8+(w-8)*k*500/h.max,p[1],1,7); }
      c.fillStyle='rgba(10,10,20,.85)'; c.beginPath(); c.arc(p[0]-w/2+2,p[1]+3.5,8,0,TAU); c.fill(); c.fillStyle='#fff'; c.font='900 10px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(h.lvl,p[0]-w/2+2,p[1]+4);
      c.font='700 11px '+TC; c.lineWidth=3; c.strokeStyle='rgba(0,0,0,.7)'; const nm=h.def.n+(h.human&&!h.me?'・'+h.name:''); c.strokeText(nm,p[0]+4,p[1]-8); c.fillStyle=h.me?'#ffe066':'#fff'; c.fillText(nm,p[0]+4,p[1]-8);
      if(h.recall>0){ bar(p[0]-30,p[1]+14,60,4,1-h.recall/3.5,'#9ad8ff'); } } }
  function drawFloats(){ for(const f of floats){ const p=G3.toScreen(f.x+f.dx,2.8+f.t*1.6,f.z); if(!p[2]) continue; c.globalAlpha=Math.min(1,(1-f.t)*2); c.font='900 '+(f.mine?15:13)+'px '+TC; c.textAlign='center'; c.lineWidth=3; c.strokeStyle='rgba(0,0,0,.75)'; c.strokeText(f.txt,p[0],p[1]); c.fillStyle=f.col; c.fillText(f.txt,p[0],p[1]); } c.globalAlpha=1; }
  function drawFeed(){ let y=74; for(const f of feed){ if(f.big) continue; c.globalAlpha=Math.min(1,f.t); c.font='900 13px '+TC; const w=c.measureText(f.s).width+24; c.fillStyle='rgba(10,10,24,.7)'; rr(c,W/2-w/2,y,w,24,12); c.fill(); c.fillStyle=f.col; c.textAlign='center'; c.textBaseline='middle'; c.fillText(f.s,W/2,y+12.5); y+=28; }
    const bigs=feed.filter(f=>f.big); bigs.slice(-1).forEach(f=>{ c.globalAlpha=Math.min(1,f.t*2); c.font='900 18px '+TC; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='rgba(0,0,0,.75)'; c.strokeText(f.s,W/2,H*.38); c.fillStyle=f.col; c.fillText(f.s,W/2,H*.38); }); c.globalAlpha=1; }
  function drawHUD(){ const mh=myHero(); if(!mh) return; const S=stats(mh);
    // 上方比分、時間
    c.fillStyle='rgba(10,10,24,.75)'; rr(c,W/2-110,6,220,40,12); c.fill(); c.textAlign='center'; c.textBaseline='middle'; c.font='900 22px '+TC; c.fillStyle=TEAMC[myTeam]; c.fillText(kills[myTeam],W/2-58,26); c.fillStyle=TEAMC[1-myTeam]; c.fillText(kills[1-myTeam],W/2+58,26); c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText(fmtT(Tm),W/2,26);
    // 右上：自己的戰績、金幣
    c.fillStyle='rgba(10,10,24,.75)'; rr(c,W-212,6,204,40,12); c.fill(); c.textAlign='left'; c.font='900 14px '+TC; c.fillStyle='#fff'; c.fillText(mh.kc+' / '+mh.dc+' / '+mh.ac,W-200,26); c.fillStyle='#ffd23f'; c.fillText('● '+Math.floor(mh.gold),W-104,26);
    // 隊伍增益
    let bx=W/2+120; for(const [k,lab,colr] of [['dmg','岩魔之力','#c08aff'],['reg','巨獸之息','#8affc8']]){ const v=teamBuff[myTeam][k]; if(v>0){ c.fillStyle='rgba(10,10,24,.75)'; rr(c,bx,10,96,30,10); c.fill(); c.fillStyle=colr; c.font='900 11px '+TC; c.fillText(lab+' '+Math.ceil(v),bx+8,26); bx+=100; } }
    // 左下：頭像、等級經驗、血量、裝備、商店
    const px=12,py=HUDY(),iy=py+70,by=py+98; c.fillStyle='rgba(10,10,24,.78)'; rr(c,px,py,236,66,12); c.fill(); portrait(c,px+34,py+33,52,mh.def);
    c.fillStyle='#fff'; c.font='900 14px '+TC; c.textAlign='left'; c.fillText(mh.def.n+'　Lv '+mh.lvl,px+66,py+16); bar(px+66,py+28,158,9,mh.hp/mh.max,'#5fd068'); c.fillStyle='#fff'; c.font='700 9px '+TC; c.textAlign='center'; c.fillText(Math.round(mh.hp)+' / '+Math.round(mh.max),px+145,py+33); bar(px+66,py+44,158,5,mh.lvl>=MAXL?1:mh.xp/XPN(mh.lvl),'#ffd23f');
    c.textAlign='left'; c.font='700 10px '+TC; c.fillStyle='#cfc8ff'; c.fillText('攻 '+Math.round(S.atk)+'　甲 '+Math.round(S.arm)+'　速 '+S.spd.toFixed(1),px+66,py+58);
    for(let i=0;i<6;i++){ const it=mh.items[i],x=px+i*39; c.fillStyle='rgba(10,10,24,.78)'; rr(c,x,iy,36,24,6); c.fill(); if(it){ c.fillStyle=ITEMS[it].col; rr(c,x+2,iy+2,32,20,5); c.fill(); c.fillStyle='#14122b'; c.font='900 10px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(ITEMS[it].n.slice(0,2),x+18,iy+12.5); } }
    const nxt=mh.build[mh.items.length],it=nxt&&ITEMS[nxt],can=it&&mh.gold>=it.c; c.fillStyle=can?'rgba(255,210,63,.95)':'rgba(10,10,24,.78)'; rr(c,12,by,180,42,10); c.fill(); c.strokeStyle='#ffd23f'; c.lineWidth=1.5; c.stroke();
    c.fillStyle=can?'#14122b':'#fff'; c.textAlign='left'; c.font='900 13px '+TC; c.textBaseline='middle'; c.fillText(it?'買 '+it.n:'裝備已滿',22,by+14); c.font='700 10px '+TC; c.fillText(it?'● '+it.c+(env.touch?'':'　(P)'):'',22,by+31);
    c.fillStyle=mh.auto?'#5fd068':'rgba(10,10,24,.78)'; rr(c,196,by,54,42,10); c.fill(); c.fillStyle=mh.auto?'#0b2a10':'#fff'; c.font='900 11px '+TC; c.textAlign='center'; c.fillText('自動',223,by+14); c.fillText(mh.auto?'開':'關',223,by+30);
    // 技能按鈕
    const keys={atk:env.touch?'':'J',s0:'K',s1:'L',s2:'I',sm:'F',rc:'B'};
    for(const b of BTN()){ if(!b.r) continue; let lab='',cdv=0,cdm=1,dis=false,col='#2b2759';
      if(b.k==='atk'){ lab='攻擊'; col='#c8342a'; }
      else if(b.k[0]==='s'&&b.k!=='sm'){ const i=+b.k[1],s=mh.def.sk[i]; lab=s.n; cdv=mh.cd[i]; cdm=s.cd; dis=!unlocked(mh,i); col=i===2?'#7a3ab8':'#2f5a9a'; }
      else if(b.k==='sm'){ if(!S.jg) continue; lab='懲擊'; cdv=mh.smCd; cdm=28; col='#3a8a5a'; }
      else if(b.k==='rc'){ lab='回城'; col='#2a6a8a'; }
      c.save(); c.globalAlpha=mh.dead?.4:1; const g=c.createRadialGradient(b.x-b.r*.3,b.y-b.r*.3,2,b.x,b.y,b.r); g.addColorStop(0,shadeHex(col,1.5)); g.addColorStop(1,col); c.fillStyle=g; c.beginPath(); c.arc(b.x,b.y,b.r,0,TAU); c.fill(); c.strokeStyle='rgba(255,255,255,.75)'; c.lineWidth=2; c.stroke();
      if(cdv>0){ c.fillStyle='rgba(0,0,0,.6)'; c.beginPath(); c.moveTo(b.x,b.y); c.arc(b.x,b.y,b.r,-PI/2,-PI/2+TAU*cdv/cdm); c.closePath(); c.fill(); }
      if(dis){ c.fillStyle='rgba(0,0,0,.65)'; c.beginPath(); c.arc(b.x,b.y,b.r,0,TAU); c.fill(); }
      c.fillStyle='#fff'; c.textAlign='center'; c.textBaseline='middle'; c.font='900 '+(b.k==='atk'?16:b.r>28?11:10)+'px '+TC; c.fillText(cdv>0?Math.ceil(cdv):lab.length>3?lab.slice(0,2):lab,b.x,b.y+(cdv>0?0:-1)); if(cdv<=0&&lab.length>3){ c.fillText(lab.slice(2),b.x,b.y+12); }
      if(dis){ c.font='700 9px '+TC; c.fillText('Lv'+[1,2,4][+b.k[1]],b.x,b.y+b.r-9); }
      if(keys[b.k]&&!env.touch){ c.fillStyle='#ffd23f'; c.font='900 10px '+TC; c.fillText(keys[b.k],b.x+b.r*.7,b.y-b.r*.75); } c.restore(); }
    // 搖桿
    if(env.touch){ const jx=J.on?J.cx:120,jy=J.on?J.cy:H-115; c.globalAlpha=J.on?.8:.45; c.fillStyle='rgba(255,255,255,.18)'; c.beginPath(); c.arc(jx,jy,56,0,TAU); c.fill(); c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=2; c.stroke(); c.fillStyle='rgba(255,255,255,.75)'; c.beginPath(); c.arc(jx+J.x*46,jy+J.y*46,24,0,TAU); c.fill(); c.globalAlpha=1; }
    // 陣亡
    if(mh.dead){ c.fillStyle='rgba(30,30,40,.45)'; c.fillRect(0,0,W,H); c.fillStyle='#fff'; c.font='900 28px '+TC; c.textAlign='center'; c.fillText('陣亡　'+Math.ceil(mh.rsp)+' 秒後復活',W/2,H*.42); }
    if(Tm<6){ c.font='900 14px '+TC; c.textAlign='center'; c.fillStyle='rgba(10,10,24,.75)'; const s=env.touch?'左邊拖曳移動，右邊按攻擊和技能，打掉對方主堡就贏':'WASD／方向鍵移動，J 攻擊，K L I 技能，打掉對方主堡就贏'; const w=c.measureText(s).width+30; rr(c,W/2-w/2,H-130,w,30,14); c.fill(); c.fillStyle='#ffe066'; c.fillText(s,W/2,H-114); } }
  function drawMini(){ const mm=mode===0?{w:150,h:150}:{w:230,h:56},x0=10,y0=10,B=map.B+4,sx=mm.w/(B*2),sz=mode===0?mm.h/(B*2):mm.h/((map.cliff+3)*2),P=(x,z)=>{ let X=x,Z=z; if(flip){ X=-x; Z=-z; } return [x0+mm.w/2+X*sx,y0+mm.h/2+Z*sz]; };
    c.fillStyle='rgba(20,40,20,.82)'; rr(c,x0,y0,mm.w,mm.h,10); c.fill(); c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=1.5; c.stroke();
    c.save(); rr(c,x0,y0,mm.w,mm.h,10); c.clip(); if(map.river){ c.strokeStyle='rgba(80,160,200,.7)'; c.lineWidth=4; c.beginPath(); const a=P(-66,-66),b=P(66,66); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]); c.stroke(); }
    c.strokeStyle='rgba(220,200,150,.8)'; c.lineWidth=3; for(const L of map.lanes){ c.beginPath(); L.pts.forEach((p,i)=>{ const q=P(p[0],p[1]); i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]); }); c.stroke(); }
    for(const m of mons){ if(m.dead) continue; const q=P(m.x,m.z); c.fillStyle=m.big?'#ffb040':'#d8c080'; c.beginPath(); c.arc(q[0],q[1],m.big?3.5:2,0,TAU); c.fill(); }
    for(const s of towers.concat(cores)){ if(s.hp<=0) continue; const q=P(s.x,s.z); c.fillStyle=s.team===myTeam?'#3d8bff':'#ff4a4a'; c.fillRect(q[0]-(s.k==='c'?4:2.5),q[1]-(s.k==='c'?4:2.5),s.k==='c'?8:5,s.k==='c'?8:5); }
    for(const m of minions){ if(m.dead) continue; const q=P(m.x,m.z); c.fillStyle=m.team===myTeam?'#9ac8ff':'#ffa0a0'; c.fillRect(q[0]-1,q[1]-1,2,2); }
    for(const h of heroes){ if(h.dead) continue; const q=P(h.x,h.z); c.fillStyle=h.me?'#ffe066':h.team===myTeam?'#3d8bff':'#ff4a4a'; c.beginPath(); c.arc(q[0],q[1],h.me?4.5:3.5,0,TAU); c.fill(); c.strokeStyle='#fff'; c.lineWidth=1; c.stroke(); }
    c.restore(); }
  function drawPick(){ const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#1a1440'); g.addColorStop(1,'#0a0a1c'); c.fillStyle=g; c.fillRect(0,0,W,H);
    c.textAlign='left'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 22px '+TC; c.fillText('選擇英雄',22,28); c.fillStyle='#cfc8ff'; c.font='700 13px '+TC; c.fillText(MODES[mode]+'　'+size+' 對 '+size+'　電腦：'+LV.n+'　剩 '+Math.max(0,Math.ceil(pickT))+' 秒',130,29);
    TABS.forEach((tb,i)=>{ const x=20+i*84,on=i===pkTab; c.fillStyle=on?'#ffd23f':'rgba(255,255,255,.08)'; rr(c,x,52,78,28,14); c.fill(); c.fillStyle=on?'#14122b':'#fff'; c.font='900 13px '+TC; c.textAlign='center'; c.fillText(tb[1],x+39,67); });
    pkList().forEach((h,i)=>{ const x=24+(i%6)*100,y=92+Math.floor(i/6)*82,on=h.i===pkSel,taken=takenBy(myTeam,h.i,mySlot); c.fillStyle=on?'rgba(255,210,63,.25)':'rgba(255,255,255,.06)'; rr(c,x,y,94,76,10); c.fill(); if(on){ c.strokeStyle='#ffd23f'; c.lineWidth=2.5; c.stroke(); }
      portrait(c,x+47,y+30,46,h); c.fillStyle=taken?'#7a7690':'#fff'; c.font='900 12px '+TC; c.textAlign='center'; c.fillText(h.n,x+47,y+62); c.fillStyle=CLS[h.cls].col; c.font='700 9px '+TC; c.fillText(CLS[h.cls].n,x+47,y+72); if(taken){ c.fillStyle='rgba(0,0,0,.5)'; rr(c,x,y,94,76,10); c.fill(); c.fillStyle='#fff'; c.fillText('隊友已選',x+47,y+38); } });
    const d=HEROES[pkSel],x0=632; c.fillStyle='rgba(255,255,255,.06)'; rr(c,x0,46,316,486,14); c.fill(); portrait(c,x0+52,96,80,d); c.textAlign='left'; c.fillStyle='#fff'; c.font='900 22px '+TC; c.fillText(d.n,x0+102,82); c.fillStyle=CLS[d.cls].col; c.font='900 14px '+TC; c.fillText(CLS[d.cls].n,x0+102,108);
    d.sk.forEach((s,i)=>{ const y=148+i*52; c.fillStyle=i===2?'#c8a0ff':'#9ad8ff'; c.font='900 13px '+TC; c.fillText((['技能一','技能二','大招'][i])+'：'+s.n,x0+14,y); c.fillStyle='#cfc8ff'; c.font='700 11px '+TC; c.fillText(skDesc2(s)+'（冷卻 '+s.cd+' 秒）',x0+14,y+20); });
    if(mode===0){ c.fillStyle='#ffd23f'; c.font='900 13px '+TC; c.fillText('我要打：',x0+8,358); ROLES.forEach(([id,n],i)=>{ const bx=640+(i%3)*102,by=372+Math.floor(i/3)*34,on=slots[mySlot].role===id; c.fillStyle=on?'#ffd23f':'rgba(255,255,255,.1)'; rr(c,bx,by,96,28,12); c.fill(); c.fillStyle=on?'#14122b':'#fff'; c.font='900 12px '+TC; c.textAlign='center'; c.fillText(n+(id==='jg'?'（打野刀）':''),bx+48,by+15); c.textAlign='left'; }); }
    c.fillStyle=pkDone?'#5a5a7a':'#ffd23f'; rr(c,700,452,240,48,14); c.fill(); c.fillStyle='#14122b'; c.font='900 18px '+TC; c.textAlign='center'; c.fillText(pkDone?'等待其他玩家…':'確定（Enter）',820,477);
    // 隊友
    c.textAlign='left';
    const tm=slots.filter(s=>s.team===myTeam); c.fillStyle='#cfc8ff'; c.font='700 11px '+TC; c.fillText('隊友：'+tm.filter(s=>s!==slots[mySlot]).map(s=>(ROLE_N[s.role]||'')+' '+(s.human>=0?s.name:'電腦')+(s.hero>=0&&s.ok?'（'+HEROES[s.hero].n+'）':'')).join('、'),24,520,600);
    if(!pkDone){ const K=env; if(K.hit('ArrowRight')) pkSel=(pkSel+1)%30; if(K.hit('ArrowLeft')) pkSel=(pkSel+29)%30; if(K.hit('ArrowDown')) pkSel=(pkSel+6)%30; if(K.hit('ArrowUp')) pkSel=(pkSel+24)%30; if(K.hit('Enter')||K.hit('Space')) confirmPick(); }
    drawFeed(); }
  const ROLE_N={top:'上路',jg:'打野',mid:'中路',bot:'下路',sup:'輔助'};
  function skDesc2(s){ const SK_TXT={dash:'往敵人衝過去',blink:'瞬間移動',strike:'重擊眼前的敵人',nova:'傷害身邊的敵人',blast:'在敵人位置引爆',shot:'射出飛彈',pierce:'直線貫穿敵人',shield:'得到護盾',heal:'治療',buff:'強化自己',exec:'斬殺殘血敵人',pull:'把敵人拉過來',storm:'持續傷害一片區域'};
    let t2=SK_TXT[s.t]; if(s.t==='heal') t2=s.self?'治療自己':'治療自己和隊友'; if(s.t==='shield'&&s.ally) t2='自己和隊友得到護盾'; if(s.t==='buff'&&s.ally) t2='強化自己和隊友'; if(s.back) t2='往後翻滾閃開'; const ex=[]; if(s.st) ex.push('暈眩'); if(s.sl) ex.push('緩速'); return t2+(ex.length?'＋'+ex.join('、'):''); }
  function shadeHex(h,k){ const n=parseInt(String(h).slice(1),16); if(isNaN(n)) return h; const f=v=>clamp(Math.round(k>1?v+(255-v)*(k-1):v*k),0,255); return 'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')'; }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('pointermove',onMove); removeEventListener('pointerup',onUp); removeEventListener('pointercancel',onUp); G3.destroy(); },
    _dbg:{G3,clearEv(){ EV=[]; feed.length=0; floats.length=0; },get heroes(){return heroes;},get minions(){return minions;},towers,cores,mons,slots,get phase(){return phase;},get T(){return Tm;},confirmPick,botPicks,map,stats,sim,cast,get winner(){return winner;},setPick(i){ pkSel=i; },kills}}; }
/* ---------- 開始畫面的示意圖 ---------- */
function art(ctx,w,h,si,t){ const M0=window.__MOBA; const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#1e3a24'); g.addColorStop(1,'#0e1e12'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); if(!M0) return;
  const map=M0.buildMap(si,7),s=Math.min(w,h)/(si?60:150),P=(x,z)=>[w/2+x*(si?w/150:s),h/2+z*(si?h/40:s)];
  for(let i=0;i<60;i++){ const x=(i*97%w),y=(i*53%h); ctx.fillStyle='rgba(60,110,50,.5)'; ctx.beginPath(); ctx.arc(x,y,6+i%5,0,TAU); ctx.fill(); }
  if(map.river){ ctx.strokeStyle='#3a8aa8'; ctx.lineWidth=8*s; ctx.beginPath(); const a=P(-66,-66),b=P(66,66); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); }
  ctx.strokeStyle='#c8b890'; ctx.lineWidth=(si?h/5:8*s); ctx.lineCap='round'; for(const L of map.lanes){ ctx.beginPath(); L.pts.forEach((p,i)=>{ const q=P(p[0],p[1]); i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]); }); ctx.stroke(); }
  for(const o of map.obst){ const q=P(o.x,o.z); ctx.fillStyle='#2a5a2a'; ctx.beginPath(); ctx.arc(q[0],q[1],o.r*s,0,TAU); ctx.fill(); }
  for(const cp of map.camps){ const q=P(cp.x,cp.z); ctx.fillStyle=cp.big?'#ffb040':'#d8c080'; ctx.beginPath(); ctx.arc(q[0],q[1],cp.big?6:3.5,0,TAU); ctx.fill(); }
  for(const tw of map.towers.concat(map.cores)){ const q=P(tw.x,tw.z),core=tw.id>=200; ctx.fillStyle=M0.TEAMC[tw.team]; ctx.fillRect(q[0]-(core?8:5),q[1]-(core?8:5),core?16:10,core?16:10); ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.strokeRect(q[0]-(core?8:5),q[1]-(core?8:5),core?16:10,core?16:10); }
  for(const L of map.lanes) for(let tm=0;tm<2;tm++) for(let k=0;k<3;k++){ const u=((t*.05+k*.12)%.5),p=M0.along(L,tm?L.len*(1-u):L.len*u),q=P(p[0],p[1]); ctx.fillStyle=tm?'#ff8a8a':'#8ac8ff'; ctx.beginPath(); ctx.arc(q[0],q[1],3,0,TAU); ctx.fill(); }
  ctx.fillStyle='rgba(10,10,24,.7)'; ctx.fillRect(0,h-34,w,34); ctx.fillStyle='#ffd23f'; ctx.font='900 '+Math.round(h*.07)+'px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(MODES[si]+(si?'：一條路、5 對 5':'：三路＋野區、5 對 5'),w/2,h-17); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).moba={
  name:'鬥魂峽谷',tag:'BATTLE ARENA',color:'#7a5cff',online:true,maxPlayers:10,netVariants:false,wide:true,
  desc:'5 對 5 推塔對戰！30 位原創英雄（坦克、戰士、刺客、法師、射手、輔助），上中下三路、兩塊野區、大小野怪和打野刀，也有一條路的單路激戰。連線最多 10 人，不夠的位置由電腦補。',
  goal:'跟著小兵推掉對方的防禦塔，最後打掉對方主堡就贏。打小兵、野怪、敵人拿金幣自動買裝備，等級 2 學第二招、等級 4 學大招。',
  stages:MODES,stageLabel:'選擇模式',stageShow:(ctx,w,h,si,t)=>art(ctx,w,h,si,t),
  stageGoal:si=>si?'單路激戰：只有一條路，沒有野區，雙方各兩座塔和主堡，一路打到底。':'三路峽谷：上中下三條路各有兩座塔，中路和上路、中路和下路之間各有一塊野區（1 隻大野怪＋3 隻小野怪）。打野的人選「打野」，第一件裝備是打野刀，可以用懲擊。',
  modes:[{id:'1p',label:'單人'}],
  options:[{key:'size',label:'對戰人數',def:'5',opts:[1,2,3,4,5].map(n=>({id:String(n),label:n+' 對 '+n}))},{key:'lv',label:'電腦強度',def:'mid',opts:[{id:'easy',label:'簡單'},{id:'mid',label:'中等'},{id:'hard',label:'困難'}]}],
  optNote:()=>'連線時真人輪流分到兩隊，不夠的位置由電腦補上。',
  help:[['W A S D','移動（方向鍵也可以）'],['J','攻擊（按住連續打，會自動選目標）'],['K L I','技能一、技能二、大招（自動瞄準）'],['F B P','懲擊（要有打野刀）、回城、買裝備']],
  touchHelp:[['左邊拖曳','移動'],['攻擊','按住連續打，自動選目標'],['技能','三個技能會自動瞄準'],['回城／買裝備','回泉水補血；裝備預設自動買']],
  touch:{left:[],right:[]},
  best:{label:'勝場',fmt:v=>v+' 勝',lower:false},
  load:()=>{ const K=window.ARCADE_GAMES.kart; return K&&K.load?K.load().catch(()=>{}):Promise.resolve(); },
  thumb:(ctx,w,h,t)=>art(ctx,w,h,0,t),create};
})();
