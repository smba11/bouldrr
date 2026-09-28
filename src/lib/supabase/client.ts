"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/types";

export function createClient() {
  const env = getPublicEnv();

  if (!env) {
    throw new Error("Supabase public environment variables are not configured.");
  }

  return createBrowserClient<Database>(
    env.supabaseUrl,
    env.supabasePublishableKey,
  );
}
