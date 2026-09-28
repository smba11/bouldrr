"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground">
        Bouldrr could not load this page. Try again or return to your dashboard.
      </p>
      <div className="flex gap-2">
        <Button onClick={reset} type="button">
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
