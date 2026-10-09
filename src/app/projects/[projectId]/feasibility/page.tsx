import { AlertTriangle, CheckCircle2, ClipboardList, MapPin } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getProjectWorkspace, getRegulationExample } from "@/lib/data/projects";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function FeasibilityPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const project = await getProjectWorkspace(projectId, user.id);
  const { regulations, sources } = await getRegulationExample();
  const property = project.properties[0];
  const blockedTasks = project.project_tasks.filter(
    (task) => task.status === "blocked",
  );
  const openHighPriorityTasks = project.project_tasks.filter(
    (task) => task.priority === "high" && task.status !== "complete",
  );
  const completeTasks = project.project_tasks.filter(
    (task) => task.status === "complete",
  ).length;
  const completionRate =
    project.project_tasks.length === 0
      ? 0
      : Math.round((completeTasks / project.project_tasks.length) * 100);
  const decision =
    blockedTasks.length > 0
      ? "High Risk"
      : openHighPriorityTasks.length > 0
        ? "Investigate"
        : "Ready For Next Step";

  const feasibilityFactors = [
    {
      label: "Property identified",
      status: property ? "Known" : "Missing",
      ready: Boolean(property),
      detail: property
        ? `${property.address_line_1}, ${property.city}, ${property.state}`
        : "Add a property before relying on feasibility output.",
    },
    {
      label: "Jurisdiction identified",
      status: property ? "Preliminary" : "Missing",
      ready: Boolean(property),
      detail: property
        ? `${property.city}, ${property.state}${property.county ? `, ${property.county} County` : ""}`
        : "Bouldrr needs a city, county, and state to map local authorities.",
    },
    {
      label: "Official sources attached",
      status: sources.length > 0 ? "Modeled" : "Needed",
      ready: sources.length > 0,
      detail:
        sources.length > 0
          ? `${sources.length} source record available for source-backed analysis.`
          : "Attach planning, zoning, building, and fee sources.",
    },
    {
      label: "Critical tasks cleared",
      status: `${completionRate}% complete`,
      ready: openHighPriorityTasks.length === 0,
      detail:
        openHighPriorityTasks.length === 0
          ? "No high-priority checklist items are open."
          : `${openHighPriorityTasks.length} high-priority item still needs work.`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Feasibility</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          A source-backed decision view for whether the project is ready to
          proceed, needs more investigation, or has blockers.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600" />
              Decision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-3xl font-semibold">{decision}</p>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Bouldrr is using project status, checklist progress, and
                  available source records. This is not a legal opinion; verify
                  zoning, permits, and feasibility with the responsible local
                  authority before committing capital.
                </p>
              </div>
              <Badge
                className="h-8"
                variant={decision === "High Risk" ? "destructive" : "secondary"}
              >
                {completionRate}% checklist complete
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Likely Path</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              "Confirm parcel and ownership facts",
              "Verify zoning district and overlays",
              "Attach official planning and building sources",
              "Confirm permit path before design spend",
            ].map((step, index) => (
              <div className="flex gap-3" key={step}>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                  {index + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        {feasibilityFactors.map((factor) => (
          <Card className="shadow-sm" key={factor.label}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3 text-base">
                <span>{factor.label}</span>
                <Badge variant={factor.ready ? "secondary" : "destructive"}>
                  {factor.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {factor.detail}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-600" />
              Current Risks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {blockedTasks.length === 0 ? (
              <p className="text-muted-foreground">
                No tasks are marked blocked. The main risk is unverified local
                rules until jurisdiction-specific sources are attached.
              </p>
            ) : (
              blockedTasks.map((task) => (
                <div className="rounded-lg border p-3" key={task.id}>
                  <p className="font-medium">{task.title}</p>
                  <p className="mt-1 text-muted-foreground">{task.description}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-5 text-sky-700" />
              Known Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {regulations.length === 0 ? (
              <p className="text-muted-foreground">
                No extracted regulation records are available yet.
              </p>
            ) : (
              regulations.map((rule) => (
                <div className="rounded-lg border p-3" key={rule.id}>
                  <p className="font-medium">{rule.title}</p>
                  <p className="mt-1 text-muted-foreground">{rule.summary}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-5" />
            What Bouldrr Needs Next
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-3">
          {[
            "Real geocoding and parcel lookup",
            "Jurisdiction-matched zoning sources",
            "A validated permit requirement list",
          ].map((item) => (
            <div className="rounded-lg border p-3" key={item}>
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
