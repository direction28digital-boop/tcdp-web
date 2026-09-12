"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/auth";
import type { WorkStatus } from "@/lib/supabase/database.types";

const BUCKET = "dog-videos";

/** Matches the bucket's allowed_mime_types. iPhone records quicktime. */
const ALLOWED_MIME = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
];

/** The bucket's own limit. Checked here too so the person hears it before uploading. */
const MAX_BYTES = 200 * 1024 * 1024;

const ALLOWED_STATUS: WorkStatus[] = [
  "not_started",
  "filmed",
  "edited",
  "posted",
  "our_pull",
];

/** A claim older than this has gone stale — somebody got busy, or went home. */
const CLAIM_HOURS = 12;

function extensionFor(mime: string): string {
  if (mime === "video/quicktime") return "mov";
  if (mime === "video/webm") return "webm";
  if (mime === "video/x-m4v") return "m4v";
  return "mp4";
}

/**
 * Hands back a one-time URL the browser uploads STRAIGHT to Supabase Storage.
 *
 * The file never passes through this server, and that is not an optimisation —
 * Vercel caps a serverless request body at 4.5MB, and a phone clip is thirty
 * times that. Routing video through a server action would fail every single
 * time, on every phone, with an error nobody could act on.
 *
 * The path is `<org_id>/<dog_id>/<uuid>.<ext>`, because the storage policies
 * read the first folder segment as the org and check membership against it.
 * Get that shape wrong and the upload is rejected by RLS, not by us.
 */
export async function createUploadUrl(
  dogId: string,
  contentType: string,
): Promise<
  { path: string; signedUrl: string; token: string } | { error: string }
> {
  const viewer = await requireMember();

  if (!ALLOWED_MIME.includes(contentType)) {
    return {
      error:
        "That looks like a photo or an unsupported file. Videos only, please — MP4 or the .mov your phone records.",
    };
  }
  if (!/^[A-Za-z0-9_-]{1,32}$/.test(dogId)) {
    return { error: "That dog ID does not look right." };
  }

  const path = `${viewer.org.id}/${dogId}/${crypto.randomUUID()}.${extensionFor(contentType)}`;

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    console.error("[team] could not sign upload", error);
    return { error: "Could not start the upload. Try again in a moment." };
  }
  return { path, signedUrl: data.signedUrl, token: data.token };
}

/**
 * Records the clip once it has actually landed in storage.
 *
 * Two steps rather than one because the upload happens in the browser: the row
 * is written only after the bytes are there, so the list never shows a video
 * that does not exist. The reverse — bytes with no row — is the survivable
 * failure, and the nightly cleanup sweeps those.
 */
export async function recordVideo(
  dogId: string,
  path: string,
  sizeBytes: number,
  mimeType: string,
): Promise<{ error: string } | void> {
  const viewer = await requireMember();

  if (!path.startsWith(`${viewer.org.id}/${dogId}/`)) {
    return { error: "That upload does not belong to this dog." };
  }
  if (sizeBytes > MAX_BYTES) {
    return { error: "That video is over 200MB. Trim it and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("dog_videos").insert({
    org_id: viewer.org.id,
    dog_id: dogId,
    storage_path: path,
    mime_type: mimeType,
    size_bytes: sizeBytes,
    uploaded_by: viewer.profile.id,
  });

  if (error) {
    console.error("[team] could not record video", error);
    return { error: "The video uploaded but we could not save it. Tell Dee." };
  }

  // A dog with a clip is filmed, unless somebody has already moved them
  // further along. Never walk a status backwards on somebody else's behalf.
  const { data: current } = await supabase
    .from("dog_work_status")
    .select("work_status")
    .eq("org_id", viewer.org.id)
    .eq("dog_id", dogId)
    .maybeSingle();

  if (!current || current.work_status === "not_started") {
    await supabase.from("dog_work_status").upsert({
      org_id: viewer.org.id,
      dog_id: dogId,
      work_status: "filmed",
      updated_by: viewer.profile.id,
      updated_at: new Date().toISOString(),
    });
  }

  revalidatePath(`/team/dogs/${dogId}`);
  revalidatePath("/team/dogs");
  revalidatePath("/team");
}

export async function setWorkStatus(
  dogId: string,
  status: WorkStatus,
): Promise<{ error: string } | void> {
  const viewer = await requireMember();

  // hands_raised is set by an application arriving, never by a button. Letting
  // somebody click it would mean the dashboard could claim a foster exists when
  // no application does.
  if (!ALLOWED_STATUS.includes(status)) {
    return { error: "That is not a status we set by hand." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("dog_work_status").upsert({
    org_id: viewer.org.id,
    dog_id: dogId,
    work_status: status,
    updated_by: viewer.profile.id,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[team] could not set work status", error);
    return { error: "Could not save that. Try again." };
  }

  revalidatePath(`/team/dogs/${dogId}`);
  revalidatePath("/team/dogs");
  revalidatePath("/team");
}

/**
 * "I am going to see this dog."
 *
 * A soft lock, on purpose. It expires on its own after twelve hours and anybody
 * can take it over, because the person standing in front of the kennel knows
 * more than this row does. The point is only to stop two people driving to the
 * same shelter for the same dog while a third dog goes unfilmed.
 */
export async function claimDog(
  dogId: string,
  claim: boolean,
): Promise<{ error: string } | void> {
  const viewer = await requireMember();
  const supabase = await createClient();

  const { error } = await supabase.from("dog_work_status").upsert({
    org_id: viewer.org.id,
    dog_id: dogId,
    claimed_by: claim ? viewer.profile.id : null,
    claimed_at: claim ? new Date().toISOString() : null,
    updated_by: viewer.profile.id,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[team] could not claim", error);
    return { error: "Could not save that. Try again." };
  }

  revalidatePath(`/team/dogs/${dogId}`);
  revalidatePath("/team/dogs");
}

/** True when a claim is old enough that nobody should feel bad taking it. */
export async function claimIsStale(claimedAt: string | null): Promise<boolean> {
  if (!claimedAt) return true;
  return Date.now() - new Date(claimedAt).getTime() > CLAIM_HOURS * 3_600_000;
}

/**
 * The Facebook permalink for a clip that has gone live.
 *
 * This is what makes deleting raw video safe later: the record that the dog was
 * posted, and where, survives the file it came from.
 */
export async function setPostedUrl(
  videoId: string,
  dogId: string,
  url: string,
): Promise<{ error: string } | void> {
  const viewer = await requireMember();
  const trimmed = url.trim();

  if (trimmed !== "") {
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return { error: "That does not look like a link. Paste the whole URL." };
    }
    if (parsed.protocol !== "https:") {
      return { error: "Links need to start with https." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("dog_videos")
    .update({
      posted_url: trimmed || null,
      posted_at: trimmed ? new Date().toISOString() : null,
    })
    .eq("id", videoId)
    .eq("org_id", viewer.org.id);

  if (error) {
    console.error("[team] could not save posted url", error);
    return { error: "Could not save that link. Try again." };
  }

  revalidatePath(`/team/dogs/${dogId}`);
}

/**
 * A short-lived link to watch or download a clip.
 *
 * The bucket is private and stays private. Everything about these dogs that is
 * meant to be public goes out through Facebook, not through a URL somebody
 * could forward.
 */
export async function getVideoUrl(
  path: string,
): Promise<{ url: string } | { error: string }> {
  const viewer = await requireMember();
  if (!path.startsWith(`${viewer.org.id}/`)) {
    return { error: "Not yours to open." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error || !data) {
    console.error("[team] could not sign video url", error);
    return { error: "Could not open that video." };
  }
  return { url: data.signedUrl };
}
