-- =============================================================================
-- ATLAS — Tier System
-- =============================================================================
-- Adds Free / Pro / Team tiers. users.tier is the authoritative source —
-- Stripe webhooks (Edge Function) keep it in sync with subscription state.
-- Helper function get_user_tier() is used by future RLS policies on gated
-- features (anchors, throughlines, etc.) without re-joining on every check.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

create type public.user_tier as enum ('free', 'pro', 'team');
create type public.team_role as enum ('admin', 'member');
create type public.subscription_status as enum (
  'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete'
);

-- ---------------------------------------------------------------------------
-- TIER COLUMN ON USERS
-- Denormalized for fast RLS checks. Updated by webhook, never by the client.
-- ---------------------------------------------------------------------------

alter table public.users
  add column tier public.user_tier not null default 'free';

-- ---------------------------------------------------------------------------
-- SUBSCRIPTIONS
-- One row per individual Stripe subscription. Webhook upserts on every
-- customer.subscription.* event and sets users.tier accordingly.
-- ---------------------------------------------------------------------------

create table public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references public.users(id) on delete cascade,
  stripe_customer_id      text not null,
  stripe_subscription_id  text not null unique,
  tier                    public.user_tier not null,       -- what this sub grants
  status                  public.subscription_status not null,
  current_period_end      timestamptz not null,
  cancel_at_period_end    boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  unique (user_id)                                         -- one active sub per user
);

create index on public.subscriptions (stripe_customer_id);
create index on public.subscriptions (stripe_subscription_id);

alter table public.subscriptions enable row level security;

create policy "subscriptions: read own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Writes are service-role only (webhook handler). No client insert/update policy.

create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute procedure public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- TEAMS
-- ---------------------------------------------------------------------------

create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique                          -- URL-safe org identifier
    check (slug ~ '^[a-z0-9][a-z0-9\-]{1,38}[a-z0-9]$'),
  owner_id    uuid not null references public.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index on public.teams (owner_id);

alter table public.teams enable row level security;

-- Any team member can read the team row
create policy "teams: read if member"
  on public.teams for select
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = id and tm.user_id = auth.uid()
    )
  );

-- Only the owner can update team details
create policy "teams: update if owner"
  on public.teams for update
  using (auth.uid() = owner_id);

create trigger teams_touch_updated_at
  before update on public.teams
  for each row execute procedure public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- TEAM SUBSCRIPTIONS
-- Separate from individual subs — Team billing is org-level with seat counts.
-- Written by webhook only; readable by any team member.
-- ---------------------------------------------------------------------------

create table public.team_subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  team_id                 uuid not null references public.teams(id) on delete cascade unique,
  stripe_customer_id      text not null,
  stripe_subscription_id  text not null unique,
  status                  public.subscription_status not null,
  seat_count              smallint not null default 1
    check (seat_count >= 1),
  current_period_end      timestamptz not null,
  cancel_at_period_end    boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index on public.team_subscriptions (stripe_customer_id);

alter table public.team_subscriptions enable row level security;

create policy "team_subscriptions: read if member"
  on public.team_subscriptions for select
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_id and tm.user_id = auth.uid()
    )
  );

-- Writes are service-role only (webhook handler).

create trigger team_subscriptions_touch_updated_at
  before update on public.team_subscriptions
  for each row execute procedure public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- TEAM MEMBERS
-- ---------------------------------------------------------------------------

create table public.team_members (
  team_id     uuid not null references public.teams(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  role        public.team_role not null default 'member',
  invited_by  uuid references public.users(id) on delete set null,
  joined_at   timestamptz not null default now(),

  primary key (team_id, user_id)
);

create index on public.team_members (user_id);

alter table public.team_members enable row level security;

-- Any member can see who else is on their team
create policy "team_members: read if same team"
  on public.team_members for select
  using (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_id and tm.user_id = auth.uid()
    )
  );

-- Only admins can add members
create policy "team_members: insert if admin"
  on public.team_members for insert
  with check (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = team_id
        and tm.user_id = auth.uid()
        and tm.role = 'admin'
    )
  );

-- Admins can remove members; members can remove themselves
create policy "team_members: delete if admin or self"
  on public.team_members for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = team_id
        and tm.user_id = auth.uid()
        and tm.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- HELPER FUNCTION
-- Used in future RLS policies on Pro/Team-gated tables.
-- security definer + stable so Postgres can inline it efficiently.
-- ---------------------------------------------------------------------------

create or replace function public.get_user_tier(uid uuid)
returns public.user_tier
language sql security definer stable
set search_path = public
as $$
  select tier from public.users where id = uid;
$$;
