// Vercel supplies these at build time. Keep a misconfigured release off production.
if (process.env.VERCEL_ENV === "production") {
  const missing = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ].filter((name) => !process.env[name]?.trim());

  if (missing.length) {
    console.error(
      `Production authentication configuration is missing: ${missing.join(", ")}. Set these in Vercel's Production environment and rebuild.`,
    );
    process.exitCode = 1;
  } else {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL.trim());
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname)
        throw Error('Invalid protocol');
    } catch {
      console.error(
        "NEXT_PUBLIC_SUPABASE_URL must contain only a valid HTTP or HTTPS URL. Remove quotes and any variable-name prefix, then rebuild.",
      );
      process.exitCode = 1;
    }
  }
}
