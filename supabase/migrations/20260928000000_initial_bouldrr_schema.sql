create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'es')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
add column if not exists full_name text,
add column if not exists preferred_language text not null default 'en';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_preferred_language_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_preferred_language_check
    check (preferred_language in ('en', 'es'));
  end if;
end $$;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  project_type text not null,
  description text not null default '',
  status text not null default 'planning' check (status in ('planning', 'active', 'blocked', 'complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  county text,
  latitude numeric,
  longitude numeric,
  parcel_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.jurisdictions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  state text,
  county text,
  city text,
  official_website text,
  created_at timestamptz not null default now()
);

create table public.regulation_sources (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references public.jurisdictions(id) on delete cascade,
  title text not null,
  source_type text not null,
  url text not null,
  publisher text,
  effective_date date,
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.regulations (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid not null references public.jurisdictions(id) on delete cascade,
  source_id uuid references public.regulation_sources(id) on delete set null,
  category text not null,
  title text not null,
  summary text not null,
  raw_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  parent_task_id uuid references public.project_tasks(id) on delete cascade,
  category text not null,
  title text not null,
  description text,
  instructions text,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'blocked', 'complete')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  regulation_source_id uuid references public.regulation_sources(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  name text not null,
  storage_path text not null,
  document_type text not null default 'Other',
  created_at timestamptz not null default now()
);

create table public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index projects_user_id_idx on public.projects(user_id);
create index properties_project_id_idx on public.properties(project_id);
create index project_tasks_project_id_idx on public.project_tasks(project_id);
create index project_tasks_category_idx on public.project_tasks(project_id, category, sort_order);
create index documents_project_id_idx on public.documents(project_id);
create index documents_uploaded_by_idx on public.documents(uploaded_by);
create index project_messages_project_id_idx on public.project_messages(project_id, created_at);
create index jurisdictions_lookup_idx on public.jurisdictions(state, county, city);
create index regulation_sources_jurisdiction_id_idx on public.regulation_sources(jurisdiction_id);
create index regulations_jurisdiction_id_idx on public.regulations(jurisdiction_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

create trigger regulations_set_updated_at
before update on public.regulations
for each row execute function public.set_updated_at();

create trigger project_tasks_set_updated_at
before update on public.project_tasks
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from anon, authenticated, public;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.properties enable row level security;
alter table public.jurisdictions enable row level security;
alter table public.regulation_sources enable row level security;
alter table public.regulations enable row level security;
alter table public.project_tasks enable row level security;
alter table public.documents enable row level security;
alter table public.project_messages enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated
using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
for insert to authenticated
with check (id = auth.uid());

create policy "projects_crud_own" on public.projects
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "properties_crud_own_project" on public.properties
for all to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = properties.project_id
    and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = properties.project_id
    and projects.user_id = auth.uid()
  )
);

create policy "project_tasks_crud_own_project" on public.project_tasks
for all to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = project_tasks.project_id
    and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = project_tasks.project_id
    and projects.user_id = auth.uid()
  )
);

create policy "documents_crud_own_project" on public.documents
for all to authenticated
using (
  uploaded_by = auth.uid()
  and exists (
    select 1 from public.projects
    where projects.id = documents.project_id
    and projects.user_id = auth.uid()
  )
)
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1 from public.projects
    where projects.id = documents.project_id
    and projects.user_id = auth.uid()
  )
);

create policy "project_messages_crud_own_project" on public.project_messages
for all to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = project_messages.project_id
    and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = project_messages.project_id
    and projects.user_id = auth.uid()
  )
);

create policy "jurisdictions_read_authenticated" on public.jurisdictions
for select to authenticated
using (true);

create policy "regulation_sources_read_authenticated" on public.regulation_sources
for select to authenticated
using (true);

create policy "regulations_read_authenticated" on public.regulations
for select to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('project-documents', 'project-documents', false)
on conflict (id) do nothing;

create policy "project_documents_select_own_folder" on storage.objects
for select to authenticated
using (
  bucket_id = 'project-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "project_documents_insert_own_folder" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'project-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "project_documents_delete_own_folder" on storage.objects
for delete to authenticated
using (
  bucket_id = 'project-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

with jurisdiction as (
  insert into public.jurisdictions (
    name,
    type,
    state,
    county,
    city,
    official_website
  )
  values (
    'Example Municipal Jurisdiction',
    'city',
    null,
    null,
    null,
    'https://example.com'
  )
  returning id
),
source as (
  insert into public.regulation_sources (
    jurisdiction_id,
    title,
    source_type,
    url,
    publisher,
    last_checked_at
  )
  select
    id,
    'Example official planning department source',
    'planning_department',
    'https://example.com',
    'Example publisher for MVP source modeling only',
    now()
  from jurisdiction
  returning id, jurisdiction_id
)
insert into public.regulations (
  jurisdiction_id,
  source_id,
  category,
  title,
  summary,
  raw_reference
)
select
  jurisdiction_id,
  id,
  'Permits',
  'Example building permit requirement',
  'This sample shows how Bouldrr stores an extracted summary separately from an official source. Replace it with jurisdiction-specific source data before relying on it.',
  'Example reference'
from source;
