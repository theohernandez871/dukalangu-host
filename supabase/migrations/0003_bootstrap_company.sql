-- =============================================================================
-- bootstrap_company — called right after sign-up. Creates the company and links
-- the new user's profile to it as admin. Idempotent: if the user already has a
-- company, it does nothing.
-- =============================================================================

create or replace function public.bootstrap_company(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $bootstrap$
declare
  _company_id uuid;
  _existing   uuid;
begin
  -- Guard: must be authenticated.
  if auth.uid() is null then
    raise exception 'Lazima uwe umeingia';
  end if;

  -- If the profile already has a company, return it (idempotent).
  select company_id into _existing from public.profiles where id = auth.uid();
  if _existing is not null then
    return _existing;
  end if;

  -- Create the company.
  insert into public.companies (name)
  values (coalesce(nullif(trim(p_name), ''), 'Biashara Yangu'))
  returning id into _company_id;

  -- Link the profile as admin of the new company.
  update public.profiles
     set company_id = _company_id,
         role = 'admin',
         updated_at = now()
   where id = auth.uid();

  return _company_id;
end;
$bootstrap$;

revoke all on function public.bootstrap_company(text) from public, anon;
grant execute on function public.bootstrap_company(text) to authenticated;
