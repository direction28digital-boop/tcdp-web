"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Browser client. Uses the PUBLISHABLE key, which is safe to ship: every table
 * is behind RLS, so this key can only ever see what the signed-in person is
 * allowed to see. The service role key must never appear in this file or any
 * other file under src/ that ships to the browser.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
