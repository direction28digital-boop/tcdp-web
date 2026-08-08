import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main id="main" className="bg-cream">
        <div className="mx-auto max-w-[680px] px-6 py-24">
          <h1 className="font-display text-4xl font-extrabold text-ink">
            This page is not here
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            If you came looking for a specific dog, they may already be out.
            Dogs leave this list every day, and that is the whole point.
          </p>
          <Link
            href="/dogs"
            className="mt-10 inline-block rounded-full bg-sunset px-7 py-3.5 font-display text-sm font-bold tracking-wide text-white uppercase hover:bg-sunset-deep"
          >
            See who is waiting now
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
