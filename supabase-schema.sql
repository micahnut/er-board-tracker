create extension if not exists pgcrypto;

create table if not exists public.patients (
  id text primary key,
  code text not null default '',
  mrn text not null default '',
  age text not null default '',
  sex text not null default '',
  age_sex text not null default '',
  complaint text not null default '',
  impression text not null default '',
  er_bed text not null default '',
  service text not null default '',
  physician text not null default '',
  pgi text not null default '',
  status text not null default 'Consult',
  disposition text not null default '',
  room text not null default '',
  notes text not null default '',
  tasks jsonb not null default '[]'::jsonb,
  created_at_ms bigint not null default 0,
  updated_at_ms bigint not null default 0,
  updated_label text not null default '',
  created_at timestamptz not null default now()
);

alter table public.patients
add column if not exists mrn text not null default '';

alter table public.patients enable row level security;

drop policy if exists "Allow public read patients" on public.patients;
drop policy if exists "Allow public insert patients" on public.patients;
drop policy if exists "Allow public update patients" on public.patients;
drop policy if exists "Allow public delete patients" on public.patients;

create policy "Allow public read patients"
on public.patients for select
to anon
using (true);

create policy "Allow public insert patients"
on public.patients for insert
to anon
with check (true);

create policy "Allow public update patients"
on public.patients for update
to anon
using (true)
with check (true);

create policy "Allow public delete patients"
on public.patients for delete
to anon
using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'patients'
  ) then
    alter publication supabase_realtime add table public.patients;
  end if;
end $$;
