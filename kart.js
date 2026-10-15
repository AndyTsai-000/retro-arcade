// 極速大亂鬥：three.js 畫面，物理是平面上的 2D（位置、車頭角度、速度向量）。
// 連線時每個人自己算自己的車，房主負責電腦車並轉送所有人的位置。
(function(){
'use strict';
const THREE_URL='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const PIX='"Press Start 2P","Noto Sans TC","Microsoft JhengHei",monospace';
const TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const HALF=13,SHOULDER=7,MAX=62,MAXB=86,LAPS=3,TOTAL=6;
const COLORS=['#ff4d4d','#3d8bff','#ffd23f','#5fd068','#c56bff','#ff9d3d'];
// cut：捷徑（從第幾個路線點切到第幾個路線點，碎石路、路窄又有石頭）；hw：路面半寬
const STAGES=[
  {name:'森林小徑',stars:1,ai:.82,sky:0x8fd3ff,ground:['#4c9a3c','#448c36'],road:'#4a4a55',tree:[0x2f7d32,0x6b4a2a],
   pts:[[0,0],[160,0],[280,-40],[330,-140],[290,-240],[170,-280],[60,-230],[-40,-180],[-150,-220],[-250,-180],[-270,-80],[-190,-10],[-100,0]]},
  {name:'花田牧場',stars:1,ai:.84,sky:0x9fdcff,ground:['#7cc45a','#70b84f'],road:'#4d4a55',tree:[0x3f9a3a,0x7a5230],flowers:1,
   pts:[[0,0],[150,0],[300,10],[380,-40],[360,-130],[260,-230],[160,-320],[60,-330],[-20,-260],[-90,-160],[-160,-100],[-210,-40],[-170,0],[-80,0]]},
  {name:'海濱大道',stars:2,ai:.86,sky:0x7fdcf5,ground:['#f0dc9c','#e6cf88'],road:'#55556a',tree:[0x3fae6a,0x8a6a3a],
   pts:[[0,0],[160,0],[320,0],[440,-30],[480,-110],[420,-170],[300,-150],[200,-190],[90,-160],[-20,-200],[-140,-180],[-260,-210],[-360,-170],[-380,-80],[-300,-20],[-180,0],[-100,0]]},
  {name:'湖畔小鎮',stars:2,ai:.87,sky:0x8fd0ff,ground:['#5aa84a','#4f9b40'],road:'#505260',tree:[0x2f8a4a,0x6b4a2a],
   pts:[[0,0],[140,0],[250,-30],[300,-110],[280,-200],[200,-260],[90,-250],[40,-190],[-30,-150],[-90,-200],[-130,-280],[-220,-300],[-300,-240],[-310,-140],[-250,-50],[-100,0]]},
  {name:'沙漠峽谷',stars:3,ai:.89,sky:0xffd9a0,ground:['#d9b36a','#cfa75e'],road:'#5a4f48',tree:[0x4f9a4a,0x4f9a4a],
   pts:[[0,0],[130,0],[220,-20],[250,-80],[190,-120],[120,-110],[90,-160],[150,-210],[240,-220],[270,-280],[210,-340],[90,-350],[-20,-320],[-120,-350],[-220,-310],[-260,-220],[-200,-150],[-250,-80],[-190,-15],[-100,0]]},
  {name:'城鎮夜路',stars:3,ai:.9,sky:0x232a5c,ground:['#2f3b4f','#293447'],road:'#3c3c48',tree:[0x2a5a4a,0x3a3028],night:1,
   pts:[[0,0],[150,0],[200,-10],[210,-60],[210,-110],[260,-130],[320,-140],[330,-190],[320,-260],[270,-280],[150,-280],[100,-270],[90,-220],[80,-170],[30,-160],[-60,-160],[-110,-180],[-120,-240],[-170,-280],[-240,-270],[-260,-200],[-260,-60],[-230,-10],[-100,0]]},
  {name:'櫻花公園',stars:3,ai:.9,sky:0xffe3ef,ground:['#9ed68a','#93cc80'],road:'#5b5560',tree:[0xff9ec4,0x6b4a3a],
   pts:[[0,0],[130,0],[230,-30],[260,-110],[210,-170],[230,-250],[160,-310],[90,-270],[30,-200],[-50,-270],[-130,-310],[-210,-260],[-200,-180],[-140,-130],[-220,-80],[-200,-10],[-100,0]]},
  {name:'楓葉山道',stars:3,ai:.9,sky:0xffe8c2,ground:['#c9a45a','#bd974e'],road:'#55504e',tree:[0xe2622a,0x5a3a26],
   pts:[[0,0],[150,0],[260,-30],[300,-110],[260,-190],[160,-210],[60,-190],[-20,-220],[-40,-290],[30,-340],[130,-360],[200,-410],[150,-470],[30,-470],[-80,-430],[-150,-360],[-170,-280],[-140,-200],[-200,-140],[-260,-90],[-220,-20],[-100,0]]},
  {name:'古城石道',stars:3,ai:.91,sky:0xd9e4f0,ground:['#8a9a6a','#7f8f60'],road:'#6a625a',tree:[0x4a7a3a,0x5a4030],
   pts:[[0,0],[200,0],[300,-20],[330,-90],[280,-150],[180,-160],[150,-210],[190,-280],[170,-350],[80,-370],[-30,-340],[-60,-260],[-140,-240],[-250,-270],[-320,-210],[-300,-120],[-220,-90],[-200,-30],[-100,0]]},
  {name:'竹林溪谷',stars:3,ai:.91,sky:0xcdeedd,ground:['#4f8f4a','#478543'],road:'#55584f',tree:[0x6fbf4a,0x4a7a2a],
   pts:[[0,0],[120,0],[220,-30],[250,-100],[200,-160],[220,-230],[300,-270],[360,-340],[300,-410],[200,-400],[120,-350],[50,-390],[-30,-440],[-130,-420],[-170,-340],[-120,-270],[-170,-200],[-250,-180],[-310,-110],[-260,-40],[-180,-20],[-100,0]]},
  {name:'冰原彎道',stars:4,ai:.93,hw:12,cut:[12,16],sky:0xcfe9ff,ground:['#eef6ff','#dfeefa'],road:'#6f8ea3',tree:[0xbfe3f2,0x6f8fa3],snow:1,
   pts:[[0,0],[130,0],[210,-40],[200,-110],[130,-140],[110,-200],[170,-250],[260,-240],[330,-290],[310,-380],[220,-410],[130,-380],[60,-420],[-30,-450],[-120,-410],[-130,-330],[-70,-280],[-120,-220],[-200,-250],[-270,-200],[-260,-120],[-180,-90],[-200,-30],[-100,0]]},
  {name:'海盜港灣',stars:4,ai:.94,hw:12,cut:[5,8],sky:0xffb37a,ground:['#e9cf8f','#dcbf7c'],road:'#4f4a52',tree:[0x2f8f6a,0x7a5a36],
   pts:[[0,0],[140,0],[220,-30],[240,-100],[200,-160],[200,-260],[230,-340],[290,-350],[320,-290],[300,-190],[320,-110],[390,-80],[450,-130],[440,-230],[460,-330],[420,-410],[320,-450],[200,-430],[110,-460],[20,-420],[30,-330],[60,-250],[20,-180],[-60,-150],[-150,-200],[-230,-160],[-250,-80],[-180,-20],[-100,0]]},
  {name:'叢林遺跡',stars:4,ai:.94,hw:12,cut:[15,19],sky:0xb7e0c0,ground:['#2f7a3c','#286e35'],road:'#5a5446',tree:[0x1f6a2c,0x4a3a22],
   pts:[[0,0],[130,0],[230,-30],[270,-110],[230,-190],[140,-200],[80,-160],[10,-190],[0,-260],[60,-310],[160,-300],[250,-330],[300,-410],[240,-480],[130,-490],[30,-460],[-60,-480],[-150,-450],[-170,-370],[-110,-320],[-130,-250],[-210,-230],[-280,-170],[-270,-90],[-190,-40],[-100,0]]},
  {name:'冰河峽灣',stars:4,ai:.94,hw:12,cut:[18,21],sky:0xa9d6f5,ground:['#e6f2fb','#d5e8f6'],road:'#6a8aa3',tree:[0xd6eef8,0x5f7f93],snow:1,
   pts:[[0,0],[120,0],[200,-40],[190,-120],[120,-150],[50,-130],[-20,-170],[-10,-250],[70,-280],[170,-260],[250,-220],[320,-260],[330,-350],[260,-410],[160,-400],[80,-440],[-10,-470],[-110,-440],[-140,-360],[-100,-300],[-170,-250],[-250,-280],[-310,-220],[-290,-140],[-220,-100],[-240,-30],[-100,0]]},
  {name:'黃金礦山',stars:4,ai:.95,hw:12,cut:[8,12],sky:0xf4d49a,ground:['#a8784a','#9a6c40'],road:'#4a3f38',tree:[0x6a8a3a,0x5a3a22],
   pts:[[0,0],[110,0],[170,-30],[230,0],[300,-20],[330,-90],[280,-140],[300,-200],[250,-250],[280,-310],[230,-370],[140,-380],[90,-330],[20,-360],[-50,-330],[-120,-370],[-200,-350],[-240,-280],[-200,-220],[-250,-160],[-200,-100],[-240,-40],[-170,-10],[-100,0]]},
  {name:'雷雨高原',stars:4,ai:.95,hw:12,cut:[3,7],sky:0x5a6478,ground:['#5f7a4f','#566f47'],road:'#3a3c44',tree:[0x3f6a3a,0x3a2e26],storm:1,
   pts:[[0,0],[200,0],[280,-30],[320,-20],[400,-40],[450,-110],[420,-180],[340,-200],[300,-250],[340,-310],[420,-340],[440,-420],[370,-480],[250,-470],[150,-490],[60,-450],[30,-380],[-40,-340],[-140,-360],[-230,-330],[-260,-250],[-200,-200],[-240,-130],[-300,-80],[-260,-20],[-100,0]]},
  {name:'火山環道',stars:5,ai:.97,hw:11,cut:[7,10],sky:0x4a2030,ground:['#4a332e','#3f2a26'],road:'#2e2a30',tree:[0x8a3a22,0x3a2a22],lava:1,
   pts:[[0,0],[120,0],[180,-30],[170,-90],[100,-110],[80,-170],[150,-200],[240,-190],[300,-230],[290,-300],[210,-320],[200,-380],[270,-420],[360,-400],[400,-460],[350,-530],[240,-540],[140,-510],[60,-540],[-30,-520],[-60,-450],[0,-400],[-10,-330],[-80,-300],[-150,-340],[-230,-310],[-240,-230],[-170,-190],[-220,-130],[-280,-90],[-240,-20],[-100,0]]},
  {name:'太空站',stars:5,ai:.97,hw:11,cut:[17,21],sky:0x0c0c22,ground:['#3a3d52','#33364a'],road:'#5a3f8a',tree:[0x3ddbd9,0x8a8fa8],night:1,
   pts:[[0,0],[100,0],[150,-30],[110,-70],[160,-110],[230,-90],[290,-130],[280,-200],[200,-220],[160,-270],[220,-320],[310,-310],[380,-350],[370,-440],[290,-480],[190,-450],[110,-490],[30,-460],[40,-380],[-20,-330],[-100,-360],[-150,-430],[-240,-430],[-290,-360],[-240,-290],[-280,-220],[-230,-150],[-280,-90],[-220,-20],[-100,0]]},
  {name:'極光雪原',stars:5,ai:.98,hw:11,cut:[22,26],sky:0x1a2a4a,ground:['#dfeaf5','#cfdcea'],road:'#55708a',tree:[0xe8f4ff,0x55697a],snow:1,night:1,
   pts:[[0,0],[140,0],[240,-30],[280,-100],[350,-130],[430,-100],[490,-150],[470,-240],[390,-270],[330,-330],[380,-400],[470,-430],[480,-520],[400,-570],[290,-550],[200,-590],[100,-570],[70,-490],[130,-430],[100,-360],[20,-330],[-60,-370],[-80,-460],[-160,-500],[-260,-470],[-300,-390],[-240,-330],[-280,-250],[-350,-200],[-330,-110],[-250,-60],[-180,-10],[-100,0]]},
  {name:'霓虹都會',stars:5,ai:.98,hw:11,cut:[29,35],sky:0x150f2e,ground:['#2a2440','#231e38'],road:'#2e2a3a',tree:[0xff3bd4,0x3ddbd9],night:1,
   pts:[[0,0],[130,0],[160,-10],[170,-40],[170,-100],[180,-130],[210,-140],[290,-140],[320,-150],[330,-180],[330,-260],[320,-290],[290,-300],[200,-300],[170,-310],[160,-340],[160,-400],[150,-430],[120,-440],[20,-440],[-10,-430],[-20,-400],[-20,-330],[-30,-300],[-60,-290],[-150,-290],[-180,-280],[-190,-250],[-190,-190],[-200,-160],[-230,-150],[-270,-140],[-290,-110],[-290,-40],[-270,-10],[-200,0],[-100,0]]}
];
// 每條賽道各自記最快完賽時間（存在這台裝置）
const recKey=i=>'arcade.kart.t2.'+i,getRec=i=>{ try{ const v=parseFloat(localStorage.getItem(recKey(i))); return isFinite(v)?v:null; }catch(e){ return null; } };
function recText(i,fin,mine){ if(fin==null||!mine) return ''; const old=getRec(i); if(old==null||fin<old){ try{ localStorage.setItem(recKey(i),String(fin)); localStorage.setItem('arcade.kart.last2',String(i)); }catch(e){} return '新紀錄！'+STAGES[i].name+' '+fmtTime(fin)+(old!=null?'（原本 '+fmtTime(old)+'）':''); } return STAGES[i].name+' 最快紀錄 '+fmtTime(old); }
// 道具圖示（2D）
function itemIcon(c,x,y,r,it){
  c.save(); c.translate(x,y); c.lineJoin='round'; c.lineCap='round';
  const ol=()=>{ c.strokeStyle='#14122b'; c.lineWidth=r*.09; c.stroke(); };
  if(it==='nitro'){ c.fillStyle='#ff9d3d'; c.beginPath(); c.moveTo(-r*.25,-r*.55); c.quadraticCurveTo(0,-r*1.05,r*.25,-r*.55); c.fill(); c.fillStyle='#3ddbd9'; c.beginPath(); c.roundRect?c.roundRect(-r*.38,-r*.45,r*.76,r*1.2,r*.18):c.rect(-r*.38,-r*.45,r*.76,r*1.2); c.fill(); ol(); c.fillStyle='#fff'; c.fillRect(-r*.24,-r*.2,r*.12,r*.7); c.fillStyle='#14122b'; c.font='900 '+r*.45+'px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('N',r*.05,r*.2); }
  else if(it==='banana'){ c.strokeStyle='#14122b'; c.lineWidth=r*.5; c.beginPath(); c.arc(-r*.1,-r*.25,r*.7,.35,2.6); c.stroke(); c.strokeStyle='#ffe14a'; c.lineWidth=r*.36; c.beginPath(); c.arc(-r*.1,-r*.25,r*.7,.35,2.6); c.stroke(); c.fillStyle='#6b4a1d'; c.beginPath(); c.arc(r*.55,0,r*.1,0,7); c.fill(); }
  else if(it==='missile'){ c.rotate(-.7); c.fillStyle='#ff9d3d'; c.beginPath(); c.moveTo(-r*.95,-r*.15); c.lineTo(-r*1.25,0); c.lineTo(-r*.95,r*.15); c.fill(); c.fillStyle='#e23b3b'; c.beginPath(); c.moveTo(-r*.8,-r*.28); c.lineTo(r*.5,-r*.28); c.quadraticCurveTo(r*1.05,0,r*.5,r*.28); c.lineTo(-r*.8,r*.28); c.closePath(); c.fill(); ol(); c.fillStyle='#fff'; c.fillRect(-r*.1,-r*.28,r*.14,r*.56); c.fillStyle='#8a8fa8'; c.beginPath(); c.moveTo(-r*.8,-r*.28); c.lineTo(-r*.95,-r*.6); c.lineTo(-r*.45,-r*.28); c.fill(); c.beginPath(); c.moveTo(-r*.8,r*.28); c.lineTo(-r*.95,r*.6); c.lineTo(-r*.45,r*.28); c.fill(); }
  else if(it==='shield'){ const g=c.createRadialGradient(-r*.25,-r*.3,r*.1,0,0,r*.85); g.addColorStop(0,'#e6fbff'); g.addColorStop(1,'#4f9dff'); c.fillStyle=g; c.beginPath(); c.moveTo(0,-r*.85); c.quadraticCurveTo(r*.8,-r*.7,r*.7,-r*.1); c.quadraticCurveTo(r*.55,r*.6,0,r*.9); c.quadraticCurveTo(-r*.55,r*.6,-r*.7,-r*.1); c.quadraticCurveTo(-r*.8,-r*.7,0,-r*.85); c.fill(); ol(); c.fillStyle='#ffd23f'; c.font='900 '+r*.7+'px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('★',0,r*.05); }
  else if(it==='water'){ c.fillStyle='#4fb4ff'; c.beginPath(); c.moveTo(0,-r*.9); c.quadraticCurveTo(r*.85,-r*.1,r*.55,r*.45); c.quadraticCurveTo(0,r*.95,-r*.55,r*.45); c.quadraticCurveTo(-r*.85,-r*.1,0,-r*.9); c.fill(); ol(); c.fillStyle='rgba(255,255,255,.8)'; c.beginPath(); c.ellipse(-r*.22,-r*.05,r*.12,r*.25,.4,0,7); c.fill(); }
  else if(it==='cloud'){ c.fillStyle='#4a4d5e'; c.beginPath(); c.arc(-r*.35,0,r*.38,0,7); c.arc(r*.05,-r*.25,r*.48,0,7); c.arc(r*.42,r*.05,r*.36,0,7); c.rect(-r*.6,0,r*1.05,r*.38); c.fill(); c.strokeStyle='#4fb4ff'; c.lineWidth=r*.1; for(const d of [-.35,0,.35]){ c.beginPath(); c.moveTo(r*d,r*.55); c.lineTo(r*(d-.1),r*.85); c.stroke(); } }
  else if(it==='bolt'){ c.fillStyle='#ffe14a'; c.beginPath(); c.moveTo(r*.15,-r*.95); c.lineTo(-r*.5,r*.1); c.lineTo(-r*.02,r*.1); c.lineTo(-r*.2,r*.95); c.lineTo(r*.55,-r*.2); c.lineTo(r*.05,-r*.2); c.closePath(); c.fill(); ol(); }
  c.restore();
}
const ITEMS=['nitro','banana','missile','shield','water','cloud','bolt'],INAME={nitro:'氮氣',banana:'香蕉',missile:'飛彈',shield:'護盾',water:'水球',cloud:'烏雲',bolt:'閃電'};
const wrap=a=>{ while(a>Math.PI)a-=2*Math.PI; while(a<-Math.PI)a+=2*Math.PI; return a; };
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const r2=v=>Math.round(v*100)/100;
const fmtTime=t=>{ const m=Math.floor(t/60),s=t-m*60; return m+':'+(s<10?'0':'')+s.toFixed(2); };

function load(){
  if(window.THREE) return Promise.resolve();
  return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=THREE_URL; s.onload=()=>res(); s.onerror=()=>{s.remove();rej(new Error('three'));}; document.head.appendChild(s); });
}

/* ---- 進賽道前的預覽：左邊環境圖、右邊路線圖 ---- */
const hex=n=>'#'+n.toString(16).padStart(6,'0');
function routePts(pts){
  const out=[],n=pts.length,f=(a,b,c,d,t)=>.5*(2*b+(c-a)*t+(2*a-5*b+4*c-d)*t*t+(3*b-a-3*c+d)*t*t*t);
  for(let i=0;i<n;i++){ const a=pts[(i-1+n)%n],b=pts[i],c=pts[(i+1)%n],d=pts[(i+2)%n];
    for(let k=0;k<14;k++){ const t=k/14; out.push([f(a[0],b[0],c[0],d[0],t),f(a[1],b[1],c[1],d[1],t)]); } }
  return out;
}
function routeLen(si){ const r=routePts(STAGES[si].pts); let L=0; for(let i=0;i<r.length;i++){ const a=r[i],b=r[(i+1)%r.length]; L+=Math.hypot(b[0]-a[0],b[1]-a[1]); } return L; }
function stagePreview(ctx,w,h,si,mode){
  const st=STAGES[si],solo=mode==='route',hw=solo?w:w/2-3,hz=h*.44;
  ctx.fillStyle='#0b0a1c'; ctx.fillRect(0,0,w,h);
  // 環境
  if(!solo){
  ctx.save(); ctx.beginPath(); ctx.rect(0,0,hw,h); ctx.clip();
  ctx.fillStyle=hex(st.sky); ctx.fillRect(0,0,hw,hz); ctx.fillStyle=st.ground[0]; ctx.fillRect(0,hz,hw,h-hz);
  ctx.fillStyle=st.ground[1]; for(let i=0;i<30;i++) ctx.fillRect((i*47)%hw,hz+8+(i*31)%(h-hz-10),10,3);
  const tree=(x,y,k)=>{ ctx.fillStyle=hex(st.tree[1]); ctx.fillRect(x-2*k,y-6*k,4*k,7*k); ctx.fillStyle=hex(st.tree[0]); ctx.beginPath(); ctx.moveTo(x-9*k,y-5*k); ctx.lineTo(x,y-30*k); ctx.lineTo(x+9*k,y-5*k); ctx.fill(); };
  for(let i=0;i<9;i++) tree(8+i*hw/8.2,hz+2,.55+((i*7)%3)*.12);
  for(let i=0;i<40;i++){ const z0=i/40,z1=(i+1)/40,p0=z0*z0,p1=z1*z1,y0=hz+p0*(h-hz),y1=hz+p1*(h-hz),c0=hw*.5+38*(1-p0)*(1-p0),c1=hw*.5+38*(1-p1)*(1-p1),w0=5+p0*hw*.42,w1=5+p1*hw*.42,band=Math.floor(1/(z0+.06))%2;
    ctx.fillStyle=band?'#e23b3b':'#f4f4f4'; ctx.beginPath(); ctx.moveTo(c0-w0*1.12,y0); ctx.lineTo(c0+w0*1.12,y0); ctx.lineTo(c1+w1*1.12,y1+1); ctx.lineTo(c1-w1*1.12,y1+1); ctx.fill();
    ctx.fillStyle=st.road; ctx.beginPath(); ctx.moveTo(c0-w0,y0); ctx.lineTo(c0+w0,y0); ctx.lineTo(c1+w1,y1+1); ctx.lineTo(c1-w1,y1+1); ctx.fill(); }
  tree(hw*.1,h*.86,1.7); tree(hw*.93,h*.8,1.4);
  ctx.restore();
  }
  // 路線
  const x0=solo?0:w/2+3,r=routePts(st.pts); let a=1e9,b=-1e9,c=1e9,d=-1e9; for(const p of r){ a=Math.min(a,p[0]); b=Math.max(b,p[0]); c=Math.min(c,p[1]); d=Math.max(d,p[1]); }
  ctx.fillStyle='#211e45'; ctx.fillRect(x0,0,hw,h);
  const k=Math.min((hw-36)/(b-a),(h-44)/(d-c)),ox=x0+hw/2-(a+b)/2*k,oy=h/2+6-(c+d)/2*k,P=p=>[ox+p[0]*k,oy+p[1]*k];
  const path=()=>{ ctx.beginPath(); r.forEach((p,i)=>{ const q=P(p); i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]); }); ctx.closePath(); };
  ctx.lineJoin='round'; path(); ctx.strokeStyle='#0b0a1c'; ctx.lineWidth=11; ctx.stroke(); path(); ctx.strokeStyle=st.road; ctx.lineWidth=7; ctx.stroke(); path(); ctx.strokeStyle='#f4f0ff'; ctx.lineWidth=1.5; ctx.setLineDash([5,5]); ctx.stroke(); ctx.setLineDash([]);
  if(st.cut){ const A=P(st.pts[st.cut[0]]),B=P(st.pts[st.cut[1]]); ctx.strokeStyle='#c88a3a'; ctx.lineWidth=4; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(A[0],A[1]); ctx.lineTo(B[0],B[1]); ctx.stroke(); ctx.setLineDash([]); }
  const s0=P(r[0]),s1=P(r[6]),ang=Math.atan2(s1[1]-s0[1],s1[0]-s0[0]);
  ctx.save(); ctx.translate(s0[0],s0[1]); ctx.rotate(ang); ctx.fillStyle='#fff'; ctx.fillRect(-2,-8,4,16); ctx.fillStyle='#14122b'; ctx.fillRect(-2,-8,2,4); ctx.fillRect(0,-4,2,4); ctx.fillRect(-2,0,2,4); ctx.fillRect(0,4,2,4);
  ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.moveTo(10,-6); ctx.lineTo(22,0); ctx.lineTo(10,6); ctx.fill(); ctx.restore();
  ctx.font='700 11px '+TC; ctx.textBaseline='top'; ctx.textAlign='left';
  for(const [tx,ty,txt] of (solo?[[6,5,'路線（黃色箭頭是起跑方向'+(st.cut?'，橘色虛線是捷徑':'')+'）']]:[[6,5,'環境'],[x0+6,5,'路線（黃色箭頭是起跑方向'+(st.cut?'，橘色虛線是捷徑':'')+'）']])){ ctx.fillStyle='rgba(11,10,28,.7)'; ctx.fillRect(tx-3,ty-2,ctx.measureText(txt).width+6,16); ctx.fillStyle='#fff'; ctx.fillText(txt,tx,ty); }
}
const stageInfo=si=>{ const st=STAGES[si]; return '難度 '+'★'.repeat(st.stars)+'　一圈約 '+Math.round(routeLen(si)*.83/10)*10+' 公尺，共 '+LAPS+' 圈'+(st.cut?'　有一條不好走的捷徑':''); };

// 氮氣特效：顏色、粒子大小、存活秒數、左右抖動量、每次噴幾顆
const NITRO={
  fire:{cols:[0xffa41a,0xff5d1a,0xffe14a],size:1.9,life:.32,jit:.3,n:1},
  ice:{cols:[0x9fe8ff,0xffffff,0x4fb4ff],size:2.4,life:.45,jit:.5,n:1},
  rainbow:{cols:[0xff3b3b,0xff9d3d,0xffe14a,0x5fd068,0x4f9dff,0xb98cff],size:1.8,life:.42,jit:.2,n:1},
  bolt:{cols:[0xffe14a,0xb98cff,0xffffff],size:1,life:.2,jit:1.8,n:2},
  star:{cols:[0xff7eb6,0xffffff,0xffd23f],size:1.4,life:.55,jit:1.1,n:1}
};
// 輪子：輪框顏色、輪框佔比、寬度倍率、直徑倍率
const WHEEL={std:[0xc8ccd6,.62,1,1],gold:[0xffc928,.62,1,1],race:[0xe23b3b,.76,1.28,1],offroad:[0x6b7686,.5,1.18,1.12],neon:[0x3ddbd9,.66,1,1]};

// 頒獎用：站著、雙手舉高慶祝的人物，頭跟車上的同一顆
function buildCheer(T,L,head){
  const g=new T.Group(),suit=new T.MeshPhongMaterial({color:0xf4f4f8,shininess:20}),paint=new T.MeshPhongMaterial({color:new T.Color(L.color),shininess:60}),dark=new T.MeshLambertMaterial({color:0x1c1c24});
  const cyl=(r1,r2,h,m,x,y,z)=>{ const b=new T.Mesh(new T.CylinderGeometry(r1,r2,h,12),m); b.position.set(x,y,z); g.add(b); return b; };
  cyl(.3,.36,.8,suit,0,1.35,0); cyl(.37,.37,.12,paint,0,1.0,0); cyl(.12,.14,.18,suit,0,1.82,0);              // 身體、腰帶、脖子
  for(const x of [-.17,.17]){ cyl(.13,.12,.9,suit,x,.5,0); const sh=new T.Mesh(new T.BoxGeometry(.2,.14,.34),dark); sh.position.set(x,.07,.06); g.add(sh); } // 腿、鞋子
  const arms=[]; for(const sd of [-1,1]){ const a=new T.Group(); a.position.set(sd*.36,1.66,0); const arm=new T.Mesh(new T.CylinderGeometry(.09,.085,.8,10),suit); arm.position.y=.38; a.add(arm);
    const hand=new T.Mesh(new T.SphereGeometry(.12,10,8),dark); hand.position.y=.8; a.add(hand); const sh=new T.Mesh(new T.SphereGeometry(.17,10,8),suit); a.add(sh); a.rotation.z=-sd*.5; g.add(a); arms.push({a,sd}); }
  const h=head.clone(); h.position.set(0,2.25,0); g.add(h);
  g.userData.arms=arms; return g;
}
// 設定噴焰：顏色、長度、粗細（每格都會抖動，看起來像在噴）
function setFlame(fl,col,len,w){
  fl.visible=true;
  for(const p of fl.userData.parts){ const j=.82+Math.random()*.36; p.o.scale.set(w,len*j,w); p.o.material.color.setHex(col); p.i.scale.set(w*.9,len*j*.78,w*.9); }
  const gl=fl.userData.glow; gl.material.color.setHex(col); gl.scale.setScalar(w*(1+Math.random()*.25));
}
/* ---- 車與人物的模型：遊戲裡和「我的造型」的預覽共用 ---- */
function buildKart(T,L){
  const g=new T.Group(),PI=Math.PI;
  const paint=new T.MeshPhongMaterial({color:new T.Color(L.color),shininess:90,specular:0x666666}),
    dark=new T.MeshPhongMaterial({color:0x1c1c24,shininess:40}),rubber=new T.MeshLambertMaterial({color:0x121216}),
    metal=new T.MeshPhongMaterial({color:0xc8ccd6,shininess:140,specular:0xffffff}),seatM=new T.MeshLambertMaterial({color:0x2c2c3a}),
    suit=new T.MeshPhongMaterial({color:0xf4f4f8,shininess:20}),skin=new T.MeshLambertMaterial({color:0xf2c9a0}),lam=c=>new T.MeshLambertMaterial({color:c});
  const add=(geo,m,x,y,z,rx,ry,rz,p)=>{ const b=new T.Mesh(geo,m); b.position.set(x,y,z); b.rotation.set(rx||0,ry||0,rz||0); (p||g).add(b); return b; };
  const box=(w,h,d,m,x,y,z,rx)=>add(new T.BoxGeometry(w,h,d),m,x,y,z,rx);
  const ball=(r,m,x,y,z,sx,sy,sz)=>{ const b=add(new T.SphereGeometry(r,18,14),m,x,y,z); if(sx) b.scale.set(sx,sy,sz); return b; };
  const tube=(r,len,m,x,y,z,rx,ry,rz)=>add(new T.CylinderGeometry(r,r,len,10),m,x,y,z,rx,ry,rz);
  // 車身：畫出側面輪廓再往左右拉出厚度，邊緣倒圓角
  const hull=(pts,width,m)=>{ const sh=new T.Shape(); pts.forEach((p,i)=>i?sh.lineTo(p[0],p[1]):sh.moveTo(p[0],p[1]));
    const geo=new T.ExtrudeGeometry(sh,{depth:width-.2,bevelEnabled:true,bevelThickness:.1,bevelSize:.09,bevelSegments:4}); geo.translate(0,0,-(width-.2)/2);
    return add(geo,m,0,0,0,0,-PI/2,0); };
  const B=L.body,buggy=B==='buggy',sport=B==='sport',heavy=B==='bike',moto=heavy||B==='scooter';
  const wr=moto?(heavy?.6:.44):buggy?.68:sport?.44:.46,ww=moto?(heavy?.34:.26):buggy?.58:.44,wx=buggy?1.32:sport?1.08:1.14,wz=sport?1.3:1.12,by=moto?(heavy?.7:.6):buggy?1.02:sport?.5:.52;
  // 兩點之間拉一根圓柱（機車的前叉、手腳）
  const limb=(a,b,r,m)=>{ const d=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),len=d.length(),mesh=new T.Mesh(new T.CylinderGeometry(r,r*.92,len,10),m); mesh.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2); mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()); g.add(mesh); ball(r*1.04,m,b[0],b[1],b[2]); return mesh; };
  const glass=new T.MeshPhongMaterial({color:0x9fd8ff,transparent:true,opacity:.5,shininess:140}),gold=new T.MeshPhongMaterial({color:0xd4a017,shininess:120,specular:0xffffff}),lampW=lam(0xfff6c8),lampR=lam(0xff3b3b);
  let RH=null,wheelAt;
  if(heavy){ // 重型機車：整流罩、油箱、尾段一體的車殼
    const fair=hull([[.5,.72],[.62,1.2],[.92,1.58],[1.25,1.56],[1.72,1.24],[1.98,.98],[1.86,.76],[1.45,.64],[.9,.6]],.62,paint); // 前段尖窄的整流罩
    ball(.5,paint,0,1.5,.12,.78,.56,1.25);                                                            // 圓鼓的油箱
    hull([[-1.95,1.42],[-1.9,1.56],[-1.3,1.52],[-.6,1.42],[-.42,1.18],[-.95,1.16],[-1.65,1.28]],.46,paint); // 細長上翹的尾段
    hull([[-.3,.62],[-.2,1.05],[.55,1.15],[.62,.72],[.3,.55]],.7,dark);                               // 下方車架
    box(.16,.025,.95,lam(0xffffff),0,1.785,.12); box(.12,.02,.7,lam(0xffffff),0,1.555,-1.35);          // 車殼上的白色條紋
    box(.62,.55,.95,dark,0,.72,.15); box(.7,.2,.42,metal,0,.98,.45);                                  // 引擎
    box(.55,.42,.04,glass,0,1.74,1.12,-1.0);                                                             // 擋風鏡
    for(const x of [-.18,.18]) ball(.12,lampW,x,1.22,1.86,1,.8,.6);                                  // 雙大燈
    for(const x of [-.17,.17]) limb([x,.6,1.38],[x,1.6,1.05],.07,gold);                              // 金色倒立前叉
    box(.5,.08,.25,metal,0,1.63,1.02); tube(.04,.95,dark,0,1.52,.86,0,0,PI/2); for(const x of [-.48,.48]) ball(.07,dark,x,1.52,.86);
    for(const x of [-.18,.18]) limb([x,.6,-1.28],[x,.78,-.2],.08,dark);                              // 後搖臂
    limb([.3,.5,.45],[.32,.78,-1.05],.08,metal); add(new T.CylinderGeometry(.15,.17,.75,14),metal,.33,.86,-1.38,PI/2-.15); add(new T.CylinderGeometry(.12,.12,.05,14),dark,.33,.89,-1.76,PI/2-.15); // 排氣管
    box(.44,.1,.66,seatM,0,1.47,-.7); box(.32,.1,.05,lampR,0,1.38,-1.86); box(.3,.05,.6,paint,0,.88,1.42); // 座墊、尾燈、前土除
    wheelAt=[[0,1.38,1],[0,-1.28,1]];
    RH={hip:[0,1.5,-.62],lean:.62,grip:[.46,1.55,.86],knee:[.36,1.22,-.05],peg:[.33,.78,-.55]};
  } else if(moto){ // 一般機車（速克達）：前擋板、踏板、座墊下的車殼
    hull([[-1.45,.55],[-1.55,.8],[-1.4,1.05],[-1.0,1.12],[-.2,1.08],[-.1,.62],[.45,.55],[.6,.75],[.85,1.45],[1.05,1.62],[1.22,1.5],[1.25,1.0],[1.15,.7],[.95,.48],[-1.2,.42]],.66,paint);
    box(.7,.05,1.05,lam(0xffffff),0,.82,-.72);                                                        // 側邊白色線條
    box(.5,.03,.55,dark,0,.6,.18);                                                                     // 踏板止滑墊
    box(.5,.16,1.0,seatM,0,1.2,-.7); tube(.03,.6,metal,0,1.12,-1.32,0,0,PI/2);                       // 座墊、後扶手
    box(.36,.15,.06,lampW,0,1.42,1.23); box(.7,.12,.24,paint,0,1.74,.78);                            // 大燈、龍頭蓋
    tube(.035,1.05,dark,0,1.74,.74,0,0,PI/2); for(const x of [-.52,.52]) ball(.06,dark,x,1.74,.74);
    for(const x of [-.36,.36]){ limb([x,1.78,.76],[x*1.18,2.02,.7],.02,metal); box(.16,.1,.04,dark,x*1.18,2.05,.7); } // 後照鏡
    for(const x of [-.1,.1]) limb([x,.44,1.15],[x,1.32,.96],.055,metal);                              // 前叉
    box(.3,.06,.5,paint,0,.92,1.18); box(.28,.1,.05,lampR,0,.95,-1.56);                               // 前土除、尾燈
    wheelAt=[[0,1.15,1],[0,-1.05,1]];
    RH={hip:[0,1.26,-.66],lean:.15,grip:[.5,1.74,.74],knee:[.3,1.12,.2],peg:[.24,.62,.16]};
  } else if(sport){
    hull([[-1.95,.2],[-2,.62],[-1.6,.86],[-.75,.84],[-.25,.66],[1.1,.56],[2.15,.36],[2.3,.22],[2.2,.14],[-1.85,.14]],1.75,paint);
    box(1.5,.05,.9,dark,0,.69,.2,.14); box(1.3,.34,.06,new T.MeshPhongMaterial({color:0x9fd8ff,transparent:true,opacity:.45,shininess:120}),0,.86,.5,-.5);
    box(1.95,.06,.5,dark,0,.14,2.2); box(.9,.14,.05,dark,0,.27,2.26);                                  // 前下巴、水箱罩
    for(const x of [-.62,.62]){ box(.34,.09,.08,lampW,x,.4,2.16,.25); box(.36,.11,.04,dark,x,.4,2.21,.25); } // 斜長型大燈
    box(1.5,.06,.05,lampR,0,.57,-2.0); box(1.2,.12,.06,dark,0,.2,-1.98);                              // 一字尾燈、後擾流
    for(const x of [-.38,.38]){ add(new T.CylinderGeometry(.08,.08,.18,12),metal,x,.22,-2.02,PI/2); } // 雙排氣尾管
    for(const x of [-1,1]) for(const z of [-1.3,1.3]) ball(.62,paint,x*.97,.7,z,.36,.32,1.0);         // 蓋在輪胎上方的輪拱
    for(const x of [-1,1]){ box(.04,.18,.5,dark,x*.9,.42,.5); limb([x*.75,.82,.56],[x*.93,.9,.5],.025,dark); ball(.1,paint,x*.95,.9,.5,1.5,.9,.6); } // 側邊進氣口、後照鏡
    for(const x of [-.42,.42]) add(new T.TorusGeometry(.22,.05,8,16,PI),metal,x,.84,-.98);           // 頭枕後方的防滾架
  } else if(buggy){
    hull([[-1.55,.75],[-1.55,1.42],[-.6,1.42],[-.5,1.22],[.72,1.26],[1.62,1.22],[1.7,.98],[1.68,.75]],1.62,paint); // 方正車身
    box(1.3,.5,.05,paint,0,1.0,1.71); for(let i=-3;i<=3;i++) box(.07,.34,.03,dark,i*.15,1.02,1.74);   // 七孔水箱罩
    for(const x of [-.56,.56]){ add(new T.CylinderGeometry(.15,.15,.06,18),lampW,x,1.05,1.74,PI/2); add(new T.TorusGeometry(.15,.03,6,18),metal,x,1.05,1.77); } // 圓形大燈
    for(const x of [-.78,.78]) tube(.045,.85,dark,x,1.66,.74); tube(.045,1.6,dark,0,2.08,.74,0,0,PI/2); box(1.5,.78,.03,glass,0,1.68,.76,-.1); // 直立擋風玻璃
    for(const x of [-1,1]) for(const z of [-1.18,1.18]) box(.5,.1,1.45,dark,x*1.18,1.36,z);          // 黑色輪拱
    for(const x of [-.72,.72]){ tube(.06,1.1,metal,x,1.95,-.95); } tube(.06,1.5,metal,0,2.5,-.95,0,0,PI/2); limb([-.72,2.5,-.95],[-.72,2.05,.0],.05,metal); limb([.72,2.5,-.95],[.72,2.05,.0],.05,metal); // 防滾架
    add(new T.TorusGeometry(.4,.17,10,22),rubber,0,1.25,-1.76); add(new T.CircleGeometry(.24,18),metal,0,1.25,-1.94,0,PI,0); // 後背備胎
    box(1.95,.2,.24,dark,0,.78,1.86); box(1.95,.2,.22,dark,0,.78,-1.66); for(const x of [-.9,.9]) box(.16,.06,1.4,dark,x,.66,0); // 前後保桿、側踏板
  } else {
    box(1.25,.05,2.9,dark,0,.22,0); for(const x of [-.58,.58]) tube(.045,3,metal,x,.28,0,PI/2);        // 車架與底盤
    hull([[1.3,.18],[1.38,.42],[1.75,.47],[2.05,.37],[2.12,.24],[1.92,.15],[1.3,.15]],1.75,paint);       // 前鼻翼
    hull([[.5,.28],[.56,.86],[.74,.9],[1.02,.5],[1.02,.28]],.92,paint);                                   // 方向盤前的面板
    { const cv=document.createElement('canvas'); cv.width=cv.height=96; const c=cv.getContext('2d'); c.fillStyle='#fff'; c.beginPath(); c.arc(48,48,46,0,7); c.fill(); c.fillStyle='#14122b'; c.font='900 58px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(1+(parseInt(String(L.color).slice(1),16)%9)),48,52);
      add(new T.CircleGeometry(.22,24),new T.MeshBasicMaterial({map:new T.CanvasTexture(cv)}),0,.66,.955,-.62); }   // 號碼牌
    for(const x of [-1,1]){ const sp=hull([[-.9,.18],[-.85,.5],[-.3,.55],[.48,.48],[.72,.3],[.58,.18]],.3,paint); sp.position.x=x*.86; } // 側箱
    box(1.95,.18,.24,dark,0,.34,-1.64); for(const x of [-.6,.6]) box(.08,.08,.5,metal,x,.3,-1.4);      // 後保桿
    box(.42,.42,.5,dark,.5,.5,-.86); add(new T.CylinderGeometry(.17,.17,.32,14),metal,.5,.86,-.86);     // 引擎
    limb([.62,.55,-1.08],[.78,.48,-1.55],.07,metal); add(new T.CylinderGeometry(.12,.12,.45,12),metal,.8,.48,-1.72,PI/2); // 排氣管
  }
  // 座椅與方向盤
  const sy=by+(buggy?.2:.12);
  if(!moto){ box(.78,.12,.7,seatM,0,sy,-.5); box(.78,.85,.14,seatM,0,sy+.42,-.88,-.2); box(.5,.2,.1,seatM,0,sy+.9,-.98,-.2);
  tube(.035,.75,metal,0,sy+.38,.22,-.95); add(new T.TorusGeometry(.26,.05,8,18),dark,0,sy+.6,.02,-.95+PI/2); }
  // 輪胎：胎面、輪框、輪輻
  const wheels=[],WS=WHEEL[L.wheel]||WHEEL.std,neon=L.wheel==='neon',rimM=neon?new T.MeshBasicMaterial({color:WS[0]}):new T.MeshPhongMaterial({color:WS[0],shininess:140,specular:0xffffff}),w2=ww*WS[2];
  for(const [x,z,k] of (moto?wheelAt:[[-wx,wz,1],[wx,wz,1],[-wx,-wz,sport||buggy?1:1.14],[wx,-wz,sport||buggy?1:1.14]])){
    const w=new T.Group(),r=wr*k*WS[3]; w.position.set(x,r,z); g.add(w);
    add(new T.CylinderGeometry(r,r,w2,24),rubber,0,0,0,0,0,PI/2,w); add(new T.TorusGeometry(r-.06,.07,8,24),rubber,-w2/2+.03,0,0,0,PI/2,0,w); add(new T.TorusGeometry(r-.06,.07,8,24),rubber,w2/2-.03,0,0,0,PI/2,0,w);
    add(new T.CylinderGeometry(r*WS[1],r*WS[1],w2+.03,18),rimM,0,0,0,0,0,PI/2,w); add(new T.CylinderGeometry(r*.2,r*.2,w2+.08,10),paint,0,0,0,0,0,PI/2,w);
    for(let i=0;i<3;i++) add(new T.BoxGeometry(w2+.05,.07,r*WS[1]*1.8),dark,0,0,0,i*PI/3,0,0,w);
    if(L.wheel==='offroad') for(let i=0;i<10;i++){ const a=i*PI/5; add(new T.BoxGeometry(w2*1.04,.16,.22),rubber,0,Math.cos(a)*r,Math.sin(a)*r,a,0,0,w); }   // 越野胎的顆粒
    if(neon){ add(new T.TorusGeometry(r*.8,.045,6,24),rimM,-w2/2-.02,0,0,0,PI/2,0,w); add(new T.TorusGeometry(r*.8,.045,6,24),rimM,w2/2+.02,0,0,0,PI/2,0,w); }
    if(moto) add(new T.CylinderGeometry(r*.58,r*.58,.03,20),metal,w2/2+.05,0,0,0,0,PI/2,w); // 碟煞
    wheels.push(w);
  }
  if(!moto){ tube(.07,wx*2,dark,0,wr,wz,0,0,PI/2); tube(.07,wx*2,dark,0,wr,-wz,0,0,PI/2); }
  // 配件
  const ry=moto?(heavy?1.5:1.15):buggy?1.25:sport?.9:.72,rz=moto?(heavy?-1.6:-1.38):sport?-1.75:-1.45;
  if(moto){ if(L.part==='wing'){ box(1.0,.06,.42,paint,0,ry+.5,rz,-.12); tube(.04,.5,metal,-.3,ry+.25,rz); tube(.04,.5,metal,.3,ry+.25,rz); }
    else if(L.part==='flag'){ tube(.035,1.8,metal,-.22,ry+.9,rz); const f=add(new T.PlaneGeometry(.8,.5),new T.MeshLambertMaterial({color:0xffd23f,side:T.DoubleSide}),.2,ry+1.55,rz); f.rotation.y=.25; ball(.07,metal,-.22,ry+1.82,rz); }
    else if(L.part==='exhaust'){ for(const x of [-.3,.3]) add(new T.CylinderGeometry(.1,.13,.7,12),metal,x,ry-.35,rz-.05,1.3); } }
  else if(L.part==='wing'){ box(2.3,.08,.62,paint,0,ry+.75,rz,-.12); box(.06,.42,.7,dark,-1.16,ry+.72,rz); box(.06,.42,.7,dark,1.16,ry+.72,rz); tube(.05,.75,metal,-.55,ry+.36,rz); tube(.05,.75,metal,.55,ry+.36,rz); }
  else if(L.part==='flag'){ tube(.035,2.4,metal,-.62,ry+1.2,rz); const f=add(new T.PlaneGeometry(.95,.55),new T.MeshLambertMaterial({color:0xffd23f,side:T.DoubleSide}),-.14,ry+2.1,rz,0,0,0); f.rotation.y=.25; ball(.07,metal,-.62,ry+2.42,rz); }
  else if(L.part==='exhaust'){ for(const x of [-.42,.42]){ add(new T.CylinderGeometry(.13,.16,1.1,12),metal,x,ry+.05,rz-.3,1.15); add(new T.CylinderGeometry(.16,.16,.16,12),dark,x,ry+.28,rz-.82,1.15); } }
  else { box(1.7,.07,.4,dark,0,ry+.32,rz); tube(.04,.34,metal,-.5,ry+.15,rz); tube(.04,.34,metal,.5,ry+.15,rz); }
  // 駕駛：身體、手臂握方向盤、頭（全部收成一組，頒獎時人物可以自己跳）
  const n0=g.children.length;
  if(moto){ const H=RH.hip,tp=[0,H[1]+Math.cos(RH.lean)*.8,H[2]+Math.sin(RH.lean)*.8];
    limb(H,tp,.34,suit); add(new T.CylinderGeometry(.35,.35,.12,14),paint,0,H[1]+.12,H[2]+.06,RH.lean);
    for(const sx of [-1,1]){ const sh=[sx*.36,tp[1]-.08,tp[2]-.02],gp=[sx*RH.grip[0],RH.grip[1],RH.grip[2]],el=[(sh[0]+gp[0])/2+sx*.1,(sh[1]+gp[1])/2+.06,(sh[2]+gp[2])/2];
      ball(.17,suit,sh[0],sh[1],sh[2]); limb(sh,el,.09,suit); limb(el,gp,.085,suit); ball(.1,dark,gp[0],gp[1],gp[2]);
      const hp=[sx*.2,H[1],H[2]],kn=[sx*RH.knee[0],RH.knee[1],RH.knee[2]],pg=[sx*RH.peg[0],RH.peg[1],RH.peg[2]]; limb(hp,kn,.14,suit); limb(kn,pg,.12,suit); box(.16,.14,.32,dark,pg[0],pg[1]-.04,pg[2]+.08); }
    add(new T.CylinderGeometry(.12,.14,.16,10),L.driver==='helmet'?dark:skin,0,tp[1]+.1,tp[2]+.04);
    RH.hy=tp[1]+.45; RH.hz=tp[2]+.1; }
  else {
  add(new T.CylinderGeometry(.3,.38,.78,14),suit,0,sy+.5,-.55,-.1); add(new T.CylinderGeometry(.31,.31,.12,14),paint,0,sy+.62,-.56,-.1);
  for(const x of [-1,1]){ ball(.17,suit,x*.36,sy+.82,-.56); add(new T.CylinderGeometry(.09,.085,.72,10),suit,x*.31,sy+.68,-.22,1.18,0,x*.12); ball(.1,dark,x*.24,sy+.58,.06);
    add(new T.CylinderGeometry(.14,.12,.85,10),suit,x*.2,sy+.14,-.05,PI/2-.12); }
  add(new T.CylinderGeometry(.12,.14,.16,10),L.driver==='helmet'?dark:skin,0,sy+.97,-.57); }
  const n1=g.children.length;
  const hy=moto?RH.hy:sy+1.32,hz=moto?RH.hz:-.57,eye=(x,r,c)=>{ ball(r||.055,lam(c||0x15151c),x,hy+.06,hz+.4); };
  if(L.driver==='photo'&&L.face&&!/^data:image\/jpeg/.test(L.face)){ // 剪下來的整顆頭：永遠面向鏡頭
    const img=new Image(),tx=new T.Texture(img),sm=new T.SpriteMaterial({map:tx,transparent:true,opacity:0}); img.onload=()=>{ tx.needsUpdate=true; sm.opacity=1; sm.needsUpdate=true; }; img.src=L.face;
    const sp=new T.Sprite(sm); sp.scale.set(1.55,1.55,1); sp.position.set(0,hy+.12,hz); sp.center.set(.5,.45); g.add(sp); }
  else if(L.driver==='photo'){ ball(.44,skin,0,hy,hz); add(new T.SphereGeometry(.455,20,10,0,PI*2,0,PI*.32),lam(0x2a1f1a),0,hy,hz); // 頭與頭髮（舊的方形照片）
    if(L.face){ const img=new Image(),tx=new T.Texture(img),fm=new T.MeshBasicMaterial({color:0xf2c9a0}); img.onload=()=>{ tx.needsUpdate=true; fm.map=tx; fm.color.set(0xffffff); fm.needsUpdate=true; }; img.src=L.face; // 照片載入前先顯示膚色
      const pl=PI*.82; add(new T.SphereGeometry(.448,28,18,PI/2-pl/2,pl,PI*.2,PI*.6),fm,0,hy,hz); }
    else { eye(-.16); eye(.16); } }
  else if(L.driver==='bear'){ const br=lam(0x9a6a3a),cr=lam(0xf0d6ad); ball(.46,br,0,hy,hz); for(const x of [-.34,.34]){ ball(.17,br,x,hy+.38,hz); ball(.09,cr,x,hy+.38,hz+.1); }
    ball(.2,cr,0,hy-.1,hz+.36,1.15,.85,1); ball(.07,lam(0x2a1b12),0,hy-.03,hz+.55); eye(-.17); eye(.17); }
  else if(L.driver==='bunny'){ const wh=lam(0xfafafa),pk=lam(0xffa8c8); ball(.44,wh,0,hy,hz); for(const x of [-.17,.17]){ ball(.14,wh,x,hy+.72,hz,1,3.2,.7); ball(.08,pk,x,hy+.72,hz+.06,1,3.6,.5); }
    ball(.16,wh,0,hy-.1,hz+.36,1.2,.8,1); ball(.055,pk,0,hy-.03,hz+.5); eye(-.17); eye(.17); }
  else if(L.driver==='cap'){ ball(.42,skin,0,hy,hz); add(new T.SphereGeometry(.445,18,10,0,PI*2,0,PI/2),paint,0,hy+.03,hz); const br=add(new T.CylinderGeometry(.3,.3,.04,16),paint,0,hy+.06,hz+.44); br.scale.set(1,1,.8);
    add(new T.SphereGeometry(.43,16,8,PI,PI,PI/2,.6),lam(0x3a2a20),0,hy,hz); eye(-.16); eye(.16); ball(.05,lam(0xe0a882),0,hy-.05,hz+.42); box(.16,.025,.02,lam(0x9a4a3a),0,hy-.17,hz+.38); }
  else { ball(.47,paint,0,hy,hz); add(new T.SphereGeometry(.485,20,8,PI/2-.95,1.9,1.12,.6),new T.MeshPhongMaterial({color:0x10121c,shininess:160,specular:0xaaccff}),0,hy,hz);
    add(new T.TorusGeometry(.47,.03,6,24),lam(0xffffff),0,hy,hz,0,0,0); box(.5,.1,.3,dark,0,hy-.36,hz+.22); }
  const headG=new T.Group(); for(const c of g.children.slice(n1)){ c.position.y-=hy; c.position.z-=hz; headG.add(c); } headG.position.set(0,hy,hz); g.add(headG);
  const anim=[],D=new Set(String(L.deco||'').split(',')),goldD=new T.MeshPhongMaterial({color:0xffc928,shininess:140,specular:0xffffff}),hTop=L.driver==='photo'&&L.face&&!/^data:image\/jpeg/.test(L.face)?.78:L.driver==='bunny'?.95:.5;
  const hadd=(geo,m,x,y,z,rx,ry,rz)=>{ const b=new T.Mesh(geo,m); b.position.set(x,y,z); b.rotation.set(rx||0,ry||0,rz||0); headG.add(b); return b; };
  if(D.has('halo')){ const h=hadd(new T.TorusGeometry(.36,.055,10,28),new T.MeshBasicMaterial({color:0xfff2a8}),0,hTop+.32,0,PI/2); anim.push(t=>{ h.position.y=hTop+.32+Math.sin(t*3)*.05; h.rotation.z=t*1.2; }); }
  else if(D.has('horns')){ for(const x of [-1,1]){ const c=hadd(new T.ConeGeometry(.1,.38,10),lam(0xd32f2f),x*.26,hTop+.08,.05,0,0,-x*.45); c.scale.set(1,1,1); } }
  else if(D.has('crown')){ const cr=new T.Group(); cr.position.set(0,hTop+.06,0); headG.add(cr); const base=new T.Mesh(new T.CylinderGeometry(.3,.27,.16,16,1,true),goldD); base.material.side=T.DoubleSide; cr.add(base);
    for(let i=0;i<6;i++){ const a=i*PI/3,sp=new T.Mesh(new T.ConeGeometry(.07,.2,6),goldD); sp.position.set(Math.cos(a)*.28,.17,Math.sin(a)*.28); cr.add(sp); const gm=new T.Mesh(new T.SphereGeometry(.045,8,6),lam([0xe23b3b,0x3d8bff,0x5fd068][i%3])); gm.position.set(Math.cos(a)*.3,0,Math.sin(a)*.3); cr.add(gm); } cr.rotation.z=.12; }
  else if(D.has('propeller')){ const cap=hadd(new T.SphereGeometry(.3,14,8,0,PI*2,0,PI/2),lam(0x3d8bff),0,hTop-.08,0); hadd(new T.CylinderGeometry(.025,.025,.22,8),lam(0x22222c),0,hTop+.12,0); const pr=new T.Group(); pr.position.set(0,hTop+.24,0); headG.add(pr);
    for(const sd of [-1,1]){ const bl=new T.Mesh(new T.BoxGeometry(.5,.025,.1),lam(sd>0?0xff5d4f:0xffd23f)); bl.position.x=sd*.25; pr.add(bl); } anim.push(t=>{ pr.rotation.y=t*14; }); }
  else if(D.has('catears')){ for(const x of [-1,1]){ hadd(new T.ConeGeometry(.21,.44,4),lam(0x2e2e3a),x*.27,hTop+.02,0,0,PI/4,-x*.38); hadd(new T.ConeGeometry(.11,.26,4),lam(0xff9ec4),x*.27,hTop,.09,0,PI/4,-x*.38); } }
  else if(D.has('party')){ const c=hadd(new T.ConeGeometry(.2,.55,18),lam(0xff5dc8),.1,hTop+.18,0,0,0,-.22);
    for(let i=0;i<3;i++){ const r=new T.Mesh(new T.TorusGeometry(.15-i*.045,.025,6,18),lam(0xffe14d)); r.rotation.x=PI/2; r.position.y=-.14+i*.14; c.add(r); }
    const pom=new T.Mesh(new T.SphereGeometry(.08,10,8),lam(0x5ff0ff)); pom.position.y=.3; c.add(pom); anim.push(t=>{ c.rotation.z=-.22+Math.sin(t*5)*.06; }); }
  else if(D.has('bow')){ const bw=new T.Group(); bw.position.set(.22,hTop-.04,.05); bw.rotation.z=-.4; headG.add(bw); const rm=lam(0xff3b6b);
    for(const sd of [-1,1]){ const c=new T.Mesh(new T.ConeGeometry(.16,.3,12),rm); c.rotation.z=sd*PI/2; c.position.x=-sd*.15; c.scale.set(1,1,.45); bw.add(c); }
    bw.add(new T.Mesh(new T.SphereGeometry(.08,10,8),rm)); }
  else if(D.has('antenna')){ for(const x of [-1,1]){ const a=new T.Group(); a.position.set(x*.16,hTop-.06,0); headG.add(a); const st=new T.Mesh(new T.CylinderGeometry(.02,.02,.42,6),lam(0x22222c)); st.position.y=.21; a.add(st);
      const bl=new T.Mesh(new T.SphereGeometry(.08,10,8),new T.MeshBasicMaterial({color:0x8dff5a})); bl.position.y=.44; a.add(bl); a.rotation.z=-x*.3; anim.push(t=>{ a.rotation.z=-x*.3+Math.sin(t*7+x)*.15; }); } }
  else if(D.has('wizard')){ const wz=new T.Group(); wz.position.set(0,hTop-.12,0); headG.add(wz); const pm=new T.MeshPhongMaterial({color:0x5b3fd1,shininess:40});
    const br=new T.Mesh(new T.CylinderGeometry(.62,.62,.04,24),pm); wz.add(br); const cn=new T.Mesh(new T.ConeGeometry(.34,.85,20),pm); cn.position.set(0,.42,-.05); cn.rotation.x=-.18; wz.add(cn);
    const bd=new T.Mesh(new T.CylinderGeometry(.35,.35,.08,20),lam(0xffd23f)); bd.position.y=.06; wz.add(bd); const st=new T.Mesh(new T.OctahedronGeometry(.08),goldD); st.position.set(.18,.35,.26); wz.add(st); }
  else if(D.has('flower')){ const fl=new T.Group(); fl.position.set(.22,hTop+.02,.1); fl.rotation.set(.3,0,-.35); headG.add(fl); const yl=lam(0xffd23f);
    for(let i=0;i<8;i++){ const p=new T.Mesh(new T.SphereGeometry(.07,8,6),yl); const a=i*PI/4; p.position.set(Math.cos(a)*.12,Math.sin(a)*.12,0); p.scale.set(1.5,.8,.4); p.rotation.z=a; fl.add(p); }
    const cd=new T.Mesh(new T.SphereGeometry(.07,10,8),lam(0x6b3a1a)); cd.scale.z=.5; fl.add(cd); anim.push(t=>{ fl.rotation.z=-.35+Math.sin(t*3)*.12; }); }
  if(!(L.driver==='photo'&&L.face&&!L.face.startsWith('data:image/jpeg'))){ const fz=(L.driver==='photo'||L.driver==='helmet'||!L.driver)?.5:.45; // 臉部（大頭照是平面的，不戴）
    if(D.has('shades')){ const bm=new T.MeshPhongMaterial({color:0x0a0a12,shininess:200,specular:0x8899ff}); for(const x of [-.16,.16]) hadd(new T.BoxGeometry(.24,.13,.04),bm,x,.06,fz);
      hadd(new T.BoxGeometry(.1,.03,.03),bm,0,.1,fz); }
    else if(D.has('hearts')){ const hs=new T.Shape(); hs.moveTo(0,-.1); hs.bezierCurveTo(-.16,.0,-.12,.13,0,.06); hs.bezierCurveTo(.12,.13,.16,0,0,-.1);
      const hg=new T.ExtrudeGeometry(hs,{depth:.03,bevelEnabled:false}),hm=new T.MeshPhongMaterial({color:0xff3b8a,shininess:120}); for(const x of [-.16,.16]) hadd(hg,hm,x,.04,fz-.01).scale.setScalar(1.25);
      hadd(new T.BoxGeometry(.1,.03,.03),hm,0,.09,fz); }
    else if(D.has('mustache')){ const mm=lam(0x3b2414); for(const x of [-1,1]) hadd(new T.TorusGeometry(.08,.03,6,12,PI*1.2),mm,x*.08,-.13,fz-.04,0,0,x>0?PI*1.1:-.3); } }
  const dv=new T.Group(); for(const c of g.children.slice(n0)){ c.position.z-=hz; dv.add(c); } dv.position.z=hz; g.add(dv);
  { const hood=moto?(heavy?[0,1.66,1.05]:[0,1.85,.78]):buggy?[0,1.3,1.25]:sport?[0,.66,1.45]:[0,.7,1.55];
    const plush=(sc,col)=>{ const p=new T.Group(),fur=lam(col),cr=lam(0xf3dcb4); const at=(geo,m,x,y,z)=>{ const b=new T.Mesh(geo,m); b.position.set(x,y,z); p.add(b); return b; };
      at(new T.SphereGeometry(.26,12,10),fur,0,.26,0).scale.set(1,1.05,.9); at(new T.SphereGeometry(.13,10,8),cr,0,.24,.17); at(new T.SphereGeometry(.21,12,10),fur,0,.62,0);
      for(const x of [-.15,.15]){ at(new T.SphereGeometry(.075,8,6),fur,x,.8,0); at(new T.SphereGeometry(.09,8,6),fur,x*1.6,.24,.08); at(new T.SphereGeometry(.09,8,6),fur,x*1.1,.04,.12); at(new T.SphereGeometry(.026,6,5),lam(0x15151c),x*.5,.66,.18); }
      at(new T.SphereGeometry(.08,8,6),cr,0,.57,.17); at(new T.SphereGeometry(.028,6,5),lam(0x15151c),0,.6,.24); p.scale.setScalar(sc); return p; };
    if(D.has('bear')){ const b=plush(1,0xb07a48); b.position.set(moto?0:.55,ry+(moto?-.05:.02),rz+(moto?.15:.05)); g.add(b); }
    if(D.has('charm')){ tube(.025,1.4,metal,-.55,ry+.7,rz); tube(.02,.4,metal,-.38,ry+1.4,rz,0,0,PI/2); const sw=new T.Group(); sw.position.set(-.2,ry+1.4,rz); g.add(sw);
      const str=new T.Mesh(new T.CylinderGeometry(.008,.008,.28,4),lam(0xffffff)); str.position.y=-.14; sw.add(str); const b=plush(.8,0xff9ec4); b.position.y=-.95; sw.add(b);
      anim.push((t,sp)=>{ sw.rotation.z=Math.sin(t*4.2)*(.25+Math.min(.35,(sp||0)*.006)); sw.rotation.x=-Math.min(.5,(sp||0)*.008)+Math.sin(t*3.1)*.08; }); }
    if(D.has('duck')){ const d=new T.Group(),yl=lam(0xffd23f); const at=(geo,m,x,y,z)=>{ const b=new T.Mesh(geo,m); b.position.set(x,y,z); d.add(b); return b; };
      at(new T.SphereGeometry(.28,14,10),yl,0,.22,0).scale.set(1,.8,1.25); at(new T.SphereGeometry(.18,12,10),yl,0,.52,.16); const bk=at(new T.ConeGeometry(.07,.18,8),lam(0xff8a1a),0,.5,.36); bk.rotation.x=PI/2;
      for(const x of [-.08,.08]) at(new T.SphereGeometry(.03,6,5),lam(0x15151c),x,.57,.3); at(new T.SphereGeometry(.12,8,6),yl,0,.32,-.32).scale.set(1,.7,1);
      d.position.set(hood[0],hood[1],hood[2]); g.add(d); anim.push(t=>{ d.rotation.z=Math.sin(t*5)*.12; }); }
    if(D.has('balloon')){ const bx=moto?.25:.6,by2=ry+2.5,bal=new T.Group(); bal.position.set(bx,by2,rz-.1); g.add(bal); const rd=new T.MeshPhongMaterial({color:0xff3b5c,shininess:120,specular:0xffffff});
      for(const x of [-.17,.17]){ const s2=new T.Mesh(new T.SphereGeometry(.24,14,12),rd); s2.position.set(x,.08,0); bal.add(s2); } const cn=new T.Mesh(new T.ConeGeometry(.33,.42,16),rd); cn.rotation.x=PI; cn.position.y=-.2; bal.add(cn);
      const strg=new T.Mesh(new T.CylinderGeometry(.008,.008,1,4),lam(0xffffff)); g.add(strg); anim.push(t=>{ bal.position.y=by2+Math.sin(t*2)*.12; bal.rotation.z=Math.sin(t*1.6)*.2; const top=bal.position;
        strg.position.set((bx+top.x)/2,(ry+.2+top.y-.4)/2,rz-.1); strg.scale.y=top.y-.4-(ry+.2); }); }
    if(D.has('wings')){ const wm=new T.MeshPhongMaterial({color:0xffffff,shininess:30,side:T.DoubleSide}),wx=moto?.38:buggy?1.0:.85,wy=moto?(heavy?1.4:1.15):by+.55,wz=moto?-.4:-.6;
      for(const sd of [-1,1]){ const wg=new T.Group(); wg.position.set(sd*wx,wy,wz); g.add(wg);
        for(let i=0;i<3;i++){ const f=new T.Mesh(new T.SphereGeometry(.4-i*.08,12,8),wm); f.scale.set(1.7,.42,.07); f.position.set(sd*(.45+i*.16),.16-i*.2,-i*.08); f.rotation.z=sd*(.35+i*.18); wg.add(f); }
        anim.push(t=>{ wg.rotation.z=sd*(Math.sin(t*6)*.35+.15); }); } }
    const seat=[moto?0:.55,ry+(moto?-.05:.02),rz+(moto?.15:.05)],put=(o,p)=>{ o.position.set(p[0],p[1],p[2]); g.add(o); return o; };
    const grp=()=>{ const d=new T.Group(); d.at=(geo,m,x,y,z)=>{ const b=new T.Mesh(geo,m); b.position.set(x,y,z); d.add(b); return b; }; return d; };
    if(D.has('penguin')){ const d=grp(),bk=lam(0x1d2233),wh=lam(0xffffff),or=lam(0xff8a1a); d.at(new T.SphereGeometry(.26,14,10),bk,0,.3,0).scale.set(1,1.25,.95); d.at(new T.SphereGeometry(.2,12,10),wh,0,.27,.08).scale.set(1,1.2,.8);
      d.at(new T.SphereGeometry(.17,12,10),bk,0,.66,0); for(const x of [-.07,.07]){ d.at(new T.SphereGeometry(.035,6,5),wh,x,.7,.14); d.at(new T.SphereGeometry(.07,8,6),or,x*1.6,.02,.08).scale.set(1,.4,1.4); }
      d.at(new T.ConeGeometry(.05,.13,8),or,0,.63,.2).rotation.x=PI/2; for(const x of [-1,1]) d.at(new T.SphereGeometry(.09,8,6),bk,x*.26,.32,0).scale.set(.45,1.4,.8);
      put(d,hood); anim.push(t=>{ d.rotation.z=Math.sin(t*6)*.15; }); }
    else if(D.has('chick')){ const d=grp(),yl=lam(0xfff07a); d.at(new T.SphereGeometry(.26,14,10),yl,0,.26,0); for(const x of [-.08,.08]) d.at(new T.SphereGeometry(.03,6,5),lam(0x15151c),x,.33,.23);
      d.at(new T.ConeGeometry(.05,.12,8),lam(0xff8a1a),0,.26,.28).rotation.x=PI/2; for(const x of [-.05,0,.05]) d.at(new T.SphereGeometry(.05,6,5),lam(0xff5050),x,.52,0);
      for(const x of [-1,1]) d.at(new T.SphereGeometry(.08,8,6),yl,x*.25,.26,0).scale.set(.5,1,.8); put(d,hood); anim.push(t=>{ d.position.y=hood[1]+Math.abs(Math.sin(t*6))*.12; }); }
    else if(D.has('bunnydoll')){ const b=plush(1,0xfafafa); for(const x of [-.1,.1]){ const e=new T.Mesh(new T.SphereGeometry(.07,8,6),lam(0xfafafa)); e.scale.set(1,3.2,.8); e.position.set(x,.98,0); b.add(e); }
      put(b,seat); }
    else if(D.has('catdoll')){ const b=plush(1,0xffa94d); for(const x of [-.14,.14]){ const e=new T.Mesh(new T.ConeGeometry(.08,.16,4),lam(0xffa94d)); e.position.set(x,.86,0); e.rotation.z=-Math.sign(x)*.3; b.add(e); }
      for(const x of [-1,1]){ const w=new T.Mesh(new T.CylinderGeometry(.006,.006,.22,4),lam(0x333333)); w.rotation.z=PI/2; w.position.set(x*.2,.56,.18); b.add(w); } put(b,seat); }
    const balloonOf=(geo,col)=>{ const bx=moto?.25:.6,by2=ry+2.5,bal=new T.Group(); bal.position.set(bx,by2,rz-.1); g.add(bal); const m=new T.Mesh(geo,new T.MeshPhongMaterial({color:col,shininess:140,specular:0xffffff})); bal.add(m);
      const strg=new T.Mesh(new T.CylinderGeometry(.008,.008,1,4),lam(0xffffff)); g.add(strg); anim.push(t=>{ bal.position.y=by2+Math.sin(t*2)*.12; bal.rotation.y=Math.sin(t*1.3)*.5; const top=bal.position;
        strg.position.set(bx,(ry+.2+top.y-.4)/2,rz-.1); strg.scale.y=top.y-.4-(ry+.2); }); };
    const wingsOf=(mk,flap)=>{ const wx=moto?.38:buggy?1.0:.85,wy=moto?(heavy?1.4:1.15):by+.55,wz=moto?-.4:-.6;
      for(const sd of [-1,1]){ const wg=new T.Group(); wg.position.set(sd*wx,wy,wz); g.add(wg); mk(wg,sd); anim.push(t=>{ wg.rotation.z=sd*(Math.sin(t*flap)*.35+.15); }); } };
    if(D.has('batwings')) wingsOf((wg,sd)=>{ const m=new T.MeshPhongMaterial({color:0x3a1d52,shininess:60,side:T.DoubleSide});
      for(let i=0;i<3;i++){ const f=new T.Mesh(new T.ConeGeometry(.3,1.3-i*.3,3),m); f.scale.z=.08; f.rotation.z=sd*(PI/2+.3+i*.35); f.position.set(sd*(.5+i*.08),.1-i*.22,-i*.05); wg.add(f); }
      const bone=new T.Mesh(new T.CylinderGeometry(.03,.03,1.2,6),lam(0x1a0c26)); bone.rotation.z=sd*(PI/2-.25); bone.position.set(sd*.55,.2,0); wg.add(bone); },5);
    else if(D.has('butterfly')) wingsOf((wg,sd)=>{ const cols=[0x6ad7ff,0xff7ad9];
      for(let i=0;i<2;i++){ const f=new T.Mesh(new T.SphereGeometry(.42-i*.12,14,10),new T.MeshPhongMaterial({color:cols[i],shininess:90,transparent:true,opacity:.85,side:T.DoubleSide})); f.scale.set(1.1,1.2,.05); f.position.set(sd*(.45+i*.05),.25-i*.55,-.03*i); wg.add(f);
        const dot=new T.Mesh(new T.CircleGeometry(.1,12),lam(0xffffff)); dot.position.set(sd*(.5+i*.05),.3-i*.55,.03); wg.add(dot); } },9);
    else if(D.has('starballoon')){ const ss=new T.Shape(); for(let i=0;i<10;i++){ const a=PI/2+i*PI/5,r=i%2?.17:.4; i?ss.lineTo(Math.cos(a)*r,Math.sin(a)*r):ss.moveTo(Math.cos(a)*r,Math.sin(a)*r); }
      const sg=new T.ExtrudeGeometry(ss,{depth:.12,bevelEnabled:true,bevelThickness:.06,bevelSize:.05,bevelSegments:3}); sg.translate(0,0,-.06); balloonOf(sg,0xffc928); }
    const rearZ=moto?(heavy?-1.95:-1.65):buggy?-1.75:(sport?-2.1:-1.7);
    if(D.has('underglow')){ const ug=new T.Mesh(new T.PlaneGeometry(moto?.9:2.8,moto?3.4:4.4),new T.MeshBasicMaterial({color:0x2ff5ff,transparent:true,opacity:.6,blending:T.AdditiveBlending,depthWrite:false}));
      ug.rotation.x=-PI/2; ug.position.set(0,.06,moto?0:-.1); g.add(ug); const cs=[0x2ff5ff,0xff3bd4,0x7a5cff]; anim.push(t=>{ ug.material.opacity=.45+.2*Math.sin(t*5); ug.material.color.setHex(cs[Math.floor(t/1.2)%3]); }); }
    else if(D.has('foxtail')){ const tl=new T.Group(); tl.position.set(0,by+.45,rearZ+.35); g.add(tl); const om=lam(0xff8a2a);
      for(let i=0;i<7;i++){ const a=i/6*PI*.55,b=new T.Mesh(new T.SphereGeometry(.15+Math.sin(i/6*PI)*.13,12,10),i>=6?lam(0xffffff):om); b.position.set(0,Math.sin(a)*.95,-(1-Math.cos(a))*.25-i*.06); b.scale.set(1,1.15,1); tl.add(b); }
      anim.push((t,sp)=>{ tl.rotation.y=Math.sin(t*(3+Math.min(6,(sp||0)*.1)))*.45; tl.rotation.x=-Math.min(.6,(sp||0)*.01); }); }
    else if(D.has('cans')){ const cm=new T.MeshPhongMaterial({color:0xd8dde6,shininess:160,specular:0xffffff}),cans=[];
      for(let i=0;i<3;i++){ const x=(i-1)*.45,len=.9+i%2*.4,c=new T.Mesh(new T.CylinderGeometry(.11,.11,.26,12),cm); c.rotation.x=PI/2; c.position.set(x,.13,rearZ-len); g.add(c);
        const st=new T.Mesh(new T.CylinderGeometry(.006,.006,len,4),lam(0xffffff)); st.rotation.x=PI/2-.12; st.position.set(x,.25,rearZ-len/2); g.add(st); cans.push(c); }
      anim.push((t,sp)=>{ cans.forEach((c,i)=>{ c.position.y=.13+(sp>3?Math.abs(Math.sin(t*14+i*2))*.14:0); c.rotation.z=Math.sin(t*9+i)*(sp>3?.6:.05); }); }); }
    else if(D.has('orbit')){ const ob=new T.Group(); ob.position.y=by+.9; g.add(ob); const sm=new T.MeshBasicMaterial({color:0xfff27a});
      for(let i=0;i<5;i++){ const st=new T.Mesh(new T.OctahedronGeometry(.13),sm); const a=i*PI*2/5; st.position.set(Math.cos(a)*(moto?1.1:1.7),Math.sin(a*2)*.25,Math.sin(a)*(moto?1.6:2.3)); ob.add(st); }
      anim.push(t=>{ ob.rotation.y=t*1.6; ob.children.forEach((c,i)=>{ c.rotation.y=t*4; c.scale.setScalar(.8+.3*Math.sin(t*6+i)); }); }); } }
  // 特效用的零件
  const flame=new T.Group(),fy=moto?(heavy?.85:.7):by+.12,fz=moto?(heavy?-1.95:-1.65):buggy?-1.75:(sport?-2.1:-1.7),parts=[];
  const glowMat=c=>new T.MeshBasicMaterial({color:c,transparent:true,opacity:.85,blending:T.AdditiveBlending,depthWrite:false});
  for(const x of (moto?[0]:[-.42,.42])){ const og=new T.ConeGeometry(.36,2.6,14,1,true); og.translate(0,1.3,0); const ig=new T.ConeGeometry(.17,1.7,10,1,true); ig.translate(0,.85,0);
    const o=new T.Mesh(og,glowMat(0xffa41a)),i=new T.Mesh(ig,glowMat(0xffffff)); o.rotation.x=i.rotation.x=-PI/2; o.position.set(x,0,0); i.position.set(x,0,0); flame.add(o); flame.add(i); parts.push({o,i}); }
  const glow=new T.Mesh(new T.SphereGeometry(.55,12,10),new T.MeshBasicMaterial({color:0xffa41a,transparent:true,opacity:.45,blending:T.AdditiveBlending,depthWrite:false})); flame.add(glow);
  flame.position.set(0,fy,fz); flame.userData={parts,glow}; flame.visible=false; g.add(flame);
  const shadowM=add(new T.CircleGeometry(moto?1.5:sport?2.3:2,18),new T.MeshBasicMaterial({color:0,transparent:true,opacity:.3}),0,.1,0,-PI/2);
  const sd=add(new T.SphereGeometry(2.7,14,10),new T.MeshBasicMaterial({color:0x66e0ff,transparent:true,opacity:.3}),0,1.1,0); sd.visible=false;
  const cl=new T.Group(),cm=new T.MeshBasicMaterial({color:0x3a3d4d});
  for(const [x,y,z,r] of [[0,0,0,1.5],[1.3,-.2,.2,1.1],[-1.3,-.2,-.1,1.2],[.4,.5,-.3,1]]) add(new T.SphereGeometry(r,10,8),cm,x,y,z,0,0,0,cl);
  cl.position.set(0,5,1.2); cl.visible=false; g.add(cl);
  const bolt=add(new T.ConeGeometry(.5,2.2,4),new T.MeshBasicMaterial({color:0xffe14a}),0,4.8,0,PI); bolt.visible=false;
  g.userData={flame,shield:sd,cloud:cl,bolt,wheels,moto,shadow:shadowM,driver:dv,head:headG,anim};
  return g;
}
// 「我的造型」裡可以拖曳旋轉的 3D 預覽
function viewer(host,look){
  const T=window.THREE,r=new T.WebGLRenderer({antialias:true}),dpr=Math.min(window.devicePixelRatio||1,2);
  const w=host.clientWidth||360,h=host.clientHeight||200; let cw=w,ch=h; r.setPixelRatio(dpr); r.setSize(w,h,false);
  const cv=r.domElement; cv.style.cssText='width:100%;height:100%;display:block;touch-action:none;cursor:grab'; host.appendChild(cv);
  const scene=new T.Scene(); scene.background=new T.Color(0x2b2759);
  scene.add(new T.HemisphereLight(0xffffff,0x554a88,.9)); const d1=new T.DirectionalLight(0xffffff,.75); d1.position.set(5,9,6); scene.add(d1); const d2=new T.DirectionalLight(0x9fd8ff,.35); d2.position.set(-6,4,-5); scene.add(d2);
  const floor=new T.Mesh(new T.CircleGeometry(4.4,40),new T.MeshLambertMaterial({color:0x403b7c})); floor.rotation.x=-Math.PI/2; scene.add(floor);
  const ring=new T.Mesh(new T.RingGeometry(4.4,4.6,40),new T.MeshBasicMaterial({color:0xffd23f})); ring.rotation.x=-Math.PI/2; ring.position.y=.01; scene.add(ring);
  const cam=new T.PerspectiveCamera(36,w/h,.5,80);
  let model=buildKart(T,look),yaw=.75,pitch=.3,dist=8,auto=true,drag=null; scene.add(model);
  const kill=o=>o.traverse(m=>{ if(m.geometry) m.geometry.dispose(); if(m.material) m.material.dispose(); });
  cv.addEventListener('pointerdown',e=>{ drag={x:e.clientX,y:e.clientY}; auto=false; cv.style.cursor='grabbing'; try{cv.setPointerCapture(e.pointerId);}catch(_){ } });
  cv.addEventListener('pointermove',e=>{ if(!drag) return; yaw-=(e.clientX-drag.x)*.012; pitch=Math.max(.03,Math.min(1.25,pitch+(e.clientY-drag.y)*.008)); drag={x:e.clientX,y:e.clientY}; });
  const up=()=>{ drag=null; cv.style.cursor='grab'; }; cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{ e.preventDefault(); dist=Math.max(5,Math.min(16,dist+e.deltaY*.01)); },{passive:false});
  return {
    set(L){ look=L; scene.remove(model); kill(model); model=buildKart(T,L); scene.add(model); },
    draw(){ const W=host.clientWidth,H=host.clientHeight; if(W&&H&&(W!==cw||H!==ch)){ cw=W; ch=H; r.setSize(W,H,false); cam.aspect=W/H; cam.updateProjectionMatrix(); } // 版面改變時跟著調整大小
      if(auto) yaw+=.007; for(const wl of model.userData.wheels) wl.rotation.x+=auto?.05:0; for(const f of model.userData.anim) f(performance.now()/1000,0);
      { const st=NITRO[look.nitro]||NITRO.fire; setFlame(model.userData.flame,st.cols[Math.floor(performance.now()/90)%st.cols.length],1.3,1.15); } // 預覽氮氣特效
      cam.position.set(Math.sin(yaw)*Math.cos(pitch)*dist,Math.sin(pitch)*dist+1,Math.cos(yaw)*Math.cos(pitch)*dist); cam.lookAt(0,1,0); r.render(scene,cam); },
    destroy(){ kill(scene); r.dispose(); try{ r.forceContextLoss(); }catch(e){} cv.remove(); }
  };
}

/* ---- 賽道場景：路面、護欄、地面、起跑拱門、加速板、樹 ---- */
function buildWorld(T,st,o){
  o=o||{}; const HW=st.hw||HALF;
  const scene=new T.Scene(); scene.background=new T.Color(st.sky); scene.fog=new T.Fog(st.sky,160,620);
  scene.add(new T.HemisphereLight(0xffffff,0x667755,.95)); const sun=new T.DirectionalLight(0xffffff,.55); sun.position.set(60,120,40); scene.add(sun);
  function tex(w,h,draw,rx,ry){ const c=document.createElement('canvas'); c.width=w;c.height=h; draw(c.getContext('2d'),w,h);
    const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; t.anisotropy=8; if(rx) t.repeat.set(rx,ry); return t; }

  /* ---- 賽道 ---- */
  const curve=new T.CatmullRomCurve3(st.pts.map(p=>new T.Vector3(p[0],0,p[1])),true,'centripetal');
  const len=curve.getLength(),N=Math.round(len/2),sp=len/N,raw=curve.getSpacedPoints(N);
  const px=new Float32Array(N),pz=new Float32Array(N),tx=new Float32Array(N),tz=new Float32Array(N),nx=new Float32Array(N),nz=new Float32Array(N),curv=new Float32Array(N);
  for(let i=0;i<N;i++){ px[i]=raw[i].x; pz[i]=raw[i].z; }
  for(let i=0;i<N;i++){ const a=(i+1)%N,b=(i-1+N)%N; let dx=px[a]-px[b],dz=pz[a]-pz[b]; const l=Math.hypot(dx,dz)||1; tx[i]=dx/l; tz[i]=dz/l; nx[i]=tz[i]; nz[i]=-tx[i]; }
  for(let i=0;i<N;i++){ const a=(i+2)%N,b=(i-2+N)%N; curv[i]=wrap(Math.atan2(tx[a],tz[a])-Math.atan2(tx[b],tz[b]))/(4*sp); }
  let minX=1e9,maxX=-1e9,minZ=1e9,maxZ=-1e9;
  for(let i=0;i<N;i++){ minX=Math.min(minX,px[i]);maxX=Math.max(maxX,px[i]);minZ=Math.min(minZ,pz[i]);maxZ=Math.max(maxZ,pz[i]); }

  function ribbon(offA,yA,offB,yB,vRep,mat,skip){
    const pos=[],uv=[],idx=[];
    for(let i=0;i<=N;i++){ const j=i%N;
      pos.push(px[j]+nx[j]*offA,yA,pz[j]+nz[j]*offA, px[j]+nx[j]*offB,yB,pz[j]+nz[j]*offB);
      const v=i/N*vRep; uv.push(0,v,1,v);
      if(i<N&&!(skip&&skip(j))){ const a=i*2; idx.push(a,a+1,a+2,a+1,a+3,a+2); } }
    const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new T.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
    const m=new T.Mesh(g,mat); scene.add(m); return m;
  }
  // 柏油路：細碎顆粒、行車線較深的胎痕、白色邊線、中央虛線
  const roadTex=tex(256,256,(c,w,h)=>{
    c.fillStyle=st.road; c.fillRect(0,0,w,h);
    for(let i=0;i<5200;i++){ const v=Math.random(); c.fillStyle=v<.5?'rgba(255,255,255,'+(.03+Math.random()*.06)+')':'rgba(0,0,0,'+(.04+Math.random()*.08)+')'; c.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*1.6,1+Math.random()*1.6); }
    for(const x of [.3,.7]){ const g=c.createLinearGradient(w*(x-.12),0,w*(x+.12),0); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(.5,'rgba(0,0,0,.13)'); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.fillRect(w*(x-.12),0,w*.24,h); }
    for(let i=0;i<6;i++){ c.strokeStyle='rgba(0,0,0,.12)'; c.lineWidth=1; c.beginPath(); let x=Math.random()*w,y=Math.random()*h; c.moveTo(x,y); for(let k=0;k<5;k++){ x+=(Math.random()-.5)*30; y+=Math.random()*20; c.lineTo(x,y); } c.stroke(); } // 裂縫
    c.fillStyle='rgba(250,250,245,.92)'; c.fillRect(10,0,6,h); c.fillRect(w-16,0,6,h);
    c.fillStyle='rgba(255,255,255,.75)'; c.fillRect(w/2-3,0,6,h*.45);
  });
  ribbon(HW,.05,-HW,.05,Math.round(len/14),new T.MeshLambertMaterial({map:roadTex,side:T.DoubleSide}));
  // 彎道的紅白路肩
  const curbTex=tex(16,64,(c,w,h)=>{ c.fillStyle='#e23b3b'; c.fillRect(0,0,w,32); c.fillStyle='#f4f4f4'; c.fillRect(0,32,w,32); });
  const curbMat=new T.MeshLambertMaterial({map:curbTex,side:T.DoubleSide}),curvy=j=>{ for(let d=-3;d<=3;d++) if(Math.abs(curv[(j+d+N)%N])>.011) return false; return true; };
  ribbon(HW+1.7,.06,HW-.3,.06,Math.round(len/3),curbMat,curvy); ribbon(-HW+.3,.06,-HW-1.7,.06,Math.round(len/3),curbMat,curvy);
  const wallTex=tex(8,32,(c,w,h)=>{ c.fillStyle='#e23b3b'; c.fillRect(0,0,w,16); c.fillStyle='#f4f4f4'; c.fillRect(0,16,w,16); });
  const wallMat=new T.MeshLambertMaterial({map:wallTex,side:T.DoubleSide});
  const LIM=HW+SHOULDER;
  // 捷徑：碎石小路，兩旁有石頭，中間也有幾顆擋路
  let cut=null; const cut_pad=6;
  if(st.cut){ const A=st.pts[st.cut[0]],B=st.pts[st.cut[1]],near=p=>{ let b=0,bd=1e9; for(let i=0;i<N;i++){ const d=Math.hypot(px[i]-p[0],pz[i]-p[1]); if(d<bd){ bd=d; b=i; } } return b; };
    const ia=near(A),ib=near(B),span=(ib-ia+N)%N,L=Math.hypot(B[0]-A[0],B[1]-A[1]),M=Math.max(8,Math.round(L/2)),cx=[],cz=[],mi=[];
    const TL=L*.55; for(let k=0;k<=M;k++){ const u=k/M,u2=u*u,u3=u2*u,h00=2*u3-3*u2+1,h10=u3-2*u2+u,h01=-2*u3+3*u2,h11=u3-u2; // 從入口順著賽道方向彎出去，出口也順著賽道方向接回來
      cx.push(h00*px[ia]+h10*tx[ia]*TL+h01*px[ib]+h11*tx[ib]*TL); cz.push(h00*pz[ia]+h10*tz[ia]*TL+h01*pz[ib]+h11*tz[ib]*TL); mi.push((ia+Math.round(span*u))%N); }
    // 擋路的石頭只放在離開主賽道的那一段
    const outK=[]; for(let k=0;k<=M;k++){ let dm=1e9; for(let i=0;i<N;i+=2) dm=Math.min(dm,Math.hypot(cx[k]-px[i],cz[k]-pz[i])); if(dm>LIM+cut_pad) outK.push(k); }
    const rocks=outK.length<6?[]:[[.2,2.6],[.5,-2.8],[.8,2.3]].map(([u,o])=>{ const k=outK[Math.round(u*(outK.length-1))],a=Math.min(M,k+1),b2=Math.max(0,k-1),dx=cx[a]-cx[b2],dz=cz[a]-cz[b2],l=Math.hypot(dx,dz)||1; return {x:cx[k]+dz/l*o,z:cz[k]-dx/l*o,r:1.7}; });
    cut={cx,cz,mi,M,W:5.5,rocks};
    // 碎石路面
    const dirtTex=tex(64,64,(c,w,h)=>{ c.fillStyle='#8a6a48'; c.fillRect(0,0,w,h); for(let i=0;i<500;i++){ c.fillStyle=['#6f5238','#a38260','#5a4330','#b8977a'][i%4]; c.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2.5,1+Math.random()*2.5); } });
    { const pos=[],uv=[],idx=[]; for(let k=0;k<=M;k++){ const a=Math.min(M,k+1),b=Math.max(0,k-1),dx=cx[a]-cx[b],dz=cz[a]-cz[b],l=Math.hypot(dx,dz)||1,nx_=dz/l,nz_=-dx/l;
        pos.push(cx[k]+nx_*(cut.W+1),.04,cz[k]+nz_*(cut.W+1),cx[k]-nx_*(cut.W+1),.04,cz[k]-nz_*(cut.W+1)); uv.push(0,k/3,1,k/3); if(k<M){ const q=k*2; idx.push(q,q+1,q+2,q+1,q+3,q+2); } }
      const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new T.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
      scene.add(new T.Mesh(g,new T.MeshLambertMaterial({map:dirtTex,side:T.DoubleSide}))); }
    // 兩旁的石頭、路中間擋路的大石頭
    { const rg=new T.DodecahedronGeometry(1,0),rm=new T.MeshLambertMaterial({color:0x7a7068}),edge=[];
      for(let k=0;k<=M;k+=2){ const a=Math.min(M,k+1),b=Math.max(0,k-1),dx=cx[a]-cx[b],dz=cz[a]-cz[b],l=Math.hypot(dx,dz)||1; for(const sd of [-1,1]){ const x=cx[k]+dz/l*sd*(cut.W+1.6),z=cz[k]-dx/l*sd*(cut.W+1.6); let ok=true; for(let i=0;i<N;i+=2) if(Math.hypot(x-px[i],z-pz[i])<LIM+1.5){ ok=false; break; } if(ok) edge.push([x,z,.9+Math.random()*.7]); } }
      const all=edge.concat(rocks.map(r=>[r.x,r.z,r.r])),im=new T.InstancedMesh(rg,rm,all.length),d=new T.Object3D();
      all.forEach((r,i)=>{ d.position.set(r[0],r[2]*.5,r[1]); d.rotation.set(Math.random()*3,Math.random()*3,0); d.scale.set(r[2],r[2]*.8,r[2]); d.updateMatrix(); im.setMatrixAt(i,d.matrix); }); scene.add(im); }
    // 入口的「捷徑」箭頭看板
    { const sg=tex(128,64,(c,w,h)=>{ c.fillStyle='#ffd23f'; c.fillRect(0,0,w,h); c.fillStyle='#14122b'; c.fillRect(4,4,w-8,h-8); c.fillStyle='#ffd23f'; c.font='900 30px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('捷徑 ▶',w/2,h/2+2); });
      const k=Math.round(M*.12),sp=new T.Sprite(new T.SpriteMaterial({map:sg})); sp.scale.set(6,3,1); sp.position.set(cx[k],4.2,cz[k]); scene.add(sp); }
  }
  const cut_W=()=>cut?cut.W:0;
  // 點到捷徑中心線的距離，以及最近的那一點
  function cutDist(x,z){ if(!cut) return [1e9,0]; let bd=1e9,bk=0; for(let k=0;k<=cut.M;k++){ const d=(x-cut.cx[k])**2+(z-cut.cz[k])**2; if(d<bd){ bd=d; bk=k; } } return [Math.sqrt(bd),bk]; }
  const gap=s=>j=>cutDist(px[j]+nx[j]*s*(LIM+.6),pz[j]+nz[j]*s*(LIM+.6))[0]<cut.W+6; // 入口開寬一點，斜斜切進去也進得去
  ribbon(LIM+.6,0,LIM+.6,1.5,Math.round(len/8),wallMat,cut?gap(1):null); ribbon(-LIM-.6,0,-LIM-.6,1.5,Math.round(len/8),wallMat,cut?gap(-1):null);
  const groundTex=tex(64,64,(c,w,h)=>{ c.fillStyle=st.ground[0]; c.fillRect(0,0,w,h); c.fillStyle=st.ground[1]; for(let i=0;i<90;i++) c.fillRect(Math.random()*w,Math.random()*h,4,4); },220,220);
  const ground=new T.Mesh(new T.PlaneGeometry(2400,2400),new T.MeshLambertMaterial({map:groundTex})); ground.rotation.x=-Math.PI/2; ground.position.set((minX+maxX)/2,0,(minZ+maxZ)/2); scene.add(ground);
  const h0=Math.atan2(tx[0],tz[0]);
  function flat(w,d,mat,i,y){ const m=new T.Mesh(new T.PlaneGeometry(w,d),mat); m.rotation.order='YXZ'; m.rotation.y=Math.atan2(tx[i],tz[i]); m.rotation.x=-Math.PI/2; m.position.set(px[i],y,pz[i]); scene.add(m); return m; }
  const checker=tex(64,16,(c,w,h)=>{ for(let x=0;x<8;x++) for(let y=0;y<2;y++){ c.fillStyle=(x+y)%2?'#111':'#fff'; c.fillRect(x*8,y*8,8,8); } });
  flat(HW*2,3,new T.MeshBasicMaterial({map:checker}),0,.08);
  { const mat=new T.MeshLambertMaterial({color:0x33334a});
    for(const s of [-1,1]){ const p=new T.Mesh(new T.BoxGeometry(1,10,1),mat); p.position.set(px[0]+nx[0]*s*(HW+2),5,pz[0]+nz[0]*s*(HW+2)); scene.add(p); }
    const bar=new T.Mesh(new T.BoxGeometry(HW*2+5,2.4,.8),new T.MeshBasicMaterial({map:checker})); bar.position.set(px[0],10,pz[0]); bar.rotation.y=h0; scene.add(bar); }
  const padTex=tex(64,64,(c,w,h)=>{ c.fillStyle='#ff9d3d'; c.fillRect(0,0,w,h); c.strokeStyle='#fff8d0'; c.lineWidth=8; c.lineJoin='miter';
    for(const y of [8,30]){ c.beginPath(); c.moveTo(10,y); c.lineTo(32,y+20); c.lineTo(54,y); c.stroke(); } });
  const pads=o.pads?[.14,.47,.78].map(f=>{ const i=Math.floor(f*N); flat(9,7,new T.MeshBasicMaterial({map:padTex}),i,.09); return i; }):[]; // 加速板只在道具賽
  { const M=320,trunk=new T.InstancedMesh(new T.CylinderGeometry(.5,.8,3,6),new T.MeshLambertMaterial({color:st.tree[1]}),M),
      crown=new T.InstancedMesh(new T.ConeGeometry(3.2,8,8),new T.MeshLambertMaterial({color:0xffffff}),M),top=new T.InstancedMesh(new T.ConeGeometry(2.3,5.5,8),new T.MeshLambertMaterial({color:0xffffff}),M),d=new T.Object3D(),col=new T.Color(),base=new T.Color(st.tree[0]); let n=0;
    for(let k=0;k<5000&&n<M;k++){ const x=minX-160+Math.random()*(maxX-minX+320),z=minZ-160+Math.random()*(maxZ-minZ+320); let ok=true;
      for(let i=0;i<N;i+=3){ const dx=x-px[i],dz=z-pz[i]; if(dx*dx+dz*dz<(LIM+7)*(LIM+7)){ ok=false; break; } }
      if(!ok||cutDist(x,z)[0]<cut_W()+8) continue; const s=.7+Math.random()*1;
      d.position.set(x,1.5*s,z); d.scale.set(s,s,s); d.rotation.set(0,Math.random()*6,0); d.updateMatrix(); trunk.setMatrixAt(n,d.matrix);
      d.position.set(x,6.5*s,z); d.updateMatrix(); crown.setMatrixAt(n,d.matrix); d.position.set(x,10.2*s,z); d.updateMatrix(); top.setMatrixAt(n,d.matrix);
      const v=.82+Math.random()*.3; col.copy(base).multiplyScalar(v); crown.setColorAt(n,col); col.copy(base).multiplyScalar(v*1.12); top.setColorAt(n,col); n++; }
    trunk.count=crown.count=top.count=n; scene.add(trunk); scene.add(crown); scene.add(top); }
  // 天空漸層、遠方山脈（不受霧影響）
  { const sky=new T.Color(st.sky),mixc=(a,b,k)=>a.clone().lerp(new T.Color(b),k),hexs=c=>'#'+c.getHexString(),dark=!!st.night;
    const dome=new T.Mesh(new T.SphereGeometry(900,24,12),new T.MeshBasicMaterial({side:T.BackSide,fog:false,depthWrite:false,map:tex(4,256,(c,w,h)=>{ const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,hexs(mixc(sky,dark?0x000010:0x2a6fd6,dark?.5:.35))); g.addColorStop(.48,hexs(sky)); g.addColorStop(.52,hexs(mixc(sky,0xffffff,dark?.05:.3))); g.addColorStop(1,hexs(sky)); c.fillStyle=g; c.fillRect(0,0,w,h);
        if(dark) for(let i=0;i<60;i++){ c.fillStyle='rgba(255,255,255,'+Math.random()+')'; c.fillRect(Math.random()*w,Math.random()*h*.45,1,1); } })}));
    dome.position.set((minX+maxX)/2,0,(minZ+maxZ)/2); dome.renderOrder=-2; scene.add(dome);
    const R=Math.max(maxX-minX,maxZ-minZ)/2+460,mc=mixc(new T.Color(st.ground[1]),st.sky,dark?.35:.55),mc2=mixc(mc,st.sky,.35);
    const mt=tex(1024,128,(c,w,h)=>{ c.clearRect(0,0,w,h); for(const [col,amp,base,fr] of [[mc2,.55,.55,7],[mc,.45,.25,11]]){ c.fillStyle=hexs(col); c.beginPath(); c.moveTo(0,h); for(let x=0;x<=w;x+=8){ const y=h*base+Math.sin(x/w*Math.PI*2*fr)*h*.12*amp+Math.sin(x/w*Math.PI*2*fr*2.7+1)*h*.1*amp+Math.abs(Math.sin(x/w*Math.PI*2*fr*.5))*h*.18*amp; c.lineTo(x,y); } c.lineTo(w,h); c.fill(); } });
    mt.wrapT=T.ClampToEdgeWrapping; const ring=new T.Mesh(new T.CylinderGeometry(R,R,140,64,1,true),new T.MeshBasicMaterial({map:mt,transparent:true,side:T.BackSide,fog:false,depthWrite:false}));
    ring.position.set((minX+maxX)/2,50,(minZ+maxZ)/2); ring.renderOrder=-1; scene.add(ring); }

  return {scene,tex,px,pz,tx,tz,nx,nz,curv,N,minX,maxX,minZ,maxZ,LIM,HW,pads,cut,cutDist};
}
// 進場前的 3D 預覽：鏡頭沿著賽道低空飛一圈
function stageViewer(host,si){
  const T=window.THREE,W_=buildWorld(T,STAGES[si]),r=new T.WebGLRenderer({antialias:true}),dpr=Math.min(window.devicePixelRatio||1,2);
  const w=host.clientWidth||300,h=host.clientHeight||225; r.setPixelRatio(dpr); r.setSize(w,h,false);
  const cv=r.domElement; cv.style.cssText='width:100%;height:100%;display:block'; host.appendChild(cv);
  const cam=new T.PerspectiveCamera(62,w/h,.5,1000),{px,pz,N,scene}=W_; let u=N-30;
  const at=(v,a)=>{ const i=Math.floor(v)%N,j=(i+1)%N,f=v-Math.floor(v); return a[i]+(a[j]-a[i])*f; };
  return {
    draw(){ u=(u+.3)%N; cam.position.set(at(u,px),8.5,at(u,pz)); cam.lookAt(at(u+14,px),2,at(u+14,pz)); r.render(scene,cam); },
    destroy(){ scene.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } }); r.dispose(); try{ r.forceContextLoss(); }catch(e){} cv.remove(); }
  };
}

function create(env,opts){
  const T=window.THREE,st=STAGES[opts.stage||0],net=opts.net,host=!net||net.host,me=net?net.me:0,local2=!net&&opts.mode==='2p',itemMode=opts.variant==='item',driftMode=false,DB_MIN=driftMode?.15:.25,humans=net?net.count:local2?2:1; // 連線時只有房間裡的人，加不加電腦由房主決定
  // 玩法：各自分開（ffa）／分隊對戰（vs，兩隊人數一樣）／玩家同隊打電腦（coop，電腦和玩家一樣多）；分隊時照名次算隊伍積分
  let mode=(opts.options&&opts.options.team)||'ffa'; if(!net&&!local2) mode='ffa'; if(mode==='coop'&&humans>3) mode='vs';
  let NK=net?Math.min(TOTAL,net.count+(net.bots||0)):TOTAL;
  if(mode==='coop') NK=humans*2; else if(mode==='pvp') NK=Math.max(2,humans+humans%2); /* 只有玩家分兩隊，雙人就是 1 對 1 */ else if(mode==='vs'){ if(NK%2) NK=Math.min(TOTAL,NK+1); if(NK<2) NK=2; }
  const TEAMS=mode==='coop'?[{name:'玩家隊',col:'#ffd23f'},{name:'電腦隊',col:'#a8adc0'}]:[{name:'紅隊',col:'#ff4d4d'},{name:'藍隊',col:'#3d8bff'}];
  const teamOf=(()=>{ const out=[],cnt=[0,0]; for(let i=0;i<NK;i++){ let tm=null; if(mode==='coop') tm=i<humans?0:1; else if(mode==='vs'||mode==='pvp') tm=i<humans?i%2:(cnt[0]<=cnt[1]?0:1); if(tm!=null) cnt[tm]++; out.push(tm); } return out; })();
  const POINTS=[10,8,6,5,4,3];
  const SLOTS=[...Array(NK).keys()].sort((a,b)=>Math.abs(a-(NK-1)/2)-Math.abs(b-(NK-1)/2)||a-b); // 真人排在中間
  const stage=env.stage,dpr=Math.min(window.devicePixelRatio||1,2);
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'}); let pr=dpr; renderer.setPixelRatio(pr); stage.appendChild(renderer.domElement);
  const hudC=document.createElement('canvas'); stage.appendChild(hudC); const hud=hudC.getContext('2d');
  const {scene,tex,px,pz,tx,tz,nx,nz,curv,N,minX,maxX,minZ,maxZ,LIM,HW,pads,cut,cutDist}=buildWorld(T,st,{pads:itemMode});
  const cam=new T.PerspectiveCamera(62,1,.5,1000);
  let vw=1,vh=1;
  function resize(){ vw=Math.max(1,stage.clientWidth); vh=Math.max(1,stage.clientHeight); renderer.setSize(vw,vh,false); cam.aspect=vw/vh; cam.updateProjectionMatrix(); hudC.width=vw*dpr; hudC.height=vh*dpr; }
  const ro=new ResizeObserver(resize); ro.observe(stage); resize();

  /* ---- 車 ---- */
  const makeKart=L=>{ const g=buildKart(T,L); scene.add(g); return g; };
  const BODIES=['std','sport','buggy','scooter','bike'],PARTS=['none','wing','flag','exhaust'],DRIVERS=['helmet','bear','bunny','cap'];
  const lookFor=(i,human)=>(human?(net?net.looks&&net.looks[i]:i===0?opts.look:null):null)||{deco:['crown','halo','propeller','horns','catears','party','wizard','antenna'][i%8]+','+['charm','duck','penguin','chick','bear','catdoll'][(i*5+1)%6]+','+['balloon','wings','underglow','foxtail','batwings','orbit'][(i*3+2)%6],body:BODIES[(i*2+1)%5],color:COLORS[i],part:PARTS[(i*3+1)%4],driver:DRIVERS[(i+1)%4],wheel:Object.keys(WHEEL)[i%5],nitro:Object.keys(NITRO)[(i+2)%5]};
  const karts=[];
  for(let i=0;i<NK;i++){
    const human=i<humans,slot=SLOTS[i];       // 所有車排成一直線同時出發，真人排在中間
    const si=N-6,lane=(slot-(NK-1)/2)*4.2;
    const look=lookFor(i,human);
    const k={i,human,color:look.color,look,bk:0,gripT:0,ss:0,remote:human?(!!net&&i!==me):!host,local:human&&(!net||i===me),x:px[si]+nx[si]*lane,z:pz[si]+nz[si]*lane,h:Math.atan2(tx[si],tz[si]),vx:0,vz:0,idx:si,d:lane,prog:si-N,
      boostT:0,drifting:false,driftT:0,gauge:0,stock:0,items:[],toastT:0,toastText:'',spin:0,tumble:0,slowT:0,cloudT:0,shield:0,fin:null,wall:false,left:false,flags:0,
      ai:human?null:{lane:lane*.8,skill:st.ai+(i-humans)*.022,nt:6+Math.random()*8},mesh:makeKart(look)};
    k.name=human?(net?(net.names&&net.names[i])||'玩家'+(i+1):local2?(i+1)+'P':opts.name||'你'):'電腦'+(i-humans+1); k.team=teamOf[i];
    { // 車頂名牌
      const cv=document.createElement('canvas'); cv.width=256; cv.height=64; const c=cv.getContext('2d');
      c.font='900 36px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=8; c.strokeStyle='#0b0a1c'; c.lineJoin='round';
      c.strokeText(k.name,128,34); c.fillStyle=k.team!=null?TEAMS[k.team].col:human?'#fff':'#c9c6e6'; c.fillText(k.name,128,34);
      const sp=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(cv),transparent:true,depthWrite:false,fog:false})); sp.scale.set(5,1.25,1); sp.position.y=4.3; k.mesh.add(sp);
    }
    k.tx=k.x; k.tz=k.z; k.th=k.h; k.v={camH:k.h,fov:62,wrongT:0,lap:1}; karts.push(k);
  }
  const my=karts[me],locals=karts.filter(k=>k.local);
  let t=0,cd=3.4,lastBeep=4,endT=0,ended=false,sendT=0,remain=null,lastTick=99,pip=null,flashT=0;
  let guard=0,intro={t:0,dur:4.6};

  /* ---- 道具賽 ---- */
  const boxes=[],bananas=[],missiles=[]; let banN=0,banGeo,banMat,misGeo,misMat;
  if(itemMode){
    const q=tex(64,64,(c,w,h)=>{ const g=c.createLinearGradient(0,0,w,h); g.addColorStop(0,'#ff5d8f'); g.addColorStop(.5,'#ffd23f'); g.addColorStop(1,'#3ddbd9'); c.fillStyle=g; c.fillRect(0,0,w,h);
      c.fillStyle='#fff'; c.font='bold 46px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('?',w/2,h/2+3); });
    const bg=new T.BoxGeometry(2.4,2.4,2.4),bm=new T.MeshBasicMaterial({map:q});
    const glowG=new T.BoxGeometry(3.6,3.6,3.6),glowM=new T.MeshBasicMaterial({color:0xfff2a8,wireframe:true,transparent:true,opacity:.7});
    for(const f of [.08,.3,.55,.8]) for(const lane of [-7,0,7]){ const i=Math.floor(f*N),mesh=new T.Mesh(bg,bm),x=px[i]+nx[i]*lane,z=pz[i]+nz[i]*lane;
      mesh.scale.setScalar(1.3); mesh.position.set(x,2.3,z); const glow=new T.Mesh(glowG,glowM); mesh.add(glow); scene.add(mesh); boxes.push({x,z,mesh,glow,cool:0,ph:Math.random()*6}); }
    banGeo=new T.ConeGeometry(.8,1.6,8); banMat=new T.MeshLambertMaterial({color:0xffe14a});
    misGeo=new T.ConeGeometry(.5,2.2,8); misMat=new T.MeshBasicMaterial({color:0xff3b3b});
  }
  function addBanana(id,x,z,owner){ if(bananas.some(b=>b.id===id)) return; const mesh=new T.Mesh(banGeo,banMat); mesh.position.set(x,.8,z); scene.add(mesh); bananas.push({id,x,z,owner,age:0,mesh}); }
  function dropBanana(id){ const n=bananas.findIndex(b=>b.id===id); if(n>=0){ scene.remove(bananas[n].mesh); bananas.splice(n,1); } }
  function launch(from,to){ const mesh=new T.Mesh(misGeo,misMat); scene.add(mesh); missiles.push({from,to,t:0,mesh}); }
  // 水球：往車頭方向丟出去，落地後留下一灘水花，碰到的車會彈起來翻滾（不鎖定目標，丟的人自己不會中）
  const waters=[],W_FLY=.8,W_STAY=2.6,watMat=new T.MeshBasicMaterial({color:0x4fb4ff,transparent:true,opacity:.55,depthWrite:false});
  function addWater(id,x,z,h,owner,dist){ if(waters.some(w=>w.id===id)) return; const mesh=new T.Mesh(fxGeo,watMat); mesh.position.set(x,1.5,z); scene.add(mesh);
    waters.push({id,x0:x,z0:z,x,z,h,owner,dist,age:0,landed:false,mesh}); }
  const fx=[],fxGeo=new T.SphereGeometry(1,12,8);
  const skidGeo=new T.PlaneGeometry(1,1),skidMat=new T.MeshBasicMaterial({color:0x17151c,transparent:true,opacity:.5,depthWrite:false}),skids=[]; let skidN=0;
  function skid(x0,z0,x1,z1){ // 回收最舊的一段，最多留 700 段
    let m=skids[skidN%700]; if(!m){ m=new T.Mesh(skidGeo,skidMat); m.rotation.order='YXZ'; m.rotation.x=-Math.PI/2; scene.add(m); skids.push(m); } skidN++;
    const dx=x1-x0,dz=z1-z0; m.position.set((x0+x1)/2,.075,(z0+z1)/2); m.rotation.y=Math.atan2(dx,dz); m.scale.set(.42,Math.hypot(dx,dz)+.08,1); }
  const pool=[];
  function burst(x,z,color,size,y,life){
    let f=pool.pop(); if(!f){ if(fx.length>=110) f=fx.shift(); else f={m:new T.Mesh(fxGeo,new T.MeshBasicMaterial({transparent:true,opacity:.7,depthWrite:false}))}; }
    f.m.material.color.setHex(color); f.m.position.set(x,y==null?1.3:y,z); f.m.scale.setScalar(.5); f.m.visible=true; if(!f.m.parent) scene.add(f.m);
    f.t=0; f.size=size; f.life=life||.5; fx.push(f);
  }
  const nitroCol=(k,n)=>{ const st=NITRO[k.look.nitro]||NITRO.fire; return st.cols[(n||0)%st.cols.length]; };
  function toast(k,text){ if(k&&k.local){ k.toastText=text; k.toastT=2.4; } }
  // 命中由被打的那台車的主人判定，再通知所有人播特效
  function hit(k,sec,owner,kind){
    const blocked=k.shield>0?1:0;
    if(blocked){ k.shield=0; if(k.local) env.sfx('item'); } else { k.spin=sec; if(kind==='water') k.tumble=sec; if(kind==='missile'){ k.flyT=1.5; k.spin=Math.max(sec,1.5); } k.vx*=.3; k.vz*=.3; k.boostT=0; if(k.local) env.sfx('hurt'); }
    hitEvent(k.i,owner,kind,blocked); if(net) net.send({hit:[k.i,owner,kind,blocked]});
  }
  // 烏雲、閃電：對施放者以外的所有車生效，各台車由自己的主人套用
  function applyGlobal(kind,o){
    const O=karts[o],what=INAME[kind]; if(kind==='bolt'){ flashT=.3; env.sfx('boom'); }
    for(const k of karts){ if(k.remote||k.left||k.i===o||k.fin!=null) continue;
      if(k.shield>0){ k.shield=0; toast(k,'護盾擋下了'+what); continue; }
      if(kind==='bolt'){ k.slowT=3; k.boostT=0; } else k.cloudT=4.5;
      toast(k,'被 '+(O?O.name:'')+' 的'+what+(kind==='bolt'?'擊中，減速中':'遮住視線')); if(k.local) env.sfx('hurt'); }
  }
  function hitEvent(v,o,kind,blocked){
    const V=karts[v],O=karts[o]; if(!V) return; const what=INAME[kind]||'道具',other=O&&O!==V;
    burst(V.x,V.z,blocked?0x66e0ff:kind==='missile'?0xff5533:kind==='water'?0x4fb4ff:0xffe14a,blocked?4:6);
    toast(V,blocked?'護盾擋下了'+what:other?'被 '+O.name+' 的'+what+'打中':'踩到自己的'+what);
    if(other&&O.local){ toast(O,blocked?V.name+' 用護盾擋下了':'你的'+what+'打中 '+V.name); env.sfx('item');
      if(!local2) pip={k:V,t:2.8,text:V.name+(blocked?' 擋下了':' 中了')+what}; }
  }
  function useItem(k){
    const it=k.items[0];
    if(it==='missile'){ let best=null; for(const q of karts){ if(q===k||q.left||q.fin!=null) continue; const g=q.prog-k.prog; if(g>0&&(!best||g<best.prog-k.prog)) best=q; }
      if(!best){ if(k.local&&!k.ai) env.sfx('bump'); return false; }
      launch(k.i,best.i); if(net) net.send({mis:[k.i,best.i]}); burst(k.x,k.z,0xff5533,3); toast(k,'飛彈鎖定 '+best.name); if(k.local) env.sfx('place'); }
    else if(it==='nitro'){ k.boostT=2.8; k.bk=2; burst(k.x-Math.sin(k.h)*2,k.z-Math.cos(k.h)*2,nitroCol(k,0),4.5); toast(k,'氮氣加速！'); if(k.local) env.sfx('boost'); }
    else if(it==='banana'){ const id=k.i+'-'+(banN++),x=r2(k.x-Math.sin(k.h)*3.6),z=r2(k.z-Math.cos(k.h)*3.6); addBanana(id,x,z,k.i); if(net) net.send({ban:[id,x,z,k.i]}); burst(x,z,0xffe14a,2.5); if(k.local) env.sfx('place'); }
    else if(it==='cloud'||it==='bolt'){ applyGlobal(it,k.i); if(net) net.send({glob:[it,k.i]}); burst(k.x,k.z,it==='bolt'?0xffe14a:0x3a3d4d,5); toast(k,it==='bolt'?'閃電！其他人減速':'烏雲！遮住其他人的視線'); }
    else if(it==='water'){ const id=k.i+'w'+(banN++),x=r2(k.x),z=r2(k.z),h=r2(k.h),dist=Math.round(34+Math.hypot(k.vx,k.vz)*.9);
      addWater(id,x,z,h,k.i,dist); if(net) net.send({wat:[id,x,z,h,k.i,dist]}); toast(k,'丟出水球'); if(k.local) env.sfx('place'); }
    else { k.shield=8; burst(k.x,k.z,0x66e0ff,4); toast(k,'護盾啟動，可擋一次攻擊'); if(k.local) env.sfx('item'); }
    if(it==='banana') toast(k,'放下香蕉');
    k.items.shift(); return true;
  }

  function locate(k){
    let best=k.idx,bd=1e9;
    for(let s=-12;s<=24;s++){ const j=((k.idx+s)%N+N)%N,dx=k.x-px[j],dz=k.z-pz[j],d=dx*dx+dz*dz; if(d<bd){bd=d;best=j;} }
    let delta=best-k.idx; if(delta>N/2) delta-=N; if(delta<-N/2) delta+=N;
    k.prog+=delta; k.idx=best; k.d=(k.x-px[best])*nx[best]+(k.z-pz[best])*nz[best];
  }
  function drive(k,inp,dt){
    const mine=k.local,g0=9;
    let fx=Math.sin(k.h),fz=Math.cos(k.h),vf=k.vx*fx+k.vz*fz;
    k.ss+=(inp.steer-k.ss)*Math.min(1,dt*(k.ai?40:11)); // 方向盤不是瞬間打到底
    k.stA=inp.steer?0:(k.stA||0)+dt;
    if(!k.drifting&&inp.drift&&(inp.steer||k.stA<.3)&&vf>14){ k.drifting=true; k.driftT=0; k.dBad=false; }
    if(k.drifting){ k.driftT+=dt; if(!inp.drift||vf<9){ k.drifting=false; k.gripT=.45; if(k.driftT>DB_MIN&&!k.dBad){ k.dbT=.6; k.dbAmt=driftMode?Math.min(2.4,.5+k.driftT):.55; if(mine&&!k.ai) toast(k,'按 '+(env.touch?'▲':local2&&k.i===0?'W':'↑')+' 甩噴！'); } } }
    // 甩尾結束後 0.6 秒內按一下出發鍵（鍵盤 ↑、手機 ▲）才會噴
    if(k.dbT>0){ k.dbT-=dt; if(inp.tap){ k.dbT=0; k.boostT=Math.max(k.boostT,k.dbAmt); k.bk=1; burst(k.x,k.z,driftMode?0x4fd0ff:0xffd23f,driftMode?8:4,1,.45); if(mine){ env.sfx('boost'); if(driftMode){ toast(k,'甩噴！'); flashT=.12; } } } }
    k.h+=k.ss*1.9*Math.min(1,Math.abs(vf)/14)*(k.drifting?1.38:1)*(vf<0?-1:1)*dt;
    fx=Math.sin(k.h); fz=Math.cos(k.h); const lx=fz,lz=-fx;
    vf=k.vx*fx+k.vz*fz; let vl=k.vx*lx+k.vz*lz;
    const off=Math.abs(k.d)>HW+.5&&!k.rough;
    let max=(k.boostT>0?MAXB:MAX)*(inp.max||1)*(k.slowT>0?.5:1); if(off) max=Math.min(max,30); if(k.rough) max=Math.min(max,k.boostT>0?50:42); // 捷徑的碎石路開不快
    if(k.slowT>0) k.slowT-=dt; if(k.cloudT>0) k.cloudT-=dt;
    if(inp.gas&&vf<max) vf=Math.min(max,vf+(k.boostT>0?80:36)*dt);
    if(inp.brake){ vf-=(vf>0?70:26)*dt; if(vf<-16) vf=-16; }
    if(!inp.gas&&!inp.brake) vf-=vf*.6*dt;
    if(k.rough&&Math.abs(vf)>8){ k.ss+=(Math.random()-.5)*dt*9; k.bumpT=(k.bumpT||0)+dt; } // 碎石路顛簸，方向盤會被晃一下
    if(vf>max) vf-=Math.min(vf-max,(off?60:25)*dt);
    const slide=Math.abs(vl);
    if(k.drifting){ vf-=slide*.045*dt; k.gauge+=itemMode||driftMode||k.dBad?0:slide*dt*.031;
      if(k.gauge>=1){ if(k.stock<2){ k.stock++; k.gauge=0; if(mine) env.sfx('item'); } else k.gauge=1; } }
    if(driftMode) k.gauge=k.drifting&&!k.dBad?Math.min(1,k.driftT/1.9):0; // 甩噴賽：集氣條顯示這次甩尾能噴多久
    // 放開甩尾後 0.45 秒內抓地力漸漸恢復，並把一部分側滑的速度轉回前進，不會突然頓一下
    let gb=1; if(k.gripT>0&&!k.drifting){ k.gripT-=dt; gb=.3+.7*(1-Math.max(0,k.gripT)/.45); vf+=slide*1.1*dt; }
    vl*=Math.exp(-(k.drifting?g0*.24:g0*gb)*dt);
    k.vx=fx*vf+lx*vl; k.vz=fz*vf+lz*vl; k.x+=k.vx*dt; k.z+=k.vz*dt;
    if(k.boostT>0) k.boostT-=dt;
    if(inp.nitro&&k.stock>0&&k.boostT<=.3){ k.stock--; k.boostT=2.8; k.bk=2; burst(k.x-fx*2,k.z-fz*2,nitroCol(k,0),4.5); if(mine) env.sfx('boost'); }
    locate(k);
    // 捷徑：離開主賽道、進到碎石小路時不撞主護欄，改用小路兩旁的石頭當邊界；進度照小路對應到主賽道的位置算
    k.rough=false;
    if(cut){ const [dc,kc]=cutDist(k.x,k.z),inCorr=dc<cut.W+1.2||Math.abs(k.d)<=LIM+1&&dc<cut.W+5;
      if(Math.abs(k.d)>HW+.5&&(inCorr||k.inCut&&Math.abs(k.d)>LIM)){ k.rough=true;
        if(Math.abs(k.d)>LIM){ k.inCut=true; const mi=cut.mi[kc]; let delta=mi-k.idx; if(delta>N/2) delta-=N; if(delta<-N/2) delta+=N; k.prog+=delta; k.idx=mi;
          if(dc>cut.W+1.2){ const ox=k.x-cut.cx[kc],oz=k.z-cut.cz[kc],l=Math.hypot(ox,oz)||1,over=dc-(cut.W+1.2); k.x-=ox/l*over; k.z-=oz/l*over;
            const vn=(k.vx*ox+k.vz*oz)/l; if(vn>0){ k.vx-=ox/l*vn; k.vz-=oz/l*vn; } if(!k.wall){ k.vx*=.65; k.vz*=.65; if(mine) env.sfx('bump'); } k.wall=true; if(k.drifting) k.dBad=true; }
          else k.wall=false;
          for(const r of cut.rocks){ const dx=k.x-r.x,dz=k.z-r.z,d=Math.hypot(dx,dz),m=r.r+1.3; if(d<m&&d>.01){ k.x+=dx/d*(m-d); k.z+=dz/d*(m-d); const vn=(k.vx*dx+k.vz*dz)/d; if(vn<0){ k.vx-=dx/d*vn; k.vz-=dz/d*vn; } if(!k.rockHit){ k.vx*=.45; k.vz*=.45; if(mine) env.sfx('bump'); } k.rockHit=true; } else if(d>m+.5) k.rockHit=false; }
        } }
      else if(Math.abs(k.d)<=LIM) k.inCut=false; }
    if(k.inCut&&Math.abs(k.d)>LIM){ /* 在捷徑裡，不用主賽道護欄 */ }
    else if(Math.abs(k.d)>LIM){ const s=Math.sign(k.d),j=k.idx,over=Math.abs(k.d)-LIM;
      k.x-=nx[j]*over*s; k.z-=nz[j]*over*s; k.d=LIM*s;
      const vn=k.vx*nx[j]+k.vz*nz[j]; if(vn*s>0){ k.vx-=nx[j]*vn; k.vz-=nz[j]*vn; }
      if(!k.wall){ k.vx*=.7; k.vz*=.7; if(mine) env.sfx('bump'); } k.wall=true;
      if(k.drifting) k.dBad=true; // 甩尾撞牆：這次不能集氣和甩噴（不另外提示）
    } else k.wall=false;
    for(const p of pads){ let dd=k.idx-p; if(dd>N/2) dd-=N; if(dd>=-2&&dd<=2&&Math.abs(k.d)<5&&k.boostT<1){ k.boostT=1.3; k.bk=3; if(mine) env.sfx('boost'); } }
    if(itemMode){
      for(const b of boxes){ if(b.cool>0) continue; const dx=k.x-b.x,dz=k.z-b.z;
        if(dx*dx+dz*dz<10){ // 最多留兩個，滿了就丟掉最舊的
          const got=ITEMS[(Math.random()*ITEMS.length)|0]; k.rollT=.7; k.items.push(got); const old=k.items.length>2?k.items.shift():null;
          toast(k,'獲得 '+INAME[got]+(old?'（丟掉 '+INAME[old]+'）':'')); burst(b.x,b.z,0xffffff,3);
          b.cool=4; b.mesh.visible=false; if(mine) env.sfx('item'); break; } }
      for(let n=bananas.length-1;n>=0;n--){ const b=bananas[n]; if(b.owner===k.i&&b.age<.6) continue; const dx=k.x-b.x,dz=k.z-b.z;
        if(dx*dx+dz*dz<6){ const id=b.id,ow=b.owner; dropBanana(id); if(net) net.send({banx:id}); hit(k,1,ow,'banana'); } }
      if(k.spin<=0) for(const w of waters){ if(!w.landed||w.owner===k.i) continue; const dx=k.x-w.x,dz=k.z-w.z; if(dx*dx+dz*dz<46){ hit(k,1.7,w.owner,'water'); break; } }
      if(inp.nitro&&k.items.length) useItem(k);
      if(k.shield>0) k.shield-=dt;
    }
    k.flags=(k.boostT>0?1:0)|(k.drifting?2:0)|(k.shield>0?4:0)|(k.spin>0?8:0)|(k.tumble>0?16:0)|(k.slowT>0?32:0)|(k.cloudT>0?64:0)|(k.boostT>0&&k.bk===2?128:0)|(k.boostT>0&&k.bk===1?256:0)|(k.flyT>0?512:0);
  }
  const inp={steer:0,gas:false,brake:false,drift:false,nitro:false,max:1};
  function aiInput(k,dt){
    const a=k.ai,spd=Math.hypot(k.vx,k.vz),j=(k.idx+6+Math.floor(spd*.22))%N;
    const diff=wrap(Math.atan2(px[j]+nx[j]*a.lane-k.x,pz[j]+nz[j]*a.lane-k.z)-k.h);
    let cmax=0; for(let s=4;s<36;s+=3){ const c=Math.abs(curv[(k.idx+s)%N]); if(c>cmax) cmax=c; }
    let lead=-1e9; for(const q of karts) if(q.human&&!q.left) lead=Math.max(lead,q.prog);
    const gap=k.prog-lead,band=gap>40?.93:gap<-40?1.07:1;
    const vt=Math.min(MAX*a.skill*band,1.75/Math.max(cmax,.001));
    inp.steer=clamp(diff*3,-1,1); inp.gas=spd<vt; inp.brake=spd>vt+8; inp.drift=false; inp.nitro=false; inp.tap=Math.random()<dt*9; inp.max=a.skill*band;
    if(k.cloudT>0){ inp.steer=clamp(inp.steer+Math.sin(t*7+k.i)*.6,-1,1); inp.max*=.85; } // 電腦被烏雲遮住時會開得歪歪的
    a.nt-=dt; if(!itemMode&&a.nt<=0&&cmax<.008&&k.fin==null){ k.boostT=2; k.bk=2; a.nt=9+Math.random()*10; }
    if(itemMode&&k.items.length&&k.fin==null){ a.it=(a.it==null?1+Math.random()*3:a.it)-dt; if(a.it<=0){ inp.nitro=false; a.it=useItem(k)?null:1.5; } }
  }
  function humanInput(k){
    const K=env.keys; inp.max=1;
    if(local2){ // 1P 用 WASD（左半畫面），2P 用方向鍵（右半畫面）；不用 Ctrl，避免 Ctrl+W 關掉分頁
      inp.tap=k.i===0?env.hit('KeyW'):env.hit('ArrowUp');
      if(k.i===0){ inp.steer=(K.KeyA?1:0)-(K.KeyD?1:0); inp.brake=!!K.KeyS; inp.gas=!!K.KeyW; inp.drift=!!K.ShiftLeft; inp.nitro=env.hit('KeyQ')||env.hit('KeyE'); }
      else { inp.steer=(K.ArrowLeft?1:0)-(K.ArrowRight?1:0); inp.brake=!!K.ArrowDown; inp.gas=!!K.ArrowUp; inp.drift=!!(K.ShiftRight||K.Slash); inp.nitro=env.hit('Enter')||env.hit('NumpadEnter'); }
      return; }
    inp.steer=(K.ArrowLeft?1:0)-(K.ArrowRight?1:0);
    inp.brake=!!K.ArrowDown; inp.gas=env.touch?!inp.brake:!!K.ArrowUp; inp.tap=env.hit('ArrowUp');
    inp.drift=!!(K.ShiftLeft||K.ShiftRight||K.Space); inp.nitro=env.hit('ControlLeft')||env.hit('ControlRight')||env.hit('KeyX');
  }
  function pack(k){ return k.remote?[k.i,r2(k.tx),r2(k.tz),r2(k.th),r2(k.vx),r2(k.vz),Math.round(k.prog),k.flags,k.fin]
    :[k.i,r2(k.x),r2(k.z),r2(k.h),r2(k.vx),r2(k.vz),Math.round(k.prog),k.flags,k.fin]; }
  function applyRemote(a){ const k=karts[a[0]]; if(!k||!k.remote) return; k.tx=a[1];k.tz=a[2];k.th=a[3];k.vx=a[4];k.vz=a[5];k.prog=a[6];k.flags=a[7];k.fin=a[8]; }
  function gone(i){ const k=karts[i]; if(k){ k.left=true; k.mesh.visible=false; } }
  if(net){
    net.onmsg=m=>{ if(m.k) applyRemote(m.k); if(m.ks) for(const a of m.ks) if(a[0]!==me) applyRemote(a); if(m.gone!=null) gone(m.gone);
      if(itemMode&&(m.ban||m.banx||m.mis||m.hit||m.wat||m.glob)){ if(net.host) net.send(m);
        if(m.glob&&karts[m.glob[1]]&&karts[m.glob[1]].remote) applyGlobal(m.glob[0],m.glob[1]);
        if(m.wat) addWater(m.wat[0],m.wat[1],m.wat[2],m.wat[3],m.wat[4],m.wat[5]);
        if(m.hit&&karts[m.hit[0]]&&karts[m.hit[0]].remote) hitEvent(m.hit[0],m.hit[1],m.hit[2],m.hit[3]);
        if(m.ban) addBanana(m.ban[0],m.ban[1],m.ban[2],m.ban[3]); if(m.banx) dropBanana(m.banx);
        if(m.mis&&karts[m.mis[0]]&&karts[m.mis[1]]&&karts[m.mis[0]].remote) launch(m.mis[0],m.mis[1]); } };
    net.onleave=i=>{ gone(i); net.send({gone:i}); };
  }
  function rankOf(k){ let r=1; for(const q of karts){ if(q===k||q.left) continue;
    if(k.fin!=null){ if(q.fin!=null&&q.fin<k.fin) r++; } else if(q.fin!=null||q.prog>k.prog) r++; } return r; }

  /* ---- 引擎聲 ---- */
  let osc=null,eg=null;
  { const ac=env.audio(),out=env.out(); if(ac&&out){ try{ osc=ac.createOscillator(); osc.type='sawtooth'; const lp=ac.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=520;
      eg=ac.createGain(); eg.gain.value=.022; osc.connect(lp); lp.connect(eg); eg.connect(out); osc.start(); }catch(e){ osc=null; } } }

  function update(dt){
    if(cer){ stepCeremony(dt); return; }
    if(intro){ // 開場：鏡頭繞著整排起跑的車轉一圈，所有選手和名字一次看完
      intro.t+=dt; if(intro.t>=intro.dur) intro=null;
      if(intro&&!net&&intro.t>.4&&(env.hit('Space')||env.hit('Enter')||env.hit('KeyX'))) intro=null;
      if(!intro) guard=.3; }
    else if(cd>0){ cd-=dt; const c=Math.ceil(cd); if(c<lastBeep&&c>=1&&c<=3){ lastBeep=c; env.sfx('beep'); }
      if(cd<=0){ env.sfx('go'); for(const k of karts) if(!k.human&&!k.remote&&Math.random()<.2+st.ai*.25){ k.boostT=1.1; k.bk=2; } } }
    // 起步加速：GO 出現的那一瞬間按下油門（前 0.13 秒到後 0.28 秒），會有一小段氮氣；太早按就沒有
    if(guard>0) guard-=dt; // 剛跳過開場的那一下不算
    else if(!intro) for(const k of locals){ if(k.startDone||k.ai) continue; const rel=cd>0?-cd:t;
      if(rel>.3){ k.startDone=true; continue; }
      const hitGas=local2?(k.i===0?env.hit('KeyW'):env.hit('ArrowUp')):env.hit('ArrowUp');
      if(hitGas){ k.startDone=true; if(rel>=-.13) k.startOK=true; else toast(k,'太早按了，沒有起步加速'); } }
    if(cd<=0) for(const k of locals) if(k.startOK){ k.startOK=false; k.boostT=1.3; k.bk=2; toast(k,'完美起步！'); burst(k.x-Math.sin(k.h)*2,k.z-Math.cos(k.h)*2,nitroCol(k,0),5); flashT=.1; env.sfx('boost'); }
    else {
      t+=dt;
      for(const k of karts){
        if(k.left) continue;
        if(k.remote){ k.tx+=k.vx*dt; k.tz+=k.vz*dt; const f=Math.min(1,dt*10); k.x+=(k.tx-k.x)*f; k.z+=(k.tz-k.z)*f; k.h+=wrap(k.th-k.h)*f; continue; }
        if(k.ai) aiInput(k,dt); else humanInput(k);
        if(k.fin!=null){ inp.steer=0; inp.gas=false; inp.drift=false; inp.nitro=false; inp.tap=false; inp.brake=Math.hypot(k.vx,k.vz)>1.5; } // 跑完了：煞車停在終點後面等
        if(k.tumble>0) k.tumble-=dt; if(k.flyT>0) k.flyT-=dt;
        if(k.spin>0){ k.spin-=dt; inp.steer=0; inp.gas=inp.brake=inp.drift=inp.nitro=false; }
        drive(k,inp,dt);
        if(k.fin==null&&k.prog>=LAPS*N){ k.fin=t; if(k.local) env.sfx('win'); }
      }
      // 車與車互撞：只推自己算的車
      for(let a=0;a<NK;a++) for(let b=a+1;b<NK;b++){ const A=karts[a],B=karts[b]; if(A.left||B.left||(A.remote&&B.remote)||A.fin!=null||B.fin!=null) continue; // 停在終點的車不擋路
        const dx=B.x-A.x,dz=B.z-A.z,d=Math.hypot(dx,dz); if(d>2.7||d<.001) continue; const p=(2.7-d)/d,wa=A.remote?0:(B.remote?1:.5),wb=B.remote?0:(A.remote?1:.5);
        A.x-=dx*p*wa; A.z-=dz*p*wa; B.x+=dx*p*wb; B.z+=dz*p*wb; }
      for(const k of locals){ const v=k.v,lap=clamp(Math.floor(k.prog/N)+1,1,LAPS); if(lap>v.lap&&k.fin==null){ v.lap=lap; env.sfx('lap'); }
        const dot=Math.sin(k.h)*tx[k.idx]+Math.cos(k.h)*tz[k.idx]; v.wrongT=dot<-.3&&Math.hypot(k.vx,k.vz)>8?v.wrongT+dt:0; }
      if(!local2&&env.hit('KeyR')&&my.fin==null){ const j=my.idx; my.x=px[j]; my.z=pz[j]; my.h=Math.atan2(tx[j],tz[j]); my.vx=my.vz=0; my.inCut=false; }
      let first=null; for(const k of karts) if(!k.left&&k.fin!=null&&(first==null||k.fin<first)) first=k.fin;
      if(first!=null&&!ended){
        remain=Math.max(0,15-(t-first));
        const c2=Math.ceil(remain); if(c2<lastTick&&c2>=1&&c2<=5) env.sfx('beep'); lastTick=c2;
        if(karts.every(k=>k.left||!k.human||k.fin!=null)) endT+=dt; // 真人都跑完就不用等滿 15 秒
        if(remain<=0||endT>4){ ended=true; awards(); }
      }
    }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/15;
      if(net.host) net.send({ks:karts.filter(k=>!k.left).map(pack)}); else net.send({k:pack(my)}); } }
    if(osc){ const s=Math.hypot(my.vx,my.vz); osc.frequency.value=55+s*2.6+(my.boostT>0?40:0); }
    if(itemMode){
      for(const b of boxes){ b.mesh.rotation.y+=dt*2; b.mesh.rotation.x=Math.sin(t*1.3+b.ph)*.3; b.mesh.position.y=2.3+Math.sin(t*3+b.ph)*.45; b.glow.rotation.y-=dt*5; b.glow.scale.setScalar(1+.08*Math.sin(t*6+b.ph)); if(b.cool>0){ b.cool-=dt; if(b.cool<=0) b.mesh.visible=true; } }
      for(let n=waters.length-1;n>=0;n--){ const w=waters[n]; w.age+=dt; const u=Math.min(1,w.age/W_FLY);
        w.x=w.x0+Math.sin(w.h)*w.dist*u; w.z=w.z0+Math.cos(w.h)*w.dist*u;
        if(u<1){ w.mesh.position.set(w.x,1.5+Math.sin(u*Math.PI)*4.5,w.z); w.mesh.scale.setScalar(1.4); }
        else { if(!w.landed){ w.landed=true; burst(w.x,w.z,0x4fb4ff,8); } const r=6.2+Math.sin(w.age*9)*.4; w.mesh.position.set(w.x,.8,w.z); w.mesh.scale.set(r,1.2,r); }
        if(w.age>W_FLY+W_STAY){ scene.remove(w.mesh); waters.splice(n,1); } }
      for(const b of bananas){ b.age+=dt; b.mesh.scale.setScalar(Math.min(1,b.age*5)); b.mesh.rotation.y+=dt*3; }
      for(let n=missiles.length-1;n>=0;n--){ const m=missiles[n],A=karts[m.from],B=karts[m.to]; m.t+=dt; const u=Math.min(1,m.t/.9);
        m.mesh.position.set(A.x+(B.x-A.x)*u,1.4+Math.sin(u*Math.PI)*3,A.z+(B.z-A.z)*u);
        if(Math.floor(m.t/.1)!==Math.floor((m.t-dt)/.1)) burst(m.mesh.position.x,m.mesh.position.z,0xffaa55,1.3);
        if(u>=1){ scene.remove(m.mesh); missiles.splice(n,1); if(!B.remote) hit(B,1.3,m.from,'missile'); } }
    }
    for(let n=fx.length-1;n>=0;n--){ const f=fx[n]; f.t+=dt; const u=f.t/f.life; f.m.scale.setScalar(.5+u*f.size); f.m.material.opacity=.7*(1-u);
      if(u>=1){ f.m.visible=false; pool.push(f); fx.splice(n,1); } }
    // 甩尾時後輪冒煙（甩越久顏色越熱），噴氮氣時車尾拖出火光
    if(cd<=0) for(const k of karts){ if(k.left) continue; k.fxT=(k.fxT||0)-dt; if(k.fxT>0||!(k.flags&3)) continue; k.fxT=.045; k.fxN=(k.fxN||0)+1;
      const sx=Math.sin(k.h),cz=Math.cos(k.h);
      if(k.flags&2){ const c=k.remote?0xffffff:k.driftT>1.4?0xff7a1a:k.driftT>DB_MIN?0xffd23f:0xffffff; for(const d of [-1,1]) burst(k.x-sx*1.3+cz*d*1.1,k.z-cz*1.3-sx*d*1.1,c,1.2,.4,.4); }
      if(k.flags&1){
        if(k.flags&256){ for(const d of [-1,1]) burst(k.x-sx*2+cz*d*1.1,k.z-cz*2-sx*d*1.1,k.fxN%2?0xffffff:0x4fd0ff,.85,.45,.24); }      // 甩噴：兩個後輪各拖一道青白色的光
        else { const st=NITRO[k.look.nitro]||NITRO.fire,nit=k.flags&128;                                                                  // 氮氣：從車尾中間噴出，樣式看造型
          for(let q=0;q<(nit?st.n*2:1);q++){ const j=(Math.random()-.5)*(nit?st.jit:.3)*2,b=3.2+Math.random()*1.4; burst(k.x-sx*b+cz*j,k.z-cz*b-sx*j,nit?nitroCol(k,k.fxN+q):0xffa41a,nit?st.size*1.45:1.5,.8+Math.random()*(nit?st.jit:.2),nit?st.life*1.25:.28); } }
      } }
    for(const k of locals){ if(k.toastT>0) k.toastT-=dt; if(k.rollT>0) k.rollT-=dt; }
    if(flashT>0) flashT-=dt;
    if(pip){ pip.t-=dt; if(pip.t<=0) pip=null; }
    for(const k of karts){ const air=k.flags&16; k.mesh.position.set(k.x,air?Math.abs(Math.sin(t*5))*3.2+.6:0,k.z); k.mesh.rotation.x=air?t*11:0; k.mesh.rotation.y=k.h+((k.flags&8)&&!air?t*16:0); { const fl=k.mesh.userData.flame; if((k.flags&1)&&!(k.flags&256)){ const nit=k.flags&128; setFlame(fl,nit?nitroCol(k,Math.floor(t*12)):0xffa41a,nit?1.55:.95,nit?1.35:.95); } else fl.visible=false; } { const sp=Math.hypot(k.vx,k.vz)*dt*2; for(const wl of k.mesh.userData.wheels) wl.rotation.x+=sp; for(const f of k.mesh.userData.anim) f(t,Math.hypot(k.vx,k.vz)); } k.mesh.userData.shield.visible=!!(k.flags&4); k.mesh.userData.cloud.visible=!!(k.flags&64); k.mesh.userData.bolt.visible=!!(k.flags&32)&&Math.floor(t*8)%2===0; }
    for(const k of karts){ if(!k.mesh.userData.moto||(k.flags&512)) continue; // 機車過彎壓車
      const dh=wrap(k.h-(k.ph==null?k.h:k.ph)); k.ph=k.h; const tg=clamp(-dh/Math.max(dt,1e-3)*.22,-.55,.55); k.lean=(k.lean||0)+(tg-(k.lean||0))*Math.min(1,dt*7); k.mesh.rotation.z=k.lean;
      const sh=k.mesh.userData.shadow; if(sh){ sh.rotation.set(0,0,0); sh.rotateZ(-k.lean); sh.rotateX(-Math.PI/2); sh.position.set(Math.sin(k.lean)*.1,.1*Math.cos(k.lean)-Math.sin(Math.abs(k.lean))*.0,0); } } // 影子保持平貼地面
    for(const k of karts){ // 被飛彈炸飛：拋到半空翻兩圈，落地揚起塵土
      if(k.flags&512){ if(!k.flyAt){ k.flyAt=t; burst(k.x,k.z,0xff7a1a,7,1,.6); } const u=Math.min(1,(t-k.flyAt)/1.5);
        k.mesh.position.y=Math.sin(u*Math.PI)*9; k.mesh.rotation.x=u*Math.PI*4; k.mesh.rotation.z=Math.sin(u*Math.PI*2)*.5; }
      else if(k.flyAt){ k.flyAt=0; if(!k.mesh.userData.moto) k.mesh.rotation.z=0; burst(k.x,k.z,0xd9c9a8,5,.4,.5); } }
    for(const k of karts){ if(k.left||!(k.flags&2)||k.z>.5){ k.sk=null; continue; } // 甩尾中才留胎痕
      const sx=Math.sin(k.h),cz=Math.cos(k.h),w=[[k.x-sx*1.1+cz*1.12,k.z-cz*1.1-sx*1.12],[k.x-sx*1.1-cz*1.12,k.z-cz*1.1+sx*1.12]];
      if(!k.sk) k.sk=w; else if(Math.hypot(w[0][0]-k.sk[0][0],w[0][1]-k.sk[0][1])>.7){ for(let j=0;j<2;j++) skid(k.sk[j][0],k.sk[j][1],w[j][0],w[j][1]); k.sk=w; } }
    for(const k of locals){ const v=k.v; v.camH+=wrap(k.h-v.camH)*Math.min(1,dt*(k.drifting?3.4:5)); v.fov+=((k.boostT>0?(k.bk===2?84:74):62)-v.fov)*Math.min(1,dt*4); }
  }

  // 分隊結果：只有衝過終點的人照名次給分（沒跑完的不算分），總分高的隊伍贏；同分看誰的隊伍有人跑得最前面，都沒人跑完就是平手
  function teamResult(){ const order=karts.filter(q=>!q.left).sort(rankSort),pts=[0,0],best=[99,99];
    order.forEach((q,n)=>{ if(q.team==null||q.fin==null) return; pts[q.team]+=POINTS[n]||0; best[q.team]=Math.min(best[q.team],n); });
    return {order,pts,wt:pts[0]!==pts[1]?(pts[0]>pts[1]?0:1):best[0]!==best[1]?(best[0]<best[1]?0:1):-1}; }
  const rankSort=(a,b)=>(a.fin!=null?a.fin-1e6:-a.prog)-(b.fin!=null?b.fin-1e6:-b.prog);
  let cer=null;
  function awards(){ startCeremony(); }
  function results(){
    const order=karts.filter(q=>!q.left).sort(rankSort),single=!net&&!local2,r=order.indexOf(my)+1,ok=r<=3,stage=opts.stage||0;
    const time=q=>q.fin!=null?fmtTime(q.fin):'未完賽',esc=v=>String(v).replace(/[<>&]/g,'');
    env.sfx(local2||ok?'win':'lose');
    const pod=[1,0,2].filter(n=>order[n]).map(n=>'<div class="pod p'+(n+1)+'"><b>'+esc(order[n].name)+'</b><span>'+time(order[n])+'</span><i style="background:'+order[n].color+'">'+(n+1)+'</i></div>').join('');
    const rest=order.slice(3).map((q,n)=>'<li>第 '+(n+4)+' 名　'+esc(q.name)+'　'+time(q)+'</li>').join('');
    let title='頒獎',teamHtml='',teamTxt='';
    if(mode!=='ffa'){ // 照名次給分：第 1 名 10 分、第 2 名 8 分、6、5、4、3
      const {pts,wt}=teamResult(),mine=wt>=0&&(local2?(karts[0].team===wt||karts[1].team===wt):my.team===wt),both=local2&&karts[0].team===karts[1].team;
      title=wt<0?'平手':local2&&!both?TEAMS[wt].name+' 獲勝':mine?(mode==='coop'||both?'你們贏了！':'你的隊伍贏了！'):'你們輸了';
      teamHtml='<p style="font-weight:700">'+TEAMS.map((T,n)=>'<span style="color:'+T.col+'">'+T.name+' '+pts[n]+' 分</span>').join('　')+'</p>';
      teamTxt='名次積分：第 1 名 10 分、第 2 名 8 分，再來 6、5、4、3 分，只有衝過終點的人才算分，加起來多的隊伍獲勝。'+(wt<0?'兩隊都沒有人跑完，算平手。':pts[0]===pts[1]?'這次同分，'+TEAMS[wt].name+'有人跑得最前面，所以獲勝。':''); env.sfx(mine?'win':'lose'); }
    env.end({title,html:teamHtml+'<div class="podium">'+pod+'</div>'+(rest?'<ul class="rest">'+rest+'</ul>':''),
      text:(local2?'':'你是第 '+r+' 名。'+recText(stage,my.fin,!local2))+teamTxt,score:null,next:single&&stage<STAGES.length-1});
  }

  function startCeremony(){
    const all=karts.filter(q=>!q.left).sort(rankSort),TR0=mode!=='ffa'?teamResult():null,TR=TR0&&TR0.wt>=0?TR0:null,S=new T.Scene(); // 分隊平手時照一般頒獎
    const order=TR?TR.order.filter(q=>q.team===TR.wt).slice(0,3):all.slice(0,3); // 分隊時贏的隊伍上台
    S.background=new T.Color(0x1a1440); S.fog=new T.Fog(0x1a1440,40,90);
    S.add(new T.AmbientLight(0xffffff,.55)); const dl=new T.DirectionalLight(0xffffff,.9); dl.position.set(6,14,10); S.add(dl);
    const ctex=(w,h,fn)=>{ const cv=document.createElement('canvas'); cv.width=w; cv.height=h; fn(cv.getContext('2d'),w,h); return new T.CanvasTexture(cv); };
    // 舞台與背板
    const floor=new T.Mesh(new T.CircleGeometry(26,48),new T.MeshLambertMaterial({color:0x3a2d6b})); floor.rotation.x=-Math.PI/2; S.add(floor);
    const ring=new T.Mesh(new T.RingGeometry(10,11,48),new T.MeshBasicMaterial({color:0xffd23f})); ring.rotation.x=-Math.PI/2; ring.position.y=.02; S.add(ring);
    const board=new T.Mesh(new T.PlaneGeometry(34,12),new T.MeshBasicMaterial({map:ctex(1024,360,(c,w,h)=>{ const g=c.createLinearGradient(0,0,0,h); g.addColorStop(0,'#3a1f7a'); g.addColorStop(1,'#14122b'); c.fillStyle=g; c.fillRect(0,0,w,h);
      for(let i=0;i<40;i++){ c.fillStyle=['#ffd23f','#ff5d8f','#3ddbd9'][i%3]; c.beginPath(); c.arc((i*97)%w,(i*53)%h,3,0,7); c.fill(); }
      c.font='900 120px "Press Start 2P",monospace'; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.shadowColor='#ff5d8f'; c.shadowBlur=30;
      if(TR){ c.font='900 110px '+TC; c.fillStyle=TEAMS[TR.wt].col; c.fillText(TEAMS[TR.wt].name+' 獲勝',w/2,h*.42); c.font='900 54px "Press Start 2P",monospace'; c.fillStyle='#ffd23f'; c.fillText('TEAM WIN!',w/2,h*.8); }
      else c.fillText('WINNER',w/2,h/2); })}));
    board.position.set(0,8,-9); S.add(board);
    // 頒獎台（中間第一名最高）
    const POD=[{x:0,h:3,c:0xffd23f},{x:-6.2,h:2,c:0xc8d0e0},{x:6.2,h:1.3,c:0xd08a4a}],meshes=[];
    POD.forEach((p,n)=>{ const front=new T.MeshLambertMaterial({map:ctex(128,128,(c,w,h)=>{ c.fillStyle='#'+p.c.toString(16).padStart(6,'0'); c.fillRect(0,0,w,h); c.fillStyle='#14122b'; c.font='900 84px "Press Start 2P",monospace'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(n+1),w/2,h/2+6); })}),side=new T.MeshLambertMaterial({color:p.c});
      const box=new T.Mesh(new T.BoxGeometry(5.4,p.h,4.2),[side,side,side,side,front,side]); box.position.set(p.x,p.h/2,0); S.add(box);
      const q=order[n]; if(!q) return; const m=buildKart(T,q.look); m.position.set(p.x-.75,p.h,-.2); m.scale.setScalar(.92); S.add(m); if(m.userData.driver) m.userData.driver.visible=false;
      const ch=buildCheer(T,q.look,m.userData.head); ch.position.set(p.x+1.7,p.h,.6); S.add(ch); meshes.push({m,q,n,top:p.h,ch,px:p.x,rank:all.indexOf(q)}); });
    // 第一名的聚光燈
    const beam=new T.Mesh(new T.ConeGeometry(4.2,22,32,1,true),new T.MeshBasicMaterial({color:0xfff2a8,transparent:true,opacity:.18,side:T.DoubleSide,depthWrite:false})); beam.position.set(0,13,0); S.add(beam);
    // 彩花
    const conf=[],cg=new T.PlaneGeometry(.38,.22),COLS=[0xff5d4f,0xffd23f,0x3ddbd9,0x86dc4f,0xff7eb6,0x4f9dff,0xffffff];
    for(let i=0;i<260;i++){ const m=new T.Mesh(cg,new T.MeshBasicMaterial({color:COLS[i%COLS.length],side:T.DoubleSide})); m.position.set((Math.random()-.5)*30,Math.random()*24+2,(Math.random()-.5)*14); S.add(m); conf.push({m,vy:1.6+Math.random()*2.2,sx:(Math.random()-.5)*1.2,r:[Math.random()*6,Math.random()*6]}); }
    cer={TR,t:0,S,cam:new T.PerspectiveCamera(46,vw/vh,.5,200),meshes,conf,beam,dur:7.5,skip:false};
    env.sfx('win'); setTimeout(()=>{ if(cer) env.sfx('lap'); },900);
  }
  function stepCeremony(dt){
    const C=cer; C.t+=dt;
    for(const o of C.meshes){ const n=o.n,ph=C.t*(n===0?5:4)+n*1.7; // 跳上跳下、轉圈、左右搖
      o.m.position.y=o.top; o.m.rotation.y=.35+Math.sin(C.t*.6+n)*.12; // 車子停在台上
      const ch=o.ch; ch.position.y=o.top+Math.abs(Math.sin(ph))*(n===0?1.4:1.0);                // 人物在車旁跳
      ch.rotation.y=n===0?C.t*3.2:(Math.floor(C.t/1.6+n)%2?C.t*2.6*(n===1?-1:1):Math.sin(C.t*3)*.5); // 轉圈或左右扭
      for(const ar of ch.userData.arms) ar.a.rotation.z=-ar.sd*(.35+.45*Math.abs(Math.sin(C.t*8+ar.sd)));  // 揮手
    }
    for(const f of C.conf){ f.m.position.y-=f.vy*dt; f.m.position.x+=Math.sin(C.t*2+f.r[0])*f.sx*dt; f.m.rotation.x+=dt*f.r[0]; f.m.rotation.y+=dt*f.r[1]; if(f.m.position.y<0){ f.m.position.y=22+Math.random()*4; } }
    for(const o of C.meshes) for(const f of o.m.userData.anim) f(C.t,0);
    C.beam.material.opacity=.14+.08*Math.sin(C.t*6);
    if(C.t>C.dur||C.t>1.2&&(C.skip||env.hit('Space')||env.hit('Enter'))) endCeremony();
  }
  function endCeremony(){ const C=cer; cer=null; C.S.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ const ms=Array.isArray(o.material)?o.material:[o.material]; for(const m of ms){ if(m.map) m.map.dispose(); m.dispose(); } } }); results(); }
  renderer.domElement.addEventListener('pointerdown',()=>{ if(cer) cer.skip=true; });
  function drawCeremony(c){
    const C=cer,a=Math.sin(C.t*.5)*.55,cam2=C.cam,s=clamp(vw/560,.62,1.2);
    renderer.setScissorTest(false); renderer.setViewport(0,0,vw,vh); cam2.aspect=vw/vh; cam2.updateProjectionMatrix();
    cam2.position.set(Math.sin(a)*19,6.5+Math.sin(C.t*.7)*.6,Math.cos(a)*19); cam2.lookAt(0,3.2,0); renderer.render(C.S,cam2);
    c.textAlign='center'; c.textBaseline='middle';
    const big=(tx,col,size,font,yy)=>{ c.fillStyle=col; c.strokeStyle='#0b0a1c'; c.lineWidth=7*s; c.font='900 '+size*s+'px '+font; c.strokeText(tx,vw/2,yy); c.fillText(tx,vw/2,yy); };
    if(C.TR) big(TEAMS[C.TR.wt].name+' 獲勝！　'+C.TR.pts[C.TR.wt]+' 比 '+C.TR.pts[1-C.TR.wt],TEAMS[C.TR.wt].col,30,TC,36*s); else big('頒獎典禮','#ffd23f',34,TC,36*s);
    const v=new T.Vector3(),MED=['#ffd23f','#d8dde8','#e0954f'];
    for(const o of C.meshes){ v.set(o.px,o.top+4.6,0).project(cam2); const x=(v.x+1)/2*vw,y=(1-v.y)/2*vh;
      c.font='900 '+15*s+'px '+TC; const nm=o.q.name,tw=c.measureText(nm).width+40*s;
      c.fillStyle='rgba(11,10,28,.82)'; c.fillRect(x-tw/2,y-15*s,tw,30*s); c.fillStyle=MED[Math.min(2,o.rank)]||MED[2]; c.beginPath(); c.arc(x-tw/2+15*s,y,10*s,0,7); c.fill();
      c.fillStyle='#14122b'; c.font='900 '+11*s+'px '+PIX; c.fillText(String(o.rank+1),x-tw/2+15*s,y+1); c.fillStyle='#fff'; c.font='900 '+15*s+'px '+TC; c.textAlign='left'; c.fillText(nm,x-tw/2+30*s,y); c.textAlign='center';
      c.font='700 '+11*s+'px '+TC; c.fillStyle='#cfe8d8'; c.fillText(o.q.fin!=null?fmtTime(o.q.fin):'未完賽',x,y+24*s); }
    if(C.t>1.2){ c.font='700 '+12*s+'px '+TC; c.fillStyle='rgba(255,255,255,.75)'; c.fillText(env.touch?'點畫面看完整名次':'按空白鍵看完整名次',vw/2,vh-18*s); }
  }
  // 畫面太慢時自動降低解析度，保持流暢（每 1.5 秒看一次平均每格的時間）
  let fpsT=0,fpsN=0,fpsLast=0;
  function adapt(){ const now=performance.now(); if(fpsLast){ const d=now-fpsLast; if(d<200){ fpsT+=d; fpsN++; } } fpsLast=now;
    if(fpsT>1500){ const avg=fpsT/fpsN; fpsT=fpsN=0; const want=avg>24?Math.max(1,pr-.25):avg<15&&pr<dpr?Math.min(dpr,pr+.25):pr; if(want!==pr){ pr=want; renderer.setPixelRatio(pr); renderer.setSize(vw,vh,false); } } }
  function draw(){
    const c=hud,n=locals.length,side=vw>=vh; adapt();
    c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,vw,vh);
    if(cer){ drawCeremony(c); return; }
    if(intro){ const u=intro.t/intro.dur,e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2,s=clamp(vw/560,.62,1);
      let cx=0,cz=0; for(const k of karts){ cx+=k.x; cz+=k.z; } cx/=karts.length; cz/=karts.length;
      const h=karts[0].h,a=h+Math.PI+(1-e)*Math.PI*1.9,R=26-e*9;
      renderer.setScissorTest(false); renderer.setViewport(0,0,vw,vh); cam.aspect=vw/vh; cam.fov=52; cam.updateProjectionMatrix();
      cam.position.set(cx+Math.sin(a)*R,9-e*4,cz+Math.cos(a)*R); cam.lookAt(cx+Math.sin(h)*e*6,1.6,cz+Math.cos(h)*e*6); renderer.render(scene,cam);
      // 下方列出所有參賽者
      const list=mode!=='ffa'?karts.filter(k=>k.team===0).concat(karts.filter(k=>k.team===1)):karts.filter(k=>k.human).concat(karts.filter(k=>!k.human)),bh=(list.length>3&&vw<520?70:52)*s;
      c.fillStyle='rgba(11,10,28,.8)'; c.fillRect(0,vh-bh-12*s,vw,bh+12*s); c.textBaseline='middle';
      c.textAlign='left'; c.fillStyle='#ffd23f'; c.font=10*s+'px '+PIX; c.fillText('RACERS',12*s,vh-bh-2*s);
      c.textAlign='right'; c.fillStyle='#aaa4d8'; c.font='700 '+11*s+'px '+TC; c.fillText(STAGES[opts.stage||0].name+'　'+(itemMode?'道具賽':'競速賽')+(net?'':'　'+(env.touch?'按「使用」跳過':'按空白鍵跳過')),vw-12*s,vh-bh-2*s);
      const per=Math.ceil(list.length/(bh>50*s?2:1)),cw=(vw-24*s)/per;
      list.forEach((k,i)=>{ const row=Math.floor(i/per),x=12*s+(i%per)*cw,y=vh-bh+16*s+row*24*s; c.fillStyle=k.color; c.beginPath(); c.arc(x+6*s,y,5*s,0,7); c.fill();
        c.textAlign='left'; c.fillStyle=k.team!=null?TEAMS[k.team].col:k.human?'#fff':'#c9c6e6'; c.font=(k.human?'900 ':'700 ')+13*s+'px '+TC; c.fillText((k.team!=null?TEAMS[k.team].name+' ':'')+k.name,x+16*s,y); });
      return; }
    renderer.setScissorTest(n>1);
    locals.forEach((k,i)=>{
      // 分割畫面：橫向時左右各半，直向時上下各半
      const w=n>1&&side?vw/2:vw,h=n>1&&!side?vh/2:vh,x=n>1&&side?i*w:0,y=n>1&&!side?i*h:0,v=k.v;
      renderer.setViewport(x,vh-y-h,w,h); if(n>1) renderer.setScissor(x,vh-y-h,w,h);
      const sx=Math.sin(v.camH),cz=Math.cos(v.camH);
      cam.aspect=w/h; cam.fov=v.fov; cam.updateProjectionMatrix();
      const sh=k.boostT>0&&k.bk===2?.09:k.rough&&Math.hypot(k.vx,k.vz)>10?.22:0,jx=(Math.random()-.5)*sh,jy=(Math.random()-.5)*sh; // 噴氮氣時鏡頭輕微震動
      if(k.fin!=null){ const oa=v.camH+Math.PI+(t-k.fin)*.45,R=Math.max(7,10.5-(t-k.fin)*2); cam.position.set(k.x+Math.sin(oa)*R,3.6,k.z+Math.cos(oa)*R); cam.lookAt(k.x,1.3,k.z); } // 跑完：鏡頭繞著停下來的車轉
      else { cam.position.set(k.x-sx*10.5+jx,5.4+jy,k.z-cz*10.5); cam.lookAt(k.x+sx*6,1.6,k.z+cz*6); }
      renderer.render(scene,cam);
      c.save(); c.translate(x,y); c.beginPath(); c.rect(0,0,w,h); c.clip(); drawHud(k,w,h); c.restore();
    });
    if(n>1){ c.fillStyle='#0b0a1c'; if(side) c.fillRect(vw/2-2,0,4,vh); else c.fillRect(0,vh/2-2,vw,4); }
    if(pip&&n===1){ // 右下角小視窗：自己的道具打中誰
      const pw=Math.max(150,Math.min(260,vw*.27)),ph=pw*.62,x0=vw-pw-10,y0=vh-ph-10,V=pip.k;
      renderer.setScissorTest(true); renderer.setViewport(x0,10,pw,ph); renderer.setScissor(x0,10,pw,ph);
      cam.aspect=pw/ph; cam.fov=55; cam.updateProjectionMatrix(); cam.position.set(V.x+7,5.5,V.z+7); cam.lookAt(V.x,1.2,V.z);
      renderer.render(scene,cam); renderer.setScissorTest(false);
      c.strokeStyle='#ffd23f'; c.lineWidth=3; c.strokeRect(x0,y0,pw,ph); c.fillStyle='rgba(11,10,28,.75)'; c.fillRect(x0,y0+ph-22,pw,22);
      c.fillStyle='#fff'; c.textAlign='center'; c.textBaseline='middle'; c.font='700 13px '+TC; c.fillText(pip.text,x0+pw/2,y0+ph-10);
    }
  }
  function drawHud(k,w,h){
    const c=hud,s=clamp(w/560,.62,1),v=k.v;
    if(k.boostT>0){ c.strokeStyle='rgba(255,255,255,.35)'; c.lineWidth=2;
      for(let i=0;i<26;i++){ const a=(i*2.399+t*3)%6.283,r1=Math.max(w,h)*(.36+(i%5)*.03),r3=r1+60+(i%3)*30;
        c.beginPath(); c.moveTo(w/2+Math.cos(a)*r1,h/2+Math.sin(a)*r1); c.lineTo(w/2+Math.cos(a)*r3,h/2+Math.sin(a)*r3); c.stroke(); } }
    const panel=(x,y,pw,ph)=>{ c.fillStyle='rgba(11,10,28,.62)'; c.fillRect(x,y,pw,ph); };
    c.textBaseline='middle';
    // 左上：圈數與名次
    panel(10,10,150*s,58*s); c.textAlign='left'; c.fillStyle='#aaa4d8'; c.font='700 '+13*s+'px '+TC;
    c.fillText('圈數',20,10+18*s); c.fillText('名次',20,10+42*s);
    c.fillStyle='#fff'; c.font=13*s+'px '+PIX;
    const live=karts.filter(q=>!q.left).length;
    c.fillText(clamp(Math.floor(k.prog/N)+1,1,LAPS)+'/'+LAPS,20+48*s,10+19*s); c.fillStyle='#ffd23f'; c.fillText(rankOf(k)+'/'+live,20+48*s,10+43*s);
    if(local2){ c.fillStyle=k.color; c.font=12*s+'px '+PIX; c.fillText((k.i+1)+'P',20+112*s,10+19*s); }
    // 左側：所有人的即時名次
    const order=karts.filter(q=>!q.left).sort((a,b)=>(a.fin!=null?a.fin-1e6:-a.prog)-(b.fin!=null?b.fin-1e6:-b.prog)),rh=20*s,ly=10+66*s;
    order.forEach((q,n)=>{ const y=ly+n*(rh+2*s); c.fillStyle=q===k?'rgba(255,210,63,.9)':'rgba(11,10,28,.62)'; c.fillRect(10,y,150*s,rh);
      c.textAlign='left'; c.fillStyle=q===k?'#14122b':'#fff'; c.font=10*s+'px '+PIX; c.fillText(String(n+1),16,y+rh/2+1);
      if(q.team!=null){ c.fillStyle=TEAMS[q.team].col; c.fillRect(10,y,4*s,rh); } // 分隊：名次表左邊有隊伍顏色
      c.fillStyle=q.color; c.beginPath(); c.arc(16+22*s,y+rh/2,5*s,0,7); c.fill();
      c.fillStyle=q===k?'#14122b':'#fff'; c.font='700 '+13*s+'px '+TC; c.fillText(q.name,16+32*s,y+rh/2+1);
      if(q.fin!=null){ c.textAlign='right'; c.font='700 '+11*s+'px '+TC; c.fillText('完賽',10+146*s,y+rh/2+1); }
      else if(mode!=='ffa'&&q!==k&&q.team===k.team){ c.textAlign='right'; c.font='900 '+10*s+'px '+TC; c.fillStyle=TEAMS[q.team].col; c.fillText('隊友',10+146*s,y+rh/2+1); } });
    if(mode!=='ffa'&&k.team!=null){ const y=ly+order.length*(rh+2*s)+2*s,mates=karts.filter(q=>!q.left&&q!==k&&q.team===k.team).map(q=>q.name);
      c.fillStyle='rgba(11,10,28,.62)'; c.fillRect(10,y,150*s,34*s); c.fillStyle=TEAMS[k.team].col; c.fillRect(10,y,4*s,34*s);
      c.textAlign='left'; c.font='900 '+11*s+'px '+TC; c.fillText('我的隊伍：'+TEAMS[k.team].name,18*s,y+10*s); c.fillStyle='#fff'; c.font='700 '+10*s+'px '+TC; c.fillText(mates.length?'隊友：'+mates.join('、'):'隊友：無',18*s,y+25*s); }
    // 右上：時間與小地圖
    const mw=118*s; panel(w-10-mw,10,mw,26*s+mw); c.textAlign='center'; c.fillStyle='#fff'; c.font=11*s+'px '+PIX; c.fillText(fmtTime(k.fin!=null?k.fin:t),w-10-mw/2,10+14*s);
    const sc=(mw-16)/Math.max(maxX-minX,maxZ-minZ),ox=w-10-mw/2-(minX+maxX)/2*sc,oy=10+26*s+mw/2-(minZ+maxZ)/2*sc;
    c.strokeStyle='#f4f0ff'; c.lineWidth=3; c.beginPath(); for(let i=0;i<=N;i+=3){ const j=i%N; if(i) c.lineTo(ox+px[j]*sc,oy+pz[j]*sc); else c.moveTo(ox+px[j]*sc,oy+pz[j]*sc); } c.closePath(); c.stroke();
    if(cut){ c.strokeStyle='#d99a50'; c.lineWidth=2; c.setLineDash([3,2]); c.beginPath(); c.moveTo(ox+cut.cx[0]*sc,oy+cut.cz[0]*sc); c.lineTo(ox+cut.cx[cut.M]*sc,oy+cut.cz[cut.M]*sc); c.stroke(); c.setLineDash([]); }
    for(const q of karts){ if(q.left||q===k) continue; c.fillStyle=q.color; c.beginPath(); c.arc(ox+q.x*sc,oy+q.z*sc,3,0,7); c.fill(); }
    c.fillStyle=k.color; c.strokeStyle='#fff'; c.lineWidth=2; c.beginPath(); c.arc(ox+k.x*sc,oy+k.z*sc,4.5,0,7); c.fill(); c.stroke();
    // 下方：時速與氮氣
    const bw=230*s,bx=w/2-bw/2,by=h-52*s; panel(bx,by,bw,42*s);
    c.textAlign='left'; c.fillStyle='#fff'; c.font=14*s+'px '+PIX; c.fillText(String(Math.round(Math.hypot(k.vx,k.vz)*3)).padStart(3,'0'),bx+10*s,by+22*s);
    c.fillStyle='#aaa4d8'; c.font=8*s+'px '+PIX; c.fillText('KM/H',bx+62*s,by+24*s);
    const gx=bx+104*s,gw=64*s;
    if(itemMode){ // 兩格道具，左邊那格是下一個會用掉的
      for(let n=0;n<2;n++){ const it=k.items[n],x2=gx+n*59*s; c.fillStyle=it&&n===0?'#ffd23f':'#2b2759'; c.fillRect(x2,by+8*s,55*s,26*s);
        c.textAlign='center'; c.fillStyle=it?(n===0?'#14122b':'#fff'):'#6b6799'; c.font='900 '+14*s+'px '+TC; c.fillText(it?INAME[it]:'空',x2+27.5*s,by+22*s); } }
    else { c.fillStyle='#2b2759'; c.fillRect(gx,by+13*s,gw,16*s); c.fillStyle=k.drifting?'#ffd23f':'#3ddbd9'; c.fillRect(gx,by+13*s,gw*clamp(k.gauge,0,1),16*s);
      for(let i=0;i<2;i++){ c.fillStyle=i<k.stock?'#ff9d3d':'#2b2759'; c.beginPath(); c.arc(gx+gw+16*s+i*22*s,by+21*s,8*s,0,7); c.fill(); } }
    c.textAlign='center';
    const big=(txt,col,size,font,yy,wt)=>{ c.fillStyle=col; c.strokeStyle='#0b0a1c'; c.lineWidth=8*s; c.font=(wt||'')+size*s+'px '+font; c.strokeText(txt,w/2,yy); c.fillText(txt,w/2,yy); };
    if(cd>0){ big(String(Math.min(3,Math.ceil(cd))),'#ffd23f',72,PIX,h*.38); if(!k.ai){ const tip=k.startDone&&!k.startOK?'':'GO 的瞬間按'+(env.touch?' ▲ ':local2&&k.i===0?' W ':' ↑ ')+'可以起步加速'; c.font='700 '+13*s+'px '+TC; c.lineWidth=4; c.strokeStyle='#0b0a1c'; c.strokeText(tip,w/2,h*.38+52*s); c.fillStyle='#fff'; c.fillText(tip,w/2,h*.38+52*s); } }
    else if(t<.9) big('GO!','#86dc4f',60,PIX,h*.38);
    if(v.wrongT>1) big(local2?'逆向！':'逆向！按 R 回到賽道','#ff5d8f',30,TC,h*.3,'900 ');
    if(k.fin!=null){ const ft=t-k.fin,r=rankOf(k); c.save(); c.translate(w/2,h*.3); const sc=ft<.35?.4+ft/.35*.75:1.15-Math.min(.15,(ft-.35)*.5); c.scale(sc,sc); c.translate(-w/2,-h*.3);
      big('FINISH!','#ffd23f',54,PIX,h*.3); c.restore(); if(ft>.5) big('第 '+r+' 名'+(r===1?'　冠軍！':''),r===1?'#ffd23f':'#fff',28,TC,h*.3+52*s,'900 '); }
    if(k.cloudT>0){ // 烏雲蓋住畫面中央，只留下方和兩側
      c.globalAlpha=Math.min(1,k.cloudT*2)*.93; c.fillStyle='#2c2f3d';
      for(let i=0;i<14;i++){ const a=i*1.7,cx=w*(.14+.72*((i*37)%14)/13)+Math.sin(t*1.3+a)*14,cy=h*(.2+.36*((i*5)%7)/6)+Math.cos(t+a)*8; c.beginPath(); c.arc(cx,cy,Math.min(w,h)*(.13+.03*(i%3)),0,7); c.fill(); }
      c.globalAlpha=1; }
    if(k.slowT>0){ c.strokeStyle='rgba(255,225,74,'+(.5+.3*Math.sin(t*20))+')'; c.lineWidth=10; c.strokeRect(5,5,w-10,h-10); }
    if(k.boostT>0&&(k.bk===2||k.bk===1)){ // 噴氮氣：邊緣泛出氮氣顏色、四周的速度線往中心衝
      const col=k.bk===2?nitroCol(k,Math.floor(t*10)):0x4fd0ff,r=col>>16&255,gg=col>>8&255,b=col&255,a=Math.min(1,k.boostT*2)*(k.bk===2?1:.6);
      const vg=c.createRadialGradient(w/2,h*.55,Math.min(w,h)*.28,w/2,h*.55,Math.max(w,h)*.72); vg.addColorStop(0,'rgba('+r+','+gg+','+b+',0)'); vg.addColorStop(1,'rgba('+r+','+gg+','+b+','+(.58*a)+')'); c.fillStyle=vg; c.fillRect(0,0,w,h);
      c.lineCap='round'; for(let i=0;i<34;i++){ const ang=Math.random()*Math.PI*2,r0=Math.max(w,h)*(.3+Math.random()*.25),len=Math.max(w,h)*(.12+Math.random()*.2),cx=w/2,cy=h*.55;
        c.strokeStyle=i%3?'rgba(255,255,255,'+(.75*a)+')':'rgba('+r+','+gg+','+b+','+(.7*a)+')'; c.lineWidth=1.5+Math.random()*3; c.beginPath(); c.moveTo(cx+Math.cos(ang)*r0,cy+Math.sin(ang)*r0); c.lineTo(cx+Math.cos(ang)*(r0+len),cy+Math.sin(ang)*(r0+len)); c.stroke(); } }
    if(flashT>0){ c.fillStyle='rgba(255,255,220,'+Math.min(.8,flashT*3)+')'; c.fillRect(0,0,w,h); }
    if(remain!=null&&!ended){ const tw=190*s; c.fillStyle='rgba(226,59,59,.88)'; c.fillRect(w/2-tw/2,8,tw,30*s); c.fillStyle='#fff'; c.font='900 '+15*s+'px '+TC; c.fillText('比賽結束倒數 '+Math.ceil(remain)+' 秒',w/2,8+16*s); }
    if(itemMode){ const bs=58*s,gp=10*s,x0=w/2-bs-gp/2,y0=8*s;
      c.fillStyle='rgba(11,10,28,.72)'; c.fillRect(x0-8*s,y0-4*s,bs*2+gp+16*s,bs+26*s);
      for(let n=0;n<2;n++){ const x=x0+n*(bs+gp),it=k.items[n],rolling=n===k.items.length-1&&k.rollT>0;
        c.fillStyle=n===0?'#2b2759':'#1d1a3f'; c.fillRect(x,y0,bs,bs);
        if(n===0&&it){ const a=.55+.45*Math.sin(t*8); c.strokeStyle='rgba(255,210,63,'+a+')'; c.lineWidth=4*s; c.strokeRect(x,y0,bs,bs); }
        else { c.strokeStyle='rgba(255,255,255,.25)'; c.lineWidth=2*s; c.strokeRect(x,y0,bs,bs); }
        if(rolling) itemIcon(c,x+bs/2,y0+bs/2,bs*.36,ITEMS[Math.floor(t*14)%ITEMS.length]);
        else if(it) itemIcon(c,x+bs/2,y0+bs/2,(n===0?bs*.38:bs*.3),it);
        c.textAlign='center'; c.font='900 '+11*s+'px '+TC; c.fillStyle=n===0?'#ffd23f':'#aaa4d8'; c.fillText(rolling?'？？？':it?INAME[it]:'空',x+bs/2,y0+bs+11*s); }
      if(k.items.length&&!k.rollT){ c.font='700 '+10*s+'px '+TC; c.fillStyle='#fff'; c.textAlign='left'; c.fillText(env.touch?'按「使用」':local2&&k.i===0?'按 Q':'按 Ctrl',x0+bs*2+gp+14*s,y0+bs/2); } }
    if(k.toastT>0){ c.font='900 '+18*s+'px '+TC; const tw=c.measureText(k.toastText).width+28*s; c.globalAlpha=Math.min(1,k.toastT*2.5);
      c.fillStyle='rgba(11,10,28,.8)'; c.fillRect(w/2-tw/2,h*.2-17*s,tw,34*s); c.fillStyle='#ffd23f'; c.fillText(k.toastText,w/2,h*.2+1); c.globalAlpha=1; }
  }
  return {update,draw,bg:!!net,
    pause(p){ if(eg) eg.gain.value=p?0:.022; },
    destroy(){ ro.disconnect(); if(osc){ try{osc.stop();}catch(e){} } scene.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ if(o.material.map) o.material.map.dispose(); o.material.dispose(); } }); renderer.dispose(); },
    _dbg:{awards:()=>{ ended=true; awards(); },hit:(k,s,o,kind)=>hit(k,s,o,kind),karts,my,N,px,pz,tx,tz,cut,skip:()=>{ intro=null; cd=0; }}};
}

function preview(ctx,w,h,L,t){
  ctx.fillStyle='#8fd3ff'; ctx.fillRect(0,0,w,h*.5); ctx.fillStyle='#4c9a3c'; ctx.fillRect(0,h*.5,w,h*.5);
  ctx.fillStyle='#4a4a55'; ctx.beginPath(); ctx.moveTo(w*.42,h*.5); ctx.lineTo(w*.58,h*.5); ctx.lineTo(w*.95,h); ctx.lineTo(w*.05,h); ctx.fill();
  const x=w/2+Math.sin(t*1.5)*10,y=h*.86,s=2.3,B=L.body,ww=B==='buggy'?13:10,wh=B==='buggy'?20:B==='sport'?12:15,bw=B==='sport'?40:36,bh=B==='sport'?13:B==='buggy'?19:16,lift=B==='buggy'?6:0;
  const R=(a,b,c,d)=>ctx.fillRect(x+a*s,y+b*s,c*s,d*s);
  if(B==='scooter'||B==='bike'){ const hv=B==='bike',lean=Math.sin(t*1.5)*.12; ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x,y+3*s,16*s,5*s,0,0,7); ctx.fill();
    ctx.save(); ctx.translate(x,y); ctx.rotate(lean); const r=(a,b,c,d)=>ctx.fillRect(a*s,b*s,c*s,d*s);
    ctx.fillStyle='#22222c'; r(-4,-20,8,22); ctx.fillStyle=L.color; r(hv?-11:-9,hv?-36:-30,hv?22:18,hv?18:14); ctx.fillStyle='#ff3b3b'; r(-5,hv?-32:-27,10,3); ctx.fillStyle='#fff'; r(-2,hv?-36:-30,4,hv?18:14);
    ctx.fillStyle='#22222c'; r(-15,hv?-40:-44,30,3); ctx.fillStyle='#f4f4f8'; r(-8,hv?-58:-60,16,hv?20:18); ctx.fillStyle=L.color; r(-8,hv?-42:-46,16,4);
    const hy=(hv?-64:-68)*s,C=(cx,cy,rr,c)=>{ ctx.fillStyle=c; ctx.beginPath(); ctx.arc(cx,cy,rr,0,7); ctx.fill(); };
    if(L.driver==='bear'){ C(-7*s,hy-7*s,3.6*s,'#9a6a3a'); C(7*s,hy-7*s,3.6*s,'#9a6a3a'); C(0,hy,9*s,'#9a6a3a'); }
    else if(L.driver==='bunny'){ ctx.fillStyle='#fff'; ctx.fillRect(-6*s,hy-22*s,4*s,15*s); ctx.fillRect(2*s,hy-22*s,4*s,15*s); C(0,hy,9*s,'#fff'); }
    else if(L.driver==='cap'){ C(0,hy,9*s,'#ffd9a8'); ctx.fillStyle=L.color; ctx.beginPath(); ctx.arc(0,hy-s,9*s+.5,Math.PI,0); ctx.fill(); }
    else C(0,hy,9*s,L.color);
    ctx.restore(); return; }
  ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x,y+3*s,28*s,6*s,0,0,7); ctx.fill();
  ctx.fillStyle='#22222c'; R(-bw/2-ww+3,-wh+2,ww,wh); R(bw/2-3,-wh+2,ww,wh);
  if(L.part==='exhaust'){ ctx.fillStyle='#b9c2d0'; R(-9,-8-lift,6,7); R(3,-8-lift,6,7); }
  ctx.fillStyle=L.color; R(-bw/2,-bh-2-lift,bw,bh);
  const top=-bh-2-lift;
  if(L.part==='wing'){ ctx.fillStyle='#22222c'; R(-14,top-9,3,9); R(11,top-9,3,9); ctx.fillStyle=L.color; R(-25,top-13,50,5); }
  else if(L.part==='none'){ ctx.fillStyle='#22222c'; R(-21,top-6,42,4); }
  else if(L.part==='flag'){ ctx.fillStyle='#22222c'; R(-17,top-36,1.5,36); ctx.fillStyle='#ffd23f'; R(-15.5,top-36,14,8); }
  ctx.fillStyle='#fff'; R(-7,top-12,14,12);
  const hx=x,hy=y+(top-19)*s,hr=9*s,C=(cx,cy,r,c)=>{ ctx.fillStyle=c; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill(); };
  if(L.driver==='bear'){ C(hx-7*s,hy-7*s,3.6*s,'#9a6a3a'); C(hx+7*s,hy-7*s,3.6*s,'#9a6a3a'); C(hx,hy,hr,'#9a6a3a'); }
  else if(L.driver==='bunny'){ ctx.fillStyle='#fff'; ctx.fillRect(hx-6*s,hy-22*s,4*s,15*s); ctx.fillRect(hx+2*s,hy-22*s,4*s,15*s); C(hx,hy,hr,'#fff'); }
  else if(L.driver==='cap'){ C(hx,hy,hr,'#ffd9a8'); ctx.fillStyle=L.color; ctx.beginPath(); ctx.arc(hx,hy-1*s,hr+.5,Math.PI,0); ctx.fill(); }
  else C(hx,hy,hr,L.color);
}

function thumb(ctx,w,h,t){
  const hz=h*.4,g=ctx.createLinearGradient(0,0,0,hz); g.addColorStop(0,'#3fa8f0'); g.addColorStop(1,'#bfe8ff'); ctx.fillStyle=g; ctx.fillRect(0,0,w,hz);
  ctx.fillStyle='rgba(255,255,255,.9)'; for(let i=0;i<3;i++){ const x=((i*180+t*10)%(w+120))-60; ctx.beginPath(); ctx.ellipse(x,26+i*12,30,8,0,0,7); ctx.ellipse(x+18,20+i*12,18,8,0,0,7); ctx.fill(); }
  ctx.fillStyle='#8aa6c8'; ctx.beginPath(); ctx.moveTo(0,hz); for(let x=0;x<=w;x+=40) ctx.lineTo(x,hz-30-Math.abs(Math.sin(x*.013+1))*40); ctx.lineTo(w,hz); ctx.fill();
  ctx.fillStyle='#4c9a3c'; ctx.fillRect(0,hz,w,h-hz);
  ctx.fillStyle='#2f7d32'; for(let i=0;i<10;i++){ const x=i*56-20; ctx.beginPath(); ctx.moveTo(x,hz+2); ctx.lineTo(x+20,hz-38); ctx.lineTo(x+40,hz+2); ctx.fill(); }
  const sway=Math.sin(t*.7)*80+40;
  for(let i=0;i<40;i++){ const z0=i/40,z1=(i+1)/40,p0=z0*z0,p1=z1*z1,y0=hz+p0*(h-hz),y1=hz+p1*(h-hz);
    const c0=w/2+sway*(1-p0)*(1-p0),c1=w/2+sway*(1-p1)*(1-p1),w0=12+p0*w*.5,w1=12+p1*w*.5,band=Math.floor((1/(z0+.06)+t*5))%2;
    ctx.fillStyle=band?'#e23b3b':'#f4f4f4'; ctx.beginPath(); ctx.moveTo(c0-w0*1.12,y0); ctx.lineTo(c0+w0*1.12,y0); ctx.lineTo(c1+w1*1.12,y1+1); ctx.lineTo(c1-w1*1.12,y1+1); ctx.fill();
    ctx.fillStyle=band?'#4a4a55':'#525262'; ctx.beginPath(); ctx.moveTo(c0-w0,y0); ctx.lineTo(c0+w0,y0); ctx.lineTo(c1+w1,y1+1); ctx.lineTo(c1-w1,y1+1); ctx.fill();
    if(band&&i%2===0){ ctx.fillStyle='rgba(255,255,255,.6)'; ctx.fillRect(c0-1.5-p0*2,y0,3+p0*4,y1-y0+1); } }
  // 終點拱門
  { const p=.16,y=hz+p*(h-hz),c=w/2+sway*(1-p)*(1-p),ww=(12+p*w*.5)*1.3; ctx.fillStyle='#22222c'; ctx.fillRect(c-ww,y-46,5,46); ctx.fillRect(c+ww-5,y-46,5,46);
    for(let i=0;i<10;i++){ ctx.fillStyle=i%2?'#fff':'#14122b'; ctx.fillRect(c-ww+i*ww/5,y-50,ww/5,6); ctx.fillStyle=i%2?'#14122b':'#fff'; ctx.fillRect(c-ww+i*ww/5,y-44,ww/5,6); } }
  // 道具箱
  for(const [p,dx] of [[.32,-.4],[.32,.4]]){ const y=hz+p*(h-hz),c=w/2+sway*(1-p)*(1-p)+dx*(12+p*w*.5),s=6+p*14,bob=Math.sin(t*4+dx)*2; ctx.save(); ctx.translate(c,y-s-bob); ctx.rotate(t*1.5); ctx.fillStyle='rgba(255,210,63,.9)'; ctx.fillRect(-s/2,-s/2,s,s); ctx.fillStyle='#14122b'; ctx.font='900 '+(s*.7)+'px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('?',0,1); ctx.restore(); }
  const kart=(x,y,s,col,tilt)=>{ ctx.save(); ctx.translate(x,y); ctx.rotate(tilt||0); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(0,3*s,26*s,6*s,0,0,7); ctx.fill();
    ctx.fillStyle='#22222c'; ctx.fillRect(-25*s,-12*s,10*s,14*s); ctx.fillRect(15*s,-12*s,10*s,14*s);
    ctx.fillStyle=col; ctx.fillRect(-18*s,-18*s,36*s,16*s); ctx.fillStyle='#22222c'; ctx.fillRect(-21*s,-26*s,42*s,4*s);
    ctx.fillStyle='#fff'; ctx.fillRect(-7*s,-30*s,14*s,12*s); ctx.fillStyle=col; ctx.beginPath(); ctx.arc(0,-36*s,9*s,0,7); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.5)'; ctx.fillRect(-5*s,-40*s,10*s,3*s); ctx.restore(); };
  kart(w/2+80+Math.sin(t*1.3)*14,h*.62,.55,'#3d8bff'); kart(w/2-100+Math.sin(t*.9)*10,h*.72,.75,'#ffd23f');
  // 自己的車：甩尾中，後輪噴火花，放開後噴氮氣
  const ph=(t%3)/3,drift=ph<.6,kx=w/2+(drift?-30:Math.sin(t*1.7)*20),ky=h*.88,tilt=drift?-.18:0;
  if(drift){ for(let i=0;i<10;i++){ const a=Math.PI*.6+Math.random()*.8,r=8+Math.random()*16; ctx.fillStyle=ph>.35?(i%2?'#ffd23f':'#ff7a1a'):'#ffffff'; ctx.fillRect(kx+30+Math.cos(a)*r,ky+2+Math.sin(a)*r*.4,3,3); ctx.fillRect(kx-34+Math.cos(a)*r*.6,ky+2+Math.sin(a)*r*.4,3,3); }
    ctx.strokeStyle='rgba(20,20,28,.5)'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(kx+30,ky+4); ctx.quadraticCurveTo(kx+40,h,kx+70,h); ctx.moveTo(kx-30,ky+4); ctx.quadraticCurveTo(kx-24,h,kx-4,h); ctx.stroke(); }
  else { const fl=18+Math.sin(t*40)*6; for(const dx of [-10,10]){ const gg=ctx.createLinearGradient(0,ky,0,ky+fl+16); gg.addColorStop(0,'#ffffff'); gg.addColorStop(.3,'#3ddbd9'); gg.addColorStop(1,'rgba(79,157,255,0)'); ctx.fillStyle=gg; ctx.beginPath(); ctx.moveTo(kx+dx-7,ky); ctx.lineTo(kx+dx,ky+fl+16); ctx.lineTo(kx+dx+7,ky); ctx.fill(); }
    ctx.strokeStyle='rgba(255,255,255,.6)'; ctx.lineWidth=2; for(let i=0;i<8;i++){ const x=(i*67+t*900)%w,y=hz+20+(i*37)%(h-hz-30); ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+(x<w/2?-24:24),y+10); ctx.stroke(); } }
  kart(kx,ky,1.25,'#ff4d4d',tilt);
  ctx.font='900 '+(h*.08)+'px "Press Start 2P",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=5; ctx.strokeStyle='#14122b'; const lbl=drift?'DRIFT!':'BOOST!'; ctx.strokeText(lbl,w/2,h*.16); ctx.fillStyle=drift?'#ffd23f':'#3ddbd9'; ctx.fillText(lbl,w/2,h*.16);
}

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).kart={
  name:'極速大亂鬥',tag:'KART RACE',color:'#ffd23f',online:true,maxPlayers:6,bots:true,
  desc:'3D 賽車。過彎按住飄移集氣，集滿拿到氮氣瓶，直線衝刺超車。共 20 關，星星越多越難，4、5 星路比較窄、彎比較急，還有不好走的捷徑；有競速賽和道具賽，可單人、雙人分割畫面，或開房間連線。',
  goal:'跑 3 圈，前 3 名過關。有人衝線後倒數 15 秒就結束並頒獎。競速賽：過彎按住飄移集氣換氮氣，甩尾放開後馬上按一下 ↑ 可以甩噴（手機按 ▲）。4、5 星賽道有碎石捷徑，路短但開不快又有石頭擋路。道具賽：撞問號箱拿道具（氮氣、香蕉、飛彈、護盾、水球、烏雲、閃電），最多留 2 個。雙人和連線可以選玩法：「各自分開」、「分隊對戰」（兩隊人數一樣，1 對 1、2 對 2、3 對 3，不夠由電腦補）、「玩家對決」（不加電腦，雙人就是 1P 對 2P）或「玩家同隊打電腦」（電腦和玩家一樣多），分隊時照名次算積分（第 1 名 10 分、第 2 名 8 分，再來 6、5、4、3 分，只有衝過終點的人才算分），總分高的隊伍獲勝。',
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),
  variants:[{id:'speed',label:'競速賽'},{id:'item',label:'道具賽'}],
  options:[{key:'team',label:'雙人／連線玩法',def:'ffa',opts:[{id:'ffa',label:'各自分開'},{id:'vs',label:'分隊對戰（電腦補人）'},{id:'pvp',label:'玩家對決（不加電腦）'},{id:'coop',label:'玩家同隊打電腦'}]}],
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],
  help:[['↑ ↓ ← →','油門、煞車、轉向'],['Shift','過彎時按住飄移，放開後按一下 ↑ 甩噴'],['X','使用氮氣或道具'],['R','回到賽道中央'],['W A S D 左Shift Q','雙人 1P（左半畫面），Q 用氮氣或道具'],['↑ ↓ ← → 右Shift Enter','雙人 2P（右半畫面），Enter 用氮氣或道具']],
  touchHelp:[['◀ ▶','轉向，自動踩油門'],['▲','出發鍵：GO 的瞬間按起步加速；甩尾放開後按一下甩噴'],['飄移','過彎時按住'],['使用','用氮氣或道具'],['煞','煞車']],
  touch:{left:[{l:'◀',c:'ArrowLeft',big:true},{l:'▶',c:'ArrowRight',big:true}],right:[{l:'▲',c:'ArrowUp'},{l:'飄移',c:'ShiftLeft'},{l:'煞',c:'ArrowDown'},{l:'使用',c:'KeyX',act:true}]},
  best:{label:'最快紀錄',fmt:v=>fmtTime(v),lower:true},
  stageBest:i=>{ const v=getRec(i); return v==null?'':fmtTime(v); },
  hubBest:()=>{ let i=0; try{ i=+localStorage.getItem('arcade.kart.last2')||0; }catch(e){} const v=getRec(i); return v==null?'尚無紀錄':'最快紀錄 <b>'+STAGES[i].name+' '+fmtTime(v)+'</b>'; },
  looks:[{key:'body',label:'車輛',opts:[{id:'std',label:'標準車'},{id:'sport',label:'跑車'},{id:'buggy',label:'越野車'},{id:'scooter',label:'機車'},{id:'bike',label:'重型機車'}]},
    {key:'color',label:'車輛顏色',type:'color',opts:['#ff4d4d','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#3d8bff','#c56bff','#ff7eb6']},
    {key:'driver',label:'人物',opts:[{id:'helmet',label:'賽車手'},{id:'cap',label:'棒球帽'},{id:'bear',label:'小熊'},{id:'bunny',label:'兔子'},{id:'photo',label:'我的照片'}]},
    {key:'face',label:'個人照',type:'photo'},
    {key:'part',label:'配件',opts:[{id:'none',label:'小尾翼'},{id:'wing',label:'大尾翼'},{id:'flag',label:'旗子'},{id:'exhaust',label:'排氣管'}]},
    {key:'deco',label:'擺飾',type:'multi',hint:'每一類選一個，再按一次取下',opts:[{id:'halo',label:'天使光環',grp:'頭飾'},{id:'horns',label:'惡魔角',grp:'頭飾'},{id:'crown',label:'皇冠',grp:'頭飾'},{id:'propeller',label:'竹蜻蜓',grp:'頭飾'},{id:'catears',label:'貓耳',grp:'頭飾'},{id:'party',label:'派對帽',grp:'頭飾'},{id:'bow',label:'蝴蝶結',grp:'頭飾'},{id:'antenna',label:'外星天線',grp:'頭飾'},{id:'wizard',label:'魔法帽',grp:'頭飾'},{id:'flower',label:'向日葵',grp:'頭飾'},{id:'shades',label:'墨鏡',grp:'臉部'},{id:'hearts',label:'愛心眼鏡',grp:'臉部'},{id:'mustache',label:'八字鬍',grp:'臉部'},{id:'charm',label:'娃娃吊飾',grp:'娃娃'},{id:'bear',label:'小熊娃娃',grp:'娃娃'},{id:'duck',label:'小鴨',grp:'娃娃'},{id:'penguin',label:'企鵝',grp:'娃娃'},{id:'chick',label:'小雞',grp:'娃娃'},{id:'bunnydoll',label:'兔兔娃娃',grp:'娃娃'},{id:'catdoll',label:'橘貓娃娃',grp:'娃娃'},{id:'balloon',label:'愛心氣球',grp:'背後'},{id:'wings',label:'天使翅膀',grp:'背後'},{id:'batwings',label:'惡魔翅膀',grp:'背後'},{id:'butterfly',label:'蝴蝶翅膀',grp:'背後'},{id:'starballoon',label:'星星氣球',grp:'背後'},{id:'underglow',label:'霓虹底燈',grp:'車身'},{id:'foxtail',label:'狐狸尾巴',grp:'車身'},{id:'cans',label:'拖罐罐',grp:'車身'},{id:'orbit',label:'環繞星星',grp:'車身'}]},
    {key:'wheel',label:'輪子',opts:[{id:'std',label:'銀框'},{id:'gold',label:'金框'},{id:'race',label:'紅框寬胎'},{id:'offroad',label:'越野胎'},{id:'neon',label:'霓虹'}]},
    {key:'nitro',label:'氮氣特效',opts:[{id:'fire',label:'火焰'},{id:'ice',label:'冰晶'},{id:'rainbow',label:'彩虹'},{id:'bolt',label:'閃電'},{id:'star',label:'星光'}]}],
  stagePreview,stageInfo,stageViewer,ready:()=>!!window.THREE,preview,viewer,thumb,load,create,_buildKart:buildKart,_buildWorld:buildWorld,_stages:STAGES
};
})();
