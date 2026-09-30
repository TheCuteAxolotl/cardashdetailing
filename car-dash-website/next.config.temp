import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/icon.svg",
          destination: "/cardash-header-logo.jpg",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
