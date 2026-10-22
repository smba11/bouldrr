import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const next = params.get("next");
  let destination = "/dashboard";
  if (next?.startsWith("/") && !next.includes("\\")) {
    try {
      const candidate = new URL(next, request.url);
      if (candidate.origin === request.nextUrl.origin)
        destination = candidate.pathname + candidate.search;
    } catch {
      /* Use the dashboard for invalid destinations. */
    }
  }
  const supabase = await createClient();
  if (supabase) {
    const code = params.get("code");
    const hash = params.get("token_hash");
    const type = params.get("type");
    const allowed = [
      "signup",
      "email",
      "magiclink",
      "recovery",
      "invite",
      "email_change",
    ];
    const result = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : hash && type && allowed.includes(type)
        ? await supabase.auth.verifyOtp({
            token_hash: hash,
            type: type as EmailOtpType,
          })
        : null;
    if (result && !result.error)
      return NextResponse.redirect(new URL(destination, request.url));
  }
  return NextResponse.redirect(
    new URL("/login?confirmation=failed", request.url),
  );
}
