import { CalendarClock, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  createMilestoneAction,
  deleteMilestoneAction,
  updateMilestoneStatusAction,
} from "@/lib/actions/projects";
import { taskCategories } from "@/lib/constants";
import { getProjectWorkspace } from "@/lib/data/projects";
import { formatDate } from "@/lib/format";
import type { MilestoneStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const milestoneLabels: Record<MilestoneStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  blocked: "Blocked",
  complete: "Complete",
};

export default async function TimelinePage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const project = await getProjectWorkspace(projectId, user.id);
  const phases =
    project.project_milestones.length > 0
      ? project.project_milestones.reduce<Record<string, typeof project.project_milestones>>(
          (accumulator, milestone) => {
            accumulator[milestone.phase] ??= [];
            accumulator[milestone.phase].push(milestone);
            return accumulator;
          },
          {},
        )
      : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Timeline</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Organize project milestones from acquisition through closeout and see
          how the checklist maps into the schedule.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">
          {project.project_milestones.length === 0 ? (
            <Card className="border-dashed shadow-sm">
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center gap-3">
                  <CalendarClock className="size-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">No saved milestones yet</p>
                    <p className="text-sm text-muted-foreground">
                      Use the starter phase map below or add your own milestone.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {taskCategories.map((category, index) => {
                    const taskCount = project.project_tasks.filter(
                      (task) => task.category === category,
                    ).length;
                    return (
                      <div className="rounded-lg border p-3" key={category}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{category}</p>
                          <Badge variant="secondary">Phase {index + 1}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {taskCount} checklist item{taskCount === 1 ? "" : "s"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            Object.entries(phases).map(([phase, milestones]) => (
              <section className="space-y-3" key={phase}>
                <h2 className="text-lg font-semibold">{phase}</h2>
                {milestones.map((milestone) => (
                  <Card className="shadow-sm" key={milestone.id}>
                    <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              milestone.status === "blocked"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {milestoneLabels[milestone.status]}
                          </Badge>
                          <p className="font-medium">{milestone.title}</p>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Due {formatDate(milestone.due_date)}
                          {milestone.completed_at
                            ? ` · Completed ${formatDate(milestone.completed_at)}`
                            : ""}
                        </p>
                        {milestone.notes && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {milestone.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <form action={updateMilestoneStatusAction} className="flex flex-wrap gap-2">
                          <input name="projectId" type="hidden" value={project.id} />
                          <input
                            name="milestoneId"
                            type="hidden"
                            value={milestone.id}
                          />
                          {Object.entries(milestoneLabels).map(([value, label]) => (
                            <Button
                              disabled={milestone.status === value}
                              key={value}
                              name="status"
                              size="sm"
                              type="submit"
                              value={value}
                              variant={
                                milestone.status === value ? "default" : "outline"
                              }
                            >
                              {label}
                            </Button>
                          ))}
                        </form>
                        <form action={deleteMilestoneAction}>
                          <input name="projectId" type="hidden" value={project.id} />
                          <input
                            name="milestoneId"
                            type="hidden"
                            value={milestone.id}
                          />
                          <Button size="icon-sm" type="submit" variant="destructive">
                            <Trash2 className="size-4" />
                            <span className="sr-only">Delete milestone</span>
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </section>
            ))
          )}
        </div>

        <Card className="h-fit shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="size-4" />
              Add Milestone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createMilestoneAction} className="space-y-4">
              <input name="projectId" type="hidden" value={project.id} />
              <div className="space-y-2">
                <Label htmlFor="phase">Phase</Label>
                <select
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  id="phase"
                  name="phase"
                >
                  {taskCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due date</Label>
                <Input id="dueDate" name="dueDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>
              <Button className="w-full" type="submit">
                <CheckCircle2 className="size-4" />
                Add milestone
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
