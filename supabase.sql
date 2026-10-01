create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 3 and 80),
  attending boolean not null,
  companions int not null default 0 check (companions between 0 and 5),
  created_at timestamptz not null default now()
);
alter table rsvps enable row level security; -- sin políticas: solo el backend (service key) puede leer/escribir
