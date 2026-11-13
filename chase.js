// 城市飆風追緝：俯視寫實台灣城市開車任務。快遞、計程車、追捕、停車、救護車、護送六種任務共 30 關。
// 方向鍵＝畫面上的方向（按反方向會煞車迴轉）；空白鍵氮氣（走路時是跑步）；F 上下車／換車。單人或同機雙人（左右分割畫面）。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,PI=Math.PI;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k;
const wrapA=a=>{ a=(a+PI)%TAU; if(a<0) a+=TAU; return a-PI; };
function mul(seed){ let a=seed>>>0||1; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hash(a,b,c){ let h=Math.imul(a|0,374761393)+Math.imul(b|0,668265263)+Math.imul((c|0)+1,1442695041)|0; h=Math.imul(h^h>>>13,1274126177); h^=h>>>16; return (h>>>0)/4294967296; }
function rr(c,x,y,w,h,r){ r=Math.min(r,w/2,h/2); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function shade(h,k){ const n=parseInt(h.slice(1),16),f=v=>clamp(Math.round(k>1?v+(255-v)*(k-1):v*k),0,255); return 'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')'; }
const pick=(R,a)=>a[Math.floor(R()*a.length)];

/* ---------- 城市尺寸：一格 400（路寬 140、人行道 30），1 公尺＝10 單位 ---------- */
const P=400,HR=70,SW=30,NB=10,WS=NB*P,KL=.0032,TSC=1.5,S3=3,KMH=.36,LO=-HR,HI=WS+HR;
const RN_H=['中山路','中正路','民生路','民權路','信義路','仁愛路','忠孝路','和平路','復興路','光復路','建國路','中華路','南京路','林森路','延平路','港口路','海岸路','科技路','研發路','夜市街','老街路','山腳路'];
const RN_V=['自由路','博愛路','成功路','文化路','公園路','民族路','勝利路','大同路','三民路','五福路','長春路','重慶路','新生路','環河路','漁港路','碼頭街','園區二路','創新路','廟口街','福德街','坪頂路','茶山路'];
const DIST=[
  {n:'舊城區',seed:11,mix:[['bld',.64],['park',.08],['lot',.1],['temple',.11],['school',.07]],tall:[12,24],row:.8},
  {n:'商業區',seed:23,mix:[['bld',.74],['park',.08],['lot',.12],['temple',.03],['school',.03]],tall:[24,96],row:.2},
  {n:'河濱區',seed:37,mix:[['bld',.56],['park',.2],['lot',.12],['temple',.05],['school',.07]],tall:[14,42],row:.55},
  {n:'新市鎮',seed:53,mix:[['bld',.62],['park',.14],['lot',.12],['temple',.04],['school',.08]],tall:[20,72],row:.3},
  {n:'港口區',seed:61,mix:[['bld',.42],['port',.32],['lot',.14],['park',.06],['temple',.06]],tall:[10,34],row:.55,rn:11,mrt:['港埠站','漁人碼頭站','海關站']},
  {n:'科學園區',seed:73,mix:[['bld',.64],['park',.24],['lot',.08],['school',.04]],tall:[34,120],row:0,rn:16,mrt:['園區站','研發中心站','創新站']},
  {n:'夜市商圈',seed:89,mix:[['bld',.76],['lot',.08],['temple',.08],['park',.04],['school',.04]],tall:[12,30],row:.92,rn:7,market:1,mrt:['夜市站','廟口站','商圈站']},
  {n:'山城老街',seed:97,mix:[['bld',.58],['park',.2],['temple',.14],['school',.04],['lot',.04]],tall:[8,18],row:.95,rn:18,mrt:['老街站','山腳站','茶園站']}];
DIST[0].mrt=['火車站','市政府站','城隍廟站']; DIST[1].mrt=['百貨站','金融站','世貿站']; DIST[2].mrt=['河濱站','大橋站','公園站']; DIST[3].mrt=['新市鎮站','體育館站','高鐵站'];
const THEMES=[
  {n:'白天',dark:0,tint:null,rain:0,lights:0,grip:1},
  {n:'黃昏',dark:.3,tint:'rgba(255,128,50,.17)',rain:0,lights:1,grip:1},
  {n:'陰雨',dark:.36,tint:'rgba(60,80,110,.2)',rain:1,lights:1,grip:.62},
  {n:'夜晚',dark:.74,tint:'rgba(20,30,80,.12)',rain:0,lights:1,grip:1}];
const WALL={ware:['#8a9aa8','#a8a49a','#7a8a7a','#b0a890'],cont:['#c8402e','#2a6ab8','#e8a020','#2a8a5a','#8a3a8a','#d8d8d0','#3a4a6a','#c86a2a'],old:['#d9d2c3','#c9c1b4','#e1d9cc','#b9b0a2','#d4bfae','#a8b4b8','#cfc7a8','#bfb6c6'],mid:['#d6d2c9','#c2bcb2','#b5aea4','#cfc8bb','#a9b1b5','#dcd5c6'],tower:['#5d7686','#4f6a7a','#7b8f9a','#6a7c74','#8a96a6']};
const SHOPS=['小吃','藥局','牙醫','補習班','便利商店','咖啡','五金行','診所','早餐店','麵店','機車行','檳榔','手機','銀行','眼鏡','飲料','火鍋','卡拉OK','旅社','髮廊','當鋪','鞋店','中藥行','書局','照相館','房屋仲介','自助餐','水電行','珍珠奶茶','滷味','麵包店','洗衣店'];
const SIGNC=[['#c8202a','#fff'],['#1d4fa8','#fff'],['#f2c21c','#a8101a'],['#1b7a3a','#fff'],['#ffffff','#c8202a'],['#e85a12','#fff'],['#6a2a8a','#ffe86a'],['#111','#ffd23f']];
const WORLDS={};
function getWorld(di){ if(WORLDS[di]) return WORLDS[di];
  const D=DIST[di],R=mul(D.seed*7919+5),B=[];
  const hp=[1+Math.floor(R()*3),5+Math.floor(R()*3)],pp=[6+Math.floor(R()*3),1+Math.floor(R()*3)];
  const mkB=(b,x0,y0,x1,y1,ht,kind,o)=>{ o=o||{}; const bd={x0,y0,x1,y1,ht,kind,wall:o.wall||pick(R,WALL[kind]||WALL.mid),seed:Math.floor(R()*1e9),signs:[],cv:null}; b.blds.push(bd); b.rects.push([x0,y0,x1,y1]);
    if(kind==='old'||kind==='mid'||kind==='tower'){ const n=(kind==='old'?(R()<.85?1:2):kind==='mid'?1+Math.floor(R()*3):Math.floor(R()*2))*(D.market?2:1); for(let k=0;k<n;k++){ const sc=pick(R,SIGNC),vert=R()<.55&&kind!=='tower'; bd.signs.push({f:pick(R,['N','S','E','W']),u:.1+R()*.62,w:vert?.12+R()*.08:.3+R()*.3,t0:vert?.12:.04,t1:vert?.42+R()*.25:.17,bg:sc[0],fg:sc[1],txt:pick(R,SHOPS),v:vert}); } }
    return bd; };
  for(let j=0;j<NB;j++) for(let i=0;i<NB;i++){
    const x0=i*P+HR,y0=j*P+HR,x1=(i+1)*P-HR,y1=(j+1)*P-HR; let type;
    if(i===hp[0]&&j===hp[1]) type='hosp'; else if(i===pp[0]&&j===pp[1]) type='police'; else { let r=R(); type='bld'; for(const [k,p] of D.mix){ if(r<p){ type=k; break; } r-=p; } }
    const b={i,j,x0,y0,x1,y1,type,blds:[],rects:[],circs:[],trees:[],spots:[],parked:[],scoot:[],lamps:[],paths:[],pond:null,name:null};
    const ix0=x0+SW,iy0=y0+SW,ix1=x1-SW,iy1=y1-SW;
    /* 人行道樹與路燈 */
    const side=(fn)=>{ for(const s of [0,1,2,3]) fn(s); };
    side(s=>{ for(let u=34;u<=(x1-x0)-34;u+=58+Math.floor(R()*16)){ if(R()<.3) continue; const p=s===0?[x0+u,y0+7]:s===1?[x1-7,y0+u]:s===2?[x1-u,y1-7]:[x0+7,y1-u]; b.trees.push({x:p[0],y:p[1],r:13+R()*7,v:Math.floor(R()*6)}); b.circs.push([p[0],p[1],4.5]); } });
    for(const p of [[x0+4,y0+4],[x1-4,y0+4],[x1-4,y1-4],[x0+4,y1-4],[(x0+x1)/2,y0+4],[(x0+x1)/2,y1-4],[x0+4,(y0+y1)/2],[x1-4,(y0+y1)/2]]) b.lamps.push({x:p[0],y:p[1],ax:p[0]<x0+10?-1:p[0]>x1-10?1:0,ay:p[1]<y0+10?-1:p[1]>y1-10?1:0});
    if(type==='bld'){
      if(R()<D.row){ const mid=(iy0+iy1)/2; for(const [ya,yb] of [[iy0,mid-3],[mid+3,iy1]]){ let x=ix0; while(x<ix1-8){ let w=24+Math.floor(R()*18); if(ix1-x<w+20) w=ix1-x; const ht=D.tall[0]+R()*(D.tall[1]-D.tall[0])*.6; mkB(b,x,ya,x+w,yb,ht,'old'); x+=w; } } }
      else { const lots=[]; const split=(r,dp)=>{ const w=r[2]-r[0],h=r[3]-r[1]; if(dp>=2||(w<100&&h<100)||(dp>=1&&R()<.3)){ lots.push(r); return; } const gap=R()<.4?8:0; if(w>=h){ const m=r[0]+w*(.36+R()*.28); split([r[0],r[1],m-gap/2,r[3]],dp+1); split([m+gap/2,r[1],r[2],r[3]],dp+1); } else { const m=r[1]+h*(.36+R()*.28); split([r[0],r[1],r[2],m-gap/2],dp+1); split([r[0],m+gap/2,r[2],r[3]],dp+1); } };
        split([ix0,iy0,ix1,iy1],0);
        for(const r of lots){ if(R()<.1&&lots.length>2){ b.paths.push(r); continue; } const big=(r[2]-r[0])*(r[3]-r[1])>9000,tw=D.tall[1]>60&&big&&R()<.6; const ht=tw?D.tall[1]*(.55+R()*.45):D.tall[0]+R()*(D.tall[1]-D.tall[0])*.7; const ins=R()<.5?0:3; mkB(b,r[0]+ins,r[1]+ins,r[2]-ins,r[3]-ins,ht,tw?'tower':'mid'); } }
      /* 騎樓前整排機車 */
      side(s=>{ if(R()<.3) return; const len=x1-x0,u0=40+R()*(len-150),n=4+Math.floor(R()*9); for(let k=0;k<n;k++){ const u=u0+k*8.5; if(u>len-40) break; const p=s===0?[x0+u,y0+22,PI/2]:s===1?[x1-22,y0+u,PI]:s===2?[x1-u,y1-22,-PI/2]:[x0+22,y1-u,0]; b.scoot.push({x:p[0],y:p[1],a:p[2]+(R()-.5)*.15,c:pick(R,['#e8e8e8','#c8202a','#1d4fa8','#222','#8ab0d0','#f2c21c','#6a6a6a']),h:pick(R,['#fff','#222','#c8202a','#f2c21c','#4a7ab8'])}); }
        const a=s===0?[x0+u0-4,y0+16,x0+u0+n*8.5,y0+28]:s===1?[x1-28,y0+u0-4,x1-16,y0+u0+n*8.5]:s===2?[x1-u0-n*8.5,y1-28,x1-u0+4,y1-16]:[x0+16,y1-u0-n*8.5,x0+28,y1-u0+4]; b.rects.push(a); });
    } else if(type==='park'){
      const cx=(x0+x1)/2+(R()-.5)*50,cy=(y0+y1)/2+(R()-.5)*50; b.pond={x:cx,y:cy,rx:38+R()*20,ry:26+R()*14}; b.circs.push([cx,cy,Math.min(b.pond.rx,b.pond.ry)+4]);
      if(R()<.7){ mkB(b,ix0+10,iy1-46,ix0+44,iy1-12,6,'pav',{wall:'#a8432c'}); }
      for(let k=0;k<16;k++){ const x=ix0+R()*(ix1-ix0),y=iy0+R()*(iy1-iy0); if(Math.hypot((x-cx)/(b.pond.rx+24),(y-cy)/(b.pond.ry+24))<1) continue; if(b.rects.some(r=>x>r[0]-14&&x<r[2]+14&&y>r[1]-14&&y<r[3]+14)) continue; b.trees.push({x,y,r:18+R()*10,v:Math.floor(R()*6)}); b.circs.push([x,y,6]); }
    } else if(type==='lot'){
      mkB(b,ix0+4,iy0+4,ix0+22,iy0+18,4,'booth',{wall:'#d8d4c8'});
      for(let row=0;row<2;row++){ const yy=iy0+18+row*100; for(let k=0;k<7;k++){ const xx=ix0+22+k*25,sp={x:xx+12,y:yy+22,a:row%2?-PI/2:PI/2,w:25,l:46,b}; if(R()<.62){ const ty=pick(R,['sedan','sedan','hatch','suv','taxi','van','sports']); b.parked.push({x:sp.x,y:sp.y,a:sp.a+(R()-.5)*.06,ty,col:ty==='taxi'?'#f2c12e':pick(R,CARC),rect:[sp.x-9,sp.y-21,sp.x+9,sp.y+21],taken:false}); } else b.spots.push(sp); } }
    } else if(type==='port'){ /* 貨櫃場：倉庫＋一排排貨櫃 */
      if(R()<.55){ mkB(b,ix0+6,iy0+6,ix1-6,iy0+118,15+R()*6,'ware'); for(let r=0;r<2;r++){ const yy=iy0+150+r*34; for(let x=ix0+10;x+60<ix1-6;x+=64) if(R()<.75) mkB(b,x,yy,x+60,yy+24,6+Math.floor(R()*3)*6,'cont'); } }
      else for(let r=0;r<5;r++){ const yy=iy0+10+r*44; if(yy+24>iy1-6) break; for(let x=ix0+10;x+60<ix1-6;x+=64) if(R()<.8) mkB(b,x,yy,x+60,yy+24,6+Math.floor(R()*4)*6,'cont'); }
      b.scoot.length=0;
    } else if(type==='temple'){
      mkB(b,ix0+36,iy0+18,ix1-36,iy0+100,16,'temple',{wall:'#a8341f'}); b.circs.push([(ix0+ix1)/2,iy0+138,9]); b.name=pick(R,['媽祖廟','土地公廟','關帝廟','城隍廟']);
      for(const p of [[ix0+20,iy1-24],[ix1-20,iy1-24]]){ b.trees.push({x:p[0],y:p[1],r:26,v:2}); b.circs.push([p[0],p[1],7]); }
    } else if(type==='school'){
      mkB(b,ix0,iy0,ix1,iy0+36,16,'school',{wall:'#e9dfc6'}); mkB(b,ix0,iy0+36,ix0+36,iy1-40,16,'school',{wall:'#e9dfc6'});
    } else if(type==='hosp'){
      mkB(b,ix0+10,iy0,ix1-10,iy0+128,44,'hosp',{wall:'#e8e8e4'}); for(let k=0;k<4;k++) b.parked.push({x:ix0+30+k*36,y:iy1-34,a:PI/2,ty:k===0?'amb':pick(R,['sedan','hatch','van']),col:pick(R,CARC),rect:[ix0+21+k*36,iy1-55,ix0+39+k*36,iy1-13],taken:false});
    } else if(type==='police'){
      mkB(b,ix0+10,iy0,ix1-10,iy0+96,24,'police',{wall:'#e6e9ee'}); for(let k=0;k<4;k++) b.parked.push({x:ix0+30+k*40,y:iy1-40,a:-PI/2,ty:'police',col:'#f4f6f8',rect:[ix0+21+k*40,iy1-61,ix0+39+k*40,iy1-19],taken:false});
    }
    b.bikes=[]; B.push(b);
  }
  /* 捷運站入口（街廓角落的人行道上）、公共單車站、老K車行 */
  const mrt=[],cand=B.filter(b=>(b.type==='bld'||b.type==='park')&&b.i>0&&b.j>0&&b.i<NB-1&&b.j<NB-1);
  for(let k=0;k<3&&cand.length;k++){ let b=null; for(let tr=0;tr<30;tr++){ const q=pick(R,cand); if(mrt.every(m=>Math.abs(m.b.i-q.i)+Math.abs(m.b.j-q.j)>=4)){ b=q; break; } } if(!b) b=pick(R,cand);
    cand.splice(cand.indexOf(b),1); const x0=b.x0+46,y0=b.y0+3,e={b,n:D.mrt[k],x:x0+14,y:y0+8,ex:x0+14,ey:b.y0-10,ea:-PI/2,rect:[x0,y0,x0+28,y0+16]}; b.rects.push(e.rect);
    b.trees=b.trees.filter(t=>!(t.x>x0-14&&t.x<x0+42&&t.y<y0+30)); b.circs=b.circs.filter(q=>!(q[0]>x0-14&&q[0]<x0+42&&q[1]<y0+30)); b.mrt=e; mrt.push(e); }
  for(const b of B){ if(b.type==='port'||b.type==='hosp'||b.type==='police'||R()>.22) continue; const s0=b.mrt?2:Math.floor(R()*4),u0=150+R()*40; for(let k=0;k<6;k++){ const u=u0+k*10,p=s0===0?[b.x0+u,b.y0+9,PI/2]:s0===1?[b.x1-9,b.y0+u,PI]:s0===2?[b.x1-u,b.y1-9,-PI/2]:[b.x0+9,b.y1-u,0]; if(b.scoot.some(q=>Math.hypot(q.x-p[0],q.y-p[1])<14)||b.trees.some(q=>Math.hypot(q.x-p[0],q.y-p[1])<12)) continue; b.bikes.push({x:p[0],y:p[1],a:p[2],taken:false}); } }
  const gb=B.filter(b=>b.type==='bld'&&!b.mrt&&b.i>0&&b.j>0&&b.i<NB-1&&b.j<NB-1),garB=gb.length?gb[Math.floor(R()*gb.length)]:B[22],gs=Math.floor(R()*4),garage=Object.assign({n:'老K車行',b:garB,s:gs},curbPt(garB,gs)); garB.garage=gs;
  const off=D.rn!=null?D.rn:di*3,rnH=RN_H.map((_,k)=>RN_H[(k+off)%RN_H.length]),rnV=RN_V.map((_,k)=>RN_V[(k+off)%RN_V.length]);
  /* 地標（計程車、快遞目的地）＝街廓某一邊的路邊車道 */
  const LM=[],lmName=b=>b.type==='temple'?b.name:b.type==='school'?pick(R,['光明國小','中正國小','仁愛國中','博愛國小']):b.type==='park'?pick(R,['中央公園','河濱公園','兒童公園','森林公園']):b.type==='hosp'?'市立醫院':b.type==='police'?'警察局':b.type==='lot'?'公有停車場':null;
  for(const e of mrt) LM.push({n:'捷運'+e.n,b:e.b,s:0,x:e.b.x0+60,y:e.b.y0-HR+52,a:0,mrt:e});
  for(const b of B){ if(b.mrt) continue; let n=lmName(b); if(!n&&R()<.35) n=pick(R,['傳統市場','百貨公司','火車站','郵局','區公所','銀行','電影院','圖書館','夜市入口','運動中心','便利商店']); if(n){ const s=b.type==='hosp'?2:Math.floor(R()*4); LM.push(Object.assign({n,b,s},curbPt(b,s))); } }
  /* 測速照相、闖紅燈照相 */
  const cams=[]; for(let k=0;k<9;k++){ const h=R()<.5,rk=1+Math.floor(R()*(NB-1)),seg=Math.floor(R()*NB),u=seg*P+P/2; cams.push(h?{h,x:u,y:rk*P,k:rk}:{h,x:rk*P,y:u,k:rk}); }
  const W0={di,D,B,blk:(i,j)=>(i>=0&&j>=0&&i<NB&&j<NB)?B[j*NB+i]:null,rnH,rnV,LM,cams,mrt,garage,tiles:new Map(),mini:null,hosp:B[hp[1]*NB+hp[0]],police:B[pp[1]*NB+pp[0]]};
  return WORLDS[di]=W0; }
/* 街廓某一邊路邊車道的點：s 0北 1東 2南 3西 */
function curbPt(b,s){ const cx=(b.x0+b.x1)/2,cy=(b.y0+b.y1)/2; return s===0?{x:cx,y:b.y0-HR+52,a:0}:s===1?{x:b.x1+HR-52,y:cy,a:PI/2}:s===2?{x:cx,y:b.y1+HR-52,a:PI}:{x:b.x0-HR+52,y:cy,a:-PI/2}; }
const CARC=['#f2f2ee','#c9ccd0','#1b1d22','#6b7078','#24365c','#9c1f24','#c8b48e','#2f4a3c','#e8e6e0','#8a1c2a','#3a5a8a','#d0d3d6'];
const onH=y=>{ const k=Math.round(y/P); return k>=0&&k<=NB&&Math.abs(y-k*P)<HR-4?k:-1; },onV=x=>{ const k=Math.round(x/P); return k>=0&&k<=NB&&Math.abs(x-k*P)<HR-4?k:-1; };
const LC=17; function lightOf(ix,iy,h,t){ const ph=(t+hash(ix,iy,99)*LC)%LC; return h?(ph<6.5?'g':ph<8.5?'y':'r'):(ph<8.5?'r':ph<15?'g':'y'); }
function roadName(Wd,x,y){ const h=onH(y),v=onV(x); if(h>=0&&v>=0) return Wd.rnH[h]+'、'+Wd.rnV[v]+'口'; if(h>=0) return Wd.rnH[h]+' '+Math.max(1,Math.round((x+HR)/12))+' 號'; if(v>=0) return Wd.rnV[v]+' '+Math.max(1,Math.round((y+HR)/12))+' 號'; const i=clamp(Math.floor(x/P),0,NB-1),j=clamp(Math.floor(y/P),0,NB-1),b=Wd.blk(i,j); return b&&b.type==='park'?'公園裡':'人行道'; }

/* ---------- 地面圖塊（路面、標線、人行道、影子），快取 ---------- */
const TILES=new Map();
function tile(Wd,ci,cj,wet){ const key=Wd.di*100000+(ci+2)*100+(cj+2)+(wet?.5:0); let cv=TILES.get(key); if(cv){ TILES.delete(key); TILES.set(key,cv); return cv; }
  cv=document.createElement('canvas'); cv.width=cv.height=P*TSC; const c=cv.getContext('2d'); c.scale(TSC,TSC); c.translate(-ci*P,-cj*P); paintCell(c,Wd,ci,cj,wet);
  TILES.set(key,cv); if(TILES.size>40) TILES.delete(TILES.keys().next().value); return cv; }
function paintCell(c,Wd,ci,cj,wet,g3){ const X0=ci*P,Y0=cj*P,R=mul((Wd.di+1)*100003+(ci+3)*917+(cj+3)*131);
  c.fillStyle=wet?'#2b2e33':'#3d4046'; c.fillRect(X0,Y0,P,P);
  for(let k=0;k<700;k++){ c.fillStyle=R()<.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.13)'; c.fillRect(X0+R()*P,Y0+R()*P,.8+R()*1.6,.8+R()*1.6); }
  for(let k=0;k<3;k++){ c.fillStyle='rgba(0,0,0,'+(.06+R()*.08)+')'; c.fillRect(X0+R()*P,Y0+R()*P,20+R()*60,14+R()*40); }
  c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=.6; for(let k=0;k<3;k++){ let x=X0+R()*P,y=Y0+R()*P; c.beginPath(); c.moveTo(x,y); for(let q=0;q<5;q++){ x+=(R()-.5)*26; y+=(R()-.5)*26; c.lineTo(x,y); } c.stroke(); }
  if(wet){ for(let k=0;k<8;k++){ c.fillStyle='rgba(150,175,200,'+(.05+R()*.06)+')'; c.beginPath(); c.ellipse(X0+R()*P,Y0+R()*P,10+R()*30,5+R()*12,R()*3,0,TAU); c.fill(); } }
  /* 城市外圍：堤防與河 */
  if(X0<LO||Y0<LO||X0+P>HI||Y0+P>HI){ c.save(); c.beginPath(); c.rect(X0,Y0,P,P); c.rect(LO,LO,HI-LO,HI-LO); c.fillStyle='#8f8b82'; c.fill('evenodd');
    c.beginPath(); c.rect(X0,Y0,P,P); c.rect(LO-26,LO-26,HI-LO+52,HI-LO+52); c.fillStyle='#2c5a72'; c.fill('evenodd'); c.clip('evenodd');
    c.strokeStyle='rgba(255,255,255,.12)'; c.lineWidth=1.2; for(let k=0;k<40;k++){ const x=X0+R()*P,y=Y0+R()*P; c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x+8,y-3,x+16,y); c.stroke(); } c.restore();
    c.strokeStyle='#c9c6be'; c.lineWidth=2; c.strokeRect(LO-3,LO-3,HI-LO+6,HI-LO+6); c.fillStyle='#6a6862'; for(let k=LO;k<=HI;k+=18){ for(const [x,y] of [[k,LO-3],[k,HI+3],[LO-3,k],[HI+3,k]]) if(x>=X0-4&&x<=X0+P+4&&y>=Y0-4&&y<=Y0+P+4) c.fillRect(x-1.5,y-1.5,3,3); } }
  /* 道路標線 */
  for(const k of [cj,cj+1]) if(k>=0&&k<=NB) for(let s=ci-1;s<=ci+1;s++) if(s>=0&&s<NB) markSeg(c,true,k*P,s*P+HR,(s+1)*P-HR,hash(k,s,7),Wd);
  for(const k of [ci,ci+1]) if(k>=0&&k<=NB) for(let s=cj-1;s<=cj+1;s++) if(s>=0&&s<NB) markSeg(c,false,k*P,s*P+HR,(s+1)*P-HR,hash(s,k,8),Wd);
  for(const ix of [ci,ci+1]) for(const iy of [cj,cj+1]){ if(ix<0||iy<0||ix>NB||iy>NB) continue; const X=ix*P,Y=iy*P;
    if(hash(ix,iy,5)<.2){ c.save(); c.beginPath(); c.rect(X-HR+8,Y-HR+8,HR*2-16,HR*2-16); c.clip(); c.strokeStyle='rgba(230,190,40,.75)'; c.lineWidth=2; c.strokeRect(X-HR+9,Y-HR+9,HR*2-18,HR*2-18); for(let q=-HR*2;q<HR*2;q+=16){ c.beginPath(); c.moveTo(X-HR+q,Y-HR); c.lineTo(X-HR+q+HR*2,Y+HR); c.moveTo(X+HR-q,Y-HR); c.lineTo(X+HR-q-HR*2,Y+HR); c.stroke(); } c.restore(); }
    c.fillStyle='rgba(0,0,0,.08)'; c.beginPath(); c.arc(X+(hash(ix,iy,3)-.5)*60,Y+(hash(ix,iy,4)-.5)*60,5,0,TAU); c.fill(); }
  const b=Wd.blk(ci,cj); if(b) paintBlock(c,b,wet,R,g3); }
function markSeg(c,hz,Yc,a,b,hs,Wd){ c.save(); if(hz) c.transform(1,0,0,1,0,Yc); else c.transform(0,1,-1,0,Yc,0);
  const W2=HR;
  if(hs<.65){ c.strokeStyle=hs<.4?'#b8322b':'#cfa828'; c.lineWidth=2.2; c.beginPath(); c.moveTo(a+24,W2-1.2); c.lineTo(b-24,W2-1.2); c.moveTo(a+24,-W2+1.2); c.lineTo(b-24,-W2+1.2); c.stroke(); }
  c.strokeStyle='rgba(236,236,230,.82)'; c.lineWidth=1.4; c.beginPath(); c.moveTo(a+24,W2-9); c.lineTo(b-24,W2-9); c.moveTo(a+24,-W2+9); c.lineTo(b-24,-W2+9); c.stroke();
  c.strokeStyle='#e0b42a'; c.lineWidth=1.6; c.beginPath(); for(const w of [-2.4,2.4]){ c.moveTo(a+24,w); c.lineTo(b-24,w); } c.stroke();
  c.strokeStyle='rgba(236,236,230,.82)'; c.lineWidth=1.5; c.beginPath(); for(const w of [-35,35]){ c.moveTo(a+24,w); c.lineTo(a+64,w); c.moveTo(b-64,w); c.lineTo(b-24,w); } c.stroke(); c.setLineDash([16,22]); c.beginPath(); for(const w of [-35,35]){ c.moveTo(a+72,w); c.lineTo(b-72,w); } c.stroke(); c.setLineDash([]);
  c.fillStyle='rgba(238,238,232,.88)'; for(const u0 of [a+4,b-22]) for(let w=-W2+8;w<W2-12;w+=11) c.fillRect(u0,w,18,6);
  c.fillRect(b-50,1,3,W2-10); c.fillRect(a+47,-W2+9,3,W2-10);
  c.strokeStyle='rgba(238,238,232,.85)'; c.lineWidth=1.1; c.strokeRect(b-45,3,19,W2-14); c.strokeRect(a+26,-W2+11,19,W2-14);
  const sco=(u,w,dir)=>{ c.save(); c.translate(u,w); c.rotate(dir); c.fillStyle='rgba(238,238,232,.8)'; c.fillRect(-4,-1.2,8,2.4); c.beginPath(); c.arc(-4,0,1.6,0,TAU); c.arc(4,0,1.6,0,TAU); c.fill(); c.restore(); };
  sco(b-35,W2/2-2,0); sco(a+35,-W2/2+2,PI);
  const arrow=(u,w,dir,kind)=>{ c.save(); c.translate(u,w); c.rotate(dir); c.fillStyle='rgba(238,238,232,.8)'; c.beginPath(); c.moveTo(10,0); c.lineTo(3,-4); c.lineTo(3,-1.3); c.lineTo(-10,-1.3); c.lineTo(-10,1.3); c.lineTo(3,1.3); c.lineTo(3,4); c.closePath(); c.fill(); if(kind){ c.beginPath(); c.moveTo(-2,kind*-1.3); c.lineTo(2,kind*-6); c.lineTo(4,kind*-4.4); c.lineTo(5,kind*-9); c.lineTo(0,kind*-8.6); c.lineTo(1.6,kind*-7.2); c.lineTo(-2,kind*-2.8); c.closePath(); c.fill(); } c.restore(); };
  if(b-a>200){ arrow(b-92,17,0,-1); arrow(b-92,52,0,1); arrow(a+92,-17,PI,-1); arrow(a+92,-52,PI,1); }
  const mh=a+40+hs*(b-a-80); c.fillStyle='#2c2e32'; c.beginPath(); c.arc(mh,(hs*997%1-.5)*80,5,0,TAU); c.fill(); c.strokeStyle='rgba(150,150,150,.5)'; c.lineWidth=.8; c.stroke();
  c.restore(); }
function paintBlock(c,b,wet,R,g3){ const {x0,y0,x1,y1}=b,ix0=x0+SW,iy0=y0+SW,ix1=x1-SW,iy1=y1-SW;
  c.fillStyle=wet?'#827d74':'#a29c91'; c.fillRect(x0,y0,x1-x0,y1-y0);
  c.save(); c.beginPath(); c.rect(x0,y0,x1-x0,y1-y0); c.rect(ix0,iy0,ix1-ix0,iy1-iy0); c.clip('evenodd'); c.strokeStyle='rgba(0,0,0,.09)'; c.lineWidth=.6; c.beginPath(); for(let x=x0;x<x1;x+=8){ c.moveTo(x,y0); c.lineTo(x,y1); } for(let y=y0;y<y1;y+=8){ c.moveTo(x0,y); c.lineTo(x1,y); } c.stroke();
  c.fillStyle='rgba(120,100,70,.12)'; for(let k=0;k<30;k++) c.fillRect(x0+R()*(x1-x0),y0+R()*(y1-y0),8,8); c.restore();
  c.fillStyle='#d8b830'; for(const [x,y] of [[x0+2,y0+20],[x0+20,y0+2],[x1-6,y0+20],[x1-26,y0+2],[x1-6,y1-26],[x1-26,y1-6],[x0+2,y1-26],[x0+20,y1-6]]) c.fillRect(x,y,6,6);
  c.strokeStyle=wet?'#a8a399':'#d6d0c4'; c.lineWidth=2.2; c.strokeRect(x0+1,y0+1,x1-x0-2,y1-y0-2);
  if(b.type==='park'){ c.fillStyle=wet?'#3e6a36':'#5d8a46'; c.fillRect(ix0-6,iy0-6,ix1-ix0+12,iy1-iy0+12); for(let k=0;k<70;k++){ c.fillStyle=R()<.5?'rgba(30,60,20,.18)':'rgba(140,180,90,.15)'; c.beginPath(); c.arc(ix0+R()*(ix1-ix0),iy0+R()*(iy1-iy0),4+R()*10,0,TAU); c.fill(); }
    c.strokeStyle='#cbbf9e'; c.lineWidth=9; c.lineCap='round'; c.beginPath(); c.moveTo(ix0-6,(iy0+iy1)/2+20); c.bezierCurveTo(ix0+60,iy0+20,ix1-60,iy1-10,ix1+6,(iy0+iy1)/2-30); c.moveTo((ix0+ix1)/2,iy0-6); c.quadraticCurveTo((ix0+ix1)/2+50,(iy0+iy1)/2,(ix0+ix1)/2-10,iy1+6); c.stroke(); c.lineCap='butt';
    const p=b.pond; c.fillStyle='#8a8070'; c.beginPath(); c.ellipse(p.x,p.y,p.rx+3,p.ry+3,0,0,TAU); c.fill(); const g=c.createRadialGradient(p.x-8,p.y-6,4,p.x,p.y,p.rx); g.addColorStop(0,'#5a9ab8'); g.addColorStop(1,'#2f6480'); c.fillStyle=g; c.beginPath(); c.ellipse(p.x,p.y,p.rx,p.ry,0,0,TAU); c.fill(); c.fillStyle='rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(p.x-p.rx*.3,p.y-p.ry*.4,p.rx*.3,3,0,0,TAU); c.fill();
    c.fillStyle='#7a5434'; for(let k=0;k<3;k++){ const x=ix0+20+R()*(ix1-ix0-40),y=iy0+20+R()*(iy1-iy0-40); c.fillRect(x,y,14,4); } }
  else if(b.type==='port'){ c.fillStyle=wet?'#4a4a48':'#6a6a66'; c.fillRect(ix0,iy0,ix1-ix0,iy1-iy0); c.strokeStyle='rgba(230,200,60,.6)'; c.lineWidth=1.4; for(let y=iy0+8;y<iy1;y+=44){ c.beginPath(); c.moveTo(ix0+4,y); c.lineTo(ix1-4,y); c.stroke(); } }
  else if(b.type==='lot'){ c.fillStyle=wet?'#3a3c40':'#4a4c51'; c.fillRect(ix0,iy0,ix1-ix0,iy1-iy0); c.strokeStyle='rgba(240,240,235,.75)'; c.lineWidth=1.2; for(let row=0;row<2;row++){ const yy=iy0+18+row*100; c.beginPath(); for(let k=0;k<=7;k++){ c.moveTo(ix0+22+k*25,yy); c.lineTo(ix0+22+k*25,yy+44); } c.stroke(); }
    c.fillStyle='rgba(240,240,235,.5)'; c.font='900 16px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('P',ix1-16,iy0+14); }
  else if(b.type==='temple'){ c.fillStyle='#b4664c'; c.fillRect(ix0,iy0,ix1-ix0,iy1-iy0); c.strokeStyle='rgba(80,30,20,.25)'; c.lineWidth=.6; c.beginPath(); for(let x=ix0;x<ix1;x+=10){ c.moveTo(x,iy0); c.lineTo(x,iy1); } for(let y=iy0;y<iy1;y+=10){ c.moveTo(ix0,y); c.lineTo(ix1,y); } c.stroke();
    const cx=(ix0+ix1)/2; const g=c.createRadialGradient(cx-2,iy0+136,1,cx,iy0+138,9); g.addColorStop(0,'#c8a050'); g.addColorStop(1,'#5a4020'); c.fillStyle=g; c.beginPath(); c.arc(cx,iy0+138,9,0,TAU); c.fill(); c.fillStyle='#2a1a10'; c.beginPath(); c.arc(cx,iy0+138,4,0,TAU); c.fill();
    c.fillStyle='#8a2a1a'; c.fillRect(cx-30,iy1-6,60,6); c.fillStyle='#e0a030'; c.fillRect(cx-30,iy1-6,60,1.5); }
  else if(b.type==='school'){ c.fillStyle='#4f8f45'; c.fillRect(ix0,iy0,ix1-ix0,iy1-iy0); const tx0=ix0+46,ty0=iy0+46,tw=ix1-ix0-56,th=iy1-iy0-90; rr(c,tx0,ty0,tw,th,th/2); c.fillStyle='#b5523e'; c.fill(); rr(c,tx0+16,ty0+16,tw-32,th-32,(th-32)/2); c.fillStyle='#5a9a4c'; c.fill(); c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=.7; for(let k=1;k<4;k++){ rr(c,tx0+k*4,ty0+k*4,tw-k*8,th-k*8,(th-k*8)/2); c.stroke(); }
    c.fillStyle='#8a8a8a'; c.fillRect(ix0+46,iy1-38,70,34); c.strokeStyle='#fff'; c.lineWidth=.8; c.strokeRect(ix0+48,iy1-36,66,30); c.beginPath(); c.moveTo(ix0+81,iy1-36); c.lineTo(ix0+81,iy1-6); c.stroke(); }
  else { c.fillStyle=wet?'#6a665f':'#857f76'; c.fillRect(ix0,iy0,ix1-ix0,iy1-iy0); if(b.type==='hosp'||b.type==='police'){ c.fillStyle='#55575c'; c.fillRect(ix0,iy0+(b.type==='hosp'?128:96),ix1-ix0,iy1-iy0-(b.type==='hosp'?128:96)); c.strokeStyle='rgba(240,240,235,.7)'; c.lineWidth=1; for(let k=0;k<5;k++){ c.beginPath(); c.moveTo(ix0+12+k*(b.type==='hosp'?36:40),iy1-60); c.lineTo(ix0+12+k*(b.type==='hosp'?36:40),iy1-14); c.stroke(); } if(b.type==='hosp'){ c.fillStyle='#c8202a'; c.font='900 15px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('急診',(ix0+ix1)/2,iy1-6); } } }
  for(const r of b.paths){ c.fillStyle='#5f5c56'; c.fillRect(r[0],r[1],r[2]-r[0],r[3]-r[1]); }
  /* 影子（太陽在左上） */
  if(!g3){ c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); } for(const bd of (g3?[]:b.blds)){ const o=Math.min(70,bd.ht*.75),dx=o*.55,dy=o*.8; c.moveTo(bd.x0,bd.y0); c.lineTo(bd.x1,bd.y0); c.lineTo(bd.x1+dx,bd.y0+dy); c.lineTo(bd.x1+dx,bd.y1+dy); c.lineTo(bd.x0+dx,bd.y1+dy); c.lineTo(bd.x0,bd.y1); c.closePath(); } if(!g3) c.fill();
  for(const tr of b.trees){ c.fillStyle='#6a5a48'; c.fillRect(tr.x-5,tr.y-5,10,10); c.fillStyle='#4a3a2a'; c.beginPath(); c.arc(tr.x,tr.y,2.4,0,TAU); c.fill(); }
  if(g3) return;
  for(const s of b.scoot){ if(s.taken) continue; c.save(); c.translate(s.x,s.y); c.rotate(s.a); drawScooter(c,s.c,null,false,s.h); c.restore(); } }

/* ---------- 車子（由上往下看、車頭朝 +x） ---------- */
const VT={
  sedan:{L:46,W:20,vmax:400,acc:360,m:1,n:'轎車'},hatch:{L:40,W:19,vmax:380,acc:350,m:.9,n:'小車'},taxi:{L:46,W:20,vmax:405,acc:365,m:1,col:'#f2c12e',n:'計程車'},
  sports:{L:45,W:21,vmax:530,acc:480,m:.95,n:'跑車'},suv:{L:50,W:22,vmax:425,acc:380,m:1.3,n:'休旅車'},van:{L:50,W:21,vmax:375,acc:325,m:1.3,n:'廂型車'},
  police:{L:47,W:20,vmax:465,acc:425,m:1.1,col:'#f4f6f8',n:'警車'},amb:{L:56,W:23,vmax:415,acc:345,m:1.5,col:'#f6f6f2',n:'救護車'},
  truck:{L:52,W:20,vmax:335,acc:285,m:1.4,n:'發財車'},bus:{L:118,W:26,vmax:300,acc:200,m:4,n:'公車'},garbage:{L:72,W:25,vmax:260,acc:200,m:3,col:'#e9c52a',n:'垃圾車'},
  scooter:{L:20,W:8,vmax:330,acc:300,m:.35,n:'機車'},bike:{L:18,W:6,vmax:175,acc:190,m:.22,n:'腳踏車'}};
const SPR={};
function carSpr(ty,col,var_){ const k=ty+col+(var_||''); if(SPR[k]) return SPR[k]; const T=VT[ty],L=T.L,Wd=T.W,cv=document.createElement('canvas'); cv.width=(L+10)*S3; cv.height=(Wd+10)*S3; const c=cv.getContext('2d'); c.scale(S3,S3); c.translate((L+10)/2,(Wd+10)/2);
  if(ty==='scooter') drawScooter(c,col,var_?JSON.parse(var_):null,true); else if(ty==='bike') drawBike(c,col,var_?JSON.parse(var_):null,true); else carArt(c,ty,col,L,Wd,var_);
  return SPR[k]=cv; }
function bodyGrad(c,col,hw){ const g=c.createLinearGradient(0,-hw,0,hw); g.addColorStop(0,shade(col,.55)); g.addColorStop(.16,shade(col,1.02)); g.addColorStop(.5,shade(col,1.2)); g.addColorStop(.84,shade(col,.98)); g.addColorStop(1,shade(col,.52)); return g; }
function glass(c,x0,x1,hw0,hw1){ const g=c.createLinearGradient(x0,0,x1,0); g.addColorStop(0,'#1a222c'); g.addColorStop(1,'#3e5468'); c.fillStyle=g; c.beginPath(); c.moveTo(x1,-hw1); c.lineTo(x1,hw1); c.lineTo(x0,hw0); c.lineTo(x0,-hw0); c.closePath(); c.fill(); c.strokeStyle='rgba(255,255,255,.22)'; c.lineWidth=.6; c.beginPath(); c.moveTo(x0+(x1-x0)*.3,-hw0*.7); c.lineTo(x0+(x1-x0)*.75,hw0*.2); c.stroke(); }
function carArt(c,ty,col,L,Wd,var_){ const hl=L/2,hw=Wd/2;
  const box=ty==='van'||ty==='amb'||ty==='bus'||ty==='garbage'||ty==='truck';
  /* 車身 */
  c.fillStyle=bodyGrad(c,col,hw); c.beginPath();
  if(box){ rr(c,-hl,-hw,L,Wd,ty==='bus'?4:3); }
  else { const nose=ty==='sports'?9:7; c.moveTo(-hl+3,-hw); c.lineTo(hl-nose,-hw); c.quadraticCurveTo(hl,-hw+1,hl,-hw+5.5); c.lineTo(hl,hw-5.5); c.quadraticCurveTo(hl,hw-1,hl-nose,hw); c.lineTo(-hl+3,hw); c.quadraticCurveTo(-hl,hw,-hl,hw-4); c.lineTo(-hl,-hw+4); c.quadraticCurveTo(-hl,-hw,-hl+3,-hw); c.closePath(); }
  c.fill(); c.strokeStyle='rgba(0,0,0,.65)'; c.lineWidth=.8; c.stroke();
  const lights=(fx,rx)=>{ c.fillStyle='#fff6d6'; rr(c,fx-2.8,-hw+1.2,2.6,4.2,1); c.fill(); rr(c,fx-2.8,hw-5.4,2.6,4.2,1); c.fill(); c.fillStyle='#9a141a'; rr(c,rx,-hw+1.2,2,4.4,.8); c.fill(); rr(c,rx,hw-5.6,2,4.4,.8); c.fill(); c.fillStyle='#ff9a2a'; c.fillRect(rx,-hw+.4,1.6,1.2); c.fillRect(rx,hw-1.6,1.6,1.2); };
  const mirrors=x=>{ c.fillStyle=shade(col,.7); c.beginPath(); c.ellipse(x,-hw-1.3,1.6,1.3,0,0,TAU); c.ellipse(x,hw+1.3,1.6,1.3,0,0,TAU); c.fill(); };
  if(ty==='bus'){ c.fillStyle='#e8ece8'; rr(c,-hl+3,-hw+3,L-6,Wd-6,2); c.fill(); c.fillStyle=col; c.fillRect(-hl+3,-hw+3,L-6,2.2); c.fillRect(-hl+3,hw-5.2,L-6,2.2); c.fillStyle='#9aa4a8'; rr(c,-hl+20,-6,26,12,2); c.fill(); rr(c,-hl+60,-6,22,12,2); c.fill(); c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=.6; for(let x=-hl+22;x<-hl+46;x+=3){ c.beginPath(); c.moveTo(x,-5); c.lineTo(x,5); c.stroke(); } c.fillStyle='#c8d0d4'; c.fillRect(hl-30,-4,8,8); c.fillRect(-hl+90,-4,8,8); glass(c,hl-4,hl-1,hw-2,hw-2); lights(hl,-hl); mirrors(hl-2); return; }
  if(ty==='garbage'){ c.fillStyle='#f4f4f0'; rr(c,hl-18,-hw+1,17,Wd-2,3); c.fill(); glass(c,hl-5,hl-1.5,hw-3,hw-3); c.fillStyle=shade(col,.85); rr(c,-hl+2,-hw+2,L-24,Wd-4,3); c.fill(); c.strokeStyle='rgba(0,0,0,.3)'; c.lineWidth=.8; for(let x=-hl+8;x<hl-24;x+=7){ c.beginPath(); c.moveTo(x,-hw+3); c.lineTo(x,hw-3); c.stroke(); } c.fillStyle='#3a3a3a'; c.fillRect(-hl,-hw+2,6,Wd-4); c.fillStyle='#ff8a1a'; c.beginPath(); c.arc(hl-12,-hw+3,1.8,0,TAU); c.arc(hl-12,hw-3,1.8,0,TAU); c.fill(); lights(hl,-hl); mirrors(hl-3); return; }
  if(ty==='truck'){ const cab=var_||'#e8e8e8'; c.fillStyle=bodyGrad(c,cab,hw); rr(c,hl-17,-hw,17,Wd,3); c.fill(); c.stroke(); glass(c,hl-7,hl-2.5,hw-2.5,hw-2.5); c.fillStyle=shade(cab,1.1); c.fillRect(hl-16,-hw+2.5,8,Wd-5);
    c.fillStyle='#8a8c90'; c.fillRect(-hl+1,-hw+1,L-19,Wd-2); c.strokeStyle='#5a5c60'; c.lineWidth=1.4; c.strokeRect(-hl+1.5,-hw+1.5,L-20,Wd-3); c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=.6; for(let x=-hl+4;x<hl-19;x+=4){ c.beginPath(); c.moveTo(x,-hw+2); c.lineTo(x,hw-2); c.stroke(); }
    const R=mul(L*7+col.length); const kind=Math.floor(R()*3); for(let k=0;k<6;k++){ const x=-hl+4+(k%3)*10,y=(k<3?-1:1)*4.5; if(kind===0){ c.fillStyle=pick(R,['#e07a2a','#3a6ab8','#c8a050']); c.fillRect(x,y-4,9,8); c.strokeStyle='rgba(0,0,0,.35)'; c.strokeRect(x,y-4,9,8); } else if(kind===1){ c.fillStyle=pick(R,['#5a9a3a','#7ab84a']); c.beginPath(); c.arc(x+4,y,4.2,0,TAU); c.fill(); } else { c.fillStyle='#d8d8d0'; c.beginPath(); c.arc(x+4,y,3.6,0,TAU); c.fill(); c.fillStyle='#3a6ab8'; c.beginPath(); c.arc(x+4,y,1.6,0,TAU); c.fill(); } }
    lights(hl,-hl); mirrors(hl-4); return; }
  if(ty==='van'||ty==='amb'){ glass(c,hl-13,hl-5,hw-2.4,hw-3); c.fillStyle=shade(col,1.12); rr(c,-hl+2,-hw+2.4,L-16,Wd-4.8,2); c.fill(); c.strokeStyle='rgba(0,0,0,.18)'; c.lineWidth=.6; for(let x=-hl+8;x<hl-16;x+=6){ c.beginPath(); c.moveTo(x,-hw+3); c.lineTo(x,hw-3); c.stroke(); } c.beginPath(); c.moveTo(-hl,0); c.lineTo(-hl+3,0); c.stroke();
    if(ty==='amb'){ c.fillStyle='#c8202a'; c.fillRect(-hl+1,-hw+.3,L-2,1.6); c.fillRect(-hl+1,hw-1.9,L-2,1.6); c.fillStyle='#ff7a1a'; c.fillRect(-hl+1,-hw+2,L-2,.9); c.fillRect(-hl+1,hw-2.9,L-2,.9); c.fillStyle='#1d4fa8'; c.save(); c.translate(-6,0); for(let q=0;q<3;q++){ c.save(); c.rotate(q*PI/3); c.fillRect(-1.4,-6,2.8,12); c.restore(); } c.restore(); c.fillStyle='#fff'; c.beginPath(); c.arc(-6,0,1.4,0,TAU); c.fill(); }
    lights(hl,-hl); mirrors(hl-9); return; }
  /* 轎車類 */
  const ws0=ty==='sports'?L*.0:L*.06,ws1=ty==='sports'?L*.2:L*.22,rf0=ty==='sports'?-L*.2:ty==='hatch'?-L*.32:ty==='suv'?-L*.34:-L*.24,rw0=ty==='hatch'||ty==='suv'?-L*.42:-L*.35;
  c.strokeStyle='rgba(255,255,255,.2)'; c.lineWidth=.7; c.beginPath(); c.moveTo(ws1+2,-hw*.45); c.lineTo(hl-3,-hw*.35); c.moveTo(ws1+2,hw*.45); c.lineTo(hl-3,hw*.35); c.stroke();
  glass(c,ws0,ws1,hw-2.2,hw-3.4);
  c.fillStyle=shade(col,ty==='police'?1.05:1.1); rr(c,rf0,-hw+2.4,ws0-rf0,Wd-4.8,2); c.fill();
  c.fillStyle='#1d252e'; c.fillRect(rf0,-hw+1.1,ws0-rf0,1.3); c.fillRect(rf0,hw-2.4,ws0-rf0,1.3);
  c.fillStyle='#24303c'; c.beginPath(); c.moveTo(rf0,-hw+2.6); c.lineTo(rf0,hw-2.6); c.lineTo(rw0,hw-3.4); c.lineTo(rw0,-hw+3.4); c.closePath(); c.fill();
  if(ty==='suv'){ c.strokeStyle='#2a2c30'; c.lineWidth=1; c.beginPath(); c.moveTo(rf0+2,-hw+3.6); c.lineTo(ws0-2,-hw+3.6); c.moveTo(rf0+2,hw-3.6); c.lineTo(ws0-2,hw-3.6); c.stroke(); }
  if(ty==='sports'){ c.fillStyle='#16181c'; c.fillRect(-hl+.5,-hw+1.5,2.6,Wd-3); if(col!=='#1b1d22'){ c.fillStyle='rgba(255,255,255,.75)'; c.fillRect(-hl+4,-2.6,L-6,1.4); c.fillRect(-hl+4,1.2,L-6,1.4); } }
  if(ty==='taxi'){ c.fillStyle='#fafafa'; rr(c,rf0+(ws0-rf0)*.3,-4,6,8,1); c.fill(); c.fillStyle='#c8202a'; c.fillRect(rf0+(ws0-rf0)*.3+1.5,-2.5,3,5); c.fillStyle='#1b1d22'; for(let x=-hl+2;x<hl-6;x+=4) c.fillRect(x,hw-1.2,2,1.2); }
  if(ty==='police'){ c.fillStyle='#1d4fa8'; c.fillRect(-hl+3,-hw+.6,L-8,2); c.fillRect(-hl+3,hw-2.6,L-8,2); c.fillStyle='#1b1d22'; rr(c,rf0+(ws0-rf0)*.35,-hw+2.6,4.2,Wd-5.2,1); c.fill(); c.fillStyle='#1d4fa8'; c.font='900 6px '+TC; c.save(); c.translate(hl-9,0); c.rotate(PI/2); c.textAlign='center'; c.textBaseline='middle'; c.fillText('警察',0,0); c.restore(); }
  lights(hl,-hl); mirrors(ws1-1); }
function drawScooter(c,col,lk,rider,helm){ c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(1.5,2,10,4.5,0,0,TAU); c.fill();
  c.fillStyle='#1a1a1a'; c.fillRect(-10,-1.1,5,2.2); c.fillRect(6,-1,4.6,2);
  c.fillStyle=bodyGrad(c,col,3.6); rr(c,-9,-3.6,15,7.2,3); c.fill(); c.strokeStyle='rgba(0,0,0,.5)'; c.lineWidth=.5; c.stroke();
  c.fillStyle='#4a4a4a'; c.fillRect(0,-2.6,4.5,5.2); c.fillStyle=col; c.beginPath(); c.moveTo(4.5,-3.6); c.lineTo(8,-2.4); c.lineTo(8,2.4); c.lineTo(4.5,3.6); c.closePath(); c.fill();
  c.fillStyle='#1c1c1c'; rr(c,-8.5,-2.5,8,5,2.2); c.fill(); c.strokeStyle='#222'; c.lineWidth=1.2; c.beginPath(); c.moveTo(7,-5); c.lineTo(7,5); c.stroke(); c.fillStyle='#bbb'; c.beginPath(); c.arc(7,-5.6,.9,0,TAU); c.arc(7,5.6,.9,0,TAU); c.fill(); c.fillStyle='#fff8d8'; c.fillRect(8,-1,1.2,2);
  if(helm&&!rider){ c.fillStyle=helm; c.beginPath(); c.arc(-4,0,2.4,0,TAU); c.fill(); }
  if(rider){ const L=lk||{shirt:'#3a5a8a',helm:'#e8e8e8',skin:'#e0b48e'}; c.fillStyle=L.shirt; c.beginPath(); c.ellipse(-2.5,0,3.6,5.6,0,0,TAU); c.fill(); c.strokeStyle=L.shirt; c.lineWidth=1.8; c.beginPath(); c.moveTo(-1,-4.4); c.lineTo(6.4,-4.4); c.moveTo(-1,4.4); c.lineTo(6.4,4.4); c.stroke(); const g=c.createRadialGradient(0,-1,.5,.4,0,3.8); g.addColorStop(0,shade(L.helm,1.35)); g.addColorStop(1,shade(L.helm,.7)); c.fillStyle=g; c.beginPath(); c.arc(.4,0,3.6,0,TAU); c.fill(); c.fillStyle='rgba(20,25,35,.8)'; c.beginPath(); c.arc(.4,0,3.6,-.9,.9); c.closePath(); c.fill(); } }
function drawBike(c,col,lk,rider){ c.fillStyle='rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(1,1.6,9,3,0,0,TAU); c.fill(); c.fillStyle='#1a1a1a'; c.fillRect(-9,-.7,6,1.4); c.fillRect(3,-.7,6,1.4); c.strokeStyle=col; c.lineWidth=1.4; c.beginPath(); c.moveTo(-6,0); c.lineTo(5,0); c.stroke(); c.strokeStyle='#333'; c.lineWidth=1; c.beginPath(); c.moveTo(5,-3.4); c.lineTo(5,3.4); c.stroke(); c.fillStyle='#2a2a2a'; c.fillRect(-4.5,-1.2,3,2.4); c.fillStyle=col; c.fillRect(5.5,-2,3,4);
  if(rider){ const L=lk||{shirt:'#3a5a8a',skin:'#e0b48e',hair:'#222'}; c.fillStyle=L.shirt; c.beginPath(); c.ellipse(-2,0,3,4.6,0,0,TAU); c.fill(); c.strokeStyle=L.shirt; c.lineWidth=1.5; c.beginPath(); c.moveTo(-1,-3.6); c.lineTo(4.6,-3.2); c.moveTo(-1,3.6); c.lineTo(4.6,3.2); c.stroke(); c.fillStyle=L.skin; c.beginPath(); c.arc(-.6,0,2.4,0,TAU); c.fill(); c.fillStyle=L.hair||'#222'; c.beginPath(); c.arc(-1.2,0,2.3,0,TAU); c.fill(); } }
/* 人（由上往下看，臉朝 +x） */
const SKIN=['#f1c9a5','#e0b48e','#c99a74','#f5d3b5','#d8a882'],HAIR=['#1a1410','#2b1d14','#3a2a1c','#5a4030','#8a8a8a','#1a1a1a'],SHIRT=['#e8e8e4','#2a2a2e','#3d6fb3','#c8402e','#5a8a4a','#e8c85a','#8a5aa8','#e88aa8','#6a7a8a','#f4a040','#2a4a6a','#a8b8c8'],PANTS=['#2a3040','#1e1e22','#5a4a3a','#3a4a6a','#7a7a7a','#c8b898'],UMB=['#c8202a','#1d4fa8','#2a2a2a','#e8c21c','#5aa04a','#e86aa0','#7a5ab8','#ffffff'];
function mkLook(R){ return {skin:pick(R,SKIN),hair:pick(R,HAIR),shirt:pick(R,SHIRT),pants:pick(R,PANTS),umb:pick(R,UMB),fem:R()<.5,cap:R()<.12?pick(R,['#c8202a','#1d4fa8','#222','#e8e8e8']):null}; }
function drawPerson(c,x,y,a,lk,ph,o){ o=o||{}; c.save(); c.translate(x,y); const s=o.sc||1; if(s!==1) c.scale(s,s);
  c.fillStyle='rgba(0,0,0,.26)'; c.beginPath(); c.ellipse(1.8,2.6,o.lying?11:6.2,o.lying?5:4.4,o.lying?a:0,0,TAU); c.fill(); c.rotate(a);
  if(o.lying){ c.fillStyle=lk.pants; c.fillRect(-11,-3,8,2.4); c.fillRect(-11,.6,8,2.4); c.fillStyle=lk.shirt; rr(c,-4,-4.4,10,8.8,3); c.fill(); c.fillStyle=lk.skin; c.beginPath(); c.arc(9,0,3.2,0,TAU); c.fill(); c.fillStyle=lk.hair; c.beginPath(); c.arc(10.2,0,2.6,0,TAU); c.fill(); c.restore(); return; }
  const sw=Math.sin(ph)*(o.run?4.4:2.8);
  c.fillStyle=lk.pants; c.beginPath(); c.ellipse(sw,-2.1,2.7,1.6,0,0,TAU); c.fill(); c.beginPath(); c.ellipse(-sw,2.1,2.7,1.6,0,0,TAU); c.fill();
  c.fillStyle='#222'; c.beginPath(); c.arc(sw+2.4,-2.1,1.1,0,TAU); c.arc(-sw+2.4,2.1,1.1,0,TAU); c.fill();
  c.fillStyle=shade(lk.shirt,.85); c.beginPath(); c.ellipse(-sw*.8,-5.6,2.6,1.5,0,0,TAU); c.fill(); if(o.wave){ c.beginPath(); c.ellipse(4.5,6.2,3.2,1.5,.5,0,TAU); c.fill(); c.fillStyle=lk.skin; c.beginPath(); c.arc(7.6,7.6,1.4,0,TAU); c.fill(); } else { c.beginPath(); c.ellipse(sw*.8,5.6,2.6,1.5,0,0,TAU); c.fill(); }
  if(o.phone){ c.fillStyle='#222'; c.fillRect(2.5,-6.5,2.2,1.4); }
  const g=c.createLinearGradient(0,-6,0,6); g.addColorStop(0,shade(lk.shirt,.72)); g.addColorStop(.5,shade(lk.shirt,1.15)); g.addColorStop(1,shade(lk.shirt,.68)); c.fillStyle=g; c.beginPath(); c.ellipse(0,0,3.5,6,0,0,TAU); c.fill(); c.strokeStyle='rgba(0,0,0,.35)'; c.lineWidth=.5; c.stroke();
  if(o.bag){ c.fillStyle=o.bag; rr(c,-6,-3.6,3.4,7.2,1); c.fill(); }
  c.fillStyle=lk.skin; c.beginPath(); c.arc(1,0,3,0,TAU); c.fill(); c.fillStyle=lk.hair; c.beginPath(); if(lk.fem) c.ellipse(-1,0,3.6,3.3,0,0,TAU); else c.arc(-.2,0,3,0,TAU); c.fill();
  if(lk.cap){ c.fillStyle=lk.cap; c.beginPath(); c.arc(0,0,3.2,0,TAU); c.fill(); c.fillRect(1.5,-2,3,4); }
  if(o.helmet){ c.fillStyle=o.helmet; c.beginPath(); c.arc(0,0,3.6,0,TAU); c.fill(); }
  if(o.umb){ c.rotate(-a); const u=lk.umb,gg=c.createRadialGradient(-2,-2,1,0,0,11); gg.addColorStop(0,shade(u,1.3)); gg.addColorStop(1,shade(u,.75)); c.fillStyle=gg; c.beginPath(); for(let q=0;q<8;q++){ const an=q/8*TAU; c.lineTo(Math.cos(an)*11,Math.sin(an)*11); } c.closePath(); c.fill(); c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=.5; c.beginPath(); for(let q=0;q<8;q++){ const an=q/8*TAU; c.moveTo(0,0); c.lineTo(Math.cos(an)*11,Math.sin(an)*11); } c.stroke(); }
  c.restore(); }
/* 樹冠 */
const CAN=[]; function canopy(v){ if(CAN[v]) return CAN[v]; const cv=document.createElement('canvas'); cv.width=cv.height=96; const c=cv.getContext('2d'),R=mul(v*31+7); const base=[['#3f7a34','#6aa84a'],['#356b30','#5b9a42'],['#4a8838','#7ab858'],['#2f6a3a','#58a060'],['#3f7a34','#c84a5a'],['#4a8838','#e8c83a']][v];
  for(let k=0;k<9;k++){ const a=R()*TAU,r=R()*20,x=48+Math.cos(a)*r,y=48+Math.sin(a)*r,s=16+R()*12; const g=c.createRadialGradient(x-s*.35,y-s*.35,2,x,y,s); g.addColorStop(0,v>=4&&k>5?base[1]:shade(base[0],1.35)); g.addColorStop(1,shade(base[0],.7)); c.fillStyle=g; c.beginPath(); c.arc(x,y,s,0,TAU); c.fill(); }
  if(v>=4){ for(let k=0;k<26;k++){ c.fillStyle=base[1]; c.beginPath(); c.arc(48+(R()-.5)*60,48+(R()-.5)*60,1.6+R()*1.6,0,TAU); c.fill(); } }
  return CAN[v]=cv; }

/* ---------- 屋頂 ---------- */
function roofCv(bd){ if(bd.cv) return bd.cv; const w=bd.x1-bd.x0,h=bd.y1-bd.y0,cv=document.createElement('canvas'); cv.width=Math.max(4,Math.ceil(w*TSC)); cv.height=Math.max(4,Math.ceil(h*TSC)); const c=cv.getContext('2d'); c.scale(TSC,TSC); const R=mul(bd.seed);
  const base=bd.kind==='tower'?pick(R,['#6a6e74','#7a7e84','#5a5e64']):bd.kind==='temple'?'#c04a2c':bd.kind==='pav'?'#2f7a5a':bd.kind==='school'?'#c8b8a0':pick(R,['#a9a59c','#b8b2a6','#9a968e','#b0aa9e','#c0bab0']);
  if(bd.kind==='temple'||bd.kind==='pav'){ const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,shade(base,1.15)); g.addColorStop(.5,shade(base,.85)); g.addColorStop(1,shade(base,1.1)); c.fillStyle=g; c.fillRect(0,0,w,h); c.strokeStyle='rgba(60,20,10,.35)'; c.lineWidth=.6; for(let y=2;y<h;y+=2.6){ c.beginPath(); c.moveTo(0,y); c.lineTo(w,y); c.stroke(); }
    c.strokeStyle='#e8c070'; c.lineWidth=1.6; c.beginPath(); c.moveTo(0,0); c.lineTo(w*.22,h/2); c.lineTo(0,h); c.moveTo(w,0); c.lineTo(w*.78,h/2); c.lineTo(w,h); c.stroke();
    c.lineWidth=3.2; c.strokeStyle='#e0b050'; c.beginPath(); c.moveTo(w*.22,h/2); c.lineTo(w*.78,h/2); c.stroke(); c.lineWidth=1.4; c.strokeStyle='#2a8a7a'; c.beginPath(); c.moveTo(w*.22,h/2); c.lineTo(w*.78,h/2); c.stroke();
    if(bd.kind==='temple'){ for(let k=0;k<8;k++){ c.fillStyle=['#3ab0c8','#e8d040','#5ac85a','#e85a5a'][k%4]; c.beginPath(); c.arc(w*.25+k*w*.07,h/2,1.6,0,TAU); c.fill(); } c.strokeStyle='#e8c070'; c.lineWidth=1.8; for(const sx of [1,-1]){ const x=sx>0?w*.22:w*.78; c.beginPath(); c.moveTo(x,h/2); c.quadraticCurveTo(x-sx*8,h/2-2,x-sx*10,h/2-8); c.stroke(); } c.fillStyle='#e8d040'; c.beginPath(); c.arc(w/2,h/2,3,0,TAU); c.fill(); }
    c.strokeStyle='rgba(0,0,0,.5)'; c.lineWidth=1; c.strokeRect(.5,.5,w-1,h-1); return bd.cv=cv; }
  const g=c.createLinearGradient(0,0,w,h); g.addColorStop(0,shade(base,1.08)); g.addColorStop(1,shade(base,.9)); c.fillStyle=g; c.fillRect(0,0,w,h);
  for(let k=0;k<Math.floor(w*h/200);k++){ c.fillStyle='rgba(0,0,0,'+(R()*.08)+')'; c.beginPath(); c.arc(R()*w,R()*h,1+R()*5,0,TAU); c.fill(); }
  c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=1.4; c.beginPath(); c.moveTo(.7,h-.7); c.lineTo(.7,.7); c.lineTo(w-.7,.7); c.stroke(); c.strokeStyle='rgba(0,0,0,.35)'; c.beginPath(); c.moveTo(w-.7,.7); c.lineTo(w-.7,h-.7); c.lineTo(.7,h-.7); c.stroke();
  const box=(x,y,bw,bh,col,sh)=>{ c.fillStyle='rgba(0,0,0,.3)'; c.fillRect(x+(sh||1.5),y+(sh||1.5)*1.3,bw,bh); c.fillStyle=col; c.fillRect(x,y,bw,bh); c.strokeStyle='rgba(0,0,0,.35)'; c.lineWidth=.5; c.strokeRect(x,y,bw,bh); };
  const tank=(x,y,r,kind)=>{ c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.arc(x+1.6,y+2,r,0,TAU); c.fill(); const gg=c.createRadialGradient(x-r*.4,y-r*.4,.5,x,y,r); if(kind===0){ gg.addColorStop(0,'#f4f6f8'); gg.addColorStop(1,'#8a9098'); } else if(kind===1){ gg.addColorStop(0,'#7ab0e8'); gg.addColorStop(1,'#2a5a98'); } else { gg.addColorStop(0,'#fff'); gg.addColorStop(1,'#b8bcc0'); } c.fillStyle=gg; c.beginPath(); c.arc(x,y,r,0,TAU); c.fill(); c.strokeStyle='rgba(0,0,0,.3)'; c.lineWidth=.4; c.stroke(); c.beginPath(); c.arc(x,y,r*.35,0,TAU); c.stroke(); };
  const ac=(x,y)=>{ box(x,y,6,4.4,'#dcdcd4',1); c.fillStyle='#555'; c.beginPath(); c.arc(x+3.8,y+2.2,1.5,0,TAU); c.fill(); };
  if(bd.kind==='old'){ if(R()<.65){ const sw=w*(.5+R()*.45),sh=h*(.45+R()*.45),sx=R()*(w-sw),sy=R()*(h-sh),col=pick(R,['#4a74a8','#4d8a6a','#a0603a','#d8d8d0','#3a6a9a','#8a8a90']); c.fillStyle='rgba(0,0,0,.3)'; c.fillRect(sx+2,sy+2.6,sw,sh); const gg=c.createLinearGradient(sx,sy,sx,sy+sh); gg.addColorStop(0,shade(col,1.2)); gg.addColorStop(.5,shade(col,.9)); gg.addColorStop(1,shade(col,1.05)); c.fillStyle=gg; c.fillRect(sx,sy,sw,sh); c.strokeStyle='rgba(0,0,0,.18)'; c.lineWidth=.5; const vert=sw<sh; c.beginPath(); if(vert) for(let y=sy+1.5;y<sy+sh;y+=1.6){ c.moveTo(sx,y); c.lineTo(sx+sw,y); } else for(let x=sx+1.5;x<sx+sw;x+=1.6){ c.moveTo(x,sy); c.lineTo(x,sy+sh); } c.stroke(); c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=.8; c.beginPath(); if(vert){ c.moveTo(sx+sw/2,sy); c.lineTo(sx+sw/2,sy+sh); } else { c.moveTo(sx,sy+sh/2); c.lineTo(sx+sw,sy+sh/2); } c.stroke(); if(R()<.3){ c.fillStyle='rgba(120,60,30,.25)'; c.fillRect(sx+sw*R(),sy,sw*.2,sh); } }
    for(let k=0;k<1+Math.floor(R()*2);k++) tank(3+R()*(w-6),3+R()*(h-6),3.2+R()*1.6,Math.floor(R()*3)); if(R()<.6) ac(R()*(w-7),R()*(h-6)); if(R()<.4){ c.fillStyle='#4a8a3a'; for(let k=0;k<4;k++){ c.beginPath(); c.arc(2+R()*(w-4),2+R()*(h-4),1.6,0,TAU); c.fill(); } } }
  else if(bd.kind==='mid'||bd.kind==='school'||bd.kind==='police'||bd.kind==='booth'){ if(w>24&&h>24){ const sw2=Math.min(22,w*.3),sh2=Math.min(18,h*.3),sx=R()*(w-sw2-4)+2,sy=R()*(h-sh2-4)+2; box(sx,sy,sw2,sh2,shade(base,1.12),2.4); for(let k=0;k<2+Math.floor(R()*3);k++) tank(4+R()*(w-8),4+R()*(h-8),3.4+R()*1.6,Math.floor(R()*3)); for(let k=0;k<Math.floor(w*h/700);k++) ac(R()*(w-7),R()*(h-6)); if(R()<.35){ const px=R()*(w*.5),py=R()*(h*.5); c.fillStyle='#1c2a48'; c.fillRect(px,py,w*.4,h*.3); c.strokeStyle='rgba(150,180,220,.4)'; c.lineWidth=.4; for(let x=px;x<px+w*.4;x+=3){ c.beginPath(); c.moveTo(x,py); c.lineTo(x,py+h*.3); c.stroke(); } } if(R()<.3){ c.fillStyle='#ddd'; c.beginPath(); c.arc(w*R(),h*R(),2.6,0,TAU); c.fill(); } }
    if(bd.kind==='police'){ c.fillStyle='#1d4fa8'; c.fillRect(0,0,w,3); c.fillRect(0,h-3,w,3); } if(bd.kind==='school'){ c.fillStyle='#b5523e'; c.fillRect(0,0,w,2.4); c.fillRect(0,h-2.4,w,2.4); } }
  else if(bd.kind==='tower'||bd.kind==='hosp'){ c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(3,3,w-6,h-6); const cx=w/2,cy=h/2; if(bd.kind==='hosp'||(w>70&&h>70&&R()<.6)){ c.fillStyle='#3a3c40'; c.beginPath(); c.arc(cx,cy,Math.min(w,h)*.3,0,TAU); c.fill(); c.strokeStyle='#e8c21c'; c.lineWidth=1.6; c.beginPath(); c.arc(cx,cy,Math.min(w,h)*.27,0,TAU); c.stroke(); c.fillStyle=bd.kind==='hosp'?'#e83a3a':'#fff'; c.font='900 '+Math.min(w,h)*.3+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('H',cx,cy+1); }
    else { box(cx-w*.2,cy-h*.18,w*.4,h*.36,shade(base,1.2),3); c.strokeStyle='rgba(0,0,0,.3)'; c.lineWidth=.5; for(let x=cx-w*.18;x<cx+w*.2;x+=2.5){ c.beginPath(); c.moveTo(x,cy-h*.16); c.lineTo(x,cy+h*.16); c.stroke(); } }
    for(let k=0;k<4;k++) ac(4+R()*(w-14),4+R()*(h-12)); c.fillStyle='#c8202a'; c.beginPath(); c.arc(w-4,4,1.3,0,TAU); c.fill(); }
  return bd.cv=cv; }

/* ---------- 大樓：牆面依鏡頭位置往外傾（俯視透視），屋頂往外推 ---------- */
function drawBld(c,bd,cx,cy,night,glow){ const k=bd.ht*KL,X=x=>x+(x-cx)*k,Y=y=>y+(y-cy)*k;
  const faces=[]; if(cy>bd.y1) faces.push(['S',bd.x0,bd.y1,bd.x1,bd.y1,.74]); if(cy<bd.y0) faces.push(['N',bd.x1,bd.y0,bd.x0,bd.y0,1]); if(cx>bd.x1) faces.push(['E',bd.x1,bd.y1,bd.x1,bd.y0,.66]); if(cx<bd.x0) faces.push(['W',bd.x0,bd.y0,bd.x0,bd.y1,.92]);
  const nf=Math.max(1,Math.floor(bd.ht/3.3)),win=bd.kind!=='temple'&&bd.kind!=='pav'&&bd.kind!=='booth';
  for(const f of faces){ const ax=f[1],ay=f[2],bx=f[3],by=f[4],axr=X(ax),ayr=Y(ay),bxr=X(bx),byr=Y(by),dep=Math.hypot(axr-ax,ayr-ay);
    const pt=(u,t)=>[lerp(lerp(ax,bx,u),lerp(axr,bxr,u),t),lerp(lerp(ay,by,u),lerp(ayr,byr,u),t)];
    if(!glow){ c.fillStyle=shade(bd.wall,f[5]); c.beginPath(); c.moveTo(ax,ay); c.lineTo(bx,by); c.lineTo(bxr,byr); c.lineTo(axr,ayr); c.closePath(); c.fill(); c.strokeStyle='rgba(0,0,0,.35)'; c.lineWidth=.6; c.stroke();
      if(dep>4&&win){ const lw=dep/nf; c.lineWidth=lw*(bd.kind==='tower'?.62:.42); c.strokeStyle=bd.kind==='tower'?'rgba(150,190,215,.55)':bd.kind==='old'?'rgba(70,74,78,.75)':'rgba(40,52,66,.6)'; const len=Math.hypot(bx-ax,by-ay); if(bd.kind!=='tower') c.setLineDash([Math.max(2,len/Math.max(2,Math.round(len/9))*.55),Math.max(1.5,len/Math.max(2,Math.round(len/9))*.45)]); c.beginPath(); for(let q=0;q<nf;q++){ const t=(q+.55)/nf,p0=pt(.06,t),p1=pt(.94,t); c.moveTo(p0[0],p0[1]); c.lineTo(p1[0],p1[1]); } c.stroke(); c.setLineDash([]); }
      if(dep>3&&bd.kind==='temple'){ c.fillStyle='#e0a030'; const p0=pt(0,.85),p1=pt(1,.85),p2=pt(1,1),p3=pt(0,1); c.beginPath(); c.moveTo(p0[0],p0[1]); c.lineTo(p1[0],p1[1]); c.lineTo(p2[0],p2[1]); c.lineTo(p3[0],p3[1]); c.fill(); c.fillStyle='#e83020'; for(let q=1;q<6;q++){ const p=pt(q/6,.6); c.beginPath(); c.arc(p[0],p[1],Math.min(2.4,dep*.08),0,TAU); c.fill(); } } }
    else if(dep>4&&win){ const R=mul(bd.seed+f[0].charCodeAt(0)); c.strokeStyle=bd.kind==='tower'?'rgba(170,210,255,.5)':'rgba(255,214,140,.85)'; c.lineWidth=dep/nf*.4; c.beginPath(); for(let q=0;q<nf;q++){ const t=(q+.55)/nf; let u=.06; while(u<.94){ const l=.04+R()*.12; if(R()<.45){ const p0=pt(u,t),p1=pt(Math.min(.94,u+l),t); c.moveTo(p0[0],p0[1]); c.lineTo(p1[0],p1[1]); } u+=l+.03; } } c.stroke(); }
    /* 招牌 */
    if(dep>5) for(const s of bd.signs){ if(s.f!==f[0]) continue; const t1=Math.min(s.t1,.9),q=[pt(s.u,s.t0),pt(s.u+s.w,s.t0),pt(s.u+s.w,t1),pt(s.u,t1)]; c.fillStyle=glow?s.bg:shade(s.bg.length===7?s.bg:'#888888',night?.55:1); if(glow) c.globalAlpha=.85; c.beginPath(); c.moveTo(q[0][0],q[0][1]); for(let i=1;i<4;i++) c.lineTo(q[i][0],q[i][1]); c.closePath(); c.fill(); c.globalAlpha=1;
      const wid=Math.hypot(q[1][0]-q[0][0],q[1][1]-q[0][1]),hei=Math.hypot(q[3][0]-q[0][0],q[3][1]-q[0][1]),mx=(q[0][0]+q[2][0])/2,my=(q[0][1]+q[2][1])/2; c.fillStyle=s.fg; c.textAlign='center'; c.textBaseline='middle';
      if(s.v&&hei>wid){ const n=s.txt.length,fs=Math.min(wid*.8,hei/n*.85); if(fs>=2.4){ c.font='900 '+fs+'px '+TC; const dx=(q[3][0]-q[0][0])/n,dy=(q[3][1]-q[0][1])/n; for(let i=0;i<n;i++) c.fillText(s.txt[i],q[0][0]+(q[1][0]-q[0][0])/2+dx*(i+.5),q[0][1]+(q[1][1]-q[0][1])/2+dy*(i+.5)); } }
      else { const fs=Math.min(hei*.7,wid/s.txt.length*.9); if(fs>=2.4){ c.font='900 '+fs+'px '+TC; c.fillText(s.txt,mx,my); } } } }
  if(glow) return;
  const rx=X(bd.x0),ry=Y(bd.y0),rw=(bd.x1-bd.x0)*(1+k),rh=(bd.y1-bd.y0)*(1+k); c.drawImage(roofCv(bd),rx,ry,rw,rh);
  if(night){ c.fillStyle='rgba(10,14,30,'+(night*.5)+')'; c.fillRect(rx,ry,rw,rh); } }

/* ---------- 關卡 ---------- */
const TN={run:'限時快遞',taxi:'計程車載客',catch:'追捕嫌犯',park:'停車挑戰',amb:'救護車出勤',escape:'護送證人',race:'地下賽車',tail:'跟蹤任務',repo:'偷車任務',lose:'甩掉警察',story:'主線任務'};
const CHAP=['第一章 新人上路','第二章 臥底車行','第三章 風聲走漏','第四章 反擊','第五章 收網','第六章 港都新傳說'];
/* 60 關：[章, 種類, 名稱, 城區, 時段(0白天 1黃昏 2陰雨 3夜晚), 天氣, 參數, 開場對話] */
const SD=[
 [0,'run','第一天上班',0,0,'clear',{veh:'van',n:3},[['disp','阿傑，歡迎來到港都快遞！第一天上班，先送三件包裹熟悉一下路。'],['me','好！交給我吧！']]],
 [0,'park','駕訓班補考',0,0,'clear',{lot:1},[['coach','阿傑，你路考停車那關沒過，今天補考！停進黃色格子就好。']]],
 [0,'taxi','代班小黃',1,0,'clear',{n:2},[['taxi','阿傑，我今天腰閃到，小黃借你開一天，客人別載丟啦！']]],
 [0,'run','機車外送',1,0,'clear',{veh:'scooter',n:4},[['disp','中午便當單爆量！騎機車比較好鑽，四份便當趕快送。']]],
 [0,'story','捷運上的約定',1,0,'clear',{foot:1,steps:[{k:'go',to:'mrt:0',need:'foot',txt:'走到捷運站入口',r:34},{k:'mrt',to:1},{k:'talk',who:'chief',to:'mrt:1',lines:[['chief','你就是阿傑？我是刑事組的林組長。'],['chief','你哥當年就是被黑鯊幫害的。我需要一個會開車、又沒被他們認出來的人。'],['me','你要我當臥底？'],['chief','先去老K車行應徵，那裡是他們的據點。有事用這支手機聯絡。']]},{k:'go',to:'garage',need:'any',txt:'到老K車行看看',r:70}]},[['me','（手機簡訊：「想知道你哥的事，搭捷運，出站見。」）'],['me','……走路去捷運站吧。']]],
 [0,'park','路邊停車',0,1,'clear',{curb:1},[['coach','今天練路邊停車，前後都有車，慢慢對準、不要撞到人家。']]],
 [0,'amb','救護車志工',0,0,'shower',{n:1},[['doc','阿傑，今天你是救護車志工，跟著警報器開，前面的車會讓路。']]],
 [0,'lose','臨檢風波',1,1,'clear',{stars:1},[['scan','前方車輛請靠邊停車受檢！'],['me','慘了，這台二手車還沒過戶…先甩掉再說！']]],
 [0,'story','單車送文件',2,0,'clear',{foot:1,steps:[{k:'ride',ty:'bike',txt:'去路邊的公共單車站借一台單車'},{k:'go',to:'lm',need:'bike',txt:'騎單車把文件送到',r:60},{k:'go',to:'lm',need:'bike',txt:'再送下一份',r:60}]},[['disp','河濱區今天封路辦活動，汽車開不進去，騎公共單車送兩份文件吧！']]],
 [0,'catch','黃昏追撞',2,1,'clear',{},[['chief','阿傑，幫個忙！臨時借你一台警車，前面那台紅車剛搶了金飾店！']]],
 [1,'repo','老K的考驗',2,0,'clear',{stars:1},[['k','想在我這做事？先證明你的本事。'],['k','河邊停了一台白色轎車，開回來給我。別讓條子跟回來！']]],
 [1,'story','搶來的跑車',2,3,'clear',{foot:1,steps:[{k:'hijack',ty:'sports',col:'#e8c21c',txt:'攔下那台黃色跑車，搶過來開'},{k:'lose',txt:'甩掉警察'},{k:'go',to:'garage',need:'car',clean:1,txt:'把跑車開回老K車行',r:70}]},[['k','今晚有台黃色跑車在附近繞，客人指定要那台。'],['me','（林組長說要先取得他們信任…只能照做了。）']]],
 [1,'race','港口地下賽',4,3,'clear',{n:6,riv:3},[['biao','聽說你很會開？今晚港口賽一場，贏了才算自己人。']]],
 [1,'tail','跟蹤阿彪',4,1,'clear',{veh:'van',col:'#16181c'},[['chief','阿彪今天要去交貨，跟著他的黑色廂型車，別靠太近，也別跟丟！']]],
 [1,'story','雨夜收帳',4,2,'rain',{veh:'scooter',steps:[{k:'collect',n:3,txt:'下車走進店裡收錢'},{k:'go',to:'garage',need:'any',clean:1,txt:'把錢帶回老K車行',r:70}]},[['k','下雨天條子少，騎機車去收三家店的帳。'],['me','（每一筆都是證據……）']]],
 [1,'run','低調交貨',4,0,'clear',{veh:'van',n:3,clean:1},[['biao','這三箱貨送到碼頭附近，路上別招惹條子，被盯上就全完了。']]],
 [1,'taxi','小黃上的密談',2,1,'clear',{n:2,smooth:1},[['chief','阿彪今天會叫車，我們安排你開那台計程車。開穩一點，他們講的話全會被錄下來。']]],
 [1,'lose','甩掉巡邏車',2,3,'clear',{stars:3},[['scan','可疑車輛連闖紅燈，各單位注意攔截！'],['biao','後面有條子！快甩掉，別把他們帶到車行！']]],
 [1,'amb','搶救線人',4,3,'clear',{n:1},[['chief','我們的線人被打傷倒在路邊！快開救護車去，別讓他死了！']]],
 [1,'catch','港口追逐',4,0,'clear',{},[['chief','他們把贓車零件裝上車要開溜了！開警車撞停那台紅車！']]],
 [2,'escape','被識破',3,1,'clear',{},[['wit','阿傑…他們知道你是臥底了！車行的人追過來了！'],['chief','把張先生送到警察局，快！']]],
 [2,'story','換車脫身',3,2,'shower',{lowhp:1,steps:[{k:'chasers',n:2},{k:'ride',ty:'scooter',txt:'車快爛了！下車騎路邊的機車'},{k:'go',to:'mrt:0',need:'any',txt:'到捷運站',r:40},{k:'mrt',to:2},{k:'go',to:'police',need:'any',txt:'去警察局找林組長',r:70}]},[['me','車子撐不住了，後面還有人追…'],['chief','換機車鑽小路，再搭捷運甩掉他們！']]],
 [2,'taxi','下班尖峰',3,1,'clear',{n:3},[['taxi','阿傑，先回來開小黃避避風頭吧。下班尖峰，客人很多！']]],
 [2,'escape','雨夜護送',5,2,'rain',{},[['chief','證人要轉移到園區的警局，路上可能有埋伏，小心！']]],
 [2,'tail','追蹤貨車',5,3,'clear',{veh:'truck',col:'#e8e8e8'},[['chief','有台發財車載著贓車零件，跟著它找出倉庫在哪。']]],
 [2,'park','精準停車',5,0,'clear',{lot:1,tight:1},[['coach','阿傑，聽說你要考職業駕照？這格很窄，慢慢來。']]],
 [2,'run','颱風天送藥',3,2,'storm',{veh:'van',n:3},[['disp','颱風快登陸了，三間診所急需這些藥，路上小心強風豪雨！']]],
 [2,'lose','警匪兩面',5,3,'clear',{stars:4},[['scan','通緝犯駕駛車輛逃逸中，所有單位注意！'],['me','什麼？！黑鯊幫栽贓給我？！'],['chief','先甩掉他們，我會想辦法洗清你的罪名！']]],
 [2,'race','園區夜賽',5,3,'fog',{n:7,riv:3},[['biao','還敢回來？好啊，再比一場，輸的人滾出港都！']]],
 [2,'catch','銀行搶案',3,0,'clear',{boss:1},[['chief','銀行剛被搶！嫌犯開紅色跑車往園區逃，阿傑你離最近！']]],
 [3,'run','夜市外送',6,3,'clear',{veh:'scooter',n:4},[['disp','夜市人超多，騎機車送四份宵夜，小心行人！']]],
 [3,'catch','老街追捕',7,0,'clear',{foot:1},[['chief','嫌犯跑進老街了，車子開不進去，下車用跑的追！']]],
 [3,'story','救出小芳',6,3,'clear',{steps:[{k:'go',to:'lm',need:'any',txt:'到小芳被關的倉庫',r:60},{k:'talk',who:'fang',to:'here',lines:[['fang','阿傑！你終於來了！'],['me','小芳，快上車，我帶你走！']]},{k:'board',who:'fang'},{k:'chasers',n:2},{k:'go',to:'hosp',need:'car',txt:'送小芳到醫院',r:70},{k:'drop'}]},[['k','你的朋友小芳在我們手上，想救她就自己來。'],['me','老K…你給我等著！']]],
 [3,'catch','假警車',6,1,'clear',{fake:1},[['chief','有人開假警車攔路搶劫！那台警車是假的，撞停它！']]],
 [3,'tail','找出巢穴',7,3,'fog',{veh:'suv',col:'#16181c'},[['chief','起霧了，黑頭車要回巢穴。跟緊一點，霧裡很容易跟丟。']]],
 [3,'story','拆穿內鬼',7,0,'clear',{foot:1,steps:[{k:'go',to:'temple',need:'foot',txt:'到廟口找記者',r:60},{k:'talk',who:'news',to:'here',lines:[['news','你就是阿傑？我查到警局裡有黑鯊幫的內鬼。'],['news','證據在一個隨身碟裡，藏在附近，你去拿，我不方便露面。']]},{k:'collect',n:1,txt:'找到隨身碟'},{k:'mrt',to:2},{k:'go',to:'police',need:'any',txt:'交給林組長',r:70}]},[['chief','阿傑，有個記者說有內鬼的證據，約你在廟口見面。']]],
 [3,'escape','爆胎危機',6,2,'rain',{lowhp:1},[['wit','車子好像被動了手腳…快撐不住了！'],['chief','車壞了就換一台，一定要把證人送到！']]],
 [3,'amb','深夜急診',7,3,'clear',{n:2},[['doc','今晚兩起車禍，傷患都很危險，拜託你了。']]],
 [3,'lose','突破路障',6,3,'clear',{stars:5},[['scan','全面封鎖夜市商圈，設置路障攔截！'],['me','內鬼故意放消息…只能硬闖了！']]],
 [3,'race','老街決戰',7,1,'clear',{n:8,riv:3},[['biao','最後一場，我們兩個好好比一比！']]],
 [4,'taxi','最後一趟小黃',1,3,'clear',{n:2,smooth:1},[['chief','鯊哥的手下今晚要叫車去談生意，你開小黃載他們，全程錄音。']]],
 [4,'story','偷回證物',4,3,'clear',{foot:1,steps:[{k:'steal',ty:'van',col:'#16181c',stars:2,txt:'偷走裝證物的黑色廂型車'},{k:'lose',txt:'甩掉警察'},{k:'go',to:'police',need:'car',txt:'把證物車開到警察局',r:70}]},[['chief','證物被他們搬上一台黑色廂型車，偷回來！']]],
 [4,'catch','港口大追捕',4,1,'clear',{boss:1},[['chief','收網行動開始！阿彪要開跑車逃走，撞停他！']]],
 [4,'lose','全城通緝',0,3,'storm',{stars:5,dest:'police'},[['scan','全城通緝！'],['chief','內鬼下了全城通緝令…甩掉他們，到警察局找我，我們當面揭穿他！']]],
 [4,'amb','傷患轉送',3,0,'clear',{n:2},[['doc','收網行動有人受傷，送到醫院，拜託了！']]],
 [4,'escape','證人最後一程',5,2,'rain',{},[['wit','明天就要出庭了…阿傑，最後一程拜託你了。']]],
 [4,'park','極限路邊停車',6,3,'rain',{curb:1,tight:1},[['coach','職業駕照最後一關：下雨天的極限路邊停車！']]],
 [4,'catch','鯊哥的逃亡',2,3,'clear',{boss:2},[['chief','鯊哥開車逃了！這是最後機會，一定要抓到他！'],['boss','想抓我？下輩子吧！']]],
 [4,'race','全城終極賽',1,3,'clear',{n:9,riv:4},[['biao','我出獄前，最後跟你比一場正正當當的。']]],
 [4,'story','新的開始',0,1,'clear',{steps:[{k:'go',to:'hosp',need:'any',txt:'去醫院接小芳出院',r:70},{k:'talk',who:'fang',to:'here',lines:[['fang','阿傑！謝謝你。'],['me','走吧，我們去吃好料的！']]},{k:'board',who:'fang'},{k:'go',to:'lm',need:'car',txt:'載小芳去吃飯',r:70},{k:'drop'},{k:'talk',who:'chief',to:'here',lines:[['chief','阿傑，黑鯊幫全部落網了，你哥可以安息了。'],['chief','警局缺一個會開車的好手……有沒有興趣？'],['me','我考慮看看！（笑）']]}]},[['me','事情終於結束了……']]],
 [5,'run','王牌帶新人',0,0,'clear',{veh:'van',n:4},[['disp','阿傑，你現在是港都快遞的王牌了！帶新人跑一趟，四件包裹。']]],
 [5,'race','園區合法賽車',5,1,'clear',{n:8,riv:3},[['biao','我出獄了！這次在賽道上正正當當比一場。']]],
 [5,'tail','跟蹤殘黨老大',4,3,'fog',{veh:'suv',col:'#2a2a30'},[['chief','黑鯊幫殘黨的老大回到港口了，跟著他的黑色休旅車，找出新據點。']]],
 [5,'amb','颱風夜救援',3,2,'storm',{n:2},[['doc','颱風夜有兩名傷患困在路上，拜託你快去！']]],
 [5,'taxi','夜市載客王',6,3,'clear',{n:4},[['taxi','夜市散場人潮多，今晚幫我載四組客人！']]],
 [5,'repo','追回客人的車',1,1,'clear',{stars:2},[['k','最後幫我一次，客人的車被偷了，找到後開回車行。'],['me','好，這次是正當的！']]],
 [5,'park','山城窄巷停車',7,0,'clear',{curb:1,tight:1},[['coach','山城老街的巷子很窄，挑戰最難的路邊停車！']]],
 [5,'escape','證人再護送',2,1,'rain',{},[['wit','又有人要找我麻煩…阿傑，拜託再載我一程！']]],
 [5,'lose','深夜測車風波',1,3,'clear',{stars:3},[['scan','有車輛深夜高速行駛，各單位注意！'],['me','我只是在測新車啊…先甩掉再說！']]],
 [5,'catch','幕後黑手',4,3,'clear',{boss:2},[['chief','黑鯊幫真正的幕後老大要逃到碼頭了，撞停他的車！'],['boss','你以為抓到鯊哥就結束了？']]]];
const NST=SD.length,STAGES=SD.map((q,s)=>({ch:q[0],type:q[1],n:q[2],di:q[3],th:q[4],wx:q[5],o:q[6],intro:q[7],tier:q[0],d:s/(SD.length-1)}));
const lKey='arcade.chase.s.',getR=i=>{ try{ const v=localStorage.getItem(lKey+i); return v==null?null:+v; }catch(e){ return null; } },setR=(i,v)=>{ try{ const o=getR(i); if(o==null||v>o) localStorage.setItem(lKey+i,String(v)); }catch(e){} };
const CH={me:{n:'阿傑',skin:'#e0b48e',hair:'#1a1410',shirt:'#2a4a7a'},biao:{n:'阿彪',skin:'#c99a74',hair:'#111',shirt:'#1e1e22'},k:{n:'車行 老K',skin:'#d8a882',hair:'#8a8a8a',shirt:'#6a4a2a'},fang:{n:'小芳',skin:'#f3cfb0',hair:'#3a2418',shirt:'#e88aa8',fem:1},boss:{n:'鯊哥',skin:'#d8a47c',hair:'#111',shirt:'#3a2a4a'},scan:{n:'警用無線電',skin:'#deb08a',hair:'#1c1c1c',shirt:'#1f2f4d',cap:'#1f2f4d',set:1},news:{n:'記者 林小姐',skin:'#f0c8a2',hair:'#2a1a12',shirt:'#c8402e',fem:1},disp:{n:'調度員 小美',skin:'#f3cfb0',hair:'#2a1a12',shirt:'#3d6fb3',fem:1,set:1},chief:{n:'林組長',skin:'#deb08a',hair:'#1c1c1c',shirt:'#1f2f4d',cap:'#1f2f4d'},doc:{n:'急診 陳醫師',skin:'#f0c8a2',hair:'#3a2a1c',shirt:'#f4f4f4',fem:1},coach:{n:'駕訓班 王教練',skin:'#d8a47c',hair:'#666',shirt:'#c0392b'},taxi:{n:'車隊台 阿雄',skin:'#e0b48e',hair:'#222',shirt:'#e8c21c',set:1},wit:{n:'證人 張先生',skin:'#e8bd98',hair:'#333',shirt:'#6b6b6b'}};
function portrait(c,x,y,s,L,t,talk){ c.save(); c.translate(x,y); c.scale(s/60,s/60); const g=c.createLinearGradient(0,0,0,60); g.addColorStop(0,'#3a4a5e'); g.addColorStop(1,'#1c2430'); c.fillStyle=g; rr(c,0,0,60,60,8); c.fill(); c.save(); rr(c,0,0,60,60,8); c.clip();
  c.fillStyle=L.shirt; c.beginPath(); c.moveTo(6,62); c.quadraticCurveTo(8,44,30,42); c.quadraticCurveTo(52,44,54,62); c.fill(); if(L.shirt==='#f4f4f4'){ c.strokeStyle='#bbb'; c.lineWidth=1; c.beginPath(); c.moveTo(30,44); c.lineTo(30,60); c.stroke(); }
  c.fillStyle=shade(L.skin,.85); c.fillRect(25,34,10,10);
  if(L.fem){ c.fillStyle=L.hair; c.beginPath(); c.ellipse(30,30,15,19,0,0,TAU); c.fill(); }
  const fg=c.createRadialGradient(26,22,2,30,26,14); fg.addColorStop(0,shade(L.skin,1.1)); fg.addColorStop(1,shade(L.skin,.82)); c.fillStyle=fg; c.beginPath(); c.ellipse(30,26,11,13.5,0,0,TAU); c.fill();
  c.fillStyle=shade(L.skin,.8); c.beginPath(); c.ellipse(18.6,27,2,3.4,0,0,TAU); c.ellipse(41.4,27,2,3.4,0,0,TAU); c.fill();
  c.fillStyle=L.hair; c.beginPath(); c.ellipse(30,16,12.5,8,0,PI,TAU); c.fill(); c.beginPath(); c.moveTo(18,19); c.quadraticCurveTo(26,10,42,18); c.lineTo(42,14); c.quadraticCurveTo(30,4,18,14); c.fill();
  if(L.cap){ c.fillStyle=L.cap; c.beginPath(); c.ellipse(30,13,13.5,7,0,PI,TAU); c.fill(); c.fillRect(16,12,28,4); c.fillStyle='#e8c21c'; c.beginPath(); c.arc(30,10,2,0,TAU); c.fill(); }
  const bl=(t*.7%4)<.12; c.fillStyle='#fff'; for(const ex of [25.5,34.5]){ c.beginPath(); c.ellipse(ex,25,2.6,bl?.3:1.7,0,0,TAU); c.fill(); } if(!bl){ c.fillStyle='#2a1c14'; for(const ex of [25.8,34.8]){ c.beginPath(); c.arc(ex,25,1.2,0,TAU); c.fill(); } c.fillStyle='#fff'; for(const ex of [26.2,35.2]) c.fillRect(ex,24.2,.6,.6); }
  c.strokeStyle=shade(L.hair,.9); c.lineWidth=1.2; c.beginPath(); c.moveTo(22.5,21.6); c.lineTo(28,21); c.moveTo(32,21); c.lineTo(37.5,21.6); c.stroke();
  c.strokeStyle=shade(L.skin,.7); c.lineWidth=.9; c.beginPath(); c.moveTo(30,26); c.lineTo(29,31); c.lineTo(31,31.4); c.stroke();
  const mo=talk?Math.abs(Math.sin(t*14))*2.4:0; c.fillStyle='#8a3a3a'; c.beginPath(); c.ellipse(30,35,3.4,.7+mo,0,0,TAU); c.fill();
  if(L.set){ c.strokeStyle='#222'; c.lineWidth=1.6; c.beginPath(); c.arc(30,24,14,PI*1.05,TAU*.99); c.stroke(); c.fillStyle='#333'; c.fillRect(15.5,23,4,7); c.strokeStyle='#333'; c.lineWidth=1; c.beginPath(); c.moveTo(18,29); c.quadraticCurveTo(20,36,26,36); c.stroke(); }
  c.restore(); c.strokeStyle='rgba(255,255,255,.3)'; c.lineWidth=1.5; rr(c,0,0,60,60,8); c.stroke(); c.restore(); }
function wrapTxt(c,s,w){ const out=[]; let line=''; for(const ch of s){ if(c.measureText(line+ch).width>w&&line){ out.push(line); line=ch; } else line+=ch; } if(line) out.push(line); return out; }
const keycap=(c,x,y,txt)=>{ c.font='900 11px '+TC; const w=Math.max(18,c.measureText(txt).width+10); c.fillStyle='#f4f4f0'; rr(c,x,y-9,w,18,4); c.fill(); c.fillStyle='#b8b8b0'; c.fillRect(x+2,y+6,w-4,2); c.fillStyle='#1c1c22'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(txt,x+w/2,y); return w; };

/* ---------- 遊戲 ---------- */
let VID=0;
function create(env,opts){
  const si=clamp(opts.stage|0,0,NST-1),ST=STAGES[si],dd=ST.d,Wd=getWorld(ST.di),TH=Object.assign({},THEMES[ST.th]),O=ST.o||{},prev=!!opts.preview||!!opts.bot,local2=opts.mode==='2p',np=local2?2:1;
  const {ctx:c}=env.canvas2d(W,H),sfx=n=>{ if(!opts.preview) env.sfx(n); },R=mul(((Date.now()&0xffff)*31+si*7777)>>>0||5);
  const LCV=document.createElement('canvas'); LCV.width=W; LCV.height=H; const lc=LCV.getContext('2d');
  let t=0,V=[],PD=[],FX=[],SK=[],BUB=[],DQ=[],DLG=null,ended=false,over=null,cd=prev?0:4.2,acc=0,tix=0,flash=0,shake=0,evT=12,EV=[],chatT=5;
  const lookCol=(opts.look&&opts.look.color)||'#c8202a';
  /* 天氣：雨量會慢慢變化，颱風有強風和閃電 */
  const WX={rain:0,tgt:0,fog:0,storm:0,flash:0,boltT:6,wind:0,shower:0}; { const w=ST.wx; if(w==='rain'){ WX.rain=WX.tgt=.8; } else if(w==='storm'){ WX.rain=WX.tgt=1; WX.storm=1; } else if(w==='fog'){ WX.fog=.75; } else if(w==='shower'){ WX.shower=25+R()*20; } }
  /* 通緝：heat 累積成星星，警車來追 */
  const WT={heat:0,lv:0,lose:0,spT:0,rbT:12,heli:null,sayT:0};
  let VIEW='3d',G3=null,G3fail=false,parkVer=0,sOsc=null,sGain=null;
  try{ if(window.THREE&&window.__CHASE3D&&!opts.no3d) G3=window.__CHASE3D(window.THREE,{W,H,Wd,P,HR,SW,NB,LO,HI,paintCell,VT,shade,hash,mul,lightOf,TC}); }catch(e){ console.error(e); G3=null; }
  if(!G3) VIEW='2d';
  const PL=[]; for(let i=0;i<np;i++) PL.push({i,name:local2?(i+1)+'P':(opts.name||'你'),col:i===0?lookCol:(lookCol==='#1d4fa8'?'#e8c21c':'#1d4fa8'),car:null,foot:null,nitro:1,boostOn:false,cam:{x:0,y:0,z:1},seen:{},HQ:null,pf:false,wrecks:0,wreckT:0,stam:1,hits:0,lastRed:-9,spdT:0,spdCop:-9,mrt:null,mi:{},route:[],rtT:0,bust:0,road:'',roadT:0});
  /* ---- 車子 ---- */
  function mkVeh(ty,x,y,a,col,role,o){ const T=VT[ty]; const v=Object.assign({id:++VID,ty,x,y,a,vx:0,vy:0,L:T.L,Wd:T.W,vmax:T.vmax,acc:T.acc,m:T.m,col:col||T.col||pick(R,CARC),hp:100,role,drv:-1,rd:null,turn:null,turnN:null,cruise:150,hitT:0,brake:false,slip:0,vf:0,stuck:0,rev:0,prevW:null,siren:false,haz:false,lk:null,var_:null,surf:1},o||{}); if(ty==='scooter'){ v.lk={shirt:pick(R,SHIRT),helm:pick(R,['#e8e8e8','#222','#c8202a','#f2c21c','#4a7ab8','#e88aa8']),skin:pick(R,SKIN)}; v.var_=JSON.stringify(v.lk); } if(ty==='truck') v.var_=pick(R,['#e8e8e8','#3a6ab8','#e8e8e8','#5aa04a']); V.push(v); return v; }
  const vspeed=v=>Math.hypot(v.vx,v.vy);
  function drive(v,ta,tv,boost,dt,grip){ const sp0=vspeed(v); let brake=false,ad=0;
    if(ta!=null){ const d=wrapA(ta-v.a); ad=Math.abs(d); const vf0=v.vx*Math.cos(v.a)+v.vy*Math.sin(v.a);
      const rate=Math.abs(vf0)<70?2.8:Math.abs(vf0)<180?Math.max(2.2,Math.abs(vf0)/55):clamp(3.1-(Math.abs(vf0)-180)/420,2.1,3.1);
      if(ad>2.3&&vf0>55){ brake=true; } else v.a+=clamp(d,-rate*dt,rate*dt); }
    const ca=Math.cos(v.a),sa=Math.sin(v.a); let vf=v.vx*ca+v.vy*sa,vl=-v.vx*sa+v.vy*ca;
    const vmax=v.vmax*(boost?1.3:1)*(v.hp<30?.8:1)*v.surf;
    if(ta!=null){ if(brake) vf-=Math.min(Math.max(0,vf),820*dt);
      else { const want=ad<1?1:ad<2.3?.45:.55,cap=Math.min(vmax,tv==null?1e9:tv,ad>.5?Math.max(150,vmax-ad*180):1e9);
        if(vf<cap) vf+=v.acc*(boost?1.6:1)*want*Math.max(.15,1-vf/vmax)*dt; else { vf-=Math.min(vf-cap,(tv!=null&&tv<vf-30?700:520)*dt); if(vf-cap>40) brake=true; } } }
    else { const dec=(240+Math.abs(vf)*.5)*dt; vf=Math.abs(vf)<=dec?0:vf-Math.sign(vf)*dec; brake=Math.abs(vf)>15; }
    const gp=(grip||8)*(ad>1&&sp0>300?.5:1); vl*=Math.exp(-gp*dt);
    v.vx=ca*vf-sa*vl; v.vy=sa*vf+ca*vl; v.x+=v.vx*dt; v.y+=v.vy*dt; v.brake=brake; v.slip=Math.abs(vl); v.vf=vf;
    if((v.slip>70||brake&&vf>200)&&(v.drv>=0||v.role==='suspect'||v.role==='chaser')){ const rx=v.x-ca*v.L*.32,ry=v.y-sa*v.L*.32,ox=-sa*v.Wd*.38,oy=ca*v.Wd*.38,w=[rx+ox,ry+oy,rx-ox,ry-oy]; if(v.prevW){ SK.push([v.prevW[0],v.prevW[1],w[0],w[1]],[v.prevW[2],v.prevW[3],w[2],w[3]]); if(SK.length>900) SK.splice(0,40); if(v.slip>120&&R()<.4) FX.push({k:'smoke',x:rx,y:ry,vx:0,vy:0,l:.8,L:.8,s:6,col:'200,200,200'}); } v.prevW=w; } else v.prevW=null; }
  function driveTank(v,thr,steer,boost,dt,grip){ const ca=Math.cos(v.a),sa=Math.sin(v.a); let vf=v.vx*ca+v.vy*sa,vl=-v.vx*sa+v.vy*ca,brake=false; const vmax=v.vmax*(boost?1.3:1)*(v.hp<30?.8:1)*v.surf;
    if(thr>0){ if(vf<-5){ vf+=Math.min(-vf,900*dt); brake=true; } else if(vf<vmax) vf+=v.acc*(boost?1.6:1)*Math.max(.15,1-vf/vmax)*dt; else vf-=Math.min(vf-vmax,500*dt); }
    else if(thr<0){ if(vf>5){ vf-=Math.min(vf,880*dt); brake=true; } else if(vf>-v.vmax*.3) vf-=v.acc*.55*dt; }
    else { const dec=(150+Math.abs(vf)*.35)*dt; vf=Math.abs(vf)<=dec?0:vf-Math.sign(vf)*dec; }
    v.sti=(v.sti||0)+((steer||0)-(v.sti||0))*Math.min(1,dt*(steer?8.5:10)); steer=Math.abs(v.sti)<.03?0:v.sti; /* 方向盤有輸入時慢慢打到底、放開慢慢回正，比較順 */
    const sp=Math.abs(vf),two=v.ty==='scooter'||v.ty==='bike',rate=sp<4?0:Math.min(1,sp/70)*(sp<220?(two?3:2.6):Math.max(1.4,2.6-(sp-220)/320));
    if(steer) v.a+=steer*rate*dt*Math.sign(vf); else if(sp>60){ const q=Math.round(v.a/(PI/2))*(PI/2),d=wrapA(q-v.a),hk=onH(v.y),vk=onV(v.x); if(Math.abs(d)<.16&&!(hk>=0&&vk>=0)) v.a+=clamp(d,-.9*dt,.9*dt); } /* 沒轉方向盤時，車頭慢慢對正道路 */
    v.lean=lerp(v.lean||0,two?clamp(-steer*Math.min(1,sp/150)*.45,-.45,.45):0,Math.min(1,dt*6));
    const gp=grip*(sp>320&&steer?.6:1); vl*=Math.exp(-gp*dt); const c2=Math.cos(v.a),s2=Math.sin(v.a); v.vx=c2*vf-s2*vl; v.vy=s2*vf+c2*vl; v.x+=v.vx*dt; v.y+=v.vy*dt; v.brake=brake||thr<0&&vf<-5; v.slip=Math.abs(vl); v.vf=vf; v.rev=vf<-5;
    if(v.slip>80||brake&&vf>200){ const rx=v.x-c2*v.L*.32,ry=v.y-s2*v.L*.32,ox=-s2*v.Wd*.38,oy=c2*v.Wd*.38,w=[rx+ox,ry+oy,rx-ox,ry-oy]; if(v.prevW){ SK.push([v.prevW[0],v.prevW[1],w[0],w[1]],[v.prevW[2],v.prevW[3],w[2],w[3]]); if(SK.length>900) SK.splice(0,40); } v.prevW=w; } else v.prevW=null; }
  const surfAt=(x,y)=>{ const i=Math.floor(x/P),j=Math.floor(y/P),b=Wd.blk(i,j); if(!b) return 1; if(x>b.x0&&x<b.x1&&y>b.y0&&y<b.y1){ if(b.type==='park'&&x>b.x0+SW&&x<b.x1-SW&&y>b.y0+SW&&y<b.y1-SW) return .55; return .78; } return 1; };
  const onWalk=(x,y)=>{ const i=Math.floor(x/P),j=Math.floor(y/P),b=Wd.blk(i,j); return !!b&&x>b.x0&&x<b.x1&&y>b.y0&&y<b.y1; };
  function circlesOf(v){ const n=v.L>70?4:v.L>30?2:1,r=v.Wd*.56,ca=Math.cos(v.a),sa=Math.sin(v.a),o=[]; for(let k=0;k<n;k++){ const off=n===1?0:(k/(n-1)-.5)*(v.L-v.Wd*1.05); o.push([v.x+ca*off,v.y+sa*off,r]); } return o; }
  function staticPush(x,y,r,extra){ let px=0,py=0,hit=false; const nx0=x-LO,nx1=HI-x,ny0=y-LO,ny1=HI-y; if(nx0<r){ px+=r-nx0; hit=true; } if(nx1<r){ px-=r-nx1; hit=true; } if(ny0<r){ py+=r-ny0; hit=true; } if(ny1<r){ py-=r-ny1; hit=true; }
    const i0=Math.floor((x-r-HR)/P),i1=Math.floor((x+r-HR+P)/P),j0=Math.floor((y-r-HR)/P),j1=Math.floor((y+r-HR+P)/P);
    for(let j=Math.max(0,j0);j<=Math.min(NB-1,j1);j++) for(let i=Math.max(0,i0);i<=Math.min(NB-1,i1);i++){ const b=Wd.blk(i,j); if(x+r<b.x0||x-r>b.x1||y+r<b.y0||y-r>b.y1) continue;
      for(const q of b.rects){ const cx=clamp(x,q[0],q[2]),cy=clamp(y,q[1],q[3]),dx=x-cx,dy=y-cy,d2=dx*dx+dy*dy; if(d2<r*r){ hit=true; if(d2>1e-6){ const d=Math.sqrt(d2); px+=dx/d*(r-d); py+=dy/d*(r-d); } else { const l=x-q[0],rr_=q[2]-x,u=y-q[1],dn=q[3]-y,m=Math.min(l,rr_,u,dn); if(m===l) px-=l+r; else if(m===rr_) px+=rr_+r; else if(m===u) py-=u+r; else py+=dn+r; } } }
      for(const q of b.circs){ const dx=x-q[0],dy=y-q[1],d=Math.hypot(dx,dy),rr2=r+q[2]; if(d<rr2&&d>1e-6){ hit=true; px+=dx/d*(rr2-d); py+=dy/d*(rr2-d); } }
      for(const q of b.parked){ if(q.taken) continue; const r2=q.rect,cx=clamp(x,r2[0],r2[2]),cy=clamp(y,r2[1],r2[3]),dx=x-cx,dy=y-cy,d2=dx*dx+dy*dy; if(d2<r*r&&d2>1e-6){ hit=true; const d=Math.sqrt(d2); px+=dx/d*(r-d); py+=dy/d*(r-d); if(extra) extra.parked=q; } } }
    if(extra&&extra.cones) for(const e of EV) if(e.cones) for(const q of e.cones){ const dx=x-q[0],dy=y-q[1],d=Math.hypot(dx,dy); if(d<r+4&&d>1e-6){ hit=true; px+=dx/d*(r+4-d); py+=dy/d*(r+4-d); if(!q.hit){ q.hit=1; q.vx=dx/d*-90; } } }
    return hit?[px,py]:null; }
  function collideStatic(v){ let worst=0,parked=null; for(const cc of circlesOf(v)){ const ex={cones:1}; const p=staticPush(cc[0],cc[1],cc[2],ex); if(!p) continue; if(ex.parked) parked=ex.parked; const l=Math.hypot(p[0],p[1]); if(l<1e-6) continue; const nx=p[0]/l,ny=p[1]/l; v.x+=p[0]; v.y+=p[1]; const vn=v.vx*nx+v.vy*ny; if(vn<0){ v.vx-=1.3*vn*nx; v.vy-=1.3*vn*ny; v.vx*=.9; v.vy*=.9; worst=Math.max(worst,-vn); if(-vn>90) for(let k=0;k<5;k++) FX.push({k:'spark',x:cc[0]-nx*cc[2],y:cc[1]-ny*cc[2],vx:(R()-.5)*160+nx*60,vy:(R()-.5)*160+ny*60,l:.3,L:.3}); } }
    return {imp:worst,parked}; }
  function damage(v,imp,by){ if(imp<70) return; const dm=(imp-70)*.11; v.hp=Math.max(0,v.hp-dm*(v.role==='suspect'?(by?2.2:.6):v.drv>=0?1:.5)); v.hitT=Math.max(v.hitT,1.4+imp/200); if(v.drv>=0){ const p=PL[v.drv]; p.hits++; shake=Math.max(shake,Math.min(10,imp/40)); if(M.onHit) M.onHit(p,imp); } if(imp>230){ for(let k=0;k<6;k++) FX.push({k:'deb',x:v.x,y:v.y,vx:(R()-.5)*220,vy:(R()-.5)*220,l:.7,L:.7,col:v.col,r:R()*TAU}); } }
  /* ---- 交通 AI ---- */
  function laneOf(v){ const r=v.rd; return r.h?r.k*P+r.s*r.off:r.k*P-r.s*r.off; }
  function trafficAI(v,dt){ if(v.hitT>0){ v.hitT-=dt; drive(v,null,0,false,dt,8); return; } const r=v.rd,along=r.h?v.x:v.y,laneC=laneOf(v);
    let n=r.s>0?Math.floor(along/P+1e-6)+1:Math.ceil(along/P-1e-6)-1; if((n*P-along)*r.s<HR*.8&&(!v.turn||v.turn[0]==='s'||v.turnN!==n)) n+=r.s; const dist=(n*P-along)*r.s;
    if(v.turnN!==n){ v.turnN=n; const ok=[]; if(n+r.s>=0&&n+r.s<=NB) ok.push(['s',r.s],['s',r.s],['s',r.s]); const rs=r.h?r.s:-r.s; for(const [k,ns] of [['r',rs],['l',-rs]]) if(r.k+ns>=0&&r.k+ns<=NB&&n>=0&&n<=NB&&v.ty!=='bus') ok.push([k,ns]); v.turn=ok.length?pick(R,ok):['r',rs]; }
    if(v.turn&&v.turn[0]!=='s'&&n>=0&&n<=NB){ const ns=v.turn[1],nr={h:!r.h,k:n,s:ns,off:v.ty==='scooter'?58:v.turn[0]==='r'?52:17},nc=nr.h?nr.k*P+nr.s*nr.off:nr.k*P-nr.s*nr.off; if((nc-along)*r.s<=24){ v.rd=nr; v.turn=null; v.turnN=null; return trafficAI(v,dt); } }
    const LA=48+Math.abs(v.vf)*.28; let off2=0; let tv=v.cruise;
    /* 讓救護車／警車 */
    for(const p of V) if(p.siren&&p!==v){ const dx=v.x-p.x,dy=v.y-p.y,ca=Math.cos(v.a),sa=Math.sin(v.a),ah=dx*ca+dy*sa; if(ah>0&&ah<260&&Math.abs(-dx*sa+dy*ca)<70){ off2=(r.off<40?40:62)-r.off; tv=Math.min(tv,45); if(!v.yld){ v.yld=1; } } }
    const tx=r.h?v.x+r.s*LA:laneC-(r.h?0:-r.s*off2*0)-(!r.h?r.s*off2:0),ty=r.h?laneC+r.s*off2:v.y+r.s*LA;
    const ta=Math.atan2(ty-v.y,tx-v.x);
    if(v.turn&&v.turn[0]!=='s'&&dist<150) tv=Math.min(tv,v.turn[0]==='r'?85:110);
    if(n>=0&&n<=NB&&!v.noLight){ const ix=r.h?n:r.k,iy=r.h?r.k:n,st=lightOf(ix,iy,r.h,t),stopAt=HR+48; if(st!=='g'&&dist>HR+2&&dist<stopAt+150&&!(st==='y'&&dist<stopAt+28)) tv=Math.min(tv,Math.max(0,(dist-stopAt)*1.6)); }
    const ca=Math.cos(v.a),sa=Math.sin(v.a);
    for(const u of V){ if(u===v) continue; const dx=u.x-v.x,dy=u.y-v.y; if(dx*dx+dy*dy>150*150) continue; const ah=dx*ca+dy*sa,lat=-dx*sa+dy*ca; if(ah>0&&ah<150&&Math.abs(lat)<(v.Wd+u.Wd)*.5+3){ const gap=ah-(v.L+u.L)/2; tv=Math.min(tv,Math.max(0,(gap-7)*2.4)); if(gap<30&&u.drv>=0&&vspeed(u)<20&&R()<dt*.25) say(v,pick(R,['叭——！','前面的走啦！','叭叭！','綠燈了啦！'])); } }
    for(const q of PD){ if(q.st!=='cross'&&!q.jay) continue; const dx=q.x-v.x,dy=q.y-v.y,ah=dx*ca+dy*sa,lat=-dx*sa+dy*ca; if(ah>0&&ah<110&&Math.abs(lat)<16) tv=Math.min(tv,Math.max(0,(ah-v.L/2-14)*2)); }
    for(const p of PL) if(p.foot){ const dx=p.foot.x-v.x,dy=p.foot.y-v.y,ah=dx*ca+dy*sa,lat=-dx*sa+dy*ca; if(ah>0&&ah<100&&Math.abs(lat)<16) tv=Math.min(tv,Math.max(0,(ah-v.L/2-12)*2)); }
    for(const e of EV) if(e.block){ const dx=e.x-v.x,dy=e.y-v.y,ah=dx*ca+dy*sa,lat=-dx*sa+dy*ca; if(ah>0&&ah<140&&Math.abs(lat)<20){ if(Math.abs(v.rd.off-e.off)<12&&!v.chg){ v.chg=1; v.rd=Object.assign({},v.rd,{off:v.rd.off<35?52:17}); } } }
    drive(v,ta,tv,false,dt,8); }
  /* 沿道路走到目標（追兵、嫌犯、示範駕駛用） */
  function navTo(v,tx,ty,laneOff){ laneOff=laneOff==null?30:laneOff; const hk=onH(v.y),vk=onV(v.x); let tH=onH(ty),tV=onV(tx);
    if(tH<0&&tV<0){ const ry=clamp(Math.round(ty/P),0,NB)*P,rx=clamp(Math.round(tx/P),0,NB)*P; if(Math.abs(ty-ry)<Math.abs(tx-rx)){ ty=ry; tH=Math.round(ty/P); } else { tx=rx; tV=Math.round(tx/P); } }
    if(hk<0&&vk<0){ const ry=clamp(Math.round(v.y/P),0,NB)*P,rx=clamp(Math.round(v.x/P),0,NB)*P; return Math.abs(v.y-ry)<Math.abs(v.x-rx)?{ta:Math.atan2(ry-v.y,(tx-v.x)*.25+1e-3),turn:1e9}:{ta:Math.atan2((ty-v.y)*.25+1e-3,rx-v.x),turn:1e9}; }
    let ax; if(hk>=0&&vk>=0){ if(tH===hk&&tV===vk) return {ta:Math.atan2(ty-v.y,tx-v.x),turn:1e9,d:Math.hypot(tx-v.x,ty-v.y)}; if(tH===hk) ax='h'; else if(tV===vk) ax='v'; else if(tH>=0&&tV<0) ax='v'; else if(tV>=0&&tH<0) ax='h'; else ax=Math.abs(tx-v.x)>Math.abs(ty-v.y)?'h':'v'; } else ax=hk>=0?'h':'v';
    let look,turn=1e9;
    if(ax==='h'){ let gx; if(tH===hk) gx=tx; else { gx=(tV>=0?tV:clamp(Math.round(tx/P),0,NB))*P; turn=Math.abs(gx-v.x); } const s=Math.sign(gx-v.x)||1,la=Math.max(30,Math.min(Math.abs(gx-v.x),70+Math.abs(v.vf)*.25)); look=[v.x+s*la,hk*P+s*laneOff]; if(tH===hk&&Math.abs(gx-v.x)<150) look=[tx,ty]; }
    else { let gy; if(tV===vk) gy=ty; else { gy=(tH>=0?tH:clamp(Math.round(ty/P),0,NB))*P; turn=Math.abs(gy-v.y); } const s=Math.sign(gy-v.y)||1,la=Math.max(30,Math.min(Math.abs(gy-v.y),70+Math.abs(v.vf)*.25)); look=[vk*P-s*laneOff,v.y+s*la]; if(tV===vk&&Math.abs(gy-v.y)<150) look=[tx,ty]; }
    return {ta:Math.atan2(look[1]-v.y,look[0]-v.x),turn,d:Math.hypot(tx-v.x,ty-v.y)}; }
  function aiDrive(v,tx,ty,dt,o){ o=o||{}; if(v.rev>0){ v.rev-=dt; drive(v,v.a+PI*.9,90,false,dt,TH.grip*8); return; } const n=navTo(v,tx,ty,o.lane); let tv=o.tv||v.vmax; if(n.turn<180) tv=Math.min(tv,150+n.turn*1.1); if(o.stop&&n.d!=null) tv=Math.min(tv,Math.max(0,n.d-8)*1.6); else if(o.stop) { const d=Math.hypot(tx-v.x,ty-v.y); if(d<200) tv=Math.min(tv,Math.max(0,d-8)*1.6); }
    drive(v,n.ta,tv,!!o.boost,dt,TH.grip*8); if(Math.abs(v.vf)<22&&tv>40){ v.stuck+=dt; if(v.stuck>1.1){ v.stuck=0; v.rev=.8; } } else v.stuck=0; }
  /* ---- 玩家操作：方向鍵＝畫面方向、車道置中、轉彎緩衝 ---- */
  const keyIn=i=>{ const k=env.keys; let u,d,l,r,n,f; if(!local2){ u=k.ArrowUp||k.KeyW; d=k.ArrowDown||k.KeyS; l=k.ArrowLeft||k.KeyA; r=k.ArrowRight||k.KeyD; n=k.Space||k.ShiftLeft||k.KeyJ; f=k.KeyF||k.KeyE||k.Enter||k.KeyK; } else if(i===0){ u=k.ArrowUp; d=k.ArrowDown; l=k.ArrowLeft; r=k.ArrowRight; n=k.Enter||k.NumpadEnter; f=k.ShiftRight||k.Slash||k.Numpad0; } else { u=k.KeyW; d=k.KeyS; l=k.KeyA; r=k.KeyD; n=k.Space; f=k.KeyE||k.KeyF; } return {dx:(r?1:0)-(l?1:0),dy:(d?1:0)-(u?1:0),n:!!n,f:!!f}; };
  const nearCop=(x,y,r)=>{ let best=null,bd=r; for(const v of V){ if(!(v.role==='cop'||v.ty==='police'&&v.patrol&&v.role==='traffic')||v.hp<=0) continue; const d=Math.hypot(v.x-x,v.y-y); if(d<bd){ bd=d; best=v; } } return best; };
  function assist(v,ta,dx,dy){ if(dx&&dy) return ta; const sp=v.vf,hk=onH(v.y),vk=onV(v.x),inI=hk>=0&&vk>=0,ca=Math.cos(v.a),sa=Math.sin(v.a);
    if(hk>=0&&!inI&&Math.abs(ca)>.85&&dy===0&&Math.sign(dx)===Math.sign(ca)){ const Y=hk*P,off=v.y-Y; let ln=[-52,-17,17,52].reduce((a,b)=>Math.abs(b-off)<Math.abs(a-off)?b:a); if(Math.abs(off-ln)<16) ta=Math.atan2(clamp(Y+ln-v.y,-25,25)*.6,Math.sign(ca)*110); }
    if(vk>=0&&!inI&&Math.abs(sa)>.85&&dx===0&&Math.sign(dy)===Math.sign(sa)){ const X=vk*P,off=v.x-X; let ln=[-52,-17,17,52].reduce((a,b)=>Math.abs(b-off)<Math.abs(a-off)?b:a); if(Math.abs(off-ln)<16) ta=Math.atan2(Math.sign(sa)*110,clamp(X+ln-v.x,-25,25)*.6); }
    if(sp>50&&hk>=0&&!inI&&Math.abs(ca)>.85&&dx===0&&dy){ const s=Math.sign(ca),n=s>0?Math.floor(v.x/P)+1:Math.ceil(v.x/P)-1,X=n*P,ns=Math.sign(dy); if(n>=0&&n<=NB&&(X-v.x)*s<220+sp*.25&&hk+ns>=0&&hk+ns<=NB){ const nl=X+(ns>0?-30:30),r=Math.max(36,sp/2.7); if((nl-v.x)*s>r*.85) ta=s>0?0:PI; } }
    if(sp>50&&vk>=0&&!inI&&Math.abs(sa)>.85&&dy===0&&dx){ const s=Math.sign(sa),n=s>0?Math.floor(v.y/P)+1:Math.ceil(v.y/P)-1,Y=n*P,ns=Math.sign(dx); if(n>=0&&n<=NB&&(Y-v.y)*s<220+sp*.25&&vk+ns>=0&&vk+ns<=NB){ const nl=Y+(ns>0?30:-30),r=Math.max(36,sp/2.7); if((nl-v.y)*s>r*.85) ta=s>0?PI/2:-PI/2; } }
    return ta; }
  /* ---- 對話、泡泡、提示 ---- */
  function say(o,txt,dur,col){ if(BUB.length>7) BUB.shift(); BUB.push({o,txt,t:dur||2.8,T:dur||2.8,col:col||'#fff'}); }
  function radio(who,txt,dur){ DQ.push({who,txt,t:dur||Math.max(3.6,txt.length*.16),T:0}); }
  function hint(p,key,txt,keys){ if(p.seen[key]||prev) return; p.seen[key]=1; (p.hq=p.hq||[]).push({txt,keys:keys||[],t:6}); }
  const KN=local2?[{n:'Enter',f:'右 Shift'},{n:'空白鍵',f:'E'}]:document.body.classList.contains('touch')?[{n:'「加速」',f:'「上下車」'}]:[{n:'空白鍵',f:'F'}];
  /* ---- 行人 ---- */
  const corner=(b,cn)=>cn===0?[b.x0+12,b.y0+12]:cn===1?[b.x1-12,b.y0+12]:cn===2?[b.x1-12,b.y1-12]:[b.x0+12,b.y1-12];
  function spawnPed(nearP,far){ for(let tr=0;tr<12;tr++){ const a=R()*TAU,d=far?520+R()*500:120+R()*700,x=nearP.x+Math.cos(a)*d,y=nearP.y+Math.sin(a)*d,i=Math.floor(x/P),j=Math.floor(y/P),b=Wd.blk(i,j); if(!b) continue; if(far&&!offView(x,y,30)) continue; const cn=Math.floor(R()*4),nx=(cn+1)%4,p0=corner(b,cn),p1=corner(b,nx),k=R(); const q={b,cn,to:nx,tb:b,x:lerp(p0[0],p1[0],k),y:lerp(p0[1],p1[1],k),sp:20+R()*16,lk:mkLook(R),ph:R()*6,st:'walk',a:0,umb:R()<.85,phone:R()<.2,bag:R()<.2?pick(R,['#c8202a','#e8e8e0','#3a6ab8']):null,dodge:0,dx:0,dy:0}; PD.push(q); return q; } }
  function pedNext(q){ /* 到了轉角：沿街廓走或過馬路 */ const b=q.tb,cn=q.to,opts2=[[b,(cn+1)%4,null],[b,(cn+3)%4,null]];
    const nb=(di,dj)=>Wd.blk(b.i+di,b.j+dj);
    const X=[[[ -1,0,1,'v',[0,0]],[0,-1,3,'h',[0,0]]],[[1,0,0,'v',[1,0]],[0,-1,2,'h',[1,0]]],[[1,0,3,'v',[1,1]],[0,1,1,'h',[1,1]]],[[-1,0,2,'v',[0,1]],[0,1,0,'h',[0,1]]]][cn];
    for(const x of X){ const b2=nb(x[0],x[1]); if(b2) opts2.push([b2,x[2],{ax:x[3],ix:b.i+x[4][0],iy:b.j+x[4][1]}],[b2,x[2],{ax:x[3],ix:b.i+x[4][0],iy:b.j+x[4][1]}]); }
    const o=pick(R,opts2.filter(o=>!(o[0]===q.b&&o[1]===q.cn)))||opts2[0]; q.b=q.tb; q.cn=cn; q.tb=o[0]; q.to=o[1]; q.cross=o[2]; q.st=o[2]?'wait':'walk'; }
  function stepPed(q,dt){ if(q.dodge>0){ q.dodge-=dt; q.x+=q.dx*dt; q.y+=q.dy*dt; const p=staticPush(q.x,q.y,4); if(p){ q.x+=p[0]; q.y+=p[1]; } return; }
    if(q.st==='stand'||q.st==='load') return;
    const tg=corner(q.tb,q.to); if(q.st==='wait'){ const cr=q.cross,ok=lightOf(cr.ix,cr.iy,cr.ax==='h',t)==='r'&&lightOf(cr.ix,cr.iy,cr.ax==='v',t)!=='y'; if(ok) q.st='cross'; else return; }
    const dx=tg[0]-q.x,dy=tg[1]-q.y,d=Math.hypot(dx,dy); const sp=q.st==='cross'?q.sp*1.25:q.sp; q.a=Math.atan2(dy,dx); q.ph+=dt*sp*.32; if(d<sp*dt+.5){ q.x=tg[0]; q.y=tg[1]; pedNext(q); } else { q.x+=dx/d*sp*dt; q.y+=dy/d*sp*dt; } }
  /* ---- 鏡頭外判斷 ---- */
  function offView(x,y,m){ for(const p of PL){ const z=p.cam.z,hw=(local2?W/4:W/2)/z+m,hh=H/2/z+m; if(Math.abs(x-p.cam.x)<hw&&Math.abs(y-p.cam.y)<hh) return false; } return true; }
  const me=p=>p.car||p.foot;
  /* ---- 車流 ---- */
  function spawnTraffic(far){ const p=me(PL[Math.floor(R()*np)]); for(let tr=0;tr<10;tr++){ const h=R()<.5,a=R()*TAU,d=far?600+R()*450:150+R()*800,x0=p.x+Math.cos(a)*d,y0=p.y+Math.sin(a)*d,k=clamp(Math.round((h?y0:x0)/P),0,NB),al=clamp(h?x0:y0,LO+40,HI-40);
      if(Math.abs(al-Math.round(al/P)*P)<HR+30) continue; const s=R()<.5?1:-1,r=R(),ty=r<.34?'sedan':r<.46?'hatch':r<.6?'taxi':r<.76?'scooter':r<.84?'truck':r<.88?'bus':r<.93?'van':r<.955?'suv':r<.975?'sports':'police',off=ty==='scooter'?58:ty==='bus'||ty==='truck'?52:R()<.5?17:52;
      const x=h?al:k*P-s*off,y=h?k*P+s*off:al; if(far&&!offView(x,y,80)) continue; if(V.some(u=>Math.hypot(u.x-x,u.y-y)<(ty==='bus'?110:70))) continue; if(PL.some(q=>Math.hypot(me(q).x-x,me(q).y-y)<90)) continue;
      const v=mkVeh(ty,x,y,h?(s>0?0:PI):(s>0?PI/2:-PI/2),ty==='police'?'#f4f6f8':null,'traffic'); v.patrol=ty==='police'; if(v.patrol&&WT.lv>0&&WT.lose<1.5&&copN()<COPW[WT.lv]){ v.role='cop'; v.siren=true; v.noLight=1; v.vmax=Math.min(v.vmax,340+WT.lv*16); } /* 巡邏警車只補到規定的數量 */ v.rd={h,k,s,off}; v.cruise=(ty==='scooter'?125:ty==='bus'?105:ty==='truck'?120:135)+R()*35; const sp=v.cruise*.8; v.vx=Math.cos(v.a)*sp; v.vy=Math.sin(v.a)*sp; return v; } }
  /* ---- 路邊隨機地點 ---- */
  function roadPt(from,minD,maxD,o){ o=o||{}; for(let tr=0;tr<200;tr++){ const h=R()<.5,k=1+Math.floor(R()*(NB-1)),seg=Math.floor(R()*NB),u=seg*P+HR+60+R()*(P-2*HR-120),s=R()<.5?1:-1,off=o.off==null?52:o.off,x=h?u:k*P-s*off,y=h?k*P+s*off:u,dm=Math.abs(x-from.x)+Math.abs(y-from.y); if(dm<minD||dm>maxD) continue; if(o.avoid&&o.avoid.some(q=>Math.hypot(q.x-x,q.y-y)<300)) continue; return {x,y,a:h?(s>0?0:PI):(s>0?PI/2:-PI/2),h,k,s,n:roadName(Wd,x,y)}; } return {x:from.x+400,y:from.y,a:0,n:''}; }
  /* ---- 任務 ---- */
  const startPt=ST.type==='escape'?roadPt(curbPt(Wd.police,0),2200,3400):roadPt({x:WS/2,y:WS/2},0,1600);
  let M={};
  const putFoot=()=>{ PL.forEach((p,i)=>{ const pt=startPt,a=pt.a||0,x=pt.x+Math.cos(a+PI/2)*30-Math.cos(a)*i*22,y=pt.y+Math.sin(a+PI/2)*30-Math.sin(a)*i*22; p.foot={x,y,a,vx:0,vy:0,lk:footLook(p),ph:0}; p.cam.x=x; p.cam.y=y; }); };
  function place(spec,from){ from=from||startPt; if(!spec||spec==='here') return null; if(spec==='garage') return {x:Wd.garage.x,y:Wd.garage.y,a:Wd.garage.a,n:'老K車行'}; if(spec==='police') return Object.assign(curbPt(Wd.police,2),{n:'警察局'}); if(spec==='hosp') return Object.assign(curbPt(Wd.hosp,2),{n:'市立醫院'});
    if(spec.startsWith('mrt:')){ const e=Wd.mrt[(+spec.slice(4))%Wd.mrt.length]; return {x:e.x,y:e.y-16,a:0,n:'捷運'+e.n,mrt:e}; }
    if(spec==='temple'){ const bs=Wd.B.filter(b=>b.type==='temple').sort((p,q)=>Math.hypot(p.x0-from.x,p.y0-from.y)-Math.hypot(q.x0-from.x,q.y0-from.y)),b=bs[0]||Wd.B[44]; return Object.assign(curbPt(b,2),{n:(b.name||'廟')+'口'}); }
    const cand=Wd.LM.filter(l=>!l.mrt); for(let k=0;k<40;k++){ const q=pick(R,cand),dm=Math.abs(q.x-from.x)+Math.abs(q.y-from.y); if(dm>700&&dm<2200) return {x:q.x,y:q.y,a:q.a,n:q.n}; } return roadPt(from,800,1700); }
  const MYCAR={sedan:1,hatch:1,suv:1,sports:1},myCar=opts.look&&MYCAR[opts.look.car]?opts.look.car:null;
  const putPlayers=(ty,col)=>{ PL.forEach((p,i)=>{ if(i===0&&myCar&&(ty==='sedan'||ty==='hatch'||ty==='suv')) ty=myCar; /* 一般車的任務開自己選的車款 */ const ca=Math.cos(startPt.a),sa=Math.sin(startPt.a),x=startPt.x-ca*i*70,y=startPt.y-sa*i*70; const v=mkVeh(ty,x,y,startPt.a,ty==='sedan'||ty==='suv'||ty==='hatch'||ty==='sports'?p.col:null,'player'); v.drv=i; p.car=v; p.cam.x=x; p.cam.y=y; }); };
  const anyP=fn=>PL.some(p=>{ const o=me(p); return o&&fn(p,o); });
  const stopAt=(o,pt,r)=>{ const v=o.ty?o:null; return Math.hypot(o.x-pt.x,o.y-pt.y)<(r||52)&&(!v||vspeed(v)<70); };
  const timeFor=(a,b)=>(Math.abs(a.x-b.x)+Math.abs(a.y-b.y))/(105+95*dd)+14-6*dd;
  function setupMission(){ const ty=ST.type;
    for(const q of ST.intro||[]) radio(q[0],q[1]);
    if(ty==='run'){ putPlayers(O.veh||'van'); const n=O.n||3+Math.round(dd*2),legs=[]; let from=startPt; for(let k=0;k<n;k++){ const useLm=R()<.5&&Wd.LM.length; let pt=useLm?pick(R,Wd.LM):null; if(!pt||Math.abs(pt.x-from.x)+Math.abs(pt.y-from.y)<600) pt=roadPt(from,700,1500); legs.push({x:pt.x,y:pt.y,n:pt.n||roadName(Wd,pt.x,pt.y),who:mkLook(R)}); from=pt; }
      M={legs,k:0,time:timeFor(startPt,legs[0]),total:0,label:()=>'送貨 '+Math.min(M.k+1,legs.length)+' / '+legs.length,sub:()=>'送到：'+legs[Math.min(M.k,legs.length-1)].n,target:()=>legs[Math.min(M.k,legs.length-1)],
        upd(dt){ if(O.clean&&WT.lv>0){ M.cl=(M.cl||0)+dt; PL.forEach(p=>hint(p,'cleanrun','被警察盯上了！快甩掉他們，不然交易會取消')); if(M.cl>12){ fail('被警察盯上，交易取消了'); return; } } const L=legs[M.k]; if(anyP((p,o)=>p.car&&stopAt(p.car,L,52))){ sfx('lap'); say(L,pick(R,['謝謝，辛苦了！','終於到了，謝謝！','放門口就好，謝啦！','簽收好了！'])); M.k++; if(M.k>=legs.length) win(); else { M.time+=timeFor(L,legs[M.k]); radio('disp',pick(R,['下一單：送到 ','接著送去 ','還有一件，地址是 '])+legs[M.k].n+'。'); } } },
        markers:()=>M.k<legs.length?[{x:legs[M.k].x,y:legs[M.k].y,k:'zone',txt:'送達點'}]:[]};
      M.total=M.time; radio('disp','阿傑早安！今天第一單急件，送到「'+legs[0].n+'」。開到黃色框裡停下來就算送達，加油！');
      hint0(); }
    else if(ty==='taxi'){ putPlayers('taxi'); const n=O.n||2+Math.round(dd*2); let k=0,pax=null,dest=null,meter=0,earn=0,lastPos={x:startPt.x,y:startPt.y};
      const newFare=()=>{ const p=me(PL[0]),pt=roadPt(p,400,1000,{off:62}),lk=mkLook(R); pax={x:pt.x+Math.cos(pt.a+PI/2)*14,y:pt.y+Math.sin(pt.a+PI/2)*14,a:pt.a-PI/2,lk,st:'stand',wave:1,n:pt.n,rough:0}; let d=pick(R,Wd.LM); for(let q=0;q<8&&Math.abs(d.x-pt.x)+Math.abs(d.y-pt.y)<700;q++) d=pick(R,Wd.LM); dest={x:d.x,y:d.y,n:d.n}; M.time+=timeFor(p,pax)+timeFor(pax,dest)*.9; radio('taxi',pick(R,['有客人在 ','叫車喔，在 ','這邊有一位客人，在 '])+pt.n+'，麻煩過去載一下！'); };
      M={time:0,label:()=>'載客 '+Math.min(k+1,n)+' / '+n,sub:()=>pax&&pax.st!=='in'?'去載客：'+pax.n:'送到：'+(dest?dest.n:''),target:()=>pax&&pax.st!=='in'?pax:dest,extra:()=>'跳表 NT$ '+Math.round(meter)+'　今天收入 NT$ '+earn,
        upd(dt){ if(!pax) return; if(pax.st==='stand'){ if(anyP((p,o)=>p.car&&Math.hypot(p.car.x-pax.x,p.car.y-pax.y)<62&&vspeed(p.car)<55)){ pax.st='walkin'; say(pax,pick(R,['司機你好，麻煩到「'+dest.n+'」','到「'+dest.n+'」，謝謝！','我趕時間，到「'+dest.n+'」！'])); hint(PL[0],'tdrop','乘客上車了！照箭頭開到目的地，停下來讓他下車'); } }
          else if(pax.st==='walkin'){ const v=PL.map(p=>p.car).filter(Boolean).sort((a,b)=>Math.hypot(a.x-pax.x,a.y-pax.y)-Math.hypot(b.x-pax.x,b.y-pax.y))[0]; const dx=v.x-pax.x,dy=v.y-pax.y,d=Math.hypot(dx,dy); pax.a=Math.atan2(dy,dx); pax.ph=(pax.ph||0)+dt*8; if(d<14){ pax.st='in'; pax.car=v; meter=85; lastPos={x:v.x,y:v.y}; } else { pax.x+=dx/d*50*dt; pax.y+=dy/d*50*dt; } }
          else if(pax.st==='in'){ const v=pax.car; meter+=Math.hypot(v.x-lastPos.x,v.y-lastPos.y)/2000*5*4; lastPos={x:v.x,y:v.y}; if(stopAt(v,dest,56)){ const tip=Math.max(0,Math.round(50-pax.rough*10)); earn+=Math.round(meter)+tip; say(dest,tip>20?pick(R,['開得好穩，不用找了！','謝謝司機，小費給你！']):pick(R,['到了到了，嚇死我了…','錢給你，下次開慢一點啦！'])); sfx('lap'); k++; pax=null; if(k>=n) win(); else newFare(); } }
          },
        onHit(p,imp){ if(pax&&pax.st==='in'&&imp>110){ pax.rough=(pax.rough||0)+1; if(O.smooth&&pax.rough>=3){ say(p.car,'停車！我要下車！'); fail('乘客受不了，下車了…'); } if(R()<.7) say(p.car,pick(R,['司機！開慢一點啦！','哎唷！小心一點！','我頭撞到了啦！','你這樣開我要投訴喔！'])); hint(p,'trough','撞到車乘客會不開心，小費會變少'); } },
        markers:()=>pax&&pax.st!=='in'?[{x:pax.x,y:pax.y,k:'ring',txt:'乘客'}]:dest?[{x:dest.x,y:dest.y,k:'zone',txt:dest.n}]:[]};
      newFare(); M.total=M.time; radio('taxi','早啊！今天開小黃。看到路邊招手的客人，開到旁邊停下來讓他上車。'); hint0(); }
    else if(ty==='catch'&&O.foot){ putFoot(); const o=PL[0].foot,a=startPt.a||0; const susp={x:o.x+Math.cos(a)*170,y:o.y+Math.sin(a)*170,a,lk:{skin:'#d8a882',hair:'#111',shirt:'#222',pants:'#2a3040',cap:'#111'},ph:0,sp:92+18*dd};
      M={time:75,label:()=>'嫌犯徒步逃逸',sub:()=>'追上去抓住他（按 '+KN[0].n+' 跑步）',target:()=>susp,
        upd(dt){ let near=null,nd=1e9; for(const p of PL){ const o2=me(p),d=Math.hypot(o2.x-susp.x,o2.y-susp.y); if(d<nd){ nd=d; near=o2; } } const ax=susp.x-near.x,ay=susp.y-near.y,l=Math.hypot(ax,ay)||1; susp.a=Math.atan2(ay,ax); const sp=nd<260?susp.sp:susp.sp*.4; susp.x+=ax/l*sp*dt; susp.y+=ay/l*sp*dt; const pp=staticPush(susp.x,susp.y,5); if(pp){ susp.x+=pp[0]; susp.y+=pp[1]; susp.x+=(-ay/l)*sp*dt*.8; susp.y+=(ax/l)*sp*dt*.8; } susp.ph+=dt*12;
          if(PL.some(p=>p.foot&&Math.hypot(p.foot.x-susp.x,p.foot.y-susp.y)<16)||PL.some(p=>p.car&&Math.hypot(p.car.x-susp.x,p.car.y-susp.y)<34&&vspeed(p.car)<90)){ say(susp,'好啦好啦…我投降！'); radio('chief','幹得好！嫌犯逮捕歸案！'); win(); } },
        markers:()=>[{x:susp.x,y:susp.y,k:'ring',txt:'嫌犯',red:1}]};
      M.susp=()=>susp; M.total=M.time; say(susp,'別過來！'); PL.forEach(p=>hint(p,'runfoot','按 '+KN[Math.min(p.i,KN.length-1)].n+' 跑步追上去；也可以騎路邊的機車',[KN[Math.min(p.i,KN.length-1)].n])); hint0(); }
    else if(ty==='catch'){ putPlayers('police'); PL.forEach(p=>p.car.siren=true); const ca=Math.cos(startPt.a),sa=Math.sin(startPt.a); const sv=mkVeh(O.fake?'police':dd>.5||O.boss?'sports':pick(R,['sports','sedan','suv']),startPt.x+ca*230,startPt.y+sa*230,startPt.a,O.fake?'#f4f6f8':'#b0141c','suspect'); if(O.fake) sv.siren=true; sv.vmax=320+150*dd; sv.acc=360+120*dd; sv.vx=ca*200; sv.vy=sa*200; sv.hp=sv.hpM=(55+45*dd)*(1+(O.boss||0)*.45); sv.vmax+=(O.boss||0)*30; sv.noLight=1; sv.goal=null;
      let susp=null; M={sv,time:95-15*dd,label:()=>susp?'嫌犯下車逃跑！':'嫌犯車況',sub:()=>susp?'追上去抓住他':'撞停紅色的嫌犯車',target:()=>susp||sv,bar:()=>susp?null:sv.hp/sv.hpM,
        upd(dt){ if(!susp){ if(sv.hp<=0&&!sv.dead){ sv.dead=1; sv.vx*=.3; sv.vy*=.3; const lk={skin:'#d8a882',hair:'#111',shirt:'#222',pants:'#2a3040',cap:'#111'}; susp={x:sv.x+Math.cos(sv.a+PI/2)*20,y:sv.y+Math.sin(sv.a+PI/2)*20,a:0,lk,ph:0,sp:88+30*dd}; say(susp,pick(R,['可惡！','別過來！','我才不會被抓！'])); radio('chief','嫌犯棄車逃跑了！下車去追，或是開車把他堵住！'); PL.forEach(p=>hint(p,'chasefoot','嫌犯下車跑了！按 '+KN[Math.min(p.i,KN.length-1)].f+' 下車用跑的追，靠近就能抓住他',[KN[Math.min(p.i,KN.length-1)].f])); for(let k=0;k<12;k++) FX.push({k:'smoke',x:sv.x,y:sv.y,vx:(R()-.5)*30,vy:(R()-.5)*30,l:2,L:2,s:10,col:'90,90,90'}); }
            if(sv.hp<45) PL.forEach(p=>hint(p,'chaselow','嫌犯車快撐不住了，再撞幾下！'));
            const far=PL.every(p=>Math.hypot(me(p).x-sv.x,me(p).y-sv.y)>900); if(far) PL.forEach(p=>hint(p,'chasefar','看右上角地圖的紅點，跟著箭頭追'));
          } else { let near=null,nd=1e9; for(const p of PL){ const o=me(p),d=Math.hypot(o.x-susp.x,o.y-susp.y); if(d<nd){ nd=d; near=o; } } const ax=susp.x-near.x,ay=susp.y-near.y,l=Math.hypot(ax,ay)||1; susp.a=Math.atan2(ay,ax); const sp=nd<260?susp.sp:susp.sp*.4; susp.x+=ax/l*sp*dt; susp.y+=ay/l*sp*dt; const pp=staticPush(susp.x,susp.y,5); if(pp){ susp.x+=pp[0]; susp.y+=pp[1]; susp.x+=(-ay/l)*sp*dt*.8; susp.y+=(ax/l)*sp*dt*.8; } susp.ph+=dt*12;
            if(PL.some(p=>p.foot&&Math.hypot(p.foot.x-susp.x,p.foot.y-susp.y)<16)||PL.some(p=>p.car&&Math.hypot(p.car.x-susp.x,p.car.y-susp.y)<34&&vspeed(p.car)<90)){ say(susp,'好啦好啦…我投降！'); radio('chief','幹得好！嫌犯逮捕歸案！'); win(); } } },
        markers:()=>susp?[{x:susp.x,y:susp.y,k:'ring',txt:'嫌犯',red:1}]:[{x:sv.x,y:sv.y,k:'tag',txt:'嫌犯',red:1}]};
      M.total=M.time; M.susp=()=>susp; radio('chief',ST.tier===0?'有一台紅色車連闖紅燈，還撞了路人就跑！開警車撞停它，車況打到 0 就抓得到人！':pick(R,['剛發生搶案，嫌犯開紅色車逃逸！把它撞停！','嫌犯往前面跑了，全力追捕！'])); say(sv,pick(R,['抓不到我啦！','快跑快跑！']),2.4); hint0(); }
    else if(ty==='park'){ putPlayers(pick(R,['sedan','hatch','suv'])); let spot,lotB=null; const lots=Wd.B.filter(b=>b.type==='lot'&&b.spots.length);
      const lot=O.curb||!lots.length?null:pick(R,lots);
      if(lot){ lotB=lot; const sp=pick(R,lot.spots); spot={x:sp.x,y:sp.y,a:sp.a,w:sp.w-2+(1-dd)*6-(O.tight?3:0),l:sp.l,n:'停車場 '+(lot.spots.indexOf(sp)+1)+' 號車位'}; }
      else { const pt=roadPt(startPt,900,1600,{off:58}); const gap=96-dd*16-(O.tight?8:0),ca=Math.cos(pt.a),sa=Math.sin(pt.a); for(const s of [-1,1]){ const v=mkVeh(pick(R,['sedan','hatch','van']),pt.x+ca*s*(gap/2+24),pt.y+sa*s*(gap/2+24),pt.a,null,'parked'); v.cruise=0; EV.push({k:'pk',x:v.x,y:v.y,off:58,block:1,keep:1}); } spot={x:pt.x,y:pt.y,a:pt.a,w:26,l:gap,n:pt.n+' 路邊停車格'}; }
      let hold=0; M={spot,time:(Math.abs(spot.x-startPt.x)+Math.abs(spot.y-startPt.y))/(140+80*dd)+28-dd*6,label:()=>'停車挑戰',sub:()=>'停進：'+spot.n,target:()=>spot,
        upd(dt){ let ok=false; for(const p of PL){ const v=p.car; if(!v) continue; const dx=v.x-spot.x,dy=v.y-spot.y,ca=Math.cos(spot.a),sa=Math.sin(spot.a),lx=dx*ca+dy*sa,ly=-dx*sa+dy*ca,da=Math.abs(wrapA(v.a-spot.a)),da2=Math.min(da,PI-da); if(Math.hypot(dx,dy)<120) hint(p,'pk','慢慢開進黃色格子，車身擺正、停好不要動'); if(Math.abs(lx)<Math.max(5,spot.l/2-v.L/2+4)&&Math.abs(ly)<Math.max(4,spot.w/2-v.Wd/2+4)&&da2<.3&&vspeed(v)<12) ok=true; } hold=ok?hold+dt:0; M.hold=hold; if(hold>1){ say(spot,'停得漂亮！'); radio('coach','很好！一次就停進去了！'); win(); } },
        onHit(p,imp){ if(imp>60&&Math.hypot(p.car.x-spot.x,p.car.y-spot.y)<200){ M.time-=4; toast(p,'擦撞到別人的車！-4 秒'); say(p.car,pick(R,['喂！撞到我的車了啦！','你會不會停車啊！'])); } },
        markers:()=>[{x:spot.x,y:spot.y,k:'spot',a:spot.a,w:spot.w,l:spot.l}]};
      M.total=M.time; radio('coach',lot?'今天練停車。開到停車場，停進黃色的格子裡，停好不要動就過關。':'今天練路邊停車！前後都有車，慢慢對準、不要撞到人家。'); hint0(); }
    else if(ty==='amb'){ putPlayers('amb'); PL.forEach(p=>p.car.siren=true); const n=O.n||(ST.tier>=2?2:1); let k=0,sc=null,cond=100,loaded=false,tLoad=0; const hosp=curbPt(Wd.hosp,2);
      const newScene=()=>{ const p=me(PL[0]),pt=roadPt(p,700,1400,{off:52,avoid:[hosp]}); const ca=Math.cos(pt.a),sa=Math.sin(pt.a); sc={x:pt.x,y:pt.y,n:pt.n,a:pt.a}; const c1=mkVeh(pick(R,['sedan','hatch','taxi']),pt.x+ca*44,pt.y+sa*44,pt.a+.5,null,'wreck'),c2=mkVeh('scooter',pt.x+ca*70-sa*18,pt.y+sa*70+ca*18,pt.a+2.2,null,'wreck'); c1.haz=c2.haz=true; c1.hp=30; sc.cars=[c1,c2]; sc.vic={x:pt.x+ca*58-sa*30,y:pt.y+sa*58+ca*30,a:pt.a,lk:mkLook(R),lying:1}; sc.cop={x:pt.x+ca*20-sa*44,y:pt.y+sa*20+ca*44,a:pt.a+PI/2,lk:{skin:'#e0b48e',hair:'#111',shirt:'#1f2f4d',pants:'#1f2f4d',cap:'#1f2f4d'},ph:0}; EV.push({k:'scene',x:pt.x,y:pt.y,off:52,block:1,cones:[[pt.x-ca*20+sa*0,pt.y-sa*20],[pt.x-ca*28-sa*14,pt.y-sa*28+ca*14],[pt.x+ca*96,pt.y+sa*96]].map(q=>Object.assign(q,{})),keep:1}); cond=100; loaded=false; M.time+=timeFor(p,sc)+timeFor(sc,hosp); radio('disp','救護車請注意，'+pt.n+' 發生'+pick(R,['機車擦撞','車禍','有人倒在路邊'])+'，請立刻前往！'); };
      M={time:0,label:()=>'救護 '+Math.min(k+1,n)+' / '+n,sub:()=>loaded?'送到：市立醫院 急診':'前往：'+(sc?sc.n:''),target:()=>loaded?hosp:sc,bar:()=>loaded?cond/100:null,barLbl:'傷患狀況',
        upd(dt){ if(!sc) return; if(!loaded){ if(PL.some(p=>p.car&&stopAt(p.car,sc,80))){ tLoad+=dt; if(tLoad>.1&&!sc.said){ sc.said=1; say(sc.cop,'這邊！傷患在這裡！'); } if(tLoad>1.6){ loaded=true; tLoad=0; sc.vic=null; say(sc.cop,'交給你們了！'); radio('doc','我是急診的陳醫師，傷患送來醫院，路上開穩一點！'); PL.forEach(p=>hint(p,'ambs','開穩一點！撞到東西傷患會更危險')); } } else tLoad=0; }
          else { cond-=dt*(.5+dd*.6); if(cond<=0){ fail('傷患撐不住了…'); return; } if(PL.some(p=>p.car&&stopAt(p.car,hosp,64))){ say(hosp,'推進急診！快！'); sfx('lap'); k++; for(const v of sc.cars) v.role='traffic_dead'; EV.forEach(e=>{ if(e.k==='scene') e.done=1; }); if(k>=n){ radio('doc','傷患送到了，你們做得很好！'); win(); } else newScene(); } } },
        onHit(p,imp){ if(loaded&&imp>90){ cond-=imp*.05; say(p.car,pick(R,['（傷患：唔…好痛…）','慢一點！傷患在呻吟！'])); } },
        markers:()=>loaded?[{x:hosp.x,y:hosp.y,k:'zone',txt:'急診'}]:sc?[{x:sc.x,y:sc.y,k:'zone',txt:'事故現場'}]:[],scene:()=>sc};
      newScene(); M.total=M.time; PL.forEach(p=>hint(p,'siren','救護車開著警報器，前面的車會讓路')); hint0(); }
    else if(ty==='escape'){ putPlayers('sedan'); if(O.lowhp) PL.forEach(p=>p.car.hp=45); const dest=curbPt(Wd.police,Math.floor(R()*4)); let nC=1+Math.round(dd*3),spawned=0,spT=2.5; const chasers=[];
      M={time:timeFor(startPt,dest)*1.15+10,label:()=>'護送證人',sub:()=>'到：警察局（'+roadName(Wd,dest.x,dest.y)+'）',target:()=>dest,extra:()=>'後面追兵 '+chasers.length+' 台',
        upd(dt){ spT-=dt; if(spawned<nC&&spT<=0){ spT=6+R()*5; const p=me(PL[0]),ca=Math.cos(p.a||0),sa=Math.sin(p.a||0); let x=p.x-ca*360,y=p.y-sa*360; if(onH(y)<0&&onV(x)<0){ x=p.x; y=p.y; const pt=roadPt(p,450,700); x=pt.x; y=pt.y; } const cv=mkVeh('suv',x,y,p.a||0,'#16181c','chaser'); cv.vmax=360+110*dd; cv.acc=380+60*dd; cv.noLight=1; chasers.push(cv); spawned++; if(spawned===1){ radio('wit','後面那台黑色休旅車…是他們！快甩掉他們！'); PL.forEach(p=>hint(p,'nitro','按 '+KN[Math.min(p.i,KN.length-1)].n+' 噴氮氣加速，可以甩開追兵',[KN[Math.min(p.i,KN.length-1)].n])); } }
          for(const cv of chasers){ if(cv.hp<=0){ cv.vx*=.95; cv.vy*=.95; continue; } let tg=null,td=1e9; for(const p of PL){ const o=me(p),d=Math.hypot(o.x-cv.x,o.y-cv.y); if(d<td){ td=d; tg=o; } } if(td<170) drive(cv,Math.atan2(tg.y+(tg.vy||0)*.3-cv.y,tg.x+(tg.vx||0)*.3-cv.x),cv.vmax,false,dt,TH.grip*8); else aiDrive(cv,tg.x,tg.y,dt,{lane:20}); }
          for(const p of PL){ if(p.car&&p.car.hp<40) hint(p,'swap','車快撐不住了！按 '+KN[Math.min(p.i,KN.length-1)].f+' 下車，走到別台車旁再按 '+KN[Math.min(p.i,KN.length-1)].f+' 搶來開',[KN[Math.min(p.i,KN.length-1)].f]); }
          if(anyP((p,o)=>p.car&&stopAt(p.car,dest,70))){ radio('chief','證人平安送到，辛苦了！'); win(); } },
        markers:()=>[{x:dest.x,y:dest.y,k:'zone',txt:'警察局'}].concat(chasers.filter(c=>c.hp>0).map(c=>({x:c.x,y:c.y,k:'tag',txt:'追兵',red:1}))),chasers};
      M.total=M.time; radio('chief','張先生是重要證人，有人想對他不利。把他平安送到警察局！'); hint0(); }
    else if(ty==='race'){ putPlayers('sports'); const n=O.n||6,cps=[]; let from=startPt; for(let k=0;k<n;k++){ const pt=roadPt(from,650,1150,{off:30}); cps.push(pt); from=pt; }
      const ca=Math.cos(startPt.a),sa=Math.sin(startPt.a),names=['阿彪','小龍','黑仔','阿豪'],cols=['#1b1d22','#e8c21c','#2a6ab8','#8a5ab8'],riv=[];
      for(let i=0;i<(O.riv||3);i++){ const back=50+i*55,lat=(i%2?-1:1)*34,x=startPt.x-ca*back-sa*lat,y=startPt.y-sa*back+ca*lat,v=mkVeh(i===0?'sports':pick(R,['sports','sedan','suv']),x,y,startPt.a,cols[i%4],'racer'); v.k=0; v.vmax=390+70*dd+i*10; v.acc=390+60*dd; v.noLight=1; v.nm=names[i%4]; v.lk={shirt:'#222',helm:'#111',skin:'#d8a882'}; riv.push(v); }
      let pk=0,tot=0; from=startPt; for(const c2 of cps){ tot+=Math.abs(c2.x-from.x)+Math.abs(c2.y-from.y); from=c2; }
      const rank=()=>{ const cp=cps[Math.min(pk,n-1)],o=me(PL[0]),myD=Math.hypot(cp.x-o.x,cp.y-o.y); let r2=1; for(const v of riv){ const c3=cps[Math.min(v.k,n-1)]; if(v.k>pk||v.k===pk&&Math.hypot(c3.x-v.x,c3.y-v.y)<myD) r2++; } return r2; };
      M={time:tot/230+25,label:()=>'第 '+rank()+' 名',sub:()=>'檢查點 '+Math.min(pk+1,n)+' / '+n+(pk>=n-1?'（終點）':''),target:()=>cps[Math.min(pk,n-1)],extra:()=>'對手：'+riv.map(v=>v.nm).join('、'),
        upd(dt){ const cp=cps[pk]; if(cp&&anyP((p,o)=>Math.hypot(o.x-cp.x,o.y-cp.y)<75)){ pk++; sfx('lap'); if(pk>=n){ radio('biao',pick(R,['可惡…算你厲害！','不可能！我居然輸了！'])); win(); return; } }
          for(const v of riv){ if(v.k>=n||v.drv>=0){ if(v.drv<0) drive(v,null,0,false,dt,8); continue; } const c2=cps[v.k]; aiDrive(v,c2.x,c2.y,dt,{lane:30,boost:Math.abs(v.vf)>200&&R()<.35}); if(Math.hypot(c2.x-v.x,c2.y-v.y)<80){ v.k++; if(v.k>=n&&!over){ say(v,'贏了！哈哈！'); fail(v.nm+' 先衝過終點了'); return; } } } },
        markers:()=>{ const cp=cps[Math.min(pk,n-1)],o2=[{x:cp.x,y:cp.y,k:'zone',txt:pk>=n-1?'終點':'檢查點 '+(pk+1)}]; for(const v of riv) if(v.drv<0) o2.push({x:v.x,y:v.y,k:'tag',txt:v.nm,red:1}); return o2; }};
      M.total=M.time; PL.forEach(p=>hint(p,'race','穿過黃色的檢查點，比對手先到終點！按 '+KN[Math.min(p.i,KN.length-1)].n+' 噴氮氣',[KN[Math.min(p.i,KN.length-1)].n])); hint0(); }
    else if(ty==='tail'){ putPlayers(pick(R,['sedan','hatch'])); const ca=Math.cos(startPt.a),sa=Math.sin(startPt.a),tv=mkVeh(O.veh||'van',startPt.x+ca*280,startPt.y+sa*280,startPt.a,O.col||'#16181c','tailed'); tv.vx=ca*120; tv.vy=sa*120; tv.noLight=1; const dest=roadPt(tv,2200,3200); let lost=0,close=0;
      const dist=()=>Math.min(...PL.map(p=>{ const o=me(p); return Math.hypot(o.x-tv.x,o.y-tv.y); }));
      M={time:(Math.abs(dest.x-tv.x)+Math.abs(dest.y-tv.y))/120+45,label:()=>'跟蹤：相距 '+Math.round(dist()/10)+' 公尺',sub:()=>{ const d=dist(); return d<110?'太近了！會被發現！':d>560?'快跟丟了！跟上去！':'保持距離，跟著目標'; },target:()=>tv,bar:()=>clamp(1-Math.max(lost/7,close/3),0,1),barLbl:'隱密度',
        upd(dt){ if(tv.drv>=0){ fail('目標車被你搶走了…'); return; } aiDrive(tv,dest.x,dest.y,dt,{lane:30,tv:140+60*dd,stop:true}); const d=dist(); if(d>620) lost+=dt; else lost=Math.max(0,lost-dt); if(d<95) close+=dt; else close=Math.max(0,close-dt*.6);
          if(d<160) PL.forEach(p=>hint(p,'tailnear','跟太近會被發現，保持一點距離')); if(lost>7){ fail('跟丟了…'); return; } if(close>3){ say(tv,'後面那台車在跟蹤我們！'); fail('被發現了！'); return; }
          if(Math.hypot(tv.x-dest.x,tv.y-dest.y)<80&&vspeed(tv)<40){ radio('chief','找到了！就是那裡。幹得好，阿傑！'); win(); } },
        markers:()=>[{x:tv.x,y:tv.y,k:'tag',txt:'跟蹤目標',red:1,h:44}]};
      M.total=M.time; hint0(); }
    else if(ty==='repo'){ putFoot(); const pt=roadPt(startPt,600,1100,{off:58}),car=mkVeh('sedan',pt.x,pt.y,pt.a,'#f2f2ee','parked'); car.keep=1; EV.push({k:'pk',x:car.x,y:car.y,off:58,block:1,keep:1}); const gar=place('garage'); let got=false;
      M={time:120+(Math.abs(gar.x-pt.x)+Math.abs(gar.y-pt.y))/110,label:()=>got?'把車開回車行':'偷車',sub:()=>got?(WT.lv?'先甩掉警察，才能開進車行':'開回：老K車行'):'走到白色轎車旁按 '+KN[0].f+' 上車',target:()=>got?(WT.lv?null:gar):car,bar:()=>got?car.hp/100:null,barLbl:'車況',
        onBoard(p,v){ if(v===car&&!got){ got=true; say(car,'（防盜警報器）嗶嗶嗶嗶——'); setWanted(O.stars||1,'偷車'); } },
        upd(dt){ if(got&&car.hp<=0){ fail('車子撞爛了，老K不收…'); return; } if(got&&WT.lv>0&&PL.some(p=>p.car===car&&Math.hypot(car.x-gar.x,car.y-gar.y)<300)) PL.forEach(p=>hint(p,'garclean','後面有警察！先甩掉他們再回車行')); if(got&&WT.lv===0&&PL.some(p=>p.car===car&&stopAt(car,gar,75))){ radio('k','不錯嘛，有兩下子。明天開始來上班。'); win(); } },
        markers:()=>got?(WT.lv?[]:[{x:gar.x,y:gar.y,k:'zone',txt:'老K車行'}]):[{x:car.x,y:car.y,k:'tag',txt:'目標車',h:34}]};
      M.total=M.time; hint0(); }
    else if(ty==='lose'){ putPlayers(pick(R,['sedan','hatch','sports'])); const dest=O.dest?place(O.dest):null; let started=false;
      M={time:60+(O.stars||1)*24+(dest?45:0),label:()=>WT.lv?'通緝中 '+'★'.repeat(WT.lv):'甩掉警察了！',sub:()=>WT.lv?'躲開警車視線，等星星消失（也可以搭捷運）':dest?'開到：'+dest.n:'',target:()=>WT.lv||!dest?null:dest,
        upd(dt){ if(!started){ started=true; setWanted(O.stars||1,'違規'); return; } if(WT.lv===0){ if(!dest){ radio('me','呼……總算甩掉了。'); win(); } else if(anyP((p,o)=>stopAt(o,dest,75))){ radio('chief','你沒事吧？進來再說。'); win(); } } },
        markers:()=>WT.lv||!dest?[]:[{x:dest.x,y:dest.y,k:'zone',txt:dest.n}]};
      M.total=M.time; hint0(); }
    else if(ty==='story'){ if(O.foot) putFoot(); else putPlayers(O.veh||'sedan'); if(O.lowhp) PL.forEach(p=>{ if(p.car) p.car.hp=38; });
      const steps=O.steps.map(q=>Object.assign({},q)),npc=[],chasers=[]; let k=-1,cur=null,pax=null,items=[],spT=3,lastPt={x:startPt.x,y:startPt.y,a:startPt.a},tgtCar=null;
      const sidePt=pt=>{ const a=pt.a!=null?pt.a:0; return {x:pt.x+Math.cos(a+PI/2)*30,y:pt.y+Math.sin(a+PI/2)*30}; };
      const stepTxt=c2=>c2.txt||(c2.k==='mrt'?'搭捷運到 '+Wd.mrt[c2.to%Wd.mrt.length].n+'（在入口按 '+KN[0].f+'）':c2.k==='talk'?'去找'+CH[c2.who].n+'說話':c2.k==='board'?'開車到'+CH[c2.who].n+'旁邊讓她上車':c2.k==='lose'?'甩掉警察':c2.k==='ride'?'去騎一台'+(c2.ty==='bike'?'公共單車':'機車'):'');
      function next(){ k++; if(k>=steps.length){ win(); return; } cur=steps[k]; const c2=cur; c2.t=0;
        if(c2.k==='go') c2.pt=place(c2.to,me(PL[0]))||lastPt;
        else if(c2.k==='talk'){ const at=c2.to==='here'?lastPt:place(c2.to,me(PL[0])),sp=String(c2.to).startsWith('mrt:')?{x:at.x+26,y:at.y+30}:sidePt(at); c2.npc={x:sp.x,y:sp.y,a:-PI/2,lk:Object.assign({pants:'#2a3040'},CH[c2.who]),ph:0,who:c2.who,ex:{wave:1}}; npc.push(c2.npc); }
        else if(c2.k==='board') c2.npc=npc.find(q=>q.who===c2.who);
        else if(c2.k==='collect'){ items=[]; let from=me(PL[0]); for(let i=0;i<c2.n;i++){ const pt=roadPt(from,260,700,{off:52}),sp=sidePt(pt); items.push({x:sp.x,y:sp.y,got:false}); from=pt; } }
        else if(c2.k==='hijack'){ const o=me(PL[0]); tgtCar=null; for(let tr=0;tr<30&&!tgtCar;tr++){ const v=spawnTraffic(false); if(!v) continue; if(Math.hypot(v.x-o.x,v.y-o.y)<300||v.ty==='bus'){ V.splice(V.indexOf(v),1); continue; } const T0=VT[c2.ty]; Object.assign(v,{ty:c2.ty,L:T0.L,Wd:T0.W,vmax:T0.vmax,acc:T0.acc,m:T0.m,col:c2.col,keep:1,cruise:115,off:v.rd.off<35?17:52}); tgtCar=v; } }
        else if(c2.k==='steal'){ const o=me(PL[0]),pt=roadPt(o,500,1000,{off:58}); tgtCar=mkVeh(c2.ty,pt.x,pt.y,pt.a,c2.col,'parked'); tgtCar.keep=1; EV.push({k:'pk',x:pt.x,y:pt.y,off:58,block:1,keep:1}); }
        else if(c2.k==='lose'){ if(WT.lv===0&&c2.stars) setWanted(c2.stars); }
        else if(c2.k==='chasers'){ chasers.need=(chasers.need||0)+c2.n; next(); return; }
        else if(c2.k==='drop'){ if(pax){ const v=pax.car; pax.st='out'; pax.a=v.a+PI/2; pax.x=v.x+Math.cos(v.a+PI/2)*22; pax.y=v.y+Math.sin(v.a+PI/2)*22; pax.ex={}; npc.push(pax); say(pax,'謝謝你！'); lastPt={x:v.x,y:v.y,a:v.a}; pax=null; } next(); return; }
        const tx=stepTxt(c2); if(tx) PL.forEach(p=>toast(p,tx)); }
      const mrtTgt=()=>{ const o=me(PL[0]),dst=Wd.mrt[cur.to%Wd.mrt.length]; let best=null,bd=1e9; for(const e of Wd.mrt){ if(e===dst) continue; const d=Math.hypot(e.x-o.x,e.y-o.y); if(d<bd){ bd=d; best=e; } } return best?{x:best.x,y:best.y-16,n:'捷運'+best.n}:null; };
      const rideTgt=()=>{ const o=me(PL[0]); let best=null,bd=1e9; for(const b of Wd.B){ if(Math.abs((b.x0+b.x1)/2-o.x)>1400||Math.abs((b.y0+b.y1)/2-o.y)>1400) continue; for(const q of (cur.ty==='bike'?(b.bikes||[]):b.scoot)){ if(q.taken) continue; const d=Math.hypot(q.x-o.x,q.y-o.y); if(d<bd){ bd=d; best=q; } } } return best; };
      M={time:O.time||(170+steps.length*42),label:()=>CHAP[ST.ch].slice(0,3)+'｜第 '+Math.min(k+1,steps.length)+' 步 / 共 '+steps.length+' 步',sub:()=>cur?(cur.k==='go'&&cur.clean&&WT.lv?'先甩掉警察':stepTxt(cur)):'',chasers,
        target:()=>{ if(!cur) return null; const c2=cur; if(c2.k==='go') return c2.clean&&WT.lv?null:c2.pt; if(c2.k==='talk') return c2.npc; if(c2.k==='board') return c2.npc&&c2.npc.st!=='walkin'?c2.npc:null; if(c2.k==='collect'){ const o=me(PL[0]); return items.filter(q=>!q.got).sort((a,b)=>Math.hypot(a.x-o.x,a.y-o.y)-Math.hypot(b.x-o.x,b.y-o.y))[0]||null; } if(c2.k==='hijack'||c2.k==='steal') return tgtCar; if(c2.k==='mrt') return mrtTgt(); if(c2.k==='ride') return rideTgt(); return null; },
        people:()=>npc.filter(q=>q.st!=='in'&&!(q.st==='out'&&q.t2>4)),
        onBoard(p,v){ if(tgtCar&&v===tgtCar&&cur&&(cur.k==='steal'||cur.k==='hijack')){ if(cur.k==='steal'){ say(v,'（防盜警報器）嗶嗶嗶嗶——'); setWanted(cur.stars||1,'偷車'); } next(); } },
        onMrt(p,e){ if(cur&&cur.k==='mrt'&&e===Wd.mrt[cur.to%Wd.mrt.length]){ lastPt={x:e.ex,y:e.ey,a:0}; next(); } },
        upd(dt){ if(k<0) next(); if(!cur||over) return; const c2=cur; c2.t+=dt;
          if(chasers.need>0){ spT-=dt; if(chasers.length<chasers.need&&spT<=0){ spT=6+R()*4; const o=me(PL[0]),pt=roadPt(o,450,800); if(offView(pt.x,pt.y,40)){ const cv=mkVeh('suv',pt.x,pt.y,pt.a,'#16181c','chaser'); cv.vmax=360+100*dd; cv.acc=380+60*dd; cv.noLight=1; chasers.push(cv); if(chasers.length===1) radio('me','後面那台黑頭車……追來了！'); } }
            for(const cv of chasers){ if(cv.hp<=0||cv.drv>=0) continue; let tg=null,td=1e9; for(const p of PL){ if(p.mrt) continue; const o=me(p),d=Math.hypot(o.x-cv.x,o.y-cv.y); if(d<td){ td=d; tg=o; } } if(!tg){ drive(cv,null,0,false,dt,6); continue; } if(td<170) drive(cv,Math.atan2(tg.y+(tg.vy||0)*.3-cv.y,tg.x+(tg.vx||0)*.3-cv.x),cv.vmax,false,dt,TH.grip*8); else aiDrive(cv,tg.x,tg.y,dt,{lane:20}); } }
          for(const q of npc) if(q.st==='out'){ q.t2=(q.t2||0)+dt; q.x+=Math.cos(q.a)*30*dt; q.y+=Math.sin(q.a)*30*dt; q.ph+=dt*8; }
          if(pax&&pax.st==='walkin'){ const v=PL.map(p=>p.car).filter(Boolean)[0]; if(v){ const dx=v.x-pax.x,dy=v.y-pax.y,d=Math.hypot(dx,dy); pax.a=Math.atan2(dy,dx); pax.ph+=dt*8; if(d<14){ pax.st='in'; pax.car=v; const ix=npc.indexOf(pax); if(ix>=0) npc.splice(ix,1); next(); } else { pax.x+=dx/d*55*dt; pax.y+=dy/d*55*dt; } } return; }
          if(c2.k==='go'){ const need=c2.need||'any',ok=PL.some(p=>{ const o=me(p); if(!o||p.mrt) return false; if(need==='foot'&&!p.foot) return false; if(need==='car'&&!(p.car&&p.car.ty!=='scooter'&&p.car.ty!=='bike')) return false; if((need==='bike'||need==='scooter')&&!(p.car&&p.car.ty===need)) return false; return Math.hypot(o.x-c2.pt.x,o.y-c2.pt.y)<(c2.r||60)&&(!o.ty||vspeed(o)<70); });
            if(ok&&c2.clean&&WT.lv>0) PL.forEach(p=>hint(p,'cleango','後面有警察！先甩掉他們')); else if(ok){ lastPt=c2.pt; sfx('lap'); next(); }
            else { const p=PL[0],o=me(p); if(need==='foot'&&p.car&&Math.hypot(o.x-c2.pt.x,o.y-c2.pt.y)<240) hint(p,'needfoot','要下車走過去，按 '+KN[0].f+' 下車',[KN[0].f]); if(need==='bike'&&!(p.car&&p.car.ty==='bike')) hint(p,'needbike','要騎公共單車才行'); if(need==='car'&&p.car&&(p.car.ty==='scooter'||p.car.ty==='bike')) hint(p,'needcar','這一步要開汽車，去搶或借一台車'); if(p.foot&&c2.t>4&&Math.hypot(o.x-c2.pt.x,o.y-c2.pt.y)>900) hint(p,'farwalk','太遠了？路邊的機車、公共單車、捷運都可以用'); } }
          else if(c2.k==='talk'){ const q=c2.npc; if(!c2.talking){ if(PL.some(p=>{ const o=me(p); return o&&!p.mrt&&Math.hypot(o.x-q.x,o.y-q.y)<(o.ty?90:46)&&(!o.ty||vspeed(o)<50); })){ c2.talking=1; q.ex={}; for(const ln of c2.lines) radio(ln[0],ln[1]); } else if(c2.t>2) PL.forEach(p=>hint(p,'talk','走到人物旁邊，就會開始對話')); } else if(!DLG&&!DQ.length){ lastPt={x:q.x,y:q.y,a:0}; next(); } }
          else if(c2.k==='board'){ const q=c2.npc; if(!q){ next(); return; } const v=PL.map(p=>p.car).filter(Boolean)[0]; if(!v||v.ty==='scooter'||v.ty==='bike'){ PL.forEach(p=>hint(p,'boardcar','先弄一台汽車，再開到'+CH[c2.who].n+'旁邊')); return; } if(Math.hypot(v.x-q.x,v.y-q.y)<90&&vspeed(v)<40){ q.st='walkin'; pax=q; say(q,'走吧！'); } }
          else if(c2.k==='collect'){ for(const q of items){ if(q.got) continue; if(PL.some(p=>p.foot&&Math.hypot(p.foot.x-q.x,p.foot.y-q.y)<24)){ q.got=true; sfx('item'); PL.forEach(p=>toast(p,'拿到了！（'+items.filter(z=>z.got).length+' / '+items.length+'）')); } else if(PL.some(p=>p.car&&Math.hypot(p.car.x-q.x,p.car.y-q.y)<90)) PL.forEach(p=>hint(p,'collectfoot','要下車走過去拿，按 '+KN[Math.min(p.i,KN.length-1)].f+' 下車',[KN[Math.min(p.i,KN.length-1)].f])); } if(items.every(q=>q.got)) next(); }
          else if(c2.k==='lose'){ if(WT.lv===0&&c2.t>.5) next(); }
          else if(c2.k==='ride'){ if(PL.some(p=>p.car&&p.car.ty===c2.ty)) next(); }
          else if(c2.k==='hijack'){ if(!tgtCar) next(); } },
        markers:()=>{ const o2=[]; if(!cur) return o2; const tg=M.target(),c2=cur; if(c2.k==='go'&&tg) o2.push({x:tg.x,y:tg.y,k:'zone',txt:tg.n||''}); else if((c2.k==='talk'||c2.k==='board')&&tg) o2.push({x:tg.x,y:tg.y,k:'ring',txt:CH[c2.who].n,green:1}); else if(c2.k==='collect') for(const q of items){ if(!q.got) o2.push({x:q.x,y:q.y,k:'ring',txt:c2.n===1?'隨身碟':'收帳',green:1}); } else if((c2.k==='hijack'||c2.k==='steal')&&tgtCar) o2.push({x:tgtCar.x,y:tgtCar.y,k:'tag',txt:'目標車',h:34}); else if((c2.k==='mrt'||c2.k==='ride')&&tg) o2.push({x:tg.x,y:tg.y,k:'ring',txt:c2.k==='mrt'?tg.n:c2.ty==='bike'?'公共單車':'機車',green:1});
          for(const cv of chasers) if(cv.hp>0&&cv.drv<0) o2.push({x:cv.x,y:cv.y,k:'tag',txt:'追兵',red:1}); return o2; }};
      M.total=M.time; hint0(); }
    if(ty==='catch'||ty==='amb'||ty==='escape') M.noWanted=1;
  }
  function hint0(){ if(VIEW==='3d'){ PL.forEach(p=>{ const k=local2?(p.i===0?['↑','↓','←','→']:['W','S','A','D']):['↑','↓','←','→']; hint(p,'dir3',(local2?(p.i+1)+'P：':'')+(p.foot?'↑ 往前走、← → 轉身；走到車旁邊按 '+KN[Math.min(p.i,KN.length-1)].f+' 上車':'↑ 油門、↓ 煞車／倒車、← → 轉方向盤；按 '+KN[Math.min(p.i,KN.length-1)].f+' 上下車、V 換視角'),k); }); return; }
    PL.forEach(p=>hint(p,'dir',local2?(p.i===0?'1P 用方向鍵開車：按哪個方向，車就往畫面上那個方向開':'2P 用 WASD 開車：按哪個方向，車就往畫面上那個方向開'):'按方向鍵，車子就往畫面上那個方向開；按反方向會煞車、迴轉',local2?[]:['↑','↓','←','→'])); }
  function fleeAI(v,dt){ if(v.dead){ drive(v,null,0,false,dt,6); return; } const near=PL.map(me).sort((a,b)=>Math.hypot(a.x-v.x,a.y-v.y)-Math.hypot(b.x-v.x,b.y-v.y))[0];
    if(!v.goal||Math.hypot(v.goal[0]*P-v.x,v.goal[1]*P-v.y)<55){ let gx=Math.round(v.x/P),gy=Math.round(v.y/P); if(!v.goal){ const ca=Math.cos(v.a),sa=Math.sin(v.a); gx=clamp(Math.round(v.x/P+ca*.6),0,NB); gy=clamp(Math.round(v.y/P+sa*.6),0,NB); v.goal=[gx,gy]; v.prevG=null; }
      else { const cur=v.goal,ax=v.x-near.x,ay=v.y-near.y,l=Math.hypot(ax,ay)||1; let best=null,bs=-1e9; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=cur[0]+dx,ny=cur[1]+dy; if(nx<0||ny<0||nx>NB||ny>NB) continue; if(v.prevG&&v.prevG[0]===nx&&v.prevG[1]===ny) continue; const s=(dx*ax+dy*ay)/l+R()*.9-(nx===0||ny===0||nx===NB||ny===NB?.5:0); if(s>bs){ bs=s; best=[nx,ny]; } } v.prevG=cur; v.goal=best||v.prevG; } }
    aiDrive(v,v.goal[0]*P,v.goal[1]*P,dt,{lane:28,tv:v.vmax*(Math.hypot(near.x-v.x,near.y-v.y)>700?.75:1)}); }
  function toast(p,txt){ (p.toasts=p.toasts||[]).push({txt,t:2.6}); }
  function win(){ if(over) return; over={win:true,T:2.2}; sfx('win'); }
  function fail(why){ if(over) return; over={win:false,why,T:2.2}; sfx('lose'); }
  /* ---- 隨機路況事件 ---- */
  function spawnEvent(){ const p=me(PL[Math.floor(R()*np)]); if(!p) return; const v=p.ty?p:null,ca=v?Math.cos(v.a):1,sa=v?Math.sin(v.a):0; const hk=onH(p.y),vk=onV(p.x); let h,k; if(hk>=0&&(vk<0||Math.abs(ca)>.7)){ h=true; k=hk; } else if(vk>=0){ h=false; k=vk; } else return;
    const s=h?Math.sign(ca)||1:Math.sign(sa)||1,al=(h?p.x:p.y)+s*(560+R()*300),segC=Math.round(al/P)*P; let u=al; if(Math.abs(u-segC)<HR+70) u=segC+s*(HR+90); if(u<LO+60||u>HI-60) return;
    const kinds=['works','dpark','garbage','amb','jay','works','dpark']; const kd=pick(R,kinds); const pt=(off,uu)=>h?{x:uu,y:k*P+s*off}:{x:k*P-s*off,y:uu};
    if(!offView(pt(52,u).x,pt(52,u).y,40)) return;
    if(kd==='works'){ const off=R()<.5?52:17,c0=pt(off,u),cones=[]; for(let q=-2;q<=3;q++){ const a=pt(off+(q===-2||q===3?0:(off>30?-14:14)*0),u+q*14*s); cones.push([a.x+(h?0:(R()-.5)*3),a.y]); } const c2=[]; for(let q=-2;q<=3;q++){ const a=pt(off+(off>30?-16:16),u+q*16*s); c2.push([a.x,a.y]); } EV.push({k:'works',x:c0.x,y:c0.y,h,s,off,block:1,cones:c2,worker:{x:pt(off,u+12*s).x,y:pt(off,u+12*s).y,a:R()*TAU,lk:{skin:'#c99a74',hair:'#111',shirt:'#ff7a1a',pants:'#2a3040',cap:'#f2c21c'},ph:0},sign:pt(off,u-50*s)}); }
    else if(kd==='dpark'){ const c0=pt(58,u),cv=mkVeh(pick(R,['sedan','van','truck','hatch']),c0.x,c0.y,h?(s>0?0:PI):(s>0?PI/2:-PI/2),null,'parked'); cv.haz=true; const dr={x:c0.x+(h?0:-s*22),y:c0.y+(h?s*22:0),a:0,lk:mkLook(R),ph:0}; EV.push({k:'dpark',x:c0.x,y:c0.y,off:56,block:1,car:cv,ped:dr,said:0}); }
    else if(kd==='garbage'){ const c0=pt(56,u),cv=mkVeh('garbage',c0.x,c0.y,h?(s>0?0:PI):(s>0?PI/2:-PI/2),null,'parked'); cv.haz=true; const peds=[]; for(let q=0;q<4;q++){ const a=pt(78,u+(q-1.5)*16*s); peds.push({x:a.x,y:a.y,a:h?(s>0?-PI/2:PI/2):(s>0?0:PI),lk:mkLook(R),ph:0,bag:pick(R,['#e8e8e0','#3a7ad8','#d8d0a0'])}); } EV.push({k:'garbage',x:c0.x,y:c0.y,off:56,block:1,car:cv,peds,life:22}); }
    else if(kd==='amb'){ const back=(h?p.x:p.y)-s*620; if(back<LO+60||back>HI-60) return; const c0=pt(17,back); if(!offView(c0.x,c0.y,40)) return; const av=mkVeh('amb',c0.x,c0.y,h?(s>0?0:PI):(s>0?PI/2:-PI/2),null,'traffic'); av.rd={h,k,s,off:17}; av.cruise=300; av.siren=true; av.noLight=1; av.vx=Math.cos(av.a)*240; av.vy=Math.sin(av.a)*240; EV.push({k:'amb',car:av,x:av.x,y:av.y}); PL.forEach(q=>hint(q,'yield','後面有救護車！往旁邊車道讓一讓')); }
    else if(kd==='jay'){ const c0=pt(HR+8,u),c1=pt(-HR-8,u); const q={x:c0.x,y:c0.y,lk:mkLook(R),ph:0,sp:34,st:'jay',jay:1,tx:c1.x,ty:c1.y,a:0,b:null,dodge:0,umb:TH.rain}; PD.push(q); EV.push({k:'jay',x:c0.x,y:c0.y,ped:q,life:12}); } }
  /* ---- 上下車 ---- */
  function toggleCar(p){ if(p.car){ const v=p.car; if(vspeed(v)>60){ toast(p,'車速太快，先停下來才能下車'); return; } const ca=Math.cos(v.a),sa=Math.sin(v.a); let fx=v.x-sa*(v.Wd/2+9)*-1,fy=v.y+ca*(v.Wd/2+9)*-1; if(staticPush(fx,fy,5)){ fx=v.x+sa*(v.Wd/2+9)*-1; fy=v.y-ca*(v.Wd/2+9)*-1; } p.foot={x:fx,y:fy,a:v.a,vx:0,vy:0,lk:footLook(p),ph:0}; v.drv=-1; v.role=v.role==='player'?'parked':v.role; v.siren=false; p.car=null; sfx('click'); hint(p,'enter','走到任何一台車旁邊按 '+KN[Math.min(p.i,KN.length-1)].f+' 上車；路上的車也能攔下來搶著開',[KN[Math.min(p.i,KN.length-1)].f]); return; }
    const f=p.foot; const st=Wd.mrt.find(e=>Math.hypot(e.x-f.x,e.y-f.y)<40); if(st){ const list=Wd.mrt.filter(e=>e!==st); p.mrt={st:'menu',sel:0,from:st,list}; sfx('click'); return; }
    { let sb=null,sd=26,bb=null,bdd=22; for(const b of nearBlocks(f.x,f.y)){ for(const q of b.scoot){ if(q.taken) continue; const d=Math.hypot(q.x-f.x,q.y-f.y); if(d<sd){ sd=d; sb=q; } } for(const q of (b.bikes||[])){ if(q.taken) continue; const d=Math.hypot(q.x-f.x,q.y-f.y); if(d<bdd){ bdd=d; bb=q; } } }
      const near=V.some(v=>v.drv<0&&v.role!=='wreck'&&Math.hypot(v.x-f.x,v.y-f.y)-v.L*.3<Math.min(sd,bdd));
      if((sb||bb)&&!near){ const q=bb&&(!sb||bdd<sd)?bb:sb,isB=q===bb; q.taken=true; parkVer++; const ci=Math.floor(q.x/P),cj=Math.floor(q.y/P); for(const w of [0,.5]) TILES.delete(Wd.di*100000+(ci+2)*100+(cj+2)+w);
        const x=q.x-Math.cos(q.a)*(isB?14:24),y=q.y-Math.sin(q.a)*(isB?14:24),v=mkVeh(isB?'bike':'scooter',x,y,q.a+PI,isB?'#f0a020':q.c,'player'); v.lk={shirt:p.foot.lk.shirt,helm:isB?null:(q.h||'#e8e8e8'),skin:p.foot.lk.skin,hair:p.foot.lk.hair}; v.drv=p.i; p.car=v; p.foot=null; sfx('click'); toast(p,isB?'借了一台公共單車！':'騎上機車了！'); hint(p,isB?'bike2':'scoot2',isB?'腳踏車可以騎上人行道；按 '+KN[Math.min(p.i,KN.length-1)].n+' 用力踩（會用到體力）':'機車小台好鑽，轉彎很靈活',[]); if(M.onBoard) M.onBoard(p,v); return; } }
    let best=null,bd=48; for(const v of V){ if(v.drv>=0||v.role==='wreck'||v.role==='suspect'&&!v.dead) continue; const d=Math.hypot(v.x-f.x,v.y-f.y)-v.L*.3; if(d<bd){ bd=d; best=v; } }
    let pk=null; if(!best){ for(const b of nearBlocks(f.x,f.y)) for(const q of b.parked){ if(q.taken) continue; const d=Math.hypot(q.x-f.x,q.y-f.y); if(d<bd+6){ bd=d; pk=q; } } }
    if(pk){ pk.taken=true; best=mkVeh(pk.ty,pk.x,pk.y,pk.a,pk.col,'player'); if(pk.ty==='police') best.col='#f4f6f8'; if(nearCop(f.x,f.y,900)) crime(p,1,'偷車被警察看到'); else if(R()<.4){ say(best,'（防盜警報器）嗶嗶嗶嗶——'); crime(p,.5,'偷車'); } }
    if(!best){ toast(p,'附近沒有車可以開'); return; }
    if((best.role==='traffic'||best.role==='cop')&&!M.noWanted) crime(p,best.role==='cop'?2:1,best.role==='cop'?'搶警車':'搶車');
    if(best.role==='traffic'||best.role==='chaser'||best.role==='cop'||best.role==='tailed'){ const ex={x:best.x+Math.cos(best.a+PI/2)*20,y:best.y+Math.sin(best.a+PI/2)*20,lk:best.lk&&best.ty==='scooter'?{skin:best.lk.skin,hair:'#222',shirt:best.lk.shirt,pants:'#2a3040'}:mkLook(R),sp:28,st:'flee',a:best.a+PI/2,ph:0,b:null,dodge:0,umb:TH.rain}; PD.push(ex); say(ex,ST.type==='catch'||ST.type==='escape'?pick(R,['警察先生…車借你啦，要還我喔！','欸！我的車！好啦好啦…']):pick(R,['欸欸欸！你幹嘛！我的車！','搶車喔！有人搶車啦！','我的車啊——！'])); }
    if(best.role==='chaser') M.chasers&&M.chasers.splice(M.chasers.indexOf(best),1);
    best.lk=Object.assign({},best.lk||{},{shirt:p.foot.lk.shirt,skin:p.foot.lk.skin,hair:p.foot.lk.hair});
    best.role='player'; best.drv=p.i; best.hitT=0; best.haz=false; best.siren=ST.type==='catch'||ST.type==='amb'?best.ty==='police'||best.ty==='amb':false; p.car=best; p.foot=null; sfx('click'); toast(p,'坐上'+VT[best.ty].n+'了！'); if(VT[best.ty].vmax>460) hint(p,'fast','這台是跑車，速度很快，轉彎小心！'); if(M.onBoard) M.onBoard(p,best); }
  function footLook(p){ const L=p.i===0&&opts.look||{},hs=L.hs||'short'; return {skin:L.skin||'#e0b48e',hair:L.hairc||'#1a1410',shirt:L.shirt||(p.i===0?'#2a4a7a':'#7a2a2a'),pants:L.pants||'#1e1e22',hs,cap:hs==='cap'?(L.capc||'#c8202a'):null,me:1}; } /* 主角照我的造型 */
  function nearBlocks(x,y){ const i=Math.floor(x/P),j=Math.floor(y/P),o=[]; for(let a=i-1;a<=i+1;a++) for(let b=j-1;b<=j+1;b++){ const q=Wd.blk(a,b); if(q) o.push(q); } return o; }
  /* ---- 天氣 ---- */
  function weatherStep(dt){ if(WX.shower>0&&cd<=0){ WX.shower-=dt; if(WX.shower<=0){ WX.tgt=.75; radio('disp','氣象局發布大雨特報，路面濕滑，開車小心！'); } }
    WX.rain+=clamp(WX.tgt-WX.rain,-dt*.06,dt*.06); if(WX.flash>0) WX.flash=Math.max(0,WX.flash-dt*2.5);
    if(WX.storm){ WX.boltT-=dt; if(WX.boltT<=0){ WX.boltT=5+R()*8; WX.flash=1; flash=Math.max(flash,.18); thunder(); } }
    TH.rain=WX.rain>.3?1:0; TH.grip=1-.38*clamp(WX.rain,0,1)-(WX.storm?.05:0); }
  function thunder(){ if(opts.preview) return; try{ const ac=env.audio&&env.audio(),out=env.out&&env.out(); if(!ac||!out) return; const n=ac.sampleRate*2.2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0); let m=0; for(let i=0;i<n;i++){ m=m*.98+(Math.random()*2-1)*.02; d[i]=m*8*Math.exp(-i/n*2.4); } const s0=ac.createBufferSource(); s0.buffer=b; const g=ac.createGain(); g.gain.value=.5; const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=380; s0.connect(lp); lp.connect(g); g.connect(out); s0.start(); }catch(e){} }
  /* ---- 通緝：犯法累積熱度，一顆星以上警察就會來追 ---- */
  const COLN=[['#c8202a','紅色'],['#9c1f24','紅色'],['#1d4fa8','藍色'],['#24365c','深藍色'],['#f2f2ee','白色'],['#e8e6e0','白色'],['#1b1d22','黑色'],['#16181c','黑色'],['#e8c21c','黃色'],['#f2c12e','黃色'],['#2f7a4a','綠色'],['#2f4a3c','綠色'],['#ff7a1a','橘色'],['#8a5ab8','紫色'],['#c9ccd0','銀色'],['#d0d3d6','銀色'],['#6b7078','灰色'],['#c8b48e','米色'],['#f0a020','橘色'],['#f4f6f8','白色']];
  const colorName=h=>{ const c0=parseInt((h||'#888888').slice(1),16); let best='灰色',bd=1e9; for(const [hx,n] of COLN){ const c1=parseInt(hx.slice(1),16),d=Math.abs((c0>>16)-(c1>>16))+Math.abs((c0>>8&255)-(c1>>8&255))+Math.abs((c0&255)-(c1&255)); if(d<bd){ bd=d; best=n; } } return best; };
  function crime(p,pts,why){ if(prev&&!opts.wanted||M.noWanted||over||cd>0) return; const o=me(p); if(o&&o.siren) return; const old=WT.lv; if(ST.type==='race') pts*=.5; WT.heat=Math.min(5.99,WT.heat+pts); WT.lose=0; WT.lv=Math.min(5,Math.floor(WT.heat));
    if(WT.lv>old) wantedUp(p,old,why); else if(WT.lv===0) toast(p,why+'！再犯警察就會來追你'); else toast(p,why+'！'); }
  function setWanted(n,why){ const old=WT.lv; WT.heat=Math.max(WT.heat,n+.2); WT.lv=Math.min(5,Math.floor(WT.heat)); WT.lose=0; if(WT.lv>old) wantedUp(PL[0],old,why||''); }
  function wantedUp(p,old,why){ const o=me(p),rn=roadName(Wd,o.x,o.y).replace(/ \d+ 號$/,''),what=o.ty?colorName(o.col)+VT[o.ty].n:'步行的男子';
    const L=['',`各單位注意，一輛${what}在${rn}附近${why||'違規'}，請前往攔查。`,`嫌犯拒絕攔檢，往${rn}方向逃逸，請求支援！`,`嫌犯危險駕駛！在前方路口設置路障！`,`空中警察隊直升機升空，支援追捕！`,`全城通緝！所有警力投入追捕！`];
    radio('scan',L[WT.lv]||L[5],3.6); sfx('hurt'); toast(p,'被通緝了！'+'★'.repeat(WT.lv)); WT.spT=old===0?1.2:.5;
    if(old===0) PL.forEach(q=>hint(q,'wanted','被警察追了！離開警車的視線一段時間，星星就會消失；也可以下車搭捷運躲開'));
    if(WT.lv>=3) PL.forEach(q=>hint(q,'rb','前面可能有路障，從旁邊的路繞過去！'));
    for(const v of V) if(v.ty==='police'&&v.role==='traffic'&&Math.hypot(v.x-o.x,v.y-o.y)<520&&copN()<COPW[WT.lv]){ v.role='cop'; v.siren=true; v.noLight=1; v.vmax=Math.min(v.vmax,370); } }
  function clearWanted(msg){ if(!WT.lv&&WT.heat<1) return; WT.lv=0; WT.heat=0; WT.lose=0; WT.heli=null; for(const v of V) if(v.role==='cop'||v.role==='block'){ v.role=v.role==='block'?'parked':'leave'; v.siren=false; } radio('scan',msg||'嫌犯失去蹤影，各單位解除追捕。',3); PL.forEach(p=>toast(p,'成功甩掉警察！')); sfx('lap'); if(M.onClear) M.onClear(); }
  function copAI(v,dt){ if(v.hp<=0){ v.siren=false; drive(v,null,0,false,dt,6); return; } if(WT.lv<=0){ v.role='leave'; v.siren=false; return; } v.siren=true;
    let tg=null,td=1e9; for(const p of PL){ const o=me(p); if(!o||p.mrt) continue; const d=Math.hypot(o.x-v.x,o.y-v.y); if(d<td){ td=d; tg=o; } } if(!tg) return;
    if(td<190){ const lead=tg.ty?.32:0,px=tg.x+(tg.vx||0)*lead,py=tg.y+(tg.vy||0)*lead; if(tg.ty) drive(v,Math.atan2(py-v.y,px-v.x),v.vmax*(WT.lv>=2?1:.85),WT.lv>=3,dt,TH.grip*8); else drive(v,Math.atan2(py-v.y,px-v.x),Math.max(0,(td-34)*2.2),false,dt,TH.grip*8); }
    else aiDrive(v,tg.x,tg.y,dt,{lane:20,boost:WT.lv>=3&&td>500});
    v.sayT=(v.sayT||R()*4)-dt; if(v.sayT<=0&&td<380){ v.sayT=4+R()*4; say(v,pick(R,['前面的車！靠邊停！','警察！停車！','你跑不掉的！','嫌犯在這裡，請求支援！','下車！雙手舉起來！'])); } }
  const COPW=[0,1,2,2,3,4],copN=()=>V.filter(v=>v.role==='cop').length; /* 每個星等最多幾台警車在追（v242 從 2～6 台減少） */
  function wantedStep(dt){ const lv=WT.lv; if(lv<=0){ WT.heat=Math.max(0,WT.heat-dt*.01); if(sGain) sGain.gain.value=0; for(const p of PL) p.bust=0; return; }
    const ps=PL.filter(p=>!p.mrt).map(me); if(!ps.length){ WT.lose+=dt*3; } let seen=false,nd=1e9;
    for(const v of V){ if(v.role!=='cop'||v.hp<=0) continue; for(const o of ps){ const d=Math.hypot(o.x-v.x,o.y-v.y); nd=Math.min(nd,d); if(d<480) seen=true; } }
    if(WT.heli){ const h=WT.heli; for(const o of ps) if(Math.hypot(o.x-h.x,o.y-h.y)<300) seen=true; }
    if(seen) WT.lose=Math.max(0,WT.lose-dt*.6); else { WT.lose+=dt; if(WT.lose>=3+lv*1.4){ clearWanted(); return; } } /* 被看到時進度只慢慢退，不會一下歸零 */
    // 補警車
    const cops=copN(),want=COPW[lv]; WT.spT-=dt; /* v242 減少警車：原本 2～6 台太多逃不掉 */
    if(cops<want&&WT.spT<=0&&ps.length&&WT.lose<1.5){ WT.spT=Math.max(2.6,5-lv*.4); const o=ps[Math.floor(R()*ps.length)]; for(let tr=0;tr<12;tr++){ const pt=roadPt(o,520,950); if(!offView(pt.x,pt.y,50)) continue; const cv=mkVeh('police',pt.x,pt.y,Math.atan2(o.y-pt.y,o.x-pt.x),'#f4f6f8','cop'); cv.siren=true; cv.noLight=1; cv.vmax=340+lv*16; cv.acc=380+lv*12; break; } }
    // 路障（三星以上）
    if(lv>=3){ WT.rbT-=dt; if(WT.rbT<=0){ WT.rbT=28+R()*10; for(const p of PL){ const v=p.car; if(!v||vspeed(v)<120) continue; const hk=onH(v.y),vk=onV(v.x); if((hk>=0)===(vk>=0)) continue; const h=hk>=0,s2=Math.sign(h?Math.cos(v.a):Math.sin(v.a))||1; let u=(h?v.x:v.y)+s2*640; const segC=Math.round(u/P)*P; if(Math.abs(u-segC)<HR+70) u=segC+s2*(HR+110); if(u<LO+80||u>HI-80) continue; const k=h?hk:vk,cars=[];
      for(const o2 of [-44,0,44]){ const x=h?u:k*P+o2,y=h?k*P+o2:u; if(!offView(x,y,10)&&Math.hypot(x-v.x,y-v.y)<500) continue; const cv=mkVeh('police',x,y,(h?PI/2:0)+(o2?.25*Math.sign(o2):0),'#f4f6f8','block'); cv.siren=true; cars.push(cv); }
      if(cars.length){ EV.push({k:'rb',x:h?u:k*P,y:h?k*P:u,cars,life:45,cones:[[h?u-s2*30:k*P-58,h?k*P-58:u-s2*30],[h?u-s2*30:k*P+58,h?k*P+58:u-s2*30]]}); radio('scan','路障設好了，嫌犯就要過來了！',2.6); } } } }
    // 直升機（四星以上）
    if(lv>=4&&ps.length){ const o=ps[0]; if(!WT.heli) WT.heli={x:o.x-700,y:o.y-700,h:300,a:0,tx:o.x,ty:o.y}; const h=WT.heli,dx=o.x-h.x,dy=o.y-h.y,d=Math.hypot(dx,dy),sp=Math.min(d*1.2,300); if(d>1){ h.x+=dx/d*sp*dt; h.y+=dy/d*sp*dt; h.a=Math.atan2(dy,dx); } h.tx+=(o.x-h.tx)*Math.min(1,dt*2); h.ty+=(o.y-h.ty)*Math.min(1,dt*2); } else WT.heli=null;
    // 被逮捕
    for(const p of PL){ if(p.mrt) continue; const o=me(p),cop=nearCop(o.x,o.y,o.ty?76:62),slow=o.ty?vspeed(o)<40:true; if(cop&&slow&&vspeed(cop)<130&&cop.role==='cop'){ p.bust+=dt*(o.ty?1:1.3); if(p.bust>.3) hint(p,'bust','警察要逮捕你了！快開走（或跑走）！'); if(p.bust>3.2){ radio('scan','嫌犯已經逮捕到案。'); fail('被警察逮捕了！'); } } else p.bust=Math.max(0,p.bust-dt*2); }
    // 警笛聲
    if(!opts.preview){ if(!sOsc){ try{ const ac=env.audio&&env.audio(),out=env.out&&env.out(); if(ac&&out){ sOsc=ac.createOscillator(); sOsc.type='square'; const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1500; sGain=ac.createGain(); sGain.gain.value=0; sOsc.connect(lp); lp.connect(sGain); sGain.connect(out); sOsc.start(); } }catch(e){ sOsc=null; } }
      if(sOsc){ sOsc.frequency.value=720+330*(.5+.5*Math.sin(t*TAU*.6)); sGain.gain.value=.02*clamp(1-nd/1000,0,1); } } }
  /* ---- 撞到行人 ---- */
  function knock(q,v){ q.st='down'; q.downT=6+R()*3; q.dodge=0; q.lying=1; shake=Math.max(shake,5); sfx('hurt'); for(let k=0;k<6;k++) FX.push({k:'spark',x:q.x,y:q.y,vx:(R()-.5)*120,vy:(R()-.5)*120,l:.3,L:.3});
    const w=PD.find(z=>z!==q&&z.st!=='down'&&Math.hypot(z.x-q.x,z.y-q.y)<220); if(w) say(w,pick(R,['啊——！撞到人了！','快叫救護車！','肇事逃逸啊！','我記下車牌了！']));
    if(v.drv>=0){ const p=PL[v.drv]; crime(p,WT.lv>=1?2:1,'撞到行人'); } }
  /* ---- 捷運：入口按 F → 選站 → 搭車 ---- */
  function mrtStep(p,I,dt,fe){ const m=p.mrt,mi=p.mi,nx=I.dx||I.dy,edge=nx&&!(mi.dx||mi.dy); p.mi={dx:I.dx,dy:I.dy,n:I.n};
    if(m.st==='menu'){ if(prev){ m.sel=0; fe=true; } if(edge){ m.sel=(m.sel+(I.dx>0||I.dy>0?1:-1)+m.list.length)%m.list.length; sfx('click'); } if(I.n&&!mi.n){ p.mrt=null; return; } if(fe){ m.st='ride'; m.T=0; m.to=m.list[m.sel]; sfx('go'); hint(p,'mrtride','搭捷運的時候警察找不到你，可以拿來甩掉通緝'); } }
    else { m.T+=dt; if(m.T>=4.2){ const e=m.to; p.foot.x=e.ex; p.foot.y=e.ey; p.foot.a=-PI/2; p.mrt=null; p.cam.x=e.ex; p.cam.y=e.ey; toast(p,'抵達捷運'+e.n); if(WT.lv>0&&WT.lv<=3) clearWanted('嫌犯搭捷運離開了，失去蹤影。'); else if(WT.lv>3){ WT.heat-=2; WT.lv=Math.floor(WT.heat); WT.heli=null; } if(M.onMrt) M.onMrt(p,e); } } }
  function footHints(p){ const f=p.foot; if(!f) return; const K=KN[Math.min(p.i,KN.length-1)].f; if(Wd.mrt.some(e=>Math.hypot(e.x-f.x,e.y-f.y)<70)) hint(p,'mrt','捷運站入口！按 '+K+' 進站，可以搭到其他捷運站',[K]);
    for(const b of nearBlocks(f.x,f.y)){ if(b.scoot.some(q=>!q.taken&&Math.hypot(q.x-f.x,q.y-f.y)<40)) hint(p,'scoot','騎樓前的機車按 '+K+' 就能騎走',[K]); if((b.bikes||[]).some(q=>!q.taken&&Math.hypot(q.x-f.x,q.y-f.y)<40)) hint(p,'bike','公共單車站！按 '+K+' 借一台腳踏車',[K]); } }
  /* ---- 畫面要用的清單 ---- */
  function people(){ const o=[],add=(q,ex)=>o.push(Object.assign({x:q.x,y:q.y,vx:q.vx||0,vy:q.vy||0,a:q.a||0,lk:q.lk,ph:q.ph||0},ex||{}));
    for(const q of PD) add(q,{run:q.st==='flee'||q.jay,umb:q.umb&&q.st!=='down'&&TH.rain,phone:q.phone,lying:q.st==='down'});
    for(const e of EV){ if(e.worker) add(e.worker,{ph:t*2}); if(e.ped&&e.k==='dpark') add(e.ped,{phone:1}); if(e.peds) for(const q of e.peds) add(q); }
    const sc=M.scene&&M.scene(); if(sc){ if(sc.vic) add(sc.vic,{lying:1}); add(sc.cop,{wave:Math.sin(t*5)>0}); }
    const sus=M.susp&&M.susp(); if(sus) add(sus,{run:1});
    const pax=ST.type==='taxi'&&M.target&&M.target(); if(pax&&pax.lk&&pax.st!=='in') add(pax,{wave:pax.st==='stand',umb:TH.rain});
    if(M.people) for(const q of M.people()) add(q,q.ex);
    for(const p of PL) if(p.foot&&!p.mrt) add(p.foot,{run:p.foot.run}); return o; }
  function parkedList(views){ const o=[]; for(const b of Wd.B){ if(!views.some(v=>{ const f=me(v.p); return Math.abs((b.x0+b.x1)/2-f.x)<1200&&Math.abs((b.y0+b.y1)/2-f.y)<1200; })) continue; for(const q of b.parked) if(!q.taken) o.push(q); } return o; }
  function gps(o,tg){ const f={x:o.x,y:o.y,vf:0},out=[]; for(let k=0;k<64;k++){ const d=Math.hypot(tg.x-f.x,tg.y-f.y); if(d<40) break; const n=navTo(f,tg.x,tg.y,30),st=Math.min(34,d); f.x+=Math.cos(n.ta)*st; f.y+=Math.sin(n.ta)*st; out.push([f.x,f.y,n.ta]); } return out; }
  /* ---- 主迴圈 ---- */
  setupMission();
  for(let k=0;k<24;k++) spawnTraffic(false); for(let k=0;k<30;k++) spawnPed(me(PL[0]),false);
  if(!prev&&np===1) setTimeout(()=>{},0);
  /* 引擎聲 */
  let osc=null,eg=null; if(!opts.preview){ const ac=env.audio&&env.audio(),out=env.out&&env.out(); if(ac&&out){ try{ osc=ac.createOscillator(); osc.type='sawtooth'; const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=420; eg=ac.createGain(); eg.gain.value=.018; osc.connect(lp); lp.connect(eg); eg.connect(out); osc.start(); }catch(e){ osc=null; } } }
  let cdBeep=4,goAt=prev?-9:1e9;
  function step(dt){ t+=dt; if(shake>0) shake=Math.max(0,shake-dt*25); if(flash>0) flash-=dt;
    if(cd>0){ cd-=dt; const n=Math.ceil(cd); if(n<=3&&n<cdBeep&&n>0){ cdBeep=n; sfx('beep'); } if(cd<=0){ sfx('go'); goAt=t; } }
    const running=cd<=0&&!over;
    weatherStep(dt); if(running) wantedStep(dt); else if(sGain) sGain.gain.value=0;
    for(const p of PL){ p.rtT-=dt; if(p.rtT<=0){ p.rtT=.3; const tg=M.target&&M.target(),o=me(p); p.route=tg&&o&&!over?gps(o,tg):[]; } const o=me(p); if(o){ const rn=roadName(Wd,o.x,o.y).replace(/ \d+ 號$/,''); if(rn!==p.road&&!/口$/.test(rn)&&rn!=='人行道'&&rn!=='公園裡'){ p.road=rn; p.roadT=3; } } if(p.roadT>0) p.roadT-=dt; }
    /* 對話佇列 */
    if(DLG){ DLG.T+=dt; if(DLG.T>DLG.t){ DLG=null; } } if(!DLG&&DQ.length) DLG=DQ.shift();
    for(const p of PL){ if(p.hq&&p.hq.length){ p.hq[0].t-=dt; if(p.hq[0].t<=0) p.hq.shift(); } if(p.toasts&&p.toasts.length){ p.toasts[0].t-=dt; if(p.toasts[0].t<=0) p.toasts.shift(); } }
    for(let i=BUB.length-1;i>=0;i--){ BUB[i].t-=dt; if(BUB[i].t<=0) BUB.splice(i,1); }
    /* 玩家 */
    for(const p of PL){ const I=prev?botIn(p):keyIn(p.i); const fe=I.f&&!p.pf; p.pf=I.f; if(p.mrt){ mrtStep(p,I,dt,fe); continue; } if(running&&fe) toggleCar(p); const tank=VIEW==='3d'&&!I.abs;
      if(p.car){ const v=p.car; v.surf=surfAt(v.x,v.y); if(v.ty==='bike') v.surf=Math.max(v.surf,.97); else if(v.ty==='scooter'&&v.surf>.7) v.surf=Math.max(v.surf,.9); if(p.wreckT>0){ p.wreckT-=dt; drive(v,null,0,false,dt,6); if(p.wreckT<=0){ v.hp=60; toast(p,'車子勉強發動了！'); } } else {
        let ta=null; if(!tank&&running&&(I.dx||I.dy)){ ta=Math.atan2(I.dy,I.dx); ta=assist(v,ta,I.dx,I.dy); }
        const bike=v.ty==='bike',gas=tank?I.dy<0:ta!=null; let boost=false;
        if(bike){ boost=running&&I.n&&p.stam>.05&&gas; if(boost) p.stam=Math.max(0,p.stam-dt/5); else p.stam=Math.min(1,p.stam+dt/7); p.boostOn=false; }
        else { boost=running&&I.n&&p.nitro>.02&&gas; if(boost){ if(!p.boostOn) sfx('boost'); p.nitro=Math.max(0,p.nitro-dt/3); } else p.nitro=Math.min(1,p.nitro+dt/14); p.boostOn=boost; if(boost&&R()<.6) FX.push({k:'flame',x:v.x-Math.cos(v.a)*v.L/2,y:v.y-Math.sin(v.a)*v.L/2,vx:-Math.cos(v.a)*60,vy:-Math.sin(v.a)*60,l:.25,L:.25,s:4}); }
        const grip=TH.grip*(v.ty==='scooter'||bike?10:8.5);
        if(tank) driveTank(v,running?-I.dy:0,running?I.dx:0,boost,dt,grip); else drive(v,ta,running?null:0,boost,dt,grip);
        if(WX.storm&&running){ const g=WX.storm*(.45+.55*Math.sin(t*.9))*(v.ty==='scooter'||bike?60:16); v.vx+=g*dt*.8; v.vy+=g*dt*.3; }
        if(v.surf<.9&&vspeed(v)>80&&onWalk(v.x,v.y)) hint(p,'walk','開上人行道會變慢，也很危險喔');
        if(v.hp<=0&&p.wreckT<=0){ p.wreckT=2.6; p.wrecks++; M.time-=6; sfx('hurt'); toast(p,'車子拋錨了！-6 秒'); for(let k=0;k<14;k++) FX.push({k:'smoke',x:v.x,y:v.y,vx:(R()-.5)*40,vy:(R()-.5)*40,l:2,L:2,s:10,col:'70,70,70'}); hint(p,'swap','車子撐不住時，按 '+KN[Math.min(p.i,KN.length-1)].f+' 下車，換一台車繼續開',[KN[Math.min(p.i,KN.length-1)].f]); }
        } if(v.hp<35&&R()<.3) FX.push({k:'smoke',x:v.x+Math.cos(v.a)*v.L*.35,y:v.y+Math.sin(v.a)*v.L*.35,vx:(R()-.5)*20,vy:(R()-.5)*20-10,l:1.2,L:1.2,s:5,col:v.hp<15?'60,60,60':'170,170,170'});
        /* 測速、闖紅燈（緊急任務不算） */
        if(running&&!v.siren&&(ST.type==='run'||ST.type==='taxi'||ST.type==='park')){ const kmh=vspeed(v)*KMH; for(const cm of Wd.cams){ const d=Math.hypot(cm.x-v.x,cm.y-v.y); if(d<240) hint(p,'cam','前面有測速照相，這段限速 60 公里'); if(d<40&&kmh>62&&t-p.spdT>4){ p.spdT=t; tix++; flash=.25; M.time-=2; sfx('click'); toast(p,'測速照相！超速 '+Math.round(kmh)+' 公里，罰單 +1（-2 秒）'); } }
          const hk=onH(v.y),vk=onV(v.x); if(hk>=0&&vk>=0&&!p.inI){ const hmv=Math.abs(Math.cos(v.a))>.7; if(lightOf(vk,hk,hmv,t)==='r'&&vspeed(v)>60&&t-p.lastRed>3){ p.lastRed=t; if(hash(vk,hk,11)<.25){ tix++; flash=.25; M.time-=2; toast(p,'闖紅燈被拍到了！罰單 +1（-2 秒）'); } else hint(p,'red','紅燈要停喔！有些路口有照相機會開罰單'); for(const q of PD) if(Math.hypot(q.x-v.x,q.y-v.y)<160&&R()<.5){ say(q,pick(R,['紅燈啦！','闖紅燈喔！','很危險耶！'])); break; } } } p.inI=hk>=0&&vk>=0; }
        if(running&&!v.siren&&!M.noWanted){ const kmh=vspeed(v)*KMH,cop=nearCop(v.x,v.y,280); if(cop&&kmh>78&&t-p.spdCop>5&&WT.lv<1){ p.spdCop=t; crime(p,1,'在警察面前超速'); /* 已經在被追的時候超速不再加星 */ say(cop,'前面的車，慢下來！靠邊停！'); }
          const hk=onH(v.y),vk=onV(v.x),inI=hk>=0&&vk>=0; if(inI&&!p.inI2&&vspeed(v)>60){ const hmv=Math.abs(Math.cos(v.a))>.7; if(lightOf(vk,hk,hmv,t)==='r'){ const c2=nearCop(v.x,v.y,650); if(c2){ if(WT.lv<1) crime(p,1,'闖紅燈被警察看到'); say(c2,'闖紅燈！停車！'); } /* 逃跑中闖紅燈只加一點點 */ else crime(p,.25,'闖紅燈'); } } p.inI2=inI; }
      } else if(p.foot){ const f=p.foot; let sp=0; let tvx=0,tvy=0; f.tr=(f.tr||0)+(((running&&tank)?I.dx:0)-(f.tr||0))*Math.min(1,dt*10); /* 轉身、起步、停下都平滑 */
        if(running&&tank&&(I.dx||I.dy||Math.abs(f.tr)>.02)){ f.a+=f.tr*3.0*dt; if(I.dy){ const run=I.n&&p.stam>.05&&I.dy<0,dir=I.dy<0?1:-1; sp=(run?150:95)*(dir>0?1:.55); if(run) p.stam=Math.max(0,p.stam-dt/4); tvx=Math.cos(f.a)*sp*dir; tvy=Math.sin(f.a)*sp*dir; f.run=run; } }
        else if(running&&(I.dx||I.dy)){ const run=I.n&&p.stam>.05; sp=run?150:95; if(run) p.stam=Math.max(0,p.stam-dt/4); const l=Math.hypot(I.dx,I.dy),ta=Math.atan2(I.dy,I.dx),da=Math.atan2(Math.sin(ta-f.a),Math.cos(ta-f.a)); f.a+=da*Math.min(1,dt*12); tvx=I.dx/l*sp; tvy=I.dy/l*sp; f.run=run; }
        { const k=Math.min(1,dt*((tvx||tvy)?9:12)); f.vx+=(tvx-f.vx)*k; f.vy+=(tvy-f.vy)*k; const cur=Math.hypot(f.vx,f.vy); f.ph+=dt*(cur>3?cur*.22:3); } if(!(I.n&&sp)) p.stam=Math.min(1,p.stam+dt/6); f.x+=f.vx*dt; f.y+=f.vy*dt; const pp=staticPush(f.x,f.y,5); if(pp){ f.x+=pp[0]; f.y+=pp[1]; }
        for(const v of V){ const d=Math.hypot(v.x-f.x,v.y-f.y); if(d<v.L*.45+6){ const a=Math.atan2(f.y-v.y,f.x-v.x); f.x=v.x+Math.cos(a)*(v.L*.45+6); f.y=v.y+Math.sin(a)*(v.L*.45+6); } if(d<54&&v.drv<0&&v.role!=='wreck') hint(p,'board','按 '+KN[Math.min(p.i,KN.length-1)].f+' 上車；停著的車、路上的車都能搶來開',[KN[Math.min(p.i,KN.length-1)].f]); } footHints(p); }
      const o=me(p),z0=local2?.86:1.1,sp=o.ty?vspeed(o):0,tz=p.foot?z0*1.2:z0*(1-Math.min(.28,sp/1600)); p.cam.z+=(tz-p.cam.z)*Math.min(1,dt*1.6); const lx=o.ty?clamp(o.vx*.42,-170,170):0,ly=o.ty?clamp(o.vy*.42,-110,110):0; p.cam.x+=(o.x+lx-p.cam.x)*Math.min(1,dt*3.2); p.cam.y+=(o.y+ly-p.cam.y)*Math.min(1,dt*3.2); }
    /* 引擎聲 */
    if(osc){ const v=PL[0].car,s=v?vspeed(v):0; osc.frequency.value=v?48+s*.42+(PL[0].boostOn?30:0):30; eg.gain.value=v?.018:.0; }
    /* 其他車 */
    for(const v of V){ if(v.drv>=0) continue; v.surf=surfAt(v.x,v.y); if(v.role==='racer'||v.role==='tailed'){ if(!running) drive(v,null,0,false,dt,8); continue; } if(v.role==='cop'){ copAI(v,dt); continue; } if(v.role==='leave'){ drive(v,v.a,170,false,dt,8); continue; } if(v.role==='block'){ drive(v,null,0,false,dt,14); continue; } if(v.role==='traffic') trafficAI(v,dt); else if(v.role==='suspect'){ if(running) fleeAI(v,dt); else drive(v,v.a,200,false,dt,8); } else if(v.role==='chaser'){ if(v.hp<=0) drive(v,null,0,false,dt,6); } else drive(v,null,0,false,dt,v.role==='parked'||v.role==='wreck'||v.role==='traffic_dead'?14:8); }
    if(M.upd&&running) M.upd(dt);
    /* 碰撞 */
    for(const v of V){ const r=collideStatic(v); if(r.imp>0){ damage(v,r.imp,false); if(v.drv>=0){ if(r.imp>200) sfx('boom'); else if(r.imp>60) sfx('bump'); if(r.parked&&r.imp>60){ say(r.parked,pick(R,['（警報器）嗶嗶嗶嗶——','我的車！'])); } } } }
    for(let a=0;a<V.length;a++) for(let b=a+1;b<V.length;b++){ const u=V[a],w=V[b],dx=w.x-u.x,dy=w.y-u.y,rr2=(u.L+w.L)/2+4; if(dx*dx+dy*dy>rr2*rr2) continue;
      for(const c1 of circlesOf(u)) for(const c2 of circlesOf(w)){ const ex=c2[0]-c1[0],ey=c2[1]-c1[1],d=Math.hypot(ex,ey),rs=c1[2]+c2[2]; if(d>=rs||d<1e-6) continue; const nx=ex/d,ny=ey/d,pen=rs-d,mu=1/u.m,mw=1/w.m,mt=mu+mw; u.x-=nx*pen*mu/mt; u.y-=ny*pen*mu/mt; w.x+=nx*pen*mw/mt; w.y+=ny*pen*mw/mt; const vn=(w.vx-u.vx)*nx+(w.vy-u.vy)*ny; if(vn<0){ const j=-1.25*vn/mt; u.vx-=j*mu*nx; u.vy-=j*mu*ny; w.vx+=j*mw*nx; w.vy+=j*mw*ny; const imp=-vn;
        if(imp>40){ const pv=u.drv>=0?u:w.drv>=0?w:null,ov=pv===u?w:u; damage(u,imp*(w.m/(u.m+w.m))*2,pv===w); damage(w,imp*(u.m/(u.m+w.m))*2,pv===u); if(pv){ if(imp>200) sfx('boom'); else sfx('bump'); if(ov.role==='traffic'&&imp>70&&R()<.8) say(ov,pick(R,['會不會開車啊！','我的車！你要賠喔！','叭叭叭——！','你給我停下來！','靠夭喔！'])); if(ov.role==='traffic') hint(PL[pv.drv],'crash','撞到別人的車會讓自己的車受損，車況在左下角'); if(!pv.siren&&!M.noWanted&&!(WT.ramT>t)){ const ddx=ov.x-pv.x,ddy=ov.y-pv.y,dd=Math.hypot(ddx,ddy)||1,pR=((pv.vx||0)*ddx+(pv.vy||0)*ddy)/dd,oR=-((ov.vx||0)*ddx+(ov.vy||0)*ddy)/dd; /* 誰撞誰：被警車從後面撞不算你的錯 */
          if((ov.role==='cop'||ov.role==='block'||ov.patrol)&&imp>60&&pR>oR+60){ WT.ramT=t+4; crime(PL[pv.drv],ov.role==='cop'&&WT.lv>=1?.3:1,'撞警車'); } else if((ov.role==='traffic'||ov.role==='parked')&&imp>140&&pR>oR){ WT.ramT=t+3; crime(PL[pv.drv],WT.lv>=1?.15:nearCop(pv.x,pv.y,600)?.5:.25,'肇事'); } } } for(let k=0;k<Math.min(8,imp/30);k++) FX.push({k:'spark',x:(c1[0]+c2[0])/2,y:(c1[1]+c2[1])/2,vx:(R()-.5)*200,vy:(R()-.5)*200,l:.3,L:.3}); } } } }
    /* 行人 */
    for(const q of PD){ if(q.st==='down'){ q.downT-=dt; if(q.downT<=0){ q.st='flee'; q.a=R()*TAU; } continue; }
      for(const v of V){ if(v.ty==='bike'||vspeed(v)<230) continue; if(Math.hypot(q.x-v.x,q.y-v.y)<v.L*.42+5){ knock(q,v); break; } } if(q.st==='down') continue;
      if(q.st==='jay'){ const dx=q.tx-q.x,dy=q.ty-q.y,d=Math.hypot(dx,dy); q.a=Math.atan2(dy,dx); q.ph+=dt*9; if(d<2) q.gone=1; else { q.x+=dx/d*q.sp*dt; q.y+=dy/d*q.sp*dt; } }
      else if(q.st==='flee'){ q.x+=Math.cos(q.a)*40*dt; q.y+=Math.sin(q.a)*40*dt; q.ph+=dt*10; const pp=staticPush(q.x,q.y,4); if(pp){ q.x+=pp[0]; q.y+=pp[1]; q.a+=1; } }
      else stepPed(q,dt);
      if(q.dodge<=0) for(const v of V){ const dx=q.x-v.x,dy=q.y-v.y,d=Math.hypot(dx,dy),sp=vspeed(v); if(d<v.L*.5+18&&sp>40){ const ca=Math.cos(v.a),sa=Math.sin(v.a),lat=-dx*sa+dy*ca,s=lat>=0?1:-1; q.dodge=.45; q.dx=-sa*s*130; q.dy=ca*s*130; if(v.drv>=0&&R()<.5){ say(q,pick(R,['哇！差點被撞到！','很危險耶！','你怎麼開車的！','人行道不能開車啦！'])); if(q.jay) hint(PL[v.drv],'jay','小心突然衝出來的行人！'); } break; } } }
    for(let i=PD.length-1;i>=0;i--){ const q=PD[i],far=PL.every(p=>Math.hypot(me(p).x-q.x,me(p).y-q.y)>1200); if(q.gone||far) PD.splice(i,1); }
    while(PD.length<(np>1?44:34)&&!prev||PD.length<20){ if(!spawnPed(me(PL[Math.floor(R()*np)]),true)) break; }
    /* 路人自言自語 */
    chatT-=dt; if(chatT<=0){ chatT=4+R()*5; const p=me(PL[Math.floor(R()*np)]),cand=PD.filter(q=>Math.hypot(q.x-p.x,q.y-p.y)<300&&q.st!=='jay'); if(cand.length){ const q=pick(R,cand); say(q,pick(R,TH.rain?['雨好大喔…','鞋子都濕了','早知道帶雨衣','這雨什麼時候停啊']:ST.th===3?['好餓，去吃宵夜','夜市還開著嗎？','好晚了快回家','明天還要上班…']:['今天好熱喔','中午吃什麼？','等一下去買飲料','喂？我快到了啦','這家好像很好吃','垃圾車幾點來？','公車怎麼還沒來','要不要去夜市？']),2.6,'#e8f0ff'); } }
    /* 車流補充、移除 */
    for(let i=V.length-1;i>=0;i--){ const v=V[i]; if(v.drv>=0||v.role==='suspect'||v.role==='chaser'||v.role==='wreck'||v.role==='racer'||v.role==='tailed'||v.keep) continue; const far=PL.every(p=>Math.hypot(me(p).x-v.x,me(p).y-v.y)>(v.role==='parked'?2400:1350)); if(far||v.x<LO-200||v.y<LO-200||v.x>HI+200||v.y>HI+200) V.splice(i,1); }
    const nT=V.filter(v=>v.role==='traffic').length; if(nT<(np>1?36:28)) spawnTraffic(true);
    /* 事件 */
    if(running&&ST.type!=='park'){ evT-=dt; if(evT<=0){ evT=10+R()*10; if(EV.filter(e=>!e.keep).length<4) spawnEvent(); } }
    for(let i=EV.length-1;i>=0;i--){ const e=EV[i]; if(e.life!=null){ e.life-=dt; } if(e.ped&&e.k==='dpark'&&!e.said&&PL.some(p=>Math.hypot(me(p).x-e.x,me(p).y-e.y)<200)){ e.said=1; say(e.ped,pick(R,['我買個東西馬上好！','停一下下而已啦！'])); PL.forEach(p=>hint(p,'dpark','前面有人並排違停，換到旁邊車道')); } if(e.k==='works'&&PL.some(p=>Math.hypot(me(p).x-e.x,me(p).y-e.y)<300)) PL.forEach(p=>hint(p,'works','前方道路施工，換到旁邊車道')); if(e.k==='garbage'&&!e.said&&PL.some(p=>Math.hypot(me(p).x-e.x,me(p).y-e.y)<260)){ e.said=1; say(e.peds[0],'垃圾車來囉！快點快點！'); }
      if(e.k==='garbage'&&R()<dt*3) FX.push({k:'note',x:e.x+(R()-.5)*30,y:e.y+(R()-.5)*20,vx:(R()-.5)*20,vy:-30,l:1.4,L:1.4});
      for(const q of (e.cones||[])) if(q.vx){ q[0]+=q.vx*dt; q.vx*=.9; }
      const far=PL.every(p=>Math.hypot(me(p).x-e.x,me(p).y-e.y)>1500); if((far&&!e.keep)||e.done&&far||(e.life!=null&&e.life<=0)){ if(e.car&&e.k!=='amb'){ if(e.k==='garbage'){ e.car.role='traffic'; e.car.haz=false; e.car.rd={h:onH(e.car.y)>=0,k:onH(e.car.y)>=0?onH(e.car.y):onV(e.car.x),s:Math.round(Math.cos(e.car.a))||Math.round(Math.sin(e.car.a)),off:56}; e.car.cruise=110; } else { const ix=V.indexOf(e.car); if(ix>=0&&e.car.drv<0) V.splice(ix,1); } } EV.splice(i,1); } }
    /* 特效 */
    for(let i=FX.length-1;i>=0;i--){ const f=FX[i]; f.l-=dt; if(f.l<=0){ FX.splice(i,1); continue; } f.x+=f.vx*dt; f.y+=f.vy*dt; f.vx*=.96; f.vy*=.96; } if(FX.length>400) FX.splice(0,FX.length-400);
    if(running){ M.time-=dt; if(M.time<=0){ M.time=0; fail('時間到了'); } }
    if(over){ over.T-=dt; if(over.T<=0&&!ended){ ended=true; finish(); } } }
  /* 示範駕駛（預覽畫面、測試用） */
  const botIn=p=>Object.assign(botIn0(p),{abs:true});
  function botIn0(p){ const o=me(p); if(!o||!o.ty) return {dx:0,dy:0,n:false,f:p.foot?true:false}; const tg=M.target?M.target():null; if(!tg) return {dx:0,dy:0}; const n=navTo(o,tg.x,tg.y,30); let a=n.ta; const d=Math.hypot(tg.x-o.x,tg.y-o.y); if(ST.type==='catch'||ST.type==='escape'){ if(ST.type==='catch'&&d<280) a=Math.atan2(tg.y+(tg.vy||0)*.25-o.y,tg.x+(tg.vx||0)*.25-o.x); return {dx:Math.cos(a),dy:Math.sin(a),n:d>300||ST.type==='escape',f:false}; } if(ST.type==='race') return {dx:Math.cos(a),dy:Math.sin(a),n:true,f:false}; if(d<70&&vspeed(o)<30) return {dx:0,dy:0}; if(d<200&&vspeed(o)>Math.max(40,d*1.2)) return {dx:-Math.cos(o.a),dy:-Math.sin(o.a)}; return {dx:Math.cos(a)*1.0001,dy:Math.sin(a),n:false,f:false,raw:1}; }
  const keyIn0=keyIn;
  function finish(){ const st=over.win?1+(PL.every(p=>p.wrecks===0)?1:0)+(M.time/Math.max(1,M.total)>=.25?1:0):0; const score=over.win?Math.max(1,Math.round(1000+M.time*12-tix*150-PL.reduce((a,p)=>a+p.wrecks,0)*120)):0; if(over.win&&!opts.preview) setR(si,st);
    const html='<table class="ls"><tr><td>剩下時間</td><td>'+Math.ceil(M.time)+' 秒</td></tr><tr><td>罰單</td><td>'+tix+' 張</td></tr><tr><td>拋錨</td><td>'+PL.reduce((a,p)=>a+p.wrecks,0)+' 次</td></tr>'+(over.win?'<tr><td>評價</td><td>'+'★'.repeat(st)+'☆'.repeat(3-st)+'</td></tr>':'')+'</table>';
    env.end({title:over.win?TN[ST.type]+' 完成！':'任務失敗',big:over.win?'★'.repeat(st)+'☆'.repeat(3-st):over.why||'失敗',html,text:ST.n+'　'+(over.win?score+' 分':''),score:over.win&&!opts.preview?score:null,next:over.win&&si<NST-1}); }
  function update(dt){ if(ended) return; if(env.hit&&env.hit('KeyV')&&!prev){ VIEW=G3&&!G3fail?(VIEW==='3d'?'high':VIEW==='high'?'2d':'3d'):'2d'; PL.forEach(p=>toast(p,VIEW==='3d'?'視角：3D 追車（↑油門 ←→方向盤）':VIEW==='high'?'視角：3D 高空（往畫面方向開）':'視角：俯視（往畫面方向開）')); } dt=Math.min(dt,.05); acc+=dt; while(acc>=1/60){ acc-=1/60; step(1/60); if(ended) break; } }
  /* ---------- 畫面 ---------- */
  function draw(){ if(G3&&!G3fail&&VIEW!=='2d'){ try{ draw3D(); return; }catch(e){ console.error(e); G3fail=true; VIEW='2d'; } } draw2D(); }
  function envNow(){ return {dark:ST.th===3?1:0,dusk:ST.th===1?1:0,rain:WX.rain,fog:Math.max(WX.fog,ST.th===2&&WX.rain<.2?.22:0),flash:WX.flash,storm:WX.storm}; }
  function draw3D(){ const LAG=prev||over||cd>0?0:Math.min(.02,Math.max(0,window.__arcadeLag||0)),vs=local2?[{x:0,y:0,w:W/2-2,h:H,p:PL[0]},{x:W/2+2,y:0,w:W/2-2,h:H,p:PL[1]}]:[{x:0,y:0,w:W,h:H,p:PL[0]}],cones=[],route=[];
    for(const e of EV) if(e.cones) for(const q of e.cones) cones.push(q);
    for(const p of PL){ if(p.mrt) continue; const r2=p.route||[]; for(let k=1;k<r2.length&&k<44;k++) route.push(r2[k]); }
    const st={t,env:envNow(),V,parked:parkedList(vs),people:people(),markers:M.markers?M.markers():[],route,cones,FX,heli:WT.heli,parkVer,shake:Math.min(shake,6),
      lag:LAG,views:vs.map(v=>{ const o=me(v.p),car=!!o.ty; return {vx:v.x,vw:v.w,key:v.p.i,mode:VIEW==='high'?'high':'chase',focus:{x:o.x+(o.vx||0)*LAG,y:o.y+(o.vy||0)*LAG,a:o.a||0,car,sp:car?Math.abs(o.vf||0):0,rev:car&&o.vf<-5,big:o.ty==='bus'||o.ty==='garbage'||o.ty==='truck'||o.ty==='amb'}}; })};
    G3.render(st); c.fillStyle='#111'; c.fillRect(0,0,W,H); c.drawImage(G3.canvas,0,0,G3.canvas.width,G3.canvas.height,0,0,W,H);
    vs.forEach((vw,i)=>{ c.save(); c.beginPath(); c.rect(vw.x,0,vw.w,H); c.clip();
      const pr=(x,y,h)=>{ const q=G3.project(x,y,h,i); return q?[vw.x+q[0]*vw.w,q[1]*H]:null; };
      for(const m of st.markers){ if(!m.txt) continue; const q=pr(m.x,m.y,m.k==='zone'?96:m.k==='tag'?(m.h||34)+24:44); if(!q||q[0]<vw.x-40||q[0]>vw.x+vw.w+40) continue; c.font='900 13px '+TC; const w2=c.measureText(m.txt).width+14; c.fillStyle=m.red?'rgba(180,20,30,.92)':m.green?'rgba(20,110,50,.92)':'rgba(20,20,30,.85)'; rr(c,q[0]-w2/2,q[1]-22,w2,22,6); c.fill(); c.fillStyle=m.red||m.green?'#fff':'#ffd23f'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(m.txt,q[0],q[1]-10);
        if(m.k==='tag'&&M.bar&&M.bar()!=null&&m.txt==='嫌犯'){ c.fillStyle='rgba(0,0,0,.6)'; c.fillRect(q[0]-22,q[1]+2,44,6); c.fillStyle='#ff4040'; c.fillRect(q[0]-21,q[1]+3,42*M.bar(),4); } }
      for(const b of BUB){ const o=b.o; if(!o) continue; const q=pr(o.x,o.y,o.ty?32:24); if(!q||q[0]<vw.x-60||q[0]>vw.x+vw.w+60||q[1]<-40||q[1]>H+40) continue; bubble(q[0],q[1]-4,b.txt,Math.min(1,b.t*3,(b.T-b.t)*6),b.col); }
      // 指北針式的目標方向
      const tg=M.target&&M.target(),p=vw.p,o=me(p); if(tg&&!over&&!p.mrt){ const d=Math.hypot(tg.x-o.x,tg.y-o.y),ya=VIEW==='high'?-PI/2:G3.yaw(p.i),rel=Math.atan2(tg.y-o.y,tg.x-o.x)-ya,cx2=vw.x+vw.w/2,cy2=local2?118:64; c.save(); c.translate(cx2,cy2); c.rotate(rel); c.fillStyle='rgba(60,230,120,.95)'; c.strokeStyle='rgba(0,40,10,.8)'; c.lineWidth=2; c.beginPath(); c.moveTo(0,-16); c.lineTo(11,8); c.lineTo(0,3); c.lineTo(-11,8); c.closePath(); c.fill(); c.stroke(); c.restore(); c.font='800 11px '+TC; c.textAlign='center'; c.lineWidth=3; c.strokeStyle='rgba(0,0,0,.7)'; const tx=Math.round(d/10)+' 公尺'; c.strokeText(tx,cx2,cy2+24); c.fillStyle='#fff'; c.fillText(tx,cx2,cy2+24); }
      if(flash>0){ c.fillStyle='rgba(255,255,255,'+Math.min(.6,flash*2)+')'; c.fillRect(vw.x,0,vw.w,H); }
      c.restore(); hud(vw,vw.p); });
    if(local2){ c.fillStyle='#0b0a1c'; c.fillRect(W/2-2,0,4,H); } drawShared(); }
  function draw2D(){ c.fillStyle='#111'; c.fillRect(0,0,W,H); const views=local2?[{x:0,y:0,w:W/2-2,h:H,p:PL[0]},{x:W/2+2,y:0,w:W/2-2,h:H,p:PL[1]}]:[{x:0,y:0,w:W,h:H,p:PL[0]}];
    for(const vw of views) drawView(vw); if(local2){ c.fillStyle='#0b0a1c'; c.fillRect(W/2-2,0,4,H); }
    drawShared(); }
  function drawView(vw){ const p=vw.p,cam=p.cam,z=cam.z; let sx=0,sy=0; if(shake>0){ sx=(R()-.5)*shake; sy=(R()-.5)*shake; }
    const cx=cam.x+sx/z,cy=cam.y+sy/z,hw=vw.w/2/z,hh=vw.h/2/z,L=cx-hw,Rr=cx+hw,T=cy-hh,B=cy+hh;
    c.save(); c.beginPath(); c.rect(vw.x,vw.y,vw.w,vw.h); c.clip(); c.translate(vw.x+vw.w/2,vw.y+vw.h/2); c.scale(z,z); c.translate(-cx,-cy);
    for(let ci=Math.floor(L/P);ci<=Math.floor(Rr/P);ci++) for(let cj=Math.floor(T/P);cj<=Math.floor(B/P);cj++){ if(ci<-2||cj<-2||ci>NB+1||cj>NB+1){ c.fillStyle='#2c5a72'; c.fillRect(ci*P,cj*P,P,P); continue; } c.drawImage(tile(Wd,ci,cj,TH.rain),ci*P-.3,cj*P-.3,P+.6,P+.6); }
    /* 煞車痕 */
    c.strokeStyle='rgba(12,12,14,.32)'; c.lineWidth=2.4; c.beginPath(); for(const s of SK){ if(s[0]<L-20||s[0]>Rr+20||s[1]<T-20||s[1]>B+20) continue; c.moveTo(s[0],s[1]); c.lineTo(s[2],s[3]); } c.stroke();
    /* 路燈底座、號誌桿、停著的車 */
    const blks=[]; for(const b of Wd.B) if(b.x1>L-160&&b.x0<Rr+160&&b.y1>T-160&&b.y0<B+160) blks.push(b);
    for(const b of blks) for(const q of b.parked){ if(q.taken) continue; drawCar(q,0); }
    for(const b of blks){ for(const q of (b.bikes||[])){ if(q.taken) continue; c.save(); c.translate(q.x,q.y); c.rotate(q.a); drawBike(c,'#f0a020',null,false); c.restore(); }
      if(b.mrt){ const [x0,y0,x1,y1]=b.mrt.rect; c.fillStyle='rgba(0,0,0,.3)'; c.fillRect(x0+3,y0+4,x1-x0,y1-y0); c.fillStyle='#dfe6ee'; c.fillRect(x0,y0,x1-x0,y1-y0); c.fillStyle='#1d6ab8'; c.fillRect(x0,y0,x1-x0,4); c.fillStyle='#1a1a1e'; c.fillRect(x0+4,y0+6,x1-x0-8,y1-y0-8); c.fillStyle='#1d6ab8'; c.beginPath(); c.arc(x1+5,y0-2,6,0,TAU); c.fill(); c.fillStyle='#fff'; c.font='900 7px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('捷',x1+5,y0-1.6); } }
    drawMarkers(p,'ground');
    for(const e of EV){ if(e.k==='works'){ c.fillStyle='rgba(210,130,40,.25)'; for(const q of e.cones){ c.beginPath(); c.arc(q[0],q[1],9,0,TAU); c.fill(); } } }
    /* 行人 */
    for(const q of PD){ if(q.x<L-20||q.x>Rr+20||q.y<T-20||q.y>B+20) continue; drawPerson(c,q.x,q.y,q.a,q.lk,q.ph,{umb:q.umb&&TH.rain&&q.st!=='down',phone:q.phone,bag:q.bag,run:q.st==='flee'||q.jay,lying:q.st==='down'}); }
    for(const e of EV){ if(e.worker) drawPerson(c,e.worker.x,e.worker.y,e.worker.a,e.worker.lk,t*2,{}); if(e.ped&&e.k==='dpark') drawPerson(c,e.ped.x,e.ped.y,e.ped.a,e.ped.lk,0,{phone:1}); if(e.peds) for(const q of e.peds) drawPerson(c,q.x,q.y,q.a,q.lk,0,{bag:q.bag}); }
    const sc=M.scene&&M.scene(); if(sc){ if(sc.vic) drawPerson(c,sc.vic.x,sc.vic.y,sc.vic.a,sc.vic.lk,0,{lying:1}); drawPerson(c,sc.cop.x,sc.cop.y,sc.cop.a,sc.cop.lk,t*1.5,{wave:Math.sin(t*5)>0}); }
    const sus=M.susp&&M.susp(); if(sus) drawPerson(c,sus.x,sus.y,sus.a,sus.lk,sus.ph,{run:1});
    if(M.people) for(const q of M.people()) drawPerson(c,q.x,q.y,q.a,q.lk,q.ph,q.ex||{});
    for(const q of PL) if(q.foot){ const f=q.foot; c.strokeStyle=q.i===0?'#ffd23f':'#7ae8ff'; c.lineWidth=1.5/z; c.beginPath(); c.arc(f.x,f.y,10,0,TAU); c.stroke(); drawPerson(c,f.x,f.y,f.a,f.lk,f.ph,{run:f.run,umb:false}); }
    const pax=ST.type==='taxi'&&M.target&&M.target(); if(pax&&pax.lk&&pax.st!=='in') drawPerson(c,pax.x,pax.y,pax.a,pax.lk,pax.ph||0,{wave:pax.st==='stand'&&Math.sin(t*6)>-.3,umb:TH.rain});
    /* 車 */
    for(const v of V){ if(v.x<L-70||v.x>Rr+70||v.y<T-70||v.y>B+70) continue; drawCar(v,1); }
    for(const e of EV) if(e.cones) for(const q of e.cones) drawCone(q[0],q[1]);
    for(const e of EV) if(e.sign) drawSign(e.sign.x,e.sign.y);
    /* 樹、路燈、號誌 */
    for(const b of blks){ for(const tr of b.trees){ if(tr.x<L-40||tr.x>Rr+40||tr.y<T-40||tr.y>B+40) continue; const k=8*KL,x=tr.x+(tr.x-cx)*k,y=tr.y+(tr.y-cy)*k; c.globalAlpha=.25; c.fillStyle='#000'; c.beginPath(); c.arc(tr.x+5,tr.y+7,tr.r,0,TAU); c.fill(); c.globalAlpha=1; c.drawImage(canopy(tr.v),x-tr.r*1.25,y-tr.r*1.25,tr.r*2.5,tr.r*2.5); } }
    for(const b of blks) for(const lp of b.lamps){ const k=9*KL,x=lp.x+(lp.x-cx)*k,y=lp.y+(lp.y-cy)*k; c.strokeStyle='#4a4c50'; c.lineWidth=1.6; c.beginPath(); c.moveTo(x,y); c.lineTo(x-lp.ax*14,y-lp.ay*14); c.stroke(); c.fillStyle='#d8d8d0'; c.beginPath(); c.ellipse(x-lp.ax*15,y-lp.ay*15,lp.ax?3.4:2,lp.ay?3.4:2,0,0,TAU); c.fill(); }
    drawSignals(L,Rr,T,B,cx,cy,false);
    for(const cm of Wd.cams) if(cm.x>L-40&&cm.x<Rr+40&&cm.y>T-40&&cm.y<B+40) drawCam(cm,cx,cy);
    /* 大樓 */
    const bl=[]; for(const b of blks) for(const bd of b.blds) bl.push(bd); bl.sort((a,b)=>Math.hypot((b.x0+b.x1)/2-cx,(b.y0+b.y1)/2-cy)-Math.hypot((a.x0+a.x1)/2-cx,(a.y0+a.y1)/2-cy)); for(const bd of bl) drawBld(c,bd,cx,cy,TH.dark,false);
    /* 特效 */
    for(const f of FX){ const a=f.l/f.L; if(f.k==='smoke'){ c.fillStyle='rgba('+f.col+','+(a*.45)+')'; c.beginPath(); c.arc(f.x,f.y,f.s*(2-a),0,TAU); c.fill(); } else if(f.k==='spark'){ c.strokeStyle='rgba(255,220,120,'+a+')'; c.lineWidth=1.2; c.beginPath(); c.moveTo(f.x,f.y); c.lineTo(f.x-f.vx*.03,f.y-f.vy*.03); c.stroke(); } else if(f.k==='deb'){ c.save(); c.translate(f.x,f.y); c.rotate(f.r+t*8); c.fillStyle=f.col; c.globalAlpha=a; c.fillRect(-2,-1.5,4,3); c.restore(); c.globalAlpha=1; } else if(f.k==='flame'){ c.fillStyle='rgba(120,190,255,'+a+')'; c.beginPath(); c.arc(f.x,f.y,f.s*a+1,0,TAU); c.fill(); } else if(f.k==='note'){ c.fillStyle='rgba(255,230,120,'+a+')'; c.font='900 12px '+TC; c.textAlign='center'; c.fillText('♪',f.x,f.y); } }
    drawMarkers(p,'top');
    c.restore();
    /* 黑夜與燈光 */
    if(TH.dark>0) lighting(vw,cx,cy,z);
    if(TH.tint){ c.fillStyle=TH.tint; c.fillRect(vw.x,vw.y,vw.w,vw.h); }
    if(WX.fog>.05){ c.fillStyle='rgba(205,210,216,'+(WX.fog*.5)+')'; c.fillRect(vw.x,vw.y,vw.w,vw.h); }
    if(WT.heli){ const h=WT.heli,s0=[vw.x+vw.w/2+(h.tx-cx)*z,vw.y+vw.h/2+(h.ty-cy)*z],s1=[vw.x+vw.w/2+(h.x-cx)*z,vw.y+vw.h/2+(h.y-cy)*z]; c.save(); c.fillStyle='rgba(240,245,255,.16)'; c.beginPath(); c.arc(s0[0],s0[1],60*z,0,TAU); c.fill(); c.translate(s1[0],s1[1]); c.rotate(h.a); c.fillStyle='#f4f6f8'; rr(c,-14*z,-6*z,30*z,12*z,5*z); c.fill(); c.fillStyle='#1d4fa8'; c.fillRect(-34*z,-1.5*z,22*z,3*z); c.strokeStyle='rgba(30,30,30,.6)'; c.lineWidth=2; c.beginPath(); const ra=t*30; c.moveTo(Math.cos(ra)*40*z,Math.sin(ra)*40*z); c.lineTo(-Math.cos(ra)*40*z,-Math.sin(ra)*40*z); c.moveTo(Math.cos(ra+PI/2)*40*z,Math.sin(ra+PI/2)*40*z); c.lineTo(-Math.cos(ra+PI/2)*40*z,-Math.sin(ra+PI/2)*40*z); c.stroke(); c.restore(); }
    if(TH.rain) rain(vw);
    if(flash>0){ c.fillStyle='rgba(255,255,255,'+flash*2+')'; c.fillRect(vw.x,vw.y,vw.w,vw.h); }
    /* 泡泡、導航 */
    c.save(); c.beginPath(); c.rect(vw.x,vw.y,vw.w,vw.h); c.clip(); const toS=(x,y)=>[vw.x+vw.w/2+(x-cx)*z,vw.y+vw.h/2+(y-cy)*z];
    navArrow(vw,p,toS,cx,cy,z);
    for(const b of BUB){ const o=b.o; if(!o) continue; const s=toS(o.x,o.y); if(s[0]<vw.x-60||s[0]>vw.x+vw.w+60||s[1]<vw.y-40||s[1]>vw.y+vw.h+40) continue; bubble(s[0],s[1]-18*z-6,b.txt,Math.min(1,b.t*3,(b.T-b.t)*6),b.col); }
    c.restore();
    hud(vw,p); }
  function drawCar(v,live){ c.save(); c.translate(v.x,v.y); c.rotate(v.a); c.fillStyle='rgba(0,0,0,.3)'; rr(c,-v.L/2+2.5,-v.Wd/2+3.5,v.L,v.Wd,5); c.fill(); const L=VT[v.ty].L,Wd2=VT[v.ty].W; c.drawImage(carSpr(v.ty,v.col,v.var_),-(L+10)/2,-(Wd2+10)/2,L+10,Wd2+10);
    if(live){ if(v.hp<60){ c.fillStyle='rgba(30,30,30,'+((60-v.hp)/100)+')'; c.beginPath(); c.arc(v.L*.3,-2,4,0,TAU); c.arc(-v.L*.2,3,3,0,TAU); c.fill(); }
      if(v.brake){ c.fillStyle='rgba(255,40,40,.9)'; c.fillRect(-v.L/2-.5,-v.Wd/2+1.2,2,4.4); c.fillRect(-v.L/2-.5,v.Wd/2-5.6,2,4.4); }
      if(v.haz&&Math.sin(t*9)>0){ c.fillStyle='#ffa31a'; for(const [x,y] of [[v.L/2-1,-v.Wd/2+1],[v.L/2-1,v.Wd/2-2],[-v.L/2,-v.Wd/2+.5],[-v.L/2,v.Wd/2-1.5]]) c.fillRect(x-1,y-.5,2.4,2); }
      if(v.siren||v.ty==='police'&&v.drv>=0){ const on=Math.sin(t*14)>0,rx=v.ty==='amb'?v.L*.32:-v.L*.06; c.fillStyle=on?'#ff2a2a':'#5a1010'; c.fillRect(rx-2,-v.Wd/2+2.5,4,v.Wd/2-2.6); c.fillStyle=on?'#1a3a8a':'#2a7aff'; c.fillRect(rx-2,0,4,v.Wd/2-2.6); }
      if(v.drv>=0){ c.strokeStyle=v.drv===0?'rgba(255,210,63,.9)':'rgba(122,232,255,.9)'; c.lineWidth=1.2; c.setLineDash([4,3]); rr(c,-v.L/2-3,-v.Wd/2-3,v.L+6,v.Wd+6,6); c.stroke(); c.setLineDash([]); } }
    c.restore(); }
  function drawCone(x,y){ c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.arc(x+1.5,y+2,4.5,0,TAU); c.fill(); c.fillStyle='#ff6a12'; c.fillRect(x-4,y-4,8,8); const g=c.createRadialGradient(x-1,y-1,.5,x,y,3.6); g.addColorStop(0,'#ffb070'); g.addColorStop(1,'#e04a0a'); c.fillStyle=g; c.beginPath(); c.arc(x,y,3.6,0,TAU); c.fill(); c.strokeStyle='#fff'; c.lineWidth=1; c.beginPath(); c.arc(x,y,2.2,0,TAU); c.stroke(); }
  function drawSign(x,y){ c.save(); c.translate(x,y); c.fillStyle='rgba(0,0,0,.3)'; c.fillRect(-12,-3,26,9); c.fillStyle='#f2c21c'; c.fillRect(-13,-5,26,8); c.fillStyle='#111'; c.font='900 5.5px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('道路施工',0,-1); c.restore(); }
  function drawCam(cm,cx,cy){ const ox=cm.h?0:(cm.x>cx?1:-1)*0,x=cm.h?cm.x:cm.x+HR+4,y=cm.h?cm.y-HR-4:cm.y; c.fillStyle='#3a3c40'; c.fillRect(x-1.5,y-1.5,3,3); c.fillStyle='#d8d8d0'; c.fillRect(x-4,y-3,8,5); c.fillStyle='#111'; c.beginPath(); c.arc(x,y-.5,1.4,0,TAU); c.fill(); c.fillStyle='rgba(255,255,255,.85)'; c.beginPath(); c.arc(x+(cm.h?0:10),y+(cm.h?10:0),5,0,TAU); c.fill(); c.strokeStyle='#c8202a'; c.lineWidth=1.4; c.stroke(); c.fillStyle='#111'; c.font='900 5px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('60',x+(cm.h?0:10),y+(cm.h?10:0)); }
  function drawSignals(L,Rr,T,B,cx,cy,glow){ for(let ix=Math.max(0,Math.floor(L/P));ix<=Math.min(NB,Math.ceil(Rr/P));ix++) for(let iy=Math.max(0,Math.floor(T/P));iy<=Math.min(NB,Math.ceil(B/P));iy++){ const X=ix*P,Y=iy*P,hs=lightOf(ix,iy,true,t),vs=lightOf(ix,iy,false,t),col=s=>s==='g'?'#3aff6a':s==='y'?'#ffc21a':'#ff3a2a';
      for(const [px,py,ax,face] of [[X+HR+3,Y+HR+3,0,0],[X-HR-3,Y-HR-3,0,PI],[X-HR-3,Y+HR+3,1,PI/2],[X+HR+3,Y-HR-3,1,-PI/2]]){ const k=12*KL,x=px+(px-cx)*k,y=py+(py-cy)*k,st=ax?vs:hs;
        if(glow){ c.fillStyle=col(st); c.globalAlpha=.5; c.beginPath(); c.arc(x,y,6,0,TAU); c.fill(); c.globalAlpha=1; continue; }
        c.strokeStyle='#2a2c30'; c.lineWidth=1.6; c.beginPath(); c.moveTo(px,py); c.lineTo(x,y); c.stroke(); c.save(); c.translate(x,y); c.rotate(face); c.fillStyle='#1a1a1c'; rr(c,-3,-6.5,6,13,1.5); c.fill(); for(let q=0;q<3;q++){ const sc2=['r','y','g'][q]; c.fillStyle=st===sc2?col(sc2):'#3a3a3a'; c.beginPath(); c.arc(0,-4+q*4,1.5,0,TAU); c.fill(); } c.restore(); } } }
  function drawMarkers(p,layer){ const ms=M.markers?M.markers():[]; for(const m of ms){ if(layer==='ground'){ if(m.k==='zone'){ const pu=.5+.5*Math.sin(t*4); c.fillStyle='rgba(255,210,40,'+(.16+pu*.1)+')'; c.strokeStyle='rgba(255,210,40,.95)'; c.lineWidth=2.4; c.setLineDash([8,5]); c.lineDashOffset=-t*20; c.beginPath(); c.arc(m.x,m.y,48,0,TAU); c.fill(); c.stroke(); c.setLineDash([]); c.strokeStyle='rgba(255,210,40,'+(1-pu)+')'; c.lineWidth=2; c.beginPath(); c.arc(m.x,m.y,48+pu*20,0,TAU); c.stroke(); }
        else if(m.k==='ring'){ c.strokeStyle=m.red?'rgba(255,60,60,.9)':'rgba(80,255,120,.9)'; c.lineWidth=2.4; c.beginPath(); c.arc(m.x,m.y,22+Math.sin(t*6)*3,0,TAU); c.stroke(); }
        else if(m.k==='spot'){ c.save(); c.translate(m.x,m.y); c.rotate(m.a); c.fillStyle='rgba(255,210,40,'+(.18+(M.hold||0)*.4)+')'; c.fillRect(-m.l/2,-m.w/2,m.l,m.w); c.strokeStyle='#ffd23f'; c.lineWidth=2; c.strokeRect(-m.l/2,-m.w/2,m.l,m.w); c.fillStyle='rgba(255,210,40,.9)'; c.font='900 14px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('P',0,0); c.restore(); } }
      else { if(m.txt){ c.save(); c.translate(m.x,m.y-(m.k==='zone'?54:28)); const z=p.cam.z; c.scale(1/z,1/z); c.font='900 13px '+TC; const w=c.measureText(m.txt).width+14; c.fillStyle=m.red?'rgba(180,20,30,.92)':'rgba(20,20,30,.85)'; rr(c,-w/2,-11,w,22,6); c.fill(); c.fillStyle=m.red?'#fff':'#ffd23f'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(m.txt,0,1); c.beginPath(); c.moveTo(-5,11); c.lineTo(5,11); c.lineTo(0,17); c.fillStyle=m.red?'rgba(180,20,30,.92)':'rgba(20,20,30,.85)'; c.fill(); c.restore(); }
        if(m.k==='tag'&&M.bar&&M.bar()!=null&&m.txt==='嫌犯'){ c.save(); c.translate(m.x,m.y-16); const z=p.cam.z; c.scale(1/z,1/z); c.fillStyle='rgba(0,0,0,.6)'; c.fillRect(-22,-3,44,6); c.fillStyle='#ff4040'; c.fillRect(-21,-2,42*M.bar(),4); c.restore(); } } } }
  function navArrow(vw,p,toS,cx,cy,z){ const tg=M.target&&M.target(); if(!tg||over) return; const o=me(p); const n=o.ty?navTo(o,tg.x,tg.y,0):{ta:Math.atan2(tg.y-o.y,tg.x-o.x)}; const s=toS(o.x,o.y),d=Math.hypot(tg.x-o.x,tg.y-o.y);
    if(d>90){ const a=n.ta,r=(o.ty?o.L*.5:8)*z+22; c.save(); c.translate(s[0]+Math.cos(a)*r,s[1]+Math.sin(a)*r); c.rotate(a); c.fillStyle='rgba(60,230,120,.92)'; c.strokeStyle='rgba(0,40,10,.8)'; c.lineWidth=1.5; c.beginPath(); c.moveTo(12,0); c.lineTo(-4,-9); c.lineTo(-1,0); c.lineTo(-4,9); c.closePath(); c.fill(); c.stroke(); c.restore(); }
    const ts=toS(tg.x,tg.y); if(ts[0]<vw.x+10||ts[0]>vw.x+vw.w-10||ts[1]<vw.y+10||ts[1]>vw.y+vw.h-10){ const a=Math.atan2(ts[1]-s[1],ts[0]-s[0]),ex=clamp(ts[0],vw.x+26,vw.x+vw.w-26),ey=clamp(ts[1],vw.y+80,vw.y+vw.h-90); c.save(); c.translate(ex,ey); c.rotate(a); c.fillStyle='rgba(255,210,40,.95)'; c.beginPath(); c.moveTo(14,0); c.lineTo(-6,-10); c.lineTo(-6,10); c.closePath(); c.fill(); c.restore(); c.font='800 11px '+TC; c.fillStyle='#fff'; c.textAlign='center'; c.lineWidth=3; c.strokeStyle='rgba(0,0,0,.7)'; const tx=Math.round(d/10)+' 公尺'; c.strokeText(tx,ex-Math.cos(a)*22,ey-Math.sin(a)*22+4); c.fillText(tx,ex-Math.cos(a)*22,ey-Math.sin(a)*22+4); } }
  function bubble(x,y,txt,a,col){ c.save(); c.globalAlpha=clamp(a,0,1); c.font='800 12px '+TC; const lines=wrapTxt(c,txt,150),w=Math.min(166,Math.max(...lines.map(l=>c.measureText(l).width))+16),h=lines.length*16+10; c.fillStyle=col==='#fff'?'rgba(255,255,255,.96)':'rgba(232,240,255,.94)'; rr(c,x-w/2,y-h,w,h,8); c.fill(); c.beginPath(); c.moveTo(x-5,y); c.lineTo(x+5,y); c.lineTo(x,y+7); c.fill(); c.strokeStyle='rgba(0,0,0,.35)'; c.lineWidth=1; rr(c,x-w/2,y-h,w,h,8); c.stroke(); c.fillStyle='#1a1a22'; c.textAlign='center'; c.textBaseline='middle'; lines.forEach((l,i)=>c.fillText(l,x,y-h+13+i*16)); c.restore(); }
  function lighting(vw,cx,cy,z){ lc.setTransform(1,0,0,1,0,0); lc.globalCompositeOperation='source-over'; lc.clearRect(0,0,vw.w,vw.h); lc.fillStyle='rgba(6,10,26,'+TH.dark+')'; lc.fillRect(0,0,vw.w,vw.h); lc.globalCompositeOperation='destination-out'; lc.setTransform(z,0,0,z,vw.w/2-cx*z,vw.h/2-cy*z);
    const hw=vw.w/2/z,hh=vw.h/2/z,L=cx-hw-150,Rr=cx+hw+150,T=cy-hh-150,B=cy+hh+150;
    for(const b of Wd.B){ if(b.x1<L||b.x0>Rr||b.y1<T||b.y0>B) continue; for(const lp of b.lamps){ const x=lp.x-lp.ax*15,y=lp.y-lp.ay*15,g=lc.createRadialGradient(x,y,4,x,y,105); g.addColorStop(0,'rgba(0,0,0,.85)'); g.addColorStop(1,'rgba(0,0,0,0)'); lc.fillStyle=g; lc.fillRect(x-105,y-105,210,210); } }
    for(const v of V){ if(v.x<L||v.x>Rr||v.y<T||v.y>B||v.role==='parked'||v.role==='wreck') continue; const ca=Math.cos(v.a),sa=Math.sin(v.a),fx=v.x+ca*v.L/2,fy=v.y+sa*v.L/2,len=v.ty==='scooter'?120:200; const g=lc.createRadialGradient(fx,fy,4,fx,fy,len); g.addColorStop(0,'rgba(0,0,0,.95)'); g.addColorStop(1,'rgba(0,0,0,0)'); lc.fillStyle=g; lc.beginPath(); lc.moveTo(fx-sa*v.Wd*.4,fy+ca*v.Wd*.4); const sp=.42; lc.lineTo(fx+Math.cos(v.a-sp)*len,fy+Math.sin(v.a-sp)*len); lc.lineTo(fx+Math.cos(v.a+sp)*len,fy+Math.sin(v.a+sp)*len); lc.lineTo(fx+sa*v.Wd*.4,fy-ca*v.Wd*.4); lc.closePath(); lc.fill(); }
    for(const p of PL) if(p.foot){ const g=lc.createRadialGradient(p.foot.x,p.foot.y,2,p.foot.x,p.foot.y,60); g.addColorStop(0,'rgba(0,0,0,.6)'); g.addColorStop(1,'rgba(0,0,0,0)'); lc.fillStyle=g; lc.fillRect(p.foot.x-60,p.foot.y-60,120,120); }
    for(const m of (M.markers?M.markers():[])){ const g=lc.createRadialGradient(m.x,m.y,4,m.x,m.y,70); g.addColorStop(0,'rgba(0,0,0,.7)'); g.addColorStop(1,'rgba(0,0,0,0)'); lc.fillStyle=g; lc.fillRect(m.x-70,m.y-70,140,140); }
    lc.setTransform(1,0,0,1,0,0); lc.globalCompositeOperation='source-over'; c.drawImage(LCV,0,0,vw.w,vw.h,vw.x,vw.y,vw.w,vw.h);
    /* 發光：窗戶、招牌、車燈、號誌 */
    c.save(); c.beginPath(); c.rect(vw.x,vw.y,vw.w,vw.h); c.clip(); c.translate(vw.x+vw.w/2,vw.y+vw.h/2); c.scale(z,z); c.translate(-cx,-cy); c.globalCompositeOperation='lighter';
    for(const b of Wd.B){ if(b.x1<L||b.x0>Rr||b.y1<T||b.y0>B) continue; for(const bd of b.blds) drawBld(c,bd,cx,cy,TH.dark,true); }
    c.globalAlpha=.55; for(const v of V){ if(v.x<L||v.x>Rr||v.y<T||v.y>B) continue; const ca=Math.cos(v.a),sa=Math.sin(v.a); if(v.role!=='parked'&&v.role!=='wreck'){ c.fillStyle='rgba(255,40,30,'+(v.brake?.9:.45)+')'; const bx=v.x-ca*v.L/2,by=v.y-sa*v.L/2; c.beginPath(); c.arc(bx,by,v.brake?8:5,0,TAU); c.fill(); c.fillStyle='rgba(255,245,210,.6)'; const fx=v.x+ca*v.L/2,fy=v.y+sa*v.L/2; c.beginPath(); c.arc(fx,fy,6,0,TAU); c.fill(); }
      if(v.siren&&Math.sin(t*14)>0){ c.fillStyle='rgba(255,40,40,.7)'; c.beginPath(); c.arc(v.x,v.y,26,0,TAU); c.fill(); } else if(v.siren){ c.fillStyle='rgba(40,90,255,.7)'; c.beginPath(); c.arc(v.x,v.y,26,0,TAU); c.fill(); } if(v.haz&&Math.sin(t*9)>0){ c.fillStyle='rgba(255,160,30,.6)'; c.beginPath(); c.arc(v.x,v.y,14,0,TAU); c.fill(); } }
    c.globalAlpha=1; drawSignals(L,Rr,T,B,cx,cy,true); for(const b of Wd.B){ if(b.x1<L||b.x0>Rr||b.y1<T||b.y0>B) continue; for(const lp of b.lamps){ c.fillStyle='rgba(255,220,150,.5)'; c.beginPath(); c.arc(lp.x-lp.ax*15,lp.y-lp.ay*15,4,0,TAU); c.fill(); } }
    c.restore(); }
  function rain(vw){ c.save(); c.beginPath(); c.rect(vw.x,vw.y,vw.w,vw.h); c.clip(); c.strokeStyle='rgba(200,215,235,.35)'; c.lineWidth=1; c.beginPath(); for(let i=0;i<150;i++){ const x=vw.x+((hash(i,1,3)*vw.w+t*80)%vw.w),y=vw.y+((hash(i,2,3)*vw.h+t*(700+hash(i,3,3)*300))%vw.h); c.moveTo(x,y); c.lineTo(x-3,y-14); } c.stroke(); c.fillStyle='rgba(220,230,245,.35)'; for(let i=0;i<20;i++){ const ph=(t*2+hash(i,5,5))%1,x=vw.x+hash(i,6,Math.floor(t*2+hash(i,5,5)))*vw.w,y=vw.y+hash(i,7,Math.floor(t*2+hash(i,5,5)))*vw.h; c.beginPath(); c.ellipse(x,y,2+ph*5,1+ph*2,0,0,TAU); c.fill(); } c.restore(); }
  /* ---------- 畫面資訊 ---------- */
  function hud(vw,p){ const x0=vw.x,w=vw.w,o=me(p); c.textBaseline='middle';
    /* 速度表 */
    const by=H-14,rgt=local2&&p.i===1; if(rgt) { c.save(); c.translate(w-170,0); } c.fillStyle='rgba(10,12,20,.72)'; rr(c,x0+10,by-62,local2?150:170,62,10); c.fill();
    if(p.car){ const v=p.car,kmh=Math.round(vspeed(v)*KMH); c.font='900 28px '+TC; c.fillStyle='#fff'; c.textAlign='right'; c.fillText(kmh,x0+76,by-38); c.font='700 11px '+TC; c.fillStyle='#aab'; c.textAlign='left'; c.fillText('km/h',x0+80,by-32); c.fillStyle='#cfd'; c.fillText(VT[v.ty].n,x0+(local2?116:122),by-46);
      c.fillStyle='#333a48'; c.fillRect(x0+20,by-20,local2?60:70,5); c.fillStyle=p.nitro>.3?'#4ab8ff':'#2a6a9a'; c.fillRect(x0+20,by-20,(local2?60:70)*p.nitro,5); c.font='700 10px '+TC; c.fillStyle='#9ac'; c.fillText('氮氣',x0+20,by-8);
      const hx=x0+(local2?86:98); c.fillStyle='#333a48'; c.fillRect(hx,by-20,local2?60:70,5); c.fillStyle=v.hp>60?'#4ade70':v.hp>30?'#ffc21a':'#ff4a3a'; c.fillRect(hx,by-20,(local2?60:70)*v.hp/100,5); c.fillStyle='#9ac'; c.fillText('車況',hx,by-8); }
    else if(p.foot){ c.font='900 18px '+TC; c.fillStyle='#fff'; c.textAlign='left'; c.fillText('走路中',x0+22,by-40); c.fillStyle='#333a48'; c.fillRect(x0+20,by-20,70,5); c.fillStyle='#ffd23f'; c.fillRect(x0+20,by-20,70*p.stam,5); c.font='700 10px '+TC; c.fillStyle='#9ac'; c.fillText('體力',x0+20,by-8); } if(rgt) c.restore();
    /* 小地圖 */
    const ms=local2?86:112,mx=local2&&p.i===0?x0+10:x0+w-ms-10,my=10,k=ms/(HI-LO),mp=(x,y)=>[mx+(x-LO)*k,my+(y-LO)*k];
    const ya3=G3&&!G3fail&&VIEW==='3d'?G3.yaw(p.i):null,ZM=ya3==null?1:2.4,u=ya3==null?1:1.5/ZM; /* 3D 追車視角：小地圖跟著鏡頭轉（前方朝上）並放大附近街道；高空、俯視維持北方朝上 */
    c.save(); c.fillStyle='#1d3a4a'; c.fillRect(mx,my,ms,ms); c.beginPath(); c.rect(mx,my,ms,ms); c.clip();
    if(ya3!=null){ const s0=mp(o.x,o.y); c.translate(mx+ms/2,my+ms/2); c.rotate(-PI/2-ya3); c.scale(ZM,ZM); c.translate(-s0[0],-s0[1]); }
    c.drawImage(miniMap(),mx,my,ms,ms);
    if(p.route&&p.route.length){ c.strokeStyle='rgba(60,230,120,.95)'; c.lineWidth=2*u; c.beginPath(); const s0=mp(o.x,o.y); c.moveTo(s0[0],s0[1]); for(const q of p.route){ const s1=mp(q[0],q[1]); c.lineTo(s1[0],s1[1]); } c.stroke(); }
    for(const e of Wd.mrt){ const q=mp(e.x,e.y); c.fillStyle='#1d6ab8'; c.beginPath(); c.arc(q[0],q[1],3.4*u,0,TAU); c.fill(); c.strokeStyle='#fff'; c.lineWidth=1*u; c.stroke(); }
    { const q=mp(Wd.garage.x,Wd.garage.y); if(ST.ch>=1){ c.fillStyle='#ffd23f'; c.fillRect(q[0]-2.5*u,q[1]-2.5*u,5*u,5*u); } const pb=Wd.police,pq=mp((pb.x0+pb.x1)/2,(pb.y0+pb.y1)/2); c.fillStyle='#4a8aff'; c.beginPath(); c.moveTo(pq[0],pq[1]-4*u); c.lineTo(pq[0]+3.4*u,pq[1]-2*u); c.lineTo(pq[0],pq[1]+4*u); c.lineTo(pq[0]-3.4*u,pq[1]-2*u); c.fill(); }
    for(const v of V) if(v.role==='cop'||v.role==='block'){ const q=mp(v.x,v.y); c.fillStyle=Math.sin(t*12)>0?'#ff3a3a':'#3a6aff'; c.beginPath(); c.arc(q[0],q[1],2.6*u,0,TAU); c.fill(); }
    if(WT.heli){ const q=mp(WT.heli.x,WT.heli.y); c.strokeStyle='#fff'; c.lineWidth=1.2*u; c.beginPath(); c.arc(q[0],q[1],4*u,0,TAU); c.stroke(); }
    const tg=M.target&&M.target(); if(tg){ const q=mp(tg.x,tg.y); c.fillStyle=Math.sin(t*6)>0?'#ffd23f':'#ff9a1a'; c.beginPath(); c.arc(q[0],q[1],3.6*u,0,TAU); c.fill(); }
    for(const m of (M.markers?M.markers():[])) if(m.red){ const q=mp(m.x,m.y); c.fillStyle='#ff3a3a'; c.beginPath(); c.arc(q[0],q[1],3*u,0,TAU); c.fill(); }
    for(const q of PL){ const oo=me(q),s=mp(oo.x,oo.y); c.save(); c.translate(s[0],s[1]); c.rotate(oo.a||0); c.scale(u*1.2,u*1.2); c.fillStyle=q.i===0?'#ffd23f':'#7ae8ff'; c.beginPath(); c.moveTo(5,0); c.lineTo(-3,-3.4); c.lineTo(-3,3.4); c.closePath(); c.fill(); c.restore(); }
    c.restore(); c.strokeStyle='rgba(255,255,255,.4)'; c.lineWidth=1; c.strokeRect(mx,my,ms,ms);
    if(ya3!=null){ const na=-PI/2-ya3-PI/2,nr=ms/2-9,nx=mx+ms/2+Math.cos(na)*nr,ny=my+ms/2+Math.sin(na)*nr; c.fillStyle='rgba(200,30,40,.9)'; c.beginPath(); c.arc(nx,ny,7.5,0,TAU); c.fill(); c.font='900 10px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#fff'; c.fillText('北',nx,ny+.5); c.textBaseline='alphabetic'; } /* 北方在哪 */
    c.font='700 10px '+TC; c.textAlign=local2&&p.i===0?'left':'right'; c.fillStyle='rgba(255,255,255,.85)'; c.fillText('📍 '+roadName(Wd,o.x,o.y),local2&&p.i===0?x0+12:x0+w-12,my+ms+12);
    if(WT.lv>0||WT.heat>=.3){ const sx0=local2&&p.i===0?x0+12:x0+w-12-5*18,sy0=my+ms+30,fl=WT.lose>0&&Math.sin(t*8)>0; c.font='900 17px '+TC; c.textAlign='left'; for(let i=0;i<5;i++){ const on=i<WT.lv; c.lineWidth=3; c.strokeStyle='rgba(0,0,0,.65)'; c.strokeText('★',sx0+i*18,sy0); c.fillStyle=on?(fl?'#fff6c0':'#ffd23f'):'rgba(255,255,255,.25)'; c.fillText('★',sx0+i*18,sy0); } if(WT.lv>0&&WT.lose>0){ const need=3+WT.lv*1.4; c.fillStyle='rgba(0,0,0,.5)'; c.fillRect(sx0,sy0+11,88,4); c.fillStyle='#7ae8ff'; c.fillRect(sx0,sy0+11,88*clamp(WT.lose/need,0,1),4); } }
    if(p.roadT>0&&p.road){ const a=Math.min(1,p.roadT*2,(3-p.roadT)*4); c.globalAlpha=a; c.font='900 20px '+TC; c.textAlign='right'; c.lineWidth=5; c.strokeStyle='rgba(0,0,0,.6)'; const ry=H-(local2?150:118),rx=x0+w-14; c.strokeText(p.road,rx,ry); c.fillStyle='#fff'; c.fillText(p.road,rx,ry); c.font='700 12px '+TC; c.strokeText(Wd.D.n,rx,ry+20); c.fillStyle='#ffd23f'; c.fillText(Wd.D.n,rx,ry+20); c.globalAlpha=1; }
    if(p.bust>.3){ c.font='900 18px '+TC; c.textAlign='center'; c.fillStyle='rgba(180,20,30,.9)'; rr(c,x0+w/2-130,H/2-90,260,40,10); c.fill(); c.fillStyle='#fff'; c.fillText('警察要逮捕你了！快逃！',x0+w/2,H/2-76); c.fillStyle='rgba(255,255,255,.3)'; c.fillRect(x0+w/2-110,H/2-62,220,6); c.fillStyle='#fff'; c.fillRect(x0+w/2-110,H/2-62,220*clamp(p.bust/2.4,0,1),6); }
    if(p.mrt) drawMRT(vw,p);
    /* 提示框 */
    let hy=local2?118:84; const hq=p.hq&&p.hq[0]; if(hq){ const a=Math.min(1,hq.t*2,(6-hq.t)*4),bw=local2?w-24:300; c.globalAlpha=a; c.font='700 12.5px '+TC; const lines=wrapTxt(c,hq.txt,bw-46),bh=lines.length*17+16+(hq.keys.length?24:0); c.fillStyle='rgba(255,248,220,.95)'; rr(c,x0+12,hy,bw,bh,9); c.fill(); c.strokeStyle='#e8b830'; c.lineWidth=2; c.stroke(); c.fillStyle='#e8a820'; c.beginPath(); c.arc(x0+28,hy+17,8,0,TAU); c.fill(); c.fillStyle='#fff'; c.font='900 11px '+TC; c.textAlign='center'; c.fillText('!',x0+28,hy+17.5); c.font='700 12.5px '+TC; c.fillStyle='#3a2a10'; c.textAlign='left'; lines.forEach((l,i)=>c.fillText(l,x0+42,hy+17+i*17)); let kx=x0+42; for(const kk of hq.keys) kx+=keycap(c,kx,hy+bh-17,kk)+5; c.globalAlpha=1; hy+=bh+8; }
    const ts=p.toasts&&p.toasts[0]; if(ts){ c.globalAlpha=Math.min(1,ts.t*3); c.font='800 13px '+TC; const tw=c.measureText(ts.txt).width+24; c.fillStyle='rgba(180,30,30,.9)'; rr(c,x0+w/2-tw/2,H/2+60,tw,28,8); c.fill(); c.fillStyle='#fff'; c.textAlign='center'; c.fillText(ts.txt,x0+w/2,H/2+74); c.globalAlpha=1; }
    if(local2){ c.font='900 13px '+TC; c.textAlign='left'; c.fillStyle=p.i===0?'#ffd23f':'#7ae8ff'; c.fillText(p.i===0?'1P':'2P',x0+12,vw.h-84); } }
  function drawMRT(vw,p){ const m=p.mrt,x0=vw.x,w=vw.w; c.save(); c.beginPath(); c.rect(x0,0,w,H); c.clip();
    if(m.st==='menu'){ c.fillStyle='rgba(8,14,30,.78)'; c.fillRect(x0,0,w,H); const bw=Math.min(380,w-40),bx=x0+w/2-bw/2,by=H/2-120; c.fillStyle='#f4f6f8'; rr(c,bx,by,bw,240,14); c.fill(); c.fillStyle='#1d6ab8'; rr(c,bx,by,bw,46,14); c.fill(); c.fillRect(bx,by+30,bw,16); c.fillStyle='#fff'; c.font='900 18px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('捷運'+m.from.n+'　要去哪一站？',x0+w/2,by+24);
      m.list.forEach((e,i)=>{ const yy=by+70+i*44,sel=i===m.sel; c.fillStyle=sel?'#ffd23f':'#e2e8ee'; rr(c,bx+20,yy-17,bw-40,36,8); c.fill(); c.fillStyle='#1a2a44'; c.font='900 16px '+TC; c.textAlign='left'; c.fillText((sel?'▶ ':'　')+e.n,bx+34,yy+1); c.textAlign='right'; c.font='700 12px '+TC; c.fillStyle='#55606e'; c.fillText(Math.max(2,Math.round(Math.hypot(e.x-m.from.x,e.y-m.from.y)/600))+' 分鐘',bx+bw-34,yy+1); });
      c.fillStyle='#55606e'; c.font='700 12px '+TC; c.textAlign='center'; const K=KN[Math.min(p.i,KN.length-1)]; c.fillText('方向鍵選站，按 '+K.f+' 上車；按 '+K.n+' 取消',x0+w/2,by+220); }
    else { const T0=m.T; c.fillStyle='#2a3038'; c.fillRect(x0,0,w,H); const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#c8d0d8'); g.addColorStop(.5,'#e8eef2'); g.addColorStop(1,'#9aa2aa'); c.fillStyle=g; c.fillRect(x0,40,w,H-120);
      for(let i=0;i<4;i++){ const wx=x0+30+i*(w-60)/4,ww=(w-60)/4-30; c.fillStyle='#10161e'; rr(c,wx,90,ww,120,10); c.fill(); for(let k=0;k<6;k++){ const lx=wx+((k*97-T0*900)%ww+ww)%ww; c.fillStyle='rgba(255,230,160,.8)'; c.fillRect(lx,120+(k%3)*30,30,4); } }
      c.fillStyle='#1d6ab8'; c.fillRect(x0,230,w,10); c.fillStyle='#5a6a7a'; c.fillRect(x0,H-80,w,40); c.fillStyle='#3a8adf'; for(let i=0;i<5;i++) rr(c,x0+20+i*(w-40)/5,H-130,(w-40)/5-14,50,8),c.fill();
      for(let i=0;i<6;i++){ const px=x0+40+i*(w-80)/6; drawPortraitPax(px,H-150,i); }
      c.fillStyle='#111'; rr(c,x0+w/2-150,48,300,34,6); c.fill(); c.fillStyle='#ff9a2a'; c.font='900 16px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(T0<3.2?'下一站：'+m.to.n:m.to.n+' 到了',x0+w/2,65);
      c.fillStyle='rgba(0,0,0,'+clamp((T0-3.6)*2,0,1)+')'; c.fillRect(x0,0,w,H); }
    c.restore(); }
  function drawPortraitPax(x,y,i){ const lk=[{s:'#3d6fb3',h:'#1a1410'},{s:'#c8402e',h:'#3a2a1c'},{s:'#e8e8e4',h:'#111'},{s:'#5a8a4a',h:'#5a4030'},{s:'#8a5aa8',h:'#1a1410'},{s:'#2a2a2e',h:'#2b1d14'}][i%6]; c.fillStyle=lk.s; rr(c,x-14,y,28,46,8); c.fill(); c.fillStyle='#e0b48e'; c.beginPath(); c.arc(x,y-8,9,0,TAU); c.fill(); c.fillStyle=lk.h; c.beginPath(); c.arc(x,y-11,9,PI,TAU); c.fill(); if(i%3===1){ c.fillStyle='#222'; c.fillRect(x+6,y+4,6,10); } }
  let MM=null; function miniMap(){ if(MM) return MM; MM=document.createElement('canvas'); MM.width=MM.height=200; const m=MM.getContext('2d'),k=200/(HI-LO); m.fillStyle='#2c5a72'; m.fillRect(0,0,200,200); m.fillStyle='#55585e'; m.fillRect(0,0,200,200); for(const b of Wd.B){ m.fillStyle=b.type==='park'?'#4a7a3a':b.type==='lot'?'#6a6c70':b.type==='temple'?'#a8442c':b.type==='school'?'#8aa060':b.type==='hosp'?'#e8e8e8':b.type==='police'?'#5a7ab8':'#8a857c'; m.fillRect((b.x0-LO)*k,(b.y0-LO)*k,(b.x1-b.x0)*k,(b.y1-b.y0)*k); } m.fillStyle='#c8202a'; const h=Wd.hosp; m.fillRect(((h.x0+h.x1)/2-LO)*k-1,((h.y0+h.y1)/2-LO)*k-4,2,8); m.fillRect(((h.x0+h.x1)/2-LO)*k-4,((h.y0+h.y1)/2-LO)*k-1,8,2); return MM; }
  function drawShared(){ /* 任務、時間 */ c.textBaseline='middle'; const pw=local2?250:236,px=local2?W/2-pw/2:10; c.fillStyle='rgba(10,12,20,.78)'; rr(c,px,10,pw,M.extra||M.bar?82:62,10); c.fill(); c.font='900 13px '+TC; c.fillStyle='#ffd23f'; c.textAlign='left'; c.fillText(TN[ST.type]+'｜'+(M.label?M.label():''),px+12,26); c.font='700 12px '+TC; c.fillStyle='#fff'; c.fillText((M.sub?M.sub():'').slice(0,22),px+12,46);
    if(M.bar&&M.bar()!=null){ c.fillStyle='#333a48'; c.fillRect(px+12,62,pw-90,7); const b=M.bar(); c.fillStyle=b>.5?'#4ade70':b>.25?'#ffc21a':'#ff4a3a'; c.fillRect(px+12,62,(pw-90)*clamp(b,0,1),7); c.font='700 10px '+TC; c.fillStyle='#ccd'; c.fillText(M.barLbl||'車況',px+pw-72,66); }
    else if(M.extra){ c.font='700 11px '+TC; c.fillStyle='#bfe'; c.fillText(M.extra(),px+12,66); }
    const tm=Math.max(0,Math.ceil(M.time)),mm=Math.floor(tm/60),ss=tm%60,tx=local2?px+pw-36:W/2,ty=local2?28:28; c.font=(local2?'900 20px ':'900 26px ')+TC; c.textAlign='center'; c.lineWidth=5; c.strokeStyle='rgba(0,0,0,.6)'; const ts=mm+':'+String(ss).padStart(2,'0'); c.strokeText(ts,tx,ty); c.fillStyle=tm<=10&&Math.sin(t*10)>0?'#ff5a4a':'#fff'; c.fillText(ts,tx,ty);
    /* 無線電對話 */
    if(DLG){ const ch=CH[DLG.who]||CH.disp,bw=local2?460:598,bx=local2?170:192,byy=H-(local2?96:94),a=Math.min(1,DLG.T*5,(DLG.t-DLG.T)*4); c.globalAlpha=clamp(a,0,1); c.fillStyle='rgba(12,16,28,.9)'; rr(c,bx,byy,bw,80,12); c.fill(); c.strokeStyle='rgba(120,180,255,.6)'; c.lineWidth=1.5; c.stroke(); portrait(c,bx+10,byy+10,60,ch,t,DLG.T<DLG.txt.length*.05+.3); c.font='900 12px '+TC; c.fillStyle='#7ab8ff'; c.textAlign='left'; c.fillText(ch.n+'　📻',bx+82,byy+18); c.font='700 14px '+TC; c.fillStyle='#fff'; const shown=DLG.txt.slice(0,Math.floor(DLG.T/.04)); wrapTxt(c,shown,bw-96).slice(0,3).forEach((l,i)=>c.fillText(l,bx+82,byy+40+i*18)); c.globalAlpha=1; }
    /* 倒數 */
    if(cd>0){ const n=Math.ceil(cd); c.fillStyle='rgba(0,0,0,.35)'; c.fillRect(0,0,W,H); c.font='900 20px '+TC; c.fillStyle='#ffd23f'; c.textAlign='center'; c.fillText('第 '+(si+1)+' 關　'+ST.n,W/2,H/2-80); c.font='700 13px '+TC; c.fillStyle='#ddd'; c.fillText(Wd.D.n+'・'+TH.n,W/2,H/2-56); if(n<=3){ c.font='900 76px '+TC; c.fillStyle='#fff'; c.lineWidth=6; c.strokeStyle='rgba(0,0,0,.6)'; c.strokeText(n,W/2,H/2); c.fillText(n,W/2,H/2); } }
    else if(t-goAt<1){ c.globalAlpha=1-(t-goAt); c.font='900 60px '+TC; c.fillStyle='#4ade70'; c.textAlign='center'; c.fillText('出發！',W/2,H/2); c.globalAlpha=1; }
    if(over){ c.fillStyle='rgba(0,0,0,.35)'; c.fillRect(0,H/2-40,W,80); c.font='900 40px '+TC; c.textAlign='center'; c.fillStyle=over.win?'#ffd23f':'#ff6a5a'; c.fillText(over.win?'任務完成！':over.why||'任務失敗',W/2,H/2); } }
  return {update,draw,pause(pz){ if(eg) eg.gain.value=pz?0:.018; },destroy(){ if(osc){ try{ osc.stop(); }catch(e){} } if(sOsc){ try{ sOsc.stop(); }catch(e){} } if(G3){ try{ G3.destroy(); }catch(e){} } },previewWarm:2,
    _dbg:{PL,get V(){ return V; },get PD(){ return PD; },get M(){ return M; },get EV(){ return EV; },get over(){ return over; },Wd,ST,win,toggleCar,spawnEvent,WT,WX,setWanted,crime,people,get G3(){ return G3; },get VIEW(){ return VIEW; },set VIEW(v){ VIEW=v; },get t(){ return t; },set cd(v){ cd=v; if(v<=0) goAt=t-2; },navTo,step}}; }

/* 開始畫面示意圖 */
const SHOW={};
function stageShow(ctx,w,h,si,t){ const ST=STAGES[si],Wd=getWorld(ST.di),TH=THEMES[ST.th]; let S=SHOW[si]; if(!S){ const R=mul(si*97+3),k=2+Math.floor(R()*6),j=2+Math.floor(R()*6); S=SHOW[si]={x:k*P,y:j*P,cars:[]}; for(let q=0;q<10;q++){ const hz=q%2===0,s=R()<.5?1:-1,off=pick(R,[17,52]),u=(R()-.5)*700; S.cars.push({hz,s,off,u,ty:pick(R,['sedan','sedan','taxi','scooter','hatch','truck','van']),col:pick(R,CARC),sp:80+R()*60}); } }
  const z=Math.min(w/700,h/440)*1.05,cx=S.x+Math.sin(t*.25)*30,cy=S.y+Math.cos(t*.2)*20; ctx.fillStyle='#111'; ctx.fillRect(0,0,w,h); ctx.save(); ctx.translate(w/2,h/2); ctx.scale(z,z); ctx.translate(-cx,-cy);
  const hw=w/2/z,hh=h/2/z; for(let ci=Math.floor((cx-hw)/P);ci<=Math.floor((cx+hw)/P);ci++) for(let cj=Math.floor((cy-hh)/P);cj<=Math.floor((cy+hh)/P);cj++) ctx.drawImage(tile(Wd,ci,cj,TH.rain),ci*P-.3,cj*P-.3,P+.6,P+.6);
  for(const cr of S.cars){ const u=((cr.u+t*cr.sp*cr.s)%800+1200)%800-400,x=cr.hz?S.x+u:S.x-cr.s*cr.off,y=cr.hz?S.y+cr.s*cr.off:S.y+u,a=cr.hz?(cr.s>0?0:PI):(cr.s>0?PI/2:-PI/2),T=VT[cr.ty]; if(Math.abs(u)<HR+30) continue; ctx.save(); ctx.translate(x,y); ctx.rotate(a); ctx.fillStyle='rgba(0,0,0,.3)'; rr(ctx,-T.L/2+2.5,-T.W/2+3.5,T.L,T.W,5); ctx.fill(); ctx.drawImage(carSpr(cr.ty,cr.ty==='taxi'?'#f2c12e':cr.col,cr.ty==='scooter'?JSON.stringify({shirt:'#3a5a8a',helm:'#e8e8e8',skin:'#e0b48e'}):cr.ty==='truck'?'#e8e8e8':null),-(T.L+10)/2,-(T.W+10)/2,T.L+10,T.W+10); ctx.restore(); }
  const bl=[]; for(const b of Wd.B) if(Math.abs((b.x0+b.x1)/2-cx)<hw+300&&Math.abs((b.y0+b.y1)/2-cy)<hh+300){ for(const tr of b.trees) ctx.drawImage(canopy(tr.v),tr.x-tr.r*1.25,tr.y-tr.r*1.25,tr.r*2.5,tr.r*2.5); for(const bd of b.blds) bl.push(bd); }
  bl.sort((a,b)=>Math.hypot((b.x0+b.x1)/2-cx,(b.y0+b.y1)/2-cy)-Math.hypot((a.x0+a.x1)/2-cx,(a.y0+a.y1)/2-cy)); for(const bd of bl) drawBld(ctx,bd,cx,cy,TH.dark,false);
  ctx.restore(); if(TH.dark){ ctx.fillStyle='rgba(6,10,26,'+TH.dark*.75+')'; ctx.fillRect(0,0,w,h); } if(TH.tint){ ctx.fillStyle=TH.tint; ctx.fillRect(0,0,w,h); } }
function figure(c,x,y,h,L,t){ /* 寫實比例的正面人物：約 7.5 頭身 */ L=L||{}; const u=h/7.5,sk=L.skin||'#e0b48e',sh=L.shirt||'#2a4a7a',pa=L.pants||'#1e1e22',hc=L.hairc||'#1a1410',hs=L.hs||'short',br=Math.sin(t*2)*u*.03;
  const shade=(hex,k)=>{ const n=parseInt(hex.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(v*(1+k)))); return 'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')'; };
  c.save(); c.translate(x,y); c.lineJoin='round'; c.lineCap='round';
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0,0,u*1.4,u*.22,0,0,Math.PI*2); c.fill();
  const leg=s0=>{ const g=c.createLinearGradient(s0*u*.1,0,s0*u*.75,0); g.addColorStop(0,shade(pa,.15)); g.addColorStop(1,shade(pa,-.25)); c.fillStyle=g; c.beginPath(); c.moveTo(s0*u*.06,-u*3.85); c.lineTo(s0*u*.72,-u*3.85); c.lineTo(s0*u*.6,-u*.3); c.lineTo(s0*u*.18,-u*.3); c.closePath(); c.fill();
    c.fillStyle='#1a1a20'; c.beginPath(); c.ellipse(s0*u*.42,-u*.16,u*.36,u*.18,0,0,Math.PI*2); c.fill(); c.fillStyle='#e8e8e8'; c.fillRect(s0*u*.42-u*.3,-u*.12,u*.6,u*.06); };
  leg(-1); leg(1);
  const arm=s0=>{ c.fillStyle=shade(sh,-.1); c.beginPath(); c.moveTo(s0*u*.98,-u*5.75); c.quadraticCurveTo(s0*u*1.32,-u*5.5,s0*u*1.25,-u*4.6); c.lineTo(s0*u*.98,-u*4.55); c.closePath(); c.fill();
    c.fillStyle=shade(sk,-.08); c.beginPath(); c.moveTo(s0*u*1.04,-u*4.6); c.lineTo(s0*u*1.24,-u*4.6); c.lineTo(s0*u*1.16,-u*3.55); c.lineTo(s0*u*.98,-u*3.55); c.closePath(); c.fill(); c.fillStyle=sk; c.beginPath(); c.ellipse(s0*u*1.08,-u*3.42,u*.16,u*.22,0,0,Math.PI*2); c.fill(); };
  arm(-1); arm(1);
  { const g=c.createLinearGradient(-u,0,u,0); g.addColorStop(0,shade(sh,-.2)); g.addColorStop(.45,shade(sh,.12)); g.addColorStop(1,shade(sh,-.25)); c.fillStyle=g; c.beginPath(); c.moveTo(-u*1.02,-u*5.8+br); c.quadraticCurveTo(0,-u*6.02+br,u*1.02,-u*5.8+br); c.lineTo(u*.82,-u*3.75); c.lineTo(-u*.82,-u*3.75); c.closePath(); c.fill();
    c.strokeStyle='rgba(0,0,0,.18)'; c.lineWidth=u*.04; c.beginPath(); c.moveTo(0,-u*5.6); c.lineTo(0,-u*3.9); c.stroke(); c.fillStyle=shade(pa,-.35); c.fillRect(-u*.8,-u*3.92,u*1.6,u*.14); } /* 上衣、皮帶 */
  c.fillStyle=shade(sk,-.12); c.fillRect(-u*.2,-u*6.2+br,u*.4,u*.42); /* 脖子 */
  const hy=-u*6.72+br; c.fillStyle=sk; c.beginPath(); c.ellipse(0,hy,u*.44,u*.56,0,0,Math.PI*2); c.fill(); c.beginPath(); c.ellipse(-u*.45,hy+u*.05,u*.08,u*.14,0,0,Math.PI*2); c.ellipse(u*.45,hy+u*.05,u*.08,u*.14,0,0,Math.PI*2); c.fill();
  c.fillStyle=hc; if(hs==='long'){ c.beginPath(); c.moveTo(-u*.5,hy-u*.1); c.quadraticCurveTo(-u*.62,hy+u*.7,-u*.42,hy+u*1.05); c.lineTo(-u*.3,hy+u*.2); c.closePath(); c.fill(); c.beginPath(); c.moveTo(u*.5,hy-u*.1); c.quadraticCurveTo(u*.62,hy+u*.7,u*.42,hy+u*1.05); c.lineTo(u*.3,hy+u*.2); c.closePath(); c.fill(); }
  if(hs==='cap'){ c.fillStyle=L.capc||'#c8202a'; c.beginPath(); c.ellipse(0,hy-u*.22,u*.48,u*.38,0,Math.PI,0); c.fill(); c.fillRect(-u*.5,hy-u*.25,u*1.0,u*.1); c.fillStyle=shade(L.capc||'#c8202a',-.3); c.beginPath(); c.ellipse(0,hy-u*.18,u*.55,u*.1,0,0,Math.PI); c.fill(); }
  else if(hs==='buzz'){ c.globalAlpha=.85; c.beginPath(); c.ellipse(0,hy-u*.12,u*.46,u*.46,0,Math.PI*1.05,Math.PI*1.95); c.fill(); c.globalAlpha=1; }
  else { c.beginPath(); c.ellipse(0,hy-u*.16,u*.5,u*.46,0,Math.PI*1.02,Math.PI*1.98); c.quadraticCurveTo(u*.2,hy-u*.36,-u*.48,hy-u*.12); c.fill(); }
  c.fillStyle='#fff'; c.beginPath(); c.ellipse(-u*.17,hy+u*.02,u*.08,u*.05,0,0,Math.PI*2); c.ellipse(u*.17,hy+u*.02,u*.08,u*.05,0,0,Math.PI*2); c.fill();
  c.fillStyle='#2a1a10'; c.beginPath(); c.arc(-u*.17,hy+u*.02,u*.04,0,Math.PI*2); c.arc(u*.17,hy+u*.02,u*.04,0,Math.PI*2); c.fill();
  c.strokeStyle=shade(hc,0); c.lineWidth=u*.05; c.beginPath(); c.moveTo(-u*.27,hy-u*.09); c.lineTo(-u*.08,hy-u*.1); c.moveTo(u*.08,hy-u*.1); c.lineTo(u*.27,hy-u*.09); c.stroke();
  c.strokeStyle=shade(sk,-.3); c.lineWidth=u*.035; c.beginPath(); c.moveTo(0,hy+u*.05); c.lineTo(-u*.04,hy+u*.2); c.lineTo(u*.03,hy+u*.22); c.stroke(); c.beginPath(); c.moveTo(-u*.11,hy+u*.34); c.quadraticCurveTo(0,hy+u*.38,u*.11,hy+u*.34); c.stroke();
  c.restore(); }
function preview(ctx,w,h,L,t){ L=L||{}; const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#5a6070'); g.addColorStop(1,'#2a2e36'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); ctx.fillStyle='#3d4046'; ctx.fillRect(0,h*.62,w,h*.38); ctx.fillStyle='rgba(255,255,255,.5)'; for(let x=10;x<w*.55;x+=34) ctx.fillRect(x,h*.8,18,3);
  const ty=L.car&&VT[L.car]?L.car:'sedan',s=Math.min(w*.5,h)/62; ctx.save(); ctx.translate(w*.3,h*.55); ctx.scale(s,s); ctx.rotate(-.35+Math.sin(t*.8)*.15); ctx.drawImage(carSpr(ty,L.color||'#c8202a'),-28,-15,56,30); ctx.restore();
  ctx.fillStyle='#fff'; ctx.font='900 '+Math.round(h*.08)+'px "Noto Sans TC","Microsoft JhengHei",sans-serif'; ctx.textAlign='center'; ctx.fillText(VT[ty].n,w*.3,h*.95);
  figure(ctx,w*.76,h*.96,h*.86,L,t); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).chase={
  name:'城市飆風追緝',tag:'CITY RUSH',color:'#ff8a3a',
  desc:'3D 台灣城市動作冒險：跟著主角阿傑臥底黑鯊幫，6 章 60 個任務——快遞、小黃、追捕、救護、停車、護送、地下賽車、跟蹤、偷車、甩掉警察。闖紅燈、撞人、搶車會被通緝，警車、路障、直升機都會來追！可以走路、騎機車、借公共單車、搭捷運，天氣還會變。',
  goal:'在時間內完成任務。照地上的綠色箭頭和右上角地圖找路；被通緝時要離開警車視線，星星才會消失。',
  load:()=>{ const K=window.ARCADE_GAMES.kart; return K&&K.load?K.load().catch(()=>{}):Promise.resolve(); },
  stages:STAGES.map(s=>TN[s.type]+'｜'+s.n),stars:STAGES.map(s=>1+s.tier),stageLabel:'選擇任務',
  stageLocked:i=>i>0&&getR(i-1)==null,stageBest:i=>{ const v=getR(i); return v==null?'':'★'.repeat(v)+'☆'.repeat(3-v); },
  stageGoal:si=>{ const S=STAGES[si],o=S.o||{}; return CHAP[S.ch]+'：'+({run:o.veh==='scooter'?'騎機車把東西送到每個送達點。':'把貨送到每個送達點（開進黃框停下來）。',taxi:'去載路邊招手的客人，送到他要去的地方。',catch:o.foot?'嫌犯徒步逃跑，下車用跑的抓住他。':'開警車把嫌犯車撞停，嫌犯下車就去抓他。',park:'開到指定車位，停進黃色格子、停好不動。',amb:'開救護車到事故現場載傷患，送到醫院急診。',escape:'甩開黑色追兵，把證人送到警察局。',race:'穿過每個檢查點，比對手先到終點。',tail:'跟著目標車，不能太近也不能跟丟。',repo:'偷走指定的車，甩掉警察後開回車行。',lose:'被通緝了！甩掉警察'+(o.dest?'再到目的地。':'。'),story:'照著指示一步一步完成主線劇情。'})[S.type]+'（'+DIST[S.di].n+'・'+THEMES[S.th].n+({rain:'・下雨',storm:'・颱風',fog:'・起霧',shower:'・午後雷陣雨'}[S.wx]||'')+'）'; },
  stageShow,thumb:(c,w,h,t)=>stageShow(c,w,h,2,t),preview,
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人合作',kb:true}],
  help:[['↑ ↓ ← →','↑ 油門、↓ 煞車／倒車、← → 方向盤（走路：↑ 往前、← → 轉身）'],['空白鍵','氮氣加速（走路是跑步、腳踏車是用力踩）'],['F','上下車、搶車、騎路邊機車、借公共單車；在捷運站入口搭捷運'],['V','換視角：3D 追車／高空／俯視（後兩種往畫面方向開）'],['雙人','1P 方向鍵＋Enter＋右 Shift；2P WASD＋空白鍵＋E']],
  touchHelp:[['方向鍵','↑ 油門、↓ 煞車、← → 轉彎'],['加速','氮氣加速、跑步'],['上下車','下車、換車、搭捷運'],['視角','切換 3D／俯視']],
  touch:{left:'dpad',right:[{l:'加速',c:'Space',act:true},{l:'上下車',c:'KeyF'},{l:'視角',c:'KeyV'}]},
  looks:[{key:'car',label:'車款',opts:[{id:'sedan',label:'轎車'},{id:'hatch',label:'小車'},{id:'suv',label:'休旅車'},{id:'sports',label:'跑車'}]},
    {key:'color',label:'車子顏色',type:'color',opts:['#c8202a','#1d4fa8','#f2f2ee','#1b1d22','#e8c21c','#2f7a4a','#ff7a1a','#8a5ab8']},
    {key:'hs',label:'髮型',opts:[{id:'short',label:'短髮'},{id:'long',label:'長髮'},{id:'cap',label:'棒球帽'},{id:'buzz',label:'平頭'}]},
    {key:'hairc',label:'髮色',type:'color',opts:['#1a1410','#3a2a1c','#6a4a2a','#a87a4a','#8a8a8a','#c8a060']},
    {key:'shirt',label:'上衣',type:'color',opts:['#2a4a7a','#e8e8e4','#2a2a2e','#c8402e','#5a8a4a','#e8c85a','#8a5aa8','#f4a040']},
    {key:'pants',label:'褲子',type:'color',opts:['#1e1e22','#2a3040','#3a4a6a','#5a4a3a','#8a8a80','#c8b890']},
    {key:'skin',label:'膚色',type:'color',opts:['#f1c9a5','#e0b48e','#c99a74','#a5764f','#7a5236']}],
  best:{label:'最高分',fmt:v=>v+' 分',lower:false},create};
})();
