import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, requireSupabase } from "@/lib/auth";
import { askProjectCopilot } from "@/lib/ai/copilot";
import { isOpenAIEnabled } from "@/lib/env";
import {
  getProjectWorkspace,
  getProjectRegulations,
} from "@/lib/data/projects";
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to use Copilot." },
      { status: 401 },
    );
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a question." }, { status: 400 });
  }
  const parsed = z
    .object({
      projectId: z.string().uuid(),
      message: z.string().trim().min(1).max(4000),
    })
    .safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Choose a project and a question up to 4,000 characters." },
      { status: 400 },
    );
  const db = await requireSupabase();
  if (!db)
    return NextResponse.json(
      { error: "Your workspace couldn’t connect." },
      { status: 503 },
    );
  const { data: owned } = await db
    .from("projects")
    .select("id")
    .eq("id", parsed.data.projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!owned)
    return NextResponse.json(
      { error: "This project is unavailable." },
      { status: 404 },
    );
  if (!isOpenAIEnabled())
    return NextResponse.json({
      enabled: false,
      content: "Bouldrr Copilot isn't connected yet.",
    });
  try {
    const [project, rules] = await Promise.all([
      getProjectWorkspace(owned.id, user.id, "copilot"),
      getProjectRegulations(owned.id, user.id),
    ]);
    const result = await askProjectCopilot(
      project,
      parsed.data.message,
      JSON.stringify(rules),
    );
    const { error } = await db.from("project_messages").insert([
      {
        project_id: project.id,
        user_id: user.id,
        role: "user",
        content: parsed.data.message,
      },
      {
        project_id: project.id,
        user_id: user.id,
        role: "assistant",
        content: result.content,
      },
    ]);
    if (error)
      return NextResponse.json(
        { error: "The answer couldn’t be saved. Please try again." },
        { status: 503 },
      );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        error:
          "Copilot couldn’t connect. Your project is available; try this question again later.",
      },
      { status: 503 },
    );
  }
}
