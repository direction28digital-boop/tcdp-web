/**
 * Where this week's dogs stand, straight from the county's own outcome labels.
 * Color semantics: sunset = still waiting, sage = safe with a rescue, gold = home.
 */

type Segment = { label: string; value: number; color: string; note: string };

export function OutcomeDonut({
  waiting,
  transferred,
  adopted,
}: {
  waiting: number;
  transferred: number;
  adopted: number;
}) {
  const segments: Segment[] = [
    {
      label: "Still waiting",
      value: waiting,
      color: "var(--color-sunset)",
      note: "on the list right now",
    },
    {
      label: "Pulled by a rescue",
      value: transferred,
      color: "var(--color-sage)",
      note: "safe, out of the shelter",
    },
    {
      label: "Adopted",
      value: adopted,
      color: "var(--color-gold)",
      note: "went straight home",
    },
  ];

  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <figure className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      <svg
        viewBox="0 0 180 180"
        className="h-[170px] w-[170px] shrink-0 -rotate-90"
        role="img"
        aria-label={`${total} dogs this week: ${segments
          .map((s) => `${s.value} ${s.label.toLowerCase()}`)
          .join(", ")}.`}
      >
        {segments.map((segment) => {
          const length = (segment.value / total) * circumference;
          const dash = `${length} ${circumference - length}`;
          const el = (
            <circle
              key={segment.label}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="22"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          );
          offset += length;
          return el;
        })}
      </svg>

      <figcaption className="w-full">
        <p className="font-display text-sm font-bold tracking-widest text-ink-soft uppercase">
          This week
        </p>
        <ul className="mt-3 space-y-3">
          {segments.map((segment) => (
            <li key={segment.label} className="flex items-baseline gap-3">
              <span
                aria-hidden="true"
                className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full"
                style={{ background: segment.color }}
              />
              <span className="font-display text-2xl leading-none font-extrabold text-ink tabular-nums">
                {segment.value}
              </span>
              <span className="text-sm leading-snug text-ink-soft">
                <span className="font-semibold text-ink">{segment.label}</span>
                <span className="block text-ink-soft/80">{segment.note}</span>
              </span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
