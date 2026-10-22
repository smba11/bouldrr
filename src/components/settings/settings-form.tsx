"use client";
import { useActionState } from "react";
import {
  updateSettingsAction,
  type SettingsState,
} from "@/lib/actions/settings";
export function SettingsForm({
  fullName,
  preferredLanguage,
}: {
  fullName?: string | null;
  preferredLanguage?: string | null;
}) {
  const [state, action, pending] = useActionState(
    updateSettingsAction,
    {} as SettingsState,
  );
  return (
    <form
      action={action}
      className="max-w-xl space-y-6 rounded-2xl border bg-white p-6"
    >
      <h2 className="text-base font-semibold">Your profile</h2>
      <label className="block text-xs font-medium">
        Full name
        <input
          className="field mt-2"
          name="fullName"
          defaultValue={fullName ?? ""}
          minLength={2}
          maxLength={120}
          required
        />
      </label>
      <label className="block text-xs font-medium">
        Preferred language
        <select
          className="field mt-2"
          name="preferredLanguage"
          defaultValue={preferredLanguage ?? "en"}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
        </select>
      </label>
      <p className="text-xs leading-6 text-muted-foreground">
        This saves your preference for future translations. The interface
        currently uses English.
      </p>
      <button className="button-primary" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
      {state.error && (
        <p role="alert" className="error-message">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="success-message">
          Your profile is saved.
        </p>
      )}
    </form>
  );
}
