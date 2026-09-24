-- Original-source-language excerpt (JSON array of strings; NULL when absent),
-- the counterpart to `excerpt`. Synced from `excerptOrig` in local-media.ts.
ALTER TABLE reccs ADD COLUMN excerpt_orig TEXT;
