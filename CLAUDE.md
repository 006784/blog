# 拾光博客 · CLAUDE.md

Claude Code 项目上下文文件。每次对话开始时自动加载，供 AI 理解项目全貌。

---

## 项目概览

**名称**：拾光（Lumen）
**域名**：https://www.artchain.icu
**定位**：日系杂志风格的个人博客，记录生活、技术与创作
**Slogan**：在文字中拾起生活的微光
**作者**：李诗雅（Lumen）

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 框架 | Next.js 16.2.1（App Router） |
| 语言 | TypeScript 5，React 19.2.0 |
| 样式 | Tailwind CSS v4（`@import "tailwindcss"`，无 tailwind.config.ts） |
| 数据库 | Supabase（PostgreSQL + Storage + RLS） |
| 文件存储 | Cloudflare R2（S3 兼容），AWS SDK v3 |
| 部署 | Vercel |
| 认证 | httpOnly Cookie + JWT（jose），TOTP，WebAuthn/Passkey，邮箱验证码 |
| 邮件 | Resend |
| 监控 | Sentry |
| 测试 | Jest + @testing-library/react |
| 动画 | Framer Motion |
| 图标 | Lucide React |
| Markdown | react-markdown + remark-gfm + PrismJS |
| 图表 | Recharts |
| 代码编辑器 | @monaco-editor/react |
| 音乐搜索 | Audius API |
| 人机验证 | Cloudflare Turnstile |
| 评论 | Giscus（基于 GitHub Discussions，可选配置） |
| 通知 | Sonner（toast） |
| 搜索快捷键 | Cmd+K → CommandPalette |

---

## 设计系统

### 主题：日系杂志风格（和风 × 极简）

整体氛围：纸质感底色 × 金褐色主色调 × 衬线字体 × 克制留白。

### 颜色（CSS 自定义属性，定义在 `src/styles/tokens.css`）

**浅色模式（light）**
```
--surface-base:    #fff7f2   ← 暖白纸底
--surface-raised:  #fdf0e7   ← 卡片底色
--surface-panel:   rgba(255,250,245,0.88)  ← 半透明面板

--color-primary-500: #e99a69  ← 金棕色（主色，即 --gold）
--color-primary-700: #b86443

--color-neutral-900: #2d1e17  ← 主文字色（深墨色）
--color-neutral-600: #6b4c3b  ← 次文字色
```

**深色模式（dark）**
```
--surface-base:    #181311   ← 深墨底
--surface-raised:  #231b19
--color-primary-500: #f0be9a  ← 浅金色（暗模式主色）
```

**语义别名（定义在 `globals.css :root`）**
```
--paper      → --surface-base（纸底）
--ink        → --color-neutral-900（墨水色，主文字）
--gold       → --color-primary-500（金色，强调/active状态）
--line       → --color-neutral-300（分割线）
```

### 字体

```css
--font-mincho:   'Shippori Mincho', 'Noto Serif SC', serif   ← 日系明朝体，用于标题/装饰
--font-jp-serif: 'Noto Serif JP', 'Noto Serif SC', serif      ← 日系衬线正文
--font-garamond: 'Cormorant Garamond', 'Georgia', serif       ← 英文衬线（栏目标签/kana装饰）
--font-inter:    'Inter', -apple-system, ...                  ← UI 数字/英文辅助
--font-mono:     'JetBrains Mono', 'Fira Code', ...           ← 代码
```

字体通过 Google Fonts 加载（在 `layout.tsx` head 内 `<link>` 标签直接引入，非 `next/font`）。

### 圆角

```css
--radius-sm: 0.375rem   --radius-md: 0.625rem
--radius-lg: 0.875rem   --radius-xl: 1.125rem
--radius-2xl: 1.5rem    --radius-full: 9999px
```

### 导航 kana 装饰

侧边栏每个导航项都有一个日文汉字/假名装饰，例如：
首页→光、博客→文、日记→記、相册→影、音乐→音、AI→AI。
这是核心设计语言，**不要删除**。

### 布局结构

- **侧边栏**（`Sidebar.tsx`）：桌面端固定在左侧，宽度约 52px（折叠）；移动端底部抽屉 + 汉堡菜单
- **主内容区**（`<main>`）：`md:ml-[var(--sidebar-width,52px)]`，底部预留移动导航高度
- **写作页**（`/write`）：`fixed inset-0 z-50`，三栏布局（左：元数据侧边栏 260px / 中：编辑器 / 右：预览 320px）
- **管理后台**（`/admin`）：桌面端左侧垂直标签栏 + 内容区；移动端水平滚动标签栏

---

## 文件夹结构

```
/
├── CLAUDE.md               ← 本文件
├── .env.example            ← 环境变量模板
├── next.config.ts          ← Next.js 配置（图片优化/安全头/ISR）
├── package.json
├── docs/                   ← 技术文档、SQL schema、升级计划
│   ├── schema.sql          ← 主数据库 schema（含 RLS 策略）
│   ├── admin-auth-schema.sql
│   ├── upgrade-plan.md
│   └── ...
├── supabase/
│   └── migrations/         ← 增量数据库迁移文件
└── src/
    ├── middleware.ts        ← （不存在，安全逻辑全在 API Route 层）
    ├── styles/
    │   └── tokens.css      ← 设计 token（颜色、字重、圆角、间距）
    ├── app/
    │   ├── globals.css     ← 全局样式（Tailwind v4 入口 + 设计系统语义 token）
    │   ├── layout.tsx      ← 根布局（字体、Sidebar、Footer、Provider 树）
    │   ├── page.tsx        ← 首页（服务端，ISR revalidate=60）
    │   ├── page.client.tsx ← 首页客户端组件
    │   ├── template.tsx    ← 页面切换动画
    │   ├── blog/
    │   │   ├── page.tsx           ← 博客列表页
    │   │   └── [slug]/
    │   │       ├── page.tsx       ← 文章页（服务端，生成 metadata）
    │   │       └── page-client.tsx ← 文章渲染客户端（Markdown/PrismJS/TOC）
    │   ├── write/
    │   │   ├── page.tsx           ← 写文章（桌面三栏 + RichEditor，仅管理员）
    │   │   └── mobile/page.tsx    ← 写文章移动端版本（MobileEditor）
    │   ├── diary/page.tsx         ← 日记页（日历/时间轴/编辑器/搜索/报告，仅管理员）
    │   ├── gallery/page.tsx       ← 相册（瀑布流/网格，Lightbox 预览）
    │   ├── music/page.tsx         ← 歌单（MusicPlayer）
    │   ├── guestbook/page.tsx     ← 留言板
    │   ├── about/page.tsx         ← 关于页
    │   ├── contact/page.tsx       ← 联系页（Turnstile 人机验证）
    │   ├── archive/page.tsx       ← 文章归档（按年月）
    │   ├── collections/
    │   │   ├── page.tsx           ← 文章合集列表
    │   │   └── [id]/page.tsx      ← 单个合集详情
    │   ├── timeline/page.tsx      ← 人生时间线
    │   ├── media/page.tsx         ← 书影音记录
    │   ├── uses/page.tsx          ← 工具箱（硬件/软件/服务）
    │   ├── resources/page.tsx     ← 资源库
    │   ├── links/page.tsx         ← 友情链接
    │   ├── dashboard/page.tsx     ← 数据看板（仅管理员）
    │   ├── now/page.tsx           ← /now 页（此刻在做什么）
    │   ├── practice/page.tsx      ← 算法练习题库（含在线代码执行）
    │   ├── code/page.tsx          ← 代码运行沙箱（Monaco Editor）
    │   ├── tools/ciyuan/          ← AI 写作助手（词元，接入多种 LLM）
    │   ├── profile/page.tsx       ← 个人资料设置（仅管理员）
    │   ├── security-demo/         ← 安全演示页
    │   ├── admin/
    │   │   ├── page.tsx           ← 管理后台（文章/照片/日记/相册/统计/安全标签）
    │   │   ├── login/page.tsx     ← 管理员登录（邮箱验证码 + Passkey）
    │   │   ├── media/page.tsx     ← 媒体管理
    │   │   ├── collections/page.tsx ← 合集管理
    │   │   ├── timeline/page.tsx  ← 时间线管理
    │   │   ├── uses/page.tsx      ← 工具箱管理
    │   │   ├── news/page.tsx      ← 新闻聚合管理
    │   │   ├── now/page.tsx       ← /now 内容管理
    │   │   └── totp-setup/page.tsx ← TOTP 二步验证设置
    │   └── api/                   ← 所有 API Route（见下方）
    ├── components/
    │   ├── Sidebar.tsx            ← 核心导航组件
    │   ├── AdminProvider.tsx      ← 全局管理员状态（isAdmin/loading/showLoginModal/logout）
    │   ├── ProfileProvider.tsx    ← 全局用户资料（头像/名字/签名）
    │   ├── ThemeProvider.tsx      ← next-themes 封装
    │   ├── FontProvider.tsx       ← 字体设置（用户可切换）
    │   ├── ErrorBoundary.tsx      ← 全局错误边界
    │   ├── RichEditor.tsx         ← 桌面富文本编辑器（Markdown + AI 优化 + 图片上传）
    │   ├── MobileEditor.tsx       ← 移动端简化编辑器
    │   ├── MusicPlayer.tsx        ← 音乐播放器（mini + 全屏）
    │   ├── BlogCard.tsx           ← 博客文章卡片（日系杂志风格）
    │   ├── ImageUploader.tsx      ← 图片上传组件（支持 R2/Supabase）
    │   ├── GiscusComments.tsx     ← 评论系统（Giscus）
    │   ├── TableOfContents.tsx    ← 文章目录
    │   ├── ShareButtons.tsx       ← 分享按钮
    │   ├── PostInteractions.tsx   ← 点赞/收藏
    │   ├── ParticleBackground.tsx ← 粒子动画背景
    │   ├── EnhancedSearch.tsx     ← 增强搜索
    │   ├── CommandPalette.tsx     ← Cmd+K 搜索面板（在 search/ 子目录）
    │   ├── DiaryFeaturePanel.tsx  ← 日记功能面板（dynamic import 多个重型组件）
    │   ├── PasskeyManager.tsx     ← Passkey 管理 UI
    │   ├── SubscribeForm.tsx      ← 邮件订阅表单
    │   ├── Turnstile.tsx          ← Cloudflare 人机验证
    │   ├── diary/
    │   │   └── DiaryEditor.tsx    ← 日记编辑器（含公开/私密切换）
    │   ├── ui/                    ← 基础 UI 组件
    │   │   ├── Badge.tsx          ← 标签徽章
    │   │   ├── Button.tsx         ← 按钮（variant: primary/secondary/ghost/link）
    │   │   ├── Card.tsx           ← 卡片（variant: default/elevated）
    │   │   ├── ConfirmDialog.tsx  ← 全局确认弹窗（module-level callback 模式）
    │   │   ├── Input.tsx / Textarea.tsx / Skeleton.tsx
    │   │   ├── StatePanel.tsx     ← 空态/错误/加载占位面板（tone: empty/error/info）
    │   │   └── KanaDeco.tsx       ← 日文假名装饰组件
    │   └── practice/             ← 算法练习相关组件
    ├── lib/
    │   ├── supabase.ts            ← Supabase 客户端 + 所有数据库操作函数
    │   ├── sample-posts.ts        ← 演示文章数据 + filterRenderablePosts
    │   ├── auth-server.ts         ← 服务端认证（JWT 签发/验证，httpOnly cookie）
    │   ├── auth-edge.ts           ← Edge 兼容认证（middleware 用）
    │   ├── admin-token.ts         ← 管理员 token 工具
    │   ├── admin-email-login.ts   ← 邮箱验证码登录
    │   ├── passkeys.ts            ← WebAuthn/Passkey 操作
    │   ├── post-persistence.ts    ← 文章写入（createPostRecord/updatePostRecord）
    │   ├── post-api-client.ts     ← 前端调用 /api/posts 的封装
    │   ├── storage.ts             ← R2/Supabase Storage 上传
    │   ├── site-config.ts         ← 站点配置（url/name/description）
    │   ├── seo.ts                 ← 结构化数据生成（Article/WebSite/BreadcrumbList）
    │   ├── sample-posts.ts        ← 演示文章 + isRenderablePublicPost 过滤器
    │   ├── toast.ts               ← showToast 封装（Sonner）
    │   ├── confirm.ts             ← showConfirm 全局确认弹窗
    │   ├── auto-format.ts         ← Markdown 自动格式化
    │   ├── ciyuan-providers.ts    ← AI 提供商配置（OpenAI/DeepSeek/Gemini 等）
    │   ├── diary/                 ← 日记功能服务层
    │   │   ├── search-service.ts
    │   │   ├── emotion-analytics-service.ts
    │   │   ├── writing-habits-service.ts
    │   │   ├── smart-reminder-service.ts
    │   │   ├── data-export-service.ts
    │   │   ├── device-sync-service.ts
    │   │   ├── template-service.ts
    │   │   └── ...
    │   ├── news/                  ← 新闻聚合系统（RSS 收集 + 翻译）
    │   └── types.ts / types/      ← 类型定义
    └── hooks/
        ├── useDebounce.ts
        └── useDiaryAutoSave.ts
```

---

## API Route 清单

所有路由在 `src/app/api/` 下，以下为主要分组：

| 分组 | 路径 | 说明 |
|------|------|------|
| 认证 | `/api/auth/login` `/api/auth/logout` `/api/auth/me` `/api/auth/refresh` | 密码/JWT 登录登出 |
| 邮箱登录 | `/api/auth/email/request` `/api/auth/email/verify` | 邮箱验证码登录 |
| TOTP | `/api/auth/totp/setup` `/api/auth/totp/verify` | 二步验证 |
| Passkey | `/api/auth/passkey/register/*` `/api/auth/passkey/authenticate/*` `/api/auth/passkey/credentials/*` | WebAuthn |
| 会话 | `/api/auth/sessions` | 活跃会话管理 |
| 文章 | `/api/posts` `/api/posts/[id]` | 创建/更新文章（需管理员） |
| 日记 | `/api/diaries` `/api/diaries/[id]` `/api/diary/*` | 日记 CRUD |
| 相册 | `/api/gallery/photos` `/api/gallery/albums` | 照片/相册管理 |
| 音乐 | `/api/music/songs` `/api/music/upload` `/api/music/audius/search` | 歌单管理 |
| 媒体 | `/api/media` `/api/media/[id]` | 书影音记录 |
| 合集 | `/api/collections` | 文章合集 |
| 留言 | `/api/guestbook` | 留言板 |
| 订阅 | `/api/subscribe` `/api/notify` | 邮件订阅/发布通知 |
| 搜索 | `/api/search` | 全站搜索 |
| 统计 | `/api/stats` | 数据统计 |
| 时间线 | `/api/timeline` | 人生时间线 |
| 工具箱 | `/api/uses` | Uses 条目 |
| 资源 | `/api/resources` | 资源库 |
| 友链 | `/api/links` | 友情链接 |
| 新闻 | `/api/news/*` | 新闻聚合 |
| 上传 | `/api/upload` `/api/resources/presign` | 文件上传 |
| OG | `/api/og` | 动态 OG 图生成 |
| 练习 | `/api/practice/*` | 算法题库 + 代码执行 |
| AI 工具 | `/api/tools/chat` | 词元 AI 对话 |
| 系统 | `/api/health` `/api/rss` `/feed.xml` | 健康检查/RSS |

---

## 数据库（Supabase）

主要表（定义在 `docs/schema.sql`）：

| 表 | 说明 | RLS |
|----|------|-----|
| `posts` | 文章（status: draft/published，含 is_pinned/collection_id） | SELECT: status=published 公开；写入需 authenticated |
| `diaries` | 日记（is_public 控制可见性，有情绪/天气/位置等字段） | 仅 authenticated 可读写 |
| `photos` | 相册照片 | SELECT 公开；写入需 authenticated |
| `albums` | 相册分组 | 同上 |
| `collections` | 文章合集 | SELECT 公开；写入需 authenticated |
| `songs` / `playlists` | 音乐歌单 | SELECT 公开 |
| `guestbook` | 留言 | SELECT 公开；INSERT 公开 |
| `timeline_events` | 时间线事件 | SELECT 公开；写入需 authenticated |
| `uses` | 工具箱条目 | SELECT 公开 |
| `media_entries` | 书影音记录 | SELECT 公开 |
| `links` | 友链 | SELECT 公开 |
| `admin_sessions` | 管理员会话（JWT refresh token） | 仅 service_role |
| `passkey_credentials` | WebAuthn 凭证 | 仅 service_role |
| `subscribers` | 邮件订阅者 | 仅 service_role |

迁移文件在 `supabase/migrations/`：
- `20260215_add_environment_data_to_diaries.sql` - 日记增加环境数据字段
- `20260220_add_post_pinning.sql` - 文章置顶功能
- `20260325_create_timeline_events.sql` - 时间线表

---

## 认证体系

管理员认证有三种方式（均支持，均生成同一 httpOnly JWT Cookie）：

1. **邮箱验证码**：输入 `ADMIN_EMAIL`（支持多邮箱 `ADMIN_EMAILS`）→ 发送验证码到邮箱 → 填写验证码登录
2. **Passkey（WebAuthn）**：无密码，设备生物识别
3. **TOTP**：两步验证（可在 `/admin/totp-setup` 开启）

Session 使用 JWT Access Token（1h）+ Refresh Token（7d），存储在 httpOnly Cookie（`admin_access` / `admin_refresh`）。

`useAdmin()` hook 暴露：`{ isAdmin, loading, role, showLoginModal, logout, logoutAll }`

`showLoginModal()` 实际是跳转 `/admin/login?redirect=当前路径`（非弹窗，因为 cookie 机制需要完整页面导航）。

---

## 页面功能详情

### 博客（`/blog`、`/write`）

- 列表：支持按分类/合集/搜索筛选，卡片显示封面/标题/摘要/阅读时间
- 文章页：Markdown 渲染（PrismJS 语法高亮）+ TOC + 点赞 + Giscus 评论 + 分享
- 写作页（`/write`）：三栏布局（仅桌面），左栏=元数据（标题/描述/分类/标签/封面/合集/SEO），中栏=RichEditor，右栏=实时预览
- 写作页（`/write/mobile`）：移动端简化版，MobileEditor
- **关键**：`isRenderablePostRecord`（`supabase.ts`）和 `isRenderablePublicPost`（`sample-posts.ts`）只检查 status=published + slug/title/created_at 非空，**不要求 description 非空**（已修复）

### 日记（`/diary`）

- 视图切换：日历、时间轴、编辑器、搜索、报告（5种）
- 编辑器支持：富文本/Markdown、公开/私密、情绪/天气/位置、标签
- 功能面板（dynamic import，避免首屏加载）：情绪分析、写作习惯统计、智能提醒、数据导出、全文搜索
- 仅管理员可访问（写入）

### 相册（`/gallery`）

- 双模式：瀑布流（masonry）/ 网格
- Lightbox 预览：全屏黑背景，加载 spinner，上下张导航（键盘左右键），底部元信息
- 管理员可上传（MultiImageUploader）/ 编辑 / 删除

### 管理后台（`/admin`）

标签页：概览、文章、照片、日记、相册、统计、练习题库、安全（会话管理/Passkey/TOTP）

### 词元 AI（`/tools/ciyuan`）

- 可配置多种 AI 提供商（OpenAI/DeepSeek/Gemini/Claude 等）
- 用户可在 localStorage 存储自己的 API Key
- 在 RichEditor 中也有 AI 写作辅助（改写/生成摘要）

---

## 重要代码模式

### 管理员权限检查

```tsx
const { isAdmin, loading: adminLoading } = useAdmin();
if (adminLoading) return <Spinner />;
if (!isAdmin) return <LoginGate />;
```

### 全局确认弹窗

```tsx
import { showConfirm } from '@/lib/confirm';
const ok = await showConfirm({ title: '确认删除', description: '此操作不可撤销' });
if (ok) doDelete();
```

### Toast 通知

```tsx
import { showToast } from '@/lib/toast';
showToast.success('保存成功');
showToast.error('操作失败');
```

### 文章过滤（核心逻辑）

- `isRenderablePostRecord`（`src/lib/supabase.ts`）：供 `getPublishedPosts` 使用，过滤 status/slug/title/created_at/updated_at
- `isRenderablePublicPost`（`src/lib/sample-posts.ts`）：供博客列表页前端过滤使用，条件相同
- **两处都不要求 description 非空**，否则无摘要的文章会从列表和详情页消失

### 动态导入（避免首屏过重）

```tsx
const RichEditor = dynamic(() => import('@/components/RichEditor').then(m => m.RichEditor), { ssr: false });
const MusicPlayer = dynamic(() => import('@/components/MusicPlayer'), { ssr: false });
// DiaryFeaturePanel 内 5 个组件全部 dynamic import
```

### 图片优化

- `next/image` 全站统一使用，支持 WebP/AVIF 自动转换
- 远程图片源：Supabase Storage、Cloudflare R2、Unsplash、DiceBear
- 例外：blob URL（头像预览）保留 `<img>` 标签

---

## 已知偏好与规范

1. **风格**：日系杂志，克制，不要花哨。CSS variable 使用语义名（`--paper`/`--ink`/`--gold`/`--line`）
2. **Tailwind v4**：使用 `@import "tailwindcss"` + `@theme inline`，无配置文件。`hidden md:flex` 在 v4 中 `hidden` 可能优先级高于 `md:flex`，应避免混用，改用条件渲染或 `max-md:hidden`
3. **响应式**：移动端和桌面端差异大的页面（如 `/write`）用 JS 状态（`isMobile`）分支渲染，而不是纯 CSS 响应式
4. **不需要 description**：文章没有摘要也要能正常发布和查看
5. **颜色引用**：在 JSX 内联样式中用 `var(--gold)` / `var(--ink)` / `var(--paper)`，而不是写死颜色值
6. **Sonner**：toast 通知用 `showToast`（`src/lib/toast.ts`），不直接调用 Sonner API
7. **确认弹窗**：用 `showConfirm`（`src/lib/confirm.ts`），module-level callback 模式，非组件内 state

---

## 环境变量（必填 vs 可选）

**必填**（服务无法启动）：
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_PASSWORD
ADMIN_EMAIL
JWT_SECRET
```

**可选（影响部分功能）**：
```
ADMIN_EMAILS              ← 多邮箱白名单
NEXT_PUBLIC_SITE_URL      ← SEO/OG 图/sitemap
R2_*                      ← 文件上传（否则回退 Supabase Storage）
RESEND_API_KEY            ← 邮件通知/订阅
NEXT_PUBLIC_GISCUS_*      ← 评论功能
NEXT_PUBLIC_TURNSTILE_*   ← 联系表单人机验证
SENTRY_*                  ← 错误监控
AUDIUS_API_BEARER_TOKEN   ← 在线音乐搜索
```

---

## 安全策略

- API Route 层统一用 `requireAdminSession(request)` 鉴权（`src/lib/auth-server.ts`）
- 安全响应头在 `next.config.ts` `headers()` 统一注入：X-Frame-Options / X-Content-Type-Options / Referrer-Policy / Permissions-Policy
- 测试端点（`/api/test-logs` 等）生产环境需 `x-admin-key` header
- Server Actions 的 `allowedOrigins` 动态读取 `NEXT_PUBLIC_SITE_URL`
- Rate limiting：`src/lib/rate-limit-auth.ts`（基于 rate-limiter-flexible）

---

## 最近的重要修复（供参考）

- **文章过滤**：`isRenderablePostRecord` 和 `isRenderablePublicPost` 移除了 `description.trim()` 检查，无摘要文章现在可正常显示
- **桌面写作页**：`/write` 左侧元数据栏移除 `hidden`，解决 Tailwind v4 下侧边栏不可见的问题
- **相册 Lightbox**：重构为全屏布局 + 加载 spinner + 导航箭头移出图片区域
- **Giscus 评论**：未配置时显示详细的配置步骤说明
