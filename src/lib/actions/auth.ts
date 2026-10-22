"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  message?: string;
  success?: boolean;
  errors?: {
    fullName?: string[];
    email?: string[];
    password?: string[];
  };
};

const signUpSchema = z.object({
  fullName: z.string().min(2, "Enter your full name.").max(120),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function signUpAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      message: "Account access isn’t connected yet. Please try again later.",
    };
  }

  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
      emailRedirectTo: origin ? `${origin}/auth/confirm` : undefined,
    },
  });

  if (error) {
    return {
      message:
        error.status === 429
          ? "Too many attempts. Please wait a moment and try again."
          : "We couldn’t create your account. Check your details and try again.",
    };
  }

  if (!data.session) {
    return {
      success: true,
      message:
        "Check your email to confirm your account, then sign in. You can close this page and return after confirming.",
    };
  }
  redirect("/dashboard");
}

export async function signInAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      message: "Account access isn’t connected yet. Please try again later.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      message:
        error.status === 429
          ? "Too many attempts. Please wait a moment and try again."
          : "We couldn’t sign you in. Check your email and password, and make sure your email is confirmed.",
    };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/");
}
