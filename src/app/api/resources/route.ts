import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { verifyAdminPassword } from '@/lib/env';
import crypto from 'crypto';

// 配置静态导出
export const dynamic = "force-static";
export const revalidate = 0;

// Cloudflare R2 配置
const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

const R2_BUCKET = process.env.R2_BUCKET_NAME || 'resources';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

// 安全配置
const SECURITY_CONFIG = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedTypes: {
    'image/jpeg': { ext: 'jpg', category: 'image' },
    'image/png': { ext: 'png', category: 'image' },
    'image/gif': { ext: 'gif', category: 'image' },
    'image/webp': { ext: 'webp', category: 'image' },
    'image/svg+xml': { ext: 'svg', category: 'image' },
    'video/mp4': { ext: 'mp4', category: 'video' },
    'video/webm': { ext: 'webm', category: 'video' },
    'video/quicktime': { ext: 'mov', category: 'video' },
    'audio/mpeg': { ext: 'mp3', category: 'audio' },
    'audio/wav': { ext: 'wav', category: 'audio' },
    'audio/flac': { ext: 'flac', category: 'audio' },
    'application/pdf': { ext: 'pdf', category: 'document' },
    'application/msword': { ext: 'doc', category: 'document' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', category: 'document' },
    'application/vnd.ms-excel': { ext: 'xls', category: 'document' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: 'xlsx', category: 'document' },
    'application/vnd.ms-powerpoint': { ext: 'ppt', category: 'document' },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { ext: 'pptx', category: 'document' },
    'text/plain': { ext: 'txt', category: 'document' },
    'text/markdown': { ext: 'md', category: 'document' },
    'application/json': { ext: 'json', category: 'document' },
    'application/zip': { ext: 'zip', category: 'software' },
    'application/x-rar-compressed': { ext: 'rar', category: 'software' },
    'application/x-7z-compressed': { ext: '7z', category: 'software' },
    'application/gzip': { ext: 'gz', category: 'software' },
    'application/x-tar': { ext: 'tar', category: 'software' },
    'application/x-apple-diskimage': { ext: 'dmg', category: 'software' },
  } as Record<string, { ext: string; category: string }>,
  dangerousExtensions: [
    'exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'pif',
    'php', 'php3', 'php4', 'php5', 'phtml',
    'asp', 'aspx', 'jsp', 'jspx',
    'py', 'pyc', 'pyo', 'rb', 'pl', 'cgi',
    'sh', 'bash', 'zsh', 'ps1', 'psm1',
    'vbs', 'vbe', 'wsf', 'wsh',
    'dll', 'so', 'dylib', 'bin', 'elf',
    'htaccess', 'htpasswd',
  ],
};

// 清理文件名（防止路径遍历攻击）
function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/^\.+/, '')
    .substring(0, 200);
}

// 计算文件MD5校验和
function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

// POST - 上传资源到 Cloudflare R2
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const formData = await request.formData();
    
    // 验证管理员权限
    const adminPassword = formData.get('adminPassword') as string;
    if (!verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
    }
    
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string || '';
    const description = formData.get('description') as string || '';
    const isPublic = formData.get('isPublic') === 'true';
    const tags = formData.get('tags') as string || '';

    if (!file) {
      return NextResponse.json({ success: false, error: '请选择文件' }, { status: 400 });
    }

    // 文件大小检查
    if (file.size > SECURITY_CONFIG.maxFileSize) {
      return NextResponse.json({ success: false, error: '文件过大，最大支持100MB' }, { status: 400 });
    }

    // 文件类型检查
    const typeInfo = SECURITY_CONFIG.allowedTypes[file.type];
    if (!typeInfo) {
      return NextResponse.json({ success: false, error: `不支持的文件类型: ${file.type}` }, { status: 400 });
    }

    // 扩展名安全检查
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (SECURITY_CONFIG.dangerousExtensions.includes(ext)) {
      return NextResponse.json({ success: false, error: '安全警告：禁止上传可执行文件或脚本' }, { status: 400 });
    }

    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer());
    const checksum = calculateChecksum(buffer);
    
    // 生成安全的文件名和路径
    const sanitizedName = sanitizeFileName(name || file.name.replace(/\.[^/.]+$/, ''));
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const fileName = `${timestamp}_${randomId}.${typeInfo.ext}`;
    const filePath = `${typeInfo.category}/${fileName}`;

    // 上传到 Cloudflare R2
    try {
      await R2.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: filePath,
        Body: buffer,
        ContentType: file.type,
      }));
    } catch (uploadError) {
      console.error('R2 upload error:', uploadError);
      return NextResponse.json({ success: false, error: '文件上传到R2失败' }, { status: 500 });
    }

    // 构建公开URL
    const fileUrl = `${R2_PUBLIC_URL}/${filePath}`;

    // 保存到数据库
    const { data: resource, error: dbError } = await supabase
      .from('resources')
      .insert({
        name: sanitizedName,
        original_name: sanitizeFileName(file.name),
        description,
        file_url: fileUrl,
        file_size: file.size,
        file_type: file.type,
        category: typeInfo.category,
        extension: typeInfo.ext,
        is_public: isPublic,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        upload_ip: clientIP,
        checksum,
        is_verified: true,
      })
      .select()
      .single();

    if (dbError) {
      // 回滚：删除已上传的文件
      try {
        await R2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: filePath }));
      } catch (e) {
        console.error('Failed to rollback R2 file:', e);
      }
      console.error('Database error:', dbError);
      return NextResponse.json({ success: false, error: '保存资源信息失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, resource });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
  }
}

// GET - 获取资源列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('resources')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,original_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json({ resources: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ resources: data || [], total: count || 0, page, limit });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ resources: [], error: '获取资源列表失败' }, { status: 500 });
  }
}

// DELETE - 删除资源
export async function DELETE(request: NextRequest) {
  try {
    const { id, adminPassword } = await request.json();
    
    if (!verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: '资源ID不能为空' }, { status: 400 });
    }

    // 获取资源信息
    const { data: resource, error: fetchError } = await supabase
      .from('resources')
      .select('file_url')
      .eq('id', id)
      .single();

    if (fetchError || !resource) {
      return NextResponse.json({ success: false, error: '资源不存在' }, { status: 404 });
    }

    // 从URL提取文件路径并删除R2文件
    const urlParts = resource.file_url.replace(R2_PUBLIC_URL + '/', '');
    if (urlParts) {
      try {
        await R2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: urlParts }));
      } catch (e) {
        console.error('Failed to delete R2 file:', e);
      }
    }

    // 从数据库删除
    const { error: deleteError } = await supabase
      .from('resources')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
  }
}
