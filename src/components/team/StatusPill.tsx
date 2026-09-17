import type { ApplicationStatus } from "@/lib/supabase/database.types";

/**
 * Plain words, not jargon. Five volunteers read this screen and none of them
 * should have to learn what "submitted" means versus "draft".
 */
export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: "Started, not sent",
  submitted: "Waiting on us",
  approved: "Approved",
  denied: "Not approved",
  withdrawn: "Withdrew",
};

const STYLE: Record<ApplicationStatus, string> = {
  draft: "bg-cream-deep text-ink-soft",
  submitted: "bg-sunset-soft text-sunset-deep",
  approved: "bg-sage-soft text-sage",
  denied: "bg-cream-deep text-ink-soft",
  withdrawn: "bg-cream-deep text-ink-soft",
};

export function StatusPill({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`rounded-full px-3 py-1 font-display text-xs font-bold tracking-wide uppercase ${STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
