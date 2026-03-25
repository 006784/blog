import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdminSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

const DATA = [
  // ── 笔记工具 ─────────────────────────────────────────────
  { category: 'notes', name: 'Obsidian',        description: 'Markdown 双向链接本地笔记，知识图谱可视化',       icon_url: 'https://obsidian.md/favicon.ico',                   link: 'https://obsidian.md',              sort_order: 1 },
  { category: 'notes', name: 'Notion',           description: '文档 + 数据库 + 项目管理一体，团队协作首选',     icon_url: 'https://www.notion.so/favicon.ico',                  link: 'https://www.notion.so',            sort_order: 2 },
  { category: 'notes', name: 'Logseq',           description: '开源大纲式双链笔记，本地存储不怕跑路',           icon_url: 'https://logseq.com/favicon.ico',                     link: 'https://logseq.com',               sort_order: 3 },
  { category: 'notes', name: 'Bear',             description: 'Mac/iOS 原生 Markdown 笔记，界面极简优雅',       icon_url: 'https://bear.app/static/images/favicon.ico',         link: 'https://bear.app',                 sort_order: 4 },
  { category: 'notes', name: 'Typora',           description: '所见即所得 Markdown 编辑器，写作体验第一',       icon_url: 'https://typora.io/img/favicon-32.png',               link: 'https://typora.io',                sort_order: 5 },
  { category: 'notes', name: 'Craft',            description: 'Apple 生态原生设计，卡片式文档体验',             icon_url: 'https://www.craft.do/favicon.ico',                   link: 'https://www.craft.do',             sort_order: 6 },
  { category: 'notes', name: 'Joplin',           description: '开源跨平台笔记，支持 Markdown + 端对端加密',     icon_url: 'https://joplinapp.org/favicon.ico',                  link: 'https://joplinapp.org',            sort_order: 7 },
  { category: 'notes', name: 'Standard Notes',   description: '极简加密笔记，注重隐私与安全',                   icon_url: 'https://standardnotes.com/favicon.ico',              link: 'https://standardnotes.com',        sort_order: 8 },
  { category: 'notes', name: 'Roam Research',    description: '双向链接笔记鼻祖，网状知识管理',                 icon_url: 'https://roamresearch.com/favicon.ico',               link: 'https://roamresearch.com',         sort_order: 9 },
  { category: 'notes', name: 'Notion Calendar',  description: 'Notion 出品日历，任务与笔记无缝联动',           icon_url: 'https://www.notion.so/favicon.ico',                  link: 'https://www.notion.so/product/calendar', sort_order: 10 },
  { category: 'notes', name: 'Apple Notes',      description: 'iCloud 同步，快速记录，系统内置免费',           icon_url: 'https://www.apple.com/favicon.ico',                  link: 'https://www.icloud.com/notes',     sort_order: 11 },
  { category: 'notes', name: 'Zettlr',           description: '面向学术写作的开源 Markdown 编辑器，支持文献引用', icon_url: 'https://www.zettlr.com/favicon.ico',               link: 'https://www.zettlr.com',           sort_order: 12 },

  // ── 开发工具 / IDE ────────────────────────────────────────
  // Python
  { category: 'dev-tools', name: 'PyCharm',          description: '【Python】JetBrains 出品专业 Python IDE，智能补全强大',  icon_url: 'https://www.jetbrains.com/pycharm/img/pycharm.svg',           link: 'https://www.jetbrains.com/pycharm/',       sort_order: 10 },
  { category: 'dev-tools', name: 'Jupyter Notebook',  description: '【Python/R/Julia】交互式数据分析，科研与 AI 必备',       icon_url: 'https://jupyter.org/favicon.ico',                             link: 'https://jupyter.org',                     sort_order: 11 },
  { category: 'dev-tools', name: 'Spyder',            description: '【Python】科学计算专用 IDE，内置变量浏览器',             icon_url: 'https://www.spyder-ide.org/favicon.ico',                     link: 'https://www.spyder-ide.org',              sort_order: 12 },
  // JavaScript / TypeScript
  { category: 'dev-tools', name: 'WebStorm',          description: '【JS/TS】最强前端 IDE，框架感知与重构无出其右',          icon_url: 'https://www.jetbrains.com/webstorm/img/webstorm.svg',         link: 'https://www.jetbrains.com/webstorm/',     sort_order: 20 },
  { category: 'dev-tools', name: 'Cursor',            description: '【全语言】AI 优先代码编辑器，基于 VS Code + GPT-4',      icon_url: 'https://cursor.sh/favicon.ico',                               link: 'https://cursor.sh',                       sort_order: 21 },
  // Java
  { category: 'dev-tools', name: 'IntelliJ IDEA',     description: '【Java/Kotlin/Scala】JetBrains 旗舰 IDE，Java 生态最强', icon_url: 'https://www.jetbrains.com/idea/img/idea.svg',                link: 'https://www.jetbrains.com/idea/',         sort_order: 30 },
  { category: 'dev-tools', name: 'Eclipse',           description: '【Java/C++】老牌开源 IDE，插件生态丰富',                 icon_url: 'https://www.eclipse.org/favicon.ico',                         link: 'https://www.eclipse.org',                 sort_order: 31 },
  // Kotlin / Android
  { category: 'dev-tools', name: 'Android Studio',    description: '【Kotlin/Dart】Android 与 Flutter 官方 IDE',            icon_url: 'https://developer.android.com/favicon.ico',                   link: 'https://developer.android.com/studio',    sort_order: 40 },
  // Swift
  { category: 'dev-tools', name: 'Xcode',             description: '【Swift/Objective-C】Apple 官方 IDE，iOS/macOS 开发唯一选择', icon_url: 'https://developer.apple.com/favicon.ico',               link: 'https://developer.apple.com/xcode/',      sort_order: 50 },
  // C / C++
  { category: 'dev-tools', name: 'CLion',             description: '【C/C++/Rust】JetBrains C/C++ 专属 IDE，CMake 深度集成', icon_url: 'https://www.jetbrains.com/clion/img/clion.svg',              link: 'https://www.jetbrains.com/clion/',         sort_order: 60 },
  { category: 'dev-tools', name: 'Code::Blocks',      description: '【C/C++】免费开源跨平台 C/C++ IDE',                     icon_url: 'https://www.codeblocks.org/favicon.ico',                      link: 'https://www.codeblocks.org',              sort_order: 61 },
  // PHP
  { category: 'dev-tools', name: 'PhpStorm',          description: '【PHP】JetBrains PHP 专业 IDE，Laravel / Symfony 神器',  icon_url: 'https://www.jetbrains.com/phpstorm/img/phpstorm.svg',         link: 'https://www.jetbrains.com/phpstorm/',     sort_order: 70 },
  { category: 'dev-tools', name: 'XAMPP',             description: '【PHP】一键安装 Apache + MySQL + PHP 本地开发环境',      icon_url: 'https://www.apachefriends.org/favicon.ico',                   link: 'https://www.apachefriends.org',           sort_order: 71 },
  // Ruby
  { category: 'dev-tools', name: 'RubyMine',          description: '【Ruby】JetBrains Ruby on Rails 专属 IDE',              icon_url: 'https://www.jetbrains.com/ruby/img/rubymine.svg',             link: 'https://www.jetbrains.com/ruby/',         sort_order: 80 },
  // Go
  { category: 'dev-tools', name: 'GoLand',            description: '【Go】JetBrains Go 专属 IDE，调试与模块管理一流',        icon_url: 'https://www.jetbrains.com/go/img/goland.svg',                link: 'https://www.jetbrains.com/go/',           sort_order: 90 },
  // Rust
  { category: 'dev-tools', name: 'RustRover',         description: '【Rust】JetBrains 全新 Rust 专属 IDE',                  icon_url: 'https://www.jetbrains.com/rust/img/rustrover.svg',            link: 'https://www.jetbrains.com/rust/',         sort_order: 100 },
  // R
  { category: 'dev-tools', name: 'RStudio',           description: '【R】R 语言官方 IDE，数据分析与可视化标配',              icon_url: 'https://posit.co/favicon.ico',                                link: 'https://posit.co/products/open-source/rstudio/', sort_order: 110 },
  // Julia
  { category: 'dev-tools', name: 'Juno (Atom)',        description: '【Julia】Julia 科学计算 IDE，内置 REPL 与绘图',          icon_url: 'https://julialang.org/favicon.ico',                           link: 'https://junolab.org',                     sort_order: 120 },
  // Lua
  { category: 'dev-tools', name: 'ZeroBrane Studio',  description: '【Lua】轻量 Lua IDE，支持调试与多运行时',               icon_url: 'https://studio.zerobrane.com/favicon.ico',                    link: 'https://studio.zerobrane.com',            sort_order: 130 },
  // Scala
  { category: 'dev-tools', name: 'Scala CLI',         description: '【Scala】命令行直接运行 / 编译 Scala，开发体验现代化',   icon_url: 'https://www.scala-lang.org/favicon.ico',                      link: 'https://scala-cli.virtuslab.org',         sort_order: 140 },
  // Elixir
  { category: 'dev-tools', name: 'ElixirLS',          description: '【Elixir】VS Code Elixir 语言服务，补全 + 调试',         icon_url: 'https://elixir-lang.org/favicon.ico',                         link: 'https://github.com/elixir-lsp/elixir-ls', sort_order: 150 },
  // Haskell
  { category: 'dev-tools', name: 'GHCi',              description: '【Haskell】GHC 交互式 REPL，学习与快速实验首选',         icon_url: 'https://www.haskell.org/favicon.ico',                         link: 'https://www.haskell.org/ghc/',            sort_order: 160 },
  // Zig
  { category: 'dev-tools', name: 'Zig Build System',  description: '【Zig】内置构建系统，零依赖交叉编译',                   icon_url: 'https://ziglang.org/favicon.ico',                             link: 'https://ziglang.org/learn/build-system/', sort_order: 170 },
  // 通用
  { category: 'dev-tools', name: 'Neovim',            description: '【全语言】高度可扩展的终端编辑器，LSP + Treesitter 赋能', icon_url: 'https://neovim.io/favicon.ico',                              link: 'https://neovim.io',                       sort_order: 180 },
  { category: 'dev-tools', name: 'DataGrip',          description: '【SQL/数据库】JetBrains 多数据库 IDE，补全与重构超强',   icon_url: 'https://www.jetbrains.com/datagrip/img/datagrip.svg',         link: 'https://www.jetbrains.com/datagrip/',     sort_order: 190 },
  { category: 'dev-tools', name: 'TablePlus',         description: '【SQL/数据库】Mac 原生数据库 GUI，颜值与性能兼顾',       icon_url: 'https://tableplus.com/resources/favicons/favicon-32x32.png',  link: 'https://tableplus.com',                   sort_order: 191 },
  { category: 'dev-tools', name: 'Insomnia',          description: '【API 测试】开源 REST / GraphQL / gRPC 客户端',         icon_url: 'https://insomnia.rest/favicon.ico',                           link: 'https://insomnia.rest',                   sort_order: 200 },
  { category: 'dev-tools', name: 'Postman',           description: '【API 测试】行业标准 API 调试平台，团队协作方便',        icon_url: 'https://www.postman.com/favicon.ico',                         link: 'https://www.postman.com',                 sort_order: 201 },
];

export async function POST(req: NextRequest) {
  const session = await requireAdminSession(req);
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('uses_items')
    .insert(DATA)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: `成功写入 ${data.length} 条数据` });
}
