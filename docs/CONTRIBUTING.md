# 贡献指南

感谢你对拾光博客项目的关注！我们欢迎任何形式的贡献。

## 如何贡献

### 报告Bug

在提交bug报告前，请检查是否已有相同的问题。

**好的bug报告应该包含：**
- 清晰的描述问题
- 复现步骤
- 预期行为vs实际行为
- 环境信息（浏览器、操作系统等）
- 相关截图或错误日志

### 提交功能建议

**好的功能建议应该包含：**
- 清晰的功能描述
- 解决的具体问题
- 可能的实现方案
- 对现有功能的影响

### 代码贡献

#### 开发环境设置

1. Fork并克隆仓库
```bash
git clone https://github.com/your-username/blog-1.git
cd blog-1
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env.local
# 填写必要的配置
```

4. 启动开发服务器
```bash
npm run dev
```

#### 代码规范

**TypeScript规范：**
- 使用严格的类型检查
- 避免使用any类型
- 合理使用泛型
- 添加必要的注释

**React规范：**
- 使用函数组件和Hooks
- 合理拆分组件
- 正确处理副作用
- 优化渲染性能

**样式规范：**
- 使用Tailwind CSS
- 遵循设计系统
- 确保响应式设计
- 考虑可访问性

#### 测试要求

每个新功能都需要相应的测试：

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test src/__tests__/components/Button.test.tsx

# 生成覆盖率报告
npm run test:coverage
```

测试应该覆盖：
- 正常使用场景
- 边界条件
- 错误处理
- 用户交互

#### 提交流程

1. 创建功能分支
```bash
git checkout -b feature/your-feature-name
```

2. 进行开发和测试
```bash
# 编写代码
# 运行测试
npm test

# 代码检查
npm run lint
```

3. 提交更改
```bash
git add .
git commit -m "feat: add new feature"
```

4. 推送到GitHub
```bash
git push origin feature/your-feature-name
```

5. 创建Pull Request

#### Pull Request要求

**PR描述应该包含：**
- 实现的功能或修复的问题
- 相关的issue编号
- 测试方法
- 截图（如果是UI改动）

**代码审查检查项：**
- [ ] 代码符合规范
- [ ] 测试覆盖率达标
- [ ] 文档已更新
- [ ] 没有引入新的警告
- [ ] 性能影响评估

### 文档贡献

帮助改进文档也是重要的贡献：

- 修复错别字和语法错误
- 补充使用示例
- 翻译文档
- 更新过时的信息

## 开发资源

### 项目架构
- [系统设计文档](./ARCHITECTURE.md)
- [API文档](./API_DOCS.md)
- [数据库设计](./DATABASE_SCHEMA.md)

### 技术栈学习
- [Next.js官方文档](https://nextjs.org/docs)
- [React官方文档](https://react.dev)
- [TypeScript手册](https://www.typescriptlang.org/docs/)
- [Tailwind CSS文档](https://tailwindcss.com/docs)

### 开发工具
- VS Code推荐插件
- ESLint配置
- Prettier配置
- 调试配置

## 社区准则

### 行为规范

我们致力于营造友好、包容的开源社区：

**积极的行为：**
- 尊重不同观点
- 提供建设性反馈
- 承认他人贡献
- 保持专业态度

**不被接受的行为：**
- 人身攻击
- 歧视性言论
- 骚扰行为
- 不尊重他人

### 获得帮助

遇到困难时：

1. 查看文档和FAQ
2. 搜索相关issue
3. 在Discussions中提问
4. 联系维护者

## 认可贡献者

我们会在以下地方认可贡献者：

- README贡献者列表
- GitHub贡献图表
- 发布日志致谢
- 社交媒体鸣谢

## 许可证

所有贡献都将遵循项目的MIT许可证。

---

感谢你的贡献！让我们一起打造更好的博客系统。