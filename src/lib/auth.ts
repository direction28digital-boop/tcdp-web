import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OrgRole, OrgRow, ProfileRow } from "@/lib/supabase/database.types";

/**
 * The org this deployment serves. The schema is multi-org from day one so
 * SOSHub.org is a reskin plus a row, but a single deployment answers for
 * exactly one org, chosen here.
 */
export const ORG_SLUG = process.env.NEXT_PUBLIC_ORG_SLUG ?? "tcdp";

export type Viewer = {
  profile: ProfileRow;
  org: OrgRow;
  role: OrgRole | null;
};

/** Can read applications. A volunteer cannot, by design. */
export function isStaff(viewer: Viewer): boolean {
  return viewer.role === "team" || viewer.role === "admin";
}

/** The signed-in person, or null. Never throws, never redirects. */
export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: org }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("orgs").select("*").eq("slug", ORG_SLUG).single(),
  ]);

  if (!profile || !org) return null;

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("profile_id", user.id)
    .maybeSingle();

  return { profile, org, role: membership?.role ?? null };
}

/** The org record on its own, for pages that need it before anyone signs in. */
export async function getOrg(): Promise<OrgRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orgs")
    .select("*")
    .eq("slug", ORG_SLUG)
    .single();

  if (error || !data) {
    throw new Error(`Org "${ORG_SLUG}" not found. Check NEXT_PUBLIC_ORG_SLUG.`);
  }
  return data;
}

/** Any signed-in person. Sends them to sign in, then back where they were going. */
export async function requireViewer(returnTo: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/signin?next=${encodeURIComponent(returnTo)}`);
  return viewer;
}

/**
 * Anybody in the org: volunteer, team or admin.
 *
 * A signed-in applicant who guesses /team gets sent to their own dashboard,
 * not to an error. They have done nothing wrong, and a permission-denied page
 * would read as an accusation.
 *
 * This is a convenience gate, not the security boundary. The security boundary
 * is RLS: even if this check were removed, an applicant's queries against
 * dog_work_status and hands_raised would still return nothing.
 */
export async function requireMember(returnTo = "/team"): Promise<Viewer> {
  const viewer = await requireViewer(returnTo);
  if (!viewer.role) redirect("/me");
  return viewer;
}

/**
 * Team or admin. Guards everything carrying a real person's details.
 *
 * A volunteer landing here is not doing anything wrong either — they followed a
 * link, or they used to have the wider role — so they go to the dog list, which
 * is the part of the job that is theirs, rather than to a wall.
 *
 * Again a convenience gate. RLS is the boundary: since the volunteer role
 * exists, `applications` and `application_notes` are behind
 * `private.is_org_staff()`, so a volunteer's own query returns zero rows no
 * matter what the UI does.
 */
export async function requireStaff(returnTo = "/team/applications"): Promise<Viewer> {
  const viewer = await requireMember(returnTo);
  if (!isStaff(viewer)) redirect("/team/dogs");
  return viewer;
}
