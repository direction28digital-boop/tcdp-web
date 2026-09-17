"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Magic-link sign in.
 *
 * Deliberate choice: the success message is IDENTICAL whether or not the
 * address belongs to anyone. Saying "no account with that email" would turn
 * this box into a way for a stranger to check which volunteers, and which
 * applicants, are in the system. Applicants here are people who told a rescue
 * where they live and who lives with them, so that is not a small leak.
 */
export function SignInForm() {
  const params = useSearchParams();

  // Only ever a path on this site. A crafted ?next= must not be able to bounce
  // someone off-site carrying the trust of having just signed in.
  const rawNext = params.get("next") ?? "";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "";

  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(params.get("error"));

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setState("sending");

    const supabase = createClient();
    const callback = new URL("/auth/callback", window.location.origin);
    if (next) callback.searchParams.set("next", next);

    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callback.toString() },
    });

    // Rate limiting is the one failure worth naming, because the fix is
    // "wait a minute" and a generic message would have them retrying forever.
    if (sendError && /rate|seconds|limit/i.test(sendError.message)) {
      setError("That was quick. Give it a minute, then ask for another link.");
      setState("idle");
      return;
    }

    // Any other failure still shows the neutral confirmation. See the note above.
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div
        className="mt-10 rounded-2xl border border-sage-soft bg-sage-soft/60 p-7"
        role="status"
      >
        <h2 className="font-display text-xl font-bold text-sage">
          Check your email
        </h2>
        <p className="mt-3 leading-relaxed text-ink-soft">
          If <span className="font-semibold text-ink">{email.trim()}</span> is
          set up here, a sign-in link is on its way. It works once and it
          expires in an hour.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          Nothing after a few minutes? Look in spam, then{" "}
          <button
            type="button"
            onClick={() => setState("idle")}
            className="font-semibold text-sunset underline underline-offset-4 hover:text-sunset-deep"
          >
            try a different address
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-10">
      {error && (
        <p
          className="mb-6 rounded-xl border border-sunset/30 bg-sunset-soft px-4 py-3 leading-relaxed text-sunset-deep"
          role="alert"
        >
          {error}
        </p>
      )}

      <label
        htmlFor="email"
        className="block font-display text-sm font-bold tracking-wide text-ink uppercase"
      >
        Email address
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-lg text-ink placeholder:text-ink-soft/50"
        placeholder="you@example.com"
      />

      <button
        type="submit"
        disabled={state === "sending"}
        className="mt-6 w-full rounded-full bg-sunset px-7 py-4 font-display text-sm font-bold tracking-wide text-white uppercase hover:bg-sunset-deep disabled:opacity-60"
      >
        {state === "sending" ? "Sending" : "Email me a link"}
      </button>

      <p className="mt-6 text-sm leading-relaxed text-ink-soft">
        Volunteers and applicants use the same box. Where you land after signing
        in depends on who you are.
      </p>
    </form>
  );
}
