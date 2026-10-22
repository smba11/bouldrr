"use client";
import Image from "next/image";
import { useRef, useState, type DragEvent } from "react";
import {
  FileText,
  Trash2,
  Upload,
  Eye,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { documentTypes } from "@/lib/constants";
import type { DocumentRecord } from "@/lib/types";
import {
  prepareUploadAction,
  finishUploadAction,
  documentUrlAction,
  deleteDocumentAction,
} from "@/lib/actions/documents";
import {
  SearchField,
  EmptyState,
  SourceBadge,
} from "@/components/workspace/primitives";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
export function DocumentManager({
  projectId,
  documents,
}: {
  projectId: string;
  documents: DocumentRecord[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<string>("Other");
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState(0);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [deleting, setDeleting] = useState<DocumentRecord | null>(null);
  function choose(f: File | undefined) {
    if (!f) return;
    if (f.size === 0 || f.size > 50 * 1024 * 1024) {
      setError("Choose a non-empty file smaller than 50 MB.");
      return;
    }
    setError("");
    setFile(f);
  }
  async function upload() {
    if (!file || pending) return;
    setPending(true);
    setError("");
    setMessage("");
    setProgress(0);
    const details = {
      projectId,
      name: file.name,
      documentType: type,
      size: file.size,
    };
    try {
      const prepared = await prepareUploadAction(details);
      if (prepared.error || !prepared.signedUrl || !prepared.path)
        throw Error(prepared.error || "Upload unavailable.");
      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("PUT", prepared.signedUrl!);
        request.timeout = 180000;
        request.setRequestHeader("x-upsert", "false");
        request.upload.onprogress = (e) => {
          if (e.lengthComputable)
            setProgress(Math.round((e.loaded / e.total) * 95));
        };
        request.onload = () =>
          request.status >= 200 && request.status < 300
            ? resolve()
            : reject(Error("The file couldn’t be uploaded. Try again."));
        request.onerror = () =>
          reject(
            Error(
              "The upload lost its connection. Your original file is unchanged.",
            ),
          );
        request.ontimeout = () =>
          reject(
            Error("The upload timed out. Try a smaller file or upload again."),
          );
        const body = new FormData();
        body.append("cacheControl", "3600");
        body.append("", file);
        request.send(body);
      });
      const result = await finishUploadAction({
        ...details,
        path: prepared.path,
      });
      if (result.error) throw Error(result.error);
      setProgress(100);
      setFile(null);
      if (input.current) input.current.value = "";
      setMessage("Document uploaded and saved privately.");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Upload couldn’t be completed. Try again.",
      );
    } finally {
      setPending(false);
    }
  }
  async function open(d: DocumentRecord) {
    setBusy(d.id);
    setError("");
    try {
      const r = await documentUrlAction(projectId, d.id);
      if (r.error || !r.url) throw Error(r.error || "Preview unavailable.");
      setPreview({
        name: d.name,
        url: r.url,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Document couldn’t be opened.");
    } finally {
      setBusy("");
    }
  }
  async function remove(d: DocumentRecord) {
    setBusy(d.id);
    setError("");
    try {
      const r = await deleteDocumentAction(projectId, d.id);
      if (r.error) throw Error(r.error);
      setDeleting(null);
      setMessage("Document deleted.");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Document couldn’t be deleted.",
      );
    } finally {
      setBusy("");
    }
  }
  const filtered = documents.filter((d) =>
    [d.name, d.document_type]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <SearchField
            label="Search documents"
            placeholder="Search files or document types…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {filtered.length ? (
            <div className="overflow-hidden rounded-xl border bg-white">
              {filtered.map((d) => (
                <article
                  key={d.id}
                  className="flex flex-wrap items-center gap-3 border-b p-4 last:border-0"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-primary">
                    <FileText className="size-5 stroke-[1.3]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {d.document_type} ·{" "}
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "America/Los_Angeles",
                      }).format(new Date(d.created_at))}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="flex size-10 items-center justify-center rounded-lg hover:bg-muted"
                      disabled={busy === d.id}
                      onClick={() => open(d)}
                      aria-label={"Preview " + d.name}
                    >
                      {busy === d.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                    <button
                      className="flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-destructive"
                      disabled={!!busy}
                      onClick={() => setDeleting(d)}
                      aria-label={"Delete " + d.name}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                documents.length
                  ? "No matching documents."
                  : "Give your project a paper trail."
              }
              description={
                documents.length
                  ? "Try a different name or document type."
                  : "Start with a survey, property record, or concept plan. Drop a file in the upload area to keep it privately with this project."
              }
            />
          )}
        </div>
        <aside className="rounded-xl border bg-white p-5">
          <h2 className="text-sm font-semibold">Add a document</h2>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            Private to your project. Up to 50 MB.
          </p>
          <div
            className={`mt-5 rounded-xl border-2 border-dashed p-5 text-center transition ${dragging ? "border-primary bg-primary/5" : "border-border"}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e: DragEvent) => {
              e.preventDefault();
              setDragging(false);
              if (!pending) choose(e.dataTransfer.files[0]);
            }}
          >
            <Upload className="mx-auto size-6 stroke-[1.3] text-primary" />
            <p className="mt-3 break-words text-xs">
              {file ? file.name : "Drop a file here"}
            </p>
            <label
              className="button-secondary mt-3 cursor-pointer"
              htmlFor="document-file"
            >
              Choose file
            </label>
            <input
              ref={input}
              id="document-file"
              type="file"
              className="sr-only"
              disabled={pending}
              onChange={(e) => choose(e.target.files?.[0])}
              aria-label="Choose project document"
            />
          </div>
          <label className="mt-5 block text-xs">
            Document type
            <select
              className="field mt-2 text-xs"
              value={type}
              disabled={pending}
              onChange={(e) => setType(e.target.value)}
            >
              {documentTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <button
            className="button-primary mt-4 w-full"
            disabled={!file || pending}
            onClick={upload}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Uploading {progress}%
              </>
            ) : (
              <>
                <Upload className="size-3.5" />
                Upload document
              </>
            )}
          </button>
          {pending && (
            <progress
              className="mt-3 h-1.5 w-full accent-primary"
              value={progress}
              max={100}
              aria-label="Upload progress"
            />
          )}
          <p className="mt-4 text-[10px] leading-5 text-muted-foreground">
            An uploaded document is user provided. Uploading it does not verify
            its contents.
          </p>
          <p className="mt-2">
            <SourceBadge type="user" />
          </p>
        </aside>
      </div>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="success-message">
          {message}
        </p>
      )}
      <Sheet
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <SheetContent className="data-[side=right]:w-full data-[side=right]:sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>{preview?.name ?? "Document preview"}</SheetTitle>
          </SheetHeader>
          {preview && (
            <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
              {/\.(png|jpe?g|webp|gif)$/i.test(preview.name) ? (
                <div className="relative min-h-80 flex-1">
                  <Image
                    unoptimized
                    fill
                    src={preview.url}
                    alt={preview.name}
                    className="object-contain"
                  />
                </div>
              ) : (
                <EmptyState
                  title="Open this file in its native app."
                  description="Use the private link below to view this document in your browser or download it. Images preview directly in Bouldrr."
                />
              )}
              <a
                className="button-primary"
                href={preview.url}
                target="_blank"
                rel="noreferrer"
              >
                Open / download file
                <ArrowUpRight className="size-4" />
              </a>
              <p className="text-[10px] text-muted-foreground">
                This private preview link expires in two minutes. Reopen the
                document for a fresh link.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
      <Sheet
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Delete this document?</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-5 pb-6">
            <p className="break-words text-sm">{deleting?.name}</p>
            <p className="text-xs leading-6 text-muted-foreground">
              This removes the private file and its project record. Keep your
              own copy if you need it later.
            </p>
            <div className="flex gap-3">
              <button
                className="button-secondary"
                disabled={!!busy}
                onClick={() => setDeleting(null)}
              >
                Keep document
              </button>
              <button
                className="button-primary bg-destructive"
                disabled={!!busy}
                onClick={() => {
                  if (deleting) void remove(deleting);
                }}
              >
                {busy ? "Deleting…" : "Delete document"}
              </button>
            </div>
            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
