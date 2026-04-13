import { NextRequest } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { Diary } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { requireAdminSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

function isMissingEnvironmentColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string; message?: string };
  return (
    err.code === 'PGRST204' &&
    typeof err.message === 'string' &&
    err.message.includes('environment_data')
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 检查是否为管理员请求
    const isAdminRequest = !!(await requireAdminSession(request));

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
    logger.error('获取日记详情失败:', error);
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
    
    if (!await requireAdminSession(request)) {
      return Response.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      content,
      mood,
      weather,
      location,
      images,
      tags,
      environment,
      environment_data,
      is_public,
      diary_date
    } = body;

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
    if (images !== undefined) {
      updateData.images = Array.isArray(images)
        ? images.filter((item) => typeof item === 'string' && item.trim().length > 0)
        : [];
    }
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags)
        ? tags.filter((item) => typeof item === 'string' && item.trim().length > 0)
        : [];
    }
    if (environment_data !== undefined || environment !== undefined) {
      updateData.environment_data = environment_data || environment || null;
    }
    if (is_public !== undefined) updateData.is_public = is_public;
    if (diary_date !== undefined) updateData.diary_date = diary_date;
    updateData.updated_at = new Date().toISOString();

    let { data, error } = await supabase
      .from('diaries')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    // 兼容旧表结构：若环境字段不存在，则自动降级保存
    if (isMissingEnvironmentColumnError(error)) {
      const legacyUpdateData = { ...updateData };
      delete (legacyUpdateData as { environment_data?: unknown }).environment_data;
      const fallback = await supabase
        .from('diaries')
        .update(legacyUpdateData)
        .eq('id', id)
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      if (error.code === 'PGRST116') {
        return Response.json(
          { success: false, error: '日记不存在' },
          { status: 404 }
        );
      }
      throw error;
    }

    logger.info('日记更新成功', { module: 'diaries', action: 'update', id });
    return Response.json({
      success: true,
      data: data as Diary,
    });
  } catch (error) {
    logger.error('更新日记失败:', error);
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
    
    if (!await requireAdminSession(request)) {
      return Response.json({ success: false, error: '未授权' }, { status: 401 });
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

    logger.info('日记删除成功', { module: 'diaries', action: 'delete', id });
    return Response.json({
      success: true,
      message: '日记删除成功',
    });
  } catch (error) {
    logger.error('删除日记失败:', error);
    return Response.json(
      { success: false, error: '删除日记失败' },
      { status: 500 }
    );
  }
}
