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

function createWindows() {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();
  
  // Si hay más de una pantalla conectada (Monitor principal + Proyector/TV del templo)
  const externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0;
  });

  // 1. VENTANA PRINCIPAL (PANEL DE CONTROL DEL OPERADOR)
  controlWindow = new BrowserWindow({
    width: 1366,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Proyector LBC - Panel de Control',
    icon: path.join(__dirname, 'public/assets/icon.png'),
    backgroundColor: '#030712',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Permite leer archivos locales sin restricciones
      backgroundThrottling: false // CRÍTICO: Impide que Chromium congele la ventana cuando pierde el foco
    }
  });

  // Cargar la aplicación compilada
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  controlWindow.loadFile(indexPath).catch(() => {
    controlWindow.loadFile(path.join(__dirname, 'index.html'));
  });

  controlWindow.on('closed', () => {
    controlWindow = null;
    if (projectorWindow) projectorWindow.close();
  });

  // 2. VENTANA SECUNDARIA (PANTALLA DE PROYECCIÓN / SALIDA AL PÚBLICO)
  if (externalDisplay) {
    // Si hay proyector conectado, abrir directamente en pantalla completa en el proyector
    abrirVentanaProyector(externalDisplay);
  }
}

function abrirVentanaProyector(targetDisplay = null) {
  if (projectorWindow) {
    projectorWindow.focus();
    return;
  }

  const displays = screen.getAllDisplays();
  const display = targetDisplay || (displays.length > 1 ? displays[1] : displays[0]);

  projectorWindow = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    fullscreen: displays.length > 1, // Fullscreen automático solo si es monitor secundario
    frame: displays.length <= 1,
    title: 'Proyector LBC - Pantalla de Salida',
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      backgroundThrottling: false // CRÍTICO: Garantiza respuesta inmediata a 0ms en segundo plano
    }
  });

  const displayPath = path.join(__dirname, 'dist', 'display.html');
  projectorWindow.loadFile(displayPath).catch(() => {
    projectorWindow.loadFile(path.join(__dirname, 'public', 'display.html'));
  });

  projectorWindow.on('closed', () => {
    projectorWindow = null;
  });
}

// IPC para abrir el proyector manualmente si el usuario lo pulsa
ipcMain.on('abrir-proyector', () => {
  abrirVentanaProyector();
});

app.whenReady().then(() => {
  // SOLUCIÓN CRÍTICA PARA YOUTUBE ERROR 153 EN ELECTRON LOCAL (file://):
  // YouTube rechaza reproductores si el origen o Referer es nulo o file://.
  // Inyectamos Referer y Origin válidos para que los embeds funcionen al 100%.
  if (session && session.defaultSession) {
    session.defaultSession.webRequest.onBeforeSendHeaders(
      { urls: ['*://*.youtube.com/*', '*://*.youtube-nocookie.com/*'] },
      (details, callback) => {
        details.requestHeaders['Referer'] = 'https://www.youtube.com/';
        details.requestHeaders['Origin'] = 'https://www.youtube.com';
        callback({ cancel: false, requestHeaders: details.requestHeaders });
      }
    );
  }

  createWindows();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindows();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
