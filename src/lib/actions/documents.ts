"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { documentTypes } from "@/lib/constants";
import { requireUser, requireSupabase } from "@/lib/auth";
const metadata = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(250),
  documentType: z.enum(documentTypes),
  size: z
    .number()
    .int()
    .min(1)
    .max(50 * 1024 * 1024),
});
async function owned(projectId: string) {
  const user = await requireUser();
  const db = await requireSupabase();
  if (!db) return { user, db: null, project: null };
  const { data: project } = await db
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  return { user, db, project };
}
export async function prepareUploadAction(
  input: unknown,
): Promise<{ error?: string; path?: string; signedUrl?: string }> {
  const parsed = metadata.safeParse(input);
  if (!parsed.success)
    return { error: "Choose a document type and a file smaller than 50 MB." };
  const v = parsed.data;
  const { user, db, project } = await owned(v.projectId);
  if (!db || !project) return { error: "This project is unavailable." };
  const name = v.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-180);
  const path = `${user.id}/${project.id}/${crypto.randomUUID()}-${name}`;
  const { data, error } = await db.storage
    .from("project-documents")
    .createSignedUploadUrl(path);
  if (error) return { error: "We couldn’t prepare this upload. Try again." };
  return { path, signedUrl: data.signedUrl };
}
export async function finishUploadAction(
  input: unknown,
): Promise<{ error?: string }> {
  const parsed = metadata.extend({ path: z.string() }).safeParse(input);
  if (!parsed.success) return { error: "Document details are invalid." };
  const v = parsed.data;
  const { user, db, project } = await owned(v.projectId);
  if (!db || !project) return { error: "This project is unavailable." };
  const prefix = `${user.id}/${project.id}/`;
  if (!v.path.startsWith(prefix) || v.path.slice(prefix.length).includes("/"))
    return { error: "This upload doesn’t belong to this project." };
  const fileName = v.path.slice(prefix.length);
  const { data: files, error: listError } = await db.storage
    .from("project-documents")
    .list(prefix.slice(0, -1), { search: fileName, limit: 10 });
  if (listError || !files?.some((f) => f.name === fileName))
    return { error: "The upload hasn’t finished. Try again." };
  const { error } = await db.from("documents").insert({
    project_id: project.id,
    uploaded_by: user.id,
    name: v.name,
    storage_path: v.path,
    document_type: v.documentType,
  });
  if (error) {
    await db.storage.from("project-documents").remove([v.path]);
    return {
      error:
        "The document record couldn’t be saved. Please upload the file again.",
    };
  }
  revalidatePath(`/projects/${project.id}`, "layout");
  return {};
}
export async function documentUrlAction(
  projectId: string,
  documentId: string,
): Promise<{ error?: string; url?: string }> {
  const { db, project } = await owned(projectId);
  if (!db || !project) return { error: "This project is unavailable." };
  const { data: document } = await db
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("project_id", project.id)
    .maybeSingle();
  if (!document) return { error: "This document is unavailable." };
  const { data, error } = await db.storage
    .from("project-documents")
    .createSignedUrl(document.storage_path, 120);
  return error
    ? { error: "We couldn’t open this document. Try again." }
    : { url: data.signedUrl };
}
export async function deleteDocumentAction(
  projectId: string,
  documentId: string,
): Promise<{ error?: string }> {
  const { db, project } = await owned(projectId);
  if (!db || !project) return { error: "This project is unavailable." };
  const { data: document } = await db
    .from("documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("project_id", project.id)
    .maybeSingle();
  if (!document) return { error: "This document is unavailable." };
  const { error: storageError } = await db.storage
    .from("project-documents")
    .remove([document.storage_path]);
  if (storageError)
    return { error: "The file couldn’t be deleted. Try again." };
  const { error } = await db
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("project_id", project.id);
  if (error)
    return {
      error:
        "The file was removed, but its record needs another delete attempt.",
    };
  revalidatePath(`/projects/${project.id}`, "layout");
  return {};
}
