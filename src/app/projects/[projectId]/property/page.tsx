import { requireUser } from "@/lib/auth";
import { getProjectShell, getSiteDesign } from "@/lib/data/projects";
import { PropertyWorkspace } from "@/components/maps/property-workspace";
import {
  PageHeader,
  InformationPanel,
  SourceBadge,
  EmptyState,
  StatusBadge,
} from "@/components/workspace/primitives";
import { PropertyEditor } from "@/components/projects/property-editor";
export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const [project, design] = await Promise.all([
    getProjectShell(projectId, user.id),
    getSiteDesign(projectId, user.id),
  ]);
  const p = project.properties[0];
  const address =
    p?.formatted_address ??
    [p?.address_line_1, p?.city, p?.state, p?.postal_code]
      .filter(Boolean)
      .join(", ");
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="The ground beneath your idea"
        title="Property"
        description="See the place. Understand the context. Shape what comes next."
      />
      <PropertyWorkspace
        projectId={projectId}
        address={address}
        latitude={p?.latitude ?? null}
        longitude={p?.longitude ?? null}
        initialFeatures={design.features}
        sourceFeatures={design.sourceFeatures}
        initialRevision={design.revision}
        initialConfiguration={design.configuration}
        initialMode={
          query.mode === "design"
            ? "design"
            : query.mode === "analyze"
              ? "analyze"
              : "view"
        }
      />
      <div className="grid gap-5 xl:grid-cols-3">
        <InformationPanel title="Property details">
          <SourceBadge type={p?.google_place_id ? "derived" : "user"} />
          <dl className="mt-4 divide-y">
            {[
              ["Address", p?.address_line_1],
              ["City", p?.city],
              ["County", p?.county],
              ["State", p?.state],
              ["Postal code", p?.postal_code],
              [
                "Coordinates",
                p?.latitude != null && p?.longitude != null
                  ? `${Number(p.latitude).toFixed(6)}, ${Number(p.longitude).toFixed(6)}`
                  : null,
              ],
              ["Parcel ID", p?.parcel_number],
            ].map(([label, value]) => (
              <div
                className="flex flex-wrap justify-between gap-2 py-3 text-xs"
                key={label}
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="max-w-full break-words text-right">
                  {value || "Not yet available"}
                </dd>
              </div>
            ))}
          </dl>
        </InformationPanel>
        <InformationPanel title="Project direction">
          <SourceBadge type="user" />
          <p className="mt-5 text-base font-medium">{project.project_type}</p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {project.description}
          </p>
          <div className="mt-6 border-t pt-4">
            <p className="mb-2 text-xs text-muted-foreground">Project stage</p>
            <StatusBadge status={project.status} />
          </div>
        </InformationPanel>
        <InformationPanel title="Jurisdiction">
          <p className="text-xs leading-6 text-muted-foreground">
            Address context is preliminary. The responsible planning authority
            still needs confirmation.
          </p>
          <ol className="mt-5 space-y-4 text-xs">
            {[
              ["Federal", "Not yet confirmed"],
              ["State", p?.state],
              ["County", p?.county],
              ["Municipality", p?.city],
              ["District", null],
              ["Parcel", p?.parcel_number],
            ].map(([label, value]) => (
              <li
                key={label}
                className="flex justify-between gap-3 border-l-2 border-primary/20 pl-3"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="text-right">
                  {value || "Not yet available"}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-[10px] leading-5 text-muted-foreground">
            Address data does not establish regulatory jurisdiction.
          </p>
        </InformationPanel>
      </div>
      <InformationPanel title="What we know—and what we need">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-medium">Known information</p>
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li>Property address: {p ? "provided" : "not yet available"}</li>
              <li>
                Location:{" "}
                {p?.latitude != null ? "coordinates saved" : "not yet located"}
              </li>
              <li>
                Site concept: {design.features.length} user-created objects
              </li>
            </ul>
            <p className="mt-4 text-[10px] text-muted-foreground">
              {p?.google_place_id
                ? "Address location from Google geocoding."
                : "Property details are user provided."}
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-medium">Still needs verification</p>
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li>Legal parcel boundary and survey</li>
              <li>Zoning district, setbacks, and permitted uses</li>
              <li>Environmental constraints and utilities</li>
              <li>Responsible planning and permitting authorities</li>
            </ul>
            <p className="mt-4">
              <SourceBadge type="unknown" />
            </p>
          </div>
        </div>
      </InformationPanel>
      {!design.features.length && (
        <EmptyState
          compact
          title="No parcel boundary is connected yet."
          description="Open Site concept to draw a manual boundary or place a building idea. User drawings stay clearly separate from verified parcel data."
        />
      )}
      {p && <PropertyEditor property={p} />}
    </div>
  );
}
