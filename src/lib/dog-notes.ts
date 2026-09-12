// Pure, no server imports: the editor is a client component and pulls
// styleWarnings in to warn as somebody types. The database read lives in
// dog-notes.server.ts so this file never drags the server client into the
// browser bundle.
/**
 * Phrases the rescue does not use about its own dogs.
 *
 * "Second chance" is Dee's rule and the reason is not squeamishness: it implies
 * the dog blew the first one. They did nothing wrong. The shelter's own words are
 * quoted verbatim elsewhere on the page and are not policed — this applies only
 * to sentences the rescue writes itself, which is the only place a house style
 * can honestly apply.
 *
 * A warning, not a block. Somebody quoting a partner rescue, or writing about the
 * phrase itself, has a legitimate reason, and a save button that refuses to save
 * gets worked around within a week.
 */
export const HOUSE_STYLE: { pattern: RegExp; why: string }[] = [
  {
    pattern: /second\s+chance/i,
    why: '"Second chance" implies they blew the first one. They did nothing wrong.',
  },
  {
    pattern: /\bfur\s?-?\s?babies?\b/i,
    why: '"Fur baby" reads as cute rather than urgent, and this is a deadline page.',
  },
];

export function styleWarnings(text: string): string[] {
  return HOUSE_STYLE.filter((r) => r.pattern.test(text)).map((r) => r.why);
}
