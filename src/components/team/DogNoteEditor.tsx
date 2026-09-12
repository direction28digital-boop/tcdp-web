"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDogNote } from "@/app/team/dogs/actions";
import { styleWarnings } from "@/lib/dog-notes";

/**
 * Where the rescue writes in its own voice.
 *
 * House-style warnings appear as you type, and they do not block saving. The
 * point is to catch "second chance" written out of habit at 11pm, not to argue
 * with somebody who has a reason. A save button that refuses to save gets routed
 * around, and then the rule lives nowhere.
 */
export function DogNoteEditor({
  dogId,
  dogName,
  initial,
}: {
  dogId: string;
  dogName: string;
  initial: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const warnings = styleWarnings(note);
  const dirty = note.trim() !== initial.trim();

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveDogNote(dogId, note);
      if (result?.error) setError(result.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <h2 className="font-display text-lg font-extrabold text-ink">
        What we say about {dogName}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
        This shows on the public page in a box with our name on it, underneath
        the county&rsquo;s own notes. Say what the record cannot: who they are to
        us, what we are asking for, why today matters. Do not restate the
        shelter&rsquo;s observations — they are already there, in full.
      </p>

      <label htmlFor={`note-${dogId}`} className="sr-only">
        Our note about {dogName}
      </label>
      <textarea
        id={`note-${dogId}`}
        rows={6}
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          setSaved(false);
        }}
        placeholder="Fear doesn't make a dog bad, and Wednesday shouldn't be the end of her story."
        className="mt-4 w-full rounded-xl border border-line bg-cream px-4 py-3 leading-relaxed text-ink placeholder:text-ink-soft/50"
      />

      {warnings.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2" aria-live="polite">
          {warnings.map((why) => (
            <li
              key={why}
              className="rounded-xl bg-gold-soft px-4 py-3 text-sm leading-relaxed text-rust"
            >
              {why}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={pending || !dirty}
          onClick={save}
          className="rounded-full bg-sunset px-6 py-3 font-display text-xs font-bold tracking-wide text-white uppercase hover:bg-sunset-deep disabled:opacity-40"
        >
          {pending ? "Saving" : "Save our note"}
        </button>

        {note.trim() !== "" && !dirty ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setNote("");
              setSaved(false);
            }}
            className="text-sm font-semibold text-ink-soft underline underline-offset-4"
          >
            Clear it
          </button>
        ) : null}

        {saved ? (
          <p className="font-display text-sm font-bold text-sage" role="status">
            Saved. It is on the public page now.
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="mt-3 text-sunset-deep" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
