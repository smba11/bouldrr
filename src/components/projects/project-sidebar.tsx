"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Building2,
  CalendarClock,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  Menu,
  Scale,
  Settings,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { taskCategories } from "@/lib/constants";
import type { ProjectWorkspace } from "@/lib/data/projects";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type ProjectSidebarProps = {
  project: ProjectWorkspace;
};

function SidebarContent({ project }: ProjectSidebarProps) {
  const pathname = usePathname();
  const property = project.properties[0];
  const links = [
    { href: `/projects/${project.id}`, label: "Overview", icon: LayoutDashboard },
    { href: `/projects/${project.id}/property`, label: "Property", icon: Building2 },
    { href: `/projects/${project.id}/feasibility`, label: "Feasibility", icon: Scale },
    { href: `/projects/${project.id}/regulations`, label: "Regulations", icon: ShieldCheck },
    { href: `/projects/${project.id}/tasks`, label: "Tasks", icon: ClipboardList },
    { href: `/projects/${project.id}/documents`, label: "Documents", icon: FileText },
    { href: `/projects/${project.id}/costs`, label: "Costs", icon: WalletCards },
    { href: `/projects/${project.id}/timeline`, label: "Timeline", icon: CalendarClock },
    { href: `/projects/${project.id}/copilot`, label: "Copilot", icon: Bot },
  ];

  return (
    <nav className="flex h-full flex-col gap-4 p-4">
      <div>
        <Link className="flex items-center gap-2 font-semibold" href="/dashboard">
          <Home className="size-4" />
          Bouldrr
        </Link>
        <p className="mt-3 text-sm font-medium">
          {property?.address_line_1 ?? project.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {property ? `${property.city}, ${property.state}` : project.project_type}
        </p>
      </div>
      <Separator />
      <div className="space-y-1">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
      <details className="group rounded-lg border p-3" open>
        <summary className="cursor-pointer text-sm font-medium">
          Task categories
        </summary>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          {taskCategories.map((category) => (
            <Link
              className="block rounded-md px-2 py-1 hover:bg-muted hover:text-foreground"
              href={`/projects/${project.id}/tasks#${category
                .toLowerCase()
                .replaceAll(" ", "-")}`}
              key={category}
            >
              {category}
            </Link>
          ))}
        </div>
      </details>
      <div className="mt-auto">
        <Link
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          href="/settings"
        >
          <Settings className="size-4" />
          Settings
        </Link>
      </div>
    </nav>
  );
}

export function ProjectSidebar({ project }: ProjectSidebarProps) {
  return (
    <aside className="hidden w-72 shrink-0 border-r bg-card/50 lg:block">
      <SidebarContent project={project} />
    </aside>
  );
}

export function MobileProjectNav({ project }: ProjectSidebarProps) {
  return (
    <div className="border-b bg-background p-3 lg:hidden">
      <Sheet>
        <SheetTrigger render={<Button size="sm" variant="outline" />}>
          <Menu className="size-4" />
          Project
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Bouldrr</SheetTitle>
          </SheetHeader>
          <SidebarContent project={project} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
