import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { requireTeam } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/lib/supabase/database.types";
import { StatusPill } from "@/components/team/StatusPill";

export const metadata: Metadata = {
  title: "Applications",
  robots: { index: false, follow: false },
};

type Row = {
  id: string;
  status: ApplicationStatus;
  submitted_at: string | null;
  updated_at: string;
  housing: string | null;
  has_dogs: boolean | null;
  has_cats: boolean | null;
  has_kids: boolean | null;
  zip: string | null;
  profiles: { full_name: string | null; email: string; phone: string | null } | null;
};

const FILTERS: { key: string; label: string; statuses: ApplicationStatus[] }[] = [
  { key: "new", label: "Waiting on us", statuses: ["submitted"] },
  { key: "approved", label: "Approved", statuses: ["approved"] },
  { key: "denied", label: "Not approved", statuses: ["denied"] },
  { key: "draft", label: "Started, not sent", statuses: ["draft"] },
  { key: "all", label: "Everyone", statuses: [] },
];

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; q?: string }>;
}) {
  const viewer = await requireTeam();
  const params = await searchParams;
  const show = FILTERS.find((f) => f.key === params.show) ?? FILTERS[0];
  const q = (params.q ?? "").trim();

  const supabase = await createClient();
  let query = supabase
    .from("applications")
    .select(
      "id, status, submitted_at, updated_at, housing, has_dogs, has_cats, has_kids, zip, profiles(full_name, email, phone)",
    )
    .eq("org_id", viewer.org.id)
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(200);

  if (show.statuses.length > 0) query = query.in("status", show.statuses);

  const { data, error } = await query;
  const rows = (data ?? []) as unknown as Row[];

  // Search runs here rather than in Postgres because the name lives on the
  // joined profile, and filtering an embedded resource server-side would drop
  // rows rather than filter them. Two hundred rows is nothing to scan.
  const needle = q.toLowerCase();
  const visible = needle
    ? rows.filter((r) =>
        [r.profiles?.full_name, r.profiles?.email, r.zip]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(needle)),
      )
    : rows;

  const waiting = rows.filter((r) => r.status === "submitted").length;

  return (
    <>
      <SiteNav />
      <main id="main" className="min-h-screen bg-cream">
        <div className="mx-auto max-w-[1100px] px-6 py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">
              Applications
            </h1>
            <p className="text-ink-soft">
              Signed in as{" "}
              <span className="font-semibold text-ink">
                {viewer.profile.full_name || viewer.profile.email}
              </span>
              {viewer.role === "admin" ? " (admin)" : ""}
            </p>
          </div>

          {show.key === "new" && waiting > 0 ? (
            <p className="mt-4 text-lg text-ink-soft">
              {waiting} {waiting === 1 ? "person is" : "people are"} waiting to
              hear from somebody.
            </p>
          ) : null}

          <form className="mt-8 flex flex-wrap items-center gap-3" action="/team">
            <input type="hidden" name="show" value={show.key} />
            <label htmlFor="q" className="sr-only">
              Search by name, email or zip
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Name, email or zip"
              className="w-full max-w-[320px] rounded-xl border border-line bg-surface px-4 py-2.5 text-ink placeholder:text-ink-soft/50"
            />
            <button
              type="submit"
              className="rounded-full border-2 border-ink px-5 py-2 font-display text-xs font-bold tracking-wide text-ink uppercase hover:bg-ink hover:text-cream"
            >
              Search
            </button>
            {q ? (
              <Link
                href={`/team?show=${show.key}`}
                className="text-sm font-semibold text-sunset underline underline-offset-4"
              >
                Clear
              </Link>
            ) : null}
          </form>

          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Filter">
            {FILTERS.map((f) => (
              <Link
                key={f.key}
                href={`/team?show=${f.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                aria-current={f.key === show.key ? "page" : undefined}
                className={
                  f.key === show.key
                    ? "rounded-full bg-ink px-4 py-2 font-display text-xs font-bold tracking-wide text-cream uppercase"
                    : "rounded-full bg-surface px-4 py-2 font-display text-xs font-bold tracking-wide text-ink-soft uppercase hover:bg-cream-deep"
                }
              >
                {f.label}
              </Link>
            ))}
          </nav>

          {error ? (
            <p
              className="mt-10 rounded-xl border border-sunset/30 bg-sunset-soft px-5 py-4 text-sunset-deep"
              role="alert"
            >
              Could not load applications just now. Refresh in a moment, and if
              it keeps happening tell Dee.
            </p>
          ) : visible.length === 0 ? (
            <EmptyState hasAny={rows.length > 0} searched={q.length > 0} />
          ) : (
            <ul className="mt-8 space-y-3">
              {visible.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/team/${r.id}`}
                    className="block rounded-2xl bg-surface p-5 shadow-[0_1px_10px_rgba(17,17,17,0.05)] hover:shadow-[0_2px_16px_rgba(17,17,17,0.1)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-display text-xl font-bold text-ink">
                        {r.profiles?.full_name || r.profiles?.email || "No name yet"}
                      </span>
                      <StatusPill status={r.status} />
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">
                      {r.profiles?.email}
                      {r.profiles?.phone ? ` · ${r.profiles.phone}` : ""}
                      {r.zip ? ` · ${r.zip}` : ""}
                    </p>
                    <p className="mt-3 text-sm text-ink-soft">
                      {describe(r)} ·{" "}
                      {r.submitted_at
                        ? `Sent ${formatDate(r.submitted_at)}`
                        : `Started ${formatDate(r.updated_at)}`}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}

function describe(r: Row): string {
  const bits: string[] = [];
  if (r.housing) bits.push(r.housing === "own" ? "Owns" : r.housing === "rent" ? "Rents" : "Lives with family");
  if (r.has_dogs) bits.push("has dogs");
  if (r.has_cats) bits.push("has cats");
  if (r.has_kids) bits.push("kids at home");
  return bits.length > 0 ? bits.join(" · ") : "No details yet";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function EmptyState({ hasAny, searched }: { hasAny: boolean; searched: boolean }) {
  if (searched) {
    return (
      <p className="mt-10 rounded-2xl bg-surface p-8 text-lg text-ink-soft">
        Nobody matches that. Try part of a name, or an email address.
      </p>
    );
  }
  // The honest empty state. An empty screen on day one looks broken, and
  // somebody will assume the applications were lost.
  return (
    <div className="mt-10 rounded-2xl bg-surface p-8">
      <h2 className="font-display text-2xl font-bold text-ink">
        {hasAny ? "Nothing in this list" : "No applications here yet"}
      </h2>
      <p className="mt-3 text-lg leading-relaxed text-ink-soft">
        {hasAny
          ? "Try another filter above. Everyone is under Everyone."
          : "This is the new application, so it starts empty. It fills up as people apply through the site."}
      </p>
      {!hasAny ? (
        <p className="mt-3 leading-relaxed text-ink-soft">
          The older applications are still in WordPress at dogfoster.org. They
          are not lost and nothing here deleted them.
        </p>
      ) : null}
    </div>
  );
}
