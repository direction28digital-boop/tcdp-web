"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { APPLY_STEPS, type Field, type Step } from "@/lib/apply-flow";

export type MatchDog = {
  id: string;
  name: string;
  weight: number | null;
  breed: string | null;
};

type Answers = Record<string, string | string[]>;

const BREED_PATTERNS: Record<string, RegExp> = {
  "Pit bull type": /pit bull|staff|am bull|bully/i,
  "German Shepherd": /germ|shepherd|gsd/i,
  Rottweiler: /rott/i,
  Doberman: /dober|pinsch/i,
  Husky: /husk|malamute/i,
  Chow: /chow/i,
};

const WEIGHT_LIMITS: Record<string, number> = {
  "Under 25 lb": 25,
  "Under 40 lb": 40,
  "Under 50 lb": 50,
  "Under 75 lb": 75,
};

export function ApplyPrototype({ dogs }: { dogs: MatchDog[] }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);

  const step: Step = APPLY_STEPS[stepIndex];
  const visible = step.fields.filter((f) => isVisible(f, answers));

  const match = useMemo(() => countMatches(dogs, answers), [dogs, answers]);
  const showMatch =
    (step.id === "home" || step.id === "dogs") &&
    (answers.weightLimit !== undefined ||
      answers.size !== undefined ||
      answers.breedRestrictions !== undefined);

  function set(id: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  if (done) {
    return <Finished answers={answers} match={match} total={dogs.length} />;
  }

  return (
    <div className="mx-auto max-w-[760px] px-6 py-10">
      <ol className="flex flex-wrap gap-2" aria-label="Progress">
        {APPLY_STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setStepIndex(i)}
              aria-current={i === stepIndex ? "step" : undefined}
              className={`rounded-full px-3 py-1.5 font-display text-xs font-bold tracking-wide uppercase transition-colors ${
                i === stepIndex
                  ? "bg-ink text-cream"
                  : i < stepIndex
                    ? "bg-sage-soft text-sage"
                    : "bg-white text-ink-soft/70 hover:text-ink"
              }`}
            >
              {s.title}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-3xl bg-surface p-7 shadow-[0_2px_18px_rgba(17,17,17,0.07)] md:p-10">
        <p className="font-display text-xs font-bold tracking-[0.18em] text-rust uppercase">
          Step {stepIndex + 1} of {APPLY_STEPS.length}
        </p>
        <h2 className="mt-2 font-display text-3xl font-extrabold text-ink">
          {step.title}
        </h2>
        {step.intro ? (
          <p className="mt-3 text-lg leading-relaxed text-ink-soft">
            {step.intro}
          </p>
        ) : null}

        <div className="mt-8 grid gap-7 sm:grid-cols-2">
          {visible.map((field) => (
            <FieldControl
              key={field.id}
              field={field}
              value={answers[field.id]}
              onChange={(v) => set(field.id, v)}
            />
          ))}
        </div>

        {showMatch ? (
          <div className="mt-9 rounded-2xl bg-sage-soft p-6">
            <p className="font-display text-lg font-extrabold text-sage">
              {match.fits} of the {dogs.length} dogs waiting today fit what you
              have told us so far.
            </p>
            {match.maybe > 0 ? (
              <p className="mt-2 text-base leading-relaxed text-ink-soft">
                Another {match.maybe} might, depending on how your landlord
                reads a breed label. Shelter breed labels are a staff guess from
                looking at the dog, so we flag those rather than hiding them and
                let you decide.
              </p>
            ) : null}
            <p className="mt-2 text-sm text-ink-soft/80">
              This number is live from today&rsquo;s county list. It is the
              whole reason for asking about your lease: you only ever see dogs
              you could actually say yes to.
            </p>
          </div>
        ) : null}

        <div className="mt-10 flex flex-wrap items-center gap-4">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={() => setStepIndex(stepIndex - 1)}
              className="rounded-full border-2 border-ink px-7 py-3 font-display text-sm font-bold tracking-wide text-ink uppercase hover:bg-ink hover:text-cream"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={() =>
              stepIndex === APPLY_STEPS.length - 1
                ? setDone(true)
                : setStepIndex(stepIndex + 1)
            }
            className="rounded-full bg-sunset px-8 py-3.5 font-display text-sm font-bold tracking-wide text-white uppercase hover:bg-sunset-deep"
          >
            {stepIndex === APPLY_STEPS.length - 1 ? "Finish" : "Next"}
          </button>
          <p className="text-sm text-ink-soft/80">
            Nothing you type here is saved or sent.
          </p>
        </div>
      </div>
    </div>
  );
}

function Finished({
  answers,
  match,
  total,
}: {
  answers: Answers;
  match: { fits: number; maybe: number };
  total: number;
}) {
  const name = typeof answers.firstName === "string" ? answers.firstName : "";
  return (
    <div className="mx-auto max-w-[760px] px-6 py-14">
      <div className="rounded-3xl bg-surface p-8 shadow-[0_2px_18px_rgba(17,17,17,0.07)] md:p-12">
        <h2 className="font-display text-4xl font-extrabold text-ink">
          That is it{name ? `, ${name}` : ""}.
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-ink-soft">
          In the finished version this is where you land: never asked those
          questions again, and looking at{" "}
          <strong className="text-ink">
            {match.fits} of the {total} dogs
          </strong>{" "}
          waiting today that fit your home. Raising your hand for any of them is
          one click and about six questions about that dog only.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          Today the same person answers roughly fifty questions per dog. Someone
          interested in three dogs answers about a hundred and fifty.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <Link
            href="/dogs"
            className="rounded-full bg-sunset px-8 py-4 font-display text-base font-bold tracking-wide text-white uppercase hover:bg-sunset-deep"
          >
            See the dogs
          </Link>
          <Link
            href="/apply"
            className="rounded-full border-2 border-ink px-8 py-4 font-display text-base font-bold tracking-wide text-ink uppercase hover:bg-ink hover:text-cream"
          >
            Walk through it again
          </Link>
        </div>
      </div>
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}) {
  const wide = field.width !== "half";
  const base =
    "mt-2 w-full rounded-xl border-2 border-line bg-cream px-4 py-3 text-base text-ink focus:border-sunset focus:outline-none";

  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label
        htmlFor={field.id}
        className="block font-display text-sm font-bold tracking-wide text-ink uppercase"
      >
        {field.label}
        {field.required ? (
          <span className="text-rust"> *</span>
        ) : (
          <span className="font-sans text-xs font-medium tracking-normal text-ink-soft/70 normal-case">
            {" "}
            optional
          </span>
        )}
      </label>

      {field.help ? (
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          {field.help}
        </p>
      ) : null}

      {field.type === "textarea" ? (
        <textarea
          id={field.id}
          rows={4}
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      ) : field.type === "select" ? (
        <select
          id={field.id}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        >
          <option value="">Choose one</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.type === "radio" || field.type === "checkbox" ? (
        <div
          role={field.type === "radio" ? "radiogroup" : "group"}
          aria-labelledby={field.id}
          className="mt-3 flex flex-wrap gap-2.5"
        >
          {field.options?.map((option) => {
            const selected =
              field.type === "radio"
                ? value === option
                : Array.isArray(value) && value.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  if (field.type === "radio") return onChange(option);
                  const current = Array.isArray(value) ? value : [];
                  onChange(
                    current.includes(option)
                      ? current.filter((v) => v !== option)
                      : [...current, option],
                  );
                }}
                className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                  selected
                    ? "border-ink bg-ink text-cream"
                    : "border-line bg-white text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : (
        <input
          id={field.id}
          type={field.type}
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      )}
    </div>
  );
}

function isVisible(field: Field, answers: Answers): boolean {
  if (!field.showWhen) return true;
  const v = answers[field.showWhen.field];
  return typeof v === "string" && field.showWhen.equals.includes(v);
}

/**
 * Counts how many of today's dogs this home could actually take.
 *
 * A weight limit is a hard line, because a lease is a lease. A breed restriction is
 * not, because the county's breed field is a staff member's visual guess, so those
 * dogs are counted separately as "might" rather than being quietly removed.
 */
function countMatches(
  dogs: MatchDog[],
  answers: Answers,
): { fits: number; maybe: number } {
  const limitLabel =
    typeof answers.weightLimit === "string" ? answers.weightLimit : "";
  const limit = WEIGHT_LIMITS[limitLabel] ?? null;

  const restricted = Array.isArray(answers.breedRestrictions)
    ? answers.breedRestrictions.filter(
        (b) => b !== "No breed restrictions" && b !== "I am not sure yet",
      )
    : [];

  const sizes = Array.isArray(answers.size) ? answers.size : [];
  const anySize = sizes.length === 0 || sizes.includes("Any size");

  let fits = 0;
  let maybe = 0;

  for (const dog of dogs) {
    if (limit !== null && dog.weight !== null && dog.weight > limit) continue;
    if (!anySize && dog.weight !== null && !sizes.includes(sizeOf(dog.weight)))
      continue;

    const clashes = restricted.some((b) =>
      BREED_PATTERNS[b]?.test(dog.breed ?? ""),
    );
    if (clashes) maybe += 1;
    else fits += 1;
  }

  return { fits, maybe };
}

function sizeOf(weight: number): string {
  if (weight < 25) return "Small";
  if (weight <= 55) return "Medium";
  return "Large";
}
