import { NextRequest, NextResponse } from 'next/server';
import { z } from '@/lib/api';
import { requireAdminSession } from '@/lib/auth-server';
import {
  createResourceOrder,
  listResourceOrders,
  type ResourceOrderStatus,
  type ResourcePaymentMethod,
} from '@/lib/resource-orders';

export const dynamic = 'force-dynamic';

const createOrderSchema = z.object({
  productId: z.string().min(1),
  resourceId: z.string().optional().nullable(),
  productTitle: z.string().optional(),
  productCategory: z.string().optional(),
  paymentMethod: z.enum(['wechat', 'alipay']),
  buyerContact: z.string().trim().min(2, '请填写联系方式，方便交付资料'),
  buyerNote: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = createOrderSchema.parse(await request.json());
    const order = await createResourceOrder({
      productId: body.productId,
      resourceId: body.resourceId,
      productTitle: body.productTitle,
      productCategory: body.productCategory,
      paymentMethod: body.paymentMethod as ResourcePaymentMethod,
      buyerContact: body.buyerContact,
      buyerNote: body.buyerNote,
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues.map((issue) => issue.message).join('；')
      : error instanceof Error
        ? error.message
        : '创建订单失败';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
  }

  try {
    const status = (request.nextUrl.searchParams.get('status') || 'all') as ResourceOrderStatus | 'all';
    const limit = Number(request.nextUrl.searchParams.get('limit') || 80);
    const orders = await listResourceOrders({ status, limit: Number.isFinite(limit) ? limit : 80 });
    return NextResponse.json({ success: true, orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取订单失败';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
