import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Diary } from '@/lib/supabase';

// 环境信息接口
interface EnvironmentInfo {
  location?: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
    address: string;
  };
  weather?: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    location: string;
    timestamp: number;
  };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    const mood = searchParams.get('mood');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let query = supabase
      .from('diaries')
      .select('*', { count: 'exact' })
      .eq('is_public', true)
      .order('diary_date', { ascending: false });

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
    // 使用与AdminProvider中相同的密码
    const ADMIN_PASSWORD = 'shiguang2024';
    const expectedHash = btoa(ADMIN_PASSWORD);
    
    if (token !== expectedHash) {
      return Response.json(
        { success: false, error: '认证失败' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, mood, weather, location, environment, is_public, diary_date } = body;

    // 验证必要字段
    if (!content || content.trim().length === 0) {
      return Response.json(
        { success: false, error: '日记内容不能为空' },
        { status: 400 }
      );
    }

    // 验证环境信息格式
    if (environment) {
      const envErrors = [];
      
      if (environment.location) {
        if (typeof environment.location.latitude !== 'number' || 
            typeof environment.location.longitude !== 'number') {
          envErrors.push('位置坐标必须是数字');
        }
        if (typeof environment.location.city !== 'string' || 
            typeof environment.location.country !== 'string') {
          envErrors.push('城市和国家必须是字符串');
        }
      }
      
      if (environment.weather) {
        if (typeof environment.weather.temperature !== 'number' ||
            typeof environment.weather.condition !== 'string') {
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

    const newDiary: Partial<Diary> = {
      title: title || null,
      content: content.trim(),
      mood: mood || null,
      weather: weather || null,
      location: location || null,
      is_public: typeof is_public === 'boolean' ? is_public : false,
      diary_date: diary_date || new Date().toISOString().split('T')[0],
      images: [],
      tags: [],
      word_count: content.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      environment_data: environment || null
    };

    const { data, error } = await supabase
      .from('diaries')
      .insert([newDiary])
      .select()
      .single();

    if (error) {
      throw error;
    }

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