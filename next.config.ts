// next.config.ts
import type { NextConfig } from "next";

const config: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Optional: if you have TypeScript errors during build
  },
};

export default config;
