'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { APPLE_EASE_SOFT } from '@/components/Animations';
import { Badge } from '@/components/ui/Badge';
import { useShop } from '../_shop/ShopProvider';
import { aiRechargeServices } from '../_shop/data';

const claudeCards = aiRechargeServices.filter(s => s.service === 'claude');

const CLAUDE_LOGO = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="res-ai-card__logo-icon">
    <path d="M17.304 1.01h-1.146l-3.67 10.102h-1.03L7.788 1.01H6.646L2.837 11.944H1.01v1.112h5.002v-1.112H4.076l1.27-3.496h4.778l.718 1.976-1.197 3.295-1.073 2.954 1.073.39L17.304 1.01zm-10.48 7.326L8.972 3.11l2.15 5.226H6.824zm9.49 5.217c-.647 0-1.237.234-1.692.617l-.453-1.246h-1.047v9.066h1.134v-3.42c.455.384 1.045.617 1.692.617 1.46 0 2.647-1.188 2.647-2.817s-1.188-2.647-2.647-2.817zm-.198 4.495c-.895 0-1.622-.727-1.622-1.622v-.236c0-.895.727-1.622 1.622-1.622s1.622.727 1.622 1.622v.236c0 .895-.727 1.622-1.622 1.622z"/>
  </svg>
);

export default function ClaudePage() {
  const { openAiFlow, addToCart } = useShop();

  return (
    <div className="min-h-screen px-4 py-20 pb-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">

        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: APPLE_EASE_SOFT }}
          className="flex items-center gap-2 text-sm text-ink-muted"
        >
          <Link href="/resources" className="hover:text-ink transition-colors">商店</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-ink">Claude</span>
        </motion.div>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: APPLE_EASE_SOFT }}
          className="space-y-3"
        >
          <Badge variant="soft" className="w-fit gap-1.5" style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.2)' }}>
            {CLAUDE_LOGO}
            Anthropic · 代购代充
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Claude</h1>
          <p className="max-w-xl text-sm leading-7 text-ink-secondary">
            Claude Pro / Max 代充或成品号，Research 深度研究、Claude Code 编程智能体、Cowork 协作全部解锁，Session Token 代充无需共享账号。
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {claudeCards.map((svc, index) => (
            <motion.article
              key={svc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.48, ease: APPLE_EASE_SOFT }}
            >
              <div className={`res-ai-card res-ai-card--${svc.service}`}>
                <div className="res-ai-card__bar" />
                <div className="res-ai-card__top">
                  <div className={`res-ai-card__logo res-ai-card__logo--${svc.service}`}>
                    {CLAUDE_LOGO}
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

        {/* Token instructions */}
        <div className="rounded-2xl border border-(--border-default) bg-(--surface-raised) p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-ink-muted">代充说明</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: 'Session Token 代充', desc: '代充类套餐需提供 Claude Session Token（在 claude.ai 浏览器 Cookie 中获取），站长代充完成后退出，无需共享账号密码。' },
              { title: '成品号购买', desc: '成品号由站长注册并激活，付款后直接发送完整账号密码，即买即用，无需提供任何个人信息。' },
              { title: '交付时间', desc: '代充类 24 小时内完成；成品号通常 1 小时内交付，最迟不超过 24 小时。' },
              { title: '售后支持', desc: '如遇账号异常、充值未到账等问题，可联系站长处理，提供相应售后支持。' },
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
