"use client";
import { useState } from "react";
import { MapPin, ArrowUpRight } from "lucide-react";
import { MapPanel } from "@/components/maps/map-panel";
export function OverviewMap({
  address,
  latitude,
  longitude,
}: {
  address: string;
  latitude: number | null;
  longitude: number | null;
}) {
  const [open, setOpen] = useState(false);
  return open ? (
    <MapPanel address={address} latitude={latitude} longitude={longitude} />
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="map-fallback w-full rounded-xl border text-left"
    >
      <span>
        <MapPin className="mb-3 size-7 stroke-[1.3] text-primary" />
        <span className="block text-sm font-medium">
          Your property, in context.
        </span>
        <span className="mt-2 flex items-center gap-2 text-xs text-primary">
          Open property map
          <ArrowUpRight className="size-3.5" />
        </span>
      </span>
    </button>
  );
}
