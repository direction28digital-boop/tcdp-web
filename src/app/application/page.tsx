import type { Metadata } from "next";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SwipeHeading, TornEdge } from "@/components/Shapes";
import { ApplicationForm, type MatchDog } from "@/components/ApplicationForm";
import { getDogs } from "@/lib/dogs";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Apply once to foster a dog",
  description:
    "One short application, about five minutes, and you never fill it in again. Then one click for any dog you can help.",
};

export default async function ApplicationPage() {
  const [{ active }, viewer] = await Promise.all([getDogs(), getViewer()]);

  const dogs: MatchDog[] = active.map((dog) => ({
    id: dog.id,
    name: dog.name,
    weight: dog.weight ? Number.parseFloat(dog.weight) : null,
    breed: dog.breed,
  }));

  // If they have applied before, the form opens on their answers rather than
  // empty. "Apply once" only means anything if coming back is editing.
  let initialAnswers: Record<string, string | string[]> = {};
  let alreadySubmitted = false;

  if (viewer) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("applications")
      .select("answers, status")
      .eq("org_id", viewer.org.id)
      .eq("profile_id", viewer.profile.id)
      .maybeSingle();

    if (data) {
      initialAnswers = (data.answers ?? {}) as Record<string, string | string[]>;
      alreadySubmitted = data.status !== "draft";
    }
  }

  return (
    <>
      <SiteNav />
      <main id="main">
        <section className="bg-cream pt-6 pb-10">
          <div className="mx-auto max-w-[760px] px-6">
            <SwipeHeading
              swipe="var(--color-gold)"
              as="h1"
              variant="wide"
              className="mt-2 text-4xl md:text-5xl"
            >
              Apply once. Then one click per dog.
            </SwipeHeading>
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">
              About five minutes, and you never fill it in again. After this,
              saying yes to a dog is one click and a couple of questions about
              that dog.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              No password to make. Put your email in the first step and we send
              you a link at the end.
            </p>
          </div>
        </section>

        <TornEdge fill="var(--color-cream)" flip className="h-8" />

        <section className="bg-cream-deep pb-16">
          <ApplicationForm
            dogs={dogs}
            signedIn={viewer !== null}
            initialAnswers={initialAnswers}
            alreadySubmitted={alreadySubmitted}
          />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

// No page-level revalidate on purpose: reading the session makes this page
// dynamic anyway. The county feed keeps its own 30 minute cache inside
// getDogs(), so the live dog count in the form is still cheap.
