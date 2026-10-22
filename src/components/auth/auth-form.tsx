"use client";
import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  signInAction,
  signUpAction,
  type AuthFormState,
} from "@/lib/actions/auth";
import { Wordmark } from "@/components/brand";
export function AuthForm({
  mode,
  confirmationFailed = false,
}: {
  mode: "login" | "signup";
  confirmationFailed?: boolean;
}) {
  const signup = mode === "signup";
  const [state, action, pending] = useActionState(
    signup ? signUpAction : signInAction,
    {} as AuthFormState,
  );
  return (
    <div className="w-full max-w-sm">
      <Wordmark />
      <p className="eyebrow mt-12">
        {signup ? "Start with a possibility." : "Back to your groundwork."}
      </p>
      <h1 className="mt-3 text-3xl font-medium tracking-[-.04em]">
        {signup ? "Make room for your next idea." : "Welcome back."}
      </h1>
      <p className="mb-8 mt-3 text-sm leading-6 text-muted-foreground">
        {signup
          ? "Create your private workspace. Bring the property; we’ll help organize the path forward."
          : "Your properties, plans, and next steps are right where you left them."}
      </p>
      <form action={action} className="space-y-5" aria-busy={pending}>
        {signup && (
          <div>
            <label className="field-label" htmlFor="fullName">
              Full name
            </label>
            <input
              className="field"
              id="fullName"
              name="fullName"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              aria-invalid={!!state.errors?.fullName}
              aria-describedby="name-error"
            />
            <p id="name-error" className="mt-1 text-xs text-destructive">
              {state.errors?.fullName?.join(" ")}
            </p>
          </div>
        )}
        <div>
          <label className="field-label" htmlFor="email">
            Email address
          </label>
          <input
            className="field"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={!!state.errors?.email}
            aria-describedby="email-error"
          />
          <p id="email-error" className="mt-1 text-xs text-destructive">
            {state.errors?.email?.join(" ")}
          </p>
        </div>
        <div>
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            className="field"
            id="password"
            name="password"
            type="password"
            autoComplete={signup ? "new-password" : "current-password"}
            required
            minLength={signup ? 8 : 1}
            aria-invalid={!!state.errors?.password}
            aria-describedby="password-help"
          />
          <p id="password-help" className="mt-2 text-xs text-muted-foreground">
            {state.errors?.password?.join(" ") ||
              (signup ? "At least 8 characters." : "")}
          </p>
        </div>
        {confirmationFailed && (
          <p className="error-message" role="alert">
            This confirmation link has expired or was already used. Try signing
            in, or request a new confirmation by signing up again.
          </p>
        )}
        {state.message && (
          <p
            role={state.success ? "status" : "alert"}
            className={state.success ? "success-message" : "error-message"}
          >
            {state.message}
          </p>
        )}
        <button
          className="button-primary w-full"
          disabled={pending || state.success}
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              One moment…
            </>
          ) : (
            <>
              {signup ? "Create account" : "Sign in"}
              <ArrowRight className="size-4" />
            </>
          )}
        </button>
      </form>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        {signup ? "Already laying the groundwork?" : "Have an idea to build?"}{" "}
        <Link
          className="font-medium text-primary underline-offset-4 hover:underline"
          href={signup ? "/login" : "/signup"}
        >
          {signup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
