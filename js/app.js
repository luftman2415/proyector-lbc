const canal = new BroadcastChannel('proyector_lbc');

// Variables Biblia
let versionActual = "rv1960";
let libroActualArchivo = "genesis.json";
let nombreLibroActual = "Génesis";
let libroDataActual = null;
let capituloActual = "1";
let versiculoActual = "1";

// Variables Canciones y Setlists
let repertorioCanciones = [];
let cancionesFiltradas = [];
let cancionSeleccionada = null;
let setlistActualNombre = "general";
let setlists = {
    general: [],
    miercoles: [],
    sabado: [],
    domingo: []
};

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

function normalizarTexto(texto) {
    if (!texto) return "";
    return texto.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

window.addEventListener('DOMContentLoaded', () => {
    const anioActual = new Date().getFullYear();
    document.getElementById('copyright-text').innerText = `${anioActual} Copyright © LuftmanDMauricio. Todos los derechos reservados.`;
    renderizarListasLibros(librosAntiguo, librosNuevo);
    cargarDatosLibro();
    cargarCancionesLocal();
});

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

// ==================== LÓGICA DE BIBLIA ====================
function renderizarListasLibros(filtroAntiguo, filtroNuevo) {
    const contenedorAntiguo = document.getElementById('lista-antiguo');
    const contenedorNuevo = document.getElementById('lista-nuevo');

    contenedorAntiguo.innerHTML = '';
    contenedorNuevo.innerHTML = '';

    filtroAntiguo.forEach(libro => {
        const btn = document.createElement('button');
        btn.className = `btn-libro ${libro.archivo === libroActualArchivo ? 'seleccionado' : ''}`;
        btn.innerText = libro.nombre;
        btn.onclick = () => seleccionarLibro(libro.archivo, libro.nombre);
        contenedorAntiguo.appendChild(btn);
    });

    filtroNuevo.forEach(libro => {
        const btn = document.createElement('button');
        btn.className = `btn-libro ${libro.archivo === libroActualArchivo ? 'seleccionado' : ''}`;
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
    elementoBtn.classList.add('activo');
    await cargarDatosLibro();
}

async function cargarDatosLibro() {
    const ruta = `data/biblia/versiones/${versionActual}/${libroActualArchivo}`;
    try {
        const respuesta = await fetch(ruta);
        if (!respuesta.ok) throw new Error("No se pudo cargar el libro");
        libroDataActual = await respuesta.json();

        const capitulos = Object.keys(libroDataActual.chapters);
        capitulos.sort((a, b) => parseInt(a) - parseInt(b));

        capituloActual = capitulos[0] || "1";
        renderizarCapitulos(capitulos);
        cargarVersiculosCapitulo();
    } catch (error) {
        console.error(error);
        mostrarModal("Error", "No se pudo cargar la versión del libro seleccionado.");
    }
}

function renderizarCapitulos(capitulos) {
    const gridCapitulos = document.getElementById('grid-capitulos');
    gridCapitulos.innerHTML = '';

    capitulos.forEach(cap => {
        const btn = document.createElement('button');
        btn.className = `btn-num ${cap === capituloActual ? 'seleccionado' : ''}`;
        btn.innerText = cap;
        btn.onclick = () => seleccionarCapitulo(cap);
        gridCapitulos.appendChild(btn);
    });
}

function seleccionarCapitulo(cap) {
    capituloActual = cap;
    renderizarCapitulos(Object.keys(libroDataActual.chapters));
    cargarVersiculosCapitulo();
}

function cargarVersiculosCapitulo() {
    const gridVersiculos = document.getElementById('grid-versiculos');
    gridVersiculos.innerHTML = '';

    if (libroDataActual && libroDataActual.chapters[capituloActual]) {
        const versiculos = Object.keys(libroDataActual.chapters[capituloActual]);
        versiculos.sort((a, b) => parseInt(a) - parseInt(b));

        if (!versiculos.includes(versiculoActual)) {
            versiculoActual = versiculos[0] || "1";
        }

        versiculos.forEach(ver => {
            const btn = document.createElement('button');
            btn.className = `btn-num ${ver === versiculoActual ? 'seleccionado' : ''}`;
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
    if (libroDataActual && libroDataActual.chapters[capituloActual] && libroDataActual.chapters[capituloActual][versiculoActual]) {
        const textoVersiculo = libroDataActual.chapters[capituloActual][versiculoActual];
        const salidaFormatted = `"${textoVersiculo}"\n\n— ${nombreLibroActual} ${capituloActual}:${versiculoActual} (${versionActual.toUpperCase()})`;
        canal.postMessage({ accion: 'mostrar', texto: salidaFormatted });
    } else {
        mostrarModal("Aviso", "Por favor seleccione un capítulo y versículo válidos.");
    }
}


// ==================== LÓGICA DE CANCIONES Y BUSCADOR ARREGLADO ====================
async function cargarCancionesLocal() {
    repertorioCanciones = [];
    
    // Intentamos cargar Corario.json (en minúsculas o con su nombre original)
    try {
        const resp1 = await fetch('data/cancioneros/Corario.json');
        if (resp1.ok) {
            const datos1 = await resp1.json();
            if (Array.isArray(datos1)) repertorioCanciones = repertorioCanciones.concat(datos1);
        }
    } catch (e) {
        console.log("Corario no cargado por red, omitido.");
    }

    // Limpiamos y normalizamos los títulos para que el buscador nunca falle
    repertorioCanciones = repertorioCanciones.map((c, idx) => ({
        id: c.id || `cancion-${idx}`,
        title: c.title || c.nombre || c.titulo || "Canción sin título",
        sections: c.sections || []
    }));

    cancionesFiltradas = [...repertorioCanciones];
    renderizarListaCanciones();
}

function renderizarListaCanciones() {
    const contenedor = document.getElementById('lista-canciones');
    contenedor.innerHTML = '';

    if (cancionesFiltradas.length === 0) {
        contenedor.innerHTML = '<span style="font-size: 12px; color: #94a3b8; padding: 5px;">No hay canciones disponibles. Usa "+ Nueva Canción" para agregar.</span>';
        return;
    }

    cancionesFiltradas.forEach(cancion => {
        const btn = document.createElement('button');
        btn.className = `btn-libro ${cancionSeleccionada && cancionSeleccionada.id === cancion.id ? 'seleccionado' : ''}`;
        btn.innerText = cancion.title;
        btn.onclick = () => seleccionarCancion(cancion);
        contenedor.appendChild(btn);
    });
}

function filtrarCanciones() {
    const texto = normalizarTexto(document.getElementById('buscador-canciones').value);
    
    if (texto === "") {
        cancionesFiltradas = [...repertorioCanciones];
    } else {
        cancionesFiltradas = repertorioCanciones.filter(c => normalizarTexto(c.title).includes(texto));
    }
    
    renderizarListaCanciones();
}

function seleccionarCancion(cancion) {
    cancionSeleccionada = cancion;
    document.getElementById('cancion-titulo-activo').innerText = cancion.title;
    renderizarListaCanciones();
    renderizarEstrofasCancion(cancion);
}

function renderizarEstrofasCancion(cancion) {
    const contenedor = document.getElementById('bloques-estrofas');
    contenedor.innerHTML = '';

    if (!cancion.sections || cancion.sections.length === 0) {
        contenedor.innerHTML = '<span style="font-size: 12px; color: #94a3b8;">Esta canción no tiene estrofas registradas.</span>';
        return;
    }

    cancion.sections.forEach((seccion) => {
        const tarjeta = document.createElement('div');
        tarjeta.style.background = seccion.color || '#1e293b';
        tarjeta.style.color = '#0f172a';
        tarjeta.style.padding = '10px';
        tarjeta.style.borderRadius = '6px';
        tarjeta.style.cursor = 'pointer';
        tarjeta.style.fontWeight = 'bold';
        tarjeta.style.fontSize = '12px';
        
        let tipo = seccion.type ? seccion.type.toUpperCase() : 'ESTROFA';
        let lineas = seccion.lines ? seccion.lines.join('<br>') : '';

        tarjeta.innerHTML = `<u>${tipo}</u><br>${lineas}`;
        tarjeta.onclick = () => proyectarSeccionCancion(seccion, cancion.title);
        contenedor.appendChild(tarjeta);
    });
}

function proyectarSeccionCancion(seccion, tituloCancion) {
    const textoEstrofa = seccion.lines ? seccion.lines.join('\n') : '';
    const salidaFormatted = `${textoEstrofa}\n\n🎵 ${tituloCancion}`;
    canal.postMessage({ accion: 'mostrar', texto: salidaFormatted });
}

function cambiarSetlist() {
    setlistActualNombre = document.getElementById('select-setlist').value;
    renderizarSetlistActual();
}

function agregarASetlistActual() {
    if (!cancionSeleccionada) {
        mostrarModal("Aviso", "Selecciona una canción primero para agregarla al setlist.");
        return;
    }
    if (!setlists[setlistActualNombre].some(c => c.id === cancionSeleccionada.id)) {
        setlists[setlistActualNombre].push(cancionSeleccionada);
        renderizarSetlistActual();
    }
}

function eliminarDeSetlist(index, event) {
    event.stopPropagation();
    setlists[setlistActualNombre].splice(index, 1);
    renderizarSetlistActual();
}

function renderizarSetlistActual() {
    const contenedor = document.getElementById('lista-setlist');
    contenedor.innerHTML = '';

    if (setlists[setlistActualNombre].length === 0) {
        contenedor.innerHTML = '<span style="font-size: 12px; color: #94a3b8; padding: 5px;">Setlist vacío.</span>';
        return;
    }

    setlists[setlistActualNombre].forEach((cancion, index) => {
        const itemContainer = document.createElement('div');
        itemContainer.style.display = 'flex';
        itemContainer.style.alignItems = 'center';
        itemContainer.style.gap = '5px';
        itemContainer.style.marginBottom = '4px';

        const btn = document.createElement('button');
        btn.className = 'btn-libro';
        btn.style.flex = '1';
        btn.innerText = `${index + 1}. ${cancion.title}`;
        btn.onclick = () => seleccionarCancion(cancion);

        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn-clear';
        btnEliminar.style.padding = '6px 10px';
        btnEliminar.style.fontSize = '12px';
        btnEliminar.style.flex = 'unset';
        btnEliminar.innerText = '❌';
        btnEliminar.title = 'Quitar del setlist';
        btnEliminar.onclick = (e) => eliminarDeSetlist(index, e);

        itemContainer.appendChild(btn);
        itemContainer.appendChild(btnEliminar);
        contenedor.appendChild(itemContainer);
    });
}

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
        mostrarModal("Aviso", "Por favor completa el título y la letra de la canción.");
        return;
    }

    const bloquesTexto = textoLetra.split('\n\n');
    const sections = bloquesTexto.map((bloque) => {
        let lineas = bloque.split('\n');
        let tipo = "verse";
        let color = "#4fc3f7"; 

        const primeraLinea = lineas[0].toLowerCase();
        if (primeraLinea.includes('coro') || primeraLinea.includes('chorus')) {
            tipo = "chorus";
            color = "#fff176"; 
            lineas.shift(); 
        } else if (primeraLinea.includes('puente') || primeraLinea.includes('bridge')) {
            tipo = "bridge";
            color = "#7986cb"; 
            lineas.shift();
        } else if (primeraLinea.includes('verso') || primeraLinea.includes('estrofa')) {
            tipo = "verse";
            color = "#4fc3f7";
            lineas.shift();
        }

        return {
            type: tipo,
            lines: lineas.filter(l => l.trim() !== ""),
            color: color
        };
    });

    const nuevaCancion = {
        id: titulo.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        title: titulo,
        author: "Propio",
        key: "C",
        sections: sections
    };

    repertorioCanciones.push(nuevaCancion);
    cancionesFiltradas = [...repertorioCanciones];
    renderizarListaCanciones();
    cerrarModalCancion();
    
    document.getElementById('nueva-titulo').value = '';
    document.getElementById('nueva-letra').value = '';
    mostrarModal("Éxito", "Canción agregada y organizada correctamente.");
}


// ==================== CONTROLES GENERALES ====================
function abrirProyector() {
    window.open('display.html', 'ProyectorLBC', 'width=1024,height=768');
}

function mostrarModal(titulo, mensaje) {
    document.getElementById('modal-title').innerText = titulo;
    document.getElementById('modal-mensaje').innerText = mensaje;
    document.getElementById('custom-modal').style.display = 'flex';
}

function cerrarModal() {
    document.getElementById('custom-modal').style.display = 'none';
}

function proyectarTexto() {
    const texto = document.getElementById('textoEnviar').value;
    canal.postMessage({ accion: 'mostrar', texto: texto });
}

function limpiarPantalla() {
    canal.postMessage({ accion: 'limpiar' });
}