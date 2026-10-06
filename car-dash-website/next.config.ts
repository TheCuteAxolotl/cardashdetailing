import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/services",
        destination: "/car-detailing-packages",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
