'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowUp, Compass, Rss, Send } from 'lucide-react';
import { SubscribeForm } from './SubscribeForm';

const hiddenPrefixes = ['/write', '/admin', '/dashboard'];

const footerGroups = [
  {
    title: '内容',
    links: [
      { name: '首页', href: '/' },
      { name: '博客', href: '/blog' },
      { name: '归档', href: '/archive' },
      { name: '关于', href: '/about' },
    ],
  },
  {
    title: '分类',
    links: [
      { name: '技术', href: '/blog?category=tech' },
      { name: '设计', href: '/blog?category=design' },
      { name: '生活', href: '/blog?category=life' },
      { name: '思考', href: '/blog?category=thoughts' },
    ],
  },
  {
    title: '扩展',
    links: [
      { name: '资源', href: '/resources' },
      { name: '友链', href: '/links' },
      { name: '留言', href: '/guestbook' },
      { name: 'RSS', href: '/api/rss' },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();

  if (hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative mt-20 border-t border-border/60 bg-background/55 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(56,189,248,0.1),transparent_45%),radial-gradient(circle_at_90%_20%,rgba(249,115,22,0.08),transparent_40%)]" />
      <motion.button
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.95 }}
        onClick={scrollToTop}
        className="btn-secondary absolute -top-5 right-8 inline-flex h-10 w-10 items-center justify-center p-0 text-muted-foreground hover:text-foreground"
        aria-label="回到顶部"
      >
        <ArrowUp className="h-4 w-4" />
      </motion.button>

      <div className="relative mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <h3 className="text-xl font-semibold tracking-tight">拾光博客</h3>
            <p className="text-soft mt-3 max-w-sm text-sm leading-7">
              一个持续更新的内容站，记录技术实践、设计思考和长期写作。
            </p>

            <div className="text-soft mt-5 inline-flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1">
                <Compass className="h-3.5 w-3.5" />
                Content First
              </span>
              <span className="inline-flex items-center gap-1">
                <Rss className="h-3.5 w-3.5" />
                持续订阅
              </span>
              <span className="inline-flex items-center gap-1">
                <Send className="h-3.5 w-3.5" />
                稳定更新
              </span>
            </div>

            <div className="mt-6 max-w-sm">
              <SubscribeForm variant="inline" />
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold tracking-[0.08em] text-foreground">{group.title}</h4>
              <ul className="mt-4 space-y-3 text-sm">
                {group.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-soft transition hover:text-foreground">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-soft mt-10 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} 拾光博客。All rights reserved.</p>
          <p>Built with Next.js and Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
}
