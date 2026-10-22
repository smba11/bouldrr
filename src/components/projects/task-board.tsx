"use client";
import { useActionState, useState, useTransition, useOptimistic } from "react";
import {
  Check,
  ChevronRight,
  Loader2,
  Plus,
  Link2,
  ExternalLink,
} from "lucide-react";
import {
  saveTaskAction,
  toggleTaskAction,
  addTaskAction,
  type TaskFormState,
} from "@/lib/actions/projects";
import { taskCategories, taskStatusLabels } from "@/lib/constants";
import type { ProjectTaskRecord } from "@/lib/types";
import {
  SearchField,
  SourceBadge,
  StatusBadge,
} from "@/components/workspace/primitives";
function Completion({
  task,
  projectId,
}: {
  task: ProjectTaskRecord;
  projectId: string;
}) {
  const [pending, start] = useTransition();
  const [complete, setComplete] = useOptimistic(task.status === "complete");
  const [error, setError] = useState("");
  return (
    <span className="flex flex-col items-start gap-1">
      <button
        type="button"
        aria-label={(complete ? "Reopen " : "Complete ") + task.title}
        aria-pressed={complete}
        disabled={pending}
        className={`flex size-10 shrink-0 items-center justify-center rounded-full transition ${complete ? "text-primary" : "text-muted-foreground hover:bg-muted"}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setError("");
          start(async () => {
            setComplete(!complete);
            try {
              const r = await toggleTaskAction(projectId, task.id, !complete);
              if (r.error) setError(r.error);
            } catch {
              setError("Task couldn’t be saved. Try again.");
            }
          });
        }}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <span
            className={`flex size-5 items-center justify-center rounded-full border ${complete ? "border-primary bg-primary text-white" : "border-[#bbc5b1]"}`}
          >
            {complete && <Check className="size-3" />}
          </span>
        )}
      </button>
      {error && (
        <span role="alert" className="max-w-40 text-xs text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}
function TaskDetail({
  task,
  tasks,
  projectId,
}: {
  task: ProjectTaskRecord;
  tasks: ProjectTaskRecord[];
  projectId: string;
}) {
  const [state, action, pending] = useActionState(
    saveTaskAction,
    {} as TaskFormState,
  );
  const dependency = tasks.find((t) => t.id === task.depends_on_id);
  return (
    <details className="task-details scroll-mt-5" id={"task-" + task.id}>
      <summary className="flex items-start gap-2 py-3 pr-3">
        <Completion task={task} projectId={projectId} />
        <span className="min-w-0 flex-1 pt-2">
          <span
            className={`block text-sm font-medium leading-6 ${task.status === "complete" ? "text-muted-foreground line-through" : ""}`}
          >
            {task.title}
          </span>
          {dependency && (
            <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Link2 className="size-3" />
              After: {dependency.title}
              {dependency.status === "complete" ? " · complete" : " · open"}
            </span>
          )}
        </span>
        <span className="hidden pt-2 sm:block">
          <StatusBadge status={task.status} />
        </span>
        <ChevronRight className="expand-icon mt-3 size-4 shrink-0 text-muted-foreground" />
      </summary>
      <div className="space-y-5 px-4 pb-6 sm:pl-14">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="eyebrow">Why it matters</p>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              {task.description ||
                "Add context in notes so the next step is clear."}
            </p>
          </div>
          <div>
            <p className="eyebrow">Exact instructions</p>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-6">
              {task.instructions ||
                "Define the steps and confirm any local requirements."}
            </p>
          </div>
        </div>
        {task.documents_needed.length > 0 && (
          <div>
            <p className="eyebrow mb-2">Documents to collect</p>
            <div className="flex flex-wrap gap-2">
              {task.documents_needed.map((d) => (
                <span className="source-badge" key={d}>
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
          {task.local_authority && <span>Contact: {task.local_authority}</span>}
          {task.processing_time && (
            <span>
              Planning estimate: {task.processing_time}{" "}
              <SourceBadge type="estimated" />
            </span>
          )}
        </div>
        {task.dependency_notes && (
          <p className="border-l-2 border-primary/25 pl-3 text-xs leading-6 text-muted-foreground">
            {task.dependency_notes}
          </p>
        )}
        <form action={action} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="taskId" value={task.id} />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs">
              Status
              <select
                className="field mt-2 text-xs"
                name="status"
                defaultValue={task.status}
              >
                {Object.entries(taskStatusLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              Priority
              <select
                className="field mt-2 text-xs"
                name="priority"
                defaultValue={task.priority}
              >
                {["low", "medium", "high"].map((p) => (
                  <option className="capitalize" key={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              Deadline
              <input
                className="field mt-2 text-xs"
                type="date"
                name="dueDate"
                defaultValue={task.due_date ?? ""}
              />
            </label>
            <label className="text-xs">
              Depends on
              <select
                className="field mt-2 text-xs"
                name="dependsOn"
                defaultValue={task.depends_on_id ?? ""}
              >
                <option value="">No dependency</option>
                {tasks
                  .filter((t) => t.id !== task.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <label className="block text-xs">
            Source URL
            <input
              type="url"
              className="field mt-2 text-xs"
              name="sourceUrl"
              defaultValue={task.source_url ?? ""}
              placeholder="https://official-agency.gov/requirements"
            />
          </label>
          <label className="block text-xs">
            Notes
            <textarea
              className="field mt-2 min-h-24 text-xs"
              name="notes"
              defaultValue={task.notes ?? ""}
              maxLength={10000}
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <SourceBadge type="user" />
              {task.source_url && /^https?:\/\//.test(task.source_url) && (
                <a
                  className="inline-flex items-center gap-1 text-xs text-primary"
                  target="_blank"
                  rel="noreferrer"
                  href={task.source_url}
                >
                  Open attached source <ExternalLink className="size-3" />
                </a>
              )}
            </div>
            <button className="button-primary" disabled={pending}>
              {pending ? "Saving…" : "Save task"}
            </button>
          </div>
          {state.error && (
            <p role="alert" className="error-message">
              {state.error}
            </p>
          )}
          {state.success && (
            <p role="status" className="success-message">
              Task updated.
            </p>
          )}
        </form>
      </div>
    </details>
  );
}
function NewTask({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(
    addTaskAction,
    {} as TaskFormState,
  );
  return (
    <details className="rounded-xl border bg-white p-4">
      <summary className="flex items-center gap-2 text-xs font-medium">
        <Plus className="size-4" />
        Add a task
      </summary>
      <form action={action} className="mt-5 space-y-4">
        <input type="hidden" name="projectId" value={projectId} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs">
            Title
            <input
              className="field mt-2"
              name="title"
              minLength={3}
              maxLength={250}
              required
            />
          </label>
          <label className="text-xs">
            Category
            <select className="field mt-2" name="category">
              {taskCategories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-xs">
          Why it matters
          <textarea
            className="field mt-2"
            name="description"
            maxLength={5000}
          />
        </label>
        <label className="block text-xs">
          Instructions
          <textarea
            className="field mt-2"
            name="instructions"
            maxLength={10000}
          />
        </label>
        <button className="button-primary" disabled={pending}>
          {pending ? "Adding…" : "Add task"}
        </button>
        {state.error && (
          <p role="alert" className="error-message">
            {state.error}
          </p>
        )}
        {state.success && (
          <p role="status" className="success-message">
            Task added to the project plan.
          </p>
        )}
      </form>
    </details>
  );
}
export function TaskBoard({
  projectId,
  tasks,
}: {
  projectId: string;
  tasks: ProjectTaskRecord[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = tasks.filter(
    (t) =>
      (status === "all" || t.status === status) &&
      [t.title, t.category, t.notes ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const completed = tasks.filter((t) => t.status === "complete").length;
  const categories = Array.from(
    new Set([...taskCategories, ...tasks.map((t) => t.category)]),
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <div className="min-w-40 flex-1">
          <SearchField
            label="Search tasks"
            placeholder="Find a task or category…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="sr-only" htmlFor="task-status-filter">
          Filter by status
        </label>
        <select
          id="task-status-filter"
          className="field w-auto text-xs"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          {Object.entries(taskStatusLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {completed} of {tasks.length} complete · {filtered.length} shown
        </span>
        <span>General checklist · confirm requirements locally</span>
      </div>
      {categories.map((category) => {
        const group = filtered.filter((t) => t.category === category);
        return group.length ? (
          <section
            className="scroll-mt-4"
            id={category.toLowerCase().replaceAll(" ", "-")}
            key={category}
          >
            <h2 className="mb-3 flex items-center gap-3 text-xs font-semibold">
              {category}
              <span className="font-normal text-muted-foreground">
                {group.length}
              </span>
            </h2>
            <div className="overflow-hidden rounded-xl border">
              {group.map((t) => (
                <TaskDetail
                  task={t}
                  tasks={tasks}
                  key={t.id}
                  projectId={projectId}
                />
              ))}
            </div>
          </section>
        ) : null;
      })}
      {!filtered.length && (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {tasks.length
            ? "No matching tasks. Change the search or status filter."
            : "Create the first task to give this project a next step."}
        </p>
      )}
      <NewTask projectId={projectId} />
    </div>
  );
}
