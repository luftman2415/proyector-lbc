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
 * Parsea y normaliza cualquier estructura JSON a un arreglo de Song estándar
 */
export function parsearCancionesDesdeJSON(datos: any, origen: string = 'Local'): Song[] {
  let listaBruta: any[] = [];

  if (Array.isArray(datos)) {
    listaBruta = datos;
  } else if (datos && typeof datos === 'object') {
    if (Array.isArray(datos.canciones)) listaBruta = datos.canciones;
    else if (Array.isArray(datos.songs)) listaBruta = datos.songs;
    else if (Array.isArray(datos.repertorio)) listaBruta = datos.repertorio;
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

    const titulo = item.title || item.titulo || item.nombre || item.name || `Canción ${index + 1}`;
    const autor = item.author || item.autor || item.artista || item.artist || 'Tradicional / Desconocido';
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
    } else if (typeof item.letra === 'string' || typeof item.lyrics === 'string' || typeof item.body === 'string') {
      // Formato 2: La letra viene como un solo texto grande separado por dobles saltos de línea
      const textoCompleto = (item.letra || item.lyrics || item.body || '').trim();
      const bloques = textoCompleto.split(/\n\s*\n/);
      
      secciones = bloques.map((bloque: string, bIdx: number) => {
        let lineas = bloque.split('\n').map((l: string) => l.trim()).filter(Boolean);
        let clasif = clasificarTipoEstrofa(`Estrofa ${bIdx + 1}`);

        if (lineas.length > 0) {
          const primera = lineas[0].toLowerCase();
          if (primera.includes('coro') || primera.includes('chorus')) {
            clasif = clasificarTipoEstrofa('coro');
            lineas.shift();
          } else if (primera.includes('puente') || primera.includes('bridge')) {
            clasif = clasificarTipoEstrofa('puente');
            lineas.shift();
          } else if (primera.includes('estrofa') || primera.includes('verso')) {
            clasif = clasificarTipoEstrofa('verso');
            lineas.shift();
          }
        }

        return {
          type: clasif.type,
          label: clasif.label,
          color: clasif.color,
          lines: lineas
        };
      });
    }

    // Si aún no tiene secciones, crear al menos una con el título
    if (secciones.length === 0) {
      secciones.push({
        type: 'verse',
        label: 'Estrofa 1',
        color: '#0ea5e9',
        lines: [titulo]
      });
    }

    cancionesProcesadas.push({
      id: item.id ? String(item.id) : `song-${index}-${Date.now()}`,
      numero: Number(numero) || index + 1,
      title: String(titulo).trim(),
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
