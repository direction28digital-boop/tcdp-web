import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { EventCard } from "@/components/EventCard";
import { pastEvents } from "@/lib/events";

/**
 * The archive. Deliberately unlisted: not in the nav, not in the sitemap, and noindex, so
 * a finished event never outranks a live one or shows up in search looking current.
 *
 * It exists so there is something to send someone who asks what one of these afternoons
 * actually is, and so the event pages themselves have a home once they are over. The
 * pages stay reachable either way, because flyers and Facebook posts cannot be edited
 * after the fact and a dead link is a worse answer than an old one.
 */
export const metadata: Metadata = {
  title: "Past events",
  description: "Community events The CrAZy Dog People have already run.",
  robots: { index: false, follow: true },
};

export default function PastEventsPage() {
  const archive = pastEvents();

  return (
    <>
      <SiteNav />
      <main id="main" className="bg-cream">
        <div className="mx-auto max-w-[900px] px-6 py-16">
          <Link
            href="/events"
            className="font-display text-sm font-bold tracking-wide text-rust uppercase hover:text-sunset-deep"
          >
            Upcoming events
          </Link>

          <h1 className="mt-8 font-display text-4xl leading-tight font-extrabold text-ink md:text-5xl">
            Events we have already run
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Kept here so you can see what one of our afternoons looks like
            before you come to the next one. These dates have passed.
          </p>

          {archive.length > 0 ? (
            <ul className="mt-12 space-y-8">
              {archive.map((event) => (
                <li key={event.slug}>
                  <EventCard event={event} past />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-12 text-lg leading-relaxed text-ink-soft">
              Nothing in the archive yet. Our first one has not happened.
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export const revalidate = 1800;
