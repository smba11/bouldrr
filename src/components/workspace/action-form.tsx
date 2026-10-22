"use client";
import { useActionState, type ReactNode } from "react";
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (data: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
}) {
  const [state, run, pending] = useActionState<
    { error?: string; success?: boolean },
    FormData
  >(async (_previous, form) => {
    try {
      await action(form);
      return { success: true };
    } catch {
      return {
        error:
          "Your changes couldn’t be saved. Check the fields and try again.",
      };
    }
  }, {});
  return (
    <form action={run} className={className} aria-busy={pending}>
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {pending && (
        <p role="status" className="mt-2 text-xs text-muted-foreground">
          Saving…
        </p>
      )}
      {state.error && (
        <p role="alert" className="error-message mt-3">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="mt-3 text-xs text-primary">
          Saved.
        </p>
      )}
    </form>
  );
}
