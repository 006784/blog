import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FontProvider } from "@/components/FontProvider";
import { AdminProvider } from "@/components/AdminProvider";
import { ProfileProvider } from "@/components/ProfileProvider";
import { Sidebar } from "@/components/Sidebar";
import { ParticleBackground } from "@/components/ParticleBackground";

export const metadata: Metadata = {
  title: "拾光 - 记录生活，收藏时光",
  description: "一个现代化的个人博客，在文字中拾起生活的微光",
  keywords: ["博客", "拾光", "技术", "设计", "生活"],
  authors: [{ name: "拾光" }],
  openGraph: {
    title: "拾光",
    description: "在文字中拾起生活的微光",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8b5cf6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="拾光" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        
        {/* RSS */}
        <link rel="alternate" type="application/rss+xml" title="拾光博客 RSS" href="/api/rss" />
        
        {/* 加载优质中文字体 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 思源黑体 */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        {/* 思源宋体 */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        {/* 霞鹜文楷 */}
        <link 
          href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css" 
          rel="stylesheet" 
        />
        {/* 站酷快乐体 */}
        <link 
          href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="antialiased min-h-screen" suppressHydrationWarning>
        <ThemeProvider>
          <FontProvider>
          <AdminProvider>
          <ProfileProvider>
          {/* 全局背景 */}
          <div className="fixed inset-0 -z-10 bg-background" />
          
          {/* 粒子动画背景 */}
          <ParticleBackground />
          
          {/* 渐变覆盖层 */}
          <div className="fixed inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-background via-background/80 to-transparent" />
          </div>

          {/* 侧边栏 */}
          <Sidebar />
          
          {/* 主内容区 */}
          <main className="md:ml-[var(--sidebar-width,288px)] min-h-screen transition-all duration-300 pb-24 md:pb-0">
            {children}
          </main>
          
          {/* Service Worker 注册 */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(function(registration) {
                      console.log('SW registered: ', registration);
                    }).catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                  });
                }
              `,
            }}
          />
          </ProfileProvider>
          </AdminProvider>
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
