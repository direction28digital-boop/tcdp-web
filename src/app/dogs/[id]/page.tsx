import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { DeadlineChip, RouteBadge } from "@/components/DogCard";
import { TornEdge } from "@/components/Shapes";
import {
  daysLeftLabel,
  formatAge,
  formatBreed,
  formatDeadline,
  getDog,
  getDogs,
  type Dog,
} from "@/lib/dogs";
import { SITE } from "@/lib/site";

type Params = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const { active } = await getDogs();
  return active.map((dog) => ({ id: dog.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const dog = await getDog(id);
  if (!dog) return { title: "Dog not found" };
  return {
    title: `${dog.name}, ${daysLeftLabel(dog.daysLeft).toLowerCase()}`,
    description:
      dog.bio?.story ??
      `${dog.name} is on the Maricopa County priority list with a deadline of ${formatDeadline(dog.deadline)}.`,
    openGraph: dog.photo ? { images: [dog.photo] } : undefined,
  };
}

export default async function DogPage({ params }: Params) {
  const { id } = await params;
  const dog = await getDog(id);
  if (!dog) notFound();

  const out = dog.status === "TRANSFERRED" || dog.status === "ADOPTED";
  const facts = buildFacts(dog);

  return (
    <>
      <SiteNav />
      <main id="main">
        <section className="bg-cream pt-6 pb-14">
          <div className="mx-auto max-w-[1180px] px-6">
            <Link
              href="/dogs"
              className="font-display text-sm font-bold tracking-wide text-rust uppercase hover:text-sunset-deep"
            >
              ← All dogs on the list
            </Link>

            <div className="mt-6 grid gap-10 md:grid-cols-[1fr_1.05fr] md:gap-14">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-cream-deep shadow-[0_12px_44px_rgba(17,17,17,0.12)]">
                {dog.photo ? (
                  <Image
                    src={dog.photo}
                    alt={`${dog.name}, photographed at the ${dog.shelter ?? "county"} shelter`}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 520px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-8 text-center text-ink-soft">
                    The shelter has not posted a photo of {dog.name} yet.
                  </div>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  {out ? (
                    <span className="inline-flex items-center rounded-full bg-sage px-4 py-1.5 font-display text-xs font-bold tracking-wide text-white uppercase">
                      {dog.status === "ADOPTED" ? "Adopted" : "Out safe"}
                    </span>
                  ) : (
                    <DeadlineChip daysLeft={dog.daysLeft} />
                  )}
                  <RouteBadge nho={dog.nho} />
                  {dog.status && !out ? (
                    <span className="inline-flex items-center rounded-full bg-ink px-4 py-1.5 font-display text-xs font-bold tracking-wide text-cream uppercase">
                      {dog.status}
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-5 font-display text-5xl leading-none font-black tracking-tight text-ink md:text-6xl">
                  {dog.name}
                </h1>
                <p className="mt-3 font-display text-sm font-bold tracking-[0.16em] text-ink-soft/80 uppercase">
                  County ID {dog.id}
                </p>

                {dog.deadline && !out ? (
                  <p className="mt-6 text-xl leading-relaxed font-semibold text-ink">
                    Deadline: {formatDeadline(dog.deadline)}.
                  </p>
                ) : null}

                {dog.bio?.story ? (
                  <p className="mt-5 text-lg leading-relaxed text-ink-soft">
                    {dog.bio.story}
                  </p>
                ) : (
                  <p className="mt-5 text-lg leading-relaxed text-ink-soft">
                    We have not written {dog.name}&rsquo;s story yet. Everything
                    below comes straight from the county record, and one of us
                    is working on the rest.
                  </p>
                )}

                {out ? (
                  <div className="mt-8 rounded-2xl bg-sage-soft p-6">
                    <p className="text-lg leading-relaxed font-semibold text-sage">
                      {dog.name} made it out.{" "}
                      {dog.status === "ADOPTED"
                        ? "Adopted straight from the shelter."
                        : "Pulled by a rescue partner."}{" "}
                      There are others still waiting.
                    </p>
                    <Link
                      href="/dogs"
                      className="mt-5 inline-block rounded-full bg-sage px-7 py-3.5 font-display text-sm font-bold tracking-wide text-white uppercase hover:bg-ink"
                    >
                      See who still needs help
                    </Link>
                  </div>
                ) : (
                  <div className="mt-8">
                    <a
                      href={SITE.applyUrl}
                      className="inline-block rounded-full bg-sunset px-8 py-4 font-display text-base font-bold tracking-wide text-white uppercase transition-colors hover:bg-sunset-deep"
                    >
                      Apply to save {dog.name}
                    </a>
                    <p className="mt-4 text-base text-ink-soft">
                      Already applied? Call or text{" "}
                      <a
                        href={SITE.phoneHref}
                        className="font-semibold text-rust underline decoration-2 underline-offset-4"
                      >
                        {SITE.phone}
                      </a>{" "}
                      and tell us it is {dog.name}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <TornEdge fill="var(--color-surface)" className="h-8" />

        <section className="bg-surface pt-4 pb-20">
          <div className="mx-auto grid max-w-[1180px] gap-12 px-6 md:grid-cols-[1.15fr_1fr]">
            <div>
              {dog.bio?.bullets.length ? (
                <>
                  <h2 className="font-display text-2xl font-extrabold text-ink">
                    What the shelter has seen
                  </h2>
                  <ul className="mt-5 space-y-3">
                    {dog.bio.bullets.map((line) => (
                      <li
                        key={line}
                        className="flex gap-3 text-lg leading-relaxed text-ink-soft"
                      >
                        <span aria-hidden="true" className="text-sunset">
                          ●
                        </span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {dog.bio?.needs ? (
                <div className="mt-9 rounded-2xl bg-sunset-soft p-6">
                  <h2 className="font-display text-sm font-bold tracking-[0.16em] text-rust uppercase">
                    What {dog.name} needs
                  </h2>
                  <p className="mt-3 text-lg leading-relaxed text-ink">
                    {dog.bio.needs}
                  </p>
                </div>
              ) : null}

              <p className="mt-9 text-sm leading-relaxed text-ink-soft/80">
                Everything here comes from {dog.name}&rsquo;s Maricopa County
                Animal Care and Control record. We leave out the parts that
                belong between the shelter, the rescue and the vet, and we do
                not soften what a dog needs. If something changes at the
                shelter, this page changes with it.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-extrabold text-ink">
                The county record
              </h2>
              <dl className="mt-5 divide-y divide-line rounded-2xl border border-line">
                {facts.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-6 px-5 py-3.5"
                  >
                    <dt className="text-sm font-semibold tracking-wide text-ink-soft uppercase">
                      {label}
                    </dt>
                    <dd className="text-right text-base font-medium text-ink">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 rounded-2xl bg-cream p-6">
                <h3 className="font-display text-lg font-extrabold text-ink">
                  {dog.nho
                    ? "This dog needs a rescue partner"
                    : "You can adopt this dog directly"}
                </h3>
                <p className="mt-3 leading-relaxed text-ink-soft">
                  {dog.nho
                    ? "New Hope Only means the county requires a partner rescue to take this dog. Apply and raise your hand, and we work the rescue side for you. You can still be the home they land in."
                    : "This dog can go home with a member of the public before the deadline, with adoption fees waived. Apply, then go meet them."}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function buildFacts(dog: Dog): [string, string][] {
  const facts: [string, string][] = [];
  const age = formatAge(dog.age);
  const breed = formatBreed(dog.breed);
  if (age) facts.push(["Age", age]);
  if (dog.sex) facts.push(["Sex", dog.sex]);
  if (breed) facts.push(["Breed", breed]);
  if (dog.weight) facts.push(["Weight", `${dog.weight} lb`]);
  if (dog.shelter) facts.push(["Shelter", `${dog.shelter} shelter`]);
  if (dog.kennel) facts.push(["Kennel", dog.kennel]);
  if (dog.deadline) facts.push(["Deadline", formatDeadline(dog.deadline)]);
  return facts;
}

export const revalidate = 1800;
