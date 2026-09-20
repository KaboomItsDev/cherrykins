(function () {
  const roomCodeEl = document.getElementById("room-code");
  const roomStatus = document.getElementById("room-status");
  const playerConnectedEl = document.getElementById("player-connected");
  const warningText = document.getElementById("warning-text");
  const warningSend = document.getElementById("warning-send");
  const charPick = document.getElementById("char-pick");
  const exprGrid = document.getElementById("expr-grid");
  const btnEnter = document.getElementById("btn-enter");
  const btnExit = document.getElementById("btn-exit");
  const heartsInput = document.getElementById("hearts");
  const tixInput = document.getElementById("tix");
  const moneyAmount = document.getElementById("money-amount");
  const moneyAdd = document.getElementById("money-add");
  const clockInput = document.getElementById("clock");
  const heartMinus = document.getElementById("heart-minus");
  const heartPlus = document.getElementById("heart-plus");
  const previewChar = document.getElementById("preview-character");
  const previewBody = document.getElementById("preview-body");

  const HEART_LOSE_SRC = "assets/ui/heart-lose.wav";
  const MONEY_CHING_SRC = "assets/ui/money-ching.wav";
  let heartLoseAudio = null;
  let moneyChingAudio = null;
  try {
    heartLoseAudio = new Audio(HEART_LOSE_SRC);
    heartLoseAudio.preload = "auto";
  } catch (_) {}
  try {
    moneyChingAudio = new Audio(MONEY_CHING_SRC);
    moneyChingAudio.preload = "auto";
  } catch (_) {}

  function playSfx(audio) {
    if (!audio) return;
    try {
      audio.currentTime = 0;
      const p = audio.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    } catch (_) {}
  }

  const chars = window.CHERRY_CHARACTERS || [];
  let selectedId = chars[0] ? chars[0].id : null;
  let lastExprId = null;
  let lastCharId = null;
  let wasVisible = false;

  const sync = window.CherrySync.createSync("admin");

  function statusLabel(s) {
    const map = {
      connecting: "Connecting…",
      waiting: "Waiting for Player — share the code above",
      connected: "Player connected — live",
      disconnected: "Player left — waiting again",
      error: "Connection error — refresh this page",
      idle: "Idle",
    };
    return map[s] || s;
  }

  function renderPlayerConnected(state) {
    if (!playerConnectedEl) return;
    const name = (state && state.playerConnectedName) || "";
    playerConnectedEl.textContent = name ? "Player: " + name : "Player: —";
    playerConnectedEl.classList.toggle("online", !!name);
  }

  function selectedChar() {
    return chars.find((c) => c.id === selectedId) || null;
  }

  function findExpr(char, exprId) {
    if (!char) return null;
    return char.expressions.find((e) => e.id === exprId) || char.expressions[0] || null;
  }

  function playExprAnim(el, exprId) {
    el.classList.remove("anim-jump", "anim-tremble");
    void el.offsetWidth;
    if (exprId === "annoyed") el.classList.add("anim-tremble");
    else el.classList.add("anim-jump");
    const clear = () => {
      el.classList.remove("anim-jump", "anim-tremble");
      el.removeEventListener("animationend", clear);
    };
    el.addEventListener("animationend", clear);
  }

  function push(partial) {
    sync.setState(partial);
    renderPreview(sync.getState());
    syncHeartsTixInputs();
  }

  function syncHeartsTixInputs() {
    const s = sync.getState();
    heartsInput.value = String(s.hearts ?? 3);
    tixInput.value = String(s.tix ?? 0);
  }

  function setHearts(n, playSound) {
    const prev = Number(sync.getState().hearts) || 0;
    n = Math.max(0, Math.min(3, n));
    if (playSound && n < prev) playSfx(heartLoseAudio);
    push({ hearts: n });
  }

  function addMoney() {
    const amount = Math.floor(Number(moneyAmount.value));
    if (!amount || amount < 1) {
      moneyAmount.focus();
      return;
    }
    const next = (Number(sync.getState().tix) || 0) + amount;
    playSfx(moneyChingAudio);
    push({
      tix: next,
      tixPopup: { amount: amount, id: Date.now() },
    });
    moneyAmount.value = "";
    moneyAmount.focus();
  }

  function renderPreview(state) {
    const char = chars.find((c) => c.id === state.characterId) || selectedChar();
    const expr = findExpr(char, state.expressionId);
    const visible = !!(state.characterVisible && char);
    const exprChanged =
      visible &&
      wasVisible &&
      (state.expressionId !== lastExprId || state.characterId !== lastCharId);

    previewChar.classList.toggle("fit-tall", !!(char && char.fit === "tall"));
    previewChar.classList.toggle("fit-counter", !!(char && char.fit === "counter"));
    previewChar.classList.toggle(
      "fit-counter-up",
      !!(char && char.fit === "counter-up")
    );

    if (visible) previewChar.classList.add("in");
    else previewChar.classList.remove("in");

    previewBody.innerHTML = "";
    if (char) {
      if (expr && expr.src) {
        const img = document.createElement("img");
        img.src = expr.src;
        img.alt = char.name;
        previewBody.appendChild(img);
      } else {
        const ph = document.createElement("div");
        ph.className = "placeholder-char missing-expr";
        previewBody.appendChild(ph);
      }
    }

    if (exprChanged && visible && expr && expr.src) playExprAnim(previewBody, state.expressionId);

    wasVisible = visible;
    lastExprId = state.expressionId;
    lastCharId = state.characterId;
  }

  function renderChars() {
    charPick.innerHTML = "";
    chars.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      if (c.id === selectedId) b.classList.add("active");
      b.innerHTML =
        '<span class="swatch" style="background:' +
        c.color +
        '"></span><span>' +
        c.name +
        "</span>";
      b.addEventListener("click", () => {
        selectedId = c.id;
        renderChars();
        renderExprs();
        const state = sync.getState();
        push({
          characterId: c.id,
          characterName: c.name,
          expressionId: state.expressionId || "neutral",
        });
      });
      charPick.appendChild(b);
    });
  }

  function renderExprs() {
    const char = selectedChar();
    exprGrid.innerHTML = "";
    if (!char) return;
    const current = sync.getState().expressionId;
    char.expressions.forEach((e) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = e.label + (e.src ? "" : " ·");
      if (!e.src) b.classList.add("dim");
      if (e.id === current) b.classList.add("active");
      b.addEventListener("click", () => {
        push({
          expressionId: e.id,
          characterId: char.id,
          characterName: char.name,
        });
        renderExprs();
      });
      exprGrid.appendChild(b);
    });
  }

  sync.on((type, detail) => {
    if (type === "code") roomCodeEl.textContent = detail;
    if (type === "status") {
      roomStatus.textContent = statusLabel(detail);
      if (
        (detail === "waiting" || detail === "disconnected") &&
        sync.getState().playerConnectedName
      ) {
        push({ playerConnectedName: "" });
      }
    }
    if (type === "error") roomStatus.textContent = String(detail);
    if (type === "state") {
      renderExprs();
      renderPreview(detail);
      syncHeartsTixInputs();
      renderPlayerConnected(detail);
    }
  });

  if (warningSend) {
    warningSend.addEventListener("click", () => {
      const text = String(warningText && warningText.value ? warningText.value : "")
        .trim()
        .slice(0, 200);
      if (!text) {
        if (warningText) warningText.focus();
        return;
      }
      push({
        warning: { id: Date.now(), text: text },
      });
      if (warningText) warningText.value = "";
    });
  }

  btnEnter.addEventListener("click", () => {
    const char = selectedChar();
    if (!char) return;
    push({
      characterVisible: true,
      characterId: char.id,
      characterName: char.name,
      expressionId: sync.getState().expressionId || "neutral",
    });
  });

  btnExit.addEventListener("click", () => {
    push({ characterVisible: false });
  });

  heartMinus.addEventListener("click", () => {
    setHearts((Number(sync.getState().hearts) || 0) - 1, true);
  });
  heartPlus.addEventListener("click", () => {
    setHearts((Number(sync.getState().hearts) || 0) + 1, false);
  });

  moneyAdd.addEventListener("click", addMoney);
  moneyAmount.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addMoney();
    }
  });

  clockInput.addEventListener("change", () => {
    push({ clock: clockInput.value || "0X:XX" });
  });

  window.addEventListener("keydown", (e) => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const char = selectedChar();
    if (!char) return;
    const idx = Number(e.key) - 1;
    if (idx >= 0 && idx < char.expressions.length) {
      push({
        expressionId: char.expressions[idx].id,
        characterId: char.id,
        characterName: char.name,
      });
      renderExprs();
    }
    if (e.key === "i" || e.key === "I") btnEnter.click();
    if (e.key === "o" || e.key === "O") btnExit.click();
  });

  renderChars();
  renderExprs();
  renderPreview(sync.getState());
  sync.start();

  if (window.CherryBystanders) {
    const adminScene = document.getElementById("admin-scene");
    const crowd = window.CherryBystanders.createBystanders(adminScene);
    crowd.start();
  }

  if (selectedId) {
    const char = selectedChar();
    push({
      characterId: char.id,
      characterName: char.name,
      expressionId: "neutral",
      hearts: 3,
      tix: 0,
      tixPopup: null,
      clock: "0X:XX",
    });
  }
})();
