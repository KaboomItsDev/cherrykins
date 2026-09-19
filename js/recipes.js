/** Drink recipes shown in the tablet menu. */
window.CHERRY_RECIPES = [
  {
    id: "pink-signal",
    name: "Pink Signal",
    blurb: "Sweet neon buzz. Crowd favorite.",
    steps: ["Ice", "Cherry Syrup", "Spark"],
  },
  {
    id: "blue-static",
    name: "Blue Static",
    blurb: "Cold, sharp, keeps you awake.",
    steps: ["Ice", "Blue Bitters", "Foam"],
  },
  {
    id: "midnight-oil",
    name: "Midnight Oil",
    blurb: "Heavy. For long shifts.",
    steps: ["No Ice", "Dark Roast", "Cream"],
  },
  {
    id: "soft-reboot",
    name: "Soft Reboot",
    blurb: "Gentle reset. Non-alcoholic vibe.",
    steps: ["Ice", "Citrus", "Soda"],
  },
  {
    id: "glitch-kiss",
    name: "Glitch Kiss",
    blurb: "Unstable mix. Don't overshake.",
    steps: ["Ice", "Cherry Syrup", "Blue Bitters", "Spark"],
  },
];

window.CHERRY_INGREDIENTS = [
  { id: "syrup", label: "SYR", color: "#c48a20" },
  { id: "herb", label: "HRB", color: "#4a8a4a" },
  { id: "spark", label: "SPK", color: "#3a9aaa" },
  { id: "bitter", label: "BTR", color: "#2a4a7a" },
  { id: "stripe", label: "STR", color: "#a03030", stripe: true },
];

/** Shared expression list for every character. */
window.CHERRY_EXPRESSIONS = [
  { id: "neutral", label: "Neutral", src: "" },
  { id: "happy", label: "Happy", src: "" },
  { id: "sad", label: "Sad", src: "" },
  { id: "annoyed", label: "Annoyed", src: "" },
  { id: "surprised", label: "Surprised", src: "" },
  { id: "smirky", label: "Smirky", src: "" },
];

function cherryExprs() {
  return window.CHERRY_EXPRESSIONS.map(function (e) {
    return { id: e.id, label: e.label, src: e.src };
  });
}

/**
 * Characters. Put art in assets/characters/<id>/<expression>.png
 * and set src on CHERRY_EXPRESSIONS or per-character overrides later.
 */
window.CHERRY_CHARACTERS = [
  { id: "patron_a", name: "Patron A", color: "#a05070", expressions: cherryExprs() },
  { id: "patron_b", name: "Patron B", color: "#406890", expressions: cherryExprs() },
  { id: "patron_c", name: "Patron C", color: "#6850a0", expressions: cherryExprs() },
];
