import { z } from "zod";
import { featureTypes, type FeatureType } from "@/lib/site-design";
const point = z.tuple([z.number().finite(), z.number().finite()]);
export const geometrySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Point"), coordinates: point }),
  z.object({
    type: z.literal("LineString"),
    coordinates: z.array(point).min(2).max(300),
  }),
  z
    .object({
      type: z.literal("Polygon"),
      coordinates: z.array(z.array(point).min(4).max(300)).min(1).max(1),
    })
    .refine(
      (g) =>
        g.coordinates.every(
          (r) => r[0][0] === r.at(-1)![0] && r[0][1] === r.at(-1)![1],
        ),
      "Polygon rings must be closed.",
    ),
]);
export type Geometry = z.infer<typeof geometrySchema>;
export const mapFeatureSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  feature_type: z.enum(
    Object.keys(featureTypes) as [FeatureType, ...FeatureType[]],
  ),
  geometry: geometrySchema,
  coordinate_space: z.enum(["wgs84", "local_meters"]),
  provenance: z.literal("user"),
});
export type MapFeature = z.infer<typeof mapFeatureSchema>;
export const displayFeatureSchema = mapFeatureSchema.extend({
  provenance: z.enum(["user", "official", "derived", "estimated"]),
  source_url: z.string().nullable().optional(),
});
export type DisplayMapFeature = z.infer<typeof displayFeatureSchema>;
export const conceptSchema = z.object({
  buildingType: z.string().trim().min(1).max(80),
  units: z.number().int().min(1).max(200),
  floors: z.number().int().min(1).max(60),
  footprint: z.number().min(10).max(100000),
  parking: z.number().int().min(0).max(1000),
});
export type ConceptConfiguration = z.infer<typeof conceptSchema>;
export const saveDesignSchema = z
  .object({
    projectId: z.string().uuid(),
    revision: z.number().int().min(0),
    configuration: conceptSchema,
    features: z.array(mapFeatureSchema).max(200),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    data.features.forEach((feature, index) => {
      if (seen.has(feature.id))
        ctx.addIssue({
          code: "custom",
          path: ["features", index],
          message: "Duplicate feature.",
        });
      seen.add(feature.id);
      if (feature.coordinate_space === "wgs84") {
        const points =
          feature.geometry.type === "Point"
            ? [feature.geometry.coordinates]
            : feature.geometry.type === "LineString"
              ? feature.geometry.coordinates
              : feature.geometry.coordinates.flat();
        if (points.some(([x, y]) => Math.abs(x) > 180 || Math.abs(y) > 90))
          ctx.addIssue({
            code: "custom",
            path: ["features", index],
            message: "Coordinates are outside geographic bounds.",
          });
      }
    });
  });
