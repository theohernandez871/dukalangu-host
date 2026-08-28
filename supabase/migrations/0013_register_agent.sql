-- =============================================================================
-- register_agent — create an agent for the current company and return a freshly
-- generated token ONCE. Only the sha256 hash is stored (token_hash); the plain
-- token is never persisted, so it cannot leak from the database later.
-- The caller must copy the token immediately (it can't be retrieved again).
-- =============================================================================

create extension if not exists pgcrypto;

create or replace function public.register_agent(p_name text)
returns text
language plpgsql security definer set search_path = public
as $ra$
declare
  _company uuid := public.current_company_id();
  _token text;
  _hash text;
begin
  if _company is null then
    raise exception 'Lazima uwe umeingia';
  end if;
  if not public.has_permission('router:manage') then
    raise exception 'Huna ruhusa';
  end if;

  -- 32-byte random token, hex-encoded.
  _token := encode(gen_random_bytes(32), 'hex');
  _hash := encode(digest(_token, 'sha256'), 'hex');

  insert into public.router_agents (company_id, name, token_hash)
  values (_company, coalesce(nullif(trim(p_name), ''), 'Agent'), _hash);

  -- Returned ONCE. Not stored anywhere in plaintext.
  return _token;
end;
$ra$;

revoke all on function public.register_agent(text) from public, anon;
grant execute on function public.register_agent(text) to authenticated;

-- List agents (without tokens) for the management UI.
create or replace function public.list_agents()
returns table (id uuid, name text, last_seen timestamptz, created_at timestamptz)
language sql stable security definer set search_path = public as $la$
  select id, name, last_seen, created_at
    from public.router_agents
   where company_id = public.current_company_id()
   order by created_at desc;
$la$;

revoke all on function public.list_agents() from public, anon;
grant execute on function public.list_agents() to authenticated;
