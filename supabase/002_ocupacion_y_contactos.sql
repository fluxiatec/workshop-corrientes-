-- =====================================================================
-- Migración 002: "¿A qué te dedicás?" + formulario de contacto
-- Ejecutar completo en Supabase → SQL Editor (después de schema.sql).
-- Es idempotente y NO toca la clave de moderador.
-- =====================================================================

-- 1) Rubro / a qué se dedica cada participante (se muestra en la pantalla)
alter table public.workshop_cases add column if not exists occupation text;

alter table public.workshop_cases drop constraint if exists workshop_cases_occupation_len;
alter table public.workshop_cases add constraint workshop_cases_occupation_len
  check (occupation is null or char_length(btrim(occupation)) between 2 and 80);

grant insert (session_id, name, task, occupation) on public.workshop_cases to anon, authenticated;

-- 2) Contactos para enviar la solución por privado.
--    PRIVADO: desde la web solo se puede INSERTAR. Nadie puede leerlos
--    desde el navegador; se consultan en Supabase → Table Editor.
create table if not exists public.workshop_contacts (
  id          uuid primary key default gen_random_uuid(),
  session_id  text        not null,
  case_id     uuid        references public.workshop_cases (id) on delete set null,
  name        text        not null,
  phone       text        not null,
  email       text        not null,
  occupation  text,
  details     text        not null,
  created_at  timestamptz not null default now(),

  constraint workshop_contacts_session_format check (session_id ~ '^[a-z0-9][a-z0-9_-]{2,63}$'),
  constraint workshop_contacts_name_len   check (char_length(btrim(name)) between 2 and 60),
  constraint workshop_contacts_phone_fmt  check (phone ~ '^[0-9+()\s.-]{6,25}$'),
  constraint workshop_contacts_email_fmt  check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 120),
  constraint workshop_contacts_occ_len    check (occupation is null or char_length(btrim(occupation)) <= 120),
  constraint workshop_contacts_details_len check (char_length(btrim(details)) between 10 and 2000)
);

create index if not exists workshop_contacts_session_idx
  on public.workshop_contacts (session_id, created_at desc);

alter table public.workshop_contacts enable row level security;

revoke all on public.workshop_contacts from anon, authenticated;
grant insert (session_id, case_id, name, phone, email, occupation, details)
  on public.workshop_contacts to anon, authenticated;

drop policy if exists "workshop_contacts_public_insert" on public.workshop_contacts;
create policy "workshop_contacts_public_insert"
  on public.workshop_contacts
  for insert
  to anon, authenticated
  with check (true);
-- (Sin política de SELECT: los contactos no se pueden leer desde la web.)

-- Recargar el esquema de la API para que vea la columna/tabla nuevas
notify pgrst, 'reload schema';
