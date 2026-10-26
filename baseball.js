// 鬥魂棒球：九人制，可選 3、5、7、9 局。投打自己操作，守備和跑壘由電腦依規則處理。
// 規則：三好球三振、四壞球保送、兩好球後界外不計、三出局攻守交換、封殺與觸殺、高飛接殺與回壘待跑、
//       全壘打、後攻領先時最後半局不打、再見得分、平手延長（最多加 3 局）。
// 距離單位是英呎：本壘 (0,0)，一壘 (63.6,63.6)，二壘 (0,127.3)，三壘 (-63.6,63.6)。
// 連線時房主負責運算（客隊先攻），加入的人是主隊；投球與揮棒在自己的畫面判定後再送出。
(function(){
'use strict';
const W=480,H=300,ZX=240,ZY=196,ZW=34,ZH=44,BX=ZX-54,BY=292,BS=1.5;
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
/* 每一隊有自己的 9 位球員（照棒次） */
const STAGES=[{name:'海風隊',col:'#3d8bff',lv:.12,names:['浪花','阿鯨','小帆','海鷗','珊瑚','阿潮','大浪','貝殼','燈塔']},
  {name:'沙漠隊',col:'#e0a030',lv:.28,names:['駱駝','阿沙','仙人掌','綠洲','烈日','蠍子','風沙','金字','阿漠']},
  {name:'冰原隊',col:'#7fd0e8',lv:.45,names:['雪球','冰柱','北極熊','企鵝','阿冰','極光','雪狐','冰山','白熊']},
  {name:'叢林隊',col:'#3fae5a',lv:.65,names:['猴王','巨猿','藤蔓','花豹','鸚鵡','大象','犀牛','阿虎','蟒蛇']},
  {name:'鋼鐵隊',col:'#8a8fa8',lv:.85,names:['鐵拳','鋼牙','螺絲','火車','鐵壁','齒輪','重錘','阿鋼','砲台']},
  {name:'冠軍隊',col:'#c56bff',lv:1,names:['王牌','金手','神射','皇冠','巨砲','閃電','鐵人','奇蹟','傳說']}];
const HOMEN=['小虎','阿強','阿烈','大山','鐵門','阿明','小傑','阿凱','阿翔'],AWAYN=['飛毛','阿盾','射手','老牆','門神','阿風','小岩','阿浪','阿雷'];
const clamp=(v,a,b)=>v<a?a:v>b?b:v,rnd=()=>Math.random(),gauss=()=>(rnd()+rnd()+rnd()-1.5)/.87;
const fence=th=>330+70*Math.cos(th*2); // 全壘打牆：邊線 330 呎、中外野 400 呎
const SW=.3; // 揮棒動畫秒數

/* ---- 人物：用關節畫，比例和動作比較像真的棒球員 ---- */
const SKIN='#f2c39a',SKD='#cf946a',INK='#1a1626',PANTS='#eceef5',SHOE='#22202e',GLOVE='#8a4b22';
const lerp=(a,b,k)=>a+(b-a)*k,lp=(a,b,k)=>[lerp(a[0],b[0],k),lerp(a[1],b[1],k)],add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
function ik(a,b,l1,l2,s){ const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.min(Math.hypot(dx,dy)||.001,l1+l2-.01),c=clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1),g=Math.atan2(dy,dx)+s*Math.acos(c); return [a[0]+Math.cos(g)*l1,a[1]+Math.sin(g)*l1]; }
function seg(ctx,pts,w,col,ow){ ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.strokeStyle=INK; ctx.lineWidth=w+ow*2; ctx.stroke(); ctx.strokeStyle=col; ctx.lineWidth=w; ctx.stroke(); }
// J：hip 腰、sh 肩、head 頭、fB/fF 後腳／前腳、hB/hF 後手／前手（身高約 100，腳底在 0，面向右）
// o：front 正面、glove 'B'|'F' 戴手套的手、ball 手上拿球、helmet 打擊頭盔、hair 髮型、up 抬頭
function fig(ctx,x,y,sc,face,J,col,o){
  o=o||{}; ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0,0,15*sc,4.5*sc,0,0,7); ctx.fill();
  ctx.scale(sc*face,sc); ctx.lineCap='round'; ctx.lineJoin='round';
  const ow=Math.max(.9,.75/sc),fr=!!o.front,tw=J.tw||0,hw=fr?6:2.5+Math.max(0,tw)*3,sw=fr?11:3+tw*5,dark=mix(col,'#000000',.28);
  const hipB=add(J.hip,[-hw,0]),hipF=add(J.hip,[hw,0]),shB=add(J.sh,[-sw,1]),shF=add(J.sh,[sw,0]);
  const kB=ik(hipB,J.fB,25,25,fr?1:-1),kF=ik(hipF,J.fF,25,25,-1);
  /* 打者的手臂：手往投手方向（畫面深處）伸時，在畫面上看起來變短，所以手臂跟著縮短、只微彎，不把手肘往外折；手肘一律朝下 */
  const armIk=(s,h,sg)=>{ if(!o.fore) return ik(s,h,16,15,sg); const r=Math.hypot(h[0]-s[0],h[1]-s[1]),k=clamp(r*1.13/31,.42,1),A=ik(s,h,16*k,15*k,1),B=ik(s,h,16*k,15*k,-1); return A[1]>=B[1]?A:B; };
  const eB=armIk(shB,J.hB,fr?-1:1),eF=armIk(shF,J.hF,1);
  const leg=(hp,k,f,b)=>{ seg(ctx,[hp,k,lp(k,f,.45)],10,b?'#c9ccd8':PANTS,ow); seg(ctx,[lp(k,f,.42),f],7,b?dark:col,ow);
    ctx.fillStyle=INK; ctx.beginPath(); ctx.ellipse(f[0]+(fr?0:3),f[1]-1.5,(fr?4.5:6.8)+ow*.6,3.2+ow*.6,0,0,7); ctx.fill(); ctx.fillStyle=SHOE; ctx.beginPath(); ctx.ellipse(f[0]+(fr?0:3),f[1]-1.5,fr?4.5:6.8,3.2,0,0,7); ctx.fill(); };
  const arm=(s,e,h,b)=>{ seg(ctx,[s,lp(s,e,.7)],8.5,b?dark:col,ow); seg(ctx,[lp(s,e,.62),e,h],5.6,b?SKD:SKIN,ow); };
  const glove=h=>{ ctx.fillStyle=INK; ctx.beginPath(); ctx.ellipse(h[0]+1,h[1],7+ow,6+ow,.3,0,7); ctx.fill(); ctx.fillStyle=GLOVE; ctx.beginPath(); ctx.ellipse(h[0]+1,h[1],7,6,.3,0,7); ctx.fill(); ctx.strokeStyle='#5a2d10'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(h[0]+1,h[1],3.4,0,3); ctx.stroke(); };
  const hand=(h,i)=>{ if(o.glove===i) glove(h); else if(o.ball===i){ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(h[0],h[1],3.3,0,7); ctx.fill(); ctx.strokeStyle=INK; ctx.lineWidth=ow; ctx.stroke(); } };
  leg(hipB,kB,J.fB,!fr); arm(shB,eB,J.hB,!fr); if(!fr) hand(J.hB,'B');
  seg(ctx,[add(J.sh,[0,3]),add(J.hip,[0,-3])],fr?23:17,col,ow); // 球衣
  ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(J.sh[0]+(fr?0:4),J.sh[1]+4); ctx.lineTo(J.hip[0]+(fr?0:4),J.hip[1]-4); ctx.stroke(); // 球衣排扣線
  seg(ctx,[add(J.hip,[-(fr?9:6),-1]),add(J.hip,[fr?9:6,-1])],4,'#2b2b3a',0); // 腰帶
  leg(hipF,kF,J.fF,false);
  // 頭
  const h=J.head; seg(ctx,[add(J.sh,[0,-2]),h],6,SKIN,ow);
  if(o.hair===2&&!fr) seg(ctx,[add(h,[-7,-2]),add(h,[-12,8])],4.5,'#5a2a14',ow);
  ctx.fillStyle=INK; ctx.beginPath(); ctx.arc(h[0],h[1],9.6+ow,0,7); ctx.fill(); ctx.fillStyle=SKIN; ctx.beginPath(); ctx.arc(h[0],h[1],9.6,0,7); ctx.fill();
  const ca=o.up?-.5:0; ctx.save(); ctx.translate(h[0],h[1]); ctx.rotate(fr?0:ca);
  if(fr){ ctx.fillStyle=INK; ctx.fillRect(-4.5,-.5,2.2,2.6); ctx.fillRect(2.3,-.5,2.2,2.6); ctx.fillStyle='#a8483a'; ctx.fillRect(-2,5,4,1.4); }
  else { ctx.fillStyle=INK; ctx.fillRect(4,-1,2,2.6); ctx.fillStyle=SKD; ctx.beginPath(); ctx.arc(-1.5,1.5,2.2,0,7); ctx.fill(); ctx.fillStyle='#a8483a'; ctx.fillRect(4.5,5,3,1.2); }
  // 帽子／頭盔
  ctx.fillStyle=o.helmet?mix(col,'#000000',.15):col; ctx.strokeStyle=INK; ctx.lineWidth=ow;
  ctx.beginPath(); ctx.arc(0,-1,o.helmet?10.8:10.2,Math.PI,0); if(o.helmet&&!fr){ ctx.lineTo(10.8,1); ctx.lineTo(-4,1); ctx.lineTo(-6,7); ctx.lineTo(-10.8,5); } ctx.closePath(); ctx.fill(); ctx.stroke();
  if(o.helmet){ ctx.fillStyle='rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(fr?-3:-2,-7,4,1.8,-.3,0,7); ctx.fill(); }
  ctx.fillStyle=o.helmet?mix(col,'#000000',.15):col;
  if(fr){ ctx.beginPath(); ctx.ellipse(0,-1,11.5,3,0,0,7); ctx.fill(); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(6,-2.6); ctx.lineTo(16,-1.2); ctx.lineTo(15.5,.8); ctx.lineTo(6,.4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  arm(shF,eF,J.hF,false); hand(J.hF,'F'); if(fr) hand(J.hB,'B');
  ctx.restore();
}
// 關鍵影格內插：frames=[[p,{hip,sh,head,fB,fF,hB,hF,…數字}],…]
/* 啦啦隊員（正面）：x,y 腳底，s 大小，col 隊服顏色，ph 舞步，big 大動作（踢腿、雙手高舉） */
function cheerGirl(ctx,x,y,s,col,ph,big,k){ const hair=['#3a2418','#7a4a22','#1e1e2a','#c8903a'][k%4],skin='#ffd9b8',INK2='#2a1a26';
  const b=Math.sin(ph),c2=Math.cos(ph),hop=big?Math.max(0,b)*7:Math.max(0,b)*2.5;
  ctx.save(); ctx.translate(x,y-hop*s); ctx.scale(s,s); ctx.lineCap='round'; ctx.lineJoin='round';
  const ln=(pts,w,cl)=>{ ctx.strokeStyle=INK2; ctx.lineWidth=w+2; ctx.beginPath(); pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.stroke(); ctx.strokeStyle=cl; ctx.lineWidth=w; ctx.stroke(); };
  const pom=(px,py)=>{ for(let i=0;i<9;i++){ const a=i/9*Math.PI*2+ph*2; ctx.fillStyle=i%2?'#fff':col; ctx.beginPath(); ctx.arc(px+Math.cos(a)*4.2,py+Math.sin(a)*4.2,3.2,0,7); ctx.fill(); } ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.arc(px,py,2.6,0,7); ctx.fill(); };
  // 腳：大動作時輪流高踢
  const kick=big?Math.max(0,c2):Math.max(0,c2)*.25,kick2=big?Math.max(0,-c2):Math.max(0,-c2)*.25;
  ln([[-3,-16],[-4-kick2*6,-8+kick2*-6],[-4-kick2*14,0-kick2*12]],3.4,skin); ln([[3,-16],[4+kick*6,-8-kick*6],[4+kick*14,0-kick*12]],3.4,skin);
  for(const [fx,fy] of [[-4-kick2*14,0-kick2*12],[4+kick*14,0-kick*12]]){ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(fx,fy,3,2,0,0,7); ctx.fill(); ctx.strokeStyle=INK2; ctx.lineWidth=1; ctx.stroke(); }
  // 裙子、上衣
  ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(-6,-22); ctx.lineTo(6,-22); ctx.lineTo(9+b*1.5,-14); ctx.lineTo(-9+b*1.5,-14); ctx.closePath(); ctx.fill(); ctx.strokeStyle=INK2; ctx.lineWidth=1.2; ctx.stroke();
  ctx.fillStyle='#fff'; for(let i=-2;i<=2;i++) ctx.fillRect(i*3.4-.6+b*.8,-17,1.2,3);
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(-5.5,-34); ctx.lineTo(5.5,-34); ctx.lineTo(6,-22); ctx.lineTo(-6,-22); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(-5.5,-34); ctx.lineTo(0,-28); ctx.lineTo(5.5,-34); ctx.closePath(); ctx.fill();
  // 手：小動作左右搖，大動作高舉成 V 字
  const ra=big?-2.4+Math.sin(ph*2)*.25:-1.2+b*.9,la=big?-0.75-Math.sin(ph*2)*.25:-1.9-b*.9;
  const arm=(sx,a)=>{ const ex=sx*5+Math.cos(a)*7*sx,ey=-32+Math.sin(a)*7,hx=ex+Math.cos(a)*6*sx,hy=ey+Math.sin(a)*6; ln([[sx*5,-32],[ex,ey],[hx,hy]],2.8,skin); pom(hx,hy); };
  arm(-1,Math.PI+la-Math.PI); arm(1,ra);
  // 頭、馬尾、蝴蝶結
  const sw=Math.sin(ph*2)*3; ln([[0,-46],[6+sw,-42],[8+sw,-34]],4,hair);
  ctx.fillStyle=skin; ctx.beginPath(); ctx.arc(0,-41,6.5,0,7); ctx.fill(); ctx.strokeStyle=INK2; ctx.lineWidth=1.2; ctx.stroke();
  ctx.fillStyle=hair; ctx.beginPath(); ctx.arc(0,-43,6.7,Math.PI*1.05,Math.PI*1.95); ctx.fill();
  ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(4,-47); ctx.lineTo(8,-50); ctx.lineTo(8,-45); ctx.closePath(); ctx.fill();
  ctx.fillStyle=INK2; ctx.fillRect(-3,-41,1.4,1.8); ctx.fillRect(1.6,-41,1.4,1.8); ctx.strokeStyle=INK2; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(0,-38.5,1.8,.2,Math.PI-.2); ctx.stroke();
  ctx.fillStyle='rgba(255,120,150,.5)'; ctx.beginPath(); ctx.arc(-4,-38.5,1.4,0,7); ctx.arc(4,-38.5,1.4,0,7); ctx.fill();
  ctx.restore(); }
function kf(frames,p){
  let i=0; while(i<frames.length-2&&p>frames[i+1][0]) i++;
  const A=frames[i],B=frames[i+1],k=clamp((p-A[0])/(B[0]-A[0]||1),0,1),s=k*k*(3-2*k),J={};
  for(const n in A[1]) J[n]=Array.isArray(A[1][n])?lp(A[1][n],B[1][n],s):lerp(A[1][n],B[1][n],s); return J;
}
// 打者（右打，從捕手後面看）：p<0 準備（-1 站好、0 跨步完成），0~1 揮棒（.32 擊球點）
const BK=[
  [-1,{hip:[-1,-45],sh:[2,-73],head:[7,-86],fB:[-17,0],fF:[14,0],h:[-9,-75],a:-2.25,e:.95,tw:0}],
  [0,{hip:[-4,-46],sh:[-1,-74],head:[5,-86],fB:[-17,0],fF:[9,-8],h:[-14,-77],a:-2.4,e:1.0,tw:-.2}],
  [.16,{hip:[1,-44],sh:[3,-72],head:[6,-85],fB:[-17,0],fF:[21,0],h:[-6,-68],a:-2.85,e:.3,tw:.2}],
  [.32,{hip:[5,-44],sh:[7,-71],head:[8,-84],fB:[-15,-3],fF:[22,0],h:[13,-61],a:.05,e:-.1,tw:.6}],
  [.5,{hip:[6,-45],sh:[8,-72],head:[8,-85],fB:[-12,-6],fF:[22,0],h:[19,-66],a:1.3,e:.15,tw:.9}],
  [.75,{hip:[6,-46],sh:[7,-74],head:[8,-86],fB:[-9,-8],fF:[22,0],h:[12,-80],a:2.35,e:.55,tw:1}],
  [1,{hip:[5,-47],sh:[5,-75],head:[7,-87],fB:[-8,-8],fF:[22,0],h:[0,-82],a:2.95,e:.2,tw:1}]];
function batDir(a,e){ return [Math.cos(e)*Math.cos(a),-Math.sin(e)-Math.cos(e)*Math.sin(a)*.35]; }
function drawBat(ctx,knob,d,len,ow,alpha){
  const m=Math.hypot(d[0],d[1])||1,u=[d[0]/m,d[1]/m],n=[-u[1],u[0]],P=k=>add(knob,[d[0]*len*k,d[1]*len*k]),W=(p,w,sg)=>add(p,[n[0]*w*sg,n[1]*w*sg]);
  const p0=P(0),p1=P(.42),p2=P(.72),p3=P(1);
  ctx.save(); ctx.globalAlpha=alpha==null?1:alpha;
  ctx.beginPath(); [W(p0,1.3,1),W(p1,1.5,1),W(p2,2.9,1),W(p3,3,1)].forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));
  ctx.arc(p3[0],p3[1],3,Math.atan2(n[1],n[0]),Math.atan2(-n[1],-n[0]),true); [W(p2,2.9,-1),W(p1,1.5,-1),W(p0,1.3,-1)].forEach(q=>ctx.lineTo(q[0],q[1])); ctx.closePath();
  ctx.fillStyle=alpha!=null?'rgba(255,255,255,.9)':'#d9a865'; ctx.fill();
  if(alpha==null){ ctx.strokeStyle=INK; ctx.lineWidth=ow; ctx.stroke();
    ctx.strokeStyle='rgba(255,240,200,.75)'; ctx.lineWidth=1; ctx.beginPath(); const a=W(p1,.6,1),b=W(p3,1.4,1); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke();
    ctx.fillStyle='#2b2b3a'; ctx.beginPath(); ctx.arc(p0[0],p0[1],2.3,0,7); ctx.fill(); // 握把尾端
    ctx.strokeStyle='#2b2b3a'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(p0[0],p0[1]); const g=P(.2); ctx.lineTo(g[0],g[1]); ctx.stroke(); } // 握把布
  ctx.restore();
}
function drawBatter(ctx,x,y,sc,col,hair,p,aim){
  const J0=kf(BK,p),w=p>0&&p<.6?Math.sin(p/.6*Math.PI):0,h=add(J0.h,[0,(aim||0)*w]),d=batDir(J0.a,J0.e),ow=Math.max(.9,.75/sc);
  const J={hip:J0.hip,sh:J0.sh,head:J0.head,fB:J0.fB,fF:J0.fF,hF:h,hB:add(h,[d[0]*5,d[1]*5]),tw:J0.tw};
  fig(ctx,x,y,sc,1,J,col,{helmet:1,hair,fore:1});
  ctx.save(); ctx.translate(x,y); ctx.scale(sc,sc); ctx.lineCap='round';
  if(p>.05&&p<.62) for(let i=3;i>=1;i--){ const Q=kf(BK,p-i*.045),hq=add(Q.h,[0,(aim||0)*w]),dq=batDir(Q.a,Q.e); drawBat(ctx,add(hq,[-dq[0]*4,-dq[1]*4]),dq,46,ow,.12*(4-i)); }
  drawBat(ctx,add(h,[-d[0]*4,-d[1]*4]),d,46,ow);
  for(const q of [J.hB,J.hF]){ ctx.fillStyle=INK; ctx.beginPath(); ctx.arc(q[0],q[1],3.4+ow,0,7); ctx.fill(); ctx.fillStyle='#f4f4f8'; ctx.beginPath(); ctx.arc(q[0],q[1],3.4,0,7); ctx.fill(); } // 打擊手套
  ctx.restore();
}
// 投手（正面）：p 0 準備、.3 抬腿、.55 拉臂、.8 出手、1 收尾
const PK=[
  [0,{hip:[0,-48],sh:[0,-74],head:[0,-87],fB:[-8,0],fF:[8,0],hB:[-2,-62],hF:[3,-62]}],
  [.3,{hip:[1,-51],sh:[0,-77],head:[0,-89],fB:[-5,0],fF:[9,-32],hB:[-2,-80],hF:[3,-80]}],
  [.55,{hip:[-2,-47],sh:[-2,-73],head:[-1,-86],fB:[-10,0],fF:[14,-3],hB:[-24,-86],hF:[17,-72]}],
  [.8,{hip:[0,-43],sh:[1,-65],head:[1,-77],fB:[-9,-7],fF:[11,2],hB:[-4,-50],hF:[12,-56]}],
  [1,{hip:[0,-46],sh:[0,-71],head:[0,-84],fB:[-8,-2],fF:[9,1],hB:[4,-54],hF:[8,-60]}]];
// 守備員與跑者（側面）
function pose(name,t){
  if(name==='run'){ const s=Math.sin(t*13); return {hip:[0,-47],sh:[6,-73],head:[9,-85],fB:[-14*s,-Math.max(0,s)*8],fF:[14*s,-Math.max(0,-s)*8],hB:[2-9*s,-56+4*s],hF:[6+9*s,-56-4*s]}; }
  if(name==='ready') return {hip:[-3,-40],sh:[6,-66],head:[10,-78],fB:[-14,0],fF:[13,0],hB:[11,-40],hF:[15,-43]};
  if(name==='catch') return {hip:[0,-48],sh:[2,-74],head:[3,-86],fB:[-7,0],fF:[7,0],hB:[6,-102],hF:[11,-100]};
  if(name==='throw') return {hip:[-1,-46],sh:[1,-72],head:[5,-84],fB:[-14,0],fF:[15,0],hB:[-20,-90],hF:[19,-68]};
  if(name==='hold') return {hip:[0,-48],sh:[2,-75],head:[4,-87],fB:[-7,0],fF:[7,0],hB:[9,-63],hF:[11,-66]};
  return {hip:[0,-48],sh:[1,-75],head:[2,-87],fB:[-6,0],fF:[6,0],hB:[-3,-50],hF:[5,-52]};
}

const CROWD=['#ff5d4f','#ffd23f','#3ddbd9','#ffffff','#ff7eb6','#86dc4f','#4f9dff','#ff9d3d'];
const mix=(a,b,k)=>{ const p=x=>parseInt(x.slice(1),16),A=p(a),B=p(b),f=s=>Math.round(((A>>s)&255)*(1-k)+((B>>s)&255)*k); return 'rgb('+f(16)+','+f(8)+','+f(0)+')'; };
function stadium(ctx,L,t){
  const night=L.bg==='night',sun=L.bg==='sunset',grass=L.grass||'#4c9a3c';
  // 天空
  let g=ctx.createLinearGradient(0,0,0,70); if(night){ g.addColorStop(0,'#05061c'); g.addColorStop(1,'#1d2056'); } else if(sun){ g.addColorStop(0,'#ff7a59'); g.addColorStop(1,'#ffd08a'); } else { g.addColorStop(0,'#4fb0f0'); g.addColorStop(1,'#bfe6ff'); }
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  if(night){ ctx.fillStyle='#fff'; for(let i=0;i<34;i++){ ctx.globalAlpha=.4+.6*Math.abs(Math.sin(t*1.3+i)); ctx.fillRect((i*97)%W,(i*31)%40,1.4,1.4); } ctx.globalAlpha=1; }
  else { ctx.fillStyle=sun?'rgba(255,230,200,.7)':'rgba(255,255,255,.85)'; for(let i=0;i<3;i++){ const x=((i*170+t*6)%(W+120))-60,y=12+i*9; ctx.beginPath(); ctx.ellipse(x,y,26,6,0,0,7); ctx.ellipse(x+16,y-4,16,6,0,0,7); ctx.fill(); } }
  // 照明燈塔
  for(const x of [34,446]){ ctx.fillStyle='#3a3f55'; ctx.fillRect(x-1.5,14,3,52); ctx.fillStyle=night?'#fffbe0':'#d8dde8'; ctx.fillRect(x-13,6,26,12); ctx.fillStyle=night?'#ffffff':'#9aa3b5'; for(let i=0;i<4;i++) for(let j=0;j<2;j++) ctx.fillRect(x-11+i*6,8+j*5,4,3);
    if(night){ const r=ctx.createRadialGradient(x,12,2,x,12,70); r.addColorStop(0,'rgba(255,250,210,.55)'); r.addColorStop(1,'rgba(255,250,210,0)'); ctx.fillStyle=r; ctx.fillRect(x-70,0,140,90); } }
  // 上層看台（弧形）
  const arc=(x,base,k)=>base+Math.pow((x-W/2)/(W/2),2)*k;
  ctx.fillStyle=night?'#262a4a':'#5b6178'; ctx.beginPath(); ctx.moveTo(0,arc(0,40,-6)); for(let x=0;x<=W;x+=20) ctx.lineTo(x,arc(x,40,-6)); ctx.lineTo(W,72); ctx.lineTo(0,72); ctx.fill();
  ctx.fillStyle=night?'#14162e':'#3b3f52'; ctx.beginPath(); for(let x=0;x<=W;x+=20) ctx.lineTo(x,arc(x,38,-6)); ctx.lineTo(W,arc(W,42,-6)); for(let x=W;x>=0;x-=20) ctx.lineTo(x,arc(x,42,-6)); ctx.fill(); // 屋簷
  for(let r=0;r<3;r++) for(let i=0;i<60;i++){ const x=i*8+(r%2)*4,y=arc(x,46+r*8,-6)+Math.sin(t*5+i*1.3+r)*.8; ctx.fillStyle=CROWD[(i*7+r*3)%8]; ctx.globalAlpha=night?.75:.9; ctx.fillRect(x,y,5,5); } ctx.globalAlpha=1;
  // 中外野計分板
  ctx.fillStyle='#16182a'; ctx.fillRect(186,10,108,52); ctx.fillStyle='#2b2f4a'; ctx.fillRect(190,14,100,44); ctx.fillStyle='#0b0c18'; ctx.fillRect(194,18,92,22);
  ctx.font='7px '+PIX; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#ffd23f'; ctx.fillText('1 2 3 4 5 6 7 8 9',240,25); ctx.fillStyle='#86dc4f'; ctx.fillText('0 0 1 0 2 0 0 0 0',240,34);
  ctx.fillStyle='#ff5d4f'; for(let i=0;i<3;i++){ ctx.globalAlpha=.4+.6*((Math.floor(t*2)+i)%3===0?1:0); ctx.beginPath(); ctx.arc(214+i*26,49,3,0,7); ctx.fill(); } ctx.globalAlpha=1; ctx.fillStyle='#3a3f55'; ctx.fillRect(236,62,8,10);
  // 下層看台
  ctx.fillStyle=night?'#2a2d52':'#6a7090'; ctx.fillRect(0,72,W,28);
  for(let r=0;r<3;r++) for(let i=0;i<68;i++){ const x=i*7+(r%2)*3.5,wave=Math.max(0,Math.sin(t*2.2-i*.18))>.97?3:0; ctx.fillStyle=CROWD[(i*5+r*2)%8]; ctx.globalAlpha=night?.75:.95; ctx.fillRect(x,75+r*8-wave+Math.sin(t*6+i+r)*.6,5,6); } ctx.globalAlpha=1;
  // 全壘打牆＋廣告看板
  ctx.fillStyle='#1f5a3a'; ctx.fillRect(0,99,W,12); ctx.fillStyle='#ffd23f'; ctx.fillRect(0,98,W,1.5);
  const ads=[['ARCADE','#ff5d4f'],['GO!','#3d8bff'],['COLA','#e23b3b'],['RETRO','#ffd23f'],['HOME RUN','#86dc4f'],['★★★','#ff7eb6']];
  ctx.font='6px '+PIX; ads.forEach((a,i)=>{ const x=6+i*80; ctx.fillStyle='#0f2e1f'; ctx.fillRect(x,101,58,8); ctx.fillStyle=a[1]; ctx.fillText(a[0],x+29,105.5); });
  ctx.fillStyle='#fff'; ctx.font='6px '+PIX; ctx.fillText('400',240,105.5);
  // 界外標竿
  ctx.fillStyle='#ffd23f'; for(const x of [14,466]){ ctx.fillRect(x-1,36,2.4,76); ctx.fillRect(x+(x<W/2?1:-5),40,4,22); }
  // 警告區、草地條紋
  ctx.fillStyle='#b9824a'; ctx.fillRect(0,111,W,5);
  const gl=night?mix(grass,'#0b1030',.35):sun?mix(grass,'#ff9a50',.12):grass,gd=mix(gl.startsWith('#')?gl:grass,'#000000',.12);
  ctx.fillStyle=gl; ctx.fillRect(0,116,W,H-116);
  for(let k=0;k<12;k+=2){ const y0=116+(H-116)*Math.pow(k/12,1.7),y1=116+(H-116)*Math.pow((k+1)/12,1.7); ctx.fillStyle='rgba(0,0,0,.07)'; ctx.fillRect(0,y0,W,y1-y0); }
  // 內野紅土與草皮
  const dirt=night?'#8a6440':'#c8924a';
  ctx.fillStyle=dirt; ctx.beginPath(); ctx.moveTo(26,212); ctx.quadraticCurveTo(240,96,454,212); ctx.lineTo(380,236); ctx.lineTo(100,236); ctx.fill();
  ctx.fillStyle=gl; ctx.beginPath(); ctx.moveTo(240,140); ctx.lineTo(356,178); ctx.lineTo(240,236); ctx.lineTo(124,178); ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.06)'; ctx.beginPath(); ctx.moveTo(240,160); ctx.lineTo(320,184); ctx.lineTo(240,230); ctx.lineTo(160,184); ctx.fill();
  // 界外線與壘包
  ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(240,282); ctx.lineTo(-30,170); ctx.moveTo(240,282); ctx.lineTo(510,170); ctx.stroke();
  ctx.fillStyle='#fff'; for(const [x,y,r] of [[240,134,3],[372,178,4],[108,178,4]]){ ctx.save(); ctx.translate(x,y); ctx.scale(1,.5); ctx.rotate(Math.PI/4); ctx.fillRect(-r,-r,r*2,r*2); ctx.restore(); }
  // 投手丘
  ctx.fillStyle=mix(dirt.startsWith('#')?dirt:'#c8924a','#ffffff',.08); ctx.beginPath(); ctx.ellipse(W/2,151,36,9,0,0,7); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillRect(W/2-5,147,10,2);
  // 本壘附近的紅土、打擊區
  ctx.fillStyle=dirt; ctx.beginPath(); ctx.ellipse(W/2,284,96,30,0,0,7); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=1.5; ctx.strokeRect(180,256,34,34); ctx.strokeRect(266,256,34,34);
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(222,268); ctx.lineTo(258,268); ctx.lineTo(258,278); ctx.lineTo(240,288); ctx.lineTo(222,278); ctx.fill();
  if(sun){ ctx.fillStyle='rgba(255,140,60,.10)'; ctx.fillRect(0,0,W,H); }
}

function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,two=!net&&opts.mode==='2p',vs=two||(!!net&&net.count>1),F=opts.first===1; let me=net?(vs?Math.min(1,net.me):1):1; if(F) me=1-me; // F：擲硬幣後換成第 1 方先攻
  const DERBY=opts.mode==='derby'&&!net; /* 全壘打大賽：只有自己打擊，在選好的球數裡打越多支全壘打越好（沒揮棒不算） */
  let dHR=0,dOut=0,dBest=0,dLast=0; const DOUTS=[10,20,30].includes(+((opts.options||{}).balls))?+opts.options.balls:10;
  const N=+(opts.variant||3)||3,si=opts.stage||0,foe=STAGES[si],lv=vs?.6:foe.lv,L=opts.look||{color:'#ff5d4f',hair:'1',grass:'#4c9a3c',bg:'stadium'};
  const {ctx}=env.canvas2d(W,H);
  // 單人：你是主隊（後攻），電腦是客隊。雙人：左邊 WASD 是客隊、右邊方向鍵是主隊。連線：房主客隊、加入者主隊。
  const lookOf=tm=>net&&net.looks?net.looks[tm===0?0:1]:null;
  const cols=vs?[(lookOf(0)||{}).color||'#3d8bff',(lookOf(1)||L).color||L.color]:[foe.col,L.color]; if(cols[0]===cols[1]) cols[0]=cols[1]==='#3d8bff'?'#ffd23f':'#3d8bff';
  const tname=net&&net.names?[net.names[0]||'客隊',net.names[1]||(vs?'主隊':foe.name)]:vs?['1P 隊','2P 隊']:[foe.name,opts.name||'你的隊伍'];
  if(net&&!vs){ tname[0]=foe.name; tname[1]=net.names&&net.names[0]||'你'; }
  const ctl0=tm=>net?(client?(tm===1?'k0':'net'):(vs?(tm===0?'k0':'net'):(tm===1?'k0':'ai'))):two?(tm===0?'k1':'k2'):(tm===1?'k0':'ai'),ctl=tm=>ctl0(F?1-tm:tm);
  const mkTeam=(names,k)=>names.map((n,i)=>({name:n,con:k*(.9+((i*7)%5)*.05),pow:k*(.85+((i*3)%5)*.08),spd:25+((i*5)%4)*1.3}));
  const cpuK=.75+lv*.4,teams=vs?[mkTeam(foe.names||AWAYN,1),mkTeam(HOMEN,1)]:[mkTeam(foe.names||AWAYN,cpuK),mkTeam(HOMEN,1)];
  if(F){ cols.reverse(); tname.reverse(); teams.reverse(); } // 先攻的一方當客隊
  // 共用的顯示狀態：房主算出來，連線時整包傳給另一邊
  const S={inn:1,half:0,outs:0,b:0,s:0,sc:[0,0],bases:[0,0,0],phase:'sel',bat:0,ord:[0,0],line:[[],[]],pit:null,last:'',ban:'',banT:0,fld:null,swing:0,hits:[0,0]};
  const CON=.9; let cheerT=0,conT=0,pendHit=null,swDone=false,prevF=[],prevR=[],pRep=0,pDir='',trail=[],trailMax=0,catchT=0,t=0,ended=false,selT=0,tx=0,ty=0,ptype=0,cx=0,cy=0,swung=null,pitT=0,resT=0,pend=null,fl=null,runners=[],ev=[],sendT=0,remoteSw=undefined,remotePc=null,sentSw=false,fx=[];
  const sfx=n=>{ env.sfx(n); if(net&&net.host) ev.push(n); };
  const banner=(s,sec)=>{ S.ban=s; S.banT=sec||1.3; };
  const batTeam=()=>S.half,fldTeam=()=>1-S.half,batter=()=>teams[S.half][S.ord[S.half]%9];
  const mine=tm=>{ const c=ctl(tm); return c!=='ai'&&c!=='net'; };

  /* ---- 輸入 ---- */
  function keys(c){
    const K=env.keys,Sx=c==='k1'?['KeyW','KeyS','KeyA','KeyD','KeyF','KeyG']:c==='k2'?['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Comma','Period']:null;
    if(Sx) return {mx:(K[Sx[3]]?1:0)-(K[Sx[2]]?1:0),my:(K[Sx[0]]?1:0)-(K[Sx[1]]?1:0),a:env.hit(Sx[4]),b:env.hit(Sx[5]),up:env.hit(Sx[0]),dn:env.hit(Sx[1])};
    return {mx:(K.ArrowRight||K.KeyD?1:0)-(K.ArrowLeft||K.KeyA?1:0),my:(K.ArrowUp||K.KeyW?1:0)-(K.ArrowDown||K.KeyS?1:0),a:env.hit('KeyJ')||env.hit('Space')||env.hit('Enter'),b:env.hit('KeyK'),up:env.hit('ArrowUp')||env.hit('KeyW'),dn:env.hit('ArrowDown')||env.hit('KeyS')};
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
      swung=go?{dt:gauss()*(.075-.035*lv)/b.con,up:rnd()<.3+lv*.25?1:0,at:p.T}:null; }
  }
  function dOutBy(txt){ dOut++; sfx('bump'); banner(txt+'　剩 '+(DOUTS-dOut)+' 球',1.3); endBat(); }
  function resolve(sw){ // 這一球的結果：時機準不準＋對方投的位置和球種，決定擊球品質
    const p=S.pit,b=batter(),inZ=Math.abs(p.ax)<=1&&Math.abs(p.ay)<=1;
    if(DERBY&&!sw){ banner('沒揮棒（不算出局）',.8); nextPitch(.8); return; }
    if(!sw){ if(inZ) strike('好球！'); else ball(); return; }
    const WIN=DERBY?.2:.16,q0=PITCH[p.type],edge=Math.max(Math.abs(p.ax),Math.abs(p.ay));
    const locP=Math.max(0,Math.min(edge,1)-.45)*.3+Math.max(0,edge-1)*.85,brk=Math.hypot(q0.bx,q0.by)*.07;
    const q=1-Math.abs(sw.dt)/WIN*.75-locP-brk+(b.con-1)*.25+gauss()*.04+(DERBY?.05:0);
    if(Math.abs(sw.dt)>WIN||q<=.05){ if(DERBY){ dOutBy('揮棒落空'); return; } strike('揮棒落空！',true); return; }
    let sa=sw.dt/WIN*36+gauss()*8;
    if(q>.7){ const gaps=[-40,-16,16,40],g=gaps.reduce((a,c)=>Math.abs(c-sa)<Math.abs(a-sa)?c:a); sa+=(g-sa)*Math.min(1,(q-.7)/.3)*.6; } // 打得好，比較容易打到空檔
    let la,evo;
    if(sw.up){ if(q>=.5){ la=24+(.8-Math.min(q,.8))*60+gauss()*3; evo=60+56*q*b.pow; } else { la=46+rnd()*20; evo=55+40*q; } } // ↑：高飛球，打越準飛越遠
    else { la=-6+q*22+gauss()*3; evo=60+50*q*b.pow; } // ↓：平飛球或滾地球
    evo=clamp(evo+gauss()*2.5+(DERBY?5:0),45,DERBY?122:118);
    if(q<.18||Math.abs(sa)>45){ if(DERBY){ dOutBy('界外'); return; } sfx('land'); if(S.s<2) S.s++; banner('界外',.9); nextPitch(1); return; }
    sfx('boom'); const hr=willHR(evo,la,sa); S.hit=[Math.round(evo),Math.round(la),Math.round(sa),+p.ax.toFixed(2),+p.ay.toFixed(2),q>.75||hr?1:0,hr?1:0]; if(hr){ sfx('win'); cheerT=2.6+CON; } S.phase='contact'; conT=0; pendHit=[evo,la,sa];
  }
  function launchHit(){ const [evo,la,sa]=pendHit; pendHit=null;
    if(DERBY){ /* 全壘打大賽：不切守備和跑壘畫面，打完直接下一球 */ const d=carry(evo,la); dLast=d;
      if(willHR(evo,la,sa)){ dHR++; dOut++; dBest=Math.max(dBest,d); banner('全壘打！！ '+d+' 呎　剩 '+(DOUTS-dOut)+' 球',1.6); S.phase='result'; endBat(); }
      else dOutBy(la<6?'滾地球':la<20?'平飛球 '+d+' 呎':'高飛球 '+d+' 呎'); return; }
    startField(evo,la,sa);
  }
  function strike(txt,sw){ S.s++; sfx(sw?'bump':'click'); if(S.s>=3){ banner('三振出局！',1.3); out(1); endBat(); } else { banner(txt,.9); nextPitch(1); } }
  function ball(){ S.b++; if(S.b>=4){ banner('四壞球保送',1.3); walk(); endBat(); } else { banner('壞球',.8); nextPitch(.9); } }
  function nextPitch(d){ S.phase='result'; resT=d; pend='pitch'; }
  function endBat(){ S.phase='result'; resT=1.4; pend='bat'; }
  function out(n){ S.outs+=n; }
  function addRun(n){ if(n<=0) return; cheerT=Math.max(cheerT,2.4); S.sc[S.half]+=n; S.line[S.half][S.inn-1]=(S.line[S.half][S.inn-1]||0)+n; sfx('win'); for(let i=0;i<30;i++){ const a=rnd()*6.283,v=80+rnd()*160; fx.push({x:W/2,y:120,vx:Math.cos(a)*v,vy:Math.sin(a)*v-50,life:1,col:['#ffd23f','#ff5d8f','#3ddbd9','#fff'][i%4]}); } }
  function walk(){ const bs=S.bases; if(bs[0]){ if(bs[1]){ if(bs[2]) addRun(1); bs[2]=bs[1]; } bs[1]=bs[0]; } bs[0]=S.ord[S.half]%9+1; }
  function afterBat(){
    S.ord[S.half]++; S.b=0; S.s=0;
    if(DERBY){ S.bases=[0,0,0]; S.outs=0; if(dOut>=DOUTS){ finish(); return; } beginSel(); return; }
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
    if(DERBY){ let old=null; try{ old=JSON.parse(localStorage.getItem('arcade.baseball.derby.'+DOUTS)||'null'); }catch(e){} const rec=dHR>0&&(!old||dHR>old.hr||dHR===old.hr&&dBest>old.d); if(rec) try{ localStorage.setItem('arcade.baseball.derby.'+DOUTS,JSON.stringify({hr:dHR,d:dBest})); }catch(e){}
      env.sfx(dHR?'win':'lose'); env.end({title:'全壘打大賽結束',big:dHR+' 支全壘打',text:DOUTS+' 球打了 '+dHR+' 支全壘打。'+(dBest?'最遠一支 '+dBest+' 呎。':'')+(rec?'新紀錄！':old?'最佳紀錄 '+old.hr+' 支（最遠 '+old.d+' 呎）。':'')+'按 ↑ 打高飛球，時機抓準就容易飛出牆外。',score:null}); return; }
    const w=S.sc[0]===S.sc[1]?-1:S.sc[0]>S.sc[1]?0:1,win=two||w===me;
    if(net&&net.host){ net.send(snap()); net.send({end:1}); }
    conclude(w,win);
  }
  function conclude(w,win){
    ended=true; env.sfx(w<0?'lose':win?'win':'lose');
    const n=Math.max(S.inn,S.line[0].length),row=tm=>'<tr><th>'+tname[tm]+'</th>'+Array.from({length:n},(_,i)=>'<td>'+(S.line[tm][i]==null?(tm===1&&i===n-1?'X':'-'):S.line[tm][i])+'</td>').join('')+'<td><b>'+S.sc[tm]+'</b></td><td>'+S.hits[tm]+'</td></tr>';
    env.end({title:w<0?'平手':two?tname[w]+' 獲勝':win?'你贏了！':'你輸了',big:S.sc[0]+' : '+S.sc[1],
      html:'<table class="ls"><tr><th></th>'+Array.from({length:n},(_,i)=>'<td>'+(i+1)+'</td>').join('')+'<td>分</td><td>安</td></tr>'+row(0)+row(1)+'</table>',
      text:w<0?'延長賽也沒有分出勝負。':'',score:!vs&&!net&&w===me?si+1:null,next:!vs&&!net&&w===me&&si<STAGES.length-1});
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
    else if(!fly||S.outs>=2||bt<=1.5){ /* 平飛球被接到的話，已經起跑的跑者要折返（可能被雙殺） */ let f=true; for(let k=1;k<=3;k++){ const r=runners.find(q=>!q.bat&&q.from===k); if(r){ r.forced=f; if(!f&&!fly&&S.outs<2&&best&&best.i<6&&bt<1.3) continue; r.target=k+1; r.state='run'; if(fly) r.wait=.45; } else f=false; } } // 沒被迫進壘的跑者，內野滾地球時先不跑；平飛球先停一下看球
    S.bases=[0,0,0];
    fl={path,bi,bt,F,best,fly,hr,t:0,mode:'path',holder:null,hold:0,thr:null,cover,runs:0,lastForce:false,dead:0,bx:0,by:0,bz:3,catchD:best?Math.hypot(path[bi][1],path[bi][2]):0,br,msg:false};
    S.phase='field'; banner(hr?'全壘打！！':la<6?'滾地球':la<20?'平飛球':la<48?(landT!=null&&Math.hypot(path[path.length-1][1],path[path.length-1][2])>200?'外野高飛球':'高飛球'):'內野高飛球',hr?2:1.1); if(hr){ sfx('win'); }
  }
  function willHR(evo,la,sa){ const v0=evo*1.467,a=la*Math.PI/180,th=sa*Math.PI/180; let vh=v0*Math.cos(a),vz=v0*Math.sin(a),r=1,z=3;
    for(let k=0;k<450;k++){ vh*=Math.exp(-.2*.02); vz-=32*.02; z+=vz*.02; r+=vh*.02; if(z<=0) return false; if(r>=fence(th)) return z>10; } return false; }
  function carry(evo,la){ const v0=evo*1.467,a=la*Math.PI/180; let vh=v0*Math.cos(a),vz=v0*Math.sin(a),r=1,z=3; for(let k=0;k<600;k++){ vh*=Math.exp(-.2*.02); vz-=32*.02; z+=vz*.02; r+=vh*.02; if(z<=0) break; } return Math.round(r); }
  const THR=118; // 傳球速度（呎／秒）
  function decideThrow(){ // 拿到球的人看場上狀況決定傳哪個壘
    const h=fl.holder,run=runners.filter(r=>r.state==='run');
    if(!run.length){ fl.dead+=.016; return; }
    const opt=run.map(r=>{ const bp=basePos(r.target),d=Math.hypot(h.x-bp[0],h.y-bp[1]),left=Math.abs(r.target-r.prog)*90/r.spd; return {r,d,m:left-(d<5?0:.08+d/THR)}; });
    for(const o of opt) if(o.d<5&&o.m>0){ tagOut(o.r); return; } // 自己踩壘
    const ok=opt.filter(o=>o.m>.06),best=a=>a.reduce((x,y)=>y.m>x.m?y:x);
    let pick=null;
    if(ok.length){
      if(S.outs>=2) pick=best(ok); // 兩出局：抓最穩的那個就好
      else { const home=ok.find(o=>o.r.target>=4),lead=ok.reduce((x,y)=>y.r.target>x.r.target?y:x);
        pick=home&&home.m>.12?home:lead.m>.18?lead:best(ok); } // 先擋分，再抓前面的跑者（之後還有機會雙殺）
    }
    if(!pick){ const lead=opt.reduce((x,y)=>y.r.target>x.r.target?y:x); if(lead.d<40){ fl.hold=.2; return; } pick=lead; } // 抓不到人：傳到最前面跑者要去的壘擋住他
    fl.mode='throw'; fl.thr={fx:h.x,fy:h.y,base:pick.r.target,t:0,T:Math.max(.15,pick.d/THR)}; fl.holder=null; sfx('place');
    if(S.banT<=.3) banner('傳'+['本壘','一壘','二壘','三壘'][pick.r.target%4]+'！',.6);
  }
  function tagOut(r){ r.state='out'; r.back=false; out(1); fl.lastForce=!!r.forced; fl.outsN=(fl.outsN||0)+1; banner(fl.outsN>=3?'三殺！！！':fl.outsN===2?'雙殺！！':'出局！',1.2); sfx('hurt'); fl.hold=.22; }
  function stepField(dt){
    const f=fl; f.t+=dt;
    for(const q of f.F){ const dx=q.tx-q.x,dy=q.ty-q.y,d=Math.hypot(dx,dy); if(d>.5){ const m=Math.min(d,q.spd*dt); q.x+=dx/d*m; q.y+=dy/d*m; } }
    if(f.mode==='path'){
      const p=f.path; let k=Math.min(p.length-1,Math.floor(f.t/.02)); f.bx=p[k][1]; f.by=p[k][2]; f.bz=p[k][3];
      if(f.hr){ if(f.t>p[p.length-1][0]+.3) f.mode='gone'; }
      else if(f.t>=f.bt){ // 守備員拿到球
        f.best.x=f.best.tx; f.best.y=f.best.ty; f.holder=f.best; f.mode='held'; f.hold=f.fly?.4:.36; f.bx=f.best.x; f.by=f.best.y; f.bz=4; sfx('item');
        if(f.fly){ f.br.state='out'; out(1); f.lastForce=true; f.outsN=1; banner(f.catchD>150?'高飛接殺！':'接殺！',1.1); f.hold=.2;
          if(S.outs<3) for(const r of runners){
            if(r.state==='run'&&!r.bat){ r.back=true; r.target=r.from; r.forced=true; continue; } // 平飛球被接：跑者要折返原壘
            if(r.state!=='on') continue; if(r.from===3&&f.catchD>200){ r.target=4; r.state='run'; } else if(r.from===2&&f.catchD>285){ r.target=3; r.state='run'; } } } // 回壘待跑
      }
    } else if(f.mode==='held'){
      f.bx=f.holder.x; f.by=f.holder.y; f.bz=4; f.hold-=dt; if(f.hold<=0) decideThrow();
    } else if(f.mode==='throw'){
      const th=f.thr,bp=basePos(th.base); th.t+=dt; const u=Math.min(1,th.t/th.T); f.bx=th.fx+(bp[0]-th.fx)*u; f.by=th.fy+(bp[1]-th.fy)*u; f.bz=5+Math.sin(u*Math.PI)*8;
      if(u>=1){ const c=f.F[f.cover[th.base%4]]; c.x=bp[0]; c.y=bp[1]; c.tx=bp[0]; c.ty=bp[1]; f.holder=c; f.mode='held'; f.hold=.24; sfx('land');
        for(const r of runners) if(r.state==='run'&&r.target===th.base&&Math.abs(r.prog-r.target)>.015){ tagOut(r); break; } }
    }
    // 跑壘
    for(const r of runners.slice().sort((a,b)=>b.prog-a.prog)){
      if(r.state!=='run') continue;
      if(r.wait>0){ r.wait-=dt; continue; }
      if(r.back){ r.prog=Math.max(r.target,r.prog-r.spd/90*dt); if(r.prog<=r.target){ r.state='on'; r.back=false; } continue; }
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
    else if(f.outsN>=2) banner((f.outsN>=3?'三殺！！！':'雙殺！！')+(runs?'　得 '+runs+' 分':''),1.6);
    else if(runs) banner('得 '+runs+' 分',1.3);
    fl=null; endBat();
  }

  /* ---- 連線 ---- */
  function snap(){
    const m={s:[S.inn,S.half,S.outs,S.b,S.s,S.sc[0],S.sc[1],S.bases[0]?1:0,S.bases[1]?1:0,S.bases[2]?1:0,S.phase,S.ord[0],S.ord[1],S.ban,Math.round(S.banT*10)/10,S.last,S.swing,S.hits[0],S.hits[1]],l:S.line,e:ev};
    if(S.phase==='contact') m.h=S.hit;
    if(fl) m.f=[fl.F.map(q=>[Math.round(q.x),Math.round(q.y)]),runners.filter(r=>r.state==='run'||r.state==='on').map(r=>{ const p=rpos(r); return [Math.round(p[0]),Math.round(p[1])]; }),[Math.round(fl.bx),Math.round(fl.by),Math.round(fl.bz)]];
    ev=[]; return m;
  }
  if(net){
    if(client) net.onmsg=m=>{
      if(m.s){ const a=m.s,ph=S.phase; S.inn=a[0]; S.half=a[1]; S.outs=a[2]; S.b=a[3]; S.s=a[4]; S.sc=[a[5],a[6]]; S.bases=[a[7],a[8],a[9]]; S.phase=a[10]; S.ord=[a[11],a[12]]; S.ban=a[13]; S.banT=a[14]; S.last=a[15]; S.swing=a[16]; S.hits=[a[17],a[18]]; S.line=m.l;
        if(m.h) S.hit=m.h; if(S.phase==='contact'&&ph!=='contact'){ conT=0; if(S.hit&&S.hit[6]) cheerT=2.6+CON; }
        S.fld=m.f||null; if(S.phase==='sel'&&ph!=='sel'){ selT=0; tx=ty=0; cx=cy=0; sentSw=false; S.pit=null; }
        for(const n of m.e) env.sfx(n); }
      if(m.pit){ S.pit={type:m.pit[0],ax:m.pit[1],ay:m.pit[2],T:PITCH[m.pit[0]].T,kmh:m.pit[3]}; pitT=0; swung=null; sentSw=false; }
      if(m.end) conclude(S.sc[0]===S.sc[1]?-1:S.sc[0]>S.sc[1]?0:1,(S.sc[0]===S.sc[1]?-1:S.sc[0]>S.sc[1]?0:1)===me);
    };
    else {
      net.onmsg=(m,from)=>{ if(from!==1) return; if(m.pc) remotePc=m.pc; if(m.sw!==undefined) remoteSw=m.sw; };
      net.onleave=i=>{ if(i===1&&!ended&&vs){ const h=F?1:0; S.sc[h]=Math.max(S.sc[h],S.sc[1-h]+1); finish(); } };
    }
  }

  /* ---- 每一格 ---- */
  function pitcherUI(c,dt){ // 回傳 true 表示丟出去了
    const k=keys(c),d=k.mx+','+k.my; pRep-=dt;
    if((k.mx||k.my)&&(d!==pDir||pRep<=0)){ tx=clamp(Math.round((tx+k.mx*.7)/.7)*.7,-1.4,1.4); ty=clamp(Math.round((ty+k.my*.7)/.7)*.7,-1.4,1.4); pRep=d!==pDir?.3:.13; env.sfx('click'); }
    pDir=d;
    if(k.b){ ptype=(ptype+1)%PITCH.length; env.sfx('click'); }
    return k.a&&selT>.2;
  }
  function aimBat(dt){ // 球棒高度自動跟著球（只影響畫面）
    let gy=0;
    if(S.pit&&S.phase==='pitch'){ const q=PITCH[S.pit.type],u=Math.min(1,pitT/S.pit.T); gy=S.pit.ay-q.by*(1-u); }
    const f=Math.min(1,dt*10); cy+=(clamp(gy,-1.6,1.6)-cy)*f;
  }
  function batterUI(c,dt){ // 按一下 ↑ 揮高飛、↓ 揮平飛／滾地；判定點在按下後一點點（球棒碰到球的那一刻）
    const k=keys(c); aimBat(dt);
    if((k.up||k.dn)&&!swung&&S.pit&&S.phase==='pitch'){ swung={dt:pitT+.04-S.pit.T,up:k.up?1:0,at:pitT}; S.swing=SW; env.sfx('land'); return true; }
    return false;
  }
  function update(dt){
    t+=dt; if(S.banT>0) S.banT-=dt; if(S.swing>0) S.swing-=dt; if(cheerT>0) cheerT-=dt;
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.life-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=240*dt; if(f.life<=0) fx.splice(i,1); }
    if(client){ // 另一邊：只處理自己的投球選擇和揮棒
      selT+=dt; if(S.pit) pitT+=dt; if(S.phase==='contact') conT+=dt;
      if(S.phase==='sel'&&fldTeam()===me){ if(pitcherUI('k0',dt)){ net.send({pc:[ptype,tx,ty]}); selT=-9; } }
      if(S.phase==='pitch'&&batTeam()===me&&S.pit){ if(batterUI('k0',dt)){ net.send({sw:[swung.dt,swung.up]}); sentSw=true; } else if(!sentSw&&pitT>S.pit.T+.22){ net.send({sw:0}); sentSw=true; } }
      else aimBat(dt);
      return;
    }
    if(ended) return;
    if(S.phase==='sel'){
      selT+=dt; const c=ctl(fldTeam()),bc=ctl(batTeam());
      if(mine(batTeam())) aimBat(dt);
      if(c==='ai'&&DERBY){ if(selT>1.1){ throwPitch(0,(rnd()-.5)*.9,(rnd()-.5)*.9); S.pit.ax=clamp(S.pit.ax,-.7,.7); S.pit.ay=clamp(S.pit.ay,-.7,.7); S.pit.T=1.4; S.pit.kmh=96+Math.round(rnd()*10); S.last='餵球 '+S.pit.kmh+' km/h'; } }
      else if(c==='ai'){ if(selT>.9){ const zone=rnd()<.62+lv*.08,e=zone?.55+rnd()*.4:1.1+rnd()*.35; throwPitch(Math.floor(rnd()*PITCH.length),(rnd()<.5?-1:1)*e*(rnd()<.7?1:.3),(rnd()<.5?-1:1)*e*(rnd()<.7?1:.3)); } }
      else if(c==='net'){ if(remotePc){ throwPitch(clamp(remotePc[0]|0,0,5),clamp(+remotePc[1]||0,-1.7,1.7),clamp(+remotePc[2]||0,-1.7,1.7)); remotePc=null; } }
      else if(pitcherUI(c,dt)) throwPitch(ptype,tx,ty);
    } else if(S.phase==='pitch'){
      pitT+=dt; const bc=ctl(batTeam()),T=S.pit.T;
      if(mine(batTeam())) batterUI(bc,dt); else aimBat(dt);
      if(ctl(fldTeam())!=='ai'&&mine(fldTeam())){ /* 投手這時不用操作 */ }
      if(bc==='ai'&&swung&&pitT>=T+swung.dt-.06&&S.swing<=0&&!swung.shown){ swung.shown=true; S.swing=SW; }
      if(bc==='net'){ if(remoteSw!==undefined&&pitT>=T){ const sw=remoteSw?{dt:clamp(+remoteSw[0]||0,-1,1),up:remoteSw[1]?1:0}:null; if(sw) S.swing=SW; resolve(sw); } else if(pitT>T+1.2) resolve(null); }
      else if(swung&&Math.abs(swung.dt)<=(DERBY?.2:.16)&&pitT>=T+swung.dt||pitT>=T+.19) resolve(swung); /* 有打到：球棒碰到球的那一刻就判定，不用等球過本壘 */
    } else if(S.phase==='contact'){ conT+=dt; if(conT>=CON&&pendHit) launchHit();
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
    const hitU=S.phase==='contact'&&S.hit?Math.min(1,conT/CON):-1,shk=hitU>=0&&hitU<.3?(1-hitU/.3)*(S.hit[5]?7:4):0,sx0=(Math.random()-.5)*shk,sy0=(Math.random()-.5)*shk;
    ctx.save(); ctx.translate(sx0,sy0);
    stadium(ctx,L,t);
    const p=S.pit,u=p?pitT/p.T:0,fc=cols[fldTeam()],bc=cols[batTeam()];
    const pp=p?clamp(u/.24,0,1):0; fig(ctx,W/2,153,.42,1,kf(PK,pp),fc,{front:1,glove:'F',ball:pp<.78?'B':null});
    // 好球帶
    ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=2; ctx.strokeRect(ZX-ZW,ZY-ZH,ZW*2,ZH*2); ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=1;
    for(let i=1;i<3;i++){ ctx.beginPath(); ctx.moveTo(ZX-ZW+i*ZW*2/3,ZY-ZH); ctx.lineTo(ZX-ZW+i*ZW*2/3,ZY+ZH); ctx.moveTo(ZX-ZW,ZY-ZH+i*ZH*2/3); ctx.lineTo(ZX+ZW,ZY-ZH+i*ZH*2/3); ctx.stroke(); }
    // 打者與球棒
    if(S.phase==='sel') swDone=false;
    let bp=-1; if(S.swing>0){ const e=SW-S.swing; bp=e<.06?e/.06*.32:.32+(e-.06)/(SW-.06)*.68; swDone=true; } else if(swDone) bp=1; else if(p&&S.phase==='pitch') bp=-1+clamp(u/.6,0,1);
    if(hitU>=0&&S.swing<=0) bp=1; /* 擊中後：收棒姿勢 */
    drawBatter(ctx,BX,BY,BS,bc,0,bp,((ZY-cy*ZH)-(BY-57*BS))/BS);
    const showBat=mine(batTeam())||client&&batTeam()===me,showPit=(mine(fldTeam())||client&&fldTeam()===me)&&S.phase==='sel';
    if(showPit){ ctx.fillStyle='rgba(61,219,217,.12)'; for(let i=-2;i<=2;i++) for(let j=-2;j<=2;j++){ ctx.beginPath(); ctx.arc(ZX+i*.7*ZW,ZY-j*.7*ZH,2.5,0,7); ctx.fill(); }
      const inZ=Math.abs(tx)<=1&&Math.abs(ty)<=1; ctx.font='700 10px '+TC; ctx.textAlign='center'; ctx.fillStyle=inZ?'#5fff7a':'#ff9d9d'; ctx.fillText(inZ?'好球帶':'好球帶外',ZX,ZY+ZH+12);
      const x=ZX+tx*ZW,y=ZY-ty*ZH; ctx.strokeStyle='#3ddbd9'; ctx.lineWidth=2; ctx.strokeRect(x-7,y-7,14,14); ctx.beginPath(); ctx.moveTo(x-11,y); ctx.lineTo(x+11,y); ctx.moveTo(x,y-11); ctx.lineTo(x,y+11); ctx.stroke();
      ctx.fillStyle='rgba(11,10,28,.8)'; ctx.fillRect(W-118,118,112,PITCH.length*15+22); ctx.textAlign='left'; ctx.textBaseline='middle';
      PITCH.forEach((q,i)=>{ ctx.font=(i===ptype?'900 ':'700 ')+'11px '+TC; ctx.fillStyle=i===ptype?'#ffd23f':'#aaa4d8'; ctx.fillText((i===ptype?'▶ ':'　')+q.name,W-112,128+i*15); });
      ctx.font='700 9px '+TC; ctx.fillStyle='#6fd3ff'; ctx.fillText('換球種　丟球',W-112,128+PITCH.length*15+2); }
    // 球：一開始偏離位移量，越接近本壘越彎進去
    if(p&&S.phase==='pitch'){ const q=PITCH[p.type],uu=Math.min(1.15,u),fxp=ZX+p.ax*ZW,fyp=ZY-p.ay*ZH,bxp=q.bx*ZW,byp=-q.by*ZH,k=Math.min(1,uu);
      const x=W/2+(fxp-bxp-W/2)*k+bxp*k*k,y=128+(fyp-byp-128)*k+byp*k*k,r=2+7*Math.pow(k,1.6);
      ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x,160+110*k,r,r*.35,0,0,7); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill(); ctx.strokeStyle='#e23b3b'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(x,y,r*.7,t*20,t*20+2); ctx.stroke();
      if(showBat&&!swung&&u<1.1){ const ok=Math.abs(pitT+.04-p.T)<(DERBY?.13:.09); ctx.strokeStyle=ok?'#5fff7a':'rgba(255,210,63,.85)'; ctx.lineWidth=ok?3:2; ctx.beginPath(); ctx.arc(x,y,r+3+Math.max(0,1-uu)*46,0,7); ctx.stroke();
        if(ok){ ctx.font='900 14px '+TC; ctx.textAlign='center'; ctx.lineWidth=4; ctx.strokeStyle='#14122b'; ctx.strokeText('打！',x,y-r-14); ctx.fillStyle='#5fff7a'; ctx.fillText('打！',x,y-r-14); } } }
    else if(p&&S.phase==='result'){ const x=ZX+p.ax*ZW,y=ZY-p.ay*ZH; ctx.fillStyle='rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(x,y,8,0,7); ctx.fill(); }
    { const col=cols[batTeam()],big=cheerT>0; [[22,0],[46,1],[W-46,2],[W-22,3]].forEach(([x,k])=>(!showPit||x<W/2)&&cheerGirl(ctx,x,214,.9,col,t*(big?9:4)+k*.6,big,k)); }
    if(hitU>=0) drawContact(hitU);
    ctx.restore();
  }
  /* 擊中的那一刻：閃光、放射線、「鏗！」，球依擊球角度飛出去（高飛往上、平飛往外野、滾地在地上彈） */
  function drawContact(u){ const [evo,la,sa,ax,ay,good,hr]=S.hit,cx0=ZX+ax*ZW,cy0=ZY-ay*ZH,th=sa*Math.PI/180,ground=la<6,pw=clamp((evo-45)/70,.2,1);
    const pos=v=>{ const e=1-Math.pow(1-v,1.7),dx=Math.sin(th)*W*.62*e*(.6+pw*.6);
      if(ground){ const y=cy0+(150-cy0)*e-Math.abs(Math.sin(e*9))*16*(1-e); return [cx0+dx*.8,y,9*(1-e*.55)]; }
      const up=Math.sin(Math.min(70,la)*Math.PI/180),y=cy0-e*H*(.35+up*.9)*(.6+pw*.5)+e*e*H*.12*(1-up); return [cx0+dx,y,9*(1-e*.78)]; };
    if(u<.45){ const k=u/.45; ctx.globalAlpha=1-k; const g=ctx.createRadialGradient(cx0,cy0,0,cx0,cy0,20+k*(good?150:90)); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.4,'rgba(255,240,170,.8)'); g.addColorStop(1,'rgba(255,220,120,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx0,cy0,20+k*(good?150:90),0,7); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.beginPath(); for(let i=0;i<12;i++){ const a=i/12*Math.PI*2+.2,r1=14+k*30,r2=r1+18+k*(good?70:40); ctx.moveTo(cx0+Math.cos(a)*r1,cy0+Math.sin(a)*r1); ctx.lineTo(cx0+Math.cos(a)*r2,cy0+Math.sin(a)*r2); } ctx.stroke(); ctx.globalAlpha=1; }
    if(good&&u<.6){ ctx.strokeStyle='rgba(255,255,255,'+(.5*(1-u/.6))+')'; ctx.lineWidth=2; ctx.beginPath(); for(let i=0;i<16;i++){ const a=i/16*Math.PI*2,r1=Math.max(W,H)*.45,r2=r1+40; ctx.moveTo(W/2+Math.cos(a)*r1,H/2+Math.sin(a)*r1); ctx.lineTo(W/2+Math.cos(a)*r2,H/2+Math.sin(a)*r2); } ctx.stroke(); }
    if(hr){ /* 全壘打：整個畫面金光一閃、四周放煙火、球拖著火焰 */
      if(u<.3){ ctx.fillStyle='rgba(255,220,90,'+(.55*(1-u/.3))+')'; ctx.fillRect(-20,-20,W+40,H+40); }
      for(let n=0;n<4;n++){ const fx0=[W*.18,W*.82,W*.3,W*.7][n],fy0=[70,80,40,46][n],st=n*.12,k=clamp((u-st)/.5,0,1); if(k<=0||k>=1) continue;
        for(let i=0;i<14;i++){ const a=i/14*Math.PI*2,r=k*46,cl=['#ffd23f','#ff5d8f','#3ddbd9','#fff','#86dc4f'][(i+n)%5]; ctx.globalAlpha=1-k; ctx.fillStyle=cl; ctx.beginPath(); ctx.arc(fx0+Math.cos(a)*r,fy0+Math.sin(a)*r+k*k*14,2.6,0,7); ctx.fill(); } ctx.globalAlpha=1; }
      for(let k=10;k>=1;k--){ const v=Math.max(0,u-k*.03),q=pos(v); ctx.fillStyle='rgba(255,'+(120+k*12)+',40,'+(.55*(1-k/11))+')'; ctx.beginPath(); ctx.arc(q[0],q[1],q[2]*(1.5-k*.08),0,7); ctx.fill(); } }
    for(let k=6;k>=1;k--){ const v=Math.max(0,u-k*.035),q=pos(v); ctx.fillStyle='rgba(255,255,255,'+(.35*(1-k/7))+')'; ctx.beginPath(); ctx.arc(q[0],q[1],q[2]*(1-k*.06),0,7); ctx.fill(); }
    const b=pos(u); if(b[1]>-20){ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(b[0],b[1],b[2],0,7); ctx.fill(); ctx.strokeStyle='#e23b3b'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(b[0],b[1],b[2]*.7,t*30,t*30+2); ctx.stroke(); }
    if(hr&&u>.12){ const k=clamp((u-.12)/.25,0,1),sz=34+k*16+Math.sin(u*30)*2; ctx.save(); ctx.translate(W/2,H*.38); ctx.scale(.6+k*.4,.6+k*.4); ctx.font='900 '+Math.round(sz)+'px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=9; ctx.strokeStyle='#14122b'; ctx.strokeText('全壘打！！',0,0);
      const gr=ctx.createLinearGradient(-130,0,130,0); ['#ff5d5d','#ffd23f','#5fd068','#3ddbd9','#b98cff'].forEach((c2,i)=>gr.addColorStop(((i/4)+u*1.5)%1,c2)); ctx.fillStyle=gr; ctx.fillText('全壘打！！',0,0); ctx.restore(); }
    if(u<.55&&!(hr&&u>.12)){ const k=u/.55,sz=(good?40:30)*(1+Math.sin(Math.min(1,k*3)*Math.PI)*.25); ctx.globalAlpha=k>.7?(1-k)/.3:1; ctx.font='900 '+Math.round(sz)+'px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=7; ctx.strokeStyle='#14122b'; const tx2=good?'鏗！！':'鏗！'; ctx.strokeText(tx2,cx0+(cx0<W/2?70:-70),cy0-40-k*14); ctx.fillStyle=good?'#ffd23f':'#fff'; ctx.fillText(tx2,cx0+(cx0<W/2?70:-70),cy0-40-k*14); ctx.globalAlpha=1; } }
  const FS=.6,fpx=(x,y,z)=>[W/2+x*FS,274-y*FS-(z||0)*FS*.55];
  function drawFieldView(){
    ctx.fillStyle=L.bg==='night'?'#1a1c38':'#4a5068'; ctx.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=7) for(let x=(y/7%2)*3.5;x<W;x+=7){ ctx.fillStyle=CROWD[((x*13+y*7)|0)%8]; ctx.globalAlpha=.55; ctx.fillRect(x,y+Math.sin(t*5+x*.3+y)*.5,4,4); } ctx.globalAlpha=1;
    const h0=fpx(0,0),fan=(rr,col)=>{ ctx.fillStyle=col; ctx.beginPath(); const a=fpx(-60,-30),b=fpx(60,-30); ctx.moveTo(b[0],b[1]); ctx.lineTo(a[0],a[1]); for(let i=-52;i<=52;i+=2){ const th=i*Math.PI/180,r=rr(th),q=fpx(Math.sin(th)*r,Math.cos(th)*r); ctx.lineTo(q[0],q[1]); } ctx.fill(); };
    fan(th=>fence(th)+14,'#1f5a3a'); fan(th=>fence(th),'#b9824a'); fan(th=>fence(th)-14,L.grass);
    ctx.fillStyle='rgba(0,0,0,.07)'; for(let k=0;k<8;k++){ const r0=60+k*45; ctx.beginPath(); const a=fpx(0,0); ctx.moveTo(a[0],a[1]); for(let i=-45;i<=45;i+=3){ const th=i*Math.PI/180,r=Math.min(fence(th)-14,r0+22),q=fpx(Math.sin(th)*r,Math.cos(th)*r); ctx.lineTo(q[0],q[1]); } for(let i=45;i>=-45;i-=3){ const th=i*Math.PI/180,r=Math.min(fence(th)-14,r0),q=fpx(Math.sin(th)*r,Math.cos(th)*r); ctx.lineTo(q[0],q[1]); } ctx.fill(); }
    ctx.fillStyle='#2b2f45'; for(const sx of [-1,1]){ const q=fpx(sx*75,-10); ctx.fillRect(q[0]-22,q[1]-5,44,10); ctx.fillStyle='#14162e'; ctx.fillRect(q[0]-20,q[1]-3,40,6); ctx.fillStyle='#2b2f45'; } // 休息區
    ctx.fillStyle='#ffd23f'; for(const sx of [-1,1]){ const r=fence(Math.PI/4),q=fpx(sx*r*.707,r*.707); ctx.fillRect(q[0]-1.5,q[1]-12,3,12); }
    ctx.strokeStyle='#ffd23f'; ctx.lineWidth=3; ctx.beginPath(); for(let i=-45;i<=45;i+=3){ const th=i*Math.PI/180,r=fence(th),q=fpx(Math.sin(th)*r,Math.cos(th)*r); i===-45?ctx.moveTo(q[0],q[1]):ctx.lineTo(q[0],q[1]); } ctx.stroke();
    ctx.fillStyle='#c8924a'; ctx.beginPath(); const c2=fpx(0,62); ctx.ellipse(c2[0],c2[1],64,58,0,0,7); ctx.fill();
    ctx.fillStyle=L.grass; ctx.beginPath(); [[0,12],[B1-10,B1],[0,B1*2-12],[-B1+10,B1]].forEach((b,i)=>{ const q=fpx(b[0],b[1]); i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]); }); ctx.fill();
    ctx.fillStyle='#c8924a'; const m=fpx(0,60.5); ctx.beginPath(); ctx.ellipse(m[0],m[1],8,6,0,0,7); ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; for(const s of [-1,1]){ const e=fpx(s*330*.707,330*.707); ctx.beginPath(); ctx.moveTo(h0[0],h0[1]); ctx.lineTo(e[0],e[1]); ctx.stroke(); }
    ctx.fillStyle='#fff'; for(let k=0;k<4;k++){ const q=fpx(BASE[k][0],BASE[k][1]); ctx.fillRect(q[0]-3.5,q[1]-3.5,7,7); }
    const F=S.fld; if(!F) return;
    const list=[],bl=F[2],mv=(a,b)=>b&&Math.hypot(a[0]-b[0],a[1]-b[1])>.15;
    F[0].forEach((q,i)=>{ const db=Math.hypot(q[0]-bl[0],q[1]-bl[1]); let ps=db<3&&bl[2]<=6?'hold':db<12&&bl[2]>6&&bl[2]<45?'catch':mv(q,prevF[i])?'run':i===1?'ready':db<60?'ready':'stand';
      if(ps==='hold'||ps==='catch'){} else if(db<16&&bl[2]>4&&bl[2]<14&&!mv(q,prevF[i])) ps='throw';
      list.push({x:q[0],y:q[1],c:cols[fldTeam()],pose:ps,face:bl[0]>=q[0]?1:-1}); });
    F[1].forEach((q,i)=>{ const pr=prevR[i],m=mv(q,pr); list.push({x:q[0],y:q[1],c:cols[batTeam()],run:1,pose:m?'run':'stand',face:pr&&q[0]<pr[0]-.05?-1:1}); });
    prevF=F[0].map(q=>q.slice()); prevR=F[1].map(q=>q.slice());
    list.sort((a,b)=>b.y-a.y);
    const b=F[2];
    for(const o of list){ const q=fpx(o.x,o.y); fig(ctx,q[0],q[1],.24,o.face,pose(o.pose,t+o.x*.1),o.c,o.run?{helmet:1}:{glove:'F',ball:o.pose==='hold'?'B':null,up:o.pose==='catch'}); }
    const sh=fpx(b[0],b[1]),bp=fpx(b[0],b[1],b[2]); ctx.fillStyle='rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(sh[0],sh[1],3.5,1.5,0,0,7); ctx.fill();
    if(b[2]>6){ ctx.strokeStyle='rgba(255,255,255,.45)'; ctx.setLineDash([3,3]); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(sh[0],sh[1]); ctx.lineTo(bp[0],bp[1]); ctx.stroke(); ctx.setLineDash([]); }
    const br=3+Math.min(4,b[2]/25); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(bp[0],bp[1],br,0,7); ctx.fill(); ctx.strokeStyle='#14122b'; ctx.lineWidth=1; ctx.stroke();
    drawSideCam(F); drawCatchCam(F);
  }
  // 側面視角：看得出球飛多高、多遠
  function drawSideCam(F){
    const b=F[2],r=Math.hypot(b[0],b[1]); if(!trail.length&&r<2) return;
    const X=W-156,Y=40,w=150,h=70,zMax=Math.max(50,trailMax*1.15),fr=fence(Math.atan2(b[0],Math.max(1,b[1]))),px=d=>X+6+d/430*(w-12),pz=z=>Y+h-8-z/zMax*(h-18);
    ctx.fillStyle='rgba(11,10,28,.78)'; ctx.fillRect(X,Y,w,h); ctx.strokeStyle='#403b7c'; ctx.lineWidth=1; ctx.strokeRect(X+.5,Y+.5,w-1,h-1);
    ctx.fillStyle=L.grass; ctx.fillRect(X+1,Y+h-8,w-2,7); ctx.fillStyle='#ffd23f'; ctx.fillRect(px(fr)-1,pz(10),3,Y+h-8-pz(10));
    ctx.fillStyle='rgba(255,255,255,.55)'; for(const p of trail) ctx.fillRect(px(p[0])-1,pz(p[1])-1,2,2);
    for(const q of F[0]){ const d=Math.hypot(q[0],q[1]); if(Math.abs(Math.atan2(q[0],Math.max(1,q[1]))-Math.atan2(b[0],Math.max(1,b[1])))<.35){ ctx.fillStyle=cols[fldTeam()]; ctx.fillRect(px(d)-2,pz(0)-7,4,7); } }
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(px(r),pz(b[2]),3,0,7); ctx.fill();
    ctx.font='700 10px '+TC; ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillStyle='#aaa4d8'; ctx.fillText('側面　'+Math.round(r)+' 呎',X+5,Y+3); ctx.textBaseline='middle';
  }
  // 接球特寫：高飛球快落地時，拉近看守備員能不能接到
  function drawCatchCam(F){
    const b=F[2]; let nd=1e9,nq=null; for(const q of F[0]){ const d=Math.hypot(q[0]-b[0],q[1]-b[1]); if(d<nd){ nd=d; nq=q; } }
    const falling=trail.length>2&&trail[trail.length-1][1]<trail[trail.length-2][1];
    if(trailMax>18&&nq&&nd<40&&(b[2]>0&&falling&&b[2]<55||b[2]<=5&&nd<3)) catchT=b[2]<=5&&nd<3?Math.max(catchT,.01):.9;
    if(catchT<=0) return;
    const X=6,Y=H-112,w=128,h=106,gy=Y+h-18; ctx.save(); ctx.beginPath(); ctx.rect(X,Y,w,h); ctx.clip();
    const g=ctx.createLinearGradient(0,Y,0,gy); g.addColorStop(0,L.bg==='night'?'#151540':'#7cc8ff'); g.addColorStop(1,L.bg==='night'?'#2a2a60':'#c8ecff'); ctx.fillStyle=g; ctx.fillRect(X,Y,w,h);
    ctx.fillStyle=L.grass; ctx.fillRect(X,gy,w,h); const held=b[2]<=5&&nd<3;
    fig(ctx,X+w/2,gy+8,.62,1,pose(held?'hold':'catch',t),cols[fldTeam()],{glove:'F',ball:held?'B':null,up:!held});
    if(!held){ const dx=clamp((b[0]-nq[0])*1.6,-55,55),bx=X+w/2+dx,by=gy-10-b[2]*1.5,ss=Math.max(.3,1-b[2]/60);
      ctx.fillStyle='rgba(0,0,0,'+(.35*ss)+')'; ctx.beginPath(); ctx.ellipse(X+w/2+dx,gy+4,6*ss+2,2,0,0,7); ctx.fill();
      if(by>Y-10){ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(bx,Math.max(Y+6,by),4,0,7); ctx.fill(); ctx.strokeStyle='#e23b3b'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(bx,Math.max(Y+6,by),3,t*20,t*20+2); ctx.stroke(); }
      else { ctx.fillStyle='#fff'; ctx.font='900 12px '+TC; ctx.textAlign='center'; ctx.fillText('▲',bx,Y+10); } }
    else { ctx.font='900 15px '+TC; ctx.textAlign='center'; ctx.lineWidth=4; ctx.strokeStyle='#14122b'; ctx.strokeText('接到了！',X+w/2,Y+32); ctx.fillStyle='#ffd23f'; ctx.fillText('接到了！',X+w/2,Y+32); }
    ctx.restore(); ctx.strokeStyle='#ffd23f'; ctx.lineWidth=2; ctx.strokeRect(X+1,Y+1,w-2,h-2);
    ctx.font='700 10px '+TC; ctx.textAlign='left'; ctx.fillStyle='#14122b'; ctx.fillText('接球特寫',X+6,Y+11);
  }
  let lastDraw=0;
  function cheerLine(){ if(cheerT<=0) return; const u=cheerT,inA=Math.min(1,(3.4-Math.min(u,3.4))*4,u*3),col=cols[batTeam()],hY=H-58*inA;
    ctx.fillStyle='rgba(11,10,28,.55)'; ctx.fillRect(0,hY,W,H-hY); ctx.fillStyle=col; ctx.fillRect(0,hY,W,3);
    for(let i=0;i<7;i++) cheerGirl(ctx,40+i*67,hY+56,1.05,col,t*9+(i%2?Math.PI:0),true,i);
    ctx.font='900 13px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.globalAlpha=inA; ctx.lineWidth=4; ctx.strokeStyle='#14122b'; ctx.strokeText('GO！GO！'+tname[batTeam()]+'！',W/2,hY-10); ctx.fillStyle='#fff'; ctx.fillText('GO！GO！'+tname[batTeam()]+'！',W/2,hY-10); ctx.globalAlpha=1; }
  function draw(){
    const now=performance.now()/1000,ddt=Math.min(.1,now-(lastDraw||now)); lastDraw=now;
    if(S.phase==='field'&&S.fld){ const b=S.fld[2],r=Math.hypot(b[0],b[1]),l=trail[trail.length-1]; if(!l||Math.abs(l[0]-r)>1.5||Math.abs(l[1]-b[2])>1.5){ trail.push([r,b[2]]); if(trail.length>400) trail.shift(); } trailMax=Math.max(trailMax,b[2]); catchT-=ddt; }
    else { trail=[]; trailMax=0; catchT=0; }
    if(S.phase==='field'&&S.fld) drawFieldView(); else drawPitchView();
    cheerLine();
    // 計分列
    ctx.fillStyle='rgba(11,10,28,.88)'; ctx.fillRect(0,0,W,34); ctx.textBaseline='middle';
    ctx.textAlign='left'; ctx.font='700 11px '+TC; ctx.fillStyle='#ffd23f'; ctx.fillText((S.inn>N?'延長 ':'')+S.inn+' 局'+(S.half?'下':'上'),8,10);
    ctx.fillStyle='#aaa4d8'; ctx.fillText('打者 '+(S.ord[S.half]%9+1)+' 棒 '+batter().name,8,25);
    for(let tm=0;tm<2;tm++){ const x=118+tm*96; ctx.fillStyle=cols[tm]; ctx.fillRect(x,6+0,6,22); ctx.fillStyle=S.half===tm?'#fff':'#aaa4d8'; ctx.font='700 10px '+TC; ctx.textAlign='left'; ctx.fillText(tname[tm].slice(0,5),x+10,10); ctx.font='13px '+PIX; ctx.fillStyle='#fff'; ctx.fillText(String(S.sc[tm]),x+10,24); }
    const lamp=(lbl,n,max,col,y)=>{ ctx.font='9px '+PIX; ctx.textAlign='left'; ctx.fillStyle='#aaa4d8'; ctx.fillText(lbl,316,y); for(let i=0;i<max;i++){ ctx.fillStyle=i<n?col:'#2b2759'; ctx.beginPath(); ctx.arc(334+i*11,y,4,0,7); ctx.fill(); } };
    lamp('B',S.b,3,'#86dc4f',7); lamp('S',S.s,2,'#ffd23f',17); lamp('O',S.outs,2,'#ff5d8f',27);
    const dx=396,dy=17; [[0,10],[10,0],[0,-10],[-10,0]].forEach((q,i)=>{ if(i===0) return; const on=S.bases[i-1]; ctx.save(); ctx.translate(dx+q[0],dy+q[1]-0); ctx.rotate(Math.PI/4); ctx.fillStyle=on?'#ffd23f':'#2b2759'; ctx.fillRect(-4.5,-4.5,9,9); ctx.restore(); });
    ctx.textAlign='right'; ctx.font='700 10px '+TC; ctx.fillStyle='#fff'; ctx.fillText(S.last,W-8,S.last.length>9?10:17);
    const who=S.phase==='sel'?(mine(fldTeam())||client&&fldTeam()===me?'方向鍵一按移一格選位置，按「投球」丟球':mine(batTeam())||client&&batTeam()===me?'圈圈變綠時按 ↑ 打高飛、按 ↓ 打平飛／滾地':''):'';
    if(who){ ctx.textAlign='center'; ctx.font='700 12px '+TC; ctx.lineWidth=4; ctx.strokeStyle='#14122b'; ctx.strokeText(who,W/2,48); ctx.fillStyle='#fff'; ctx.fillText(who,W/2,48); }
    for(const f of fx){ ctx.globalAlpha=Math.max(0,f.life); ctx.fillStyle=f.col; ctx.fillRect(f.x-2,f.y-2,4,4); } ctx.globalAlpha=1;
    if(DERBY){ ctx.fillStyle='#0b0a1c'; ctx.fillRect(0,0,W,34); ctx.textBaseline='middle'; ctx.textAlign='left'; ctx.font='900 13px '+TC; ctx.fillStyle='#ffd23f'; ctx.fillText('全壘打大賽',8,17);
      ctx.fillStyle='#fff'; ctx.fillText('全壘打 '+dHR+' 支',110,17); ctx.fillStyle='#ff8a9a'; ctx.fillText('剩 '+(DOUTS-dOut)+' / '+DOUTS+' 球',200,17); ctx.fillStyle='#86dc4f'; ctx.fillText('最遠 '+(dBest||'-')+(dBest?' 呎':''),285,17);
    }
    if(S.banT>0&&S.ban){ ctx.textAlign='center'; ctx.font='900 26px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#14122b'; ctx.strokeText(S.ban,W/2,84); ctx.fillStyle='#ffd23f'; ctx.fillText(S.ban,W/2,84); }
  }
  if(DERBY){ S.half=me; banner('全壘打大賽：'+DOUTS+' 球裡打越多支越好',2.2); } else banner('1 局上　'+tname[0]+' 進攻',1.6);
  return {update,draw,destroy(){},_dbg:{S,teams,get fl(){return fl;},get runners(){return runners;},hit:(e,l,s)=>startField(e,l,s),resolve,throwPitch,art:{drawBatter,fig,pose,kf,PK,stadium}}};
}

function scene(ctx,w,h,L,t){
  ctx.save(); ctx.scale(w/W,w/W);
  stadium(ctx,L,t);
  const T=3,u=(t%T)/T,hitU=.42;
  fig(ctx,W/2,153,.42,1,kf(PK,clamp(u/.16,0,1)),'#3d8bff',{front:1,glove:'F',ball:u<.13?'B':null});
  // 打者與球棒
  const bp=u<hitU-.1?-1+clamp((u-.16)/.2,0,1):Math.min(1,(u-hitU)/.3+.32); drawBatter(ctx,BX,BY,BS,L.color,+L.hair||0,bp,-4);
  const ballAt=k=>[W/2+(250-W/2)*k,138+(200-138)*k*k];
  if(u>.16&&u<hitU){ const k=(u-.16)/(hitU-.16),[x,y]=ballAt(k),r=2+7*Math.pow(k,1.6); ctx.fillStyle='rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x,160+110*k,r,r*.35,0,0,7); ctx.fill(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill(); ctx.strokeStyle='#e23b3b'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(x,y,r*.7,t*20,t*20+2); ctx.stroke(); }
  if(u>=hitU&&u<hitU+.08){ ctx.fillStyle='rgba(255,255,255,.9)'; ctx.beginPath(); for(let i=0;i<10;i++){ const a=i*.628,r=i%2?8:22; ctx.lineTo(250+Math.cos(a)*r,200+Math.sin(a)*r); } ctx.fill(); }
  if(u>=hitU){ const k=Math.min(1,(u-hitU)/.3),x=250+(330-250)*k,y=200-(200-40)*k+Math.sin(k*Math.PI)*-30,r=9-7*k;
    for(let i=1;i<6;i++){ const kk=Math.max(0,k-i*.035),xx=250+80*kk,yy=200-160*kk-Math.sin(kk*Math.PI)*30; ctx.globalAlpha=.25*(6-i)/5; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(xx,yy,Math.max(1,9-7*kk),0,7); ctx.fill(); } ctx.globalAlpha=1;
    if(k<1){ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x,y,Math.max(1.2,r),0,7); ctx.fill(); } }
  if(u>hitU+.22){ const a=Math.min(1,(u-hitU-.22)*6),sc=1+Math.max(0,.2-(u-hitU-.22))*2;
    for(let f=0;f<3;f++){ const fx=[110,240,370][f],fy=[40,26,44][f],r=(u-hitU-.22)*120*(1+f*.2); for(let i=0;i<14;i++){ const ang=i*.449; ctx.globalAlpha=a*Math.max(0,1-(u-hitU-.22)*2); ctx.fillStyle=CROWD[(i+f*3)%8]; ctx.fillRect(fx+Math.cos(ang)*r,fy+Math.sin(ang)*r,3,3); } }
    ctx.globalAlpha=a; ctx.save(); ctx.translate(W/2,90); ctx.scale(sc,sc); ctx.font='900 28px '+PIX; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineWidth=7; ctx.strokeStyle='#14122b'; ctx.strokeText('HOME RUN!',0,0); ctx.fillStyle='#ffd23f'; ctx.shadowColor='#ff5d4f'; ctx.shadowBlur=10; ctx.fillText('HOME RUN!',0,0); ctx.restore(); ctx.globalAlpha=1; }
  ctx.restore();
}
const preview=(ctx,w,h,L,t)=>scene(ctx,w,h,Object.assign({color:'#ff5d4f',hair:'1',grass:'#4c9a3c',bg:'stadium'},L||{}),t); /* 還沒選過造型時用預設值 */
const thumb=(ctx,w,h,t)=>{ ctx.save(); ctx.translate(0,-16); scene(ctx,w,h,{color:'#ff5d4f',hair:'1',grass:'#4c9a3c',bg:'stadium'},t); ctx.restore(); };

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).baseball={
  name:'鬥魂棒球',tag:'BASEBALL',color:'#ff7eb6',online:true,maxPlayers:2,
  desc:'九人制棒球，投打自己來，守備和跑壘自動進行。六種常見球種，照正式規則打 3、5、7 或 9 局。可單人、兩人同一台，或開房間連線。',
  goal:'投球：方向鍵一按移一格選位置，換球種後丟球。打擊：球旁邊的圈圈變綠時，按一下 ↑ 打高飛（打得準有機會全壘打），按一下 ↓ 打平飛或滾地。守備會自己判斷傳哪一壘，有機會雙殺、三殺。',
  // 開始畫面左邊：選哪一隊就顯示那一隊的球員（投手、打者、守備）
  stageShow:(ctx,w,h,si,t)=>{ const st=STAGES[si],col=st.col;
  const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#1d1a40'); g.addColorStop(1,'#0e0c22'); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  ctx.fillStyle=col; ctx.globalAlpha=.18; ctx.beginPath(); ctx.ellipse(w/2,h*.86,w*.46,h*.12,0,0,7); ctx.fill(); ctx.globalAlpha=1;
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.1)+'px "Noto Sans TC",sans-serif'; ctx.lineWidth=5; ctx.strokeStyle='#0b0a1c';
  ctx.strokeText('對手：'+st.name,w/2,h*.12); ctx.fillStyle=col; ctx.fillText('對手：'+st.name,w/2,h*.12);
    const ps=['throw','ready','catch','run','stand'];
    (st.names||AWAYN).slice(0,5).forEach((nm,i)=>{ const x=w*(.12+i*.19),y=h*(i%2?.88:.78),pn=ps[(i+Math.floor(t*.6))%ps.length];
      fig(ctx,x,y,.85,i<2?1:-1,pose(pn,t*1.2+i),col,pn==='run'?{helmet:1}:{glove:'F',ball:pn==='throw'?'B':null,up:pn==='catch'});
      ctx.font='700 '+Math.round(h*.055)+'px "Noto Sans TC",sans-serif'; ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.fillText(nm,x,y+h*.07); }); },
  stages:STAGES.map(s=>s.name),stars:[1,2,3,3,4,5],
  coin:o=>o.mode==='derby'&&!o.net?null:({verb:'先攻',names:o.net?(o.net.count>1?[o.net.names[0]||'玩家 1',o.net.names[1]||'玩家 2']:[STAGES[o.stage||0].name,o.net.names[0]||'你']):o.mode==='2p'?['1P 隊','2P 隊']:[STAGES[o.stage||0].name,'你的隊伍']}),
  variants:[{id:'3',label:'3 局'},{id:'5',label:'5 局'},{id:'7',label:'7 局'},{id:'9',label:'9 局'}],
  modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true},{id:'derby',label:'全壘打大賽'}],
  options:[{key:'balls',label:'全壘打大賽球數',def:'10',opts:[{id:'10',label:'10 球'},{id:'20',label:'20 球'},{id:'30',label:'30 球'}]}],
  help:[['↑ ↓ ← →','投球：一按移一格選位置'],['J／空白鍵／Enter','投球時丟球'],['K','換球種（投球時）'],['↑','打擊：揮棒打高飛球，時機越準越遠，有機會全壘打'],['↓','打擊：揮棒打平飛球或滾地球'],['W A S D F G','雙人客隊：移動（W／S 揮棒）、丟球、換球種'],['↑ ↓ ← → , .','雙人主隊：移動（↑／↓ 揮棒）、丟球、換球種']],
  touchHelp:[['方向盤','投球：一按移一格；打擊：按上打高飛、按下打平飛或滾地'],['投球','丟球'],['球種','投球時換球種']],
  touch:{left:'dpad',right:[{l:'球種',c:'KeyK'},{l:'投球',c:'KeyJ',act:true}]},
  looks:[{key:'color',label:'隊服顏色',type:'color',opts:['#ff5d4f','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#4f9dff','#b98cff','#ff7eb6']},
    {key:'hair',label:'人物造型',opts:[{id:'1',label:'飛機頭'},{id:'0',label:'短髮'},{id:'2',label:'馬尾'},{id:'3',label:'帽子'}]},
    {key:'grass',label:'草地顏色',type:'color',opts:['#4c9a3c','#3f8f6a','#7fae3c','#5a8fb0','#8a7fc0','#b9965a']},
    {key:'bg',label:'遊戲背景',opts:[{id:'stadium',label:'白天'},{id:'sunset',label:'黃昏'},{id:'night',label:'夜晚'}]}],
  best:{label:'已打敗',fmt:v=>v+' / '+STAGES.length+' 隊',lower:false},
  preview,thumb,create
};
})();
