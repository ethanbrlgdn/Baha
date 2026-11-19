/* =====================================================================
   LEVELS: the house layouts, drawn as text. Each character is one tile.

     #  wall            w  window (in a wall)     F  front door (closed)
     .  wooden floor    ,  tiled floor            c  concrete floor
     g  grass (yard)    f  bamboo fence           T  tree
     D  doorway         S  stairs / ladder (the safe place: bring things here)
     b  bed             k  kitchen counter        t  table (or bench)
     s  sofa            R  nipa roof of the bahay kubo (seen from above)

   Every row must be the same length. spawn = where the player starts
   (column, row). labels = text drawn on the floor.
   items = things to save; type is one of the ITEM_TYPES in game.js
   (lola, lolo, bunso, nene, dog, cat, chicken, bird, documents, laptop,
   rice, water, flashlight, radio, tv, ref, fan). col/row is the item's
   center, so 4.5 means "the middle of column 4". Put them on floor tiles.
   time = seconds of each PAGASA warning. Yellow: no water yet.
   Orange: water comes in. Red: things left on the floor are ruined,
   and when Red ends the ground floor is flooded (game over).
   difficulty and blurb are shown on the title screen.
   ===================================================================== */
window.BAHA_LEVELS = [
    {
        id: 'kubo',
        name: 'Bahay Kubo',
        difficulty: 'Easy',
        blurb: 'A nipa hut on stilts. Carry everyone up the bamboo ladder, and don\'t forget the chickens!',
        map: [
            'ffffffffffffffffff',
            'fgTggggggggggggTgf',
            'fggggggRRRRRRggggf',
            'fgkkgggRRRRRRggggf',
            'fggggggRRRRRRggggf',
            'fggggggRRRRRRggTgf',
            'fggggggggSSggggggf',
            'fggggggggggggggggf',
            'fgTgggttggggggTggf',
            'fggggggggggggggggf',
            'ffffffffffffffffff'
        ],
        spawn: { col: 10, row: 7.6 },
        time: { yellow: 45, orange: 40, red: 35 },
        labels: [
            { text: 'Bahay Kubo', col: 10, row: 4 },
            { text: 'Kusina', col: 3, row: 2.3 },
            { text: 'Hagdan', col: 10, row: 7.1 },
            { text: 'Bakuran', col: 9, row: 9.5 }
        ],
        items: [
            { type: 'lola', col: 5.4, row: 8.5 },
            { type: 'lolo', col: 2.5, row: 4.5 },
            { type: 'bunso', col: 15.5, row: 7.5 },
            { type: 'nene', col: 12.5, row: 1.5 },
            { type: 'dog', col: 4.5, row: 6.5 },
            { type: 'chicken', col: 14.5, row: 9.4 },
            { type: 'chicken', col: 16.4, row: 3.5 },
            { type: 'documents', col: 13.5, row: 6.5 },
            { type: 'rice', col: 4.5, row: 3.5 },
            { type: 'water', col: 1.5, row: 3.5 },
            { type: 'radio', col: 8.5, row: 8.5 }
        ]
    },
    {
        id: 'two-storey',
        name: 'Two-Storey House',
        difficulty: 'Medium',
        blurb: 'Four rooms downstairs and a lot to carry. The ref is very heavy: is it worth it?',
        map: [
            '#####w######w#######',
            '#bb...#......#,,,,,#',
            '#bb...#......#,kk,,#',
            '#.....D......D,,,,,#',
            '#.....#..tt..#,,,,,#',
            '###D###..tt..###D###',
            '#.....#......#.....#',
            '#bb...D..ss..D..SS.#',
            '#bb...#......#..SS.#',
            '#.....#......#.....#',
            '#####w###FF###w#####'
        ],
        spawn: { col: 10, row: 8.6 },
        time: { yellow: 40, orange: 40, red: 40 },
        labels: [
            { text: 'Kwarto', col: 3.5, row: 4.4 },
            { text: 'Sala', col: 10, row: 2 },
            { text: 'Kusina', col: 16.5, row: 4.4 },
            { text: 'Kwarto ni Lola', col: 3.5, row: 9.4 },
            { text: 'Hagdan', col: 17, row: 9.4 }
        ],
        items: [
            // family (must be saved)
            { type: 'lola', col: 4.5, row: 7.5 },
            { type: 'lolo', col: 4.5, row: 2.5 },
            { type: 'bunso', col: 11.5, row: 2.5 },
            { type: 'nene', col: 1.5, row: 3.6 },
            // pets
            { type: 'dog', col: 7.5, row: 8.5 },
            { type: 'cat', col: 17.5, row: 3.5 },
            // important things and supplies
            { type: 'documents', col: 1.5, row: 6.5 },
            { type: 'rice', col: 15.5, row: 1.5 },
            { type: 'water', col: 18.5, row: 1.5 },
            { type: 'flashlight', col: 5.5, row: 1.5 },
            { type: 'radio', col: 12.5, row: 1.5 },
            // appliances (heavy!)
            { type: 'tv', col: 12.5, row: 9.4 },
            { type: 'ref', col: 18.5, row: 4.4 },
            { type: 'fan', col: 3.5, row: 1.5 }
        ]
    },
    {
        id: 'apartment',
        name: 'Apartment',
        difficulty: 'Hard',
        blurb: 'A ground-floor unit. The building\'s stairs are down the hallway, and time is short.',
        walls: { color: '#4d5257', top: '#6c7278' },   // concrete walls (default: wooden)
        map: [
            '######################',
            '#bb...#.ss.#,kk#cccSS#',
            '#bb...D....D,,,DcccSS#',
            '#.....#.tt.#,,,#ccccc#',
            '###D###.tt.##D##ccccc#',
            '#.....#....#,,,#ccccc#',
            '#bb...D....#,,,#ccccc#',
            '#bb...#....#,,,#ccccc#',
            '#########D######D#####',
            '#cccccccccccccccccccc#',
            '#cccccccccccccccccccc#',
            '###w#####w#####w######'
        ],
        spawn: { col: 9.5, row: 7.4 },
        time: { yellow: 35, orange: 35, red: 35 },
        labels: [
            { text: 'Kwarto', col: 3.5, row: 3.5 },
            { text: 'Kwarto ni Lola', col: 3.5, row: 5.5 },
            { text: 'Sala', col: 9, row: 6.4 },
            { text: 'Kusina', col: 13.5, row: 3.6 },
            { text: 'Banyo', col: 13.5, row: 5.6 },
            { text: 'Pasilyo', col: 11, row: 10 },
            { text: 'Hagdan', col: 18.5, row: 4.5 }
        ],
        items: [
            { type: 'lola', col: 4.5, row: 6.5 },
            { type: 'bunso', col: 8.5, row: 5.5 },
            { type: 'nene', col: 4.5, row: 1.6 },
            { type: 'cat', col: 13.5, row: 7.4 },
            { type: 'bird', col: 10.4, row: 1.5 },
            { type: 'documents', col: 1.5, row: 3.5 },
            { type: 'laptop', col: 5.4, row: 2.6 },
            { type: 'ref', col: 12.5, row: 1.5 },
            { type: 'rice', col: 14.5, row: 2.6 },
            { type: 'water', col: 12.5, row: 3.4 },
            { type: 'flashlight', col: 5.5, row: 7.5 },
            { type: 'radio', col: 7.5, row: 2.5 },
            { type: 'tv', col: 10.4, row: 4.5 },
            { type: 'fan', col: 1.5, row: 5.5 }
        ]
    }
];
