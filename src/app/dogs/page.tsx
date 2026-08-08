import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { DogBrowser } from "@/components/DogBrowser";
import { SwipeHeading, TornEdge } from "@/components/Shapes";
import { formatDeadline, getDogs } from "@/lib/dogs";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Urgent dogs",
  description:
    "Every dog currently on the Maricopa County priority list, with their real deadline. Apply once and raise your hand for any of them.",
};

export default async function DogsPage() {
  const { active, stats, fetchedAt, live } = await getDogs();

  /**
   * DogBrowser is a client component, so everything handed to it is serialised into the
   * page for the browser to download. Cards only ever show the bio's first lines, so the
   * bullets and the needs paragraph are dropped here. Most of this audience is on a phone.
   * The full bio still renders on each dog's own page.
   */
  const forList = active.map((dog) => ({
    ...dog,
    bio: dog.bio ? { ...dog.bio, bullets: [], needs: "" } : null,
  }));

  return (
    <>
      <SiteNav />
      <main id="main">
        <section className="bg-cream pt-6 pb-4">
          <div className="mx-auto max-w-[1180px] px-6">
            <SwipeHeading
              swipe="var(--color-gold)"
              as="h1"
              className="text-4xl md:text-5xl"
            >
              Dogs on the list
            </SwipeHeading>
            {live ? (
              <>
                <p className="mt-6 max-w-3xl text-lg leading-relaxed text-ink-soft">
                  These {stats.waiting} dogs are on the Maricopa County priority
                  list today. The next deadline is{" "}
                  <strong className="text-ink">
                    {formatDeadline(stats.nextDeadline)}
                  </strong>
                  . Dogs marked as needing a rescue pull have to leave with a
                  New Hope partner rescue. The rest you can adopt in person
                  before their deadline, with the fees waived.
                </p>
                <p className="mt-4 text-sm text-ink-soft/80">
                  Updated from the county
                  {fetchedAt
                    ? ` ${new Date(fetchedAt).toLocaleString("en-US", {
                        timeZone: "America/Phoenix",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })} Phoenix time.`
                    : "."}{" "}
                  Call {SITE.phone} if a dog you love is not showing here.
                </p>
              </>
            ) : (
              <p className="mt-6 max-w-3xl rounded-2xl bg-sunset-soft p-6 text-lg leading-relaxed text-ink">
                We cannot reach the county list right now, so this page is
                empty. That does not mean no dogs are waiting. Please call us at{" "}
                <a
                  href={SITE.phoneHref}
                  className="font-semibold text-rust underline decoration-2 underline-offset-4"
                >
                  {SITE.phone}
                </a>{" "}
                and we will tell you who needs help today.
              </p>
            )}
          </div>
        </section>

        <TornEdge fill="var(--color-cream)" flip className="h-8" />

        <section className="bg-cream-deep py-12">
          <div className="mx-auto max-w-[1180px] px-6">
            <DogBrowser dogs={forList} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

export const revalidate = 1800;
