import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SwipeHeading, TornEdge } from "@/components/Shapes";
import { ApplyPrototype, type MatchDog } from "@/components/ApplyPrototype";
import { getDogs } from "@/lib/dogs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "The shorter application, in preview",
  description:
    "A working preview of the apply-once foster profile that replaces the 50-question form.",
  robots: { index: false },
};

export default async function ApplyPreviewPage() {
  const { active } = await getDogs();
  const dogs: MatchDog[] = active.map((dog) => ({
    id: dog.id,
    name: dog.name,
    weight: dog.weight ? Number.parseFloat(dog.weight) : null,
    breed: dog.breed,
  }));

  return (
    <>
      <SiteNav />
      <main id="main">
        <section className="bg-cream pt-6 pb-10">
          <div className="mx-auto max-w-[760px] px-6">
            <p className="inline-block rounded-full bg-ink px-4 py-1.5 font-display text-xs font-bold tracking-[0.16em] text-gold uppercase">
              Preview, not live
            </p>
            <SwipeHeading
              swipe="var(--color-gold)"
              as="h1"
              variant="wide"
              className="mt-5 text-4xl md:text-5xl"
            >
              Apply once. Then one click per dog.
            </SwipeHeading>
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">
              This is a walkthrough of the shorter application we want to
              replace the current form with. Click through it, change your mind,
              type nonsense.{" "}
              <strong className="text-ink">
                Nothing is saved and nothing is sent to anybody.
              </strong>{" "}
              The real application is still the one at{" "}
              <a
                href={SITE.applyUrl}
                className="font-semibold text-rust underline decoration-2 underline-offset-4"
              >
                dogfoster.org
              </a>
              , and it keeps running until this one is approved.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              Watch what happens on the second step when you say you rent. That
              is the part we most want a second opinion on.
            </p>
          </div>
        </section>

        <TornEdge fill="var(--color-cream)" flip className="h-8" />

        <section className="bg-cream-deep pb-16">
          <ApplyPrototype dogs={dogs} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

export const revalidate = 1800;
