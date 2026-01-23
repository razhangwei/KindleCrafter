import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["jsdom", "epub-gen-memory"],
};

export default nextConfig;
