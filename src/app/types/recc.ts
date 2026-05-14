export type Recc = {
  id: string;
  title: { original: string; transliteration?: string; translation?: string };
  author?: string;
  intermediary?: string;
  century?: number | null;
  year?: number;
  runtime?: number;
  color?: string;
  coordinates?: { name: string; x: number; y: number };
  trailer?: string;
  playlistURL?: string;
  group: {
    people?: string;
    language: string;
    country?: string;
    location?: string;
    religion?: string;
  };
  info: string[];
  excerpt?: string[];
  mediaURL?: string[];
  watch?: string[];
  genre?: string[];
  tags?: string[];
  ref?: Array<Record<string, unknown>>;
  meta?: Record<string, unknown>;
};
