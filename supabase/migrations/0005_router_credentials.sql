-- =============================================================================
-- Router credentials — store the MikroTik password in Supabase Vault.
-- The routers table only keeps a vault_secret_id; the plaintext password is
-- never selectable by clients. set_router_password() TRIMS the value to avoid
-- the classic "works in Winbox, fails on API" whitespace bug.
-- =============================================================================

-- Store (or update) a router's password in Vault, linking it to the router.
create or replace function public.set_router_password(p_router_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $srp$
declare
  _company   uuid;
  _secret_id uuid;
  _clean     text;
begin
  -- Authorisation: caller must own the router's company + have router:manage.
  select company_id into _company from public.routers where id = p_router_id;
  if _company is null or _company <> public.current_company_id() or not public.has_permission('router:manage') then
    raise exception 'Hauruhusiwi';
  end if;

  -- Trim surrounding whitespace/newlines — a leading/trailing space silently
  -- breaks API auth even when the same password works when typed in Winbox.
  _clean := btrim(p_password, E' \t\r\n');

  select vault_secret_id into _secret_id from public.routers where id = p_router_id;

  if _secret_id is null then
    _secret_id := vault.create_secret(_clean, 'router_' || p_router_id::text, 'MikroTik API password');
    update public.routers set vault_secret_id = _secret_id, updated_at = now() where id = p_router_id;
  else
    perform vault.update_secret(_secret_id, _clean);
    update public.routers set updated_at = now() where id = p_router_id;
  end if;
end;
$srp$;

revoke all on function public.set_router_password(uuid, text) from public, anon;
grant execute on function public.set_router_password(uuid, text) to authenticated;

-- Read the decrypted password. Restricted to service_role (used by the agent
-- gateway edge function), never exposed to browser clients.
create or replace function public.get_router_password(p_router_id uuid)
returns text
language plpgsql
security definer
set search_path = public, vault
as $grp$
declare
  _secret_id uuid;
  _password  text;
begin
  select vault_secret_id into _secret_id from public.routers where id = p_router_id;
  if _secret_id is null then
    return null;
  end if;
  select decrypted_secret into _password
    from vault.decrypted_secrets where id = _secret_id;
  return _password;
end;
$grp$;

revoke all on function public.get_router_password(uuid) from public, anon, authenticated;
grant execute on function public.get_router_password(uuid) to service_role;
