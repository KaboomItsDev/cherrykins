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
  const previewChar = document.getElementById("preview-character");
  const previewBody = document.getElementById("preview-body");
  const previewDialogue = document.getElementById("preview-dialogue");

  const chars = window.CHERRY_CHARACTERS || [];
  let selectedId = chars[0] ? chars[0].id : null;

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

  function selectedChar() {
    return chars.find((c) => c.id === selectedId) || null;
  }

  function findExpr(char, exprId) {
    if (!char) return null;
    return char.expressions.find((e) => e.id === exprId) || char.expressions[0] || null;
  }

  function push(partial) {
    sync.setState(partial);
    renderPreview(sync.getState());
  }

  function renderPreview(state) {
    const char = chars.find((c) => c.id === state.characterId) || selectedChar();
    const expr = findExpr(char, state.expressionId);

    if (state.characterVisible && char) {
      previewChar.classList.add("in");
    } else {
      previewChar.classList.remove("in");
    }

    previewBody.innerHTML = "";
    if (char) {
      if (expr && expr.src) {
        const img = document.createElement("img");
        img.src = expr.src;
        img.alt = char.name;
        previewBody.appendChild(img);
      } else {
        const ph = document.createElement("div");
        ph.className = "placeholder-char";
        ph.style.background = char.color;
        const label = document.createElement("div");
        label.className = "expr-label";
        label.textContent = (char.name + " · " + (expr ? expr.label : "")).trim();
        ph.appendChild(label);
        previewBody.appendChild(ph);
      }
    }

    if (state.dialogue && String(state.dialogue).trim()) {
      previewDialogue.textContent = state.dialogue;
      previewDialogue.classList.add("show");
    } else {
      previewDialogue.classList.remove("show");
      previewDialogue.textContent = "";
    }
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
    if (type === "status") roomStatus.textContent = statusLabel(detail);
    if (type === "error") roomStatus.textContent = String(detail);
    if (type === "state") {
      renderExprs();
      renderPreview(detail);
    }
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
