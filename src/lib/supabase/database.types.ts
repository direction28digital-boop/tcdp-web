/**
 * Types for the `foster-portal` Supabase project (twsomyzkoggtuefecpew).
 *
 * Regenerate after any migration with:
 *   npx supabase gen types typescript --project-id twsomyzkoggtuefecpew
 *
 * Written by hand in the same shape the generator emits, so a regenerate is a
 * drop-in replacement rather than a refactor.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** County ID as the shelter writes it, e.g. "A5168681". Never a UUID. */
export type DogId = string;

export type OrgRow = {
  id: string;
  slug: string;
  name: string;
  site_url: string | null;
  created_at: string;
};

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type OrgMemberRow = {
  org_id: string;
  profile_id: string;
  role: "team" | "admin";
  created_at: string;
};

export type TeamInviteRow = {
  org_id: string;
  email: string;
  role: "team" | "admin";
  invited_by: string | null;
  created_at: string;
  claimed_at: string | null;
  claimed_by: string | null;
};

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "denied"
  | "withdrawn";

export type ApplicationRow = {
  id: string;
  org_id: string;
  profile_id: string;
  status: ApplicationStatus;
  /** Keyed by field_key in src/lib/apply-flow.ts. That file is the source of truth. */
  answers: Record<string, Json>;
  housing: "own" | "rent" | "other" | null;
  landlord_ok: "yes" | "not_yet" | "unsure" | null;
  /** A lease weight limit is a fact, so it HIDES dogs. */
  weight_limit_lb: number | null;
  /** A breed restriction only FLAGS dogs: county breed labels are a staff guess. */
  breed_restricted: boolean;
  has_dogs: boolean | null;
  has_cats: boolean | null;
  has_kids: boolean | null;
  zip: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  denial_reason: string | null;
  created_at: string;
  updated_at: string;
};

/** What the TEAM controls. County status is never stored: it is read live from the feed. */
export type WorkStatus =
  | "not_started"
  | "filmed"
  | "posted"
  | "hands_raised"
  | "our_pull";

export type DogWorkStatusRow = {
  org_id: string;
  dog_id: DogId;
  work_status: WorkStatus;
  partner_rescue: string | null;
  saver_profile_id: string | null;
  team_notes: string | null;
  updated_by: string | null;
  updated_at: string;
};

export type DogBioOverrideRow = {
  org_id: string;
  dog_id: DogId;
  bio: Json;
  edited_by: string | null;
  edited_at: string;
};

export type HandStatus = "raised" | "approved" | "denied" | "withdrawn";

export type HandRaisedRow = {
  id: string;
  org_id: string;
  dog_id: DogId;
  profile_id: string;
  application_id: string;
  status: HandStatus;
  denial_reason: string | null;
  raised_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export type DogVideoRow = {
  id: string;
  org_id: string;
  dog_id: DogId;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
};

export type AlertPrefsRow = {
  profile_id: string;
  org_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  deadline_days: number;
  weekly_digest: boolean;
  paused: boolean;
  updated_at: string;
};

export type AlertLogRow = {
  id: string;
  org_id: string;
  profile_id: string;
  dog_id: DogId;
  kind: "deadline" | "weekly" | "hand_approved" | "hand_denied";
  sent_at: string;
};

type Table<Row, Optional extends keyof Row = never> = {
  Row: Row;
  Insert: Omit<Row, Optional> & Partial<Pick<Row, Optional>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      orgs: Table<OrgRow, "id" | "site_url" | "created_at">;
      profiles: Table<ProfileRow, "full_name" | "phone" | "created_at" | "updated_at">;
      org_members: Table<OrgMemberRow, "created_at">;
      team_invites: Table<
        TeamInviteRow,
        "role" | "invited_by" | "created_at" | "claimed_at" | "claimed_by"
      >;
      applications: Table<
        ApplicationRow,
        | "id" | "status" | "answers" | "housing" | "landlord_ok" | "weight_limit_lb"
        | "breed_restricted" | "has_dogs" | "has_cats" | "has_kids" | "zip"
        | "submitted_at" | "reviewed_at" | "reviewed_by" | "denial_reason"
        | "created_at" | "updated_at"
      >;
      dog_work_status: Table<
        DogWorkStatusRow,
        | "work_status" | "partner_rescue" | "saver_profile_id" | "team_notes"
        | "updated_by" | "updated_at"
      >;
      dog_bio_overrides: Table<DogBioOverrideRow, "edited_by" | "edited_at">;
      hands_raised: Table<
        HandRaisedRow,
        | "id" | "status" | "denial_reason" | "raised_at" | "reviewed_at" | "reviewed_by"
      >;
      dog_videos: Table<
        DogVideoRow,
        "id" | "mime_type" | "size_bytes" | "uploaded_by" | "uploaded_at"
      >;
      alert_prefs: Table<
        AlertPrefsRow,
        | "email_enabled" | "sms_enabled" | "deadline_days" | "weekly_digest"
        | "paused" | "updated_at"
      >;
      alert_log: Table<AlertLogRow, "id" | "sent_at">;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
