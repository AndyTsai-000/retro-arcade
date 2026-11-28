// 聚會鬧翻天：把臥底在身邊、狼人殺、你畫我猜、炸彈傳傳傳、搶椅子大作戰、默契大考驗、密碼炸彈大挑戰、拔河拔起來、真心話轉轉樂、比手畫腳、心中有數、王城密令、傳話變變變、誰在唬爛十四款聚會遊戲收在同一個入口。
// 開始畫面右上角「選擇遊戲」換一款，整張開始畫面（背景、模式、連線、設定、遊戲操作）都換成那一款（外殼的 pack 功能）。
(function(){
'use strict';
const SUB=['spy','wolf','draw','passbomb','chair','tacit','boomcode','tug','truth','charades','dial','mission','relay','bluff'];
const G=()=>window.ARCADE_GAMES||{};
/* 大家用一台時的玩家名字：存在這台裝置，真心話轉轉樂、心中有數共用 */
const NKEY='arcade.party.names',TCF='"Noto Sans TC","Microsoft JhengHei",sans-serif';
const loadN=()=>{ try{ const a=JSON.parse(localStorage.getItem(NKEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } };
const cleanN=s=>String(s||'').replace(/[<>&"']/g,'').trim().slice(0,6);
window.PARTY_NAMES={
  fill(names){ const s=loadN(); for(let i=0;i<names.length;i++){ const v=cleanN(s[i]); if(v) names[i]=v; } return names; },
  edit(stage,names,done){ if(!stage||stage.querySelector('.pnEdit')) return;
    const ov=document.createElement('div'); ov.className='pnEdit'; ov.style.cssText='position:absolute;inset:0;z-index:9;display:flex;align-items:center;justify-content:center;background:rgba(10,4,24,.72)';
    const card=document.createElement('div'); card.style.cssText='background:#2a1048;border:2px solid #ff8ad0;border-radius:18px;padding:14px 16px;width:min(420px,92%);max-height:92%;overflow:auto;color:#fff;font:700 14px '+TCF+';box-sizing:border-box';
    card.innerHTML='<div style="font-size:18px;font-weight:900;text-align:center;margin-bottom:10px">✏️ 改玩家名字</div>';
    const grid=document.createElement('div'); grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:8px'; const ins=[];
    names.forEach((nm,i)=>{ const inp=document.createElement('input'); inp.maxLength=6; inp.value=nm; inp.placeholder='玩家 '+(i+1); inp.autocomplete='off';
      inp.style.cssText='min-width:0;font:700 15px '+TCF+';padding:6px 10px;border-radius:10px;border:2px solid #ff8ad0;background:#fff;color:#2a1040';
      inp.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); (ins[i+1]||ok).focus(); } }); inp.addEventListener('keyup',e=>e.stopPropagation());
      inp.addEventListener('focus',()=>inp.select()); ins.push(inp); grid.appendChild(inp); });
    const row=document.createElement('div'); row.style.cssText='display:flex;gap:8px;justify-content:center;margin-top:12px';
    const mk=(tx,bg,fg)=>{ const b=document.createElement('button'); b.textContent=tx; b.style.cssText='font:900 15px '+TCF+';padding:8px 22px;border-radius:12px;border:0;cursor:pointer;background:'+bg+';color:'+fg; return b; };
    const cancel=mk('取消','#6a5a8a','#fff'),ok=mk('確定','#ffd23f','#2a1e0e'); row.append(cancel,ok); card.append(grid,row); ov.appendChild(card); stage.appendChild(ov);
    const close=()=>{ ov.remove(); if(done) done(); };
    ok.addEventListener('click',()=>{ const s=loadN(); ins.forEach((inp,i)=>{ const v=cleanN(inp.value); names[i]=v||'玩家 '+(i+1); s[i]=/^玩家 ?\d+$/.test(v)?'':v; }); try{ localStorage.setItem(NKEY,JSON.stringify(s.slice(0,10))); }catch(e){} close(); });
    cancel.addEventListener('click',close); ov.addEventListener('pointerdown',e=>e.stopPropagation());
    if(!('ontouchstart' in window)) setTimeout(()=>{ try{ ins[0].focus(); }catch(e){} },30); }};
(window.ARCADE_GAMES=window.ARCADE_GAMES||{}).party={
  name:'聚會鬧翻天',tag:'PARTY NIGHT',color:'#ff5ab4',pack:SUB,
  desc:'朋友聚會一次玩個夠！臥底在身邊、狼人殺、你畫我猜、炸彈傳傳傳、搶椅子大作戰、默契大考驗、密碼炸彈大挑戰、拔河拔起來、真心話轉轉樂、比手畫腳、心中有數、王城密令、傳話變變變、誰在唬爛十四款合在一起，選一款就開玩。一個人有電腦陪你玩，也能和朋友連線。',
  goal:'在「選擇遊戲」挑一款，下面的玩法、設定和操作說明會跟著換。',
  hubBest:()=>'十四款聚會遊戲',
  thumb:(c,w,h,t)=>{ const g=G()[SUB[Math.floor(t/4)%SUB.length]]; if(g&&g.thumb) g.thumb(c,w,h,t); },
  create(){ return {update(){},draw(){},destroy(){}}; }};
})();
