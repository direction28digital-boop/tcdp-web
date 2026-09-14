import Image from "next/image";
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
  const href = `/events/${event.slug}`;

  return (
    <ExpiresAt at={event.end}>
      <section className="bg-cream" aria-labelledby="event-strip">
        <div className="mx-auto max-w-[1180px] px-6">
          {/* The hero tears into whatever follows it, so the top padding has to clear
              the tear by more than the negative margin pulls this up. Otherwise the
              first line of the strip ends up underneath the torn paper. */}
          <div className="relative -mt-8 grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-6 rounded-2xl bg-sage px-7 pt-14 pb-7 shadow-[0_12px_44px_rgba(17,17,17,0.14)] md:-mt-14 md:grid-cols-[auto_1fr_auto] md:gap-x-8 md:gap-y-0 md:px-10 md:pt-20 md:pb-8">
            {/* The flyer, pinned up slightly crooked. The tilt is not decoration for its
                own sake: this site's whole visual language is torn paper and brush
                strokes, so a poster taped to the board belongs here in a way a neat
                rectangle would not.

                Placed explicitly rather than by source order, because the two breakpoints
                want different arrangements from the same markup. On a phone there is no
                room for a left column: taking 88px off the width pushed the heading to
                four lines, so the text gets the full width and the flyer drops down to sit
                beside the button instead.

                Hidden from assistive tech and skipped by the keyboard on purpose. It
                carries no information the heading does not already say, and it goes where
                the heading and the button already go. Two stops in a strip this small is
                enough; a third that announces nothing is noise, not access. */}
            <Link
              href={href}
              tabIndex={-1}
              aria-hidden="true"
              className="group col-start-1 row-start-2 block shrink-0 md:col-start-1 md:row-start-1"
            >
              <Image
                src={event.flyer.src}
                alt=""
                width={event.flyer.width}
                height={event.flyer.height}
                sizes="(min-width: 768px) 92px, 68px"
                className="h-[84px] w-[56px] -rotate-3 rounded-md border-2 border-cream/90 object-cover shadow-[0_6px_18px_rgba(17,17,17,0.35)] transition-transform duration-200 group-hover:-rotate-1 group-hover:scale-[1.04] md:h-[138px] md:w-[92px]"
              />
            </Link>

            <div className="col-span-2 col-start-1 row-start-1 md:col-span-1 md:col-start-2 md:row-start-1">
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
                <Link href={href} className="hover:text-gold">
                  {event.title} at {event.venue}
                </Link>
              </h2>
              <p className="mt-2 text-base leading-relaxed text-cream/85">
                {formatEventDate(event)}, {formatEventTime(event)}.{" "}
                {cityLine(event)}.
              </p>
            </div>

            <Link
              href={href}
              className="col-start-2 row-start-2 inline-block justify-self-start rounded-full bg-gold px-7 py-3.5 font-display text-sm font-bold tracking-wide text-ink uppercase transition-colors hover:bg-cream md:col-start-3 md:row-start-1"
            >
              Event details
            </Link>
          </div>
        </div>
      </section>
    </ExpiresAt>
  );
}
