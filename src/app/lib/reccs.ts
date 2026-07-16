import { unstable_cache } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Recc, ReccLite, ReccSearch } from "../types/recc";

type Row = {
  id: string;
  title_original: string;
  title_transliteration: string | null;
  title_translation: string | null;
  author: string | null;
  intermediary: string | null;
  century: number | null;
  year: number | null;
  runtime: number | null;
  color: string | null;
  coord_name: string | null;
  coord_lng: number | null;
  coord_lat: number | null;
  trailer_url: string | null;
  group_people: string | null;
  group_language: string;
  group_country: string | null;
  group_location: string | null;
  group_religion: string | null;
  info: string;
  excerpt: string | null;
  media_urls: string | null;
  watch_urls: string | null;
  playlist_url: string | null;
  genre: string | null;
  tags: string | null;
  refs: string | null;
  meta: string | null;
};

const parseJson = <T,>(s: string | null): T | undefined =>
  s == null ? undefined : (JSON.parse(s) as T);

function rowToRecc(row: Row): Recc {
  const group: Recc["group"] = { language: row.group_language };
  if (row.group_people) group.people = row.group_people;
  if (row.group_religion) group.religion = row.group_religion;
  if (row.group_country) group.country = row.group_country;
  if (row.group_location) group.location = row.group_location;

  const title: Recc["title"] = { original: row.title_original };
  if (row.title_transliteration) title.transliteration = row.title_transliteration;
  if (row.title_translation) title.translation = row.title_translation;

  const recc: Recc = {
    id: row.id,
    title,
    group,
    info: JSON.parse(row.info) as string[],
  };

  if (row.author) recc.author = row.author;
  if (row.intermediary) recc.intermediary = row.intermediary;
  if (row.century !== null) recc.century = row.century;
  if (row.year !== null) recc.year = row.year;
  if (row.runtime !== null) recc.runtime = row.runtime;
  if (row.color) recc.color = row.color;
  if (row.coord_name && row.coord_lng !== null && row.coord_lat !== null) {
    recc.coordinates = { name: row.coord_name, x: row.coord_lng, y: row.coord_lat };
  }
  if (row.trailer_url) recc.trailer = row.trailer_url;
  if (row.playlist_url) recc.playlistURL = row.playlist_url;

  const excerpt = parseJson<string[]>(row.excerpt);
  if (excerpt) recc.excerpt = excerpt;
  const mediaURL = parseJson<string[]>(row.media_urls);
  if (mediaURL) recc.mediaURL = mediaURL;
  const watch = parseJson<string[]>(row.watch_urls);
  if (watch) recc.watch = watch;
  const genre = parseJson<string[]>(row.genre);
  if (genre) recc.genre = genre;
  const tags = parseJson<string[]>(row.tags);
  if (tags) recc.tags = tags;
  const ref = parseJson<Array<Record<string, unknown>>>(row.refs);
  if (ref) recc.ref = ref;
  const meta = parseJson<Record<string, unknown>>(row.meta);
  if (meta) recc.meta = meta;

  return recc;
}

const getReccsFromD1 = unstable_cache(
  async (): Promise<Recc[]> => {
    const db = (await getCloudflareContext({ async: true })).env.DB;
    const { results } = await db.prepare("SELECT * FROM reccs").all<Row>();
    // const { results } = await db.prepare("SELECT * FROM reccs ORDER BY RANDOM()").all<Row>();
    return results.map(rowToRecc);
  },
  ["reccs"],
  { tags: ["reccs"] },
);

// In development, read directly from local-media.ts so edits show up instantly
// (no `pnpm sync` round-trip). Dynamic import keeps this file out of the prod bundle.
async function getReccsFromLocal(): Promise<Recc[]> {
  const { reccsData } = await import("./local-media");
  return reccsData as unknown as Recc[];
}

// To debug the production data path in dev, comment out lines 107-8 & uncomment:
  // export const getReccs: () => Promise<Recc[]> = getReccsFromD1;
export const getReccs: () => Promise<Recc[]> =
  process.env.NODE_ENV === "development" ? getReccsFromLocal : getReccsFromD1;

// Fetch a single entry by id. In production this is a targeted `WHERE id = ?`
// D1 query, cached per-id under the shared "reccs" tag — so a detail page parses
// one row instead of scanning and JSON-parsing the entire table on every request.
const getReccByIdFromD1 = unstable_cache(
  async (id: string): Promise<Recc | undefined> => {
    const db = (await getCloudflareContext({ async: true })).env.DB;
    const row = await db
      .prepare("SELECT * FROM reccs WHERE id = ?")
      .bind(id)
      .first<Row>();
    return row ? rowToRecc(row) : undefined;
  },
  ["reccById"],
  { tags: ["reccs"] },
);

// In development, mirror getReccs by resolving from local-media.
async function getReccByIdFromLocal(id: string): Promise<Recc | undefined> {
  return (await getReccsFromLocal()).find((r) => r.id === id);
}

export const getReccById: (id: string) => Promise<Recc | undefined> =
  process.env.NODE_ENV === "development" ? getReccByIdFromLocal : getReccByIdFromD1;

// Deterministic, seeded shuffle (mulberry32 PRNG + Fisher–Yates). The same
// `seed` always yields the same order, so navigating between collections on a
// CollectionShelf page doesn't visibly reshuffle on each `force-dynamic` refetch.
function seededShuffle<T>(arr: T[], seed: number): T[] {
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Reccs in a stable pseudo-random order for CollectionShelf pages. Default seed
// gives one fixed order; pass a changing seed (e.g. a day number) to reshuffle
// on a schedule without flickering as the user clicks between collections.
export const getShuffledReccs = async (seed = 1): Promise<Recc[]> =>
  seededShuffle(await getReccs(), seed);

// --- Slim projections (see types/recc.ts for why) -------------------------------
// List pages must never serialize full Recc arrays into their payloads: with ~180
// entries × ~5.6KB that's ~1MB per document AND per RSC prefetch, and the SSR
// serialization cost is what pushed the Worker into 1102s under concurrent loads.

// getTitle() reads meta.work / meta.anthology / meta.piece; everything else in
// meta (notes, grades, tags…) is detail-page material and gets dropped.
const TITLE_META_KEYS = ["work", "anthology", "piece"] as const;
const pruneTitleMeta = (meta?: Record<string, unknown>): Record<string, unknown> | undefined => {
  if (!meta) return undefined;
  let out: Record<string, unknown> | undefined;
  for (const k of TITLE_META_KEYS) {
    if (k in meta) (out ??= {})[k] = meta[k];
  }
  return out;
};

export const toLite = (r: Recc): ReccLite => {
  const lite: ReccLite = { id: r.id, title: r.title };
  const meta = pruneTitleMeta(r.meta);
  if (meta) lite.meta = meta;
  return lite;
};

export const toSearchEntry = (r: Recc): ReccSearch => {
  const s: ReccSearch = { ...toLite(r), group: r.group, info: r.info };
  if (r.author) s.author = r.author;
  if (r.intermediary) s.intermediary = r.intermediary;
  if (r.excerpt) s.excerpt = r.excerpt;
  if (r.tags) s.tags = r.tags;
  if (r.genre) s.genre = r.genre;
  return s;
};

export const getReccsLite = async (): Promise<ReccLite[]> => (await getReccs()).map(toLite);
export const getShuffledReccsLite = async (seed = 1): Promise<ReccLite[]> =>
  (await getShuffledReccs(seed)).map(toLite);
export const getShuffledReccsSearch = async (seed = 1): Promise<ReccSearch[]> =>
  (await getShuffledReccs(seed)).map(toSearchEntry);
