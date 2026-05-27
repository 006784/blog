'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { APPLE_EASE_SOFT } from '@/components/Animations';
import { Badge } from '@/components/ui/Badge';

const categories = [
  {
    href: '/resources/chatgpt',
    label: 'ChatGPT',
    eyebrow: 'OpenAI · 代购代充',
    desc: '土耳其低价区、Plus、Pro，代充成品号均有，最低 ¥68/月。',
    price: '¥68 起',
    badge: '最低价',
    gradient: 'from-orange-500/10 to-amber-500/5',
    border: 'border-orange-200/60',
    accent: 'text-orange-600',
    accentBg: 'bg-orange-500/10',
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0L4.155 14.4A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.843-3.371 2.019-1.168a.076.076 0 0 1 .071 0l4.663 2.692a4.496 4.496 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.234-.58zm2.019-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.664-2.691a4.504 4.504 0 0 1 6.683 4.668zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.504 4.504 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
      </svg>
    ),
  },
  {
    href: '/resources/claude',
    label: 'Claude',
    eyebrow: 'Anthropic · 代购代充',
    desc: 'Claude Pro / Max，代充或成品号，Research、Code、Cowork 全功能。',
    price: '¥168 起',
    badge: '热门',
    gradient: 'from-violet-500/10 to-purple-500/5',
    border: 'border-violet-200/60',
    accent: 'text-violet-600',
    accentBg: 'bg-violet-500/10',
    logo: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
        <path d="M17.304 1.01h-1.146l-3.67 10.102h-1.03L7.788 1.01H6.646L2.837 11.944H1.01v1.112h5.002v-1.112H4.076l1.27-3.496h4.778l.718 1.976-1.197 3.295-1.073 2.954 1.073.39L17.304 1.01zm-10.48 7.326L8.972 3.11l2.15 5.226H6.824zm9.49 5.217c-.647 0-1.237.234-1.692.617l-.453-1.246h-1.047v9.066h1.134v-3.42c.455.384 1.045.617 1.692.617 1.46 0 2.647-1.188 2.647-2.817s-1.188-2.647-2.647-2.817zm-.198 4.495c-.895 0-1.622-.727-1.622-1.622v-.236c0-.895.727-1.622 1.622-1.622s1.622.727 1.622 1.622v.236c0 .895-.727 1.622-1.622 1.622z"/>
      </svg>
    ),
  },
  {
    href: '/resources/accounts',
    label: '海外账号',
    eyebrow: 'Overseas Accounts · 注册代办',
    desc: 'Gmail、Twitter、Telegram、Instagram，付款后 24h 内发送账号密码。',
    price: '¥18 起',
    badge: '即买即用',
    gradient: 'from-sky-500/10 to-blue-500/5',
    border: 'border-sky-200/60',
    accent: 'text-sky-600',
    accentBg: 'bg-sky-500/10',
    logo: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    href: '/resources/digital',
    label: '数字资源',
    eyebrow: 'Digital Resources · 网盘资源',
    desc: '精选电子书合集与高清影视资源，付款后即发网盘直链，长期有效。',
    price: '¥19.9 起',
    badge: '持续更新',
    gradient: 'from-emerald-500/10 to-teal-500/5',
    border: 'border-emerald-200/60',
    accent: 'text-emerald-600',
    accentBg: 'bg-emerald-500/10',
    logo: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
  },
];

export default function ResourcesLandingPage() {
  return (
    <div className="min-h-screen px-4 py-20 pb-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-12">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.62, ease: APPLE_EASE_SOFT }}
          className="space-y-4"
        >
          <Badge tone="info" variant="soft" className="w-fit gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" />
            Shop
          </Badge>
          <div className="max-w-2xl space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              商店
            </h1>
            <p className="text-sm leading-7 text-ink-secondary sm:text-base">
              AI 订阅代购、海外账号注册、数字资源。人工处理，付款后 24 小时内交付。
            </p>
          </div>
        </motion.div>

        {/* Category grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.48, ease: APPLE_EASE_SOFT }}
            >
              <Link
                href={cat.href}
                className={`group flex flex-col overflow-hidden rounded-3xl border bg-linear-to-br p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${cat.border} ${cat.gradient} bg-(--surface-raised)`}
              >
                {/* Top row: logo + badge */}
                <div className="flex items-start justify-between">
                  <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${cat.accentBg} ${cat.accent}`}>
                    {cat.logo}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${cat.accentBg} ${cat.accent}`}>
                    {cat.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="mt-5 flex-1">
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${cat.accent} mb-1`}>
                    {cat.eyebrow}
                  </p>
                  <h2 className="text-2xl font-bold text-ink">{cat.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-ink-secondary">{cat.desc}</p>
                </div>

                {/* Footer: price + arrow */}
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-ink-muted uppercase tracking-wider">起售价格</p>
                    <p className={`text-xl font-bold ${cat.accent}`}>{cat.price}</p>
                  </div>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-all group-hover:translate-x-0.5 ${cat.accentBg} ${cat.accent}`}>
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom assurance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-8 border-t border-line pt-8 text-sm text-ink-muted"
        >
          <span>官方正规渠道</span>
          <span className="text-line">·</span>
          <span>24 小时内人工交付</span>
          <span className="text-line">·</span>
          <span>售后问题可联系处理</span>
          <span className="text-line">·</span>
          <span>微信 / 支付宝付款</span>
        </motion.div>

      </div>
    </div>
  );
}
