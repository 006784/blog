// 上传文件到 Cloudflare R2
export async function uploadFile(
  file: File,
  bucket: string = 'uploads',
  folder: string = ''
): Promise<{ url: string; path: string } | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder || bucket);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      console.error('Upload error:', result.error);
      return null;
    }

    return {
      url: result.url,
      path: result.path
    };
  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
}

// 上传多个文件到 R2
export async function uploadFiles(
  files: File[],
  bucket: string = 'uploads',
  folder: string = ''
): Promise<{ url: string; path: string }[]> {
  const results = await Promise.all(
    files.map(file => uploadFile(file, bucket, folder))
  );
  return results.filter((r): r is { url: string; path: string } => r !== null);
}

// 删除 R2 文件
export async function deleteFile(
  path: string,
  bucket: string = 'uploads'
): Promise<boolean> {
  try {
    const response = await fetch('/api/upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Delete failed:', error);
    return false;
  }
}

// 获取文件公开URL
export function getPublicUrl(path: string, bucket: string = 'uploads'): string {
  // R2 URL 由 API 返回，这里直接返回 path
  return path;
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
