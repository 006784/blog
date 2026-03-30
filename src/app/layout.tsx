/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FontProvider } from "@/components/FontProvider";
import { AdminProvider } from "@/components/AdminProvider";
import { ProfileProvider } from "@/components/ProfileProvider";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { ParticleBackground } from "@/components/ParticleBackground";
import { PerformanceOptimizer } from "@/components/PerformanceOptimizer";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandPalette } from "@/components/search/CommandPalette";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { JsonLd } from "@/components/seo/JsonLd";
import { Toaster } from "sonner";
import { generateWebsiteSchema } from "@/lib/seo";
import { siteConfig, siteUrls } from "@/lib/site-config";

const SITE_URL = siteConfig.url;
const SITE_NAME = siteConfig.name;
const SITE_DESC = siteConfig.description;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',        // iOS 刘海屏 / Dynamic Island 全屏
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf8f5' },
    { media: '(prefers-color-scheme: dark)',  color: '#1a1a18' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} - 记录生活，收藏时光`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  keywords: ["博客", SITE_NAME, "技术", "设计", "生活"],
  authors: [{ name: SITE_NAME }],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: `${SITE_NAME} - 记录生活，收藏时光`,
    description: SITE_DESC,
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - 记录生活，收藏时光`,
    description: SITE_DESC,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    types: {
      'application/rss+xml': siteUrls.rss,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* WebSite JSON-LD 结构化数据 */}
        <JsonLd data={generateWebsiteSchema()} />
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#c4a96d" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* black-translucent = 状态栏透明，内容延伸到刘海/Dynamic Island 下方 */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={SITE_NAME} />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        {/* 安卓 Chrome 沉浸式状态栏 */}
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* RSS */}
        <link rel="alternate" type="application/rss+xml" title={`${SITE_NAME} RSS`} href="/feed.xml" />
        
        {/* 加载优质中文字体 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Cormorant Garamond — 杂志英文衬线（含斜体） */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&display=swap"
          rel="stylesheet"
        />
        {/* Shippori Mincho — 日系明朝体标题 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Noto Serif JP — 日系衬线正文 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Noto Serif SC — 中文宋体回退 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Inter — UI 数字 / 英文辅助 */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="app-body antialiased min-h-screen" suppressHydrationWarning>
        <ThemeProvider>
          <FontProvider>
          <AdminProvider>
          <ProfileProvider>
          {/* 全局背景 */}
          <div className="fixed inset-0 -z-10 bg-background" />
          
          {/* 粒子动画背景 */}
          <ParticleBackground />
          
          {/* 渐变覆盖层 */}
          <div className="premium-global-backdrop fixed inset-0 -z-10 pointer-events-none" />

          {/* 全局搜索 Cmd+K */}
          <CommandPalette />

          {/* 性能优化 */}
          <PerformanceOptimizer />
          
          {/* 阅读进度条 */}
          <ReadingProgress />
          
          {/* 侧边栏 */}
          <Sidebar />
          
          {/* 主内容区 */}
          <main className="site-main md:ml-[var(--sidebar-width,52px)] min-h-screen pb-[calc(72px+env(safe-area-inset-bottom,0px))] md:pb-0">
            <ErrorBoundary>{children}</ErrorBoundary>
            <Footer />
          </main>
          
          {/* 全局 Toast 通知 */}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                fontFamily: 'var(--font-inter)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-default)',
                background: 'var(--surface-panel)',
                color: 'var(--ink)',
                backdropFilter: 'blur(12px)',
              },
            }}
          />
          {/* 全局确认弹窗 */}
          <ConfirmDialog />

          {/* Service Worker 注册 */}
          <Script id="sw-register" strategy="afterInteractive">
            {`
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  var isLocalDev =
                    location.hostname === 'localhost' ||
                    location.hostname === '127.0.0.1' ||
                    location.hostname === '0.0.0.0';

                  if (isLocalDev) {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      registrations.forEach(function(registration) {
                        registration.unregister();
                      });
                    });
                    return;
                  }

                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `}
          </Script>
          </ProfileProvider>
          </AdminProvider>
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
