"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  message?: string;
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
      message:
        "Supabase is not configured yet. Add the public Supabase variables to run authentication.",
    };
  }

  const origin = (await headers()).get("origin");
  const { error } = await supabase.auth.signUp({
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
    return { message: error.message };
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
      message:
        "Supabase is not configured yet. Add the public Supabase variables to sign in.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { message: error.message };
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
