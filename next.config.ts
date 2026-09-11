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
    return [{ source: "/apply", destination: "/application", permanent: true }];
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
