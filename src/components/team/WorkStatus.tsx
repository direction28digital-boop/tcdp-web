"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimDog, setWorkStatus } from "@/app/team/dogs/actions";
import type { WorkStatus as Status } from "@/lib/supabase/database.types";

/**
 * Named for the job, not the database.
 *
 * "not_started" is a row value; "Nobody has been yet" is what a volunteer
 * understands at a glance on a phone in a shelter corridor.
 */
const STEPS: { value: Status; label: string; hint: string }[] = [
  { value: "not_started", label: "Nobody has been yet", hint: "Needs somebody to go and film" },
  { value: "filmed", label: "Filmed", hint: "Clip is here, needs overlays" },
  { value: "edited", label: "Edited", hint: "Ready to post" },
  { value: "posted", label: "Posted", hint: "Live on Facebook" },
  { value: "our_pull", label: "We are pulling them", hint: "TCDP is taking this dog directly" },
];

export function WorkStatusControl({
  dogId,
  current,
  claimedByName,
  claimedByMe,
  claimStale,
}: {
  dogId: string;
  current: Status;
  claimedByName: string | null;
  claimedByMe: boolean;
  claimStale: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function move(status: Status) {
    setError(null);
    startTransition(async () => {
      const result = await setWorkStatus(dogId, status);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  function toggleClaim() {
    setError(null);
    startTransition(async () => {
      const result = await claimDog(dogId, !claimedByMe);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  // Somebody else has it and the claim is still fresh. Say so plainly rather
  // than hiding the button — the person reading this may know something the
  // row does not, like that the other volunteer already went home.
  const heldByOther = claimedByName !== null && !claimedByMe && !claimStale;

  return (
    <div>
      <h2 className="font-display text-lg font-extrabold text-ink">
        Where this dog is up to
      </h2>

      <ul className="mt-4 flex flex-col gap-2">
        {STEPS.map((step) => {
          const active = step.value === current;
          return (
            <li key={step.value}>
              <button
                type="button"
                disabled={pending}
                onClick={() => move(step.value)}
                aria-pressed={active}
                className={
                  active
                    ? "w-full rounded-xl bg-ink px-4 py-3 text-left text-cream disabled:opacity-60"
                    : "w-full rounded-xl bg-surface px-4 py-3 text-left text-ink hover:bg-cream-deep disabled:opacity-60"
                }
              >
                <span className="block font-display text-sm font-bold tracking-wide uppercase">
                  {step.label}
                </span>
                <span
                  className={
                    active
                      ? "block text-sm text-cream/70"
                      : "block text-sm text-ink-soft"
                  }
                >
                  {step.hint}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 rounded-xl bg-cream-deep/50 p-4">
        {heldByOther ? (
          <p className="text-ink-soft">
            <span className="font-semibold text-ink">{claimedByName}</span> said
            they would go and see this dog. Take it over only if you know they
            cannot.
          </p>
        ) : claimedByMe ? (
          <p className="text-ink-soft">
            You said you would go and see this dog.
          </p>
        ) : claimedByName ? (
          <p className="text-ink-soft">
            <span className="font-semibold text-ink">{claimedByName}</span> said
            they would go, but that was a while ago.
          </p>
        ) : (
          <p className="text-ink-soft">Nobody has said they are going yet.</p>
        )}

        <button
          type="button"
          disabled={pending}
          onClick={toggleClaim}
          className="mt-3 rounded-full border-2 border-ink px-5 py-2 font-display text-xs font-bold tracking-wide text-ink uppercase hover:bg-ink hover:text-cream disabled:opacity-40"
        >
          {claimedByMe ? "Never mind, I cannot go" : "I will go and see them"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sunset-deep" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
