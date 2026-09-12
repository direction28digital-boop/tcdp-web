"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth";
import { formatAge, formatBreed, getDogs, hasSomeone } from "@/lib/dogs";
import type { Answers } from "@/lib/apply-flow";
import type { ApplicationRow, Json } from "@/lib/supabase/database.types";

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
  const rows = (id: string) =>
    Array.isArray(answers[id]) ? (answers[id] as Record<string, string>[]) : [];

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
  const weight_limit_lb =
    str("weightRestrictions") === "Yes"
      ? (limits[str("weightLimit") ?? ""] ?? null)
      : null;

  // Kids come from either answer: the household description, or anybody under
  // 18 listed in the household repeater. Somebody will fill in one and not the
  // other, and a dog that cannot live with children must not slip through.
  const householdSaysKids = list("household").includes("Children at home");
  const someoneIsAMinor = rows("householdMembers").some((r) => {
    const age = Number.parseInt(r.age ?? "", 10);
    return Number.isFinite(age) && age < 18;
  });
  const answeredHousehold =
    answers.household !== undefined || answers.otherPeople !== undefined;

  const yesNo = (id: string) => {
    const v = str(id);
    return v === null ? null : v === "Yes";
  };

  return {
    housing,
    landlord_ok,
    weight_limit_lb,
    breed_restricted:
      str("breedRestrictions") === "Yes" || list("breedsNotAllowed").length > 0,
    has_dogs: yesNo("dogsInHome"),
    has_cats: yesNo("catsInHome"),
    has_kids: answeredHousehold ? householdSaysKids || someoneIsAMinor : null,
    zip: str("zip"),
  };
}

type DogInterest = {
  dog_interest: "specific" | "any" | null;
  dog_raw: string | null;
  dog_id: string | null;
  dog_matched_at: string | null;
};

/**
 * Work out which dog they meant.
 *
 * An ID is safe to automate: the county writes them as a letter and digits and
 * they are unique. A NAME is not. Shelters reuse names, rename dogs, and people
 * misspell them, so a name resolves only when EXACTLY ONE active dog matches.
 * Anything else is left unmatched on purpose, which puts it in front of a
 * volunteer. Putting a person on the wrong dog is worse than one extra click.
 */
async function resolveDog(answers: Answers): Promise<DogInterest> {
  const choice =
    typeof answers.dogInterest === "string" ? answers.dogInterest : null;

  if (choice === "Any dog I can help") {
    return {
      dog_interest: "any",
      dog_raw: null,
      dog_id: null,
      dog_matched_at: null,
    };
  }
  if (choice !== "A specific dog") {
    return {
      dog_interest: null,
      dog_raw: null,
      dog_id: null,
      dog_matched_at: null,
    };
  }

  const raw =
    typeof answers.dogIdentifier === "string"
      ? answers.dogIdentifier.trim()
      : "";
  const base: DogInterest = {
    dog_interest: "specific",
    dog_raw: raw || null,
    dog_id: null,
    dog_matched_at: null,
  };
  if (!raw) return base;

  try {
    const { active } = await getDogs();

    if (/^a\d{4,9}$/i.test(raw)) {
      const byId = active.find(
        (d) => d.id.toLowerCase() === raw.toLowerCase(),
      );
      if (byId) {
        return { ...base, dog_id: byId.id, dog_matched_at: new Date().toISOString() };
      }
      // An ID-shaped string that is not on today's list stays unmatched. They
      // may have the right dog and the wrong list, and a volunteer should look.
      return base;
    }

    const named = active.filter(
      (d) => d.name.trim().toLowerCase() === raw.toLowerCase(),
    );
    if (named.length === 1) {
      return { ...base, dog_id: named[0].id, dog_matched_at: new Date().toISOString() };
    }
    return base;
  } catch (error) {
    // The county feed being down must never cost somebody their application.
    console.error("[apply] dog match skipped, feed unavailable", error);
    return base;
  }
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
  const dog = await resolveDog(answers);

  // Upsert on (org_id, profile_id). "Apply once" is a unique constraint, so
  // coming back later UPDATES the application rather than starting a second one.
  const { error } = await supabase.from("applications").upsert(
    {
      org_id: viewer.org.id,
      profile_id: viewer.profile.id,
      status,
      answers: answers as unknown as Record<string, Json>,
      ...promote(answers),
      ...dog,
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

/**
 * What one dog's record says, for the person about to apply for them.
 *
 * WHY THIS EXISTS. Dee, after asking the team what the old bios were costing:
 * "time wasted investing on someone going to foster a dog, then backs out after
 * seeing something or finding out on a phone screening."
 *
 * That is a funnel problem, not a copy problem. Somebody reads a warm write-up,
 * spends twenty minutes on an application, waits for a call, and only then hears
 * that the dog air-snaps at hands. They withdraw. Two volunteers lost an evening
 * and the dog lost days off a clock where days are the whole game.
 *
 * Putting the shelter record on the dog's page fixed half of it. This is the
 * other half: most applicants arrive from an Instagram link or a card and never
 * open that page. So the record comes to them, inside the form, before the
 * questions rather than after the phone call.
 *
 * Fetched one dog at a time on purpose. The form already holds every active dog
 * for matching, and `sections` runs 8 to 16KB each — attaching them to that list
 * would ship half a megabyte of shelter notes to a phone to show one dog's worth.
 */
export type DogDisclosure = {
  id: string;
  name: string;
  photo: string | null;
  detailUrl: string | null;
  facts: string | null;
  shelter: string | null;
  deadline: string | null;
  daysLeft: number | null;
  nho: boolean;
  /** The county's own priority reason: "Behavior" or "Medical". */
  reason: string | null;
  /** The county's own rating, their word. Null when we could not trust the parse. */
  level: string | null;
  /** Somebody has already stepped up for this dog. */
  spokenFor: boolean;
  memo: string | null;
  evaluations: string | null;
  biteHistory: string | null;
};

/** Keeps the payload to something a phone can read, with the full record one link away. */
const EXCERPT = 1800;

function excerpt(value: string | null): string | null {
  if (!value) return null;
  return value.length > EXCERPT ? `${value.slice(0, EXCERPT).trimEnd()}…` : value;
}

/**
 * Resolves what somebody typed into a dog, using the same rules as the matcher
 * that files the application — an exact ID, or a name that matches exactly one
 * active dog. Anything ambiguous returns null and the form moves on rather than
 * showing a stranger the wrong dog's bite history.
 */
export async function lookupDogForDisclosure(
  raw: string,
): Promise<DogDisclosure | null> {
  const needle = raw.trim();
  if (!needle) return null;

  try {
    const { active } = await getDogs();

    let dog = null as (typeof active)[number] | null;
    if (/^a\d{4,9}$/i.test(needle)) {
      dog = active.find((d) => d.id.toLowerCase() === needle.toLowerCase()) ?? null;
    } else {
      const named = active.filter(
        (d) => d.name.trim().toLowerCase() === needle.toLowerCase(),
      );
      if (named.length === 1) dog = named[0];
    }
    if (!dog) return null;

    return {
      id: dog.id,
      name: dog.name,
      photo: dog.photo,
      detailUrl: dog.detailUrl,
      facts: [formatAge(dog.age), dog.sex, formatBreed(dog.breed), dog.weight ? `${dog.weight} lb` : null]
        .filter(Boolean)
        .join(" · ") || null,
      shelter: [dog.shelter, dog.kennel ? `Kennel ${dog.kennel}` : null]
        .filter(Boolean)
        .join(" · ") || null,
      deadline: dog.deadline,
      daysLeft: dog.daysLeft,
      nho: dog.nho,
      reason: dog.reason,
      level: dog.level,
      spokenFor: hasSomeone(dog),
      memo: excerpt(dog.sections.memo),
      evaluations: excerpt(dog.sections.evaluationComments),
      biteHistory: excerpt(dog.sections.biteHistory),
    };
  } catch (error) {
    // The county feed being down must never cost somebody their application.
    // No disclosure is a worse outcome than a slow one, but a blocked form is
    // worse than both.
    console.error("[apply] disclosure skipped, feed unavailable", error);
    return null;
  }
}
