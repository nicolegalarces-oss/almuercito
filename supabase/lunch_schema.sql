-- Ejecutar una sola vez en Supabase → SQL Editor
-- Crea/actualiza las tablas para el sitio equipo-almuerzo (lugares y ranking del equipo)
-- Es seguro volver a correr este script completo (usa "if not exists" en todo).

create table if not exists lunch_places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  maps_url text,
  cuisine text,
  google_place_id text,
  google_rating numeric,
  google_rating_count int,
  amipass boolean default false,
  healthy boolean default false,
  tags text[] default '{}',
  notes text,
  added_by text,
  created_at timestamptz default now()
);

-- Por si la tabla ya existía de una versión anterior sin estas columnas
alter table lunch_places add column if not exists google_place_id text;
alter table lunch_places add column if not exists google_rating_count int;

create table if not exists lunch_ratings (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references lunch_places(id) on delete cascade,
  rater_name text not null,
  stars int not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- Evita agregar el mismo lugar de Google dos veces
create unique index if not exists lunch_places_google_place_id_idx
  on lunch_places(google_place_id) where google_place_id is not null;

-- Una persona puede actualizar su propio ranking de un lugar, no duplicarlo
create unique index if not exists lunch_ratings_place_rater_idx
  on lunch_ratings(place_id, rater_name);

alter table lunch_places enable row level security;
alter table lunch_ratings enable row level security;

-- Acceso público de lectura/escritura, igual que la tabla food_log existente
-- (el sitio no tiene login; se apoya en la clave publishable de Supabase)
drop policy if exists "public read places" on lunch_places;
drop policy if exists "public insert places" on lunch_places;
drop policy if exists "public update places" on lunch_places;
create policy "public read places" on lunch_places for select using (true);
create policy "public insert places" on lunch_places for insert with check (true);
create policy "public update places" on lunch_places for update using (true);

drop policy if exists "public read ratings" on lunch_ratings;
drop policy if exists "public insert ratings" on lunch_ratings;
drop policy if exists "public update ratings" on lunch_ratings;
create policy "public read ratings" on lunch_ratings for select using (true);
create policy "public insert ratings" on lunch_ratings for insert with check (true);
create policy "public update ratings" on lunch_ratings for update using (true);
