// 揮拍大聯盟：把匹克球對決、羽球對決、桌球對決、網球對決四款揮拍運動收在同一個入口。
// 開始畫面右上角「選擇遊戲」換一款，整張開始畫面（關卡、模式、連線、設定、遊戲操作）都換成那一款（外殼的 pack 功能）；各款的關卡紀錄不變。
(function(){
'use strict';
const SUB=['pickleball','badminton','pingpong','tennis'];
const G=()=>window.ARCADE_GAMES||{};
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).racket={
  name:'揮拍大聯盟',tag:'RACKET LEAGUE',color:'#d8f040',pack:SUB,
  desc:'四種揮拍運動一次打個夠：匹克球對決、羽球對決、桌球對決、網球對決。照正式規則比賽，每款都有 200 關單人挑戰，也能雙人同一台或連線對打。',
  goal:'在「選擇遊戲」挑一款，下面的關卡、設定和操作說明會跟著換。',
  hubBest:()=>{ let n=0; for(const k of SUB){ const g=G()[k]; if(!g||!g.stageBest) continue; for(let i=0;i<200;i++) if(g.stageBest(i)) n++; } return n?'四款共過關 <b>'+n+'</b>':'四種揮拍運動'; },
  thumb:(c,w,h,t)=>{ const g=G()[SUB[Math.floor(t/4)%SUB.length]]; if(g&&g.thumb) g.thumb(c,w,h,t); },
  create(){ return {update(){},draw(){},destroy(){}}; }};
})();
