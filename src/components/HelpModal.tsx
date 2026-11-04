import React, { useState, useMemo } from 'react';
import {
  HelpCircle, Search, X, BookOpen, Music, Image, Video, Mic,
  Radio, Keyboard, Settings, AlertTriangle, Monitor, ExternalLink,
  CheckCircle2, Sparkles
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
    titulo: 'Proyector y Pantalla Independiente',
    subtitulo: 'Apertura de la ventana de proyección y monitor de salida',
    icono: Monitor,
    resumen: 'Conexión en dos pantallas: panel de control para el operador y ventana limpia para la congregación.',
    contenido: {
      paraQueSirve: 'Permite que el operador en el templo elija canciones, versículos o diapositivas en su monitor sin que la congregación vea la interfaz del sistema. En el proyector de la iglesia solo aparece el resultado limpio a pantalla completa.',
      comoSeUsa: [
        'Haz clic en el botón amarillo "🖥️ Proyector" en la barra superior.',
        'Se abrirá una ventana nueva llamada Proyector LBC.',
        'Arrastra esa ventana a la segunda pantalla conectada al proyector de tu iglesia o al televisor.',
        'Presiona F11 o haz doble clic sobre la ventana del proyector para ponerla en Pantalla Completa sin bordes.'
      ],
      detallesImportantes: [
        'La pantalla del proyector no tiene textos de ayuda ni botones que distraigan a la congregación.',
        'La comunicación funciona 100% de manera local en tu computadora mediante canal interno ultrarrápido (BroadcastChannel + almacenamiento local).'
      ]
    }
  },
  {
    id: 'biblia',
    numero: 2,
    titulo: 'Biblia Completa (66 Libros)',
    subtitulo: 'Navegación por libros, capítulos, versículos y versiones',
    icono: BookOpen,
    resumen: 'Acceso a los 66 libros del Antiguo y Nuevo Testamento con versiones RV1960, NVI, DHH y TLA.',
    contenido: {
      paraQueSirve: 'Proyectar las Sagradas Escrituras en segundos cuando el pastor o predicador lee la Palabra de Dios durante el culto.',
      comoSeUsa: [
        'Entra a la pestaña "Biblia (66 Libros)".',
        'Filtra por Antiguo Testamento, Nuevo Testamento o escribe el nombre del libro en el buscador.',
        'Selecciona el capítulo en el panel de capítulos y haz clic en el versículo que deseas proyectar.',
        'Usa las teclas de Flecha Derecha (➡️) y Flecha Izquierda (⬅️) para avanzar o retroceder al siguiente versículo mientras el pastor lee sin tener que usar el mouse.'
      ],
      detallesImportantes: [
        'Puedes cargar tus carpetas locales de versiones bíblicas desde el botón "📂 Cargar Carpeta" (DHH, NVI, RVR1960, TLA, etc.).',
        'Cada versión y libro que cargues se guarda localmente en tu equipo para estar disponible sin internet.'
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
    titulo: 'Cancionero y Setlists de Alabanza',
    subtitulo: 'Búsqueda en tiempo real por estrofas, coro y armado de cultos',
    icono: Music,
    resumen: 'Catálogo de más de 500 canciones, corarios y cancioneros con selector de estrofas numeradas.',
    contenido: {
      paraQueSirve: 'Guía a la congregación durante el tiempo de alabanza y adoración proyectando la letra exacta en sincronía con el grupo de alabanza.',
      comoSeUsa: [
        'Escribe el título o cualquier palabra de la letra en la barra de búsqueda (ej. "No hay lugar más alto", "Cuan grande es Dios").',
        'Selecciona la canción para ver todas sus estrofas, coros y puentes.',
        'Haz clic en la estrofa o coro que esté cantando el grupo de alabanza para proyectarlo de inmediato.',
        'Puedes presionar las Flechas Derecha / Izquierda en tu teclado para avanzar a la siguiente estrofa fácilmente.',
        'Usa el botón "+ Agregar a Lista" para preparar el Setlist del culto del domingo con anticipación.'
      ],
      detallesImportantes: [
        'Puedes importar tus propios archivos JSON ("Mi Cancionero.json", "Corario.json") haciendo clic en "📂 Importar JSON".',
        'El sistema normaliza acentos y mayúsculas para encontrar canciones aunque tengan tildes omitidas.'
      ],
      atajos: [
        { tecla: '➡️ Flecha Derecha', descripcion: 'Avanza a la siguiente estrofa o coro' },
        { tecla: '⬅️ Flecha Izquierda', descripcion: 'Regresa a la estrofa anterior' }
      ]
    }
  },
  {
    id: 'fondos',
    numero: 4,
    titulo: 'Fondos y Personalización',
    subtitulo: 'Fondos sobrios de adoración, colores litúrgicos y tipografías',
    icono: Image,
    resumen: 'Galería de fondos oscuros, gradientes eclesiásticos y control de fuentes.',
    contenido: {
      paraQueSirve: 'Brindar un fondo elegante que asegure la lectura clara de las letras desde la última banca del templo.',
      comoSeUsa: [
        'Ve a la pestaña "Fondos".',
        'Haz clic en cualquier fondo de la galería (Azul Medianoche, Rojo Carmesí Cuadrangular, Noche de Adoración, etc.).',
        'El fondo se actualiza automáticamente tanto en el monitor del operador como en la pantalla del proyector.',
        'En la pestaña "Ajustes" puedes cambiar la tipografía (Segoe UI, Impact, Georgia) y el color de las letras.'
      ],
      detallesImportantes: [
        'Los fondos oscuros con texto blanco o amarillo dorado son los más recomendados para iglesias porque no cansan la vista y no sobrecalientan los proyectores.'
      ]
    }
  },
  {
    id: 'canva-anuncios',
    numero: 5,
    titulo: 'Diapositivas y Flyers de Canva',
    subtitulo: 'Subida y proyección de imágenes de bienvenida, culto infantil y eventos',
    icono: Sparkles,
    resumen: 'Carga tus imágenes diseñadas en Canva (PNG o JPEG) para proyectar anuncios en alta resolución.',
    contenido: {
      paraQueSirve: 'Presentar avisos de actividades, culto infantil, santa cena, diezmos, campañas especiales o bienvenida a los visitantes.',
      comoSeUsa: [
        'Diseña tu imagen en Canva y descárgala en formato PNG o JPG en tu computadora.',
        'En Proyector LBC, ve a la pestaña "Diapositivas & Canva".',
        'Haz clic en el botón azul "➕ Subir Imágenes (Canva / PNG / JPG)".',
        'Selecciona uno o varios archivos desde tu explorador.',
        'La imagen se optimiza automáticamente y queda guardada en tu galería local de la iglesia.',
        'Haz clic en "🖥️ Proyectar" sobre la miniatura para mostrarla a pantalla completa en el proyector.',
        'Para borrarla cuando termine la actividad, haz clic en el icono de papelera 🗑️.'
      ],
      detallesImportantes: [
        'El sistema incluye compresión inteligente para que tus imágenes se guarden rápido y no ocupen exceso de memoria en la computadora.',
        'Viene con diapositivas predeterminadas listas para usar (Bienvenida Cuadrangular, Culto Infantil, Santa Cena y Diezmos).'
      ],
      atajos: [
        { tecla: '➡️ Flecha Derecha', descripcion: 'Pasa a la siguiente imagen de la galería' },
        { tecla: '⬅️ Flecha Izquierda', descripcion: 'Vuelve a la imagen anterior' }
      ]
    }
  },
  {
    id: 'video-karaoke',
    numero: 6,
    titulo: 'Video y Pistas de Karaoke',
    subtitulo: 'Videos MP4 para el proyector y pistas instrumentales de audio',
    icono: Video,
    resumen: 'Reproducción de fondos animados en video MP4 y pistas de alabanza con selector de volumen.',
    contenido: {
      paraQueSirve: 'Transmitir videos de eventos, testimonios o fondos dinámicos al proyector, y reproducir pistas instrumentales para solistas o grupos de alabanza.',
      comoSeUsa: [
        'Pestaña "Video": carga cualquier video MP4 desde tu computadora, ajusta el volumen y presiona "▶ Proyectar Video en Pantalla Completa".',
        'Pestaña "Karaoke": carga una pista de audio (MP3/WAV) y selecciona la canción correspondiente para seguir la letra estrofa por estrofa en el culto.'
      ],
      detallesImportantes: [
        'Puedes silenciar o activar el audio del video según si es un fondo instrumental o un video con predicación/testimonio.',
        'Al presionar "⏹ Detener Video", el proyector regresa automáticamente a la portada o fondo de espera.'
      ]
    }
  },
  {
    id: 'obs-streaming',
    numero: 7,
    titulo: 'OBS Studio (Transmisión en Vivo)',
    subtitulo: 'Tercios inferiores transparentes para YouTube y Facebook Live',
    icono: Radio,
    resumen: 'Conecta las cámaras del templo con OBS Studio para mostrar las letras y versículos en la transmisión.',
    contenido: {
      paraQueSirve: 'Para iglesias que transmiten sus cultos por Facebook o YouTube. Permite poner las letras de canciones y versículos bíblicos en la parte inferior de la pantalla (Lower Third) sobre la cámara de la transmisión con fondo 100% transparente.',
      comoSeUsa: [
        'Abre OBS Studio en la computadora del templo.',
        'En Fuentes de tu escena, haz clic en "+" y elige "Navegador" (Browser Source).',
        'En la URL, escribe: http://localhost:3000/obs.html (o la ruta al archivo obs.html si usas la versión local).',
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
    numero: 8,
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
    numero: 9,
    titulo: 'Preguntas Frecuentes y Solución de Problemas',
    subtitulo: 'Consejos para el computador del templo y empaquetado .EXE',
    icono: AlertTriangle,
    resumen: 'Cómo solucionar pantalla en blanco, permisos locales y ejecución sin conexión a internet.',
    contenido: {
      paraQueSirve: 'Ayudar al operador a resolver dudas comunes en el día a día del templo.',
      comoSeUsa: [
        'Si la pantalla del proyector se abre en blanco: asegúrate de haber hecho clic en el botón "🖥️ Proyector" de la barra superior y selecciona cualquier versículo o canción para activarlo.',
        'Para ejecutar 100% sin internet: el paquete ZIP descargado contiene todos los archivos necesarios (data, assets, scripts) para funcionar offline sin requerir conexión.',
        'Para compilar tu archivo .EXE final: usa el comando "npm run build" y luego empaquétalo con Electron ("npx electron-builder") usando el archivo electron-main.js ya configurado en el paquete.',
        'Si quieres cambiar el nombre de la congregación: ve a "Ajustes" y escribe el nombre de tu sede o filial.'
      ],
      detallesImportantes: [
        'El sistema nunca sube tus canciones ni versículos a internet; la privacidad de la congregación está totalmente protegida.'
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
                <h2 className="text-lg font-black tracking-tight">Manual y Centro de Ayuda LBC</h2>
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
                <span>Proyector LBC</span>
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
            Iglesia Cristiana Cuadrangular Barrio Las Brisas (LBC) • Manual de Operador
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
