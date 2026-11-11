// 聚會鬧翻天：把臥底在身邊、狼人殺、你畫我猜、炸彈傳傳傳、搶椅子大作戰、默契大考驗六款聚會遊戲收在同一個入口。
// 開始畫面右上角「選擇遊戲」換一款，整張開始畫面（背景、模式、連線、設定、遊戲操作）都換成那一款（外殼的 pack 功能）。
(function(){
'use strict';
const SUB=['spy','wolf','draw','passbomb','chair','tacit'];
const G=()=>window.ARCADE_GAMES||{};
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).party={
  name:'聚會鬧翻天',tag:'PARTY NIGHT',color:'#ff5ab4',pack:SUB,
  desc:'朋友聚會一次玩個夠！臥底在身邊、狼人殺、你畫我猜、炸彈傳傳傳、搶椅子大作戰、默契大考驗六款合在一起，選一款就開玩。一個人有電腦陪你玩，也能和朋友連線。',
  goal:'在「選擇遊戲」挑一款，下面的玩法、設定和操作說明會跟著換。',
  hubBest:()=>'六款聚會遊戲',
  thumb:(c,w,h,t)=>{ const g=G()[SUB[Math.floor(t/4)%SUB.length]]; if(g&&g.thumb) g.thumb(c,w,h,t); },
  create(){ return {update(){},draw(){},destroy(){}}; }};
})();
