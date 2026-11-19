/* =====================================================================
   BAHA! game
   Step 1: draw the house from a level map, walk around it with the
   keyboard or the phone buttons, bump into walls and furniture.
   Step 2: pick up family, pets and belongings (one at a time) and
   carry them to the stairs. Heavy things slow you down.
   Step 3: a timer with PAGASA warnings (Yellow -> Orange -> Red),
   rising water that slows you, things ruined at Red, and an end
   screen with what was saved/lost, score, stars and safety tips.
   ===================================================================== */
(function () {
    'use strict';

    // ---- Settings ----
    var TILE = 32;              // one map character = 32x32 pixels
    var PLAYER_RADIUS = 10;
    var PLAYER_SPEED = 130;     // pixels per second
    var GRAB_RANGE = 30;        // how close (pixels) you must be to pick something up
    var WATER_SLOW = 0.35;      // at full depth, water takes away 35% of your speed
    var TIME_BONUS = 5;         // points per second left, if you finish early with all the family safe

    // PAGASA rainfall warning colors. text = a readable text color on that background.
    var PHASES = [
        { name: 'Yellow', color: '#f5d33d', text: '#1c1405',
          message: 'Yellow warning: flooding is possible. Move things upstairs!' },
        { name: 'Orange', color: '#f08a24', text: '#1c1405',
          message: 'Orange warning: the water is coming in!' },
        { name: 'Red', color: '#d93a2b', text: '#ffffff',
          message: 'Red warning: serious flooding! Get your family upstairs!' }
    ];

    // Real flood-safety advice (PAGASA, NDRRMC and DOH), shown on the end screen
    var TIPS = [
        'Know the PAGASA rainfall warnings. Yellow: flooding is possible, keep watching the news. ' +
            'Orange: flooding is threatening, get ready to leave. Red: serious flooding, evacuate.',
        'Prepare a go-bag before typhoon season: water, food, flashlight, radio, medicine, and copies ' +
            'of important documents in a waterproof bag.',
        'Move appliances and valuables to a higher place early, before the rain gets heavy.',
        'Turn off the main power switch before the water comes in, and never touch electrical things ' +
            'while you are wet or standing in water.',
        'Do not walk through moving floodwater: water only ankle- to knee-deep can knock you over. ' +
            'If your barangay tells you to evacuate, go right away.',
        'Floodwater can carry leptospirosis. Wear boots, and see a doctor if you waded in a flood, ' +
            'especially with a wound.'
    ];

    // ---- Things to save ----
    // group: family must all be saved; the rest are worth points.
    // speed: how fast you walk while carrying it (1 = normal, 0.45 = very slow).
    // alive: the water at Red doesn't ruin it (you can still save it). walks: it follows you
    // instead of being carried in your hands.
    var ITEM_TYPES = {
        lola:       { name: 'Lola',           group: 'family',    points: 100, speed: 0.6,  alive: true, walks: true },
        lolo:       { name: 'Lolo',           group: 'family',    points: 100, speed: 0.6,  alive: true, walks: true },
        bunso:      { name: 'Bunso',          group: 'family',    points: 100, speed: 0.9,  alive: true, walks: true },
        nene:       { name: 'Nene',           group: 'family',    points: 100, speed: 0.9,  alive: true, walks: true },
        dog:        { name: 'Bantay the dog', group: 'pet',       points: 50,  speed: 0.9,  alive: true, walks: true },
        cat:        { name: 'Muning the cat', group: 'pet',       points: 50,  speed: 1,    alive: true, walks: true },
        chicken:    { name: 'Manok',          group: 'pet',       points: 20,  speed: 1,    alive: true, walks: true },
        bird:       { name: 'Birdcage',       group: 'pet',       points: 40,  speed: 0.95, alive: true },
        documents:  { name: 'Documents',      group: 'important', points: 40,  speed: 1 },
        laptop:     { name: 'School laptop',  group: 'important', points: 40,  speed: 1 },
        rice:       { name: 'Sack of rice',   group: 'supplies',  points: 30,  speed: 0.7 },
        water:      { name: 'Drinking water', group: 'supplies',  points: 30,  speed: 0.8 },
        flashlight: { name: 'Flashlight',     group: 'supplies',  points: 20,  speed: 1 },
        radio:      { name: 'Radio',          group: 'supplies',  points: 20,  speed: 1 },
        tv:         { name: 'TV',             group: 'appliance', points: 30,  speed: 0.65 },
        ref:        { name: 'Ref',            group: 'appliance', points: 40,  speed: 0.45 },
        fan:        { name: 'Electric fan',   group: 'appliance', points: 15,  speed: 0.85 }
    };

    // Family and pets walk with you (drawn behind you); objects are held in front
    function isAlive(def) {
        return def.alive === true;
    }

    function weightWord(def) {
        if (def.walks) {
            return def.speed <= 0.7 ? 'walks slowly' : 'keeps up with you';
        }
        if (def.speed <= 0.5) { return 'very heavy'; }
        if (def.speed <= 0.7) { return 'heavy'; }
        if (def.speed < 1) { return 'a bit heavy'; }
        return 'light';
    }

    // Map characters you can't walk through
    var SOLID = { '#': true, 'w': true, 'F': true, 'b': true, 'k': true, 't': true, 's': true,
                  'f': true, 'R': true, 'T': true };
    // Furniture: drawn as one object per connected group of the same character
    var FURNITURE = { 'b': true, 'k': true, 't': true, 's': true, 'S': true, 'F': true, 'R': true, 'T': true };
    // Floors you walk on (other tiles get the floor of their neighbors drawn underneath)
    var FLOORS = { '.': true, ',': true, 'g': true, 'c': true };
    // The flood covers every tile except these (walls, the stairs, and things standing above the water)
    var DRY = { '#': true, 'w': true, 'F': true, 'S': true, 'f': true, 'R': true, 'T': true };

    // ---- Colors ----
    var C = {
        wall: '#3b2c20',
        wallTop: '#5a4330',
        wood: '#c99a5b',
        woodLine: '#b48549',
        tileA: '#dfe7ea',
        tileB: '#c8d3d8',
        windowPane: '#8fc3e6',
        label: 'rgba(60, 40, 22, 0.55)',
        shadow: 'rgba(0, 0, 0, 0.25)',
        shirt: '#e8841a',
        skin: '#8d5a3b',
        hair: '#22160e'
    };

    // ---- Page elements ----
    var canvas = document.getElementById('game');
    var ctx = canvas.getContext('2d');
    var titleScreen = document.getElementById('title-screen');
    var pauseScreen = document.getElementById('pause-screen');
    var pauseBtn = document.getElementById('pause-btn');
    var hudLevel = document.getElementById('hud-level');
    var hudHint = document.getElementById('hud-hint');
    var hudFamily = document.getElementById('hud-family');
    var hudScore = document.getElementById('hud-score');
    var announcer = document.getElementById('announcer');
    var grabBtn = document.getElementById('grab-btn');
    var grabMain = document.getElementById('grab-main');
    var grabSub = document.getElementById('grab-sub');
    var hudWarning = document.getElementById('hud-warning');
    var warnBadge = document.getElementById('warn-badge');
    var hudTimer = document.getElementById('hud-timer');
    var endScreen = document.getElementById('end-screen');
    var houseList = document.getElementById('house-list');
    var nextBtn = document.getElementById('next-btn');

    var reducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    var touchScreen = window.matchMedia ? window.matchMedia('(pointer: coarse)') : { matches: false };

    // ---- Game state ----
    var level = null;
    var cols = 0;
    var rows = 0;
    var floorLayer = null;       // the house is drawn once into here, then copied each frame
    var mode = 'title';          // 'title' | 'playing' | 'paused'
    var lastTime = 0;

    var player = { x: 0, y: 0, faceX: 0, faceY: 1, walkTime: 0 };

    var items = [];              // { type, def, x, y, state: 'home' | 'carried' | 'saved' }
    var carrying = null;         // the item in your hands, or null
    var nearby = null;           // the item you'd pick up if you pressed Grab now
    var score = 0;
    var toasts = [];             // floating "+50" messages: { text, x, y, age }
    var clock = 0;               // seconds of play, for the pulsing highlight
    var stairsCenter = { x: 0, y: 0 };

    var elapsed = 0;             // seconds since the game started (stops while paused)
    var phaseEnds = [];          // when Yellow, Orange and Red end, in seconds
    var phase = 0;               // 0 = Yellow, 1 = Orange, 2 = Red
    var water = 0;               // water depth, 0 (dry) to 1 (knee-deep)
    var waterTiles = [];         // floor tiles the water covers (everything but walls and stairs)
    var banner = null;           // big message at the top: { text, color, textColor, age }
    var finishIn = -1;           // counts down to the end screen once everything is safe

    // Which directions are held down (keyboard and touch buttons both set these)
    var held = { up: false, down: false, left: false, right: false };

    /* -----------------------------------------------------------------
       MAP HELPERS
       ----------------------------------------------------------------- */
    function tileAt(col, row) {
        if (row < 0 || row >= rows || col < 0 || col >= cols) {
            return '#';   // outside the map counts as wall
        }
        return level.map[row].charAt(col);
    }

    function isSolidAt(px, py) {
        return SOLID[tileAt(Math.floor(px / TILE), Math.floor(py / TILE))] === true;
    }

    // Does a circle-ish player at (x, y) touch anything solid?
    // We test the 4 corners of the square around it (a little smaller, so doorways feel roomy).
    function collides(x, y) {
        var r = PLAYER_RADIUS - 1;
        return isSolidAt(x - r, y - r) || isSolidAt(x + r, y - r) ||
               isSolidAt(x - r, y + r) || isSolidAt(x + r, y + r);
    }

    /* -----------------------------------------------------------------
       LOADING A LEVEL
       ----------------------------------------------------------------- */
    function loadLevel(data) {
        level = data;
        rows = level.map.length;
        cols = level.map[0].length;

        player.x = level.spawn.col * TILE;
        player.y = level.spawn.row * TILE;
        player.faceX = 0;
        player.faceY = 1;

        items = (level.items || []).map(function (it) {
            return { type: it.type, def: ITEM_TYPES[it.type], x: it.col * TILE, y: it.row * TILE, state: 'home' };
        });
        carrying = null;
        nearby = null;
        score = 0;
        toasts = [];
        clock = 0;

        // the middle of all the stair tiles, where "+points" messages appear
        var sx = 0, sy = 0, n = 0;
        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                if (tileAt(c, r) === 'S') { sx += c + 0.5; sy += r + 0.5; n++; }
            }
        }
        stairsCenter = { x: (n ? sx / n : cols / 2) * TILE, y: (n ? sy / n : rows / 2) * TILE };

        waterTiles = [];
        for (r = 0; r < rows; r++) {
            for (c = 0; c < cols; c++) {
                if (!DRY[tileAt(c, r)]) {
                    waterTiles.push([c, r]);
                }
            }
        }

        var t = level.time || { yellow: 40, orange: 40, red: 40 };
        phaseEnds = [t.yellow, t.yellow + t.orange, t.yellow + t.orange + t.red];
        elapsed = 0;
        phase = 0;
        water = 0;
        banner = null;
        finishIn = -1;
        updateClock();

        hudLevel.textContent = level.name;
        updateHud();

        sizeCanvas();
        drawFloorLayer();
        render();
    }

    // Sharp drawing on high-resolution phone screens: draw at devicePixelRatio size
    function sizeCanvas() {
        var dpr = window.devicePixelRatio || 1;
        canvas.width = cols * TILE * dpr;
        canvas.height = rows * TILE * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    /* -----------------------------------------------------------------
       DRAWING THE HOUSE (done once per level, into floorLayer)
       ----------------------------------------------------------------- */
    function drawFloorLayer() {
        var dpr = window.devicePixelRatio || 1;
        floorLayer = document.createElement('canvas');
        floorLayer.width = cols * TILE * dpr;
        floorLayer.height = rows * TILE * dpr;
        var g = floorLayer.getContext('2d');
        g.setTransform(dpr, 0, 0, dpr, 0, 0);

        var row, col, ch;

        // 1. Floors (also under furniture, stairs, doors and fences)
        for (row = 0; row < rows; row++) {
            for (col = 0; col < cols; col++) {
                ch = tileAt(col, row);
                if (ch === '#' || ch === 'w') {
                    continue;
                }
                var floor = FLOORS[ch] ? ch : floorUnder(col, row);
                if (floor === ',') {
                    drawTileFloor(g, col, row);
                } else if (floor === 'g') {
                    drawGrass(g, col, row);
                } else if (floor === 'c') {
                    drawConcrete(g, col, row);
                } else {
                    drawWoodFloor(g, col, row);
                }
            }
        }

        // 2. Walls, windows and fences
        for (row = 0; row < rows; row++) {
            for (col = 0; col < cols; col++) {
                ch = tileAt(col, row);
                if (ch === '#' || ch === 'w') {
                    drawWall(g, col, row, ch === 'w');
                } else if (ch === 'f') {
                    drawFence(g, col, row);
                }
            }
        }

        // 3. Furniture, stairs and the front door, one shape per group
        findGroups().forEach(function (group) {
            drawFurniture(g, group);
        });

        // 4. Room names
        g.font = '700 11px Nunito, system-ui, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillStyle = C.label;
        (level.labels || []).forEach(function (label) {
            g.fillText(label.text.toUpperCase(), label.col * TILE, label.row * TILE);
        });
    }

    function drawWoodFloor(g, col, row) {
        var x = col * TILE;
        var y = row * TILE;
        g.fillStyle = C.wood;
        g.fillRect(x, y, TILE, TILE);
        // planks: lines every 8px, with joints at staggered places
        g.fillStyle = C.woodLine;
        for (var i = 0; i < 4; i++) {
            g.fillRect(x, y + i * 8 + 7, TILE, 1);
            var joint = ((col * 3 + row * 5 + i * 7) % 4) * 8;
            g.fillRect(x + joint, y + i * 8, 1, 8);
        }
    }

    // Which floor goes under a bed, door, ladder, etc.? The most common floor around it.
    function floorUnder(col, row) {
        var count = {};
        var best = '.';
        var bestN = 0;
        for (var dr = -1; dr <= 1; dr++) {
            for (var dc = -1; dc <= 1; dc++) {
                var ch = tileAt(col + dc, row + dr);
                if (FLOORS[ch]) {
                    count[ch] = (count[ch] || 0) + 1;
                    if (count[ch] > bestN) {
                        bestN = count[ch];
                        best = ch;
                    }
                }
            }
        }
        return best;
    }

    function drawGrass(g, col, row) {
        var x = col * TILE;
        var y = row * TILE;
        g.fillStyle = '#6da64e';
        g.fillRect(x, y, TILE, TILE);
        // little tufts, in a pattern that looks random but is the same every time
        g.fillStyle = '#5a9140';
        for (var i = 0; i < 4; i++) {
            var tx = x + ((col * 13 + row * 7 + i * 11) % 26) + 3;
            var ty = y + ((col * 5 + row * 17 + i * 9) % 24) + 4;
            g.fillRect(tx, ty, 2, 4);
            g.fillRect(tx + 3, ty + 1, 2, 3);
        }
    }

    function drawConcrete(g, col, row) {
        var x = col * TILE;
        var y = row * TILE;
        g.fillStyle = '#b8b4ab';
        g.fillRect(x, y, TILE, TILE);
        g.fillStyle = '#a5a198';
        g.fillRect(x, y + TILE - 1, TILE, 1);
        g.fillRect(x + TILE - 1, y, 1, TILE);
        g.fillRect(x + ((col * 11 + row * 3) % 24) + 4, y + ((col * 7 + row * 13) % 22) + 5, 2, 2);
    }

    // Bamboo fence: a rail along the fence line with posts
    function drawFence(g, col, row) {
        var x = col * TILE;
        var y = row * TILE;
        var across = tileAt(col - 1, row) === 'f' || tileAt(col + 1, row) === 'f';
        var down = tileAt(col, row - 1) === 'f' || tileAt(col, row + 1) === 'f';
        g.fillStyle = '#b08a46';
        if (across) { g.fillRect(x, y + TILE / 2 - 3, TILE, 6); }
        if (down) { g.fillRect(x + TILE / 2 - 3, y, 6, TILE); }
        g.fillStyle = '#8a6a32';
        g.beginPath();
        g.arc(x + TILE / 2, y + TILE / 2, 5, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#d2b06a';
        g.beginPath();
        g.arc(x + TILE / 2 - 1, y + TILE / 2 - 1, 2.5, 0, Math.PI * 2);
        g.fill();
    }

    function drawTileFloor(g, col, row) {
        g.fillStyle = (col + row) % 2 === 0 ? C.tileA : C.tileB;
        g.fillRect(col * TILE, row * TILE, TILE, TILE);
    }

    function drawWall(g, col, row, isWindow) {
        var x = col * TILE;
        var y = row * TILE;
        var walls = level.walls || { color: C.wall, top: C.wallTop };
        g.fillStyle = walls.color;
        g.fillRect(x, y, TILE, TILE);
        // a lighter top edge gives the walls a little depth
        g.fillStyle = walls.top;
        g.fillRect(x, y, TILE, 6);
        if (isWindow) {
            g.fillStyle = C.windowPane;
            g.fillRect(x + 5, y + 10, TILE - 10, TILE - 18);
            g.fillStyle = walls.color;
            g.fillRect(x + TILE / 2 - 1, y + 10, 2, TILE - 18);
        }
    }

    // Find connected groups of the same furniture character (e.g. a 2x2 bed)
    function findGroups() {
        var seen = {};
        var groups = [];

        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                var ch = tileAt(col, row);
                var key = col + ',' + row;
                if (!FURNITURE[ch] || seen[key]) {
                    continue;
                }

                // flood fill from this tile
                var group = { ch: ch, minC: col, maxC: col, minR: row, maxR: row };
                var stack = [[col, row]];
                seen[key] = true;

                while (stack.length) {
                    var cur = stack.pop();
                    group.minC = Math.min(group.minC, cur[0]);
                    group.maxC = Math.max(group.maxC, cur[0]);
                    group.minR = Math.min(group.minR, cur[1]);
                    group.maxR = Math.max(group.maxR, cur[1]);

                    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
                        var nc = cur[0] + d[0];
                        var nr = cur[1] + d[1];
                        var nk = nc + ',' + nr;
                        if (!seen[nk] && tileAt(nc, nr) === ch) {
                            seen[nk] = true;
                            stack.push([nc, nr]);
                        }
                    });
                }

                groups.push(group);
            }
        }
        return groups;
    }

    function roundRect(g, x, y, w, h, r) {
        g.beginPath();
        g.moveTo(x + r, y);
        g.arcTo(x + w, y, x + w, y + h, r);
        g.arcTo(x + w, y + h, x, y + h, r);
        g.arcTo(x, y + h, x, y, r);
        g.arcTo(x, y, x + w, y, r);
        g.closePath();
    }

    function drawFurniture(g, group) {
        var x = group.minC * TILE;
        var y = group.minR * TILE;
        var w = (group.maxC - group.minC + 1) * TILE;
        var h = (group.maxR - group.minR + 1) * TILE;
        var pad = 4;

        // soft shadow under everything except the door, stairs and trees (they draw their own)
        if (group.ch !== 'F' && group.ch !== 'S' && group.ch !== 'T') {
            g.fillStyle = C.shadow;
            roundRect(g, x + pad + 2, y + pad + 3, w - pad * 2, h - pad * 2, 6);
            g.fill();
        }

        switch (group.ch) {
            case 'b': // bed: frame, blanket, pillow
                g.fillStyle = '#6b4a2f';
                roundRect(g, x + pad, y + pad, w - pad * 2, h - pad * 2, 6);
                g.fill();
                g.fillStyle = '#4f86b8';
                roundRect(g, x + pad + 3, y + pad + 16, w - pad * 2 - 6, h - pad * 2 - 19, 4);
                g.fill();
                g.fillStyle = '#f4efe6';
                roundRect(g, x + pad + 6, y + pad + 4, w - pad * 2 - 12, 10, 4);
                g.fill();
                break;

            case 'k': // kitchen counter with a stove
                g.fillStyle = '#9aa5ab';
                roundRect(g, x + pad, y + pad, w - pad * 2, h - pad * 2, 4);
                g.fill();
                g.strokeStyle = '#3d4447';
                g.lineWidth = 2;
                g.beginPath();
                g.arc(x + w * 0.3, y + h / 2, 6, 0, Math.PI * 2);
                g.arc(x + w * 0.7, y + h / 2, 6, 0, Math.PI * 2);
                g.stroke();
                break;

            case 't': // dining table with plates
                g.fillStyle = '#7a5232';
                roundRect(g, x + pad, y + pad, w - pad * 2, h - pad * 2, 8);
                g.fill();
                g.fillStyle = '#efe8dc';
                [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]].forEach(function (p) {
                    g.beginPath();
                    g.arc(x + w * p[0], y + h * p[1], 5, 0, Math.PI * 2);
                    g.fill();
                });
                break;

            case 's': // sofa: seat with a backrest
                g.fillStyle = '#8c3b3b';
                roundRect(g, x + pad, y + pad, w - pad * 2, h - pad * 2, 8);
                g.fill();
                g.fillStyle = '#a84c4c';
                roundRect(g, x + pad + 4, y + pad + 9, w - pad * 2 - 8, h - pad * 2 - 12, 5);
                g.fill();
                break;

            case 'S': // stairs: steps going up, with a label (outdoors: a bamboo ladder)
                if (floorUnder(group.minC, group.minR) === 'g') {
                    g.fillStyle = 'rgba(47, 109, 58, 0.25)';
                    g.fillRect(x + 2, y + 2, w - 4, h - 4);
                    g.fillStyle = '#b08a46';
                    g.fillRect(x + 8, y, 5, h);
                    g.fillRect(x + w - 13, y, 5, h);
                    for (var rung = 0; rung < 4; rung++) {
                        g.fillRect(x + 8, y + 4 + rung * (h - 8) / 3, w - 16, 3);
                    }
                    g.strokeStyle = '#2f6d3a';
                    g.lineWidth = 3;
                    g.strokeRect(x + 3, y + 3, w - 6, h - 6);
                    g.fillStyle = '#ffffff';
                    g.font = '800 12px "Baloo 2", system-ui, sans-serif';
                    g.textAlign = 'center';
                    g.textBaseline = 'middle';
                    g.lineWidth = 3;
                    g.strokeStyle = '#2f6d3a';
                    g.strokeText('UP', x + w / 2, y + h / 2);
                    g.fillText('UP', x + w / 2, y + h / 2);
                    break;
                }
                g.fillStyle = '#e1c48f';
                g.fillRect(x + 2, y + 2, w - 4, h - 4);
                g.fillStyle = '#b48a4f';
                for (var s = 0; s < 6; s++) {
                    g.fillRect(x + 2, y + 2 + s * ((h - 4) / 6), w - 4, 2);
                }
                g.strokeStyle = '#2f6d3a';
                g.lineWidth = 3;
                g.strokeRect(x + 3, y + 3, w - 6, h - 6);
                g.fillStyle = '#2f6d3a';
                g.font = '800 12px "Baloo 2", system-ui, sans-serif';
                g.textAlign = 'center';
                g.textBaseline = 'middle';
                g.fillText('UP', x + w / 2, y + h / 2);
                break;

            case 'R': // nipa roof of the bahay kubo: thatch rows and a ridge down the middle
                g.fillStyle = '#c69c52';
                roundRect(g, x + 2, y + 2, w - 4, h - 4, 6);
                g.fill();
                g.strokeStyle = '#a57c38';
                g.lineWidth = 1.5;
                for (var ty = y + 9; ty < y + h - 4; ty += 7) {
                    for (var tx = x + 6 + ((ty / 7) % 2) * 5; tx < x + w - 8; tx += 10) {
                        g.beginPath();
                        g.moveTo(tx, ty);
                        g.lineTo(tx + 4, ty + 4);
                        g.stroke();
                    }
                }
                g.fillStyle = '#7d5a26';
                g.fillRect(x + w / 2 - 3, y + 2, 6, h - 4);
                g.strokeStyle = '#7d5a26';
                g.lineWidth = 2;
                roundRect(g, x + 2, y + 2, w - 4, h - 4, 6);
                g.stroke();
                break;

            case 'T': // a mango tree seen from above
                g.fillStyle = C.shadow;
                g.beginPath();
                g.ellipse(x + w / 2 + 3, y + h / 2 + 5, w / 2, h / 2 - 3, 0, 0, Math.PI * 2);
                g.fill();
                g.fillStyle = '#2f7a34';
                [[0.5, 0.42, 0.42], [0.3, 0.6, 0.3], [0.7, 0.62, 0.3]].forEach(function (b) {
                    g.beginPath();
                    g.arc(x + w * b[0], y + h * b[1], w * b[2], 0, Math.PI * 2);
                    g.fill();
                });
                g.fillStyle = '#4a9a43';
                g.beginPath();
                g.arc(x + w * 0.42, y + h * 0.36, w * 0.18, 0, Math.PI * 2);
                g.fill();
                break;

            case 'F': // front door (closed)
                g.fillStyle = C.wall;
                g.fillRect(x, y, w, h);
                g.fillStyle = '#7b4f2c';
                g.fillRect(x + 4, y + 2, w - 8, h - 6);
                g.fillStyle = '#e5b85c';
                g.beginPath();
                g.arc(x + w / 2 + 8, y + h / 2, 2.5, 0, Math.PI * 2);
                g.fill();
                break;
        }
    }

    /* -----------------------------------------------------------------
       DRAWING EACH FRAME
       ----------------------------------------------------------------- */
    function render() {
        ctx.clearRect(0, 0, cols * TILE, rows * TILE);
        if (floorLayer) {
            ctx.drawImage(floorLayer, 0, 0, cols * TILE, rows * TILE);
        }

        // things still waiting downstairs (lower ones drawn last, so they overlap nicely)
        items.filter(function (it) { return it.state === 'home'; })
            .sort(function (a, b) { return a.y - b.y; })
            .forEach(function (it) { drawItem(ctx, it.type, it.x, it.y, 0, 1, 1); });

        drawWater();

        if (nearby && mode === 'playing') {
            drawHighlight(nearby);
        }

        // the player, with whatever they're carrying
        var bob = player.walkTime > 0 && !reducedMotion.matches ? Math.sin(player.walkTime * 14) * 1.2 : 0;
        var fx = player.faceX;
        var fy = player.faceY;
        if (carrying && carrying.def.walks) {
            // family and pets walk right behind you, holding your hand
            drawItem(ctx, carrying.type, player.x - fx * 15, player.y - fy * 15, fx, fy, 1);
        }
        drawPerson(ctx, player.x, player.y, { shirt: C.shirt, hair: C.hair, faceX: fx, faceY: fy, bob: bob });
        if (carrying && !carrying.def.walks) {
            // objects are carried in front of you
            drawItem(ctx, carrying.type, player.x + fx * 11, player.y + fy * 11 + bob, fx, fy, 0.8);
        }

        drawToasts();
        drawBanner();
    }

    // Brown-blue floodwater over the ground floor (the stairs stay dry), with gentle ripples
    function drawWater() {
        if (water <= 0) {
            return;
        }
        ctx.fillStyle = 'rgba(70, 110, 130, ' + (0.2 + water * 0.45).toFixed(3) + ')';
        waterTiles.forEach(function (t) {
            ctx.fillRect(t[0] * TILE, t[1] * TILE, TILE, TILE);
        });

        ctx.fillStyle = 'rgba(220, 240, 250, ' + (0.15 + water * 0.2).toFixed(3) + ')';
        waterTiles.forEach(function (t) {
            if ((t[0] * 7 + t[1] * 3) % 4 !== 0) { return; }   // ripples on some tiles only
            var drift = reducedMotion.matches ? 0 : Math.sin(clock * 1.6 + t[0] * 0.9 + t[1] * 1.7) * 4;
            ctx.fillRect(t[0] * TILE + 8 + drift, t[1] * TILE + 14, 12, 2);
        });
    }

    // The big warning message across the top when the PAGASA color changes
    function drawBanner() {
        if (!banner) {
            return;
        }
        var w = cols * TILE;
        ctx.globalAlpha = Math.max(0, Math.min(1, (3.2 - banner.age) / 0.5));
        ctx.fillStyle = banner.color;
        ctx.fillRect(0, 10, w, 40);
        ctx.fillStyle = banner.textColor;
        ctx.font = '800 20px "Baloo 2", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(banner.text, w / 2, 31, w - 24);
        ctx.globalAlpha = 1;
    }

    // A person seen from above: shoulders, then head with hair at the back
    function drawPerson(g, x, y, o) {
        var s = o.size || 1;
        var r = PLAYER_RADIUS * s;
        var fx = o.faceX;
        var fy = o.faceY;
        var bob = o.bob || 0;

        g.fillStyle = C.shadow;
        g.beginPath();
        g.ellipse(x + 1, y + 5 * s, r, r * 0.6, 0, 0, Math.PI * 2);
        g.fill();

        g.fillStyle = o.shirt;
        g.beginPath();
        g.ellipse(x, y + bob, r, r * 0.8, Math.atan2(fy, fx) + Math.PI / 2, 0, Math.PI * 2);
        g.fill();

        var hx = x + fx * 2 * s;
        var hy = y + fy * 2 * s + bob;
        g.fillStyle = C.skin;
        g.beginPath();
        g.arc(hx, hy, 6.5 * s, 0, Math.PI * 2);
        g.fill();

        g.fillStyle = o.hair;
        g.beginPath();
        g.arc(hx - fx * 1.5 * s, hy - fy * 1.5 * s, 6 * s, 0, Math.PI * 2);
        g.fill();
        if (o.bun) {
            g.beginPath();
            g.arc(hx - fx * 6 * s, hy - fy * 6 * s, 3 * s, 0, Math.PI * 2);
            g.fill();
        }
        g.fillStyle = C.skin;
        g.beginPath();
        g.arc(hx + fx * 2.5 * s, hy + fy * 2.5 * s, 4 * s, 0, Math.PI * 2);
        g.fill();
    }

    function shadowUnder(g, w, h) {
        g.fillStyle = C.shadow;
        g.beginPath();
        g.ellipse(1, h / 2, w / 2, 3.5, 0, 0, Math.PI * 2);
        g.fill();
    }

    // Draws one item centered at (x, y). faceX/faceY: which way people and pets look
    // (0, 0 = their resting pose, facing down). scale: smaller when carried.
    function drawItem(g, type, x, y, faceX, faceY, scale) {
        if (faceX === 0 && faceY === 0) { faceY = 1; }

        switch (type) {
            case 'lola':
                drawPerson(g, x, y, { shirt: '#b65d8f', hair: '#dcd7cf', faceX: faceX, faceY: faceY, size: 0.95 * scale, bun: true });
                return;
            case 'lolo':
                drawPerson(g, x, y, { shirt: '#4f78a3', hair: '#c9c4bb', faceX: faceX, faceY: faceY, size: 1 * scale });
                return;
            case 'bunso':
                drawPerson(g, x, y, { shirt: '#3f9e5e', hair: C.hair, faceX: faceX, faceY: faceY, size: 0.7 * scale });
                return;
            case 'nene':
                drawPerson(g, x, y, { shirt: '#e05a6d', hair: C.hair, faceX: faceX, faceY: faceY, size: 0.75 * scale, bun: true });
                return;
        }

        g.save();
        g.translate(x, y);
        g.scale(scale, scale);

        switch (type) {
            case 'dog':
            case 'cat':
                drawPet(g, type, faceX, faceY);
                break;

            case 'chicken': // manok: white body, red comb, yellow beak
                g.rotate(Math.atan2(faceY, faceX));
                g.fillStyle = C.shadow;
                g.beginPath();
                g.ellipse(1, 3, 8, 5, 0, 0, Math.PI * 2);
                g.fill();
                g.fillStyle = '#7a4a2a';
                g.beginPath();
                g.moveTo(-5, 0); g.lineTo(-11, -4); g.lineTo(-10, 4);
                g.fill();
                g.fillStyle = '#f3ede2';
                g.beginPath();
                g.ellipse(-1, 0, 7, 5.5, 0, 0, Math.PI * 2);
                g.fill();
                g.beginPath();
                g.arc(6, 0, 3.6, 0, Math.PI * 2);
                g.fill();
                g.fillStyle = '#d9342b';
                g.fillRect(4, -1.2, 4, 2.4);
                g.fillStyle = '#f2b23a';
                g.beginPath();
                g.moveTo(9, -1.5); g.lineTo(12, 0); g.lineTo(9, 1.5);
                g.fill();
                break;

            case 'bird': // a birdcage with a little yellow bird inside
                shadowUnder(g, 20, 20);
                g.fillStyle = '#e9d9a8';
                g.beginPath();
                g.arc(0, 0, 10, 0, Math.PI * 2);
                g.fill();
                g.fillStyle = '#f5d33d';
                g.beginPath();
                g.ellipse(0, 1, 4, 3, 0, 0, Math.PI * 2);
                g.fill();
                g.beginPath();
                g.arc(3, -1, 2.2, 0, Math.PI * 2);
                g.fill();
                g.strokeStyle = '#6b5a3a';
                g.lineWidth = 1.2;
                for (var bar = -6; bar <= 6; bar += 4) {
                    g.beginPath();
                    g.moveTo(bar, -9);
                    g.lineTo(bar, 9);
                    g.stroke();
                }
                g.lineWidth = 2;
                g.beginPath();
                g.arc(0, 0, 10, 0, Math.PI * 2);
                g.stroke();
                break;

            case 'laptop': // a school laptop, open
                shadowUnder(g, 22, 16);
                g.fillStyle = '#4b535b';
                roundRect(g, -11, -8, 22, 8, 2);
                g.fill();
                g.fillStyle = '#7fb1d6';
                g.fillRect(-9, -7, 18, 6);
                g.fillStyle = '#9aa3ab';
                roundRect(g, -11, 0, 22, 9, 2);
                g.fill();
                g.fillStyle = '#6c757d';
                for (var kr = 0; kr < 2; kr++) {
                    g.fillRect(-8, 2 + kr * 3, 16, 1.5);
                }
                break;

            case 'documents': // a yellow folder with papers sticking out
                shadowUnder(g, 20, 14);
                g.fillStyle = '#f4efe6';
                g.fillRect(-7, -9, 14, 12);
                g.fillStyle = '#e2b443';
                roundRect(g, -10, -5, 20, 13, 2);
                g.fill();
                g.fillStyle = '#b8862a';
                g.fillRect(-10, -5, 8, 3);
                break;

            case 'rice': // a sack tied at the top
                shadowUnder(g, 20, 20);
                g.fillStyle = '#e9dcbf';
                roundRect(g, -9, -8, 18, 18, 6);
                g.fill();
                g.fillStyle = '#c9b78f';
                g.fillRect(-4, -11, 8, 5);
                g.fillStyle = '#3e6fb0';
                g.fillRect(-9, 1, 18, 3);
                break;

            case 'water': // a big blue water jug, seen from above
                shadowUnder(g, 20, 20);
                g.fillStyle = '#7ec3ea';
                g.beginPath();
                g.arc(0, 0, 10, 0, Math.PI * 2);
                g.fill();
                g.strokeStyle = '#4c97c4';
                g.lineWidth = 1.5;
                g.beginPath();
                g.arc(0, 0, 6.5, 0, Math.PI * 2);
                g.stroke();
                g.fillStyle = '#2a63a8';
                g.beginPath();
                g.arc(0, 0, 3.5, 0, Math.PI * 2);
                g.fill();
                break;

            case 'flashlight':
                shadowUnder(g, 18, 8);
                g.fillStyle = '#3a3f45';
                roundRect(g, -9, -3.5, 14, 7, 2);
                g.fill();
                g.fillStyle = '#5c636b';
                g.fillRect(4, -5, 5, 10);
                g.fillStyle = '#ffe27a';
                g.fillRect(8, -4, 2, 8);
                break;

            case 'radio':
                shadowUnder(g, 22, 14);
                g.strokeStyle = '#2b2b2b';
                g.lineWidth = 1.5;
                g.beginPath();
                g.moveTo(6, -6);
                g.lineTo(11, -13);
                g.stroke();
                g.fillStyle = '#7a4e2e';
                roundRect(g, -11, -7, 22, 14, 3);
                g.fill();
                g.fillStyle = '#c9c1b4';
                g.beginPath();
                g.arc(-4, 0, 4.5, 0, Math.PI * 2);
                g.fill();
                g.fillStyle = '#e9d9a8';
                g.fillRect(3, -3, 6, 2);
                g.fillRect(3, 1, 6, 2);
                break;

            case 'tv':
                shadowUnder(g, 26, 18);
                g.fillStyle = '#4a4f55';
                g.fillRect(-5, 7, 10, 3);
                g.fillStyle = '#1d2024';
                roundRect(g, -13, -9, 26, 17, 2);
                g.fill();
                g.fillStyle = '#41627f';
                g.fillRect(-11, -7, 22, 13);
                g.fillStyle = 'rgba(255, 255, 255, 0.25)';
                g.fillRect(-9, -5, 7, 2);
                break;

            case 'ref': // the refrigerator: big, white, very heavy
                shadowUnder(g, 24, 26);
                g.fillStyle = '#e6edf0';
                roundRect(g, -11, -13, 22, 26, 3);
                g.fill();
                g.strokeStyle = '#8f9da4';
                g.lineWidth = 1.5;
                g.beginPath();
                g.moveTo(-11, -3);
                g.lineTo(11, -3);
                g.stroke();
                g.fillStyle = '#8f9da4';
                g.fillRect(6, -10, 2, 5);
                g.fillRect(6, 0, 2, 8);
                break;

            case 'fan': // electric fan: round base, cage and three blades
                shadowUnder(g, 22, 22);
                g.fillStyle = '#d8dde0';
                g.beginPath();
                g.arc(0, 0, 11, 0, Math.PI * 2);
                g.fill();
                g.fillStyle = '#4a90c8';
                for (var b = 0; b < 3; b++) {
                    var a = b * Math.PI * 2 / 3;
                    g.beginPath();
                    g.ellipse(Math.cos(a) * 5, Math.sin(a) * 5, 5, 2.6, a, 0, Math.PI * 2);
                    g.fill();
                }
                g.strokeStyle = '#7d878d';
                g.lineWidth = 1.5;
                g.beginPath();
                g.arc(0, 0, 11, 0, Math.PI * 2);
                g.stroke();
                g.fillStyle = '#7d878d';
                g.beginPath();
                g.arc(0, 0, 2.5, 0, Math.PI * 2);
                g.fill();
                break;
        }

        g.restore();
    }

    // Dog and cat seen from above, turned the way they're facing
    function drawPet(g, type, faceX, faceY) {
        var dog = type === 'dog';
        var body = dog ? '#9a6a3a' : '#e39b3d';
        var dark = dog ? '#5e3e20' : '#b8701f';
        var len = dog ? 10 : 8;

        g.rotate(Math.atan2(faceY, faceX));   // now "forward" is +x
        g.fillStyle = C.shadow;
        g.beginPath();
        g.ellipse(1, 3, len + 2, 5, 0, 0, Math.PI * 2);
        g.fill();

        // tail
        g.strokeStyle = dark;
        g.lineWidth = dog ? 3 : 2.5;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(-len + 1, 0);
        g.quadraticCurveTo(-len - 5, dog ? -2 : 6, -len - 6, dog ? -5 : 2);
        g.stroke();

        // body and head
        g.fillStyle = body;
        g.beginPath();
        g.ellipse(-1, 0, len, dog ? 6 : 5, 0, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.arc(len - 1, 0, dog ? 5.5 : 4.5, 0, Math.PI * 2);
        g.fill();

        // ears: floppy for the dog, pointy for the cat
        g.fillStyle = dark;
        if (dog) {
            g.beginPath();
            g.ellipse(len - 3, -5, 3, 1.8, 0.4, 0, Math.PI * 2);
            g.ellipse(len - 3, 5, 3, 1.8, -0.4, 0, Math.PI * 2);
            g.fill();
            g.fillStyle = '#2a1a0e';
            g.beginPath();
            g.arc(len + 4, 0, 1.6, 0, Math.PI * 2);
            g.fill();
        } else {
            g.beginPath();
            g.moveTo(len - 3, -3); g.lineTo(len + 1, -7); g.lineTo(len + 1, -2);
            g.moveTo(len - 3, 3); g.lineTo(len + 1, 7); g.lineTo(len + 1, 2);
            g.fill();
            g.fillStyle = dark;
            g.fillRect(-6, -4, 2, 8);
            g.fillRect(-2, -5, 2, 10);
        }
    }

    // A ring around the item you can grab (pulses gently, unless reduced motion is on)
    function drawHighlight(it) {
        var pulse = reducedMotion.matches ? 0 : Math.sin(clock * 5) * 2;
        ctx.strokeStyle = '#ffd34d';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(it.x, it.y, 16 + pulse, 0, Math.PI * 2);
        ctx.stroke();
    }

    function drawToasts() {
        ctx.font = '800 16px "Baloo 2", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        toasts.forEach(function (t) {
            var rise = reducedMotion.matches ? 0 : t.age * 18;
            ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t.age - 1.2) / 0.6);
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#1c1405';
            ctx.strokeText(t.text, t.x, t.y - rise);
            ctx.fillStyle = '#ffd34d';
            ctx.fillText(t.text, t.x, t.y - rise);
        });
        ctx.globalAlpha = 1;
    }

    /* -----------------------------------------------------------------
       UPDATING EACH FRAME
       ----------------------------------------------------------------- */
    function update(dt) {
        clock += dt;
        toasts.forEach(function (t) { t.age += dt; });
        toasts = toasts.filter(function (t) { return t.age < 1.8; });
        if (banner) {
            banner.age += dt;
            if (banner.age > 3.2) { banner = null; }
        }

        // everything is safe: wait a moment (so you see the "+points"), then show the end screen
        if (finishIn >= 0) {
            finishIn -= dt;
            if (finishIn < 0) { endGame(); }
            return;
        }

        updateTime(dt);
        if (mode !== 'playing') {
            return;   // time ran out
        }

        movePlayer(dt);

        // walking onto the stairs with something saves it
        if (carrying && onStairs()) {
            saveCarried();
        }

        var near = carrying ? null : findNearby();
        if (near !== nearby) {
            nearby = near;
            updateHud();
        }
    }

    function movePlayer(dt) {
        var dx = (held.right ? 1 : 0) - (held.left ? 1 : 0);
        var dy = (held.down ? 1 : 0) - (held.up ? 1 : 0);

        if (dx === 0 && dy === 0) {
            player.walkTime = 0;
            return;
        }

        // the same speed diagonally as straight
        var len = Math.sqrt(dx * dx + dy * dy);
        dx /= len;
        dy /= len;
        player.faceX = dx;
        player.faceY = dy;
        player.walkTime += dt;

        var step = PLAYER_SPEED * (carrying ? carrying.def.speed : 1) * (1 - water * WATER_SLOW) * dt;

        // move sideways and up/down separately, so you slide along walls
        var nx = player.x + dx * step;
        if (!collides(nx, player.y)) {
            player.x = nx;
        }
        var ny = player.y + dy * step;
        if (!collides(player.x, ny)) {
            player.y = ny;
        }
    }

    /* -----------------------------------------------------------------
       TIME, PAGASA WARNINGS AND WATER
       ----------------------------------------------------------------- */
    function updateTime(dt) {
        elapsed += dt;

        var newPhase = elapsed < phaseEnds[0] ? 0 : (elapsed < phaseEnds[1] ? 1 : 2);
        if (newPhase !== phase) {
            phase = newPhase;
            showBanner();
            if (phase === 2) {
                ruinFloorThings();
            }
        }

        // Yellow: dry. Orange: rises to ankle-deep (0.45). Red: rises to knee-deep (1).
        if (phase === 0) {
            water = 0;
        } else if (phase === 1) {
            water = 0.45 * (elapsed - phaseEnds[0]) / (phaseEnds[1] - phaseEnds[0]);
        } else {
            water = 0.45 + 0.55 * Math.min(1, (elapsed - phaseEnds[1]) / (phaseEnds[2] - phaseEnds[1]));
        }

        var left = Math.ceil(phaseEnds[2] - elapsed);
        if (left === 10 && !updateTime.warned10) {
            updateTime.warned10 = true;
            announce('10 seconds left!');
        }
        if (left > 10) {
            updateTime.warned10 = false;
        }

        updateClock();

        if (elapsed >= phaseEnds[2]) {
            endGame();
        }
    }

    function showBanner() {
        var p = PHASES[phase];
        banner = { text: p.message, color: p.color, textColor: p.text, age: 0 };
        announce(p.message);
    }

    // At Red, the water ruins every object still on the floor. Family and pets can still be saved.
    function ruinFloorThings() {
        var ruined = items.filter(function (it) { return it.state === 'home' && !isAlive(it.def); });
        ruined.forEach(function (it) {
            it.state = 'lost';
            toasts.push({ text: 'Ruined!', x: it.x, y: it.y, age: 0 });
        });
        if (ruined.length) {
            announce(PHASES[2].message + ' The water ruined ' + ruined.length + ' things on the floor.');
        }
        if (nearby && nearby.state === 'lost') {
            nearby = null;
        }
        if (remaining() === 0) {
            finishIn = 1.6;
        }
        updateHud();
    }

    // The timer and the PAGASA badge in the top bar
    function updateClock() {
        var left = Math.max(0, Math.ceil(phaseEnds[2] - elapsed));
        var p = PHASES[phase];
        setText(hudTimer, Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2));
        setText(warnBadge, p.name);
        warnBadge.style.background = p.color;
        warnBadge.style.color = p.text;
        hudTimer.classList.toggle('is-urgent', left <= 10);
    }

    /* -----------------------------------------------------------------
       ITEMS: grab, carry, drop, save
       ----------------------------------------------------------------- */
    // Things that are still downstairs (on the floor or in your hands)
    function remaining() {
        return items.filter(function (i) { return i.state === 'home' || i.state === 'carried'; }).length;
    }

    // Is any part of the player standing on a stair tile?
    function onStairs() {
        var r = PLAYER_RADIUS - 1;
        return [[-r, -r], [r, -r], [-r, r], [r, r], [0, 0]].some(function (p) {
            return tileAt(Math.floor((player.x + p[0]) / TILE), Math.floor((player.y + p[1]) / TILE)) === 'S';
        });
    }

    // The closest item within reach, preferring the one you're facing
    function findNearby() {
        var best = null;
        var bestScore = Infinity;
        items.forEach(function (it) {
            if (it.state !== 'home') { return; }
            var dx = it.x - player.x;
            var dy = it.y - player.y;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > GRAB_RANGE) { return; }
            var facing = dist > 0 ? (dx * player.faceX + dy * player.faceY) / dist : 1;
            var s = dist - facing * 8;
            if (s < bestScore) {
                bestScore = s;
                best = it;
            }
        });
        return best;
    }

    // Space / E / Enter or the Grab button
    function action() {
        if (mode !== 'playing') {
            return;
        }
        if (carrying) {
            if (onStairs()) {
                saveCarried();
            } else {
                drop();
            }
        } else if (nearby) {
            carrying = nearby;
            carrying.state = 'carried';
            nearby = null;
            announce('Picked up ' + carrying.def.name + '.');
        }
        updateHud();
    }

    function drop() {
        // put it down just in front of you, or where you stand if there's a wall there
        var x = player.x + player.faceX * 14;
        var y = player.y + player.faceY * 14;
        if (isSolidAt(x, y)) {
            x = player.x;
            y = player.y;
        }
        carrying.x = x;
        carrying.y = y;
        carrying.state = 'home';
        announce('Put down ' + carrying.def.name + '.');
        carrying = null;
    }

    function saveCarried() {
        var it = carrying;
        it.state = 'saved';
        carrying = null;
        score += it.def.points;
        toasts.push({ text: '+' + it.def.points + ' ' + it.def.name, x: stairsCenter.x, y: stairsCenter.y - 10, age: 0 });

        if (remaining() === 0) {
            toasts.push({ text: 'Everyone is safe!', x: stairsCenter.x, y: stairsCenter.y + 14, age: -0.6 });
            announce(it.def.name + ' is safe upstairs. Nothing is left downstairs!');
            finishIn = 1.6;   // the timer stops here; the end screen comes up shortly
        } else {
            announce(it.def.name + ' is safe upstairs. Plus ' + it.def.points + ' points.');
        }
        updateHud();
    }

    // Screen readers hear this (the text is in an aria-live region)
    function announce(text) {
        announcer.textContent = '';
        announcer.textContent = text;
    }

    function setText(el, text) {
        if (el.textContent !== text) {
            el.textContent = text;
        }
    }

    // The status line under the house, and the phone's Grab button
    function updateHud() {
        var family = items.filter(function (i) { return i.def.group === 'family'; });
        var familySaved = family.filter(function (i) { return i.state === 'saved'; }).length;
        var left = remaining();
        var press = touchScreen.matches ? 'Tap Grab' : 'Press Space';

        var hint;
        if (carrying) {
            hint = 'Carrying ' + carrying.def.name + ' (' + weightWord(carrying.def) + '). Bring to the stairs!';
        } else if (nearby) {
            hint = press + ' to pick up ' + nearby.def.name + '.';
        } else if (left === 0) {
            hint = 'Nothing is left downstairs!';
        } else if (phase === 2) {
            hint = 'The water ruined what was on the floor. Save your family and pets! ' + left + ' left.';
        } else {
            hint = 'Find your family, pets and things. ' + left + ' left downstairs.';
        }

        setText(hudHint, hint);
        setText(hudFamily, 'Family ' + familySaved + '/' + family.length);
        setText(hudScore, 'Score ' + score);

        setText(grabMain, carrying ? 'Drop' : 'Grab');
        setText(grabSub, carrying ? carrying.def.name : (nearby ? nearby.def.name : ''));
        grabBtn.classList.toggle('is-ready', !!(carrying || nearby));
        grabBtn.setAttribute('aria-label', carrying ? 'Drop ' + carrying.def.name :
            (nearby ? 'Grab ' + nearby.def.name : 'Grab (nothing in reach)'));
    }

    function loop(time) {
        // dt = seconds since last frame, capped so a hiccup doesn't teleport the player
        var dt = Math.min((time - lastTime) / 1000, 0.05);
        lastTime = time;

        if (mode === 'playing') {
            update(dt);
        }
        render();
        window.requestAnimationFrame(loop);
    }

    /* -----------------------------------------------------------------
       GAME FLOW: title (pick a house) -> playing <-> paused -> end
       ----------------------------------------------------------------- */
    var levelIndex = 0;

    function startGame(index) {
        levelIndex = index;
        loadLevel(window.BAHA_LEVELS[index]);
        titleScreen.hidden = true;
        endScreen.hidden = true;
        pauseScreen.hidden = true;
        pauseBtn.hidden = false;
        hudWarning.hidden = false;
        mode = 'playing';
        showBanner();
        canvas.focus();
    }

    // Back to the title screen, where you pick a house
    function showTitle() {
        mode = 'title';
        releaseAll();
        endScreen.hidden = true;
        pauseScreen.hidden = true;
        pauseBtn.hidden = true;
        hudWarning.hidden = true;
        buildHouseCards();
        titleScreen.hidden = false;
        var first = houseList.querySelector('button');
        if (first) { first.focus(); }
    }

    // One button per house, with its difficulty and your best result
    function buildHouseCards() {
        var best = loadBest();
        houseList.textContent = '';
        window.BAHA_LEVELS.forEach(function (lv, i) {
            var b = best[lv.id];
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'house-card';

            var top = document.createElement('span');
            top.className = 'house-top';
            var name = document.createElement('span');
            name.className = 'house-name';
            name.textContent = lv.name;
            var diff = document.createElement('span');
            diff.className = 'house-diff diff-' + (lv.difficulty || 'medium').toLowerCase();
            diff.textContent = lv.difficulty || '';
            top.appendChild(name);
            top.appendChild(diff);

            var blurb = document.createElement('span');
            blurb.className = 'house-blurb';
            blurb.textContent = lv.blurb || '';

            var bestEl = document.createElement('span');
            bestEl.className = 'house-best';
            bestEl.textContent = b ? 'Best: ' + b.score + '  ' + starText(b.stars) : 'Not played yet';

            btn.appendChild(top);
            btn.appendChild(blurb);
            btn.appendChild(bestEl);
            btn.setAttribute('aria-label', 'Play ' + lv.name + ', ' + (lv.difficulty || '') + '. ' +
                (b ? 'Best score ' + b.score + ', ' + b.stars + ' of 3 stars.' : 'Not played yet.'));
            btn.addEventListener('click', function () { startGame(i); });
            houseList.appendChild(btn);
        });
    }

    function starText(n) {
        return '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n);
    }

    /* -----------------------------------------------------------------
       HIGH SCORES: kept in this browser (localStorage). If the browser
       blocks storage (e.g. private mode), the game still works, it just
       doesn't remember.
       ----------------------------------------------------------------- */
    var BEST_KEY = 'baha.best.v1';

    function loadBest() {
        try {
            return JSON.parse(window.localStorage.getItem(BEST_KEY)) || {};
        } catch (e) {
            return {};
        }
    }

    // Returns true if this is a new best score for the house
    function saveBest(id, total, stars) {
        var best = loadBest();
        var old = best[id];
        var isNew = !old || total > old.score;
        best[id] = {
            score: isNew ? total : old.score,
            stars: Math.max(stars, old ? old.stars : 0)
        };
        try {
            window.localStorage.setItem(BEST_KEY, JSON.stringify(best));
        } catch (e) {
            // storage not available: nothing to do
        }
        return isNew && total > 0;
    }

    /* -----------------------------------------------------------------
       THE END: what was saved and lost, score, stars, tips
       ----------------------------------------------------------------- */
    function endGame() {
        if (mode === 'ended') {
            return;
        }
        var timeLeft = Math.max(0, phaseEnds[2] - elapsed);

        // the ground floor is flooded: whatever is still downstairs is lost
        items.forEach(function (it) {
            if (it.state === 'home' || it.state === 'carried') { it.state = 'lost'; }
        });
        carrying = null;
        nearby = null;
        mode = 'ended';
        releaseAll();
        pauseBtn.hidden = true;

        var saved = items.filter(function (i) { return i.state === 'saved'; });
        var lost = items.filter(function (i) { return i.state === 'lost'; });
        var familyLost = lost.filter(function (i) { return i.def.group === 'family'; });
        var familySafe = familyLost.length === 0;

        // stars: 1 for the whole family, then 2 and 3 for how much of the rest you saved
        var otherMax = 0, otherSaved = 0;
        items.forEach(function (i) {
            if (i.def.group === 'family') { return; }
            otherMax += i.def.points;
            if (i.state === 'saved') { otherSaved += i.def.points; }
        });
        var share = otherMax ? otherSaved / otherMax : 1;
        var stars = !familySafe ? 0 : (share >= 0.8 ? 3 : (share >= 0.5 ? 2 : 1));

        var bonus = familySafe ? Math.floor(timeLeft) * TIME_BONUS : 0;
        var total = score + bonus;

        // fill in the end screen
        setText(document.getElementById('end-heading'), familySafe ? 'Ligtas ang pamilya!' : 'Hindi lahat nakaligtas...');
        setText(document.getElementById('end-sub'), familySafe ?
            'Your whole family made it upstairs.' :
            listNames(familyLost) + (familyLost.length > 1 ? ' were' : ' was') + ' left downstairs. Family comes first: try again!');

        var starEl = document.getElementById('end-stars');
        setText(starEl, starText(stars));
        starEl.setAttribute('aria-label', stars + ' of 3 stars');

        var isBest = saveBest(level.id, total, stars);
        document.getElementById('end-best').hidden = !isBest;

        setText(document.getElementById('end-score'), 'Score ' + total);
        setText(document.getElementById('end-breakdown'), score + ' for what you saved' +
            (bonus ? ' + ' + bonus + ' time bonus (' + Math.floor(timeLeft) + 's left)' : ''));

        fillList('end-saved', saved, 'Nothing', true);
        fillList('end-lost', lost, 'Nothing. Great job!', false);
        fillTips(lost);

        // "Next house" once the whole family is safe (and there is a next house)
        var next = window.BAHA_LEVELS[levelIndex + 1];
        nextBtn.hidden = !(familySafe && next);
        if (next) { setText(nextBtn, 'Next: ' + next.name); }
        // only one big yellow button at a time
        document.getElementById('again-btn').className = 'btn ' + (nextBtn.hidden ? 'btn-primary' : 'btn-secondary');

        endScreen.hidden = false;
        endScreen.scrollTop = 0;
        announce((familySafe ? 'Your whole family is safe. ' : 'Not everyone made it. ') +
            'Score ' + total + ', ' + stars + ' of 3 stars.' + (isBest ? ' New best score!' : ''));
        (nextBtn.hidden ? document.getElementById('again-btn') : nextBtn).focus();
    }

    function listNames(list) {
        var names = list.map(function (i) { return i.def.name; });
        if (names.length <= 1) { return names.join(''); }
        return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
    }

    function fillList(id, list, emptyText, withPoints) {
        var ul = document.getElementById(id);
        ul.textContent = '';
        if (!list.length) {
            var none = document.createElement('li');
            none.textContent = emptyText;
            ul.appendChild(none);
            return;
        }
        list.forEach(function (it) {
            var li = document.createElement('li');
            li.textContent = it.def.name + (withPoints ? ' (+' + it.def.points + ')' : '');
            if (it.def.group === 'family') { li.className = 'is-family'; }
            ul.appendChild(li);
        });
    }

    // Three tips: the PAGASA colors, then ones that match what you lost, then a random one
    function fillTips(lost) {
        var picks = [0];
        var lostGroup = function (g) { return lost.some(function (i) { return i.def.group === g; }); };
        if (lostGroup('important') || lostGroup('supplies')) { picks.push(1); }
        if (lostGroup('appliance')) { picks.push(2); }
        var others = [3, 4, 5, 1, 2].filter(function (n) { return picks.indexOf(n) < 0; });
        while (picks.length < 3) {
            picks.push(others.splice(Math.floor(Math.random() * others.length), 1)[0]);
        }

        var ul = document.getElementById('end-tips');
        ul.textContent = '';
        picks.forEach(function (n) {
            var li = document.createElement('li');
            li.textContent = TIPS[n];
            ul.appendChild(li);
        });
    }

    function pause() {
        if (mode !== 'playing') {
            return;
        }
        mode = 'paused';
        releaseAll();
        pauseScreen.hidden = false;
        document.getElementById('resume-btn').focus();
    }

    function resume() {
        if (mode !== 'paused') {
            return;
        }
        pauseScreen.hidden = true;
        mode = 'playing';
    }

    function releaseAll() {
        held.up = held.down = held.left = held.right = false;
        document.querySelectorAll('.dpad-btn.is-down').forEach(function (b) {
            b.classList.remove('is-down');
        });
    }

    /* -----------------------------------------------------------------
       INPUT: keyboard
       ----------------------------------------------------------------- */
    var KEYS = {
        ArrowUp: 'up', KeyW: 'up',
        ArrowDown: 'down', KeyS: 'down',
        ArrowLeft: 'left', KeyA: 'left',
        ArrowRight: 'right', KeyD: 'right'
    };
    // Grab / drop
    var ACTION_KEYS = { Space: true, KeyE: true, Enter: true, NumpadEnter: true };

    window.addEventListener('keydown', function (e) {
        if (e.code === 'KeyP' || e.code === 'Escape') {
            if (mode === 'playing') { pause(); } else if (mode === 'paused') { resume(); }
            return;
        }
        if (ACTION_KEYS[e.code] && mode === 'playing') {
            e.preventDefault();   // don't also press a focused button or scroll the page
            if (!e.repeat) {
                action();
            }
            return;
        }
        var dir = KEYS[e.code];
        if (dir && mode === 'playing') {
            held[dir] = true;
            e.preventDefault();   // arrow keys shouldn't scroll the page
        }
    });

    window.addEventListener('keyup', function (e) {
        var dir = KEYS[e.code];
        if (dir) {
            held[dir] = false;
        }
    });

    /* -----------------------------------------------------------------
       INPUT: phone buttons (hold to move)
       ----------------------------------------------------------------- */
    document.querySelectorAll('.dpad-btn').forEach(function (btn) {
        var dir = btn.getAttribute('data-dir');

        function press(e) {
            e.preventDefault();
            if (btn.setPointerCapture && e.pointerId !== undefined) {
                btn.setPointerCapture(e.pointerId);   // keep getting events even if the finger slides off
            }
            held[dir] = true;
            btn.classList.add('is-down');
        }

        function release() {
            held[dir] = false;
            btn.classList.remove('is-down');
        }

        btn.addEventListener('pointerdown', press);
        btn.addEventListener('pointerup', release);
        btn.addEventListener('pointercancel', release);
        btn.addEventListener('lostpointercapture', release);
        btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });   // no long-press menu
    });

    // The Grab button reacts the moment your finger touches it
    grabBtn.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        grabBtn.classList.add('is-down');
        action();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (name) {
        grabBtn.addEventListener(name, function () { grabBtn.classList.remove('is-down'); });
    });
    grabBtn.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    /* -----------------------------------------------------------------
       BUTTONS AND WINDOW EVENTS
       ----------------------------------------------------------------- */
    document.getElementById('resume-btn').addEventListener('click', resume);
    document.getElementById('quit-btn').addEventListener('click', showTitle);
    document.getElementById('again-btn').addEventListener('click', function () { startGame(levelIndex); });
    document.getElementById('houses-btn').addEventListener('click', showTitle);
    nextBtn.addEventListener('click', function () { startGame(levelIndex + 1); });
    pauseBtn.addEventListener('click', pause);

    // Switching tabs or apps pauses the game, and lets go of every key
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            pause();
        }
    });
    window.addEventListener('blur', releaseAll);

    // Redraw sharply if the screen's pixel density changes (e.g. moving to another monitor)
    window.addEventListener('resize', function () {
        if (level) {
            sizeCanvas();
            drawFloorLayer();
        }
    });

    // Fonts are used inside the canvas; redraw once they've loaded
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
            if (level) { drawFloorLayer(); }
        });
    }

    // Lets the automated check (a test script run with Node) look inside the game
    window.BAHA_TEST = {
        state: function () {
            return { mode: mode, player: player, items: items, carrying: carrying, nearby: nearby, score: score,
                elapsed: elapsed, phase: phase, water: water, levelIndex: levelIndex, level: level };
        }
    };

    // Show the first house behind the title screen, list the houses, then start the loop
    loadLevel(window.BAHA_LEVELS[0]);
    buildHouseCards();
    window.requestAnimationFrame(function (t) {
        lastTime = t;
        window.requestAnimationFrame(loop);
    });
})();
