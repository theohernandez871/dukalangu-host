-- =============================================================================
-- Agent gateway RPCs (SECURITY DEFINER, called only by the Edge Function with
-- the service role). These read decrypted router passwords from Vault and claim
-- pending commands atomically so a command is never dispatched twice.
-- =============================================================================

-- Return the routers for a company, WITH decrypted passwords (for the agent).
-- Password comes from Vault; never exposed to browser clients (RLS blocks that).
create or replace function public.agent_routers(p_company uuid)
returns table (
  id uuid, host text, api_port integer, username text, password text
)
language plpgsql security definer set search_path = public, vault as $ar$
begin
  return query
    select r.id, r.host, r.api_port, r.username,
           coalesce(
             (select vs.decrypted_secret
                from vault.decrypted_secrets vs
               where vs.id = r.vault_secret_id),
             ''
           ) as password
      from public.routers r
     where r.company_id = p_company
       and r.is_active is not false;
end;
$ar$;

-- Atomically claim pending commands: flip 'pending' -> 'running' and return them.
-- The UPDATE ... RETURNING guarantees each command is claimed once, so it can
-- never be dispatched to the agent twice (addresses the old double-run risk).
create or replace function public.claim_pending_commands(p_company uuid)
returns table (
  id uuid, router_id uuid, command text, params jsonb
)
language plpgsql security definer set search_path = public as $cpc$
begin
  return query
    update public.router_commands c
       set status = 'running', executed_at = now()
     where c.id in (
       select c2.id from public.router_commands c2
        where c2.company_id = p_company and c2.status = 'pending'
        order by c2.created_at
        limit 50
        for update skip locked
     )
    returning c.id, c.router_id, c.command, c.params;
end;
$cpc$;

revoke all on function public.agent_routers(uuid) from public, anon, authenticated;
revoke all on function public.claim_pending_commands(uuid) from public, anon, authenticated;
