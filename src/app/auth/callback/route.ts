import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Where a magic link lands.
 *
 * This route is deliberately NOT in the middleware matcher. It owns its own
 * cookies for this request, and there is no session to refresh in the middle
 * of getting one.
 *
 * TWO flows are accepted, and the order matters.
 *
 * 1. token_hash + type, verified with verifyOtp. THE ONE THAT WORKS EVERYWHERE.
 *    Nothing has to be waiting in the clicking browser, so a link opened on a
 *    phone after applying on a laptop still signs the person in.
 *
 * 2. code, exchanged with exchangeCodeForSession. PKCE. This one needs the code
 *    verifier that the browser stored when the link was requested, so it fails
 *    whenever the link is opened anywhere else: another device, another
 *    browser, or the in-app browser an email client opens instead of the
 *    default one. Kept as a fallback so links already in flight still work.
 *
 * Someone applying to foster a dog on a four day clock will fill the form on
 * whatever is to hand and read the email on their phone. Flow 2 fails that
 * person at the exact moment they have finished a 65 field form, so flow 1 is
 * the one the email template should be producing.
 */

const OTP_TYPES: readonly EmailOtpType[] = [
  "email",
  "magiclink",
  "recovery",
  "invite",
  "signup",
  "email_change",
];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const next = searchParams.get("next") ?? "/me";

  // Only ever redirect to a path on this site. Without this check, a crafted
  // link could bounce someone straight off to another domain carrying the
  // trust of having just signed in here.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/me";

  const supabase = await createClient();

  // Flow 1: device independent.
  if (tokenHash) {
    // Never hand an unvalidated string to verifyOtp. An unrecognised type is
    // treated as a plain email link rather than passed through.
    const type: EmailOtpType =
      rawType && OTP_TYPES.includes(rawType as EmailOtpType)
        ? (rawType as EmailOtpType)
        : "email";

    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);

    console.error("[auth/callback] verifyOtp failed", {
      name: error.name,
      status: error.status,
      message: error.message,
      type,
      next: safeNext,
    });
  }

  // Flow 2: PKCE, same browser only.
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
  }

  if (!tokenHash && !code) {
    console.error("[auth/callback] reached with neither token_hash nor code", {
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
  // earlier.
  return NextResponse.redirect(
    `${origin}/signin?error=${encodeURIComponent(
      "That sign-in link did not work. Each link can only be used once. Ask for a fresh one below.",
    )}`,
  );
}
