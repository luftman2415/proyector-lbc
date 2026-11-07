/**
 * Diapositivas e imágenes oficiales de la Iglesia Cristiana Cuadrangular Las Brisas
 * Ubicación fija para reemplazo cada 6 meses: public/assets/momentos/
 * Creado por: LuftmandMauricio
 */

export interface SlideItem {
  id: string;
  titulo: string;
  categoria: 'bienvenida' | 'evento' | 'ministerio' | 'culto';
  fecha?: string;
  dataUrl: string;
  esPredeterminado?: boolean;
}

export const DIAPOSITIVAS_INICIALES: SlideItem[] = [
  {
    id: 'momento-bienvenidos',
    titulo: '¡Bienvenidos! Nos Alegra Verte',
    categoria: 'bienvenida',
    fecha: 'Inicio de Culto',
    dataUrl: 'assets/momentos/01_bienvenidos.png',
    esPredeterminado: true
  },
  {
    id: 'momento-adoracion',
    titulo: 'Es Tiempo de Adorar',
    categoria: 'culto',
    fecha: 'Alabanza y Adoración',
    dataUrl: 'assets/momentos/02_adoracion.png',
    esPredeterminado: true
  },
  {
    id: 'momento-oracion',
    titulo: 'Es Tiempo de Orar, Clamar, Interceder',
    categoria: 'culto',
    fecha: 'Intercesión',
    dataUrl: 'assets/momentos/03_oracion.png',
    esPredeterminado: true
  },
  {
    id: 'momento-canciones',
    titulo: 'Fondo para Letras de Adoración',
    categoria: 'culto',
    fecha: 'Cancionero',
    dataUrl: 'assets/momentos/04_canciones.png',
    esPredeterminado: true
  },
  {
    id: 'momento-testimonios',
    titulo: 'Tiempo de Testimonios de Poder',
    categoria: 'culto',
    fecha: 'Edificación',
    dataUrl: 'assets/momentos/05_testimonios.png',
    esPredeterminado: true
  },
  {
    id: 'momento-diezmos',
    titulo: 'Diezmos y Ofrendas (Malaquías 3:10)',
    categoria: 'culto',
    fecha: 'Gratitud y Siembra',
    dataUrl: 'assets/momentos/06_diezmos.png',
    esPredeterminado: true
  },
  {
    id: 'momento-santa-cena',
    titulo: 'Santa Cena "En Memoria de Mí" (Lucas 22:19)',
    categoria: 'culto',
    fecha: 'Comunión',
    dataUrl: 'assets/momentos/07_santa_cena.png',
    esPredeterminado: true
  },
  {
    id: 'momento-servicios',
    titulo: 'Servicios Semanales y Horarios',
    categoria: 'evento',
    fecha: 'Anuncios',
    dataUrl: 'assets/momentos/08_servicios.png',
    esPredeterminado: true
  },
  {
    id: 'momento-visitas',
    titulo: '¿Primera Vez? ¡Esta es tu Casa!',
    categoria: 'bienvenida',
    fecha: 'Nuevos Creyentes',
    dataUrl: 'assets/momentos/09_visitas.png',
    esPredeterminado: true
  },
  {
    id: 'momento-despedida',
    titulo: 'Gracias, ¡Nos Vemos Pronto!',
    categoria: 'bienvenida',
    fecha: 'Cierre de Culto',
    dataUrl: 'assets/momentos/10_despedida.png',
    esPredeterminado: true
  }
];
