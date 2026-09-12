import { createClient } from "@/lib/supabase/server";
import { getOrg } from "@/lib/auth";

/**
 * The rescue's own note for one dog, if somebody has written one.
 *
 * Publicly readable on purpose: this is the part meant to be read. Returns null
 * rather than throwing, because a note is an extra and a dog's page must render
 * without it.
 */
export async function getDogNote(
  orgId: string,
  dogId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dog_bio_overrides")
    .select("bio")
    .eq("org_id", orgId)
    .eq("dog_id", dogId)
    .maybeSingle();

  if (error) {
    console.error("[dogs] could not read rescue note", error);
    return null;
  }
  const bio = data?.bio as { note?: unknown } | null;
  const note = typeof bio?.note === "string" ? bio.note.trim() : "";
  return note === "" ? null : note;
}

/**
 * Every rescue note for an org, in one query, keyed by dog.
 *
 * List pages render dozens of cards; asking per card would be dozens of round
 * trips for a field most dogs do not have. One select, then a Map lookup.
 */
export async function getDogNotes(
  orgId: string,
): Promise<Map<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dog_bio_overrides")
    .select("dog_id, bio")
    .eq("org_id", orgId);

  const notes = new Map<string, string>();
  if (error) {
    console.error("[dogs] could not read rescue notes", error);
    return notes;
  }
  for (const row of data ?? []) {
    const bio = row.bio as { note?: unknown } | null;
    const note = typeof bio?.note === "string" ? bio.note.trim() : "";
    if (note !== "") notes.set(row.dog_id, note);
  }
  return notes;
}

/**
 * Notes for the public site, resolving the org itself and never throwing.
 *
 * The public pages used to render from the county feed alone. Adding notes to
 * them quietly made Supabase a dependency of the homepage, and getOrg() throws
 * when the org row cannot be read — so a database blip would have taken down the
 * page that tells strangers which dogs are out of time, to protect a paragraph
 * most dogs do not have.
 *
 * A note is an extra. It fails to nothing.
 */
export async function getSiteNotes(): Promise<Map<string, string>> {
  try {
    const org = await getOrg();
    return await getDogNotes(org.id);
  } catch (error) {
    console.error("[dogs] rescue notes unavailable, rendering without", error);
    return new Map();
  }
}

/** One dog's note for the public site. Same contract: never throws. */
export async function getSiteNote(dogId: string): Promise<string | null> {
  try {
    const org = await getOrg();
    return await getDogNote(org.id, dogId);
  } catch (error) {
    console.error("[dogs] rescue note unavailable, rendering without", error);
    return null;
  }
}
