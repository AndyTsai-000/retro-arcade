// 星界裂谷：遊戲本體（戰鬥、電腦、操作、畫面上的介面、連線）。資料在 moba.js、3D 在 moba3d.js。
(function(){
'use strict';
const W=960,H=540,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PI=Math.PI,TAU=PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k,dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function rr(c,x,y,w,h,r){ r=Math.min(r,w/2,h/2); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const MODES=['三路峽谷','單路激戰'];
const LVS={easy:{dm:.68,re:.7,sk:.45,ret:.38,n:'簡單'},mid:{dm:.88,re:.4,sk:.8,ret:.3,n:'中等'},hard:{dm:1.05,re:.22,sk:1,ret:.24,n:'困難'}};
const ROLE_CLS={top:['tank','fighter'],jg:['assassin','fighter'],mid:['mage'],bot:['marksman'],sup:['support','tank']};
const TW_R=8.5,CORE_R=9.5,XPN=l=>120+l*80,MAXL=18;
function create(env,opts){
  const M0=window.__MOBA,G3M=window.__MOBA3D,T=window.THREE,H3=window.__H3D,{ctx:c,canvas}=env.canvas2d(W,H);
  if(!M0||!G3M||!T||!H3){ c.fillStyle='#14122b'; c.fillRect(0,0,W,H); c.fillStyle='#fff'; c.font='900 22px '+TC; c.textAlign='center'; c.fillText('3D 元件載入失敗，請重新整理再試',W/2,H/2); setTimeout(()=>env.end({title:'無法開始',big:'',text:'載不到 three.js'}),2500); return {update(){},draw(){},destroy(){}}; }
  const {HEROES,CLS,ITEMS,TRINK,BUILD,MIN,buildMap,ROLES,portrait,along,project,TEAMC}=M0;
  const net=opts.net,client=!!net&&!net.host,host=!client,OP=opts.options||{},mode=clamp(opts.stage|0,0,1),humans=net?net.count:1,myIdx=net?net.me:0;
  const size=Math.max(clamp(+OP.size||5,1,5),Math.ceil(humans/2)),LV=LVS[OP.lv]||LVS.mid,seed=net?(Number(net.seed)>>>0)||7:(Math.random()*1e9|0),map=buildMap(mode,seed),sfx=n=>env.sfx(n);
  /* ---------- 座位：真人輪流分到兩隊，其餘電腦 ---------- */
  const defRoles=mode?['mid','mid','mid','mid','mid']:size>=5?['top','jg','mid','bot','sup']:size===4?['top','jg','mid','bot']:size===3?['top','mid','bot']:size===2?['mid','bot']:['mid'];
  const slots=[]; for(let tm=0;tm<2;tm++) for(let p=0;p<size;p++) slots.push({team:tm,pos:p,human:-1,hero:-1,role:defRoles[p]||'mid',ok:false});
  for(let k=0;k<humans;k++){ const tm=k%2,p=k>>1; const s=slots[tm*size+p]; s.human=k; }
  const SP_ROLE={top:['flash','ghost'],jg:['flash','smite'],mid:['flash','ignite'],bot:['flash','heal'],sup:['flash','exhaust']}; slots.forEach(s=>{ s.sp=(SP_ROLE[s.role]||SP_ROLE.mid).slice(); });
  slots.forEach((s,i)=>{ s.name=s.human>=0?(net?(net.names&&net.names[s.human])||'玩家'+(s.human+1):(opts.name||'你')):'電腦・'+['阿凱','小雨','大熊','米可','老王','阿哲','小魚','肉丸','阿樂','皮蛋'][i%10]; });
  const mySlot=slots.findIndex(s=>s.human===myIdx),myTeam=slots[mySlot].team,flip=myTeam===1;
  /* ---------- 3D ---------- */
  const G3=G3M(T,{W,H,map,low:!!env.touch});
  /* ---------- 狀態 ---------- */
  let phase='pick',pickT=net?40:75,Tm=0,t=0,ended=false,winner=-1,acc=0,nextWave=12,waveN=0,minId=1000,vpId=1,sendT=0,inT=0,overT=0;
  const heroes=[],minions=[],TWHP=mode?[2200,2800]:[4000,4800],COHP=mode?4200:8000,towers=map.towers.map(q=>Object.assign({k:'t',hp:TWHP[q.tier],max:TWHP[q.tier],r:1.7,cd:0,tgt:null,hits:0,inv:false},q)),cores=map.cores.map(q=>Object.assign({k:'c',hp:COHP,max:COHP,r:3.6,cd:0,tgt:null,hits:0,inv:true},q));
  const mons=map.camps.map((cp,i)=>({id:300+i,k:'j',camp:cp,big:cp.big,kind:cp.kind,team:2,x:cp.x,z:cp.z,home:[cp.x,cp.z],hp:0,max:1,dead:true,rsp:cp.big?75:25,face:PI/2,cd:0,tgt:null,r:cp.big?1.8:1,slam:6}));
  const teamBuff=[{dmg:0,reg:0},{dmg:0,reg:0}],kills=[0,0],projs=[],zones=[],timers=[],floats=[],feed=[],anns=[],vproj=new Map(); let firstB=0;
  let EV=[],sendEV=[];
  /* ---------- 視野：草叢、眼、戰爭迷霧 ---------- */
  const wards=[],VIS=[new Set(),new Set()],VSRC=[[],[]],BUSH=map.bush||[]; let wardId=5000,visT=0,fogLast=-9;
  const bushAt=(x,z)=>{ for(let i=0;i<BUSH.length;i++){ const b=BUSH[i]; if((x-b.x)*(x-b.x)+(z-b.z)*(z-b.z)<b.r*b.r) return i; } return -1; };
  const seen=(u,tm)=>!u||u.team===tm||u.k==='t'||u.k==='c'||u.k==='j'||VIS[tm].has(u.id);
  function updVis(){ const all=[...heroes,...minions,...mons]; for(const u of all) u.bi=alive(u)?bushAt(u.x,u.z):-1;
    for(let tm=0;tm<2;tm++){ const V=VIS[tm],S=[]; V.clear();
      for(const h of heroes) if(h.team===tm&&alive(h)) S.push([h.x,h.z,10,h.bi,0]);
      for(const m of minions) if(m.team===tm&&alive(m)) S.push([m.x,m.z,7,m.bi,0]);
      for(const q of towers) if(q.team===tm&&q.hp>0) S.push([q.x,q.z,11,-1,0]);
      if(cores[tm].hp>0) S.push([cores[tm].x,cores[tm].z,12,-1,0]); const F=map.fount[tm]; S.push([F[0],F[1],15,-1,0]);
      for(const w of wards) if(w.team===tm) S.push([w.x,w.z,9,-1,1]);
      VSRC[tm]=S;
      for(const u of all){ if(u.team===tm||!alive(u)) continue; for(const q of S){ const dx=u.x-q[0],dz=u.z-q[1]; if(dx*dx+dz*dz>q[2]*q[2]) continue; if(u.bi<0||q[4]||q[3]===u.bi||u.k==='h'&&u.revT>Tm){ V.add(u.id); break; } } }
      for(const w of wards){ if(w.team===tm) continue; if(heroes.some(h=>h.team===tm&&alive(h)&&h.lens>0&&Math.hypot(h.x-w.x,h.z-w.z)<9)) V.add(w.id); } } }
  const units=function*(){ yield* heroes; yield* minions; for(const m of mons) yield m; };
  const GS={units,towers,cores,wards:()=>wards.filter(w=>w.team===myTeam||VIS[myTeam].has(w.id)).map(w=>(w.en=w.team!==myTeam,w))};
  const emit=e=>{ EV.push(e); if(host&&net) sendEV.push(e); };
  const byId=id=>{ if(id>=5000) return wards.find(w=>w.id===id); if(id<100) return heroes[id-1]; if(id<200) return towers.find(q=>q.id===id); if(id<300) return cores[id-200]; if(id<1000) return mons[id-300]; return minions.find(q=>q.id===id); };
  /* ---------- 英雄數值 ---------- */
  // 魔力：放技能才會用掉，沒魔力就不能放；平常慢慢回，回到泉水回最快
  const MPB={tank:[300,40],fighter:[280,38],assassin:[300,40],mage:[420,55],marksman:[330,42],support:[400,50]},SKC=[40,50,60,100],skCost=(h,i)=>SKC[i]+Math.max(0,h.sk[i]-1)*(i===3?20:8);
  function stats(h){ const C=CLS[h.def.cls],l=h.lvl-1,o={mp:MPB[h.def.cls][0]+MPB[h.def.cls][1]*l,atk:C.atk+C.atkL*l,as:C.as+(h.def.cls==='marksman'?.02*l:.01*l),arm:C.arm+C.armL*l,hp:C.hp+C.hpL*l,spd:C.spd,sp:0,cdr:0,ls:0,heal:0,dmg:0,jg:0,rng:C.rng};
    for(const id of h.items){ const it=ITEMS[id]; o.atk+=it.atk||0; o.as+=(it.as||0)*C.as; o.arm+=it.arm||0; o.hp+=it.hp||0; o.spd+=(it.spd||0)*C.spd; o.sp+=it.sp||0; o.cdr+=it.cdr||0; o.ls+=it.ls||0; o.heal+=it.heal||0; o.mp+=it.mp||0; if(it.jg) o.jg=1; }
    for(const b of h.buffs){ o.as+=(b.as||0)*C.as; o.spd+=(b.spd||0)*C.spd; o.dmg+=b.dmg||0; o.arm+=b.arm||0; }
    const tb=teamBuff[h.team]; if(tb.dmg>0) o.dmg+=.2; if(tb.reg>0) o.spd*=1.1;
    if(h.slow>0) o.spd*=.6; if(h.weak>0){ o.dmg-=.4; o.as*=.8; } o.as=Math.min(2.6,o.as); return o; }
  function mkHero(s,i){ const d=HEROES[s.hero],h={id:i+1,k:'h',slot:i,team:s.team,def:d,name:s.name,human:s.human>=0,me:i===mySlot,role:s.role,lvl:1,xp:0,gold:mode?600:500,items:[],sk:[0,0,0,0],pots:0,potT:0,icd:{},tk:s.human<0&&(s.role==='sup'||s.role==='jg')?'r':'g',tcd:0,lens:0,stasis:0,revT:0,x:map.fount[s.team][0],z:map.fount[s.team][1],face:s.team?PI*.75:-PI/4,hp:1,max:1,r:.7,dead:false,rsp:0,cd:[0,0,0,0],atkCd:0,atkT:0,atkDur:.35,castT:0,shield:0,shT:0,stun:0,slow:0,buffs:[],recall:0,sp:(s.sp||['flash','heal']).slice(),spCd:[0,0],kc:0,dc:0,ac:0,streak:0,hits:{},force:0,dash:null,auto:true,mx:0,mz:0,wantAtk:false,q:[],ai:{t:0,mode:null,tgt:null,goal:null,path:null,pg:null}};
    h.max=h.hp=stats(h).hp; h.mpMax=h.mp=stats(h).mp; if(s.role==='jg'&&mode===0) h.build=['jg'].concat(BUILD[d.cls].slice(0,5)); else h.build=BUILD[d.cls].slice(); return h; }
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
  function dmg(src,tgt,amt,o){ o=o||{}; if(!alive(tgt)||tgt.inv) return 0;
    if(tgt.k==='w'){ tgt.hp-=1; emit(['hit',+tgt.x.toFixed(1),+tgt.z.toFixed(1),'#ff4a4a']); if(tgt.hp<=0) killWard(tgt,src); return 1; }
    if(tgt.stasis>0) return 0; if(src&&src.k==='h'){ const S=stats(src); amt*=1+S.dmg; if(!src.human) amt*=LV.dm; if(tgt.k==='j'&&S.jg) amt*=1.3; }
    if(!o.tru) amt*=100/(100+Math.max(0,armorOf(tgt)));
    if(tgt.shield>0){ const a=Math.min(tgt.shield,amt); tgt.shield-=a; amt-=a; } tgt.hp-=amt;
    if(tgt.k==='h'){ tgt.recall=0; if(src&&src.k==='h'){ tgt.hits[src.id]=Tm; src.hitHeroT=Tm; } tgt.lastHitBy=src; }
    if(tgt.k==='j'&&src&&!tgt.tgt) tgt.tgt=src; if(tgt.k==='j'&&src&&src.k==='h') tgt.tgt=src;
    if(src&&src.k==='h'&&o.basic){ const S=stats(src); if(S.ls>0) src.hp=Math.min(src.max,src.hp+amt*S.ls); }
    if(amt>=1&&(tgt.k==='h'||src&&src.k==='h')) emit(['dn',+tgt.x.toFixed(1),+tgt.z.toFixed(1),Math.round(amt),o.tru?'#ffffff':o.skill?'#c8a0ff':tgt.k==='h'?'#ff6a5a':'#ffe8a0',tgt.id,src?src.id:0]);
    if(tgt.hp<=0) die(tgt,src); return amt; }
  function heal(h,amt){ if(!alive(h)) return; const S=stats(h); if(h.burn) amt*=.5; h.hp=Math.min(h.max,h.hp+amt); emit(['dn',+h.x.toFixed(1),+h.z.toFixed(1),'+'+Math.round(amt),'#5fff7a',h.id,0]); }
  function gainXp(h,n){ if(h.lvl>=MAXL) return; h.xp+=n; while(h.lvl<MAXL&&h.xp>=XPN(h.lvl)){ h.xp-=XPN(h.lvl); h.lvl++; if(h.bot) botLv(h); else if(h.me) floatMsg('升到 '+h.lvl+' 等！可以點技能 ＋','#ffe066',1.4); const r0=h.hp/h.max; h.max=stats(h).hp; h.hp=h.max*r0+80; { const m0=h.mp/h.mpMax; h.mpMax=stats(h).mp; h.mp=Math.min(h.mpMax,h.mpMax*m0+60); } h.hp=Math.min(h.hp,h.max); emit(['beam',+h.x.toFixed(1),+h.z.toFixed(1),.9,'#ffe066',.7]); if(h.me) emit(['sfx','heal']); } }
  function die(u,src){ u.hp=0;
    if(u.k==='h'){ u.dead=true; u.rsp=Math.min(32,4+u.lvl*2.1); u.dc++; u.streak=0; u.shield=0; u.buffs=[]; u.recall=0; u.dash=null; let killer=src&&src.k==='h'?src:null;
      if(!killer){ let best=0; for(const id in u.hits){ const hh=heroes[id-1]; if(hh&&hh.team!==u.team&&u.hits[id]>best&&Tm-u.hits[id]<10){ best=u.hits[id]; killer=hh; } } }
      const asst=heroes.filter(hh=>hh!==killer&&hh.team!==u.team&&u.hits[hh.id]!=null&&Tm-u.hits[hh.id]<10);
      if(killer){ killer.mk=Tm-(killer.mkT==null?-99:killer.mkT)<10?(killer.mk||0)+1:1; killer.mkT=Tm; let an=firstB?'擊殺':'第一滴血'; firstB=1; if(killer.mk>=2) an=['雙殺','三殺','四殺','五殺！'][Math.min(3,killer.mk-2)]; else if(killer.streak>=2) an=['','','三連殺','四連殺','五連殺','勢不可擋'][Math.min(5,killer.streak+1)]||an; emit(['ann',an,killer.id,u.id,killer.team]); } else emit(['ann','陣亡',0,u.id,1-u.team]);
      if(killer){ killer.kc++; killer.streak++; killer.gold+=250+Math.min(150,u.streak*40); kills[killer.team]++; } else kills[1-u.team]++;
      asst.forEach(a=>{ a.ac++; a.gold+=110; }); const xpw=[killer].concat(asst).filter(Boolean); xpw.forEach(a=>gainXp(a,(140+u.lvl*28)/Math.max(1,xpw.length)*1.3));
      u.hits={}; emit(['feed',(killer?TEAMN(killer.team)+' '+killer.def.n:'')+(killer?' 擊殺了 ':'')+TEAMN(u.team)+' '+u.def.n+(killer?'':' 陣亡'),killer?killer.team:2]); emit(['boom',+u.x.toFixed(1),+u.z.toFixed(1),2.5,TEAMC[u.team]]); emit(['sfx','die']);
      if(killer&&killer.streak>=3) emit(['feed',killer.def.n+' '+['三連殺！','四連殺！','五連殺！','勢不可擋！'][Math.min(3,killer.streak-3)],killer.team]); }
    else if(u.k==='m'){ u.dead=true; const S=MIN[u.mt]; if(src&&src.k==='h'){ src.gold+=S.gold+Math.round(Tm/60); } const near=heroes.filter(hh=>alive(hh)&&hh.team!==u.team&&dist(hh,u)<13); near.forEach(hh=>gainXp(hh,S.xp*1.25/Math.max(1,near.length)));
      emit(['burst',+u.x.toFixed(1),1,+u.z.toFixed(1),TEAMC[u.team],6,3]); }
    else if(u.k==='j'){ u.dead=true; u.rsp=u.big?120:60; u.tgt=null; const killer=src&&src.k==='h'?src:null; if(killer){ const S=stats(killer),m=S.jg?1.3:1; killer.gold+=Math.round((u.big?220:55)*m); gainXp(killer,(u.big?320:80)*m); heroes.filter(hh=>hh!==killer&&hh.team===killer.team&&alive(hh)&&dist(hh,u)<12).forEach(hh=>gainXp(hh,u.big?160:30));
        if(u.big){ const tb=teamBuff[killer.team]; if(u.kind===0) tb.dmg=90; else tb.reg=90; emit(['feed',TEAMN(killer.team)+' 擊敗了 '+(u.kind===0?'紫晶岩魔（全隊傷害提升）':'翠鱗巨獸（全隊回血、加速）'),killer.team]); emit(['beam',+u.x.toFixed(1),+u.z.toFixed(1),3,u.kind?'#8affc8':'#c08aff',1.2]); } }
      emit(['boom',+u.x.toFixed(1),+u.z.toFixed(1),u.big?4:2,u.big?'#c08aff':'#ffd06a']); }
    else if(u.k==='t'){ heroes.forEach(hh=>{ if(hh.team!==u.team) hh.gold+=150; }); emit(['feed',TEAMN(1-u.team)+' 摧毀了 '+map.laneName[u.lane]+(u.tier?'內塔':'外塔'),1-u.team]); emit(['ann','摧毀防禦塔',src&&src.k==='h'?src.id:0,u.id,1-u.team]); emit(['boom',+u.x.toFixed(1),+u.z.toFixed(1),5,'#ffb040']); emit(['sfx','boom']); invUpdate(); }
    else if(u.k==='c'){ winner=1-u.team; emit(['boom',+u.x.toFixed(1),+u.z.toFixed(1),8,'#ffffff']); emit(['sfx','boom']); } }
  const TEAMN=tm=>['藍方','紅方','野怪'][tm];
  function invUpdate(){ towers.forEach(tw=>{ if(tw.tier===1) tw.inv=towers.some(o=>o.team===tw.team&&o.lane===tw.lane&&o.tier===0&&o.hp>0); else tw.inv=false; });
    cores.forEach(co=>{ co.inv=towers.filter(o=>o.team===co.team&&o.tier===1&&o.hp<=0).length<(mode===0?2:1); }); }
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
        if(!best){ let hd=6; for(const h of heroes) if(h.team!==m.team&&alive(h)&&dist(m,h)<hd&&seen(h,m.team)){ hd=dist(m,h); best=h; } } m.tgt=best; } }
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
    if(!tg){ let bd=1e9; for(const h of heroes) if(h.team!==s.team&&alive(h)&&seen(h,s.team)){ const d=dist(h,s); if(d<=R0&&d<bd){ bd=d; tg=h; } } }
    if(tg!==s.tgt) s.hits=0; s.tgt=tg;
    if(tg&&s.cd<=0){ s.cd=s.k==='c'?1:1.1; let a; if(tg.k==='m') a=tg.max*(tg.mt==='cannon'?.22:.42); else { a=(s.k==='c'?240:175)+Tm/60*9; a*=1+Math.min(6,s.hits)*.35; s.hits++; if(s.hits>=2&&tg.me) floatMsg('防禦塔越打越痛！快離開塔下','#ff8a8a',1.2); }
      const hot=tg.k==='h'?Math.min(6,s.hits-1):0; homing(s,tg,a,{tru:tg.k==='m'},hot>=2?(hot>=4?'#ff3a2a':'#ff9a3d'):TEAMC[s.team],2.2+hot*.35,26); } }
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
    const consider=(u,base)=>{ if(!alive(u)||u.team===h.team||u.inv||!seen(u,h.team)) return; const d=dist(h,u)-(u.r||.6); if(d>R0) return; const sc=base-d*.5-(u.hp/u.max)*20; if(sc>bs){ bs=sc; best=u; } };
    for(const u of heroes) consider(u,prefer==='farm'?50:200); for(const u of minions) consider(u,prefer==='farm'?150:100+(u.hp<stats(h).atk*1.2?60:0)); for(const u of mons) consider(u,prefer==='jg'?220:90); for(const u of towers) consider(u,60); for(const u of cores) consider(u,70);
    return best; }
  function basicAttack(h,tg){ const S=stats(h); if(!alive(tg)) return false; const d=dist(h,tg)-(tg.r||.6); if(d>S.rng+.6) return false; h.face=Math.atan2(tg.z-h.z,tg.x-h.x); if(h.atkCd>0) return true;
    if(h.bi>=0) h.revT=Tm+1.5; h.atkCd=1/S.as; h.atkDur=Math.min(.35,.75/S.as); h.atkT=h.atkDur; h.recall=0; const a=S.atk;
    if(S.rng>3) homing(h,tg,a,{basic:1},h.def.pal.fx,1.1,26); else { dmg(h,tg,a,{basic:1}); emit(['slash',+h.x.toFixed(1),+h.z.toFixed(1),1.5,+h.face.toFixed(2),h.def.pal.fx]); }
    if(h.me||tg.me) emit(['sfx','bump']); return true; }
  const ULT=[6,11,16],SKMAX=[5,5,5,3],unlocked=(h,i)=>h.sk[i]>0;
  const skCap=(h,i)=>i===3?ULT.filter(L=>h.lvl>=L).length:Math.min(5,Math.ceil(h.lvl/2)),skPts=h=>h.lvl-h.sk.reduce((a,b)=>a+b,0),canLv=(h,i)=>skPts(h)>0&&h.sk[i]<skCap(h,i);
  const rkM=(h,i)=>{ const r=Math.max(1,h.sk[i]); return (i===3?1+.45*(r-1):1+.2*(r-1))*(1+.02*(h.lvl-1)); };
  function lvSkill(h,i){ if(!canLv(h,i)) return false; h.sk[i]++; if(h.me){ emit(['sfx','pop']); floatMsg(h.def.sk[i].n+' 升到 '+h.sk[i]+' 級','#9ad8ff',1.2); } return true; }
  function botLv(h){ for(let g=0;g<20&&skPts(h)>0;g++){ if(canLv(h,3)){ lvSkill(h,3); continue; } const f=[0,1,2].find(i=>h.sk[i]===0&&canLv(h,i)); if(f!=null){ lvSkill(h,f); continue; } const m=[0,1,2].find(i=>canLv(h,i)); if(m==null) break; lvSkill(h,m); } }
  const skPow=(h,s,i)=>{ const S=stats(h),C=CLS[h.def.cls]; if(i==null) i=h.def.sk.indexOf(s); return s.d*rkM(h,i)*(1+S.sp)+S.atk*C.ad*.6*(1+.1*(Math.max(1,h.sk[i])-1)); };
  function skillTarget(h,s,aim){ const R0=(s.r||s.a||6)+.8; let best=null,bs=1e9;
    for(const u of [...heroes,...mons,...minions]){ if(!alive(u)||u.team===h.team||dist(h,u)>R0||!seen(u,h.team)) continue;
      const sc=aim?Math.hypot(u.x-aim.x,u.z-aim.z)-(u.k==='h'?1.5:0):(u.k==='h'?u.hp/u.max+dist(h,u)*.02:u.k==='j'?2:3+u.hp/u.max); if(sc<bs){ bs=sc; best=u; } }
    return best; }
  function areaHit(h,x,z,a,amt,cc,col){ let n=0; for(const u of [...enemiesOf(h.team)]) if(Math.hypot(u.x-x,u.z-z)<=a+u.r*.5){ dmg(h,u,amt,{skill:1}); applyCC(u,cc); n++; } for(const s of towers.concat(cores)) if(s.team!==h.team&&s.hp>0&&!s.inv&&Math.hypot(s.x-x,s.z-z)<=a+s.r) dmg(h,s,amt*.4,{skill:1}); return n; }
  function cast(h,i,aim){ if(h.dead||h.stun>0||h.dash||!unlocked(h,i)||h.cd[i]>0||h.mp<skCost(h,i)) return false; const s=h.def.sk[i],S=stats(h),pw=skPow(h,s,i),col=h.def.pal.fx,cc={st:s.st,sl:s.sl},R0=s.r||s.a||6;
    const tg=skillTarget(h,s,aim); if(['strike','exec','pull'].includes(s.t)&&!tg) return false;
    let ang; if(aim&&(['shot','pierce','dash','blink'].includes(s.t)||!tg)) ang=Math.atan2(aim.z-h.z,aim.x-h.x); else ang=tg?Math.atan2(tg.z-h.z,tg.x-h.x):h.face;
    const gp=aim?(()=>{ const dx=aim.x-h.x,dz=aim.z-h.z,d=Math.hypot(dx,dz)||1,k=Math.min(1,R0/d); return [h.x+dx*k,h.z+dz*k]; })():tg?[tg.x,tg.z]:[h.x+Math.cos(ang)*R0*.7,h.z+Math.sin(ang)*R0*.7];
    h.face=ang; h.recall=0; const sx=h.x,sz=h.z,ax=Math.cos(ang),az=Math.sin(ang);
    switch(s.t){
      case 'dash': { const dd=aim?Math.min(R0,Math.hypot(aim.x-sx,aim.z-sz)):tg?Math.max(0,Math.min(R0,dist(h,tg)-1.2)):R0; h.dash={x:sx+ax*dd,z:sz+az*dd,cb:()=>{ if(s.d) areaHit(h,h.x,h.z,s.a||2.2,pw,cc,col); emit(['ring',+h.x.toFixed(1),+h.z.toFixed(1),s.a||2.2,col,.45]); }}; break; }
      case 'blink': { let dd,a2=ang; if(aim) dd=Math.min(R0,Math.max(1.5,Math.hypot(aim.x-sx,aim.z-sz))); else if(s.back){ a2=ang+PI; dd=R0; } else dd=tg?Math.max(0,Math.min(R0,dist(h,tg)-1)):R0;
        const [nx,nz]=map.inB(sx+Math.cos(a2)*dd,sz+Math.sin(a2)*dd); emit(['burst',sx,1,sz,col,10,4]); h.x=nx; h.z=nz; h.face=a2; h.force++; emit(['burst',+nx.toFixed(1),1,+nz.toFixed(1),col,10,4]);
        if(s.d&&!s.back){ const t2=tg&&dist(h,tg)<3.5?tg:null; if(t2){ dmg(h,t2,pw,{skill:1}); applyCC(t2,cc); } } break; }
      case 'strike': dmg(h,tg,pw,{skill:1}); applyCC(tg,cc); emit(['slash',+tg.x.toFixed(1),+tg.z.toFixed(1),2.2,+ang.toFixed(2),col]); emit(['hit',+tg.x.toFixed(1),+tg.z.toFixed(1),col]); break;
      case 'nova': areaHit(h,sx,sz,s.a,pw,cc,col); emit(['ring',+sx.toFixed(1),+sz.toFixed(1),s.a,col,.5]); emit(['ring',+sx.toFixed(1),+sz.toFixed(1),s.a,col,.35,1]); break;
      case 'blast': { const [px,pz]=gp; emit(['ring',+px.toFixed(1),+pz.toFixed(1),s.a,col,.45,1]); timers.push({t:.4,fn:()=>{ areaHit(h,px,pz,s.a,pw,cc,col); emit(['boom',+px.toFixed(1),+pz.toFixed(1),s.a,col]); }}); break; }
      case 'shot': skillshot(h,ang,R0+1,pw,{skill:1,st:s.st,sl:s.sl,col},col,1.6); break;
      case 'pierce': { const len=R0+1,w=(s.w||2.2)/2; for(const u of [...enemiesOf(h.team)]){ const rx=u.x-sx,rz=u.z-sz,along2=rx*ax+rz*az,side=Math.abs(-rx*az+rz*ax); if(along2>-.5&&along2<len&&side<w+u.r*.5){ dmg(h,u,pw,{skill:1}); applyCC(u,cc); } } emit(['line',+sx.toFixed(1),+sz.toFixed(1),+ang.toFixed(3),0,len,w*2,col]); break; }
      case 'shield': { const v=s.v*rkM(h,i)*(1+S.heal); const L0=s.ally?heroes.filter(a=>a.team===h.team&&alive(a)&&dist(a,h)<10):[h]; L0.forEach(a=>{ a.shield=Math.max(a.shield,v); a.shT=4; emit(['ring',+a.x.toFixed(1),+a.z.toFixed(1),1.4,'#9ad8ff',.5]); }); break; }
      case 'heal': { const v=s.v*rkM(h,i)*(1+S.heal+S.sp*.5); const L0=s.self?[h]:heroes.filter(a=>a.team===h.team&&alive(a)&&dist(a,h)<(s.a||8)); L0.forEach(a=>heal(a,v)); emit(['ring',+sx.toFixed(1),+sz.toFixed(1),s.self?1.6:(s.a||8),'#7aff9a',.6,1]); break; }
      case 'buff': { const L0=s.ally?heroes.filter(a=>a.team===h.team&&alive(a)&&dist(a,h)<10):[h]; L0.forEach(a=>{ a.buffs.push({as:s.as,spd:s.spd,dmg:s.dmg,arm:s.arm,t:s.dur||4}); emit(['beam',+a.x.toFixed(1),+a.z.toFixed(1),.9,col,.6]); }); break; }
      case 'exec': { if(s.blink){ const a2=Math.atan2(h.z-tg.z,h.x-tg.x); emit(['burst',sx,1,sz,col,8,4]); [h.x,h.z]=map.inB(tg.x+Math.cos(a2)*1.2,tg.z+Math.sin(a2)*1.2); h.force++; } dmg(h,tg,pw+(tg.max-tg.hp)*s.m,{skill:1}); emit(['slash',+tg.x.toFixed(1),+tg.z.toFixed(1),2.6,+ang.toFixed(2),col]); emit(['boom',+tg.x.toFixed(1),+tg.z.toFixed(1),1.6,col]); break; }
      case 'pull': { const a2=Math.atan2(tg.z-h.z,tg.x-h.x); emit(['line',+sx.toFixed(1),+sz.toFixed(1),+a2.toFixed(3),0,dist(h,tg),.5,col]); if(tg.k!=='t'&&tg.k!=='c'){ [tg.x,tg.z]=map.inB(h.x+Math.cos(a2)*1.6,h.z+Math.sin(a2)*1.6); if(tg.k==='h') tg.force++; } dmg(h,tg,pw,{skill:1}); applyCC(tg,cc); break; }
      case 'storm': { const [px,pz]=s.self?[sx,sz]:gp; zones.push({h,x:px,z:pz,a:s.a,dps:pw*.5,t:s.dur||4,tick:0,cc:{sl:s.sl?1:0},col,follow:s.self}); break; }
    }
    h.mp=Math.max(0,h.mp-skCost(h,i)); if(h.bi>=0) h.revT=Tm+1.5; h.cd[i]=s.cd*(1-(i===3?.15:.05)*(Math.max(1,h.sk[i])-1))*(1-Math.min(.4,S.cdr)); h.castT=.45; h.atkT=0; if(h.me||(myHero()&&dist(h,myHero())<20)) emit(['sfx',i===3?'boost':'pop']); return true; }
  const SPELLS=M0.SPELLS,smiteDmg=h=>(600+h.lvl*60)*(stats(h).jg?1.3:1);
  function smite(h){ let tg=null,bd=6.5; for(const u of mons) if(alive(u)&&dist(h,u)<bd){ bd=dist(h,u); tg=u; } if(!tg) for(const u of minions) if(u.team!==h.team&&alive(u)&&dist(h,u)<bd){ bd=dist(h,u); tg=u; } if(!tg) return false;
    dmg(h,tg,smiteDmg(h),{tru:1}); emit(['beam',+tg.x.toFixed(1),+tg.z.toFixed(1),1.2,'#ffb040',.5]); emit(['sfx','boom']); return true; }
  function castSpell(h,j,aim){ const id=h.sp[j],S0=SPELLS[id]; if(!S0||h.dead||h.spCd[j]>0) return false; if(h.stun>0&&id!=='cleanse') return false;
    switch(id){
      case 'flash': { const ang=aim?Math.atan2(aim.z-h.z,aim.x-h.x):h.face,d=aim?Math.min(4.5,Math.max(2,Math.hypot(aim.x-h.x,aim.z-h.z))):4.5; let [nx,nz]=map.inB(h.x+Math.cos(ang)*d,h.z+Math.sin(ang)*d);
        for(const o of map.obst){ const dx=nx-o.x,dz=nz-o.z,dd=Math.hypot(dx,dz)||1; if(dd<o.r+.5){ nx=o.x+dx/dd*(o.r+.6); nz=o.z+dz/dd*(o.r+.6); } }
        emit(['burst',+h.x.toFixed(1),1,+h.z.toFixed(1),'#ffe066',12,5]); h.x=nx; h.z=nz; h.face=ang; h.dash=null; h.recall=0; h.force++; emit(['burst',+nx.toFixed(1),1,+nz.toFixed(1),'#ffe066',12,5]); break; }
      case 'heal': { const v=90+h.lvl*28; heroes.filter(a=>a.team===h.team&&alive(a)&&dist(a,h)<8).forEach(a=>{ heal(a,v); a.buffs.push({spd:.3,t:1.5}); }); emit(['ring',+h.x.toFixed(1),+h.z.toFixed(1),8,'#7aff9a',.7,1]); break; }
      case 'smite': if(!smite(h)) return false; break;
      case 'ghost': h.buffs.push({spd:.45,t:6}); emit(['beam',+h.x.toFixed(1),+h.z.toFixed(1),.9,'#9ad8ff',.6]); break;
      case 'exhaust': { let tg=null,bd=1e9; for(const e of heroes){ if(e.team===h.team||!alive(e)||dist(e,h)>7||!seen(e,h.team)) continue; const d2=aim?Math.hypot(e.x-aim.x,e.z-aim.z):dist(e,h); if(d2<bd){ bd=d2; tg=e; } } if(!tg) return false; tg.weak=3; tg.slow=Math.max(tg.slow||0,3); emit(['line',+h.x.toFixed(1),+h.z.toFixed(1),+Math.atan2(tg.z-h.z,tg.x-h.x).toFixed(3),0,dist(h,tg),.4,'#c08aff']); emit(['ring',+tg.x.toFixed(1),+tg.z.toFixed(1),1.4,'#c08aff',1]); emit(['feed',h.def.n+' 對 '+tg.def.n+' 使用了虛弱',h.team]); break; }
      case 'ignite': { let tg=null,bd=1e9; for(const e of heroes){ if(e.team===h.team||!alive(e)||dist(e,h)>6.5||!seen(e,h.team)) continue; const d2=aim?Math.hypot(e.x-aim.x,e.z-aim.z):e.hp/e.max*10+dist(e,h); if(d2<bd){ bd=d2; tg=e; } } if(!tg) return false; tg.burn={t:5,dps:(70+h.lvl*22)/5,src:h,tick:0}; emit(['line',+h.x.toFixed(1),+h.z.toFixed(1),+Math.atan2(tg.z-h.z,tg.x-h.x).toFixed(3),0,dist(h,tg),.4,'#ff6a2a']); emit(['boom',+tg.x.toFixed(1),+tg.z.toFixed(1),1.2,'#ff6a2a']); emit(['feed',h.def.n+' 點燃了 '+tg.def.n,h.team]); break; }
      case 'cleanse': h.stun=0; h.slow=0; h.weak=0; emit(['beam',+h.x.toFixed(1),+h.z.toFixed(1),.9,'#ff9ec8',.6]); break; }
    h.spCd[j]=S0.cd; if(h.me) emit(['sfx','boost']); return true; }
  // 合成：身上有的材料會折抵價錢（參考英雄聯盟）
  const canShop=h=>!!h&&(h.dead||Math.hypot(h.x-map.fount[h.team][0],h.z-map.fount[h.team][1])<12);
  function priceFor(h,id){ const it=ITEMS[id],inv=h.items.slice(),used=[]; let cost=it.c; for(const f of it.from||[]){ const k=inv.indexOf(f); if(k>=0){ inv.splice(k,1); used.push(f); cost-=ITEMS[f].c; } }
    const slots=it.cons&&h.items.includes(id)?h.items.length:h.items.length-used.length+1; return {cost,used,slotsOk:slots<=6}; }
  function planBuy(h){ const pool=h.items.filter(x=>x!=='pot'); let target=null; for(const b of h.build){ const k=pool.indexOf(b); if(k>=0) pool.splice(k,1); else { target=b; break; } } if(!target) return null;
    const P0=priceFor(h,target); if(h.gold>=P0.cost&&P0.slotsOk) return target; const have=pool.slice(); for(const f of ITEMS[target].from||[]){ const k=have.indexOf(f); if(k>=0) have.splice(k,1); else return f; } return target; }
  function buyItem(h,id,manual){ const it=ITEMS[id]; if(!it) return false; const say=(m,c2)=>{ if(h.me&&manual) floatMsg(m,c2||'#ffb0b0'); }; if(!canShop(h)){ say('要回城（回到泉水）才能買裝備'); return false; }
    if(id==='pot'&&(h.pots||0)>=5){ say('藥水最多帶 5 瓶'); return false; }
    const P0=priceFor(h,id); if(!P0.slotsOk){ say('裝備格滿了，先賣掉一件'); return false; } if(h.gold<P0.cost){ say('金幣不夠'); return false; }
    h.gold-=P0.cost; if(id==='pot'){ if(!h.items.includes('pot')) h.items.push('pot'); h.pots=(h.pots||0)+1; } else { P0.used.forEach(f=>h.items.splice(h.items.indexOf(f),1)); h.items.push(id); }
    const r0=h.hp/h.max; h.max=stats(h).hp; h.hp=Math.max(1,h.max*r0); if(h.me){ emit(['sfx','item']); floatMsg('買了 '+it.n,'#ffd23f'); } return true; }
  function buyNext(h,manual){ const id=planBuy(h); if(!id) return false; return buyItem(h,id,manual); }
  function sellItem(h,i){ const id=h.items[i]; if(!id||!canShop(h)) return false; const it=ITEMS[id]; let back=Math.floor(it.c*.7); if(id==='pot'){ back=20*(h.pots||0); h.pots=0; } h.items.splice(i,1); h.gold+=back;
    const r0=h.hp/h.max; h.max=stats(h).hp; h.hp=Math.max(1,Math.min(h.max,h.max*r0)); if(h.me){ emit(['sfx','item']); floatMsg('賣掉 '+it.n+'　+'+back,'#ffd23f'); } return true; }
  function killWard(w,src){ const k=wards.indexOf(w); if(k>=0) wards.splice(k,1); emit(['burst',+w.x.toFixed(1),1,+w.z.toFixed(1),'#5fff7a',10,4]); if(src&&src.k==='h'){ src.gold+=30; if(src.me) floatMsg('清掉一個眼　+30','#ffd23f'); } emit(['sfx','pop']); }
  function useTrinket(h,aim){ const TK=TRINK[h.tk]; if(h.tcd>0){ if(h.me) floatMsg(TK.n+' 還要 '+Math.ceil(h.tcd)+' 秒','#ffb0b0'); return false; }
    if(h.tk==='r'){ h.lens=8; h.tcd=TK.cd; emit(['ring',+h.x.toFixed(1),+h.z.toFixed(1),9,'#ff5a5a',.8]); if(h.me) floatMsg('紅眼掃描中：敵人的眼會現形，點三下清掉','#ff9a9a',2.2); return true; }
    let tx,tz; if(aim){ const dx=aim.x-h.x,dz=aim.z-h.z,d=Math.hypot(dx,dz)||1,k=Math.min(1,6.5/d); tx=h.x+dx*k; tz=h.z+dz*k; } else { tx=h.x+Math.cos(h.face)*3; tz=h.z+Math.sin(h.face)*3; } [tx,tz]=map.inB(tx,tz);
    const mine=wards.filter(w=>w.owner===h.id); if(mine.length>=3){ const o=mine.reduce((a,b)=>a.t<b.t?a:b); wards.splice(wards.indexOf(o),1); }
    wards.push({id:wardId++,k:'w',team:h.team,owner:h.id,x:+tx.toFixed(1),z:+tz.toFixed(1),t:90,hp:3,max:3,r:.4}); h.tcd=TK.cd; emit(['ring',+tx.toFixed(1),+tz.toFixed(1),2,'#5fff7a',.6]); if(h.me) emit(['sfx','pop']); updVis(); return true; }
  function useItem(h,i,aim){ if(!alive(h)||h.stasis>0) return false; if(i===6) return useTrinket(h,aim); const id=h.items[i]; if(!id) return false; const it=ITEMS[id];
    if(id==='pot'){ if(!(h.pots>0)) return false; if(h.hp>=h.max){ if(h.me) floatMsg('血是滿的','#ffb0b0'); return false; } h.pots--; h.potT=12; if(h.pots<=0) h.items.splice(i,1); emit(['beam',+h.x.toFixed(1),+h.z.toFixed(1),.7,'#ff6a7a',.5]); if(h.me) emit(['sfx','heal']); return true; }
    if(!it.act){ if(h.me) floatMsg(it.n+' 沒有主動技能','#ffb0b0'); return false; } if((h.icd[id]||0)>0){ if(h.me) floatMsg(it.n+' 還在冷卻','#ffb0b0'); return false; } if(h.stun>0&&it.act.k!=='qss') return false;
    const S=stats(h),col=it.col;
    switch(it.act.k){
      case 'cleave': areaHit(h,h.x,h.z,3.4,S.atk*1.2+60,null,col); emit(['ring',+h.x.toFixed(1),+h.z.toFixed(1),3.4,col,.4]); emit(['slash',+h.x.toFixed(1),+h.z.toFixed(1),3,+h.face.toFixed(2),col]); break;
      case 'stasis': h.stasis=2.5; h.dash=null; h.recall=0; emit(['beam',+h.x.toFixed(1),+h.z.toFixed(1),1,'#ffd23f',2.5]); break;
      case 'locket': heroes.filter(a=>a.team===h.team&&alive(a)&&dist(a,h)<8).forEach(a=>{ a.shield=Math.max(a.shield,160+h.lvl*18); a.shT=3; }); emit(['ring',+h.x.toFixed(1),+h.z.toFixed(1),8,'#ffe0a0',.6,1]); break;
      case 'qss': h.stun=0; h.slow=0; h.weak=0; h.burn=null; h.buffs.push({spd:.5,t:1}); emit(['beam',+h.x.toFixed(1),+h.z.toFixed(1),.9,'#c8f0ff',.6]); break;
      case 'haste': h.buffs.push({spd:.4,as:.2,t:5}); emit(['beam',+h.x.toFixed(1),+h.z.toFixed(1),.9,'#b0a0ff',.6]); break;
      case 'slowaura': for(const e of [...enemiesOf(h.team)]) if(e.k!=='j'&&dist(e,h)<5) applyCC(e,{sl:2}); emit(['ring',+h.x.toFixed(1),+h.z.toFixed(1),5,'#c8b890',.6,1]); break;
      case 'gun': { let tg=null,bd=1e9; for(const e of heroes){ if(e.team===h.team||!alive(e)||dist(e,h)>7||!seen(e,h.team)) continue; const d2=aim?Math.hypot(e.x-aim.x,e.z-aim.z):dist(e,h); if(d2<bd){ bd=d2; tg=e; } } if(!tg){ if(h.me) floatMsg('附近沒有敵方英雄','#ffb0b0'); return false; }
        dmg(h,tg,100+h.lvl*14,{skill:1}); applyCC(tg,{sl:1.5}); emit(['line',+h.x.toFixed(1),+h.z.toFixed(1),+Math.atan2(tg.z-h.z,tg.x-h.x).toFixed(3),0,dist(h,tg),.5,col]); emit(['hit',+tg.x.toFixed(1),+tg.z.toFixed(1),col]); break; } }
    h.icd[id]=it.act.cd; if(h.me) emit(['sfx','boost']); return true; }
  function botItems(h){ if(Math.random()>.3) return; const E=heroes.filter(e=>e.team!==h.team&&alive(e)&&dist(e,h)<8&&seen(e,h.team)),hp=h.hp/h.max,fight=h.ai.mode==='fight';
    const pi=h.items.indexOf('pot'); if(pi>=0&&hp<.55&&!(h.potT>0)) useItem(h,pi);
    h.items.forEach((id,i)=>{ const it=ITEMS[id]; if(!it||!it.act||(h.icd[id]||0)>0) return; const k=it.act.k;
      if(k==='cleave'&&(E.some(e=>dist(e,h)<3.4)||minions.filter(m=>m.team!==h.team&&alive(m)&&dist(m,h)<3.4).length>=3)) useItem(h,i);
      else if(k==='stasis'&&hp<.2&&E.length) useItem(h,i);
      else if(k==='locket'&&E.length&&heroes.some(a=>a.team===h.team&&alive(a)&&dist(a,h)<8&&a.hp/a.max<.5)) useItem(h,i);
      else if(k==='haste'&&E.length&&(hp<.3||fight)) useItem(h,i);
      else if(k==='slowaura'&&fight&&E.some(e=>dist(e,h)<5)) useItem(h,i);
      else if(k==='gun'&&fight&&E.length) useItem(h,i,{x:E[0].x,z:E[0].z}); });
    if(h.tcd<=0&&!h.recall){ if(h.tk==='g'){ const b=BUSH.find(b=>Math.hypot(b.x-h.x,b.z-h.z)<7&&!wards.some(w=>w.team===h.team&&Math.hypot(w.x-b.x,w.z-b.z)<6)); if(b&&Math.random()<.5) useTrinket(h,{x:b.x,z:b.z}); }
      else if(wards.some(w=>w.team!==h.team&&Math.hypot(w.x-h.x,w.z-h.z)<10)&&Math.random()<.35) useTrinket(h); } }
  /* ---------- 英雄每一刻 ---------- */
  function heroTick(h,dt){ h.cd=h.cd.map(v=>Math.max(0,v-dt)); h.spCd=h.spCd.map(v=>Math.max(0,v-dt)); h.atkCd-=dt; if(h.atkT>0) h.atkT-=dt; if(h.castT>0) h.castT-=dt; if(h.shT>0){ h.shT-=dt; if(h.shT<=0) h.shield=0; }
    h.buffs=h.buffs.filter(b=>(b.t-=dt)>0); if(h.slow>0) h.slow-=dt; if(h.weak>0) h.weak-=dt;
    for(const k in h.icd) if(h.icd[k]>0) h.icd[k]=Math.max(0,h.icd[k]-dt); if(h.tcd>0) h.tcd=Math.max(0,h.tcd-dt); if(h.lens>0) h.lens=Math.max(0,h.lens-dt);
    if(h.potT>0){ h.potT-=dt; if(!h.dead) h.hp=Math.min(h.max,h.hp+10*dt*(h.burn?.5:1)); }
    if(h.bot&&!h.potB&&!h.dead){ h.potB=1; buyItem(h,'pot'); }
    if(h.burn){ const b=h.burn; b.t-=dt; b.tick-=dt; if(b.tick<=0){ b.tick=.5; if(!h.dead) dmg(b.src,h,b.dps*.5,{tru:1,burn:1}); if(!h.dead) emit(['burst',+h.x.toFixed(1),1.6,+h.z.toFixed(1),'#ff7a2a',5,2]); } if(b.t<=0||h.dead) h.burn=null; }
    if(h.dead){ if(h.auto||h.bot) buyNext(h); h.rsp-=dt; if(h.rsp<=0){ h.dead=false; h.max=stats(h).hp; h.hp=h.max; h.mpMax=stats(h).mp; h.mp=h.mpMax; const f=map.fount[h.team]; h.x=f[0]; h.z=f[1]; h.force++; h.stun=0; h.slow=0; } return; }
    if(h.stasis>0){ h.stasis-=dt; return; }
    const F=map.fount[h.team],EF=map.fount[1-h.team];
    if(mode===0&&Math.hypot(h.x-F[0],h.z-F[1])<8){ h.hp=Math.min(h.max,h.hp+h.max*.15*dt); h.mp=Math.min(h.mpMax,h.mp+h.mpMax*.2*dt); }
    h.mp=Math.min(h.mpMax,h.mp+(3+h.lvl*.45+h.mpMax*.004)*dt);
    if(Math.hypot(h.x-EF[0],h.z-EF[1])<9) dmg(null,h,900*dt,{tru:1});
    h.hp=Math.min(h.max,h.hp+h.max*(.004+(teamBuff[h.team].reg>0?.02:0))*dt); h.gold+=3.2*dt;
    if(h.dash){ const d=h.dash,dx=d.x-h.x,dz=d.z-h.z,l=Math.hypot(dx,dz),st=28*dt; if(l<=st){ h.x=d.x; h.z=d.z; h.dash=null; h.force++; d.cb&&d.cb(); } else { h.x+=dx/l*st; h.z+=dz/l*st; h.face=Math.atan2(dz,dx); } return; }
    if(h.stun>0){ h.stun-=dt; const I=h===myHero()&&host?myIn:h.netIn; if(I&&I.acts) I.acts=I.acts.filter(a=>{ const k=a.a||a; if((k==='d'||k==='f')&&h.sp[k==='d'?0:1]==='cleanse'){ castSpell(h,k==='d'?0:1); return false; } if(k==='it'&&h.items[a.i]==='qss'||k==='act'&&h.items.includes('qss')){ useItem(h,h.items.indexOf('qss')); return false; } return true; }); if(h.bot&&h.stun>.4){ const qi=h.items.indexOf('qss'); if(qi>=0&&!(h.icd.qss>0)) useItem(h,qi); } if(h.bot&&h.stun>.4&&h.sp.includes('cleanse')) castSpell(h,h.sp.indexOf('cleanse')); return; }
    if(h.recall>0){ h.recall-=dt; if(h.recall<=0){ h.x=F[0]; h.z=F[1]; h.force++; emit(['beam',h.x,h.z,1.2,'#9ad8ff',.8]); } }
    if(h.bot) botAct(h,dt);
    else if(h===myHero()&&host) applyInput(h,dt,myIn);
    else if(h.human&&host&&h.netIn) applyInput(h,dt,h.netIn,true);
    if(h.auto||h.bot) buyNext(h); }
  function applyInput(h,dt,I,remote){
    if(remote){ if(I.x!=null&&!h.dash){ if(h.force===I.f){ if(Math.hypot(I.x-h.x,I.z-h.z)>.05) h.recall=0; h.x=I.x; h.z=I.z; if(I.face!=null) h.face=I.face; } } }
    else localMove(h,dt,I);
    for(const a of I.acts||[]){ const k=a.a||a,aim=a&&a.x!=null?{x:a.x,z:a.z}:null;
      if(/^s[0-3]$/.test(k)){ const i=+k[1]; if(!cast(h,i,aim)&&h.me) floatMsg(h.cd[i]>0?'還在冷卻':h.mp<skCost(h,i)?'魔力不夠（回城回魔最快）':!unlocked(h,i)?(i===3&&h.lvl<6?'6 等才能學大招':'還沒學這招，點技能上的 ＋'):'附近沒有目標','#ffb0b0'); }
      else if(k==='d'||k==='f'){ const j=k==='d'?0:1; if(!castSpell(h,j,aim)&&h.me) floatMsg(h.spCd[j]>0?'還在冷卻':h.sp[j]==='smite'?'附近沒有野怪或小兵':h.sp[j]==='exhaust'||h.sp[j]==='ignite'?'附近沒有敵方英雄':'現在不能用','#ffb0b0'); }
      else if(k==='lv') lvSkill(h,a.i|0);
      else if(k==='rc'&&mode===1){ if(h.me) floatMsg('單路激戰不能回城，陣亡後才會補滿生命和魔力','#ffb0b0',2); }
      else if(k==='rc'){ if(!h.recall){ h.recall=3.5; emit(['ring',+h.x.toFixed(1),+h.z.toFixed(1),1.5,'#9ad8ff',.6]); } } else if(k==='buy') buyNext(h,true); else if(k==='auto') h.auto=!h.auto;
      else if(k==='it') useItem(h,a.i|0,aim); else if(k==='tku') useItem(h,6,aim);
      else if(k==='pot'){ const i=h.items.indexOf('pot'); if(i>=0) useItem(h,i); else if(h.me) floatMsg('沒有藥水，去商店買','#ffb0b0'); }
      else if(k==='act'){ const i=h.items.findIndex(id=>ITEMS[id]&&ITEMS[id].act); if(i>=0) useItem(h,i,aim); }
      else if(k==='bi') buyItem(h,a.id,true); else if(k==='si') sellItem(h,a.i|0);
      else if(k==='tc'){ if((a.v==='g'||a.v==='r')&&h.tk!==a.v){ h.tk=a.v; h.tcd=Math.max(h.tcd,3); } }
      else if(k==='hw'){ const w=wards.find(q=>q.id===a.id); if(w&&w.team!==h.team&&VIS[h.team].has(w.id)&&Math.hypot(w.x-h.x,w.z-h.z)<stats(h).rng+2&&!(h.hwT>Tm)){ h.hwT=Tm+.15; h.face=Math.atan2(w.z-h.z,w.x-h.x); h.atkT=.25; dmg(h,w,1,{}); } } }
    I.acts=[];
    const aid=remote?I.atkId:(I.ord&&I.ord.k==='atk'?I.ord.id:null);
    if(aid!=null){ const u=byId(aid); if(alive(u)&&u.team!==h.team&&!u.inv&&seen(u,h.team)){ basicAttack(h,u); return; } }
    if(I.atk){ const tg=pickKind(h,I.kind,null); if(tg) basicAttack(h,tg); else if(!remote&&!(I.mx||I.mz)){ const e=pickKind(h,I.kind,7.5); if(e) moveUnit(h,e.x-h.x,e.z-h.z,stats(h).spd,dt); } } }
  function pickKind(h,kind,range){ if(!kind) return pickTarget(h,range); const S=stats(h),R0=range!=null?range:S.rng+.6; let best=null,bd=1e9; const L=kind==='tw'?towers.concat(cores):[...minions,...mons];
    for(const u of L){ if(!alive(u)||u.team===h.team||u.inv||!seen(u,h.team)) continue; const d=dist(h,u)-(u.r||.6); if(d>R0) continue; const sc=kind==='min'?u.hp:d; if(sc<bd){ bd=sc; best=u; } } return best; }
  function localMove(h,dt,I){ const sp=stats(h).spd; if(I.mx||I.mz){ moveUnit(h,I.mx,I.mz,sp,dt); h.recall=0; I.ord=null; return; } const o=I.ord; if(!o) return;
    if(o.k==='move'){ h.recall=0; if(followTo(h,o,o.x,o.z,sp,dt,.35)) I.ord=null; }
    else if(o.k==='atk'){ const u=byId(o.id); if(!alive(u)||u.inv||!seen(u,h.team)){ I.ord=null; return; } const reach=stats(h).rng+.5+(u.r||.6); if(dist(h,u)>reach){ h.recall=0; followTo(h,o,u.x,u.z,sp,dt,reach-.2); } else h.face=Math.atan2(u.z-h.z,u.x-h.x); } }
  function followTo(h,o,x,z,sp,dt,stop){ const d=Math.hypot(x-h.x,z-h.z); if(d<=stop) return true;
    if(mode===0&&d>14){ if(!o.path||Math.hypot(o.px-x,o.pz-z)>4){ o.path=map.path(h.x,h.z,x,z); o.px=x; o.pz=z; } while(o.path.length>1&&Math.hypot(o.path[0][0]-h.x,o.path[0][1]-h.z)<1.6) o.path.shift(); const p=o.path[0]; moveUnit(h,p[0]-h.x,p[1]-h.z,sp,dt); }
    else moveUnit(h,x-h.x,z-h.z,Math.min(sp,d/dt),dt); return false; }
  function botSpells(h){ const E=heroes.filter(e=>e.team!==h.team&&alive(e)&&dist(e,h)<9&&seen(e,h.team)).length,hp=h.hp/h.max; for(let j=0;j<2;j++){ if(h.spCd[j]>0||Math.random()>LV.sk*.2) continue; const id=h.sp[j];
      if(id==='heal'&&(hp<.3&&E||heroes.some(a=>a.team===h.team&&alive(a)&&a.hp/a.max<.25&&dist(a,h)<8))) castSpell(h,j);
      else if(id==='flash'&&hp<.2&&E){ const F=map.fount[h.team]; castSpell(h,j,{x:F[0],z:F[1]}); }
      else if(id==='ghost'&&(hp<.35&&E||h.ai.tgt&&h.ai.tgt.k==='h'&&h.ai.tgt.hp/h.ai.tgt.max<.3)) castSpell(h,j);
      else if(id==='exhaust'&&E&&(hp<.5||h.ai.tgt&&h.ai.tgt.k==='h'&&dist(h,h.ai.tgt)<6)) castSpell(h,j,h.ai.tgt&&h.ai.tgt.k==='h'?{x:h.ai.tgt.x,z:h.ai.tgt.z}:null);
      else if(id==='ignite'){ const lo=heroes.find(e=>e.team!==h.team&&alive(e)&&dist(e,h)<6.5&&e.hp/e.max<.3); if(lo) castSpell(h,j,{x:lo.x,z:lo.z}); }
      else if(id==='cleanse'&&(h.slow>0||h.weak>0)&&E) castSpell(h,j); } }
  /* ---------- 電腦英雄 ---------- */
  const laneOf=h=>mode?0:{top:0,mid:1,bot:2,sup:2}[h.role]??1;
  const progress=(h,u)=>{ const L=map.lanes[laneOf(h)],s=project(L,u.x,u.z)[0]; return h.team?L.len-s:s; };
  function botThink(h){ const ai=h.ai,S=stats(h),hp=h.hp/h.max,F=map.fount[h.team],dF=Math.hypot(h.x-F[0],h.z-F[1]);
    const E=heroes.filter(e=>e.team!==h.team&&alive(e)&&dist(e,h)<13&&seen(e,h.team)),Al=heroes.filter(a=>a.team===h.team&&alive(a)&&dist(a,h)<14);
    ai.tgt=null; ai.goal=null;
    if(mode===1&&ai.mode==='back') ai.mode=null;
    if(ai.mode==='back'){ if(hp>.92&&h.mp>h.mpMax*.85||h.dead){ ai.mode=null; } else { if(!E.length&&dF>25&&!h.recall) h.recall=3.5; if(!h.recall) ai.goal=F; return; } }
    { const nx=planBuy(h); if(mode===0&&!E.length&&dF>25&&!h.recall&&(h.mp<h.mpMax*.12||nx&&h.gold>=Math.max(1100,priceFor(h,nx).cost))){ ai.mode='back'; h.recall=3.5; return; } }
    if(mode===1&&hp<LV.ret&&E.length&&!E.every(e=>e.hp/e.max<.15)){ const tw=towers.concat(cores).filter(q=>q.team===h.team&&q.hp>0).sort((a,b)=>dist(a,h)-dist(b,h))[0]; if(tw){ ai.goal=[tw.x+(h.team?3:-3),tw.z]; return; } }
    if(mode===0&&hp<LV.ret&&!(E.length&&E.every(e=>e.hp/e.max<.15))){ ai.mode='back'; if(!E.length&&dF>25) h.recall=3.5; else ai.goal=F; return; }
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
  const pwEst=h=>stats(h).atk*3+skPow(h,h.def.sk[0],0);
  function towardHome(h,d){ const F=map.fount[h.team],dx=F[0]-h.x,dz=F[1]-h.z,l=Math.hypot(dx,dz)||1; return [h.x+dx/l*d,h.z+dz/l*d]; }
  function botAct(h,dt){ const ai=h.ai; ai.t-=dt; if(ai.t<=0){ ai.t=LV.re*(.8+Math.random()*.4); botThink(h); ai.skT=(ai.skT||0)-1; }
    if(h.recall>0) return; const S=stats(h); botSpells(h); botItems(h);
    if(h.lens>0&&ai.mode!=='fight'){ const w=wards.find(q=>q.team!==h.team&&VIS[h.team].has(q.id)&&Math.hypot(q.x-h.x,q.z-h.z)<9); if(w){ if(dist(h,w)>S.rng+.8) chase(h,w.x,w.z,S.spd,dt); else basicAttack(h,w); return; } }
    const tg=ai.tgt; if(tg&&alive(tg)&&!seen(tg,h.team)&&tg.k==='h') ai.tgt=null; if(tg&&alive(tg)&&seen(tg,h.team)){ const reach=S.rng+.6+(tg.r||.6),d=dist(h,tg);
      if(tg.k==='h'||tg.k==='j'||Math.random()<.04){ // 技能
        for(let i=3;i>=0;i--){ if(h.cd[i]>0||!unlocked(h,i)||h.mp<skCost(h,i)) continue; const s=h.def.sk[i]; if(Math.random()>LV.sk*dt*6) continue;
          if(s.t==='heal'||s.t==='shield'){ if(h.hp/h.max<.6||heroes.some(a=>a.team===h.team&&alive(a)&&a.hp/a.max<.5&&dist(a,h)<8)) cast(h,i); continue; }
          if(s.t==='buff'){ if(d<reach+2) cast(h,i); continue; } if(s.back){ if(h.hp/h.max<.45) cast(h,i); continue; }
          if(tg.k!=='h'&&i===3) continue; if(d<=(s.r||s.a||6)+.5) cast(h,i); } }
      if(h.sp.includes('smite')&&tg.k==='j'&&tg.hp<smiteDmg(h)&&dist(h,tg)<6) castSpell(h,h.sp.indexOf('smite'));
      if(d>reach){ chase(h,tg.x,tg.z,S.spd,dt); } else basicAttack(h,tg); return; }
    if(ai.goal){ chase(h,ai.goal[0],ai.goal[1],S.spd,dt); } }
  function chase(h,x,z,spd,dt){ const ai=h.ai,d=Math.hypot(x-h.x,z-h.z); if(d<.6) return;
    if(d<14||mode===1){ moveUnit(h,x-h.x,z-h.z,spd,dt); return; }
    if(!ai.path||!ai.pg||Math.hypot(ai.pg[0]-x,ai.pg[1]-z)>6){ ai.path=map.path(h.x,h.z,x,z); ai.pg=[x,z]; }
    const p=ai.path[0]; if(!p){ moveUnit(h,x-h.x,z-h.z,spd,dt); return; } if(Math.hypot(p[0]-h.x,p[1]-h.z)<1.6&&ai.path.length>1) ai.path.shift(); moveUnit(h,p[0]-h.x,p[1]-h.z,spd,dt); }
  /* ---------- 模擬一步 ---------- */
  function sim(dt){ Tm+=dt; visT-=dt; if(visT<=0){ visT=.1; updVis(); }
    for(let i=wards.length-1;i>=0;i--){ if((wards[i].t-=dt)<=0) wards.splice(i,1); }
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
  /* ---------- 本機輸入（電腦：滑鼠點擊；手機：搖桿＋傳說對決式按鈕） ---------- */
  const TOUCH=!!env.touch,J={on:false,id:null,cx:0,cy:0,x:0,y:0}; let acts=[],hold=false,holdKind=null,stopOrd=false,aimSk=null,hover=null;
  const myIn={mx:0,mz:0,atk:false,kind:null,acts:[],ord:null},mouse={x:W/2,y:H/2,in:false,btn:false,lastT:0},SKK=['s0','s1','s2','s3'];
  function BTN(){ if(!TOUCH) return []; const cx=W-90,cy=H-88,P=a=>[cx+Math.cos(a*PI/180)*112,cy-Math.sin(a*PI/180)*112];
    const sk=[[200,30],[158,30],[118,30],[78,33]].map(([a,r],i)=>{ const [x,y]=P(a); return {k:SKK[i],x,y,r}; });
    const mh0=myHero(),lv=mh0?sk.filter((b,i)=>canLv(mh0,i)).map(b=>({k:'lv'+b.k[1],x:b.x-b.r*.72,y:b.y-b.r*.78,r:12})):[];
    return [...lv,{k:'atk',x:cx,y:cy,r:44},...sk,{k:'min',x:W-22,y:H-152,r:18},{k:'tw',x:W-22,y:H-108,r:18},{k:'f',x:W-262,y:H-34,r:24},{k:'d',x:W-318,y:H-34,r:24},...(mode===0?[{k:'rc',x:W-376,y:H-30,r:21}]:[]),{k:'pot',x:W-430,y:H-30,r:21},{k:'tku',x:W-482,y:H-30,r:21},...(myHero()&&myHero().items.some(id=>ITEMS[id]&&ITEMS[id].act)?[{k:'act',x:W-534,y:H-30,r:21}]:[])]; }
  const worldAt=(x,y)=>{ const p=G3.pick(x,y); return p?{x:p[0],z:p[1]}:null; };
  function unitAt(x,y){ let best=null,bd=1e9; const test=(u,hh,rpx)=>{ if(!alive(u)||u.vh) return; const p=G3.toScreen(u.x,hh,u.z); if(!p[2]) return; const d=Math.hypot(p[0]-x,p[1]-y); if(d<rpx&&d<bd){ bd=d; best=u; } };
    for(const u of heroes) test(u,1.4,34); for(const u of minions) test(u,.8,22); for(const u of mons) test(u,u.big?1.8:1,u.big?44:28); for(const u of towers) test(u,3,46); for(const u of cores) test(u,3,60); for(const w of wards) if(w.team!==myTeam&&VIS[myTeam].has(w.id)) test(w,.9,28); return best; }
  function command(x,y,drag){ const mh=myHero(); if(!mh||mh.dead) return; const u=unitAt(x,y);
    if(drag&&myIn.ord&&myIn.ord.k==='atk') return;
    if(u&&u.team!==myTeam&&!u.inv&&!drag){ myIn.ord={k:'atk',id:u.id}; if(u.k==='w') acts.push({a:'hw',id:u.id}); G3.fx(['ring',u.x,u.z,1.4,'#ff4a4a',.4]); return; }
    const w=worldAt(x,y); if(!w) return; myIn.ord={k:'move',x:w.x,z:w.z}; if(!drag) G3.fx(['ring',w.x,w.z,.8,'#5fff7a',.35]); }
  function localIn(){ const K=env.keys; let ix=0,iy=0; if(K.ArrowLeft) ix-=1; if(K.ArrowRight) ix+=1; if(K.ArrowUp) iy+=1; if(K.ArrowDown) iy-=1; if(J.on){ ix=J.x; iy=-J.y; }
    const mx=flip?-ix:ix,mz=flip?iy:-iy;
    if(!TOUCH){ const w=mouse.in?worldAt(mouse.x,mouse.y):null,aim=w?{x:+w.x.toFixed(2),z:+w.z.toFixed(2)}:{};
      const ctl=env.keys.ControlLeft||env.keys.ControlRight; [['KeyQ','s0'],['KeyW','s1'],['KeyE','s2'],['KeyR','s3'],['KeyD','d'],['KeyF','f']].forEach(([c2,a],j)=>{ if(env.hit(c2)){ if(ctl&&j<4) acts.push({a:'lv',i:j}); else acts.push(Object.assign({a},aim)); } }); for(let i=0;i<7;i++) if(env.hit('Digit'+(i+1))||env.hit('Numpad'+(i+1))) acts.push(Object.assign({a:'it',i},aim)); if(env.hit('KeyS')) stopOrd=true;
      if(mouse.btn&&t-mouse.lastT>.12&&!(shopOpen&&inShop(mouse.x,mouse.y))){ mouse.lastT=t; command(mouse.x,mouse.y,true); } }
    if(env.hit('KeyB')) acts.push({a:'rc'}); if(env.hit('KeyP')) toggleShop();
    const out={mx,mz,atk:hold||!!env.keys.Space,kind:holdKind,acts}; acts=[]; return out; }
  function aimRange(k){ const mh=myHero(); if(k==='tku') return 6.5; if(k==='d'||k==='f') return 4.5; const s=mh.def.sk[+k[1]]; return s.r||s.a||6; }
  function aimAct(A){ const mh=myHero(),l=Math.hypot(A.dx,A.dy); if(!mh||l<14) return {a:A.k}; const ux=A.dx/l,uy=A.dy/l,wx=flip?-ux:ux,wz=flip?-uy:uy,R0=aimRange(A.k),k2=Math.max(.3,Math.min(1,l/90));
    return {a:A.k,x:+(mh.x+wx*R0*k2).toFixed(2),z:+(mh.z+wz*R0*k2).toFixed(2)}; }
  /* ---------- 觸控／滑鼠 ---------- */
  function toL(e){ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=(r.width-W*s)/2,oy=(r.height-H*s)/2; return [(e.clientX-r.left-ox)/s,(e.clientY-r.top-oy)/s]; }
  const ptr=new Map();
  const HL=()=>TOUCH?{buy:[12,H/2-30,150,42],auto:[166,H/2-30,48,42],shop:[12,H/2+16,202,34]}:{buy:[W/2-250,H-140,178,30],auto:[W/2-66,H-140,60,30],shop:[W/2,H-140,100,30]};
  function deskPanel(){ const x0=W/2-250,y0=H-92,boxes=[]; SKK.forEach((k,i)=>boxes.push({k,x:x0+96+i*54,y:y0+6,w:48,h:48,key:'QWER'[i]})); ['d','f'].forEach((k,i)=>boxes.push({k,x:x0+316+i*42,y:y0+12,w:36,h:36,key:'DF'[i]})); if(mode===0) boxes.push({k:'rc',x:x0+402,y:y0+62,w:90,h:20,key:'B'}); { const mh0=myHero(); if(mh0) SKK.forEach((k,i)=>{ if(canLv(mh0,i)) boxes.push({k:'lv'+i,x:x0+96+i*54+12,y:y0-15,w:24,h:19}); }); } for(let i=0;i<6;i++) boxes.push({k:'it'+i,x:x0+402+(i%3)*30,y:y0+4+Math.floor(i/3)*29,w:27,h:26}); boxes.push({k:'it6',x:x0+496,y:y0+4,w:28,h:26}); return {x0,y0,boxes}; }
  function hudClick(x,y){ const L=HL(),inR=r=>x>=r[0]&&x<=r[0]+r[2]&&y>=r[1]&&y<=r[1]+r[3]; if(inR(L.buy)){ acts.push({a:'buy'}); sfx('click'); return true; } if(inR(L.auto)){ acts.push({a:'auto'}); sfx('click'); return true; } if(inR(L.shop)){ toggleShop(); return true; }
    if(TOUCH&&y>=204&&y<=232&&x>=10&&x<10+7*34){ acts.push({a:'it',i:Math.floor((x-10)/34)}); sfx('click'); return true; }
    if(!TOUCH){ const P=deskPanel(); for(const b of P.boxes) if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){ acts.push(b.k.slice(0,2)==='it'?{a:'it',i:+b.k.slice(2)}:b.k.slice(0,2)==='lv'?{a:'lv',i:+b.k[2]}:{a:b.k}); sfx('click'); return true; } if(x>=P.x0&&x<=P.x0+532&&y>=P.y0) return true;
      if(x>=W-162&&y>=H-162&&mode===0) return true; }
    return false; }
  function onDown(e){ e.preventDefault(); const [x,y]=toL(e); if(phase==='pick'){ if(x>=SPX0&&x<=SPX1&&y>=396&&y<=460&&!pkDone){ spDrag={id:e.pointerId,x0:x,o0:spOff,mv:false,x,y}; return; } pickClick(x,y); return; } if(phase!=='play') return;
    if(shopOpen){ if(inShop(x,y)){ shopClick(x,y); return; } if(TOUCH){ shopOpen=false; return; } }
    if(hudClick(x,y)) return;
    if(TOUCH){ for(const b of BTN()){ if(Math.hypot(x-b.x,y-b.y)<b.r+6){ sfx('click');
          if(b.k.slice(0,2)==='lv'){ acts.push({a:'lv',i:+b.k[2]}); return; }
          if(b.k==='atk'||b.k==='min'||b.k==='tw'){ hold=true; holdKind=b.k==='atk'?null:b.k; ptr.set(e.pointerId,'atk'); }
          else if(SKK.includes(b.k)||b.k==='d'||b.k==='f'||b.k==='tku'&&myHero()&&myHero().tk==='g'){ aimSk={k:b.k,x0:b.x,y0:b.y,dx:0,dy:0}; ptr.set(e.pointerId,'aim'); }
          else acts.push({a:b.k}); return; } }
      { const u=unitAt(x,y); if(u&&u.k==='w'){ myIn.ord={k:'atk',id:u.id}; acts.push({a:'hw',id:u.id}); G3.fx(['ring',u.x,u.z,1,'#ff4a4a',.4]); return; } }
      if(x<W*.5&&y>H*.3){ J.on=true; J.id=e.pointerId; J.cx=x; J.cy=y; J.x=0; J.y=0; ptr.set(e.pointerId,'joy'); } return; }
    mouse.btn=true; mouse.x=x; mouse.y=y; mouse.in=true; mouse.lastT=t; command(x,y,false); }
  function onMove(e){ const [x,y]=toL(e); if(spDrag&&spDrag.id===e.pointerId){ const dx=x-spDrag.x0; if(Math.abs(dx)>6) spDrag.mv=true; if(spDrag.mv) spOff=clamp(spDrag.o0-dx,0,spMax()); } if(!TOUCH){ mouse.x=x; mouse.y=y; mouse.in=true; } const k=ptr.get(e.pointerId);
    if(k==='joy'){ const dx=x-J.cx,dy=y-J.cy,l=Math.hypot(dx,dy),R0=56; J.x=dx/Math.max(R0,l); J.y=dy/Math.max(R0,l); if(l>R0*1.4){ J.cx=x-dx/l*R0*1.4; J.cy=y-dy/l*R0*1.4; } }
    else if(k==='aim'&&aimSk){ aimSk.dx=x-aimSk.x0; aimSk.dy=y-aimSk.y0; } }
  function onUp(e){ if(spDrag&&spDrag.id===e.pointerId){ const d=spDrag; spDrag=null; if(!d.mv&&phase==='pick') pickClick(d.x,d.y); } const k=ptr.get(e.pointerId); if(k==='atk'){ hold=false; holdKind=null; } if(k==='joy'){ J.on=false; J.x=J.y=0; } if(k==='aim'&&aimSk){ acts.push(aimAct(aimSk)); aimSk=null; } if(!TOUCH) mouse.btn=false; ptr.delete(e.pointerId); }
  const noMenu=e=>e.preventDefault(),leave=()=>{ mouse.in=false; mouse.btn=false; };
  const onWheel=e=>{ if(phase!=='pick') return; const [x,y]=toL(e); if(x>=SPX0&&x<=SPX1&&y>=396&&y<=460){ e.preventDefault(); spOff=clamp(spOff+(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)*.5,0,spMax()); } }; canvas.addEventListener('wheel',onWheel,{passive:false});
  canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointermove',onMove); addEventListener('pointerup',onUp); addEventListener('pointercancel',onUp); canvas.addEventListener('contextmenu',noMenu); canvas.addEventListener('pointerleave',leave); canvas.style.touchAction='none';
  /* ---------- 選英雄 ---------- */
  let pkSel=Math.floor(Math.random()*30),pkTab=0,pkDone=false;
  const TABS=[['all','全部']].concat(Object.entries(CLS).map(([k,v])=>[k,v.n]));
  const pkList=()=>HEROES.filter(h=>TABS[pkTab][0]==='all'||h.cls===TABS[pkTab][0]);
  const takenBy=(team,hid,except)=>slots.some((s,i)=>i!==except&&s.team===team&&s.hero===hid);
  function pickClick(x,y){ if(pkDone) return; TABS.forEach((tb,i)=>{ if(x>=20+i*84&&x<20+i*84+78&&y>=52&&y<=80){ pkTab=i; sfx('click'); } });
    pkList().forEach((h,i)=>{ const cx=24+(i%6)*100,cy=92+Math.floor(i/6)*82; if(x>=cx&&x<cx+94&&y>=cy&&y<cy+76){ pkSel=h.i; sfx('click'); } });
    if(mode===0) ROLES.forEach(([id,n],i)=>{ const bx=640+(i%3)*102,by=330+Math.floor(i/3)*32; if(x>=bx&&x<bx+96&&y>=by&&y<by+28){ setRole(mySlot,id); sfx('click'); } });
    SP_IDS.forEach((id,j)=>[0,1].forEach(row=>{ const bx=SPX0+j*45-spOff,by=398+row*32; if(x>=Math.max(bx,SPX0)&&x<Math.min(bx+42,SPX1)&&y>=by&&y<by+28){ const sp=slots[mySlot].sp; if(sp[1-row]===id) sp[1-row]=sp[row]; sp[row]=id; spTouched=true; sfx('click'); if(client) net.send({t:'pk',sp}); } }));
    if(x>=700&&x<=940&&y>=470&&y<=514) confirmPick(); }
  const SP_IDS=Object.keys(M0.SPELLS),SPX0=676,SPX1=942,spMax=()=>Math.max(0,SP_IDS.length*45-3-(SPX1-SPX0)); let spTouched=false,spOff=0,spDrag=null;
  function setRole(si,role){ const s=slots[si]; if(s.role===role) return; const o=slots.find((q,i)=>i!==si&&q.team===s.team&&q.role===role&&q.human<0); if(o){ o.role=s.role; o.sp=(SP_ROLE[o.role]||SP_ROLE.mid).slice(); } s.role=role; if(si===mySlot&&!spTouched) s.sp=(SP_ROLE[role]||SP_ROLE.mid).slice(); if(client) net.send({t:'pk',role,sp:s.sp}); }
  function confirmPick(){ if(takenBy(myTeam,pkSel,mySlot)){ floatMsg('隊友已經選了這位英雄','#ffb0b0'); return; } slots[mySlot].hero=pkSel; slots[mySlot].ok=true; pkDone=true; sfx('go'); if(client) net.send({t:'pk',h:pkSel,role:slots[mySlot].role,sp:slots[mySlot].sp,ok:1}); }
  function botPicks(){ slots.forEach((s,i)=>{ if(s.hero>=0) return; const want=ROLE_CLS[s.role]||CLS_IDS(); let pool=HEROES.filter(h=>want.includes(h.cls)&&!takenBy(s.team,h.i,i)); if(!pool.length) pool=HEROES.filter(h=>!takenBy(s.team,h.i,i)); s.hero=pool[Math.floor(Math.random()*pool.length)].i; s.ok=true; }); }
  const CLS_IDS=()=>Object.keys(CLS);
  function startPlay(){ phase='play'; slots.forEach((s,i)=>{ const h=mkHero(s,i); h.bot=s.human<0; if(h.bot) botLv(h); heroes.push(h); }); emit(['sfx','go']); floatMsg('全軍出擊！','#ffd23f',2.5); updVis(); }
  /* ---------- 連線 ---------- */
  let snapIn=null;
  if(net){ if(client){ net.onmsg=m=>{ if(m.t==='pks'&&phase==='pick'){ m.sl.forEach((q,i)=>{ if(i===mySlot&&pkDone) return; slots[i].hero=q[0]; slots[i].role=q[1]; slots[i].ok=!!q[2]; if(q[3]) slots[i].sp=q[3]; }); pickT=m.tl; }
        else if(m.t==='go'&&phase==='pick'){ m.sl.forEach((q,i)=>{ slots[i].hero=q[0]; slots[i].role=q[1]; if(q[2]) slots[i].sp=q[2]; }); startPlay(); }
        else if(m.t==='s'&&phase==='play') snapIn=m; else if(m.t==='over') gameOver(m.w); }; }
    else { net.onmsg=(m,from)=>{ const si=slots.findIndex(s=>s.human===from); if(si<0) return; if(m.t==='pk'&&phase==='pick'){ if(m.role) setRoleHost(si,m.role); if(m.sp&&m.sp.length===2&&m.sp.every(q=>SP_IDS.includes(q))) slots[si].sp=m.sp.slice(); if(m.h!=null&&!takenBy(slots[si].team,m.h,si)){ slots[si].hero=m.h; slots[si].ok=!!m.ok; } }
        else if(m.t==='i'&&phase==='play'){ const h=heroes[si]; if(!h) return; h.netIn={x:m.x,z:m.z,face:m.fc,f:m.f,atk:!!m.a,kind:m.k||null,atkId:m.at==null?null:m.at,acts:(h.netIn&&h.netIn.acts||[]).concat(m.q||[])}; } };
      net.onleave=i=>{ const s=slots.find(q=>q.human===i); if(!s) return; s.name+='（離開）'; s.human=-1; if(s.hero<0) botPicks(); const h=heroes[slots.indexOf(s)]; if(h){ h.bot=true; h.human=false; h.name=s.name; } }; } }
  function setRoleHost(si,role){ const s=slots[si]; const o=slots.find((q,i)=>i!==si&&q.team===s.team&&q.role===role&&q.human<0); if(o){ o.role=s.role; o.sp=(SP_ROLE[o.role]||SP_ROLE.mid).slice(); } s.role=role; }
  function sendSnap(){ const r1=v=>Math.round(v*10)/10;
    const hs=heroes.map(h=>[r1(h.x),r1(h.z),r1(h.face),Math.round(h.hp),Math.round(h.max),h.lvl,Math.round(h.xp),Math.round(h.gold),h.dead?r1(h.rsp):0,Math.round(h.shield),r1(h.stun),r1(h.recall),r1(Math.max(0,h.atkT)),r1(Math.max(0,h.castT)),h.kc,h.dc,h.ac,h.items.join(','),h.cd.map(r1),h.spCd.map(r1),h.force,h.auto?1:0,h.buffs.length?1:0,h.pots||0,h.tk,r1(h.tcd),r1(h.lens),h.items.map(id=>r1(h.icd[id]||0)).join(','),r1(Math.max(0,h.potT)),r1(Math.max(0,h.stasis)),h.revT>Tm?1:0,Math.round(h.mp),Math.round(h.mpMax),h.sk.join('')]);
    const ms=minions.map(m=>[m.id,['melee','ranged','cannon'].indexOf(m.mt),m.team,r1(m.x),r1(m.z),Math.round(m.hp),Math.round(m.max),r1(m.face),r1(Math.max(0,m.atkT))]);
    const jm=mons.map(m=>[m.dead?1:0,Math.round(m.hp),Math.round(m.max),r1(m.x),r1(m.z),r1(m.face),r1(Math.max(0,m.atkT||0))]);
    net.send({t:'s',T:r1(Tm),hs,ms,jm,tw:towers.map(q=>Math.round(q.hp)),ti:towers.map(q=>q.inv?1:0),co:cores.map(q=>Math.round(q.hp)),ci:cores.map(q=>q.inv?1:0),tb:teamBuff.map(q=>[r1(q.dmg),r1(q.reg)]),kl:kills,wd:wards.map(w=>[w.id,w.team,w.x,w.z,r1(w.t),w.hp,w.owner]),ev:sendEV}); sendEV=[]; }
  function applySnap(m){ Tm=m.T; kills[0]=m.kl[0]; kills[1]=m.kl[1]; m.tb.forEach((q,i)=>{ teamBuff[i].dmg=q[0]; teamBuff[i].reg=q[1]; });
    m.hs.forEach((a,i)=>{ const h=heroes[i]; if(!h) return; const mine=i===mySlot,forced=a[20]!==h.force; h.tx=a[0]; h.tz=a[1];
      if(!mine||forced||a[8]>0||a[10]>0){ if(mine&&(forced||a[8]>0)){ h.x=a[0]; h.z=a[1]; } if(!mine) h.face=a[2]; }
      h.force=a[20]; h.hp=a[3]; h.max=a[4]; h.lvl=a[5]; h.xp=a[6]; h.gold=a[7]; h.dead=a[8]>0; h.rsp=a[8]; h.shield=a[9]; h.stun=a[10]; h.recall=a[11]; h.atkT=a[12]; h.castT=a[13]; h.kc=a[14]; h.dc=a[15]; h.ac=a[16]; h.items=a[17]?a[17].split(','):[]; h.cd=a[18]; h.spCd=a[19]; h.auto=!!a[21]; if(a.length>23){ h.pots=a[23]; h.tk=a[24]; h.tcd=a[25]; h.lens=a[26]; const ic=a[27]?String(a[27]).split(',').map(Number):[]; h.icd={}; h.items.forEach((id,k)=>{ if(ic[k]) h.icd[id]=Math.max(h.icd[id]||0,ic[k]); }); h.potT=a[28]; h.stasis=a[29]; h.revT=a[30]?Tm+.3:0; h.mp=a[31]; h.mpMax=a[32]; if(a[33]!=null) h.sk=String(a[33]).split('').map(Number); } });
    wards.length=0; (m.wd||[]).forEach(a=>wards.push({id:a[0],k:'w',team:a[1],x:a[2],z:a[3],t:a[4],hp:a[5],max:3,owner:a[6],r:.4}));
    const seen=new Set(); m.ms.forEach(a=>{ seen.add(a[0]); let u=minions.find(q=>q.id===a[0]); if(!u){ u={id:a[0],k:'m',mt:['melee','ranged','cannon'][a[1]],team:a[2],x:a[3],z:a[4],r:.6,big:a[1]===2}; u.big=u.mt==='cannon'; minions.push(u); } u.tx=a[3]; u.tz=a[4]; u.hp=a[5]; u.max=a[6]; u.face=a[7]; u.atkT=a[8]; u.dead=false; });
    for(let i=minions.length-1;i>=0;i--) if(!seen.has(minions[i].id)) minions.splice(i,1);
    m.jm.forEach((a,i)=>{ const u=mons[i]; u.dead=!!a[0]; u.hp=a[1]; u.max=a[2]; u.tx=a[3]; u.tz=a[4]; if(u.x==null||u.dead){ u.x=a[3]; u.z=a[4]; } u.face=a[5]; u.atkT=a[6]; });
    m.tw.forEach((v,i)=>{ towers[i].hp=v; towers[i].inv=!!m.ti[i]; }); m.co.forEach((v,i)=>{ cores[i].hp=v; cores[i].inv=!!m.ci[i]; });
    for(const e of m.ev) EV.push(e); }
  /* ---------- 特效、浮動文字 ---------- */
  function floatMsg(s,col,dur){ feed.push({s,col:col||'#fff',t:dur||1.6,big:1}); }
  function runEvents(){ const mh=myHero(); for(const e of EV){ const k=e[0];
      if(k==='dn'){ const tu=byId(e[5]); if(tu&&tu.vh) continue; if(!mh||e[5]===mh.id||e[6]===mh.id||Math.hypot(e[1]-camX,e[2]-camZ)<16) floats.push({x:e[1],z:e[2],txt:String(e[3]),col:e[4],t:0,mine:mh&&(e[5]===mh.id),dx:(Math.random()-.5)*.8}); }
      else if(k==='feed'){ feed.push({s:e[1],col:e[2]===2?'#ffffff':TEAMC[e[2]],t:4}); const sm=feed.filter(f=>!f.big); if(sm.length>5) feed.splice(feed.indexOf(sm[0]),1); }
      else if(k==='ann'){ anns.push({s:e[1],k:e[2],v:e[3],team:e[4],t:2.6}); if(anns.length>4) anns.splice(1,1); }
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
    if(anns.length){ anns[0].t-=dt; if(anns[0].t<=0) anns.shift(); }
    for(const f of feed) f.t-=dt; for(let i=feed.length-1;i>=0;i--) if(feed[i].t<=0) feed.splice(i,1);
    if(phase==='pick'){ pickT-=dt; if(host){ const allOk=slots.every(s=>s.human<0||s.ok); if(net){ sendT-=dt; if(sendT<=0){ sendT=.3; net.send({t:'pks',sl:slots.map(s=>[s.hero,s.role,s.ok?1:0,s.sp]),tl:pickT}); } }
        if(pickT<=0||allOk){ slots.forEach((s,i)=>{ if(s.human>=0&&s.hero<0){ if(i===mySlot&&!pkDone){ if(takenBy(s.team,pkSel,i)) pkSel=HEROES.find(h=>!takenBy(s.team,h.i,i)).i; s.hero=pkSel; pkDone=true; } } }); botPicks(); if(net) net.send({t:'go',sl:slots.map(s=>[s.hero,s.role,s.sp])}); startPlay(); } }
      else if(pickT<=0&&!pkDone) confirmPick(); return; }
    if(phase!=='play') return;
    const mh=myHero();
    if(stopOrd){ myIn.ord=null; stopOrd=false; }
    if(shopOpen&&!canShop(mh)) shopOpen=false;
    if(host){ const I=localIn(); myIn.mx=I.mx; myIn.mz=I.mz; myIn.atk=I.atk; myIn.kind=I.kind; myIn.acts.push(...I.acts); acc+=dt; while(acc>=.05&&!ended){ acc-=.05; sim(.05); } if(net){ sendT-=dt; if(sendT<=0){ sendT=.1; sendSnap(); } } }
    else { if(snapIn){ applySnap(snapIn); snapIn=null; } const I=localIn(); myIn.mx=I.mx; myIn.mz=I.mz; myIn.atk=I.atk; myIn.kind=I.kind; myIn.acts.push(...I.acts);
      visT-=dt; if(visT<=0){ visT=.1; updVis(); }
      for(const h of heroes){ if(h!==mh&&h.tx!=null){ const f=Math.min(1,dt*10); h.x+=(h.tx-h.x)*f; h.z+=(h.tz-h.z)*f; } }
      for(const m of minions) if(m.tx!=null){ const f=Math.min(1,dt*10); m.x+=(m.tx-m.x)*f; m.z+=(m.tz-m.z)*f; } for(const m of mons) if(m.tx!=null){ const f=Math.min(1,dt*10); m.x+=(m.tx-m.x)*f; m.z+=(m.tz-m.z)*f; }
      if(mh&&!mh.dead&&!(mh.stun>0)&&!(mh.recall>0&&!myIn.mx&&!myIn.mz&&!myIn.ord)) localMove(mh,dt,myIn);
      if(mh&&!mh.dead&&myIn.atk&&!myIn.mx&&!myIn.mz){ const tg=pickKind(mh,myIn.kind,null); if(!tg){ const e=pickKind(mh,myIn.kind,7.5); if(e) moveUnit(mh,e.x-mh.x,e.z-mh.z,stats(mh).spd,dt); } }
      inT-=dt; if(inT<=0||myIn.acts.length){ inT=1/15; net.send({t:'i',x:+mh.x.toFixed(2),z:+mh.z.toFixed(2),fc:+mh.face.toFixed(2),f:mh.force,a:myIn.atk?1:0,k:myIn.kind,at:myIn.ord&&myIn.ord.k==='atk'?myIn.ord.id:null,q:myIn.acts}); myIn.acts=[]; } }
    runEvents(); vprojTick(dt);
    for(const f of floats) f.t+=dt; for(let i=floats.length-1;i>=0;i--) if(floats[i].t>1) floats.splice(i,1);
    let fh=mh; if(opts.preview&&(!mh||mh.dead||mh.recall>0)) fh=heroes.find(h=>h.team===myTeam&&!h.dead&&!(h.recall>0))||mh;
    if(fh){ const tx=fh.x,tz=fh.z; camX+=(tx-camX)*Math.min(1,dt*6); camZ+=(tz-camZ)*Math.min(1,dt*6); }
  }
  /* ---------- 畫面 ---------- */
  let lt=0,tS=0,tN=0,lvl=0,frame3=0;
  function draw(){ if(phase==='pick'){ drawPick(); return; }
    { const mh=myHero(); let tw=null; if(mh&&!mh.dead) for(const s of towers.concat(cores)){ if(s.team===myTeam||s.hp<=0) continue; const R0=s.k==='c'?CORE_R:TW_R; if(dist(s,mh)<R0+5){ tw=s; break; } }
      if(tw){ const R0=tw.k==='c'?CORE_R:TW_R,safe=minions.some(q=>q.team===myTeam&&alive(q)&&dist(q,tw)<R0); G3.towerRange(tw.x,tw.z,R0,dist(tw,mh)<R0+.5&&!safe); } else G3.towerRange(null); }
    { const PVw=!!opts.preview,V=VIS[myTeam]; for(const u of heroes) u.vh=!PVw&&u.team!==myTeam&&!V.has(u.id); for(const u of minions) u.vh=!PVw&&u.team!==myTeam&&!V.has(u.id); for(const u of mons) u.vh=!PVw&&!V.has(u.id);
      if(t-fogLast>.12||t<fogLast){ fogLast=t; G3.fog(PVw?null:VSRC[myTeam].map(q=>[q[0],q[1],q[2]])); } const mh=myHero(); G3.bushIn(mh&&!mh.dead?bushAt(mh.x,mh.z):-1); }
    G3.render(GS,camX,camZ,flip,t); c.drawImage(G3.canvas,0,0,W,H);
    const now=performance.now()/1000; if(lt){ const d=now-lt; if(d<.3){ tS+=d; tN++; } } lt=now; if(tN>=90){ const av=tS/tN; tS=0; tN=0; if(av>.034&&lvl<2){ lvl++; if(lvl===1) G3.shadows(false); else G3.setQ(Math.max(.8,G3.Q-.3)); } }
    if(!TOUCH&&mouse.in&&!(frame3=(frame3+1)%3)){ hover=unitAt(mouse.x,mouse.y); canvas.style.cursor=hover&&hover.team!==myTeam?'crosshair':'default'; }
    drawBars(); drawFloats(); if(opts.preview){ drawAnn(); return; } drawHUD(); drawMini(); drawFeed(); if(shopOpen) drawShop(); drawAnn(); }
  function bar(x,y,w,h,k,col,bg){ c.fillStyle=bg||'rgba(10,10,20,.75)'; rr(c,x-1,y-1,w+2,h+2,2); c.fill(); c.fillStyle=col; c.fillRect(x,y,w*clamp(k,0,1),h); }
  function drawBars(){ const mh=myHero();
    for(const s of towers.concat(cores)){ if(s.hp<=0) continue; const p=G3.toScreen(s.x,s.k==='c'?8.5:7.4,s.z); if(!p[2]||p[0]<-50||p[0]>W+50||p[1]<-20||p[1]>H+20) continue; const w=s.k==='c'?80:64; bar(p[0]-w/2,p[1],w,6,s.hp/s.max,s.team===myTeam?'#3d8bff':'#ff4a4a'); if(s.inv){ c.fillStyle='#ffd23f'; c.font='900 11px '+TC; c.textAlign='center'; c.fillText('🛡',p[0],p[1]-8); }
      if(mh&&!mh.dead&&s.team!==myTeam&&dist(mh,s)<(s.k==='c'?CORE_R:TW_R)+3){ /* 塔的攻擊範圍提示 */ } }
    for(const m of minions){ if(m.dead||m.vh) continue; const p=G3.toScreen(m.x,m.big?2.4:2,m.z); if(!p[2]||p[0]<-20||p[0]>W+20||p[1]<-10||p[1]>H+10) continue; bar(p[0]-14,p[1],28,3,m.hp/m.max,m.team===myTeam?'#5aa8ff':'#ff5a5a'); }
    for(const m of mons){ if(m.dead||m.vh) continue; const p=G3.toScreen(m.x,m.big?5:2.6,m.z); if(!p[2]) continue; bar(p[0]-(m.big?40:22),p[1],m.big?80:44,m.big?6:4,m.hp/m.max,'#ffb040'); }
    for(const h of heroes){ if(h.dead||h.vh) continue; const p=G3.toScreen(h.x,3.25,h.z); if(!p[2]||p[0]<-60||p[0]>W+60||p[1]<-30||p[1]>H+30) continue; const col=h.me?'#5fd068':h.team===myTeam?'#3d8bff':'#ff4a4a',w=66;
      bar(p[0]-w/2+8,p[1],w-8,7,h.hp/h.max,col); if(h.team===myTeam&&h.mpMax) bar(p[0]-w/2+8,p[1]+9,w-8,2,h.mp/h.mpMax,'#6aa8ff'); if(h.shield>0){ c.fillStyle='rgba(235,240,255,.9)'; c.fillRect(p[0]-w/2+8,p[1]+7,(w-8)*clamp(h.shield/h.max,0,1),2); }
      for(let k=1;k*500<h.max;k++){ c.fillStyle='rgba(0,0,0,.5)'; c.fillRect(p[0]-w/2+8+(w-8)*k*500/h.max,p[1],1,7); }
      c.fillStyle='rgba(10,10,20,.85)'; c.beginPath(); c.arc(p[0]-w/2+2,p[1]+3.5,8,0,TAU); c.fill(); c.fillStyle='#fff'; c.font='900 10px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(h.lvl,p[0]-w/2+2,p[1]+4);
      c.font='700 11px '+TC; c.lineWidth=3; c.strokeStyle='rgba(0,0,0,.7)'; const nm=h.def.n+(h.human&&!h.me?'・'+h.name:''); c.strokeText(nm,p[0]+4,p[1]-8); c.fillStyle=h.me?'#ffe066':'#fff'; c.fillText(nm,p[0]+4,p[1]-8);
      if(h.recall>0){ bar(p[0]-30,p[1]+14,60,4,1-h.recall/3.5,'#9ad8ff'); } } }
  function drawFloats(){ for(const f of floats){ const p=G3.toScreen(f.x+f.dx,2.8+f.t*1.6,f.z); if(!p[2]) continue; c.globalAlpha=Math.min(1,(1-f.t)*2); c.font='900 '+(f.mine?15:13)+'px '+TC; c.textAlign='center'; c.lineWidth=3; c.strokeStyle='rgba(0,0,0,.75)'; c.strokeText(f.txt,p[0],p[1]); c.fillStyle=f.col; c.fillText(f.txt,p[0],p[1]); } c.globalAlpha=1; }
  // 傳說對決式擊殺播報：擊殺者頭像 ⚔ 被擊殺者頭像，上面大字
  function drawAnn(){ const a=anns[0]; if(!a) return; const life=2.6-a.t,al=Math.min(1,a.t*3,life*6),sc=life<.18?1.35-life/.18*.35:1,col=TEAMC[a.team],w=Math.min(W*.86,360),pr=TOUCH?34:46;
    c.save(); c.globalAlpha=al; c.translate(W/2,TOUCH?H*.32:Math.max(150,H*.225)); c.scale(sc,sc);
    const g=c.createLinearGradient(-w/2,0,w/2,0); g.addColorStop(0,'rgba(8,10,24,0)'); g.addColorStop(.22,'rgba(8,10,24,.88)'); g.addColorStop(.78,'rgba(8,10,24,.88)'); g.addColorStop(1,'rgba(8,10,24,0)'); c.fillStyle=g; c.fillRect(-w/2,-pr/2-4,w,pr+8);
    const g2=c.createLinearGradient(-w/2,0,w/2,0); g2.addColorStop(0,'rgba(0,0,0,0)'); g2.addColorStop(.5,col); g2.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g2; c.fillRect(-w/2,-pr/2-6,w,2); c.fillRect(-w/2,pr/2+4,w,2);
    const face=(u,x,lose)=>{ c.save(); if(u&&u.k==='h') portrait(c,x,0,pr,u.def); else { c.fillStyle=u?shadeHex(TEAMC[u.team]||'#888',.6):'#444'; c.beginPath(); c.arc(x,0,pr/2,0,TAU); c.fill(); c.fillStyle='#fff'; c.font='900 '+(pr*.42|0)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(u&&(u.k==='t'||u.k==='c')?'塔':u?'兵':'?',x,1); }
      if(lose){ c.fillStyle='rgba(0,0,0,.45)'; c.beginPath(); c.arc(x,0,pr/2,0,TAU); c.fill(); c.strokeStyle='#ff4a4a'; c.lineWidth=3; c.beginPath(); c.moveTo(x-pr*.22,-pr*.22); c.lineTo(x+pr*.22,pr*.22); c.moveTo(x+pr*.22,-pr*.22); c.lineTo(x-pr*.22,pr*.22); c.stroke(); }
      c.strokeStyle=u&&TEAMC[u.team]?TEAMC[u.team]:'#aaa'; c.lineWidth=3; c.beginPath(); c.arc(x,0,pr/2+1,0,TAU); c.stroke(); c.restore(); };
    face(a.k?byId(a.k):null,-w*.27,0); face(byId(a.v),w*.27,1);
    c.font='900 '+(pr*.62|0)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#ffe9a8'; c.fillText('⚔',0,2);
    const big=a.s!=='擊殺'&&a.s!=='陣亡',fs=big?(TOUCH?24:30):(TOUCH?18:22); c.font='900 '+fs+'px '+TC; const tg=c.createLinearGradient(0,-pr/2-8-fs,0,-pr/2-8); tg.addColorStop(0,'#fff6cf'); tg.addColorStop(1,big?'#ffb83a':shadeHex(col,1.4)); c.lineWidth=5; c.strokeStyle='rgba(0,0,0,.8)'; c.strokeText(a.s,0,-pr/2-8-fs/2); c.fillStyle=tg; c.fillText(a.s,0,-pr/2-8-fs/2);
    c.restore(); }
  let shopOpen=false,shopTab=0,shopSel=null,shopSlot=-1;
  function toggleShop(){ sfx('click'); if(shopOpen){ shopOpen=false; return; } if(!canShop(myHero())){ floatMsg('要回城（按 '+(TOUCH?'回城':'B')+'）回到泉水才能開商店','#ffb0b0',2); return; } shopOpen=true; }
  const SHOP_TABS=[['rec','推薦'],['atk','攻擊'],['mag','法術'],['def','防禦'],['misc','鞋子・藥水']],SP0={x:110,y:46,w:740,h:452};
  const inShop=(x,y)=>x>=SP0.x&&x<=SP0.x+SP0.w&&y>=SP0.y&&y<=SP0.y+SP0.h;
  function shopList(){ const mh=myHero(),tb=SHOP_TABS[shopTab][0]; if(tb==='rec'){ const o=[]; for(const b of mh.build){ for(const f of ITEMS[b].from||[]) if(!o.includes(f)) o.push(f); if(!o.includes(b)) o.push(b); } if(!o.includes('pot')) o.push('pot'); return o; }
    return Object.keys(ITEMS).filter(id=>ITEMS[id].cat===tb&&(id!=='jg'||mode===0)); }
  function itemIcon(x,y,w,h,id,dim){ const it=ITEMS[id]; c.save(); const g=c.createLinearGradient(x,y,x+w,y+h); g.addColorStop(0,shadeHex(it.col,1.35)); g.addColorStop(1,shadeHex(it.col,.55)); c.fillStyle=g; rr(c,x,y,w,h,Math.min(6,w*.2)); c.fill();
    c.strokeStyle=it.act?'#ffd23f':'rgba(0,0,0,.45)'; c.lineWidth=it.act?2:1; c.stroke(); c.fillStyle='#14122b'; c.font='900 '+Math.max(8,Math.round(w*.34))+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(it.n.slice(0,2),x+w/2,y+h/2+1);
    if(dim){ c.fillStyle='rgba(0,0,0,.45)'; rr(c,x,y,w,h,Math.min(6,w*.2)); c.fill(); } c.restore(); }
  function cdCover(x,y,w,h,v,m){ if(!(v>0)) return; c.save(); rr(c,x,y,w,h,5); c.clip(); c.fillStyle='rgba(0,0,0,.6)'; c.beginPath(); c.moveTo(x+w/2,y+h/2); c.arc(x+w/2,y+h/2,Math.max(w,h),-PI/2,-PI/2+TAU*clamp(v/m,0,1)); c.closePath(); c.fill(); c.restore(); c.fillStyle='#fff'; c.font='900 11px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(Math.ceil(v),x+w/2,y+h/2+1); }
  function slotIcon(mh,i,x,y,w,h,key){ c.fillStyle='rgba(255,255,255,.07)'; rr(c,x,y,w,h,5); c.fill();
    if(i===6){ const TK=TRINK[mh.tk]; c.fillStyle=shadeHex(TK.col,.5); c.beginPath(); c.arc(x+w/2,y+h/2,Math.min(w,h)/2-1,0,TAU); c.fill(); c.strokeStyle=TK.col; c.lineWidth=1.5; c.stroke(); c.fillStyle='#fff'; c.font='900 10px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(TK.n.slice(0,1)+'眼',x+w/2,y+h/2+1); cdCover(x,y,w,h,mh.tcd,TK.cd); }
    else { const id=mh.items[i]; if(id){ itemIcon(x+1,y+1,w-2,h-2,id); if(id==='pot'){ c.fillStyle='#fff'; c.font='900 10px '+TC; c.textAlign='right'; c.fillText(mh.pots,x+w-3,y+h-6); cdCover(x,y,w,h,mh.potT,12); } else if(ITEMS[id].act) cdCover(x,y,w,h,mh.icd[id]||0,ITEMS[id].act.cd); } }
    if(key){ c.fillStyle='rgba(0,0,0,.65)'; rr(c,x,y+h-10,10,10,3); c.fill(); c.fillStyle='#ffe066'; c.font='900 8px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(key,x+5,y+h-4.5); } }
  function itemLines(it){ const o=[]; if(it.atk) o.push('攻擊 +'+it.atk); if(it.as) o.push('攻速 +'+Math.round(it.as*100)+'%'); if(it.sp) o.push('技能威力 +'+Math.round(it.sp*100)+'%'); if(it.hp) o.push('生命 +'+it.hp); if(it.arm) o.push('護甲 +'+it.arm); if(it.spd) o.push('移動速度 +'+Math.round(it.spd*100)+'%'); if(it.cdr) o.push('冷卻縮減 '+Math.round(it.cdr*100)+'%'); if(it.ls) o.push('吸血 '+Math.round(it.ls*100)+'%'); if(it.heal) o.push('治療效果 +'+Math.round(it.heal*100)+'%'); return o; }
  function wrapText(str,x,y,maxW,lh){ let line=''; for(const ch of str){ if(c.measureText(line+ch).width>maxW){ c.fillText(line,x,y); y+=lh; line=ch; } else line+=ch; } if(line) c.fillText(line,x,y); return y+lh; }
  function shopBtn(x,y,w,h,lab,on,dis){ c.fillStyle=dis?'rgba(255,255,255,.08)':on?'#ffd23f':'rgba(255,255,255,.12)'; rr(c,x,y,w,h,10); c.fill(); c.fillStyle=dis?'#77738f':on?'#14122b':'#fff'; c.font='900 13px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(lab,x+w/2,y+h/2+1); }
  function drawShop(){ const mh=myHero(); if(!mh) return; const {x:X,y:Y,w:Wd,h:Ht}=SP0; c.save(); c.fillStyle='rgba(14,12,32,.96)'; rr(c,X,Y,Wd,Ht,16); c.fill(); c.strokeStyle='rgba(200,170,90,.85)'; c.lineWidth=2; c.stroke();
    c.textBaseline='middle'; c.textAlign='left'; c.fillStyle='#ffd23f'; c.font='900 20px '+TC; c.fillText('商店',X+16,Y+22); c.font='900 15px '+TC; c.fillText('● '+Math.floor(mh.gold),X+72,Y+23);
    c.fillStyle='#9a94c0'; c.font='700 11px '+TC; c.fillText(TOUCH?'點一下看說明，再按「購買」；點空白處關閉':'P 開關商店；再點一次同一件就直接買；1～6 用裝備、7 用眼',X+170,Y+23);
    shopBtn(X+Wd-40,Y+8,30,28,'✕');
    // 眼：二選一、免費
    c.textAlign='left'; c.fillStyle='#fff'; c.font='900 13px '+TC; c.fillText('眼（免費・第 7 格）',X+16,Y+64);
    [['g',X+170],['r',X+450]].forEach(([k,bx])=>{ const TK=TRINK[k],on=mh.tk===k; c.fillStyle=on?shadeHex(TK.col,.45):'rgba(255,255,255,.07)'; rr(c,bx,Y+46,270,38,10); c.fill(); c.strokeStyle=on?TK.col:'rgba(255,255,255,.2)'; c.lineWidth=on?2.5:1; c.stroke();
      c.fillStyle=TK.col; c.beginPath(); c.arc(bx+20,Y+65,9,0,TAU); c.fill(); c.fillStyle='#fff'; c.font='900 13px '+TC; c.textAlign='left'; c.fillText(TK.n+(on?'（使用中）':''),bx+36,Y+58); c.fillStyle='#cfc8ff'; c.font='700 9.5px '+TC; c.fillText(TK.s,bx+36,Y+74); });
    SHOP_TABS.forEach((tb,i)=>shopBtn(X+14+i*100,Y+96,94,28,tb[1],i===shopTab));
    const L=shopList(),gx=X+14,gy=Y+134;
    L.forEach((id,i)=>{ const it=ITEMS[id],x=gx+(i%6)*74,y=gy+Math.floor(i/6)*68,on=shopSel===id,pc=priceFor(mh,id).cost; c.fillStyle=on?'rgba(255,210,63,.22)':'rgba(255,255,255,.05)'; rr(c,x,y,70,64,8); c.fill(); if(on){ c.strokeStyle='#ffd23f'; c.lineWidth=2; c.stroke(); }
      itemIcon(x+17,y+4,36,32,id,mh.gold<pc); c.fillStyle='#fff'; c.font='700 10px '+TC; c.textAlign='center'; c.fillText(it.n,x+35,y+45); c.fillStyle=mh.gold>=pc?'#ffd23f':'#c87a7a'; c.font='900 10px '+TC; c.fillText('● '+pc,x+35,y+57); });
    // 說明＋合成表
    const dx=X+470,dw=Wd-484; c.fillStyle='rgba(255,255,255,.05)'; rr(c,dx-6,Y+134,dw+12,Ht-144,10); c.fill();
    if(shopSel){ const it=ITEMS[shopSel],P0=priceFor(mh,shopSel); itemIcon(dx,Y+142,44,40,shopSel); c.textAlign='left'; c.fillStyle='#fff'; c.font='900 16px '+TC; c.fillText(it.n,dx+54,Y+154); c.fillStyle='#ffd23f'; c.font='900 12px '+TC; c.fillText('● '+P0.cost+(P0.cost<it.c?'（原價 '+it.c+'）':''),dx+54,Y+174);
      let yy=Y+198; c.font='700 11px '+TC; c.fillStyle='#9ad8ff'; for(const l of itemLines(it)){ c.fillText(l,dx,yy); yy+=15; } if(it.d){ c.fillStyle=it.act?'#ffe066':'#cfc8ff'; yy=wrapText(it.d,dx,yy+2,dw,14); }
      if(it.from){ yy+=4; c.fillStyle='#fff'; c.font='900 11px '+TC; c.fillText('合成：',dx,yy+12); const inv=mh.items.slice(); it.from.forEach((f,k)=>{ const own=inv.indexOf(f); if(own>=0) inv.splice(own,1); const fx=dx+40+k*36; itemIcon(fx,yy,30,26,f); if(own>=0){ c.fillStyle='#5fff7a'; c.font='900 12px '+TC; c.textAlign='center'; c.fillText('✓',fx+26,yy+4); c.textAlign='left'; } });
        c.fillStyle='#cfc8ff'; c.font='700 10px '+TC; c.fillText('＋ 合成費 ● '+(it.c-it.from.reduce((a,f)=>a+ITEMS[f].c,0)),dx+44+it.from.length*36,yy+13); }
      const can=mh.gold>=P0.cost&&P0.slotsOk&&!(shopSel==='pot'&&mh.pots>=5); shopBtn(dx,Y+300,dw,34,!P0.slotsOk?'裝備格滿了':mh.gold<P0.cost?'金幣不夠':'購買　● '+P0.cost,can,!can); }
    else { c.fillStyle='#9a94c0'; c.font='700 12px '+TC; c.textAlign='left'; wrapText('點左邊的裝備看說明。基本材料可以合成更強的裝備，身上有的材料會折抵價錢；金框的裝備有主動技能。',dx,Y+160,dw,16); }
    // 我的裝備（點一格再按賣出）
    c.fillStyle='#fff'; c.font='900 11px '+TC; c.textAlign='left'; c.fillText('我的裝備（點一格再按賣出）',dx,Y+350);
    for(let i=0;i<7;i++){ const x=dx+i*36,y=Y+360; slotIcon(mh,i,x,y,32,30,String(i+1)); if(i===shopSlot){ c.strokeStyle='#ffd23f'; c.lineWidth=2; rr(c,x,y,32,30,5); c.stroke(); } }
    const sid=shopSlot>=0&&shopSlot<6?mh.items[shopSlot]:null,back=sid?(sid==='pot'?20*(mh.pots||0):Math.floor(ITEMS[sid].c*.7)):0; shopBtn(dx,Y+400,dw,32,sid?'賣出 '+ITEMS[sid].n+'　+'+back:'賣出',!!sid,!sid);
    c.restore(); }
  function shopClick(x,y){ const mh=myHero(); if(!mh) return; const {x:X,y:Y,w:Wd}=SP0,inR=(a,b,w,h)=>x>=a&&x<=a+w&&y>=b&&y<=b+h; sfx('click');
    if(inR(X+Wd-40,Y+8,30,28)){ shopOpen=false; return; }
    if(inR(X+170,Y+46,270,38)){ acts.push({a:'tc',v:'g'}); return; } if(inR(X+450,Y+46,270,38)){ acts.push({a:'tc',v:'r'}); return; }
    for(let i=0;i<SHOP_TABS.length;i++) if(inR(X+14+i*100,Y+96,94,28)){ shopTab=i; return; }
    const L=shopList(); for(let i=0;i<L.length;i++){ if(inR(X+14+(i%6)*74,Y+134+Math.floor(i/6)*68,70,64)){ if(shopSel===L[i]&&!TOUCH) acts.push({a:'bi',id:L[i]}); shopSel=L[i]; return; } }
    const dx=X+470,dw=Wd-484; if(shopSel&&inR(dx,Y+300,dw,34)){ acts.push({a:'bi',id:shopSel}); return; }
    for(let i=0;i<7;i++) if(inR(dx+i*36,Y+360,32,30)){ shopSlot=i<6&&mh.items[i]?i:-1; return; }
    if(inR(dx,Y+400,dw,32)&&shopSlot>=0&&mh.items[shopSlot]){ acts.push({a:'si',i:shopSlot}); shopSlot=-1; } }
  function drawFeed(){ let y=TOUCH?72:74; const sm=feed.filter(f=>!f.big).slice(TOUCH?-3:-5); for(const f of sm){ c.globalAlpha=Math.min(1,f.t); c.font='900 '+(TOUCH?11:13)+'px '+TC; const w=c.measureText(f.s).width+24,x=W-12-w; c.fillStyle='rgba(10,10,24,.72)'; rr(c,x,y,w,TOUCH?20:24,10); c.fill(); c.fillStyle=f.col; c.fillRect(x+6,y+5,3,TOUCH?10:14); c.textAlign='center'; c.textBaseline='middle'; c.fillText(f.s,x+w/2+3,y+(TOUCH?10.5:12.5)); y+=TOUCH?23:28; }
    const bigs=feed.filter(f=>f.big); bigs.slice(-1).forEach(f=>{ c.globalAlpha=Math.min(1,f.t*2); c.font='900 18px '+TC; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='rgba(0,0,0,.75)'; c.strokeText(f.s,W/2,H*.38); c.fillStyle=f.col; c.fillText(f.s,W/2,H*.38); }); c.globalAlpha=1; }
  function skIcon(x,y,w,h,label,col,cdv,cdm,dis,key,round){ c.save(); const g=c.createLinearGradient(0,y,0,y+h); g.addColorStop(0,shadeHex(col,1.45)); g.addColorStop(1,col); c.fillStyle=g;
    if(round){ c.beginPath(); c.arc(x,y,w,0,TAU); c.fill(); c.strokeStyle='rgba(255,255,255,.8)'; c.lineWidth=2; c.stroke(); } else { rr(c,x,y,w,h,8); c.fill(); c.strokeStyle='rgba(255,230,160,.75)'; c.lineWidth=1.5; c.stroke(); }
    const cx=round?x:x+w/2,cy=round?y:y+h/2,rad=round?w:Math.max(w,h);
    if(cdv>0){ c.save(); if(round){ c.beginPath(); c.arc(x,y,w,0,TAU); c.clip(); } else { rr(c,x,y,w,h,8); c.clip(); } c.fillStyle='rgba(0,0,0,.62)'; c.beginPath(); c.moveTo(cx,cy); c.arc(cx,cy,rad*1.5,-PI/2,-PI/2+TAU*clamp(cdv/cdm,0,1)); c.closePath(); c.fill(); c.restore(); }
    if(dis){ c.fillStyle='rgba(0,0,0,.66)'; if(round){ c.beginPath(); c.arc(x,y,w,0,TAU); c.fill(); } else { rr(c,x,y,w,h,8); c.fill(); } }
    c.fillStyle='#fff'; c.textAlign='center'; c.textBaseline='middle'; const fs=round?(w>40?16:w>28?11:10):11; c.font='900 '+fs+'px '+TC;
    if(cdv>0){ c.font='900 '+(fs+3)+'px '+TC; c.fillText(Math.ceil(cdv),cx,cy); } else if(label.length>2&&!(round&&w>40)){ c.fillText(label.slice(0,2),cx,cy-6); c.fillText(label.slice(2,4),cx,cy+7); } else c.fillText(label,cx,cy);
    if(dis&&typeof dis==='string'){ c.font='700 9px '+TC; c.fillText(dis,cx,cy+(round?w-9:h/2-7)); }
    if(key){ c.fillStyle='#ffd23f'; c.font='900 10px '+TC; c.textAlign='left'; c.fillText(key,round?x+w*.55:x+3,round?y-w*.75:y+8); } c.restore(); }
  function drawHUD(){ const mh=myHero(); if(!mh) return; const S=stats(mh),SPL=M0.SPELLS;
    // 比分、時間（上方中間）；戰績、金幣
    c.fillStyle='rgba(10,10,24,.75)'; rr(c,W/2-110,6,220,40,12); c.fill(); c.textAlign='center'; c.textBaseline='middle'; c.font='900 22px '+TC; c.fillStyle=TEAMC[myTeam]; c.fillText(kills[myTeam],W/2-58,26); c.fillStyle=TEAMC[1-myTeam]; c.fillText(kills[1-myTeam],W/2+58,26); c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText(fmtT(Tm),W/2,26);
    c.fillStyle='rgba(10,10,24,.75)'; rr(c,W-212,6,204,40,12); c.fill(); c.textAlign='left'; c.font='900 14px '+TC; c.fillStyle='#fff'; c.fillText(mh.kc+' / '+mh.dc+' / '+mh.ac,W-200,26); c.fillStyle='#ffd23f'; c.fillText('● '+Math.floor(mh.gold),W-104,26);
    let bx=W/2+120; for(const [k,lab,colr] of [['dmg','岩魔之力','#c08aff'],['reg','巨獸之息','#8affc8']]){ const v=teamBuff[myTeam][k]; if(v>0){ c.fillStyle='rgba(10,10,24,.75)'; rr(c,bx,10,96,30,10); c.fill(); c.fillStyle=colr; c.font='900 11px '+TC; c.textAlign='left'; c.fillText(lab+' '+Math.ceil(v),bx+8,26); bx+=100; } }
    // 買裝備（建議的下一件）＋自動
    const L=HL(),nxt=planBuy(mh),it=nxt&&ITEMS[nxt],pc=nxt?priceFor(mh,nxt).cost:0,can=it&&mh.gold>=pc&&canShop(mh),[qx,qy,qw,qh]=L.buy;
    c.fillStyle=can?'rgba(255,210,63,.95)':'rgba(10,10,24,.8)'; rr(c,qx,qy,qw,qh,10); c.fill(); c.strokeStyle='#ffd23f'; c.lineWidth=1.5; c.stroke();
    c.fillStyle=can?'#14122b':'#fff'; c.textAlign='left'; c.textBaseline='middle'; c.font='900 13px '+TC; if(TOUCH){ const away=!canShop(mh); c.fillText(it?'買 '+it.n:'裝備已滿',qx+10,qy+14); c.font='700 10px '+TC; c.fillText(it?'● '+pc+(away?'　回城才能買':''):'',qx+10,qy+31); } else c.fillText(it?'買 '+it.n+'　● '+pc:'裝備已滿',qx+10,qy+qh/2+1);
    const [ax2,ay2,aw2,ah2]=L.auto; c.fillStyle=mh.auto?'#5fd068':'rgba(10,10,24,.8)'; rr(c,ax2,ay2,aw2,ah2,10); c.fill(); c.fillStyle=mh.auto?'#0b2a10':'#fff'; c.font='900 11px '+TC; c.textAlign='center'; c.fillText(TOUCH?'自動':'自動買',ax2+aw2/2,ay2+ah2/2-(TOUCH?7:0)); if(TOUCH) c.fillText(mh.auto?'開':'關',ax2+aw2/2,ay2+ah2/2+8);
    { const [sx2,sy2,sw2,sh2]=L.shop; c.fillStyle=shopOpen?'#ffd23f':'rgba(10,10,24,.8)'; rr(c,sx2,sy2,sw2,sh2,10); c.fill(); c.strokeStyle='#ffd23f'; c.lineWidth=1.5; c.stroke(); c.fillStyle=shopOpen?'#14122b':'#ffd23f'; c.font='900 13px '+TC; c.textAlign='center'; c.fillText(canShop(mh)?(TOUCH?'商店（裝備・藥水・眼）':'商店 (P)'):(TOUCH?'商店（回城才能開）':'回城才能開'),sx2+sw2/2,sy2+sh2/2+1); }
    if(!TOUCH){ /* ===== 電腦版：英雄聯盟式的下方技能列 ===== */
      const P=deskPanel(),x0=P.x0,y0=P.y0; c.fillStyle='rgba(12,14,26,.88)'; rr(c,x0,y0,532,86,14); c.fill(); c.strokeStyle='rgba(200,170,90,.7)'; c.lineWidth=2; c.stroke();
      portrait(c,x0+46,y0+40,64,mh.def); c.fillStyle='#14122b'; c.beginPath(); c.arc(x0+76,y0+70,11,0,TAU); c.fill(); c.strokeStyle='#ffd23f'; c.lineWidth=1.5; c.stroke(); c.fillStyle='#ffd23f'; c.font='900 11px '+TC; c.textAlign='center'; c.fillText(mh.lvl,x0+76,y0+70.5);
      for(const b of P.boxes){ if(b.k.slice(0,2)==='it') continue; if(b.k.slice(0,2)==='lv'){ const pul=.9+.1*Math.sin(t*6); c.fillStyle='#ffd23f'; rr(c,b.x+b.w*(1-pul)/2,b.y,b.w*pul,b.h,6); c.fill(); c.fillStyle='#14122b'; c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('＋',b.x+b.w/2,b.y+b.h/2+1); continue; } if(b.k==='rc'){ c.fillStyle='rgba(42,106,138,.9)'; rr(c,b.x,b.y,b.w,b.h,6); c.fill(); c.fillStyle='#fff'; c.font='900 11px '+TC; c.textAlign='center'; c.fillText('回城 (B)',b.x+b.w/2,b.y+b.h/2+1); continue; }
        if(b.k==='d'||b.k==='f'){ const j=b.k==='d'?0:1,sp=SPL[mh.sp[j]]; skIcon(b.x,b.y,b.w,b.h,sp.n,shadeHex(sp.col,.55),mh.spCd[j],sp.cd,false,b.key); continue; }
        const i=+b.k[1],sk=mh.def.sk[i]; skIcon(b.x,b.y,b.w,b.h,sk.n,i===3?'#5a2a8a':'#2a4a7a',mh.cd[i],sk.cd,!unlocked(mh,i)?(i===3&&mh.lvl<6?'6等':'未學'):mh.mp<skCost(mh,i)?'沒魔':false,b.key); for(let r2=0;r2<SKMAX[i];r2++){ c.fillStyle=r2<mh.sk[i]?'#ffe066':'rgba(255,255,255,.18)'; c.fillRect(b.x+4+r2*(b.w-8)/SKMAX[i],b.y+2,(b.w-8)/SKMAX[i]-2,3); } c.fillStyle='#8ab8ff'; c.font='700 8px '+TC; c.textAlign='right'; c.fillText(skCost(mh,i),b.x+b.w-3,b.y+b.h-5); }
      bar(x0+96,y0+57,296,11,mh.hp/mh.max,'#4fd068'); bar(x0+96,y0+71,296,6,mh.mp/mh.mpMax,'#3d8bff'); c.fillStyle='#d8e8ff'; c.font='700 7px '+TC; c.textAlign='center'; c.fillText(Math.round(mh.mp)+' / '+Math.round(mh.mpMax),x0+244,y0+74.5); if(mh.shield>0){ c.fillStyle='rgba(235,240,255,.85)'; c.fillRect(x0+96,y0+60,296*clamp(mh.shield/mh.max,0,1),3); } c.fillStyle='#fff'; c.font='700 9px '+TC; c.textAlign='center'; c.fillText(Math.round(mh.hp)+' / '+Math.round(mh.max),x0+244,y0+63); bar(x0+96,y0+80,296,3,mh.lvl>=MAXL?1:mh.xp/XPN(mh.lvl),'#ffd23f');
      for(let i=0;i<7;i++){ const b=P.boxes.find(q=>q.k==='it'+i); slotIcon(mh,i,b.x,b.y,b.w,b.h,String(i+1)); }
      if(hover&&hover.team!==myTeam){ const p=G3.toScreen(hover.x,.05,hover.z); if(p[2]){ c.strokeStyle='rgba(255,70,70,.9)'; c.lineWidth=2.5; c.beginPath(); c.ellipse(p[0],p[1],hover.k==='h'?30:hover.k==='t'||hover.k==='c'?44:20,hover.k==='h'?13:hover.k==='t'||hover.k==='c'?20:9,0,0,TAU); c.stroke(); } }
    } else { /* ===== 手機：傳說對決式的按鈕 ===== */
      c.fillStyle='rgba(10,10,24,.75)'; rr(c,10,146,206,54,12); c.fill(); portrait(c,36,173,44,mh.def); c.fillStyle='#fff'; c.font='900 13px '+TC; c.textAlign='left'; c.fillText(mh.def.n+'  Lv '+mh.lvl,62,160); bar(62,168,146,8,mh.hp/mh.max,'#4fd068'); bar(62,179,146,5,mh.mp/mh.mpMax,'#3d8bff'); bar(62,188,146,3,mh.lvl>=MAXL?1:mh.xp/XPN(mh.lvl),'#ffd23f');
      for(let i=0;i<7;i++) slotIcon(mh,i,10+i*34,206,31,24,null);
      for(const b of BTN()){ if(b.k.slice(0,2)==='lv') continue; let lab='',col='#2b2759',cdv=0,cdm=1,dis=false;
        if(b.k==='atk'){ lab='攻擊'; col='#c8342a'; } else if(b.k==='min'){ lab='兵'; col='#5a6a3a'; } else if(b.k==='tw'){ lab='塔'; col='#6a5a3a'; } else if(b.k==='rc'){ lab='回城'; col='#2a6a8a'; }
        else if(b.k==='d'||b.k==='f'){ const j=b.k==='d'?0:1,sp=SPL[mh.sp[j]]; lab=sp.n; col=shadeHex(sp.col,.55); cdv=mh.spCd[j]; cdm=sp.cd; }
        else if(b.k==='pot'){ lab='藥水'+(mh.pots?mh.pots:''); col=mh.pots?'#a8323a':'#3a3a4a'; cdv=mh.potT>0?mh.potT:0; cdm=12; }
        else if(b.k==='tku'){ const TK=TRINK[mh.tk]; lab=TK.n; col=shadeHex(TK.col,.42); cdv=mh.tcd; cdm=TK.cd; }
        else if(b.k==='act'){ const id=mh.items.find(q=>ITEMS[q]&&ITEMS[q].act),it=ITEMS[id]; lab=it.n.slice(0,2); col=shadeHex(it.col,.5); cdv=mh.icd[id]||0; cdm=it.act.cd; }
        else { const i=+b.k[1],sk=mh.def.sk[i]; lab=sk.n; col=i===3?'#5a2a8a':'#2a4a7a'; cdv=mh.cd[i]; cdm=sk.cd; dis=!unlocked(mh,i)?(i===3&&mh.lvl<6?'6等':'未學'):mh.mp<skCost(mh,i)?'沒魔':false; }
        c.globalAlpha=mh.dead?.4:1; skIcon(b.x,b.y,b.r,b.r,lab,col,cdv,cdm,dis,null,true); c.globalAlpha=1; }
      for(const b of BTN()){ if(b.k.slice(0,2)!=='lv') continue; const pul=.85+.15*Math.sin(t*6); c.fillStyle='#ffd23f'; c.beginPath(); c.arc(b.x,b.y,b.r*pul,0,TAU); c.fill(); c.strokeStyle='#14122b'; c.lineWidth=2; c.stroke(); c.fillStyle='#14122b'; c.font='900 16px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('＋',b.x,b.y+1); }
      SKK.forEach((k,i)=>{ const b=BTN().find(q=>q.k===k); if(!b||!mh.sk[i]) return; c.fillStyle='#ffe066'; for(let r2=0;r2<mh.sk[i];r2++){ const a=PI*.62+r2*.22; c.beginPath(); c.arc(b.x+Math.cos(a)*(b.r+4),b.y+Math.sin(a)*(b.r+4),2.2,0,TAU); c.fill(); } });
      // 拖曳瞄準：從英雄拉一條線到瞄準點
      if(aimSk&&Math.hypot(aimSk.dx,aimSk.dy)>=14){ const a=aimAct(aimSk),p0=G3.toScreen(mh.x,.1,mh.z),p1=G3.toScreen(a.x,.1,a.z); c.strokeStyle='rgba(120,220,255,.85)'; c.lineWidth=5; c.setLineDash([10,6]); c.beginPath(); c.moveTo(p0[0],p0[1]); c.lineTo(p1[0],p1[1]); c.stroke(); c.setLineDash([]); c.fillStyle='rgba(120,220,255,.35)'; c.beginPath(); c.ellipse(p1[0],p1[1],22,11,0,0,TAU); c.fill(); c.strokeStyle='#9ae8ff'; c.lineWidth=2; c.stroke();
        c.fillStyle='rgba(255,255,255,.25)'; c.beginPath(); c.arc(aimSk.x0+clamp(aimSk.dx,-80,80),aimSk.y0+clamp(aimSk.dy,-80,80),18,0,TAU); c.fill(); }
      const jx=J.on?J.cx:120,jy=J.on?J.cy:H-115; c.globalAlpha=J.on?.8:.45; c.fillStyle='rgba(255,255,255,.18)'; c.beginPath(); c.arc(jx,jy,56,0,TAU); c.fill(); c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=2; c.stroke(); c.fillStyle='rgba(255,255,255,.75)'; c.beginPath(); c.arc(jx+J.x*46,jy+J.y*46,24,0,TAU); c.fill(); c.globalAlpha=1; }
    if(mh.dead){ c.fillStyle='rgba(30,30,40,.45)'; c.fillRect(0,0,W,H); c.fillStyle='#fff'; c.font='900 28px '+TC; c.textAlign='center'; c.fillText('陣亡　'+Math.ceil(mh.rsp)+' 秒後復活',W/2,H*.42); }
    if(skPts(mh)>0&&!mh.dead){ c.font='900 13px '+TC; c.textAlign='center'; const s3='還有 '+skPts(mh)+' 個技能點：'+(TOUCH?'點技能上的 ＋ 學技能或升級':'點技能上的 ＋（或 Ctrl＋Q／W／E／R）學技能、升級'),w3=c.measureText(s3).width+26,y3=TOUCH?H-78:H-168; c.fillStyle='rgba(10,10,24,.8)'; rr(c,W/2-w3/2-(TOUCH?60:0),y3-13,w3,26,13); c.fill(); c.fillStyle='#ffd23f'; c.fillText(s3,W/2-(TOUCH?60:0),y3+1); }
    if(Tm<8&&!skPts(mh)){ c.font='900 14px '+TC; c.textAlign='center'; c.fillStyle='rgba(10,10,24,.75)'; const s2=TOUCH?'左邊搖桿移動；技能點一下自動瞄準，按住拖曳可以自己瞄':'點地面移動、點敵人攻擊；Q W E R 技能往滑鼠方向放，D F 召喚師技能'; const w=c.measureText(s2).width+30; rr(c,W/2-w/2,TOUCH?H*.62:H-182,w,30,14); c.fill(); c.fillStyle='#ffe066'; c.fillText(s2,W/2,(TOUCH?H*.62:H-182)+16); } }
  function drawMini(){ const mm=mode===0?{w:TOUCH?130:150,h:TOUCH?130:150}:{w:230,h:56},x0=TOUCH?10:W-mm.w-10,y0=TOUCH?10:H-mm.h-10,B=map.B+4,sx=mm.w/(B*2),sz=mode===0?mm.h/(B*2):mm.h/((map.cliff+3)*2),P=(x,z)=>{ let X=x,Z=z; if(flip){ X=-x; Z=-z; } return [x0+mm.w/2+X*sx,y0+mm.h/2+Z*sz]; };
    c.fillStyle='rgba(20,40,20,.85)'; rr(c,x0,y0,mm.w,mm.h,10); c.fill(); c.strokeStyle='rgba(200,170,90,.6)'; c.lineWidth=1.5; c.stroke();
    c.save(); rr(c,x0,y0,mm.w,mm.h,10); c.clip(); if(map.river){ c.strokeStyle='rgba(80,160,200,.7)'; c.lineWidth=4; c.beginPath(); const a=P(-66,-66),b=P(66,66); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]); c.stroke(); }
    c.strokeStyle='rgba(220,200,150,.8)'; c.lineWidth=3; for(const L of map.lanes){ c.beginPath(); L.pts.forEach((p,i)=>{ const q=P(p[0],p[1]); i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]); }); c.stroke(); }
    for(const m of mons){ if(m.dead||m.vh) continue; const q=P(m.x,m.z); c.fillStyle=m.big?'#ffb040':'#d8c080'; c.beginPath(); c.arc(q[0],q[1],m.big?3.5:2,0,TAU); c.fill(); }
    for(const s2 of towers.concat(cores)){ if(s2.hp<=0) continue; const q=P(s2.x,s2.z); c.fillStyle=s2.team===myTeam?'#3d8bff':'#ff4a4a'; c.fillRect(q[0]-(s2.k==='c'?4:2.5),q[1]-(s2.k==='c'?4:2.5),s2.k==='c'?8:5,s2.k==='c'?8:5); }
    for(const m of minions){ if(m.dead||m.vh) continue; const q=P(m.x,m.z); c.fillStyle=m.team===myTeam?'#9ac8ff':'#ffa0a0'; c.fillRect(q[0]-1,q[1]-1,2,2); }
    for(const w of wards){ if(w.team!==myTeam&&!VIS[myTeam].has(w.id)) continue; const q=P(w.x,w.z); c.fillStyle=w.team===myTeam?'#5fff7a':'#ff5a5a'; c.beginPath(); c.moveTo(q[0],q[1]-3.5); c.lineTo(q[0]+3,q[1]+2.5); c.lineTo(q[0]-3,q[1]+2.5); c.fill(); }
    for(const h of heroes){ if(h.dead||h.vh) continue; const q=P(h.x,h.z); c.fillStyle=h.me?'#ffe066':h.team===myTeam?'#3d8bff':'#ff4a4a'; c.beginPath(); c.arc(q[0],q[1],h.me?4.5:3.5,0,TAU); c.fill(); c.strokeStyle='#fff'; c.lineWidth=1; c.stroke(); }
    c.restore(); }
  let hoverPk=null;
  function drawPick(){ if(!TOUCH&&mouse.in) hoverPk=[mouse.x,mouse.y]; const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#1a1440'); g.addColorStop(1,'#0a0a1c'); c.fillStyle=g; c.fillRect(0,0,W,H);
    c.textAlign='left'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 22px '+TC; c.fillText('選擇英雄',22,28); c.fillStyle='#cfc8ff'; c.font='700 13px '+TC; c.fillText(MODES[mode]+'　'+size+' 對 '+size+'　電腦：'+LV.n+'　剩 '+Math.max(0,Math.ceil(pickT))+' 秒',130,29);
    TABS.forEach((tb,i)=>{ const x=20+i*84,on=i===pkTab; c.fillStyle=on?'#ffd23f':'rgba(255,255,255,.08)'; rr(c,x,52,78,28,14); c.fill(); c.fillStyle=on?'#14122b':'#fff'; c.font='900 13px '+TC; c.textAlign='center'; c.fillText(tb[1],x+39,67); });
    pkList().forEach((h,i)=>{ const x=24+(i%6)*100,y=92+Math.floor(i/6)*82,on=h.i===pkSel,taken=takenBy(myTeam,h.i,mySlot); c.fillStyle=on?'rgba(255,210,63,.25)':'rgba(255,255,255,.06)'; rr(c,x,y,94,76,10); c.fill(); if(on){ c.strokeStyle='#ffd23f'; c.lineWidth=2.5; c.stroke(); }
      portrait(c,x+47,y+30,46,h); c.fillStyle=taken?'#7a7690':'#fff'; c.font='900 12px '+TC; c.textAlign='center'; c.fillText(h.n,x+47,y+62); c.fillStyle=CLS[h.cls].col; c.font='700 9px '+TC; c.fillText(CLS[h.cls].n,x+47,y+72); if(taken){ c.fillStyle='rgba(0,0,0,.5)'; rr(c,x,y,94,76,10); c.fill(); c.fillStyle='#fff'; c.fillText('隊友已選',x+47,y+38); } });
    const d=HEROES[pkSel],x0=632; c.fillStyle='rgba(255,255,255,.06)'; rr(c,x0,46,316,486,14); c.fill(); portrait(c,x0+52,96,80,d); c.textAlign='left'; c.fillStyle='#fff'; c.font='900 22px '+TC; c.fillText(d.n,x0+102,82); c.fillStyle=CLS[d.cls].col; c.font='900 14px '+TC; c.fillText(CLS[d.cls].n,x0+102,108);
    d.sk.forEach((s,i)=>{ const y=156+i*42; c.fillStyle=i===3?'#c8a0ff':'#9ad8ff'; c.font='900 12px '+TC; c.fillText((TOUCH?['技能一','技能二','技能三','大招'][i]:'QWER'[i])+'：'+s.n+(i===3?'（6 等起可學，最多 3 點）':'（最多 5 點）'),x0+12,y); c.fillStyle='#cfc8ff'; c.font='700 10px '+TC; c.fillText(skDesc2(s)+'（冷卻 '+s.cd+' 秒、魔力 '+SKC[i]+'）',x0+12,y+17); });
    if(mode===0){ c.fillStyle='#ffd23f'; c.font='900 12px '+TC; c.fillText('路線',x0+8,320); ROLES.forEach(([id,n],i)=>{ const bx=640+(i%3)*102,by=330+Math.floor(i/3)*32,on=slots[mySlot].role===id; c.fillStyle=on?'#ffd23f':'rgba(255,255,255,.1)'; rr(c,bx,by,96,28,12); c.fill(); c.fillStyle=on?'#14122b':'#fff'; c.font='900 12px '+TC; c.textAlign='center'; c.fillText(n+(id==='jg'?'（打野刀）':''),bx+48,by+15); c.textAlign='left'; }); }
    { const sp=slots[mySlot].sp; [0,1].forEach(row=>{ c.fillStyle='#ffd23f'; c.font='900 12px '+TC; c.textAlign='left'; c.fillText(TOUCH?(row?'技能 2':'技能 1'):(row?'F 鍵':'D 鍵'),x0+6,412+row*32); const by0=398+row*32; c.save(); c.beginPath(); c.rect(SPX0,by0-2,SPX1-SPX0,32); c.clip(); SP_IDS.forEach((id,j)=>{ const bx=SPX0+j*45-spOff,by=398+row*32,on=sp[row]===id,S0=M0.SPELLS[id]; c.fillStyle=on?S0.col:'rgba(255,255,255,.1)'; rr(c,bx,by,42,28,10); c.fill(); c.fillStyle=on?'#14122b':'#fff'; c.font='900 11px '+TC; c.textAlign='center'; c.fillText(S0.n,bx+21,by+15); }); c.restore();
        // 左右還有技能時，邊緣顯示箭頭（可左右滑動）
        for(const [side,show] of [[-1,spOff>1],[1,spOff<spMax()-1]]){ if(!show) continue; const ex=side<0?SPX0:SPX1,gr=c.createLinearGradient(ex,0,ex-side*22,0); gr.addColorStop(0,'rgba(26,20,64,.95)'); gr.addColorStop(1,'rgba(26,20,64,0)'); c.fillStyle=gr; c.fillRect(Math.min(ex,ex-side*22),by0-2,22,32); c.fillStyle='#ffd23f'; c.font='900 16px '+TC; c.textAlign='center'; c.fillText(side<0?'‹':'›',ex-side*7,by0+14); } });
      const hv=SP_IDS.find((id,j)=>[0,1].some(row=>hoverPk&&hoverPk[0]>=SPX0&&hoverPk[0]<=SPX1&&hoverPk[0]>=SPX0+j*45-spOff&&hoverPk[0]<SPX0+42+j*45-spOff&&hoverPk[1]>=398+row*32&&hoverPk[1]<426+row*32)); c.textAlign='left'; c.fillStyle='#cfc8ff'; c.font='700 10px '+TC; c.fillText('召喚師技能：'+(hv?M0.SPELLS[hv].n+'－'+M0.SPELLS[hv].d:sp.map(q=>M0.SPELLS[q].n).join('＋')+'　（技能列可左右滑動）'),x0+8,464); }
    c.fillStyle=pkDone?'#5a5a7a':'#ffd23f'; rr(c,700,470,240,44,14); c.fill(); c.fillStyle='#14122b'; c.font='900 18px '+TC; c.textAlign='center'; c.fillText(pkDone?'等待其他玩家…':'確定（Enter）',820,493);
    // 隊友
    c.textAlign='left';
    const tm=slots.filter(s=>s.team===myTeam); c.fillStyle='#cfc8ff'; c.font='700 11px '+TC; c.fillText('隊友：'+tm.filter(s=>s!==slots[mySlot]).map(s=>(ROLE_N[s.role]||'')+' '+(s.human>=0?s.name:'電腦')+(s.hero>=0&&s.ok?'（'+HEROES[s.hero].n+'）':'')).join('、'),24,520,600);
    if(!pkDone){ const K=env; if(K.hit('ArrowRight')) pkSel=(pkSel+1)%30; if(K.hit('ArrowLeft')) pkSel=(pkSel+29)%30; if(K.hit('ArrowDown')) pkSel=(pkSel+6)%30; if(K.hit('ArrowUp')) pkSel=(pkSel+24)%30; if(K.hit('Enter')||K.hit('Space')) confirmPick(); }
    drawFeed(); }
  const ROLE_N={top:'上路',jg:'打野',mid:'中路',bot:'下路',sup:'輔助'};
  function skDesc2(s){ const SK_TXT={dash:'往敵人衝過去',blink:'瞬間移動',strike:'重擊眼前的敵人',nova:'傷害身邊的敵人',blast:'在敵人位置引爆',shot:'射出飛彈',pierce:'直線貫穿敵人',shield:'得到護盾',heal:'治療',buff:'強化自己',exec:'斬殺殘血敵人',pull:'把敵人拉過來',storm:'持續傷害一片區域'};
    let t2=SK_TXT[s.t]; if(s.t==='heal') t2=s.self?'治療自己':'治療自己和隊友'; if(s.t==='shield'&&s.ally) t2='自己和隊友得到護盾'; if(s.t==='buff'&&s.ally) t2='強化自己和隊友'; if(s.back) t2='往後翻滾閃開'; const ex=[]; if(s.st) ex.push('暈眩'); if(s.sl) ex.push('緩速'); return t2+(ex.length?'＋'+ex.join('、'):''); }
  function shadeHex(h,k){ const n=parseInt(String(h).slice(1),16); if(isNaN(n)) return h; const f=v=>clamp(Math.round(k>1?v+(255-v)*(k-1):v*k),0,255); return 'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')'; }
  // 開始畫面左邊預覽：跳過選英雄，全部電腦直接開打
  const PV=!!(opts.preview||env.preview); if(PV){ botPicks(); startPlay(); heroes.forEach(h=>{ h.bot=true; botLv(h); }); for(let k=0;k<20*62;k++) sim(.05); EV=[]; feed.length=0; anns.length=0; const fh=heroes.find(h=>h.team===myTeam&&!h.dead&&!(h.recall>0))||heroes[mySlot]; camX=fh.x; camZ=fh.z; }
  return {update,draw,destroy(){ canvas.removeEventListener('contextmenu',noMenu); canvas.removeEventListener('pointerleave',leave); canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('wheel',onWheel); canvas.removeEventListener('pointermove',onMove); removeEventListener('pointerup',onUp); removeEventListener('pointercancel',onUp); G3.destroy(); },
    _dbg:{G3,castSpell,anns,VIS,wards,useItem,buyItem,applyAct:(h,a)=>applyInput(h,.05,{acts:[a]},true),clearEv(){ EV=[]; feed.length=0; floats.length=0; },get heroes(){return heroes;},get minions(){return minions;},towers,cores,mons,slots,get phase(){return phase;},get T(){return Tm;},confirmPick,botPicks,map,stats,sim,cast,get winner(){return winner;},setPick(i){ pkSel=i; },kills}}; }
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
  name:'星界裂谷',tag:'STAR RIFT',color:'#7a5cff',online:true,maxPlayers:10,netVariants:false,wide:true,
  desc:'5 對 5 推塔對戰！30 位原創英雄（坦克、戰士、刺客、法師、射手、輔助），每位 Q W E R 四招，再挑兩個召喚師技能（閃現、治癒、重擊、鬼步…）。上中下三路、兩塊野區和打野刀，也有一條路的單路激戰。電腦版滑鼠點擊操作，手機版搖桿加技能鍵。連線最多 10 人，不夠的位置由電腦補。',
  goal:'跟著小兵推掉對方的防禦塔，最後打掉對方主堡就贏。打小兵、野怪、敵人拿金幣買裝備；等級 2、3 學會第二、三招，等級 5 學會大招。',
  ownP:true,stages:MODES,stageLabel:'選擇模式',previewWarm:.3,stageShow:(ctx,w,h,si,t)=>art(ctx,w,h,si,t),
  stageGoal:si=>si?'單路激戰：只有一條路，沒有野區，雙方各兩座塔和主堡，一路打到底。':'三路峽谷：上中下三條路各有兩座塔，中路和上路、中路和下路之間各有一塊野區（1 隻大野怪＋3 隻小野怪）。選「打野」路線會先買打野刀，記得帶召喚師技能「重擊」。',
  modes:[{id:'1p',label:'單人'}],
  options:[{key:'size',label:'對戰人數',def:'5',opts:[1,2,3,4,5].map(n=>({id:String(n),label:n+' 對 '+n}))},{key:'lv',label:'電腦強度',def:'mid',opts:[{id:'easy',label:'簡單'},{id:'mid',label:'中等'},{id:'hard',label:'困難'}]}],
  optNote:()=>'連線時真人輪流分到兩隊，不夠的位置由電腦補上。',
  help:[['滑鼠點地面','走過去（左鍵、右鍵都可以，按住會一直跟著走）'],['點敵人','追過去攻擊（英雄、小兵、野怪、塔）'],['Q W E R','四個技能，往滑鼠的方向或位置放'],['D F','兩個召喚師技能（B 回城、S 停下）'],['P','開商店（要回城、在泉水裡才能買）：買裝備、藥水，選綠眼或紅眼'],['魔力','放技能要用魔力（藍色條），沒魔力就不能放；平常慢慢回，回到泉水回最快'],['升級','打小兵、野怪、擊殺英雄拿經驗，最高 18 等；每升一等多一個技能點，點技能上的 ＋（或 Ctrl＋Q/W/E/R）學技能。一般技能最多 5 點，大招 6／11／16 等各能點一次'],['單路激戰','不能回城，陣亡後才會補滿生命和魔力'],['1～6','使用裝備的主動技能、喝藥水'],['7','用眼：綠眼插在滑鼠的位置；紅眼掃描敵人的眼，看到後點三下清掉'],['草叢','躲進草叢，外面的敵人看不到你（除非有眼）']],
  touchHelp:[['左邊搖桿','移動'],['攻擊／兵／塔','按住自動攻擊；「兵」只打小兵野怪、「塔」只打防禦塔'],['技能','點一下自動瞄準，按住拖曳可以自己瞄準'],['召喚師技能','右下兩顆（閃現可以拖曳選方向）；回城、買裝備'],['藥水／眼','下方的「藥水」補血；「綠眼」按住拖曳插眼，「紅眼」掃描敵人的眼，看到後點三下清掉'],['商店','回城後按左邊「商店」買裝備、選綠眼或紅眼；有主動技能的裝備會多一顆按鈕'],['魔力','放技能要用魔力（藍色條），沒魔力不能放；回泉水回最快'],['升級','最高 18 等；每升一等點技能上的 ＋ 學技能。一般技能最多 5 點，大招 6 等才能學、最多 3 點'],['單路激戰','不能回城，陣亡後才會補滿生命和魔力'],['草叢','躲進草叢，外面的敵人看不到你']],
  touch:{left:[],right:[]},
  best:{label:'勝場',fmt:v=>v+' 勝',lower:false},
  ready:()=>!!window.THREE,load:()=>{ const K=window.ARCADE_GAMES.kart; return K&&K.load?K.load().catch(()=>{}):Promise.resolve(); },
  thumb:(ctx,w,h,t)=>art(ctx,w,h,0,t),create};
})();
