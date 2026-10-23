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

  if (!process.exitCode) {
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.trim();
    let isPublicKey = key.startsWith("sb_publishable_");
    if (!isPublicKey) {
      try {
        const claims = JSON.parse(Buffer.from(key.split(".")[1], "base64url"));
        isPublicKey = claims.role === "anon";
      } catch {
        // A private key or assignment string must never be bundled as public config.
      }
    }
    if (!isPublicKey) {
      console.error(
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must contain only a publishable key or legacy anon key. Never use a secret or service-role key.",
      );
      process.exitCode = 1;
    } else {
      try {
        const base = process.env.NEXT_PUBLIC_SUPABASE_URL.trim().replace(/\/$/, "");
        const response = await fetch(`${base}/auth/v1/health`, {
          headers: { apikey: key },
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) {
          console.error(
            `Production Supabase configuration check failed (HTTP ${response.status}). Verify the project URL and matching publishable key, then rebuild.`,
          );
          process.exitCode = 1;
        }
      } catch {
        console.error(
          "Production Supabase configuration could not be verified. Check the URL and connection, then rebuild.",
        );
        process.exitCode = 1;
      }
    }
  }
}
