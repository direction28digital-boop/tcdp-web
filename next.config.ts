import type { NextConfig } from "next";

/**
 * The application lives at /application on this site (decided 2026-09-10). dogfoster.org
 * redirects here at the registrar, so the old address keeps working forever and the
 * WordPress install behind it can be switched off.
 *
 * /apply stays as a permanent alias because it is printed on flyers and pasted into
 * Facebook posts that nobody can go back and edit.
 */

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/apply", destination: "/application", permanent: true },

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
