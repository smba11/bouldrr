import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Sign in to search." }, { status: 401 });
  const q =
    new URL(request.url).searchParams.get("q")?.trim().slice(0, 120) ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });
  const db = await createClient();
  if (!db)
    return NextResponse.json({ error: "Search unavailable." }, { status: 503 });
  const term = "%" + q.replace(/[%_\\]/g, "\\$&") + "%";
  const [projects, tasks, documents, properties] = await Promise.all([
    db
      .from("projects")
      .select("id,name")
      .eq("user_id", user.id)
      .ilike("name", term)
      .limit(8),
    db
      .from("project_tasks")
      .select("id,title,project_id")
      .ilike("title", term)
      .limit(8),
    db
      .from("documents")
      .select("id,name,project_id")
      .ilike("name", term)
      .limit(8),
    db
      .from("properties")
      .select("id,formatted_address,address_line_1,project_id")
      .ilike("address_line_1", term)
      .limit(8),
  ]);
  if ([projects, tasks, documents, properties].some((r) => r.error))
    return NextResponse.json(
      { error: "Search couldn’t be completed." },
      { status: 503 },
    );
  return NextResponse.json(
    {
      results: [
        ...(projects.data ?? []).map((p) => ({
          id: p.id,
          title: p.name,
          type: "Project",
          href: `/projects/${p.id}`,
        })),
        ...(properties.data ?? []).map((p) => ({
          id: p.id,
          title: p.formatted_address ?? p.address_line_1,
          type: "Property",
          href: `/projects/${p.project_id}/property`,
        })),
        ...(tasks.data ?? []).map((t) => ({
          id: t.id,
          title: t.title,
          type: "Task",
          href: `/projects/${t.project_id}/tasks#task-${t.id}`,
        })),
        ...(documents.data ?? []).map((d) => ({
          id: d.id,
          title: d.name,
          type: "Document",
          href: `/projects/${d.project_id}/documents`,
        })),
      ],
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
