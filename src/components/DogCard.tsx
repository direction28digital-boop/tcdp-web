import Image from "next/image";
import Link from "next/link";
import {
  daysLeftLabel,
  deadlineTone,
  formatAge,
  formatBreed,
  hasSomeone,
  type CardDog,
} from "@/lib/dogs";

const TONE_STYLES: Record<string, string> = {
  red: "bg-sunset-deep text-white",
  amber: "bg-gold-soft text-rust",
  calm: "bg-sage-soft text-sage",
};

export function DeadlineChip({
  daysLeft,
  className = "",
}: {
  daysLeft: number | null;
  className?: string;
}) {
  const tone = deadlineTone(daysLeft);
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 font-display text-xs font-bold tracking-wide uppercase ${TONE_STYLES[tone]} ${className}`}
    >
      {daysLeftLabel(daysLeft)}
    </span>
  );
}

/** New Hope Only dogs need a partner rescue. The other dogs can be adopted directly. */
export function RouteBadge({ nho }: { nho: boolean }) {
  return nho ? (
    <span className="inline-flex items-center rounded-full border border-sage/30 bg-white px-3 py-1 font-display text-xs font-bold tracking-wide text-sage uppercase">
      Rescue pull needed
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-rust/30 bg-white px-3 py-1 font-display text-xs font-bold tracking-wide text-rust uppercase">
      Adopt directly, fees waived
    </span>
  );
}

export function DogCard({ dog }: { dog: CardDog }) {
  const facts = [formatAge(dog.age), dog.sex, formatBreed(dog.breed)]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_2px_18px_rgba(17,17,17,0.07)] transition-shadow hover:shadow-[0_10px_30px_rgba(17,17,17,0.13)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-deep">
        {dog.photo ? (
          <Image
            src={dog.photo}
            alt={`${dog.name}, a dog waiting at the ${dog.shelter ?? ""} shelter`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-ink-soft">
            No photo posted by the shelter yet
          </div>
        )}
        {/* No deadline chip once somebody is coming. A dog with a foster lined
            up was showing "DEADLINE PASSED" next to "TRANSFER PENDING", which
            reads to a stranger as "this dog is already dead". The deadline is
            not the story any more once the dog is spoken for. */}
        {hasSomeone(dog) ? (
          <div className="absolute top-3 left-3 rounded-full bg-sage px-3 py-1.5 font-display text-xs font-bold tracking-wide text-white uppercase">
            Someone is coming
          </div>
        ) : (
          <div className="absolute top-3 left-3">
            <DeadlineChip daysLeft={dog.daysLeft} />
          </div>
        )}
        {dog.status && !hasSomeone(dog) ? (
          <div className="absolute right-3 bottom-3 rounded-full bg-ink/85 px-3 py-1 font-display text-xs font-bold tracking-wide text-cream uppercase">
            {dog.status}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-display text-xl leading-tight font-extrabold text-ink">
            <Link
              href={`/dogs/${dog.id}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {dog.name}
            </Link>
          </h3>
          <p className="mt-1 text-xs font-semibold tracking-wide text-ink-soft/80 uppercase">
            {dog.id}
          </p>
        </div>

        {facts ? (
          <p className="text-sm leading-relaxed text-ink-soft">{facts}</p>
        ) : null}

        {/* Only the rescue's own words appear here now. The generated story is
            gone: it made behavioural claims in the shelter's voice, and a card is
            the worst possible place for one, because it is read fastest and
            trusted most. A card with no note just shows the facts. */}
        {dog.note ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">
            {dog.note}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <RouteBadge nho={dog.nho} />
        </div>
      </div>
    </article>
  );
}
