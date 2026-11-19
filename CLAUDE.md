# Baha! — project notes for Claude

School assignment: an original system/game, hosted as a static site on GitHub (GitHub Pages).
Deadline: **2026-11-22**. Teacher's rules: own idea/concept, not a "super simple" system
(e.g. not a calculator), and it must be hosted so the teacher can check it right away
(repo: github.com/ethanbrlgdn/Baha, pushed 2026-11-20; Pages link: ethanbrlgdn.github.io/Baha/). The owner wants small steps, a short report after each, and a check
on their phone before moving on. They approve with "go" / "commit and go".

## The game

Top-down flood survival. A typhoon is coming; carry family, pets and belongings up the
stairs before the ground floor floods. Original concept with a Filipino setting
(room names in Tagalog, PAGASA rainfall warning colors).

## Tech rules

- Plain HTML, CSS and JavaScript only: no libraries, no build step, no ES modules
  (the game must run by double-clicking `index.html`).
- Graphics are drawn on a canvas in code (no image files).
- Maps are text in `js/levels.js` (legend at the top of that file); game logic in `js/game.js`.
- Keep keyboard (arrows/WASD, P/Esc) and phone controls (on-screen buttons) working for every feature.
- Respect `prefers-reduced-motion`; touch targets at least 44px; good contrast.
- Checking without a browser: Node is at `C:/laragon/bin/nodejs/node-v22/node.exe`
  (`node --check js/game.js`, plus a fake-DOM smoke test that simulates key presses).

## Plan

1. ✅ House map, player movement, keyboard + touch controls, title and pause screens (done 2026-11-20)
2. ✅ Items: pick up (Space / Grab button), carry one at a time, bring to the stairs (`S` tiles).
   Heavy items slow you down. Family (Lola, Lolo, kids) must be saved; pets, documents,
   food/water/flashlight/radio, and appliances (TV, ref, fan) are worth points.
3. ✅ Rising water in PAGASA phases (Yellow → Orange → Red), timer, water slows walking,
   items left downstairs at Red are lost; end screen with what was saved/lost, score,
   stars, and real flood-safety tips. (2 and 3 done 2026-11-20)
4. Three houses (Bahay Kubo, Two-Storey House, Apartment), high scores in localStorage, polish.
5. Publish on GitHub Pages under the owner's account `ethanbrlgdn` (owner creates the repo
   on github.com; `gh` CLI is not installed). It's a solo project (confirmed 2026-11-20).
