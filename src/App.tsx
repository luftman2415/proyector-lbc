/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Music, BookOpen, Monitor, Sliders, Plus, Trash2, ArrowUp, ArrowDown,
  Search, Upload, Download, Eye, EyeOff, RefreshCw, Check, Copy,
  Sparkles, ExternalLink, Play, Pause, RotateCcw, AlertCircle, FileText,
  CheckCircle2, Image, Video, Mic, Settings, Home, Clock, Volume2, VolumeX,
  FolderOpen, Sun, Moon, Type, AlignCenter, AlignLeft, Disc, Square,
  HelpCircle, Radio
} from 'lucide-react';

import { Song, SongSection, SetlistsState, ProjectedContent } from './types';
import { parsearCancionesDesdeJSON, buscarCanciones, normalizarTexto } from './utils/songParser';
import { INITIAL_FEATURED_SONGS } from './data/defaultSongs';
import { VANILLA_APP_JS } from './utils/vanillaTemplates';
import { LIBROS_BIBLIA_COMPLETOS, VERSIONES_BIBLIA, BibleBookMeta } from './data/bibleMetadata';
import { obtenerVersiculosCapitulo, guardarLibroImportado, BibleVerse, VersiculoProyectado } from './data/bibleStore';
import { FONDOS_PREDETERMINADOS, BackgroundPreset } from './data/backgroundsData';
import { DIAPOSITIVAS_INICIALES, SlideItem } from './data/slidesData';
import { HelpModal } from './components/HelpModal';
import { ObsPanel } from './components/ObsPanel';

// Tipografías estándar garantizadas en Windows (funcionan 100% offline)
export const FUENTES_SISTEMA = [
  { id: "'Segoe UI', system-ui, -apple-system, sans-serif", nombre: "Segoe UI (Moderna de Windows)" },
  { id: "'Impact', 'Arial Black', sans-serif", nombre: "Impact (Gruesa, Máximo Impacto)" },
  { id: "'Georgia', 'Times New Roman', serif", nombre: "Georgia (Clásica Eclesiástica con Serifa)" },
  { id: "'Trebuchet MS', 'Verdana', sans-serif", nombre: "Trebuchet MS (Redonda y Clara)" },
  { id: "'Verdana', sans-serif", nombre: "Verdana (Espaciada para Gran Distancia)" },
  { id: "'Calibri', 'Candara', sans-serif", nombre: "Calibri (Moderna Suave)" },
  { id: "'Courier New', monospace", nombre: "Courier New (Estilo Máquina de Escribir)" }
];

export default function App() {
  // Navigation tabs matching church operations
  const [moduloActivo, setModuloActivo] = useState<'portada' | 'biblia' | 'canciones' | 'fondos' | 'video' | 'karaoke' | 'anuncios' | 'obs' | 'config' | 'descargar'>('portada');

  // Help modal state
  const [mostrarAyuda, setMostrarAyuda] = useState<boolean>(false);

  // Clock
  const [horaActual, setHoraActual] = useState<string>('');
  const [fechaActual, setFechaActual] = useState<string>('');

  useEffect(() => {
    const actualizarReloj = () => {
      const ahora = new Date();
      setHoraActual(ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setFechaActual(ahora.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    actualizarReloj();
    const timer = setInterval(actualizarReloj, 1000);
    return () => clearInterval(timer);
  }, []);

  // Notifications
  const [notificacion, setNotificacion] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);
  const mostrarToast = (texto: string, tipo: 'exito' | 'error' | 'info' = 'exito') => {
    setNotificacion({ tipo, texto });
    setTimeout(() => setNotificacion(null), 4000);
  };

  // BroadcastChannel & Projection
  const canalRef = useRef<BroadcastChannel | null>(null);
  const [proyeccionActual, setProyeccionActual] = useState<ProjectedContent | null>(null);
  const [isBlackout, setIsBlackout] = useState<boolean>(false);
  const [proyectorConectado, setProyectorConectado] = useState<boolean>(false);
  const [tamanoFuente, setTamanoFuente] = useState<number>(() => {
    const s = localStorage.getItem('lbc_tamano_fuente');
    return s ? Number(s) : 52;
  });
  const [fondoActivo, setFondoActivo] = useState<string>(() => {
    return localStorage.getItem('lbc_fondo_activo') || FONDOS_PREDETERMINADOS[0].cssBackground || '';
  });
  const [tipoFondoActivo, setTipoFondoActivo] = useState<string>(() => {
    return localStorage.getItem('lbc_tipo_fondo') || FONDOS_PREDETERMINADOS[0].tipo || 'anim';
  });

  // Fondos personalizados subidos por el operador (Imágenes o Videos MP4 en bucle)
  const [fondosPersonalizados, setFondosPersonalizados] = useState<BackgroundPreset[]>(() => {
    try {
      const g = localStorage.getItem('lbc_fondos_subidos');
      return g ? JSON.parse(g) : [];
    } catch (e) {
      return [];
    }
  });
  const fondoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Ajustes de visualización y contraste de fondos
  const [modoAjusteFondo, setModoAjusteFondo] = useState<'contain' | 'cover'>(() => {
    return (localStorage.getItem('lbc_modo_ajuste_fondo') as any) || 'contain';
  });
  const [oscurecedorFondo, setOscurecedorFondo] = useState<number>(() => {
    const s = localStorage.getItem('lbc_scrim_fondo');
    return s !== null ? parseFloat(s) : 0.45;
  });

  // Estados para reproductor de YouTube
  const [youtubeInputUrl, setYoutubeInputUrl] = useState<string>('');
  const [youtubeVideoId, setYoutubeVideoId] = useState<string>('');
  const [youtubeEnProyector, setYoutubeEnProyector] = useState<boolean>(false);

  // ==================== AJUSTES PERSONALIZADOS DEL SISTEMA ====================
  const [mostrarBotonZip, setMostrarBotonZip] = useState<boolean>(() => {
    return localStorage.getItem('lbc_mostrar_zip') !== 'false';
  });
  const [fuenteProyector, setFuenteProyector] = useState<string>(() => {
    return localStorage.getItem('lbc_fuente') || "'Segoe UI', system-ui, -apple-system, sans-serif";
  });
  const [colorTextoProyector, setColorTextoProyector] = useState<string>(() => {
    return localStorage.getItem('lbc_color_texto') || '#ffffff';
  });
  const [sombraTexto, setSombraTexto] = useState<boolean>(() => {
    return localStorage.getItem('lbc_sombra') !== 'false';
  });
  const [alineacionProyector, setAlineacionProyector] = useState<'center' | 'left'>(() => {
    return (localStorage.getItem('lbc_alineacion') as any) || 'center';
  });
  const [temaOperador, setTemaOperador] = useState<'oscuro' | 'claro'>(() => {
    return (localStorage.getItem('lbc_tema') as any) || 'oscuro';
  });
  const [nombreCongregacion, setNombreCongregacion] = useState<string>(() => {
    return localStorage.getItem('lbc_nombre_iglesia') || 'Iglesia Cristiana Cuadrangular Las Brisas';
  });

  // COMUNICACIÓN DUAL ROBUSTA (BroadcastChannel + StorageEvent)
  // Garantiza envío instantáneo en Windows / Electron sin retrasos ni congelamientos
  const enviarAlProyector = (data: any) => {
    try {
      canalRef.current?.postMessage(data);
    } catch (e) {}

    try {
      localStorage.setItem('proyector_lbc_msg', JSON.stringify({ ...data, _ts: Date.now() }));
    } catch (e) {}
  };

  const emitirAjustesProyector = (nuevos: {
    fuente?: string;
    colorTexto?: string;
    sombraTexto?: boolean;
    alineacion?: string;
    tamano?: number;
  }) => {
    enviarAlProyector({
      accion: 'ajustesProyector',
      fuente: nuevos.fuente !== undefined ? nuevos.fuente : fuenteProyector,
      colorTexto: nuevos.colorTexto !== undefined ? nuevos.colorTexto : colorTextoProyector,
      sombraTexto: nuevos.sombraTexto !== undefined ? nuevos.sombraTexto : sombraTexto,
      alineacion: nuevos.alineacion !== undefined ? nuevos.alineacion : alineacionProyector,
      tamano: nuevos.tamano !== undefined ? nuevos.tamano : tamanoFuente
    });
  };

  // ==================== BIBLIA COMPLETA (66 LIBROS) ====================
  const [filtroTestamento, setFiltroTestamento] = useState<'todos' | 'antiguo' | 'nuevo'>('todos');
  const [busquedaLibro, setBusquedaLibro] = useState<string>('');
  const [libroSeleccionado, setLibroSeleccionado] = useState<BibleBookMeta>(LIBROS_BIBLIA_COMPLETOS.find(l => l.archivo === 'genesis.json') || LIBROS_BIBLIA_COMPLETOS[0]);
  const [versionBiblia, setVersionBiblia] = useState<string>('rv1960');
  const [capituloActual, setCapituloActual] = useState<string>('1');
  const [versiculosCapitulo, setVersiculosCapitulo] = useState<BibleVerse[]>([]);
  const [versiculoActivoNum, setVersiculoActivoNum] = useState<number>(1);
  const [busquedaVersiculoTexto, setBusquedaVersiculoTexto] = useState<string>('');
  const [historialVersiculos, setHistorialVersiculos] = useState<VersiculoProyectado[]>([]);

  // Folder and file inputs for Bible files
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const bibleFileInputRef = useRef<HTMLInputElement | null>(null);

  // Load verses when book, chapter or version changes
  useEffect(() => {
    let montado = true;
    const cargar = async () => {
      const vers = await obtenerVersiculosCapitulo(versionBiblia, libroSeleccionado.archivo, capituloActual);
      if (montado) {
        setVersiculosCapitulo(vers);
        if (vers.length > 0 && !vers.some(v => v.numero === versiculoActivoNum)) {
          setVersiculoActivoNum(vers[0].numero);
        }
      }
    };
    cargar();
    return () => { montado = false; };
  }, [libroSeleccionado, capituloActual, versionBiblia]);

  // Project selected Bible verse
  const proyectarVersiculo = (versiculo: BibleVerse) => {
    setVersiculoActivoNum(versiculo.numero);
    setIsBlackout(false);

    const cita = `${libroSeleccionado.nombre} ${capituloActual}:${versiculo.numero}`;
    const salidaFormatted = `"${versiculo.texto}"\n\n— ${cita} (${versionBiblia.toUpperCase()})`;

    setProyeccionActual({
      id: `biblia-${libroSeleccionado.id}-${capituloActual}-${versiculo.numero}`,
      tipo: 'biblia',
      texto: `"${versiculo.texto}"`,
      pie: `— ${cita} (${versionBiblia.toUpperCase()})`,
      titulo: cita
    });

    try {
      localStorage.setItem('proyector_lbc_actual', JSON.stringify({
        texto: salidaFormatted,
        tipo: 'biblia'
      }));
    } catch (e) {}

    enviarAlProyector({
      accion: 'mostrar',
      texto: salidaFormatted,
      tipo: 'biblia'
    });

    // Add to history
    const nuevoHistorial: VersiculoProyectado = {
      id: `${Date.now()}`,
      cita,
      texto: versiculo.texto,
      version: versionBiblia.toUpperCase(),
      hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    };
    setHistorialVersiculos(prev => [nuevoHistorial, ...prev.slice(0, 20)]);
  };

  // Bulk Bible folder / files importer
  const handleCargaArchivosBiblia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let cargados = 0;
    Array.from(files).forEach(file => {
      if (!file.name.endsWith('.json')) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          let version = versionBiblia;
          const rutaCompleta = (file as any).webkitRelativePath || file.name;
          for (const v of VERSIONES_BIBLIA) {
            if (rutaCompleta.toLowerCase().includes(v.codigo)) {
              version = v.codigo;
              break;
            }
          }

          await guardarLibroImportado(version, file.name, json);
          cargados++;

          if (cargados === files.length) {
            mostrarToast(`¡Se indexaron ${cargados} libros bíblicos exitosamente en tu PC!`);
            obtenerVersiculosCapitulo(versionBiblia, libroSeleccionado.archivo, capituloActual).then(setVersiculosCapitulo);
          }
        } catch (err) {
          console.warn(`Error al leer archivo bíblico ${file.name}:`, err);
        }
      };
      reader.readAsText(file);
    });
  };

  // Filtered books
  const librosFiltrados = useMemo(() => {
    const texto = normalizarTexto(busquedaLibro);
    return LIBROS_BIBLIA_COMPLETOS.filter(l => {
      const coincideTestamento = filtroTestamento === 'todos' || l.testamento === filtroTestamento;
      const coincideTexto = !texto || normalizarTexto(l.nombre).includes(texto);
      return coincideTestamento && coincideTexto;
    });
  }, [busquedaLibro, filtroTestamento]);

  // Filtered verses in active chapter
  const versiculosFiltrados = useMemo(() => {
    const texto = normalizarTexto(busquedaVersiculoTexto);
    if (!texto) return versiculosCapitulo;
    return versiculosCapitulo.filter(v => 
      String(v.numero) === texto || normalizarTexto(v.texto).includes(texto)
    );
  }, [versiculosCapitulo, busquedaVersiculoTexto]);

  // ==================== CANCIONES & SETLISTS ====================
  const [repertorio, setRepertorio] = useState<Song[]>(INITIAL_FEATURED_SONGS);
  const [cancionSeleccionada, setCancionSeleccionada] = useState<Song | null>(INITIAL_FEATURED_SONGS[0]);
  const [seccionActivaIdx, setSeccionActivaIdx] = useState<number>(-1);
  const [busquedaCanciones, setBusquedaCanciones] = useState<string>('');
  const [buscarEnLetra, setBuscarEnLetra] = useState<boolean>(false);
  const [setlistActual, setSetlistActual] = useState<string>('domingo');
  const [setlists, setSetlists] = useState<SetlistsState>(() => {
    const guardado = localStorage.getItem('lbc_setlists');
    if (guardado) {
      try { return JSON.parse(guardado); } catch (e) {}
    }
    return {
      general: [],
      miercoles: [INITIAL_FEATURED_SONGS[1], INITIAL_FEATURED_SONGS[5]],
      sabado: [INITIAL_FEATURED_SONGS[3], INITIAL_FEATURED_SONGS[7]],
      domingo: [INITIAL_FEATURED_SONGS[0], INITIAL_FEATURED_SONGS[2], INITIAL_FEATURED_SONGS[4]]
    };
  });

  const [mostrarModalNuevaCancion, setMostrarModalNuevaCancion] = useState<boolean>(false);
  const [nuevaTitulo, setNuevaTitulo] = useState<string>('');
  const [nuevaAutor, setNuevaAutor] = useState<string>('');
  const [nuevaLetra, setNuevaLetra] = useState<string>('');
  const songFileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize BroadcastChannel
  useEffect(() => {
    const canal = new BroadcastChannel('proyector_lbc');
    canalRef.current = canal;

    canal.onmessage = (event) => {
      const data = event.data;
      if (!data) return;
      if (data.accion === 'proyector_abierto' || data.accion === 'pong') {
        setProyectorConectado(true);
        // Sincronizar ajustes al proyector recién conectado
        enviarAlProyector({ accion: 'fondo', fondo: fondoActivo });
        emitirAjustesProyector({
          fuente: fuenteProyector,
          colorTexto: colorTextoProyector,
          sombraTexto,
          alineacion: alineacionProyector,
          tamano: tamanoFuente
        });
      }
    };

    enviarAlProyector({ accion: 'ping' });
    cargarCancionesIniciales();

    return () => { canal.close(); };
  }, []);

  const cargarCancionesIniciales = async () => {
    const guardado = localStorage.getItem('proyector_lbc_canciones');
    if (guardado) {
      try {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRepertorio(parsed);
          setCancionSeleccionada(parsed[0]);
          return;
        }
      } catch (e) {}
    }

    try {
      let todas: Song[] = [];
      const resp1 = await fetch('/data/cancioneros/Corario.json');
      if (resp1.ok) {
        const d1 = await resp1.json();
        todas = todas.concat(parsearCancionesDesdeJSON(d1, 'Corario'));
      }
      const resp2 = await fetch('/data/cancioneros/Mi%20Cancionero.json');
      if (resp2.ok) {
        const d2 = await resp2.json();
        todas = todas.concat(parsearCancionesDesdeJSON(d2, 'Mi Cancionero'));
      }
      if (todas.length > 0) {
        const map = new Map<string, Song>();
        todas.forEach(c => map.set(c.title.toLowerCase(), c));
        const finalSongs = Array.from(map.values());
        setRepertorio(finalSongs);
        setCancionSeleccionada(finalSongs[0]);
        localStorage.setItem('proyector_lbc_canciones', JSON.stringify(finalSongs));
      }
    } catch (e) {}
  };

  const handleArchivosCanciones = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    let cargados = 0;
    const nuevasCanciones: Song[] = [];

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const raw = JSON.parse(event.target?.result as string);
          const parsed = parsearCancionesDesdeJSON(raw, file.name);
          nuevasCanciones.push(...parsed);
          cargados++;

          if (cargados === files.length) {
            const map = new Map<string, Song>();
            repertorio.forEach(c => map.set(c.title.toLowerCase(), c));
            nuevasCanciones.forEach(c => map.set(c.title.toLowerCase(), c));
            const finalLista = Array.from(map.values());
            setRepertorio(finalLista);
            setCancionSeleccionada(finalLista[0]);
            localStorage.setItem('proyector_lbc_canciones', JSON.stringify(finalLista));
            mostrarToast(`¡Se cargaron ${nuevasCanciones.length} canciones desde tus archivos JSON! Total: ${finalLista.length}`);
          }
        } catch (err) {
          mostrarToast(`Error al leer archivo ${file.name}`, 'error');
        }
      };
      reader.readAsText(file);
    });
  };

  const cancionesFiltradas = useMemo(() => {
    return buscarCanciones(repertorio, busquedaCanciones, buscarEnLetra);
  }, [repertorio, busquedaCanciones, buscarEnLetra]);

  const proyectarEstrofa = (seccion: SongSection, cancion: Song, indice: number) => {
    setSeccionActivaIdx(indice);
    setIsBlackout(false);

    const textoEstrofa = seccion.lines.join('\n');

    setProyeccionActual({
      id: `${cancion.id}-sec-${indice}`,
      tipo: 'cancion',
      texto: textoEstrofa,
      pie: `🎵 ${cancion.title} (${seccion.label})`,
      titulo: cancion.title
    });

    try {
      localStorage.setItem('proyector_lbc_actual', JSON.stringify({
        texto: textoEstrofa,
        tipo: 'cancion',
        pie: ''
      }));
    } catch (e) {}

    enviarAlProyector({
      accion: 'mostrar',
      texto: textoEstrofa,
      tipo: 'cancion',
      pie: ''
    });
  };

  const avanzarEstrofa = () => {
    if (!cancionSeleccionada || !cancionSeleccionada.sections) return;
    if (seccionActivaIdx < cancionSeleccionada.sections.length - 1) {
      const siguiente = seccionActivaIdx + 1;
      proyectarEstrofa(cancionSeleccionada.sections[siguiente], cancionSeleccionada, siguiente);
    }
  };

  const retrocederEstrofa = () => {
    if (!cancionSeleccionada || !cancionSeleccionada.sections) return;
    if (seccionActivaIdx > 0) {
      const previo = seccionActivaIdx - 1;
      proyectarEstrofa(cancionSeleccionada.sections[previo], cancionSeleccionada, previo);
    }
  };

  const toggleBlackout = () => {
    const nuevo = !isBlackout;
    setIsBlackout(nuevo);
    enviarAlProyector({ accion: 'blackout', activo: nuevo });
  };

  const limpiarPantalla = () => {
    setProyeccionActual(null);
    setSeccionActivaIdx(-1);
    setImagenActivaIdx(-1);
    try {
      localStorage.removeItem('proyector_lbc_actual');
    } catch (e) {}
    enviarAlProyector({ accion: 'limpiar' });
  };

  // Diapositivas & Galería de Imágenes (Canva, Avisos, Banners)
  const [imagenesGuardadas, setImagenesGuardadas] = useState<SlideItem[]>(() => {
    const guardado = localStorage.getItem('lbc_imagenes_guardadas');
    if (guardado) {
      try {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DIAPOSITIVAS_INICIALES;
  });
  const [imagenActivaIdx, setImagenActivaIdx] = useState<number>(-1);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);

  const proyectarImagen = (slide: SlideItem, idx: number) => {
    setImagenActivaIdx(idx);
    setIsBlackout(false);
    setProyeccionActual({
      id: slide.id,
      tipo: 'imagen',
      texto: slide.titulo,
      titulo: slide.titulo,
      url: slide.dataUrl
    });

    try {
      localStorage.setItem('proyector_lbc_actual', JSON.stringify({
        texto: slide.titulo,
        tipo: 'imagen',
        url: slide.dataUrl
      }));
    } catch (e) {}

    enviarAlProyector({
      accion: 'mostrarMedia',
      tipo: 'imagen',
      url: slide.dataUrl,
      titulo: slide.titulo
    });
    mostrarToast(`Proyectando: "${slide.titulo}"`);
  };

  const eliminarImagen = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const slide = imagenesGuardadas.find(img => img.id === id);
    if (!slide) return;
    const nuevas = imagenesGuardadas.filter(img => img.id !== id);
    setImagenesGuardadas(nuevas);
    try {
      localStorage.setItem('lbc_imagenes_guardadas', JSON.stringify(nuevas));
    } catch (err) {}

    if (proyeccionActual?.id === id) {
      limpiarPantalla();
    }
    mostrarToast(`Imagen "${slide.titulo}" eliminada`, 'info');
  };

  const handleSubirImagenes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files).filter(file => {
      const isImg = (file.type && file.type.startsWith('image/')) ||
                    /\.(png|jpe?g|webp|gif|bmp|svg|jfif|tif|tiff)$/i.test(file.name);
      return isImg;
    });

    if (filesArray.length === 0) {
      mostrarToast('Por favor selecciona archivos de imagen válidos (PNG, JPG, WebP)', 'error');
      return;
    }

    let procesados = 0;
    const nuevosItems: SlideItem[] = [];

    const finalizarCarga = () => {
      if (nuevosItems.length === 0) return;
      setImagenesGuardadas(prev => {
        const combinadas = [...nuevosItems, ...prev];
        try {
          // Limitamos el historial guardado en localStorage a las últimas 35 imágenes para máxima seguridad
          localStorage.setItem('lbc_imagenes_guardadas', JSON.stringify(combinadas.slice(0, 35)));
        } catch (err) {
          console.warn('Storage limit warning, kept in memory:', err);
        }
        return combinadas;
      });
      mostrarToast(`¡Se agregaron ${nuevosItems.length} imágenes a tu galería local!`);
    };

    filesArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        if (!rawDataUrl) {
          procesados++;
          if (procesados === filesArray.length) finalizarCarga();
          return;
        }

        // Optimizar y comprimir imágenes pesadas de Canva mediante un Canvas off-screen
        const img = new window.Image();
        img.onload = () => {
          let targetW = img.naturalWidth || img.width;
          let targetH = img.naturalHeight || img.height;
          const maxDim = 1920;

          if (targetW > maxDim || targetH > maxDim) {
            if (targetW > targetH) {
              targetH = Math.round((targetH * maxDim) / targetW);
              targetW = maxDim;
            } else {
              targetW = Math.round((targetW * maxDim) / targetH);
              targetH = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          let finalDataUrl = rawDataUrl;

          if (ctx) {
            ctx.drawImage(img, 0, 0, targetW, targetH);
            // Comprimir a JPEG 0.85 para ahorrar 90% de memoria manteniendo nitidez en pantalla
            finalDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          }

          const nombreLimpio = file.name.replace(/\.[^/.]+$/, '');
          nuevosItems.push({
            id: `slide-custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            titulo: nombreLimpio,
            categoria: 'evento',
            fecha: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
            dataUrl: finalDataUrl,
            esPredeterminado: false
          });

          procesados++;
          if (procesados === filesArray.length) finalizarCarga();
        };

        img.onerror = () => {
          const nombreLimpio = file.name.replace(/\.[^/.]+$/, '');
          nuevosItems.push({
            id: `slide-custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            titulo: nombreLimpio,
            categoria: 'evento',
            fecha: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
            dataUrl: rawDataUrl,
            esPredeterminado: false
          });
          procesados++;
          if (procesados === filesArray.length) finalizarCarga();
        };

        img.src = rawDataUrl;
      };

      reader.readAsDataURL(file);
    });

    if (imageFileInputRef.current) imageFileInputRef.current.value = '';
  };

  const avanzarImagen = () => {
    if (!imagenesGuardadas || imagenesGuardadas.length === 0) return;
    const sig = (imagenActivaIdx + 1) % imagenesGuardadas.length;
    proyectarImagen(imagenesGuardadas[sig], sig);
  };

  const retrocederImagen = () => {
    if (!imagenesGuardadas || imagenesGuardadas.length === 0) return;
    const ant = imagenActivaIdx <= 0 ? imagenesGuardadas.length - 1 : imagenActivaIdx - 1;
    proyectarImagen(imagenesGuardadas[ant], ant);
  };

  // Navegación secuencial por versículos de la Biblia
  const avanzarVersiculo = () => {
    if (!versiculosCapitulo || versiculosCapitulo.length === 0) return;
    const idx = versiculosCapitulo.findIndex(v => v.numero === versiculoActivoNum);
    if (idx !== -1 && idx < versiculosCapitulo.length - 1) {
      proyectarVersiculo(versiculosCapitulo[idx + 1]);
    }
  };

  const retrocederVersiculo = () => {
    if (!versiculosCapitulo || versiculosCapitulo.length === 0) return;
    const idx = versiculosCapitulo.findIndex(v => v.numero === versiculoActivoNum);
    if (idx > 0) {
      proyectarVersiculo(versiculosCapitulo[idx - 1]);
    }
  };

  // Safe multi-environment projector opener (Browser, Electron, file:// protocol)
  const abrirVentanaProyector = () => {
    let url = 'display.html';
    if (window.location.protocol === 'file:') {
      url = window.location.href.replace(/index\.html.*/i, 'display.html');
    } else if (window.location.href.includes('index.html')) {
      url = window.location.href.replace(/index\.html.*/i, 'display.html');
    } else {
      url = '/display.html';
    }
    window.open(url, 'ProyectorLBC', 'width=1280,height=720,menubar=no,toolbar=no,location=no');
    setProyectorConectado(true);

    // Enviar de inmediato estado actual después de abrir
    setTimeout(() => {
      enviarAlProyector({
        accion: 'fondo',
        fondo: fondoActivo,
        tipoFondo: tipoFondoActivo,
        modoAjuste: modoAjusteFondo,
        opacidadScrim: oscurecedorFondo
      });
      emitirAjustesProyector({
        fuente: fuenteProyector,
        colorTexto: colorTextoProyector,
        sombraTexto,
        alineacion: alineacionProyector,
        tamano: tamanoFuente
      });
      if (proyeccionActual) {
        if (proyeccionActual.tipo === 'imagen') {
          enviarAlProyector({
            accion: 'mostrarMedia',
            tipo: 'imagen',
            url: proyeccionActual.url,
            titulo: ''
          });
        } else if (proyeccionActual.tipo === 'biblia') {
          enviarAlProyector({
            accion: 'mostrar',
            texto: proyeccionActual.texto,
            pie: proyeccionActual.pie,
            tipo: 'biblia'
          });
        } else {
          enviarAlProyector({
            accion: 'mostrar',
            texto: proyeccionActual.texto,
            pie: '',
            tipo: 'cancion'
          });
        }
      }
    }, 400);
  };

  const cambiarTamanoFuente = (nuevoTamano: number) => {
    setTamanoFuente(nuevoTamano);
    try {
      localStorage.setItem('lbc_tamano_fuente', String(nuevoTamano));
    } catch (e) {}
    enviarAlProyector({ accion: 'tamanoFuente', tamano: nuevoTamano });
  };

  const cambiarModoAjusteFondo = (modo: 'contain' | 'cover') => {
    setModoAjusteFondo(modo);
    try {
      localStorage.setItem('lbc_modo_ajuste_fondo', modo);
    } catch (e) {}
    enviarAlProyector({ accion: 'ajusteFondo', modoAjuste: modo, opacidadScrim: oscurecedorFondo });
    mostrarToast(`Modo de fondo: ${modo === 'contain' ? 'Completo sin cortar (Contain)' : 'Rellenar pantalla (Cover)'}`, 'info');
  };

  const cambiarOscurecedorFondo = (val: number) => {
    setOscurecedorFondo(val);
    try {
      localStorage.setItem('lbc_scrim_fondo', String(val));
    } catch (e) {}
    enviarAlProyector({ accion: 'ajusteFondo', modoAjuste: modoAjusteFondo, opacidadScrim: val });
  };

  const seleccionarFondo = (fondo: BackgroundPreset) => {
    const bg = fondo.url || fondo.cssBackground || '';
    const tipo = fondo.tipo || (bg.startsWith('anim-') ? 'anim' : bg.startsWith('video:') ? 'video' : 'estatico');
    setFondoActivo(bg);
    setTipoFondoActivo(tipo);
    try {
      localStorage.setItem('lbc_fondo_activo', bg);
      localStorage.setItem('lbc_tipo_fondo', tipo);
    } catch (e) {}
    enviarAlProyector({
      accion: 'fondo',
      fondo: bg,
      tipoFondo: tipo,
      modoAjuste: modoAjusteFondo,
      opacidadScrim: oscurecedorFondo
    });
    mostrarToast(`Fondo "${fondo.nombre}" activado en el proyector`);
  };

  const handleSubirFondo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const esVideo = file.type.startsWith('video/') || /\.(mp4|webm)$/i.test(file.name);
    const esImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|jfif)$/i.test(file.name);

    if (!esVideo && !esImg) {
      mostrarToast('Selecciona una imagen (PNG, JPG) o un video en bucle (MP4, WebM)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const nombreLimpio = file.name.replace(/\.[^/.]+$/, '');
      const nuevoFondo: BackgroundPreset = {
        id: `fondo-custom-${Date.now()}`,
        nombre: nombreLimpio,
        categoria: esVideo ? 'animado' : 'adoracion',
        url: esVideo ? '' : dataUrl,
        cssBackground: esVideo ? `video:${dataUrl}` : dataUrl,
        tipo: esVideo ? 'video' : 'estatico',
        esSubido: true
      };

      setFondosPersonalizados(prev => {
        const actualizados = [nuevoFondo, ...prev];
        try {
          localStorage.setItem('lbc_fondos_subidos', JSON.stringify(actualizados.slice(0, 10)));
        } catch (err) {
          console.warn('LocalStorage limit for backgrounds, keeping in memory', err);
        }
        return actualizados;
      });

      seleccionarFondo(nuevoFondo);
      mostrarToast(`¡Nuevo fondo ${esVideo ? 'animado en video' : 'visual'} agregado y activado!`);
    };

    reader.readAsDataURL(file);
    if (fondoFileInputRef.current) fondoFileInputRef.current.value = '';
  };

  const eliminarFondoPersonalizado = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFondosPersonalizados(prev => {
      const filtrados = prev.filter(f => f.id !== id);
      try {
        localStorage.setItem('lbc_fondos_subidos', JSON.stringify(filtrados));
      } catch (err) {}
      return filtrados;
    });
    mostrarToast('Fondo personalizado eliminado', 'info');
  };

  // Manejadores para YouTube
  const extraerYoutubeId = (url: string) => {
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regExp);
    return match ? match[1] : '';
  };

  const cargarVideoYoutube = () => {
    const id = extraerYoutubeId(youtubeInputUrl);
    if (!id) {
      mostrarToast('Enlace de YouTube no válido. Pega un enlace completo (ej: https://www.youtube.com/watch?v=...)', 'error');
      return;
    }
    setYoutubeVideoId(id);
    mostrarToast('Video de YouTube listo para proyectar');
  };

  const proyectarYoutubeEnProyector = () => {
    const id = youtubeVideoId || extraerYoutubeId(youtubeInputUrl);
    if (!id) {
      mostrarToast('Por favor pega un enlace de YouTube válido primero', 'error');
      return;
    }
    setYoutubeVideoId(id);
    setYoutubeEnProyector(true);
    setVideoEnProyector(false);
    setIsBlackout(false);

    enviarAlProyector({
      accion: 'mostrarMedia',
      tipo: 'youtube',
      youtubeId: id,
      url: `https://www.youtube.com/watch?v=${id}`
    });
    mostrarToast('Video de YouTube transmitido a la pantalla del proyector');
  };

  const detenerYoutubeEnProyector = () => {
    setYoutubeEnProyector(false);
    enviarAlProyector({ accion: 'detenerMedia' });
    limpiarPantalla();
    mostrarToast('Proyección de YouTube detenida');
  };

  // Keyboard navigation contextualizada al módulo activo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        if (moduloActivo === 'biblia' || proyeccionActual?.tipo === 'biblia') {
          avanzarVersiculo();
        } else if (moduloActivo === 'anuncios' || proyeccionActual?.tipo === 'imagen') {
          avanzarImagen();
        } else {
          avanzarEstrofa();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        if (moduloActivo === 'biblia' || proyeccionActual?.tipo === 'biblia') {
          retrocederVersiculo();
        } else if (moduloActivo === 'anuncios' || proyeccionActual?.tipo === 'imagen') {
          retrocederImagen();
        } else {
          retrocederEstrofa();
        }
      } else if (e.key === 'b' || e.key === 'B' || e.key === 'F5') {
        e.preventDefault();
        toggleBlackout();
      } else if (e.key === 'c' || e.key === 'C' || e.key === 'F4' || e.key === 'Escape') {
        e.preventDefault();
        limpiarPantalla();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancionSeleccionada, seccionActivaIdx, moduloActivo, proyeccionActual, versiculosCapitulo, versiculoActivoNum, imagenesGuardadas, imagenActivaIdx, isBlackout]);


  // Video player state
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoPlaying, setVideoPlaying] = useState<boolean>(false);
  const [videoVolume, setVideoVolume] = useState<number>(100);
  const [videoLoop, setVideoLoop] = useState<boolean>(true);
  const [videoEnProyector, setVideoEnProyector] = useState<boolean>(false);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const proyectarVideoEnProyector = () => {
    if (!videoUrl) return;
    setIsBlackout(false);
    setVideoEnProyector(true);
    setProyeccionActual({
      id: `video-${Date.now()}`,
      tipo: 'video',
      texto: 'Reproduciendo Video de Culto',
      titulo: 'Video en Pantalla'
    });
    enviarAlProyector({
      accion: 'mostrarMedia',
      tipo: 'video',
      url: videoUrl,
      loop: videoLoop,
      conAudio: videoVolume > 0,
      volumen: videoVolume / 100
    });
    mostrarToast('Video transmitido a la pantalla del proyector');
  };

  const detenerVideoEnProyector = () => {
    setVideoEnProyector(false);
    enviarAlProyector({ accion: 'detenerMedia' });
    limpiarPantalla();
    mostrarToast('Proyección de video finalizada');
  };

  // ==================== KARAOKE & PISTAS AUDIO ====================
  const [karaokeCancion, setKaraokeCancion] = useState<Song>(INITIAL_FEATURED_SONGS[0]);
  const [karaokePistaUrl, setKaraokePistaUrl] = useState<string>('');
  const [karaokePistaNombre, setKaraokePistaNombre] = useState<string>('Pista Instrumental de Alabanza (Audio)');
  const [karaokePlaying, setKaraokePlaying] = useState<boolean>(false);
  const [karaokeCurrentTime, setKaraokeCurrentTime] = useState<number>(0);
  const [karaokeDuration, setKaraokeDuration] = useState<number>(180);
  const [karaokeVolume, setKaraokeVolume] = useState<number>(85);
  const [karaokeMuted, setKaraokeMuted] = useState<boolean>(false);
  const [karaokeSeccionIdx, setKaraokeSeccionIdx] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const toggleKaraokePlay = () => {
    if (audioRef.current && karaokePistaUrl) {
      if (karaokePlaying) {
        audioRef.current.pause();
        setKaraokePlaying(false);
      } else {
        audioRef.current.play().then(() => setKaraokePlaying(true)).catch(() => {});
      }
    } else {
      setKaraokePlaying(!karaokePlaying);
      mostrarToast(karaokePlaying ? 'Pista en pausa' : 'Reproduciendo pista de alabanza...', 'info');
    }
  };

  const stopKaraoke = () => {
    if (audioRef.current && karaokePistaUrl) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setKaraokePlaying(false);
    setKaraokeCurrentTime(0);
  };

  // Free text / Announcements
  const [textoLibre, setTextoLibre] = useState<string>('');
  const proyectarTextoManual = () => {
    if (!textoLibre.trim()) return;
    setProyeccionActual({
      id: `texto-${Date.now()}`,
      tipo: 'texto',
      texto: textoLibre,
      titulo: 'Anuncio / Aviso'
    });
    setIsBlackout(false);

    try {
      localStorage.setItem('proyector_lbc_actual', JSON.stringify({
        texto: textoLibre,
        tipo: 'texto'
      }));
    } catch (e) {}

    enviarAlProyector({
      accion: 'mostrar',
      texto: textoLibre,
      tipo: 'texto'
    });
  };

  const setlistItems = setlists[setlistActual] || [];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-blue-600 selection:text-white ${
      temaOperador === 'claro' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Toast Notification */}
      {notificacion && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
          notificacion.tipo === 'error'
            ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
            : notificacion.tipo === 'info'
            ? 'bg-blue-950/90 text-blue-200 border-blue-500/50'
            : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
        }`}>
          {notificacion.tipo === 'error' ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span>{notificacion.texto}</span>
        </div>
      )}

      {/* Hidden inputs */}
      <input type="file" ref={songFileInputRef} onChange={handleArchivosCanciones} multiple accept=".json" className="hidden" />
      <input type="file" ref={bibleFileInputRef} onChange={handleCargaArchivosBiblia} multiple accept=".json" className="hidden" />
      <input type="file" ref={folderInputRef} onChange={handleCargaArchivosBiblia} multiple {...({ webkitdirectory: '', directory: '' } as any)} className="hidden" />
      <input type="file" ref={imageFileInputRef} onChange={handleSubirImagenes} multiple accept="image/*" className="hidden" />
      <input type="file" ref={fondoFileInputRef} onChange={handleSubirFondo} accept="image/*,video/mp4,video/webm" className="hidden" />
      <input type="file" ref={videoInputRef} onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) setVideoUrl(URL.createObjectURL(file));
      }} accept="video/*" className="hidden" />
      <input type="file" ref={audioInputRef} onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          setKaraokePistaUrl(URL.createObjectURL(file));
          setKaraokePistaNombre(file.name);
          mostrarToast(`Pista de audio "${file.name}" cargada`);
        }
      }} accept="audio/*" className="hidden" />

      {/* Audio element for Karaoke */}
      {karaokePistaUrl && (
        <audio
          ref={audioRef}
          src={karaokePistaUrl}
          onTimeUpdate={(e) => setKaraokeCurrentTime((e.target as HTMLAudioElement).currentTime)}
          onLoadedMetadata={(e) => setKaraokeDuration((e.target as HTMLAudioElement).duration)}
          onEnded={() => setKaraokePlaying(false)}
        />
      )}

      {/* ==================== BARRA SUPERIOR (HEADER) ==================== */}
      <header className={`border-b sticky top-0 z-40 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md ${
        temaOperador === 'claro' ? 'border-slate-300 bg-white text-slate-800' : 'border-slate-800/80 bg-slate-900/95 text-slate-100'
      }`}>
        {/* Church Brand & Logo (Adaptive high-contrast branding) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => setModuloActivo('portada')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600 via-blue-600 to-amber-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              ✝
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`font-extrabold text-sm tracking-tight ${temaOperador === 'claro' ? 'text-slate-950' : 'text-white'}`}>
                  {nombreCongregacion}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  LBC
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Proyector LBC • {horaActual}</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-slate-700/40 text-[11px] text-slate-400">
            <span>Creado por: <strong className="text-amber-400 font-bold">LuftmandMauricio</strong></span>
          </div>
        </div>

        {/* Function Modules Tabs */}
        <nav className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${
          temaOperador === 'claro' ? 'bg-slate-200 border-slate-300' : 'bg-slate-950/80 border-slate-800'
        }`}>
          {[
            { id: 'portada', label: 'Portada', icon: Home },
            { id: 'biblia', label: 'Biblia (66 Libros)', icon: BookOpen },
            { id: 'canciones', label: 'Canciones', icon: Music },
            { id: 'fondos', label: 'Fondos', icon: Image },
            { id: 'video', label: 'Video', icon: Video },
            { id: 'karaoke', label: 'Karaoke', icon: Mic },
            { id: 'anuncios', label: 'Diapositivas & Canva', icon: Sparkles },
            { id: 'obs', label: 'OBS Studio', icon: Radio },
            { id: 'config', label: 'Ajustes', icon: Settings }
          ].map((item) => {
            const Icon = item.icon;
            const activo = moduloActivo === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setModuloActivo(item.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activo
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : temaOperador === 'claro'
                    ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-300'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Projection Controls */}
        <div className="flex items-center gap-2">
          {/* Font Size Slider */}
          <div className={`hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] ${
            temaOperador === 'claro' ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-950/60 border-slate-800 text-slate-400'
          }`}>
            <span>A</span>
            <input
              type="range"
              min="32"
              max="76"
              value={tamanoFuente}
              onChange={(e) => cambiarTamanoFuente(Number(e.target.value))}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              title={`Tamaño de letra en proyector: ${tamanoFuente}px`}
            />
            <span className="text-sm font-bold">A</span>
          </div>

          {/* Blackout (B / F5) */}
          <button
            onClick={toggleBlackout}
            title="Presiona 'B' o F5 para pantalla negra de inmediato"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
              isBlackout
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30'
                : temaOperador === 'claro'
                ? 'bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-500'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
            }`}
          >
            {isBlackout ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-amber-500" />}
            <span>{isBlackout ? 'BLACKOUT' : 'Blackout (B)'}</span>
          </button>

          {/* Limpiar (C / F4) */}
          <button
            onClick={limpiarPantalla}
            title="Presiona 'C' o F4 para limpiar texto de la pantalla"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 transition cursor-pointer"
          >
            <span>Limpiar (C)</span>
          </button>

          {/* Abrir Proyector */}
          <button
            onClick={abrirVentanaProyector}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shadow transition cursor-pointer"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>🖥️ Proyector</span>
          </button>

          {/* Botón Centro de Ayuda (?) */}
          <button
            onClick={() => setMostrarAyuda(true)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
              temaOperador === 'claro'
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'bg-blue-950/60 text-blue-300 border-blue-800/80 hover:bg-blue-900/60'
            }`}
            title="Abrir Manual de Ayuda y Atajos de Teclado"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>Ayuda</span>
          </button>

          {/* Botón ZIP Opcional en Cabecera */}
          {mostrarBotonZip && (
            <a
              href="/Proyector-LBC-Completo.zip"
              download="Proyector-LBC-Completo.zip"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition"
              title="Descargar paquete ZIP para llevar a otra computadora"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ZIP</span>
            </a>
          )}
        </div>
      </header>

      {/* ==================== CUERPO PRINCIPAL ==================== */}
      <main className="flex-1 p-3.5 max-w-[1850px] w-full mx-auto">
        
        {/* ==================== MÓDULO 1: PORTADA CUADRANGULAR ==================== */}
        {moduloActivo === 'portada' && (
          <div className="flex flex-col items-center justify-center min-h-[72vh] text-center px-4 space-y-6">
            <div className="relative">
              <img
                src="assets/logo_cuadrangular_icono.png"
                alt="Emblema Iglesia Cuadrangular"
                className="w-32 h-32 md:w-44 md:h-44 object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'assets/logo_cuadrangular_4simbolos.png';
                }}
              />
            </div>

            <div className="space-y-2 max-w-2xl">
              <h1 className={`text-2xl md:text-4xl font-black tracking-tight ${temaOperador === 'claro' ? 'text-slate-900' : 'text-white'}`}>
                {nombreCongregacion}
              </h1>
              <h2 className="text-lg md:text-xl font-bold text-amber-500">
                Barrio Las Brisas • Proyector LBC
              </h2>
              <p className={`text-sm italic font-serif ${temaOperador === 'claro' ? 'text-slate-600' : 'text-slate-300'}`}>
                "Jesucristo es el mismo ayer, y hoy, y por los siglos."
                <span className="block not-italic text-xs text-amber-500 font-sans mt-0.5 font-bold">— Hebreos 13:8</span>
              </p>
            </div>

            {/* 4 Pillars of Foursquare Gospel (Alto contraste tanto en Modo Oscuro como en Modo Claro) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl w-full text-xs">
              <div className={`p-3.5 rounded-xl border space-y-1 transition ${
                temaOperador === 'claro'
                  ? 'bg-red-50 border-red-300 text-red-950 shadow-sm'
                  : 'bg-red-950/40 border-red-500/40 text-red-200'
              }`}>
                <span className={`font-extrabold block text-sm ${temaOperador === 'claro' ? 'text-red-700' : 'text-red-400'}`}>✝ La Cruz</span>
                <p className={`text-[11px] ${temaOperador === 'claro' ? 'text-red-900 font-semibold' : 'text-red-200/80'}`}>Jesucristo es el Salvador</p>
              </div>

              <div className={`p-3.5 rounded-xl border space-y-1 transition ${
                temaOperador === 'claro'
                  ? 'bg-blue-50 border-blue-300 text-blue-950 shadow-sm'
                  : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
              }`}>
                <span className={`font-extrabold block text-sm ${temaOperador === 'claro' ? 'text-blue-700' : 'text-blue-400'}`}>🏆 La Copa</span>
                <p className={`text-[11px] ${temaOperador === 'claro' ? 'text-blue-900 font-semibold' : 'text-blue-200/80'}`}>Jesucristo es el Sanador</p>
              </div>

              <div className={`p-3.5 rounded-xl border space-y-1 transition ${
                temaOperador === 'claro'
                  ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-sm'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}>
                <span className={`font-extrabold block text-sm ${temaOperador === 'claro' ? 'text-amber-800' : 'text-amber-400'}`}>🕊 La Paloma</span>
                <p className={`text-[11px] ${temaOperador === 'claro' ? 'text-amber-900 font-semibold' : 'text-amber-200/80'}`}>Bautizador con el Espíritu Santo</p>
              </div>

              <div className={`p-3.5 rounded-xl border space-y-1 transition ${
                temaOperador === 'claro'
                  ? 'bg-purple-50 border-purple-300 text-purple-950 shadow-sm'
                  : 'bg-purple-950/40 border-purple-500/40 text-purple-200'
              }`}>
                <span className={`font-extrabold block text-sm ${temaOperador === 'claro' ? 'text-purple-700' : 'text-purple-400'}`}>👑 La Corona</span>
                <p className={`text-[11px] ${temaOperador === 'claro' ? 'text-purple-900 font-semibold' : 'text-purple-200/80'}`}>Jesucristo es el Rey que Viene</p>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setModuloActivo('biblia')}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Explorar Sagradas Escrituras (66 Libros)</span>
              </button>

              <button
                onClick={() => setModuloActivo('canciones')}
                className={`px-5 py-3 rounded-xl border font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                  temaOperador === 'claro'
                    ? 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-700'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>Canciones & Setlists ({repertorio.length})</span>
              </button>

              <button
                onClick={() => setModuloActivo('fondos')}
                className={`px-5 py-3 rounded-xl border font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                  temaOperador === 'claro'
                    ? 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-teal-300 border-slate-700'
                }`}
              >
                <Image className="w-4 h-4" />
                <span>Fondos Visuales</span>
              </button>

              <button
                onClick={abrirVentanaProyector}
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <Monitor className="w-4 h-4" />
                <span>Abrir Pantalla del Proyector</span>
              </button>
            </div>

            {/* Creador del Software */}
            <div className="pt-4 text-center space-y-1">
              <p className={`text-xs font-semibold ${temaOperador === 'claro' ? 'text-slate-600' : 'text-slate-400'}`}>
                Creado por: <strong className="text-amber-500 font-bold">LuftmandMauricio</strong>
              </p>
              <p className="text-[10px] text-slate-500">
                Iglesia Cristiana Cuadrangular Barrio Las Brisas • Proyector LBC © 2026
              </p>
            </div>
          </div>
        )}

        {/* ==================== MÓDULO 2: BIBLIA COMPLETA (66 LIBROS) ==================== */}
        {moduloActivo === 'biblia' && (
          <div className="flex flex-col gap-2.5 h-[calc(100vh-105px)] pb-1">
            
            {/* Top Toolbar for Bible */}
            <div className={`border rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-md flex-shrink-0 ${
              temaOperador === 'claro' ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900/90 border-slate-800 text-white'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  Sagradas Escrituras (66 Libros)
                </span>
                <span className="text-[11px] text-slate-400 hidden lg:inline">
                  • Selecciona libro, capítulo y versículo para proyectar en vivo
                </span>
              </div>

              {/* Bible Importer Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => folderInputRef.current?.click()}
                  title="Carga la carpeta 'data/biblia' o 'versiones' de tu computadora para tener los 66 libros completos en memoria"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>📂 Cargar Carpeta data/biblia (66 Libros)</span>
                </button>

                <button
                  onClick={() => bibleFileInputRef.current?.click()}
                  title="Cargar archivos JSON individuales de libros"
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-xs border transition cursor-pointer ${
                    temaOperador === 'claro' ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Cargar Archivo(s) JSON</span>
                </button>
              </div>
            </div>

            {/* 4 Columns Area */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 flex-1 overflow-hidden">
              
              {/* Columna 1: Libros (39 Antiguo / 27 Nuevo) (3 cols) */}
              <div className={`xl:col-span-3 border rounded-2xl p-3 flex flex-col gap-2 overflow-hidden shadow-xl ${
                temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
              }`}>
                {/* Search book */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={busquedaLibro}
                    onChange={(e) => setBusquedaLibro(e.target.value)}
                    placeholder="Buscar libro bíblico..."
                    className={`w-full pl-8 pr-7 py-1.5 border rounded-xl text-xs focus:outline-none focus:border-blue-500 ${
                      temaOperador === 'claro' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                  {busquedaLibro && (
                    <button onClick={() => setBusquedaLibro('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs">
                      ✕
                    </button>
                  )}
                </div>

                {/* Testament Tabs */}
                <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl border text-[11px] font-bold text-center ${
                  temaOperador === 'claro' ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <button
                    onClick={() => setFiltroTestamento(filtroTestamento === 'antiguo' ? 'todos' : 'antiguo')}
                    className={`py-1 rounded-lg transition ${
                      filtroTestamento === 'antiguo' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    ANTIGUO (39)
                  </button>
                  <button
                    onClick={() => setFiltroTestamento(filtroTestamento === 'nuevo' ? 'todos' : 'nuevo')}
                    className={`py-1 rounded-lg transition ${
                      filtroTestamento === 'nuevo' ? 'bg-amber-500 text-slate-950 font-black shadow' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    NUEVO (27)
                  </button>
                </div>

                {/* Books Scroll List */}
                <div className="flex-1 overflow-y-auto space-y-1 pr-1 pb-10">
                  {librosFiltrados.map((libro) => {
                    const isSelected = libroSeleccionado.id === libro.id;
                    return (
                      <button
                        key={libro.id}
                        onClick={() => {
                          setLibroSeleccionado(libro);
                          setCapituloActual('1');
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-semibold text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/30'
                            : temaOperador === 'claro'
                            ? 'bg-slate-50 text-slate-800 hover:bg-slate-200 border border-slate-200'
                            : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 border border-slate-800/60'
                        }`}
                      >
                        <span>{libro.nombre}</span>
                        <span className="text-[10px] opacity-60 font-mono">{libro.capitulos} cap</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Columna 2: Versiones y Capítulos (2 cols) */}
              <div className={`xl:col-span-2 border rounded-2xl p-3 flex flex-col gap-3 shadow-xl overflow-hidden ${
                temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                    VERSIÓN BÍBLICA
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {VERSIONES_BIBLIA.map((v) => (
                      <button
                        key={v.codigo}
                        onClick={() => setVersionBiblia(v.codigo)}
                        className={`py-1.5 rounded-lg text-xs font-black uppercase transition border ${
                          versionBiblia === v.codigo
                            ? 'bg-teal-500 text-slate-950 border-teal-400 shadow'
                            : temaOperador === 'claro'
                            ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {v.codigo}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chapters Grid with pb-24 so caps 49 and 50 are NEVER cut off */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      CAPÍTULOS ({libroSeleccionado.capitulos})
                    </label>
                    <span className="text-xs font-bold text-amber-500">{libroSeleccionado.nombre}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 flex-1 overflow-y-auto pr-1 pb-24">
                    {Array.from({ length: libroSeleccionado.capitulos }, (_, i) => String(i + 1)).map((cap) => {
                      const isSelected = capituloActual === cap;
                      return (
                        <button
                          key={cap}
                          onClick={() => setCapituloActual(cap)}
                          className={`h-9 rounded-lg text-xs font-black transition border flex items-center justify-center ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                              : temaOperador === 'claro'
                              ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {cap}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Columna 3: Versículos con texto completo (4 cols) */}
              <div className={`xl:col-span-4 border rounded-2xl p-3 flex flex-col gap-2 shadow-xl overflow-hidden ${
                temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <div className={`flex items-center justify-between border-b pb-2 ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-amber-500 uppercase">
                      VERSÍCULOS • {libroSeleccionado.nombre} {capituloActual}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 rounded ${temaOperador === 'claro' ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-300'}`}>
                      {versiculosFiltrados.length}
                    </span>
                  </div>

                  <div className="relative w-44">
                    <Search className="w-3 h-3 absolute left-2.5 top-2 text-slate-400" />
                    <input
                      type="text"
                      value={busquedaVersiculoTexto}
                      onChange={(e) => setBusquedaVersiculoTexto(e.target.value)}
                      placeholder="Filtrar versículo..."
                      className={`w-full pl-7 pr-2 py-1 border rounded-lg text-[11px] focus:outline-none ${
                        temaOperador === 'claro' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                      }`}
                    />
                  </div>
                </div>

                {/* Verses Scroll List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-16">
                  {versiculosFiltrados.map((ver) => {
                    const isProjecting = proyeccionActual?.id === `biblia-${libroSeleccionado.id}-${capituloActual}-${ver.numero}`;
                    return (
                      <div
                        key={ver.numero}
                        onClick={() => proyectarVersiculo(ver)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isProjecting
                            ? 'bg-blue-600/30 border-blue-400 text-white shadow-lg ring-2 ring-blue-500/50'
                            : temaOperador === 'claro'
                            ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                            : 'bg-slate-950/70 border-slate-800/80 text-slate-200 hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={`text-sm font-black font-mono w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                            isProjecting ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-teal-400 border border-slate-700'
                          }`}>
                            {ver.numero}
                          </span>
                          <p className="text-xs leading-relaxed flex-1 font-medium">
                            {ver.texto}
                          </p>
                        </div>
                        {isProjecting && (
                          <div className="mt-2 text-right">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                              PROYECTANDO EN VIVO
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Columna 4: Previsualización & Historial (3 cols) */}
              <div className="xl:col-span-3 flex flex-col gap-3 overflow-hidden">
                {/* Confidence Monitor Preview */}
                <div className={`border rounded-2xl p-3 shadow-xl flex flex-col ${
                  temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
                }`}>
                  <div className={`flex items-center justify-between border-b pb-1.5 mb-2 ${
                    temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'
                  }`}>
                    <span className={`text-xs font-black flex items-center gap-1.5 ${temaOperador === 'claro' ? 'text-slate-900' : 'text-white'}`}>
                      <Monitor className="w-3.5 h-3.5 text-emerald-500" />
                      PREVISUALIZACIÓN EN PANTALLA
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isBlackout ? 'bg-rose-500/20 text-rose-500' : proyeccionActual ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isBlackout ? 'BLACKOUT' : proyeccionActual ? 'EN VIVO' : 'EN ESPERA'}
                    </span>
                  </div>

                  <div className="h-44 rounded-xl border border-slate-800 bg-black flex flex-col justify-center items-center p-3 text-center">
                    {isBlackout ? (
                      <span className="text-xs font-mono text-slate-600 font-bold uppercase tracking-widest">
                        PANTALLA NEGRA (BLACKOUT)
                      </span>
                    ) : proyeccionActual ? (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-white line-clamp-4 leading-relaxed whitespace-pre-line">
                          {proyeccionActual.texto}
                        </p>
                        {proyeccionActual.pie && (
                          <span className="text-[10px] font-bold text-amber-400 block uppercase tracking-wide">
                            {proyeccionActual.pie}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1 text-slate-500">
                        <span className="text-xs font-semibold block">Sin proyección activa</span>
                        <span className="text-[10px]">Toca cualquier versículo para proyectar</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={toggleBlackout}
                      className="py-1.5 rounded-lg text-xs font-bold bg-slate-950 border border-slate-800 hover:bg-slate-800 text-amber-400 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Blackout (B)</span>
                    </button>
                    <button
                      onClick={limpiarPantalla}
                      className="py-1.5 rounded-lg text-xs font-bold bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/40 text-rose-300 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Limpiar (C)</span>
                    </button>
                  </div>
                </div>

                {/* History of projected verses */}
                <div className={`border rounded-2xl p-3 shadow-xl flex-1 flex flex-col overflow-hidden ${
                  temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
                }`}>
                  <div className={`flex items-center justify-between border-b pb-1.5 mb-2 ${
                    temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'
                  }`}>
                    <span className="text-xs font-black text-slate-500 uppercase">HISTORIAL DE CITAS</span>
                    {historialVersiculos.length > 0 && (
                      <button
                        onClick={() => setHistorialVersiculos([])}
                        className="text-[10px] text-rose-500 hover:underline"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 pb-10">
                    {historialVersiculos.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        No hay versículos en el historial aún
                      </div>
                    ) : (
                      historialVersiculos.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setProyeccionActual({
                              id: item.id,
                              tipo: 'biblia',
                              texto: `"${item.texto}"`,
                              pie: `— ${item.cita} (${item.version})`,
                              titulo: item.cita
                            });
                            enviarAlProyector({
                              accion: 'mostrar',
                              texto: `"${item.texto}"\n\n— ${item.cita} (${item.version})`,
                              tipo: 'biblia'
                            });
                          }}
                          className={`p-2 rounded-xl border text-left cursor-pointer transition text-xs space-y-1 ${
                            temaOperador === 'claro' ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-slate-950/60 border-slate-800/60 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold text-amber-500 text-[11px]">
                            <span>{item.cita}</span>
                            <span className="text-[9px] font-mono opacity-50">{item.hora}</span>
                          </div>
                          <p className="line-clamp-1 text-[11px] text-slate-400">{item.texto}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MÓDULO 3: CANCIONES & SETLISTS ==================== */}
        {moduloActivo === 'canciones' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 h-[calc(100vh-105px)]">
            {/* Columna 1: Cancionero & Búsqueda (4 cols) */}
            <div className={`xl:col-span-4 border rounded-2xl p-3 flex flex-col gap-2.5 overflow-hidden shadow-xl ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-black text-xs uppercase flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-amber-500" />
                  REPERTORIO ({repertorio.length})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => songFileInputRef.current?.click()}
                    title="Cargar archivo JSON (Corario.json o Mi Cancionero.json)"
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>+ Cargar JSON</span>
                  </button>
                  <button
                    onClick={() => setMostrarModalNuevaCancion(true)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Nueva</span>
                  </button>
                </div>
              </div>

              {/* Instant Real-Time Search */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={busquedaCanciones}
                    onChange={(e) => setBusquedaCanciones(e.target.value)}
                    placeholder="Buscar canción por título, coro o autor..."
                    className={`w-full pl-8 pr-7 py-1.5 border rounded-xl text-xs focus:outline-none focus:border-amber-500 ${
                      temaOperador === 'claro' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                  {busquedaCanciones && (
                    <button onClick={() => setBusquedaCanciones('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs">
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={buscarEnLetra}
                      onChange={(e) => setBuscarEnLetra(e.target.checked)}
                      className="rounded border-slate-700 accent-amber-500"
                    />
                    <span>Buscar dentro de las letras</span>
                  </label>
                  <span>{cancionesFiltradas.length} resultados</span>
                </div>
              </div>

              {/* Songs List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 pb-10">
                {cancionesFiltradas.map((cancion) => {
                  const isSelected = cancionSeleccionada?.id === cancion.id;
                  return (
                    <div
                      key={cancion.id}
                      onClick={() => {
                        setCancionSeleccionada(cancion);
                        setSeccionActivaIdx(-1);
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                          : temaOperador === 'claro'
                          ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                          : 'bg-slate-950/60 border-slate-800/60 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="space-y-0.5 max-w-[85%]">
                        <span className="font-bold text-xs block truncate">{cancion.title}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          {cancion.author && <span>{cancion.author}</span>}
                          <span>{cancion.sections.length} partes</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const nuevoSetlist = [...setlistItems, cancion];
                          setSetlists(prev => ({ ...prev, [setlistActual]: nuevoSetlist }));
                          localStorage.setItem('lbc_setlists', JSON.stringify({ ...setlists, [setlistActual]: nuevoSetlist }));
                          mostrarToast(`Añadida "${cancion.title}" al setlist`);
                        }}
                        title="Agregar a Setlist de culto"
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 flex items-center justify-center transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Columna 2: Bloques y Estrofas de la Canción (5 cols) */}
            <div className={`xl:col-span-5 border rounded-2xl p-3 flex flex-col gap-2.5 overflow-hidden shadow-xl ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              {cancionSeleccionada ? (
                <>
                  <div className={`flex items-center justify-between border-b pb-2 ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                    <div>
                      <h2 className="text-sm font-black text-amber-500">{cancionSeleccionada.title}</h2>
                      <p className="text-[11px] text-slate-400">
                        {cancionSeleccionada.author || 'Dominio Público'} • {cancionSeleccionada.sections.length} secciones
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={retrocederEstrofa}
                        title="Estrofa anterior (Flecha Izq)"
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-bold hover:bg-slate-700 text-slate-200"
                      >
                        ⬅ Anterior
                      </button>
                      <button
                        onClick={avanzarEstrofa}
                        title="Estrofa siguiente (Flecha Der)"
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow"
                      >
                        Siguiente ➡
                      </button>
                    </div>
                  </div>

                  {/* Sections / Stanzas List */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 pb-16">
                    {cancionSeleccionada.sections.map((seccion, idx) => {
                      const isActive = seccionActivaIdx === idx;
                      const esCoro = seccion.type === 'chorus';
                      const esPuente = seccion.type === 'bridge';
                      return (
                        <div
                          key={idx}
                          onClick={() => proyectarEstrofa(seccion, cancionSeleccionada, idx)}
                          className={`p-3.5 rounded-xl border text-left cursor-pointer transition relative ${
                            isActive
                              ? 'bg-blue-600/30 border-blue-400 text-white shadow-xl ring-2 ring-blue-500/50'
                              : esCoro
                              ? 'bg-amber-950/25 border-amber-600/40 text-amber-100 hover:bg-amber-950/40'
                              : esPuente
                              ? 'bg-purple-950/25 border-purple-600/40 text-purple-100 hover:bg-purple-950/40'
                              : temaOperador === 'claro'
                              ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                              : 'bg-slate-950/70 border-slate-800/80 text-slate-200 hover:bg-slate-800/70'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                              esCoro
                                ? 'bg-amber-500 text-slate-950'
                                : esPuente
                                ? 'bg-purple-500 text-white'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {seccion.label}
                            </span>
                            {isActive && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500 text-slate-950 animate-pulse">
                                ● EN PANTALLA
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-medium leading-relaxed whitespace-pre-line">
                            {seccion.lines.join('\n')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Music className="w-10 h-10 stroke-1" />
                  <p className="text-xs">Selecciona una alabanza del repertorio</p>
                </div>
              )}
            </div>

            {/* Columna 3: Setlist de Culto & Monitor (3 cols) */}
            <div className="xl:col-span-3 flex flex-col gap-3 overflow-hidden">
              {/* Setlist */}
              <div className={`border rounded-2xl p-3 shadow-xl flex-1 flex flex-col overflow-hidden ${
                temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <div className={`flex items-center justify-between border-b pb-2 mb-2 ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs uppercase">SETLIST DE CULTO</span>
                    <span className={`text-[10px] font-mono px-1.5 rounded ${temaOperador === 'claro' ? 'bg-slate-200 text-slate-800' : 'bg-slate-800 text-slate-300'}`}>
                      {setlistItems.length}
                    </span>
                  </div>

                  <select
                    value={setlistActual}
                    onChange={(e) => setSetlistActual(e.target.value)}
                    className={`border rounded-lg text-xs font-bold px-2 py-1 focus:outline-none ${
                      temaOperador === 'claro' ? 'bg-slate-50 border-slate-300 text-amber-600' : 'bg-slate-950 border-slate-800 text-amber-400'
                    }`}
                  >
                    <option value="domingo">Domingo</option>
                    <option value="miercoles">Miércoles</option>
                    <option value="sabado">Sábado</option>
                    <option value="general">Especial</option>
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 pb-10">
                  {setlistItems.map((cancion, idx) => (
                    <div
                      key={`${cancion.id}-${idx}`}
                      onClick={() => {
                        setCancionSeleccionada(cancion);
                        setSeccionActivaIdx(-1);
                      }}
                      className={`p-2 rounded-xl border text-left text-xs flex items-center justify-between cursor-pointer group ${
                        temaOperador === 'claro' ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold block truncate">
                          {idx + 1}. {cancion.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {cancion.sections.length} partes
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const nuevo = setlistItems.filter((_, i) => i !== idx);
                          setSetlists(prev => ({ ...prev, [setlistActual]: nuevo }));
                          localStorage.setItem('lbc_setlists', JSON.stringify({ ...setlists, [setlistActual]: nuevo }));
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confidence Monitor for Song */}
              <div className={`border rounded-2xl p-3 shadow-xl ${
                temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-emerald-500" />
                    MONITOR SALIDA
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {isBlackout ? 'BLACKOUT' : proyeccionActual ? 'PROYECTANDO' : 'EN ESPERA'}
                  </span>
                </div>
                <div className="h-32 rounded-xl bg-black border border-slate-800 p-3 flex flex-col items-center justify-center text-center">
                  {proyeccionActual ? (
                    <p className="text-xs font-bold text-white line-clamp-3 leading-relaxed whitespace-pre-line">
                      {proyeccionActual.texto}
                    </p>
                  ) : (
                    <span className="text-[11px] text-slate-500">Ninguna letra proyectada</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MÓDULO 4: FONDOS DINÁMICOS ==================== */}
        {moduloActivo === 'fondos' && (
          <div className="space-y-4">
            <div className={`border rounded-2xl p-4 shadow-xl space-y-4 ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Image className="w-5 h-5 text-amber-500" />
                    <span>Fondos Visuales & Animados para el Proyector</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Fondos litúrgicos y dinámicos para cultos. Puedes subir imágenes propias o videos MP4 en bucle.
                  </p>
                </div>

                <button
                  onClick={() => fondoFileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>+ Subir Fondo (Imagen o Video MP4)</span>
                </button>
              </div>

              {/* Grid combinada de Fondos Predeterminados y Subidos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[...fondosPersonalizados, ...FONDOS_PREDETERMINADOS].map((fondo) => {
                  const bg = fondo.url || fondo.cssBackground || '';
                  const isActive = fondoActivo === bg;
                  const isAnim = fondo.tipo === 'anim' || fondo.categoria === 'animado';
                  const isVideo = fondo.tipo === 'video' || bg.startsWith('video:');

                  return (
                    <div
                      key={fondo.id}
                      onClick={() => seleccionarFondo(fondo)}
                      className={`rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 relative group flex flex-col justify-between ${
                        isActive
                          ? 'ring-4 ring-amber-400 border-amber-400 scale-[1.03] shadow-2xl'
                          : 'border-slate-700 hover:border-amber-400 hover:scale-[1.01]'
                      }`}
                    >
                      <div
                        className={`h-28 w-full flex flex-col justify-between p-2.5 relative overflow-hidden ${
                          isAnim ? fondo.cssBackground : ''
                        }`}
                        style={{
                          backgroundColor: '#020617',
                          backgroundImage: (!isAnim && !isVideo && (fondo.url || fondo.cssBackground?.startsWith('radial') || fondo.cssBackground?.startsWith('linear')))
                            ? (fondo.cssBackground || `url('${fondo.url}')`)
                            : undefined,
                          backgroundSize: modoAjusteFondo,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center center'
                        }}
                      >
                        {/* Video Thumbnail preview if custom video */}
                        {isVideo && (
                          <div className="absolute inset-0 bg-slate-950 flex items-center justify-center pointer-events-none opacity-80">
                            <Video className="w-8 h-8 text-purple-400 animate-pulse" />
                          </div>
                        )}

                        <div className="flex items-center justify-between z-10">
                          {isAnim && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/80 text-white font-extrabold text-[8px] uppercase backdrop-blur animate-pulse">
                              ✨ ANIMADO
                            </span>
                          )}
                          {isVideo && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-600/90 text-white font-extrabold text-[8px] uppercase backdrop-blur">
                              🎬 VIDEO BUCLE
                            </span>
                          )}
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase shadow ml-auto">
                              ✓ ACTIVO
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-1 z-10">
                          <span className="text-[11px] font-bold text-white bg-black/75 px-2 py-0.5 rounded backdrop-blur border border-white/20 truncate flex-1">
                            {fondo.nombre}
                          </span>
                          {fondo.esSubido && (
                            <button
                              onClick={(e) => eliminarFondoPersonalizado(fondo.id, e)}
                              className="p-1 rounded bg-rose-600/80 hover:bg-rose-600 text-white transition shrink-0"
                              title="Eliminar este fondo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Stage Monitor for Background */}
            <div className={`border rounded-2xl p-4 shadow-xl space-y-3 ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black uppercase text-slate-400">Simulación del Proyector con Fondo Activo</span>
                <span className="text-[11px] text-amber-500 font-bold">Transmitido en tiempo real a display.html</span>
              </div>

              {/* Controles de Ajuste de Imagen y Contraste de Letras */}
              <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
              }`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Ajuste de Imagen:</span>
                  <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5 text-xs">
                    <button
                      onClick={() => cambiarModoAjusteFondo('contain')}
                      className={`px-3 py-1 rounded font-bold transition cursor-pointer ${
                        modoAjusteFondo === 'contain' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Muestra la imagen completa centrada sin cortar nada (ideal para logos y banners)"
                    >
                      🎯 Completa (No cortar)
                    </button>
                    <button
                      onClick={() => cambiarModoAjusteFondo('cover')}
                      className={`px-3 py-1 rounded font-bold transition cursor-pointer ${
                        modoAjusteFondo === 'cover' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Rellena toda la pantalla panorámica 16:9"
                    >
                      📐 Rellenar Pantalla
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">Filtro Oscuro para Letras:</span>
                  <div className="flex gap-1 text-xs">
                    {[
                      { val: 0, label: '0%' },
                      { val: 0.3, label: '30%' },
                      { val: 0.45, label: '45% (Óptimo)' },
                      { val: 0.65, label: '65%' }
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        onClick={() => cambiarOscurecedorFondo(opt.val)}
                        className={`px-2.5 py-1 rounded font-bold border transition cursor-pointer ${
                          oscurecedorFondo === opt.val
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monitor Visual */}
              <div
                className={`h-52 rounded-xl flex flex-col items-center justify-center text-center p-4 border border-slate-800 transition-all duration-300 relative overflow-hidden ${
                  tipoFondoActivo === 'anim' ? fondoActivo : ''
                }`}
                style={{
                  backgroundColor: '#020617',
                  backgroundImage: (tipoFondoActivo !== 'anim' && !fondoActivo.startsWith('video:') && (fondoActivo.startsWith('http') || fondoActivo.startsWith('data:') || fondoActivo.includes('assets/')))
                    ? `url('${fondoActivo}')`
                    : (tipoFondoActivo === 'estatico' && !fondoActivo.startsWith('data:') && !fondoActivo.startsWith('http') ? fondoActivo : undefined),
                  backgroundSize: modoAjusteFondo,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center center'
                }}
              >
                {/* Capa de contraste para lectura óptima */}
                <div
                  className="absolute inset-0 pointer-events-none transition-all duration-300"
                  style={{ backgroundColor: `rgba(0, 0, 0, ${oscurecedorFondo})` }}
                />

                <div className="relative z-10 space-y-2 max-w-xl">
                  <p className="text-white text-lg font-bold drop-shadow-[0_4px_16px_rgba(0,0,0,1)] leading-relaxed whitespace-pre-line">
                    {proyeccionActual?.texto || '"Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito..."'}
                  </p>
                  {proyeccionActual?.pie && (
                    <span className="text-amber-400 text-xs font-bold uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,1)] inline-block px-3 py-1 rounded-full bg-slate-950/80 border border-amber-400/40">
                      {proyeccionActual.pie}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MÓDULO 5: VIDEO ==================== */}
        {moduloActivo === 'video' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className={`lg:col-span-8 border rounded-2xl p-4 shadow-xl space-y-4 ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className={`flex items-center justify-between border-b pb-2 ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                <h2 className="font-bold text-base flex items-center gap-2">
                  <Video className="w-5 h-5 text-purple-500" />
                  <span>Reproductor de Videos de Culto</span>
                </h2>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{videoUrl ? 'Cambiar Video MP4/WebM' : 'Cargar Video Local'}</span>
                  </button>
                </div>
              </div>

              <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center relative group">
                {videoUrl ? (
                  <>
                    <video src={videoUrl} controls loop={videoLoop} className="w-full h-full object-contain" />
                    {videoEnProyector && (
                      <div className="absolute top-3 left-3 bg-red-600 text-white font-black text-[10px] uppercase px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        <span>EN VIVO EN EL PROYECTOR</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center space-y-3 p-8">
                    <Video className="w-14 h-14 text-slate-700 mx-auto" />
                    <p className="text-xs text-slate-400 font-medium">Selecciona un archivo de video desde tu computadora (.mp4, .webm)</p>
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition cursor-pointer"
                    >
                      Buscar Video en la Computadora
                    </button>
                  </div>
                )}
              </div>

              {/* Botones de Control de Proyección de Video */}
              {videoUrl && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 p-3 rounded-xl border border-slate-800 bg-slate-950/60">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={proyectarVideoEnProyector}
                      className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg transition cursor-pointer ${
                        videoEnProyector
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{videoEnProyector ? 'Actualizar Proyección de Video' : '▶ Proyectar Video en Pantalla'}</span>
                    </button>

                    {videoEnProyector && (
                      <button
                        onClick={detenerVideoEnProyector}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5 fill-white" />
                        <span>⏹ Detener Video en Proyector</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={videoLoop}
                        onChange={(e) => setVideoLoop(e.target.checked)}
                        className="rounded accent-purple-500"
                      />
                      <span>Repetir en Bucle</span>
                    </label>

                    <div className="flex items-center gap-1.5 pl-3 border-l border-slate-800 text-slate-300">
                      <Volume2 className="w-4 h-4 text-slate-400" />
                      <span>Volumen:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={videoVolume}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setVideoVolume(v);
                          if (videoEnProyector) {
                            enviarAlProyector({ accion: 'controlVideo', volumen: v / 100 });
                          }
                        }}
                        className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <span className="font-mono text-[11px] w-6 text-right">{videoVolume}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Reproductor de Enlaces de YouTube */}
              <div className={`p-4 rounded-xl border space-y-3 ${
                temaOperador === 'claro' ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>Reproducir desde Enlace de YouTube</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">Pega el link de cualquier alabanza, predica o testimonio</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={youtubeInputUrl}
                    onChange={(e) => setYoutubeInputUrl(e.target.value)}
                    placeholder="Pega aquí el enlace de YouTube (ej: https://www.youtube.com/watch?v=... o https://youtu.be/...)"
                    className={`flex-1 px-3 py-2 rounded-xl text-xs border outline-none font-mono ${
                      temaOperador === 'claro' ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                  <button
                    onClick={cargarVideoYoutube}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Cargar
                  </button>
                </div>

                {youtubeVideoId && (
                  <div className="space-y-3 pt-1">
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?enablejsapi=1&origin=${encodeURIComponent(typeof window !== 'undefined' && window.location.origin.startsWith('http') ? window.location.origin : 'https://www.youtube.com')}&autoplay=1&rel=0&modestbranding=1`}
                        className="w-full h-full border-none"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      ></iframe>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                      <span>Video ID: <strong className="font-mono text-amber-400">{youtubeVideoId}</strong></span>
                      <a
                        href={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-red-400 hover:text-red-300 transition underline font-medium cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir directamente en YouTube</span>
                      </a>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        onClick={proyectarYoutubeEnProyector}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                          youtubeEnProyector
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                            : 'bg-red-600 hover:bg-red-500 text-white'
                        }`}
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>{youtubeEnProyector ? '● Transmitiendo YouTube al Proyector' : '▶ Proyectar YouTube en Pantalla Completa'}</span>
                      </button>

                      {youtubeEnProyector && (
                        <button
                          onClick={detenerYoutubeEnProyector}
                          className="px-4 py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 font-bold text-xs transition cursor-pointer"
                        >
                          ⏹ Detener
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={`lg:col-span-4 border rounded-2xl p-4 shadow-xl space-y-4 flex flex-col justify-between ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Video className="w-4 h-4 text-purple-400" />
                  <span>Instrucciones de Video</span>
                </h3>
                <div className={`p-3.5 rounded-xl border text-xs space-y-2 leading-relaxed ${
                  temaOperador === 'claro' ? 'bg-slate-50 border-slate-300 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}>
                  <p>
                    <strong className="text-amber-500 block mb-1">💡 Proyección en Segundo Monitor:</strong>
                    Al oprimir <strong>"▶ Proyectar Video en Pantalla"</strong>, el video se reproducirá en la ventana externa del proyector en pantalla completa sin barras de navegación ni menús.
                  </p>
                  <p>
                    Puedes usar <strong>Blackout (B)</strong> en cualquier instante para silenciar/ocultar el video o <strong>Limpiar (C)</strong> para volver a la pantalla de bienvenida.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={toggleBlackout} className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 transition cursor-pointer">
                  Blackout (B)
                </button>
                <button onClick={limpiarPantalla} className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 transition cursor-pointer">
                  Limpiar (C)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MÓDULO 6: KARAOKE / PISTAS DE ALABANZA ==================== */}
        {moduloActivo === 'karaoke' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* Reproductor y Controles de Audio (5 cols) */}
            <div className={`xl:col-span-5 border rounded-2xl p-4 shadow-xl space-y-4 flex flex-col justify-between ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="space-y-3">
                <div className={`flex items-center justify-between border-b pb-3 ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Mic className="w-5 h-5 text-teal-500" />
                    <span>Control de Pista & Audio</span>
                  </h2>
                  <button
                    onClick={() => audioInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Cargar MP3/WAV</span>
                  </button>
                </div>

                {/* Track Card */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  temaOperador === 'claro' ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md ${
                      karaokePlaying ? 'bg-teal-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-teal-400'
                    }`}>
                      <Disc className={`w-6 h-6 ${karaokePlaying ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="flex-1 truncate">
                      <span className="font-extrabold text-xs block truncate">
                        {karaokePistaNombre}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Alabanza: <strong className="text-amber-500">{karaokeCancion.title}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Seek Bar */}
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max={karaokeDuration || 100}
                      value={karaokeCurrentTime}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setKaraokeCurrentTime(val);
                        if (audioRef.current) audioRef.current.currentTime = val;
                      }}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>{Math.floor(karaokeCurrentTime / 60)}:{('0' + Math.floor(karaokeCurrentTime % 60)).slice(-2)}</span>
                      <span>{Math.floor(karaokeDuration / 60)}:{('0' + Math.floor(karaokeDuration % 60)).slice(-2)}</span>
                    </div>
                  </div>

                  {/* Playback Buttons */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleKaraokePlay}
                        className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                      >
                        {karaokePlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-slate-950" />}
                        <span>{karaokePlaying ? 'Pausa' : 'Reproducir'}</span>
                      </button>

                      <button
                        onClick={stopKaraoke}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                        title="Detener pista"
                      >
                        <Square className="w-4 h-4 fill-slate-300" />
                      </button>
                    </div>

                    {/* Volume */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const m = !karaokeMuted;
                          setKaraokeMuted(m);
                          if (audioRef.current) audioRef.current.muted = m;
                        }}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        {karaokeMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={karaokeMuted ? 0 : karaokeVolume}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setKaraokeVolume(v);
                          if (audioRef.current) audioRef.current.volume = v / 100;
                        }}
                        className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 text-slate-400 ${
                temaOperador === 'claro' ? 'bg-slate-50 border-slate-300' : 'bg-slate-950/80 border-slate-800'
              }`}>
                <span className="font-bold block">💡 ¿Cómo funciona el Karaoke?</span>
                <p className="leading-relaxed">
                  1. Carga cualquier pista de audio instrumental (.mp3 o .wav) con el botón superior.
                  <br />
                  2. A la derecha haz clic en cada estrofa de la alabanza para proyectarla sincronizada en el proyector.
                </p>
              </div>
            </div>

            {/* Sincronizador de Letras para Proyección (7 cols) */}
            <div className={`xl:col-span-7 border rounded-2xl p-4 shadow-xl flex flex-col gap-3 ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className={`flex items-center justify-between border-b pb-2 ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs uppercase">ALABANZA:</span>
                  <select
                    value={karaokeCancion.id}
                    onChange={(e) => {
                      const song = repertorio.find(s => s.id === e.target.value) || repertorio[0];
                      setKaraokeCancion(song);
                      setKaraokeSeccionIdx(0);
                    }}
                    className={`border rounded-lg text-xs font-bold px-2 py-1 max-w-[280px] ${
                      temaOperador === 'claro' ? 'bg-slate-50 border-slate-300 text-amber-600' : 'bg-slate-950 border-slate-800 text-amber-400'
                    }`}
                  >
                    {repertorio.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    if (karaokeSeccionIdx < karaokeCancion.sections.length - 1) {
                      const sig = karaokeSeccionIdx + 1;
                      setKaraokeSeccionIdx(sig);
                      proyectarEstrofa(karaokeCancion.sections[sig], karaokeCancion, sig);
                    }
                  }}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow flex items-center gap-1 cursor-pointer"
                >
                  <span>Siguiente Estrofa ➡</span>
                </button>
              </div>

              {/* Sections to click and project */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[500px]">
                {karaokeCancion.sections.map((sec, idx) => {
                  const isCurrent = karaokeSeccionIdx === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setKaraokeSeccionIdx(idx);
                        proyectarEstrofa(sec, karaokeCancion, idx);
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${
                        isCurrent
                          ? 'bg-teal-500/20 border-teal-400 text-white shadow-lg ring-2 ring-teal-400/50'
                          : temaOperador === 'claro'
                          ? 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                          : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                          {sec.label}
                        </span>
                        <p className="text-xs font-semibold whitespace-pre-line leading-relaxed">
                          {sec.lines.join('\n')}
                        </p>
                      </div>

                      <button
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                          isCurrent
                            ? 'bg-teal-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isCurrent ? '● PROYECTANDO' : 'Proyectar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== MÓDULO 7: DIAPOSITIVAS & IMÁGENES (CANVA) ==================== */}
        {moduloActivo === 'anuncios' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* Galería Principal de Imágenes y Diapositivas (8 cols) */}
            <div className={`xl:col-span-8 border rounded-2xl p-4 shadow-xl space-y-4 ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${
                temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <div>
                  <h2 className="font-bold text-base flex items-center gap-2">
                    <Image className="w-5 h-5 text-amber-500" />
                    <span>Galería de Diapositivas, Flyers & Imágenes (Canva)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sube banners de bienvenida, flyers de cultos especiales (ej. Culto de Niños) o afiches de Canva para proyectar en pantalla completa.
                  </p>
                </div>

                <button
                  onClick={() => imageFileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>+ Subir Flyer / Imagen (Canva, PNG, JPG)</span>
                </button>
              </div>

              {/* Grid de Diapositivas Guardadas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[560px] overflow-y-auto pr-1">
                {imagenesGuardadas.map((slide, idx) => {
                  const isCurrent = proyeccionActual?.id === slide.id && proyeccionActual?.tipo === 'imagen';
                  return (
                    <div
                      key={slide.id}
                      className={`group rounded-xl border overflow-hidden flex flex-col justify-between transition-all duration-200 ${
                        isCurrent
                          ? 'border-amber-400 ring-4 ring-amber-400/40 shadow-2xl scale-[1.01]'
                          : temaOperador === 'claro'
                          ? 'bg-slate-50 border-slate-300 hover:border-amber-400'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Thumbnail Container */}
                      <div
                        onClick={() => proyectarImagen(slide, idx)}
                        className="aspect-video bg-black/60 relative cursor-pointer overflow-hidden flex items-center justify-center"
                      >
                        <img
                          src={slide.dataUrl}
                          alt={slide.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        {isCurrent && (
                          <div className="absolute top-2 left-2 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse"></span>
                            <span>EN PANTALLA</span>
                          </div>
                        )}
                      </div>

                      {/* Info & Action Buttons */}
                      <div className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold truncate leading-tight flex-1" title={slide.titulo}>
                            {slide.titulo}
                          </h4>
                          {slide.fecha && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {slide.fecha}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            onClick={() => proyectarImagen(slide, idx)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                              isCurrent
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                          >
                            <Monitor className="w-3.5 h-3.5" />
                            <span>{isCurrent ? 'Actualizar' : 'Proyectar'}</span>
                          </button>

                          <button
                            onClick={(e) => eliminarImagen(slide.id, e)}
                            title="Eliminar imagen de la lista"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sección de Avisos de Texto Rápido */}
              <div className={`mt-4 pt-3 border-t space-y-3 ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">Plantillas de Avisos de Culto (Texto):</span>
                  <span className="text-[11px] text-slate-500">Haz clic para rellenar rápido</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Bienvenida', texto: '¡Bienvenidos a la Casa de Dios!\nIglesia Cristiana Cuadrangular Las Brisas' },
                    { label: 'Diezmos y Ofrendas', texto: '"Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre."\n— 2 Corintios 9:7' },
                    { label: 'Santa Cena', texto: '"Haced esto en memoria de mí"\n— 1 Corintios 11:24' },
                    { label: 'Cultos', texto: 'Nuestros Cultos:\nMiércoles 7:00 PM | Sábado 6:00 PM | Domingo 9:30 AM' }
                  ].map((plantilla, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTextoLibre(plantilla.texto)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        temaOperador === 'claro'
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      {plantilla.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={textoLibre}
                    onChange={(e) => setTextoLibre(e.target.value)}
                    placeholder="Escribe aquí cualquier aviso de culto personalizado..."
                    className={`flex-1 p-2.5 border rounded-xl text-xs focus:outline-none ${
                      temaOperador === 'claro'
                        ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white placeholder-slate-600'
                    }`}
                  ></textarea>

                  <button
                    onClick={proyectarTextoManual}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition cursor-pointer self-stretch flex items-center justify-center"
                  >
                    Proyectar Texto
                  </button>
                </div>
              </div>
            </div>

            {/* Monitor de Escena & Previsualización (4 cols) */}
            <div className={`xl:col-span-4 border rounded-2xl p-4 shadow-xl space-y-4 flex flex-col justify-between ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="space-y-3">
                <div className={`flex items-center justify-between border-b pb-2 ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className="font-bold text-sm flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-emerald-500" />
                    <span>Monitor de Salida (Proyector)</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isBlackout ? 'bg-rose-500/20 text-rose-400' : proyeccionActual ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isBlackout ? 'BLACKOUT' : proyeccionActual ? 'EN PANTALLA' : 'EN ESPERA'}
                  </span>
                </div>

                <div className="min-h-[220px] aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-2 relative">
                  {isBlackout ? (
                    <span className="text-xs font-mono text-slate-600 font-bold uppercase tracking-widest">
                      PANTALLA NEGRA (BLACKOUT)
                    </span>
                  ) : proyeccionActual?.tipo === 'imagen' && proyeccionActual.url ? (
                    <img
                      src={proyeccionActual.url}
                      alt="Proyección Activa"
                      className="w-full h-full object-contain"
                    />
                  ) : proyeccionActual?.texto ? (
                    <div className="p-3 text-center text-white text-xs font-bold whitespace-pre-line leading-relaxed">
                      {proyeccionActual.texto}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Ningún contenido proyectado</span>
                  )}
                </div>

                <div className={`p-3 rounded-xl border text-xs space-y-1.5 text-slate-400 ${
                  temaOperador === 'claro' ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                }`}>
                  <span className="font-bold block text-slate-300">💡 Atajos de Teclado:</span>
                  <p>• Flechas <strong>Derecha ➡ / Izquierda ⬅</strong>: Avanza o retrocede entre tus flyers de Canva.</p>
                  <p>• Tecla <strong>B</strong>: Pantalla Negra inmediata (Blackout).</p>
                  <p>• Tecla <strong>C</strong>: Limpia la pantalla y vuelve a la portada.</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={toggleBlackout}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 transition cursor-pointer"
                >
                  Blackout (B)
                </button>
                <button
                  onClick={limpiarPantalla}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 transition cursor-pointer"
                >
                  Limpiar (C)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MÓDULO 8: CONFIGURACIÓN Y AJUSTES ==================== */}
        {moduloActivo === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Opciones de Tipografía y Proyector (6 cols) */}
            <div className={`lg:col-span-6 border rounded-2xl p-5 shadow-xl space-y-4 ${
              temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
            }`}>
              <h2 className={`font-bold text-base border-b pb-3 flex items-center gap-2 ${
                temaOperador === 'claro' ? 'border-slate-200 text-slate-900' : 'border-slate-800 text-white'
              }`}>
                <Type className="w-5 h-5 text-amber-500" />
                <span>Tipografía y Estilo de la Proyección</span>
              </h2>

              {/* Selector de Fuente con fuentes offline nativas de Windows */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Tipo de Letra en Pantalla (Fuente Offline Windows)</label>
                <select
                  value={fuenteProyector}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFuenteProyector(val);
                    localStorage.setItem('lbc_fuente', val);
                    emitirAjustesProyector({ fuente: val });
                    mostrarToast('Tipo de letra actualizado en el proyector');
                  }}
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-semibold focus:outline-none ${
                    temaOperador === 'claro' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                >
                  {FUENTES_SISTEMA.map((f) => (
                    <option key={f.id} value={f.id}>{f.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Color del Texto */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold">Color del Texto Proyectado</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Blanco Puro', color: '#ffffff' },
                    { label: 'Dorado Cálido', color: '#fbbf24' },
                    { label: 'Amarillo Suave', color: '#fef08a' },
                    { label: 'Celeste Cielo', color: '#7dd3fc' }
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => {
                        setColorTextoProyector(c.color);
                        localStorage.setItem('lbc_color_texto', c.color);
                        emitirAjustesProyector({ colorTexto: c.color });
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        colorTextoProyector === c.color ? 'ring-2 ring-blue-500 border-white shadow-md' : 'border-slate-700 bg-slate-900'
                      }`}
                      style={{ color: c.color }}
                    >
                      <span className="w-3 h-3 rounded-full border border-white/40" style={{ backgroundColor: c.color }}></span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sombra de Texto y Alineación */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className={`p-3 rounded-xl border space-y-1.5 ${
                  temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <label className="text-xs font-bold block">Sombra de Texto (Contraste)</label>
                  <button
                    onClick={() => {
                      const nuevo = !sombraTexto;
                      setSombraTexto(nuevo);
                      localStorage.setItem('lbc_sombra', String(nuevo));
                      emitirAjustesProyector({ sombraTexto: nuevo });
                    }}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      sombraTexto ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {sombraTexto ? '✓ Sombra Activada' : 'Sin Sombra'}
                  </button>
                </div>

                <div className={`p-3 rounded-xl border space-y-1.5 ${
                  temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <label className="text-xs font-bold block">Alineación del Texto</label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => {
                        setAlineacionProyector('center');
                        localStorage.setItem('lbc_alineacion', 'center');
                        emitirAjustesProyector({ alineacion: 'center' });
                      }}
                      className={`py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        alineacionProyector === 'center' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Centrado
                    </button>
                    <button
                      onClick={() => {
                        setAlineacionProyector('left');
                        localStorage.setItem('lbc_alineacion', 'left');
                        emitirAjustesProyector({ alineacion: 'left' });
                      }}
                      className={`py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        alineacionProyector === 'left' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Izquierda
                    </button>
                  </div>
                </div>
              </div>

              {/* Previsualización del Estilo en Tiempo Real */}
              <div className="p-4 rounded-xl bg-black border border-slate-800 text-center space-y-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
                  Vista Previa del Estilo (Cambia según tu selección)
                </span>
                <p
                  style={{
                    fontFamily: fuenteProyector,
                    color: colorTextoProyector,
                    textAlign: alineacionProyector,
                    textShadow: sombraTexto ? '0 4px 18px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)' : 'none'
                  }}
                  className="text-lg font-bold leading-relaxed transition-all"
                >
                  "Jehová es mi pastor; nada me faltará."
                </p>
                <span className="text-xs text-amber-400 font-bold block uppercase">— Salmos 23:1 (RV1960)</span>
              </div>
            </div>

            {/* Opciones de Interfaz & Congregación (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Personalización de la Iglesia */}
              <div className={`border rounded-2xl p-5 shadow-xl space-y-3 ${
                temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-500" />
                  <span>Datos de la Congregación</span>
                </h3>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">Nombre de la Iglesia / Sede</label>
                  <input
                    type="text"
                    value={nombreCongregacion}
                    onChange={(e) => {
                      setNombreCongregacion(e.target.value);
                      localStorage.setItem('lbc_nombre_iglesia', e.target.value);
                    }}
                    className={`w-full px-3 py-2 border rounded-xl text-xs ${
                      temaOperador === 'claro' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  />
                </div>

                {/* Tema Operador */}
                <div className={`flex items-center justify-between pt-2 border-t ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className="text-xs font-semibold">Tema del Panel de Operador</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setTemaOperador('oscuro');
                        localStorage.setItem('lbc_tema', 'oscuro');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                        temaOperador === 'oscuro' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Oscuro</span>
                    </button>
                    <button
                      onClick={() => {
                        setTemaOperador('claro');
                        localStorage.setItem('lbc_tema', 'claro');
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                        temaOperador === 'claro' ? 'bg-blue-600 text-white shadow' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span>Claro</span>
                    </button>
                  </div>
                </div>

                {/* Ocultar / Mostrar botón ZIP en la barra superior */}
                <div className={`flex items-center justify-between pt-2 border-t ${temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'}`}>
                  <div>
                    <span className="text-xs font-bold block">Botón de Descargar ZIP</span>
                    <span className="text-[11px] text-slate-400">Ocultar de la cabecera una vez instalado en tu PC</span>
                  </div>
                  <button
                    onClick={() => {
                      const nuevo = !mostrarBotonZip;
                      setMostrarBotonZip(nuevo);
                      localStorage.setItem('lbc_mostrar_zip', String(nuevo));
                      mostrarToast(nuevo ? 'Botón ZIP visible en cabecera' : 'Botón ZIP ocultado');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      mostrarBotonZip ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {mostrarBotonZip ? 'Visible' : 'Oculto'}
                  </button>
                </div>
              </div>

              {/* Estadísticas y Diagnóstico */}
              <div className={`border rounded-2xl p-5 shadow-xl space-y-3 ${
                temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4 text-emerald-500" />
                  <span>Base de Datos y Almacenamiento Local</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className={`p-3 rounded-xl border ${temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <span className="font-extrabold text-amber-500 text-sm block">{repertorio.length} Canciones</span>
                    <span className="text-slate-400 text-[11px]">Guardadas en memoria local</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                    <span className="font-extrabold text-teal-500 text-sm block">66 Libros Bíblicos</span>
                    <span className="text-slate-400 text-[11px]">Indexados para proyección</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(repertorio, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", "Cancionero_Respaldo_LBC.json");
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      mostrarToast('Copia de respaldo descargada en JSON');
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      temaOperador === 'claro'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Respaldo JSON</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm('¿Deseas restaurar el cancionero inicial predeterminado?')) {
                        localStorage.removeItem('proyector_lbc_canciones');
                        setRepertorio(INITIAL_FEATURED_SONGS);
                        mostrarToast('Cancionero restaurado a valores iniciales');
                      }
                    }}
                    className="py-2 px-3 rounded-xl bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/40 text-rose-300 text-xs font-bold transition cursor-pointer"
                  >
                    Restablecer
                  </button>
                </div>
              </div>

              {/* Atajos de Teclado */}
              <div className={`border rounded-2xl p-4 shadow-xl space-y-2 ${
                temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <span className="font-bold text-xs block">Atajos de Teclado del Operador de Culto:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className={`p-2 rounded border ${temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}><strong className="text-amber-500">➡ Flecha Derecha</strong>: Siguiente Estrofa</div>
                  <div className={`p-2 rounded border ${temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}><strong className="text-amber-500">⬅ Flecha Izquierda</strong>: Estrofa Anterior</div>
                  <div className={`p-2 rounded border ${temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}><strong className="text-amber-500">B / F5</strong>: Pantalla Negra (Blackout)</div>
                  <div className={`p-2 rounded border ${temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}><strong className="text-amber-500">C / F4</strong>: Limpiar Texto de Pantalla</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MÓDULO 8: OBS STUDIO ==================== */}
        {moduloActivo === 'obs' && (
          <ObsPanel
            temaOperador={temaOperador}
            proyeccionActual={proyeccionActual}
            enviarAlProyector={enviarAlProyector}
            mostrarToast={mostrarToast}
          />
        )}

      </main>

      {/* ==================== MODAL DE AYUDA Y ATALOS ==================== */}
      <HelpModal
        abierto={mostrarAyuda}
        alCerrar={() => setMostrarAyuda(false)}
        temaOperador={temaOperador}
        alAbrirObs={() => setModuloActivo('obs')}
      />

      {/* Modal: Nueva Canción */}
      {mostrarModalNuevaCancion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-amber-400">Registrar Nueva Alabanza</h3>
            <div className="space-y-2">
              <input
                type="text"
                value={nuevaTitulo}
                onChange={(e) => setNuevaTitulo(e.target.value)}
                placeholder="Título de la alabanza (ej: Al que está sentado en el trono)..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <input
                type="text"
                value={nuevaAutor}
                onChange={(e) => setNuevaAutor(e.target.value)}
                placeholder="Autor o ministerio (opcional)..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              />
              <textarea
                rows={8}
                value={nuevaLetra}
                onChange={(e) => setNuevaLetra(e.target.value)}
                placeholder="Pega o escribe aquí la letra completa de la canción..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none"
              ></textarea>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMostrarModalNuevaCancion(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!nuevaTitulo.trim()) {
                    mostrarToast('Ingresa un título para la canción', 'error');
                    return;
                  }
                  const rawSections = nuevaLetra.split('\n\n').filter(Boolean);
                  const sections: SongSection[] = rawSections.map((sec, i) => {
                    const lines = sec.split('\n').filter(Boolean);
                    const isChorus = lines[0]?.toLowerCase().includes('coro') || lines.some(l => l.toLowerCase().includes('aleluya') || l.toLowerCase().includes('santo'));
                    return {
                      label: isChorus ? `Coro` : `Verso ${i + 1}`,
                      type: isChorus ? 'chorus' : 'verse',
                      lines
                    };
                  });
                  const nueva: Song = {
                    id: `cancion-local-${Date.now()}`,
                    title: nuevaTitulo.trim(),
                    author: nuevaAutor.trim() || 'Desconocido',
                    sections: sections.length > 0 ? sections : [{ label: 'Verso 1', type: 'verse', lines: [nuevaLetra] }]
                  };
                  const nuevaLista = [nueva, ...repertorio];
                  setRepertorio(nuevaLista);
                  setCancionSeleccionada(nueva);
                  localStorage.setItem('proyector_lbc_canciones', JSON.stringify(nuevaLista));
                  setMostrarModalNuevaCancion(false);
                  setNuevaTitulo('');
                  setNuevaAutor('');
                  setNuevaLetra('');
                  mostrarToast(`¡Canción "${nueva.title}" registrada exitosamente!`);
                }}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow cursor-pointer"
              >
                Guardar Canción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`border-t py-2.5 px-4 text-center text-[11px] flex flex-wrap items-center justify-between gap-2 ${
        temaOperador === 'claro' ? 'border-slate-300 bg-white text-slate-600' : 'border-slate-800/60 bg-slate-950 text-slate-500'
      }`}>
        <div className="flex items-center gap-2">
          <span>2026 © {nombreCongregacion}. Todos los derechos reservados.</span>
          <span className="text-slate-500">•</span>
          <span>Creado por: <strong className="text-amber-500 font-bold">LuftmandMauricio</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <span>Proyector LBC v3.4</span>
          <span className="text-emerald-500 font-semibold">● Canal Dual Activo (0ms)</span>
        </div>
      </footer>
    </div>
  );
}
