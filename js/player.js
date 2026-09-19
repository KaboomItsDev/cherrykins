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
  const mugPlaceholder = document.getElementById("mug-placeholder");
  const mugImg = document.getElementById("mug-img");
  const mugName = document.getElementById("mug-name");
  const character = document.getElementById("character");
  const characterBody = document.getElementById("character-body");
  const cansEl = document.getElementById("cans");
  const mixTags = document.getElementById("mix-tags");
  const recipesEl = document.getElementById("recipes");
  const recipeList = document.getElementById("recipe-list");
  const menuArrow = document.getElementById("menu-arrow");
  const tablet = document.getElementById("tablet");
  const recipesClose = document.getElementById("recipes-close");
  const iceTray = document.getElementById("ice-tray");
  const stripeCan = document.getElementById("stripe-can");

  let sync = null;
  let mix = [];
  let lastExprId = null;
  let lastCharId = null;
  let wasVisible = false;
  let lastHearts = 3;

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

  function playHeartLose() {
    playSfx(heartLoseAudio);
  }

  let lastPopupId = null;

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
    return char.expressions.find((e) => e.id === exprId) || char.expressions[0] || null;
  }

  function playExprAnim(exprId) {
    const el = characterBody;
    el.classList.remove("anim-jump", "anim-tremble");
    void el.offsetWidth;
    if (exprId === "annoyed") {
      el.classList.add("anim-tremble");
    } else {
      el.classList.add("anim-jump");
    }
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

  function renderCharacter(state) {
    const char = findChar(state.characterId);
    const expr = findExpr(char, state.expressionId);
    const visible = !!(state.characterVisible && char);
    const exprChanged =
      visible &&
      wasVisible &&
      (state.expressionId !== lastExprId || state.characterId !== lastCharId);

    if (visible) {
      character.classList.add("in");
    } else {
      character.classList.remove("in");
    }

    characterBody.innerHTML = "";
    if (!char) {
      wasVisible = false;
      lastExprId = null;
      lastCharId = null;
      mugName.textContent = "";
      return;
    }

    if (expr && expr.src) {
      const img = document.createElement("img");
      img.src = expr.src;
      img.alt = char.name + " — " + expr.label;
      characterBody.appendChild(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "placeholder-char";
      ph.style.background = char.color;
      const label = document.createElement("div");
      label.className = "expr-label";
      label.textContent = expr ? expr.label : "—";
      ph.appendChild(label);
      characterBody.appendChild(ph);
    }

    if (expr && expr.src) {
      mugImg.src = expr.src;
      mugImg.hidden = false;
      mugPlaceholder.hidden = true;
    } else {
      mugImg.hidden = true;
      mugPlaceholder.hidden = false;
      mugPlaceholder.textContent = "";
      mugPlaceholder.style.background = char.color;
    }

    mugName.textContent = state.characterName || char.name || "";

    if (exprChanged && visible) {
      playExprAnim(state.expressionId);
    }

    wasVisible = visible;
    lastExprId = state.expressionId;
    lastCharId = state.characterId;
  }

  function renderMix() {
    mixTags.innerHTML = "";
    mix.forEach((id) => {
      const ing = (window.CHERRY_INGREDIENTS || []).find((i) => i.id === id);
      const s = document.createElement("span");
      s.textContent = ing ? ing.label : id;
      mixTags.appendChild(s);
    });
  }

  function addMix(id) {
    if (mix.length >= 6) mix.shift();
    mix.push(id);
    renderMix();
    if (sync) sync.setState({ mix: mix.slice() });
  }

  function applyState(state) {
    if (!state) return;
    clockEl.textContent = state.clock || "0X:XX";
    tixEl.textContent = String(state.tix ?? 0);
    const hearts = Number(state.hearts) || 0;
    if (hearts < lastHearts) playHeartLose();
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
    if (Array.isArray(state.mix)) {
      mix = state.mix.slice();
      renderMix();
    }
  }

  function buildCans() {
    cansEl.innerHTML = "";
    (window.CHERRY_INGREDIENTS || [])
      .filter((i) => i.id !== "stripe")
      .forEach((ing) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "can";
        b.textContent = ing.label;
        b.style.background = ing.color;
        b.addEventListener("click", () => addMix(ing.id));
        cansEl.appendChild(b);
      });
  }

  function buildRecipes() {
    recipeList.innerHTML = "";
    (window.CHERRY_RECIPES || []).forEach((r) => {
      const card = document.createElement("article");
      card.className = "recipe-card";
      card.innerHTML =
        "<h3>" +
        r.name +
        "</h3><p>" +
        r.blurb +
        '</p><div class="steps">' +
        r.steps.join(" → ") +
        "</div>";
      recipeList.appendChild(card);
    });
  }

  function toggleRecipes(force) {
    const open = force !== undefined ? force : !recipesEl.classList.contains("open");
    recipesEl.classList.toggle("open", open);
    recipesEl.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function showGame() {
    gate.style.display = "none";
    gate.hidden = true;
    game.hidden = false;
    game.style.display = "grid";
    joinBtn.disabled = false;
    document.body.classList.add("in-game");
    applyState(sync ? sync.getState() : window.CherrySync.DEFAULT_STATE);
  }

  function startPlayer(code) {
    if (sync) {
      try {
        sync.destroy();
      } catch (_) {}
      sync = null;
    }

    const clean = window.CherrySync.normalizeCode(code);
    joinInput.value = clean;
    joinError.textContent = "Opening bar…";
    showGame();

    sync = window.CherrySync.createSync("player", { code: clean });
    sync.on((type, detail) => {
      if (type === "state") applyState(detail);
      if (type === "error") joinError.textContent = detail;
    });
    sync.start();
  }

  joinBtn.addEventListener("click", () => {
    const code = window.CherrySync.normalizeCode(joinInput.value);
    if (code.length !== 4) {
      joinError.textContent = "Need the 4-letter code from Admin.";
      return;
    }
    startPlayer(code);
  });
  joinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") joinBtn.click();
  });
  joinInput.addEventListener("input", () => {
    joinInput.value = window.CherrySync.normalizeCode(joinInput.value);
  });

  menuArrow.addEventListener("click", () => toggleRecipes());
  tablet.addEventListener("click", () => toggleRecipes());
  recipesClose.addEventListener("click", () => toggleRecipes(false));
  iceTray.addEventListener("click", () => addMix("ice"));
  stripeCan.addEventListener("click", () => addMix("stripe"));

  buildCans();
  buildRecipes();
  renderHearts(3);

  if (params.get("code")) {
    joinInput.value = params.get("code");
    startPlayer(params.get("code"));
  }
})();
