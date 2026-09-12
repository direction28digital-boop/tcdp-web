import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { TeamNav } from "@/components/team/TeamNav";
import { VideoUpload } from "@/components/team/VideoUpload";
import { VideoList, type VideoItem } from "@/components/team/VideoList";
import { WorkStatusControl } from "@/components/team/WorkStatus";
import { isStaff, requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { WorkStatus } from "@/lib/supabase/database.types";
import {
  daysLeftLabel,
  formatAge,
  formatBreed,
  formatDeadline,
  getDog,
  hasSomeone,
} from "@/lib/dogs";

export const metadata: Metadata = {
  title: "Dog",
  robots: { index: false, follow: false },
};

/** Matches CLAIM_HOURS in the actions. A claim this old is nobody's fault. */
const CLAIM_HOURS = 12;

export default async function TeamDogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await requireMember(`/team/dogs/${id}`);
  const dog = await getDog(id);
  if (!dog) notFound();

  const supabase = await createClient();

  const [{ data: work }, { data: videoRows }, { data: apps }] =
    await Promise.all([
      supabase
        .from("dog_work_status")
        .select(
          "work_status, claimed_by, claimed_at, profiles!dog_work_status_claimed_by_fkey(full_name, email)",
        )
        .eq("org_id", viewer.org.id)
        .eq("dog_id", id)
        .maybeSingle(),
      supabase
        .from("dog_videos")
        .select(
          "id, storage_path, size_bytes, uploaded_at, posted_url, profiles!dog_videos_uploaded_by_fkey(full_name, email)",
        )
        .eq("org_id", viewer.org.id)
        .eq("dog_id", id)
        .order("uploaded_at", { ascending: false }),
      // Volunteers get nothing back here, by design: applications are behind
      // private.is_org_staff(). The count is all this page ever shows anyway.
      isStaff(viewer)
        ? supabase
            .from("applications")
            .select("id, submitted_at")
            .eq("org_id", viewer.org.id)
            .eq("dog_id", id)
            .eq("status", "submitted")
        : Promise.resolve({ data: [] as { id: string; submitted_at: string | null }[] }),
    ]);

  type WorkRow = {
    work_status: WorkStatus;
    claimed_by: string | null;
    claimed_at: string | null;
    profiles: { full_name: string | null; email: string } | null;
  };
  const workRow = work as unknown as WorkRow | null;

  type VideoRow = {
    id: string;
    storage_path: string;
    size_bytes: number | null;
    uploaded_at: string;
    posted_url: string | null;
    profiles: { full_name: string | null; email: string } | null;
  };
  const videos: VideoItem[] = ((videoRows ?? []) as unknown as VideoRow[]).map(
    (v) => ({
      id: v.id,
      storage_path: v.storage_path,
      size_bytes: v.size_bytes,
      uploaded_at: v.uploaded_at,
      posted_url: v.posted_url,
      uploaderName: v.profiles?.full_name || v.profiles?.email || null,
    }),
  );

  const claimedByName =
    workRow?.profiles?.full_name || workRow?.profiles?.email || null;
  const claimStale =
    !workRow?.claimed_at ||
    Date.now() - new Date(workRow.claimed_at).getTime() >
      CLAIM_HOURS * 3_600_000;

  const waitingApps = apps ?? [];

  return (
    <>
      <SiteNav />
      <main id="main" className="min-h-screen bg-cream">
        <div className="mx-auto max-w-[1100px] px-6 py-10">
          <TeamNav current="/team/dogs" />

          <Link
            href="/team/dogs"
            className="mt-6 inline-block text-sm font-semibold text-sunset underline underline-offset-4"
          >
            Back to the dog list
          </Link>

          <div className="mt-6 grid gap-8 md:grid-cols-[320px_1fr]">
            {/* ── Who this is ────────────────────────────────────────── */}
            <div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-cream-deep">
                {dog.photo ? (
                  <Image
                    src={dog.photo}
                    alt={`${dog.name}`}
                    fill
                    sizes="320px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center text-sm text-ink-soft">
                    No photo posted by the shelter
                  </div>
                )}
              </div>

              <h1 className="mt-4 font-display text-3xl font-extrabold text-ink">
                {dog.name}
              </h1>
              <p className="font-display text-sm font-bold tracking-wide text-ink-soft uppercase">
                {dog.id}
              </p>

              <dl className="mt-4 flex flex-col gap-2 text-sm">
                <Fact label="Shelter" value={dog.shelter} />
                <Fact label="Kennel" value={dog.kennel} />
                <Fact label="Age" value={formatAge(dog.age)} />
                <Fact label="Sex" value={dog.sex} />
                <Fact label="Breed" value={formatBreed(dog.breed)} />
                <Fact label="Weight" value={dog.weight} />
                <Fact label="Deadline" value={formatDeadline(dog.deadline)} />
              </dl>

              {hasSomeone(dog) ? (
                <p className="mt-4 rounded-xl bg-sage-soft p-3 text-sm text-sage">
                  The county has them as{" "}
                  <span className="font-semibold">{dog.status}</span>, so
                  somebody has stepped up. Nothing is final until they walk out.
                </p>
              ) : (
                <p className="mt-4 font-display text-sm font-bold tracking-wide text-sunset uppercase">
                  {daysLeftLabel(dog.daysLeft)}
                </p>
              )}

              {waitingApps.length > 0 ? (
                <div className="mt-4 rounded-xl bg-sunset p-4 text-white">
                  <p className="font-display text-sm font-bold tracking-wide uppercase">
                    {waitingApps.length === 1
                      ? "Somebody applied for this dog"
                      : `${waitingApps.length} people applied for this dog`}
                  </p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {waitingApps.map((app) => (
                      <li key={app.id}>
                        <Link
                          href={`/team/applications/${app.id}`}
                          className="text-sm font-semibold text-white underline underline-offset-4"
                        >
                          Open their application
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {/* ── The work ───────────────────────────────────────────── */}
            <div className="flex flex-col gap-10">
              <section className="rounded-2xl bg-surface p-6">
                <WorkStatusControl
                  dogId={dog.id}
                  current={workRow?.work_status ?? "not_started"}
                  claimedByName={claimedByName}
                  claimedByMe={workRow?.claimed_by === viewer.profile.id}
                  claimStale={claimStale}
                />
              </section>

              <section>
                <h2 className="font-display text-2xl font-extrabold text-ink">
                  Video
                </h2>
                <p className="mt-1 text-ink-soft">
                  Straight off your phone. We keep the raw clip here so whoever
                  edits it can find it — the finished post lives on Facebook.
                </p>
                <div className="mt-4">
                  <VideoUpload dogId={dog.id} />
                </div>
                <div className="mt-6">
                  <VideoList dogId={dog.id} videos={videos} />
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 font-semibold tracking-wide text-ink-soft uppercase">
        {label}
      </dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}
