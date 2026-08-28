-- =============================================================================
-- generate_vouchers — create a batch and N vouchers in one call.
-- Codes are prefix + random base32 (unambiguous chars). Uniqueness is enforced
-- by the unique(company_id, code) constraint; collisions retry.
-- =============================================================================

create or replace function public.generate_vouchers(
  p_package_id uuid,
  p_quantity integer,
  p_prefix text default '',
  p_price numeric default null
)
returns uuid
language plpgsql security definer set search_path = public as $gv$
declare
  _company uuid := public.current_company_id();
  _batch uuid;
  _price numeric;
  _validity integer;
  _code text;
  _i integer := 0;
  _attempts integer;
  _alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no confusing 0/O/1/I/L
begin
  if not public.has_permission('voucher:manage') then
    raise exception 'Huna ruhusa';
  end if;
  if p_quantity < 1 or p_quantity > 1000 then
    raise exception 'Idadi lazima iwe kati ya 1 na 1000';
  end if;

  select coalesce(p_price, price), validity_days
    into _price, _validity
    from public.hotspot_packages
   where id = p_package_id and company_id = _company;
  if _price is null then
    raise exception 'Kifurushi hakipatikani';
  end if;

  insert into public.voucher_batches (company_id, package_id, prefix, quantity, created_by)
  values (_company, p_package_id, nullif(p_prefix, ''), p_quantity, auth.uid())
  returning id into _batch;

  while _i < p_quantity loop
    _attempts := 0;
    loop
      -- 8-char random code.
      _code := coalesce(p_prefix, '') || (
        select string_agg(substr(_alphabet, 1 + floor(random() * length(_alphabet))::int, 1), '')
          from generate_series(1, 8)
      );
      begin
        insert into public.vouchers (company_id, batch_id, package_id, code, price, expires_at)
        values (
          _company, _batch, p_package_id, _code, _price,
          case when _validity is not null then now() + (_validity || ' days')::interval else null end
        );
        exit; -- inserted OK
      exception when unique_violation then
        _attempts := _attempts + 1;
        if _attempts > 10 then raise exception 'Imeshindwa kutengeneza code ya kipekee'; end if;
      end;
    end loop;
    _i := _i + 1;
  end loop;

  return _batch;
end;
$gv$;

revoke all on function public.generate_vouchers(uuid, integer, text, numeric) from public, anon;
grant execute on function public.generate_vouchers(uuid, integer, text, numeric) to authenticated;
