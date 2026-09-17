"use client";

import { useState, useTransition } from "react";
import { setStatus } from "@/app/team/actions";
import type { ApplicationStatus } from "@/lib/supabase/database.types";

export function ReviewPanel({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ApplicationStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [askingWhy, setAskingWhy] = useState(false);
  const [reason, setReason] = useState("");

  function go(next: ApplicationStatus, why?: string) {
    setError(null);
    startTransition(async () => {
      const result = await setStatus(applicationId, next, why);
      if (result?.error) setError(result.error);
      else setAskingWhy(false);
    });
  }

  return (
    <div className="mt-8 rounded-2xl bg-surface p-6 shadow-[0_1px_10px_rgba(17,17,17,0.05)]">
      {askingWhy ? (
        <>
          <label
            htmlFor="reason"
            className="block font-display text-sm font-bold tracking-wide text-ink uppercase"
          >
            Why not, in a sentence
          </label>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            For the team, not for them. Write it so the next volunteer does not
            have to ask you, and so nobody chases this twice.
          </p>
          <textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-3 w-full rounded-xl border border-line bg-cream px-4 py-3 text-ink"
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => go("denied", reason)}
              className="rounded-full bg-ink px-6 py-3 font-display text-xs font-bold tracking-wide text-cream uppercase disabled:opacity-60"
            >
              {pending ? "Saving" : "Save as not approved"}
            </button>
            <button
              type="button"
              onClick={() => setAskingWhy(false)}
              className="rounded-full border-2 border-ink px-6 py-3 font-display text-xs font-bold tracking-wide text-ink uppercase"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="font-display text-sm font-bold tracking-wide text-ink uppercase">
            Where this stands
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pending || status === "approved"}
              onClick={() => go("approved")}
              className="rounded-full bg-sage px-6 py-3 font-display text-xs font-bold tracking-wide text-white uppercase hover:bg-sage/90 disabled:opacity-40"
            >
              Approve
            </button>
            <button
              type="button"
              disabled={pending || status === "denied"}
              onClick={() => setAskingWhy(true)}
              className="rounded-full border-2 border-ink px-6 py-3 font-display text-xs font-bold tracking-wide text-ink uppercase hover:bg-ink hover:text-cream disabled:opacity-40"
            >
              Not approved
            </button>
            {status !== "submitted" ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => go("submitted")}
                className="rounded-full px-6 py-3 font-display text-xs font-bold tracking-wide text-ink-soft uppercase underline underline-offset-4 disabled:opacity-40"
              >
                Put back in the queue
              </button>
            ) : null}
          </div>
        </>
      )}

      {error ? (
        <p className="mt-4 text-sunset-deep" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
