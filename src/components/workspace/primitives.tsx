import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Circle, Layers3, Search } from "lucide-react";
import { BouldrrMark } from "@/components/brand";
import { cn } from "@/lib/utils";
import type { ProjectStatus, TaskStatus } from "@/lib/types";
import { taskStatusLabels } from "@/lib/constants";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="text-3xl font-medium tracking-[-.045em] sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}
export function SectionHeader({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {detail && (
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        )}
      </div>
      {action}
    </div>
  );
}
const provenance = {
  official: "Official Source",
  user: "User Provided",
  derived: "Bouldrr Derived",
  estimated: "Estimated",
  unknown: "Unknown",
};
export type Provenance = keyof typeof provenance;
export function SourceBadge({ type = "unknown" }: { type?: Provenance }) {
  return (
    <span
      className={cn(
        "source-badge",
        type === "official" && "bg-primary/10 text-primary",
        type === "estimated" && "bg-amber-50 text-amber-800",
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-60" />
      {provenance[type]}
    </span>
  );
}
export function StatusBadge({
  status,
}: {
  status: ProjectStatus | TaskStatus;
}) {
  const labels: Record<string, string> = {
    planning: "Planning",
    active: "Active",
    ...taskStatusLabels,
  };
  return (
    <span
      className={cn(
        "source-badge",
        (status === "complete" ||
          status === "active" ||
          status === "approved") &&
          "bg-primary/10 text-primary",
        status === "blocked" && "bg-red-50 text-red-800",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {labels[status] ?? status}
    </span>
  );
}
export function EmptyState({
  title,
  description,
  action,
  compact = false,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn("empty-state", compact && "py-8")}>
      <div className="empty-parcel" aria-hidden="true">
        <Layers3 className="size-9 stroke-[1.2]" />
        <span />
      </div>
      <h2 className="mt-4 text-lg font-medium tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export function LoadingSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading workspace">
      <BouldrrMark className="size-8 animate-pulse text-primary" />
      <div className="skeleton h-9 w-2/3 max-w-96" />
      <div className="skeleton h-64 w-full" />
      <div className="skeleton h-20 w-full" />
    </div>
  );
}
export function InformationPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5", className)}>
      <SectionHeader title={title} />
      {children}
    </section>
  );
}
export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
}) {
  return (
    <div className="border-l pl-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-medium tracking-tight">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}
export function SearchField({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="search-field">
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <span className="sr-only">{label}</span>
      <input
        {...props}
        className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
      />
    </label>
  );
}
export function TaskRow({
  title,
  category,
  complete,
  href,
  children,
}: {
  title: string;
  category?: string;
  complete?: boolean;
  href?: string;
  children?: ReactNode;
}) {
  const content = (
    <>
      <span
        className={cn(
          "mt-0.5 text-muted-foreground",
          complete && "text-primary",
        )}
      >
        {complete ? (
          <Check className="size-5" />
        ) : (
          <Circle className="size-5 stroke-[1.3]" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-sm font-medium",
            complete && "text-muted-foreground line-through",
          )}
        >
          {title}
        </span>
        {category && (
          <span className="mt-1 block text-xs text-muted-foreground">
            {category}
          </span>
        )}
      </span>
      {children}
      {href && <ArrowUpRight className="size-4 text-muted-foreground" />}
    </>
  );
  return href ? (
    <Link href={href} className="task-row">
      {content}
    </Link>
  ) : (
    <div className="task-row">{content}</div>
  );
}
