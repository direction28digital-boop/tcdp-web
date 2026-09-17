import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // /application is disallowed until cutover. It is live and testable, but the public
    // is still sent to the WordPress form, and an indexed second application would put
    // people into a queue nobody is working. Allow it the day APPLY_URL flips.
    //
    // Everything behind a sign-in stays out permanently: those pages hold applicants'
    // home and household details.
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/application", "/team", "/me", "/signin", "/auth"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
