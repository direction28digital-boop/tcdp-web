import Link from "next/link";

/**
 * Two kinds of volunteer log in here.
 *
 * One is at the shelter with a phone, working out which dogs to film. One is at
 * a kitchen table working through applications. Neither should have to read the
 * other's screen to find their own, so the tabs are named for the job, not for
 * the table.
 *
 * "Needs attention" is first and is the default landing page because it is the
 * only view that mixes both: it is our priority list, not the county's.
 */
const TABS = [
  { href: "/team", label: "Needs attention" },
  { href: "/team/dogs", label: "Dogs" },
  { href: "/team/applications", label: "Applications" },
];

export function TeamNav({
  current,
  counts = {},
}: {
  current: string;
  counts?: Record<string, number>;
}) {
  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-line pb-4"
      aria-label="Team sections"
    >
      {TABS.map((tab) => {
        const active = tab.href === current;
        const count = counts[tab.href];
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-display text-sm font-bold tracking-wide text-cream uppercase"
                : "inline-flex items-center gap-2 rounded-full bg-surface px-5 py-2.5 font-display text-sm font-bold tracking-wide text-ink-soft uppercase hover:bg-cream-deep"
            }
          >
            {tab.label}
            {count ? (
              <span
                className={
                  active
                    ? "rounded-full bg-cream/20 px-2 py-0.5 text-xs tabular-nums"
                    : "rounded-full bg-sunset px-2 py-0.5 text-xs text-white tabular-nums"
                }
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
