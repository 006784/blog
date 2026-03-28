# Lumen 博客系统 · 全面升级方案

> 基于 2026-03-27 深度审计，面向企业级、精美、风格统一的目标制定

---

## 目录

1. [现状评分](#一现状评分)
2. [核心问题诊断](#二核心问题诊断)
3. [设计系统（Design System）](#三设计系统)
4. [功能完整性修复](#四功能完整性修复)
5. [UI/UX 全站统一改造](#五uiux-全站统一改造)
6. [工程质量提升](#六工程质量提升)
7. [性能优化](#七性能优化)
8. [安全与可访问性](#八安全与可访问性)
9. [实施路线图](#九实施路线图)
10. [验收标准](#十验收标准)

---

## 一、现状评分

| 维度 | 当前得分 | 目标得分 | 说明 |
|------|---------|---------|------|
| 功能完整性 | 72/100 | 95/100 | 新闻、Profile、代码沙箱等未完成 |
| UI 精美度 | 65/100 | 93/100 | 风格不够统一，部分页面设计粗糙 |
| 代码质量 | 70/100 | 90/100 | 122 处 console.log，测试覆盖率极低 |
| 性能 | 75/100 | 92/100 | 未做系统性优化 |
| 可访问性 | 85/100 | 95/100 | 库已完备但未全面应用 |
| 安全性 | 88/100 | 96/100 | 核心安全完备，末梢需补强 |
| **综合** | **76/100** | **94/100** | — |

---

## 二、核心问题诊断

### 2.1 未实现 / 未完成的功能

| 模块 | 问题 | 优先级 |
|------|------|-------|
| **新闻聚合** | `/api/news/test-simple` 全量使用 mock 数据，未对接真实源 | P0 |
| **Profile 页** | `src/app/profile/` 及 `src/lib/profile.ts` 未提交，功能未完成 | P0 |
| **代码沙箱** | `src/app/code/` 可能是 WIP，执行能力未验证 | P1 |
| **Collections** | 列表与详情页完整性存疑，CRUD 未充分测试 | P1 |
| **Practice 提交** | 测试用例关联、评测结果持久化不完整 | P1 |
| **Tools/Chat** | AI 多 Provider 对接状态不明，错误处理缺失 | P1 |
| **设备同步** | DeviceSync 服务存在，但端到端流程未验证 | P2 |
| **RSS / Feed** | 生成逻辑存在，但 OpenGraph 图片路径是占位符 | P2 |

### 2.2 UI / 视觉问题

- 各页面 **卡片尺寸、圆角、阴影、间距**不统一
- 暗色模式下部分组件对比度不足，颜色方案不一致
- 动效风格混乱（部分用 Framer Motion，部分用 CSS transition，部分无动效）
- 加载骨架屏（Skeleton）样式与实际内容差异过大
- 移动端导航遮罩、弹层 z-index 冲突
- 图标库混用（lucide-react 与 react-icons 共存），视觉风格不统一
- 字体粗细（font-weight）层级不清晰
- 按钮变体（primary / secondary / ghost / danger）样式定义不集中

### 2.3 工程债务

- **122 处 `console.log`** 遗留在 `src/app/` 中，可能泄露内部数据
- **测试覆盖率 < 5%**，仅 4 个测试文件共约 145 行
- API 错误响应格式不一致（部分返回字符串，部分返回对象）
- 部分 API 路由缺少 Zod 入参校验
- 未统一 API 响应结构（success/data/error 格式需标准化）
- OpenGraph / SEO 元数据中存在占位域名 `your-domain.com`

---

## 三、设计系统

> 这是全站统一的基础，必须优先建立。

### 3.1 色彩体系

建立统一的 CSS 变量，存放于 `src/styles/tokens.css`：

```css
:root {
  /* === 主色 === */
  --color-primary-50:  #f0f7ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-900: #1e3a8a;

  /* === 中性色 === */
  --color-neutral-50:  #f9fafb;
  --color-neutral-100: #f3f4f6;
  --color-neutral-200: #e5e7eb;
  --color-neutral-300: #d1d5db;
  --color-neutral-400: #9ca3af;
  --color-neutral-500: #6b7280;
  --color-neutral-600: #4b5563;
  --color-neutral-700: #374151;
  --color-neutral-800: #1f2937;
  --color-neutral-900: #111827;

  /* === 语义色 === */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error:   #ef4444;
  --color-info:    #06b6d4;

  /* === 表面色（亮色模式） === */
  --surface-base:    #ffffff;
  --surface-raised:  #f9fafb;
  --surface-overlay: #f3f4f6;
  --surface-sunken:  #e5e7eb;
  --border-default:  rgba(0,0,0,0.08);
  --border-strong:   rgba(0,0,0,0.16);
}

[data-theme="dark"] {
  --surface-base:    #0f1117;
  --surface-raised:  #1a1d27;
  --surface-overlay: #22263a;
  --surface-sunken:  #2d3148;
  --border-default:  rgba(255,255,255,0.08);
  --border-strong:   rgba(255,255,255,0.16);
}
```

### 3.2 间距系统

```css
:root {
  --space-1:  0.25rem;  /* 4px  */
  --space-2:  0.5rem;   /* 8px  */
  --space-3:  0.75rem;  /* 12px */
  --space-4:  1rem;     /* 16px */
  --space-5:  1.25rem;  /* 20px */
  --space-6:  1.5rem;   /* 24px */
  --space-8:  2rem;     /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

### 3.3 字体排版

```css
:root {
  /* 字号 */
  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;   /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg:   1.125rem;   /* 18px */
  --text-xl:   1.25rem;    /* 20px */
  --text-2xl:  1.5rem;     /* 24px */
  --text-3xl:  1.875rem;   /* 30px */
  --text-4xl:  2.25rem;    /* 36px */
  --text-5xl:  3rem;       /* 48px */

  /* 字重 */
  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;

  /* 行高 */
  --leading-tight:  1.25;
  --leading-snug:   1.375;
  --leading-normal: 1.5;
  --leading-relaxed:1.625;
  --leading-loose:  2;
}
```

### 3.4 圆角 & 阴影

```css
:root {
  --radius-sm:  0.25rem;   /* 4px  - 标签、小按钮 */
  --radius-md:  0.5rem;    /* 8px  - 输入框、小卡片 */
  --radius-lg:  0.75rem;   /* 12px - 普通卡片 */
  --radius-xl:  1rem;      /* 16px - 大卡片、弹层 */
  --radius-2xl: 1.5rem;    /* 24px - 全屏组件 */
  --radius-full:9999px;    /* 圆形 - 头像、徽章 */

  --shadow-xs:  0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:  0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05);
  --shadow-lg:  0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04);
  --shadow-xl:  0 20px 25px rgba(0,0,0,0.08), 0 8px 10px rgba(0,0,0,0.04);
  --shadow-2xl: 0 25px 50px rgba(0,0,0,0.12);
}
```

### 3.5 动效规范

```css
:root {
  --duration-instant: 50ms;
  --duration-fast:    150ms;
  --duration-normal:  250ms;
  --duration-slow:    400ms;
  --duration-slower:  600ms;

  --ease-default:  cubic-bezier(0.4, 0, 0.2, 1);  /* ease-in-out */
  --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1); /* 弹性 */
  --ease-out:      cubic-bezier(0, 0, 0.2, 1);
  --ease-in:       cubic-bezier(0.4, 0, 1, 1);
}
/* 规则：hover 交互 150ms；页面过渡 250ms；弹层/抽屉 400ms；禁止超过 600ms */
```

### 3.6 统一组件库规范

需要建立/统一的基础组件（放入 `src/components/ui/`）：

| 组件 | 变体 | 备注 |
|------|------|------|
| `Button` | primary / secondary / ghost / danger / link | 尺寸: sm / md / lg |
| `Card` | default / elevated / bordered / glass | 统一 padding / radius / shadow |
| `Badge` | solid / outline / soft | 颜色语义化 |
| `Input / Textarea` | default / error / disabled | 统一 focus ring |
| `Modal / Drawer` | — | 统一动效与遮罩 |
| `Tooltip` | — | 统一位置和延迟 |
| `Skeleton` | line / block / avatar / card | 与真实内容尺寸一致 |
| `Toast / Notification` | success / error / warning / info | 统一出现位置（右上角） |
| `Tabs` | underline / pills / boxed | — |
| `Dropdown / Select` | — | 统一样式 |

---

## 四、功能完整性修复

### P0 — 立即修复（影响生产可用性）

#### 4.1 清除 console.log（1-2天）

- 全局替换为 `import { logger } from '@/lib/logger'`
- 敏感路径（auth、API 路由）优先处理
- 在 ESLint 配置中加入 `no-console` 规则防止回归

```jsonc
// eslint.config.mjs 追加
{
  rules: {
    "no-console": ["error", { allow: ["warn", "error"] }]
  }
}
```

#### 4.2 修复 OpenGraph / SEO 占位符（0.5天）

- `src/app/page.tsx` 及所有 `metadata` 中的 `your-domain.com` 替换为真实域名
- 生成真实的 OG 图片（可使用 Next.js `ImageResponse`）

#### 4.3 Profile 功能完成（3-5天）

`src/app/profile/` 和 `src/lib/profile.ts` 需要完成：
- [ ] 个人信息展示页（头像、简介、社交链接、统计）
- [ ] 个人信息编辑（仅登录用户）
- [ ] Profile API (`GET /api/profile`, `PATCH /api/profile`)
- [ ] 头像上传（对接 R2 存储）

#### 4.4 新闻聚合完成（3-5天）

- [ ] 替换 mock 数据为真实 RSS/API 订阅源
- [ ] 参考 `docs/enhanced-news-system.md` 实现完整方案
- [ ] 完成 Admin 新闻管理页面 (`src/app/admin/news/`)
- [ ] 定时拉取（cron 或 Vercel Cron Jobs）
- [ ] 分类过滤、已读标记

### P1 — 2-4周内完成

#### 4.5 API 响应格式标准化

统一所有 API 路由的响应结构：

```typescript
// src/lib/api-response.ts
export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
};

export function ok<T>(data: T, meta?: ApiResponse['meta']): ApiResponse<T> {
  return { success: true, data, ...(meta && { meta }) };
}

export function fail(code: string, message: string, status = 400): never {
  // throws NextResponse
}
```

#### 4.6 Practice 功能补全

- [ ] 评测结果持久化到 Supabase
- [ ] 解题历史记录页
- [ ] 题目管理 Admin 页面
- [ ] 代码模板（多语言默认代码）
- [ ] 测试用例编辑器（Admin）

#### 4.7 Collections 完整 CRUD

- [ ] 验证列表页 + 详情页均有数据
- [ ] 创建/编辑/删除收藏集
- [ ] 收藏集封面图片上传
- [ ] 将文章加入/移出收藏集

#### 4.8 代码沙箱验证与完善

- [ ] 验证 Piston API 对接正常
- [ ] 添加支持的语言列表展示
- [ ] 添加执行超时与错误展示
- [ ] 代码分享功能（生成短链）

### P2 — 4-8周内完成

#### 4.9 Tools/Chat AI 多 Provider

- [ ] 统一 Provider 切换 UI
- [ ] 错误处理（API 限流、超时、余额不足）
- [ ] 对话历史持久化
- [ ] 支持 Markdown 渲染回复

#### 4.10 设备同步端到端验证

- [ ] 完整测试 DeviceSync 服务
- [ ] 冲突解决策略文档化
- [ ] 同步状态 UI 指示器

---

## 五、UI/UX 全站统一改造

### 5.1 导航栏（Navbar）

**目标**：干净、优雅、信息密度合理

- [ ] 固定高度 64px（桌面）/ 56px（移动）
- [ ] 滚动后添加毛玻璃效果（`backdrop-blur-lg` + 半透明背景）
- [ ] 活跃链接使用底部高亮线条而非背景色
- [ ] 移动端汉堡菜单改为全屏侧拉抽屉（460ms 弹性动效）
- [ ] 搜索图标点击展开行内搜索框（不跳转页面）
- [ ] 头像下拉菜单：登录状态 / 管理后台入口

### 5.2 首页（Home）

**目标**：令人印象深刻的第一屏，清晰传达站点价值

- [ ] Hero 区：大标题 + 副标题 + CTA 按钮组，背景使用精细粒子或渐变网格
- [ ] 精选文章区：3列卡片，卡片有封面图、分类色标、阅读时间
- [ ] "最近更新"时间轴：最新 5 条跨模块动态（博客/日记/收藏/音乐）
- [ ] 统计数字展示区（文章数、日记数、总字数），数字有滚动动效
- [ ] 底部快速导航到主要功能

### 5.3 博客列表页

- [ ] 顶部全宽 Featured 文章横幅（轮播或单篇精选）
- [ ] 右侧浮动 TOC / 快速跳转（桌面端）
- [ ] 卡片统一尺寸：封面图 16:9，标题 2 行截断，摘要 3 行截断
- [ ] 分类标签改为彩色圆点 + 文字（每个分类固定颜色）
- [ ] 分页改为"加载更多"按钮（首屏 10 篇，每次 +6）
- [ ] 骨架屏尺寸与卡片完全一致

### 5.4 文章详情页

- [ ] 顶部封面大图（全宽，高度 45vh，渐变遮罩）
- [ ] 阅读进度条（顶部细线，蓝色）
- [ ] 左侧悬浮 TOC（桌面 ≥ 1280px 时显示）
- [ ] 代码块：深色主题，语言标签，一键复制按钮，行号
- [ ] 文章底部：上一篇/下一篇卡片、相关文章（3篇）、互动区（点赞/收藏/分享）
- [ ] 评论区（Giscus）加载前显示 Skeleton

### 5.5 日记系统

- [ ] 日历视图：每天的情绪色块更精致（使用渐变而非纯色）
- [ ] 编辑器：工具栏固定在顶部，全屏写作模式
- [ ] 情绪标签选择器：图标 + 颜色 + 动效（点击时微弹）
- [ ] 日记详情：手写体字体渲染（已有服务，需连接 UI）
- [ ] 情绪报告页：使用 Recharts / Chart.js 绘制精美图表

### 5.6 音乐播放器

- [ ] 底部全宽迷你播放栏（固定，高度 72px，毛玻璃）
- [ ] 封面图放大时使用模糊背景色提取算法
- [ ] 歌词滚动：活跃行放大高亮，过渡动效流畅
- [ ] 歌曲列表支持拖拽排序

### 5.7 仪表板 / 管理后台

- [ ] 侧边栏改为收缩式（图标模式 64px / 展开模式 220px）
- [ ] 数据卡片加入趋势箭头（7天对比）
- [ ] 表格组件统一：排序、筛选、分页、批量操作
- [ ] 操作确认弹层统一样式
- [ ] 成功/失败 Toast 位置固定右上角

### 5.8 统一空状态 & 错误状态

每个列表页必须有：

```
空状态（Empty State）:
  - 插图（SVG，风格与站点一致）
  - 简短说明文字
  - 操作按钮（如"写第一篇文章"）

错误状态（Error State）:
  - 错误图标
  - 用户友好的错误说明
  - "重试"按钮（重新发请求）
  - 如有必要，提供联系支持入口

加载状态（Loading State）:
  - 与内容尺寸完全一致的 Skeleton
  - 动画使用 pulse（1.5s）而非 spin
```

### 5.9 移动端专项优化

- [ ] 底部导航栏（Tab Bar）：首页/博客/日记/搜索/我的，5个核心功能
- [ ] 所有弹层改为从底部弹起的 Sheet
- [ ] 列表页去掉侧边栏，改为顶部水平滚动的筛选 Chip
- [ ] 图片懒加载 + Blur Placeholder
- [ ] 触摸反馈：所有可点击元素加 `active:scale-95`

---

## 六、工程质量提升

### 6.1 测试体系建立

**目标：覆盖率达到 60%+**

```
测试分层:
├── 单元测试（Jest + RTL）      目标 40% 覆盖
│   ├── lib/ 所有工具函数
│   ├── components/ui/ 基础组件
│   └── API 路由 handler 逻辑
├── 集成测试（Jest + MSW）      目标 15% 覆盖
│   ├── auth 完整流程
│   ├── 博客 CRUD
│   └── 日记核心操作
└── E2E 测试（Playwright）      目标 5% 覆盖
    ├── 登录 → 发布文章 → 退出
    ├── 日记创建 → 情绪选择 → 保存
    └── 搜索 → 结果展示
```

优先测试文件清单：
1. `src/lib/security.test.ts` — CSRF、XSS 过滤
2. `src/lib/auth-server.test.ts` — token 验证
3. `src/app/api/posts/route.test.ts` — CRUD
4. `src/app/api/auth/login/route.test.ts` — 认证流程
5. `src/components/ui/Button.test.tsx` — 基础组件
6. `src/lib/diary/emotion-analytics-service.test.ts` — 情绪分析

### 6.2 统一错误处理

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: unknown
  ) {
    super(message);
  }
}

// 所有 API 路由使用统一 try/catch wrapper
export function withApiHandler<T>(
  handler: (req: Request) => Promise<T>
) {
  return async (req: Request) => {
    try {
      const result = await handler(req);
      return NextResponse.json(ok(result));
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          fail(err.code, err.message),
          { status: err.status }
        );
      }
      logger.error('Unhandled API error', { err });
      return NextResponse.json(
        fail('INTERNAL_ERROR', '服务器内部错误'),
        { status: 500 }
      );
    }
  };
}
```

### 6.3 代码规范强化

追加 ESLint 规则：

```jsonc
{
  "rules": {
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "import/order": ["error", { "groups": ["builtin","external","internal","parent","sibling"] }],
    "react-hooks/exhaustive-deps": "error"
  }
}
```

### 6.4 类型安全增强

- [ ] 为所有 Supabase 查询添加 `Database` 泛型类型（使用 `supabase gen types`）
- [ ] 所有 API 路由的请求体使用 Zod schema 验证
- [ ] 移除所有 `any` 类型（当前约 30+ 处）
- [ ] 为所有公共 API 函数添加 JSDoc 注释

---

## 七、性能优化

### 7.1 图片优化

- [ ] 所有 `<img>` 替换为 `<Image>` (next/image)
- [ ] 为所有图片添加 `placeholder="blur"` + `blurDataURL`
- [ ] 封面图使用 AVIF 格式（next.config.ts 已配置，需验证）
- [ ] 图片懒加载超出首屏的图片

### 7.2 Bundle 优化

```typescript
// next.config.ts 优化项
{
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
      '@radix-ui/react-*',
    ],
  },
}
```

- [ ] 分析 Bundle：`ANALYZE=true npm run build`
- [ ] 将 Monaco Editor 改为动态导入（dynamic import）
- [ ] 将 Framer Motion 改为按需导入
- [ ] Chart 库改为动态导入

### 7.3 数据获取优化

- [ ] 首页 ISR 已配置（60s），验证其他高频页面同样配置
- [ ] API 路由添加适当的 Cache-Control 头
- [ ] 使用 React 19 的 `use()` + Suspense 替换 loading state 手写
- [ ] 博客列表页使用 Infinite Query（react-query 或 SWR）

### 7.4 关键渲染路径

- [ ] 字体使用 `font-display: swap` + preload
- [ ] 首屏关键 CSS 内联（Tailwind 已自动处理）
- [ ] 去除渲染阻塞的第三方脚本（Giscus 改为延迟加载）

---

## 八、安全与可访问性

### 8.1 安全补强

- [ ] 所有上传接口验证文件类型（MIME + 魔数双重验证）
- [ ] API 路由统一添加 `withRateLimit` wrapper
- [ ] 日记、Profile 等私有 API 验证登录态
- [ ] 依赖审计：`npm audit` 修复所有 high/critical
- [ ] `next.config.ts` 中 CSP 策略从 `report-only` 改为强制执行

### 8.2 可访问性完善

- [ ] 所有图片添加有意义的 `alt` 文字
- [ ] 所有图标按钮添加 `aria-label`
- [ ] 颜色对比度检查（使用 axe DevTools 扫描）
- [ ] 键盘导航测试：Tab 顺序合理，Focus ring 清晰可见
- [ ] 动效尊重 `prefers-reduced-motion`（已有工具，验证所有动效均使用）

---

## 九、实施路线图

### 第一阶段：基础建设（第 1-2 周）

优先级最高，其他工作的前提：

```
Week 1:
  Day 1-2:  建立设计 Token 系统（tokens.css）
  Day 2-3:  统一基础组件库（Button、Card、Badge、Input、Modal、Toast）
  Day 4:    清除全部 console.log，加入 ESLint no-console 规则
  Day 5:    统一 API 响应格式（ApiResponse 类型 + wrapper）

Week 2:
  Day 1-2:  完成 Profile 功能
  Day 3-4:  修复 SEO 占位符，完善所有 metadata
  Day 5:    补全新闻功能对接真实数据源
```

### 第二阶段：UI 统一改造（第 3-5 周）

```
Week 3:  导航栏、首页、博客列表页
Week 4:  文章详情页、日记系统、音乐播放器
Week 5:  管理后台、统一空状态/错误状态、移动端专项
```

### 第三阶段：功能补全（第 4-6 周）

```
Week 4-5: Practice 完善、Collections CRUD、代码沙箱
Week 5-6: Tools/Chat 完善、设备同步验证
```

### 第四阶段：工程质量（第 5-7 周）

```
Week 5:  单元测试补充（目标关键模块 > 50%）
Week 6:  集成测试 + E2E 框架搭建
Week 7:  性能优化、Bundle 分析、图片优化
```

### 第五阶段：审计与上线（第 7-8 周）

```
Week 7:  安全审计（API 全扫描）、可访问性扫描
Week 8:  性能基准测试、灰度上线、监控告警配置
```

---

## 十、验收标准

### 功能验收

- [ ] 所有 P0 问题已修复并有测试覆盖
- [ ] 14 个主要功能模块（博客/日记/音乐/画廊/留言/练习/工具/新闻/Profile/Collections/代码沙箱/时间轴/资源/管理）均可正常使用
- [ ] 移动端（375px）所有页面无横向滚动、无遮挡

### 视觉验收

- [ ] 任意 3 个页面截图，色彩/字体/间距/圆角视觉一致
- [ ] 暗色模式下对比度全部通过 WCAG AA 标准
- [ ] 所有列表页有加载态、空态、错误态

### 性能验收（Lighthouse CI）

| 指标 | 目标 |
|------|------|
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 95 |
| LCP | ≤ 2.5s |
| FID | ≤ 100ms |
| CLS | ≤ 0.1 |

### 工程验收

- [ ] `npm run build` 零 warning
- [ ] `npm run lint` 零 error
- [ ] `npm run test` 覆盖率 ≥ 60%
- [ ] `npm audit` 无 high/critical 漏洞
- [ ] 无残留 `console.log`（CI 检查）

---

## 附录：文件改动预估

| 改动类型 | 预估文件数 | 说明 |
|---------|-----------|------|
| 新建设计 Token 文件 | 1 | `src/styles/tokens.css` |
| 新建/重构基础组件 | 10-15 | `src/components/ui/` |
| 修改现有组件（UI统一） | 40-50 | 引用新 token 和组件 |
| 修复未完成功能 | 15-20 | Profile、新闻、Collections 等 |
| 新增测试文件 | 20-30 | 覆盖核心模块 |
| 修改 API 路由（统一格式） | 30-40 | 使用 ApiResponse wrapper |
| 配置文件修改 | 3-5 | ESLint、next.config、tsconfig |

**预计总工作量：6-8 周（单人全职）**

---

*文档版本：v1.0 | 生成日期：2026-03-27 | 下次评审：第一阶段结束后*
