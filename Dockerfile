# Dockerfile for Blog Application (Static Export)
FROM node:18-alpine AS base

# 安装必要工具
RUN apk add --no-cache libc6-compat

# 设置工作目录
WORKDIR /app

# ========== 构建阶段 ==========
FROM base AS builder

# 复制依赖文件
COPY package.json package-lock.json ./

# 安装所有依赖（包括 devDependencies，构建需要）
RUN npm ci && npm cache clean --force

# 复制源代码
COPY . .

# 构建应用（静态导出）
RUN npm run build

# ========== 运行阶段 ==========
# 使用 Nginx 提供静态文件服务
FROM nginx:alpine AS runner

# 复制静态文件到 Nginx 目录
COPY --from=builder /app/out /usr/share/nginx/html

# 复制 Nginx 配置文件（如果存在）
# 如果没有自定义配置，使用默认配置
COPY nginx.conf /etc/nginx/conf.d/default.conf 2>/dev/null || true

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/api/health || exit 1

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]