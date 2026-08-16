import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Server client for Server Components, Route Handlers and Server Actions.
 * Still the publishable key, still subject to RLS: the signed-in person's
 * own policies apply. This is deliberate. Reads on the server should not
 * quietly gain powers the same read would not have in the browser.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The middleware refreshes the session, so this is safe to swallow.
          }
        },
      },
    },
  );
}

/**
 * Service-role client. BYPASSES EVERY RLS POLICY.
 *
 * Only for work with no signed-in person behind it: the deadline-alert cron
 * and writes to alert_log. Never import this into a Server Component that
 * renders for a visitor, and never pass its results straight to the client
 * without filtering them yourself, because the database will not do it for you.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing. This client must never fall back to the publishable key.",
    );
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      cookies: { getAll: () => [], setAll: () => {} },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
