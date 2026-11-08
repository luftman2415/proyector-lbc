import { Song, SongSection } from '../types';

/**
 * Normaliza cualquier texto removiendo acentos, signos de puntuación extra y convirtiendo a minúsculas
 */
export function normalizarTexto(texto: any): string {
  if (texto === null || texto === undefined) return '';
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Determina el tipo de estrofa y color correspondiente
 */
export function clasificarTipoEstrofa(textoOIdentificador: string): { type: SongSection['type']; label: string; color: string } {
  const norm = normalizarTexto(textoOIdentificador);

  if (norm.includes('coro') || norm.includes('chorus') || norm.includes('estribillo')) {
    return { type: 'chorus', label: 'Coro', color: '#f59e0b' }; // Amber/Dorado
  }
  if (norm.includes('puente') || norm.includes('bridge')) {
    return { type: 'bridge', label: 'Puente', color: '#a855f7' }; // Violeta/Púrpura
  }
  if (norm.includes('pre') || norm.includes('pre-coro') || norm.includes('prechorus')) {
    return { type: 'pre-chorus', label: 'Pre-Coro', color: '#10b981' }; // Esmeralda
  }
  if (norm.includes('intro') || norm.includes('introduccion')) {
    return { type: 'intro', label: 'Intro', color: '#64748b' }; // Pizarra
  }
  if (norm.includes('final') || norm.includes('outro') || norm.includes('coda')) {
    return { type: 'outro', label: 'Final', color: '#64748b' }; // Pizarra
  }
  
  // Por defecto es estrofa / verso
  return { type: 'verse', label: 'Estrofa', color: '#0ea5e9' }; // Celeste
}

/**
 * Divide un texto de letra (le) en secciones legibles para proyección en pantalla
 */
function procesarLetraEnSecciones(textoLetra: string): SongSection[] {
  if (!textoLetra || !textoLetra.trim()) return [];

  // Normalizar retornos de carro y barras escapadas (\/\/ -> //)
  const limpio = textoLetra
    .replace(/\\r\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\\//g, '//');

  // Separar por bloques de doble salto de línea
  const bloques = limpio.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);

  const secciones: SongSection[] = [];
  let numEstrofa = 1;
  let numCoro = 1;

  bloques.forEach((bloque) => {
    let lineas = bloque.split('\n').map(l => l.trim()).filter(Boolean);
    if (lineas.length === 0) return;

    // Detectar si el bloque es un coro
    const primeraLinea = lineas[0].toLowerCase();
    const esCoro = primeraLinea.includes('//') || 
                   primeraLinea.includes('coro') || 
                   primeraLinea.includes('estribillo') ||
                   lineas.some(l => l.startsWith('//') && l.endsWith('//'));

    // Limpiar etiquetas de coro al inicio si existen
    if (primeraLinea.startsWith('[coro]') || primeraLinea.startsWith('coro:')) {
      lineas.shift();
    }

    // Si el bloque tiene demasiadas líneas (más de 6), dividirlo en grupos de 4 para no saturar la TV
    if (lineas.length > 6) {
      for (let i = 0; i < lineas.length; i += 4) {
        const subLineas = lineas.slice(i, i + 4);
        secciones.push({
          type: esCoro ? 'chorus' : 'verse',
          label: esCoro ? `Coro ${numCoro}` : `Estrofa ${numEstrofa}`,
          color: esCoro ? '#f59e0b' : '#0ea5e9',
          lines: subLineas
        });
        if (esCoro) numCoro++;
        else numEstrofa++;
      }
    } else {
      secciones.push({
        type: esCoro ? 'chorus' : 'verse',
        label: esCoro ? (numCoro === 1 ? 'Coro' : `Coro ${numCoro}`) : `Estrofa ${numEstrofa}`,
        color: esCoro ? '#f59e0b' : '#0ea5e9',
        lines: lineas
      });
      if (esCoro) numCoro++;
      else numEstrofa++;
    }
  });

  return secciones;
}

/**
 * Parsea y normaliza cualquier estructura JSON o JS a un arreglo de Song estándar
 */
export function parsearCancionesDesdeJSON(datos: any, origen: string = 'Local'): Song[] {
  let listaBruta: any[] = [];

  if (Array.isArray(datos)) {
    listaBruta = datos;
  } else if (datos && typeof datos === 'object') {
    if (Array.isArray(datos.canciones)) listaBruta = datos.canciones;
    else if (Array.isArray(datos.songs)) listaBruta = datos.songs;
    else if (Array.isArray(datos.repertorio)) listaBruta = datos.repertorio;
    else if (Array.isArray(datos.jscanciones)) listaBruta = datos.jscanciones;
    else if (Array.isArray(datos.data)) listaBruta = datos.data;
    else if (Array.isArray(datos.items)) listaBruta = datos.items;
    else {
      // Podría ser un diccionario con claves {"1": {...}, "2": {...}}
      listaBruta = Object.values(datos).filter(item => item && typeof item === 'object');
    }
  }

  const cancionesProcesadas: Song[] = [];

  listaBruta.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;

    // Soporte para formato nativo antiguo JS (ti = título, le = letra, tono = key)
    let tituloBruto = item.title || item.titulo || item.nombre || item.name || item.ti || `Canción ${index + 1}`;
    let autor = item.author || item.autor || item.artista || item.artist || '';
    
    // Si el título viene en formato "Santo es el señor - Juan Carlos Alvarado", extraer título y autor
    if (!autor && typeof tituloBruto === 'string' && tituloBruto.includes(' - ')) {
      const partes = tituloBruto.split(' - ');
      tituloBruto = partes[0].trim();
      autor = partes.slice(1).join(' - ').trim();
    }
    if (!autor) autor = 'Tradicional / Desconocido';

    const numero = item.numero || item.number || item.id_num || index + 1;
    const tono = item.key || item.tono || item.acorde || 'C';
    const tempo = item.tempo || item.bpm || 80;

    let secciones: SongSection[] = [];

    // Formato 1: sections ya es un array
    const seccionesRaw = item.sections || item.estrofas || item.letras || item.paragraphs || item.slides;

    if (Array.isArray(seccionesRaw) && seccionesRaw.length > 0) {
      secciones = seccionesRaw.map((sec: any, secIdx: number) => {
        if (typeof sec === 'string') {
          const clasif = clasificarTipoEstrofa(`Estrofa ${secIdx + 1}`);
          return {
            type: clasif.type,
            label: `Estrofa ${secIdx + 1}`,
            color: clasif.color,
            lines: sec.split('\n').map((l: string) => l.trim()).filter(Boolean)
          };
        }

        const tipoStr = sec.type || sec.tipo || sec.nombre || `Estrofa ${secIdx + 1}`;
        const clasif = clasificarTipoEstrofa(tipoStr);

        let lineas: string[] = [];
        if (Array.isArray(sec.lines)) {
          lineas = sec.lines.map((l: any) => String(l).trim()).filter(Boolean);
        } else if (Array.isArray(sec.lineas)) {
          lineas = sec.lineas.map((l: any) => String(l).trim()).filter(Boolean);
        } else if (typeof sec.text === 'string') {
          lineas = sec.text.split('\n').map((l: string) => l.trim()).filter(Boolean);
        } else if (typeof sec.letra === 'string') {
          lineas = sec.letra.split('\n').map((l: string) => l.trim()).filter(Boolean);
        } else if (typeof sec.content === 'string') {
          lineas = sec.content.split('\n').map((l: string) => l.trim()).filter(Boolean);
        }

        return {
          type: sec.type || clasif.type,
          label: sec.label || sec.nombre || (clasif.type === 'chorus' ? 'Coro' : clasif.type === 'bridge' ? 'Puente' : `Estrofa ${secIdx + 1}`),
          color: sec.color || clasif.color,
          lines: lineas
        };
      });
    } else if (typeof item.le === 'string' || typeof item.letra === 'string' || typeof item.lyrics === 'string' || typeof item.body === 'string') {
      // Formato 2: La letra viene como un solo texto (como en los archivos Canciones.js con "le")
      const textoCompleto = item.le || item.letra || item.lyrics || item.body || '';
      secciones = procesarLetraEnSecciones(textoCompleto);
    }

    // Si aún no tiene secciones, crear al menos una con el título
    if (secciones.length === 0) {
      secciones.push({
        type: 'verse',
        label: 'Estrofa 1',
        color: '#0ea5e9',
        lines: [String(tituloBruto)]
      });
    }

    cancionesProcesadas.push({
      id: item.id ? String(item.id) : `song-${index}-${Date.now()}`,
      numero: Number(numero) || index + 1,
      title: String(tituloBruto).trim(),
      author: String(autor).trim(),
      key: tono,
      tempo: Number(tempo) || 80,
      tags: Array.isArray(item.tags) ? item.tags : [origen],
      sections: secciones
    });
  });

  return cancionesProcesadas;
}

/**
 * Lee un archivo de texto ya sea .JSON o .JS (ej: Canciones.js, Corario IPUC castilla.js, Mi Cancionero.js)
 * y lo convierte automáticamente en el repertorio de canciones.
 */
export function parsearCancionesDesdeArchivo(contenidoTexto: string, nombreArchivo: string = 'Importado'): Song[] {
  if (!contenidoTexto || !contenidoTexto.trim()) return [];

  const limpio = contenidoTexto.trim();

  // Intento 1: Es un JSON puro directo
  try {
    const json = JSON.parse(limpio);
    return parsearCancionesDesdeJSON(json, nombreArchivo);
  } catch (e1) {
    // No es JSON puro, proceder a análisis de archivo JavaScript (.js)
  }

  // Intento 2: Archivo .JS con "var jscanciones = [...]" o similar
  const primerCorchete = limpio.indexOf('[');
  const ultimoCorchete = limpio.lastIndexOf(']');

  if (primerCorchete !== -1 && ultimoCorchete !== -1 && ultimoCorchete > primerCorchete) {
    const segmentoArray = limpio.substring(primerCorchete, ultimoCorchete + 1);

    // Intentar parsear el fragmento entre corchetes como JSON
    try {
      const parsedArray = JSON.parse(segmentoArray);
      return parsearCancionesDesdeJSON(parsedArray, nombreArchivo);
    } catch (e2) {
      // Si falla por detalles de sintaxis JS (como comas finales o variables), usar Function segura
      try {
        const evalArray = new Function(`"use strict"; return (${segmentoArray});`)();
        if (Array.isArray(evalArray)) {
          return parsearCancionesDesdeJSON(evalArray, nombreArchivo);
        }
      } catch (e3) {
        console.warn('Error al evaluar arreglo JS:', e3);
      }
    }
  }

  // Intento 3: Si tiene "var x = { ... }"
  const primeraLlave = limpio.indexOf('{');
  const ultimaLlave = limpio.lastIndexOf('}');
  if (primeraLlave !== -1 && ultimaLlave !== -1 && ultimaLlave > primeraLlave) {
    const segmentoObjeto = limpio.substring(primeraLlave, ultimaLlave + 1);
    try {
      const parsedObj = JSON.parse(segmentoObjeto);
      return parsearCancionesDesdeJSON(parsedObj, nombreArchivo);
    } catch (e4) {
      try {
        const evalObj = new Function(`"use strict"; return (${segmentoObjeto});`)();
        if (evalObj && typeof evalObj === 'object') {
          return parsearCancionesDesdeJSON(evalObj, nombreArchivo);
        }
      } catch (e5) {}
    }
  }

  return [];
}

/**
 * Buscador de canciones insensible a acentos, mayúsculas y caracteres especiales
 */
export function buscarCanciones(repertorio: Song[], consulta: string, buscarEnLetra: boolean = false): Song[] {
  const normConsulta = normalizarTexto(consulta);
  if (!normConsulta) return repertorio;

  const palabras = normConsulta.split(/\s+/).filter(Boolean);

  return repertorio.filter(cancion => {
    const normTitulo = normalizarTexto(cancion.title);
    const normAutor = normalizarTexto(cancion.author);
    const numeroStr = String(cancion.numero || '');

    // Coincidencia por número directo
    if (numeroStr === normConsulta) return true;

    // Todas las palabras clave deben encontrarse en el título o autor
    const coincideTitulo = palabras.every(p => normTitulo.includes(p));
    if (coincideTitulo) return true;

    const coincideAutor = palabras.every(p => normAutor.includes(p));
    if (coincideAutor) return true;

    // Búsqueda profunda en letras de estrofas si se habilita
    if (buscarEnLetra && cancion.sections) {
      const textoLetra = cancion.sections
        .flatMap(s => s.lines)
        .join(' ');
      const normLetra = normalizarTexto(textoLetra);
      return palabras.every(p => normLetra.includes(p));
    }

    return false;
  });
}
