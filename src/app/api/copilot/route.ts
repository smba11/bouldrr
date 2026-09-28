import { NextResponse } from "next/server";
import { requireSupabase, requireUser } from "@/lib/auth";
import { askProjectCopilot } from "@/lib/ai/copilot";
import { getProjectWorkspace } from "@/lib/data/projects";

export async function POST(request: Request) {
  const user = await requireUser();
  const body = (await request.json()) as {
    projectId?: string;
    message?: string;
  };

  if (!body.projectId || !body.message?.trim()) {
    return NextResponse.json(
      { error: "Project and message are required." },
      { status: 400 },
    );
  }

  const project = await getProjectWorkspace(body.projectId, user.id);
  const result = await askProjectCopilot(project, body.message.trim());
  const supabase = await requireSupabase();

  if (supabase) {
    await supabase.from("project_messages").insert([
      {
        project_id: project.id,
        user_id: user.id,
        role: "user",
        content: body.message.trim(),
      },
      {
        project_id: project.id,
        user_id: user.id,
        role: "assistant",
        content: result.content,
      },
    ]);
  }

  return NextResponse.json(result);
}
