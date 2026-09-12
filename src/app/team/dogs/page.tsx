import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { TeamNav } from "@/components/team/TeamNav";
import { requireTeam } from "@/lib/auth";
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
  title: "Dogs",
  robots: { index: false, follow: false },
};

/**
 * This page is read standing up, in a shelter, on a phone.
 *
 * So it is ordered the way the building is: by shelter, then by kennel number,
 * so a volunteer walking the row can work down the screen instead of hunting.
 * The public list is ordered by deadline, which is right for a stranger
 * deciding who to save and wrong for somebody already holding a camera.
 */
function byKennel(a: Dog, b: Dog): number {
  const shelter = (a.shelter ?? "").localeCompare(b.shelter ?? "");
  if (shelter !== 0) return shelter;
  const ak = a.kennel ?? "";
  const bk = b.kennel ?? "";
  return ak.localeCompare(bk, undefined, { numeric: true });
}

export default async function TeamDogsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const viewer = await requireTeam();
  const params = await searchParams;
  const supabase = await createClient();

  const [{ active }, { data }] = await Promise.all([
    getDogs(),
    supabase
      .from("applications")
      .select("dog_id")
      .eq("org_id", viewer.org.id)
      .eq("status", "submitted")
      .not("dog_id", "is", null)
      .limit(500),
  ]);

  const claimed = new Set(
    ((data ?? []) as { dog_id: string | null }[])
      .map((r) => r.dog_id)
      .filter((id): id is string => id !== null),
  );

  const needSomeone = active.filter((d) => !hasSomeone(d));
  const showAll = params.show === "all";
  // Dogs already spoken for stay reachable but off the default view. Filming a
  // dog who has a transfer pending is a real thing to do — placements fall
  // through — it is just never the first hour of the day.
  const list = (showAll ? active : needSomeone).slice().sort(byKennel);

  const byShelter = new Map<string, Dog[]>();
  for (const dog of list) {
    const key = dog.shelter ?? "Shelter not posted";
    byShelter.set(key, [...(byShelter.get(key) ?? []), dog]);
  }

  return (
    <>
      <SiteNav />
      <main id="main" className="min-h-screen bg-cream">
        <div className="mx-auto max-w-[1100px] px-6 py-10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">
              Dogs
            </h1>
            <p className="text-ink-soft">
              Signed in as{" "}
              <span className="font-semibold text-ink">
                {viewer.profile.full_name || viewer.profile.email}
              </span>
            </p>
          </div>

          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-ink-soft">
            In kennel order, shelter by shelter, for walking the building.
          </p>

          <div className="mt-8">
            <TeamNav current="/team/dogs" />
          </div>

          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Which dogs">
            {[
              { key: "need", label: `Still need somebody (${needSomeone.length})` },
              { key: "all", label: `Everyone on the list (${active.length})` },
            ].map((f) => (
              <Link
                key={f.key}
                href={f.key === "all" ? "/team/dogs?show=all" : "/team/dogs"}
                aria-current={
                  (f.key === "all") === showAll ? "page" : undefined
                }
                className={
                  (f.key === "all") === showAll
                    ? "rounded-full bg-ink px-4 py-2 font-display text-xs font-bold tracking-wide text-cream uppercase"
                    : "rounded-full bg-surface px-4 py-2 font-display text-xs font-bold tracking-wide text-ink-soft uppercase hover:bg-cream-deep"
                }
              >
                {f.label}
              </Link>
            ))}
          </nav>

          {[...byShelter.entries()].map(([shelter, dogs]) => (
            <section key={shelter} className="mt-10">
              <h2 className="font-display text-2xl font-extrabold text-ink">
                {shelter}{" "}
                <span className="text-base font-bold text-ink-soft tabular-nums">
                  {dogs.length}
                </span>
              </h2>
              <ul className="mt-4 grid gap-3">
                {dogs.map((dog) => (
                  <li
                    key={dog.id}
                    className="flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-[0_2px_14px_rgba(17,17,17,0.06)]"
                  >
                    <span className="w-16 shrink-0 text-center font-display text-sm font-black text-ink tabular-nums">
                      {dog.kennel ?? "—"}
                    </span>
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
                      {dog.photo ? (
                        <Image
                          src={dog.photo}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-extrabold text-ink">
                        <Link
                          href={`/dogs/${dog.id}`}
                          className="hover:underline"
                        >
                          {dog.name}
                        </Link>{" "}
                        <span className="text-sm font-semibold text-ink-soft/70">
                          {dog.id}
                        </span>
                      </p>
                      <p className="truncate text-sm text-ink-soft">
                        {[formatAge(dog.age), dog.sex, formatBreed(dog.breed)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {hasSomeone(dog) ? (
                        <span className="rounded-full bg-sage px-3 py-1 font-display text-xs font-bold tracking-wide text-white uppercase">
                          Someone is coming
                        </span>
                      ) : (
                        <span className="font-display text-xs font-bold tracking-wide text-ink-soft uppercase">
                          {daysLeftLabel(dog.daysLeft)}
                        </span>
                      )}
                      {claimed.has(dog.id) ? (
                        <span className="rounded-full bg-sunset px-3 py-1 font-display text-xs font-bold tracking-wide text-white uppercase">
                          Application waiting
                        </span>
                      ) : null}
                      {!dog.photo ? (
                        <span className="font-display text-xs font-bold tracking-wide text-rust uppercase">
                          No photo yet
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {list.length === 0 ? (
            <p className="mt-10 rounded-2xl bg-surface p-10 text-center text-ink-soft">
              No dogs on the county list right now.
            </p>
          ) : null}
        </div>
      </main>
    </>
  );
}
