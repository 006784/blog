# 日记媒体上传功能测试指南

## 🎯 功能概述
日记功能现已连接真实的文件上传API，支持上传多种类型的媒体文件到Cloudflare R2存储。

## 📋 支持的文件类型
- **图片**: JPG, PNG, GIF, WebP, SVG
- **视频**: MP4, WebM, MOV
- **音频**: MP3, WAV, FLAC, M4A, AAC, OGG
- **文档**: PDF, TXT, Markdown

## 📏 限制条件
- 单个文件最大: 50MB
- 存储位置: `diary-media` 文件夹
- 访问方式: 公开URL

## 🔧 技术实现

### 1. 前端集成
```typescript
// 在日记编辑器中调用真实API
const formData = new FormData();
formData.append('file', file);
formData.append('folder', 'diary-media');

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});
```

### 2. 后端API
使用现有的 `/api/upload` 路由，该路由:
- 验证文件类型和大小
- 上传到Cloudflare R2存储
- 返回公开访问URL
- 生成唯一的文件路径

### 3. 存储结构
```
R2 Bucket: resources
├── diary-media/
│   ├── 1703123456789-abcdef.jpg
│   ├── 1703123456790-123456.mp4
│   └── 1703123456791-789abc.pdf
```

## 🚀 使用方法

### 在日记编辑器中:
1. 点击"写新日记"或编辑现有日记
2. 滚动到底部找到媒体上传区域
3. 选择"选择图片"或"选择视频"按钮
4. 选择要上传的文件
5. 点击"上传 X 个文件"按钮
6. 等待上传完成后保存日记

### 查看上传的媒体:
- 在日记详情页面会显示相关媒体
- 点击媒体可查看大图或播放视频
- 媒体以网格形式展示，支持响应式布局

## 🛠️ 开发注意事项

### 环境变量要求:
```bash
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=resources
R2_PUBLIC_URL=https://your-domain.r2.dev
```

### 错误处理:
- 文件类型不支持时会显示具体错误信息
- 文件过大时会提示大小限制
- 网络错误时会显示上传失败原因
- 上传成功后会在界面上显示绿色标识

### 性能优化:
- 支持批量上传多个文件
- 上传过程中显示进度状态
- 上传完成后自动更新预览
- 已上传文件可单独删除

## 🧪 测试建议

1. **基本功能测试**:
   - 上传一张小图片(1-2MB)
   - 上传一个短视频(10-20MB)
   - 验证文件在日记中正确显示

2. **边界情况测试**:
   - 尝试上传超过50MB的文件
   - 上传不支持的文件类型
   - 同时上传多个文件

3. **用户体验测试**:
   - 检查上传过程中的状态反馈
   - 验证错误提示的友好性
   - 测试删除已上传文件的功能

## 📊 监控和维护

### 日志记录:
- 上传成功/失败都会记录到控制台
- 可通过浏览器开发者工具查看详细信息

### 存储管理:
- 定期清理不需要的媒体文件
- 监控R2存储使用情况
- 可通过R2控制台管理文件

这个功能现在完全集成到了现有的日记系统中，用户可以轻松地为他们的日记添加丰富的媒体内容！