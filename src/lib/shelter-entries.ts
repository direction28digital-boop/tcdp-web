/**
 * The county writes in dated entries. This finds the seams.
 *
 * Every section of an MCACC record is a stack of observations, each headed by a
 * bare date on its own line:
 *
 *     9/10/2026
 *     during morning cleaning, canine was laying on bed when handler approached…
 *     9/8/2026
 *     Updating color due to NHO status.
 *
 * Splitting on those headers is what lets a long section show its most recent
 * entries and keep the rest one click away, ON the page. It is not editing:
 * every character survives, in the county's order, in their words.
 *
 * WHY THIS REPLACED TRUNCATION. The page used to cut a section at 2,500
 * characters and link out for the rest. Measured against the live feed that was
 * indefensible: Cruz's behaviour evaluations run 12,547 characters across 15
 * dated entries from 8/23 to 9/10, so the cut showed four and dropped eleven.
 * For a dog described as shutting down under shelter stress, the early entries
 * are the argument — they are what shows he was not always like this. And the
 * county takes a dog's page down once they leave the list, so "read the rest
 * there" pointed the complete record at a URL that dies exactly when somebody
 * wants to look back.
 */

/** A line that is nothing but a date. The county's own entry separator. */
const ENTRY_HEADER = /^[ \t]*(\d{1,2}\/\d{1,2}\/\d{4})[ \t]*$/gm;

export type Entry = {
  /** The county's date header, or null for text that precedes the first one. */
  date: string | null;
  body: string;
};

export function splitEntries(text: string): Entry[] {
  const marks: { start: number; end: number; date: string }[] = [];
  ENTRY_HEADER.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ENTRY_HEADER.exec(text)) !== null) {
    marks.push({ start: m.index, end: m.index + m[0].length, date: m[1] });
  }
  if (marks.length === 0) return [];

  const entries: Entry[] = [];
  const preamble = text.slice(0, marks[0].start).trim();
  if (preamble) entries.push({ date: null, body: preamble });

  marks.forEach((mark, i) => {
    const stop = i + 1 < marks.length ? marks[i + 1].start : text.length;
    const body = text.slice(mark.end, stop).trim();
    entries.push({ date: mark.date, body });
  });
  return entries;
}

/**
 * How much to show before the fold.
 *
 * Fills to a character budget and then includes the entry that crosses it,
 * rather than stopping short — cutting before the entry that busts the budget
 * left some dogs showing 315 characters of a 12,547-character record, which
 * under-represents the thing this page exists to disclose.
 *
 * Measured across the live feed: median section opens at ~336 characters, worst
 * case ~4,100 where a single entry is that long on its own and cannot be split.
 * Nothing is ever hidden from the page, only from the first screenful.
 */
const BUDGET = 1500;

export type Planned = {
  /** Rendered immediately. */
  shown: Entry[];
  /** Behind "Show all N entries", still on this page. */
  hidden: Entry[];
};

export function planEntries(text: string): Planned | null {
  const entries = splitEntries(text);
  // Nothing dated, or a single block: there is no fold to make, so the caller
  // renders the whole thing.
  if (entries.length < 2) return null;

  let chars = 0;
  let count = 0;
  for (const entry of entries) {
    chars += entry.body.length;
    count += 1;
    if (chars >= BUDGET) break;
  }
  if (count >= entries.length) return null;

  return { shown: entries.slice(0, count), hidden: entries.slice(count) };
}
