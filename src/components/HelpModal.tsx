import React, { useState, useMemo } from 'react';
import {
  HelpCircle, Search, X, BookOpen, Music, Image, Video, Mic,
  Radio, Keyboard, Settings, AlertTriangle, Monitor, ExternalLink,
  CheckCircle2, Sparkles, ScrollText, Play, Trash2
} from 'lucide-react';

interface HelpTopic {
  id: string;
  numero: number;
  titulo: string;
  subtitulo: string;
  icono: any;
  resumen: string;
  contenido: {
    paraQueSirve: string;
    comoSeUsa: string[];
    detallesImportantes?: string[];
    atajos?: { tecla: string; descripcion: string }[];
  };
}

const TEMAS_AYUDA: HelpTopic[] = [
  {
    id: 'portada-proyector',
    numero: 1,
    titulo: 'Proyector Automático en TV (Pantalla 2)',
    subtitulo: 'Detección automática de HDMI sin arrastrar ventanas',
    icono: Monitor,
    resumen: 'Con 1 solo clic detecta el televisor o proyector externo y abre a pantalla completa.',
    contenido: {
      paraQueSirve: 'Evita tener que arrastrar ventanas con el mouse de una pantalla a otra. Con un solo clic proyecta directamente en el televisor del templo en pantalla completa.',
      comoSeUsa: [
        'Conecta tu televisor o proyector a la computadora mediante cable HDMI.',
        'Haz clic en el botón "🖥️ Proyectar en TV (Pantalla 2)" en la barra superior o en la Portada.',
        'El sistema localiza la Pantalla 2 automáticamente y abre la proyección a pantalla completa sin bordes.',
        'El botón cambiará a rojo: "⏹️ Apagar TV (Pantalla 2)". Vuelve a tocarlo para apagar la proyección.'
      ],
      detallesImportantes: [
        'Si no hay segundo monitor conectado (ej: estás ensayando en casa), se abre en una ventana normal de prueba.',
        'La pantalla del proyector permanece siempre limpia, con fondo eclesiástico y sin menús que distraigan.'
      ]
    }
  },
  {
    id: 'biblia',
    numero: 2,
    titulo: 'Sagradas Escrituras (Biblia Completa)',
    subtitulo: 'Navegación por libros, capítulos, versículos y versiones',
    icono: BookOpen,
    resumen: 'Acceso a los 66 libros con versiones RV1960, NTV, NVI, DHH y TLA sin depender de internet.',
    contenido: {
      paraQueSirve: 'Proyectar las Sagradas Escrituras en segundos cuando el pastor o predicador lee la Palabra de Dios durante el culto.',
      comoSeUsa: [
        'Entra a la pestaña "Biblia".',
        'Filtra por Antiguo Testamento, Nuevo Testamento o escribe el nombre del libro en el buscador.',
        'Selecciona el capítulo y haz clic en el versículo que deseas proyectar.',
        'Usa las teclas de Flecha Derecha (➡️) y Flecha Izquierda (⬅️) para avanzar o retroceder al siguiente versículo mientras el pastor lee sin tener que usar el mouse.'
      ],
      detallesImportantes: [
        'Para tener los 66 libros listos en cualquier PC sin cargar nada, simplemente copia tus 66 archivos JSON en "public/data/biblia/versiones/rv1960/".',
        'El pie de página muestra siempre la cita bíblica (ej: Deuteronomio 10:4) en letras doradas legibles.'
      ],
      atajos: [
        { tecla: '➡️ Flecha Derecha', descripcion: 'Pasa al siguiente versículo del capítulo' },
        { tecla: '⬅️ Flecha Izquierda', descripcion: 'Vuelve al versículo anterior' },
        { tecla: 'C (o F4)', descripcion: 'Limpia la pantalla bíblica al finalizar la lectura' }
      ]
    }
  },
  {
    id: 'canciones',
    numero: 3,
    titulo: 'Cancionero y Setlists con Reordenación por Mouse',
    subtitulo: 'Búsqueda instantánea y organización de canciones para el culto',
    icono: Music,
    resumen: 'Catálogo de más de 500 canciones, corarios y setlists para Domingo, Miércoles, Sábado y Especial.',
    contenido: {
      paraQueSirve: 'Organizar y proyectar las alabanzas en sincronía con el ministerio de música y reordenar las canciones con el ratón.',
      comoSeUsa: [
        'Escribe el título o palabra de la letra en el buscador para encontrar cualquier alabanza al instante.',
        'Haz clic en cualquier estrofa o coro para proyectarlo inmediatamente en la pantalla gigante.',
        '¿Falta de ortografía o estrofas sin separar?: Haz clic en el botón "✏️ Editar Letra" (arriba a la derecha de la alabanza seleccionada). Podrás corregir el texto, separar estrofas con doble Enter o marcar [CORO] en un segundo.',
        'Para agregar una canción al culto, pulsa "+ Agregar a Setlist" y elige el día (Domingo, Miércoles, Sábado, Especial).',
        '¿Te equivocaste en el orden?: Arrastra la canción con el mouse o usa los botones de flecha (⬆ ⬇) en cada tarjeta para subir o bajar su posición al instante.'
      ],
      detallesImportantes: [
        'El botón "✏️ Editar Letra" guarda automáticamente los cambios en tu repertorio permanente y actualiza la proyección en vivo si la estás mostrando.',
        'El botón "+ Nueva" te permite agregar alabanzas nuevas que no estén en el cancionario.',
        'El botón "+ Cargar Cancionero" importa cancioneros en formato .JSON y también archivos nativos .JS de la iglesia anterior (Canciones.js, Corario IPUC castilla.js, Himnario Lluvias de Bendicion.js, Infantiles.js, Manantial de Inspiracion.js, Mi Cancionero.js) importando más de 500 canciones en 1 segundo sin tener que copiar letra por letra.'
      ],
      atajos: [
        { tecla: '➡️ Flecha Derecha', descripcion: 'Avanza a la siguiente estrofa o coro' },
        { tecla: '⬅️ Flecha Izquierda', descripcion: 'Regresa a la estrofa anterior' }
      ]
    }
  },
  {
    id: 'predica',
    numero: 4,
    titulo: 'Prédica & Bosquejos Pastorales',
    subtitulo: 'Plantillas de temas, citas bíblicas y puntos del sermón',
    icono: ScrollText,
    resumen: 'Muestra a la congregación el tema del día, el predicador, las citas y cada punto expuesto.',
    contenido: {
      paraQueSirve: 'Permite que la congregación siga de manera clara la predicación, conociendo el tema tratado, las citas bíblicas y los puntos 1, 2, 3, etc.',
      comoSeUsa: [
        'Ve a la pestaña "Prédica & Bosquejo" (ubicada entre Canciones y Fondos).',
        'Escribe el Tema de la enseñanza, el nombre del predicador y la fecha o culto.',
        'Agrega las citas bíblicas que usará el pastor con el botón "+ Añadir".',
        'Escribe los puntos del sermón (Punto 1, Punto 2, Punto 3) y agrégalos a la lista.',
        'Durante la prédica, pulsa "👑 Proyectar Portada", "📖 Proyectar Citas Bíblicas" o haz clic en "▶ Proyectar" en el punto que el pastor esté desarrollando.'
      ],
      detallesImportantes: [
        'Cada punto proyectado muestra arriba el tema de la prédica en subtítulo para máxima claridad.',
        'Puedes guardar múltiples bosquejos para cultos dominicales, de doctrina o campañas.'
      ]
    }
  },
  {
    id: 'video-youtube',
    numero: 5,
    titulo: 'Videos de Culto y YouTube (Detener y Quitar)',
    subtitulo: 'Videos locales, YouTube oficial y botón de emergencia para quitar video',
    icono: Video,
    resumen: 'Reproduce videos locales y enlaces de YouTube con botones para quitarlos por completo.',
    contenido: {
      paraQueSirve: 'Proyectar videos de testimonios, anuncios en video o alabanzas de YouTube sin que sigan cargando ni sonando de fondo al cambiar de pestaña.',
      comoSeUsa: [
        'Videos Locales: carga tu archivo MP4/WebM y pulsa "▶ Proyectar Video en Pantalla".',
        'YouTube: pega el enlace del video, pulsa "Cargar" y luego "▶ Proyectar YouTube en Pantalla Completa".',
        '¿Terminó el video?: Pulsa "❌ Quitar Video del Todo" para eliminarlo por completo y que no siga sonando ni consumiendo memoria.',
        'Botón de Emergencia en la barra superior: si estás en cualquier otra pestaña y hay un video sonando, verás un botón rojo parpadeante "⏹️ Quitar Video" que lo apaga inmediatamente con un solo clic.'
      ],
      detallesImportantes: [
        'Al proyectar cualquier canción, versículo o bosquejo, el video se detiene automáticamente para evitar sonidos superpuestos.'
      ]
    }
  },
  {
    id: 'karaoke-pistas',
    numero: 6,
    titulo: 'Karaoke, Ajuste de Tono (Pitch) y Setlist de Pistas Múltiples',
    subtitulo: 'Ajuste de semitonos sin alterar velocidad, subida en lote y reproducción directa',
    icono: Mic,
    resumen: 'Sube varias pistas MP3 a la vez (4, 8, 10, 20), ajusta el tono para la voz sin cambiar el tiempo y reproduce con 1 clic.',
    contenido: {
      paraQueSirve: 'Diseñado para cultos donde una sola persona o grupo vocal canta con pistas instrumentales de audio MP3 o WAV, sin necesidad de músicos en vivo.',
      comoSeUsa: [
        'Ajuste de Tono (Pitch Shifter en Semitonos): usa los botones "-1 Semitono", "+1 Semitono" o la barra de -3 a +3 para adaptar la pista al tono de voz de quien va a cantar. El tiempo y la velocidad de la pista permanecen 100% constantes e idénticos (no se acelera ni se frena). Para volver al tono original, pulsa el botón central con la flecha circular.',
        'Botón "+ Pistas MP3" (Subida Múltiple): en la sección "SETLIST DE PISTAS", pulsa "+ Pistas MP3" y selecciona de una sola vez 4, 8, 10, 15 o 20 canciones desde tu computadora. Todas se agregarán automáticamente a la lista del culto seleccionado.',
        'Listas por Días del Culto: selecciona si las pistas son para Domingo, Miércoles, Sábado o un culto Especial.',
        'Botón Play (▶) directo en cada canción: en el culto no tienes que subir pistas una por una. Dale clic directamente al botón circular de Play (▶) de la pista en el Setlist y comenzará a sonar al instante, cargando a la derecha las letras correspondientes.',
        'Botón "Eliminar Pista" (🗑️): en el panel superior de reproducción, haz clic en el botón rojo "Eliminar pista" para retirar el archivo actual y dejar el reproductor limpio.',
        'Auto-avance de pista: cuando una pista de audio finaliza, el sistema prepara automáticamente la siguiente de la lista para que la alabanza no se detenga.'
      ],
      detallesImportantes: [
        'Las pistas con archivo MP3 cargado muestran una insignia verde "MP3".',
        'Puedes reordenar las canciones arrastrándolas con el ratón o con las flechas ⬆ ⬇.',
        'El botón de la papelera en la cabecera permite vaciar el Setlist de ese día si deseas armar uno nuevo.'
      ]
    }
  },
  {
    id: 'fondos-canva',
    numero: 7,
    titulo: 'Fondos Litúrgicos, Banners Canva y Ajuste de Imagen',
    subtitulo: 'Completar, Rellenar, Pantalla Completa y Filtro Oscuro de Contraste',
    icono: Sparkles,
    resumen: 'Ajuste de imagen perfecto para cualquier pantalla de TV y filtros oscuros para 100% legibilidad.',
    contenido: {
      paraQueSirve: 'Garantizar que todo flyer de Canva, diapositiva o fondo bíblico se proyecte en el televisor del templo sin deformarse y con las letras siempre legibles.',
      comoSeUsa: [
        'Pestaña "Diapositivas & Canva": haz clic sobre cualquiera de las imágenes oficiales de la iglesia para proyectarla en la pantalla de la congregación.',
        'Los 3 Modos de Ajuste de Imagen:',
        '• 🎯 Completar, no cortar: Muestra el diseño completo centrado sin cortar nada de texto (ideal para afiches de actividades y anuncios).',
        '• 📐 Rellenar pantalla: Rellena toda la pantalla panorámica 16:9 recortando ligeramente los bordes sobrantes.',
        '• ↔️ Pantalla completa: Estira y ajusta la imagen al 100% de la TV eliminando cualquier franja negra.',
        'Filtro Oscuro para Letras (0%, 30%, 45% Óptimo, 65%): oscurece suavemente la imagen o el fondo litúrgico para que las letras blancas de las alabanzas o citas bíblicas resalten con máximo contraste.',
        'Pestaña "Fondos": cuenta con los mismos controles de ajuste y brillo para los fondos litúrgicos animados y estáticos.'
      ],
      detallesImportantes: [
        'Tanto el monitor de control como el televisor HDMI aplican el ajuste y el filtro en tiempo real.',
        'El valor predeterminado recomendado para alabanza es "45% (Óptimo)".'
      ]
    }
  },
  {
    id: 'obs-streaming',
    numero: 8,
    titulo: 'OBS Studio (Transmisión en Vivo)',
    subtitulo: 'Tercios inferiores transparentes para YouTube y Facebook Live',
    icono: Radio,
    resumen: 'Conecta las cámaras del templo con OBS Studio para mostrar las letras y versículos en la transmisión.',
    contenido: {
      paraQueSirve: 'Para iglesias que transmiten sus cultos por Facebook o YouTube. Permite poner las letras de canciones y versículos bíblicos en la parte inferior de la pantalla (Lower Third) sobre la cámara de la transmisión con fondo 100% transparente.',
      comoSeUsa: [
        'Abre OBS Studio en la computadora del templo.',
        'En Fuentes de tu escena, haz clic en "+" y elige "Navegador" (Browser Source).',
        'Método 1 (Archivo Local - Más Rápido y Directo): Marca la casilla "Archivo local" (Local file), pulsa "Examinar" y selecciona el archivo "public/obs.html" dentro de tu carpeta del proyecto.',
        'Método 2 (URL Web con Servidor): Desmarca "Archivo local" y en la URL escribe: http://localhost:3000/obs.html (requiere tener abierto 2-EJECUTAR-PROGRAMA.bat).',
        'Configura el Ancho en 1920 y el Alto en 1080.',
        'Marca la casilla "Apagar fuente cuando no esté visible".',
        '¡Listo! Todo versículo, canción o anuncio que proyectes aparecerá con un elegante tercio inferior en la transmisión sin tapar el rostro de los hermanos.'
      ],
      detallesImportantes: [
        'El diseño incluye la barra distintiva con los 4 colores cuadrangulares (Rojo, Azul, Dorado y Morado).',
        'Incluye botón especial para proyectar el "Banner del Pastor / Predicador" en vivo.'
      ]
    }
  },
  {
    id: 'atajos-teclado',
    numero: 9,
    titulo: 'Atajos de Teclado del Operador',
    subtitulo: 'Control rápido durante el culto sin depender del mouse',
    icono: Keyboard,
    resumen: 'Teclas rápidas para Blackout inmediato, Limpiar y Navegación.',
    contenido: {
      paraQueSirve: 'Permite reaccionar al instante ante cualquier imprevisto durante el culto (por ejemplo, si el pastor pide apagar la pantalla o cambiar de versículo rápidamente).',
      comoSeUsa: [
        'Simplemente presiona las siguientes teclas desde el panel de control o desde la ventana del proyector:'
      ],
      atajos: [
        { tecla: 'B (o F5)', descripcion: 'BLACKOUT: Apagado negro instantáneo de la pantalla del proyector' },
        { tecla: 'C (o F4)', descripcion: 'LIMPIAR: Oculta la letra o versículo y regresa al fondo de la iglesia' },
        { tecla: '➡️ Flecha Derecha', descripcion: 'Siguiente estrofa, siguiente versículo o siguiente imagen' },
        { tecla: '⬅️ Flecha Izquierda', descripcion: 'Estrofa anterior, versículo anterior o imagen anterior' },
        { tecla: 'F11 / Doble Clic', descripcion: 'Activa o desactiva la Pantalla Completa del proyector' }
      ]
    }
  },
  {
    id: 'solucion-problemas',
    numero: 10,
    titulo: 'Estructura de Archivos y Preguntas Frecuentes',
    subtitulo: '¿Qué hace cada carpeta y archivo? Explicación de node_modules y ejecutables',
    icono: AlertTriangle,
    resumen: 'Guía sobre los archivos de la carpeta del proyecto y consejos para el computador del templo.',
    contenido: {
      paraQueSirve: 'Conocer qué archivos son indispensables en tu carpeta y evitar borrar componentes vitales del sistema.',
      comoSeUsa: [
        '¿Se debe borrar la carpeta "node_modules"?: ¡NO, NUNCA! "node_modules" NO es basura; contiene el motor de la aplicación (React, Vite, Tailwind, el servidor web y los iconos). Si la borras, el archivo "2-EJECUTAR-PROGRAMA.bat" no podrá arrancar y mostrará error.',
        '¿Para qué sirve "2-EJECUTAR-PROGRAMA.bat"?: Inicia el servidor local en tu PC y abre el proyector en http://localhost:3000 sin depender de internet.',
        '¿Para qué sirve "1-INSTALAR-DEPENDENCIAS.bat"?: Se ejecuta una sola vez cuando descargas el proyecto en una computadora nueva para descargar las librerías necesarias.',
        '¿Para qué sirve "3-CREAR-INSTALADOR-EXE.bat"?: Compila todo el sistema para crear el archivo instalador .EXE con el logo oficial de la iglesia.',
        'Carpetas "src" y "public": "src" contiene el código de la aplicación y "public" contiene las imágenes, videos, canciones y la página de la TV (display.html).'
      ],
      detallesImportantes: [
        'Ningún archivo de tu carpeta principal es basura: los 17 elementos que ves en tu explorador son necesarios para el funcionamiento y compilación del proyecto.',
        'Todo el sistema trabaja 100% de manera local y fuera de línea sin requerir conexión a internet durante el culto.'
      ]
    }
  }
];

interface HelpModalProps {
  abierto: boolean;
  alCerrar: () => void;
  temaOperador: 'oscuro' | 'claro';
  alAbrirObs?: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  abierto,
  alCerrar,
  temaOperador,
  alAbrirObs
}) => {
  const [temaSeleccionadoId, setTemaSeleccionadoId] = useState<string>('portada-proyector');
  const [busqueda, setBusqueda] = useState<string>('');

  const temasFiltrados = useMemo(() => {
    if (!busqueda.trim()) return TEMAS_AYUDA;
    const q = busqueda.toLowerCase().trim();
    return TEMAS_AYUDA.filter(t =>
      t.titulo.toLowerCase().includes(q) ||
      t.subtitulo.toLowerCase().includes(q) ||
      t.resumen.toLowerCase().includes(q) ||
      t.contenido.paraQueSirve.toLowerCase().includes(q) ||
      t.contenido.comoSeUsa.some(c => c.toLowerCase().includes(q))
    );
  }, [busqueda]);

  const temaActivo = TEMAS_AYUDA.find(t => t.id === temaSeleccionadoId) || TEMAS_AYUDA[0];

  if (!abierto) return null;

  const esOscuro = temaOperador !== 'claro';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border ${
        esOscuro ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
      }`}>
        
        {/* Cabecera del Modal */}
        <div className={`px-6 py-4 border-b flex items-center justify-between gap-4 ${
          esOscuro ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Manual y Centro de Ayuda ICC</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Operador Eclesiástico
                </span>
              </div>
              <p className={`text-xs ${esOscuro ? 'text-slate-400' : 'text-slate-600'}`}>
                Guía completa paso a paso para proyección en cultos y transmisiones en vivo
              </p>
            </div>
          </div>

          <button
            onClick={alCerrar}
            className={`p-2 rounded-xl transition cursor-pointer ${
              esOscuro ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600 hover:text-slate-950'
            }`}
            title="Cerrar ayuda (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo dividido en 2 columnas (Sidebar con búsqueda + Detalle) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Panel Izquierdo: Buscador y Lista de Temas */}
          <div className={`w-full md:w-80 border-r flex flex-col ${
            esOscuro ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
          }`}>
            <div className="p-3 border-b border-inherit">
              <div className={`relative flex items-center rounded-xl border px-3 py-2 ${
                esOscuro ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
              }`}>
                <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder="Buscar en la ayuda..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-full placeholder:text-slate-500"
                />
                {busqueda && (
                  <button onClick={() => setBusqueda('')} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {temasFiltrados.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No se encontraron temas con "{busqueda}"
                </div>
              ) : (
                temasFiltrados.map((tema) => {
                  const Icon = tema.icono;
                  const seleccionado = tema.id === temaActivo.id;
                  return (
                    <button
                      key={tema.id}
                      onClick={() => setTemaSeleccionadoId(tema.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${
                        seleccionado
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : esOscuro
                          ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          : 'text-slate-700 hover:bg-slate-200 hover:text-slate-950'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        seleccionado
                          ? 'bg-white/20 text-white'
                          : esOscuro
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {tema.numero}
                      </span>
                      <div className="flex-1 truncate">
                        <div className="truncate">{tema.titulo}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Panel Derecho: Contenido Extenso del Tema */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Encabezado del Tema */}
            <div className="space-y-1 pb-4 border-b border-inherit">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
                <span>Tema {temaActivo.numero}</span>
                <span>•</span>
                <span>Proyector ICC</span>
              </div>
              <h3 className={`text-2xl font-black ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                {temaActivo.numero}. {temaActivo.titulo}
              </h3>
              <p className={`text-sm ${esOscuro ? 'text-slate-300' : 'text-slate-600'}`}>
                {temaActivo.subtitulo}
              </p>
            </div>

            {/* Sección: Para qué sirve */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Para qué sirve
              </h4>
              <p className={`text-sm leading-relaxed p-4 rounded-xl border ${
                esOscuro ? 'bg-slate-950/60 border-slate-800/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                {temaActivo.contenido.paraQueSirve}
              </p>
            </div>

            {/* Sección: Cómo se usa paso a paso */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Cómo se usa paso a paso
              </h4>
              <ol className="space-y-2.5">
                {temaActivo.contenido.comoSeUsa.map((paso, idx) => (
                  <li
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-xs sm:text-sm ${
                      esOscuro ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{paso}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Sección: Atajos de Teclado (si aplica) */}
            {temaActivo.contenido.atajos && temaActivo.contenido.atajos.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4" />
                  Atajos de Teclado recomendados
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {temaActivo.contenido.atajos.map((at, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center gap-3 ${
                        esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <kbd className="px-2.5 py-1 rounded bg-purple-600/20 text-purple-300 border border-purple-500/40 font-mono font-bold text-xs shrink-0">
                        {at.tecla}
                      </kbd>
                      <span className="text-xs">{at.descripcion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalles Importantes */}
            {temaActivo.contenido.detallesImportantes && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Detalles Importantes
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  {temaActivo.contenido.detallesImportantes.map((d, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-amber-400">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Enlace directo a OBS si está en el tema de OBS */}
            {temaActivo.id === 'obs-streaming' && alAbrirObs && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-slate-900/60 border border-blue-500/30 flex items-center justify-between gap-4">
                <div>
                  <h5 className="font-bold text-sm text-blue-200">Panel de Control de OBS Studio</h5>
                  <p className="text-xs text-slate-300">Abre el panel para copiar la URL del navegador y probar los banners de transmisión.</p>
                </div>
                <button
                  onClick={() => {
                    alCerrar();
                    alAbrirObs();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Abrir Panel OBS</span>
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Footer del Modal */}
        <div className={`px-6 py-3 border-t flex flex-wrap items-center justify-between text-xs gap-3 ${
          esOscuro ? 'border-slate-800 bg-slate-950/80 text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-600'
        }`}>
          <div>
            Iglesia Cristiana Cuadrangular (ICC) • Manual de Operador
          </div>
          <button
            onClick={alCerrar}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white transition cursor-pointer"
          >
            Entendido / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
