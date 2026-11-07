const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  toggleProyector: () => ipcRenderer.send('toggle-proyector'),
  abrirProyector: () => ipcRenderer.send('abrir-proyector'),
  cerrarProyector: () => ipcRenderer.send('cerrar-proyector'),
  onEstadoProyector: (callback) => {
    ipcRenderer.on('estado-proyector', (event, data) => callback(data));
  }
});
