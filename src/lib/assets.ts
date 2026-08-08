/**
 * Brand marks and dog photos are served from the importer repo on GitHub, which is
 * already the home of both. Keeping them there means the site carries no binaries and
 * a brand refresh is a commit in one place.
 *
 * Allowed as a remote image host in next.config.ts.
 */
const REPO =
  "https://raw.githubusercontent.com/direction28digital-boop/foster-portal-importer/main";

export const ASSETS = {
  logoHorizontal: `${REPO}/brand/tcdp-logo-horizontal-2x.png`,
  logoPrimary: `${REPO}/brand/tcdp-logo-primary.png`,
  siteIcon: `${REPO}/brand/tcdp-site-icon-512.png`,
  /**
   * ONE curated evergreen hero photo, per Dee: a rotating hero would mean vetting every
   * crop, so this does not follow the county list and does not change when a dog leaves it.
   *
   * It lives in this repo rather than in the dog feed, so it is ours and cannot move.
   * To swap it: drop a new file at public/hero/hero.jpg and update heroAlt below.
   * Today it is Bass, the puppy with the broken pelvis. The county's original is only
   * 640 by 480, so a proper horizontal photograph would sharpen this noticeably.
   */
  hero: "/hero/hero.jpg",
  heroAlt:
    "Bass, a three month old shepherd mix puppy, resting in a shelter kennel",
} as const;
