/**
 * Undertable craft: ice, shaker, bottles, menu, bell.
 */
(function (global) {
  function createCraft(root, opts) {
    opts = opts || {};
    const stage = root;
    const mix = window.CherryDrinks.emptyMix();
    let drinkEl = null;
    let drinkRecipe = null;
    let dragging = null;
    let shakeYs = [];
    let shakeDir = 0;
    let shakeCount = 0;
    let holdingShaker = false;
    let holdOriginX = 0;
    let holdOriginY = 0;

    const shaker = stage.querySelector("#craft-shaker");
    const shakerWrap = stage.querySelector(".craft-shaker-wrap");
    const ice = stage.querySelector("#craft-ice");
    const tip = stage.querySelector("#shaker-tip");
    const menuBtn = stage.querySelector("#craft-menu");
    const bellBtn = stage.querySelector("#craft-bell");
    const menuPanel = stage.querySelector("#menu-panel");
    const menuClose = stage.querySelector("#menu-close");
    const menuList = stage.querySelector("#menu-recipe-list");
    const bottles = stage.querySelectorAll(".craft-bottle");

    let bellAudio = null;
    let shakerAudio = null;
    try {
      bellAudio = new Audio("assets/ui/bell.mp3");
      bellAudio.preload = "auto";
    } catch (_) {}
    try {
      shakerAudio = new Audio("assets/ui/shaker.mp3");
      shakerAudio.preload = "auto";
    } catch (_) {}

    function playSfx(audio) {
      if (!audio) return;
      try {
        audio.currentTime = 0;
        const p = audio.play();
        if (p && typeof p.catch === "function") p.catch(function () {});
      } catch (_) {}
    }

    function resetMix() {
      const empty = window.CherryDrinks.emptyMix();
      Object.keys(empty).forEach((k) => {
        mix[k] = empty[k];
      });
      updateTip();
    }

    function updateTip() {
      if (!tip) return;
      if (drinkEl) {
        tip.innerHTML = drinkRecipe ? drinkRecipe.name : "";
        return;
      }
      const parts = [];
      window.CHERRY_BOTTLES.forEach((b) => {
        const n = mix[b.id] || 0;
        if (n > 0) {
          parts.push(
            '<span style="color:' + b.color + '">' + b.short + " ×" + n + "</span>"
          );
        }
      });
      if (mix.ice) parts.push('<span style="color:#a0d8f0">ICE</span>');
      tip.innerHTML = parts.length ? parts.join(" · ") : "<em>empty</em>";
    }

    function setHover(el, on) {
      if (!el) return;
      const base = el.getAttribute("data-src");
      const hover = el.getAttribute("data-hover");
      if (!base || !hover) return;
      el.src = on ? hover : base;
    }

    function resetShakerPos() {
      if (shaker) shaker.style.transform = "";
      if (shakerWrap) shakerWrap.style.transform = "";
    }

    function moveShakerHold(clientX, clientY) {
      if (!holdingShaker || !shaker) return;
      const dx = clientX - holdOriginX;
      const dy = clientY - holdOriginY;
      const cx = Math.max(-28, Math.min(28, dx));
      const cy = Math.max(-48, Math.min(48, dy));
      shaker.style.transform = "translate(" + cx + "px," + cy + "px)";
    }

    function buildMenu() {
      if (!menuList) return;
      menuList.innerHTML = "";
      (window.CHERRY_RECIPES || []).forEach((r) => {
        const card = document.createElement("article");
        card.className = "menu-recipe";
        let lines = "";
        const order = [
          ["ade", "ADE"],
          ["bron", "BRON"],
          ["flan", "FLAN"],
          ["powd", "POWD"],
          ["karmo", "KARMO"],
        ];
        order.forEach(([id, label]) => {
          const n = (r.mix && r.mix[id]) || 0;
          if (n > 0) {
            const col = window.CHERRY_INGREDIENT_COLORS[id];
            lines +=
              '<div class="menu-ing" style="color:' +
              col +
              '">' +
              label +
              " " +
              n +
              "</div>";
          }
        });
        if (r.ice) {
          lines +=
            '<div class="menu-ing" style="color:#a0d8f0">ICE</div>';
        }
        card.innerHTML =
          "<h3>" +
          r.name +
          "</h3>" +
          (r.tag ? '<p class="menu-tag">' + r.tag + "</p>" : "") +
          '<div class="menu-ings">' +
          lines +
          "</div>";
        menuList.appendChild(card);
      });
    }

    function toggleMenu(force) {
      if (!menuPanel) return;
      const open =
        force !== undefined ? force : !menuPanel.classList.contains("open");
      menuPanel.classList.toggle("open", open);
      menuPanel.setAttribute("aria-hidden", open ? "false" : "true");
    }

    function ringBell() {
      if (!bellBtn) return;
      playSfx(bellAudio);
      bellBtn.classList.remove("ring");
      void bellBtn.offsetWidth;
      bellBtn.classList.add("ring");
    }

    function clearDrink() {
      if (drinkEl && drinkEl.parentNode) drinkEl.parentNode.removeChild(drinkEl);
      drinkEl = null;
      drinkRecipe = null;
      if (shaker) {
        shaker.hidden = false;
        shaker.classList.remove("holding");
        setHover(shaker, false);
      }
      resetShakerPos();
      updateTip();
    }

    function serveDrink() {
      const recipe = drinkRecipe;
      clearDrink();
      if (recipe && opts.onServe) opts.onServe(recipe);
    }

    function spawnDrink(recipe) {
      clearDrink();
      if (!shakerWrap || !shaker) return;
      shaker.hidden = true;
      resetShakerPos();
      const img = document.createElement("img");
      img.src = recipe.src;
      img.alt = recipe.name;
      img.className = "craft-drink";
      img.draggable = false;
      img.title = "Drag up to serve";
      shakerWrap.appendChild(img);
      drinkEl = img;
      drinkRecipe = recipe;
      updateTip();
      if (tip) tip.classList.add("show");
      if (opts.onDrink) opts.onDrink(recipe);

      img.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        startDrinkDrag(img, e);
      });
    }

    function startDrinkDrag(img, e) {
      const ghost = document.createElement("img");
      ghost.className = "craft-ghost craft-ghost-drink";
      ghost.src = img.src;
      document.body.appendChild(ghost);
      dragging = {
        kind: "drink",
        ghost: ghost,
        srcEl: img,
        startX: e.clientX,
        startY: e.clientY,
      };
      img.classList.add("dragging");
      moveGhost(e.clientX, e.clientY);
      if (e.pointerId != null) img.setPointerCapture(e.pointerId);
    }

    function tryFinish() {
      resetShakerPos();
      setHover(shaker, false);
      shaker.classList.remove("holding");
      playSfx(shakerAudio);
      const recipe = window.CherryDrinks.match(mix);
      if (!recipe) {
        if (opts.onFail) opts.onFail(mix);
        resetMix();
        return;
      }
      spawnDrink(recipe);
      resetMix();
    }

    function onShakeMove(clientY) {
      if (!holdingShaker) return;
      shakeYs.push(clientY);
      if (shakeYs.length < 2) return;
      const prev = shakeYs[shakeYs.length - 2];
      const cur = shakeYs[shakeYs.length - 1];
      const dy = cur - prev;
      if (Math.abs(dy) < 8) return;
      const dir = dy < 0 ? -1 : 1;
      if (shakeDir && dir !== shakeDir) {
        shakeCount += 1;
        if (shakeCount >= 6) {
          shakeCount = 0;
          shakeDir = 0;
          shakeYs = [];
          holdingShaker = false;
          tryFinish();
          return;
        }
      }
      shakeDir = dir;
    }

    function startDrag(kind, srcEl, e) {
      if (drinkEl) return;
      e.preventDefault();
      const ghost = document.createElement("img");
      ghost.className = "craft-ghost";
      ghost.src = srcEl.src;
      document.body.appendChild(ghost);
      dragging = { kind: kind, ghost: ghost, srcEl: srcEl };
      setHover(srcEl, true);
      moveGhost(e.clientX, e.clientY);
      if (e.pointerId != null) srcEl.setPointerCapture(e.pointerId);
    }

    function moveGhost(x, y) {
      if (!dragging) return;
      dragging.ghost.style.left = x + "px";
      dragging.ghost.style.top = y + "px";
    }

    function endDrag(x, y) {
      if (!dragging) return;
      const kind = dragging.kind;
      const srcEl = dragging.srcEl;
      const ghost = dragging.ghost;
      const startY = dragging.startY;
      dragging = null;
      if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
      if (srcEl) {
        srcEl.classList.remove("dragging");
        setHover(srcEl, false);
      }

      if (kind === "drink") {
        // Drag upward to serve — clears drink, restores shaker
        if (startY != null && y < startY - 36) {
          serveDrink();
        }
        return;
      }

      if (drinkEl || !shaker || shaker.hidden) return;

      const rect = shaker.getBoundingClientRect();
      const hit =
        x >= rect.left - 8 &&
        x <= rect.right + 8 &&
        y >= rect.top - 8 &&
        y <= rect.bottom + 8;
      if (!hit) return;

      if (kind === "ice") {
        mix.ice = true;
      } else if (kind) {
        mix[kind] = (mix[kind] || 0) + 1;
      }
      updateTip();
      shaker.classList.add("pulse");
      setTimeout(() => shaker.classList.remove("pulse"), 200);
    }

    // Ice drag
    if (ice) {
      ice.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        startDrag("ice", ice, e);
      });
      ice.addEventListener("pointerenter", () => {
        if (!dragging) setHover(ice, true);
      });
      ice.addEventListener("pointerleave", () => {
        if (!dragging) setHover(ice, false);
      });
    }

    // Bottles
    bottles.forEach((btn) => {
      const id = btn.getAttribute("data-ing");
      btn.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        startDrag(id, btn.querySelector("img") || btn, e);
      });
    });

    // Shaker hover + hold + shake
    if (shaker) {
      shaker.addEventListener("pointerenter", () => {
        if (!holdingShaker && !dragging && !drinkEl) setHover(shaker, true);
        if (tip) tip.classList.add("show");
      });
      shaker.addEventListener("pointerleave", () => {
        if (!holdingShaker && !dragging) setHover(shaker, false);
        if (tip && !holdingShaker && !drinkEl) tip.classList.remove("show");
      });
      shaker.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        if (dragging || drinkEl || shaker.hidden) return;
        e.preventDefault();
        holdingShaker = true;
        holdOriginX = e.clientX;
        holdOriginY = e.clientY;
        shakeYs = [e.clientY];
        shakeDir = 0;
        shakeCount = 0;
        setHover(shaker, true);
        shaker.classList.add("holding");
        if (tip) tip.classList.add("show");
        shaker.setPointerCapture(e.pointerId);
        moveShakerHold(e.clientX, e.clientY);
      });
      shaker.addEventListener("pointermove", (e) => {
        if (holdingShaker) {
          moveShakerHold(e.clientX, e.clientY);
          onShakeMove(e.clientY);
        }
        if (dragging) moveGhost(e.clientX, e.clientY);
      });
      shaker.addEventListener("pointerup", () => {
        if (holdingShaker) {
          holdingShaker = false;
          shakeYs = [];
          shakeDir = 0;
          shakeCount = 0;
          setHover(shaker, false);
          shaker.classList.remove("holding");
          resetShakerPos();
          if (tip && !drinkEl) tip.classList.remove("show");
        }
      });
      shaker.addEventListener("pointercancel", () => {
        holdingShaker = false;
        resetShakerPos();
        shaker.classList.remove("holding");
        setHover(shaker, false);
      });
    }

    window.addEventListener("pointermove", (e) => {
      if (dragging) moveGhost(e.clientX, e.clientY);
      if (holdingShaker) {
        moveShakerHold(e.clientX, e.clientY);
        onShakeMove(e.clientY);
      }
    });
    window.addEventListener("pointerup", (e) => {
      if (dragging) endDrag(e.clientX, e.clientY);
      if (holdingShaker) {
        holdingShaker = false;
        shakeYs = [];
        shakeDir = 0;
        shakeCount = 0;
        setHover(shaker, false);
        shaker.classList.remove("holding");
        resetShakerPos();
        if (tip && !drinkEl) tip.classList.remove("show");
      }
    });

    if (menuBtn) {
      menuBtn.addEventListener("click", () => toggleMenu());
    }
    if (menuClose) {
      menuClose.addEventListener("click", () => toggleMenu(false));
    }
    if (bellBtn) {
      bellBtn.addEventListener("click", ringBell);
    }

    buildMenu();
    updateTip();
    resetMix();

    return {
      resetMix: resetMix,
      toggleMenu: toggleMenu,
      clearDrink: clearDrink,
      getMix: () => Object.assign({}, mix),
    };
  }

  global.CherryCraft = { createCraft: createCraft };
})(window);
