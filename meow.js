// 貓咪數獨：玩法和畫面參考 Meowdoku（Oakever Games）。N×N 的格子分成 N 個顏色區塊，
// 每一列、每一行、每一個顏色區塊都剛好放一隻貓，而且貓和貓不能相鄰（斜的也不行）。
// 關卡用固定的亂數種子產生，產生後確認只有唯一解；放錯貓會扣一顆愛心，三顆用完就失敗。
(function(){
'use strict';
const W=540,H=900,BX=20,BY=222,BS=500;
const PIX='"Press Start 2P","Noto Sans TC","Microsoft JhengHei",monospace';
const TC='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const LEVELS=100,LIVES=3,HINTS=3;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
// 1～10 關 4×4 到 7×7 入門；11～20 關 7×7、8×8；21～50 關 8×8、9×9；51 關以後 9×9、10×10
const sizeOf=i=>i<2?4:i<5?5:i<8?6:i<15?7:i<35?8:i<70?9:10;
const starsOf=i=>({4:1,5:1,6:2,7:2,8:3,9:4,10:5})[sizeOf(i)];
const fmt=s=>{ s=Math.floor(s); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };

/* ---- 關卡產生：先放好答案的貓，再長出顏色區塊，有第二個解就修改區塊直到唯一解 ---- */
function rng(seed){ return ()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function shuffle(a,R){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(R()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
const D4=[[1,0],[-1,0],[0,1],[0,-1]];
function solveCount(N,reg,limit){
  const colUsed=new Array(N).fill(false),regUsed=new Array(N).fill(false),pos=new Array(N),all=[];
  (function rec(r){ if(all.length>=limit) return; if(r===N){ all.push(pos.slice()); return; }
    for(let c=0;c<N;c++){ if(colUsed[c]) continue; const g=reg[r*N+c]; if(regUsed[g]) continue; if(r>0&&Math.abs(pos[r-1]-c)<=1) continue;
      colUsed[c]=regUsed[g]=true; pos[r]=c; rec(r+1); colUsed[c]=regUsed[g]=false; } })(0);
  return all;
}
// 大盤面（10×10 以上）用比較快的解法：每一步挑「能放的格子最少」的那一列／行／顏色來試
function solveFast(N,reg,limit){
  const units=[]; for(let r=0;r<N;r++) units.push([...Array(N).keys()].map(c=>r*N+c)); for(let c=0;c<N;c++) units.push([...Array(N).keys()].map(r=>r*N+c));
  for(let g=0;g<N;g++){ const u=[]; for(let k=0;k<N*N;k++) if(reg[k]===g) u.push(k); units.push(u); }
  const all=[],pos=new Array(N).fill(-1);
  (function rec(av,done){
    if(all.length>=limit) return; if(done===N){ all.push(pos.slice()); return; }
    let best=null,bn=1e9;
    for(let u=0;u<N;u++){ if(pos[u]>=0) continue; let n=0; for(const k of units[u]) if(av[k]) n++; if(n<bn){ bn=n; best=units[u]; } if(!n) return; }
    for(let u=N;u<3*N;u++){ const col=u<2*N; let filled=false,n=0; for(const k of units[u]){ if(col?pos[k/N|0]===k%N:pos[k/N|0]===k%N) filled=true; if(av[k]) n++; } if(filled) continue; if(!n) return; if(n<bn){ bn=n; best=units[u]; } }
    for(const k of best){ if(!av[k]) continue; const r=k/N|0,c=k%N,nv=av.slice();
      for(let j=0;j<N*N;j++){ const r2=j/N|0,c2=j%N; if(r2===r||c2===c||reg[j]===reg[k]||Math.abs(r2-r)<=1&&Math.abs(c2-c)<=1) nv[j]=0; }
      pos[r]=c; rec(nv,done+1); pos[r]=-1; if(all.length>=limit) return; }
  })(new Uint8Array(N*N).fill(1),0);
  return all;
}
function connected(N,reg,g){ let st=-1,n=0; for(let k=0;k<N*N;k++) if(reg[k]===g){ n++; if(st<0) st=k; } if(!n) return false; const seen=new Set([st]),q=[st];
  while(q.length){ const k=q.pop(),r=k/N|0,c=k%N; for(const [dr,dc] of D4){ const rr=r+dr,cc=c+dc,kk=rr*N+cc; if(rr>=0&&rr<N&&cc>=0&&cc<N&&reg[kk]===g&&!seen.has(kk)){ seen.add(kk); q.push(kk); } } } return seen.size===n; }
const cache={};
// 100 關事先產生好（每關都確認過唯一解），直接讀取；格式：邊長|每格區塊|每列貓的位置|區塊配色，數字用 36 進位
const DATA=[
"4|0001003122312233|1302|457280631",
"4|0001221122312233|1302|673582104",
"5|1100011020122221243344443|30241|432018765",
"5|2220022111244332433324433|42031|830472516",
"5|0000132021322213332133341|14203|532467801",
"6|000111000133021133022133224433255553|031524|108742365",
"6|110002111122432222433522444522555522|415203|205684317",
"6|222202211222412223411333441355445555|413502|826140753",
"7|0000111000013102403310243311044331144655554666655|0614253|240365781",
"7|3111100331110231111023331112463555246625226622222|5362041|187456230",
"7|0000011333200133220113355511335544163554116335411|4631520|207156384",
"7|1100002311122231442243344444555546655556665566666|3150426|520837416",
"7|1110022110002211002253340225434225544425556666555|4150263|150382746",
"7|2220011222333142233314226633444653344465534466553|3615042|643205178",
"7|0000111000211302223332223344222244625555665555666|0413526|604273581",
"8|5522211055221111552244315524443355446333577666635577766377777663|74263051|506273481",
"8|0002221100022211300255553302255566044755644477576447775767777777|27314605|614832507",
"8|0000000130001111300002213302224433022224637755546377775533777755|24617503|450728136",
"8|2222000022221033252240332522433325544333554443365766633657666666|64253071|165340827",
"8|1110000211133022413333324435333564555555666665776666677766667777|30741526|746132805",
"8|0011111103333211033332225333344456634444566677746667777466777777|17536024|027836514",
"8|3310000031110022333100223431502244335022443555524446655547466655|53720641|671254803",
"8|2111110021114144222144441111344411133444173375556773777577777555|63147502|216574308",
"8|0000012230040122300444223444444233444642756666627776662277777666|35706142|261357840",
"8|0000011100000001422333314233311144333311644435556444355566647755|37241605|041263758",
"8|1111100011111100111111023333222234444422335544423375556237766666|53704261|627453018",
"8|1111200011142230114422335154227355544277555544776666444766666677|51473026|806152743",
"8|1000000011100400211334041113444455177774555577745777766657777776|52037164|056348721",
"8|1111122014444522114445223334455536344457663455576664775766667777|70613524|036287415",
"8|0001111100033161220333662004437624447776544477765774776677777777|27153064|283470651",
"8|2001111120033311225433335254344355544433775666667777766677777766|16074253|276403185",
"8|2220000122000011622553336622544362255444667557746677774466777744|46175302|701568423",
"8|0001111103311222033152223335526247335262477555664775566644775666|14620573|785026314",
"8|1111100033112220311222223555522235555224333556663333556637666666|52407361|354216078",
"8|3330002233400112334400123344451173466555776665557777666677777666|35702641|031286754",
"9|112222230111122230112222233111253333411553333465555377668855577688557577888877777|824605173|724183650",
"9|555500011500003113550203333522223347552222347555622277556666777855886877888888877|463570281|726518430",
"9|112222220112222222111233222133232222133334422133444455766644555768844448778888888|816257304|754836201",
"9|002222111022222133023333333424333333424443333424463555444668855644687885666688885|061428357|308615274",
"9|200000001222200011222221113222221133224441433265744433665777433667744433887777777|574862031|385640712",
"9|222222001232522211335522221355444444855546666855576666857776766857777776887777666|685042731|746235810",
"9|000011115020113355020133555220433335244433355224777755224677755888887757888888777|041627385|207816345",
"9|122222200111112220146222230446662530466666555447666555777768858777768888777778888|813706425|516482307",
"9|222000111222003111552033414553334444555366646577376666777776666777766666778866666|582470613|274315608",
"9|111111002555111222511113222555443332544444332555577333855777776888877777888887777|637520841|640231578",
"9|225111100225531140255533440225533344555333444555566664555666666858666667888866666|750461382|827150346",
"9|220001111200111133200213335222213335222443355224473555264475555866477555866775555|263748150|218364057",
"9|111110000110011102111000002111333002333363422535663422555766442577766644587777644|708462531|026854731",
"9|331111000631112020631142220633344422655344422655574422665777442655557444857777744|847263150|837506124",
"9|222220011222622013226644033222645533777644535766644555777664455787668455788888888|571846302|672158430",
"9|111122300111222333112223334111233444121235554122255544175555646777757666787777766|702584631|107648253",
"9|011122222111142225313144225333446655344466675366666775366667777388667777388888777|026138475|056287431",
"9|222244100222244105223244445723644445776664445776444555776666885777886888777788888|860257314|025417863",
"9|111111100311322222333334442553344444755444444757446666777886866778886886778888886|728361504|412087563",
"9|333222110332222111322522241325544444225544464855746666855746666857746666887777666|864052731|328146057",
"9|000000111020001111220001113220001313240003333245566383444776688444776668444788888|250813647|735826410",
"9|000000003002222213000023233000023333406222358446666558766786888776786888777788888|274806135|573108246",
"9|444113000444113220444113323441133323646655333666665555686665775686665577688885777|637415082|861705342",
"9|000221111000021141003221141553333441553334441553444466555566466788886666888886666|263571804|601834275",
"9|000111111001113555201413355224433355244433555744338565744338866774888888774888888|240536817|047831625",
"9|440022221400002221400222333443333333444733553467733355467775555668777555688775555|384607152|764201835",
"9|222200001224000011224333333424443633444446635446666335444666665444766665488777555|470528631|236407158",
"9|221111100222211110222244410222245433666655444655555744666557744665557444866577744|742863150|381564207",
"9|000000221333002221333502224355555224333355544775556664755556864757778864777788888|186073524|687420513",
"9|000000111220011114200111444223355447665555547655555577666557777888557777885555777|460375281|751283406",
"9|888002211888002213888022223880022233800224236855544436877546666887747766888777766|374851620|107285463",
"9|322210066332111166332144446333144446353444466555784446575788466575788466777788886|642051837|617520834",
"9|330022222330022221333544224333554444366554454336555554366555557666587777668888887|286053174|631705482",
"9|000000111000001122000331112665533444665553744666553774666653374666553777866777777|258473160|751328460",
"9|111100000111111110311121200311322240333332240555332244655552774685877777888877777|846372051|056172438",
"10|0000002211000044211100004221110000422131505442213355522221337755522866755559988677799988667777999866|2758319064|09174b863a52",
"10|3331111110331111210033112222203331122222335114442235557464445557766444555776664857577688885777888899|9240715368|a6835b907142",
"10|1112222200121222222012224424001114444443777454466675555466667799888686799998888699888898869999999888|8269537041|a239b5781064",
"10|0000111222031112222233442226283444425668444555566845555776884557577668555777668855577778887777777988|1360248597|651304b7829a",
"10|4444444000443000000143332222224333227772455322772255537277725577777766855777677688979766668999966666|7963028514|a6893127b540",
"10|1111222000313322220031133252203333225550344344445534444555557777445556799944466699444666869999444666|7152469083|6128795a043b",
"10|2200000111322224441433324444443335544444775555486675555588667755888666777788888679778888667977888866|5830649271|037189a645b2",
"10|1111110000111111300022131330005223333000525333364455533366645555566677555888677755586667778888866797|6204915738|16a02395b874",
"10|1111000000111110200433111020043313122224333332224433533222443555552226377586622677788866669998888866|7463829150|0a731826b459",
"10|1112222000111111255014111225501433322550447733350044473355004777755506444777999647777999884777998888|7152069384|03829a16b574",
"10|0000000000000000000122220031112233033111423333511144533559164453557966455555799648555579968887777996|4935028617|937518ab4620",
"10|2200000000211100000021310600002233366000223336666455333666665335566666555588697755555869795558886999|4203916857|29a7354b8016",
"10|0000000000111000000013333002001133322222133333552411335554446166555555666775555566777788557777998888|8172950364|750164ab8239",
"10|1111111000123333110012233333301423333330142223533014442556661445255766144555776614777777781449888888|7024158693|3894027b1a56",
"10|3331110000333111100723333310072233511707445551177764555177776665557777665587797966888899796688889999|9603142857|91436a50287b",
"10|0000000000100000400012200040401220534040125553444412225344741922536777995558877795555888889958888888|3025846971|a7490132b865",
"10|2011111333221111443322222144352222114335222224433527776443552766644445277644445577666669987799999998|1307584296|3907b46185a2",
"10|0000001111000001100100220000010322222041555222444759556664775965564447596666777759686687779988888887|4931725860|397610a5b842",
"10|2220000001252022211155222223335554243333665444333365554443336668888333667888883399988333339998883333|7968530241|ab7109856342",
"10|2222200000222220031055522203115552400333555244446675555444667777544496787788499978878889998888889999|5837419026|a924b5173086",
"10|0000000111022001113322220033352423303535242333355544444455554444666555747477666577777866657797888885|4738196052|13a2b4869057",
"10|3331111000333111111055331412005333344220553844222055588442225558886677555888966755888899778888899977|8371406925|2804ba675139",
"10|2200000000220001010022110111102111114443227511144422755644442277566668727556666872755556887779666668|2519746083|5603b18a2974",
"10|0000011111000011111322000113332222031333444433333346444333354644973355666497337568689773778888997777|4607291835|61238547b0a9",
"10|1111111100311111000033111102223333122224335522522433355254446655555544777755559478777759948877779994|8572940316|89361a5b7204",
"10|1100000000111140000311414230031141423333544442333354442233335555663666556666667685868677778888866799|6157304829|384b7a295016",
"10|1110000022111110002214144430021444643332888664435288866645558888665595866666799589999999999999999999|3197584602|50b974a26381",
"10|1100000033100020033311522223331152233333145222223344558866634455866663477888866677888896667788999666|7059138246|6b4a17203598",
"10|9000000000901100004493311044429333115544933333554493333555449335556666977555666699799988669999999996|4293857160|93285041b6a7",
"10|2221111100221111000022211114402111444453222444555322224555337777665993777786889977778888997777888999|8209364157|14079a3b5826"
];
function genLevel(i,salt){
  if(!salt&&cache[i]) return cache[i];
  if(!salt&&DATA[i]){ const p=DATA[i].split('|'),d=x=>[...x].map(ch=>parseInt(ch,36)); return cache[i]={N:+p[0],reg:d(p[1]),sol:d(p[2]),colors:d(p[3])}; }
  const N=sizeOf(i),R=rng(i*7919+101+(salt||0)*1000003);
  for(let att=0;att<300;att++){
    const p=[],used=new Array(N).fill(false);
    const place=r=>{ if(r===N) return true; for(const c of shuffle([...Array(N).keys()],R)){ if(used[c]||(r&&Math.abs(p[r-1]-c)<=1)) continue; used[c]=true; p[r]=c; if(place(r+1)) return true; used[c]=false; } return false; };
    place(0);
    const reg=new Array(N*N).fill(-1),size=new Array(N).fill(1); for(let r=0;r<N;r++) reg[r*N+p[r]]=r;
    for(let left=N*N-N;left>0;left--){ // 小的區塊比較容易長大，區塊大小才不會差太多
      const cand=[]; let tot=0;
      for(let g=0;g<N;g++){ const fr=[]; for(let k=0;k<N*N;k++) if(reg[k]===g){ const r=k/N|0,c=k%N; for(const [dr,dc] of D4){ const rr=r+dr,cc=c+dc; if(rr>=0&&rr<N&&cc>=0&&cc<N&&reg[rr*N+cc]<0) fr.push(rr*N+cc); } }
        if(fr.length){ const w=Math.pow(size[g],-1.6); cand.push([g,fr,w]); tot+=w; } }
      let x=R()*tot,pick=cand[0]; for(const c of cand){ x-=c[2]; if(x<=0){ pick=c; break; } }
      const k=pick[1][Math.floor(R()*pick[1].length)]; reg[k]=pick[0]; size[pick[0]]++;
    }
    for(let it=0;it<400;it++){
      const all=N>9?solveFast(N,reg,2):solveCount(N,reg,2); if(all.length===1){ const colors=shuffle([...Array(N>9?12:9).keys()],R); const L={N,reg,sol:all[0],colors}; if(!salt) cache[i]=L; return L; }
      const alt=all.find(q=>q.some((c,r)=>c!==p[r])); if(!alt) break;
      let done=false; // 把另一個解裡某隻貓的格子改到隔壁的區塊，讓那個解不成立
      for(const r of shuffle([...Array(N).keys()],R)){ if(alt[r]===p[r]) continue; const k=r*N+alt[r],g=reg[k],nb=[];
        for(const [dr,dc] of D4){ const rr=r+dr,cc=alt[r]+dc; if(rr>=0&&rr<N&&cc>=0&&cc<N&&reg[rr*N+cc]!==g) nb.push(reg[rr*N+cc]); }
        if(!nb.length) continue; reg[k]=-2; if(!connected(N,reg,g)){ reg[k]=g; continue; }
        reg[k]=nb[Math.floor(R()*nb.length)]; done=true; break; }
      if(!done) break;
    }
  }
  return null;
}

/* ---- 顏色與貓（畫面參考 Meowdoku：米白底、圓角色塊、白色叉叉、賓士貓） ---- */
const PALETTE={
  classic:['#ffb5a7','#ffd98e','#a9def9','#d0c4ff','#b9f2d0','#f7c8e0','#ffe5b4','#c5e6a6','#bde0fe','#fcd5ce','#e4c1f9','#d8e2dc'],
  candy:['#ff8fab','#ffd166','#7ec8ff','#c3a6ff','#5ee0c8','#ff9f68','#ef6fb0','#ffc4ec','#a6e3a1','#f2e86d','#6f8cff','#d8d0c8'],
  forest:['#d98b6a','#e8c56a','#7fb3c9','#a8a0cf','#6fbf9f','#8c6a48','#c2627e','#e6a8c8','#9cc47e','#5f8f6a','#c9a080','#b8b8a8']
};
const CATS={
  tuxedo:{body:'#2c2a31',patch:'#ffffff',ear:'#f0a0b4',eyeIris:'#c9d96a'},
  orange:{body:'#f2a03d',patch:'#fff6ea',ear:'#ffb8a8',eyeIris:'#8fc27a',stripe:'#d9802a'},
  gray:{body:'#8e95a6',patch:'#f4f5f8',ear:'#f0b4c0',eyeIris:'#7fd4e6',stripe:'#6f7688'},
  white:{body:'#fbf8f3',patch:'#ffffff',ear:'#ffc0cc',eyeIris:'#7ab8f0',line:1},
  calico:{body:'#fbf8f3',patch:'#ffffff',ear:'#ffc0cc',eyeIris:'#d9b24a',calico:1,line:1}
};
// 麻糬貓：圓滾滾的全身坐姿＋捲尾巴，豆豆眼；s 是格子大小；mood 0 平常、1 開心、2 驚嚇
function drawCat(c,x,y,s,kind,t,mood,seed){
  const K=CATS[kind]||CATS.orange,r=s*.34,lw=Math.max(1,s*.03),OL='#4a3428'; seed=seed||0;
  c.save(); c.translate(x,y+r*.18); c.lineJoin='round'; c.lineCap='round';
  const sway=Math.sin(t*2+seed)*.15;
  // 捲尾巴
  c.strokeStyle=OL; c.lineWidth=r*.32+lw*2; c.beginPath(); c.moveTo(r*.7,r*.55); c.quadraticCurveTo(r*1.35,r*.5,r*1.2,r*(-.05+sway)); c.stroke();
  c.strokeStyle=K.calico?'#f2a03d':K.body; c.lineWidth=r*.32; c.stroke();
  // 身體＋頭（一顆麻糬）
  const body=()=>{ c.beginPath(); c.moveTo(-r*.95,r*.75); c.quadraticCurveTo(-r*1.05,-r*.95,0,-r*.98); c.quadraticCurveTo(r*1.05,-r*.95,r*.95,r*.75); c.quadraticCurveTo(0,r*.95,-r*.95,r*.75); c.closePath(); };
  // 耳朵
  for(const sd of [-1,1]){ c.fillStyle=K.calico?(sd<0?'#f2a03d':'#3a3440'):K.body; c.beginPath(); c.moveTo(sd*r*.78,-r*.55); c.lineTo(sd*r*.72,-r*1.22); c.lineTo(sd*r*.25,-r*.9); c.closePath(); c.fill(); c.strokeStyle=OL; c.lineWidth=lw; c.stroke();
    c.fillStyle=K.ear; c.beginPath(); c.moveTo(sd*r*.66,-r*.68); c.lineTo(sd*r*.64,-r*1.06); c.lineTo(sd*r*.38,-r*.88); c.closePath(); c.fill(); }
  c.fillStyle=K.body; body(); c.fill();
  c.save(); body(); c.clip();
  if(K.calico){ c.fillStyle='#f2a03d'; c.beginPath(); c.ellipse(-r*.6,-r*.55,r*.55,r*.45,.3,0,7); c.fill(); c.fillStyle='#3a3440'; c.beginPath(); c.ellipse(r*.7,r*.2,r*.45,r*.5,0,0,7); c.fill(); }
  if(K.stripe){ c.strokeStyle=K.stripe; c.lineWidth=r*.1; for(const dx of [-.22,0,.22]){ c.beginPath(); c.moveTo(dx*r,-r*.98); c.lineTo(dx*r*.8,-r*.66); c.stroke(); } for(const sd of [-1,1]){ c.beginPath(); c.moveTo(sd*r*.98,r*.1); c.lineTo(sd*r*.7,r*.15); c.stroke(); } }
  c.fillStyle=K.patch; c.beginPath(); c.ellipse(0,r*.55,r*.55,r*.38,0,0,7); c.fill(); // 白肚子
  c.restore();
  c.strokeStyle=OL; c.lineWidth=lw*1.2; body(); c.stroke();
  // 小腳
  c.fillStyle=K.patch; for(const sd of [-1,1]){ c.beginPath(); c.ellipse(sd*r*.38,r*.82,r*.2,r*.13,0,0,7); c.fill(); c.strokeStyle=OL; c.lineWidth=lw; c.stroke(); }
  // 豆豆眼、腮紅、ω 嘴
  const blink=mood===0&&((t*.6+seed*.37)%5)<.13,ey=-r*.32;
  for(const sd of [-1,1]){ const ex=sd*r*.36;
    if(blink||mood===1){ c.strokeStyle=OL; c.lineWidth=r*.08; c.beginPath(); if(mood===1) c.arc(ex,ey+r*.06,r*.12,Math.PI*1.15,Math.PI*1.85); else { c.moveTo(ex-r*.12,ey); c.lineTo(ex+r*.12,ey); } c.stroke(); continue; }
    c.fillStyle=OL; c.beginPath(); c.ellipse(ex,ey,r*(mood===2?.14:.1),r*(mood===2?.16:.13),0,0,7); c.fill();
    c.fillStyle='#fff'; c.beginPath(); c.arc(ex-r*.03,ey-r*.05,r*.04,0,7); c.fill(); }
  c.fillStyle='rgba(255,120,140,.55)'; for(const sd of [-1,1]){ c.beginPath(); c.ellipse(sd*r*.62,-r*.12,r*.15,r*.09,0,0,7); c.fill(); }
  c.strokeStyle=OL; c.lineWidth=Math.max(1,r*.06);
  if(mood===2){ c.beginPath(); c.ellipse(0,-r*.08,r*.08,r*.1,0,0,7); c.stroke(); }
  else { c.beginPath(); c.moveTo(-r*.14,-r*.14); c.quadraticCurveTo(-r*.07,-r*.04,0,-r*.13); c.quadraticCurveTo(r*.07,-r*.04,r*.14,-r*.14); c.stroke(); }
  c.restore();
}
const mixc=(hex,k)=>{ const n=parseInt(String(hex).slice(1),16); if(isNaN(n)) return hex; return 'rgb('+[(n>>16)&255,(n>>8)&255,n&255].map(v=>Math.round(v*k)).join(',')+')'; };
// 肉球記號（代替叉叉）
function paw(c,x,y,s,col){ c.fillStyle=col; c.beginPath(); c.ellipse(x,y+s*.18,s*.3,s*.24,0,0,7); c.fill(); for(const [dx,dy] of [[-.3,-.18],[-.1,-.36],[.1,-.36],[.3,-.18]]){ c.beginPath(); c.ellipse(x+dx*s,y+dy*s,s*.11,s*.13,0,0,7); c.fill(); } }
// 貓罐頭（代替愛心）
function can(c,x,y,s,on){ c.save(); c.translate(x,y); c.globalAlpha=on?1:.3; c.fillStyle='#c9ced8'; c.beginPath(); c.ellipse(0,-s*.32,s*.42,s*.12,0,0,7); c.fill(); c.fillStyle=on?'#ff8a5c':'#b8b0a8'; c.fillRect(-s*.42,-s*.32,s*.84,s*.6); c.fillStyle='#c9ced8'; c.beginPath(); c.ellipse(0,s*.28,s*.42,s*.12,0,0,7); c.fill(); c.fillStyle='#fff'; c.font='900 '+Math.round(s*.34)+'px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('🐟',0,0); c.restore(); }
function rrect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function floor(c,w,y,h,t){ // 下方的木地板和毛線球
  c.fillStyle='#c8956a'; c.fillRect(0,y,w,h); c.strokeStyle='rgba(90,55,30,.35)'; c.lineWidth=2; for(let x=-40;x<w;x+=90){ c.beginPath(); c.moveTo(x,y); c.lineTo(x+30,y+h); c.stroke(); }
  c.fillStyle='rgba(255,255,255,.15)'; c.fillRect(0,y,w,4);
  const ball=(x,yy,r,col)=>{ c.fillStyle=col; c.beginPath(); c.arc(x,yy,r,0,7); c.fill(); c.strokeStyle='rgba(255,255,255,.55)'; c.lineWidth=1.5; for(let i=-2;i<=2;i++){ c.beginPath(); c.ellipse(x,yy,r*.95,r*.35,.6+i*.35,0,7); c.stroke(); } };
  ball(70+Math.sin(t*.8)*6,y+h*.55,16,'#ff7aa8'); ball(w-80,y+h*.6,13,'#7ac8ff'); c.strokeStyle='#ff7aa8'; c.lineWidth=2; c.beginPath(); c.moveTo(86+Math.sin(t*.8)*6,y+h*.6); c.quadraticCurveTo(150,y+h*.95,210,y+h*.7); c.stroke();
}
/* ---- 紀錄：每一關最快時間 ---- */
const recKey=i=>'arcade.meow.t.'+i,getRec=i=>{ try{ const v=parseFloat(localStorage.getItem(recKey(i))); return isFinite(v)?v:null; }catch(e){ return null; } };
const cleared=()=>{ let n=0; for(let i=0;i<LEVELS;i++) if(getRec(i)!=null) n++; return n; };
const autoKey='arcade.meow.auto',getAuto=()=>{ try{ return localStorage.getItem(autoKey)!=='0'; }catch(e){ return true; } };

function create(env,opts){
  const L=opts.look||{cat:'orange',theme:'classic'};
  let lv=clamp(opts.stage||0,0,LEVELS-1); while(lv>0&&getRec(lv-1)==null) lv--; // 還沒解鎖的關卡就退回最新可以玩的那關
  const P=genLevel(lv),N=P.N;
  const GAP=0,CS=BS/N; // 格子緊貼在木框裡（不再是分開的圓角方塊） // 每格是一塊獨立的圓角色塊
  const pal=PALETTE[L.theme]||PALETTE.classic,regCol=g=>pal[P.colors[g]%pal.length];
  const {ctx:c,canvas}=env.canvas2d(W,H);
  const st=new Array(N*N).fill(0); // 0 空、1 叉叉、2 貓、3 自動叉叉
  let lives=LIVES,hints=HINTS,mistakes=0,t=0,ended=false,winT=-1,cur=-1,shake=0,hist=[],auto=getAuto(),ruleHi=-1,ruleT=0;
  const pop=new Array(N*N).fill(0),wrong=new Array(N*N).fill(0),hintK=new Set(),fx=[],glow=[];
  const RC=k=>[k/N|0,k%N];
  const cellX=k=>BX+GAP+(k%N)*(CS+GAP),cellY=k=>BY+GAP+(k/N|0)*(CS+GAP);
  const cellXY=k=>[cellX(k)+CS/2,cellY(k)+CS/2];
  const sees=(a,b)=>{ const [r,cc]=RC(a),[r2,c2]=RC(b); return r2===r||c2===cc||P.reg[a]===P.reg[b]||Math.abs(r2-r)<=1&&Math.abs(c2-cc)<=1; };
  function refreshAuto(){ for(let k=0;k<N*N;k++) if(st[k]===3) st[k]=0;
    if(auto) for(let k=0;k<N*N;k++) if(st[k]===2) for(let j=0;j<N*N;j++) if(j!==k&&st[j]===0&&sees(k,j)) st[j]=3; }
  refreshAuto();
  const catCount=()=>st.filter(v=>v===2).length;
  let grp=null; // 一次拖曳算一步
  function setCell(k,v){ if(st[k]===v) return; if(grp) grp.push([k,st[k]]); else hist.push([[k,st[k]]]); st[k]=v; }
  function tryCat(k){
    if(ended||st[k]===2) return; const [r,cc]=RC(k);
    if(P.sol[r]===cc){ hist.push([[k,st[k]]]); st[k]=2; pop[k]=1; hintK.delete(k); refreshAuto(); env.sfx('item');
      const reg=[]; for(let j=0;j<N*N;j++) if(P.reg[j]===P.reg[k]) reg.push(j); glow.push({cells:reg,t:0},{row:r,t:0},{col:cc,t:0}); // 這隻貓管到的列、行、顏色亮一下
      if(catCount()===N) win(); }
    else { // 放錯：看違反哪一條規則，就把那條規則亮起來
      ruleHi=2; for(let j=0;j<N*N;j++) if(st[j]===2){ const [r2,c2]=RC(j); if(P.reg[j]===P.reg[k]){ ruleHi=0; break; } if(r2===r||c2===cc) ruleHi=1; else if(Math.abs(r2-r)<=1&&Math.abs(c2-cc)<=1&&ruleHi!==1) ruleHi=2; }
      ruleT=1.6; lives--; mistakes++; wrong[k]=1; shake=.35; st[k]=1; env.sfx('hurt'); if(lives<=0) lose(); }
  }
  function hint(){ // 提示：在一定有貓的格子上打個問號（不直接放貓）
    if(ended||hints<=0) return;
    let best=-1,bn=1e9; for(let g=0;g<N;g++){ let has=false,n=0; for(let k=0;k<N*N;k++) if(P.reg[k]===g){ if(st[k]===2) has=true; else if(st[k]===0) n++; } if(!has&&n<bn&&![...hintK].some(k=>P.reg[k]===g)){ bn=n; best=g; } }
    if(best<0) return; for(let r=0;r<N;r++) if(P.reg[r*N+P.sol[r]]===best){ const k=r*N+P.sol[r]; hintK.add(k); if(st[k]===1||st[k]===3) st[k]=0; }
    hints--; env.sfx('beep');
  }
  function undo(){ if(ended) return; const h=hist.pop(); if(!h) return; for(let i=h.length-1;i>=0;i--) st[h[i][0]]=h[i][1]; refreshAuto(); env.sfx('click'); }
  function restart(){ if(ended) return; for(let k=0;k<N*N;k++) if(st[k]!==2||k!==giftK) st[k]=0; hist=[]; hintK.clear(); refreshAuto(); env.sfx('click'); }
  const giftK=-1; // 每關一開始都沒有貓，只有一格的顏色區塊也要自己放
  function toggleAuto(){ auto=!auto; try{ localStorage.setItem(autoKey,auto?'1':'0'); }catch(e){} refreshAuto(); env.sfx('click'); }
  function win(){ ended=true; winT=0; const time=t,old=getRec(lv); let rec=false;
    if(old==null||time<old){ rec=true; try{ localStorage.setItem(recKey(lv),String(time)); }catch(e){} }
    env.sfx('win');
    setTimeout(()=>env.end({title:'找到所有貓咪了！',big:fmt(time),text:'關卡 '+(lv+1)+'（'+N+'×'+N+'）完成，錯了 '+mistakes+' 次、用了 '+(HINTS-hints)+' 次提示。'+(rec?'這關的新紀錄！':'這關最快 '+fmt(old)),score:cleared(),next:lv<LEVELS-1}),2000); }
  function lose(){ ended=true; env.sfx('lose'); setTimeout(()=>env.end({title:'愛心用完了',big:'',text:'放錯 3 次貓了。先用叉叉把不可能的格子排除，確定了再點兩下放貓！',score:null}),900); }

  /* ---- 操作：點一下打叉／取消，點兩下放貓，點貓拿掉；按住拖曳可以連續打叉 ---- */
  const BTN=[{id:'undo',label:'復原'},{id:'hint',label:'提示'},{id:'auto',label:'自動'},{id:'reset',label:'重來'}];
  BTN.forEach((b,i)=>{ b.w=112; b.x=W/2-(4*b.w+3*12)/2+i*(b.w+12); b.y=BY+BS+16; b.h=46; });
  function toLogical(e){ const r=canvas.getBoundingClientRect(),s=Math.min(r.width/W,r.height/H),ox=(r.width-W*s)/2,oy=(r.height-H*s)/2; return [(e.clientX-r.left-ox)/s,(e.clientY-r.top-oy)/s]; }
  const cellAt=(x,y)=>{ const cc=Math.floor((x-BX-GAP/2)/(CS+GAP)),r=Math.floor((y-BY-GAP/2)/(CS+GAP)); return r>=0&&r<N&&cc>=0&&cc<N?r*N+cc:-1; };
  let drag=null,lastTap={k:-1,t:-9};
  function onDown(e){ e.preventDefault(); const [x,y]=toLogical(e);
    for(const b of BTN) if(x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h){ ({undo,hint,auto:toggleAuto,reset:restart})[b.id](); return; }
    const k=cellAt(x,y); if(k<0||ended) return; cur=k;
    try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
    // 點一下打叉／取消叉叉，點兩下放貓（兩下間隔 0.45 秒內），點貓拿掉
    const now=performance.now()/1000,dbl=lastTap.k===k&&now-lastTap.t<.45; lastTap={k,t:now};
    if(dbl&&st[k]!==2){ lastTap.k=-1; drag=null; grp=null;
      const h=hist[hist.length-1]; if(h&&h.length===1&&h[0][0]===k){ hist.pop(); st[k]=h[0][1]; } // 第一下打的叉叉不算，直接放貓
      tryCat(k); return; }
    if(st[k]===2){ if(k===giftK) return; setCell(k,0); refreshAuto(); env.sfx('click'); drag=null; return; }
    grp=[];
    if(st[k]===1){ setCell(k,0); drag={mode:'clear',last:k}; } else { setCell(k,1); drag={mode:'x',last:k}; }
    env.sfx('click');
  }
  function onMove(e){ if(!drag) return; const [x,y]=toLogical(e),k=cellAt(x,y); if(k<0||k===drag.last) return; drag.last=k; lastTap.k=-1;
    if(drag.mode==='x'&&(st[k]===0||st[k]===3)) setCell(k,1); else if(drag.mode==='clear'&&st[k]===1) setCell(k,0); }
  function onUp(){ const g=grp; grp=null; if(g&&g.length) hist.push(g); drag=null; }
  canvas.addEventListener('pointerdown',onDown); canvas.addEventListener('pointermove',onMove); canvas.addEventListener('pointerup',onUp); canvas.addEventListener('pointercancel',onUp);
  canvas.style.touchAction='none';

  function update(dt){
    if(!ended) t+=dt; else if(winT>=0) winT+=dt;
    // 鍵盤：方向鍵移動、空白鍵打叉、Enter 放貓、H 提示、Z 復原、A 自動打叉
    const K=env.hit; let mv=null;
    if(K('ArrowUp')||K('KeyW')) mv=[-1,0]; else if(K('ArrowDown')||K('KeyS')) mv=[1,0]; else if(K('ArrowLeft')) mv=[0,-1]; else if(K('ArrowRight')||K('KeyD')) mv=[0,1];
    if(mv){ if(cur<0) cur=0; else { const [r,cc]=RC(cur); cur=clamp(r+mv[0],0,N-1)*N+clamp(cc+mv[1],0,N-1); } }
    if(!ended&&cur>=0){
      if(K('Space')||K('KeyJ')){ if(st[cur]===0||st[cur]===3) setCell(cur,1); else if(st[cur]===1) setCell(cur,0); env.sfx('click'); }
      if(K('Enter')||K('KeyK')){ if(st[cur]===2){ if(cur!==giftK){ setCell(cur,0); refreshAuto(); } } else tryCat(cur); } }
    if(K('KeyH')) hint(); if(K('KeyZ')) undo(); if(K('KeyA')) toggleAuto();
    for(let k=0;k<N*N;k++){ if(pop[k]>0) pop[k]=Math.max(0,pop[k]-dt*3); if(wrong[k]>0) wrong[k]=Math.max(0,wrong[k]-dt*1.4); }
    for(let i=glow.length-1;i>=0;i--){ glow[i].t+=dt; if(glow[i].t>.9) glow.splice(i,1); }
    if(shake>0) shake=Math.max(0,shake-dt); if(ruleT>0) ruleT-=dt;
    for(let i=fx.length-1;i>=0;i--){ const f=fx[i]; f.life-=dt; f.x+=f.vx*dt; f.y+=f.vy*dt; f.vy+=200*dt; if(f.life<=0) fx.splice(i,1); }
    if(winT>=0&&winT<1.6&&Math.random()<dt*24) fx.push({x:Math.random()*W,y:-10,vx:(Math.random()-.5)*60,vy:90+Math.random()*120,life:2.4,col:['#ffc845','#f37ea0','#8ec5ea','#9ed58e','#b9b7ea'][Math.random()*5|0]});
  }

  function draw(){
    // 薄荷色壁紙＋小圓點
    c.fillStyle='#dff3ea'; c.fillRect(0,0,W,H); c.fillStyle='rgba(255,255,255,.55)'; for(let yy=10;yy<H;yy+=28) for(let xx=(yy/28%2)*14;xx<W;xx+=28){ c.beginPath(); c.arc(xx,yy,3,0,7); c.fill(); }
    c.textBaseline='middle'; c.textAlign='center';
    // 標題緞帶
    c.fillStyle='#ff8a8a'; c.beginPath(); c.moveTo(W/2-110,26); c.lineTo(W/2+110,26); c.lineTo(W/2+96,48); c.lineTo(W/2+110,70); c.lineTo(W/2-110,70); c.lineTo(W/2-96,48); c.closePath(); c.fill();
    c.fillStyle='#fff'; c.font='900 26px '+TC; c.fillText('第 '+(lv+1)+' 關',W/2,49);
    c.fillStyle='#4a6a5a'; c.font='700 15px '+TC; c.textAlign='left'; c.fillText(N+'×'+N,22,49); c.textAlign='right'; c.fillText('⏱ '+fmt(t),W-22,49);
    // 腳印進度（放好幾隻貓）、貓罐頭（生命）
    const cn=catCount(),pw=Math.min(26,230/N); for(let i=0;i<N;i++) paw(c,30+i*pw+pw/2,100,pw*.8,i<cn?'#ff8a5c':'rgba(74,106,90,.22)');
    for(let i=0;i<LIVES;i++) can(c,W-110+i*34,100,30,i<lives);
    // 規則（一行）
    const RL=['每色一隻','每行每列一隻','不能相鄰']; c.font='700 14px '+TC; let rx=W/2-((RL.length-1)*12+RL.reduce((a2,r2)=>a2+c.measureText(r2).width+24,0))/2;
    RL.forEach((r2,i)=>{ const w=c.measureText(r2).width+24,on=ruleT>0&&ruleHi===i; c.fillStyle=on?'#ff6b6b':'#ffffff'; rrect(c,rx,136,w,30,15); c.fill(); c.fillStyle=on?'#fff':'#4a6a5a'; c.textAlign='center'; c.fillText(r2,rx+w/2,151); rx+=w+12; });
    c.textAlign='center'; c.fillStyle='#6a8a7a'; c.font='700 13px '+TC; c.fillText('點一下蓋腳印，點兩下放貓，點貓可以拿掉',W/2,186);
    // 盤面：木框＋靠墊格子
    const sx=shake>0?Math.sin(shake*60)*6*shake/.35:0; c.save(); c.translate(sx,0);
    c.fillStyle='#a8743f'; rrect(c,BX-10,BY-10,BS+20,BS+20,18); c.fill(); c.strokeStyle='rgba(70,40,20,.35)'; c.lineWidth=1.5; for(let i=0;i<6;i++){ c.beginPath(); c.moveTo(BX-6,BY-8+i*(BS+16)/6); c.quadraticCurveTo(BX+BS/2,BY-2+i*(BS+16)/6,BX+BS+6,BY-8+i*(BS+16)/6); c.stroke(); }
    const lit=new Set(); for(const g of glow){ for(let k=0;k<N*N;k++){ const [r,cc]=RC(k); if(g.cells?g.cells.includes(k):g.row!=null?r===g.row:cc===g.col) lit.add(k); } }
    const cs=BS/N,X=k=>BX+(k%N)*cs,Y=k=>BY+((k/N)|0)*cs;
    for(let k=0;k<N*N;k++){ const x=X(k),y=Y(k),col=regCol(P.reg[k]);
      const g2=c.createLinearGradient(x,y,x,y+cs); g2.addColorStop(0,col); g2.addColorStop(1,mixc(col,.9)); c.fillStyle=g2; c.fillRect(x,y,cs,cs);
      c.strokeStyle='rgba(255,255,255,.7)'; c.setLineDash([3,3]); c.lineWidth=1.2; c.strokeRect(x+4,y+4,cs-8,cs-8); c.setLineDash([]); // 縫線
      if(winT<0&&glow.length&&!lit.has(k)){ c.fillStyle='rgba(40,60,50,.22)'; c.fillRect(x,y,cs,cs); }
      if(lit.has(k)){ c.fillStyle='rgba(255,255,255,.28)'; c.fillRect(x,y,cs,cs); } }
    // 顏色區塊之間的粗線
    c.strokeStyle='#6b4a2a'; c.lineWidth=3; c.lineCap='round'; c.beginPath();
    for(let r=0;r<N;r++) for(let cc=0;cc<N;cc++){ const k=r*N+cc,x=BX+cc*cs,y=BY+r*cs;
      if(cc<N-1&&P.reg[k]!==P.reg[k+1]){ c.moveTo(x+cs,y); c.lineTo(x+cs,y+cs); }
      if(r<N-1&&P.reg[k]!==P.reg[k+N]){ c.moveTo(x,y+cs); c.lineTo(x+cs,y+cs); } }
    c.stroke(); c.strokeStyle='#6b4a2a'; c.lineWidth=3; c.strokeRect(BX,BY,BS,BS);
    for(let k=0;k<N*N;k++){ const x=X(k)+cs/2,y=Y(k)+cs/2;
      if(st[k]===1||st[k]===3){ const red=wrong[k]>0; paw(c,x,y,cs*(st[k]===3?.34:.44),red?'#e23b3b':st[k]===3?'rgba(90,70,60,.28)':'rgba(90,70,60,.55)'); }
      if(hintK.has(k)&&st[k]!==2){ c.fillStyle='#ff6b6b'; c.font='900 '+Math.round(cs*.5)+'px '+TC; c.textAlign='center'; c.globalAlpha=.7+.3*Math.sin(t*5); c.fillText('?',x,y+cs*.03); c.globalAlpha=1; }
      if(st[k]===2){ let sc=1+Math.sin(pop[k]*Math.PI)*.22;
        if(winT>=0){ c.fillStyle='rgba(255,236,150,.6)'; c.beginPath(); c.arc(x,y,cs*.48,0,7); c.fill(); sc*=1+Math.sin(winT*6+k)*.05; }
        c.save(); c.translate(x,y+(winT>=0?-Math.abs(Math.sin(winT*5+k))*cs*.08:0)); c.scale(sc,sc); drawCat(c,0,0,cs,L.cat,t,winT>=0?1:0,k); c.restore(); }
      if(wrong[k]>0){ c.save(); c.globalAlpha=Math.min(1,wrong[k]*1.5); drawCat(c,x,y-cs*.12*(1-wrong[k]),cs*.9,L.cat,t,2,k); c.restore(); } }
    if(cur>=0&&!ended){ c.strokeStyle='#ff6b6b'; c.lineWidth=3; c.strokeRect(X(cur)+2,Y(cur)+2,cs-4,cs-4); }
    c.restore();
    // 按鈕（木牌）
    for(const b of BTN){ const dis=ended||b.id==='hint'&&hints<=0||b.id==='undo'&&!hist.length,on=b.id==='auto'&&auto;
      c.fillStyle=on?'#ff8a8a':dis?'#e8dccd':'#f5e6cf'; rrect(c,b.x,b.y,b.w,b.h,10); c.fill(); c.strokeStyle='#a8743f'; c.lineWidth=2.5; c.stroke();
      c.textAlign='center'; c.fillStyle=dis?'#b8a890':on?'#fff':'#6b4a2a'; c.font='900 17px '+TC; c.fillText(b.label+(b.id==='hint'?' '+hints:''),b.x+b.w/2,b.y+b.h/2+1); }
    floor(c,W,H-76,76,t);
    for(const f of fx){ c.globalAlpha=Math.max(0,Math.min(1,f.life)); c.fillStyle=f.col; c.fillRect(f.x-3,f.y-3,6,6); } c.globalAlpha=1;
    if(winT>=0){ const a=Math.min(1,winT*2.5); c.globalAlpha=a; c.textAlign='center'; c.font='900 38px '+TC; c.lineWidth=8; c.strokeStyle='#fff'; c.strokeText('每隻貓都找到位置了！',W/2,H-112); c.fillStyle='#ff6b6b'; c.fillText('每隻貓都找到位置了！',W/2,H-112); c.globalAlpha=1; }
  }
  return {update,draw,destroy(){ canvas.removeEventListener('pointerdown',onDown); canvas.removeEventListener('pointermove',onMove); canvas.removeEventListener('pointerup',onUp); canvas.removeEventListener('pointercancel',onUp); },
    _dbg:{P,st,tryCat,hint,get lives(){return lives;}}};
}

/* ---- 大廳縮圖與造型預覽 ---- */
const DEMO={N:5,reg:[0,0,1,1,1,0,2,2,1,3,0,2,4,4,3,0,2,4,3,3,2,2,4,4,3],sol:[0,3,1,4,2]};
function demo(c,w,h,t,L){
  c.fillStyle='#dff3ea'; c.fillRect(0,0,w,h);
  const pal=PALETTE[L.theme]||PALETTE.classic,s=h*.8,cs=s/5,x0=w*.07,y0=(h-s)/2,shown=Math.floor((t*1.2)%7);
  c.fillStyle='#a8743f'; rrect(c,x0-6,y0-6,s+12,s+12,10); c.fill();
  for(let k=0;k<25;k++){ const r=k/5|0,cc=k%5,x=x0+cc*cs,y=y0+r*cs; c.fillStyle=pal[DEMO.reg[k]]; c.fillRect(x,y,cs,cs);
    if(r<shown&&DEMO.sol[r]===cc) drawCat(c,x+cs/2,y+cs/2,cs,L.cat,t,shown>=5?1:0,r);
    else if(shown>=5) paw(c,x+cs/2,y+cs/2,cs*.4,'rgba(90,70,60,.5)'); }
  c.strokeStyle='#6b4a2a'; c.lineWidth=2; c.beginPath();
  for(let r=0;r<5;r++) for(let cc=0;cc<5;cc++){ const k=r*5+cc,x=x0+cc*cs,y=y0+r*cs; if(cc<4&&DEMO.reg[k]!==DEMO.reg[k+1]){ c.moveTo(x+cs,y); c.lineTo(x+cs,y+cs); } if(r<4&&DEMO.reg[k]!==DEMO.reg[k+5]){ c.moveTo(x,y+cs); c.lineTo(x+cs,y+cs); } }
  c.stroke(); c.strokeRect(x0,y0,s,s);
  const cx=x0+s+(w-x0-s)/2;
  drawCat(c,cx,h*.42,h*.46,L.cat,t,Math.floor(t)%5===0?1:0,9);
  c.textAlign='center'; c.textBaseline='middle'; c.font='900 '+h*.12+'px "Noto Sans TC",sans-serif'; c.fillStyle='#ff6b6b'; c.fillText('貓咪數獨',cx,h*.8);
}
const thumb=(c,w,h,t)=>demo(c,w,h,t,{cat:'orange',theme:'classic'});
const preview=(c,w,h,L,t)=>demo(c,w,h,t,L);

(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).meow={
  name:'貓咪數獨',tag:'MEOW PUZZLE',color:'#ffc845',
  desc:'幫每隻麻糬貓在貓咪房裡找到自己的靠墊：每種顏色、每一行、每一列都剛好一隻貓，而且貓咪不能相鄰，連斜角都不行。不用算數，全靠邏輯推理。共 100 關，從 4×4 的入門小盤面一路變大到 10×10，過了一關才會解鎖下一關。',
  goal:'點一下格子蓋上肉球腳印（表示不可能有貓，再點一下取消），點兩下放貓，點貓可以拿掉；按住拖曳可以連續蓋腳印。放錯貓會吃掉一個貓罐頭，3 個吃完就失敗。「自動」會幫你把放好的貓管到的格子蓋上腳印，「提示」會在一定有貓的格子打上問號（每關 3 次）。',
  stages:Array.from({length:LEVELS},(_,i)=>sizeOf(i)+'×'+sizeOf(i)),stars:Array.from({length:LEVELS},(_,i)=>starsOf(i)),
  stageBest:i=>{ const v=getRec(i); return v==null?'':'✓ '+fmt(v); },
  stageLocked:i=>i>0&&getRec(i-1)==null, // 過了前一關才解鎖下一關
  stageGrid:true, // 關卡多：開始畫面右邊只放關卡數字
  hubBest:()=>{ const n=cleared(); return n?'已過關 <b>'+n+' / '+LEVELS+'</b>':'尚無紀錄'; },
  help:[['點一下','打叉，再點一下取消'],['點兩下','放貓'],['點貓','拿掉貓'],['按住拖曳','連續打叉或清除叉叉'],['↑ ↓ ← →','移動選取框'],['空白鍵','打叉／取消叉叉'],['Enter','放貓'],['H','提示'],['A','自動打叉開關'],['Z','復原']],
  touchHelp:[['點一下','打叉，再點一下取消'],['點兩下','放貓'],['點貓','拿掉貓'],['按住拖曳','連續打叉或清除叉叉'],['自動','放好貓後自動把不可能的格子打叉'],['提示','在一定有貓的格子打問號（每關 3 次）']],
  touch:null,
  looks:[{key:'cat',label:'貓咪',opts:[{id:'orange',label:'橘貓'},{id:'tuxedo',label:'黑白貓'},{id:'gray',label:'灰虎斑'},{id:'white',label:'白貓'},{id:'calico',label:'三花貓'}]},
    {key:'theme',label:'色系',opts:[{id:'classic',label:'經典'},{id:'candy',label:'糖果'},{id:'forest',label:'森林'}]}],
  best:{label:'已過關',fmt:v=>v+' / '+LEVELS+' 關',lower:false},
  preview,thumb,create,_gen:genLevel
};
})();
