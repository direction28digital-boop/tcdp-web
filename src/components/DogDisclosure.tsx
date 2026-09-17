"use client";

import Image from "next/image";
import type { DogDisclosure } from "@/app/application/actions";
import { daysLeftLabel, formatDeadline } from "@/lib/dogs";
import { planEntries, type Entry } from "@/lib/shelter-entries";

/**
 * The record, before the questions.
 *
 * This screen exists because of one sentence from Dee: people were investing in
 * a dog, then backing out at the phone screening after hearing something the
 * write-up had not said. The cost is not politeness — it is two volunteers'
 * evening and several days off a dog's clock.
 *
 * So it is deliberately NOT a warning screen. It is not red, it does not lead
 * with risk, and it never tells somebody this dog is too much for them. Fear
 * talks good fosters out of good dogs, and the whole premise of this rescue is
 * that a frightened dog in a kennel is not a dangerous dog. What it does is show
 * them the county's own words and then ask, plainly, whether they still want to
 * go ahead — so that the answer arrives here, in ten seconds, instead of on a
 * phone call three days later.
 *
 * The way out is an equal-sized door, not fine print: somebody who reads this
 * and hesitates should find it just as easy to say "show me other dogs", because
 * that person is still a foster, just not this dog's.
 */
export function DogDisclosurePanel({
  dog,
  onContinue,
  onChooseAnother,
}: {
  dog: DogDisclosure;
  onContinue: () => void;
  onChooseAnother: () => void;
}) {
  return (
    <div className="mx-auto max-w-[760px] px-6 py-14">
      <div className="rounded-3xl bg-surface p-8 shadow-[0_2px_18px_rgba(17,17,17,0.07)] md:p-12">
        <p className="font-display text-sm font-bold tracking-[0.16em] text-rust uppercase">
          Before you spend twenty minutes
        </p>
        <h2 className="mt-3 font-display text-4xl font-extrabold text-ink">
          This is everything the shelter has written about {dog.name}
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          Not our summary of it — their record, in their words. We would rather
          you read it now and change your mind than find out on a phone call next
          week, because by then {dog.name} has lost days they did not have.
        </p>

        {/* ── Who they are ─────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-wrap items-center gap-5 rounded-2xl bg-cream p-5">
          {dog.photo ? (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-cream-deep">
              <Image
                src={dog.photo}
                alt={dog.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="min-w-[200px] flex-1">
            <p className="font-display text-2xl font-extrabold text-ink">
              {dog.name}{" "}
              <span className="text-base font-bold text-ink-soft/70">
                {dog.id}
              </span>
            </p>
            {dog.facts ? (
              <p className="text-sm text-ink-soft">{dog.facts}</p>
            ) : null}
            {dog.shelter ? (
              <p className="text-sm text-ink-soft">{dog.shelter}</p>
            ) : null}
          </div>
        </div>

        {/* ── The county's own flags ───────────────────────────────────── */}
        <ul className="mt-4 flex flex-wrap gap-2">
          {dog.reason ? (
            <Flag label={`County priority: ${dog.reason}`} />
          ) : null}
          {/* The county publishes no legend for its colours, so no gloss is
              offered. Their word, named as theirs. */}
          {dog.level ? <Flag label={`County level: ${dog.level}`} /> : null}
          {dog.nho ? (
            <Flag label="Rescue pull required — a partner rescue must take them" />
          ) : null}
          {dog.deadline ? (
            <Flag label={`${formatDeadline(dog.deadline)} · ${daysLeftLabel(dog.daysLeft)}`} />
          ) : null}
        </ul>

        {dog.spokenFor ? (
          <p className="mt-4 rounded-xl bg-sage-soft p-4 text-sm leading-relaxed text-sage">
            The county already has somebody coming for {dog.name}. You can still
            apply — placements do fall through, and your application counts for
            every other dog on the list either way.
          </p>
        ) : null}

        {/* ── The record ───────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-col gap-4">
          <Record title="Why they are on the list" body={dog.memo} />
          <Record title="What handlers have written" body={dog.evaluations} />
          <Record title="Bite history" body={dog.biteHistory} />
        </div>

        {dog.detailUrl ? (
          <p className="mt-5 text-sm leading-relaxed text-ink-soft/80">
            That is the whole record, nothing cut.{" "}
            <a
              href={dog.detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-sunset underline underline-offset-4"
            >
              Read the whole record on the county&rsquo;s page
              <span aria-hidden="true"> →</span>
              <span className="sr-only">
                {" "}
                (opens the county website in a new tab)
              </span>
            </a>
          </p>
        ) : null}

        {/* ── The two doors, the same size ─────────────────────────────── */}
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onContinue}
            className="rounded-full bg-sunset px-7 py-4 font-display text-sm font-bold tracking-wide text-white uppercase hover:bg-sunset-deep"
          >
            I have read this. Continue for {dog.name}
          </button>
          <button
            type="button"
            onClick={onChooseAnother}
            className="rounded-full border-2 border-ink px-7 py-4 font-display text-sm font-bold tracking-wide text-ink uppercase hover:bg-ink hover:text-cream"
          >
            Show me other dogs instead
          </button>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-ink-soft">
          Changing your mind here is not a wasted trip. One application covers
          every dog on the list, so you can apply as someone who will take
          whoever needs it most.
        </p>
      </div>
    </div>
  );
}

function Flag({ label }: { label: string }) {
  return (
    <li className="rounded-full bg-ink px-4 py-1.5 font-display text-xs font-bold tracking-wide text-cream uppercase">
      {label}
    </li>
  );
}

function Record({ title, body }: { title: string; body: string | null }) {
  if (!body) return null;
  const plan = planEntries(body);

  return (
    <section className="rounded-2xl bg-cream px-5 py-4">
      <h3 className="font-display text-sm font-bold tracking-wide text-ink uppercase">
        {title}
      </h3>

      {/* Folded, never cut. Somebody reading a shortened version here and
          meeting the rest on a phone call later is the exact thing this screen
          exists to prevent. */}
      {plan ? (
        <div className="mt-2">
          <Entries entries={plan.shown} />
          <details className="group/all mt-3">
            <summary className="inline-flex cursor-pointer items-center font-display text-xs font-bold tracking-wide text-sunset uppercase underline underline-offset-4 marker:content-['']">
              <span className="group-open/all:hidden">
                Show all {plan.shown.length + plan.hidden.length} entries
              </span>
              <span className="hidden group-open/all:inline">Show fewer</span>
            </summary>
            <div className="mt-3">
              <Entries entries={plan.hidden} />
            </div>
          </details>
        </div>
      ) : (
        <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-ink-soft">
          {body}
        </p>
      )}
    </section>
  );
}

function Entries({ entries }: { entries: Entry[] }) {
  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry, i) => (
        <div key={`${entry.date ?? "pre"}-${i}`}>
          {entry.date ? (
            <p className="font-display text-xs font-bold tracking-wide text-ink-soft/70 uppercase">
              {entry.date}
            </p>
          ) : null}
          {/* Whitespace preserved: the county's line breaks are what separate
              one dated observation from the next. */}
          <p className="mt-1 text-[15px] leading-relaxed whitespace-pre-line text-ink-soft">
            {entry.body}
          </p>
        </div>
      ))}
    </div>
  );
}
