-- Additive Bouldrr v2 schema. Existing projects, costs and milestones are retained.
alter table public.properties add column if not exists jurisdiction_id uuid references public.jurisdictions(id) on delete set null;
alter table public.jurisdictions add column if not exists parent_id uuid references public.jurisdictions(id) on delete set null;
alter table public.project_tasks add column if not exists depends_on_id uuid;
alter table public.project_tasks add constraint project_tasks_id_project_unique unique (id, project_id);
alter table public.project_tasks add constraint task_dependency_same_project foreign key (depends_on_id,project_id) references public.project_tasks(id,project_id);
alter table public.project_tasks add constraint task_not_own_dependency check (depends_on_id is distinct from id);
create index if not exists properties_jurisdiction_idx on public.properties(jurisdiction_id);
create index if not exists jurisdictions_parent_idx on public.jurisdictions(parent_id);
create index if not exists tasks_dependency_idx on public.project_tasks(depends_on_id,project_id);
create index if not exists projects_owner_updated_idx on public.projects(user_id,updated_at desc);

create table public.site_designs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  name text not null default 'Conceptual Site Plan',
  configuration jsonb not null default '{}',
  revision integer not null default 0 check (revision >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id,project_id)
);
create table public.map_features (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null check (length(name) between 1 and 120),
  feature_type text not null check (feature_type in ('parcel_boundary','building','driveway','parking','landscape','setback','restricted_area','buildable_area','note')),
  geometry jsonb not null check (geometry->>'type' in ('Point','LineString','Polygon') and jsonb_typeof(geometry->'coordinates')='array'),
  coordinate_space text not null default 'wgs84' check (coordinate_space in ('wgs84','local_meters')),
  provenance text not null default 'user' check (provenance in ('user','official','derived','estimated')),
  source_url text check (source_url is null or source_url ~ '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (design_id,project_id) references public.site_designs(id,project_id) on delete cascade
);
comment on column public.map_features.geometry is 'GeoJSON geometry, suitable for ST_GeomFromGeoJSON when coordinate_space = wgs84. Local sketches use local_meters, never parcel data.';
create index map_features_project_idx on public.map_features(project_id,design_id);
create index map_features_design_idx on public.map_features(design_id,project_id);
create table public.project_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  description text not null,
  created_at timestamptz not null default now()
);
create index project_activity_project_time_idx on public.project_activity(project_id,created_at desc);
create index project_activity_actor_idx on public.project_activity(actor_id);

alter table public.site_designs enable row level security;
alter table public.map_features enable row level security;
alter table public.project_activity enable row level security;
grant select,insert,update,delete on public.site_designs,public.map_features to authenticated;
grant select,insert on public.project_activity to authenticated;
create policy site_designs_owner on public.site_designs for all to authenticated
using (exists(select 1 from public.projects p where p.id=project_id and p.user_id=(select auth.uid())))
with check (exists(select 1 from public.projects p where p.id=project_id and p.user_id=(select auth.uid())));
create policy map_features_owner_read on public.map_features for select to authenticated
using (exists(select 1 from public.projects p where p.id=project_id and p.user_id=(select auth.uid())));
create policy map_features_owner_insert on public.map_features for insert to authenticated
with check (provenance='user' and exists(select 1 from public.projects p where p.id=project_id and p.user_id=(select auth.uid())));
create policy map_features_owner_update on public.map_features for update to authenticated
using (provenance='user' and exists(select 1 from public.projects p where p.id=project_id and p.user_id=(select auth.uid())))
with check (provenance='user' and exists(select 1 from public.projects p where p.id=project_id and p.user_id=(select auth.uid())));
create policy map_features_owner_delete on public.map_features for delete to authenticated
using (provenance='user' and exists(select 1 from public.projects p where p.id=project_id and p.user_id=(select auth.uid())));
create policy project_activity_read on public.project_activity for select to authenticated
using (exists(select 1 from public.projects p where p.id=project_id and p.user_id=(select auth.uid())));
create policy project_activity_insert on public.project_activity for insert to authenticated
with check (actor_id=(select auth.uid()) and exists(select 1 from public.projects p where p.id=project_id and p.user_id=(select auth.uid())));

-- Invoker functions retain caller RLS. A failure rolls back all workspace writes.
create or replace function public.create_project_workspace(input jsonb, tasks jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare pid uuid; task jsonb; task_ids uuid[]='{}'; tid uuid; dep integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if length(input->>'addressLine1') not between 3 and 250 or length(input->>'description') not between 8 and 5000
     or jsonb_typeof(tasks) <> 'array' or jsonb_array_length(tasks)>100 then raise exception 'Invalid project'; end if;
  insert into public.projects(user_id,name,project_type,description,status)
  values(auth.uid(),(input->>'addressLine1')||', '||(input->>'city'),input->>'projectType',input->>'description','planning') returning id into pid;
  insert into public.properties(project_id,address_line_1,city,state,postal_code,county,latitude,longitude,formatted_address,google_place_id)
  values(pid,input->>'addressLine1',input->>'city',input->>'state',input->>'postalCode',nullif(input->>'county',''),
    nullif(input->>'latitude','')::numeric,nullif(input->>'longitude','')::numeric,nullif(input->>'formattedAddress',''),nullif(input->>'googlePlaceId',''));
  for task in select value from jsonb_array_elements(tasks) loop
    dep = nullif(task->>'dependencyIndex','')::integer;
    insert into public.project_tasks(project_id,category,title,description,instructions,priority,sort_order,local_authority,documents_needed,dependency_notes,depends_on_id)
    values(pid,task->>'category',task->>'title',task->>'description',task->>'instructions',task->>'priority',(task->>'sortOrder')::integer,
      task->>'localAuthority',array(select jsonb_array_elements_text(coalesce(task->'documentsNeeded','[]'))),task->>'dependencyNotes',
      case when dep is not null then task_ids[dep+1] else null end) returning id into tid;
    task_ids=array_append(task_ids,tid);
  end loop;
  return pid;
end $$;
revoke all on function public.create_project_workspace(jsonb,jsonb) from public,anon;
grant execute on function public.create_project_workspace(jsonb,jsonb) to authenticated;

create or replace function public.save_site_design(input jsonb)
returns integer language plpgsql security invoker set search_path='' as $$
declare did uuid; rev integer; f jsonb; pid uuid=(input->>'projectId')::uuid; expected integer=(input->>'revision')::integer;
begin
  if not exists(select 1 from public.projects where id=pid and user_id=auth.uid()) then raise exception 'Project unavailable'; end if;
  if jsonb_typeof(input->'features')<>'array' or jsonb_array_length(input->'features')>200 then raise exception 'Invalid design'; end if;
  insert into public.site_designs(project_id) values(pid) on conflict(project_id) do nothing;
  select id,revision into did,rev from public.site_designs where project_id=pid for update;
  if rev<>expected then raise exception 'Design changed in another session. Reload before saving.'; end if;
  delete from public.map_features where design_id=did and provenance='user';
  for f in select value from jsonb_array_elements(input->'features') loop
    if f->>'provenance'<>'user' then raise exception 'Only user concepts may be saved'; end if;
    insert into public.map_features(id,design_id,project_id,name,feature_type,geometry,coordinate_space,provenance)
    values((f->>'id')::uuid,did,pid,f->>'name',f->>'feature_type',f->'geometry',f->>'coordinate_space','user');
  end loop;
  update public.site_designs set configuration=input->'configuration',revision=revision+1 where id=did;
  return rev+1;
end $$;
revoke all on function public.save_site_design(jsonb) from public,anon;
grant execute on function public.save_site_design(jsonb) to authenticated;

create trigger site_designs_updated before update on public.site_designs for each row execute function public.set_updated_at();
create trigger map_features_updated before update on public.map_features for each row execute function public.set_updated_at();

create or replace function public.record_project_activity()
returns trigger language plpgsql security invoker set search_path='' as $$
declare pid uuid; event text; description text;
begin
  if auth.uid() is null then return new; end if;
  if tg_table_name='projects' then pid=new.id; event='project_created'; description='Project created';
  elsif tg_table_name='properties' then pid=new.project_id; event='property_added'; description='Property added';
  elsif tg_table_name='project_tasks' then
    if old.status is not distinct from new.status then return new; end if;
    pid=new.project_id; event='task_updated'; description=new.title||' · '||replace(new.status,'_',' ');
  elsif tg_table_name='documents' then pid=new.project_id; event='document_uploaded'; description='Document uploaded: '||new.name;
  else pid=new.project_id; event='site_concept_updated'; description='Conceptual site plan saved';
  end if;
  insert into public.project_activity(project_id,actor_id,event_type,description) values(pid,auth.uid(),event,description);
  update public.projects set updated_at=now() where id=pid;
  return new;
end $$;
create trigger activity_project after insert on public.projects for each row execute function public.record_project_activity();
create trigger activity_property after insert on public.properties for each row execute function public.record_project_activity();
create trigger activity_task after update on public.project_tasks for each row execute function public.record_project_activity();
create trigger activity_document after insert on public.documents for each row execute function public.record_project_activity();
create trigger activity_design after update on public.site_designs for each row execute function public.record_project_activity();

-- Restrict storage to a project the caller owns, not merely a user-named folder.
drop policy if exists project_documents_select_own_folder on storage.objects;
drop policy if exists project_documents_insert_own_folder on storage.objects;
drop policy if exists project_documents_delete_own_folder on storage.objects;
create policy project_documents_select_own_folder on storage.objects for select to authenticated
using(bucket_id='project-documents' and (storage.foldername(name))[1]=(select auth.uid())::text
  and exists(select 1 from public.projects p where p.id::text=(storage.foldername(name))[2] and p.user_id=(select auth.uid())));
create policy project_documents_insert_own_folder on storage.objects for insert to authenticated
with check(bucket_id='project-documents' and (storage.foldername(name))[1]=(select auth.uid())::text
  and exists(select 1 from public.projects p where p.id::text=(storage.foldername(name))[2] and p.user_id=(select auth.uid())));
create policy project_documents_delete_own_folder on storage.objects for delete to authenticated
using(bucket_id='project-documents' and (storage.foldername(name))[1]=(select auth.uid())::text
  and exists(select 1 from public.projects p where p.id::text=(storage.foldername(name))[2] and p.user_id=(select auth.uid())));
