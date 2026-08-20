import type { NextConfig } from "next";

const BE_C_URL = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080";
const BE_B_URL = process.env.BACKEND_CLIP_URL ?? "http://localhost:8002";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/clips/:path*",
        destination: `${BE_B_URL}/api/clips/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${BE_C_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;