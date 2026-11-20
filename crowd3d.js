// 鬥魂系列共用：3D 看台（階梯座位、一排排的觀眾、廣告看板、欄杆）和觀眾貼圖。
// window.__CROWD.tex(T,o)  → 觀眾貼圖（兩張：平常／歡呼舉手），o:{night,cols,seed,rows}
// window.__CROWD.stands(T,o) → {g, update(t,cheer)}；g 的原點在看台最前面中間、地面上，觀眾面向 +Z。
(function(){
'use strict';
const SKIN=['#f2c9a0','#e8b890','#d9a27a','#b8805a','#8a5a3a','#f6d6b8'],HAIR=['#1a1410','#2a1a10','#3a2416','#6a4a2a','#8a6a3a','#c8a060','#2a2a2a','#9a3a1a'];
function rnd(seed){ let a=seed>>>0||1; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const shade=(h,k)=>{ const n=parseInt(String(h).slice(1),16); if(isNaN(n)) return h; const f=v=>Math.max(0,Math.min(255,Math.round(k>1?v+(255-v)*(k-1):v*k))); return 'rgb('+f(n>>16)+','+f(n>>8&255)+','+f(n&255)+')'; };
// 畫一整面觀眾（一排一排、有座位、有人舉手、拿旗子、戴帽子）
function paint(c,w,h,o,frame){ const R=rnd(o.seed||7),rows=o.rows||9,rh=h/rows,night=!!o.night;
  const cols=(o.cols&&o.cols.length?o.cols:[]).concat(['#ff5d4f','#ffd23f','#3ddbd9','#ffffff','#ff7eb6','#86dc4f','#4f9dff','#ff9d3d','#e23b3b','#2f6fd0','#f4f4f4','#3a3a4a']);
  const seat=night?'#2a2c48':'#4a5068',step=night?'#20223a':'#6a7088';
  c.fillStyle=step; c.fillRect(0,0,w,h);
  for(let r=0;r<rows;r++){ const y0=r*rh;
    // 階梯：每排上面一條亮邊、下面陰影
    const g=c.createLinearGradient(0,y0,0,y0+rh); g.addColorStop(0,shade(step,1.15)); g.addColorStop(1,shade(step,.75)); c.fillStyle=g; c.fillRect(0,y0,w,rh);
    c.fillStyle=seat; c.fillRect(0,y0+rh*.42,w,rh*.4); c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(0,y0+rh*.42,w,2);
    let x=R()*10; const sp=rh*.62;
    while(x<w+sp){ const empty=R()<.08; if(!empty){ const s=rh/64,cx=x+(R()-.5)*sp*.2,base=y0+rh*.92,sh=cols[Math.floor(R()*cols.length)],sk=SKIN[Math.floor(R()*SKIN.length)],hr=HAIR[Math.floor(R()*HAIR.length)];
        const up=frame===1?R()<.62:R()<.12,flag=R()<.06,cap=R()<.22,stand=frame===1&&R()<.5,lift=stand?rh*.12:0;
        // 身體（有亮暗面）
        const by=base-40*s-lift; const bg=c.createLinearGradient(cx-13*s,0,cx+13*s,0); bg.addColorStop(0,shade(sh,1.15)); bg.addColorStop(1,shade(sh,.72)); c.fillStyle=bg;
        c.beginPath(); c.moveTo(cx-13*s,base); c.lineTo(cx-12*s,by+6*s); c.quadraticCurveTo(cx,by-2*s,cx+12*s,by+6*s); c.lineTo(cx+13*s,base); c.closePath(); c.fill();
        // 手：舉起來或放在腿上
        c.strokeStyle=sh; c.lineCap='round'; c.lineWidth=5*s;
        if(up){ const sw=(R()-.5)*8*s; for(const d of [-1,1]){ c.beginPath(); c.moveTo(cx+d*10*s,by+8*s); c.lineTo(cx+d*14*s+sw,by-20*s); c.stroke(); c.fillStyle=sk; c.beginPath(); c.arc(cx+d*14*s+sw,by-22*s,3.2*s,0,7); c.fill(); } }
        else { for(const d of [-1,1]){ c.beginPath(); c.moveTo(cx+d*11*s,by+8*s); c.lineTo(cx+d*6*s,base-8*s); c.stroke(); } }
        if(flag){ const fx=cx+15*s,fy=by-30*s; c.strokeStyle='#ddd'; c.lineWidth=1.5*s; c.beginPath(); c.moveTo(fx,by+10*s); c.lineTo(fx,fy); c.stroke(); c.fillStyle=cols[Math.floor(R()*3)]; c.beginPath(); c.moveTo(fx,fy); c.lineTo(fx+20*s,fy+5*s+(frame?3*s:0)); c.lineTo(fx,fy+12*s); c.closePath(); c.fill(); }
        // 頭、頭髮、帽子、臉的陰影
        const hy=by-9*s; c.fillStyle=sk; c.beginPath(); c.arc(cx,hy,8.5*s,0,7); c.fill(); c.fillStyle='rgba(0,0,0,.12)'; c.beginPath(); c.arc(cx+3*s,hy+2*s,7*s,-.6,1.9); c.fill();
        if(cap){ c.fillStyle=cols[Math.floor(R()*cols.length)]; c.beginPath(); c.arc(cx,hy-2*s,8.8*s,Math.PI,0); c.fill(); c.fillRect(cx-2*s,hy-3*s,13*s,2.6*s); }
        else { c.fillStyle=hr; c.beginPath(); c.arc(cx,hy-1.5*s,8.8*s,Math.PI*1.05,Math.PI*1.95); c.fill(); if(R()<.3){ c.fillRect(cx-9*s,hy-2*s,3*s,10*s); c.fillRect(cx+6*s,hy-2*s,3*s,10*s); } }
        if(night&&R()<.05){ c.fillStyle='rgba(255,255,240,.9)'; c.fillRect(cx+10*s,by-6*s,3*s,4*s); } }
      x+=sp*(.85+R()*.3); }
    c.fillStyle='rgba(0,0,0,.18)'; c.fillRect(0,y0+rh-3,w,3); }
  if(night){ c.fillStyle='rgba(10,12,40,.28)'; c.fillRect(0,0,w,h); } }
function tex(T,o){ o=o||{}; const out=[0,1].map(fr=>{ const cv=document.createElement('canvas'); cv.width=o.w||1024; cv.height=o.h||512; paint(cv.getContext('2d'),cv.width,cv.height,o,fr); const t=new T.CanvasTexture(cv); t.wrapS=T.RepeatWrapping; t.anisotropy=8; return t; }); return out; }
// 廣告看板（原創字樣）
function adTex(T,o){ const cv=document.createElement('canvas'); cv.width=2048; cv.height=96; const c=cv.getContext('2d'); const ads=[['鬥魂','#ffd23f','#c8231a'],['ARCADE','#ffffff','#2f6fd0'],['GO! GO!','#14122b','#ffd23f'],['COLA','#ffffff','#e23b3b'],['SPORT','#ffffff','#1f8a5a'],['RETRO','#ff7eb6','#2a2050'],['★ FIGHT ★','#ffffff','#ff7a1a'],['HERO','#ffd23f','#3a3a4a']];
  ads.forEach((a,i)=>{ const x=i*256,g=c.createLinearGradient(0,0,0,96); g.addColorStop(0,shade(a[2],1.2)); g.addColorStop(1,shade(a[2],.8)); c.fillStyle=g; c.fillRect(x,0,256,96); c.fillStyle='rgba(255,255,255,.18)'; c.fillRect(x,0,256,8); c.fillStyle='rgba(0,0,0,.35)'; c.fillRect(x+254,0,2,96);
    c.font='900 50px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillStyle=a[1]; c.fillText(a[0],x+128,52,230); });
  const t=new T.CanvasTexture(cv); t.wrapS=T.RepeatWrapping; t.anisotropy=8; return t; }
// 看台：rows 排、每排深 dz、高 dy；前面一道廣告牆和欄杆；兩側水泥牆；（可選）屋頂和燈
function stands(T,o){ o=o||{}; const len=o.len||30,rows=o.rows||9,dz=o.dz||.8,dy=o.dy||.55,wallH=o.wall==null?1.1:o.wall,night=!!o.night,g=new T.Group();
  const conc=new T.MeshLambertMaterial({color:new T.Color(night?'#3a3c58':'#9aa0b0')});
  const [t0,t1]=tex(T,{night,cols:o.cols,seed:o.seed||11,rows,w:o.texW||2048,h:o.texH||512}); const rep=Math.max(1,len/(o.unit||26)); t0.repeat.set(rep,1); t1.repeat.set(rep,1);
  // 觀眾斜面（從牆頂往後上方）
  const depth=rows*dz,height=rows*dy,slope=Math.hypot(depth,height),crowdM=new T.MeshLambertMaterial({map:t0});
  const cp=new T.Mesh(new T.PlaneGeometry(len,slope),crowdM); cp.position.set(0,wallH+height/2+.25,-depth/2-.3); cp.rotation.x=-Math.atan2(depth,height); /* 往後上方傾斜 */ cp.receiveShadow=true; g.add(cp);
  // 階梯水泥（看台的實體，讓側面看起來有厚度）
  const back=new T.Mesh(new T.BoxGeometry(len,height+wallH+.25,.4),conc); back.position.set(0,(height+wallH+.25)/2,-depth-.5); g.add(back);
  for(const s of [-1,1]){ const sh=new T.Shape(); sh.moveTo(0,0); sh.lineTo(depth+.7,0); sh.lineTo(depth+.7,height+wallH+.5); sh.lineTo(0,wallH+.3); sh.closePath(); const sg=new T.ExtrudeGeometry(sh,{depth:.35,bevelEnabled:false}); const sm=new T.Mesh(sg,conc); sm.rotation.y=Math.PI/2; sm.position.set(s*(len/2)+(s>0?0:-.35),0,0); sm.castShadow=sm.receiveShadow=true; g.add(sm); }
  // 前面的廣告牆＋欄杆
  if(wallH>0){ const at=adTex(T); at.repeat.set(Math.max(1,len/16),1); const wall=new T.Mesh(new T.BoxGeometry(len,wallH,.25),[conc,conc,conc,conc,new T.MeshLambertMaterial({map:at}),conc]); wall.position.set(0,wallH/2,0); wall.castShadow=wall.receiveShadow=true; g.add(wall);
    const rail=new T.MeshPhongMaterial({color:0xc8ccd6,shininess:80,specular:0x777777}); const top=new T.Mesh(new T.CylinderGeometry(.035,.035,len,8),rail); top.rotation.z=Math.PI/2; top.position.set(0,wallH+.55,-.05); g.add(top);
    for(let x=-len/2;x<=len/2+.01;x+=2){ const p=new T.Mesh(new T.CylinderGeometry(.025,.025,.55,6),rail); p.position.set(x,wallH+.28,-.05); g.add(p); } }
  // 屋頂和照明
  if(o.roof){ const rm=new T.MeshLambertMaterial({color:new T.Color(night?'#2a2c40':'#d8dce4')}),rf=new T.Mesh(new T.BoxGeometry(len+1,.25,depth*.8),rm); rf.position.set(0,wallH+height+2.4,-depth*.65); rf.rotation.x=-.12; rf.castShadow=true; g.add(rf);
    for(let x=-len/2+2;x<len/2;x+=Math.max(4,len/6)){ const col=new T.Mesh(new T.CylinderGeometry(.08,.1,height+2.6,8),rm); col.position.set(x,(wallH+height+2.4)/2,-depth-.2); g.add(col);
      const lamp=new T.Mesh(new T.BoxGeometry(.8,.25,.2),new T.MeshBasicMaterial({color:night?0xfff6d8:0xe8ecf4})); lamp.position.set(x,wallH+height+2.2,-depth*.3); g.add(lamp); } }
  let cur=0;
  return {g,update(t,cheer){ const want=cheer&&Math.floor(t*5)%2?1:0; if(want!==cur){ cur=want; crowdM.map=want?t1:t0; crowdM.needsUpdate=true; } cp.position.y=wallH+height/2+.25+(cheer?Math.abs(Math.sin(t*9))*.04:0); }}; }
// 球的貼圖（等距長方投影）
function ballTex(T,kind,col){ const cv=document.createElement('canvas'); cv.width=512; cv.height=256; const c=cv.getContext('2d'),W=512,H=256;
  if(kind==='soccer'){ c.fillStyle='#f6f6f2'; c.fillRect(0,0,W,H);
    // 正二十面體的 12 個頂點畫成黑色五角形（經緯度投影，靠近兩極橫向放大）
    const P=[[90,0]],ph=26.565; for(let i=0;i<5;i++){ P.push([ph,i*72]); P.push([-ph,i*72+36]); } P.push([-90,0]);
    c.fillStyle='#1c1c24'; for(const [la,lo] of P){ const cy=(90-la)/180*H,cx=lo/360*W,rr=H*.085,sx=1/Math.max(.25,Math.cos(la*Math.PI/180));
      if(Math.abs(la)>80){ c.fillRect(0,la>0?0:H-rr*.9,W,rr*.9); continue; }
      for(const off of [-W,0,W]){ c.beginPath(); for(let k=0;k<5;k++){ const a=-Math.PI/2+k/5*Math.PI*2; c.lineTo(cx+off+Math.cos(a)*rr*sx,cy+Math.sin(a)*rr); } c.closePath(); c.fill(); } }
    c.strokeStyle='rgba(60,60,70,.35)'; c.lineWidth=1.4; for(let i=0;i<14;i++){ c.beginPath(); c.moveTo((i*37)%W,0); c.lineTo((i*37+90)%W,H); c.stroke(); }
    if(col&&col!=='#ffffff'){ c.globalCompositeOperation='multiply'; c.fillStyle=col; c.fillRect(0,0,W,H); c.globalCompositeOperation='source-over'; } }
  else if(kind==='dodge'){ const base=col||'#e8402a',g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,shade(base,1.1)); g.addColorStop(1,shade(base,.85)); c.fillStyle=g; c.fillRect(0,0,W,H);
    for(let i=0;i<6000;i++){ c.fillStyle=i%2?'rgba(0,0,0,.07)':'rgba(255,255,255,.07)'; c.fillRect((i*37.3)%W,(i*17.7)%H,1.5,1.5); }
    c.strokeStyle=shade(base,.55); c.lineWidth=4; for(let k=0;k<4;k++){ c.beginPath(); for(let x=0;x<=W;x+=4){ const y=H/2+Math.sin(x/W*Math.PI*2*2+k*Math.PI/2)*H*.32; x?c.lineTo(x,y):c.moveTo(x,y); } c.stroke(); }
    c.fillStyle='rgba(255,255,255,.85)'; c.font='900 40px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('鬥魂',W*.25,H/2); c.fillText('DODGE',W*.75,H/2); }
  const t=new T.CanvasTexture(cv); t.anisotropy=8; return t; }
window.__CROWD={tex,stands,adTex,ballTex,paint};
})();
