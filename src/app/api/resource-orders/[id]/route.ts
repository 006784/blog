import { NextRequest, NextResponse } from 'next/server';
import { z } from '@/lib/api';
import { requireAdminSession } from '@/lib/auth-server';
import { updateResourceOrder } from '@/lib/resource-orders';

export const dynamic = 'force-dynamic';

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'paid', 'delivered', 'cancelled', 'refunded']).optional(),
  delivery_url: z.string().trim().max(1000).nullable().optional(),
  delivery_code: z.string().trim().max(100).nullable().optional(),
  admin_note: z.string().trim().max(1000).nullable().optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!await requireAdminSession(request)) {
    return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = updateOrderSchema.parse(await request.json());
    const order = await updateResourceOrder(id, body);
    return NextResponse.json({ success: true, order });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues.map((issue) => issue.message).join('；')
      : error instanceof Error
        ? error.message
        : '更新订单失败';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
