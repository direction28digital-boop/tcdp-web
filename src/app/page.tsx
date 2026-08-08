import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { DogCard } from "@/components/DogCard";
import { OutcomeDonut } from "@/components/Donut";
import { SwipeHeading } from "@/components/Shapes";
import { Hero } from "@/components/Hero";
import { formatDeadline, getDogs } from "@/lib/dogs";
import { SITE } from "@/lib/site";
import { ASSETS } from "@/lib/assets";

export default async function HomePage() {
  const { active, stats } = await getDogs();
  const featured = active.slice(0, 5);
  const adoptableNow = active.filter((d) => !d.nho).length;
  const nextDeadlineDays = active.find((d) => d.daysLeft !== null)?.daysLeft;

  return (
    <>
      <SiteNav />
      <main id="main">
        <Hero dogs={active} urgentThisWeek={stats.urgentThisWeek} />

        {/* ── The ask, with live outcomes ──────────────────────────────── */}
        <section className="bg-cream pb-20">
          <div className="mx-auto max-w-[1180px] px-6">
            <div className="-mt-8 grid gap-10 rounded-3xl bg-surface p-8 pt-14 shadow-[0_12px_44px_rgba(17,17,17,0.10)] md:-mt-16 md:grid-cols-[1.15fr_1fr] md:gap-14 md:p-14 md:pt-20">
              <div>
                <h2 className="font-display text-3xl leading-tight font-extrabold text-ink md:text-4xl">
                  Behind every dog saved is someone like you.
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-ink-soft">
                  Every dog on this page is on the Maricopa County priority
                  list. That means a posted deadline and days, not weeks. Some
                  need a rescue partner to pull them. Some you can walk in and
                  adopt today with the fees waived.
                </p>
                <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                  You do not have to be a hero, and you do not have to pay the
                  vet bills. What you do need is a spare room and the
                  willingness to be that dog&rsquo;s home until they are
                  adopted. Think months. Rescues here are foster based, which
                  means there is no building and no kennel to bring a dog back
                  to. Your spare room is the rescue.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <a
                    href={SITE.applyUrl}
                    className="rounded-full bg-sunset px-8 py-4 font-display text-base font-bold tracking-wide text-white uppercase transition-colors hover:bg-sunset-deep"
                  >
                    Apply to Save
                  </a>
                  <Link
                    href="/dogs"
                    className="rounded-full border-2 border-ink px-8 py-4 font-display text-base font-bold tracking-wide text-ink uppercase transition-colors hover:bg-ink hover:text-cream"
                  >
                    See the urgent list
                  </Link>
                </div>
              </div>

              <div className="flex items-center border-t border-line pt-10 md:border-t-0 md:border-l md:pt-0 md:pl-14">
                <OutcomeDonut
                  waiting={stats.waiting}
                  transferred={stats.transferred}
                  adopted={stats.adopted}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust badges ─────────────────────────────────────────────── */}
        <section className="bg-sunset py-8">
          <ul className="mx-auto grid max-w-[1180px] gap-6 px-6 text-center text-white sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Real records", "Every dog and date comes from county files"],
              ["Apply once", "One application, then raise your hand per dog"],
              ["Updated hourly", "The list refreshes straight from the county"],
              ["Volunteer run", "No salaries, no call center, just neighbors"],
            ].map(([title, note]) => (
              <li key={title}>
                <p className="font-display text-sm font-bold tracking-[0.16em] uppercase">
                  {title}
                </p>
                <p className="mt-1 text-sm text-white">{note}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Live numbers ─────────────────────────────────────────────── */}
        <section className="bg-cream py-16">
          <dl className="mx-auto grid max-w-[1180px] gap-10 px-6 text-center sm:grid-cols-2 lg:grid-cols-4">
            {[
              [stats.waiting, "on the priority list right now"],
              [stats.saved, "got out this week"],
              [
                nextDeadlineDays ?? 0,
                nextDeadlineDays === 1
                  ? "day until the next deadline"
                  : "days until the next deadline",
              ],
              [adoptableNow, "you can adopt today, fees waived"],
            ].map(([value, label]) => (
              <div key={String(label)}>
                <dt className="sr-only">{label}</dt>
                <dd>
                  <span className="block font-display text-6xl leading-none font-black text-sunset tabular-nums">
                    {value}
                  </span>
                  <span className="mt-3 block text-sm font-semibold tracking-wide text-ink-soft uppercase">
                    {label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Urgent dogs ──────────────────────────────────────────────── */}
        <section className="bg-cream pb-20" aria-labelledby="urgent">
          <div className="mx-auto max-w-[1180px] px-6">
            <SwipeHeading
              swipe="var(--color-gold)"
              className="text-4xl md:text-5xl"
            >
              <span id="urgent">They can&rsquo;t wait</span>
            </SwipeHeading>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
              {stats.nextDeadline
                ? `The next deadline is ${formatDeadline(stats.nextDeadline)}.`
                : "Deadlines are posted by the county."}{" "}
              These are the dogs closest to theirs.
            </p>

            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {featured.map((dog) => (
                <li key={dog.id}>
                  <DogCard dog={dog} />
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <Link
                href="/dogs"
                className="inline-block rounded-full border-2 border-ink px-8 py-4 font-display text-base font-bold tracking-wide text-ink uppercase transition-colors hover:bg-ink hover:text-cream"
              >
                See all {stats.waiting} dogs
              </Link>
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────── */}
        <section
          id="how-it-works"
          className="scroll-mt-24 bg-surface py-20"
          aria-labelledby="how"
        >
          <div className="mx-auto max-w-[1180px] px-6">
            <SwipeHeading
              swipe="var(--color-sage-soft)"
              className="text-4xl md:text-5xl"
            >
              <span id="how">How saving a dog actually works</span>
            </SwipeHeading>

            <ol className="mt-12 grid gap-10 md:grid-cols-3">
              {[
                [
                  "Fill in the application",
                  "It lives at dogfoster.org. We will be straight with you: it is long, longer than we want it to be. Fill it in once and you never have to do it again.",
                ],
                [
                  "Tell us which dog",
                  "Send us the name and the ID number of the dog you saw, by phone or in the form. We are watching that list all day and we will know exactly who you mean.",
                ],
                [
                  "Open your door",
                  "Most of these dogs need a New Hope rescue to pull them, and we work that side for you. Then you are the placement. These rescues have no facility, so if a foster hands a dog back there is nowhere for that dog to go. Plan on months, not weeks. Plenty of people who open the door end up keeping their dog, and that is a happy ending too.",
                ],
              ].map(([title, body], i) => (
                <li key={title}>
                  <span className="font-display text-6xl leading-none font-black text-rust">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-extrabold text-ink">
                    {title}
                  </h3>
                  <p className="mt-3 text-lg leading-relaxed text-ink-soft">
                    {body}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-6">
              <a
                href={SITE.applyUrl}
                className="inline-block rounded-full bg-sunset px-8 py-4 font-display text-base font-bold tracking-wide text-white uppercase transition-colors hover:bg-sunset-deep"
              >
                Start your application
              </a>
              <p className="max-w-md text-base leading-relaxed text-ink-soft">
                We are building a shorter version, where you answer about half
                as many questions a single time and then raise your hand for any
                dog in one click. It is the next thing we are making.
              </p>
            </div>
          </div>
        </section>

        {/* ── Two missions ─────────────────────────────────────────────── */}
        <section
          id="missions"
          className="scroll-mt-24 bg-cream py-20"
          aria-labelledby="missions-heading"
        >
          <div className="mx-auto max-w-[1180px] px-6">
            <SwipeHeading
              swipe="var(--color-peach)"
              className="text-4xl md:text-5xl"
            >
              <span id="missions-heading">Two missions</span>
            </SwipeHeading>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <article className="rounded-2xl bg-surface p-9 shadow-[0_2px_18px_rgba(17,17,17,0.07)]">
                <p className="font-display text-sm font-bold tracking-[0.16em] text-sunset uppercase">
                  Happening every day
                </p>
                <h3 className="mt-3 font-display text-2xl font-extrabold text-ink">
                  Get the priority dogs out
                </h3>
                <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                  We watch the county list, film the dogs nobody has seen, write
                  their stories, and find the person or the rescue who moves
                  before the deadline does.
                </p>
              </article>

              <article className="rounded-2xl bg-surface p-9 shadow-[0_2px_18px_rgba(17,17,17,0.07)]">
                <p className="font-display text-sm font-bold tracking-[0.16em] text-sage uppercase">
                  Coming with our nonprofit later this year
                </p>
                <h3 className="mt-3 font-display text-2xl font-extrabold text-ink">
                  Fund spay and neuter where it is needed most
                </h3>
                <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                  The only way this list ever gets shorter is fewer puppies born
                  into it. We are building a fund for the valley neighborhoods
                  where the need is highest.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ── Wins ─────────────────────────────────────────────────────── */}
        <section className="bg-sunset py-16 text-white" aria-labelledby="wins">
          <div className="mx-auto max-w-[1180px] px-6 text-center">
            <h2
              id="wins"
              className="font-display text-3xl font-extrabold md:text-4xl"
            >
              {stats.saved} dogs made it out this week
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white">
              {stats.transferred} pulled by rescue partners and {stats.adopted}{" "}
              adopted straight from the shelter. Some of those were ours, some
              were another group&rsquo;s. We count them all, because a dog does
              not care who saved them.
            </p>
          </div>
        </section>

        {/* ── About ────────────────────────────────────────────────────── */}
        <section
          id="about"
          className="scroll-mt-24 bg-surface py-20"
          aria-labelledby="about-heading"
        >
          <div className="mx-auto grid max-w-[1180px] gap-12 px-6 md:grid-cols-[1fr_1.3fr]">
            <div className="flex items-start justify-center">
              <Image
                src={ASSETS.logoPrimary}
                alt=""
                width={487}
                height={269}
                className="h-auto w-full max-w-[340px]"
              />
            </div>
            <div>
              <h2
                id="about-heading"
                className="font-display text-4xl font-extrabold text-ink"
              >
                Who we are
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-ink-soft">
                We are {SITE.name}, a volunteer community in Phoenix. Most of
                you know us as {SITE.audienceName}, the pages that show up in
                your feed with a dog and a deadline. Everyone here has a
                full-time job. We do this in the hours around it.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                We are not a rescue and we are not yet a 501(c)(3). Our
                nonprofit filing is in motion. Until it lands we will keep
                saying so plainly, and nothing given to us is tax deductible
                yet.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                What we can do is see every dog on the county list, and make
                sure you can too.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

export const revalidate = 1800;
