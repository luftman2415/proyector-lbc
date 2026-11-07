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
  // Fondos Oficiales de la Iglesia Cuadrangular Las Brisas
  {
    id: 'fondo-icc-canciones',
    nombre: 'Fondo Oficial Alabanza ICC Las Brisas',
    categoria: 'adoracion',
    url: 'assets/momentos/04_canciones.png',
    tipo: 'estatico'
  },
  {
    id: 'fondo-icc-adoracion',
    nombre: 'Fondo Oficial Adoración ICC Las Brisas',
    categoria: 'adoracion',
    url: 'assets/momentos/02_adoracion.png',
    tipo: 'estatico'
  },
  {
    id: 'fondo-icc-4simbolos',
    nombre: 'Emblema 4 Símbolos Cuadrangular',
    categoria: 'adoracion',
    url: 'assets/logo_cuadrangular_4simbolos.png',
    tipo: 'estatico'
  },

  // Fondos Animados Litúrgicos
  {
    id: 'anim-cielo',
    nombre: 'Cielo Celestial Dinámico',
    categoria: 'animado',
    url: '',
    cssBackground: 'anim-cielo',
    tipo: 'anim'
  },
  {
    id: 'anim-rayos-dorados',
    nombre: 'Rayos Dorados de Adoración',
    categoria: 'animado',
    url: '',
    cssBackground: 'anim-rayos-dorados',
    tipo: 'anim'
  },
  {
    id: 'anim-cruz-halo',
    nombre: 'Halo Cuadrangular Pulsante',
    categoria: 'animado',
    url: '',
    cssBackground: 'anim-cruz-halo',
    tipo: 'anim'
  },
  {
    id: 'anim-amanecer',
    nombre: 'Resplandor de Altar y Gloria',
    categoria: 'animado',
    url: '',
    cssBackground: 'anim-amanecer',
    tipo: 'anim'
  },

  // Fondos Estáticos Litúrgicos
  {
    id: 'fondo-1',
    nombre: 'Azul Noche Celestial',
    categoria: 'adoracion',
    url: '',
    cssBackground: 'radial-gradient(ellipse at top, #1e3a8a 0%, #0f172a 60%, #020617 100%)',
    tipo: 'estatico'
  },
  {
    id: 'fondo-2',
    nombre: 'Luz Cálida de Altar',
    categoria: 'luces',
    url: '',
    cssBackground: 'radial-gradient(ellipse at center, #78350f 0%, #291102 60%, #030712 100%)',
    tipo: 'estatico'
  },
  {
    id: 'fondo-3',
    nombre: 'Púrpura Real y Majestad',
    categoria: 'adoracion',
    url: '',
    cssBackground: 'linear-gradient(135deg, #3b0764 0%, #1e1b4b 50%, #020617 100%)',
    tipo: 'estatico'
  },
  {
    id: 'fondo-4',
    nombre: 'Resplandor Esmeralda',
    categoria: 'luces',
    url: '',
    cssBackground: 'linear-gradient(135deg, #064e3b 0%, #022c22 50%, #020617 100%)',
    tipo: 'estatico'
  },
  {
    id: 'fondo-5',
    nombre: 'Amanecer Dorado Cuadrangular',
    categoria: 'adoracion',
    url: '',
    cssBackground: 'radial-gradient(circle at 50% 30%, #854d0e 0%, #1c1917 70%, #09090b 100%)',
    tipo: 'estatico'
  },
  {
    id: 'fondo-6',
    nombre: 'Pizarra Negra Cine (Sobrio)',
    categoria: 'textura',
    url: '',
    cssBackground: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
    tipo: 'estatico'
  }
];
