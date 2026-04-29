import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536, 1920],
    localPatterns: [
      { pathname: "/api/media/**", search: "" },
    ],
  },
  logging: {
    fetches: { fullUrl: false },
  },
};

export default nextConfig;
