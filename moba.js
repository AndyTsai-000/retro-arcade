// 星界裂谷：5 對 5 推塔對戰（原創英雄）。模式一：上中下三路＋兩塊野區；模式二：單路激戰。
// 房主（單人時就是自己）算全部戰鬥；連線的客人送自己的位置和按鍵，收房主的畫面資料。
(function(){
'use strict';
const W=960,H=540,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PI=Math.PI,TAU=PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k,dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function mul(seed){ let a=seed>>>0||1; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function rr(c,x,y,w,h,r){ r=Math.min(r,w/2,h/2); c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const TEAMC=['#3d8bff','#ff4a4a'],TEAMN=['藍方','紅方'];
/* ================= 地圖 ================= */
function polyl(pts){ let len=0; const seg=[]; for(let i=0;i+1<pts.length;i++){ const [ax,az]=pts[i],[bx,bz]=pts[i+1],l=Math.hypot(bx-ax,bz-az); seg.push({ax,az,bx,bz,l,s0:len}); len+=l; } return Object.assign(pts.slice(),{pts,seg,len}); }
function segD(px,pz,ax,az,bx,bz){ const dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz||1,u=clamp(((px-ax)*dx+(pz-az)*dz)/l2,0,1); return Math.hypot(px-ax-dx*u,pz-az-dz*u); }
function along(L,s){ s=clamp(s,0,L.len); for(const g of L.seg){ if(s<=g.s0+g.l||g===L.seg[L.seg.length-1]){ const u=g.l?(s-g.s0)/g.l:0; return [lerp(g.ax,g.bx,u),lerp(g.az,g.bz,u),(g.bx-g.ax)/(g.l||1),(g.bz-g.az)/(g.l||1)]; } } return [L.pts[0][0],L.pts[0][1],1,0]; }
function project(L,x,z){ let best=1e9,bs=0; for(const g of L.seg){ const dx=g.bx-g.ax,dz=g.bz-g.az,u=clamp(((x-g.ax)*dx+(z-g.az)*dz)/(g.l*g.l||1),0,1),d=Math.hypot(x-g.ax-dx*u,z-g.az-dz*u); if(d<best){ best=d; bs=g.s0+u*g.l; } } return [bs,best]; }
function buildMap(mode,seed){ const R=mul(seed+mode*977),M={mode,seed,laneW:mode?9:8};
  if(mode===0){ M.B=66; M.base=[[-56,56],[56,-56]]; M.fount=[[-63,63],[63,-63]];
    M.lanes=[polyl([[-56,56],[-58,34],[-58,-50],[-50,-58],[34,-58],[56,-56]]),polyl([[-56,56],[56,-56]]),polyl([[-56,56],[-34,58],[50,58],[58,50],[58,-34],[56,-56]])];
    M.laneName=['上路','中路','下路'];
    M.river={pts:[[-66,-66],[66,66]],w:8,len:Math.hypot(132,132),cx:0,cz:0,ang:-PI/4,at:t=>[lerp(-66,66,t),lerp(-66,66,t)]}; M.riverW=8; M.riverDist=(x,z)=>segD(x,z,-66,-66,66,66);
    const big=[[-22,-22,0],[22,22,1]],small=[[-47,-20],[-40,-32],[20,47],[32,40],[-20,-47],[-32,-40],[47,20],[40,32]]; /* 前 4 個藍方、後 4 個紅方，沿河道（x、z 對調）完全對稱 */
    M.camps=[{x:big[0][0],z:big[0][1],big:1,kind:0,col:'#c08aff',side:0},{x:big[1][0],z:big[1][1],big:1,kind:1,col:'#8affc8',side:1}].concat(small.map((p,i)=>({x:p[0],z:p[1],big:0,kind:i,side:i<4?0:1})));
    M.inB=(x,z)=>[clamp(x,-M.B,M.B),clamp(z,-M.B,M.B)]; M.edge=a=>M.B/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)));
  } else { M.B=66; M.cliff=11.5; M.base=[[-56,0],[56,0]]; M.fount=[[-64,0],[64,0]]; M.lanes=[polyl([[-56,0],[56,0]])]; M.laneName=['主路']; M.camps=[]; M.riverW=0;
    M.inB=(x,z)=>[clamp(x,-M.B,M.B),clamp(z,-M.cliff+.8,M.cliff-.8)]; M.edge=a=>Math.min(70/Math.max(.001,Math.abs(Math.cos(a))),(M.cliff+4)/Math.max(.001,Math.abs(Math.sin(a)))); }
  M.laneDist=(x,z)=>{ let d=1e9; for(const L of M.lanes) for(const g of L.seg) d=Math.min(d,segD(x,z,g.ax,g.az,g.bx,g.bz)); return d; };
  M.along=along;
  // 塔：每路兩座（外塔、內塔），主堡在基地
  M.towers=[]; let tid=100; M.lanes.forEach((L,li)=>{ const side=mode===0&&li!==1,fr=mode?[.17,.35]:side?[.14,.31]:[.2,.37]; for(let tm=0;tm<2;tm++) fr.forEach((f,k)=>{ const p=along(L,tm?L.len*(1-f):L.len*f); M.towers.push({id:tid++,team:tm,lane:li,tier:k,x:p[0],z:p[1]}); }); });
  M.cores=[0,1].map(tm=>({id:200+tm,team:tm,x:M.base[tm][0],z:M.base[tm][1]}));
  // 給電腦走的路網：三條路、河道、野怪營地
  const N=[],E=[]; const node=(x,z)=>{ N.push([x,z]); return N.length-1; };
  const ends=[]; M.lanes.forEach(L=>{ let prev=-1,first=-1; for(let s=8;s<=L.len-7.9;s+=8){ const p=along(L,Math.min(s,L.len)),i=node(p[0],p[1]); if(first<0) first=i; if(prev>=0) E.push([prev,i]); prev=i; } ends.push([first,prev]); }); // 頭尾 8 公尺是主堡，不放點
  // 主堡前的集合點：三條路在自家門口接起來，出門可以直接走到任何一路（不用繞別路）
  if(mode===0) for(let tm=0;tm<2;tm++){ const b=M.base[tm],hub=node(b[0]+(tm?-4:4),b[1]+(tm?4:-4)); ends.forEach(e=>E.push([hub,e[tm]])); }
  if(M.river){ let prev=-1; for(let t=-58;t<=58;t+=8){ const i=node(t,t); if(prev>=0) E.push([prev,i]); prev=i; } }
  const nearest=(x,z,skip)=>{ let b=-1,bd=1e9; N.forEach((q,i)=>{ if(skip&&skip.has(i)) return; const d=Math.hypot(q[0]-x,q[1]-z); if(d<bd){ bd=d; b=i; } }); return b; };
  M.camps.forEach(cp=>{ const ci=node(cp.x,cp.z); cp.node=ci; const sk=new Set([ci]); for(let k=0;k<2;k++){ const j=nearest(cp.x,cp.z,sk); sk.add(j); E.push([ci,j]); } });
  M.camps.forEach(a=>M.camps.forEach(b=>{ if(a!==b&&a.side===b.side&&a.node<b.node&&Math.hypot(a.x-b.x,a.z-b.z)<30) E.push([a.node,b.node]); }));
  // 路網的點不要剛好壓在防禦塔上（會被塔擋住走不到）：往旁邊挪開
  for(const q of N) for(const t of M.towers){ const dx=q[0]-t.x,dz=q[1]-t.z,d=Math.hypot(dx,dz); if(d<3.2){ const a=d>.05?Math.atan2(dz,dx):Math.atan2(t.x,-t.z); q[0]=t.x+Math.cos(a)*3.2; q[1]=t.z+Math.sin(a)*3.2; } }
  M.N=N; M.E=E; M.adj=N.map(()=>[]); E.forEach(([a,b])=>{ const d=Math.hypot(N[a][0]-N[b][0],N[a][1]-N[b][1]); M.adj[a].push([b,d]); M.adj[b].push([a,d]); });
  // 障礙物：樹叢、大石頭（不擋路、不擋河、不擋營地和路網）
  M.obst=[]; if(mode===0){ for(let k=0;k<2600&&M.obst.length<70;k++){ const x=(R()-.5)*124,z=(R()-.5)*124,r=2.4+R()*3;
      if(M.laneDist(x,z)<M.laneW/2+r+1.5) continue; if(M.riverDist(x,z)<M.river.w/2+r+1.5) continue; if(M.base.concat(M.fount).some(b=>Math.hypot(x-b[0],z-b[1])<18+r)) continue;
      if(M.camps.some(c=>Math.hypot(x-c.x,z-c.z)<(c.big?10:7)+r)) continue; if(E.some(([a,b])=>segD(x,z,N[a][0],N[a][1],N[b][0],N[b][1])<r+3.2)) continue; if(M.obst.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+r+3.5)) continue;
      M.obst.push({x,z,r,k:R()<.28?'rock':'tree'}); }
    // 左右對稱：只留藍方那一半，再鏡射到紅方（x、z 對調），兩隊地形一模一樣
    M.obst=M.obst.filter(o=>o.z-o.x>o.r*1.5); M.obst=M.obst.concat(M.obst.map(o=>Object.assign({},o,{x:o.z,z:o.x}))); }
  // 草叢：英雄躲進去，外面的人看不到（除非有眼或也在同一叢草裡）
  M.bush=[]; const okB=(x,z,r)=>{ if(M.laneDist(x,z)<M.laneW/2+r*.7) return false; if(M.river&&M.riverDist(x,z)<M.river.w/2+r*.5) return false; if(M.base.concat(M.fount).some(b=>Math.hypot(x-b[0],z-b[1])<20)) return false;
    if((M.obst||[]).some(o=>Math.hypot(o.x-x,o.z-z)<o.r+r+.8)) return false; if(M.camps.some(c=>Math.hypot(x-c.x,z-c.z)<(c.big?7:5)+r)) return false; if(M.bush.some(b=>Math.hypot(b.x-x,b.z-z)<b.r+r+2)) return false;
    if(mode===1&&Math.abs(z)>M.cliff-r-.3) return false; return Math.abs(x)<M.B-2&&Math.abs(z)<M.B-2; };
  if(mode===0){ // 參考英雄聯盟：路邊草叢（靠河道那側多一些）、河道兩岸、野區入口、野怪營地旁都有草
    M.lanes.forEach((L,li)=>{ [.2,.29,.38,.47,.53,.62,.71,.8].forEach((f,k)=>{ const p=along(L,L.len*f); for(const sd of [1,-1]){ const r=2.1+(k%3)*.3,off=M.laneW/2+r+.4,x=p[0]-p[3]*off*sd,z=p[1]+p[2]*off*sd; if(okB(x,z,r)) M.bush.push({x,z,r}); } }); });
    for(const t of [.16,.25,.33,.41,.47,.53,.59,.67,.75,.84]){ const p=M.river.at(t); for(const sd of [-1,1]){ const r=2.2,o=M.river.w/2+r+.3,x=p[0]-.707*o*sd,z=p[1]+.707*o*sd; if(okB(x,z,r)) M.bush.push({x,z,r}); } }
    M.camps.forEach(c=>{ let n=0; for(let k=0;k<14&&n<2;k++){ const a=R()*TAU,d=(c.big?9.5:7)+R()*3,r=2+R()*.6,x=c.x+Math.cos(a)*d,z=c.z+Math.sin(a)*d; if(okB(x,z,r)){ M.bush.push({x,z,r}); n++; } } });
    for(let k=0,n=0;k<1200&&n<14;k++){ const x=(R()-.5)*120,z=(R()-.5)*120,r=2.2+R()*.7; if(z-x<r+4||M.laneDist(x,z)<M.laneW/2+r+3||M.riverDist(x,z)<M.river.w/2+r+3) continue; if(M.bush.some(b=>Math.hypot(b.x-x,b.z-z)<b.r+r+4)) continue; if(okB(x,z,r)){ M.bush.push({x,z,r}); n++; } }
    M.bush=M.bush.filter(b=>b.z-b.x>b.r*.9); M.bush=M.bush.concat(M.bush.map(b=>({x:b.z,z:b.x,r:b.r}))); }
  else { const L=M.lanes[0]; for(const f of [.27,.4,.6,.73]) for(const sd of [-1,1]){ const p=along(L,L.len*f),r=2.1,z=sd*(M.laneW/2+r+.2),x=p[0]+(sd>0?2:-2); if(okB(x,z,r)) M.bush.push({x,z,r}); } }
  M.nearestNode=(x,z)=>nearest(x,z);
  M.path=(x0,z0,x1,z1)=>{ const s=nearest(x0,z0),g=nearest(x1,z1); if(s===g) return [[x1,z1]]; const dd=N.map(()=>1e9),pv=N.map(()=>-1),done=new Set(); dd[s]=0;
    for(;;){ let u=-1,ud=1e9; for(let i=0;i<N.length;i++) if(!done.has(i)&&dd[i]<ud){ ud=dd[i]; u=i; } if(u<0||u===g) break; done.add(u); for(const [v,w] of M.adj[u]) if(dd[u]+w<dd[v]){ dd[v]=dd[u]+w; pv[v]=u; } }
    const out=[[x1,z1]]; let c=g; while(c>=0&&c!==s){ out.unshift(N[c].slice()); c=pv[c]; } return out; };
  return M; }
/* ================= 英雄、技能、裝備 ================= */
const CLS={tank:{n:'坦克',col:'#7aa8ff',hp:1050,hpL:125,atk:52,atkL:4,as:.8,rng:2.4,mr:32,mrL:1.25,arm:32,armL:3.2,spd:6.2,ad:.3},
  fighter:{n:'戰士',col:'#ffb04a',hp:880,hpL:108,atk:62,atkL:6,as:.9,rng:2.4,mr:30,mrL:1.2,arm:22,armL:2.6,spd:6.4,ad:.6},
  assassin:{n:'刺客',col:'#ff5d8f',hp:760,hpL:94,atk:66,atkL:7,as:1,rng:2.2,mr:30,mrL:1.1,arm:20,armL:2.3,spd:6.8,ad:.7},
  mage:{n:'法師',col:'#b98cff',hp:620,hpL:76,atk:46,atkL:3,as:.75,rng:7,mr:28,mrL:0.8,arm:12,armL:1.6,spd:6.2,ad:.1},
  marksman:{n:'射手',col:'#86dc4f',hp:600,hpL:76,atk:58,atkL:6.5,as:.95,rng:7.5,mr:26,mrL:0.8,arm:12,armL:1.6,spd:6.3,ad:.6},
  support:{n:'輔助',col:'#3ddbd9',hp:740,hpL:92,atk:42,atkL:3,as:.8,rng:6.5,mr:28,mrL:1,arm:18,armL:2.2,spd:6.3,ad:.1}};
const CLS_IDS=Object.keys(CLS);
const S=(n,t,cd,o)=>Object.assign({n,t,cd},o);
const HD=(n,cls,pal,sk,fl)=>Object.assign({n,cls,pal,sk},fl||{});
const HEROES=[
  // 坦克
  HD('岩崗','tank',{skin:'#c8946a',c1:'#6a6a7a',c2:'#b8862a',hair:'#2a1a10',fx:'#ffb040'},[S('猛牛衝撞','dash',9,{r:7,a:2.5,d:80,kb:2.5}),S('岩石護甲','shield',12,{v:240}),S('地裂','pierce',9,{r:8,d:110,sl:1.5,w:2.6}),S('大地震擊','nova',40,{a:6,d:210,ku:1.2})],{helm:1,cape:1}),
  HD('鋼牙','tank',{skin:'#e0b090',c1:'#4a5a6a',c2:'#9aa8b8',hair:'#3a2a1a',fx:'#9ad8ff'},[S('鐵鍊勾拉','hook',11,{r:9,d:70,st:0.6}),S('震地踏步','nova',8,{a:3.6,d:90,sl:1.5}),S('鋼鐵之軀','buff',14,{arm:50,dur:4}),S('鋼鐵壁壘','shield',45,{v:420,ally:1})],{helm:1,horns:1}),
  HD('霜盾','tank',{skin:'#f0d0b8',c1:'#5a7aa8',c2:'#cfe8ff',hair:'#e8e8f0',fx:'#9ad8ff'},[S('寒冰飛刃','shot',8,{r:9,d:95,sl:2}),S('冰晶護盾','shield',12,{v:230,spd:0.3}),S('冰霜陷阱','trap',10,{r:7,d:90,st:1}),S('冰封領域','blast',40,{r:9,a:5,d:220,st:1.2,sl:2,dl:0.8})],{helm:1,cape:1,f:1}),
  HD('赤甲','tank',{skin:'#b8805a',c1:'#8a2a2a',c2:'#d8a040',hair:'#1a1410',fx:'#ff7a3d'},[S('烈焰踏地','nova',7,{a:3.2,d:95}),S('不動如山','buff',14,{spd:0.3,arm:40,dur:4}),S('熔岩噴發','blast',10,{r:8,a:3,d:100,ku:0.75,dl:0.7}),S('赤焰突襲','charge',38,{r:11,w:2.6,d:240,ku:1.2})],{helm:1,horns:1}),
  HD('山嶽','tank',{skin:'#a87a5a',c1:'#5a6a3a',c2:'#8a7a5a',hair:'#2a2418',fx:'#c8e870'},[S('重拳擊暈','strike',7,{r:3,d:120,st:0.8}),S('大地之息','heal',16,{v:240,self:1}),S('落石','shot',9,{r:9,d:110,kb:3}),S('山崩','storm',45,{a:6,d:70,dur:5,sl:1,self:1})],{cape:1}),
  HD('玄武','tank',{skin:'#c8a070',c1:'#2a5a4a',c2:'#6ab890',hair:'#1a2a20',fx:'#6ae0b0'},[S('甲殼衝撞','charge',9,{r:7,w:2,d:90,sl:1.5}),S('玄甲反震','buff',14,{arm:70,dur:3}),S('潮汐漩渦','storm',12,{r:8,a:3.5,d:50,dur:3}),S('玄武鎮海','dash',42,{r:9,a:3.5,d:230,ku:1.3})],{helm:1,cape:1}),
  HD('熊霸','tank',{skin:'#b07850',c1:'#6a3a1a',c2:'#c89060',hair:'#3a2010',fx:'#ffb070'},[S('熊掌拍擊','strike',7,{r:3,d:130,ku:0.6}),S('狂熊之怒','buff',13,{as:0.4,dmg:0.15,dur:4}),S('震懾咆哮','nova',11,{a:4,d:60,kb:3}),S('巨熊撲擊','dash',40,{r:8,a:3,d:280,st:1.5})],{horns:1}),
  HD('鐵壁','tank',{skin:'#d8b090',c1:'#3a4a6a',c2:'#c0c8d8',hair:'#2a2a3a',fx:'#a8c8ff'},[S('盾擊','shot',8,{r:8,d:100,st:0.8}),S('守護誓約','shield',12,{v:260,ally:1,spd:0.25}),S('盾牌衝刺','charge',10,{r:7,w:2,d:100,kb:2.5}),S('神盾震爆','nova',42,{a:6,d:220,kb:5,st:0.5})],{helm:1}),
  HD('淚魂','tank',{skin:'#9ad0b8',c1:'#c8c0a8',c2:'#e8e0c8',hair:'#3a5a4a',fx:'#7ae8c8'},[S('繃帶飛索','grapple',12,{r:10,d:80,st:1}),S('絕望光環','aura',1,{a:3,d:20}),S('暴怒','nova',9,{a:3.5,d:110,hr:1}),S('哀傷詛咒','nova',42,{a:5.5,d:200,rt:2})],{}),
  HD('花崗','tank',{skin:'#9a8a7a',c1:'#5a4a3a',c2:'#b8a890',hair:'#3a3028',fx:'#ffb070'},[S('地震碎片','strike',8,{r:8,d:110,sl:2,stl:1}),S('雷霆拍擊','empower',9,{d:50,a:3,arm:30}),S('大地猛擊','nova',8,{a:3.5,d:120,wk:2}),S('勢不可擋','dash',42,{r:10,a:3.5,d:260,ku:1.4,us:1})],{horns:1}),
  HD('鐵吼','tank',{skin:'#c89070',c1:'#4a4a52',c2:'#d0a040',hair:'#2a1a10',fx:'#ffc040'},[S('鐵壁衝鋒','charge',10,{r:7,w:2,d:90,tn:1}),S('鋼刺皮甲','buff',14,{arm:45,dur:4}),S('盾擊震盪','shot',9,{r:8,d:100,kb:2}),S('萬夫莫敵','nova',42,{a:5.5,d:200,tn:2})],{helm:1,horns:1}),
  // 戰士
  HD('烈刃','fighter',{skin:'#e8b890',c1:'#a83a2a',c2:'#e8c060',hair:'#1a1410',fx:'#ff9a3d'},[S('突進斬','dash',7,{r:6,a:2.2,d:110}),S('迴旋斬','nova',8,{a:3.3,d:120}),S('破空斬','pierce',8,{r:7,d:130}),S('斷罪一擊','exec',35,{r:4,d:220,m:0.4,kb:4})],{cape:1}),
  HD('狂瀾','fighter',{skin:'#d8a880',c1:'#2a5a8a',c2:'#8ad8ff',hair:'#3a2a1a',fx:'#5ab8ff'},[S('怒濤劈','pierce',7,{r:6.5,d:120,sl:1,w:3}),S('戰意沸騰','buff',14,{as:0.5,dur:4}),S('潮湧','dash',9,{r:7,a:2.5,d:110,sl:1.2}),S('巨浪狂瀾','pierce',40,{r:10,d:260,w:4,ku:1})],{f:1}),
  HD('斬鋒','fighter',{skin:'#f0c8a0',c1:'#4a4a5a',c2:'#d8d8e8',hair:'#c8c8d0',fx:'#ffffff'},[S('破甲重擊','strike',6,{r:3,d:150}),S('劍意','buff',12,{dmg:0.25,ls:0.2,dur:4}),S('鋼鐵意志','shield',13,{v:260}),S('千刃風暴','storm',38,{a:4,d:150,dur:3,self:1})],{helm:1}),
  HD('蒼狼','fighter',{skin:'#c8946a',c1:'#5a5a6a',c2:'#a8b0c0',hair:'#8a8a9a',fx:'#c8d8ff'},[S('狼撲','dash',8,{r:7,d:100,sl:1}),S('野性回復','heal',14,{v:200,self:1}),S('撕裂','strike',7,{r:3,d:140,dr:0.5}),S('狼王咆哮','buff',40,{dmg:0.4,spd:0.3,dur:6})],{horns:1,cape:1}),
  HD('炎拳','fighter',{skin:'#b87a50',c1:'#c85a1a',c2:'#ffd23f',hair:'#2a1a10',fx:'#ff7a1a'},[S('烈焰拳風','shot',7,{r:7,d:120,kb:2.5}),S('燃燒之拳','buff',12,{dmg:0.25,as:0.2,dur:4}),S('烈焰步','dash',9,{r:7,d:110}),S('爆裂神拳','strike',35,{r:3.2,d:420,kb:5,st:0.6})],{}),
  HD('鐵騎','fighter',{skin:'#d8a880',c1:'#5a4a3a',c2:'#c8b070',hair:'#2a1a10',fx:'#ffd890'},[S('長槍突刺','pierce',7,{r:8,d:120,w:1.6}),S('戰馬嘶鳴','buff',12,{spd:0.5,dur:3}),S('橫掃','nova',9,{a:3.8,d:110,sl:1}),S('鐵騎衝鋒','charge',40,{r:12,w:2.6,d:260,kb:4})],{helm:1,cape:1}),
  HD('刀鋒','fighter',{skin:'#e8c0a0',c1:'#6a1a2a',c2:'#e04a5a',hair:'#1a1010',fx:'#ff4a6a'},[S('吸血斬','strike',6,{r:3,d:120,dr:0.6}),S('反擊架式','shield',12,{v:220,spd:0.2}),S('迴旋刃','boom',8,{r:8,d:100}),S('血之狂宴','nova',38,{a:4,d:280,dr:0.5})],{}),
  HD('雷錘','fighter',{skin:'#d8a880',c1:'#3a3a6a',c2:'#ffd860',hair:'#e8e0c0',fx:'#ffe066'},[S('雷錘擲','shot',9,{r:9,d:120,st:0.6}),S('雷霆護體','buff',13,{arm:30,as:0.3,dur:4}),S('震地錘','blast',10,{r:6,a:3,d:120,ku:0.8,dl:0.6}),S('雷神降臨','dash',40,{r:9,a:4,d:300,st:0.6,ku:0.8})],{helm:1,cape:1}),
  HD('狂獅','fighter',{skin:'#d8a070',c1:'#a87a2a',c2:'#ffd060',hair:'#c87a20',fx:'#ffb040'},[S('獅爪撕裂','strike',6,{r:3,d:130,dr:0.3}),S('獅吼','nova',11,{a:4,d:80,fr:1}),S('撲擊','dash',9,{r:7,a:2.5,d:110,tn:0.8}),S('百獸之王','buff',40,{dmg:0.3,ls:0.25,arm:30,dur:6})],{cape:1}),
  // 刺客
  HD('夜鴉','assassin',{skin:'#e8c8a8',c1:'#2a2238',c2:'#6a4a9a',hair:'#14101a',fx:'#b98cff'},[S('鴉影瞬身','blink',8,{r:8,d:130}),S('暗刃','strike',6,{r:2.8,d:140}),S('鴉群','nova',8,{a:3.5,d:120}),S('夜幕處決','exec',30,{r:6,d:260,m:0.6,blink:1})],{hood:1,cape:1}),
  HD('影蛇','assassin',{skin:'#d8b090',c1:'#2a4a3a',c2:'#5ac88a',hair:'#1a2a1a',fx:'#5ac88a'},[S('毒牙飛鏢','shot',6,{r:9,d:140,sl:1.2}),S('蛇行','blink',10,{r:7,d:0,spd:0.5}),S('毒霧','storm',12,{r:8,a:3.5,d:60,dur:3,sl:1}),S('萬蛇噬咬','storm',35,{r:7,a:3.5,d:180,dur:3,dr:0.5})],{hood:1,f:1}),
  HD('霧刃','assassin',{skin:'#f0d0b0',c1:'#4a5a6a',c2:'#c8d8e8',hair:'#e0e0e8',fx:'#d8e8ff'},[S('霧中突襲','dash',6,{r:7,d:120}),S('隱霧','buff',12,{spd:0.5,dmg:0.2,dur:3}),S('霧刃連擊','strike',6,{r:2.8,d:150,sl:1}),S('千霧斬','chain',30,{r:7,d:240})],{hood:1}),
  HD('緋蝶','assassin',{skin:'#f8d8c0',c1:'#a8204a',c2:'#ff9ec8',hair:'#3a1020',fx:'#ff7eb6'},[S('蝶刃穿梭','boom',7,{r:8,d:120}),S('蝶舞','blink',9,{r:8,d:60}),S('蝶影','buff',12,{spd:0.5,as:0.3,dur:3}),S('緋紅花雨','nova',35,{a:4.5,d:360,sl:1.5})],{f:1,cape:1}),
  HD('疾風','assassin',{skin:'#e0b890',c1:'#3a6a5a',c2:'#b8f0d8',hair:'#2a1a10',fx:'#b8f0d8'},[S('疾風步','dash',5,{r:6,d:100}),S('裂空斬','strike',7,{r:2.8,d:130,kb:2}),S('旋風','pierce',9,{r:8,d:100,ku:0.6,w:2}),S('天風斬','chain',32,{r:8,d:260,blink:1})],{}),
  HD('幽刃','assassin',{skin:'#d8c0b0',c1:'#1a1a2a',c2:'#5a5a8a',hair:'#0a0a14',fx:'#8a8aff'},[S('幽影飛刃','shot',6,{r:9,d:130}),S('毒刺陷阱','trap',10,{r:7,d:120,sl:2}),S('致命毒刃','buff',12,{dmg:0.3,dur:3}),S('幽冥斬首','exec',30,{r:5,d:240,m:0.7,rs:1})],{hood:1}),
  HD('紅蠍','assassin',{skin:'#d8a070',c1:'#8a2a1a',c2:'#ff7a4a',hair:'#2a1010',fx:'#ff6a3a'},[S('蠍尾刺','hook',9,{r:7,d:110,st:0.4}),S('甲殼','shield',12,{v:200}),S('毒針連射','chain',9,{r:7,d:90,sl:1}),S('蠍王突襲','dash',35,{r:8,a:2.5,d:300,dr:0.5})],{horns:1}),
  HD('月影','assassin',{skin:'#f0e0d8',c1:'#2a2a5a',c2:'#c8c8ff',hair:'#c8c8e8',fx:'#c8c8ff'},[S('新月斬','pierce',7,{r:7,d:140,w:2.5}),S('月隱','buff',12,{spd:0.5,dmg:0.15,dur:3}),S('影襲','blink',9,{r:7,d:120,sl:1}),S('月之審判','boom',32,{r:10,d:320,w:3,st:0.8})],{f:1,hood:1}),
  HD('影貓','assassin',{skin:'#e8d0c0',c1:'#2a2a3a',c2:'#8a7ab8',hair:'#1a1a24',fx:'#a890ff'},[S('貓爪','strike',6,{r:2.8,d:140,sl:1}),S('潛影','buff',14,{inv:1,spd:0.4,dur:3}),S('影步','blink',9,{r:7,d:0}),S('暗影突襲','blink',35,{r:9,d:300,inv:1})],{hood:1}),
  HD('幻夜','assassin',{skin:'#c8b8c8',c1:'#1a1a2a',c2:'#a03a5a',hair:'#0a0a10',fx:'#ff4a8a'},[S('惡夢鐮刀','boom',8,{r:8,d:120,fr:0.6}),S('吸魂','shot',9,{r:9,d:110,dr:0.4}),S('驚嚇','strike',10,{r:4,d:80,fr:1.5}),S('恐懼降臨','storm',40,{r:9,a:4.5,d:100,dur:3,fr:1})],{hood:1,cape:1}),
  // 法師
  HD('星詠','mage',{skin:'#f8e0c8',c1:'#3a3a8a',c2:'#ffd23f',hair:'#f0e080',fx:'#ffe066'},[S('星芒彈','shot',5,{r:10,d:150}),S('星塵爆','blast',8,{r:9,a:3,d:130,sl:1.5,dl:0.5}),S('星光護盾','shield',13,{v:200}),S('流星雨','blast',40,{r:11,a:5.5,d:420,dl:1})],{f:1,hood:1}),
  HD('炎靈','mage',{skin:'#e8b890',c1:'#8a1a1a',c2:'#ff7a1a',hair:'#ff5a2a',fx:'#ff6a1a'},[S('火球','shot',6,{r:9,d:160}),S('烈焰射線','pierce',8,{r:9,d:150}),S('爆炎','nova',9,{a:3.5,d:140,kb:2}),S('焚天烈焰','storm',45,{r:9,a:5,d:110,dur:4})],{}),
  HD('霜語','mage',{skin:'#f8e8e0',c1:'#4a7ab8',c2:'#cfefff',hair:'#d8f0ff',fx:'#9ad8ff'},[S('冰錐','chain',6,{r:9,d:110,sl:1.5}),S('霜凍新星','blast',10,{r:9,a:3.5,d:100,st:1.2,dl:0.6}),S('冰牆','pierce',10,{r:9,d:100,st:0.8,w:3}),S('暴風雪','storm',45,{r:9,a:6,d:80,dur:5,sl:1})],{f:1,cape:1}),
  HD('雷鳴','mage',{skin:'#d8a880',c1:'#2a2a4a',c2:'#8ad8ff',hair:'#e8e8f0',fx:'#8ad8ff'},[S('雷光束','pierce',5,{r:10,d:140}),S('雷環','nova',9,{a:4,d:140,st:0.8}),S('雷霆疾步','blink',11,{r:7,d:80,st:0.6}),S('連鎖閃電','chain',40,{r:9,d:320,st:0.5})],{hood:1}),
  HD('幻月','mage',{skin:'#f0d8c8',c1:'#5a3a7a',c2:'#d8c8ff',hair:'#1a1430',fx:'#d8c8ff'},[S('月影彈','shot',5,{r:10,d:140,dr:0.3}),S('月光護盾','shield',12,{v:220}),S('月影縛','trap',10,{r:8,d:100,st:1.2}),S('月蝕光輪','boom',35,{r:12,d:300,w:3})],{f:1}),
  HD('紫煙','mage',{skin:'#e0c8d8',c1:'#4a2a5a',c2:'#b06ad8',hair:'#2a1a3a',fx:'#c07aff'},[S('毒霧彈','storm',7,{r:9,a:3,d:70,dur:3}),S('腐蝕彈','shot',8,{r:9,d:110,dr:0.4}),S('瘴氣爆發','nova',10,{a:3.5,d:120,sl:1.5}),S('毒龍吐息','pierce',40,{r:10,d:320,w:4,sl:2})],{hood:1,f:1}),
  HD('晶靈','mage',{skin:'#f0e8f8',c1:'#3a6a9a',c2:'#a8f0ff',hair:'#d0f0ff',fx:'#a8f0ff'},[S('水晶碎片','chain',6,{r:8,d:110}),S('晶體護盾','shield',13,{v:180,ally:1}),S('晶簇陷阱','trap',11,{r:8,d:90,ku:1}),S('星晶隕落','blast',40,{r:10,a:5,d:380,st:1,dl:1})],{f:1}),
  HD('咒骨','mage',{skin:'#d8d0c0',c1:'#2a2a2a',c2:'#a0e070',hair:'#e8e8e0',fx:'#a0ff70'},[S('咒骨彈','shot',7,{r:9,d:120,a:2.5}),S('亡靈護甲','shield',13,{v:230}),S('冥界之手','hook',12,{r:8,d:100,sl:2}),S('亡者之握','nova',38,{a:5.5,d:260,pl:1,sl:1.5})],{hood:1,horns:1}),
  HD('魅狐','mage',{skin:'#f8e0d0',c1:'#c83a5a',c2:'#ffb0c8',hair:'#f0f0f8',fx:'#ff8ab8'},[S('狐火球','boom',6,{r:9,d:130}),S('狐火','chain',8,{r:7,d:90,cn:3}),S('魅惑之吻','shot',11,{r:9,d:80,ch:1.4}),S('傾心之舞','nova',40,{a:5,d:220,ch:1.5})],{f:1}),
  // 射手
  HD('鷹眼','marksman',{skin:'#e0b890',c1:'#4a6a3a',c2:'#c8a060',hair:'#3a2a1a',fx:'#ffe066'},[S('專注射擊','buff',10,{as:0.6,dur:4}),S('穿甲箭','shot',8,{r:10,d:140,sl:1.5}),S('鷹之翱翔','blink',11,{r:6,d:0,back:1}),S('鷹擊長空','pierce',35,{r:16,d:420,w:2})],{hood:1}),
  HD('流星','marksman',{skin:'#f8d8c0',c1:'#c8a020',c2:'#fff0b0',hair:'#f0c040',fx:'#ffd23f'},[S('流星箭','pierce',6,{r:10,d:130}),S('翻滾','blink',8,{r:5,d:0}),S('星光連射','buff',12,{as:0.4,ls:0.2,dur:4}),S('流星箭雨','chain',40,{r:10,d:260,sl:1.5,cn:5})],{f:1}),
  HD('赤羽','marksman',{skin:'#d8a880',c1:'#a82a2a',c2:'#ffb04a',hair:'#2a1410',fx:'#ff7a3d'},[S('火羽箭','shot',6,{r:10,d:150}),S('疾奔','buff',12,{spd:0.4,dur:3}),S('焚羽','boom',8,{r:9,d:110}),S('鳳凰之箭','shot',40,{r:16,d:360,st:1.5})],{cape:1}),
  HD('疾矢','marksman',{skin:'#e8c0a0',c1:'#2a4a6a',c2:'#8ac8ff',hair:'#1a1a2a',fx:'#8ac8ff'},[S('連珠箭','buff',10,{as:0.5,dmg:0.15,dur:5}),S('爆裂箭','blast',8,{r:9,a:3,d:120,sl:1.5,dl:0.4}),S('捕網','shot',10,{r:8,d:60,sl:3}),S('致命狙擊','exec',35,{r:12,d:260,m:0.5})],{}),
  HD('銀弦','marksman',{skin:'#f8e0d0',c1:'#6a6a7a',c2:'#e0e0f0',hair:'#e8e8f0',fx:'#e0e8ff'},[S('分裂箭','chain',7,{r:9,d:110}),S('定身箭','shot',10,{r:10,d:100,st:1}),S('銀色疾風','buff',12,{spd:0.4,as:0.3,dur:4}),S('銀月衝擊','pierce',40,{r:12,d:340,w:3,kb:3})],{f:1,cape:1}),
  HD('火銃','marksman',{skin:'#d8a070',c1:'#5a3a2a',c2:'#ff9a3d',hair:'#1a1010',fx:'#ffa040'},[S('火藥彈','shot',8,{r:9,d:130,kb:2}),S('戰術翻滾','blink',9,{r:5,d:50}),S('燃燒彈','storm',11,{r:8,a:2.5,d:60,dur:3,sl:1}),S('加農砲','blast',40,{r:14,a:4,d:380,ku:0.8,dl:1.2})],{helm:1}),
  HD('風羽','marksman',{skin:'#f0d8b8',c1:'#3a8a6a',c2:'#c8ffe0',hair:'#2a3a2a',fx:'#a0ffd0'},[S('風刃箭','pierce',7,{r:10,d:120,sl:1,w:2.5}),S('順風','buff',12,{spd:0.4,as:0.3,dur:3}),S('旋風箭','shot',10,{r:9,d:80,ku:0.7}),S('龍捲風','storm',40,{r:10,a:4.5,d:100,dur:3,sl:1,mv:1})],{f:1,cape:1}),
  HD('冰弓','marksman',{skin:'#f8e8e8',c1:'#5a8ab8',c2:'#e0f4ff',hair:'#f0f0ff',fx:'#b0e0ff'},[S('寒冰連射','chain',7,{r:9,d:100,sl:1.5}),S('冰晶甲','shield',12,{v:180,spd:0.3}),S('冰霜射擊','buff',12,{as:0.4,dmg:0.1,dur:4}),S('冰封之箭','shot',40,{r:14,d:280,st:1.2,a:3.5})],{f:1,hood:1}),
  HD('雷弩','marksman',{skin:'#d8b090',c1:'#3a3a5a',c2:'#9ad8ff',hair:'#2a2a3a',fx:'#7ac8ff'},[S('雷弩齊射','pierce',7,{r:9,d:120,w:3}),S('電磁陷阱','trap',12,{r:7,d:70,st:1}),S('超載','buff',12,{as:0.6,spd:0.2,dur:3}),S('雷霆炮','blast',40,{r:12,a:4.5,d:360,sl:2,dl:0.8})],{helm:1}),
  HD('星羽','marksman',{skin:'#f8e0c8',c1:'#6a4ab8',c2:'#ffe0ff',hair:'#f0d0ff',fx:'#ffb0ff'},[S('星光箭','shot',6,{r:10,d:140,dr:0.3}),S('星躍','blink',10,{r:6,d:0,back:1,sl:1.5}),S('星辰護佑','heal',14,{v:160,self:1,cl:1}),S('星河奔流','boom',40,{r:12,d:320,w:3,sl:1.5})],{f:1,cape:1}),
  HD('暗弩','marksman',{skin:'#c8b090',c1:'#3a4a2a',c2:'#8ab060',hair:'#1a2010',fx:'#a0e060'},[S('潛伏','buff',14,{inv:1,as:0.5,dur:3}),S('毒雲瓶','blast',9,{r:9,a:3,d:90,sl:1.5,dl:0.4}),S('翻滾隱沒','blink',11,{r:5,d:0,back:1,inv:1}),S('狙殺模式','buff',40,{as:0.4,dmg:0.3,ls:0.15,dur:6})],{hood:1}),
  // 輔助
  HD('晨曦','support',{skin:'#f8e0c8',c1:'#f0e0a0',c2:'#ffd23f',hair:'#f0d080',fx:'#fff0a0'},[S('晨光治癒','heal',10,{a:8,v:170}),S('聖光彈','shot',8,{r:9,d:90,st:1}),S('日光衝擊','nova',9,{a:3.5,d:90,sl:1.5}),S('黎明審判','blast',40,{r:10,a:5,d:200,ku:1,hl:1,dl:0.8})],{f:1,cape:1}),
  HD('聖鈴','support',{skin:'#f0d0b8',c1:'#e8e8f0',c2:'#8ad8ff',hair:'#c8a060',fx:'#c8f0ff'},[S('鈴之守護','shield',10,{v:200,ally:1}),S('清音震波','pierce',9,{r:9,d:90,sl:1.5,w:3}),S('鈴音束縛','trap',11,{r:7,d:70,st:1.2}),S('天籟','heal',40,{a:10,v:450,cl:1})],{f:1}),
  HD('花語','support',{skin:'#f8d8c0',c1:'#5aa85a',c2:'#ff9ec8',hair:'#8a4a2a',fx:'#ff9ec8'},[S('藤蔓纏繞','blast',8,{r:9,a:3,d:100,st:1,dl:0.6}),S('花之癒','heal',12,{a:8,v:150}),S('花瓣護盾','shield',12,{v:200,ally:1,spd:0.2}),S('百花盛開','buff',40,{spd:0.3,dmg:0.2,dur:6,ally:1})],{f:1}),
  HD('潮汐','support',{skin:'#d8a880',c1:'#2a6a8a',c2:'#7ae8e8',hair:'#1a2a3a',fx:'#7ae8e8'},[S('浪潮之鉤','hook',11,{r:10,d:80,st:0.8}),S('水流加速','buff',12,{spd:0.4,dur:3,ally:1}),S('水泡','shot',10,{r:9,d:80,ku:1}),S('漩渦','nova',40,{a:6,d:200,ku:1,pl:1})],{}),
  HD('守望','support',{skin:'#c8946a',c1:'#6a5a3a',c2:'#e8d8a0',hair:'#2a2418',fx:'#e8d8a0'},[S('光之箭','shot',7,{r:9,d:100,sl:2}),S('守護之光','heal',12,{a:8,v:170}),S('守望之盾','shield',12,{v:220,ally:1}),S('聖域','nova',40,{a:6,d:200,st:1.5})],{helm:1,cape:1}),
  HD('靈蝶','support',{skin:'#f8e8e0',c1:'#a07ad8',c2:'#ffe0f8',hair:'#e0c0ff',fx:'#e0b0ff'},[S('蝶粉','chain',8,{r:8,d:80,sl:1}),S('蝶翼庇護','shield',11,{v:180,ally:1,spd:0.4}),S('靈光一閃','blink',12,{r:6,d:60,ally:1}),S('幻蝶之夢','storm',40,{r:9,a:4.5,d:40,dur:3,st:1})],{f:1}),
  HD('鼓手','support',{skin:'#c88a5a',c1:'#c8402a',c2:'#ffd060',hair:'#2a1a10',fx:'#ffc040'},[S('戰鼓震波','nova',9,{a:4,d:80,kb:2.5}),S('進擊鼓點','buff',12,{spd:0.3,as:0.3,dur:4,ally:1}),S('鼓舞','heal',13,{a:8,v:140,cl:1}),S('萬鼓齊鳴','nova',40,{a:6,d:180,ku:1.2,ally:1})],{}),
  HD('星護','support',{skin:'#f0d8c0',c1:'#2a3a7a',c2:'#ffe080',hair:'#f0e0a0',fx:'#ffe080'},[S('星光鎖鏈','chain',10,{r:8,d:60,st:0.6,cn:3}),S('星盾','shield',12,{v:240,ally:1}),S('星落','blast',10,{r:9,a:3,d:110,kb:2.5,dl:0.6}),S('星界守護','dash',40,{r:9,a:4,d:180,ku:1.1,ally:1})],{f:1,cape:1}),
  HD('機甲','support',{skin:'#c8c8d0',c1:'#b88a2a',c2:'#ffd860',hair:'#3a3a44',fx:'#ffe066'},[S('火箭鉤爪','hook',13,{r:11,d:90,st:0.65}),S('全速驅動','buff',14,{spd:0.6,as:0.4,dur:4}),S('上勾重拳','empower',8,{d:60,ku:1}),S('靜電力場','nova',40,{a:5.5,d:250,sil:1.5})],{helm:1}),
  HD('幽鈴','support',{skin:'#f0e0e8',c1:'#5a3a6a',c2:'#c8a8e8',hair:'#1a1020',fx:'#d0a8ff'},[S('迷魂鈴','nova',9,{a:4,d:70,fr:1}),S('安魂曲','heal',13,{a:8,v:150,cl:1}),S('魂之引','hook',13,{r:9,d:60,ch:1}),S('鎮魂結界','blast',40,{r:9,a:5,d:180,fr:1.5,dl:0.7})],{f:1,hood:1})];

// 被動技能、特殊路線
{ const F=n=>HEROES.find(h=>h.n===n);
  F('機甲').ps={k:'mshield',n:'魔力屏障',d:'血量低於 20% 時，得到等於 30% 魔力的護盾（90 秒一次）'};
  F('淚魂').ps={k:'curse',n:'詛咒之觸',d:'技能打中的敵方英雄，3 秒內受到的技能傷害 +10%'}; F('淚魂').roles=['jg','sup'];
  F('花崗').ps={k:'granite',n:'花崗岩盾',d:'10 秒沒受傷時，得到最大生命 10% 的護盾'}; }
// 召喚師技能（D、F）
const SPELLS={flash:{n:'閃現',cd:60,col:'#ffe066',d:'往滑鼠方向瞬間移動一小段，可以穿過牆和草叢'},heal:{n:'治癒',cd:60,col:'#7aff9a',d:'幫自己和附近隊友補血'},smite:{n:'重擊',cd:25,col:'#ffb040',d:'對附近的野怪或小兵造成大量傷害（打野用）'},
  ghost:{n:'鬼步',cd:50,col:'#9ad8ff',d:'走路速度大幅提升 6 秒'},exhaust:{n:'虛弱',cd:60,col:'#c08aff',d:'讓附近一個敵方英雄變慢、傷害降低 40%，持續 3 秒'},ignite:{n:'點燃',cd:60,col:'#ff6a2a',d:'點燃附近一個敵方英雄，5 秒內持續造成真實傷害，被點燃時補血效果減半'},cleanse:{n:'淨化',cd:60,col:'#ff9ec8',d:'解除暈眩和緩速'}};
HEROES.forEach((h,i)=>{ h.i=i; if(!h.pal.c3) h.pal.c3=['#3a3a48','#4a3a2a','#2a2a38','#3a4a3a'][i%4]; });
const SK_TXT={dash:'衝到指定位置',blink:'瞬間移動',strike:'重擊眼前的敵人',nova:'對身邊的敵人造成傷害',blast:'在指定位置引爆（地上先出現預警圈，可以閃開）',shot:'射出飛彈，打中第一個敵人（可以閃開）',pierce:'射出一道穿透波，路上的敵人都會中（可以閃開）',shield:'得到護盾',heal:'治療',buff:'強化自己',exec:'對殘血敵人造成大量傷害',hook:'甩出鉤子，鉤中第一個敵人並拉過來（可以閃開）',storm:'持續傷害一片區域',charge:'往前衝鋒，撞到的敵人都會中',boom:'丟出迴旋飛刃，去程和回程都會打中',trap:'在地上放陷阱，敵人踩到才觸發（最多 3 個）',chain:'打中目標後彈到附近的敵人',empower:'強化下一次普攻',grapple:'甩出繃帶，打中後把自己拉到敵人身邊（可以閃開）',aura:'開關光環：開啟時持續傷害身邊的敵人，會一直消耗魔力'};
function skDesc(s){ let t=SK_TXT[s.t]; if(s.t==='heal') t=s.self?'治療自己':'治療自己和附近隊友'; if(s.t==='shield') t=s.ally?'給自己和附近隊友護盾':'給自己護盾'; if(s.t==='buff'&&s.ally) t='強化自己和附近隊友'; if(s.back) t='往後翻滾閃開'; if(s.t==='chain'&&s.blink) t='在敵人之間來回穿梭斬擊（期間不會被打中）';
  const ex=[]; if(s.ku) ex.push('擊飛'); if(s.kb) ex.push('擊退'); if(s.pl) ex.push('把敵人吸過來'); if(s.tn) ex.push('嘲諷 '+s.tn+' 秒（強制來打你）'); if(s.fr) ex.push('恐懼 '+s.fr+' 秒（嚇得亂跑）'); if(s.ch) ex.push('魅惑 '+s.ch+' 秒（被吸過來）'); if(s.inv) ex.push('隱身（敵人看不到你，攻擊或放技能就現身）'); if(s.sil) ex.push('沉默 '+s.sil+' 秒（不能放技能）'); if(s.rt) ex.push('定身 '+s.rt+' 秒（不能移動）'); if(s.st) ex.push('暈眩 '+s.st+' 秒'); if(s.wk) ex.push('降低敵人攻擊'); if(s.us) ex.push('衝刺時不受控制'); if(s.hr) ex.push('被普攻時冷卻縮短'); if(s.stl) ex.push('偷取移動速度'); if(s.t==='empower'&&s.a) ex.push('波及周圍敵人'); if(s.t==='empower'&&s.arm) ex.push('並增加護甲'); if(s.sl) ex.push('緩速'); if(s.dr) ex.push('吸血'); if(s.cl) ex.push('解除控制'); if(s.hl) ex.push('治療範圍內隊友'); if(s.ally&&!['shield','heal','buff'].includes(s.t)) ex.push('隊友得到護盾'); if(s.rs) ex.push('擊殺重置冷卻'); if(s.ls) ex.push('吸血'); if(s.spd&&['shield','blink'].includes(s.t)) ex.push('加速'); return t+(ex.length?'，'+ex.join('、'):''); }
// 裝備（參考英雄聯盟）：基本材料 → 合成成品（材料會折抵價錢）；act＝主動技能（數字鍵 1～6）
const ITEMS={
  // 基本材料
  sword:{n:'長劍',c:350,atk:12,cat:'atk',col:'#c8ccd8'},dagger:{n:'短劍',c:300,as:.12,cat:'atk',col:'#9ad870'},cloak:{n:'敏捷披風',c:600,crit:.15,cat:'atk',col:'#f0d070'},
  sheen:{n:'咒刃石',c:700,sb:{a:1},cat:'atk',col:'#a8e8ff',d:'咒刃：放完技能後，下一次普攻多打 100% 基礎攻擊'},
  tome:{n:'增幅典籍',c:435,sp:.12,cat:'mag',col:'#a88cff'},rod:{n:'巨型魔杖',c:850,sp:.25,cat:'mag',col:'#8a5aff'},gem:{n:'靈巧寶石',c:350,cdr:.06,mp:200,cat:'mag',col:'#6ad0ff'},
  ruby:{n:'紅水晶',c:400,hp:150,cat:'def',col:'#ff6a7a'},belt:{n:'巨人腰帶',c:900,hp:350,cat:'def',col:'#d0705a'},cloth:{n:'布甲',c:300,arm:15,cat:'def',col:'#a8b4c8'},mantle:{n:'抗魔斗篷',c:450,mr:25,cat:'def',col:'#9a7ad8'},
  // 起始裝備（只能帶一件，後期自動賣掉）、消耗品
  dblade:{n:'新手之劍',ic:'新劍',c:450,atk:8,hp:80,ls:.03,st:1,cat:'misc',col:'#e8a070',d:'起始裝備（只能帶一件）'},dring:{n:'新手之戒',ic:'新戒',c:400,sp:.08,hp:70,mp:100,st:1,cat:'misc',col:'#c0a0ff',d:'起始裝備（只能帶一件）'},
  dshield:{n:'新手之盾',ic:'新盾',c:450,hp:110,arm:6,rg:2.5,st:1,cat:'misc',col:'#8ab0e0',d:'起始裝備（只能帶一件）'},
  pot:{n:'補血藥水',c:50,cons:1,cat:'misc',col:'#ff4a5a',d:'喝下去 12 秒內回復 120 生命（最多帶 5 瓶，放在同一格）'},
  elx:{n:'戰鬥藥劑',c:400,elix:1,cat:'misc',col:'#ff9a3d',d:'9 等以上才能買，買了馬上喝：3 分鐘內攻擊 +25、技能威力 +20%（不佔格子）'},
  // 打野專屬（要帶重擊、三選一）：打野怪累積成長 → 12 層重擊可以打英雄 → 25 層幼獸覺醒
  jgf:{n:'烈焰幼獸',ic:'火獸',c:450,atk:10,jg:1,jgt:'f',st:1,keep:1,cat:'misc',col:'#ff7a3d',d:'打野專屬（要帶重擊）：打野怪傷害、金幣、經驗 +30%，打完野怪回血。打 12 層後重擊可以打英雄；25 層覺醒：打到敵方英雄時燃燒，多一段真實傷害'},
  jgw:{n:'疾風幼獸',ic:'風獸',c:450,atk:10,jg:1,jgt:'w',st:1,keep:1,cat:'misc',col:'#7ae0ff',d:'打野專屬（要帶重擊）：打野怪傷害、金幣、經驗 +30%，打完野怪回血。打 12 層後重擊可以打英雄；25 層覺醒：脫離戰鬥時移動速度 +25%'},
  jgm:{n:'苔岩幼獸',ic:'岩獸',c:450,atk:10,jg:1,jgt:'m',st:1,keep:1,cat:'misc',col:'#8ad06a',d:'打野專屬（要帶重擊）：打野怪傷害、金幣、經驗 +30%，打完野怪回血。打 12 層後重擊可以打英雄；25 層覺醒：脫離戰鬥 6 秒得到護盾'},
  // 輔助專屬：賺金幣升級，最後可以插眼
  sup1:{n:'星界地圖',ic:'地圖',c:400,hp:40,sp:.05,sup:1,st:1,keep:1,cat:'misc',col:'#ffd8a0',d:'輔助專屬：隊友在旁邊時，打殘血小兵會直接收掉，你和隊友都拿金幣（3 次，18 秒回 1 次）；打敵方英雄也賺金幣。賺 400 金升級成符文羅盤'},
  sup2:{n:'符文羅盤',ic:'羅盤',c:400,hp:150,arm:8,mr:8,sp:.1,sup:2,st:1,keep:1,hide:1,cat:'misc',col:'#ffc070',d:'輔助專屬（星界地圖升級）：效果一樣，再賺到 1000 金變成世界之眼，可以插眼'},
  sup3:{n:'世界之眼',ic:'世眼',c:400,hp:250,arm:12,mr:12,sp:.15,cdr:.1,sup:3,st:1,keep:1,hide:1,act:{k:'ward',cd:1},cat:'misc',col:'#ffb040',d:'輔助專屬最終型態：主動插一個綠眼（最多 3 次，回泉水補滿，每 50 秒回 1 次），可以多放 2 個眼'},
  // 鞋子
  boots:{n:'鞋子',c:300,spd:.08,cat:'misc',col:'#c8a060'},
  swift:{n:'疾行之靴',c:900,from:['boots'],spd:.16,cat:'misc',col:'#e0b060'},lucid:{n:'明智之靴',c:950,from:['boots'],spd:.1,cdr:.15,cat:'misc',col:'#7ad0ff'},
  bers:{n:'狂暴之靴',c:1100,from:['boots','dagger'],spd:.1,as:.3,cat:'misc',col:'#b8e070'},
  steel:{n:'鋼鐵護脛',c:1000,from:['boots','cloth'],spd:.1,arm:20,cat:'misc',col:'#8a9ab0'},merc:{n:'水銀之靴',c:1100,from:['boots','mantle'],spd:.1,mr:25,ten:.3,cat:'misc',col:'#b0a0d8'},
  sorc:{n:'法師之靴',c:1100,from:['boots','tome'],spd:.1,sp:.1,mpen:.1,cat:'misc',col:'#b090ff'},
  // 攻擊
  exec:{n:'斷魂利刃',c:800,from:['sword'],atk:20,gw:1,cat:'atk',col:'#a03a3a',d:'重傷：打到敵方英雄時，他 3 秒內補血效果 -40%'},
  axe:{n:'狂戰斧',c:1200,from:['sword','dagger'],atk:30,as:.2,cat:'atk',col:'#ff7a3d'},bow:{n:'速射弓',c:1150,from:['dagger','dagger'],atk:15,as:.4,cat:'atk',col:'#86dc4f'},
  blade:{n:'嗜血刀',c:1500,from:['sword','sword'],atk:45,ls:.18,cat:'atk',col:'#ff4a4a'},great:{n:'斬鐵大劍',c:2100,from:['sword','sword','sword'],atk:75,cat:'atk',col:'#e8e8f0'},
  ldr:{n:'破甲重錘',c:2300,from:['sword','sword'],atk:35,pen:.35,cat:'atk',col:'#c0c0c0',d:'無視敵人 35% 護甲'},
  ie:{n:'破曉巨刃',c:3000,from:['sword','sword','cloak'],atk:60,crit:.25,critd:.35,cat:'atk',col:'#ffe08a',d:'暴擊傷害提高（175% → 210%）'},
  pd:{n:'幻影雙刃',c:2500,from:['dagger','dagger','cloak'],as:.4,crit:.25,spd:.07,cat:'atk',col:'#d8b0ff'},
  tri:{n:'三相神劍',c:3100,from:['sheen','sword','dagger'],atk:30,as:.25,hp:200,cdr:.1,sb:{a:2},cat:'atk',col:'#ffd060',d:'咒刃：放完技能後，下一次普攻多打 200% 基礎攻擊'},
  hydra:{n:'破浪巨斧',c:2000,from:['sword','sword','ruby'],atk:40,ls:.1,hp:150,cat:'atk',col:'#ff9a3d',act:{k:'cleave',cd:10},d:'主動：橫掃身邊，周圍敵人都受傷'},
  ghost:{n:'幽影之刃',c:1800,from:['sword','dagger','gem'],atk:40,cdr:.1,mp:200,cat:'atk',col:'#7a6aa8',act:{k:'haste',cd:45},d:'主動：5 秒內跑更快、攻擊更快'},
  qss:{n:'淨化彎刀',c:1900,from:['sword','mantle'],atk:35,mr:30,cat:'atk',col:'#c8f0ff',act:{k:'qss',cd:60},d:'主動：解除暈眩、緩速、虛弱、點燃（暈眩時也能用）'},
  ga:{n:'守護天使',ic:'天使',c:2800,from:['sword','cloth','cloth'],atk:35,arm:40,ga:1,pcd:240,cat:'atk',col:'#fff2b0',d:'被擊殺時改成金身 3 秒，再用一半生命復活（240 秒一次）'},
  // 法術
  staff:{n:'大法杖',c:1800,from:['tome','tome'],sp:.4,cat:'mag',col:'#c56bff'},crown:{n:'智慧之冠',c:1500,from:['tome','gem'],sp:.25,hp:150,cdr:.15,mp:350,cat:'mag',col:'#ffd23f'},
  morello:{n:'禁咒魔典',c:2200,from:['tome','ruby'],sp:.3,hp:250,cdr:.1,gw:1,cat:'mag',col:'#8a3a6a',d:'重傷：技能打到敵方英雄時，他 3 秒內補血效果 -40%'},
  void:{n:'虛空法杖',c:2500,from:['rod','tome'],sp:.35,mpen:.35,cat:'mag',col:'#6a3aa8',d:'無視敵人 35% 魔抗'},
  lich:{n:'巫毒魔刃',c:2900,from:['sheen','rod'],sp:.35,cdr:.1,spd:.05,sb:{a:.75,m:90,mag:1},cat:'mag',col:'#4ad0c0',d:'咒刃：放完技能後，下一次普攻多打一次魔法傷害'},
  banshee:{n:'女妖面紗',c:2500,from:['rod','mantle'],sp:.3,mr:40,ss:1,pcd:40,cat:'mag',col:'#5a8ad8',d:'法術護盾：每 40 秒擋掉一次敵方技能（傷害和暈眩都擋）'},
  cap:{n:'死亡法帽',c:3200,from:['rod','rod'],sp:.75,cat:'mag',col:'#3a2a6a',d:'大幅提高技能威力'},
  hourglass:{n:'時光沙漏',c:2000,from:['tome','cloth','cloth'],sp:.3,arm:30,cat:'mag',col:'#ffcf6a',act:{k:'stasis',cd:90},d:'主動：變成金身 2.5 秒，不會受傷但也不能動'},
  gun:{n:'電漿槍刃',c:2200,from:['sword','tome'],atk:30,sp:.25,ls:.1,cat:'mag',col:'#ff6ad0',act:{k:'gun',cd:40},d:'主動：電擊附近一個敵方英雄並讓他變慢'},
  // 防禦
  plate:{n:'守護戰甲',ic:'戰甲',c:1600,from:['ruby','cloth'],arm:45,hp:400,cat:'def',col:'#7aa8ff'},amulet:{n:'聖光吊墜',c:1300,from:['ruby','gem'],hp:400,mr:20,heal:.3,mp:250,cat:'def',col:'#fff0a0'},
  thorn:{n:'荊棘之甲',c:2500,from:['cloth','cloth','ruby'],arm:60,hp:300,thorn:1,cat:'def',col:'#6a8a5a',d:'被普攻時反彈傷害，並讓打你的英雄受到重傷'},
  visage:{n:'振奮盔甲',c:2400,from:['ruby','mantle'],hp:400,mr:45,cdr:.1,hin:.25,cat:'def',col:'#5ad08a',d:'受到的治療和吸血效果 +25%'},
  warmog:{n:'狂徒鎧甲',c:3000,from:['belt','ruby'],hp:900,wm:1,cat:'def',col:'#e05a4a',d:'6 秒沒受傷時，每秒回復 3% 生命'},
  locket:{n:'守護聖匣',ic:'聖匣',c:1800,from:['ruby','mantle','gem'],hp:250,arm:20,mr:25,cdr:.1,mp:200,cat:'def',col:'#ffe0a0',act:{k:'locket',cd:60},d:'主動：身邊隊友都得到護盾'},
  randuin:{n:'蠻王之盾',c:2300,from:['ruby','cloth','cloth'],hp:350,arm:50,cat:'def',col:'#8a7a6a',act:{k:'slowaura',cd:60},d:'主動：身邊的敵人全部變慢'}};
// 眼（第 7 格，免費、二選一）
const TRINK={g:{n:'綠眼',col:'#5fff7a',cd:45,s:'插在地上 90 秒，看見暗處和草叢',d:'插在地上 90 秒，看得到周圍和草叢裡的敵人（最多 3 個）'},r:{n:'紅眼',col:'#ff5a5a',cd:60,s:'掃描身邊，找出敵人的綠眼來清掉',d:'8 秒內掃描身邊，找出敵人的綠眼，點三下就能清掉'}};
const BUILD={tank:['dshield','merc','locket','thorn','visage','randuin','warmog'],fighter:['dblade','steel','tri','ldr','visage','ga','thorn'],assassin:['dblade','lucid','ghost','hydra','ldr','ga','qss'],
  mage:['dring','sorc','lich','cap','void','banshee','hourglass'],marksman:['dblade','bers','ie','pd','ldr','blade','ga'],support:['sup1','lucid','locket','amulet','banshee','visage','randuin']};
const MIN={melee:{hp:400,atk:22,as:.9,rng:1.8,arm:10,spd:3.7,r:.55,gold:25,xp:50},ranged:{hp:280,atk:30,as:.8,rng:6.5,arm:5,spd:3.7,r:.5,gold:20,xp:40},cannon:{hp:900,atk:48,as:.7,rng:6.5,arm:22,spd:3.4,r:.9,gold:80,xp:90}};
const BOTN=['阿凱','小雨','大熊','米可','老王','阿哲','小魚','肉丸','阿樂','皮蛋','花生','豆豆','阿光','小綠','黑皮','飯糰','可樂','阿寶','小虎','布丁'];
const ROLES=[['top','上路'],['jg','打野'],['mid','中路'],['bot','下路'],['sup','輔助']];
const ROLE_N=Object.fromEntries(ROLES);
/* ================= 頭像（2D） ================= */
function portrait(c,x,y,s,d){ const P=d.pal,cl=CLS[d.cls]; c.save(); c.translate(x,y); c.scale(s/60,s/60);
  c.beginPath(); c.arc(0,0,30,0,TAU); c.save(); c.clip(); const g=c.createRadialGradient(-8,-12,4,0,0,36); g.addColorStop(0,shadeHex(cl.col,1.3)); g.addColorStop(1,shadeHex(cl.col,.45)); c.fillStyle=g; c.fillRect(-30,-30,60,60);
  if(d.cape){ c.fillStyle=P.cape||P.c2; c.beginPath(); c.moveTo(-24,30); c.lineTo(-18,4); c.lineTo(18,4); c.lineTo(24,30); c.fill(); }
  c.fillStyle=P.c1; c.beginPath(); c.moveTo(-22,30); c.quadraticCurveTo(-20,8,0,8); c.quadraticCurveTo(20,8,22,30); c.fill(); c.fillStyle=P.c2; c.fillRect(-4,10,8,20); if(d.cls==='tank'||d.cls==='fighter'){ for(const s2 of [-1,1]){ c.beginPath(); c.ellipse(s2*15,12,8,5,0,0,TAU); c.fill(); } }
  c.fillStyle=P.skin; c.fillRect(-4,2,8,8); c.beginPath(); c.ellipse(0,-6,10,12,0,0,TAU); c.fill();
  c.fillStyle=P.hair; c.beginPath(); c.ellipse(0,-12,11,7,0,PI,0); c.fill(); if(d.f){ c.fillRect(-11,-12,4,18); c.fillRect(7,-12,4,18); }
  if(d.helm){ c.fillStyle=P.c2; c.beginPath(); c.ellipse(0,-11,12,9,0,PI,0); c.fill(); c.fillRect(-12,-12,24,3); }
  if(d.hood){ c.fillStyle=P.c2; c.beginPath(); c.moveTo(-13,4); c.quadraticCurveTo(-15,-22,0,-22); c.quadraticCurveTo(15,-22,13,4); c.lineTo(9,4); c.quadraticCurveTo(10,-14,0,-15); c.quadraticCurveTo(-10,-14,-9,4); c.fill(); }
  if(d.horns){ c.fillStyle='#f0e6d0'; for(const s2 of [-1,1]){ c.beginPath(); c.moveTo(s2*7,-16); c.lineTo(s2*14,-28); c.lineTo(s2*11,-14); c.fill(); } }
  if(d.cls==='assassin'){ c.fillStyle='#1a1820'; c.fillRect(-10,-4,20,6); }
  c.fillStyle='#1a1420'; c.fillRect(-5,-8,2.6,2.6); c.fillRect(2.4,-8,2.6,2.6);
  c.restore(); c.strokeStyle='rgba(255,255,255,.75)'; c.lineWidth=2; c.beginPath(); c.arc(0,0,29,0,TAU); c.stroke(); c.restore(); }
function shadeHex(h,k){ const n=parseInt(String(h).slice(1),16); if(isNaN(n)) return h; const f=v=>clamp(Math.round(k>1?v+(255-v)*(k-1):v*k),0,255); return 'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')'; }
window.__MOBA={SPELLS,HEROES,CLS,ITEMS,TRINK,BUILD,MIN,buildMap,ROLES,skDesc,portrait,polyl,along,project,segD,mul,TEAMC};
})();
