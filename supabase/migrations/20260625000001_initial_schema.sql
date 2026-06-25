-- =============================================================================
-- ATLAS — Initial Schema
-- =============================================================================
-- Auth is handled by Supabase Auth (Google OAuth).
-- All tables live in the public schema and reference auth.users(id).
-- RLS is enabled on every table. Users can only touch their own rows.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

create type public.theme_mode as enum ('night', 'day', 'irl');

create type public.feed_type as enum (
  'news', 'world', 'usnews', 'nyc', 'money',
  'conflict', 'disaster', 'storm', 'humanitarian',
  'tech', 'fashion', 'launch',
  'astrology', 'astronomy',
  'connection', 'history'
);

create type public.alert_channel as enum ('in_app', 'email', 'push');

-- ---------------------------------------------------------------------------
-- USERS
-- Extended profile mirroring auth.users. Created automatically via trigger
-- on first Google OAuth sign-in. Never stores passwords.
-- ---------------------------------------------------------------------------

create table public.users (
  id                      uuid primary key references auth.users(id) on delete cascade,
  email                   text not null,
  display_name            text,
  avatar_url              text,
  timezone                text not null default 'UTC',
  onboarding_completed_at timestamptz,          -- null = hasn't finished stepper
  created_at              timestamptz not null default now(),
  last_seen_at            timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users: read own row"
  on public.users for select
  using (auth.uid() = id);

create policy "users: update own row"
  on public.users for update
  using (auth.uid() = id);

-- Trigger: auto-create public.users row when auth.users row is inserted
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- USER_PREFERENCES
-- One row per user. Captures full app state so sessions are restorable.
-- ---------------------------------------------------------------------------

create table public.user_preferences (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references public.users(id) on delete cascade,

  -- Globe state
  default_feed        feed_type,                        -- tile selected on landing page
  theme               theme_mode not null default 'night',
  panel_open          boolean not null default true,
  globe_pov           jsonb,                            -- {lat, lng, altitude}
  layer_visibility    jsonb,                            -- mirrors JS layerVis object

  -- Feed preferences
  active_feeds        feed_type[] not null default array[
    'news','world','usnews','nyc','money','conflict','disaster',
    'storm','humanitarian','tech','fashion','launch','astrology',
    'astronomy','connection'
  ]::feed_type[],

  -- Notification preferences
  email_alerts        boolean not null default false,
  push_alerts         boolean not null default false,
  alert_min_severity  smallint not null default 3       -- 1-5; only alert at >= this severity
    check (alert_min_severity between 1 and 5),

  updated_at          timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "prefs: read own"
  on public.user_preferences for select
  using (auth.uid() = user_id);

create policy "prefs: upsert own"
  on public.user_preferences for insert
  with check (auth.uid() = user_id);

create policy "prefs: update own"
  on public.user_preferences for update
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger prefs_touch_updated_at
  before update on public.user_preferences
  for each row execute procedure public.touch_updated_at();

-- Auto-create a default preferences row whenever a user is created
create or replace function public.handle_new_user_prefs()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_user_created_create_prefs
  after insert on public.users
  for each row execute procedure public.handle_new_user_prefs();

-- ---------------------------------------------------------------------------
-- EVENT_COLLECTIONS
-- User-defined folders for organizing saved events ("Research", "Tracking",
-- "Client Brief", etc.)
-- ---------------------------------------------------------------------------

create table public.event_collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#3b82f6',    -- hex, maps to UI dot color
  description text,
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index on public.event_collections (user_id, sort_order);
alter table public.event_collections enable row level security;

create policy "collections: crud own"
  on public.event_collections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger collections_touch_updated_at
  before update on public.event_collections
  for each row execute procedure public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- SAVED_EVENTS
-- Bookmarked globe events. Snapshot of the event at save time (APIs are
-- ephemeral — we capture what we know). User can annotate with notes.
-- ---------------------------------------------------------------------------

create table public.saved_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
  collection_id   uuid references public.event_collections(id) on delete set null,

  -- Source identity (composite key for dedup)
  event_type      feed_type not null,
  source_event_id text not null,                  -- e.g. 'usgs_3', 'hn_12', 'lnch_0'

  -- Snapshot at save time
  title           text not null,
  location        text,
  lat             double precision,
  lng             double precision,
  severity        smallint check (severity between 1 and 5),
  source_url      text,
  tags            text[],
  brief           text,

  -- User annotation
  notes           text,

  saved_at        timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique (user_id, event_type, source_event_id)   -- prevent double-saves
);

create index on public.saved_events (user_id, collection_id);
create index on public.saved_events (user_id, event_type);
create index on public.saved_events (user_id, saved_at desc);

alter table public.saved_events enable row level security;

create policy "saved_events: crud own"
  on public.saved_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger saved_events_touch_updated_at
  before update on public.saved_events
  for each row execute procedure public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- WATCHLIST_TAGS
-- Normalized watchlist. One row per tag per user with alert config.
-- Replaces the in-memory JS array so it persists across sessions.
-- ---------------------------------------------------------------------------

create table public.watchlist_tags (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.users(id) on delete cascade,
  tag                 text not null,
  color               text,                         -- optional override, null = auto from type
  alert_enabled       boolean not null default false,
  alert_channels      alert_channel[] not null default array[]::alert_channel[],
  alert_min_severity  smallint not null default 3
    check (alert_min_severity between 1 and 5),
  sort_order          smallint not null default 0,
  created_at          timestamptz not null default now(),

  unique (user_id, tag)
);

create index on public.watchlist_tags (user_id, sort_order);
alter table public.watchlist_tags enable row level security;

create policy "watchlist: crud own"
  on public.watchlist_tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- USER_ALERTS
-- Fired when a live feed event matches a watchlist tag at or above the
-- severity threshold. Delivery happens via Edge Function (future).
-- Read-only from the client; written by server-side logic only.
-- ---------------------------------------------------------------------------

create table public.user_alerts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  watchlist_tag_id  uuid references public.watchlist_tags(id) on delete set null,

  -- The triggering event (snapshot, not FK — events are ephemeral)
  event_type        feed_type,
  source_event_id   text,
  event_title       text not null,
  event_location    text,
  severity          smallint,
  source_url        text,

  channel           alert_channel not null,
  triggered_at      timestamptz not null default now(),
  delivered_at      timestamptz,
  read_at           timestamptz                     -- null = unread
);

create index on public.user_alerts (user_id, read_at) where read_at is null;
create index on public.user_alerts (user_id, triggered_at desc);

alter table public.user_alerts enable row level security;

create policy "alerts: read own"
  on public.user_alerts for select
  using (auth.uid() = user_id);

create policy "alerts: update own (mark read)"
  on public.user_alerts for update
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- CONVENIENCE VIEWS
-- ---------------------------------------------------------------------------

-- Unread alert count per user (used by topbar badge)
create view public.user_unread_alert_count as
  select user_id, count(*) as unread_count
  from public.user_alerts
  where read_at is null
  group by user_id;
