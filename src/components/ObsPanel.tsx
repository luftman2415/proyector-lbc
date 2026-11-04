import React, { useState } from 'react';
import {
  Radio, Copy, Check, ExternalLink, Sparkles, Monitor, Eye, EyeOff,
  User, Volume2, ShieldCheck, Play, RotateCcw
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
  const [nombreOrador, setNombreOrador] = useState<string>('Pastor Principal');
  const [cargoOrador, setCargoOrador] = useState<string>('Predicación de la Palabra');
  const [bannerActivo, setBannerActivo] = useState<boolean>(false);

  const esOscuro = temaOperador !== 'claro';

  const obsUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/obs.html`
    : 'http://localhost:3000/obs.html';

  const copiarUrl = () => {
    navigator.clipboard.writeText(obsUrl);
    setCopiado(true);
    mostrarToast('¡Enlace de OBS copiado al portapapeles!');
    setTimeout(() => setCopiado(false), 3000);
  };

  const abrirEnVentana = () => {
    window.open('/obs.html', 'OBS_Overlay_LBC', 'width=1280,height=720,menubar=no,toolbar=no');
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
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border relative overflow-hidden ${
        esOscuro
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-slate-800'
          : 'bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-600/20 text-red-500 border border-red-500/30 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Transmisión en Vivo
              </span>
              <span className="text-xs font-semibold text-amber-500">• OBS Studio & vMix</span>
            </div>
            <h2 className={`text-2xl font-black tracking-tight ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
              Salida a OBS (Lower Thirds Transparentes)
            </h2>
            <p className={`text-xs sm:text-sm max-w-2xl ${esOscuro ? 'text-slate-400' : 'text-slate-600'}`}>
              Superpón letras de canciones, versículos bíblicos y nombres de predicadores directamente sobre la señal de tus cámaras sin tapar el video de la transmisión.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={copiarUrl}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              {copiado ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? '¡Enlace Copiado!' : 'Copiar URL para OBS'}</span>
            </button>

            <button
              onClick={abrirEnVentana}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                esOscuro ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Overlay</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Configuración e Instrucciones (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Tarjeta 1: Instrucciones paso a paso de OBS */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            esOscuro ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Cómo agregar en OBS Studio
            </h3>

            <div className={`p-3 rounded-xl border text-xs font-mono break-all flex items-center justify-between gap-2 ${
              esOscuro ? 'bg-slate-950 border-slate-800 text-blue-300' : 'bg-slate-100 border-slate-300 text-blue-700'
            }`}>
              <span className="truncate">{obsUrl}</span>
              <button
                onClick={copiarUrl}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white shrink-0"
                title="Copiar URL"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <ol className={`text-xs space-y-2 list-decimal list-inside leading-relaxed ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
              <li>En OBS Studio, ve a tu Escena y agrega una fuente de tipo <strong>"Navegador" (Browser)</strong>.</li>
              <li>Pega la URL de arriba en el campo de enlace.</li>
              <li>Establece el tamaño en <strong>Ancho: 1920</strong> y <strong>Alto: 1080</strong>.</li>
              <li>Deja el fondo predeterminado (es <strong>100% transparente</strong>).</li>
              <li>Coloca esta capa por encima de tu cámara de transmisión.</li>
            </ol>
          </div>

          {/* Tarjeta 2: Generador de Banner de Orador / Predicador */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            esOscuro ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                <User className="w-4 h-4 text-amber-400" />
                Banner de Orador / Pastor
              </h3>
              {bannerActivo && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ● EN VIVO EN OBS
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-400">Nombre del Predicador / Líder:</label>
                <input
                  type="text"
                  value={nombreOrador}
                  onChange={(e) => setNombreOrador(e.target.value)}
                  placeholder="Ej: Pastor Luis Gómez"
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    esOscuro ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-400">Título / Cargo / Tema:</label>
                <input
                  type="text"
                  value={cargoOrador}
                  onChange={(e) => setCargoOrador(e.target.value)}
                  placeholder="Ej: Predicación de la Palabra | Pastor Principal"
                  className={`w-full px-3 py-2 rounded-xl border text-xs outline-none ${
                    esOscuro ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={proyectarBannerOrador}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Transmitir Banner a OBS</span>
                </button>

                {bannerActivo && (
                  <button
                    onClick={ocultarBannerOrador}
                    className="py-2 px-3 rounded-xl text-xs font-semibold bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition cursor-pointer"
                  >
                    Ocultar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Pruebas rápidas */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            esOscuro ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pruebas Rápidas de Transmisión
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={emitirPruebaVersiculo}
                className="p-2 rounded-xl border border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold transition text-left cursor-pointer"
              >
                📖 Probar Versículo
              </button>
              <button
                onClick={emitirPruebaCancion}
                className="p-2 rounded-xl border border-purple-500/30 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 font-bold transition text-left cursor-pointer"
              >
                🎵 Probar Canción
              </button>
            </div>
            <button
              onClick={limpiarObs}
              className="w-full py-2 rounded-xl text-xs font-bold bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar Overlay de OBS</span>
            </button>
          </div>

        </div>

        {/* Columna Derecha: Vista Previa Simulada de Transmisión (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className={`p-5 rounded-2xl border space-y-3 ${
            esOscuro ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-400" />
                <h3 className={`text-sm font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                  Monitor Simulado de Salida (Cámara + Lower Third)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">1920 x 1080 (16:9)</span>
            </div>

            {/* Stage Screen (Simulates camera feed + transparent overlay) */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col justify-end p-4 sm:p-6">
              
              {/* Background gradient simulating church sanctuary camera */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-indigo-950/40 pointer-events-none"></div>
              
              <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  EN VIVO
                </span>
                <span className="text-[10px] text-slate-400 bg-black/60 px-2 py-0.5 rounded backdrop-blur">
                  Cámara 1 - Púlpito Templo Las Brisas
                </span>
              </div>

              {/* Lower Third Overlay Preview */}
              <div className="relative z-10 w-full animate-in slide-in-from-bottom-2 duration-300">
                {bannerActivo ? (
                  /* Speaker Banner */
                  <div className="p-4 rounded-xl bg-slate-950/95 border-2 border-amber-500/70 shadow-2xl backdrop-blur max-w-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-blue-600 to-amber-500"></div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                      Iglesia Cristiana Cuadrangular Las Brisas
                    </div>
                    <div className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                      {nombreOrador || 'Pastor Principal'}
                    </div>
                    <div className="text-xs text-slate-300 font-semibold mt-0.5">
                      {cargoOrador || 'Predicación de la Palabra'}
                    </div>
                  </div>
                ) : proyeccionActual ? (
                  /* Projected Lyric / Scripture */
                  <div className="p-4 rounded-xl bg-slate-950/95 border-2 border-amber-500/70 shadow-2xl backdrop-blur relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-blue-600 to-amber-500"></div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/40 px-2 py-0.5 rounded-full">
                        {proyeccionActual.titulo || proyeccionActual.pie || 'Escritura'}
                      </span>
                      <span className="text-[10px] text-slate-400">LBC Proyector</span>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-3">
                      {proyeccionActual.texto}
                    </p>
                    {proyeccionActual.pie && (
                      <p className="text-[11px] text-amber-300 font-semibold mt-1">
                        {proyeccionActual.pie}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-black/40 text-center text-xs text-slate-400">
                    Ningún contenido activo en OBS. Selecciona una canción, versículo o activa el banner del pastor.
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              💡 La salida en OBS es transparente: solo el cuadro inferior con el texto se verá en tu transmisión de YouTube / Facebook.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
