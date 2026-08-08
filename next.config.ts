import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress type errors during Vercel build (types checked separately in CI)
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint runs in CI workflow; skip during Vercel build to speed up deploy
    ignoreDuringBuilds: true,
  },
  // Allow Sarvam AI and Gemini API domains for server actions
  serverExternalPackages: ['@google/generative-ai'],
};

export default nextConfig;
