-- =============================================================================
-- ATLAS — Lock billing columns on public.users
-- =============================================================================
-- "users: update own row" lets a signed-in user update *any* column of their own
-- row, including tier and comped. From the browser console:
--   sb.from('users').update({ tier: 'team' }).eq('id', myId)
-- grants Team for free, and RLS on anchors/throughlines trusts get_user_tier().
--
-- Fix: only the service role (Stripe webhook, SQL editor) may change tier/comped.
-- Users can still edit their profile fields (display_name, avatar_url, timezone…).
-- =============================================================================

create or replace function public.guard_billing_columns()
returns trigger language plpgsql
set search_path = public as $$
begin
  if (new.tier is distinct from old.tier or new.comped is distinct from old.comped)
     and coalesce(auth.role(), '') <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin', 'service_role') then
    raise exception 'tier and comped can only be changed by the billing system'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Runs before on_user_comped (triggers fire alphabetically), so a user can't set
-- comped = true to get upgraded either.
drop trigger if exists a_guard_billing_columns on public.users;
create trigger a_guard_billing_columns
  before update on public.users
  for each row execute procedure public.guard_billing_columns();
