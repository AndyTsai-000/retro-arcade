// 果嶺推桿王：俯視角迷你高爾夫。10 座球場、每座 6 洞，草皮、沙坑、水池、斜坡、冰面、風車、移動閘門、地道。
// 畫面走寫實風（割草紋路、木頭／石頭圍欄、旗桿影子），推桿的是真人比例的球員。
// 同一台 1～4 人輪流，也可以連線（最多 4 人）：擊球的人送出方向和力道，大家各自模擬，球停下後由擊球的人送出結果對齊。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PIX='"Press Start 2P","Noto Sans TC",monospace';
const CS=44,GW=16,GH=10,OX=48,OY=56,BR=5.5,HR=9;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k;
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const shade=(h,f)=>{ const n=parseInt(String(h).slice(1),16); if(isNaN(n)) return h; const ch=v=>clamp(Math.round(v*f),0,255); return 'rgb('+ch((n>>16)&255)+','+ch((n>>8)&255)+','+ch(n&255)+')'; };
function hash(i){ let x=Math.sin(i*127.1+311.7)*43758.5453; return x-Math.floor(x); }
// 地圖符號：# 圍欄外　. 草皮　T 發球台　H 球洞　S 沙坑　W 水池（火山是熔岩、太空是虛空）　> < ^ v 斜坡　I 冰面　O 彈柱　M 風車　= 移動閘門　A→B、C→D 地道
const R4=['################','################','################','################'];
const COURSES=[
 {name:'綠茵公園',stars:1,th:'park',holes:[
  {par:2,m:['################','################','################','###..........###','###.T......H.###','###..........###','################','################','################','################']},
  {par:3,m:['################','##......########','##.T....########','##......########','#######...######','#######...######','#######......###','#######....H.###','#######......###','################']},
  {par:2,m:['################','################','##............##','##.T....O.....##','##.......O..H.##','##....O.......##','##............##','################','################','################']},
  {par:3,m:['################','##....####....##','##.T..####..H.##','##....####....##','##....####....##','##............##','##............##','################','################','################']},
  {par:2,m:['################','################','##............##','##.T..vvvv..H.##','##....vvvv....##','##............##','################','################','################','################']},
  {par:3,m:['################','################','##.....###....##','##.T....M...H.##','##.....###....##','################','################','################','################','################']}]},
 {name:'沙漠綠洲',stars:1,th:'desert',holes:[
  {par:2,m:['################','################','##............##','##.T...SS.....##','##.....SS...H.##','##............##','################','################','################','################']},
  {par:3,m:['################','##....##########','##.T..##########','##........######','#####.....######','#####.......####','########....SS##','########....H.##','########......##','################']},
  {par:2,m:['################','################','##............##','##.T..WWW.....##','##....WWW...H.##','##............##','##............##','################','################','################']},
  {par:3,m:['################','##............##','##.T..#..S....##','##....#..S....##','##....#.......##','##.......#....##','##..SS...#..H.##','##.......#....##','##............##','################']},
  {par:3,m:['################','##.T........####','##..........####','##########..####','##########..####','##..........####','##.H..SS....####','##..........####','################','################']},
  {par:3,m:['################','################','##......###....#','##.T..A.###.H..#','##......###....#','##......###.B..#','################','################','################','################']}]},
 {name:'海濱碼頭',stars:2,th:'pier',holes:[
  {par:2,m:['################','################','##WWWWWWWWWWWW##','##..WWWWWWWW..##','##.T........H.##','##..WWWWWWWW..##','##WWWWWWWWWWWW##','################','################','################']},
  {par:3,m:['################','##.T....WWWWWW##','##......WWWWWW##','##..........WW##','##WWWW......WW##','##WWWW......WW##','##WWWWWW......##','##WWWWWW....H.##','##WWWWWW......##','################']},
  {par:3,m:['################','##............##','##.T..O....O..##','##....WWWWW...##','##..O.WWWWW.O.##','##....WWWWW...##','##..O......O..##','##..........H.##','##............##','################']},
  {par:2,m:['################','################','################','##.......=....##','##.T..........##','##..........H.##','################','################','################','################']},
  {par:3,m:['################','##SSSSSSSSSSSS##','##S.T........S##','##S..######..S##','##S..######..S##','##S..######..S##','##S.......H..S##','##SSSSSSSSSSSS##','################','################']},
  {par:3,m:['################','##......WWW....#','##.T..A.WWW....#','##......WWW..B.#','##......WWW....#','##.....WWWW....#','##......WWW.H..#','##......WWW....#','################','################']}]},
 {name:'日式庭園',stars:2,th:'zen',holes:[
  {par:2,m:['################','################','##............##','##.T.>>>>>>.H.##','##...>>>>>>...##','##............##','################','################','################','################']},
  {par:3,m:['################','##............##','##.T..#....#..##','##....#.O..#..##','##.......#....##','##.O.....#..O.##','##..#.......H.##','##..#....O....##','##............##','################']},
  {par:3,m:['################','##....H.....####','##..........####','##..vvvvvv..####','##..vvvvvv..####','##..vvvvvv..####','##..........####','##.T........####','##..........####','################']},
  {par:3,m:['################','##.T......######','##........######','##..WWWW..######','##..WWWW.....###','##..WWWW.....###','##...........###','########...H.###','########.....###','################']},
  {par:4,m:['################','##...#...#....##','##.T.#.#.#.#..##','##...#.#.#.#..##','##...#.#.#.#..##','##.....#...#H.##','################','################','################','################']},
  {par:3,m:['################','################','##.....#.>>....#','##.T...M.>>.H..#','##.....#.>>....#','################','################','################','################','################']}]},
 {name:'冰雪山莊',stars:3,th:'snow',holes:[
  {par:2,m:['################','################','##............##','##.T.IIIIII.H.##','##...IIIIII...##','##............##','################','################','################','################']},
  {par:3,m:['################','##.T....########','##......########','##IIIIIIII######','##IIIIIIIIII####','########IIII####','########IIII.###','########SS.H.###','########S....###','################']},
  {par:3,m:['################','##IIIIIIIIIIII##','##IT..O..O..II##','##II..........##','##I..O..O..O..##','##I...........##','##I..O..O...H.##','##IIIIIIIIIIII##','################','################']},
  {par:3,m:['################','##WWWWWWWWWWWW##','##W.T.IIIII..W##','##W...IIIII..W##','##WWWWWIIIW..W##','##W.H..IIII..W##','##W..........W##','##WWWWWWWWWWWW##','################','################']},
  {par:3,m:['################','##.T........####','##..........####','######IIII..####','######IIII..####','##..>>>>>>..####','##.H........####','##..........####','################','################']},
  {par:4,m:['################','##.T....########','##.....=########','##......########','######IIIII...##','######IIIII...##','######IIIII.=.##','##########....##','##########..H.##','################']}]},
 {name:'古堡花園',stars:3,th:'castle',holes:[
  {par:3,m:['################','##.T..#.......##','##....#..##...##','##....#..##...##','##.......##.H.##','##.......##...##','################','################','################','################']},
  {par:3,m:['################','################','##....#....#..##','##.T..M....M.H##','##....#....#..##','################','################','################','################','################']},
  {par:4,m:['################','##.T..........##','##.##########.##','##.#........#.##','##.#..H.....#.##','##.#........#.##','##.####..####.##','##............##','##............##','################']},
  {par:3,m:['################','##......#......#','##.T..A.#..H...#','##......#......#','##......#..B...#','##..SS..#......#','##......#......#','################','################','################']},
  {par:3,m:['################','##.T.....#....##','##.......#....##','##..>>>..#..H.##','##..>>>.......##','##..>>>.......##','##.......#....##','##..O....#..O.##','##.......#....##','################']},
  {par:4,m:['################','##.T...........#','##.............#','#####=####=#####','##.............#','##.............#','#######=########','##.............#','##..........H..#','################']}]},
 {name:'叢林遺跡',stars:4,th:'jungle',holes:[
  {par:3,m:['################','##.T...WW.....##','##.....WW..O..##','##..O..WW.....##','##.....WW..##.##','##.........##H##','##............##','##..O......O..##','##............##','################']},
  {par:4,m:['################','##.T..........##','##............##','##..########..##','##..#......#..##','##..#..H...#..##','##..#..#####..##','##..#.........##','##..############','################']},
  {par:3,m:['################','##.T...........#','##.............#','##WWWWWW..WWWWW#','##WWWWWW..WWWWW#','##.............#','##..O....O...H.#','##.............#','################','################']},
  {par:3,m:['################','##.T.......#..##','##....#.A..#..##','##....#....#.H##','##....######..##','##..........B.##','################','################','################','################']},
  {par:4,m:['################','##.T.<<<<<<<..##','##...<<<<<<<..##','##..........vv##','##..........vv##','##..>>>>>>>.vv##','##..>>>>>>>...##','##.H..........##','##............##','################']},
  {par:4,m:['################','##.T....WWWW...#','##......WWWW...#','##......M......#','##......WWWW...#','##......WWWW.H.#','################','################','################','################']}]},
 {name:'都市屋頂',stars:4,th:'roof',holes:[
  {par:3,m:['################','##.T..=....=..##','##............##','##............##','##..........H.##','################','################','################','################','################']},
  {par:3,m:['################','##.T..WW......##','##....WW..WW..##','##........WW..##','##WWWW....WW..##','##........WW..##','##..WWWWWWWW..##','##..........H.##','##............##','################']},
  {par:4,m:['################','##.T.#......#..#','##...#.####.#..#','##...#.#..#.#..#','##.....#H.#....#','######.#..#.####','######.........#','################','################','################']},
  {par:3,m:['################','##..O..O..O...##','##.T..........##','##..O..O..O...##','##............##','##..O..O..O.H.##','##............##','################','################','################']},
  {par:3,m:['################','##......########','##.T..A.########','##......########','########......##','########...B..##','########......##','########..H...##','################','################']},
  {par:4,m:['################','##.T..IIII....##','##....IIII....##','##.####..####=##','##............##','##..O.....O...##','###########...##','##.H.....SS...##','##............##','################']}]},
 {name:'火山熔岩',stars:5,th:'lava',holes:[
  {par:3,m:['################','##.T..WWWW....##','##....WWWW....##','##............##','##WWWW....WWWW##','##............##','##....WWWW..H.##','##....WWWW....##','################','################']},
  {par:3,m:['################','##WWWWWWWWWWWW##','##.T..WWWWW...##','##....WWWWW...##','##...........W##','##WWWWWWWWW...##','##WWWWWWWWW.H.##','##WWWWWWWWWWWW##','################','################']},
  {par:4,m:['################','##.T....vv....##','##......vv....##','##WWWW..vv..WW##','##WWWW..vv..WW##','##......>>>...##','##..WWWWWWWW..##','##..........H.##','##............##','################']},
  {par:4,m:['################','##.T..WWW......#','##..A.WWW..B...#','##....WWW......#','##WWWWWWWWW....#','##.........WW..#','##.H.......WW..#','##.........WW..#','##.............#','################']},
  {par:4,m:['################','##.T..........##','##............##','#####=######=###','##............##','##..WWWW..WWWW##','##............##','##########=#####','##.H..........##','################']},
  {par:4,m:['################','##.T..........##','##..WWWWWWWW..##','##..W......W..##','##..W..H...W..##','##..W......W..##','##..WWW.WWWW..##','##............##','##............##','################']}]},
 {name:'太空站',stars:5,th:'space',holes:[
  {par:3,m:['################','##.T...O....A.##','##...O...O....##','##.O...O...O..##','################','##............##','##.B......H...##','##............##','################','################']},
  {par:4,m:['################','##.T.IIIIIIII..#','##...IIIIIIII..#','#########..#####','#########M.#####','#########..#####','##.H....IIII...#','##......IIII...#','################','################']},
  {par:4,m:['################','##.T..^^^^^^..##','##....^^^^^^..##','##<<<<......>>##','##<<<<..O...>>##','##....vvvvvv..##','##....vvvvvv.H##','##............##','################','################']},
  {par:4,m:['################','##.T..WW..WW..##','##....WW..WW..##','##..........=.##','##WW..WW..WW..##','##WW..WW..WW..##','##..=.........##','##....WW..WW.H##','##....WW..WW..##','################']},
  {par:4,m:['################','##.T..#.....#..#','##..A.#..B..#..#','##....#.....#..#','##....#..C..#.D#','##....#.....#..#','##....#.....#.H#','################','################','################']},
  {par:5,m:['################','##.T...O...=...#','##.....O.......#','##..IIIIIII....#','##########M#####','##.........>>..#','##..WWWW...>>..#','##.H.WWW.......#','##......SS.....#','################']}]}];
const TH={
  park:{out:'#3f7a34',out2:'#4a8a3c',g1:'#5fb04c',g2:'#56a444',rail:'wood',railC:'#8a5a32',deco:'tree',haz:'water',sand:'#e2cf96',sky:'#9ad0f0'},
  desert:{out:'#d8b878',out2:'#ccaa68',g1:'#7cbf58',g2:'#72b450',rail:'stone',railC:'#b08a5a',deco:'cactus',haz:'water',sand:'#ecd8a0'},
  pier:{out:'#2a6fa8',out2:'#2f78b4',g1:'#58ac52',g2:'#4fa04a',rail:'wood',railC:'#a8784a',deco:'plank',haz:'water',sand:'#eedcaa',outWater:1},
  zen:{out:'#d8d4c8',out2:'#ccc8bc',g1:'#4f9a48',g2:'#478e40',rail:'bamboo',railC:'#b8a050',deco:'rake',haz:'koi',sand:'#e8e4d8'},
  snow:{out:'#eef4fa',out2:'#e0eaf4',g1:'#62a85a',g2:'#5a9c52',rail:'log',railC:'#7a5232',deco:'pine',haz:'ice',sand:'#ffffff'},
  castle:{out:'#5f8a48',out2:'#6a9450',g1:'#5cae4a',g2:'#52a042',rail:'brick',railC:'#9a5a42',deco:'rose',haz:'water',sand:'#e2cf96'},
  jungle:{out:'#2f5a2a',out2:'#386a30',g1:'#56a448',g2:'#4c983e',rail:'stone',railC:'#8a8a78',deco:'fern',haz:'swamp',sand:'#d8c088'},
  roof:{out:'#6a6e78',out2:'#62666e',g1:'#62b45a',g2:'#58a850',rail:'metal',railC:'#9aa4b0',deco:'vent',haz:'drop',sand:'#d8cc9a'},
  lava:{out:'#2a2024',out2:'#33262a',g1:'#5a9a4a',g2:'#508e42',rail:'basalt',railC:'#4a4448',deco:'rockl',haz:'lava',sand:'#8a7a6a'},
  space:{out:'#0e1022',out2:'#121530',g1:'#4a9ac8',g2:'#4290bc',rail:'metal',railC:'#c0c8d8',deco:'star',haz:'void',sand:'#b0a8c8'}};
const HAZN={water:'掉進水裡',koi:'掉進錦鯉池',ice:'掉進冰湖',swamp:'掉進沼澤',drop:'掉下樓了',lava:'掉進熔岩',void:'飄進太空'};

/* ---------- 解析球洞 ---------- */
function parseHole(h){ const m=h.m,g=[],o={tee:null,hole:null,bump:[],mill:[],gate:[],tun:{}};
  for(let y=0;y<GH;y++){ g.push([]); for(let x=0;x<GW;x++){ let ch=(m[y]||'')[x]||'#'; const cx=OX+x*CS+CS/2,cy=OY+y*CS+CS/2;
    if(ch==='T'){ o.tee=[cx,cy]; ch='.'; } else if(ch==='H'){ o.hole=[cx,cy]; ch='.'; } else if(ch==='O'){ o.bump.push([cx,cy]); ch='.'; } else if(ch==='M'){ o.mill.push({x:cx,y:cy,ph:o.mill.length*.9}); ch='.'; }
    else if(ch==='='){ o.gate.push({gx:x,gy:y}); ch='.'; } else if('ABCD'.includes(ch)){ o.tun[ch]=[cx,cy]; ch='.'; }
    g[y].push(ch); } }
  for(const gt of o.gate){ let a=gt.gy,b=gt.gy; while(a>0&&g[a-1][gt.gx]!=='#') a--; while(b<GH-1&&g[b+1][gt.gx]!=='#') b++; gt.a=a; gt.b=b; gt.ph=gt.gx*.7; }
  o.g=g; o.par=h.par; return o; }
const solid=(o,x,y)=>x<0||y<0||x>=GW||y>=GH||o.g[y][x]==='#';
function gateY(gt,t){ return OY+gt.a*CS+(gt.b-gt.a)*CS*(.5-.5*Math.cos(t*1.3+gt.ph)); }
function millAng(m,t){ return t*1.5+m.ph; }

/* ---------- 物理（固定步長，大家算出一樣的結果） ---------- */
function pushBox(b,x0,y0,x1,y1,vx,vy){ const px=clamp(b.x,x0,x1),py=clamp(b.y,y0,y1),dx=b.x-px,dy=b.y-py,d=Math.hypot(dx,dy);
  if(d>=BR) return false; let nx,ny; if(d>1e-6){ nx=dx/d; ny=dy/d; } else { const l=b.x-x0,r=x1-b.x,u=b.y-y0,dd=y1-b.y,mn=Math.min(l,r,u,dd); nx=mn===l?-1:mn===r?1:0; ny=mn===u?-1:mn===dd?1:0; }
  b.x+=nx*(BR-d); b.y+=ny*(BR-d); const rvx=b.vx-(vx||0),rvy=b.vy-(vy||0),vn=rvx*nx+rvy*ny; if(vn<0){ b.vx-=1.78*vn*nx; b.vy-=1.78*vn*ny; return Math.abs(vn)>60; } return false; }
function stepBall(o,b,t,dt,ev){
  const cx=Math.floor((b.x-OX)/CS),cy=Math.floor((b.y-OY)/CS),tile=solid(o,cx,cy)?'#':o.g[cy][cx],sp=Math.hypot(b.vx,b.vy);
  let k1=85,k2=.55; if(tile==='S'){ k1=520; k2=2.2; } else if(tile==='I'){ k1=14; k2=.08; }
  if(sp>0){ const dec=(k1+k2*sp)*dt,f=Math.max(0,sp-dec)/sp; b.vx*=f; b.vy*=f; }
  const SL=230; if(tile==='>') b.vx+=SL*dt; else if(tile==='<') b.vx-=SL*dt; else if(tile==='v') b.vy+=SL*dt; else if(tile==='^') b.vy-=SL*dt;
  b.x+=b.vx*dt; b.y+=b.vy*dt;
  // 圍欄
  const gx=Math.floor((b.x-OX)/CS),gy=Math.floor((b.y-OY)/CS);
  for(let y=gy-1;y<=gy+1;y++) for(let x=gx-1;x<=gx+1;x++) if(solid(o,x,y)){ if(pushBox(b,OX+x*CS,OY+y*CS,OX+x*CS+CS,OY+y*CS+CS)) ev.push('bump'); }
  for(const gt of o.gate){ const y0=gateY(gt,t),x0=OX+gt.gx*CS,vy=(gateY(gt,t+.01)-y0)/.01; if(pushBox(b,x0+3,y0+3,x0+CS-3,y0+CS-3,0,vy)) ev.push('bump'); }
  for(const [px,py] of o.bump){ const dx=b.x-px,dy=b.y-py,d=Math.hypot(dx,dy),R=12+BR; if(d<R&&d>1e-6){ const nx=dx/d,ny=dy/d; b.x=px+nx*R; b.y=py+ny*R; const vn=b.vx*nx+b.vy*ny; if(vn<0){ b.vx-=2.15*vn*nx; b.vy-=2.15*vn*ny; const s=Math.hypot(b.vx,b.vy); if(s>1100){ b.vx*=1100/s; b.vy*=1100/s; } ev.push('pop'); } } }
  for(const m of o.mill){ const a0=millAng(m,t);
    { const dx=b.x-m.x,dy=b.y-m.y,d=Math.hypot(dx,dy),R=7+BR; if(d<R&&d>1e-6){ const nx=dx/d,ny=dy/d; b.x=m.x+nx*R; b.y=m.y+ny*R; const vn=b.vx*nx+b.vy*ny; if(vn<0){ b.vx-=1.7*vn*nx; b.vy-=1.7*vn*ny; } } }
    for(let k=0;k<4;k++){ const a=a0+k*Math.PI/2,ex=m.x+Math.cos(a)*30,ey=m.y+Math.sin(a)*30,sx=ex-m.x,sy=ey-m.y,L2=sx*sx+sy*sy,u=clamp(((b.x-m.x)*sx+(b.y-m.y)*sy)/L2,0,1),qx=m.x+sx*u,qy=m.y+sy*u,dx=b.x-qx,dy=b.y-qy,d=Math.hypot(dx,dy),R=3+BR;
      if(d<R&&d>1e-6){ const nx=dx/d,ny=dy/d,r=u*30,bvx=-Math.sin(a)*1.5*r,bvy=Math.cos(a)*1.5*r; b.x=qx+nx*R; b.y=qy+ny*R; const vn=(b.vx-bvx)*nx+(b.vy-bvy)*ny; if(vn<0){ b.vx-=1.7*vn*nx; b.vy-=1.7*vn*ny; ev.push('bump'); } } } }
  // 地道
  if(b.tcd>0) b.tcd-=dt; else for(const [a,z] of [['A','B'],['C','D']]){ const p=o.tun[a],q=o.tun[z]; if(p&&q&&Math.hypot(b.x-p[0],b.y-p[1])<11){ b.x=q[0]; b.y=q[1]; b.tcd=.4; const s=Math.max(160,Math.hypot(b.vx,b.vy)); const l=Math.hypot(b.vx,b.vy)||1; b.vx=b.vx/l*s; b.vy=b.vy/l*s; ev.push('warp'); break; } }
  // 球洞：速度太快會從洞口滑過去（被洞緣彈偏一點）
  const hx=o.hole[0],hy=o.hole[1],hd=Math.hypot(b.x-hx,b.y-hy),s2=Math.hypot(b.vx,b.vy);
  if(hd<HR-1&&s2<430){ b.inHole=true; b.vx=b.vy=0; ev.push('cup'); return; }
  if(hd<HR&&s2>=430){ const nx=(hx-b.x)/(hd||1),ny=(hy-b.y)/(hd||1); b.vx+=nx*s2*.12; b.vy+=ny*s2*.12; }
  // 水池
  const tx=Math.floor((b.x-OX)/CS),ty=Math.floor((b.y-OY)/CS); if(!solid(o,tx,ty)&&o.g[ty][tx]==='W'){ b.wet=true; ev.push('splash'); return; }
  // 停下：斜坡上還會滾，抵著牆持續很慢才算停
  if(Math.hypot(b.vx,b.vy)<9){ b.slow=(b.slow||0)+dt; if(b.slow>.25){ b.vx=b.vy=0; b.stop=true; } } else b.slow=0; }
// 整桿模擬到停（測試、電腦用）：回傳結束狀態
function simShot(o,x,y,ang,pow,t0){ const b={x,y,vx:Math.cos(ang)*pow*MAXV,vy:Math.sin(ang)*pow*MAXV}; let t=t0,ev=[]; for(let i=0;i<60*4*14;i++){ stepBall(o,b,t,1/240,ev); t+=1/240; ev.length=0; if(b.inHole||b.wet||b.stop) break; } return b; }
const MAXV=980;

/* ---------- 繪圖 ---------- */
function drawStatic(c,o,TT,ci,flat3d){
  // 圍欄外：依主題的地景
  c.fillStyle=TT.out; c.fillRect(0,0,W,H);
  for(let i=0;i<900;i++){ c.fillStyle=i%2?TT.out2:shade(TT.out,1.06); c.globalAlpha=.5; c.fillRect(hash(i+ci*7)*W,hash(i*3+1)*H,3+hash(i*5)*6,2); } c.globalAlpha=1;
  if(TT.outWater){ for(let i=0;i<120;i++){ c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(hash(i*11)*W,hash(i*13)*H,18,2); } }
  if(TT.deco==='star') for(let i=0;i<160;i++){ c.fillStyle='rgba(255,255,255,'+(.3+hash(i)*.7)+')'; c.fillRect(hash(i*7)*W,hash(i*9)*H,hash(i*3)>.9?2:1,hash(i*3)>.9?2:1); }
  if(TT.deco==='rake'){ c.strokeStyle='rgba(150,140,120,.35)'; c.lineWidth=1.2; for(let y=4;y<H;y+=7){ c.beginPath(); for(let x=0;x<=W;x+=10) c.lineTo(x,y+Math.sin(x*.02)*2); c.stroke(); } }
  if(TT.deco==='plank'&&false){}
  // 草皮（割草紋）
  for(let y=0;y<GH;y++) for(let x=0;x<GW;x++){ const ch=o.g[y][x]; if(ch==='#') continue; const X=OX+x*CS,Y=OY+y*CS;
    c.fillStyle=((x+y)>>0)%2?TT.g1:TT.g2; c.fillRect(X,Y,CS+.5,CS+.5);
    if(ch==='S'){ c.fillStyle=TT.sand; c.fillRect(X,Y,CS+.5,CS+.5); for(let i=0;i<30;i++){ c.fillStyle=hash(x*31+y*17+i)>.5?'rgba(0,0,0,.08)':'rgba(255,255,255,.25)'; c.fillRect(X+hash(i*3+x)*CS,Y+hash(i*7+y)*CS,1.5,1.5); } }
    else if(ch==='I'){ const g=c.createLinearGradient(X,Y,X+CS,Y+CS); g.addColorStop(0,'#d8f0ff'); g.addColorStop(.5,'#b8e0f8'); g.addColorStop(1,'#cdeaff'); c.fillStyle=g; c.fillRect(X,Y,CS+.5,CS+.5); c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=1; c.beginPath(); c.moveTo(X+6+hash(x+y)*10,Y+8); c.lineTo(X+24,Y+20); c.moveTo(X+20,Y+30); c.lineTo(X+36,Y+38); c.stroke(); }
    else if('<>^v'.includes(ch)){ c.fillStyle='rgba(0,0,0,.08)'; c.fillRect(X,Y,CS,CS); const a={'>':0,'v':Math.PI/2,'<':Math.PI,'^':-Math.PI/2}[ch]; c.save(); c.translate(X+CS/2,Y+CS/2); c.rotate(a); c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=3; c.lineJoin='round'; for(const dx of [-8,4]){ c.beginPath(); c.moveTo(dx-5,-9); c.lineTo(dx+4,0); c.lineTo(dx-5,9); c.stroke(); } c.restore();
      const sg=c.createLinearGradient(X,Y,X+(ch==='>'?CS:ch==='<'?-CS:0)+(ch==='<'?CS:0),Y+(ch==='v'?CS:0)+(ch==='^'?CS:0)); }
  }
  // 割草斜紋與細草
  c.save(); c.beginPath(); for(let y=0;y<GH;y++) for(let x=0;x<GW;x++) if(o.g[y][x]!=='#'&&o.g[y][x]!=='W') c.rect(OX+x*CS,OY+y*CS,CS+.5,CS+.5); c.clip();
  c.fillStyle='rgba(255,255,255,.05)'; for(let k=-20;k<40;k+=2){ c.beginPath(); c.moveTo(OX+k*30,OY); c.lineTo(OX+k*30+30,OY); c.lineTo(OX+k*30+30-440,OY+440); c.lineTo(OX+k*30-440,OY+440); c.fill(); }
  for(let i=0;i<1400;i++){ c.fillStyle=hash(i*3+ci)>.5?'rgba(0,40,0,.12)':'rgba(255,255,255,.08)'; c.fillRect(OX+hash(i)*704,OY+hash(i*1.7)*440,1,2.5); } c.restore();
  // 水池（底色，波紋另外動態畫）
  for(let y=0;y<GH;y++) for(let x=0;x<GW;x++) if(o.g[y][x]==='W'){ const X=OX+x*CS,Y=OY+y*CS; c.fillStyle=TT.haz==='lava'?'#c8401a':TT.haz==='void'?'#05060f':TT.haz==='drop'?'#3a3e48':TT.haz==='swamp'?'#4a5a2a':TT.haz==='ice'?'#4a8ac0':'#2f7fc0'; c.fillRect(X,Y,CS+.5,CS+.5);
    if(TT.haz==='drop'){ c.fillStyle='rgba(0,0,0,.35)'; c.fillRect(X,Y,CS,CS); c.fillStyle='rgba(255,220,120,.5)'; for(let i=0;i<3;i++) c.fillRect(X+hash(x*9+y+i)*36,Y+hash(y*7+x+i)*36,4,3); } }
  // 水池岸邊陰影
  for(let y=0;y<GH;y++) for(let x=0;x<GW;x++) if(o.g[y][x]==='W'){ const X=OX+x*CS,Y=OY+y*CS; c.fillStyle='rgba(0,0,0,.25)'; if(y>0&&o.g[y-1][x]!=='W') c.fillRect(X,Y,CS,5); if(x>0&&o.g[y][x-1]!=='W') c.fillRect(X,Y,5,CS); }
  // 圍欄外的裝飾（不靠著草皮的格子）
  if(!flat3d) for(let y=0;y<GH;y++) for(let x=0;x<GW;x++){ if(o.g[y][x]!=='#') continue; let near=false; for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) if(!solid(o,x+dx,y+dy)) near=true; if(near) continue; const r=hash(x*13+y*29+ci*5); if(r>.42) continue; decoAt(c,TT.deco,OX+x*CS+CS/2+(hash(x+y*3)-.5)*14,OY+y*CS+CS/2+(hash(x*5+y)-.5)*14,r); }
  if(!flat3d) for(const d of [[20,20],[780,20],[24,480],[776,480]]) decoAt(c,TT.deco,d[0],d[1],.2);
  // 發球台、球洞
  if(o.tee){ c.fillStyle='rgba(0,0,0,.25)'; rr(c,o.tee[0]-15,o.tee[1]-11,32,24,4); c.fill(); c.fillStyle='#2f6a2c'; rr(c,o.tee[0]-16,o.tee[1]-12,32,24,4); c.fill(); c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=1; c.stroke(); c.fillStyle='rgba(255,255,255,.12)'; for(let i=0;i<8;i++) c.fillRect(o.tee[0]-14+i*4,o.tee[1]-10,1,20); }
  const [hx,hy]=o.hole; c.fillStyle='rgba(255,255,255,.12)'; c.beginPath(); c.arc(hx,hy,HR+5,0,7); c.fill();
  const hg=c.createRadialGradient(hx-2,hy-2,1,hx,hy,HR); hg.addColorStop(0,'#000'); hg.addColorStop(.7,'#141414'); hg.addColorStop(1,'#3a3a3a'); c.fillStyle=hg; c.beginPath(); c.arc(hx,hy,HR,0,7); c.fill(); c.strokeStyle='#e8e8e8'; c.lineWidth=1.5; c.beginPath(); c.arc(hx,hy,HR,.2,Math.PI*.9); c.stroke();
  // 地道入口與出口
  for(const k of 'ABCD'){ const p=o.tun[k]; if(!p) continue; const ent=k==='A'||k==='C'; c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.arc(p[0]+2,p[1]+3,15,0,7); c.fill(); c.fillStyle=TT.rail==='metal'?'#9aa4b0':'#7a7468'; c.beginPath(); c.arc(p[0],p[1],15,0,7); c.fill(); const g=c.createRadialGradient(p[0],p[1],2,p[0],p[1],12); g.addColorStop(0,'#000'); g.addColorStop(1,ent?'#1a1a2a':'#2a2a1a'); c.fillStyle=g; c.beginPath(); c.arc(p[0],p[1],11,0,7); c.fill();
    c.fillStyle='#fff'; c.font='900 9px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(ent?'入':'出',p[0],p[1]-20+40*(p[1]<OY+30?1:0)); }
  // 圍欄：草皮和外面交界畫成有厚度的欄杆
  if(!flat3d) drawRails(c,o,TT); }
function decoAt(c,k,x,y,r){ c.save(); c.translate(x,y);
  if(k==='tree'||k==='pine'||k==='fern'||k==='rose'){ c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(5,6,16,9,0,0,7); c.fill();
    if(k==='pine'){ for(let i=0;i<3;i++){ c.fillStyle=i%2?'#2f5a3a':'#3a6a44'; c.beginPath(); c.moveTo(0,-18+i*8); c.lineTo(13-i*2,4+i*3); c.lineTo(-13+i*2,4+i*3); c.fill(); } c.fillStyle='rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(0,-18); c.lineTo(5,-10); c.lineTo(-5,-10); c.fill(); }
    else { const base=k==='fern'?'#2a6a28':k==='rose'?'#3a6a30':'#3a7a30'; for(let i=0;i<5;i++){ const a=i*1.26,g=c.createRadialGradient(Math.cos(a)*6-3,Math.sin(a)*6-4,1,Math.cos(a)*6,Math.sin(a)*6,11); g.addColorStop(0,shade(base,1.5)); g.addColorStop(1,base); c.fillStyle=g; c.beginPath(); c.arc(Math.cos(a)*6,Math.sin(a)*6,11,0,7); c.fill(); }
      if(k==='rose') for(let i=0;i<6;i++){ c.fillStyle=['#e8304a','#ff7eb6','#fff'][i%3]; c.beginPath(); c.arc(Math.cos(i)*9,Math.sin(i*1.7)*9,2.6,0,7); c.fill(); } } }
  else if(k==='cactus'){ c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(4,8,10,5,0,0,7); c.fill(); c.fillStyle='#4a8a3a'; rr(c,-4,-16,8,24,4); c.fill(); rr(c,-11,-8,5,10,2.5); c.fill(); rr(c,6,-12,5,10,2.5); c.fill(); c.fillStyle='rgba(255,255,255,.2)'; c.fillRect(-1,-14,1.5,20); }
  else if(k==='plank'){ c.fillStyle='#8a6038'; c.fillRect(-14,-14,28,28); c.strokeStyle='#5a3a20'; c.lineWidth=1; for(let i=-14;i<14;i+=7){ c.beginPath(); c.moveTo(-14,i); c.lineTo(14,i); c.stroke(); } }
  else if(k==='rake'){ c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(4,5,12,7,0,0,7); c.fill(); const g=c.createRadialGradient(-3,-4,1,0,0,12); g.addColorStop(0,'#a8a8a0'); g.addColorStop(1,'#5a5a58'); c.fillStyle=g; c.beginPath(); c.ellipse(0,0,12,9,r*3,0,7); c.fill(); }
  else if(k==='vent'){ c.fillStyle='rgba(0,0,0,.3)'; c.fillRect(-10,-8,24,20); c.fillStyle='#a8b0bc'; c.fillRect(-12,-10,24,20); c.strokeStyle='#6a7280'; for(let i=-8;i<10;i+=4){ c.beginPath(); c.moveTo(-10,i); c.lineTo(10,i); c.stroke(); } }
  else if(k==='rockl'){ c.fillStyle='rgba(255,90,20,.25)'; c.beginPath(); c.arc(0,0,16,0,7); c.fill(); c.fillStyle='#3a3236'; c.beginPath(); c.moveTo(-12,6); c.lineTo(-6,-10); c.lineTo(8,-8); c.lineTo(12,6); c.closePath(); c.fill(); c.strokeStyle='#ff6a1a'; c.lineWidth=1; c.beginPath(); c.moveTo(-6,2); c.lineTo(2,-4); c.lineTo(6,4); c.stroke(); }
  else if(k==='star'){ c.fillStyle='rgba(140,170,255,.25)'; c.beginPath(); c.arc(0,0,6+r*20,0,7); c.fill(); }
  c.restore(); }
function railStyle(c,TT,x,y,w,h){ const col=TT.railC,g=c.createLinearGradient(x,y,x+(w<h?w:0),y+(w<h?0:h)); g.addColorStop(0,shade(col,1.25)); g.addColorStop(.5,col); g.addColorStop(1,shade(col,.7)); c.fillStyle=g; c.fillRect(x,y,w,h);
  c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=1;
  if(TT.rail==='brick'||TT.rail==='stone'||TT.rail==='basalt'){ const L=Math.max(w,h); for(let i=0;i<L;i+=TT.rail==='brick'?11:15){ c.beginPath(); if(w>h){ c.moveTo(x+i,y); c.lineTo(x+i,y+h); } else { c.moveTo(x,y+i); c.lineTo(x+w,y+i); } c.stroke(); } }
  else if(TT.rail==='wood'||TT.rail==='log'||TT.rail==='bamboo'){ c.beginPath(); if(w>h){ c.moveTo(x,y+h/2); c.lineTo(x+w,y+h/2); } else { c.moveTo(x+w/2,y); c.lineTo(x+w/2,y+h); } c.stroke(); if(TT.rail==='bamboo'){ const L=Math.max(w,h); for(let i=0;i<L;i+=22){ c.fillStyle='rgba(80,60,20,.5)'; if(w>h) c.fillRect(x+i,y,2,h); else c.fillRect(x,y+i,w,2); } } }
  else if(TT.rail==='metal'){ c.fillStyle='rgba(255,255,255,.35)'; if(w>h) c.fillRect(x,y+1,w,1.5); else c.fillRect(x+1,y,1.5,h); } }
function drawRails(c,o,TT){ const T=8;
  for(let y=0;y<GH;y++) for(let x=0;x<GW;x++){ if(o.g[y][x]==='#') continue; const X=OX+x*CS,Y=OY+y*CS;
    // 欄杆的影子落在草皮上
    c.fillStyle='rgba(0,0,0,.22)'; if(solid(o,x,y-1)) c.fillRect(X,Y,CS,T+4); if(solid(o,x-1,y)) c.fillRect(X,Y,T+4,CS); }
  for(let y=0;y<GH;y++) for(let x=0;x<GW;x++){ if(o.g[y][x]==='#') continue; const X=OX+x*CS,Y=OY+y*CS;
    if(solid(o,x,y-1)) railStyle(c,TT,X-T/2,Y-T/2,CS+T,T); if(solid(o,x,y+1)) railStyle(c,TT,X-T/2,Y+CS-T/2,CS+T,T); if(solid(o,x-1,y)) railStyle(c,TT,X-T/2,Y-T/2,T,CS+T); if(solid(o,x+1,y)) railStyle(c,TT,X+CS-T/2,Y-T/2,T,CS+T); }
  // 內部的障礙方塊畫成石塊／磚塊
  for(let y=1;y<GH-1;y++) for(let x=1;x<GW-1;x++){ if(o.g[y][x]!=='#') continue; let n=0; for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if(!solid(o,x+dx,y+dy)) n++; if(n>=2){ const X=OX+x*CS,Y=OY+y*CS; c.fillStyle='rgba(0,0,0,.2)'; c.fillRect(X+3,Y+5,CS,CS); railStyle(c,TT,X+1,Y+1,CS-2,CS-2); c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(X+1,Y+1,CS-2,4); } } }
function drawDynamic(c,o,TT,t,waterOnly){
  // 水波／熔岩流動
  for(let y=0;y<GH;y++) for(let x=0;x<GW;x++) if(o.g[y][x]==='W'){ const X=OX+x*CS,Y=OY+y*CS;
    if(TT.haz==='lava'){ c.fillStyle='rgba(255,200,60,'+(.25+.2*Math.sin(t*2+x+y))+')'; c.beginPath(); c.arc(X+22+Math.sin(t+x)*8,Y+22+Math.cos(t*.8+y)*8,8,0,7); c.fill(); c.fillStyle='rgba(60,20,10,.35)'; c.fillRect(X+((t*10+x*13)%CS),Y+10,10,3); }
    else if(TT.haz==='void'){ c.fillStyle='rgba(255,255,255,.6)'; c.fillRect(X+((x*17+t*6)%CS),Y+((y*23)%CS),1.5,1.5); }
    else if(TT.haz!=='drop'){ c.strokeStyle='rgba(255,255,255,.22)'; c.lineWidth=1.2; for(let k=0;k<2;k++){ const yy=Y+12+k*18+Math.sin(t*1.5+x*1.3+k)*3; c.beginPath(); c.moveTo(X+4,yy); c.quadraticCurveTo(X+22,yy-4,X+40,yy); c.stroke(); }
      if(TT.haz==='koi'&&(x+y)%3===0){ const a=t*.6+x,kx=X+22+Math.cos(a)*12,ky=Y+22+Math.sin(a)*10; c.fillStyle=(x%2?'#ff7a2a':'#f4f4f4'); c.save(); c.translate(kx,ky); c.rotate(a+Math.PI/2); c.beginPath(); c.ellipse(0,0,7,3,0,0,7); c.fill(); c.beginPath(); c.moveTo(-6,0); c.lineTo(-11,-3); c.lineTo(-11,3); c.fill(); c.restore(); } } }
  if(waterOnly) return;
  // 彈柱
  for(const [px,py] of o.bump){ c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(px+4,py+5,13,11,0,0,7); c.fill(); const g=c.createRadialGradient(px-4,py-4,1,px,py,12); g.addColorStop(0,'#ffffff'); g.addColorStop(.35,'#d8dce4'); g.addColorStop(1,'#6a7080'); c.fillStyle=g; c.beginPath(); c.arc(px,py,12,0,7); c.fill(); c.fillStyle='#e8402a'; c.beginPath(); c.arc(px,py,5,0,7); c.fill(); }
  // 移動閘門
  for(const gt of o.gate){ const y0=gateY(gt,t),x0=OX+gt.gx*CS; c.fillStyle='rgba(0,0,0,.3)'; c.fillRect(x0+6,y0+8,CS-6,CS-6); railStyle(c,TT,x0+3,y0+3,CS-6,CS-6); c.fillStyle='#ffd23f'; for(let i=0;i<4;i++) c.fillRect(x0+5+i*10,y0+CS/2-3,5,6); }
  // 風車：塔身＋旋轉葉片
  for(const m of o.mill){ c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.arc(m.x+5,m.y+6,10,0,7); c.fill(); c.fillStyle='#b05a3a'; c.beginPath(); c.arc(m.x,m.y,9,0,7); c.fill(); c.fillStyle='#7a3a2a'; c.beginPath(); c.arc(m.x,m.y,4,0,7); c.fill();
    const a0=millAng(m,t); for(let k=0;k<4;k++){ const a=a0+k*Math.PI/2; c.save(); c.translate(m.x,m.y); c.rotate(a); c.fillStyle='rgba(0,0,0,.25)'; c.fillRect(6,2,26,6); c.fillStyle='#e8dcc0'; c.fillRect(5,-3,26,6); c.strokeStyle='#8a6a40'; c.lineWidth=1; c.strokeRect(5,-3,26,6); for(let i=9;i<30;i+=5){ c.beginPath(); c.moveTo(i,-3); c.lineTo(i,3); c.stroke(); } c.restore(); } } }
function drawFlag(c,o,t,lift,col){ const [hx,hy]=o.hole,up=lift; if(up>40) return; c.globalAlpha=1-up/40;
  c.strokeStyle='rgba(0,0,0,.3)'; c.lineWidth=2; c.beginPath(); c.moveTo(hx,hy); c.lineTo(hx+26,hy+16); c.stroke();
  c.strokeStyle='#e8e8e8'; c.lineWidth=2.2; c.beginPath(); c.moveTo(hx,hy-up); c.lineTo(hx,hy-up-52); c.stroke();
  const fx=hx,fy=hy-up-52; c.fillStyle=col||'#e8231c'; c.beginPath(); c.moveTo(fx,fy); for(let i=0;i<=8;i++){ const u=i/8; c.lineTo(fx+u*22,fy+Math.sin(t*5-u*4)*2*u+u*3); } for(let i=8;i>=0;i--){ const u=i/8; c.lineTo(fx+u*22,fy+13+Math.sin(t*5-u*4)*2*u-u*3); } c.closePath(); c.fill(); c.globalAlpha=1; }
function drawGolfBall(c,x,y,col,z,alpha){ c.globalAlpha=alpha==null?1:alpha; c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x+2+z*.3,y+2+z*.4,BR,BR*.8,0,0,7); c.fill();
  const g=c.createRadialGradient(x-2,y-2-z,.5,x,y-z,BR); g.addColorStop(0,'#ffffff'); g.addColorStop(.6,col||'#f4f4f4'); g.addColorStop(1,shade(col||'#f4f4f4',.65)); c.fillStyle=g; c.beginPath(); c.arc(x,y-z,BR,0,7); c.fill();
  c.fillStyle='rgba(0,0,0,.08)'; for(let i=0;i<5;i++) c.fillRect(x-3+((i*3)%6),y-z-2+((i*5)%5),1,1); c.globalAlpha=1; }
// 真人推桿球員：站在球的一側（球在腳前），身體面對球，putter 頭在球後面
function drawGolfer(c,bx,by,ang,back,L,t,follow){
  const nx=Math.cos(ang),ny=Math.sin(ang),px=-ny,py=nx; // px,py：左手邊（球員站在擊球方向的右側＝右撇子面對球）
  const fx=bx-px*24,fy=by-py*20+8; // 腳的位置
  const side=px>0?-1:1, s=1.2; // 螢幕上的朝向（人物左右翻）
  // 推桿：手在身前，桿頭在球後方 back 距離
  const hx=fx+(bx-fx)*.45,hy=fy-38*s, cxh=bx-nx*(9+back*44),cyh=by-ny*(9+back*44)-(follow?0:0);
  c.save();
  c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(fx+6,fy+2,16,6,0,0,7); c.fill();
  c.translate(fx,fy); c.scale(side*s,s);
  const sk=L.skin||'#e0ac80',shirt=L.shirt||'#ffffff',pants=L.pants||'#2f3a5a',cap=L.cap||'#1e1e24';
  // 腿（微蹲）
  c.lineCap='round'; c.strokeStyle=shade(pants,.85); c.lineWidth=7.5; c.beginPath(); c.moveTo(-3,-30); c.lineTo(-6,-15); c.lineTo(-5,-1); c.stroke();
  c.strokeStyle=pants; c.lineWidth=8; c.beginPath(); c.moveTo(3,-30); c.lineTo(5,-15); c.lineTo(5,-1); c.stroke();
  c.fillStyle='#f4f4f4'; rr(c,-10,-3,10,5,2.5); c.fill(); rr(c,2,-3,11,5,2.5); c.fill(); c.fillStyle='#2a2a2a'; c.fillRect(-10,1,10,1.2); c.fillRect(2,1,11,1.2);
  // 皮帶、Polo 衫（前傾）
  c.fillStyle='#3a2a1a'; c.fillRect(-8,-33,17,3);
  const g=c.createLinearGradient(-9,0,10,0); g.addColorStop(0,shade(shirt,.82)); g.addColorStop(.5,shirt); g.addColorStop(1,shade(shirt,.75)); c.fillStyle=g;
  c.beginPath(); c.moveTo(-8,-33); c.lineTo(9,-33); c.lineTo(12,-52); c.quadraticCurveTo(4,-57,-4,-54); c.closePath(); c.fill();
  c.fillStyle=shade(shirt,.7); c.beginPath(); c.moveTo(3,-55); c.lineTo(8,-52); c.lineTo(5,-49); c.fill();
  // 頭（低頭看球）、帽子
  c.fillStyle=sk; c.fillRect(5,-58,5,5); c.beginPath(); c.ellipse(9,-62,6,7,.35,0,7); c.fill();
  c.fillStyle='#1a1418'; c.beginPath(); c.arc(12.5,-61,.9,0,7); c.fill(); c.fillStyle=shade(sk,.8); c.beginPath(); c.ellipse(6.5,-61,1.4,2,0,0,7); c.fill();
  c.fillStyle=L.hair||'#2a1a10'; c.beginPath(); c.ellipse(6.5,-63,5,4,.3,Math.PI*.6,Math.PI*1.6); c.fill();
  c.fillStyle=cap; c.beginPath(); c.ellipse(8.6,-66.5,6.6,4,.35,Math.PI,0); c.fill(); c.beginPath(); c.moveTo(12,-65); c.quadraticCurveTo(18,-63,19,-61); c.lineTo(13,-62); c.fill(); c.fillStyle='rgba(255,255,255,.5)'; c.beginPath(); c.arc(7,-67.5,1.2,0,7); c.fill();
  c.restore();
  // 手臂：肩膀到握把（世界座標畫，才接得到球桿）
  const shX=fx+side*s*6,shY=fy-52*s,gx2=hx+(cxh-hx)*.0,gy2=hy+6;
  c.strokeStyle=L.skin||'#e0ac80'; c.lineCap='round'; c.lineWidth=5; c.beginPath(); c.moveTo(shX,shY); c.lineTo((shX+gx2)/2+side*3,(shY+gy2)/2+3); c.lineTo(gx2,gy2); c.stroke();
  c.strokeStyle=shade(L.skin||'#e0ac80',.85); c.beginPath(); c.moveTo(shX-side*4,shY+1); c.lineTo(gx2-side*1,gy2-1); c.stroke();
  // 推桿：握把在手、桿身到桿頭
  c.strokeStyle='#1e1e24'; c.lineWidth=3; c.beginPath(); c.moveTo(gx2,gy2-2); c.lineTo(gx2,gy2+6); c.stroke();
  const sg=c.createLinearGradient(gx2,gy2,cxh,cyh); sg.addColorStop(0,'#c8ccd4'); sg.addColorStop(1,'#7a808c'); c.strokeStyle=sg; c.lineWidth=1.8; c.beginPath(); c.moveTo(gx2,gy2+4); c.lineTo(cxh,cyh); c.stroke();
  c.save(); c.translate(cxh,cyh); c.rotate(ang+Math.PI/2); c.fillStyle='rgba(0,0,0,.3)'; rr(c,-7,1,14,5,2); c.fill(); const hg=c.createLinearGradient(-7,0,7,0); hg.addColorStop(0,'#9aa0aa'); hg.addColorStop(.5,'#f0f2f6'); hg.addColorStop(1,'#7a808c'); c.fillStyle=hg; rr(c,-7,-3,14,5,2); c.fill(); c.restore(); }

/* ---------- 遊戲 ---------- */
const BALLC=['#f4f4f4','#ffd23f','#ff7eb6','#5fd0ff','#ff9d3d','#9cff6a','#c56bff','#ff5d4f'];
const SKINS=['#f2c9a0','#e0ac80','#c68a5e','#8d5a3a'];
function create(env,opts){
  const ci=clamp(opts.stage|0,0,COURSES.length-1),CO=COURSES[ci],TT=TH[CO.th],net=opts.net,me=net?net.me:0,L0=opts.look||{};
  const np=net?net.count:Math.max(1,Math.min(4,+(opts.mode||1)||1));
  const {ctx:c,canvas}=env.canvas2d(W,H);
  let G3=null; if(window.THREE&&window.__GOLF3D&&window.__H3D){ try{ G3=window.__GOLF3D(window.THREE,{W,H,CS,GW,GH,OX,OY,BR,HR,TT:TH[COURSES[clamp(opts.stage|0,0,COURSES.length-1)].th],hash,drawStatic,drawDynamic,millAng,gateY,ci:clamp(opts.stage|0,0,COURSES.length-1)}); }catch(e){ G3=null; } } /* 3D 畫面（載不到 three.js 就用原本的 2D） */
  const PL=[]; for(let i=0;i<np;i++){ const lk=net?((net.looks&&net.looks[i])||{}):i===0?L0:{}; PL.push({name:net?(net.names&&net.names[i])||'玩家'+(i+1):np===1?(opts.name||'你'):'玩家 '+(i+1),
    col:lk.ball||BALLC[i],L:{shirt:lk.shirt||['#ffffff','#e23b3b','#3d8bff','#2e9e4f'][i],pants:lk.pants||['#2f3a5a','#e8e0cc','#1e1e24','#5a4a3a'][i],cap:lk.cap||['#1e1e24','#ffffff','#e23b3b','#ffd23f'][i],skin:SKINS[+(lk.skin||[1,0,2,3][i])]||SKINS[1],hair:['#2a1a10','#6a4a2a','#1a1410','#c8a060'][i]},
    sc:[],x:0,y:0,last:null,done:false,strokes:0,gone:false}); }
  if(!net) for(let i=1;i<np;i++) if(PL[i].col===PL[0].col) PL[i].col=BALLC.find(cc=>!PL.some(p=>p.col===cc))||BALLC[i];
  let hi=0,o=null,stat=null,cur=0,ang=0,pow=0,charging=false,mt=0,ball=null,t=0,simT=0,phase='intro',phT=2.4,banner='',banT=0,waitRes=false,ended=false,fx=[],cardT=0,firstOrder=opts.first===1&&np===2?1:0,arrowT=3,shotFrom=null;
  const local=i=>!net||i===me,sfx=n=>env.sfx(n);
  function makeStatic(){ if(typeof document==='undefined'){ stat=null; return; } stat=document.createElement('canvas'); stat.width=W; stat.height=H; drawStatic(stat.getContext('2d'),o,TT,ci*6+hi); }
  function startHole(k){ hi=k; o=parseHole(CO.holes[k]); makeStatic(); for(const p of PL){ p.x=o.tee[0]; p.y=o.tee[1]; p.done=p.gone; p.strokes=0; p.last=[p.x,p.y]; }
    // 擊球順序：第一洞照擲硬幣，之後上一洞桿數少的先打
    const order=PL.map((p,i)=>i); if(k>0) order.sort((a,b)=>(PL[a].sc[k-1]||99)-(PL[b].sc[k-1]||99)||a-b); else if(firstOrder) order.unshift(order.splice(1,1)[0]); PL.order=order;
    cur=order.find(i=>!PL[i].done); if(cur==null) cur=0; ang=aimAt(PL[cur]); pow=0; charging=false; ball=null; phase='aim'; banner='第 '+(k+1)+' 洞　標準桿 '+o.par; banT=2.2; }
  function aimAt(p){ return Math.atan2(o.hole[1]-p.y,o.hole[0]-p.x); }
  function nextTurn(){ const ord=PL.order,live=ord.filter(i=>!PL[i].done&&!PL[i].gone);
    if(!live.length){ phase='card'; cardT=3.2; return; }
    // 還沒進洞的人輪流打：離洞最遠的先打（正式規則），同距離照順序
    live.sort((a,b)=>Math.hypot(PL[b].x-o.hole[0],PL[b].y-o.hole[1])-Math.hypot(PL[a].x-o.hole[0],PL[a].y-o.hole[1]));
    cur=np===1?live[0]:live[0]; ang=aimAt(PL[cur]); pow=0; charging=false; phase='aim'; }
  function shoot(a,p,tt){ const P=PL[cur]; P.strokes++; P.last=[P.x,P.y]; shotFrom=[P.x,P.y,a,p]; simT=tt; ball={x:P.x,y:P.y,vx:Math.cos(a)*p*MAXV,vy:Math.sin(a)*p*MAXV,tcd:0}; phase='roll'; sfx(p>.6?'place':'click'); charging=false; pow=0; }
  function settle(res){ // res：[x,y,狀態] 0 停 1 進洞 2 落水
    const P=PL[cur]; ball=null; waitRes=false;
    if(res[2]===1){ P.done=true; P.x=o.hole[0]; P.y=o.hole[1]; P.sc[hi]=P.strokes; const d=P.strokes-o.par,nm=P.strokes===1?'一桿進洞！':d<=-2?'老鷹！':d===-1?'小鳥！':d===0?'平標準桿':d===1?'柏忌':d===2?'雙柏忌':'+'+d;
      banner=(np>1?P.name+'　':'')+nm; banT=2; sfx(P.strokes===1||d<0?'win':'item'); for(let i=0;i<24;i++) fx.push({x:o.hole[0],y:o.hole[1],vx:(Math.random()-.5)*220,vy:-Math.random()*240,l:1,c:['#ffd23f','#ff7eb6','#5fd0ff','#9cff6a'][i%4]}); }
    else if(res[2]===2){ P.strokes++; P.x=P.last[0]; P.y=P.last[1]; banner=(HAZN[TT.haz]||'掉進水裡')+'，罰一桿'; banT=1.8; sfx('hurt'); }
    else { P.x=res[0]; P.y=res[1]; }
    const cap=o.par+3; if(!P.done&&P.strokes>=cap){ P.done=true; P.sc[hi]=cap+1; banner=(np>1?P.name+'　':'')+'超過 '+cap+' 桿，撿起來（記 '+(cap+1)+' 桿）'; banT=2.2; sfx('lose'); }
    phase='wait'; phT=.7; }
  // 連線
  if(net){
    net.onmsg=(m,from)=>{
      if(net.host&&from&&(m.sh||m.rs)) net.send(m); // 房主把別人的擊球轉給所有人
      if(m.sh&&m.sh[0]===cur&&phase==='aim'&&!local(cur)){ shoot(m.sh[1],m.sh[2],m.sh[3]); }
      if(m.rs&&m.rs[0]===cur&&!local(cur)){ if(phase==='roll'||waitRes){ settle(m.rs.slice(1)); } }
      if(m.gone!=null) leave(m.gone); };
    net.onleave=i=>{ if(net.host) net.send({gone:i}); leave(i); };
  }
  function leave(i){ const P=PL[i]; if(!P||P.gone) return; P.gone=true; P.done=true; banner=P.name+' 離開了'; banT=2; if(cur===i&&phase!=='card'){ ball=null; waitRes=false; nextTurn(); } }
  // 滑鼠／手指拖曳：往後拉、放開擊球
  let drag=null; const toC=e=>{ const r=canvas.getBoundingClientRect?canvas.getBoundingClientRect():{left:0,top:0,width:W,height:H}; const sx=(e.clientX-r.left)*W/r.width,sy=(e.clientY-r.top)*H/r.height; return G3?G3.toTable(sx,sy):[sx,sy]; };
  const onDown=e=>{ if(phase!=='aim'||!local(cur)) return; drag=toC(e); e.preventDefault&&e.preventDefault(); },onMove=e=>{ if(!drag) return; const [x,y]=toC(e),P=PL[cur],dx=P.x-x,dy=P.y-y,d=Math.hypot(dx,dy); if(d>8) ang=Math.atan2(dy,dx); pow=clamp((Math.hypot(x-drag[0],y-drag[1]))/170,0,1); },onUp=()=>{ if(!drag) return; drag=null; if(phase==='aim'&&local(cur)&&pow>.04) fire(pow); else pow=0; };
  if(canvas.addEventListener){ canvas.addEventListener('pointerdown',onDown); addEventListener('pointermove',onMove); addEventListener('pointerup',onUp); addEventListener('pointercancel',onUp); }
  function fire(p){ const a=ang; if(net) net.send({sh:[cur,a,p,simT=t]}); shoot(a,p,t); }
  function update(dt){
    t+=dt; if(banT>0) banT-=dt; if(arrowT>0) arrowT-=dt; if(G3&&env.hit('KeyV')) G3.toggle();
    for(const f of fx){ f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=400*dt; f.l-=dt; } fx=fx.filter(f=>f.l>0);
    if(ended) return;
    if(phase==='intro'){ phT-=dt; if(phT<=0||env.hit('Space')&&!net){ startHole(0); } return; }
    if(phase==='wait'){ phT-=dt; if(phT<=0) nextTurn(); return; }
    if(phase==='card'){ cardT-=dt; if(cardT<=0||(!net&&env.hit('Space')&&cardT<2.4)){ if(hi+1<CO.holes.length) startHole(hi+1); else finish(); } return; }
    if(phase==='aim'&&local(cur)){ const K=env.keys,fine=K.ArrowUp||K.ArrowDown;
      if(K.ArrowLeft||K.KeyA) ang-=dt*1.5; if(K.ArrowRight||K.KeyD) ang+=dt*1.5; if(K.ArrowUp||K.KeyW) ang-=dt*.25; if(K.ArrowDown||K.KeyS) ang+=dt*.25;
      const held=K.Space||K.Enter;
      if(held&&!drag){ if(!charging){ charging=true; mt=0; } mt+=dt; pow=.5-Math.cos(mt*2.2)*.5; }
      else if(charging){ charging=false; fire(Math.max(.05,pow)); } }
    if(phase==='roll'&&ball){ const ev=[]; for(let i=0;i<4;i++){ stepBall(o,ball,simT,dt/4,ev); simT+=dt/4; if(ball.inHole||ball.wet||ball.stop) break; }
      const P=PL[cur]; P.x=ball.x; P.y=ball.y;
      for(const e of new Set(ev)){ if(e==='bump') sfx('bump'); else if(e==='pop') sfx('item'); else if(e==='warp') sfx('boost'); else if(e==='cup') sfx('score'); else if(e==='splash') sfx('hurt'); }
      if(ball.inHole||ball.wet||ball.stop){ const res=[R2(ball.x),R2(ball.y),ball.inHole?1:ball.wet?2:0];
        if(local(cur)){ if(net) net.send({rs:[cur,...res]}); settle(res); } else { waitRes=true; ball.vx=ball.vy=0; } } }
  }
  const R2=v=>Math.round(v*100)/100;
  function totals(p){ return p.sc.reduce((a,b)=>a+(b||0),0); }
  function finish(){ ended=true; const parT=CO.holes.reduce((a,h)=>a+h.par,0),rk=PL.map((p,i)=>({p,i,tot:totals(p)})).filter(r=>!r.p.gone).sort((a,b)=>a.tot-b.tot);
    let html='<table class="ls"><tr><th>名次</th><th>玩家</th>'+CO.holes.map((h,k)=>'<th>'+(k+1)+'</th>').join('')+'<th>總桿</th></tr><tr><td></td><td>標準桿</td>'+CO.holes.map(h=>'<td>'+h.par+'</td>').join('')+'<td>'+parT+'</td></tr>';
    rk.forEach((r,j)=>{ const d=r.tot-parT; html+='<tr><td>'+(j+1)+'</td><td>'+r.p.name+'</td>'+r.p.sc.map(v=>'<td>'+v+'</td>').join('')+'<td><b>'+r.tot+'</b>（'+(d>0?'+':'')+d+'）</td></tr>'; }); html+='</table>';
    const mine=PL[me],d=totals(mine)-parT;
    if(np===1){ try{ const k='arcade.golf.c'+ci,old=localStorage.getItem(k); if(old==null||d<+old) localStorage.setItem(k,String(d)); }catch(e){} }
    const win=rk[0]&&rk[0].i===me,title=np===1?(d<=0?'漂亮！'+(d<0?'低於':'平')+'標準桿':'完成 '+CO.name):win?(net?'你拿下冠軍！':rk[0].p.name+' 獲勝！'):rk[0].p.name+' 獲勝';
    let doneN=0; try{ for(let i=0;i<COURSES.length;i++) if(localStorage.getItem('arcade.golf.c'+i)!=null) doneN++; }catch(e){}
    env.sfx(np===1?(d<=0?'win':'item'):win?'win':'lose');
    setTimeout(()=>env.end({title,big:np===1?totals(mine)+' 桿（'+(d>0?'+':'')+d+'）':rk.map(r=>r.p.name+' '+r.tot).join('　'),html,text:'標準桿 '+parT+'。每洞最多打標準桿＋3 桿，打不進記標準桿＋4。',score:np===1&&!net?doneN||null:null,next:np===1&&!net&&ci<COURSES.length-1}),1200); }
  function draw(){
    if(!o){ // 開場：球場名稱
      const oo=parseHole(CO.holes[0]); drawStatic(c,oo,TT,ci*6); drawDynamic(c,oo,TT,t); c.fillStyle='rgba(11,10,28,.6)'; c.fillRect(0,0,W,H); c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 40px '+TC; c.fillText(CO.name,W/2,H/2-30); c.fillStyle='#fff'; c.font='700 16px '+TC; c.fillText('6 洞　標準桿 '+CO.holes.reduce((a,h)=>a+h.par,0)+'　'+'★'.repeat(CO.stars),W/2,H/2+14);
      if(np>1) c.fillText('第一洞由 '+PL[firstOrder].name+' 先打',W/2,H/2+44); return; }
    if(G3){ const P0=PL[cur],near0=Math.min(...PL.filter(p=>!p.done).map(p=>Math.hypot(p.x-o.hole[0],p.y-o.hole[1])),999),bl=[];
      PL.forEach((p,i)=>{ if(p.done||p.gone) return; bl.push({i,x:p.x,y:p.y,col:p.col,alpha:i===cur?1:.55}); });
      const g=P0&&!P0.done&&phase!=='card'?(phase==='aim'?{i:cur,L:P0.L,x:P0.x,y:P0.y,ang,back:pow,follow:false}:shotFrom&&phase==='roll'?{i:cur,L:P0.L,x:shotFrom[0],y:shotFrom[1],ang:shotFrom[2],back:0,follow:true}:null):null;
      G3.render({o,t,tt:phase==='roll'?simT:t,lift:near0<90?(90-near0)*.5:0,balls:bl,g,aim:phase==='aim'&&P0&&!P0.done?{x:P0.x,y:P0.y,ang,len:40+pow*150}:null,focus:P0&&!P0.done?{x:P0.x,y:P0.y,ang:phase==='roll'&&shotFrom?shotFrom[2]:ang}:null});
      c.drawImage(G3.canvas,0,0,W,H);
      for(const f of fx){ const q=G3.toScreen(f.x,f.y,(1-f.l)*.6); c.globalAlpha=Math.max(0,f.l); c.fillStyle=f.c; c.fillRect(q[0],q[1],4,4); } c.globalAlpha=1;
      c.fillStyle='rgba(11,10,28,.6)'; rr(c,10,H-30,env.touch?96:118,22,10); c.fill(); c.fillStyle='#cfe8d8'; c.font='700 11px '+TC; c.textAlign='left'; c.textBaseline='middle'; c.fillText((env.touch?'視角鍵':'V')+'：'+(G3.view==='top'?'切到球後視角':'切到俯瞰'),18,H-19);
    } else {
    if(stat) c.drawImage(stat,0,0); else drawStatic(c,o,TT,ci*6+hi);
    drawDynamic(c,o,TT,phase==='roll'?simT:t);
    // 其他人的球（半透明），目前的球
    PL.forEach((p,i)=>{ if(i===cur||p.done||p.gone) return; drawGolfBall(c,p.x,p.y,p.col,0,.55); });
    const P=PL[cur],near=Math.min(...PL.filter(p=>!p.done).map(p=>Math.hypot(p.x-o.hole[0],p.y-o.hole[1])),999);
    drawFlag(c,o,t,near<90?(90-near)*.5:0,'#e8231c');
    // 瞄準線
    if(phase==='aim'&&P&&!P.done){ const len=40+pow*150; c.save(); c.setLineDash&&c.setLineDash([5,6]); c.strokeStyle='rgba(255,255,255,.85)'; c.lineWidth=2; c.beginPath(); c.moveTo(P.x,P.y); c.lineTo(P.x+Math.cos(ang)*len,P.y+Math.sin(ang)*len); c.stroke(); c.restore();
      c.fillStyle='rgba(255,255,255,.85)'; c.beginPath(); const ex=P.x+Math.cos(ang)*len,ey=P.y+Math.sin(ang)*len; c.moveTo(ex+Math.cos(ang)*8,ey+Math.sin(ang)*8); c.lineTo(ex+Math.cos(ang+2.5)*7,ey+Math.sin(ang+2.5)*7); c.lineTo(ex+Math.cos(ang-2.5)*7,ey+Math.sin(ang-2.5)*7); c.fill(); }
    if(P&&!P.done&&phase!=='card'){ if(phase!=='roll'||!shotFrom) drawGolfBall(c,P.x,P.y,P.col,0); else drawGolfBall(c,P.x,P.y,P.col,0);
      if(phase==='aim') drawGolfer(c,P.x,P.y,ang,pow,P.L,t,false); else if(shotFrom&&phase==='roll') drawGolfer(c,shotFrom[0],shotFrom[1],shotFrom[2],-.25,P.L,t,true); }
    for(const f of fx){ c.globalAlpha=Math.max(0,f.l); c.fillStyle=f.c; c.fillRect(f.x,f.y,4,4); } c.globalAlpha=1;
    }
    const P=PL[cur];
    // 上方資訊列
    c.fillStyle='rgba(11,10,28,.85)'; c.fillRect(0,0,W,48); c.textBaseline='middle';
    c.fillStyle='#ffd23f'; c.font='900 15px '+TC; c.textAlign='left'; c.fillText(CO.name+'　第 '+(hi+1)+' / 6 洞',12,16); c.fillStyle='#cfe8d8'; c.font='700 12px '+TC; c.fillText('標準桿 '+o.par+'　最多 '+(o.par+3)+' 桿',12,35);
    PL.forEach((p,i)=>{ const x=280+i*130; c.fillStyle=i===cur&&phase!=='card'?'rgba(255,210,63,.25)':'rgba(255,255,255,.06)'; rr(c,x,5,122,38,8); c.fill(); c.fillStyle=p.col; c.beginPath(); c.arc(x+12,24,6,0,7); c.fill();
      c.fillStyle=p.gone?'#777':'#fff'; c.font='700 12px '+TC; c.textAlign='left'; c.fillText(p.name.slice(0,6),x+22,16); c.font='700 11px '+TC; c.fillStyle='#cfe8d8'; c.fillText('本洞 '+p.strokes+'　總 '+totals(p),x+22,33); });
    // 力道條
    if(phase==='aim'&&local(cur)){ const x=W-28,y=H-150; c.fillStyle='rgba(11,10,28,.7)'; rr(c,x-6,y-6,24,132,8); c.fill(); const g=c.createLinearGradient(0,y+120,0,y); g.addColorStop(0,'#5fd068'); g.addColorStop(.6,'#ffd23f'); g.addColorStop(1,'#ff4d4d'); c.fillStyle=g; c.fillRect(x,y+120-pow*120,12,pow*120); c.strokeStyle='#fff'; c.lineWidth=1; c.strokeRect(x,y,12,120); c.fillStyle='#fff'; c.font='700 10px '+TC; c.textAlign='center'; c.fillText('力道',x+6,y-14); }
    if(phase==='aim'&&!local(cur)){ c.fillStyle='rgba(11,10,28,.7)'; rr(c,W/2-120,H-36,240,26,12); c.fill(); c.fillStyle='#fff'; c.font='700 12px '+TC; c.textAlign='center'; c.fillText('等 '+PL[cur].name+' 擊球⋯',W/2,H-23); }
    // 開場大箭頭標出自己
    if(phase==='aim'&&P&&(arrowT>0||np>1&&banT>1.6)){ const sp=G3?G3.toScreen(P.x,P.y,1.9):[P.x,P.y+20],Px=sp[0],yy=sp[1]-20+Math.sin(t*8)*5,lab=np===1?'你':net?(local(cur)?'你':P.name):P.name; c.fillStyle='#ffd23f'; c.strokeStyle='#0b0a1c'; c.lineWidth=3; c.beginPath(); c.moveTo(Px-14,yy-18); c.lineTo(Px+14,yy-18); c.lineTo(Px,yy); c.closePath(); c.stroke(); c.fill(); c.font='900 14px '+TC; c.textAlign='center'; c.lineWidth=4; c.strokeText(lab,Px,yy-28); c.fillText(lab,Px,yy-28); }
    if(banT>0&&banner){ c.globalAlpha=Math.min(1,banT*2); c.fillStyle='rgba(11,10,28,.75)'; rr(c,W/2-170,H/2-26,340,52,14); c.fill(); c.fillStyle='#ffd23f'; c.font='900 22px '+TC; c.textAlign='center'; c.fillText(banner,W/2,H/2); c.globalAlpha=1; }
    // 每洞結束的計分卡
    if(phase==='card'||ended){ c.fillStyle='rgba(11,10,28,.85)'; rr(c,W/2-260,110,520,60+np*30,14); c.fill(); c.fillStyle='#ffd23f'; c.font='900 16px '+TC; c.textAlign='center'; c.fillText('計分卡',W/2,130);
      c.font='700 12px '+TC; c.fillStyle='#cfe8d8'; c.textAlign='left'; c.fillText('洞',W/2-240,152); CO.holes.forEach((h,k)=>{ c.textAlign='center'; c.fillText(String(k+1)+(k<=hi?'':''),W/2-90+k*42,152); }); c.fillText('總',W/2+190,152);
      PL.forEach((p,i)=>{ const y=180+i*30; c.fillStyle=p.col; c.textAlign='left'; c.fillText(p.name.slice(0,6),W/2-240,y); c.fillStyle='#fff'; c.textAlign='center'; CO.holes.forEach((h,k)=>{ const v=p.sc[k]; if(v!=null){ c.fillStyle=v<h.par?'#5fd068':v>h.par?'#ff8a8a':'#fff'; c.fillText(String(v),W/2-90+k*42,y); } }); c.fillStyle='#ffd23f'; c.fillText(String(totals(p)),W/2+190,y); }); } }
  return {update,draw,destroy(){ if(G3) G3.destroy(); if(canvas.removeEventListener){ canvas.removeEventListener('pointerdown',onDown); removeEventListener('pointermove',onMove); removeEventListener('pointerup',onUp); removeEventListener('pointercancel',onUp); } },
    _dbg:{go:k=>startHole(k),PL,get o(){return o;},get phase(){return phase;},get cur(){return cur;},set ang(v){ang=v;},fire,get hi(){return hi;},skip(){ phT=0; }}};
}
function stageShow(ctx,w,h,si,t){ const CO=COURSES[si],TT=TH[CO.th],k=Math.floor(t/4)%6,o=parseHole(CO.holes[k]); ctx.save(); ctx.scale(w/W,h/H); drawStatic(ctx,o,TT,si*6+k); drawDynamic(ctx,o,TT,t); drawFlag(ctx,o,t,0);
  const u=(t%4)/4,bx=lerp(o.tee[0],o.hole[0],Math.min(1,u*1.3)),by=lerp(o.tee[1],o.hole[1],Math.min(1,u*1.3)); if(u<.75) drawGolfBall(ctx,bx,by,'#f4f4f4',0); drawGolfer(ctx,o.tee[0],o.tee[1],Math.atan2(o.hole[1]-o.tee[1],o.hole[0]-o.tee[0]),u<.1?.4:-.2,{shirt:'#ffffff',pants:'#2f3a5a',cap:'#1e1e24',skin:SKINS[1]},t);
  ctx.fillStyle='rgba(11,10,28,.75)'; rr(ctx,8,6,300,42,10); ctx.fill(); ctx.fillStyle='#ffd23f'; ctx.font='900 20px '+TC; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(CO.name+'　第 '+(k+1)+' 洞',20,27); ctx.restore(); }
function thumb(ctx,w,h,t){ ctx.save(); ctx.scale(w/W,h/H); const o=parseHole(COURSES[3].holes[1]); drawStatic(ctx,o,TH.zen,1); drawDynamic(ctx,o,TH.zen,t); drawFlag(ctx,o,t,0); drawGolfer(ctx,o.tee[0]+40,o.tee[1]+40,-.3,.3+Math.sin(t*2)*.3,{shirt:'#e23b3b',pants:'#e8e0cc',cap:'#ffffff',skin:SKINS[1]},t); drawGolfBall(ctx,o.tee[0]+40,o.tee[1]+40,'#f4f4f4',0);
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 64px '+TC; ctx.lineWidth=10; ctx.strokeStyle='#0b0a1c'; ctx.strokeText('果嶺推桿王',W/2,H/2); ctx.fillStyle='#9cff6a'; ctx.fillText('果嶺推桿王',W/2,H/2); ctx.restore(); }
function preview(ctx,w,h,L,t){ ctx.save(); ctx.scale(w/W,h/H); const o=parseHole(COURSES[0].holes[0]); drawStatic(ctx,o,TH.park,0); L=L||{}; ctx.save(); ctx.translate(-560,-500); ctx.scale(2.4,2.4);
  drawGolfer(ctx,330,250,0,.3+Math.sin(t*2)*.3,{shirt:L.shirt||'#ffffff',pants:L.pants||'#2f3a5a',cap:L.cap||'#1e1e24',skin:SKINS[+(L.skin||1)]},t); drawGolfBall(ctx,330,250,L.ball||'#f4f4f4',0); ctx.restore(); ctx.restore(); }
const getRec=i=>{ try{ const v=localStorage.getItem('arcade.golf.c'+i); return v==null?null:+v; }catch(e){ return null; } };
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).golf={
  coin:o=>{ const n=o.net?o.net.count:Math.max(1,Math.min(4,+(o.mode||1)||1)); return n===2?{verb:'先打第一洞',names:o.net?[o.net.names[0]||'玩家 1',o.net.names[1]||'玩家 2']:['玩家 1','玩家 2']}:null; },
  name:'果嶺推桿王',tag:'MINI GOLF',color:'#9cff6a',online:true,maxPlayers:4,
  desc:'寫實風的迷你高爾夫：10 座主題球場、每座 6 洞，有沙坑、水池、斜坡、冰面、彈柱、風車、移動閘門和地道。調好方向、抓好力道，用最少桿數進洞。同一台 1～4 人輪流，也能連線最多 4 人。',
  goal:'每洞用最少的桿數把球推進洞。掉進水池（熔岩、太空）罰一桿回到原位；每洞最多打標準桿＋3 桿。6 洞打完總桿數最少的贏。',
  stages:COURSES.map(c=>c.name),stars:COURSES.map(c=>c.stars),stageLabel:'選擇球場',
  stageShow,
  stageGoal:si=>{ const C=COURSES[si],p=C.holes.reduce((a,h)=>a+h.par,0),hz=HAZN[TH[C.th].haz]||'掉進水裡'; return C.name+'（'+'★'.repeat(C.stars)+'）：6 洞、標準桿 '+p+'。用最少的桿數把球推進洞，'+hz+'會罰一桿。每洞最多打標準桿＋3 桿。'; },
  stageBest:i=>{ const v=getRec(i); return v==null?'':'最佳 '+(v>0?'+':'')+v; },
  modes:[{id:'1',label:'1 人'},{id:'2',label:'2 人'},{id:'3',label:'3 人'},{id:'4',label:'4 人'}],
  help:[['← →','轉動方向（↑ ↓ 微調）'],['空白鍵','按住蓄力、放開擊球'],['V','切換視角：俯瞰整洞／站在球後面'],['滑鼠拖曳','在畫面上往後拉，方向和力道跟著變，放開擊球']],
  touchHelp:[['手指拖曳','在畫面上往後拉，放開擊球'],['◀ ▶','轉動方向'],['擊球','按住蓄力、放開擊球']],
  touch:{left:[{l:'◀',c:'ArrowLeft'},{l:'▶',c:'ArrowRight'}],right:[{l:'視角',c:'KeyV'},{l:'擊球',c:'Space',act:true}]},
  load:()=>{ const K=window.ARCADE_GAMES.kart; return K&&K.load?K.load().catch(()=>{}):Promise.resolve(); }, /* 3D 畫面要 three.js；載不到就用 2D */
  looks:[{key:'ball',label:'球的顏色',type:'color',opts:BALLC},{key:'shirt',label:'Polo 衫',type:'color',opts:['#ffffff','#e23b3b','#3d8bff','#2e9e4f','#ffd23f','#ff7eb6','#1e1e24']},
    {key:'pants',label:'褲子',type:'color',opts:['#2f3a5a','#e8e0cc','#1e1e24','#5a4a3a','#8a8a8a']},{key:'cap',label:'帽子',type:'color',opts:['#1e1e24','#ffffff','#e23b3b','#ffd23f','#3d8bff']},
    {key:'skin',label:'膚色',opts:SKINS.map((c2,i)=>({id:String(i),label:['白皙','自然','小麥','深色'][i]}))}],
  best:{label:'完成球場',fmt:v=>v+' / '+COURSES.length+' 座',lower:false},
  preview,thumb,create,_sim:{COURSES,parseHole,simShot,stepBall}
};
})();
