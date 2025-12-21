import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

// 安全配置
const SECURITY_CONFIG = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: {
    'image/jpeg': { ext: 'jpg', category: 'image' },
    'image/png': { ext: 'png', category: 'image' },
    'image/gif': { ext: 'gif', category: 'image' },
    'image/webp': { ext: 'webp', category: 'image' },
    'video/mp4': { ext: 'mp4', category: 'video' },
    'video/webm': { ext: 'webm', category: 'video' },
    'application/pdf': { ext: 'pdf', category: 'document' },
    'application/msword': { ext: 'doc', category: 'document' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', category: 'document' },
    'application/vnd.ms-excel': { ext: 'xls', category: 'document' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'xlsx', category: 'document' },
    'text/plain': { ext: 'txt', category: 'document' },
    'application/zip': { ext: 'zip', category: 'software' },
    'application/x-rar-compressed': { ext: 'rar', category: 'software' },
    'application/x-7z-compressed': { ext: '7z', category: 'software' },
    'application/gzip': { ext: 'gz', category: 'software' },
    'application/x-apple-diskimage': { ext: 'dmg', category: 'software' },
    'audio/mpeg': { ext: 'mp3', category: 'audio' },
  } as Record<string, { ext: string; category: string }>,
  dangerousExtensions: ['php', 'asp', 'jsp', 'sh', 'bat', 'exe', 'py', 'pl', 'cgi'],
};

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!authHeader || !adminPassword) return false;
  return authHeader === `Bearer ${adminPassword}`;
}

function sanitizeFileName(filename: string): string {
  return filename.replace(/[/\\:*?"<>|]/g, '_').replace(/\.\./g, '_').substring(0, 200);
}

function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string || '';
    const description = formData.get('description') as string || '';
    const isPublic = formData.get('is_public') === 'true';
    const tags = formData.get('tags') as string || '';

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    }

    if (file.size > SECURITY_CONFIG.maxFileSize) {
      return NextResponse.json({ error: '文件过大，最大100MB' }, { status: 400 });
    }

    const typeInfo = SECURITY_CONFIG.allowedTypes[file.type];
    if (!typeInfo) {
      return NextResponse.json({ error: `不支持的文件类型: ${file.type}` }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (SECURITY_CONFIG.dangerousExtensions.includes(ext)) {
      return NextResponse.json({ error: '不允许上传此类型文件' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const checksum = calculateChecksum(buffer);
    const sanitizedName = sanitizeFileName(name || file.name.replace(/\.[^/.]+$/, ''));
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const fileName = `${timestamp}_${randomId}.${typeInfo.ext}`;
    const filePath = `resources/${typeInfo.category}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('resources')
      .upload(filePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: '上传失败: ' + uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from('resources').getPublicUrl(filePath);

    const { data: resource, error: dbError } = await supabase
      .from('resources')
      .insert({
        name: sanitizedName,
        original_name: sanitizeFileName(file.name),
        description,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        category: typeInfo.category,
        extension: typeInfo.ext,
        is_public: isPublic,
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        upload_ip: clientIP,
        checksum,
        is_verified: true,
      })
      .select()
      .single();

    if (dbError) {
      await supabase.storage.from('resources').remove([filePath]);
      return NextResponse.json({ error: '保存失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, resource });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    let query = supabase
      .from('resources')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (category) query = query.eq('category', category);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ resources: data, total: count, page, limit });
  } catch {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
