"use client";
import { useActionState } from "react";
import type { PropertyRecord } from "@/lib/types";
import {
  updatePropertyAction,
  type PropertyFormState,
} from "@/lib/actions/property";
export function PropertyEditor({ property }: { property: PropertyRecord }) {
  const [state, action, pending] = useActionState(
    updatePropertyAction,
    {} as PropertyFormState,
  );
  const fields = [
    ["address", "Street address", property.address_line_1],
    ["city", "City", property.city],
    ["state", "State / region", property.state],
    ["postalCode", "ZIP / postal code", property.postal_code],
    ["county", "County", property.county ?? ""],
    ["latitude", "Latitude", property.latitude ?? ""],
    ["longitude", "Longitude", property.longitude ?? ""],
  ] as const;
  return (
    <details className="rounded-xl border bg-white p-5">
      <summary className="text-sm font-medium">Edit property location</summary>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">
        Location changes are user provided. Existing geographic drawings stay at
        their original coordinates; local sketches remain unlocated until you
        redraw them.
      </p>
      <form action={action} className="mt-5 space-y-4">
        <input type="hidden" name="projectId" value={property.project_id} />
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(([name, label, value]) => (
            <label key={name} className="text-xs font-medium">
              {label}
              <input
                name={name}
                className="field mt-2"
                defaultValue={value}
                type={
                  name === "latitude" || name === "longitude"
                    ? "number"
                    : "text"
                }
                step="any"
                required={!["county", "latitude", "longitude"].includes(name)}
              />
            </label>
          ))}
        </div>
        {state.error && (
          <p role="alert" className="error-message">
            {state.error}
          </p>
        )}
        {state.success && (
          <p role="status" className="success-message">
            Property details saved.
          </p>
        )}
        <button className="button-primary" disabled={pending}>
          {pending ? "Saving…" : "Save location"}
        </button>
      </form>
    </details>
  );
}
