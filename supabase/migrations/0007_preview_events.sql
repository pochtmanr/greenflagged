-- Rate-limiting table for the public hero-funnel preview scan.
-- Anonymous users can hit /api/scan/preview without an account; we track
-- (ip, created_at) so we can soft-cap to a few previews per IP per day
-- without persisting any contract content.

create table if not exists public.preview_events (
  id bigserial primary key,
  ip text not null,
  severity text,
  created_at timestamptz not null default now()
);

create index if not exists preview_events_ip_created_at
  on public.preview_events (ip, created_at desc);

alter table public.preview_events enable row level security;

-- Only the service role inserts / reads this table. No user-facing policy.
