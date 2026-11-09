// 塗裝躲躲樂：白色小人偶躲進一幅畫裡。躲的人換姿勢、轉方向、用吸管從畫裡取色塗裝，把自己變成背景的一部分；
// 時間到換找的人上場，在畫裡把大家揪出來。單人可以「我來躲」（電腦來找）或「我來找」（電腦躲）；雙人同一台輪流；連線 2～6 人輪流當找的人。
(function(){
'use strict';
const W=800,H=450,TC='"Noto Sans TC","Microsoft JhengHei",sans-serif',TAU=Math.PI*2,LU=150,PXU=1.2,LP=LU*PXU,HALF=LU/2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,r2=v=>Math.round(v*100)/100;
function mul(seed){ let a=seed>>>0||1; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const hsl=(h,s,l,a)=>'hsla('+(h%360)+','+s+'%,'+l+'%,'+(a==null?1:a)+')';
const hasWin=(m,i)=>{ try{ return localStorage.getItem('arcade.hide.w.'+m+'.'+i)==='1'; }catch(e){ return false; } };
const recWin=(m,i)=>{ try{ localStorage.setItem('arcade.hide.w.'+m+'.'+i,'1'); }catch(e){} };

// ---------- 10 幅畫（用程式畫，每台電腦畫出來都一樣） ----------
function rrect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
const SCENES=[
 ['糖果貨架',(c,R)=>{ for(let x=0;x<W;x+=40){ c.fillStyle=(x/40)%2?'#ffd6e8':'#ffc2dc'; c.fillRect(x,0,40,H); }
   for(let s=0;s<4;s++){ const y=95+s*100; c.fillStyle='#b8743a'; c.fillRect(0,y,W,14); c.fillStyle='#8a5226'; c.fillRect(0,y+14,W,5);
     for(let x=10;x<W-40;){ const w=34+R()*36,h=50+R()*30,hue=R()*360; c.fillStyle='rgba(255,255,255,.45)'; rrect(c,x,y-h,w,h,8); c.fill(); c.strokeStyle='rgba(120,120,160,.5)'; c.lineWidth=2; c.stroke();
       for(let k=0;k<w*h/28;k++){ c.fillStyle=hsl(hue+R()*120-60,80,45+R()*30); c.beginPath(); c.arc(x+5+R()*(w-10),y-4-R()*(h-12),3+R()*4,0,TAU); c.fill(); }
       c.fillStyle=hsl(hue,70,60); c.fillRect(x+3,y-h-8,w-6,9); x+=w+6+R()*10; } }
   for(let k=0;k<7;k++){ const x=40+R()*720,y=20+R()*60,hu=R()*360; c.strokeStyle='#eee'; c.lineWidth=3; c.beginPath(); c.moveTo(x,y); c.lineTo(x,y+40); c.stroke(); for(let q=0;q<5;q++){ c.strokeStyle=hsl(hu+q*40,80,55); c.lineWidth=4; c.beginPath(); c.arc(x,y,16-q*3,q,q+4); c.stroke(); } } }],
 ['塗鴉牆',(c,R)=>{ c.fillStyle='#b65a44'; c.fillRect(0,0,W,H); for(let y=0;y<H;y+=18) for(let x=(y/18)%2*20-20;x<W;x+=40){ c.fillStyle=hsl(10+R()*14,45,38+R()*14); c.fillRect(x+1,y+1,38,16); }
   for(let k=0;k<34;k++){ const x=R()*W,y=R()*H,r=30+R()*80,g=c.createRadialGradient(x,y,0,x,y,r),hu=R()*360; g.addColorStop(0,hsl(hu,90,58,.95)); g.addColorStop(.7,hsl(hu,90,55,.7)); g.addColorStop(1,hsl(hu,90,50,0)); c.fillStyle=g; c.fillRect(x-r,y-r,2*r,2*r);
     c.strokeStyle=hsl(hu,90,50,.8); c.lineWidth=3; for(let d=0;d<3;d++){ const dx=x-r*.5+R()*r; c.beginPath(); c.moveTo(dx,y); c.lineTo(dx,y+20+R()*50); c.stroke(); } }
   const L='ABCDEFGHKMRSWXYZ'; for(let k=0;k<14;k++){ c.save(); c.translate(R()*W,R()*H); c.rotate(R()-.5); c.font='900 '+(30+R()*50)+'px Impact,Arial'; c.lineWidth=6; c.strokeStyle=hsl(R()*360,80,25); const s=L[R()*16|0]+L[R()*16|0]+L[R()*16|0]; c.strokeText(s,0,0); c.fillStyle=hsl(R()*360,90,60); c.fillText(s,0,0); c.restore(); } }],
 ['花園',(c,R)=>{ const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#9ad86a'); g.addColorStop(1,'#3e8a2e'); c.fillStyle=g; c.fillRect(0,0,W,H);
   for(let k=0;k<70;k++){ c.fillStyle=hsl(90+R()*50,50,25+R()*25); c.beginPath(); c.ellipse(R()*W,R()*H,20+R()*40,12+R()*24,R()*3,0,TAU); c.fill(); }
   for(let k=0;k<1400;k++){ const x=R()*W,y=R()*H; c.strokeStyle=hsl(85+R()*50,55,22+R()*35); c.lineWidth=1.5; c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x+R()*8-4,y-8,x+R()*12-6,y-14-R()*10); c.stroke(); }
   for(let k=0;k<120;k++){ const x=R()*W,y=R()*H,r=5+R()*9,hu=[0,330,50,280,20,200][R()*6|0]; c.fillStyle=hsl(hu,85,60+R()*15); for(let p=0;p<6;p++){ c.beginPath(); c.arc(x+Math.cos(p)*r*.8,y+Math.sin(p)*r*.8,r*.6,0,TAU); c.fill(); } c.fillStyle='#ffd23f'; c.beginPath(); c.arc(x,y,r*.4,0,TAU); c.fill(); } }],
 ['水果攤',(c,R)=>{ c.fillStyle='#e8d0a0'; c.fillRect(0,0,W,H); for(let r=0;r<3;r++) for(let q=0;q<5;q++){ const x=8+q*158,y=10+r*148,w=150,h=140; c.fillStyle='#a8743a'; c.fillRect(x,y,w,h); c.fillStyle='#c88c4a'; for(let s=0;s<5;s++) c.fillRect(x,y+s*28+4,w,22);
     const kind=R()*5|0; for(let k=0;k<(kind===2?70:26);k++){ const fx=x+12+R()*(w-24),fy=y+12+R()*(h-30);
       if(kind===0){ c.fillStyle=hsl(25+R()*12,95,50+R()*10); c.beginPath(); c.arc(fx,fy,13,0,TAU); c.fill(); }
       else if(kind===1){ c.fillStyle=hsl(355+R()*10,80,40+R()*15); c.beginPath(); c.arc(fx,fy,12,0,TAU); c.fill(); c.fillStyle='#5a3'; c.fillRect(fx-1,fy-15,3,6); }
       else if(kind===2){ c.fillStyle=hsl(280+R()*20,50,30+R()*15); c.beginPath(); c.arc(fx,fy,6,0,TAU); c.fill(); }
       else if(kind===3){ c.strokeStyle=hsl(50+R()*6,90,55); c.lineWidth=9; c.lineCap='round'; c.beginPath(); c.arc(fx,fy-14,18,.3,1.6); c.stroke(); }
       else { c.fillStyle=hsl(90+R()*20,60,40+R()*10); c.beginPath(); c.ellipse(fx,fy,16,12,R(),0,TAU); c.fill(); c.strokeStyle='rgba(0,60,0,.4)'; c.lineWidth=2; c.stroke(); } }
     c.fillStyle='#fff8e0'; c.fillRect(x+w-50,y+h-26,44,20); c.fillStyle='#c8202a'; c.font='900 13px '+TC; c.fillText('$'+(10+R()*90|0),x+w-46,y+h-11); } }],
 ['玩具房',(c,R)=>{ for(let y=0;y<H;y+=30) for(let x=0;x<W;x+=30){ c.fillStyle=(x+y)/30%2?'#5ac8e8':'#ffe06a'; c.fillRect(x,y,30,30); }
   for(let k=0;k<26;k++){ c.fillStyle='#fff'; c.save(); c.translate(R()*W,R()*H); c.rotate(R()); c.beginPath(); for(let p=0;p<10;p++){ const r=p%2?7:16; c.lineTo(Math.cos(p*Math.PI/5)*r,Math.sin(p*Math.PI/5)*r); } c.fill(); c.restore(); }
   for(let k=0;k<60;k++){ const x=R()*W,y=R()*H,s=24+R()*30,hu=R()*360; c.save(); c.translate(x,y); c.rotate(R()*.6-.3); c.fillStyle=hsl(hu,80,55); c.fillRect(-s/2,-s/2,s,s); c.strokeStyle=hsl(hu,80,30); c.lineWidth=3; c.strokeRect(-s/2,-s/2,s,s); c.fillStyle='#fff'; c.font='900 '+(s*.6)+'px Arial'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('ABCXYZ123'[R()*9|0],0,2); c.restore(); }
   for(let k=0;k<30;k++){ const x=R()*W,y=R()*H,r=10+R()*16; for(let q=0;q<4;q++){ c.fillStyle=hsl(q*90+R()*30,80,55); c.beginPath(); c.moveTo(x,y); c.arc(x,y,r,q*Math.PI/2,(q+1)*Math.PI/2); c.fill(); } } }],
 ['書房',(c,R)=>{ c.fillStyle='#5a3a22'; c.fillRect(0,0,W,H); for(let s=0;s<5;s++){ const y=8+s*88; c.fillStyle='#7a4e2c'; c.fillRect(0,y+78,W,10);
     for(let x=4;x<W;){ const w=10+R()*18,h=55+R()*22,hu=R()*360,l=25+R()*40; c.fillStyle=hsl(hu,40+R()*40,l); c.fillRect(x,y+78-h,w,h); c.fillStyle=hsl(hu,50,l+25); c.fillRect(x,y+78-h+8,w,4); c.fillRect(x,y+78-14,w,3);
       c.fillStyle='rgba(255,230,160,.7)'; c.fillRect(x+w*.3,y+78-h+18,w*.4,h*.4); if(R()<.06){ c.save(); c.translate(x+w,y+78); c.rotate(-.35); c.fillStyle=hsl(R()*360,50,45); c.fillRect(0,-h,w,h); c.restore(); x+=20; } x+=w+1; } }
   for(let k=0;k<5;k++){ const x=R()*W,y=60+(R()*5|0)*88; c.fillStyle='#3a8a3a'; for(let q=0;q<8;q++){ c.beginPath(); c.ellipse(x+R()*30-15,y-R()*30,6,14,R()*3,0,TAU); c.fill(); } c.fillStyle='#c86a3a'; c.fillRect(x-10,y-4,20,14); } }],
 ['海灘',(c,R)=>{ const g=c.createLinearGradient(0,0,0,150); g.addColorStop(0,'#5ab4f0'); g.addColorStop(1,'#bfe6fa'); c.fillStyle=g; c.fillRect(0,0,W,150);
   for(let y=110;y<170;y+=6){ c.fillStyle=hsl(195,70,40+(y-110)/2+R()*8); c.fillRect(0,y,W,6); } c.fillStyle='#f0d898'; c.fillRect(0,165,W,H); for(let k=0;k<2500;k++){ c.fillStyle=hsl(40,50,60+R()*25,.7); c.fillRect(R()*W,165+R()*H,2,2); }
   for(let k=0;k<9;k++){ const x=R()*W,y=210+R()*200,w=60+R()*40,h=100,hu=R()*360; c.save(); c.translate(x,y); c.rotate(R()*.8-.4); for(let s=0;s<6;s++){ c.fillStyle=s%2?'#fff':hsl(hu,85,55); c.fillRect(-w/2+s*w/6,-h/2,w/6+1,h); } c.restore(); }
   for(let k=0;k<6;k++){ const x=R()*W,y=180+R()*200,hu=R()*360; c.strokeStyle='#eee'; c.lineWidth=4; c.beginPath(); c.moveTo(x,y); c.lineTo(x+6,y+90); c.stroke(); for(let s=0;s<8;s++){ c.fillStyle=s%2?'#fff':hsl(hu,85,55); c.beginPath(); c.moveTo(x,y); c.arc(x,y,60,Math.PI+s*Math.PI/8,Math.PI+(s+1)*Math.PI/8); c.fill(); } }
   for(let k=0;k<40;k++){ const x=R()*W,y=170+R()*280; c.fillStyle=hsl(R()*40,60,80); c.beginPath(); c.ellipse(x,y,6,4,R()*3,0,TAU); c.fill(); }
   for(let k=0;k<8;k++){ const x=R()*W,y=190+R()*250; for(let q=0;q<6;q++){ c.fillStyle=['#e8343a','#fff','#2a7ae8','#fff','#ffd23f','#fff'][q]; c.beginPath(); c.moveTo(x,y); c.arc(x,y,14,q*TAU/6,(q+1)*TAU/6); c.fill(); } } }],
 ['馬賽克',(c,R)=>{ c.fillStyle='#e8e0d0'; c.fillRect(0,0,W,H); const s=16; for(let y=0;y<H;y+=s) for(let x=0;x<W;x+=s){ const v=Math.sin(x*.02+y*.013)+Math.sin(y*.031-x*.008)*1.2; c.fillStyle=hsl(200+v*70+R()*30,60+R()*20,45+v*10+R()*12); c.fillRect(x+1,y+1,s-2,s-2); }
   for(let k=0;k<10;k++){ const cx=R()*W,cy=R()*H,r=30+R()*40,hu=R()*360; for(let y=-r;y<r;y+=s) for(let x=-r;x<r;x+=s){ if(x*x+y*y<r*r){ c.fillStyle=hsl(hu+R()*30,80,50+R()*15); c.fillRect(Math.floor((cx+x)/s)*s+1,Math.floor((cy+y)/s)*s+1,s-2,s-2); } } } }],
 ['夜市',(c,R)=>{ const g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#14102e'); g.addColorStop(1,'#3a1a3e'); c.fillStyle=g; c.fillRect(0,0,W,H);
   for(let k=0;k<6;k++){ const x=k*140-10,w=130; c.fillStyle=hsl(R()*360,30,20); c.fillRect(x,150,w,H-150); for(let s=0;s<7;s++){ c.fillStyle=s%2?'#fff':hsl(R()<.5?0:200,80,50); c.fillRect(x+s*w/7,120,w/7+1,34); }
     c.fillStyle='#ffe08a'; c.fillRect(x+10,160,w-20,30); c.fillStyle='#c8202a'; c.font='900 20px '+TC; c.fillText(['雞排','珍奶','烤魷魚','臭豆腐','滷味','車輪餅','蚵仔煎'][R()*7|0],x+16,183);
     for(let q=0;q<26;q++){ c.fillStyle=hsl(R()*360,60,40+R()*30); c.fillRect(x+6+R()*(w-20),210+R()*200,10+R()*14,8+R()*12); } }
   for(let k=0;k<26;k++){ const x=R()*W,y=20+R()*90,gg=c.createRadialGradient(x,y,0,x,y,30); gg.addColorStop(0,'rgba(255,200,120,.6)'); gg.addColorStop(1,'rgba(255,120,40,0)'); c.fillStyle=gg; c.fillRect(x-30,y-30,60,60); c.fillStyle='#e8303a'; c.beginPath(); c.ellipse(x,y,11,14,0,0,TAU); c.fill(); c.fillStyle='#ffd23f'; c.fillRect(x-6,y-16,12,3); c.fillRect(x-6,y+13,12,3); }
   for(let k=0;k<40;k++){ c.fillStyle=hsl(R()*360,30,15+R()*15); const x=R()*W,y=330+R()*120; c.beginPath(); c.arc(x,y-30,10,0,TAU); c.fill(); c.fillRect(x-12,y-20,24,40); } }],
 ['點描名畫',(c,R)=>{ c.fillStyle='#a8c8e0'; c.fillRect(0,0,W,H); for(let k=0;k<9000;k++){ const x=R()*W,y=R()*H; let hu,s,l; const hz=170+Math.sin(x*.01)*30;
     if(y<hz){ hu=200+R()*30; s=60; l=65+R()*20; if(Math.hypot(x-620,y-70)<50){ hu=45; l=70+R()*20; s=90; } } else if(y<hz+60+Math.sin(x*.02)*20){ hu=100+R()*40; s=50; l=30+R()*25; } else if(y<330){ hu=190+R()*20; s=60; l=40+R()*30; } else { hu=30+R()*80; s=55; l=40+R()*30; }
     c.fillStyle=hsl(hu,s,l); c.beginPath(); c.arc(x,y,2+R()*2.5,0,TAU); c.fill(); }
   for(let k=0;k<6;k++){ const x=60+R()*680,y=320+R()*80; for(let q=0;q<200;q++){ c.fillStyle=hsl(R()<.5?0:280,60,30+R()*30); c.beginPath(); c.arc(x+R()*16-8,y-R()*60,2.4,0,TAU); c.fill(); } } }]];
const SCN={};
function scene(i,S){ const key=i+':'+S; if(SCN[key]) return SCN[key]; const cv=document.createElement('canvas'); cv.width=W*S; cv.height=H*S; const c=cv.getContext('2d'); c.scale(S,S); SCENES[i][1](c,mul(i*7919+11)); SCN[key]=cv; return cv; }
const STAGES=SCENES.map((s,i)=>{ const k=i/9; return {name:s[0],k,stars:1+Math.round(k*4),nHide:3+Math.round(k*4),bs:12-8*k,noise:44-34*k,eye:.9-.45*k}; });

// ---------- 小人偶：姿勢（上臂角度、彎曲；從正下方算，往外為正）----------
const POSES=[['站好',[.15,0,.15,0],[.06,0,.06,0]],['大字',[2.0,0,2.0,0],[.5,0,.5,0]],['舉雙手',[2.9,.1,2.9,.1],[.1,0,.1,0]],['稻草人',[1.57,0,1.57,0],[0,0,0,0]],['蹲下',[.5,-1.2,.5,-1.2],[1.3,-2.3,1.3,-2.3]],
  ['單腳站',[1.2,.6,.3,-.8],[.05,0,1.5,-1.6]],['跳舞',[2.6,.4,1.0,-1.3],[.5,-.3,.15,.2]],['叉腰',[.9,-2.2,.9,-2.2],[.25,0,.25,0]],['抱頭',[2.6,-2.4,2.6,-2.4],[.2,.2,.2,.2]],['怪姿勢',[3.1,-1.5,1.7,1.4],[1.0,-1.9,.3,1.2]]];
function dollShape(c,p){ const A=POSES[p%POSES.length],lim=(x,y,sd,a1,a2,L1,L2,w)=>{ const x2=x+sd*Math.sin(a1)*L1,y2=y+Math.cos(a1)*L1,a=a1+a2; c.lineWidth=w; c.beginPath(); c.moveTo(x,y); c.lineTo(x2,y2); c.lineTo(x2+sd*Math.sin(a)*L2,y2+Math.cos(a)*L2); c.stroke(); };
  c.lineCap='round'; c.lineJoin='round'; c.beginPath(); c.ellipse(0,-4,15,22,0,0,TAU); c.fill(); c.beginPath(); c.arc(0,-40,15,0,TAU); c.fill();
  lim(-11,-18,-1,A[1][0],A[1][1],16,15,8); lim(11,-18,1,A[1][2],A[1][3],16,15,8); lim(-7,14,-1,A[2][0],A[2][1],18,18,10); lim(7,14,1,A[2][2],A[2][3],18,18,10); }
function newFig(o){ const f=Object.assign({x:W/2,y:H/2,s:.5,rot:0,fl:1,pose:0},o||{}); f.lay=document.createElement('canvas'); f.lay.width=f.lay.height=LP; const g=f.lay.getContext('2d'); g.fillStyle='#f6f6f6'; g.fillRect(0,0,LP,LP);
  g.fillStyle='#2a2a33'; for(const ex of [-5,5]){ g.beginPath(); g.arc((ex+HALF)*PXU,(-41+HALF)*PXU,2*PXU,0,TAU); g.fill(); } f.fc=document.createElement('canvas'); f.fc.width=f.fc.height=LP; f.mask=null; mkMask(f); return f; }
function mkMask(f){ if(!f.mask){ f.mask=document.createElement('canvas'); f.mask.width=f.mask.height=LP; } const g=f.mask.getContext('2d'); g.setTransform(1,0,0,1,0,0); g.clearRect(0,0,LP,LP); g.setTransform(PXU,0,0,PXU,HALF*PXU,HALF*PXU); g.fillStyle=g.strokeStyle='#000'; dollShape(g,f.pose); g.setTransform(1,0,0,1,0,0); f.md=g.getImageData(0,0,LP,LP).data; f.dirty=1; }
const TMP=document.createElement('canvas'); TMP.width=TMP.height=LP;
function build(f){ if(!f.dirty) return; f.dirty=0; const g=f.fc.getContext('2d'),t=TMP.getContext('2d'); g.clearRect(0,0,LP,LP);
  g.globalAlpha=.24; for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) g.drawImage(f.mask,dx,dy); g.globalAlpha=1; g.globalCompositeOperation='source-in'; g.fillStyle='#000'; g.fillRect(0,0,LP,LP); g.globalCompositeOperation='source-over';
  t.clearRect(0,0,LP,LP); t.drawImage(f.lay,0,0); t.globalCompositeOperation='destination-in'; t.drawImage(f.mask,0,0); t.globalCompositeOperation='source-over'; g.drawImage(TMP,0,0); }
function drawFig(c,f){ build(f); c.save(); c.translate(f.x,f.y); c.rotate(f.rot); c.scale(f.s*f.fl,f.s); c.drawImage(f.fc,-HALF,-HALF,LU,LU); c.restore(); }
function toLocal(f,sx,sy){ const dx=sx-f.x,dy=sy-f.y,cs=Math.cos(f.rot),sn=Math.sin(f.rot); return [((dx*cs+dy*sn)/f.s*f.fl+HALF)*PXU,((-dx*sn+dy*cs)/f.s+HALF)*PXU]; }
function toScene(f,px,py){ const lx=(px/PXU-HALF)*f.fl*f.s,ly=(py/PXU-HALF)*f.s,cs=Math.cos(f.rot),sn=Math.sin(f.rot); return [f.x+lx*cs-ly*sn,f.y+lx*sn+ly*cs]; }
function inFig(f,sx,sy,pad){ const [px,py]=toLocal(f,sx,sy); pad=pad||0; for(let dy=-pad;dy<=pad;dy+=Math.max(1,pad)) for(let dx=-pad;dx<=pad;dx+=Math.max(1,pad)){ const x=px+dx|0,y=py+dy|0; if(x>=0&&y>=0&&x<LP&&y<LP&&f.md[(y*LP+x)*4+3]>40) return true; } return false; }
// 電腦塗裝：照著背後的畫取色，關卡越後面越精細
function autoPaint(f,sd,ST,R,lazy){ const g=f.lay.getContext('2d'),im=g.createImageData(LP,LP),d=im.data,bs=lazy?40:ST.bs,nz=lazy?10:ST.noise,SW=W*2; let ar=0,ag=0,ab=0,an=0;
  const samp=(x,y)=>{ const ix=clamp(x*2|0,0,SW-1),iy=clamp(y*2|0,0,H*2-1),i=(iy*SW+ix)*4; return [sd[i],sd[i+1],sd[i+2]]; },bc={};
  for(let py=0;py<LP;py++) for(let px=0;px<LP;px++){ const o=(py*LP+px)*4; if(f.md[o+3]<20){ d[o+3]=0; continue; } const [sx,sy]=toScene(f,px,py),qx=Math.floor(sx/bs),qy=Math.floor(sy/bs),key=qx+','+qy;
    if(!bc[key]){ const s=samp((qx+.5)*bs,(qy+.5)*bs),n=(R()-.5)*nz; bc[key]=[s[0]+n,s[1]+n,s[2]+n]; } const q=bc[key]; d[o]=q[0]; d[o+1]=q[1]; d[o+2]=q[2]; d[o+3]=255; ar+=q[0]; ag+=q[1]; ab+=q[2]; an++; }
  if(lazy&&an){ for(let i=0;i<d.length;i+=4) if(d[i+3]){ d[i]=ar/an; d[i+1]=ag/an; d[i+2]=ab/an; } }
  g.putImageData(im,0,0); f.dirty=1; }
// 看起來多明顯：人偶顏色和背後畫面的差距
function visib(f,sd){ let s=0,n=0; const d=f.lay.getContext('2d').getImageData(0,0,LP,LP).data,SW=W*2;
  for(let py=0;py<LP;py+=3) for(let px=0;px<LP;px+=3){ const o=(py*LP+px)*4; if(f.md[o+3]<40) continue; const [sx,sy]=toScene(f,px,py),ix=clamp(sx*2|0,0,SW-1),iy=clamp(sy*2|0,0,H*2-1),i=(iy*SW+ix)*4;
    s+=Math.hypot(d[o]-sd[i],d[o+1]-sd[i+1],d[o+2]-sd[i+2]); n++; } return n?s/n/255:1; }
function figData(f){ return {x:r2(f.x),y:r2(f.y),s:r2(f.s),rot:r2(f.rot),fl:f.fl,pose:f.pose,img:f.lay.toDataURL('image/jpeg',.82)}; }
function figFrom(o){ const f=newFig(o); const im=new Image(); im.onload=()=>{ f.lay.getContext('2d').drawImage(im,0,0); f.dirty=1; }; im.src=o.img; return f; }

function create(env,opts){
  const net=opts.net,host=!!net&&net.host,client=!!net&&!net.host,me=net?net.me:0,pv=!!opts.preview,mode=net?'net':opts.mode||'hide',si=clamp(opts.stage|0,0,9),ST=STAGES[si];
  const {ctx:c,canvas}=env.canvas2d(W,H); canvas.style.touchAction='none'; const SC=scene(si,2),sd=SC.getContext('2d').getImageData(0,0,W*2,H*2).data,R=mul((Math.random()*1e9)|0);
  const N=net?net.count:2,names=net?net.names.map((n,i)=>n||('玩家 '+(i+1))):mode==='2p'?['1P','2P']:[opts.name||'你','電腦'];
  const sfx=n=>{ if(!pv) env.sfx(n); };
  let phase='intro',PT=pv?.5:2.2,t=0,ban=null,ended=false,me_=null,figs=[],marks=[],found={},seekT=0,ai=null,round=0,cover=null,result=null,sent=false,waitAll=false,sc=new Array(N).fill(0),seeker=0,hideDur=120,seekDur=mode==='seek'?60:45;
  let tool='move',brush=7,colA='#e8343a',colB='#3a6ae8',pat=0,undo=[],view={z:1,ox:0,oy:0},tbTop=false,drag=null,ptr={x:W/2,y:H/2};
  const say=(txt,col)=>{ ban={txt,col:col||'#ffd23f',t:0}; };
  const L=(x,y)=>[(x+view.ox)/view.z,(y+view.oy)/view.z];
  function zoomTo(z,cx,cy){ view.z=z; view.ox=clamp(cx*z-W/2,0,W*z-W); view.oy=clamp(cy*z-H/2,0,H*z-H); }
  // ---- 流程 ----
  function startHide(){ phase='hide'; PT=hideDur; me_=newFig({x:180+R()*440,y:150+R()*170,pose:0}); tool='move'; undo=[]; sent=false; waitAll=false; zoomTo(1,0,0); say(mode==='2p'?names[round===0?0:1]+' 來躲！（'+names[round===0?1:0]+' 先別看）':'躲進畫裡！換姿勢、用吸管取色塗裝'); sfx('go'); }
  function startSeek(list){ phase='seek'; if(mode==='net') seekDur=clamp(25+7*list.length,40,90); PT=seekDur; /* 連線：躲的人越多，找的時間越長 */ figs=list; marks=[]; found={}; seekT=0; zoomTo(1,0,0); tool='move';
    if(mode==='hide'){ const v=visib(figs[0],sd),k=ST.k,base=9*ST.eye/Math.max(.03,v)*(.5/Math.max(.25,figs[0].s))**.6*(.75+R()*.5); ai={T:base,x:W/2,y:H/2,tx:R()*W,ty:R()*H,nx:1.5,v}; }
    say(mode==='hide'?'電腦來找你了！撐過 '+seekDur+' 秒':iSeek()?'換你找！點一下抓人':names[seeker]+' 正在找…',iSeek()?'#7ae8ff':'#ffd23f'); sfx('beep'); }
  const iSeek=()=>mode==='seek'||(mode==='2p'&&phase==='seek')||(mode==='net'&&seeker===me);
  function finishHide(){ if(mode==='hide'){ startSeek([me_]); return; }
    if(mode==='2p'){ cover={txt:'換 '+names[round===0?1:0]+' 來找',sub:names[round===0?0:1]+' 已經躲好了，換人拿裝置',auto:5,fn:()=>{ cover=null; startSeek([me_]); }}; phase='cover'; return; }
    if(mode==='net'&&!sent){ sent=true; waitAll=true; const fd=figData(me_); fd.who=me; if(host) gotFig(fd); else { nFigs[me]=fd; net.send({fig:fd}); } } }
  function undoDone(){ if(mode!=='net'||!sent||phase!=='hide'||PT<=0) return; sent=false; waitAll=false; delete nFigs[me]; if(host) net.send({ru:me}); else net.send({un:me}); }
  function hostNet(){ return mode==='net'&&host; }
  const nFigs={}; function gotFig(fd){ nFigs[fd.who]=fd; if(host){ net.send({rf:fd}); checkAll(); } }
  function hiders(){ const a=[]; for(let i=0;i<N;i++) if(i!==seeker&&!(left[i])) a.push(i); return a; }
  const left={};
  function checkAll(){ if(phase!=='hide'&&phase!=='wait') return; if(hiders().every(i=>nFigs[i])){ net.send({ph:'seek'}); goSeekNet(); } }
  function goSeekNet(){ const list=hiders().filter(i=>nFigs[i]).map(i=>{ const f=figFrom(nFigs[i]); f.who=i; return f; }); startSeek(list); }
  function guess(x,y){ if(phase!=='seek'||!iSeek()) return; if(mode==='net'&&!host){ net.send({clk:[r2(x),r2(y)]}); return; } judge(x,y); }
  function judge(x,y){ let hit=-1; figs.forEach((f,i)=>{ if(hit<0&&!found[i]&&inFig(f,x,y,3)) hit=i; }); applyHit(x,y,hit,seekT); if(hostNet()) net.send({hit:[r2(x),r2(y),hit,r2(seekT)]}); }
  function applyHit(x,y,hit,at){ if(hit>=0){ found[hit]=at+.001; sfx('item'); marks.push({x,y,ok:1,t:0}); const f=figs[hit]; say((mode==='net'?names[f.who]:mode==='seek'?'找到了！':'找到了！')+(mode==='net'?' 被找到了！':''),'#7aff8a');
      if(hostNet()){ sc[seeker]++; } }
    else { marks.push({x,y,ok:0,t:0}); sfx('bump'); if(iSeek()&&mode!=='net') PT=Math.max(0,PT-2); }
    if(figs.every((f,i)=>found[i])) endSeek(); }
  function endSeek(){ if(phase!=='seek') return; phase='res'; PT=pv?2:4.5; sfx(mode==='hide'?(found[0]?'lose':'win'):figs.every((f,i)=>found[i])?'win':'lose');
    if(mode==='hide') result=!found[0]; else if(mode==='seek') result=figs.every((f,i)=>found[i]);
    else if(mode==='2p'){ sc[round===0?0:1]=found[0]?found[0]:seekDur+1; }
    else if(hostNet()){ figs.forEach((f,i)=>{ if(!found[i]) sc[f.who]+=2; }); net.send({ph:'res',sc}); }
    say(mode==='hide'?(found[0]?'被找到了！':'沒被找到，躲得好！'):mode==='seek'?(result?'全部找到！':'時間到…'):'公布答案',mode==='hide'&&found[0]?'#ff6a6a':'#ffd23f'); }
  function nextAfterRes(){ if(mode==='hide'||mode==='seek'){ conclude(); return; }
    if(mode==='2p'){ if(round===0){ round=1; cover={txt:'換 2P 來躲',sub:'1P 請先別看',auto:5,fn:()=>{ cover=null; startHide(); }}; phase='cover'; } else conclude(); return; }
    if(host){ round++; if(round>=N){ net.send({end:sc}); conclude(); return; } seeker=round%N; for(const k in nFigs) delete nFigs[k]; net.send({ph:'hide',r:round,sk:seeker}); startRoundNet(); } }
  function startRoundNet(){ for(const k in nFigs) delete nFigs[k]; if(seeker===me){ phase='wait'; PT=hideDur; say('這回合你來找！先等大家躲好','#7ae8ff'); } else startHide(); }
  function conclude(){ if(ended) return; ended=true; if(pv){ env.end({}); return; }
    if(mode==='hide'){ if(result) recWin('hide',si); env.end({title:result?'沒被找到！':'被找到了',big:result?'躲好躲滿':'撐了 '+Math.round(found[0]||0)+' 秒',text:ST.name+'：'+(result?'電腦找了 '+seekDur+' 秒都沒看到你。':'用吸管取背後的顏色、換個跟畫面一樣的姿勢會更難找。'),next:result&&si<9}); }
    else if(mode==='seek'){ const n=Object.keys(found).length; if(result) recWin('seek',si); env.end({title:result?'全部找到！':'還有人沒找到',big:n+' / '+figs.length,text:ST.name+(result?'：剩 '+Math.ceil(PT)+' 秒':'：亂點會扣 2 秒，仔細看顏色和邊緣。'),score:result?Math.ceil(PT)*10+n*50:null,next:result&&si<9}); }
    else if(mode==='2p'){ const a=sc[0],b=sc[1],w=a===b?-1:a>b?0:1; env.end({title:w<0?'平手':names[w]+' 贏了！',big:'1P '+(a>seekDur?'沒被找到':Math.round(a)+' 秒')+'　2P '+(b>seekDur?'沒被找到':Math.round(b)+' 秒'),text:'躲越久被找到的越厲害。'}); }
    else { const best=Math.max(...sc),w=sc.map((s,i)=>s===best?names[i]:null).filter(Boolean); env.end({title:w.join('、')+' 最會躲！',big:sc.map((s,i)=>names[i]+' '+s).join('　'),text:'找到一人 +1 分；沒被找到 +2 分。'}); } }
  // ---- 連線 ----
  if(net){
    net.onmsg=(m,from)=>{ if(m.fig&&host){ gotFig(m.fig); return; } if(m.rf&&!host){ nFigs[m.rf.who]=m.rf; return; } if(m.un!=null&&host){ if(phase==='hide'||phase==='wait'){ delete nFigs[m.un]; net.send({ru:m.un}); } return; } if(m.ru!=null&&!host){ if(m.ru!==me) delete nFigs[m.ru]; return; }
      if(m.clk&&host){ if(phase==='seek'&&from===seeker) judge(m.clk[0],m.clk[1]); return; }
      if(!host){ if(m.ph==='hide'){ round=m.r; seeker=m.sk; startRoundNet(); } else if(m.ph==='seek'){ goSeekNet(); } else if(m.hit){ seekT=m.hit[3]; applyHit(m.hit[0],m.hit[1],m.hit[2],m.hit[3]); } else if(m.ph==='res'){ sc=m.sc; endSeek(); } else if(m.end){ sc=m.end; conclude(); } } };
    net.onleave=i=>{ left[i]=1; if(host){ if(i===seeker&&phase==='seek'){ endSeek(); } else checkAll(); } };
  }
  // ---- 輸入：滑鼠／觸控都用畫布座標 ----
  const pos=e=>{ const r=canvas.getBoundingClientRect(),k=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*k)/2)/k,(e.clientY-r.top-(r.height-H*k)/2)/k]; };
  let BT=[]; const btn=(x,y,w,h,label,fn,o)=>BT.push(Object.assign({x,y,w,h,label,fn},o||{}));
  function snapUndo(){ const g=me_.lay.getContext('2d'); undo.push(g.getImageData(0,0,LP,LP)); if(undo.length>12) undo.shift(); }
  function paintAt(x,y,first){ const [px,py]=toLocal(me_,x,y),g=me_.lay.getContext('2d'),r=brush*PXU/me_.s*.5; g.fillStyle=colA; g.beginPath();
    if(!first&&drag&&drag.lp){ g.lineCap='round'; g.strokeStyle=colA; g.lineWidth=r*2; g.moveTo(drag.lp[0],drag.lp[1]); g.lineTo(px,py); g.stroke(); } g.arc(px,py,r,0,TAU); g.fill(); drag.lp=[px,py]; me_.dirty=1; }
  function pick(x,y){ const ix=clamp(x*2|0,0,W*2-1),iy=clamp(y*2|0,0,H*2-1),i=(iy*W*2+ix)*4; colB=colA; colA='rgb('+sd[i]+','+sd[i+1]+','+sd[i+2]+')'; sfx('pop'); tool='brush'; }
  function pattern(){ snapUndo(); pat=(pat+1)%4; const g=me_.lay.getContext('2d'); g.fillStyle=colB; g.fillRect(0,0,LP,LP); g.fillStyle=colA; const s=10*PXU;
    if(pat===0) for(let y=0;y<LP;y+=s*2) g.fillRect(0,y,LP,s); else if(pat===1) for(let y=0;y<LP;y+=s) for(let x=(y/s%2)*s/2;x<LP;x+=s){ g.beginPath(); g.arc(x,y,s*.3,0,TAU); g.fill(); }
    else if(pat===2) for(let y=0;y<LP;y+=s) for(let x=0;x<LP;x+=s){ if((x+y)/s%2<1) g.fillRect(x,y,s,s); } else { const r=mul(99); for(let k=0;k<40;k++){ g.beginPath(); g.ellipse(r()*LP,r()*LP,6+r()*14,4+r()*9,r()*3,0,TAU); g.fill(); } }
    me_.dirty=1; sfx('click'); }
  function onDown(e){ e.preventDefault(); const [x,y]=pos(e); ptr={x,y}; try{ canvas.setPointerCapture(e.pointerId); }catch(er){}
    if(cover){ sfx('click'); cover.fn(); return; }
    for(const b of BT) if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){ if(!b.dis){ b.fn(); if(!b.quiet) sfx('click'); } return; }
    const [sx,sy]=L(x,y);
    if(phase==='hide'&&!waitAll){ if(tool==='pick'){ pick(sx,sy); return; }
      if(tool==='brush'){ drag={k:'paint'}; snapUndo(); paintAt(sx,sy,true); return; }
      if(inFig(me_,sx,sy,6)){ drag={k:'fig',dx:sx-me_.x,dy:sy-me_.y}; return; } if(view.z>1) drag={k:'pan',x,y,ox:view.ox,oy:view.oy}; return; }
    if(phase==='seek'&&iSeek()){ drag={k:'tap',x,y,ox:view.ox,oy:view.oy,moved:false}; } }
  function onMove(e){ const [x,y]=pos(e); ptr={x,y}; if(!drag) return; const [sx,sy]=L(x,y);
    if(drag.k==='paint') paintAt(sx,sy,false); else if(drag.k==='fig'){ me_.x=clamp(sx-drag.dx,10,W-10); me_.y=clamp(sy-drag.dy,10,H-10); }
    else if(drag.k==='pan'||drag.k==='tap'){ if(Math.hypot(x-drag.x,y-drag.y)>8) drag.moved=true; if(view.z>1&&drag.moved){ view.ox=clamp(drag.ox-(x-drag.x),0,W*view.z-W); view.oy=clamp(drag.oy-(y-drag.y),0,H*view.z-H); } } }
  function onUp(e){ if(drag&&drag.k==='tap'&&!drag.moved){ const [sx,sy]=L(drag.x,drag.y); guess(sx,sy); } drag=null; }
  function onWheel(e){ if(phase!=='hide'&&!(phase==='seek'&&iSeek())) return; e.preventDefault(); const [x,y]=pos(e),[sx,sy]=L(x,y),z=clamp(view.z*(e.deltaY<0?1.25:.8),1,4); view.z=z; view.ox=clamp(sx*z-x,0,W*z-W); view.oy=clamp(sy*z-y,0,H*z-H); }
  if(!pv){ canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointermove',onMove); addEventListener('pointerup',onUp); canvas.addEventListener('wheel',onWheel,{passive:false}); }
  // ---- 每一格 ----
  function update(dt){ t+=dt; if(ban) ban.t+=dt; for(const m of marks) m.t+=dt; if(cover&&cover.auto!=null){ cover.auto-=dt; if(cover.auto<=0){ sfx('go'); cover.fn(); } } if(cover||ended) return;
    if(phase==='intro'){ PT-=dt; if(PT<=0){ if(pv){ demo(); return; } if(mode==='seek') aiHide(); else if(mode==='net'){ seeker=0; round=0; startRoundNet(); } else startHide(); } return; }
    if(phase==='hide'||phase==='wait'){ PT-=dt; if(PT<=0&&phase==='hide'&&!waitAll) finishHide(); if(phase==='wait'&&host&&PT<-6) { net.send({ph:'seek'}); goSeekNet(); } if(phase==='hide'&&waitAll&&host&&PT<-6){ net.send({ph:'seek'}); goSeekNet(); } return; }
    if(phase==='seek'){ seekT+=dt; if(mode!=='net'||host){ PT-=dt; if(PT<=0) endSeek(); } else PT-=dt;
      if(ai){ const f=figs[0]; ai.nx-=dt; if(seekT>ai.T*.75&&!found[0]){ ai.tx=f.x+(R()-.5)*40*Math.max(0,(ai.T-seekT)/ai.T*4); ai.ty=f.y+(R()-.5)*40*Math.max(0,(ai.T-seekT)/ai.T*4); }
        else if(ai.nx<=0){ ai.nx=1.6+R()*2; if(R()<.5){ judge(ai.x,ai.y); } ai.tx=R()*W; ai.ty=R()*H; }
        ai.x+=(ai.tx-ai.x)*Math.min(1,dt*2.5); ai.y+=(ai.ty-ai.y)*Math.min(1,dt*2.5); if(seekT>=ai.T&&!found[0]){ ai.x=f.x; ai.y=f.y; judge(f.x,f.y); if(!found[0]){ found[0]=seekT; endSeek(); } } }
      if(pv&&seekT>8) endSeek(); return; }
    if(phase==='res'){ PT-=dt; if(PT<=0){ if(pv){ conclude(); return; } if(mode==='net'&&!host) { PT=99; return; } nextAfterRes(); } } }
  function aiHide(){ const list=[]; for(let i=0;i<ST.nHide;i++){ let f,ok=false; for(let k=0;k<40&&!ok;k++){ f=newFig({x:50+R()*700,y:50+R()*350,s:.38+R()*.25,rot:(R()-.5)*(R()<.3?3:.6),fl:R()<.5?1:-1,pose:R()*POSES.length|0}); ok=list.every(g=>Math.hypot(g.x-f.x,g.y-f.y)>70); }
      autoPaint(f,sd,ST,R,i===0&&ST.k<.5); list.push(f); } startSeek(list); }
  function demo(){ aiHide(); }
  // ---- 畫面 ----
  function draw(){ BT=[]; c.save(); c.setTransform(2,0,0,2,0,0); c.fillStyle='#0b0a1c'; c.fillRect(0,0,W,H); c.save(); c.translate(-view.ox,-view.oy); c.scale(view.z,view.z); c.drawImage(SC,0,0,W,H);
    if(phase==='seek'||phase==='res') figs.forEach((f,i)=>{ const fd=found[i]!=null||phase==='res'; if(fd){ const b=found[i]!=null?Math.max(0,1-(seekT-found[i])*3):0; c.save(); c.translate(0,-Math.sin(b*Math.PI)*10); drawFig(c,f); c.restore(); } else drawFig(c,f);
      const mine=(mode==='net'&&f.who===me)||mode==='hide'; if(fd||mine){ c.strokeStyle=found[i]!=null?'#7aff8a':mine?'#ffd23f':'#ff6a6a'; c.lineWidth=2.5/view.z; c.setLineDash([6/view.z,4/view.z]); c.beginPath(); c.arc(f.x,f.y,f.s*55,0,TAU); c.stroke(); c.setLineDash([]);
        const lb=mode==='net'?names[f.who]:mode==='hide'?'你':(found[i]!=null?'找到':'在這裡'); c.font='900 '+(13/view.z)+'px '+TC; c.textAlign='center'; c.lineWidth=4/view.z; c.strokeStyle='#14122b'; c.strokeText(lb,f.x,f.y-f.s*58); c.fillStyle='#fff'; c.fillText(lb,f.x,f.y-f.s*58); } });
    if(phase==='hide'&&me_){ drawFig(c,me_); c.strokeStyle='rgba(255,255,255,.75)'; c.lineWidth=1.5/view.z; c.setLineDash([5/view.z,4/view.z]); c.beginPath(); c.arc(me_.x,me_.y,me_.s*60,0,TAU); c.stroke(); c.setLineDash([]); }
    for(const m of marks){ if(m.t>1.4) continue; const a=1-m.t/1.4; c.globalAlpha=a; c.lineWidth=4/view.z; c.strokeStyle=m.ok?'#7aff8a':'#ff4d5a'; const r=12/view.z; c.beginPath(); if(m.ok){ c.arc(m.x,m.y,r+m.t*20,0,TAU); } else { c.moveTo(m.x-r,m.y-r); c.lineTo(m.x+r,m.y+r); c.moveTo(m.x+r,m.y-r); c.lineTo(m.x-r,m.y+r); } c.stroke(); c.globalAlpha=1; }
    if(ai&&phase==='seek'){ c.strokeStyle='#14122b'; c.lineWidth=5; c.beginPath(); c.arc(ai.x,ai.y,16,0,TAU); c.moveTo(ai.x+12,ai.y+12); c.lineTo(ai.x+26,ai.y+26); c.stroke(); c.strokeStyle='#fff'; c.lineWidth=2.5; c.beginPath(); c.arc(ai.x,ai.y,16,0,TAU); c.moveTo(ai.x+12,ai.y+12); c.lineTo(ai.x+26,ai.y+26); c.stroke(); }
    c.restore(); hud(); c.restore(); }
  const B=(x,y,w,h,label,fn,o)=>{ o=o||{}; btn(x,y,w,h,label,fn,o); c.fillStyle=o.on?'#ffd23f':o.dis?'rgba(40,40,60,.7)':'rgba(20,18,43,.88)'; rrect(c,x,y,w,h,7); c.fill(); c.strokeStyle=o.on?'#fff':'rgba(255,255,255,.35)'; c.lineWidth=1.5; c.stroke();
    if(o.sw){ c.fillStyle=o.sw; rrect(c,x+5,y+5,w-10,h-10,5); c.fill(); c.strokeStyle='#fff'; c.stroke(); return; } c.fillStyle=o.on?'#14122b':'#fff'; c.font='800 '+(o.fs||12)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(label,x+w/2,y+h/2+1); };
  function topBar(txt,col){ c.fillStyle='rgba(10,10,28,.78)'; rrect(c,W/2-180,6,360,26,8); c.fill(); c.fillStyle=col||'#fff'; c.font='900 13px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(txt,W/2,20); }
  function hud(){ const tm=Math.max(0,Math.ceil(PT));
    const doneN=()=>hiders().filter(i=>nFigs[i]).length+'/'+hiders().length;
    if(phase==='hide'){ if(waitAll){ topBar('已完成！等其他人… 已完成 '+doneN()+'　剩 '+tm+' 秒','#7ae8ff'); B(W/2-110,H-50,220,40,'☑ 已完成（點一下取消、繼續畫）',undoDone,{on:true,fs:13}); return; }
      const y0=tbTop?38:H-80,bw=48,gap=4,row=(i,j)=>[8+j*(bw+gap),y0+i*38]; topBar('躲藏 '+(tm>=60?Math.floor(tm/60)+' 分 '+(tm%60)+' 秒':tm+' 秒')+'　｜　'+(tool==='move'?'拖曳人偶移動':tool==='brush'?'在人偶上塗色（滾輪可放大）':'點畫面取顏色'),tm<=10?'#ff6a6a':'#fff');
      const r1=[['◀姿勢',()=>{ me_.pose=(me_.pose+POSES.length-1)%POSES.length; mkMask(me_); }],['姿勢▶',()=>{ me_.pose=(me_.pose+1)%POSES.length; mkMask(me_); }],['↺ 轉',()=>{ me_.rot-=Math.PI/12; }],['↻ 轉',()=>{ me_.rot+=Math.PI/12; }],['縮小',()=>{ me_.s=clamp(me_.s-.05,.3,.85); }],['放大',()=>{ me_.s=clamp(me_.s+.05,.3,.85); }],['翻面',()=>{ me_.fl*=-1; }],[view.z>1?'看全圖':'放大鏡',()=>{ if(view.z>1) zoomTo(1,0,0); else zoomTo(3,me_.x,me_.y); }],['⇅',()=>{ tbTop=!tbTop; }]];
      r1.forEach(([l,f],j)=>{ const [x,y]=row(0,j); B(x,y,bw,32,l,f,{fs:11}); }); const [gx,gy]=row(0,r1.length); B(gx,gy,W-gx-8,32,'☐ 勾選已完成'+(mode==='net'?'（'+doneN()+'）':''),()=>finishHide(),{on:true,fs:13});
      const r2=[['移動',()=>{ tool='move'; },tool==='move'],['畫筆',()=>{ tool='brush'; },tool==='brush'],['吸管',()=>{ tool='pick'; },tool==='pick'],['粗細 '+(brush<6?'細':brush<10?'中':'粗'),()=>{ brush=brush<6?8:brush<10?14:4; }],['塗滿',()=>{ snapUndo(); const g=me_.lay.getContext('2d'); g.fillStyle=colA; g.fillRect(0,0,LP,LP); me_.dirty=1; }],['花紋',pattern],['復原',()=>{ if(undo.length){ me_.lay.getContext('2d').putImageData(undo.pop(),0,0); me_.dirty=1; } },false,!undo.length]];
      r2.forEach(([l,f,on,dis],j)=>{ const [x,y]=row(1,j); B(x,y,bw,32,l,f,{on,dis,fs:11}); }); let [sx,sy]=row(1,r2.length); B(sx,sy,40,32,'',()=>{ tool='brush'; },{sw:colA}); B(sx+44,sy,40,32,'',()=>{ const q=colA; colA=colB; colB=q; },{sw:colB});
      c.fillStyle='rgba(255,255,255,.75)'; c.font='700 10px '+TC; c.textAlign='left'; c.fillText('←目前顏色　點右邊互換',sx+90,sy+17); }
    else if(phase==='wait'){ c.fillStyle='rgba(10,10,28,.55)'; c.fillRect(0,0,W,H); topBar('大家正在躲… 已完成 '+doneN()+'　最多 '+tm+' 秒後換你找','#7ae8ff'); }
    else if(phase==='seek'){ const n=Object.keys(found).length; topBar((iSeek()?'找出藏起來的人偶！點一下抓':mode==='hide'?'電腦正在找你…':'看 '+names[seeker]+' 找人')+'　'+tm+' 秒　找到 '+n+' / '+figs.length,tm<=10?'#ff6a6a':'#fff');
      if(iSeek()) B(W-96,H-40,88,32,view.z>1?'看全圖':'放大鏡',()=>{ if(view.z>1) zoomTo(1,0,0); else zoomTo(2.2,ptr.x,ptr.y); }); }
    else if(phase==='res') topBar(mode==='net'?'分數：'+sc.map((s,i)=>names[i]+' '+s).join('　'):'答案揭曉','#ffd23f');
    else if(phase==='intro'){ c.fillStyle='rgba(10,10,28,.45)'; c.fillRect(0,0,W,H); }
    if(cover){ c.fillStyle='rgba(10,10,28,.96)'; c.fillRect(0,0,W,H); c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 34px '+TC; c.fillText(cover.txt,W/2,H/2-20); c.fillStyle='#fff'; c.font='700 15px '+TC; c.fillText(cover.sub,W/2,H/2+24); if(cover.auto!=null){ c.fillStyle='#7ae8ff'; c.font='900 18px '+TC; c.fillText(Math.ceil(cover.auto)+' 秒後自動開始（點一下馬上開始）',W/2,H/2+62); } }
    if(ban&&ban.t<2.2&&!cover){ const u=Math.min(1,ban.t*6),s=1+(1-u)*.6; c.save(); c.translate(W/2,H*.38); c.scale(s,s); c.globalAlpha=Math.min(1,(2.2-ban.t)*3); c.textAlign='center'; c.textBaseline='middle'; c.font='900 28px '+TC; c.lineWidth=7; c.strokeStyle='#14122b'; c.strokeText(ban.txt,0,0); c.fillStyle=ban.col; c.fillText(ban.txt,0,0); c.restore(); c.globalAlpha=1; } }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('pointermove',onMove); removeEventListener('pointerup',onUp); canvas.removeEventListener('wheel',onWheel); },
    _dbg:{get phase(){return phase;},get me(){return me_;},get figs(){return figs;},get found(){return found;},get ai(){return ai;},get sc(){return sc;},finishHide,undoDone,judge,guess,sd,set PT(v){PT=v;},get PT(){return PT;},autoPaint:()=>autoPaint(me_,sd,STAGES[9],R,false),get cover(){return cover;},visib:()=>visib(me_,sd)}};
}
// 開始畫面／關卡圖：畫＋兩個人偶（一個白的、一個藏起來的）
const SHOWF={};
function stageShow(ctx,w,h,si,t){ const S=scene(si,1); ctx.drawImage(S,0,0,w,h); const k=w/W;
  if(!SHOWF[si]){ const sd=scene(si,2).getContext('2d').getImageData(0,0,W*2,H*2).data,R=mul(si+5); const a=newFig({x:250,y:250,s:.6,pose:6}),b=newFig({x:560,y:230,s:.55,pose:1,rot:.3}); autoPaint(b,sd,STAGES[si],R,false); SHOWF[si]=[a,b]; }
  const [a,b]=SHOWF[si]; ctx.save(); ctx.scale(k,k); a.y=250+Math.sin(t*3)*6; drawFig(ctx,a); drawFig(ctx,b); const p=(Math.sin(t*1.5)+1)/2; ctx.strokeStyle='rgba(255,255,255,'+(.3+p*.6)+')'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(b.x,b.y,30+p*6,0,TAU); ctx.stroke();
  ctx.font='900 16px '+TC; ctx.textAlign='center'; ctx.lineWidth=5; ctx.strokeStyle='#14122b'; ctx.strokeText('躲在這裡！',b.x,b.y-44); ctx.fillStyle='#ffd23f'; ctx.fillText('躲在這裡！',b.x,b.y-44); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).hide={name:'塗裝躲躲樂',tag:'PAINT & HIDE',color:'#ff7eb6',online:true,maxPlayers:12,
  desc:'白色小人偶躲進一幅畫裡！換個奇葩姿勢、用吸管從畫裡取色塗裝，把自己變成背景的一部分；時間到換人來找，看誰的眼力最好、誰躲得最心機。可以自己躲給電腦找、找電腦躲的人偶、兩人輪流，或 2～12 人連線。',
  goal:'躲藏最多 2 分鐘，畫好可以先勾選「已完成」（連線要每個人都勾選才會提早開始；時間到就照目前畫的樣子直接開始找）。躲的人：時間內沒被找到就贏。找的人：在時間內把所有人偶找出來（亂點會扣 2 秒）。',
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),stageLabel:'選擇畫作',
  stageGoal:i=>STAGES[i].name+'：我來躲＝電腦來找你（越後面眼力越好）；我來找＝電腦躲了 '+STAGES[i].nHide+' 個人偶（越後面塗得越像）。',
  modes:[{id:'hide',label:'我來躲'},{id:'seek',label:'我來找'},{id:'2p',label:'雙人輪流'}],
  help:[['拖曳','移動人偶（滾輪放大縮小）'],['姿勢／轉／大小／翻面','擺出跟畫面融合的姿勢'],['吸管→畫筆','點畫面取色，在人偶上塗'],['塗滿／花紋','整隻換顏色、兩色條紋點點格子迷彩'],['找的時候','點一下抓人，亂點扣 2 秒']],
  touchHelp:[['拖曳','移動人偶'],['姿勢／轉／大小','擺出融入畫面的姿勢'],['吸管→畫筆','點畫面取色，在人偶上塗'],['放大鏡','放大來塗細節'],['找的時候','點一下抓人']],
  hubBest:()=>{ let n=0; for(let i=0;i<10;i++) n+=(hasWin('hide',i)?1:0)+(hasWin('seek',i)?1:0); return n?'過關 <b>'+n+' / 20</b>':'尚無紀錄'; },
  stageBest:i=>(hasWin('hide',i)?'躲 ★':'')+(hasWin('seek',i)?' 找 ★':''),
  livePreview:false,stageShow,thumb:(ctx,w,h,t)=>stageShow(ctx,w,h,Math.floor(t/5)%10,t),create};
})();
