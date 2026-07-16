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

// Slim projections for list views. A full Recc averages ~5.6KB (info paragraphs,
// excerpts, citations with notes); serializing whole arrays of them into the
// home/collections/regions/search payloads is what made those documents ~1.26MB
// and their SSR renders heavy enough to trip Worker resource limits (error 1102).
// List views only render poster + title, so they get ReccLite; the search page
// additionally needs the client-searchable text fields, so it gets ReccSearch.
// The detail page ([mediaID]) still receives one full Recc — that's fine.

// id + title parts — everything getTitle() needs (meta pruned to the
// title-affecting keys: work / anthology / piece).
export type ReccLite = {
  id: string;
  title: Recc["title"];
  meta?: Record<string, unknown>;
};

// ReccLite + the fields functions/search.ts matches on and filters group by.
export type ReccSearch = ReccLite &
  Pick<Recc, "author" | "intermediary" | "group" | "info" | "excerpt" | "tags" | "genre">;
