"use strict";
const copy = {
  zh: {
    play:"开始游戏", how:"玩法说明", title:"寻龙", tagline:"五张牌，只有一张藏着龙。",
    duel:"双人对决", solo:"单人练习", you:"你", opponent:"对手", entry:"入场 $5", pot:"奖池 $10",
    free:"免费练习", odds:"每轮选一张", demo:"本地试玩 · 演示金额 · 无需充值",
    lock:"锁定选牌", understood:"明白了", passTitle:"轮到玩家二",
    passBody:"请把设备交给玩家二。已选中的牌不能再次选择。", ready:"玩家二就绪",
    first:"玩家一，请选择一张牌。", second:"玩家二，请选择另一张牌。", choose:"选择一张牌，寻找藏着的龙。",
    hint:"双方选中的牌将同时翻开。", soloHint:"选好后锁定，揭晓你的牌。",
    p1:"玩家一", p2:"玩家二", yours:"你的选择", card:"第 {n} 张牌", back:"未翻开", dragon:"龙", empty:"云",
    reveal:"正在翻牌…", won:"你找到龙了！", lost:"这张牌没有龙，再试一次。", firstWon:"玩家一找到龙，赢得本局！",
    secondWon:"玩家二找到龙，赢得本局！", miss:"双方都没找到龙。重新发牌，继续本局。",
    again:"再来一局", redeal:"重新发牌", resultHint:"本轮所有牌已揭晓。", continueHint:"演示奖池保持 $10，不重复入场。",
    rules:"<p>五张牌中有一张龙牌。每轮开始时确定龙的位置，选牌期间保持不变。</p><ol><li>双人试玩使用同一台设备。玩家一锁定后，把设备交给玩家二。</li><li>两人必须选择不同的牌。玩家二锁定后，两张牌同时翻开。</li><li>找到龙的一方获胜。双方都没找到时，重新发牌并继续同一局。</li><li>单人练习每轮选择一张牌，找到龙即获胜。</li></ol><p>当前为本地试玩。$5 入场和 $10 奖池仅为演示，无资金转账。在线匹配和钱包支付尚未开放。</p>",
    close:"关闭", modes:"游戏模式", cards:"五张游戏牌"
  },
  en: {
    play:"Play", how:"How to Play", title:"Find the Dragon", tagline:"Five cards. One dragon.",
    duel:"1v1 Duel", solo:"Solo Practice", you:"You", opponent:"Opponent", entry:"$5 Entry", pot:"$10 Pot",
    free:"Free practice", odds:"One pick per round", demo:"Local demo · Illustrative stakes · No deposit",
    lock:"Lock In Card", understood:"Got it", passTitle:"Player 2’s turn",
    passBody:"Pass the device to Player 2. The first player’s card cannot be selected again.", ready:"Player 2 Ready",
    first:"Player 1, choose a card.", second:"Player 2, choose a different card.", choose:"Choose a card to find the dragon.",
    hint:"Both selected cards flip together.", soloHint:"Lock in your choice to reveal your card.",
    p1:"Player 1", p2:"Player 2", yours:"Your pick", card:"Card {n}", back:"Face down", dragon:"Dragon", empty:"Cloud",
    reveal:"Revealing…", won:"You found the dragon!", lost:"No dragon this time. Try again.", firstWon:"Player 1 found the dragon and wins!",
    secondWon:"Player 2 found the dragon and wins!", miss:"Both missed. Deal again to continue this game.",
    again:"Play Again", redeal:"Deal Again", resultHint:"All cards in this round are now revealed.", continueHint:"The demo pot stays at $10. No repeat entry.",
    rules:"<p>One of five cards hides the dragon. Its position is set before each round and stays fixed while players choose.</p><ol><li>Local duels use one device. Player 1 locks a card, then passes the device to Player 2.</li><li>Players must choose different cards. Both picks flip together after Player 2 locks in.</li><li>The player who finds the dragon wins. If both miss, a fresh deal continues the same game.</li><li>Solo practice gives you one pick each round. Find the dragon to win.</li></ol><p>This is a local demo. The $5 entry and $10 pot are illustrative, with no money transferred. Online matchmaking and wallet payments are still in development.</p>",
    close:"Close", modes:"Game mode", cards:"Five game cards"
  }
};
const $ = id => document.getElementById(id);
let language = "zh";
let mode = "duel";
let state;
let timers = [];
const cardButtons = Array.from({length:5}, (_, index) => {
  const button = document.createElement("button");
  button.className = "card";
  button.type = "button";
  button.innerHTML = '<span class="card-inner"><img class="back" src="./card-back.png" alt="" draggable="false"><img class="face" alt="" draggable="false"></span><span class="pick-label"></span>';
  button.addEventListener("click", () => {
    if (!["first","second"].includes(state.phase) || (state.phase === "second" && state.first === index)) return;
    state.selected = index;
    render();
  });
  $("cards").append(button);
  return button;
});
function randomCard() {
  const bytes = new Uint8Array(1);
  do { crypto.getRandomValues(bytes); } while (bytes[0] === 255);
  return bytes[0] % 5;
}
function deal() {
  timers.forEach(clearTimeout);
  timers = [];
  state = {phase:"first", dragon:randomCard(), first:null, second:null, selected:null};
  render();
}
function resultKey() {
  if (mode === "solo") return state.first === state.dragon ? "won" : "lost";
  if (state.first === state.dragon) return "firstWon";
  if (state.second === state.dragon) return "secondWon";
  return "miss";
}
function render() {
  const t = copy[language];
  document.documentElement.lang = language === "zh" ? "zh-Hans" : "en";
  document.title = language === "zh" ? "龙桌 · 寻龙" : "Dragon Table · Find the Dragon";
  document.querySelectorAll("[data-text]").forEach(el => { el.textContent = t[el.dataset.text]; });
  $("language").textContent = language === "zh" ? "English" : "中文";
  $("language").lang = language === "zh" ? "en" : "zh-Hans";
  $("close-help").setAttribute("aria-label",t.close);
  document.querySelector(".mode-switch").setAttribute("aria-label",t.modes);
  document.querySelector(".table").setAttribute("aria-label",t.cards);
  $("rules").innerHTML = t.rules;
  $("duel-mode").setAttribute("aria-pressed",mode === "duel");
  $("solo-mode").setAttribute("aria-pressed",mode === "solo");
  $("entry").textContent = mode === "duel" ? t.entry : t.free;
  $("pot").textContent = mode === "duel" ? t.pot : t.odds;
  document.querySelectorAll(".player").forEach(el => { el.style.visibility = mode === "solo" ? "hidden" : "visible"; });
  const selecting = ["first","second"].includes(state.phase);
  const result = state.phase === "result";
  let message = mode === "solo" ? "choose" : state.phase === "second" ? "second" : "first";
  if (state.phase === "handoff") message = "passTitle";
  if (state.phase === "reveal") message = "reveal";
  if (result) message = resultKey();
  $("phase").textContent = t[message];
  $("action").disabled = !result && (!selecting || state.selected === null);
  $("action").textContent = result ? t[resultKey() === "miss" ? "redeal" : "again"] : t.lock;
  $("hint").textContent = result ? t[resultKey() === "miss" ? "continueHint" : "resultHint"] : t[mode === "duel" ? "hint" : "soloHint"];
  cardButtons.forEach((button,index) => {
    const picked = index === state.first || index === state.second;
    const revealed = result || (state.phase === "reveal" && picked);
    button.disabled = !selecting || (state.phase === "second" && index === state.first);
    button.classList.toggle("selected", state.selected === index);
    button.classList.toggle("taken", state.phase === "second" && index === state.first);
    button.classList.toggle("revealed", revealed);
    button.setAttribute("aria-pressed",state.selected === index);
    const face = index === state.dragon ? "dragon" : "empty";
    // Concealed faces receive their image only at reveal time.
    const img = button.querySelector(".face");
    if (revealed) img.src = "./card-" + face + ".png";
    else img.removeAttribute("src");
    button.setAttribute("aria-label",t.card.replace("{n}",index + 1) + " · " + t[revealed ? face : "back"]);
    let label = "";
    if (state.phase !== "handoff") {
      if (index === state.first) label = mode === "solo" ? t.yours : t.p1;
      if (index === state.second) label = t.p2;
    }
    button.querySelector(".pick-label").textContent = label;
  });
}
function reveal() {
  state.phase = "reveal";
  state.selected = null;
  render();
  timers.push(setTimeout(() => {
    state.phase = "result";
    render();
    $("action").focus();
  },1500));
}
$("action").addEventListener("click", () => {
  if (state.phase === "result") { deal(); cardButtons[0].focus(); return; }
  if (!["first","second"].includes(state.phase) || state.selected === null) return;
  if (state.phase === "first") {
    state.first = state.selected;
    state.selected = null;
    if (mode === "solo") { reveal(); return; }
    state.phase = "handoff";
    render();
    $("handoff").showModal();
    return;
  }
  state.second = state.selected;
  reveal();
});
$("ready").addEventListener("click", () => {
  $("handoff").close();
  state.phase = "second";
  render();
  cardButtons.find(button => !button.disabled).focus();
});
$("handoff").addEventListener("cancel", event => event.preventDefault());
$("language").addEventListener("click", () => {
  language = language === "zh" ? "en" : "zh";
  render();
});
for (const selectedMode of ["duel","solo"]) {
  $(selectedMode + "-mode").addEventListener("click", () => {
    if (mode === selectedMode) return;
    mode = selectedMode;
    deal();
  });
}
document.querySelectorAll("[data-help]").forEach(button => button.addEventListener("click", () => $("help").showModal()));
$("close-help").addEventListener("click", () => $("help").close());
$("help-done").addEventListener("click", () => $("help").close());
deal();
