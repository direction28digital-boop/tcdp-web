"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BrushSlab, TornEdge } from "@/components/Shapes";

export type HeroCandidate = {
  id: string;
  name: string;
  photo: string;
  age: string | null;
  pronoun: string | null;
  daysLeft: number | null;
  objectPosition: string;
  copyRight: boolean;
};

/**
 * Picks one of the pre-analysed dogs at random, in the browser, so two people opening
 * the site see two different faces while the page itself stays a cached static render.
 *
 * The server renders the first candidate, which is what a visitor without JavaScript
 * keeps, and what the browser starts downloading immediately for a fast first paint.
 */
export function HeroStage({
  candidates,
  urgentThisWeek,
}: {
  candidates: HeroCandidate[];
  urgentThisWeek: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (candidates.length < 2) return;
    setIndex(Math.floor(Math.random() * candidates.length));
  }, [candidates.length]);

  const dog = candidates[index] ?? candidates[0] ?? null;
  const copyRight = dog?.copyRight ?? false;

  return (
    <section className="relative min-h-[600px] overflow-hidden md:min-h-[700px]">
      {dog ? (
        <Image
          key={dog.id}
          src={dog.photo}
          alt={`${dog.name}, on the Maricopa County priority list`}
          fill
          priority
          sizes="100vw"
          style={{ objectPosition: dog.objectPosition }}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-sage" />
      )}

      {/*
        Two scrims: one from the copy side so type stays readable over any photograph,
        one from the bottom so the dog's details and the torn edge have something to
        sit on.
      */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 ${
          copyRight
            ? "bg-gradient-to-l from-ink/85 via-ink/40 to-ink/5"
            : "bg-gradient-to-r from-ink/85 via-ink/40 to-ink/5"
        }`}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 to-transparent"
      />

      <div className="absolute inset-x-0 top-0 z-20">
        <TornEdge fill="var(--color-cream)" flip className="h-7 md:h-10" />
      </div>
      <div className="absolute inset-x-0 bottom-0 z-20">
        <TornEdge fill="var(--color-cream)" className="h-7 md:h-10" />
      </div>

      <div
        className={`relative z-10 mx-auto flex min-h-[600px] max-w-[1180px] flex-col justify-end px-6 pt-24 pb-20 md:min-h-[700px] md:pb-24 ${
          copyRight ? "items-end" : "items-start"
        }`}
      >
        <div className="relative w-full max-w-[470px]">
          <BrushSlab
            fill="var(--color-sage)"
            viewBox="170 34 580 232"
            className="absolute top-[-7%] left-[-6%] -z-10 h-[114%] w-[112%] -rotate-1"
          />
          <div className="relative px-3 py-3">
            <p className="font-display text-xs font-bold tracking-[0.2em] text-gold uppercase">
              Phoenix, Arizona
            </p>
            <h1 className="mt-2 font-display text-5xl leading-[0.95] font-black tracking-tight text-gold uppercase">
              Save a dog now
            </h1>
            <p className="mt-3 text-lg leading-snug font-semibold text-cream">
              {urgentThisWeek} of them need out this week.
            </p>
          </div>
        </div>

        {dog ? (
          <div className="relative mt-6">
            <Link
              href={`/dogs/${dog.id}`}
              className="group inline-flex flex-wrap items-center gap-x-3 gap-y-2 rounded-full bg-ink/70 py-2 pr-5 pl-3 backdrop-blur-sm transition-colors hover:bg-ink"
            >
              <span className="rounded-full bg-sunset px-3 py-1 font-display text-xs font-bold tracking-wide text-white uppercase">
                {daysLabel(dog.daysLeft)}
              </span>
              <span className="text-sm font-semibold text-cream">
                This is {dog.name}
                {dog.age ? `, ${dog.age}` : ""}.{" "}
                <span className="underline decoration-gold decoration-2 underline-offset-4 group-hover:text-gold">
                  Meet {dog.pronoun ?? dog.name}
                </span>
              </span>
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function daysLabel(daysLeft: number | null): string {
  if (daysLeft === null) return "On the list";
  if (daysLeft < 0) return "Deadline passed";
  if (daysLeft === 0) return "Deadline today";
  if (daysLeft === 1) return "1 day left";
  return `${daysLeft} days left`;
}
