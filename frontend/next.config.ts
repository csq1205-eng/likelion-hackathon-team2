// @ts-nocheck
import type { NextConfig } from "next";

const rawBE_C = process.env.BACKEND_INTERNAL_URL || "http://localhost:8080";
const rawBE_B = process.env.BACKEND_CLIP_URL || "http://localhost:8002";

const BE_C_URL = rawBE_C.replace(/\/+$/, "");
const BE_B_URL = rawBE_B.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
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