// next.config.ts
import type { NextConfig } from "next";

const config: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Optional: if you have TypeScript errors during build
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  images: {
    domains: [
      "cdn.pixabay.com",
      "images.unsplash.com",
      "raw.githubusercontent.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Robots-Tag",
          value: "index, follow",
        },
      ],
    },
  ],
};

export default config;
