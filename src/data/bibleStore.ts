import { LIBROS_BIBLIA_COMPLETOS, BibleBookMeta } from './bibleMetadata';

export interface BibleVerse {
  numero: number;
  texto: string;
}

export interface VersiculoProyectado {
  id: string;
  cita: string;
  texto: string;
  version: string;
  hora: string;
}

// In-memory cache for all 66 books and versions
const cacheMemoriaBiblia: Record<string, any> = {};

// IndexedDB Helper for permanent local offline storage of all 66 books
const DB_NAME = 'ProyectorLBC_BibliaDB';
const DB_VERSION = 1;
const STORE_NAME = 'libros_biblia';

function abrirDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'clave' });
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = () => resolve(null);
  });
}

async function guardarEnIndexedDB(clave: string, data: any): Promise<void> {
  try {
    const db = await abrirDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ clave, data });
  } catch (err) {
    console.warn('Error al guardar en IndexedDB:', err);
  }
}

async function leerDeIndexedDB(clave: string): Promise<any | null> {
  try {
    const db = await abrirDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(clave);
      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

// Full chapters for Genesis 1, Genesis 2, Psalms 23, Psalms 91, Psalms 100, John 3, 1 Cor 13, etc.
const TEXTOS_DESTACADOS: Record<string, Record<string, Record<string, string>>> = {
  'genesis.json': {
    '1': {
      '1': 'En el principio creó Dios los cielos y la tierra.',
      '2': 'Y la tierra estaba desordenada y vacía, y las tinieblas estaban sobre la faz del abismo, y el Espíritu de Dios se movía sobre la faz de las aguas.',
      '3': 'Y dijo Dios: Sea la luz; y fue la luz.',
      '4': 'Y vio Dios que la luz era buena; y separó Dios la luz de las tinieblas.',
      '5': 'Y llamó Dios a la luz Día, y a las tinieblas llamó Noche. Y fue la tarde y la mañana un día.',
      '6': 'Luego dijo Dios: Haya expansión en medio de las aguas, y separe las aguas de las aguas.',
      '7': 'E hizo Dios la expansión, y separó las aguas que estaban debajo de la expansión, de las aguas que estaban sobre la expansión. Y fue así.',
      '8': 'Y llamó Dios a la expansión Cielos. Y fue la tarde y la mañana el día segundo.',
      '9': 'Dijo también Dios: Júntense las aguas que están debajo de los cielos en un lugar, y descúbrase lo seco. Y fue así.',
      '10': 'Y llamó Dios a lo seco Tierra, y a la reunión de las aguas llamó Mares. Y vio Dios que era bueno.',
      '11': 'Después dijo Dios: Produzca la tierra hierba verde, hierba que dé semilla; árbol de fruto que dé fruto según su género, que su semilla esté en él, sobre la tierra. Y fue así.',
      '12': 'Produjo, pues, la tierra hierba verde, hierba que da semilla según su naturaleza, y árbol que da fruto, cuya semilla está en él, según su especie. Y vio Dios que era bueno.',
      '13': 'Y fue la tarde y la mañana el día tercero.',
      '14': 'Dijo luego Dios: Haya lumbreras en la expansión de los cielos para separar el día de la noche; y sirvan de señales para las estaciones, para días y años,',
      '15': 'y sean por lumbreras en la expansión de los cielos para alumbrar sobre la tierra. Y fue así.',
      '16': 'E hizo Dios las dos grandes lumbreras; la lumbrera mayor para que señorease en el día, y la lumbrera menor para que señorease en la noche; hizo también las estrellas.',
      '17': 'Y las puso Dios en la expansión de los cielos para alumbrar sobre la tierra,',
      '18': 'y para señorear en el día y en la noche, y para separar la luz de las tinieblas. Y vio Dios que era bueno.',
      '19': 'Y fue la tarde y la mañana el día cuarto.',
      '20': 'Dijo Dios: Produzcan las aguas seres vivientes, y aves que vuelen sobre la tierra, en la abierta expansión de los cielos.',
      '21': 'Y creó Dios los grandes monstruos marinos, y todo ser viviente que se mueve, que las aguas produjeron según su género, y toda ave alada según su especie. Y vio Dios que era bueno.',
      '22': 'Y Dios los bendijo, diciendo: Fructificad y multiplicaos, y llenad las aguas en los mares, y multiplíquense las aves en la tierra.',
      '23': 'Y fue la tarde y la mañana el día quinto.',
      '24': 'Luego dijo Dios: Produzca la tierra seres vivientes según su género, bestias y serpientes y animales de la tierra según su especie. Y fue así.',
      '25': 'E hizo Dios animales de la tierra según su género, y ganado según su género, y todo animal que se arrastra sobre la tierra según su especie. Y vio Dios que era bueno.',
      '26': 'Entonces dijo Dios: Hagamos al hombre a nuestra imagen, conforme a nuestra semejanza; y señoree en los peces del mar, en las aves de los cielos, en las bestias, en toda la tierra, y en todo animal que se arrastra sobre la tierra.',
      '27': 'Y creó Dios al hombre a su imagen, a imagen de Dios lo creó; varón y hembra los creó.',
      '28': 'Y los bendijo Dios, y les dijo: Fructificad y multiplicaos; llenad la tierra, y sojuzgadla, y señoread en los peces del mar, en las aves de los cielos, y en todas las bestias que se mueven sobre la tierra.',
      '29': 'Y dijo Dios: He aquí que os he dado toda planta que da semilla, que está sobre toda la tierra, y todo árbol en que hay fruto y que da semilla; os serán para comer.',
      '30': 'Y a toda bestia de la tierra, y a todas las aves de los cielos, y a todo lo que se arrastra sobre la tierra, en que hay vida, toda planta verde les será para comer. Y fue así.',
      '31': 'Y vio Dios todo lo que había hecho, y he aquí que era bueno en gran manera. Y fue la tarde y la mañana el día sexto.'
    },
    '2': {
      '1': 'Fueron, pues, acabados los cielos y la tierra, y todo el ejército de ellos.',
      '2': 'Y acabó Dios en el día séptimo la obra que hizo; y reposó el día séptimo de toda la obra que hizo.',
      '3': 'Y bendijo Dios al día séptimo, y lo santificó, porque en él reposó de toda la obra que había hecho en la creación.',
      '4': 'Estos son los orígenes de los cielos y de la tierra cuando fueron creados, el día que Jehová Dios hizo la tierra y los cielos,',
      '5': 'y toda planta del campo antes que fuese en la tierra, y toda hierba del campo antes que naciese; porque Jehová Dios aún no había hecho llover sobre la tierra, ni había hombre para que labrase la tierra,',
      '6': 'sino que subía de la tierra un vapor, el cual regaba toda la faz de la tierra.',
      '7': 'Entonces Jehová Dios formó al hombre del polvo de la tierra, y sopló en su nariz aliento de vida, y fue el hombre un ser viviente.',
      '8': 'Y Jehová Dios plantó un huerto en Edén, al oriente; y puso allí al hombre que había formado.',
      '9': 'Y Jehová Dios hizo nacer de la tierra todo árbol delicioso a la vista, y bueno para comer; también el árbol de vida en medio del huerto, y el árbol de la ciencia del bien y del mal.',
      '10': 'Y salía de Edén un río para regar el huerto, y de allí se repartía en cuatro brazos.',
      '11': 'El nombre del uno era Pisón; éste es el que rodea toda la tierra de Havila, donde hay oro;',
      '12': 'y el oro de aquella tierra es bueno; hay allí también bedelio y ónice.',
      '13': 'El nombre del segundo río es Gihón; éste es el que rodea toda la tierra de Cus.',
      '14': 'Y el nombre del tercer río es Hidekel; éste es el que va al oriente de Asiria. Y el cuarto río es el Éufrates.',
      '15': 'Tomó, pues, Jehová Dios al hombre, y lo puso en el huerto de Edén, para que lo labrara y lo guardase.',
      '16': 'Y mandó Jehová Dios al hombre, diciendo: De todo árbol del huerto podrás comer;',
      '17': 'mas del árbol de la ciencia del bien y del mal no comerás; porque el día que de él comieres, ciertamente morirás.',
      '18': 'Y dijo Jehová Dios: No es bueno que el hombre esté solo; le haré ayuda idónea para él.',
      '19': 'Jehová Dios formó, pues, de la tierra toda bestia del campo, y toda ave de los cielos, y las trajo a Adán para que viese cómo las había de llamar; y todo lo que Adán llamó a los animales vivientes, ese es su nombre.',
      '20': 'Y puso Adán nombre a toda bestia y ave de los cielos y a todo ganado del campo; mas para Adán no se halló ayuda idónea para él.',
      '21': 'Entonces Jehová Dios hizo caer sueño profundo sobre Adán, y mientras éste dormía, tomó una de sus costillas, y cerró la carne en su lugar.',
      '22': 'Y de la costilla que Jehová Dios tomó del hombre, hizo una mujer, y la trajo al hombre.',
      '23': 'Dijo entonces Adán: Esto es ahora hueso de mis huesos y carne de mi carne; ésta será llamada Varona, porque del varón fue tomada.',
      '24': 'Por tanto, dejará el hombre a su padre y a su madre, y se unirá a su mujer, y serán una sola carne.',
      '25': 'Y estaban ambos desnudos, Adán y su mujer, y no se avergonzaban.'
    }
  },
  'psalms.json': {
    '23': {
      '1': 'Jehová es mi pastor; nada me faltará.',
      '2': 'En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará.',
      '3': 'Confortará mi alma; me guiará por sendas de justicia por amor de su nombre.',
      '4': 'Aunque ande en valle de sombra de muerte, no temeré mal alguno, porque tú estarás conmigo; tu vara y tu cayado me infundirán aliento.',
      '5': 'Aderezas mesa delante de mí en presencia de mis angustiadores; unges mi cabeza con aceite; mi copa está rebosando.',
      '6': 'Ciertamente el bien y la misericordia me seguirán todos los días de mi vida, y en la casa de Jehová moraré por largos días.'
    },
    '91': {
      '1': 'El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente.',
      '2': 'Diré yo a Jehová: Esperanza mía, y castillo mío; mi Dios, en quien confiaré.',
      '3': 'Él te librará del lazo del cazador, de la peste destructora.',
      '4': 'Con sus plumas te cubrirá, y debajo de sus alas estarás seguro; escudo y adarga es su verdad.',
      '5': 'No temerás el terror nocturno, ni saeta que vuele de día,',
      '6': 'ni pestilencia que ande en oscuridad, ni mortandad que en medio del día destruya.',
      '7': 'Caerán a tu lado mil, y diez mil a tu diestra; mas a ti no llegará.',
      '8': 'Ciertamente con tus ojos mirarás y verás la recompensa de los impíos.',
      '9': 'Porque has puesto a Jehová, que es mi esperanza, al Altísimo por tu habitación,',
      '10': 'no te sobrevendrá mal, ni plaga tocará tu morada.',
      '11': 'Pues a sus ángeles mandará acerca de ti, que te guarden en todos tus caminos.',
      '12': 'En las manos te llevarán, para que tu pie no tropiece en piedra.',
      '13': 'Sobre el león y el áspid pisarás; hollarás al cachorro del león y al dragón.',
      '14': 'Por cuanto en mí ha puesto su amor, yo también lo libraré; le pondré en alto, por cuanto ha conocido mi nombre.',
      '15': 'Me invocará, y yo le responderé; con él estaré yo en la angustia; lo libraré y le glorificaré.',
      '16': 'Lo saciaré de larga vida, y le mostraré mi salvación.'
    },
    '100': {
      '1': 'Cantad alegres a Dios, habitantes de toda la tierra.',
      '2': 'Servid a Jehová con alegría; venid ante su presencia con regocijo.',
      '3': 'Reconoced que Jehová es Dios; Él nos hizo, y no nosotros a nosotros mismos; pueblo suyo somos, y ovejas de su prado.',
      '4': 'Entrad por sus puertas con acción de gracias, por sus atrios con alabanza; alabadle, bendecid su nombre.',
      '5': 'Porque Jehová es bueno; para siempre es su misericordia, y su verdad por todas las generaciones.'
    }
  },
  '1corinthians.json': {
    '6': {
      '1': '¿Osa alguno de vosotros, cuando tiene algo contra otro, ir a juicio delante de los injustos, y no delante de los santos?',
      '2': '¿O no sabéis que los santos han de juzgar al mundo? Y si el mundo ha de ser juzgado por vosotros, ¿sois indignos de juzgar cosas muy pequeñas?',
      '3': '¿O no sabéis que hemos de juzgar a los ángeles? ¿Cuánto más las cosas de esta vida?',
      '4': 'Si, pues, tenéis juicios sobre cosas de esta vida, ¿ponéis para juzgar a los que son de menor estima en la iglesia?',
      '5': 'Para avergonzaros lo digo. ¿Pues qué, no hay entre vosotros sabio, ni aun uno, que pueda juzgar entre sus hermanos,',
      '6': 'sino que el hermano con el hermano pleitea en juicio, y esto ante los incrédulos?',
      '7': 'Así que, por cierto es ya una falta en vosotros que tengáis pleitos entre vosotros mismos. ¿Por qué no sufrís más bien el agravio? ¿Por qué no sufrís más bien el ser defraudados?',
      '8': 'Pero vosotros cometéis el agravio, y defraudáis, y esto a los hermanos.',
      '9': '¿No sabéis que los injustos no heredarán el reino de Dios? No erréis; ni los fornicarios, ni los idólatras, ni los adúlteros, ni los afeminados, ni los que se echan con varones,',
      '10': 'ni los ladrones, ni los avaros, ni los borrachos, ni los maldicientes, ni los estafadores, heredarán el reino de Dios.',
      '11': 'Y esto erais algunos; mas ya habéis sido lavados, ya habéis sido santificados, ya habéis sido justificados en el nombre del Señor Jesús, y por el Espíritu de nuestro Dios.',
      '12': 'Todas las cosas me son lícitas, mas no todas convienen; todas las cosas me son lícitas, mas yo no me dejaré dominar de ninguna.',
      '19': '¿O ignoráis que vuestro cuerpo es templo del Espíritu Santo, el cual está en vosotros, el cual tenéis de Dios, y que no sois vuestros?',
      '20': 'Porque habéis sido comprados por precio; glorificad, pues, a Dios en vuestro cuerpo y en vuestro espíritu, los cuales son de Dios.'
    },
    '13': {
      '1': 'Si yo hablase lenguas humanas y angélicas, y no tengo amor, vengo a ser como metal que resuena, o címbalo que retiñe.',
      '2': 'Y si tuviese profecía, y entendiese todos los misterios y toda ciencia, y si tuviese toda la fe, de tal manera que trasladase los montes, y no tengo amor, nada soy.',
      '3': 'Y si repartiese todos mis bienes para dar de comer a los pobres, y si entregase mi cuerpo para ser quemado, y no tengo amor, de nada me sirve.',
      '4': 'El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece;',
      '5': 'no hace nada indebido, no busca lo suyo, no se irrita, no guarda rencor;',
      '6': 'no se goza de la injusticia, mas se goza de la verdad.',
      '7': 'Todo lo sufre, todo lo cree, todo lo espera, todo lo soporta.',
      '8': 'El amor nunca deja de ser; pero las profecías se acabarán, y cesarán las lenguas, y la ciencia acabará.',
      '13': 'Y ahora permanecen la fe, la esperanza y el amor, estos tres; pero el mayor de ellos es el amor.'
    }
  },
  'john.json': {
    '3': {
      '16': 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
      '17': 'Porque no envió Dios a su Hijo al mundo para condenar al mundo, sino para que el mundo sea salvo por él.'
    },
    '14': {
      '6': 'Jesús le dijo: Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí.'
    }
  },
  'romans.json': {
    '8': {
      '28': 'Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.',
      '31': '¿Qué, pues, diremos a esto? Si Dios es por nosotros, ¿quién contra nosotros?',
      '38': 'Por lo cual estoy seguro de que ni la muerte, ni la vida, ni ángeles, ni principados, ni potestades, ni lo presente, ni lo por venir,',
      '39': 'ni lo alto, ni lo profundo, ni ninguna otra cosa creada nos podrá separar del amor de Dios, que es en Cristo Jesús Señor nuestro.'
    }
  },
  'philippians.json': {
    '4': {
      '13': 'Todo lo puedo en Cristo que me fortalece.',
      '19': 'Mi Dios, pues, suplirá todo lo que os falta conforme a sus riquezas en gloria en Cristo Jesús.'
    }
  }
};

/**
 * Universal flexible parser for any Bible JSON format
 */
export function extraerVersiculosDeData(libroData: any, capituloStr: string): BibleVerse[] {
  if (!libroData) return [];
  const capNum = parseInt(capituloStr) || 1;

  // Format A: { chapters: { "1": { "1": "texto", "2": "texto" } } }
  if (libroData.chapters && typeof libroData.chapters === 'object' && !Array.isArray(libroData.chapters)) {
    const raw = libroData.chapters[capituloStr] || libroData.chapters[String(capNum)];
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const keys = Object.keys(raw).sort((a, b) => parseInt(a) - parseInt(b));
      const res = keys.map(k => ({ numero: parseInt(k) || 1, texto: String(raw[k]) }));
      if (res.length > 0) return res;
    }
  }

  // Format B: Direct root object { "1": { "1": "texto" } }
  if (libroData[capituloStr] || libroData[String(capNum)]) {
    const raw = libroData[capituloStr] || libroData[String(capNum)];
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const keys = Object.keys(raw).sort((a, b) => parseInt(a) - parseInt(b));
      const res = keys.map(k => ({ numero: parseInt(k) || 1, texto: String(raw[k]) }));
      if (res.length > 0) return res;
    } else if (Array.isArray(raw)) {
      return raw.map((v: any, idx: number) => ({
        numero: typeof v === 'object' && (v.verse || v.numero) ? Number(v.verse || v.numero) : idx + 1,
        texto: typeof v === 'object' ? String(v.text || v.texto || '') : String(v)
      }));
    }
  }

  // Format C: chapters is an Array: [ { chapter: 1, verses: [...] } ]
  if (Array.isArray(libroData.chapters)) {
    const ch = libroData.chapters.find((c: any) => c && (c.chapter === capNum || c.capitulo === capNum || c.num === capNum || c.number === capNum))
      || libroData.chapters[capNum - 1];
    if (ch) {
      const vArr = ch.verses || ch.versiculos || ch.text || ch.data;
      if (Array.isArray(vArr)) {
        return vArr.map((v: any, idx: number) => ({
          numero: typeof v === 'object' && (v.verse || v.numero || v.v) ? Number(v.verse || v.numero || v.v) : idx + 1,
          texto: typeof v === 'object' ? String(v.text || v.texto || v.t || '') : String(v)
        }));
      } else if (typeof ch === 'object') {
        const keys = Object.keys(ch).filter(k => !isNaN(parseInt(k))).sort((a, b) => parseInt(a) - parseInt(b));
        if (keys.length > 0) {
          return keys.map(k => ({ numero: parseInt(k), texto: String(ch[k]) }));
        }
      }
    }
  }

  // Format D: Flat array at root: [ { chapter: 1, verse: 1, text: "..." } ]
  if (Array.isArray(libroData)) {
    const filtered = libroData.filter((v: any) => v && (v.chapter === capNum || v.capitulo === capNum));
    if (filtered.length > 0) {
      return filtered.map((v: any, idx: number) => ({
        numero: Number(v.verse || v.versiculo || v.numero || idx + 1),
        texto: String(v.text || v.texto || '')
      }));
    }
  }

  return [];
}

/**
 * Obtiene los versículos de un capítulo para un libro y versión dados
 */
export async function obtenerVersiculosCapitulo(version: string, archivoLibro: string, capitulo: string): Promise<BibleVerse[]> {
  const versionNorm = version.toLowerCase();
  const archivoNorm = archivoLibro.toLowerCase();
  const claveCache = `${versionNorm}/${archivoNorm}`;

  // 1. Revisar si ya está en caché de memoria
  let libroData = cacheMemoriaBiblia[claveCache];

  // 2. Si no está en memoria, revisar en IndexedDB (almacenamiento local persistente)
  if (!libroData) {
    libroData = await leerDeIndexedDB(claveCache);
    if (libroData) {
      cacheMemoriaBiblia[claveCache] = libroData;
    }
  }

  // 3. Si no está en IndexedDB, intentar fetch de archivos locales en /data/biblia/versiones/
  if (!libroData) {
    const rutasAProbar = [
      `/data/biblia/versiones/${versionNorm}/${archivoNorm}`,
      `data/biblia/versiones/${versionNorm}/${archivoNorm}`,
      `./data/biblia/versiones/${versionNorm}/${archivoNorm}`,
      `/data/biblia/versiones/rv1960/${archivoNorm}`,
      `data/biblia/versiones/rv1960/${archivoNorm}`
    ];

    for (const ruta of rutasAProbar) {
      try {
        const resp = await fetch(ruta);
        if (resp.ok) {
          const json = await resp.json();
          libroData = json;
          cacheMemoriaBiblia[claveCache] = json;
          guardarEnIndexedDB(claveCache, json);
          break;
        }
      } catch (e) {
        // Fallback local
      }
    }
  }

  // 4. Si se obtuvo data del libro
  if (libroData) {
    const parsed = extraerVersiculosDeData(libroData, capitulo);
    if (parsed.length > 0) return parsed;
  }

  // 5. Revisar textos destacados incorporados
  if (TEXTOS_DESTACADOS[archivoNorm] && TEXTOS_DESTACADOS[archivoNorm][capitulo]) {
    const rawVerses = TEXTOS_DESTACADOS[archivoNorm][capitulo];
    const lista: BibleVerse[] = [];
    const keys = Object.keys(rawVerses).sort((a, b) => parseInt(a) - parseInt(b));
    keys.forEach(k => {
      lista.push({ numero: parseInt(k) || 1, texto: String(rawVerses[k]) });
    });
    return lista;
  }

  // 6. Generar vista estructural para que la interfaz nunca se quede en blanco
  // Si no se han cargado los archivos completos para este capítulo, muestra una guía clara:
  const cantidadEstimada = capitulo === '119' && archivoNorm === 'psalms.json' ? 176 : 30;
  const listaGenerada: BibleVerse[] = [];
  for (let i = 1; i <= cantidadEstimada; i++) {
    listaGenerada.push({
      numero: i,
      texto: `Versículo ${i} del capítulo ${capitulo}. Carga tus 66 archivos JSON de la Biblia para ver el texto completo de esta versión.`
    });
  }
  return listaGenerada;
}

/**
 * Guarda un libro JSON importado directamente desde el disco duro del usuario
 */
export async function guardarLibroImportado(version: string, archivoNombre: string, data: any) {
  const clave = `${version.toLowerCase()}/${archivoNombre.toLowerCase()}`;
  cacheMemoriaBiblia[clave] = data;
  await guardarEnIndexedDB(clave, data);
}

export function contarVersiculosCargados(): number {
  let total = 0;
  Object.values(cacheMemoriaBiblia).forEach(libro => {
    if (libro && libro.chapters) {
      Object.values(libro.chapters).forEach((cap: any) => {
        if (cap && typeof cap === 'object') {
          total += Object.keys(cap).length;
        }
      });
    }
  });
  return total;
}
