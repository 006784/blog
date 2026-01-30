# 安全修复和配置更新

本文档记录了项目安全修复和配置更新的详细信息。

## 修复内容

### ✅ 1. 移除所有硬编码密码

**修复前：**
- 多个 API 路由使用硬编码默认密码 `'shiguang2024'` 或 `'admin123'`
- 密码直接写在代码中，存在严重安全风险

**修复后：**
- 所有密码验证统一使用 `@/lib/env` 工具函数
- 强制从环境变量 `ADMIN_PASSWORD` 读取
- 如果环境变量未设置，会抛出明确的错误提示

**修改的文件：**
- `src/app/api/categories/route.ts`
- `src/app/api/guestbook/route.ts`
- `src/app/api/resources/route.ts`
- `src/app/api/resources/save/route.ts`
- `src/app/api/resources/presign/route.ts`
- `src/app/api/notify/route.ts`
- `src/app/api/diaries/route.ts`
- `src/app/api/diaries/[id]/route.ts`
- `src/components/AdminProvider.tsx`

### ✅ 2. 创建环境变量验证工具

**新增文件：**
- `src/lib/env.ts` - 环境变量验证和管理工具

**功能：**
- 验证必需的环境变量是否存在
- 在生产环境中验证管理员密码强度
- 提供统一的密码验证函数
- 在应用启动时自动验证环境变量

### ✅ 3. 创建 .env.example 文件

**新增文件：**
- `.env.example` - 环境变量配置模板

**包含内容：**
- Supabase 配置（必需）
- 管理员密码（必需）
- 网站基础配置
- Cloudflare R2 存储配置（可选）
- Resend 邮件服务配置（可选）
- Cloudflare Turnstile 配置（可选）
- Giscus 评论系统配置（可选）
- Sentry 错误监控配置（可选）
- 健康检查配置（可选）
- 日志配置（可选）

### ✅ 4. 修复 Dockerfile 配置

**修复前：**
- Dockerfile 期望 Next.js standalone 模式
- 但 `next.config.ts` 配置为静态导出模式（`output: 'export'`）
- 导致构建失败

**修复后：**
- 使用 Nginx 提供静态文件服务
- 匹配静态导出模式
- 添加了 Nginx 配置文件
- 优化了健康检查

**修改的文件：**
- `Dockerfile` - 完全重写以支持静态导出
- `nginx.conf` - 新增 Nginx 配置文件

### ✅ 5. 统一密码验证逻辑

**新增 API 端点：**
- `src/app/api/auth/verify/route.ts` - 管理员密码验证端点

**改进：**
- `AdminProvider` 组件现在通过 API 验证密码
- 不再在客户端存储或验证密码
- 所有验证逻辑集中在服务端

### ✅ 6. 更新 README

**修改内容：**
- 移除了占位符 GitHub 链接
- 更新了环境变量配置说明
- 改进了文档的可读性

### ✅ 7. 添加启动时环境变量验证

**修改文件：**
- `src/instrumentation.ts` - 添加了启动时环境变量验证

## 使用说明

### 1. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local 文件，填写实际值
# 特别注意：必须设置 ADMIN_PASSWORD
```

### 2. 必需的环境变量

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ADMIN_PASSWORD=your_secure_admin_password_here
```

### 3. 管理员密码要求

- 至少 8 个字符
- 不能使用默认密码（`shiguang2024`, `admin123`, `password`, `admin`）
- 建议使用强密码（包含大小写字母、数字和特殊字符）

## 安全建议

1. **定期更换密码**：建议每 3-6 个月更换一次管理员密码
2. **使用环境变量**：永远不要在代码中硬编码密码或密钥
3. **生产环境检查**：确保生产环境中的 `ADMIN_PASSWORD` 是强密码
4. **访问控制**：考虑添加 IP 白名单或额外的认证层
5. **日志监控**：监控登录尝试和 API 访问日志

## 测试

在修复后，请测试以下功能：

1. ✅ 管理员登录功能
2. ✅ API 路由的密码验证
3. ✅ 环境变量缺失时的错误提示
4. ✅ Docker 构建和运行

## 注意事项

⚠️ **重要**：在部署到生产环境之前，请确保：
1. 已设置强密码的 `ADMIN_PASSWORD` 环境变量
2. `.env.local` 文件已添加到 `.gitignore`（已默认添加）
3. 所有必需的环境变量都已正确配置
4. 已测试所有管理员功能

## 后续改进建议

1. 添加密码强度验证
2. 实现多因素认证（MFA）
3. 添加登录尝试限制
4. 实现会话管理
5. 添加审计日志
