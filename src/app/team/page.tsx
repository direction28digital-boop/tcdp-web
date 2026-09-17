import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { TeamNav } from "@/components/team/TeamNav";
import { isStaff, requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  daysLeftLabel,
  formatAge,
  formatBreed,
  getDogs,
  hasSomeone,
  type Dog,
} from "@/lib/dogs";

export const metadata: Metadata = {
  title: "Needs attention",
  robots: { index: false, follow: false },
};

/** A dog cannot leave the E-list without a person, so a person is the unit of urgency. */
const URGENT_DAYS = 2;

type PendingApp = {
  id: string;
  submitted_at: string | null;
  dog_interest: "specific" | "any" | null;
  dog_raw: string | null;
  dog_id: string | null;
  profiles: { full_name: string | null; email: string } | null;
};

function who(app: PendingApp): string {
  return app.profiles?.full_name?.trim() || app.profiles?.email || "Someone";
}

function waitingSince(iso: string | null): string {
  if (!iso) return "just now";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "since yesterday";
  return `for ${days} days`;
}

export default async function NeedsAttentionPage() {
  const viewer = await requireMember();
  const supabase = await createClient();

  const staff = isStaff(viewer);

  // A volunteer's own query against `applications` returns nothing — RLS puts
  // it behind private.is_org_staff(). Skipping the query rather than running a
  // doomed one keeps the page honest: they see the dog work, which is theirs,
  // and never an empty section that reads like something is broken.
  const [{ active }, { data, error }] = await Promise.all([
    getDogs(),
    !staff
      ? Promise.resolve({ data: [] as PendingApp[], error: null })
      : supabase
      .from("applications")
      .select(
        // Named FK: applications points at profiles twice.
        "id, submitted_at, dog_interest, dog_raw, dog_id, profiles!applications_profile_id_fkey(full_name, email)",
      )
      .eq("org_id", viewer.org.id)
      .eq("status", "submitted")
      .order("submitted_at", { ascending: true, nullsFirst: false })
      .limit(300),
  ]);

  if (error) console.error("[team] needs-attention query failed", error);
  const apps = (data ?? []) as unknown as PendingApp[];

  // ── Group 1 ───────────────────────────────────────────────────────────────
  // A dog with somebody already waiting on us. This is the top of the list and
  // it is not close: the foster exists, the dog is still on the E-list, and the
  // only thing standing between them is a volunteer opening the application.
  const byDog = new Map<string, PendingApp[]>();
  for (const app of apps) {
    if (!app.dog_id) continue;
    byDog.set(app.dog_id, [...(byDog.get(app.dog_id) ?? []), app]);
  }
  const claimed = active
    .filter((d) => byDog.has(d.id))
    .map((dog) => ({ dog, apps: byDog.get(dog.id)! }));

  // ── Group 2 ───────────────────────────────────────────────────────────────
  // Out of time or nearly, and nobody has come. Dogs already spoken for are out
  // of this group entirely: a TRANSFER PENDING dog with one day left does not
  // need a volunteer's attention today, and putting them here would spend it.
  const outOfTime = active.filter(
    (d) =>
      !hasSomeone(d) &&
      !byDog.has(d.id) &&
      d.daysLeft !== null &&
      d.daysLeft <= URGENT_DAYS,
  );

  // ── Group 3 ───────────────────────────────────────────────────────────────
  // Somebody typed a dog's name and we could not work out who they meant, so
  // the match needs human eyes. Left alone this is the quietest way to lose a
  // placement: the application looks processed, and the dog it was for never
  // hears about it.
  const unmatched = apps.filter(
    (a) => a.dog_interest === "specific" && !a.dog_id,
  );

  const total = claimed.length + outOfTime.length + unmatched.length;

  return (
    <>
      <SiteNav />
      <main id="main" className="min-h-screen bg-cream">
        <div className="mx-auto max-w-[1100px] px-6 py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">
              Needs attention
            </h1>
            <p className="text-ink-soft">
              Signed in as{" "}
              <span className="font-semibold text-ink">
                {viewer.profile.full_name || viewer.profile.email}
              </span>
              {viewer.role === "admin" ? " (admin)" : ""}
            </p>
          </div>

          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Our list, not the county&rsquo;s. Everything here is waiting on
            somebody in this group.
          </p>

          <div className="mt-8">
            <TeamNav current="/team" counts={{ "/team": total }} />
          </div>

          {total === 0 ? (
            <div className="mt-10 rounded-2xl bg-surface p-10 text-center">
              <p className="font-display text-2xl font-extrabold text-ink">
                Nothing is waiting on us.
              </p>
              <p className="mt-2 text-ink-soft">
                Every application has been looked at and no dog is down to their
                last two days without somebody. Check back after the next import.
              </p>
            </div>
          ) : null}

          {/* ── Somebody is waiting ────────────────────────────────────── */}
          {claimed.length > 0 ? (
            <Section
              title="Somebody applied for these dogs"
              note="The foster is already here. Open the application."
              count={claimed.length}
              tone="sunset"
            >
              <ul className="grid gap-4">
                {claimed.map(({ dog, apps }) => (
                  <li key={dog.id}>
                    <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-surface p-4 shadow-[0_2px_14px_rgba(17,17,17,0.06)]">
                      <DogThumb dog={dog} />
                      <div className="min-w-[200px] flex-1">
                        <p className="font-display text-lg font-extrabold text-ink">
                          <Link
                            href={`/team/dogs/${dog.id}`}
                            className="hover:underline"
                          >
                            {dog.name}
                          </Link>{" "}
                          <span className="text-sm font-semibold text-ink-soft/70">
                            {dog.id}
                          </span>
                        </p>
                        <p className="text-sm text-ink-soft">
                          {[formatAge(dog.age), formatBreed(dog.breed), dog.shelter]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <p className="mt-1 font-display text-xs font-bold tracking-wide text-sunset uppercase">
                          {daysLeftLabel(dog.daysLeft)}
                        </p>
                      </div>
                      <ul className="flex flex-col gap-2">
                        {apps.map((app) => (
                          <li key={app.id}>
                            <Link
                              href={`/team/applications/${app.id}`}
                              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 font-display text-xs font-bold tracking-wide text-cream uppercase hover:bg-sunset"
                            >
                              {who(app)} — waiting {waitingSince(app.submitted_at)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {/* ── Out of time ────────────────────────────────────────────── */}
          {outOfTime.length > 0 ? (
            <Section
              title="Down to the wire with nobody"
              note={`${URGENT_DAYS} days or less and no application. These are the ones to film and post today.`}
              count={outOfTime.length}
              tone="rust"
            >
              <ul className="grid gap-3 sm:grid-cols-2">
                {outOfTime.map((dog) => (
                  <li
                    key={dog.id}
                    className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-[0_2px_14px_rgba(17,17,17,0.06)]"
                  >
                    <DogThumb dog={dog} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-extrabold text-ink">
                        <Link href={`/team/dogs/${dog.id}`} className="hover:underline">
                          {dog.name}
                        </Link>
                      </p>
                      <p className="truncate text-sm text-ink-soft">
                        {[dog.shelter, dog.kennel ? `Kennel ${dog.kennel}` : null]
                          .filter(Boolean)
                          .join(" · ") || dog.id}
                      </p>
                      <p className="mt-1 font-display text-xs font-bold tracking-wide text-rust uppercase">
                        {daysLeftLabel(dog.daysLeft)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {/* ── Unmatched ──────────────────────────────────────────────── */}
          {unmatched.length > 0 ? (
            <Section
              title="We could not tell which dog they meant"
              note="They named a dog we could not find on today's list. Read it and work out who they mean before the answer stops mattering."
              count={unmatched.length}
              tone="gold"
            >
              <ul className="grid gap-3">
                {unmatched.map((app) => (
                  <li key={app.id}>
                    <Link
                      href={`/team/applications/${app.id}`}
                      className="flex flex-wrap items-baseline justify-between gap-3 rounded-2xl bg-surface p-4 shadow-[0_2px_14px_rgba(17,17,17,0.06)] hover:bg-cream-deep"
                    >
                      <span className="font-display text-lg font-extrabold text-ink">
                        {who(app)}
                      </span>
                      <span className="text-ink-soft">
                        asked for{" "}
                        <span className="font-semibold text-ink">
                          &ldquo;{app.dog_raw || "a dog they did not name"}&rdquo;
                        </span>
                      </span>
                      <span className="font-display text-xs font-bold tracking-wide text-ink-soft uppercase">
                        Waiting {waitingSince(app.submitted_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>
      </main>
    </>
  );
}

const TONES: Record<string, string> = {
  sunset: "bg-sunset text-white",
  rust: "bg-rust text-white",
  gold: "bg-gold-soft text-rust",
};

function Section({
  title,
  note,
  count,
  tone,
  children,
}: {
  title: string;
  note: string;
  count: number;
  tone: keyof typeof TONES | string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex min-w-8 items-center justify-center rounded-full px-3 py-1 font-display text-sm font-black tabular-nums ${TONES[tone] ?? TONES.gold}`}
        >
          {count}
        </span>
        <h2 className="font-display text-2xl font-extrabold text-ink">
          {title}
        </h2>
      </div>
      <p className="mt-2 max-w-3xl text-ink-soft">{note}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DogThumb({ dog }: { dog: Dog }) {
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
      {dog.photo ? (
        <Image
          src={dog.photo}
          alt=""
          fill
          sizes="64px"
          className="object-cover"
        />
      ) : null}
    </div>
  );
}
