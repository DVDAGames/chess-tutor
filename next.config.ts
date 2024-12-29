import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    nextScriptWorkers: true,
  },
};

export default nextConfig;
