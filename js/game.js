/* =====================================================================
   BAHA! game
   Step 1: draw the house from a level map, walk around it with the
   keyboard or the phone buttons, bump into walls and furniture.
   ===================================================================== */
(function () {
    'use strict';

    // ---- Settings ----
    var TILE = 32;              // one map character = 32x32 pixels
    var PLAYER_RADIUS = 10;
    var PLAYER_SPEED = 130;     // pixels per second

    // Map characters you can't walk through
    var SOLID = { '#': true, 'w': true, 'F': true, 'b': true, 'k': true, 't': true, 's': true };
    // Furniture: drawn as one object per connected group of the same character
    var FURNITURE = { 'b': true, 'k': true, 't': true, 's': true, 'S': true, 'F': true };

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

    // ---- Game state ----
    var level = null;
    var cols = 0;
    var rows = 0;
    var floorLayer = null;       // the house is drawn once into here, then copied each frame
    var mode = 'title';          // 'title' | 'playing' | 'paused'
    var lastTime = 0;

    var player = { x: 0, y: 0, faceX: 0, faceY: 1, walkTime: 0 };

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

        hudLevel.textContent = level.name;

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

        // 1. Floors (also under furniture, stairs and doors)
        for (row = 0; row < rows; row++) {
            for (col = 0; col < cols; col++) {
                ch = tileAt(col, row);
                if (ch === ',' || (ch === 'k')) {
                    drawTileFloor(g, col, row);
                } else if (ch !== '#' && ch !== 'w') {
                    drawWoodFloor(g, col, row);
                }
            }
        }

        // 2. Walls and windows
        for (row = 0; row < rows; row++) {
            for (col = 0; col < cols; col++) {
                ch = tileAt(col, row);
                if (ch === '#' || ch === 'w') {
                    drawWall(g, col, row, ch === 'w');
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

    function drawTileFloor(g, col, row) {
        g.fillStyle = (col + row) % 2 === 0 ? C.tileA : C.tileB;
        g.fillRect(col * TILE, row * TILE, TILE, TILE);
    }

    function drawWall(g, col, row, isWindow) {
        var x = col * TILE;
        var y = row * TILE;
        g.fillStyle = C.wall;
        g.fillRect(x, y, TILE, TILE);
        // a lighter top edge gives the walls a little depth
        g.fillStyle = C.wallTop;
        g.fillRect(x, y, TILE, 6);
        if (isWindow) {
            g.fillStyle = C.windowPane;
            g.fillRect(x + 5, y + 10, TILE - 10, TILE - 18);
            g.fillStyle = C.wall;
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

        // soft shadow under everything except the door and stairs
        if (group.ch !== 'F' && group.ch !== 'S') {
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

            case 'S': // stairs: steps going up, with a label
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
        drawPlayer();
    }

    function drawPlayer() {
        var x = player.x;
        var y = player.y;
        // a small bob while walking
        var bob = player.walkTime > 0 ? Math.sin(player.walkTime * 14) * 1.2 : 0;

        // shadow
        ctx.fillStyle = C.shadow;
        ctx.beginPath();
        ctx.ellipse(x + 1, y + 5, PLAYER_RADIUS, PLAYER_RADIUS * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // body (shoulders), seen from above
        ctx.fillStyle = C.shirt;
        ctx.beginPath();
        ctx.ellipse(x, y + bob, PLAYER_RADIUS, PLAYER_RADIUS * 0.8, Math.atan2(player.faceY, player.faceX) + Math.PI / 2, 0, Math.PI * 2);
        ctx.fill();

        // head, nudged toward the way you're facing
        var hx = x + player.faceX * 2;
        var hy = y + player.faceY * 2 + bob;
        ctx.fillStyle = C.skin;
        ctx.beginPath();
        ctx.arc(hx, hy, 6.5, 0, Math.PI * 2);
        ctx.fill();

        // hair on the back of the head
        ctx.fillStyle = C.hair;
        ctx.beginPath();
        ctx.arc(hx - player.faceX * 1.5, hy - player.faceY * 1.5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.skin;
        ctx.beginPath();
        ctx.arc(hx + player.faceX * 2.5, hy + player.faceY * 2.5, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    /* -----------------------------------------------------------------
       UPDATING EACH FRAME
       ----------------------------------------------------------------- */
    function update(dt) {
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

        var step = PLAYER_SPEED * dt;

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
       GAME FLOW: title -> playing <-> paused
       ----------------------------------------------------------------- */
    function startGame() {
        loadLevel(window.BAHA_LEVELS[0]);
        titleScreen.hidden = true;
        pauseBtn.hidden = false;
        mode = 'playing';
        canvas.focus();
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

    window.addEventListener('keydown', function (e) {
        if (e.code === 'KeyP' || e.code === 'Escape') {
            if (mode === 'playing') { pause(); } else if (mode === 'paused') { resume(); }
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

    /* -----------------------------------------------------------------
       BUTTONS AND WINDOW EVENTS
       ----------------------------------------------------------------- */
    document.getElementById('start-btn').addEventListener('click', startGame);
    document.getElementById('resume-btn').addEventListener('click', resume);
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

    // Show the house behind the title screen, then start the loop
    loadLevel(window.BAHA_LEVELS[0]);
    window.requestAnimationFrame(function (t) {
        lastTime = t;
        window.requestAnimationFrame(loop);
    });
})();
