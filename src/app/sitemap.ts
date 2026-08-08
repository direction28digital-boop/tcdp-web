import type { MetadataRoute } from "next";
import { getDogs } from "@/lib/dogs";
import { BASE_URL } from "@/lib/site";

const BASE = BASE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { active } = await getDogs();
  return [
    { url: BASE, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/dogs`, changeFrequency: "hourly", priority: 0.9 },
    ...active.map((dog) => ({
      url: `${BASE}/dogs/${dog.id}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}

export const revalidate = 1800;
