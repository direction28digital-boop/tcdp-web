import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { ASSETS } from "@/lib/assets";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-cream" role="contentinfo">
      <div className="mx-auto grid max-w-[1180px] gap-12 px-6 py-16 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="inline-flex rounded-xl bg-cream px-4 py-3">
            <Image
              src={ASSETS.logoHorizontal}
              alt={SITE.name}
              width={220}
              height={54}
              className="h-10 w-auto"
            />
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/75">
            A volunteer community in Phoenix, Arizona, working the Maricopa
            County priority list every single day. Known to most of you as{" "}
            {SITE.audienceName}.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-cream/60">
            Nonprofit status is in progress. We are not yet a 501(c)(3), so
            nothing you give us today is tax deductible, and we will say so
            plainly until that changes.
          </p>
        </div>

        <div>
          <h2 className="font-display text-sm font-bold tracking-widest text-gold uppercase">
            Find us on Facebook
          </h2>
          <ul className="mt-5 space-y-4 text-sm">
            {SITE.facebook.map((page) => (
              <li key={page.name}>
                {page.url ? (
                  <a
                    href={page.url}
                    className="font-semibold text-cream underline decoration-sunset decoration-2 underline-offset-4 hover:text-gold"
                  >
                    {page.name}
                  </a>
                ) : (
                  <span className="font-semibold text-cream">{page.name}</span>
                )}
                <span className="block text-cream/60">{page.note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-sm font-bold tracking-widest text-gold uppercase">
            Save a dog
          </h2>
          <a
            href={SITE.applyUrl}
            className="mt-5 inline-block rounded-full bg-sunset px-6 py-3 font-display text-sm font-bold tracking-wide text-white uppercase hover:bg-sunset-deep"
          >
            Apply to Save
          </a>
          <p className="mt-5 text-sm leading-relaxed text-cream/75">
            The application lives at{" "}
            <a
              href={SITE.applyUrl}
              className="font-semibold text-cream underline decoration-sunset decoration-2 underline-offset-4 hover:text-gold"
            >
              DOGFOSTER.ORG
            </a>
            . That is the address on every flyer, and it will keep working.
          </p>
          <p className="mt-4 text-sm text-cream/75">
            Questions?{" "}
            <a
              href={SITE.phoneHref}
              className="font-semibold text-cream underline decoration-sunset decoration-2 underline-offset-4 hover:text-gold"
            >
              {SITE.phone}
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-cream/15">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-cream/50">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Dog records and photos
            come from the{" "}
            <a
              href={SITE.countyPortal}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-cream"
            >
              MCACC Priority Placement Portal
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </p>
          <Link href="/team" className="hover:text-cream">
            Team sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
