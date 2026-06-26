-- =============================================================================
-- ATLAS — Throughlines (Social Strings)
-- =============================================================================
-- Stores named, ordered event chains that Pro/Team users can save and share.
-- Events are snapshotted at save time (live feed events are ephemeral).
-- Public throughlines are readable by anyone — no auth needed for the share link.
-- Requires: 20260626000001_tier_system.sql
-- =============================================================================

create table public.throughlines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  slug        text not null unique
    check (length(slug) = 8 and slug ~ '^[a-z0-9]+$'),
  title       text not null
    check (length(title) between 1 and 120),
  event_count smallint not null check (event_count >= 2),
  events      jsonb not null,         -- [{id, type, title, location, lat, lng}]
  is_public   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index on public.throughlines (slug);
create index on public.throughlines (user_id, created_at desc);

alter table public.throughlines enable row level security;

-- Anyone can read a public throughline (enables the share link without auth)
create policy "throughlines: read public"
  on public.throughlines for select
  using (is_public = true or auth.uid() = user_id);

-- Only Pro/Team users can create throughlines
create policy "throughlines: insert if pro"
  on public.throughlines for insert
  with check (
    auth.uid() = user_id
    and public.get_user_tier(auth.uid()) in ('pro', 'team')
  );

-- Owners can update their own (e.g. rename or unpublish)
create policy "throughlines: update own if pro"
  on public.throughlines for update
  using (
    auth.uid() = user_id
    and public.get_user_tier(auth.uid()) in ('pro', 'team')
  );

-- Owners can delete their own
create policy "throughlines: delete own"
  on public.throughlines for delete
  using (auth.uid() = user_id);
