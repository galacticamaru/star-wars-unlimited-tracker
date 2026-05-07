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
    minimumCacheTTL: 2678400,
    // TODO(2026-06-04): Vercel Image Transformations quota exhausted — remove unoptimized once quota renews
    unoptimized: true,
  },
};

export default nextConfig;
