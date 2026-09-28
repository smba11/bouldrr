export type PublicEnv = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

export function getPublicEnv(): PublicEnv | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  };
}

export function isOpenAIEnabled() {
  return Boolean(process.env.OPENAI_API_KEY);
}
