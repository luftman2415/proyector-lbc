// Escuchar el mismo canal de comunicación
const canal = new BroadcastChannel('proyector_lbc');
const textoPantalla = document.getElementById('texto-pantalla');

canal.onmessage = (event) => {
    const data = event.data;
    if (data.accion === 'mostrar') {
        textoPantalla.innerText = data.texto;
    } else if (data.accion === 'limpiar') {
        textoPantalla.innerText = '';
    }
};