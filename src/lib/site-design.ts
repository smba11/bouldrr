export const featureTypes = {
  parcel_boundary: { label: "Property Boundary", color: "#6b8060" },
  building: { label: "Proposed Structure", color: "#315647" },
  driveway: { label: "Driveway", color: "#9b8e74" },
  parking: { label: "Parking", color: "#677d8e" },
  landscape: { label: "Landscaping", color: "#8b9f54" },
  setback: { label: "Required Setback", color: "#b58c37" },
  restricted_area: { label: "Restricted Area", color: "#b36c5c" },
  buildable_area: { label: "Buildable Area", color: "#6f9985" },
  note: { label: "Notes", color: "#7b6c8f" },
} as const;
export type FeatureType = keyof typeof featureTypes;

export type Geometry =
  | { type: "Point"; coordinates: [number, number] }
  | { type: "LineString"; coordinates: [number, number][] }
  | { type: "Polygon"; coordinates: [number, number][][] };
export type MapFeature = {
  id: string;
  name: string;
  feature_type: FeatureType;
  geometry: Geometry;
  coordinate_space: "wgs84" | "local_meters";
  provenance: "user";
};
export type DisplayMapFeature = Omit<MapFeature, "provenance"> & {
  provenance: "user" | "official" | "derived" | "estimated";
  source_url?: string | null;
};
export type ConceptConfiguration = {
  buildingType: string;
  units: number;
  floors: number;
  footprint: number;
  parking: number;
};
export const defaultConcept: ConceptConfiguration = {
  buildingType: "Townhomes",
  units: 4,
  floors: 3,
  footprint: 240,
  parking: 8,
};
export type Anchor = { lat: number; lng: number } | null;
export function toGeographic(
  [x, y]: [number, number],
  anchor: Anchor,
): [number, number] {
  // The sketch is 100 m across; local coordinates are never claimed as parcel geometry.
  return anchor
    ? [
        anchor.lng +
          (x / 8 - 50) /
            (111320 * Math.max(0.01, Math.cos((anchor.lat * Math.PI) / 180))),
        anchor.lat - (y / 8 - 31.25) / 111320,
      ]
    : [x / 8, y / 8];
}
export function toCanvas(
  [x, y]: [number, number],
  anchor: Anchor,
  space: MapFeature["coordinate_space"],
): [number, number] {
  return anchor && space === "wgs84"
    ? [
        (50 +
          (x - anchor.lng) *
            111320 *
            Math.max(0.01, Math.cos((anchor.lat * Math.PI) / 180))) *
          8,
        (31.25 - (y - anchor.lat) * 111320) * 8,
      ]
    : [x * 8, y * 8];
}
export function mapGeometry(
  geometry: Geometry,
  transform: (p: [number, number]) => [number, number],
): Geometry {
  if (geometry.type === "Point")
    return { type: "Point", coordinates: transform(geometry.coordinates) };
  if (geometry.type === "LineString")
    return {
      type: "LineString",
      coordinates: geometry.coordinates.map(transform),
    };
  return {
    type: "Polygon",
    coordinates: geometry.coordinates.map((r) => r.map(transform)),
  };
}
