/**
 * PROYECTOR LBC - Aplicación de Escritorio para Iglesias
 * Archivo principal de Electron para Windows (.exe)
 * Creado por: LuftmandMauricio
 * Iglesia Cristiana Cuadrangular Las Brisas
 */

const { app, BrowserWindow, screen, ipcMain, session } = require('electron');
const path = require('path');

let controlWindow = null;
let projectorWindow = null;

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Proyector LBC - Panel de Control',
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

  // Notificar estado inicial al operador
  controlWindow.webContents.on('did-finish-load', () => {
    controlWindow.webContents.send('estado-proyector', {
      abierto: !!(projectorWindow && !projectorWindow.isDestroyed())
    });
  });
}

/**
 * TOGGLE INTELIGENTE DE PANTALLA 2 (TV):
 * - Con 1 solo clic: Detecta el TV/Proyector HDMI y abre a pantalla completa directamente allí (sin arrastrar ventanas).
 * - Con otro clic: Cierra/desactiva la proyección en el televisor.
 */
function toggleProyector() {
  if (projectorWindow && !projectorWindow.isDestroyed()) {
    projectorWindow.close();
    projectorWindow = null;
    if (controlWindow && !controlWindow.isDestroyed()) {
      controlWindow.webContents.send('estado-proyector', { abierto: false });
    }
    return;
  }

  // Detectar monitores conectados en tiempo real
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  // Buscar monitor secundario (el televisor o proyector de la congregación)
  const secondaryDisplay = displays.find(d => d.id !== primaryDisplay.id) ||
                           displays.find(d => d.bounds.x !== primaryDisplay.bounds.x || d.bounds.y !== primaryDisplay.bounds.y) ||
                           (displays.length > 1 ? displays[1] : primaryDisplay);

  const esMonitorSecundario = secondaryDisplay.id !== primaryDisplay.id;

  projectorWindow = new BrowserWindow({
    x: secondaryDisplay.bounds.x,
    y: secondaryDisplay.bounds.y,
    width: secondaryDisplay.bounds.width,
    height: secondaryDisplay.bounds.height,
    fullscreen: esMonitorSecundario, // Pantalla completa automática en el TV
    frame: !esMonitorSecundario,
    alwaysOnTop: esMonitorSecundario,
    title: 'Proyector LBC - Pantalla de Proyección al Templo',
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
    projectorWindow.loadFile(path.join(__dirname, 'public', 'display.html'));
  });

  projectorWindow.on('closed', () => {
    projectorWindow = null;
    if (controlWindow && !controlWindow.isDestroyed()) {
      controlWindow.webContents.send('estado-proyector', { abierto: false });
    }
  });

  if (controlWindow && !controlWindow.isDestroyed()) {
    controlWindow.webContents.send('estado-proyector', {
      abierto: true,
      esSecundaria: esMonitorSecundario
    });
  }
}

// IPC Listeners
ipcMain.on('toggle-proyector', () => toggleProyector());
ipcMain.on('abrir-proyector', () => {
  if (!projectorWindow || projectorWindow.isDestroyed()) toggleProyector();
});
ipcMain.on('cerrar-proyector', () => {
  if (projectorWindow && !projectorWindow.isDestroyed()) {
    projectorWindow.close();
    projectorWindow = null;
    if (controlWindow && !controlWindow.isDestroyed()) {
      controlWindow.webContents.send('estado-proyector', { abierto: false });
    }
  }
});

app.whenReady().then(() => {
  // SOLUCIÓN DEFINITIVA PARA REPRODUCCIÓN DE YOUTUBE (Evita Error 150/153 en Electron local)
  if (session && session.defaultSession) {
    session.defaultSession.webRequest.onBeforeSendHeaders(
      { urls: ['*://*.youtube.com/*', '*://*.youtube-nocookie.com/*'] },
      (details, callback) => {
        details.requestHeaders['Referer'] = 'https://www.youtube.com/';
        details.requestHeaders['Origin'] = 'https://www.youtube.com';
        details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
        callback({ cancel: false, requestHeaders: details.requestHeaders });
      }
    );
  }

  createControlWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createControlWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
