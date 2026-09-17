import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request that could involve a
 * signed-in person.
 *
 * The matcher deliberately EXCLUDES the public marketing pages. `/`, `/dogs`
 * and `/dogs/[id]` are statically rendered with a 30 minute ISR window and are
 * the pages a stranger hits from a shared Facebook post on a phone. Running
 * middleware there would opt them out of the static path for no benefit:
 * nothing on those pages depends on who is looking.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser(), not getSession(): getUser revalidates the token with the auth
  // server, so a revoked or forged cookie cannot get someone into /team.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // /application is here because the page reads the session to reopen a saved
  // application, so its auth cookie has to be refreshed like any signed-in page.
  // /apply is gone: it is a redirect to /application now, not a page.
  // /auth/* and /signin are deliberately ABSENT. Nobody has a session to
  // refresh while they are in the middle of getting one, and /auth/callback
  // needs sole ownership of the auth cookies for that request: it reads the
  // PKCE code verifier and writes the session. A second client calling
  // getUser() over the same request first can rewrite those cookies, which is
  // the failure mode Supabase's own docs warn about as "users being randomly
  // logged out".
  matcher: ["/team/:path*", "/me/:path*", "/application/:path*"],
};
