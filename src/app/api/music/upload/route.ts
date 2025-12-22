import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'audio' | 'cover' | 'lyrics'
    
    if (!file) {
      return NextResponse.json({ error: '没有上传文件' }, { status: 400 });
    }

    // 验证文件类型
    if (type === 'audio') {
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/ogg', 'audio/flac'];
      if (!allowedTypes.some(t => file.type.includes(t.split('/')[1]))) {
        return NextResponse.json({ error: '不支持的音频格式' }, { status: 400 });
      }
    } else if (type === 'cover') {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: '不支持的图片格式' }, { status: 400 });
      }
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(6).toString('hex');
    const ext = file.name.split('.').pop();
    const fileName = `music/${type}/${timestamp}-${randomStr}.${ext}`;

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到 Cloudflare R2
    await R2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    }));

    // 获取公共URL
    const publicUrl = `${R2_PUBLIC_URL}/${fileName}`;

    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      fileName: fileName,
      size: file.size,
    });
  } catch (error) {
    console.error('上传错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
