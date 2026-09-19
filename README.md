# Cherry Kins

Simplified VA-11 Hall-A–inspired drink bar for your RPG table.

Static site — host on **GitHub Pages** (or any static host). No local server.

## Roles

- **Player** — game UI (stage, bar, prep station, recipes)
- **Admin** — live control panel (slide characters in/out, expressions, dialogue, hearts/tix)

Only two people connect. Admin hosts a room code; Player joins it. Both stay synced over the internet (PeerJS).

## Play

1. Open the GitHub Pages URL
2. Access codes: **falacias** (Player) / **hiperboles** (Admin)
3. Admin → share the **room code** with the Player
4. Player → enter that room code → Join
5. Admin taps **Slide in** / expressions while you talk on voice chat

## GitHub Pages

Repo Settings → Pages → Deploy from branch → `main` / `/ (root)`.

## Assets (later)

```
assets/
  characters/   # full-body + mug shots
  ui/           # logos, arrows, frames
  ingredients/  # can labels / ice art
```

Wire image paths in `js/recipes.js` under each expression's `src`, e.g.:

```js
{ id: "happy", label: "Happy", src: "assets/characters/patron_a/happy.png" }
```

## Admin shortcuts

- `1`–`5` — expression buttons (left to right)
- `I` — slide character in
- `O` — slide character out

## Recipes menu

Arrow above the tablet on the bar → recipe drawer slides up from the prep station.
