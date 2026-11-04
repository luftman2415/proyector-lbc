import { Song } from '../types';

export const INITIAL_FEATURED_SONGS: Song[] = [
  {
    id: "hymn-1",
    numero: 1,
    title: "Cuán Grande Es Él",
    author: "Carl Boberg / Stuart K. Hine",
    key: "A",
    tempo: 72,
    tags: ["Himno Clásico", "Adoración"],
    sections: [
      {
        type: "verse",
        label: "Estrofa 1",
        color: "#38bdf8",
        lines: [
          "Señor, mi Dios, al contemplar los cielos,",
          "El firmamento y las estrellas mil,",
          "Al oír tu voz en los potentes truenos",
          "Y ver brillar el sol en su cenit."
        ]
      },
      {
        type: "chorus",
        label: "Coro",
        color: "#facc15",
        lines: [
          "Mi corazón entona la canción:",
          "¡Cuán grande es Él! ¡Cuán grande es Él!",
          "Mi corazón entona la canción:",
          "¡Cuán grande es Él! ¡Cuán grande es Él!"
        ]
      },
      {
        type: "verse",
        label: "Estrofa 2",
        color: "#38bdf8",
        lines: [
          "Al recorrer los montes y los valles",
          "Y ver las bellas flores al pasar,",
          "Al escuchar el canto de las aves",
          "Y el murmurar del claro manantial."
        ]
      },
      {
        type: "verse",
        label: "Estrofa 3",
        color: "#38bdf8",
        lines: [
          "Cuando recuerdo del amor divino,",
          "Que desde el cielo al Salvador envió,",
          "Aquel Jesús que por salvarme vino",
          "Y en una cruz por mí murió."
        ]
      }
    ]
  },
  {
    id: "hymn-2",
    numero: 2,
    title: "Tu Fidelidad",
    author: "Marcos Witt",
    key: "D",
    tempo: 68,
    tags: ["Adoración", "Comunión"],
    sections: [
      {
        type: "verse",
        label: "Estrofa 1",
        color: "#38bdf8",
        lines: [
          "Tu fidelidad es grande,",
          "Tu fidelidad incomparable es,",
          "Nadie como Tú, bendito Dios,",
          "Grande es tu fidelidad."
        ]
      },
      {
        type: "chorus",
        label: "Coro",
        color: "#facc15",
        lines: [
          "Tu fidelidad es grande,",
          "Tu fidelidad incomparable es,",
          "Nadie como Tú, bendito Dios,",
          "Grande es tu fidelidad."
        ]
      }
    ]
  },
  {
    id: "hymn-3",
    numero: 3,
    title: "La Bondad de Dios",
    author: "Bethel Music / Jenn Johnson",
    key: "G",
    tempo: 70,
    tags: ["Contemporánea", "Gratitud"],
    sections: [
      {
        type: "verse",
        label: "Estrofa 1",
        color: "#38bdf8",
        lines: [
          "Te amo, Dios, tu gracia nunca falla,",
          "En tus manos todos mis días están.",
          "Desde el despertar hasta el anochecer",
          "Yo cantaré de la bondad de Dios."
        ]
      },
      {
        type: "chorus",
        label: "Coro",
        color: "#facc15",
        lines: [
          "En mi vida has sido bueno,",
          "En mi vida has sido tan, tan fiel.",
          "Con cada aliento que me das",
          "Yo cantaré de la bondad de Dios."
        ]
      },
      {
        type: "bridge",
        label: "Puente",
        color: "#c084fc",
        lines: [
          "Tu bondad me sigue, me sigue a donde voy,",
          "Tu bondad me sigue, me sigue a donde voy.",
          "Mi vida te entrego, me rindo ante Ti,",
          "Tu bondad me sigue, me sigue a donde voy."
        ]
      }
    ]
  },
  {
    id: "hymn-4",
    numero: 4,
    title: "Alaba a Dios",
    author: "Danny Berríos",
    key: "Em",
    tempo: 85,
    tags: ["Alabanza", "Fe"],
    sections: [
      {
        type: "verse",
        label: "Estrofa 1",
        color: "#38bdf8",
        lines: [
          "Dios no rechaza oración, la oración es alimento.",
          "Nunca vi un justo desamparado, ni su descendencia mendigar pan.",
          "Si estás pasando por pruebas, levanta tus manos y adora."
        ]
      },
      {
        type: "chorus",
        label: "Coro",
        color: "#facc15",
        lines: [
          "Alaba a Dios, alaba a Dios,",
          "Si lloras, alaba; si sufres, alaba.",
          "Tu alabanza moverá la mano de Dios,",
          "Alaba a Dios, alaba a Dios."
        ]
      }
    ]
  },
  {
    id: "hymn-5",
    numero: 5,
    title: "No Hay Lugar Más Alto",
    author: "Miel San Marcos ft. Christine D'Clario",
    key: "A",
    tempo: 68,
    tags: ["Adoración Profunda"],
    sections: [
      {
        type: "verse",
        label: "Estrofa",
        color: "#38bdf8",
        lines: [
          "A tus pies arde mi corazón,",
          "A tus pies entrego lo que soy.",
          "Es el lugar de mi seguridad,",
          "Donde nadie me puede señalar."
        ]
      },
      {
        type: "pre-chorus",
        label: "Pre-Coro",
        color: "#34d399",
        lines: [
          "Me perdonaste, me acercaste a tu presencia,",
          "Me levantaste, hoy me postro a adorarte."
        ]
      },
      {
        type: "chorus",
        label: "Coro",
        color: "#facc15",
        lines: [
          "No hay lugar más alto, más grande,",
          "Que estar a tus pies, que estar a tus pies.",
          "Y aquí permaneceré, postrado a tus pies."
        ]
      }
    ]
  },
  {
    id: "hymn-6",
    numero: 6,
    title: "Renuévame",
    author: "Marcos Witt",
    key: "D",
    tempo: 66,
    tags: ["Consagración", "Comunión"],
    sections: [
      {
        type: "verse",
        label: "Estrofa",
        color: "#38bdf8",
        lines: [
          "Renuévame, Señor Jesús,",
          "Ya no quiero ser igual.",
          "Renuévame, Señor Jesús,",
          "Pon en mí tu corazón."
        ]
      },
      {
        type: "chorus",
        label: "Coro",
        color: "#facc15",
        lines: [
          "Porque todo lo que hay dentro de mí",
          "Necesita ser cambiado, Señor.",
          "Porque todo lo que hay dentro de mi corazón",
          "Necesita más de Ti."
        ]
      }
    ]
  },
  {
    id: "hymn-7",
    numero: 7,
    title: "Digno y Santo",
    author: "Kari Jobe / Gateway",
    key: "C",
    tempo: 68,
    tags: ["Adoración Celestial"],
    sections: [
      {
        type: "verse",
        label: "Estrofa 1",
        color: "#38bdf8",
        lines: [
          "Digno es el Cordero santo,",
          "Santo, santo es Él.",
          "Levantamos nuestra voz en alabanza,",
          "Al que en el trono está."
        ]
      },
      {
        type: "chorus",
        label: "Coro",
        color: "#facc15",
        lines: [
          "Santo, santo, santo es el Señor Dios Todopoderoso,",
          "Quien fue, quien es y quien vendrá.",
          "La creación te canta, gloria al Rey de reyes,",
          "Tú eres mi todo y yo te adoraré."
        ]
      }
    ]
  },
  {
    id: "hymn-8",
    numero: 8,
    title: "Gracia Sublime Es",
    author: "Phil Wickham",
    key: "B",
    tempo: 102,
    tags: ["Alabanza Poderosa"],
    sections: [
      {
        type: "verse",
        label: "Estrofa 1",
        color: "#38bdf8",
        lines: [
          "¿Quién rompe el poder del pecado y la maldad?",
          "Su amor es fuerte y poderoso.",
          "El Rey de gloria, el Rey de majestad."
        ]
      },
      {
        type: "chorus",
        label: "Coro",
        color: "#facc15",
        lines: [
          "Gracia sublime es, perfecto es tu amor.",
          "Tomaste mi lugar, cargaste con mi cruz.",
          "Tu vida diste allí, libre soy por Ti.",
          "Jesús, te adoro por lo que hiciste en mí."
        ]
      }
    ]
  }
];
