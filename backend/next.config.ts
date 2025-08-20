import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  logging: false,

  experimental: {
    externalDir: true,
    turbo: {
      root: path.join(__dirname, ".."),
      resolveAlias: {
        sharedtypes: "sharedtypes/dist",
      },
    },
  },

  webpack: (config, { isServer }) => {
    // Add alias for sharedtypes
    config.resolve.alias = {
      ...config.resolve.alias,
      sharedtypes: path.resolve(__dirname, "../sharedtypes/dist"),
    };

    return config;
  },
};

export default nextConfig;
