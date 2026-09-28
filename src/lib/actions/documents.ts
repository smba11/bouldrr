"use server";

import { revalidatePath } from "next/cache";
import { documentTypes } from "@/lib/constants";
import { requireUser, requireSupabase } from "@/lib/auth";

function cleanFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export async function uploadDocumentAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await requireSupabase();
  const projectId = String(formData.get("projectId") ?? "");
  const documentType = String(formData.get("documentType") ?? "Other");
  const file = formData.get("file");

  if (!supabase || !projectId || !(file instanceof File) || file.size === 0) {
    return;
  }

  if (!documentTypes.includes(documentType as (typeof documentTypes)[number])) {
    return;
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return;
  }

  const storagePath = `${user.id}/${projectId}/${Date.now()}-${cleanFileName(
    file.name,
  )}`;

  const { error: uploadError } = await supabase.storage
    .from("project-documents")
    .upload(storagePath, file, {
      upsert: false,
    });

  if (uploadError) {
    return;
  }

  await supabase.from("documents").insert({
    project_id: projectId,
    uploaded_by: user.id,
    name: file.name,
    storage_path: storagePath,
    document_type: documentType,
  });

  revalidatePath(`/projects/${projectId}/documents`);
}

export async function deleteDocumentAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await requireSupabase();
  const projectId = String(formData.get("projectId") ?? "");
  const documentId = String(formData.get("documentId") ?? "");
  const storagePath = String(formData.get("storagePath") ?? "");

  if (!supabase || !projectId || !documentId || !storagePath) {
    return;
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return;
  }

  await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("project_id", projectId);

  await supabase.storage.from("project-documents").remove([storagePath]);
  revalidatePath(`/projects/${projectId}/documents`);
}
