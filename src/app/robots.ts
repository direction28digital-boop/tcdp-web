import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // /application is the point of the site, so it stays indexable. Everything behind
    // a sign-in is not: those pages hold applicants' home and household details.
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/team", "/me", "/signin", "/auth"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
