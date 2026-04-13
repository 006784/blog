import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { requireAdminSession } from '@/lib/auth-server';
import { defaultProfile, normalizeProfile } from '@/lib/profile';
import { supabaseAdmin } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const PROFILE_KEY = 'profile';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', PROFILE_KEY)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return ok(normalizeProfile(data?.value ?? defaultProfile));
  } catch (error) {
    logger.error('读取个人资料失败:', error);
    return err('读取个人资料失败');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdminSession(request);
    if (!session) {
      return err('未授权', 401, 'UNAUTHORIZED');
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return err('请求体格式错误，需要 JSON', 400, 'INVALID_JSON');
    }

    const profile = normalizeProfile(body);

    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .upsert(
        {
          key: PROFILE_KEY,
          value: profile,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )
      .select('value')
      .single();

    if (error) {
      throw error;
    }

    return ok(normalizeProfile(data?.value ?? profile));
  } catch (error) {
    logger.error('保存个人资料失败:', error);
    return err('保存个人资料失败');
  }
}
