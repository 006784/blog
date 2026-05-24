'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  ClipboardList,
  ExternalLink,
  Loader2,
  PackageCheck,
  RefreshCw,
  Search,
  Shield,
  WalletCards,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAdmin } from '@/components/AdminProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { StatePanel } from '@/components/ui/StatePanel';

type OrderStatus = 'pending' | 'paid' | 'delivered' | 'cancelled' | 'refunded';

interface ResourceOrder {
  id: string;
  order_number: string;
  product_title: string;
  product_category?: string | null;
  amount_cents: number;
  currency: string;
  payment_method: 'wechat' | 'alipay';
  status: OrderStatus;
  buyer_contact: string;
  buyer_note?: string | null;
  admin_note?: string | null;
  delivery_url?: string | null;
  delivery_code?: string | null;
  provider_trade_no?: string | null;
  paid_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
}

const statusLabels: Record<OrderStatus, string> = {
  pending: '待付款',
  paid: '已付款',
  delivered: '已交付',
  cancelled: '已取消',
  refunded: '已退款',
};

const statusTones: Record<OrderStatus, 'info' | 'success' | 'warning' | 'error' | 'default'> = {
  pending: 'warning',
  paid: 'info',
  delivered: 'success',
  cancelled: 'default',
  refunded: 'error',
};

function formatMoney(cents: number) {
  return `￥${(cents / 100).toFixed(2)}`;
}

function formatDate(value?: string | null) {
  if (!value) return '未记录';
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ResourceOrdersAdminPage() {
  const { isAdmin, loading: authLoading } = useAdmin();
  const router = useRouter();
  const [orders, setOrders] = useState<ResourceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/resource-orders?status=${statusFilter}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '加载订单失败');
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载订单失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace('/admin/login?redirect=/admin/resource-orders');
      return;
    }
    void fetchOrders();
  }, [authLoading, fetchOrders, isAdmin, router]);

  async function updateOrder(id: string, patch: Partial<ResourceOrder>) {
    try {
      setSavingId(id);
      const res = await fetch(`/api/resource-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '更新失败');
      setOrders((current) => current.map((order) => order.id === id ? data.order : order));
    } finally {
      setSavingId(null);
    }
  }

  const filteredOrders = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter((order) =>
      [
        order.order_number,
        order.product_title,
        order.buyer_contact,
        order.buyer_note || '',
        order.provider_trade_no || '',
      ].some((value) => value.toLowerCase().includes(keyword))
    );
  }, [orders, query]);

  const stats = {
    pending: orders.filter((order) => order.status === 'pending').length,
    paid: orders.filter((order) => order.status === 'paid').length,
    delivered: orders.filter((order) => order.status === 'delivered').length,
    revenue: orders
      .filter((order) => order.status === 'paid' || order.status === 'delivered')
      .reduce((sum, order) => sum + order.amount_cents, 0),
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen px-6 py-20">
        <StatePanel
          tone="loading"
          title={authLoading ? '正在验证管理员身份' : '正在跳转登录页'}
          description="订单后台会在身份确认后打开。"
          icon={<Shield className="h-6 w-6" />}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <Badge variant="soft" tone="info" className="mb-3 w-fit gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" />
                Resource Orders
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">资源订单管理</h1>
              <p className="mt-2 text-sm text-neutral-500">查看付款状态、填写交付链接，处理扫码支付与回调更新。</p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => void fetchOrders()}>
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ['待付款', stats.pending, WalletCards],
            ['已付款', stats.paid, Check],
            ['已交付', stats.delivered, PackageCheck],
            ['收入', formatMoney(stats.revenue), ClipboardList],
          ] as Array<[string, string | number, LucideIcon]>).map(([label, value, Icon]) => (
            <Card key={label as string} variant="glass" className="rounded-2xl">
              <Icon className="mb-3 h-5 w-5 text-(--color-primary-600)" />
              <div className="text-2xl font-semibold text-neutral-900">{value}</div>
              <p className="mt-1 text-sm text-neutral-500">{label}</p>
            </Card>
          ))}
        </div>

        <Card variant="glass" className="rounded-2xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索订单号、联系方式、商品名..."
                className="pl-11"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'pending', 'paid', 'delivered', 'cancelled', 'refunded'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full border px-3 py-2 text-sm transition ${
                    statusFilter === status
                      ? 'border-(--color-primary-500) bg-(--color-primary-500) text-white'
                      : 'border-(--border-default) bg-(--surface-base) text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {status === 'all' ? '全部' : statusLabels[status]}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {loading ? (
          <StatePanel
            tone="loading"
            title="正在加载订单"
            description="稍等一下，正在同步资源商店订单。"
            icon={<Loader2 className="h-6 w-6 animate-spin" />}
          />
        ) : error ? (
          <StatePanel
            tone="error"
            title="订单加载失败"
            description={error}
            action={<Button onClick={() => void fetchOrders()}>重试</Button>}
          />
        ) : filteredOrders.length === 0 ? (
          <StatePanel
            tone="empty"
            title="还没有订单"
            description="用户在资源页创建订单后，这里会显示付款与交付状态。"
          />
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <Card key={order.id} variant="glass" className="rounded-2xl">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={statusTones[order.status]} variant="soft">{statusLabels[order.status]}</Badge>
                      <span className="font-mono text-sm text-neutral-500">{order.order_number}</span>
                      <span className="text-sm text-neutral-400">{formatDate(order.created_at)}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-neutral-900">{order.product_title}</h2>
                      <p className="mt-1 text-sm text-neutral-500">
                        {order.product_category || '资源包'} · {order.payment_method === 'wechat' ? '微信' : '支付宝'} · {formatMoney(order.amount_cents)}
                      </p>
                    </div>
                    <div className="grid gap-2 rounded-2xl border border-(--border-default) bg-(--surface-base) p-4 text-sm text-neutral-600">
                      <p>联系方式：<span className="text-neutral-900">{order.buyer_contact}</span></p>
                      {order.buyer_note ? <p>买家备注：{order.buyer_note}</p> : null}
                      {order.provider_trade_no ? <p>支付流水：{order.provider_trade_no}</p> : null}
                      {order.paid_at ? <p>付款时间：{formatDate(order.paid_at)}</p> : null}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <select
                      value={order.status}
                      onChange={(event) => void updateOrder(order.id, { status: event.target.value as OrderStatus })}
                      disabled={savingId === order.id}
                      className="w-full rounded-xl border border-(--border-default) bg-(--surface-raised) px-3 py-2 text-sm outline-none"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <Input
                      defaultValue={order.delivery_url || ''}
                      placeholder="网盘链接"
                      onBlur={(event) => void updateOrder(order.id, { delivery_url: event.target.value })}
                    />
                    <Input
                      defaultValue={order.delivery_code || ''}
                      placeholder="提取码 / 访问码"
                      onBlur={(event) => void updateOrder(order.id, { delivery_code: event.target.value })}
                    />
                    <Input
                      defaultValue={order.admin_note || ''}
                      placeholder="内部备注"
                      onBlur={(event) => void updateOrder(order.id, { admin_note: event.target.value })}
                    />
                    {order.delivery_url ? (
                      <a
                        href={order.delivery_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-(--color-primary-600)"
                      >
                        打开交付链接
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
