(function () {
  const params = new URLSearchParams(location.search);
  const gate = document.getElementById("join-gate");
  const game = document.getElementById("game");
  const joinInput = document.getElementById("join-code");
  const joinBtn = document.getElementById("join-btn");
  const joinError = document.getElementById("join-error");
  const clockEl = document.getElementById("clock");
  const heartsEl = document.getElementById("hearts");
  const tixEl = document.getElementById("tix");
  const tixFloat = document.getElementById("tix-float");
  const errorsLog = document.getElementById("errors-log");
  const character = document.getElementById("character");
  const characterBody = document.getElementById("character-body");
  const scene = document.getElementById("scene");
  const stage = document.getElementById("stage");

  let sync = null;
  let bystanders = null;
  let craft = null;
  let joinTimer = null;
  let lastExprId = null;
  let lastCharId = null;
  let wasVisible = false;
  let lastHearts = 3;
  let lastPopupId = null;

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

  function showTixFloat(amount) {
    if (!tixFloat || !amount) return;
    tixFloat.hidden = false;
    tixFloat.textContent = "+" + amount;
    tixFloat.classList.remove("pop");
    void tixFloat.offsetWidth;
    tixFloat.classList.add("pop");
    playSfx(moneyChingAudio);
    window.setTimeout(function () {
      tixFloat.classList.remove("pop");
      tixFloat.hidden = true;
    }, 700);
  }

  function findChar(id) {
    return (window.CHERRY_CHARACTERS || []).find((c) => c.id === id) || null;
  }

  function findExpr(char, exprId) {
    if (!char) return null;
    return (
      char.expressions.find((e) => e.id === exprId) ||
      char.expressions.find((e) => e.id === "neutral") ||
      char.expressions[0] ||
      null
    );
  }

  function playExprAnim(exprId) {
    const el = characterBody;
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

  function renderHearts(n) {
    heartsEl.innerHTML = "";
    for (let i = 0; i < 3; i++) {
      const d = document.createElement("div");
      d.className = "heart" + (i < n ? " on" : "");
      heartsEl.appendChild(d);
    }
  }

  function pushError(msg) {
    if (!errorsLog || !msg) return;
    const line = document.createElement("div");
    line.textContent = msg;
    errorsLog.appendChild(line);
    errorsLog.scrollTop = errorsLog.scrollHeight;
  }

  function renderCharacter(state) {
    const char = findChar(state.characterId);
    const expr = findExpr(char, state.expressionId);
    const visible = !!(state.characterVisible && char);
    const exprChanged =
      visible &&
      wasVisible &&
      (state.expressionId !== lastExprId || state.characterId !== lastCharId);

    character.classList.toggle("fit-tall", !!(char && char.fit === "tall"));
    character.classList.toggle("fit-counter", !!(char && char.fit === "counter"));

    if (visible) character.classList.add("in");
    else character.classList.remove("in");

    characterBody.innerHTML = "";
    if (!char) {
      wasVisible = false;
      lastExprId = null;
      lastCharId = null;
      return;
    }

    if (expr && expr.src) {
      const img = document.createElement("img");
      img.src = expr.src;
      img.alt = char.name + " — " + (expr.label || "");
      characterBody.appendChild(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "placeholder-char missing-expr";
      ph.style.background = "transparent";
      characterBody.appendChild(ph);
    }

    if (exprChanged && visible && expr && expr.src) {
      playExprAnim(state.expressionId);
    }

    wasVisible = visible;
    lastExprId = state.expressionId;
    lastCharId = state.characterId;
  }

  function applyState(state) {
    if (!state) return;
    clockEl.textContent = state.clock || "0X:XX";
    tixEl.textContent = String(state.tix ?? 0);
    const hearts = Number(state.hearts) || 0;
    if (hearts < lastHearts) playSfx(heartLoseAudio);
    lastHearts = hearts;
    renderHearts(hearts);
    renderCharacter(state);
    if (
      state.tixPopup &&
      state.tixPopup.amount &&
      state.tixPopup.id &&
      state.tixPopup.id !== lastPopupId
    ) {
      lastPopupId = state.tixPopup.id;
      showTixFloat(state.tixPopup.amount);
    }
  }

  function showGame() {
    gate.style.display = "none";
    gate.hidden = true;
    game.hidden = false;
    game.style.display = "grid";
    joinBtn.disabled = false;
    document.body.classList.add("in-game");
    applyState(sync ? sync.getState() : window.CherrySync.DEFAULT_STATE);
    if (!bystanders && window.CherryBystanders) {
      bystanders = window.CherryBystanders.createBystanders(scene);
    }
    if (bystanders) bystanders.start();
    if (!craft && window.CherryCraft) {
      craft = window.CherryCraft.createCraft(stage, {
        onDrink: function (recipe) {
          if (sync) sync.setState({ lastDrink: recipe.id });
        },
        onServe: function (recipe) {
          if (sync) sync.setState({ lastServed: recipe.id, lastServedAt: Date.now() });
        },
        onFail: function () {
          pushError("Bad mix — dumped.");
        },
      });
    }
  }

  function failJoin(message) {
    if (joinTimer) {
      clearTimeout(joinTimer);
      joinTimer = null;
    }
    if (sync) {
      try {
        sync.destroy();
      } catch (_) {}
      sync = null;
    }
    joinBtn.disabled = false;
    joinError.textContent = message || "Wrong code.";
  }

  function startPlayer(code) {
    if (sync) {
      try {
        sync.destroy();
      } catch (_) {}
      sync = null;
    }
    if (joinTimer) {
      clearTimeout(joinTimer);
      joinTimer = null;
    }

    const clean = window.CherrySync.normalizeCode(code);
    joinInput.value = clean;
    if (clean.length !== 4) {
      joinError.textContent = "Need the 4-letter code from Admin.";
      return;
    }

    joinError.textContent = "Connecting…";
    joinBtn.disabled = true;
    let entered = false;

    sync = window.CherrySync.createSync("player", { code: clean });
    sync.on((type, detail) => {
      if ((type === "status" && detail === "connected") || type === "state") {
        if (!entered) {
          entered = true;
          if (joinTimer) {
            clearTimeout(joinTimer);
            joinTimer = null;
          }
          joinError.textContent = "";
          showGame();
        }
        if (type === "state") applyState(detail);
      }
      if (type === "error" && !entered) {
        failJoin(typeof detail === "string" ? detail : "Wrong code.");
      }
    });
    sync.start();

    joinTimer = setTimeout(function () {
      if (!entered) failJoin("Wrong code — no Admin with that sync code.");
    }, 8000);
  }

  joinBtn.addEventListener("click", () => {
    joinError.textContent = "";
    startPlayer(joinInput.value);
  });
  joinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") joinBtn.click();
  });
  joinInput.addEventListener("input", () => {
    joinInput.value = window.CherrySync.normalizeCode(joinInput.value);
  });

  renderHearts(3);

  if (params.get("code")) {
    joinInput.value = params.get("code");
    startPlayer(params.get("code"));
  }
})();
