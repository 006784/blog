import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminSession } from '@/lib/auth-server';

const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

// GET /api/shop/digital — public listing, netdisk_url excluded
export async function GET() {
  const { data, error } = await supabaseAdmin()
    .from('digital_products')
    .select('id, title, description, type, price, original_price, cover_url, netdisk_type, tags, sort_order, created_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

// POST /api/shop/digital — admin creates a product
export async function POST(req: NextRequest) {
  if (!await requireAdminSession(req)) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const body = await req.json();
  const { title, description, type, price, original_price, cover_url, netdisk_type, netdisk_url, netdisk_password, tags, sort_order } = body;

  if (!title || !type || !price || !netdisk_type || !netdisk_url) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from('digital_products')
    .insert({
      title, description: description || '',
      type, price, original_price: original_price || null,
      cover_url: cover_url || null,
      netdisk_type, netdisk_url,
      netdisk_password: netdisk_password || '',
      tags: tags || [],
      sort_order: sort_order ?? 0,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
