import type { Sections } from "@/lib/dogs";
import { planEntries, type Entry } from "@/lib/shelter-entries";

/**
 * The county record, shown as the county wrote it.
 *
 * Order is chosen, wording is not. The placement memo comes first because it is
 * the deadline notice and the only part that is time-critical; the behaviour
 * evaluations come next because they are what people actually came to read; the
 * medical log and the kennel rounds sit lower because they are long, clinical and
 * matter to fewer readers. Nothing is rewritten, trimmed or paraphrased.
 *
 * EVERY CHARACTER IS ON THIS PAGE. Long sections open on their most recent dated
 * entries with the rest behind "Show all N entries" — not a link somewhere else.
 * Dee: "I would rather have it all here, even if we have to expand." She is
 * right, and the old 2,500-character cut was worse than it looked: it dropped
 * eleven of Cruz's fifteen handler entries, and pointed at a county page that
 * disappears the moment a dog leaves the list.
 *
 * The memo and the evaluations open on arrival; the clinical blocks stay closed.
 * A disclosure somebody has to go looking for is the shape of hiding something,
 * but opening all six would bury the photo and the deadline under a medication
 * log nobody is deciding on.
 */
type Block = {
  key: keyof Sections;
  title: string;
  note?: string;
  open?: boolean;
};

const BLOCKS: Block[] = [
  {
    key: "memo",
    title: "Shelter memo and intake",
    note: "Why the county put this dog on the priority list, and how they arrived.",
    open: true,
  },
  {
    key: "evaluationComments",
    title: "Behavior evaluations",
    note: "Written by handlers, dated, in their words.",
    open: true,
  },
  { key: "biteHistory", title: "Bite history" },
  {
    key: "kennelRounds",
    title: "Daily kennel rounds",
    note: "The county's own scoring. The numbers are theirs, not ours.",
  },
  { key: "medicalTreatments", title: "Medical record" },
  { key: "intake", title: "Dates and requirements" },
];

export function ShelterNotes({
  sections,
  detailUrl,
  dogName,
}: {
  sections: Sections;
  detailUrl: string | null;
  dogName: string;
}) {
  const present = BLOCKS.filter((b) => sections[b.key]);

  if (present.length === 0) {
    return (
      <p className="text-lg leading-relaxed text-ink-soft">
        The county has not posted notes for {dogName} yet.{" "}
        {detailUrl ? (
          <SourceLink href={detailUrl} label="Check their county page" />
        ) : null}
      </p>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-extrabold text-ink">
        What the shelter wrote
      </h2>
      <p className="mt-2 max-w-2xl leading-relaxed text-ink-soft">
        Everything below is {dogName}&rsquo;s Maricopa County record, in the
        county&rsquo;s words, complete. We have not edited it or added to it.
        Anything written in our own voice is labelled as ours.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {present.map((block) => (
          <details
            key={block.key}
            open={block.open}
            className="group rounded-2xl bg-cream px-5 py-4 open:bg-cream-deep/40"
          >
            <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-sm font-bold tracking-wide text-ink uppercase marker:content-['']">
              <span>{block.title}</span>
              <span
                aria-hidden="true"
                className="text-ink-soft transition-transform group-open:rotate-180"
              >
                ▾
              </span>
            </summary>

            {block.note ? (
              <p className="mt-3 text-sm text-ink-soft">{block.note}</p>
            ) : null}

            <SectionBody body={sections[block.key]!} />
          </details>
        ))}
      </div>

      {detailUrl ? (
        <p className="mt-6 text-sm leading-relaxed text-ink-soft/80">
          This is a complete copy, taken from the county&rsquo;s priority portal
          and refreshed every hour.{" "}
          <SourceLink href={detailUrl} label="See the original" />, though the
          county takes a dog&rsquo;s page down once they leave the list, so that
          link stops working when {dogName} gets out. This page will not.
        </p>
      ) : null}
    </div>
  );
}

function SectionBody({ body }: { body: string }) {
  const plan = planEntries(body);

  // Undated, or a single entry: nothing to fold, so it renders whole.
  if (!plan) return <Prose>{body}</Prose>;

  return (
    <div className="mt-3">
      <EntryList entries={plan.shown} />

      {/* Nested on purpose rather than a button: a <details> needs no
          JavaScript, so the rest of the record is reachable even if the page
          never hydrates — which is the one thing this section cannot afford. */}
      <details className="mt-3 group/all">
        <summary className="inline-flex cursor-pointer items-center gap-2 font-display text-xs font-bold tracking-wide text-sunset uppercase underline underline-offset-4 marker:content-['']">
          <span className="group-open/all:hidden">
            Show all {plan.shown.length + plan.hidden.length} entries
          </span>
          <span className="hidden group-open/all:inline">Show fewer</span>
        </summary>
        <div className="mt-3">
          <EntryList entries={plan.hidden} />
        </div>
      </details>
    </div>
  );
}

function EntryList({ entries }: { entries: Entry[] }) {
  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry, i) => (
        <div key={`${entry.date ?? "pre"}-${i}`}>
          {entry.date ? (
            <p className="font-display text-xs font-bold tracking-wide text-ink-soft/70 uppercase">
              {entry.date}
            </p>
          ) : null}
          <Prose className={entry.date ? "mt-1" : undefined}>{entry.body}</Prose>
        </div>
      ))}
    </div>
  );
}

/** Whitespace preserved: the county's line breaks carry the structure. */
function Prose({
  children,
  className = "mt-3",
}: {
  children: string;
  className?: string;
}) {
  return (
    <p
      className={`text-[15px] leading-relaxed whitespace-pre-line text-ink-soft ${className}`}
    >
      {children}
    </p>
  );
}

function SourceLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-sunset underline underline-offset-4 hover:text-sunset-deep"
    >
      {label}
      <span aria-hidden="true"> →</span>
      <span className="sr-only"> (opens the county website in a new tab)</span>
    </a>
  );
}

/**
 * The rescue's own words, and unmistakably the rescue's.
 *
 * Separate box, named byline, different ground. The whole point of removing the
 * generated bio was that it wore the shelter's voice; anything we say has to be
 * visibly ours or we have rebuilt the same problem in a nicer font.
 */
export function RescueNote({ note }: { note: string }) {
  return (
    <aside className="mt-9 rounded-2xl border-2 border-sunset/25 bg-sunset-soft p-6">
      <p className="font-display text-sm font-bold tracking-[0.16em] text-rust uppercase">
        From The Crazy Dog People
      </p>
      <p className="mt-3 text-lg leading-relaxed whitespace-pre-line text-ink">
        {note}
      </p>
    </aside>
  );
}
