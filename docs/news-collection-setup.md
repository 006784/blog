# 新闻收集系统配置说明

## 功能概述
新闻收集系统可以自动收集全球新闻，按分类整理，翻译成中文并通过邮件发送给您。

## 环境变量配置

在 `.env.local` 文件中添加以下配置：

```bash
# 邮件服务配置（必需）
RESEND_API_KEY=your_resend_api_key_here

# 翻译服务配置（可选，但推荐）
DEEPL_API_KEY=your_deepl_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# 站点URL配置
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## API密钥获取

### 1. Resend（邮件发送）
- 访问：https://resend.com
- 注册账号并获取API密钥
- 免费额度：每月3000封邮件

### 2. DeepL（高质量翻译）
- 访问：https://www.deepl.com/pro-api
- 注册开发者账号
- 免费额度：500,000字符/月

### 3. OpenAI（备用翻译）
- 访问：https://platform.openai.com
- 获取API密钥
- 按使用量付费

## 使用方法

### 1. 测试新闻收集
```bash
# 简单测试（收集少量新闻）
curl "http://localhost:3000/api/news/test?test=true"

# 完整测试（收集所有新闻）
curl "http://localhost:3000/api/news/test"
```

### 2. 手动发送新闻简报
```bash
curl -X POST "http://localhost:3000/api/news/test" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientEmail": "your-email@example.com",
    "categories": ["international", "technology", "business"],
    "minImportanceScore": 60,
    "maxItemsPerCategory": 5
  }'
```

### 3. 查看新闻源状态
```bash
curl "http://localhost:3000/api/news/sources"
```

### 4. 测试特定新闻源
```bash
curl -X POST "http://localhost:3000/api/news/sources" \
  -H "Content-Type: application/json" \
  -d '{"sourceId": "reuters"}'
```

## 管理界面

访问 `/admin/news` 查看新闻收集系统的管理界面，可以：
- 查看所有新闻源状态
- 测试单个新闻源
- 运行完整测试
- 监控收集统计

## 预设新闻源

系统默认包含以下新闻源：

### 国际新闻
- 路透社 (Reuters)
- BBC World
- 美联社 (AP News)

### 科技新闻
- TechCrunch
- The Verge
- 36氪

### 商业财经
- 彭博社 (Bloomberg)
- CNBC
- 财新网

### 政治时事
- Politico
- 卫报政治

### 娱乐文化
- Variety
- 滚石杂志

### 体育新闻
- ESPN
- 体育画报

## 自定义配置

### 添加新新闻源
在 `src/lib/news/sources.ts` 中添加新的新闻源配置：

```typescript
{
  id: 'new-source',
  name: '新新闻源',
  url: 'https://example.com/rss',
  type: 'rss',
  category: 'technology',
  language: 'en',
  country: 'US',
  isActive: true
}
```

### 调整分类
修改 `NEWS_CATEGORIES` 数组来自定义分类：

```typescript
{
  id: 'custom-category',
  name: '自定义分类',
  displayName: '🏷️ 自定义',
  description: '自定义分类描述',
  color: '#ff6b6b',
  icon: '🏷️'
}
```

## 邮件模板

系统会自动生成美观的HTML邮件，包含：
- 每日新闻统计
- 按分类组织的新闻
- 每条新闻的标题、摘要、来源
- 响应式设计，支持移动端阅读

## 定时任务设置

目前需要手动触发新闻收集。未来可以集成：
- Cron jobs
- GitHub Actions 定时工作流
- 第三方定时任务服务

## 故障排除

### 常见问题

1. **邮件发送失败**
   - 检查Resend API密钥是否正确
   - 确认邮箱地址格式正确
   - 查看控制台错误日志

2. **翻译失败**
   - 检查DeepL/OpenAI API密钥
   - 确认网络连接正常
   - 查看是否有足够的API额度

3. **新闻源无法访问**
   - 检查RSS链接是否有效
   - 确认网络连接
   - 在管理界面测试具体新闻源

### 日志查看
```bash
# 查看应用日志
npm run dev
# 或查看服务器日志文件
```

## 后续优化建议

1. **增加更多新闻源**
   - 国内主流媒体RSS
   - 社交媒体API集成
   - 专业领域新闻源

2. **智能分类优化**
   - 使用AI进行更精准的分类
   - 关键词自动标签
   - 个性化推荐

3. **性能优化**
   - 并行收集多个新闻源
   - 缓存机制减少重复请求
   - 数据库存储历史新闻

4. **用户体验提升**
   - 个性化订阅配置
   - 新闻重要性智能排序
   - 关键词过滤功能