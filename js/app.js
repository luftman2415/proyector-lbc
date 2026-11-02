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
    { nombre: "2 Juan", archivo: "2john.json" },
    { nombre: "3 Juan", archivo: "3john.json" },
    { nombre: "Judas", archivo: "jude.json" },
    { nombre: "Apocalipsis", archivo: "revelation.json" }
];

function normalizarTexto(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

window.addEventListener('DOMContentLoaded', () => {
    const anioActual = new Date().getFullYear();
    document.getElementById('copyright-text').innerText = `${anioActual} Copyright © LuftmanDMauricio. Todos los derechos reservados.`;
    renderizarListasLibros(librosAntiguo, librosNuevo);
    cargarDatosLibro();
    cargarAmbosCancioneros();
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


// ==================== LÓGICA DE CANCIONES Y SETLISTS (CARGA AMBOS JSON) ====================
async function cargarAmbosCancioneros() {
    repertorioCanciones = [];
    
    // Cargar Corario.json
    try {
        const resp1 = await fetch('data/cancioneros/Corario.json');
        if (resp1.ok) {
            const datos1 = await resp1.json();
            repertorioCanciones = repertorioCanciones.concat(datos1);
        }
    } catch (e) {
        console.log("No se pudo cargar Corario.json");
    }

    // Cargar Mi Cancionero.json (manejando espacios en la URL)
    try {
        const resp2 = await fetch('data/cancioneros/Mi%20Cancionero.json');
        if (resp2.ok) {
            const datos2 = await resp2.json();
            repertorioCanciones = repertorioCanciones.concat(datos2);
        }
    } catch (e) {
        console.log("No se pudo cargar Mi Cancionero.json");
    }

    cancionesFiltradas = [...repertorioCanciones];
    renderizarListaCanciones();
}

function renderizarListaCanciones() {
    const contenedor = document.getElementById('lista-canciones');
    contenedor.innerHTML = '';

    if (cancionesFiltradas.length === 0) {
        contenedor.innerHTML = '<span style="font-size: 12px; color: #94a3b8; padding: 5px;">Cargando o sin canciones...</span>';
        return;
    }

    cancionesFiltradas.forEach(cancion => {
        const btn = document.createElement('button');
        btn.className = `btn-libro ${cancionSeleccionada && cancionSeleccionada.title === cancion.title ? 'seleccionado' : ''}`;
        btn.innerText = cancion.title;
        btn.onclick = () => seleccionarCancion(cancion);
        contenedor.appendChild(btn);
    });
}

function filtrarCanciones() {
    const texto = normalizarTexto(document.getElementById('buscador-canciones').value);
    cancionesFiltradas = repertorioCanciones.filter(c => normalizarTexto(c.title).includes(texto));
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

    if (!cancion.sections) return;

    cancion.sections.forEach((seccion) => {
        const tarjeta = document.createElement('div');
        tarjeta.style.background = seccion.color || '#1e293b';
        tarjeta.style.color = '#0f172a';
        tarjeta.style.padding = '10px';
        tarjeta.style.borderRadius = '6px';
        tarjeta.style.cursor = 'pointer';
        tarjeta.style.fontWeight = 'bold';
        tarjeta.style.fontSize = '12px';
        
        let textoHtml = `<u>${seccion.type.toUpperCase()}</u><br>`;
        textoHtml += seccion.lines.join('<br>');
        tarjeta.innerHTML = textoHtml;

        tarjeta.onclick = () => proyectarSeccionCancion(seccion, cancion.title);
        contenedor.appendChild(tarjeta);
    });
}

function proyectarSeccionCancion(seccion, tituloCancion) {
    const textoEstrofa = seccion.lines.join('\n');
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
    if (!setlists[setlistActualNombre].some(c => c.title === cancionSeleccionada.title)) {
        setlists[setlistActualNombre].push(cancionSeleccionada);
        renderizarSetlistActual();
    }
}

function renderizarSetlistActual() {
    const contenedor = document.getElementById('lista-setlist');
    contenedor.innerHTML = '';

    setlists[setlistActualNombre].forEach((cancion, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn-libro';
        btn.innerText = `${index + 1}. ${cancion.title}`;
        btn.onclick = () => seleccionarCancion(cancion);
        contenedor.appendChild(btn);
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
    const sections = bloquesTexto.map((bloque, idx) => {
        const lineas = bloque.split('\n');
        return {
            type: idx === 0 ? "verse" : "chorus",
            lines: lineas,
            atajo: idx + 1,
            color: idx === 0 ? "#4fc3f7" : "#fff176"
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
    mostrarModal("Éxito", "Canción agregada al repertorio correctamente.");
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