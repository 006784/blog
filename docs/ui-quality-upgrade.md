# UI 质感升级方案

> 生成日期：2026-03-30
> 基于源码全量阅读：globals.css / tokens.css / page-client.tsx / page.client.tsx

---

## 诊断总结

设计系统的 **方向是对的**（日系杂志 + 暖色调 + 苹果动效），但有几个全局性问题正在系统性地拉低质感，下面从最重到最轻依次排列。

---

## 问题一：代码块没有语法高亮（最影响技术博客观感）

**现状：**
文章页用 `<pre><code>` 裸渲染，代码块是纯文本，没有颜色、没有行号、没有复制按钮。对技术博客来说，这一条单独就能让整体质感拉到及格线以下。

**修复方案：引入 Shiki（推荐，零客户端 JS）**

```bash
npm install shiki
```

在 `src/lib/shiki.ts` 创建服务端高亮函数：

```ts
import { createHighlighter } from 'shiki';

let highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null;

export async function getHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: ['typescript', 'javascript', 'tsx', 'jsx', 'css', 'bash', 'json', 'python', 'go', 'rust', 'sql'],
    });
  }
  return highlighter;
}
```

在 `page-client.tsx` 的 markdown code 渲染器里使用（需改为服务端渲染，或用 `rehype-shiki` 插件）：

```tsx
// 推荐方式：服务端 rehype 插件
import rehypeShiki from '@shikijs/rehype';

// ReactMarkdown 改为 unified pipeline：
// remark → rehype → rehypeShiki → html
```

**配套 CSS（`globals.css` 中添加）：**

```css
/* 代码块容器 */
.article-pre {
  position: relative;
  margin: 1.5em 0;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  overflow: hidden;
  font-size: 0.875em;
  line-height: 1.7;
}

/* Shiki 生成的 pre 去掉默认 padding */
.article-pre pre {
  margin: 0;
  padding: 1.25rem 1.5rem;
  overflow-x: auto;
}

/* 代码块顶部语言标签 */
.article-pre::before {
  content: attr(data-lang);
  display: block;
  padding: 0.4rem 1rem;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--ink-muted);
  background: var(--surface-raised);
  border-bottom: 1px solid var(--border-default);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* 行内代码 */
.article-inline-code {
  padding: 0.15em 0.45em;
  border-radius: var(--radius-sm);
  background: var(--surface-overlay);
  border: 1px solid var(--border-default);
  font-size: 0.88em;
  font-family: var(--font-mono);
  color: var(--color-primary-700);
}

.dark .article-inline-code {
  color: var(--color-primary-500);
}

/* 复制按钮 */
.code-copy-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  font-family: var(--font-inter);
  background: var(--surface-glass);
  border: 1px solid var(--border-default);
  color: var(--ink-muted);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}

.article-pre:hover .code-copy-btn {
  opacity: 1;
}
```

---

## 问题二：全局 `transition: 0.3s` 让交互感觉迟钝

**现状（`globals.css` 第 173-178 行）：**

```css
*, *::before, *::after {
  transition-property: background-color, border-color, color, fill, stroke, box-shadow;
  transition-duration: 0.3s;  /* ← 这是问题根源 */
}
```

这条规则让**所有元素**（包括按钮、链接、输入框）的状态切换都有 0.3s 延迟。用户点击按钮，要等 0.3s 才看到视觉反馈，这是一种很明显的"迟钝感"。

**修复：**

```css
/* ❌ 删除这段 */
*, *::before, *::after {
  transition-property: background-color, border-color, color, fill, stroke, box-shadow;
  transition-duration: 0.3s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* ✅ 改为只在主题切换时做全局过渡，用 data 属性控制 */
[data-theme-switching] *,
[data-theme-switching] *::before,
[data-theme-switching] *::after {
  transition-property: background-color, border-color, color;
  transition-duration: 0.2s;
  transition-timing-function: ease;
}
```

在 ThemeProvider 中，切换主题时临时添加 `data-theme-switching` 属性，150ms 后移除。

---

## 问题三：`body { line-height: 2 }` 让组件内文字间距过大

**现状（`globals.css` 第 209 行）：**

```css
body {
  line-height: 2;  /* ← 对全局来说太大了 */
}
```

`line-height: 2` 适合文章正文阅读，但作为全局默认值，会让按钮、badge、nav 链接、卡片标题等所有 UI 组件的文字间距变大，产生"松垮感"。

**修复：**

```css
body {
  line-height: 1.6;  /* UI 组件的合理默认值 */
}

/* 文章正文单独设置 */
.article-body {
  line-height: 1.9;  /* 中文阅读适合更大行高 */
}
```

---

## 问题四：中文标题 `letter-spacing: 0.04em` 导致字间距过大

**现状（`globals.css` 第 358-361 行）：**

```css
h1, h2, h3, h4, h5, h6 {
  letter-spacing: 0.04em;  /* ← 对中文不合适 */
}
```

中文字符本身就有足够的间距，`0.04em` 的 letter-spacing 会让标题显得松散、不精练。英文标题反而需要负间距（如 `-0.025em`）来显得紧凑有力。

**修复：**

```css
h1, h2, h3, h4, h5, h6 {
  letter-spacing: 0.01em;  /* 中文字符的轻微间距就够了 */
}

h1 {
  letter-spacing: -0.01em;  /* 大号标题稍微收紧 */
}
```

---

## 问题五：文章正文缺少专业 prose 排版样式

**现状：**
文章页的 `<Card className="article-content">` 里直接渲染 Markdown，但没有系统性的文章排版 CSS（`article-content` 类内部的 `p`、`ul`、`ol`、`blockquote`、`table`、`hr` 等元素样式不完整）。

**修复：在 `globals.css` 补充完整的 article-content prose 样式：**

```css
/* ── 文章正文排版 ───────────────────────────────────────── */
.article-content {
  color: var(--ink);
  font-size: 1.0625rem;     /* 略大于 base，利于阅读 */
  line-height: 1.9;
  font-family: var(--font-jp-serif);
}

.article-content > * + * {
  margin-top: 1.25em;
}

/* 标题 */
.article-h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-top: 2.5em;
  margin-bottom: 0.75em;
  padding-bottom: 0.4em;
  border-bottom: 1px solid var(--border-default);
}

.article-h2 {
  font-size: 1.375rem;
  font-weight: 600;
  margin-top: 2.25em;
  margin-bottom: 0.6em;
  padding-left: 0.75em;
  border-left: 3px solid var(--gold);
}

.article-h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 1.75em;
  margin-bottom: 0.5em;
  color: var(--ink-secondary);
}

.article-h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-top: 1.5em;
  color: var(--ink-secondary);
}

/* 段落 */
.article-content p {
  margin-top: 0;
  margin-bottom: 1.25em;
}

/* 列表 */
.article-content ul,
.article-content ol {
  padding-left: 1.5em;
  margin-bottom: 1.25em;
}

.article-content li {
  margin-bottom: 0.4em;
  line-height: 1.75;
}

.article-content li > ul,
.article-content li > ol {
  margin-top: 0.4em;
  margin-bottom: 0;
}

/* 引用块 */
.article-content blockquote {
  margin: 1.5em 0;
  padding: 1rem 1.25rem;
  border-left: 3px solid var(--gold);
  background: var(--surface-raised);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  color: var(--ink-secondary);
  font-style: italic;
}

/* 分割线 */
.article-content hr {
  border: none;
  border-top: 1px solid var(--border-default);
  margin: 2.5em 0;
}

/* 链接 */
.article-content a {
  color: var(--color-primary-700);
  text-decoration: underline;
  text-decoration-color: var(--gold-light);
  text-underline-offset: 3px;
  transition: color 0.15s, text-decoration-color 0.15s;
}

.article-content a:hover {
  color: var(--color-primary-600);
  text-decoration-color: var(--gold);
}

.dark .article-content a {
  color: var(--color-primary-500);
}

/* 图片 */
.article-image {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
}

/* 表格 */
.article-content table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  margin: 1.5em 0;
}

.article-content th {
  padding: 0.6em 0.9em;
  background: var(--surface-overlay);
  font-weight: 600;
  text-align: left;
  border-bottom: 2px solid var(--border-strong);
}

.article-content td {
  padding: 0.55em 0.9em;
  border-bottom: 1px solid var(--border-default);
}

.article-content tr:last-child td {
  border-bottom: none;
}

.article-content tr:hover td {
  background: var(--surface-raised);
}
```

---

## 问题六：深色模式 `metallic-shimmer` 使用了不搭调的紫色

**现状（`globals.css` 约 511-520 行）：**

```css
.dark .metallic-shimmer {
  background: linear-gradient(
    ... #a855f7 45%, #06b6d4 50%, #a855f7 55%, ...  /* ← 紫色、青色，完全破坏暖色系 */
  );
}
```

整个设计系统是暖棕 + 金色调，深色模式突然出现紫色/青色流光效果，视觉上非常突兀。

**修复：**

```css
.dark .metallic-shimmer {
  background: linear-gradient(
    120deg,
    var(--color-neutral-200) 0%,
    var(--color-neutral-200) 38%,
    var(--color-primary-500) 48%,   /* 暖金色高光 */
    var(--color-primary-200) 50%,
    var(--color-primary-500) 52%,
    var(--color-neutral-200) 62%,
    var(--color-neutral-200) 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: metallic-flow 3s ease-in-out infinite;
}
```

---

## 问题七：三套设计 token 体系混用，组件内不一致

**现状：** 同一个组件里，同时出现：
- `var(--gold)` / `var(--ink)` / `var(--paper)` — 日系语义变量
- `var(--background)` / `var(--foreground)` / `var(--primary)` — shadcn 风格变量
- `var(--color-primary-500)` — 原始色板变量
- `text-muted-foreground` — Tailwind 工具类（映射到上面某个变量）

三套体系并存导致：同样"次要文字颜色"的概念，有时用 `--ink-muted`，有时用 `text-muted-foreground`，有时直接写 `color: var(--color-neutral-500)`，渲染结果可能一致，但在 dark mode 下可能因为变量链路不同而表现不一致。

**修复策略（渐进式，不需要大重构）：**

1. 明确规定：**组件内部统一用语义变量**（`--ink`、`--paper` 系），Tailwind 类只用于布局（`flex`、`gap-4`、`rounded-xl`），不用颜色工具类（`text-muted-foreground`）
2. 在 `globals.css` 补充映射，确保 Tailwind 颜色类和语义变量指向同一个值
3. 新写的组件遵循此规范，存量组件视情况逐步迁移

---

## 问题八：缺少 `prefers-reduced-motion` 支持

所有 Framer Motion 动画和 CSS transition 都没有 `@media (prefers-reduced-motion: reduce)` 的兜底。

**修复（`globals.css` 添加）：**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Framer Motion 组件：使用 `useReducedMotion()` hook 禁用动画变体。

---

## 问题九：文章页移动端体验有细节问题

1. **文章标题区 `px-6 py-10`** — 移动端左右内边距 24px，内容区宽度利用率低，尤其是长文标题会换行很多次
2. **代码块横向溢出** — `overflow-x: auto` 需要在父容器也设置 `max-width: 100%`，否则移动端会撑宽整个页面
3. **目录（TableOfContents）在移动端不可见**（只在 `xl:grid-cols-[1fr_280px]` 才显示侧边栏），但没有折叠成底部抽屉或浮动按钮的方案

**修复建议：**
- 文章页移动端改为 `px-4 py-8`
- `pre` 添加 `max-width: calc(100vw - 2rem)` 防止溢出
- 目录改为移动端浮动 fab 按钮，点击展开抽屉

---

## 问题十：卡片 `hover:-translate-y-1` 在慢速滚动页面上太明显

**现状：** 所有卡片统一用 `hover:-translate-y-1`（4px 上移），配合之前的全局 `transition: 0.3s`，在慢速滚动时所有卡片会集体抖动。

**修复：** 解决了问题二（全局 transition）后，这个效果会自然好转。另外 4px 可以调整为 2-3px，上移量更轻微，更精致。

---

## 执行优先级

| 优先级 | 问题 | 改动量 | 质感提升 |
|--------|------|--------|---------|
| ⭐⭐⭐ 最高 | 代码语法高亮 | 中（引入 shiki） | 极大 |
| ⭐⭐⭐ 最高 | 删除全局 `transition: 0.3s` | 小（改 3 行 CSS） | 大 |
| ⭐⭐⭐ 最高 | `body line-height: 2 → 1.6` | 小（改 1 行） | 大 |
| ⭐⭐ 高 | 文章 prose 排版样式补全 | 中（约 100 行 CSS） | 大 |
| ⭐⭐ 高 | 中文标题 letter-spacing 修正 | 小（改 2 行） | 中 |
| ⭐⭐ 高 | 深色模式 metallic-shimmer 修色 | 小（改 6 行） | 中 |
| ⭐ 中 | prefers-reduced-motion | 小 | 中（可访问性） |
| ⭐ 中 | 移动端文章页体验 | 小~中 | 中 |
| ⭐ 低 | 三套 token 统一（渐进式） | 大 | 中 |

**建议第一步：先改问题二 + 三 + 五，共约 150 行 CSS，30 分钟内可完成，立竿见影。**
