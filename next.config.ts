import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.swu-db.com',
        pathname: '/**',
      },
    ],
    qualities: [75],
  },
};

export default nextConfig;
