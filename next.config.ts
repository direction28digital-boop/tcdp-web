import type { NextConfig } from "next";
import { APPLY_DESTINATION } from "./src/lib/site";

/**
 * Where "Apply to Save" goes. The value lives in src/lib/site.ts as
 * APPLY_DESTINATION, so the cutover is one edit in one file and the UI flag
 * that depends on it cannot drift out of step.
 *
 * permanent: false is load-bearing, not a default. A 308 is cached by the browser
 * indefinitely, so anybody who opened /apply during the interim would keep landing on
 * dogfoster.org after cutover and nothing on our side could undo it.
 */

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/apply", destination: APPLY_DESTINATION, permanent: false },

      // A sign-in code that lands on the homepage still signs the person in.
      //
      // Supabase redirects a verified magic link to its Site URL whenever the
      // requested redirect is not on the allow list, and it carries the code
      // with it. Without this the person lands on the homepage holding a valid
      // one-time code and nothing happens, which reads as "the link is broken"
      // at the exact moment they have proved they own their email address.
      // Costs nothing: the homepage stays static, because this is a config
      // redirect rather than a runtime check.
      {
        source: "/",
        has: [{ type: "query", key: "code" }],
        destination: "/auth/callback?code=:code",
        permanent: false,
      },
    ];
  },
  // The share card reads its fonts off disk at runtime, so keep them in the bundle.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/og/**"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/direction28digital-boop/foster-portal-importer/**",
      },
    ],
  },
};

export default nextConfig;
