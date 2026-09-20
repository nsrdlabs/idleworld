const SAVE_KEY="miw_v1_save";
const creatures={
 flamito:{name:"Flamito",emoji:"🔥",element:"Fogo",rarity:"Comum",hp:100,atk:12,def:5,spd:5,unlock:0},
 aquaboo:{name:"Aquaboo",emoji:"💧",element:"Água",rarity:"Comum",hp:105,atk:10,def:7,spd:5,unlock:30},
 leafin:{name:"Leafin",emoji:"🌿",element:"Natureza",rarity:"Comum",hp:110,atk:11,def:8,spd:4,unlock:60},
 voltix:{name:"Voltix",emoji:"⚡",element:"Elétrico",rarity:"Incomum",hp:90,atk:16,def:5,spd:9,unlock:100},
 rocko:{name:"Rocko",emoji:"🪨",element:"Pedra",rarity:"Incomum",hp:150,atk:13,def:12,spd:2,unlock:150},
 lunaris:{name:"Lunaris",emoji:"🌙",element:"Sombrio",rarity:"Raro",hp:120,atk:20,def:9,spd:8,unlock:250}
};
const areas=[
 {id:"forest",name:"Floresta Verde",emoji:"🌲",desc:"Uma floresta tranquila para iniciantes.",req:1,enemies:[["Slime Verde","🟢",45,8],["Cogumelo Vivo","🍄",55,10],["Lobo Folha","🐺",70,12]],boss:["Guardião da Floresta","👹",500,25]},
 {id:"valley",name:"Vale Seco",emoji:"🏜️",desc:"Areia quente e monstros agressivos.",req:5,enemies:[["Escorpião","🦂",90,15],["Lagarto Fogo","🦎",105,17],["Golem Pequeno","🗿",130,18]],boss:["Rei do Deserto","👑",900,35]},
 {id:"mountain",name:"Montanha Rochosa",emoji:"⛰️",desc:"Pedras antigas escondem criaturas fortes.",req:10,enemies:[["Morcego Pedra","🦇",170,21],["Goblin","👺",190,23],["Golem","🗿",230,26]],boss:["Titã da Montanha","👹",1600,45]},
 {id:"lake",name:"Lago Azul",emoji:"🌊",desc:"Um lago misterioso cheio de energia.",req:15,enemies:[["Peixe Sombrio","🐟",260,29],["Sapo Aquático","🐸",280,31],["Serpente Azul","🐍",320,34]],boss:["Leviatã do Lago","🐉",2800,60]}
];
const shopItems=[
 {id:"potion",name:"Poção pequena",emoji:"🧪",desc:"Recupera 25% do HP da criatura.",price:100},
 {id:"crystal",name:"Cristal",emoji:"💎",desc:"Recurso raro.",price:500},
 {id:"chest",name:"Baú misterioso",emoji:"🎁",desc:"Pode conter Gold ou fragmentos.",price:750}
];
const achievements=[
 ["first","Primeiro Sangue","Derrote 1 inimigo.",s=>s.kills>=1],
 ["hunter","Caçador","Derrote 100 inimigos.",s=>s.kills>=100],
 ["veteran","Veterano","Alcance nível 10.",s=>s.creature.level>=10],
 ["collector","Colecionador","Desbloqueie 5 criaturas.",s=>s.unlocked.length>=5],
 ["boss","Matador de Boss","Derrote seu primeiro Boss.",s=>s.bosses>=1],
 ["rich","Fortuna","Tenha 10.000 Gold.",s=>s.gold>=10000]
];

let state={
 started:false,name:"Aventureiro",gold:250,gems:5,fragments:0,kills:0,bosses:0,
 area:"forest",paused:false,unlocked:["flamito"],selected:"flamito",
 creature:{level:1,xp:0,hp:100,maxHp:100},inventory:{potion:2,crystal:0,chest:0},lastSeen:Date.now()
};
let enemy=null,timer=null;

const $=id=>document.getElementById(id);
function xpNeed(){return 100+(state.creature.level-1)*45}
function baseCreature(){const c=creatures[state.selected];state.creature.maxHp=c.hp+(state.creature.level-1)*Math.floor(c.hp*.12);state.creature.hp=state.creature.maxHp}
function save(){state.lastSeen=Date.now();localStorage.setItem(SAVE_KEY,JSON.stringify(state))}
function load(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s)state={...state,...s,creature:{...state.creature,...s.creature},inventory:{...state.inventory,...s.inventory}}}catch(e){}}
function log(msg){const el=$("combatLog");el.innerHTML=`<div>• ${msg}</div>`+el.innerHTML}
function area(){return areas.find(a=>a.id===state.area)}
function makeEnemy(isBoss=false){
 const a=area(), data=isBoss?a.boss:a.enemies[Math.floor(Math.random()*a.enemies.length)];
 const scale=1+(state.creature.level-1)*.08;
 enemy={name:data[0],emoji:data[1],maxHp:Math.round(data[2]*scale),hp:Math.round(data[2]*scale),atk:Math.round(data[3]*scale),boss:isBoss};
}
function damage(attacker){
 const c=creatures[state.selected];
 if(attacker==="player") return Math.max(1,Math.round(c.atk+(state.creature.level-1)*2+Math.random()*5-(enemy.atk*.08)));
 return Math.max(1,Math.round(enemy.atk-state.creature.level*.5-Math.random()*3));
}
function gainXP(amount){
 state.creature.xp+=amount;
 while(state.creature.xp>=xpNeed()){
  state.creature.xp-=xpNeed();state.creature.level++;
  baseCreature();log(`⬆️ ${creatures[state.selected].name} chegou ao nível ${state.creature.level}!`);
 }
}
function defeatEnemy(){
 state.kills++;
 const xp=Math.round((25+enemy.maxHp*.45)*(enemy.boss?5:1));
 const gold=Math.round((8+enemy.maxHp*.12)*(enemy.boss?5:1));
 gainXP(xp);state.gold+=gold;state.fragments+=enemy.boss?5:1;
 if(enemy.boss){state.bosses++;state.gems+=3;log(`👹 Boss derrotado! +${xp} XP +${gold} Gold +5 fragmentos +3 cristais.`)}
 else log(`⭐ Vitória! +${xp} XP +${gold} Gold +1 fragmento.`);
 enemy=null; makeEnemy(false); render();
}
function tick(){
 if(!state.started||state.paused)return;
 if(!enemy)makeEnemy(false);
 const pd=damage("player");enemy.hp-=pd;
 log(`${creatures[state.selected].name} causou ${pd} de dano.`);
 if(enemy.hp<=0){defeatEnemy();return}
 const ed=damage("enemy");state.creature.hp-=ed;
 if(state.creature.hp<=0){state.creature.hp=state.creature.maxHp;state.gold=Math.max(0,state.gold-10);log(`💥 Sua criatura foi derrotada e voltou com HP cheio. -10 Gold.`)}
 render();save();
}
function startCombat(){clearInterval(timer);timer=setInterval(tick,1400)}
function render(){
 $("gold").textContent=state.gold.toLocaleString("pt-BR");$("gems").textContent=state.gems;
 $("playerName").textContent=state.name;$("playerLevel").textContent=state.creature.level;
 const c=creatures[state.selected];
 $("creatureEmoji").textContent=c.emoji;$("fighterCreatureEmoji").textContent=c.emoji;
 $("creatureName").textContent=c.name;$("fighterCreatureName").textContent=c.name;
 $("creatureRarity").textContent=c.rarity;$("creatureLevel").textContent=state.creature.level;
 $("hpStat").textContent=state.creature.maxHp;$("atkStat").textContent=c.atk+(state.creature.level-1)*2;
 $("defStat").textContent=c.def+(state.creature.level-1);$("spdStat").textContent=c.spd+(state.creature.level-1);
 $("xpText").textContent=`${Math.floor(state.creature.xp)} / ${xpNeed()}`;$("xpBar").style.width=`${Math.min(100,state.creature.xp/xpNeed()*100)}%`;
 $("playerHpText").textContent=`${Math.max(0,Math.round(state.creature.hp))} / ${state.creature.maxHp}`;$("playerHpBar").style.width=`${Math.max(0,state.creature.hp/state.creature.maxHp*100)}%`;
 const a=area();$("currentAreaEmoji").textContent=a.emoji;$("currentAreaName").textContent=a.name;$("currentAreaDesc").textContent=a.desc;
 if(enemy){$("enemyEmoji").textContent=enemy.emoji;$("enemyName").textContent=enemy.name;$("enemyHpText").textContent=`${Math.max(0,Math.round(enemy.hp))} / ${enemy.maxHp}`;$("enemyHpBar").style.width=`${Math.max(0,enemy.hp/enemy.maxHp*100)}%`}
 renderAreas();renderCollection();renderInventory();renderShop();renderAchievements();
}
function renderAreas(){
 $("areaList").innerHTML=areas.map(a=>`<button class="area-btn ${state.area===a.id?"active":""} ${state.creature.level<a.req?"locked":""}" data-area="${a.id}">${a.emoji} ${a.name}<small> Lv.${a.req}</small></button>`).join("");
 document.querySelectorAll("[data-area]").forEach(b=>b.onclick=()=>{const a=areas.find(x=>x.id===b.dataset.area);if(state.creature.level<a.req)return log(`🔒 Alcance o nível ${a.req} para entrar aqui.`);state.area=a.id;enemy=null;makeEnemy();render();save()});
}
function renderCollection(){
 $("creatureCollection").innerHTML=Object.entries(creatures).map(([id,c])=>{
 const unlocked=state.unlocked.includes(id);
 return `<div class="card"><div class="icon">${c.emoji}</div><h3>${c.name}</h3><small>${c.element} • ${c.rarity}</small><p>HP ${c.hp} • ATK ${c.atk} • DEF ${c.def}</p>${unlocked?`<button data-select="${id}">${state.selected===id?"Selecionada":"Selecionar"}</button>`:`<p>🔒 ${c.unlock} fragmentos</p><button data-unlock="${id}" ${state.fragments<c.unlock?"disabled":""}>Desbloquear</button>`}</div>`}).join("");
 document.querySelectorAll("[data-select]").forEach(b=>b.onclick=()=>{state.selected=b.dataset.select;state.creature.level=1;state.creature.xp=0;baseCreature();enemy=null;makeEnemy();render();save()});
 document.querySelectorAll("[data-unlock]").forEach(b=>b.onclick=()=>{const id=b.dataset.unlock,c=creatures[id];if(state.fragments>=c.unlock){state.fragments-=c.unlock;state.unlocked.push(id);log(`🐲 ${c.name} desbloqueado!`);render();save()}});
}
function renderInventory(){
 $("inventoryList").innerHTML=`<div class="item">🧪 <b>Poções</b><br>${state.inventory.potion}<br><button id="usePotion" class="secondary">Usar</button></div><div class="item">💎 <b>Cristais</b><br>${state.inventory.crystal}</div><div class="item">🎁 <b>Baús</b><br>${state.inventory.chest}</div><div class="item">🧩 <b>Fragmentos</b><br>${state.fragments}</div>`;
 $("usePotion").onclick=()=>{if(state.inventory.potion>0){state.inventory.potion--;state.creature.hp=Math.min(state.creature.maxHp,state.creature.hp+Math.round(state.creature.maxHp*.25));log("🧪 Poção usada.");render();save()}};
}
function renderShop(){
 $("shopList").innerHTML=shopItems.map(i=>`<div class="card"><div class="icon">${i.emoji}</div><h3>${i.name}</h3><p>${i.desc}</p><b>💰 ${i.price}</b><br><button data-buy="${i.id">Comprar</button></div>`).join("").replace('data-buy="${i.id}"','data-buy="${i.id}"');
 document.querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>buy(b.dataset.buy));
}
function buy(id){
 const i=shopItems.find(x=>x.id===id);if(state.gold<i.price)return log("💰 Gold insuficiente.");
 state.gold-=i.price;
 if(id==="potion")state.inventory.potion++;
 if(id==="crystal"){state.inventory.crystal++;state.gems++}
 if(id==="chest"){state.inventory.chest++;const g=100+Math.floor(Math.random()*500);state.gold+=g;state.fragments+=Math.floor(Math.random()*3);log(`🎁 Baú aberto: +${g} Gold e alguns fragmentos.`)}
 render();save();
}
function renderAchievements(){
 $("achievementList").innerHTML=achievements.map(a=>`<div class="achievement ${a[3](state)?"done":""}"><div><b>${a[3](state)?"🏆":"🔒"} ${a[1]}</b><br><small>${a[3](state)?"Concluída!":a[2]}</small></div></div>`).join("");
}
function tabs(){
 document.querySelectorAll(".nav-btn").forEach(b=>b.onclick=()=>{document.querySelectorAll(".nav-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));$(b.dataset.tab+"Tab").classList.add("active")});
}
function showOffline(){
 const away=Math.max(0,Date.now()-state.lastSeen), minutes=Math.min(720,Math.floor(away/60000));
 if(minutes<2)return;
 const c=creatures[state.selected], kills=Math.floor(minutes*0.7), xp=Math.floor(kills*(20+c.atk*.4)), gold=Math.floor(kills*8);
 state.kills+=kills;state.gold+=gold;gainXP(xp);
 $("offlineBox").innerHTML=`💤 <b>Progresso offline!</b><br>Você ficou fora por ${minutes} minuto(s). Foram simulados <b>${kills}</b> inimigos derrotados, +<b>${xp}</b> XP e +<b>${gold}</b> Gold. <button id="closeOffline" class="secondary">Continuar</button>`;
 $("offlineBox").classList.remove("hidden");$("closeOffline").onclick=()=>{$("offlineBox").classList.add("hidden");save();render()};
}
function newGame(){
 state.started=true;state.name=window.prompt("Digite o nome do seu aventureiro:")||"Aventureiro";baseCreature();makeEnemy();$("startScreen").classList.remove("active");$("gameScreen").classList.add("active");tabs();render();startCombat();save();
}
$("startBtn").onclick=()=>{
 try{
   load();
   if(localStorage.getItem(SAVE_KEY)){
     state.started=true;
     $("startScreen").classList.remove("active");
     $("gameScreen").classList.add("active");
     tabs();
     baseCreature();
     makeEnemy();
     showOffline();
     render();
     startCombat();
   }else{
     newGame();
   }
 }catch(err){
   console.error(err);
   alert("Não foi possível iniciar o jogo. Recarregue a página e tente novamente.");
 }
};
$("resetBtn").onclick=()=>{if(confirm("Apagar todo o progresso?")){localStorage.removeItem(SAVE_KEY);location.reload()}};
$("pauseBtn").onclick=()=>{state.paused=!state.paused;$("pauseBtn").textContent=state.paused?"▶️ Continuar":"⏸️ Pausar";};
$("bossBtn").onclick=()=>{if(!enemy)return;if(enemy.boss)return log("O Boss já está em combate.");makeEnemy(true);log(`👹 ${enemy.name} apareceu!`);render()};
load();
if(state.started&&localStorage.getItem(SAVE_KEY)){setTimeout(()=>{$("startScreen").classList.remove("active");$("gameScreen").classList.add("active");tabs();baseCreature();makeEnemy();showOffline();render();startCombat()},50)}
