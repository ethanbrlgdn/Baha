/* =====================================================================
   LEVELS: the house layouts, drawn as text. Each character is one tile.

     #  wall            w  window (in a wall)     F  front door (closed)
     .  wooden floor    ,  tiled floor (kitchen)
     D  doorway         S  stairs (the safe place: bring things here)
     b  bed             k  kitchen counter        t  table
     s  sofa

   Every row must be the same length. spawn = where the player starts
   (column, row). labels = room names drawn on the floor.
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
        ]
    }
];
