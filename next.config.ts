import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained production build for containerised deploys
  // (https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
  output: "standalone",
  // Ensure native/runtime assets that are resolved dynamically (not
  // statically traceable) end up in the standalone output: the SQLite
  // migration files and better-sqlite3's prebuilt .node binaries.
  outputFileTracingIncludes: {
    "/*": ["drizzle/**/*", "node_modules/better-sqlite3/**/*"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
