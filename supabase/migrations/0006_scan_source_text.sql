-- Persist the raw contract text on each scan so we can reuse it later
-- (e.g. the "Create fixed version" feature) without re-fetching from storage,
-- and so pasted scans (which have no storage_path) still have a source.
alter table public.scans add column source_text text;
