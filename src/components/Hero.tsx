import { findFocus } from "@/lib/focus";
import { formatAge, type Dog } from "@/lib/dogs";
import { HeroStage, type HeroCandidate } from "@/components/HeroStage";

/**
 * The hero features a real dog from today's county list, and every visitor gets a
 * different one.
 *
 * Nothing here is hand-cropped, so the layout has to get out of the dog's way by itself.
 * For each candidate, `findFocus` locates the subject, the crop is anchored to keep the
 * head in frame, and the copy is pushed to whichever side of the photograph the dog is
 * not occupying. The dog's own details sit low, under the copy, never across the face.
 *
 * The analysis runs on the server once per revalidation, not per visitor. The random
 * choice happens in the browser, which is what keeps the page itself cacheable.
 */
export async function Hero({
  dogs,
  urgentThisWeek,
}: {
  dogs: Dog[];
  urgentThisWeek: number;
}) {
  const pool = dogs.filter((d) => d.photo && !d.status).slice(0, 8);
  const candidates: HeroCandidate[] = (
    await Promise.all(
      pool.map(async (dog) => {
        const focus = await findFocus(dog.photo!);
        return {
          id: dog.id,
          name: dog.name,
          photo: dog.photo!,
          age: formatAge(dog.age),
          pronoun: pronoun(dog.sex),
          daysLeft: dog.daysLeft,
          objectPosition: focus.objectPosition,
          // Only commit to a side when the photo is clearly lopsided, otherwise a
          // centred dog would flip the whole layout on noise.
          copyRight: focus.cx < 0.44,
        };
      }),
    )
  ).filter(Boolean);

  return <HeroStage candidates={candidates} urgentThisWeek={urgentThisWeek} />;
}

/** The county records sex, so the invitation can read like a person wrote it. */
function pronoun(sex: string | null): string | null {
  if (!sex) return null;
  if (/^m/i.test(sex)) return "him";
  if (/^f/i.test(sex)) return "her";
  return null;
}
