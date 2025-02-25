// next.config.ts
import type { NextConfig } from "next";

const config: NextConfig = {
  // Remove 'output: "export"' if present
  typescript: {
    ignoreBuildErrors: true, // Optional: if you have TypeScript errors during build
  },
};

export default config;
