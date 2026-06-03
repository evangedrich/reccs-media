CREATE TABLE reccs (
  id TEXT PRIMARY KEY,

  -- title
  title_original         TEXT NOT NULL,
  title_transliteration  TEXT,
  title_translation      TEXT,

  -- attribution
  author        TEXT,
  intermediary  TEXT,
  century       INTEGER,
  year          INTEGER,

  -- presentation
  color         TEXT,
  coord_name    TEXT,
  coord_lng     REAL,
  coord_lat     REAL,

  -- film-only
  runtime       INTEGER,
  trailer_url   TEXT,

  -- group
  group_people    TEXT,
  group_language  TEXT NOT NULL,
  group_country   TEXT,
  group_location  TEXT,
  group_religion  TEXT,

  -- content / media (JSON arrays of strings unless noted; NULL when empty)
  info          TEXT NOT NULL,
  excerpt       TEXT,
  media_urls    TEXT,
  watch_urls    TEXT,
  playlist_url  TEXT,
  genre         TEXT,
  tags          TEXT,

  -- citations + meta (JSON blobs, NULL when absent)
  refs          TEXT,
  meta          TEXT
);
