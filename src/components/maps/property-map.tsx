"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { loadGoogleMaps } from "@/components/maps/google-maps";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type PropertyMapProps = {
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export function PropertyMap({ address, latitude, longitude }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    let cancelled = false;

    async function renderMap() {
      if (!apiKey || latitude === null || longitude === null || !mapRef.current) {
        return;
      }

      try {
        const google = await loadGoogleMaps(apiKey);

        if (cancelled || !mapRef.current) {
          return;
        }

        const center = { lat: latitude, lng: longitude };
        const map = new google.maps.Map(mapRef.current, {
          center,
          mapTypeControl: false,
          streetViewControl: false,
          zoom: 17,
        });
        new google.maps.Marker({ map, position: center });
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Could not load Google Maps.",
        );
      }
    }

    void renderMap();

    return () => {
      cancelled = true;
    };
  }, [apiKey, latitude, longitude]);

  if (!apiKey) {
    return (
      <Alert>
        <MapPin className="size-4" />
        <AlertTitle>Map disabled</AlertTitle>
        <AlertDescription>
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show live property maps.
        </AlertDescription>
      </Alert>
    );
  }

  if (latitude === null || longitude === null) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        Locate this property with Google Maps during project creation to show a
        live map here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        aria-label={`Map for ${address}`}
        className="aspect-square overflow-hidden rounded-lg border bg-muted/40"
        ref={mapRef}
      />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
