import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
