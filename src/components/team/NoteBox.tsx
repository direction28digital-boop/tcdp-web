"use client";

import { useState, useTransition } from "react";
import { addNote } from "@/app/team/actions";

export function NoteBox({ applicationId }: { applicationId: string }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await addNote(applicationId, body);
      if (result?.error) setError(result.error);
      else setBody("");
    });
  }

  return (
    <div className="mt-4">
      <label htmlFor="note" className="sr-only">
        Add a note
      </label>
      <textarea
        id="note"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Called, left a voicemail. Interested in Roger if his other application falls through."
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink placeholder:text-ink-soft/50"
      />
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={pending || body.trim().length === 0}
          onClick={save}
          className="rounded-full bg-sunset px-6 py-3 font-display text-xs font-bold tracking-wide text-white uppercase hover:bg-sunset-deep disabled:opacity-40"
        >
          {pending ? "Saving" : "Add note"}
        </button>
        {error ? (
          <p className="text-sunset-deep" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
