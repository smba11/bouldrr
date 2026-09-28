import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  FileText,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: MapPin,
    title: "Property analysis",
    body: "Capture the address, intended scope, parcel notes, and jurisdiction clues in one workspace.",
  },
  {
    icon: ShieldCheck,
    title: "Regulation guidance",
    body: "Keep official sources separate from Bouldrr summaries so research stays traceable.",
  },
  {
    icon: CheckCircle2,
    title: "Development tasks",
    body: "Start with a structured plan for due diligence, zoning, permits, inspections, and closeout.",
  },
  {
    icon: FileText,
    title: "Document organization",
    body: "Upload surveys, permits, plans, estimates, and official source files to the right project.",
  },
  {
    icon: Bot,
    title: "Project copilot",
    body: "Ask project-specific questions once your AI key is configured, with graceful fallback until then.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link className="flex items-center gap-2 font-semibold" href="/">
            <Building2 className="size-5" />
            Bouldrr
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/projects/new">Start a Project</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            Real-estate development guidance for the first messy mile.
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
            Know what you can build. Know what to do next.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Bouldrr helps developers, flippers, contractors, homeowners, and
            first-time builders understand a property, organize official
            sources, and move through a clear development task plan.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/projects/new">
                Start a Project
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
        <Card className="overflow-hidden border-border/80 shadow-sm">
          <CardContent className="p-0">
            <div className="border-b bg-muted/40 p-5">
              <p className="text-sm font-medium">123 Main St</p>
              <p className="text-xs text-muted-foreground">
                Renovation · planning workspace
              </p>
            </div>
            <div className="grid gap-3 p-5">
              {[
                "Confirm ownership and parcel basics",
                "Identify zoning and overlays",
                "Confirm permit path",
              ].map((task, index) => (
                <div
                  className="flex items-center justify-between rounded-lg border bg-card p-3"
                  key={task}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium">{task}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {index === 0 ? "High" : "Medium"}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t bg-muted/30 p-5 text-sm text-muted-foreground">
              Official Source and Bouldrr Summary stay visibly separated.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="border-t bg-muted/20">
        <div className="mx-auto grid max-w-6xl gap-4 px-6 py-12 md:grid-cols-2 lg:grid-cols-5">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div className="rounded-lg border bg-card p-4" key={feature.title}>
                <Icon className="mb-3 size-5" />
                <h2 className="font-medium">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
