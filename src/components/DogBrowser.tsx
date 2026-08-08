"use client";

import { useMemo, useState } from "react";
import { DogCard } from "@/components/DogCard";
import type { Dog } from "@/lib/dogs";

type Filter = "all" | "nho" | "adoptable" | "soonest";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All dogs" },
  { id: "soonest", label: "Deadline in 2 days" },
  { id: "nho", label: "Needs a rescue pull" },
  { id: "adoptable", label: "Adopt directly" },
];

export function DogBrowser({ dogs }: { dogs: Dog[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dogs.filter((dog) => {
      if (filter === "nho" && !dog.nho) return false;
      if (filter === "adoptable" && dog.nho) return false;
      if (filter === "soonest" && (dog.daysLeft === null || dog.daysLeft > 2))
        return false;
      if (!q) return true;
      return [dog.name, dog.id, dog.breed, dog.kennel, dog.shelter]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    });
  }, [dogs, query, filter]);

  return (
    <div>
      <div className="flex flex-col gap-5 rounded-2xl bg-surface p-6 shadow-[0_2px_18px_rgba(17,17,17,0.07)]">
        <div>
          <label
            htmlFor="dog-search"
            className="block font-display text-sm font-bold tracking-wide text-ink-soft uppercase"
          >
            Search by name, ID, breed or kennel
          </label>
          <input
            id="dog-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Billy, A5168810, shepherd, Wing S"
            className="mt-2 w-full rounded-full border-2 border-line bg-cream px-5 py-3 text-base text-ink placeholder:text-ink-soft/70 focus:border-sunset focus:outline-none"
          />
        </div>

        <fieldset>
          <legend className="font-display text-sm font-bold tracking-wide text-ink-soft uppercase">
            Narrow it down
          </legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {FILTERS.map((option) => {
              const active = filter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(option.id)}
                  className={`rounded-full border-2 px-5 py-2 font-display text-sm font-bold tracking-wide uppercase transition-colors ${
                    active
                      ? "border-ink bg-ink text-cream"
                      : "border-line bg-surface text-ink-soft hover:border-ink hover:text-ink"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      <p aria-live="polite" className="mt-8 text-lg font-semibold text-ink">
        {results.length === dogs.length
          ? `${dogs.length} dogs on the list`
          : `${results.length} of ${dogs.length} dogs`}
      </p>

      {results.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-surface p-8 text-lg text-ink-soft">
          No dogs match that yet. Try a shorter search, or clear the filters to
          see everyone waiting.
        </p>
      ) : (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.map((dog) => (
            <li key={dog.id}>
              <DogCard dog={dog} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
