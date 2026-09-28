import { CalendarDays, CheckCircle2, CircleDashed, PauseCircle, XCircle } from "lucide-react";
import { updateTaskStatusAction } from "@/lib/actions/projects";
import { taskCategories } from "@/lib/constants";
import type { ProjectTaskRecord } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TaskBoardProps = {
  projectId: string;
  tasks: ProjectTaskRecord[];
};

const statusLabels = {
  not_started: "Not Started",
  in_progress: "In Progress",
  blocked: "Blocked",
  complete: "Complete",
};

const statusIcons = {
  not_started: CircleDashed,
  in_progress: PauseCircle,
  blocked: XCircle,
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
                          {statusLabels[task.status]}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="size-4" />
                          {task.due_date ?? "No due date"}
                        </div>
                      </div>
                      <form action={updateTaskStatusAction} className="flex flex-wrap gap-2">
                        <input name="projectId" type="hidden" value={projectId} />
                        <input name="taskId" type="hidden" value={task.id} />
                        {Object.entries(statusLabels).map(([value, label]) => (
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
