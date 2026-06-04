'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Minus, Plus,
  Copy, Check, Shield,
  AlertCircle, CheckCircle2,
  ShoppingBag,
  QrCode, LockKeyhole, MessageCircle, Mail,
  ChevronRight, Clock,
} from 'lucide-react';
import {
  APPLE_SPRING_GENTLE,
  modalBackdropVariants,
  modalPanelVariants,
} from '@/components/Animations';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { payQrConfig } from './data';
import type {
  ResourceProduct, AiRechargeService, CartItem,
  PaymentMethod, ShopOrder, ShopNotice, DigitalProduct,
} from './types';

// ── Context ──────────────────────────────────────────────────────────────────

interface ShopContextValue {
  openCheckout: (product: ResourceProduct) => void;
  openAiFlow: (svc: AiRechargeService) => void;
  openDigitalCheckout: (product: DigitalProduct) => void;
  addToCart: (id: string, title: string, price: number) => void;
  setCartOpen: (open: boolean) => void;
  cartCount: number;
  pushNotice: (type: ShopNotice['type'], message: string) => void;
}

const ShopContext = createContext<ShopContextValue | null>(null);

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used inside ShopProvider');
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function ShopProvider({ children }: { children: ReactNode }) {
  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Checkout modal
  const [checkoutProduct, setCheckoutProduct] = useState<ResourceProduct | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [buyerContact, setBuyerContact] = useState('');
  const [buyerNote, setBuyerNote] = useState('');
  const [orderCopied, setOrderCopied] = useState(false);
  const [checkoutOrder, setCheckoutOrder] = useState<ShopOrder | null>(null);
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  // AI flow modal
  const [aiFlow, setAiFlow] = useState<{
    service: AiRechargeService;
    step: 1 | 2;
    email: string;
    accountPassword: string;
    sessionToken: string;
    tokenState: 'idle' | 'valid' | 'invalid';
    tokenMsg: string;
    paymentMethod: PaymentMethod;
    note: string;
    order: ShopOrder | null;
    submitting: boolean;
    copied: boolean;
  } | null>(null);

  // Digital checkout flow
  const [digitalFlow, setDigitalFlow] = useState<{
    product: DigitalProduct;
    contact: string;
    note: string;
    paymentMethod: PaymentMethod;
    submitting: boolean;
    result: {
      order: ShopOrder;
      netdisk_type: string;
      netdisk_url: string;
      netdisk_password: string;
    } | null;
    linkCopied: boolean;
    passCopied: boolean;
  } | null>(null);

  // Notice
  const [notice, setNotice] = useState<ShopNotice | null>(null);

  const pushNotice = useCallback((type: ShopNotice['type'], message: string) => {
    setNotice({ type, message });
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(t);
  }, [notice]);

  // Scroll lock + Escape
  const hasModalOpen = Boolean(checkoutProduct || cartOpen || aiFlow || digitalFlow);
  useEffect(() => {
    if (!hasModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [hasModalOpen]);

  useEffect(() => {
    if (!hasModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (digitalFlow?.result) return;
      if (digitalFlow) { setDigitalFlow(null); return; }
      if (aiFlow) { setAiFlow(null); return; }
      if (cartOpen) { setCartOpen(false); return; }
      if (checkoutProduct) { setCheckoutProduct(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasModalOpen, aiFlow, cartOpen, checkoutProduct, digitalFlow]);

  // ── Cart helpers ──────────────────────────────────────────────
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = useCallback((id: string, title: string, price: number) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === id);
      if (ex) return prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id, title, price, qty: 1 }];
    });
    pushNotice('success', `「${title}」已加入购物车`);
  }, [pushNotice]);

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const updateCartQty = (id: string, qty: number) => {
    if (qty < 1) { removeFromCart(id); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const checkoutCart = () => {
    if (cart.length === 0) return;
    setCartOpen(false);
    openCheckout({
      id: 'cart-order',
      title: cart.length === 1 ? cart[0].title : `购物车结算（${cart.length}件商品）`,
      description: cart.map(i => `${i.title} × ${i.qty}`).join('、'),
      category: '购物车',
      price: cartTotal,
      includes: cart.map(i => `${i.title} × ${i.qty}`),
      tags: ['购物车结算', '人工确认'],
      updateLabel: '当前',
      delivery: '付款确认后分别交付各商品',
    });
  };

  // ── Checkout helpers ──────────────────────────────────────────
  const checkoutOrderId = checkoutOrder?.order_number || '提交后生成';
  const activePaymentQrEnv = paymentMethod === 'wechat'
    ? 'NEXT_PUBLIC_WECHAT_PAY_QR'
    : 'NEXT_PUBLIC_ALIPAY_PAY_QR';

  const openCheckout = (product: ResourceProduct) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setCheckoutProduct(product);
    setPaymentMethod('wechat');
    setBuyerContact('');
    setBuyerNote('');
    setOrderCopied(false);
    setCheckoutOrder(null);
    setOrderSubmitting(false);
  };

  const copyOrderInfo = async (order: ShopOrder) => {
    if (!checkoutProduct) return;
    const text = [
      `订单号：${order.order_number}`,
      `资源：${checkoutProduct.title}`,
      `金额：￥${(order.amount_cents / 100).toFixed(2)}`,
      `支付方式：${paymentMethod === 'wechat' ? '微信' : '支付宝'}`,
      buyerContact ? `联系方式：${buyerContact}` : '',
      buyerNote ? `备注：${buyerNote}` : '',
    ].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setOrderCopied(true);
      pushNotice('success', '订单信息已复制，付款后发给站长核对。');
      window.setTimeout(() => setOrderCopied(false), 2000);
    } catch {
      pushNotice('error', '复制失败，请手动保存订单号。');
    }
  };

  const createOrderAndCopy = async () => {
    if (!checkoutProduct) return;
    if (!buyerContact.trim()) {
      pushNotice('error', '请先填写联系方式，方便付款后交付资料。');
      return;
    }
    try {
      setOrderSubmitting(true);
      const res = await fetch('/api/resource-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: checkoutProduct.id,
          resourceId: null,
          productTitle: checkoutProduct.title,
          productCategory: checkoutProduct.category,
          paymentMethod,
          buyerContact,
          buyerNote,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.order) throw new Error(data.error || '创建订单失败');
      const order = data.order as ShopOrder;
      setCheckoutOrder(order);
      await copyOrderInfo(order);
      pushNotice('success', '订单已保存，付款后把订单信息发给站长核对。');
    } catch (err) {
      pushNotice('error', err instanceof Error ? err.message : '创建订单失败');
    } finally {
      setOrderSubmitting(false);
    }
  };

  // ── AI flow helpers ───────────────────────────────────────────
  const openAiFlow = (svc: AiRechargeService) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setAiFlow({
      service: svc, step: 1,
      email: '', accountPassword: '', sessionToken: '',
      tokenState: 'idle', tokenMsg: '',
      paymentMethod: 'wechat', note: '',
      order: null, submitting: false, copied: false,
    });
  };

  // ── Digital checkout helpers ──────────────────────────────────
  const openDigitalCheckout = (product: DigitalProduct) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setDigitalFlow({
      product, contact: '', note: '',
      paymentMethod: 'wechat', submitting: false,
      result: null, linkCopied: false, passCopied: false,
    });
  };

  const submitDigitalOrder = async () => {
    if (!digitalFlow) return;
    if (!digitalFlow.contact.trim()) { pushNotice('error', '请先填写联系方式'); return; }
    try {
      setDigitalFlow(prev => prev ? { ...prev, submitting: true } : null);
      const res = await fetch(`/api/shop/digital/${digitalFlow.product.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerContact: digitalFlow.contact,
          paymentMethod: digitalFlow.paymentMethod,
          buyerNote: digitalFlow.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '创建订单失败');
      setDigitalFlow(prev => prev ? {
        ...prev, submitting: false,
        result: {
          order: data.order,
          netdisk_type: data.netdisk_type,
          netdisk_url: data.netdisk_url,
          netdisk_password: data.netdisk_password,
        },
      } : null);
    } catch (err) {
      pushNotice('error', err instanceof Error ? err.message : '创建订单失败');
      setDigitalFlow(prev => prev ? { ...prev, submitting: false } : null);
    }
  };

  const copyDigitalLink = async () => {
    if (!digitalFlow?.result) return;
    try {
      await navigator.clipboard.writeText(digitalFlow.result.netdisk_url);
      setDigitalFlow(prev => prev ? { ...prev, linkCopied: true } : null);
      window.setTimeout(() => setDigitalFlow(prev => prev ? { ...prev, linkCopied: false } : null), 2000);
    } catch { pushNotice('error', '复制失败'); }
  };

  const copyDigitalPass = async () => {
    if (!digitalFlow?.result) return;
    try {
      await navigator.clipboard.writeText(digitalFlow.result.netdisk_password);
      setDigitalFlow(prev => prev ? { ...prev, passCopied: true } : null);
      window.setTimeout(() => setDigitalFlow(prev => prev ? { ...prev, passCopied: false } : null), 2000);
    } catch { pushNotice('error', '复制失败'); }
  };

  const validateSessionToken = (token: string): { ok: boolean; msg: string } => {
    if (!token.trim()) return { ok: false, msg: '' };
    const t = token.trim();
    const parts = t.split('.');
    if (parts.length === 3 && parts.every(p => p.length > 0)) {
      try {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          return { ok: false, msg: 'Token 已过期，请重新登录后获取' };
        }
        return { ok: true, msg: '验证通过（Access Token 格式正确）' };
      } catch {
        return { ok: false, msg: '无法解析，请确认是否完整复制' };
      }
    }
    if (t.startsWith('%7B') || t.startsWith('{')) {
      return t.length > 80
        ? { ok: true, msg: '验证通过（Session Cookie 格式）' }
        : { ok: false, msg: '内容太短，请确认是否完整复制' };
    }
    if (t.length > 100 && /^[A-Za-z0-9+/=_%.\-|]+$/.test(t)) {
      return { ok: true, msg: '验证通过' };
    }
    return { ok: false, msg: t.length < 50 ? 'Token 通常超过 100 个字符，请确认是否完整' : '格式不符预期，请确认复制方式' };
  };

  const submitAiOrder = async () => {
    if (!aiFlow) return;
    if (!aiFlow.email.trim()) { pushNotice('error', '请填写联系邮箱'); return; }
    try {
      setAiFlow(prev => prev ? { ...prev, submitting: true } : null);
      const credNote = (() => {
        if (aiFlow.service.credentialType === 'token') return `Session Token: ${aiFlow.sessionToken.slice(0, 16)}...`;
        if (aiFlow.service.credentialType === 'password') return `OpenAI 账号: ${aiFlow.email} / 密码: ${aiFlow.accountPassword}`;
        return '成品号/代注册服务';
      })();
      const res = await fetch('/api/resource-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: aiFlow.service.id,
          resourceId: null,
          productTitle: aiFlow.service.plan,
          productCategory: aiFlow.service.service === 'apple' ? '苹果账号' : 'AI 代充',
          paymentMethod: aiFlow.paymentMethod,
          buyerContact: aiFlow.email,
          buyerNote: [aiFlow.note, credNote].filter(Boolean).join(' | '),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.order) throw new Error(data.error || '创建订单失败');
      const order = data.order as ShopOrder;
      const credLine = (() => {
        if (aiFlow.service.credentialType === 'token') return `Session Token: ${aiFlow.sessionToken}`;
        if (aiFlow.service.credentialType === 'password') return `OpenAI 账号: ${aiFlow.email}\nOpenAI 密码: ${aiFlow.accountPassword}`;
        return '';
      })();
      const text = [
        `订单号：${order.order_number}`,
        `服务：${aiFlow.service.plan}`,
        `金额：￥${(order.amount_cents / 100).toFixed(0)}`,
        `联系方式：${aiFlow.email}`,
        credLine,
        aiFlow.note ? `备注：${aiFlow.note}` : '',
      ].filter(Boolean).join('\n');
      await navigator.clipboard.writeText(text);
      setAiFlow(prev => prev ? { ...prev, order, copied: true, submitting: false } : null);
      pushNotice('success', '订单已创建，信息已复制，请扫码付款后发给站长。');
      window.setTimeout(() => setAiFlow(prev => prev ? { ...prev, copied: false } : null), 2500);
    } catch (err) {
      pushNotice('error', err instanceof Error ? err.message : '创建订单失败');
      setAiFlow(prev => prev ? { ...prev, submitting: false } : null);
    }
  };

  // ── Context value ─────────────────────────────────────────────
  const ctxValue: ShopContextValue = {
    openCheckout, openAiFlow, openDigitalCheckout,
    addToCart, setCartOpen, cartCount, pushNotice,
  };

  return (
    <ShopContext.Provider value={ctxValue}>
      {/* Notice bar */}
      <AnimatePresence>
        {notice && (
          <motion.div
            key="notice"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.32 }}
            className={`fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-2 border px-4 py-2 text-sm backdrop-blur-xl ${
              notice.type === 'success'
                ? 'border-(--gold) bg-(--ink) text-(--paper)'
                : 'border-(--line) bg-(--paper-warm) text-(--ink)'
            }`}
          >
            {notice.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{notice.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {children}

      {/* ── Checkout modal ── */}
      {typeof document !== 'undefined' && checkoutProduct ? createPortal(
        <motion.div
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          className="ios-modal-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pb-28 pt-6 sm:pb-6"
          onPointerDown={(e) => { if (e.target === e.currentTarget) setCheckoutProduct(null); }}
        >
          <motion.div
            variants={modalPanelVariants}
            className="surface-card ios-modal-card max-h-[calc(100dvh-8rem)] w-full max-w-3xl overflow-y-auto p-0 sm:max-h-[calc(100dvh-3rem)]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-(--border-default) bg-(--surface-panel)/95 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-(--surface-overlay)">
                  <ShoppingBag className="h-5 w-5 text-(--color-primary-600)" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">确认下单</h3>
                  <p className="text-xs text-neutral-500">订单号：{checkoutOrderId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutProduct(null)}
                className="ios-button-press rounded-lg p-2 transition-colors hover:bg-black/5"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(18rem,1.05fr)]">
              <div className="space-y-4">
                <div className="rounded-3xl border border-(--border-default) bg-(--surface-base) p-5">
                  <Badge variant="soft" className="w-fit">{checkoutProduct.category}</Badge>
                  <h4 className="mt-4 text-2xl font-semibold leading-snug text-neutral-900">{checkoutProduct.title}</h4>
                  <p className="mt-3 text-sm leading-7 text-neutral-600">{checkoutProduct.description}</p>
                  <div className="mt-5 flex items-baseline gap-2">
                    <strong className="text-4xl font-semibold text-neutral-900">￥{checkoutProduct.price.toFixed(2)}</strong>
                    {checkoutProduct.originalPrice ? (
                      <span className="text-sm text-neutral-400 line-through">￥{checkoutProduct.originalPrice}</span>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-3xl border border-(--border-default) bg-(--surface-base) p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">交付内容</p>
                  <div className="mt-4 grid gap-2">
                    {checkoutProduct.includes.map((item) => (
                      <div key={item} className="flex items-center gap-2 rounded-2xl bg-(--surface-overlay) px-3 py-2 text-sm text-neutral-700">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-(--color-primary-600)" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-(--border-default) bg-(--surface-base) p-5">
                  <div className="flex items-start gap-3">
                    <Shield className="mt-0.5 h-5 w-5 shrink-0 text-(--color-primary-600)" />
                    <p className="text-sm leading-6 text-neutral-600">
                      付款前请确认商品说明。本站不上架侵权内容，所有服务均为人工处理，付款后 24h 内交付。
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-(--border-default) bg-(--surface-base) p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">选择支付方式</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {(['wechat', 'alipay'] as PaymentMethod[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                          paymentMethod === m
                            ? 'border-(--color-primary-500) bg-(--surface-overlay) text-neutral-900'
                            : 'border-(--border-default) bg-transparent text-neutral-500 hover:text-neutral-900'
                        }`}
                      >
                        {m === 'wechat' ? '微信支付' : '支付宝'}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 grid min-h-56 place-items-center rounded-3xl border border-dashed border-(--border-default) bg-(--surface-overlay) p-5 text-center">
                    {payQrConfig[paymentMethod] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={payQrConfig[paymentMethod]}
                        alt={paymentMethod === 'wechat' ? '微信收款码' : '支付宝收款码'}
                        className="h-44 w-44 rounded-2xl bg-white object-contain shadow-(--shadow-sm)"
                      />
                    ) : (
                      <div>
                        <QrCode className="mx-auto h-12 w-12 text-neutral-400" />
                        <p className="mt-3 text-sm font-medium text-neutral-900">
                          {paymentMethod === 'wechat' ? '微信收款码占位' : '支付宝收款码占位'}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-neutral-500">
                          配置 {activePaymentQrEnv} 后显示二维码
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-neutral-500">
                    {checkoutOrder ? '订单已创建，请立即扫码完成付款。' : '先填写联系方式并提交订单，再扫码付款。'}
                  </p>
                </div>

                <div className="rounded-3xl border border-(--border-default) bg-(--surface-base) p-5">
                  <label className="block text-sm font-medium text-neutral-800">联系方式</label>
                  <div className="mt-2 flex items-center gap-2 rounded-2xl border border-(--border-default) bg-(--surface-raised) px-3 py-2">
                    <Mail className="h-4 w-4 text-neutral-400" />
                    <input
                      value={buyerContact}
                      onChange={(e) => setBuyerContact(e.target.value)}
                      placeholder="邮箱 / 微信号 / Telegram"
                      className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-neutral-400"
                    />
                  </div>

                  <label className="mt-4 block text-sm font-medium text-neutral-800">备注</label>
                  <textarea
                    value={buyerNote}
                    onChange={(e) => setBuyerNote(e.target.value)}
                    placeholder="例如：已付款，微信昵称是..."
                    rows={3}
                    className="mt-2 w-full resize-none rounded-2xl border border-(--border-default) bg-(--surface-raised) px-3 py-3 text-sm outline-none placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-(--color-primary-500)"
                  />

                  {checkoutOrder ? (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        <div>
                          <p className="text-sm font-semibold text-emerald-700">订单已创建</p>
                          <p className="mt-0.5 text-xs text-emerald-600">订单号：{checkoutOrder.order_number}</p>
                        </div>
                      </div>
                      <p className="text-xs leading-5 text-neutral-500">
                        扫码付款后把订单号 <strong>{checkoutOrder.order_number}</strong> 发给站长，确认收款后交付内容。
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => copyOrderInfo(checkoutOrder)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 py-2 text-xs font-medium text-neutral-600 transition hover:bg-black/5"
                        >
                          {orderCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          {orderCopied ? '已复制' : '复制订单信息'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckoutProduct(null)}
                          className="flex-1 rounded-xl bg-neutral-900 py-2 text-xs font-semibold text-white transition hover:opacity-85"
                        >
                          完成，关闭
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-2">
                      <Button onClick={createOrderAndCopy} loading={orderSubmitting} className="w-full">
                        <Copy className="h-4 w-4" />
                        创建订单并复制
                      </Button>
                      <p className="text-xs leading-5 text-neutral-500">
                        付款后把订单信息发给站长，确认收款后发送交付内容。
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      ) : null}

      {/* ── Digital checkout modal ── */}
      {typeof document !== 'undefined' && digitalFlow ? createPortal(
        <motion.div
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          className="ios-modal-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pb-28 pt-6 sm:pb-6"
          onPointerDown={(e) => { if (!digitalFlow.result && e.target === e.currentTarget) setDigitalFlow(null); }}
        >
          <motion.div
            variants={modalPanelVariants}
            className="surface-card ios-modal-card w-full max-w-lg overflow-hidden p-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line bg-(--surface-raised) px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-ink">
                  {digitalFlow.result ? '链接已获取' : '购买数字资源'}
                </h3>
                <p className="mt-0.5 text-xs text-ink-muted truncate max-w-xs">
                  {digitalFlow.product.title}
                </p>
              </div>
              {!digitalFlow.result && (
                <button type="button" aria-label="关闭"
                  onClick={() => setDigitalFlow(null)}
                  className="rounded-lg p-2 text-ink-muted hover:bg-black/5 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="max-h-[75dvh] overflow-y-auto">
              {digitalFlow.result ? (
                /* ─── Result: link revealed ─── */
                <div className="space-y-4 p-5">
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">订单已创建</p>
                      <p className="text-xs text-emerald-600">订单号：{digitalFlow.result.order.order_number}</p>
                    </div>
                  </div>

                  {/* Netdisk type badge */}
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      digitalFlow.result.netdisk_type === 'baidu'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-cyan-100 text-cyan-700'
                    }`}>
                      {digitalFlow.result.netdisk_type === 'baidu' ? '百度网盘' : '夸克网盘'}
                    </span>
                    <span className="text-xs text-ink-muted">· {digitalFlow.product.title}</span>
                  </div>

                  {/* Link */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">网盘链接</p>
                    <div className="flex items-center gap-2 rounded-xl border border-line bg-(--surface-raised) px-3 py-2.5">
                      <a
                        href={digitalFlow.result.netdisk_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 flex-1 truncate text-sm text-blue-600 underline underline-offset-2"
                      >
                        {digitalFlow.result.netdisk_url}
                      </a>
                      <button
                        type="button"
                        onClick={copyDigitalLink}
                        className="shrink-0 rounded-lg p-1.5 text-ink-muted hover:bg-black/5 transition-colors"
                        aria-label="复制链接"
                      >
                        {digitalFlow.linkCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password */}
                  {digitalFlow.result.netdisk_password && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">提取码</p>
                      <div className="flex items-center gap-2 rounded-xl border border-line bg-(--surface-raised) px-3 py-2.5">
                        <code className="flex-1 text-sm font-mono font-semibold text-ink tracking-widest">
                          {digitalFlow.result.netdisk_password}
                        </code>
                        <button
                          type="button"
                          onClick={copyDigitalPass}
                          className="shrink-0 rounded-lg p-1.5 text-ink-muted hover:bg-black/5 transition-colors"
                          aria-label="复制提取码"
                        >
                          {digitalFlow.passCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Payment reminder */}
                  <div className="rounded-2xl border border-line bg-(--surface-raised) p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">请完成付款</p>
                    <div className="flex items-center justify-center gap-4">
                      {(['wechat', 'alipay'] as PaymentMethod[]).map((m) => (
                        <button key={m} type="button"
                          onClick={() => setDigitalFlow(prev => prev ? { ...prev, paymentMethod: m } : null)}
                          className={`rounded-xl border px-4 py-2 text-xs font-medium transition ${
                            digitalFlow.paymentMethod === m
                              ? 'border-gold bg-gold/10 text-ink'
                              : 'border-line text-ink-muted hover:text-ink'
                          }`}>
                          {m === 'wechat' ? '微信支付' : '支付宝'}
                        </button>
                      ))}
                    </div>
                    <div className="grid place-items-center rounded-xl border border-dashed border-line bg-(--surface-overlay) py-4 px-3">
                      {payQrConfig[digitalFlow.paymentMethod] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={payQrConfig[digitalFlow.paymentMethod]}
                          alt={digitalFlow.paymentMethod === 'wechat' ? '微信收款码' : '支付宝收款码'}
                          className="h-36 w-36 rounded-xl bg-white object-contain shadow-(--shadow-sm)" />
                      ) : (
                        <div className="text-center">
                          <QrCode className="mx-auto h-8 w-8 text-ink-muted" />
                          <p className="mt-2 text-xs text-ink-muted">
                            配置 {digitalFlow.paymentMethod === 'wechat' ? 'NEXT_PUBLIC_WECHAT_PAY_QR' : 'NEXT_PUBLIC_ALIPAY_PAY_QR'} 后显示
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs leading-5 text-ink-secondary">
                      付款后请把订单号 <strong>{digitalFlow.result.order.order_number}</strong> 发给站长确认，谢谢支持。
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDigitalFlow(null)}
                    className="w-full rounded-xl bg-ink py-3 text-sm font-semibold text-paper transition-all hover:opacity-85"
                  >
                    完成
                  </button>
                </div>
              ) : (
                /* ─── Form: before purchase ─── */
                <div className="space-y-4 p-5">
                  {/* Product summary */}
                  <div className="rounded-2xl border border-line bg-(--surface-raised) p-4 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        digitalFlow.product.type === 'ebook'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {digitalFlow.product.type === 'ebook' ? '电子书' : '影视资源'}
                      </span>
                      <h4 className="mt-2 text-base font-semibold text-ink leading-snug">
                        {digitalFlow.product.title}
                      </h4>
                      <p className="mt-1 text-xs leading-5 text-ink-secondary line-clamp-2">
                        {digitalFlow.product.description}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-2xl font-bold text-ink">¥{digitalFlow.product.price.toFixed(0)}</div>
                      {digitalFlow.product.original_price && (
                        <div className="text-xs text-ink-muted line-through">¥{digitalFlow.product.original_price}</div>
                      )}
                    </div>
                  </div>

                  {/* Netdisk type */}
                  <div className="flex items-center gap-2 text-xs text-ink-muted">
                    <span className={`rounded-full px-2.5 py-1 font-semibold ${
                      digitalFlow.product.netdisk_type === 'baidu'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-cyan-100 text-cyan-700'
                    }`}>
                      {digitalFlow.product.netdisk_type === 'baidu' ? '百度网盘' : '夸克网盘'}
                    </span>
                    <span>· 下单后立即获取直链</span>
                  </div>

                  {/* Contact */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-ink">
                      联系方式 <span className="text-red-400">*</span>
                    </label>
                    <div className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 transition-colors ${
                      digitalFlow.contact.trim() ? 'border-emerald-400 bg-emerald-50/50' : 'border-line bg-(--surface-raised)'
                    }`}>
                      <Mail className="h-4 w-4 shrink-0 text-ink-muted" />
                      <input
                        value={digitalFlow.contact}
                        onChange={(e) => setDigitalFlow(prev => prev ? { ...prev, contact: e.target.value } : null)}
                        placeholder="邮箱 / 微信号 / Telegram"
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted"
                      />
                      {digitalFlow.contact.trim() && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                    </div>
                    <p className="text-xs text-ink-muted">用于发送订单确认，不用于其他用途。</p>
                  </div>

                  {/* Note */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-ink-secondary">备注（可选）</label>
                    <textarea
                      value={digitalFlow.note}
                      onChange={(e) => setDigitalFlow(prev => prev ? { ...prev, note: e.target.value } : null)}
                      placeholder="其他说明"
                      rows={2}
                      className="w-full resize-none rounded-xl border border-line bg-(--surface-raised) px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-gold"
                    />
                  </div>

                  {/* Payment method */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-ink">支付方式</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['wechat', 'alipay'] as PaymentMethod[]).map((m) => (
                        <button key={m} type="button"
                          onClick={() => setDigitalFlow(prev => prev ? { ...prev, paymentMethod: m } : null)}
                          className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                            digitalFlow.paymentMethod === m
                              ? 'border-gold bg-gold/10 text-ink'
                              : 'border-line bg-(--surface-raised) text-ink-muted hover:text-ink'
                          }`}>
                          {m === 'wechat' ? '微信支付' : '支付宝'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={submitDigitalOrder}
                    disabled={digitalFlow.submitting}
                    className={`w-full rounded-xl py-3 text-sm font-semibold text-paper transition-all ${
                      digitalFlow.submitting ? 'bg-ink/50 cursor-not-allowed' : 'bg-ink hover:opacity-85 active:scale-[0.98]'
                    }`}
                  >
                    {digitalFlow.submitting ? '处理中…' : '立即获取网盘链接'}
                  </button>
                  <p className="text-xs leading-5 text-ink-muted text-center">
                    获取链接后请扫码完成付款，谢谢支持。
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>,
        document.body
      ) : null}

      {/* ── AI flow modal ── */}
      {typeof document !== 'undefined' && aiFlow ? createPortal(
        <motion.div
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          className="ios-modal-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pb-28 pt-6 sm:pb-6"
          onPointerDown={(e) => { if (e.target === e.currentTarget) setAiFlow(null); }}
        >
          <motion.div
            variants={modalPanelVariants}
            className="surface-card ios-modal-card w-full max-w-lg overflow-hidden p-0"
          >
            {/* Colored header */}
            <div className={`res-ai-flow-header res-ai-flow-header--${aiFlow.service.service}`}>
              <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="res-ai-flow-logo">
                    {aiFlow.service.service === 'chatgpt' ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0L4.155 14.4A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.843-3.371 2.019-1.168a.076.076 0 0 1 .071 0l4.663 2.692a4.496 4.496 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.234-.58zm2.019-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.664-2.691a4.504 4.504 0 0 1 6.683 4.668zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.504 4.504 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
                      </svg>
                    ) : aiFlow.service.service === 'apple' ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
                        <path d="M17.304 1.01h-1.146l-3.67 10.102h-1.03L7.788 1.01H6.646L2.837 11.944H1.01v1.112h5.002v-1.112H4.076l1.27-3.496h4.778l.718 1.976-1.197 3.295-1.073 2.954 1.073.39L17.304 1.01zm-10.48 7.326L8.972 3.11l2.15 5.226H6.824zm9.49 5.217c-.647 0-1.237.234-1.692.617l-.453-1.246h-1.047v9.066h1.134v-3.42c.455.384 1.045.617 1.692.617 1.46 0 2.647-1.188 2.647-2.817s-1.188-2.647-2.647-2.817zm-.198 4.495c-.895 0-1.622-.727-1.622-1.622v-.236c0-.895.727-1.622 1.622-1.622s1.622.727 1.622 1.622v.236c0 .895-.727 1.622-1.622 1.622z"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{aiFlow.service.plan}</h3>
                    <p className="text-xs text-white/70">¥{aiFlow.service.priceMonthly} · {aiFlow.service.priceNote}</p>
                  </div>
                </div>
                <button type="button" aria-label="关闭" onClick={() => setAiFlow(null)}
                  className="rounded-lg p-1.5 text-white/70 hover:bg-white/15 hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex border-t border-white/20">
                {([
                  aiFlow.service.credentialType === 'token' ? '填写邮箱 + Token' : aiFlow.service.isReadyMade ? '填写联系方式' : '填写账号信息',
                  '扫码付款',
                ] as const).map((label, i) => {
                  const stepNum = (i + 1) as 1 | 2;
                  const isActive = aiFlow.step === stepNum;
                  const isDone = aiFlow.step > stepNum;
                  return (
                    <div key={label} className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-xs font-medium ${isActive ? 'bg-white/15 text-white' : isDone ? 'text-white/80' : 'text-white/40'}`}>
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${isDone ? 'bg-white text-emerald-600' : isActive ? 'bg-white/25 text-white' : 'bg-white/10 text-white/40'}`}>
                        {isDone ? <Check className="h-2.5 w-2.5" /> : stepNum}
                      </span>
                      {label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step content */}
            <div className="max-h-[65vh] overflow-y-auto">

              {/* Step 1 */}
              {aiFlow.step === 1 && (
                <div className="space-y-5 p-5">
                  {aiFlow.service.credentialType === 'token' ? (
                    <>
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">如何获取 Session Token</p>
                        <div className="space-y-2.5">
                          {[
                            { n: 1, title: '登录账号', desc: '在电脑浏览器打开 chatgpt.com 或 claude.ai，确认已登录' },
                            { n: 2, title: '打开开发者工具', desc: '按 F12（Windows）或 Command + Option + I（Mac）' },
                            { n: 3, title: '切到 Application 标签', desc: '顶部点「应用程序 / Application」→ 左侧展开「Cookie」→ 点击当前网站域名' },
                            { n: 4, title: '找到并复制 Token', desc: '搜索 __Secure-next-auth.session-token，点击该行，完整复制 Value 栏的内容（很长，务必全选）' },
                          ].map(({ n, title, desc }) => (
                            <div key={n} className="flex gap-3 rounded-xl border border-line bg-(--surface-raised) px-3.5 py-3">
                              <span className="res-ai-flow-step-num shrink-0">{n}</span>
                              <div>
                                <p className="text-sm font-semibold text-ink">{title}</p>
                                <p className="mt-0.5 text-xs leading-5 text-ink-secondary">{desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-ink">
                          需要充值的账号邮箱 <span className="text-red-400">*</span>
                        </label>
                        <div className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 transition-colors ${aiFlow.email.trim() ? 'border-emerald-400 bg-emerald-50/50' : 'border-line bg-(--surface-raised)'}`}>
                          <Mail className="h-4 w-4 shrink-0 text-ink-muted" />
                          <input
                            value={aiFlow.email}
                            onChange={(e) => setAiFlow(prev => prev ? { ...prev, email: e.target.value } : null)}
                            placeholder="your@email.com"
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted"
                          />
                          {aiFlow.email.trim() && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />}
                        </div>
                        <p className="text-xs text-ink-muted">用于核对充值到正确账号，不用于其他用途。</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-ink">
                          Session Token <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={aiFlow.sessionToken}
                          onChange={(e) => {
                            const val = e.target.value;
                            const result = validateSessionToken(val);
                            setAiFlow(prev => prev ? {
                              ...prev,
                              sessionToken: val,
                              tokenState: val.trim() ? (result.ok ? 'valid' : 'invalid') : 'idle',
                              tokenMsg: result.msg,
                            } : null);
                          }}
                          placeholder="粘贴从浏览器 Cookie 复制的完整 Token，通常超过 200 个字符…"
                          rows={4}
                          className={`w-full resize-none rounded-xl border px-3.5 py-3 text-xs font-mono outline-none placeholder:text-ink-muted transition-colors focus-visible:ring-2 focus-visible:ring-gold ${
                            aiFlow.tokenState === 'valid' ? 'border-emerald-400 bg-emerald-50/50' :
                            aiFlow.tokenState === 'invalid' ? 'border-red-400 bg-red-50/30' :
                            'border-line bg-(--surface-raised)'
                          }`}
                        />
                        {aiFlow.tokenState !== 'idle' && (
                          <div className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${
                            aiFlow.tokenState === 'valid' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                          }`}>
                            {aiFlow.tokenState === 'valid'
                              ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                            {aiFlow.tokenMsg}
                          </div>
                        )}
                      </div>
                    </>
                  ) : aiFlow.service.credentialType === 'password' ? (
                    <>
                      <div className="res-ai-flow-info-box res-ai-flow-info-box--orange">
                        <Shield className="res-ai-flow-info-icon" />
                        <div>
                          <p className="font-semibold">需要提供 OpenAI 账号 + 密码</p>
                          <p className="mt-1 text-xs opacity-80">代充完成后立即退出登录，建议操作完成后修改密码。</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-ink">OpenAI 账号邮箱 <span className="text-red-400">*</span></label>
                        <div className="flex items-center gap-2 rounded-xl border border-line bg-(--surface-raised) px-3.5 py-2.5">
                          <Mail className="h-4 w-4 shrink-0 text-ink-muted" />
                          <input
                            value={aiFlow.email}
                            onChange={(e) => setAiFlow(prev => prev ? { ...prev, email: e.target.value } : null)}
                            placeholder="your@email.com"
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-ink">账号密码 <span className="text-red-400">*</span></label>
                        <div className="flex items-center gap-2 rounded-xl border border-line bg-(--surface-raised) px-3.5 py-2.5">
                          <LockKeyhole className="h-4 w-4 shrink-0 text-ink-muted" />
                          <input
                            type="password"
                            value={aiFlow.accountPassword}
                            onChange={(e) => setAiFlow(prev => prev ? { ...prev, accountPassword: e.target.value } : null)}
                            placeholder="你的 OpenAI 账号密码"
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="res-ai-flow-info-box res-ai-flow-info-box--green">
                        <CheckCircle2 className="res-ai-flow-info-icon" />
                        <div>
                          <p className="font-semibold">成品账号，无需提供个人账号信息</p>
                          <p className="mt-1 text-xs opacity-80">付款后站长会将完整账号密码发送给你，留下联系方式即可。</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {aiFlow.service.features.map((f) => (
                          <div key={f} className="flex items-center gap-2.5 rounded-xl border border-line bg-(--surface-raised) px-3.5 py-2.5">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                            <span className="text-sm text-ink">{f}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-ink">联系方式 <span className="text-red-400">*</span></label>
                        <div className="flex items-center gap-2 rounded-xl border border-line bg-(--surface-raised) px-3.5 py-2.5">
                          <Mail className="h-4 w-4 shrink-0 text-ink-muted" />
                          <input
                            value={aiFlow.email}
                            onChange={(e) => setAiFlow(prev => prev ? { ...prev, email: e.target.value } : null)}
                            placeholder="邮箱 / 微信号 / Telegram"
                            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-muted"
                          />
                        </div>
                        <p className="text-xs text-ink-muted">付款后 24h 内通过此方式发送账号密码。</p>
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-ink-secondary">备注（可选）</label>
                    <textarea
                      value={aiFlow.note}
                      onChange={(e) => setAiFlow(prev => prev ? { ...prev, note: e.target.value } : null)}
                      placeholder="其他说明"
                      rows={2}
                      className="w-full resize-none rounded-xl border border-line bg-(--surface-raised) px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-gold"
                    />
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {aiFlow.step === 2 && (
                <div className="space-y-4 p-5">
                  <div className="rounded-2xl border border-line bg-(--surface-raised) p-4 space-y-2 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted mb-3">订单信息</p>
                    <div className="flex justify-between">
                      <span className="text-ink-secondary">服务</span>
                      <span className="font-medium text-ink">{aiFlow.service.plan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-secondary">金额</span>
                      <span className="text-xl font-bold text-ink">¥{aiFlow.service.priceMonthly}</span>
                    </div>
                    {aiFlow.email && (
                      <div className="flex justify-between gap-4">
                        <span className="shrink-0 text-ink-secondary">{aiFlow.service.isReadyMade ? '联系方式' : '账号邮箱'}</span>
                        <span className="truncate text-right text-ink">{aiFlow.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(['wechat', 'alipay'] as PaymentMethod[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setAiFlow(prev => prev ? { ...prev, paymentMethod: m } : null)}
                        className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                          aiFlow.paymentMethod === m
                            ? 'border-gold bg-gold/10 text-ink'
                            : 'border-line bg-(--surface-raised) text-ink-muted hover:text-ink'
                        }`}
                      >
                        {m === 'wechat' ? '微信支付' : '支付宝'}
                      </button>
                    ))}
                  </div>

                  <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-line bg-(--surface-raised) p-4 text-center">
                    {payQrConfig[aiFlow.paymentMethod] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={payQrConfig[aiFlow.paymentMethod]}
                        alt={aiFlow.paymentMethod === 'wechat' ? '微信收款码' : '支付宝收款码'}
                        className="h-40 w-40 rounded-2xl bg-white object-contain shadow-(--shadow-sm)"
                      />
                    ) : (
                      <div>
                        <QrCode className="mx-auto h-10 w-10 text-ink-muted" />
                        <p className="mt-2 text-sm font-medium text-ink">
                          {aiFlow.paymentMethod === 'wechat' ? '微信收款码' : '支付宝收款码'}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">
                          配置 {aiFlow.paymentMethod === 'wechat' ? 'NEXT_PUBLIC_WECHAT_PAY_QR' : 'NEXT_PUBLIC_ALIPAY_PAY_QR'} 后显示
                        </p>
                      </div>
                    )}
                  </div>

                  {aiFlow.order && (
                    <div className="res-ai-flow-info-box res-ai-flow-info-box--green">
                      <CheckCircle2 className="res-ai-flow-info-icon" />
                      <div>
                        <p className="font-semibold">订单已创建</p>
                        <p className="mt-0.5 text-xs opacity-80">订单号：{aiFlow.order.order_number}，信息已复制，扫码付款后发给站长核对。</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-3 border-t border-line bg-(--surface-raised) px-5 py-4">
              {aiFlow.step === 2 ? (
                <button
                  type="button"
                  onClick={() => setAiFlow(prev => prev ? { ...prev, step: 1 } : null)}
                  className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-secondary hover:bg-paper transition-colors"
                >
                  上一步
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAiFlow(null)}
                  className="rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-secondary hover:bg-paper transition-colors"
                >
                  取消
                </button>
              )}
              <div className="flex-1" />
              {aiFlow.step === 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    const { service, email, tokenState, accountPassword } = aiFlow;
                    if (!email.trim()) { pushNotice('error', service.credentialType === 'none' ? '请填写联系方式' : '请填写账号邮箱'); return; }
                    if (service.credentialType === 'token' && tokenState !== 'valid') { pushNotice('error', 'Session Token 格式不正确，请重新检查'); return; }
                    if (service.credentialType === 'password' && !accountPassword.trim()) { pushNotice('error', '请填写账号密码'); return; }
                    setAiFlow(prev => prev ? { ...prev, step: 2 } : null);
                  }}
                  className="res-ai-flow-next-btn"
                >
                  下一步，去付款
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitAiOrder}
                  disabled={aiFlow.submitting}
                  className={`res-ai-flow-next-btn ${aiFlow.submitting ? 'opacity-60' : ''}`}
                >
                  {aiFlow.submitting ? '提交中…' : aiFlow.order
                    ? (aiFlow.copied ? <><Check className="h-4 w-4" />已复制</> : '重新复制订单')
                    : '确认下单并复制'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>,
        document.body
      ) : null}

      {/* ── Cart floating button ── */}
      <AnimatePresence>
        {cartCount > 0 && !cartOpen && (
          <motion.button
            type="button"
            aria-label={`查看购物车，共 ${cartCount} 件`}
            onClick={() => setCartOpen(true)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={APPLE_SPRING_GENTLE}
            className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper shadow-2xl md:bottom-8"
          >
            <ShoppingBag className="h-6 w-6" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-white">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Cart drawer ── */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-paper shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="h-5 w-5 text-gold" />
                  <h2 className="text-base font-semibold text-ink">购物车</h2>
                  <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold">{cartCount} 件</span>
                </div>
                <button type="button" aria-label="关闭购物车" onClick={() => setCartOpen(false)}
                  className="rounded-lg p-2 text-ink-muted hover:bg-black/5">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-(--surface-base) p-4 space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-line bg-paper p-3 shadow-sm">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">¥{item.price.toFixed(0)} / 件</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button type="button" aria-label="减少数量"
                        onClick={() => updateCartQty(item.id, item.qty - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-ink hover:bg-black/5">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-ink">{item.qty}</span>
                      <button type="button" aria-label="增加数量"
                        onClick={() => updateCartQty(item.id, item.qty + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-ink hover:bg-black/5">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button type="button" aria-label="移除商品"
                      onClick={() => removeFromCart(item.id)}
                      className="rounded-lg p-1.5 text-red-400 hover:bg-red-50">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-line bg-(--surface-raised) p-5 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-ink-secondary">合计</span>
                  <span className="text-2xl font-bold text-ink">¥{cartTotal.toFixed(0)}</span>
                </div>
                <button type="button" onClick={checkoutCart}
                  className="w-full rounded-xl bg-ink py-3.5 text-sm font-semibold text-paper shadow-md transition-all hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0">
                  去结算
                </button>
                <button type="button" onClick={() => setCart([])}
                  className="w-full rounded-xl border border-line py-2 text-xs font-medium text-ink-secondary transition-colors hover:border-ink hover:text-ink">
                  清空购物车
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delivery assurance strip */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-(--surface-panel)/90 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-center gap-6 px-4 py-2.5 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" />官方渠道</span>
          <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />24h 交付</span>
          <span className="flex items-center gap-1.5"><MessageCircle className="h-3 w-3" />售后支持</span>
        </div>
      </div>
    </ShopContext.Provider>
  );
}
