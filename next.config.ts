import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gendo-storage.s3.sa-east-1.amazonaws.com",
        pathname: "/vomo825/**",
      },
    ],
  },
};

export default nextConfig;
