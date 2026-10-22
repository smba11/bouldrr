-- Explicitly qualify the outer storage row; projects also has a name column.
alter policy project_documents_select_own_folder on storage.objects
using(bucket_id='project-documents' and (storage.foldername(storage.objects.name))[1]=(select auth.uid())::text
  and exists(select 1 from public.projects p where p.id::text=(storage.foldername(storage.objects.name))[2] and p.user_id=(select auth.uid())));
alter policy project_documents_insert_own_folder on storage.objects
with check(bucket_id='project-documents' and (storage.foldername(storage.objects.name))[1]=(select auth.uid())::text
  and exists(select 1 from public.projects p where p.id::text=(storage.foldername(storage.objects.name))[2] and p.user_id=(select auth.uid())));
alter policy project_documents_delete_own_folder on storage.objects
using(bucket_id='project-documents' and (storage.foldername(storage.objects.name))[1]=(select auth.uid())::text
  and exists(select 1 from public.projects p where p.id::text=(storage.foldername(storage.objects.name))[2] and p.user_id=(select auth.uid())));
