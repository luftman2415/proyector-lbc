
/**
 * PROYECTOR PARA IGLESIAS
 * Aplicación de escritorio para Windows
 * Servidor OBS integrado con Electron
 * Creado por: LuftmandMauricio
 */

const {
  app,
  BrowserWindow,
  screen,
  ipcMain,
  session,
  dialog
} = require('electron');

const path = require('path');

app.commandLine.appendSwitch(
  'autoplay-policy',
  'no-user-gesture-required'
);

let controlWindow = null;
let projectorWindow = null;

let startServer = null;
let stopServer = null;

let servidorIniciado = false;
let cerrandoAplicacion = false;


// ======================================================
// VENTANA PRINCIPAL DE CONTROL
// ======================================================

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Proyector para Iglesias - Panel de Control',
    icon: path.join(__dirname, 'public/assets/icon.png'),
    backgroundColor: '#030712',

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
      backgroundThrottling: false
    }
  });

  const indexPath = path.join(__dirname, 'dist', 'index.html');

  controlWindow.loadFile(indexPath).catch(() => {
    controlWindow.loadFile(path.join(__dirname, 'index.html'));
  });

  controlWindow.on('closed', () => {
    controlWindow = null;

    if (projectorWindow && !projectorWindow.isDestroyed()) {
      projectorWindow.close();
    }
  });

  controlWindow.webContents.on('did-finish-load', () => {
    controlWindow.webContents.send('estado-proyector', {
      abierto: !!(
        projectorWindow &&
        !projectorWindow.isDestroyed()
      )
    });
  });
}


// ======================================================
// VENTANA DE PROYECCIÓN HDMI
// ======================================================

function toggleProyector() {
  if (projectorWindow && !projectorWindow.isDestroyed()) {
    projectorWindow.close();
    projectorWindow = null;

    if (controlWindow && !controlWindow.isDestroyed()) {
      controlWindow.webContents.send('estado-proyector', {
        abierto: false
      });
    }

    return;
  }

  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  const secondaryDisplay =
    displays.find(d => d.id !== primaryDisplay.id) ||
    displays.find(
      d =>
        d.bounds.x !== primaryDisplay.bounds.x ||
        d.bounds.y !== primaryDisplay.bounds.y
    ) ||
    (displays.length > 1 ? displays[1] : primaryDisplay);

  const esMonitorSecundario =
    secondaryDisplay.id !== primaryDisplay.id;

  projectorWindow = new BrowserWindow({
    x: secondaryDisplay.bounds.x,
    y: secondaryDisplay.bounds.y,
    width: secondaryDisplay.bounds.width,
    height: secondaryDisplay.bounds.height,

    fullscreen: esMonitorSecundario,
    frame: !esMonitorSecundario,
    alwaysOnTop: esMonitorSecundario,

    title: 'Proyector para Iglesias - Pantalla de Proyección',
    backgroundColor: '#000000',

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      backgroundThrottling: false
    }
  });

  const displayPath = path.join(__dirname, 'dist', 'display.html');

  projectorWindow.loadFile(displayPath).catch(() => {
    projectorWindow.loadFile(
      path.join(__dirname, 'public', 'display.html')
    );
  });

  projectorWindow.on('closed', () => {
    projectorWindow = null;

    if (controlWindow && !controlWindow.isDestroyed()) {
      controlWindow.webContents.send('estado-proyector', {
        abierto: false
      });
    }
  });

  if (controlWindow && !controlWindow.isDestroyed()) {
    controlWindow.webContents.send('estado-proyector', {
      abierto: true,
      esSecundaria: esMonitorSecundario
    });
  }
}


// ======================================================
// COMUNICACIÓN IPC
// ======================================================

ipcMain.on('toggle-proyector', () => {
  toggleProyector();
});

ipcMain.on('abrir-proyector', () => {
  if (!projectorWindow || projectorWindow.isDestroyed()) {
    toggleProyector();
  }
});

ipcMain.on('cerrar-proyector', () => {
  if (projectorWindow && !projectorWindow.isDestroyed()) {
    projectorWindow.close();
    projectorWindow = null;

    if (controlWindow && !controlWindow.isDestroyed()) {
      controlWindow.webContents.send('estado-proyector', {
        abierto: false
      });
    }
  }
});


// ======================================================
// INICIO Y CONFIGURACIÓN DEL SERVIDOR OBS
// ======================================================

async function iniciarServidorOBS() {
  // Los videos se guardarán fuera de la instalación.
  const carpetaDatos = app.getPath('userData');

  process.env.LBC_VIDEOS_DIR = path.join(
    carpetaDatos,
    'videos-obs'
  );

  // Cargar el servidor después de establecer la carpeta.
  const servidor = require('./server.js');

  startServer = servidor.startServer;
  stopServer = servidor.stopServer;

  await startServer();

  servidorIniciado = true;

  console.log('[ELECTRON] Servidor OBS integrado correctamente.');
}


// ======================================================
// INICIO DE ELECTRON
// ======================================================

app.whenReady().then(async () => {
  try {
    // Mantener la configuración de reproducción de YouTube.
    if (session && session.defaultSession) {
      session.defaultSession.webRequest.onBeforeSendHeaders(
        {
          urls: [
            '*://*.youtube.com/*',
            '*://*.youtube-nocookie.com/*'
          ]
        },
        (details, callback) => {
          details.requestHeaders['Referer'] =
            'https://www.youtube.com/';

          details.requestHeaders['Origin'] =
            'https://www.youtube.com';

          details.requestHeaders['User-Agent'] =
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

          callback({
            cancel: false,
            requestHeaders: details.requestHeaders
          });
        }
      );
    }

    // Primero iniciar el servidor y después abrir la interfaz.
    await iniciarServidorOBS();

    createControlWindow();

    console.log('[ELECTRON] Aplicación iniciada correctamente.');

  } catch (error) {
    console.error(
      '[ELECTRON] Error al iniciar el servidor OBS:',
      error
    );

    dialog.showErrorBox(
      'No se pudo iniciar Proyector para Iglesias',
      'El servidor de comunicación con OBS no pudo iniciarse.\n\n' +
      'Detalle: ' + error.message +
      '\n\nComprueba que el puerto 3001 esté disponible.'
    );

    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createControlWindow();
    }
  });
});


// ======================================================
// CIERRE ORDENADO DEL SERVIDOR Y DE ELECTRON
// ======================================================

app.on('before-quit', async (event) => {
  if (cerrandoAplicacion) {
    return;
  }

  event.preventDefault();
  cerrandoAplicacion = true;

  try {
    if (servidorIniciado && stopServer) {
      console.log('[ELECTRON] Cerrando servidor OBS...');

      await stopServer();

      servidorIniciado = false;

      console.log('[ELECTRON] Servidor OBS detenido.');
    }
  } catch (error) {
    console.error(
      '[ELECTRON] Error al cerrar el servidor:',
      error
    );
  } finally {
    app.quit();
  }
});


// ======================================================
// CIERRE DE VENTANAS
// ======================================================

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
