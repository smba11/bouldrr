import { LoadingSkeleton } from "@/components/workspace/primitives";
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl p-6 sm:p-10">
      <LoadingSkeleton />
    </main>
  );
}
