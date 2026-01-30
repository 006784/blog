# 拾光博客 - 技术文档

## 项目概述

这是一个现代化的个人博客系统，基于 Next.js 16 + React 19 构建，具备完整的企业级功能和最佳实践。

## 技术栈

### 核心框架
- **Next.js 16** - React全栈框架
- **React 19** - 前端UI库
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架

### 数据层
- **Supabase** - 后端即服务(BaaS)
- **PostgreSQL** - 关系型数据库

### 基础设施
- **Sentry** - 错误监控
- **Winston** - 服务端日志
- **Jest** - 测试框架
- **GitHub Actions** - CI/CD

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   ├── blog/              # 博客页面
│   └── components/        # 页面组件
├── components/            # 可复用组件
├── lib/                   # 工具库
│   ├── accessibility.ts   # 可访问性工具
│   ├── performance.ts     # 性能优化工具
│   ├── i18n.ts           # 国际化配置
│   ├── seo.ts            # SEO工具
│   ├── security.ts       # 安全工具
│   └── logger.ts         # 日志系统
└── __tests__/            # 测试文件
```

## 核心功能模块

### 1. 内容管理
- 文章发布与编辑（Markdown/富文本双编辑器）
- 分类和标签管理
- 草稿和发布状态控制
- 内容版本历史

### 2. 用户系统
- 管理员权限控制
- 个人信息管理
- 登录状态持久化

### 3. 多媒体管理
- 图片上传和管理
- 相册功能
- 音乐收藏管理

### 4. 社交功能
- 留言簿
- 友情链接
- 互动统计

## 开发指南

### 环境配置

1. 复制环境变量模板：
```bash
cp .env.example .env.local
```

2. 填写必要的配置项：
```env
# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 其他服务配置...
```

### 启动开发服务器

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 构建和部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 运行测试
npm test

# 代码检查
npm run lint
```

## 测试策略

### 单元测试
使用 Jest + React Testing Library 进行组件和函数测试

### 集成测试
测试API路由和数据库交互

### 端到端测试
使用 Cypress 或 Playwright（待实现）

## 监控和日志

### 错误监控
- 前端错误：Sentry自动捕获
- 后端错误：Winston日志记录

### 性能监控
- 页面加载时间
- API响应时间
- 用户行为追踪

### 日志级别
- error: 错误信息
- warn: 警告信息  
- info: 一般信息
- debug: 调试信息
- http: HTTP请求

## 安全措施

### 输入验证
- XSS攻击防护
- SQL注入防护
- 文件上传安全检查

### 访问控制
- CSRF保护
- 权限验证
- 速率限制

### 数据保护
- 敏感信息加密
- 环境变量隔离
- 安全头部设置

## SEO优化

### 页面优化
- 语义化HTML结构
- 响应式设计
- 快速加载速度

### 内容优化
- 结构化数据标记
- Open Graph标签
- Twitter卡片

### 技术SEO
- sitemap.xml生成
- robots.txt配置
- canonical标签

## 可访问性标准

遵循WCAG 2.1 AA级别标准：

### 键盘导航
- 完整的键盘操作支持
- 焦点可见性
- 跳过链接功能

### 屏幕阅读器
- ARIA标签正确使用
- 语义化HTML
- 动态内容通知

### 视觉辅助
- 高对比度模式
- 文字大小调整
- 颜色无障碍

## 国际化支持

### 语言切换
- 中英文双语支持
- 自动语言检测
- 本地化路由

### 内容本地化
- UI文本翻译
- 日期时间格式化
- 数字货币本地化

## 性能优化

### 加载优化
- 代码分割
- 懒加载组件
- 资源预加载

### 图片优化
- 响应式图片
- 现代图片格式
- CDN加速

### 缓存策略
- 浏览器缓存
- 服务端缓存
- CDN缓存

## 部署指南

### Vercel部署（推荐）
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel
```

### Docker部署
```bash
# 构建镜像
docker build -t blog-app .

# 运行容器
docker run -p 3000:3000 blog-app
```

### 传统服务器部署
```bash
# 构建
npm run build

# 使用PM2运行
pm2 start npm --name "blog-app" -- start
```

## CI/CD流程

GitHub Actions自动化流程：
1. 代码推送触发
2. 依赖安装和缓存
3. 代码质量检查
4. 测试运行
5. 安全扫描
6. 构建验证
7. 自动部署

## 故障排除

### 常见问题

**Q: 开发服务器启动失败**
A: 检查Node.js版本(>=18)和依赖安装

**Q: 数据库连接失败**  
A: 验证Supabase配置和网络连接

**Q: 构建失败**
A: 检查TypeScript错误和环境变量

### 调试工具

- Chrome DevTools
- React Developer Tools
- Next.js DevTools
- Sentry Dashboard

## 贡献指南

### 开发流程
1. Fork项目
2. 创建功能分支
3. 编写代码和测试
4. 提交Pull Request

### 代码规范
- 使用ESLint和Prettier
- 遵循TypeScript最佳实践
- 编写单元测试
- 更新相关文档

### 提交信息规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
test: 测试相关
refactor: 代码重构
perf: 性能优化
```

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 邮箱：your-email@example.com
- 博客留言

---
*文档最后更新：2026年1月*