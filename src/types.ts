export interface SongSection {
  type: 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'intro' | 'outro';
  label: string;
  color?: string;
  lines: string[];
}

export interface Song {
  id: string;
  numero?: number;
  title: string;
  author: string;
  key?: string;
  tempo?: number;
  tags?: string[];
  sections: SongSection[];
}

export interface SetlistsState {
  general: Song[];
  miercoles: Song[];
  sabado: Song[];
  domingo: Song[];
  [key: string]: Song[];
}

export interface KaraokeItem {
  id: string;
  songId: string;
  songTitle: string;
  song: Song;
  pistaUrl?: string;
  pistaNombre?: string;
}

export interface KaraokeSetlistsState {
  domingo: KaraokeItem[];
  miercoles: KaraokeItem[];
  sabado: KaraokeItem[];
  general: KaraokeItem[];
  [key: string]: KaraokeItem[];
}

export interface BosquejoPredica {
  id: string;
  titulo: string;
  predicador: string;
  fechaCulto: string;
  citasBiblicas: string[];
  puntos: string[];
  conclusion?: string;
}

export interface ProjectedContent {
  id: string;
  tipo: 'cancion' | 'biblia' | 'texto' | 'diapositiva' | 'imagen' | 'video' | 'predica';
  texto: string;
  pie?: string;
  titulo?: string;
  url?: string;
  seccionActual?: string;
  seccionIndex?: number;
  totalSecciones?: number;
}
