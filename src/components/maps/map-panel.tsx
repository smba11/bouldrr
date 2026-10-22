"use client";
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { PropertyMap } from "@/components/maps/property-map";
const LazyMap = dynamic(
  () => import("@/components/maps/property-map").then((m) => m.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="skeleton h-[440px] rounded-2xl"
        role="status"
        aria-label="Loading property map"
      />
    ),
  },
);
export function MapPanel(props: ComponentProps<typeof PropertyMap>) {
  return <LazyMap {...props} />;
}
