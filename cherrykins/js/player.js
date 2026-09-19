(function () {
  const params = new URLSearchParams(location.search);
  const gate = document.getElementById("join-gate");
  const game = document.getElementById("game");
  const joinInput = document.getElementById("join-code");
  const joinBtn = document.getElementById("join-btn");
  const joinError = document.getElementById("join-error");
  const syncPill = document.getElementById("sync-pill");
  const clockEl = document.getElementById("clock");
  const heartsEl = document.getElementById("hearts");
  const tixEl = document.getElementById("tix");
  const mugPlaceholder = document.getElementById("mug-placeholder");
  const mugImg = document.getElementById("mug-img");
  const mugName = document.getElementById("mug-name");
  const character = document.getElementById("character");
  const characterBody = document.getElementById("character-body");
  const dialogueEl = document.getElementById("dialogue");
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

  function findChar(id) {
    return (window.CHERRY_CHARACTERS || []).find((c) => c.id === id) || null;
  }

  function findExpr(char, exprId) {
    if (!char) return null;
    return char.expressions.find((e) => e.id === exprId) || char.expressions[0] || null;
  }

  function setSyncPill(status) {
    syncPill.className = "sync-pill";
    const map = {
      connected: ["ok", "synced"],
      waiting: ["wait", "waiting"],
      connecting: ["wait", "connecting…"],
      disconnected: ["bad", "disconnected"],
      error: ["bad", "error"],
      idle: ["", "offline"],
    };
    const [cls, label] = map[status] || map.idle;
    if (cls) syncPill.classList.add(cls);
    syncPill.textContent = label;
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

    if (state.characterVisible && char) {
      character.classList.add("in");
    } else {
      character.classList.remove("in");
    }

    characterBody.innerHTML = "";
    if (!char) return;

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
      mugPlaceholder.textContent = expr ? expr.label : "Mug shot";
      mugPlaceholder.style.background = char.color;
      mugPlaceholder.style.color = "#fff";
    }

    const name = state.characterName || char.name;
    mugName.textContent = name;
    mugName.hidden = !name;
  }

  function renderDialogue(text) {
    if (text && String(text).trim()) {
      dialogueEl.textContent = text;
      dialogueEl.classList.add("show");
    } else {
      dialogueEl.classList.remove("show");
      dialogueEl.textContent = "";
    }
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
    clockEl.textContent = state.clock || "0X:XX";
    tixEl.textContent = String(state.tix ?? 0);
    renderHearts(Number(state.hearts) || 0);
    renderCharacter(state);
    renderDialogue(state.dialogue);
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

  function startPlayer(code) {
    sync = window.CherrySync.createSync("player", { code });
    sync.on((type, detail) => {
      if (type === "status") setSyncPill(detail);
      if (type === "state") applyState(detail);
      if (type === "error") {
        joinError.textContent = detail;
        setSyncPill("error");
      }
    });
    sync.start();
    gate.hidden = true;
    game.hidden = false;
    applyState(sync.getState());
  }

  joinBtn.addEventListener("click", () => {
    joinError.textContent = "";
    startPlayer(joinInput.value);
  });
  joinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") joinBtn.click();
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
