// 台灣十六張麻將：雙人或四人。144 張（含 8 張花），每人 16 張，胡牌是 5 組加 1 對。
// 有補花、吃（只能吃上家）、碰、明槓、暗槓、加槓、放槍、自摸；牌牆剩 16 張流局；莊家胡或流局連莊。
// 連線時房主判定，其他人只送出動作（打牌、吃碰槓胡、過）。
(function(){
'use strict';
const W=800,H=500,RESERVE=16;
const PIX='"Press Start 2P","Noto Sans TC","Microsoft JhengHei",monospace',TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const NUMS='一二三四五六七八九',HON='東南西北中發白',FLW='春夏秋冬梅蘭竹菊';
const kindOf=id=>id<136?id>>2:34+(id-136);
const isFlower=id=>id>=136;
const kname=k=>k<9?NUMS[k]+'萬':k<18?NUMS[k-9]+'筒':k<27?NUMS[k-18]+'條':k<34?HON[k-27]:FLW[k-34];
const cnt=ids=>{ const c=new Array(34).fill(0); for(const id of ids){ const k=kindOf(id); if(k<34) c[k]++; } return c; };
const sortIds=a=>a.slice().sort((x,y)=>kindOf(x)-kindOf(y)||x-y);

/* ---- 胡牌拆解：一對加若干組（刻子或順子） ---- */
function rec(c,i,sets,need,emit){
  while(i<34&&!c[i]) i++;
  if(i>=34){ if(sets.length===need) emit(sets); return; }
  if(sets.length>=need) return;
  if(c[i]>=3){ c[i]-=3; sets.push({t:'pung',k:i}); rec(c,i,sets,need,emit); sets.pop(); c[i]+=3; }
  if(i<27&&i%9<=6&&c[i+1]&&c[i+2]){ c[i]--; c[i+1]--; c[i+2]--; sets.push({t:'chow',k:i}); rec(c,i,sets,need,emit); sets.pop(); c[i]++; c[i+1]++; c[i+2]++; }
}
function decomps(c,need,limit){
  const out=[];
  for(let p=0;p<34&&out.length<limit;p++){ if(c[p]<2) continue; c[p]-=2; rec(c,0,[],need,s=>{ if(out.length<limit) out.push({pair:p,sets:s.map(x=>({t:x.t,k:x.k}))}); }); c[p]+=2; }
  return out;
}
const shMemo=new Map(); // 跨次共用，太大就清掉
function shDfs(c,i,M,T,need){
  while(i<34&&!c[i]) i++;
  if(i>=34) return 2*need-2*M-Math.min(T,need-M);
  const key=need+'|'+i+'|'+M+'|'+T+'|'+c.slice(i).join(''); if(shMemo.has(key)) return shMemo.get(key);
  c[i]--; let best=shDfs(c,i,M,T,need); c[i]++; // 這張當孤張不用
  if(c[i]>=3){ c[i]-=3; best=Math.min(best,shDfs(c,i,M+1,T,need)); c[i]+=3; }
  if(i<27&&i%9<=6&&c[i+1]&&c[i+2]){ c[i]--; c[i+1]--; c[i+2]--; best=Math.min(best,shDfs(c,i,M+1,T,need)); c[i]++; c[i+1]++; c[i+2]++; }
  if(M+T<need){
    if(c[i]>=2){ c[i]-=2; best=Math.min(best,shDfs(c,i,M,T+1,need)); c[i]+=2; }
    if(i<27&&i%9<=7&&c[i+1]){ c[i]--; c[i+1]--; best=Math.min(best,shDfs(c,i,M,T+1,need)); c[i]++; c[i+1]++; }
    if(i<27&&i%9<=6&&c[i+2]){ c[i]--; c[i+2]--; best=Math.min(best,shDfs(c,i,M,T+1,need)); c[i]++; c[i+2]++; }
  }
  shMemo.set(key,best); return best;
}
function shanten(c,need){
  if(shMemo.size>400000) shMemo.clear();
  let best=shDfs(c,0,0,0,need);
  for(let k=0;k<34;k++) if(c[k]>=2){ c[k]-=2; best=Math.min(best,shDfs(c,0,0,0,need)-1); c[k]+=2; }
  return best;
}
const canWin=(ids,melds)=>{ const need=5-melds.length; return ids.length===need*3+2&&decomps(cnt(ids),need,1).length>0; };

/* ---- 畫牌：照實體麻將的樣子（楷書字、筒子花紋、竹節、雀鳥、花牌） ---- */
const KAI='"BiauKai","DFKai-SB","標楷體","KaiTi","STKaiti","Noto Serif TC","Songti TC",serif';
const BLUE='#1d4fae',GREEN='#1e7d3a',RED='#c62828',NAVY='#1a2a6c';
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
// 一顆筒子：外圈、白圈、花蕊
function dot(c,cx,cy,r,col){
  c.fillStyle=col; c.beginPath(); c.arc(cx,cy,r,0,7); c.fill();
  c.fillStyle='#fffaf0'; c.beginPath(); c.arc(cx,cy,r*.74,0,7); c.fill();
  c.fillStyle=col; c.beginPath(); c.arc(cx,cy,r*.52,0,7); c.fill();
  if(r>3){ c.fillStyle='#fffaf0'; for(let i=0;i<8;i++){ const a=i*Math.PI/4; c.beginPath(); c.arc(cx+Math.cos(a)*r*.33,cy+Math.sin(a)*r*.33,r*.075,0,7); c.fill(); } }
  c.fillStyle='#fffaf0'; c.beginPath(); c.arc(cx,cy,r*.14,0,7); c.fill();
}
// 一根竹子：上中下三個竹節、側邊反光
function stick(c,cx,cy,sw,sh,col,rot){
  c.save(); c.translate(cx,cy); if(rot) c.rotate(rot);
  c.fillStyle=col; rr(c,-sw/2,-sh/2,sw,sh,sw*.45); c.fill();
  c.fillStyle='rgba(0,0,0,.28)'; for(const v of [-.5,0,.5]) c.fillRect(-sw/2,v*sh-.7,sw,1.4);
  c.fillStyle='#fffaf0'; for(const v of [-.5,0,.5]){ c.beginPath(); c.ellipse(0,v*sh,sw*.18,.9,0,0,7); c.fill(); }
  c.fillStyle='rgba(255,255,255,.35)'; c.fillRect(-sw*.28,-sh/2+2,sw*.16,sh-4);
  c.restore();
}
function bird(c,x,y,w,h){ // 一條：雀鳥
  const cx=x+w*.52,cy=y+h*.5,k=w/40;
  c.save(); c.translate(cx,cy); c.scale(k,k);
  c.fillStyle=GREEN; for(let i=0;i<5;i++){ const a=Math.PI*.55+i*.16; c.beginPath(); c.ellipse(Math.cos(a)*14,Math.sin(a)*14+4,3.2,9,a-Math.PI/2,0,7); c.fill(); c.fillStyle=i%2?BLUE:RED; c.beginPath(); c.arc(Math.cos(a)*20,Math.sin(a)*20+4,2,0,7); c.fill(); c.fillStyle=GREEN; } // 尾羽
  c.fillStyle='#2e9a4a'; c.beginPath(); c.ellipse(2,-2,9,11,-.3,0,7); c.fill();            // 身體
  c.fillStyle=BLUE; c.beginPath(); c.ellipse(-2,0,5,8,-.5,0,7); c.fill();                    // 翅膀
  c.fillStyle='#2e9a4a'; c.beginPath(); c.arc(6,-13,5.5,0,7); c.fill();                       // 頭
  c.fillStyle=RED; c.beginPath(); c.moveTo(4,-18); c.lineTo(6,-24); c.lineTo(8,-18); c.fill(); // 冠羽
  c.fillStyle='#e8a317'; c.beginPath(); c.moveTo(11,-13); c.lineTo(16,-11.5); c.lineTo(11,-10); c.fill(); // 嘴
  c.fillStyle='#14122b'; c.beginPath(); c.arc(7.5,-14,1.2,0,7); c.fill();
  c.strokeStyle='#8a5a2a'; c.lineWidth=1.4; c.beginPath(); c.moveTo(1,8); c.lineTo(0,14); c.moveTo(5,8); c.lineTo(6,14); c.stroke();
  c.restore();
}
function blossom(c,cx,cy,r,col,mid){ c.fillStyle=col; for(let i=0;i<5;i++){ const a=i*1.2566-1.57; c.beginPath(); c.arc(cx+Math.cos(a)*r*.62,cy+Math.sin(a)*r*.62,r*.48,0,7); c.fill(); } c.fillStyle=mid||'#f2c230'; c.beginPath(); c.arc(cx,cy,r*.3,0,7); c.fill(); }
// 筒子顏色（照實體牌的配色）
const DOTC={2:[GREEN,BLUE],3:[BLUE,RED,GREEN],4:[BLUE,GREEN,GREEN,BLUE],5:[BLUE,GREEN,RED,GREEN,BLUE],6:[GREEN,GREEN,RED,RED,RED,RED],7:[GREEN,GREEN,GREEN,RED,RED,RED,RED],8:[BLUE,BLUE,BLUE,BLUE,BLUE,BLUE,BLUE,BLUE],9:[BLUE,BLUE,BLUE,RED,RED,RED,GREEN,GREEN,GREEN]};
const DP={2:[[.5,.25],[.5,.75]],3:[[.22,.18],[.5,.5],[.78,.82]],4:[[.27,.26],[.73,.26],[.27,.74],[.73,.74]],5:[[.25,.2],[.75,.2],[.5,.5],[.25,.8],[.75,.8]],
  6:[[.28,.16],[.72,.16],[.28,.52],[.72,.52],[.28,.84],[.72,.84]],7:[[.2,.11],[.5,.22],[.8,.33],[.28,.6],[.72,.6],[.28,.87],[.72,.87]],
  8:[[.28,.12],[.72,.12],[.28,.37],[.72,.37],[.28,.63],[.72,.63],[.28,.88],[.72,.88]],9:[[.2,.16],[.5,.16],[.8,.16],[.2,.5],[.5,.5],[.8,.5],[.2,.84],[.5,.84],[.8,.84]]};
// 條子：位置、顏色、斜度
const BP={2:[[.5,.27,0,GREEN],[.5,.73,0,GREEN]],3:[[.5,.27,0,GREEN],[.27,.73,0,GREEN],[.73,.73,0,GREEN]],4:[[.3,.27,0,BLUE],[.7,.27,0,GREEN],[.3,.73,0,GREEN],[.7,.73,0,BLUE]],
  5:[[.24,.27,0,GREEN],[.76,.27,0,BLUE],[.5,.5,0,RED],[.24,.73,0,BLUE],[.76,.73,0,GREEN]],6:[[.2,.27,0,GREEN],[.5,.27,0,GREEN],[.8,.27,0,GREEN],[.2,.73,0,BLUE],[.5,.73,0,BLUE],[.8,.73,0,BLUE]],
  7:[[.5,.16,0,RED],[.2,.5,0,GREEN],[.5,.5,0,GREEN],[.8,.5,0,GREEN],[.2,.84,0,BLUE],[.5,.84,0,BLUE],[.8,.84,0,BLUE]],
  8:[[.16,.27,0,GREEN],[.39,.27,.45,GREEN],[.61,.27,-.45,GREEN],[.84,.27,0,GREEN],[.16,.73,0,BLUE],[.39,.73,-.45,BLUE],[.61,.73,.45,BLUE],[.84,.73,0,BLUE]],
  9:[[.2,.16,0,GREEN],[.5,.16,0,RED],[.8,.16,0,BLUE],[.2,.5,0,GREEN],[.5,.5,0,RED],[.8,.5,0,BLUE],[.2,.84,0,GREEN],[.5,.84,0,RED],[.8,.84,0,BLUE]]};
function face(c,x,y,w,h,k){
  const fx=x+w*.12,fy=y+h*.09,fw=w*.76,fh=h*.82; c.textAlign='center'; c.textBaseline='middle';
  if(k<9){ c.fillStyle=NAVY; c.font='900 '+h*.36+'px '+KAI; c.fillText(NUMS[k],x+w/2,y+h*.27); c.fillStyle=RED; c.font='900 '+h*.44+'px '+KAI; c.fillText('萬',x+w/2,y+h*.68); return; }
  if(k<18){ const n=k-8;
    if(n===1){ const cx=x+w/2,cy=y+h/2,r=fw*.47; dot(c,cx,cy,r,GREEN); c.strokeStyle=RED; c.lineWidth=r*.12; c.beginPath(); c.arc(cx,cy,r*.62,0,7); c.stroke();
      c.fillStyle=BLUE; for(let i=0;i<12;i++){ const a=i*Math.PI/6; c.beginPath(); c.arc(cx+Math.cos(a)*r*.86,cy+Math.sin(a)*r*.86,r*.09,0,7); c.fill(); } blossom(c,cx,cy,r*.38,RED,'#f2c230'); return; }
    const r=n<=3?fw*.2:n<=5?fw*.16:n<=6?fw*.15:fw*.135; DP[n].forEach(([u,v],i)=>dot(c,fx+u*fw,fy+v*fh,r,DOTC[n][i])); return; }
  if(k<27){ const n=k-17; if(n===1){ bird(c,x,y,w,h); return; }
    const sw=fw*(n>=6?.16:.19),sh=fh*(n<=5?.4:.27); BP[n].forEach(([u,v,rot,col])=>stick(c,fx+u*fw,fy+v*fh,sw,sh,col,rot)); return; }
  if(k<34){ if(k===33){ c.strokeStyle=BLUE; c.lineWidth=Math.max(1.2,w*.07); rr(c,x+w*.2,y+h*.16,w*.6,h*.66,w*.06); c.stroke(); c.lineWidth=Math.max(.8,w*.03); rr(c,x+w*.28,y+h*.23,w*.44,h*.52,w*.04); c.stroke(); return; }
    c.fillStyle=k===31?RED:k===32?GREEN:NAVY; c.font='900 '+h*.62+'px '+KAI; c.fillText(HON[k-27],x+w/2,y+h*.53); return; }
  // 花牌：上面標字和號碼，下面是花草圖
  const f=k-34,cx=x+w/2,cy=y+h*.62,r=w*.2;
  if(f===0){ c.strokeStyle='#7a4a2a'; c.lineWidth=w*.05; c.beginPath(); c.moveTo(x+w*.2,y+h*.9); c.quadraticCurveTo(cx,cy,x+w*.8,y+h*.42); c.stroke(); blossom(c,cx-r*.5,cy-r*.3,r*.8,'#f28ab0'); blossom(c,cx+r*.9,cy-r*1,r*.6,'#f28ab0'); }
  else if(f===1){ c.fillStyle=GREEN; c.beginPath(); c.ellipse(cx,cy+r*.6,r*1.5,r*.6,0,0,7); c.fill(); blossom(c,cx,cy-r*.3,r*.85,'#f6a5c0'); }
  else if(f===2){ c.fillStyle='#e0702a'; c.beginPath(); for(let i=0;i<5;i++){ const a=-1.57+i*1.2566; c.lineTo(cx+Math.cos(a)*r*1.3,cy+Math.sin(a)*r*1.3); c.lineTo(cx+Math.cos(a+.63)*r*.5,cy+Math.sin(a+.63)*r*.5); } c.fill(); c.strokeStyle='#7a4a2a'; c.lineWidth=w*.04; c.beginPath(); c.moveTo(cx,cy); c.lineTo(cx,cy+r*1.6); c.stroke(); }
  else if(f===3){ c.strokeStyle=BLUE; c.lineWidth=w*.05; for(let i=0;i<3;i++){ const a=i*Math.PI/3; c.beginPath(); c.moveTo(cx-Math.cos(a)*r*1.2,cy-Math.sin(a)*r*1.2); c.lineTo(cx+Math.cos(a)*r*1.2,cy+Math.sin(a)*r*1.2); c.stroke(); } }
  else if(f===4){ c.strokeStyle='#5a3a2a'; c.lineWidth=w*.05; c.beginPath(); c.moveTo(x+w*.25,y+h*.92); c.lineTo(cx+r*.6,y+h*.4); c.stroke(); blossom(c,cx-r*.3,cy,r*.7,RED); blossom(c,cx+r*.8,cy-r*1.1,r*.55,RED); }
  else if(f===5){ c.strokeStyle=GREEN; c.lineWidth=w*.045; for(const d of [-1,0,1]){ c.beginPath(); c.moveTo(cx,y+h*.92); c.quadraticCurveTo(cx+d*r*1.6,cy,cx+d*r*1.9,cy-r*1.1); c.stroke(); } blossom(c,cx+r*.4,cy-r*.6,r*.55,'#9b59b6','#fff'); }
  else if(f===6){ stick(c,cx-r*.5,cy,w*.11,h*.42,GREEN,0); c.fillStyle=GREEN; for(const d of [-1,1]){ c.beginPath(); c.ellipse(cx+d*r*.8,cy-r*(d>0?.6:.1),r*.9,r*.28,d*.5,0,7); c.fill(); } }
  else { blossom(c,cx,cy,r*1.15,'#f2c230','#e0702a'); c.fillStyle=GREEN; c.beginPath(); c.ellipse(cx-r,cy+r*1.2,r*.7,r*.25,-.5,0,7); c.fill(); }
  c.fillStyle=f<4?RED:GREEN; c.font='900 '+h*.24+'px '+KAI; c.fillText(FLW[f],x+w*.3,y+h*.2); c.fillStyle=BLUE; c.font='700 '+h*.17+'px '+KAI; c.fillText(String(f%4+1),x+w*.76,y+h*.18);
}
// id<0 是牌背；牌身是白色牌面＋象牙色夾層＋綠色牌背
function drawTile(c,x,y,w,h,id,o){
  o=o||{}; const d=Math.max(2,h*.1),R=Math.max(2,w*.13);
  c.fillStyle='rgba(0,0,0,.32)'; rr(c,x+1.5,y+3,w,h+d,R); c.fill();
  c.fillStyle='#17673f'; rr(c,x,y+d,w,h,R); c.fill();
  c.fillStyle='#e3d7b8'; rr(c,x,y+d*.45,w,h,R); c.fill();
  if(id<0){ const g=c.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#3fae74'); g.addColorStop(1,'#1f7a4c'); c.fillStyle=g; rr(c,x,y,w,h,R); c.fill(); c.fillStyle='rgba(255,255,255,.2)'; c.fillRect(x+w*.15,y+h*.06,w*.7,Math.max(1,h*.03)); return; }
  const g=c.createLinearGradient(x,y,x+w,y+h); g.addColorStop(0,'#ffffff'); g.addColorStop(.6,'#fbf6ea'); g.addColorStop(1,'#efe6cf'); c.fillStyle=g; rr(c,x,y,w,h,R); c.fill();
  c.strokeStyle=o.sel?'#ffd23f':o.last?'#ff5d4f':'rgba(150,130,90,.5)'; c.lineWidth=o.sel||o.last?2:1; c.stroke();
  c.fillStyle='rgba(255,255,255,.9)'; c.fillRect(x+R,y+1,w-R*2,Math.max(1,h*.02));
  face(c,x,y,w,h,kindOf(id));
  if(o.dim){ c.fillStyle='rgba(0,0,0,.35)'; rr(c,x,y,w,h,R); c.fill(); }
}
// 骰子：1 點和 4 點是紅色
const PIPS={1:[[.5,.5]],2:[[.28,.28],[.72,.72]],3:[[.25,.25],[.5,.5],[.75,.75]],4:[[.28,.28],[.72,.28],[.28,.72],[.72,.72]],5:[[.26,.26],[.74,.26],[.5,.5],[.26,.74],[.74,.74]],6:[[.28,.22],[.72,.22],[.28,.5],[.72,.5],[.28,.78],[.72,.78]]};
function drawDie(c,x,y,s,v,rot){
  c.save(); c.translate(x+s/2,y+s/2); c.rotate(rot||0);
  c.fillStyle='rgba(0,0,0,.35)'; rr(c,-s/2+2,-s/2+3,s,s,s*.2); c.fill();
  const g=c.createLinearGradient(-s/2,-s/2,s/2,s/2); g.addColorStop(0,'#ffffff'); g.addColorStop(1,'#e6e0d2'); c.fillStyle=g; rr(c,-s/2,-s/2,s,s,s*.2); c.fill(); c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=1; c.stroke();
  for(const [u,w] of PIPS[v]){ c.fillStyle=v===1||v===4?'#d32f2f':'#1b1b2a'; c.beginPath(); c.arc(-s/2+u*s,-s/2+w*s,s*(v===1?.15:.085),0,7); c.fill(); }
  c.restore();
}

/* ---- 牌桌：木框＋絨布，畫一次存起來 ---- */
const tableCache={};
function tableArt(felt){
  if(tableCache[felt]) return tableCache[felt];
  const cv=document.createElement('canvas'),S=2; cv.width=W*S; cv.height=H*S; const c=cv.getContext('2d'); c.scale(S,S);
  let seed=11; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  let g=c.createLinearGradient(0,0,W,H); g.addColorStop(0,'#5a3016'); g.addColorStop(.5,'#6e3c1b'); g.addColorStop(1,'#4a2610'); c.fillStyle=g; c.fillRect(0,0,W,H);
  for(let i=0;i<80;i++){ const y=rnd()*H; c.strokeStyle='rgba('+(rnd()<.5?'0,0,0':'255,215,160')+','+(.04+rnd()*.07)+')'; c.lineWidth=1; c.beginPath(); c.moveTo(0,y); for(let x=0;x<=W;x+=40) c.lineTo(x,y+Math.sin(x*.018+i)*3); c.stroke(); }
  const fx=7,fy=7,fw=W-14,fh=H-14; rr(c,fx,fy,fw,fh,16); c.save(); c.clip();
  c.fillStyle=felt; c.fillRect(fx,fy,fw,fh);
  g=c.createRadialGradient(W/2,H*.46,40,W/2,H*.46,W*.62); g.addColorStop(0,'rgba(255,255,255,.14)'); g.addColorStop(.5,'rgba(255,255,255,0)'); g.addColorStop(1,'rgba(0,0,0,.45)'); c.fillStyle=g; c.fillRect(fx,fy,fw,fh);
  for(let i=0;i<11000;i++){ c.fillStyle=rnd()<.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.07)'; c.fillRect(fx+rnd()*fw,fy+rnd()*fh,1,1); }
  c.strokeStyle='rgba(255,255,255,.02)'; for(let k=-fh;k<fw;k+=4){ c.beginPath(); c.moveTo(fx+k,fy); c.lineTo(fx+k+fh,fy+fh); c.stroke(); }
  c.restore();
  c.save(); rr(c,fx,fy,fw,fh,16); c.clip(); c.shadowColor='rgba(0,0,0,.65)'; c.shadowBlur=16; c.lineWidth=12; c.strokeStyle='rgba(0,0,0,.5)'; rr(c,fx-6,fy-6,fw+12,fh+12,20); c.stroke(); c.restore();
  c.strokeStyle='rgba(222,184,96,.5)'; c.lineWidth=1.2; rr(c,fx+6,fy+6,fw-12,fh-12,11); c.stroke();
  // 中央的骰盤
  c.save(); c.translate(W/2,240); g=c.createLinearGradient(0,-58,0,58); g.addColorStop(0,'rgba(20,14,8,.55)'); g.addColorStop(1,'rgba(20,14,8,.35)'); c.fillStyle=g; rr(c,-96,-56,192,112,16); c.fill();
  c.strokeStyle='rgba(222,184,96,.55)'; c.lineWidth=1.5; rr(c,-96,-56,192,112,16); c.stroke(); rr(c,-90,-50,180,100,12); c.strokeStyle='rgba(222,184,96,.22)'; c.stroke(); c.restore();
  return tableCache[felt]=cv;
}

function create(env,opts){
  const net=opts.net,client=!!net&&!net.host,me=net?net.me:0;
  const humans=net?net.count:1,np=net?Math.max(2,Math.min(4,net.count+(net.bots||0))):(opts.variant==='2'?2:4);
  const TL=(o=>o==null?20:+o)((opts.options||{}).time),AIL=(opts.options||{}).ai||'normal',LEN=(opts.options||{}).len||'c',TARGET=LEN==='q'?1:LEN==='j'?4*np:np,LENNAME={q:'1/4 圈',c:'1 圈',j:'1 將'}[LEN]||'1 圈',L=opts.look||{felt:'#1d5e45'};
  const {ctx,canvas}=env.canvas2d(W,H);
  const names=[]; for(let i=0;i<np;i++) names.push(i<humans?(net?(net.names&&net.names[i])||'玩家'+(i+1):(opts.name||'你')):'電腦 '+(i-humans+1));
  const isAI=p=>p>=humans;
  const sfx=n=>env.sfx(n);
  let dispKey='',dispT=0,msg='',msgT=0,t=0,aiT=0,sel=-1,sendT=0,ended=false,claimT=0,playT=0,lastKey='';
  const say=(s,sec)=>{ msg=s; msgT=sec||1.8; };
  const G={wall:[],wallN:0,hands:[],melds:[],flowers:[],discards:[],turn:0,phase:'play',drawn:-1,last:null,claim:null,dealer:0,lian:0,moves:0,handNo:0,scores:new Array(np).fill(0),result:null,log:'',afterKong:false,ev:[]};
  const seatOf=p=>{ const r=(p-G.dealer+np)%np; return np===2?[0,2][r]:r; };
  const next=p=>(p+1)%np;
  const windOf=()=>Math.floor(G.moves/np)%4;

  /* ---- 一局的流程（房主或單機才執行） ---- */
  const roll3=()=>[0,0,0].map(()=>1+Math.floor(Math.random()*6));
  let diceT=0,dealI=0,dealT=0;
  // 第一局：擲骰從自己（第 1 家）開始逆時針數，數到的人起莊
  function rollDealer(){ const v=roll3(),tot=v[0]+v[1]+v[2],tg=(tot-1)%np; G.dice={id:(G.dice?G.dice.id:0)+1,kind:'dealer',vals:v,total:tot,who:0,target:tg}; G.phase='dice'; diceT=0; G.log=names[0]+' 擲骰決定起莊'; sfx('bump'); }
  // 每一局：莊家擲骰，從莊家數起數到哪一家，就從那家牌牆的第幾墩開門拿牌
  function rollBreak(){
    const w=[]; for(let i=0;i<144;i++) w.push(i); for(let i=w.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [w[i],w[j]]=[w[j],w[i]]; }
    const v=roll3(),tot=v[0]+v[1]+v[2],owner=(G.dealer+tot-1)%np,per=144/np/2,off=Math.round(((owner*per+tot)*2)%144);
    G.wall=w.slice(off).concat(w.slice(0,off)); G.hands=[]; G.melds=[]; G.flowers=[]; G.discards=[];
    for(let p=0;p<np;p++){ G.hands.push([]); G.melds.push([]); G.flowers.push([]); G.discards.push([]); }
    G.dice={id:(G.dice?G.dice.id:0)+1,kind:'break',vals:v,total:tot,who:G.dealer,target:owner}; G.phase='dice'; diceT=0; G.turn=G.dealer; G.drawn=-1;
    G.result=null; G.claim=null; G.last=null; G.afterKong=false; G.log=names[G.dealer]+' 當莊，擲骰開門'; sfx('bump');
  }
  // 發牌：從莊家開始，每人一次抓 4 張，抓 4 輪
  function dealStep(){ const p=(G.dealer+dealI%np)%np; for(let i=0;i<4;i++) G.hands[p].push(G.wall.shift()); dealI++; sfx('click'); if(dealI>=4*np) startHand(); }
  function startHand(){
    for(let k=0;k<np;k++){ const p=(G.dealer+k)%np; let f; while((f=G.hands[p].find(isFlower))!=null){ G.hands[p].splice(G.hands[p].indexOf(f),1); G.flowers[p].push(f); G.hands[p].push(G.wall.pop()); } }
    G.log='發牌完畢，'+names[G.dealer]+' 先摸牌';
    drawFor(G.dealer,false);
  }
  function drawFor(p,back){
    if(G.wall.length<=RESERVE){ endDraw(); return; }
    let id=back?G.wall.pop():G.wall.shift(),fl=0;
    while(isFlower(id)){ G.flowers[p].push(id); fl++; if(G.wall.length<=RESERVE){ endDraw(); return; } id=G.wall.pop(); }
    if(fl) { G.log=names[p]+' 補花 '+fl+' 張'; sfx('item'); }
    G.hands[p].push(id); G.drawn=id; G.turn=p; G.phase='play'; G.claim=null; G.afterKong=!!back; playT=0; aiT=0;
  }
  function discard(p,id){
    const h=G.hands[p],i=h.indexOf(id); if(i<0||G.phase!=='play'||G.turn!==p) return;
    h.splice(i,1); G.discards[p].push(id); G.last={p,id}; G.drawn=-1; G.afterKong=false; sfx('place'); G.log=names[p]+' 打出 '+kname(kindOf(id));
    const k=kindOf(id),opts={};
    for(let q=0;q<np;q++){ if(q===p) continue; const o=[],hq=G.hands[q],c=cnt(hq)[k];
      if(canWin(hq.concat([id]),G.melds[q])) o.push({c:'hu'});
      if(G.wall.length>RESERVE){ if(c>=3) o.push({c:'kong'}); if(c>=2) o.push({c:'pong'});
        if(q===next(p)&&k<27){ const s=k%9,have=x=>hq.some(t=>kindOf(t)===x); for(const pr of [[-2,-1],[-1,1],[1,2]]){ const a=k+pr[0],b=k+pr[1]; if(s+pr[0]>=0&&s+pr[1]<=8&&have(a)&&have(b)) o.push({c:'chow',k:[a,b]}); } } }
      if(o.length) opts[q]=o; }
    if(!Object.keys(opts).length){ drawFor(next(p),false); return; }
    G.phase='claim'; G.claim={from:p,id,opts,resp:{}}; claimT=0;
    for(const q in opts) if(isAI(+q)) G.claim.resp[q]=aiClaim(+q,opts[q],k);
    tryResolve();
  }
  function respond(q,r){ if(G.phase!=='claim'||!G.claim.opts[q]||G.claim.resp[q]!==undefined) return; G.claim.resp[q]=r; tryResolve(); }
  function tryResolve(){
    const C=G.claim; if(Object.keys(C.opts).some(q=>C.resp[q]===undefined)) return;
    const order=[]; for(let k=1;k<np;k++) order.push((C.from+k)%np);
    const pick=c=>order.find(q=>C.resp[q]&&C.resp[q].c===c);
    let q=pick('hu'); if(q!=null){ win(q,C.id,false,C.from); return; }
    q=pick('kong'); if(q==null) q=pick('pong');
    const k=kindOf(C.id),take=()=>{ const d=G.discards[C.from]; d.splice(d.lastIndexOf(C.id),1); };
    const pull=(p,kind,n)=>{ const out=[]; for(let i=0;i<n;i++){ const h=G.hands[p],j=h.findIndex(t=>kindOf(t)===kind); out.push(h.splice(j,1)[0]); } return out; };
    if(q!=null){ const kong=C.resp[q].c==='kong',ids=pull(q,k,kong?3:2).concat([C.id]); take(); G.melds[q].push({t:kong?'kong':'pong',ids,k,from:C.from}); G.log=names[q]+(kong?' 槓！':' 碰！'); say(names[q]+(kong?'　槓！':'　碰！'),1.2); sfx('boom');
      if(kong) drawFor(q,true); else { G.turn=q; G.phase='play'; G.drawn=-1; G.claim=null; playT=0; aiT=0; } return; }
    q=pick('chow');
    if(q!=null){ const ks=C.resp[q].k,ids=[pull(q,ks[0],1)[0],pull(q,ks[1],1)[0],C.id]; take(); G.melds[q].push({t:'chow',ids:sortIds(ids),k:Math.min(k,ks[0],ks[1]),from:C.from}); G.log=names[q]+' 吃！'; say(names[q]+'　吃！',1.2); sfx('item');
      G.turn=q; G.phase='play'; G.drawn=-1; G.claim=null; playT=0; aiT=0; return; }
    drawFor(next(C.from),false);
  }
  function selfKong(p,k){
    if(G.phase!=='play'||G.turn!==p||G.wall.length<=RESERVE) return;
    const h=G.hands[p],c=cnt(h)[k];
    if(c===4){ const ids=h.filter(t=>kindOf(t)===k); G.hands[p]=h.filter(t=>kindOf(t)!==k); G.melds[p].push({t:'ankong',ids,k}); }
    else { const m=G.melds[p].find(m=>m.t==='pong'&&m.k===k); if(!m||!c) return; const id=h.find(t=>kindOf(t)===k); h.splice(h.indexOf(id),1); m.ids.push(id); m.t='kong'; }
    G.log=names[p]+' 槓！'; say(names[p]+'　槓！',1.2); sfx('boom'); drawFor(p,true);
  }
  const kongKinds=p=>{ const h=G.hands[p],c=cnt(h),out=[]; for(let k=0;k<34;k++){ if(c[k]===4) out.push(k); else if(c[k]&&G.melds[p].some(m=>m.t==='pong'&&m.k===k)) out.push(k); } return out; };
  function tsumo(p){ if(G.phase!=='play'||G.turn!==p||!canWin(G.hands[p],G.melds[p])) return; win(p,G.hands[p][G.hands[p].length-1],true,-1); }

  /* ---- 台數（照台灣十六張常見算法） ---- */
  function tally(p,winId,self,from){
    const ids=self?G.hands[p].slice():G.hands[p].concat([winId]),ms=G.melds[p],ds=decomps(cnt(ids),5-ms.length,80),wk=kindOf(winId);
    let best=null;
    for(const d of ds){
      const L=[],add=(n,v)=>L.push([n,v]),seat=seatOf(p),rw=windOf();
      const sets=ms.map(m=>({t:m.t==='chow'?'chow':'pung',k:m.k,open:m.t!=='ankong'})).concat(d.sets.map(s=>({t:s.t,k:s.k,open:false,mine:1})));
      if(!self&&d.pair!==wk&&!d.sets.some(s=>s.t==='chow'&&wk>=s.k&&wk<=s.k+2)){ const ps=sets.find(s=>s.mine&&s.t==='pung'&&s.k===wk); if(ps) ps.open=true; }
      const open=ms.some(m=>m.t!=='ankong');
      if(!open&&self) add('門清自摸',3); else { if(!open) add('門清',1); if(self) add('自摸',1); }
      const pk=sets.filter(s=>s.t==='pung').map(s=>s.k),dr=[31,32,33].filter(k=>pk.includes(k)).length;
      if(dr===3) add('大三元',8); else if(dr===2&&d.pair>=31) add('小三元',4); else for(const k of [31,32,33]) if(pk.includes(k)) add(HON[k-27]+'（三元牌）',1);
      const wn=[27,28,29,30].filter(k=>pk.includes(k)).length;
      if(wn===4) add('大四喜',16); else if(wn===3&&d.pair>=27&&d.pair<=30) add('小四喜',8); else { if(pk.includes(27+rw)) add('圈風 '+HON[rw],1); if(pk.includes(27+seat)) add('門風 '+HON[seat],1); }
      const fl=G.flowers[p].map(kindOf),zh=fl.filter(k=>(k-34)%4===seat).length; if(zh) add('正花',zh);
      if([34,35,36,37].every(k=>fl.includes(k))) add('春夏秋冬',2); if([38,39,40,41].every(k=>fl.includes(k))) add('梅蘭竹菊',2);
      if(sets.every(s=>s.t==='pung')) add('碰碰胡',4);
      const all=ids.map(kindOf).concat(ms.flatMap(m=>m.ids.map(kindOf))),suits=new Set(all.filter(k=>k<27).map(k=>Math.floor(k/9))),hasH=all.some(k=>k>=27);
      if(!suits.size) add('字一色',16); else if(suits.size===1) add(hasH?'混一色':'清一色',hasH?4:8);
      if(!self&&!fl.length&&!hasH&&sets.every(s=>s.t==='chow')) add('平胡',2);
      const an=sets.filter(s=>s.t==='pung'&&!s.open).length; if(an>=5) add('五暗刻',8); else if(an===4) add('四暗刻',5); else if(an===3) add('三暗刻',2);
      if(!self&&ms.length===5&&ms.every(m=>m.t!=='ankong')) add('全求人',2);
      if(G.wall.length<=RESERVE) add(self?'海底撈月':'河底撈魚',1);
      if(self&&G.afterKong) add('槓上開花',1);
      const tai=L.reduce((a,b)=>a+b[1],0); if(!best||tai>best.tai) best={tai,items:L};
    }
    return best||{tai:0,items:[]};
  }
  function win(p,id,self,from){
    // 莊家台：莊家 1 台＋連 N 拉 N 共 2N 台，只算在莊家跟對方之間（莊家胡牌，或莊家放槍／被自摸）
    const r=tally(p,id,self,from),dt=1+2*G.lian,delta=new Array(np).fill(0),pays={},payOf=q=>3+r.tai+(p===G.dealer||q===G.dealer?dt:0);
    const dItems=[['莊家',1]]; if(G.lian) dItems.push(['連'+G.lian+'拉'+G.lian,G.lian*2]);
    if(self){ for(let q=0;q<np;q++) if(q!==p){ const v=payOf(q); pays[q]=v; delta[q]-=v; delta[p]+=v; } }
    else { const v=payOf(from); pays[from]=v; delta[from]-=v; delta[p]+=v; const d=G.discards[from]; d.splice(d.lastIndexOf(id),1); G.hands[p].push(id); }
    for(let q=0;q<np;q++) G.scores[q]+=delta[q];
    const withD=p===G.dealer||Object.keys(pays).some(q=>+q===G.dealer);
    G.result={w:p,from,self,tai:r.tai,items:r.items,dItems:withD?dItems:[],dealerWin:p===G.dealer,dt,pays,delta,win:id}; G.phase='end'; G.claim=null;
    G.log=self?names[p]+' 自摸！':names[p]+' 胡了！（'+names[from]+' 放槍）'; sfx('win');
  }
  function endDraw(){ G.result={draw:true,delta:new Array(np).fill(0)}; G.phase='end'; G.claim=null; G.log='流局'; sfx('lose'); }
  function nextHand(){
    if(G.phase!=='end') return;
    const r=G.result; G.handNo++;
    if(r.draw||r.w===G.dealer) G.lian++; else { G.dealer=next(G.dealer); G.lian=0; G.moves++; }
    if(G.moves>=TARGET||G.handNo>=60){ G.phase='over'; finish(); return; } // 莊家輪換次數到了就結束（連莊不算）
    rollBreak();
  }
  function finish(){
    if(ended) return; ended=true;
    const rank=names.map((n,i)=>({i,n,s:G.scores[i]})).sort((a,b)=>b.s-a.s),winMe=rank[0].i===me;
    setTimeout(()=>{ env.sfx(winMe?'win':'lose'); env.end({title:winMe?'你贏了！':rank[0].n+' 獲勝',big:'',
      html:'<ul class="rest">'+rank.map((r,k)=>'<li>第 '+(k+1)+' 名　'+r.n+'　'+(r.s>0?'+':'')+r.s+' 分</li>').join('')+'</ul>',
      text:LENNAME+'（共 '+G.handNo+' 把），'+np+' 人麻將。每把底 3 分、每台 1 分。',score:G.scores[me]>0?G.scores[me]:null}); },600);
  }

  /* ---- 電腦 ---- */
  const valuable=(p,k)=>k>=31||k===27+seatOf(p)||k===27+windOf();
  function keepScore(p,c,k){
    if(k>=27) return c[k]>=3?30:c[k]===2?(valuable(p,k)?16:11):(valuable(p,k)?2:0);
    const s=k%9; let v=c[k]>=3?30:c[k]===2?10:0;
    if(s>0&&c[k-1]) v+=6; if(s<8&&c[k+1]) v+=6; if(s>1&&c[k-2]) v+=3; if(s<7&&c[k+2]) v+=3;
    return v+(s===0||s===8?0:1.5);
  }
  // 場上看得到的牌：自己手牌＋所有人打出的牌＋別人的吃碰槓
  function seen(p){ const c=cnt(G.hands[p]); for(let q=0;q<np;q++){ for(const id of G.discards[q]){ const k=kindOf(id); if(k<34) c[k]++; } if(q!==p) for(const m of G.melds[q]) for(const id of m.ids) c[kindOf(id)]++; } return c; }
  // 這手牌的向聽數，以及還能進幾張讓它更接近胡牌的牌
  // 只有跟手牌同種或差兩張以內的牌才可能有用
  const near=(c,k)=>{ if(c[k]) return true; if(k>=27) return false; const s=k%9; return s>0&&c[k-1]||s<8&&c[k+1]||s>1&&c[k-2]||s<7&&c[k+2]; };
  function evalHand(c,need,vis){
    const sh=shanten(c,need); let uke=0;
    for(let k=0;k<34;k++){ const left=4-vis[k]; if(left<=0) continue; if(!near(c,k)) continue; c[k]++; if(shanten(c,need)<sh) uke+=left; c[k]--; }
    return {sh,uke};
  }
  // 看起來快聽牌的對手（副露三組以上，或牌快摸完時副露兩組以上）
  function threats(p){ const out=[]; for(let q=0;q<np;q++) if(q!==p&&(G.melds[q].length>=3||G.wall.length<RESERVE+12&&G.melds[q].length>=2)) out.push(q); return out; }
  function danger(k,th,vis){ let d=0; for(const q of th){ if(G.discards[q].some(id=>kindOf(id)===k)) continue; d+=k>=27?(vis[k]>=3?0:vis[k]>=2?.3:1):(k%9===0||k%9===8?.7:1); } return d; }
  const lexLess=(a,b)=>{ for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return a[i]<b[i]; return false; };
  function aiDiscardEasy(p){ const h=G.hands[p],c=cnt(h); let best=null,bv=1e9; for(const id of h){ const v=keepScore(p,c,kindOf(id))+Math.random()*.5; if(v<bv){ bv=v; best=id; } } return best; }
  function aiClaimEasy(p,o,k){ if(o.some(x=>x.c==='hu')) return {c:'hu'}; const c=cnt(G.hands[p]); if(o.some(x=>x.c==='kong')) return {c:'kong'};
    if(o.some(x=>x.c==='pong')){ const lone=k>=27||!((k%9>0&&c[k-1])||(k%9<8&&c[k+1])); if(valuable(p,k)||lone&&Math.random()<.7) return {c:'pong'}; }
    const ch=o.filter(x=>x.c==='chow').find(x=>x.k.every(q=>c[q]===1)); if(ch&&Math.random()<.55) return ch; return {c:'pass'}; }
  function aiDiscard(p){
    if(AIL==='easy') return aiDiscardEasy(p);
    const h=G.hands[p],c=cnt(h),need=5-G.melds[p].length,vis=seen(p),th=AIL==='hard'?threats(p):[];
    let best=-1,bk=null;
    for(let k=0;k<34;k++){ if(!c[k]) continue; c[k]--; const e=AIL==='hard'?evalHand(c,need,vis):{sh:shanten(c,need),uke:0}; c[k]++;
      const dz=danger(k,th,vis),key=th.length&&e.sh>=2?[dz*3+e.sh,-e.uke]:[e.sh,-e.uke,dz,keepScore(p,c,k)];
      if(!bk||lexLess(key,bk)){ bk=key; best=k; } }
    return h.find(id=>kindOf(id)===best);
  }
  function aiClaim(p,o,k){
    if(AIL==='easy') return aiClaimEasy(p,o,k);
    if(o.some(x=>x.c==='hu')) return {c:'hu'};
    const c=cnt(G.hands[p]),need=5-G.melds[p].length,before=shanten(c,need);
    // 吃碰之後還要打掉一張：看打完後最好的向聽數
    const after=rm=>{ const d=c.slice(); for(const x of rm) d[x]--; let b=99; for(let j=0;j<34;j++){ if(!d[j]) continue; d[j]--; b=Math.min(b,shanten(d,need-1)); d[j]++; } return b; };
    if(o.some(x=>x.c==='kong')){ const d=c.slice(); d[k]-=3; if(shanten(d,need-1)<=before) return {c:'kong'}; }
    let pick={c:'pass'},bestSh=before;
    if(o.some(x=>x.c==='pong')){ const a=after([k,k]); if(a<bestSh||a===bestSh&&valuable(p,k)){ bestSh=a; pick={c:'pong'}; } }
    for(const x of o.filter(x=>x.c==='chow')){ const a=after(x.k); if(a<bestSh){ bestSh=a; pick=x; } }
    return pick;
  }
  function aiPlay(p){
    if(canWin(G.hands[p],G.melds[p])){ tsumo(p); return; }
    const kk=kongKinds(p);
    if(kk.length&&G.wall.length>RESERVE&&AIL==='easy'){ selfKong(p,kk[0]); return; }
    if(kk.length&&G.wall.length>RESERVE){ const c=cnt(G.hands[p]),need=5-G.melds[p].length,now=shanten(c,need);
      for(const k of kk){ const d=c.slice(); let n2=need; if(d[k]===4){ d[k]=0; n2=need-1; } else d[k]--; if(shanten(d,n2)<=now){ selfKong(p,k); return; } } }
    discard(p,aiDiscard(p));
  }

  /* ---- 連線 ---- */
  function pub(){ return {dice:G.dice,hands:G.hands,melds:G.melds,flowers:G.flowers,discards:G.discards,wallN:G.wall.length,turn:G.turn,phase:G.phase,drawn:G.drawn,last:G.last,claim:G.claim,dealer:G.dealer,lian:G.lian,moves:G.moves,handNo:G.handNo,scores:G.scores,result:G.result,log:G.log}; }
  function broadcast(){ if(net&&net.host) net.send({st:pub()}); }
  function act(p,m){
    if(m.a==='discard') discard(p,m.id);
    else if(m.a==='claim') respond(p,m.r);
    else if(m.a==='kong') selfKong(p,m.k);
    else if(m.a==='tsumo') tsumo(p);
    else if(m.a==='next'&&p===0) nextHand();
  }
  function doAct(m){ sel=-1; if(client) net.send(m); else { act(me,m); broadcast(); } }
  if(net){
    if(client) net.onmsg=m=>{ if(m.st){ const s=m.st,was=G.phase; Object.assign(G,s); if(s.phase==='over'&&was!=='over') finish(); } };
    else net.onmsg=(m,from)=>{ if(m.a){ act(from,m); broadcast(); } };
    if(!client) net.onleave=()=>{};
  }
  if(!client){ rollDealer(); broadcast(); }

  /* ---- 操作 ---- */
  const layout={hand:[],btn:[]};
  function toLogical(e){ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=(r.width-W*s)/2,oy=(r.height-H*s)/2; return [(e.clientX-r.left-ox)/s,(e.clientY-r.top-oy)/s]; }
  function onDown(e){ e.preventDefault(); const [x,y]=toLogical(e);
    for(const b of layout.btn) if(x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h){ sfx('click'); b.fn(); return; }
    for(const h of layout.hand) if(x>=h.x&&x<h.x+h.w&&y>=h.y-10&&y<h.y+h.h){ if(!myPlay()) { sel=sel===h.id?-1:h.id; return; } if(sel===h.id) doAct({a:'discard',id:h.id}); else { sel=h.id; sfx('click'); } return; }
    sel=-1; }
  canvas.style.touchAction='none'; canvas.addEventListener('pointerdown',onDown);
  const myPlay=()=>G.phase==='play'&&G.turn===me&&G.hands[me]&&G.hands[me].length%3===2;

  function update(dt){
    t+=dt; if(msgT>0) msgT-=dt;
    const dk=G.phase+'|'+G.turn+'|'+(G.discards||[]).reduce((a,d)=>a+d.length,0)+'|'+(G.melds||[]).reduce((a,m)=>a+m.length,0); if(dk!==dispKey){ dispKey=dk; dispT=0; } else dispT+=dt;
    if(client||G.phase==='over') return;
    if(G.phase==='dice'){ diceT+=dt; if(diceT>2.8){ if(G.dice.kind==='dealer'){ G.dealer=G.dice.target; rollBreak(); } else { G.phase='deal'; dealI=0; dealT=0; } broadcast(); } return; }
    if(G.phase==='deal'){ dealT+=dt; while(dealT>.12&&G.phase==='deal'){ dealT-=.12; dealStep(); } broadcast(); return; }
    if(G.phase==='play'){ playT+=dt;
      if(isAI(G.turn)){ aiT+=dt; if(aiT>.75){ aiT=0; aiPlay(G.turn); broadcast(); } }
      else if(TL&&playT>TL){ const h=G.hands[G.turn]; if(G.turn===me) say('時間到，自動打出',1.4); discard(G.turn,G.drawn>=0&&h.includes(G.drawn)?G.drawn:h[h.length-1]); sel=-1; broadcast(); } }
    else if(G.phase==='claim'){ claimT+=dt; if(TL&&claimT>TL){ for(const q in G.claim.opts) if(G.claim.resp[q]===undefined) G.claim.resp[q]={c:'pass'}; tryResolve(); broadcast(); } }
    else if(G.phase==='end'&&net&&!humansIn()) { /* 只有電腦時不會發生 */ }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1; broadcast(); } }
  }
  const humansIn=()=>humans>0;

  /* ---- 畫面 ---- */
  // 位置：0 下（自己）、1 右、2 上、3 左
  const posOf=p=>{ const r=(p-me+np)%np; return np===2?[0,2][r]:np===3?[0,1,3][r]:r; };
  function button(x,y,w,h,label,fn,hot){ ctx.fillStyle='rgba(0,0,0,.4)'; rr(ctx,x+1,y+3,w,h,8); ctx.fill(); ctx.fillStyle=hot?'#ffd23f':'#3a3670'; rr(ctx,x,y,w,h,8); ctx.fill(); ctx.strokeStyle='rgba(11,10,28,.8)'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.2)'; ctx.fillRect(x+6,y+2,w-12,1.5); ctx.fillStyle=hot?'#14122b':'#fff'; ctx.font='900 15px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(label,x+w/2,y+h/2+1); layout.btn.push({x,y,w,h,fn}); }
  function txt(s,x,y,col,size,align,weight){ ctx.font=(weight||'700')+' '+size+'px '+TC; ctx.textAlign=align||'left'; ctx.textBaseline='middle'; ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,.55)'; ctx.strokeText(s,x,y); ctx.fillStyle=col; ctx.fillText(s,x,y); }
  function info(p,x,y,align){
    const act=G.turn===p&&(G.phase==='play'||G.phase==='claim'&&false),wnd=HON[seatOf(p)],dl=p===G.dealer;
    const label=(dl?'莊 ':'')+wnd+'　'+names[p],sc=(G.scores[p]>0?'+':'')+G.scores[p];
    ctx.font='900 13px '+TC; const w=Math.max(ctx.measureText(label).width,60)+16,bx=align==='right'?x-w:align==='center'?x-w/2:x;
    ctx.fillStyle=act?'rgba(255,210,63,.28)':'rgba(11,10,28,.5)'; rr(ctx,bx,y-12,w,38,8); ctx.fill(); if(act){ ctx.strokeStyle='rgba(255,210,63,.9)'; ctx.lineWidth=1.5; ctx.stroke(); }
    txt(label,bx+8,y-1,p===me?'#ffd23f':'#fff',13,'left','900'); txt(sc+' 分　花 '+G.flowers[p].length,bx+8,y+15,'#cfe8d8',10);
    return bx+w;
  }
  function flowersRow(p,x,y){ G.flowers[p].forEach((id,i)=>drawTile(ctx,x+i*15,y,14,19,id)); }
  function meldTiles(p,m){ return m.t==='ankong'&&p!==me&&G.phase!=='end'?[-1,m.ids[1],m.ids[2],-1]:m.ids; }
  function discardsZone(p,pos){
    const ds=G.discards[p],tw=22,th=29,lastId=G.last&&G.last.p===p?G.last.id:-1;
    let x0,y0,cols;
    if(pos===0||pos===2){ cols=np===2?20:14; x0=W/2-cols*tw/2; y0=pos===0?300:92; }
    else { cols=5; x0=pos===3?132:W-132-cols*tw; y0=150; }
    ds.forEach((id,i)=>{ const r=Math.floor(i/cols),c=i%cols,lx=x0+c*tw,ly=y0+r*(th+2),isLast=id===lastId&&i===ds.length-1; drawTile(ctx,lx,ly,tw-1,th,id,{last:isLast});
      if(isLast&&G.phase==='claim'){ ctx.strokeStyle='rgba(255,210,63,'+(.5+.5*Math.sin(t*8))+')'; ctx.lineWidth=3; rr(ctx,lx-3,ly-3,tw+5,th+6,5); ctx.stroke(); } });
  }
  function draw(){
    layout.hand=[]; layout.btn=[];
    ctx.drawImage(tableArt(L.felt),0,0,W,H);
    if(!G.hands.length){ if(G.dice) drawDice(); else txt('等待房主擲骰…',W/2,H/2,'#fff',16,'center'); return; }
    // 中央：擲骰或發牌時顯示骰子，其他時候是圈風、局數、剩餘張數
    if(G.phase==='dice'||G.phase==='deal') drawDice(); else {
    const rw=HON[windOf()]; txt(rw+'風'+HON[np===2?[0,2][G.moves%np]:G.moves%np]+'局　'+LENNAME,W/2,214,'#ffe2a8',14,'center','900');
    txt('剩 '+Math.max(0,(G.wallN!=null&&client?G.wallN:G.wall.length)-RESERVE)+' 張'+(G.lian?'　連莊 '+G.lian:''),W/2,238,'#fff',13,'center');
    if(G.log) txt(G.log,W/2,264,'#cfe8d8',11,'center'); }
    // 輪到誰的指示
    { const pp=posOf(G.turn),ax=[W/2,W/2+86,W/2,W/2-86][pp],ay=[284,240,196,240][pp]; ctx.fillStyle='rgba(255,210,63,'+(.55+.4*Math.sin(t*5))+')'; ctx.beginPath(); ctx.arc(ax,ay,5,0,7); ctx.fill(); }
    for(let p=0;p<np;p++){ const pos=posOf(p); discardsZone(p,pos); if(p===me) continue;
      const n=G.hands[p].length,show=G.phase==='end';
      if(pos===2){ const tw=22,th=30,ms=G.melds[p],mw=ms.reduce((a,m)=>a+meldTiles(p,m).length*20+6,0),x0=W/2-(n*tw+mw)/2;
        for(let i=0;i<n;i++) drawTile(ctx,x0+i*tw,10,tw-1,th,show?sortIds(G.hands[p])[i]:-1);
        let mx=x0+n*tw+10; for(const m of ms){ meldTiles(p,m).forEach(id=>{ drawTile(ctx,mx,14,19,26,id); mx+=20; }); mx+=6; }
        const ex=info(p,W/2-60,58,'right'); flowersRow(p,W/2-50,46);
      } else {
        const left=pos===3,bx=left?14:W-14-28;
        for(let i=0;i<n;i++){ const id=show?sortIds(G.hands[p])[i]:-1; if(show) drawTile(ctx,bx,86+i*16,20,15,id); else { ctx.fillStyle='#1f7a4c'; rr(ctx,bx,86+i*15,28,14,3); ctx.fill(); ctx.fillStyle='#3fae74'; rr(ctx,bx+(left?0:4),86+i*15,24,12,3); ctx.fill(); } }
        G.melds[p].forEach((m,j)=>{ meldTiles(p,m).forEach((id,i)=>drawTile(ctx,left?50+i*19:W-50-19*4+i*19,86+j*30,18,25,id)); });
        info(p,left?14:W-14,48,left?'left':'right'); flowersRow(p,left?14:W-14-G.flowers[p].length*15,350);
      }
    }
    // 自己
    const myH=G.hands[me]||[],ms=G.melds[me]||[];
    let x=14; for(const m of ms){ meldTiles(me,m).forEach(id=>{ drawTile(ctx,x,448,27,37,id); x+=28; }); x+=8; }
    x+=6; const drawnShow=G.turn===me&&G.phase==='play'&&G.drawn>=0&&myH.includes(G.drawn);
    const list=sortIds(myH.filter(id=>!(drawnShow&&id===G.drawn))); if(drawnShow) list.push(G.drawn);
    const tw=Math.min(40,(W-x-20)/(list.length+.5));
    const use=new Set(); if(myClaim()){ const k=kindOf(G.claim.id); for(const o of G.claim.opts[me]){ if(o.c==='pong'||o.c==='kong') use.add(k); if(o.c==='chow') o.k.forEach(x=>use.add(x)); } }
    list.forEach((id,i)=>{ const gx=x+i*tw+(drawnShow&&i===list.length-1?10:0),up=id===sel?12:0; drawTile(ctx,gx,436-up,tw-2,52,id,{sel:id===sel}); layout.hand.push({id,x:gx,y:436-up,w:tw-2,h:52});
      if(use.has(kindOf(id))){ const bob=Math.sin(t*6)*2; ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.moveTo(gx+tw/2-1-6,424+bob); ctx.lineTo(gx+tw/2-1+6,424+bob); ctx.lineTo(gx+tw/2-1,432+bob); ctx.fill(); } });
    const ix=info(me,14,404,'left'); flowersRow(me,ix+8,394);
    // 按鈕
    let bx=W-14; const btn=(label,fn,hot)=>{ bx-=70; button(bx,388,64,34,label,fn,hot); };
    if(G.phase==='play'&&G.turn===me&&myH.length%3===2){
      if(sel>=0&&myH.includes(sel)) btn('打出',()=>doAct({a:'discard',id:sel}),true);
      for(const k of kongKinds(me).slice(0,2)) if(G.wallN==null||client?(G.wallN>RESERVE):(G.wall.length>RESERVE)) btn('槓 '+kname(k),()=>doAct({a:'kong',k}));
      if(canWin(myH,ms)) btn('自摸',()=>doAct({a:'tsumo'}),true);
      const hint=sel<0?'點一張牌選起來，再點一次打出':''; if(hint) txt(hint,W-14,370,'#ffe2a8',12,'right');
      if(TL) countdown(hint,12);
    }
    if(myClaim()) claimPanel();
    if(G.phase==='end'&&G.result) drawResult();
    if(msgT>0&&msg){ ctx.font='900 22px '+TC; const w=ctx.measureText(msg).width+40; ctx.fillStyle='rgba(11,10,28,.85)'; rr(ctx,W/2-w/2,150,w,40,10); ctx.fill(); txt(msg,W/2,171,'#ffd23f',22,'center','900'); }
  }
  let diceId=-1,diceAt=0;
  function drawDice(){
    const D=G.dice; if(D.id!==diceId){ diceId=D.id; diceAt=t; }
    const k=t-diceAt,rolling=k<1.3&&G.phase==='dice';
    for(let i=0;i<3;i++){ const v=rolling?1+Math.floor((t*14+i*3.7)%6):D.vals[i],j=rolling?Math.sin(t*30+i*2)*4:0; drawDie(ctx,W/2-56+i*40,206+j,32,v,rolling?Math.sin(t*20+i)*.5:(i-1)*.08); }
    if(rolling){ txt(names[D.who]+' 擲骰中…',W/2,262,'#ffe2a8',13,'center','900'); return; }
    const sum=D.vals.join('＋')+'＝'+D.total+' 點';
    if(D.kind==='dealer') txt(sum+'，數到 '+names[D.target]+' 起莊',W/2,262,'#ffe2a8',13,'center','900');
    else { txt(sum+'，從 '+names[D.target]+' 的牌牆第 '+D.total+' 墩開門',W/2,262,'#ffe2a8',13,'center','900'); if(G.phase==='deal') txt('發牌中…',W/2,282,'#cfe8d8',12,'center'); }
  }
  const myClaim=()=>G.phase==='claim'&&G.claim&&G.claim.opts[me]&&G.claim.resp[me]==null;
  // 每個選項畫出組成後的整組牌，被吃碰的那張用黃框標出來
  function claimPanel(){
    const C=G.claim,opts=C.opts[me],k=kindOf(C.id),cards=[];
    for(const o of opts) if(o.c==='hu') cards.push({label:'胡',tiles:[C.id],hi:0,r:{c:'hu'},hot:1});
    for(const o of opts) if(o.c==='kong') cards.push({label:'槓',tiles:[k*4,k*4+1,k*4+2,C.id],hi:3,r:{c:'kong'}});
    for(const o of opts) if(o.c==='pong') cards.push({label:'碰',tiles:[k*4,k*4+1,C.id],hi:2,r:{c:'pong'}});
    for(const o of opts) if(o.c==='chow'){ const ks=o.k.concat([k]).sort((a,b)=>a-b); cards.push({label:'吃',tiles:ks.map(x=>x===k?C.id:x*4),hi:ks.indexOf(k),r:o}); }
    cards.push({label:'過',tiles:[],r:{c:'pass'}});
    const tw=27,th=37,cw=c=>Math.max(60,c.tiles.length*(tw+1)+18),inner=cards.reduce((a,c)=>a+cw(c)+8,-8),pw=Math.max(inner,300)+24,px=W/2-pw/2,py=292,ph=108;
    ctx.fillStyle='rgba(8,6,20,.9)'; rr(ctx,px,py,pw,ph,12); ctx.fill(); ctx.strokeStyle='rgba(255,210,63,.85)'; ctx.lineWidth=2; ctx.stroke();
    const head=names[C.from]+' 打出'; txt(head,px+14,py+16,'#fff',14,'left','900'); ctx.font='900 14px '+TC; const hx=px+14+ctx.measureText(head).width+8;
    drawTile(ctx,hx,py+4,19,25,C.id,{sel:true}); txt('要吃、碰、槓或胡嗎？',hx+26,py+16,'#ffe2a8',13,'left','900');
    if(TL){ const left=Math.max(0,Math.ceil(TL-dispT)); txt('⏱ '+left+' 秒',px+pw-14,py+16,left<=5?'#ff6b6b':'#fff',left<=5?16:14,'right','900'); }
    let x=W/2-inner/2; const y=py+32;
    for(const c of cards){ const w=cw(c),hot=c.hot;
      ctx.fillStyle=hot?'#7a1f2a':c.label==='過'?'#2b2759':'#24406a'; rr(ctx,x,y,w,68,9); ctx.fill(); ctx.strokeStyle=hot?'#ffd23f':'rgba(255,255,255,.35)'; ctx.lineWidth=hot?2:1.2; ctx.stroke();
      if(c.tiles.length){ const tx=x+(w-c.tiles.length*(tw+1))/2; c.tiles.forEach((id,i)=>{ const gx=tx+i*(tw+1); if(i===c.hi){ ctx.fillStyle='rgba(255,210,63,'+(.45+.25*Math.sin(t*6))+')'; rr(ctx,gx-3,y+2,tw+6,th+9,6); ctx.fill(); } drawTile(ctx,gx,y+5,tw,th,id,{sel:i===c.hi}); }); txt(c.label,x+w/2,y+57,hot?'#ffd23f':'#fff',15,'center','900'); }
      else txt(c.label,x+w/2,y+34,'#cfe8d8',18,'center','900');
      layout.btn.push({x,y,w,h:68,fn:()=>doAct({a:'claim',r:c.r})}); x+=w+8; }
  }
  function countdown(hint,size){ ctx.font='900 '+size+'px '+TC; const hw=hint?ctx.measureText(hint).width+14:0,left=Math.max(0,Math.ceil(TL-dispT)); txt('⏱ '+left+' 秒',W-14-hw,370,left<=5?'#ff6b6b':'#fff',left<=5?17:15,'right','900'); }
  function drawResult(){
    const r=G.result; ctx.fillStyle='rgba(8,6,20,.82)'; rr(ctx,130,70,540,330,16); ctx.fill(); ctx.strokeStyle='rgba(222,184,96,.7)'; ctx.lineWidth=1.5; ctx.stroke();
    if(r.draw){ txt('流局',W/2,120,'#ffd23f',30,'center','900'); txt('牌摸完了，沒有人胡牌，莊家連莊。',W/2,160,'#fff',14,'center'); }
    else {
      txt(r.self?names[r.w]+'　自摸！':names[r.w]+'　胡牌！',W/2,104,'#ffd23f',26,'center','900');
      if(!r.self) txt(names[r.from]+' 放槍',W/2,132,'#ffb0b0',13,'center');
      let x=150; for(const m of G.melds[r.w]){ m.ids.forEach(id=>{ drawTile(ctx,x,148,22,30,id); x+=23; }); x+=6; }
      x+=6; sortIds(G.hands[r.w].filter(id=>id!==r.win)).forEach(id=>{ drawTile(ctx,x,148,22,30,id); x+=23; }); drawTile(ctx,x+8,148,22,30,r.win,{sel:true});
      const items=(r.items.length?r.items:[['無台（底分）',0]]).concat((r.dItems||[]).map(x=>[x[0]+(r.dealerWin?'':'（莊家付）'),x[1]]));
      items.forEach((it,i)=>{ const cx=170+(i%3)*170,cy=200+Math.floor(i/3)*22; txt(it[0]+'　'+it[1]+' 台',cx,cy,'#fff',13); });
      txt(r.dealerWin||!r.dItems||!r.dItems.length?'共 '+(r.tai+(r.dealerWin?r.dt:0))+' 台　'+(r.self?'每家':'放槍的人')+'付 '+(3+r.tai+(r.dealerWin?r.dt:0))+' 分':'共 '+r.tai+' 台（莊家另加 '+r.dt+' 台）',W/2,200+Math.ceil(items.length/3)*22+8,'#ffd23f',15,'center','900');
    }
    names.forEach((n,i)=>{ const d=r.delta[i]; txt(n+'　'+(d>0?'+':'')+d+'　（'+(G.scores[i]>0?'+':'')+G.scores[i]+'）',170+(i%2)*260,318+Math.floor(i/2)*22,d>0?'#86dc4f':d<0?'#ff8a8a':'#cfe8d8',13); });
    if(!client) button(W/2-60,356,120,34,!(r.draw||r.w===G.dealer)&&G.moves+1>=TARGET?'看總成績':'下一局',()=>doAct({a:'next'}),true);
    else txt('等房主開下一局…',W/2,372,'#cfe8d8',13,'center');
  }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',onDown); },_dbg:{G,shanten,aiDiscard,canWin,decomps,cnt,tally,discard,respond,tsumo,selfKong,nextHand,aiPlay,kindOf,get me(){return me;}}};
}

/* ---- 示意圖：一手好牌，最後一張摸進來自摸 ---- */
function thumb(ctx,w,h,t){
  ctx.save(); ctx.scale(w/W,w/W); ctx.translate(0,-60);
  ctx.drawImage(tableArt('#1d5e45'),0,0,W,H);
  const T=3,u=(t%T)/T,id=k=>k*4;
  const hand=[0,1,2,3,4,5,9,10,11,18,18,18,31,31,31,6].map(id);
  hand.forEach((x,i)=>drawTile(ctx,70+i*40,380,38,52,x));
  for(let i=0;i<14;i++) drawTile(ctx,250+i*22,150,21,28,-1);
  [27,13,22,8,30,15].forEach((k,i)=>drawTile(ctx,260+i*23,300,22,29,id(k)));
  const k=u<.4?0:Math.min(1,(u-.4)/.2),dx=70+16*40+14,dy=380-60*(1-k);
  if(u>.25) drawTile(ctx,dx,dy,38,52,id(6)+1,{sel:true});
  if(u>.62){ const a=Math.min(1,(u-.62)*8),sc=1+Math.max(0,.1-(u-.62))*6; ctx.globalAlpha=a; ctx.save(); ctx.translate(W/2,250); ctx.scale(sc,sc); ctx.rotate(-.08);
    ctx.fillStyle='#c62828'; rr(ctx,-110,-50,220,100,18); ctx.fill(); ctx.strokeStyle='#ffd23f'; ctx.lineWidth=5; ctx.stroke();
    ctx.font='900 64px '+TC; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#ffd23f'; ctx.fillText('自摸！',0,4); ctx.restore(); ctx.globalAlpha=1; }
  ctx.restore();
}
function preview(ctx,w,h,L,t){
  ctx.save(); ctx.scale(w/W,w/W); ctx.translate(0,-80); ctx.drawImage(tableArt(L.felt),0,0,W,H);
  [0,9,18,27,31,32,33,34].forEach((k,i)=>drawTile(ctx,150+i*64,250+Math.sin(t*2+i)*4,56,76,k===34?136:k*4));
  ctx.restore();
}

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).mahjong={
  name:'十六張麻將',tag:'MAHJONG 16',color:'#e8524a',online:true,maxPlayers:4,bots:true,minPlayers:2,netVariants:false,
  desc:'台灣十六張麻將：吃、碰、槓、補花、自摸、放槍、算台。可選四人麻將或雙人麻將，也可開房間 2～4 人連線，房主可以加電腦。',
  goal:'每人 16 張，湊成 5 組（順子或刻子）加 1 對就胡牌。輪到你時先摸一張，再點兩下打出一張；別人打出的牌可以碰、槓、胡，上家打的還可以吃。牌牆剩 16 張時流局，莊家胡牌或流局連莊。',
  variants:[{id:'4',label:'四人麻將'},{id:'2',label:'雙人麻將'}],
  options:[{key:'time',label:'打牌秒數',def:'20',opts:[{id:'10',label:'10 秒'},{id:'15',label:'15 秒'},{id:'20',label:'20 秒'},{id:'30',label:'30 秒'},{id:'0',label:'不限'}]},{key:'ai',label:'電腦強度',def:'normal',opts:[{id:'easy',label:'簡單'},{id:'normal',label:'中等'},{id:'hard',label:'困難'}]},{key:'len',label:'打多久',def:'c',opts:[{id:'q',label:'1/4 圈'},{id:'c',label:'1 圈'},{id:'j',label:'1 將'}]}],
  help:[['點牌','選起來（往上浮），再點一次打出'],['打出','打出選起來的牌'],['吃 碰 槓 胡','別人打牌時跳出來的按鈕，不要就按「過」'],['自摸／槓','輪到自己時出現']],
  touchHelp:[['點牌','選起來，再點一次打出'],['吃 碰 槓 胡','別人打牌時出現的按鈕，不要就按「過」'],['自摸／槓','輪到自己時出現']],
  touch:null,
  looks:[{key:'felt',label:'桌布顏色',type:'color',opts:['#1d5e45','#1f4f7a','#6b1f3a','#3a2d57','#5a4630','#2b2b33']}],
  best:{label:'最高得分',fmt:v=>'+'+v+' 分',lower:false},
  preview,thumb,create,_canWin:canWin,_decomps:decomps,_drawTile:drawTile
};
})();
