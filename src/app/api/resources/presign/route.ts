import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

// Cloudflare R2 配置
const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME || 'resources';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

// 验证管理员密码
function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || 'shiguang2024';
  return password === adminPassword;
}

// 允许的文件类型
const ALLOWED_TYPES: Record<string, { ext: string; category: string }> = {
  'image/jpeg': { ext: 'jpg', category: 'image' },
  'image/png': { ext: 'png', category: 'image' },
  'image/gif': { ext: 'gif', category: 'image' },
  'image/webp': { ext: 'webp', category: 'image' },
  'video/mp4': { ext: 'mp4', category: 'video' },
  'video/webm': { ext: 'webm', category: 'video' },
  'video/quicktime': { ext: 'mov', category: 'video' },
  'audio/mpeg': { ext: 'mp3', category: 'audio' },
  'audio/wav': { ext: 'wav', category: 'audio' },
  'audio/flac': { ext: 'flac', category: 'audio' },
  'application/pdf': { ext: 'pdf', category: 'document' },
  'application/zip': { ext: 'zip', category: 'software' },
  'application/x-rar-compressed': { ext: 'rar', category: 'software' },
  'application/x-7z-compressed': { ext: '7z', category: 'software' },
  'application/gzip': { ext: 'gz', category: 'software' },
  'application/x-apple-diskimage': { ext: 'dmg', category: 'software' },
  'application/octet-stream': { ext: 'bin', category: 'software' }, // 通用二进制
};

// POST - 获取预签名上传URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType, fileSize, adminPassword } = body;

    // 验证管理员权限
    if (!verifyAdminPassword(adminPassword)) {
      return NextResponse.json({ success: false, error: '未授权访问' }, { status: 401 });
    }

    if (!fileName || !fileType) {
      return NextResponse.json({ success: false, error: '缺少文件信息' }, { status: 400 });
    }

    // 文件大小限制 500MB
    if (fileSize > 500 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: '文件过大，最大支持500MB' }, { status: 400 });
    }

    // 检查文件类型
    const typeInfo = ALLOWED_TYPES[fileType];
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    // 根据扩展名判断类别
    let category = 'other';
    if (typeInfo) {
      category = typeInfo.category;
    } else if (['dmg', 'pkg', 'exe', 'msi', 'deb', 'rpm', 'app'].includes(ext)) {
      category = 'software';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      category = 'image';
    } else if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
      category = 'video';
    } else if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) {
      category = 'audio';
    } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext)) {
      category = 'document';
    }

    // 生成唯一文件路径
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    const safeFileName = `${timestamp}_${randomId}.${ext}`;
    const filePath = `${category}/${safeFileName}`;

    // 生成预签名URL（有效期15分钟）
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: filePath,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(R2, command, { expiresIn: 900 });

    // 返回上传URL和公开访问URL
    const publicUrl = `${R2_PUBLIC_URL}/${filePath}`;

    return NextResponse.json({
      success: true,
      uploadUrl: presignedUrl,
      publicUrl: publicUrl,
      filePath: filePath,
      category: category,
    });
  } catch (error) {
    console.error('Presign error:', error);
    return NextResponse.json({ success: false, error: '生成上传链接失败' }, { status: 500 });
  }
}
