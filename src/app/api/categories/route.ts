import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdminPassword } from '@/lib/env';


// 配置静态导出
export const dynamic = "force-dynamic";
export const revalidate = 0;

// 颜色选项
const VALID_COLORS = ['blue', 'purple', 'green', 'orange', 'pink', 'red', 'yellow', 'cyan', 'gray'];

// 图标选项
const VALID_ICONS = ['image', 'video', 'file-text', 'package', 'music', 'file', 'folder', 'archive', 'code', 'database', 'book', 'link', 'star'];

// GET - 获取所有分类
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('resource_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json({ categories: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ categories: data || [] });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ categories: [], error: '服务器错误' }, { status: 500 });
  }
}

// POST - 创建新分类
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminPassword, name, slug, description, icon, color, sort_order } = body;

    // 验证管理员权限
    if (!verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: '名称和标识符不能为空' }, { status: 400 });
    }

    // 验证 slug 格式
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ success: false, error: '标识符只能包含小写字母、数字和连字符' }, { status: 400 });
    }

    // 验证颜色
    const validColor = VALID_COLORS.includes(color) ? color : 'gray';
    
    // 验证图标
    const validIcon = VALID_ICONS.includes(icon) ? icon : 'folder';

    const { data, error } = await supabase
      .from('resource_categories')
      .insert({
        name,
        slug,
        description: description || '',
        icon: validIcon,
        color: validColor,
        sort_order: sort_order || 0,
        is_system: false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: '分类名称或标识符已存在' }, { status: 400 });
      }
      console.error('Insert error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

// PUT - 更新分类
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminPassword, id, name, description, icon, color, sort_order } = body;

    // 验证管理员权限
    if (!verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少分类ID' }, { status: 400 });
    }

    // 验证颜色
    const validColor = VALID_COLORS.includes(color) ? color : undefined;
    
    // 验证图标
    const validIcon = VALID_ICONS.includes(icon) ? icon : undefined;

    const updateData: Record<string, string | number | undefined> = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (validIcon) updateData.icon = validIcon;
    if (validColor) updateData.color = validColor;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    const { data, error } = await supabase
      .from('resource_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, category: data });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

// DELETE - 删除分类
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminPassword, id } = body;

    // 验证管理员权限
    if (!verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少分类ID' }, { status: 400 });
    }

    // 检查是否是系统分类
    const { data: category } = await supabase
      .from('resource_categories')
      .select('is_system')
      .eq('id', id)
      .single();

    if (category?.is_system) {
      return NextResponse.json({ success: false, error: '系统分类不可删除' }, { status: 400 });
    }

    // 删除分类
    const { error } = await supabase
      .from('resource_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
