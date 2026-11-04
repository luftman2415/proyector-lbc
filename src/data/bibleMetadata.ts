export interface BibleBookMeta {
  id: string;
  nombre: string;
  archivo: string;
  testamento: 'antiguo' | 'nuevo';
  capitulos: number;
}

export const LIBROS_BIBLIA_COMPLETOS: BibleBookMeta[] = [
  // Antiguo Testamento (39 libros)
  { id: 'gen', nombre: 'Génesis', archivo: 'genesis.json', testamento: 'antiguo', capitulos: 50 },
  { id: 'exo', nombre: 'Éxodo', archivo: 'exodus.json', testamento: 'antiguo', capitulos: 40 },
  { id: 'lev', nombre: 'Levítico', archivo: 'leviticus.json', testamento: 'antiguo', capitulos: 27 },
  { id: 'num', nombre: 'Números', archivo: 'numbers.json', testamento: 'antiguo', capitulos: 36 },
  { id: 'deu', nombre: 'Deuteronomio', archivo: 'deuteronomy.json', testamento: 'antiguo', capitulos: 34 },
  { id: 'jos', nombre: 'Josué', archivo: 'joshua.json', testamento: 'antiguo', capitulos: 24 },
  { id: 'jue', nombre: 'Jueces', archivo: 'judges.json', testamento: 'antiguo', capitulos: 21 },
  { id: 'rut', nombre: 'Rut', archivo: 'ruth.json', testamento: 'antiguo', capitulos: 4 },
  { id: '1sa', nombre: '1 Samuel', archivo: '1samuel.json', testamento: 'antiguo', capitulos: 31 },
  { id: '2sa', nombre: '2 Samuel', archivo: '2samuel.json', testamento: 'antiguo', capitulos: 24 },
  { id: '1re', nombre: '1 Reyes', archivo: '1kings.json', testamento: 'antiguo', capitulos: 22 },
  { id: '2re', nombre: '2 Reyes', archivo: '2kings.json', testamento: 'antiguo', capitulos: 25 },
  { id: '1cr', nombre: '1 Crónicas', archivo: '1chronicles.json', testamento: 'antiguo', capitulos: 29 },
  { id: '2cr', nombre: '2 Crónicas', archivo: '2chronicles.json', testamento: 'antiguo', capitulos: 36 },
  { id: 'esd', nombre: 'Esdras', archivo: 'ezra.json', testamento: 'antiguo', capitulos: 10 },
  { id: 'neh', nombre: 'Nehemías', archivo: 'nehemiah.json', testamento: 'antiguo', capitulos: 13 },
  { id: 'est', nombre: 'Ester', archivo: 'esther.json', testamento: 'antiguo', capitulos: 10 },
  { id: 'job', nombre: 'Job', archivo: 'job.json', testamento: 'antiguo', capitulos: 42 },
  { id: 'sal', nombre: 'Salmos', archivo: 'psalms.json', testamento: 'antiguo', capitulos: 150 },
  { id: 'pro', nombre: 'Proverbios', archivo: 'proverbs.json', testamento: 'antiguo', capitulos: 31 },
  { id: 'ecl', nombre: 'Eclesiastés', archivo: 'ecclesiastes.json', testamento: 'antiguo', capitulos: 12 },
  { id: 'cnt', nombre: 'Cantares', archivo: 'songofsolomon.json', testamento: 'antiguo', capitulos: 8 },
  { id: 'isa', nombre: 'Isaías', archivo: 'isaiah.json', testamento: 'antiguo', capitulos: 66 },
  { id: 'jer', nombre: 'Jeremías', archivo: 'jeremiah.json', testamento: 'antiguo', capitulos: 52 },
  { id: 'lam', nombre: 'Lamentaciones', archivo: 'lamentations.json', testamento: 'antiguo', capitulos: 5 },
  { id: 'eze', nombre: 'Ezequiel', archivo: 'ezekiel.json', testamento: 'antiguo', capitulos: 48 },
  { id: 'dan', nombre: 'Daniel', archivo: 'daniel.json', testamento: 'antiguo', capitulos: 12 },
  { id: 'ose', nombre: 'Oseas', archivo: 'hosea.json', testamento: 'antiguo', capitulos: 14 },
  { id: 'joe', nombre: 'Joel', archivo: 'joel.json', testamento: 'antiguo', capitulos: 3 },
  { id: 'amo', nombre: 'Amós', archivo: 'amos.json', testamento: 'antiguo', capitulos: 9 },
  { id: 'abd', nombre: 'Abdías', archivo: 'obadiah.json', testamento: 'antiguo', capitulos: 1 },
  { id: 'jon', nombre: 'Jonás', archivo: 'jonah.json', testamento: 'antiguo', capitulos: 4 },
  { id: 'miq', nombre: 'Miqueas', archivo: 'micah.json', testamento: 'antiguo', capitulos: 7 },
  { id: 'nah', nombre: 'Nahúm', archivo: 'nahum.json', testamento: 'antiguo', capitulos: 3 },
  { id: 'hab', nombre: 'Habacuc', archivo: 'habakkuk.json', testamento: 'antiguo', capitulos: 3 },
  { id: 'sof', nombre: 'Sofonías', archivo: 'zephaniah.json', testamento: 'antiguo', capitulos: 3 },
  { id: 'hag', nombre: 'Hageo', archivo: 'haggai.json', testamento: 'antiguo', capitulos: 2 },
  { id: 'zac', nombre: 'Zacarías', archivo: 'zechariah.json', testamento: 'antiguo', capitulos: 14 },
  { id: 'mal', nombre: 'Malaquías', archivo: 'malachi.json', testamento: 'antiguo', capitulos: 4 },

  // Nuevo Testamento (27 libros)
  { id: 'mat', nombre: 'Mateo', archivo: 'matthew.json', testamento: 'nuevo', capitulos: 28 },
  { id: 'mar', nombre: 'Marcos', archivo: 'mark.json', testamento: 'nuevo', capitulos: 16 },
  { id: 'luc', nombre: 'Lucas', archivo: 'luke.json', testamento: 'nuevo', capitulos: 24 },
  { id: 'jua', nombre: 'Juan', archivo: 'john.json', testamento: 'nuevo', capitulos: 21 },
  { id: 'hch', nombre: 'Hechos', archivo: 'acts.json', testamento: 'nuevo', capitulos: 28 },
  { id: 'rom', nombre: 'Romanos', archivo: 'romans.json', testamento: 'nuevo', capitulos: 16 },
  { id: '1co', nombre: '1 Corintios', archivo: '1corinthians.json', testamento: 'nuevo', capitulos: 16 },
  { id: '2co', nombre: '2 Corintios', archivo: '2corinthians.json', testamento: 'nuevo', capitulos: 13 },
  { id: 'gal', nombre: 'Gálatas', archivo: 'galatians.json', testamento: 'nuevo', capitulos: 6 },
  { id: 'efe', nombre: 'Efesios', archivo: 'ephesians.json', testamento: 'nuevo', capitulos: 6 },
  { id: 'fil', nombre: 'Filipenses', archivo: 'philippians.json', testamento: 'nuevo', capitulos: 4 },
  { id: 'col', nombre: 'Colosenses', archivo: 'colossians.json', testamento: 'nuevo', capitulos: 4 },
  { id: '1ts', nombre: '1 Tesalonicenses', archivo: '1thessalonians.json', testamento: 'nuevo', capitulos: 5 },
  { id: '2ts', nombre: '2 Tesalonicenses', archivo: '2thessalonians.json', testamento: 'nuevo', capitulos: 3 },
  { id: '1ti', nombre: '1 Timoteo', archivo: '1timothy.json', testamento: 'nuevo', capitulos: 6 },
  { id: '2ti', nombre: '2 Timoteo', archivo: '2timothy.json', testamento: 'nuevo', capitulos: 4 },
  { id: 'tit', nombre: 'Tito', archivo: 'titus.json', testamento: 'nuevo', capitulos: 3 },
  { id: 'flm', nombre: 'Filemón', archivo: 'philemon.json', testamento: 'nuevo', capitulos: 1 },
  { id: 'heb', nombre: 'Hebreos', archivo: 'hebrews.json', testamento: 'nuevo', capitulos: 13 },
  { id: 'stg', nombre: 'Santiago', archivo: 'james.json', testamento: 'nuevo', capitulos: 5 },
  { id: '1pe', nombre: '1 Pedro', archivo: '1peter.json', testamento: 'nuevo', capitulos: 5 },
  { id: '2pe', nombre: '2 Pedro', archivo: '2peter.json', testamento: 'nuevo', capitulos: 3 },
  { id: '1jn', nombre: '1 Juan', archivo: '1john.json', testamento: 'nuevo', capitulos: 5 },
  { id: '2jn', nombre: '2 Juan', archivo: '2john.json', testamento: 'nuevo', capitulos: 1 },
  { id: '3jn', nombre: '3 Juan', archivo: '3john.json', testamento: 'nuevo', capitulos: 1 },
  { id: 'jud', nombre: 'Judas', archivo: 'jude.json', testamento: 'nuevo', capitulos: 1 },
  { id: 'apo', nombre: 'Apocalipsis', archivo: 'revelation.json', testamento: 'nuevo', capitulos: 22 }
];

export const VERSIONES_BIBLIA = [
  { codigo: 'rv1960', nombre: 'Reina Valera 1960' },
  { codigo: 'nvi', nombre: 'Nueva Versión Internacional' },
  { codigo: 'ntv', nombre: 'Nueva Traducción Viviente' },
  { codigo: 'lbla', nombre: 'La Biblia de las Américas' },
  { codigo: 'dhh', nombre: 'Dios Habla Hoy' },
  { codigo: 'tla', nombre: 'Traducción en Lenguaje Actual' }
];
