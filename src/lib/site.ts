/**
 * Single place for the outward-facing facts. Everything the team might want to change
 * without touching a component lives here.
 */

/**
 * The site's public address.
 *
 * Until thecrazydogpeople.com is pointed at Vercel, the live address is the vercel.app
 * one, and share cards break if metadata claims otherwise: a crawler would go looking for
 * the image on a domain that does not resolve. Vercel sets VERCEL_PROJECT_PRODUCTION_URL
 * to the project's production domain, which becomes the custom domain automatically the
 * moment one is attached, so this needs no edit on the day DNS changes.
 */
export const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const SITE = {
  name: "The CrAZy Dog People",
  shortName: "TCDP",
  audienceName: "AZ Pound Pups",
  /**
   * The application still runs on the dogfoster.org WPForms install. Every CTA points
   * there until the new apply-once portal is proven, at which point this becomes an
   * internal route and dogfoster.org 301s here.
   */
  applyUrl: "https://dogfoster.org",
  applyLabel: "Apply to Save a Dog",
  phone: "602-834-4911",
  phoneHref: "tel:+16028344911",
  countyPortal: "https://apps.pets.maricopa.gov/priority/",
  /**
   * Held back deliberately (Dee, 2026-08-07): a SnoutHub mention belongs here eventually,
   * but not in a rush. If it comes back, keep it a resource link, never a partnership or
   * funding claim, while neither organisation is a 501(c)(3).
   */
  /**
   * TODO (Dee): drop the real page URLs in. Any entry left empty renders as plain text
   * instead of a dead link.
   */
  facebook: [
    {
      name: "New Hope Rescue Only",
      note: "Dogs that need a partner rescue to pull them",
      url: "",
    },
    {
      name: "Adoptables Urgent",
      note: "Dogs you can adopt directly, fees waived",
      url: "",
    },
    { name: "Featured", note: "The wider community", url: "" },
  ],
} as const;

export const NAV = [
  { label: "Urgent Dogs", href: "/dogs" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Our Missions", href: "/#missions" },
  { label: "About Us", href: "/#about" },
] as const;
