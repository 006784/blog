# 博客升级优化计划

> 生成日期：2026-03-30
> 基于全量代码扫描（~60K 行 TypeScript/TSX，299+ 文件）

---

## 项目现状概览

| 维度 | 当前评分 | 说明 |
|------|---------|------|
| 架构设计 | 8/10 | App Router 结构清晰，分层合理 |
| 代码质量 | 7/10 | 存在 backup 文件、散乱 console、类型不严格 |
| 测试覆盖 | 4/10 | 仅 4 个测试文件，几乎无 API/组件测试 |
| 安全性 | 7.5/10 | 认证体系扎实，CSP 有待收紧 |
| 性能 | 7/10 | 存在大列表无分页、重复请求问题 |
| 功能完整性 | 8.5/10 | 功能丰富，但部分功能收尾不完整 |
| UI/UX | 8/10 | 设计系统已建立，细节体验需打磨 |
| 无障碍性 | 6.5/10 | 基本支持，需系统性补齐 |

---

## P0 — 紧急修复（影响稳定性/安全性）

### P0-1 清理 backup 文件
- 删除 `src/app/diary/page.backup.tsx`
- 删除 `src/components/RichEditor.backup`
- 这些文件包含旧代码逻辑，可能引起混淆，且影响构建扫描

### P0-2 收紧 CSP 配置
- 当前 `src/lib/security.ts` 中含 `'unsafe-inline'` 和 `'unsafe-eval'`
- 目标：移除 `unsafe-eval`（主要来源是 Monaco Editor，考虑 Worker 方式加载）
- 移除不必要的 `unsafe-inline`，改用 nonce 或哈希白名单

### P0-3 Markdown 渲染 XSS 审计
- `MarkdownEditor` 中使用了 `dangerouslySetInnerHTML` 做预览渲染
- 需确认 `react-markdown` + `remark-gfm` 插件链有 HTML sanitize 兜底
- 建议引入 `rehype-sanitize` 插件显式清理 HTML

### P0-4 Admin 大列表缺分页
- `getAllPosts()`、`getAllPhotos()`、`getAllDiaries()` 等函数一次性加载全量数据
- Admin 面板在数据量大时会崩溃或极度缓慢
- 为所有 Admin 列表接口加 `limit/offset` 或 `cursor` 分页

---

## P1 — 高优先级（用户体验关键路径）

### P1-1 统一 loading & 错误状态
**问题：** 各页面 loading UI 不一致，部分页面无 skeleton，报错只显示文字。
**方案：**
- 建立统一的 `<Skeleton />` 组件变体（列表行、卡片、文章详情）
- 所有异步页面在加载时展示对应 skeleton
- 报错页统一提供「重试」按钮 + 友好提示文案
- 将所有 `alert()` / `confirm()` 替换为自定义 Modal 组件

### P1-2 空状态 UI
当前无博客文章、无相册、无留言时，页面通常只显示空白或纯文字。
需为以下页面补充 `<EmptyState />` 组件：
- `/blog` 无文章
- `/gallery` 无相册/无照片
- `/guestbook` 无留言
- `/diary` 无日记
- `/music` 无歌单
- 管理后台各列表

### P1-3 Toast 通知系统
目前操作成功/失败反馈散落在各处（部分用 alert，部分无提示）。
**方案：** 建立全局 Toast/Snackbar 系统：
- 操作成功：绿色 toast，2 秒自动消失
- 操作失败：红色 toast，展示错误原因
- 加载中状态：loading toast（复杂操作）

### P1-4 删除确认 Modal 统一化
当前多处使用浏览器原生 `confirm()`，体验差且无法定制。
统一为项目内的 Modal 组件，提供：
- 操作描述文案
- 「取消 / 确认删除」双按钮
- 高危操作加红色警告

### P1-5 表单错误体验
- 服务端返回的校验错误需在表单字段处展示（目前部分只 console.error）
- 统一 API 错误格式：`{ success: false, error: string, fields?: Record<string, string> }`

---

## P2 — 性能优化

### P2-1 图片统一使用 next/image
- 项目中有 52 处图片引用，部分仍使用原生 `<img>` 标签
- 全部替换为 `next/image`，获得自动 WebP 转换 + lazy load + 尺寸优化
- Markdown 渲染中的图片：自定义 `rehype` 插件或 react-markdown 的 `components.img` 覆写

### P2-2 Monaco Editor 懒加载优化
- 当前直接引入 Monaco，首屏 bundle 较重
- 改用 `next/dynamic` + `loading` placeholder，仅在 `/write` 页面按需加载
- 考虑使用 Monaco 的 Web Worker 模式减少主线程阻塞

### P2-3 减少重复 API 请求
- Blog 页面存在 Server Component fetch + Client 重复 fetch 的情况
- 审查所有页面的数据流：Server Component 负责初始数据，Client Component 只负责交互后的增量更新
- 使用 `cache()` / `unstable_cache()` 对同一请求去重

### P2-4 路由级缓存策略梳理
- 明确各路由的 `revalidate` 策略：
  - 博客列表：`revalidate = 300`（5 分钟）
  - 博客详情：发布/更新时 `revalidatePath`
  - 静态页（about/uses/now）：`revalidate = 3600` 或 `force-static`
  - Admin 接口：`revalidate = 0`（不缓存）

### P2-5 大列表虚拟滚动
- 相册、资源管理等列表项目多时需虚拟滚动
- 推荐使用 `@tanstack/react-virtual`

---

## P3 — 代码质量

### P3-1 替换 console.error 为统一 logger
- 项目中有 201 处 `console.error` 调用
- 已有 Winston logger (`src/lib/logger.ts`)
- 在服务端代码中统一替换为 `logger.error()`
- 客户端异常上报走 Sentry，不直接 console.error

### P3-2 localStorage SSR 安全处理
- 共 86 处 localStorage 调用，部分缺少 `typeof window !== 'undefined'` guard
- 使用统一封装：

```ts
// src/lib/storage.ts
export const storage = {
  get: (key: string) => (typeof window !== 'undefined' ? localStorage.getItem(key) : null),
  set: (key: string, value: string) => typeof window !== 'undefined' && localStorage.setItem(key, value),
  remove: (key: string) => typeof window !== 'undefined' && localStorage.removeItem(key),
}
```

### P3-3 消除 any 类型
- 清理 `RichEditor.backup` 中的 `any` 类型（删文件即可）
- 审查 API 响应处理中的隐式 any
- 为常用 API 响应类型建立共享 TypeScript 类型文件 `src/types/api.ts`

### P3-4 useEffect 依赖项审计
- 启用 ESLint `react-hooks/exhaustive-deps` 规则（当前可能未强制）
- 修复缺失依赖项警告，避免闭包陷阱

### P3-5 setTimeout/setInterval 内存泄漏审计
- 80 处定时器调用，逐一确认 `useEffect` cleanup 中有 `clearTimeout/clearInterval`
- 重点检查：AdminProvider 的 idle timeout、MarkdownEditor 的 debounce

---

## P4 — 功能完善

### P4-1 定时发布支持
- 数据库 `posts` 表有 `publish_at` 字段但未被消费
- 实现：发布时若 `publish_at` 为未来时间，状态置为 `scheduled`
- 后台 cron job 或 Vercel Cron 定期扫描并发布

### P4-2 文章版本历史
- 编辑文章时自动保存版本快照（保留最近 10 个版本）
- Admin 界面可查看历史版本并一键回滚
- 数据表：`post_revisions (id, post_id, content, created_at)`

### P4-3 草稿预览链接
- 生成带 token 的预览链接：`/blog/preview/[token]`
- token 存入数据库，24 小时有效
- 可分享给他人预览未发布文章

### P4-4 PWA 补完
- 已有部分 PWA 基础设施，补齐：
  - `manifest.json` 完整配置（icons、theme_color、shortcuts）
  - Service Worker 缓存策略（静态资源离线可用）
  - 安装提示 UI

### P4-5 SEO 增强
- `robots.txt` 检查与完善
- Sitemap 定时提交到 Google Search Console（或提供手动触发接口）
- 每篇文章 Open Graph 图片使用 `/api/og` 动态生成时补充更多样式变体

---

## P5 — 无障碍性（A11y）

### P5-1 ARIA 标签补齐
- 所有 icon-only 按钮补 `aria-label`
- 图片补 `alt` 属性（含装饰性图片的 `alt=""`）
- 表单控件补 `aria-describedby` 关联错误提示

### P5-2 键盘导航
- 所有交互元素可通过 Tab 键访问
- Modal/Dropdown 实现焦点陷阱（focus trap）
- 关闭 Modal 后焦点回到触发元素

### P5-3 色彩对比度
- 使用 axe DevTools 或 Lighthouse 跑一遍对比度报告
- 重点检查：`--ink` 在 `--paper` 背景上、卡片内的次要文字、Badge 文字

### P5-4 屏幕阅读器测试
- 使用 macOS VoiceOver 或 NVDA 测试核心流程：
  - 阅读博客文章
  - 提交留言
  - 管理后台操作

---

## P6 — 测试覆盖

### P6-1 API 路由单元测试
优先级从高到低：
1. `POST /api/auth/login` — 密码验证、rate limit、错误处理
2. `POST /api/posts` — 创建文章校验
3. `GET /api/search` — 搜索逻辑
4. `POST /api/guestbook` — 留言提交与 spam 检测
5. `POST /api/contact` — 联系表单

### P6-2 关键组件集成测试
1. `ThemeProvider` — 主题切换（已有）
2. `PostEditor` — Markdown 编辑器输入/预览
3. `GuestbookForm` — 提交流程
4. `SearchBar` — 搜索结果渲染

### P6-3 E2E 测试（Playwright）
核心流程：
1. 首页加载 → 点击文章 → 阅读全文
2. 管理员登录 → 创建文章 → 发布
3. 留言本提交 → 管理后台审核

---

## 执行路线图

```
第 1 周：P0（紧急安全/稳定性）
  ✓ 删 backup 文件
  ✓ 修 CSP
  ✓ Markdown XSS 审计
  ✓ Admin 列表加分页

第 2-3 周：P1（用户体验关键路径）
  ✓ 统一 loading/skeleton
  ✓ 补空状态 UI
  ✓ 建 Toast 系统
  ✓ 删除确认 Modal

第 4-5 周：P2 + P3（性能 + 代码质量）
  ✓ 图片 next/image 统一
  ✓ Monaco 懒加载
  ✓ 替换 console 为 logger
  ✓ localStorage SSR guard

第 6-8 周：P4（功能完善）
  ✓ 定时发布
  ✓ 版本历史
  ✓ PWA 补完

持续进行：P5（A11y）+ P6（测试）
```

---

## 技术债务一览（速查）

| 问题 | 数量 | 优先级 |
|------|------|--------|
| backup 文件 | 2 个 | P0 |
| console.error 调用 | 201 处 | P3 |
| localStorage 未 guard | ~86 处 | P3 |
| 原生 confirm/alert | 若干处 | P1 |
| 无分页大列表 | 4+ 个页面 | P0 |
| 无 skeleton 的加载状态 | ~10 个页面 | P1 |
| 无 E2E 测试 | — | P6 |
| CSP unsafe-eval | 1 处 | P0 |
| 原生 img 标签 | ~52 处 | P2 |
