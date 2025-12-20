import { supabase } from './supabase';

// 上传文件到 Supabase Storage
export async function uploadFile(
  file: File,
  bucket: string = 'blog-uploads',
  folder: string = ''
): Promise<{ url: string; path: string } | null> {
  try {
    // 生成唯一文件名
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // 上传文件
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    // 获取公开URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: urlData.publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
}

// 上传多个文件
export async function uploadFiles(
  files: File[],
  bucket: string = 'blog-uploads',
  folder: string = ''
): Promise<{ url: string; path: string }[]> {
  const results = await Promise.all(
    files.map(file => uploadFile(file, bucket, folder))
  );
  return results.filter((r): r is { url: string; path: string } => r !== null);
}

// 删除文件
export async function deleteFile(
  path: string,
  bucket: string = 'blog-uploads'
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Delete failed:', error);
    return false;
  }
}

// 获取文件公开URL
export function getPublicUrl(path: string, bucket: string = 'blog-uploads'): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// 压缩图片 (可选，用于优化上传)
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 按比例缩放
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
