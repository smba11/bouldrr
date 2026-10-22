-- Enforce geometry and dependency integrity even for direct Data API writes.
create or replace function public.valid_map_geometry(g jsonb, coordinate_space text)
returns boolean language plpgsql immutable security invoker set search_path='' as $$
declare vertices jsonb; point jsonb; ring jsonb; x numeric; y numeric; kind text;
begin
  if g is null or jsonb_typeof(g)<>'object' then return false; end if;
  kind=g->>'type';
  if kind='Point' then vertices=jsonb_build_array(g->'coordinates');
  elsif kind='LineString' then
    vertices=g->'coordinates';
    if jsonb_typeof(vertices)<>'array' then return false; end if;
    if jsonb_array_length(vertices)<2 or jsonb_array_length(vertices)>300 then return false; end if;
  elsif kind='Polygon' then
    if jsonb_typeof(g->'coordinates')<>'array' then return false; end if;
    if jsonb_array_length(g->'coordinates')<>1 then return false; end if;
    ring=g->'coordinates'->0;
    if jsonb_typeof(ring)<>'array' then return false; end if;
    if jsonb_array_length(ring)<4 or jsonb_array_length(ring)>300 then return false; end if;
    if ring->0 is distinct from ring->(jsonb_array_length(ring)-1) then return false; end if;
    vertices=ring;
  else return false;
  end if;
  for point in select value from jsonb_array_elements(vertices) loop
    if jsonb_typeof(point)<>'array' then return false; end if;
    if jsonb_array_length(point)<>2 then return false; end if;
    if jsonb_typeof(point->0)<>'number' or jsonb_typeof(point->1)<>'number' then return false; end if;
    x=(point->>0)::numeric; y=(point->>1)::numeric;
    if coordinate_space='wgs84' and (abs(x)>180 or abs(y)>90) then return false; end if;
    if coordinate_space='local_meters' and (abs(x)>10000000 or abs(y)>10000000) then return false; end if;
  end loop;
  return coordinate_space in ('wgs84','local_meters');
exception when others then return false;
end $$;
alter table public.map_features add constraint valid_feature_geometry check (public.valid_map_geometry(geometry,coordinate_space));

create or replace function public.validate_task_dependency()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.depends_on_id is null then return new; end if;
 -- Serialize dependency edits for a project, so concurrent writes cannot form a cycle.
 perform 1 from public.projects where id=new.project_id for update;
 if exists (
   with recursive chain as (
     select id,depends_on_id from public.project_tasks where id=new.depends_on_id and project_id=new.project_id
     union
     select t.id,t.depends_on_id from public.project_tasks t join chain c on t.id=c.depends_on_id where t.project_id=new.project_id
   ) select 1 from chain where id=new.id
 ) then raise exception 'A task dependency cannot form a cycle'; end if;
 return new;
end $$;
create trigger validate_task_dependency before insert or update of depends_on_id on public.project_tasks for each row execute function public.validate_task_dependency();

alter table public.regulation_sources
 add column if not exists verification_status text not null default 'needs_review'
 check (verification_status in ('verified','needs_review','missing_source'));
alter table public.regulation_sources add constraint verified_sources_have_check_date check (verification_status<>'verified' or last_checked_at is not null);

create index if not exists project_messages_user_idx on public.project_messages(user_id);
create index if not exists project_tasks_parent_idx on public.project_tasks(parent_task_id);
create index if not exists project_tasks_source_idx on public.project_tasks(regulation_source_id);
create index if not exists regulations_source_idx on public.regulations(source_id);
