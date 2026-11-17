export interface BackgroundPreset {
  id: string;
  nombre: string;
  categoria: 'adoracion' | 'animado' | 'biblia' | 'luces' | 'textura';
  url: string;
  cssBackground?: string;
  tipo?: 'estatico' | 'anim' | 'video';
  esSubido?: boolean;
}

export const FONDOS_PREDETERMINADOS: BackgroundPreset[] = [

  // Fondos Degradados Litúrgicos Conservados
  {
    id: 'fondo-degradado-pizarra',
    nombre: 'Pizarra Negra Cine (Sobrio)',
    categoria: 'textura',
    url: '',
    cssBackground: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
    tipo: 'estatico'
  },
  {
    id: 'fondo-degradado-amanecer',
    nombre: 'Amanecer Dorado Cuadrangular',
    categoria: 'adoracion',
    url: '',
    cssBackground: 'radial-gradient(circle at 50% 30%, #854d0e 0%, #1c1917 70%, #09090b 100%)',
    tipo: 'estatico'
  },
  {
    id: 'fondo-degradado-esmeralda',
    nombre: 'Resplandor Esmeralda',
    categoria: 'luces',
    url: '',
    cssBackground: 'linear-gradient(135deg, #064e3b 0%, #022c22 50%, #020617 100%)',
    tipo: 'estatico'
  },
  {
    id: 'fondo-degradado-purpura',
    nombre: 'Púrpura Real y Majestad',
    categoria: 'adoracion',
    url: '',
    cssBackground: 'linear-gradient(135deg, #3b0764 0%, #1e1b4b 50%, #020617 100%)',
    tipo: 'estatico'
  },
  {
    id: 'fondo-degradado-altar',
    nombre: 'Luz Cálida de Altar',
    categoria: 'luces',
    url: '',
    cssBackground: 'radial-gradient(ellipse at center, #78350f 0%, #291102 60%, #030712 100%)',
    tipo: 'estatico'
  },
  {
    id: 'fondo-degradado-azul',
    nombre: 'Azul Noche Celestial',
    categoria: 'adoracion',
    url: '',
    cssBackground: 'radial-gradient(ellipse at top, #1e3a8a 0%, #0f172a 60%, #020617 100%)',
    tipo: 'estatico'
  }
];
