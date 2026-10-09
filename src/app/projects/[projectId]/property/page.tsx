import { requireUser } from "@/lib/auth";
import { getProjectWorkspace } from "@/lib/data/projects";
import { PropertyMap } from "@/components/maps/property-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  const project = await getProjectWorkspace(projectId, user.id);
  const property = project.properties[0];
  const jurisdiction = property
    ? `${property.city}, ${property.state}${property.county ? ` · ${property.county} County` : ""}`
    : "Not identified";
  const address = property
    ? `${property.address_line_1}, ${property.city}, ${property.state} ${property.postal_code}`
    : project.name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Property</h1>
        <p className="mt-2 text-muted-foreground">
          Bouldrr identifies jurisdiction from the address fields for now.
          Geocoding and parcel integrations can be added behind this page later.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Property overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[
              ["Address", property?.address_line_1],
              ["City", property?.city],
              ["County", property?.county ?? "Not added"],
              ["State", property?.state],
              ["ZIP", property?.postal_code],
              ["Google address", property?.formatted_address ?? "Not located"],
              [
                "Coordinates",
                property?.latitude != null && property?.longitude != null
                  ? `${property.latitude}, ${property.longitude}`
                  : "Not located",
              ],
              ["Parcel number", property?.parcel_number ?? "Not added"],
              ["Project type", project.project_type],
              ["Jurisdiction", jurisdiction],
              ["Zoning", "Not verified yet"],
            ].map(([label, value]) => (
              <div className="rounded-lg border p-3" key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 font-medium">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Map</CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyMap
              address={address}
              latitude={property?.latitude ?? null}
              longitude={property?.longitude ?? null}
            />
          </CardContent>
        </Card>
      </div>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Project notes</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          {project.description}
        </CardContent>
      </Card>
    </div>
  );
}
