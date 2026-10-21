// 萌獸戰棋：8 人自走棋。商店買萌獸、三隻一樣的合成升星、湊羈絆、合成裝備，自動對戰扣血，活到最後拿第一。
// 角色都是原創的 Q 版萌獸；另外可以在「我的造型」上傳照片（人或動物）、取名字、選羈絆，做出自己專屬的萌獸。
// 單機：你和 7 位電腦。連線：房主負責配對、算所有對戰的勝負和扣血；每個人自己管商店和棋盤，戰鬥用同一個種子重播，大家看到的結果一樣。
(function(){
'use strict';
const W=960,H=600,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,u)=>a+(b-a)*u;
function mul(seed){ let a=seed>>>0||1; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function rr(c,x,y,w,h,r){ r=Math.min(r,w/2,h/2); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }

/* ---------- 羈絆 ---------- */
const TRAITS={
  forest:{n:'森林',col:'#5fd068',lv:[2,4],d:['每秒回復 2% 最大生命','每秒回復 4% 最大生命']},
  mech:{n:'機械',col:'#9aa8c0',lv:[2,4],d:['開戰獲得 150 護盾','開戰獲得 350 護盾']},
  ocean:{n:'海洋',col:'#3ddbd9',lv:[2,4],d:['每次攻擊多回 5 魔力','每次攻擊多回 12 魔力']},
  volcano:{n:'火山',col:'#ff7a3d',lv:[2,4],d:['造成的傷害 +15%','造成的傷害 +35%']},
  star:{n:'星空',col:'#b98cff',lv:[2,4],d:['技能傷害 +25%','技能傷害 +55%']},
  sweet:{n:'甜點',col:'#ff9ec8',lv:[2,4],d:['打贏時多拿 1 金幣','打贏時多拿 3 金幣']},
  warrior:{n:'戰士',col:'#e8b04a',lv:[2,4],d:['攻擊力 +15','攻擊力 +35']},
  guardian:{n:'坦克',col:'#7aa8ff',lv:[2,4],d:['全隊護甲 +20','全隊護甲 +50']},
  ranger:{n:'射手',col:'#86dc4f',lv:[2,4],d:['攻擊速度 +25%','攻擊速度 +60%']},
  mage:{n:'法師',col:'#c56bff',lv:[2,4],d:['法術強度 +30','法術強度 +70']},
  assassin:{n:'刺客',col:'#ff5d8f',lv:[2,3],d:['開戰跳到敵方後排，暴擊率 +15%','開戰跳到敵方後排，暴擊率 +35%']},
  healer:{n:'治療',col:'#ffe066',lv:[1,2],d:['治療、護盾效果 +30%','治療、護盾效果 +70%']}
};
const ORIGINS=['forest','mech','ocean','volcano','star','sweet'],CLASSES=['warrior','guardian','ranger','mage','assassin','healer'];
const BASE={warrior:{hp:650,atk:55,as:.7,rng:1,arm:35,mana:70},guardian:{hp:760,atk:44,as:.6,rng:1,arm:50,mana:80},ranger:{hp:500,atk:56,as:.75,rng:4,arm:20,mana:70},
  mage:{hp:480,atk:40,as:.65,rng:3,arm:20,mana:60},assassin:{hp:520,atk:60,as:.8,rng:1,arm:25,mana:60},healer:{hp:520,atk:38,as:.65,rng:3,arm:25,mana:70}};
const CLASS_SKILL={warrior:{t:'strike',m:2.2},guardian:{t:'slam',v:110,stun:1.2},ranger:{t:'multi',n:3},mage:{t:'nova',v:220},assassin:{t:'blink',v:260},healer:{t:'healAll',v:110}};
/* ---------- 萌獸（全部原創） ---------- */
const U=(id,n,cost,o,k,sk,look,extra)=>Object.assign({id,n,cost,tr:[o,k].concat(extra||[]),k,sk,look},BASE[k]);
const UNITS=[
  U('sprout','嫩芽兔',1,'forest','warrior',{t:'strike',m:2},{body:'#b8e986',ear:'rabbit',acc:'sprout'}),
  U('canbear','鐵罐熊',1,'mech','guardian',{t:'shield',v:260},{body:'#b8c4d4',ear:'bear',acc:'bolt'}),
  U('bubble','泡泡魚',1,'ocean','mage',{t:'bolt',v:190},{body:'#7fd6ff',ear:'fin',acc:'bubble'}),
  U('lavarat','熔岩鼠',1,'volcano','assassin',{t:'strike',m:2.3},{body:'#ff8a5c',ear:'mouse',acc:'flame'}),
  U('starcat','星星貓',1,'star','ranger',{t:'multi',n:3},{body:'#c8b0ff',ear:'cat',acc:'star'}),
  U('marsh','棉花糖羊',1,'sweet','healer',{t:'heal',v:170},{body:'#fff0f6',ear:'sheep',acc:'cloud'}),
  U('shroom','蘑菇龜',2,'forest','guardian',{t:'slam',v:120,stun:1.2},{body:'#a8d870',ear:'none',acc:'mushroom'}),
  U('gearfox','齒輪狐',2,'mech','ranger',{t:'pierce',v:230},{body:'#d8b080',ear:'fox',acc:'gear'}),
  U('coral','珊瑚海馬',2,'ocean','healer',{t:'healAll',v:90},{body:'#ff9eb8',ear:'fin',acc:'coral'}),
  U('spark','火花犬',2,'volcano','warrior',{t:'spin',v:170},{body:'#ffb04a',ear:'dog',acc:'flame'}),
  U('meteor','流星蛙',2,'star','assassin',{t:'blink',v:290},{body:'#7ad8a0',ear:'frog',acc:'star'}),
  U('choco','巧克力熊',3,'sweet','guardian',{t:'shieldAll',v:210},{body:'#8a5a3a',ear:'bear',acc:'choco'}),
  U('whale','鯨魚歌姬',3,'ocean','mage',{t:'nova',v:270},{body:'#5a8adf',ear:'fin',acc:'note'}),
  U('mechbee','機甲蜂',3,'mech','assassin',{t:'blink',v:330},{body:'#ffd23f',ear:'antenna',acc:'stripe'}),
  U('acorn','橡果松鼠',3,'forest','ranger',{t:'rage',v:.8},{body:'#c8844a',ear:'squirrel',acc:'acorn'}),
  U('cupcat','杯子蛋糕貓',3,'sweet','ranger',{t:'stun',v:240,stun:1.5},{body:'#ffc0d8',ear:'cat',acc:'cupcake'}),
  U('dragon','火山龍寶',4,'volcano','mage',{t:'meteor',v:400},{body:'#ff6a4a',ear:'horn',acc:'wing'}),
  U('owl','月光貓頭鷹',4,'star','healer',{t:'healAll',v:200,mana:25},{body:'#8a8ad8',ear:'owl',acc:'moon'}),
  U('pudding','布丁企鵝',4,'sweet','warrior',{t:'slam',v:220,stun:1.5},{body:'#ffe07a',ear:'none',acc:'pudding'}),
  U('panda','古樹熊貓',4,'forest','warrior',{t:'strike',m:3.2},{body:'#f4f4f4',ear:'panda',acc:'leaf'}),
  U('phoenix','星河鳳凰',5,'star','mage',{t:'meteor',v:560},{body:'#ff7ab8',ear:'crest',acc:'wing'},['volcano']),
  U('mechwhale','深海機甲鯨',5,'ocean','guardian',{t:'shieldAll',v:380,stunAll:1.5},{body:'#3a5a9a',ear:'fin',acc:'gear'},['mech'])
];
const SKILL_TXT={strike:s=>'重擊目標，造成 '+Math.round(s.m*100)+'% 攻擊力的傷害',shield:s=>'給自己 '+s.v+' 點護盾',bolt:s=>'對目標射出水彈，造成 '+s.v+' 魔法傷害',
  multi:s=>'連續攻擊 '+s.n+' 次',heal:s=>'治療血最少的隊友 '+s.v,slam:s=>'震地，對身邊敵人造成 '+s.v+' 傷害並暈眩 '+s.stun+' 秒',pierce:s=>'射穿目標和後面的敵人，造成 '+s.v+' 傷害',
  healAll:s=>'治療全隊 '+s.v+(s.mana?'，並給隊友 '+s.mana+' 魔力':''),spin:s=>'旋轉攻擊身邊所有敵人 '+s.v,blink:s=>'瞬移到最遠的敵人旁邊，造成 '+s.v+' 傷害',
  shieldAll:s=>'給附近隊友 '+s.v+' 護盾'+(s.stunAll?'，並暈眩附近敵人 '+s.stunAll+' 秒':''),nova:s=>'在目標周圍爆炸，造成 '+s.v+' 魔法傷害',rage:s=>'攻擊速度提升 '+Math.round(s.v*100)+'%（4 秒）',
  stun:s=>'造成 '+s.v+' 傷害並暈眩目標 '+s.stun+' 秒',meteor:s=>'召喚隕石砸向目標附近，造成 '+s.v+' 魔法傷害'};
/* ---------- 裝備 ---------- */
const COMP={sword:{n:'鐵劍',st:{atk:12}},bow:{n:'短弓',st:{as:.12}},rod:{n:'魔杖',st:{ap:12}},vest:{n:'鎖甲',st:{arm:20}},belt:{n:'腰帶',st:{hp:150}},tear:{n:'淚滴',st:{mana:15}}};
const COMP_IDS=Object.keys(COMP);
const COMBO={'sword+sword':{n:'巨劍',st:{atk:40,crit:.2}},'bow+sword':{n:'疾風刃',st:{atk:15,as:.3}},'rod+sword':{n:'吸血魔刃',st:{atk:15,ap:15},fx:{ls:.2}},'sword+vest':{n:'荊棘劍盾',st:{atk:12,arm:25},fx:{thorn:.25}},
  'belt+sword':{n:'狂戰斧',st:{atk:18,hp:250}},'sword+tear':{n:'魔劍',st:{atk:12,mana:15},fx:{critSk:1}},'bow+bow':{n:'連弩',st:{as:.65}},'bow+rod':{n:'雷擊杖',st:{as:.15,ap:20},fx:{zap:70}},
  'bow+vest':{n:'疾行甲',st:{as:.18,arm:25},fx:{cc:1}},'belt+bow':{n:'狂熱號角',st:{as:.2,hp:220}},'bow+tear':{n:'怒氣之弓',st:{as:.15,mana:15},fx:{mpa:6}},'rod+rod':{n:'大法帽',st:{ap:65}},
  'rod+vest':{n:'魔盾',st:{ap:15,arm:25},fx:{sh:250}},'belt+rod':{n:'生命法杖',st:{ap:20,hp:220},fx:{selfHeal:.25}},'rod+tear':{n:'智慧之冠',st:{ap:28,mana:20}},'vest+vest':{n:'堅鐵甲',st:{arm:75}},
  'belt+vest':{n:'坦克者之心',st:{arm:25,hp:320}},'tear+vest':{n:'冰霜盔',st:{arm:25,mana:15},fx:{slow:1}},'belt+belt':{n:'巨人腰帶',st:{hp:650}},'belt+tear':{n:'生命泉',st:{hp:220,mana:15},fx:{regen:.02}},
  'tear+tear':{n:'藍色寶珠',st:{mana:45},fx:{refund:15}}};
const comboKey=(a,b)=>[a,b].sort().join('+');
const itemName=id=>COMP[id]?COMP[id].n:COMBO[id]?COMBO[id].n:'?';
const itemSt=id=>COMP[id]?COMP[id].st:COMBO[id]?COMBO[id].st:{};
const FX_TXT={ls:'攻擊吸血 20%',thorn:'被打時反彈 25% 傷害',critSk:'技能可以暴擊',zap:'每 3 次攻擊放出 70 點閃電',cc:'不會被暈眩',mpa:'每次攻擊多回 6 魔力',sh:'開戰獲得 250 護盾',selfHeal:'放技能時回復 25% 已損失生命',slow:'攻擊者攻速 -25%',regen:'每秒回 2% 生命',refund:'放完技能回 15 魔力'};
function itemDesc(id){ const st=itemSt(id),L=[]; const N={atk:'攻擊',as:'攻速',ap:'法強',arm:'護甲',hp:'生命',mana:'起始魔力',crit:'暴擊'};
  for(const k in st) L.push(N[k]+' +'+(k==='as'||k==='crit'?Math.round(st[k]*100)+'%':st[k]));
  const fx=COMBO[id]&&COMBO[id].fx; if(fx) for(const k in fx) L.push(FX_TXT[k]); return L.join('、'); }

/* ---------- 經濟 ---------- */
const XPNEED=[0,2,2,6,10,20,36,56,80],ODDS=[[],[100,0,0,0,0],[100,0,0,0,0],[75,25,0,0,0],[55,30,15,0,0],[45,33,20,2,0],[25,40,30,5,0],[19,30,35,15,1],[16,20,35,25,4],[9,15,30,30,16]];
// 階段：第 1 階段是 1-1～1-3（都打野怪），之後每階段 7 回合，第 7 回合打野怪
const stageOf=r=>r<=3?[1,r]:[2+Math.floor((r-4)/7),(r-4)%7+1];
const roundLabel=r=>stageOf(r).join('-');
const isPve=r=>{ const [st,sub]=stageOf(r); return st===1||sub===7; };
// 輸了扣血：階段基礎傷害（第 1 階段不扣）＋對方還活著的萌獸一隻 1 點（最多算 10 隻，星數、費用都不影響）
const BASE_DMG=st=>st<=1?0:[0,0,2,5,8,10,12][st]||17;
const loseDmg=(r,surv)=>{ const st=stageOf(r)[0]; return st<=1?0:BASE_DMG(st)+Math.min(10,surv); };
// 野怪關卡
function creeps(r){ const st=stageOf(r)[0],k=r<=3?r:Math.min(6,2+st),lv=r<=3?0:st-1; const out=[];
  for(let i=0;i<k+1;i++) out.push({u:'creep',s:1,c:1+((i*2)%6),r:i<3?5:6,lv,big:i===0&&r>3});
  return out; }
const CREEP={id:'creep',n:'史萊姆',cost:1,tr:[],k:'warrior',sk:{t:'strike',m:1.5},look:{body:'#86dc4f',ear:'none',acc:'slime'},hp:380,atk:32,as:.6,rng:1,arm:10,mana:200};

/* ---------- 六角棋盤 ---------- */
const COLS=7,ROWS=8,HR=27,HW=HR*Math.sqrt(3),HH=HR*1.5,BX=480-HW*3.25,BY=52;
const hexXY=(c,r)=>[BX+c*HW+(r&1?HW/2:0),BY+r*HH];
function hexDist(c1,r1,c2,r2){ const q1=c1-(r1-(r1&1))/2,q2=c2-(r2-(r2&1))/2,x=q1-q2,z=r1-r2,y=-x-z; return (Math.abs(x)+Math.abs(y)+Math.abs(z))/2; }
function nbrs(c,r){ const d=r&1?[[1,0],[-1,0],[0,-1],[1,-1],[0,1],[1,1]]:[[1,0],[-1,0],[-1,-1],[0,-1],[-1,1],[0,1]]; return d.map(([dc,dr])=>[c+dc,r+dr]).filter(([a,b])=>a>=0&&a<COLS&&b>=0&&b<ROWS); }

/* ---------- 戰鬥（固定步長、同一個種子，誰來算結果都一樣） ---------- */
const STARM=[1,1,1.8,3.24],SKM=[1,1,1.6,2.6];
function traitCount(units,defOf){ const seen=new Set(),cnt={}; for(const u of units){ if(u.u==='creep'||seen.has(u.u)) continue; seen.add(u.u); for(const t of defOf(u.u).tr) cnt[t]=(cnt[t]||0)+1; } return cnt; }
const traitLv=(t,n)=>{ const L=TRAITS[t].lv; return n>=L[1]?2:n>=L[0]?1:0; };
function makeFighter(b,team,defOf,cnt,idx){
  const d=b.u==='creep'?CREEP:defOf(b.u),s=b.s,m=STARM[s];
  const f={idx,team,u:b.u,d,s,items:(b.it||[]).slice(),c:b.c,r:b.r,pc:b.c,pr:b.r,mv:1,
    max:d.hp*m,atk:d.atk*m,as:d.as,rng:d.rng,arm:d.arm,ap:0,mana:0,mmax:d.mana,crit:.1,shield:0,stun:0,cd:.3,fx:{},alive:true,dmgAmp:0,skAmp:0,healAmp:0,regen:0,mpa:0,hits:0,rageT:0,rage:0,slowT:0,anim:0,cast:0,hurt:0};
  if(b.u==='creep'){ const lv=b.lv||0; f.max*=1+lv*.9; f.atk*=1+lv*.6; if(b.big){ f.max*=1.6; f.atk*=1.3; } }
  for(const it of f.items){ const st=itemSt(it); for(const k in st){ if(k==='hp') f.max+=st[k]; else if(k==='as') f.as+=d.as*st[k]; else if(k==='mana') f.mana+=st[k]; else f[k]+=st[k]; }
    const fx=COMBO[it]&&COMBO[it].fx; if(fx) for(const k in fx) f.fx[k]=(f.fx[k]||0)+fx[k]; }
  // 羈絆
  const has=t=>d.tr.includes(t),L=t=>traitLv(t,cnt[t]||0);
  if(has('forest')&&L('forest')) f.regen+=[0,.02,.04][L('forest')];
  if(has('mech')&&L('mech')) f.shield+=[0,150,350][L('mech')];
  if(has('ocean')&&L('ocean')) f.mpa+=[0,5,12][L('ocean')];
  if(has('volcano')&&L('volcano')) f.dmgAmp+=[0,.15,.35][L('volcano')];
  if(has('star')&&L('star')) f.skAmp+=[0,.25,.55][L('star')];
  if(has('warrior')&&L('warrior')) f.atk+=[0,15,35][L('warrior')];
  if(L('guardian')) f.arm+=[0,20,50][L('guardian')];
  if(has('ranger')&&L('ranger')) f.as+=d.as*[0,.25,.6][L('ranger')];
  if(has('mage')&&L('mage')) f.ap+=[0,30,70][L('mage')];
  if(has('assassin')&&L('assassin')){ f.crit+=[0,.15,.35][L('assassin')]; f.jump=1; }
  if(has('healer')&&L('healer')) f.healAmp+=[0,.3,.7][L('healer')];
  f.mpa+=f.fx.mpa||0; f.regen+=f.fx.regen||0; if(f.fx.sh) f.shield+=f.fx.sh;
  f.hp=f.max; return f; }
// boardA 在下面（第 4～7 列），boardB 已經翻到上面（第 0～3 列）
function Battle(boardA,boardB,seed,defOf){
  const R=mul(seed),F=[],ca=traitCount(boardA,defOf),cb=traitCount(boardB,defOf);
  boardA.forEach(b=>F.push(makeFighter(b,0,defOf,ca,F.length))); boardB.forEach(b=>F.push(makeFighter(b,1,defOf,cb,F.length)));
  const occ=(c,r)=>F.find(f=>f.alive&&f.c===c&&f.r===r);
  // 刺客開戰跳到敵方後排
  for(const f of F) if(f.jump){ const back=f.team===0?[0,1]:[7,6]; let spot=null; for(const r of back){ for(let i=0;i<COLS;i++){ const c=(f.c+i)%COLS; if(!occ(c,r)){ spot=[c,r]; break; } } if(spot) break; } if(spot){ f.c=f.pc=spot[0]; f.r=f.pr=spot[1]; } }
  const B={F,t:0,over:null,fx:[],dt:.05};
  const foes=f=>F.filter(o=>o.alive&&o.team!==f.team),allies=f=>F.filter(o=>o.alive&&o.team===f.team);
  const dist=(a,b)=>hexDist(a.c,a.r,b.c,b.r);
  function nearest(f,list){ let best=null,bd=1e9; for(const o of list){ const d=dist(f,o)+o.idx*1e-3; if(d<bd){ bd=d; best=o; } } return best; }
  function hurt(src,o,dmg,magic,isSkill){ if(!o.alive) return 0;
    dmg*=1+(src?src.dmgAmp:0)+(isSkill&&src?src.skAmp:0);
    if(!magic) dmg*=100/(100+Math.max(0,o.arm)); else dmg*=100/(100+Math.max(0,o.arm*.5));
    dmg=Math.max(1,dmg); let left=dmg; if(o.shield>0){ const a=Math.min(o.shield,left); o.shield-=a; left-=a; }
    o.hp-=left; o.hurt=.15; o.mana=Math.min(o.mmax,o.mana+Math.min(15,dmg*.05));
    if(src&&src.fx.ls&&!isSkill) src.hp=Math.min(src.max,src.hp+dmg*src.fx.ls);
    if(o.fx.thorn&&src&&!isSkill) hurt(null,src,dmg*o.fx.thorn,true);
    B.fx.push({k:'num',x:o.c,y:o.r,v:Math.round(dmg),col:magic?'#c9a0ff':'#fff',t:0});
    if(o.hp<=0){ o.alive=false; B.fx.push({k:'poof',x:o.c,y:o.r,t:0}); } return dmg; }
  function heal(src,o,v){ if(!o.alive) return; v*=1+src.healAmp; o.hp=Math.min(o.max,o.hp+v); B.fx.push({k:'num',x:o.c,y:o.r,v:'+'+Math.round(v),col:'#86dc4f',t:0}); }
  function cast(f){ const s=f.d.sk,P=SKM[f.s]*(1+f.ap/100),T=f.tgt&&f.tgt.alive?f.tgt:nearest(f,foes(f)); f.cast=.4; B.fx.push({k:'cast',x:f.c,y:f.r,t:0,col:TRAITS[f.d.tr[0]]?TRAITS[f.d.tr[0]].col:'#fff'});
    const crit=f.fx.critSk&&R()<f.crit?1.5:1;
    if(s.t==='strike'&&T) hurt(f,T,f.atk*s.m*SKM[f.s]/STARM[f.s]*STARM[f.s]*crit,false,true);
    else if(s.t==='bolt'&&T){ hurt(f,T,s.v*P*crit,true,true); B.fx.push({k:'shot',a:f,b:T,t:0,col:'#7fd6ff',big:1}); }
    else if(s.t==='multi'&&T){ for(let i=0;i<s.n;i++) hurt(f,T,f.atk*.9,false,true); B.fx.push({k:'shot',a:f,b:T,t:0,col:'#ffd23f',big:1}); }
    else if(s.t==='heal'){ const al=allies(f).sort((a,b)=>a.hp/a.max-b.hp/b.max||a.idx-b.idx)[0]; if(al) heal(f,al,s.v*P); }
    else if(s.t==='healAll'){ for(const a of allies(f)){ heal(f,a,s.v*P); if(s.mana&&a!==f) a.mana=Math.min(a.mmax,a.mana+s.mana); } }
    else if(s.t==='shield'){ f.shield+=s.v*P*(1+f.healAmp); }
    else if(s.t==='shieldAll'){ for(const a of allies(f)) if(dist(f,a)<=2) a.shield+=s.v*P*(1+f.healAmp); if(s.stunAll) for(const o of foes(f)) if(dist(f,o)<=2&&!o.fx.cc) o.stun=Math.max(o.stun,s.stunAll); }
    else if(s.t==='slam'){ for(const o of foes(f)) if(dist(f,o)<=1){ hurt(f,o,s.v*P*crit,true,true); if(!o.fx.cc) o.stun=Math.max(o.stun,s.stun); } B.fx.push({k:'ring',x:f.c,y:f.r,t:0,col:'#ffd23f',rad:1}); }
    else if(s.t==='spin'){ for(const o of foes(f)) if(dist(f,o)<=1) hurt(f,o,s.v*P*crit,false,true); B.fx.push({k:'ring',x:f.c,y:f.r,t:0,col:'#ff7a3d',rad:1}); }
    else if(s.t==='pierce'&&T){ const line=foes(f).filter(o=>dist(T,o)<=1).slice(0,3); for(const o of line) hurt(f,o,s.v*P*crit,false,true); B.fx.push({k:'shot',a:f,b:T,t:0,col:'#ffd23f',big:1}); }
    else if(s.t==='blink'){ const far=foes(f).sort((a,b)=>dist(f,b)-dist(f,a)||a.idx-b.idx)[0]; if(far){ const spot=nbrs(far.c,far.r).find(([c,r])=>!occ(c,r)); if(spot){ f.pc=f.c; f.pr=f.r; f.c=spot[0]; f.r=spot[1]; f.mv=1; } f.tgt=far; hurt(f,far,s.v*P*crit,false,true); } }
    else if(s.t==='nova'&&T){ for(const o of foes(f)) if(dist(T,o)<=1) hurt(f,o,s.v*P*crit,true,true); B.fx.push({k:'ring',x:T.c,y:T.r,t:0,col:'#c56bff',rad:1}); }
    else if(s.t==='rage'){ f.rage=s.v*SKM[f.s]; f.rageT=4; }
    else if(s.t==='stun'&&T){ hurt(f,T,s.v*P*crit,true,true); if(!T.fx.cc) T.stun=Math.max(T.stun,s.stun); B.fx.push({k:'shot',a:f,b:T,t:0,col:'#ff9ec8',big:1}); }
    else if(s.t==='meteor'&&T){ for(const o of foes(f)) if(dist(T,o)<=2) hurt(f,o,s.v*P*crit*(dist(T,o)<=1?1:.6),true,true); B.fx.push({k:'ring',x:T.c,y:T.r,t:0,col:'#ff5d3d',rad:2}); }
    if(f.fx.selfHeal) f.hp=Math.min(f.max,f.hp+(f.max-f.hp)*f.fx.selfHeal);
    f.mana=f.fx.refund||0; }
  B.step=function(){
    if(B.over) return; const dt=B.dt; B.t+=dt;
    for(const f of F){ if(!f.alive) continue;
      if(f.mv<1) f.mv=Math.min(1,f.mv+dt/.45); if(f.anim>0) f.anim-=dt; if(f.cast>0) f.cast-=dt; if(f.hurt>0) f.hurt-=dt;
      if(f.regen) f.hp=Math.min(f.max,f.hp+f.max*f.regen*dt);
      if(f.rageT>0) f.rageT-=dt; if(f.slowT>0) f.slowT-=dt;
      if(f.stun>0){ f.stun-=dt; continue; }
      if(f.mmax&&f.mana>=f.mmax&&f.mv>=1){ cast(f); continue; }
      if(!f.tgt||!f.tgt.alive){ f.tgt=nearest(f,foes(f)); if(!f.tgt) continue; }
      const T=f.tgt,dd=dist(f,T);
      if(dd<=f.rng){ f.cd-=dt; if(f.cd<=0&&f.mv>=1){ const as=f.as*(1+(f.rageT>0?f.rage:0))*(f.slowT>0?.75:1); f.cd=1/Math.min(5,as);
          const cr=R()<f.crit?1.6:1; hurt(f,T,f.atk*cr,false,false); f.anim=.2; f.hits++; f.mana=Math.min(f.mmax,f.mana+10+f.mpa);
          if(f.rng>1) B.fx.push({k:'shot',a:f,b:T,t:0,col:TRAITS[f.d.tr[0]]?TRAITS[f.d.tr[0]].col:'#fff'});
          if(f.fx.zap&&f.hits%3===0) hurt(f,T,f.fx.zap,true,true); if(T.fx.slow) f.slowT=2; } }
      else if(f.mv>=1){ // 往目標走一格
        let best=null,bd=dd; for(const [c,r] of nbrs(f.c,f.r)){ if(occ(c,r)) continue; const d2=hexDist(c,r,T.c,T.r)+((c*7+r*3+f.idx)%5)*1e-3; if(d2<bd){ bd=d2; best=[c,r]; } }
        if(best){ f.pc=f.c; f.pr=f.r; f.c=best[0]; f.r=best[1]; f.mv=0; } else { const alt=foes(f).filter(o=>o!==T).sort((a,b)=>dist(f,a)-dist(f,b))[0]; if(alt&&dist(f,alt)<dd) f.tgt=alt; } } }
    for(let i=B.fx.length-1;i>=0;i--){ B.fx[i].t+=dt; if(B.fx[i].t>.8) B.fx.splice(i,1); }
    const a=F.some(f=>f.alive&&f.team===0),b=F.some(f=>f.alive&&f.team===1);
    if(!a||!b||B.t>=32){ B.over={win:a&&!b?0:b&&!a?1:-1,survA:F.filter(f=>f.alive&&f.team===0),survB:F.filter(f=>f.alive&&f.team===1)}; } };
  B.run=function(){ while(!B.over) B.step(); return B.over; };
  return B; }
const flip=b=>b.map(x=>Object.assign({},x,{c:COLS-1-x.c,r:ROWS-1-x.r}));

/* ---------- Q 版萌獸 ---------- */
const photoCache={};
function photoImg(src){ if(!src) return null; let im=photoCache[src]; if(!im){ im=new Image(); im.src=src; photoCache[src]=im; } return im.complete&&im.naturalWidth?im:null; }
// 萌獸外型：職業決定體型和裝備（戰士兇、坦克壯、射手瘦、法師戴帽、刺客蒙面、治療有光環），種類決定耳朵、口鼻、尾巴、花紋
const SPECIES={sprout:'rabbit',canbear:'bear',bubble:'fish',lavarat:'mouse',starcat:'cat',marsh:'sheep',shroom:'turtle',gearfox:'fox',coral:'seahorse',spark:'dog',meteor:'frog',
  choco:'bear',whale:'whale',mechbee:'bee',acorn:'squirrel',cupcat:'cat',dragon:'dragon',owl:'owl',pudding:'penguin',panda:'panda',phoenix:'phoenix',mechwhale:'whale',creep:'slime'};
const EAR_SP={cat:'cat',rabbit:'rabbit',bear:'bear',dog:'dog',horn:'dragon',antenna:'bee',none:'plain'};
const BODY={warrior:[14,13.5,0],guardian:[17,15.5,-1],ranger:[11.5,13,0],mage:[12.5,13,0],assassin:[11,11.5,2],healer:[12.5,13,0]};
function shade(hex,k){ const n=parseInt(String(hex).slice(1),16); if(isNaN(n)) return hex; const f=v=>clamp(Math.round(v*k),0,255); return 'rgb('+f(n>>16&255)+','+f(n>>8&255)+','+f(n&255)+')'; }
function drawCreature(c,x,y,s,d,o){ o=o||{}; const L=d.look||{},t=o.t||0,ph=o.ph||0,bc=L.body||'#ccc',dk=shade(bc,.72),lt=shade(bc,1.18);
  const k=d.k||'warrior',sp=d.id&&SPECIES[d.id]||EAR_SP[L.ear]||'plain',cost=d.cost||1,[bw0,bh0,dy]=BODY[k]||BODY.warrior;
  const big=sp==='whale'||sp==='turtle'?1.08:1,bw=bw0*big*(sp==='fish'||sp==='whale'?1.12:1),bh=bh0*big*(sp==='penguin'?1.1:sp==='frog'?.88:1);
  const bob=Math.sin(t*(k==='assassin'?7:5)+ph)*1.2;
  c.save(); c.translate(x,y+bob*s); c.scale(s*(.94+cost*.04),s*(.94+cost*.04)); if(o.flipX) c.scale(-1,1); if(o.alpha!=null) c.globalAlpha=o.alpha;
  c.translate(0,dy);
  const ink='#1a1530',stroke=w=>{ c.strokeStyle=ink; c.lineWidth=w||1.5; c.stroke(); };
  const ell=(x0,y0,rx,ry,rot,fill,st)=>{ c.beginPath(); c.ellipse(x0,y0,rx,ry,rot||0,0,7); c.fillStyle=fill; c.fill(); if(st!==false) stroke(st); };
  // 影子
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0,bh+1,bw+2,4,0,0,7); c.fill();
  /* ===== 身體後面：尾巴、翅膀、披風、箭袋、殼 ===== */
  if(k==='assassin'){ c.fillStyle='#c8233a'; c.beginPath(); c.moveTo(-4,-bh*.35); c.quadraticCurveTo(-bw-8,-bh*.2+Math.sin(t*8+ph)*3,-bw-12,bh*.2); c.lineTo(-bw-6,bh*.1); c.quadraticCurveTo(-bw,-bh*.1,-2,-bh*.15); c.fill(); }
  if(k==='ranger'){ c.save(); c.rotate(-.5); c.fillStyle='#8a5a2a'; rr(c,-bw*.2-3,-bh-6,7,16,2); c.fill(); stroke(1); c.fillStyle='#fff'; for(const ax of [-1,2]){ c.beginPath(); c.moveTo(-bw*.2+ax,-bh-6); c.lineTo(-bw*.2+ax-2,-bh-11); c.lineTo(-bw*.2+ax+2,-bh-11); c.fill(); } c.restore(); }
  if(k==='healer'){ c.fillStyle='rgba(255,255,255,.9)'; for(const sx of [-1,1]){ c.beginPath(); c.ellipse(sx*(bw+3),-2,6,4,sx*-.6,0,7); c.fill(); stroke(1); } }
  if(sp==='turtle'){ ell(0,-1,bw+3,bh+1,0,'#6a8a3a',1.6); c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=1; for(const [hx,hy] of [[-7,-6],[7,-6],[0,3],[-8,5],[8,5]]){ c.beginPath(); for(let i=0;i<6;i++){ const a=Math.PI/3*i; c.lineTo(hx+Math.cos(a)*4,hy+Math.sin(a)*4); } c.closePath(); c.stroke(); } }
  // 尾巴
  const wag=Math.sin(t*6+ph)*.25;
  c.save(); c.translate(-bw*.75,bh*.35); c.rotate(wag);
  if(sp==='rabbit') ell(-2,0,4,4,0,'#fff',1.2);
  else if(sp==='cat'){ c.strokeStyle=ink; c.lineWidth=4.5; c.lineCap='round'; c.beginPath(); c.moveTo(0,0); c.quadraticCurveTo(-10,-2,-8,-12); c.stroke(); c.strokeStyle=bc; c.lineWidth=2.8; c.stroke(); }
  else if(sp==='fox'){ ell(-7,-4,8,4.5,-.6,bc,1.4); ell(-12,-8,3.2,2.4,-.6,'#fff',1); }
  else if(sp==='mouse'){ c.strokeStyle='#e88a9a'; c.lineWidth=1.6; c.beginPath(); c.moveTo(0,0); c.bezierCurveTo(-8,4,-12,-6,-6,-9); c.stroke(); }
  else if(sp==='dog'){ c.strokeStyle=ink; c.lineWidth=4; c.lineCap='round'; c.beginPath(); c.moveTo(0,0); c.lineTo(-7,-7); c.stroke(); c.strokeStyle=bc; c.lineWidth=2.4; c.stroke(); }
  else if(sp==='squirrel'){ c.fillStyle=dk; c.beginPath(); c.moveTo(0,2); c.bezierCurveTo(-16,2,-18,-22,-4,-24); c.bezierCurveTo(-12,-18,-8,-6,2,-2); c.fill(); stroke(1.4); }
  else if(sp==='fish'){ c.fillStyle=dk; c.beginPath(); c.moveTo(2,-4); c.lineTo(-9,-11); c.lineTo(-7,0); c.lineTo(-9,9); c.closePath(); c.fill(); stroke(1.2); }
  else if(sp==='whale'){ c.fillStyle=dk; c.beginPath(); c.moveTo(2,-2); c.quadraticCurveTo(-8,-6,-12,-14); c.lineTo(-6,-6); c.lineTo(-14,-4); c.closePath(); c.fill(); stroke(1.2); }
  else if(sp==='dragon'){ c.fillStyle=bc; c.beginPath(); c.moveTo(2,-3); c.quadraticCurveTo(-12,2,-14,-8); c.lineTo(-10,-3); c.quadraticCurveTo(-6,4,2,3); c.fill(); stroke(1.2); c.fillStyle='#ffe0a0'; c.beginPath(); c.moveTo(-14,-8); c.lineTo(-18,-12); c.lineTo(-12,-11); c.fill(); }
  else if(sp==='phoenix'){ for(let i=0;i<3;i++){ c.fillStyle=['#ffd23f','#ff7a3d','#ff3d6a'][i]; c.beginPath(); c.ellipse(-6-i*3,-3+i*4,8,2.6,-.4+i*.3,0,7); c.fill(); } }
  else if(sp==='seahorse'){ c.strokeStyle=ink; c.lineWidth=4; c.beginPath(); c.arc(-3,2,5,-1.2,3.6); c.stroke(); c.strokeStyle=bc; c.lineWidth=2.4; c.stroke(); }
  else if(sp==='bee'){ c.fillStyle=ink; c.beginPath(); c.moveTo(0,-2); c.lineTo(-7,0); c.lineTo(0,3); c.fill(); }
  c.restore();
  // 翅膀
  if(sp==='bee'){ c.fillStyle='rgba(220,240,255,.75)'; for(const sx of [-1,1]){ c.save(); c.rotate(sx*Math.sin(t*30)*.2); c.beginPath(); c.ellipse(sx*9,-bh*.75,6,9,sx*.5,0,7); c.fill(); c.strokeStyle='rgba(26,21,48,.5)'; c.lineWidth=1; c.stroke(); c.restore(); } }
  if(sp==='dragon'){ c.fillStyle=dk; for(const sx of [-1,1]){ c.beginPath(); c.moveTo(sx*bw*.6,-bh*.3); c.lineTo(sx*(bw+12),-bh-4); c.lineTo(sx*(bw+8),-bh*.2); c.lineTo(sx*(bw+12),-bh*.1); c.lineTo(sx*bw*.7,bh*.2); c.closePath(); c.fill(); stroke(1.2); } }
  if(sp==='phoenix'){ for(const sx of [-1,1]){ c.fillStyle='#ff9ec8'; c.beginPath(); c.ellipse(sx*(bw+5),-3,9,4,sx*-.6+Math.sin(t*6)*.15*sx,0,7); c.fill(); stroke(1.2); c.fillStyle='#ffd23f'; c.beginPath(); c.ellipse(sx*(bw+9),-6,4,2,sx*-.6,0,7); c.fill(); } }
  /* ===== 耳朵（身體後面） ===== */
  const hy=-bh*.95;
  if(sp==='rabbit'){ for(const sx of [-1,1]){ ell(sx*5,hy-9,3.6,9.5,sx*.18,bc,1.5); ell(sx*5,hy-9,1.6,6.5,sx*.18,'#ffc0d0',false); } }
  else if(sp==='cat'||sp==='fox'){ const tall=sp==='fox'?1.3:1; for(const sx of [-1,1]){ c.beginPath(); c.moveTo(sx*3,hy+3); c.lineTo(sx*11,hy-9*tall); c.lineTo(sx*12,hy+5); c.closePath(); c.fillStyle=bc; c.fill(); stroke(); c.beginPath(); c.moveTo(sx*6,hy+3); c.lineTo(sx*10.5,hy-5*tall); c.lineTo(sx*10.5,hy+3); c.fillStyle=sp==='fox'?'#fff':'#ffc0d0'; c.fill(); } }
  else if(sp==='bear'||sp==='panda'){ for(const sx of [-1,1]){ ell(sx*9,hy+1,4.6,4.6,0,sp==='panda'?'#222':bc,1.5); if(sp==='bear') ell(sx*9,hy+1,2.2,2.2,0,lt,false); } }
  else if(sp==='mouse'){ for(const sx of [-1,1]){ ell(sx*10,hy,6.5,6.5,0,bc,1.5); ell(sx*10,hy,3.8,3.8,0,'#ffc0d0',false); } }
  else if(sp==='squirrel'){ for(const sx of [-1,1]){ c.beginPath(); c.moveTo(sx*4,hy+3); c.lineTo(sx*9,hy-7); c.lineTo(sx*11,hy+4); c.closePath(); c.fillStyle=bc; c.fill(); stroke(); c.strokeStyle=dk; c.lineWidth=1.5; c.beginPath(); c.moveTo(sx*9,hy-7); c.lineTo(sx*9.5,hy-10); c.stroke(); } }
  else if(sp==='sheep'){ for(const sx of [-1,1]){ c.strokeStyle='#c8a070'; c.lineWidth=2.4; c.beginPath(); c.arc(sx*10,hy+4,3.5,sx>0?-1.5:4.6,sx>0?2.5:.6); c.stroke(); } }
  else if(sp==='owl'){ for(const sx of [-1,1]){ c.beginPath(); c.moveTo(sx*4,hy+2); c.lineTo(sx*11,hy-7); c.lineTo(sx*11,hy+4); c.closePath(); c.fillStyle=dk; c.fill(); stroke(1.2); } }
  else if(sp==='dragon'){ for(const sx of [-1,1]){ c.beginPath(); c.moveTo(sx*4,hy+2); c.quadraticCurveTo(sx*10,hy-4,sx*9,hy-11); c.lineTo(sx*11,hy+3); c.closePath(); c.fillStyle='#ffe0a0'; c.fill(); stroke(1.2); } }
  else if(sp==='bee'){ c.strokeStyle=ink; c.lineWidth=1.3; for(const sx of [-1,1]){ c.beginPath(); c.moveTo(sx*3,hy+2); c.quadraticCurveTo(sx*6,hy-6,sx*9,hy-8); c.stroke(); ell(sx*9,hy-8,1.8,1.8,0,ink,false); } }
  else if(sp==='phoenix'){ for(const a of [-.45,0,.45]){ c.save(); c.translate(0,hy+2); c.rotate(a); ell(0,-7,2.4,6,0,'#ffd23f',1); c.restore(); } }
  else if(sp==='fish'||sp==='whale'||sp==='seahorse'){ c.beginPath(); c.moveTo(-4,hy+3); c.quadraticCurveTo(1,hy-8,7,hy+3); c.closePath(); c.fillStyle=dk; c.fill(); stroke(1.2); }
  else if(sp==='frog'){ for(const sx of [-1,1]) ell(sx*6,hy+1,5,5,0,bc,1.5); }
  else if(sp==='dog'){} // 垂耳在前面畫
  /* ===== 身體 ===== */
  if(sp==='slime'){ c.beginPath(); c.moveTo(-bw,bh); c.quadraticCurveTo(-bw-2,-bh*.2,-bw*.3,-bh); c.quadraticCurveTo(0,-bh-3,bw*.3,-bh); c.quadraticCurveTo(bw+2,-bh*.2,bw,bh); c.closePath(); c.fillStyle=bc; c.fill(); stroke(1.6); }
  else if(sp==='sheep'){ c.fillStyle='#fff'; for(let i=0;i<10;i++){ const a=i/10*Math.PI*2; c.beginPath(); c.arc(Math.cos(a)*bw*.85,Math.sin(a)*bh*.85,5,0,7); c.fill(); } c.strokeStyle=ink; c.lineWidth=1.2; for(let i=0;i<10;i++){ const a=i/10*Math.PI*2; c.beginPath(); c.arc(Math.cos(a)*bw*.85,Math.sin(a)*bh*.85,5,a-1.2,a+1.2); c.stroke(); } ell(0,-1,bw*.7,bh*.72,0,bc,false); }
  else ell(0,0,bw,bh,0,bc,1.7);
  // 法師長袍、坦克盔甲、戰士腰帶
  if(k==='mage'){ c.fillStyle=L.robe||'#5a3aa8'; c.beginPath(); c.moveTo(-bw*.95,bh*.15); c.quadraticCurveTo(0,bh*.4,bw*.95,bh*.15); c.lineTo(bw*1.05,bh*.95); c.quadraticCurveTo(0,bh*1.15,-bw*1.05,bh*.95); c.closePath(); c.fill(); stroke(1.3); c.fillStyle='#ffd23f'; c.font='7px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('✦',bw*.4,bh*.6); }
  if(k==='guardian'){ c.fillStyle='#9aa8c0'; for(const sx of [-1,1]){ c.beginPath(); c.ellipse(sx*bw*.82,-bh*.15,6,5,sx*.3,0,7); c.fill(); stroke(1.3); c.fillStyle='#cfd8e8'; c.beginPath(); c.arc(sx*bw*.82,-bh*.25,1.4,0,7); c.fill(); c.fillStyle='#9aa8c0'; } }
  if(k==='warrior'){ c.fillStyle='#6a3a1a'; c.fillRect(-bw*.85,bh*.35,bw*1.7,3.2); c.fillStyle='#ffd23f'; c.fillRect(-2,bh*.33,4,3.6); }
  // 肚子與花紋
  if(sp==='penguin'){ ell(0,2,bw*.66,bh*.8,0,'#fff',false); for(const sx of [-1,1]) ell(sx*(bw+1),2,3,7,sx*.4,dk,1.2); }
  else if(sp==='panda'){ ell(0,4,bw*.6,bh*.5,0,'#fff',false); }
  else if(sp!=='sheep'&&sp!=='slime'&&k!=='mage') ell(0,bh*.35,bw*.55,bh*.4,0,'rgba(255,255,255,.38)',false);
  if(sp==='bee'){ c.save(); c.beginPath(); c.ellipse(0,0,bw,bh,0,0,7); c.clip(); c.fillStyle=ink; for(const yy of [2,8]) c.fillRect(-bw,yy,bw*2,3); c.restore(); }
  if(sp==='dragon'){ c.strokeStyle='rgba(255,224,160,.9)'; c.lineWidth=1.2; for(const yy of [2,6,10]){ c.beginPath(); c.arc(0,yy-4,bw*.4,.3,Math.PI-.3); c.stroke(); } }
  if(sp==='fish'||sp==='whale'){ c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=1; for(const xx of [-5,0,5]){ c.beginPath(); c.arc(xx,4,3,.2,Math.PI-.2); c.stroke(); } }
  if(L.acc==='gear'||L.acc==='bolt'||sp==='bear'&&L.body==='#b8c4d4'){ c.fillStyle='#e0e6f0'; for(const [rx,ry] of [[-bw*.6,-2],[bw*.6,-2],[-bw*.5,bh*.5],[bw*.5,bh*.5]]){ c.beginPath(); c.arc(rx,ry,1.2,0,7); c.fill(); } }
  /* ===== 臉 ===== */
  const fy=-bh*.25,im=o.photo?photoImg(o.photo):null;
  if(im){ c.save(); c.beginPath(); c.arc(0,fy-1,bw*.78,0,7); c.clip(); c.drawImage(im,-bw*.82,fy-1-bw*.82,bw*1.64,bw*1.64); c.restore(); c.strokeStyle='#fff'; c.lineWidth=1.6; c.beginPath(); c.arc(0,fy-1,bw*.78,0,7); c.stroke(); }
  else {
    // 口鼻
    if(sp==='fox'||sp==='dog'||sp==='bear'||sp==='mouse'||sp==='panda'||sp==='squirrel') ell(0,fy+5,sp==='fox'?4.2:5.2,sp==='fox'?3.2:3.8,0,sp==='fox'?'#fff':lt,false);
    if(sp==='owl'){ for(const sx of [-1,1]) ell(sx*5,fy,4.6,4.6,0,'#fff3c0',1); }
    if(sp==='panda') for(const sx of [-1,1]) ell(sx*5,fy,3.6,4.4,sx*.5,'#222',false);
    const eyeX=sp==='frog'?6:sp==='owl'?5:4.6,eyeY=sp==='frog'?fy-6:fy,blink=((t+ph)%3.4)<.12;
    if(k==='assassin'){ c.fillStyle='#22202e'; c.beginPath(); c.moveTo(-bw-1,fy-4); c.lineTo(bw+1,fy-4); c.lineTo(bw,fy+3); c.lineTo(-bw,fy+3); c.closePath(); c.fill();
      c.fillStyle='#c8233a'; c.fillRect(bw*.6,fy-4,3,2); c.beginPath(); c.moveTo(bw,fy-3); c.lineTo(bw+6,fy-6+Math.sin(t*9)*2); c.lineTo(bw+5,fy-1); c.fill();
      c.fillStyle='#fff'; for(const sx of [-1,1]){ c.beginPath(); c.moveTo(sx*eyeX-2.4,eyeY-.4); c.lineTo(sx*eyeX+2.4,eyeY-(sx>0?1.4:-1.4)*.3-1); c.lineTo(sx*eyeX+2,eyeY+.9); c.lineTo(sx*eyeX-2,eyeY+.9); c.closePath(); c.fill(); } }
    else if(k==='healer'&&!blink){ c.strokeStyle=ink; c.lineWidth=1.4; for(const sx of [-1,1]){ c.beginPath(); c.arc(sx*eyeX,eyeY+1,2.3,Math.PI*1.1,Math.PI*1.9); c.stroke(); } }
    else for(const sx of [-1,1]){ if(blink){ c.fillStyle=ink; c.fillRect(sx*eyeX-2.2,eyeY,4.4,1.2); continue; }
      if(sp==='frog') ell(sx*eyeX,eyeY,3.4,3.4,0,'#fff',1);
      c.fillStyle=ink; c.beginPath(); c.ellipse(sx*eyeX,eyeY,k==='ranger'?2.1:2.4,k==='warrior'?2.6:3,0,0,7); c.fill();
      c.fillStyle='#fff'; c.beginPath(); c.arc(sx*eyeX-.8,eyeY-1,.95,0,7); c.fill(); c.beginPath(); c.arc(sx*eyeX+.7,eyeY+.9,.5,0,7); c.fill(); }
    // 眉毛：戰士兇（倒八字）、坦克堅定
    if(k==='warrior'){ c.strokeStyle=ink; c.lineWidth=1.8; for(const sx of [-1,1]){ c.beginPath(); c.moveTo(sx*(eyeX+3),eyeY-5.5); c.lineTo(sx*(eyeX-2),eyeY-3); c.stroke(); } }
    if(k==='guardian'){ c.strokeStyle=ink; c.lineWidth=1.6; for(const sx of [-1,1]){ c.beginPath(); c.moveTo(sx*(eyeX+2.6),eyeY-4.6); c.lineTo(sx*(eyeX-2.4),eyeY-4.6); c.stroke(); } }
    // 腮紅
    if(k!=='assassin'){ c.fillStyle='rgba(255,110,140,.5)'; for(const sx of [-1,1]){ c.beginPath(); c.ellipse(sx*(eyeX+3.6),fy+4,2.2,1.4,0,0,7); c.fill(); } }
    // 嘴
    c.strokeStyle=ink; c.lineWidth=1.1;
    if(sp==='owl'||sp==='penguin'||sp==='phoenix'){ c.fillStyle='#ffb020'; c.beginPath(); c.moveTo(-2.2,fy+2.5); c.lineTo(2.2,fy+2.5); c.lineTo(0,fy+6); c.closePath(); c.fill(); }
    else if(sp==='frog'){ c.beginPath(); c.arc(0,fy+1,6,.3,Math.PI-.3); c.stroke(); }
    else if(sp==='seahorse'){ ell(0,fy+5,2,3.2,0,lt,1); }
    else if(k==='warrior'){ c.fillStyle='#7a1a2a'; c.beginPath(); c.moveTo(-3.5,fy+4); c.lineTo(3.5,fy+4); c.quadraticCurveTo(0,fy+9,-3.5,fy+4); c.fill(); c.fillStyle='#fff'; for(const sx of [-1,1]){ c.beginPath(); c.moveTo(sx*2.6,fy+4); c.lineTo(sx*1.4,fy+4); c.lineTo(sx*2,fy+6.2); c.fill(); } }
    else if(k!=='assassin'){ c.beginPath(); c.arc(-1.2,fy+4,1.2,0,Math.PI); c.arc(1.2,fy+4,1.2,0,Math.PI); c.stroke(); }
    if(sp==='mouse'||sp==='cat'){ c.lineWidth=.8; for(const sx of [-1,1]) for(const a of [-.15,.15]){ c.beginPath(); c.moveTo(sx*5,fy+3.5); c.lineTo(sx*11,fy+3.5+a*12); c.stroke(); } }
    if(sp==='fox'||sp==='dog'||sp==='bear'||sp==='mouse'||sp==='panda'||sp==='cat'||sp==='squirrel') ell(0,fy+2.4,1.5,1.1,0,ink,false);
  }
  if(sp==='dog'){ for(const sx of [-1,1]) ell(sx*(bw*.8),hy+6,3.6,6.5,sx*.35,dk,1.3); }
  /* ===== 頭上：職業帽子 ===== */
  if(k==='mage'){ const col=L.robe||'#5a3aa8'; c.fillStyle=col; c.beginPath(); c.moveTo(-bw*.9,hy+4); c.quadraticCurveTo(0,hy+1,bw*.9,hy+4); c.lineTo(3,hy-15); c.quadraticCurveTo(8,hy-18,9,hy-13); c.lineTo(4,hy-14); c.closePath(); c.fill(); stroke(1.3);
    c.fillStyle=shade(col,1.4); c.fillRect(-bw*.8,hy+1,bw*1.6,2.4); c.fillStyle='#ffd23f'; c.font='7px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('★',-1,hy-5); }
  else if(k==='guardian'){ c.fillStyle='#9aa8c0'; c.beginPath(); c.arc(0,hy+5,bw*.7,Math.PI,0); c.closePath(); c.fill(); stroke(1.3); c.fillStyle='#cfd8e8'; c.fillRect(-1.2,hy-bw*.62+5,2.4,bw*.6); }
  else if(k==='warrior'){ c.fillStyle='#8a6a4a'; c.beginPath(); c.arc(0,hy+5,bw*.62,Math.PI,0); c.closePath(); c.fill(); stroke(1.2); c.fillStyle='#fff3e0'; for(const sx of [-1,1]){ c.beginPath(); c.moveTo(sx*bw*.45,hy+1); c.quadraticCurveTo(sx*bw*.95,hy-2,sx*bw*.9,hy-9); c.lineTo(sx*bw*.6,hy+.5); c.closePath(); c.fill(); stroke(1); } }
  else if(k==='ranger'){ c.fillStyle='#2a8a4a'; c.beginPath(); c.ellipse(0,hy+4,bw*.75,4,0,Math.PI,0); c.fill(); stroke(1.2); c.fillStyle='#e23b3b'; c.beginPath(); c.ellipse(bw*.45,hy-2,1.6,6,.5,0,7); c.fill(); }
  else if(k==='healer'){ c.strokeStyle='#ffe066'; c.lineWidth=2; c.beginPath(); c.ellipse(0,hy-4+Math.sin(t*3)*1,bw*.6,2.2,0,0,7); c.stroke(); }
  // 原本的小飾品（代表出身）
  const acc=L.acc;
  if(acc==='sprout'&&k!=='mage'){ c.strokeStyle='#2a8a3a'; c.lineWidth=1.2; c.beginPath(); c.moveTo(-bw*.5,hy+2); c.lineTo(-bw*.5,hy-3); c.stroke(); ell(-bw*.5-2.5,hy-4,2.6,1.4,-.5,'#5fd068',false); }
  else if(acc==='flame'){ c.fillStyle='#ffd23f'; for(const sx of [-1,1]){ c.beginPath(); c.arc(sx*(bw+3),-bh*.6+Math.sin(t*9+sx)*2,1.3,0,7); c.fill(); } }
  else if(acc==='bubble'){ c.strokeStyle='rgba(255,255,255,.85)'; c.lineWidth=1; c.beginPath(); c.arc(bw+3,-bh*.7,2.6,0,7); c.stroke(); c.beginPath(); c.arc(bw+6,-bh*.9-((t*8)%6),1.5,0,7); c.stroke(); }
  else if(acc==='star'||acc==='moon'){ c.fillStyle='#ffe066'; c.font='7px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(acc==='star'?'★':'☾',bw+2,-bh*.75); }
  else if(acc==='mushroom'){ c.fillStyle='#e23b3b'; c.beginPath(); c.ellipse(-bw*.35,hy+1,6,3.5,0,Math.PI,0); c.fill(); stroke(1); c.fillStyle='#fff'; c.beginPath(); c.arc(-bw*.35,hy-1,1,0,7); c.fill(); }
  else if(acc==='coral'){ c.strokeStyle='#ff5d8f'; c.lineWidth=1.6; c.beginPath(); c.moveTo(-bw*.4,hy+2); c.lineTo(-bw*.4,hy-4); c.lineTo(-bw*.4-3,hy-6); c.moveTo(-bw*.4,hy-2); c.lineTo(-bw*.4+3,hy-5); c.stroke(); }
  else if(acc==='choco'){ c.fillStyle='#5a3a2a'; c.beginPath(); c.moveTo(-bw*.6,hy+4); c.quadraticCurveTo(0,hy,bw*.6,hy+4); c.lineTo(bw*.5,hy+7); c.lineTo(bw*.2,hy+5); c.lineTo(-bw*.1,hy+8); c.lineTo(-bw*.5,hy+6); c.closePath(); c.fill(); }
  else if(acc==='note'){ c.fillStyle='#fff'; c.font='8px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('♪',bw+2,-bh*.8-Math.sin(t*4)*2); }
  else if(acc==='acorn'){ ell(bw+2,bh*.4,2.6,3,0,'#8a5a2a',1); }
  else if(acc==='cupcake'&&k!=='mage'){ c.fillStyle='#ff7ab8'; c.beginPath(); c.ellipse(-bw*.3,hy+2,5,2.6,0,Math.PI,0); c.fill(); ell(-bw*.3,hy-1,1.3,1.3,0,'#e23b3b',false); }
  else if(acc==='pudding'){ c.fillStyle='#8a4a1a'; c.beginPath(); c.ellipse(0,hy+5,bw*.55,3,0,Math.PI,0); c.fill(); }
  else if(acc==='leaf'){ ell(bw*.5,hy+1,3.4,1.7,.6,'#5fd068',false); }
  else if(acc==='cloud'){ ell(bw+2,-bh*.6,3,2,0,'#ffd0e8',false); }
  else if(acc==='crown'){ c.fillStyle='#ffd23f'; c.beginPath(); c.moveTo(-5,hy+1); c.lineTo(-5,hy-4); c.lineTo(-2.5,hy-1.5); c.lineTo(0,hy-5); c.lineTo(2.5,hy-1.5); c.lineTo(5,hy-4); c.lineTo(5,hy+1); c.closePath(); c.fill(); stroke(1); }
  else if(acc==='slime'){ ell(-bw*.35,-bh*.45,3.6,2.2,-.5,'rgba(255,255,255,.4)',false); }
  /* ===== 前面：武器、盾、腳 ===== */
  c.fillStyle=bc; for(const sx of [-1,1]){ c.beginPath(); c.ellipse(sx*bw*.45,bh-1,k==='guardian'?5.2:3.6,k==='guardian'?3.2:2.4,0,0,7); c.fill(); stroke(1.3); }
  const hx=bw+1,hyy=bh*.15;
  if(k==='warrior'){ c.save(); c.translate(hx,hyy); c.rotate(-.5+Math.sin(t*4+ph)*.08); c.fillStyle='#dfe6f0'; c.beginPath(); c.moveTo(-2,0); c.lineTo(-2,-16); c.lineTo(0,-19); c.lineTo(2,-16); c.lineTo(2,0); c.closePath(); c.fill(); stroke(1); c.fillStyle='#8a5a2a'; c.fillRect(-4,0,8,2); c.fillRect(-1,2,2,4); c.restore(); }
  else if(k==='guardian'){ c.save(); c.translate(-bw*.5,bh*.5); c.fillStyle='#4a6ab8'; c.beginPath(); c.moveTo(-6,-7); c.lineTo(6,-7); c.lineTo(6,1); c.quadraticCurveTo(0,9,-6,1); c.closePath(); c.fill(); stroke(1.3); c.fillStyle='#ffd23f'; c.beginPath(); c.moveTo(0,-5); c.lineTo(2,-1); c.lineTo(0,3); c.lineTo(-2,-1); c.closePath(); c.fill(); c.restore(); }
  else if(k==='ranger'){ c.save(); c.translate(hx,hyy-2); c.strokeStyle='#8a5a2a'; c.lineWidth=2; c.beginPath(); c.arc(-4,0,9,-1.1,1.1); c.stroke(); c.strokeStyle='#fff'; c.lineWidth=.8; c.beginPath(); c.moveTo(.3,-8); c.lineTo(.3,8); c.stroke(); c.restore(); }
  else if(k==='mage'){ c.save(); c.translate(hx,hyy); c.strokeStyle='#8a5a2a'; c.lineWidth=2; c.beginPath(); c.moveTo(0,6); c.lineTo(1,-16); c.stroke(); const oc=TRAITS[d.tr&&d.tr[0]]?TRAITS[d.tr[0]].col:'#c56bff'; c.shadowColor=oc; c.shadowBlur=6; ell(1,-18,3.4,3.4,0,oc,1); c.shadowBlur=0; c.restore(); }
  else if(k==='assassin'){ for(const sx of [-1,1]){ c.save(); c.translate(sx*(bw-1),hyy+2); c.rotate(sx*.6); c.fillStyle='#dfe6f0'; c.beginPath(); c.moveTo(-1.2,0); c.lineTo(0,-9); c.lineTo(1.2,0); c.closePath(); c.fill(); c.fillStyle='#3a2a4a'; c.fillRect(-1.6,0,3.2,3); c.restore(); } }
  else if(k==='healer'){ c.save(); c.translate(hx,hyy); c.strokeStyle='#ffd23f'; c.lineWidth=1.8; c.beginPath(); c.moveTo(0,6); c.lineTo(0,-12); c.stroke(); c.fillStyle='#ff5d8f'; c.beginPath(); c.moveTo(0,-11); c.bezierCurveTo(-5,-16,-5,-20,0,-17); c.bezierCurveTo(5,-20,5,-16,0,-11); c.fill(); c.restore(); }
  c.restore(); }
// 星數
function stars(c,x,y,n){ c.fillStyle=n===3?'#ffd23f':n===2?'#cfd8e8':'#c8935a'; c.font='900 10px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('★'.repeat(n),x,y); }
function drawItemIcon(c,x,y,s,id){ c.save(); c.translate(x,y); const combo=!!COMBO[id];
  c.fillStyle=combo?'#3a2a60':'#2b2759'; rr(c,-s/2,-s/2,s,s,s*.2); c.fill(); c.strokeStyle=combo?'#ffd23f':'#7a74c0'; c.lineWidth=combo?2:1.2; c.stroke();
  const parts=combo?id.split('+'):[id]; parts.forEach((p,i)=>{ c.save(); if(combo) c.translate((i?1:-1)*s*.16,(i?1:-1)*s*.12); c.scale(s/28*(combo?.75:1),s/28*(combo?.75:1)); glyph(c,p); c.restore(); });
  c.restore(); }
function glyph(c,p){ c.lineWidth=2.4; c.lineCap='round';
  if(p==='sword'){ c.strokeStyle='#dfe6f0'; c.beginPath(); c.moveTo(-7,7); c.lineTo(7,-7); c.stroke(); c.strokeStyle='#c8935a'; c.beginPath(); c.moveTo(-8,2); c.lineTo(-2,8); c.stroke(); }
  else if(p==='bow'){ c.strokeStyle='#c8844a'; c.beginPath(); c.arc(-2,0,8,-1.2,1.2); c.stroke(); c.strokeStyle='#fff'; c.lineWidth=1; c.beginPath(); c.moveTo(1,-7.5); c.lineTo(1,7.5); c.stroke(); }
  else if(p==='rod'){ c.strokeStyle='#a87a4a'; c.beginPath(); c.moveTo(-6,8); c.lineTo(4,-4); c.stroke(); c.fillStyle='#c56bff'; c.beginPath(); c.arc(5,-6,4,0,7); c.fill(); }
  else if(p==='vest'){ c.fillStyle='#9aa8c0'; c.beginPath(); c.moveTo(0,-8); c.lineTo(8,-4); c.lineTo(6,6); c.lineTo(0,9); c.lineTo(-6,6); c.lineTo(-8,-4); c.closePath(); c.fill(); }
  else if(p==='belt'){ c.strokeStyle='#e8b04a'; c.lineWidth=4; c.beginPath(); c.ellipse(0,0,8,5,0,0,7); c.stroke(); c.fillStyle='#ffd23f'; c.fillRect(-2.5,-3,5,6); }
  else if(p==='tear'){ c.fillStyle='#3d9dff'; c.beginPath(); c.moveTo(0,-9); c.quadraticCurveTo(8,2,0,8); c.quadraticCurveTo(-8,2,0,-9); c.fill(); } }

/* ---------- 遊戲 ---------- */
function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,me=net?net.me:0,diff=clamp(opts.stage||0,0,2),humans=net?net.count:1,NP=8;
  const {ctx:c,canvas}=env.canvas2d(W,H);
  const names=[]; const AI_NAMES=['松果隊長','布丁大王','星光小隊','海鹽汽水','熔岩炒飯','機器喵','棉花糖','森林守衛'];
  for(let i=0;i<NP;i++) names.push(i<humans?(net?(net.names&&net.names[i])||'玩家'+(i+1):(opts.name||'你')):'電腦・'+AI_NAMES[i%8]);
  // 自訂萌獸（每位真人玩家各一隻）
  const looks=[]; for(let i=0;i<humans;i++) looks[i]=net?(net.looks&&net.looks[i])||{}:opts.look||{};
  const customs={}; looks.forEach((L,i)=>{ if(!L) return; const o=ORIGINS.includes(L.corg)?L.corg:'forest',k=CLASSES.includes(L.ccls)?L.ccls:'warrior';
    customs['my'+i]=Object.assign({id:'my'+i,n:(L.cname||'我的萌獸').slice(0,8),cost:3,tr:[o,k],k,sk:CLASS_SKILL[k],look:{body:L.ccol||'#ffd23f',ear:L.cear||'cat',acc:'crown'},photo:L.face||'',custom:true},BASE[k]); });
  const defOf=id=>id==='creep'?CREEP:customs[id]||UNITS.find(u=>u.id===id);
  const unitById=defOf;
  const R=Math.random;
  let msg='',msgT=0; const say=(s,sec)=>{ msg=s; msgT=sec||2.2; };
  const sfx=n=>env.sfx(n);

  /* ----- 自己（每個真人各自）的棋盤、商店、經濟 ----- */
  const ME={gold:2,level:1,xp:0,shop:[],bench:new Array(9).fill(null),board:[],items:[COMP_IDS[Math.floor(R()*6)]],streak:0,locked:false};
  ME.bench[0]={u:UNITS.filter(u=>u.cost===1)[Math.floor(R()*6)].id,s:1,it:[]};
  function rollShop(P,lvl,cust){ const out=[]; for(let i=0;i<5;i++){ const od=ODDS[lvl]; let x=R()*100,cost=1; for(let k=0;k<5;k++){ if(x<od[k]){ cost=k+1; break; } x-=od[k]; }
      if(cost===3&&cust&&R()<.3){ out.push(cust); continue; }
      const pool=UNITS.filter(u=>u.cost===cost); out.push(pool[Math.floor(R()*pool.length)].id); } return out; }
  const myCustom=customs['my'+me]?'my'+me:null;
  ME.shop=rollShop(ME,1,myCustom);
  const all=P=>P.board.concat(P.bench.filter(Boolean));
  function combine(P){ let changed=true,up=null; while(changed){ changed=false;
      const groups={}; for(const u of all(P)) (groups[u.u+'#'+u.s]=groups[u.u+'#'+u.s]||[]).push(u);
      for(const k in groups){ const g=groups[k]; if(g.length>=3&&g[0].s<3){ const keep=g.find(u=>P.board.includes(u))||g[0],rest=g.filter(u=>u!==keep).slice(0,2);
          for(const u of rest){ P.items.push(...u.it); const bi=P.bench.indexOf(u); if(bi>=0) P.bench[bi]=null; const ki=P.board.indexOf(u); if(ki>=0) P.board.splice(ki,1); }
          keep.s++; while(keep.it.length>3) P.items.push(keep.it.pop()); changed=true; up=keep; break; } } }
    return up; }
  const sellVal=u=>{ const d=defOf(u.u); return d.cost*(u.s===1?1:u.s===2?3:9)-(u.s>1&&d.cost>1?1:0); };
  function addItem(u,it,P){ const lone=u.it.findIndex(x=>COMP[x]);
    if(COMP[it]&&lone>=0){ u.it[lone]=comboKey(u.it[lone],it); return true; }
    if(u.it.length>=3) return false; u.it.push(it); return true; }
  function buy(P,i,isMe){ const id=P.shop[i]; if(!id) return false; const d=defOf(id); if(P.gold<d.cost){ if(isMe) say('金幣不夠'); return false; }
    const slot=P.bench.indexOf(null),same=all(P).filter(u=>u.u===id&&u.s===1).length;
    if(slot<0&&same<2){ if(isMe) say('備戰席滿了'); return false; }
    P.gold-=d.cost; P.shop[i]=null; const u={u:id,s:1,it:[]};
    if(slot>=0) P.bench[slot]=u; else { P.bench.push(u); }
    const up=combine(P); P.bench=P.bench.slice(0,9); while(P.bench.length<9) P.bench.push(null);
    if(isMe){ sfx(up?'lap':'item'); if(up) say(defOf(up.u).n+' 升到 '+up.s+' 星！',1.8); } return true; }
  const xpNeed=P=>XPNEED[P.level]||999;
  function addXp(P,n){ if(P.level>=9) return; P.xp+=n; while(P.level<9&&P.xp>=xpNeed(P)){ P.xp-=xpNeed(P); P.level++; if(P===ME){ sfx('heal'); say('升到 '+P.level+' 級！上場人數 '+P.level,1.6); } } }
  const boardOut=P=>P.board.map(u=>({u:u.u,s:u.s,c:u.c,r:u.r,it:u.it.slice()}));

  /* ----- 房主：所有玩家的血量、電腦玩家、配對 ----- */
  const PL=[]; for(let i=0;i<NP;i++) PL.push({i,hp:100,alive:true,place:0,last:-1,ai:i>=humans?{gold:2,level:1,xp:0,shop:[],bench:new Array(9).fill(null),board:[],items:[COMP_IDS[i%6]],streak:0,focus:[ORIGINS[i%6],CLASSES[(i*5)%6]]}:null,board:[],lvl:1,res:''});
  let round=0,phase='plan',phT=0,phDur=25,fightDur=0,battle=null,fightInfo=null,myFlip=false,boards={},readyHum=new Set(),overSent=false,ended=false,t=0,waitBoards=0,lastRes=null,dmgShow=[];
  for(const p of PL) if(p.ai){ p.ai.bench[0]={u:UNITS.filter(u=>u.cost===1)[i2(p.i)].id,s:1,it:[]}; }
  function i2(i){ return (i*7)%6; }

  // 電腦玩家：存錢、升級、買同隊羈絆、擺陣
  function aiPlan(P,ai){
    const income=5+Math.min(5,Math.floor(ai.gold/10))+(ai.streak>=5||ai.streak<=-5?3:Math.abs(ai.streak)>=4?2:Math.abs(ai.streak)>=2?1:0)+(diff===2?1:0);
    if(round>1) ai.gold+=income; if(round>1) addXp(ai,2);
    const wantLv=[0,2,3,4,5,6,7,8,8,9][Math.min(9,1+Math.floor(round/(diff===0?4:3)))]||8;
    while(ai.gold>=4&&ai.level<wantLv&&ai.gold-4>=(diff===0?0:round>8?20:0)){ ai.gold-=4; addXp(ai,4); }
    for(let roll=0;roll<(diff===0?1:4);roll++){
      if(roll>0){ if(ai.gold<(diff===2?22:32)||round<6) break; ai.gold-=2; }
      ai.shop=rollShop(ai,ai.level,null);
      for(let i=0;i<5;i++){ const id=ai.shop[i]; if(!id) continue; const d=defOf(id),own=all(ai).filter(u=>u.u===id).length;
        const want=diff===0?R()<.5:own>0||d.tr.some(t=>ai.focus.includes(t))||all(ai).length<ai.level+1;
        if(want&&ai.gold>=d.cost&&(diff===0||ai.gold-d.cost>=Math.min(10,round*2)||own>0||all(ai).length<ai.level)) buy(ai,i,false); } }
    // 擺陣：挑最強的上場（費用×星數，羈絆加分）
    const pool=all(ai).sort((a,b)=>score(b)-score(a)); function score(u){ const d=defOf(u.u); return d.cost*Math.pow(3,u.s-1)+(d.tr.some(t=>ai.focus.includes(t))?1.5:0)+u.it.length; }
    const cap=diff===0?Math.max(1,ai.level-1):ai.level,on=pool.slice(0,cap),off=pool.slice(cap);
    ai.board=[]; ai.bench=new Array(9).fill(null); off.slice(0,9).forEach((u,i)=>ai.bench[i]=u); if(off.length>9) ai.gold+=off.slice(9).reduce((a,u)=>a+sellVal(u),0);
    let front=0,back=0; for(const u of on){ const d=defOf(u.u),melee=d.rng<=1; const r=melee?4+Math.floor(front/7):7-Math.floor(back/7),cc=melee?[3,2,4,1,5,0,6][front%7]:[3,2,4,1,5,0,6][back%7]; if(melee) front++; else back++; u.c=cc; u.r=r; ai.board.push(u); }
    // 裝備給最強的那隻
    if(on[0]) while(ai.items.length&&on[0].it.filter(x=>COMBO[x]).length<3){ const it=ai.items.shift(); if(!addItem(on[0],it,ai)){ const o2=on.find(u=>addItem(u,it,ai)); if(!o2) break; } }
    combine(ai); P.board=boardOut(ai); P.lvl=ai.level; }

  function startPlan(){
    round++; phase='plan'; phT=0; phDur=20; readyHum.clear(); boards={}; waitBoards=0;
    // 自己的收入
    if(round>1&&PL[me].alive){ const inc=5+Math.min(5,Math.floor(ME.gold/10))+(Math.abs(ME.streak)>=5?3:Math.abs(ME.streak)>=4?2:Math.abs(ME.streak)>=2?1:0);
      ME.gold+=inc; addXp(ME,2); if(!ME.locked) ME.shop=rollShop(ME,ME.level,myCustom); ME.locked=false; }
    if(!client){ for(const p of PL) if(p.ai&&p.alive) aiPlan(p,p.ai); }
    sfx('go'); }
  function sendBoard(){ const b={round,board:boardOut(ME),lvl:ME.level}; if(client) net.send({t:'board',...b}); else boards[me]=b; }
  // 房主：配對、算所有戰鬥
  function startFight(){
    const alive=PL.filter(p=>p.alive).map(p=>p.i),pairs=[],pve=isPve(round),seed=Math.floor(R()*1e9);
    for(const p of PL) if(!p.ai&&p.alive){ const b=boards[p.i]; p.board=b?b.board:p.board; p.lvl=b?b.lvl:p.lvl; }
    if(pve) alive.forEach(i=>pairs.push([i,'pve']));
    else { const order=alive.slice().sort(()=>R()-.5); // 盡量不要連續碰到同一個人
      for(let k=0;k+1<order.length;k+=2){ let a=order[k],b=order[k+1]; if(PL[a].last===b&&k+2<order.length){ const tmp=order[k+1]; order[k+1]=order[k+2]; order[k+2]=tmp; b=order[k+1]; } pairs.push([a,b]); }
      if(order.length%2){ const a=order[order.length-1],g=alive.filter(i=>i!==a)[Math.floor(R()*(alive.length-1))]; pairs.push([a,'g'+g]); } }
    const bset={}; for(const p of PL) bset[p.i]=p.board;
    const res=new Array(NP).fill(''),dmg=new Array(NP).fill(0); let longest=0;
    pairs.forEach((pr,k)=>{ const A=bset[pr[0]],Bb=pr[1]==='pve'?creeps(round):String(pr[1])[0]==='g'?bset[+String(pr[1]).slice(1)]:bset[pr[1]];
      const B2=Battle(A,flip(Bb),seed+k*101,defOf),out=B2.run(); longest=Math.max(longest,B2.t);
      const real=typeof pr[1]==='number';
      const dmgOf=surv=>loseDmg(round,surv.length);
      if(out.win===0){ res[pr[0]]='w'; if(real){ res[pr[1]]='l'; dmg[pr[1]]+=dmgOf(out.survA); } }
      else { res[pr[0]]='l'; dmg[pr[0]]+=dmgOf(out.survB); if(real){ res[pr[1]]=out.win===1?'w':'l'; if(out.win===-1) dmg[pr[1]]+=dmgOf(out.survA); } } });
    fightInfo={round,pairs,seed,boards:bset,dur:Math.min(34,longest/1.35+2.5),res,dmg,pve};
    if(net) net.send({t:'fight',fi:fightInfo});
    beginFight(fightInfo); }
  // 每個人播自己的那一場
  function beginFight(fi){
    phase='fight'; phT=0; fightInfo=fi; dmgShow=[];
    const k=fi.pairs.findIndex(p=>p[0]===me||p[1]===me); battle=null;
    if(k>=0&&PL[me].alive){ const pr=fi.pairs[k],A=fi.boards[pr[0]],Bb=pr[1]==='pve'?creeps(fi.round):String(pr[1])[0]==='g'?fi.boards[+String(pr[1]).slice(1)]:fi.boards[pr[1]];
      battle=Battle(A,flip(Bb),fi.seed+k*101,defOf); myFlip=pr[1]===me; battle.opp=pr[1]==='pve'?'野怪':myFlip?names[pr[0]]:String(pr[1])[0]==='g'?names[+String(pr[1]).slice(1)]+'（分身）':names[pr[1]]; }
    sfx('go'); }
  function endFight(){ const fi=fightInfo; if(!fi) return;
    for(let i=0;i<NP;i++){ const p=PL[i]; if(!p.alive) continue; p.hp-=fi.dmg[i]; p.res=fi.res[i]; if(fi.res[i]) p.ai?(p.ai.streak=fi.res[i]==='w'?Math.max(1,p.ai.streak+1):Math.min(-1,p.ai.streak-1)):0;
      const pr=fi.pairs.find(q=>q[0]===i||q[1]===i); if(pr) p.last=pr[0]===i?pr[1]:pr[0];
      if(p.ai&&fi.res[i]==='w') p.ai.gold+=1; if(fi.pve&&p.ai) p.ai.items.push(COMP_IDS[Math.floor(R()*6)]); }
    const dead=PL.filter(p=>p.alive&&p.hp<=0),left=PL.filter(p=>p.alive&&p.hp>0).length;
    dead.sort((a,b)=>a.hp-b.hp).forEach((p,k)=>{ p.alive=false; p.place=left+dead.length-k; });
    // 自己的結果
    const mr=fi.res[me]; if(PL[me].alive||dead.includes(PL[me])){ if(mr==='w'){ ME.streak=Math.max(1,ME.streak+1); ME.gold+=1; const sw=traitCount(ME.board,defOf).sweet||0; ME.gold+=[0,1,3][traitLv('sweet',sw)]; }
      else if(mr==='l') ME.streak=Math.min(-1,ME.streak-1);
      if(fi.pve){ const n=mr==='w'?1+(R()<.5?1:0):1; for(let i=0;i<n;i++) ME.items.push(COMP_IDS[Math.floor(R()*6)]); ME.gold+=mr==='w'?2:0; say(mr==='w'?'打贏野怪！拿到裝備':'野怪打贏了…還是掉了一個裝備',2); }
      sfx(mr==='w'?'win':mr==='l'?'hurt':'click'); }
    lastRes=fi; battle=null; fightInfo=null;
    if(PL.filter(p=>p.alive).length<=1){ const w=PL.find(p=>p.alive); if(w){ w.place=1; } finishGame(); return; }
    startPlan(); }
  function finishGame(){ if(ended) return; ended=true;
    if(net&&net.host&&!overSent){ overSent=true; net.send({t:'over',pl:PL.map(p=>({hp:p.hp,place:p.place,alive:p.alive}))}); }
    const place=PL[me].place||1,list=PL.slice().sort((a,b)=>(a.place||1)-(b.place||1));
    const html='<table class="ls"><tr><th>名次</th><th>玩家</th></tr>'+list.map(p=>'<tr><td>'+(p.place||1)+'</td><td>'+names[p.i]+(p.i===me?'（你）':'')+'</td></tr>').join('')+'</table>';
    setTimeout(()=>{ env.sfx(place<=4?'win':'lose'); env.end({title:place===1?'你是萌獸王！第 1 名':'第 '+place+' 名',big:'#'+place,html,text:place<=4?'前四名，表現不錯！':'下次試試湊滿羈絆、合成裝備。',score:place,next:false}); },900); }

  // 連線訊息
  if(net){
    if(client) net.onmsg=m=>{ if(m.t==='plan'){ if(fightInfo) endLocal(); if(m.pl) m.pl.forEach((q,i)=>Object.assign(PL[i],q)); round=m.round-1; startPlan(); }
        else if(m.t==='fight') beginFight(m.fi); else if(m.t==='res'){ m.pl.forEach((q,i)=>Object.assign(PL[i],q)); } else if(m.t==='over'){ m.pl.forEach((q,i)=>Object.assign(PL[i],q)); finishGame(); } };
    else { net.onmsg=(m,from)=>{ if(m.t==='board'&&m.round===round){ boards[from]={board:m.board,lvl:m.lvl}; } else if(m.t==='ready') readyHum.add(from); };
      net.onleave=i=>{ names[i]+='（離開）'; PL[i].ai={gold:0,level:PL[i].lvl||1,xp:0,shop:[],bench:new Array(9).fill(null),board:(PL[i].board||[]).map(b=>Object.assign({},b,{it:(b.it||[]).slice()})),items:[],streak:0,focus:[ORIGINS[i%6],CLASSES[i%6]]}; }; }
  }
  startPlan(); // 第一回合大家各自開始，之後由房主通知

  /* ----- 更新 ----- */
  function update(dt){
    t+=dt; if(msgT>0) msgT-=dt; if(ended) return; const was=phT; phT+=dt;
    if(phase==='plan'&&PL[me].alive){ const L1=Math.ceil(phDur-was),L2=Math.ceil(phDur-phT); if(L2!==L1&&L2>=1&&L2<=3) sfx('beep'); }
    if(phase==='plan'){
      if(phT>=phDur||(!net&&readyHum.has(me))||(net&&!client&&readyHum.size>=PL.filter(p=>!p.ai&&p.alive).length&&readyHum.size>0)){
        if(PL[me].alive&&waitBoards===0&&!client) sendBoard();
        if(client){ if(waitBoards===0) sendBoard(); phase='wait'; return; }
        waitBoards+=dt; const need=PL.filter(p=>!p.ai&&p.alive).every(p=>boards[p.i]);
        if(need||waitBoards>3){ startFight(); } } }
    else if(phase==='fight'){
      if(battle&&!battle.over){ let acc=dt*1.35; while(acc>0&&!battle.over){ battle.step(); acc-=battle.dt; } if(battle.over&&!battle.sfxDone){ battle.sfxDone=1; const win=(battle.over.win===0)!==myFlip&&battle.over.win!==-1; sfx(win?'win':'lose'); } }
      if(Math.floor(phT*4)!==Math.floor((phT-dt)*4)&&battle&&!battle.over&&R()<.5) sfx('bump');
      if(phT>=fightInfo.dur){ if(!client){ endFight(); if(net&&!ended) net.send({t:'plan',round,pl:PL.map(p=>({hp:p.hp,alive:p.alive,place:p.place,lvl:p.lvl}))}); } else { phase='wait'; endLocal(); } } }
  }
  function endLocal(){ // 連線的客人：用房主算好的結果更新自己的經濟
    const fi=fightInfo; if(!fi) return; const mr=fi.res[me];
    if(mr==='w'){ ME.streak=Math.max(1,ME.streak+1); ME.gold+=1; const sw=traitCount(ME.board,defOf).sweet||0; ME.gold+=[0,1,3][traitLv('sweet',sw)]; } else if(mr==='l') ME.streak=Math.min(-1,ME.streak-1);
    if(fi.pve){ ME.items.push(COMP_IDS[Math.floor(R()*6)]); if(mr==='w') ME.gold+=2; }
    for(let i=0;i<NP;i++){ PL[i].hp-=fi.dmg[i]; } fightInfo=null; battle=null; }

  /* ----- 操作：拖曳萌獸和裝備 ----- */
  let drag=null,sel=null,hoverX=-99,hoverY=-99,btns=[],tipItem=-1;
  const BENCH_Y=448,BENCH_X=480-9*54/2,SHOP_Y=508,CARD_W=132,CARD_X=258;
  function toLogical(e){ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=(r.width-W*s)/2,oy=(r.height-H*s)/2; return [(e.clientX-r.left-ox)/s,(e.clientY-r.top-oy)/s]; }
  function hexAt(x,y){ let best=null,bd=HR*.95; for(let r=0;r<ROWS;r++) for(let cc=0;cc<COLS;cc++){ const [hx,hy]=hexXY(cc,r),d=Math.hypot(x-hx,y-hy); if(d<bd){ bd=d; best=[cc,r]; } } return best; }
  const benchAt=(x,y)=>{ if(y<BENCH_Y-26||y>BENCH_Y+26) return -1; const i=Math.floor((x-BENCH_X)/54); return i>=0&&i<9?i:-1; };
  const planning=()=>phase==='plan'&&PL[me].alive;
  function unitAt(x,y){ const bi=benchAt(x,y); if(bi>=0&&ME.bench[bi]) return {u:ME.bench[bi],from:'bench',i:bi};
    if(phase!=='fight'){ const h=hexAt(x,y); if(h&&h[1]>=4){ const u=ME.board.find(b=>b.c===h[0]&&b.r===h[1]); if(u) return {u,from:'board'}; } } return null; }
  function itemAt(x,y){ for(let i=0;i<ME.items.length;i++){ const ix=762+(i%5)*38,iy=354+Math.floor(i/5)*36; if(Math.abs(x-ix)<16&&Math.abs(y-iy)<16) return i; } return -1; }
  function onDown(e){ e.preventDefault(); const [x,y]=toLogical(e); hoverX=x; hoverY=y;
    for(const b of btns) if(!b.dis&&x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h){ sfx('click'); b.fn(); return; }
    // 商店卡片
    if(y>SHOP_Y&&x>CARD_X&&x<CARD_X+5*(CARD_W+4)){ const i=Math.floor((x-CARD_X)/(CARD_W+4)); if(PL[me].alive) buy(ME,i,true); return; }
    const ii=itemAt(x,y); if(ii>=0){ drag={kind:'item',i:ii,x,y,sx:x,sy:y}; tipItem=ii; return; } tipItem=-1;
    const hit=unitAt(x,y); if(hit){ drag={kind:'unit',...hit,x,y,sx:x,sy:y}; sel=hit.u; return; }
    // 點對戰中的棋子看資料
    if(battle){ for(const f of battle.F){ const [fx,fy]=fpos(f); if(f.alive&&Math.hypot(x-fx,y-fy)<20){ sel={u:f.u,s:f.s,it:f.items,live:f}; return; } } }
    sel=null; }
  function onMove(e){ const [x,y]=toLogical(e); hoverX=x; hoverY=y; if(!drag) return; e.preventDefault(); drag.x=x; drag.y=y; }
  function onUp(e){ if(!drag) return; const d=drag; drag=null; const [x,y]=[d.x,d.y]; if(Math.hypot(x-d.sx,y-d.sy)<(d.kind==='item'?12:6)) return; // 裝備點一下（手指稍微動一點也算）就顯示說明
    if(d.kind==='item'){ tipItem=-1; const hit=unitAt(x,y)||(battle?null:null); if(hit){ const it=ME.items[d.i]; if(addItem(hit.u,it,ME)){ ME.items.splice(d.i,1); sfx('item'); } else say('這隻已經有 3 件裝備了'); } return; }
    const u=d.u;
    const bi=benchAt(x,y);
    if(bi>=0){ const other=ME.bench[bi]; if(d.from==='bench'){ ME.bench[bi]=u; ME.bench[d.i]=other; }
      else { if(!planning()) return; ME.board.splice(ME.board.indexOf(u),1); ME.bench[bi]=u; if(other){ other.c=u.c; other.r=u.r; ME.board.push(other); } } sfx('click'); return; }
    const h=hexAt(x,y); if(h&&h[1]>=4&&planning()){ const other=ME.board.find(b=>b.c===h[0]&&b.r===h[1]);
      if(d.from==='board'){ if(other){ other.c=u.c; other.r=u.r; } u.c=h[0]; u.r=h[1]; }
      else { if(!other&&ME.board.length>=ME.level){ say('上場人數已滿（等級 '+ME.level+' 可以上 '+ME.level+' 隻）'); return; }
        ME.bench[d.i]=other||null; if(other) ME.board.splice(ME.board.indexOf(other),1); u.c=h[0]; u.r=h[1]; ME.board.push(u); } sfx('place'); } }
  // 賣出：點萌獸後在資料框按「賣出」（戰鬥中只能賣備戰席上的）
  const ownWhere=u=>ME.bench.includes(u)?'bench':ME.board.includes(u)?'board':null;
  const canSell=u=>{ const w=ownWhere(u); return w==='bench'||w==='board'&&planning(); };
  function sellUnit(u){ const w=ownWhere(u); if(!w||!canSell(u)) return; if(w==='bench') ME.bench[ME.bench.indexOf(u)]=null; else ME.board.splice(ME.board.indexOf(u),1);
    ME.gold+=sellVal(u); ME.items.push(...u.it); sfx('pop'); say('賣掉 '+defOf(u.u).n+'，拿回 '+sellVal(u)+' 金幣',1.4); sel=null; }
  canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointermove',onMove); addEventListener('pointerup',onUp); canvas.style.touchAction='none';

  /* ----- 畫面 ----- */
  function btn(label,x,y,w,h,fn,dis,main){ btns.push({label,x,y,w,h,fn,dis,main}); }
  function drawBtns(){ for(const b of btns){ c.fillStyle=b.dis?'rgba(20,18,40,.6)':b.main?'#ffd23f':'#2b2759'; rr(c,b.x,b.y,b.w,b.h,9); c.fill(); c.strokeStyle='#0b0a1c'; c.lineWidth=2; c.stroke();
    c.fillStyle=b.dis?'#6b6799':b.main?'#14122b':'#fff'; c.font='900 13px '+TC; c.textAlign='center'; c.textBaseline='middle'; const L2=String(b.label).split('\n'); L2.forEach((s,i)=>c.fillText(s,b.x+b.w/2,b.y+b.h/2+(i-(L2.length-1)/2)*15+1)); } }
  function fpos(f){ const tr=r=>myFlip?ROWS-1-r:r,tc=cc=>myFlip?COLS-1-cc:cc,[x1,y1]=hexXY(tc(f.pc),tr(f.pr)),[x2,y2]=hexXY(tc(f.c),tr(f.r)),u=f.mv; return [lerp(x1,x2,u),lerp(y1,y2,u)]; }
  function drawBoard(){
    // 地面
    for(let r=0;r<ROWS;r++) for(let cc=0;cc<COLS;cc++){ const [x,y]=hexXY(cc,r),mine=r>=4; c.beginPath(); for(let k=0;k<6;k++){ const a=Math.PI/3*k+Math.PI/6; c.lineTo(x+Math.cos(a)*(HR-1.5),y+Math.sin(a)*(HR-1.5)); } c.closePath();
      c.fillStyle=mine?((cc+r)%2?'#3f7a4a':'#4a8a54'):phase==='fight'?((cc+r)%2?'#7a4a4a':'#8a5454'):'rgba(60,40,60,.5)'; c.fill(); c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=1; c.stroke(); }
    if(phase!=='fight'){ c.fillStyle='rgba(255,255,255,.25)'; c.font='900 18px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('對手的棋盤（戰鬥時出現）',480,BY+HH*1.5); }
    if(battle){ for(const f of battle.F){ if(!f.alive) continue; const [x,y]=fpos(f),own=(f.team===0)!==myFlip,d=f.d,ln=f.anim>0?Math.sin(f.anim/.2*Math.PI)*5:0;
        c.fillStyle=own?'rgba(80,160,255,.35)':'rgba(255,80,80,.35)'; c.beginPath(); c.ellipse(x,y+12,14,5,0,0,7); c.fill();
        drawCreature(c,x,y-ln*(own?1:-1),1.05,d,{t,ph:f.idx,flipX:!own,photo:d.photo,alpha:f.stun>0?.75:1});
        if(f.stun>0){ c.fillStyle='#ffd23f'; c.font='10px sans-serif'; c.textAlign='center'; c.fillText('✦ ✦',x,y-28); }
        if(f.shield>0){ c.strokeStyle='rgba(200,220,255,.8)'; c.lineWidth=2; c.beginPath(); c.arc(x,y,17,0,7); c.stroke(); }
        // 血條、魔力條
        const bw=30; c.fillStyle='#1a1530'; c.fillRect(x-bw/2-1,y-26,bw+2,8); c.fillStyle=own?'#5fd068':'#ff5d5d'; c.fillRect(x-bw/2,y-25,bw*clamp(f.hp/f.max,0,1),4);
        if(f.shield>0){ c.fillStyle='#e0e8ff'; c.fillRect(x-bw/2,y-25,bw*clamp(f.shield/f.max,0,1),4); }
        c.fillStyle='#3d9dff'; c.fillRect(x-bw/2,y-21,bw*(f.mmax?clamp(f.mana/f.mmax,0,1):0),2); stars(c,x,y-31,f.s); }
      for(const e of battle.fx){ const tr=r=>myFlip?ROWS-1-r:r,tc=cc=>myFlip?COLS-1-cc:cc;
        if(e.k==='num'){ const [x,y]=hexXY(tc(e.x),tr(e.y)); c.globalAlpha=1-e.t/.8; c.fillStyle=e.col; c.font='900 12px '+TC; c.textAlign='center'; c.strokeStyle='#1a1530'; c.lineWidth=3; c.strokeText(e.v,x,y-34-e.t*30); c.fillText(e.v,x,y-34-e.t*30); c.globalAlpha=1; }
        else if(e.k==='shot'){ const [x1,y1]=fpos(e.a),[x2,y2]=fpos(e.b),u=Math.min(1,e.t/.18); if(u<1){ c.fillStyle=e.col; c.beginPath(); c.arc(lerp(x1,x2,u),lerp(y1,y2,u)-6,e.big?6:3.5,0,7); c.fill(); } }
        else if(e.k==='ring'||e.k==='cast'||e.k==='poof'){ const [x,y]=hexXY(tc(e.x),tr(e.y)); c.globalAlpha=Math.max(0,1-e.t/.6); c.strokeStyle=e.col||'#fff'; c.lineWidth=e.k==='poof'?2:4;
          c.beginPath(); c.arc(x,y,e.k==='cast'?14+e.t*30:e.k==='poof'?10+e.t*40:(e.rad||1)*HW*(.3+e.t*1.2),0,7); c.stroke(); c.globalAlpha=1; } } }
    else { for(const u of ME.board){ if(drag&&drag.u===u) continue; const [x,y]=hexXY(u.c,u.r); drawUnitStatic(u,x,y,1.05); } } }
  function drawUnitStatic(u,x,y,s){ const d=defOf(u.u); drawCreature(c,x,y,s,d,{t,ph:x*.1,photo:d.photo}); stars(c,x,y-26*s,u.s);
    u.it.forEach((it,i)=>drawItemIcon(c,x-10+i*10,y+20,10,it)); if(sel===u){ c.strokeStyle='#ffd23f'; c.lineWidth=2; c.beginPath(); c.arc(x,y,20,0,7); c.stroke(); } }
  function drawBench(){ for(let i=0;i<9;i++){ const x=BENCH_X+i*54+27,y=BENCH_Y; c.fillStyle='rgba(11,10,28,.55)'; rr(c,x-25,y-25,50,50,8); c.fill(); c.strokeStyle='#3a3570'; c.lineWidth=1.5; c.stroke();
      const u=ME.bench[i]; if(u&&!(drag&&drag.u===u)) drawUnitStatic(u,x,y-2,.9); } }
  function drawShop(){
    c.fillStyle='rgba(11,10,28,.85)'; c.fillRect(0,SHOP_Y-8,W,H-SHOP_Y+8);
    const lock=ME.locked; for(let i=0;i<5;i++){ const id=ME.shop[i],x=CARD_X+i*(CARD_W+4),y=SHOP_Y;
      if(!id){ c.fillStyle='rgba(255,255,255,.05)'; rr(c,x,y,CARD_W,84,10); c.fill(); continue; }
      const d=defOf(id),col=['','#9aa0a8','#5fd068','#4f9dff','#c56bff','#ffd23f'][d.cost],can=ME.gold>=d.cost,own=all(ME).some(u=>u.u===id);
      c.fillStyle='#1d1a3a'; rr(c,x,y,CARD_W,84,10); c.fill(); c.strokeStyle=own?'#ffd23f':col; c.lineWidth=own?3:2; c.stroke();
      drawCreature(c,x+30,y+44,1.25,d,{t,ph:i,photo:d.photo});
      c.textAlign='left'; c.textBaseline='middle'; c.fillStyle=can?'#fff':'#8a86b0'; c.font='900 13px '+TC; c.fillText(d.n,x+56,y+18);
      const n3=d.tr.length>2; d.tr.forEach((tk,j)=>{ c.fillStyle=TRAITS[tk].col; c.font='700 '+(n3?10:11)+'px '+TC; c.fillText(TRAITS[tk].n,x+56+j*(n3?24:34),y+38); });
      c.fillStyle='#ffd23f'; c.font='900 13px '+TC; c.fillText('● '+d.cost,x+56,y+62); if(d.custom){ c.fillStyle='#ff9ec8'; c.font='900 10px '+TC; c.fillText('你的專屬',x+86,y+62); } }
    // 金幣、等級
    c.textAlign='left'; c.fillStyle='#ffd23f'; c.font='900 20px '+TC; c.fillText('● '+ME.gold,14,SHOP_Y+14);
    c.fillStyle='#fff'; c.font='700 12px '+TC; c.fillText('等級 '+ME.level+'　經驗 '+(ME.level>=9?'滿':ME.xp+'/'+xpNeed(ME)),14,SHOP_Y+38);
    c.fillStyle='#cfe8d8'; c.fillText('連'+(ME.streak>0?'勝 '+ME.streak:ME.streak<0?'敗 '+(-ME.streak):'勝敗 0')+'　利息 +'+Math.min(5,Math.floor(ME.gold/10)),14,SHOP_Y+56);
    const al=PL[me].alive; btn('升級\n● 4',140,SHOP_Y-2,54,44,()=>{ if(ME.gold<4) return say('金幣不夠'); if(ME.level>=9) return say('已經滿級'); ME.gold-=4; addXp(ME,4); sfx('click'); },!al||ME.gold<4||ME.level>=9);
    btn('刷新\n● 2',198,SHOP_Y-2,54,44,()=>{ if(ME.gold<2) return say('金幣不夠'); ME.gold-=2; ME.shop=rollShop(ME,ME.level,myCustom); sfx('rattle'); },!al||ME.gold<2);
    btn(lock?'🔒 已鎖':'鎖商店',140,SHOP_Y+46,112,30,()=>{ ME.locked=!ME.locked; },!al); }
  function drawTraits(){ const cnt=traitCount(ME.board,defOf),list=Object.keys(cnt).sort((a,b)=>traitLv(b,cnt[b])-traitLv(a,cnt[a])||cnt[b]-cnt[a]);
    c.fillStyle='rgba(11,10,28,.6)'; rr(c,8,46,190,390,10); c.fill(); c.fillStyle='#ffd23f'; c.font='900 14px '+TC; c.textAlign='left'; c.textBaseline='middle'; c.fillText('羈絆',18,62);
    list.slice(0,11).forEach((tk,i)=>{ const T=TRAITS[tk],n=cnt[tk],lv=traitLv(tk,n),y=88+i*32;
      c.fillStyle=lv?T.col:'#3a3570'; rr(c,16,y-12,24,24,6); c.fill(); c.fillStyle=lv?'#14122b':'#9a96c8'; c.font='900 11px '+TC; c.textAlign='center'; c.fillText(n,28,y);
      c.textAlign='left'; c.fillStyle=lv?'#fff':'#9a96c8'; c.font='900 12px '+TC; c.fillText(T.n+'　'+T.lv.map(v=>n>=v?'['+v+']':v).join(' / '),46,y-5);
      c.fillStyle=lv?'#cfe8d8':'#6b6799'; c.font='700 10px '+TC; let tx=lv?T.d[lv-1]:'差 '+(T.lv[0]-n)+' 隻：'+T.d[0]; while(c.measureText(tx).width>146&&tx.length>3) tx=tx.slice(0,-2)+'…'; c.fillText(tx,46,y+9); });
    if(!list.length){ c.fillStyle='#9a96c8'; c.font='700 12px '+TC; c.fillText('把萌獸拖上棋盤',18,90); c.fillText('相同羈絆會有加成',18,108); } }
  function drawPlayers(){ c.fillStyle='rgba(11,10,28,.6)'; rr(c,744,46,206,262,10); c.fill();
    const order=PL.slice().sort((a,b)=>(b.alive-a.alive)||b.hp-a.hp);
    order.forEach((p,k)=>{ const y=64+k*30,mine=p.i===me; c.fillStyle=mine?'rgba(255,210,63,.2)':'transparent'; rr(c,750,y-12,194,26,6); c.fill();
      c.textAlign='left'; c.textBaseline='middle'; c.fillStyle=p.alive?'#fff':'#6b6799'; c.font=(mine?'900 ':'700 ')+'12px '+TC; let nm=names[p.i]; if(nm.length>7) nm=nm.slice(0,7)+'…'; c.fillText(nm,756,y);
      c.fillStyle='#3a3670'; rr(c,856,y-5,60,10,5); c.fill(); c.fillStyle=p.hp>50?'#5fd068':p.hp>20?'#ffd23f':'#ff5d5d'; rr(c,856,y-5,60*clamp(p.hp,0,100)/100,10,5); c.fill();
      c.fillStyle='#fff'; c.textAlign='right'; c.font='900 11px '+TC; c.fillText(p.alive?Math.max(0,p.hp):'第'+p.place,944,y); }); }
  function drawItems(){ c.fillStyle='rgba(11,10,28,.6)'; rr(c,744,316,206,114,10); c.fill(); c.fillStyle='#ffd23f'; c.font='900 12px '+TC; c.textAlign='left'; c.textBaseline='middle'; c.fillText('裝備（拖到萌獸身上）',752,330);
    ME.items.forEach((it,i)=>{ if(drag&&drag.kind==='item'&&drag.i===i) return; drawItemIcon(c,762+(i%5)*38,354+Math.floor(i/5)*36,30,it); }); }
  // 裝備說明：滑鼠移到裝備上（手機點一下）就顯示名稱、效果、可以合成什麼
  function drawItemTip(){ if(drag&&Math.hypot(drag.x-drag.sx,drag.y-drag.sy)>=12) return;
    let i=itemAt(hoverX,hoverY); if(i<0) i=tipItem; if(i<0||i>=ME.items.length) return; const id=ME.items[i],ix=762+(i%5)*38,iy=354+Math.floor(i/5)*36;
    const lines=[]; lines.push(['t',itemName(id)+(COMP[id]?'（小裝備）':'（大裝備）')]); lines.push(['d',itemDesc(id)]);
    if(COMP[id]){ lines.push(['h','和其他小裝備合成：']); for(const o of COMP_IDS) lines.push(['c',COMP[o].n+' → '+COMBO[comboKey(id,o)].n+'：'+itemDesc(comboKey(id,o))]); }
    else lines.push(['h','由 '+id.split('+').map(p=>COMP[p].n).join(' ＋ ')+' 合成']);
    const w=300; c.font='700 11px '+TC; const rows=[]; for(const [k,txt] of lines){ let line=''; for(const ch of txt){ if(c.measureText(line+ch).width>w-20){ rows.push([k,line]); line=k==='c'?'　':''; line+=ch; } else line+=ch; } if(line) rows.push([k,line]); }
    const h=rows.length*16+14,x=744-w-8,y=clamp(iy-h/2,8,H-h-8);
    c.fillStyle='rgba(20,18,44,.97)'; rr(c,x,y,w,h,10); c.fill(); c.strokeStyle='#ffd23f'; c.lineWidth=2; c.stroke();
    rows.forEach(([k,txt],j)=>{ c.fillStyle=k==='t'?'#ffd23f':k==='h'?'#cfe8d8':k==='c'?'#d8d0ff':'#fff'; c.font=(k==='t'?'900 13px ':'700 11px ')+TC; c.textAlign='left'; c.textBaseline='middle'; c.fillText(txt,x+10,y+14+j*16); }); }
  function drawInfo(){ if(!sel) return; const d=defOf(sel.u); if(!d) return; const s=sel.s||1,x=8,y=46,w=190,h=390;
    c.fillStyle='rgba(20,18,44,.97)'; rr(c,x,y,w,h,10); c.fill(); c.strokeStyle='#ffd23f'; c.lineWidth=2; c.stroke();
    drawCreature(c,x+40,y+50,1.8,d,{t,photo:d.photo}); stars(c,x+40,y+18,s);
    c.textAlign='left'; c.textBaseline='middle'; c.fillStyle='#fff'; c.font='900 15px '+TC; c.fillText(d.n,x+76,y+32); c.fillStyle='#ffd23f'; c.font='900 12px '+TC; c.fillText('● '+d.cost+'　'+s+' 星',x+76,y+52);
    d.tr.forEach((tk,j)=>{ c.fillStyle=TRAITS[tk].col; c.font='900 11px '+TC; c.fillText(TRAITS[tk].n,x+76+j*36,y+70); });
    const m=STARM[s],f=sel.live,L2=[['生命',f?Math.round(f.hp)+'/'+Math.round(f.max):Math.round(d.hp*m)],['攻擊',Math.round(f?f.atk:d.atk*m)],['攻速',(f?f.as:d.as).toFixed(2)],['射程',d.rng],['護甲',Math.round(f?f.arm:d.arm)],['魔力',d.mana]];
    L2.forEach(([a,b],i)=>{ c.fillStyle='#9a96c8'; c.font='700 11px '+TC; c.fillText(a,x+12+(i%2)*90,y+100+Math.floor(i/2)*20); c.fillStyle='#fff'; c.fillText(String(b),x+46+(i%2)*90,y+100+Math.floor(i/2)*20); });
    c.fillStyle='#ffd23f'; c.font='900 12px '+TC; c.fillText('技能',x+12,y+172); wrap(SKILL_TXT[d.sk.t](d.sk),x+12,y+192,w-24,16,'#fff');
    const its=sel.it||[]; its.forEach((it,i)=>{ drawItemIcon(c,x+24,y+262+i*40,26,it); c.fillStyle='#fff'; c.font='900 11px '+TC; c.textAlign='left'; c.fillText(itemName(it),x+42,y+254+i*40); wrap(itemDesc(it),x+42,y+270+i*40,w-50,12,'#cfe8d8',10); });
    if(ownWhere(sel)&&PL[me].alive){ const ok=canSell(sel); btn(ok?'賣出 +'+sellVal(sel)+' 金幣':'戰鬥中不能賣',x+8,y+h-34,122,26,()=>sellUnit(sel),!ok,true); }
    btn('關閉',x+w-56,y+h-34,48,26,()=>{ sel=null; }); }
  function wrap(s,x,y,w,lh,col,fs){ c.fillStyle=col; c.font='700 '+(fs||12)+'px '+TC; c.textAlign='left'; let line=''; for(const ch of s){ if(c.measureText(line+ch).width>w){ c.fillText(line,x,y); y+=lh; line=ch; } else line+=ch; } if(line) c.fillText(line,x,y); }
  function draw(){
    btns=[];
    const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#2a2050'); g.addColorStop(1,'#141030'); c.fillStyle=g; c.fillRect(0,0,W,H);
    // 上方：回合、階段、時間
    c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#fff'; c.font='900 16px '+TC;
    const ph=phase==='plan'?(isPve(round)?'準備：這回合打野怪':'準備階段'):phase==='fight'?(battle?'對戰：'+battle.opp:'觀戰中'):'等待其他玩家…';
    c.fillText('第 '+roundLabel(round)+' 回合　'+ph,480,18);
    if(phase==='plan'||phase==='fight'){ const dur=phase==='plan'?phDur:fightInfo?fightInfo.dur:1,u=clamp(1-phT/dur,0,1),left=Math.max(0,Math.ceil(dur-phT)); // 倒數秒數
      c.fillStyle='rgba(11,10,28,.7)'; rr(c,812,6,138,34,10); c.fill(); c.fillStyle=phase==='plan'&&left<=5?'#ff5d5d':'#fff'; c.font='900 17px '+TC; c.textAlign='center'; c.fillText((phase==='plan'?'準備 ':'戰鬥 ')+left+' 秒',881,24); }
    else if(phase==='wait'){ c.fillStyle='rgba(11,10,28,.7)'; rr(c,812,6,138,34,10); c.fill(); c.fillStyle='#cfe8d8'; c.font='900 13px '+TC; c.textAlign='center'; c.fillText('等待其他玩家…',881,24); }
    drawBoard(); drawBench(); drawShop(); drawTraits(); drawPlayers(); drawItems(); drawInfo();
    if(phase==='plan'&&PL[me].alive) btn(readyHum.has(me)?'等待其他人…':'準備好了，開打！',744,BENCH_Y-12,206,40,()=>{ readyHum.add(me); if(client){ sendBoard(); net.send({t:'ready'}); } },readyHum.has(me),true);
    c.fillStyle='#cfe8d8'; c.font='700 11px '+TC; c.textAlign='center'; c.fillText('上場 '+ME.board.length+' / '+ME.level+'　點萌獸可以看資料、賣出',480,BENCH_Y-36);
    drawBtns();
    // 拖曳中的東西
    if(drag&&Math.hypot(drag.x-drag.sx,drag.y-drag.sy)>=6){ if(drag.kind==='item') drawItemIcon(c,drag.x,drag.y,32,ME.items[drag.i]); else { const d=defOf(drag.u.u); drawCreature(c,drag.x,drag.y,1.2,d,{t,photo:d.photo}); } }
    if(phase==='fight'&&battle&&battle.over){ const win=battle.over.win!==-1&&(battle.over.win===0)!==myFlip; c.fillStyle=win?'#86dc4f':'#ff8a8a'; c.font='900 30px '+TC; c.textAlign='center'; c.strokeStyle='#1a1530'; c.lineWidth=6; const s2=battle.over.win===-1?'平手':win?'勝利！':'輸了…'; c.strokeText(s2,480,BY+HH*3.5); c.fillText(s2,480,BY+HH*3.5); }
    if(!PL[me].alive&&!ended){ c.fillStyle='rgba(11,10,28,.7)'; c.fillRect(260,180,440,80); c.fillStyle='#ffd23f'; c.font='900 20px '+TC; c.textAlign='center'; c.fillText('你被淘汰了（第 '+PL[me].place+' 名），繼續觀戰…',480,220); }
    drawItemTip();
    if(msgT>0&&msg){ c.font='900 15px '+TC; c.textAlign='center'; const w=c.measureText(msg).width+30; c.fillStyle='rgba(180,30,50,.92)'; rr(c,480-w/2,BENCH_Y-80,w,34,12); c.fill(); c.fillStyle='#fff'; c.fillText(msg,480,BENCH_Y-63); }
  }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('pointermove',onMove); removeEventListener('pointerup',onUp); },
    _dbg:{ME,PL,get round(){return round;},get phase(){return phase;},get battle(){return battle;},buy,addItem,Battle,defOf,boardOut,ready(){ readyHum.add(me); }}};
}

/* ---------- 開始畫面、縮圖、造型預覽 ---------- */
function scene(ctx,w,h,t,team){ const k=w/480;
  const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#2a2050'); g.addColorStop(1,'#141030'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  for(let r=0;r<4;r++) for(let cc=0;cc<8;cc++){ const x=w*.12+cc*w*.11+(r&1?w*.055:0),y=h*.3+r*h*.16; ctx.fillStyle=r<2?'#8a5454':'#4a8a54'; ctx.beginPath(); for(let i=0;i<6;i++){ const a=Math.PI/3*i+Math.PI/6; ctx.lineTo(x+Math.cos(a)*26*k,y+Math.sin(a)*26*k); } ctx.fill(); }
  team.forEach((id,i)=>{ const d=UNITS.find(u=>u.id===id)||UNITS[0],r=i<3?0:3,cc=1+(i%3)*2+(r&1?0:0),x=w*.12+cc*w*.11+(r===1||r===3?w*.055:0)+Math.sin(t*2+i)*4*k,y=h*.3+r*h*.16;
    drawCreature(ctx,x,y,1.5*k,d,{t,ph:i,flipX:i<3}); }); }
function stageShow(ctx,w,h,si,t){ scene(ctx,w,h,t,[['bubble','lavarat','marsh','sprout','canbear','starcat'],['whale','meteor','coral','spark','shroom','gearfox'],['phoenix','dragon','owl','panda','mechwhale','pudding']][si]);
  const k=w/480; ctx.fillStyle='rgba(11,10,28,.75)'; rr(ctx,8,8,w*.5,32*k,10); ctx.fill(); ctx.fillStyle='#ffd23f'; ctx.font='900 '+Math.round(16*k)+'px '+TC; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('電腦強度：'+['輕鬆','普通','困難'][si],18,8+16*k); }
function thumb(ctx,w,h,t){ scene(ctx,w,h,t,['dragon','meteor','whale','panda','choco','starcat']); const k=w/480;
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.15)+'px '+TC; ctx.lineWidth=7; ctx.strokeStyle='#1a1530'; ctx.strokeText('萌獸戰棋',w/2,h*.14); ctx.fillStyle='#ffd23f'; ctx.fillText('萌獸戰棋',w/2,h*.14); }
function preview(ctx,w,h,L,t){ const k=w/480; const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#2a2050'); g.addColorStop(1,'#141030'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  const o=ORIGINS.includes(L.corg)?L.corg:'forest',cl=CLASSES.includes(L.ccls)?L.ccls:'warrior';
  const d=Object.assign({look:{body:L.ccol||'#ffd23f',ear:L.cear||'cat',acc:'crown'},k:cl,cost:3,tr:[o,cl]},BASE[cl]);
  ctx.fillStyle='#4a8a54'; ctx.beginPath(); ctx.ellipse(w*.32,h*.72,90*k,26*k,0,0,7); ctx.fill();
  drawCreature(ctx,w*.32,h*.52,4.2*k,d,{t,photo:L.face});
  ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle='#fff'; ctx.font='900 '+Math.round(24*k)+'px '+TC; ctx.fillText(L.cname||'我的萌獸',w*.6,h*.24);
  ctx.fillStyle=TRAITS[o].col; ctx.font='900 '+Math.round(16*k)+'px '+TC; ctx.fillText(TRAITS[o].n+'・'+TRAITS[cl].n,w*.6,h*.38);
  ctx.fillStyle='#ffd23f'; ctx.font='900 '+Math.round(14*k)+'px '+TC; ctx.fillText('● 3 費・你專屬',w*.6,h*.5);
  ctx.fillStyle='#cfe8d8'; ctx.font='700 '+Math.round(13*k)+'px '+TC; const sk=SKILL_TXT[CLASS_SKILL[cl].t](CLASS_SKILL[cl]); let line='',y=h*.64; for(const ch of '技能：'+sk){ if(ctx.measureText(line+ch).width>w*.36){ ctx.fillText(line,w*.6,y); y+=18*k; line=ch; } else line+=ch; } ctx.fillText(line,w*.6,y);
  if(!L.face){ ctx.fillStyle='#ff9ec8'; ctx.font='900 '+Math.round(13*k)+'px '+TC; ctx.textAlign='center'; ctx.fillText('上傳照片，臉就會換成照片',w*.32,h*.9); } }

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).chess={_draw:drawCreature,_units:UNITS,
  name:'萌獸戰棋',tag:'CUTE AUTO CHESS',color:'#c56bff',online:true,maxPlayers:8,
  desc:'8 人自走棋：買萌獸、三隻合成升星、湊羈絆、合成裝備，自動對戰活到最後。還能上傳照片做出自己專屬的萌獸！',
  goal:'每回合在商店買萌獸、拖上棋盤，三隻一樣的會自動合成升星；相同羈絆湊到 2、4 隻有加成；裝備拖到萌獸身上，兩個小裝備會合成大裝備。戰鬥自動進行，輸了扣血（階段基礎傷害＋對方存活萌獸數），100 點血扣完就淘汰，活到最後的是第一名。',
  stages:['輕鬆','普通','困難'],stageLabel:'電腦強度',
  stageGoal:si=>['輕鬆：電腦亂買亂擺、升級慢，適合先熟悉規則。','普通：電腦會湊羈絆、存利息、照時間升級。','困難：電腦每回合多 1 金幣，後期會刷商店找升星，很難纏。'][si]+'　每回合買萌獸、拖上棋盤，三隻一樣的自動升星；相同羈絆湊 2／4 隻有加成；裝備拖到萌獸身上，兩件小裝備會合成大裝備。第 1 階段（1-1～1-3）打野怪，之後每階段第 7 回合也打野怪，會掉裝備。輸了扣血＝階段基礎傷害（第 1 階段 0、第 2 階段 2、第 3 階段 5、第 4 階段 8、第 5 階段 10、第 6 階段 12、第 7 階段起 17）＋對方還活著的萌獸數（一隻 1 點，最多 10 點，星數和費用不影響），100 血扣完就淘汰。每回合準備 20 秒。',
  help:[['點商店卡片','買萌獸（三隻一樣自動升星）'],['拖曳萌獸','上棋盤、回備戰席'],['點萌獸','看能力、技能、裝備，也可以按「賣出」'],['拖曳裝備','裝到萌獸身上；兩件小裝備合成大裝備'],['滑鼠移到裝備','看裝備名稱、效果和可以合成什麼（手機點一下）'],['升級／刷新','4 金幣買 4 經驗；2 金幣換一批商店'],['準備好了','不用等時間到，直接開打']],
  touch:null,
  looks:[{key:'face',label:'萌獸照片',type:'photo',hint:'上傳人或動物的照片，你的專屬萌獸臉就會換成這張照片。'},
    {key:'cname',label:'萌獸名字',type:'text',max:6,def:'我的萌獸'},
    {key:'corg',label:'出身羈絆',opts:ORIGINS.map(o=>({id:o,label:TRAITS[o].n}))},
    {key:'ccls',label:'職業羈絆',opts:CLASSES.map(o=>({id:o,label:TRAITS[o].n}))},
    {key:'cear',label:'耳朵',opts:[{id:'cat',label:'貓耳'},{id:'rabbit',label:'兔耳'},{id:'bear',label:'熊耳'},{id:'dog',label:'狗耳'},{id:'horn',label:'小角'},{id:'antenna',label:'觸角'},{id:'none',label:'沒有'}]},
    {key:'ccol',label:'身體顏色',type:'color',opts:['#ffd23f','#ff9ec8','#7fd6ff','#b8e986','#c8b0ff','#ffb04a','#f4f4f4','#8a5a3a']}],
  best:{label:'最佳名次',fmt:v=>'第 '+v+' 名',lower:true},
  stageShow,thumb,preview,create
};
})();
