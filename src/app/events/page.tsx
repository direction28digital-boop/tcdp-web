import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { EventCard } from "@/components/EventCard";
import { pastEvents, upcomingEvents } from "@/lib/events";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Come and meet The CrAZy Dog People and the valley rescues in person. Upcoming community events in the Phoenix area.",
};

export default function EventsPage() {
  const upcoming = upcomingEvents();
  const archive = pastEvents();

  return (
    <>
      <SiteNav />
      <main id="main" className="bg-cream">
        <div className="mx-auto max-w-[900px] px-6 py-16">
          <h1 className="font-display text-4xl leading-tight font-extrabold text-ink md:text-5xl">
            Come and meet us
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Everything we do happens on a screen until it does not. These are
            the afternoons where you can stand in front of the people doing this
            work, ask the awkward questions, and decide for yourself.
          </p>

          {upcoming.length > 0 ? (
            <ul className="mt-12 space-y-8">
              {upcoming.map((event) => (
                <li key={event.slug}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-12 rounded-2xl bg-surface p-9 shadow-[0_2px_18px_rgba(17,17,17,0.07)]">
              <h2 className="font-display text-2xl font-extrabold text-ink">
                Nothing on the calendar right now
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                The next one gets posted here and on our Facebook pages as soon
                as it is booked. In the meantime, the dogs on the county list
                are not waiting for an event.
              </p>
              <Link
                href="/dogs"
                className="mt-7 inline-block rounded-full bg-sunset px-7 py-3.5 font-display text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-sunset-deep"
              >
                See who is waiting now
              </Link>
            </div>
          )}

          {archive.length > 0 ? (
            <p className="mt-12 border-t border-line pt-8 text-base leading-relaxed text-ink-soft">
              Wondering what one of these looks like?{" "}
              <Link
                href="/events/past"
                className="font-semibold text-rust underline decoration-2 underline-offset-4 hover:text-sunset-deep"
              >
                Look at the ones we have already run
              </Link>
              .
            </p>
          ) : null}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export const revalidate = 1800;
