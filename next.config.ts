import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App is fully dynamic (per-user data behind a session cookie), so we use the
  // classic request-time model instead of Cache Components.
  cacheComponents: false,
  serverExternalPackages: ["@electric-sql/pglite"],
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
