import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminSession } from '@/lib/auth-server';

const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

// PUT /api/shop/digital/[id] — admin updates
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminSession(req)) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const allowed = ['title', 'description', 'type', 'price', 'original_price', 'cover_url', 'netdisk_type', 'netdisk_url', 'netdisk_password', 'is_active', 'tags', 'sort_order'];
  const update: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) update[k] = body[k];

  const { error } = await supabaseAdmin().from('digital_products').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/shop/digital/[id] — admin deletes (soft: set is_active=false)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdminSession(req)) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const { id } = await params;
  const { error } = await supabaseAdmin()
    .from('digital_products')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// POST /api/shop/digital/[id] — purchase: create order and return link
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { buyerContact, paymentMethod, buyerNote } = body;

  if (!buyerContact?.trim()) {
    return NextResponse.json({ error: '请填写联系方式' }, { status: 400 });
  }

  const sb = supabaseAdmin();

  // Fetch product (with link)
  const { data: product, error: pErr } = await sb
    .from('digital_products')
    .select('id, title, price, netdisk_type, netdisk_url, netdisk_password, is_active')
    .eq('id', id)
    .single();

  if (pErr || !product) return NextResponse.json({ error: '商品不存在' }, { status: 404 });
  if (!product.is_active) return NextResponse.json({ error: '商品已下架' }, { status: 410 });

  // Create order in resource_orders
  const orderNumber = `DG${Date.now().toString(36).toUpperCase()}`;
  const amountCents = Math.round(product.price * 100);

  const { data: order, error: oErr } = await sb
    .from('resource_orders')
    .insert({
      order_number: orderNumber,
      product_id: id,
      product_title: product.title,
      product_category: '数字资源',
      amount_cents: amountCents,
      payment_method: paymentMethod || 'wechat',
      buyer_contact: buyerContact,
      buyer_note: buyerNote || '',
      status: 'pending',
    })
    .select('id, order_number, amount_cents, status')
    .single();

  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });

  return NextResponse.json({
    order,
    netdisk_type: product.netdisk_type,
    netdisk_url: product.netdisk_url,
    netdisk_password: product.netdisk_password,
  });
}
