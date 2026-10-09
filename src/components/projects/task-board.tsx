import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Clock3,
  ExternalLink,
  FileCheck2,
  Hourglass,
  PauseCircle,
  Send,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  updateTaskDetailsAction,
  updateTaskStatusAction,
} from "@/lib/actions/projects";
import { taskCategories, taskStatusLabels } from "@/lib/constants";
import type { ProjectTaskRecord, TaskStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TaskBoardProps = {
  projectId: string;
  tasks: ProjectTaskRecord[];
};

const statusIcons: Record<TaskStatus, typeof CircleDashed> = {
  not_started: CircleDashed,
  in_progress: PauseCircle,
  waiting: Hourglass,
  blocked: XCircle,
  submitted: Send,
  approved: FileCheck2,
  complete: CheckCircle2,
};

export function TaskBoard({ projectId, tasks }: TaskBoardProps) {
  return (
    <div className="space-y-6">
      {taskCategories.map((category) => {
        const categoryTasks = tasks.filter((task) => task.category === category);

        if (categoryTasks.length === 0) {
          return null;
        }

        return (
          <section className="space-y-3" id={category.toLowerCase().replaceAll(" ", "-")} key={category}>
            <h2 className="text-lg font-semibold">{category}</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {categoryTasks.map((task) => {
                const Icon = statusIcons[task.status];
                return (
                  <Card className="border-border/80 shadow-sm" key={task.id}>
                    <CardHeader className="gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">{task.title}</CardTitle>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {task.description}
                          </p>
                        </div>
                        <Badge variant={task.priority === "high" ? "default" : "secondary"}>
                          {task.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-lg bg-muted/40 p-3 text-sm">
                        <p className="font-medium">Exact steps</p>
                        <p className="mt-1 text-muted-foreground">{task.instructions}</p>
                      </div>
                      <div className="grid gap-3 text-sm sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Icon className="size-4" />
                          {taskStatusLabels[task.status]}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="size-4" />
                          {task.due_date ?? "No due date"}
                        </div>
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-2">
                        <div className="rounded-lg border p-3">
                          <p className="flex items-center gap-2 font-medium">
                            <UserRound className="size-4" />
                            Authority
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            {task.local_authority ?? "Not identified yet"}
                          </p>
                        </div>
                        <div className="rounded-lg border p-3">
                          <p className="flex items-center gap-2 font-medium">
                            <Clock3 className="size-4" />
                            Processing
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            {task.processing_time ?? "Unknown"}
                          </p>
                        </div>
                      </div>
                      {task.documents_needed.length > 0 && (
                        <div className="rounded-lg border p-3 text-sm">
                          <p className="font-medium">Documents needed</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {task.documents_needed.map((document) => (
                              <Badge key={document} variant="secondary">
                                {document}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {task.dependency_notes && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                          <p className="font-medium">Dependency</p>
                          <p className="mt-1">{task.dependency_notes}</p>
                        </div>
                      )}
                      <form action={updateTaskStatusAction} className="flex flex-wrap gap-2">
                        <input name="projectId" type="hidden" value={projectId} />
                        <input name="taskId" type="hidden" value={task.id} />
                        {Object.entries(taskStatusLabels).map(([value, label]) => (
                          <Button
                            disabled={task.status === value}
                            key={value}
                            name="status"
                            size="sm"
                            type="submit"
                            value={value}
                            variant={task.status === value ? "default" : "outline"}
                          >
                            {label}
                          </Button>
                        ))}
                      </form>
                      <details className="rounded-lg border p-3">
                        <summary className="cursor-pointer text-sm font-medium">
                          Assignment, notes, and source
                        </summary>
                        <form action={updateTaskDetailsAction} className="mt-4 grid gap-3">
                          <input name="projectId" type="hidden" value={projectId} />
                          <input name="taskId" type="hidden" value={task.id} />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor={`assigned-${task.id}`}>Assigned to</Label>
                              <Input
                                defaultValue={task.assigned_to ?? ""}
                                id={`assigned-${task.id}`}
                                name="assignedTo"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`due-${task.id}`}>Deadline</Label>
                              <Input
                                defaultValue={task.due_date ?? ""}
                                id={`due-${task.id}`}
                                name="dueDate"
                                type="date"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`source-${task.id}`}>Official source URL</Label>
                            <div className="flex gap-2">
                              <Input
                                defaultValue={task.source_url ?? ""}
                                id={`source-${task.id}`}
                                name="sourceUrl"
                                type="url"
                              />
                              {task.source_url && (
                                <Button asChild size="icon" variant="outline">
                                  <a href={task.source_url} rel="noreferrer" target="_blank">
                                    <ExternalLink className="size-4" />
                                    <span className="sr-only">Open source</span>
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`notes-${task.id}`}>Notes</Label>
                            <Textarea
                              defaultValue={task.notes ?? ""}
                              id={`notes-${task.id}`}
                              name="notes"
                              rows={3}
                            />
                          </div>
                          <Button className="w-fit" size="sm" type="submit">
                            Save details
                          </Button>
                        </form>
                      </details>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
