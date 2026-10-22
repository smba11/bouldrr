import Link from "next/link";
import type { SVGProps } from "react";

export function BouldrrMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8 9.5 21 4.8a7 7 0 0 1 6.5 1l7 5.1a6.5 6.5 0 0 1 2.3 7.4l-4.3 12a7 7 0 0 1-5.5 4.5L13.4 37a7 7 0 0 1-7.8-5.3L2.2 18a7.2 7.2 0 0 1 5.8-8.5Z"
        fill="currentColor"
      />
      <path
        d="m10 17 11-4 9 5-11 4-9-5Zm1 7 8 4 10-4M12 30l7 3 8-3"
        stroke="var(--mark-line, #f6f5ef)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({
  href = "/",
  light = false,
}: {
  href?: string;
  light?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label="Bouldrr home"
      className={`inline-flex items-center gap-2.5 text-2xl font-semibold tracking-[-.065em] ${light ? "text-white" : "text-foreground"}`}
    >
      <BouldrrMark
        className={`size-9 ${light ? "text-white [--mark-line:#263e34]" : "text-primary"}`}
      />
      bouldrr<span className="-ml-1 text-primary">.</span>
    </Link>
  );
}

export function LoadingMark() {
  return (
    <span
      role="status"
      className="inline-flex items-center gap-3 text-sm text-muted-foreground"
    >
      <BouldrrMark className="size-7 animate-pulse text-primary" />
      <span>Getting things in place…</span>
    </span>
  );
}
