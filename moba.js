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
    const big=[[-22,-22,0],[22,22,1]],small=[[-47,-20],[-20,-47],[-40,-32],[47,20],[20,47],[40,32]];
    M.camps=[{x:big[0][0],z:big[0][1],big:1,kind:0,col:'#c08aff',side:0},{x:big[1][0],z:big[1][1],big:1,kind:1,col:'#8affc8',side:1}].concat(small.map((p,i)=>({x:p[0],z:p[1],big:0,kind:i,side:i<3?0:1})));
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
  M.lanes.forEach(L=>{ let prev=-1; for(let s=8;s<=L.len-7.9;s+=8){ const p=along(L,Math.min(s,L.len)),i=node(p[0],p[1]); if(prev>=0) E.push([prev,i]); prev=i; } }); // 頭尾 8 公尺是主堡，不放點
  if(M.river){ let prev=-1; for(let t=-58;t<=58;t+=8){ const i=node(t,t); if(prev>=0) E.push([prev,i]); prev=i; } }
  const nearest=(x,z,skip)=>{ let b=-1,bd=1e9; N.forEach((q,i)=>{ if(skip&&skip.has(i)) return; const d=Math.hypot(q[0]-x,q[1]-z); if(d<bd){ bd=d; b=i; } }); return b; };
  M.camps.forEach(cp=>{ const ci=node(cp.x,cp.z); cp.node=ci; const sk=new Set([ci]); for(let k=0;k<2;k++){ const j=nearest(cp.x,cp.z,sk); sk.add(j); E.push([ci,j]); } });
  M.camps.forEach(a=>M.camps.forEach(b=>{ if(a!==b&&a.side===b.side&&a.node<b.node&&Math.hypot(a.x-b.x,a.z-b.z)<30) E.push([a.node,b.node]); }));
  M.N=N; M.E=E; M.adj=N.map(()=>[]); E.forEach(([a,b])=>{ const d=Math.hypot(N[a][0]-N[b][0],N[a][1]-N[b][1]); M.adj[a].push([b,d]); M.adj[b].push([a,d]); });
  // 障礙物：樹叢、大石頭（不擋路、不擋河、不擋營地和路網）
  M.obst=[]; if(mode===0){ for(let k=0;k<2600&&M.obst.length<70;k++){ const x=(R()-.5)*124,z=(R()-.5)*124,r=2.4+R()*3;
      if(M.laneDist(x,z)<M.laneW/2+r+1.5) continue; if(M.riverDist(x,z)<M.river.w/2+r+1.5) continue; if(M.base.concat(M.fount).some(b=>Math.hypot(x-b[0],z-b[1])<18+r)) continue;
      if(M.camps.some(c=>Math.hypot(x-c.x,z-c.z)<(c.big?10:7)+r)) continue; if(E.some(([a,b])=>segD(x,z,N[a][0],N[a][1],N[b][0],N[b][1])<r+3.2)) continue; if(M.obst.some(o=>Math.hypot(o.x-x,o.z-z)<o.r+r+3.5)) continue;
      M.obst.push({x,z,r,k:R()<.28?'rock':'tree'}); } }
  M.nearestNode=(x,z)=>nearest(x,z);
  M.path=(x0,z0,x1,z1)=>{ const s=nearest(x0,z0),g=nearest(x1,z1); if(s===g) return [[x1,z1]]; const dd=N.map(()=>1e9),pv=N.map(()=>-1),done=new Set(); dd[s]=0;
    for(;;){ let u=-1,ud=1e9; for(let i=0;i<N.length;i++) if(!done.has(i)&&dd[i]<ud){ ud=dd[i]; u=i; } if(u<0||u===g) break; done.add(u); for(const [v,w] of M.adj[u]) if(dd[u]+w<dd[v]){ dd[v]=dd[u]+w; pv[v]=u; } }
    const out=[[x1,z1]]; let c=g; while(c>=0&&c!==s){ out.unshift(N[c].slice()); c=pv[c]; } return out; };
  return M; }
/* ================= 英雄、技能、裝備 ================= */
const CLS={tank:{n:'坦克',col:'#7aa8ff',hp:1050,hpL:125,atk:52,atkL:4,as:.8,rng:2.4,arm:32,armL:3.2,spd:6.2,ad:.3},
  fighter:{n:'戰士',col:'#ffb04a',hp:880,hpL:108,atk:62,atkL:6,as:.9,rng:2.4,arm:22,armL:2.6,spd:6.4,ad:.6},
  assassin:{n:'刺客',col:'#ff5d8f',hp:700,hpL:86,atk:66,atkL:7,as:1,rng:2.2,arm:16,armL:2,spd:6.8,ad:.7},
  mage:{n:'法師',col:'#b98cff',hp:620,hpL:76,atk:46,atkL:3,as:.75,rng:7,arm:12,armL:1.6,spd:6.2,ad:.1},
  marksman:{n:'射手',col:'#86dc4f',hp:600,hpL:76,atk:58,atkL:6.5,as:.95,rng:7.5,arm:12,armL:1.6,spd:6.3,ad:.6},
  support:{n:'輔助',col:'#3ddbd9',hp:740,hpL:92,atk:42,atkL:3,as:.8,rng:6.5,arm:18,armL:2.2,spd:6.3,ad:.1}};
const CLS_IDS=Object.keys(CLS);
const S=(n,t,cd,o)=>Object.assign({n,t,cd},o);
const HD=(n,cls,pal,sk,fl)=>Object.assign({n,cls,pal,sk},fl||{});
const HEROES=[
  // 坦克
  HD('岩崗','tank',{skin:'#c8946a',c1:'#6a6a7a',c2:'#b8862a',hair:'#2a1a10',fx:'#ffb040'},[S('猛牛衝撞','dash',8,{r:7,a:2.5,d:80,st:.8}),S('岩石護甲','shield',12,{v:240}),S('大地震擊','nova',40,{a:6,d:210,st:1.4})],{helm:1,cape:1}),
  HD('鋼牙','tank',{skin:'#e0b090',c1:'#4a5a6a',c2:'#9aa8b8',hair:'#3a2a1a',fx:'#9ad8ff'},[S('鐵鍊勾拉','pull',10,{r:8,d:70,st:.6}),S('震地踏步','nova',8,{a:3.6,d:90,sl:1.5}),S('鋼鐵壁壘','shield',45,{v:420,ally:1})],{helm:1,horns:1}),
  HD('霜盾','tank',{skin:'#f0d0b8',c1:'#5a7aa8',c2:'#cfe8ff',hair:'#e8e8f0',fx:'#9ad8ff'},[S('寒冰飛刃','shot',8,{r:9,d:95,sl:2}),S('冰晶護盾','shield',12,{v:260}),S('冰封領域','blast',40,{r:9,a:5,d:220,st:1.2})],{helm:1,cape:1,f:1}),
  HD('赤甲','tank',{skin:'#b8805a',c1:'#8a2a2a',c2:'#d8a040',hair:'#1a1410',fx:'#ff7a3d'},[S('烈焰踏地','nova',7,{a:3.2,d:95}),S('不動如山','buff',14,{spd:.3,arm:40,dur:4}),S('赤焰突襲','dash',38,{r:10,a:4,d:240,st:1.2})],{helm:1,horns:1}),
  HD('山嶽','tank',{skin:'#a87a5a',c1:'#5a6a3a',c2:'#8a7a5a',hair:'#2a2418',fx:'#c8e870'},[S('重拳擊暈','strike',6,{r:3,d:120,st:.8}),S('大地之息','heal',16,{v:240,self:1}),S('山崩','storm',45,{a:6,d:70,dur:5,sl:1,self:1})],{cape:1}),
  // 戰士
  HD('烈刃','fighter',{skin:'#e8b890',c1:'#a83a2a',c2:'#e8c060',hair:'#1a1410',fx:'#ff9a3d'},[S('突進斬','dash',7,{r:6,a:2.2,d:110}),S('迴旋斬','nova',8,{a:3.3,d:120}),S('斷罪一擊','exec',35,{r:4,d:220,m:.4})],{cape:1}),
  HD('狂瀾','fighter',{skin:'#d8a880',c1:'#2a5a8a',c2:'#8ad8ff',hair:'#3a2a1a',fx:'#5ab8ff'},[S('怒濤劈','pierce',7,{r:6.5,d:120}),S('戰意沸騰','buff',14,{as:.5,dur:4}),S('海嘯','blast',40,{r:7,a:4.5,d:260,st:1})],{f:1}),
  HD('斬鋒','fighter',{skin:'#f0c8a0',c1:'#4a4a5a',c2:'#d8d8e8',hair:'#c8c8d0',fx:'#ffffff'},[S('破甲重擊','strike',6,{r:3,d:150}),S('疾步','dash',10,{r:6,d:80}),S('千刃風暴','nova',38,{a:4.5,d:280,sl:2})],{helm:1}),
  HD('蒼狼','fighter',{skin:'#c8946a',c1:'#5a5a6a',c2:'#a8b0c0',hair:'#8a8a9a',fx:'#c8d8ff'},[S('狼撲','dash',8,{r:7,d:100,sl:1}),S('野性回復','heal',14,{v:200,self:1}),S('狼王咆哮','buff',40,{dmg:.4,spd:.3,dur:6})],{horns:1,cape:1}),
  HD('炎拳','fighter',{skin:'#b87a50',c1:'#c85a1a',c2:'#ffd23f',hair:'#2a1a10',fx:'#ff7a1a'},[S('火焰衝擊波','nova',7,{a:3,d:110}),S('擒拿','pull',12,{r:6,d:80,st:.5}),S('爆裂神拳','strike',35,{r:3.2,d:420,st:1})],{}),
  // 刺客
  HD('夜鴉','assassin',{skin:'#e8c8a8',c1:'#2a2238',c2:'#6a4a9a',hair:'#14101a',fx:'#b98cff'},[S('鴉影瞬身','blink',8,{r:8,d:130}),S('暗刃','strike',6,{r:2.8,d:140}),S('夜幕處決','exec',30,{r:6,d:260,m:.6,blink:1})],{hood:1,cape:1}),
  HD('影蛇','assassin',{skin:'#d8b090',c1:'#2a4a3a',c2:'#5ac88a',hair:'#1a2a1a',fx:'#5ac88a'},[S('毒牙飛鏢','shot',6,{r:9,d:140,sl:1.2}),S('蛇行','blink',10,{r:7,d:90}),S('萬蛇噬咬','blast',35,{r:7,a:3.5,d:340})],{hood:1,f:1}),
  HD('霧刃','assassin',{skin:'#f0d0b0',c1:'#4a5a6a',c2:'#c8d8e8',hair:'#e0e0e8',fx:'#d8e8ff'},[S('霧中突襲','dash',6,{r:7,d:120}),S('隱霧','buff',12,{spd:.5,dmg:.2,dur:3}),S('霧殺','exec',30,{r:7,d:300,m:.5,blink:1})],{hood:1}),
  HD('緋蝶','assassin',{skin:'#f8d8c0',c1:'#a8204a',c2:'#ff9ec8',hair:'#3a1020',fx:'#ff7eb6'},[S('蝶刃穿梭','pierce',7,{r:7,d:140}),S('蝶舞','blink',9,{r:8,d:60}),S('緋紅花雨','nova',35,{a:4,d:380})],{f:1,cape:1}),
  HD('疾風','assassin',{skin:'#e0b890',c1:'#3a6a5a',c2:'#b8f0d8',hair:'#2a1a10',fx:'#b8f0d8'},[S('疾風步','dash',5,{r:6,d:100}),S('裂空斬','strike',7,{r:2.8,d:130,sl:1}),S('風之終結','exec',32,{r:9,d:320,m:.4,blink:1})],{}),
  // 法師
  HD('星詠','mage',{skin:'#f8e0c8',c1:'#3a3a8a',c2:'#ffd23f',hair:'#f0e080',fx:'#ffe066'},[S('星芒彈','shot',5,{r:10,d:150}),S('星塵爆','blast',8,{r:9,a:3,d:130,sl:1.5}),S('流星雨','blast',40,{r:10,a:5.5,d:380})],{f:1,hood:1}),
  HD('炎靈','mage',{skin:'#e8b890',c1:'#8a1a1a',c2:'#ff7a1a',hair:'#ff5a2a',fx:'#ff6a1a'},[S('火球','blast',6,{r:9,a:3,d:160}),S('烈焰射線','pierce',8,{r:9,d:150}),S('焚天烈焰','storm',45,{r:9,a:5,d:110,dur:4})],{}),
  HD('霜語','mage',{skin:'#f8e8e0',c1:'#4a7ab8',c2:'#cfefff',hair:'#d8f0ff',fx:'#9ad8ff'},[S('冰錐','shot',6,{r:10,d:130,sl:2}),S('霜凍新星','blast',10,{r:9,a:3.5,d:100,st:1.2}),S('暴風雪','storm',45,{r:9,a:6,d:80,dur:5,sl:1})],{f:1,cape:1}),
  HD('雷鳴','mage',{skin:'#d8a880',c1:'#2a2a4a',c2:'#8ad8ff',hair:'#e8e8f0',fx:'#8ad8ff'},[S('雷光束','pierce',5,{r:10,d:140}),S('雷環','nova',9,{a:4,d:140,st:.8}),S('天雷','blast',40,{r:11,a:5,d:420,st:.8})],{hood:1}),
  HD('幻月','mage',{skin:'#f0d8c8',c1:'#5a3a7a',c2:'#d8c8ff',hair:'#1a1430',fx:'#d8c8ff'},[S('月影彈','shot',5,{r:10,d:140}),S('月光護盾','shield',12,{v:220}),S('月蝕光輪','pierce',35,{r:12,d:400,w:3})],{f:1}),
  // 射手
  HD('鷹眼','marksman',{skin:'#e0b890',c1:'#4a6a3a',c2:'#c8a060',hair:'#3a2a1a',fx:'#ffe066'},[S('專注射擊','buff',10,{as:.6,dur:4}),S('穿甲箭','shot',8,{r:10,d:140,sl:1.5}),S('鷹擊長空','pierce',35,{r:14,d:420})],{hood:1}),
  HD('流星','marksman',{skin:'#f8d8c0',c1:'#c8a020',c2:'#fff0b0',hair:'#f0c040',fx:'#ffd23f'},[S('流星箭','pierce',6,{r:10,d:130}),S('翻滾','blink',9,{r:5,d:0,back:1}),S('箭雨','storm',40,{r:10,a:5,d:120,dur:3})],{f:1}),
  HD('赤羽','marksman',{skin:'#d8a880',c1:'#a82a2a',c2:'#ffb04a',hair:'#2a1410',fx:'#ff7a3d'},[S('火羽箭','shot',6,{r:10,d:150}),S('疾奔','buff',12,{spd:.4,dur:3}),S('鳳凰之箭','blast',38,{r:12,a:4,d:360})],{cape:1}),
  HD('疾矢','marksman',{skin:'#e8c0a0',c1:'#2a4a6a',c2:'#8ac8ff',hair:'#1a1a2a',fx:'#8ac8ff'},[S('連珠箭','buff',10,{as:.5,dmg:.15,dur:5}),S('爆裂箭','blast',8,{r:9,a:3,d:120,sl:1.5}),S('致命狙擊','exec',35,{r:10,d:260,m:.5})],{}),
  HD('銀弦','marksman',{skin:'#f8e0d0',c1:'#6a6a7a',c2:'#e0e0f0',hair:'#e8e8f0',fx:'#e0e8ff'},[S('銀光箭','pierce',7,{r:11,d:140}),S('定身箭','shot',10,{r:10,d:100,st:1}),S('月光箭陣','storm',40,{r:10,a:5,d:110,dur:4})],{f:1,cape:1}),
  // 輔助
  HD('晨曦','support',{skin:'#f8e0c8',c1:'#f0e0a0',c2:'#ffd23f',hair:'#f0d080',fx:'#fff0a0'},[S('晨光治癒','heal',10,{a:8,v:170}),S('聖光彈','shot',8,{r:9,d:90,st:1}),S('黎明守護','shield',40,{v:400,ally:1})],{f:1,cape:1}),
  HD('聖鈴','support',{skin:'#f0d0b8',c1:'#e8e8f0',c2:'#8ad8ff',hair:'#c8a060',fx:'#c8f0ff'},[S('鈴之守護','shield',10,{v:200,ally:1}),S('清音震波','nova',9,{a:4,d:90,sl:1.5}),S('天籟','heal',40,{a:10,v:450})],{f:1}),
  HD('花語','support',{skin:'#f8d8c0',c1:'#5aa85a',c2:'#ff9ec8',hair:'#8a4a2a',fx:'#ff9ec8'},[S('藤蔓纏繞','blast',8,{r:9,a:3,d:100,st:1}),S('花之癒','heal',12,{a:8,v:150}),S('百花盛開','buff',40,{spd:.3,dmg:.2,dur:6,ally:1})],{f:1}),
  HD('潮汐','support',{skin:'#d8a880',c1:'#2a6a8a',c2:'#7ae8e8',hair:'#1a2a3a',fx:'#7ae8e8'},[S('浪潮之鉤','pull',10,{r:8,d:80,st:.8}),S('水之盾','shield',12,{v:220,ally:1}),S('漩渦','nova',40,{a:6,d:200,st:1.5})],{}),
  HD('守望','support',{skin:'#c8946a',c1:'#6a5a3a',c2:'#e8d8a0',hair:'#2a2418',fx:'#e8d8a0'},[S('光之箭','shot',7,{r:9,d:100,sl:2}),S('守護之光','heal',12,{a:8,v:170}),S('聖域','blast',40,{r:10,a:6,d:200,st:1.5})],{helm:1,cape:1})];
const ESK=[S('地裂','blast',9,{r:7,a:3,d:110,sl:1.5}),S('鋼鐵之軀','buff',14,{arm:50,dur:4}),S('寒霜踏步','nova',8,{a:3.5,d:90,sl:2}),S('熔岩鎖鏈','pull',12,{r:7,d:90,st:.6}),S('落石','shot',9,{r:9,d:110,st:.8}),
  S('破空斬','pierce',8,{r:7,d:130}),S('潮湧','dash',9,{r:7,a:2.5,d:110,sl:1.2}),S('鋼鐵意志','shield',13,{v:260}),S('撕裂','strike',7,{r:3,d:140,sl:1.5}),S('烈焰步','dash',9,{r:7,d:110}),
  S('鴉群','nova',8,{a:3.5,d:120}),S('毒霧','storm',12,{r:8,a:3.5,d:60,dur:3,sl:1}),S('霧刃連擊','strike',6,{r:2.8,d:150}),S('蝶影','buff',12,{spd:.5,as:.3,dur:3}),S('旋風','nova',8,{a:3.2,d:120,sl:1}),
  S('星光護盾','shield',13,{v:230}),S('爆炎','nova',9,{a:3.5,d:140}),S('冰牆','pierce',10,{r:9,d:100,st:.8,w:3}),S('雷霆疾步','blink',11,{r:7,d:80}),S('月影縛','blast',10,{r:9,a:3,d:100,st:1.2}),
  S('鷹之翱翔','blink',11,{r:6,d:0,back:1}),S('星光連射','buff',12,{as:.5,dur:4}),S('焚羽','pierce',8,{r:10,d:130}),S('翻身射擊','blink',10,{r:5,d:0,back:1}),S('銀色疾風','buff',12,{spd:.4,dmg:.15,dur:4}),
  S('日光衝擊','nova',9,{a:3.5,d:90,sl:1.5}),S('鈴音束縛','shot',9,{r:9,d:90,st:1}),S('花瓣護盾','shield',12,{v:200,ally:1}),S('潮浪','pierce',9,{r:9,d:100,sl:1.5}),S('守望之盾','shield',12,{v:220,ally:1})];
HEROES.forEach((h,i)=>h.sk.splice(2,0,ESK[i])); // Q W E R：第三招插在大招前面
// 召喚師技能（D、F）
const SPELLS={flash:{n:'閃現',cd:60,col:'#ffe066',d:'往滑鼠方向瞬間移動一小段，可以穿過牆和草叢'},heal:{n:'治癒',cd:60,col:'#7aff9a',d:'幫自己和附近隊友補血'},smite:{n:'重擊',cd:25,col:'#ffb040',d:'對附近的野怪或小兵造成大量傷害（打野用）'},
  ghost:{n:'鬼步',cd:50,col:'#9ad8ff',d:'走路速度大幅提升 6 秒'},barrier:{n:'屏障',cd:60,col:'#e8e8ff',d:'馬上得到一層護盾'},cleanse:{n:'淨化',cd:60,col:'#ff9ec8',d:'解除暈眩和緩速'}};
HEROES.forEach((h,i)=>{ h.i=i; if(!h.pal.c3) h.pal.c3=['#3a3a48','#4a3a2a','#2a2a38','#3a4a3a'][i%4]; });
const SK_TXT={dash:'往敵人衝過去',blink:'瞬間移動',strike:'重擊眼前的敵人',nova:'對身邊的敵人造成傷害',blast:'在敵人位置引爆',shot:'射出飛彈打第一個碰到的敵人',pierce:'直線貫穿所有敵人',shield:'得到護盾',heal:'治療',buff:'強化自己',exec:'對殘血敵人造成大量傷害',pull:'把敵人拉過來',storm:'持續傷害一片區域'};
function skDesc(s){ let t=SK_TXT[s.t]; if(s.t==='heal') t=s.self?'治療自己':'治療自己和附近隊友'; if(s.t==='shield') t=s.ally?'給自己和附近隊友護盾':'給自己護盾'; if(s.t==='buff'&&s.ally) t='強化自己和附近隊友'; if(s.back) t='往後翻滾閃開';
  const ex=[]; if(s.st) ex.push('暈眩 '+s.st+' 秒'); if(s.sl) ex.push('緩速'); return t+(ex.length?'，'+ex.join('、'):''); }
const ITEMS={jg:{n:'打野刀',c:350,atk:10,jg:1,col:'#8affc8',d:'打野怪的傷害、金幣、經驗 +30%，召喚師技能「重擊」也更痛'},
  sword:{n:'長劍',c:400,atk:15,col:'#d8dce8'},boots:{n:'疾行靴',c:450,spd:.12,col:'#c8a060'},vest:{n:'鎖甲',c:450,arm:20,col:'#9aa8c0'},belt:{n:'巨人腰帶',c:600,hp:350,col:'#e8b04a'},tome:{n:'魔法書',c:650,sp:.15,hp:150,col:'#b98cff'},
  axe:{n:'狂戰斧',c:1100,atk:35,as:.15,col:'#ff7a3d'},bow:{n:'速射弓',c:1150,atk:20,as:.35,col:'#86dc4f'},staff:{n:'大法杖',c:1800,sp:.4,col:'#c56bff'},blade:{n:'嗜血刀',c:1500,atk:40,ls:.15,col:'#ff4a4a'},
  plate:{n:'守護戰甲',c:1600,arm:45,hp:400,col:'#7aa8ff'},crown:{n:'智慧之冠',c:1500,sp:.25,hp:300,cdr:.15,col:'#ffd23f'},amulet:{n:'聖光吊墜',c:1300,hp:400,arm:15,heal:.3,col:'#fff0a0'},great:{n:'斬鐵大劍',c:2100,atk:70,col:'#e8e8f0'}};
const BUILD={tank:['boots','belt','vest','plate','amulet','plate'],fighter:['sword','boots','axe','plate','blade','great'],assassin:['sword','boots','blade','great','axe','plate'],
  mage:['tome','boots','crown','staff','staff','plate'],marksman:['sword','boots','bow','blade','great','bow'],support:['belt','boots','amulet','crown','plate','vest']};
const MIN={melee:{hp:450,atk:22,as:.9,rng:1.8,arm:10,spd:3.7,r:.55,gold:25,xp:50},ranged:{hp:320,atk:30,as:.8,rng:6.5,arm:5,spd:3.7,r:.5,gold:20,xp:40},cannon:{hp:900,atk:48,as:.7,rng:6.5,arm:22,spd:3.4,r:.9,gold:55,xp:90}};
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
window.__MOBA={SPELLS,HEROES,CLS,ITEMS,BUILD,MIN,buildMap,ROLES,portrait,polyl,along,project,segD,mul,TEAMC};
})();
