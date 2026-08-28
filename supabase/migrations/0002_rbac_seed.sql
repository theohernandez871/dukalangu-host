-- =============================================================================
-- RBAC seed — permission catalogue + per-role grants.
-- Permissions are enforced server-side via has_permission() in RLS policies.
-- =============================================================================

insert into public.permissions (key, description) values
  ('dashboard:view',   'View dashboard'),
  ('router:view',      'View routers'),
  ('router:manage',    'Add/edit/delete routers'),
  ('package:view',     'View packages'),
  ('package:manage',   'Manage hotspot/pppoe packages'),
  ('voucher:view',     'View vouchers'),
  ('voucher:manage',   'Generate/print/cancel vouchers'),
  ('customer:view',    'View customers'),
  ('customer:manage',  'Manage customers'),
  ('pppoe:view',       'View PPPoE'),
  ('pppoe:manage',     'Manage PPPoE plans/customers'),
  ('payment:view',     'View payments'),
  ('payment:manage',   'Manage payments/withdrawals'),
  ('sms:view',         'View SMS'),
  ('sms:manage',       'Send SMS / manage templates'),
  ('agent:view',       'View agents'),
  ('agent:manage',     'Manage agents/commissions'),
  ('report:view',      'View reports'),
  ('settings:manage',  'Manage settings'),
  ('subscription:manage','Manage subscription'),
  ('user:manage',      'Manage users & roles'),
  ('audit:view',       'View audit logs')
on conflict (key) do nothing;

-- Grant helper: assign a set of permissions to a role.
do $seed$
declare
  all_perms text[];
begin
  select array_agg(key) into all_perms from public.permissions;

  -- super_admin + admin: everything.
  insert into public.role_permissions (role, permission)
    select 'super_admin', unnest(all_perms) on conflict do nothing;
  insert into public.role_permissions (role, permission)
    select 'admin', unnest(all_perms) on conflict do nothing;

  -- operator: day-to-day hotspot ops, no settings/users/subscription.
  insert into public.role_permissions (role, permission) values
    ('operator','dashboard:view'),('operator','router:view'),
    ('operator','package:view'),('operator','voucher:view'),('operator','voucher:manage'),
    ('operator','customer:view'),('operator','customer:manage'),
    ('operator','pppoe:view'),('operator','payment:view'),
    ('operator','sms:view'),('operator','sms:manage'),('operator','report:view')
    on conflict do nothing;

  -- accountant: money-focused.
  insert into public.role_permissions (role, permission) values
    ('accountant','dashboard:view'),('accountant','payment:view'),('accountant','payment:manage'),
    ('accountant','report:view'),('accountant','customer:view'),('accountant','voucher:view')
    on conflict do nothing;

  -- support: read-mostly + customer help.
  insert into public.role_permissions (role, permission) values
    ('support','dashboard:view'),('support','customer:view'),('support','customer:manage'),
    ('support','voucher:view'),('support','router:view'),('support','pppoe:view')
    on conflict do nothing;

  -- agent: sell vouchers, see own.
  insert into public.role_permissions (role, permission) values
    ('agent','dashboard:view'),('agent','voucher:view'),('agent','voucher:manage'),
    ('agent','customer:view')
    on conflict do nothing;
end;
$seed$;
