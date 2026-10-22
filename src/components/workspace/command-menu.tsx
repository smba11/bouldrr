"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search, ArrowUpRight, X, Loader2 } from "lucide-react";
import type { DashboardProject } from "@/lib/data/projects";
type Result = { id: string; title: string; type: string; href: string };
export function CommandMenu({
  projects,
  projectId,
  onClose,
}: {
  projects: DashboardProject[];
  projectId?: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    input.current?.focus();
    return () => node?.close();
  }, []);
  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPending(true);
      setError(false);
      try {
        const r = await fetch("/api/search?q=" + encodeURIComponent(query), {
          signal: controller.signal,
        });
        if (!r.ok) throw Error();
        setResults((await r.json()).results);
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) setPending(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  const defaults: Result[] = [
    {
      id: "dashboard",
      title: "All projects",
      type: "Navigation",
      href: "/dashboard",
    },
    {
      id: "new",
      title: "Create a project",
      type: "Navigation",
      href: "/projects/new",
    },
    ...projects.map((p) => ({
      id: p.id,
      title: p.name,
      type: "Project",
      href: `/projects/${p.id}`,
    })),
  ];
  if (projectId)
    defaults.push(
      ...["property", "tasks", "documents", "timeline", "costs", "copilot"].map(
        (s) => ({
          id: s,
          title: s.charAt(0).toUpperCase() + s.slice(1),
          type: "Navigation",
          href: `/projects/${projectId}/${s}`,
        }),
      ),
    );
  const displayed =
    query.trim().length >= 2
      ? [
          ...defaults.filter(
            (item) =>
              item.type === "Navigation" &&
              item.title.toLowerCase().includes(query.trim().toLowerCase()),
          ),
          ...results,
        ]
      : defaults;
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      aria-label="Search your workspace"
      className="command-dialog"
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      <div className="flex items-center gap-3 border-b px-5 py-3">
        <Search className="size-4 text-muted-foreground" />
        <input
          ref={input}
          aria-label="Search workspace"
          placeholder="Projects, properties, tasks, documents…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setResults([]);
            setError(false);
            setPending(e.target.value.trim().length >= 2);
          }}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none"
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              dialog.current?.querySelector<HTMLAnchorElement>("a")?.focus();
            }
          }}
        />
        <button
          className="flex size-10 items-center justify-center"
          onClick={onClose}
          aria-label="Close search"
        >
          <X className="size-4" />
        </button>
      </div>
      <div
        className="max-h-96 overflow-y-auto p-3"
        onKeyDown={(e) => {
          if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
          const items = Array.from(
            dialog.current?.querySelectorAll<HTMLAnchorElement>("a") ?? [],
          );
          const index = items.indexOf(
            document.activeElement as HTMLAnchorElement,
          );
          if (index >= 0) {
            e.preventDefault();
            items[
              (index + (e.key === "ArrowDown" ? 1 : -1) + items.length) %
                items.length
            ]?.focus();
          }
        }}
      >
        <p className="eyebrow px-3 py-2">
          {query.length >= 2 ? "Search results" : "Jump to"}
        </p>
        {pending ? (
          <p role="status" className="p-5 text-sm">
            <Loader2 className="mr-2 inline size-4 animate-spin" />
            Searching…
          </p>
        ) : error ? (
          <p role="alert" className="error-message">
            Search couldn’t connect. Change your search to retry.
          </p>
        ) : displayed.length ? (
          displayed.map((r) => (
            <Link
              className="command-option"
              key={r.type + r.id}
              href={r.href}
              onClick={onClose}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate">{r.title}</span>
                <span className="text-[10px] text-muted-foreground">
                  {r.type}
                </span>
              </span>
              <ArrowUpRight className="size-4 text-muted-foreground" />
            </Link>
          ))
        ) : (
          <p className="p-5 text-sm text-muted-foreground">
            No matches. Try a property address or task title.
          </p>
        )}
      </div>
      <p className="border-t px-5 py-3 text-[10px] text-muted-foreground">
        ↑ ↓ Navigate · Enter open · Esc close
      </p>
    </dialog>
  );
}
