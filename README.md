# Baha!

A flood survival game. A typhoon is coming and the water is rising: carry your
family, pets and important belongings up the stairs before the ground floor floods.

Made with plain HTML, CSS and JavaScript (no libraries, no build step), so it can be
hosted on GitHub Pages as a static site.

## Play

- **Online:** https://ethanbrlgdn.github.io/Baha/
- **On your computer:** double-click `index.html`.

## Houses

| House | Difficulty | What makes it different |
|---|---|---|
| Bahay Kubo | Easy | A nipa hut in a fenced yard. Carry everyone up the bamboo ladder, chickens too |
| Two-Storey House | Medium | Four rooms and a heavy ref: is it worth the trip? |
| Apartment | Hard | The building's stairs are out in the hallway, and there's less time |

Your best score and stars for each house are saved in your browser.

## Controls

| Action | Keyboard | Phone |
|---|---|---|
| Move | Arrow keys or WASD | Direction buttons |
| Grab / drop | Space, E or Enter | Grab button |
| Pause | P or Esc | Pause button |

Carry one thing at a time onto the stairs to save it. Heavy things (the ref, the TV,
the rice) slow you down, and Lola and Lolo walk slowly.

You have about 2 minutes (less in the Apartment), following PAGASA's rainfall warning colors:

- **Yellow:** flooding is possible. Move things upstairs while it's dry.
- **Orange:** the water comes in and rises, and you walk slower.
- **Red:** the water ruins everything left on the floor. Get your family and pets upstairs
  before time runs out!

The end screen shows what you saved and lost, your score (plus a time bonus if you
finish early), stars, and real flood-safety tips.

## Files

| File | What it does |
|---|---|
| `index.html` | The page: top bar, game canvas, title/pause/end screens, phone buttons |
| `css/style.css` | Colors, layout, rain background, buttons, house cards |
| `js/levels.js` | The three houses drawn as text (one character per tile), with items and timings |
| `js/lines.js` | What the player says in a speech bubble when he saves someone or something |
| `js/game.js` | Drawing, movement, items, water and timer, end screen, high scores, controls |
