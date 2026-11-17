/**
 * Diapositivas e imágenes oficiales de la Iglesia Cristiana Cuadrangular Las Brisas
 * Ubicación de carpetas de imágenes:
 * - Momentos del Culto: public/assets/momentos/ (01_bienvenidos.png ... 10_despedida.png)
 * - Galería de Paisajes y Fondos: public/assets/galeria/ (1.jpeg ... 14.jpeg o .jpg)
 * Creado por: LuftmandMauricio
 */

export interface SlideItem {
  id: string;
  titulo: string;
  categoria: 'bienvenida' | 'evento' | 'ministerio' | 'culto' | 'predeterminado';
  fecha?: string;
  dataUrl: string;
  esPredeterminado?: boolean;
}

// 1. Las 14 Fotografías Litúrgicas Predeterminadas (Ubicadas en public/assets/galeria/)
export const IMAGENES_PREDETERMINADAS_14: SlideItem[] = [
  {
    id: 'img-pred-1',
    titulo: '1. Cielo y Nubes Celestiales',
    categoria: 'predeterminado',
    fecha: '1.jpeg',
    dataUrl: './assets/galeria/1.jpeg',
    esPredeterminado: true
  },
  {
    id: 'img-pred-2',
    titulo: '2. Atardecer Dorado y Río de Gloria',
    categoria: 'predeterminado',
    fecha: '2.jpeg',
    dataUrl: './assets/galeria/2.jpeg',
    esPredeterminado: true
  },
  {
    id: 'img-pred-3',
    titulo: '3. Nubes Suaves de Paz',
    categoria: 'predeterminado',
    fecha: '3.jpeg',
    dataUrl: './assets/galeria/3.jpeg',
    esPredeterminado: true
  },
  {
    id: 'img-pred-4',
    titulo: '4. Cielo Rosado de Alabanza',
    categoria: 'predeterminado',
    fecha: '4.jpeg',
    dataUrl: './assets/galeria/4.jpeg',
    esPredeterminado: true
  },
  {
    id: 'img-pred-6',
    titulo: '6. Margarita y Cielo de Esperanza',
    categoria: 'predeterminado',
    fecha: '6.jpeg',
    dataUrl: './assets/galeria/6.jpeg',
    esPredeterminado: true
  },
  {
    id: 'img-pred-7',
    titulo: '7. Campos Dorados de Cosecha',
    categoria: 'predeterminado',
    fecha: '7.jpeg',
    dataUrl: './assets/galeria/7.jpeg',
    esPredeterminado: true
  },
  {
    id: 'img-pred-8',
    titulo: '8. Rayo Celestial en las Montañas',
    categoria: 'predeterminado',
    fecha: '8.jpeg',
    dataUrl: './assets/galeria/8.jpeg',
    esPredeterminado: true
  },
  {
    id: 'img-pred-9',
    titulo: '9. Gaviota en Vuelo Celestial',
    categoria: 'predeterminado',
    fecha: '9.jpeg',
    dataUrl: './assets/galeria/9.jpeg',
    esPredeterminado: true
  },
  {
    id: 'img-pred-10',
    titulo: '10. Biblia Abierta con Destellos de Fuego',
    categoria: 'predeterminado',
    fecha: '10.jpeg',
    dataUrl: './assets/galeria/10.jpeg',
    esPredeterminado: true
  },
  {
    id: 'img-pred-11',
    titulo: '11. Biblia Abierta bajo Luz Divina',
    categoria: 'predeterminado',
    fecha: '11.jpeg',
    dataUrl: './assets/galeria/11.jpeg',
    esPredeterminado: true
  },
  {
    id: 'img-pred-12',
    titulo: '12. Biblia sobre Aguas de Reposo',
    categoria: 'predeterminado',
    fecha: '12.jpeg',
    dataUrl: './assets/galeria/12.jpeg',
    esPredeterminado: true
  },
  {
    id: 'img-pred-13',
    titulo: '13. Biblia Abierta al Atardecer',
    categoria: 'predeterminado',
    fecha: '13.jpeg',
    dataUrl: './assets/galeria/13.jpeg',
    esPredeterminado: true
  },
  {
    id: 'img-pred-14',
    titulo: '14. Sagradas Escrituras en Altar',
    categoria: 'predeterminado',
    fecha: '14.jpeg',
    dataUrl: './assets/galeria/14.jpeg',
    esPredeterminado: true
  }
];

// 2. Diapositivas Oficiales de Momentos del Culto de la Iglesia (Ubicadas en public/assets/momentos/)
export const DIAPOSITIVAS_MOMENTOS_IGLESIA: SlideItem[] = [
  {
    id: 'momento-bienvenidos',
    titulo: '¡Bienvenidos! Nos Alegra Verte',
    categoria: 'bienvenida',
    fecha: 'Inicio de Culto',
    dataUrl: './assets/momentos/01_bienvenidos.png',
    esPredeterminado: true
  },
  {
    id: 'momento-adoracion',
    titulo: 'Es Tiempo de Adorar',
    categoria: 'culto',
    fecha: 'Alabanza y Adoración',
    dataUrl: './assets/momentos/02_adoracion.png',
    esPredeterminado: true
  },
  {
    id: 'momento-oracion',
    titulo: 'Es Tiempo de Orar, Clamar, Interceder',
    categoria: 'culto',
    fecha: 'Intercesión',
    dataUrl: './assets/momentos/03_oracion.png',
    esPredeterminado: true
  },
  {
    id: 'momento-canciones',
    titulo: 'Fondo para Letras de Adoración',
    categoria: 'culto',
    fecha: 'Cancionero',
    dataUrl: './assets/momentos/04_canciones.png',
    esPredeterminado: true
  },
  {
    id: 'momento-testimonios',
    titulo: 'Tiempo de Testimonios de Poder',
    categoria: 'culto',
    fecha: 'Edificación',
    dataUrl: './assets/momentos/05_testimonios.png',
    esPredeterminado: true
  },
  {
    id: 'momento-diezmos',
    titulo: 'Diezmos y Ofrendas (Malaquías 3:10)',
    categoria: 'culto',
    fecha: 'Gratitud y Siembra',
    dataUrl: './assets/momentos/06_diezmos.png',
    esPredeterminado: true
  },
  {
    id: 'momento-santa-cena',
    titulo: 'Santa Cena "En Memoria de Mí" (Lucas 22:19)',
    categoria: 'culto',
    fecha: 'Comunión',
    dataUrl: './assets/momentos/07_santa_cena.png',
    esPredeterminado: true
  },
  {
    id: 'momento-servicios',
    titulo: 'Servicios Semanales y Horarios',
    categoria: 'evento',
    fecha: 'Anuncios',
    dataUrl: './assets/momentos/08_servicios.png',
    esPredeterminado: true
  },
  {
    id: 'momento-visitas',
    titulo: '¿Primera Vez? ¡Esta es tu Casa!',
    categoria: 'bienvenida',
    fecha: 'Nuevos Creyentes',
    dataUrl: './assets/momentos/09_visitas.png',
    esPredeterminado: true
  },
  {
    id: 'momento-despedida',
    titulo: 'Gracias, ¡Nos Vemos Pronto!',
    categoria: 'bienvenida',
    fecha: 'Cierre de Culto',
    dataUrl: './assets/momentos/10_despedida.png',
    esPredeterminado: true
  }
];

export const DIAPOSITIVAS_INICIALES: SlideItem[] = [
  ...IMAGENES_PREDETERMINADAS_14,
  ...DIAPOSITIVAS_MOMENTOS_IGLESIA
];

export function obtenerFallbackArteSVG(id: string, titulo: string): string {
  return '';
}
