export const VANILLA_APP_JS = `/**
 * PROYECTOR LBC - Sistema de Proyección Eclesiástica
 * Archivo principal JS (app.js) optimizado para ejecución 100% local (sin servidor / Electron / file://)
 * Copyright © LuftmanDMauricio. Todos los derechos reservados.
 */

// Canal de comunicación con la ventana de proyección secundaria
const canal = new BroadcastChannel('proyector_lbc');

// ==================== VARIABLES DE ESTADO ====================
let repertorioCanciones = [];
let cancionesFiltradas = [];
let cancionSeleccionada = null;
let seccionActivaIndice = -1;

let setlistActualNombre = "general";
let setlists = {
    general: [],
    miercoles: [],
    sabado: [],
    domingo: []
};

// Variables Biblia
let versionActual = "rv1960";
let libroActualArchivo = "genesis.json";
let nombreLibroActual = "Génesis";
let libroDataActual = null;
let capituloActual = "1";
let versiculoActual = "1";

const librosAntiguo = [
    { nombre: "Génesis", archivo: "genesis.json" },
    { nombre: "Éxodo", archivo: "exodus.json" },
    { nombre: "Levítico", archivo: "leviticus.json" },
    { nombre: "Números", archivo: "numbers.json" },
    { nombre: "Deuteronomio", archivo: "deuteronomy.json" },
    { nombre: "Josué", archivo: "joshua.json" },
    { nombre: "Jueces", archivo: "judges.json" },
    { nombre: "Rut", archivo: "ruth.json" },
    { nombre: "1 Samuel", archivo: "1samuel.json" },
    { nombre: "2 Samuel", archivo: "2samuel.json" },
    { nombre: "1 Reyes", archivo: "1kings.json" },
    { nombre: "2 Reyes", archivo: "2kings.json" },
    { nombre: "1 Crónicas", archivo: "1chronicles.json" },
    { nombre: "2 Crónicas", archivo: "2chronicles.json" },
    { nombre: "Esdras", archivo: "ezra.json" },
    { nombre: "Nehemías", archivo: "nehemiah.json" },
    { nombre: "Ester", archivo: "esther.json" },
    { nombre: "Job", archivo: "job.json" },
    { nombre: "Salmos", archivo: "psalms.json" },
    { nombre: "Proverbios", archivo: "proverbs.json" },
    { nombre: "Eclesiastés", archivo: "ecclesiastes.json" },
    { nombre: "Cantares", archivo: "songofsolomon.json" },
    { nombre: "Isaías", archivo: "isaiah.json" },
    { nombre: "Jeremías", archivo: "jeremiah.json" },
    { nombre: "Lamentaciones", archivo: "lamentations.json" },
    { nombre: "Ezequiel", archivo: "ezekiel.json" },
    { nombre: "Daniel", archivo: "daniel.json" },
    { nombre: "Oseas", archivo: "hosea.json" },
    { nombre: "Joel", archivo: "joel.json" },
    { nombre: "Amós", archivo: "amos.json" },
    { nombre: "Abdías", archivo: "obadiah.json" },
    { nombre: "Jonás", archivo: "jonah.json" },
    { nombre: "Miqueas", archivo: "micah.json" },
    { nombre: "Nahúm", archivo: "nahum.json" },
    { nombre: "Habacuc", archivo: "habakkuk.json" },
    { nombre: "Sofonías", archivo: "zephaniah.json" },
    { nombre: "Hageo", archivo: "haggai.json" },
    { nombre: "Zacarías", archivo: "zechariah.json" },
    { nombre: "Malaquías", archivo: "malachi.json" }
];

const librosNuevo = [
    { nombre: "Mateo", archivo: "matthew.json" },
    { nombre: "Marcos", archivo: "mark.json" },
    { nombre: "Lucas", archivo: "luke.json" },
    { nombre: "Juan", archivo: "john.json" },
    { nombre: "Hechos", archivo: "acts.json" },
    { nombre: "Romanos", archivo: "romans.json" },
    { nombre: "1 Corintios", archivo: "1corinthians.json" },
    { nombre: "2 Corintios", archivo: "2corinthians.json" },
    { nombre: "Gálatas", archivo: "galatians.json" },
    { nombre: "Efesios", archivo: "ephesians.json" },
    { nombre: "Filipenses", archivo: "philippians.json" },
    { nombre: "Colosenses", archivo: "colossians.json" },
    { nombre: "1 Tesalonicenses", archivo: "1thessalonians.json" },
    { nombre: "2 Tesalonicenses", archivo: "2thessalonians.json" },
    { nombre: "1 Timoteo", archivo: "1timothy.json" },
    { nombre: "2 Timoteo", archivo: "2timothy.json" },
    { nombre: "Tito", archivo: "titus.json" },
    { nombre: "Filemón", archivo: "philemon.json" },
    { nombre: "Hebreos", archivo: "hebrews.json" },
    { nombre: "Santiago", archivo: "james.json" },
    { nombre: "1 Pedro", archivo: "1peter.json" },
    { nombre: "2 Pedro", archivo: "2peter.json" },
    { nombre: "1 Juan", archivo: "1john.json" },
    { nombre: "2 Juan", archivo: "2json.json" },
    { nombre: "3 Juan", archivo: "3json.json" },
    { nombre: "Judas", archivo: "jude.json" },
    { nombre: "Apocalipsis", archivo: "revelation.json" }
];

// ==================== UTILIDAD DE NORMALIZACIÓN (BUSCADOR INFALIBLE) ====================
function normalizarTexto(texto) {
    if (texto === null || texto === undefined) return "";
    return String(texto)
        .normalize("NFD")
        .replace(/[\\u0300-\\u036f]/g, "")
        .toLowerCase()
        .trim();
}

// ==================== INICIALIZACIÓN ====================
window.addEventListener('DOMContentLoaded', async () => {
    const anioActual = new Date().getFullYear();
    const copyEl = document.getElementById('copyright-text');
    if (copyEl) {
        copyEl.innerText = \`\${anioActual} Copyright © LuftmanDMauricio. Todos los derechos reservados.\`;
    }

    // Inicializar listeners de teclado
    configurarTeclado();

    // Inicializar Biblia
    renderizarListasLibros(librosAntiguo, librosNuevo);
    cargarDatosLibro();

    // Cargar Setlists guardados de localStorage si existen
    cargarSetlistsDeStorage();

    // Cargar repertorio de canciones con estrategia triple
    await cargarCancionesConEstrategiaLocal();
});

// Configurar atajos de teclado para el operador de medios
function configurarTeclado() {
    document.addEventListener('keydown', (e) => {
        // Ignorar si el usuario está escribiendo en un input o textarea
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        if (e.key === 'ArrowRight' || e.key === 'PageDown') {
            e.preventDefault();
            avanzarEstrofa();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            e.preventDefault();
            retrocederEstrofa();
        } else if (e.key === 'b' || e.key === 'B' || e.key === 'F5') {
            e.preventDefault();
            toggleBlackout();
        } else if (e.key === 'c' || e.key === 'C' || e.key === 'F4' || e.key === 'Escape') {
            e.preventDefault();
            limpiarPantalla();
        }
    });
}

// ==================== NAVEGACIÓN DE MÓDULOS ====================
function cambiarModulo(modulo) {
    const secBiblia = document.getElementById('seccion-biblia');
    const secCanciones = document.getElementById('seccion-canciones');
    const btnBiblia = document.getElementById('btn-mod-biblia');
    const btnCanciones = document.getElementById('btn-mod-canciones');

    if (modulo === 'biblia') {
        secBiblia.style.display = 'block';
        secCanciones.style.display = 'none';
        btnBiblia.classList.add('activo');
        btnCanciones.classList.remove('activo');
    } else {
        secBiblia.style.display = 'none';
        secCanciones.style.display = 'block';
        btnBiblia.classList.remove('activo');
        btnCanciones.classList.add('activo');
    }
}

// ==================== CARGA DE CANCIONES (RESILIENTE Y LOCAL) ====================
/**
 * Triple estrategia para leer JSON local sin romper la aplicación:
 * 1. Intenta localStorage (carga inmediata en 0ms offline)
 * 2. Si hay servidor local / Electron con soporte web, hace fetch a Corario.json y Mi Cancionero.json
 * 3. Si ambos fallan (por CORS en file:///), permite al operador seleccionar o arrastrar sus archivos JSON directamente con FileReader.
 */
async function cargarCancionesConEstrategiaLocal() {
    // Paso 1: Intentar leer de caché local previo
    const cacheLocal = localStorage.getItem('proyector_lbc_canciones');
    if (cacheLocal) {
        try {
            const parsed = JSON.parse(cacheLocal);
            if (Array.isArray(parsed) && parsed.length > 0) {
                repertorioCanciones = parsed;
                cancionesFiltradas = [...repertorioCanciones];
                renderizarListaCanciones();
                actualizarContadorCanciones(\`\${repertorioCanciones.length} canciones (desde memoria local)\`);
                // Intentamos actualizar en segundo plano silenciosamente
                actualizarDesdeArchivosRed(false);
                return;
            }
        } catch (err) {
            console.warn("No se pudo leer caché de canciones:", err);
        }
    }

    // Paso 2: Intentar fetch a los archivos
    await actualizarDesdeArchivosRed(true);
}

async function actualizarDesdeArchivosRed(notificar) {
    let nuevasCanciones = [];

    // Rutas a probar (con codificación para espacios en blanco como "Mi%20Cancionero.json")
    const rutas = [
        'data/cancioneros/Corario.json',
        'data/cancioneros/Mi%20Cancionero.json',
        'data/cancioneros/Mi Cancionero.json',
        'Corario.json',
        'Mi%20Cancionero.json'
    ];

    for (const ruta of rutas) {
        try {
            const resp = await fetch(ruta);
            if (resp.ok) {
                const datos = await resp.json();
                const normalizadas = normalizarEstructuraCanciones(datos, ruta);
                nuevasCanciones = nuevasCanciones.concat(normalizadas);
                console.log(\`Cargadas \${normalizadas.length} canciones desde \${ruta}\`);
            }
        } catch (e) {
            // Falla esperada si corre desde file:/// en navegador estándar
        }
    }

    if (nuevasCanciones.length > 0) {
        // Eliminar duplicados por ID o título
        const mapUnicas = new Map();
        nuevasCanciones.forEach(c => mapUnicas.set(c.title.toLowerCase(), c));
        repertorioCanciones = Array.from(mapUnicas.values());
        
        cancionesFiltradas = [...repertorioCanciones];
        guardarEnStorageCanciones();
        renderizarListaCanciones();
        actualizarContadorCanciones(\`\${repertorioCanciones.length} canciones cargadas\`);
    } else if (repertorioCanciones.length === 0) {
        renderizarListaCanciones();
        actualizarContadorCanciones("0 canciones. Usa el botón '📁 Cargar JSON Local'");
    }
}

// Parser resiliente: acepta cualquier formato JSON sin caer en error
function normalizarEstructuraCanciones(datos, origen) {
    let lista = [];
    if (Array.isArray(datos)) {
        lista = datos;
    } else if (datos && typeof datos === 'object') {
        if (Array.isArray(datos.canciones)) lista = datos.canciones;
        else if (Array.isArray(datos.songs)) lista = datos.songs;
        else if (Array.isArray(datos.repertorio)) lista = datos.repertorio;
        else lista = Object.values(datos).filter(item => typeof item === 'object');
    }

    return lista.map((c, idx) => {
        const titulo = c.title || c.titulo || c.nombre || c.name || \`Canción \${idx + 1}\`;
        const autor = c.author || c.autor || c.artista || 'Iglesia Cuadrangular';
        let sections = [];

        if (Array.isArray(c.sections) && c.sections.length > 0) {
            sections = c.sections.map((s, sIdx) => ({
                type: s.type || s.tipo || (sIdx === 1 ? 'chorus' : 'verse'),
                label: s.label || s.nombre || (s.type === 'chorus' ? 'Coro' : \`Estrofa \${sIdx + 1}\`),
                color: s.color || obtenerColorPorTipo(s.type || s.tipo),
                lines: Array.isArray(s.lines) ? s.lines : Array.isArray(s.lineas) ? s.lineas : String(s.lines || s.texto || '').split('\\n')
            }));
        } else if (typeof c.letra === 'string' || typeof c.lyrics === 'string') {
            const bloques = (c.letra || c.lyrics).split(/\\n\\s*\\n/);
            sections = bloques.map((bloque, bIdx) => {
                const lineas = bloque.split('\\n').map(l => l.trim()).filter(Boolean);
                let tipo = 'verse';
                if (lineas.length > 0 && /coro|chorus/i.test(lineas[0])) {
                    tipo = 'chorus';
                    lineas.shift();
                } else if (lineas.length > 0 && /puente|bridge/i.test(lineas[0])) {
                    tipo = 'bridge';
                    lineas.shift();
                }
                return {
                    type: tipo,
                    label: tipo === 'chorus' ? 'Coro' : tipo === 'bridge' ? 'Puente' : \`Estrofa \${bIdx + 1}\`,
                    color: obtenerColorPorTipo(tipo),
                    lines: lineas
                };
            });
        }

        return {
            id: c.id ? String(c.id) : \`c-\${Date.now()}-\${idx}\`,
            numero: c.numero || idx + 1,
            title: String(titulo).trim(),
            author: String(autor).trim(),
            key: c.key || c.tono || 'C',
            sections: sections.length > 0 ? sections : [{
                type: 'verse',
                label: 'Estrofa 1',
                color: '#38bdf8',
                lines: [titulo]
            }]
        };
    });
}

function obtenerColorPorTipo(tipo) {
    const t = normalizarTexto(tipo);
    if (t.includes('coro') || t.includes('chorus')) return '#facc15'; // Amarillo/Oro
    if (t.includes('puente') || t.includes('bridge')) return '#c084fc'; // Violeta
    if (t.includes('pre')) return '#34d399'; // Esmeralda
    return '#38bdf8'; // Celeste
}

function guardarEnStorageCanciones() {
    try {
        localStorage.setItem('proyector_lbc_canciones', JSON.stringify(repertorioCanciones));
    } catch (e) {
        console.warn("Storage lleno o deshabilitado");
    }
}

function actualizarContadorCanciones(mensaje) {
    const cont = document.getElementById('contador-canciones');
    if (cont) cont.innerText = mensaje;
}

// ==================== CARGA MANUAL DE ARCHIVO LOCAL (BYPASS TOTAL DE CORS) ====================
function seleccionarArchivoLocalJSON() {
    const input = document.getElementById('input-archivo-json');
    if (input) input.click();
}

function procesarArchivosJSONLocales(archivos) {
    if (!archivos || archivos.length === 0) return;

    let cargados = 0;
    Array.from(archivos).forEach(archivo => {
        const lector = new FileReader();
        lector.onload = (e) => {
            try {
                const contenido = JSON.parse(e.target.result);
                const cancionesProcesadas = normalizarEstructuraCanciones(contenido, archivo.name);
                
                // Unir sin duplicados
                const map = new Map();
                repertorioCanciones.forEach(c => map.set(c.title.toLowerCase(), c));
                cancionesProcesadas.forEach(c => map.set(c.title.toLowerCase(), c));

                repertorioCanciones = Array.from(map.values());
                cancionesFiltradas = [...repertorioCanciones];
                guardarEnStorageCanciones();
                renderizarListaCanciones();
                cargados++;
                
                mostrarModal("Archivos Cargados", \`Se importó exitosamente "\${archivo.name}". Total en base de datos: \${repertorioCanciones.length} canciones.\`);
                actualizarContadorCanciones(\`\${repertorioCanciones.length} canciones registradas\`);
            } catch (err) {
                mostrarModal("Error de Lectura", \`El archivo "\${archivo.name}" no tiene un formato JSON válido.\`);
            }
        };
        lector.readAsText(archivo);
    });
}

// ==================== BUSCADOR EN TIEMPO REAL (INFALIBLE) ====================
function filtrarCanciones() {
    const input = document.getElementById('buscador-canciones');
    const texto = normalizarTexto(input ? input.value : '');

    if (texto === '') {
        cancionesFiltradas = [...repertorioCanciones];
    } else {
        const palabras = texto.split(/\\s+/).filter(Boolean);
        cancionesFiltradas = repertorioCanciones.filter(cancion => {
            const tit = normalizarTexto(cancion.title);
            const aut = normalizarTexto(cancion.author);
            const num = String(cancion.numero || '');

            if (num === texto) return true;
            return palabras.every(p => tit.includes(p) || aut.includes(p));
        });
    }

    renderizarListaCanciones();
}

function renderizarListaCanciones() {
    const contenedor = document.getElementById('lista-canciones');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    if (cancionesFiltradas.length === 0) {
        contenedor.innerHTML = \`
            <div style="padding: 15px; text-align: center; color: #94a3b8; font-size: 13px;">
                <p>No se encontraron canciones.</p>
                <button onclick="seleccionarArchivoLocalJSON()" class="btn-open" style="margin-top: 8px;">📁 Cargar Corario.json / Mi Cancionero.json</button>
            </div>
        \`;
        return;
    }

    cancionesFiltradas.forEach(cancion => {
        const btn = document.createElement('button');
        const estaSeleccionada = cancionSeleccionada && cancionSeleccionada.id === cancion.id;
        btn.className = \`btn-libro \${estaSeleccionada ? 'seleccionado' : ''}\`;
        
        btn.innerHTML = \`
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600;">\${cancion.title}</span>
                <span style="font-size: 10px; opacity: 0.7; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">\${cancion.key || 'C'}</span>
            </div>
            <div style="font-size: 11px; opacity: 0.6; margin-top: 2px;">\${cancion.author}</div>
        \`;
        
        btn.onclick = () => seleccionarCancion(cancion);
        contenedor.appendChild(btn);
    });
}

function seleccionarCancion(cancion) {
    cancionSeleccionada = cancion;
    seccionActivaIndice = -1;
    
    const tituloEl = document.getElementById('cancion-titulo-activo');
    if (tituloEl) {
        tituloEl.innerText = \`\${cancion.title} (\${cancion.key || 'Tono C'})\`;
    }

    renderizarListaCanciones();
    renderizarEstrofasCancion(cancion);
}

// ==================== RENDERIZADO DE BLOQUES DE ESTROFAS ====================
function renderizarEstrofasCancion(cancion) {
    const contenedor = document.getElementById('bloques-estrofas');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    if (!cancion.sections || cancion.sections.length === 0) {
        contenedor.innerHTML = '<span style="font-size: 12px; color: #94a3b8; padding: 10px;">Esta canción no tiene estrofas registradas.</span>';
        return;
    }

    cancion.sections.forEach((seccion, sIdx) => {
        const tarjeta = document.createElement('div');
        const colorFondo = seccion.color || obtenerColorPorTipo(seccion.type);
        const estaProyectando = seccionActivaIndice === sIdx;

        tarjeta.style.background = estaProyectando ? '#ffffff' : colorFondo;
        tarjeta.style.color = estaProyectando ? '#020617' : '#0f172a';
        tarjeta.style.padding = '12px';
        tarjeta.style.borderRadius = '8px';
        tarjeta.style.cursor = 'pointer';
        tarjeta.style.border = estaProyectando ? '3px solid #eab308' : '1px solid rgba(0,0,0,0.1)';
        tarjeta.style.boxShadow = estaProyectando ? '0 0 14px rgba(234, 179, 8, 0.7)' : '0 2px 5px rgba(0,0,0,0.2)';
        tarjeta.style.transition = 'all 0.15s ease';

        const tipoLabel = seccion.label || (seccion.type === 'chorus' ? 'CORO' : seccion.type === 'bridge' ? 'PUENTE' : \`ESTROFA \${sIdx + 1}\`);
        const lineasTexto = seccion.lines ? seccion.lines.join('<br>') : '';

        tarjeta.innerHTML = \`
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">\${tipoLabel}</span>
                \${estaProyectando ? '<span style="background: #eab308; color: #000; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold;">EN VIVO</span>' : ''}
            </div>
            <div style="font-size: 12px; line-height: 1.4; font-weight: 500;">\${lineasTexto}</div>
        \`;

        tarjeta.onclick = () => proyectarSeccionCancion(seccion, cancion.title, sIdx);
        contenedor.appendChild(tarjeta);
    });
}

function proyectarSeccionCancion(seccion, tituloCancion, indice) {
    seccionActivaIndice = indice;
    const textoEstrofa = seccion.lines ? seccion.lines.join('\\n') : '';
    const salidaFormatted = \`\${textoEstrofa}\\n\\n🎵 \${tituloCancion}\`;

    canal.postMessage({
        accion: 'mostrar',
        texto: salidaFormatted,
        tipo: 'cancion'
    });

    if (cancionSeleccionada) {
        renderizarEstrofasCancion(cancionSeleccionada);
    }
}

function avanzarEstrofa() {
    if (!cancionSeleccionada || !cancionSeleccionada.sections) return;
    if (seccionActivaIndice < cancionSeleccionada.sections.length - 1) {
        proyectarSeccionCancion(cancionSeleccionada.sections[seccionActivaIndice + 1], cancionSeleccionada.title, seccionActivaIndice + 1);
    }
}

function retrocederEstrofa() {
    if (!cancionSeleccionada || !cancionSeleccionada.sections) return;
    if (seccionActivaIndice > 0) {
        proyectarSeccionCancion(cancionSeleccionada.sections[seccionActivaIndice - 1], cancionSeleccionada.title, seccionActivaIndice - 1);
    }
}

// ==================== SETLISTS (ORDENAR, REORDENAR Y ELIMINAR) ====================
function cargarSetlistsDeStorage() {
    const raw = localStorage.getItem('proyector_lbc_setlists');
    if (raw) {
        try {
            setlists = Object.assign(setlists, JSON.parse(raw));
        } catch (e) {}
    }
}

function guardarSetlistsEnStorage() {
    localStorage.setItem('proyector_lbc_setlists', JSON.stringify(setlists));
}

function cambiarSetlist() {
    const select = document.getElementById('select-setlist');
    if (select) {
        setlistActualNombre = select.value;
        renderizarSetlistActual();
    }
}

function agregarASetlistActual() {
    if (!cancionSeleccionada) {
        mostrarModal("Aviso", "Primero selecciona una canción del repertorio para agregarla al setlist.");
        return;
    }

    if (!setlists[setlistActualNombre]) {
        setlists[setlistActualNombre] = [];
    }

    if (!setlists[setlistActualNombre].some(c => c.id === cancionSeleccionada.id)) {
        setlists[setlistActualNombre].push(cancionSeleccionada);
        guardarSetlistsEnStorage();
        renderizarSetlistActual();
    } else {
        mostrarModal("Información", "Esta canción ya se encuentra en el setlist seleccionado.");
    }
}

function moverCancionSetlist(indice, direccion, e) {
    if (e) e.stopPropagation();
    const lista = setlists[setlistActualNombre];
    const nuevoIndice = indice + direccion;

    if (nuevoIndice < 0 || nuevoIndice >= lista.length) return;

    const temp = lista[indice];
    lista[indice] = lista[nuevoIndice];
    lista[nuevoIndice] = temp;

    guardarSetlistsEnStorage();
    renderizarSetlistActual();
}

function eliminarDeSetlist(index, e) {
    if (e) e.stopPropagation();
    setlists[setlistActualNombre].splice(index, 1);
    guardarSetlistsEnStorage();
    renderizarSetlistActual();
}

function limpiarSetlistCompleto() {
    if (confirm("¿Deseas vaciar todo el setlist actual?")) {
        setlists[setlistActualNombre] = [];
        guardarSetlistsEnStorage();
        renderizarSetlistActual();
    }
}

function renderizarSetlistActual() {
    const contenedor = document.getElementById('lista-setlist');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    const lista = setlists[setlistActualNombre] || [];

    if (lista.length === 0) {
        contenedor.innerHTML = '<span style="font-size: 12px; color: #94a3b8; padding: 10px;">Setlist vacío. Agrega canciones con el botón "⭐ Agregar al Setlist".</span>';
        return;
    }

    lista.forEach((cancion, index) => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.gap = '6px';
        item.style.marginBottom = '6px';
        item.style.background = '#0f172a';
        item.style.padding = '4px 8px';
        item.style.borderRadius = '6px';
        item.style.border = (cancionSeleccionada && cancionSeleccionada.id === cancion.id) ? '1px solid #2563eb' : '1px solid rgba(255,255,255,0.08)';

        const btnCancion = document.createElement('button');
        btnCancion.className = 'btn-libro';
        btnCancion.style.flex = '1';
        btnCancion.style.padding = '6px';
        btnCancion.style.background = 'transparent';
        btnCancion.innerText = \`\${index + 1}. \${cancion.title}\`;
        btnCancion.onclick = () => seleccionarCancion(cancion);

        // Botón Subir
        const btnUp = document.createElement('button');
        btnUp.innerHTML = '⬆️';
        btnUp.title = 'Mover arriba';
        btnUp.style.padding = '4px 6px';
        btnUp.style.fontSize = '11px';
        btnUp.style.background = '#1e293b';
        btnUp.disabled = index === 0;
        btnUp.onclick = (e) => moverCancionSetlist(index, -1, e);

        // Botón Bajar
        const btnDown = document.createElement('button');
        btnDown.innerHTML = '⬇️';
        btnDown.title = 'Mover abajo';
        btnDown.style.padding = '4px 6px';
        btnDown.style.fontSize = '11px';
        btnDown.style.background = '#1e293b';
        btnDown.disabled = index === lista.length - 1;
        btnDown.onclick = (e) => moverCancionSetlist(index, 1, e);

        // Botón Eliminar
        const btnEliminar = document.createElement('button');
        btnEliminar.innerHTML = '❌';
        btnEliminar.title = 'Quitar del setlist';
        btnEliminar.style.padding = '4px 6px';
        btnEliminar.style.fontSize = '11px';
        btnEliminar.style.background = '#dc2626';
        btnEliminar.onclick = (e) => eliminarDeSetlist(index, e);

        item.appendChild(btnCancion);
        item.appendChild(btnUp);
        item.appendChild(btnDown);
        item.appendChild(btnEliminar);
        contenedor.appendChild(item);
    });
}

// ==================== LÓGICA DE BIBLIA ====================
function renderizarListasLibros(filtroAntiguo, filtroNuevo) {
    const contenedorAntiguo = document.getElementById('lista-antiguo');
    const contenedorNuevo = document.getElementById('lista-nuevo');
    if (!contenedorAntiguo || !contenedorNuevo) return;

    contenedorAntiguo.innerHTML = '';
    contenedorNuevo.innerHTML = '';

    filtroAntiguo.forEach(libro => {
        const btn = document.createElement('button');
        btn.className = \`btn-libro \${libro.archivo === libroActualArchivo ? 'seleccionado' : ''}\`;
        btn.innerText = libro.nombre;
        btn.onclick = () => seleccionarLibro(libro.archivo, libro.nombre);
        contenedorAntiguo.appendChild(btn);
    });

    filtroNuevo.forEach(libro => {
        const btn = document.createElement('button');
        btn.className = \`btn-libro \${libro.archivo === libroActualArchivo ? 'seleccionado' : ''}\`;
        btn.innerText = libro.nombre;
        btn.onclick = () => seleccionarLibro(libro.archivo, libro.nombre);
        contenedorNuevo.appendChild(btn);
    });
}

function filtrarLibros() {
    const textoBuscado = normalizarTexto(document.getElementById('buscador-libros').value);
    const filtradosAntiguo = librosAntiguo.filter(l => normalizarTexto(l.nombre).includes(textoBuscado));
    const filtradosNuevo = librosNuevo.filter(l => normalizarTexto(l.nombre).includes(textoBuscado));
    renderizarListasLibros(filtradosAntiguo, filtradosNuevo);
}

async function seleccionarLibro(archivo, nombre) {
    libroActualArchivo = archivo;
    nombreLibroActual = nombre;
    document.getElementById('libro-seleccionado').innerText = nombre;
    renderizarListasLibros(librosAntiguo, librosNuevo);
    await cargarDatosLibro();
}

async function cambiarVersion(nuevaVersion, elementoBtn) {
    versionActual = nuevaVersion;
    document.querySelectorAll('.versiones-grid .btn-version').forEach(b => b.classList.remove('activo'));
    if (elementoBtn) elementoBtn.classList.add('activo');
    await cargarDatosLibro();
}

async function cargarDatosLibro() {
    const ruta = \`data/biblia/versiones/\${versionActual}/\${libroActualArchivo}\`;
    try {
        const respuesta = await fetch(ruta);
        if (!respuesta.ok) throw new Error("No disponible por red");
        libroDataActual = await respuesta.json();

        const capitulos = Object.keys(libroDataActual.chapters);
        capitulos.sort((a, b) => parseInt(a) - parseInt(b));

        capituloActual = capitulos[0] || "1";
        renderizarCapitulos(capitulos);
        cargarVersiculosCapitulo();
    } catch (error) {
        // Fallback para pruebas locales
        console.warn("Libro no disponible por ruta fetch:", error);
    }
}

function renderizarCapitulos(capitulos) {
    const gridCapitulos = document.getElementById('grid-capitulos');
    if (!gridCapitulos) return;
    gridCapitulos.innerHTML = '';

    capitulos.forEach(cap => {
        const btn = document.createElement('button');
        btn.className = \`btn-num \${cap === capituloActual ? 'seleccionado' : ''}\`;
        btn.innerText = cap;
        btn.onclick = () => seleccionarCapitulo(cap);
        gridCapitulos.appendChild(btn);
    });
}

function seleccionarCapitulo(cap) {
    capituloActual = cap;
    if (libroDataActual && libroDataActual.chapters) {
        renderizarCapitulos(Object.keys(libroDataActual.chapters));
        cargarVersiculosCapitulo();
    }
}

function cargarVersiculosCapitulo() {
    const gridVersiculos = document.getElementById('grid-versiculos');
    if (!gridVersiculos) return;
    gridVersiculos.innerHTML = '';

    if (libroDataActual && libroDataActual.chapters && libroDataActual.chapters[capituloActual]) {
        const versiculos = Object.keys(libroDataActual.chapters[capituloActual]);
        versiculos.sort((a, b) => parseInt(a) - parseInt(b));

        if (!versiculos.includes(versiculoActual)) {
            versiculoActual = versiculos[0] || "1";
        }

        versiculos.forEach(ver => {
            const btn = document.createElement('button');
            btn.className = \`btn-num \${ver === versiculoActual ? 'seleccionado' : ''}\`;
            btn.innerText = ver;
            btn.onclick = () => seleccionarVersiculo(ver);
            gridVersiculos.appendChild(btn);
        });
    }
}

function seleccionarVersiculo(ver) {
    versiculoActual = ver;
    cargarVersiculosCapitulo();
}

function proyectarVersiculoSeleccionado() {
    if (libroDataActual && libroDataActual.chapters && libroDataActual.chapters[capituloActual] && libroDataActual.chapters[capituloActual][versiculoActual]) {
        const textoVersiculo = libroDataActual.chapters[capituloActual][versiculoActual];
        const salidaFormatted = \`"\${textoVersiculo}"\\n\\n— \${nombreLibroActual} \${capituloActual}:\${versiculoActual} (\${versionActual.toUpperCase()})\`;
        canal.postMessage({ accion: 'mostrar', texto: salidaFormatted, tipo: 'biblia' });
    } else {
        mostrarModal("Aviso", "Por favor seleccione un capítulo y versículo válidos.");
    }
}

// ==================== CONTROLES DE PANTALLA Y PROYECCIÓN ====================
function abrirProyector() {
    window.open('display.html', 'ProyectorLBC', 'width=1280,height=720,menubar=no,toolbar=no,location=no');
}

function proyectarTexto() {
    const input = document.getElementById('textoEnviar');
    const texto = input ? input.value.trim() : '';
    if (!texto) return;
    canal.postMessage({ accion: 'mostrar', texto: texto, tipo: 'texto' });
}

function limpiarPantalla() {
    canal.postMessage({ accion: 'limpiar' });
}

function toggleBlackout() {
    canal.postMessage({ accion: 'blackout' });
}

// ==================== MODALES ====================
function abrirModalNuevaCancion() {
    document.getElementById('modal-cancion').style.display = 'flex';
}

function cerrarModalCancion() {
    document.getElementById('modal-cancion').style.display = 'none';
}

function guardarNuevaCancion() {
    const titulo = document.getElementById('nueva-titulo').value.trim();
    const textoLetra = document.getElementById('nueva-letra').value.trim();

    if (!titulo || !textoLetra) {
        mostrarModal("Aviso", "Por favor completa el título y la letra.");
        return;
    }

    const bloquesTexto = textoLetra.split(/\\n\\s*\\n/);
    const sections = bloquesTexto.map((bloque, idx) => {
        let lineas = bloque.split('\\n').map(l => l.trim()).filter(Boolean);
        let tipo = 'verse';
        if (lineas.length > 0 && /coro|chorus/i.test(lineas[0])) {
            tipo = 'chorus';
            lineas.shift();
        } else if (lineas.length > 0 && /puente|bridge/i.test(lineas[0])) {
            tipo = 'bridge';
            lineas.shift();
        }

        return {
            type: tipo,
            label: tipo === 'chorus' ? 'Coro' : tipo === 'bridge' ? 'Puente' : \`Estrofa \${idx + 1}\`,
            color: obtenerColorPorTipo(tipo),
            lines: lineas
        };
    });

    const nuevaCancion = {
        id: \`cancion-\${Date.now()}\`,
        title: titulo,
        author: "Iglesia Cuadrangular",
        key: "C",
        sections: sections
    };

    repertorioCanciones.unshift(nuevaCancion);
    cancionesFiltradas = [...repertorioCanciones];
    guardarEnStorageCanciones();
    renderizarListaCanciones();
    cerrarModalCancion();

    document.getElementById('nueva-titulo').value = '';
    document.getElementById('nueva-letra').value = '';
    mostrarModal("Éxito", \`Canción "\${titulo}" agregada y guardada localmente.\`);
}

function mostrarModal(titulo, mensaje) {
    const t = document.getElementById('modal-title');
    const m = document.getElementById('modal-mensaje');
    const mod = document.getElementById('custom-modal');
    if (t) t.innerText = titulo;
    if (m) m.innerText = mensaje;
    if (mod) mod.style.display = 'flex';
}

function cerrarModal() {
    const mod = document.getElementById('custom-modal');
    if (mod) mod.style.display = 'none';
}
`;
