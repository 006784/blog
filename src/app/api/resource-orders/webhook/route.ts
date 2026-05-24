import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from '@/lib/api';
import { markResourceOrderPaid } from '@/lib/resource-orders';

export const dynamic = 'force-dynamic';

const webhookSchema = z.object({
  orderNumber: z.string().min(1),
  providerTradeNo: z.string().optional(),
  paidAmountCents: z.number().int().positive().optional(),
  paidAt: z.string().optional(),
  event: z.string().default('payment.succeeded'),
});

function verifySignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const received = signature.replace(/^sha256=/, '');
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export async function POST(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider') || 'manual';
  const rawBody = await request.text();

  if (!verifySignature(rawBody, request.headers.get('x-resource-payment-signature'))) {
    return NextResponse.json({ success: false, error: '支付回调签名无效' }, { status: 401 });
  }

  try {
    const payload = webhookSchema.parse(JSON.parse(rawBody));
    if (payload.event !== 'payment.succeeded') {
      return NextResponse.json({ success: true, ignored: true });
    }

    const order = await markResourceOrderPaid({
      orderNumber: payload.orderNumber,
      paymentProvider: provider,
      providerTradeNo: payload.providerTradeNo,
      paidAmountCents: payload.paidAmountCents,
      paidAt: payload.paidAt,
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues.map((issue) => issue.message).join('；')
      : error instanceof Error
        ? error.message
        : '处理支付回调失败';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
