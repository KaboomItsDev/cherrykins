/** Drink recipes shown in the tablet menu. Swap art later via assets/ingredients. */
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

/** Ingredient cans on the prep station (placeholders until assets arrive). */
window.CHERRY_INGREDIENTS = [
  { id: "syrup", label: "SYR", color: "#e8a020" },
  { id: "herb", label: "HRB", color: "#5cb85c" },
  { id: "spark", label: "SPK", color: "#3ecfcf" },
  { id: "bitter", label: "BTR", color: "#2a5a9e" },
  { id: "stripe", label: "STR", color: "#c0392b", stripe: true },
];

/**
 * Characters + expressions.
 * Put real images in assets/characters/ like:
 *   assets/characters/patron_a/neutral.png
 * Leave src empty to use color placeholders.
 */
window.CHERRY_CHARACTERS = [
  {
    id: "patron_a",
    name: "Patron A",
    color: "#c45c8a",
    expressions: [
      { id: "neutral", label: "Neutral", src: "" },
      { id: "happy", label: "Happy", src: "" },
      { id: "annoyed", label: "Annoyed", src: "" },
      { id: "surprised", label: "Surprised", src: "" },
      { id: "sad", label: "Sad", src: "" },
    ],
  },
  {
    id: "patron_b",
    name: "Patron B",
    color: "#4a8fc8",
    expressions: [
      { id: "neutral", label: "Neutral", src: "" },
      { id: "happy", label: "Happy", src: "" },
      { id: "annoyed", label: "Annoyed", src: "" },
      { id: "smirk", label: "Smirk", src: "" },
      { id: "tired", label: "Tired", src: "" },
    ],
  },
  {
    id: "patron_c",
    name: "Patron C",
    color: "#7d5bb8",
    expressions: [
      { id: "neutral", label: "Neutral", src: "" },
      { id: "happy", label: "Happy", src: "" },
      { id: "angry", label: "Angry", src: "" },
      { id: "laugh", label: "Laugh", src: "" },
      { id: "shy", label: "Shy", src: "" },
    ],
  },
];
