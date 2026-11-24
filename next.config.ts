import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-rendered: the site runs as a Node app (server.js) so content edited in the admin is live immediately.
  trailingSlash: true,
  // No native image optimiser needed on shared hosting.
  images: { unoptimized: true },
  poweredByHeader: false,
  serverExternalPackages: ["mysql2"],
};

export default nextConfig;
