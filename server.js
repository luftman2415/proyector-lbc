
/**
 * PROYECTOR LBC
 * Servidor de comunicación con OBS Studio
 * Comunicación local y por red mediante WebSocket
 */

const express = require('express');
const http = require('http');
const os = require('os');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = Number(process.env.LBC_SERVER_PORT || 3001);
const HOST = '0.0.0.0';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });
// Carpeta temporal para los videos que se proyectarán en OBS.
const carpetaVideos = process.env.LBC_VIDEOS_DIR
  ? path.resolve(process.env.LBC_VIDEOS_DIR)
  : path.join(__dirname, 'videos-obs');

if (!fs.existsSync(carpetaVideos)) {
  fs.mkdirSync(carpetaVideos, { recursive: true });
}

// Configuración para recibir archivos de video.
const almacenamientoVideos = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, carpetaVideos);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const nombre = `video-${Date.now()}${extension}`;
    cb(null, nombre);
  }
});

const recibirVideo = multer({
  storage: almacenamientoVideos,
  limits: {
    fileSize: 1024 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('El archivo seleccionado no es un video.'));
    }
  }
});

let ultimoMensaje = null;

app.use(express.json({ limit: '5mb' }));

// Permitir solicitudes desde el panel de desarrollo y Electron.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// Obtener las direcciones de red del computador.
function obtenerDireccionesIP() {
  const interfaces = os.networkInterfaces();
  const direcciones = [];

  for (const nombre of Object.keys(interfaces)) {
    for (const interfaz of interfaces[nombre] || []) {
      if (
        interfaz.family === 'IPv4' &&
        !interfaz.internal
      ) {
        direcciones.push(interfaz.address);
      }
    }
  }

  return direcciones;
}

// Información del servidor y dirección para OBS.
app.get('/api/network-info', (req, res) => {
  const ips = obtenerDireccionesIP();

  res.json({
    conectado: true,
    puerto: PORT,
    ip: ips[0] || 'localhost',
    ips,
    url: ips.length
      ? `http://${ips[0]}:${PORT}/obs.html`
      : `http://localhost:${PORT}/obs.html`,
    ws: `ws://${req.hostname}:${PORT}/ws`
  });
});

// Comprobar que el servidor está funcionando.
app.get('/api/health', (req, res) => {
  res.json({
    estado: 'activo',
    servicio: 'Proyector LBC',
    clientesOBS: wss.clients.size
  });
});

// Recibir archivos de video para proyectarlos en OBS.
app.post('/api/upload-video', recibirVideo.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No se recibió ningún archivo de video.'
    });
  }

  const ipServidor = obtenerDireccionesIP()[0] || '127.0.0.1';

  res.json({
    recibido: true,
    nombre: req.file.filename,
    url: `http://${ipServidor}:${PORT}/videos-obs/${req.file.filename}`
  });
});

// Servir los videos almacenados para OBS.
app.use('/videos-obs', express.static(carpetaVideos));

// Recibir mensajes enviados por Proyector LBC.
app.post('/api/obs-data', (req, res) => {
  const data = req.body;

  if (!data || typeof data !== 'object' || !data.accion) {
    return res.status(400).json({
      error: 'Mensaje no válido'
    });
  }

  ultimoMensaje = data;

  const mensaje = JSON.stringify(data);
  let enviados = 0;

  wss.clients.forEach((cliente) => {
    if (cliente.readyState === WebSocket.OPEN) {
      cliente.send(mensaje);
      enviados++;
    }
  });

  res.json({
    recibido: true,
    clientesNotificados: enviados
  });
});

// Servir obs.html y los recursos de la carpeta public.
app.use(express.static(path.join(__dirname, 'public')));

// Conexiones de OBS mediante WebSocket.
wss.on('connection', (socket) => {
  console.log('[OBS] Un cliente se ha conectado.');

    // No repetir órdenes antiguas al conectar OBS.

  socket.on('message', (mensaje) => {
    try {
      const data = JSON.parse(mensaje.toString());

      if (data.accion === 'ping') {
        socket.send(JSON.stringify({
          accion: 'pong',
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error('[OBS] Mensaje recibido no válido.');
    }
  });

  socket.on('close', () => {
    console.log('[OBS] Un cliente se ha desconectado.');
  });

  socket.on('error', (error) => {
    console.error('[OBS] Error de conexión:', error.message);
  });
});

// Iniciar el servidor.
function startServer() {
  return new Promise((resolve, reject) => {
    if (server.listening) {
      return resolve(server);
    }

    server.once('error', reject);

    server.listen(PORT, HOST, () => {
      server.removeListener('error', reject);

      console.log('======================================');
      console.log(' PROYECTOR LBC - SERVIDOR OBS');
      console.log('======================================');
      console.log(`Servidor: http://localhost:${PORT}`);
      console.log(`Overlay:  http://localhost:${PORT}/obs.html`);
      console.log(`WebSocket: ws://localhost:${PORT}/ws`);
      console.log('IPs de red:', obtenerDireccionesIP().join(', '));
      console.log('======================================');

      resolve(server);
    });
  });
}

// Permitir utilizar el servidor desde Electron o desde Node.js.
function stopServer() {
  return new Promise((resolve) => {
    if (!server.listening) {
      return resolve();
    }

    wss.clients.forEach((cliente) => {
      cliente.close();
    });

    wss.close(() => {
      server.close(() => resolve());
    });
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('[PROYECTOR LBC] No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  });
}

module.exports = {
  startServer,
  stopServer,
  obtenerDireccionesIP
};
