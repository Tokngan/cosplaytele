export const siteConfig = {
  name: "Cosplaytele",
  description: "Cosplay galleries and photo sets",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  defaultPostsPerPage: 20,
  isr: {
    listSeconds: 60 * 30,
    postSeconds: 60 * 60,
    taxonomySeconds: 60 * 60,
    sitemapSeconds: 60 * 60 * 6,
  },
  build: {
    prerenderLatestPosts: 60,
  },
} as const;

export const upstreamConfig = {
  apiBase: process.env.WP_API_BASE ?? "https://cosplaytele.com/wp-json/wp/v2",
  siteOrigin: process.env.WP_SITE_ORIGIN ?? "https://cosplaytele.com",
  mediaAllowlist: (process.env.MEDIA_ALLOWLIST ?? "cosplaytele.com")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
} as const;
