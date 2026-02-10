import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword } from '@/lib/env';

// 配置静态导出
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * 验证管理员密码
 * POST /api/auth/verify
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: '密码不能为空' },
        { status: 400 }
      );
    }

    const isValid = verifyAdminPassword(password);

    if (isValid) {
      // 生成 token（base64 编码的密码）
      const token = btoa(password);
      return NextResponse.json({
        success: true,
        token,
      });
    } else {
      return NextResponse.json(
        { success: false, error: '密码错误' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('验证密码失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
