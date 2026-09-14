import Image from "next/image";
import Link from "next/link";
import {
  cityLine,
  countdownLabel,
  formatEventDate,
  formatEventTime,
  type CommunityEvent,
} from "@/lib/events";

/** One event in a list, on /events and in the archive. */
export function EventCard({
  event,
  past = false,
}: {
  event: CommunityEvent;
  past?: boolean;
}) {
  const countdown = past ? null : countdownLabel(event);

  return (
    <article className="grid gap-6 rounded-2xl bg-surface p-6 shadow-[0_2px_18px_rgba(17,17,17,0.07)] sm:grid-cols-[132px_1fr] sm:gap-7 sm:p-7">
      <Link
        href={`/events/${event.slug}`}
        tabIndex={-1}
        aria-hidden="true"
        className="block"
      >
        <Image
          src={event.flyer.src}
          alt=""
          width={event.flyer.width}
          height={event.flyer.height}
          sizes="132px"
          className={`w-full rounded-lg border border-line sm:w-[132px] ${past ? "grayscale" : ""}`}
        />
      </Link>

      <div>
        {countdown ? (
          <p className="font-display text-xs font-bold tracking-[0.14em] text-rust uppercase">
            {countdown}
          </p>
        ) : null}
        {/* h2, because these cards sit directly under the page h1. */}
        <h2 className="mt-1 font-display text-2xl font-extrabold text-ink">
          <Link
            href={`/events/${event.slug}`}
            className="hover:text-sunset-deep"
          >
            {event.title} at {event.venue}
          </Link>
        </h2>
        <p className="mt-2 text-base leading-relaxed text-ink-soft">
          {formatEventDate(event)}, {formatEventTime(event)}
        </p>
        <p className="text-base leading-relaxed text-ink-soft">
          {event.street}, {cityLine(event)}
        </p>
      </div>
    </article>
  );
}
