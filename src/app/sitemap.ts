import type { MetadataRoute } from "next";
import { getDogs } from "@/lib/dogs";
import { upcomingEvents } from "@/lib/events";
import { BASE_URL } from "@/lib/site";

const BASE = BASE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { active } = await getDogs();
  const events = upcomingEvents();
  return [
    { url: BASE, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/dogs`, changeFrequency: "hourly", priority: 0.9 },
    ...active.map((dog) => ({
      url: `${BASE}/dogs/${dog.id}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    // Only while they are ahead of us. A finished event goes noindex and drops out of
    // here by itself, and /events/past is never listed at all.
    ...(events.length > 0
      ? [
          {
            url: `${BASE}/events`,
            changeFrequency: "weekly" as const,
            priority: 0.7,
          },
        ]
      : []),
    ...events.map((event) => ({
      url: `${BASE}/events/${event.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}

export const revalidate = 1800;
