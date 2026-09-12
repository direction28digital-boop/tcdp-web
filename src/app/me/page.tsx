import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/lib/supabase/database.types";

export const metadata: Metadata = {
  title: "Your application",
  robots: { index: false, follow: false },
};

/**
 * Where everyone lands after a magic link, because /auth/callback defaults
 * `next` to here. So this page's job is to be a fork, not a destination:
 * volunteers go to the queue, applicants see their own application.
 *
 * It must never 404. Anyone who gets here has just proved they own an email
 * address, and a dead end at that exact moment reads as "it did not work".
 */
export default async function MePage() {
  const viewer = await requireViewer("/me");

  // A volunteer has no reason to look at a personal application page.
  if (viewer.role) redirect("/team");

  const supabase = await createClient();
  const { data: application } = await supabase
    .from("applications")
    .select("status, submitted_at, updated_at")
    .eq("org_id", viewer.org.id)
    .eq("profile_id", viewer.profile.id)
    .maybeSingle();

  // Signed in, nothing started. Nothing to show them, so do not show them a
  // page about nothing: put them in the form.
  if (!application) redirect("/application");

  const status = application.status as ApplicationStatus;
  const name = viewer.profile.full_name?.split(" ")[0] ?? "";

  return (
    <>
      <SiteNav />
      <main id="main" className="bg-cream">
        <div className="mx-auto max-w-[680px] px-6 py-20">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">
            {name ? `Hi ${name}.` : "Your application"}
          </h1>

          <div className="mt-8 rounded-3xl bg-surface p-8 shadow-[0_2px_18px_rgba(17,17,17,0.07)]">
            <p className="font-display text-2xl font-bold text-ink">
              {HEADLINE[status]}
            </p>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              {BODY[status]}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/application"
                className="rounded-full bg-sunset px-7 py-3.5 font-display text-sm font-bold tracking-wide text-white uppercase hover:bg-sunset-deep"
              >
                {status === "draft" ? "Finish it" : "Update my answers"}
              </Link>
              <Link
                href="/dogs"
                className="rounded-full border-2 border-ink px-7 py-3.5 font-display text-sm font-bold tracking-wide text-ink uppercase hover:bg-ink hover:text-cream"
              >
                See who is waiting
              </Link>
            </div>
          </div>

          <p className="mt-8 text-sm leading-relaxed text-ink-soft">
            Changed address, or your landlord finally said yes? Update your
            answers rather than filling the whole thing in again. It is the same
            application either way.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

/**
 * Written for a person who is waiting on a stranger to read something they
 * spent five minutes on. No status jargon, and no promise about timing that a
 * volunteer team of five cannot keep.
 */
const HEADLINE: Record<ApplicationStatus, string> = {
  draft: "You have not sent it yet",
  submitted: "It is in",
  approved: "You are approved",
  denied: "Not this time",
  withdrawn: "You withdrew this",
};

const BODY: Record<ApplicationStatus, string> = {
  draft:
    "Your answers are saved exactly where you left them. Pick it back up whenever you have a minute.",
  submitted:
    "Somebody on the team will read it. We are all volunteers with day jobs, so it is not instant, but it does get read. In the meantime you can look at the dogs waiting right now.",
  approved:
    "That means you can raise your hand for any dog on the list and we already know your home. Go and find one.",
  denied:
    "Somebody looked and it was not a fit for the dogs we have right now. That is about the dogs, not about you, and things change. Your answers are still here if you want to update them.",
  withdrawn:
    "Nothing is active right now. If that was a mistake, updating your answers puts you back in.",
};
