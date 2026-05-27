'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { APPLE_EASE_SOFT } from '@/components/Animations';
import { Badge } from '@/components/ui/Badge';
import { useShop } from '../_shop/ShopProvider';
import { accountServices, PLATFORM_INITIAL } from '../_shop/data';
import type { ResourceProduct } from '../_shop/types';

function toProduct(svc: typeof accountServices[0]): ResourceProduct {
  return {
    id: svc.id,
    title: svc.name,
    description: svc.desc,
    category: '账号注册',
    price: svc.price,
    originalPrice: svc.originalPrice,
    includes: svc.features,
    tags: [svc.platform, '即买即用'],
    updateLabel: svc.badge || '注册服务',
    delivery: svc.delivery,
  };
}

export default function AccountsPage() {
  const { openCheckout } = useShop();

  return (
    <div className="min-h-screen px-4 py-20 pb-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-10">

        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: APPLE_EASE_SOFT }}
          className="flex items-center gap-2 text-sm text-ink-muted"
        >
          <Link href="/resources" className="hover:text-ink transition-colors">商店</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-ink">海外账号</span>
        </motion.div>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: APPLE_EASE_SOFT }}
          className="space-y-3"
        >
          <Badge tone="info" variant="soft" className="w-fit">
            Overseas Accounts · 注册代办
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">海外账号注册</h1>
          <p className="max-w-xl text-sm leading-7 text-ink-secondary">
            代注册 Gmail、Twitter / X、Telegram、Instagram 等海外平台账号，完整账号密码，付款后 24 小时内发送。
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {accountServices.map((svc, index) => (
            <motion.div
              key={svc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, duration: 0.45, ease: APPLE_EASE_SOFT }}
              className="overflow-hidden rounded-2xl border border-line bg-(--surface-raised) shadow-(--shadow-sm) transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-md)"
            >
              <div className={`h-1.5 res-account-bar--${svc.platform}`} />
              <div className="flex flex-col p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-bold text-white res-account-logo--${svc.platform}`}>
                    {PLATFORM_INITIAL[svc.platform]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink leading-tight">{svc.name}</p>
                    {svc.badge && (
                      <span className="mt-1 inline-block rounded-full bg-(--surface-overlay) px-2 py-0.5 text-[10px] font-medium text-gold">
                        {svc.badge}
                      </span>
                    )}
                  </div>
                </div>

                <p className="mb-4 text-xs leading-5 text-ink-secondary">{svc.desc}</p>

                <ul className="mb-5 space-y-1.5">
                  {svc.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-ink">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-gold" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
                  <div>
                    <span className="text-xl font-bold text-ink">¥{svc.price}</span>
                    {svc.originalPrice && (
                      <span className="ml-1 text-xs text-ink-muted line-through">¥{svc.originalPrice}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openCheckout(toProduct(svc))}
                    className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-paper transition-all hover:opacity-85 active:scale-95"
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
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: '交付方式', desc: '付款确认后通过你填写的联系方式（邮箱 / 微信 / Telegram）发送账号密码。' },
              { title: '账号用途', desc: '账号仅供正常使用，请勿用于批量注册、刷量等违反平台条款的行为。' },
              { title: '售后说明', desc: '账号在交付后 3 天内如无法正常登录，可联系处理。超出使用范围引发的封号不在售后范围内。' },
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
