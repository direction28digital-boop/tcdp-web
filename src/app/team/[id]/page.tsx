import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { requireTeam } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { APPLY_STEPS } from "@/lib/apply-flow";
import type { ApplicationStatus } from "@/lib/supabase/database.types";
import { StatusPill } from "@/components/team/StatusPill";
import { ReviewPanel } from "@/components/team/ReviewPanel";
import { NoteBox } from "@/components/team/NoteBox";

export const metadata: Metadata = {
  title: "Application",
  robots: { index: false, follow: false },
};

type Answers = Record<string, string | string[]>;

export default async function ApplicationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await requireTeam();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: app, error: appError }, { data: notes }] = await Promise.all([
    supabase
      .from("applications")
      // Named FK: see the note in /team. profile_id and reviewed_by both point
      // at profiles, so the embed has to say which one it means.
      .select("*, profiles!applications_profile_id_fkey(full_name, email, phone)")
      .eq("id", id)
      .eq("org_id", viewer.org.id)
      .maybeSingle(),
    supabase
      .from("application_notes")
      .select(
        "id, body, created_at, profiles!application_notes_author_id_fkey(full_name, email)",
      )
      .eq("application_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (appError) console.error("[team] application detail query failed", appError);
  if (!app) notFound();

  const answers = (app.answers ?? {}) as Answers;
  const person = (app as unknown as {
    profiles: { full_name: string | null; email: string; phone: string | null } | null;
  }).profiles;

  return (
    <>
      <SiteNav />
      <main id="main" className="min-h-screen bg-cream">
        <div className="mx-auto max-w-[900px] px-6 py-10">
          <Link
            href="/team"
            className="font-semibold text-sunset underline underline-offset-4 hover:text-sunset-deep"
          >
            Back to applications
          </Link>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">
              {person?.full_name || person?.email || "Application"}
            </h1>
            <StatusPill status={app.status as ApplicationStatus} />
          </div>

          <p className="mt-2 text-lg text-ink-soft">
            {person?.email}
            {person?.phone ? ` · ${person.phone}` : ""}
          </p>

          {app.denial_reason ? (
            <p className="mt-5 rounded-xl border border-line bg-surface px-5 py-4 leading-relaxed text-ink-soft">
              <span className="font-semibold text-ink">Reason recorded:</span>{" "}
              {app.denial_reason}
            </p>
          ) : null}

          <ReviewPanel
            applicationId={app.id}
            status={app.status as ApplicationStatus}
          />

          {/* Notes sit ABOVE the answers on purpose. What the team already
              decided is what a volunteer opening this needs first; the answers
              are reference. */}
          <section className="mt-12">
            <h2 className="font-display text-2xl font-extrabold text-ink">
              Notes
            </h2>
            <NoteBox applicationId={app.id} />

            {notes && notes.length > 0 ? (
              <ul className="mt-6 space-y-4">
                {notes.map((n) => {
                  const author = (n as unknown as {
                    profiles: { full_name: string | null; email: string } | null;
                  }).profiles;
                  return (
                    <li
                      key={n.id}
                      className="rounded-2xl bg-surface p-5 shadow-[0_1px_10px_rgba(17,17,17,0.05)]"
                    >
                      <p className="leading-relaxed whitespace-pre-wrap text-ink">
                        {n.body}
                      </p>
                      <p className="mt-3 text-sm text-ink-soft">
                        {author?.full_name || author?.email || "Someone"} ·{" "}
                        {new Date(n.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-6 text-ink-soft">
                Nothing written down yet. Anything you put here is stamped with
                your name and the time, and it never changes their answers.
              </p>
            )}
          </section>

          <section className="mt-12">
            <h2 className="font-display text-2xl font-extrabold text-ink">
              What they told us
            </h2>
            {APPLY_STEPS.map((step) => {
              const filled = step.fields.filter(
                (f) => answers[f.id] !== undefined && String(answers[f.id]).length > 0,
              );
              if (filled.length === 0) return null;
              return (
                <div key={step.id} className="mt-7">
                  <h3 className="font-display text-sm font-bold tracking-[0.14em] text-ink-soft uppercase">
                    {step.title}
                  </h3>
                  <dl className="mt-3 divide-y divide-line rounded-2xl bg-surface px-5">
                    {filled.map((f) => (
                      <div
                        key={f.id}
                        className="grid gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:gap-6"
                      >
                        <dt className="text-ink-soft">{f.label}</dt>
                        <dd className="font-medium whitespace-pre-wrap text-ink">
                          {Array.isArray(answers[f.id])
                            ? (answers[f.id] as string[]).join(", ")
                            : (answers[f.id] as string)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </section>
        </div>
      </main>
    </>
  );
}
