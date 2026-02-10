import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Diary } from '@/lib/supabase';
import { getAdminPassword } from '@/lib/env';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 检查是否为管理员请求
    const authHeader = request.headers.get('authorization');
    let isAdminRequest = false;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const adminPassword = getAdminPassword();
        const expectedHash = btoa(adminPassword);
        isAdminRequest = token === expectedHash;
      } catch {
        // 忽略
      }
    }

    let query = supabase
      .from('diaries')
      .select('*')
      .eq('id', id);
    
    // 非管理员只能看公开日记
    if (!isAdminRequest) {
      query = query.eq('is_public', true);
    }
    
    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json(
          { success: false, error: '日记不存在' },
          { status: 404 }
        );
      }
      throw error;
    }

    return Response.json({
      success: true,
      data: data as Diary,
    });
  } catch (error) {
    console.error('获取日记详情失败:', error);
    return Response.json(
      { success: false, error: '获取日记详情失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 验证管理员身份 - 使用自定义的admin-token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json(
        { success: false, error: '缺少认证信息' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // 验证token是否与预期的admin token匹配
    const adminPassword = getAdminPassword();
    const expectedHash = btoa(adminPassword);
    
    if (token !== expectedHash) {
      return Response.json(
        { success: false, error: '认证失败' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, mood, weather, location, is_public, diary_date } = body;

    // 验证必要字段
    if (content !== undefined && (!content || content.trim().length === 0)) {
      return Response.json(
        { success: false, error: '日记内容不能为空' },
        { status: 400 }
      );
    }

    const updateData: Partial<Diary> = {};
    if (title !== undefined) updateData.title = title || null;
    if (content !== undefined) {
      updateData.content = content.trim();
      updateData.word_count = content.length;
    }
    if (mood !== undefined) updateData.mood = mood || null;
    if (weather !== undefined) updateData.weather = weather || null;
    if (location !== undefined) updateData.location = location || null;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (diary_date !== undefined) updateData.diary_date = diary_date;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('diaries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json(
          { success: false, error: '日记不存在' },
          { status: 404 }
        );
      }
      throw error;
    }

    return Response.json({
      success: true,
      data: data as Diary,
    });
  } catch (error) {
    console.error('更新日记失败:', error);
    return Response.json(
      { success: false, error: '更新日记失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 验证管理员身份 - 使用自定义的admin-token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json(
        { success: false, error: '缺少认证信息' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // 验证token是否与预期的admin token匹配
    const adminPassword = getAdminPassword();
    const expectedHash = btoa(adminPassword);
    
    if (token !== expectedHash) {
      return Response.json(
        { success: false, error: '认证失败' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('diaries')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json(
          { success: false, error: '日记不存在' },
          { status: 404 }
        );
      }
      throw error;
    }

    return Response.json({
      success: true,
      message: '日记删除成功',
    });
  } catch (error) {
    console.error('删除日记失败:', error);
    return Response.json(
      { success: false, error: '删除日记失败' },
      { status: 500 }
    );
  }
}