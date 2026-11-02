const canal = new BroadcastChannel('proyector_lbc');

let versionActual = "rv1960";
let libroActualArchivo = "genesis.json";
let nombreLibroActual = "Génesis";
let libroDataActual = null;

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

// Función para remover tildes y caracteres especiales de la búsqueda
function normalizarTexto(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

window.addEventListener('DOMContentLoaded', () => {
    const anioActual = new Date().getFullYear();
    document.getElementById('copyright-text').innerText = `${anioActual} Copyright © LuftmanDMauricio. Todos los derechos reservados.`;
    renderizarListasLibros(librosAntiguo, librosNuevo);
    cargarDatosLibro();
});

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
        const btn.className = `btn-libro ${libro.archivo === libroActualArchivo ? 'seleccionado' : ''}`;
        const btn2 = document.createElement('button');
        btn2.className = `btn-libro ${libro.archivo === libroActualArchivo ? 'seleccionado' : ''}`;
        btn2.innerText = libro.nombre;
        btn2.onclick = () => seleccionarLibro(libro.archivo, libro.nombre);
        contenedorNuevo.appendChild(btn2);
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
    document.querySelectorAll('.btn-version').forEach(b => b.classList.remove('activo'));
    elementoBtn.classList.add('activo');
    await cargarDatosLibro();
}

async function cargarDatosLibro() {
    const ruta = `data/biblia/versiones/${versionActual}/${libroActualArchivo}`;
    try {
        const respuesta = await fetch(ruta);
        if (!respuesta.ok) throw new Error("No se pudo cargar el libro");
        libroDataActual = await respuesta.json();

        // Cargar Capítulos
        const selectCap = document.getElementById('select-capitulo');
        selectCap.innerHTML = '';
        
        const capitulos = Object.keys(libroDataActual.chapters);
        capitulos.sort((a, b) => parseInt(a) - parseInt(b));

        capitulos.forEach(cap => {
            const opt = document.createElement('option');
            opt.value = cap;
            opt.innerText = cap;
            selectCap.appendChild(opt);
        });

        cargarVersiculosCapitulo();
    } catch (error) {
        console.error(error);
        mostrarModal("Error", "No se pudo cargar la versión de la Biblia seleccionada.");
    }
}

function cargarVersiculosCapitulo() {
    const capSeleccionado = document.getElementById('select-capitulo').value;
    const selectVer = document.getElementById('select-versiculo');
    selectVer.innerHTML = '';

    if (libroDataActual && libroDataActual.chapters[capSeleccionado]) {
        const versiculos = Object.keys(libroDataActual.chapters[capSeleccionado]);
        versiculos.sort((a, b) => parseInt(a) - parseInt(b));

        versiculos.forEach(ver => {
            const opt = document.createElement('option');
            opt.value = ver;
            opt.innerText = ver;
            selectVer.appendChild(opt);
        });
    }
}

function abrirProyector() {
    window.open('display.html', 'ProyectorLBC', 'width=1024,height=768');
}

function proyectarVersiculoSeleccionado() {
    const cap = document.getElementById('select-capitulo').value;
    const ver = document.getElementById('select-versiculo').value;

    if (libroDataActual && libroDataActual.chapters[cap] && libroDataActual.chapters[cap][ver]) {
        const textoVersiculo = libroDataActual.chapters[cap][ver];
        const salidaFormatted = `"${textoVersiculo}"\n\n— ${nombreLibroActual} ${cap}:${ver} (${versionActual.toUpperCase()})`;
        canal.postMessage({ accion: 'mostrar', texto: salidaFormatted });
    } else {
        mostrarModal("Aviso", "Por favor seleccione un capítulo y versículo válidos.");
    }
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