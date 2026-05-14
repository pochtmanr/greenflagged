-- 0010_blog_posts.sql
-- Public-facing blog. Posts are stored as markdown and surfaced under /blog
-- on the marketing site. Public read for published rows only; writes are
-- service-role only (admin posts via SQL or the Supabase dashboard for now).

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  body_md text not null,
  cover_image_url text,
  author_name text not null default 'Green Flagged',
  tags text[] not null default '{}',
  reading_minutes int,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_idx
  on public.blog_posts (published_at desc nulls last);

create index if not exists blog_posts_slug_idx
  on public.blog_posts (slug);

alter table public.blog_posts enable row level security;

drop policy if exists "blog_posts: public read published" on public.blog_posts;
create policy "blog_posts: public read published" on public.blog_posts
  for select
  using (published_at is not null and published_at <= now());

-- Touch updated_at on row update.
create or replace function public.touch_blog_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists blog_posts_touch_updated_at on public.blog_posts;
create trigger blog_posts_touch_updated_at
  before update on public.blog_posts
  for each row execute function public.touch_blog_updated_at();
