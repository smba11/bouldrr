alter table public.project_tasks
drop constraint if exists project_tasks_status_check;

alter table public.project_tasks
add constraint project_tasks_status_check
check (
  status in (
    'not_started',
    'in_progress',
    'waiting',
    'blocked',
    'submitted',
    'approved',
    'complete'
  )
);

alter table public.project_tasks
add column if not exists local_authority text,
add column if not exists documents_needed text[] not null default '{}',
add column if not exists fee_estimate numeric,
add column if not exists processing_time text,
add column if not exists dependency_notes text,
add column if not exists assigned_to text,
add column if not exists notes text,
add column if not exists source_url text;

alter table public.properties
add column if not exists google_place_id text,
add column if not exists formatted_address text;

create table if not exists public.project_costs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null,
  item_name text not null,
  estimated_amount numeric not null default 0,
  quoted_amount numeric not null default 0,
  committed_amount numeric not null default 0,
  paid_amount numeric not null default 0,
  final_amount numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  phase text not null,
  title text not null,
  status text not null default 'not_started' check (
    status in ('not_started', 'in_progress', 'blocked', 'complete')
  ),
  due_date date,
  completed_at date,
  sort_order integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_costs_project_id_idx
on public.project_costs(project_id);

create index if not exists project_milestones_project_id_idx
on public.project_milestones(project_id, sort_order);

drop trigger if exists project_costs_set_updated_at on public.project_costs;
create trigger project_costs_set_updated_at
before update on public.project_costs
for each row execute function public.set_updated_at();

drop trigger if exists project_milestones_set_updated_at on public.project_milestones;
create trigger project_milestones_set_updated_at
before update on public.project_milestones
for each row execute function public.set_updated_at();

alter table public.project_costs enable row level security;
alter table public.project_milestones enable row level security;

grant select, insert, update, delete on public.project_costs to authenticated;
grant select, insert, update, delete on public.project_milestones to authenticated;

drop policy if exists "project_costs_crud_own_project" on public.project_costs;
create policy "project_costs_crud_own_project" on public.project_costs
for all to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = project_costs.project_id
    and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = project_costs.project_id
    and projects.user_id = auth.uid()
  )
);

drop policy if exists "project_milestones_crud_own_project" on public.project_milestones;
create policy "project_milestones_crud_own_project" on public.project_milestones
for all to authenticated
using (
  exists (
    select 1 from public.projects
    where projects.id = project_milestones.project_id
    and projects.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects
    where projects.id = project_milestones.project_id
    and projects.user_id = auth.uid()
  )
);
