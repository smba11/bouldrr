"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Bot,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Compass,
  FileText,
  HardHat,
  Layers3,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { Wordmark } from "@/components/brand";
import { signOutAction } from "@/lib/actions/auth";
import type { DashboardProject, ProjectShell } from "@/lib/data/projects";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
const CommandMenu = dynamic(() =>
  import("@/components/workspace/command-menu").then((m) => m.CommandMenu),
);
type Props = {
  project?: ProjectShell;
  projects: DashboardProject[];
  children: ReactNode;
};
export function WorkspaceShell({ project, projects, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [command, setCommand] = useState(false);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommand((v) => !v);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const base = project ? `/projects/${project.id}` : "";
  const groups = project
    ? [
        {
          label: "",
          links: [
            ["Overview", base, LayoutDashboard],
            ["Property", base + "/property", Map],
          ],
        },
        {
          label: "Analyze",
          links: [
            ["Site", base + "/property?mode=analyze", Compass],
            ["Zoning", base + "/regulations", Layers3],
            ["Constraints", base + "/constraints", ShieldCheck],
            ["Feasibility", base + "/feasibility", Compass],
          ],
        },
        {
          label: "Plan",
          links: [
            ["Tasks", base + "/tasks", ClipboardList],
            ["Permits", base + "/tasks#permits", FileText],
            ["Timeline", base + "/timeline", CalendarDays],
            ["Costs", base + "/costs", Wallet],
          ],
        },
        {
          label: "Build",
          links: [
            ["Construction", base + "/tasks#construction", HardHat],
            ["Inspections", base + "/tasks#inspections", ShieldCheck],
          ],
        },
        {
          label: "",
          links: [
            ["Documents", base + "/documents", FileText],
            ["Copilot", base + "/copilot", Bot],
          ],
        },
      ]
    : [
        {
          label: "Workspace",
          links: [
            ["Projects", "/dashboard", LayoutDashboard],
            ["New project", "/projects/new", Plus],
          ],
        },
      ];
  const nav = (
    <div className="workspace-nav">
      <div className="mb-7 px-2">
        <Wordmark href="/dashboard" />
      </div>
      <div className="relative mb-3">
        <select
          aria-label="Switch project"
          className="w-full appearance-none rounded-lg border bg-white/60 py-3 pl-3 pr-7 text-xs font-medium"
          value={project?.id ?? ""}
          onChange={(e) => {
            setMobile(false);
            router.push(
              e.target.value ? `/projects/${e.target.value}` : "/dashboard",
            );
          }}
        >
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-3 size-4 text-muted-foreground" />
      </div>
      <button
        onClick={() => {
          setMobile(false);
          setCommand(true);
        }}
        className="nav-link mb-2 w-full border border-dashed"
      >
        <Search className="size-4" />
        Quick search<kbd className="ml-auto text-[10px]">⌘ K</kbd>
      </button>
      <nav aria-label="Workspace navigation">
        {groups.map((g, i) => (
          <div key={i}>
            {g.label && <p className="nav-group">{g.label}</p>}
            {g.links.map(([label, href, Icon]) => {
              const Component = Icon as typeof Map;
              return (
                <Link
                  onClick={() => setMobile(false)}
                  className="nav-link"
                  key={String(label)}
                  href={String(href)}
                  aria-current={pathname === href ? "page" : undefined}
                >
                  <Component className="size-4 stroke-[1.6]" />
                  {String(label)}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="mt-auto pt-8">
        {project && (
          <Link href="/dashboard" className="nav-link">
            <LayoutDashboard className="size-4" />
            All projects
            <ArrowUpRight className="ml-auto size-3" />
          </Link>
        )}
        <Link href="/settings" className="nav-link">
          <Settings className="size-4" />
          Settings
        </Link>
        <form action={signOutAction}>
          <button className="nav-link w-full" type="submit">
            <LogOut className="size-4" />
            Sign out
          </button>
        </form>
        <p className="px-3 pt-4 text-[9px] text-muted-foreground">
          GOOD THINGS START FROM THE GROUND.
        </p>
      </div>
    </div>
  );
  return (
    <div className="flex min-h-screen">
      <aside className="app-sidebar hidden lg:block">{nav}</aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="workspace-topbar">
          <div className="flex min-w-0 items-center gap-3">
            <div className="lg:hidden">
              <Sheet open={mobile} onOpenChange={setMobile}>
                <SheetTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Open navigation"
                    />
                  }
                >
                  <Menu className="size-5" />
                </SheetTrigger>
                <SheetContent
                  side="left"
                  showCloseButton={false}
                  className="w-[280px] overflow-y-auto bg-sidebar"
                >
                  <SheetHeader className="sr-only">
                    <SheetTitle>Workspace navigation</SheetTitle>
                  </SheetHeader>
                  {nav}
                  <SheetClose
                    render={
                      <button
                        className="absolute right-3 top-3"
                        aria-label="Close navigation"
                      />
                    }
                  >
                    <X className="size-4" />
                  </SheetClose>
                </SheetContent>
              </Sheet>
            </div>
            <Link
              href="/dashboard"
              className="hidden text-xs text-muted-foreground sm:inline"
            >
              Workspace
            </Link>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              /
            </span>
            <p className="truncate text-xs font-medium">
              {project?.properties[0]?.address_line_1 ??
                project?.name ??
                "Your projects"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-[10px] text-muted-foreground md:inline">
              Your next possibility starts here.
            </span>
            <button
              className="flex size-10 items-center justify-center rounded-lg hover:bg-muted"
              onClick={() => setCommand(true)}
              aria-label="Search projects, tasks and documents"
            >
              <Search className="size-4" />
            </button>
          </div>
        </header>
        <main id="main-content" className="workspace-main">
          {children}
        </main>
      </div>
      {command && (
        <CommandMenu
          projects={projects}
          projectId={project?.id}
          onClose={() => setCommand(false)}
        />
      )}
    </div>
  );
}
