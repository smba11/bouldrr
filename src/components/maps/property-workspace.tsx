"use client";
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { SiteDesigner } from "@/components/maps/site-designer";
const Designer = dynamic(
  () => import("@/components/maps/site-designer").then((m) => m.SiteDesigner),
  {
    ssr: false,
    loading: () => (
      <div
        className="skeleton h-[440px]"
        role="status"
        aria-label="Loading property workspace"
      />
    ),
  },
);
export function PropertyWorkspace(props: ComponentProps<typeof SiteDesigner>) {
  return <Designer {...props} />;
}
