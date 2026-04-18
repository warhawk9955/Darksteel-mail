import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Nothing here yet; server actions are on by default in Next 15.
  },
};

export default config;
