"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { loadGoogleMaps } from "@/components/maps/google-maps";
import {
  featureTypes,
  type DisplayMapFeature,
  type Geometry,
} from "@/lib/site-design";
type Props = {
  address: string;
  latitude: number | null;
  longitude: number | null;
  features?: DisplayMapFeature[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onMapClick?: (point: [number, number]) => void;
  onFeatureChange?: (id: string, geometry: Geometry) => void;
  drawing?: boolean;
};
export function PropertyMap({
  address,
  latitude,
  longitude,
  features = [],
  selectedId,
  onSelect,
  onMapClick,
  onFeatureChange,
  drawing = false,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const callbacks = useRef({ onMapClick, onFeatureChange, onSelect });
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  const [mode, setMode] = useState("satellite");
  const [full, setFull] = useState(false);
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  useEffect(() => {
    callbacks.current = { onMapClick, onFeatureChange, onSelect };
  }, [onMapClick, onFeatureChange, onSelect]);
  useEffect(() => {
    if (!key || latitude === null || longitude === null) return;
    let disposed = false;
    let marker: google.maps.marker.AdvancedMarkerElement | undefined;
    let listener: google.maps.MapsEventListener | undefined;
    const failed = () => {
      if (!disposed) setState("error");
    };
    window.addEventListener("bouldrr:maps-error", failed);
    async function init() {
      try {
        const g = await loadGoogleMaps(key!);
        const { Map } = (await g.maps.importLibrary(
          "maps",
        )) as google.maps.MapsLibrary;
        const { AdvancedMarkerElement } = (await g.maps.importLibrary(
          "marker",
        )) as google.maps.MarkerLibrary;
        if (disposed || !canvas.current) return;
        const center = { lat: latitude!, lng: longitude! };
        map.current = new Map(canvas.current, {
          center,
          zoom: 19,
          mapId: "DEMO_MAP_ID",
          mapTypeId: "satellite",
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          gestureHandling: "cooperative",
          clickableIcons: false,
        });
        marker = new AdvancedMarkerElement({
          map: map.current,
          position: center,
          title: address,
        });
        listener = map.current.addListener(
          "click",
          (e: google.maps.MapMouseEvent) => {
            if (e.latLng)
              callbacks.current.onMapClick?.([e.latLng.lng(), e.latLng.lat()]);
          },
        );
        map.current.panTo(center);
        setState("ready");
      } catch {
        failed();
      }
    }
    void init();
    return () => {
      disposed = true;
      listener?.remove();
      if (marker) marker.map = null;
      map.current = null;
      window.removeEventListener("bouldrr:maps-error", failed);
    };
  }, [key, latitude, longitude, address, attempt]);
  useEffect(() => {
    map.current?.setMapTypeId(mode);
  }, [mode, state]);
  useEffect(() => {
    map.current?.setOptions({
      draggableCursor: drawing ? "crosshair" : undefined,
    });
  }, [drawing, state]);
  useEffect(() => {
    if (!map.current || state !== "ready") return;
    const g = google;
    const objects: (google.maps.Polygon | google.maps.Polyline)[] = [];
    const markers: google.maps.marker.AdvancedMarkerElement[] = [];
    const listeners: google.maps.MapsEventListener[] = [];
    for (const feature of features.filter(
      (f) => f.coordinate_space === "wgs84",
    )) {
      const color = featureTypes[feature.feature_type].color;
      const selected = feature.id === selectedId;
      const editable =
        selected &&
        feature.provenance === "user" &&
        !!onFeatureChange &&
        !drawing;
      if (feature.geometry.type === "Point") {
        const [lng, lat] = feature.geometry.coordinates;
        const node = document.createElement("div");
        node.style.cssText =
          "width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px #0004;background:" +
          color;
        const m = new g.maps.marker.AdvancedMarkerElement({
          map: map.current,
          position: { lat, lng },
          title: feature.name,
          content: node,
          gmpDraggable: editable,
          gmpClickable: !!onSelect,
        });
        markers.push(m);
        m.addEventListener("gmp-click", () =>
          callbacks.current.onSelect?.(feature.id),
        );
        listeners.push(
          m.addListener("dragend", () => {
            const p = m.position;
            if (p)
              callbacks.current.onFeatureChange?.(feature.id, {
                type: "Point",
                coordinates: [Number(p.lng), Number(p.lat)],
              });
          }),
        );
        continue;
      }
      const geometry = feature.geometry;
      const coords =
        geometry.type === "Polygon"
          ? geometry.coordinates[0].slice(0, -1)
          : geometry.coordinates;
      const path = coords.map(([lng, lat]) => ({ lat, lng }));
      const shape =
        geometry.type === "Polygon"
          ? new g.maps.Polygon({
              map: map.current,
              paths: path,
              fillColor: color,
              fillOpacity: 0.3,
              strokeColor: color,
              strokeWeight: selected ? 3 : 2,
              editable,
              draggable: editable,
              clickable: !drawing,
            })
          : new g.maps.Polyline({
              map: map.current,
              path,
              strokeColor: color,
              strokeWeight: selected ? 4 : 3,
              editable,
              draggable: editable,
              clickable: !drawing,
            });
      objects.push(shape);
      listeners.push(
        shape.addListener("click", () =>
          callbacks.current.onSelect?.(feature.id),
        ),
      );
      const update = () => {
        const c = shape
          .getPath()
          .getArray()
          .map((p) => [p.lng(), p.lat()] as [number, number]);
        callbacks.current.onFeatureChange?.(
          feature.id,
          geometry.type === "Polygon"
            ? { type: "Polygon", coordinates: [[...c, c[0]]] }
            : { type: "LineString", coordinates: c },
        );
      };
      // Commit on mouse-up, rather than tearing down handles on every vertex movement.
      listeners.push(
        shape.addListener("mouseup", () => {
          if (editable) update();
        }),
        shape.addListener("dragend", update),
      );
    }
    return () => {
      listeners.forEach((l) => l.remove());
      objects.forEach((s) => s.setMap(null));
      markers.forEach((m) => {
        m.map = null;
      });
    };
  }, [features, selectedId, drawing, state, onFeatureChange, onSelect]);
  useEffect(() => {
    if (!full) return;
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    root.current?.focus();
    function exit(e: KeyboardEvent) {
      if (e.key === "Escape") setFull(false);
      if (e.key === "Tab" && root.current) {
        const items = Array.from(
          root.current.querySelectorAll<HTMLElement>(
            'button, a[href], input, select, [tabindex="0"]',
          ),
        ).filter(
          (el) =>
            el.getClientRects().length > 0 && !el.hasAttribute("disabled"),
        );
        const first = items[0],
          last = items.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === root.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === root.current)
        ) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    window.addEventListener("keydown", exit);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", exit);
      previousFocus?.focus();
    };
  }, [full]);
  const unavailable =
    !key || latitude === null || longitude === null || state === "error";
  return (
    <div
      ref={root}
      tabIndex={full ? -1 : undefined}
      className={full ? "map-fullscreen" : ""}
      role={full ? "dialog" : undefined}
      aria-modal={full || undefined}
      aria-label={full ? "Expanded property map" : undefined}
    >
      <div className="map-frame">
        {!unavailable && (
          <div className="map-toolbar" role="group" aria-label="Map type">
            {["roadmap", "satellite", "terrain"].map((m) => (
              <button
                className="map-tool capitalize"
                key={m}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
              >
                {m === "roadmap" ? "Map" : m}
              </button>
            ))}
          </div>
        )}
        <button
          className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-lg border bg-white shadow-sm"
          onClick={() => setFull((v) => !v)}
          aria-label={full ? "Exit fullscreen map" : "Expand map"}
        >
          {full ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </button>
        {!unavailable && (
          <div
            className="map-canvas h-[440px] w-full"
            ref={canvas}
            aria-label={`Interactive map of ${address}`}
          />
        )}
        {unavailable ? (
          <div className="map-fallback">
            <div className="max-w-sm">
              <MapPin className="mx-auto mb-4 size-8 stroke-[1.2] text-primary" />
              <p className="text-base font-medium">
                {!key
                  ? "A place for your property."
                  : latitude === null || longitude === null
                    ? "This property needs coordinates."
                    : "The map couldn’t connect."}
              </p>
              <p className="mt-3 text-xs leading-6 text-muted-foreground">
                {!key
                  ? "Live maps aren’t connected in this workspace yet. Property details and the concept sketch below remain available."
                  : latitude === null || longitude === null
                    ? "Edit the location below to place this property on the map. Your project and tasks are ready to use."
                    : "Your work is safe. Try the map again, or continue with the site sketch below."}
              </p>
              {key && latitude !== null && longitude !== null && (
                <button
                  className="button-secondary mt-4"
                  onClick={() => {
                    setState("loading");
                    setAttempt((v) => v + 1);
                  }}
                >
                  <RefreshCw className="size-3.5" />
                  Try again
                </button>
              )}
            </div>
          </div>
        ) : (
          state === "loading" && (
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#e9ede3]"
              role="status"
            >
              <span className="animate-pulse text-xs text-primary">
                Locating your next possibility…
              </span>
            </div>
          )
        )}
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 max-w-[calc(100%-32px)] rounded-lg border bg-white/95 px-3 py-2 text-[10px] text-muted-foreground">
          {drawing ? "Click the map to place points." : address}
        </div>
      </div>
    </div>
  );
}
