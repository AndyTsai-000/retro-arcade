// 塗裝躲躲樂（3D）：白色小人偶躲進 3D 大空間。躲的人換位置、擺姿勢、用吸管或調色盤塗裝，把自己變成場景的一部分；
// 找的人用第一人稱在場景裡走動把大家揪出來。4 回合（兩邊各躲兩次、找兩次）。單人對電腦、雙人輪流、連線 2～12 人分兩隊。下面 30 幅畫是各場景牆壁與道具的材質（後 20 個是醫院、倉庫、廠房等室內空間）。
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
// ---------- 20 個室內場景（醫院、倉庫、廠房…）：牆面的畫 ----------
const PH={
  base(c,R,h,s,l,n){ c.fillStyle=hsl(h,s,l); c.fillRect(0,0,W,H); for(let i=0;i<(n||1600);i++){ c.fillStyle='rgba('+(R()<.5?'0,0,0':'255,255,255')+','+(R()*.05)+')'; c.fillRect(R()*W,R()*H,2+R()*4,2+R()*4); } },
  tiles(c,R,x0,y0,x1,y1,sz,h,s,l,gr){ c.fillStyle=gr; c.fillRect(x0,y0,x1-x0,y1-y0); for(let y=y0;y<y1;y+=sz) for(let x=x0;x<x1;x+=sz){ c.fillStyle=hsl(h,s,l+(R()-.5)*4); c.fillRect(x+1,y+1,Math.min(sz,x1-x)-2,Math.min(sz,y1-y)-2); } },
  sub(c,R,x0,y0,x1,y1,w,h,col,gr){ c.fillStyle=gr; c.fillRect(x0,y0,x1-x0,y1-y0); for(let y=y0,r=0;y<y1;y+=h,r++) for(let x=x0-(r%2)*w/2;x<x1;x+=w){ c.fillStyle=col; rrect(c,x+1,y+1,w-2,h-2,2); c.fill(); c.fillStyle='rgba(255,255,255,.35)'; c.fillRect(x+3,y+2,w-8,2); } },
  sign(c,x,y,w,h,bg,fg,t,fs){ c.fillStyle='rgba(0,0,0,.25)'; rrect(c,x+3,y+3,w,h,5); c.fill(); c.fillStyle=bg; rrect(c,x,y,w,h,5); c.fill(); c.fillStyle=fg; c.font='900 '+(fs||Math.round(h*.55))+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(t,x+w/2,y+h/2+1); c.textAlign='left'; c.textBaseline='alphabetic'; },
  win(c,x,y,w,h,top,bot,blind){ c.fillStyle='#e8ecef'; c.fillRect(x-6,y-6,w+12,h+12); const g=c.createLinearGradient(0,y,0,y+h); g.addColorStop(0,top||'#8cc8f0'); g.addColorStop(1,bot||'#e0f0fa'); c.fillStyle=g; c.fillRect(x,y,w,h); c.fillStyle='rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(x+w*.15,y); c.lineTo(x+w*.35,y); c.lineTo(x+w*.1,y+h); c.lineTo(x,y+h); c.lineTo(x,y+h*.6); c.fill();
    if(blind) for(let yy=y;yy<y+h*blind;yy+=7){ c.fillStyle='#f4f4f0'; c.fillRect(x,yy,w,5); c.fillStyle='rgba(0,0,0,.1)'; c.fillRect(x,yy+5,w,1); }
    c.fillStyle='#d0d6da'; c.fillRect(x+w/2-3,y,6,h); c.fillRect(x,y+h/2-3,w,6); },
  door(c,x,y,w,h,col,win2){ c.fillStyle='rgba(0,0,0,.25)'; c.fillRect(x-6,y-6,w+12,h+6); c.fillStyle=col; c.fillRect(x,y,w,h); c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(x+6,y+6,w-12,h*.4); c.fillStyle='rgba(0,0,0,.12)'; c.fillRect(x+6,y+h*.5,w-12,h*.45);
    if(win2){ c.fillStyle='#bcdcec'; c.fillRect(x+w*.3,y+h*.12,w*.4,h*.25); } c.fillStyle='#c8ccd0'; c.fillRect(x+w-18,y+h*.52,12,5); },
  poster(c,R,x,y,w,h,t){ const hu=R()*360; c.fillStyle='rgba(0,0,0,.25)'; c.fillRect(x+3,y+3,w,h); c.fillStyle=hsl(hu,60,85); c.fillRect(x,y,w,h); c.fillStyle=hsl(hu,70,45); c.fillRect(x,y,w,h*.22);
    for(let k=0;k<4;k++){ c.fillStyle=hsl(hu+60+k*50,70,55); c.beginPath(); c.arc(x+w*(.25+R()*.5),y+h*(.4+R()*.35),w*(.08+R()*.14),0,TAU); c.fill(); }
    if(t){ c.fillStyle='#fff'; c.font='900 '+Math.round(h*.13)+'px '+TC; c.textAlign='center'; c.fillText(t,x+w/2,y+h*.16); c.textAlign='left'; } },
  boxes(c,R,x0,x1,yb,hm){ for(let x=x0;x<x1-20;){ const w=40+R()*40,h=30+R()*(hm||40); c.fillStyle=hsl(30+R()*8,40+R()*15,52+R()*12); c.fillRect(x,yb-h,w,h); c.fillStyle='rgba(0,0,0,.15)'; c.fillRect(x,yb-h,w,3); c.fillStyle='rgba(210,180,120,.9)'; c.fillRect(x+w/2-5,yb-h,10,h); if(R()<.6){ c.fillStyle='#fff'; c.fillRect(x+6,yb-h+10,w*.35,h*.25); }
      c.strokeStyle='rgba(60,40,20,.35)'; c.lineWidth=1; c.strokeRect(x+.5,yb-h+.5,w-1,h-1); x+=w+2; } },
  hazard(c,x,y,w,h){ c.save(); c.beginPath(); c.rect(x,y,w,h); c.clip(); c.fillStyle='#f4c430'; c.fillRect(x,y,w,h); c.fillStyle='#222'; for(let k=-h;k<w;k+=28){ c.beginPath(); c.moveTo(x+k,y+h); c.lineTo(x+k+14,y+h); c.lineTo(x+k+14+h,y); c.lineTo(x+k+h,y); c.fill(); } c.restore(); },
  pipe(c,x1,y1,x2,y2,r,col){ const g=x1===x2?c.createLinearGradient(x1-r,0,x1+r,0):c.createLinearGradient(0,y1-r,0,y1+r); g.addColorStop(0,'rgba(0,0,0,.35)'); g.addColorStop(.35,col); g.addColorStop(.5,'rgba(255,255,255,.55)'); g.addColorStop(.65,col); g.addColorStop(1,'rgba(0,0,0,.45)'); c.fillStyle=g;
    if(x1===x2) c.fillRect(x1-r,Math.min(y1,y2),r*2,Math.abs(y2-y1)); else c.fillRect(Math.min(x1,x2),y1-r,Math.abs(x2-x1),r*2); },
  lamp(c,x,y,w){ const g=c.createRadialGradient(x+w/2,y,0,x+w/2,y,w); g.addColorStop(0,'rgba(255,255,240,.45)'); g.addColorStop(1,'rgba(255,255,240,0)'); c.fillStyle=g; c.fillRect(x-w/2,y-w/2,w*2,w*1.5); c.fillStyle='#fffef4'; rrect(c,x,y-4,w,8,4); c.fill(); },
  clock(c,x,y,r){ c.fillStyle='#333'; c.beginPath(); c.arc(x,y,r+3,0,TAU); c.fill(); c.fillStyle='#fff'; c.beginPath(); c.arc(x,y,r,0,TAU); c.fill(); c.strokeStyle='#222'; c.lineWidth=3; c.beginPath(); c.moveTo(x,y); c.lineTo(x+r*.5,y-r*.3); c.moveTo(x,y); c.lineTo(x,y-r*.75); c.stroke(); for(let k=0;k<12;k++){ c.fillStyle='#222'; c.fillRect(x+Math.cos(k*TAU/12)*r*.82-1,y+Math.sin(k*TAU/12)*r*.82-1,3,3); } },
  shelfRow(c,R,x0,x1,y,h,item){ c.fillStyle='#d8d8d8'; c.fillRect(x0,y,x1-x0,6); c.fillStyle='#a0a4a8'; c.fillRect(x0,y+6,x1-x0,4); for(let x=x0+4;x<x1-14;){ const w=item(x,y,h); x+=w+2; } },
  frame(c,x,y,w,h,fr,fill){ c.fillStyle='rgba(0,0,0,.3)'; c.fillRect(x+4,y+4,w,h); c.fillStyle=fr; c.fillRect(x,y,w,h); fill(x+6,y+6,w-12,h-12); }
};
const SCENES2=[
 ['醫院病房',(c,R)=>{ PH.base(c,R,170,25,90); PH.tiles(c,R,0,250,W,H,30,165,30,80,'#c8d8d4'); c.fillStyle='#8ab0a8'; c.fillRect(0,244,W,8); c.fillStyle='#d8e0e4'; c.fillRect(0,232,W,10); c.fillStyle='#a8b4bc'; c.fillRect(0,241,W,3);
   PH.win(c,500,50,200,140,'#a8d8f8','#eef8ff',.35); c.fillStyle='#c0c8cc'; c.fillRect(0,18,W,5); for(let k=0;k<22;k++){ c.fillStyle=k%2?'#7ab8d8':'#8ac8e4'; c.fillRect(30+k*12,22,13,210); } c.fillStyle='rgba(0,0,0,.08)'; for(let k=0;k<22;k+=2) c.fillRect(30+k*12,22,4,210);
   c.fillStyle='#e8ecef'; rrect(c,340,110,120,50,4); c.fill(); for(let k=0;k<4;k++){ c.fillStyle=['#2a8a3a','#2a5ae8','#e8e8e8','#e8a030'][k]; c.beginPath(); c.arc(360+k*27,135,8,0,TAU); c.fill(); }
   PH.sign(c,350,60,100,34,'#2a6ab8','#fff','病房 302',18); PH.poster(c,R,730,70,60,84,'勤洗手'); PH.sign(c,40,270,90,30,'#e8443a','#fff','急診 ➜',16); c.fillStyle='#1a1a1a'; rrect(c,200,270,100,70,6); c.fill(); c.strokeStyle='#3aff6a'; c.lineWidth=2; c.beginPath(); for(let x=0;x<90;x++) c.lineTo(205+x,305-(x%30<4?(x%30)*8:x%30<7?-12:0)); c.stroke(); }],
 ['倉庫',(c,R)=>{ for(let x=0;x<W;x+=16){ const g=c.createLinearGradient(x,0,x+16,0); g.addColorStop(0,'#7a8a96'); g.addColorStop(.5,'#a8b4be'); g.addColorStop(1,'#6a7884'); c.fillStyle=g; c.fillRect(x,0,16,H); }
   for(const rx of [20,420]){ c.fillStyle='#e8701a'; for(const u of [0,180,360]) c.fillRect(rx+u,40,12,H-60); for(const y of [140,250,360]){ c.fillStyle='#2a5ab8'; c.fillRect(rx,y,372,12); PH.boxes(c,R,rx+14,rx+366,y,60); } }
   PH.hazard(c,0,H-24,W,24); PH.sign(c,330,8,140,30,'#ffd23f','#222','倉儲區 B',18); PH.sign(c,40,8,110,26,'#2a8a3a','#fff','安全通道',15); }],
 ['工廠廠房',(c,R)=>{ PH.base(c,R,210,6,58,2600); for(let y=0;y<H;y+=60){ c.fillStyle='rgba(0,0,0,.12)'; c.fillRect(0,y,W,2); }
   for(let k=0;k<6;k++){ PH.win(c,20+k*135,14,110,50,'#c8dce8','#eef4f8'); }
   PH.pipe(c,0,100,W,100,14,'#3a8a4a'); PH.pipe(c,0,135,W,135,9,'#d8a020'); PH.pipe(c,160,100,160,H,12,'#3a8a4a'); PH.pipe(c,620,135,620,H,9,'#d8a020');
   for(const [x,y] of [[160,190],[620,240]]){ c.strokeStyle='#c8202a'; c.lineWidth=5; c.beginPath(); c.arc(x,y,20,0,TAU); c.stroke(); c.beginPath(); c.moveTo(x-20,y); c.lineTo(x+20,y); c.moveTo(x,y-20); c.lineTo(x,y+20); c.stroke(); }
   c.fillStyle='#4a5a6a'; rrect(c,300,190,180,150,6); c.fill(); for(let k=0;k<12;k++){ c.fillStyle=['#3aff6a','#ff4a3a','#ffd23f'][k%3]; c.beginPath(); c.arc(320+(k%6)*28,215+(k/6|0)*24,6,0,TAU); c.fill(); } c.fillStyle='#1a2a3a'; c.fillRect(320,270,140,50); c.fillStyle='#5af'; c.font='700 14px monospace'; c.fillText('RPM 1450',330,300);
   PH.sign(c,200,180,80,60,'#ffd23f','#222','⚠',40); PH.sign(c,680,180,100,30,'#e8443a','#fff','高壓危險',16); PH.sign(c,40,200,100,30,'#2a6ab8','#fff','注意安全',16); PH.hazard(c,0,H-26,W,26); }],
 ['辦公室',(c,R)=>{ PH.base(c,R,40,12,88); c.fillStyle='#b8b0a4'; c.fillRect(0,H-30,W,30); PH.win(c,30,40,230,190,'#9ad0f4','#e8f6ff',.55); PH.win(c,560,40,200,190,'#9ad0f4','#e8f6ff',.4);
   c.fillStyle='#bcc4c8'; c.fillRect(290,60,240,150); c.fillStyle='#fff'; c.fillRect(296,66,228,138); c.strokeStyle='#2a5ae8'; c.lineWidth=3; c.beginPath(); c.moveTo(310,180); c.lineTo(350,140); c.lineTo(390,160); c.lineTo(440,100); c.lineTo(500,110); c.stroke(); c.fillStyle='#e8443a'; c.font='700 16px '+TC; c.fillText('第三季目標',320,92);
   c.fillStyle='#c89a5a'; c.fillRect(300,240,150,110); for(let k=0;k<10;k++){ c.fillStyle=['#ffd23f','#ff9ab0','#9ae0ff','#b0ff9a'][k%4]; c.save(); c.translate(312+(k%4)*34,254+(k/4|0)*32); c.rotate((R()-.5)*.2); c.fillRect(0,0,26,24); c.restore(); }
   PH.clock(c,520,280,26); PH.sign(c,600,250,120,32,'#3a3a44','#fff','會議室 A',17); }],
 ['教室',(c,R)=>{ PH.base(c,R,48,45,86); c.fillStyle='#a8743a'; c.fillRect(0,300,W,H-300); for(let x=0;x<W;x+=40){ c.fillStyle='rgba(0,0,0,.12)'; c.fillRect(x,300,2,H-300); } c.fillStyle='#7a4e2a'; c.fillRect(0,296,W,8);
   c.fillStyle='#7a5a3a'; c.fillRect(150,50,500,200); c.fillStyle='#2a5a3a'; c.fillRect(160,60,480,180); c.fillStyle='rgba(255,255,255,.85)'; c.font='700 26px '+TC; c.fillText('今天：躲貓貓大賽',190,110); c.font='700 20px '+TC; c.fillText('1 + 1 = 2　　ㄅㄆㄇㄈ',190,160); c.fillText('值日生：小明',460,220); c.fillStyle='#fff'; c.fillRect(200,244,30,6);
   PH.clock(c,400,28,18); for(let k=0;k<6;k++){ const x=k<3?10+k*45:670+(k-3)*42,y=90+(k%2)*90; c.fillStyle='#fff'; c.fillRect(x,y,38,50); c.fillStyle=hsl(R()*360,70,60); c.beginPath(); c.arc(x+19,y+22,12,0,TAU); c.fill(); c.fillStyle=hsl(R()*360,70,45); c.fillRect(x+6,y+38,26,6); } }],
 ['圖書館',(c,R)=>{ c.fillStyle='#e8dcc4'; c.fillRect(0,0,W,H); for(let s=0;s<5;s++){ const y=40+s*82; c.fillStyle='#c8a070'; c.fillRect(0,y+70,W,10);
     for(let x=6;x<W;){ const w=10+R()*16,h=46+R()*22,hu=[0,210,30,120,280,45][R()*6|0]; c.fillStyle=hsl(hu,40+R()*30,30+R()*35); c.fillRect(x,y+70-h,w,h); c.fillStyle='rgba(255,240,200,.6)'; c.fillRect(x+2,y+70-h+8,w-4,3); c.fillRect(x+2,y+64,w-4,3); x+=w+1+(R()<.05?20:0); } }
   for(let k=0;k<5;k++) c.fillStyle='#a8784a', c.fillRect(k*200-4,0,10,H); PH.sign(c,300,6,200,30,'#3a5a3a','#fff','請保持安靜',17); PH.sign(c,40,8,70,24,'#a8784a','#fff','文學',14); PH.sign(c,690,8,70,24,'#a8784a','#fff','歷史',14); }],
 ['超市',(c,R)=>{ PH.base(c,R,0,0,96); PH.sign(c,0,0,W,40,'#e8303a','#fff','零食 ・ 飲料 ・ 泡麵',22);
   for(let s=0;s<4;s++){ const y=110+s*86; PH.shelfRow(c,R,0,W,y,70,(x,yy)=>{ const w=18+R()*24,h=36+R()*30,hu=R()*360,k=R()*3|0; if(k===0){ c.fillStyle=hsl(hu,75,50); c.fillRect(x,yy-h,w,h); c.fillStyle='#fff'; c.fillRect(x+3,yy-h*.6,w-6,h*.25); }
       else if(k===1){ c.fillStyle=hsl(hu,70,45,.85); rrect(c,x,yy-h,w*.7,h,5); c.fill(); c.fillStyle=hsl(hu,70,30); c.fillRect(x+w*.2,yy-h-6,w*.3,8); c.fillStyle='#fff'; c.fillRect(x+2,yy-h*.55,w*.7-4,h*.2); }
       else { c.fillStyle=hsl(hu,80,55); rrect(c,x,yy-h*.7,w,h*.7,4); c.fill(); c.fillStyle='rgba(255,255,255,.4)'; c.fillRect(x+3,yy-h*.6,w-6,4); } return w*(k===1?.75:1); });
     for(let x=20;x<W;x+=120){ c.fillStyle='#ffe23a'; c.fillRect(x,y+10,44,16); c.fillStyle='#c8202a'; c.font='900 12px '+TC; c.fillText('$'+(19+(R()*80|0)),x+6,y+23); } } }],
 ['餐廳廚房',(c,R)=>{ PH.sub(c,R,0,0,W,H,48,22,'#f4f6f6','#c8cccc'); c.fillStyle='#b8bec4'; c.fillRect(0,260,W,H-260); for(let x=0;x<W;x+=4){ c.fillStyle='rgba(255,255,255,'+(R()*.18)+')'; c.fillRect(x,260,2,H-260); } c.fillStyle='#8a9096'; c.fillRect(0,256,W,8);
   c.fillStyle='#9aa0a6'; c.beginPath(); c.moveTo(250,0); c.lineTo(550,0); c.lineTo(600,90); c.lineTo(200,90); c.fill(); c.fillStyle='#6a7076'; c.fillRect(200,88,400,10);
   c.fillStyle='#444'; c.fillRect(40,120,160,6); for(let k=0;k<4;k++){ const x=60+k*36; c.strokeStyle='#666'; c.lineWidth=2; c.beginPath(); c.moveTo(x,126); c.lineTo(x,146); c.stroke(); c.fillStyle=['#b8bec4','#c8783a','#2a2a2a','#b8bec4'][k]; c.beginPath(); c.arc(x,160,14+k%2*4,0,Math.PI); c.fill(); c.fillRect(x-16-k%2*4,146,32+k%2*8,14); }
   for(let k=0;k<2;k++){ c.fillStyle='#a8743a'; c.fillRect(620,110+k*70,160,8); for(let j=0;j<6;j++){ c.fillStyle=hsl(R()*60,60,40+R()*30,.9); rrect(c,628+j*25,110+k*70-40,20,40,4); c.fill(); c.fillStyle='#fff'; c.fillRect(630+j*25,110+k*70-26,16,10); } }
   PH.sign(c,330,140,140,34,'#ffd23f','#222','小心地滑',18); }],
 ['健身房',(c,R)=>{ PH.base(c,R,220,8,26); for(let k=0;k<4;k++){ const x=20+k*195; c.fillStyle='#9aa8b4'; c.fillRect(x,40,180,250); const g=c.createLinearGradient(x,40,x+180,290); g.addColorStop(0,'#c8d8e4'); g.addColorStop(.5,'#8a9ca8'); g.addColorStop(1,'#d8e4ec'); c.fillStyle=g; c.fillRect(x+4,44,172,242); }
   c.fillStyle='#ffd23f'; c.font='900 34px '+TC; c.fillText('堅持就是勝利',270,30); c.fillStyle='#3a3a3a'; c.fillRect(0,320,W,14);
   for(let k=0;k<10;k++){ const x=40+k*76; c.fillStyle='#1a1a1a'; c.fillRect(x,346,50,10); for(const s of [0,40]){ c.fillStyle=k%3?'#2a2a2a':'#c8202a'; c.fillRect(x+s-2,336,14,30); } c.fillStyle='#888'; c.fillRect(x,349,50,4); }
   c.fillStyle='#e8443a'; c.fillRect(0,H-20,W,20); }],
 ['地下停車場',(c,R)=>{ PH.base(c,R,40,5,62,3000); c.fillStyle='#f4c430'; c.fillRect(0,160,W,40); c.fillStyle='#2a2a2a'; c.font='900 32px Arial'; for(let k=0;k<4;k++) c.fillText('B2',40+k*200,192);
   PH.pipe(c,0,30,W,30,12,'#c8c8c8'); PH.pipe(c,0,60,W,60,7,'#c83a2a'); PH.hazard(c,0,H-40,W,40);
   for(let k=0;k<3;k++){ PH.sign(c,120+k*250,230,70,70,'#2a5ab8','#fff','P',48); } c.fillStyle='#fff'; for(let k=0;k<3;k++){ const x=240+k*250,y=270; c.beginPath(); c.moveTo(x,y-14); c.lineTo(x+30,y); c.lineTo(x,y+14); c.fill(); c.fillRect(x-30,y-6,30,12); }
   PH.sign(c,330,90,140,36,'#2a8a3a','#fff','出口 EXIT',18); }],
 ['洗衣店',(c,R)=>{ PH.tiles(c,R,0,0,W,H,40,200,60,78,'#a8c8e0'); PH.sign(c,240,8,320,40,'#2a6ab8','#fff','自助洗衣 24H',24);
   for(let r=0;r<2;r++) for(let k=0;k<6;k++){ const x=20+k*130,y=70+r*180; c.fillStyle='rgba(0,0,0,.2)'; rrect(c,x+4,y+4,116,160,8); c.fill(); c.fillStyle='#f4f6f8'; rrect(c,x,y,116,160,8); c.fill(); c.fillStyle='#d8dde2'; c.fillRect(x,y,116,26); c.fillStyle='#2a2a2a'; c.fillRect(x+70,y+8,36,10); c.fillStyle='#3aff6a'; c.font='700 9px monospace'; c.fillText('0'+(k+1)+':'+(10+r*20),x+72,y+16);
     c.fillStyle='#9aa4ac'; c.beginPath(); c.arc(x+58,y+92,44,0,TAU); c.fill(); const g=c.createRadialGradient(x+50,y+84,4,x+58,y+92,36); g.addColorStop(0,'#cfe8f8'); g.addColorStop(1,'#3a6a8a'); c.fillStyle=g; c.beginPath(); c.arc(x+58,y+92,34,0,TAU); c.fill(); if(R()<.6){ c.fillStyle=hsl(R()*360,60,60,.8); c.beginPath(); c.arc(x+58,y+104,22,Math.PI*.1,Math.PI*.9); c.fill(); } } }],
 ['電影院',(c,R)=>{ for(let x=0;x<W;x+=24){ const g=c.createLinearGradient(x,0,x+24,0); g.addColorStop(0,'#5a0a14'); g.addColorStop(.5,'#9a1a2a'); g.addColorStop(1,'#4a0810'); c.fillStyle=g; c.fillRect(x,0,24,H); }
   for(let k=0;k<4;k++){ const x=40+k*200; const g=c.createRadialGradient(x+60,120,0,x+60,120,90); g.addColorStop(0,'rgba(255,220,150,.55)'); g.addColorStop(1,'rgba(255,200,120,0)'); c.fillStyle=g; c.fillRect(x-30,30,180,180); c.fillStyle='#d8a040'; c.beginPath(); c.moveTo(x+45,120); c.lineTo(x+75,120); c.lineTo(x+68,140); c.lineTo(x+52,140); c.fill(); }
   for(let k=0;k<3;k++) PH.frame(c,90+k*230,180,140,200,'#d8a040',(x,y,w,h)=>{ const hu=R()*360,g=c.createLinearGradient(0,y,0,y+h); g.addColorStop(0,hsl(hu,60,20)); g.addColorStop(1,hsl(hu+40,70,45)); c.fillStyle=g; c.fillRect(x,y,w,h); c.fillStyle=hsl(hu+180,80,60); c.beginPath(); c.arc(x+w/2,y+h*.45,w*.25,0,TAU); c.fill(); c.fillStyle='#fff'; c.font='900 16px '+TC; c.textAlign='center'; c.fillText(['宇宙大冒險','怪獸來了','追夢少年'][k],x+w/2,y+h-18); c.textAlign='left'; });
   PH.sign(c,700,20,80,30,'#1a8a3a','#fff','EXIT',18); }],
 ['博物館',(c,R)=>{ PH.base(c,R,38,30,84); c.fillStyle='#8a6a4a'; c.fillRect(0,H-28,W,28); c.fillStyle='#c8b090'; c.fillRect(0,40,W,6);
   PH.frame(c,30,90,200,150,'#a8843a',(x,y,w,h)=>{ c.fillStyle='#e8d8b0'; c.fillRect(x,y,w,h); c.strokeStyle='#7a5a3a'; c.lineWidth=5; c.lineCap='round'; c.beginPath(); c.moveTo(x+20,y+h-30); c.quadraticCurveTo(x+w*.4,y+20,x+w*.6,y+60); c.quadraticCurveTo(x+w*.8,y+90,x+w-10,y+30); c.stroke(); for(let k=0;k<7;k++){ c.beginPath(); c.moveTo(x+50+k*16,y+60+k*4); c.lineTo(x+46+k*16,y+100+k*2); c.stroke(); } });
   PH.frame(c,300,70,200,190,'#3a3a3a',(x,y,w,h)=>{ c.fillStyle='#d8ccb0'; c.fillRect(x,y,w,h); c.fillStyle='#8a5a2a'; c.beginPath(); c.ellipse(x+w/2,y+h*.6,50,62,0,0,TAU); c.fill(); c.fillStyle='#5a3a1a'; c.fillRect(x+w/2-32,y+h*.6-60,64,12); c.strokeStyle='#d8a040'; c.lineWidth=3; c.beginPath(); c.ellipse(x+w/2,y+h*.6,40,50,0,0,TAU); c.stroke(); });
   PH.frame(c,570,90,200,150,'#a8843a',(x,y,w,h)=>{ c.fillStyle='#2a3a5a'; c.fillRect(x,y,w,h); for(let k=0;k<60;k++){ c.fillStyle='#fff'; c.fillRect(x+R()*w,y+R()*h,2,2); } c.fillStyle='#f4d890'; c.beginPath(); c.arc(x+w*.7,y+h*.3,20,0,TAU); c.fill(); });
   for(const x of [80,380,620]) PH.sign(c,x,280,100,26,'#3a3a3a','#e8d8b0','館藏 No.'+(10+(R()*80|0)),13); }],
 ['捷運站',(c,R)=>{ PH.tiles(c,R,0,0,W,H,26,0,0,94,'#c8ccd0'); c.fillStyle='#2a8ad8'; c.fillRect(0,150,W,36); c.fillStyle='#fff'; c.font='900 26px '+TC; c.fillText('中央站　Central',40,178); c.fillText('中央站　Central',440,178);
   c.fillStyle='#e8eef2'; c.fillRect(300,220,200,130); c.strokeStyle='#e8443a'; c.lineWidth=5; c.beginPath(); c.moveTo(310,330); c.lineTo(380,250); c.lineTo(490,250); c.stroke(); c.strokeStyle='#2a8ad8'; c.beginPath(); c.moveTo(310,240); c.lineTo(400,300); c.lineTo(490,330); c.stroke(); c.strokeStyle='#3aa84a'; c.beginPath(); c.moveTo(400,225); c.lineTo(400,345); c.stroke(); for(const [x,y] of [[380,250],[400,300],[400,250]]){ c.fillStyle='#fff'; c.beginPath(); c.arc(x,y,6,0,TAU); c.fill(); c.strokeStyle='#222'; c.lineWidth=2; c.stroke(); }
   PH.frame(c,30,210,220,140,'#222',(x,y,w,h)=>{ const g=c.createLinearGradient(x,y,x+w,y+h); g.addColorStop(0,'#ff8a3a'); g.addColorStop(1,'#ffd23f'); c.fillStyle=g; c.fillRect(x,y,w,h); c.fillStyle='#fff'; c.font='900 24px '+TC; c.fillText('夏日特賣',x+40,y+60); c.font='700 16px '+TC; c.fillText('全館 5 折起',x+50,y+95); });
   PH.frame(c,550,210,220,140,'#222',(x,y,w,h)=>{ c.fillStyle='#2a3a8a'; c.fillRect(x,y,w,h); c.fillStyle='#9af'; c.beginPath(); c.arc(x+60,y+70,40,0,TAU); c.fill(); c.fillStyle='#fff'; c.font='900 20px '+TC; c.fillText('新手機上市',x+105,y+76); }); PH.sign(c,330,20,140,34,'#ffd23f','#222','往 機場 ➜',17); }],
 ['臥室',(c,R)=>{ PH.base(c,R,200,40,86); for(let y=0;y<H;y+=36) for(let x=(y/36%2)*18;x<W;x+=36){ c.fillStyle='rgba(255,255,255,.65)'; c.beginPath(); for(let p=0;p<5;p++){ c.ellipse(x+Math.cos(p*TAU/5)*5,y+Math.sin(p*TAU/5)*5,4,4,0,0,TAU); } c.fill(); c.fillStyle='#ffd23f'; c.beginPath(); c.arc(x,y,2.5,0,TAU); c.fill(); }
   PH.win(c,300,50,200,160,'#ffd8a8','#ffe8c8'); for(const sx of [0,1]){ c.fillStyle='#e87a9a'; c.beginPath(); c.moveTo(sx?520:280,40); c.lineTo(sx?470:330,40); c.quadraticCurveTo(sx?490:310,140,sx?500:300,240); c.lineTo(sx?530:270,240); c.fill(); } c.fillStyle='#c8a070'; c.fillRect(260,34,280,8);
   PH.poster(c,R,60,70,110,150,'STAR'); PH.poster(c,R,630,90,110,90,'');
   c.fillStyle='#fff'; c.fillRect(600,230,160,8); for(let k=0;k<5;k++){ c.fillStyle=hsl(R()*360,70,60); c.beginPath(); c.arc(620+k*30,214,14,0,TAU); c.fill(); c.fillStyle='#222'; c.fillRect(615+k*30,210,3,3); c.fillRect(623+k*30,210,3,3); } c.fillStyle='#e8d0b0'; c.fillRect(0,H-26,W,26); }],
 ['客廳',(c,R)=>{ PH.base(c,R,35,40,80); for(let x=0;x<W;x+=50){ c.fillStyle='rgba(160,110,60,.12)'; c.fillRect(x,0,25,H); }
   c.fillStyle='#5a3a22'; c.fillRect(220,280,360,70); c.fillStyle='#1a1a1a'; c.fillRect(250,120,300,160); const g=c.createLinearGradient(256,126,544,274); g.addColorStop(0,'#2a5a8a'); g.addColorStop(1,'#3aa86a'); c.fillStyle=g; c.fillRect(256,126,288,148); c.fillStyle='#ffd23f'; c.beginPath(); c.arc(470,170,22,0,TAU); c.fill(); c.fillStyle='#2a6a3a'; c.beginPath(); c.moveTo(256,274); c.lineTo(340,200); c.lineTo(420,274); c.fill();
   for(let k=0;k<4;k++){ const x=30+(k%2)*90,y=70+(k>>1)*100; PH.frame(c,x,y,76,86,'#7a5a3a',(xx,yy,w,h)=>{ c.fillStyle=hsl(190+R()*40,40,75); c.fillRect(xx,yy,w,h); c.fillStyle=hsl(R()*40,40,60); for(let p=0;p<2+(R()*2|0);p++){ c.beginPath(); c.arc(xx+12+p*16,yy+h-30,7,0,TAU); c.fill(); c.fillRect(xx+6+p*16,yy+h-22,12,20); } }); }
   c.fillStyle='#3a7a3a'; for(let k=0;k<9;k++){ c.beginPath(); c.ellipse(690+Math.cos(k)*30,230+Math.sin(k*1.7)*40,14,30,k,0,TAU); c.fill(); } c.fillStyle='#c8783a'; c.fillRect(665,270,50,70); c.fillStyle='#e8d8b0'; c.fillRect(0,H-26,W,26); }],
 ['咖啡廳',(c,R)=>{ c.fillStyle='#6a5a50'; c.fillRect(0,0,W,H); for(let y=0;y<H;y+=24) for(let x=(y/24%2)*30-30;x<W;x+=60){ c.fillStyle=hsl(14+R()*12,45,34+R()*14); c.fillRect(x+2,y+2,56,20); }
   PH.frame(c,260,40,280,200,'#5a3a22',(x,y,w,h)=>{ c.fillStyle='#1e2a24'; c.fillRect(x,y,w,h); c.fillStyle='#fff'; c.font='900 24px '+TC; c.fillText('今日咖啡',x+80,y+36); c.font='600 17px '+TC; ['美式　　　 60','拿鐵　　　 80','卡布奇諾　 85','焦糖瑪奇朵 95'].forEach((t,i)=>c.fillText(t,x+40,y+76+i*30)); c.strokeStyle='rgba(255,255,255,.6)'; c.lineWidth=2; c.beginPath(); c.arc(x+240,y+160,14,0,Math.PI); c.stroke(); });
   for(const x of [100,700]){ c.strokeStyle='#222'; c.lineWidth=2; c.beginPath(); c.moveTo(x,0); c.lineTo(x,70); c.stroke(); c.fillStyle='#2a2a2a'; c.beginPath(); c.moveTo(x-30,100); c.lineTo(x+30,100); c.lineTo(x+12,70); c.lineTo(x-12,70); c.fill(); const g=c.createRadialGradient(x,110,0,x,110,90); g.addColorStop(0,'rgba(255,210,140,.6)'); g.addColorStop(1,'rgba(255,190,120,0)'); c.fillStyle=g; c.fillRect(x-90,100,180,120); }
   for(let s=0;s<2;s++){ c.fillStyle='#8a5a34'; c.fillRect(20+s*600,300,160,8); for(let k=0;k<5;k++){ c.fillStyle=k%2?'#f4f0e8':'#d8603a'; rrect(c,28+s*600+k*30,276,22,24,3); c.fill(); } } }],
 ['美髮院',(c,R)=>{ PH.base(c,R,330,40,90); for(let k=0;k<3;k++){ const x=60+k*250; c.fillStyle='#e8d8c8'; rrect(c,x-14,30,190,260,10); c.fill(); const g=c.createLinearGradient(x,44,x+162,276); g.addColorStop(0,'#dce8f0'); g.addColorStop(.5,'#a8bcc8'); g.addColorStop(1,'#e8f0f4'); c.fillStyle=g; rrect(c,x,44,162,232,6); c.fill();
     for(let j=0;j<8;j++){ c.fillStyle='#fffbe0'; c.beginPath(); c.arc(x-6,52+j*30,5,0,TAU); c.arc(x+168,52+j*30,5,0,TAU); c.fill(); } c.fillStyle='#8a6a5a'; c.fillRect(x-10,300,182,10); for(let j=0;j<5;j++){ c.fillStyle=hsl(R()*360,60,55); rrect(c,x+j*32,276,18,24,4); c.fill(); } }
   PH.sign(c,280,330,240,40,'#2a2a2a','#ffd8e8','髮型工作室',22); c.fillStyle='#d8c8b8'; c.fillRect(0,H-26,W,26); }],
 ['體育館',(c,R)=>{ PH.base(c,R,215,55,52); c.fillStyle='#c8904a'; c.fillRect(0,300,W,H-300); for(let x=0;x<W;x+=30){ c.fillStyle='rgba(0,0,0,.12)'; c.fillRect(x,300,2,H-300); }
   c.fillStyle='#1a1a1a'; rrect(c,300,40,200,90,6); c.fill(); c.fillStyle='#ff4a3a'; c.font='900 40px monospace'; c.fillText('56',318,100); c.fillStyle='#ffd23f'; c.fillText('48',420,100); c.fillStyle='#fff'; c.font='700 14px '+TC; c.fillText('主隊　　客隊',345,58);
   c.fillStyle='#fff'; c.fillRect(350,160,100,70); c.strokeStyle='#e8443a'; c.lineWidth=3; c.strokeRect(375,190,50,34); c.strokeStyle='#ff7a1a'; c.lineWidth=4; c.beginPath(); c.ellipse(400,236,26,7,0,0,TAU); c.stroke(); c.strokeStyle='#eee'; c.lineWidth=1; for(let k=0;k<6;k++){ c.beginPath(); c.moveTo(378+k*9,238); c.lineTo(386+k*6,270); c.stroke(); }
   for(let k=0;k<4;k++){ const x=k<2?30+k*120:560+(k-2)*120; c.fillStyle=['#e8443a','#ffd23f','#3aa84a','#fff'][k]; c.beginPath(); c.moveTo(x,60); c.lineTo(x+100,60); c.lineTo(x+100,200); c.lineTo(x+50,230); c.lineTo(x,200); c.fill(); c.fillStyle=k===3?'#2a5ab8':'#fff'; c.font='900 22px '+TC; c.fillText(['冠軍','加油','第一','衝啊'][k],x+28,140); } }],
 ['機場候機室',(c,R)=>{ c.fillStyle='#d8dce0'; c.fillRect(0,0,W,H); const g=c.createLinearGradient(0,40,0,330); g.addColorStop(0,'#7ab8e8'); g.addColorStop(1,'#d8ecf8'); c.fillStyle=g; c.fillRect(0,40,W,290); c.fillStyle='#8a9a8a'; c.fillRect(0,260,W,70); c.fillStyle='#fff'; for(let x=0;x<W;x+=60) c.fillRect(x,292,34,4);
   c.fillStyle='#f4f6f8'; c.beginPath(); c.ellipse(420,230,170,22,0,0,TAU); c.fill(); c.beginPath(); c.moveTo(420,220); c.lineTo(330,160); c.lineTo(360,160); c.lineTo(470,222); c.fill(); c.beginPath(); c.moveTo(560,226); c.lineTo(590,170); c.lineTo(610,170); c.lineTo(590,228); c.fill(); c.fillStyle='#2a5ab8'; c.fillRect(270,226,300,5); for(let k=0;k<14;k++){ c.fillStyle='#2a3a4a'; c.fillRect(320+k*14,222,6,5); }
   for(let x=0;x<=W;x+=100){ c.fillStyle='#a8b0b8'; c.fillRect(x-4,40,8,290); } c.fillStyle='#a8b0b8'; c.fillRect(0,36,W,8); c.fillRect(0,326,W,8);
   c.fillStyle='#1a1a22'; rrect(c,560,350,220,90,6); c.fill(); c.fillStyle='#ffd23f'; c.font='700 15px monospace'; ['BR 211  12:30  A12','CI 064  13:05  A08','JL 802  13:40  A15'].forEach((t,i)=>c.fillText(t,572,375+i*24)); PH.sign(c,40,360,150,36,'#ffd23f','#222','登機門 A12',17); }]
];
SCENES.push(...SCENES2);
const SCN={};
function scene(i,S){ const key=i+':'+S; if(SCN[key]) return SCN[key]; const cv=document.createElement('canvas'); cv.width=W*S; cv.height=H*S; const c=cv.getContext('2d'); c.scale(S,S); SCENES[i][1](c,mul(i*7919+11)); SCN[key]=cv; return cv; }

// ---------- 3D 場景：每一關一個可以走動的大空間，牆壁、地板、道具都用上面的畫和花紋當材質 ----------
const THREE_URL='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
function load(){ const K=window.ARCADE_GAMES&&window.ARCADE_GAMES.kart; if(window.THREE) return Promise.resolve(); if(K&&K.load) return K.load();
  return new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=THREE_URL; s.onload=()=>res(); s.onerror=()=>{ s.remove(); rej(new Error('three')); }; document.head.appendChild(s); }); }
const TEXC={};
function texCanvas(spec){ const key=JSON.stringify(spec); if(TEXC[key]) return TEXC[key]; let cv;
  if(spec[0]==='p'){ cv=scene(spec[1],.8); }
  else { cv=document.createElement('canvas'); cv.width=cv.height=256; const c=cv.getContext('2d'),R=mul(key.length*131+key.charCodeAt(2)*7); const k=spec[0];
    if(k==='chk'){ const n=spec[3]||8,s=256/n; for(let y=0;y<n;y++) for(let x=0;x<n;x++){ c.fillStyle=(x+y)%2?spec[1]:spec[2]; c.fillRect(x*s,y*s,s,s); } }
    else if(k==='str'){ const n=spec[3]||8,s=256/n; for(let i=0;i<n;i++){ c.fillStyle=i%2?spec[1]:spec[2]; if(spec[4]) c.fillRect(0,i*s,256,s); else c.fillRect(i*s,0,s,256); } }
    else if(k==='dot'){ c.fillStyle=spec[1]; c.fillRect(0,0,256,256); for(let i=0;i<90;i++){ c.fillStyle=spec[2][i%spec[2].length]; c.beginPath(); c.arc(R()*256,R()*256,spec[3]||10,0,TAU); c.fill(); } }
    else if(k==='wood'){ c.fillStyle=spec[1]; c.fillRect(0,0,256,256); for(let i=0;i<40;i++){ c.strokeStyle='rgba(60,30,10,'+(.08+R()*.15)+')'; c.lineWidth=1+R()*3; const y=R()*256; c.beginPath(); c.moveTo(0,y); c.bezierCurveTo(80,y+R()*10-5,170,y+R()*10-5,256,y); c.stroke(); } for(let i=0;i<4;i++){ c.fillStyle='rgba(0,0,0,.18)'; c.fillRect(0,i*64,256,2); } }
    else if(k==='grass'){ c.fillStyle='#4e9a34'; c.fillRect(0,0,256,256); for(let i=0;i<2600;i++){ c.fillStyle=hsl(85+R()*40,55,25+R()*30); c.fillRect(R()*256,R()*256,2,4+R()*5); } for(let i=0;i<40;i++){ c.fillStyle=hsl([0,50,300,200][i%4],85,65); c.beginPath(); c.arc(R()*256,R()*256,3,0,TAU); c.fill(); } }
    else if(k==='sand'){ c.fillStyle='#f0d898'; c.fillRect(0,0,256,256); for(let i=0;i<3000;i++){ c.fillStyle=hsl(38+R()*10,45,55+R()*30,.8); c.fillRect(R()*256,R()*256,2,2); } }
    else if(k==='brick'){ c.fillStyle='#6a5a50'; c.fillRect(0,0,256,256); for(let y=0;y<256;y+=32) for(let x=(y/32%2)*32-32;x<256;x+=64){ c.fillStyle=hsl(spec[1]+R()*14,45,35+R()*15); c.fillRect(x+2,y+2,60,28); } }
    else if(k==='noise'){ c.fillStyle=spec[1]; c.fillRect(0,0,256,256); for(let i=0;i<2500;i++){ c.fillStyle='rgba('+(R()<.5?'0,0,0':'255,255,255')+','+(R()*.12)+')'; c.fillRect(R()*256,R()*256,3,3); } }
    else if(k==='sol'){ c.fillStyle=spec[1]; c.fillRect(0,0,256,256); }
    else if(k==='metal'){ c.fillStyle=spec[1]||'#b8bec6'; c.fillRect(0,0,256,256); for(let i=0;i<260;i++){ c.fillStyle='rgba('+(R()<.5?'0,0,0':'255,255,255')+','+(R()*.1)+')'; c.fillRect(0,R()*256,256,1); } }
    else if(k==='tile'){ const n=spec[3]||6,s=256/n; c.fillStyle=spec[2]; c.fillRect(0,0,256,256); for(let y=0;y<n;y++) for(let x=0;x<n;x++){ c.fillStyle=spec[1]; c.fillRect(x*s+2,y*s+2,s-4,s-4); c.fillStyle='rgba(255,255,255,'+(R()*.12)+')'; c.fillRect(x*s+2,y*s+2,s-4,s-4); } }
    else if(k==='conc'){ c.fillStyle=spec[1]||'#8a8c8e'; c.fillRect(0,0,256,256); for(let i=0;i<60;i++){ const x=R()*256,y=R()*256,r=10+R()*30,g=c.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,'rgba(0,0,0,'+(R()*.1)+')'); g.addColorStop(1,'rgba(0,0,0,0)'); c.fillStyle=g; c.fillRect(x-r,y-r,r*2,r*2); } for(let i=0;i<2500;i++){ c.fillStyle='rgba('+(R()<.5?'0,0,0':'255,255,255')+','+(R()*.1)+')'; c.fillRect(R()*256,R()*256,2,2); } if(spec[2]){ c.fillStyle=spec[2]; c.fillRect(0,120,256,14); } }
    else if(k==='carpet'){ c.fillStyle=spec[1]; c.fillRect(0,0,256,256); for(let i=0;i<5000;i++){ c.fillStyle='rgba('+(R()<.5?'0,0,0':'255,255,255')+','+(R()*.12)+')'; c.fillRect(R()*256,R()*256,1.5,1.5); } if(spec[2]) for(let y=0;y<256;y+=32) for(let x=(y/32%2)*16;x<256;x+=32){ c.fillStyle=spec[2]; c.beginPath(); c.arc(x,y,4,0,TAU); c.fill(); } }
    else if(k==='box'){ c.fillStyle='#c8955a'; c.fillRect(0,0,256,256); for(let i=0;i<1200;i++){ c.fillStyle='rgba(90,50,20,'+(R()*.1)+')'; c.fillRect(R()*256,R()*256,3,1); } c.fillStyle='rgba(225,195,140,.9)'; c.fillRect(110,0,36,256); c.fillStyle='#fff'; c.fillRect(20,170,70,46); c.fillStyle='#333'; for(let i=0;i<5;i++) c.fillRect(26,178+i*7,40+R()*20,3); c.strokeStyle='#333'; c.lineWidth=3; c.beginPath(); c.moveTo(200,40); c.lineTo(200,70); c.moveTo(190,50); c.lineTo(200,40); c.lineTo(210,50); c.stroke(); }
    else if(k==='lock'){ c.fillStyle=spec[1]; c.fillRect(0,0,256,256); for(let i=0;i<3;i++){ const x=i*85; c.fillStyle='rgba(0,0,0,.35)'; c.fillRect(x,0,3,256); c.fillStyle='rgba(255,255,255,.15)'; c.fillRect(x+4,0,3,256); for(let v=0;v<6;v++){ c.fillStyle='rgba(0,0,0,.35)'; c.fillRect(x+25,18+v*9,36,4); } c.fillStyle='#d8d8d8'; c.fillRect(x+66,120,8,26); } }
    else if(k==='panel'){ c.fillStyle='#4a5a6a'; c.fillRect(0,0,256,256); c.fillStyle='#1a2a3a'; c.fillRect(30,30,196,80); c.fillStyle='#5af'; c.font='700 26px monospace'; c.fillText('READY',70,82); for(let i=0;i<12;i++){ c.fillStyle=['#3aff6a','#ff4a3a','#ffd23f','#ddd'][i%4]; c.beginPath(); c.arc(50+(i%6)*32,150+(i/6|0)*40,11,0,TAU); c.fill(); } }
    else if(k==='fab'){ c.fillStyle=spec[1]; c.fillRect(0,0,256,256); for(let i=0;i<256;i+=4){ c.fillStyle='rgba(0,0,0,.06)'; c.fillRect(0,i,256,2); c.fillStyle='rgba(255,255,255,.05)'; c.fillRect(i,0,2,256); } }
    else if(k==='leaf'){ c.fillStyle='#2e6a2a'; c.fillRect(0,0,256,256); for(let i=0;i<500;i++){ c.fillStyle=hsl(95+R()*40,50,25+R()*30); c.beginPath(); c.ellipse(R()*256,R()*256,10,5,R()*TAU,0,TAU); c.fill(); } } }
  TEXC[key]=cv; return cv; }
const IMGD=new Map(); function pixAt(cv,u,v){ let d=IMGD.get(cv); if(!d){ d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data; IMGD.set(cv,d); } u=((u%1)+1)%1; v=((v%1)+1)%1; const x=Math.min(cv.width-1,u*cv.width|0),y=Math.min(cv.height-1,(1-v)*cv.height|0),i=(y*cv.width+x)*4; return [d[i],d[i+1],d[i+2]]; }
const PK=['#ff5d8f','#ffd23f','#5ac8e8','#7ae05a','#b983ff','#ff9f45'];
/* 30 個空間：out＝戶外（沒有牆、遠處有背景板）；floor／walls／tex＝材質；kinds＝道具種類；dens＝道具密度 */
const THEMES=[
  {floor:['chk','#ff9cc4','#ffe0ee',8],fr:5,walls:[['p',0],['p',4]],tex:[['p',0],['str','#ff8ab8','#fff',8],['dot','#fff',PK,9],['chk','#ffe06a','#5ac8e8',6],['p',4]],kinds:['shelf','crate','barrel','ball','table','shelf'],dens:.62,hemi:['#fff4f8','#e8b8c8'],sun:1},
  {floor:['noise','#5a5a62'],fr:6,walls:[['p',1]],tex:[['p',1],['brick',8],['str','#ffd23f','#222',6,1],['noise','#7a6a5a']],kinds:['crate','barrel','panel','crate','pillar'],dens:.55,hemi:['#dde8ff','#6a5a50'],sun:.9},
  {out:1,floor:['grass'],fr:6,walls:[['p',2]],tex:[['p',2],['grass'],['wood','#a8743a']],kinds:['bush','bush','table','barrel','panel','ball'],dens:.6,hemi:['#d8f0ff','#4e7a34'],sun:1.1,sky:['#7ac8f8','#d8f0ff']},
  {floor:['wood','#b8844a'],fr:5,walls:[['p',3]],tex:[['p',3],['wood','#a8743a'],['str','#e8443a','#fff',8],['p',3]],kinds:['crate','table','barrel','crate','shelf'],dens:.62,hemi:['#fff8e8','#a8743a'],sun:1},
  {floor:['chk','#5ac8e8','#ffe06a',8],fr:5,walls:[['p',4]],tex:[['p',4],['chk','#ff5d8f','#fff',6],['dot','#5ac8e8',PK,12],['str','#7ae05a','#ffd23f',6]],kinds:['ball','crate','shelf','panel','ball','barrel'],dens:.6,hemi:['#ffffff','#c8b8e8'],sun:1},
  {floor:['wood','#6a4024'],fr:5,walls:[['p',5]],tex:[['p',5],['wood','#7a4e2c'],['p',5]],kinds:['shelf','shelf','table','crate'],dens:.6,hemi:['#fff0d8','#5a3a22'],sun:.85},
  {out:1,floor:['sand'],fr:6,walls:[['p',6]],tex:[['p',6],['sand'],['str','#e8343a','#fff',6],['str','#2a7ae8','#fff',6]],kinds:['umbrella','ball','crate','panel','umbrella'],dens:.5,hemi:['#e0f4ff','#d8c088'],sun:1.15,sky:['#5ab4f0','#d8f0ff']},
  {floor:['p',7],fr:4,walls:[['p',7]],tex:[['p',7],['chk','#c8c0b0','#8a8478',6],['p',7]],kinds:['panel','pillar','crate','panel','ball'],dens:.55,hemi:['#f4f0e8','#9a9080'],sun:1},
  {out:1,night:1,floor:['noise','#2a2030'],fr:6,walls:[['p',8]],tex:[['p',8],['str','#e8303a','#fff',6],['noise','#3a2a3e']],kinds:['stall','crate','barrel','panel','stall'],dens:.55,hemi:['#a890d8','#3a1a3e'],sun:.5,sky:['#14102e','#3a1a3e']},
  {floor:['p',9],fr:4,walls:[['p',9]],tex:[['p',9],['p',9],['chk','#a8c8e0','#d8e8f0',6]],kinds:['panel','pillar','ball','panel','crate'],dens:.55,hemi:['#f0f8ff','#a8c0d0'],sun:1}];
const M=(c)=>['metal',c];
THEMES.push(
  {floor:['tile','#dfe6ea','#b8c4cc',6],fr:6,walls:[['p',10]],ceil:'#f4f6f8',tex:[['sol','#f4f6f8'],['fab','#8ac8e4'],M('#c8ced4'),['fab','#e8f0f4'],['p',10]],kinds:['bed','bed','cart','locker','plant','seats','bed'],dens:.6,hemi:['#f4fbff','#a8b8c0'],sun:1},
  {floor:['conc','#8a8c8e','#f4c430'],fr:4,walls:[['p',11]],ceil:'#6a7480',tex:[['box'],['box'],['str','#f4c430','#222',8],M('#8a96a0'),['p',11]],kinds:['rack','rack','crate','barrel','rack','cart'],dens:.62,hemi:['#e8eef4','#5a5a5a'],sun:.95},
  {floor:['conc','#6a6c70'],fr:4,walls:[['p',12]],ceil:'#5a6068',tex:[M('#8a96a0'),['str','#f4c430','#222',8],['sol','#3a8a4a'],['box'],['p',12]],kinds:['machine','machine','barrel','crate','locker','pillar'],dens:.58,hemi:['#e0e8f0','#4a4a4a'],sun:.9},
  {floor:['carpet','#5a6470'],fr:5,walls:[['p',13]],ceil:'#f0f0ee',tex:[['fab','#3a4a6a'],M('#d8dce0'),['sol','#e8e4dc'],['p',13]],kinds:['desk','desk','locker','plant','sofa','desk'],dens:.6,hemi:['#fffaf0','#8a8478'],sun:1},
  {floor:['wood','#c8945a'],fr:5,walls:[['p',14]],ceil:'#f4f0e4',tex:[['wood','#d8a86a'],M('#5a8a5a'),['sol','#f4e8c8'],['p',14]],kinds:['desk','desk','desk','locker','shelf','plant'],dens:.66,hemi:['#fff8e8','#a8844a'],sun:1},
  {floor:['wood','#a87444'],fr:5,walls:[['p',15]],ceil:'#e8dcc4',tex:[['p',15],['wood','#c8a070'],['fab','#7a2a2a']],kinds:['shelf','shelf','shelf','desk','sofa','plant'],dens:.66,hemi:['#fff4e0','#8a6a44'],sun:.95},
  {floor:['tile','#f4f4f0','#d8d8d0',4],fr:6,walls:[['p',16]],ceil:'#f8f8f8',tex:[['p',16],['p',16],M('#e8ecef'),['str','#e8303a','#fff',6]],kinds:['shelf','shelf','fridge','cart','counter','shelf'],dens:.66,hemi:['#ffffff','#b8b8b0'],sun:1.05},
  {floor:['tile','#a8483a','#6a2a22',8],fr:6,walls:[['p',17]],ceil:'#f4f6f6',tex:[M('#c8ced4'),M('#b0b6bc'),['sol','#f4f6f6'],['p',17]],kinds:['counter','counter','fridge','rack','barrel','table'],dens:.6,hemi:['#ffffff','#9a8a80'],sun:1},
  {floor:['carpet','#2a2c30'],fr:5,walls:[['p',18]],ceil:'#3a3c40',tex:[M('#3a3c40'),['sol','#c8202a'],['fab','#2a2a2a'],['p',18]],kinds:['machine','bench','ball','rack','bench','locker'],dens:.58,hemi:['#e8f0ff','#3a3a3a'],sun:.9},
  {floor:['conc','#7a7c7e','#f4f4f0'],fr:4,walls:[['p',19]],ceil:'#8a8c8e',tex:[['conc','#9a9c9e'],['str','#f4c430','#222',8],['p',19]],kinds:['car','car','pillar','car','barrel','pillar'],dens:.45,hemi:['#e8eef0','#5a5a5a'],sun:.85},
  {floor:['tile','#f4f8fc','#5a9ad8',6],fr:6,walls:[['p',20]],ceil:'#f4f8fc',tex:[['sol','#f4f6f8'],['tile','#a8c8e0','#7aa8c8',6],['p',20]],kinds:['washer','washer','counter','seats','cart','washer'],dens:.62,hemi:['#f4fbff','#9ab0c4'],sun:1},
  {floor:['carpet','#5a1018','#c8a040'],fr:5,walls:[['p',21]],ceil:'#2a0a10',tex:[['fab','#8a1a2a'],['fab','#5a0a14'],['p',21],['sol','#2a2a2a']],kinds:['seats','seats','seats','pillar','counter','panel'],dens:.62,hemi:['#ffd8b0','#3a0a10'],sun:.6},
  {floor:['tile','#e8e0d0','#c8b8a0',4],fr:5,walls:[['p',22]],ceil:'#f4f0e8',tex:[['sol','#f4f0e8'],['p',22],['wood','#8a6a4a'],['sol','#c8b090']],kinds:['case','case','pillar','panel','plant','case'],dens:.58,hemi:['#fff8ec','#a89880'],sun:1},
  {floor:['tile','#c8ccd0','#9aa0a6',4],fr:6,walls:[['p',23]],ceil:'#e8ecef',tex:[['p',23],M('#c8ced4'),['sol','#2a8ad8'],['tile','#f4f4f4','#c8ccd0',8]],kinds:['seats','pillar','locker','panel','seats','plant'],dens:.55,hemi:['#f4f8ff','#9aa0a6'],sun:1},
  {floor:['wood','#c8a070'],fr:5,walls:[['p',24]],ceil:'#f8f4ee',tex:[['fab','#e87a9a'],['fab','#8ab8e8'],['wood','#e8d0b0'],['p',24],['dot','#fff',PK,9]],kinds:['bed','shelf','desk','locker','ball','sofa'],dens:.6,hemi:['#fff4f0','#c8a080'],sun:1},
  {floor:['wood','#9a6a3a'],fr:5,walls:[['p',25]],ceil:'#f8f0e4',tex:[['fab','#6a8a5a'],['fab','#c88a4a'],['wood','#5a3a22'],['p',25]],kinds:['sofa','sofa','table','shelf','plant','locker'],dens:.6,hemi:['#fff4e4','#8a6a44'],sun:1},
  {floor:['wood','#5a3a22'],fr:5,walls:[['p',26]],ceil:'#3a2a22',tex:[['wood','#8a5a34'],['brick',14],['fab','#3a5a4a'],['p',26]],kinds:['table','table','counter','plant','shelf','sofa'],dens:.62,hemi:['#ffe8c8','#4a3020'],sun:.85},
  {floor:['chk','#f4f4f4','#2a2a2a',8],fr:5,walls:[['p',27]],ceil:'#fff4f8',tex:[['fab','#2a2a2a'],['fab','#ff9ab8'],['p',27],M('#e8ecef')],kinds:['counter','seats','plant','cart','shelf','counter'],dens:.58,hemi:['#fff4f8','#c8a8b0'],sun:1.05},
  {floor:['wood','#d8a060'],fr:4,walls:[['p',28]],ceil:'#e8ecf0',tex:[['p',28],['str','#e8443a','#fff',6],['sol','#2a5ab8'],['wood','#c8904a']],kinds:['ball','ball','seats','crate','panel','cart'],dens:.5,hemi:['#ffffff','#a8844a'],sun:1.1},
  {floor:['carpet','#2a4a7a','#4a6a9a'],fr:5,walls:[['p',29]],ceil:'#f0f2f4',tex:[['fab','#3a4a5a'],M('#c8ced4'),['p',29],['sol','#e8443a']],kinds:['seats','seats','plant','locker','counter','crate'],dens:.58,hemi:['#f4f8ff','#8a9aaa'],sun:1.05});
const HALFL=9,WH=4.2;
function matOf(T,spec,rx,ry){ const cv=texCanvas(spec),tx=new T.CanvasTexture(cv); tx.wrapS=tx.wrapT=T.RepeatWrapping; tx.repeat.set(rx||1,ry||1); tx.anisotropy=4; const m=new T.MeshLambertMaterial({map:tx}); m.userData.cv=cv; return m; }
function buildWorld(T,si,low){ const R=mul(si*7919+11),th=THEMES[si],grp=new T.Group(),solids=[],boxes=[],tops=[];
  const add=(mesh,solid)=>{ mesh.castShadow=mesh.receiveShadow=!low; grp.add(mesh); if(solid!==false){ solids.push(mesh); } return mesh; };
  const pick=a=>a[R()*a.length|0];
  const fl=add(new T.Mesh(new T.PlaneGeometry(HALFL*2,HALFL*2),matOf(T,th.floor,th.fr,th.fr))); fl.rotation.x=-Math.PI/2; fl.castShadow=false;
  if(!th.out){ for(let k=0;k<4;k++){ const m=matOf(T,th.walls[k%th.walls.length],2.4,1),w=add(new T.Mesh(new T.PlaneGeometry(HALFL*2,WH),m)); w.position.y=WH/2; w.castShadow=false; const a=k*Math.PI/2; w.position.x=-Math.sin(a)*HALFL; w.position.z=-Math.cos(a)*HALFL; w.rotation.y=a; } const ce=new T.Mesh(new T.PlaneGeometry(HALFL*2,HALFL*2),matOf(T,['noise',th.ceil||'#e8e0d8'],4,4)); ce.rotation.x=Math.PI/2; ce.position.y=WH; grp.add(ce); }
  else { for(let k=0;k<4;k++){ const a=k*Math.PI/2; const m=matOf(T,th.walls[0],2.6,1),bd=new T.Mesh(new T.PlaneGeometry(36,8),m); bd.position.set(-Math.sin(a)*17,4,-Math.cos(a)*17); bd.rotation.y=a; grp.add(bd);
      const hm=matOf(T,th.tex[1],6,1),hd=add(new T.Mesh(new T.BoxGeometry(HALFL*2,1,.4),hm)); hd.position.set(-Math.sin(a)*(HALFL+.2),.5,-Math.cos(a)*(HALFL+.2)); hd.rotation.y=a; } }
  const box=(w,h,d,x,y,z,spec,ry)=>{ const m=add(new T.Mesh(new T.BoxGeometry(w,h,d),matOf(T,spec,Math.max(1,Math.round(w)),Math.max(1,Math.round(h))))); m.position.set(x,y+h/2,z); m.rotation.y=ry||0; return m; };
  const cyl=(r1,r2,h,x,y,z,spec,seg)=>{ const m=add(new T.Mesh(new T.CylinderGeometry(r1,r2,h,seg||20),matOf(T,spec,2,1))); m.position.set(x,y+h/2,z); return m; };
  const ball=(r,x,y,z,spec)=>{ const m=add(new T.Mesh(new T.SphereGeometry(r,20,14),matOf(T,spec,2,1))); m.position.set(x,y+r,z); return m; };
  const CS=2.4;
  /* 新家具：每一件用一個群組組起來，整組一起轉向 */
  const kit=(x,z,ry,fn)=>{ const g=new T.Group(); const b=(w,h,d,lx,ly,lz,spec,rx)=>{ const m=new T.Mesh(new T.BoxGeometry(w,h,d),matOf(T,spec,Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))); m.position.set(lx,ly+h/2,lz); if(rx) m.rotation.x=rx; g.add(m); return m; };
    const cy=(r,h,lx,ly,lz,spec,rot)=>{ const m=new T.Mesh(new T.CylinderGeometry(r,r,h,18),matOf(T,spec,2,1)); m.position.set(lx,ly,lz); if(rot==='x') m.rotation.x=Math.PI/2; if(rot==='z') m.rotation.z=Math.PI/2; g.add(m); return m; };
    fn(b,cy,g); g.position.set(x,0,z); g.rotation.y=ry; grp.add(g); g.traverse(o=>{ if(o.isMesh){ o.castShadow=o.receiveShadow=!low; solids.push(o); } }); return g; };
  const MT=['metal','#c8ced4'],DK=['sol','#2a2a2e'],WH2=['sol','#f4f6f8'];
  function newKind(kind,x,z,sp,ry){
    if(kind==='bed') kit(x,z,ry,(b,cy)=>{ b(1.0,.42,2.0,0,.12,0,MT); for(const sx of [-.45,.45]) for(const sz of [-.9,.9]) b(.06,.12,.06,sx,0,sz,DK); b(.94,.16,1.9,0,.54,0,WH2); b(.6,.1,.34,0,.7,-.72,['fab','#ffffff']); b(.98,.06,1.15,0,.7,.36,sp); b(1.0,.5,.06,0,.54,-.98,MT); });
    else if(kind==='rack') kit(x,z,ry,b=>{ const w=2.2,d=.9,h=2.7; for(const sx of [-1,1]) for(const sz of [-1,1]) b(.08,h,.08,sx*w/2,0,sz*d/2,['sol','#e8701a']); for(const y of [.1,.95,1.8]){ b(w,.08,.08,0,y,-d/2,['sol','#2a5ab8']); b(w,.08,.08,0,y,d/2,['sol','#2a5ab8']); b(w,.03,d,0,y+.08,0,['wood','#b88a5a']); for(let k=0;k<3;k++){ const bw=.45+R()*.2,bh=.35+R()*.3; if(R()<.82) b(bw,bh,.6,-w/2+.4+k*.72,y+.11,0,['box']); } } });
    else if(kind==='machine') kit(x,z,ry,(b,cy)=>{ b(1.5,1.1,1.0,0,0,0,sp); b(.6,.5,.06,-.2,.45,-.53,['panel']); cy(.3,.9,.45,1.55,0,MT); b(1.6,.08,1.1,0,0,0,DK); cy(.08,1.2,.6,.6,.4,['sol','#3a8a4a'],'z'); b(.3,.3,.3,-.55,1.1,.2,['str','#f4c430','#222',8]); });
    else if(kind==='desk') kit(x,z,ry,b=>{ b(1.4,.05,.75,0,.72,0,['wood','#c8a070']); for(const sx of [-.66,.66]) b(.05,.72,.7,sx,0,0,MT); b(.55,.34,.04,0,.86,-.2,DK); b(.06,.12,.06,0,.77,-.2,DK); b(.4,.02,.14,0,.77,.05,['sol','#ddd']); b(.45,.06,.45,.0,.45,.6,sp); b(.45,.5,.06,0,.5,.83,sp); b(.05,.45,.05,0,0,.6,DK); });
    else if(kind==='sofa') kit(x,z,ry,b=>{ b(1.9,.42,.85,0,0,0,sp); b(1.9,.5,.2,0,.42,.33,sp); for(const sx of [-.88,.88]) b(.16,.62,.85,sx,0,0,sp); b(.5,.3,.12,-.4,.42,.18,['fab','#f4e8c8']); });
    else if(kind==='counter') kit(x,z,ry,b=>{ b(2.2,.88,.62,0,0,0,sp); b(2.3,.05,.68,0,.88,0,['metal','#e0e4e8']); if(R()<.6) b(.4,.3,.3,-.6,.93,0,['box']); });
    else if(kind==='locker') kit(x,z,ry,b=>{ b(1.0,1.85,.5,0,0,0,['lock',sp[0]==='wood'?'#8a5a34':pick(['#7a8a9a','#5a7a9a','#9a7a5a','#6a8a6a'])]); });
    else if(kind==='cart') kit(x,z,ry,b=>{ for(const y of [.28,.8]) b(.85,.04,.5,0,y,0,MT); for(const sx of [-.4,.4]) for(const sz of [-.22,.22]) b(.04,.82,.04,sx,0,sz,MT); b(.35,.3,.3,-.15,.84,0,sp); if(R()<.6) b(.3,.2,.3,.2,.32,0,['box']); });
    else if(kind==='plant') kit(x,z,ry,(b,cy,g)=>{ cy(.24,.5,0,.25,0,['sol',pick(['#c8783a','#f4f4f0','#3a3a3a'])]); const s=new T.Mesh(new T.SphereGeometry(.45,16,12),matOf(T,['leaf'],2,1)); s.position.set(0,.85,0); s.scale.y=1.25; g.add(s); });
    else if(kind==='seats') kit(x,z,ry,b=>{ const n=3+(R()*2|0); b(n*.56,.05,.06,0,.25,0,DK); for(let k=0;k<n;k++){ const lx=(k-(n-1)/2)*.56; b(.5,.07,.48,lx,.42,0,sp); b(.5,.5,.06,lx,.47,.24,sp); b(.05,.42,.05,lx,0,0,DK); } });
    else if(kind==='fridge') kit(x,z,ry,b=>{ b(.85,1.9,.7,0,0,0,['metal','#e8ecef']); b(.86,.02,.71,0,1.25,0,DK); b(.04,.4,.05,.3,1.4,-.37,DK); b(.04,.5,.05,.3,.6,-.37,DK); });
    else if(kind==='bench') kit(x,z,ry,b=>{ b(1.4,.08,.36,0,.42,0,sp); for(const sx of [-.6,.6]) b(.06,.42,.3,sx,0,0,DK); b(.05,.9,.05,-.66,.42,0,MT); b(1.3,.04,.04,0,1.2,0,MT); });
    else if(kind==='car') kit(x,z,ry,(b,cy)=>{ const col=['sol',pick(['#c8202a','#2a5ab8','#f4f4f4','#2a2a2e','#e8b830','#5a6a7a'])]; b(1.7,.55,3.6,0,.28,0,col); b(1.5,.48,1.8,0,.83,.15,col); b(1.52,.38,1.6,0,.88,.15,['sol','#6a8aa8']); for(const sx of [-.82,.82]) for(const sz of [-1.15,1.15]) cy(.32,.24,sx,.32,sz,DK,'z'); b(.3,.12,.04,-.55,.55,-1.81,['sol','#fff8d0']); b(.3,.12,.04,.55,.55,-1.81,['sol','#fff8d0']); b(.3,.1,.04,-.55,.55,1.81,['sol','#e8303a']); b(.3,.1,.04,.55,.55,1.81,['sol','#e8303a']); });
    else if(kind==='washer') kit(x,z,ry,(b,cy)=>{ const two=R()<.4; for(let k=0;k<(two?2:1);k++){ const y=k*.86; b(.7,.84,.66,0,y,0,WH2); cy(.24,.04,0,y+.42,-.34,['sol','#5a8aaa'],'x'); b(.5,.1,.02,0,y+.7,-.34,['sol','#d8dde2']); } });
    else if(kind==='case') kit(x,z,ry,b=>{ b(.8,.9,.8,0,0,0,['sol','#f4f0e8']); const gl=b(.72,.62,.72,0,.9,0,['sol','#cfe8f4']); gl.material.transparent=true; gl.material.opacity=.28; b(.24,.3,.24,0,.9,0,sp); }); }
  for(let gx=-3;gx<=3;gx++) for(let gz=-3;gz<=3;gz++){ if(Math.abs(gx)<=0&&Math.abs(gz)<=0) continue; if(R()>th.dens) continue; const x=gx*CS+(R()-.5)*.6,z=gz*CS+(R()-.5)*.6,kind=pick(th.kinds),sp=pick(th.tex),ry=(R()<.5?0:Math.PI/2)+(R()-.5)*.3;
    if(kind==='crate'){ const w=.6+R()*.7,h=.5+R()*.7; box(w,h,w,x,0,z,sp,ry); if(R()<.5){ const w2=w*(.5+R()*.4); box(w2,w2,w2,x+(R()-.5)*.2,h,z+(R()-.5)*.2,pick(th.tex),ry+.4); } if(R()<.4) box(.5+R()*.4,.4+R()*.4,.5,x+w*.9,0,z+(R()-.5)*.4,pick(th.tex),ry); }
    else if(kind==='shelf'){ const h=1.6+R()*.9,w=1.6+R()*.4; const g=new T.Group(); const sides=matOf(T,['wood','#8a5a34'],1,2); for(const sx of [-1,1]){ const s=new T.Mesh(new T.BoxGeometry(.08,h,.5),sides); s.position.set(sx*w/2,h/2,0); g.add(s); }
      const nb=3; for(let k=0;k<=nb;k++){ const b=new T.Mesh(new T.BoxGeometry(w,.06,.5),sides); b.position.set(0,k*(h-.06)/nb+.03,0); g.add(b); if(k<nb){ const fill=new T.Mesh(new T.BoxGeometry(w-.12,(h/nb)*.7,.36),matOf(T,sp,1,1)); fill.position.set(0,k*(h-.06)/nb+.06+(h/nb)*.35,-.02); g.add(fill); } }
      g.position.set(x,0,z); g.rotation.y=ry; grp.add(g); g.traverse(o=>{ if(o.isMesh){ o.castShadow=o.receiveShadow=!low; solids.push(o); } }); }
    else if(kind==='barrel'){ const r=.3+R()*.2; cyl(r,r*.9,.8+R()*.5,x,0,z,sp); }
    else if(kind==='ball'){ ball(.25+R()*.35,x,0,z,sp); if(R()<.5) ball(.2+R()*.2,x+.7,0,z-.3,pick(th.tex)); }
    else if(kind==='table'){ const tw=1.2+R()*.5,td=.8,th2=.72; box(tw,.08,td,x,th2,z,['wood','#9a6a3a'],ry); for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const lx=a*(tw/2-.08),lz=b*(td/2-.08); box(.07,th2,.07,x+lx*Math.cos(ry)+lz*Math.sin(ry),0,z-lx*Math.sin(ry)+lz*Math.cos(ry),['wood','#7a4a2a'],ry); } if(R()<.6) box(.3+R()*.3,.25+R()*.3,.3,x,th2+.08,z,pick(th.tex),ry+.5); }
    else if(kind==='panel'){ box(1.4+R()*.6,1.4+R()*.8,.08,x,0,z,sp,ry); }
    else if(kind==='pillar'){ cyl(.28,.28,WH-.2,x,0,z,sp); }
    else if(kind==='bush'){ const b=ball(.5+R()*.4,x,-.15,z,sp); b.scale.y=.8; }
    else if(kind==='umbrella'){ cyl(.04,.04,2.1,x,0,z,['sol','#eee'],8); const cone=add(new T.Mesh(new T.ConeGeometry(1.2,.5,16,1,true),matOf(T,sp,4,1))); cone.material.side=T.DoubleSide; cone.position.set(x,2.2,z); box(1.6,.06,.7,x+.4,0,z+.8,sp,ry); }
    else if(kind==='stall'){ box(1.8,.9,.7,x,0,z,sp,ry); box(1.9,.06,1.0,x,2.0,z,['str','#e8303a','#fff',6],ry); for(const sx of [-.85,.85]) box(.06,2,.06,x+sx*Math.cos(ry),0,z-sx*Math.sin(ry),['sol','#3a2a2a'],ry);
      const lan=new T.Mesh(new T.SphereGeometry(.14,12,8),new T.MeshBasicMaterial({color:0xff5a3a})); lan.position.set(x,1.8,z); grp.add(lan); }
    else newKind(kind,x,z,sp,ry); }
  if(th.night){ for(let k=0;k<14;k++){ const lan=new T.Mesh(new T.SphereGeometry(.16,12,8),new T.MeshBasicMaterial({color:k%2?0xff5a3a:0xffc040})); lan.position.set((R()-.5)*16,3+R()*.6,(R()-.5)*16); grp.add(lan); } }
  grp.updateMatrixWorld(true);
  for(const m of solids){ if(m===fl) continue; const b=new T.Box3().setFromObject(m); if(b.max.y>.15) boxes.push(b); }
  return {grp,solids,boxes,floor:fl}; }
/* 碰到的地方原本是什麼顏色（材質本身的顏色，不含光影） */
function albedo(hit){ const m=hit.object.material; if(m&&m.userData&&m.userData.cv&&hit.uv){ const rp=m.map.repeat; return pixAt(m.userData.cv,hit.uv.x*rp.x,hit.uv.y*rp.y); } if(m&&m.userData&&m.userData.atlas&&hit.uv) return pixAt2(m.userData.atlas,hit.uv.x,hit.uv.y); const c=m&&m.color?m.color:{r:.8,g:.8,b:.8}; return [c.r*255|0,c.g*255|0,c.b*255|0]; }
function pixAt2(cv,u,v){ const g=cv.getContext('2d'),x=clamp(u*cv.width|0,0,cv.width-1),y=clamp((1-v)*cv.height|0,0,cv.height-1),d=g.getImageData(x,y,1,1).data; return [d[0],d[1],d[2]]; }
// ---------- 3D 小人偶：關節可以擺姿勢；全身的塗裝畫在一張 512×384 的貼圖上（每個部位一格 128×128） ----------
const AW=512,AH=384,CELL=128;
const PARTS=['head','torso','hips','uarmL','larmL','uarmR','larmR','thighL','shinL','thighR','shinR'];
const PARTN={head:'頭',torso:'身體',hips:'屁股',uarmL:'左手臂',larmL:'左手',uarmR:'右手臂',larmR:'右手',thighL:'左大腿',shinL:'左小腿',thighR:'右大腿',shinR:'右小腿'};
/* 姿勢：sh＝肩（往前、往外）、el＝手肘、hp＝髖（往前、往外）、kn＝膝蓋、tilt＝整個身體往前倒（趴／躺）、lift＝高度、bend＝彎腰 */
const POSES=[
  ['站好',{sh:[0,.12,0,.12],el:[.1,.1],hp:[0,0,0,0],kn:[0,0]}],
  ['大字',{sh:[0,1.25,0,1.25],el:[0,0],hp:[0,.45,0,.45],kn:[0,0]}],
  ['舉雙手',{sh:[0,2.85,0,2.85],el:[0,0],hp:[0,.08,0,.08],kn:[0,0]}],
  ['稻草人',{sh:[0,1.57,0,1.57],el:[0,0],hp:[0,0,0,0],kn:[0,0]}],
  ['蹲下',{sh:[.7,.2,.7,.2],el:[1.1,1.1],hp:[1.9,.25,1.9,.25],kn:[2.3,2.3],lift:-.3,bend:.35}],
  ['坐下',{sh:[.3,.15,.3,.15],el:[.6,.6],hp:[1.57,.12,1.57,.12],kn:[1.57,1.57],lift:-.26}],
  ['單腳站',{sh:[0,1.2,0,1.2],el:[0,0],hp:[1.2,0,0,0],kn:[1.7,0]}],
  ['跳舞',{sh:[0,2.6,1.0,.3],el:[0,1.3],hp:[0,0,0,.45],kn:[0,0]}],
  ['趴下',{sh:[2.9,.2,2.9,.2],el:[0,0],hp:[0,.15,0,.15],kn:[0,0],tilt:1.57,lift:.13}],
  ['躺平',{sh:[0,.35,0,.35],el:[0,0],hp:[0,.1,0,.1],kn:[0,0],tilt:-1.57,lift:.13}],
  ['縮成一團',{sh:[1.3,.1,1.3,.1],el:[2.2,2.2],hp:[2.3,.1,2.3,.1],kn:[2.5,2.5],lift:-.4,bend:.6}],
  ['倒立',{sh:[0,2.95,0,2.95],el:[0,0],hp:[0,.3,0,.3],kn:[0,0],tilt:3.14,lift:1.36}]];
function remapUV(geo,cell){ const col=cell%4,row=cell/4|0,uv=geo.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,(col+uv.getX(i))/4,1-(row+1-uv.getY(i))/3); uv.needsUpdate=true; return geo; }
function newAtlas(){ const cv=document.createElement('canvas'); cv.width=AW; cv.height=AH; const g=cv.getContext('2d'); g.fillStyle='#f4f4f4'; g.fillRect(0,0,AW,AH);
  g.fillStyle='#2a2a33'; for(const du of [-.045,.045]){ g.beginPath(); g.ellipse((.25+du)*CELL,(1-.56)*CELL,4,6,0,0,TAU); g.fill(); } g.strokeStyle='#2a2a33'; g.lineWidth=2; g.beginPath(); g.arc(.25*CELL,(1-.47)*CELL,5,.3,Math.PI-.3); g.stroke(); return cv; }
function makeDoll(T,atlas){ const tex=new T.CanvasTexture(atlas); const mat=new T.MeshLambertMaterial({map:tex}); mat.userData.atlas=atlas; const root=new T.Group(),body=new T.Group(); root.add(body); const parts={},meshes=[];
  const mesh=(name,geo)=>{ const m=new T.Mesh(remapUV(geo,PARTS.indexOf(name)),mat); m.castShadow=m.receiveShadow=true; m.userData.part=name; parts[name]=m; meshes.push(m); return m; };
  const hips=new T.Group(); hips.position.y=.55; body.add(hips); const hm=mesh('hips',new T.SphereGeometry(.12,14,10)); hm.scale.set(1,.7,.85); hips.add(hm);
  const spine=new T.Group(); hips.add(spine); const tor=mesh('torso',new T.CylinderGeometry(.13,.11,.38,16)); tor.position.y=.2; spine.add(tor);
  const head=mesh('head',new T.SphereGeometry(.14,18,14)); head.position.y=.53; spine.add(head);
  const limb=(nu,nl,x,y,l1,l2,r1,r2,par)=>{ const p1=new T.Group(); p1.position.set(x,y,0); par.add(p1); const m1=mesh(nu,new T.CylinderGeometry(r1,r1*.88,l1,10)); m1.position.y=-l1/2; p1.add(m1); const p2=new T.Group(); p2.position.y=-l1; p1.add(p2); const m2=mesh(nl,new T.CylinderGeometry(r2,r2*.8,l2,10)); m2.position.y=-l2/2; p2.add(m2); const end=new T.Mesh(new T.SphereGeometry(r2*.95,8,6),mat); end.position.y=-l2; p2.add(end); end.castShadow=true; end.userData.part=nl; meshes.push(end); return [p1,p2]; };
  const [shL,elL]=limb('uarmL','larmL',.17,.36,.24,.22,.042,.036,spine),[shR,elR]=limb('uarmR','larmR',-.17,.36,.24,.22,.042,.036,spine);
  const [hpL,knL]=limb('thighL','shinL',.07,0,.27,.27,.058,.046,hips),[hpR,knR]=limb('thighR','shinR',-.07,0,.27,.27,.058,.046,hips);
  function pose(i){ const P=POSES[((i%POSES.length)+POSES.length)%POSES.length][1];
    shL.rotation.set(-P.sh[0],0,P.sh[1]); shR.rotation.set(-P.sh[2],0,-P.sh[3]); elL.rotation.set(-P.el[0],0,0); elR.rotation.set(-P.el[1],0,0);
    hpL.rotation.set(-P.hp[0],0,P.hp[1]); hpR.rotation.set(-P.hp[2],0,-P.hp[3]); knL.rotation.set(P.kn[0],0,0); knR.rotation.set(P.kn[1],0,0);
    spine.rotation.x=P.bend||0; body.rotation.x=P.tilt||0; body.position.y=P.lift||0; if(P.tilt&&Math.abs(P.tilt)>3) body.position.y=P.lift; }
  pose(0); return {root,meshes,parts,tex,atlas,mat,pose,dirty(){ tex.needsUpdate=true; },dispose(){ tex.dispose(); mat.dispose(); for(const m of meshes) m.geometry.dispose(); }}; }
const STAGES=SCENES.map((s,i)=>{ const k=i/(SCENES.length-1); return {name:s[0],k,stars:1+Math.round(k*4),nHide:3+Math.round(k*4),noise:46-38*k,blot:30-20*k,eye:.9-.45*k}; });
function figData(f){ return {p:[r2(f.x),r2(f.y),r2(f.z)],ry:r2(f.ry),s:r2(f.s),pose:f.pose,n:(f.n||[0,1,0]).map(r2),px:r2(f.px||0),rl:r2(f.rl||0),img:f.atlas.toDataURL('image/jpeg',.8)}; }
// 顏色工具
const hex=c=>'#'+c.map(v=>Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join('');
const unhex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
function hsv2rgb(h,s,v){ const f=n=>{ const k=(n+h/60)%6; return v-v*s*Math.max(0,Math.min(k,4-k,1)); }; return [f(5)*255,f(3)*255,f(1)*255]; }
function rgb2hsv(r,g,b){ r/=255; g/=255; b/=255; const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn; let h=0; if(d){ if(mx===r) h=((g-b)/d)%6; else if(mx===g) h=(b-r)/d+2; else h=(r-g)/d+4; h*=60; if(h<0) h+=360; } return [h,mx?d/mx:0,mx]; }

function create(env,opts){
  const T=window.THREE,net=opts.net,host=!!net&&net.host,client=!!net&&!net.host,me=net?net.me:0,pv=!!opts.preview,mode=net?'net':opts.mode||'hide',si=clamp(opts.stage|0,0,SCENES.length-1),ST=STAGES[si];
  const {ctx:c,canvas}=env.canvas2d(W,H); canvas.style.touchAction='none'; const sfx=n=>{ if(!pv) env.sfx(n); };
  if(!T){ c.fillStyle='#14122b'; c.fillRect(0,0,W,H); c.fillStyle='#fff'; c.font='900 22px '+TC; c.textAlign='center'; c.fillText('3D 元件載入失敗，請重新整理再試',W/2,H/2); setTimeout(()=>env.end(pv?{}:{title:'無法開始',big:'',text:'載不到 three.js'}),2500); return {update(){},draw(){},destroy(){}}; }
  const low=!!env.touch||pv,Q=pv?.6:env.touch?1:1.3,R=mul((Math.random()*1e9)|0);
  const cv3=document.createElement('canvas'),rd=new T.WebGLRenderer({canvas:cv3,antialias:!pv}); rd.setPixelRatio(1); rd.setSize(W*Q,H*Q,false); rd.shadowMap.enabled=!low; rd.shadowMap.type=T.PCFSoftShadowMap;
  const S3=new T.Scene(),TH=THEMES[si],WD=buildWorld(T,si,low); S3.add(WD.grp);
  const bg=document.createElement('canvas'); bg.width=2; bg.height=64; { const g=bg.getContext('2d'),gr=g.createLinearGradient(0,0,0,64),sk=TH.sky||['#e8e0f0','#c8c0d8']; gr.addColorStop(0,sk[0]); gr.addColorStop(1,sk[1]); g.fillStyle=gr; g.fillRect(0,0,2,64); } S3.background=new T.CanvasTexture(bg);
  S3.add(new T.HemisphereLight(TH.hemi[0],TH.hemi[1],TH.night?.62:.7)); S3.add(new T.AmbientLight(0xffffff,.12)); const sun=new T.DirectionalLight(0xffffff,.42*TH.sun); sun.position.set(6,12,4); sun.castShadow=!low; sun.shadow.mapSize.set(1024,1024); const shc=sun.shadow.camera; shc.left=shc.bottom=-11; shc.right=shc.top=11; shc.near=1; shc.far=40; S3.add(sun);
  const cam=new T.PerspectiveCamera(62,W/H,.05,80),rc=new T.Raycaster();
  const N=net?net.count:2,names=net?net.names.map((n,i)=>n||('玩家 '+(i+1))):mode==='2p'?['1P','2P']:[opts.name||'你','電腦'];
  const TM=['紅隊','藍隊'],TC2=['#ff5a6a','#4aa8ff'],team=i=>i%2,NR=4,solo=mode==='hide'||mode==='seek';
  const SN=net?TM:mode==='2p'?['1P','2P']:[names[0],'電腦'];
  let phase='intro',PT=pv?.3:net?5:2.2,t=0,ban=null,ended=false,me_=null,figs=[],found={},seekT=0,ai=null,round=0,cover=null,sent=false,waitAll=false,sc=[0,0],hidT=0,rsc=0,hideDur=180,seekDur=300;
  let selRot=false,tool='move',brush=8,col=[232,52,58],recent=['#e8343a','#3a6ae8','#f4f4f4','#2a2a33','#7ae05a','#ffd23f'],pat=0,undo=[],tbTop=false,drag=null,ptr={x:W/2,y:H/2},BT=[],marks=[];
  // 相機：躲的時候繞著人偶轉；找的時候第一人稱
  const orb={yaw:.6,pitch:.35,dist:3.2,tx:0,ty:.7,tz:0},fp={x:0,z:0,yaw:0,pitch:-.05,fov:64};
  const say=(txt,col2)=>{ ban={txt,col:col2||'#ffd23f',t:0}; };
  const fmt=s=>s>=60?Math.floor(s/60)+' 分 '+(s%60)+' 秒':s+' 秒';
  /* ---- 人偶 ---- */
  const UPV=new T.Vector3(0,1,0),QA=new T.Quaternion(),QB=new T.Quaternion(),EU=new T.Euler(0,0,0,'YXZ');
  function placeFig(f){ const n=f.n||[0,1,0]; QA.setFromUnitVectors(UPV,new T.Vector3(n[0],n[1],n[2]).normalize()); EU.set(f.px||0,f.ry,f.rl||0,'YXZ'); QB.setFromEuler(EU); f.d.root.quaternion.copy(QA).multiply(QB);
    f.d.root.position.set(f.x+n[0]*.01,f.y+n[1]*.01,f.z+n[2]*.01); f.d.root.scale.setScalar(f.s); f.d.pose(f.pose); }
  /* 把人偶貼到點到的面：任何方向的面都可以（牆上、櫃子側面、桌底…） */
  function stickTo(f,h){ const n=h.face.normal.clone().transformDirection(h.object.matrixWorld).normalize(); if(n.dot(rc.ray.direction)>0) n.negate();
    f.x=h.point.x; f.y=h.point.y; f.z=h.point.z; f.n=[n.x,n.y,n.z]; placeFig(f); const c0=figCenter(f); orb.tx=c0.x; orb.ty=c0.y; orb.tz=c0.z; }
  function figCenter(f,k){ const n=f.n||[0,1,0],u=(k==null?.7:k)*f.s; return new T.Vector3(f.x+n[0]*u,f.y+n[1]*u,f.z+n[2]*u); }
  function newFig(o,atlas){ const f=Object.assign({x:0,y:0,z:0,ry:0,s:.55,pose:0,n:[0,1,0],px:0,rl:0},o||{}); f.atlas=atlas||newAtlas(); f.d=makeDoll(T,f.atlas); placeFig(f); return f; }
  function figFrom(o){ const f=newFig({x:o.p[0],y:o.p[1],z:o.p[2],ry:o.ry,s:o.s,pose:o.pose,n:o.n||[0,1,0],px:o.px||0,rl:o.rl||0}); const im=new Image(); im.onload=()=>{ f.atlas.getContext('2d').drawImage(im,0,0); IMGD.delete(f.atlas); f.d.dirty(); }; im.src=o.img; return f; }
  function showFigs(list){ for(const f of allShown) S3.remove(f.d.root); allShown=list.slice(); for(const f of allShown) S3.add(f.d.root); } let allShown=[];
  /* 找可以站的地方：從上往下打到水平的面 */
  function surfaceAt(x,z){ rc.set(new T.Vector3(x,8,z),new T.Vector3(0,-1,0)); rc.far=20; const h=rc.intersectObjects(WD.solids,false)[0]; rc.far=Infinity; if(!h) return null; const n=h.face.normal.clone().transformDirection(h.object.matrixWorld); return n.y>.6?h.point:null; }
  function randomSpot(avoid){ for(let k=0;k<80;k++){ const x=(R()-.5)*(HALFL*2-1.4),z=(R()-.5)*(HALFL*2-1.4); if(Math.hypot(x,z)<2.2) continue; const p=surfaceAt(x,z); if(!p) continue; if(avoid.some(a=>Math.hypot(a.x-p.x,a.z-p.z)<1.1)) continue; return p; } return new T.Vector3((R()-.5)*8,0,(R()-.5)*8); }
  /* 電腦塗裝：從人偶每個部位往四周打射線，取附近東西的顏色塗上去（越後面的關卡塗得越像） */
  function autoPaint(f,q){ const g=f.atlas.getContext('2d'),d=f.d; d.root.updateMatrixWorld(true); const dirs=[];
    for(let k=0;k<22;k++){ const a=R()*TAU,e=(R()-.35)*Math.PI*.9; dirs.push(new T.Vector3(Math.cos(a)*Math.cos(e),Math.sin(e),Math.sin(a)*Math.cos(e))); }
    PARTS.forEach((pn,ci)=>{ const m=d.parts[pn],p=new T.Vector3(); m.getWorldPosition(p); const cols=[]; for(const dir of dirs){ rc.set(p,dir); rc.far=2.2; const h=rc.intersectObjects(WD.solids,false)[0]; if(h) cols.push(albedo(h)); } rc.far=Infinity; if(!cols.length) cols.push([200,200,200]);
      const cx=(ci%4)*CELL,cy=(ci/4|0)*CELL,nz=()=>(R()-.5)*q.noise; const avg=[0,1,2].map(j=>cols.reduce((s,c2)=>s+c2[j],0)/cols.length); g.fillStyle=hex(avg.map(v=>v+nz())); g.fillRect(cx,cy,CELL,CELL);
      const nb=Math.round(60-q.blot); for(let k=0;k<nb;k++){ const c2=cols[R()*cols.length|0],n0=nz(); g.fillStyle=hex(c2.map(v=>v+n0)); g.beginPath(); g.ellipse(cx+R()*CELL,cy+R()*CELL,q.blot*(.5+R()),q.blot*(.3+R()*.6),R()*3,0,TAU); g.fill(); } });
    IMGD.delete(f.atlas); d.dirty(); }
  /* 看起來多明顯：每個部位的顏色跟附近東西的顏色差多少 × 有多少角度看得到 */
  function visib(f){ const d=f.d; d.root.updateMatrixWorld(true); const g=f.atlas.getContext('2d'); let s=0,wsum=0; const W8=[4,3,1.2,1,1,1,1,1.4,1.2,1.4,1.2];
    PARTS.forEach((pn,ci)=>{ const im=g.getImageData((ci%4)*CELL,(ci/4|0)*CELL,CELL,CELL).data; let a=[0,0,0],n=0; for(let i=0;i<im.length;i+=4*37){ a[0]+=im[i]; a[1]+=im[i+1]; a[2]+=im[i+2]; n++; } a=a.map(v=>v/n);
      const p=new T.Vector3(); d.parts[pn].getWorldPosition(p); const ds=[]; for(let k=0;k<14;k++){ const th=k/14*TAU,dir=new T.Vector3(Math.cos(th),k%3===0?-.6:k%3===1?0:.4,Math.sin(th)).normalize(); rc.set(p,dir); rc.far=2.5; const h=rc.intersectObjects(WD.solids,false)[0]; if(h){ const c2=albedo(h); ds.push(Math.hypot(a[0]-c2[0],a[1]-c2[1],a[2]-c2[2])); } } rc.far=Infinity;
      const v=ds.length?(ds.sort((x,y)=>x-y),ds[0]*.6+ds.reduce((x,y)=>x+y,0)/ds.length*.4)/441:.8; s+=v*W8[ci]; wsum+=W8[ci]; });
    const c0=new T.Vector3(); d.parts.torso.getWorldPosition(c0); let seen=0,tot=0; for(let k=0;k<12;k++){ const a=k/12*TAU,e=new T.Vector3(Math.cos(a)*6,1.45,Math.sin(a)*6); tot++; const dir=c0.clone().sub(e),L=dir.length(); rc.set(e,dir.normalize()); rc.far=L-.25; if(!rc.intersectObjects(WD.solids,false).length) seen++; } rc.far=Infinity;
    return {v:s/wsum,expo:seen/tot}; }
  /* ---- 流程（4 回合：兩邊各躲兩次、找兩次；躲越久分數越高） ---- */
  const cpuHides=()=>solo&&hidT===1;
  const iSeek=()=>mode==='net'?team(me)!==hidT:mode==='2p'?phase==='seek':cpuHides();
  function beginRound(){ hidT=mode==='seek'?1-round%2:round%2; for(const k in nFigs) delete nFigs[k]; ai=null; marks=[]; showFigs([]);
    if(mode==='net'){ if(team(me)!==hidT){ phase='wait'; PT=hideDur; fp.x=0; fp.z=0; say(TM[hidT]+'在躲，等一下換你們找',TC2[team(me)]); } else startHide(); return; }
    if(cpuHides()) aiHide(); else startHide(); }
  function startHide(){ phase='hide'; PT=hideDur; const p=randomSpot([]); me_=newFig({x:p.x,y:p.y,z:p.z,ry:R()*TAU,pose:0}); showFigs([me_]); tool='move'; undo=[]; sent=false; waitAll=false; selRot=false; orb.tx=p.x; orb.tz=p.z; orb.ty=p.y+.7*me_.s; orb.dist=2.2;
    say(mode==='2p'?SN[hidT]+' 來躲！（'+SN[1-hidT]+' 先別看）':mode==='net'?TM[hidT]+'躲起來！藏好按「已藏好」':'找個地方躲好、塗成跟周圍一樣的顏色！',mode==='net'?TC2[hidT]:null); sfx('go'); }
  function startSeek(list){ phase='seek'; PT=seekDur; figs=list; found={}; seekT=0; marks=[]; tool='move'; showFigs(figs); fp.x=0; fp.z=0; fp.yaw=R()*TAU; fp.pitch=-.05; fp.fov=64;
    if(solo&&hidT===0){ const V=visib(figs[0]),T0=14*ST.eye/Math.max(.03,V.v*(.35+.65*V.expo))*Math.pow(.55/Math.max(.3,figs[0].s),.7)*(.8+R()*.4); ai={T:T0,V,x:0,z:0,yaw:0,tx:0,tz:0,nx:0}; }
    say(solo&&hidT===0?'電腦來找你了！':iSeek()?(mode==='net'?'換你們找！走動找人，點一下抓':'換'+(mode==='2p'?' '+SN[1-hidT]+' ':'你')+'找！走動找人，點一下抓'):TM[1-hidT]+'正在找…',iSeek()?'#7ae8ff':'#ffd23f'); sfx('beep'); }
  function finishHide(){ if(solo){ startSeek([me_]); return; }
    if(mode==='2p'){ cover={txt:'換 '+SN[1-hidT]+' 來找',sub:SN[hidT]+' 已經藏好了，換人拿裝置',auto:5,fn:()=>{ cover=null; startSeek([me_]); }}; phase='cover'; return; }
    if(mode==='net'&&!sent){ sent=true; waitAll=true; const fd=figData(me_); fd.who=me; if(host) gotFig(fd); else { nFigs[me]=fd; net.send({fig:fd}); } } }
  function undoDone(){ if(mode!=='net'||!sent||phase!=='hide'||PT<=0) return; sent=false; waitAll=false; delete nFigs[me]; if(host) net.send({ru:me}); else net.send({un:me}); }
  const hostNet=()=>mode==='net'&&host;
  const nFigs={}; function gotFig(fd){ nFigs[fd.who]=fd; if(host){ net.send({rf:fd}); checkAll(); } }
  const left={}; function hiders(){ const a=[]; for(let i=0;i<N;i++) if(team(i)===hidT&&!left[i]) a.push(i); return a; }
  function checkAll(){ if(phase!=='hide'&&phase!=='wait') return; if(hiders().every(i=>nFigs[i])){ net.send({ph:'seek'}); goSeekNet(); } }
  function goSeekNet(){ if(phase==='seek') return; const list=hiders().filter(i=>nFigs[i]).map(i=>{ const f=i===me&&me_?me_:figFrom(nFigs[i]); f.who=i; return f; }); startSeek(list); }
  function tagAt(x,y){ if(phase!=='seek'||!iSeek()) return; const hit=pickRay(x,y,[...WD.solids,...figs.flatMap(f=>f.d.meshes)]); let idx=-1; if(hit) idx=figs.findIndex(f=>f.d.meshes.includes(hit.object)); if(idx>=0&&found[idx]!=null) return;
    if(mode==='net'&&!host){ net.send({clk:idx}); return; } judge(idx); }
  function judge(idx){ const at=seekT; if(hostNet()) net.send({hit:[idx,r2(at)]}); applyHit(idx,at); }
  function applyHit(idx,at){ if(idx>=0&&found[idx]==null){ found[idx]=at+.001; sfx('item'); const f=figs[idx]; say(mode==='net'?names[f.who]+' 被找到了！':'找到了！','#7aff8a'); }
    else if(idx<0){ sfx('bump'); marks.push({t:0}); if(mode==='net'||iSeek()){ seekT+=2; PT=Math.max(0,PT-2); } }
    if(figs.every((f,i)=>found[i]!=null)&&(mode!=='net'||host)) endSeek(); }
  function endSeek(){ if(phase!=='seek') return; phase='res'; PT=pv?2:5; const all=figs.every((f,i)=>found[i]!=null);
    rsc=Math.round(figs.reduce((s,f,i)=>s+(found[i]!=null?Math.min(found[i],seekDur):seekDur),0)/Math.max(1,figs.length));
    if(mode!=='net'||host){ sc[hidT]+=rsc; if(hostNet()) net.send({ph:'res',sc,rs:rsc}); }
    const myHide=mode==='net'?team(me)===hidT:solo?hidT===0:true; sfx(mode==='2p'?'win':(myHide?!all:all)?'win':'lose'); say(SN[hidT]+' 得 '+rsc+' 分'+(all?'':'（有人沒被找到！）'),all?'#ffd23f':'#7aff8a'); }
  function nextAfterRes(){ if(pv){ conclude(); return; } if(round>=NR-1){ if(hostNet()) net.send({end:sc}); conclude(); return; } round++;
    if(mode==='net'){ net.send({ph:'hide',r:round}); beginRound(); return; } const nh=mode==='seek'?1-round%2:round%2;
    if(mode==='2p'){ cover={txt:'第 '+(round+1)+' 回合：換 '+SN[nh]+' 來躲',sub:SN[1-nh]+' 請先別看',auto:5,fn:()=>{ cover=null; beginRound(); }}; phase='cover'; return; }
    cover={txt:'第 '+(round+1)+' / '+NR+' 回合',sub:nh===0?'換你躲，電腦來找':'換電腦躲，你來找',auto:3,fn:()=>{ cover=null; beginRound(); }}; phase='cover'; }
  function conclude(){ if(ended) return; ended=true; if(pv){ env.end({}); return; }
    const w=sc[0]===sc[1]?-1:sc[0]>sc[1]?0:1,big=SN[0]+' '+sc[0]+' 分　：　'+sc[1]+' 分 '+SN[1],tx='4 回合加起來（兩邊各躲兩次）：人偶躲越久分數越高（1 秒 1 分，沒被找到算 '+seekDur+' 分）。';
    if(solo){ if(w===0) recWin(mode,si); env.end({title:w<0?'平手！':w===0?'你贏了！':'電腦贏了',big,text:ST.name+'：'+tx+(w===0?'':' 用吸管吸周圍的顏色、擺跟周圍一樣的姿勢會更難找。'),next:w===0&&si<9}); }
    else if(mode==='2p') env.end({title:w<0?'平手！':SN[w]+' 贏了！',big,text:tx});
    else env.end({title:w<0?'平手！':TM[w]+'贏了！'+(team(me)===w?'（你們隊）':''),big,text:tx}); }
  function aiHide(){ const list=[],ok=[]; for(let i=0;i<ST.nHide;i++){ const p=randomSpot(ok); ok.push(p); const f=newFig({x:p.x,y:p.y,z:p.z,ry:R()*TAU,s:.4+R()*.3,pose:R()*POSES.length|0}); placeFig(f); autoPaint(f,ST); list.push(f); } startSeek(list); }
  function demo(){ hidT=1; aiHide(); }
  /* ---- 連線 ---- */
  if(net){ net.onmsg=(m,from)=>{ if(m.fig&&host){ gotFig(m.fig); return; } if(m.rf&&!host){ nFigs[m.rf.who]=m.rf; return; } if(m.un!=null&&host){ if(phase==='hide'||phase==='wait'){ delete nFigs[m.un]; net.send({ru:m.un}); } return; } if(m.ru!=null&&!host){ if(m.ru!==me) delete nFigs[m.ru]; return; }
      if(m.clk!=null&&host){ if(phase==='seek'&&team(from)!==hidT&&!left[from]) judge(m.clk); return; }
      if(!host){ if(m.ph==='hide'){ round=m.r; beginRound(); } else if(m.ph==='seek'){ goSeekNet(); } else if(m.hit){ seekT=m.hit[1]; applyHit(m.hit[0],m.hit[1]); } else if(m.ph==='res'){ endSeek(); sc=m.sc; rsc=m.rs; } else if(m.end){ sc=m.end; conclude(); } } };
    net.onleave=i=>{ left[i]=1; if(host){ let any=false; for(let k=0;k<N;k++) if(team(k)!==hidT&&!left[k]) any=true; if(!any&&phase==='seek') endSeek(); else checkAll(); } }; }
  /* ---- 射線 ---- */
  function pickRay(x,y,list){ rc.setFromCamera(new T.Vector2(x/W*2-1,-(y/H*2-1)),cam); return rc.intersectObjects(list,false)[0]||null; }
  /* ---- 塗裝 ---- */
  function snapUndo(){ undo.push(me_.atlas.getContext('2d').getImageData(0,0,AW,AH)); if(undo.length>10) undo.shift(); }
  function cellOf(m){ const ci=PARTS.indexOf(m.userData.part); return [(ci%4)*CELL,(ci/4|0)*CELL]; }
  function paintHit(h,first){ const g=me_.atlas.getContext('2d'),[cx,cy]=cellOf(h.object),px=h.uv.x*AW,py=(1-h.uv.y)*AH; g.save(); g.beginPath(); g.rect(cx,cy,CELL,CELL); g.clip(); g.fillStyle=g.strokeStyle=hex(col);
    const r=brush/Math.max(.6,me_.s); if(!first&&drag&&drag.lp&&drag.lp[2]===h.object.userData.part&&Math.hypot(drag.lp[0]-px,drag.lp[1]-py)<CELL*.6){ g.lineCap='round'; g.lineWidth=r*2; g.beginPath(); g.moveTo(drag.lp[0],drag.lp[1]); g.lineTo(px,py); g.stroke(); } g.beginPath(); g.arc(px,py,r,0,TAU); g.fill(); g.restore(); drag.lp=[px,py,h.object.userData.part]; me_.d.dirty(); }
  function fillPart(m){ snapUndo(); const g=me_.atlas.getContext('2d'),[cx,cy]=cellOf(m); g.fillStyle=hex(col); g.fillRect(cx,cy,CELL,CELL); me_.d.dirty(); say('「'+PARTN[m.userData.part]+'」塗滿了','#fff'); }
  function pattern(){ snapUndo(); pat=(pat+1)%4; const g=me_.atlas.getContext('2d'),c2=unhex(recent[1]||'#ffffff'); g.fillStyle=hex(c2); g.fillRect(0,0,AW,AH); g.fillStyle=hex(col); const s=16;
    if(pat===0) for(let y=0;y<AH;y+=s*2) g.fillRect(0,y,AW,s); else if(pat===1) for(let y=0;y<AH;y+=s) for(let x=(y/s%2)*s/2;x<AW;x+=s){ g.beginPath(); g.arc(x,y,s*.3,0,TAU); g.fill(); } else if(pat===2) for(let y=0;y<AH;y+=s) for(let x=0;x<AW;x+=s){ if((x+y)/s%2<1) g.fillRect(x,y,s,s); } else { const r=mul(99); for(let k=0;k<160;k++){ g.beginPath(); g.ellipse(r()*AW,r()*AH,6+r()*16,4+r()*10,r()*3,0,TAU); g.fill(); } }
    me_.d.dirty(); sfx('click'); say(['條紋','點點','格子','迷彩'][pat]+'（用目前顏色＋上一個顏色）','#fff'); }
  function setCol(rgb,fromPick){ col=rgb.map(v=>Math.round(v)); const h=hex(col); recent=[h,...recent.filter(x=>x!==h)].slice(0,12); if(fromPick){ tool='brush'; sfx('pop'); } }
  /* ---- 輸入 ---- */
  const pos=e=>{ const r=canvas.getBoundingClientRect(),k=Math.min(r.width/W,r.height/H); return [(e.clientX-r.left-(r.width-W*k)/2)/k,(e.clientY-r.top-(r.height-H*k)/2)/k]; };
  const PAL={x:W-150,y:44,w:142};   // 右邊調色盤
  function palHit(x,y){ return phase==='hide'&&!waitAll&&x>=PAL.x-4&&x<=PAL.x+PAL.w+4&&y>=PAL.y-4&&y<=PAL.y+196; }
  function palAt(x,y){ const lx=x-PAL.x,ly=y-PAL.y; const [hh,ss,vv]=rgb2hsv(...col);
    if(ly>=26&&ly<=126&&lx>=0&&lx<=PAL.w){ setCol(hsv2rgb(hh,clamp(lx/PAL.w,0,1),clamp(1-(ly-26)/100,0,1))); return true; }
    if(ly>=132&&ly<=146){ setCol(hsv2rgb(clamp(lx/PAL.w,0,1)*359.9,Math.max(.35,ss),Math.max(.45,vv))); return true; }
    if(ly>=152&&ly<=190){ const i=Math.floor(lx/(PAL.w/6))+(ly>=172?6:0); if(recent[i]){ setCol(unhex(recent[i])); sfx('click'); } return true; } return false; }
  function onDown(e){ e.preventDefault(); const [x,y]=pos(e); ptr={x,y}; try{ canvas.setPointerCapture(e.pointerId); }catch(er){}
    if(cover){ sfx('click'); cover.fn(); return; }
    for(const b of BT) if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){ if(!b.dis){ b.fn(); if(!b.quiet) sfx('click'); } return; }
    if(palHit(x,y)){ drag={k:'pal'}; palAt(x,y); return; }
    if(phase==='hide'&&!waitAll&&me_){ const hd=pickRay(x,y,me_.d.meshes);
      if(tool==='pick'){ const h=pickRay(x,y,[...WD.solids,...me_.d.meshes]); if(h){ setCol(albedo(h),true); say('吸到顏色了，在人偶上塗塗看','#fff'); } return; }
      if(tool==='brush'&&hd){ snapUndo(); drag={k:'paint'}; paintHit(hd,true); return; }
      if(tool==='fill'&&hd){ fillPart(hd.object); return; }
      if(tool==='move'&&hd){ drag={k:selRot?'rot':'fig',x,y,lx:x,ly:y,moved:false}; return; } }
    drag={k:'look',x,y,lx:x,ly:y,moved:false}; }
  function onMove(e){ const [x,y]=pos(e); ptr={x,y}; if(!drag) return;
    if(drag.k==='pal'){ palAt(x,y); return; }
    if(drag.k==='paint'){ const hd=pickRay(x,y,me_.d.meshes); if(hd) paintHit(hd,false); else drag.lp=null; return; }
    if(drag.k==='fig'){ if(Math.hypot(x-drag.x,y-drag.y)>6) drag.moved=true; if(drag.moved){ const h=pickRay(x,y,WD.solids); if(h) stickTo(me_,h); } return; }
    if(drag.k==='rot'){ const dx=x-drag.lx,dy=y-drag.ly; drag.lx=x; drag.ly=y; if(Math.hypot(x-drag.x,y-drag.y)>6) drag.moved=true; if(drag.moved){ me_.ry-=dx*.02; me_.px=clamp((me_.px||0)+dy*.015,-Math.PI,Math.PI); placeFig(me_); } return; }
    if(drag.k==='look'){ const dx=x-drag.lx,dy=y-drag.ly; drag.lx=x; drag.ly=y; if(Math.hypot(x-drag.x,y-drag.y)>7) drag.moved=true;
      if(phase==='seek'||phase==='wait'||phase==='res'){ fp.yaw-=dx*.006*(fp.fov/64); fp.pitch=clamp(fp.pitch-dy*.005*(fp.fov/64),-1.3,1.2); } else { orb.yaw-=dx*.008; orb.pitch=clamp(orb.pitch+dy*.006,-.25,1.45); } } }
  function onUp(){ if(drag&&drag.k==='look'&&!drag.moved){ if(phase==='seek') tagAt(drag.x,drag.y); else if(phase==='hide'&&!waitAll&&tool==='move'&&me_){ const h=pickRay(drag.x,drag.y,WD.solids); if(h){ stickTo(me_,h); sfx('place'); } } }
    if(drag&&(drag.k==='fig'||drag.k==='rot')&&!drag.moved){ selRot=!selRot; say(selRot?'用箭頭或拖曳小人轉方向，再點一下小人結束':'可以拖曳小人搬到任何地方','#fff'); } drag=null; }
  function onWheel(e){ e.preventDefault(); if(phase==='hide') orb.dist=clamp(orb.dist*(e.deltaY<0?.85:1.18),1,12); else fp.fov=clamp(fp.fov*(e.deltaY<0?.85:1.18),18,75); }
  const noMenu=e=>e.preventDefault(); if(!pv){ canvas.addEventListener('contextmenu',noMenu); canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointermove',onMove); addEventListener('pointerup',onUp); canvas.addEventListener('wheel',onWheel,{passive:false}); }
  /* ---- 第一人稱移動與碰撞 ---- */
  function walk(dt){ const k=env.keys||{},f=(k.ArrowUp||k.KeyW?1:0)-(k.ArrowDown||k.KeyS?1:0),s=(k.ArrowRight||k.KeyD?1:0)-(k.ArrowLeft||k.KeyA?1:0); if(!f&&!s) return; const sp=3.2*dt,sy=Math.sin(fp.yaw),cy=Math.cos(fp.yaw);
    let nx=fp.x+(-sy*f+cy*s)*sp,nz=fp.z+(-cy*f-sy*s)*sp; nx=clamp(nx,-HALFL+.35,HALFL-.35); nz=clamp(nz,-HALFL+.35,HALFL-.35);
    for(const b of WD.boxes){ if(b.min.y>1.6||b.max.y<.3) continue; const r=.3; if(nx>b.min.x-r&&nx<b.max.x+r&&nz>b.min.z-r&&nz<b.max.z+r){ const px=Math.min(nx-(b.min.x-r),b.max.x+r-nx),pz=Math.min(nz-(b.min.z-r),b.max.z+r-nz); if(px<pz) nx=nx-(b.min.x-r)<b.max.x+r-nx?b.min.x-r:b.max.x+r; else nz=nz-(b.min.z-r)<b.max.z+r-nz?b.min.z-r:b.max.z+r; } } fp.x=nx; fp.z=nz; }
  /* ---- 每一格 ---- */
  const padEl=document.getElementById('pad'); let padV=null; /* 方向鍵只在走動找人時顯示，躲的時候不擋按鈕 */
  function update(dt){ dt=Math.min(dt,.05); t+=dt; if(padEl&&!pv){ const v=(phase==='seek'&&iSeek()&&!ai)||phase==='wait'?'':'hidden'; if(v!==padV){ padV=v; padEl.style.visibility=v; } } if(ban) ban.t+=dt; for(const m of marks) m.t+=dt; if(cover&&cover.auto!=null){ cover.auto-=dt; if(cover.auto<=0){ sfx('go'); cover.fn(); } } if(cover||ended) return;
    if(phase==='intro'){ PT-=dt; orb.yaw+=dt*.2; if(PT<=0){ if(pv){ demo(); return; } round=0; beginRound(); } return; }
    if(phase==='hide'||phase==='wait'){ PT-=dt; if(phase==='wait'){ walk(dt); } if(PT<=0&&phase==='hide'&&!waitAll) finishHide(); if(phase==='wait'&&host&&PT<-6){ net.send({ph:'seek'}); goSeekNet(); } if(phase==='hide'&&waitAll&&host&&PT<-6){ net.send({ph:'seek'}); goSeekNet(); } return; }
    if(phase==='seek'){ seekT+=dt; if(mode!=='net'||host){ PT-=dt; if(PT<=0) endSeek(); } else PT-=dt; if(!ai) walk(dt);
      if(ai){ const f=figs[0]; ai.nx-=dt; const close=seekT>ai.T*.7; if(close){ ai.tx=f.x+Math.cos(t)*1.6; ai.tz=f.z+Math.sin(t)*1.6; } else if(ai.nx<=0){ ai.nx=2+R()*2.5; ai.tx=(R()-.5)*14; ai.tz=(R()-.5)*14; }
        ai.x+=(ai.tx-ai.x)*Math.min(1,dt*.8); ai.z+=(ai.tz-ai.z)*Math.min(1,dt*.8); fp.x=ai.x; fp.z=ai.z; const want=close?Math.atan2(-(f.x-ai.x),-(f.z-ai.z)):fp.yaw+dt*.6; let dy=want-fp.yaw; while(dy>Math.PI) dy-=TAU; while(dy<-Math.PI) dy+=TAU; fp.yaw+=dy*Math.min(1,dt*(close?3:1)); fp.pitch=close?-.25:-.05;
        if(seekT>=ai.T&&found[0]==null){ judge(0); } }
      if(pv&&seekT>8) endSeek(); return; }
    if(phase==='res'){ PT-=dt; if(PT<=0){ if(pv){ conclude(); return; } if(mode==='net'&&!host){ PT=99; return; } nextAfterRes(); } } }
  /* ---- 畫面 ---- */
  const V3=new T.Vector3();
  function setCam(){ if(phase==='hide'||phase==='intro'||phase==='cover'){ const cp=Math.cos(orb.pitch); cam.position.set(orb.tx+Math.sin(orb.yaw)*cp*orb.dist,orb.ty+Math.sin(orb.pitch)*orb.dist,orb.tz+Math.cos(orb.yaw)*cp*orb.dist); cam.lookAt(orb.tx,orb.ty,orb.tz); cam.fov=60; }
    else { cam.position.set(fp.x,1.45,fp.z); cam.rotation.set(0,0,0); cam.rotation.order='YXZ'; cam.rotation.y=fp.yaw; cam.rotation.x=fp.pitch; cam.fov=fp.fov; } cam.updateProjectionMatrix(); }
  function proj(x,y,z){ V3.set(x,y,z).project(cam); return V3.z<1?[(V3.x+1)/2*W,(1-V3.y)/2*H]:null; }
  function draw(){ BT=[]; for(const [i,f] of figs.entries()){ const fd=found[i]!=null; f.d.mat.emissive&&f.d.mat.emissive.setRGB(fd?.15+.12*Math.sin(t*6):0,fd?.35+.15*Math.sin(t*6):0,0); }
    setCam(); rd.render(S3,cam); c.save(); c.setTransform(2,0,0,2,0,0); c.drawImage(cv3,0,0,W,H);
    // 標記：找到的人偶、自己的人偶、隊友
    if(phase==='seek'||phase==='res') figs.forEach((f,i)=>{ const mine=(mode==='net'&&team(f.who)===team(me))||(solo&&hidT===0); const show=found[i]!=null||phase==='res'||mine; if(!show) return; const tp=figCenter(f,1.45),p=proj(tp.x,tp.y,tp.z); if(!p) return; const lb=mode==='net'?names[f.who]:mine?'你':(found[i]!=null?'找到':'在這裡'); c.font='900 13px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.lineWidth=4; c.strokeStyle='#14122b'; c.strokeText(lb,p[0],p[1]); c.fillStyle=found[i]!=null?'#7aff8a':mine?'#ffd23f':'#ff6a6a'; c.fillText(lb,p[0],p[1]); });
    if(phase==='seek'&&iSeek()){ c.strokeStyle='rgba(255,255,255,.7)'; c.lineWidth=1.5; c.beginPath(); c.arc(ptr.x,ptr.y,10,0,TAU); c.stroke(); }
    for(const m of marks){ if(m.t>1) continue; c.fillStyle='rgba(255,60,80,'+(.35*(1-m.t))+')'; c.fillRect(0,0,W,H); }
    hud(); c.restore(); }
  const B=(x,y,w,h,label,fn,o)=>{ o=o||{}; BT.push(Object.assign({x,y,w,h,label,fn},o)); c.fillStyle=o.on?'#ffd23f':o.dis?'rgba(40,40,60,.7)':'rgba(20,18,43,.88)'; rrect(c,x,y,w,h,7); c.fill(); c.strokeStyle=o.on?'#fff':'rgba(255,255,255,.35)'; c.lineWidth=1.5; c.stroke();
    if(o.sw){ c.fillStyle=o.sw; rrect(c,x+5,y+5,w-10,h-10,5); c.fill(); c.strokeStyle='#fff'; c.stroke(); return; } c.fillStyle=o.on?'#14122b':'#fff'; c.font='800 '+(o.fs||12)+'px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(label,x+w/2,y+h/2+1); };
  function topBar(txt,col2){ c.fillStyle='rgba(10,10,28,.78)'; rrect(c,W/2-200,6,400,26,8); c.fill(); c.fillStyle=col2||'#fff'; c.font='900 13px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText(txt,W/2,20); }
  function palette(){ const P0=PAL,[hh,ss,vv]=rgb2hsv(...col); c.fillStyle='rgba(20,18,43,.88)'; rrect(c,P0.x-6,P0.y-6,P0.w+12,204,10); c.fill();
    c.fillStyle=hex(col); rrect(c,P0.x,P0.y,P0.w,20,5); c.fill(); c.strokeStyle='#fff'; c.lineWidth=1.5; c.stroke(); c.fillStyle=vv>.6&&ss<.5?'#14122b':'#fff'; c.font='800 10px '+TC; c.textAlign='center'; c.textBaseline='middle'; c.fillText('目前顏色',P0.x+P0.w/2,P0.y+10);
    const sx=P0.x,sy=P0.y+26; let g=c.createLinearGradient(sx,0,sx+P0.w,0); g.addColorStop(0,'#fff'); g.addColorStop(1,hex(hsv2rgb(hh,1,1))); c.fillStyle=g; c.fillRect(sx,sy,P0.w,100); g=c.createLinearGradient(0,sy,0,sy+100); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'#000'); c.fillStyle=g; c.fillRect(sx,sy,P0.w,100);
    c.strokeStyle='#fff'; c.lineWidth=2; c.beginPath(); c.arc(sx+ss*P0.w,sy+(1-vv)*100,5,0,TAU); c.stroke();
    for(let k=0;k<P0.w;k++){ c.fillStyle=hex(hsv2rgb(k/P0.w*360,1,1)); c.fillRect(sx+k,P0.y+132,1,14); } c.fillStyle='#fff'; c.fillRect(sx+hh/360*P0.w-1.5,P0.y+130,3,18);
    const sw=P0.w/6; recent.forEach((h2,i)=>{ const x=sx+(i%6)*sw,y=P0.y+152+(i>=6?20:0); c.fillStyle=h2; c.fillRect(x+1,y,sw-2,18); }); }
  function hud(){ const tm=Math.max(0,Math.ceil(PT)),doneN=()=>hiders().filter(i=>nFigs[i]).length+'/'+hiders().length;
    if(phase==='hide'){ if(waitAll){ topBar('你已藏好！等隊友… 已藏好 '+doneN()+'　剩 '+fmt(tm),'#7ae8ff'); B(W/2-110,H-50,220,40,'✔ 已藏好（點一下取消、繼續畫）',undoDone,{on:true,fs:13}); return; }
      topBar('躲藏 '+fmt(tm)+'　｜　'+(tool==='move'?(selRot?'用小人旁的箭頭轉方向（或拖曳小人），再點小人結束':'拖曳小人搬到任何地方（牆上、櫃子也行），點小人轉方向'):tool==='brush'?'在人偶上塗色（滾輪拉近拉遠）':tool==='fill'?'點人偶的部位整塊塗滿':'點任何東西吸它的顏色'),tm<=10?'#ff6a6a':'#fff');
      palette(); const y0=tbTop?38:H-80,bw=46,row=(i,j)=>[8+j*(bw+4),y0+i*38];
      const r1=[['◀姿勢',()=>{ me_.pose=(me_.pose+POSES.length-1)%POSES.length; placeFig(me_); say(POSES[me_.pose][0],'#fff'); }],['姿勢▶',()=>{ me_.pose=(me_.pose+1)%POSES.length; placeFig(me_); say(POSES[me_.pose][0],'#fff'); }],['↺ 轉',()=>{ me_.ry+=Math.PI/8; placeFig(me_); }],['↻ 轉',()=>{ me_.ry-=Math.PI/8; placeFig(me_); }],['縮小',()=>{ me_.s=clamp(r2(me_.s-.08),.3,1.1); placeFig(me_); }],['放大',()=>{ me_.s=clamp(r2(me_.s+.08),.3,1.1); placeFig(me_); }],['拉近',()=>{ orb.dist=clamp(orb.dist*.8,1,12); }],['拉遠',()=>{ orb.dist=clamp(orb.dist*1.25,1,12); }],['⇅',()=>{ tbTop=!tbTop; }]];
      r1.forEach(([l,f],j)=>{ const [x,y]=row(0,j); B(x,y,bw,32,l,f,{fs:11}); }); const [gx,gy]=row(0,r1.length); B(gx,gy,PAL.x-gx-14,32,'✔ 已藏好'+(mode==='net'?'（'+doneN()+'）':''),()=>finishHide(),{on:true,fs:13});
      const r2b=[['移動',()=>{ tool='move'; },tool==='move'],['畫筆',()=>{ tool='brush'; },tool==='brush'],['吸管',()=>{ tool='pick'; },tool==='pick'],['塗滿',()=>{ tool='fill'; },tool==='fill'],['粗細 '+(brush<6?'細':brush<11?'中':'粗'),()=>{ brush=brush<6?8:brush<11?16:4; }],['全身',()=>{ snapUndo(); const g=me_.atlas.getContext('2d'); g.fillStyle=hex(col); g.fillRect(0,0,AW,AH); me_.d.dirty(); say('全身塗滿','#fff'); }],['花紋',pattern],['復原',()=>{ if(undo.length){ me_.atlas.getContext('2d').putImageData(undo.pop(),0,0); me_.d.dirty(); } },false,!undo.length]];
      r2b.forEach(([l,f,on,dis],j)=>{ const [x,y]=row(1,j); B(x,y,bw,32,l,f,{on,dis,fs:11}); });
      if(selRot&&tool==='move'){ const cc=figCenter(me_),pp=proj(cc.x,cc.y,cc.z); if(pp){ const q=Math.PI/8,ax=clamp(pp[0],60,PAL.x-70),ay=clamp(pp[1],80,H-130),rr=50; /* 點小人後出現的方向箭頭：上下＝前後傾、左右＝轉向 */
        c.strokeStyle='rgba(255,210,63,.8)'; c.lineWidth=2; c.setLineDash([5,4]); c.beginPath(); c.arc(ax,ay,rr-8,0,TAU); c.stroke(); c.setLineDash([]);
        B(ax-17,ay-rr-17,34,30,'▲',()=>{ me_.px=(me_.px||0)-q; placeFig(me_); },{fs:15,quiet:true}); B(ax-17,ay+rr-13,34,30,'▼',()=>{ me_.px=(me_.px||0)+q; placeFig(me_); },{fs:15,quiet:true});
        B(ax-rr-17,ay-15,34,30,'◀',()=>{ me_.ry+=q; placeFig(me_); },{fs:15,quiet:true}); B(ax+rr-17,ay-15,34,30,'▶',()=>{ me_.ry-=q; placeFig(me_); },{fs:15,quiet:true});
        B(ax-22,ay+rr+20,44,24,'回正',()=>{ me_.px=0; me_.rl=0; placeFig(me_); },{fs:11}); } } }
    else if(phase==='wait'){ topBar(TM[hidT]+'正在躲… 已藏好 '+doneN()+'　最多 '+fmt(tm)+'後換你們找','#7ae8ff'); c.fillStyle='rgba(10,10,28,.35)'; c.fillRect(0,0,W,H); }
    else if(phase==='seek'){ const n=Object.keys(found).length; topBar((iSeek()?'走動找人，點一下抓':solo?'電腦正在找你…':'看'+TM[1-hidT]+'找人')+'　剩 '+fmt(tm)+'　找到 '+n+' / '+figs.length,tm<=10?'#ff6a6a':'#fff');
      if(iSeek()||mode==='net') B(W-96,H-40,88,32,fp.fov<40?'看全景':'望遠鏡',()=>{ fp.fov=fp.fov<40?64:28; }); }
    else if(phase==='res') topBar('第 '+(round+1)+' / '+NR+' 回合　'+SN[0]+' '+sc[0]+' 分　：　'+sc[1]+' 分 '+SN[1],'#ffd23f');
    else if(phase==='intro'){ c.fillStyle='rgba(10,10,28,'+(mode==='net'?.82:.35)+')'; c.fillRect(0,0,W,H); if(mode==='net') teamCard(); else { c.fillStyle='#fff'; c.font='900 30px '+TC; c.textAlign='center'; c.fillText(ST.name,W/2,H/2-10); c.font='700 14px '+TC; c.fillText('4 回合：兩邊各躲兩次、找兩次',W/2,H/2+22); } }
    if(cover){ c.fillStyle='rgba(10,10,28,.96)'; c.fillRect(0,0,W,H); c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#ffd23f'; c.font='900 34px '+TC; c.fillText(cover.txt,W/2,H/2-20); c.fillStyle='#fff'; c.font='700 15px '+TC; c.fillText(cover.sub,W/2,H/2+24); if(cover.auto!=null){ c.fillStyle='#7ae8ff'; c.font='900 18px '+TC; c.fillText(Math.ceil(cover.auto)+' 秒後自動開始（點一下馬上開始）',W/2,H/2+62); } }
    if(ban&&ban.t<2.2&&!cover){ const u=Math.min(1,ban.t*6),s=1+(1-u)*.6; c.save(); c.translate(W/2,H*.36); c.scale(s,s); c.globalAlpha=Math.min(1,(2.2-ban.t)*3); c.textAlign='center'; c.textBaseline='middle'; c.font='900 26px '+TC; c.lineWidth=7; c.strokeStyle='#14122b'; c.strokeText(ban.txt,0,0); c.fillStyle=ban.col; c.fillText(ban.txt,0,0); c.restore(); c.globalAlpha=1; } }
  function teamCard(){ c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#fff'; c.font='900 24px '+TC; c.fillText('分隊對戰　4 回合，兩隊各躲兩次',W/2,52);
    for(let tq=0;tq<2;tq++){ const x=W/2+(tq?170:-170),ms=[]; for(let i=0;i<N;i++) if(team(i)===tq) ms.push(i); c.fillStyle=TC2[tq]; rrect(c,x-140,84,280,40,10); c.fill(); c.fillStyle='#fff'; c.font='900 20px '+TC; c.fillText(TM[tq]+(tq===0?'（先躲）':'（先找）'),x,105);
      ms.forEach((i,j)=>{ const y=146+j*28; c.fillStyle=i===me?'#ffd23f':'#fff'; c.font=(i===me?'900 ':'700 ')+'17px '+TC; c.fillText((i===me?'▶ ':'')+names[i]+(i===me?'（你）':''),x,y); }); }
    c.fillStyle='#7ae8ff'; c.font='700 14px '+TC; c.fillText('躲的隊每人藏一個人偶（3 分鐘），對方最多找 5 分鐘；躲越久分數越高',W/2,H-40); }
  return {update,draw,destroy(){ canvas.removeEventListener('contextmenu',noMenu); canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('pointermove',onMove); removeEventListener('pointerup',onUp); canvas.removeEventListener('wheel',onWheel); rd.dispose(); if(padEl) padEl.style.visibility=''; },
    _dbg:{place:f=>placeFig(f),setRot(v){ selRot=v; },get selRot(){return selRot;},get phase(){return phase;},get me(){return me_;},get figs(){return figs;},get found(){return found;},get ai(){return ai;},get sc(){return sc;},get round(){return round;},get hidT(){return hidT;},finishHide,undoDone,judge,tagAt,set PT(v){PT=v;},get PT(){return PT;},get cover(){return cover;},visib:()=>visib(me_),autoPaint:()=>autoPaint(me_,STAGES[9]),fp,orb,setCol,get col(){return col;},get tool(){return tool;},set tool(v){tool=v;},placeFig,WD,proj,cam,setCam,pickRay}};
}
/* 開始畫面：畫作當示意（有 3D 截圖時大廳會用截圖） */
function stageShow(ctx,w,h,si,t){ const S=scene(si,1); ctx.drawImage(S,0,0,w,h); ctx.save(); ctx.scale(w/W,h/H); ctx.fillStyle='rgba(10,10,28,.35)'; ctx.fillRect(0,H-60,W,60); ctx.font='900 22px '+TC; ctx.textAlign='center'; ctx.fillStyle='#fff'; ctx.fillText('3D 場景：'+SCENES[si][0],W/2,H-24); ctx.restore(); }
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).hide={name:'塗裝躲躲樂',tag:'PAINT & HIDE 3D',color:'#ff7eb6',online:true,maxPlayers:12,
  desc:'白色小人偶躲進 3D 大空間！換個奇葩姿勢、貼在牆上櫃子邊，用吸管吸周圍的顏色或自己調色塗裝，把自己變成場景的一部分；換人時找的人在場景裡走來走去把大家揪出來。30 個場景：醫院、倉庫、工廠、超市、停車場、電影院…。可以跟電腦比、兩人輪流，或 2～12 人連線分兩隊對戰。',
  goal:'4 回合，兩邊各躲兩次、找兩次：藏人偶最多 3 分鐘（藏好按「已藏好」，連線要同隊全部按），找的一方最多找 5 分鐘、亂點扣 2 秒。人偶躲越久分數越高（1 秒 1 分，沒被找到 300 分），加起來高的贏。',
  stages:STAGES.map(s=>s.name),stars:STAGES.map(s=>s.stars),stageLabel:'選擇場景',
  stageGoal:i=>STAGES[i].name+'：你和電腦各躲兩次（我先躲／我先找），電腦會躲 '+STAGES[i].nHide+' 個人偶；越後面電腦眼力越好、塗得越像。',
  modes:[{id:'hide',label:'我先躲'},{id:'seek',label:'我先找'},{id:'2p',label:'雙人輪流'}],
  help:[['躲的時候','拖曳小人搬到任何地方（地上、牆上、櫃子都行）、拖曳空白處轉視角、滾輪拉近'],['點小人','出現方向箭頭：▲▼ 前後傾、◀▶ 轉向，也可以直接拖曳小人轉；再點一下結束'],['姿勢／轉／大小','擺出跟周圍融合的樣子'],['吸管、調色盤','吸周圍的顏色或自己選色，在人偶上塗'],['找的時候','方向鍵／WASD 走動、拖曳轉頭、點一下抓人（亂點扣 2 秒）']],
  touchHelp:[['躲的時候','拖曳小人搬到任何地方（牆上、櫃子也行）、拖曳空白處轉視角'],['點小人','出現方向箭頭轉方向，再點一下結束'],['吸管、調色盤','取色後在人偶上塗'],['找的時候','方向鍵走動、拖曳轉頭、點一下抓']],
  touch:{left:'dpad',right:[]},
  hubBest:()=>{ let n=0; for(let i=0;i<10;i++) n+=(hasWin('hide',i)?1:0)+(hasWin('seek',i)?1:0); return n?'過關 <b>'+n+' / 20</b>':'尚無紀錄'; },
  stageBest:i=>(hasWin('hide',i)?'躲 ★':'')+(hasWin('seek',i)?' 找 ★':''),
  livePreview:false,stageShow,thumb:(ctx,w,h,t)=>stageShow(ctx,w,h,Math.floor(t/4)%SCENES.length,t),load,ready:()=>!!window.THREE,create};
})();
