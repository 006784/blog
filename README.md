# 拾光博客 - 现代化个人博客系统

<p align="center">
  <img src="./public/favicon.ico" alt="拾光博客" width="100" height="100">
</p>

<p align="center">
  一个基于 Next.js 16 + React 19 构建的现代化个人博客系统，具备完整的企业级功能和最佳实践。
</p>

<p align="center">
  <a href="https://github.com/your-username/blog-1">
    <img src="https://img.shields.io/github/license/your-username/blog-1" alt="License">
  </a>
</p>

## 🌟 特性

### 🚀 现代技术栈
- **Next.js 16** - React全栈框架，支持App Router
- **React 19** - 最新的React版本，性能卓越
- **TypeScript** - 完整的类型安全
- **Tailwind CSS** - 实用优先的样式框架

### 🛡️ 企业级功能
- **完整的测试体系** - Jest + React Testing Library
- **错误监控** - Sentry前后端监控
- **日志系统** - Winston结构化日志
- **安全防护** - CSRF保护、输入验证、速率限制

### 🎯 SEO优化
- **结构化数据** - JSON-LD Schema.org标记
- **开放图谱** - OG标签和Twitter卡片
- **可访问性** - WCAG 2.1 AA标准
- **国际化** - 中英文双语支持

### ⚡ 性能优化
- **懒加载** - 图片和组件按需加载
- **资源预加载** - 关键资源提前加载
- **Service Worker** - 离线缓存支持
- **CDN加速** - 全球内容分发

## 📁 项目结构

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

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装和运行

```bash
# 克隆项目
git clone <your-repository-url>
cd blog-1

# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env.local
# 编辑 .env.local 文件，填写必要配置

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

# 生成测试覆盖率报告
npm run test:coverage
```

## 📖 文档

- [开发者指南](./docs/DEVELOPER_GUIDE.md) - 完整的开发文档
- [API文档](./docs/API_DOCS.md) - RESTful API接口说明
- [架构文档](./docs/ARCHITECTURE.md) - 系统设计和架构说明
- [贡献指南](./docs/CONTRIBUTING.md) - 如何参与项目开发

## 🔧 核心功能

### 内容管理
- 📝 Markdown/富文本双编辑器
- 🏷️ 分类和标签管理
- 📸 图片上传和管理
- 🎵 音乐收藏功能

### 用户互动
- 💬 留言簿系统
- 🔗 友情链接管理
- ❤️ 文章点赞和统计
- 🔍 全文搜索功能

### 管理功能
- 👤 管理员权限控制
- 📊 数据统计面板
- ⚙️ 系统配置管理
- 📈 访问数据追踪

## 🛠️ 技术特色

### 测试驱动开发
```bash
# 运行所有测试
npm test

# 运行特定测试
npm test src/__tests__/components/BlogCard.test.tsx

# 生成覆盖率报告
npm run test:coverage
```

### 自动化部署
- GitHub Actions CI/CD流水线
- 代码质量检查和安全扫描
- 自动化测试和部署
- Docker容器化支持

### 监控和日志
- Sentry错误监控（前后端）
- Winston服务端日志系统
- 健康检查API端点
- 性能指标追踪

## 🤝 贡献

欢迎任何形式的贡献！请查看[贡献指南](./docs/CONTRIBUTING.md)了解详情。

### 开发流程
1. Fork项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢以下开源项目的支持：

- [Next.js](https://nextjs.org/) - React框架
- [React](https://react.dev/) - UI库
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [Supabase](https://supabase.com/) - 后端服务
- [Sentry](https://sentry.io/) - 错误监控

## 📞 联系方式

- 项目地址: 请替换为实际的项目地址
- 问题反馈: 请替换为实际的 Issues 链接
- 邮箱: 请替换为实际的联系邮箱

---

<p align="center">用代码拾起时光，用技术留住美好 💫</p>
