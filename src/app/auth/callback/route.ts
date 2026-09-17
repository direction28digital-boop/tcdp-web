import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Where a magic link lands. Exchanges the one-time code for a session, then
 * forwards the person to wherever they were headed before they signed in.
 *
 * This route is deliberately NOT in the middleware matcher. It owns its own
 * cookies: exchangeCodeForSession reads the PKCE code verifier that the browser
 * stored when the link was requested, and writes the session cookies itself.
 * There is no session to refresh in the middle of signing in, so running a
 * second Supabase client over the same request first buys nothing and can
 * rewrite the very cookies this exchange depends on.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/me";

  // Only ever redirect to a path on this site. Without this check, a crafted
  // link could bounce someone straight off to another domain carrying the
  // trust of having just signed in here.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/me";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);

    // Say why, in the runtime logs. Swallowing this meant the only way to
    // diagnose a failed sign-in was to reason it out from the auth logs on
    // Supabase's side, which showed the link verifying perfectly.
    console.error("[auth/callback] code exchange failed", {
      name: error.name,
      status: error.status,
      message: error.message,
      next: safeNext,
    });
  } else {
    console.error("[auth/callback] reached with no code parameter", {
      next: safeNext,
      params: [...searchParams.keys()],
    });
  }

  // Already signed in? Then a stale or second-clicked link is not a failure
  // worth a dead end. Email clients prefetch links, people click twice, and
  // somebody who applied five minutes ago still has a good session. Send them
  // where they were going instead of telling them sign-in is broken.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return NextResponse.redirect(`${origin}${safeNext}`);

  // No claim about WHY. The old copy asserted "they expire after an hour" for
  // every possible failure, which is a diagnosis this route cannot make and
  // sent us looking at expiry for a link that had verified twenty seconds
  // earlier. Name the two real causes and the way out.
  return NextResponse.redirect(
    `${origin}/signin?error=${encodeURIComponent(
      "That sign-in link did not work. Each link works once, and only in the browser you asked for it from. Ask for a fresh one below and open it here.",
    )}`,
  );
}
