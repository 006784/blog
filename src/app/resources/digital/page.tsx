'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { APPLE_EASE_SOFT } from '@/components/Animations';
import { Badge } from '@/components/ui/Badge';
import { useShop } from '../_shop/ShopProvider';
import { digitalItems } from '../_shop/data';
import type { ResourceProduct } from '../_shop/types';

function toProduct(item: typeof digitalItems[0]): ResourceProduct {
  return {
    id: item.id,
    title: item.title,
    description: item.desc,
    category: item.type === 'ebook' ? '电子书' : '影视资源',
    price: item.price,
    originalPrice: item.originalPrice,
    includes: item.includes,
    tags: item.tags,
    updateLabel: item.badge || '数字资源',
    delivery: item.delivery,
  };
}

export default function DigitalPage() {
  const { openCheckout } = useShop();

  return (
    <div className="min-h-screen px-4 py-20 pb-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-10">

        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: APPLE_EASE_SOFT }}
          className="flex items-center gap-2 text-sm text-ink-muted"
        >
          <Link href="/resources" className="hover:text-ink transition-colors">商店</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-ink">数字资源</span>
        </motion.div>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: APPLE_EASE_SOFT }}
          className="space-y-3"
        >
          <Badge tone="success" variant="soft" className="w-fit">
            Digital Resources · 网盘资源
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">数字资源</h1>
          <p className="max-w-xl text-sm leading-7 text-ink-secondary">
            精选电子书合集与高清影视资源，付款后即发网盘直链，长期有效，手机电脑均可使用。
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-5 md:grid-cols-2">
          {digitalItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.48, ease: APPLE_EASE_SOFT }}
              className="overflow-hidden rounded-2xl border border-line bg-(--surface-raised) shadow-(--shadow-sm) transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-md)"
            >
              <div className={`h-1.5 res-digital-bar--${item.type}`} />
              <div className="p-6">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold res-digital-badge--${item.type}`}>
                      {item.type === 'ebook' ? '电子书' : '影视资源'}
                    </span>
                    <h2 className="mt-2 text-lg font-bold text-ink">{item.title}</h2>
                  </div>
                  {item.badge && (
                    <span className="shrink-0 rounded-full bg-(--surface-overlay) px-2.5 py-0.5 text-[11px] font-medium text-gold">
                      {item.badge}
                    </span>
                  )}
                </div>

                <p className="mb-4 text-sm leading-6 text-ink-secondary">{item.desc}</p>

                <div className="mb-5 grid grid-cols-2 gap-2">
                  {item.includes.map((inc) => (
                    <div key={inc} className="flex items-center gap-1.5 text-xs text-ink">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-gold" />
                      {inc}
                    </div>
                  ))}
                </div>

                <div className="flex items-end justify-between border-t border-line pt-4">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-ink">¥{item.price}</span>
                      {item.originalPrice && (
                        <span className="text-sm text-ink-muted line-through">¥{item.originalPrice}</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">{item.delivery}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openCheckout(toProduct(item))}
                    className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-all hover:opacity-85 active:scale-95"
                  >
                    立即购买
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-(--border-default) bg-(--surface-raised) p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">购买须知</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: '交付方式', desc: '付款确认后通过你填写的联系方式发送网盘链接，电子书含提取码，影视资源为直链。' },
              { title: '内容说明', desc: '仅收录整理费用。本站不上架侵权内容，所有资源均为公开授权或可合法分享的资料。' },
            ].map(({ title, desc }) => (
              <div key={title} className="rounded-xl border border-(--border-default) bg-(--surface-base) p-4">
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="mt-1.5 text-xs leading-5 text-ink-secondary">{desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
