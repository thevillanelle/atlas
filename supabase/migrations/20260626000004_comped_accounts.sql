-- =============================================================================
-- ATLAS — Comped Accounts
-- =============================================================================
-- Marks specific users as permanently Team tier at no cost. The Stripe webhook
-- must check comped = true and skip any tier update for these users so they
-- are never accidentally downgraded by subscription events.
--
-- To comp an account, run in the Supabase SQL editor (never in source code):
--   update public.users set comped = true where email = 'user@example.com';
-- The trigger below handles the tier upgrade automatically.
-- =============================================================================

alter table public.users
  add column comped boolean not null default false;

-- Automatically set tier = 'team' whenever comped is flipped to true.
-- Also prevents a future update from lowering the tier while comped remains true.
create or replace function public.handle_comped_user()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  if new.comped = true then
    new.tier = 'team';
  end if;
  return new;
end;
$$;

create trigger on_user_comped
  before update on public.users
  for each row execute procedure public.handle_comped_user();
