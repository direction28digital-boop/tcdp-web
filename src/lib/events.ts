/**
 * Community events. One object per event, and that object is the only thing anyone has
 * to write to put an event on the site.
 *
 * Events take themselves down. Every surface reads `end`, so the moment that passes the
 * event stops counting as upcoming: the homepage strip vanishes, /events stops listing
 * it, and it moves into the unlisted archive. Nothing is deleted by hand and nobody has
 * to remember on the night.
 *
 * `start` and `end` carry the Phoenix offset in the string on purpose. Arizona does not
 * observe daylight saving, so that offset is -07:00 every day of the year. Written this
 * way the times are correct no matter what timezone the server or the visitor is in,
 * which matters because Vercel runs in UTC.
 */

const PHOENIX = "America/Phoenix";

export type EventHighlight = { title: string; body: string };

export type CommunityEvent = {
  /** Lives in the URL forever, including after the event. Never change a published one. */
  slug: string;
  title: string;
  tagline: string;
  /** ISO 8601 with the -07:00 Phoenix offset. */
  start: string;
  /** ISO 8601 with the -07:00 Phoenix offset. The site goes quiet about the event here. */
  end: string;
  venue: string;
  street: string;
  locality: string;
  region: string;
  district: string;
  mapUrl: string;
  intro: string;
  highlights: EventHighlight[];
  raffle: { heading: string; body: string };
  flyer: { src: string; alt: string; width: number; height: number };
};

export const EVENTS: CommunityEvent[] = [
  {
    slug: "meet-the-rescues-oct-2026",
    title: "Meet the Rescues",
    tagline: "Good people. Great dogs. Stronger together.",
    start: "2026-10-17T16:00:00-07:00",
    end: "2026-10-17T20:00:00-07:00",
    venue: "Chicken N Pickle",
    street: "9475 W. Hanna Ln",
    locality: "Glendale",
    region: "AZ",
    district: "Westgate Entertainment District",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Chicken+N+Pickle+9475+W+Hanna+Ln+Glendale+AZ",
    intro:
      "A community afternoon for the valley rescues and the dogs they are pulling off the county list. Come meet the people doing the work, ask every question you have, and find out where you fit. You do not need to be ready for a dog today, come anyway and support the cause.",
    highlights: [
      {
        title: "Meet rescues",
        body: "Connect with local rescues and learn about their work.",
      },
      {
        title: "Games and fun",
        body: "Activities for everyone.",
      },
      {
        title: "Learn about fostering",
        body: "Find out how you can make a difference.",
      },
      {
        title: "Paint your dog",
        body: "Create a masterpiece and take it home.",
      },
    ],
    raffle: {
      heading: "We need items or services to raffle",
      body: "Do you have an item, a gift card, a service, or something you are willing to donate? If it is too big to carry, send us a picture. Every donation helps support the rescues and save lives.",
    },
    flyer: {
      src: "/events/save-the-date-2026-10-17.jpg",
      alt: "Save the date flyer for October 17, 2026, 4pm to 8pm at Chicken N Pickle, 9475 W. Hanna Ln, Glendale, Arizona. A community event to support rescues and save lives, with rescues to meet, games, fostering information and paint your dog. Raffle donations wanted, call 602-834-4911.",
      width: 1024,
      height: 1536,
    },
  },
];

/** True once the event's end time has passed. This is the whole expiry rule. */
export function hasEnded(event: CommunityEvent, now: number = Date.now()): boolean {
  return Date.parse(event.end) <= now;
}

/** True while the event is actually running, so the page can say "happening now". */
export function isHappeningNow(
  event: CommunityEvent,
  now: number = Date.now(),
): boolean {
  return Date.parse(event.start) <= now && now < Date.parse(event.end);
}

/** Soonest first, so the first entry is the one to lead with. */
export function upcomingEvents(now: number = Date.now()): CommunityEvent[] {
  return EVENTS.filter((event) => !hasEnded(event, now)).sort(
    (a, b) => Date.parse(a.start) - Date.parse(b.start),
  );
}

/** Most recent first. */
export function pastEvents(now: number = Date.now()): CommunityEvent[] {
  return EVENTS.filter((event) => hasEnded(event, now)).sort(
    (a, b) => Date.parse(b.start) - Date.parse(a.start),
  );
}

export function nextEvent(now: number = Date.now()): CommunityEvent | null {
  return upcomingEvents(now)[0] ?? null;
}

export function getEvent(slug: string): CommunityEvent | null {
  return EVENTS.find((event) => event.slug === slug) ?? null;
}

/** "Saturday, October 17, 2026" */
export function formatEventDate(event: CommunityEvent): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PHOENIX,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(event.start));
}

/** "Sat, Oct 17" for tight spaces. */
export function formatEventDateShort(event: CommunityEvent): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PHOENIX,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(event.start));
}

/** "4pm to 8pm", and "4:30pm" if a future event ever starts on a half hour. */
export function formatEventTime(event: CommunityEvent): string {
  return `${clockLabel(event.start)} to ${clockLabel(event.end)}`;
}

function clockLabel(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PHOENIX,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(iso));
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const minute = value("minute");
  const period = value("dayPeriod").toLowerCase();
  return minute === "00"
    ? `${value("hour")}${period}`
    : `${value("hour")}:${minute}${period}`;
}

/**
 * Whole calendar days between today and the event, counted in Phoenix. Counting in
 * calendar days rather than in hours is what makes "tomorrow" mean tomorrow to a reader
 * rather than "anything under 48 hours".
 */
export function daysUntil(
  event: CommunityEvent,
  now: number = Date.now(),
): number {
  return phoenixDay(Date.parse(event.start)) - phoenixDay(now);
}

function phoenixDay(ms: number): number {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: PHOENIX,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
  return Math.floor(Date.parse(`${ymd}T00:00:00Z`) / 86_400_000);
}

/** "Today", "Tomorrow", "12 days away". Null when there is nothing worth saying. */
export function countdownLabel(
  event: CommunityEvent,
  now: number = Date.now(),
): string | null {
  if (hasEnded(event, now)) return null;
  if (isHappeningNow(event, now)) return "Happening now";
  const days = daysUntil(event, now);
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days away`;
}

/** "Glendale, AZ". One place builds it, so the schema and the page cannot drift. */
export function cityLine(event: CommunityEvent): string {
  return `${event.locality}, ${event.region}`;
}

/** The address on one line, for a card or a share card. */
export function eventAddress(event: CommunityEvent): string {
  return `${event.venue}, ${event.street}, ${cityLine(event)}`;
}

/**
 * "Add to calendar" for the save-the-date crowd. Google's template URL wants UTC stamps,
 * which is exactly what the offset in `start` and `end` lets us produce without any
 * timezone guessing.
 */
export function googleCalendarUrl(event: CommunityEvent): string {
  const stamp = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${event.title} at ${event.venue}`,
    dates: `${stamp(event.start)}/${stamp(event.end)}`,
    location: `${event.venue}, ${event.street}, ${cityLine(event)}`,
    details: event.tagline,
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}
