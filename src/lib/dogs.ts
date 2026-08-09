import biosData from "@/data/bios.json";

/**
 * Live dog data comes from the foster-portal-importer, which scrapes the MCACC
 * Priority Placement Portal hourly and commits the result to GitHub.
 *
 * IMPORTANT (rule locked with Dee + Joann): the importer's `sections` field holds raw
 * shelter memos, behavior evaluations, medical treatment history and bite history.
 * That material is INTERNAL ONLY. It is stripped here, at the data boundary, so it is
 * structurally impossible for a public page to render it.
 */

const FEED_URL =
  "https://raw.githubusercontent.com/direction28digital-boop/foster-portal-importer/main/data/priority-dogs.json";

const PHOTO_BASE =
  "https://raw.githubusercontent.com/direction28digital-boop/foster-portal-importer/main/data/photos";

/**
 * Bios live in the importer repo too, written each morning by generate_bios.py from
 * the county record. Fetching them (rather than importing the frozen file) is what
 * lets a dog listed overnight have a story on their page by breakfast, with nobody
 * doing anything. The bundled copy below stays as the fallback: if the fetch fails,
 * pages render with the bios we already had rather than none at all.
 */
const BIOS_URL =
  "https://raw.githubusercontent.com/direction28digital-boop/foster-portal-importer/main/data/bios.json";

export type Bio = {
  animal_id: string;
  name: string;
  age: string;
  breed: string;
  location: string;
  bullets: string[];
  story: string;
  needs: string;
};

export type Dog = {
  id: string;
  name: string;
  /** New Hope Only: must be pulled by a partner rescue, cannot be adopted directly. */
  nho: boolean;
  reason: string | null;
  age: string | null;
  sex: string | null;
  breed: string | null;
  weight: string | null;
  shelter: string | null;
  kennel: string | null;
  deadline: string | null;
  daysLeft: number | null;
  /** County status: null when active, otherwise TRANSFER PENDING / RTO PENDING / TRANSFERRED / ADOPTED. */
  status: string | null;
  resolved: boolean;
  photo: string | null;
  detailUrl: string | null;
  bio: Bio | null;
};

export type DogFeed = {
  fetchedAt: string;
  live: boolean;
  active: Dog[];
  resolved: Dog[];
  stats: {
    waiting: number;
    transferred: number;
    adopted: number;
    saved: number;
    urgentThisWeek: number;
    nextDeadline: string | null;
  };
};

type RawDog = Record<string, unknown>;
type RawFeed = { fetched_at?: string; active?: RawDog[]; resolved?: RawDog[] };

const bundledBios = biosData as Record<string, Bio>;

/** Phoenix does not observe daylight saving, so the county clock is always UTC-7. */
function phoenixToday(): Date {
  const now = new Date();
  const phoenix = new Date(now.getTime() - 7 * 60 * 60 * 1000);
  return new Date(
    Date.UTC(
      phoenix.getUTCFullYear(),
      phoenix.getUTCMonth(),
      phoenix.getUTCDate(),
    ),
  );
}

function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  const target = new Date(`${deadline}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((target.getTime() - phoenixToday().getTime()) / 86_400_000);
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function normalizeName(raw: unknown, id: string): string {
  const name = str(raw);
  if (!name || /^name unknown$/i.test(name)) return `Dog ${id}`;
  // County records shout. Title case reads like a dog, not a database row.
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toDog(raw: RawDog, bios: Record<string, Bio>): Dog | null {
  const id = str(raw.animal_id);
  if (!id) return null;
  const deadline = str(raw.deadline);
  return {
    id,
    name: normalizeName(raw.name, id),
    nho: raw.nho === true,
    reason: str(raw.reason),
    age: str(raw.age),
    sex: str(raw.sex),
    breed: str(raw.breed),
    weight: str(raw.weight),
    shelter: str(raw.shelter),
    kennel: str(raw.kennel),
    deadline,
    daysLeft: daysUntil(deadline),
    status: str(raw.status),
    resolved: raw.resolved === true,
    photo: raw.photo_file ? `${PHOTO_BASE}/${id}.jpg` : null,
    detailUrl: str(raw.detail_url),
    bio: bios[id] ?? null,
    // `sections` is deliberately not mapped. Internal only.
  };
}

/**
 * The county's priority list is not dogs only.
 *
 * Cats appear on it too, and the importer takes the list as it finds it. This site says
 * "dogs" in every heading, every count and every call to action, so a cat listed here
 * would be described as a dog, counted as a dog, and routed to dog rescues. Filtered at
 * the boundary. The breed field is the reliable signal: shelters record cats as domestic
 * short, medium or long hair.
 *
 * If TCDP ever decides to cover cats, this is the one place to change.
 */
const NOT_A_DOG =
  /\bDOMESTIC\s+(SH|MH|LH)\b|\bDSH\b|\bDMH\b|\bDLH\b|SIAMESE|MAINE COON|RAGDOLL|\bTABBY\b/i;

function isDog(raw: RawDog): boolean {
  return !NOT_A_DOG.test(String(raw.breed ?? ""));
}

function byDeadline(a: Dog, b: Dog): number {
  if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
  if (a.deadline) return -1;
  if (b.deadline) return 1;
  return a.name.localeCompare(b.name);
}

function shape(
  raw: RawFeed,
  live: boolean,
  bios: Record<string, Bio>,
): DogFeed {
  const active = (raw.active ?? [])
    .filter(isDog)
    .map((raw) => toDog(raw, bios))
    .filter((d): d is Dog => d !== null)
    .sort(byDeadline);

  const resolved = (raw.resolved ?? [])
    .filter(isDog)
    .map((raw) => toDog(raw, bios))
    .filter((d): d is Dog => d !== null);

  const transferred = resolved.filter((d) => d.status === "TRANSFERRED").length;
  const adopted = resolved.filter((d) => d.status === "ADOPTED").length;
  const urgentThisWeek = active.filter(
    (d) => d.daysLeft !== null && d.daysLeft <= 7,
  ).length;

  return {
    fetchedAt: raw.fetched_at ?? "",
    live,
    active,
    resolved,
    stats: {
      waiting: active.length,
      transferred,
      adopted,
      saved: transferred + adopted,
      urgentThisWeek,
      nextDeadline: active.find((d) => d.deadline)?.deadline ?? null,
    },
  };
}

/**
 * Reads the hourly importer feed.
 *
 * Pages are ISR with a 30 minute window, so a failed revalidation keeps serving the last
 * good render rather than an empty list. `live: false` marks the rare case where a page
 * renders cold with no feed, and the UI says so instead of implying zero dogs are waiting.
 */
async function getBios(): Promise<Record<string, Bio>> {
  try {
    const res = await fetch(BIOS_URL, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`Bios responded ${res.status}`);
    const json = (await res.json()) as Record<string, Bio>;
    if (typeof json !== "object" || json === null) {
      throw new Error("Bios shape unexpected");
    }
    // Merge, never replace. A bio that exists in the bundle but not yet in the feed
    // still renders, so a deploy can never blank out a dog's page.
    return { ...bundledBios, ...json };
  } catch (error) {
    console.error("[tcdp] live bios unavailable, using bundled copy:", error);
    return bundledBios;
  }
}

export async function getDogs(): Promise<DogFeed> {
  const bios = await getBios();
  try {
    const res = await fetch(FEED_URL, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`Feed responded ${res.status}`);
    const json = (await res.json()) as RawFeed;
    if (!Array.isArray(json.active)) throw new Error("Feed shape unexpected");
    return shape(json, true, bios);
  } catch (error) {
    console.error("[tcdp] live county feed unavailable:", error);
    return shape({ active: [], resolved: [] }, false, bios);
  }
}

export async function getDog(id: string): Promise<Dog | null> {
  const feed = await getDogs();
  return (
    feed.active.find((d) => d.id === id) ??
    feed.resolved.find((d) => d.id === id) ??
    null
  );
}

/** County ages arrive as "5Y 0M", "0Y 3M" or "1 year 1 month". Say it like a person would. */
export function formatAge(age: string | null): string | null {
  if (!age) return null;
  const compact = age.match(/^(\d+)\s*Y\s*(\d+)\s*M$/i);
  let years: number;
  let months: number;
  if (compact) {
    years = Number(compact[1]);
    months = Number(compact[2]);
  } else {
    const y = age.match(/(\d+)\s*year/i);
    const m = age.match(/(\d+)\s*month/i);
    if (!y && !m) return age;
    years = y ? Number(y[1]) : 0;
    months = m ? Number(m[1]) : 0;
  }
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (months > 0 && years < 2)
    parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  if (parts.length === 0) return "Under a month old";
  return parts.join(", ") + " old";
}

/** County breed strings shout: "BROWN/BRINDLE GERM SHEPHERD/MIX". */
export function formatBreed(breed: string | null): string | null {
  if (!breed) return null;
  return breed
    .toLowerCase()
    .replace(/\bgerm\b/g, "german")
    .replace(/\bter\b/g, "terrier")
    .replace(/\bam\b/g, "american")
    .replace(/\bpit bull\b/g, "pit bull")
    .replace(/\bsh\b/g, "shorthair")
    .replace(/\bmix\b/g, "mix")
    .replace(/\s*\/\s*/g, " / ")
    .replace(
      /(^|[\s/])([a-z])/g,
      (_, sep: string, ch: string) => sep + ch.toUpperCase(),
    );
}

export function deadlineTone(
  daysLeft: number | null,
): "red" | "amber" | "calm" {
  if (daysLeft === null) return "calm";
  if (daysLeft <= 2) return "red";
  if (daysLeft <= 4) return "amber";
  return "calm";
}

export function formatDeadline(deadline: string | null): string {
  if (!deadline) return "Date not posted";
  const date = new Date(`${deadline}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return deadline;
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function daysLeftLabel(daysLeft: number | null): string {
  if (daysLeft === null) return "Deadline not posted";
  if (daysLeft < 0) return "Deadline passed";
  if (daysLeft === 0) return "Deadline today";
  if (daysLeft === 1) return "1 day left";
  return `${daysLeft} days left`;
}
