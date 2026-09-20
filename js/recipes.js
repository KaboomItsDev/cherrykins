/** Cherry Kins — patrons, ingredients, recipes */

window.CHERRY_EXPR_IDS = [
  "neutral",
  "happy",
  "sad",
  "annoyed",
  "surprised",
  "smirky",
];

window.CHERRY_INGREDIENT_COLORS = {
  ade: "#e04040",
  bron: "#e8c840",
  flan: "#50b050",
  powd: "#90b8e0",
  karmo: "#40d0e0",
  ice: "#a0d8f0",
};

window.CHERRY_BOTTLES = [
  {
    id: "ade",
    name: "Adelhyde",
    short: "ADE",
    src: "assets/ingredients/Adelhyde.png",
    color: window.CHERRY_INGREDIENT_COLORS.ade,
  },
  {
    id: "bron",
    name: "Bronson Extract",
    short: "BRON",
    src: "assets/ingredients/Bronson_Extract.png",
    color: window.CHERRY_INGREDIENT_COLORS.bron,
  },
  {
    id: "flan",
    name: "Flanergide",
    short: "FLAN",
    src: "assets/ingredients/Flanergide.png",
    color: window.CHERRY_INGREDIENT_COLORS.flan,
  },
  {
    id: "powd",
    name: "Powdered Delta",
    short: "POWD",
    src: "assets/ingredients/Powdered_Delta.png",
    color: window.CHERRY_INGREDIENT_COLORS.powd,
  },
  {
    id: "karmo",
    name: "Karmotrine",
    short: "KARMO",
    src: "assets/ingredients/Karmotrine.png",
    color: window.CHERRY_INGREDIENT_COLORS.karmo,
  },
];

/** Drink recipes — blurb/flavor tags; steps for the menu. */
window.CHERRY_RECIPES = [
  {
    id: "rising-komet",
    name: "Rising Komet",
    tag: "sweet",
    src: "assets/ingredients/Komet.png",
    ice: false,
    mix: { ade: 3, bron: 2, powd: 2, flan: 0, karmo: 1 },
  },
  {
    id: "inktea",
    name: "Inktea",
    tag: "bitter · no alcohol",
    src: "assets/ingredients/inktea.png",
    ice: true,
    mix: { ade: 2, bron: 3, powd: 2, flan: 2, karmo: 0 },
  },
  {
    id: "riocherry",
    name: "Riocherry",
    tag: "strong",
    src: "assets/ingredients/riocherry.png",
    ice: false,
    mix: { ade: 5, bron: 4, powd: 0, flan: 0, karmo: 12 },
  },
  {
    id: "caipirinha",
    name: "Caipirinha",
    tag: "common drink",
    src: "assets/ingredients/caipirinha.png",
    ice: true,
    mix: { ade: 1, bron: 3, powd: 1, flan: 4, karmo: 5 },
  },
  {
    id: "flaming-moai",
    name: "Flaming Moai",
    tag: "",
    src: "assets/ingredients/flamingmoai.png",
    ice: false,
    mix: { ade: 1, bron: 1, powd: 2, flan: 3, karmo: 5 },
  },
  {
    id: "garibaldo",
    name: "Garibaldo",
    tag: "soft drink",
    src: "assets/ingredients/garibaldo.png",
    ice: false,
    mix: { ade: 6, bron: 0, powd: 3, flan: 0, karmo: 1 },
  },
];

function cherryExpr(srcMap) {
  return window.CHERRY_EXPR_IDS.map(function (id) {
    var src = "";
    if (srcMap && Object.prototype.hasOwnProperty.call(srcMap, id)) {
      src = srcMap[id] || "";
    }
    var label = id.charAt(0).toUpperCase() + id.slice(1);
    if (id === "smirky") label = "Smirky";
    if (id === "surprised") label = "Surprised";
    return { id: id, label: label, src: src };
  });
}

/**
 * fit: "counter" = Chip; "counter-up" = Chip scale, higher; "tall" = shrink to Chip footprint.
 * mug: optional assets/mugshots/<id>.png (add later)
 */
window.CHERRY_CHARACTERS = [
  {
    id: "antonico",
    name: "Antonico",
    color: "#6a4060",
    fit: "tall",
    mug: "assets/mugshots/antonico.png",
    expressions: cherryExpr({
      neutral: "assets/characters/antonico_neutral.png",
      happy: "assets/characters/antonico_happy.png",
      sad: "assets/characters/antonico_sad.png",
      annoyed: "assets/characters/antonico_angry.png",
      surprised: "assets/characters/antonico_surprised.png",
      smirky: "assets/characters/antonico_smirk.png",
    }),
  },
  {
    id: "chip",
    name: "Chip",
    color: "#c06070",
    fit: "counter",
    mug: "assets/mugshots/chip.png",
    expressions: cherryExpr({
      neutral: "assets/characters/chip_neutral.png",
      happy: "assets/characters/chip_happy.png",
      sad: "assets/characters/chip_sad.png",
      annoyed: "assets/characters/chip_annoyed.png",
      surprised: "assets/characters/chip_surprise.png",
      smirky: "assets/characters/chip_smirk.png",
    }),
  },
  {
    id: "dexter",
    name: "Dexter",
    color: "#406080",
    fit: "tall",
    mug: "assets/mugshots/dexter.png",
    expressions: cherryExpr({
      neutral: "assets/characters/Dexter_neutral.png",
      happy: "assets/characters/dexter_happy.png",
      sad: "assets/characters/dexter_sad.png",
      annoyed: "assets/characters/dexter_annoyed.png",
      surprised: "assets/characters/dexter_surprise.png",
      smirky: "assets/characters/dexter_smirk.png",
    }),
  },
  {
    id: "karly",
    name: "Karly",
    color: "#805060",
    fit: "tall",
    mug: "assets/mugshots/karly.png",
    expressions: cherryExpr({
      neutral: "assets/characters/Karly_neutral.png",
      happy: "assets/characters/Karly_happy.png",
      sad: "assets/characters/Karly_sad.png",
      annoyed: "assets/characters/karly_annoyed.png",
      surprised: "assets/characters/karly_surprised.png",
      smirky: "assets/characters/karly_smirk.png",
    }),
  },
  {
    id: "stampni",
    name: "Stampni",
    color: "#504070",
    fit: "counter-up",
    mug: "assets/mugshots/stampni.png",
    expressions: cherryExpr({
      neutral: "assets/characters/stampni_neutral.png",
      happy: "assets/characters/stampni_happy.png",
      sad: "assets/characters/stampni_sad.png",
      annoyed: "",
      surprised: "",
      smirky: "",
    }),
  },
  {
    id: "aurora",
    name: "Aurora",
    color: "#607090",
    fit: "tall",
    mug: "assets/mugshots/aurora.png",
    blankFace: true,
    expressions: cherryExpr({
      neutral: "assets/characters/aurora_neutral.png",
      happy: "assets/characters/aurora_neutral.png",
      sad: "assets/characters/aurora_neutral.png",
      annoyed: "assets/characters/aurora_neutral.png",
      surprised: "assets/characters/aurora_neutral.png",
      smirky: "assets/characters/aurora_neutral.png",
    }),
  },
  {
    id: "canetazu",
    name: "Canetazu",
    color: "#405040",
    fit: "tall",
    mug: "assets/mugshots/canetazu.png",
    noFace: true,
    expressions: cherryExpr({
      neutral: "assets/characters/canetazu.png",
      happy: "assets/characters/canetazu.png",
      sad: "assets/characters/canetazu.png",
      annoyed: "assets/characters/canetazu.png",
      surprised: "assets/characters/canetazu.png",
      smirky: "assets/characters/canetazu.png",
    }),
  },
];

window.CherryDrinks = {
  match: function (contents) {
    var recipes = window.CHERRY_RECIPES || [];
    for (var i = 0; i < recipes.length; i++) {
      var r = recipes[i];
      var ok = !!contents.ice === !!r.ice;
      if (!ok) continue;
      var keys = ["ade", "bron", "flan", "powd", "karmo"];
      for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        var need = (r.mix && r.mix[key]) || 0;
        var have = contents[key] || 0;
        if (need !== have) {
          ok = false;
          break;
        }
      }
      if (ok) return r;
    }
    return null;
  },
  emptyMix: function () {
    return { ade: 0, bron: 0, flan: 0, powd: 0, karmo: 0, ice: false };
  },
};
