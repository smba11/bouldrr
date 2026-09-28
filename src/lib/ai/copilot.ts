import "server-only";

import OpenAI from "openai";
import { isOpenAIEnabled } from "@/lib/env";
import type { ProjectWorkspace } from "@/lib/data/projects";

export type CopilotResult = {
  enabled: boolean;
  content: string;
};

export async function askProjectCopilot(
  project: ProjectWorkspace,
  prompt: string,
): Promise<CopilotResult> {
  if (!isOpenAIEnabled()) {
    return {
      enabled: false,
      content:
        "Bouldrr Copilot is ready, but AI is disabled in this environment. Add OPENAI_API_KEY when you want live project answers. For now, use the workspace tasks, property details, documents, and source sections as the project record.",
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const property = project.properties[0];
  const taskSummary = project.project_tasks
    .map((task) => `${task.title}: ${task.status}`)
    .join("\n");

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
    input: [
      {
        role: "system",
        content:
          "You are Bouldrr, a careful real-estate development assistant. Distinguish official sources from summaries. Do not give legal advice or fabricate zoning facts.",
      },
      {
        role: "user",
        content: `Project: ${project.name}
Project type: ${project.project_type}
Description: ${project.description}
Property: ${property ? `${property.address_line_1}, ${property.city}, ${property.state} ${property.postal_code}` : "No property"}
Tasks:
${taskSummary}

User question: ${prompt}`,
      },
    ],
  });

  return {
    enabled: true,
    content: response.output_text,
  };
}
