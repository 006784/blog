'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Star, CheckCircle2, ChevronRight, ShoppingBag,
  Shield, Clock, MessageCircle, ChevronDown,
} from 'lucide-react';
import { APPLE_EASE_SOFT } from '@/components/Animations';
import { Badge } from '@/components/ui/Badge';
import { useShop } from '../_shop/ShopProvider';
import { aiRechargeServices } from '../_shop/data';

const featured = aiRechargeServices.find(s => s.featured && s.service === 'chatgpt')!;
const cards = aiRechargeServices.filter(s => !s.featured && s.service === 'chatgpt');

export default function ChatGPTPage() {
  const { openAiFlow, addToCart } = useShop();

  return (
    <div className="min-h-screen px-4 py-20 pb-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">

        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: APPLE_EASE_SOFT }}
          className="flex items-center gap-2 text-sm text-ink-muted"
        >
          <Link href="/resources" className="hover:text-ink transition-colors">商店</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-ink">ChatGPT</span>
        </motion.div>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: APPLE_EASE_SOFT }}
          className="space-y-3"
        >
          <Badge tone="warning" variant="soft" className="w-fit gap-1.5">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0L4.155 14.4A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.843-3.371 2.019-1.168a.076.076 0 0 1 .071 0l4.663 2.692a4.496 4.496 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.234-.58zm2.019-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.664-2.691a4.504 4.504 0 0 1 6.683 4.668zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.504 4.504 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
            </svg>
            OpenAI · 代购代充
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">ChatGPT</h1>
          <p className="max-w-xl text-sm leading-7 text-ink-secondary">
            土耳其低价区到美区全线，Go / Plus / Pro 均有，代充或成品号自选，Session Token 代充无需共享账号。
          </p>
        </motion.div>

        {/* Featured: Turkey card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: APPLE_EASE_SOFT }}
          className="res-turkey-card-bg relative overflow-hidden rounded-3xl border border-orange-300/50 shadow-(--neu-shadow)"
        >
          <div className="res-turkey-deco pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-[0.06]" />
          <div className="res-turkey-deco pointer-events-none absolute -bottom-12 left-1/3 h-48 w-48 rounded-full opacity-[0.04]" />
          <div className="h-1 w-full bg-linear-to-r from-orange-600/80 via-orange-400 to-orange-300/50" />

          <div className="relative px-6 py-8 lg:px-10 lg:py-10">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge tone="warning" variant="soft" className="gap-1.5 px-3 py-1 text-xs">
                <Star className="h-3 w-3" />
                限时特价
              </Badge>
              <Badge tone="success" variant="soft" className="px-3 py-1 text-xs">省 ¥100+/月</Badge>
              <span className="text-xs text-ink-muted">土耳其官方区域定价 · 功能与美区 Plus 完全相同</span>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <span className="mt-1 shrink-0 text-4xl leading-none">🇹🇷</span>
                  <div>
                    <h2 className="text-2xl font-bold text-ink sm:text-3xl">ChatGPT Plus 土耳其区</h2>
                    <p className="mt-1 text-sm text-ink-secondary">代开通 · 月度订阅 · OpenAI 官方渠道</p>
                  </div>
                </div>

                <p className="max-w-xl text-sm leading-7 text-ink-secondary">
                  土耳其是 OpenAI 官方区域定价国，价格远低于美区。代你完成区域订阅开通，功能与美区 ChatGPT Plus
                  100% 相同，高级模型、Thinking 图像创建、Codex 编码智能体、深度研究一应俱全，无任何阉割。
                </p>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {featured.features.map((f) => (
                    <div key={f} className="res-turkey-feature-item flex items-center gap-2 rounded-xl border border-orange-200/60 px-3 py-2.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                      <span className="text-xs font-medium text-ink">{f}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="res-turkey-price-bar rounded-2xl border border-orange-300/70 px-5 py-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-700/70">土耳其区</p>
                    <p className="mt-1 text-3xl font-bold text-orange-700">¥68</p>
                    <p className="mt-0.5 text-[11px] text-orange-600">/月</p>
                  </div>
                  <span className="text-lg font-light text-ink-muted">vs</span>
                  <div className="rounded-2xl border border-(--border-default) bg-(--surface-raised) px-5 py-3 text-center opacity-50">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted">美区</p>
                    <p className="mt-1 text-3xl font-bold text-ink-muted line-through">¥168</p>
                    <p className="mt-0.5 text-[11px] text-ink-muted">/月</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-300/50 bg-emerald-500/10 px-4 py-2.5">
                    <p className="text-xs font-medium text-emerald-600">每月节省</p>
                    <p className="mt-0.5 text-2xl font-bold text-emerald-600">¥100</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">购买流程</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    {['提供 OpenAI 邮箱', '扫码支付', '代开通订阅', '24h 内到账'].map((step, i) => (
                      <span key={i} className="flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/15 text-xs font-bold text-orange-600">{i + 1}</span>
                        <span className="text-xs text-ink-secondary">{step}</span>
                        {i < 3 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-muted/40" />}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-(--border-default) bg-(--surface-raised) p-5 shadow-(--neu-shadow-sm)">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">立即订阅</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-ink">¥68</span>
                    <span className="text-sm text-ink-muted">/月</span>
                    <span className="ml-1 text-sm text-ink-muted line-through">¥168</span>
                  </div>
                  <p className="mt-0.5 text-xs font-medium text-orange-500">土耳其官方定价，节省约 60%</p>

                  <button type="button" onClick={() => openAiFlow(featured)}
                    className="res-turkey-btn mt-4 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0">
                    立即代充 ChatGPT Plus
                  </button>
                  <button type="button" onClick={() => addToCart(featured.id, featured.plan, featured.priceMonthly)}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-orange-300/60 py-2.5 text-sm font-medium text-orange-700 transition-all hover:bg-orange-50/50">
                    <ShoppingBag className="h-4 w-4" />
                    加入购物车
                  </button>

                  <div className="mt-4 space-y-2.5 border-t border-(--border-default) pt-4">
                    {([
                      [Shield, '官方渠道，正规月度订阅'],
                      [Clock, '24 小时内完成代充'],
                      [MessageCircle, '问题售后可联系处理'],
                    ] as [React.ElementType, string][]).map(([Icon, text]) => (
                      <div key={text} className="flex items-center gap-2 text-xs text-ink-secondary">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-(--border-default) bg-(--surface-raised) p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">常见问题</p>
                  <div className="divide-y divide-(--border-default)">
                    {[
                      ['需要提供密码吗？', '土耳其区代充需要提供 OpenAI 账号邮箱和密码，用于登录并完成区域订阅。代充完成后建议立即修改密码。'],
                      ['功能和美区一样吗？', '完全相同。土耳其区是 OpenAI 官方定价区，ChatGPT 所有功能无任何差异。'],
                      ['到期后如何续费？', '可以到期前联系续费，续费依然享受土耳其区低价，也可自行续订。'],
                    ].map(([q, a]) => (
                      <details key={q} className="group py-3 first:pt-0 last:pb-0">
                        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-ink select-none">
                          <span>{q}</span>
                          <ChevronDown className="h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180" />
                        </summary>
                        <p className="mt-2 text-xs leading-5 text-ink-secondary">{a}</p>
                      </details>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Other ChatGPT cards */}
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">更多套餐</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((svc, index) => (
              <motion.article
                key={svc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07, duration: 0.45, ease: APPLE_EASE_SOFT }}
              >
                <div className={`res-ai-card res-ai-card--${svc.service}`}>
                  <div className="res-ai-card__bar" />
                  <div className="res-ai-card__top">
                    <div className={`res-ai-card__logo res-ai-card__logo--${svc.service}`}>
                      <svg viewBox="0 0 24 24" fill="currentColor" className="res-ai-card__logo-icon">
                        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0L4.155 14.4A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.843-3.371 2.019-1.168a.076.076 0 0 1 .071 0l4.663 2.692a4.496 4.496 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.234-.58zm2.019-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.664-2.691a4.504 4.504 0 0 1 6.683 4.668zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.504 4.504 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
                      </svg>
                    </div>
                    <div className="res-ai-card__meta">
                      <h3 className="res-ai-card__plan">{svc.plan}</h3>
                      {svc.badge && <span className="res-ai-card__badge">{svc.badge}</span>}
                    </div>
                  </div>
                  <p className="res-ai-card__desc">{svc.desc}</p>
                  <ul className="res-ai-card__features">
                    {svc.features.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  <div className="res-ai-card__foot">
                    <div>
                      <p className="res-ai-card__price-note">{svc.priceNote}</p>
                      <p className="res-ai-card__price">¥ {svc.priceMonthly.toFixed(0)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button type="button" className="res-ai-card__btn" onClick={() => openAiFlow(svc)}>
                        {svc.isReadyMade ? '立即购买' : '立即代充'}
                      </button>
                      <button type="button" className="res-ai-card__btn--ghost" onClick={() => addToCart(svc.id, svc.plan, svc.priceMonthly)}>
                        <ShoppingBag className="h-3.5 w-3.5" />
                        加入购物车
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
