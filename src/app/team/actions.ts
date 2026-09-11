"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireTeam } from "@/lib/auth";
import type { ApplicationStatus } from "@/lib/supabase/database.types";

const ALLOWED: ApplicationStatus[] = ["submitted", "approved", "denied", "withdrawn"];

/**
 * RLS is the real boundary here: applications_team_update already requires org
 * membership, so a forged request from a signed-in applicant writes nothing.
 * requireTeam() is for the human, so a confused volunteer gets sent somewhere
 * sensible instead of a permission error.
 */
export async function setStatus(
  applicationId: string,
  status: ApplicationStatus,
  denialReason?: string,
): Promise<{ error: string } | void> {
  const viewer = await requireTeam();

  // "draft" belongs to the applicant. The team must not be able to shove an
  // application back to unfinished and make it disappear from their own queue.
  if (!ALLOWED.includes(status)) return { error: "That is not a status we set." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: viewer.profile.id,
      denial_reason: status === "denied" ? (denialReason?.trim() || null) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .eq("org_id", viewer.org.id);

  if (error) {
    console.error("setStatus failed", error);
    return { error: "That did not save. Try again in a moment." };
  }

  revalidatePath("/team");
  revalidatePath(`/team/${applicationId}`);
}

export async function addNote(
  applicationId: string,
  body: string,
): Promise<{ error: string } | void> {
  const viewer = await requireTeam();

  const text = body.trim();
  if (!text) return { error: "Write something first." };

  const supabase = await createClient();
  const { error } = await supabase.from("application_notes").insert({
    org_id: viewer.org.id,
    application_id: applicationId,
    author_id: viewer.profile.id,
    body: text,
  });

  if (error) {
    console.error("addNote failed", error);
    return { error: "That note did not save. Copy it somewhere before you retry." };
  }

  revalidatePath(`/team/${applicationId}`);
}
