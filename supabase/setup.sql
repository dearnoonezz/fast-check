-- Execute uma vez em um projeto novo. Desative cadastro público no Auth.
create table public.profiles (user_id uuid primary key references auth.users(id), first_name text not null, last_name text not null, rp_id text unique not null check (rp_id ~ '^[0-9]+$'), role text not null check (role in ('owner','manager','member')), active boolean not null default true);
create table public.craft_state (id integer primary key check(id=1), revision bigint not null default 0, data jsonb not null);
create table public.craft_audit (id bigint generated always as identity primary key, created_at timestamptz not null default now(), actor uuid not null, actor_name text not null, rp_id text not null, method text not null, before_data jsonb not null, after_data jsonb not null, print_data text);
alter table public.profiles enable row level security;
alter table public.craft_state enable row level security;
alter table public.craft_audit enable row level security;
create function public.craft_role() returns text language sql stable security definer set search_path='' as $$ select role from public.profiles where user_id=auth.uid() and active $$;
create policy profiles_read on public.profiles for select to authenticated using (user_id=auth.uid() or public.craft_role()='owner');
create policy state_read on public.craft_state for select to authenticated using (public.craft_role() is not null);
create policy audit_read on public.craft_audit for select to authenticated using (public.craft_role() in ('owner','manager'));
revoke all on public.profiles,public.craft_state,public.craft_audit from anon,authenticated;
grant select on public.profiles,public.craft_state,public.craft_audit to authenticated;
create function public.craft_save(expected bigint, next_data jsonb, method text, print_data text default null) returns bigint language plpgsql security definer set search_path='' as $$
declare p public.profiles; old public.craft_state; revised jsonb; result bigint;
begin
 select * into p from public.profiles where user_id=auth.uid() and active;
 if not found then raise exception 'Acesso negado'; end if;
 perform pg_advisory_xact_lock(834725);
 select * into old from public.craft_state where id=1 for update;
 if not found then
  if p.role<>'owner' or method<>'init' then raise exception 'Dono precisa inicializar estoque'; end if;
  insert into public.craft_state(id,data) values(1,next_data); return 0;
 end if;
 if old.revision<>expected then raise exception 'Estoque mudou; atualize e tente novamente'; end if;
 if method='print' then
  if print_data is null or length(print_data)>4000000 or print_data !~ '^data:image/(png|jpeg|webp);base64,' then raise exception 'Print inválido ou muito grande'; end if;
  if jsonb_typeof(next_data)<>'object' or exists(select 1 from jsonb_each(next_data) e where jsonb_typeof(e.value)<>'number' or (e.value::text)::numeric<0 or (e.value::text)::numeric<>trunc((e.value::text)::numeric) or not exists(select 1 from jsonb_array_elements(old.data->'ingredients') i where i->>'id'=e.key)) then raise exception 'Quantidades inválidas'; end if;
  select jsonb_set(old.data,'{ingredients}',coalesce(jsonb_agg(case when next_data ? (i->>'id') then jsonb_set(i,'{stock}',next_data->(i->>'id')) else i end order by ord),'[]'::jsonb)) into revised from jsonb_array_elements(old.data->'ingredients') with ordinality as a(i,ord);
 elsif method='edit' and p.role in ('owner','manager') then revised:=next_data;
 else raise exception 'Operação não autorizada'; end if;
 update public.craft_state set data=revised,revision=revision+1 where id=1 returning revision into result;
 insert into public.craft_audit(actor,actor_name,rp_id,method,before_data,after_data,print_data) values(p.user_id,p.first_name||' '||p.last_name,p.rp_id,method,old.data,revised,craft_save.print_data);
 return result;
end $$;
revoke all on function public.craft_save(bigint,jsonb,text,text) from public;
grant execute on function public.craft_save(bigint,jsonb,text,text) to authenticated;
create function public.craft_member(target uuid, new_role text, enabled boolean) returns void language plpgsql security definer set search_path='' as $$ begin
 if public.craft_role() is distinct from 'owner' or target=auth.uid() or new_role not in ('manager','member') then raise exception 'Acesso negado'; end if;
 update public.profiles set role=new_role,active=enabled where user_id=target and role<>'owner';
end $$;
revoke all on function public.craft_member(uuid,text,boolean) from public;
grant execute on function public.craft_member(uuid,text,boolean) to authenticated;
