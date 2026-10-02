import type { MetadataRoute } from "next";
import { listActiveSlugs } from "@/lib/cards/public-queries";
import { cardUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cards = await listActiveSlugs();
  return cards.map((c) => ({ url: cardUrl(c.slug), lastModified: c.updatedAt, changeFrequency: "monthly", priority: 0.6 }));
}
