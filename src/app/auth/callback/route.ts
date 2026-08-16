import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Where a magic link lands. Exchanges the one-time code for a session, then
 * forwards the person to wherever they were headed before they signed in.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/me";

  // Only ever redirect to a path on this site. Without this check, a crafted
  // link could bounce someone straight off to another domain carrying the
  // trust of having just signed in here.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/me";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }

  return NextResponse.redirect(
    `${origin}/signin?error=${encodeURIComponent(
      "That sign-in link did not work. They expire after an hour, so ask for a fresh one.",
    )}`,
  );
}
