import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="space-y-4 p-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </main>
  );
}
