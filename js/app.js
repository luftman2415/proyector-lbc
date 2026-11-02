const canal = new BroadcastChannel('proyector_lbc');

let versionActual = "rv1960";
let libroActualArchivo = "genesis";
let nombreLibroActual = "Génesis";

const librosAntiguo = [
    { nombre: "Génesis", archivo: "genesis" },
    { nombre: "Éxodo", archivo: "exodus" },
    { nombre: "Levítico", archivo: "leviticus" },
    { nombre: "Números", archivo: "numbers" },
    { nombre: "Deuteronomio", archivo: "deuteronomy" },
    { nombre: "Josué", archivo: "joshua" },
    { nombre: "Jueces", archivo: "judges" },
    { nombre: "Rut", archivo: "ruth" },
    { nombre: "1 Samuel", archivo: "1samuel" },
    { nombre: "2 Samuel", archivo: "2samuel" },
    { nombre: "1 Reyes", archivo: "1kings" },
    { nombre: "2 Reyes", archivo: "2kings" },
    { nombre: "1 Crónicas", archivo: "1chronicles" },
    { nombre: "2 Crónicas", archivo: "2chronicles" },
    { nombre: "Esdras", archivo: "ezra" },
    { nombre: "Nehemías", archivo: "nehemiah" },
    { nombre: "Ester", archivo: "esther" },
    { nombre: "Job", archivo: "job" },
    { nombre: "Salmos", archivo: "psalms" },
    { nombre: "Proverbios", archivo: "proverbs" },
    { nombre: "Eclesiastés", archivo: "ecclesiastes" },
    { nombre: "Cantares", archivo: "songofsolomon" },
    { nombre: "Isaías", archivo: "isaiah" },
    { nombre: "Jeremías", archivo: "jeremiah" },
    { nombre: "Lamentaciones", archivo: "lamentations" },
    { nombre: "Ezequiel", archivo: "ezekiel" },
    { nombre: "Daniel", archivo: "daniel" },
    { nombre: "Oseas", archivo: "hosea" },
    { nombre: "Joel", archivo: "joel" },
    { nombre: "Amós", archivo: "amos" },
    { nombre: "Abdías", archivo: "obadiah" },
    { nombre: "Jonás", archivo: "jonah" },
    { nombre: "Miqueas", archivo: "micah" },
    { nombre: "Nahúm", archivo: "nahum" },
    { nombre: "Habacuc", archivo: "habakkuk" },
    { nombre: "Sofonías", archivo: "zephaniah" },
    { nombre: "Hageo", archivo: "haggai" },
    { nombre: "Zacarías", archivo: "zechariah" },
    { nombre: "Malaquías", archivo: "malachi" }
];

const librosNuevo = [
    { nombre: "Mateo", archivo: "matthew" },
    { nombre: "Marcos", archivo: "mark" },
    { nombre: "Lucas", archivo: "luke" },
    { nombre: "Juan", archivo: "john" },
    { nombre: "Hechos", archivo: "acts" },
    { nombre: "Romanos", archivo: "romans" },
    { nombre: "1 Corintios", archivo: "1corinthians" },
    { nombre: "2 Corintios", archivo: "2corinthians" },
    { nombre: "Gálatas", archivo: "galatians" },
    { nombre: "Efesios", archivo: "ephesians" },
    { nombre: "Filipenses", archivo: "philippians" },
    { nombre: "Colosenses", archivo: "colossians" },
    { nombre: "1 Tesalonicenses", archivo: "1thessalonians" },
    { nombre: "2 Tesalonicenses", archivo: "2thessalonians" },
    { nombre: "1 Timoteo", archivo: "1timothy" },
    { nombre: "2 Timoteo", archivo: "2timothy" },
    { nombre: "Tito", archivo: "titus" },
    { nombre: "Filemón", archivo: "philemon" },
    { nombre: "Hebreos", archivo: "hebrews" },
    { nombre: "Santiago", archivo: "james" },
    { nombre: "1 Pedro", archivo: "1peter" },
    { nombre: "2 Pedro", archivo: "2peter" },
    { nombre: "1 Juan", archivo: "1john" },
    { nombre: "2 Juan", archivo: "2john" },
    { nombre: "3 Juan", archivo: "3john" },
    { nombre: "Judas", archivo: "jude" },
    { nombre: "Apocalipsis", archivo: "revelation" }
];

window.addEventListener('DOMContentLoaded', () => {
    const anioActual = new Date().getFullYear();
    document.getElementById('copyright-text').innerText = `${anioActual} Copyright © LuftmanDMauricio. Todos los derechos reservados.`;
    renderizarListasLibros(librosAntiguo, librosNuevo);
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
        const btn = document.createElement('button');
        btn.className = `btn-libro ${libro.archivo === libroActualArchivo ? 'seleccionado' : ''}`;
        btn.innerText = libro.nombre;
        btn.onclick = () => seleccionarLibro(libro.archivo, libro.nombre);
        contenedorNuevo.appendChild(btn);
    });
}

function filtrarLibros() {
    const texto = document.getElementById('buscador-libros').value.toLowerCase();
    const filtradosAntiguo = librosAntiguo.filter(l => l.nombre.toLowerCase().includes(texto));
    const filtradosNuevo = librosNuevo.filter(l => l.nombre.toLowerCase().includes(texto));
    renderizarListasLibros(filtradosAntiguo, filtradosNuevo);
}

function seleccionarLibro(archivo, nombre) {
    libroActualArchivo = archivo;
    nombreLibroActual = nombre;
    document.getElementById('libro-seleccionado').innerText = nombre;
    renderizarListasLibros(librosAntiguo, librosNuevo);
}

function cambiarVersion(nuevaVersion, elementoBtn) {
    versionActual = nuevaVersion;
    document.querySelectorAll('.btn-version').forEach(b => b.classList.remove('activo'));
    elementoBtn.classList.add('activo');
}

function abrirProyector() {
    window.open('display.html', 'ProyectorLBC', 'width=1024,height=768');
}

async function proyectarVersiculoSeleccionado() {
    const cap = document.getElementById('input-capitulo').value;
    const ver = document.getElementById('input-versiculo').value;
    const ruta = `data/biblia/versiones/${versionActual}/${libroActualArchivo}.json`;

    try {
        const respuesta = await fetch(ruta);
        if (!respuesta.ok) throw new Error("No se pudo cargar el archivo");
        const datos = await respuesta.json();

        if (datos.chapters && datos.chapters[cap] && datos.chapters[cap][ver]) {
            const textoVersiculo = datos.chapters[cap][ver];
            const salidaFormatted = `"${textoVersiculo}"\n\n— ${nombreLibroActual} ${cap}:${ver} (${versionActual.toUpperCase()})`;
            canal.postMessage({ accion: 'mostrar', texto: salidaFormatted });
        } else {
            mostrarModal("Aviso", "No se encontró el capítulo o versículo solicitado en esta versión.");
        }
    } catch (error) {
        console.error(error);
        mostrarModal("Atención", "Para garantizar la lectura fluida de los archivos locales de la Biblia sin restricciones del navegador, asegúrate de abrir la aplicación mediante un entorno local rápido.");
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