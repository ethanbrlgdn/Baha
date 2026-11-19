/* =====================================================================
   LEVELS: the house layouts, drawn as text. Each character is one tile.

     #  wall            w  window (in a wall)     F  front door (closed)
     .  wooden floor    ,  tiled floor (kitchen)
     D  doorway         S  stairs (the safe place: bring things here)
     b  bed             k  kitchen counter        t  table
     s  sofa

   Every row must be the same length. spawn = where the player starts
   (column, row). labels = room names drawn on the floor.
   items = things to save; type is one of the ITEM_TYPES in game.js
   (lola, lolo, bunso, nene, dog, cat, documents, rice, water,
   flashlight, radio, tv, ref, fan). col/row is the item's center,
   so 4.5 means "the middle of column 4". Put them on floor tiles.
   ===================================================================== */
window.BAHA_LEVELS = [
    {
        id: 'two-storey',
        name: 'Two-Storey House',
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
    }
];
