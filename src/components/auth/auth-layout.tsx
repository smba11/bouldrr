import type { ReactNode } from "react";
import { ParcelIllustration } from "@/components/workspace/product-preview";
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12 sm:px-12">
        {children}
      </div>
      <aside className="relative hidden overflow-hidden bg-[#e5eadb] lg:flex lg:flex-col lg:justify-between">
        <div className="p-12">
          <p className="eyebrow">A little land. A lot of possibility.</p>
          <h2 className="mt-5 text-4xl font-medium leading-tight tracking-[-.04em]">
            Every great project
            <br />
            starts with solid ground.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
            Understand your property. Shape your idea.
            <br />
            Find your next step.
          </p>
        </div>
        <div className="relative -mr-16 mb-10 ml-10 rotate-[-8deg] overflow-hidden rounded-3xl border border-white/60 shadow-xl">
          <ParcelIllustration className="w-full" />
          <p className="absolute bottom-4 left-4 rounded-lg bg-white/90 px-3 py-2 text-[10px]">
            Product illustration · Conceptual Site Plan
          </p>
        </div>
      </aside>
    </main>
  );
}
