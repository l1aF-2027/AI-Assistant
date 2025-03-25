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
