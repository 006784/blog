import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop();
    const fileName = `${type}/${timestamp}-${randomStr}.${ext}`;

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 上传到 Supabase Storage
    const { data, error } = await supabase.storage
      .from('music-uploads')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('上传失败:', error);
      return NextResponse.json({ error: '上传失败: ' + error.message }, { status: 500 });
    }

    // 获取公共URL
    const { data: urlData } = supabase.storage
      .from('music-uploads')
      .getPublicUrl(fileName);

    return NextResponse.json({ 
      success: true,
      url: urlData.publicUrl,
      fileName: fileName,
      size: file.size,
    });
  } catch (error) {
    console.error('上传错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
