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
    .map((task) => {
      const source = task.source_url ? ` source=${task.source_url}` : "";
      return `${task.category} / ${task.title}: ${task.status}${source}`;
    })
    .join("\n");
  const documentSummary = project.documents
    .map((document) => `${document.document_type}: ${document.name}`)
    .join("\n");
  const costSummary = project.project_costs
    .map(
      (cost) =>
        `${cost.category} / ${cost.item_name}: estimated ${cost.estimated_amount}, committed ${cost.committed_amount}, paid ${cost.paid_amount}`,
    )
    .join("\n");
  const milestoneSummary = project.project_milestones
    .map(
      (milestone) =>
        `${milestone.phase} / ${milestone.title}: ${milestone.status}, due ${milestone.due_date ?? "not set"}`,
    )
    .join("\n");

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
    input: [
      {
        role: "system",
        content:
          "You are Bouldrr, a careful real-estate development assistant. Distinguish official sources from summaries. Do not give legal, tax, engineering, or architectural advice. Do not fabricate zoning facts. When a question involves regulations, say what is known from project sources and what must be verified with the local authority.",
      },
      {
        role: "user",
        content: `Project: ${project.name}
Project type: ${project.project_type}
Description: ${project.description}
Property: ${property ? `${property.address_line_1}, ${property.city}, ${property.state} ${property.postal_code}` : "No property"}
Tasks:
${taskSummary}
Documents:
${documentSummary || "No documents uploaded."}
Costs:
${costSummary || "No costs tracked."}
Timeline:
${milestoneSummary || "No milestones tracked."}

User question: ${prompt}`,
      },
    ],
  });

  return {
    enabled: true,
    content: response.output_text,
  };
}
