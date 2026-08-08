import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip ESLint during Vercel build (runs separately in CI workflow)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Keep TypeScript strict — errors will fail the build
  typescript: {
    ignoreBuildErrors: false,
  },
  // Mark heavy server-only packages as external (avoids bundling issues)
  serverExternalPackages: ['@google/generative-ai'],
  // Disable Next.js telemetry collection
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
  // Increase body size limit for API routes handling audio file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
