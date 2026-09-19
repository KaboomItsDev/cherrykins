(function () {
  const roomCodeEl = document.getElementById("room-code");
  const roomStatus = document.getElementById("room-status");
  const charPick = document.getElementById("char-pick");
  const exprGrid = document.getElementById("expr-grid");
  const btnEnter = document.getElementById("btn-enter");
  const btnExit = document.getElementById("btn-exit");
  const heartsInput = document.getElementById("hearts");
  const tixInput = document.getElementById("tix");
  const clockInput = document.getElementById("clock");
  const dialogueInput = document.getElementById("dialogue");
  const btnSay = document.getElementById("btn-say");
  const btnClearLine = document.getElementById("btn-clear-line");

  const chars = window.CHERRY_CHARACTERS || [];
  let selectedId = chars[0] ? chars[0].id : null;

  const sync = window.CherrySync.createSync("admin");

  function statusLabel(s) {
    const map = {
      connecting: "Connecting to PeerJS…",
      waiting: "Waiting for Player to join…",
      connected: "Player connected — live",
      disconnected: "Player disconnected",
      error: "Connection error",
      idle: "Idle",
    };
    return map[s] || s;
  }

  function selectedChar() {
    return chars.find((c) => c.id === selectedId) || null;
  }

  function push(partial) {
    sync.setState(partial);
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
      b.textContent = e.label;
      if (e.id === current) b.classList.add("active");
      b.addEventListener("click", () => {
        push({ expressionId: e.id, characterId: char.id, characterName: char.name });
        renderExprs();
      });
      exprGrid.appendChild(b);
    });
  }

  sync.on((type, detail) => {
    if (type === "code") roomCodeEl.textContent = detail;
    if (type === "status") roomStatus.textContent = statusLabel(detail);
    if (type === "error") roomStatus.textContent = String(detail);
    if (type === "state") renderExprs();
  });

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
    push({ characterVisible: false, dialogue: "" });
  });

  heartsInput.addEventListener("change", () => {
    let n = Number(heartsInput.value);
    if (Number.isNaN(n)) n = 0;
    n = Math.max(0, Math.min(3, n));
    heartsInput.value = String(n);
    push({ hearts: n });
  });

  tixInput.addEventListener("change", () => {
    let n = Number(tixInput.value);
    if (Number.isNaN(n)) n = 0;
    n = Math.max(0, n);
    tixInput.value = String(n);
    push({ tix: n });
  });

  clockInput.addEventListener("change", () => {
    push({ clock: clockInput.value || "0X:XX" });
  });

  btnSay.addEventListener("click", () => {
    push({ dialogue: dialogueInput.value });
  });

  btnClearLine.addEventListener("click", () => {
    dialogueInput.value = "";
    push({ dialogue: "" });
  });

  // Keyboard shortcuts for fast expression swaps during voice chat
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
  sync.start();

  // Seed initial character id so first Slide in works cleanly
  if (selectedId) {
    const char = selectedChar();
    push({
      characterId: char.id,
      characterName: char.name,
      expressionId: "neutral",
      hearts: 3,
      tix: 0,
      clock: "0X:XX",
    });
  }
})();
