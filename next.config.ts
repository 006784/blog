import type { NextConfig } from "next";

type RemotePattern = {
  protocol: 'http' | 'https';
  hostname: string;
  port?: string;
  pathname?: string;
};

function createRemotePattern(value?: string): RemotePattern | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    const protocol = url.protocol.replace(':', '');

    if (protocol !== 'http' && protocol !== 'https') {
      return null;
    }

    return {
      protocol,
      hostname: url.hostname,
      port: url.port || undefined,
      pathname: '/**',
    };
  } catch {
    return null;
  }
}

const envRemotePatterns = [
  createRemotePattern(process.env.NEXT_PUBLIC_SITE_URL),
  createRemotePattern(process.env.R2_PUBLIC_URL),
].filter((pattern): pattern is RemotePattern => pattern !== null);

const nextConfig: NextConfig = {
  // distDir: 'out',  // 注释掉自定义输出目录以适配Vercel
  trailingSlash: true,
  images: {
    // 启用图片优化：WebP/AVIF 自动转换、响应式尺寸生成
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      // Unsplash 封面回退图
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Supabase Storage（所有子域）
      { protocol: 'https', hostname: '*.supabase.co' },
      // Cloudflare R2 公开桶
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.r2.dev' },
      // DiceBear 默认头像（留言板）
      { protocol: 'https', hostname: 'api.dicebear.com' },
      // 其他常见 CDN（可按需追加）
      { protocol: 'https', hostname: '*.cloudfront.net' },
      { protocol: 'https', hostname: '*.githubusercontent.com' },
      ...envRemotePatterns,
    ],
    // 开发环境关闭优化以加速热重载
    ...(process.env.NODE_ENV === 'development' ? { unoptimized: true } : {}),
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '') || 'localhost:3000',
      ].filter(Boolean) as string[],
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self)' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
};

export default nextConfig;
