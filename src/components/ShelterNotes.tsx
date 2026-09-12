import type { Sections } from "@/lib/dogs";

/**
 * The county record, shown as the county wrote it.
 *
 * Order is chosen, wording is not. The placement memo comes first because it is
 * the deadline notice and the only part that is time-critical; the behaviour
 * evaluations come next because they are what people actually came to read; the
 * medical log and the kennel rounds sit lower because they are long, clinical and
 * matter to fewer readers. Nothing is rewritten, trimmed or paraphrased.
 *
 * Everything is a <details>, closed by default. Median evaluation comments run
 * 3,600 characters and the longest is 12,500 — open on a phone that is a wall of
 * text that buries the photo and the deadline. Closed, the reader chooses.
 */
const LONG_ENOUGH_TO_SEND_THEM_ON = 2500;

type Block = { key: keyof Sections; title: string; note?: string };

const BLOCKS: Block[] = [
  {
    key: "memo",
    title: "Shelter memo and intake",
    note: "Why the county put this dog on the priority list, and how they arrived.",
  },
  {
    key: "evaluationComments",
    title: "Behavior evaluations",
    note: "Written by handlers, dated, in their words.",
  },
  {
    key: "biteHistory",
    title: "Bite history",
  },
  {
    key: "kennelRounds",
    title: "Daily kennel rounds",
    note: "The county's own scoring. The numbers are theirs, not ours.",
  },
  {
    key: "medicalTreatments",
    title: "Medical record",
  },
  {
    key: "intake",
    title: "Dates and requirements",
  },
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
        Straight from {dogName}&rsquo;s Maricopa County record, word for word. We
        have not softened it and we have not added to it. Anything in our own
        voice is labelled as ours.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {present.map((block) => {
          const body = sections[block.key]!;
          const long = body.length > LONG_ENOUGH_TO_SEND_THEM_ON;
          const shown = long
            ? body.slice(0, LONG_ENOUGH_TO_SEND_THEM_ON).trimEnd()
            : body;

          return (
            <details
              key={block.key}
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

              {/* Whitespace preserved: the county's line breaks separate one
                  dated entry from the next, and collapsing them runs a week of
                  observations into one paragraph. */}
              <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-ink-soft">
                {shown}
                {long ? "…" : ""}
              </p>

              {long && detailUrl ? (
                <p className="mt-4">
                  <SourceLink
                    href={detailUrl}
                    label={`Read the rest on the county's page`}
                  />
                </p>
              ) : null}
            </details>
          );
        })}
      </div>

      {detailUrl ? (
        <p className="mt-6 text-sm leading-relaxed text-ink-soft/80">
          This is a copy, taken from the county&rsquo;s priority portal and
          refreshed every hour.{" "}
          <SourceLink href={detailUrl} label="See the original" /> — though the
          county takes a dog&rsquo;s page down once they leave the list, so that
          link stops working when {dogName} gets out.
        </p>
      ) : null}
    </div>
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
