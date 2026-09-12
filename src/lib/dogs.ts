import biosData from "@/data/bios.json";

/**
 * Live dog data comes from the foster-portal-importer, which scrapes the MCACC
 * Priority Placement Portal hourly and commits the result to GitHub.
 *
 * SECTIONS ARE PUBLIC AS OF 2026-09-12, reversing the earlier internal-only rule.
 *
 * Dee: "They only want the actual data from the shelter, no AI enhancements,
 * people keep wanting to see the shelter notes." The rescue's own posts already
 * publish this material and say so out loud — "honest write-ups, bite history and
 * placement restrictions included" — so the site was being more squeamish than the
 * rescue it speaks for, which helped nobody and made the page look like it was
 * hiding something.
 *
 * The generated bio is gone with it. A written-up "story" makes behavioural claims
 * in the shelter's voice that the shelter never made ("He's not aggressive. He's
 * terrified."), and a foster who acts on a sentence like that is acting on ours,
 * not the county's. What the rescue wants to say now lives in its own labelled
 * block, beside the record rather than on top of it.
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

/**
 * The county record, verbatim.
 *
 * Deliberately NOT cleaned up, reordered or summarised. The moment this code
 * starts deciding which sentences matter it is doing the thing Dee asked it to
 * stop doing. The one exception is `stripFormJunk` below, and that removes page
 * furniture the scraper swept up, not anything the shelter wrote.
 */
export type Sections = {
  intake: string | null;
  memo: string | null;
  evaluationComments: string | null;
  medicalTreatments: string | null;
  kennelRounds: string | null;
  biteHistory: string | null;
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
  /** MCACC's own behaviour rating, their word, or null when we could not trust the parse. */
  level: string | null;
  resolved: boolean;
  photo: string | null;
  detailUrl: string | null;
  bio: Bio | null;
  sections: Sections;
};

/**
 * What a card needs, and nothing else.
 *
 * `sections` is the whole county record — 8 to 16KB per dog, and DogBrowser is a
 * client component, so handing it a full Dog[] would serialise half a megabyte of
 * shelter notes into a page most of this audience opens on a phone. Stripped here
 * rather than trusted to whoever writes the next list page.
 *
 * `bio` goes too, because the generated bio is gone: the only prose on a card is
 * now the rescue's own note, if somebody wrote one.
 */
export type CardDog = Omit<Dog, "sections" | "bio"> & { note?: string | null };

export function toCardDog(dog: Dog, note?: string | null): CardDog {
  const { sections: _sections, bio: _bio, ...rest } = dog;
  return { ...rest, note: note ?? null };
}

export type DogFeed = {
  fetchedAt: string;
  live: boolean;
  active: Dog[];
  resolved: Dog[];
  stats: {
    /** Dogs still needing somebody. NOT the length of `active`. */
    waiting: number;
    /** Everything on the county list, including dogs already spoken for. */
    onList: number;
    spokenFor: number;
    transferred: number;
    adopted: number;
    saved: number;
    urgentThisWeek: number;
    nextDeadline: string | null;
    /**
     * Days until that deadline, never negative.
     *
     * A dog whose county date has passed and who still has nobody is the most
     * urgent dog on the list, not a data error. But "-2 days until the next
     * deadline" reads as a broken site, and counting down past zero implies
     * there is still runway. Floored at 0: time is up, which is the truth.
     */
    nextDeadlineDays: number | null;
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

/**
 * Cuts the scraped page furniture off the end of a section.
 *
 * The county's detail page ends every record with the Pull Animal Request form:
 * passcode instructions, New Hope Partner rules, a support phone number. The
 * scraper takes the text as it finds it, so that boilerplate landed inside
 * `bite_history` on every animal. Measured on the live feed: 69,839 characters
 * of bite history across 37 animals, of which 945 are real. The rest is the form.
 *
 * So "No recorded bites" — the entire truth for almost every dog — was buried
 * under 1,800 characters of instructions about passcodes.
 *
 * This is not editing the shelter's words. It is removing text that was never
 * about the animal. Worth fixing upstream in the importer too, but stripping here
 * means the site is right before that ships.
 */
const FORM_JUNK = [
  "Pull Animal Request",
  "Group Passcode",
  "Additional Help",
];

function stripFormJunk(value: string | null): string | null {
  if (!value) return null;
  let out = value;
  for (const marker of FORM_JUNK) {
    const at = out.indexOf(marker);
    if (at !== -1) out = out.slice(0, at);
  }
  out = out.trim();
  return out === "" ? null : out;
}

function sectionsOf(raw: RawDog): Sections {
  const s = (raw.sections ?? {}) as Record<string, unknown>;
  const read = (key: string) => stripFormJunk(str(s[key]));
  return {
    intake: read("intake"),
    memo: read("memo"),
    evaluationComments: read("evaluation_comments"),
    medicalTreatments: read("medical_treatments"),
    kennelRounds: read("in_kennel_behavior_rounds"),
    biteHistory: read("bite_history"),
  };
}

/**
 * The county's behaviour rating, only when we are sure we read it.
 *
 * MCACC rates animals with a colour and it is the most up-front thing on the
 * record — but the importer mis-parses it on the small dogs. Measured on the live
 * feed: 2 of 37 come through as the literal string "Weight", both under six
 * pounds (Biggie Smalls is 2.7lb at seven weeks), because a missing field on the
 * detail page slides the column and the scraper grabs the next label instead.
 *
 * Showing "Level: Weight" as a behaviour rating on a page whose entire purpose is
 * now honest disclosure would undercut the thing it is trying to build. So an
 * unrecognised value renders as nothing, and the county page link covers it.
 *
 * Worth fixing in the importer; this guard stays regardless, because the day the
 * county adds a colour is the day this would start printing garbage again.
 */
const COUNTY_LEVELS = ["GREEN", "YELLOW", "ORANGE", "PURPLE", "RED", "BLUE"];

function levelOf(raw: unknown): string | null {
  const value = str(raw);
  if (!value) return null;
  const upper = value.toUpperCase();
  return COUNTY_LEVELS.includes(upper) ? upper : null;
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
    level: levelOf(raw.level),
    resolved: raw.resolved === true,
    photo: raw.photo_file ? `${PHOTO_BASE}/${id}.jpg` : null,
    detailUrl: str(raw.detail_url),
    bio: bios[id] ?? null,
    sections: sectionsOf(raw),
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

/**
 * Somebody has already stepped up for this dog.
 *
 * A dog cannot leave the E-list without a foster or adopter, so a PENDING
 * status is the county telling us one has been found: TRANSFER PENDING for a
 * rescue or foster, RTO PENDING for an owner reclaiming. Either way this dog is
 * not the one that needs a stranger to see them today.
 *
 * Deliberately read live from the feed rather than tracked here. If the
 * placement falls through, the county clears the status and the dog comes back
 * to the top on the next hourly import, with nobody having to remember to undo
 * anything. That is the whole reason not to store it.
 */
export function hasSomeone(dog: { status: string | null }): boolean {
  return /PENDING/i.test(dog.status ?? "");
}

/**
 * Dogs still needing somebody come first, each group by deadline.
 *
 * Sinking rather than hiding, on purpose: the team still needs to see them, a
 * pending transfer can fall through, and a list that quietly drops dogs teaches
 * people not to trust it.
 */
function byNeed(a: Dog, b: Dog): number {
  const aPending = hasSomeone(a);
  const bPending = hasSomeone(b);
  if (aPending !== bPending) return aPending ? 1 : -1;
  return byDeadline(a, b);
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
    .sort(byNeed);

  const resolved = (raw.resolved ?? [])
    .filter(isDog)
    .map((raw) => toDog(raw, bios))
    .filter((d): d is Dog => d !== null);

  const transferred = resolved.filter((d) => d.status === "TRANSFERRED").length;
  const adopted = resolved.filter((d) => d.status === "ADOPTED").length;

  // Counting is where this matters most. "N dogs need out this week" has to
  // mean N dogs with nobody, or the number is a lie that makes the situation
  // look worse than it is and quietly wastes a volunteer's attention.
  const needSomeone = active.filter((d) => !hasSomeone(d));
  const urgentThisWeek = needSomeone.filter(
    (d) => d.daysLeft !== null && d.daysLeft <= 7,
  ).length;

  // Dogs already spoken for are excluded here too. The next deadline that
  // matters is the next one nobody is coming for. `needSomeone` inherits the
  // deadline sort from `active`, so the first with a date is the soonest.
  const nextUp = needSomeone.find((d) => d.deadline);

  return {
    fetchedAt: raw.fetched_at ?? "",
    live,
    active,
    resolved,
    stats: {
      /** Dogs still needing somebody. NOT the length of `active`. */
      waiting: needSomeone.length,
      /** Everything on the county list, including dogs already spoken for. */
      onList: active.length,
      spokenFor: active.length - needSomeone.length,
      transferred,
      adopted,
      saved: transferred + adopted,
      urgentThisWeek,
      nextDeadline: nextUp?.deadline ?? null,
      nextDeadlineDays:
        nextUp?.daysLeft === null || nextUp?.daysLeft === undefined
          ? null
          : Math.max(0, nextUp.daysLeft),
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
  // Not "deadline passed". Said about a dog we are asking a stranger to foster,
  // that reads as "you are too late" and ends the conversation. The dog is still
  // on the list and still has nobody, which is the opposite of too late.
  if (daysLeft < 0) return "Out of time";
  if (daysLeft === 0) return "Deadline today";
  if (daysLeft === 1) return "1 day left";
  return `${daysLeft} days left`;
}
