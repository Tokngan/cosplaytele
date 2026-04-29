import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { getPostRepository } from "@/lib/repositories";

export const revalidate = 21600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const repo = getPostRepository();
  const slugs = await repo.listSlugsForBuild(200);

  const now = new Date();
  const root: MetadataRoute.Sitemap = [
    { url: `${siteConfig.url}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
  ];

  const posts: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${siteConfig.url}/posts/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...root, ...posts];
}
