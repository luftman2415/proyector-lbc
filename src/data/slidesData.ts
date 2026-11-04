/**
 * Diapositivas e imágenes preestablecidas para la Iglesia Cristiana Cuadrangular Las Brisas
 * Diseñadas para proyectar avisos, bienvenida y eventos ministeriales (Canva).
 */

export interface SlideItem {
  id: string;
  titulo: string;
  categoria: 'bienvenida' | 'evento' | 'ministerio' | 'culto';
  fecha?: string;
  dataUrl: string;
  esPredeterminado?: boolean;
}

// Banners SVG vectoriales de alta fidelidad preinstalados (100% offline)
const BANNER_BIENVENIDA = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="60%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)" />
  <circle cx="960" cy="540" r="480" fill="none" stroke="rgba(251,191,36,0.15)" stroke-width="2" />
  <circle cx="960" cy="540" r="420" fill="none" stroke="rgba(251,191,36,0.08)" stroke-width="1" />
  
  <!-- Cuadrangular 4 dots -->
  <g transform="translate(960, 260)">
    <rect x="-80" y="-80" width="75" height="75" rx="14" fill="#dc2626" />
    <text x="-42" y="-30" fill="#ffffff" font-size="44" font-family="'Segoe UI', sans-serif" font-weight="900" text-anchor="middle">✝</text>
    <rect x="5" y="-80" width="75" height="75" rx="14" fill="#2563eb" />
    <text x="42" y="-28" fill="#ffffff" font-size="40" font-family="'Segoe UI', sans-serif" font-weight="900" text-anchor="middle">🏆</text>
    <rect x="-80" y="5" width="75" height="75" rx="14" fill="#d97706" />
    <text x="-42" y="58" fill="#ffffff" font-size="40" font-family="'Segoe UI', sans-serif" font-weight="900" text-anchor="middle">🕊</text>
    <rect x="5" y="5" width="75" height="75" rx="14" fill="#7c3aed" />
    <text x="42" y="58" fill="#ffffff" font-size="40" font-family="'Segoe UI', sans-serif" font-weight="900" text-anchor="middle">👑</text>
  </g>
  
  <text x="960" y="490" fill="url(#gold)" font-size="76" font-family="'Segoe UI', sans-serif" font-weight="900" letter-spacing="4" text-anchor="middle">
    ¡BIENVENIDOS!
  </text>
  <text x="960" y="560" fill="#ffffff" font-size="42" font-family="'Segoe UI', sans-serif" font-weight="800" text-anchor="middle">
    IGLESIA CRISTIANA CUADRANGULAR
  </text>
  <text x="960" y="620" fill="#fbbf24" font-size="28" font-family="'Segoe UI', sans-serif" font-weight="700" text-anchor="middle">
    Barrio Las Brisas • Casa de Adoración y Avivamiento
  </text>
  <text x="960" y="740" fill="#94a3b8" font-size="24" font-family="'Segoe UI', sans-serif" font-style="italic" text-anchor="middle">
    "Yo me alegré con los que me decían: A la casa de Jehová iremos." — Salmos 122:1
  </text>
</svg>
`)}`;

const BANNER_CULTO_NINOS = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="bg_kids" cx="50%" cy="50%" r="80%">
      <stop offset="0%" stop-color="#14532d" />
      <stop offset="60%" stop-color="#064e3b" />
      <stop offset="100%" stop-color="#022c22" />
    </radialGradient>
    <linearGradient id="bright_yellow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg_kids)" />
  <circle cx="960" cy="540" r="500" fill="none" stroke="rgba(254,240,138,0.2)" stroke-width="3" stroke-dasharray="16 12" />
  
  <text x="960" y="320" fill="#86efac" font-size="34" font-family="'Segoe UI', sans-serif" font-weight="800" letter-spacing="4" text-anchor="middle">
    MINISTERIO INFANTIL CUADRANGULAR
  </text>
  <text x="960" y="440" fill="url(#bright_yellow)" font-size="82" font-family="'Segoe UI', sans-serif" font-weight="900" letter-spacing="2" text-anchor="middle">
    🌟 CULTO ESPECIAL DE NIÑOS 🌟
  </text>
  <text x="960" y="540" fill="#ffffff" font-size="52" font-family="'Segoe UI', sans-serif" font-weight="800" text-anchor="middle">
    ¡CELEBRAMOS LA LUZ Y LA VIDA DE JESÚS!
  </text>
  <text x="960" y="630" fill="#fde047" font-size="30" font-family="'Segoe UI', sans-serif" font-weight="700" text-anchor="middle">
    Una Fiesta Celestial para Alabar a Nuestro Dios
  </text>
  
  <rect x="660" y="700" width="600" height="90" rx="45" fill="rgba(255,255,255,0.15)" stroke="#86efac" stroke-width="2" />
  <text x="960" y="756" fill="#ffffff" font-size="28" font-family="'Segoe UI', sans-serif" font-weight="800" text-anchor="middle">
    "Dejad a los niños venir a mí, y no se lo impidáis" — Mateo 19:14
  </text>
</svg>
`)}`;

const BANNER_SANTA_CENA = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="bg_communion" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#450a0a" />
      <stop offset="70%" stop-color="#180404" />
      <stop offset="100%" stop-color="#090101" />
    </radialGradient>
    <linearGradient id="gold_communion" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg_communion)" />
  <text x="960" y="360" fill="url(#gold_communion)" font-size="80" font-family="'Georgia', serif" font-weight="900" letter-spacing="3" text-anchor="middle">
    SANTA CENA DEL SEÑOR
  </text>
  <text x="960" y="470" fill="#fecaca" font-size="36" font-family="'Segoe UI', sans-serif" font-weight="700" letter-spacing="2" text-anchor="middle">
    EN MEMORIA DEL SACRIFICIO DE CRISTO EN LA CRUZ
  </text>
  <text x="960" y="600" fill="#ffffff" font-size="32" font-family="'Georgia', serif" font-style="italic" text-anchor="middle">
    "Haced esto todas las veces que la bebiereis, en memoria de mí."
  </text>
  <text x="960" y="670" fill="#fde047" font-size="26" font-family="'Segoe UI', sans-serif" font-weight="800" text-anchor="middle">
    — 1 Corintios 11:25
  </text>
</svg>
`)}`;

const BANNER_DIEZMOS = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="bg_offering" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="70%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg_offering)" />
  <text x="960" y="380" fill="#38bdf8" font-size="32" font-family="'Segoe UI', sans-serif" font-weight="800" letter-spacing="3" text-anchor="middle">
    HONRANDO A DIOS CON GRATITUD
  </text>
  <text x="960" y="480" fill="#fbbf24" font-size="74" font-family="'Segoe UI', sans-serif" font-weight="900" letter-spacing="2" text-anchor="middle">
    DIEZMOS Y OFRENDAS
  </text>
  <text x="960" y="610" fill="#ffffff" font-size="30" font-family="'Segoe UI', sans-serif" font-weight="600" text-anchor="middle">
    "Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad,"
  </text>
  <text x="960" y="670" fill="#fde047" font-size="32" font-family="'Segoe UI', sans-serif" font-weight="800" text-anchor="middle">
    "porque Dios ama al dador alegre." — 2 Corintios 9:7
  </text>
</svg>
`)}`;

export const DIAPOSITIVAS_INICIALES: SlideItem[] = [
  {
    id: 'slide-bienvenida',
    titulo: 'Bienvenida Iglesia Cuadrangular',
    categoria: 'bienvenida',
    fecha: 'Fijo',
    dataUrl: BANNER_BIENVENIDA,
    esPredeterminado: true
  },
  {
    id: 'slide-ninos',
    titulo: 'Culto Especial de Niños (Fiesta de Luz)',
    categoria: 'ministerio',
    fecha: 'Ministerio Infantil',
    dataUrl: BANNER_CULTO_NINOS,
    esPredeterminado: true
  },
  {
    id: 'slide-santa-cena',
    titulo: 'Santa Cena del Señor',
    categoria: 'culto',
    fecha: 'Culto Especial',
    dataUrl: BANNER_SANTA_CENA,
    esPredeterminado: true
  },
  {
    id: 'slide-diezmos',
    titulo: 'Diezmos y Ofrendas (Dador Alegre)',
    categoria: 'culto',
    fecha: 'Gratitud',
    dataUrl: BANNER_DIEZMOS,
    esPredeterminado: true
  }
];
