import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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

// 允许的文件类型
const ALLOWED_TYPES: Record<string, { ext: string; category: string }> = {
  // 图片
  'image/jpeg': { ext: 'jpg', category: 'images' },
  'image/png': { ext: 'png', category: 'images' },
  'image/gif': { ext: 'gif', category: 'images' },
  'image/webp': { ext: 'webp', category: 'images' },
  'image/svg+xml': { ext: 'svg', category: 'images' },
  // 音频
  'audio/mpeg': { ext: 'mp3', category: 'audio' },
  'audio/mp3': { ext: 'mp3', category: 'audio' },
  'audio/wav': { ext: 'wav', category: 'audio' },
  'audio/x-wav': { ext: 'wav', category: 'audio' },
  'audio/flac': { ext: 'flac', category: 'audio' },
  'audio/m4a': { ext: 'm4a', category: 'audio' },
  'audio/x-m4a': { ext: 'm4a', category: 'audio' },
  'audio/aac': { ext: 'aac', category: 'audio' },
  'audio/ogg': { ext: 'ogg', category: 'audio' },
  // 视频
  'video/mp4': { ext: 'mp4', category: 'video' },
  'video/webm': { ext: 'webm', category: 'video' },
  'video/quicktime': { ext: 'mov', category: 'video' },
  // 文档
  'application/pdf': { ext: 'pdf', category: 'documents' },
  'text/plain': { ext: 'txt', category: 'documents' },
  'text/markdown': { ext: 'md', category: 'documents' },
  'text/x-lrc': { ext: 'lrc', category: 'documents' },
};

// POST - 上传文件到 R2
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      return NextResponse.json({ success: false, error: '请选择文件' }, { status: 400 });
    }

    // 文件大小限制 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: '文件过大，最大支持50MB' }, { status: 400 });
    }

    // 检查文件类型
    const typeInfo = ALLOWED_TYPES[file.type];
    if (!typeInfo) {
      return NextResponse.json({ 
        success: false, 
        error: `不支持的文件类型: ${file.type}` 
      }, { status: 400 });
    }

    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 生成唯一文件名
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(6).toString('hex');
    const fileName = `${timestamp}-${randomId}.${typeInfo.ext}`;
    const filePath = `${folder}/${fileName}`;

    // 上传到 R2
    await R2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: filePath,
      Body: buffer,
      ContentType: file.type,
    }));

    // 返回公开URL
    const fileUrl = `${R2_PUBLIC_URL}/${filePath}`;

    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      path: filePath,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ success: false, error: '上传失败' }, { status: 500 });
  }
}

// DELETE - 删除 R2 文件
export async function DELETE(request: NextRequest) {
  try {
    const { path } = await request.json();
    
    if (!path) {
      return NextResponse.json({ success: false, error: '文件路径不能为空' }, { status: 400 });
    }

    await R2.send(new DeleteObjectCommand({ 
      Bucket: R2_BUCKET, 
      Key: path 
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ success: false, error: '删除失败' }, { status: 500 });
  }
}
