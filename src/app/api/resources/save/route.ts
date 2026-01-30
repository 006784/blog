import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyAdminPassword } from '@/lib/env';

// 配置静态导出
export const dynamic = "force-static";
export const revalidate = 0;

// POST - 保存资源记录到数据库（文件已通过直传上传到R2）
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const body = await request.json();
    
    const { 
      adminPassword, 
      name, 
      originalName, 
      description, 
      fileUrl, 
      fileSize, 
      fileType, 
      category, 
      isPublic, 
      tags 
    } = body;

    // 验证管理员权限
    if (!verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    if (!name || !fileUrl || !fileSize) {
      return NextResponse.json({ success: false, error: '缺少必要信息' }, { status: 400 });
    }

    // 获取扩展名
    const ext = originalName?.split('.').pop()?.toLowerCase() || '';

    // 保存到数据库
    const { data: resource, error: dbError } = await supabase
      .from('resources')
      .insert({
        name: name,
        original_name: originalName || name,
        description: description || '',
        file_url: fileUrl,
        file_size: fileSize,
        file_type: fileType || 'application/octet-stream',
        category: category || 'other',
        extension: ext,
        is_public: isPublic || false,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim()).filter(Boolean)) : [],
        upload_ip: clientIP,
        is_verified: true,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ success: false, error: '保存资源信息失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, resource });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
  }
}
