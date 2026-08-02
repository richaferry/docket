import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained production build for containerised deploys
  // (https://nextjs.org/docs/app/api-reference/config/next-config-js/output).
  output: "standalone",
  // Ship the SQL migration files in the standalone output so the runtime
  // entrypoint can apply them against Postgres before starting the server.
  outputFileTracingIncludes: {
    "/*": ["drizzle/**/*"],
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
