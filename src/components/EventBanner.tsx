import Link from "next/link";
import { ExpiresAt } from "@/components/ExpiresAt";
import {
  cityLine,
  countdownLabel,
  formatEventDate,
  formatEventTime,
  type CommunityEvent,
} from "@/lib/events";

/**
 * The homepage event strip. It takes the overlap the white card below used to own, so
 * the event sits in the one place on this page nobody scrolls past, and the dogs keep
 * the rest of it.
 *
 * Renders nothing at all when there is no upcoming event, so the homepage returns to its
 * usual shape on its own.
 */
export function EventBanner({ event }: { event: CommunityEvent }) {
  const countdown = countdownLabel(event);

  return (
    <ExpiresAt at={event.end}>
      <section className="bg-cream" aria-labelledby="event-strip">
        <div className="mx-auto max-w-[1180px] px-6">
          {/* The hero tears into whatever follows it, so the top padding has to clear
              the tear by more than the negative margin pulls this up. Otherwise the
              first line of the strip ends up underneath the torn paper. */}
          <div className="relative -mt-8 grid gap-6 rounded-2xl bg-sage px-7 pt-14 pb-7 shadow-[0_12px_44px_rgba(17,17,17,0.14)] md:-mt-14 md:grid-cols-[1fr_auto] md:items-center md:gap-10 md:px-10 md:pt-20 md:pb-8">
            <div>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="rounded-full bg-gold px-3 py-1 font-display text-xs font-bold tracking-[0.14em] text-ink uppercase">
                  Save the date
                </span>
                {countdown ? (
                  <span className="font-display text-xs font-bold tracking-[0.14em] text-gold uppercase">
                    {countdown}
                  </span>
                ) : null}
              </p>
              <h2
                id="event-strip"
                className="mt-3 font-display text-2xl leading-tight font-extrabold text-cream md:text-3xl"
              >
                {event.title} at {event.venue}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-cream/85">
                {formatEventDate(event)}, {formatEventTime(event)}.{" "}
                {cityLine(event)}.
              </p>
            </div>

            <Link
              href={`/events/${event.slug}`}
              className="inline-block justify-self-start rounded-full bg-gold px-7 py-3.5 font-display text-sm font-bold tracking-wide text-ink uppercase transition-colors hover:bg-cream"
            >
              Event details
            </Link>
          </div>
        </div>
      </section>
    </ExpiresAt>
  );
}
