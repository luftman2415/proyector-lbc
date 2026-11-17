import React, { useState, useEffect } from 'react';
import {
  Radio, Copy, Check, ExternalLink, Monitor,
  User, ShieldCheck, Play, RotateCcw, Wifi
} from 'lucide-react';

interface ObsPanelProps {
  temaOperador: 'oscuro' | 'claro';
  proyeccionActual: any;
  enviarAlProyector: (data: any) => void;
  mostrarToast: (texto: string, tipo?: 'exito' | 'error' | 'info') => void;
}

export const ObsPanel: React.FC<ObsPanelProps> = ({
  temaOperador,
  proyeccionActual,
  enviarAlProyector,
  mostrarToast
}) => {
  const [copiado, setCopiado] = useState<boolean>(false);
  const [copiadoRed, setCopiadoRed] = useState<boolean>(false);
  const [ipRed, setIpRed] = useState<string>('');
  const [nombreOrador, setNombreOrador] = useState<string>('Pastor Principal');
  const [cargoOrador, setCargoOrador] = useState<string>('Predicación de la Palabra');
  const [bannerActivo, setBannerActivo] = useState<boolean>(false);

  const esOscuro = temaOperador !== 'claro';

  const esHttp = typeof window !== 'undefined' && window.location.protocol.startsWith('http');
  const obsUrl = esHttp ? `${window.location.origin}/obs.html` : 'http://localhost:3000/obs.html';

  useEffect(() => {
    fetch('/api/network-info')
      .then(res => res.json())
      .then(info => {
        if (info?.url) {
          setIpRed(info.url);
        } else if (info?.ip && info.ip !== 'localhost') {
          setIpRed(`http://${info.ip}:3000/obs.html`);
        }
      })
      .catch(() => {});
  }, []);

  const copiarUrl = () => {
    navigator.clipboard.writeText(obsUrl);
    setCopiado(true);
    mostrarToast('¡Enlace local de OBS copiado!');
    setTimeout(() => setCopiado(false), 3000);
  };

  const copiarUrlRed = () => {
    const urlACopiar = ipRed || obsUrl;
    navigator.clipboard.writeText(urlACopiar);
    setCopiadoRed(true);
    mostrarToast('¡Enlace de Red Local para el segundo computador copiado!');
    setTimeout(() => setCopiadoRed(false), 3000);
  };

  const abrirEnVentana = () => {
    window.open('/obs.html', 'OBS_Overlay_ICC', 'width=1280,height=720,menubar=no,toolbar=no');
  };

  const proyectarBannerOrador = () => {
    if (!nombreOrador.trim()) {
      mostrarToast('Escribe el nombre del orador o pastor', 'error');
      return;
    }
    setBannerActivo(true);
    enviarAlProyector({
      accion: 'speakerBanner',
      nombre: nombreOrador,
      cargo: cargoOrador,
      visible: true
    });
    mostrarToast(`Banner de "${nombreOrador}" transmitido a OBS`);
  };

  const ocultarBannerOrador = () => {
    setBannerActivo(false);
    enviarAlProyector({
      accion: 'speakerBanner',
      visible: false
    });
    mostrarToast('Banner de orador ocultado en OBS', 'info');
  };

  const emitirPruebaVersiculo = () => {
    enviarAlProyector({
      accion: 'mostrar',
      texto: '"Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna."',
      pie: '— Juan 3:16 (RVR1960)',
      tipo: 'biblia'
    });
    mostrarToast('Versículo de prueba enviado a la transmisión OBS');
  };

  const emitirPruebaCancion = () => {
    enviarAlProyector({
      accion: 'mostrar',
      texto: 'No hay lugar más alto, más grande\nQue estar a tus pies,\nQue estar a tus pies.',
      pie: '🎵 NO HAY LUGAR MÁS ALTO',
      tipo: 'cancion'
    });
    mostrarToast('Estrofa de alabanza enviada a la transmisión OBS');
  };

  const limpiarObs = () => {
    enviarAlProyector({ accion: 'limpiar' });
    enviarAlProyector({ accion: 'speakerBanner', visible: false });
    setBannerActivo(false);
    mostrarToast('Pantalla y tercios de OBS limpiados', 'info');
  };

  return (
    <div className="h-full min-h-0 flex-1 flex flex-col gap-2 overflow-hidden animate-in fade-in duration-200">
      
      {/* Header Banner Compacto - 100% visible en una sola pantalla */}
      <div className={`py-1.5 px-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 shrink-0 ${
        esOscuro
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-slate-800'
          : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-red-600/20 text-red-500 border border-red-500/30 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            Transmisión en Vivo
          </span>
          <span className="text-[11px] font-semibold text-amber-500">• OBS Studio & vMix</span>
          <h2 className={`text-xs md:text-sm font-black tracking-tight ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
            Salida a OBS (Lower Thirds Transparentes)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            onClick={copiarUrlRed}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow flex items-center gap-1 transition cursor-pointer"
            title="Copiar enlace de red local para el segundo computador de la iglesia"
          >
            {copiadoRed ? <Check className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{copiadoRed ? '¡Enlace Copiado!' : 'Copiar URL Red (2do PC)'}</span>
          </button>

          <button
            onClick={copiarUrl}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white shadow flex items-center gap-1 transition cursor-pointer"
            title="Copiar enlace para OBS en este mismo computador"
          >
            {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiado ? '¡Copiado!' : 'Copiar URL Local'}</span>
          </button>

          <button
            onClick={abrirEnVentana}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition cursor-pointer ${
              esOscuro ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
            }`}
          >
            <ExternalLink className="w-3 h-3" />
            <span>Ver Overlay</span>
          </button>
        </div>
      </div>

      {/* Grid Principal Compacto (Ajustado al 100% de la ventana) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0 overflow-hidden">
        
        {/* Columna Izquierda: Instrucciones y Configuración (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2 overflow-y-auto pr-1">
          
          {/* Tarjeta 1: Conexión y Pasos Rápidos en OBS */}
          <div className={`p-3 rounded-xl border space-y-2 shrink-0 ${
            esOscuro ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cómo Conectar en OBS Studio</span>
            </h3>

            {/* Enlace Red Local */}
            <div className={`p-2 rounded-lg border text-[11px] font-mono flex items-center justify-between gap-1.5 ${
              esOscuro ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}>
              <span className="truncate font-bold">{ipRed || 'http://192.168.1.8:3000/obs.html'}</span>
              <button
                onClick={copiarUrlRed}
                className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shrink-0 cursor-pointer"
              >
                {copiadoRed ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            {/* 3 Pasos Directos */}
            <ol className={`text-[11px] space-y-1 list-decimal list-inside leading-snug ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
              <li>En OBS, añade una fuente <strong>"Navegador"</strong> (Browser).</li>
              <li>Pega el enlace verde de red local.</li>
              <li>Ajusta resolución: <strong>1920 × 1080</strong> (fondo 100% transparente).</li>
            </ol>
          </div>

          {/* Tarjeta 2: Generador de Banner de Orador / Predicador */}
          <div className={`p-3 rounded-xl border space-y-2 shrink-0 ${
            esOscuro ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Banner de Orador / Pastor</span>
              </h3>
              {bannerActivo && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ● EN VIVO EN OBS
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <label className="block font-semibold mb-0.5 text-slate-400">Predicador / Líder:</label>
                <input
                  type="text"
                  value={nombreOrador}
                  onChange={(e) => setNombreOrador(e.target.value)}
                  placeholder="Ej: Pastor Luis Gómez"
                  className={`w-full px-2.5 py-1 rounded-lg border text-xs outline-none ${
                    esOscuro ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-0.5 text-slate-400">Título / Cargo / Tema:</label>
                <input
                  type="text"
                  value={cargoOrador}
                  onChange={(e) => setCargoOrador(e.target.value)}
                  placeholder="Ej: Predicación de la Palabra"
                  className={`w-full px-2.5 py-1 rounded-lg border text-xs outline-none ${
                    esOscuro ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <button
                onClick={proyectarBannerOrador}
                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Transmitir Banner a OBS</span>
              </button>

              {bannerActivo && (
                <button
                  onClick={ocultarBannerOrador}
                  className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition cursor-pointer"
                >
                  Ocultar
                </button>
              )}
            </div>
          </div>

          {/* Tarjeta 3: Pruebas rápidas y Limpieza */}
          <div className={`p-2.5 rounded-xl border space-y-2 shrink-0 ${
            esOscuro ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Pruebas Rápidas de Transmisión:
              </span>
              <button
                onClick={limpiarObs}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpiar Overlay</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                onClick={emitirPruebaVersiculo}
                className="p-1.5 rounded-lg border border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold transition text-center cursor-pointer"
              >
                📖 Probar Versículo
              </button>
              <button
                onClick={emitirPruebaCancion}
                className="p-1.5 rounded-lg border border-purple-500/30 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 font-bold transition text-center cursor-pointer"
              >
                🎵 Probar Canción
              </button>
            </div>
          </div>

        </div>

        {/* Columna Derecha: Vista Previa Simulada de Transmisión (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-1.5 overflow-hidden">
          <div className={`p-2.5 rounded-xl border flex flex-col flex-1 min-h-0 justify-between ${
            esOscuro ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-1 border-b border-slate-800/60 shrink-0">
              <div className="flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-blue-400" />
                <h3 className={`text-xs font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                  Monitor Simulado de Salida (Cámara + Lower Third)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">1920 × 1080 (16:9)</span>
            </div>

            {/* Stage Screen (Simula señal de cámara + overlay transparente) - Altura compacta para encajar 100% sin zoom */}
            <div className="relative aspect-video max-h-[200px] w-full mx-auto rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shadow-xl flex flex-col justify-end p-2.5 shrink-0 my-auto">
              
              {/* Fondo simulando cámara del púlpito */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-indigo-950/40 pointer-events-none"></div>
              
              <div className="absolute top-1.5 left-2 flex items-center gap-1.5 z-10">
                <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-red-600 text-white text-[8px] font-extrabold uppercase tracking-wider">
                  <span className="w-1 h-1 rounded-full bg-white animate-pulse"></span>
                  EN VIVO
                </span>
                <span className="text-[9px] text-slate-400 bg-black/60 px-1.5 py-0.2 rounded backdrop-blur">
                  Cámara 1 - Púlpito Templo Las Brisas
                </span>
              </div>

              {/* Lower Third Overlay Preview */}
              <div className="relative z-10 w-full animate-in slide-in-from-bottom-2 duration-300">
                {bannerActivo ? (
                  /* Speaker Banner */
                  <div className="p-2 rounded-lg bg-slate-950/95 border border-amber-500/70 shadow-2xl backdrop-blur max-w-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 via-blue-600 to-amber-500"></div>
                    <div className="text-[8px] font-extrabold uppercase tracking-wider text-amber-400">
                      Iglesia Cristiana Cuadrangular Las Brisas
                    </div>
                    <div className="text-xs font-black text-white leading-tight mt-0.5 truncate">
                      {nombreOrador || 'Pastor Principal'}
                    </div>
                    <div className="text-[10px] text-slate-300 font-semibold mt-0.5 truncate">
                      {cargoOrador || 'Predicación de la Palabra'}
                    </div>
                  </div>
                ) : proyeccionActual ? (
                  /* Projected Lyric / Scripture */
                  <div className="p-2 rounded-lg bg-slate-950/95 border border-amber-500/70 shadow-2xl backdrop-blur relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-600 via-blue-600 to-amber-500"></div>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[8px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/40 px-1.5 py-0.2 rounded-full">
                        {proyeccionActual.titulo || proyeccionActual.pie || 'Escritura'}
                      </span>
                      <span className="text-[8px] text-slate-400">ICC Proyector</span>
                    </div>
                    <p className="text-xs font-bold text-white leading-tight line-clamp-2">
                      {proyeccionActual.texto}
                    </p>
                    {proyeccionActual.pie && (
                      <p className="text-[9px] text-amber-300 font-semibold mt-0.5 truncate">
                        {proyeccionActual.pie}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-2 rounded-lg border border-dashed border-slate-700 bg-black/40 text-center text-[10px] text-slate-400">
                    Ningún contenido activo en OBS. Selecciona una canción, versículo o activa el banner del pastor.
                  </div>
                )}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center pt-0.5 shrink-0">
              💡 La salida en OBS es 100% transparente: solo el tercio inferior con el texto se verá en tu transmisión de YouTube / Facebook.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
