// 熱血棒球：九人制，可選 3、5、7、9 局。投打自己操作，守備和跑壘由電腦依規則處理。
// 規則：三好球三振、四壞球保送、兩好球後界外不計、三出局攻守交換、封殺與觸殺、高飛接殺與回壘待跑、
//       全壘打、後攻領先時最後半局不打、再見得分、平手延長（最多加 3 局）。
// 距離單位是英呎：本壘 (0,0)，一壘 (63.6,63.6)，二壘 (0,127.3)，三壘 (-63.6,63.6)。
// 連線時房主負責運算（客隊先攻），加入的人是主隊；投球與揮棒在自己的畫面判定後再送出。
(function(){
'use strict';
const W=480,H=300,ZX=240,ZY=196,ZW=34,ZH=44;
const PIX='"Press Start 2P","Noto Sans TC","Microsoft JhengHei",monospace';
const TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
// 球種：球速（公里）、進壘前的位移（好球帶寬高各為 2 單位，x 右為正、y 上為正）、飛行秒數、控球誤差
const PITCH=[
  {id:'ff',name:'四縫線直球',kmh:150,bx:0,by:.18,T:.86,err:.2},
  {id:'sl',name:'滑球',kmh:135,bx:-.95,by:-.2,T:.96,err:.27},
  {id:'cu',name:'曲球',kmh:120,bx:-.35,by:-1.25,T:1.1,err:.3},
  {id:'ch',name:'變速球',kmh:128,bx:.25,by:-.55,T:1.04,err:.24},
  {id:'fk',name:'指叉球',kmh:138,bx:0,by:-1.35,T:.94,err:.32},
  {id:'si',name:'伸卡球',kmh:143,bx:.8,by:-.5,T:.9,err:.26}
];
const B1=63.64,BASE=[[0,0],[B1,B1],[0,B1*2],[-B1,B1],[0,0]];
const FPOS=[[0,60.5],[0,-6],[52,78],[30,128],[-52,78],[-30,128],[-140,230],[0,290],[140,230]]; // 投捕一二三游左中右
const FNAME=['投手','捕手','一壘手','二壘手','三壘手','游擊手','左外野','中外野','右外野'];
const STAGES=[{name:'海風隊',col:'#3d8bff',lv:.25},{name:'沙漠隊',col:'#e0a030',lv:.4},{name:'冰原隊',col:'#7fd0e8',lv:.55},{name:'叢林隊',col:'#3fae5a',lv:.7},{name:'鋼鐵隊',col:'#8a8fa8',lv:.85},{name:'冠軍隊',col:'#c56bff',lv:1}];
const HOMEN=['小虎','阿強','阿烈','大山','鐵門','阿明','小傑','阿凱','阿翔'],AWAYN=['飛毛','阿盾','射手','老牆','門神','阿風','小岩','阿浪','阿雷'];
const clamp=(v,a,b)=>v<a?a:v>b?b:v,rnd=()=>Math.random(),gauss=()=>(rnd()+rnd()+rnd()-1.5)/.87;
const fence=th=>330+70*Math.cos(th*2); // 全壘打牆：邊線 330 呎、中外野 400 呎
const guy=function(){ if(window.ARCADE_GUY) window.ARCADE_GUY.apply(null,arguments); };

function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,two=!net&&opts.mode==='2p',vs=two||(!!net&&net.count>1),me=net?Math.min(1,net.me):1;
  const N=+(opts.variant||3)||3,si=opts.stage||0,foe=STAGES[si],lv=vs?.6:foe.lv,L=opts.look||{color:'#ff5d4f',hair:'1',grass:'#4c9a3c',bg:'stadium'};
  const {ctx}=env.canvas2d(W,H);
  // 單人：你是主隊（後攻），電腦是客隊。雙人：左邊 WASD 是客隊、右邊方向鍵是主隊。連線：房主客隊、加入者主隊。
  const lookOf=tm=>net&&net.looks?net.looks[tm===0?0:1]:null;
  const cols=vs?[(lookOf(0)||{}).color||'#3d8bff',(lookOf(1)||L).color||L.color]:[foe.col,L.color]; if(cols[0]===cols[1]) cols[0]=cols[1]==='#3d8bff'?'#ffd23f':'#3d8bff';
  const tname=net&&net.names?[net.names[0]||'客隊',net.names[1]||(vs?'主隊':foe.name)]:vs?['客隊','主隊']:[foe.name,opts.name||'你的隊伍'];
  if(net&&!vs){ tname[0]=foe.name; tname[1]=net.names&&net.names[0]||'你'; }
  const ctl=tm=>net?(client?(tm===1?'k0':'net'):(vs?(tm===0?'k0':'net'):(tm===1?'k0':'ai'))):two?(tm===0?'k1':'k2'):(tm===1?'k0':'ai');
  const mkTeam=(names,k)=>names.map((n,i)=>({name:n,con:k*(.9+((i*7)%5)*.05),pow:k*(.85+((i*3)%5)*.08),spd:23+((i*5)%4)*1.2}));
  const cpuK=.75+lv*.4,teams=vs?[mkTeam(AWAYN,1),mkTeam(HOMEN,1)]:[mkTeam(AWAYN,cpuK),mkTeam(HOMEN,1)];
  // 共用的顯示狀態：房主算出來，連線時整包傳給另一邊
  const S={inn:1,half:0,outs:0,b:0,s:0,sc:[0,0],bases:[0,0,0],phase:'sel',bat:0,ord:[0,0],line:[[],[]],pit:null,last:'',ban:'',banT:0,fld:null,swing:0,hits:[0,0]};
  let t=0,ended=false,selT=0,tx=0,ty=0,ptype=0,cx=0,cy=0,swung=null,pitT=0,resT=0,pend=null,fl=null,runners=[],ev=[],sendT=0,remoteSw=undefined,remotePc=null,sentSw=false,fx=[];
  const sfx=n=>{ env.sfx(n); if(net&&net.host) ev.push(n); };
  const banner=(s,sec)=>{ S.ban=s; S.banT=sec||1.3; };
  const batTeam=()=>S.half,fldTeam=()=>1-S.half,batter=()=>teams[S.half][S.ord[S.half]%9];
  const mine=tm=>{ const c=ctl(tm); return c!=='ai'&&c!=='net'; };

  /* ---- 輸入 ---- */
  function keys(c){
    const K=env.keys,Sx=c==='k1'?['KeyW','KeyS','KeyA','KeyD','KeyF','KeyG']:c==='k2'?['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Comma','Period']:null;
    if(Sx) return {mx:(K[Sx[3]]?1:0)-(K[Sx[2]]?1:0),my:(K[Sx[0]]?1:0)-(K[Sx[1]]?1:0),a:env.hit(Sx[4]),b:env.hit(Sx[5])};
    return {mx:(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0),my:(K.ArrowUp||K.KeyW?1:0)-(K.ArrowDown||K.KeyS?1:0),a:env.hit('KeyJ')||env.hit('Space'),b:env.hit('KeyK')};
  }

  /* ---- 一個打席 ---- */
  function beginSel(){ S.phase='sel'; selT=0; S.pit=null; swung=null; remoteSw=undefined; remotePc=null; sentSw=false; S.swing=0; S.fld=null; tx=0; ty=0; }
  function throwPitch(type,ax,ay){ // 房主：加上控球誤差後丟出去
    const p=PITCH[type],human=ctl(fldTeam())!=='ai',e=p.err*(human?1:1.25-lv*.5);
    const fx_=clamp(ax+gauss()*e,-2.1,2.1),fy=clamp(ay+gauss()*e,-2.1,2.1),kmh=Math.round(p.kmh+gauss()*3);
    S.pit={type,ax:fx_,ay:fy,T:p.T,kmh}; pitT=0; S.phase='pitch'; swung=null; S.last=p.name+' '+kmh+' km/h'; sfx('place');
    if(net&&net.host) net.send({pit:[type,fx_,fy,kmh]});
    if(ctl(batTeam())==='ai'){ // 電腦打者：先決定要不要揮、揮得準不準
      const b=batter(),inZ=Math.abs(fx_)<=1&&Math.abs(fy)<=1,out=Math.max(Math.abs(fx_),Math.abs(fy))-1;
      const go=inZ?rnd()<.72+lv*.1:rnd()<clamp(.5-lv*.28-out*.5,.03,.6);
      swung=go?{dt:gauss()*(.085-.04*lv)/b.con,cx:fx_+gauss()*(.6-.3*lv),cy:fy+gauss()*(.6-.3*lv),at:p.T}:null; }
  }
  function resolve(sw){ // 這一球的結果
    const p=S.pit,b=batter(),inZ=Math.abs(p.ax)<=1&&Math.abs(p.ay)<=1;
    if(!sw){ if(inZ) strike('好球！'); else ball(); return; }
    const pe=Math.hypot(sw.cx-p.ax,sw.cy-p.ay),q=1-Math.abs(sw.dt)/.14*.55-pe*.72+(b.con-1)*.2;
    if(Math.abs(sw.dt)>.14||q<=0){ strike('揮棒落空！',true); return; }
    const sa=sw.dt/.14*38+gauss()*9,la=10+(p.ay-sw.cy)*36+gauss()*9,evo=clamp(62+54*q*b.pow+gauss()*4,45,116);
    if(q<.2||Math.abs(sa)>45){ sfx('land'); if(S.s<2) S.s++; banner('界外',.9); nextPitch(1); return; }
    sfx('boom'); startField(evo,la,sa);
  }
  function strike(txt,sw){ S.s++; sfx(sw?'bump':'click'); if(S.s>=3){ banner('三振出局！',1.3); out(1); endBat(); } else { banner(txt,.9); nextPitch(1); } }
  function ball(){ S.b++; if(S.b>=4){ banner('四壞球保送',1.3); walk(); endBat(); } else { banner('壞球',.8); nextPitch(.9); } }
  function nextPitch(d){ S.phase='result'; resT=d; pend='pitch'; }
  function endBat(){ S.phase='result'; resT=1.4; pend='bat'; }
  function out(n){ S.outs+=n; }
  function addRun(n){ if(n<=0) return; S.sc[S.half]+=n; S.line[S.half][S.inn-1]=(S.line[S.half][S.inn-1]||0)+n; sfx('win'); for(let i=0;i<30;i++){ const a=rnd()*6.283,v=80+rnd()*160; fx.push({x:W/2,y:120,vx:Math.cos(a)*v,vy:Math.sin(a)*v-50,life:1,col:['#ffd23f','#ff5d8f','#3ddbd9','#fff'][i%4]}); } }
  function walk(){ const bs=S.bases; if(bs[0]){ if(bs[1]){ if(bs[2]) addRun(1); bs[2]=bs[1]; } bs[1]=bs[0]; } bs[0]=S.ord[S.half]%9+1; }
  function afterBat(){
    S.ord[S.half]++; S.b=0; S.s=0;
    const walkOff=S.half===1&&S.inn>=N&&S.sc[1]>S.sc[0];
    if(walkOff){ finish(); return; }
    if(S.outs>=3){ // 攻守交換
      if(S.line[S.half][S.inn-1]==null) S.line[S.half][S.inn-1]=0;
      S.outs=0; S.bases=[0,0,0];
      if(S.half===0){ if(S.inn>=N&&S.sc[1]>S.sc[0]){ finish(); return; } S.half=1; }  // 後攻領先，最後半局不用打
      else { if(S.inn>=N&&(S.sc[0]!==S.sc[1]||S.inn>=N+3)){ finish(); return; } S.inn++; S.half=0; }
      banner((S.inn>N?'延長 ':'')+S.inn+' 局'+(S.half?'下':'上')+'　'+tname[S.half]+' 進攻',1.8); S.phase='result'; resT=1.8; pend='sel'; return;
    }
    beginSel();
  }
  function finish(){
    if(ended) return; ended=true; S.phase='over';
    const w=S.sc[0]===S.sc[1]?-1:S.sc[0]>S.sc[1]?0:1,win=two||w===me;
    if(net&&net.host){ net.send(snap()); net.send({end:1}); }
    conclude(w,win);
  }
  function conclude(w,win){
    ended=true; env.sfx(w<0?'lose':win?'win':'lose');
    const n=Math.max(S.inn,S.line[0].length),row=tm=>'<tr><th>'+tname[tm]+'</th>'+Array.from({length:n},(_,i)=>'<td>'+(S.line[tm][i]==null?(tm===1&&i===n-1?'X':'-'):S.line[tm][i])+'</td>').join('')+'<td><b>'+S.sc[tm]+'</b></td><td>'+S.hits[tm]+'</td></tr>';
    env.end({title:w<0?'平手':two?tname[w]+' 獲勝':win?'你贏了！':'你輸了',big:S.sc[0]+' : '+S.sc[1],
      html:'<table class="ls"><tr><th></th>'+Array.from({length:n},(_,i)=>'<td>'+(i+1)+'</td>').join('')+'<td>分</td><td>安</td></tr>'+row(0)+row(1)+'</table>',
      text:w<0?'延長賽也沒有分出勝負。':'',score:!vs&&!net&&w===1?si+1:null,next:!vs&&!net&&w===1&&si<STAGES.length-1});
  }

  /* ---- 球打出去之後：守備與跑壘 ---- */
  const basePos=k=>BASE[k%4===0?0:k];
  function rpos(r){ const a=Math.floor(Math.min(r.prog,3.999)),f=r.prog-a,A=BASE[a],B=BASE[a+1]; return [A[0]+(B[0]-A[0])*f,A[1]+(B[1]-A[1])*f]; }
  function startField(evo,la,sa){
    // 先把球的整條路徑算出來，再看哪個守備員最早攔得到
    const v0=evo*1.467,a=la*Math.PI/180,th=sa*Math.PI/180,dx=Math.sin(th),dy=Math.cos(th);
    let vh=v0*Math.cos(a),vz=v0*Math.sin(a),r=1,z=3,tt=0,landT=null,hr=false,wall=false; const path=[];
    for(;tt<9;tt+=.02){
      path.push([tt,dx*r,dy*r,z]);
      if(z>0||vz>0){ vh*=Math.exp(-.2*.02); vz-=32*.02; z+=vz*.02; if(z<=0){ z=0; if(landT==null) landT=tt; if(vz<-9){ vz=-vz*.34; vh*=.72; } else vz=0; } }
      else vh*=Math.exp(-1.15*.02);
      r+=vh*.02;
      const fr=fence(th); if(r>=fr&&!wall){ if(z>10&&landT==null){ hr=true; path.push([tt+.02,dx*(fr+30),dy*(fr+30),z]); break; } wall=true; r=fr-1; vh=-vh*.25; }
      if(landT!=null&&Math.abs(vh)<2.5&&z===0) break;
    }
    const F=FPOS.map((p,i)=>({i,x:p[0],y:p[1],tx:p[0],ty:p[1],spd:i>=6?24:21}));
    let best=null,bt=1e9,bi=0;
    if(!hr) for(const f of F) for(let k=4;k<path.length;k++){ const s=path[k]; if(s[3]>7.5) continue; if(s[0]>=bt) break;
      if(Math.hypot(f.x-s[1],f.y-s[2])-4<=f.spd*Math.max(0,s[0]-(f.i===0?.7:f.i>=6?.55:.42))){ best=f; bt=s[0]; bi=k; break; } }
    if(!best&&!hr){ best=F[7]; bi=path.length-1; bt=path[bi][0]+Math.hypot(F[7].x-path[bi][1],F[7].y-path[bi][2])/27; }
    const fly=!hr&&landT!=null&&bt<=landT+.03&&la>4||(!hr&&landT==null);
    if(best){ best.tx=path[bi][1]; best.ty=path[bi][2]; }
    // 補位：誰去守哪個壘包
    const cover=[1,2,5,4]; if(best){ if(best.i===2) cover[1]=0; if(best.i===5) cover[2]=3; if(best.i===4) cover[3]=5; if(best.i===1) cover[0]=0; if(best.i===0&&cover[1]===0) cover[1]=3; }
    [0,1,2,3].forEach(k=>{ const f=F[cover[k]]; if(f!==best){ f.tx=BASE[k][0]; f.ty=BASE[k][1]; } });
    // 跑者：壘上的人加上打者
    const bt_=batter(); runners=[];
    for(let k=2;k>=0;k--) if(S.bases[k]) runners.push({from:k+1,prog:k+1,target:k+1,state:'on',spd:teams[S.half][S.bases[k]-1].spd,id:S.bases[k],forced:false});
    const br={from:0,prog:0,target:1,state:'run',spd:bt_.spd,id:S.ord[S.half]%9+1,forced:true,bat:true}; runners.push(br);
    const occ=k=>runners.some(r=>!r.bat&&r.from===k);
    if(hr){ for(const r of runners){ r.target=4; r.state='run'; r.spd=72; } }
    else if(fly&&bt>1.5&&S.outs<2){ /* 高飛球：壘上跑者先回壘等接殺 */ }
    else if(!fly||S.outs>=2){ let f=true; for(let k=1;k<=3;k++){ const r=runners.find(q=>!q.bat&&q.from===k); if(r){ r.forced=f; r.target=k+1; r.state='run'; } else f=false; } }
    S.bases=[0,0,0];
    fl={path,bi,bt,F,best,fly,hr,t:0,mode:'path',holder:null,hold:0,thr:null,cover,runs:0,lastForce:false,dead:0,bx:0,by:0,bz:3,catchD:best?Math.hypot(path[bi][1],path[bi][2]):0,br,msg:false};
    S.phase='field'; banner(hr?'全壘打！！':'',2); if(hr){ sfx('win'); }
  }
  function decideThrow(){ // 拿到球的人決定傳哪個壘
    const h=fl.holder,run=runners.filter(r=>r.state==='run');
    if(!run.length){ fl.dead+=.016; return; }
    let pick=null,pb=-1,lead=null;
    for(const r of run){ const tArr=(r.target-r.prog)*90/r.spd,bp=basePos(r.target),d=Math.hypot(h.x-bp[0],h.y-bp[1]); if(!lead||r.target>lead.target) lead=r;
      if(d<5){ tagOut(r); return; }
      if(.12+d/105<tArr&&r.target>pb){ pick=r; pb=r.target; } }
    const tg=pick||lead,bp=basePos(tg.target),d=Math.hypot(h.x-bp[0],h.y-bp[1]);
    if(!pick&&d<40){ fl.hold=.2; return; }
    fl.mode='throw'; fl.thr={fx:h.x,fy:h.y,base:tg.target,t:0,T:Math.max(.15,d/105)}; fl.holder=null; sfx('place');
  }
  function tagOut(r){ r.state='out'; out(1); fl.lastForce=!!r.forced; banner('出局！',1.1); sfx('hurt'); fl.hold=.3; }
  function stepField(dt){
    const f=fl; f.t+=dt;
    for(const q of f.F){ const dx=q.tx-q.x,dy=q.ty-q.y,d=Math.hypot(dx,dy); if(d>.5){ const m=Math.min(d,q.spd*dt); q.x+=dx/d*m; q.y+=dy/d*m; } }
    if(f.mode==='path'){
      const p=f.path; let k=Math.min(p.length-1,Math.floor(f.t/.02)); f.bx=p[k][1]; f.by=p[k][2]; f.bz=p[k][3];
      if(f.hr){ if(f.t>p[p.length-1][0]+.3) f.mode='gone'; }
      else if(f.t>=f.bt){ // 守備員拿到球
        f.best.x=f.best.tx; f.best.y=f.best.ty; f.holder=f.best; f.mode='held'; f.hold=.5; f.bx=f.best.x; f.by=f.best.y; f.bz=4; sfx('item');
        if(f.fly){ f.br.state='out'; out(1); f.lastForce=true; banner(f.catchD>150?'高飛接殺！':'接殺！',1.1);
          if(S.outs<3) for(const r of runners){ if(r.state!=='on') continue; if(r.from===3&&f.catchD>200){ r.target=4; r.state='run'; } else if(r.from===2&&f.catchD>285){ r.target=3; r.state='run'; } } } // 回壘待跑
      }
    } else if(f.mode==='held'){
      f.bx=f.holder.x; f.by=f.holder.y; f.bz=4; f.hold-=dt; if(f.hold<=0) decideThrow();
    } else if(f.mode==='throw'){
      const th=f.thr,bp=basePos(th.base); th.t+=dt; const u=Math.min(1,th.t/th.T); f.bx=th.fx+(bp[0]-th.fx)*u; f.by=th.fy+(bp[1]-th.fy)*u; f.bz=5+Math.sin(u*Math.PI)*8;
      if(u>=1){ const c=f.F[f.cover[th.base%4]]; c.x=bp[0]; c.y=bp[1]; c.tx=bp[0]; c.ty=bp[1]; f.holder=c; f.mode='held'; f.hold=.28; sfx('land');
        for(const r of runners) if(r.state==='run'&&r.target===th.base&&r.prog<r.target-.015){ tagOut(r); break; } }
    }
    // 跑壘
    for(const r of runners.slice().sort((a,b)=>b.prog-a.prog)){
      if(r.state!=='run') continue;
      r.prog=Math.min(r.target,r.prog+r.spd/90*dt);
      if(r.prog>=r.target){
        if(r.target>=4){ r.state='home'; f.runs++; sfx('item'); continue; }
        // 到壘之後要不要多跑一個壘
        const nx=r.target+1,blocked=runners.some(q=>q!==r&&(q.state==='on'&&Math.round(q.prog)===nx||q.state==='run'&&q.target===nx));
        let go=f.hr;
        if(!go&&!blocked&&!f.fly){ const need=90/r.spd,bp=basePos(nx);
          if(f.mode==='path') go=f.bt-f.t+Math.hypot(f.best.tx-bp[0],f.best.ty-bp[1])/118+.45>need+.25;
          else if(f.mode==='held') go=Math.hypot(f.holder.x-bp[0],f.holder.y-bp[1])/118+.3>need+.5;
          else go=false; }
        if(go){ r.target=nx; r.forced=false; } else r.state='on';
      }
    }
    if(S.outs>=3||f.mode==='gone'&&!runners.some(r=>r.state==='run')||(f.mode==='held'&&!runners.some(r=>r.state==='run')&&(f.dead+=dt)>.7)) endPlay();
  }
  function endPlay(){
    const f=fl; let runs=f.runs;
    if(S.outs>=3&&f.lastForce) runs=0; // 第三個出局是封殺或接殺，這一球得的分不算
    if(S.outs<3||runs>0){ for(const r of runners) if(r.state==='on'||r.state==='run'){ const b=Math.round(r.state==='run'?r.target:r.prog); if(b>=1&&b<=3) S.bases[b-1]=r.id; } }
    addRun(runs);
    const br=f.br,reach=br.state==='home'?4:br.state==='out'?0:Math.round(br.prog);
    if(reach>0){ S.hits[S.half]++; banner(f.hr?'全壘打！'+(runs>1?runs+' 分':''):['','一壘安打','二壘安打','三壘安打','場內全壘打'][reach]+(runs?'　得 '+runs+' 分':''),1.5); }
    else if(runs) banner('得 '+runs+' 分',1.3);
    fl=null; endBat();
  }

  /* ---- 連線 ---- */
  function snap(){
    const m={s:[S.inn,S.half,S.outs,S.b,S.s,S.sc[0],S.sc[1],S.bases[0]?1:0,S.bases[1]?1:0,S.bases[2]?1:0,S.phase,S.ord[0],S.ord[1],S.ban,Math.round(S.banT*10)/10,S.last,S.swing,S.hits[0],S.hits[1]],l:S.line,e:ev};
    if(fl) m.f=[fl.F.map(q=>[Math.round(q.x),Math.round(q.y)]),runners.filter(r=>r.state==='run'||r.state==='on').map(r=>{ const p=rpos(r); return [Math.round(p[0]),Math.round(p[1])]; }),[Math.round(fl.bx),Math.round(fl.by),Math.round(fl.bz)]];
    ev=[]; return m;
  }
  if(net){
    if(client) net.onmsg=m=>{
      if(m.s){ const a=m.s,ph=S.phase; S.inn=a[0]; S.half=a[1]; S.outs=a[2]; S.b=a[3]; S.s=a[4]; S.sc=[a[5],a[6]]; S.bases=[a[7],a[8],a[9]]; S.phase=a[10]; S.ord=[a[11],a[12]]; S.ban=a[13]; S.banT=a[14]; S.last=a[15]; S.swing=a[16]; S.hits=[a[17],a[18]]; S.line=m.l;
        S.fld=m.f||null; if(S.phase==='sel'&&ph!=='sel'){ selT=0; tx=ty=0; cx=cy=0; sentSw=false; S.pit=null; }
        for(const n of m.e) env.sfx(n); }
      if(m.pit){ S.pit={type:m.pit[0],ax:m.pit[1],ay:m.pit[2],T:PITCH[m.pit[0]].T,kmh:m.pit[3]}; pitT=0; swung=null; sentSw=false; }
      if(m.end) conclude(S.sc[0]===S.sc[1]?-1:S.sc[0]>S.sc[1]?0:1,(S.sc[0]===S.sc[1]?-1:S.sc[0]>S.sc[1]?0:1)===me);
    };
    else {
      net.onmsg=(m,from)=>{ if(from!==1) return; if(m.pc) remotePc=m.pc; if(m.sw!==undefined) remoteSw=m.sw; };
      net.onleave=i=>{ if(i===1&&!ended&&vs){ S.sc[0]=Math.max(S.sc[0],S.sc[1]+1); finish(); } };
    }
  }

  /* ---- 每一格 ---- */
  function pitcherUI(c,dt){ // 回傳 true 表示丟出去了
    const k=keys(c); tx=clamp(tx+k.mx*2.3*dt,-1.7,1.7); ty=clamp(ty+k.my*2.3*dt,-1.7,1.7);
    if(k.b){ ptype=(ptype+1)%PITCH.length; env.sfx('click'); }
    return k.a&&selT>.35;
  }
  function batterUI(c,dt){
    const k=keys(c); cx=clamp(cx+k.mx*2.8*dt,-1.6,1.6); cy=clamp(cy+k.my*2.8*dt,-1.6,1.6);
    if(k.a&&!swung&&S.pit&&S.phase==='pitch'){ swung={dt:pitT-S.pit.T,cx,cy,at:pitT}; S.swing=.3; env.sfx('land'); return true; }
    return false;
  }
  function update(dt){
    t+=dt; if(S.banT>0) S.banT-=dt; if(S.swing>0) S.swing-=dt;
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.life-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=240*dt; if(f.life<=0) fx.splice(i,1); }
    if(client){ // 另一邊：只處理自己的投球選擇和揮棒
      selT+=dt; if(S.pit) pitT+=dt;
      if(S.phase==='sel'&&fldTeam()===me){ if(pitcherUI('k0',dt)){ net.send({pc:[ptype,tx,ty]}); selT=-9; } }
      if(S.phase==='pitch'&&batTeam()===me&&S.pit){ if(batterUI('k0',dt)){ net.send({sw:[swung.dt,swung.cx,swung.cy]}); sentSw=true; } else if(!sentSw&&pitT>S.pit.T+.2){ net.send({sw:0}); sentSw=true; } }
      else { const k=keys('k0'); cx=clamp(cx+k.mx*2.8*dt,-1.6,1.6); cy=clamp(cy+k.my*2.8*dt,-1.6,1.6); }
      return;
    }
    if(ended) return;
    if(S.phase==='sel'){
      selT+=dt; const c=ctl(fldTeam()),bc=ctl(batTeam());
      if(mine(batTeam())){ const k=keys(bc); cx=clamp(cx+k.mx*2.8*dt,-1.6,1.6); cy=clamp(cy+k.my*2.8*dt,-1.6,1.6); }
      if(c==='ai'){ if(selT>.9){ const zone=rnd()<.62+lv*.08,e=zone?.55+rnd()*.4:1.1+rnd()*.35; throwPitch(Math.floor(rnd()*PITCH.length),(rnd()<.5?-1:1)*e*(rnd()<.7?1:.3),(rnd()<.5?-1:1)*e*(rnd()<.7?1:.3)); } }
      else if(c==='net'){ if(remotePc){ throwPitch(clamp(remotePc[0]|0,0,5),clamp(+remotePc[1]||0,-1.7,1.7),clamp(+remotePc[2]||0,-1.7,1.7)); remotePc=null; } }
      else if(pitcherUI(c,dt)) throwPitch(ptype,tx,ty);
    } else if(S.phase==='pitch'){
      pitT+=dt; const bc=ctl(batTeam()),T=S.pit.T;
      if(mine(batTeam())) batterUI(bc,dt);
      if(ctl(fldTeam())!=='ai'&&mine(fldTeam())){ /* 投手這時不用操作 */ }
      if(bc==='ai'&&swung&&pitT>=T+swung.dt&&S.swing<=0&&!swung.shown){ swung.shown=true; S.swing=.3; }
      if(bc==='net'){ if(remoteSw!==undefined&&pitT>=T){ const sw=remoteSw?{dt:clamp(+remoteSw[0]||0,-1,1),cx:+remoteSw[1]||0,cy:+remoteSw[2]||0}:null; if(sw) S.swing=.3; resolve(sw); } else if(pitT>T+1.2) resolve(null); }
      else if(pitT>=T+.16) resolve(swung);
    } else if(S.phase==='field'){ stepField(dt); if(fl) S.fld=[fl.F.map(q=>[q.x,q.y]),runners.filter(r=>r.state==='run'||r.state==='on').map(rpos),[fl.bx,fl.by,fl.bz]]; }
    else if(S.phase==='result'){ resT-=dt; if(resT<=0){ const p=pend; pend=null; if(p==='pitch') beginSel(); else if(p==='bat') afterBat(); else beginSel(); } }
    if(net&&!ended){ sendT-=dt; if(sendT<=0){ sendT=1/20; net.send(snap()); } }
  }

  /* ---- 畫面 ---- */
  function bgTop(){
    if(L.bg==='night'){ ctx.fillStyle='#14143a'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#fff'; for(let i=0;i<40;i++) ctx.fillRect((i*97)%W,36+(i*31)%50,1.5,1.5); }
    else { ctx.fillStyle=L.bg==='sunset'?'#ffb37a':'#8fd3ff'; ctx.fillRect(0,0,W,H); }
    ctx.fillStyle=L.bg==='night'?'#23234f':'#5a5f7a'; ctx.fillRect(0,58,W,52);
    for(let r=0;r<3;r++) for(let i=0;i<40;i++){ ctx.fillStyle=['#ff5d4f','#ffd23f','#3ddbd9','#fff','#ff7eb6','#86dc4f'][(i*7+r*3)%6]; ctx.fillRect(i*12+(r%2)*6,64+r*14+Math.sin(t*6+i*1.7+r)*1.5,7,8); }
    ctx.fillStyle='#2f6f3a'; ctx.fillRect(0,106,W,8);
  }
  function drawPitchView(){
    bgTop(); ctx.fillStyle=L.grass; ctx.fillRect(0,112,W,H-112);
    ctx.fillStyle='#c8924a'; ctx.beginPath(); ctx.ellipse(W/2,150,46,10,0,0,7); ctx.fill(); ctx.beginPath(); ctx.moveTo(110,H); ctx.lineTo(370,H); ctx.lineTo(300,232); ctx.lineTo(180,232); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(222,268); ctx.lineTo(258,268); ctx.lineTo(258,278); ctx.lineTo(240,288); ctx.lineTo(222,278); ctx.fill();
    const p=S.pit,u=p?pitT/p.T:0,fc=cols[fldTeam()],bc=cols[batTeam()];
    guy(ctx,W/2,150,0,1,fc,(S.half+1)%4,p&&u<.25?2:0,t);
    // 好球帶
    ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=2; ctx.strokeRect(ZX-ZW,ZY-ZH,ZW*2,ZH*2); ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=1;
    for(let i=1;i<3;i++){ ctx.beginPath(); ctx.moveTo(ZX-ZW+i*ZW*2/3,ZY-ZH); ctx.lineTo(ZX-ZW+i*ZW*2/3,ZY+ZH); ctx.moveTo(ZX-ZW,ZY-ZH+i*ZH*2/3); ctx.lineTo(ZX+ZW,ZY-ZH+i*ZH*2/3); ctx.stroke(); }
    // 打者與球棒
    ctx.save(); ctx.translate(ZX-76,276); ctx.scale(2.1,2.1); guy(ctx,0,0,0,1,bc,(S.half+2)%4,0,t); ctx.restore();
    const sw=S.swing>0?1-S.swing/.3:0,ba=-2.2+sw*3.4; ctx.save(); ctx.translate(ZX-56,ZY+18); ctx.rotate(ba); ctx.fillStyle='#14122b'; ctx.fillRect(-2,-3.5,54,7); ctx.fillStyle='#e8c890'; ctx.fillRect(0,-2.5,50,5); ctx.restore();
    const showBat=mine(batTeam())||client&&batTeam()===me,showPit=(mine(fldTeam())||client&&fldTeam()===me)&&S.phase==='sel';
    if(showBat&&(S.phase==='sel'||S.phase==='pitch')){ const x=ZX+cx*ZW,y=ZY-cy*ZH; ctx.strokeStyle='#ffd23f'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(x,y,11,0,7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x-15,y); ctx.lineTo(x+15,y); ctx.moveTo(x,y-15); ctx.lineTo(x,y+15); ctx.stroke(); }
    if(showPit){ const x=ZX+tx*ZW,y=ZY-ty*ZH; ctx.strokeStyle='#3ddbd9'; ctx.lineWidth=2; ctx.strokeRect(x-7,y-7,14,14); ctx.beginPath(); ctx.moveTo(x-11,y); ctx.lineTo(x+11,y); ctx.moveTo(x,y-11); ctx.lineTo(x,y+11); ctx.stroke();
      ctx.fillStyle='rgba(11,10,28,.8)'; ctx.fillRect(W-118,118,112,PITCH.length*15+22); ctx.textAlign='left'; ctx.textBaseline='middle';
      PITCH.forEach((q,i)=>{ ctx.font=(i===ptype?'900 ':'700 ')+'11px '+TC; ctx.fillStyle=i===ptype?'#ffd23f':'#aaa4d8'; ctx.fillText((i===ptype?'▶ ':'　')+q.name,W-112,128+i*15); });
      ctx.font='700 9px '+TC; ctx.fillStyle='#6fd3ff'; ctx.fillText('換球種　丟球',W-112,128+PITCH.length*15+2); }
    // 球：一開始偏離位移量，越接近本壘越彎進去
    if(p&&S.phase==='pitch'){ const q=PITCH[p.type],uu=Math.min(1.15,u),fxp=ZX+p.ax*ZW,fyp=ZY-p.ay*ZH,bxp=q.bx*ZW,byp=-q.by*ZH,k=Math.min(1,uu);
      const x=W/2+(fxp-bxp-W/2)*k+bxp*k*k,y=128+(fyp-byp-128)*k+byp*k*k,r=2+7*Math.pow(k,1.6);
      ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x,160+110*k,r,r*.35,0,0,7); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill(); ctx.strokeStyle='#e23b3b'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(x,y,r*.7,t*20,t*20+2); ctx.stroke(); }
    else if(p&&S.phase==='result'){ const x=ZX+p.ax*ZW,y=ZY-p.ay*ZH; ctx.fillStyle='rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(x,y,8,0,7); ctx.fill(); }
  }
  const FS=.6,fpx=(x,y,z)=>[W/2+x*FS,274-y*FS-(z||0)*FS*.55];
  function drawFieldView(){
    ctx.fillStyle='#2f6f3a'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle=L.grass; ctx.beginPath(); const h0=fpx(0,0); ctx.moveTo(h0[0],h0[1]); for(let i=-45;i<=45;i+=3){ const th=i*Math.PI/180,r=fence(th),q=fpx(Math.sin(th)*r,Math.cos(th)*r); ctx.lineTo(q[0],q[1]); } ctx.fill();
    ctx.strokeStyle='#ffd23f'; ctx.lineWidth=3; ctx.beginPath(); for(let i=-45;i<=45;i+=3){ const th=i*Math.PI/180,r=fence(th),q=fpx(Math.sin(th)*r,Math.cos(th)*r); i===-45?ctx.moveTo(q[0],q[1]):ctx.lineTo(q[0],q[1]); } ctx.stroke();
    ctx.fillStyle='#c8924a'; ctx.beginPath(); const c2=fpx(0,62); ctx.ellipse(c2[0],c2[1],64,58,0,0,7); ctx.fill();
    ctx.fillStyle=L.grass; ctx.beginPath(); [[0,12],[B1-10,B1],[0,B1*2-12],[-B1+10,B1]].forEach((b,i)=>{ const q=fpx(b[0],b[1]); i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]); }); ctx.fill();
    ctx.fillStyle='#c8924a'; const m=fpx(0,60.5); ctx.beginPath(); ctx.ellipse(m[0],m[1],8,6,0,0,7); ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; for(const s of [-1,1]){ const e=fpx(s*330*.707,330*.707); ctx.beginPath(); ctx.moveTo(h0[0],h0[1]); ctx.lineTo(e[0],e[1]); ctx.stroke(); }
    ctx.fillStyle='#fff'; for(let k=0;k<4;k++){ const q=fpx(BASE[k][0],BASE[k][1]); ctx.fillRect(q[0]-3.5,q[1]-3.5,7,7); }
    const F=S.fld; if(!F) return;
    const list=[]; F[0].forEach((q,i)=>list.push({x:q[0],y:q[1],c:cols[fldTeam()],h:i%4})); F[1].forEach((q,i)=>list.push({x:q[0],y:q[1],c:cols[batTeam()],h:(i+2)%4,run:1}));
    list.sort((a,b)=>b.y-a.y);
    for(const o of list){ const q=fpx(o.x,o.y); ctx.save(); ctx.translate(q[0],q[1]); ctx.scale(.5,.5); guy(ctx,0,0,0,o.x>0?-1:1,o.c,o.h,o.run?1:0,t+o.x); ctx.restore(); }
    const b=F[2],sh=fpx(b[0],b[1]),bp=fpx(b[0],b[1],b[2]); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(sh[0],sh[1],3.5,1.5,0,0,7); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(bp[0],bp[1],3,0,7); ctx.fill(); ctx.strokeStyle='#14122b'; ctx.lineWidth=1; ctx.stroke();
  }
  function draw(){
    if(S.phase==='field'&&S.fld) drawFieldView(); else drawPitchView();
    // 計分列
    ctx.fillStyle='rgba(11,10,28,.88)'; ctx.fillRect(0,0,W,34); ctx.textBaseline='middle';
    ctx.textAlign='left'; ctx.font='700 11px '+TC; ctx.fillStyle='#ffd23f'; ctx.fillText((S.inn>N?'延長 ':'')+S.inn+' 局'+(S.half?'下':'上'),8,10);
    ctx.fillStyle='#aaa4d8'; ctx.fillText('打者 '+(S.ord[S.half]%9+1)+' 棒 '+batter().name,8,25);
    for(let tm=0;tm<2;tm++){ const x=118+tm*96; ctx.fillStyle=cols[tm]; ctx.fillRect(x,6+0,6,22); ctx.fillStyle=S.half===tm?'#fff':'#aaa4d8'; ctx.font='700 10px '+TC; ctx.textAlign='left'; ctx.fillText(tname[tm].slice(0,5),x+10,10); ctx.font='13px '+PIX; ctx.fillStyle='#fff'; ctx.fillText(String(S.sc[tm]),x+10,24); }
    const lamp=(lbl,n,max,col,y)=>{ ctx.font='9px '+PIX; ctx.textAlign='left'; ctx.fillStyle='#aaa4d8'; ctx.fillText(lbl,316,y); for(let i=0;i<max;i++){ ctx.fillStyle=i<n?col:'#2b2759'; ctx.beginPath(); ctx.arc(334+i*11,y,4,0,7); ctx.fill(); } };
    lamp('B',S.b,3,'#86dc4f',7); lamp('S',S.s,2,'#ffd23f',17); lamp('O',S.outs,2,'#ff5d8f',27);
    const dx=396,dy=17; [[0,10],[10,0],[0,-10],[-10,0]].forEach((q,i)=>{ if(i===0) return; const on=S.bases[i-1]; ctx.save(); ctx.translate(dx+q[0],dy+q[1]-0); ctx.rotate(Math.PI/4); ctx.fillStyle=on?'#ffd23f':'#2b2759'; ctx.fillRect(-4.5,-4.5,9,9); ctx.restore(); });
    ctx.textAlign='right'; ctx.font='700 10px '+TC; ctx.fillStyle='#fff'; ctx.fillText(S.last,W-8,S.last.length>9?10:17);
    const who=S.phase==='sel'?(mine(fldTeam())||client&&fldTeam()===me?'選位置和球種，按「投／打」丟球':mine(batTeam())||client&&batTeam()===me?'移動球棒，球到時按「投／打」揮棒':''):'';
    if(who){ ctx.textAlign='center'; ctx.font='700 12px '+TC; ctx.lineWidth=4; ctx.strokeStyle='#14122b'; ctx.strokeText(who,W/2,48); ctx.fillStyle='#fff'; ctx.fillText(who,W/2,48); }
    for(const f of fx){ ctx.globalAlpha=Math.max(0,f.life); ctx.fillStyle=f.col; ctx.fillRect(f.x-2,f.y-2,4,4); } ctx.globalAlpha=1;
    if(S.banT>0&&S.ban){ ctx.textAlign='center'; ctx.font='900 26px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#14122b'; ctx.strokeText(S.ban,W/2,84); ctx.fillStyle='#ffd23f'; ctx.fillText(S.ban,W/2,84); }
  }
  banner('1 局上　'+tname[0]+' 進攻',1.6);
  return {update,draw,destroy(){},_dbg:{S,teams,get fl(){return fl;},get runners(){return runners;},hit:(e,l,s)=>startField(e,l,s),resolve,throwPitch}};
}

function scene(ctx,w,h,L,t){
  ctx.save(); ctx.scale(w/W,w/W);
  ctx.fillStyle=L.bg==='night'?'#14143a':L.bg==='sunset'?'#ffb37a':'#8fd3ff'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#5a5f7a'; ctx.fillRect(0,40,W,46);
  for(let r=0;r<3;r++) for(let i=0;i<40;i++){ ctx.fillStyle=['#ff5d4f','#ffd23f','#3ddbd9','#fff','#ff7eb6','#86dc4f'][(i*7+r*3)%6]; ctx.fillRect(i*12+(r%2)*6,46+r*13,7,8); }
  ctx.fillStyle=L.grass; ctx.fillRect(0,86,W,H-86); ctx.fillStyle='#c8924a'; ctx.beginPath(); ctx.ellipse(W/2,126,50,11,0,0,7); ctx.fill(); ctx.beginPath(); ctx.moveTo(110,H); ctx.lineTo(370,H); ctx.lineTo(300,200); ctx.lineTo(180,200); ctx.fill();
  guy(ctx,W/2,126,0,1,'#3d8bff',1,(t%1.6)<.3?2:0,t);
  ctx.save(); ctx.translate(160,250); ctx.scale(2.1,2.1); guy(ctx,0,0,0,1,L.color,+L.hair||0,0,t); ctx.restore();
  const u=(t%1.6)/1.6; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(W/2+Math.sin(u*3)*6,126+u*70,2+u*6,0,7); ctx.fill();
  ctx.restore();
}
const preview=(ctx,w,h,L,t)=>scene(ctx,w,h,L,t);
const thumb=(ctx,w,h,t)=>{ ctx.save(); ctx.translate(0,-10); scene(ctx,w,h,{color:'#ff5d4f',hair:'1',grass:'#4c9a3c',bg:'stadium'},t); ctx.restore(); };

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).baseball={
  name:'熱血棒球',tag:'BASEBALL',color:'#ff7eb6',online:true,maxPlayers:2,
  desc:'九人制棒球，投打自己來，守備和跑壘自動進行。六種常見球種，照正式規則打 3、5、7 或 9 局。可單人、兩人同一台，或開房間連線。',
  goal:'投球：移動準星選位置，換球種後丟球。打擊：把球棒移到球會進來的位置，球到本壘的瞬間揮棒。三好球三振、四壞球保送、三出局攻守交換。',
  stages:STAGES.map(s=>s.name),stars:[1,2,3,3,4,5],
  variants:[{id:'3',label:'3 局'},{id:'5',label:'5 局'},{id:'7',label:'7 局'},{id:'9',label:'9 局'}],
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['↑ ↓ ← →','移動球棒或投球準星'],['J','投球／揮棒'],['K','換球種（投球時）'],['W A S D F G','雙人客隊：移動、投打、換球種'],['↑ ↓ ← → , .','雙人主隊：移動、投打、換球種']],
  touchHelp:[['方向盤','移動球棒或投球準星'],['投／打','投球或揮棒'],['球種','投球時換球種']],
  touch:{left:'dpad',right:[{l:'球種',c:'KeyK'},{l:'投／打',c:'KeyJ',act:true}]},
  looks:[{key:'color',label:'隊服顏色',type:'color',opts:['#ff5d4f','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#b98cff','#ff7eb6']},
    {key:'hair',label:'人物造型',opts:[{id:'1',label:'飛機頭'},{id:'0',label:'短髮'},{id:'2',label:'馬尾'},{id:'3',label:'帽子'}]},
    {key:'grass',label:'草地顏色',type:'color',opts:['#4c9a3c','#3f8f6a','#7fae3c','#5a8fb0','#8a7fc0','#b9965a']},
    {key:'bg',label:'遊戲背景',opts:[{id:'stadium',label:'白天'},{id:'sunset',label:'黃昏'},{id:'night',label:'夜晚'}]}],
  best:{label:'已打敗',fmt:v=>v+' / '+STAGES.length+' 隊',lower:false},
  preview,thumb,create
};
})();
