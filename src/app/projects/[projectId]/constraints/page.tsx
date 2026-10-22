import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getProjectShell } from "@/lib/data/projects";
import {
  PageHeader,
  InformationPanel,
  SourceBadge,
} from "@/components/workspace/primitives";
export default async function Constraints({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireUser();
  await getProjectShell(projectId, user.id);
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Understand the limits"
        title="Site constraints"
        description="Missing constraint data is an open question, never an all-clear."
      />
      <div className="grid gap-5 md:grid-cols-2">
        {[
          "Flood & drainage",
          "Wetlands & environmental",
          "Easements & access",
          "Slope & terrain",
          "Utilities & capacity",
          "Zoning & setbacks",
        ].map((t) => (
          <InformationPanel key={t} title={t}>
            <SourceBadge type="unknown" />
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              Data source not connected. Collect the relevant official map,
              survey, utility record, or agency determination for this property.
            </p>
          </InformationPanel>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          className="button-primary"
          href={`/projects/${projectId}/property?mode=analyze`}
        >
          Open map layers
        </Link>
        <Link
          className="button-secondary"
          href={`/projects/${projectId}/documents`}
        >
          Add supporting documents
        </Link>
      </div>
    </div>
  );
}
