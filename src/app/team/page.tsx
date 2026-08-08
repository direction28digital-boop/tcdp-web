import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Team sign in",
  description: "Sign in for The CrAZy Dog People volunteer team.",
  robots: { index: false },
};

export default function TeamPage() {
  return (
    <>
      <SiteNav />
      <main id="main" className="bg-cream">
        <div className="mx-auto max-w-[680px] px-6 py-24">
          <h1 className="font-display text-4xl font-extrabold text-ink">
            Team sign in
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            The volunteer dashboard is being built. It will hold the pipeline,
            dog profiles, video uploads and the applications, so nobody has to
            star an email to remember where a dog stands.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            Until then, applications keep arriving in WPForms at{" "}
            <a
              href={SITE.applyUrl}
              className="font-semibold text-rust underline decoration-2 underline-offset-4"
            >
              dogfoster.org
            </a>{" "}
            exactly as they do today.
          </p>
          <Link
            href="/"
            className="mt-10 inline-block rounded-full border-2 border-ink px-7 py-3.5 font-display text-sm font-bold tracking-wide text-ink uppercase hover:bg-ink hover:text-cream"
          >
            Back to the site
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
