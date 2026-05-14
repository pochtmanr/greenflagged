-- Restore Postgres GRANTs on billing tables so the server-side service-role
-- key can write to them. They had RLS enabled but no SELECT/INSERT/UPDATE/
-- DELETE GRANTs, which causes 42501 permission denied even for service_role
-- (RLS bypass does not bypass Postgres GRANTs).

grant select, insert, update, delete on public.subscriptions to service_role;
grant select, insert, update, delete on public.credits        to service_role;
grant select, insert, update, delete on public.payments       to service_role;

-- Authenticated users only ever READ their own rows (writes go through the
-- server via service_role). RLS policies in 0003 already constrain this.
grant select on public.subscriptions to authenticated;
grant select on public.credits        to authenticated;
grant select on public.payments       to authenticated;
