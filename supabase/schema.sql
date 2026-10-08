-- =====================================================================
-- Workshop: "¿Qué tarea te gustaría delegar?"
-- Ejecutar completo en Supabase → SQL Editor. Es idempotente.
-- =====================================================================

create table if not exists public.workshop_cases (
  id          uuid primary key default gen_random_uuid(),
  session_id  text        not null,
  name        text        not null,
  task        text        not null,
  is_selected boolean     not null default false,
  is_hidden   boolean     not null default false,
  archived_at timestamptz,                       -- soft reset: no se borra nada
  created_at  timestamptz not null default now(),

  constraint workshop_cases_session_format check (session_id ~ '^[a-z0-9][a-z0-9_-]{2,63}$'),
  constraint workshop_cases_name_len       check (char_length(btrim(name)) between 2 and 40),
  constraint workshop_cases_task_len       check (char_length(btrim(task)) between 10 and 300)
);

-- Lectura de la pantalla: casos activos de una sesión ordenados por llegada.
create index if not exists workshop_cases_session_active_idx
  on public.workshop_cases (session_id, created_at desc)
  where archived_at is null;

-- Evita duplicados exactos (doble tap, reintentos) dentro de la sesión activa.
create unique index if not exists workshop_cases_no_dupes_idx
  on public.workshop_cases (session_id, lower(name), lower(task))
  where archived_at is null;

-- ---------------------------------------------------------------------
-- Seguridad (RLS)
--   anon  → puede INSERTAR casos nuevos y LEER los visibles.
--   Moderación (seleccionar / ocultar / reiniciar) solo vía funciones
--   SQL que exigen la clave de moderador (ver más abajo).
-- ---------------------------------------------------------------------
alter table public.workshop_cases enable row level security;

revoke all on public.workshop_cases from anon, authenticated;
grant select on public.workshop_cases to anon, authenticated;
grant insert (session_id, name, task) on public.workshop_cases to anon, authenticated;

drop policy if exists "workshop_cases_public_insert" on public.workshop_cases;
create policy "workshop_cases_public_insert"
  on public.workshop_cases
  for insert
  to anon, authenticated
  with check (
    is_selected = false
    and is_hidden = false
    and archived_at is null
  );

drop policy if exists "workshop_cases_public_read" on public.workshop_cases;
create policy "workshop_cases_public_read"
  on public.workshop_cases
  for select
  to anon, authenticated
  using (is_hidden = false and archived_at is null);

-- ---------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'workshop_cases'
  ) then
    alter publication supabase_realtime add table public.workshop_cases;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Moderación
--   La clave se guarda hasheada en una tabla que nadie puede leer desde
--   el navegador. Las funciones verifican la clave antes de actuar.
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.workshop_settings (
  id                 int  primary key default 1 check (id = 1),
  moderator_key_hash text not null
);
alter table public.workshop_settings enable row level security;
revoke all on public.workshop_settings from anon, authenticated;

-- 👇 CAMBIÁ 'cambiar-esta-clave' por tu clave de moderador (larga) y ejecutá.
insert into public.workshop_settings (id, moderator_key_hash)
values (1, encode(extensions.digest('cambiar-esta-clave', 'sha256'), 'hex'))
on conflict (id) do update set moderator_key_hash = excluded.moderator_key_hash;

create or replace function public.workshop_is_moderator(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.workshop_settings
    where p_key is not null
      and length(p_key) > 0
      and moderator_key_hash = encode(extensions.digest(p_key, 'sha256'), 'hex')
  );
$$;

create or replace function public.workshop_list_cases(p_key text, p_session text)
returns setof public.workshop_cases
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if not public.workshop_is_moderator(p_key) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  return query
    select * from public.workshop_cases
    where session_id = p_session and archived_at is null
    order by created_at desc
    limit 1000;
end;
$$;

create or replace function public.workshop_update_case(
  p_key text,
  p_id uuid,
  p_selected boolean default null,
  p_hidden boolean default null
)
returns public.workshop_cases
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_row public.workshop_cases;
  v_selected int;
begin
  if not public.workshop_is_moderator(p_key) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  select * into v_row from public.workshop_cases where id = p_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  if p_selected is true and coalesce(p_hidden, v_row.is_hidden) is false then
    select count(*) into v_selected from public.workshop_cases
    where session_id = v_row.session_id and archived_at is null
      and is_selected and not is_hidden and id <> p_id;
    if v_selected >= 3 then
      raise exception 'max_selected' using errcode = 'P0001';
    end if;
  end if;

  update public.workshop_cases set
    is_hidden   = coalesce(p_hidden, is_hidden),
    is_selected = case when coalesce(p_hidden, is_hidden) then false
                       else coalesce(p_selected, is_selected) end
  where id = p_id
  returning * into v_row;

  return v_row;
end;
$$;

-- Soft reset: archiva los casos activos de UNA sesión. No borra nada.
create or replace function public.workshop_reset_session(p_key text, p_session text)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_count int;
begin
  if not public.workshop_is_moderator(p_key) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  update public.workshop_cases
    set archived_at = now(), is_selected = false
  where session_id = p_session and archived_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.workshop_is_moderator(text) from public;
revoke all on function public.workshop_list_cases(text, text) from public;
revoke all on function public.workshop_update_case(text, uuid, boolean, boolean) from public;
revoke all on function public.workshop_reset_session(text, text) from public;
grant execute on function public.workshop_is_moderator(text) to anon, authenticated;
grant execute on function public.workshop_list_cases(text, text) to anon, authenticated;
grant execute on function public.workshop_update_case(text, uuid, boolean, boolean) to anon, authenticated;
grant execute on function public.workshop_reset_session(text, text) to anon, authenticated;
