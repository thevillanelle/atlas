// Static reference data for the sky layer: planets, named stars, constellations, natal copy.

export const PLANET_DATA = {
  Mercury:{dist:'0.39 AU',period:'88 days',moons:0,radius:'2,439 km',type:'Terrestrial',wiki:'https://en.wikipedia.org/wiki/Mercury_(planet)',note:'The smallest planet and closest to the Sun. A day on Mercury lasts longer than its year — it rotates so slowly the Sun rises, nearly stops, reverses, and sets again before the planet completes one orbit.'},
  Venus:  {dist:'0.72 AU',period:'225 days',moons:0,radius:'6,051 km',type:'Terrestrial',wiki:'https://en.wikipedia.org/wiki/Venus',note:'The hottest planet despite not being closest to the Sun. Its thick CO₂ atmosphere creates a runaway greenhouse effect — surface temperatures hit 465°C. It rotates backwards; the Sun rises in the west.'},
  Mars:   {dist:'1.52 AU',period:'687 days',moons:2,radius:'3,389 km',type:'Terrestrial',wiki:'https://en.wikipedia.org/wiki/Mars',note:'Home to Olympus Mons, the solar system\'s largest volcano — three times the height of Everest. Ancient river valleys suggest liquid water once flowed here. Currently home to several active rovers.'},
  Jupiter:{dist:'5.20 AU',period:'11.9 yrs',moons:95,radius:'69,911 km',type:'Gas Giant',wiki:'https://en.wikipedia.org/wiki/Jupiter',note:'More than twice the mass of all other planets combined. Its Great Red Spot is a storm raging for at least 350 years. Acts as the solar system\'s shield, deflecting comets and asteroids with its immense gravity.'},
  Saturn: {dist:'9.58 AU',period:'29.5 yrs',moons:146,radius:'58,232 km',type:'Gas Giant',wiki:'https://en.wikipedia.org/wiki/Saturn',note:'The least dense planet — it would float in water. Its rings span 282,000 km but are only ~10 meters thick. Titan, its largest moon, has liquid methane lakes and a thick nitrogen atmosphere — the only moon with one.'},
  Uranus: {dist:'19.2 AU',period:'84 yrs',moons:28,radius:'25,362 km',type:'Ice Giant',wiki:'https://en.wikipedia.org/wiki/Uranus',note:'Rotates on its side — axial tilt of 98°, likely the result of a massive ancient collision. Its north pole points almost directly at the Sun for 42 years at a time. Coldest planetary atmosphere at -224°C.'},
  Neptune:{dist:'30.1 AU',period:'165 yrs',moons:16,radius:'24,622 km',type:'Ice Giant',wiki:'https://en.wikipedia.org/wiki/Neptune',note:'The windiest planet — supersonic winds reach 2,100 km/h. Its moon Triton orbits backwards and is almost certainly a captured Kuiper Belt object. Neptune was predicted mathematically before it was ever observed.'},
  Pluto:  {dist:'~39.5 AU',period:'248 yrs',moons:5,radius:'1,188 km',type:'Dwarf Planet',wiki:'https://en.wikipedia.org/wiki/Pluto',note:'Reclassified as a dwarf planet by the IAU in 2006 — a decision Atlas respectfully ignores. Pluto has a heart-shaped nitrogen ice plain called Tombaugh Regio and five moons. Charon is so large relative to Pluto that they orbit a point in space between them. New Horizons flew past in 2015, revealing a surprisingly geologically active world.'},
};

// name, ra_deg(J2000), dec_deg, mag, spectral, dist_ly, constellation, note
export const STAR_CATALOG = [
  ['Sirius',      101.29, -16.72, -1.46,'A1V',   8.6,  'Canis Major',    'Brightest star in the night sky. Its heliacal rising signaled the Nile flood to ancient Egyptians.'],
  ['Canopus',      95.99, -52.70, -0.74,'F0II',  310,  'Carina',         'Second brightest star. Used by NASA as a navigational reference for spacecraft attitude control.'],
  ['Arcturus',    213.91,  19.18, -0.05,'K1.5III', 37, 'Boötes',         'Brightest star in the northern sky. Its 1933 light was used to open the Chicago World\'s Fair.'],
  ['Vega',        279.23,  38.78,  0.03,'A0V',    25,  'Lyra',           'Was the North Star 14,000 years ago. Will be again in ~13,700 years. Touchstone for stellar brightness.'],
  ['Capella',      79.17,  45.99,  0.08,'G5+G0III',43, 'Auriga',         'Actually two giant stars orbiting each other every 104 days, indistinguishable to the naked eye.'],
  ['Rigel',        78.63,  -8.20,  0.13,'B8Ia',  860,  'Orion',          'A blue supergiant so luminous it would cast shadows if it replaced our Sun. Orion\'s left foot.'],
  ['Procyon',     114.83,   5.22,  0.34,'F5IV',  11.5, 'Canis Minor',    'One of the nearest bright stars. Rises just before Sirius — the Greeks called it "before the dog."'],
  ['Achernar',     24.43, -57.24,  0.46,'B6Vep', 139,  'Eridanus',       'One of the most oblate stars known — spins so fast its equatorial diameter is 50% wider than its poles.'],
  ['Betelgeuse',   88.79,   7.41,  0.50,'M1-2Ia',700,  'Orion',          'A red supergiant so large it would swallow Jupiter\'s orbit. Expected to go supernova within 100,000 years.'],
  ['Hadar',       210.96, -60.37,  0.61,'B1III', 390,  'Centaurus',      'Pointer star to the Southern Cross. Once thought to be the same star as Alpha Centauri to the naked eye.'],
  ['Altair',      297.70,   8.87,  0.77,'A7V',    17,  'Aquila',         'Spins once every 9 hours — so fast it is noticeably flattened at the poles. The Eagle\'s neck.'],
  ['Acrux',       186.65, -63.10,  0.77,'B0.5+B1V',320,'Crux',          'The bottom of the Southern Cross. Used by navigators in the southern hemisphere as Polaris is in the north.'],
  ['Aldebaran',    68.98,  16.51,  0.85,'K5III',  65,  'Taurus',         'The eye of the Bull. A red giant so large our Sun could fit 44 times across its diameter.'],
  ['Antares',     247.35, -26.43,  0.96,'M1.5Iab',550, 'Scorpius',       'The heart of the Scorpion. Name means "rival of Mars" — its red color rivals the planet\'s. A red supergiant.'],
  ['Spica',       201.30, -11.16,  0.97,'B1+B4V', 250, 'Virgo',          'One of the brightest binary systems. Hipparchus used it to discover the precession of the equinoxes in 127 BC.'],
  ['Pollux',      116.33,  28.03,  1.14,'K0III',  34,  'Gemini',         'Has a confirmed exoplanet (Pollux b), making it one of the nearest stars known to host a planet.'],
  ['Fomalhaut',   344.41, -29.62,  1.16,'A3V',    25,  'Piscis Austrinus','Surrounded by a debris disk — one of the first stars photographed with a directly imaged exoplanet candidate.'],
  ['Deneb',       310.36,  45.28,  1.25,'A2Ia',  2600, 'Cygnus',         'One of the most luminous stars visible to the naked eye — intrinsically 200,000× brighter than the Sun.'],
  ['Mimosa',      191.93, -59.69,  1.25,'B0.5III',280, 'Crux',           'The upper arm of the Southern Cross. A blue giant and spectroscopic binary system.'],
  ['Regulus',     152.09,  11.97,  1.36,'B7V',    79,  'Leo',            'The heart of the Lion. Almost massive enough to destroy itself — spinning at 96% of its breakup velocity.'],
  ['Adhara',      104.66, -28.97,  1.50,'B2Ia',  430,  'Canis Major',    'Would be the brightest star in the sky if it were as close as Sirius. Emits massive amounts of UV light.'],
  ['Castor',      113.65,  31.89,  1.57,'A1+A2V',  51, 'Gemini',         'Appears as one star but is actually a system of 6 stars — three binary pairs orbiting each other.'],
  ['Gacrux',      187.79, -57.11,  1.63,'M3.5III', 88, 'Crux',           'Top of the Southern Cross. A red giant — one of the closest red giants to Earth.'],
  ['Bellatrix',    81.28,   6.35,  1.64,'B2III',  250, 'Orion',          'Orion\'s right shoulder. The "Female Warrior." Rapidly rotating — its spectral lines are notably broadened.'],
  ['Elnath',       81.57,  28.61,  1.65,'B7III',  130, 'Taurus',         'Marks the northern tip of Taurus — shared as the foot of Auriga in older star maps.'],
  ['Alnilam',      84.05,  -1.20,  1.70,'B0Ia',  2000, 'Orion',          'The middle star of Orion\'s Belt. A blue supergiant nearly 800,000× more luminous than the Sun.'],
  ['Alioth',      193.51,  55.96,  1.76,'A0p',    81,  'Ursa Major',     'Brightest star in the Big Dipper. The epsilon star of the Great Bear — a chemically peculiar star.'],
  ['Alnitak',      85.19,  -1.94,  1.88,'O9.7Ib',1260, 'Orion',          'The easternmost star of Orion\'s Belt. Illuminates the Horsehead Nebula, one of astronomy\'s most iconic images.'],
  ['Dubhe',       165.93,  61.75,  1.79,'K0III',  124, 'Ursa Major',     'The outer pointer of the Big Dipper\'s bowl — follow the line to find Polaris, the North Star.'],
  ['Mirfak',       51.08,  49.86,  1.80,'F5Ib',   592, 'Perseus',        'The brightest star in Perseus. Center of the Perseus Moving Group — a cluster of stars sharing motion through space.'],
  ['Alkaid',      206.88,  49.31,  1.86,'B3V',    100, 'Ursa Major',     'The handle tip of the Big Dipper. Does NOT share the motion of the other six Dipper stars — a coincidental alignment.'],
  ['Kaus Australis',276.04,-34.38, 1.85,'B9.5III',143, 'Sagittarius',    'Brightest star in Sagittarius. Located at the base of the Teapot asterism — the spout of the cosmic kettle.'],
  ['Atria',       252.17, -69.03,  1.92,'K2II-III',391,'Triangulum Australe','Brightest star in the Southern Triangle. A bright orange giant used in navigation.'],
  ['Alhena',       99.43,  16.40,  1.93,'A0IV',   109, 'Gemini',         'Marks the left foot of Pollux in Gemini. The star has a faint companion and is a slightly variable giant.'],
  ['Peacock',     306.41, -56.74,  1.94,'B2IV',   183, 'Pavo',           'The brightest star in Pavo (the Peacock). One of several stars formally named after its constellation\'s creature.'],
  ['Mirzam',       95.67, -17.96,  1.98,'B1II-III',500,'Canis Major',    '"The announcer" — rises just before Sirius, heralding its appearance. A Beta Cephei-type variable.'],
  ['Alphard',     141.90,  -8.66,  1.99,'K3II',   177, 'Hydra',          '"The lonely one of the serpent" — the brightest star in the largest constellation with no nearby bright neighbors.'],
  ['Hamal',        31.79,  23.46,  2.01,'K2III',   66, 'Aries',          'The brightest star in Aries, the Ram. Marked the vernal equinox around 2000 BC — the "First Point of Aries."'],
  ['Polaris',      37.95,  89.26,  1.97,'F7Ib',   433, 'Ursa Minor',     'The North Star. Sits within ~1° of the celestial north pole. Has been the navigator\'s star for centuries.'],
  ['Diphda',       10.90, -17.99,  2.04,'K0III',   96, 'Cetus',          'The brightest star in Cetus (the Whale). Sometimes called Deneb Kaitos — the tail of the sea monster.'],
  ['Nunki',       283.82, -26.30,  2.05,'B2.5V',  224, 'Sagittarius',    'The second brightest star in Sagittarius. Its ancient Babylonian name means "the star of the proclamation of the sea."'],
  ['Schedar',      10.13,  56.54,  2.24,'K0IIIa', 228, 'Cassiopeia',     'The brightest star in Cassiopeia\'s W. An orange giant named from the Arabic for "the breast."'],
  ['Denebola',    177.26,  14.57,  2.14,'A3V',     36, 'Leo',            'The tail of the Lion. One of three stars in the Spring Triangle. Slightly variable and surrounded by a debris disk.'],
  ['Naos',        120.90, -40.00,  2.25,'O4If',  1080, 'Puppis',         'One of the hottest and most luminous naked-eye stars. Emits powerful stellar winds that sculpt surrounding nebulae.'],
  ['Saiph',        86.94,  -9.67,  2.07,'B0.5Ia', 720, 'Orion',          'Orion\'s right knee. Similar in size to Rigel but much closer, making it dimmer. Will also explode as a supernova.'],
  ['Mintaka',      83.00,  -0.30,  2.23,'O9.5+B0',900, 'Orion',          'The westernmost star of Orion\'s Belt. One of the few stars that lies almost exactly on the celestial equator.'],
  ['Almach',       30.97,  42.33,  2.10,'K3+A0V', 355, 'Andromeda',      'A stunning double star system — contrasting orange and blue-green stars, one of the sky\'s finest color pairs.'],
  ['Menkent',     211.67, -36.37,  2.06,'K0III',   61, 'Centaurus',      'The shoulder of the Centaur. One of the bright pointer stars of the southern sky.'],
  ['Caph',          2.29,  59.15,  2.27,'F2III',   54, 'Cassiopeia',     'One of the points of Cassiopeia\'s W. The first star to be spectroscopically studied in the 19th century.'],
  ['Alpheratz',     2.10,  29.09,  2.06,'B9p+A3V',97, 'Andromeda',      'The top-left corner of the Great Square of Pegasus AND the head of Andromeda — shared by two constellations.'],
  ['Rasalhague',  263.73,  12.56,  2.08,'A5III',   47, 'Ophiuchus',      'The head of the Serpent Bearer. One of the "13th zodiac constellation" stars — the Sun passes through Ophiuchus each year.'],
  ['Algieba',     154.99,  19.84,  2.61,'K1+G7III',126,'Leo',            'A beautiful binary — two golden giant stars orbiting each other. One of the finest double stars for small telescopes.'],
  ['Enif',        326.05,   9.88,  2.38,'K2Ib',   690, 'Pegasus',        'The nose of the flying horse Pegasus. A yellow-orange supergiant with notable brightness variations.'],
  ['Gienah',      183.79, -17.54,  2.59,'B8III',  165, 'Corvus',         'The right wing of the Crow. One of four bright stars forming the distinctive quadrilateral of Corvus.'],
  ['Zubenelgenubi',222.68,-16.04,  2.75,'A3IV',   77, 'Libra',           '"The southern claw of the Scorpion" — before Libra was a separate constellation, these were the Scorpion\'s claws.'],
  ['Alphecca',    233.67,  26.71,  2.22,'A0V',     75, 'Corona Borealis', 'The gem in the Crown. A spectroscopic binary embedded in a disk of gas and dust.'],
  ['Sabik',       258.04, -15.72,  2.43,'A2+A3V', 84, 'Ophiuchus',      'The second brightest star in Ophiuchus. A close binary system barely distinguishable by large telescopes.'],
  ['Phecda',      178.46,  53.70,  2.44,'A0Ve',    84, 'Ursa Major',     'One of the five stars of the Big Dipper that form a true moving cluster, drifting together through the galaxy.'],
  ['Kochab',      222.68,  74.16,  2.08,'K4III',  130, 'Ursa Minor',     'The brighter of the two "Guardians of the Pole." Was the North Star from 1500 BC to 500 AD.'],
  ['Zubeneschamali',229.25,-9.38,  2.61,'B8V',    160, 'Libra',          'The only star with a distinctly greenish hue visible to the naked eye. "The northern claw of the Scorpion."'],
  ['Ankaa',        6.57,  -42.31,  2.40,'K0III',   77, 'Phoenix',        'The brightest star in Phoenix. Named for the mythical bird of renewal. A double star system.'],
  ['Graffias',    241.36, -19.81,  2.62,'B1IV',  530, 'Scorpius',        'The head of the Scorpion. A beautiful optical triple star system — three stars at very different distances.'],
];

// Stick-figure paths in celestial coordinates [ra_deg, dec_deg]
export const CONSTELLATIONS = [
  { name:'Orion', ra:83.8, dec:3.0, paths:[
    [[78.63,-8.20],[83.00,-0.30],[84.05,-1.20],[85.19,-1.94],[86.94,-9.67]], // Rigel→belt→Saiph
    [[83.00,-0.30],[81.28,6.35],[88.79,7.41],[85.19,-1.94]],                  // Mintaka→Bellatrix→Betelgeuse→Alnitak
  ]},
  { name:'Ursa Major', ra:183.0, dec:57.0, paths:[
    [[165.93,61.75],[165.46,56.38],[178.46,53.70],[183.86,57.03],[165.93,61.75]], // bowl: Dubhe·Merak·Phecda·Megrez
    [[183.86,57.03],[193.51,55.96],[200.98,54.93],[206.88,49.31]],                // handle: Megrez·Alioth·Mizar·Alkaid
  ]},
  { name:'Cassiopeia', ra:14.0, dec:61.0, paths:[
    [[2.29,59.15],[10.13,56.54],[14.18,60.72],[21.45,60.24],[28.60,63.67]], // Caph·Schedar·γ·Ruchbah·Segin
  ]},
  { name:'Crux', ra:187.5, dec:-60.5, paths:[
    [[187.79,-57.11],[186.65,-63.10]],  // Gacrux → Acrux (vertical)
    [[183.79,-58.75],[191.93,-59.69]],  // δ Cru → Mimosa (horizontal)
  ]},
  { name:'Leo', ra:158.0, dec:17.0, paths:[
    [[146.46,23.77],[149.08,26.01],[154.17,23.42],[154.99,19.84],[153.43,16.76],[152.09,11.97],[146.46,23.77]], // sickle
    [[152.09,11.97],[168.53,20.52],[169.62,15.43],[177.26,14.57]], // body: Regulus→Zosma→Chertan→Denebola
  ]},
  { name:'Scorpius', ra:249.0, dec:-30.0, paths:[
    [[241.36,-19.81],[240.08,-22.62],[247.35,-26.43]], // head: Graffias→Dschubba→Antares
    [[247.35,-26.43],[250.32,-28.22],[252.54,-34.29],[253.08,-38.05],[264.33,-43.00],[263.40,-37.10],[266.90,-37.30]], // tail
  ]},
  { name:'Gemini', ra:107.0, dec:25.0, paths:[
    [[113.65,31.89],[116.33,28.03]],               // Castor–Pollux heads
    [[113.65,31.89],[99.49,22.51],[99.43,16.40]],  // Castor column → Alhena
    [[116.33,28.03],[95.74,22.51],[99.43,16.40]],  // Pollux column → Alhena
  ]},
  { name:'Taurus', ra:71.0, dec:19.0, paths:[
    [[67.16,19.18],[68.98,16.51],[66.14,15.87],[65.65,15.63],[65.88,17.54],[67.16,19.18]], // Hyades V
    [[68.98,16.51],[81.57,28.61]],  // Aldebaran → Elnath
    [[81.57,28.61],[84.41,21.14]],  // Elnath → ζ Tau horn
  ]},
  { name:'Cygnus', ra:305.0, dec:40.0, paths:[
    [[310.36,45.28],[305.56,40.26],[292.68,27.96]], // Deneb → γ Cyg → Albireo (vertical)
    [[296.24,45.13],[305.56,40.26],[318.23,36.90]], // δ Cyg → γ Cyg → ζ Cyg (crossbar)
  ]},
  { name:'Lyra', ra:282.0, dec:36.5, paths:[
    [[279.23,38.78],[280.99,37.61],[283.42,33.36],[284.74,32.69],[282.52,36.90],[280.99,37.61]], // Vega + parallelogram
  ]},
  { name:'Aquila', ra:297.0, dec:8.0, paths:[
    [[286.35,13.86],[296.60,10.61],[297.70,8.87],[298.83,6.41]], // λ Aql→Tarazed→Altair→β Aql
    [[296.60,10.61],[304.31,3.11]], // Tarazed → δ Aql wing
  ]},
  { name:'Sagittarius', ra:279.0, dec:-28.0, paths:[
    [[276.04,-34.38],[275.25,-29.83],[279.96,-26.99],[283.82,-26.30]], // Kaus Australis → Nunki (spout→handle)
    [[283.82,-26.30],[280.65,-30.42],[276.04,-34.38]], // back of teapot
    [[275.25,-29.83],[279.96,-26.99]], // cross piece
  ]},
  { name:'Perseus', ra:52.0, dec:43.0, paths:[
    [[51.08,49.86],[46.21,40.01],[48.04,33.97],[56.88,40.97],[51.08,49.86]], // Mirfak loop through Algol
  ]},
  { name:'Boötes', ra:216.0, dec:28.0, paths:[
    [[213.91,19.18],[219.83,26.31],[225.49,33.32],[217.04,36.49],[209.06,38.30],[213.91,19.18]], // kite: Arcturus base
    [[209.06,38.30],[217.04,36.49]], // top edge
  ]},
  { name:'Virgo', ra:199.0, dec:-1.0, paths:[
    [[201.30,-11.16],[199.73,-0.60],[192.66,6.00]], // Spica up through body
    [[199.73,-0.60],[213.22,10.96]], // arm right toward Vindemiatrix
  ]},
];

export const CONSTELLATION_DATA = {
  'Orion': {
    area:'594 sq°', hemisphere:'Both', season:'Dec–Feb',
    stars:'Rigel (blue supergiant, ~100,000× solar luminosity), Betelgeuse (red supergiant, ~700 solar radii), Belt: Mintaka · Alnilam · Alnitak',
    note:'The Hunter. Three-star belt has guided navigators across every civilization for 30,000+ years. Betelgeuse (upper left) is expected to go supernova within 100,000 years — briefly visible in daylight. Rigel (lower right) is one of the most luminous stars visible to the naked eye.'
  },
  'Ursa Major': {
    area:'1280 sq°', hemisphere:'Northern', season:'Year-round',
    stars:'Dubhe & Merak (pointer stars to Polaris), Alioth (brightest), Mizar (showpiece visual double)',
    note:'The Great Bear. The Big Dipper asterism never sets from most northern latitudes. Five of the seven dipper stars form the Ursa Major Moving Group — a cluster of stars physically drifting through the galaxy together. Alkaid, at the handle tip, is an unrelated interloper traveling a different path.'
  },
  'Cassiopeia': {
    area:'598 sq°', hemisphere:'Northern', season:'Year-round',
    stars:'Schedar (orange giant α), Caph (β), γ Cas (variable erupting Be star), Ruchbah (δ)',
    note:'The Queen, chained to her throne as punishment for vanity. The W shape is circumpolar from most of the northern hemisphere — never sets. Tycho Brahe observed a supernova here in 1572 bright enough to see in daylight. Cassiopeia A is now one of the strongest radio sources in the sky.'
  },
  'Crux': {
    area:'68 sq°', hemisphere:'Southern', season:'Apr–May',
    stars:'Acrux (α, southern tip, blue double), Mimosa (β, upper left, blue giant), Gacrux (γ, top, red giant)',
    note:'The Southern Cross — smallest constellation by area, most instantly recognized in the southern hemisphere. Acrux points toward the south celestial pole and has served navigation for millennia. The Coalsack Nebula beside it is one of the most prominent dark nebulae visible to the naked eye.'
  },
  'Leo': {
    area:'947 sq°', hemisphere:'Both', season:'Mar–May',
    stars:'Regulus (heart, spins near breakup speed, ~4× solar radius), Denebola (tail), Algieba (golden visual double)',
    note:'The Lion. The Sickle asterism traces the lion\'s head and mane — a backward question mark ending at Regulus. Regulus is so oblate from its rapid spin that its equatorial diameter is 32% wider than pole-to-pole. The Leonid meteor shower radiates from this constellation every November.'
  },
  'Scorpius': {
    area:'497 sq°', hemisphere:'Southern', season:'Jun–Jul',
    stars:'Antares (red supergiant, "rival of Mars", ~700 solar radii), Graffias (triple star head), Shaula · Lesath (stinger)',
    note:'The Scorpion of Greek myth, sent to kill Orion — which is why they never share the sky simultaneously. Antares would swallow Mars\'s orbit if placed at our Sun\'s position. The S-curved tail ends in the stinger Shaula, one of the sky\'s brightest stars. The galactic center lies just to the north.'
  },
  'Gemini': {
    area:'514 sq°', hemisphere:'Northern', season:'Jan–Feb',
    stars:'Castor (6-star system — 3 spectroscopic binaries orbiting each other), Pollux (brightest, has confirmed exoplanet)',
    note:'The Twins of Greek myth — Castor mortal, Pollux divine, both sons of Zeus. Though visually similar, Pollux at 34 light-years is half the distance of Castor at 51. Castor is actually a sextuple star system. The Geminid meteor shower, one of the year\'s finest, radiates from here every December.'
  },
  'Taurus': {
    area:'797 sq°', hemisphere:'Northern', season:'Nov–Jan',
    stars:'Aldebaran (red giant eye, 65× solar diameter), Elnath (shared tip with Auriga), Pleiades cluster (Seven Sisters)',
    note:'The Bull. The V-shaped Hyades cluster marks the bull\'s face — the nearest open cluster to Earth. The Pleiades (M45) rest on its shoulder and appear in cultures from Aboriginal Australian astronomy to pre-Columbian Mesoamerican calendars. Aldebaran follows the Pleiades across the sky, giving it its name: "the follower."'
  },
  'Cygnus': {
    area:'804 sq°', hemisphere:'Northern', season:'Aug–Sep',
    stars:'Deneb (one of the most luminous stars known, ~200,000× solar), Albireo (stunning color-contrast double), γ Cygni',
    note:'The Swan, flying south along the Milky Way. Deneb is the most intrinsically luminous star in the Summer Triangle — it appears moderate only because it\'s ~2,600 light-years away. Together with Vega (Lyra) and Altair (Aquila), it forms the Summer Triangle asterism that dominates summer nights.'
  },
  'Lyra': {
    area:'286 sq°', hemisphere:'Northern', season:'Jul–Aug',
    stars:'Vega (3rd brightest overall, 25 ly, touched by the Voyager trajectory), ε Lyrae (the "Double Double"), Ring Nebula (M57)',
    note:'The Lyre of Orpheus, dropped into the sky upon his death. Vega was the north pole star 14,000 years ago and will be again in ~13,700 years due to axial precession. The Ring Nebula between β and γ Lyrae is one of the finest planetary nebulae in the sky, visible in small telescopes.'
  },
  'Aquila': {
    area:'652 sq°', hemisphere:'Both', season:'Aug–Sep',
    stars:'Altair (one of the closest bright stars at 17 ly, spins once per 9 hours, visibly oblate), Tarazed (orange giant)',
    note:'The Eagle of Zeus, which carried thunderbolts. Altair is one of the nearest bright stars and spins so fast (once per 9 hours vs. our Sun\'s 25 days) that it is 20% wider at the equator than pole-to-pole. With Deneb and Vega it forms the Summer Triangle visible from June through October.'
  },
  'Sagittarius': {
    area:'867 sq°', hemisphere:'Southern', season:'Jul–Aug',
    stars:'Kaus Australis (brightest, ε Sgr), Nunki (σ, blue-white giant), Teapot asterism (8 stars)',
    note:'The Archer — though the Teapot is the better asterism. Looking toward Sagittarius is looking toward the galactic center. Sagittarius A*, the Milky Way\'s supermassive black hole (4 million solar masses), lies in this direction. More Messier objects crowd this constellation than any other — trifid nebula, lagoon nebula, many globular clusters.'
  },
  'Perseus': {
    area:'615 sq°', hemisphere:'Northern', season:'Oct–Dec',
    stars:'Mirfak (α, brightest, yellow-white supergiant, cluster centerpiece), Algol (β, the Demon Star)',
    note:'The Hero who slew Medusa. Algol (β Persei) was the first eclipsing binary identified — its brightness dips predictably every 2.87 days as a dimmer companion transits in front. Arabic astronomers noticed the wink and named it "Ras al Ghul" (head of the demon). The Perseus Moving Group physically surrounds Mirfak.'
  },
  'Boötes': {
    area:'907 sq°', hemisphere:'Northern', season:'May–Jun',
    stars:'Arcturus (4th brightest star, 37 ly, moving toward Virgo at 122 km/s), Izar (showpiece colored double), Nekkar',
    note:'The Herdsman, driving Ursa Major around the pole. Arcturus was the first star observed in daylight through a telescope (1635). Its 1933 light was used to trigger the opening of the Chicago World\'s Fair. Arcturus moves remarkably fast relative to the solar neighborhood — in ~500,000 years it will have passed below the horizon for most northern observers.'
  },
  'Virgo': {
    area:'1294 sq°', hemisphere:'Both', season:'Apr–May',
    stars:'Spica (1st magnitude, blue-white binary, discovery key for Earth\'s axial precession), Porrima (equal double), Vindemiatrix',
    note:'The Maiden — associated with Demeter (harvest) and Dike (justice). Hipparchus used Spica to discover Earth\'s axial precession in 127 BC by comparing observations 150 years apart. The Virgo Cluster — the nearest galaxy supercluster (~1,300 galaxies including M87 with its famous black hole jet) — dominates this region of sky.'
  }
};

export const PLUTO_GENS = {
  'Virgo':    {years:'1957–1972', text:'The reform generation. Came of age critiquing institutions from the inside. Gave the world the personal computer, second-wave feminism, and the idea that systems could be rebuilt — if you worked hard enough.'},
  'Libra':    {years:'1971–1984', text:'The balance generation. Raised during divorce reform and dual-income households. Deeply preoccupied with fairness, aesthetics, and relationships — and quietly devastated when those things fail.'},
  'Scorpio':  {years:'1983–1995', text:'The intensity generation. AIDS crisis, grunge, rave, the internet\'s ugly dawn. Collectively unafraid of darkness, obsessed with authenticity, and congenitally suspicious of anything that looks too clean. Came for the truth.'},
  'Sagittarius':{years:'1995–2008',text:'The globalization generation. Born into the internet and watched every border blur. Questions every authority with a browser open. Optimistic in theory, exhausted in practice.'},
  'Capricorn':{years:'2008–2024', text:'The structure generation. Born during the financial crash. Will inherit — and likely dismantle — the institutions their parents built. Grimly practical. Has always known the system is broken.'},
  'Aquarius': {years:'2024–2044', text:'The network generation. AI, collective intelligence, and radical democratization of power will define their world before they\'re old enough to vote. Already arriving.'},
};

export const PLANET_GLYPHS = {Sun:'☉',Moon:'☽',Mercury:'☿',Venus:'♀',Mars:'♂',Jupiter:'♃',Saturn:'♄',Uranus:'♅',Neptune:'♆',Pluto:'♇'};
