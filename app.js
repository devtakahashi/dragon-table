"use strict";
const $ = (id) => document.getElementById(id);
window.demoStats = { dragon: 0, cat: 0, loss: 0 };
let cat = 1;
// Explicit Shuffle and Reveal actions always animate; no separate toggle.
const cardAnimations = new Set();
function stopCardAnimations() {
  cardAnimations.forEach((a) => a.cancel());
  cardAnimations.clear();
}
function animateCard(node, frames, options) {
  if (!node.animate) return;
  const animation = node.animate(frames, options);
  cardAnimations.add(animation);
  animation.finished.then(
    () => cardAnimations.delete(animation),
    () => cardAnimations.delete(animation),
  );
  return animation;
}
const revealImages = {};
for (const kind of ["cat", "dragon"]) {
  const image = new Image();
  image.src = `card-${kind}.webp`;
  image.alt = kind === "cat" ? "猫师傅" : "龙";
  revealImages[kind] = image;
  image.decode?.().catch(() => {});
}
let selected = null,
  dragon = 0,
  phase = "choose",
  timer = null,
  mode = "solo",
  stake = 0;
function randomCard() {
  let b = new Uint8Array(1);
  do {
    crypto.getRandomValues(b);
  } while (b[0] === 255);
  return b[0] % 5;
}
const cards = Array.from({ length: 5 }, (_, i) => {
  const b = document.createElement("button");
  b.className = "card";
  b.style.setProperty("--i", i);
  b.type = "button";
  b.innerHTML =
    '<span class="inner"><img src="card-back.webp" alt=""><span class="face"></span></span>';
  b.setAttribute("aria-label", `第${i + 1}张牌`);
  b.addEventListener("click", () => {
    if (phase !== "choose") return;
    selected = i;
    render();
  });
  $("cards").append(b);
  return b;
});
function valid() {
  const n = Number($("stake").value);
  return (
    Number.isFinite(n) &&
    n >= 0.01 &&
    n <= 1000000 &&
    Math.abs(n * 100 - Math.round(n * 100)) < 0.00001
  );
}
function render() {
  $("shuffle").disabled =
    ["spin", "shuffle"].includes(phase) || mode === "duel";
  $("invite").hidden = mode !== "duel";
  cards.forEach((b, i) => {
    b.classList.toggle("selected", selected === i);
    b.disabled = phase !== "choose" || mode === "duel";
    b.setAttribute("aria-pressed", String(selected === i));
  });
  $("stake").disabled = ["spin", "shuffle"].includes(phase);
  $("action").disabled =
    mode === "duel" ||
    ["spin", "shuffle"].includes(phase) ||
    (phase === "choose" && (selected === null || !valid()));
  $("action").textContent =
    phase === "done" ? "再试一次" : phase === "spin" ? "正在揭晓…" : "确认下注";
  $("phase").textContent =
    mode === "duel"
      ? "在线对决筹备中，敬请期待"
      : phase === "spin"
        ? "龙牌即将揭晓…"
        : phase === "done"
          ? "本轮已结束"
          : !valid()
            ? "请输入 0.01 至 1,000,000，最多两位小数"
            : selected === null
              ? "请选择一张牌"
              : `已选择第${selected + 1}张牌`;
}
function reset() {
  clearTimeout(timer);
  stopCardAnimations();
  $("cards").classList.remove("shuffling");
  phase = "choose";
  selected = null;
  dragon = randomCard();
  do {
    cat = randomCard();
  } while (cat === dragon);
  cards.forEach((b) => {
    b.classList.remove("spinning", "revealed");
    delete b.dataset.win;
    b.setAttribute("aria-label", `第${cards.indexOf(b) + 1}张牌`);
    b.querySelector(".face").replaceChildren();
  });
  $("celebration").replaceChildren();
  $("celebration").hidden = true;
  $("result").className = "";
  $("result").textContent = "选牌后确认，揭晓你的运气。";
  render();
}
const winSoundButton = $("win-sound");
let winSoundEnabled = true;
try {
  winSoundEnabled = localStorage.getItem("dragon-table-win-sound") !== "off";
} catch {
  // The toggle can still work for this page when storage is unavailable.
}
let winAudio;
let winVolume;

function updateWinSoundButton() {
  winSoundButton.textContent = winSoundEnabled ? "胜利音效：开" : "胜利音效：关";
  winSoundButton.setAttribute("aria-pressed", String(winSoundEnabled));
  if (winVolume) winVolume.gain.value = winSoundEnabled ? 0.30 : 0;
}

function unlockWinSound() {
  if (!winSoundEnabled) return;
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  try {
    if (!winAudio) {
      winAudio = new Audio();
      winVolume = winAudio.createGain();
      winVolume.gain.value = 0.30;
      winVolume.connect(winAudio.destination);
    }
    // Resume inside the tap, before the asynchronous card reveal.
    if (winAudio.state !== "running") winAudio.resume().catch(() => {});
  } catch {
    // Audio is optional; a browser audio error must not interrupt the round.
  }
}

function playWinSound(kind) {
  if (!winSoundEnabled || winAudio?.state !== "running" || !winVolume) return;
  const melody = kind === "cat" ? [67, 69, 72, 76] : [60, 64, 67, 69, 72, 76];
  const start = winAudio.currentTime + 0.02;
  melody.forEach((note, index) => {
    const time = start + index * 0.17;
    const frequency = 440 * 2 ** ((note - 69) / 12);
    // A short plucked tone with quickly decaying upper partials.
    [1, 2, 3].forEach((partial) => {
      const voice = winAudio.createOscillator();
      const envelope = winAudio.createGain();
      const decay = partial === 1 ? 0.42 : 0.17;
      voice.frequency.value = frequency * partial;
      envelope.gain.setValueAtTime(0.0001, time);
      envelope.gain.exponentialRampToValueAtTime(0.28 / partial ** 2, time + 0.008);
      envelope.gain.exponentialRampToValueAtTime(0.0001, time + decay);
      voice.connect(envelope);
      envelope.connect(winVolume);
      voice.onended = () => {
        voice.disconnect();
        envelope.disconnect();
      };
      voice.start(time);
      voice.stop(time + decay + 0.01);
    });
  });
}

winSoundButton.addEventListener("click", () => {
  winSoundEnabled = !winSoundEnabled;
  try {
    localStorage.setItem("dragon-table-win-sound", winSoundEnabled ? "on" : "off");
  } catch {
    // The current page still respects the toggle.
  }
  updateWinSoundButton();
  unlockWinSound();
});
updateWinSoundButton();

function celebrateWin(card, kind) {
  const layer = $("celebration");
  card.dataset.win = kind;
  layer.hidden = false;
  layer.dataset.win = kind;
  const bounds = layer.getBoundingClientRect();
  const box = card.getBoundingClientRect();
  const x = box.left - bounds.left + box.width / 2;
  const y = box.top - bounds.top + box.height / 2;
  layer.style.setProperty("--win-x", `${x}px`);
  layer.style.setProperty("--win-y", `${y}px`);

  for (let i = 0; i < 16; i++) {
    const particle = document.createElement("i");
    const angle = (i / 16) * Math.PI * 2;
    const radius = Math.min(110, bounds.width * 0.27) * (0.65 + (i % 3) * 0.17);
    layer.append(particle);
    animateCard(particle, [
      { transform: "translate(0, 0) scale(0.5)", opacity: 1 },
      { transform: `translate(${Math.cos(angle) * radius}px, ${Math.sin(angle) * radius}px) rotate(200deg)`, opacity: 0 }
    ], { duration: 1050 + (i % 4) * 110, easing: "ease-out" });
  }
}

$("stake").addEventListener("input", render);
$("action").addEventListener("click", () => {
  if (phase === "done") {
    reset();
    return;
  }
  if (phase !== "choose" || selected === null || !valid() || mode !== "solo")
    return;
  unlockWinSound();
  stake = Number($("stake").value);
  phase = "spin";
  cards[selected].classList.add("spinning");
  animateCard(
    cards[selected].querySelector(".inner"),
    [
      { transform: "scaleX(1)" },
      { transform: "scaleX(0.06)", offset: 0.5 },
      { transform: "scaleX(1)" },
    ],
    { duration: 500, iterations: 6, easing: "ease-in-out" },
  );
  $("result").textContent = "三秒寻龙 · 本轮不扣款";
  render();
  timer = setTimeout(() => {
    phase = "done";
    const b = cards[selected],
      face = b.querySelector(".face"),
      won = selected === dragon || selected === cat;
    stopCardAnimations();
    b.classList.remove("spinning");
    if (won) {
      const isCat = selected === cat;
      const img = revealImages[isCat ? "cat" : "dragon"];
      window.demoStats[isCat ? "cat" : "dragon"]++;
      img.src = isCat ? "card-cat.webp" : "card-dragon.webp";
      img.alt = isCat ? "猫师傅" : "龙";
      face.append(img);
      $("result").className = "win";
      $("result").textContent =
        `${selected === cat ? "遇见猫师傅！" : "寻龙成功！"}演示金额 ${stake.toFixed(2)} USDC · 奖金倍率待定`;
      celebrateWin(b, isCat ? "cat" : "dragon");
      playWinSound(isCat ? "cat" : "dragon");
    } else {
      window.demoStats.loss++;
      face.innerHTML = '<b aria-hidden="true">😭</b><small>与龙擦肩</small>';
      $("result").textContent = "差一点点！这张牌没有龙。";
    }
    b.classList.add("revealed");
    animateCard(
      b.querySelector(".inner"),
      [{ transform: "scaleX(0.06)" }, { transform: "scaleX(1)" }],
      { duration: 320, easing: "ease-out" },
    );
    b.setAttribute(
      "aria-label",
      won
        ? selected === cat
          ? "猫师傅牌"
          : "龙牌，寻龙成功"
        : "空牌，与龙擦肩",
    );
    render();
    $("action").focus({ preventScroll: true });
  }, 3000);
});
for (const m of ["solo", "duel"])
  $(m).addEventListener("click", () => {
    if (["spin", "shuffle"].includes(phase)) return;
    mode = m;
    for (const n of ["solo", "duel"])
      $(n).setAttribute("aria-pressed", String(m === n));
    reset();
    if (m === "duel")
      $("result").textContent =
        "钱包支付与在线匹配尚未开放，请先体验单人试玩。";
  });
$("shuffle").addEventListener("click", () => {
  if (["spin", "shuffle"].includes(phase) || mode !== "solo") return;
  reset();
  phase = "shuffle";
  render();
  $("phase").textContent = "正在洗牌 · 两轮";
  const gap =
    cards[1].getBoundingClientRect().left -
    cards[0].getBoundingClientRect().left;
  $("cards").classList.add("shuffling");
  cards.forEach((b, i) => {
    const gather = (2 - i) * gap;
    animateCard(
      b,
      [
        { transform: "translate(0,0) rotate(0deg)", offset: 0 },
        {
          transform: `translate(${gather}px,-24px) rotate(${i * 5 - 10}deg)`,
          offset: 0.4,
        },
        {
          transform: `translate(${gather * 0.4}px,-10px) rotate(${10 - i * 5}deg)`,
          offset: 0.65,
        },
        { transform: "translate(0,0) rotate(0deg)", offset: 1 },
      ],
      { duration: 750, iterations: 2, delay: i * 35, easing: "ease-in-out" },
    );
  });
  timer = setTimeout(() => {
    $("cards").classList.remove("shuffling");
    reset();
  }, 1700);
});
reset();

(() => {
  "use strict";
  const el = (id) => document.getElementById(id);
  let address = null,
    provider = null,
    selectedWallet = "phantom",
    busy = false,
    unsubscribe = () => {};
  const registered = new Set();
  const names = {
    jupiter: "Jupiter",
    phantom: "Phantom",
    solflare: "Solflare",
    backpack: "Backpack",
  };
  const api = Object.freeze({
    register(...wallets) {
      wallets.forEach((w) => registered.add(w));
      return () => wallets.forEach((w) => registered.delete(w));
    },
  });
  window.addEventListener("wallet-standard:register-wallet", (event) => {
    if (typeof event.detail === "function") event.detail(api);
  });
  window.dispatchEvent(
    new CustomEvent("wallet-standard:app-ready", { detail: api }),
  );
  function solAccount(accounts) {
    return (
      accounts?.find((a) => a.chains?.some((c) => c.startsWith("solana:")))
        ?.address || null
    );
  }
  function getProvider(id) {
    const standard = [...registered].find(
      (w) =>
        w.name.toLowerCase().includes(id) &&
        w.chains?.some((c) => c.startsWith("solana:")) &&
        w.features?.["standard:connect"],
    );
    if (standard)
      return {
        connect: async () =>
          solAccount(
            (await standard.features["standard:connect"].connect()).accounts,
          ),
        disconnect: () =>
          standard.features["standard:disconnect"]?.disconnect(),
        listen: (fn) =>
          standard.features["standard:events"]?.on("change", (change) => {
            if (change.accounts) fn(solAccount(change.accounts));
          }) || (() => {}),
      };
    const legacy = {
      phantom: window.phantom?.solana,
      solflare: window.solflare,
      backpack: window.backpack?.solana || window.backpack,
    }[id];
    if (!legacy?.connect) return null;
    return {
      connect: async () => {
        const r = await legacy.connect();
        return (r?.publicKey || legacy.publicKey)?.toString();
      },
      disconnect: () => legacy.disconnect(),
      listen: (fn) => {
        const change = (k) => fn(k?.toString() || null),
          off = () => fn(null);
        legacy.on?.("accountChanged", change);
        legacy.on?.("disconnect", off);
        return () => {
          legacy.removeListener?.("accountChanged", change);
          legacy.removeListener?.("disconnect", off);
        };
      },
    };
  }
  function account() {
    el("wallet-label").textContent = address ? "我的账户" : "连接钱包";
    el("wallet").setAttribute("aria-label", address ? "我的账户" : "连接钱包");
    el("address").textContent = address || "选择钱包";
    el("connect").hidden = !!address;
    el("disconnect").hidden = !address;
    el("balance").textContent = address ? "查询中…" : "尚未连接";
    if (address) loadBalance(address);
    el("dragon-wins").textContent = window.demoStats.dragon;
    el("cat-wins").textContent = window.demoStats.cat;
    el("losses").textContent = window.demoStats.loss;
    document.querySelectorAll("[data-wallet]").forEach((b) => {
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.wallet === selectedWallet),
      );
      b.disabled = busy || !!address;
    });
  }
  async function loadBalance(key) {
    try {
      const r = await fetch("https://api.mainnet-beta.solana.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [key, { commitment: "confirmed" }],
        }),
        signal: AbortSignal.timeout(8000),
      });
      const data = await r.json();
      if (!r.ok || !Number.isFinite(data.result?.value)) throw Error();
      if (address === key)
        el("balance").textContent =
          (data.result.value / 1e9).toFixed(4) + " SOL";
    } catch {
      if (address === key) el("balance").textContent = "暂时无法查询";
    }
  }
  function openMobileWallet() {
    const mobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!mobile) return false;
    const bases = {
      phantom: "https://phantom.com/ul/browse/",
      solflare: "https://solflare.com/ul/v1/browse/",
      backpack: "https://backpack.app/ul/v1/browse/",
    };
    if (!bases[selectedWallet]) return false;
    const target = new URL(location.href);
    target.searchParams.set("wallet", selectedWallet);
    target.hash = "";
    el("wallet-message").textContent =
      `正在打开 ${names[selectedWallet]}，请在钱包内确认连接。`;
    location.assign(
      bases[selectedWallet] +
        encodeURIComponent(target.href) +
        "?ref=" +
        encodeURIComponent(location.origin),
    );
    return true;
  }
  async function connect() {
    if (busy || address) return;
    const candidate = getProvider(selectedWallet);
    if (!candidate) {
      if (openMobileWallet()) return false;
      el("wallet-message").textContent =
        `未检测到 ${names[selectedWallet]}。请安装对应扩展，或在该钱包支持的内置浏览器中打开本站。`;
      return false;
    }
    busy = true;
    el("connect").disabled = true;
    el("connect").textContent = "等待钱包确认…";
    account();
    try {
      const key = await candidate.connect();
      if (!key) throw Error("No Solana account");
      unsubscribe();
      provider = candidate;
      address = key;
      unsubscribe = provider.listen((key) => {
        address = key;
        if (!key) {
          unsubscribe();
          provider = null;
          el("wallet-message").textContent = "钱包已断开。";
        }
        account();
      });
      el("wallet-message").textContent =
        "已连接 · 只读查询 SOL 余额，不请求签名或转账。";
      return true;
    } catch {
      el("wallet-message").textContent = "连接未完成，请在钱包中确认后重试。";
      return false;
    } finally {
      busy = false;
      el("connect").disabled = false;
      el("connect").textContent = "连接钱包";
      account();
    }
  }
  document.querySelectorAll("[data-wallet]").forEach((b) =>
    b.addEventListener("click", () => {
      if (busy || address) return;
      selectedWallet = b.dataset.wallet;
      el("wallet-message").textContent = "";
      account();
    }),
  );
  el("wallet").addEventListener("click", () => {
    account();
    el("wallet-dialog").showModal();
  });
  el("connect").addEventListener("click", connect);
  el("disconnect").addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    el("disconnect").disabled = true;
    try {
      await provider?.disconnect();
      unsubscribe();
      provider = null;
      address = null;
      el("wallet-message").textContent = "钱包已断开，可选择其他钱包。";
    } catch {
      el("wallet-message").textContent = "断开失败，请在钱包中断开连接。";
    } finally {
      busy = false;
      el("disconnect").disabled = false;
      account();
    }
  });
  document
    .querySelectorAll("dialog .close")
    .forEach((b) =>
      b.addEventListener("click", () => b.closest("dialog").close()),
    );
  const inviteName = el("invite-name");
  const nicknamePattern = /^[a-z0-9][a-z0-9-]{0,19}$/;
  let inviteAmount = 0;
  function summary(amount) {
    el("invite-summary").textContent = `${amount.toFixed(2)} USDC`;
    el("invite-status").textContent = "";
  }
  function updateInviteLink() {
    const nickname = inviteName.value.trim().toLowerCase();
    const validNickname = !nickname || nicknamePattern.test(nickname);
    el("copy-invite").disabled = !validNickname;
    el("invite-status").textContent = validNickname ? "" : "请使用 1–20 个字母、数字或连字符，首位须为字母或数字。";
    if (!validNickname) {
      el("invite-link").value = "";
      return;
    }
    const url = new URL(location.pathname, location.origin);
    const amountCode = Math.round(inviteAmount * 100).toString(36);
    url.hash = `invite=${nickname ? nickname + "." : ""}${amountCode}`;
    el("invite-link").value = url.href;
  }
  inviteName.addEventListener("input", updateInviteLink);
  el("invite").addEventListener("click", () => {
    if (!valid()) {
      el("phase").textContent = "请先输入有效金额";
      return;
    }
    inviteAmount = Number(el("stake").value);
    el("invite-title").textContent = "好友对决邀请";
    el("invite-host").hidden = true;
    el("invite-share").hidden = false;
    el("accept-invite").hidden = true;
    summary(inviteAmount);
    updateInviteLink();
    el("invite-dialog").showModal();
  });
  el("copy-invite").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(el("invite-link").value);
      el("invite-status").textContent = "链接已复制";
    } catch {
      el("invite-link").select();
      el("invite-status").textContent = "请手动复制上方链接";
    }
  });
  el("accept-invite").addEventListener("click", () => {
    el("invite-dialog").close();
    account();
    el("wallet-dialog").showModal();
    el("wallet-message").textContent =
      "连接后仍为邀请预览。真实下注尚未开放，不会扣款。";
  });
  const q = new URLSearchParams(location.search);
  const requestedWallet = q.get("wallet");
  if (Object.hasOwn(names, requestedWallet)) {
    selectedWallet = requestedWallet;
    account();
    el("wallet-dialog").showModal();
    el("wallet-message").textContent = "请点击连接钱包，在钱包中确认授权。";
  }
  function openSharedInvite(includeLegacy = false) {
    const shortInvite = new URLSearchParams(location.hash.slice(1)).get("invite");
    const shortMatch = shortInvite?.match(/^(?:([a-z0-9][a-z0-9-]{0,19})\.)?([a-z0-9]{1,6})$/);
    const legacyInvite = q.get("preview") === "1" && /^[a-f0-9-]{36}$/.test(q.get("invite") || "");
    if (shortInvite !== null || (includeLegacy && q.has("invite"))) {
      const n = shortMatch ? parseInt(shortMatch[2], 36) / 100 : legacyInvite ? Number(q.get("amount")) : NaN;
      if (Number.isFinite(n) && n >= 0.01 && n <= 1000000 &&
          Math.abs(n * 100 - Math.round(n * 100)) < 0.00001) {
        summary(n);
        const host = shortMatch?.[1];
        el("invite-title").textContent = "你已受邀对决";
        el("invite-host").hidden = !host;
        el("invite-host").textContent = host ? `邀请人 · ${host}` : "";
        el("invite-share").hidden = true;
        el("accept-invite").hidden = false;
        if (!el("wallet-dialog").open && !el("invite-dialog").open) el("invite-dialog").showModal();
      } else {
        el("phase").textContent = "邀请链接无效";
      }
    }
  }
  openSharedInvite(true);
  window.addEventListener("hashchange", () => openSharedInvite());
})();

(() => {
  const pages = {
    privacy:
      '<h1>隐私政策</h1><p class="notice">试玩版本说明 · 更新于 2026 年 11 月 13 日</p><h2>当前试玩版本</h2><p>选牌、演示金额和结果仅在当前页面内存中处理，刷新页面后重置。本站代码不设置分析追踪、不使用本地存储保存游戏记录，不向本站服务器提交钱包地址。</p><h2>网站访问</h2><p>网站由 Cloudflare 提供托管及网络服务。提供网页和保护服务所需的技术信息（例如 IP 地址、请求信息及设备信息）可能由服务提供商处理，具体以其政策为准。</p><h2>钱包与后续更新</h2><p>在你主动批准后，本站可通过 Jupiter、Phantom、Solflare 或 Backpack 获取公开钱包地址，用于页面显示和向 Solana 公共 RPC 请求 SOL 余额。RPC 提供商会接收地址和网络请求信息。本站不请求交易或签名。钱包服务商处理连接请求，适用其自身政策。邀请预览的金额及可选昵称包含在分享链接中，收到链接的人可以看到它们。真实账户、支付或数据收集启用前，将更新本政策并说明用途、保存期限及用户联系渠道。</p>',
    terms:
      '<h1>服务条款</h1><p class="notice">试玩版本说明 · 更新于 2026 年 11 月 13 日</p><h2>服务范围</h2><p>龙桌当前提供免费的浏览器游戏界面试玩。演示金额不是资产、余额或奖金，不可充值、提现、兑换或转让。</p><h2>使用条件</h2><p>本体验仅面向年满 18 周岁的用户。请遵守你所在地适用的规则。不得利用本站攻击系统、干扰其他用户或冒充运营方。</p><h2>结果与可用性</h2><p>试玩结果在浏览器内产生，可被本地修改，不构成可验证的真实资金游戏。服务可能调整或暂停。本站不承诺任何收益。</p><h2>正式服务</h2><p>真实资金功能尚未开放。运营主体、适用地区、支付、争议处理与正式服务条款仍需确定。</p>',
    rules:
      '<h1>游戏规则</h1><p class="notice">试玩版本说明 · 更新于 2026 年 11 月 13 日</p><h2>单人试玩</h2><p>每轮五张牌中放置一张龙牌、一张猫师傅牌和三张空牌。输入演示金额，点击一张牌，再点击「确认下注」。三秒动画结束后，所选卡牌揭晓。</p><h2>结果</h2><p>选中龙牌时显示金色庆祝效果，猫牌显示猫师傅，空牌显示哭泣表情。龙牌与猫牌各有五分之一的概率。动画不影响结果。</p><h2>演示金额与奖金</h2><p>输入金额仅用于展示，不会扣款。成功时显示本轮演示金额，不代表赢得该金额。真实奖金倍率尚未确定。</p><h2>双人模式</h2><p>双人对决暂未开放。在线匹配、双方选牌、资金结算与争议规则将在上线前公布。</p>',
    responsible:
      '<h1>理性游戏</h1><p class="notice">试玩版本说明 · 更新于 2026 年 11 月 13 日</p><h2>18 岁以上</h2><p>本网站仅面向成年人。当前体验免费，不涉及真实资金。</p><h2>保持适度</h2><p>为娱乐设置时间限制，定时休息。不要将随机游戏视作收入来源，不要追逐损失或借款参与。</p><h2>需要暂停时</h2><p>关闭页面即可结束当前试玩。如果游戏影响生活、工作或情绪，请与信任的人沟通，并寻求当地专业支持。</p><h2>功能状态</h2><p>当前没有真实账户，因此尚未提供账户级限额、自我排除或冷静期功能。真实资金服务开放前需要完善这些功能。</p>',
    support:
      '<h1>帮助与支持</h1><p class="notice">试玩版本说明 · 更新于 2026 年 11 月 13 日</p><h2>为什么无法连接钱包？</h2><p>当前支持兼容的钱包扩展或钱包内置浏览器进行地址连接（Jupiter、Phantom、Solflare、Backpack）。未检测到钱包时会显示提示。钱包支付尚未开放。请勿向任何声称能为本站充值的地址转账。</p><h2>如何重新开始？</h2><p>完成揭晓后点击「再试一次」。刷新页面也会清除当前试玩状态。</p><h2>显示异常</h2><p>请尝试刷新页面并使用较新的浏览器。动画支持系统减少动态效果设置。</p><h2>联系渠道</h2><p>官方客服邮箱尚未公布。正式服务开放前将在本页提供有效联系渠道。</p>',
  };
  const dialog = document.getElementById("page-dialog");
  function openPage() {
    const key = location.hash.replace("#page=", "");
    if (pages[key]) {
      document.getElementById("page-content").innerHTML = pages[key];
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) dialog.close();
  }
  window.addEventListener("hashchange", openPage);
  dialog.querySelector(".close").addEventListener("click", () => {
    history.replaceState(null, "", location.pathname + location.search);
    dialog.close();
  });
  dialog.addEventListener("cancel", () =>
    history.replaceState(null, "", location.pathname + location.search),
  );
  openPage();
})();

const sectionTabs = [...document.querySelectorAll(".section-tabs [role=tab]")];
function selectSection(tab) {
  for (const item of sectionTabs) {
    const active = item === tab;
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
    $(item.getAttribute("aria-controls")).hidden = !active;
  }
}
sectionTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectSection(tab));
  tab.addEventListener("keydown", (event) => {
    const nextIndex = { ArrowLeft: (index + 2) % 3, ArrowRight: (index + 1) % 3, Home: 0, End: 2 }[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    selectSection(sectionTabs[nextIndex]);
    sectionTabs[nextIndex].focus();
  });
});

const flipSpin = $("flip-spin");
const flipPointer = $("flip-pointer");
const flipStake = $("flip-stake");
let flipAngle = -90;
let retryStakeCents = null;

function spinRandomInt(limit) {
  const buffer = new Uint8Array(1);
  const cutoff = 256 - (256 % limit);
  do { crypto.getRandomValues(buffer); } while (buffer[0] >= cutoff);
  return buffer[0] % limit;
}

function flipPayouts() {
  const cents = retryStakeCents ?? Math.round(Number(flipStake.value) * 100);
  return {
    dragon: ((cents * 2) / 100).toFixed(2),
    fire: (Math.floor(cents / 5) / 100).toFixed(2),
  };
}

flipStake.addEventListener("input", () => {
  const payout = flipPayouts();
  $("flip-payout").textContent = flipStake.validity.valid
    ? `龙面返还 ${payout.dragon} USDC · 火面返还 ${payout.fire} USDC`
    : "请输入 0.05 至 1,000,000 USDC，最多两位小数。";
});

flipSpin.addEventListener("click", async () => {
  if (flipSpin.disabled) return;
  if (retryStakeCents === null && !flipStake.reportValidity()) return;
  const stakeCents = retryStakeCents ?? Math.round(Number(flipStake.value) * 100);
  const payout = flipPayouts();
  flipSpin.disabled = true;
  flipStake.disabled = true;
  unlockWinSound();
  $("flip-result").textContent = "正在旋转…";

  const roll = spinRandomInt(100);
  const dragon = roll < 37;
  const middle = roll >= 90;
  // Keep landings clear of the divider, with an independent angle in each half.
  const landingAngle = middle ? (spinRandomInt(2) ? 180 : 0)
    : (dragon ? 192 : 12) + spinRandomInt(157);
  const nextAngle = Math.ceil(flipAngle / 360) * 360 + 1440 + landingAngle;
  const animation = flipPointer.animate?.(
    [{ transform: `rotate(${flipAngle}deg)` }, { transform: `rotate(${nextAngle}deg)` }],
    { duration: 2000, easing: "cubic-bezier(.15,.55,.2,1)" },
  );
  await animation?.finished.catch(() => {});
  flipAngle = landingAngle;
  flipPointer.style.transform = `rotate(${flipAngle}deg)`;
  retryStakeCents = middle ? stakeCents : null;
  $("flip-result").textContent = middle
    ? `平局 · 保留 ${(stakeCents / 100).toFixed(2)} USDC，免费重转`
    : dragon
      ? `龙面 · 试玩返还 ${payout.dragon} USDC`
      : `火面 · 试玩返还 ${payout.fire} USDC`;
  flipSpin.textContent = middle ? "免费重转" : "再次旋转";
  flipStake.disabled = middle;
  flipSpin.disabled = false;
  if (dragon) playWinSound("dragon");
});

const receiptAmount = $("receipt-amount");
const receiptFile = $("receipt-preview");
const claimStatus = $("claim-status");
const claimButton = $("claim-cashback");

function resetClaimPreview() {
  claimButton.disabled = false;
  claimStatus.textContent = "试玩返现不会转入钱包。";
}

receiptFile.addEventListener("change", () => {
  $("receipt-file-status").textContent = receiptFile.files[0]?.name || "仅本地预览，尚未选择文件";
  resetClaimPreview();
});

receiptAmount.addEventListener("input", () => {
  resetClaimPreview();
  const amount = receiptAmount.validity.valid ? Number(receiptAmount.value) : 0;
  const baseCents = Math.floor(Math.round(amount * 100) / 10);
  $("receipt-base").textContent = `$${(baseCents / 100).toFixed(2)}`;
  $("receipt-total").textContent = `$${(Math.min(baseCents, 250) / 100).toFixed(2)}`;
});


claimButton.addEventListener("click", () => {
  if (!receiptFile.files.length) {
    claimStatus.textContent = "请先选择一张收据。";
    receiptFile.focus();
    return;
  }
  if (!receiptAmount.reportValidity() || Number(receiptAmount.value) < 0.10) {
    claimStatus.textContent = "请输入至少 0.10 美元的试玩收据金额。";
    receiptAmount.focus();
    return;
  }
  claimStatus.textContent = `试玩领取成功 · 返现 ${$("receipt-total").textContent} · 未发放资金`;
  claimButton.disabled = true;
});
