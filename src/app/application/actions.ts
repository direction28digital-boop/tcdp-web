"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import type { ApplicationRow, Json } from "@/lib/supabase/database.types";

type Answers = Record<string, string | string[]>;

/**
 * Six of the thirty-six answers get promoted out of the jsonb blob into real
 * columns, because dog matching runs them on every page load. Everything else
 * stays in `answers`, keyed to apply-flow.ts, so changing a question stays a
 * config edit with no migration.
 */
type Promoted = Pick<
  ApplicationRow,
  | "housing"
  | "landlord_ok"
  | "weight_limit_lb"
  | "breed_restricted"
  | "has_dogs"
  | "has_cats"
  | "has_kids"
  | "zip"
>;

function promote(answers: Answers): Promoted {
  const str = (id: string) =>
    typeof answers[id] === "string" ? (answers[id] as string) : null;
  const list = (id: string) =>
    Array.isArray(answers[id]) ? (answers[id] as string[]) : [];

  const housingRaw = str("housing");
  const housing: Promoted["housing"] =
    housingRaw === "I own"
      ? "own"
      : housingRaw === "I rent"
        ? "rent"
        : housingRaw
          ? "other"
          : null;

  const landlordRaw = str("landlordOk");
  const landlord_ok: Promoted["landlord_ok"] =
    landlordRaw === "Yes" || landlordRaw === "Pets are already allowed in my lease"
      ? "yes"
      : landlordRaw === "Not yet"
        ? "not_yet"
        : landlordRaw
          ? "unsure"
          : null;

  // "I am not sure yet" is deliberately NOT a limit. Guessing a number here
  // would hide dogs from someone who never actually said they could not take them.
  const limits: Record<string, number> = {
    "Under 25 lb": 25,
    "Under 40 lb": 40,
    "Under 50 lb": 50,
    "Under 75 lb": 75,
  };
  const weight_limit_lb = limits[str("weightLimit") ?? ""] ?? null;

  const breeds = list("breedRestrictions").filter(
    (b) => b !== "No breed restrictions",
  );

  const count = (id: string) => {
    const v = str(id);
    if (v === null) return null;
    return v !== "None";
  };

  const kidsRaw = str("children");

  return {
    housing,
    landlord_ok,
    weight_limit_lb,
    breed_restricted: breeds.length > 0,
    has_dogs: count("dogs"),
    has_cats: count("cats"),
    has_kids: kidsRaw === null ? null : kidsRaw !== "None",
    zip: str("zip"),
  };
}

export async function saveApplication(
  answers: Answers,
  status: "draft" | "submitted",
): Promise<{ error: string } | void> {
  const viewer = await getViewer();
  if (!viewer) {
    return { error: "Your sign-in expired. Ask for a fresh link and try again." };
  }

  const supabase = await createClient();

  // Keep the profile in step, so the team dashboard can show a name and a phone
  // number without digging through the jsonb.
  const first = typeof answers.firstName === "string" ? answers.firstName : "";
  const last = typeof answers.lastName === "string" ? answers.lastName : "";
  const fullName = `${first} ${last}`.trim();
  await supabase
    .from("profiles")
    .update({
      full_name: fullName || null,
      phone: typeof answers.phone === "string" ? answers.phone : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", viewer.profile.id);

  const now = new Date().toISOString();

  // Upsert on (org_id, profile_id). "Apply once" is a unique constraint, so
  // coming back later UPDATES the application rather than starting a second one.
  const { error } = await supabase.from("applications").upsert(
    {
      org_id: viewer.org.id,
      profile_id: viewer.profile.id,
      status,
      answers: answers as unknown as Record<string, Json>,
      ...promote(answers),
      submitted_at: status === "submitted" ? now : null,
      updated_at: now,
    },
    { onConflict: "org_id,profile_id" },
  );

  if (error) {
    // Never hand a Postgres message to an applicant. It says nothing they can
    // act on and it describes the shape of the database.
    console.error("saveApplication failed", error);
    return {
      error:
        "Something went wrong saving that. Your answers are still on screen, so try again in a moment.",
    };
  }

  revalidatePath("/application");
  revalidatePath("/me");
}
