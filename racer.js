// 競速合集：飆風機車王、雪山大滑降、浪尖快艇賽、萌寵障礙賽跑。
// 共用一套「仿 3D 分段賽道」引擎：賽道切成一段一段，由近到遠投影到畫面上，彎道和坡度用每段的曲率、高度表現。
// 每款遊戲各自設定物理、場景、障礙物和人物；單人、雙人分割畫面、連線（每人算自己，房主算電腦）都共用。
(function(){
'use strict';
const W=800,H=500,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',PIX='"Press Start 2P","Noto Sans TC",monospace';
const SEGL=200,DRAW=160,RUMBLE=3,CDEPTH=1/Math.tan(50*Math.PI/180),ROADW=2000,POINTS=[10,8,6,5,4,3],NK0=6;
const COLORS=['#ff4d4d','#3d8bff','#ffd23f','#5fd068','#c56bff','#ff9d3d'];
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k,r2=v=>Math.round(v*100)/100;
function rng(s){ let h=2166136261; for(const ch of String(s)){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return ()=>{ h+=0x6D2B79F5; let t=h; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const rgbOf=h=>{ if(h[0]==='r') return h.slice(h.indexOf('(')+1).split(',').map(v=>parseFloat(v)); const n=parseInt(h.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; };
const mixC=(a,b,k)=>{ const A=rgbOf(a),B=rgbOf(b); return 'rgb('+Math.round(lerp(A[0],B[0],k))+','+Math.round(lerp(A[1],B[1],k))+','+Math.round(lerp(A[2],B[2],k))+')'; };
const shade=(h,f)=>{ const A=rgbOf(h); return 'rgb('+A.map(v=>clamp(Math.round(v*f),0,255)).join(',')+')'; };
const fmtTime=s=>{ const m=Math.floor(s/60),x=s-m*60; return m+':'+(x<10?'0':'')+x.toFixed(2); };

/* ================= 場景擺設（2D 手繪，x,y＝底部中央，w＝像素寬） ================= */
function glow(c,x,y,r,col){ const g=c.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.fillRect(x-r,y-r,r*2,r*2); }
/* 建物面向馬路的側牆：往畫面消失點延伸，近大遠小 */
function sideFace(c,x,y,w,h,th,col,ww,dep,w0,N,rows,rh,v){ const vx=th._cx,vy=th._hz; if(vx==null||w<8) return; const L=x-w*.5,R2=x+w*.5,ex=R2<vx?R2:L>vx?L:null; if(ex==null) return;
  const K=u=>1/(1+u*dep*w/(CDEPTH*vx)),P=(u,yy)=>[vx+(ex-vx)*K(u),vy+(yy-vy)*K(u)];
  const a=P(0,y),b=P(0,y-h),c2=P(1,y-h),d=P(1,y); c.fillStyle=col; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]); c.lineTo(c2[0],c2[1]); c.lineTo(d[0],d[1]); c.fill();
  c.fillStyle='rgba(0,0,0,.12)'; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]); const e=P(.12,y-h),f=P(.12,y); c.lineTo(e[0],e[1]); c.lineTo(f[0],f[1]); c.fill();
  if(rows&&w>60){ const q=(u0,u1,y0,y1,cl)=>{ const A=P(u0,y0),B=P(u1,y0),C2=P(u1,y1),D=P(u0,y1); c.fillStyle=cl; c.beginPath(); c.moveTo(A[0],A[1]); c.lineTo(B[0],B[1]); c.lineTo(C2[0],C2[1]); c.lineTo(D[0],D[1]); c.fill(); };
    for(let r=0;r<rows;r++){ const yy=y-h+w*.06+r*rh; for(let j=0;j<4;j++){ const hs=(v*13+r*7+j*5)%17; q(.08+j*.23,.22+j*.23,yy+rh*.2,yy+rh*.78,N?(hs<7?'#e8c070':'#141826'):'rgba(60,80,105,.75)'); } }
    q(0,1,y-w*.2,y,N?'rgba(255,214,140,.35)':'rgba(0,0,0,.22)'); } }
const SPR={
  tree:{ww:900,d(c,x,y,w,th,t,o){ const v=(o&&o.v)|0,N=th.night,base=th.tree||'#3f8f3a',dk=N?.4:1;
    c.fillStyle='rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x,y,w*.34,w*.06,0,0,7); c.fill();
    const tg=c.createLinearGradient(x-w*.06,0,x+w*.06,0); tg.addColorStop(0,shade('#7a5636',dk)); tg.addColorStop(1,shade('#3e2a18',dk)); c.fillStyle=tg; c.beginPath(); c.moveTo(x-w*.07,y); c.lineTo(x-w*.04,y-w*.6); c.lineTo(x+w*.04,y-w*.6); c.lineTo(x+w*.07,y); c.fill();
    if(w<14){ c.fillStyle=shade(base,dk); c.beginPath(); c.arc(x,y-w*.75,w*.42,0,7); c.fill(); return; }
    /* 樹冠：深色底、中間色、受光面三層，每棵形狀不同 */
    const bl=[[0,-.8,.4],[-.26,-.58,.28],[.27,-.6,.27],[-.12,-1.02,.26],[.16,-.98,.24],[-.34,-.8,.2],[.36,-.82,.19]];
    const lay=(col,dx,dy,k)=>{ c.fillStyle=col; c.beginPath(); for(let i=0;i<bl.length;i++){ const b=bl[i],j=((v*7+i*13)%10)/10-.5; c.moveTo(x+(b[0]+dx+j*.06)*w+b[2]*w*k,y+(b[1]+dy)*w); c.arc(x+(b[0]+dx+j*.06)*w,y+(b[1]+dy)*w,b[2]*w*k,0,7); } c.fill(); };
    lay(shade(base,.62*dk),.02,.03,1); lay(shade(base,.92*dk),-.01,0,.86); lay(shade(base,1.22*dk),-.07,-.06,.5);
    c.fillStyle=N?'rgba(255,255,255,.04)':'rgba(255,255,220,.16)'; c.beginPath(); c.arc(x-w*.16,y-w*1.02,w*.12,0,7); c.arc(x-w*.3,y-w*.76,w*.08,0,7); c.fill(); }},
  pine:{ww:800,d(c,x,y,w,th){ c.fillStyle='#5a3a22'; c.fillRect(x-w*.06,y-w*.3,w*.12,w*.3); for(let i=0;i<3;i++){ const yy=y-w*.25-i*w*.42,ww=w*(.5-i*.12); c.fillStyle=th.pine||'#2f6f3a'; c.beginPath(); c.moveTo(x-ww,yy); c.lineTo(x,yy-w*.6); c.lineTo(x+ww,yy); c.fill();
    if(th.snowy){ c.fillStyle='#fff'; c.beginPath(); c.moveTo(x-ww*.45,yy-w*.33); c.lineTo(x,yy-w*.6); c.lineTo(x+ww*.45,yy-w*.33); c.fill(); } } }},
  palm:{ww:900,d(c,x,y,w){ c.strokeStyle='#8a6a3a'; c.lineWidth=w*.08; c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x+w*.1,y-w*.6,x+w*.2,y-w*1.2); c.stroke(); c.fillStyle='#2f9a4a';
    for(let i=0;i<6;i++){ const a=-Math.PI/2+(i-2.5)*.5; c.beginPath(); c.ellipse(x+w*.2+Math.cos(a)*w*.32,y-w*1.2+Math.sin(a)*w*.12+w*.05,w*.34,w*.08,a,0,7); c.fill(); } }},
  bush:{ww:500,d(c,x,y,w,th){ c.fillStyle=th.bush||'#4f9a3f'; c.beginPath(); c.arc(x-w*.2,y-w*.2,w*.25,0,7); c.arc(x+w*.2,y-w*.2,w*.25,0,7); c.arc(x,y-w*.32,w*.3,0,7); c.fill(); if(th.flowers){ for(let i=0;i<5;i++){ c.fillStyle=['#ff7aa8','#ffd23f','#fff'][i%3]; c.beginPath(); c.arc(x+(i-2)*w*.16,y-w*(.25+(i%2)*.18),w*.05,0,7); c.fill(); } } }},
  rock:{ww:600,d(c,x,y,w,th){ c.fillStyle=th.rock||'#8a8580'; c.beginPath(); c.moveTo(x-w*.5,y); c.lineTo(x-w*.35,y-w*.45); c.lineTo(x+w*.05,y-w*.6); c.lineTo(x+w*.42,y-w*.38); c.lineTo(x+w*.5,y); c.fill(); c.fillStyle='rgba(255,255,255,.15)'; c.beginPath(); c.moveTo(x-w*.35,y-w*.45); c.lineTo(x+w*.05,y-w*.6); c.lineTo(x,y-w*.3); c.fill(); if(th.snowy){ c.fillStyle='#fff'; c.beginPath(); c.moveTo(x-w*.3,y-w*.45); c.lineTo(x+w*.05,y-w*.6); c.lineTo(x+w*.38,y-w*.4); c.lineTo(x,y-w*.47); c.fill(); } }},
  cliff:{ww:2600,d(c,x,y,w,th){ c.fillStyle=th.rock||'#7a7068'; c.beginPath(); c.moveTo(x-w*.5,y); c.lineTo(x-w*.42,y-w*.55); c.lineTo(x-w*.1,y-w*.75); c.lineTo(x+w*.25,y-w*.62); c.lineTo(x+w*.5,y-w*.3); c.lineTo(x+w*.5,y); c.fill(); c.fillStyle='rgba(0,0,0,.18)'; c.fillRect(x+w*.05,y-w*.6,w*.04,w*.6); c.fillRect(x-w*.3,y-w*.5,w*.03,w*.5); if(th.snowy){ c.fillStyle='#fff'; c.beginPath(); c.moveTo(x-w*.42,y-w*.55); c.lineTo(x-w*.1,y-w*.75); c.lineTo(x+w*.25,y-w*.62); c.lineTo(x,y-w*.6); c.fill(); } }},
  house:{ww:1100,d(c,x,y,w,th,t,o){ const cols=['#efe6d6','#e2d2b8','#d6dee6','#ecd8d2','#e8e4dc'],rf=['#a8452f','#7a4a2e','#3a5a86','#4f6a42','#5a5a62'],k=o.v|0,N=th.night,dk=N?.42:1,col=cols[k%5],L=x-w*.45;
    sideFace(c,x,y,w,w*.55,th,shade(col,.74*dk),1100,.7,w);
    const g=c.createLinearGradient(L,0,L+w*.9,0); g.addColorStop(0,shade(col,1.04*dk)); g.addColorStop(1,shade(col,.86*dk)); c.fillStyle=g; c.fillRect(L,y-w*.55,w*.9,w*.55);
    c.fillStyle='rgba(0,0,0,.12)'; c.fillRect(L,y-w*.08,w*.9,w*.08);
    const rg=c.createLinearGradient(0,y-w*.97,0,y-w*.55); rg.addColorStop(0,shade(rf[k%5],1.15*dk)); rg.addColorStop(1,shade(rf[k%5],.72*dk)); c.fillStyle=rg; c.beginPath(); c.moveTo(x-w*.56,y-w*.53); c.lineTo(x,y-w*.97); c.lineTo(x+w*.56,y-w*.53); c.fill();
    if(w>40){ c.strokeStyle='rgba(0,0,0,.14)'; c.lineWidth=Math.max(.5,w*.006); c.beginPath(); for(let i=1;i<6;i++){ const f=i/6; c.moveTo(x-w*.56*f,y-w*(.97-.44*f)); c.lineTo(x+w*.56*f,y-w*(.97-.44*f)); } c.stroke(); }
    c.fillStyle='rgba(0,0,0,.25)'; c.fillRect(L,y-w*.55,w*.9,w*.025);
    for(const wx of [-.32,.14]){ c.fillStyle=shade('#f4f4f0',dk); c.fillRect(x+w*wx-w*.015,y-w*.44,w*.21,w*.19); const gg=c.createLinearGradient(0,y-w*.43,0,y-w*.27); gg.addColorStop(0,N?'#ffe09a':'#b8d4ea'); gg.addColorStop(1,N?'#d89a4a':'#4a6680'); c.fillStyle=gg; c.fillRect(x+w*wx,y-w*.43,w*.18,w*.16);
      c.fillStyle='rgba(255,255,255,.5)'; c.fillRect(x+w*wx+w*.085,y-w*.43,w*.01,w*.16); c.fillStyle='rgba(0,0,0,.2)'; c.fillRect(x+w*wx-w*.02,y-w*.26,w*.22,w*.015); }
    c.fillStyle=shade('#6a4428',dk); c.fillRect(x-w*.08,y-w*.3,w*.16,w*.3); c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(x-w*.08,y-w*.3,w*.02,w*.3); c.fillStyle='#d8b060'; c.fillRect(x+w*.045,y-w*.15,w*.015,w*.015); }},
  building:{ww:1500,d(c,x,y,w,th,t,o){ const v=o.v|0,h=w*(1.1+(v%4)*.42+((v>>2)%3)*.16),cols=['#a7adb5','#c2b29a','#8f9fae','#b8b2a8','#d0c4b0','#9a948c'],base=cols[v%6],N=th.night,dk=N?.36:1,L=x-w*.5;
    const rows=Math.max(2,Math.floor(h/(w/6.5))),rh=(h-w*.24)/rows;
    sideFace(c,x,y,w,h,th,shade(base,.7*dk),1500,1,w,N,rows,rh,v);
    c.fillStyle=shade(base,1.02*dk); c.fillRect(L,y-h,w,h); c.fillStyle='rgba(0,0,0,.1)'; c.fillRect(L+w*.72,y-h,w*.28,h);
    if(w<18){ c.fillStyle=N?'rgba(255,215,120,.5)':'rgba(40,60,90,.35)'; for(let r=0;r<rows;r++) c.fillRect(L+w*.1,y-h+w*.06+r*rh+rh*.25,w*.8,rh*.4); return; }
    if(w<170){ /* 中距離：每層一條窗帶加窗框分隔，一樓店面和招牌色塊 */ const wc=shade(base,.98*dk); c.fillStyle=shade(base,.72*dk); c.fillRect(L-w*.01,y-h,w*1.02,w*.035);
      for(let r=0;r<rows;r++){ const yy=y-h+w*.06+r*rh+rh*.18; c.fillStyle=N?((v+r)%3?'#d8b46a':'#1c2030'):'#5a7088'; c.fillRect(L+w*.04,yy,w*.92,rh*.6); c.fillStyle=N?'rgba(255,255,255,.04)':'rgba(255,255,255,.18)'; c.fillRect(L+w*.04,yy,w*.92,rh*.18); }
      c.fillStyle=wc; for(let q=1;q<5;q++) c.fillRect(L+w*q/5-w*.03,y-h+w*.05,w*.06,h-w*.25);
      const gy=y-w*.2; c.fillStyle=N?'#c8a060':'#4a5260'; c.fillRect(L,gy,w,w*.2); c.fillStyle=['#c0392b','#1f6fb8','#e8a020','#2e8b57','#7a3ab8','#d0502a'][v%6]; c.fillRect(L,gy,w,w*.07); return; }
    /* 頂樓：女兒牆、水塔、天線 */
    c.fillStyle=shade(base,.72*dk); c.fillRect(L-w*.01,y-h,w*1.02,w*.035);
    if(v%3===0){ c.fillStyle=shade('#8a8a90',dk); c.fillRect(x+w*.12,y-h-w*.12,w*.025,w*.12); c.fillRect(x+w*.3,y-h-w*.12,w*.025,w*.12); const wg=c.createLinearGradient(x+w*.1,0,x+w*.36,0); wg.addColorStop(0,shade('#e8e8ec',dk)); wg.addColorStop(1,shade('#9a9aa4',dk)); c.fillStyle=wg; c.beginPath(); c.ellipse(x+w*.23,y-h-w*.2,w*.13,w*.1,0,0,7); c.fill(); }
    if(v%4===1){ c.strokeStyle=shade('#555',dk); c.lineWidth=Math.max(.6,w*.008); c.beginPath(); c.moveTo(x-w*.25,y-h); c.lineTo(x-w*.25,y-h-w*.28); c.moveTo(x-w*.32,y-h-w*.2); c.lineTo(x-w*.18,y-h-w*.2); c.stroke(); }
    if(v%5===2){ c.fillStyle=shade('#c8c4bc',dk); c.fillRect(x-w*.42,y-h-w*.1,w*.4,w*.1); c.fillStyle=shade('#5a7a9a',dk); c.fillRect(x-w*.44,y-h-w*.12,w*.44,w*.025); }
    /* 樓層：窗框、玻璃反光、冷氣、鐵窗 */
    const gl=c.createLinearGradient(0,y-h,0,y); gl.addColorStop(0,N?'#2a3048':'#d4e6f6'); gl.addColorStop(.5,N?'#1c2030':'#7f9bb6'); gl.addColorStop(1,N?'#14182a':'#3e5068'); const cw=w/5;
    for(let r=0;r<rows;r++){ const yy=y-h+w*.06+r*rh; c.fillStyle='rgba(255,255,255,'+(N?.03:.16)+')'; c.fillRect(L,yy+rh*.86,w,Math.max(.6,rh*.06)); c.fillStyle='rgba(0,0,0,.1)'; c.fillRect(L,yy+rh*.92,w,Math.max(.6,rh*.05));
      for(let q=0;q<5;q++){ const hs=(v*31+r*17+q*7)%23,wx=L+cw*q+cw*.16,ww=cw*.68,wy=yy+rh*.18,wh=rh*.6;
        c.fillStyle=shade('#3a3e46',dk); c.fillRect(wx-ww*.05,wy-wh*.06,ww*1.1,wh*1.12);
        if(N){ c.fillStyle=hs<9?'#ffd98a':hs<12?'#cfe4ff':'#1a1e2c'; c.fillRect(wx,wy,ww,wh); if(hs<9){ c.fillStyle='rgba(120,70,30,.35)'; c.fillRect(wx,wy,ww*.3,wh); } }
        else { c.fillStyle=gl; c.fillRect(wx,wy,ww,wh); if(hs<5){ c.fillStyle='rgba(240,232,214,.85)'; c.fillRect(wx,wy,ww*.42,wh); } c.fillStyle='rgba(255,255,255,.28)'; c.beginPath(); c.moveTo(wx+ww*.55,wy); c.lineTo(wx+ww*.8,wy); c.lineTo(wx+ww*.45,wy+wh); c.lineTo(wx+ww*.2,wy+wh); c.fill(); }
        c.fillStyle='rgba(0,0,0,.35)'; c.fillRect(wx+ww*.48,wy,Math.max(.5,ww*.04),wh);
        if(w>60&&hs%6===1){ c.fillStyle=shade('#e6e6e2',dk); c.fillRect(wx+ww*.15,wy+wh*.92,ww*.7,wh*.42); c.fillStyle='rgba(0,0,0,.3)'; for(let k2=0;k2<3;k2++) c.fillRect(wx+ww*(.22+k2*.2),wy+wh*1.02,ww*.1,wh*.28); }
        if(w>60&&hs%7===3){ c.strokeStyle=shade('#4a4e56',dk); c.lineWidth=Math.max(.5,w*.004); c.beginPath(); for(let k2=0;k2<=4;k2++){ c.moveTo(wx-ww*.08+ww*1.16*k2/4,wy-wh*.1); c.lineTo(wx-ww*.08+ww*1.16*k2/4,wy+wh*1.08); } c.stroke(); } } }
    /* 一樓店面：雨遮、招牌、玻璃門 */
    const gy=y-w*.2; c.fillStyle=N?'#3a2e22':shade('#4a4a50',dk); c.fillRect(L,gy,w,w*.2);
    c.fillStyle=N?'#ffdf9e':'#6a7c8c'; c.fillRect(L+w*.06,gy+w*.07,w*.88,w*.13); c.fillStyle=N?'rgba(255,180,90,.5)':'rgba(255,255,255,.25)'; c.fillRect(L+w*.06,gy+w*.07,w*.88,w*.02);
    c.fillStyle='rgba(0,0,0,.35)'; for(let k2=1;k2<4;k2++) c.fillRect(L+w*.06+w*.22*k2,gy+w*.07,Math.max(.6,w*.008),w*.13);
    const sc=['#c0392b','#1f6fb8','#e8a020','#2e8b57','#7a3ab8','#d0502a'][v%6]; c.fillStyle=shade(sc,N?1:.95); c.fillRect(L,gy-w*.005,w,w*.07);
    if(N){ c.globalAlpha*=.3; c.fillRect(L-w*.02,gy-w*.03,w*1.04,w*.12); c.globalAlpha/=.3; c.fillStyle=shade(sc,1); c.fillRect(L,gy-w*.005,w,w*.07); }
    c.fillStyle='#fff'; c.font='900 '+Math.max(4,w*.05)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(['便利商店','珍珠奶茶','牛肉麵','藥局','機車行','咖啡','早餐店','眼鏡'][v%8],x,gy+w*.03);
    c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); c.moveTo(L,gy+w*.065); c.lineTo(L+w,gy+w*.065); c.lineTo(L+w*1.02,gy+w*.1); c.lineTo(L-w*.02,gy+w*.1); c.fill();
    if(v%3===1&&w>40){ const vx2=L+(x<(th._cx||0)?w*.86:w*.04); c.fillStyle=shade(['#d03a2a','#1f5fa8','#e0b020'][v%3],N?1.1:1); c.fillRect(vx2,y-h*.62,w*.1,h*.36); c.fillStyle='#fff'; c.font='900 '+Math.max(4,w*.06)+'px '+TC; for(let k2=0;k2<3;k2++) c.fillText(['旅','診','補','當','銀','髮'][(v+k2)%6],vx2+w*.05,y-h*.62+h*.36*(k2+.5)/3); } }},
  neon:{ww:1400,d(c,x,y,w,th,t,o){ const h=w*(1.4+(o.v%3)*.5); c.fillStyle='#181428'; c.fillRect(x-w*.5,y-h,w,h); const cl=['#ff3bd4','#3ddbd9','#ffd23f','#7a5aff'][o.v%4];
    for(let r=1;r*w*.14<h-w*.1;r++) for(let q=0;q<5;q++){ if((o.v+r*q)%3) { c.fillStyle='rgba(255,220,140,.7)'; c.fillRect(x-w*.42+q*w*.18,y-h+r*w*.14,w*.08,w*.06); } }
    c.save(); c.shadowColor=cl; c.shadowBlur=w*.1; c.fillStyle=cl; c.fillRect(x-w*.42,y-h*.62,w*.84,w*.12); c.restore(); c.fillStyle='#14122b'; c.font='900 '+Math.max(4,w*.09)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(['夜市','卡拉OK','拉麵','電玩'][o.v%4],x,y-h*.62+w*.06); }},
  lamp:{ww:300,d(c,x,y,w,th,t,o){ const h=w*3.3,s=o.x>0?-1:1,N=th.night,lw=Math.max(1,w*.07);
    c.fillStyle='#4a4e56'; c.fillRect(x-lw*.9,y-w*.25,lw*1.8,w*.25);
    const pg=c.createLinearGradient(x-lw/2,0,x+lw/2,0); pg.addColorStop(0,'#8a8e96'); pg.addColorStop(1,'#3a3e46'); c.fillStyle=pg; c.fillRect(x-lw/2,y-h,lw,h);
    c.strokeStyle='#5a5e66'; c.lineWidth=lw*.8; c.beginPath(); c.moveTo(x,y-h+w*.05); c.quadraticCurveTo(x,y-h-w*.12,x+s*w*.35,y-h-w*.1); c.lineTo(x+s*w*.7,y-h-w*.08); c.stroke();
    c.fillStyle='#3a3e46'; c.beginPath(); c.ellipse(x+s*w*.68,y-h-w*.06,w*.17,w*.05,0,0,7); c.fill(); c.fillStyle=N?'#fff6d0':'#e8eef2'; c.beginPath(); c.ellipse(x+s*w*.68,y-h-w*.03,w*.12,w*.025,0,0,7); c.fill();
    if(N){ glow(c,x+s*w*.68,y-h,w*1.1,'rgba(255,226,150,.5)'); c.fillStyle='rgba(255,220,140,.07)'; c.beginPath(); c.moveTo(x+s*w*.6,y-h); c.lineTo(x+s*w*.76,y-h); c.lineTo(x+s*w*1.9,y); c.lineTo(x-s*w*.5,y); c.fill(); } }},
  post:{ww:120,d(c,x,y,w,th){ c.fillStyle='#f4f4f4'; c.fillRect(x-w*.25,y-w*2.2,w*.5,w*2.2); c.fillStyle=th.post||'#e23b3b'; c.fillRect(x-w*.25,y-w*1.9,w*.5,w*.4); }},
  billboard:{ww:1100,d(c,x,y,w,th,t,o){ const v=o.v|0,N=th.night,dk=N?.45:1; c.fillStyle=shade('#5a5e66',dk);
    for(const lx of [-.3,.26]){ c.fillRect(x+w*lx,y-w*.62,w*.04,w*.62); } c.strokeStyle=shade('#6a6e76',dk); c.lineWidth=Math.max(.5,w*.008); c.beginPath(); for(let i=0;i<4;i++){ const yy=y-w*.15*i; c.moveTo(x-w*.28,yy); c.lineTo(x+w*.28,yy-w*.15); } c.stroke();
    c.fillStyle=shade('#2a2c32',dk); c.fillRect(x-w*.53,y-w*1.08,w*1.06,w*.54);
    const ad=[['#e8352a','#ff8a4a','鮮奶茶 買一送一'],['#1f5fb8','#4fb0f0','5G 吃到飽'],['#f0b020','#ffe080','新成屋 熱銷中'],['#2e8b57','#7ad08a','機車保養 85 折']][v%4];
    const g=c.createLinearGradient(x-w*.5,0,x+w*.5,0); g.addColorStop(0,shade(ad[0],dk)); g.addColorStop(1,shade(ad[1],dk)); c.fillStyle=g; c.fillRect(x-w*.5,y-w*1.05,w,w*.48);
    c.fillStyle='rgba(255,255,255,.85)'; c.beginPath(); c.arc(x+w*.3,y-w*.81,w*.15,0,7); c.fill(); c.fillStyle=shade(ad[0],dk); c.beginPath(); c.arc(x+w*.3,y-w*.81,w*.1,0,7); c.fill();
    c.fillStyle='#fff'; c.font='900 '+Math.max(4,w*.085)+'px '+TC; c.textAlign='left'; c.textBaseline='middle'; c.fillText(ad[2],x-w*.44,y-w*.84,w*.62);
    c.fillStyle='rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(x-w*.5,y-w*1.05); c.lineTo(x-w*.1,y-w*1.05); c.lineTo(x-w*.3,y-w*.57); c.lineTo(x-w*.5,y-w*.57); c.fill();
    if(N){ for(let i=0;i<3;i++) glow(c,x-w*.35+i*w*.35,y-w*1.1,w*.25,'rgba(255,240,200,.35)'); } }},
  sign:{ww:420,d(c,x,y,w,th,t,o){ c.fillStyle='#4a4a55'; c.fillRect(x-w*.04,y-w*.7,w*.08,w*.7); c.fillStyle='#ffd23f'; c.fillRect(x-w*.5,y-w*1.15,w,w*.5); c.fillStyle='#14122b'; const s=o.d>0?1:-1;
    for(let i=0;i<2;i++){ const cx=x+(i-.5)*w*.38; c.beginPath(); c.moveTo(cx-s*w*.12,y-w*1.08); c.lineTo(cx+s*w*.1,y-w*.9); c.lineTo(cx-s*w*.12,y-w*.72); c.lineTo(cx-s*w*.02,y-w*.9); c.fill(); } }},
  container:{ww:1300,d(c,x,y,w,th,t,o){ const cl=['#c0392b','#2f6fd0','#2e9e4f','#e0a020','#7a4ac8'][o.v%5]; for(let r=0;r<1+(o.v%2);r++){ c.fillStyle=shade(cl,1-r*.15); c.fillRect(x-w*.5,y-w*.36*(r+1),w,w*.36); c.fillStyle='rgba(0,0,0,.2)'; for(let q=1;q<10;q++) c.fillRect(x-w*.5+q*w*.1,y-w*.36*(r+1),w*.012,w*.36); } }},
  crane:{ww:1400,d(c,x,y,w){ c.strokeStyle='#e0a020'; c.lineWidth=Math.max(1,w*.03); c.beginPath(); c.moveTo(x-w*.2,y); c.lineTo(x-w*.2,y-w*1.4); c.moveTo(x+w*.05,y); c.lineTo(x+w*.05,y-w*1.4); c.moveTo(x-w*.5,y-w*1.4); c.lineTo(x+w*.5,y-w*1.4); c.moveTo(x-w*.2,y-w*.7); c.lineTo(x+w*.05,y-w*1.1); c.stroke(); c.fillStyle='#3a3a48'; c.fillRect(x+w*.3,y-w*1.3,w*.02,w*.5); }},
  tower:{ww:900,d(c,x,y,w){ c.fillStyle='#9aa0aa'; c.fillRect(x-w*.08,y-w*2.4,w*.16,w*2.4); c.fillStyle='#6a6e78'; c.fillRect(x-w*.5,y-w*2.4,w,w*.1); c.strokeStyle='#4a4e58'; c.lineWidth=Math.max(1,w*.02); c.beginPath(); c.moveTo(x-w*.5,y-w*2.35); c.lineTo(x,y-w*1.6); c.lineTo(x+w*.5,y-w*2.35); c.stroke(); }},
  // 雪地
  snowman:{ww:500,d(c,x,y,w){ c.fillStyle='#fff'; c.beginPath(); c.arc(x,y-w*.3,w*.32,0,7); c.arc(x,y-w*.78,w*.23,0,7); c.fill(); c.fillStyle='#14122b'; c.beginPath(); c.arc(x-w*.07,y-w*.82,w*.03,0,7); c.arc(x+w*.07,y-w*.82,w*.03,0,7); c.fill(); c.fillStyle='#ff8a1a'; c.beginPath(); c.moveTo(x,y-w*.76); c.lineTo(x+w*.15,y-w*.73); c.lineTo(x,y-w*.7); c.fill(); c.fillStyle='#e23b3b'; c.fillRect(x-w*.2,y-w*.6,w*.4,w*.06); }},
  cabin:{ww:1200,d(c,x,y,w,th){ c.fillStyle='#8a5a32'; c.fillRect(x-w*.42,y-w*.5,w*.84,w*.5); c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=Math.max(1,w*.01); for(let i=1;i<6;i++){ c.beginPath(); c.moveTo(x-w*.42,y-i*w*.083); c.lineTo(x+w*.42,y-i*w*.083); c.stroke(); }
    c.fillStyle='#fff'; c.beginPath(); c.moveTo(x-w*.55,y-w*.48); c.lineTo(x,y-w*.9); c.lineTo(x+w*.55,y-w*.48); c.fill(); c.fillStyle=th.night?'#ffd77a':'#bfe0f4'; c.fillRect(x-w*.12,y-w*.36,w*.24,w*.18); }},
  lift:{ww:600,d(c,x,y,w){ c.fillStyle='#9aa0aa'; c.fillRect(x-w*.06,y-w*3,w*.12,w*3); c.fillRect(x-w*.6,y-w*3,w*1.2,w*.1); c.strokeStyle='#4a4e58'; c.lineWidth=Math.max(1,w*.02); c.beginPath(); c.moveTo(x-w*4,y-w*2.95); c.lineTo(x+w*4,y-w*2.95); c.stroke(); }},
  pole:{ww:120,d(c,x,y,w){ c.fillStyle='#ff7a1a'; c.fillRect(x-w*.2,y-w*2.4,w*.4,w*2.4); c.fillStyle='#14122b'; c.fillRect(x-w*.2,y-w*1.2,w*.4,w*.3); }},
  lantern:{ww:300,d(c,x,y,w,th){ c.fillStyle='#5a3a22'; c.fillRect(x-w*.05,y-w*2,w*.1,w*2); c.fillStyle='#e23b3b'; c.beginPath(); c.ellipse(x,y-w*2.1,w*.2,w*.26,0,0,7); c.fill(); if(th.night) glow(c,x,y-w*2.1,w*1.1,'rgba(255,160,80,.5)'); }},
  // 水上
  island:{ww:1400,d(c,x,y,w){ c.fillStyle='#e8d49a'; c.beginPath(); c.ellipse(x,y,w*.5,w*.12,0,Math.PI,0); c.fill(); SPR.palm.d(c,x-w*.1,y-w*.05,w*.65); }},
  buoy:{ww:160,d(c,x,y,w,th,t,o){ const b=Math.sin(t*3+(o.v||0))*w*.08; c.fillStyle=o.v%2?'#ff4d4d':'#ffffff'; c.beginPath(); c.arc(x,y-w*.35+b,w*.4,0,7); c.fill(); c.fillStyle='#ff4d4d'; c.fillRect(x-w*.06,y-w*1.1+b,w*.12,w*.5); }},
  lighthouse:{ww:900,d(c,x,y,w,th){ SPR.rock.d(c,x,y,w,th); c.fillStyle='#f4f4f4'; c.beginPath(); c.moveTo(x-w*.16,y-w*.45); c.lineTo(x-w*.1,y-w*1.6); c.lineTo(x+w*.1,y-w*1.6); c.lineTo(x+w*.16,y-w*.45); c.fill(); c.fillStyle='#e23b3b'; c.fillRect(x-w*.14,y-w*1.0,w*.28,w*.15); c.fillRect(x-w*.12,y-w*1.4,w*.24,w*.14); c.fillStyle='#ffe58a'; c.fillRect(x-w*.08,y-w*1.75,w*.16,w*.15); if(th.night) glow(c,x,y-w*1.68,w*.9,'rgba(255,240,160,.6)'); }},
  boat:{ww:900,d(c,x,y,w,th,t,o){ const b=Math.sin(t*2+o.v)*w*.03; c.fillStyle=['#f4f4f4','#ffd23f','#3d8bff'][o.v%3]; c.beginPath(); c.moveTo(x-w*.5,y-w*.25+b); c.lineTo(x+w*.5,y-w*.25+b); c.lineTo(x+w*.36,y+b); c.lineTo(x-w*.36,y+b); c.fill(); c.fillStyle='#fff'; c.fillRect(x-w*.15,y-w*.45+b,w*.3,w*.2); c.fillStyle='#8a6a3a'; c.fillRect(x-w*.01,y-w*1.0+b,w*.02,w*.75); c.fillStyle='#f4f0e0'; c.beginPath(); c.moveTo(x+w*.02,y-w*.95+b); c.lineTo(x+w*.3,y-w*.4+b); c.lineTo(x+w*.02,y-w*.4+b); c.fill(); }},
  iceberg:{ww:1300,d(c,x,y,w){ c.fillStyle='#e8f6ff'; c.beginPath(); c.moveTo(x-w*.5,y); c.lineTo(x-w*.3,y-w*.5); c.lineTo(x-w*.05,y-w*.8); c.lineTo(x+w*.2,y-w*.45); c.lineTo(x+w*.5,y); c.fill(); c.fillStyle='rgba(120,190,230,.45)'; c.beginPath(); c.moveTo(x-w*.05,y-w*.8); c.lineTo(x+w*.2,y-w*.45); c.lineTo(x+w*.5,y); c.lineTo(x+w*.05,y); c.fill(); }},
  mangrove:{ww:900,d(c,x,y,w){ c.strokeStyle='#5a4a32'; c.lineWidth=Math.max(1,w*.03); for(let i=-2;i<=2;i++){ c.beginPath(); c.moveTo(x+i*w*.12,y); c.quadraticCurveTo(x+i*w*.05,y-w*.3,x,y-w*.45); c.stroke(); } c.fillStyle='#2f7a3a'; c.beginPath(); c.arc(x,y-w*.7,w*.35,0,7); c.arc(x-w*.25,y-w*.55,w*.22,0,7); c.arc(x+w*.25,y-w*.55,w*.22,0,7); c.fill(); }},
  temple:{ww:1500,d(c,x,y,w){ c.fillStyle='#c8402a'; c.fillRect(x-w*.38,y-w*.6,w*.08,w*.6); c.fillRect(x+w*.3,y-w*.6,w*.08,w*.6); c.fillStyle='#2a6a5a'; c.beginPath(); c.moveTo(x-w*.5,y-w*.6); c.lineTo(x+w*.5,y-w*.6); c.lineTo(x+w*.4,y-w*.78); c.lineTo(x-w*.4,y-w*.78); c.fill(); c.fillStyle='#d9b44a'; c.fillRect(x-w*.5,y-w*.62,w,w*.04); }},
  waterfall:{ww:2200,d(c,x,y,w,th,t){ SPR.cliff.d(c,x,y,w,th); c.fillStyle='rgba(220,240,255,.85)'; c.fillRect(x-w*.12,y-w*.68,w*.16,w*.68); c.fillStyle='rgba(255,255,255,.7)'; for(let i=0;i<5;i++){ const yy=y-w*.68+((t*w*.4+i*w*.14)%(w*.68)); c.fillRect(x-w*.1,yy,w*.12,w*.02); } }},
  // 跑步
  crowd:{ww:1600,d(c,x,y,w,th,t,o){ c.fillStyle='#8a8f9a'; c.fillRect(x-w*.5,y-w*.35,w,w*.35); for(let r=0;r<3;r++) for(let q=0;q<12;q++){ const cl=['#ff6f6f','#ffd23f','#5ac8ff','#7ad85a','#ff9ae0','#fff'][(q*3+r+o.v)%6],j=Math.abs(Math.sin(t*6+q+r))*w*.02; c.fillStyle=cl; c.beginPath(); c.arc(x-w*.46+q*w*.083,y-w*.08-r*w*.1-j,w*.03,0,7); c.fill(); } }},
  balloon:{ww:400,d(c,x,y,w,th,t,o){ c.strokeStyle='#888'; c.lineWidth=1; c.beginPath(); c.moveTo(x,y); c.lineTo(x,y-w*1.5); c.stroke(); for(let i=0;i<3;i++){ c.fillStyle=['#ff4d6d','#ffd23f','#5ac8ff'][(i+o.v)%3]; c.beginPath(); c.ellipse(x+(i-1)*w*.25,y-w*1.7-Math.sin(t*2+i)*w*.05-(i%2)*w*.15,w*.18,w*.22,0,0,7); c.fill(); } }},
  mushroom:{ww:700,d(c,x,y,w,th,t,o){ c.fillStyle='#f4ead2'; c.fillRect(x-w*.12,y-w*.5,w*.24,w*.5); c.fillStyle=['#e8402a','#3a7fe0','#4fb84a'][o.v%3]; c.beginPath(); c.ellipse(x,y-w*.5,w*.48,w*.36,0,Math.PI,0); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(x-w*.2,y-w*.66,w*.07,0,7); c.arc(x+w*.15,y-w*.72,w*.08,0,7); c.arc(x+w*.02,y-w*.55,w*.05,0,7); c.fill(); }},
  candy:{ww:500,d(c,x,y,w,th,t,o){ c.fillStyle='#fff'; c.fillRect(x-w*.04,y-w*1.2,w*.08,w*1.2); const cl=['#ff5a8a','#5ac8ff','#ffd23f','#7ad85a'][o.v%4]; c.fillStyle=cl; c.beginPath(); c.arc(x,y-w*1.4,w*.32,0,7); c.fill(); c.strokeStyle='#fff'; c.lineWidth=Math.max(1,w*.05); c.beginPath(); for(let a=0;a<12;a+=.3){ const rr2=a*w*.026; c.lineTo(x+Math.cos(a)*rr2,y-w*1.4+Math.sin(a)*rr2); } c.stroke(); }},
  hedge:{ww:1400,d(c,x,y,w,th){ c.fillStyle=th.bush||'#3f7f3a'; rr(c,x-w*.5,y-w*.45,w,w*.45,w*.06); c.fill(); c.fillStyle='rgba(255,255,255,.08)'; c.fillRect(x-w*.5,y-w*.45,w,w*.06); }},
  castle:{ww:1300,d(c,x,y,w){ c.fillStyle='#9a958c'; c.fillRect(x-w*.4,y-w*.9,w*.25,w*.9); c.fillRect(x+w*.15,y-w*.9,w*.25,w*.9); c.fillRect(x-w*.2,y-w*.6,w*.4,w*.6); c.fillStyle='#6a3a5a'; for(const xx of [-.275,.275]){ c.beginPath(); c.moveTo(x+(xx-.15)*w,y-w*.9); c.lineTo(x+xx*w,y-w*1.25); c.lineTo(x+(xx+.15)*w,y-w*.9); c.fill(); } c.fillStyle='#4a3a2a'; c.beginPath(); c.arc(x,y-w*.2,w*.1,Math.PI,0); c.fillRect(x-w*.1,y-w*.2,w*.2,w*.2); c.fill(); }},
  cloud:{ww:1200,d(c,x,y,w){ c.fillStyle='#ffffff'; c.beginPath(); c.arc(x-w*.25,y-w*.2,w*.22,0,7); c.arc(x+w*.2,y-w*.22,w*.25,0,7); c.arc(x,y-w*.35,w*.28,0,7); c.fill(); }},
  volcano:{ww:2400,d(c,x,y,w,th,t){ c.fillStyle='#4a332e'; c.beginPath(); c.moveTo(x-w*.5,y); c.lineTo(x-w*.12,y-w*.55); c.lineTo(x+w*.12,y-w*.55); c.lineTo(x+w*.5,y); c.fill(); c.fillStyle='#ff6a1a'; c.beginPath(); c.moveTo(x-w*.12,y-w*.55); c.lineTo(x-w*.05,y-w*.3); c.lineTo(x+w*.03,y-w*.45); c.lineTo(x+w*.12,y-w*.55); c.fill(); glow(c,x,y-w*.6,w*.25,'rgba(255,120,40,.5)'); }},
  bamboo:{ww:500,d(c,x,y,w){ for(let i=-2;i<=2;i++){ c.fillStyle=i%2?'#6fbf4a':'#5fa83f'; c.fillRect(x+i*w*.18-w*.04,y-w*(2.4+(i&1)*.4),w*.08,w*(2.4+(i&1)*.4)); } }},
  flagarch:{ww:4800,d(c,x,y,w,th,t,o){ c.fillStyle='#3a3a48'; c.fillRect(x-w*.5,y-w*.32,w*.03,w*.32); c.fillRect(x+w*.47,y-w*.32,w*.03,w*.32); const n=16; for(let i=0;i<n;i++) for(let j=0;j<2;j++){ c.fillStyle=(i+j)%2?'#14122b':'#ffffff'; c.fillRect(x-w*.5+i*w/n,y-w*.34+j*w*.025,w/n+.5,w*.025); }
    c.fillStyle='#ffd23f'; c.font='900 '+Math.max(4,w*.035)+'px '+PIX; c.textAlign='center'; c.textBaseline='middle'; c.fillText(o.label||'FINISH',x,y-w*.27); }}
};

/* ================= 障礙物、道具 ================= */
const OBS={
  car:{d(c,x,y,w,th,t,o){ { const M=carModel(o),S3=v3get(M.key,M.build,'back',o.big?6.2:5.6); if(S3){ c.fillStyle='rgba(0,0,0,.32)'; c.beginPath(); c.ellipse(x,y,w*.55,w*.08,0,0,7); c.fill(); v3draw(c,S3,v3frame(x),x,y,w*.44);
      const h=w*(o.big?1.0:.62); if(th.night){ glow(c,x-w*.32,y-h*.62,w*.25,'rgba(255,40,40,.45)'); glow(c,x+w*.32,y-h*.62,w*.25,'rgba(255,40,40,.45)'); }
      if(o.blink&&Math.floor(t*4)%2){ const bx=x+o.blink*w*.4; glow(c,bx,y-h*.62,w*.3,'rgba(255,180,40,.75)'); } return; } }
    const h=w*(o.big?.95:.62),cl=o.col||'#3d8bff'; c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x,y,w*.55,w*.08,0,0,7); c.fill();
    c.fillStyle='#1a1a1e'; c.fillRect(x-w*.46,y-w*.16,w*.16,w*.16); c.fillRect(x+w*.3,y-w*.16,w*.16,w*.16);
    c.fillStyle=cl; rr(c,x-w*.5,y-h,w,h-w*.08,w*.08); c.fill(); if(!o.big){ c.fillStyle=th.night?'#1a1e2a':'#8fb4d4'; rr(c,x-w*.36,y-h+w*.05,w*.72,h*.32,w*.05); c.fill(); }
    else { c.fillStyle='rgba(0,0,0,.15)'; c.fillRect(x-w*.5,y-h*.55,w,w*.02); }
    c.fillStyle='#ff2a2a'; c.fillRect(x-w*.46,y-h*.42,w*.16,w*.07); c.fillRect(x+w*.3,y-h*.42,w*.16,w*.07); if(th.night){ glow(c,x-w*.38,y-h*.38,w*.25,'rgba(255,40,40,.45)'); glow(c,x+w*.38,y-h*.38,w*.25,'rgba(255,40,40,.45)'); }
    c.fillStyle='#f4f4f4'; c.fillRect(x-w*.12,y-h*.3,w*.24,w*.07);
    if(o.blink&&Math.floor(t*4)%2){ const bx=x+o.blink*w*.44; c.fillStyle='#ffb020'; c.fillRect(bx-w*.06,y-h*.46,w*.12,w*.07); glow(c,bx,y-h*.43,w*.3,'rgba(255,180,40,.6)'); } }},
  cone:{d(c,x,y,w){ c.fillStyle='#ff7a1a'; c.beginPath(); c.moveTo(x-w*.4,y); c.lineTo(x,y-w*1.1); c.lineTo(x+w*.4,y); c.fill(); c.fillStyle='#fff'; c.fillRect(x-w*.22,y-w*.6,w*.44,w*.14); }},
  barrier:{d(c,x,y,w){ c.fillStyle='#3a3a48'; c.fillRect(x-w*.42,y-w*.32,w*.05,w*.32); c.fillRect(x+w*.37,y-w*.32,w*.05,w*.32); for(let i=0;i<8;i++){ c.fillStyle=i%2?'#ff7a1a':'#f4f4f4'; c.fillRect(x-w*.5+i*w/8,y-w*.36,w/8+.5,w*.13); } }},
  tree:{d(c,x,y,w,th){ SPR.pine.d(c,x,y,w*1.4,th); }},
  rock:{d(c,x,y,w,th){ SPR.rock.d(c,x,y,w,th); }},
  gate:{d(c,x,y,w,th,t,o){ const cl=o.col||'#ff4d4d'; for(const s of [-1,1]){ const px=x+s*w*.5; c.fillStyle='#f4f4f4'; c.fillRect(px-w*.015,y-w*.38,w*.03,w*.38); c.fillStyle=cl; c.beginPath(); c.moveTo(px,y-w*.38); c.lineTo(px-s*w*.16,y-w*.33); c.lineTo(px,y-w*.27); c.fill(); } }},
  ramp:{d(c,x,y,w,th,t,o){ c.fillStyle=o.water?'#5ac8ff':th.snowy?'#e8f2fb':'#ffd23f'; c.beginPath(); c.moveTo(x-w*.5,y); c.lineTo(x-w*.42,y-w*.12); c.lineTo(x+w*.42,y-w*.12); c.lineTo(x+w*.5,y); c.fill();
    c.fillStyle=o.water?'#ffffff':th.snowy?'#3d8bff':'#14122b'; for(let i=0;i<6;i++) c.fillRect(x-w*.4+i*w*.15,y-w*.1,w*.06,w*.08); }},
  ice:{d(c,x,y,w){ c.fillStyle='rgba(160,220,255,.75)'; c.beginPath(); c.ellipse(x,y-w*.02,w*.5,w*.07,0,0,7); c.fill(); c.fillStyle='rgba(255,255,255,.7)'; c.fillRect(x-w*.2,y-w*.05,w*.3,w*.015); }},
  log:{d(c,x,y,w,th,t,o){ const b=o.water?Math.sin(t*3)*w*.01:0; c.fillStyle='#7a5432'; rr(c,x-w*.5,y-w*.14+b,w,w*.14,w*.07); c.fill(); c.fillStyle='#c8a070'; c.beginPath(); c.ellipse(x-w*.5+w*.04,y-w*.07+b,w*.035,w*.065,0,0,7); c.fill(); c.strokeStyle='rgba(0,0,0,.25)'; c.lineWidth=Math.max(1,w*.006); c.beginPath(); c.moveTo(x-w*.3,y-w*.1+b); c.lineTo(x+w*.4,y-w*.1+b); c.stroke(); }},
  ring:{d(c,x,y,w,th,t){ c.save(); c.translate(x,y-w*.55); c.scale(1,1); c.strokeStyle='#ff9d3d'; c.lineWidth=Math.max(2,w*.1); c.beginPath(); c.ellipse(0,0,w*.42,w*.42,0,0,7); c.stroke(); c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=Math.max(1,w*.03); c.beginPath(); c.ellipse(0,0,w*.42,w*.42,0,Math.PI*1.1,Math.PI*1.6); c.stroke(); c.restore(); glow(c,x,y-w*.55,w*.5,'rgba(255,200,80,'+(.25+.15*Math.sin(t*6))+')'); }},
  can:{d(c,x,y,w,th,t){ const b=Math.sin(t*4)*w*.1; c.fillStyle='#3ddbd9'; rr(c,x-w*.25,y-w*1.0-b,w*.5,w*.8,w*.1); c.fill(); c.fillStyle='#14122b'; c.font='900 '+Math.max(4,w*.4)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('N',x,y-w*.6-b); glow(c,x,y-w*.6-b,w*.9,'rgba(61,219,217,.35)'); }},
  hurdle:{d(c,x,y,w){ c.fillStyle='#f4f4f4'; c.fillRect(x-w*.48,y-w*.2,w*.03,w*.2); c.fillRect(x+w*.45,y-w*.2,w*.03,w*.2); for(let i=0;i<6;i++){ c.fillStyle=i%2?'#ff4d4d':'#f4f4f4'; c.fillRect(x-w*.5+i*w/6,y-w*.22,w/6+.5,w*.05); } }},
  lowbar:{d(c,x,y,w){ c.fillStyle='#5a3a22'; c.fillRect(x-w*.5,y-w*.6,w*.03,w*.6); c.fillRect(x+w*.47,y-w*.6,w*.03,w*.6); c.fillStyle='#7a5432'; rr(c,x-w*.5,y-w*.62,w,w*.07,w*.03); c.fill(); c.fillStyle='#2f8a3a'; for(let i=0;i<7;i++){ c.beginPath(); c.ellipse(x-w*.42+i*w*.14,y-w*.56,w*.05,w*.03,0,0,7); c.fill(); } }},
  pit:{d(c,x,y,w,th){ c.fillStyle=th.pitCol||'#3a7fd0'; c.beginPath(); c.ellipse(x,y-w*.02,w*.5,w*.06,0,0,7); c.fill(); c.fillStyle='rgba(255,255,255,.35)'; c.fillRect(x-w*.25,y-w*.04,w*.2,w*.01); c.fillRect(x+w*.1,y-w*.01,w*.15,w*.01); }},
  mud:{d(c,x,y,w){ c.fillStyle='#6a4a2a'; c.beginPath(); c.ellipse(x,y-w*.02,w*.5,w*.07,0,0,7); c.fill(); c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x+w*.1,y-w*.03,w*.15,w*.02,0,0,7); c.fill(); }},
  spring:{d(c,x,y,w,th,t){ c.strokeStyle='#9aa0aa'; c.lineWidth=Math.max(1,w*.06); c.beginPath(); for(let i=0;i<5;i++){ c.lineTo(x+(i%2?-1:1)*w*.25,y-i*w*.08); } c.stroke(); c.fillStyle='#ff4d4d'; rr(c,x-w*.4,y-w*.42,w*.8,w*.1,w*.04); c.fill(); }},
  carrot:{d(c,x,y,w,th,t){ const b=Math.sin(t*4)*w*.12; c.fillStyle='#ff8a1a'; c.beginPath(); c.moveTo(x-w*.22,y-w*1.2-b); c.lineTo(x+w*.22,y-w*1.2-b); c.lineTo(x,y-w*.4-b); c.fill(); c.fillStyle='#4fb84a'; c.beginPath(); c.ellipse(x-w*.1,y-w*1.35-b,w*.06,w*.16,-.4,0,7); c.ellipse(x+w*.1,y-w*1.35-b,w*.06,w*.16,.4,0,7); c.fill(); glow(c,x,y-w*.8-b,w*.8,'rgba(255,200,80,.3)'); }}
};

/* ================= 人物（Q 版，背面在比賽中、正面在預覽和頒獎台） ================= */
function headBack(c,x,y,r,o){ c.fillStyle=o.helm||'#ff4d4d'; c.beginPath(); c.arc(x,y,r,0,7); c.fill(); c.fillStyle='rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(x-r*.35,y-r*.4,r*.3,r*.18,-.5,0,7); c.fill(); c.strokeStyle='#14122b'; c.lineWidth=Math.max(1,r*.08); c.beginPath(); c.arc(x,y,r,0,7); c.stroke(); }
function faceFront(c,x,y,r,o,t){ // 大眼睛（兩個亮點）、腮紅、ω 嘴、會眨眼
  const blink=Math.sin((t||0)*1.3)>.97; c.fillStyle='#ffe0c4'; c.beginPath(); c.arc(x,y,r*.82,0,7); c.fill();
  for(const s of [-1,1]){ if(blink){ c.strokeStyle='#14122b'; c.lineWidth=Math.max(1,r*.08); c.beginPath(); c.moveTo(x+s*r*.32-r*.12,y); c.lineTo(x+s*r*.32+r*.12,y); c.stroke(); } else { c.fillStyle='#14122b'; c.beginPath(); c.ellipse(x+s*r*.32,y,r*.13,r*.18,0,0,7); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(x+s*r*.32-r*.04,y-r*.07,r*.05,0,7); c.arc(x+s*r*.32+r*.04,y+r*.06,r*.025,0,7); c.fill(); }
    c.fillStyle='rgba(255,120,140,.45)'; c.beginPath(); c.ellipse(x+s*r*.52,y+r*.26,r*.13,r*.08,0,0,7); c.fill(); }
  c.strokeStyle='#14122b'; c.lineWidth=Math.max(1,r*.06); c.beginPath(); c.arc(x-r*.07,y+r*.28,r*.07,0,Math.PI); c.arc(x+r*.07,y+r*.28,r*.07,0,Math.PI); c.stroke(); }
// 機車（寫實版）：車款 scooter 一般輕型機車、sport 重型機車、dirt 越野機車；後面看（比賽中）、正面（頒獎台）、側面（造型預覽）
const MOTO_NITRO={blue:['#7ad8ff','#ffffff'],fire:['#ffb02a','#ff5a1a'],green:['#7aff8a','#e8ffe0']};
const decoSet=L=>new Set(String((L&&L.deco)||'').split(','));
function mTire(c,x,y,hw,h,knob){ c.fillStyle='#16161a'; rr(c,x-hw,y-h,hw*2,h,hw*.9); c.fill(); c.fillStyle='rgba(255,255,255,.09)'; for(let i=1;i<7;i++) c.fillRect(x-hw*.75,y-h+i*h/7,hw*1.5,Math.max(1,h*.025));
  if(knob){ c.fillStyle='#26262c'; for(let i=0;i<7;i++){ c.fillRect(x-hw*1.2,y-h+i*h/7+h*.02,hw*.32,h*.07); c.fillRect(x+hw*.88,y-h+i*h/7+h*.02,hw*.32,h*.07); } } }
function mHelmet(c,x,y,r,L,front,t){ const hc=L.helm||'#ffd23f',st=L.helmet||(L.body==='dirt'?'mx':L.body==='scooter'?'half':'full'),D=decoSet(L);
  if(D.has('horns')) for(const s of [-1,1]){ c.fillStyle='#c0262a'; c.beginPath(); c.moveTo(x+s*r*.45,y-r*.75); c.quadraticCurveTo(x+s*r*1.25,y-r*1.2,x+s*r*1.05,y-r*1.75); c.lineTo(x+s*r*.15,y-r*.92); c.closePath(); c.fill(); }
  if(D.has('catears')) for(const s of [-1,1]){ c.fillStyle=hc; c.beginPath(); c.moveTo(x+s*r*.92,y-r*.35); c.lineTo(x+s*r*.72,y-r*1.42); c.lineTo(x+s*r*.12,y-r*.95); c.closePath(); c.fill(); c.fillStyle='#ffb0c0'; c.beginPath(); c.moveTo(x+s*r*.72,y-r*.62); c.lineTo(x+s*r*.66,y-r*1.15); c.lineTo(x+s*r*.38,y-r*.9); c.closePath(); c.fill(); }
  if(D.has('mohawk')){ c.fillStyle='#ff3bd4'; c.beginPath(); c.moveTo(x-r*.16,y-r*.6); for(let i=0;i<6;i++){ c.lineTo(x-r*.16+(i%2)*r*.32,y-r*(.95+i*.12)); } c.lineTo(x+r*.16,y-r*.6); c.closePath(); c.fill(); }
  c.fillStyle=hc; c.beginPath(); c.arc(x,y,r,0,7); c.fill();
  if(st==='mx'){ c.beginPath(); c.moveTo(x-r*.95,y-r*.42); c.lineTo(x+r*.95,y-r*.42); c.lineTo(x+r*1.15,y-r*.18); c.lineTo(x-r*1.15,y-r*.18); c.closePath(); c.fill(); }
  if(front){
    if(st==='half'){ faceFront(c,x,y+r*.22,r*.66,L,t); c.fillStyle=hc; c.beginPath(); c.arc(x,y,r,Math.PI*1.05,Math.PI*1.95); c.fill(); }
    else { c.fillStyle='#141a28'; rr(c,x-r*.74,y-r*.22,r*1.48,r*.6,r*.25); c.fill(); c.fillStyle='rgba(140,210,255,.35)'; c.fillRect(x-r*.6,y-r*.16,r*.55,r*.11);
      if(st==='mx'){ c.fillStyle='#ff7a1a'; c.fillRect(x-r*1.02,y-r*.12,r*2.04,r*.13); c.fillStyle='#202028'; rr(c,x-r*.45,y+r*.42,r*.9,r*.45,r*.15); c.fill(); } } }
  else { if(st==='mx'){ c.fillStyle='#ff7a1a'; c.fillRect(x-r,y-r*.05,r*2,r*.16); } c.fillStyle='rgba(0,0,0,.22)'; c.fillRect(x-r*.9,y+r*.45,r*1.8,r*.12); }
  if(D.has('stripe')){ c.fillStyle='rgba(255,255,255,.85)'; c.fillRect(x-r*.12,y-r*.98,r*.24,r*1.3); }
  c.fillStyle='rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(x-r*.38,y-r*.45,r*.3,r*.15,-.5,0,7); c.fill();
  c.strokeStyle='#14122b'; c.lineWidth=Math.max(1,r*.07); c.beginPath(); c.arc(x,y,r,0,7); c.stroke();
  if(D.has('duck')){ const b=Math.sin((t||0)*5)*r*.05; c.fillStyle='#ffd23f'; c.beginPath(); c.ellipse(x,y-r*1.1+b,r*.42,r*.28,0,0,7); c.fill(); c.beginPath(); c.arc(x+r*.2,y-r*1.4+b,r*.22,0,7); c.fill(); c.fillStyle='#ff8a1a'; c.beginPath(); c.moveTo(x+r*.38,y-r*1.42+b); c.lineTo(x+r*.6,y-r*1.36+b); c.lineTo(x+r*.38,y-r*1.32+b); c.fill(); c.fillStyle='#14122b'; c.beginPath(); c.arc(x+r*.26,y-r*1.46+b,r*.04,0,7); c.fill(); } }
function mFlame(c,x,y,w,h,dir){ c.fillStyle='#ff8a1a'; c.beginPath(); c.moveTo(x,y); for(let i=0;i<4;i++){ c.quadraticCurveTo(x+dir*w*(i+.5)/4,y-h*(i%2?1:.6),x+dir*w*(i+1)/4,y-h*.15); } c.lineTo(x,y+h*.2); c.fill(); c.fillStyle='#ffd23f'; c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x+dir*w*.2,y-h*.5,x+dir*w*.45,y-h*.05); c.lineTo(x,y+h*.1); c.fill(); }
function mNumber(c,x,y,r,n){ c.fillStyle='#fff'; c.beginPath(); c.arc(x,y,r,0,7); c.fill(); c.strokeStyle='#14122b'; c.lineWidth=Math.max(1,r*.12); c.stroke(); c.fillStyle='#14122b'; c.font='900 '+Math.max(5,Math.round(r*1.3))+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(n||7),x,y+r*.08); }
function mExhaustFlame(c,ex,ey,w,L,t,dx,dy){ const N=L.nitro||'blue',cols=N==='rainbow'?['hsl('+(t*600%360)+',100%,60%)','#fff']:MOTO_NITRO[N]||MOTO_NITRO.blue,l=w*(.12+Math.random()*.07);
  c.fillStyle=cols[0]; c.beginPath(); c.ellipse(ex+(dx||0)*l*.5,ey+(dy||1)*l*.5,w*.04,l*.6,dx?Math.PI/2:0,0,7); c.fill(); c.fillStyle=cols[1]; c.beginPath(); c.ellipse(ex+(dx||0)*l*.3,ey+(dy||1)*l*.3,w*.02,l*.3,dx?Math.PI/2:0,0,7); c.fill(); }
// 騎士（後面看）：重機趴低、速克達坐直、越野半站
function mRiderBack(c,w,type,L,t){ const su=L.suit||'#2f3a5a',dk=shade(su,.7);
  if(type==='sport'){ c.fillStyle=dk; for(const s of [-1,1]){ c.beginPath(); c.moveTo(s*w*.1,-w*.58); c.lineTo(s*w*.3,-w*.46); c.lineTo(s*w*.27,-w*.36); c.lineTo(s*w*.1,-w*.48); c.fill(); c.fillStyle='#1a1a1e'; rr(c,s*w*.3-w*.04,-w*.4,w*.08,w*.1,w*.02); c.fill(); c.fillStyle=dk; }
    c.fillStyle=su; c.beginPath(); c.ellipse(0,-w*.68,w*.17,w*.14,0,0,7); c.fill(); c.fillStyle=dk; for(const s of [-1,1]){ c.beginPath(); c.moveTo(s*w*.13,-w*.74); c.lineTo(s*w*.27,-w*.66); c.lineTo(s*w*.25,-w*.6); c.lineTo(s*w*.12,-w*.66); c.fill(); }
    c.fillStyle='rgba(255,255,255,.25)'; c.fillRect(-w*.02,-w*.8,w*.04,w*.22); return -w*.86; }
  if(type==='scooter'){ c.fillStyle=dk; for(const s of [-1,1]){ c.beginPath(); c.moveTo(s*w*.14,-w*.88); c.lineTo(s*w*.28,-w*.76); c.lineTo(s*w*.25,-w*.7); c.lineTo(s*w*.12,-w*.8); c.fill(); }
    c.fillStyle=su; rr(c,-w*.17,-w*1.0,w*.34,w*.42,w*.12); c.fill(); c.fillStyle='rgba(0,0,0,.12)'; c.fillRect(-w*.17,-w*.66,w*.34,w*.05); return -w*1.1; }
  c.fillStyle=dk; for(const s of [-1,1]){ c.beginPath(); c.moveTo(s*w*.08,-w*.62); c.lineTo(s*w*.22,-w*.5); c.lineTo(s*w*.16,-w*.38); c.lineTo(s*w*.06,-w*.5); c.fill(); c.fillStyle='#1a1a1e'; rr(c,s*w*.18-w*.04,-w*.42,w*.08,w*.12,w*.02); c.fill(); c.fillStyle=dk; }
  c.fillStyle=su; rr(c,-w*.15,-w*.98,w*.3,w*.4,w*.1); c.fill(); c.fillStyle=dk; for(const s of [-1,1]){ c.beginPath(); c.moveTo(s*w*.13,-w*.92); c.lineTo(s*w*.34,-w*.86); c.lineTo(s*w*.34,-w*.8); c.lineTo(s*w*.13,-w*.82); c.fill(); }
  c.fillStyle='#fff'; c.font='900 '+Math.max(5,Math.round(w*.12))+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String((L.num)||'7'),0,-w*.8); return -w*1.08; }
/* ================= 3D 車款：借極速大亂鬥的 three.js 模型，先拍成圖片再貼到 2D 賽道上 ================= */
const V3S=256,V3={r:null,scene:null,cache:{},want:false,fail:false,cx:0,budT:0,bud:0};
function v3ready(){ if(V3.fail) return false; if(V3.r) return true; const T=window.THREE,K=window.ARCADE_GAMES&&window.ARCADE_GAMES.kart;
  if(!K||!K._buildKart){ return false; }
  if(!T){ if(!V3.want&&K.load){ V3.want=true; K.load().catch(()=>{ V3.fail=true; }); } return false; }
  try{ const cv=document.createElement('canvas'); V3.r=new T.WebGLRenderer({canvas:cv,alpha:true,antialias:true,preserveDrawingBuffer:true}); V3.r.setPixelRatio(1); V3.r.setSize(V3S,V3S,false); V3.r.setClearColor(0,0);
    const sc=V3.scene=new T.Scene(); sc.add(new T.HemisphereLight(0xffffff,0x5a5a68,.78)); const d=new T.DirectionalLight(0xfff4e0,.8); d.position.set(5,10,-7); sc.add(d); const d2=new T.DirectionalLight(0xbfdcff,.35); d2.position.set(-6,4,8); sc.add(d2);
  }catch(e){ V3.fail=true; return false; } return true; }
/* 拍照：back 拍五張（正後方、往左右各偏兩格），front／side 各一張；記下地面中心在圖上的位置 */
function v3bake(build,view,span){ const T=window.THREE,m=build(T),cam=new T.OrthographicCamera(-span/2,span/2,span/2,-span/2,.1,120),Y=span*.34,out=[];
  V3.scene.add(m); const fr=view==='back'?[-2,-1,0,1,2]:[0];
  for(const f of fr){ m.rotation.y=f*.15; const pt=view==='side'?.05:.2,D=40;
    if(view==='side') cam.position.set(-D,Y+D*Math.sin(pt),0); else if(view==='front') cam.position.set(0,Y+D*Math.sin(pt),D); else cam.position.set(0,Y+D*Math.sin(pt),-D);
    cam.lookAt(0,Y,0); cam.updateMatrixWorld(); V3.r.render(V3.scene,cam);
    const c=document.createElement('canvas'); c.width=c.height=V3S; c.getContext('2d').drawImage(V3.r.domElement,0,0); const p=new T.Vector3(0,0,0).project(cam); out.push({c,ax:(p.x+1)/2*V3S,ay:(1-p.y)/2*V3S}); }
  V3.scene.remove(m); m.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ const ms=Array.isArray(o.material)?o.material:[o.material]; for(const q of ms){ if(q.map) q.map.dispose(); q.dispose(); } } });
  return {f:out,ppu:V3S/span}; }
/* 拿圖：還沒拍過就拍（每 60 毫秒最多拍兩台，免得一開賽卡住），還不能拍就回 null 改用 2D 畫法 */
function v3get(key,build,view,span){ const k=key+'|'+view,hit=V3.cache[k]; if(hit) return hit; if(!v3ready()) return null;
  const now=performance.now(); if(now-V3.budT>60){ V3.budT=now; V3.bud=2; } if(V3.bud<=0) return null; V3.bud--;
  try{ return V3.cache[k]=v3bake(build,view,span); }catch(e){ V3.fail=true; return null; } }
function v3draw(c,S,f,x,y,u){ const F=S.f[f]||S.f[0],k=u/S.ppu; c.drawImage(F.c,x-F.ax*k,y-F.ay*k,V3S*k,V3S*k); }
const v3frame=(x,extra)=>clamp(Math.round((V3.cx?(x-V3.cx)/V3.cx*2:0)+(extra||0))+2,0,4);
/* 機車王的造型換成極速大亂鬥的車款：速克達→機車、重機／越野→重型機車（越野配越野胎） */
function motoModel(L,col){ L=L||{}; const look={body:L.body==='scooter'?'scooter':'bike',color:L.bike||col||'#ff4d4d',driver:'helmet',part:L.body==='dirt'?'exhaust':'none',wheel:L.body==='dirt'?'offroad':'std',deco:''};
  const key='m:'+look.body+look.color+look.wheel+(L.helm||'')+(L.suit||'');
  return {key,build:T=>{ const g=window.ARCADE_GAMES.kart._buildKart(T,look),u=g.userData,ph=new T.Color(look.color).getHex(),hm=new T.MeshPhongMaterial({color:new T.Color(L.helm||'#ffd23f'),shininess:120,specular:0x888888}),sm=new T.MeshPhongMaterial({color:new T.Color(L.suit||'#2f3a5a'),shininess:20});
    if(u.shadow) u.shadow.visible=false; if(u.head) u.head.traverse(o=>{ if(o.isMesh&&o.material.color&&o.material.color.getHex()===ph) o.material=hm; });
    if(u.driver) u.driver.traverse(o=>{ if(o.isMesh&&o.material.color&&o.material.color.getHex()===0xf4f4f8) o.material=sm; }); return g; }}; }
/* 路上的車：轎車、計程車、廂型車，和極速大亂鬥同樣的材質風格 */
function carModel(o){ const key='c:'+(o.big?'van':o.taxi?'taxi':'car')+(o.col||'');
  return {key,build:T=>{ const g=new T.Group(),PI=Math.PI,col=new T.Color(o.col||'#3d8bff'),paint=new T.MeshPhongMaterial({color:col,shininess:100,specular:0x777777}),dark=new T.MeshPhongMaterial({color:0x1c1c24,shininess:40}),
      rub=new T.MeshLambertMaterial({color:0x141418}),glass=new T.MeshPhongMaterial({color:0x2c3c50,shininess:160,specular:0xffffff}),metal=new T.MeshPhongMaterial({color:0xc8ccd6,shininess:140,specular:0xffffff}),
      red=new T.MeshPhongMaterial({color:0xe82424,emissive:0x501010,shininess:100}),amber=new T.MeshLambertMaterial({color:0xffa020}),white=new T.MeshLambertMaterial({color:0xf4f4f4});
    const add=(geo,m,x,y,z,rx,ry,rz)=>{ const b=new T.Mesh(geo,m); b.position.set(x,y,z); b.rotation.set(rx||0,ry||0,rz||0); g.add(b); return b; },box=(w,h,d,m,x,y,z,rx)=>add(new T.BoxGeometry(w,h,d),m,x,y,z,rx);
    const hull=(pts,width,m)=>{ const sh=new T.Shape(); pts.forEach((p,i)=>i?sh.lineTo(p[0],p[1]):sh.moveTo(p[0],p[1])); const geo=new T.ExtrudeGeometry(sh,{depth:width-.2,bevelEnabled:true,bevelThickness:.1,bevelSize:.09,bevelSegments:3}); geo.translate(0,0,-(width-.2)/2); return add(geo,m,0,0,0,0,-PI/2,0); };
    const wheel=(x,z,r)=>{ add(new T.CylinderGeometry(r,r,.32,22),rub,x,r,z,0,0,PI/2); add(new T.CylinderGeometry(r*.6,r*.6,.34,16),metal,x,r,z,0,0,PI/2); add(new T.CylinderGeometry(r*.22,r*.22,.36,10),dark,x,r,z,0,0,PI/2); };
    if(o.big){ hull([[-2.6,.42],[-2.6,2.45],[1.75,2.45],[2.45,1.45],[2.6,.55],[2.45,.4],[-2.45,.4]],2.05,paint);
      for(const sd of [-1,1]){ box(.04,.62,3.2,glass,sd*1.04,1.92,-.55); } box(1.7,.72,.05,glass,0,1.88,-2.67); box(1.9,.06,.05,dark,0,1.48,-2.68);
      for(const sd of [-1,1]){ box(.16,.5,.05,red,sd*.86,1.05,-2.67); box(.16,.14,.05,amber,sd*.86,.72,-2.67); } box(.55,.17,.04,white,0,.68,-2.68); box(2.05,.2,.16,dark,0,.48,-2.6); box(.04,1.3,.04,dark,0,1.1,-2.68);
      for(const x of [-.93,.93]) for(const z of [-1.7,1.7]) wheel(x,z,.46); }
    else { hull([[-2.25,.36],[-2.32,.92],[-2.0,1.02],[1.55,1.0],[2.25,.8],[2.32,.42],[2.12,.32],[-2.12,.32]],1.92,paint);
      hull([[-1.78,1.0],[-1.32,1.52],[.5,1.54],[1.25,1.0]],1.62,glass); box(1.5,.07,1.72,paint,0,1.56,-.4);
      for(const sd of [-1,1]){ box(.07,.5,.08,paint,sd*.78,1.28,-1.55,.7); box(.07,.52,.1,paint,sd*.8,1.28,-.35); box(.12,.07,.18,dark,sd*1.06,1.06,.95); }
      for(const sd of [-1,1]){ box(.48,.15,.05,red,sd*.66,.9,-2.33); box(.14,.1,.05,amber,sd*.88,.9,-2.33); } box(.52,.17,.04,white,0,.62,-2.35); box(1.92,.2,.14,dark,0,.42,-2.28); box(1.2,.03,.04,metal,0,1.0,-2.3);
      if(o.taxi){ box(.62,.22,.3,white,0,1.71,-.4); box(.64,.06,.32,new T.MeshLambertMaterial({color:0x2a2a40}),0,1.63,-.4); for(const sd of [-1,1]) box(.03,.12,2.2,new T.MeshLambertMaterial({color:0x14122b}),sd*1.03,.72,0); }
      for(const x of [-.9,.9]) for(const z of [-1.42,1.42]) wheel(x,z,.39); }
    return g; }}; }
function motoBack(c,x,y,w,o,t){ const L=o.look||{},type=L.body||'sport',bc=L.bike||o.col||'#ff4d4d',D=decoSet(L),S=type==='scooter',X=type==='dirt';
  { const M=motoModel(L,o.col),S3=v3get(M.key,M.build,'back',5.2); if(S3){ c.save(); c.translate(x,y); if(D.has('glow')) glow(c,0,-w*.02,w*.6,'rgba(80,220,255,.6)');
      c.fillStyle='rgba(0,0,0,.32)'; c.beginPath(); c.ellipse(0,0,w*.36,w*.07,0,0,7); c.fill(); c.rotate((o.lean||0)*.45); if(o.crash) c.rotate(Math.sin(t*14)*.8);
      v3draw(c,S3,v3frame(x,-(o.lean||0)*1.2),0,0,w*.58);
      if(o.boost) mExhaustFlame(c,S?0:w*.1,-w*(S?.42:.4),w,L,t,0,1);
      if(o.night) glow(c,0,-w*(S?.55:.62),w*.3,'rgba(255,40,40,.5)'); c.restore(); return; } }
  c.save(); c.translate(x,y);
  if(D.has('glow')) glow(c,0,-w*.02,w*.6,'rgba(80,220,255,.6)');
  c.fillStyle='rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0,0,w*.42,w*.07,0,0,7); c.fill();
  c.rotate((o.lean||0)*.45); if(o.crash) c.rotate(Math.sin(t*14)*.8);
  const tw=S?w*.07:X?w*.065:w*.12,th=S?w*.3:X?w*.48:w*.42; mTire(c,0,0,tw,th,X);
  let ex,ey;
  if(X){ ex=w*.17; ey=-w*.62; c.fillStyle='#b8bcc4'; c.beginPath(); c.moveTo(w*.12,-w*.3); c.lineTo(w*.2,-w*.3); c.lineTo(w*.21,-w*.62); c.lineTo(w*.13,-w*.62); c.fill(); c.fillStyle='#1a1a1e'; c.beginPath(); c.ellipse(ex,ey,w*.04,w*.02,0,0,7); c.fill(); }
  else if(S){ ex=w*.26; ey=-w*.14; c.fillStyle='#8a8e96'; rr(c,w*.08,-w*.19,w*.18,w*.08,w*.035); c.fill(); c.fillStyle='#5a5e66'; rr(c,w*.08,-w*.19,w*.06,w*.08,w*.02); c.fill(); }
  else { ex=w*.19; ey=-w*.24; c.fillStyle='#2a2a30'; rr(c,w*.12,-w*.3,w*.14,w*.11,w*.035); c.fill(); c.fillStyle='#c8ccd4'; c.beginPath(); c.ellipse(ex,ey,w*.05,w*.04,0,0,7); c.fill(); c.fillStyle='#16161a'; c.beginPath(); c.ellipse(ex,ey,w*.028,w*.02,0,0,7); c.fill(); }
  if(o.boost) mExhaustFlame(c,ex,ey,w,L,t,X?0:.0,X?-1:1);
  // 車身後段、尾燈、車牌、方向燈
  let tailTop;
  if(S){ c.fillStyle=bc; c.beginPath(); c.moveTo(-w*.22,-w*.2); c.quadraticCurveTo(-w*.27,-w*.5,0,-w*.55); c.quadraticCurveTo(w*.27,-w*.5,w*.22,-w*.2); c.closePath(); c.fill(); c.fillStyle='rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(-w*.1,-w*.44,w*.08,w*.035,-.3,0,7); c.fill();
    c.fillStyle='#e8202a'; rr(c,-w*.14,-w*.37,w*.28,w*.055,w*.025); c.fill(); c.fillStyle='#ffa020'; c.fillRect(-w*.21,-w*.355,w*.05,w*.03); c.fillRect(w*.16,-w*.355,w*.05,w*.03);
    c.fillStyle='#f4f4f4'; rr(c,-w*.09,-w*.29,w*.18,w*.085,w*.012); c.fill(); c.fillStyle='#2a2a40'; c.fillRect(-w*.06,-w*.26,w*.12,w*.025);
    c.strokeStyle='#5a5e66'; c.lineWidth=Math.max(1,w*.022); c.beginPath(); c.moveTo(-w*.19,-w*.57); c.lineTo(w*.19,-w*.57); c.stroke(); tailTop=-w*.58; }
  else if(X){ c.fillStyle=bc; c.beginPath(); c.moveTo(-w*.08,-th); c.lineTo(w*.08,-th); c.lineTo(w*.05,-th-w*.2); c.lineTo(-w*.05,-th-w*.2); c.closePath(); c.fill();
    c.fillStyle='#e8202a'; c.fillRect(-w*.03,-th-w*.12,w*.06,w*.025);
    c.fillStyle=shade(bc,.85); c.beginPath(); c.moveTo(-w*.16,-w*.38); c.lineTo(w*.16,-w*.38); c.lineTo(w*.11,-w*.6); c.lineTo(-w*.11,-w*.6); c.closePath(); c.fill();
    c.fillStyle='#f4f4f4'; for(const s of [-1,1]){ c.beginPath(); c.moveTo(s*w*.16,-w*.4); c.lineTo(s*w*.27,-w*.46); c.lineTo(s*w*.22,-w*.63); c.lineTo(s*w*.11,-w*.6); c.closePath(); c.fill(); } tailTop=-w*.62; }
  else { c.fillStyle=shade(bc,.78); c.beginPath(); c.moveTo(-w*.32,-w*.2); c.lineTo(w*.32,-w*.2); c.lineTo(w*.27,-w*.46); c.lineTo(-w*.27,-w*.46); c.closePath(); c.fill();
    c.fillStyle='#22222a'; rr(c,-w*.14,-w*.47,w*.28,w*.05,w*.02); c.fill();
    c.fillStyle=bc; c.beginPath(); c.moveTo(-w*.15,-w*.44); c.lineTo(w*.15,-w*.44); c.lineTo(w*.06,-w*.66); c.lineTo(-w*.06,-w*.66); c.closePath(); c.fill(); c.fillStyle='rgba(255,255,255,.22)'; c.beginPath(); c.moveTo(-w*.1,-w*.47); c.lineTo(-w*.04,-w*.47); c.lineTo(-w*.03,-w*.63); c.fill();
    c.fillStyle='#e8202a'; c.beginPath(); c.moveTo(-w*.11,-w*.5); c.lineTo(w*.11,-w*.5); c.lineTo(w*.08,-w*.545); c.lineTo(-w*.08,-w*.545); c.closePath(); c.fill();
    c.fillStyle='#3a3a40'; c.fillRect(-w*.012,-w*.44,w*.024,w*.1); c.fillStyle='#f4f4f4'; rr(c,-w*.075,-w*.35,w*.15,w*.065,w*.01); c.fill(); c.fillStyle='#2a2a40'; c.fillRect(-w*.05,-w*.325,w*.1,w*.02);
    c.fillStyle='#ffa020'; c.fillRect(-w*.13,-w*.33,w*.04,w*.025); c.fillRect(w*.09,-w*.33,w*.04,w*.025); tailTop=-w*.66; }
  if(o.night){ glow(c,0,S?-w*.34:X?-th-w*.11:-w*.52,w*.32,'rgba(255,40,40,.5)'); }
  if(D.has('flame')){ if(X) for(const s of [-1,1]) mFlame(c,s*w*.12,-w*.45,w*.12,w*.07,s); else for(const s of [-1,1]) mFlame(c,s*(S?w*.08:w*.06),-w*(S?.3:.26),w*.2,w*.08,s); }
  if(D.has('num')) mNumber(c,0,S?-w*.47:X?-w*.5:-w*.58,w*.055,o.num);
  if(D.has('side')) for(const s of [-1,1]){ c.fillStyle='#2a2a30'; rr(c,s*w*.36-w*.075,-w*.52,w*.15,w*.24,w*.035); c.fill(); c.fillStyle='rgba(255,255,255,.18)'; c.fillRect(s*w*.36-w*.06,-w*.5,w*.12,w*.025); c.fillStyle='#e8202a'; c.fillRect(s*w*.36-w*.03,-w*.32,w*.06,w*.02); }
  // 騎士
  const headY=mRiderBack(c,w,type,L,t);
  if(D.has('box')){ const by=tailTop-w*.02; c.fillStyle='#2a2a30'; rr(c,-w*.14,by-w*.17,w*.28,w*.18,w*.04); c.fill(); c.fillStyle='rgba(255,255,255,.18)'; c.fillRect(-w*.12,by-w*.15,w*.24,w*.03); c.fillStyle='#e8202a'; c.fillRect(-w*.08,by-w*.05,w*.16,w*.025); }
  mHelmet(c,0,headY,w*.13,L,false,t);
  if(D.has('flag')){ const fx=w*.2,fy=tailTop; c.strokeStyle='#d8d8e0'; c.lineWidth=Math.max(1,w*.012); c.beginPath(); c.moveTo(fx,fy); c.lineTo(fx,fy-w*.75); c.stroke(); const wv=Math.sin(t*10)*w*.03; c.fillStyle=L.bike||'#ff4d4d'; c.beginPath(); c.moveTo(fx,fy-w*.75); c.quadraticCurveTo(fx+w*.12,fy-w*.72+wv,fx+w*.24,fy-w*.7); c.lineTo(fx,fy-w*.6); c.closePath(); c.fill(); }
  c.restore(); }
function motoFront(c,x,y,w,L,t){ L=L||{}; { const M=motoModel(L),S3=v3get(M.key,M.build,'front',5.2); if(S3){ c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x,y,w*.36,w*.07,0,0,7); c.fill(); v3draw(c,S3,0,x,y,w*.5); return; } } const type=L.body||'sport',bc=L.bike||'#ff4d4d',D=decoSet(L),S=type==='scooter',X=type==='dirt',su=L.suit||'#2f3a5a';
  c.save(); c.translate(x,y); if(D.has('glow')) glow(c,0,0,w*.6,'rgba(80,220,255,.55)'); c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0,0,w*.4,w*.07,0,0,7); c.fill();
  mTire(c,0,0,S?w*.07:X?w*.065:w*.1,S?w*.3:X?w*.5:w*.4,X);
  if(X){ c.fillStyle=bc; c.beginPath(); c.moveTo(-w*.1,-w*.54); c.lineTo(w*.1,-w*.54); c.lineTo(w*.06,-w*.6); c.lineTo(-w*.06,-w*.6); c.fill(); c.fillStyle='#b8bcc4'; c.fillRect(-w*.1,-w*.62,w*.035,w*.3); c.fillRect(w*.065,-w*.62,w*.035,w*.3);
    c.fillStyle='#f4f4f4'; rr(c,-w*.13,-w*.86,w*.26,w*.24,w*.04); c.fill(); mNumber(c,0,-w*.74,w*.07,L.num); c.fillStyle='#fff6c8'; c.fillRect(-w*.05,-w*.65,w*.1,w*.03); }
  else if(S){ c.fillStyle=bc; c.beginPath(); c.moveTo(-w*.2,-w*.25); c.quadraticCurveTo(-w*.24,-w*.75,0,-w*.8); c.quadraticCurveTo(w*.24,-w*.75,w*.2,-w*.25); c.closePath(); c.fill(); c.fillStyle='#fff6c8'; c.beginPath(); c.ellipse(0,-w*.66,w*.09,w*.05,0,0,7); c.fill(); glow(c,0,-w*.66,w*.25,'rgba(255,250,200,.4)');
    c.fillStyle='#ffa020'; c.fillRect(-w*.19,-w*.62,w*.05,w*.03); c.fillRect(w*.14,-w*.62,w*.05,w*.03); }
  else { c.fillStyle=bc; c.beginPath(); c.moveTo(-w*.3,-w*.28); c.lineTo(w*.3,-w*.28); c.lineTo(w*.22,-w*.7); c.lineTo(0,-w*.82); c.lineTo(-w*.22,-w*.7); c.closePath(); c.fill(); c.fillStyle='rgba(140,200,240,.55)'; c.beginPath(); c.moveTo(-w*.12,-w*.74); c.lineTo(0,-w*.92); c.lineTo(w*.12,-w*.74); c.closePath(); c.fill();
    c.fillStyle='#fff6c8'; for(const s of [-1,1]){ c.beginPath(); c.moveTo(s*w*.04,-w*.62); c.lineTo(s*w*.18,-w*.58); c.lineTo(s*w*.15,-w*.53); c.lineTo(s*w*.04,-w*.55); c.closePath(); c.fill(); } glow(c,0,-w*.57,w*.25,'rgba(255,250,200,.4)'); if(D.has('num')) mNumber(c,0,-w*.42,w*.06,L.num); }
  if(D.has('flame')) for(const s of [-1,1]) mFlame(c,s*w*.06,-w*(X?.45:.38),w*.18,w*.07,s);
  c.strokeStyle='#3a3a48'; c.lineWidth=Math.max(1,w*.03); const hb=X?-w*.88:S?-w*.82:-w*.74,hw2=X?w*.4:S?w*.3:w*.28; c.beginPath(); c.moveTo(-hw2,hb); c.lineTo(hw2,hb); c.stroke();
  if(!X){ for(const s of [-1,1]){ c.beginPath(); c.moveTo(s*hw2*.8,hb); c.lineTo(s*hw2*1.15,hb-w*.12); c.stroke(); c.fillStyle='#2a2a30'; c.beginPath(); c.ellipse(s*hw2*1.2,hb-w*.14,w*.05,w*.03,0,0,7); c.fill(); } }
  const top=X?-w*1.25:S?-w*1.22:-w*1.05; c.fillStyle=su; rr(c,-w*.17,top+w*.12,w*.34,(hb-top)-w*.04,w*.12); c.fill(); c.fillStyle=shade(su,.7); for(const s of [-1,1]){ c.beginPath(); c.moveTo(s*w*.14,top+w*.18); c.lineTo(s*hw2,hb); c.lineTo(s*hw2*.85,hb+w*.04); c.lineTo(s*w*.1,top+w*.28); c.fill(); }
  c.fillStyle='#1a1a1e'; for(const s of [-1,1]){ c.beginPath(); c.arc(s*hw2,hb,w*.04,0,7); c.fill(); }
  mHelmet(c,0,top,w*.15,L,true,t); c.restore(); }
function motoSide(c,x,y,w,L,t){ L=L||{}; { const M=motoModel(L),S3=v3get(M.key,M.build,'side',5.2); if(S3){ c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x,y,w*.6,w*.06,0,0,7); c.fill(); v3draw(c,S3,0,x,y,w*.3); return; } } const type=L.body||'sport',bc=L.bike||'#ff4d4d',D=decoSet(L),S=type==='scooter',X=type==='dirt',su=L.suit||'#2f3a5a',dk=shade(su,.7);
  c.save(); c.translate(x,y); if(D.has('glow')) glow(c,0,-w*.05,w*.7,'rgba(80,220,255,.5)');
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0,0,w*.6,w*.06,0,0,7); c.fill();
  const r=S?w*.13:X?w*.2:w*.17,rx=S?-w*.34:-w*.36,fx=S?w*.32:X?w*.4:w*.36,spin=t*8;
  const wheel=(cx)=>{ c.fillStyle='#16161a'; c.beginPath(); c.arc(cx,-r,r,0,7); c.fill(); if(X){ c.fillStyle='#26262c'; for(let i=0;i<16;i++){ const a=i/16*Math.PI*2+spin*.1; c.fillRect(cx+Math.cos(a)*r*1.02-r*.06,-r+Math.sin(a)*r*1.02-r*.06,r*.12,r*.12); } }
    c.fillStyle=X?'#c8ccd4':'#9aa0aa'; c.beginPath(); c.arc(cx,-r,r*.68,0,7); c.fill(); c.fillStyle='#16161a'; c.beginPath(); c.arc(cx,-r,r*.6,0,7); c.fill();
    c.strokeStyle=X?'#c8ccd4':bc; c.lineWidth=Math.max(1,r*(X?.04:.12)); for(let i=0;i<(X?12:5);i++){ const a=spin+i/(X?12:5)*Math.PI*2; c.beginPath(); c.moveTo(cx,-r); c.lineTo(cx+Math.cos(a)*r*.6,-r+Math.sin(a)*r*.6); c.stroke(); }
    c.fillStyle='#c8ccd4'; c.beginPath(); c.arc(cx,-r,r*.14,0,7); c.fill(); c.fillStyle='#8a8e96'; c.beginPath(); c.arc(cx,-r,r*.45,0,7); c.lineWidth=Math.max(1,r*.06); c.strokeStyle='#8a8e96'; c.stroke(); };
  wheel(rx); wheel(fx);
  if(S){ // 速克達：前擋、低踏板、圓車尾
    c.fillStyle='#2a2a30'; c.fillRect(rx,-r*1.15,w*.32,w*.05);
    c.fillStyle=bc; c.beginPath(); c.moveTo(-w*.48,-w*.32); c.quadraticCurveTo(-w*.5,-w*.52,-w*.3,-w*.55); c.lineTo(-w*.02,-w*.5); c.lineTo(w*.02,-w*.22); c.lineTo(-w*.22,-w*.16); c.closePath(); c.fill();
    c.fillRect(-w*.04,-w*.2,w*.24,w*.07); c.beginPath(); c.moveTo(w*.14,-w*.18); c.lineTo(w*.26,-w*.68); c.lineTo(w*.36,-w*.66); c.lineTo(w*.3,-w*.2); c.closePath(); c.fill();
    c.fillStyle='#1a1a1e'; rr(c,-w*.4,-w*.6,w*.34,w*.07,w*.03); c.fill(); c.fillStyle='#e8202a'; c.fillRect(-w*.5,-w*.38,w*.04,w*.05); c.fillStyle='#fff6c8'; c.fillRect(w*.33,-w*.6,w*.04,w*.05);
    c.strokeStyle='#3a3a48'; c.lineWidth=Math.max(1,w*.02); c.beginPath(); c.moveTo(w*.3,-w*.68); c.lineTo(w*.24,-w*.8); c.lineTo(w*.14,-w*.8); c.stroke(); c.fillStyle='#8a8e96'; rr(c,-w*.42,-w*.18,w*.2,w*.06,w*.03); c.fill(); }
  else if(X){ // 越野：細高車架、長避震、高擋泥板
    c.strokeStyle='#b8bcc4'; c.lineWidth=Math.max(1,w*.03); c.beginPath(); c.moveTo(fx,-r); c.lineTo(w*.24,-w*.66); c.moveTo(rx,-r); c.lineTo(-w*.04,-w*.4); c.stroke();
    c.fillStyle=bc; c.beginPath(); c.moveTo(-w*.5,-w*.6); c.lineTo(-w*.18,-w*.58); c.lineTo(w*.2,-w*.66); c.lineTo(w*.24,-w*.56); c.lineTo(-w*.06,-w*.42); c.lineTo(-w*.3,-w*.5); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(w*.3,-w*.5); c.lineTo(w*.52,-w*.52); c.lineTo(w*.44,-w*.46); c.closePath(); c.fill(); c.fillStyle='#f4f4f4'; rr(c,-w*.3,-w*.55,w*.14,w*.1,w*.02); c.fill(); mNumber(c,-w*.23,-w*.5,w*.04,L.num);
    c.fillStyle='#1a1a1e'; rr(c,-w*.36,-w*.66,w*.42,w*.05,w*.02); c.fill(); c.fillStyle='#c8ccd4'; c.beginPath(); c.moveTo(-w*.06,-w*.4); c.quadraticCurveTo(-w*.3,-w*.42,-w*.46,-w*.56); c.lineTo(-w*.48,-w*.52); c.quadraticCurveTo(-w*.3,-w*.36,-w*.06,-w*.34); c.fill();
    c.strokeStyle='#3a3a48'; c.lineWidth=Math.max(1,w*.02); c.beginPath(); c.moveTo(w*.24,-w*.66); c.lineTo(w*.2,-w*.78); c.stroke(); }
  else { // 重機：整流罩、油箱、尖車尾、擋風鏡
    c.fillStyle='#2a2a30'; c.beginPath(); c.moveTo(rx,-r); c.lineTo(-w*.02,-w*.3); c.lineTo(-w*.02,-w*.24); c.lineTo(rx,-r*.85); c.fill();
    c.fillStyle=shade(bc,.85); c.beginPath(); c.moveTo(-w*.06,-w*.24); c.lineTo(w*.3,-w*.26); c.lineTo(w*.46,-w*.5); c.lineTo(w*.4,-w*.68); c.lineTo(w*.2,-w*.62); c.lineTo(-w*.04,-w*.42); c.closePath(); c.fill();
    c.fillStyle=bc; c.beginPath(); c.moveTo(-w*.04,-w*.48); c.quadraticCurveTo(w*.1,-w*.66,w*.24,-w*.6); c.lineTo(w*.2,-w*.48); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-w*.1,-w*.5); c.lineTo(-w*.54,-w*.62); c.lineTo(-w*.52,-w*.56); c.lineTo(-w*.12,-w*.42); c.closePath(); c.fill();
    c.fillStyle='rgba(140,200,240,.6)'; c.beginPath(); c.moveTo(w*.34,-w*.66); c.lineTo(w*.26,-w*.8); c.lineTo(w*.4,-w*.7); c.closePath(); c.fill();
    c.fillStyle='#fff6c8'; c.beginPath(); c.moveTo(w*.42,-w*.6); c.lineTo(w*.47,-w*.52); c.lineTo(w*.43,-w*.5); c.closePath(); c.fill(); c.fillStyle='#e8202a'; c.fillRect(-w*.54,-w*.62,w*.04,w*.03);
    c.fillStyle='#1a1a1e'; rr(c,-w*.3,-w*.56,w*.26,w*.05,w*.02); c.fill(); c.fillStyle='#2a2a30'; rr(c,-w*.38,-w*.4,w*.2,w*.08,w*.03); c.fill(); c.fillStyle='#c8ccd4'; c.beginPath(); c.ellipse(-w*.38,-w*.36,w*.02,w*.04,0,0,7); c.fill();
    if(D.has('num')) mNumber(c,w*.24,-w*.42,w*.05,L.num); }
  if(D.has('flame')) mFlame(c,S?w*.0:w*.02,S?-w*.4:-w*.4,w*.3,w*.08,1);
  if(D.has('box')){ c.fillStyle='#2a2a30'; rr(c,-w*.5,S?-w*.78:-w*.8,w*.2,w*.18,w*.04); c.fill(); }
  if(D.has('side')){ c.fillStyle='#2a2a30'; rr(c,-w*.46,-w*.5,w*.24,w*.18,w*.04); c.fill(); }
  // 騎士側面
  c.lineCap='round';
  let hip,sh,head,hand,knee,foot;
  if(S){ hip=[-w*.18,-w*.62]; sh=[-w*.14,-w*1.0]; head=[-w*.1,-w*1.14]; hand=[w*.16,-w*.8]; knee=[w*.04,-w*.56]; foot=[w*.06,-w*.27]; }
  else if(X){ hip=[-w*.14,-w*.78]; sh=[w*.04,-w*1.08]; head=[w*.1,-w*1.2]; hand=[w*.2,-w*.8]; knee=[w*.04,-w*.6]; foot=[-w*.06,-w*.42]; }
  else { hip=[-w*.18,-w*.62]; sh=[w*.1,-w*.84]; head=[w*.2,-w*.9]; hand=[w*.3,-w*.66]; knee=[w*.04,-w*.5]; foot=[-w*.12,-w*.36]; }
  const limb=(a,b,wd,col)=>{ c.strokeStyle=col; c.lineWidth=wd; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]); c.stroke(); };
  limb(hip,knee,w*.1,dk); limb(knee,foot,w*.085,dk); c.fillStyle='#1a1a1e'; rr(c,foot[0]-w*.05,foot[1]-w*.03,w*.11,w*.06,w*.02); c.fill();
  limb(hip,sh,w*.17,su); limb(sh,hand,w*.075,dk); c.fillStyle='#1a1a1e'; c.beginPath(); c.arc(hand[0],hand[1],w*.035,0,7); c.fill();
  if(D.has('flag')){ c.strokeStyle='#d8d8e0'; c.lineWidth=Math.max(1,w*.012); c.beginPath(); c.moveTo(-w*.46,-w*.6); c.lineTo(-w*.5,-w*1.3); c.stroke(); const wv=Math.sin(t*10)*w*.03; c.fillStyle=bc; c.beginPath(); c.moveTo(-w*.5,-w*1.3); c.quadraticCurveTo(-w*.62,-w*1.27+wv,-w*.74,-w*1.25); c.lineTo(-w*.49,-w*1.15); c.closePath(); c.fill(); }
  c.lineCap='butt'; mHelmet(c,head[0],head[1],w*.13,L,false,t);
  c.restore(); }

// 雪橇
function sledBack(c,x,y,w,o,t){ const L=o.look||{}; c.save(); c.translate(x,y); c.rotate((o.lean||0)*.35); if(o.crash) c.rotate(t*12);
  c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0,0,w*.48,w*.08,0,0,7); c.fill();
  c.strokeStyle='#c0392b'; c.lineWidth=Math.max(1,w*.05); c.beginPath(); c.moveTo(-w*.38,-w*.02); c.lineTo(-w*.38,-w*.18); c.moveTo(w*.38,-w*.02); c.lineTo(w*.38,-w*.18); c.stroke();
  c.fillStyle=L.sled||'#c8803a'; rr(c,-w*.46,-w*.3,w*.92,w*.16,w*.06); c.fill(); c.fillStyle='rgba(0,0,0,.2)'; c.fillRect(-w*.46,-w*.2,w*.92,w*.03);
  c.fillStyle=L.coat||'#3d8bff'; rr(c,-w*.28,-w*.72,w*.56,w*.46,w*.18); c.fill();
  const sc=L.scarf||'#ff4d4d',fl=Math.sin(t*14)*w*.06; c.fillStyle=sc; c.fillRect(-w*.2,-w*.74,w*.4,w*.08); c.beginPath(); c.moveTo(w*.05,-w*.7); c.lineTo(w*.22+fl,-w*.5); c.lineTo(w*.12+fl,-w*.46); c.lineTo(0,-w*.66); c.fill();
  c.fillStyle='#6a4a2a'; c.beginPath(); c.arc(0,-w*.93,w*.24,0,7); c.fill(); c.fillStyle=L.hat||'#ffd23f'; c.beginPath(); c.arc(0,-w*.98,w*.25,Math.PI*.95,Math.PI*2.05); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(0,-w*1.24,w*.08,0,7); c.fill();
  c.restore(); }
function sledFront(c,x,y,w,L,t){ L=L||{}; c.save(); c.translate(x,y); c.fillStyle=L.sled||'#c8803a'; rr(c,-w*.46,-w*.28,w*.92,w*.16,w*.06); c.fill(); c.strokeStyle='#c0392b'; c.lineWidth=w*.05; c.beginPath(); c.moveTo(-w*.5,-w*.04); c.quadraticCurveTo(-w*.6,-w*.2,-w*.48,-w*.32); c.moveTo(w*.5,-w*.04); c.quadraticCurveTo(w*.6,-w*.2,w*.48,-w*.32); c.stroke();
  c.fillStyle=L.coat||'#3d8bff'; rr(c,-w*.28,-w*.7,w*.56,w*.44,w*.18); c.fill(); c.fillStyle=L.scarf||'#ff4d4d'; c.fillRect(-w*.22,-w*.72,w*.44,w*.09);
  faceFront(c,0,-w*.95,w*.28,L,t); c.fillStyle=L.hat||'#ffd23f'; c.beginPath(); c.arc(0,-w*1.0,w*.29,Math.PI*1.02,Math.PI*1.98); c.fill(); c.fillStyle='#fff'; c.fillRect(-w*.29,-w*1.04,w*.58,w*.06); c.beginPath(); c.arc(0,-w*1.3,w*.08,0,7); c.fill(); c.restore(); }
// 水上摩托車
// 快艇（寫實版）：pwc 坐式水上摩托車、stand 站立式水上摩托、speed 競速快艇；後面看（比賽中）、正面（頒獎台）、側面（造型預覽）
function jSpray(c,w,amt,t,boost,L){ const N=L.nitro||'blue',col=boost?(N==='rainbow'?'hsl('+(t*600%360)+',100%,75%)':N==='fire'?'#ffd8a0':N==='green'?'#d8ffd8':'#d8f4ff'):'#ffffff';
  for(let i=0;i<7;i++){ const a=(i-3)/3,r=w*(.025+Math.random()*.03)*(.5+amt); c.fillStyle=i%3?'rgba(255,255,255,.7)':col; c.beginPath(); c.arc(a*w*.22,w*.01-Math.random()*w*.08*amt,r,0,7); c.fill(); } // 船尾小浪花，不要蓋住船
  if(boost){ c.fillStyle=col; c.globalAlpha=.8; c.beginPath(); c.moveTo(-w*.08,-w*.05); c.quadraticCurveTo(0,-w*(.6+Math.random()*.15),w*.08,-w*.05); c.fill(); c.globalAlpha=1; } }
function sharkMouth(c,x,y,w,dir){ c.fillStyle='#c0262a'; c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x+dir*w*.5,y+w*.18,x+dir*w,y); c.quadraticCurveTo(x+dir*w*.5,y+w*.05,x,y); c.fill(); c.fillStyle='#fff'; for(let i=0;i<5;i++){ const xx=x+dir*w*(.12+i*.17); c.beginPath(); c.moveTo(xx,y+w*.02); c.lineTo(xx+dir*w*.05,y+w*.1); c.lineTo(xx+dir*w*.1,y+w*.03); c.fill(); } c.fillStyle='#14122b'; c.beginPath(); c.arc(x+dir*w*.1,y-w*.12,w*.04,0,7); c.fill(); }
function jRiderBack(c,w,type,L,t,seatY){ const v=L.vest||'#ff7a1a',sk='#2a3a5a';
  if(type==='stand'){ c.fillStyle=sk; for(const s of [-1,1]){ c.beginPath(); c.moveTo(s*w*.04,seatY); c.lineTo(s*w*.12,seatY-w*.05); c.lineTo(s*w*.1,seatY-w*.32); c.lineTo(s*w*.02,seatY-w*.32); c.closePath(); c.fill(); }
    c.fillStyle=v; rr(c,-w*.15,seatY-w*.66,w*.3,w*.36,w*.1); c.fill(); c.fillStyle='rgba(255,255,255,.7)'; c.fillRect(-w*.15,seatY-w*.5,w*.3,w*.03);
    c.fillStyle=sk; for(const s of [-1,1]){ c.beginPath(); c.moveTo(s*w*.12,seatY-w*.62); c.lineTo(s*w*.22,seatY-w*.5); c.lineTo(s*w*.18,seatY-w*.44); c.lineTo(s*w*.1,seatY-w*.55); c.fill(); } return seatY-w*.76; }
  if(type==='speed'){ c.fillStyle=v; rr(c,-w*.15,seatY-w*.32,w*.3,w*.3,w*.1); c.fill(); c.fillStyle='rgba(255,255,255,.7)'; c.fillRect(-w*.15,seatY-w*.2,w*.3,w*.025); return seatY-w*.42; }
  c.fillStyle=sk; for(const s of [-1,1]){ c.beginPath(); c.moveTo(s*w*.12,seatY); c.lineTo(s*w*.26,seatY-w*.04); c.lineTo(s*w*.24,seatY+w*.06); c.lineTo(s*w*.1,seatY+w*.06); c.fill(); }
  c.fillStyle=v; rr(c,-w*.16,seatY-w*.42,w*.32,w*.4,w*.11); c.fill(); c.fillStyle='rgba(255,255,255,.7)'; c.fillRect(-w*.16,seatY-w*.26,w*.32,w*.03);
  c.fillStyle=sk; for(const s of [-1,1]){ c.beginPath(); c.moveTo(s*w*.13,seatY-w*.38); c.lineTo(s*w*.27,seatY-w*.26); c.lineTo(s*w*.24,seatY-w*.2); c.lineTo(s*w*.11,seatY-w*.3); c.fill(); } return seatY-w*.52; }
function jetBack(c,x,y,w,o,t){ const L=o.look||{},type=L.boat||'pwc',hc=L.hull||'#ffd23f',D=decoSet(L),P=type==='pwc',ST=type==='stand',SP=type==='speed';
  c.save(); c.translate(x,y); if(D.has('glow')) glow(c,0,-w*.02,w*.7,'rgba(80,220,255,.6)');
  c.fillStyle='rgba(20,60,110,.35)'; c.beginPath(); c.ellipse(0,w*.02,w*.55,w*.08,0,0,7); c.fill();
  c.rotate((o.lean||0)*.45); if(o.crash) c.rotate(Math.sin(t*12)*.9);
  const hw=SP?w*.5:ST?w*.26:w*.44,deck=SP?-w*.34:ST?-w*.22:-w*.3;
  // 船身：V 字船底、甲板邊、尾板
  c.fillStyle=shade(hc,.72); c.beginPath(); c.moveTo(-hw,deck); c.lineTo(hw,deck); c.lineTo(hw*.7,-w*.04); c.lineTo(0,w*.03); c.lineTo(-hw*.7,-w*.04); c.closePath(); c.fill();
  c.fillStyle=hc; c.beginPath(); c.moveTo(-hw,deck); c.lineTo(hw,deck); c.lineTo(hw*.86,deck+w*.1); c.lineTo(-hw*.86,deck+w*.1); c.closePath(); c.fill();
  c.fillStyle='#f4f4f4'; c.fillRect(-hw*.86,deck+w*.1,hw*1.72,w*.025);
  if(D.has('stripe')){ c.fillStyle='rgba(255,255,255,.85)'; c.fillRect(-hw*.86,deck+w*.135,hw*1.72,w*.02); c.fillStyle='#14122b'; c.fillRect(-hw*.86,deck+w*.16,hw*1.72,w*.015); }
  if(D.has('flame')) for(const s of [-1,1]) mFlame(c,s*hw*.2,deck+w*.2,hw*.6,w*.07,s);
  if(D.has('shark')){ sharkMouth(c,-hw*.65,deck+w*.2,hw*.45,1); sharkMouth(c,hw*.65,deck+w*.2,hw*.45,-1); }
  // 噴嘴、引擎
  if(SP){ c.fillStyle='#1e1e24'; rr(c,-w*.1,deck-w*.3,w*.2,w*.3,w*.05); c.fill(); c.fillStyle=hc; c.fillRect(-w*.1,deck-w*.24,w*.2,w*.04); c.fillStyle='#3a3a44'; c.fillRect(-w*.03,deck,w*.06,w*.22);
    c.fillStyle='rgba(140,200,240,.55)'; c.beginPath(); c.moveTo(-hw*.7,deck-w*.02); c.lineTo(hw*.7,deck-w*.02); c.lineTo(hw*.55,deck-w*.16); c.lineTo(-hw*.55,deck-w*.16); c.closePath(); c.fill(); }
  else { c.fillStyle='#2a2a30'; c.beginPath(); c.ellipse(0,deck+w*.2,w*.06,w*.04,0,0,7); c.fill(); c.fillStyle='#e8202a'; c.fillRect(-hw*.6,deck+w*.04,w*.06,w*.03); c.fillRect(hw*.6-w*.06,deck+w*.04,w*.06,w*.03); }
  if(o.night) glow(c,0,deck,w*.3,'rgba(255,40,40,.35)');
  if(D.has('num')) mNumber(c,SP?hw*.6:0,deck+w*.06,w*.05,o.num);
  // 浪花
  jSpray(c,w,(o.spd||0),t,o.boost,L);
  // 座墊、騎士
  let seatY=deck;
  if(P){ c.fillStyle='#22222a'; rr(c,-w*.14,deck-w*.08,w*.28,w*.1,w*.04); c.fill(); seatY=deck-w*.06; }
  if(ST){ c.strokeStyle='#3a3a48'; c.lineWidth=Math.max(1,w*.025); c.beginPath(); c.moveTo(0,deck); c.lineTo(0,deck-w*.55); c.moveTo(-w*.2,deck-w*.55); c.lineTo(w*.2,deck-w*.55); c.stroke(); }
  const headY=jRiderBack(c,w,type,L,t,SP?deck-w*.04:seatY);
  if(D.has('wing')&&SP){ c.fillStyle=hc; c.fillRect(-hw*.8,deck-w*.42,hw*1.6,w*.04); c.fillStyle='#2a2a30'; c.fillRect(-hw*.7,deck-w*.38,w*.03,w*.36); c.fillRect(hw*.7-w*.03,deck-w*.38,w*.03,w*.36); }
  mHelmet(c,0,headY,w*.12,L,false,t);
  if(D.has('flag')||D.has('wing')&&!SP){ const fx=hw*.7,fy=deck; c.strokeStyle='#d8d8e0'; c.lineWidth=Math.max(1,w*.012); c.beginPath(); c.moveTo(fx,fy); c.lineTo(fx,fy-w*.8); c.stroke(); const wv=Math.sin(t*10)*w*.03; c.fillStyle=D.has('flag')?'#ff7a1a':hc; c.beginPath(); c.moveTo(fx,fy-w*.8); c.quadraticCurveTo(fx+w*.12,fy-w*.77+wv,fx+w*.24,fy-w*.75); c.lineTo(fx,fy-w*.66); c.closePath(); c.fill(); }
  if(D.has('light')){ const on=Math.floor(t*4)%2; c.fillStyle=on?'#ff3b3b':'#3d8bff'; c.beginPath(); c.arc(-hw*.7,deck-w*.08,w*.03,0,7); c.fill(); glow(c,-hw*.7,deck-w*.08,w*.12,on?'rgba(255,60,60,.5)':'rgba(60,140,255,.5)'); }
  c.restore(); }
function jetFront(c,x,y,w,L,t){ L=L||{}; const type=L.boat||'pwc',hc=L.hull||'#ffd23f',D=decoSet(L),SP=type==='speed',ST=type==='stand',v=L.vest||'#ff7a1a';
  c.save(); c.translate(x,y); if(D.has('glow')) glow(c,0,0,w*.65,'rgba(80,220,255,.55)'); c.fillStyle='rgba(120,200,255,.6)'; c.beginPath(); c.ellipse(0,0,w*.6,w*.08,0,0,7); c.fill();
  const hw=SP?w*.48:ST?w*.25:w*.42;
  c.fillStyle=hc; c.beginPath(); c.moveTo(-hw,-w*.3); c.lineTo(0,-w*.36); c.lineTo(hw,-w*.3); c.lineTo(hw*.5,-w*.06); c.lineTo(0,0); c.lineTo(-hw*.5,-w*.06); c.closePath(); c.fill();
  c.fillStyle=shade(hc,.78); c.beginPath(); c.moveTo(0,-w*.36); c.lineTo(hw*.5,-w*.06); c.lineTo(0,0); c.closePath(); c.fill();
  if(D.has('shark')){ sharkMouth(c,-hw*.55,-w*.2,hw*.5,1); sharkMouth(c,hw*.55,-w*.2,hw*.5,-1); }
  if(D.has('num')) mNumber(c,0,-w*.24,w*.06,L.num);
  if(SP){ c.fillStyle='rgba(140,200,240,.6)'; c.beginPath(); c.moveTo(-hw*.7,-w*.36); c.lineTo(hw*.7,-w*.36); c.lineTo(hw*.5,-w*.5); c.lineTo(-hw*.5,-w*.5); c.closePath(); c.fill(); }
  else { c.strokeStyle='#3a3a48'; c.lineWidth=Math.max(1,w*.03); const hb=ST?-w*.82:-w*.52; c.beginPath(); c.moveTo(-w*.26,hb); c.lineTo(w*.26,hb); c.stroke(); if(ST){ c.beginPath(); c.moveTo(0,hb); c.lineTo(0,-w*.36); c.stroke(); } }
  const top=SP?-w*.78:ST?-w*1.18:-w*.92; c.fillStyle=v; rr(c,-w*.16,top+w*.12,w*.32,SP?w*.28:w*.38,w*.1); c.fill(); c.fillStyle='rgba(255,255,255,.7)'; c.fillRect(-w*.16,top+w*.28,w*.32,w*.03);
  mHelmet(c,0,top,w*.14,L,true,t); c.restore(); }
function jetSide(c,x,y,w,L,t){ L=L||{}; const type=L.boat||'pwc',hc=L.hull||'#ffd23f',D=decoSet(L),SP=type==='speed',ST=type==='stand',v=L.vest||'#ff7a1a',sk='#2a3a5a';
  c.save(); c.translate(x,y); if(D.has('glow')) glow(c,0,-w*.05,w*.75,'rgba(80,220,255,.5)');
  const L2=SP?w*.62:ST?w*.46:w*.54,hh=SP?w*.24:w*.2;
  // 船身側面：船頭翹起
  c.fillStyle=shade(hc,.75); c.beginPath(); c.moveTo(-L2,-hh*.2); c.lineTo(L2*.6,-hh*.1); c.quadraticCurveTo(L2*.95,-hh*.3,L2,-hh); c.lineTo(-L2,-hh); c.closePath(); c.fill();
  c.fillStyle=hc; c.beginPath(); c.moveTo(-L2,-hh); c.lineTo(L2,-hh); c.quadraticCurveTo(L2*.7,-hh*1.35,L2*.2,-hh*1.25); c.lineTo(-L2,-hh*1.15); c.closePath(); c.fill();
  c.fillStyle='#f4f4f4'; c.fillRect(-L2,-hh*.62,L2*1.6,w*.02);
  if(D.has('stripe')){ c.fillStyle='#14122b'; c.fillRect(-L2,-hh*.55,L2*1.6,w*.015); }
  if(D.has('flame')) mFlame(c,-L2*.4,-hh*.5,L2*.8,w*.08,1);
  if(D.has('shark')) sharkMouth(c,L2*.85,-hh*.5,L2*.4,-1);
  if(D.has('num')) mNumber(c,-L2*.1,-hh*.62,w*.05,L.num);
  if(SP){ c.fillStyle='#1e1e24'; rr(c,-L2-w*.1,-hh*1.6,w*.14,hh*1.4,w*.04); c.fill(); c.fillStyle=hc; c.fillRect(-L2-w*.1,-hh*1.45,w*.14,w*.03); c.fillStyle='#3a3a44'; c.fillRect(-L2-w*.06,-hh*.2,w*.05,hh*.6);
    c.fillStyle='rgba(140,200,240,.6)'; c.beginPath(); c.moveTo(L2*.15,-hh*1.25); c.lineTo(-L2*.05,-hh*1.85); c.lineTo(-L2*.12,-hh*1.25); c.closePath(); c.fill(); if(D.has('wing')){ c.fillStyle=hc; c.fillRect(-L2*.95,-hh*2.1,L2*.4,w*.04); c.fillRect(-L2*.8,-hh*2.1,w*.03,hh*.9); } }
  else { c.fillStyle='#22222a'; rr(c,-L2*.5,-hh*1.35,L2*.6,w*.07,w*.03); c.fill(); c.strokeStyle='#3a3a48'; c.lineWidth=Math.max(1,w*.025); c.beginPath(); if(ST){ c.moveTo(L2*.55,-hh*1.15); c.lineTo(L2*.2,-hh*1.15-w*.55); c.lineTo(L2*.3,-hh*1.15-w*.6); } else { c.moveTo(L2*.3,-hh*1.2); c.lineTo(L2*.22,-hh*1.2-w*.22); c.lineTo(L2*.32,-hh*1.2-w*.24); } c.stroke(); }
  // 騎士
  c.lineCap='round'; const limb=(a,b,wd,col)=>{ c.strokeStyle=col; c.lineWidth=wd; c.beginPath(); c.moveTo(a[0],a[1]); c.lineTo(b[0],b[1]); c.stroke(); };
  const base=-hh*1.25; let hip,sh,hd,hand,knee,foot;
  if(ST){ foot=[L2*.05,base]; knee=[L2*.1,base-w*.2]; hip=[-L2*.05,base-w*.38]; sh=[L2*.08,base-w*.68]; hd=[L2*.14,base-w*.82]; hand=[L2*.3,base-w*.6]; }
  else if(SP){ hip=[-L2*.35,base]; knee=[-L2*.1,base-w*.08]; foot=[L2*.05,base+w*.02]; sh=[-L2*.32,base-w*.32]; hd=[-L2*.28,base-w*.46]; hand=[-L2*.05,base-w*.2]; }
  else { hip=[-L2*.25,base-w*.08]; knee=[L2*.0,base-w*.16]; foot=[-L2*.05,base+w*.02]; sh=[-L2*.15,base-w*.44]; hd=[-L2*.1,base-w*.58]; hand=[L2*.22,base-w*.3]; }
  limb(hip,knee,w*.09,sk); limb(knee,foot,w*.08,sk); limb(hip,sh,w*.17,v); limb(sh,hand,w*.07,sk); c.fillStyle='#1a1a1e'; c.beginPath(); c.arc(hand[0],hand[1],w*.03,0,7); c.fill();
  c.lineCap='butt'; mHelmet(c,hd[0],hd[1],w*.12,L,false,t);
  if(D.has('flag')){ c.strokeStyle='#d8d8e0'; c.lineWidth=Math.max(1,w*.012); c.beginPath(); c.moveTo(-L2*.85,-hh*1.15); c.lineTo(-L2*.9,-hh*1.15-w*.7); c.stroke(); const wv=Math.sin(t*10)*w*.03; c.fillStyle='#ff7a1a'; c.beginPath(); c.moveTo(-L2*.9,-hh*1.15-w*.7); c.quadraticCurveTo(-L2*1.05,-hh*1.15-w*.67+wv,-L2*1.2,-hh*1.15-w*.65); c.lineTo(-L2*.89,-hh*1.15-w*.56); c.closePath(); c.fill(); }
  if(D.has('light')){ const on=Math.floor(t*4)%2; c.fillStyle=on?'#ff3b3b':'#3d8bff'; c.beginPath(); c.arc(-L2*.6,-hh*1.3,w*.03,0,7); c.fill(); }
  // 水花
  c.fillStyle='rgba(255,255,255,.85)'; for(let i=0;i<7;i++){ c.beginPath(); c.arc(-L2-i*w*.06,-hh*.2-Math.sin(t*8+i)*w*.04,w*.04+(i%3)*w*.01,0,7); c.fill(); }
  c.fillStyle='rgba(60,150,220,.5)'; c.fillRect(-L2*1.4,-hh*.15,L2*2.8,w*.06);
  c.restore(); }

// 動物
const ANIMALS={cat:{fur:'#f4b45a',ear:'pt',tail:'long',name:'貓咪'},dog:{fur:'#c8905a',ear:'flop',tail:'short',name:'小狗'},bunny:{fur:'#f4f0f0',ear:'long',tail:'puff',name:'兔子'},bear:{fur:'#9a6a42',ear:'round',tail:'puff',name:'小熊'},
  panda:{fur:'#ffffff',ear:'round',tail:'puff',dark:'#2a2a30',name:'熊貓'},fox:{fur:'#ff8a3a',ear:'pt',tail:'fluffy',name:'狐狸'},penguin:{fur:'#2a2a3a',ear:'none',tail:'none',belly:'#fff',name:'企鵝'},frog:{fur:'#6fcf5a',ear:'eyes',tail:'none',name:'青蛙'}};
function animalEars(c,x,y,r,A,dark){ const ec=A.dark||shade(A.fur,.85); c.fillStyle=ec;
  if(A.ear==='pt') for(const s of [-1,1]){ c.beginPath(); c.moveTo(x+s*r*.75,y-r*.3); c.lineTo(x+s*r*.55,y-r*1.15); c.lineTo(x+s*r*.15,y-r*.75); c.fill(); }
  else if(A.ear==='long') for(const s of [-1,1]){ c.beginPath(); c.ellipse(x+s*r*.38,y-r*1.25,r*.2,r*.6,s*.15,0,7); c.fill(); c.fillStyle='#ffb0c0'; c.beginPath(); c.ellipse(x+s*r*.38,y-r*1.25,r*.09,r*.42,s*.15,0,7); c.fill(); c.fillStyle=ec; }
  else if(A.ear==='round') for(const s of [-1,1]){ c.beginPath(); c.arc(x+s*r*.7,y-r*.72,r*.3,0,7); c.fill(); }
  else if(A.ear==='flop') for(const s of [-1,1]){ c.beginPath(); c.ellipse(x+s*r*.85,y-r*.1,r*.22,r*.48,s*.3,0,7); c.fill(); }
  else if(A.ear==='eyes') for(const s of [-1,1]){ c.fillStyle=A.fur; c.beginPath(); c.arc(x+s*r*.45,y-r*.8,r*.3,0,7); c.fill(); if(!dark){ c.fillStyle='#fff'; c.beginPath(); c.arc(x+s*r*.45,y-r*.82,r*.2,0,7); c.fill(); c.fillStyle='#14122b'; c.beginPath(); c.arc(x+s*r*.45,y-r*.8,r*.1,0,7); c.fill(); } } }
function animalBack(c,x,y,w,o,t){ const L=o.look||{},A=ANIMALS[L.animal]||ANIMALS.cat,ph=t*(o.run||10),b=Math.abs(Math.sin(ph))*w*.08; c.save(); c.translate(x,y);
  if(o.crash) c.rotate(Math.sin(t*14)*.6);
  c.fillStyle='rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0,0,w*.32,w*.06,0,0,7); c.fill();
  const slide=o.slide; if(slide){ c.translate(0,-w*.02); c.scale(1.2,.55); }
  c.translate(0,-b-(o.air||0));
  // 腳（一前一後交替）
  c.fillStyle=A.dark||shade(A.fur,.8); for(const s of [-1,1]){ const k=Math.sin(ph+(s>0?0:Math.PI)); c.beginPath(); c.ellipse(s*w*.15,-w*.08+k*w*.05,w*.09,w*.1,0,0,7); c.fill(); }
  c.fillStyle=A.fur; c.beginPath(); c.ellipse(0,-w*.38,w*.26,w*.26,0,0,7); c.fill(); // 身體
  c.fillStyle=L.cloth||'#ff4d4d'; c.beginPath(); c.ellipse(0,-w*.42,w*.24,w*.14,0,0,7); c.fill(); c.fillStyle='#fff'; c.font='900 '+Math.max(4,w*.14)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(o.num||'1',0,-w*.42);
  if(A.tail!=='none'){ c.fillStyle=A.tail==='fluffy'?A.fur:A.dark||A.fur; const sw=Math.sin(ph*.5)*w*.05; if(A.tail==='long'){ c.strokeStyle=A.fur; c.lineWidth=w*.06; c.lineCap='round'; c.beginPath(); c.moveTo(0,-w*.22); c.quadraticCurveTo(w*.18+sw,-w*.3,w*.1+sw,-w*.55); c.stroke(); c.lineCap='butt'; }
    else { c.beginPath(); c.arc(sw,-w*.22,A.tail==='fluffy'?w*.13:w*.08,0,7); c.fill(); if(A.tail==='fluffy'){ c.fillStyle='#fff'; c.beginPath(); c.arc(sw,-w*.17,w*.06,0,7); c.fill(); } } }
  c.fillStyle=A.fur; c.beginPath(); c.arc(0,-w*.8,w*.3,0,7); c.fill(); animalEars(c,0,-w*.8,w*.3,A,true); c.fillStyle=A.fur; c.beginPath(); c.arc(0,-w*.8,w*.3,0,7); c.fill();
  if(L.hat&&L.hat!=='none') hatOn(c,0,-w*1.05,w*.3,L.hat);
  c.strokeStyle='rgba(20,18,43,.6)'; c.lineWidth=Math.max(1,w*.02); c.beginPath(); c.arc(0,-w*.8,w*.3,0,7); c.stroke(); c.restore(); }
function hatOn(c,x,y,r,h){ if(h==='band'){ c.fillStyle='#ff4d4d'; c.fillRect(x-r,y+r*.1,r*2,r*.25); } else if(h==='cap'){ c.fillStyle='#3d8bff'; c.beginPath(); c.arc(x,y+r*.35,r*.75,Math.PI,0); c.fill(); c.fillRect(x-r*.1,y+r*.3,r*1.1,r*.15); } else if(h==='crown'){ c.fillStyle='#ffd23f'; c.beginPath(); c.moveTo(x-r*.5,y+r*.3); c.lineTo(x-r*.5,y-r*.2); c.lineTo(x-r*.25,y+r*.05); c.lineTo(x,y-r*.35); c.lineTo(x+r*.25,y+r*.05); c.lineTo(x+r*.5,y-r*.2); c.lineTo(x+r*.5,y+r*.3); c.fill(); } else if(h==='flower'){ for(let i=0;i<5;i++){ c.fillStyle='#ff9ac8'; c.beginPath(); c.arc(x+r*.4+Math.cos(i*1.26)*r*.18,y+r*.1+Math.sin(i*1.26)*r*.18,r*.13,0,7); c.fill(); } c.fillStyle='#ffd23f'; c.beginPath(); c.arc(x+r*.4,y+r*.1,r*.1,0,7); c.fill(); } }
function animalFront(c,x,y,w,L,t){ L=L||{}; const A=ANIMALS[L.animal]||ANIMALS.cat,b=Math.abs(Math.sin((t||0)*6))*w*.04; c.save(); c.translate(x,y-b);
  c.fillStyle='rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0,b,w*.3,w*.05,0,0,7); c.fill();
  c.fillStyle=A.dark||shade(A.fur,.8); for(const s of [-1,1]){ c.beginPath(); c.ellipse(s*w*.13,-w*.06,w*.1,w*.08,0,0,7); c.fill(); }
  c.fillStyle=A.fur; c.beginPath(); c.ellipse(0,-w*.36,w*.25,w*.25,0,0,7); c.fill(); if(A.belly){ c.fillStyle=A.belly; c.beginPath(); c.ellipse(0,-w*.33,w*.16,w*.2,0,0,7); c.fill(); }
  c.fillStyle=L.cloth||'#ff4d4d'; c.beginPath(); c.ellipse(0,-w*.42,w*.24,w*.13,0,0,7); c.fill();
  c.fillStyle=A.fur; animalEars(c,0,-w*.82,w*.32,A,false); c.fillStyle=A.fur; c.beginPath(); c.arc(0,-w*.82,w*.32,0,7); c.fill();
  if(L.animal==='panda'){ c.fillStyle=A.dark; for(const s of [-1,1]){ c.beginPath(); c.ellipse(s*w*.11,-w*.84,w*.08,w*.1,s*.4,0,7); c.fill(); } }
  if(L.animal==='penguin'){ c.fillStyle='#fff'; c.beginPath(); c.ellipse(0,-w*.78,w*.24,w*.2,0,0,7); c.fill(); }
  // 眼睛、腮紅、ω 嘴
  const r=w*.32,blink=Math.sin((t||0)*1.3)>.97,ey=-w*.84;
  for(const s of [-1,1]){ if(blink){ c.strokeStyle='#14122b'; c.lineWidth=Math.max(1,r*.07); c.beginPath(); c.moveTo(s*r*.32-r*.1,ey); c.lineTo(s*r*.32+r*.1,ey); c.stroke(); } else { c.fillStyle=L.animal==='panda'?'#fff':'#14122b'; c.beginPath(); c.ellipse(s*r*.32,ey,r*.12,r*.16,0,0,7); c.fill(); if(L.animal==='panda'){ c.fillStyle='#14122b'; c.beginPath(); c.arc(s*r*.32,ey,r*.08,0,7); c.fill(); } c.fillStyle='#fff'; c.beginPath(); c.arc(s*r*.32-r*.04,ey-r*.06,r*.045,0,7); c.fill(); }
    c.fillStyle='rgba(255,120,140,.5)'; c.beginPath(); c.ellipse(s*r*.55,ey+r*.25,r*.12,r*.07,0,0,7); c.fill(); }
  if(L.animal==='penguin'){ c.fillStyle='#ffb02a'; c.beginPath(); c.moveTo(-r*.12,ey+r*.15); c.lineTo(r*.12,ey+r*.15); c.lineTo(0,ey+r*.32); c.fill(); }
  else { c.fillStyle='#14122b'; c.beginPath(); c.arc(0,ey+r*.15,r*.06,0,7); c.fill(); c.strokeStyle='#14122b'; c.lineWidth=Math.max(1,r*.05); c.beginPath(); c.arc(-r*.07,ey+r*.24,r*.07,0,Math.PI); c.arc(r*.07,ey+r*.24,r*.07,0,Math.PI); c.stroke(); }
  if(L.hat&&L.hat!=='none') hatOn(c,0,-w*1.1,w*.32,L.hat);
  c.strokeStyle='rgba(20,18,43,.6)'; c.lineWidth=Math.max(1,w*.015); c.beginPath(); c.arc(0,-w*.82,w*.32,0,7); c.stroke(); c.restore(); }

/* ================= 賽道產生與投影 ================= */
function buildCourse(G,si){ const S=G.stages[si],r=rng(G.id+':'+si+':v1'),segs=[]; let y=0;
  const push=curve=>segs.push({curve,y,spr:[],obs:[]});
  const sec=(n,curve,dy)=>{ n=Math.max(8,n|0); const y0=y,e=Math.max(2,Math.floor(n/4)); for(let k=0;k<n;k++){ const f=k<e?k/e:k>=n-e?(n-k)/e:1; push(curve*f*f*(3-2*f)); y=y0+dy*(1-Math.cos(Math.PI*(k+1)/n))/2; } };
  sec(50,0,G.down?-50*SEGL*S.slope*.4:0);
  while(segs.length<S.len){ const n=30+r()*80,straight=r()<(S.straight||.25),cv=straight?0:(r()*2-1)*S.curve;
    let dy=(r()*2-1)*S.hill; if(G.down) dy=-n*SEGL*S.slope*(.5+r())+(r()-.5)*S.hill*.6; sec(n,cv,dy); }
  sec(120,0,G.down?-120*SEGL*S.slope*.3:0); push(0); push(0);
  const C={segs,n:segs.length,start:20,finish:segs.length-90,G,S,TH:G.theme(S),wave:S.wave||0};
  // 場景擺設
  const TH=C.TH,tot=TH.spr.reduce((q,x)=>q+x[1],0);
  for(let i=0;i<C.n;i++){ const s=segs[i];
    for(const side of [-1,1]) if(r()<TH.dens){ let q=r()*tot,k=TH.spr[0][0]; for(const [nm,wt] of TH.spr){ q-=wt; if(q<=0){ k=nm; break; } } s.spr.push({k,x:side*(TH.near+r()*TH.spread),v:(r()*97)|0}); }
    if(TH.edge&&i%TH.edge[1]===0) for(const side of [-1,1]) s.spr.push({k:TH.edge[0],x:side*TH.edge[2],v:i});
    if(i>30&&i<C.finish-20&&Math.abs(segs[i+12]?segs[i+12].curve:0)>S.curve*.55&&Math.abs(s.curve)<.4&&!TH.nosign&&i%6===0){ const d=segs[i+12].curve; s.spr.push({k:'sign',x:d>0?-1.25:1.25,d}); } }
  segs[C.start].spr.push({k:'flagarch',x:0,label:'START'}); segs[C.finish].spr.push({k:'flagarch',x:0,label:'FINISH'});
  G.place(C,r); // 每款遊戲自己的障礙物、道具
  for(const s of segs){ s.obs.sort((a,b)=>a.dz-b.dz); }
  return C; }
const segY=(C,i,t)=>{ const s=C.segs[clamp(i,0,C.n-1)]; return s.y+(C.wave?(Math.sin(i*.33+t*2.1)+Math.sin(i*.11-t*1.4)*.6)*C.wave:0); };
function groundY(C,z,t){ const i=Math.floor(z/SEGL),p=(z-i*SEGL)/SEGL; return lerp(segY(C,i,t),segY(C,i+1,t),p); }
const segAt=(C,z)=>C.segs[clamp(Math.floor(z/SEGL),0,C.n-1)];
// 背景遠景：天空漸層、遠山／城市剪影（隨彎道左右移動）
const CLOUD={};
function drawBack(c,VW,VH,TH,bx,by,t){
  const hz=VH*.5+by,far=TH.far,ox=((bx%VW)+VW)%VW,N=TH.night,fogC=TH.fog||'#d0e0f0';
  const g=c.createLinearGradient(0,0,0,hz); g.addColorStop(0,shade(TH.sky[0],.92)); g.addColorStop(.55,TH.sky[0]); g.addColorStop(.85,TH.sky[1]); g.addColorStop(1,mixC(TH.sky[1],fogC,.5)); c.fillStyle=g; c.fillRect(0,0,VW,VH);
  if(TH.sun){ glow(c,VW*.72,VH*.2,VH*.5,TH.sun); c.fillStyle='rgba(255,236,190,.9)'; c.beginPath(); c.arc(VW*.72,VH*.2,VH*.045,0,7); c.fill(); }
  else if(!N&&!TH.rain){ glow(c,VW*.8,VH*.06,VH*.55,'rgba(255,252,235,.45)'); }
  if(N){ for(let i=0;i<40;i++){ c.fillStyle='rgba(255,255,255,'+(.3+.5*Math.abs(Math.sin(t+i)))+')'; c.fillRect((i*97+bx*.05)%VW,(i*41)%(VH*.4),1.5,1.5); } c.fillStyle='rgba(255,250,225,.9)'; c.beginPath(); c.arc(VW*.18,VH*.12,VH*.03,0,7); c.fill(); glow(c,VW*.18,VH*.12,VH*.12,'rgba(220,230,255,.25)'); }
  /* 雲：一團一團、受光面亮、底部暗，跟著轉彎慢慢移動 */
  if(!N&&!TH.aurora){ const cc=TH.rain?[150,156,166]:TH.sun?[255,214,180]:[255,255,255],sh=TH.rain?[110,116,128]:TH.sun?[214,150,140]:[200,212,228];
    const key=cc+'|'+sh; let im=CLOUD[key]; if(!im){ im=CLOUD[key]=document.createElement('canvas'); im.width=240; im.height=110; const q=im.getContext('2d'),r=40;
      for(let j=0;j<5;j++){ const px=120+(j-2)*r*.75,py=70-Math.sin(j/4*Math.PI)*r*.45,rr2=r*(.6+Math.sin(j/4*Math.PI)*.45),cg=q.createRadialGradient(px,py-rr2*.3,1,px,py,rr2);
        cg.addColorStop(0,'rgba('+cc+','+(TH.rain?.75:.85)+')'); cg.addColorStop(.7,'rgba('+sh+','+(TH.rain?.5:.45)+')'); cg.addColorStop(1,'rgba('+sh+',0)'); q.fillStyle=cg; q.beginPath(); q.arc(px,py,rr2,0,7); q.fill(); } }
    for(let i=0;i<7;i++){ const cx=((i*233+bx*.08+t*3)%(VW+300)+VW+300)%(VW+300)-150,cy=VH*(.08+(i%4)*.07),r=VH*(.05+(i%3)*.025),k=r/40; c.drawImage(im,cx-120*k,cy-70*k,240*k,110*k); } }
  if(TH.aurora){ for(let i=0;i<3;i++){ c.fillStyle='rgba('+(80+i*40)+',255,'+(170-i*30)+',.18)'; c.beginPath(); c.moveTo(0,VH*.12+i*14); for(let x=0;x<=VW;x+=20) c.lineTo(x,VH*(.12+.05*Math.sin(x/120+t*.6+i))+i*14); c.lineTo(VW,VH*.3+i*14); c.lineTo(0,VH*.3+i*14); c.fill(); } }
  const layer=(col,amp,base,fr,kind)=>{ c.fillStyle=col; c.beginPath(); c.moveTo(0,VH); for(let x=-8;x<=VW+8;x+=8){ const u=(x+ox*(base>0?.6:1))/VW*Math.PI*2; let yy;
      if(kind==='city'){ const b=Math.floor((x+ox*(base>0?.6:1))/28); yy=hz-amp*(.35+((b*7919)%13)/13*.65); }
      else yy=hz-amp*(.5+.3*Math.sin(u*fr)+.2*Math.sin(u*fr*2.3+1)+.04*Math.sin(u*fr*9)); c.lineTo(x,yy); } c.lineTo(VW+8,VH); c.fill(); };
  /* 遠方高樓：每棟有亮面、暗面、窗格，越遠越淡 */
  const skyline=(col,amp,par,seed,alpha)=>{ const o2=ox*par,bw=VW/22; c.globalAlpha=alpha;
    for(let k=Math.floor(o2/bw)-1;k<Math.floor((o2+VW)/bw)+2;k++){ const hs=((k*7919+seed)%97+97)%97/97,bh=amp*(.3+hs*.7)*(hs>.85?1.5:1),x0=k*bw-o2,w2=bw*(.7+((k*31+seed)%5)/10);
      c.fillStyle=col; c.fillRect(x0,hz-bh,w2,bh+2); c.fillStyle='rgba(0,0,0,.12)'; c.fillRect(x0+w2*.66,hz-bh,w2*.34,bh+2);
      c.fillStyle=N?'rgba(255,220,140,.35)':'rgba(255,255,255,.12)'; for(let yy=hz-bh+4;yy<hz-3;yy+=5) c.fillRect(x0+2,yy,w2-4,1.6);
      if(hs>.85){ c.fillStyle=col; c.fillRect(x0+w2*.45,hz-bh-amp*.25,1.5,amp*.25); if(N){ c.fillStyle=Math.sin(t*3+k)>0?'#ff4040':'#601010'; c.fillRect(x0+w2*.45-1,hz-bh-amp*.25-2,3.5,3); } } }
    c.globalAlpha=1; };
  if(far==='city'){ skyline(mixC(TH.farCol2||'#6a7a90',fogC,.35),VH*.24,.3,11,1); skyline(TH.farCol||'#4a5a70',VH*.15,.6,37,1); }
  else if(far==='sea'){ const sg=c.createLinearGradient(0,hz-VH*.02,0,VH); sg.addColorStop(0,mixC(TH.farCol||'#3a8ad0',fogC,.45)); sg.addColorStop(.3,TH.farCol||'#3a8ad0'); sg.addColorStop(1,shade(TH.farCol||'#3a8ad0',.7)); c.fillStyle=sg; c.fillRect(0,hz-VH*.02,VW,VH);
    c.fillStyle=N?'rgba(255,240,200,.12)':'rgba(255,255,255,.35)'; for(let i=0;i<40;i++){ const yy=hz+((i*37)%60)/60*VH*.12,xx=((i*173+ox*.3+t*(6+i%5))%VW+VW)%VW; c.fillRect(xx,yy,6+(i%4)*4,1); }
    if(TH.sun){ c.fillStyle='rgba(255,210,150,.35)'; c.fillRect(VW*.72-VH*.05,hz-VH*.02,VH*.1,VH*.14); }
    if(TH.isle){ layer(mixC(TH.farCol2||'#5a9a6a',fogC,.45),VH*.06,0,2); } }
  else if(far!=='none'){ layer(mixC(TH.farCol2||'#8ab0c8',fogC,.3),VH*.2,0,2); layer(TH.farCol||'#5a8aa0',VH*.12,1,3);
    if(far==='mountain'||far==='snowmtn'){ c.fillStyle='rgba(0,0,0,.08)'; for(let i=0;i<9;i++){ const xx=((i*131-ox*.6)%VW+VW)%VW; c.beginPath(); c.moveTo(xx,hz-VH*.09); c.lineTo(xx+VW*.03,hz); c.lineTo(xx-VW*.01,hz); c.fill(); } } }
  /* 地平線的霧氣 */
  const hg=c.createLinearGradient(0,hz-VH*.16,0,hz+2); hg.addColorStop(0,'rgba(0,0,0,0)'); hg.addColorStop(1,fogC); c.globalAlpha=N?.55:.75; c.fillStyle=hg; c.fillRect(0,hz-VH*.16,VW,VH*.16+2); c.globalAlpha=1; }
// 畫一個視窗：cam＝{x,z,airY,bx}，items＝每段要畫的動態物件
function renderView(c,vp,C,cam,items,t,o){ o=o||{}; const TH=C.TH,segs=C.segs,VW=vp.w,VH=vp.h,half=VW/2,hh=VH/2,CAMH=C.G.camH,PZ=CAMH*CDEPTH;
  c.save(); c.beginPath(); c.rect(vp.x,vp.y,VW,VH); c.clip(); c.translate(vp.x,vp.y);
  const pos=Math.max(0,cam.z-PZ*1.75),bi=Math.floor(pos/SEGL),bp=(pos-bi*SEGL)/SEGL,pY=groundY(C,cam.z,t),camY=pY+CAMH+(cam.airY||0)*.55,camX=cam.x*ROADW;
  TH._cx=half; TH._hz=hh; V3.cx=half; drawBack(c,VW,VH,TH,cam.bx||0,clamp(-(pY-segY(C,bi+DRAW-1,t))*.02,-VH*.15,VH*.15),t);
  const fogC=TH.fog,dark=TH.night;
  let x=0,dx=-(segs[Math.min(bi,C.n-1)].curve*bp),maxy=VH; const vis=[];
  for(let n=0;n<DRAW;n++){ const i=bi+n; if(i>=C.n-1) break; const s=segs[i],z1=i*SEGL-pos,z2=(i+1)*SEGL-pos;
    const sc1=CDEPTH/Math.max(1,z1),sc2=CDEPTH/Math.max(1,z2);
    const X1=half+sc1*(x-camX)*half,Y1=hh-sc1*(segY(C,i,t)-camY)*hh,W1=sc1*ROADW*half;
    const X2=half+sc2*(x+dx-camX)*half,Y2=hh-sc2*(segY(C,i+1,t)-camY)*hh,W2=sc2*ROADW*half;
    x+=dx; dx+=s.curve; s._x=X1; s._y=Y1; s._s=sc1*half; s._clip=maxy; s._n=n; vis.push(i);
    if(z1<=CDEPTH*10||Y2>=Y1||Y2>=maxy) continue;
    const f=Math.min(1,Math.pow(n/DRAW,1.6)*(TH.mist||1)),band=Math.floor((i+(TH.water?t*4:0))/RUMBLE)%2,F=col=>f>.02?mixC(col,fogC,f):col;
    c.fillStyle=F(TH.ground[band]); c.fillRect(0,Y2-.5,VW,Y1-Y2+.5);
    const poly=(xa,ya,wa,xb,yb,wb,col)=>{ c.fillStyle=col; c.beginPath(); c.moveTo(xa-wa,ya+.6); c.lineTo(xa+wa,ya+.6); c.lineTo(xb+wb,yb-.6); c.lineTo(xb-wb,yb-.6); c.fill(); }; /* 上下各多 0.6 像素，避免路面出現接縫細線 */
    if(TH.rumble){ const rc=F(TH.rumble[band]); poly(X1-W1*1.055,Y1,W1*.065,X2-W2*1.055,Y2,W2*.065,rc); poly(X1+W1*1.055,Y1,W1*.065,X2+W2*1.055,Y2,W2*.065,rc); } /* 只畫兩側路緣，整片畫在路面底下會從接縫透出細線 */
    poly(X1,Y1,W1,X2,Y2,W2,F(TH.road[band]));
    if(TH.tracks&&n<90){ const tw1=W1*.05,tw2=W2*.05,tc=F(shade(TH.road[0],.86)); for(let L=0;L<TH.lanes;L++){ const k=-1+(2*L+1)/TH.lanes; for(const e of [-.3,.3]){ const kk=k+e/TH.lanes; poly(X1+W1*kk,Y1,tw1,X2+W2*kk,Y2,tw2,tc); } } }
    if(TH.tracks&&n<60&&((i*7919)%23)===0) poly(X1+W1*(((i*31)%10)/10-.5),Y1,W1*.18,X2+W2*(((i*31)%10)/10-.5),Y2,W2*.18,F(shade(TH.road[0],.8)));
    if(TH.lanes&&band){ const lw1=W1*.03,lw2=W2*.03; for(let L=1;L<TH.lanes;L++){ const k=-1+2*L/TH.lanes; poly(X1+W1*k,Y1,lw1,X2+W2*k,Y2,lw2,F(TH.laneCol||'#ffffff')); } }
    if(TH.edgeLine){ const lw1=W1*.025,lw2=W2*.025; poly(X1-W1*.93,Y1,lw1,X2-W2*.93,Y2,lw2,F(TH.edgeLine)); poly(X1+W1*.93,Y1,lw1,X2+W2*.93,Y2,lw2,F(TH.edgeLine)); }
    if(i===C.finish||i===C.start){ for(let q=0;q<10;q++){ c.fillStyle=q%2?'#14122b':'#fff'; c.beginPath(); const a=-1+q*.2,b2=a+.2; c.moveTo(X1+W1*a,Y1); c.lineTo(X1+W1*b2,Y1); c.lineTo(X2+W2*b2,Y2); c.lineTo(X2+W2*a,Y2); c.fill(); } }
    maxy=Y1; }
  // 由遠到近畫擺設、障礙物、選手
  const draw1=(s,i,ox,wpx,fn,frac,air)=>{ let X=s._x,Y=s._y,S=s._s; if(frac){ const s2=segs[i+1]; if(s2&&s2._s){ X=lerp(X,s2._x,frac); Y=lerp(Y,s2._y,frac); S=lerp(S,s2._s,frac); } }
    const px=X+S*ox*ROADW,w=wpx*S; if(w<1.2||w>VW*4) return; const yy=Y-(air||0)*S; c.save(); c.beginPath(); c.rect(-VW,0,VW*3,s._clip); c.clip(); fn(px,yy,w); c.restore(); };
  for(let q=vis.length-1;q>=0;q--){ const i=vis[q],s=segs[i];
    const fa=Math.min(.72,Math.pow(s._n/DRAW,1.35)*(TH.mist||1)*.95); c.globalAlpha=1-fa;
    for(const sp of s.spr){ const D=SPR[sp.k]; if(D) draw1(s,i,sp.x,D.ww*(sp.k==='flagarch'?1:1),(px,yy,w)=>D.d(c,px,yy,w,TH,t,sp)); }
    c.globalAlpha=1;
    for(const ob of s.obs){ if(ob.gone&&ob.gone(o.me)) continue; const D=OBS[ob.k]; if(D) draw1(s,i,ob.x,ob.ww,(px,yy,w)=>D.d(c,px,yy,w,TH,t,ob),ob.dz/SEGL); }
    const L=items[i]; if(L) for(const it of L) if(!(s._s*it.ww>VW*.42)) draw1(s,i,it.x,it.ww,(px,yy,w)=>it.d(px,yy,w),it.f,it.air); }
  // 天氣
  if(TH.rain){ c.strokeStyle='rgba(200,220,255,.45)'; c.lineWidth=1; c.beginPath(); for(let i=0;i<90;i++){ const xx=((i*137+t*900)%VW),yy=((i*71+t*1400)%VH); c.moveTo(xx,yy); c.lineTo(xx-4,yy+14); } c.stroke(); }
  if(TH.snowfall){ c.fillStyle='rgba(255,255,255,.85)'; for(let i=0;i<(TH.snowfall>1?140:60);i++){ const xx=((i*137+Math.sin(t+i)*30+t*(TH.snowfall>1?260:40))%VW+VW)%VW,yy=((i*71+t*(90+i%5*20))%VH); c.beginPath(); c.arc(xx,yy,1+(i%3)*.6,0,7); c.fill(); } }
  if(TH.night||TH.dim){ const g=c.createRadialGradient(half,VH*.8,VH*.1,half,VH*.6,VW*.7); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,10,'+(TH.dim||.35)+')'); c.fillStyle=g; c.fillRect(0,0,VW,VH); }
  c.restore(); }

/* ================= 比賽本體（四款共用） ================= */
function makeCreate(G){ return function create(env,opts){
  const si=clamp(opts.stage|0,0,G.stages.length-1),S=G.stages[si],C=buildCourse(G,si),TH=C.TH,P=G.P;
  const net=opts.net,host=!net||net.host,me=net?net.me:0,local2=!net&&opts.mode==='2p',humans=net?net.count:local2?2:1;
  let mode=(opts.options&&opts.options.team)||'ffa'; if(!net&&!local2) mode='ffa'; if(mode==='coop'&&humans>3) mode='vs';
  let NK=net?Math.min(NK0,net.count+(net.bots||0)):NK0;
  if(mode==='coop') NK=humans*2; else if(mode==='pvp') NK=Math.max(2,humans+humans%2); else if(mode==='vs'){ if(NK%2) NK=Math.min(NK0,NK+1); if(NK<2) NK=2; }
  NK=Math.max(NK,humans);
  const TEAMS=mode==='coop'?[{name:'玩家隊',col:'#ffd23f'},{name:'電腦隊',col:'#a8adc0'}]:[{name:'紅隊',col:'#ff4d4d'},{name:'藍隊',col:'#3d8bff'}];
  const teamOf=(()=>{ const out=[],cnt=[0,0]; for(let i=0;i<NK;i++){ let tm=null; if(mode==='coop') tm=i<humans?0:1; else if(mode==='vs'||mode==='pvp') tm=i<humans?i%2:(cnt[0]<=cnt[1]?0:1); if(tm!=null) cnt[tm]++; out.push(tm); } return out; })();
  const {ctx:c,canvas}=env.canvas2d(W,H);
  const lookFor=(i,human)=>{ const L=human?(net?net.looks&&net.looks[i]:i===0?opts.look:null):null; return L&&Object.keys(L).length?L:G.botLook(i); };
  const ks=[];
  for(let i=0;i<NK;i++){ const human=i<humans,row=Math.floor(i/3),col=i%3;
    const k={i,human,local:human&&(!net||i===me),remote:human?(!!net&&i!==me):!host,look:lookFor(i,human),team:teamOf[i],
      x:(col-1)*.55,z:(C.start-3-row*4)*SEGL,v:0,vx:0,airY:0,vy:0,slideT:0,crashT:0,boostT:0,charges:0,gauge:0,fin:null,lean:0,bx:0,got:new Set(),
      ai:human?null:{lane:(col-1)*.55,skill:S.ai+(i-humans)*.018-.03,nt:0,err:0},tz:0,tx:0,flags:0};
    k.name=human?(net?(net.names&&net.names[i])||'玩家'+(i+1):local2?(i+1)+'P':opts.name||'你'):'電腦'+(i-humans+1); k.tz=k.z; k.tx=k.x; ks.push(k); }
  const my=ks[me],locals=ks.filter(k=>k.local);
  let t=0,cd=3.4,intro=2.2,lastBeep=4,ended=false,endT=0,remain=null,lastTick=99,sendT=0,cer=null,toastQ=new Map();
  const toast=(k,s)=>{ if(k.local) toastQ.set(k.i,{s,t:2}); };
  // 引擎聲（機車、快艇）
  let osc=null,og=null; try{ if(G.engine&&env.audio&&env.audio()){ const AC=env.audio(); osc=AC.createOscillator(); og=AC.createGain(); osc.type=G.engine; og.gain.value=.025; osc.connect(og); og.connect(env.out()); osc.start(); } }catch(e){ osc=null; }
  // 障礙物撞擊、道具
  function obstacleHits(k,z0,z1){ const i0=Math.floor(z0/SEGL)-1,i1=Math.floor(z1/SEGL)+1;
    for(let i=Math.max(0,i0);i<=Math.min(C.n-1,i1);i++){ const s=C.segs[i]; for(const ob of s.obs){ const oz=i*SEGL+ob.dz; if(oz<z0-80||oz>z1+80) continue;
        if(Math.abs((k.x-ob.x)*ROADW)>(ob.hw!=null?ob.hw:ob.ww*.5)+P.ww*.45) continue;
        if(ob.gone&&ob.gone(k.i)) continue; if(k.ghost>0&&!ob.good) continue; G.onObs(k,ob,api); } } }
  function crash(k,sec,msg){ if(k.crashT>0) return; k.crashT=sec; k.ghost=sec+.8; /* 撞完有一小段時間可以穿過障礙，不會卡在路障前面一直撞 */ k.v*=.25; k.boostT=0; k.vx=0; if(k.local){ env.sfx('hurt'); if(msg) toast(k,msg); } }
  const api={crash,toast,boost:(k,s)=>{ k.boostT=Math.max(k.boostT,s); if(k.local) env.sfx('boost'); },sfx:n=>env.sfx(n),get t(){ return t; },C,P};
  // 機車的車流：位置只看比賽時間（連線大家一樣）
  const traffic=G.traffic?G.traffic(C,rng(G.id+si+'tr')):[];
  const carZ=(car,tt)=>car.z0+car.v*tt;
  function carUpd(car,tt){ let x=car.x0,blink=0,dest=car.x0; // 換車道前 1 秒先打方向燈，再慢慢切過去
    for(const ch of car.ch){ if(tt<ch.t-1) break; if(tt<ch.t){ blink=Math.sign(ch.to-ch.from); dest=ch.to; x=ch.from; break; }
      if(tt<ch.t+ch.d){ const u=(tt-ch.t)/ch.d; x=ch.from+(ch.to-ch.from)*u*u*(3-2*u); blink=Math.sign(ch.to-ch.from); dest=ch.to; break; } x=ch.to; dest=ch.to; }
    car.x=x; car.blink=blink; car.dest=dest; }
  // 回到路中央：挑前面一段沒有路障、車子的車道
  function safeLane(k){ const zi=Math.floor(k.z/SEGL); let best=0,bs=-1;
    for(const L of [0,-.6,.6]){ let near=99; for(let j=0;j<20;j++){ const s2=C.segs[Math.min(C.n-1,zi+j)]; for(const ob of s2.obs) if(!ob.good&&Math.abs((L-ob.x)*ROADW)<(ob.hw!=null?ob.hw:ob.ww*.5)+P.ww) near=Math.min(near,j); }
      for(const car of traffic){ const dz=(carZ(car,t)-k.z)/SEGL; if(dz>-3&&dz<20&&Math.abs((L-car.x)*ROADW)<car.ww*.5+P.ww) near=Math.min(near,Math.max(0,dz)); }
      if(near>bs){ bs=near; best=L; } }
    return best; }
  function drive(k,inp,dt){
    const s=segAt(C,k.z),sp=k.v/P.max,z0=k.z; if(k.ghost>0) k.ghost-=dt;
    if(k.crashT>0){ k.crashT-=dt; inp={steer:0,gas:false,brake:false}; k.v*=Math.exp(-2*dt); }
    // 轉向與離心力
    const air=k.airY>0;
    if(P.drift){ k.vx+=inp.steer*P.steer*dt*(air?.3:1)*(.35+.65*Math.min(1,sp*1.4)); k.vx-=s.curve*sp*P.cent*dt; k.vx*=Math.exp(-(k.iceT>0?P.grip*.3:P.grip)*dt); k.x+=k.vx*dt; }
    else { const g=(k.iceT>0?.45:1)*(TH.grip||1); k.x+=inp.steer*dt*P.steer*(air?.35:1)*(.3+.7*Math.min(1,sp*1.5))*g; k.x-=dt*sp*s.curve*P.cent*(2-g); }
    k.lean+=((inp.steer||0)*.8-k.lean)*Math.min(1,dt*8); if(k.iceT>0) k.iceT-=dt;
    // 速度
    let max=P.max*(k.boostT>0?P.boostMul:1)*(inp.max||1); const off=Math.abs(k.x)>1; if(off&&!air) max*=P.offMax;
    if(G.down){ const sl=(segY(C,Math.floor(k.z/SEGL)+1,t)-segY(C,Math.floor(k.z/SEGL),t))/SEGL; k.v+=(-sl*P.g+(inp.gas?P.tuck:0)+(k.boostT>0?P.acc:0))*dt; k.v-=(k.v/max)*(k.v/max)*P.drag*P.max*dt; if(inp.brake) k.v-=P.brake*dt; if(off&&!air) k.v-=k.v*1.5*dt; k.v=Math.max(P.minV||0,k.v); }
    else { if(inp.gas&&k.v<max) k.v=Math.min(max,k.v+P.acc*dt*(1-.4*k.v/P.max)); else if(inp.brake) k.v-=P.brake*dt; else k.v-=P.decel*dt; if(k.v>max) k.v-=Math.min(k.v-max,P.acc*1.2*dt); k.v=Math.max(0,k.v); }
    if(k.boostT>0) k.boostT-=dt;
    // 跳躍（跳台、跑步跳起來）
    if(inp.jump&&!air&&k.crashT<=0&&P.jumpV&&k.slideT<=0){ k.vy=P.jumpV; k.airY=1; if(k.local) env.sfx('spring'); }
    if(k.airY>0||k.vy>0){ k.vy-=P.grav*dt; k.airY+=k.vy*dt; if(k.airY<=0){ k.airY=0; k.vy=0; if(k.local) env.sfx('land'); if(G.onLand) G.onLand(k,api); } }
    if(inp.slide&&!air&&P.slide){ k.slideT=.6; } if(k.slideT>0) k.slideT-=dt;
    if(inp.use&&k.charges>0&&k.boostT<=.2&&k.crashT<=0){ k.charges--; k.boostT=1.8; if(k.local){ env.sfx('boost'); toast(k,G.useText||'加速！'); } }
    k.z+=k.v*dt;
    // 邊界（護欄、浮標線、樹林）
    if(Math.abs(k.x)>P.wall){ k.x=Math.sign(k.x)*P.wall; k.vx=0; if(k.v>P.max*.3){ k.v*=.92; if(k.local&&!k.wallHit) env.sfx('bump'); } k.wallHit=true; } else k.wallHit=false;
    if(k.crashT<=0) obstacleHits(k,z0,k.z);
    // 車流
    if(traffic.length&&k.crashT<=0&&!(k.ghost>0)) for(const car of traffic){ const cz=carZ(car,t),dz=cz-k.z; if(dz<-500||dz>500) { if(car.near&&car.near.has(k.i)&&dz<-500){ car.near.delete(k.i); if(G.nearMiss) G.nearMiss(k,api); } continue; }
      const dxw=Math.abs((k.x-car.x)*ROADW); if(dxw<car.ww*.45+P.ww*.4&&Math.abs(dz)<330){ crash(k,1.4,'撞車了！'); k.z=Math.min(k.z,cz-340); if(car.near) car.near.delete(k.i); }
      else if(dxw<car.ww*.5+P.ww*.5+380&&Math.abs(dz)<200){ (car.near=car.near||new Set()).add(k.i); } }
    k.bx-=s.curve*sp*dt*90;
    if(k.fin==null&&k.z>=C.finish*SEGL){ k.fin=t; if(k.local) env.sfx('win'); }
    k.flags=(k.crashT>0?1:0)|(k.boostT>0?2:0)|(k.slideT>0?4:0)|(k.ghost>0?8:0);
  }
  // 電腦：照技術開，看前面障礙物換線，跑步的會跳和滑
  function aiInput(k){ const a=k.ai,s=segAt(C,k.z),inp={steer:0,gas:true,brake:false,jump:false,slide:false,use:false,max:1};
    let lead=-1e9; for(const q of ks) if(q.human&&!q.left) lead=Math.max(lead,q.z); const gap=k.z-lead,band=lead<-1e8?1:gap>2500?.93:gap<-2500?1.06:1;
    inp.max=clamp(a.skill*band,.6,1.08);
    let ahead=0; for(let j=4;j<40;j++){ const c2=C.segs[Math.min(C.n-1,Math.floor(k.z/SEGL)+j)].curve; ahead=Math.max(ahead,Math.abs(c2)); }
    if(!G.down&&k.v>P.max*inp.max*(1-ahead*.025)) inp.gas=false;
    if(G.down){ inp.gas=ahead<S.curve*.6; inp.brake=k.v>P.max*inp.max*(1.02-ahead*.02); }
    // 找前面的障礙物
    const zi=Math.floor(k.z/SEGL); let threat=null;
    for(let j=1;j<26&&!threat;j++){ const s2=C.segs[Math.min(C.n-1,zi+j)]; for(const ob of s2.obs){ if(ob.good||ob.gone&&ob.gone(k.i)) continue; if(Math.abs((a.lane-ob.x)*ROADW)<(ob.hw!=null?ob.hw:ob.ww*.5)+P.ww*.6){ threat={ob,j}; break; } } }
    for(const car of traffic){ const dz=carZ(car,t)-k.z; if(dz<=0||dz>=4000) continue; for(const cx of car.blink?[car.x,car.dest]:[car.x]) if(Math.abs((a.lane-cx)*ROADW)<car.ww*.5+P.ww*.7){ threat={ob:{x:cx,ww:car.ww,hw:car.ww*.5+(car.blink?ROADW*.35:0)},j:dz/SEGL}; break; } if(threat) break; }
    if(threat){ const ob=threat.ob,canJ=P.jumpV&&ob.h!=null,canS=P.slide&&ob.low;
      if(canJ||canS){ if(!a.dec||a.dec.ob!==ob) a.dec={ob,ok:Math.random()<a.skill+.06}; if(threat.j<(P.jumpLead||13)&&a.dec.ok){ if(canJ) inp.jump=true; else inp.slide=true; } }
      else { const opts2=[-.75,-.4,0,.4,.75].sort((p,q)=>Math.abs(p-k.x)-Math.abs(q-k.x)); for(const L of opts2){ if(Math.abs((L-ob.x)*ROADW)>(ob.hw!=null?ob.hw:ob.ww*.5)+P.ww*.8){ a.lane=L; break; } } } }
    // 吃加速道具
    a.nt-=1/60; if(a.nt<=0){ a.nt=2+Math.random()*3; if(!threat&&Math.random()<.35) a.lane=[-.6,-.3,0,.3,.6][(Math.random()*5)|0]; }
    for(let j=2;j<14;j++){ const s2=C.segs[Math.min(C.n-1,zi+j)]; for(const ob of s2.obs) if(ob.good&&!(ob.gone&&ob.gone(k.i))&&Math.random()<.02*a.skill) a.lane=ob.x; }
    const sp=k.v/P.max,ff=s.curve*sp*P.cent; // 抵銷彎道離心力
    inp.steer=P.drift?clamp((a.lane-k.x)*3-k.vx*.8+ff/(P.steer*(.35+.65*Math.min(1,sp*1.4))),-1,1):clamp((a.lane-k.x)*4+ff/(P.steer*(.3+.7*Math.min(1,sp*1.5))),-1,1);
    if(k.charges>0&&ahead<S.curve*.5&&Math.random()<.01) inp.use=true;
    return inp; }
  function humanInput(k){ const K=env.keys,inp={max:1};
    if(local2){ const one=k.i===0; inp.steer=one?(K.KeyD?1:0)-(K.KeyA?1:0):(K.ArrowRight?1:0)-(K.ArrowLeft?1:0);
      inp.gas=one?!!K.KeyW:!!K.ArrowUp; inp.brake=one?!!K.KeyS:!!K.ArrowDown; inp.use=one?env.hit('KeyQ'):env.hit('Enter')||env.hit('NumpadEnter');
      inp.jump=G.run?(one?env.hit('KeyW')||env.hit('ShiftLeft'):env.hit('ArrowUp')||env.hit('ShiftRight')):false; inp.slide=G.run?(one?!!K.KeyS:!!K.ArrowDown):false; }
    else { inp.steer=(K.ArrowRight?1:0)-(K.ArrowLeft?1:0); inp.brake=!!K.ArrowDown; inp.gas=G.down?!!K.ArrowUp:(env.touch?!inp.brake:!!K.ArrowUp);
      inp.use=env.hit('KeyX')||env.hit('ControlLeft')||env.hit('ControlRight'); inp.jump=G.run?(env.hit('Space')||env.hit('ArrowUp')):false; inp.slide=G.run?!!K.ArrowDown:false; }
    if(G.run){ inp.gas=true; inp.brake=false; }
    return inp; }
  function pack(k){ return [k.i,r2(k.x),Math.round(k.z),Math.round(k.v),Math.round(k.airY),k.flags,k.fin,r2(k.lean)]; }
  function applyRemote(a){ const k=ks[a[0]]; if(!k||!k.remote) return; k.tx=a[1]; k.tz=a[2]; k.v=a[3]; k.airY=a[4]; k.flags=a[5]; k.fin=a[6]; k.lean=a[7]; }
  if(net){ net.onmsg=m=>{ if(m.k) applyRemote(m.k); if(m.ks) for(const a of m.ks) if(a[0]!==me) applyRemote(a); if(m.gone!=null&&ks[m.gone]) ks[m.gone].left=true; };
    net.onleave=i=>{ if(ks[i]) ks[i].left=true; net.send({gone:i}); }; }
  const rankOf=k=>{ let r=1; for(const q of ks){ if(q===k||q.left) continue; if(k.fin!=null){ if(q.fin!=null&&q.fin<k.fin) r++; } else if(q.fin!=null||q.z>k.z) r++; } return r; };
  function results(){ const order=ks.filter(k=>!k.left).sort((a,b)=>(a.fin!=null?a.fin:1e9)-(b.fin!=null?b.fin:1e9)||b.z-a.z); return order; }
  function startCeremony(){ cer={t:0,order:results()}; env.sfx('win'); }
  function finish(){ const order=cer.order,myRank=order.indexOf(my)+1; let title,html,text='',score=null;
    const rows=order.map((k,i)=>'<tr><td>'+(i+1)+'</td><td>'+(k.team!=null?'<span style="color:'+TEAMS[k.team].col+'">●</span> ':'')+k.name+'</td><td>'+(k.fin!=null?fmtTime(k.fin):'未完成')+'</td></tr>').join('');
    html='<table class="ls"><tr><th>名次</th><th>選手</th><th>時間</th></tr>'+rows+'</table>';
    if(mode!=='ffa'){ const pts=[0,0]; order.forEach((k,i)=>{ if(k.team!=null&&k.fin!=null) pts[k.team]+=POINTS[i]||1; }); const w=pts[0]===pts[1]?-1:pts[0]>pts[1]?0:1;
      title=w<0?'平手！':(my.team===w?'你的隊伍贏了！':TEAMS[w].name+'獲勝'); text=TEAMS[0].name+' '+pts[0]+' 分 vs '+TEAMS[1].name+' '+pts[1]+' 分（照名次 10/8/6/5/4/3，只算衝過終點的人）'; }
    else title=local2?order[0].name+' 第一名！':myRank===1?'第一名！':'第 '+myRank+' 名';
    if(!net&&my.fin!=null&&!local2){ score=Math.round(my.fin*100)/100; const key='arcade.'+G.id+'.t.'+S.name; try{ const old=parseFloat(localStorage.getItem(key)); if(!isFinite(old)||score<old){ localStorage.setItem(key,String(score)); text+=(text?'　':'')+'新紀錄！'+fmtTime(score); } localStorage.setItem('arcade.'+G.id+'.last',S.name); }catch(e){} }
    env.end({title,big:S.name,html,text,score,next:!net&&myRank<=3&&si<G.stages.length-1}); }
  function update(dt){
    if(cer){ cer.t+=dt; if(cer.t>4.2&&!cer.done){ cer.done=true; finish(); } return; }
    if(intro>0){ intro-=dt; if(!net&&(env.hit('Space')||env.hit('Enter'))) intro=0; return; }
    if(cd>0){ cd-=dt; const n=Math.ceil(cd); if(n<lastBeep&&n>=1&&n<=3){ lastBeep=n; env.sfx('beep'); } if(cd<=0) env.sfx('go'); return; }
    t+=dt; for(const car of traffic) carUpd(car,t);
    for(const k of ks){ if(k.left) continue;
      if(k.remote){ k.tz+=k.v*dt; const f=Math.min(1,dt*10); k.z+=(k.tz-k.z)*f; k.x+=(k.tx-k.x)*f; continue; }
      if(k.auto&&!k.ai) k.ai={lane:0,skill:.97,nt:0}; let inp=k.ai?aiInput(k):humanInput(k);
      if(k.local&&!k.ai&&k.fin==null&&(local2?env.hit(k.i===0?'KeyR':'Backspace'):env.hit('KeyR')||env.hit('Backspace'))){ k.x=safeLane(k); k.vx=0; k.crashT=0; k.ghost=1.5; k.airY=0; k.vy=0; k.v=Math.max(k.v,P.max*.25); toast(k,'回到路中央！'); env.sfx('item'); }
      if(k.fin!=null){ inp={steer:0,gas:false,brake:!G.down,max:1}; if(G.down) k.v*=Math.exp(-1.5*dt); }
      drive(k,inp,dt); }
    for(let a=0;a<NK;a++) for(let b=a+1;b<NK;b++){ const A=ks[a],B=ks[b]; if(A.left||B.left||A.remote&&B.remote) continue; const dz=B.z-A.z,dxw=(B.x-A.x)*ROADW; if(Math.abs(dz)<220&&Math.abs(dxw)<P.ww*.9){ const push=(P.ww*.9-Math.abs(dxw))/ROADW*.5*Math.sign(dxw||1); if(!A.remote) A.x-=push; if(!B.remote) B.x+=push; } }
    if(osc){ osc.frequency.value=55+(my.v/P.max)*130+(my.boostT>0?40:0); og.gain.value=cer||my.fin!=null?0:.025; }
    let first=null; for(const k of ks) if(!k.left&&k.fin!=null&&(first==null||k.fin<first)) first=k.fin;
    if(first!=null&&!ended){ remain=Math.max(0,15-(t-first)); const c2=Math.ceil(remain); if(c2<lastTick&&c2>=1&&c2<=5) env.sfx('beep'); lastTick=c2;
      if(ks.every(k=>k.left||!k.human||k.fin!=null)) endT+=dt; if(remain<=0||endT>3){ ended=true; startCeremony(); } }
    if(net){ sendT-=dt; if(sendT<=0){ sendT=1/15; if(net.host) net.send({ks:ks.filter(k=>!k.left).map(pack)}); else net.send({k:pack(my)}); } }
    for(const [i,q] of toastQ){ q.t-=dt; if(q.t<=0) toastQ.delete(i); }
  }
  // 每段要畫的動態物件：選手、車流
  function itemsFor(view){ const items={},add=(z,it)=>{ const i=Math.floor(z/SEGL); it.f=(z-i*SEGL)/SEGL; (items[i]=items[i]||[]).push(it); };
    for(const k of ks){ if(k.left) continue; const mine=k===view; add(k.z,{x:k.x,ww:P.ww,air:k.airY,d:(px,py,w)=>{ const gh=(k.flags&8)&&Math.floor(t*10)%2; if(gh) c.globalAlpha=.45; G.drawBack(c,px,py,w,{look:k.look,lean:k.lean,crash:k.flags&1,boost:k.flags&2,slide:k.flags&4,night:TH.night,spd:k.v/P.max,num:k.i+1,air:0,col:COLORS[k.i%6]},t+k.i); c.globalAlpha=1;
      if(!mine||t<3){ c.font='900 '+Math.max(9,Math.min(16,w*.13))+'px '+TC; c.textAlign='center'; c.textBaseline='bottom'; const tc=k.team!=null?TEAMS[k.team].col:'#fff'; c.lineWidth=3; c.strokeStyle='#0b0a1c'; const nm=mine?(local2?(k.i+1)+'P':'你'):k.name;
        if(w>18){ c.strokeText(nm,px,py-w*G.tagH); c.fillStyle=mine?'#ffd23f':tc; c.fillText(nm,px,py-w*G.tagH); } } }}); }
    for(const car of traffic){ const z=carZ(car,t); if(z<0||z>C.n*SEGL) continue; add(z,{x:car.x,ww:car.ww,d:(px,py,w)=>OBS.car.d(c,px,py,w,TH,t,car)}); }
    return items; }
  function hud(vp,k){ const s=vp.w/W*(local2?1.6:1),x0=vp.x,y0=vp.y,R=rankOf(k),act=ks.filter(q=>!q.left).length;
    c.save(); c.textBaseline='middle';
    c.fillStyle='rgba(11,10,28,.6)'; rr(c,x0+10,y0+10,120*s,54*s,10*s); c.fill(); c.fillStyle='#ffd23f'; c.font='900 '+Math.round(22*s)+'px '+PIX; c.textAlign='left'; c.fillText(R+'/'+act,x0+20,y0+30*s); c.fillStyle='#fff'; c.font='700 '+Math.round(11*s)+'px '+TC; c.fillText('名次',x0+20,y0+50*s);
    c.textAlign='right'; c.font='900 '+Math.round(16*s)+'px '+PIX; c.fillStyle='#fff'; c.fillText(fmtTime(k.fin!=null?k.fin:t),x0+vp.w-14,y0+24*s);
    // 進度條
    const bx=x0+vp.w-18*s,by=y0+44*s,bh=vp.h-120*s; c.fillStyle='rgba(11,10,28,.55)'; rr(c,bx-5*s,by,10*s,bh,5*s); c.fill();
    for(const q of ks){ if(q.left) continue; const u=clamp((q.z-C.start*SEGL)/((C.finish-C.start)*SEGL),0,1); c.fillStyle=q===k?'#ffd23f':q.team!=null?TEAMS[q.team].col:'#c9c6e6'; c.beginPath(); c.arc(bx,by+bh*(1-u),(q===k?6:4)*s,0,7); c.fill(); }
    c.fillStyle='#fff'; c.font='700 '+Math.round(10*s)+'px '+TC; c.textAlign='center'; c.fillText('終點',bx,by-8*s);
    // 速度、加速道具
    c.fillStyle='rgba(11,10,28,.6)'; rr(c,x0+vp.w/2-90*s,y0+vp.h-38*s,180*s,30*s,10*s); c.fill(); c.fillStyle='#fff'; c.font='900 '+Math.round(15*s)+'px '+PIX; c.textAlign='left'; c.fillText(String(Math.round(k.v/P.max*G.kmh)).padStart(3,'0'),x0+vp.w/2-80*s,y0+vp.h-23*s);
    c.font='700 '+Math.round(10*s)+'px '+TC; c.fillText(G.speedUnit||'KM/H',x0+vp.w/2-38*s,y0+vp.h-22*s);
    for(let j=0;j<3;j++){ c.fillStyle=j<k.charges?G.chargeCol||'#3ddbd9':'rgba(255,255,255,.18)'; c.beginPath(); c.arc(x0+vp.w/2+30*s+j*18*s,y0+vp.h-23*s,6*s,0,7); c.fill(); }
    if(G.gaugeOf){ const g=G.gaugeOf(k); c.fillStyle='rgba(255,255,255,.18)'; c.fillRect(x0+vp.w/2-80*s,y0+vp.h-12*s,160*s,3*s); c.fillStyle=G.chargeCol||'#3ddbd9'; c.fillRect(x0+vp.w/2-80*s,y0+vp.h-12*s,160*s*g,3*s); }
    const tq=toastQ.get(k.i); if(tq){ c.font='900 '+Math.round(16*s)+'px '+TC; c.textAlign='center'; const w=c.measureText(tq.s).width+28; c.fillStyle='rgba(11,10,28,.75)'; rr(c,x0+vp.w/2-w/2,y0+76*s,w,30*s,12); c.fill(); c.fillStyle='#ffd23f'; c.fillText(tq.s,x0+vp.w/2,y0+92*s); }
    if(k.fin!=null){ c.font='900 '+Math.round(30*s)+'px '+PIX; c.textAlign='center'; c.lineWidth=6; c.strokeStyle='#0b0a1c'; c.strokeText('FINISH',x0+vp.w/2,y0+vp.h*.36); c.fillStyle='#ffd23f'; c.fillText('FINISH',x0+vp.w/2,y0+vp.h*.36); c.font='900 '+Math.round(18*s)+'px '+TC; c.strokeText('第 '+R+' 名',x0+vp.w/2,y0+vp.h*.36+34*s); c.fillStyle='#fff'; c.fillText('第 '+R+' 名',x0+vp.w/2,y0+vp.h*.36+34*s); }
    if(remain!=null&&k.fin==null){ c.font='900 '+Math.round(20*s)+'px '+TC; c.textAlign='center'; c.fillStyle='#ff8a8a'; c.fillText('剩 '+Math.ceil(remain)+' 秒',x0+vp.w/2,y0+30*s); }
    if(cd>0&&intro<=0){ const n=Math.ceil(cd); c.font='900 '+Math.round(80*s)+'px '+PIX; c.textAlign='center'; c.lineWidth=10; c.strokeStyle='#0b0a1c'; const tx=n>3?'':String(n); if(tx){ c.strokeText(tx,x0+vp.w/2,y0+vp.h*.4); c.fillStyle='#ffd23f'; c.fillText(tx,x0+vp.w/2,y0+vp.h*.4); } }
    else if(t<.8&&intro<=0){ c.font='900 '+Math.round(64*s)+'px '+PIX; c.textAlign='center'; c.lineWidth=10; c.strokeStyle='#0b0a1c'; c.strokeText('GO!',x0+vp.w/2,y0+vp.h*.4); c.fillStyle='#5fd068'; c.fillText('GO!',x0+vp.w/2,y0+vp.h*.4); }
    if(intro>0||cd>0){ // 開場：大箭頭標出自己
      const ay=y0+vp.h*.52+Math.sin(performance.now()/150)*6,ax=x0+vp.w/2+k.x*0; c.fillStyle='#ffd23f'; c.strokeStyle='#0b0a1c'; c.lineWidth=4; c.beginPath(); c.moveTo(ax-22*s,ay-30*s); c.lineTo(ax+22*s,ay-30*s); c.lineTo(ax,ay); c.closePath(); c.stroke(); c.fill();
      c.font='900 '+Math.round(22*s)+'px '+TC; c.textAlign='center'; c.lineWidth=5; const nm=local2?(k.i+1)+'P':'你'; c.strokeText(nm,ax,ay-44*s); c.fillText(nm,ax,ay-44*s);
      if(intro>0){ c.font='900 '+Math.round(20*s)+'px '+TC; c.fillStyle='#fff'; c.strokeText(S.name,x0+vp.w/2,y0+vp.h*.18); c.fillText(S.name,x0+vp.w/2,y0+vp.h*.18);
        if(mode!=='ffa'){ c.font='700 '+Math.round(13*s)+'px '+TC; ks.forEach((q,j)=>{ c.fillStyle=TEAMS[q.team].col; c.fillText(TEAMS[q.team].name+'：'+q.name,x0+vp.w/2,y0+vp.h*.25+j*18*s); }); } } }
    c.restore(); }
  function drawCeremony(){ const u=cer.t; c.fillStyle='#14122b'; c.fillRect(0,0,W,H); drawBack(c,W,H,TH,0,0,u); c.fillStyle=TH.ground[0]; c.fillRect(0,H*.62,W,H*.38);
    const order=cer.order,spots=[[1,W/2,H*.62-120,'#ffd23f'],[0,W/2-170,H*.62-80,'#c8ccd6'],[2,W/2+170,H*.62-55,'#e0905a']];
    for(const [rk,x,yTop,col] of spots){ const k=order[rk]; c.fillStyle=col; c.fillRect(x-75,yTop,150,H*.62-yTop+40); c.fillStyle='#14122b'; c.font='900 34px '+PIX; c.textAlign='center'; c.textBaseline='middle'; c.fillText(String(rk+1),x,yTop+40);
      if(k){ const hop=Math.abs(Math.sin(u*5+rk))*(rk===0?14:6); G.drawFront(c,x,yTop-hop,rk===0?110:90,k.look,u+rk); c.fillStyle='#fff'; c.font='900 16px '+TC; c.fillText(k.name,x,yTop+82); } }
    for(let i=0;i<60;i++){ const x=(i*97+u*40*(i%3+1))%W,y=((i*53+u*120*(1+i%4))%H); c.fillStyle=COLORS[i%6]; c.fillRect(x,y,6,9); }
    c.fillStyle='#ffd23f'; c.font='900 30px '+TC; c.textAlign='center'; c.lineWidth=6; c.strokeStyle='#0b0a1c'; const tx=order[0]?order[0].name+' 第一名！':''; c.strokeText(tx,W/2,48); c.fillText(tx,W/2,48); }
  function draw(){ if(cer){ drawCeremony(); return; }
    const views=local2?[[ks[0],{x:0,y:0,w:W/2-1,h:H}],[ks[1],{x:W/2+1,y:0,w:W/2-1,h:H}]]:[[my,{x:0,y:0,w:W,h:H}]];
    c.fillStyle='#000'; c.fillRect(0,0,W,H);
    for(const [k,vp] of views){ const camK=intro>0?{x:k.x,z:k.z-(intro/2.2)*SEGL*14,airY:0,bx:k.bx}:k; renderView(c,vp,C,camK,itemsFor(k),t+(intro>0?3-intro:0),{me:k.i}); hud(vp,k); } }
  return {update,draw,destroy(){ try{ if(osc){ osc.stop(); osc.disconnect(); } }catch(e){} },_dbg:{ks,C,get t(){ return t; },skip(){ intro=0; cd=0; },auto(k){ k.auto=true; }}};
}; }

/* ================= 四款遊戲的設定 ================= */
const mkStages=(names,base)=>names.map((n,i)=>Object.assign({name:n[0],stars:Math.floor(i/3)+1,th:n[1]},base(Math.floor(i/3)+1,i),n[2]||{}));
// ---- 1. 飆風機車王 ----
const MOTO_TH={
  city:{sky:['#5aa6e0','#d8ecf8'],far:'city',ground:['#aaa49c','#a39d95'],road:['#56565c','#535359'],rumble:['#d6d6d6','#c8c8c8'],edgeLine:'#ecece4',tracks:1,lanes:3,spr:[['building',8],['tree',2],['billboard',1]],edge:['lamp',8,1.22],dens:.7,near:1.95,spread:.5,fog:'#c8dcf0'},
  coast:{sky:['#4aa8e8','#d4eefa'],far:'sea',farCol:'#2f80c0',isle:1,ground:['#e2cf98','#dac68c'],road:['#58585e','#55555b'],rumble:['#d8d8d4','#cacac6'],edgeLine:'#ecece4',tracks:1,lanes:2,spr:[['palm',5],['rock',2],['house',1],['lighthouse',.3]],edge:['post',3,1.18],dens:.45,near:1.4,spread:2,fog:'#cfeaf8'},
  town:{sky:['#62b0e8','#dcf0fa'],far:'hills',farCol:'#5f8f52',farCol2:'#8fb486',ground:['#68a046','#629842'],road:['#58585e','#55555b'],rumble:['#d0d0cc','#c4c4c0'],edgeLine:'#ecece4',tracks:1,lanes:2,spr:[['house',4],['tree',4],['bush',2]],edge:['lamp',10,1.2],dens:.55,near:1.4,spread:1.8,fog:'#d8ecf4'},
  port:{sky:['#7aaed4','#e0ecf4'],far:'sea',farCol:'#3a7aa8',ground:['#8a8e94','#84888e'],road:['#4c4e54','#4a4c52'],tracks:1,rumble:['#ffd23f','#222228'],lanes:2,spr:[['container',5],['crane',2]],edge:['lamp',9,1.2],dens:.5,near:1.4,spread:1.8,fog:'#d0dce8'},
  mountain:{sky:['#5aa4d8','#d8eef8'],far:'mountain',farCol:'#4f7080',farCol2:'#86a4b4',ground:['#4b8738','#468036'],road:['#58585e','#55555b'],rumble:['#c4c8cc','#b8bcc0'],edgeLine:'#ecece4',tracks:1,lanes:2,spr:[['pine',5],['rock',2],['cliff',1]],edge:['post',4,1.15],dens:.55,near:1.35,spread:2.2,fog:'#d0e4ec'},
  bridge:{sky:['#4aa4e0','#d8f0ff'],far:'sea',farCol:'#2f78b8',ground:['#2f6fa8','#2d6ca4'],road:['#58585e','#55555b'],edgeLine:'#ecece4',tracks:1,rumble:['#c8ccd4','#8a8e98'],lanes:3,spr:[['boat',1]],edge:['tower',40,1.3],dens:.04,near:3,spread:3,fog:'#cfe6f6',nosign:1},
  neon:{sky:['#120c28','#3a1f5a'],far:'city',farCol:'#241a40',farCol2:'#33275a',ground:['#2a2638','#27233a'],road:['#2f2c3a','#2d2a38'],tracks:1,rumble:['#ff3bd4','#3ddbd9'],lanes:3,spr:[['neon',6],['building',2]],edge:['lamp',6,1.22],dens:.7,near:1.45,spread:1.4,fog:'#2a1f45',night:1}};
function motoTheme(S){ const T=Object.assign({},MOTO_TH[S.th]); const m=S.mod||'';
  if(m.includes('night')&&!T.night){ T.night=1; T.sky=['#0a1030','#2a3060']; T.fog='#1a2040'; T.ground=T.ground.map(x=>shade(x,.4)); T.road=T.road.map(x=>shade(x,.55)); T.farCol=shade(T.farCol||'#4a5a70',.45); T.farCol2=shade(T.farCol2||'#6a7a90',.45); }
  if(m.includes('sunset')){ T.sky=['#ff8a5a','#ffd8a0']; T.fog='#f4c8a0'; T.sun='rgba(255,200,120,.8)'; }
  if(m.includes('rain')){ T.rain=1; T.grip=.78; T.mist=1.6; if(!T.night){ T.sky=['#6a7280','#a8b0bc']; T.fog='#9aa2ae'; } }
  if(m.includes('fog')){ T.mist=2.4; T.fog='#dfe6ea'; }
  return T; }
const MOTO={id:'moto',name:'飆風機車王',camH:950,kmh:180,engine:'sawtooth',tagH:1.65,useText:'氮氣加速！',chargeCol:'#3ddbd9',
  P:{max:12500,acc:5200,brake:12000,decel:2600,offMax:.5,steer:2.4,cent:.3,wall:1.55,boostMul:1.4,ww:320},
  stages:mkStages([['晨光市區','city'],['海岸公路','coast'],['河濱大道','town'],['港口倉庫','port'],['山腳小鎮','town',{mod:'sunset'}],['黃昏海岸','coast',{mod:'sunset'}],
    ['雨夜市區','city',{mod:'night rain'}],['蜿蜒山路','mountain'],['跨海大橋','bridge'],['霓虹夜街','neon'],['高山雲霧','mountain',{mod:'fog'}],['暴雨高速','city',{mod:'rain'}],['不夜城','neon',{mod:'rain'}],['天險峭壁','mountain',{mod:'sunset'}],['颱風夜','coast',{mod:'night rain'}]],
    (st,i)=>({len:2600+st*450,curve:1.6+st*.9,hill:1200+st*700,ai:.66+st*.06,traffic:5+st*3,works:st>=2})),
  theme:motoTheme,
  traffic(C,r){ const out=[],S=C.S,n=Math.round(S.traffic*C.n/1000),cols=['#e8e8e8','#2f6fd0','#c0392b','#3a3a48','#ffd23f','#2e9e4f'];
    const lc=([0,0,.25,.4,.55,.7][S.stars]||0)+(/rain|night/.test(S.mod||'')&&S.stars>1?.15:0),gap=16-S.stars*2; // 換車道：2 星開始有，星數越高越多、越頻繁
    for(let j=0;j<n;j++){ const big=r()<.18,taxi=!big&&r()<.15,x0=[-.66,0,.66][(r()*3)|0],car={z0:(C.start+40+r()*(C.finish-C.start-40))*SEGL,v:2400+r()*3600,x0,x:x0,ww:big?950:780,big,taxi,col:taxi?'#ffd23f':cols[(r()*cols.length)|0],ch:[]};
      if(r()<lc){ let tt=2+r()*8,lane=x0; while(tt<240){ const opts=[lane-.66,lane+.66].filter(v=>v>-.7&&v<.7),to=opts[(r()*opts.length)|0]; car.ch.push({t:tt,from:lane,to,d:big?1.6:taxi?.8:1.1}); lane=to; tt+=gap*(.5+r()); } }
      out.push(car); } return out; },
  place(C,r){ const S=C.S; for(let i=C.start+60;i<C.finish-30;i++){ const s=C.segs[i];
      if(S.works&&r()<.0035){ const lane=[-.66,0,.66][(r()*3)|0]; for(let q=0;q<6;q++){ const s2=C.segs[i+q*2]; if(s2) s2.obs.push({k:'cone',x:lane+(q%2?.12:-.12),dz:80,ww:170}); } s.obs.push({k:'barrier',x:lane,dz:40,ww:560}); i+=16; continue; }
      if(r()<.004){ const id='c'+i; s.obs.push({k:'can',x:(r()*1.4-.7),dz:100,ww:220,good:1,id,taken:new Set(),gone(p){ return this.taken.has(p); }}); } } },
  onObs(k,ob,A){ if(ob.k==='can'){ ob.taken.add(k.i); if(k.charges<3) k.charges++; A.toast(k,'拿到氮氣瓶'); if(k.local) A.sfx('item'); return; } A.crash(k,1.2,'撞到路障了！'); },
  nearMiss(k,A){ k.gauge=(k.gauge||0)+.34; if(k.gauge>=1){ k.gauge=0; if(k.charges<3) k.charges++; A.toast(k,'驚險超車！氮氣 +1'); if(k.local) A.sfx('item'); } else if(k.local) A.toast(k,'驚險超車！'); },
  gaugeOf:k=>k.gauge||0,
  drawBack:motoBack,drawFront:motoFront,drawSide:motoSide,
  botLook:i=>({body:['sport','scooter','dirt'][i%3],bike:COLORS[(i+1)%6],helmet:['full','half','mx'][i%3],helm:['#ffd23f','#ffffff','#3ddbd9','#ff7eb6','#5fd068','#ff9d3d'][i%6],suit:['#2f3a5a','#5a2f3a','#2f5a3a','#3a2f5a','#5a4a2f','#2f4a5a'][i%6],deco:['num','flame,box','glow','stripe,flag','num,catears','side'][i%6],nitro:['blue','fire','green','rainbow'][i%4],num:String(i+2)}),
  looks:[{key:'body',label:'車款',opts:[{id:'scooter',label:'一般輕型機車'},{id:'sport',label:'重型機車'},{id:'dirt',label:'越野機車'}]},
    {key:'bike',label:'車身顏色',type:'color',opts:['#ff4d4d','#ff9d3d','#ffd23f','#5fd068','#3ddbd9','#3d8bff','#c56bff','#f4f4f4','#1e1e24']},
    {key:'helmet',label:'安全帽',opts:[{id:'full',label:'全罩式'},{id:'half',label:'半罩式'},{id:'mx',label:'越野帽'}]},
    {key:'helm',label:'安全帽顏色',type:'color',opts:['#ffd23f','#ffffff','#ff4d4d','#3ddbd9','#ff7eb6','#5fd068','#1e1e24']},
    {key:'suit',label:'騎士服',type:'color',opts:['#2f3a5a','#5a2f3a','#2f5a3a','#e8e8e8','#ff9d3d','#3d8bff','#1e1e24']},
    {key:'deco',label:'配件',type:'multi',hint:'每一類選一個，再按一次取下',opts:[{id:'box',label:'後箱',grp:'車上'},{id:'side',label:'側箱',grp:'車上'},{id:'flag',label:'旗子',grp:'車上'},{id:'flame',label:'火焰彩繪',grp:'車身'},{id:'num',label:'賽車號碼',grp:'車身'},{id:'stripe',label:'安全帽條紋',grp:'車身'},{id:'glow',label:'霓虹底燈',grp:'燈光'},{id:'catears',label:'貓耳',grp:'帽飾'},{id:'horns',label:'惡魔角',grp:'帽飾'},{id:'mohawk',label:'莫西幹',grp:'帽飾'},{id:'duck',label:'小鴨',grp:'帽飾'}]},
    {key:'nitro',label:'加速特效',opts:[{id:'blue',label:'藍焰'},{id:'fire',label:'火焰'},{id:'green',label:'綠焰'},{id:'rainbow',label:'彩虹'}]}],
  desc:'騎一般輕型機車、重型機車或越野機車，在市區、海岸、山路、霓虹夜街和雨天高速公路飆車（造型可選車款和後箱、側箱、彩繪、霓虹底燈等配件）。閃過車流、驚險超車集滿氮氣，撿氮氣瓶加速；雨天路滑、霧天看不遠。共 15 關，單人、雙人分割畫面或開房間連線。',
  goal:'從起點騎到終點，前 3 名過關。路上有一般車輛，撞到會摔車；2 星以上的關卡有車會換車道（先閃方向燈再切過來，星數越高越多）；從車旁邊驚險超車三次可以集到一瓶氮氣，路上也撿得到氮氣瓶（最多存 3 瓶）。',
  help:[['↑ ↓','油門、煞車'],['← →','轉向'],['X','用氮氣加速'],['W A S D Q','雙人 1P（左半畫面），Q 用氮氣'],['↑ ↓ ← → Enter','雙人 2P（右半畫面），Enter 用氮氣']],
  touchHelp:[['◀ ▶','轉向，自動催油門'],['煞','煞車'],['氮氣','用氮氣加速']],
  touch:{left:[{l:'◀',c:'ArrowLeft',big:true},{l:'▶',c:'ArrowRight',big:true}],right:[{l:'煞',c:'ArrowDown'},{l:'氮氣',c:'KeyX',act:true}]}};
// ---- 2. 雪山大滑降 ----
const SLED_BASE={sky:['#7ac4f4','#e8f6ff'],far:'snowmtn',farCol:'#a8c8e0',farCol2:'#d0e4f2',ground:['#f6f9ff','#eaf1fa'],road:['#e2edf8','#d8e6f4'],rumble:null,edgeLine:'#9cc0e4',spr:[['pine',6],['rock',1],['snowman',.4]],edge:['pole',5,1.18],dens:.5,near:1.4,spread:2.2,fog:'#e8f2fa',snowy:1,pine:'#2f6a4a',rock:'#8a8a92',nosign:1};
function sledTheme(S){ const T=Object.assign({},SLED_BASE,S.tx||{}); const m=S.mod||'';
  if(m.includes('night')){ T.night=1; T.sky=['#081028','#24305a']; T.fog='#2a3658'; T.ground=['#b8c4dc','#aebad4']; T.road=['#a8b8d4','#9eaecc']; T.farCol='#4a5a7a'; T.farCol2='#6a7a9a'; T.spr=T.spr.concat([['lantern',2]]); }
  if(m.includes('sunset')){ T.sky=['#ff9a6a','#ffe0b8']; T.fog='#fbe0cc'; T.sun='rgba(255,200,140,.8)'; }
  if(m.includes('storm')){ T.snowfall=2; T.mist=2.6; T.fog='#e4ecf4'; T.sky=['#a8b4c4','#d8e0ea']; } else if(!m.includes('clear')) T.snowfall=1;
  if(m.includes('aurora')){ T.aurora=1; }
  return T; }
const SLED={id:'sled',name:'雪山大滑降',camH:1150,kmh:110,down:1,tagH:1.35,useText:'衝刺！',chargeCol:'#ff7a1a',
  P:{max:12000,g:52000,tuck:1600,acc:3000,drag:.5,brake:7000,offMax:.6,steer:2.1,cent:.26,wall:1.42,boostMul:1.3,ww:380,minV:600,jumpV:0,grav:3400},
  stages:mkStages([['初學者雪坡','',{mod:'clear'}],['松林小徑','',{tx:{spr:[['pine',9],['rock',1]],dens:.75}}],['雪人樂園','',{tx:{spr:[['snowman',4],['pine',4],['cabin',1]]}}],
    ['木屋村莊','',{tx:{spr:[['cabin',4],['pine',4],['snowman',1]]}}],['冰湖滑道','',{ice:1,tx:{road:['#cfe6f8','#c2dcf2']}}],['黃昏雪嶺','',{mod:'sunset'}],
    ['森林迴旋','',{tx:{spr:[['pine',9]],dens:.8}}],['冰河峽谷','',{tx:{spr:[['cliff',3],['rock',3],['pine',2]]},ice:1}],['夜燈滑道','',{mod:'night'}],
    ['暴風雪坡','',{mod:'storm'}],['懸崖跳台','',{ramps:2,tx:{spr:[['cliff',4],['pine',3]]}}],['極光雪原','',{mod:'night aurora'}],
    ['冰峰極速','',{ice:1,tx:{spr:[['cliff',3],['rock',3]]}}],['黑鑽險道','',{mod:'night',tx:{spr:[['pine',8],['rock',2]],dens:.8}}],['天梯大滑降','',{mod:'storm',ramps:2}]],
    (st,i)=>({len:2400+st*400,curve:1.4+st*.8,hill:600+st*300,slope:.05+st*.012,ai:.68+st*.055,trees:.004+st*.003,gates:1,ramps:1})),
  theme:sledTheme,
  place(C,r){ const S=C.S; let gc=0;
    for(let i=C.start+40;i<C.finish-20;i++){ const s=C.segs[i];
      if(i%38===0){ const gx=(r()*1.1-.55),col=gc++%2?'#3d8bff':'#ff4d4d',id='g'+i; s.obs.push({k:'gate',x:gx,dz:100,ww:1100,hw:550,col,good:1,id,taken:new Set(),gone(p){ return this.taken.has(p); }}); continue; }
      if(r()<S.trees) s.obs.push({k:r()<.7?'tree':'rock',x:(r()*1.7-.85),dz:r()*SEGL,ww:r()<.7?560:520,hw:150,h:null});
      if(S.ice&&r()<.004) s.obs.push({k:'ice',x:(r()*1.2-.6),dz:60,ww:1300,hw:650,good:1,ice:1});
      if(r()<.0012*S.ramps&&i>C.start+80) s.obs.push({k:'ramp',x:0,dz:80,ww:1800,hw:900,good:1,ramp:1}); } },
  onObs(k,ob,A){ if(ob.k==='gate'){ ob.taken.add(k.i); if(k.charges<3) k.charges++; A.toast(k,'通過旗門！衝刺 +1'); if(k.local) A.sfx('item'); return; }
    if(ob.ice){ k.iceT=1.5; A.toast(k,'冰面好滑！'); return; }
    if(ob.ramp){ if(k.airY<=0){ k.vy=900+k.v*.12; k.airY=1; A.toast(k,'飛躍！'); if(k.local) A.sfx('spring'); } return; }
    if(k.airY>200) return; A.crash(k,1.1,ob.k==='tree'?'撞到樹了！':'撞到石頭了！'); },
  drawBack:sledBack,drawFront:sledFront,
  botLook:i=>({sled:['#c8803a','#e23b3b','#3d8bff','#5fd068','#c56bff','#ffd23f'][i%6],coat:COLORS[(i+2)%6],scarf:COLORS[(i+4)%6],hat:COLORS[(i+1)%6]}),
  looks:[{key:'sled',label:'雪橇顏色',type:'color',opts:['#c8803a','#e23b3b','#3d8bff','#5fd068','#c56bff','#ffd23f']},{key:'coat',label:'外套',type:'color',opts:['#3d8bff','#ff4d4d','#5fd068','#ff9d3d','#c56bff','#2f3a5a']},
    {key:'scarf',label:'圍巾',type:'color',opts:['#ff4d4d','#ffd23f','#3ddbd9','#ff7eb6','#ffffff']},{key:'hat',label:'毛帽',type:'color',opts:['#ffd23f','#ff4d4d','#3d8bff','#5fd068','#ff7eb6','#ffffff']}],
  desc:'坐雪橇從雪山一路往下衝！下坡越陡越快，穿過紅藍旗門存衝刺，閃開樹和石頭，冰面會打滑，跳台能飛起來。夜燈、暴風雪、極光等 15 條雪道，單人、雙人或連線。',
  goal:'從山頂滑到山腳，前 3 名過關。下坡會自己加速，按 ↑ 壓低身體更快，↓ 煞車。穿過旗門可以存一次衝刺（最多 3 次），按 X 使用。撞到樹或石頭會翻滾減速。',
  help:[['← →','左右轉'],['↑','壓低身體加速'],['↓','煞車'],['X','衝刺（穿過旗門存的）'],['W A S D Q','雙人 1P（左半畫面）'],['↑ ↓ ← → Enter','雙人 2P（右半畫面）']],
  touchHelp:[['◀ ▶','左右轉'],['壓低','壓低身體加速'],['煞','煞車'],['衝刺','用衝刺']],
  touch:{left:[{l:'◀',c:'ArrowLeft',big:true},{l:'▶',c:'ArrowRight',big:true}],right:[{l:'壓低',c:'ArrowUp'},{l:'煞',c:'ArrowDown'},{l:'衝刺',c:'KeyX',act:true}]}};
// ---- 3. 浪尖快艇賽 ----
const JET_BASE={sky:['#4ab0f0','#d8f4ff'],far:'sea',farCol:'#2a7fc0',isle:1,ground:['#2a86c8','#2680c0'],road:['#3aa0e0','#3498d8'],rumble:['#ffffff','#e8f6ff'],water:1,spr:[['island',3],['rock',2],['boat',1]],edge:['buoy',4,1.22],dens:.18,near:1.6,spread:3,fog:'#cfeaf8',nosign:1,rock:'#7a7068'};
function jetTheme(S){ const T=Object.assign({},JET_BASE,S.tx||{}); const m=S.mod||'';
  if(m.includes('sunset')){ T.sky=['#ff8a5a','#ffd8a0']; T.fog='#f4c8a0'; T.sun='rgba(255,190,110,.8)'; T.road=['#e88a5a','#d88050'].map(x=>shade(x,.85)); T.ground=['#c8704a','#bc6a46']; }
  if(m.includes('night')){ T.night=1; T.sky=['#081028','#24305a']; T.fog='#1a2848'; T.road=['#1f4a78','#1c4470']; T.ground=['#14305a','#122c54']; T.farCol='#14305a'; }
  if(m.includes('rain')){ T.rain=1; T.mist=1.6; if(!T.night){ T.sky=['#5a6a7a','#a0aab4']; T.fog='#8a96a2'; } }
  if(m.includes('green')){ T.road=['#3a8a7a','#368274']; T.ground=['#2f7a5a','#2c7254']; T.far='hills'; T.farCol='#3f7a3a'; T.farCol2='#6a9a5a'; }
  if(m.includes('ice')){ T.road=['#5ab0e0','#54a8d8']; T.ground=['#3a90c8','#3488c0']; T.far='snowmtn'; T.farCol='#a8c8e0'; T.farCol2='#d0e4f2'; T.sky=['#9ad0f0','#e8f6ff']; }
  return T; }
const JET={id:'jet',name:'浪尖快艇賽',camH:820,kmh:120,engine:'square',tagH:1.4,useText:'渦輪加速！',chargeCol:'#ff9d3d',
  P:{max:11500,acc:4800,brake:6500,decel:2000,offMax:.7,steer:3.4,grip:2.4,cent:.5,wall:1.2,boostMul:1.42,ww:360,drift:1,jumpV:0,grav:3000},
  stages:mkStages([['椰林海灣','',{tx:{spr:[['island',4],['boat',1]]}}],['平靜河道','',{mod:'green',tx:{spr:[['tree',5],['house',1],['bush',2]],dens:.5,near:1.4}}],['珊瑚淺灘','',{tx:{road:['#5ac8e8','#52c0e0'],ground:['#3aa8d8','#36a0d0']}}],
    ['港灣航道','',{tx:{spr:[['container',3],['crane',2],['boat',3]],dens:.35}}],['紅樹林','',{mod:'green',tx:{spr:[['mangrove',6]],dens:.55,near:1.4}}],['夕陽海峽','',{mod:'sunset'}],
    ['瀑布峽谷','',{mod:'green',tx:{spr:[['waterfall',2],['cliff',4],['pine',2]],dens:.4}}],['海盜灣','',{tx:{spr:[['boat',4],['island',2],['rock',2]]}}],['燈塔外海','',{tx:{spr:[['lighthouse',1],['rock',4]]}}],
    ['浪濤海峽','',{tx:{spr:[['rock',4],['island',1]]}}],['冰山海域','',{mod:'ice',tx:{spr:[['iceberg',6],['rock',1]]}}],['雨夜港口','',{mod:'night rain',tx:{spr:[['container',3],['crane',2],['lighthouse',.5]],dens:.35}}],
    ['颱風巨浪','',{mod:'rain'}],['漩渦海峽','',{tx:{spr:[['rock',5],['cliff',1]]}}],['海龍迷宮','',{mod:'night',tx:{spr:[['temple',3],['rock',3]],dens:.3}}]],
    (st,i)=>({len:2500+st*450,curve:1.5+st*.85,hill:300+st*150,wave:40+st*45,ai:.66+st*.06,rocks:.003+st*.002,rings:.006,ramps:.0015+st*.0004})),
  theme:jetTheme,
  place(C,r){ const S=C.S; for(let i=C.start+50;i<C.finish-20;i++){ const s=C.segs[i];
      if(r()<S.rocks) s.obs.push({k:r()<.5?'rock':'log',x:(r()*1.5-.75),dz:r()*SEGL,ww:r()<.5?560:1000,hw:r()<.5?220:420,water:1});
      else if(r()<S.rings){ const id='r'+i; s.obs.push({k:'ring',x:(r()*1.3-.65),dz:100,ww:520,hw:240,good:1,id,taken:new Set(),gone(p){ return this.taken.has(p); }}); }
      else if(r()<S.ramps) s.obs.push({k:'ramp',x:(r()*.8-.4),dz:100,ww:1100,hw:520,good:1,ramp:1,water:1}); } },
  onObs(k,ob,A){ if(ob.k==='ring'){ ob.taken.add(k.i); if(k.charges<3) k.charges++; A.toast(k,'穿過加速圈！渦輪 +1'); if(k.local) A.sfx('item'); return; }
    if(ob.ramp){ if(k.airY<=0){ k.vy=800+k.v*.1; k.airY=1; A.toast(k,'飛越浪頭！'); if(k.local) A.sfx('spring'); } return; }
    if(k.airY>120) return; A.crash(k,1,ob.k==='log'?'撞到漂流木！':'撞到礁石！'); },
  onLand(k,A){ k.boostT=Math.max(k.boostT,.6); },
  drawBack:jetBack,drawFront:jetFront,drawSide:jetSide,
  botLook:i=>({boat:['pwc','speed','stand'][i%3],hull:COLORS[(i+2)%6],vest:['#ff7a1a','#ffd23f','#5fd068','#ff4d4d','#3d8bff','#c56bff'][i%6],helmet:['full','half','mx'][(i+1)%3],helm:['#ffffff','#1e1e24','#ff4d4d','#3ddbd9','#ffd23f','#ff7eb6'][i%6],deco:['shark','num,flag','stripe,glow','flame','wing,num','light,duck'][i%6],nitro:['blue','fire','green','rainbow'][(i+1)%4],num:String(i+2)}),
  looks:[{key:'boat',label:'船型',opts:[{id:'pwc',label:'坐式水上摩托車'},{id:'stand',label:'站立式水上摩托'},{id:'speed',label:'競速快艇'}]},
    {key:'hull',label:'船身顏色',type:'color',opts:['#ffd23f','#ff4d4d','#3d8bff','#5fd068','#c56bff','#ff9d3d','#ffffff','#1e1e24']},
    {key:'vest',label:'救生衣',type:'color',opts:['#ff7a1a','#ffd23f','#5fd068','#ff4d4d','#3d8bff']},
    {key:'helmet',label:'安全帽',opts:[{id:'full',label:'全罩式'},{id:'half',label:'半罩式'},{id:'mx',label:'越野帽'}]},
    {key:'helm',label:'安全帽顏色',type:'color',opts:['#ffffff','#1e1e24','#ff4d4d','#3ddbd9','#ffd23f','#ff7eb6']},
    {key:'deco',label:'配件',type:'multi',hint:'每一類選一個，再按一次取下',opts:[{id:'flag',label:'旗子',grp:'船上'},{id:'wing',label:'尾翼',grp:'船上'},{id:'light',label:'警示燈',grp:'船上'},{id:'shark',label:'鯊魚嘴彩繪',grp:'船身'},{id:'flame',label:'火焰彩繪',grp:'船身'},{id:'num',label:'賽艇號碼',grp:'船身'},{id:'stripe',label:'賽車條紋',grp:'船身'},{id:'glow',label:'霓虹水底燈',grp:'燈光'},{id:'catears',label:'貓耳',grp:'帽飾'},{id:'horns',label:'惡魔角',grp:'帽飾'},{id:'mohawk',label:'莫西幹',grp:'帽飾'},{id:'duck',label:'小鴨',grp:'帽飾'}]},
    {key:'nitro',label:'加速特效',opts:[{id:'blue',label:'藍焰'},{id:'fire',label:'火焰'},{id:'green',label:'綠焰'},{id:'rainbow',label:'彩虹'}]}],
  desc:'騎坐式、站立式水上摩托車或競速快艇（造型可選船型和鯊魚嘴彩繪、尾翼、霓虹水底燈等配件），在海灣、河道、紅樹林、冰山海域和颱風巨浪裡競速。水面會甩尾滑行，浪頭跳台能飛起來，穿過加速圈存渦輪，閃開礁石和漂流木。共 15 關，單人、雙人或連線。',
  goal:'沿著浮標水道衝到終點，前 3 名過關。水上轉彎會滑，要提早轉；穿過橘色加速圈可以存一次渦輪（最多 3 次），按 X 使用；從浪頭跳台飛起落地會小加速。撞到礁石、漂流木會翻船減速。',
  help:[['↑ ↓','油門、煞車'],['← →','轉向（會滑行）'],['X','渦輪加速'],['W A S D Q','雙人 1P（左半畫面）'],['↑ ↓ ← → Enter','雙人 2P（右半畫面）']],
  touchHelp:[['◀ ▶','轉向，自動催油門'],['煞','煞車'],['渦輪','渦輪加速']],
  touch:{left:[{l:'◀',c:'ArrowLeft',big:true},{l:'▶',c:'ArrowRight',big:true}],right:[{l:'煞',c:'ArrowDown'},{l:'渦輪',c:'KeyX',act:true}]}};
// ---- 6. 萌寵障礙賽跑 ----
const RUN_BASE={sky:['#7ac8ff','#e8f8ff'],far:'hills',farCol:'#6aae5a',farCol2:'#9ad08a',ground:['#7ac85a','#70bc50'],road:['#d4573a','#cc5236'],rumble:['#ffffff','#f4f4f4'],lanes:4,spr:[['tree',4],['bush',3],['crowd',1],['balloon',1]],edge:null,dens:.5,near:1.35,spread:1.8,fog:'#e0f2ff',nosign:1,flowers:1};
function runTheme(S){ const T=Object.assign({},RUN_BASE,S.tx||{}); const m=S.mod||''; if(m.includes('night')){ T.night=1; T.sky=['#120c30','#3a2a6a']; T.fog='#2a2050'; T.ground=T.ground.map(x=>shade(x,.5)); T.road=T.road.map(x=>shade(x,.6)); } return T; }
const RUN={id:'run',name:'萌寵障礙賽跑',camH:720,kmh:40,run:1,tagH:1.25,useText:'衝刺！',chargeCol:'#ff8a1a',speedUnit:'KM/H',
  P:{max:8600,acc:7000,brake:0,decel:0,offMax:.6,steer:3,cent:.2,wall:1.12,boostMul:1.4,ww:300,jumpV:1500,grav:4600,slide:1,jumpLead:13},
  stages:mkStages([['草地運動會',''],['森林步道','',{tx:{spr:[['tree',6],['pine',3],['bush',2]],road:['#a8784a','#a07044']}}],['花園小徑','',{tx:{spr:[['bush',6],['tree',2],['balloon',1]],road:['#d8c8a8','#d0c0a0']}}],
    ['沙灘跑道','',{tx:{spr:[['palm',5],['rock',1],['crowd',1]],ground:['#f0dc9c','#e8d48c'],road:['#e8c88a','#e0c080'],far:'sea',farCol:'#3a9ad8',pitCol:'#3a9ad8'}}],
    ['蘑菇森林','',{tx:{spr:[['mushroom',6],['tree',2]],ground:['#5aa83a','#52a034']}}],['糖果樂園','',{tx:{spr:[['candy',6],['balloon',2]],ground:['#ffc6e0','#ffb8d8'],road:['#ff8ac0','#f882b8'],sky:['#ffc8e8','#fff0f8'],far:'hills',farCol:'#ffa8d0',farCol2:'#ffd0e4',pitCol:'#8a5a3a'}}],
    ['雪地樂園','',{tx:{spr:[['pine',5],['snowman',3]],ground:['#f4f8ff','#e8f0fa'],road:['#9ac8e8','#92c0e0'],snowy:1,far:'snowmtn',farCol:'#a8c8e0',farCol2:'#d0e4f2',snowfall:1,pitCol:'#7ab8e8'}}],
    ['竹林小道','',{tx:{spr:[['bamboo',7],['rock',1]],ground:['#5a9a4a','#529044'],road:['#b8a078','#b09870']}}],['遊樂園','',{tx:{spr:[['balloon',4],['crowd',3],['candy',2]],road:['#5a8ad8','#5482d0']}}],
    ['古堡庭園','',{tx:{spr:[['castle',2],['hedge',4],['bush',2]],road:['#a8a090','#a09888']}}],['叢林探險','',{tx:{spr:[['tree',5],['palm',3],['bush',3]],ground:['#3f8a3a','#388034'],road:['#8a6a42','#82623c'],far:'mountain',farCol:'#3f6a3a',farCol2:'#5f8a5a'}}],
    ['熔岩小島','',{tx:{spr:[['volcano',1],['rock',4],['palm',1]],ground:['#4a3a32','#42332c'],road:['#6a4a3a','#624434'],sky:['#5a2a2a','#c86a3a'],far:'mountain',farCol:'#3a2a2a',farCol2:'#5a3a32',pitCol:'#ff6a1a'}}],
    ['天空步道','',{tx:{spr:[['cloud',6]],ground:['#ffffff','#eef6ff'],road:['#c8a0f0','#c098e8'],far:'none',pitCol:'#9ad0ff'}}],['彩虹橋','',{mod:'night',tx:{spr:[['cloud',3]],road:['#ff6ac8','#6ac8ff'],far:'none',pitCol:'#3a2a6a'}}],
    ['夢幻迷宮','',{tx:{spr:[['hedge',8],['balloon',1]],ground:['#4f8a3a','#478234'],road:['#c8b890','#c0b088']}}]],
    (st,i)=>({len:1900+st*350,curve:1+st*.6,hill:500+st*350,ai:.66+st*.06,hurdles:.012+st*.004,low:st>=2,pits:st>=2,mud:st>=1,springs:st>=3})),
  theme:runTheme,
  place(C,r){ const S=C.S; let last=0;
    for(let i=C.start+30;i<C.finish-15;i++){ const s=C.segs[i]; if(i-last<6) continue;
      if(r()<S.hurdles){ last=i; const k=r(); const pick=k<.4?'hurdle':k<.55&&S.low?'lowbar':k<.68&&S.pits?'pit':k<.8?'log':k<.9&&S.mud?'mud':'hurdle';
        const full=pick==='pit'||pick==='lowbar'||(pick==='log'&&r()<.5);
        const ob={k:pick,x:full?0:[-.55,0,.55][(r()*3)|0],dz:100,ww:full?3600:1300,hw:full?1900:620};
        if(pick==='hurdle'||pick==='log') ob.h=pick==='log'?110:150; if(pick==='pit') ob.h=20; if(pick==='lowbar'){ ob.low=1; } if(pick==='mud'){ ob.mud=1; ob.h=30; } s.obs.push(ob); continue; }
      if(r()<.008){ const id='k'+i; s.obs.push({k:'carrot',x:(r()*1.2-.6),dz:100,ww:240,hw:200,good:1,id,taken:new Set(),gone(p){ return this.taken.has(p); }}); }
      else if(S.springs&&r()<.002){ s.obs.push({k:'spring',x:(r()*1-.5),dz:100,ww:380,hw:200,good:1,spring:1}); } } },
  onObs(k,ob,A){ if(ob.k==='carrot'){ ob.taken.add(k.i); if(k.charges<3) k.charges++; A.toast(k,'吃到紅蘿蔔！衝刺 +1'); if(k.local) A.sfx('heal'); return; }
    if(ob.spring){ if(k.airY<=0){ k.vy=2300; k.airY=1; A.toast(k,'彈簧！跳好高'); if(k.local) A.sfx('spring'); } return; }
    if(ob.low){ if(k.slideT>0) return; A.crash(k,.9,'撞到樹枝了！要按 ↓ 滑過去'); return; }
    if(ob.h!=null&&k.airY>ob.h) return;
    if(ob.mud){ if(k.mudAt===ob) return; k.mudAt=ob; k.v*=.55; A.toast(k,'踩到泥巴，變慢了'); return; }
    A.crash(k,ob.k==='pit'?1.3:.9,ob.k==='pit'?'掉進水坑了！':ob.k==='log'?'被木頭絆倒了！':'撞到欄架了！'); },
  drawBack:(c,x,y,w,o,t)=>animalBack(c,x,y,w,Object.assign({run:14},o),t),drawFront:animalFront,
  botLook:i=>({animal:['dog','bunny','bear','panda','fox','penguin','frog','cat'][i%8],cloth:COLORS[(i+1)%6],hat:['none','band','cap','none','flower','crown'][i%6]}),
  looks:[{key:'animal',label:'動物',opts:Object.keys(ANIMALS).map(k=>({id:k,label:ANIMALS[k].name}))},{key:'cloth',label:'背心顏色',type:'color',opts:['#ff4d4d','#3d8bff','#ffd23f','#5fd068','#c56bff','#ff9d3d']},
    {key:'hat',label:'頭飾',opts:[{id:'none',label:'不戴'},{id:'band',label:'頭帶'},{id:'cap',label:'棒球帽'},{id:'crown',label:'皇冠'},{id:'flower',label:'小花'}]}],
  desc:'可愛的貓咪、小狗、兔子、熊貓、企鵝…大家一起跑障礙賽！跳過欄架和木頭、滑過低樹枝、別掉進水坑，吃紅蘿蔔存衝刺，踩彈簧飛高高。15 條跑道：草地、糖果、雪地、古堡、熔岩、彩虹橋…',
  goal:'自動往前跑，前 3 名過關。看到欄架、木頭、水坑按 ↑ 或空白鍵跳過；看到低低的樹枝按 ↓ 滑過去；踩到泥巴會變慢。吃紅蘿蔔可以存一次衝刺（最多 3 次），按 X 使用。',
  help:[['← →','左右移動'],['↑ 或 空白鍵','跳'],['↓','滑行（鑽過低樹枝）'],['X','衝刺（吃紅蘿蔔存的）'],['W S A D Q','雙人 1P：W 跳、S 滑、Q 衝刺'],['↑ ↓ ← → Enter','雙人 2P：↑ 跳、↓ 滑、Enter 衝刺']],
  touchHelp:[['◀ ▶','左右移動'],['跳','跳過欄架、水坑'],['滑','滑過低樹枝'],['衝刺','用衝刺']],
  touch:{left:[{l:'◀',c:'ArrowLeft',big:true},{l:'▶',c:'ArrowRight',big:true}],right:[{l:'跳',c:'Space',act:true},{l:'滑',c:'ArrowDown'},{l:'衝刺',c:'KeyX'}]}};

/* ================= 註冊：開始畫面示意圖、縮圖、造型預覽 ================= */
const cache={};
function courseOf(G,si){ const k=G.id+si; return cache[k]||(cache[k]=buildCourse(G,si)); }
function demo(G,ctx,w,h,si,t,L){ const C=courseOf(G,si),z=(C.start+5)*SEGL+((t*G.P.max*.55)%((C.finish-C.start-20)*SEGL)),s=segAt(C,z);
  const cam={x:Math.sin(t*.7)*.35-s.curve*.05,z,airY:0,bx:-t*20};
  const items={},add=(zz,it)=>{ const i=Math.floor(zz/SEGL); it.f=(zz-i*SEGL)/SEGL; (items[i]=items[i]||[]).push(it); };
  add(z,{x:cam.x,ww:G.P.ww,d:(px,py,ww)=>G.drawBack(ctx,px,py,ww,{look:L||G.botLook(0),lean:Math.sin(t*.7+1.6)*.3,spd:.7,night:C.TH.night,num:1},t)});
  for(let j=1;j<4;j++) add(z+j*900+Math.sin(t+j)*200,{x:[-.5,.4,0][j-1],ww:G.P.ww,d:(px,py,ww)=>G.drawBack(ctx,px,py,ww,{look:G.botLook(j),lean:0,spd:.7,night:C.TH.night,num:j+1},t+j)});
  renderView(ctx,{x:0,y:0,w,h},C,cam,items,t,{me:-1}); }
function register(G){
  const recKey=i=>'arcade.'+G.id+'.t.'+G.stages[i].name,getRec=i=>{ try{ const v=parseFloat(localStorage.getItem(recKey(i))); return isFinite(v)?v:null; }catch(e){ return null; } };
  (window.ARCADE_GAMES=window.ARCADE_GAMES||{})[G.id]={
    name:G.name,tag:{moto:'MOTO RACE',sled:'SNOW SLED',jet:'JET SKI',run:'ANIMAL RUN'}[G.id],color:{moto:'#ff6a3d',sled:'#7ac4f4',jet:'#3a9ad8',run:'#ff8ac0'}[G.id],online:true,maxPlayers:6,bots:true,
    desc:G.desc,goal:G.goal,stages:G.stages.map(s=>s.name),stars:G.stages.map(s=>s.stars),
    options:[{key:'team',label:'雙人／連線玩法',def:'ffa',opts:[{id:'ffa',label:'各自分開'},{id:'vs',label:'分隊對戰（電腦補人）'},{id:'pvp',label:'玩家對決（不加電腦）'},{id:'coop',label:'玩家同隊打電腦'}]}],
    modes:[{id:'1p',label:'單人'},{id:'2p',label:'雙人',kb:true}],help:G.help.concat([['R','卡住或跑偏時回到路中央（雙人 1P 按 R、2P 按 Backspace）']]),touchHelp:G.touchHelp.concat([['回正','卡住或跑偏時回到路中央']]),touch:{left:G.touch.left,right:G.touch.right.concat([{l:'回正',c:'KeyR'}])},looks:G.looks,
    best:{label:'最快紀錄',fmt:v=>fmtTime(v),lower:true},
    stageBest:i=>{ const v=getRec(i); return v==null?'':fmtTime(v); },
    hubBest:()=>{ let i=0; try{ i=Math.max(0,G.stages.findIndex(s=>s.name===localStorage.getItem('arcade.'+G.id+'.last'))); }catch(e){} const v=getRec(i); return v==null?'尚無紀錄':'最快紀錄 <b>'+G.stages[i].name+' '+fmtTime(v)+'</b>'; },
    stageShow:(ctx,w,h,si,t)=>{ demo(G,ctx,w,h,si,t,G.__look); const S=G.stages[si]; ctx.fillStyle='rgba(11,10,28,.65)'; rr(ctx,8,8,Math.min(w-16,170+S.name.length*10),30,10); ctx.fill(); ctx.fillStyle='#ffd23f'; ctx.font='900 16px '+TC; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(S.name+'　'+'★'.repeat(S.stars),18,24); },
    thumb:(ctx,w,h,t)=>{ demo(G,ctx,w,h,0,t+3); ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 '+Math.round(h*.13)+'px '+TC; ctx.lineWidth=6; ctx.strokeStyle='#0b0a1c'; ctx.strokeText(G.name,w/2,h*.15); ctx.fillStyle='#ffd23f'; ctx.fillText(G.name,w/2,h*.15); },
    preview:(ctx,w,h,L,t)=>{ G.__look=L; const C=courseOf(G,0); drawBack(ctx,w,h,C.TH,-t*15,0,t); ctx.fillStyle=C.TH.ground[0]; ctx.fillRect(0,h*.72,w,h*.28);
      if(G.drawSide){ G.drawSide(ctx,w*.36,h*.86,h*.5,L,t); G.drawBack(ctx,w*.8,h*.9,h*.34,{look:L,lean:Math.sin(t)*.25,spd:.6,num:(L&&L.num)||1,boost:Math.sin(t*1.5)>.6},t); }
      else { G.drawFront(ctx,w*.32,h*.92,h*.42,L,t); G.drawBack(ctx,w*.72,h*.92,h*.42,{look:L,lean:Math.sin(t)*.3,spd:.6,num:1},t); }
      ctx.fillStyle='rgba(11,10,28,.6)'; ctx.font='700 12px '+TC; ctx.textAlign='center'; ctx.fillText(G.drawSide?'側面':'正面',G.drawSide?w*.36:w*.32,h*.97); ctx.fillText('背面（比賽中）',G.drawSide?w*.8:w*.72,h*.97); },
    create:makeCreate(G),_G:G,_course:i=>courseOf(G,i)};
}
[MOTO,SLED,JET,RUN].forEach(register);
})();
