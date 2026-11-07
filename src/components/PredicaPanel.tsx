import React, { useState, useEffect } from 'react';
import {
  ScrollText, Plus, Trash2, Play, BookOpen, User, Calendar,
  CheckCircle, ArrowUp, ArrowDown, Sparkles, Check, Copy
} from 'lucide-react';
import { BosquejoPredica } from '../types';

interface PredicaPanelProps {
  temaOperador: 'oscuro' | 'claro';
  onProyectar: (texto: string, pie?: string, titulo?: string) => void;
  mostrarToast: (mensaje: string, tipo?: 'success' | 'error' | 'info') => void;
}

const BOSQUEJOS_PREDETERMINADOS: BosquejoPredica[] = [
  {
    id: 'bosquejo-1',
    titulo: 'El Poder Sobrenatural de la Oración',
    predicador: 'Pastor Principal',
    fechaCulto: 'Culto Dominical • 10:00 AM',
    citasBiblicas: ['Filipenses 4:6-7', 'Mateo 6:9-13', 'Santiago 5:16'],
    puntos: [
      '1. La oración sincera abre los cielos y derriba fortalezas',
      '2. La perseverancia en el clamor activa la respuesta de Dios',
      '3. La intercesión trae sanidad, consuelo y restauración a la iglesia'
    ],
    conclusion: 'Acerquémonos, pues, confiadamente al trono de la gracia, para alcanzar misericordia y hallar gracia para el oportuno socorro.'
  },
  {
    id: 'bosquejo-2',
    titulo: 'Los Cuatro Pilares del Evangelio Cuadrangular',
    predicador: 'Pastor Principal',
    fechaCulto: 'Culto de Doctrina • Miércoles 7:00 PM',
    citasBiblicas: ['Hebreos 13:8', 'Juan 3:16', 'Hechos 1:8', 'Santiago 5:14-15', '1 Tesalonicenses 4:16-17'],
    puntos: [
      '1. Jesucristo el Salvador (La Cruz)',
      '2. Jesucristo el Bautizador con el Espíritu Santo (La Paloma)',
      '3. Jesucristo el Gran Sanador (El Cáliz / Copa)',
      '4. Jesucristo el Rey que Viene (La Corona)'
    ],
    conclusion: 'Jesucristo es el mismo ayer, y hoy, y por los siglos. ¡Prediquemos el Evangelio Completo!'
  },
  {
    id: 'bosquejo-3',
    titulo: 'Caminando por Fe y no por Vista',
    predicador: 'Líder de Jóvenes / Invitado',
    fechaCulto: 'Culto de Jóvenes • Sábado 6:30 PM',
    citasBiblicas: ['Hebreos 11:1-6', '2 Corintios 5:7'],
    puntos: [
      '1. La fe es la certeza de lo que se espera y convicción de lo que no se ve',
      '2. Sin fe es imposible agradar a Dios',
      '3. La fe verdadera se demuestra con hechos y perseverancia'
    ],
    conclusion: 'No temas ni desmayes, porque Jehová tu Dios estará contigo dondequiera que vayas.'
  }
];

export const PredicaPanel: React.FC<PredicaPanelProps> = ({
  temaOperador,
  onProyectar,
  mostrarToast
}) => {
  const [bosquejos, setBosquejos] = useState<BosquejoPredica[]>(() => {
    const guardado = localStorage.getItem('lbc_bosquejos_predica');
    if (guardado) {
      try {
        const parsed = JSON.parse(guardado);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return BOSQUEJOS_PREDETERMINADOS;
  });

  const [bosquejoActivoId, setBosquejoActivoId] = useState<string>(() => {
    return bosquejos[0]?.id || 'bosquejo-1';
  });

  const bosquejoActual = bosquejos.find(b => b.id === bosquejoActivoId) || bosquejos[0];

  const [nuevaCitaInput, setNuevaCitaInput] = useState<string>('');
  const [nuevoPuntoInput, setNuevoPuntoInput] = useState<string>('');
  const [puntoProyectadoIdx, setPuntoProyectadoIdx] = useState<number>(-1);

  // Guardar en localStorage cada vez que cambien los bosquejos
  useEffect(() => {
    try {
      localStorage.setItem('lbc_bosquejos_predica', JSON.stringify(bosquejos));
    } catch (e) {}
  }, [bosquejos]);

  const actualizarBosquejoActual = (cambios: Partial<BosquejoPredica>) => {
    setBosquejos(prev => prev.map(b => b.id === bosquejoActual.id ? { ...b, ...cambios } : b));
  };

  const crearNuevoBosquejo = () => {
    const nuevo: BosquejoPredica = {
      id: `bosquejo-${Date.now()}`,
      titulo: 'Nuevo Tema de Enseñanza',
      predicador: 'Pastor',
      fechaCulto: 'Culto del Día',
      citasBiblicas: ['Cita Bíblica Principal (ej: Juan 3:16)'],
      puntos: ['1. Primer punto del mensaje', '2. Segundo punto del mensaje'],
      conclusion: 'Palabra de conclusión y ministración final.'
    };
    setBosquejos(prev => [nuevo, ...prev]);
    setBosquejoActivoId(nuevo.id);
    mostrarToast('Nuevo bosquejo de prédica creado', 'success');
  };

  const eliminarBosquejoActual = () => {
    if (bosquejos.length <= 1) {
      mostrarToast('Debe haber al menos un bosquejo guardado', 'error');
      return;
    }
    const restantes = bosquejos.filter(b => b.id !== bosquejoActual.id);
    setBosquejos(restantes);
    setBosquejoActivoId(restantes[0].id);
    mostrarToast('Bosquejo eliminado', 'info');
  };

  const agregarCita = () => {
    if (!nuevaCitaInput.trim()) return;
    actualizarBosquejoActual({
      citasBiblicas: [...bosquejoActual.citasBiblicas, nuevaCitaInput.trim()]
    });
    setNuevaCitaInput('');
    mostrarToast('Cita bíblica agregada');
  };

  const eliminarCita = (index: number) => {
    actualizarBosquejoActual({
      citasBiblicas: bosquejoActual.citasBiblicas.filter((_, i) => i !== index)
    });
  };

  const agregarPunto = () => {
    if (!nuevoPuntoInput.trim()) return;
    const num = bosquejoActual.puntos.length + 1;
    const texto = nuevoPuntoInput.trim().match(/^\d+\./)
      ? nuevoPuntoInput.trim()
      : `${num}. ${nuevoPuntoInput.trim()}`;
    actualizarBosquejoActual({
      puntos: [...bosquejoActual.puntos, texto]
    });
    setNuevoPuntoInput('');
    mostrarToast('Punto del bosquejo agregado');
  };

  const eliminarPunto = (index: number) => {
    actualizarBosquejoActual({
      puntos: bosquejoActual.puntos.filter((_, i) => i !== index)
    });
  };

  const moverPunto = (index: number, direccion: 'arriba' | 'abajo') => {
    const destino = direccion === 'arriba' ? index - 1 : index + 1;
    if (destino < 0 || destino >= bosquejoActual.puntos.length) return;
    const copia = [...bosquejoActual.puntos];
    const temp = copia[index];
    copia[index] = copia[destino];
    copia[destino] = temp;
    actualizarBosquejoActual({ puntos: copia });
  };

  // Acciones de Proyección
  const proyectarPortadaPredica = () => {
    setPuntoProyectadoIdx(-1);
    const texto = `${bosquejoActual.titulo.toUpperCase()}\n\nPredicador: ${bosquejoActual.predicador}\n${bosquejoActual.citasBiblicas.join(' • ')}`;
    const pie = `👑 ${bosquejoActual.fechaCulto}`;
    onProyectar(texto, pie, bosquejoActual.titulo);
    mostrarToast(`Proyectando tema: "${bosquejoActual.titulo}"`);
  };

  const proyectarCitasBiblicas = () => {
    setPuntoProyectadoIdx(-1);
    const texto = `SAGRADAS ESCRITURAS\n\n${bosquejoActual.citasBiblicas.join('\n')}`;
    const pie = `📖 ${bosquejoActual.titulo}`;
    onProyectar(texto, pie, 'Citas Bíblicas');
    mostrarToast('Proyectando citas bíblicas de la prédica');
  };

  const proyectarPuntoIndividual = (punto: string, idx: number) => {
    setPuntoProyectadoIdx(idx);
    const texto = `${punto.toUpperCase()}`;
    const pie = `👑 TEMA: ${bosquejoActual.titulo.toUpperCase()}`;
    onProyectar(texto, pie, punto);
    mostrarToast(`Proyectando: ${punto}`);
  };

  const proyectarResumenPuntos = () => {
    setPuntoProyectadoIdx(-1);
    const texto = `${bosquejoActual.titulo.toUpperCase()}\n\n${bosquejoActual.puntos.join('\n')}`;
    const pie = `📋 BOSQUEJO DE LA ENSEÑANZA`;
    onProyectar(texto, pie, 'Bosquejo Completo');
    mostrarToast('Proyectando resumen de puntos del sermón');
  };

  const proyectarConclusion = () => {
    setPuntoProyectadoIdx(-1);
    if (!bosquejoActual.conclusion) return;
    const texto = `CONCLUSIÓN / MINISTRACIÓN\n\n"${bosquejoActual.conclusion}"`;
    const pie = `👑 ${bosquejoActual.titulo}`;
    onProyectar(texto, pie, 'Conclusión');
    mostrarToast('Proyectando conclusión de la prédica');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 h-[calc(100vh-105px)] overflow-hidden">
      
      {/* Columna Izquierda: Editor y Configuración del Bosquejo (6 cols) */}
      <div className={`xl:col-span-6 border rounded-2xl p-4 flex flex-col gap-3 shadow-xl overflow-y-auto ${
        temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
      }`}>
        
        {/* Cabecera y Selector de Bosquejos */}
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 ${
          temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="font-black text-xs uppercase tracking-wider">Bosquejos & Notas de Prédica</h2>
              <p className="text-[10px] text-slate-400">Prepara el tema, los puntos y las citas del sermón pastoral</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={bosquejoActivoId}
              onChange={(e) => {
                setBosquejoActivoId(e.target.value);
                setPuntoProyectadoIdx(-1);
              }}
              className={`border rounded-lg text-xs font-bold px-2.5 py-1.5 focus:outline-none max-w-[210px] ${
                temaOperador === 'claro' ? 'bg-slate-50 border-slate-300 text-amber-700' : 'bg-slate-950 border-slate-800 text-amber-400'
              }`}
            >
              {bosquejos.map(b => (
                <option key={b.id} value={b.id}>{b.titulo}</option>
              ))}
            </select>

            <button
              onClick={crearNuevoBosquejo}
              title="Crear un nuevo bosquejo de prédica"
              className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo</span>
            </button>

            <button
              onClick={eliminarBosquejoActual}
              title="Eliminar este bosquejo"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Campos Principales */}
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">
              👑 TÍTULO / TEMA DE LA ENSEÑANZA:
            </label>
            <input
              type="text"
              value={bosquejoActual.titulo}
              onChange={(e) => actualizarBosquejoActual({ titulo: e.target.value })}
              placeholder="Ej: El Poder de la Oración, Los Cuatro Pilares..."
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                temaOperador === 'claro' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                👤 PREDICADOR:
              </label>
              <input
                type="text"
                value={bosquejoActual.predicador}
                onChange={(e) => actualizarBosquejoActual({ predicador: e.target.value })}
                placeholder="Ej: Pastor Principal, Pastor Invitado..."
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  temaOperador === 'claro' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                📅 CULTO / FECHA:
              </label>
              <input
                type="text"
                value={bosquejoActual.fechaCulto}
                onChange={(e) => actualizarBosquejoActual({ fechaCulto: e.target.value })}
                placeholder="Ej: Culto Dominical 10:00 AM, Culto de Jóvenes..."
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  temaOperador === 'claro' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Sección: Citas Bíblicas */}
        <div className={`p-3 rounded-xl border space-y-2.5 ${
          temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              CITAS BÍBLICAS DEL SERMÓN ({bosquejoActual.citasBiblicas.length})
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {bosquejoActual.citasBiblicas.map((cita, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30"
              >
                <span>{cita}</span>
                <button
                  onClick={() => eliminarCita(idx)}
                  className="hover:text-rose-400 ml-1 cursor-pointer"
                  title="Eliminar cita"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={nuevaCitaInput}
              onChange={(e) => setNuevaCitaInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') agregarCita(); }}
              placeholder="Ej: Filipenses 4:6-7, Juan 3:16..."
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs border outline-none ${
                temaOperador === 'claro' ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
            <button
              onClick={agregarCita}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          </div>
        </div>

        {/* Sección: Puntos a Tratar en el Bosquejo */}
        <div className={`p-3 rounded-xl border space-y-2.5 flex-1 flex flex-col ${
          temaOperador === 'claro' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
              <ScrollText className="w-3.5 h-3.5" />
              PUNTOS DEL BOSQUEJO ({bosquejoActual.puntos.length})
            </span>
            <span className="text-[10px] text-slate-400">Reordena o agrega nuevos puntos</span>
          </div>

          <div className="space-y-1.5 flex-1 overflow-y-auto max-h-48 pr-1">
            {bosquejoActual.puntos.map((punto, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition ${
                  puntoProyectadoIdx === idx
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow ring-1 ring-amber-400'
                    : temaOperador === 'claro'
                    ? 'bg-white border-slate-300 text-slate-800'
                    : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}
              >
                <span className="flex-1 font-medium">{punto}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moverPunto(idx, 'arriba')}
                    disabled={idx === 0}
                    className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                    title="Subir posición"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => moverPunto(idx, 'abajo')}
                    disabled={idx === bosquejoActual.puntos.length - 1}
                    className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 cursor-pointer"
                    title="Bajar posición"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => eliminarPunto(idx)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 cursor-pointer"
                    title="Eliminar punto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={nuevoPuntoInput}
              onChange={(e) => setNuevoPuntoInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') agregarPunto(); }}
              placeholder="Escribe el siguiente punto del sermón..."
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs border outline-none ${
                temaOperador === 'claro' ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
            <button
              onClick={agregarPunto}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Punto</span>
            </button>
          </div>
        </div>

        {/* Conclusión Opcional */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 block mb-1">
            🏁 CONCLUSIÓN O MINISTRACIÓN (OPCIONAL):
          </label>
          <textarea
            rows={2}
            value={bosquejoActual.conclusion || ''}
            onChange={(e) => actualizarBosquejoActual({ conclusion: e.target.value })}
            placeholder="Texto de cierre o llamado al altar..."
            className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none resize-none ${
              temaOperador === 'claro' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
            }`}
          />
        </div>

      </div>

      {/* Columna Derecha: Panel de Proyección en Vivo (6 cols) */}
      <div className={`xl:col-span-6 border rounded-2xl p-4 flex flex-col gap-3 shadow-xl overflow-y-auto ${
        temaOperador === 'claro' ? 'bg-white border-slate-300' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className={`border-b pb-3 flex items-center justify-between ${
          temaOperador === 'claro' ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div>
            <h3 className="font-black text-xs uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <span>🖥️ Botones de Proyección en Vivo</span>
            </h3>
            <p className="text-[10px] text-slate-400">Haz 1 solo clic en el botón que deseas mostrar en la pantalla gigante</p>
          </div>
        </div>

        {/* Botones de Proyección Rápida */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            onClick={proyectarPortadaPredica}
            className="p-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center justify-between shadow-lg transition cursor-pointer"
          >
            <div className="text-left">
              <span className="block font-black text-xs">👑 PORTADA DEL SERMÓN</span>
              <span className="text-[10px] font-medium opacity-90 truncate block max-w-[180px]">
                {bosquejoActual.titulo}
              </span>
            </div>
            <Play className="w-4 h-4 fill-slate-950 flex-shrink-0" />
          </button>

          <button
            onClick={proyectarCitasBiblicas}
            className="p-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-xs flex items-center justify-between shadow-lg transition cursor-pointer"
          >
            <div className="text-left">
              <span className="block font-black text-xs">📖 CITAS BÍBLICAS</span>
              <span className="text-[10px] font-normal opacity-90 truncate block max-w-[180px]">
                {bosquejoActual.citasBiblicas.join(', ') || 'Sin citas'}
              </span>
            </div>
            <Play className="w-4 h-4 fill-white flex-shrink-0" />
          </button>

          <button
            onClick={proyectarResumenPuntos}
            className="p-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-black text-xs flex items-center justify-between shadow-lg transition cursor-pointer"
          >
            <div className="text-left">
              <span className="block font-black text-xs">📋 RESUMEN DE PUNTOS</span>
              <span className="text-[10px] font-normal opacity-90">
                Mostrar los {bosquejoActual.puntos.length} puntos juntos
              </span>
            </div>
            <Play className="w-4 h-4 fill-white flex-shrink-0" />
          </button>

          {bosquejoActual.conclusion && (
            <button
              onClick={proyectarConclusion}
              className="p-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-black text-xs flex items-center justify-between shadow-lg transition cursor-pointer"
            >
              <div className="text-left">
                <span className="block font-black text-xs">🏁 CONCLUSIÓN / LLAMADO</span>
                <span className="text-[10px] font-normal opacity-90 truncate block max-w-[180px]">
                  Ministración final
                </span>
              </div>
              <Play className="w-4 h-4 fill-white flex-shrink-0" />
            </button>
          )}
        </div>

        {/* Tarjetas Individuales para cada Punto del Sermón */}
        <div className="space-y-2 pt-2 flex-1 overflow-y-auto">
          <span className="text-[11px] font-bold text-slate-400 block">
            ▶ PROYECCIÓN PUNTO POR PUNTO (Mientras el pastor expone):
          </span>

          {bosquejoActual.puntos.map((punto, idx) => {
            const esActivo = puntoProyectadoIdx === idx;
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                  esActivo
                    ? 'bg-amber-500/20 border-amber-400 shadow-lg ring-2 ring-amber-400/60'
                    : temaOperador === 'claro'
                    ? 'bg-slate-50 border-slate-300 hover:bg-slate-100'
                    : 'bg-slate-950/70 border-slate-800 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                      Punto {idx + 1}
                    </span>
                    {esActivo && (
                      <span className="text-[10px] font-bold text-amber-400 animate-pulse">
                        ● EN PANTALLA
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold leading-snug">
                    {punto}
                  </p>
                </div>

                <button
                  onClick={() => proyectarPuntoIndividual(punto, idx)}
                  className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow cursor-pointer ${
                    esActivo
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  <Play className={`w-3.5 h-3.5 ${esActivo ? 'fill-slate-950' : 'fill-white'}`} />
                  <span>{esActivo ? 'En Pantalla' : 'Proyectar'}</span>
                </button>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
