import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

const SEED_DATA = [
  {
    category: 'hardware',
    name: 'MacBook Pro',
    description: 'Apple M 系列芯片，主力开发机',
    icon_url: 'https://www.apple.com/favicon.ico',
    link: 'https://www.apple.com/macbook-pro/',
    sort_order: 1,
  },
  {
    category: 'software',
    name: 'Arc Browser',
    description: '基于 Chromium 的新一代浏览器，侧边栏设计',
    icon_url: 'https://arc.net/favicon.png',
    link: 'https://arc.net',
    sort_order: 1,
  },
  {
    category: 'dev-tools',
    name: 'VS Code',
    description: '微软出品的轻量级代码编辑器，插件生态丰富',
    icon_url: 'https://code.visualstudio.com/favicon.ico',
    link: 'https://code.visualstudio.com',
    sort_order: 1,
  },
  {
    category: 'services',
    name: 'Supabase',
    description: '开源 Firebase 替代品，PostgreSQL + 实时订阅',
    icon_url: 'https://supabase.com/favicon/favicon-32x32.png',
    link: 'https://supabase.com',
    sort_order: 1,
  },
  {
    category: 'design',
    name: 'Figma',
    description: '浏览器端协作设计工具，原型图与 UI 设计',
    icon_url: 'https://static.figma.com/app/icon/1/favicon.ico',
    link: 'https://www.figma.com',
    sort_order: 1,
  },
  {
    category: 'daily',
    name: 'HHKB Professional',
    description: '静电容键盘，码字手感极佳',
    icon_url: 'https://happyhackingkb.com/favicon.ico',
    link: 'https://happyhackingkb.com',
    sort_order: 1,
  },
];

export async function POST(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 });

  // 已有数据则跳过，避免重复插入
  const { count } = await supabaseAdmin
    .from('uses_items')
    .select('*', { count: 'exact', head: true });

  if (count && count > 0) {
    return NextResponse.json({ message: `已有 ${count} 条数据，跳过初始化` });
  }

  const { data, error } = await supabaseAdmin
    .from('uses_items')
    .insert(SEED_DATA)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: `成功写入 ${data.length} 条工具箱数据`, data });
}
