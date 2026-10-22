"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, MapPin } from "lucide-react";
import {
  createProjectAction,
  type ProjectFormState,
} from "@/lib/actions/projects";
import { projectTypes } from "@/lib/constants";
import {
  AddressLocator,
  blankAddress,
  type LocatedAddress,
} from "@/components/maps/address-locator";
import { MapPanel } from "@/components/maps/map-panel";
import { Wordmark, LoadingMark } from "@/components/brand";
import { SourceBadge } from "@/components/workspace/primitives";
const steps = [
  "Find a property",
  "Confirm the location",
  "Choose your direction",
  "Describe the goal",
];
export function NewProjectForm() {
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState<LocatedAddress>(blankAddress);
  const [type, setType] = useState("");
  const [goal, setGoal] = useState("");
  const [state, action, pending] = useActionState(
    createProjectAction,
    {} as ProjectFormState,
  );
  const validAddress =
    address.addressLine1.trim().length >= 3 &&
    address.city.trim().length >= 2 &&
    address.state.trim().length >= 2 &&
    address.postalCode.trim().length >= 3;
  const coordinates =
    address.latitude !== "" &&
    address.longitude !== "" &&
    Number.isFinite(Number(address.latitude)) &&
    Number.isFinite(Number(address.longitude));
  function edit(key: keyof LocatedAddress, value: string) {
    setAddress((a) => ({
      ...a,
      [key]: value,
      googlePlaceId: "",
      formattedAddress: "",
      ...(key === "latitude" || key === "longitude"
        ? {}
        : { latitude: "", longitude: "" }),
    }));
  }
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-10 flex items-center justify-between">
        <Wordmark href="/dashboard" />
        <Link href="/dashboard" className="button-secondary">
          <ArrowLeft className="size-4" />
          Your projects
        </Link>
      </div>
      <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside>
          <p className="eyebrow">A solid starting point.</p>
          <h1 className="mt-4 text-3xl font-medium tracking-[-.04em]">
            Let’s put your
            <br />
            idea on the map.
          </h1>
          <ol className="mt-8 space-y-4">
            {steps.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-xs">
                <span
                  className={`flex size-7 items-center justify-center rounded-full border ${step === i + 1 ? "border-primary bg-primary text-white" : step > i + 1 ? "border-primary/20 bg-primary/10 text-primary" : "text-muted-foreground"}`}
                >
                  {step > i + 1 ? <Check className="size-3.5" /> : i + 1}
                </span>
                <span
                  className={
                    step === i + 1 ? "font-medium" : "text-muted-foreground"
                  }
                >
                  {s}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-8 hidden max-w-48 text-xs leading-6 text-muted-foreground lg:block">
            No zoning claims. No made-up parcel data. Just a useful place to
            start.
          </p>
        </aside>
        <div className="min-w-0 rounded-2xl border bg-white p-5 sm:p-8">
          {pending ? (
            <div
              className="flex min-h-[480px] flex-col items-center justify-center text-center"
              role="status"
            >
              <LoadingMark />
              <h2 className="mt-8 text-2xl font-medium tracking-tight">
                Laying the groundwork.
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
                Saving your property and address context, creating your
                workspace, and building a starter project plan.
              </p>
              <p className="mt-6 text-xs text-muted-foreground">
                Local rules and zoning will still need verification.
              </p>
            </div>
          ) : (
            <form
              action={action}
              onSubmit={(e) => {
                if (step < 4) {
                  e.preventDefault();
                  if (
                    (step === 1 && validAddress) ||
                    step === 2 ||
                    (step === 3 && type)
                  )
                    setStep((s) => s + 1);
                }
              }}
              className="space-y-6"
            >
              {Object.entries(address).map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value} />
              ))}
              <input type="hidden" name="projectType" value={type} />
              <input type="hidden" name="description" value={goal} />
              <p className="eyebrow">Step {step} of 4</p>
              {step === 1 && (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-medium tracking-tight">
                      Find a property.
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Search an address or enter the details you already know.
                    </p>
                  </div>
                  <AddressLocator
                    onLocate={(a) => {
                      setAddress(a);
                      setStep(2);
                    }}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="field-label" htmlFor="street">
                        Street address
                      </label>
                      <input
                        id="street"
                        className="field"
                        value={address.addressLine1}
                        onChange={(e) => edit("addressLine1", e.target.value)}
                        autoComplete="street-address"
                        placeholder="123 Grove Street"
                        required
                        maxLength={250}
                      />
                    </div>
                    {(
                      [
                        ["city", "City", "address-level2"],
                        ["state", "State / region", "address-level1"],
                        ["postalCode", "ZIP / postal code", "postal-code"],
                        ["county", "County (if known)", ""],
                      ] as const
                    ).map(([key, label, auto]) => (
                      <div key={key}>
                        <label className="field-label" htmlFor={key}>
                          {label}
                        </label>
                        <input
                          id={key}
                          className="field"
                          value={address[key]}
                          onChange={(e) => edit(key, e.target.value)}
                          autoComplete={auto || undefined}
                          required={key !== "county"}
                          maxLength={120}
                        />
                      </div>
                    ))}
                  </div>
                  <details className="rounded-lg border p-4">
                    <summary className="text-xs font-medium">
                      Add coordinates (optional)
                    </summary>
                    <p className="my-3 text-xs leading-6 text-muted-foreground">
                      Use known coordinates to anchor your site concept. Leave
                      blank if you haven’t located the property.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(["latitude", "longitude"] as const).map((k) => (
                        <div key={k}>
                          <label htmlFor={k} className="field-label capitalize">
                            {k}
                          </label>
                          <input
                            id={k}
                            className="field"
                            type="number"
                            step="any"
                            min={k === "latitude" ? -90 : -180}
                            max={k === "latitude" ? 90 : 180}
                            value={address[k]}
                            onChange={(e) => edit(k, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </details>
                </section>
              )}
              {step === 2 && (
                <section className="space-y-5">
                  <h2 className="text-2xl font-medium tracking-tight">
                    Make sure this is the place.
                  </h2>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <MapPin className="size-4 text-primary" />
                        {address.formattedAddress ||
                          [
                            address.addressLine1,
                            address.city,
                            address.state,
                            address.postalCode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                      </p>
                      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                        {coordinates
                          ? `${Number(address.latitude).toFixed(6)}, ${Number(address.longitude).toFixed(6)}`
                          : "Coordinates not yet available"}
                      </p>
                    </div>
                    <SourceBadge
                      type={address.googlePlaceId ? "derived" : "user"}
                    />
                  </div>
                  <MapPanel
                    address={address.formattedAddress || address.addressLine1}
                    latitude={coordinates ? Number(address.latitude) : null}
                    longitude={coordinates ? Number(address.longitude) : null}
                  />
                  <p className="text-xs leading-6 text-muted-foreground">
                    The marker identifies the address location. It does not
                    establish the legal parcel boundary or confirm jurisdiction.
                  </p>
                </section>
              )}
              {step === 3 && (
                <section className="space-y-5">
                  <h2 className="text-2xl font-medium tracking-tight">
                    What are you trying to do?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Choose a starting direction. Your goal will give it context.
                  </p>
                  <fieldset className="grid gap-3 sm:grid-cols-2">
                    <legend className="sr-only">Development direction</legend>
                    {projectTypes.map((t, i) => (
                      <label
                        key={t}
                        className={`flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition ${type === t ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}
                      >
                        <input
                          className="size-4 accent-primary"
                          type="radio"
                          name="visibleType"
                          value={t}
                          checked={type === t}
                          onChange={() => setType(t)}
                        />
                        <span>
                          <span className="mb-1 block font-mono text-[9px] text-muted-foreground">
                            0{i + 1}
                          </span>
                          {t}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                </section>
              )}
              {step === 4 && (
                <section className="space-y-5">
                  <h2 className="text-2xl font-medium tracking-tight">
                    Tell us your vision.
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    What would a successful project look like?
                  </p>
                  <label htmlFor="goal" className="field-label">
                    Your development goal
                  </label>
                  <textarea
                    id="goal"
                    className="field min-h-40"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="I want to build four townhomes with attached garages."
                    minLength={8}
                    maxLength={5000}
                    required
                  />
                  <div className="rounded-xl bg-muted/60 p-5 text-sm">
                    <p className="font-medium">{address.addressLine1}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {address.city}, {address.state} · {type}
                    </p>
                    <p className="mt-4 text-xs leading-6 text-muted-foreground">
                      We’ll save your property and create a general development
                      checklist. Official parcel data, zoning, permits, and
                      feasibility are not automatically verified.
                    </p>
                  </div>
                </section>
              )}
              {state.message && (
                <div role="alert" className="error-message">
                  <p>{state.message}</p>
                  {state.errors && (
                    <ul className="mt-2 list-inside list-disc text-xs">
                      {Object.entries(state.errors).map(([k, v]) => (
                        <li key={k}>
                          {k}: {v?.join(" ")}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div className="flex justify-between gap-3 border-t pt-5">
                <button
                  className="button-secondary"
                  type="button"
                  disabled={step === 1}
                  onClick={() => setStep((s) => s - 1)}
                >
                  <ArrowLeft className="size-4" />
                  Back
                </button>
                {step < 4 ? (
                  <button
                    className="button-primary"
                    type="button"
                    disabled={
                      step === 1 ? !validAddress : step === 3 ? !type : false
                    }
                    onClick={() => setStep((s) => s + 1)}
                  >
                    {step === 2 ? "Confirm location" : "Continue"}
                    <ArrowRight className="size-4" />
                  </button>
                ) : (
                  <button
                    className="button-primary"
                    type="submit"
                    disabled={goal.trim().length < 8}
                  >
                    <Loader2 className="hidden size-4" />
                    Create workspace
                    <ArrowRight className="size-4" />
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
