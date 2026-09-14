import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SwipeHeading } from "@/components/Shapes";
import {
  EVENTS,
  cityLine,
  countdownLabel,
  eventAddress,
  formatEventDate,
  formatEventTime,
  getEvent,
  googleCalendarUrl,
  hasEnded,
  isHappeningNow,
} from "@/lib/events";
import { BASE_URL, SITE } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return EVENTS.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return { title: "Event not found" };

  const over = hasEnded(event);
  const description = over
    ? `${event.title} at ${event.venue} happened on ${formatEventDate(event)}.`
    : `${formatEventDate(event)}, ${formatEventTime(event)}, at ${eventAddress(event)}. ${event.tagline}`;

  return {
    title: over
      ? `${event.title} at ${event.venue}, ${formatEventDate(event)}`
      : `${event.title} at ${event.venue}`,
    description,
    // A finished event should stop showing up in search, but the page stays up so that
    // every flyer, every Facebook post and every link somebody saved still lands.
    robots: over ? { index: false, follow: true } : undefined,
    openGraph: { images: [event.flyer.src] },
  };
}

export default async function EventPage({ params }: Params) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  const over = hasEnded(event);
  const live = isHappeningNow(event);
  const countdown = countdownLabel(event);

  return (
    <>
      <SiteNav />
      <main id="main">
        <section className="bg-cream pt-6 pb-16">
          <div className="mx-auto max-w-[1180px] px-6">
            <Link
              href="/events"
              className="font-display text-sm font-bold tracking-wide text-rust uppercase hover:text-sunset-deep"
            >
              All events
            </Link>

            <div className="mt-8 grid gap-12 md:grid-cols-[1fr_380px] md:gap-16">
              <div>
                {over ? (
                  <p className="inline-block rounded-full bg-cream-deep px-4 py-1.5 font-display text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">
                    This event has happened
                  </p>
                ) : (
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="rounded-full bg-sage px-4 py-1.5 font-display text-xs font-bold tracking-[0.14em] text-cream uppercase">
                      {live ? "Happening now" : "Save the date"}
                    </span>
                    {countdown && !live ? (
                      <span className="font-display text-xs font-bold tracking-[0.14em] text-rust uppercase">
                        {countdown}
                      </span>
                    ) : null}
                  </p>
                )}

                <h1 className="mt-5 font-display text-4xl leading-[1.05] font-extrabold text-ink md:text-5xl">
                  {event.title} at {event.venue}
                </h1>
                <p className="mt-4 font-display text-xl font-bold text-sage">
                  {event.tagline}
                </p>

                <dl className="mt-9 grid gap-6 border-t border-line pt-8 sm:grid-cols-2">
                  <div>
                    <dt className="font-display text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">
                      When
                    </dt>
                    <dd className="mt-2 text-lg leading-relaxed text-ink">
                      {formatEventDate(event)}
                      <br />
                      {formatEventTime(event)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-display text-xs font-bold tracking-[0.14em] text-ink-soft uppercase">
                      Where
                    </dt>
                    <dd className="mt-2 text-lg leading-relaxed text-ink">
                      {event.venue}
                      <br />
                      {event.street}
                      <br />
                      {cityLine(event)}
                      <br />
                      <span className="text-base text-ink-soft">
                        {event.district}
                      </span>
                    </dd>
                  </div>
                </dl>

                <p className="mt-8 text-lg leading-relaxed text-ink-soft">
                  {event.intro}
                </p>

                {over ? (
                  <div className="mt-9 flex flex-wrap gap-4">
                    <Link
                      href="/dogs"
                      className="rounded-full bg-sunset px-7 py-3.5 font-display text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-sunset-deep"
                    >
                      See who is waiting now
                    </Link>
                  </div>
                ) : (
                  <div className="mt-9 flex flex-wrap gap-4">
                    <a
                      href={googleCalendarUrl(event)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-sunset px-7 py-3.5 font-display text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-sunset-deep"
                    >
                      Add to calendar
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    <a
                      href={event.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border-2 border-ink px-7 py-3.5 font-display text-sm font-bold tracking-wide text-ink uppercase transition-colors hover:bg-ink hover:text-cream"
                    >
                      Get directions
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </div>
                )}
              </div>

              <div>
                <Image
                  src={event.flyer.src}
                  alt={event.flyer.alt}
                  width={event.flyer.width}
                  height={event.flyer.height}
                  sizes="(min-width: 768px) 380px, 100vw"
                  priority
                  className="w-full rounded-2xl border border-line shadow-[0_8px_32px_rgba(17,17,17,0.12)]"
                />
                <a
                  href={event.flyer.src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block font-display text-sm font-bold tracking-wide text-rust uppercase hover:text-sunset-deep"
                >
                  Open the full flyer
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── What is happening there ──────────────────────────────────── */}
        <section
          className="bg-surface py-20"
          aria-labelledby="event-highlights"
        >
          <div className="mx-auto max-w-[1180px] px-6">
            <SwipeHeading
              swipe="var(--color-sage-soft)"
              className="text-4xl md:text-5xl"
            >
              <span id="event-highlights">What is going on</span>
            </SwipeHeading>

            <ul className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {event.highlights.map((item) => (
                <li key={item.title}>
                  <h3 className="font-display text-xl font-extrabold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-lg leading-relaxed text-ink-soft">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── The raffle ask, and the invitation for everyone else ─────── */}
        {over ? null : (
          <section className="bg-cream py-20" aria-labelledby="event-raffle">
            <div className="mx-auto grid max-w-[1180px] gap-8 px-6 md:grid-cols-2">
              <article className="rounded-2xl bg-surface p-9 shadow-[0_2px_18px_rgba(17,17,17,0.07)]">
                <h2
                  id="event-raffle"
                  className="font-display text-2xl font-extrabold text-ink"
                >
                  {event.raffle.heading}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                  {event.raffle.body}
                </p>
                <a
                  href={SITE.phoneHref}
                  className="mt-7 inline-block rounded-full bg-sunset px-7 py-3.5 font-display text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-sunset-deep"
                >
                  Call {SITE.phone}
                </a>
              </article>

              <article className="rounded-2xl bg-sage p-9 text-cream">
                <h2 className="font-display text-2xl font-extrabold">
                  Not adopting? Not fostering?
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-cream/85">
                  This is still your afternoon. If you want to support the
                  rescues, or you just want to find out what any of this
                  involves before you decide anything, come and find us. We are
                  a fun, and yes a little crazy, bunch.
                </p>
                <p className="mt-6 text-lg leading-relaxed text-cream/85">
                  Questions before the day?{" "}
                  <a
                    href={SITE.phoneHref}
                    className="font-semibold text-cream underline decoration-gold decoration-2 underline-offset-4 hover:text-gold"
                  >
                    {SITE.phone}
                  </a>
                </p>
              </article>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />

      {/* Search engines read this as a real event: date, place and all. Only worth
          publishing while the event is still ahead of us. */}
      {over ? null : (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Event",
              name: `${event.title} at ${event.venue}`,
              description: event.intro,
              startDate: event.start,
              endDate: event.end,
              eventStatus: "https://schema.org/EventScheduled",
              eventAttendanceMode:
                "https://schema.org/OfflineEventAttendanceMode",
              isAccessibleForFree: true,
              image: [`${BASE_URL}${event.flyer.src}`],
              url: `${BASE_URL}/events/${event.slug}`,
              location: {
                "@type": "Place",
                name: event.venue,
                address: {
                  "@type": "PostalAddress",
                  streetAddress: event.street,
                  addressLocality: event.locality,
                  addressRegion: event.region,
                  addressCountry: "US",
                },
              },
              organizer: {
                "@type": "Organization",
                name: SITE.name,
                url: BASE_URL,
                telephone: SITE.phone,
              },
            }),
          }}
        />
      )}
    </>
  );
}

export const revalidate = 1800;
