"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  APPLY_STEPS,
  type AnswerRow as Row,
  type Answers,
  type AnswerValue as Value,
  type Field,
  type Step,
} from "@/lib/apply-flow";
import { createClient } from "@/lib/supabase/client";
import { saveApplication } from "@/app/application/actions";

/**
 * The real application. Grown out of the August prototype, which already had the
 * step renderer, the conditional fields and the live dog match; what it did not
 * have was anywhere to put the answers.
 *
 * WHY THERE IS NO SIGN-IN WALL AT THE TOP: the whole argument for this form is
 * that a dog has four days left and the old one asked fifty questions per dog.
 * Putting "create an account" in front of that is the same wall wearing a
 * different hat. So anyone can fill it in, and the email they already gave in
 * step one becomes the sign-in at the moment they submit.
 *
 * The half-finished answers live in sessionStorage, in their own browser only,
 * so the magic-link round trip does not lose their work. It is cleared the
 * moment the application is saved.
 */

const DRAFT_KEY = "tcdp.application.draft";

export type MatchDog = {
  id: string;
  name: string;
  weight: number | null;
  breed: string | null;
};


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

export function ApplicationForm({
  dogs,
  signedIn,
  initialAnswers,
  alreadySubmitted,
}: {
  dogs: MatchDog[];
  signedIn: boolean;
  initialAnswers: Answers;
  alreadySubmitted: boolean;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [done, setDone] = useState(alreadySubmitted);
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Restore a draft left behind by the magic-link round trip. Server answers win,
  // because a saved application is a stronger signal than an abandoned tab.
  useEffect(() => {
    if (Object.keys(initialAnswers).length > 0) return;
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) setAnswers(JSON.parse(saved) as Answers);
    } catch {
      // Private mode, blocked storage. Nothing to restore, carry on.
    }
  }, [initialAnswers]);

  const stash = useCallback((value: Answers) => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(value));
    } catch {
      // Not being able to stash a draft is not a reason to stop someone applying.
    }
  }, []);

  async function submit() {
    setError(null);
    setSubmitting(true);

    if (!signedIn) {
      // They gave us an email in step one. That is the sign-in.
      const email = typeof answers.email === "string" ? answers.email.trim() : "";
      if (!email) {
        setError("We need your email to send your application back to you.");
        setStepIndex(0);
        setSubmitting(false);
        return;
      }
      stash(answers);
      const supabase = createClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", "/application");
      await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callback.toString() },
      });
      setCheckEmail(email);
      setSubmitting(false);
      return;
    }

    const result = await saveApplication(answers, "submitted");
    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {}
    setDone(true);
    setSubmitting(false);
  }

  const step: Step = APPLY_STEPS[stepIndex];
  const visible = step.fields.filter((f) => isVisible(f, answers));

  const match = useMemo(() => countMatches(dogs, answers), [dogs, answers]);
  const showMatch =
    (step.id === "home" || step.id === "dogs") &&
    (answers.weightLimit !== undefined ||
      answers.size !== undefined ||
      answers.breedsNotAllowed !== undefined);

  function set(id: string, value: Value) {
    setAnswers((prev) => {
      const next = { ...prev, [id]: value };
      stash(next);
      return next;
    });
  }

  if (done) {
    return <Finished answers={answers} match={match} total={dogs.length} />;
  }

  // Out of state. Their form puts this in red text above the first field, which
  // means somebody in Nevada can answer fifty questions before anyone tells
  // them no. Say it the moment we know, and say it kindly.
  if (answers.azResident === "No") {
    return (
      <div className="mx-auto max-w-[760px] px-6 py-14">
        <div className="rounded-3xl bg-surface p-8 shadow-[0_2px_18px_rgba(17,17,17,0.07)] md:p-12">
          <h2 className="font-display text-4xl font-extrabold text-ink">
            We can only place dogs in Arizona
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Our dogs are in Maricopa County shelters and a foster has to be close
            enough to collect them and bring them to a vet. So we have to stop
            here, and we are sorry, because you came to do a good thing.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            Two things that genuinely help from anywhere: share the dogs on our
            Facebook pages, because a share is how most of them get found, and
            look for a rescue working your own county list. Every city has one.
          </p>
          <button
            type="button"
            onClick={() => set("azResident", "")}
            className="mt-8 font-semibold text-sunset underline underline-offset-4 hover:text-sunset-deep"
          >
            I answered that wrong
          </button>
        </div>
      </div>
    );
  }

  if (checkEmail) {
    return (
      <div className="mx-auto max-w-[760px] px-6 py-14">
        <div className="rounded-3xl bg-surface p-8 shadow-[0_2px_18px_rgba(17,17,17,0.07)] md:p-12">
          <h2 className="font-display text-4xl font-extrabold text-ink">
            One click and you are done
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            We sent a link to{" "}
            <span className="font-semibold text-ink">{checkEmail}</span>. Open it
            and your application saves itself. No password, ever.
          </p>
          <p className="mt-4 leading-relaxed text-ink-soft">
            Your answers are safe in this tab in the meantime, so do not close it
            until you have clicked the link.
          </p>
          <button
            type="button"
            onClick={() => setCheckEmail(null)}
            className="mt-8 font-semibold text-sunset underline underline-offset-4 hover:text-sunset-deep"
          >
            Go back and change something
          </button>
        </div>
      </div>
    );
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

        {error ? (
          <p
            className="mt-8 rounded-xl border border-sunset/30 bg-sunset-soft px-4 py-3 leading-relaxed text-sunset-deep"
            role="alert"
          >
            {error}
          </p>
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
            disabled={submitting}
            onClick={() =>
              stepIndex === APPLY_STEPS.length - 1
                ? submit()
                : setStepIndex(stepIndex + 1)
            }
            className="rounded-full bg-sunset px-8 py-3.5 font-display text-sm font-bold tracking-wide text-white uppercase hover:bg-sunset-deep disabled:opacity-60"
          >
            {stepIndex === APPLY_STEPS.length - 1
              ? submitting
                ? "Sending"
                : "Send my application"
              : "Next"}
          </button>
          <p className="text-sm text-ink-soft/80">
            You only fill this in once.
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
  value: Value | undefined;
  onChange: (v: Value) => void;
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

      {field.type === "repeater" ? (
        <RepeaterControl
          field={field}
          rows={Array.isArray(value) ? (value as Row[]) : []}
          onChange={(rows) => onChange(rows)}
        />
      ) : field.type === "textarea" ? (
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
                : Array.isArray(value) &&
                  (value as string[]).includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  if (field.type === "radio") return onChange(option);
                  const current = (
                    Array.isArray(value) ? value : []
                  ) as string[];
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

/**
 * A repeating group: household members, resident dogs, trips, alternate emails.
 *
 * Starts with ZERO rows, not one. An empty row sitting there reads as a required
 * question and makes the form look longer than it is; "Add another person" is an
 * invitation, a blank form is a demand.
 *
 * Removing a row keeps its neighbours intact by filtering on index rather than
 * splicing state in place, which is the classic way these lose the wrong row.
 */
function RepeaterControl({
  field,
  rows,
  onChange,
}: {
  field: Field;
  rows: Row[];
  onChange: (rows: Row[]) => void;
}) {
  const max = field.max ?? 10;
  const sub = field.fields ?? [];

  function update(index: number, key: string, value: string) {
    onChange(rows.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  return (
    <div className="mt-3">
      {rows.length > 0 ? (
        <ul className="space-y-4">
          {rows.map((row, index) => (
            <li
              key={index}
              className="rounded-2xl border-2 border-line bg-white p-5"
            >
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-display text-sm font-bold tracking-wide text-ink-soft uppercase">
                  {index + 1}
                </p>
                <button
                  type="button"
                  onClick={() => onChange(rows.filter((_, i) => i !== index))}
                  className="text-sm font-semibold text-sunset underline underline-offset-4 hover:text-sunset-deep"
                >
                  Remove
                </button>
              </div>

              <div className="mt-3 grid gap-5 sm:grid-cols-2">
                {sub.map((f) => (
                  <div key={f.id} className={f.width === "half" ? "" : "sm:col-span-2"}>
                    <label
                      htmlFor={`${field.id}-${index}-${f.id}`}
                      className="block text-sm font-semibold text-ink"
                    >
                      {f.label}
                    </label>
                    {f.type === "select" || f.type === "radio" ? (
                      <select
                        id={`${field.id}-${index}-${f.id}`}
                        value={row[f.id] ?? ""}
                        onChange={(e) => update(index, f.id, e.target.value)}
                        className="mt-1.5 w-full rounded-xl border-2 border-line bg-cream px-3 py-2.5 text-base text-ink focus:border-sunset focus:outline-none"
                      >
                        <option value="">Choose one</option>
                        {f.options?.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`${field.id}-${index}-${f.id}`}
                        type={f.type === "repeater" ? "text" : f.type}
                        value={row[f.id] ?? ""}
                        onChange={(e) => update(index, f.id, e.target.value)}
                        className="mt-1.5 w-full rounded-xl border-2 border-line bg-cream px-3 py-2.5 text-base text-ink focus:border-sunset focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {rows.length < max ? (
        <button
          type="button"
          onClick={() => onChange([...rows, {}])}
          className="mt-3 rounded-full border-2 border-ink px-5 py-2.5 font-display text-xs font-bold tracking-wide text-ink uppercase hover:bg-ink hover:text-cream"
        >
          {field.addLabel ?? "Add one"}
        </button>
      ) : (
        <p className="mt-3 text-sm text-ink-soft">
          That is as many as this form takes. Put anything else in the last box.
        </p>
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

  const restricted = Array.isArray(answers.breedsNotAllowed)
    ? (answers.breedsNotAllowed as string[]).filter(
        (b) => b !== "No breed restrictions" && b !== "I am not sure yet",
      )
    : [];

  const sizes = (Array.isArray(answers.size) ? answers.size : []) as string[];
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
