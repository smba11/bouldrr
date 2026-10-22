import { LoadingSkeleton } from "@/components/workspace/primitives";
export default function LoadingDashboard() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl p-6 sm:p-10">
      <LoadingSkeleton />
    </main>
  );
}
