import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: 'out',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  /* 禁用不兼容静态导出的功能 */
  experimental: {
    serverActions: {
      allowedOrigins: []
    }
  }
};

export default nextConfig;