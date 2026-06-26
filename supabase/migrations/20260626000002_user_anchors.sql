-- =============================================================================
-- ATLAS — Personal Anchor
-- =============================================================================
-- Stores each user's birth date and birthplace. One row per user (unique on
-- user_id). RLS gates writes to Pro and Team tier via get_user_tier().
-- Requires: 20260626000001_tier_system.sql (user_tier enum + get_user_tier)
-- =============================================================================

create table public.user_anchors (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references public.users(id) on delete cascade,
  birth_date  date not null,               -- stored as first of month (day is unused)
  birth_place text not null,               -- display name as typed by user
  birth_lat   double precision not null,   -- geocoded via Nominatim
  birth_lng   double precision not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.user_anchors enable row level security;

-- Any authenticated user can read their own anchor (needed to load on sign-in)
create policy "anchors: read own"
  on public.user_anchors for select
  using (auth.uid() = user_id);

-- Only Pro/Team users can create an anchor
create policy "anchors: insert if pro"
  on public.user_anchors for insert
  with check (
    auth.uid() = user_id
    and public.get_user_tier(auth.uid()) in ('pro', 'team')
  );

-- Only Pro/Team users can update their anchor
create policy "anchors: update if pro"
  on public.user_anchors for update
  using (
    auth.uid() = user_id
    and public.get_user_tier(auth.uid()) in ('pro', 'team')
  );

-- Any user can delete their own anchor (lets free users clear it if downgraded)
create policy "anchors: delete own"
  on public.user_anchors for delete
  using (auth.uid() = user_id);

create trigger anchors_touch_updated_at
  before update on public.user_anchors
  for each row execute procedure public.touch_updated_at();
