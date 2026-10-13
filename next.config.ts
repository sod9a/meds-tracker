import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Hide development indicator so it doesn't block mobile navigation buttons */
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
