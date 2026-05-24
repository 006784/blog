import { supabaseAdmin } from '@/lib/supabase';

export type ResourceOrderStatus = 'pending' | 'paid' | 'delivered' | 'cancelled' | 'refunded';
export type ResourcePaymentMethod = 'wechat' | 'alipay';

export interface ResourceOrder {
  id: string;
  order_number: string;
  product_id: string;
  resource_id?: string | null;
  product_title: string;
  product_category?: string | null;
  amount_cents: number;
  currency: string;
  payment_method: ResourcePaymentMethod;
  status: ResourceOrderStatus;
  buyer_contact?: string | null;
  buyer_note?: string | null;
  admin_note?: string | null;
  delivery_url?: string | null;
  delivery_code?: string | null;
  payment_provider?: string | null;
  provider_trade_no?: string | null;
  paid_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
  updated_at: string;
}

type ResourceRecord = {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  tags?: string[] | null;
  is_public: boolean;
};

const SAMPLE_PRODUCT_PRICES: Record<string, { title: string; category: string; amountCents: number }> = {
  'starter-curation': { title: '效率工具资料包', category: '工具', amountCents: 1990 },
  'learning-pack': { title: '学习资源索引包', category: '学习', amountCents: 2990 },
};

function parsePriceCentsFromTags(tags?: string[] | null): number {
  const priceTag = tags?.find((tag) => /^price[:=]\d+(\.\d+)?$/i.test(tag));
  if (!priceTag) return 1990;
  const price = Number(priceTag.split(/[:=]/)[1]);
  return Number.isFinite(price) && price > 0 ? Math.round(price * 100) : 1990;
}

function buildOrderNumber(): string {
  const date = new Date();
  const stamp = [
    date.getFullYear().toString().slice(-2),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ].join('');
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `LM${stamp}${random}`;
}

async function resolveProduct(input: {
  productId: string;
  resourceId?: string | null;
  productTitle?: string;
  productCategory?: string;
}) {
  if (input.resourceId || /^[0-9a-f-]{32,}$/i.test(input.productId)) {
    const resourceId = input.resourceId || input.productId;
    const { data, error } = await supabaseAdmin
      .from('resources')
      .select('id,name,description,category,tags,is_public')
      .eq('id', resourceId)
      .single();
    const resource = data as ResourceRecord | null;

    if (error || !resource || !resource.is_public) {
      throw new Error('资源商品不存在或未公开');
    }

    return {
      productId: resource.id,
      resourceId: resource.id,
      productTitle: resource.name,
      productCategory: resource.category || '资源包',
      amountCents: parsePriceCentsFromTags(resource.tags),
    };
  }

  const sample = SAMPLE_PRODUCT_PRICES[input.productId];
  if (sample) {
    return {
      productId: input.productId,
      resourceId: null,
      productTitle: sample.title,
      productCategory: sample.category,
      amountCents: sample.amountCents,
    };
  }

  return {
    productId: input.productId,
    resourceId: input.resourceId || null,
    productTitle: input.productTitle?.trim() || '资料包',
    productCategory: input.productCategory?.trim() || '资源包',
    amountCents: 1990,
  };
}

export async function createResourceOrder(input: {
  productId: string;
  resourceId?: string | null;
  productTitle?: string;
  productCategory?: string;
  paymentMethod: ResourcePaymentMethod;
  buyerContact: string;
  buyerNote?: string;
}) {
  const product = await resolveProduct(input);
  const { data, error } = await supabaseAdmin
    .from('resource_orders')
    .insert({
      order_number: buildOrderNumber(),
      product_id: product.productId,
      resource_id: product.resourceId,
      product_title: product.productTitle,
      product_category: product.productCategory,
      amount_cents: product.amountCents,
      payment_method: input.paymentMethod,
      buyer_contact: input.buyerContact.trim(),
      buyer_note: input.buyerNote?.trim() || null,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as ResourceOrder;
}

export async function listResourceOrders(options: {
  status?: ResourceOrderStatus | 'all';
  limit?: number;
}) {
  let query = supabaseAdmin
    .from('resource_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 80);

  if (options.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ResourceOrder[];
}

export async function updateResourceOrder(
  id: string,
  input: Partial<Pick<ResourceOrder, 'status' | 'admin_note' | 'delivery_url' | 'delivery_code'>>
) {
  const patch: Record<string, string | null> = {};
  if (input.status) {
    patch.status = input.status;
    if (input.status === 'delivered') patch.delivered_at = new Date().toISOString();
  }
  if (input.admin_note !== undefined) patch.admin_note = input.admin_note;
  if (input.delivery_url !== undefined) patch.delivery_url = input.delivery_url;
  if (input.delivery_code !== undefined) patch.delivery_code = input.delivery_code;

  const { data, error } = await supabaseAdmin
    .from('resource_orders')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as ResourceOrder;
}

export async function markResourceOrderPaid(input: {
  orderNumber: string;
  paymentProvider: string;
  providerTradeNo?: string;
  paidAmountCents?: number;
  paidAt?: string;
}) {
  const { data, error: lookupError } = await supabaseAdmin
    .from('resource_orders')
    .select('*')
    .eq('order_number', input.orderNumber)
    .single();
  const order = data as ResourceOrder | null;

  if (lookupError || !order) throw new Error('订单不存在');
  if (input.paidAmountCents !== undefined && input.paidAmountCents !== order.amount_cents) {
    throw new Error('支付金额与订单金额不一致');
  }

  const { data: updatedOrder, error } = await supabaseAdmin
    .from('resource_orders')
    .update({
      status: order.status === 'delivered' ? 'delivered' : 'paid',
      payment_provider: input.paymentProvider,
      provider_trade_no: input.providerTradeNo || order.provider_trade_no,
      paid_at: input.paidAt || new Date().toISOString(),
    })
    .eq('id', order.id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return updatedOrder as ResourceOrder;
}
