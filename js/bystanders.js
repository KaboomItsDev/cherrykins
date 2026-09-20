/**
 * Background bystanders — walk behind balconyseats, 8-bit bob.
 */
(function (global) {
  const CAST = [
    { id: "bertobg", src: "assets/ui/bertobg.png" },
    { id: "billrobucks", src: "assets/ui/billrobucks.png" },
    { id: "chip", src: "assets/ui/chip.png" },
    { id: "devbg", src: "assets/ui/devbg.png" },
    { id: "domybg", src: "assets/ui/domybg.png" },
    { id: "stampni", src: "assets/ui/stampni.png", tiny: true },
    { id: "Rhylle", src: "assets/ui/Rhylle.png", ballerina: true },
  ];

  const WALK_MS = 9000;
  const RUN_MS = 4200;
  const GAP_MS = 2200;
  const BOB_STEP_MS = 140;
  const BOB_PX = 2;

  function createBystanders(host) {
    if (!host) return { start: function () {}, stop: function () {} };

    const layer = document.createElement("div");
    layer.className = "bystander-layer";
    layer.setAttribute("aria-hidden", "true");
    const balcony = host.querySelector(".layer-balconyseats");
    if (balcony) host.insertBefore(layer, balcony);
    else host.appendChild(layer);

    let stopped = true;
    let timer = null;
    let raf = null;
    let stampniPasses = 0;
    let active = null;

    function pick() {
      return CAST[Math.floor(Math.random() * CAST.length)];
    }

    function clearActive() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      if (active && active.el && active.el.parentNode) {
        active.el.parentNode.removeChild(active.el);
      }
      active = null;
    }

    function spawn() {
      if (stopped) return;
      clearActive();

      const who = pick();
      let duration = WALK_MS;
      let scale = 1;

      if (who.tiny) {
        stampniPasses += 1;
        scale = 0.72;
        // At least every 7th Stampni pass is a sprint; otherwise ~1/7 chance
        const run = stampniPasses % 7 === 0 || Math.random() < 1 / 7;
        if (run) duration = RUN_MS;
      }

      const img = document.createElement("img");
      img.className = "bystander" + (who.tiny ? " bystander-tiny" : "") + (who.ballerina ? " bystander-ballerina" : "");
      img.src = who.src;
      img.alt = "";
      img.draggable = false;
      layer.appendChild(img);

      const start = performance.now();
      const from = -108;
      const to = 108;
      active = { el: img, who: who, duration: duration, scale: scale };

      function frame(now) {
        if (stopped || !active || active.el !== img) return;
        const t = Math.min(1, (now - start) / duration);
        const x = from + (to - from) * t;
        const bobStep = Math.floor((now - start) / BOB_STEP_MS);
        const y = bobStep % 2 === 0 ? 0 : -BOB_PX;

        let sx = scale;
        if (who.ballerina) {
          // Smooth spin: flip through scaleX while she crosses
          const spins = 2.5;
          sx = scale * Math.cos(t * Math.PI * 2 * spins);
          // Keep a tiny minimum so she never fully vanishes mid-flip
          if (Math.abs(sx) < 0.08) sx = sx < 0 ? -0.08 : 0.08;
        }

        img.style.transform =
          "translate(" + x + "%, " + y + "px) scale(" + sx + ", " + scale + ")";

        if (t < 1) {
          raf = requestAnimationFrame(frame);
        } else {
          clearActive();
          timer = setTimeout(spawn, GAP_MS + Math.random() * 1800);
        }
      }

      img.style.transform = "translate(" + from + "%, 0) scale(" + scale + ")";
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (!stopped) return;
      stopped = false;
      timer = setTimeout(spawn, 600 + Math.random() * 800);
    }

    function stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
      timer = null;
      clearActive();
    }

    return { start: start, stop: stop, layer: layer };
  }

  global.CherryBystanders = { createBystanders: createBystanders, CAST: CAST };
})(window);
