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

/**
 * The three real pages, confirmed by Dee 2026-09-14. Two of them have no vanity handle
 * yet and so are profile.php links; if Facebook ever gives them usernames, swap the URL
 * here and nothing else changes.
 *
 * Typed rather than inferred on purpose. These live outside the `as const` below so that
 * `url` stays `string` and not a literal, which is what keeps the footer's empty-url
 * fallback compiling for the next page somebody adds before they have the link.
 */
export type FacebookPage = { name: string; note: string; url: string };

const FACEBOOK_PAGES: readonly FacebookPage[] = [
  {
    name: "New Hope Rescue Only",
    note: "Dogs that need a partner rescue to pull them",
    url: "https://www.facebook.com/AZpoundpupsNHRO",
  },
  {
    name: "Adoptables Urgent",
    note: "Dogs you can adopt directly, fees waived",
    url: "https://www.facebook.com/profile.php?id=100092217115262",
  },
  {
    name: "Featured",
    note: "The wider community",
    url: "https://www.facebook.com/profile.php?id=100092319319888",
  },
];

export const SITE = {
  name: "The CrAZy Dog People",
  shortName: "TCDP",
  audienceName: "AZ Pound Pups",
  /**
   * Every CTA links here. /apply is a redirect defined in next.config.ts, which is the
   * one place to change when the rescue moves their application form.
   */
  applyUrl: "/apply",
  applyLabel: "Apply to Save a Dog",
  phone: "602-834-4911",
  phoneHref: "tel:+16028344911",
  countyPortal: "https://apps.pets.maricopa.gov/priority/",
  /**
   * Held back deliberately (Dee, 2026-08-07): a SnoutHub mention belongs here eventually,
   * but not in a rush. If it comes back, keep it a resource link, never a partnership or
   * funding claim, while neither organisation is a 501(c)(3).
   */
  facebook: FACEBOOK_PAGES,
} as const;

export const NAV = [
  { label: "Urgent Dogs", href: "/dogs" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Our Missions", href: "/#missions" },
  { label: "About Us", href: "/#about" },
] as const;
