-- 0008_contract_locale.sql
-- Adds the language (locale) the contract was authored in plus a translation
-- cache so the preview/PDF can render in any supported locale without
-- re-translating on every request.
--
-- Translations only cover the template phrasing (headings, clauses, boilerplate)
-- — user-typed content (scope, names, addresses) is preserved verbatim by the
-- translator prompt. See lib/contracts/i18n.ts.

alter table public.contracts
  add column if not exists locale text not null default 'en';

-- Sanity guard at the DB level: only allow the five we support.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'contracts_locale_check'
  ) then
    alter table public.contracts
      add constraint contracts_locale_check
      check (locale in ('en', 'de', 'es', 'fr', 'he'));
  end if;
end$$;

alter table public.contract_versions
  add column if not exists body_md_translations jsonb;

-- Index isn't useful here — translations are looked up by primary key. Just a
-- shape hint for jsonb defaults.
comment on column public.contract_versions.body_md_translations is
  'Object keyed by locale code (de, es, fr, he) with the translated body_md. en is implicit (lives in body_md).';
