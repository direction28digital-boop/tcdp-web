import type { NextConfig } from "next";

/**
 * Where "Apply to Save" goes. This is the ONLY place to change when the rescue moves
 * the application (for example to their Jotform). Every button on the site links to
 * /apply, and /apply forwards here.
 */
const APPLY_URL = "https://dogfoster.org";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/apply", destination: APPLY_URL, permanent: false }];
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
