"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthFormState } from "@/lib/actions/auth";
import { signInAction, signUpAction } from "@/lib/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFormProps = {
  mode: "login" | "signup";
};

const initialState: AuthFormState = {};

export function AuthForm({ mode }: AuthFormProps) {
  const action = mode === "signup" ? signUpAction : signInAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isSignup = mode === "signup";

  return (
    <Card className="w-full max-w-md border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>{isSignup ? "Create your Bouldrr account" : "Welcome back"}</CardTitle>
        <CardDescription>
          {isSignup
            ? "Start organizing property research, tasks, documents, and questions."
            : "Sign in to continue your development workspace."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" autoComplete="name" />
              {state.errors?.fullName && (
                <p className="text-sm text-destructive">
                  {state.errors.fullName.join(" ")}
                </p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" />
            {state.errors?.email && (
              <p className="text-sm text-destructive">
                {state.errors.email.join(" ")}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
            {state.errors?.password && (
              <p className="text-sm text-destructive">
                {state.errors.password.join(" ")}
              </p>
            )}
          </div>
          {state.message && (
            <Alert>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <Button className="w-full" disabled={pending}>
            {pending ? "Working..." : isSignup ? "Create account" : "Sign in"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account?" : "New to Bouldrr?"}{" "}
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href={isSignup ? "/login" : "/signup"}
          >
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
