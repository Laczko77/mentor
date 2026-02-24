import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for optimized production deployments (smaller image)
  output: "standalone",

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // Enable experimental optimizations
  experimental: {
    // Optimize package imports — tree-shake large libraries
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "framer-motion",
    ],
  },
};

export default nextConfig;
