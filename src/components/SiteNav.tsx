import Image from "next/image";
import Link from "next/link";
import { NAV, SITE } from "@/lib/site";
import { ASSETS } from "@/lib/assets";

/**
 * Public navigation. No sign-in anywhere in the public chrome, per Dee:
 * the team's way in is the quiet link in the footer.
 */
export function SiteNav({ tone = "cream" }: { tone?: "cream" | "white" }) {
  return (
    <header
      className={tone === "cream" ? "bg-cream" : "bg-surface"}
      role="banner"
    >
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-8 gap-y-4 px-6 py-5"
      >
        <Link href="/" className="shrink-0" aria-label={`${SITE.name}, home`}>
          <Image
            src={ASSETS.logoHorizontal}
            alt={SITE.name}
            width={230}
            height={56}
            priority
            className="h-11 w-auto"
          />
        </Link>

        <ul className="flex w-full flex-wrap items-center gap-x-7 gap-y-2 md:w-auto md:flex-1 text-[0.95rem] font-semibold text-ink-soft">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="transition-colors hover:text-sunset-deep"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <a
          href={SITE.applyUrl}
          className="rounded-full bg-sunset px-6 py-3 font-display text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-sunset-deep"
        >
          Apply to Save
        </a>
      </nav>
    </header>
  );
}
