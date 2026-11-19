/* =====================================================================
   SAVE LINES: what the player says (in a speech bubble) when he brings
   someone or something safely to the stairs.

   - Type each line between the quotes:      lola: ['Kapit lang, La!'],
   - Want variety? Add more lines, separated by commas, and the game
     picks one at random each time:          lola: ['Kapit lang, La!', 'Dahan-dahan sa hagdan, La!'],
   - Leave the quotes empty ('') and he says nothing for that one.
   - "any" is used for anything that has no line of its own.
   - Keep lines short (about 30 letters or less) so they fit on a phone.
   - If a line has an apostrophe in it, put a backslash before it:  'Let\'s go!'
   ===================================================================== */
window.BAHA_LINES = {
    // used when the item below has no line
    any: [''],

    // family
    lola: ['Sheesh la, may bitaw ka talaga', 'Bigat mo La'],
    lolo: ['Lo, dito ang tingin!', 'Lo dinner with Jay Z or 1 minute with Lola?'],
    bunso: ['Pasalamat ka niligtas kita kahit ampon ka', 'Hugas ka plato ha'],
    nene: ['Pili ka, alt baddie or nursing na taga etivac?', 'Iwan kita dito sa labas kung nanonood ka PBB'],

    // pets and animals
    dog: ['love you mocha'],          // Mocha the dog
    cat: ['lieetttt'],          // Muning the cat
    chicken: ['Arf?'],      // Manok (Bahay Kubo)
    bird: ['masarap ba to i-ulam?'],         // Birdcage (Apartment)

    // important things and supplies
    documents: [''],
    laptop: [''],       // School laptop (Apartment)
    rice: [''],         // Sack of rice
    water: [''],        // Drinking water
    flashlight: [''],
    radio: [''],

    // appliances
    tv: [''],
    ref: [''],
    fan: ['']           // Electric fan
};
