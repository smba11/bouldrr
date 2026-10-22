"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Send, Loader2, MessageSquare } from "lucide-react";
import { BouldrrMark } from "@/components/brand";
import { SourceBadge } from "@/components/workspace/primitives";
import type { ProjectMessageRecord } from "@/lib/types";
type Message = Pick<ProjectMessageRecord, "role" | "content">;
const prompts = [
  "What should I do next?",
  "What information are we missing?",
  "What permits might I need?",
  "Explain this regulation.",
  "What is blocking this project?",
];
export function CopilotPanel({
  projectId,
  initialMessages,
  enabled,
  projectName,
  context,
}: {
  projectId: string;
  initialMessages: Message[];
  enabled: boolean;
  projectName: string;
  context: {
    tasks: number;
    documents: number;
    sources: number;
    jurisdiction: string;
  };
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    if (!enabled || pending || !draft.trim()) return;
    const prompt = draft.trim();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: prompt }),
      });
      const data = await response.json();
      if (!response.ok)
        throw Error(
          data.error || "Your project assistant couldn’t connect. Try again.",
        );
      if (!data.enabled) throw Error("Bouldrr Copilot isn't connected yet.");
      setMessages((m) => [
        ...m,
        { role: "user", content: prompt },
        { role: "assistant", content: data.content },
      ]);
      setDraft("");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The connection was interrupted. Your question is still here; try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="flex min-h-[590px] flex-col rounded-2xl border bg-white">
        <div className="flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-3">
            <BouldrrMark className="size-7 text-primary" />
            <div>
              <h2 className="text-sm font-medium">
                A little perspective for your project.
              </h2>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {projectName}
              </p>
            </div>
          </div>
          <span className="source-badge">
            {enabled ? "Connected" : "Not connected"}
          </span>
        </div>
        <div className="flex-1 space-y-5 p-5 sm:p-7" aria-live="polite">
          {!messages.length && (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <MessageSquare className="mb-5 size-8 stroke-[1.2] text-primary" />
              <h3 className="text-xl font-medium tracking-tight">
                {enabled
                  ? "Your project has context. Start a conversation."
                  : "Bouldrr Copilot isn't connected yet."}
              </h3>
              <p className="mt-3 max-w-md text-xs leading-6 text-muted-foreground">
                {enabled
                  ? "Ask about next steps, missing information, or a source you’ve collected."
                  : "Your property, tasks, documents, and site concepts all work independently. You can keep moving through the project plan."}
              </p>
              <div className="mt-6 flex max-w-md flex-wrap justify-center gap-2">
                {prompts.map((p) =>
                  enabled ? (
                    <button
                      className="button-secondary text-[11px]"
                      onClick={() => setDraft(p)}
                      key={p}
                    >
                      {p}
                    </button>
                  ) : (
                    <span
                      className="rounded-lg border px-3 py-2 text-[10px] text-muted-foreground"
                      key={p}
                    >
                      {p}
                    </span>
                  ),
                )}
              </div>
              {!enabled && (
                <Link
                  className="button-primary mt-6"
                  href={`/projects/${projectId}/tasks`}
                >
                  See your next steps
                  <ArrowUpRight className="size-3.5" />
                </Link>
              )}
            </div>
          )}
          {messages
            .filter((m) => m.role !== "system")
            .map((m, i) => (
              <article
                key={i}
                className={`max-w-[95%] rounded-xl p-4 text-sm leading-7 whitespace-pre-wrap ${m.role === "user" ? "ml-auto bg-primary text-white" : "mr-auto bg-muted/60"}`}
              >
                <p className="mb-1 text-[9px] uppercase tracking-wider opacity-60">
                  {m.role === "user" ? "You" : "Bouldrr summary"}
                </p>
                {m.content}
              </article>
            ))}
          {pending && (
            <p
              role="status"
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Loader2 className="size-3.5 animate-spin" />
              Working with your project context…
            </p>
          )}
        </div>
        <form
          className="border-t p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label htmlFor="copilot-question" className="sr-only">
            Ask about this project
          </label>
          <textarea
            id="copilot-question"
            className="field min-h-24 text-sm"
            value={draft}
            maxLength={4000}
            disabled={!enabled || pending}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              enabled
                ? "Ask about this project…"
                : "Copilot will be available when a provider is connected."
            }
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xs text-[10px] leading-5 text-muted-foreground">
              Summaries may be incomplete. Verify official rules and project
              decisions with the responsible authority.
            </p>
            <button
              className="button-primary"
              disabled={!enabled || pending || !draft.trim()}
            >
              <Send className="size-3.5" />
              Send
            </button>
          </div>
          {error && (
            <p role="alert" className="error-message mt-3">
              {error}
            </p>
          )}
        </form>
      </div>
      <aside className="space-y-5">
        <div className="rounded-xl border bg-white p-5">
          <h3 className="text-xs font-semibold">Working with your context</h3>
          <dl className="mt-5 space-y-4 text-xs">
            {[
              ["Property & goal", "Saved in project"],
              ["Jurisdiction", context.jurisdiction],
              ["Tasks", String(context.tasks)],
              ["Documents", String(context.documents) + " file records"],
              ["Official sources", String(context.sources) + " attached"],
            ].map(([k, v]) => (
              <div key={k} className="border-b pb-3">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="mt-1 break-words">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[10px] leading-5 text-muted-foreground">
            Documents currently provide file metadata, not automatically
            extracted contents.
          </p>
        </div>
        <div className="rounded-xl bg-[#e9eedf] p-5">
          <SourceBadge type="derived" />
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            Project assistance stays separate from official sources. Missing
            data stays unknown.
          </p>
        </div>
      </aside>
    </div>
  );
}
