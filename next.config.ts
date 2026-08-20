import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/screening-room",
          destination: "/awards-intelligence/discovery.html",
        },
        {
          source: "/screening-room/",
          destination: "/awards-intelligence/discovery.html",
        },
        {
          source: "/screening-room/:path*",
          destination: "/awards-intelligence/:path*",
        },
        {
          source: "/projects/screening-room",
          destination: "/projects/awards-intelligence",
        },
      ],
    };
  },
};

export default nextConfig;
