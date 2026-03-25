import { NextRequest } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { Diary } from '@/lib/supabase';
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    const mood = searchParams.get('mood');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // 检查是否为管理员请求
    const isAdminRequest = !!(await requireAdminSession(request));

    let query = supabase
      .from('diaries')
      .select('*', { count: 'exact' })
      .order('diary_date', { ascending: false });

    // 非管理员只能看公开日记
    if (!isAdminRequest) {
      query = query.eq('is_public', true);
    }

    if (mood) {
      query = query.eq('mood', mood);
    }

    if (startDate) {
      query = query.gte('diary_date', startDate);
    }

    if (endDate) {
      query = query.lt('diary_date', endDate);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return Response.json({
      success: true,
      data: data as Diary[],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('获取日记列表失败:', error);
    return Response.json(
      { success: false, error: '获取日记列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
      environment,
      environment_data,
      images,
      tags,
      is_public,
      diary_date
    } = body;

    // 验证必要字段
    if (!content || content.trim().length === 0) {
      return Response.json(
        { success: false, error: '日记内容不能为空' },
        { status: 400 }
      );
    }

    const envData = environment_data || environment || null;

    // 验证环境信息格式
    if (envData) {
      const envErrors = [];
      
      if (envData.location) {
        if (typeof envData.location.latitude !== 'number' || 
            typeof envData.location.longitude !== 'number') {
          envErrors.push('位置坐标必须是数字');
        }
        if (typeof envData.location.city !== 'string' || 
            typeof envData.location.country !== 'string') {
          envErrors.push('城市和国家必须是字符串');
        }
      }
      
      if (envData.weather) {
        if (typeof envData.weather.temperature !== 'number' ||
            typeof envData.weather.condition !== 'string') {
          envErrors.push('天气信息格式不正确');
        }
      }
      
      if (envErrors.length > 0) {
        return Response.json(
          { success: false, error: `环境信息验证失败: ${envErrors.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const safeImages = Array.isArray(images)
      ? images.filter((item) => typeof item === 'string' && item.trim().length > 0)
      : [];
    const safeTags = Array.isArray(tags)
      ? tags.filter((item) => typeof item === 'string' && item.trim().length > 0)
      : [];

    const newDiary: Partial<Diary> = {
      title: title || null,
      content: content.trim(),
      mood: mood || null,
      weather: weather || null,
      location: location || null,
      is_public: typeof is_public === 'boolean' ? is_public : false,
      diary_date: diary_date || new Date().toISOString().split('T')[0],
      images: safeImages,
      tags: safeTags,
      word_count: content.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      environment_data: envData
    };

    let { data, error } = await supabase
      .from('diaries')
      .insert([newDiary])
      .select()
      .single();

    // 兼容旧表结构：若环境字段不存在，则自动降级保存
    if (isMissingEnvironmentColumnError(error)) {
      const legacyDiary = { ...newDiary };
      delete (legacyDiary as { environment_data?: unknown }).environment_data;
      const fallback = await supabase
        .from('diaries')
        .insert([legacyDiary])
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    return Response.json({
      success: true,
      data: data as Diary,
    });
  } catch (error) {
    console.error('创建日记失败:', error);
    return Response.json(
      { success: false, error: '创建日记失败' },
      { status: 500 }
    );
  }
}
