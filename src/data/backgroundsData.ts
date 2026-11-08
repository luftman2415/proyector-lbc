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
  // 14 Imágenes Litúrgicas Predeterminadas de la Iglesia
  {
    id: 'fondo-img-1',
    nombre: 'Fondo 1: Cielo y Nubes Celestiales',
    categoria: 'adoracion',
    url: '/fondos/fondo_1.jpg',
    tipo: 'estatico'
  },
  {
    id: 'fondo-img-2',
    nombre: 'Fondo 2: Atardecer Dorado y Río de Gloria',
    categoria: 'adoracion',
    url: '/fondos/fondo_2.jpg',
    tipo: 'estatico'
  },
  {
    id: 'fondo-img-3',
    nombre: 'Fondo 3: Nubes Suaves de Paz',
    categoria: 'adoracion',
    url: '/fondos/fondo_3.jpg',
    tipo: 'estatico'
  },
  {
    id: 'fondo-img-4',
    nombre: 'Fondo 4: Cielo Rosado de Alabanza',
    categoria: 'adoracion',
    url: '/fondos/fondo_4.jpg',
    tipo: 'estatico'
  },
  {
    id: 'fondo-img-6',
    nombre: 'Fondo 6: Margarita y Cielo de Esperanza',
    categoria: 'adoracion',
    url: '/fondos/fondo_6.jpg',
    tipo: 'estatico'
  },
  {
    id: 'fondo-img-7',
    nombre: 'Fondo 7: Campos Dorados de Cosecha',
    categoria: 'adoracion',
    url: '/fondos/fondo_7.jpg',
    tipo: 'estatico'
  },
  {
    id: 'fondo-img-8',
    nombre: 'Fondo 8: Rayo Celestial en las Montañas',
    categoria: 'adoracion',
    url: '/fondos/fondo_8.jpg',
    tipo: 'estatico'
  },
  {
    id: 'fondo-img-9',
    nombre: 'Fondo 9: Gaviota en Vuelo Celestial',
    categoria: 'adoracion',
    url: '/fondos/fondo_9.jpg',
    tipo: 'estatico'
  },
  {
    id: 'fondo-img-10',
    nombre: 'Fondo 10: Biblia Abierta con Destellos de Fuego',
    categoria: 'biblia',
    url: '/fondos/fondo_10.jpg',
    tipo: 'estatico'
  },
  {
    id: 'fondo-img-11',
    nombre: 'Fondo 11: Biblia Abierta bajo Luz Divina',
    categoria: 'biblia',
    url: '/fondos/fondo_11.jpg',
    tipo: 'estatico'
  },
  {
    id: 'fondo-img-12',
    nombre: 'Fondo 12: Biblia sobre Aguas de Reposo',
    categoria: 'biblia',
    url: '/fondos/fondo_12.jpg',
    tipo: 'estatico'
  },
  {
    id: 'fondo-img-13',
    nombre: 'Fondo 13: Biblia Abierta al Atardecer',
    categoria: 'biblia',
    url: '/fondos/fondo_13.jpg',
    tipo: 'estatico'
  },
  {
    id: 'fondo-img-14',
    nombre: 'Fondo 14: Sagradas Escrituras en Altar',
    categoria: 'biblia',
    url: '/fondos/fondo_14.jpg',
    tipo: 'estatico'
  },

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
