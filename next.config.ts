import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow image optimization from external sources
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  // Webpack config for Yjs compatibility
  webpack: (config) => {
    // Fix Yjs module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
};

export default nextConfig;
